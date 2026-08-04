import { tryGetDb } from "../../lib/mongo.mjs";

export default {
  name: "withdraw",
  aliases: ["with"],
  description: "Withdraw coins from bank to wallet",
  category: "economy",
  usage: ".withdraw <amount|all>",
  cooldown: 5,
  async run({ ctx, args }) {
    const db = await tryGetDb();
    if (!db) return ctx.reply("❌ Economy features require MongoDB. Set MONGO_URI.");

    const userId = String(ctx.from.id);
    const user   = await db.collection("mn_users").findOne({ _id: userId });
    if (!user) return ctx.reply("❌ You don't have an account yet. Use `.balance` to create one.");

    const bank   = user.bank ?? 0;
    const amount = args[0]?.toLowerCase() === "all" ? bank : parseInt(args[0]);

    if (!amount || isNaN(amount) || amount <= 0) return ctx.reply("Usage: `.withdraw <amount>` or `.withdraw all`", { parse_mode: "Markdown" });
    if (amount > bank) return ctx.reply(`❌ Not enough in your bank. You have \`${bank}\` coins.`, { parse_mode: "Markdown" });

    await db.collection("mn_users").updateOne(
      { _id: userId },
      { $inc: { wallet: amount, bank: -amount } },
    );

    await ctx.reply(`✅ Withdrew \`${amount}\` coins to your wallet.`, { parse_mode: "Markdown" });
  },
};
