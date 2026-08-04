import { tryGetDb } from "../../lib/mongo.mjs";

export default {
  name: "deposit",
  aliases: ["dep"],
  description: "Deposit coins from wallet to bank",
  category: "economy",
  usage: ".deposit <amount|all>",
  cooldown: 5,
  async run({ ctx, args }) {
    const db = await tryGetDb();
    if (!db) return ctx.reply("❌ Economy features require MongoDB. Set MONGO_URI.");

    const userId = String(ctx.from.id);
    const user   = await db.collection("mn_users").findOne({ _id: userId });
    if (!user) return ctx.reply("❌ You don't have an account yet. Use `.balance` to create one.");

    const wallet = user.wallet ?? 0;
    const amount = args[0]?.toLowerCase() === "all" ? wallet : parseInt(args[0]);

    if (!amount || isNaN(amount) || amount <= 0) return ctx.reply("Usage: `.deposit <amount>` or `.deposit all`", { parse_mode: "Markdown" });
    if (amount > wallet) return ctx.reply(`❌ Not enough in your wallet. You have \`${wallet}\` coins.`, { parse_mode: "Markdown" });

    await db.collection("mn_users").updateOne(
      { _id: userId },
      { $inc: { wallet: -amount, bank: amount } },
    );

    await ctx.reply(`✅ Deposited \`${amount}\` coins to your bank.`, { parse_mode: "Markdown" });
  },
};
