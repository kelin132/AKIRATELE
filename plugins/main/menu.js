import { getRuntimeSettings } from "../../lib/runtimeSettings.mjs";
import { getAllPlugins } from "../../lib/pluginManager.mjs";

export default {
  name: "menu",
  aliases: ["help", "commands"],
  description: "Show all available commands",
  category: "main",
  usage: ".menu",
  cooldown: 5,
  isOwner: false,
  isAdmin: false,
  isPremium: false,
  async run({ ctx, prefix }) {
    const s       = getRuntimeSettings();
    const plugins = getAllPlugins();

    // Group by category
    const byCategory = {};
    for (const p of plugins) {
      const cat = p.category || "misc";
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(p);
    }

    const catEmoji = {
      main:      "🏠",
      ai:        "🤖",
      fun:       "🎉",
      games:     "🎮",
      group:     "👥",
      admin:     "🛡️",
      owner:     "👑",
      economy:   "💰",
      utilities: "🔧",
      search:    "🔍",
      media:     "🎬",
      anime:     "🌸",
      download:  "⬇️",
      misc:      "📦",
    };

    let text = `*${s.botName}* — Command Menu ⚡\n`;
    text += `Prefix: \`${prefix}\`\n\n`;

    for (const [cat, cmds] of Object.entries(byCategory)) {
      const emoji = catEmoji[cat] || "📦";
      text += `${emoji} *${cap(cat)}*\n`;
      for (const c of cmds) {
        const badge = c.isOwner ? " 👑" : c.isAdmin ? " 🛡️" : c.isPremium ? " 💎" : "";
        text += `  \`${prefix}${c.name}\`${badge} — ${c.description || "-"}\n`;
      }
      text += "\n";
    }

    text += `_Total: ${plugins.length} commands_`;
    await ctx.reply(text, { parse_mode: "Markdown" });
  },
};

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
