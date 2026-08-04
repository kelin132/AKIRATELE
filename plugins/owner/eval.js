/**
 * .eval — execute arbitrary JS (OWNER ONLY)
 * This is a dangerous command. Only the owner should ever run it.
 */
export default {
  name: "eval",
  aliases: ["exec", "run"],
  description: "Execute arbitrary JavaScript (OWNER ONLY — dangerous!)",
  category: "owner",
  usage: ".eval <code>",
  cooldown: 0,
  isOwner: true,
  async run({ ctx, args }) {
    if (!args.length) return ctx.reply("Usage: `.eval <code>`", { parse_mode: "Markdown" });

    const code = args.join(" ");
    try {
      // eslint-disable-next-line no-eval
      let result = await eval(code);
      if (typeof result === "object") result = JSON.stringify(result, null, 2);
      const output = String(result ?? "undefined").slice(0, 3800);
      await ctx.reply(`\`\`\`\n${output}\n\`\`\``, { parse_mode: "Markdown" });
    } catch (err) {
      await ctx.reply(`❌ \`${err.message}\``, { parse_mode: "Markdown" });
    }
  },
};
