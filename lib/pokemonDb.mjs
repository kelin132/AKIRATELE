/**
 * KELIN MD — Pokémon User Database
 * Stores caught Pokémon, team, and battle stats in MongoDB.
 * Falls back to a simple in-memory map if Mongo is unavailable.
 */

import { tryGetDb } from "./mongo.mjs";

const COLLECTION = "mn_pokemon";

// In-memory fallback: userId → { caught: [], wins: 0, losses: 0 }
const _mem = new Map();

function emptyUser(userId) {
  return { _id: userId, caught: [], wins: 0, losses: 0 };
}

export async function getPokeUser(userId) {
  const db = await tryGetDb();
  if (db) {
    let doc = await db.collection(COLLECTION).findOne({ _id: userId });
    if (!doc) {
      doc = emptyUser(userId);
      await db.collection(COLLECTION).insertOne(doc);
    }
    return doc;
  }
  if (!_mem.has(userId)) _mem.set(userId, emptyUser(userId));
  return _mem.get(userId);
}

export async function addCaughtPokemon(userId, pokemon) {
  const db = await tryGetDb();
  if (db) {
    await db.collection(COLLECTION).updateOne(
      { _id: userId },
      { $push: { caught: pokemon }, $setOnInsert: emptyUser(userId) },
      { upsert: true },
    );
    return;
  }
  const u = await getPokeUser(userId);
  u.caught.push(pokemon);
}

export async function recordBattleResult(userId, won) {
  const db = await tryGetDb();
  if (db) {
    const inc = won ? { wins: 1 } : { losses: 1 };
    await db.collection(COLLECTION).updateOne(
      { _id: userId },
      { $inc: inc, $setOnInsert: emptyUser(userId) },
      { upsert: true },
    );
    return;
  }
  const u = await getPokeUser(userId);
  if (won) u.wins++; else u.losses++;
}
