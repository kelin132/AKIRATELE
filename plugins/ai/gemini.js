import { askGemini } from "../../lib/gemini.mjs";

export default {
  name: "gemini",
  aliases: ["gpt", "ai"],
  description: "Ask Gemini AI a question",
  category: "ai",
  usage: ".gemini <question>",
  cooldown: 5,
  isOwner: false,
  isAdmin: false,
  isPremium: false,
  async run({ ctx, args }) {
    if (!args.length) {
      return ctx.reply("❓ Usage: `.gemini <your question>`", { parse_mode: "Markdown" });
    }
    const prompt  = args.join(" ");
    const loading = await ctx.reply("🤔 Thinking...");
    try {
      const reply = await askGemini(prompt);
      await ctx.telegram.editMessageText(ctx.chat.id, loading.message_id, undefined, reply);
    } catch (err) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        loading.message_id,
        undefined,
        `❌ ${err.message}`,
      );
    }
  },
};
