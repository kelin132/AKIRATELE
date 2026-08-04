export default {
  name: "roll",
  aliases: ["dice", "d6"],
  description: "Roll a dice (or specify sides: .roll 20)",
  category: "fun",
  usage: ".roll [sides]",
  cooldown: 2,
  async run({ ctx, args }) {
    const sides = Math.min(Math.max(parseInt(args[0]) || 6, 2), 1000);
    const result = Math.floor(Math.random() * sides) + 1;
    await ctx.reply(`🎲 Rolled a d${sides}: *${result}*`, { parse_mode: "Markdown" });
  },
};
