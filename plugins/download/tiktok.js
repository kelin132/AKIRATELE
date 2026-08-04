/**
 * AKIRA Telegram — .tiktok command
 * Downloads TikTok videos without watermark via the David Cyril API.
 */
import { davidGet } from "../../lib/gifted.js";

async function fetchTikTok(url) {
  const attempts = [
    () => davidGet("/download/tiktok",   { url }),
    () => davidGet("/download/tiktokdl", { url }),
    () => davidGet("/download/tt",       { url }),
    () => davidGet("/tiktok",            { url }),
  ];
  for (const attempt of attempts) {
    try {
      const data = await attempt();
      const r    = data?.result ?? data?.data ?? data;
      if (!r) continue;
      const dl =
        r.download_url ?? r.video_url ?? r.video ?? r.nowm ??
        r.url ?? r.mp4 ?? r.play ?? null;
      const title = r.title ?? r.desc ?? r.description ?? "TikTok Video";
      if (dl && typeof dl === "string") return { dl, title };
    } catch { /* try next */ }
  }
  throw new Error("All TikTok download sources failed. Make sure the URL is valid and the video is public.");
}

export default {
  name: "tiktok",
  description: "Download TikTok video without watermark",
  category: "download",
  usage: ".tiktok <TikTok URL>",
  aliases: ["tt", "tikdl", "tiktokdl"],
  cooldown: 20,

  async run({ ctx, args }) {
    const url = args[0];

    if (!url || !/tiktok\.com|vm\.tiktok|vt\.tiktok/i.test(url)) {
      return ctx.reply(
        "🎵 <b>TikTok Downloader</b>\n\n" +
        "Usage: <code>.tiktok &lt;TikTok URL&gt;</code>\n\n" +
        "Example:\n.tiktok https://vm.tiktok.com/xxxxx",
        { parse_mode: "HTML" }
      );
    }

    try {
      await ctx.reply("⏳ Downloading TikTok video, please wait...");
      const { dl, title } = await fetchTikTok(url.trim());
      await ctx.replyWithVideo(dl, {
        caption: `🎵 <b>${title}</b>\n\n✨ Downloaded by AKIRA`,
        parse_mode: "HTML",
      });
    } catch (err) {
      await ctx.reply(`❌ TikTok download failed.\n\n${err.message}`);
    }
  },
};
