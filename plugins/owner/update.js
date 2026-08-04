import { exec } from "child_process";
import { promisify } from "util";

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
    await ctx.reply("⏳ *Pulling latest changes…*", { parse_mode: "Markdown" });

    try {
      // Let git find its own repo root — works regardless of cwd
      const { stdout: repoRoot } = await execAsync("git rev-parse --show-toplevel", { timeout: 10_000 });
      const cwd = repoRoot.trim();

      const { stdout, stderr } = await execAsync("git pull", { cwd, timeout: 30_000 });
      const output = (stdout || stderr || "").trim();

      // ── Already up to date ─────────────────────────────────────────────────
      if (output.toLowerCase().includes("already up to date")) {
        return ctx.reply("✅ *Already up to date!* No new changes.", { parse_mode: "Markdown" });
      }

      // ── Changes pulled — show file summary ────────────────────────────────
      const lines   = output.split("\n");
      const summary = lines
        .filter((l) => l.includes("|") || l.match(/\d+ file/))
        .join("\n")
        .trim();

      const replyText =
        `✅ *Bot updated successfully!*\n\n` +
        `\`\`\`\n${(summary || output).slice(0, 800)}\n\`\`\`\n\n` +
        `♻️ _Restart the bot to apply changes._`;

      return ctx.reply(replyText, { parse_mode: "Markdown" });

    } catch (err) {
      const raw = (err.stderr || err.stdout || err.message || "Unknown error").trim();

      // Friendly message when git itself isn't available or no repo found
      if (raw.includes("not a git repository") || raw.includes("not found") || raw.includes("No such file")) {
        return ctx.reply(
          `❌ *Git not available!*\n\nMake sure the bot is deployed as a git clone and git is installed on the server.`,
          { parse_mode: "Markdown" },
        );
      }

      return ctx.reply(
        `❌ *Git pull failed!*\n\n\`\`\`\n${raw.slice(0, 800)}\n\`\`\``,
        { parse_mode: "Markdown" },
      );
    }
  },
};
