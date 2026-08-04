const DARES = [
  "Send a voice message singing happy birthday.",
  "Change your display name to 'I Love Pickles' for 10 minutes.",
  "Send a selfie with a funny face.",
  "Write a 3-sentence story about a potato.",
  "Spell your name using only emojis.",
  "Say something nice about every person in this chat.",
  "Do your best robot impression and record a video.",
  "Text the third person in your contacts 'I think you're amazing'.",
  "Type the alphabet backwards.",
  "Make up a poem about the last person who texted you.",
];

export default {
  name: "dare",
  aliases: ["d"],
  description: "Get a dare for truth or dare",
  category: "fun",
  usage: ".dare",
  cooldown: 3,
  isOwner: false,
  async run({ ctx }) {
    const d = DARES[Math.floor(Math.random() * DARES.length)];
    await ctx.reply(`😈 *Dare:*\n\n_${d}_`, { parse_mode: "Markdown" });
  },
};
