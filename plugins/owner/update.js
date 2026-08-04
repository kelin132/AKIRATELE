import { existsSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export default {
  name: "update",
  aliases: ["gitpull", "pull"],
  description: "Pull the latest changes from GitHub (owner only)",
  category: "owner",
  usage: ".update",
  cooldown: 30,
  isOwner: true,

  async run({ ctx }) {
    const rootDir = path.resolve(".");
    const gitDir  = path.join(rootDir, ".git");

    // ── Guard: git must be present ─────────────────────────────────────────
    if (!existsSync(gitDir)) {
      return ctx.reply(
        `❌ *Git not available!*\n\nMake sure .git folder exists and git is installed.`,
        { parse_mode: "Markdown" },
      );
    }

    const statusMsg = await ctx.reply("⏳ *Pulling latest changes…*", { parse_mode: "Markdown" });

    try {
      const { stdout, stderr } = await execAsync("git pull", { cwd: rootDir, timeout: 30_000 });
      const output = (stdout || stderr || "").trim();

      // ── Already up to date ───────────────────────────────────────────────
      if (output.toLowerCase().includes("already up to date")) {
        return ctx.reply("✅ *Already up to date!* No new changes.", { parse_mode: "Markdown" });
      }

      // ── Changes pulled ───────────────────────────────────────────────────
      // Extract the changed-file summary (lines like "  plugins/cards/si.js | 5 ++---")
      const lines  = output.split("\n");
      const summary = lines
        .filter((l) => l.includes("|") || l.match(/\d+ file/))
        .join("\n")
        .trim();

      const reply =
        `✅ *Bot updated successfully!*\n\n` +
        (summary
          ? `\`\`\`\n${summary.slice(0, 800)}\n\`\`\`\n\n`
          : `\`\`\`\n${output.slice(0, 800)}\n\`\`\`\n\n`) +
        `♻️ _Restart the bot to apply changes._`;

      return ctx.reply(reply, { parse_mode: "Markdown" });

    } catch (err) {
      const msg = (err.stderr || err.stdout || err.message || "Unknown error").trim();
      return ctx.reply(
        `❌ *Git pull failed!*\n\n\`\`\`\n${msg.slice(0, 800)}\n\`\`\``,
        { parse_mode: "Markdown" },
      );
    }
  },
};
