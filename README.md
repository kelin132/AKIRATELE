# KELIN MD ⚡ — Telegram Bot

Premium Telegram bot with 35+ commands — AI, economy, group management, games, fun.

---

## 🚀 Deploy on katabump / Pterodactyl

### 1. Set Start Command
```
node index.telegram.js
```

### 2. Set Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | ✅ | From @BotFather → `/newbot` |
| `OWNER_NUMBER` | ✅ | Your numeric Telegram user id (from @userinfobot) |
| `MONGO_URI` | ❌ | MongoDB URI — needed for economy, group settings |
| `GEMINI_API_KEY` | ❌ | Gemini AI key — needed for `.gemini` and `.akira` |
| `BOT_NAME` | ❌ | Display name (default: `KELIN MD`) |
| `PREFIX` | ❌ | Command prefix (default: `.`) |
| `TZ` | ❌ | Timezone (default: `Africa/Harare`) |

### 3. Install dependencies
```
npm install
```

### 4. Start
```
node index.telegram.js
```

---

## 📋 Commands

### 🏠 Main
| Command | Description |
|---|---|
| `.ping` | Check response time |
| `.alive` | Show bot status |
| `.menu` | All commands list |
| `.info` | Bot information |
| `.runtime` | System stats |

### 🤖 AI
| Command | Description |
|---|---|
| `.gemini <q>` | Ask Gemini AI (needs `GEMINI_API_KEY`) |
| `.akira <msg>` | Chat with Akira (persistent per-user context) |

### 🎉 Fun
| Command | Description |
|---|---|
| `.joke` | Random joke |
| `.truth` | Truth question |
| `.dare` | Dare challenge |
| `.quote` | Inspirational quote |
| `.flip` | Coin flip |
| `.roll [n]` | Roll dice (default d6) |

### 🔧 Utilities
| Command | Description |
|---|---|
| `.calc <expr>` | Math calculator |
| `.id` | Your Telegram + Chat IDs |
| `.time` | Current time |
| `.sticker` | Convert replied photo to sticker |

### 👥 Group (admin required)
| Command | Description |
|---|---|
| `.antilink [on/off]` | Block links in group |
| `.welcome [on/off]` | Welcome new members |
| `.goodbye [on/off]` | Farewell messages |

### 🛡️ Admin
| Command | Description |
|---|---|
| `.kick` | Kick user (reply to message) |
| `.ban` | Permanently ban user |
| `.mute [mins]` | Mute user (default 60 min) |
| `.unmute` | Unmute user |
| `.promote` | Make user an admin |
| `.demote` | Remove admin rights |

### 💰 Economy (requires MongoDB)
| Command | Description |
|---|---|
| `.balance` | Check your coins |
| `.daily` | Claim daily reward (500 coins) |
| `.deposit <n>` | Move wallet → bank |
| `.withdraw <n>` | Move bank → wallet |
| `.pay <n>` | Send coins to a user |

### 🎮 Games
| Command | Description |
|---|---|
| `.ttt` | Tic Tac Toe vs bot |

### 👑 Owner
| Command | Description |
|---|---|
| `.broadcast <msg>` | Send to all known groups |
| `.eval <code>` | Execute JS |
| `.botconfig [k] [v]` | Change bot settings |

---

## 🔌 Plugin System

Add a plugin in `plugins/<category>/myplugin.js`:

```js
export default {
  name: "hello",
  description: "Say hello",
  category: "fun",
  usage: ".hello",
  cooldown: 3,
  isOwner: false,
  isAdmin: false,
  isPremium: false,
  async run({ ctx, args, prefix, perms, isGroup }) {
    await ctx.reply("Hello! 👋");
  },
};
```

Restart the bot to load new plugins.

---

© KELIN MD
