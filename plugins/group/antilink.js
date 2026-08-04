import { getGroupSettings, setGroupSetting } from "../../lib/groupSettings.js";

export default {
  name: "antilink",
  aliases: ["al"],
  description: "Toggle link blocking in this group",
  category: "group",
  usage: ".antilink [on|off]",
  cooldown: 5,
  isAdmin: true,
  groupOnly: true,
  async run({ ctx, args }) {
    const chatId = String(ctx.chat.id);
    const settings = await getGroupSettings(chatId);

    if (!args.length) {
      return ctx.reply(`🔗 Anti-link is currently *${settings.antiLink ? "ON ✅" : "OFF ❌"}*.\n\nUse \`.antilink on\` or \`.antilink off\`.`, { parse_mode: "Markdown" });
    }

    const toggle = args[0].toLowerCase();
    if (!["on", "off"].includes(toggle)) {
      return ctx.reply("Usage: `.antilink on` or `.antilink off`", { parse_mode: "Markdown" });
    }

    const value = toggle === "on";
    await setGroupSetting(chatId, "antiLink", value);
    await ctx.reply(`✅ Anti-link turned *${toggle.toUpperCase()}* for this group.`, { parse_mode: "Markdown" });
  },
};
