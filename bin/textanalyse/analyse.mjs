// Liedtext → je Zeile Silben mit Hebung/Senkung, Silbenzahl, Hebungen, Kadenz, Reim.
// Eine Rechnung für alles: anzeige() (unten) speist Oberfläche und Kommandozeile.
// Aufruf zum Ausprobieren: node kern/analyse.mjs < text.txt
import { wortBetonung } from './betonung-de.mjs';
import { hebungen } from './metrik.mjs';
import { wortBetonungEn, letzteSilbeVollEn, phonesWortEn, reimteilEn, reimStufeEn } from './englisch.mjs';
import { spracheText, ohneKlammern } from './sprache.mjs';

// Schreibsilben für die Anzeige: Wort in n Stücke teilen, Grenze vor dem letzten Konsonanten
// zwischen zwei Vokalgruppen (ch, sch, ck, ph, th, qu bleiben zusammen).
const VG = /(äu|eu|au|ei|ai|ey|ay|ie|aa|ee|oo|[aeiouäöüyAEIOUÄÖÜY])/g;
const ANLAUTE = new Set('schr schl schw schm schn spr str sch chr ch ck ph th qu sp st pl pr bl br kl kr gl gr fl fr tr dr kn pf zw'.split(' '));
export function schreibSilbenTeilen(wort, n) {
  if (n <= 1) return [wort];
  const gruppen = [...wort.matchAll(VG)].map(m => [m.index, m.index + m[0].length]);
  if (gruppen.length < n) { const l = Math.ceil(wort.length / n); return Array.from({ length: n }, (_, i) => wort.slice(i * l, (i + 1) * l)).filter(Boolean); }
  // überzählige Gruppen (z. B. „ie“ in Familie) vorn zusammenlegen
  while (gruppen.length > n) { const [a] = gruppen.splice(1, 1); gruppen[0][1] = Math.max(gruppen[0][1], a[1]); }
  const grenzen = [];
  for (let i = 1; i < gruppen.length; i++) {
    const von = gruppen[i - 1][1], bis = gruppen[i][0];
    const zw = wort.slice(von, bis);
    // längstes erlaubtes Silbenanfangs-Bündel geht zur nächsten Silbe (ver-spricht, Herz-schlag)
    let g = bis;
    for (let l = Math.min(zw.length, 4); l >= 1; l--) {
      const t = zw.slice(zw.length - l).toLowerCase();
      if (l === 1 || ANLAUTE.has(t)) { g = bis - l; break; }
    }
    grenzen.push(g);
  }
  const teile = []; let a = 0;
  for (const g of grenzen) { teile.push(wort.slice(a, g)); a = g; }
  teile.push(wort.slice(a));
  return teile;
}

// Für die Oberfläche: je Zeile Silben mit Zeichenpositionen (von/bis in der Rohzeile),
// Hebungsmuster, Silbenzahl, Hebungen, Kadenz; Reimbuchstaben über alle Zeilen.
import { letzteSilbeVoll, reimteil, reimteilAb, reimStufe, ipaWort } from './reim-de.mjs';

