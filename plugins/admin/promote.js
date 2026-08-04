export default {
  name: "promote",
  aliases: ["op"],
  description: "Promote a user to group admin (reply to their message)",
  category: "admin",
  usage: ".promote (reply to user)",
  cooldown: 5,
  isAdmin: true,
  groupOnly: true,
  async run({ ctx }) {
    const replied = ctx.message?.reply_to_message;
    if (!replied) return ctx.reply("Reply to the user you want to promote.");

    const userId   = replied.from?.id;
    const username = replied.from?.first_name ?? replied.from?.username ?? "User";
    if (!userId) return ctx.reply("❌ Could not identify the user.");

    try {
      await ctx.promoteChatMember(userId, {
        can_manage_chat:       true,
        can_delete_messages:   true,
        can_restrict_members:  true,
        can_pin_messages:      true,
        can_invite_users:      true,
      });
      await ctx.reply(`⬆️ *${username}* has been promoted to admin.`, { parse_mode: "Markdown" });
    } catch (err) {
      await ctx.reply(`❌ Failed to promote: ${err.message}`);
    }
  },
};
