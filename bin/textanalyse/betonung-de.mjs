// Wortbetonung Deutsch: Wort → Betonungsstufe je Silbe (2 Haupt, 1 Neben, 0 unbetont).
// Reihenfolge: Lexikon (ipa-dict, aus Wiktionary) → Beugungsendung abtrennen →
// Kompositum zerlegen (Hauptakzent aufs Erstglied) → Regel (Stammsilbe, unbetonte Präfixe).
import { lexikon, stufenVon } from './lexikon-de.mjs';
import { klasseEinsilber } from './kleinwoerter-de.mjs';

// Lexikon: gemeinsamer Lader (lexikon-de.mjs) – Betonung wird beim Nachschlagen abgeleitet
export const lexikonDe = lexikon;

// Silbenkerne in der Schreibung (nur Rückfall, wenn das Lexikon nichts weiß)
const KERN = /(äu|eu|au|ei|ai|ey|ay|ie|aa|ee|oo|[aeiouäöüy])/gi;
export const schreibSilben = w => (w.match(KERN) || []).length;

const UNBETONTE_PRAEFIXE = ['be', 'ge', 'er', 'ver', 'zer', 'ent', 'emp'];
const ENDUNGEN = ['ern', 'ens', 'en', 'em', 'er', 'es', 'est', 'et', 'st', 'e', 'n', 's', 't'];
const BETONTE_SUFFIXE = [['ieren', -2], ['ierst', -1], ['iert', -1], ['ität', -1], ['tät', -1], ['ion', -1], ['ei', -1]];

const ZAHL_UND = /^(ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun)und(zwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig)/i;
const nachschlagen = w => stufenVon(w) || stufenVon(w.toLowerCase()) || stufenVon(w[0].toUpperCase() + w.slice(1).toLowerCase()) || null;

function regel(w) {
  const n = Math.max(1, schreibSilben(w));
  const st = new Array(n).fill(0);
  if (n === 1) return st;
  const lw = w.toLowerCase();
  for (const [suf, pos] of BETONTE_SUFFIXE)
    if (lw.endsWith(suf) && n + pos >= 0) { st[n + pos] = 2; return st; }
  const praefix = UNBETONTE_PRAEFIXE.some(p => lw.startsWith(p) && schreibSilben(lw.slice(p.length)) >= 1);
  st[praefix ? 1 : 0] = 2;
  return st;
}

// Ergebnis: { stufen, quelle, einsilberKlasse }
export function wortBetonung(roh, tiefe = 0) {
  const w = roh.replace(/[^A-Za-zÄÖÜäöüßſ'’-]/g, '').replace(/ſ/g, 's').replace(/[’]/g, "'");
  const ohneApo = w.replace(/'/g, '');
  if (!ohneApo) return { stufen: [], quelle: 'leer' };

  // Kleine Wörter aus der Liste sind immer einsilbig und unbetont/betonbar – Vorrang vor dem Lexikon
  if (klasseEinsilber(ohneApo) !== 'c' && schreibSilben(ohneApo) <= 1)
    return { stufen: [0], quelle: 'kleinwort', einsilberKlasse: klasseEinsilber(ohneApo) };

  let st = null, quelle = 'lexikon';
  // angehängtes 's (hat's, war's, geht's) bildet keine eigene Silbe
  if (/'s$/i.test(w) && w.length > 3) {
    const b = wortBetonung(w.slice(0, -2), tiefe);
    return { ...b, quelle: b.quelle + "+'s" };
  }
  // Satzzeichen zählen nicht: gibt es das Wort ohne Apostroph, gilt es so (hab', Haus' als Anführung)
  if (w !== ohneApo) { const bar = nachschlagen(ohneApo); if (bar) st = bar; }
  if (!st && w !== ohneApo) {
    // Auslassung: steh'n = stehen, soll'n = sollen – volles Wort nachschlagen, eine unbetonte Silbe weniger
    const voll = w.includes("'") && !/'$/.test(w) ? w.replace("'", 'e') : ohneApo + 'e';
    const v = nachschlagen(voll);
    if (v && v.length > 1) {
      const i = v.lastIndexOf(0);
      st = i >= 0 ? v.filter((_, j) => j !== i) : v.slice(0, -1);
      quelle = 'auslassung';
    }
  }
  if (!st) st = nachschlagen(ohneApo);

  if (!st) {
    // Beugungsendung abtrennen
    for (const e of ENDUNGEN) {
      if (ohneApo.length - e.length < 3 || !ohneApo.toLowerCase().endsWith(e)) continue;
      const stamm = nachschlagen(ohneApo.slice(0, -e.length));
      if (stamm) {
        const zusatz = schreibSilben(ohneApo) - stamm.length;
        st = stamm.concat(new Array(Math.max(0, zusatz)).fill(0)); quelle = 'beugung'; break;
      }
    }
  }
  if (!st && tiefe < 2) {
    // Kompositum: längstes bekanntes Erstglied, Rest rekursiv
    for (let i = ohneApo.length - 3; i >= 3 && !st; i--) {
      let kopf = ohneApo.slice(0, i), rest = ohneApo.slice(i);
      let k = nachschlagen(kopf);
      if (!k && /(s|es|n|en)$/.test(kopf)) k = nachschlagen(kopf.replace(/(es|s|en|n)$/, '')) && nachschlagen(kopf.replace(/(es|s|en|n)$/, '')).concat(/e[sn]$/.test(kopf) ? [0] : []);
      if (!k) continue;
      const r = wortBetonung(rest[0].toUpperCase() + rest.slice(1), tiefe + 1);
      if (r.quelle === 'regel' || !r.stufen.length) continue;
      // Kompositum (Wiese 1996, Kap. 8): Hauptakzent im Erstglied, Nebenakzent im letzten Glied;
      // Nebenakzente innerhalb des Erstglieds treten zurück ([[Voll|mond]|licht]).
      const kk = k.map(x => (x === 1 ? 0 : x)); if (!kk.includes(2)) kk[0] = 2;
      const glied = r.stufen.length === 1 ? [r.einsilberKlasse === 'c' || !r.einsilberKlasse ? 1 : 0]
        : r.stufen.map(x => (x === 2 ? 1 : 0));
      st = kk.concat(glied); quelle = 'kompositum';
    }
  }
  if (!st) { st = regel(ohneApo); quelle = 'regel'; }

  st = st.slice();
  // Zahlwörter mit „und“ (dreiundzwánzig): Hauptakzent auf dem letzten Glied, Nebenakzent vorn (Krech 2009);
  // ipa-dict betont hier durchweg das erste Glied
  if (ZAHL_UND.test(ohneApo)) {
    const vorn = st.indexOf(2), hinten = st.reduce((x, v, j) => (v ? j : x), -1);
    if (vorn >= 0 && hinten > vorn) { st[vorn] = 1; st[hinten] = 2; }
  }
  if (st.length > 1 && !st.includes(2)) { const r = regel(ohneApo); if (r.length === st.length) st = r; else st[0] = 2; }
  const out = { stufen: st, quelle };
  if (st.length === 1) out.einsilberKlasse = klasseEinsilber(ohneApo);
  return out;
}
