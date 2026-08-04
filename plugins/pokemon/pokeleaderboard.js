/**
 * .pokeleaderboard — top trainers by most Pokémon caught.
 */
import { tryGetDb } from "../../lib/mongo.mjs";

export default {
  name: "pokeleaderboard",
  aliases: ["pokelb", "plb"],
  description: "Top Pokémon trainers by catches",
  category: "pokemon",
  usage: ".pokeleaderboard",
  cooldown: 10,
  async run({ ctx }) {
    const db = await tryGetDb();
    if (!db) {
      return ctx.reply("❌ Leaderboard requires MongoDB. Add MONGO_URI to your environment.");
    }

    const top = await db.collection("mn_pokemon")
      .aggregate([
        { $project: { count: { $size: "$caught" }, wins: 1, losses: 1 } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    if (!top.length) return ctx.reply("🎮 No trainers yet! Catch some Pokémon first.");

    const medals = ["🥇", "🥈", "🥉"];
    const lines  = top.map((u, i) => {
      const badge = medals[i] ?? `${i + 1}.`;
      return `${badge} \`${u._id}\` — ${u.count} caught | W:${u.wins ?? 0} L:${u.losses ?? 0}`;
    });

    await ctx.reply(
      `🏆 *Pokémon Leaderboard*\n\n${lines.join("\n")}`,
      { parse_mode: "Markdown" },
    );
  },
};
