/**
 * AKIRA Telegram — .instagram command
 * Downloads Instagram posts, reels, and videos.
 */
import { readFileSync } from "fs";
import {
  isValidInstagramUrl,
  getInstagramInfo,
  downloadInstagramVideo,
} from "../../lib/instagram.mjs";

export default {
  name: "instagram",
  description: "Download Instagram posts, reels, and videos",
  category: "download",
  usage: ".instagram <Instagram URL>",
  aliases: ["ig", "igdl", "reels", "insta", "reel"],
  cooldown: 30,

  async run({ ctx, args }) {
    const raw   = args.join(" ").trim();
    const match = raw.match(/https?:\/\/\S+/);
    const url   = match?.[0]?.replace(/[<>]/g, "");

    if (!url || !isValidInstagramUrl(url)) {
      return ctx.reply(
        "📸 <b>Instagram Downloader</b>\n\n" +
        "Usage: <code>.instagram &lt;URL&gt;</code>\n\n" +
        "Supported:\n" +
        "• Posts:   instagram.com/p/…\n" +
        "• Reels:   instagram.com/reel/…\n" +
        "• TV:      instagram.com/tv/…",
        { parse_mode: "HTML" }
      );
    }

    try {
      await ctx.reply("⏳ Downloading Instagram media…");

      const info    = await getInstagramInfo(url.trim());
      const isVideo = !!(info.duration > 0 || /reel|tv/i.test(url));

      const caption =
        `📥 <b>${(info.title || "Instagram Post").slice(0, 200)}</b>\n` +
        `👤 ${info.author}\n` +
        `✨ Powered by AKIRA`;

      if (isVideo) {
        const { filePath, cleanup } = await downloadInstagramVideo(url.trim());
        try {
          const buffer = readFileSync(filePath);
          await ctx.replyWithVideo({ source: buffer }, { caption, parse_mode: "HTML" });
        } finally {
          cleanup();
        }
      } else {
        const imageUrl = info.videoUrl || info.thumbnail;
        const res = await fetch(imageUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer":    "https://www.instagram.com/",
          },
          signal: AbortSignal.timeout(45_000),
        });
        if (!res.ok) throw new Error(`Image fetch failed: HTTP ${res.status}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        await ctx.replyWithPhoto({ source: buffer }, { caption, parse_mode: "HTML" });
      }

    } catch (err) {
      await ctx.reply(
        `❌ <b>Instagram download failed.</b>\n\n` +
        `${err.message.slice(0, 300)}\n\n` +
        `💡 Make sure the post is public and the URL is correct.`,
        { parse_mode: "HTML" }
      );
    }
  },
};
