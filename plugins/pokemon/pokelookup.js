/**
 * .pokelookup <name> — look up any Pokémon via PokéAPI.
 */
import { requestJson } from "../../lib/http.mjs";

export default {
  name: "pokelookup",
  aliases: ["pokemon", "poke", "pokeinfo"],
  description: "Look up stats for any Pokémon",
  category: "pokemon",
  usage: ".pokelookup <name or number>",
  cooldown: 5,
  async run({ ctx, args }) {
    if (!args.length) return ctx.reply("Usage: `.pokelookup <name or number>`", { parse_mode: "Markdown" });

    const query = args.join("-").toLowerCase();
    const loading = await ctx.reply("🔍 Looking up Pokémon...");

    try {
      const data = await requestJson(`https://pokeapi.co/api/v2/pokemon/${query}`, { timeoutMs: 10_000 });

      const name   = data.name.charAt(0).toUpperCase() + data.name.slice(1);
      const types  = data.types.map(t => cap(t.type.name)).join(" / ");
      const height = (data.height / 10).toFixed(1);
      const weight = (data.weight / 10).toFixed(1);
      const sprite = data.sprites?.other?.["official-artwork"]?.front_default ?? data.sprites?.front_default;

      const stats = data.stats.map(s => {
        const sname = s.stat.name.replace("-", " ").toUpperCase().padEnd(10);
        const bar   = "█".repeat(Math.floor(s.base_stat / 10)) + "░".repeat(10 - Math.floor(s.base_stat / 10));
        return `${sname} ${bar} ${s.base_stat}`;
      }).join("\n");

      const abilities = data.abilities.map(a => cap(a.ability.name)).join(", ");

      const text = [
        `📖 *#${data.id} — ${name}*`,
        ``,
        `⚡ Type: ${types}`,
        `📏 Height: ${height}m | Weight: ${weight}kg`,
        `🌀 Abilities: ${abilities}`,
        ``,
        `*Base Stats:*`,
        `\`\`\``,
        stats,
        `\`\`\``,
      ].join("\n");

      await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id).catch(() => {});

      if (sprite) {
        await ctx.replyWithPhoto(sprite, { caption: text, parse_mode: "Markdown" });
      } else {
        await ctx.reply(text, { parse_mode: "Markdown" });
      }
    } catch (err) {
      await ctx.telegram.editMessageText(
        ctx.chat.id, loading.message_id, undefined,
        `❌ Pokémon "${args.join(" ")}" not found. Try a valid name or Pokédex number.`,
      );
    }
  },
};

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
