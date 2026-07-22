// AI Case Narrator — turns detector JSON into an in-character forensic log.
//
// THE REAL PROBLEM IT SOLVES: raw chain data is unreadable to humans. The
// project's whole thesis is "awareness is armor" — the narrator converts a
// containment record (addresses, slots, amounts) into a two-sentence story a
// non-technical judge understands in five seconds.
//
// HONESTY RULE: when no key is configured we use the scripted corpus and the
// UI labels it PATROL LOG · SCRIPTED. With a key it says PATROL LOG · GEMINI.
// The label never lies.

const AI_KEY =
  import.meta.env.VITE_GEMINI_KEY ||
  import.meta.env.VITE_AI_KEY ||
  '';

const MODEL = 'gemini-2.5-flash';
const ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM =
  'You are Ranger One, bot #343 — the first Dark Forest bot defending users instead of extracting from them. Write a terse 2-sentence patrol-log entry about a contained sandwich attack. Facts only from the JSON. No emojis, no hype, radio-report tone.';

const SCRIPTED = [
  (c) => `Subject ${c.subject} bracketed a ${c.expected} ${c.token} swap in slot ${c.slot} — bought ahead, sold behind, walked away with the spread. Victim received ${c.received}. Contained by Ranger #343.`,
  (c) => `Case #${c.caseId}: the same wallet appears before and after the victim in slot ${c.slot}. That symmetry is the signature of a sandwich. Subject ${c.subject} is now in the cage.`,
  (c) => `The victim asked for ${c.expected} ${c.token} and got ${c.received}. The difference did not vanish — it moved to ${c.subject}. Tonight it moved back into the record. Contained.`,
];

let scriptedIdx = Math.floor(Math.random() * SCRIPTED.length);

export const aiState = { live: !!AI_KEY };

/**
 * Narrate a containment. Never throws, never stalls the demo:
 * 4s timeout, then the scripted corpus answers.
 */
export async function narrateCase(caseData) {
  const fallback = () => {
    scriptedIdx = (scriptedIdx + 1) % SCRIPTED.length;
    return { text: SCRIPTED[scriptedIdx](caseData), live: false };
  };

  if (!AI_KEY) return fallback();

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': AI_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [
          {
            role: 'user',
            parts: [{ text: JSON.stringify(caseData) }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 120,
          temperature: 0.4,
        },
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return fallback();
    const j = await res.json();
    const text = j?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .filter(Boolean)
      .join('')
      .trim();
    return text ? { text, live: true } : fallback();
  } catch {
    return fallback();
  }
}
