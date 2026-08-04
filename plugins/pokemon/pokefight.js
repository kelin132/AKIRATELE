/**
 * .pokefight — battle your strongest caught Pokémon against a random wild one.
 */
import { getPokeUser, recordBattleResult } from "../../lib/pokemonDb.mjs";
import { fetchRandomPokemon } from "../../lib/pokeSpawner.mjs";

export default {
  name: "pokefight",
  aliases: ["pokebattle", "pbattle", "pfight"],
  description: "Battle your best Pokémon against a wild one",
  category: "pokemon",
  usage: ".pokefight",
  cooldown: 15,
  async run({ ctx }) {
    const userId   = String(ctx.from.id);
    const userName = ctx.from.first_name ?? ctx.from.username ?? "Trainer";
    const user     = await getPokeUser(userId);

    if (!user.caught.length) {
      return ctx.reply(
        "❌ You have no Pokémon! Catch one first when a wild Pokémon appears in a group.",
      );
    }

    // Pick the user's strongest Pokémon (highest baseAtk)
    const mine = [...user.caught].sort((a, b) => (b.baseAtk ?? 0) - (a.baseAtk ?? 0))[0];

    const loading = await ctx.reply("⚔️ Finding a wild Pokémon to battle...");

    let wild;
    try {
      wild = await fetchRandomPokemon();
    } catch {
      await ctx.telegram.editMessageText(ctx.chat.id, loading.message_id, undefined, "❌ Could not reach PokéAPI. Try again.");
      return;
    }

    // Simple simulation: compare attack stats with some randomness
    const myPower   = (mine.baseAtk ?? 45) * mine.level * (0.8 + Math.random() * 0.4);
    const wildLevel = Math.floor(Math.random() * 50) + 1;
    const wildPower = wild.baseAtk * wildLevel * (0.8 + Math.random() * 0.4);

    const won = myPower > wildPower;
    await recordBattleResult(userId, won);

    await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id).catch(() => {});

    const rounds = simulateRounds(mine, wild, mine.level, wildLevel);

    const text = [
      `⚔️ *Pokémon Battle!*`,
      ``,
      `🔴 *${mine.name}* (Lv.${mine.level}) ← ${userName}'s fighter`,
      `🔵 *${wild.name}* (Lv.${wildLevel}) ← Wild`,
      ``,
      `*Battle log:*`,
      ...rounds,
      ``,
      won
        ? `🏆 *${mine.name}* wins! +1 victory added to your record.`
        : `💀 *${wild.name}* wins! Better luck next time.`,
      ``,
      `_Record — Wins: ${(user.wins ?? 0) + (won ? 1 : 0)} | Losses: ${(user.losses ?? 0) + (won ? 0 : 1)}_`,
    ].join("\n");

    if (wild.sprite) {
      await ctx.replyWithPhoto(wild.sprite, { caption: text, parse_mode: "Markdown" });
    } else {
      await ctx.reply(text, { parse_mode: "Markdown" });
    }
  },
};

function simulateRounds(mine, wild, myLvl, wildLvl) {
  let myHp   = mine.baseHp  + myLvl   * 3;
  let wildHp = wild.baseHp  + wildLvl * 3;
  const lines = [];
  let turn = 0;

  while (myHp > 0 && wildHp > 0 && turn < 6) {
    turn++;
    const myDmg   = Math.floor((mine.baseAtk ?? 45)  * (0.5 + Math.random() * 0.5) * (myLvl / 30));
    const wildDmg = Math.floor((wild.baseAtk)         * (0.5 + Math.random() * 0.5) * (wildLvl / 30));
    wildHp -= myDmg;
    myHp   -= wildDmg;
    lines.push(`Turn ${turn}: ${mine.name} hits ${wild.name} for ${myDmg} dmg, ${wild.name} hits back for ${wildDmg} dmg`);
  }
  return lines;
}
