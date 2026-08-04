import fs from "fs";
import path from "path";

const ADMINS_FILE = path.resolve("database", "admins.json");

function loadAdmins() {
  try {
    if (fs.existsSync(ADMINS_FILE)) return JSON.parse(fs.readFileSync(ADMINS_FILE, "utf8") || "[]");
  } catch (e) { console.error("Error loading admins:", e); }
  return [];
}

function saveAdmins(admins) {
  try {
    const dir = path.dirname(ADMINS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2));
  } catch (e) { console.error("Error saving admins:", e); }
}

export const adminSystem = {
  getAdmins: () => loadAdmins(),
  addAdmin:  (id) => { const a = loadAdmins(); if (!a.includes(id)) { a.push(id); saveAdmins(a); return true; } return false; },
  removeAdmin: (id) => { const a = loadAdmins(); const i = a.indexOf(id); if (i > -1) { a.splice(i, 1); saveAdmins(a); return true; } return false; },
  isAdmin:   (id) => loadAdmins().includes(id),
};
