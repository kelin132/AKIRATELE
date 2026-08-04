/**
 * .catch <pokemon name> — attempt to catch the active wild spawn in this chat.
 */

import { getSpawn, clearSpawn, spawnExpired } from "../../lib/pokeSpawner.mjs";
import { addCaughtPokemon, getPokeUser } from "../../lib/pokemonDb.mjs";

const BASE_CATCH_RATE = 0.45; // 45% base + level bonus

export default {
  name: "catch",
  aliases: ["pokecatch", "pc"],
  description: "Catch the wild Pokémon that appeared in this chat",
  category: "pokemon",
  usage: ".catch <pokémon name>",
  cooldown: 3,
  async run({ ctx, args }) {
    const chatId = String(ctx.chat.id);

    if (!args.length) {
      return ctx.reply("Usage: `.catch <pokémon name>`\n\nWait for a wild Pokémon to appear, then catch it!", { parse_mode: "Markdown" });
    }

    const spawn = getSpawn(chatId);

    if (!spawn) {
      return ctx.reply("🎮 No wild Pokémon here right now.\n\nAsk an admin to use `.pokespawn now` or wait for the next auto-spawn.");
    }

    if (spawnExpired(chatId)) {
      clearSpawn(chatId);
      return ctx.reply("💨 The wild Pokémon fled! You were too slow. Wait for the next one.");
    }

    const guess  = args.join(" ").toLowerCase().trim();
    const target = spawn.pokemon.name.toLowerCase();

    if (guess !== target) {
      return ctx.reply(
        `❌ Wrong name! You guessed *${args.join(" ")}* but that's not what appeared.\n\n_Hint: look at the spawn message above._`,
        { parse_mode: "Markdown" },
      );
    }

    // Calculate catch chance (higher level = harder)
    const levelPenalty = spawn.level * 0.003;
    const catchChance  = Math.max(0.15, BASE_CATCH_RATE - levelPenalty);
    const caught       = Math.random() < catchChance;

    if (!caught) {
      return ctx.reply(
        `😤 *${spawn.pokemon.name}* broke free! Try again.\n_Catch rate: ${Math.round(catchChance * 100)}%_`,
        { parse_mode: "Markdown" },
      );
    }

    // Success — add to user's collection
    clearSpawn(chatId);

    const userId   = String(ctx.from.id);
    const userName = ctx.from.first_name ?? ctx.from.username ?? "Trainer";

    const caught_entry = {
      id:       spawn.pokemon.id,
      name:     spawn.pokemon.name,
      types:    spawn.pokemon.types,
      level:    spawn.level,
      baseHp:   spawn.pokemon.baseHp,
      baseAtk:  spawn.pokemon.baseAtk,
      moves:    spawn.pokemon.moves,
      caughtAt: Date.now(),
    };

    await addCaughtPokemon(userId, caught_entry);

    // Check if first catch
    const user   = await getPokeUser(userId);
    const isFirst = user.caught.length <= 1;

    const caption = spawn.pokemon.sprite
      ? undefined
      : null;

    const text = [
      `🎉 *${userName}* caught *${spawn.pokemon.name}*! ${isFirst ? "First catch! 🌟" : ""}`,
      ``,
      `⚡ Type: ${spawn.pokemon.types.join(" / ")}`,
      `📊 Level: ${spawn.level}`,
      `❤️  HP: ${spawn.maxHp}`,
      ``,
      `_Use \`.poketeam\` to see your collection._`,
    ].join("\n");

    if (spawn.pokemon.sprite) {
      await ctx.replyWithPhoto(spawn.pokemon.sprite, { caption: text, parse_mode: "Markdown" });
    } else {
      await ctx.reply(text, { parse_mode: "Markdown" });
    }
  },
};
