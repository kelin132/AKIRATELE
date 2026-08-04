import { getGroupSettings, setGroupSetting } from "../../lib/groupSettings.js";

export default {
  name: "goodbye",
  aliases: ["bye", "farewell"],
  description: "Toggle goodbye messages for this group",
  category: "group",
  usage: ".goodbye [on|off]",
  cooldown: 5,
  isAdmin: true,
  groupOnly: true,
  async run({ ctx, args }) {
    const chatId   = String(ctx.chat.id);
    const settings = await getGroupSettings(chatId);

    if (!args.length) {
      return ctx.reply(`👋 Goodbye messages are *${settings.goodbye ? "ON ✅" : "OFF ❌"}*.\n\nUse \`.goodbye on\` or \`.goodbye off\`.`, { parse_mode: "Markdown" });
    }

    const toggle = args[0].toLowerCase();
    if (!["on", "off"].includes(toggle)) {
      return ctx.reply("Usage: `.goodbye on` or `.goodbye off`");
    }

    await setGroupSetting(chatId, "goodbye", toggle === "on");
    await ctx.reply(`✅ Goodbye messages turned *${toggle.toUpperCase()}*.`, { parse_mode: "Markdown" });
  },
};
