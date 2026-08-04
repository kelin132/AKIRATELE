/**
 * Akira — conversational AI persona.
 * Maintains per-user chat history via the Gemini helper.
 */
import { askGemini, resetGeminiSession } from "../../lib/gemini.mjs";

const AKIRA_SYSTEM = `You are Akira, a sharp and witty AI assistant for a Telegram bot called KELIN MD. 
You are intelligent, slightly sarcastic, and helpful. You keep responses concise (under 300 words) 
unless the user explicitly asks for more detail. You do NOT pretend to be human — you're an AI and 
proud of it. You never use emojis excessively.`;

export default {
  name: "akira",
  aliases: ["chat", "ask"],
  description: "Chat with Akira AI (remembers context)",
  category: "ai",
  usage: ".akira <message>",
  cooldown: 4,
  isOwner: false,
  isAdmin: false,
  isPremium: false,
  async run({ ctx, args }) {
    if (!args.length) {
      return ctx.reply(
        `💬 Usage: \`.akira <message>\`\n\nAkira remembers your conversation. Use \`.akira reset\` to start fresh.`,
        { parse_mode: "Markdown" },
      );
    }

    if (args[0].toLowerCase() === "reset") {
      resetGeminiSession(String(ctx.from.id));
      return ctx.reply("🔄 Akira session reset. Starting fresh!");
    }

    const prompt  = args.join(" ");
    const loading = await ctx.reply("💭 Akira is thinking...");
    try {
      const reply = await askGemini(prompt, {
        systemPrompt: AKIRA_SYSTEM,
        uid:          String(ctx.from.id),
      });
      await ctx.telegram.editMessageText(ctx.chat.id, loading.message_id, undefined, `🤖 ${reply}`);
    } catch (err) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        loading.message_id,
        undefined,
        `❌ Akira error: ${err.message}`,
      );
    }
  },
};
