/**
 * AKIRA Telegram — .ytdl command
 * Downloads YouTube videos (MP4).
 */
import yts from "yt-search";
import { get, davidGet } from "../../lib/gifted.js";

async function ytSearch(input) {
  if (/youtube\.com|youtu\.be/i.test(input)) {
    return { url: input, title: input, thumbnail: null, duration: "", author: "" };
  }
  const { videos } = await yts(input);
  if (!videos?.length) throw new Error("No results found for: " + input);
  const v = videos[0];
  return {
    url:       v.url,
    title:     v.title,
    thumbnail: v.thumbnail || v.image || null,
    duration:  v.timestamp || "",
    author:    v.author?.name || "",
  };
}

function pickVideo(result) {
  if (!result) return null;
  return result.download_url || result.video_url || result.video ||
         result.hd || result.sd || result.url || result.link || null;
}

async function fetchVideo(videoUrl) {
  const endpoints = [
    () => get("/download/ytdl",    { url: videoUrl }),
    () => get("/download/youtube", { url: videoUrl, type: "video" }),
    () => get("/download/yt",      { url: videoUrl }),
    () => davidGet("/download/ytdl",    { url: videoUrl }),
    () => davidGet("/download/youtube", { url: videoUrl, type: "video" }),
    () => davidGet("/download/yt",      { url: videoUrl }),
  ];
  for (const attempt of endpoints) {
    try {
      const data   = await attempt();
      const result = data?.result || data?.data || data;
      const dl     = pickVideo(result);
      if (dl) return { dl, title: result?.title || "" };
    } catch { /* try next */ }
  }
  throw new Error("All video download sources failed. Try a direct YouTube URL or use .play for audio.");
}

export default {
  name: "ytdl",
  description: "Download YouTube videos (MP4)",
  category: "download",
  usage: ".ytdl <YouTube URL or search query>",
  aliases: ["yt", "youtube", "video"],
  cooldown: 30,

  async run({ ctx, args }) {
    const text = args.join(" ").trim();
    if (!text) {
      return ctx.reply(
        "🎬 <b>YouTube Video Downloader</b>\n\n" +
        "Usage: <code>.ytdl &lt;YouTube URL or search&gt;</code>\n\n" +
        "Example:\n.ytdl https://youtu.be/xxxxx\n.ytdl Naruto opening 1\n\n" +
        "💡 For audio only, use .play",
        { parse_mode: "HTML" }
      );
    }

    try {
      await ctx.reply("🔍 Searching YouTube...");
      const meta = await ytSearch(text);

      const previewCaption =
        `🎬 <b>${meta.title}</b>\n` +
        (meta.author   ? `👤 ${meta.author}\n`   : "") +
        (meta.duration ? `⏱️ ${meta.duration}\n` : "") +
        "\n⬇️ <i>Downloading video… please wait</i>";

      if (meta.thumbnail) {
        try { await ctx.replyWithPhoto(meta.thumbnail, { caption: previewCaption, parse_mode: "HTML" }); }
        catch { await ctx.reply(previewCaption, { parse_mode: "HTML" }); }
      } else {
        await ctx.reply(previewCaption, { parse_mode: "HTML" });
      }

      const { dl, title } = await fetchVideo(meta.url);
      const trackTitle    = title || meta.title;

      await ctx.replyWithVideo(dl, { caption: `🎬 <b>${trackTitle}</b>\n\n✨ AKIRA`, parse_mode: "HTML" });

    } catch (err) {
      await ctx.reply(`❌ YouTube download failed.\n\n${err.message}\n\nTip: Try a direct YouTube link, or use .play for audio.`);
    }
  },
};
