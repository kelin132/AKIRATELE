/**
 * KELIN MD — Telegram compatibility shim
 *
 * Every plugin in plugins/** and most of lib/** was written against the
 * Baileys (WhatsApp) `sock` + `msg` shapes:
 *
 *   sock.sendMessage(jid, { text | image | video | audio | sticker | document }, { quoted })
 *   sock.groupMetadata(jid)          -> { subject, participants: [{ id, admin }] }
 *   sock.groupParticipantsUpdate(jid, [jid], "add"|"remove"|"promote"|"demote")
 *   sock.profilePictureUrl(jid)
 *   sock.downloadMediaMessage({ key, message })
 *   sock.sendPresenceUpdate("composing", jid)
 *   sock.user.id
 *   msg.key.remoteJid / msg.key.participant / msg.key.fromMe
 *   msg.message.conversation | extendedTextMessage.text | imageMessage.caption | ...
 *   msg.message.*.contextInfo.{stanzaId,participant,quotedMessage,mentionedJid}
 *
 * This file builds a `sock` object with that exact surface, backed by the
 * Telegram Bot API (via Telegraf), plus a `buildMsg(ctx)` function that turns
 * a Telegraf context into a Baileys-shaped `msg`. lib/pluginManager.mjs and
 * every plugin then run completely unchanged.
 *
 * JID convention used throughout this shim:
 *   Telegram user id  123456789     -> "123456789@s.whatsapp.net"
 *   Telegram chat id  -1001234567890 -> "1001234567890@g.us"
 * (sign is dropped and recovered on the way back — negative = group)
 */

import { log } from "./logger.mjs";

// ── JID <-> Telegram id helpers ────────────────────────────────────────────

export function userIdToJid(id) {
  return `${id}@s.whatsapp.net`;
}

export function chatIdToJid(id, isGroup) {
  const digits = String(Math.abs(Number(id)));
  return isGroup ? `${digits}@g.us` : `${digits}@s.whatsapp.net`;
}

/** Reverse of the two helpers above — returns a numeric Telegram chat/user id. */
export function jidToChatId(jid = "") {
  const digits = jid.split("@")[0].split(":")[0].replace(/\D/g, "");
  const isGroup = jid.endsWith("@g.us");
  const n = Number(digits);
  return isGroup ? -n : n;
}

function notSupported(name) {
  return async () => {
    throw new Error(`${name} is not available on Telegram`);
  };
}

// ── Building the Baileys-shaped `msg` from a Telegraf ctx ──────────────────

function mediaNodeFromTgMessage(m) {
  if (!m) return null;
  if (m.photo?.length) {
    const largest = m.photo[m.photo.length - 1];
    return { key: "imageMessage", node: { caption: m.caption || "", _tgFileId: largest.file_id } };
  }
  if (m.video) return { key: "videoMessage", node: { caption: m.caption || "", _tgFileId: m.video.file_id, mimetype: m.video.mime_type } };
  if (m.animation) return { key: "videoMessage", node: { caption: m.caption || "", _tgFileId: m.animation.file_id, gifPlayback: true } };
  if (m.voice) return { key: "audioMessage", node: { _tgFileId: m.voice.file_id, ptt: true, mimetype: m.voice.mime_type } };
  if (m.audio) return { key: "audioMessage", node: { _tgFileId: m.audio.file_id, ptt: false, mimetype: m.audio.mime_type } };
  if (m.sticker) return { key: "stickerMessage", node: { _tgFileId: m.sticker.file_id } };
  if (m.document) return { key: "documentMessage", node: { _tgFileId: m.document.file_id, fileName: m.document.file_name, mimetype: m.document.mime_type } };
  return null;
}

/** Build the quotedMessage node (Baileys shape) from a reply_to_message. */
function buildQuotedMessage(replyMsg) {
  if (!replyMsg) return null;
  const media = mediaNodeFromTgMessage(replyMsg);
  if (media) return { [media.key]: media.node };
  const text = replyMsg.text || replyMsg.caption || "";
  return { conversation: text };
}

/**
 * Turn a Telegraf ctx (any update containing `.message`) into a Baileys-shaped
 * `msg` object. Returns null for update types we don't route (e.g. edited
 * messages, callback queries handled elsewhere).
 */
