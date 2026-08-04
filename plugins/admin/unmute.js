export default {
  name: "unmute",
  aliases: ["unrestrict"],
  description: "Unmute a previously muted user (reply to their message)",
  category: "admin",
  usage: ".unmute (reply to user)",
  cooldown: 5,
  isAdmin: true,
  groupOnly: true,
  async run({ ctx }) {
    const replied = ctx.message?.reply_to_message;
    if (!replied) return ctx.reply("Reply to the message of the user you want to unmute.");

    const userId   = replied.from?.id;
    const username = replied.from?.first_name ?? replied.from?.username ?? "User";
    if (!userId) return ctx.reply("❌ Could not identify the user.");

    try {
      await ctx.restrictChatMember(userId, {
        permissions: {
          can_send_messages:       true,
          can_send_media_messages: true,
          can_send_polls:          true,
          can_send_other_messages: true,
        },
      });
      await ctx.reply(`🔊 *${username}* has been unmuted.`, { parse_mode: "Markdown" });
    } catch (err) {
      await ctx.reply(`❌ Failed to unmute: ${err.message}`);
    }
  },
};
