// Endreim über die Lautschrift. Reimteil = ab dem Vokal der letzten betonten Silbe
// bis zum Wortende (Wiktionary-Definition; Burdorf, Gedichtanalyse). Stufen:
//   rein       – Reimteile gleich (Auslautverhärtung steckt schon in der IPA: Rad/Rat)
//   fast rein  – gleich bis auf Vokallänge
//   unrein     – Vokal verschieden, Konsonanten danach gleich (Konsonanz: Song/lang)
//   Assonanz   – Vokal gleich, Konsonanten verschieden
import { lexikon } from './lexikon-de.mjs';
import { silbenkerne } from './ipa.mjs';

const ipaLexikon = lexikon;   // gemeinsamer Lader (lexikon-de.mjs)

const VOK = 'aɑɐeɛəiɪoɔuʊyʏøœæɜʌɒ';
export function ipaWort(roh) {
  const w = roh.replace(/[^A-Za-zÄÖÜäöüß']/g, '');
  const L = ipaLexikon();
  if (w.includes("'")) {                      // steh'n → stehen, Schwa der Endung entfällt
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
  rest = [...rest].slice(i).join('').replace(/[ˈˌ]/g, '');
  const m = rest.match(new RegExp(`^([${VOK}][ːˑ\\u0300-\\u036F]*(?:[${VOK}]\\u032F)?)(.*)$`));
  return m ? { voll: rest, vokal: m[1], koda: m[2] } : null;
}

const ohneLaenge = s => s.replace(/[ːˑ]/g, '');
// Unreiner Reim im engeren Sinn: Vokale nur leicht verschieden (Rundung, e/ä, ei/eu) –
// nach Burdorf und Wagenknecht. Gleiche Konsonanten bei fremdem Vokal sind Konsonanz.
const AEHNLICH = [['i', 'y'], ['ɪ', 'ʏ'], ['e', 'ø'], ['ɛ', 'œ'], ['e', 'ɛ'], ['aɪ̯', 'ɔʏ̯'], ['aɪ̯', 'ɔɪ̯'],
  ['o', 'ɔ'], ['i', 'ɪ'], ['u', 'ʊ'], ['y', 'ʏ'], ['ø', 'œ'], ['a', 'ɑ']];  // gespannt/ungespannt: schon/davon
const aehnlich = (x, y) => { const a = ohneLaenge(x), b = ohneLaenge(y); return AEHNLICH.some(([p, q]) => (a === p && b === q) || (a === q && b === p)); };
export function reimStufe(a, b) {
  if (!a || !b) return null;
  if (a.voll === b.voll) return 'rein';
  if (ohneLaenge(a.voll) === ohneLaenge(b.voll)) return 'fast rein';
  if (a.koda === b.koda && aehnlich(a.vokal, b.vokal)) return 'unrein';
  if (a.koda && a.koda === b.koda) return 'Konsonanz';
  if (ohneLaenge(a.vokal) === ohneLaenge(b.vokal)) return 'Assonanz';
  return null;
}
// Reimschema (Buchstaben je Abschnitt, sprachübergreifend) steht in analyse.mjs.
