export default {
  name: "ban",
  aliases: ["block"],
  description: "Ban a user from the group permanently (reply to their message)",
  category: "admin",
  usage: ".ban (reply to user)",
  cooldown: 5,
  isAdmin: true,
  groupOnly: true,
  async run({ ctx }) {
    const replied = ctx.message?.reply_to_message;
    if (!replied) return ctx.reply("Reply to the message of the user you want to ban.");

    const userId   = replied.from?.id;
    const username = replied.from?.first_name ?? replied.from?.username ?? "User";
    if (!userId) return ctx.reply("❌ Could not identify the user.");

    try {
      await ctx.banChatMember(userId);
      await ctx.reply(`🚫 *${username}* has been permanently banned.`, { parse_mode: "Markdown" });
    } catch (err) {
      await ctx.reply(`❌ Failed to ban: ${err.message}`);
    }
  },
};
