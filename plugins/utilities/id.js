export default {
  name: "id",
  aliases: ["myid", "chatid", "uid"],
  description: "Get your Telegram ID and chat ID",
  category: "utilities",
  usage: ".id",
  cooldown: 3,
  async run({ ctx }) {
    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;
    const username = ctx.from?.username ? `@${ctx.from.username}` : "none";

    await ctx.reply(
      `🆔 *Your IDs*\n\nUser ID: \`${userId}\`\nUsername: ${username}\nChat ID: \`${chatId}\``,
      { parse_mode: "Markdown" },
    );
  },
};
