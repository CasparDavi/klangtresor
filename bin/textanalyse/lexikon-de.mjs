// Gemeinsamer Lexikon-Lader: ipa-dict einmal einlesen, eine Map Wort → Lautschrift (erste Variante), ergänzt um Viëtor 1921.
// Betonung und Reim lesen beide hier (vorher zweimal eingelesen, ≈ 530 MB). Betonungsstufen werden erst
// beim Nachschlagen aus der Lautschrift abgeleitet und nur für tatsächlich gebrauchte Wörter gemerkt.
import fs from 'node:fs';
import { daten, korrekturen } from './pfade.mjs';
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
  // alte Rechtschreibung: ß statt ss am Silbenende (naß, daß, Kuß, mußt, Schloßgarten) – gleiche Aussprache;
  // ss zwischen Vokalen (Wasser, küssen) war auch früher ss
  for (const [w, v] of [...LEX]) {
    if (!w.includes('ss')) continue;
    const alt = w.replace(/ss(?![aeiouäöüy])/g, 'ß');
    if (alt !== w && !LEX.has(alt)) LEX.set(alt, v);
  }
  // Viëtor 1921 (gemeinfrei, kern/vietor-de.tsv, bin/vietor-lautschrift.mjs; Jörg, 11.11.2026): nur Wörter, die
  // ipa-dict nicht kennt – damit vor Duden-Betonungsliste, Beugung, Kompositum und Regel
  if (!process.env.KLANGFEDER_OHNE_VIETOR) for (const [w, ipa] of korrekturen('vietor-de.tsv')) if (!LEX.has(w)) LEX.set(w, ipa);
  // eigene Korrekturen überstimmen das Original (kern/korrekturen-de.tsv)
  for (const [w, ipa] of korrekturen('korrekturen-de.tsv')) {
    const v = ipa.replace(/^\/|\/$/g, '');
    LEX.set(w, v); if (!LEX.has(w.toLowerCase()) || w === w.toLowerCase()) LEX.set(w.toLowerCase(), v);
  }
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
