/**
 * KELIN MD — MongoDB connection helper
 * Provides a single shared MongoClient + getDb() accessor.
 * Gracefully no-ops if MONGO_URI is not set.
 */

import { MongoClient } from "mongodb";
import { log } from "./logger.mjs";

let _client = null;
let _db     = null;
const DB_NAME = "kelin_md";

export async function connectDb() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    log("warn", "[mongo] MONGO_URI not set — skipping MongoDB connection.");
    return null;
  }

  if (_client) return _client;

  _client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 8_000,
    connectTimeoutMS: 10_000,
    socketTimeoutMS: 30_000,
  });

  await _client.connect();
  _db = _client.db(DB_NAME);
  log("info", `[mongo] Connected to MongoDB — db: ${DB_NAME}`);

  _client.on("error", (err) => log("error", "[mongo] Client error:", err.message));
  _client.on("close", ()    => { _client = null; _db = null; });

  return _client;
}

export async function getDb() {
  if (_db) return _db;
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI not set");
  await connectDb();
  return _db;
}

export async function closeDb() {
  if (_client) {
    await _client.close();
    _client = null;
    _db     = null;
  }
}

/** Quick helper — returns null if MongoDB is unavailable. */
export async function tryGetDb() {
  try { return await getDb(); }
  catch { return null; }
}
