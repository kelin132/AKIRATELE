import { tryGetDb } from "../../lib/mongo.mjs";

const DAILY_AMOUNT = 500;
const COOLDOWN_MS  = 24 * 60 * 60 * 1000;

export default {
  name: "daily",
  aliases: ["claim"],
  description: "Claim your daily coins",
  category: "economy",
  usage: ".daily",
  cooldown: 5,
  async run({ ctx }) {
    const db = await tryGetDb();
    if (!db) return ctx.reply("❌ Economy features require MongoDB. Set MONGO_URI.");

    const userId = String(ctx.from.id);
    const name   = ctx.from.first_name ?? ctx.from.username ?? "User";
    const now    = Date.now();

    let user = await db.collection("mn_users").findOne({ _id: userId });
    if (!user) {
      user = { _id: userId, name, wallet: 0, bank: 0, xp: 0, level: 1, lastDaily: 0 };
      await db.collection("mn_users").insertOne(user);
    }

    const lastDaily = user.lastDaily ?? 0;
    const next      = lastDaily + COOLDOWN_MS;

    if (now < next) {
      const remaining = next - now;
      const h = Math.floor(remaining / 3_600_000);
      const m = Math.floor((remaining % 3_600_000) / 60_000);
      return ctx.reply(`⏳ You already claimed your daily!\n\nCome back in *${h}h ${m}m*.`, { parse_mode: "Markdown" });
    }

    await db.collection("mn_users").updateOne(
      { _id: userId },
      { $inc: { wallet: DAILY_AMOUNT }, $set: { lastDaily: now } },
    );

    await ctx.reply(
      `✅ *Daily claimed!*\n\n+\`${DAILY_AMOUNT}\` coins added to your wallet, ${name}!`,
      { parse_mode: "Markdown" },
    );
  },
};