export function buildMsg(ctx) {
  const m = ctx.message;
  if (!m) return null;

  const chat = m.chat;
  const from = m.from;
  const isGroup = chat.type === "group" || chat.type === "supergroup";
  const remoteJid = chatIdToJid(chat.id, isGroup);
  const participant = isGroup ? userIdToJid(from.id) : undefined;

  let contextInfo;
  if (m.reply_to_message) {
    const quotedMessage = buildQuotedMessage(m.reply_to_message);
    contextInfo = quotedMessage
      ? {
          stanzaId: String(m.reply_to_message.message_id),
          participant: userIdToJid(m.reply_to_message.from?.id ?? from.id),
          quotedMessage,
          mentionedJid: (m.entities || [])
            .filter((e) => e.type === "text_mention" && e.user)
            .map((e) => userIdToJid(e.user.id)),
        }
      : undefined;
  }

  const media = mediaNodeFromTgMessage(m);
  const messageNode = {};

  if (media) {
    messageNode[media.key] = { ...media.node, ...(contextInfo ? { contextInfo } : {}) };
  } else {
    const text = m.text || m.caption || "";
    messageNode.extendedTextMessage = { text, ...(contextInfo ? { contextInfo } : {}) };
    // Also populate `conversation` so simple `msg.message.conversation` reads work
    // for plain messages with no reply/contextInfo attached.
    if (!contextInfo) messageNode.conversation = text;
  }

  const msg = {
    key: {
      remoteJid,
      participant,
      id: String(m.message_id),
      fromMe: false,
    },
    message: messageNode,
    messageTimestamp: m.date,
    pushName: from.first_name || from.username || "",
    quoted: contextInfo?.quotedMessage || null,
    _tg: { chatId: chat.id, fromId: from.id, raw: m },
  };

  return msg;
}

/** Build a Baileys-shaped group-participants update from new/left members. */
export function buildParticipantUpdate(ctx) {
  const m = ctx.message;
  if (!m) return null;
  const groupJid = chatIdToJid(m.chat.id, true);

  if (m.new_chat_members?.length) {
    return { id: groupJid, action: "add", participants: m.new_chat_members.map((u) => userIdToJid(u.id)) };
  }
  if (m.left_chat_member) {
    return { id: groupJid, action: "remove", participants: [userIdToJid(m.left_chat_member.id)] };
  }
  return null;
}

// ── sendMessage content mapping ─────────────────────────────────────────────

async function resolveSource(value) {
  if (Buffer.isBuffer(value)) return { source: value };
  if (typeof value === "string") return value; // treat as URL
  if (value?.url) return value.url;
  if (value?.source) return value;
  return value;
}

