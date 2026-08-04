import os from "os";

export default {
  name: "runtime",
  aliases: ["stats", "sys"],
  description: "Show bot runtime statistics",
  category: "main",
  usage: ".runtime",
  cooldown: 10,
  isOwner: false,
  isAdmin: false,
  isPremium: false,
  async run({ ctx }) {
    const uptime = process.uptime();
    const days   = Math.floor(uptime / 86400);
    const h      = Math.floor((uptime % 86400) / 3600);
    const m      = Math.floor((uptime % 3600) / 60);
    const s      = Math.floor(uptime % 60);

    const mem    = process.memoryUsage();
    const freeMb = Math.round(os.freemem() / 1024 / 1024);
    const totMb  = Math.round(os.totalmem() / 1024 / 1024);
    const rssMb  = Math.round(mem.rss / 1024 / 1024);

    const text = [
      `⚡ *Runtime Stats*`,
      ``,
      `⏱ Uptime: \`${days}d ${h}h ${m}m ${s}s\``,
      `🧠 RSS: \`${rssMb} MB\``,
      `💾 System RAM: \`${freeMb} / ${totMb} MB\``,
      `💻 CPU: \`${os.cpus()[0]?.model ?? "unknown"}\``,
      `🖥️ Platform: \`${process.platform}\``,
      `📦 Node: \`${process.version}\``,
    ].join("\n");

    await ctx.reply(text, { parse_mode: "Markdown" });
  },
};
