const TRUTHS = [
  "Have you ever lied to your best friend?",
  "What is your biggest regret?",
  "Have you ever cheated on a test?",
  "What's the most embarrassing thing that's happened to you?",
  "Have you ever broken something valuable and blamed it on someone else?",
  "What's your biggest secret?",
  "Have you ever had a crush on a friend's partner?",
  "What's the worst thing you've ever done?",
  "Have you ever pretended to be sick to avoid something?",
  "What's a lie you told that you've never confessed to?",
];

export default {
  name: "truth",
  aliases: ["t"],
  description: "Get a truth question for truth or dare",
  category: "fun",
  usage: ".truth",
  cooldown: 3,
  isOwner: false,
  async run({ ctx }) {
    const q = TRUTHS[Math.floor(Math.random() * TRUTHS.length)];
    await ctx.reply(`🤔 *Truth:*\n\n_${q}_`, { parse_mode: "Markdown" });
  },
};
