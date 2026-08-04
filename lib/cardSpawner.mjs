/**
 * KELIN MD — Card Auto-Spawner
 * Drops a card in economy-enabled groups every 15 minutes.
 * Requires MongoDB and RAPIDAPI_KEY for the card database.
 */

import { log } from "./logger.mjs";
import { tryGetDb } from "./mongo.mjs";
import { getActiveBot } from "./activeSocket.mjs";

const INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
let _timer = null;

export function startCardSpawner() {
  if (!process.env.RAPIDAPI_KEY) {
    log("info", "[cardSpawner] RAPIDAPI_KEY not set — card auto-spawn disabled.");
    return;
  }
  if (_timer) return;
  _timer = setInterval(spawnCards, INTERVAL_MS);
  log("info", "[cardSpawner] Started — cards will drop every 15 min in enabled groups.");
}

export function stopCardSpawner() {
  if (_timer) { clearInterval(_timer); _timer = null; }
}

async function spawnCards() {
  const bot = getActiveBot();
  if (!bot) return;

  const db = await tryGetDb();
  if (!db) return;

  try {
    const groups = await db.collection("group_settings")
      .find({ cardSpawn: true })
      .toArray();

    for (const group of groups) {
      try {
        await bot.telegram.sendMessage(
          group.chatId,
          "🃏 *A wild card has appeared\\!* Use `.collect` to grab it\\.",
          { parse_mode: "MarkdownV2" },
        );
      } catch (err) {
        log("warn", `[cardSpawner] Failed to send to ${group.chatId}: ${err.message}`);
      }
    }
  } catch (err) {
    log("warn", "[cardSpawner] Spawn cycle error:", err.message);
  }
}
