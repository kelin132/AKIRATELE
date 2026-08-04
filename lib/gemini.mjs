/**
 * KELIN MD — Shared Gemini API helper
 * Used by .gemini, .akira, and any AI plugin.
 * Free key at: https://aistudio.google.com/app/apikey
 */

const MODEL = "gemini-2.5-flash";
const BASE  = "https://generativelanguage.googleapis.com/v1beta/models";

// Per-uid conversation history (in-memory, resets on restart)
const _history = new Map();
const MAX_TURNS = 20;

/**
 * Send a prompt to Gemini and return the text response.
 * @param {string} prompt
 * @param {{ systemPrompt?: string, uid?: string }} [opts]
 */
export async function askGemini(prompt, opts = {}) {
  const { systemPrompt = null, uid = null } = opts;

  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/app/apikey");

  const contents = uid ? [...(_history.get(uid) ?? [])] : [];
  contents.push({ role: "user", parts: [{ text: prompt }] });

  const body = { contents, generationConfig: { maxOutputTokens: 1024 } };
  if (systemPrompt) body.system_instruction = { parts: [{ text: systemPrompt }] };

  const res = await fetch(`${BASE}/${MODEL}:generateContent?key=${key}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "unknown error");
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini — it may have blocked the prompt.");

  if (uid) {
    contents.push({ role: "model", parts: [{ text }] });
    _history.set(uid, contents.slice(-MAX_TURNS * 2));
  }

  return text.trim();
}

export function resetGeminiSession(uid) { _history.delete(uid); }
