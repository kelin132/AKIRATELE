import { tryGetDb } from "../../lib/mongo.mjs";

export default {
  name: "broadcast",
  aliases: ["bc"],
  description: "Broadcast a message to all known chats (owner only)",
  category: "owner",
  usage: ".broadcast <message>",
  cooldown: 30,
  isOwner: true,
  async run({ ctx, args }) {
    if (!args.length) return ctx.reply("Usage: `.broadcast <message>`", { parse_mode: "Markdown" });

    const message = args.join(" ");
    const db      = await tryGetDb();

    if (!db) {
      return ctx.reply("❌ MongoDB required for broadcast (no chat list available).");
    }

    const chats = await db.collection("group_settings").find({}, { projection: { chatId: 1 } }).toArray();
    if (!chats.length) return ctx.reply("No registered chats found.");

    let sent = 0, failed = 0;
    const statusMsg = await ctx.reply(`📡 Broadcasting to ${chats.length} chat(s)...`);

    for (const chat of chats) {
      try {
        await ctx.telegram.sendMessage(chat.chatId, `📢 *Broadcast*\n\n${message}`, { parse_mode: "Markdown" });
        sent++;
      } catch {
        failed++;
      }
      // Rate limit: 1 msg/100ms
      await new Promise(r => setTimeout(r, 100));
    }

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      undefined,
      `✅ Broadcast complete.\nSent: ${sent} | Failed: ${failed}`,
    );
  },
};
