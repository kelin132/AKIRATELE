/**
 * AKIRA Telegram — .pinterest command
 * Searches Pinterest by keyword and sends images.
 */
import { get, searchGet, davidGet } from "../../lib/gifted.js";

const IMAGE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept:   "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  Referer:  "https://www.pinterest.com/",
};

function resultItems(data) {
  return [data?.results, data?.data, data?.images, data?.result, Array.isArray(data) ? data : null]
    .flatMap(v => Array.isArray(v) ? v : v ? [v] : [])
    .flatMap(item => Array.isArray(item) ? item : [item]);
}

function imageUrlFrom(item) {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return null;
  return item.images?.orig?.url || item.images?.original?.url ||
         item.image?.url || item.image?.src || item.original?.url ||
         item.url || item.image || item.image_url || item.thumbnail ||
         item.src || item.media_url || item.download_url || null;
}

async function searchPinterestImages(query) {
  const attempts = [
    () => searchGet("googleimage", { query: `pinterest ${query}` }),
    () => searchGet("pinterest",   { query }),
    () => get("/search/pinterest", { query }),
    () => searchGet("images",      { query: `${query} pinterest` }),
    () => get("/search/images",    { query: `${query} pinterest` }),
    () => davidGet("/search/pinterest", { query }),
  ];
  const seen = new Set();
  const urls = [];
  for (const attempt of attempts) {
    try {
      const data = await attempt();
      for (const item of resultItems(data)) {
        const url = imageUrlFrom(item);
        if (!url || !/^https?:\/\//i.test(url) || seen.has(url)) continue;
        seen.add(url);
        urls.push(url);
      }
      const direct = imageUrlFrom(data);
      if (direct && /^https?:\/\//i.test(direct) && !seen.has(direct)) {
        seen.add(direct); urls.push(direct);
      }
      if (urls.length >= 8) break;
    } catch { /* try next */ }
  }
  if (!urls.length) throw new Error("No Pinterest results found.");
  return urls.slice(0, 12);
}

async function downloadImage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, { headers: IMAGE_HEADERS, redirect: "follow", signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length || buffer.length > 15 * 1024 * 1024) throw new Error("invalid image size");
    return buffer;
  } finally {
    clearTimeout(timer);
  }
}

export default {
  name: "pinterest",
  description: "Search Pinterest images by keyword",
  category: "search",
  usage: ".pinterest <keywords>",
  aliases: ["pin", "pinsearch"],
  cooldown: 8,

  async run({ ctx, args }) {
    const text = args.join(" ").trim();

    if (!text) {
      return ctx.reply(
        "📌 <b>Pinterest Image Search</b>\n\n" +
        "Usage: <code>.pinterest &lt;keywords&gt;</code>\n\n" +
        "Examples:\n• .pinterest anime wallpaper\n• .pinterest sakura art\n• .pinterest demon slayer",
        { parse_mode: "HTML" }
      );
    }

    try {
      await ctx.reply(`🔍 Searching Pinterest for "${text}"...`);
      const imageUrls = await searchPinterestImages(text);
      let sent = 0;

      for (const imageUrl of imageUrls) {
        if (sent >= 10) break;
        try {
          const image = await downloadImage(imageUrl);
          await ctx.replyWithPhoto({ source: image });
          sent++;
        } catch (e) {
          console.warn(`[pinterest] skipped image: ${e.message}`);
        }
      }

      if (!sent) await ctx.reply("❌ Found results but could not load any images.");

    } catch (err) {
      await ctx.reply(`❌ ${err.message}`);
    }
  },
};
