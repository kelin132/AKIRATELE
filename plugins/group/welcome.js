import { getGroupSettings, setGroupSetting } from "../../lib/groupSettings.js";

export default {
  name: "welcome",
  aliases: ["wlc"],
  description: "Toggle welcome messages for this group",
  category: "group",
  usage: ".welcome [on|off]",
  cooldown: 5,
  isAdmin: true,
  groupOnly: true,
  async run({ ctx, args }) {
    const chatId   = String(ctx.chat.id);
    const settings = await getGroupSettings(chatId);

    if (!args.length) {
      return ctx.reply(`👋 Welcome messages are *${settings.welcome ? "ON ✅" : "OFF ❌"}*.\n\nUse \`.welcome on\` or \`.welcome off\`.`, { parse_mode: "Markdown" });
    }

    const toggle = args[0].toLowerCase();
    if (!["on", "off"].includes(toggle)) {
      return ctx.reply("Usage: `.welcome on` or `.welcome off`", { parse_mode: "Markdown" });
    }

    await setGroupSetting(chatId, "welcome", toggle === "on");
    await ctx.reply(`✅ Welcome messages turned *${toggle.toUpperCase()}*.`, { parse_mode: "Markdown" });
  },
};
