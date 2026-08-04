/**
 * .update — Download latest code from GitHub and hot-swap files.
 * Works even when git is NOT installed on the server.
 *
 * Set GITHUB_TOKEN in your panel env vars if the repo is private.
 * GITHUB_REPO can also be overridden (default: kelin132/AKIRATELE).
 */
import { exec } from "child_process";
import { promisify } from "util";
import { createWriteStream, mkdirSync, readdirSync, statSync, copyFileSync, rmSync } from "fs";
import { pipeline } from "stream/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

const REPO   = process.env.GITHUB_REPO   || "kelin132/AKIRATELE";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN  = process.env.GITHUB_TOKEN  || "";

// Folders/files to never overwrite
const SKIP = new Set([
  "node_modules", ".git", "sessions", "database",
  "data", ".env", "settings.cjs", "package-lock.json",
]);

function copyDirRecursive(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    if (SKIP.has(entry)) continue;
    const srcPath  = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

async function downloadZip(url, destFile) {
  const headers = { "User-Agent": "KELIN-MD-bot" };
  if (TOKEN) headers["Authorization"] = `token ${TOKEN}`;
  const res = await fetch(url, { headers, redirect: "follow" });
  if (!res.ok) throw new Error(`GitHub returned HTTP ${res.status}`);
  await pipeline(res.body, createWriteStream(destFile));
}

export default {
  name: "update",
  aliases: ["gitpull", "pull"],
  description: "Download latest bot files from GitHub (owner only)",
  category: "owner",
  usage: ".update",
  cooldown: 60,
  isOwner: true,

  async run({ ctx }) {
    await ctx.reply("⏳ Checking for updates…");

    const tmpDir  = path.join(os.tmpdir(), `akira-update-${Date.now()}`);
    const zipFile = `${tmpDir}.zip`;

    try {
      // ── 1. Try git pull first (fast path if git is available) ───────────────
      try {
        const { stdout: root } = await execAsync("git rev-parse --show-toplevel", { timeout: 8_000 });
        const cwd = root.trim();
        const { stdout, stderr } = await execAsync("git pull", { cwd, timeout: 30_000 });
        const out = (stdout || stderr || "").trim();

        if (out.toLowerCase().includes("already up to date")) {
          return ctx.reply("✅ Already up to date! No new changes.");
        }

        const summary = out.split("\n")
          .filter(l => l.includes("|") || l.match(/\d+ file/))
          .join("\n").trim();

        return ctx.reply(
          "✅ Updated via git!\n\n" +
          (summary || out).slice(0, 700) +
          "\n\n♻️ Restart to apply changes."
        );
      } catch {
        // git not available — fall through to zip method
      }

      // ── 2. Download zip from GitHub ─────────────────────────────────────────
      await ctx.reply("📦 Downloading update from GitHub…");

      const zipUrl = TOKEN
        ? `https://api.github.com/repos/${REPO}/zipball/${BRANCH}`
        : `https://github.com/${REPO}/archive/refs/heads/${BRANCH}.zip`;

      mkdirSync(tmpDir, { recursive: true });
      await downloadZip(zipUrl, zipFile);

      // ── 3. Extract zip ──────────────────────────────────────────────────────
      await execAsync(`unzip -q -o "${zipFile}" -d "${tmpDir}"`, { timeout: 30_000 });

      const extracted = readdirSync(tmpDir).find(f =>
        statSync(path.join(tmpDir, f)).isDirectory()
      );
      if (!extracted) throw new Error("Could not find extracted folder in zip.");

      const srcRoot  = path.join(tmpDir, extracted);
      const destRoot = path.resolve(".");

      // ── 4. Copy files (skip sensitive/runtime dirs) ─────────────────────────
      copyDirRecursive(srcRoot, destRoot);

      // ── 5. Cleanup ──────────────────────────────────────────────────────────
      try { rmSync(zipFile); } catch {}
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}

      return ctx.reply(
        "✅ Bot updated successfully!\n\n" +
        `Repo: ${REPO} @ ${BRANCH}\n` +
        "Skipped: sessions, database, .env, node_modules\n\n" +
        "♻️ Restart the bot to apply changes."
      );

    } catch (err) {
      try { rmSync(zipFile); } catch {}
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}

      const msg = (err.message || "Unknown error").slice(0, 500);

      if (msg.includes("401") || msg.includes("404")) {
        return ctx.reply(
          "❌ GitHub access denied!\n\n" +
          `If ${REPO} is private, set GITHUB_TOKEN in your panel environment variables.`
        );
      }

      return ctx.reply(`❌ Update failed!\n\n${msg}`);
    }
  },
};
