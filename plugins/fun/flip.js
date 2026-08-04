export default {
  name: "flip",
  aliases: ["coinflip", "coin"],
  description: "Flip a coin",
  category: "fun",
  usage: ".flip",
  cooldown: 2,
  async run({ ctx }) {
    const result = Math.random() < 0.5 ? "🪙 *Heads!*" : "🪙 *Tails!*";
    await ctx.reply(result, { parse_mode: "Markdown" });
  },
};
