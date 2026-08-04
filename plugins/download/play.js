/**
 * AKIRA Telegram — .play command
 * Searches YouTube and downloads audio.
 */
import yts from "yt-search";
import { get, davidGet } from "../../lib/gifted.js";

async function ytSearch(input) {
  if (/youtube\.com|youtu\.be/i.test(input)) {
    return { url: input, title: input, thumbnail: null, duration: "", author: "", views: "" };
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
    views:     v.views ? Number(v.views).toLocaleString() : "",
  };
}

function pickAudio(result) {
  if (!result) return null;
  return result.download_url || result.audio_url || result.audio ||
         result.mp3 || result.url || result.link || null;
}

async function fetchAudio(videoUrl) {
  const endpoints = [
    () => get("/download/ytmp3",   { url: videoUrl }),
    () => get("/download/ytaudio", { url: videoUrl }),
    () => get("/download/youtube", { url: videoUrl, type: "audio" }),
    () => davidGet("/download/ytmp3",   { url: videoUrl }),
    () => davidGet("/download/ytaudio", { url: videoUrl }),
  ];
  for (const attempt of endpoints) {
    try {
      const data   = await attempt();
      const result = data?.result || data?.data || data;
      const dl     = pickAudio(result);
      if (dl) return { dl, title: result?.title || "" };
    } catch { /* try next */ }
  }
  throw new Error("All audio download sources failed. Try a direct YouTube URL.");
}

export default {
  name: "play",
  description: "Search and download audio from YouTube",
  category: "download",
  usage: ".play <song name or YouTube URL>",
  aliases: ["song", "music", "mp3", "ytmp3"],
  cooldown: 15,

  async run({ ctx, args }) {
    const text = args.join(" ").trim();
    if (!text) return ctx.reply("🎵 Usage: .play <song name or YouTube URL>\n\nExample: .play Shape of You");

    try {
      const meta = await ytSearch(text);

      const caption = [
        `🎵 <b>${meta.title}</b>`,
        meta.author   ? `👤 ${meta.author}`      : "",
        meta.duration ? `⏱️ ${meta.duration}`    : "",
        meta.views    ? `👁️ ${meta.views} views` : "",
        "",
        "⬇️ <i>Fetching audio… please wait</i>",
      ].filter(Boolean).join("\n");

      if (meta.thumbnail) {
        try { await ctx.replyWithPhoto(meta.thumbnail, { caption, parse_mode: "HTML" }); }
        catch { await ctx.reply(caption, { parse_mode: "HTML" }); }
      } else {
        await ctx.reply(caption, { parse_mode: "HTML" });
      }

      const { dl, title } = await fetchAudio(meta.url);
      const trackTitle    = title || meta.title;

      await ctx.replyWithAudio(dl, { title: trackTitle, performer: "AKIRA" });

    } catch (err) {
      await ctx.reply(`❌ Audio download failed.\n\n${err.message}\n\nTry again or use a direct YouTube URL.`);
    }
  },
};
