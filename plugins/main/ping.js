export default {
  name: "ping",
  aliases: ["p"],
  description: "Check if the bot is alive and measure response time",
  category: "main",
  usage: ".ping",
  cooldown: 3,
  isOwner: false,
  isAdmin: false,
  isPremium: false,
  async run({ ctx }) {
    const start = Date.now();
    const msg   = await ctx.reply("🏓 Pinging...");
    const ms    = Date.now() - start;
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      msg.message_id,
      undefined,
      `🏓 *Pong!*\n⚡ Response: \`${ms}ms\``,
      { parse_mode: "Markdown" },
    );
  },
};
