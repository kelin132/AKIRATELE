export default {
  name: "kick",
  aliases: ["remove"],
  description: "Kick a user from the group (reply to their message)",
  category: "admin",
  usage: ".kick (reply to user)",
  cooldown: 5,
  isAdmin: true,
  groupOnly: true,
  async run({ ctx }) {
    const replied = ctx.message?.reply_to_message;
    if (!replied) return ctx.reply("Reply to the message of the user you want to kick.");

    const userId   = replied.from?.id;
    const username = replied.from?.first_name ?? replied.from?.username ?? "User";

    if (!userId) return ctx.reply("❌ Could not identify the user.");

    try {
      await ctx.banChatMember(userId);
      await ctx.unbanChatMember(userId);  // unban so they can rejoin if invited
      await ctx.reply(`✅ *${username}* has been kicked from the group.`, { parse_mode: "Markdown" });
    } catch (err) {
      await ctx.reply(`❌ Failed to kick: ${err.message}`);
    }
  },
};
