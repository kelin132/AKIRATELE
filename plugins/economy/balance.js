import { tryGetDb } from "../../lib/mongo.mjs";

export default {
  name: "balance",
  aliases: ["bal", "wallet", "money"],
  description: "Check your balance",
  category: "economy",
  usage: ".balance",
  cooldown: 5,
  async run({ ctx }) {
    const db = await tryGetDb();
    if (!db) return ctx.reply("❌ Economy features require MongoDB. Set MONGO_URI.");

    const userId = String(ctx.from.id);
    const name   = ctx.from.first_name ?? ctx.from.username ?? "User";

    const user = await db.collection("mn_users").findOneAndUpdate(
      { _id: userId },
      { $setOnInsert: { _id: userId, name, wallet: 0, bank: 0, xp: 0, level: 1 } },
      { upsert: true, returnDocument: "after" },
    );

    const doc = user ?? { wallet: 0, bank: 0, xp: 0, level: 1 };
    await ctx.reply(
      `💰 *${name}'s Balance*\n\n` +
      `👝 Wallet: \`${(doc.wallet ?? 0).toLocaleString()} coins\`\n` +
      `🏦 Bank: \`${(doc.bank ?? 0).toLocaleString()} coins\`\n` +
      `💎 Total: \`${((doc.wallet ?? 0) + (doc.bank ?? 0)).toLocaleString()} coins\`\n\n` +
      `⭐ Level: ${doc.level ?? 1} | XP: ${doc.xp ?? 0}`,
      { parse_mode: "Markdown" },
    );
  },
};
