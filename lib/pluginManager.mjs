/**
 * KELIN MD — Plugin Manager (Telegram Edition)
 * Loads .js plugin files from plugins/<category>/ and routes incoming messages.
 */

import { readdir, stat } from "fs/promises";
import path from "path";
import { log } from "./logger.mjs";
import { getPermissions } from "./permissions.mjs";
import { wrapCtx } from "./safeSend.mjs";

const plugins  = new Map();   // name → plugin
const aliases  = new Map();   // alias → canonical name
let   _prefix  = ".";

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadPlugins(prefix = ".") {
  _prefix = prefix;
  plugins.clear();
  aliases.clear();

  const PLUGINS_DIR = path.resolve("plugins");

  let categories;
  try {
    categories = await readdir(PLUGINS_DIR);
  } catch {
    log("warn", "[plugins] plugins/ directory not found — no plugins loaded.");
    return { totalPlugins: 0, totalCommands: 0 };
  }

  for (const cat of categories) {
    const catPath = path.join(PLUGINS_DIR, cat);
    let files;
    try {
      const s = await stat(catPath);
      if (!s.isDirectory()) continue;
      files = await readdir(catPath);
    } catch { continue; }

    for (const file of files) {
      if (!file.endsWith(".js") && !file.endsWith(".mjs")) continue;
      const filePath = path.join(catPath, file);
      try {
        const mod = await import(filePath + `?t=${Date.now()}`);
        const plugin = mod.default;
        if (!plugin?.name || typeof plugin.run !== "function") continue;

        plugins.set(plugin.name, plugin);
        if (Array.isArray(plugin.aliases)) {
          for (const a of plugin.aliases) aliases.set(a, plugin.name);
        }
      } catch (err) {
        log("warn", `[plugins] Failed to load ${filePath}: ${err.message}`);
      }
    }
  }

  log("info", `[plugins] Loaded ${plugins.size} plugins (${plugins.size + aliases.size} total triggers).`);
  return { totalPlugins: plugins.size, totalCommands: plugins.size + aliases.size };
}

export function getPlugin(name) {
  return plugins.get(name) ?? plugins.get(aliases.get(name));
}

export function getAllPlugins() {
  return [...plugins.values()];
}

// ── Router ─────────────────────────────────────────────────────────────────────

/**
 * Route an incoming Telegraf context to the right plugin.
 *
 * @param {import("telegraf").Context} ctx
 * @param {object} opts - { prefix, ownerNumber }
 */
export async function routeMessage(ctx, opts = {}) {
  const prefix      = opts.prefix ?? _prefix;
  const ownerNumber = opts.ownerNumber ?? process.env.OWNER_NUMBER ?? "";

  const text = ctx.message?.text ?? ctx.message?.caption ?? "";
  if (!text.startsWith(prefix)) return;

  const body    = text.slice(prefix.length).trim();
  const [cmd, ...argParts] = body.split(/\s+/);
  const args    = argParts;
  const lowerCmd = cmd.toLowerCase();

  const plugin = getPlugin(lowerCmd);
  if (!plugin) return;   // unknown command — silently ignore

  // ── Permission check ────────────────────────────────────────────────────────
  const senderId = String(ctx.from?.id ?? "");
  const isGroup  = ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";

  const perms = await getPermissions(senderId, ownerNumber, { fromMe: false });

  if (plugin.isOwner   && !perms.isOwner)   { await ctx.reply("⛔ Owner only."); return; }
  if (plugin.isAdmin   && !perms.isMod && !perms.isOwner) { await ctx.reply("⛔ Admin only."); return; }
  if (plugin.isPremium && !perms.isPremium) { await ctx.reply("⛔ Premium only."); return; }
  if (plugin.groupOnly && !isGroup)         { await ctx.reply("⛔ This command works in groups only."); return; }

  // ── Cooldown check ──────────────────────────────────────────────────────────
  if (plugin.cooldown && plugin.cooldown > 0) {
    const coolKey = `${plugin.name}:${senderId}`;
    const now     = Date.now();
    const last    = _cooldowns.get(coolKey) ?? 0;
    if (now - last < plugin.cooldown * 1000) {
      const wait = Math.ceil((plugin.cooldown * 1000 - (now - last)) / 1000);
      await ctx.reply(`⏳ Slow down! Wait ${wait}s before using .${plugin.name} again.`);
      return;
    }
    _cooldowns.set(coolKey, now);
    // Prune old cooldown entries periodically
    if (_cooldowns.size > 10_000) {
      for (const [k, v] of _cooldowns) { if (now - v > 600_000) _cooldowns.delete(k); }
    }
  }

  // ── Run ─────────────────────────────────────────────────────────────────────
  const safeCtx = wrapCtx(ctx);
  try {
    await plugin.run({ ctx: safeCtx, args, prefix, perms, isGroup });
  } catch (err) {
    log("error", `[plugins] Error in .${plugin.name}: ${err.message}`);
    try { await ctx.reply(`❌ Error: ${err.message}`); } catch { /* ignore send failure */ }
  }
}

const _cooldowns = new Map();
