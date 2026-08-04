import { getRuntimeSettings } from "../../lib/runtimeSettings.mjs";
import os from "os";

export default {
  name: "alive",
  aliases: ["status", "online"],
  description: "Show bot status",
  category: "main",
  usage: ".alive",
  cooldown: 5,
  isOwner: false,
  isAdmin: false,
  isPremium: false,
  async run({ ctx }) {
    const s = getRuntimeSettings();
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const sec = Math.floor(uptime % 60);
    const memMb = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const cpuCount = os.cpus().length;

    const text = [
      `*${s.botName}* is alive! ⚡`,
      ``,
      `⏱ Uptime: \`${h}h ${m}m ${sec}s\``,
      `🧠 Memory: \`${memMb} MB\``,
      `💻 CPUs: \`${cpuCount}\``,
      `📦 Node: \`${process.version}\``,
      ``,
      `_Telegram Edition_`,
    ].join("\n");

    await ctx.reply(text, { parse_mode: "Markdown" });
  },
};
