/**
 * .poketeam — view your caught Pokémon.
 */
import { getPokeUser } from "../../lib/pokemonDb.mjs";

export default {
  name: "poketeam",
  aliases: ["pokedex", "mycatch", "team", "pokeprofile"],
  description: "View your caught Pokémon and battle stats",
  category: "pokemon",
  usage: ".poketeam [page]",
  cooldown: 5,
  async run({ ctx, args }) {
    const userId   = String(ctx.from.id);
    const userName = ctx.from.first_name ?? ctx.from.username ?? "Trainer";
    const user     = await getPokeUser(userId);

    const PAGE_SIZE = 10;
    const page      = Math.max(1, parseInt(args[0]) || 1);
    const total     = user.caught.length;

    if (!total) {
      return ctx.reply(
        `🎮 *${userName}'s Pokédex is empty!*\n\nWait for a Pokémon to appear in a group and use \`.catch <name>\` to catch one!`,
        { parse_mode: "Markdown" },
      );
    }

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const slice = user.caught.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const lines = slice.map((p, i) => {
      const n = (page - 1) * PAGE_SIZE + i + 1;
      return `${n}. *${p.name}* — Lv.${p.level} | ${p.types.join("/")} | HP:${p.baseHp}`;
    });

    const text = [
      `🎮 *${userName}'s Pokémon Team*`,
      `Caught: ${total} | Wins: ${user.wins} | Losses: ${user.losses}`,
      ``,
      ...lines,
      ``,
      `_Page ${page}/${totalPages}${totalPages > 1 ? ` — use \`.poketeam ${page + 1}\` for next` : ""}_`,
    ].join("\n");

    await ctx.reply(text, { parse_mode: "Markdown" });
  },
};
