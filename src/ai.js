// AI Case Narrator — turns detector JSON into an in-character forensic log.
//
// THE REAL PROBLEM IT SOLVES: raw chain data is unreadable to humans. The
// project's whole thesis is "awareness is armor" — the narrator converts a
// containment record (addresses, slots, amounts) into a two-sentence story a
// non-technical judge understands in five seconds.
//
// HONESTY RULE: when no key is configured we use the scripted corpus and the
// UI labels it PATROL LOG · SCRIPTED. With a key it says PATROL LOG · CLAUDE.
// The label never lies.

const AI_KEY = import.meta.env.VITE_AI_KEY || '';

const SCRIPTED = {
  en: [
    (c) => `Subject ${c.subject} bracketed a ${c.expected} ${c.token} swap in slot ${c.slot} — bought ahead, sold behind, walked away with the spread. Victim received ${c.received}. Contained by Ranger #343.`,
    (c) => `Case #${c.caseId}: the same wallet appears before and after the victim in slot ${c.slot}. That symmetry is the signature of a sandwich. Subject ${c.subject} is now in the cage.`,
    (c) => `The victim asked for ${c.expected} ${c.token} and got ${c.received}. The difference did not vanish — it moved to ${c.subject}. Tonight it moved back into the record. Contained.`,
  ],
  ka: [
    (c) => `ობიექტმა ${c.subject} სლოტში ${c.slot} ${c.expected} ${c.token} გაცვლა ორივე მხრიდან ჩაკეტა — წინ იყიდა, უკან გაყიდა და სხვაობა წაიღო. მსხვერპლმა მიიღო ${c.received}. იზოლირებულია რეინჯერ #343-ის მიერ.`,
    (c) => `საქმე #${c.caseId}: ერთი და იგივე საფულე ჩნდება მსხვერპლის წინაც და შემდეგაც სლოტში ${c.slot}. ეს სიმეტრია სენდვიჩის ხელწერაა. ობიექტი ${c.subject} უკვე გალიაშია.`,
    (c) => `მსხვერპლი ითხოვდა ${c.expected} ${c.token}-ს და მიიღო ${c.received}. სხვაობა არ გამქრალა — ის ${c.subject}-სთან გადავიდა. ამაღამ ის ჩანაწერს დაუბრუნდა. იზოლირებულია.`,
  ],
};

let scriptedIdx = Math.floor(Math.random() * SCRIPTED.en.length);

export const aiState = { live: !!AI_KEY };

/**
 * Narrate a containment. Never throws, never stalls the demo:
 * 4s timeout, then the scripted corpus answers.
 * `lang` comes from the caller — importing it from ui.js would create a
 * ui → ai → ui import cycle.
 */
export async function narrateCase(caseData, lang = 'en') {
  const corpus = SCRIPTED[lang] || SCRIPTED.en;
  const fallback = () => {
    scriptedIdx = (scriptedIdx + 1) % corpus.length;
    return { text: corpus[scriptedIdx](caseData), live: false };
  };

  if (!AI_KEY) return fallback();

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': AI_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 120,
        system: 'You are Ranger One, bot #343 — the first Dark Forest bot defending users instead of extracting from them. Write a terse 2-sentence patrol-log entry about a contained sandwich attack. Facts only from the JSON. No emojis, no hype, radio-report tone.'
          + (lang === 'ka' ? ' Write the entry in Georgian.' : ''),
        messages: [{ role: 'user', content: JSON.stringify(caseData) }],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return fallback();
    const j = await res.json();
    const text = j?.content?.[0]?.text?.trim();
    return text ? { text, live: true } : fallback();
  } catch {
    return fallback();
  }
}
