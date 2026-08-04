/**
 * KELIN MD — Logger
 * Lightweight console logger with timestamps and level prefixes.
 */

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const CURRENT = LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LEVELS.info;

const COLORS = {
  error: "\x1b[31m",  // red
  warn:  "\x1b[33m",  // yellow
  info:  "\x1b[36m",  // cyan
  debug: "\x1b[90m",  // grey
  reset: "\x1b[0m",
};

export function log(level, ...args) {
  if ((LEVELS[level] ?? 999) > CURRENT) return;
  const ts   = new Date().toISOString().replace("T", " ").slice(0, 19);
  const col  = COLORS[level] ?? "";
  const rst  = COLORS.reset;
  const tag  = `[${level.toUpperCase()}]`.padEnd(7);
  const msg  = args.map(a => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
  // eslint-disable-next-line no-console
  (level === "error" ? console.error : console.log)(`${col}${ts} ${tag}${rst} ${msg}`);
}

export default log;
