// Silbentrennung nach Liang (TeX-Trennmuster, hyphenation/tex-hyphen: hyph-de-1996, hyph-en-us; MIT bzw. MIT-artig).
// Jörg, 12.11.2026: „ich will natürlich richtig trennen“ – die Muster trennen aal-ähn-lich, wo die eigene Regel aa-lähn-lich
// setzte. Die Muster liegen neben dem Kern (kern/trennmuster-de.txt, -en.txt), damit sie in jeder Installation da sind.
// trennstellen(wort, sprache) → Positionen, vor denen getrennt werden darf (1 … länge-1), ohne Mindestlänge am Rand.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const MUSTER = {};
function muster(sprache) {
  if (MUSTER[sprache]) return MUSTER[sprache];
  const m = new Map();
  try {
    for (const z of fs.readFileSync(path.join(HIER, `trennmuster-${sprache}.txt`), 'utf8').split('\n')) {
      const t = z.trim(); if (!t || t.startsWith('%')) continue;
      const buchst = t.replace(/\d/g, ''), werte = new Array(buchst.length + 1).fill(0);
      let k = 0; for (const c of t) { if (/\d/.test(c)) werte[k] = +c; else k++; }
      m.set(buchst, werte);
    }
  } catch { /* ohne Muster: keine Trennstellen, die eigene Regel gilt */ }
  return (MUSTER[sprache] = m);
}

export function trennstellen(wort, sprache = 'de') {
  const m = muster(sprache === 'en' ? 'en' : 'de'); if (!m.size) return null;
  const w = '.' + wort.toLowerCase() + '.';
  if (w.length !== wort.length + 2) return null;   // Kleinschreibung hat die Länge verändert – dann lieber gar nicht
  const v = new Array(w.length + 1).fill(0);
  for (let i = 0; i < w.length; i++)
    for (let j = i + 1; j <= w.length && j - i <= 12; j++) {
      const p = m.get(w.slice(i, j)); if (!p) continue;
      for (let k = 0; k < p.length; k++) if (p[k] > v[i + k]) v[i + k] = p[k];
    }
  // v[x] gilt für die Stelle vor w[x]; im Wort heißt das vor wort[x - 1]
  const aus = [];
  for (let x = 2; x <= wort.length; x++) if (v[x] % 2 === 1) aus.push(x - 1);
  return aus;
}

// Silbenstücke nach den Mustern; Stücke ohne Vokal (Hoch-zei-t, u-n-end-lich) gehen ans Nachbarstück
const VOKAL = /[aeiouäöüyAEIOUÄÖÜY]/;
export function trennstuecke(wort, sprache = 'de') {
  const t = trennstellen(wort, sprache); if (!t) return null;
  const stuecke = []; let a = 0;
  for (const g of t) { stuecke.push(wort.slice(a, g)); a = g; }
  stuecke.push(wort.slice(a));
  const aus = [];
  for (const st of stuecke) {
    if (!VOKAL.test(st) && aus.length) aus[aus.length - 1] += st;
    else if (aus.length && !VOKAL.test(aus[aus.length - 1])) aus[aus.length - 1] += st;
    else aus.push(st);
  }
  return aus;
}
