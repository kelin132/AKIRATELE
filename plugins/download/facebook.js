/**
 * AKIRA Telegram — .facebook command
 * Downloads Facebook videos using multiple API sources with auto-fallback.
 */
import { get, davidGet } from "../../lib/gifted.js";

function pickVideo(result) {
  if (!result) return null;
  const candidates = [result, result?.result, result?.data, result?.video_data];
  for (const obj of candidates) {
    if (!obj || typeof obj !== "object") continue;
    const url =
      obj.hd || obj.sd || obj.hd_url || obj.sd_url ||
      obj.download_url || obj.video_url || obj.video ||
      obj.url || obj.link || obj.downloadUrl || obj.playUrl || null;
    if (url && typeof url === "string" && url.startsWith("http")) return url;
  }
  const links = result?.links || result?.result?.links || result?.data?.links || [];
  if (Array.isArray(links) && links.length) {
    const hd = links.find(l => /hd/i.test(l.quality || l.label || ""));
    return (hd || links[0])?.url || null;
  }
  return null;
}

function pickTitle(result) {
  return result?.title || result?.result?.title || result?.data?.title || "Facebook Video";
}

async function fetchFacebook(url) {
  const attempts = [
    () => get("/download/facebook",  { url }),
    () => get("/download/fb",        { url }),
    () => get("/download/fbvideo",   { url }),
    () => davidGet("/download/facebook",   { url }),
    () => davidGet("/download/fb",         { url }),
    () => davidGet("/downloader/facebook", { url }),
    () => get("/download/video", { url }),
  ];
  let lastErr = null;
  for (const attempt of attempts) {
    try {
      const data  = await attempt();
      const video = pickVideo(data);
      if (video) return { video, title: pickTitle(data) };
    } catch (e) { lastErr = e; }
  }
  throw new Error(
    lastErr?.message?.includes("HTTP")
      ? "The video download API is currently unavailable. Please try again later."
      : "Could not extract the video. Make sure it is Public and the URL is correct."
  );
}

export default {
  name: "facebook",
  description: "Download Facebook videos",
  category: "download",
  usage: ".facebook <Facebook video URL>",
  aliases: ["fb", "fbdl", "fbvid"],
  cooldown: 10,

  async run({ ctx, args }) {
    const text = args.join(" ").trim();

    if (!text) {
      return ctx.reply(
        "📥 <b>Facebook Video Downloader</b>\n\n" +
        "Usage: <code>.facebook &lt;Facebook video URL&gt;</code>\n\n" +
        "Supported:\n" +
        "• https://www.facebook.com/watch?v=xxxx\n" +
        "• https://fb.watch/xxxxx\n" +
        "• https://www.facebook.com/reel/xxxx",
        { parse_mode: "HTML" }
      );
    }

    if (!/facebook\.com|fb\.watch/i.test(text)) {
      return ctx.reply("❌ Please provide a valid Facebook video URL.\n\nExamples:\n• https://www.facebook.com/watch?v=xxxx\n• https://fb.watch/xxxxx");
    }

    try {
      await ctx.reply("⏳ Fetching Facebook video...");
      const { video, title } = await fetchFacebook(text.trim());
      await ctx.replyWithVideo(video, {
        caption: `🎬 <b>${title}</b>\n\n✨ AKIRA`,
        parse_mode: "HTML",
      });
    } catch (err) {
      await ctx.reply(
        `❌ Failed to download\n\n${err.message}\n\n` +
        "💡 Tips:\n• Make sure the video is set to Public\n• Copy the full URL directly from the browser"
      );
    }
  },
};
