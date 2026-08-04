/**
 * KELIN MD — Telegram Bot (Telegraf)
 * Main bot connection and update handler.
 */

import { Telegraf } from "telegraf";
import { log } from "./logger.mjs";
import { routeMessage, getAllPlugins } from "./pluginManager.mjs";
import { getGroupSettings, setGroupSetting } from "./groupSettings.js";
import { registerActiveBot } from "./activeSocket.mjs";
import { getRuntimeSettings } from "./runtimeSettings.mjs";
import { handleTttCallback } from "../plugins/games/ttt.js";

let _bot = null;

export async function connectTelegramBot(prefix = ".") {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set.");

  const RUNTIME      = getRuntimeSettings();
  const ownerNumber  = RUNTIME.ownerNumber || process.env.OWNER_NUMBER || "";
  const botName      = RUNTIME.botName     || process.env.BOT_NAME     || "KELIN MD";

  _bot = new Telegraf(token);
  registerActiveBot(_bot);

  // ── Graceful shutdown ────────────────────────────────────────────────────
  process.once("SIGINT",  () => { log("info", "SIGINT — stopping bot."); _bot.stop("SIGINT");  });
  process.once("SIGTERM", () => { log("info", "SIGTERM — stopping bot."); _bot.stop("SIGTERM"); });

  // ── Member join / leave ───────────────────────────────────────────────────
  _bot.on("new_chat_members", async (ctx) => {
    try {
      const settings = await getGroupSettings(String(ctx.chat.id));
      if (!settings.welcome) return;
      for (const member of ctx.message.new_chat_members ?? []) {
        if (member.is_bot) continue;
        const name = member.first_name ?? member.username ?? "there";
        await ctx.reply(
          `👋 Welcome, *${escMd(name)}*, to *${escMd(ctx.chat.title ?? "the group")}*\\! 🎉\n\nEnjoy your stay\\. Type \`${escMd(prefix)}menu\` to see what I can do\\.`,
          { parse_mode: "MarkdownV2" },
        ).catch(() => {});
      }
    } catch (err) {
      log("warn", "[bot] Welcome handler error:", err.message);
    }
  });

  _bot.on("left_chat_member", async (ctx) => {
    try {
      const settings = await getGroupSettings(String(ctx.chat.id));
      if (!settings.goodbye) return;
      const member = ctx.message.left_chat_member;
      if (!member || member.is_bot) return;
      const name = member.first_name ?? member.username ?? "Someone";
      await ctx.reply(`👋 *${escMd(name)}* has left the group\\.`, { parse_mode: "MarkdownV2" }).catch(() => {});
    } catch (err) {
      log("warn", "[bot] Goodbye handler error:", err.message);
    }
  });

  // ── Anti-link ─────────────────────────────────────────────────────────────
  _bot.on(["message", "edited_message"], async (ctx, next) => {
    try {
      const chatId = ctx.chat?.id;
      if (!chatId) return next();
      const chatType = ctx.chat?.type;
      if (chatType !== "group" && chatType !== "supergroup") return next();

      const settings = await getGroupSettings(String(chatId));
      if (!settings.antiLink) return next();

      const text = ctx.message?.text ?? ctx.message?.caption ?? "";
      const hasLink = /(https?:\/\/|t\.me\/|telegram\.me\/|wa\.me\/)/i.test(text);
      if (!hasLink) return next();

      const senderId  = String(ctx.from?.id ?? "");
      const ownerNum  = getRuntimeSettings().ownerNumber || process.env.OWNER_NUMBER || "";
      if (senderId === ownerNum) return next();

      try {
        const member = await ctx.getChatMember(ctx.from.id);
        if (["administrator", "creator"].includes(member.status)) return next();
      } catch { /* ignore */ }

      await ctx.deleteMessage().catch(() => {});
      await ctx.reply(`🚫 Links are not allowed in this group, ${ctx.from?.first_name ?? "user"}.`).catch(() => {});
      return;
    } catch { return next(); }
  });

  // ── Inline keyboard callbacks ─────────────────────────────────────────────
  _bot.action(/^ttt:/, async (ctx) => {
    try { await handleTttCallback(ctx); }
    catch (err) { log("warn", "[bot] TTT callback error:", err.message); try { await ctx.answerCbQuery("Error"); } catch {} }
  });

  // ── Command router ────────────────────────────────────────────────────────
  _bot.on(["message", "channel_post"], async (ctx) => {
    try {
      await routeMessage(ctx, { prefix, ownerNumber });
    } catch (err) {
      log("error", "[bot] routeMessage error:", err.message);
    }
  });

  // ── Error handler ─────────────────────────────────────────────────────────
  _bot.catch((err, ctx) => {
    const msg = err?.message ?? String(err);
    // Caption / message too long — already handled by safeSend; log only
    if (msg.includes("caption is too long") || msg.includes("message is too long")) {
      log("warn", `[bot] Message too long (auto-truncated next time): ${msg}`);
      return;
    }
    log("error", `[bot] Unhandled error for ${ctx?.updateType ?? "unknown"}:`, msg);
  });

  // ── Launch ────────────────────────────────────────────────────────────────
  try {
    await _bot.launch();
  } catch (err) {
    const msg = err?.message ?? String(err);
    if (msg.includes("409") || msg.includes("Conflict")) {
      log("warn", [
        "[bot] 409 Conflict — another instance of this bot is already running.",
        "      Stop the other instance (e.g. on katabump) before starting here,",
        "      or stop this Replit workflow when running on katabump.",
        "      Only ONE polling instance per token is allowed by Telegram.",
      ].join("\n"));
      process.exit(0); // clean exit so the workflow doesn't spam restart loops
    }
    throw err; // re-throw other launch errors
  }

  const me = await _bot.telegram.getMe().catch(() => ({ username: "unknown" }));
  log("info", `[bot] ${botName} connected as @${me.username} — listening for updates.`);

  return _bot;
}

export function getBot() { return _bot; }

function escMd(text = "") {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}
