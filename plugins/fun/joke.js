import { requestJson } from "../../lib/http.mjs";

export default {
  name: "joke",
  aliases: ["j"],
  description: "Get a random joke",
  category: "fun",
  usage: ".joke",
  cooldown: 3,
  isOwner: false,
  isAdmin: false,
  isPremium: false,
  async run({ ctx }) {
    try {
      const data = await requestJson("https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,racist,sexist&type=twopart");
      if (data.type === "twopart") {
        await ctx.reply(`😂 *${data.setup}*\n\n||${data.delivery}||`, { parse_mode: "MarkdownV2" });
      } else {
        await ctx.reply(`😂 ${data.joke}`);
      }
    } catch {
      const fallback = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "I told my wife she was drawing her eyebrows too high. She looked surprised.",
        "Why did the scarecrow win an award? Because he was outstanding in his field!",
        "What do you call fake spaghetti? An impasta!",
        "Why couldn't the bicycle stand up by itself? It was two-tired!",
      ];
      await ctx.reply(`😂 ${fallback[Math.floor(Math.random() * fallback.length)]}`);
    }
  },
};
