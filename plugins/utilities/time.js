export default {
  name: "time",
  aliases: ["date", "now"],
  description: "Show the current date and time",
  category: "utilities",
  usage: ".time",
  cooldown: 3,
  async run({ ctx }) {
    const tz  = process.env.TZ || "UTC";
    const now = new Date().toLocaleString("en-US", { timeZone: tz, hour12: true });
    await ctx.reply(`🕐 *Current Time*\n\`${now}\`\n_Timezone: ${tz}_`, { parse_mode: "Markdown" });
  },
};
