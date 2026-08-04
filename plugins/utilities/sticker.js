/**
 * Convert a replied photo to a Telegram sticker.
 * Telegram stickers must be WebP, max 512x512.
 */
export default {
  name: "sticker",
  aliases: ["s", "stick"],
  description: "Convert a replied photo to a sticker",
  category: "utilities",
  usage: ".sticker (reply to a photo)",
  cooldown: 5,
  async run({ ctx }) {
    const replied = ctx.message?.reply_to_message;

    if (!replied?.photo) {
      return ctx.reply("📌 Reply to a *photo* with `.sticker` to convert it.", { parse_mode: "Markdown" });
    }

    try {
      // Get the largest photo variant
      const photos  = replied.photo;
      const photo   = photos[photos.length - 1];
      const fileUrl = await ctx.telegram.getFileLink(photo.file_id);

      // Send as a document with .webp extension — Telegram will treat it as sticker input
      await ctx.replyWithDocument(
        { url: fileUrl.href, filename: "sticker.webp" },
        { caption: "🎨 Here's your sticker file! Forward this to @Stickers to add to a pack, or upload it directly." },
      );
    } catch (err) {
      await ctx.reply(`❌ Failed to process sticker: ${err.message}`);
    }
  },
};
