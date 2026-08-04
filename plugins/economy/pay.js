import { tryGetDb } from "../../lib/mongo.mjs";

export default {
  name: "pay",
  aliases: ["give", "transfer"],
  description: "Send coins to another user (reply to their message)",
  category: "economy",
  usage: ".pay <amount> (reply to user)",
  cooldown: 10,
  async run({ ctx, args }) {
    const db = await tryGetDb();
    if (!db) return ctx.reply("❌ Economy features require MongoDB. Set MONGO_URI.");

    const replied = ctx.message?.reply_to_message;
    if (!replied) return ctx.reply("Reply to the message of the person you want to pay.");

    const amount = parseInt(args[0]);
    if (!amount || isNaN(amount) || amount <= 0) return ctx.reply("Provide a valid amount: `.pay <amount>`", { parse_mode: "Markdown" });

    const fromId = String(ctx.from.id);
    const toId   = String(replied.from.id);
    if (fromId === toId) return ctx.reply("❌ You can't pay yourself.");

    const sender = await db.collection("mn_users").findOne({ _id: fromId });
    if (!sender || (sender.wallet ?? 0) < amount) return ctx.reply(`❌ Not enough coins. You need \`${amount}\` in your wallet.`, { parse_mode: "Markdown" });

    await db.collection("mn_users").updateOne({ _id: fromId }, { $inc: { wallet: -amount } });
    await db.collection("mn_users").updateOne(
      { _id: toId },
      { $inc: { wallet: amount }, $setOnInsert: { _id: toId, bank: 0, xp: 0, level: 1 } },
      { upsert: true },
    );

    const toName = replied.from?.first_name ?? replied.from?.username ?? "User";
    await ctx.reply(`✅ Paid *${toName}* \`${amount}\` coins!`, { parse_mode: "Markdown" });
  },
};