// Reimteil eines Wortes je Sprache (ab = Silbe der metrischen Hebung, sonst letzter Wortton)
export function reimteilWort(w, sprache = 'de', ab = null) {
  if (sprache === 'en') return reimteilEn(phonesWortEn(w), ab);
  return ab != null ? reimteilAb(ipaWort(w), ab) : reimteil(ipaWort(w));
}
// Reimvergleich zweier Wörter; verschiedene Sprachen reimen hier nicht
export function reimVergleich(a, b) {
  if (!a || !b || !a.rp || !b.rp || a.sprache !== b.sprache) return null;
  return a.sprache === 'en' ? reimStufeEn(a.rp, b.rp) : reimStufe(a.rp, b.rp);
}
// Endreime: Buchstaben je Abschnitt (ABAB …), Partner höchstens FENSTER Zeilen zurück im selben Abschnitt
const FENSTER = 4;
function reimschema(enden) {
  const abschnitt = []; let nr = 0;
  enden.forEach((e, i) => { if (e === '§') nr++; abschnitt[i] = nr; });
  const teile = enden.map(e => (!e || e === '§' ? null : { sprache: e.sprache, rp: reimteilWort(e.w, e.sprache, e.ab) }));
  const buchst = new Array(teile.length).fill(null), art = new Array(teile.length).fill(null);
  const naechster = {};
  for (let i = 0; i < teile.length; i++) {
    if (!teile[i] || !teile[i].rp) continue;
    for (let j = i - 1, gezaehlt = 0; j >= 0 && gezaehlt < FENSTER && abschnitt[j] === abschnitt[i]; j--) {
      if (!teile[j] || !teile[j].rp) continue;
      gezaehlt++;
      const st = reimVergleich(teile[i], teile[j]);
      if (st === 'rein' || st === 'fast rein' || st === 'unrein') {
        if (!buchst[j]) { naechster[abschnitt[i]] = (naechster[abschnitt[i]] || 0) + 1; buchst[j] = String.fromCharCode(64 + naechster[abschnitt[i]]); art[j] = st; }
        buchst[i] = buchst[j]; art[i] = st; break;
      }
    }
  }
  return { buchst, art };
}
// Nur Bauteile trennen Reimabschnitte; Vortragsangaben wie [whisper] oder [baritone] nicht
export const BAUTEIL = /^(verse|strophe|chorus|refrain|pre-?chorus|post-?chorus|bridge|intro|outro|interlude|break|drop|hook|final|instrumental|solo)/i;
export function anzeige(text) {
  const spr = spracheText(text).zeilen;     // 'de' | 'en' | 'fremd' je Zeile
  const maskiert = ohneKlammern(text).split('\n');   // alles in [ ] durch Leerzeichen ersetzt, Positionen bleiben
  const zeilen = text.split('\n').map((roh, zi) => {
    const t = roh.trim();
    if (!t) return { typ: 'leer' };
    const ohneRegie = maskiert[zi];
    // nur Klammerinhalt in der Zeile → Regie-/Abschnittszeile (auch Fortsetzung einer mehrzeiligen Angabe)
    if (!ohneRegie.trim()) return { typ: 'abschnitt', name: t.replace(/^\[|\]$/g, '').trim() };
    // Fremde Schrift (kyrillisch, japanisch …) wird nicht analysiert; sonst deutsch oder englisch je Zeile
    if (spr[zi] === 'fremd') return { typ: 'fremd' };
    const sprache = spr[zi] === 'en' ? 'en' : 'de';
    const betone = sprache === 'en' ? wortBetonungEn : wortBetonung;
    const treffer = [...ohneRegie.matchAll(/[A-Za-zÄÖÜäöüß'’]+/g)];
    const woerter = treffer.map(m => ({ w: m[0], von: m.index, ...betone(m[0]) }));
    const eingabe = [], silben = [];
    for (const x of woerter) {
      const n = x.stufen.length, mehr = n > 1;
      let pos = x.von;
      schreibSilbenTeilen(x.w, n).forEach((teil, i) => {
        silben.push({ von: pos, bis: pos + teil.length, st: x.stufen[i] ?? 0 });
        pos += teil.length;
        eingabe.push({ mehrsilbig: mehr, stufe: x.stufen[i] ?? 0, klasse: mehr ? null : (x.einsilberKlasse || 'c') });
      });
    }
    // Vollvokal am Zeilenende (Bräuti|gam) darf die Hebung tragen: weicher Nebenton
    const letzt = woerter[woerter.length - 1];
    if (letzt && letzt.stufen.length > 1 && letzt.stufen[letzt.stufen.length - 1] === 0 && (sprache === 'en' ? letzteSilbeVollEn : letzteSilbeVoll)(letzt.w))
      eingabe[eingabe.length - 1] = { ...eingabe[eingabe.length - 1], stufe: 1, weich: true };
    const { muster, fassung } = hebungen(eingabe, sprache);
    silben.forEach((s, i) => { s.m = muster[i]; });
    const letztes = woerter[woerter.length - 1];
    return {
      typ: 'zeile', sprache, silben, fassung,
      n: silben.length, h: muster.filter(m => m === 'S').length,
      k: muster.length ? (muster[muster.length - 1] === 'S' ? 'm' : 'w') : '',
      letztesWort: letztes ? letztes.w : null, letztesVon: letztes ? letztes.von : null,
      _woerter: woerter.map(x => ({ w: x.w, von: x.von, bis: x.von + x.w.length, inhalt: x.stufen.length > 1 || (x.einsilberKlasse || 'c') !== 'u' })),
    };
  });
  const enden = zeilen.map(z => {
    if (z.typ === 'abschnitt') return BAUTEIL.test(z.name) ? '§' : null;
    if (z.typ !== 'zeile' || !z.letztesWort) return null;
    const imWort = z.silben.filter(s => s.von >= z.letztesVon);
    const hebung = imWort.map(s => s.m).lastIndexOf('S'), akzent = imWort.map(s => s.st).lastIndexOf(2);
    return { w: z.letztesWort, sprache: z.sprache, ab: hebung > akzent && akzent >= 0 ? hebung : null };
  });
  const { buchst, art } = reimschema(enden);
  zeilen.forEach((z, i) => {
    if (z.typ !== 'zeile' || !buchst[i]) return;
    z.reim = buchst[i]; z.reimArt = art[i];
    // Reimteil ab der letzten Hebung im letzten Wort bis Wortende
    const imWort = z.silben.filter(s => s.von >= z.letztesVon);
    const ab = [...imWort].reverse().find(s => s.m === 'S') || imWort[0];
    z.reimVon = ab ? ab.von : z.letztesVon; z.reimBis = z.letztesVon + z.letztesWort.length;
  });
  // Reimpartner je Zeile: nächste Zeile mit gleichem Buchstaben im selben Abschnitt (für die Werkbank)
  let ab = 0; const abschnittVon = zeilen.map(z => (z.typ === 'abschnitt' && BAUTEIL.test(z.name) ? ++ab : ab));
  zeilen.forEach((z, i) => {
    if (!z.reim) return;
    let best = -1;
    zeilen.forEach((y, j) => { if (j !== i && y.reim === z.reim && abschnittVon[j] === abschnittVon[i] && (best < 0 || Math.abs(j - i) < Math.abs(best - i))) best = j; });
    if (best >= 0) { z.reimPartner = best; z.partnerWort = zeilen[best].letztesWort; }
  });
  binnenreime(zeilen);
  zeilen.forEach(z => { delete z._woerter; });
  return zeilen;
}

// Binnenreime: betonte Inhaltswörter, die rein auf ein Wort derselben oder der Nachbarzeile
// reimen (im selben Abschnitt). Reimt das Partnerwort am Zeilenende, gilt dessen Buchstabe;
// sonst bekommt die Gruppe den nächsten freien Buchstaben des Abschnitts.
// Englisch: Vokal plus Konsonanten bis zum nächsten Vokal (ARPAbet)
const silbeEn = rp => [rp.vokal, ...rp.koda.split(' ').filter(Boolean).filter((_, i, a) => !/^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)$/.test(a[i]) && a.slice(0, i).every(x => !/^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)$/.test(x)))].join(' ');
function binnenreime(zeilen) {
  let abschnitt = 0;
  const posten = [];
  zeilen.forEach((z, i) => {
    if (z.typ === 'abschnitt' && BAUTEIL.test(z.name)) abschnitt++;
    if (z.typ !== 'zeile') return;
    const n = z._woerter.length;
    z._woerter.forEach((x, k) => {
      const ende = k === n - 1;
      if (!ende && !x.inhalt) return;
      const sil = z.silben.filter(s => s.von >= x.von && s.bis <= x.bis);
      const rs = sil.length === 1 ? sil[0] : sil.find(s => s.st === 2) || [...sil].reverse().find(s => s.m === 'S');
      if (!rs) return;
      const rp = reimteilWort(x.w, z.sprache);
      // Silbenreim: Vokal der betonten Silbe plus Konsonanten bis zum nächsten Vokal (fal|len ~ Hall)
      if (rp) posten.push({ i, abschnitt, sprache: z.sprache, w: x.w.toLowerCase(), ende, inhalt: x.inhalt, von: rs.von, bis: x.bis, voll: rp.voll,
        silbe: z.sprache === 'en' ? silbeEn(rp) : rp.voll.replace(/^([^aɑɐeɛəiɪoɔuʊyʏøœ]*[aɑɐeɛəiɪoɔuʊyʏøœ][ːˑ\u0300-\u036F]*(?:[aɑɐeɛəiɪoɔuʊyʏøœ]\u032F)?[^aɑɐeɛəiɪoɔuʊyʏøœ]*).*$/, '$1'),
        r: ende ? z.reim : null, z });
    });
  });
  const naechster = {};   // je Abschnitt: höchster schon vergebener Buchstabe
  let ab = 0; zeilen.forEach(z => { if (z.typ === 'abschnitt' && BAUTEIL.test(z.name)) ab++; if (z.reim) naechster[ab] = Math.max(naechster[ab] || 0, z.reim.charCodeAt(0) - 64); });
  for (const x of posten) {
    if (x.ende) continue;
    for (const y of posten) {
      if (y === x || !y.inhalt || y.sprache !== x.sprache || y.abschnitt !== x.abschnitt || Math.abs(y.i - x.i) > 1 || y.w === x.w || (y.voll !== x.voll && y.silbe !== x.silbe)) continue;
      if (!x.r) x.r = y.r || (naechster[x.abschnitt] = (naechster[x.abschnitt] || 0) + 1, String.fromCharCode(64 + naechster[x.abschnitt]));
      if (!y.ende && !y.r) y.r = x.r;
    }
  }
  for (const x of posten) if (!x.ende && x.r) (x.z.binnen = x.z.binnen || []).push({ von: x.von, bis: x.bis, r: x.r });
}

// Kommandozeile – steht am Ende, weil sie die Konstanten oben braucht
if (import.meta.url === `file://${process.argv[1]}`) {
  const fs = await import('node:fs');
  const txt = fs.readFileSync(0, 'utf8');
  const roh = txt.split('\n');
  anzeige(txt).forEach((z, i) => {
    if (z.typ === 'abschnitt') return console.log(`[${z.name}]`);
    if (z.typ === 'fremd') return console.log(`   (fremd)          ${roh[i]}`);
    if (z.typ !== 'zeile') return;
    const m = z.silben.map(x => (x.m === 'S' ? 'X' : 'x')).join('');
    const r = (z.reim || ' ') + (z.reimArt === 'unrein' ? '~' : z.reimArt === 'fast rein' ? '≈' : ' ');
    console.log(`${String(z.n).padStart(2)} ${z.h}H ${z.k} ${r} ${m.padEnd(14)} ${roh[i]}`);
  });
}
