// Englisch: Lexikon (CMU Pronouncing Dictionary), Kleinwörter, Wortbetonung, Reim.
// CMU: ARPAbet, Vokale tragen 1 (Haupt-), 2 (Neben-), 0 (unbetont) → Stufen 2/1/0 wie im Deutschen.
// Daten: <daten>/en/cmudict.dict (nur über pfade.mjs).
import fs from 'node:fs';
import { daten, korrekturen } from './pfade.mjs';
import { aussprache } from './betonung-de.mjs';

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

// Muret-Sanders Teil I (Englisch-Deutsch, um 1900, gemeinfrei; bin/muret-betonung-en.mjs; Jörg, 12.11.2026, „A b, B a“):
// kern/muret-en.tsv füllt, was CMUdict nicht kennt – Betonung je Silbe und Reimteil (sicher = am Bild nachgelesen, sonst
// vermutet). kern/muret-1900-en.tsv: Wörter, die Muret 1900 anders betont als CMUdict – gelten nur bei der Wahl „um 1900“
// (derselbe Schalter wie Bühnendeutsch, kern/betonung-de.mjs). Reihenfolge: CMUdict → Muret → Beugung → Kompositum → Regel.
const tabelle = d => { try { return fs.readFileSync(new URL('./' + d, import.meta.url), 'utf8').split('\n').filter(z => z && z[0] !== '#').map(z => z.split('\t')); } catch { return []; } };
let MURET_EN = null, MURET_1900 = null;
function muretEn() {
  if (!MURET_EN) MURET_EN = new Map(process.env.KLANGFEDER_OHNE_MURET ? [] : tabelle('muret-en.tsv').map(([w, st, reim, sicher]) => [w, { st: st.split(' ').map(Number), reim: reim || null, sicher: sicher === '1' }]));
  return MURET_EN;
}
function muret1900(w) {
  if (!MURET_1900) MURET_1900 = new Map(process.env.KLANGFEDER_OHNE_MURET ? [] : tabelle('muret-1900-en.tsv').map(([x, st]) => [x, st.split(' ').map(Number)]));
  return MURET_1900.get(w) || null;
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

// Wie oft steht ein Einsilber im Vers auf der Hebung? Gelernt aus dem Gutenberg Poetry Corpus,
// bin/betonung-lernen-en.mjs. Nur Wörter mit genug Belegen; fehlt die Datei, bleibt alles wie zuvor.
// Versucht und verworfen (10.11.2026): Anteil je Wort mit linkem/rechtem Nachbarn – die Hebungssuche erzwingt den
// Wechsel schon selbst, der Nachbarwert zählt ihn doppelt (Haider dev 90,5 statt 91,6 % Silben).
// Ebenso verworfen: gelernte Silbenanteile mehrsilbiger Wörter (memory SWS, unto WS …) – auf dev −0,4 bis −0,7 Punkte,
// das Wörterbuch trifft mehrsilbige Wörter schon besser. Gelernt werden nur noch Einsilber.
export const VERS = { minEin: 20 };
let VERSDATEN;
function versAnteilEn(w, n) {
  if (VERSDATEN === undefined) {
    // liegt neben dem Code (wie die Korrekturdateien): reist mit dem Kern in den KlangTresor und in jede Installation
    try { VERSDATEN = JSON.parse(fs.readFileSync(new URL('./betonung-vers-en.json', import.meta.url), 'utf8')); } catch { VERSDATEN = null; }
  }
  if (!VERSDATEN) return null;
  if (n !== 1) return null;
  const e = VERSDATEN.ein[w]; return e && e[1] >= VERS.minEin ? [e[0]] : null;
}

const ENDUNGEN_EN = ["'s", 'ing', 'ed', 'es', 's', 'er', 'est', 'ly', 'ness', 'ful', 'less', 'd'];
// Verkürzte Formen der Dichtersprache (Jörg, 12.11.2026, Entscheidung „D a“): turn'd, heav'n, pow'r, wand'ring = volles
// Wort mit e an der Stelle des Hochkommas. Hat die verkürzte Schreibung eine Silbe weniger, fällt die unbetonte Silbe an
// dieser Stelle weg (heav'n einsilbig, wand'ring zweisilbig); turn'd bleibt einsilbig wie turned. Unregelmäßige
// (o'er, e'er, ne'er, e'en, ta'en …) stehen mit Lauten in kern/korrekturen-en.tsv.
function auslassung(w) {
  if (!/[a-z]'[a-z]/.test(w) || /'s$/.test(w) || lexikonEn().has(w)) return null;
  const voll = w.replace("'", 'e');
  return { voll, vor: (voll.slice(0, w.indexOf("'")).match(/[aeiouy]+/g) || []).length, n: schreibSilbenEn(w.replace(/'/g, '')) };
}
// welche Silbe der vollen Form entfällt: die unbetonte an der Stelle des Hochkommas (sonst die nächstgelegene), −1 = keine
function wegIndex(st, a) {
  if (st.length <= a.n) return -1;
  let i = Math.min(a.vor, st.length - 1);
  if (st[i] !== 0) { const z = st.map((x, j) => (x === 0 ? j : -1)).filter(j => j >= 0); if (!z.length) return -1; i = z.reduce((b, j) => (Math.abs(j - a.vor) < Math.abs(b - a.vor) ? j : b)); }
  return i;
}
// Wort → { stufen, quelle, einsilberKlasse } wie wortBetonung (deutsch)
export function wortBetonungEn(roh, tiefe = 0) {
  let w = roh.toLowerCase().replace(/’/g, "'").replace(/[^a-z']/g, '').replace(/^'+(?!(cause|bout|til|em|course)$)/, '');
  if (!w.replace(/'/g, '')) return { stufen: [], quelle: 'leer' };
  if (/in'$/.test(w) && !lexikonEn().has(w)) w = w.slice(0, -1) + 'g';      // goin' → going
  if (/'$/.test(w) && !lexikonEn().has(w)) w = w.replace(/'+$/, '');            // schließendes Hochkomma (‘here’) zählt nicht
  if (klasseEinsilberEn(w) !== 'c' && (stufenEn(w) || [0]).length <= 1)
    return { stufen: [0], quelle: 'kleinwort', einsilberKlasse: klasseEinsilberEn(w), vers: versAnteilEn(w, 1) };
  const a = auslassung(w);
  if (a) {
    // nur, wenn die volle Form ein Wort ist (Wörterbuch oder gebeugt) – sonst steht das Hochkomma für etwas anderes
    // (th'Wind = the + Wind, Thou'll = thou will, an' = and) und e-Einsetzen ergäbe ein Scheinkompositum (Haider dev)
    const v = wortBetonungEn(a.voll, tiefe);
    if ((v.quelle === 'lexikon' || v.quelle === 'muret' || v.quelle === 'beugung') && v.stufen.length) {
      const st = v.stufen.slice(), i = wegIndex(st, a); if (i >= 0) st.splice(i, 1);
      if (st.length > 1 && !st.includes(2)) st[Math.max(0, st.indexOf(1))] = 2;
      const out = { stufen: st, quelle: 'auslassung', vers: versAnteilEn(w, st.length) };
      if (st.length === 1) out.einsilberKlasse = klasseEinsilberEn(w);
      return out;
    }
  }
  let st = aussprache() === 'buehne' ? muret1900(w) : null, quelle = st ? 'muret' : 'lexikon';
  if (!st) st = stufenEn(w);
  if (!st) { const m = muretEn().get(w); if (m) { st = m.st; quelle = 'muret'; } }
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
  const out = { stufen: st, quelle, vers: versAnteilEn(w, st.length) };
  if (st.length === 1) out.einsilberKlasse = klasseEinsilberEn(w);
  return out;
}

// ---------- Reim ----------
const HOCH_VORN = /^'+(?!(cause|bout|til|em|course)$)/;   // 'neath = neath, aber 'cause, 'bout … bleiben
export function phonesWortEn(roh) {
  let w = roh.toLowerCase().replace(/’/g, "'").replace(/[^a-z']/g, '');
  if (!lexikonEn().has(w)) w = w.replace(HOCH_VORN, '');
  const L = lexikonEn();
  if (L.has(w)) return L.get(w);
  if (/in'$/.test(w) && L.has(w.slice(0, -1) + 'g')) return L.get(w.slice(0, -1) + 'g');
  const a = auslassung(w);
  if (a && L.has(a.voll)) {   // Laute der vollen Form ohne die ausgelassene Silbe (heav'n: HH EH1 V N; pow'r: P AW1 R)
    const p = L.get(a.voll).split(' '), vok = p.map((x, j) => (VOKAL.test(x) ? j : -1)).filter(j => j >= 0);
    const i = wegIndex(vok.map(j => ({ 1: 2, 2: 1, 0: 0 })[p[j].slice(-1)]), a);
    if (i >= 0) { const j = vok[i]; if (/^ER/.test(p[j])) p[j] = 'R'; else p.splice(j, 1); }
    return p.join(' ');
  }
  const m = muretEn().get(w); if (m && m.reim) return m.reim;
  w = w.replace(/'/g, '');
  if (L.has(w)) return L.get(w);
  for (let i = 1; i <= w.length - 3; i++) if (L.has(w.slice(i))) return L.get(w.slice(i));   // Endglied reimt
  return null;
}
// Kommen die Laute eines Worts aus Muret und sind nicht am Bild nachgelesen, ist sein Reim nur vermutet (Jörg, „B a“):
// die Oberfläche zeigt ihn grau.
export function lautVermutetEn(roh) {
  let w = roh.toLowerCase().replace(/’/g, "'").replace(/[^a-z']/g, ''); const L = lexikonEn();
  if (!L.has(w)) w = w.replace(HOCH_VORN, '');
  if (L.has(w) || (/in'$/.test(w) && L.has(w.slice(0, -1) + 'g'))) return false;
  const a = auslassung(w); if (a && L.has(a.voll)) return false;
  const m = muretEn().get(w); return !!(m && m.reim && !m.sicher);
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
