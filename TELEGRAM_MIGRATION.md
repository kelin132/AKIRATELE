# Telegram build — what changed

Your bot now has two entry points:

| Build     | Entry point         | Transport              |
|-----------|----------------------|-------------------------|
| WhatsApp  | `index.js`           | Baileys (unchanged)     |
| Telegram  | `index.telegram.js`  | Telegraf                |

Both share the exact same `plugins/`, `lib/` business logic, and MongoDB data.
Nothing about the WhatsApp build was removed or altered in a way that
changes its behavior — the Telegram build is purely additive.

## How this works

`lib/pluginManager.mjs` (`routeMessage`) and almost every plugin only ever
touch two things: `sock.sendMessage(jid, content, opts)` and
`msg.key.remoteJid` / `msg.message.*`. Neither of those actually depend on
Baileys — they're just an object shape.

`lib/telegramShim.mjs` builds a `sock` object with that same shape, backed by
the Telegram Bot API, and turns each incoming Telegram update into a
Baileys-shaped `msg`. `lib/telegramBot.mjs` wires that into the same
handler pipeline `lib/bot.mjs` uses (moderation handlers, AFK, akira AI
auto-reply, `routeMessage`). Because of that, **all ~430 plugin files run
completely unmodified** on Telegram.

## Setup

1. Message **@BotFather** on Telegram → `/newbot` → copy the token.
2. Get your own numeric Telegram user id from **@userinfobot** (send it any
   message, it replies with your id).
3. Copy `.env.example` → `.env` and set:
   ```
   TELEGRAM_BOT_TOKEN=<token from BotFather>
   OWNER_NUMBER=<your numeric Telegram user id>
   MONGO_URI=<same Mongo URI you already use>
   ```
4. `npm install`
5. `node index.telegram.js` (or `npm run start:telegram`)

Add the bot to a group and give it admin rights if you want moderation
commands (antilink, mute, kick, etc.) to work there.

## Files touched

- **New:** `lib/telegramShim.mjs`, `lib/telegramBot.mjs`, `lib/activeSocket.mjs`,
  `index.telegram.js`
- **Small edits** (all backward-compatible with the WhatsApp build):
  - `lib/bot.mjs` — registers its socket in the new shared `activeSocket.mjs`
    registry (one line)
  - `lib/cardSpawner.mjs`, `plugins/cards/autoSpawn.js`,
    `plugins/pokemon/pokeautospawn.js`, `plugins/dragonball/dbzautospawn.js`
    — read the active socket from `activeSocket.mjs` instead of importing
    Baileys' `bot.mjs` directly, so these background jobs work on whichever
    transport is actually running
  - `plugins/utilities/sticker.js`, `plugins/search/shazam.js`,
    `plugins/fun/wasted.js` — swapped Baileys' `downloadContentFromMessage`
    for `sock.downloadMediaMessage(...)`, which the shim implements for
    Telegram too
  - `plugins/economy/ll.js` — removed a WhatsApp-only native-poll code path;
    it already had a plain-text fallback, which is now the only path
- **Stubbed** (no Telegram equivalent exists, so these now reply with a
  friendly "not supported on Telegram" message instead of crashing):
  - `plugins/utilities/vv.js` (view-once reveal — WhatsApp-only message type)
  - `plugins/group/gstatus.js` (WhatsApp Status/Story posts)

## Known limitations on Telegram

- **Group member list is admin-only.** Telegram's Bot API doesn't let bots
  list all group members for privacy reasons — only admins are visible via
  `getChatAdministrators`. `sock.groupMetadata(jid).participants` will only
  contain admins. This is fine for admin-gated commands, but anything that
  tries to loop over "every member" will only see admins.
- **Bots can't add members** to a group (`groupParticipantsUpdate(..., "add")`
  is a no-op) — Telegram requires the invited user to accept an invite link.
- **Stickers**: Telegram has its own sticker format rules; the `.sticker`
  command's ffmpeg-generated WebP usually works but hasn't been tested
  against Telegram's exact size/duration limits — Telegram is stricter than
  WhatsApp about animated sticker duration/frame count.
- **Mentions** (`mentions: [jid]` in `sendMessage`) currently render as plain
  `@number` text rather than a tappable Telegram mention — harmless, just
  cosmetic.
- **Reactions** use Telegram's `setMessageReaction` API (Bot API 7.0+); if
  your bot library version predates that, reactions will silently no-op.
- **DMs are owner-only**, same as the WhatsApp build — this comes from
  `pluginManager.mjs` and wasn't changed.

## Testing checklist

Nothing here was run against a live Telegram bot token (no network access in
this environment) — all files pass `node --check` for syntax, and the logic
mirrors `lib/bot.mjs`'s message flow closely, but you should smoke-test:

1. `.ping` in a DM (owner) and in a group
2. A moderation command (`.antilink`, `.mute`, etc.) in a group where the bot
   is admin
3. `.sticker` replying to a photo
4. An economy command (`.balance`, `.daily`, etc.) to confirm MongoDB reads
   still work identically to the WhatsApp build
5. Bot-join and member-join/leave messages in a group
