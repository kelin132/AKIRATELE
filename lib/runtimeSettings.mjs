/**
 * KELIN MD — Runtime Bot Settings
 * Reads/writes bot settings at runtime (prefix, name, image, etc.)
 * Persists in data/botSettings.json so panel hosts don't need .env writes.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { createRequire } from "module";

const _require = createRequire(import.meta.url);
const _static  = _require("../settings.cjs");

const DATA_DIR     = path.resolve("data");
const SETTINGS_FILE = path.join(DATA_DIR, "botSettings.json");
const ENV_FILE      = path.resolve(".env");

const DEFAULT_BOT_IMAGE =
  "https://cdn.phototourl.com/free/2026-07-26-ef31287b-f8c8-4bec-943a-cf435a79d5ad.jpg";

const ENV_KEYS = {
  ownerNumber: "OWNER_NUMBER",
  botName:     "BOT_NAME",
  botImage:    "BOT_IMAGE",
  prefix:      "PREFIX",
  layout:      "BOT_LAYOUT",
};

function readSnapshot() {
  if (!existsSync(SETTINGS_FILE)) return {};
  try {
    const v = JSON.parse(readFileSync(SETTINGS_FILE, "utf8"));
    return v && typeof v === "object" ? v : {};
  } catch { return {}; }
}

function digits(v) { return String(v || "").replace(/\D/g, ""); }

function base() {
  const saved = readSnapshot();
  return {
    ownerNumber: digits(saved.ownerNumber || process.env.OWNER_NUMBER || _static.ownerNumber),
    botName:     String(saved.botName || process.env.BOT_NAME || _static.botName || "KELIN MD"),
    botImage:    String(saved.botImage || process.env.BOT_IMAGE || DEFAULT_BOT_IMAGE),
    prefix:      String(saved.prefix   || process.env.PREFIX   || "."),
    layout:      Number(saved.layout   || process.env.BOT_LAYOUT || 1),
  };
}

export function getRuntimeSettings() {
  const s = base();
  if (![1, 2, 3, 4].includes(s.layout)) s.layout = 1;
  return s;
}

function writeEnvValue(key, value) {
  const line    = `${key}=${JSON.stringify(String(value))}`;
  let   content = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8") : "";
  const pat     = new RegExp(`^${key}=.*$`, "m");
  content = pat.test(content) ? content.replace(pat, line) : `${content.trimEnd()}\n${line}\n`;
  writeFileSync(ENV_FILE, content, "utf8");
}

export function updateRuntimeSetting(setting, value) {
  const envKey = ENV_KEYS[setting];
  if (!envKey) throw new Error(`Unsupported setting: ${setting}`);

  const cur  = getRuntimeSettings();
  const next = { ...cur, [setting]: value };

  if (setting === "ownerNumber") { next.ownerNumber = digits(value); if (next.ownerNumber.length < 7) throw new Error("Owner number must include a country code and at least 7 digits."); }
  if (setting === "botName")     { next.botName = String(value).trim().slice(0, 60); if (!next.botName) throw new Error("Bot name cannot be empty."); }
  if (setting === "botImage")    { next.botImage = String(value).trim(); if (!/^https?:\/\/\S+$/i.test(next.botImage)) throw new Error("Bot image must be a valid http(s) URL."); }
  if (setting === "prefix")      { next.prefix = String(value).trim().slice(0, 4); if (!next.prefix || /\s/.test(next.prefix)) throw new Error("Prefix must be 1–4 non-space characters."); }
  if (setting === "layout")      { next.layout = Number(value); if (![1, 2, 3, 4].includes(next.layout)) throw new Error("Layout must be 1, 2, 3, or 4."); }

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2), "utf8");
  writeEnvValue(envKey, next[setting]);
  process.env[envKey] = String(next[setting]);
  return next;
}

export const DEFAULT_MENU_IMAGE = DEFAULT_BOT_IMAGE;
