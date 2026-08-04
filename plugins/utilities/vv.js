// plugins/utilities/vv.js
// .vv — Resend a view-once image/video as normal media.
//
// NOTE (Telegram build): "view-once" is a WhatsApp-specific message type.
// Telegram's Bot API does not deliver self-destructing photo/video content
// to bots, so there's no equivalent to reveal here. This command is stubbed
// out with a friendly message on Telegram; it still works unmodified on the
// WhatsApp build (index.js + lib/bot.mjs).

export default {
  name: "vv",
  description: "Resend a view-once media as normal media (WhatsApp only)",
  category: "utilities",
  usage: ".vv  (reply to a view-once message)",
  aliases: ["viewonce"],
  cooldown: 3,
  isOwner: false,
  isAdmin: false,
  isPremium: false,
  version: "2.0.0",

  async run({ sock, msg }) {
    const jid = msg.key.remoteJid;
    return sock.sendMessage(
      jid,
      { text: "❌ View-once media is a WhatsApp-only feature — there's no equivalent on Telegram." },
      { quoted: msg }
    );
  },
};
