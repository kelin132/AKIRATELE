import { getRuntimeSettings } from "../../lib/runtimeSettings.mjs";

export default {
  name: "info",
  aliases: ["botinfo", "about"],
  description: "Show information about this bot",
  category: "main",
  usage: ".info",
  cooldown: 5,
  isOwner: false,
  isAdmin: false,
  isPremium: false,
  async run({ ctx }) {
    const s = getRuntimeSettings();
    const me = ctx.botInfo ?? await ctx.telegram.getMe();

    const text = [
      `*${s.botName}* — Bot Info ⚡`,
      ``,
      `🤖 Username: @${me.username}`,
      `📛 Name: ${me.first_name}`,
      `👑 Owner: ${s.ownerNumber || "Not configured"}`,
      `⚡ Prefix: \`${s.prefix}\``,
      `📦 Platform: Telegram`,
      `📅 Node: ${process.version}`,
      ``,
      `_Powered by KELIN MD_`,
    ].join("\n");

    await ctx.reply(text, { parse_mode: "Markdown" });
  },
};
