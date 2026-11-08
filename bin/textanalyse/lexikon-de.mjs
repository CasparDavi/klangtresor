// Gemeinsamer Lexikon-Lader: ipa-dict einmal einlesen, eine Map Wort → Lautschrift (erste Variante).
// Betonung und Reim lesen beide hier (vorher zweimal eingelesen, ≈ 530 MB). Betonungsstufen werden erst
// beim Nachschlagen aus der Lautschrift abgeleitet und nur für tatsächlich gebrauchte Wörter gemerkt.
import fs from 'node:fs';
import { daten } from './pfade.mjs';
import { betonungAusIpa } from './ipa.mjs';

const HAT_KERN = /[aɑɐeɛəiɪoɔuʊyʏøœæɜʌɒɨɵʉɘɤɯɚ]|̩|̍/;
let LEX = null;

export function lexikon() {
  if (LEX) return LEX;
  LEX = new Map();
  const klein = new Map();   // Kleinschreibung nur als Rückfall – sonst verdrängt „Die“ (engl. /daɪ/) das Wort „die“
  for (const z of fs.readFileSync(daten('de/ipa-dict-de.txt'), 'utf8').split('\n')) {
    const t = z.indexOf('\t'); if (t < 1) continue;
    const w = z.slice(0, t); if (w.includes(' ')) continue;                 // Phrasen auslassen
    const ipa = z.slice(t + 1).split(',')[0].trim().replace(/^\/|\/$/g, '');
    if (!HAT_KERN.test(ipa)) continue;                                       // ohne Silbenkern unbrauchbar
    if (!LEX.has(w)) LEX.set(w, ipa);
    const k = w.toLowerCase(); if (k !== w && !klein.has(k)) klein.set(k, ipa);
  }
  for (const [k, v] of klein) if (!LEX.has(k)) LEX.set(k, v);
  return LEX;
}

const STUFEN = new Map();
// Betonungsstufen je Silbe für ein Wort aus dem Lexikon (oder null)
export function stufenVon(wort) {
  if (STUFEN.has(wort)) return STUFEN.get(wort);
  const ipa = lexikon().get(wort);
  const st = ipa ? betonungAusIpa(ipa) : null;
  const r = st && st.length ? st : null;
  STUFEN.set(wort, r);
  return r;
}
