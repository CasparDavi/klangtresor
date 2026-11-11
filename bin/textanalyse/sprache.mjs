// Sprache je Zeile und je Text: 'de', 'en' oder 'fremd' (z. B. kyrillisch). Gemischte Texte zeilenweise.
// Reihenfolge je Zeile: kyrillisch ohne Lateinisches → fremd; Umlaut/ß → de; häufige Funktionswörter;
// sonst Wörterbuch-Treffer, die nur in einer Sprache stehen. Unentschiedene Zeilen erben vom Nachbarn
// bzw. von der Mehrheit des Textes.
import { lexikon } from './lexikon-de.mjs';
import { lexikonEn } from './englisch.mjs';

const DE = new Set(`und ich die der das nicht ist ein eine einen du wir mich mir dich dir sie es zu mit auf im den dem
was wie wenn noch nur doch auch sich sind bin bist hat habe war wird kein keine mein dein sein ihr uns euch
von vom zum zur aus bei nach vor über unter durch gegen ohne um wo wer dann denn schon mehr hier jetzt
immer nie nichts alles nach heute weil dass daß oder aber`.split(/\s+/));
const EN = new Set(`the and you i to a of in my me is it that on your we be for this all with are not no but
so what when where who how there here was were have has had do does did will would can could just like
don't i'm it's you're can't won't they them their our us he she his her him from about into out up down
never ever only now then than through love baby oh yeah`.split(/\s+/));

// Wörter, die es in beiden Sprachen gibt (in, so, was …), entscheiden nichts
for (const w of [...DE]) if (EN.has(w)) { DE.delete(w); EN.delete(w); }

// Alles in eckigen Klammern wird nicht analysiert (Jörg: „alles was in eckigen Klammern steht, wird nicht
// mitanalysiert“) – auch über Zeilengrenzen ([Verse 1 – clean guitar,⏎ slow build]). Eine Klammer, die vor der
// nächsten „[“ nicht geschlossen wird, gilt bis zum Zeilenende. Ersetzt durch Leerzeichen: Länge und
// Zeilenumbrüche bleiben, Zeichenpositionen stimmen weiter.
export function ohneKlammern(text) {
  const z = [...text];
  for (let i = 0; i < z.length; i++) {
    if (z[i] !== '[') continue;
    let zu = -1, naechste = -1;
    for (let j = i + 1; j < z.length; j++) { if (z[j] === ']') { zu = j; break; } if (z[j] === '[') { naechste = j; break; } }
    let ende = zu;
    if (zu < 0) { ende = i; while (ende + 1 < z.length && z[ende + 1] !== '\n') ende++; }
    for (let k = i; k <= ende; k++) if (z[k] !== '\n') z[k] = ' ';
    i = ende;
  }
  // Kommentare (Jörg, 10.11.2026): ab „#“ bis Zeilenende – für Notizen, nie gesungen, nie an Suno
  for (let i = 0; i < z.length; i++) if (z[i] === '#') { while (i < z.length && z[i] !== '\n') z[i++] = ' '; }
  return z.join('');
}

const woerter = z => (z.replace(/\[[^\]]*\]/g, ' ').replace(/#.*$/, ' ').match(/[A-Za-zÄÖÜäöüß'’]+/g) || []).map(w => w.replace(/’/g, "'"));

export function spracheZeile(zeile) {
  const ohne = zeile.replace(/\[[^\]]*\]/g, ' ');
  // Buchstaben, aber keine lateinischen (kyrillisch, japanisch, griechisch …) → fremd
  if (/\p{L}/u.test(ohne) && !/[A-Za-zÄÖÜäöüß]/.test(ohne)) return 'fremd';
  const w = woerter(ohne);
  if (!w.length) return null;
  if (/[äöüßÄÖÜ]/.test(ohne)) return 'de';
  const k = w.map(x => x.toLowerCase());
  // Funktionswörter zählen doppelt, dazu Wörter, die nur in einem der beiden Wörterbücher stehen
  const d = k.filter(x => DE.has(x)).length, e = k.filter(x => EN.has(x)).length;
  const L = lexikon(), C = lexikonEn();
  let nurDe = 0, nurEn = 0;
  for (const x of w) {
    const inDe = L.has(x) || L.has(x.toLowerCase()), inEn = C.has(x.toLowerCase());
    if (inDe && !inEn) nurDe++; else if (inEn && !inDe) nurEn++;
  }
  const pd = 2 * d + nurDe, pe = 2 * e + nurEn;
  return pd > pe ? 'de' : pe > pd ? 'en' : null;
}

// Gesamter Text: Sprache je Zeile (Lücken gefüllt) und Gesamturteil de / en / gemischt / fremd
export function spracheText(text) {
  const zeilen = ohneKlammern(text).split('\n').map(z => (!z.trim() ? undefined : spracheZeile(z)));
  const zaehl = { de: 0, en: 0, fremd: 0 };
  zeilen.forEach(s => { if (s) zaehl[s]++; });
  const mehrheit = zaehl.de >= zaehl.en ? (zaehl.de ? 'de' : zaehl.en ? 'en' : null) : 'en';
  // Unentschiedene erben vom vorigen entschiedenen Nachbarn (nicht von fremd), sonst von der Mehrheit
  let letzte = null;
  const gefuellt = zeilen.map(s => { if (s === 'de' || s === 'en') { letzte = s; return s; } if (s === null) return letzte || mehrheit || 'de'; return s; });
  const lat = zaehl.de + zaehl.en;
  const gesamt = !lat || zaehl.fremd > lat ? (zaehl.fremd ? 'fremd' : null)
    : zaehl.de / lat >= 0.8 ? 'de' : zaehl.en / lat >= 0.8 ? 'en' : 'gemischt';
  return { zeilen: gefuellt, gesamt, zaehl };
}
