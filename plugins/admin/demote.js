export default {
  name: "demote",
  aliases: ["deop"],
  description: "Demote a group admin (reply to their message)",
  category: "admin",
  usage: ".demote (reply to user)",
  cooldown: 5,
  isAdmin: true,
  groupOnly: true,
  async run({ ctx }) {
    const replied = ctx.message?.reply_to_message;
    if (!replied) return ctx.reply("Reply to the user you want to demote.");

    const userId   = replied.from?.id;
    const username = replied.from?.first_name ?? replied.from?.username ?? "User";
    if (!userId) return ctx.reply("❌ Could not identify the user.");

    try {
      await ctx.promoteChatMember(userId, {
        can_manage_chat:      false,
        can_delete_messages:  false,
        can_restrict_members: false,
        can_pin_messages:     false,
        can_invite_users:     false,
      });
      await ctx.reply(`⬇️ *${username}* has been demoted.`, { parse_mode: "Markdown" });
    } catch (err) {
      await ctx.reply(`❌ Failed to demote: ${err.message}`);
    }
  },
};
