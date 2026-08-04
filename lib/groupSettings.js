/**
 * KELIN MD — Group Settings
 * Persists per-group toggles (antilink, welcome, etc.) in MongoDB.
 * Falls back to in-memory cache if Mongo is unavailable.
 */

import { tryGetDb } from "./mongo.mjs";
import { log } from "./logger.mjs";

const COLLECTION = "group_settings";

// In-memory fallback store: chatId → settings object
const _cache = new Map();

// Named export so plugins can do: import { groupSettings } from ".../groupSettings.js"
export const groupSettings = _cache;

const DEFAULTS = {
  antiLink: false,
  welcome: true,
  goodbye: true,
  antiSpam: true,
  muteAll: false,
};

export async function initGroupSettings() {
  const db = await tryGetDb();
  if (!db) {
    log("warn", "[groupSettings] No MongoDB — using in-memory storage only.");
    return;
  }
  // Ensure index exists for fast lookups
  try {
    await db.collection(COLLECTION).createIndex({ chatId: 1 }, { unique: true });
  } catch { /* already exists */ }
  log("info", "[groupSettings] Initialised.");
}

export async function getGroupSettings(chatId) {
  // Check cache first
  if (_cache.has(chatId)) return _cache.get(chatId);

  const db = await tryGetDb();
  if (db) {
    const doc = await db.collection(COLLECTION).findOne({ chatId });
    if (doc) {
      const settings = { ...DEFAULTS, ...doc };
      _cache.set(chatId, settings);
      return settings;
    }
  }
  const settings = { ...DEFAULTS, chatId };
  _cache.set(chatId, settings);
  return settings;
}

export async function setGroupSetting(chatId, key, value) {
  const current = await getGroupSettings(chatId);
  const updated  = { ...current, [key]: value, chatId };
  _cache.set(chatId, updated);

  const db = await tryGetDb();
  if (db) {
    await db.collection(COLLECTION).updateOne(
      { chatId },
      { $set: { [key]: value } },
      { upsert: true },
    );
  }
  return updated;
}
