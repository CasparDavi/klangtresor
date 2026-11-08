// Englisch: Lexikon (CMU Pronouncing Dictionary), Kleinwörter, Wortbetonung, Reim.
// CMU: ARPAbet, Vokale tragen 1 (Haupt-), 2 (Neben-), 0 (unbetont) → Stufen 2/1/0 wie im Deutschen.
// Daten: <daten>/en/cmudict.dict (nur über pfade.mjs).
import fs from 'node:fs';
import { daten, korrekturen } from './pfade.mjs';

let CMU = null;
export function lexikonEn() {
  if (CMU) return CMU;
  CMU = new Map();
  for (const z of fs.readFileSync(daten('en/cmudict.dict'), 'utf8').split('\n')) {
    if (!z || z.startsWith(';;;')) continue;
    const zeile = z.replace(/\s+#.*$/, '').trim();
    const leer = zeile.indexOf(' '); if (leer < 1) continue;
    const w = zeile.slice(0, leer);
    if (/\(\d+\)$/.test(w)) continue;                        // nur erste Aussprache
    CMU.set(w, zeile.slice(leer + 1));
  }
  // eigene Korrekturen überstimmen das Original (kern/korrekturen-en.tsv)
  for (const [w, ph] of korrekturen('korrekturen-en.tsv')) CMU.set(w.toLowerCase(), ph);
  return CMU;
}
const VOKAL = /^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)([012])$/;
const STUFEN = new Map();
export function stufenEn(w) {
  if (STUFEN.has(w)) return STUFEN.get(w);
  const ph = lexikonEn().get(w);
  const st = ph ? ph.split(' ').filter(p => VOKAL.test(p)).map(p => ({ 1: 2, 2: 1, 0: 0 })[p.slice(-1)]) : null;
  const r = st && st.length ? st : null;
  STUFEN.set(w, r); return r;
}

// ---------- Kleinwörter (Einsilber) in drei Stufen, wie im Deutschen ----------
const U = `a an the i you he she it we they me him her us them my your his its our their
in on at to of for from by with as into onto than off
and or nor but if that when while though as because so
am is are was were be been have has had do does did will would shall should can could may might must
i'm i'll i'd i've you're you'll you'd you've he's she's it's we're we'll we've they're they'll they've that's there's
'cause 'til till 'em o' 'n'
thy thee thou thine ye 'tis 'twas o'er e'er ne'er doth hath art ere o oh upon whilst unto`;
const B = `not no all some this these those what who whom whose where why how there here now then just too very
more most still yet ever never one each both such own same don't can't won't ain't isn't aren't wasn't
didn't doesn't couldn't wouldn't shouldn't haven't hasn't up down out`;
const setze = s => new Set(s.split(/\s+/).filter(Boolean));
const UNBETONT = setze(U), BETONBAR = setze(B);
export function klasseEinsilberEn(wort) {
  const w = wort.toLowerCase().replace(/’/g, "'");
  return UNBETONT.has(w) ? 'u' : BETONBAR.has(w) ? 'b' : 'c';
}

// Silben in der Schreibung (Rückfall): Vokalgruppen, stummes End-e
export function schreibSilbenEn(w) {
  const s = w.toLowerCase().replace(/[^a-z]/g, '');
  let n = (s.match(/[aeiouy]+/g) || []).length;
  if (n > 1 && /[^aeiouyl]e$/.test(s)) n--;                     // love, time – aber nicht little, simple
  if (n > 1 && /[^aeiouy]es$|[^aeiouytd]ed$/.test(s)) n--;      // times, loved – aber nicht wanted, kisses
  return Math.max(1, n);
}

function regelEn(w) {
  const n = schreibSilbenEn(w), st = new Array(n).fill(0);
  if (n === 1) return st;
  if (/(tion|sion|cian|ic|ical|ious|ial)$/.test(w)) st[n - 2] = 2;
  else if (/(ity|ety|ify|logy|graphy)$/.test(w) && n >= 3) st[n - 3] = 2;
  else if (/(ee|eer|ese|ette|ique)$/.test(w)) st[n - 1] = 2;
  else if (/^(a|be|de|re|un|in|im|dis|mis|for|with|be)[^aeiouy]/.test(w) && n === 2) st[1] = 2;
  else st[0] = 2;
  return st;
}

