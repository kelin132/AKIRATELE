export default {
  name: "calc",
  aliases: ["math", "calculate"],
  description: "Evaluate a math expression",
  category: "utilities",
  usage: ".calc <expression>",
  cooldown: 2,
  async run({ ctx, args }) {
    if (!args.length) return ctx.reply("Usage: `.calc 2 + 2`", { parse_mode: "Markdown" });

    const expr = args.join(" ").replace(/[^0-9+\-*/.()% ]/g, "");
    try {
      // Safe eval: only allow numbers and operators
      if (!/^[\d\s+\-*/.()%]+$/.test(expr)) throw new Error("Invalid characters in expression.");
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${expr})`)();
      if (!isFinite(result)) throw new Error("Result is not finite.");
      await ctx.reply(`🧮 \`${expr}\` = *${result}*`, { parse_mode: "Markdown" });
    } catch (err) {
      await ctx.reply(`❌ Could not evaluate: ${err.message}`);
    }
  },
};
