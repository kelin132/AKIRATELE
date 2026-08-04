/**
 * .pokerelease <number> — release a Pokémon from your team by its list number.
 */
import { getPokeUser } from "../../lib/pokemonDb.mjs";
import { tryGetDb } from "../../lib/mongo.mjs";

export default {
  name: "pokerelease",
  aliases: ["release"],
  description: "Release a Pokémon from your team (by list number from .poketeam)",
  category: "pokemon",
  usage: ".pokerelease <number>",
  cooldown: 5,
  async run({ ctx, args }) {
    const n = parseInt(args[0]);
    if (!n || isNaN(n) || n < 1) {
      return ctx.reply("Usage: `.pokerelease <number>` — use `.poketeam` to see numbers.", { parse_mode: "Markdown" });
    }

    const userId = String(ctx.from.id);
    const user   = await getPokeUser(userId);

    if (!user.caught.length) return ctx.reply("❌ You have no Pokémon to release.");

    const idx = n - 1;
    if (idx >= user.caught.length) {
      return ctx.reply(`❌ Invalid number. You have ${user.caught.length} Pokémon.`);
    }

    const poke = user.caught[idx];
    user.caught.splice(idx, 1);

    const db = await tryGetDb();
    if (db) {
      await db.collection("mn_pokemon").updateOne(
        { _id: userId },
        { $set: { caught: user.caught } },
      );
    }

    await ctx.reply(
      `👋 *${poke.name}* (Lv.${poke.level}) has been released back into the wild. Goodbye!`,
      { parse_mode: "Markdown" },
    );
  },
};
