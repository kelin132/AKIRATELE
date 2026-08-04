/**
 * KELIN MD — Tax Scheduler
 * Deducts 30% of wallet + bank from all users every 48 hours.
 * Requires MongoDB.
 */

import { log } from "./logger.mjs";
import { tryGetDb } from "./mongo.mjs";

const INTERVAL_MS = 48 * 60 * 60 * 1000; // 48 hours
let _timer = null;

export function startTaxScheduler() {
  if (!process.env.MONGO_URI) {
    log("info", "[taxScheduler] MONGO_URI not set — tax scheduler disabled.");
    return;
  }
  if (_timer) return;
  _timer = setInterval(runTaxCycle, INTERVAL_MS);
  log("info", "[taxScheduler] Started — taxes collected every 48 h.");
}

export function stopTaxScheduler() {
  if (_timer) { clearInterval(_timer); _timer = null; }
}

async function runTaxCycle() {
  const db = await tryGetDb();
  if (!db) return;

  try {
    const users = await db.collection("mn_users").find({}, { projection: { _id: 1, wallet: 1, bank: 1 } }).toArray();
    const TAX_RATE = 0.3;

    for (const user of users) {
      const newWallet = Math.floor((user.wallet ?? 0) * (1 - TAX_RATE));
      const newBank   = Math.floor((user.bank   ?? 0) * (1 - TAX_RATE));
      await db.collection("mn_users").updateOne(
        { _id: user._id },
        { $set: { wallet: newWallet, bank: newBank } },
      );
    }
    log("info", `[taxScheduler] 30% tax collected from ${users.length} user(s).`);
  } catch (err) {
    log("warn", "[taxScheduler] Tax cycle error:", err.message);
  }
}
