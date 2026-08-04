/**
 * KELIN MD — Safe Send Utilities
 *
 * Telegram hard limits:
 *   caption  → 1024 characters
 *   message  → 4096 characters
 *
 * These helpers automatically split oversized captions:
 *   media is sent without caption, then the full text follows as a plain message.
 *
 * Also splits messages > 4096 chars into sequential chunks.
 */

const MAX_CAPTION = 1024;
const MAX_MESSAGE = 4096;

/**
 * Wrap a Telegraf `ctx` so every media-send call respects the caption limit.
 * Returns a patched copy — the original ctx is not mutated.
 *
 * Usage in pluginManager:
 *   const safe = wrapCtx(ctx);
 *   await plugin.run({ ctx: safe, ... });
 */
export function wrapCtx(ctx) {
  const proxy = Object.create(ctx);

  // Methods that accept { caption } in their extra argument
  const mediaMethods = [
    "replyWithPhoto",
    "replyWithVideo",
    "replyWithAnimation",
    "replyWithDocument",
    "replyWithAudio",
    "replyWithVoice",
    "replyWithVideoNote",
    "replyWithSticker",
  ];

  for (const method of mediaMethods) {
    if (typeof ctx[method] !== "function") continue;
    proxy[method] = async function (fileOrUrl, extra = {}) {
      const caption = extra?.caption ?? "";
      if (caption.length <= MAX_CAPTION) {
        return ctx[method].call(ctx, fileOrUrl, extra);
      }
      // Caption too long — send media with no caption, then the text
      const noCapExtra = { ...extra };
      delete noCapExtra.caption;
      const sent = await ctx[method].call(ctx, fileOrUrl, noCapExtra);
      await safeSendText(ctx, caption);
      return sent;
    };
  }

  // Also wrap reply/sendMessage to chunk long text
  proxy.reply = async function (text, extra = {}) {
    return safeSendText(ctx, text, extra);
  };

  return proxy;
}

/**
 * Send text, splitting into ≤ 4096-char chunks if needed.
 */
export async function safeSendText(ctx, text, extra = {}) {
  const str = String(text ?? "");
  if (!str.length) return;

  if (str.length <= MAX_MESSAGE) {
    return ctx.reply(str, extra);
  }

  // Split on newlines where possible, otherwise hard cut
  const chunks = chunkText(str, MAX_MESSAGE);
  let last;
  for (const chunk of chunks) {
    last = await ctx.reply(chunk, extra);
  }
  return last;
}

/**
 * Split `text` into chunks of at most `maxLen` chars,
 * preferring to break at newlines.
 */
function chunkText(text, maxLen) {
  const chunks = [];
  let remaining = text;
  while (remaining.length > maxLen) {
    let cut = remaining.lastIndexOf("\n", maxLen);
    if (cut < maxLen * 0.5) cut = maxLen; // no good newline — hard cut
    chunks.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining.length) chunks.push(remaining);
  return chunks;
}
