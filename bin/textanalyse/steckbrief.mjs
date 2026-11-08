// Stil-Steckbrief: was einen Text (oder ein Set) messbar ausmacht – Maß, Reim, Bau, Wortschatz.
// Zeigt, wertet nicht. Grundlage für „im eigenen Stil schreiben“ (Mensch oder KI).
import { anzeige, BAUTEIL } from './analyse.mjs';
import { klasseEinsilber } from './kleinwoerter-de.mjs';
import { klasseEinsilberEn } from './englisch.mjs';
import { spracheText } from './sprache.mjs';

const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const anteil = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const zaehle = (liste) => { const m = new Map(); liste.forEach(x => m.set(x, (m.get(x) || 0) + 1)); return [...m].sort((a, b) => b[1] - a[1]); };

// Rohzahlen eines Textes – werden für Sets zusammengelegt
function erfassen(text) {
  const z = anzeige(text), roh = text.split('\n');
  const zeilen = [], abschnitte = [];
  let akt = null;
  z.forEach((x, i) => {
    if (x.typ === 'abschnitt') { if (BAUTEIL.test(x.name)) { akt = { name: x.name, zeilen: [] }; abschnitte.push(akt); } return; }
    if (x.typ !== 'zeile' || !x.n) return;
    const muster = x.silben.map(s => (s.m === 'S' ? 'X' : 'x')).join('');
    const e = { sprache: x.sprache, n: x.n, h: x.h, k: x.k, muster, reim: x.reim || null, art: x.reimArt || null, binnen: (x.binnen || []).length,
      prall: x.silben.some((s, j) => j && s.m === 'S' && x.silben[j - 1].m === 'S'), text: roh[i] };
    zeilen.push(e);
    if (!akt) { akt = { name: '(ohne Abschnitt)', zeilen: [] }; abschnitte.push(akt); }
    akt.zeilen.push(e);
  });
  const woerter = zeilen.flatMap(e => (e.text.replace(/\[[^\]]*\]/g, ' ').match(/[A-Za-zÄÖÜäöüß']+/g) || []).map(w => ({ w, sprache: e.sprache })));
  return { zeilen, abschnitte, woerter, zeichen: text.length, sprache: spracheText(text).gesamt };
}

function beschreiben(daten, titel) {
  const Z = daten.flatMap(d => d.zeilen), A = daten.flatMap(d => d.abschnitte), W = daten.flatMap(d => d.woerter);
  if (!Z.length) return { titel, hinweis: 'keine analysierbaren deutschen oder englischen Zeilen' };
  const inhalt = W.filter(({ w, sprache }) => w.length > 2 && (sprache === 'en' ? klasseEinsilberEn(w) : klasseEinsilber(w)) === 'c').map(({ w }) => w.toLowerCase());
  const schemata = A.filter(a => a.zeilen.length >= 2).map(a => a.zeilen.map(z => z.reim || '–').join(''));
  return {
    titel,
    umfang: { songs: daten.length, zeilen: Z.length, abschnitte: A.length, woerter: W.length, zeichenMedian: median(daten.map(d => d.zeichen)) },
    sprachen: { zeilenDeutsch: `${anteil(Z.filter(z => z.sprache === 'de').length, Z.length)} %`, zeilenEnglisch: `${anteil(Z.filter(z => z.sprache === 'en').length, Z.length)} %`,
      songs: Object.fromEntries(zaehle(daten.map(d => d.sprache || 'unbekannt'))) },
    mass: {
      silbenMedian: median(Z.map(z => z.n)), silbenSpanne: [Math.min(...Z.map(z => z.n)), Math.max(...Z.map(z => z.n))],
      hebungenHaeufig: zaehle(Z.map(z => z.h)).slice(0, 4).map(([h, c]) => `${h} Hebungen: ${anteil(c, Z.length)} %`),
      auftakt: `${anteil(Z.filter(z => z.muster[0] === 'x').length, Z.length)} % der Zeilen beginnen unbetont (steigend)`,
      doppelsenkung: `${anteil(Z.filter(z => /Xxx/.test(z.muster)).length, Z.length)} % der Zeilen mit zwei Senkungen hintereinander`,
      hebungsprall: `${anteil(Z.filter(z => z.prall).length, Z.length)} % der Zeilen mit zwei Hebungen direkt hintereinander`,
      kadenz: `${anteil(Z.filter(z => z.k === 'm').length, Z.length)} % enden betont (männlich), ${anteil(Z.filter(z => z.k === 'w').length, Z.length)} % unbetont (weiblich)`,
      musterHaeufig: zaehle(Z.map(z => z.muster)).slice(0, 5).map(([m, c]) => `${m} ×${c}`),
    },
    reim: {
      endreim: `${anteil(Z.filter(z => z.reim).length, Z.length)} % der Zeilen reimen am Ende`,
      arten: zaehle(Z.filter(z => z.art).map(z => z.art)).map(([a, c]) => `${a} ${anteil(c, Z.filter(z => z.art).length)} %`),
      schemata: zaehle(schemata).slice(0, 6).map(([s, c]) => `${s} ×${c}`),
      binnenreimeJe10Zeilen: Math.round((10 * Z.reduce((s, z) => s + z.binnen, 0)) / Z.length * 10) / 10,
    },
    bau: {
      abschnitte: zaehle(A.map(a => a.name.replace(/\s*\d+$/, ''))).slice(0, 8).map(([n, c]) => `${n} ×${c}`),
      zeilenJeAbschnittMedian: median(A.map(a => a.zeilen.length)),
    },
    wortschatz: {
      verschiedeneWoerter: `${anteil(new Set(W.map(({ w }) => w.toLowerCase())).size, W.length)} % verschiedene Wörter`,
      haeufigeInhaltswoerter: zaehle(inhalt).slice(0, 25).map(([w, c]) => `${w} ×${c}`),
    },
  };
}

// Deutsch und Englisch (auch gemischt, zeilenweise); Texte in fremder Schrift werden ausgelassen.
// istDeutsch bleibt für ältere Aufrufer erhalten.
export const istDeutsch = text => spracheText(text).gesamt === 'de';
export const steckbriefText = (text, titel = 'Text') => beschreiben([erfassen(text)], titel);
export function steckbriefSet(texte, titel = 'Set') {
  const ok = texte.filter(t => ['de', 'en', 'gemischt'].includes(spracheText(t).gesamt));
  const b = beschreiben(ok.map(erfassen), titel);
  b.umfang = { ...b.umfang, ausgelassenFremd: texte.length - ok.length };
  return b;
}
