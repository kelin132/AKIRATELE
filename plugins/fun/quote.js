import { requestJson } from "../../lib/http.mjs";

export default {
  name: "quote",
  aliases: ["q", "inspire"],
  description: "Get an inspirational quote",
  category: "fun",
  usage: ".quote",
  cooldown: 5,
  isOwner: false,
  async run({ ctx }) {
    try {
      const data = await requestJson("https://api.quotable.io/random");
      await ctx.reply(`💭 *"${data.content}"*\n\n— _${data.author}_`, { parse_mode: "Markdown" });
    } catch {
      await ctx.reply("💭 *\"The only way to do great work is to love what you do.\"*\n\n— _Steve Jobs_", { parse_mode: "Markdown" });
    }
  },
};
