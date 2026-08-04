export default {
  name: "mute",
  aliases: ["restrict"],
  description: "Mute a user for 1 hour (reply to their message)",
  category: "admin",
  usage: ".mute (reply to user)",
  cooldown: 5,
  isAdmin: true,
  groupOnly: true,
  async run({ ctx, args }) {
    const replied = ctx.message?.reply_to_message;
    if (!replied) return ctx.reply("Reply to the message of the user you want to mute.");

    const userId   = replied.from?.id;
    const username = replied.from?.first_name ?? replied.from?.username ?? "User";
    if (!userId) return ctx.reply("❌ Could not identify the user.");

    // Parse optional duration (minutes)
    const minutes = parseInt(args[0]) || 60;
    const until   = Math.floor(Date.now() / 1000) + minutes * 60;

    try {
      await ctx.restrictChatMember(userId, {
        permissions: {
          can_send_messages:       false,
          can_send_media_messages: false,
          can_send_polls:          false,
          can_send_other_messages: false,
        },
        until_date: until,
      });
      await ctx.reply(`🔇 *${username}* has been muted for ${minutes} minute(s).`, { parse_mode: "Markdown" });
    } catch (err) {
      await ctx.reply(`❌ Failed to mute: ${err.message}`);
    }
  },
};
