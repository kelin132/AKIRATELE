/**
 * KELIN MD — Pokémon Spawn Manager
 * Tracks active wild Pokémon spawns in each chat.
 * Uses PokéAPI (free, no key needed).
 */

import { requestJson } from "./http.mjs";
import { log } from "./logger.mjs";

// chatId → { pokemon, level, hp, maxHp, spawnedAt, messageId }
const _spawns = new Map();

const TOTAL_POKEMON = 898; // Gen 1–8

export async function fetchRandomPokemon() {
  const id  = Math.floor(Math.random() * TOTAL_POKEMON) + 1;
  const url = `https://pokeapi.co/api/v2/pokemon/${id}`;

  const data = await requestJson(url, { timeoutMs: 10_000 });

  const name   = data.name.charAt(0).toUpperCase() + data.name.slice(1);
  const sprite = data.sprites?.other?.["official-artwork"]?.front_default
              ?? data.sprites?.front_default
              ?? null;
  const types  = data.types.map(t => cap(t.type.name));
  const baseHp = data.stats.find(s => s.stat.name === "hp")?.base_stat ?? 45;
  const baseAtk = data.stats.find(s => s.stat.name === "attack")?.base_stat ?? 45;
  const moves  = data.moves
    .slice(0, 4)
    .map(m => cap(m.move.name.replace(/-/g, " ")));

  return { id, name, sprite, types, baseHp, baseAtk, moves };
}

export function getSpawn(chatId) { return _spawns.get(String(chatId)) ?? null; }
export function hasSpawn(chatId) { return _spawns.has(String(chatId)); }

export function setSpawn(chatId, data) {
  _spawns.set(String(chatId), { ...data, spawnedAt: Date.now() });
}

export function clearSpawn(chatId) { _spawns.delete(String(chatId)); }

export function spawnExpired(chatId, ttlMs = 10 * 60 * 1000) {
  const s = _spawns.get(String(chatId));
  if (!s) return true;
  return Date.now() - s.spawnedAt > ttlMs;
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
