import { getRuntimeSettings, updateRuntimeSetting } from "../../lib/runtimeSettings.mjs";

export default {
  name: "botconfig",
  aliases: ["config", "settings"],
  description: "View or change bot settings (owner only)",
  category: "owner",
  usage: ".botconfig [key] [value]",
  cooldown: 5,
  isOwner: true,
  async run({ ctx, args }) {
    if (!args.length) {
      const s = getRuntimeSettings();
      return ctx.reply(
        `⚙️ *Bot Config*\n\n` +
        `Name: \`${s.botName}\`\n` +
        `Prefix: \`${s.prefix}\`\n` +
        `Owner: \`${s.ownerNumber}\`\n` +
        `Layout: \`${s.layout}\`\n\n` +
        `Usage: \`.botconfig <key> <value>\`\n` +
        `Keys: \`botName\`, \`prefix\`, \`ownerNumber\`, \`layout\``,
        { parse_mode: "Markdown" },
      );
    }

    const [key, ...rest] = args;
    const value = rest.join(" ");
    if (!value) return ctx.reply("Provide a value: `.botconfig <key> <value>`", { parse_mode: "Markdown" });

    try {
      const updated = updateRuntimeSetting(key, value);
      await ctx.reply(`✅ Updated *${key}* → \`${updated[key]}\``, { parse_mode: "Markdown" });
    } catch (err) {
      await ctx.reply(`❌ ${err.message}`);
    }
  },
};