/** Build the `sock` object. `bot` is a Telegraf instance. */
export function buildSock(bot) {
  const telegram = bot.telegram;
  let botInfo = null;

  const sock = {
    user: null, // filled in once bot.telegram.getMe() resolves — see connect step

    async sendMessage(jid, content = {}, options = {}) {
      const chatId = jidToChatId(jid);
      const extra = {};
      if (options.quoted?.key?.id && String(options.quoted.key.remoteJid).includes(jid.split("@")[0])) {
        extra.reply_to_message_id = Number(options.quoted.key.id) || undefined;
      }

      try {
        if (content.delete) {
          return await telegram.deleteMessage(chatId, Number(content.delete.id)).catch(() => null);
        }

        if (content.react) {
          const emoji = content.react.text;
          const msgId = Number(content.react.key?.id);
          if (!emoji) return null; // empty text = remove reaction, skip
          return await telegram
            .callApi("setMessageReaction", {
              chat_id: chatId,
              message_id: msgId,
              reaction: [{ type: "emoji", emoji }],
            })
            .catch(() => null);
        }

        if (content.image) {
          const source = await resolveSource(content.image);
          return await telegram.sendPhoto(chatId, source, { caption: content.caption, ...extra });
        }
        if (content.video) {
          const source = await resolveSource(content.video);
          return await telegram.sendVideo(chatId, source, {
            caption: content.caption,
            ...(content.gifPlayback ? {} : {}),
            ...extra,
          });
        }
        if (content.audio) {
          const source = await resolveSource(content.audio);
          return content.ptt
            ? await telegram.sendVoice(chatId, source, { ...extra })
            : await telegram.sendAudio(chatId, source, { ...extra });
        }
        if (content.sticker) {
          const source = await resolveSource(content.sticker);
          return await telegram.sendSticker(chatId, source, { ...extra });
        }
        if (content.document) {
          const source = await resolveSource(content.document);
          return await telegram.sendDocument(chatId, source, { caption: content.caption, ...extra });
        }
        if (content.text || content.caption) {
          return await telegram.sendMessage(chatId, content.text ?? content.caption, { ...extra });
        }
        return null;
      } catch (err) {
        log("warn", `[telegramShim] sendMessage failed: ${err.message}`);
        return null;
      }
    },

    async sendPresenceUpdate(type, jid) {
      try {
        const chatId = jidToChatId(jid);
        const action = type === "recording" ? "record_voice" : "typing";
        await telegram.sendChatAction(chatId, action);
      } catch {
        /* best-effort only */
      }
    },

    async groupMetadata(jid) {
      const chatId = jidToChatId(jid);
      const chat = await telegram.getChat(chatId);
      let admins = [];
      try {
        admins = await telegram.getChatAdministrators(chatId);
      } catch {
        /* bot may lack rights, or this isn't a group */
      }
      const participants = admins.map((a) => ({
        id: userIdToJid(a.user.id),
        admin: a.status === "creator" ? "superadmin" : a.status === "administrator" ? "admin" : null,
      }));
      return {
        id: jid,
        subject: chat.title || "",
        // NOTE: Telegram bots can only see admins, not the full member list —
        // participants below is admin-only. Good enough for admin-gated
        // commands; anything iterating "every member" will only see admins.
        participants,
      };
    },

    async groupParticipantsUpdate(jid, participants = [], action) {
      const chatId = jidToChatId(jid);
      for (const pJid of participants) {
        const userId = jidToChatId(pJid);
        try {
          if (action === "remove") {
            await telegram.banChatMember(chatId, userId);
            await telegram.unbanChatMember(chatId, userId, { only_if_banned: true });
          } else if (action === "promote") {
            await telegram.promoteChatMember(chatId, userId, {
              can_delete_messages: true,
              can_restrict_members: true,
              can_invite_users: true,
            });
          } else if (action === "demote") {
            await telegram.promoteChatMember(chatId, userId, {});
          }
          // "add" — bots cannot add arbitrary members to a chat; no-op.
        } catch (err) {
          log("warn", `[telegramShim] groupParticipantsUpdate(${action}) failed: ${err.message}`);
        }
      }
    },

    async profilePictureUrl(jid) {
      const userId = jidToChatId(jid);
      const photos = await telegram.getUserProfilePhotos(userId, 0, 1);
      if (!photos?.total_count) throw new Error("No profile photo");
      const fileId = photos.photos[0][photos.photos[0].length - 1].file_id;
      const link = await telegram.getFileLink(fileId);
      return String(link);
    },

    async downloadMediaMessage(fakeMsg) {
      const node = fakeMsg?.message || {};
      const media =
        node.imageMessage || node.videoMessage || node.audioMessage || node.stickerMessage || node.documentMessage;
      const fileId = media?._tgFileId;
      if (!fileId) throw new Error("No downloadable Telegram file on this message");
      const link = await telegram.getFileLink(fileId);
      const res = await fetch(String(link));
      if (!res.ok) throw new Error(`Telegram file download failed: HTTP ${res.status}`);
      const arr = await res.arrayBuffer();
      return Buffer.from(arr);
    },

    async groupLeave(jid) {
      return telegram.leaveChat(jidToChatId(jid));
    },
    async groupInviteCode(jid) {
      return telegram.exportChatInviteLink(jidToChatId(jid));
    },

    // No Telegram Bot API equivalent — these throw so existing try/catch
    // blocks in plugins fall back gracefully instead of crashing.
    groupGetInviteInfo: notSupported("groupGetInviteInfo"),
    groupRevokeInvite: notSupported("groupRevokeInvite"),
    groupAcceptInvite: notSupported("groupAcceptInvite"),
    groupSettingUpdate: notSupported("groupSettingUpdate"),
    onWhatsApp: notSupported("onWhatsApp"),
    requestPairingCode: notSupported("requestPairingCode"),
    relayMessage: notSupported("relayMessage"),
    waUploadToServer: notSupported("waUploadToServer"),
    getBusinessProfile: notSupported("getBusinessProfile"),
    contacts: {},
    store: null,
  };

  // Populate sock.user once, used by permissions.mjs / groupEventHandler.mjs
  telegram
    .getMe()
    .then((me) => {
      botInfo = me;
      sock.user = { id: userIdToJid(me.id), name: me.username, lid: undefined };
    })
    .catch((err) => log("warn", `[telegramShim] getMe() failed: ${err.message}`));

  return sock;
}
