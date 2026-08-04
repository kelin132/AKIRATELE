/**
 * Auto-spawns a wild Pokémon in enabled groups every 15 minutes.
 * Toggle with .pokespawn on/off (admin command in groups).
 */

import { fetchRandomPokemon, setSpawn, hasSpawn } from "../../lib/pokeSpawner.mjs";
import { getActiveBot } from "../../lib/activeSocket.mjs";
import { tryGetDb } from "../../lib/mongo.mjs";
import { log } from "../../lib/logger.mjs";

const INTERVAL_MS = 15 * 60 * 1000;
let _timer = null;

export function startPokeSpawner() {
  if (_timer) return;
  _timer = setInterval(spawnCycle, INTERVAL_MS);
  log("info", "[pokeSpawner] Started — Pokémon will appear every 15 min in enabled groups.");
}

export function stopPokeSpawner() {
  if (_timer) { clearInterval(_timer); _timer = null; }
}

async function spawnCycle() {
  const bot = getActiveBot();
  if (!bot) return;

  const db = await tryGetDb();
  if (!db) return;

  try {
    const groups = await db.collection("group_settings")
      .find({ pokeSpawn: true })
      .toArray();

    for (const group of groups) {
      if (hasSpawn(group.chatId)) continue; // already has one
      try {
        await spawnPokemonInChat(bot, group.chatId);
      } catch (err) {
        log("warn", `[pokeSpawner] Failed to spawn in ${group.chatId}: ${err.message}`);
      }
    }
  } catch (err) {
    log("warn", "[pokeSpawner] Spawn cycle error:", err.message);
  }
}

export async function spawnPokemonInChat(bot, chatId) {
  const poke  = await fetchRandomPokemon();
  const level = Math.floor(Math.random() * 50) + 1;
  const hp    = Math.round(poke.baseHp * (1 + level * 0.05));

  setSpawn(chatId, { pokemon: poke, level, hp, maxHp: hp });

  const typeStr = poke.types.join(" / ");
  const caption = [
    `🌿 *A wild Pokémon appeared!*`,
    ``,
    `🔴 **${poke.name}**`,
    `⚡ Type: ${typeStr}`,
    `📊 Level: ${level}`,
    `❤️ HP: ${hp}`,
    ``,
    `Use \`.catch ${poke.name}\` to catch it! *(10 min window)*`,
  ].join("\n");

  const msg = poke.sprite
    ? await bot.telegram.sendPhoto(chatId, poke.sprite, {
        caption,
        parse_mode: "Markdown",
      })
    : await bot.telegram.sendMessage(chatId, caption, { parse_mode: "Markdown" });

  // Attach message id so .catch can reference it
  const spawn = { pokemon: poke, level, hp, maxHp: hp, messageId: msg.message_id };
  setSpawn(chatId, spawn);
}

export default {
  name: "pokespawn",
  aliases: ["pspawn"],
  description: "Toggle Pokémon auto-spawn in this group, or manually spawn one",
  category: "pokemon",
  usage: ".pokespawn [on|off|now]",
  cooldown: 5,
  isAdmin: true,
  groupOnly: true,
  async run({ ctx, args }) {
    const { setGroupSetting, getGroupSettings } = await import("../../lib/groupSettings.js");
    const chatId   = String(ctx.chat.id);
    const sub      = (args[0] ?? "").toLowerCase();

    if (sub === "now") {
      const bot = getActiveBot();
      if (!bot) return ctx.reply("❌ Bot instance unavailable.");
      await ctx.reply("🌿 Spawning a wild Pokémon...");
      await spawnPokemonInChat(bot, chatId);
      return;
    }

    if (!sub || sub === "status") {
      const s = await getGroupSettings(chatId);
      return ctx.reply(
        `🎮 Pokémon auto-spawn is *${s.pokeSpawn ? "ON ✅" : "OFF ❌"}*.\n\nUse \`.pokespawn on/off\` to toggle, or \`.pokespawn now\` to force one immediately.`,
        { parse_mode: "Markdown" },
      );
    }

    if (!["on", "off"].includes(sub))
      return ctx.reply("Usage: `.pokespawn on` | `.pokespawn off` | `.pokespawn now`", { parse_mode: "Markdown" });

    await setGroupSetting(chatId, "pokeSpawn", sub === "on");
    await ctx.reply(`✅ Pokémon auto-spawn turned *${sub.toUpperCase()}*.`, { parse_mode: "Markdown" });
  },
};