const ENDUNGEN_EN = ["'s", 'ing', 'ed', 'es', 's', 'er', 'est', 'ly', 'ness', 'ful', 'less', 'd'];
// Wort → { stufen, quelle, einsilberKlasse } wie wortBetonung (deutsch)
export function wortBetonungEn(roh, tiefe = 0) {
  let w = roh.toLowerCase().replace(/’/g, "'").replace(/[^a-z']/g, '').replace(/^'+(?!(cause|bout|til|em|course)$)/, '');
  if (!w.replace(/'/g, '')) return { stufen: [], quelle: 'leer' };
  if (/in'$/.test(w) && !lexikonEn().has(w)) w = w.slice(0, -1) + 'g';      // goin' → going
  if (klasseEinsilberEn(w) !== 'c' && (stufenEn(w) || [0]).length <= 1)
    return { stufen: [0], quelle: 'kleinwort', einsilberKlasse: klasseEinsilberEn(w) };
  let st = stufenEn(w), quelle = 'lexikon';
  if (!st) {
    for (const e of ENDUNGEN_EN) {
      if (!w.endsWith(e) || w.length - e.length < 3) continue;
      let stamm = w.slice(0, -e.length);
      let s = stufenEn(stamm) || stufenEn(stamm + 'e') || (/(.)\1$/.test(stamm) && stufenEn(stamm.slice(0, -1)));
      if (s) { const z = Math.max(0, schreibSilbenEn(w) - schreibSilbenEn(stamm)); st = s.concat(new Array(z).fill(0)); quelle = 'beugung'; break; }
    }
  }
  if (!st && tiefe < 1) {
    for (let i = w.length - 3; i >= 3 && !st; i--) {
      const kopf = stufenEn(w.slice(0, i)), rest = stufenEn(w.slice(i));
      if (!kopf || !rest) continue;
      const kk = kopf.map(x => (x === 1 ? 0 : x)); if (!kk.includes(2)) kk[0] = 2;
      st = kk.concat(rest.length === 1 ? [1] : rest.map(x => (x === 2 ? 1 : 0))); quelle = 'kompositum';
    }
  }
  if (!st) { st = regelEn(w); quelle = 'regel'; }
  st = st.slice();
  if (st.length > 1 && !st.includes(2)) st[Math.max(0, st.indexOf(1))] = 2;
  const out = { stufen: st, quelle };
  if (st.length === 1) out.einsilberKlasse = klasseEinsilberEn(w);
  return out;
}

// ---------- Reim ----------
export function phonesWortEn(roh) {
  let w = roh.toLowerCase().replace(/’/g, "'").replace(/[^a-z']/g, '');
  const L = lexikonEn();
  if (L.has(w)) return L.get(w);
  if (/in'$/.test(w) && L.has(w.slice(0, -1) + 'g')) return L.get(w.slice(0, -1) + 'g');
  w = w.replace(/'/g, '');
  if (L.has(w)) return L.get(w);
  for (let i = 1; i <= w.length - 3; i++) if (L.has(w.slice(i))) return L.get(w.slice(i));   // Endglied reimt
  return null;
}
// Reimteil ab dem letzten betonten Vokal (1 oder 2) – wie pronouncing.rhyming_part; ab = Silbenindex (optional)
export function reimteilEn(phones, ab = null) {
  if (!phones) return null;
  const p = phones.split(' ');
  const vok = p.map((x, i) => (VOKAL.test(x) ? i : -1)).filter(i => i >= 0);
  if (!vok.length) return null;
  let i;
  if (ab != null && ab < vok.length) i = vok[ab];
  else { const bet = vok.filter(k => /[12]$/.test(p[k])); i = bet.length ? bet[bet.length - 1] : vok[vok.length - 1]; }
  const teil = p.slice(i).map(x => x.replace(/[012]$/, ''));
  return { voll: teil.join(' '), vokal: teil[0], koda: teil.slice(1).join(' ') };
}
const AEHNLICH_EN = [['IH', 'IY'], ['UH', 'UW'], ['EH', 'AE'], ['AH', 'AA'], ['AA', 'AO'], ['EH', 'EY'], ['OW', 'AO'], ['AH', 'UH']];
export function reimStufeEn(a, b) {
  if (!a || !b) return null;
  if (a.voll === b.voll) return 'rein';
  const aeh = AEHNLICH_EN.some(([x, y]) => (a.vokal === x && b.vokal === y) || (a.vokal === y && b.vokal === x));
  if (a.koda === b.koda && aeh) return 'unrein';
  if (a.koda && a.koda === b.koda) return 'Konsonanz';
  if (a.vokal === b.vokal) return 'Assonanz';
  return null;
}
// Letzte Silbe mit vollem Vokal (kein Schwa AH0/IH0/ER0) – kann am Zeilenende die Hebung tragen
export function letzteSilbeVollEn(roh) {
  const ph = phonesWortEn(roh); if (!ph) return false;
  const v = ph.split(' ').filter(x => VOKAL.test(x));
  return v.length > 1 && !/^(AH0|IH0|ER0|UH0)$/.test(v[v.length - 1]);
}
