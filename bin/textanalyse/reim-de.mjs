// Endreim über die Lautschrift. Reimteil = ab dem Vokal der letzten betonten Silbe
// bis zum Wortende (Wiktionary-Definition; Burdorf, Gedichtanalyse). Stufen:
//   rein       – Reimteile gleich (Auslautverhärtung steckt schon in der IPA: Rad/Rat)
//   fast rein  – gleich bis auf Vokallänge
//   unrein     – Vokal nur leicht verschieden (Liebe/trübe, ekeln/räkeln, reichen/keuchen) oder Konsonant nur
//                stimmhaft/stimmlos verschieden (rasen/saßen) – Burdorf, Gedichtanalyse 2.2.1
//   Konsonanz  – Vokal verschieden, Konsonanten danach gleich (Song/lang)
//   Assonanz   – Vokal gleich, Konsonanten verschieden
import { lexikon } from './lexikon-de.mjs';
import { silbenkerne } from './ipa.mjs';

const ipaLexikon = lexikon;   // gemeinsamer Lader (lexikon-de.mjs)

const VOK = 'aɑɐeɛəiɪoɔuʊyʏøœæɜʌɒ';
export function ipaWort(roh) {
  const w = roh.replace(/[^A-Za-zÄÖÜäöüß']/g, '');
  const L = ipaLexikon();
  if (w.includes("'")) {
    // Satzzeichen zählen nicht: steht das Wort ohne Apostroph im Wörterbuch (hab', Haus' als Anführung), gilt
    // genau diese Form, so wie gesungen; nur sonst ist es eine Auslassung (steh'n → stehen ohne Schwa)
    const bar = w.replace(/'/g, ''), b = L.get(bar) || L.get(bar.toLowerCase());
    if (b) return b;
    const voll = /'$/.test(w) ? w.slice(0, -1) + 'e' : w.replace("'", 'e');
    const v = L.get(voll) || L.get(voll.toLowerCase());
    if (v) return v.replace(/ə(?=[^ə]*$)/, '');
  }
  const direkt = L.get(w) || L.get(w.toLowerCase());
  if (direkt) return direkt;
  // Unbekanntes Kompositum: für den Reim zählt das Endglied (Birkenhain → Hain)
  for (let i = 1; i <= w.length - 3; i++) {
    const rest = w.slice(i), gross = rest[0].toUpperCase() + rest.slice(1);
    const v = L.get(gross) || L.get(rest);
    if (v) return v;
  }
  return null;
}

// Letzte Silbe mit vollem Vokal (Bräuti|gam, Au|to) – kann am Zeilenende die Hebung tragen
export function letzteSilbeVoll(wort) {
  const ipa = ipaWort(wort); if (!ipa) return false;
  const k = silbenkerne(ipa); return k.length > 1 && k[k.length - 1].voll;
}

// Reimteil ab Silbe k (0-basiert) statt ab der letzten betonten Silbe
export function reimteilAb(ipa, k) {
  if (!ipa) return null;
  const kerne = silbenkerne(ipa.replace(/[͡ʔ]/g, ''));
  if (k == null || k >= kerne.length || k < 0) return reimteil(ipa);
  const s = ipa.replace(/[͡ʔ]/g, '').replace(/^\/|\/$/g, '');
  return reimteil('ˈ' + s.slice(kerne[k].pos).replace(/[ˈˌ]/g, ''));
}

export function reimteil(ipa) {
  if (!ipa) return null;
  // ab der letzten betonten Silbe, auch Nebenton: Birken|hain reimt auf Schein
  const s = ipa.replace(/[͡ʔ]/g, '');
  const ab = Math.max(s.lastIndexOf('ˈ'), s.lastIndexOf('ˌ'));
  let rest = ab >= 0 ? s.slice(ab + 1) : s;
  const i = [...rest].findIndex(c => VOK.includes(c));
  if (i < 0) return null;
  rest = [...rest].slice(i).join('').replace(/[ˈˌ]/g, '')
    // unbetonte Endsilben vereinheitlichen: -en als n̩, m̩ (Farben /ˈfaʁbm̩/) oder ŋ̩ (Regen) und -el als l̩ sind
    // Aussprachevarianten derselben Endung – sonst reimt Farben nicht auf Narben (/ˈnaʁbn̩/)
    .replace(/[mnŋ][\u0329\u030D]/g, 'ən').replace(/l[\u0329\u030D]/g, 'əl');
  const m = rest.match(new RegExp(`^([${VOK}][ːˑ\\u0300-\\u036F]*(?:[${VOK}]\\u032F)?)(.*)$`));
  return m ? { voll: rest, vokal: m[1], koda: m[2] } : null;
}

const ohneLaenge = s => s.replace(/[ːˑ]/g, '');
const STIMMLOS = { b: 'p', d: 't', g: 'k', 'ɡ': 'k', z: 's', v: 'f', 'ʒ': 'ʃ' };
const entstimmt = s => s.replace(/[bdgɡzvʒ]/g, c => STIMMLOS[c]);
// Unreiner Reim im engeren Sinn: Vokale nur leicht verschieden (Rundung, e/ä, ei/eu) –
// nach Burdorf. Gleiche Konsonanten bei fremdem Vokal sind Konsonanz.
// u:ü (gefunden/Sünden) nennt die Verslehre ausdrücklich unter den üblichen (Minor 397, Kayser 84–85; Recherche
// docs/recherche/2026-11-10_songformen/deutsche-verslehre.md, Regel R4).
const AEHNLICH = [['i', 'y'], ['ɪ', 'ʏ'], ['e', 'ø'], ['ɛ', 'œ'], ['e', 'ɛ'], ['aɪ̯', 'ɔʏ̯'], ['aɪ̯', 'ɔɪ̯'], ['u', 'y'], ['ʊ', 'ʏ'],
  ['o', 'ɔ'], ['i', 'ɪ'], ['u', 'ʊ'], ['y', 'ʏ'], ['ø', 'œ'], ['a', 'ɑ']];  // gespannt/ungespannt: schon/davon
// Vokalisches r hängt in der Lautschrift am Vokal (mir /miːɐ̯/) – für den Vergleich i:ü abtrennen (mir/Tür, dir/für)
const ohneR = v => (/.ɐ̯$/.test(v) && !/[ɪʏʊ]̯ɐ̯$/.test(v) ? v.slice(0, -2) : v);
const aehnlich = (x, y) => {
  if (/ɐ̯$/.test(x) !== /ɐ̯$/.test(y)) return false;
  const a = ohneLaenge(ohneR(x)), b = ohneLaenge(ohneR(y));
  return AEHNLICH.some(([p, q]) => (a === p && b === q) || (a === q && b === p));
};
// Stummes Dehnungs-h vor der Endsilbe (Höhen /ˈhøːhən/ neben gehen /ˈɡeːən/): manche Quellen schreiben es mit
const ohneH = s => s.replace(/([ːˑ])h(?=ə)/g, '$1');
// g:ch in der Wortmitte (neige/reiche) – auffällig, aber üblich (R4, Stufe 2); am Wortende (Tuch/genug) nur mundartlich
const gch = s => s.replace(/[ɡg](?=ə)/g, 'ç').replace(/x(?=ə)/g, 'ç');
export function reimStufe(a, b) {
  if (!a || !b) return null;
  const kodaH = (k, v) => (/[ːˑ]$/.test(v) ? k.replace(/^h(?=ə)/, '') : k);
  a = { ...a, voll: ohneH(a.voll), koda: kodaH(a.koda, a.vokal) }; b = { ...b, voll: ohneH(b.voll), koda: kodaH(b.koda, b.vokal) };
  if (a.voll === b.voll) return 'rein';
  if (ohneLaenge(a.voll) === ohneLaenge(b.voll)) return 'fast rein';
  if (a.koda === b.koda && aehnlich(a.vokal, b.vokal)) return 'unrein';
  // Konsonanten nur in stimmhaft/stimmlos verschieden (rasen/saßen, melden/gelten): unreiner Reim (Burdorf,
  // Gedichtanalyse, 2.2.1) – nicht bloß Assonanz. Am Wortende steckt die Auslautverhärtung schon in der IPA.
  if (a.koda !== b.koda && (entstimmt(a.koda) === entstimmt(b.koda) || gch(a.koda) === gch(b.koda)) &&
      (ohneLaenge(a.vokal) === ohneLaenge(b.vokal) || aehnlich(a.vokal, b.vokal))) return 'unrein';
  if (a.koda && a.koda === b.koda) return 'Konsonanz';
  if (ohneLaenge(a.vokal) === ohneLaenge(b.vokal)) return 'Assonanz';
  return null;
}
// Reimschema (Buchstaben je Abschnitt, sprachübergreifend) steht in analyse.mjs.
