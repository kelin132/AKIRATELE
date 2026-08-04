/**
 * KELIN MD — Permission System (Telegram Edition)
 * On Telegram, the "sender" is a numeric user id (string), not a JID.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { getRuntimeSettings } from "./runtimeSettings.mjs";
import { createRequire } from "module";

const _require  = createRequire(import.meta.url);
const _settings = _require("../settings.cjs");

const MODS_FILE = path.resolve("data", "mods.json");

// ── Mods file helpers ─────────────────────────────────────────────────────────

export function getModsData() {
  try {
    if (existsSync(MODS_FILE)) {
      const parsed = JSON.parse(readFileSync(MODS_FILE, "utf8"));
      const list = Array.isArray(parsed.list) ? parsed.list : [];
      return list.map(e => (typeof e === "string" ? { num: e, name: e } : e));
    }
  } catch { /* ignore */ }
  return [];
}

export function getMods() { return getModsData().map(e => e.num); }

export function saveModsData(data) {
  try {
    const dir = path.dirname(MODS_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(MODS_FILE, JSON.stringify({ list: data }, null, 2));
  } catch (err) { console.error("[permissions] Failed to save mods:", err.message); }
}

export function saveMods(list) {
  saveModsData(list.map(n => (typeof n === "string" ? { num: n, name: n } : n)));
}

// ── Main export ───────────────────────────────────────────────────────────────

function getOwnerDigits() {
  const fromRuntime  = (getRuntimeSettings().ownerNumber || "").replace(/\D/g, "");
  const fromEnv      = (process.env.OWNER_NUMBER || "").replace(/\D/g, "");
  const fromSettings = (_settings.ownerNumber || "").replace(/\D/g, "");
  return fromRuntime || fromEnv || fromSettings;
}

export async function getPermissions(senderId = "", _ownerParam = "", { fromMe = false } = {}) {
  if (fromMe) return _ownerPerms();

  const ownerDigits = getOwnerDigits();
  const senderStr   = String(senderId).replace(/\D/g, "");

  if (ownerDigits && senderStr === ownerDigits) return _ownerPerms();

  const mods        = getMods();
  const isModByFile = mods.includes(senderStr);

  try {
    const { getDb } = await import("./mongo.mjs");
    const db   = await getDb();
    const user = await db.collection("users").findOne(
      { _id: senderId },
      { projection: { staffLevel: 1, isPremium: 1, jailed: 1, jailUntil: 1, staffImmunity: 1, banned: 1 } },
    );

    const staffLevel = Math.max(user?.staffLevel ?? 0, isModByFile ? 1 : 0);

    let isJailed = !!(user?.jailed);
    if (isJailed && user?.jailUntil && user.jailUntil <= Date.now()) {
      isJailed = false;
      db.collection("users")
        .updateOne({ _id: senderId }, { $set: { jailed: false, jailUntil: null } })
        .catch(() => {});
    }

    return {
      isOwner:       false,
      isStaff:       staffLevel >= 2,
      isMod:         staffLevel >= 1 || isModByFile,
      isPremium:     !!(user?.isPremium) || staffLevel >= 1 || isModByFile,
      isJailed,
      isBanned:      !!(user?.banned),
      staffImmunity: !!(user?.staffImmunity) || staffLevel >= 2,
      staffLevel,
    };
  } catch {
    return {
      isOwner:       false,
      isStaff:       false,
      isMod:         isModByFile,
      isPremium:     isModByFile,
      isJailed:      false,
      isBanned:      false,
      staffImmunity: false,
      staffLevel:    isModByFile ? 1 : 0,
    };
  }
}

function _ownerPerms() {
  return {
    isOwner: true, isStaff: true, isMod: true, isPremium: true,
    isJailed: false, staffImmunity: true, staffLevel: 99, isBanned: false,
  };
}

export async function isOwnerCheck(id) {
  const p = await getPermissions(id);
  return p.isOwner;
}

export async function isMod(id) {
  const p = await getPermissions(id);
  return p.isMod;
}
