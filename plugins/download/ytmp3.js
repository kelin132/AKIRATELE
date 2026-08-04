/**
 * AKIRA Telegram — .ytmp3 (alias of .play)
 */
export default {
  name: "ytmp3dl",
  description: "Download YouTube audio as MP3 (use .play instead)",
  category: "download",
  usage: ".ytmp3 <YouTube URL>",
  aliases: ["ymp3"],
  cooldown: 15,

  async run({ ctx, args }) {
    const url = args[0];
    if (!url || !url.includes("youtu")) {
      return ctx.reply("Usage: .ytmp3 <YouTube URL>\n\nTip: .play also works with song names!");
    }
    // Delegate to the play logic by re-invoking with same args
    return ctx.reply("⏳ Use .play <url> — it supports YouTube URLs directly!");
  },
};
