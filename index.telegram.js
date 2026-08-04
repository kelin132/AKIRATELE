/**
 * KELIN MD — Telegram Bot
 * Pure Telegram entry point — no WhatsApp / Baileys code.
 *
 * Setup:
 *   1. Add TELEGRAM_BOT_TOKEN to your .env / panel environment variables.
 *      Get it from @BotFather on Telegram → /newbot
 *   2. Add OWNER_NUMBER = your numeric Telegram user id (from @userinfobot).
 *   3. (Optional) Add MONGO_URI for economy, guild, and group-settings persistence.
 *   4. npm install
 *   5. node index.telegram.js   OR   npm start
 *
 * On katabump / Pterodactyl:
 *   Set Start Command to:  node index.telegram.js
 *   Paste env vars into the "Startup → Environment Variables" tab.
 */

import "dotenv/config";
import { createRequire } from "module";
import { log } from "./lib/logger.mjs";
import { connectDb } from "./lib/mongo.mjs";
import { initGroupSettings } from "./lib/groupSettings.js";
import { loadPlugins } from "./lib/pluginManager.mjs";
import { connectTelegramBot } from "./lib/telegramBot.mjs";
import { startCardSpawner } from "./lib/cardSpawner.mjs";
import { startTaxScheduler } from "./lib/taxScheduler.mjs";
import { startPokeSpawner } from "./plugins/pokemon/pokeautospawn.js";
import { getRuntimeSettings } from "./lib/runtimeSettings.mjs";

const _require   = createRequire(import.meta.url);
const _settings  = _require("./settings.cjs");

const RUNTIME    = getRuntimeSettings();
const BOT_NAME   = RUNTIME.botName   || process.env.BOT_NAME   || _settings.botName   || "KELIN MD";
const PREFIX     = RUNTIME.prefix    || process.env.PREFIX     || _settings.prefix    || ".";
const BOT_VER    = "2.0.0";

// ── Banner ────────────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(52));
console.log(`  ${BOT_NAME} v${BOT_VER} — Telegram Edition`);
console.log("═".repeat(52));
console.log(`  Prefix   : ${PREFIX}`);
console.log(`  Token    : ${process.env.TELEGRAM_BOT_TOKEN ? "✅ set" : "⚠  NOT SET — add TELEGRAM_BOT_TOKEN"}`);
console.log(`  Owner ID : ${RUNTIME.ownerNumber || process.env.OWNER_NUMBER || "⚠  NOT SET — add OWNER_NUMBER"}`);
console.log(`  Mongo    : ${process.env.MONGO_URI ? "✅ set" : "⚠  not set (economy/groups disabled)"}`);
console.log("═".repeat(52) + "\n");

if (!process.env.TELEGRAM_BOT_TOKEN) {
  log("error", "No TELEGRAM_BOT_TOKEN — get one from @BotFather and add it to your environment.");
  process.exit(1);
}

// ── MongoDB ───────────────────────────────────────────────────────────────────
try {
  await connectDb();
  await initGroupSettings();
} catch (err) {
  log("warn", "MongoDB unavailable — economy/guild/group-settings features disabled.");
  log("warn", String(err.message));
}

// ── Plugins ───────────────────────────────────────────────────────────────────
const { totalPlugins, totalCommands } = await loadPlugins(PREFIX);
log("info", `Loaded ${totalPlugins} plugins (${totalCommands} total triggers)`);

// ── Bot ───────────────────────────────────────────────────────────────────────
await connectTelegramBot(PREFIX);

// ── Background jobs ───────────────────────────────────────────────────────────
try { startCardSpawner();  } catch (e) { log("warn", "Card spawner failed to start: " + e.message); }
try { startTaxScheduler(); } catch (e) { log("warn", "Tax scheduler failed to start: " + e.message); }
try { startPokeSpawner();  } catch (e) { log("warn", "Pokémon spawner failed to start: " + e.message); }

log("info", `${BOT_NAME} is running. Send ${PREFIX}menu to see all commands.`);
