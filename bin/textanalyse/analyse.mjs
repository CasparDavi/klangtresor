// Liedtext → je Zeile Silben mit Hebung/Senkung, Silbenzahl, Hebungen, Kadenz, Reim.
// Eine Rechnung für alles: anzeige() (unten) speist Oberfläche und Kommandozeile.
// Aufruf zum Ausprobieren: node kern/analyse.mjs < text.txt
import { wortBetonung } from './betonung-de.mjs';
import { hebungen } from './metrik.mjs';
import { wortBetonungEn, letzteSilbeVollEn, phonesWortEn, reimteilEn, reimStufeEn, lautVermutetEn } from './englisch.mjs';
import { spracheText, ohneKlammern } from './sprache.mjs';
import { wortBetonungRu, silbenRu } from './russisch.mjs';
import { reimteilRu, reimStufeRu } from './laute-ru.mjs';
import { formen } from './formen.mjs';

import { trennstuecke } from './trennung.mjs';
// Schreibsilben für die Anzeige: Wort in n Stücke teilen, Grenze vor dem letzten Konsonanten
// zwischen zwei Vokalgruppen (ch, sch, ck, ph, th, qu bleiben zusammen).
const VG = /(äu|eu|au|ei|ai|ey|ay|ie|aa|ee|oo|[aeiouäöüyAEIOUÄÖÜY])/g;
const ANLAUTE = new Set('schr schl schw schm schn spr str sch chr ch ck ph th qu sp st pl pr bl br kl kr gl gr fl fr tr dr kn pf zw'.split(' '));
// Zuerst die TeX-Trennmuster (kern/trennung.mjs, Jörg 12.11.2026: „ich will natürlich richtig trennen“): ergeben sie genau
// n Stücke, gelten sie (aal-ähn-lich statt aa-lähn-lich); sonst die eigene Regel darunter.
export function schreibSilbenTeilen(wort, n, sprache = 'de') {
  if (n <= 1) return [wort];
  if (sprache === 'ru') { const t = silbenRu(wort); if (t.length === n) return t; }   // Russisch: Silbe = Vokalbuchstabe (kern/russisch.mjs)
  const tm = trennstuecke(wort, sprache);
  if (tm && tm.length === n) return tm;
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
  if (sprache === 'ru') return reimteilWortRu(w, ab);
  return ab != null ? reimteilAb(ipaWort(w), ab) : reimteil(ipaWort(w));
}
// Russisch: Reimteil ab der betonten Silbe; ab = vom Versmaß gewählte Betonung eines Homographen (за́мок/замо́к) – dann auch die
// passende Schreibung (звёзды statt звезды́)
export function reimteilWortRu(w, ab = null) {
  const b = wortBetonungRu(w); if (!b.stufen.length) return null;
  let haupt = b.stufen.indexOf(Math.max(...b.stufen)), form = b.form || w.toLowerCase().replace(/[\u0300\u0301+]/g, '');
  if (b.varianten) { const v = b.varianten.find(x => x.haupt === ab) || b.varianten[0]; haupt = v.haupt; form = v.form; }
  else if (ab != null && ab < b.stufen.length && b.quelle !== 'eigen') haupt = b.stufen[ab] ? ab : haupt;
  return reimteilRu(form, haupt);
}
// Reimvergleich zweier Wörter; verschiedene Sprachen reimen hier nicht
export function reimVergleich(a, b) {
  if (!a || !b || !a.rp || !b.rp || a.sprache !== b.sprache) return null;
  return a.sprache === 'en' ? reimStufeEn(a.rp, b.rp) : a.sprache === 'ru' ? reimStufeRu(a.rp, b.rp) : reimStufe(a.rp, b.rp);
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
  // Assonanz (Burdorf 2.2.1, Breuer § 38): nur die Vokale ab dem letzten Ton stimmen überein (Himmel/Stille,
  // blind/ertrinkt). Eigene Kennung (kleine Buchstaben), zählt nicht als Endreim. Nur für Zeilen ohne Endreim,
  // Partner direkt davor oder eine Zeile dazwischen (Paar- oder Kreuzstellung) – sonst klingt fast alles an.
  const asso = new Array(teile.length).fill(null), naechsteA = {};
  for (let i = 0; i < teile.length; i++) {
    if (!teile[i] || !teile[i].rp || buchst[i]) continue;
    for (let j = i - 1, gezaehlt = 0; j >= 0 && gezaehlt < 2 && abschnitt[j] === abschnitt[i]; j--) {
      if (!teile[j] || !teile[j].rp) continue;
      gezaehlt++;
      if (buchst[j] || reimVergleich(teile[i], teile[j]) !== 'Assonanz' || vokalGeruest(teile[i]) !== vokalGeruest(teile[j])) continue;
      if (!asso[j]) { naechsteA[abschnitt[i]] = (naechsteA[abschnitt[i]] || 0) + 1; asso[j] = String.fromCharCode(96 + naechsteA[abschnitt[i]]); }
      asso[i] = asso[j]; break;
    }
  }
  return { buchst, art, asso };
}
// Vokalfolge ab dem Ton, ohne Länge; Schwa und vokalisches r gelten gleich (Wasser/Gassen)
const VOK_DE = 'aɑɐeɛəiɪoɔuʊyʏøœæɜʌɒ';
const VOK_EN = /^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)$/;
function vokalGeruest(t) {
  if (t.sprache === 'en') return t.rp.voll.split(' ').filter(x => VOK_EN.test(x)).join(' ');
  if (t.sprache === 'ru') return t.rp.vokale;
  return (t.rp.voll.replace(/[ːˑ]/g, '').match(new RegExp(`[${VOK_DE}](?:[${VOK_DE}]\u032F)?`, 'g')) || [])
    .map((v, k) => (k && /^[əɐ]$/.test(v) ? 'ə' : v)).join(' ');
}
// Nur Bauteile trennen Reimabschnitte; Vortragsangaben wie [whisper] oder [baritone] nicht. Seit 2026-11-11.2 auch „Vers 1“
// (deutsch), „Pre Chorus“ mit Leerzeichen, Epilog/Prolog/Prelude/Coda (im Archiv 19/10/12/7-mal nicht erkannt)
export const BAUTEIL = /^(verse?\b|strophe|chorus|refrain|pre[\s-]?(?:chorus|refrain)|post[\s-]?(?:chorus|refrain)|bridge|intro|outro|interlude|break|drop|hook|final|instrumental|solo|epilog|prolog|prelude|coda)/i;
export function anzeige(text) {
  const spr = spracheText(text).zeilen;     // 'de' | 'en' | 'fremd' je Zeile
  const maskiert = ohneKlammern(text).split('\n');   // alles in [ ] durch Leerzeichen ersetzt, Positionen bleiben
  // Vorspann (Caspar_D, KlangTresor: „Vorspann raus — alles vor der ersten Klammer“; KlangFeder seit 2026-11-11.5):
  // Was vor der ersten Zeile mit „[“ steht, ist kein Liedtext, sondern eine Notiz im Textfeld – Hinweis auf die
  // Playlist, Dank, „English text at the bottom“. Niemand singt es (Abgleich mit Whisper im KlangTresor). Es wird
  // angezeigt wie ein #-Kommentar und nicht gezählt. Ohne jede Klammer im Text zählt alles wie bisher.
  const ersteKlammer = text.split('\n').findIndex(r => r.trim().startsWith('['));
  const zeilen = text.split('\n').map((roh, zi) => {
    const t = roh.trim();
    if (!t) return { typ: 'leer' };
    const ohneRegie = maskiert[zi];
    if (t.startsWith('#')) return { typ: 'kommentar' };   // Kommentarzeile: Notiz, kein Vers
    if (zi < ersteKlammer) return { typ: 'kommentar', vorspann: true };
    // nur Klammerinhalt in der Zeile → Regie-/Abschnittszeile (auch Fortsetzung einer mehrzeiligen Angabe)
    if (!ohneRegie.trim()) return { typ: 'abschnitt', name: t.replace(/^\[|\]$/g, '').trim() };
    // Platzhalter aus dem Gerüst (Jörg, 10.11.2026): „x-X-x-X“ – je Silbe x (unbetont) oder X (betont), mit Bindestrich
    // getrennt, mindestens zwei Silben. Sie zählen wie Silben mit genau dieser Betonung, reimen aber nicht.
    // Mit Reimschema steht an der letzten betonten Silbe der Reimbuchstabe (A–W) statt X – auch er ist eine betonte Silbe.
    // Am Ende darf statt X ein Reimklang stehen (Jörg, 10.11.2026): „x-x-ICHT“ – groß betont, klein unbetont.
    // „___“ ist eine Lücke ohne Maß: ihr Maß kommt in der Werkbank aus der Partnerzeile; sie zählt keine Silben.
    const platz = [...ohneRegie.matchAll(/(?<=^|\s)((?:[xX]+|[A-W])(?:-(?:[xX]+|[A-W]))*(?:-[A-Za-zÄÖÜäöüß]{2,})?)(?=[\s.,;:!?…]|$)/g)]
      .filter(m => m[1].includes('-') && /(?:^|-)[xX]+(?:-|$)/.test(m[1]));
    for (const m of ohneRegie.matchAll(/_{3,}/g)) platz.push(Object.assign([m[0], m[0]], { index: m.index, luecke: true }));
    const ohnePlatz = platz.reduce((t, m) => t.slice(0, m.index) + ' '.repeat(m[1].length) + t.slice(m.index + m[1].length), ohneRegie);
    // Fremde Schrift (kyrillisch, japanisch …) wird nicht analysiert; sonst deutsch oder englisch je Zeile
    if (spr[zi] === 'fremd' && !platz.length) return { typ: 'fremd' };
    // Zeilen nur aus Satzzeichen („…“, „– – –“) zählen wie Leerzeilen: Satzzeichen spielen keine Rolle
    const ru = spr[zi] === 'ru';
    if (!(ru ? /[А-Яа-яЁё]/ : /[A-Za-zÄÖÜäöüß]/).test(ohneRegie) && !/_{3,}/.test(ohneRegie)) return { typ: 'leer' };
    const sprache = spr[zi] === 'en' ? 'en' : ru ? 'ru' : 'de';
    const betone = sprache === 'en' ? wortBetonungEn : ru ? wortBetonungRu : wortBetonung;
    // Russisch: kyrillische Wörter mit Bindestrich (кто-то, из-за) und eigenen Betonungszeichen (за́мок, замОк, зам+ок)
    const treffer = [...ohnePlatz.matchAll(ru ? /[А-Яа-яЁё\u0300\u0301+]+(?:-[А-Яа-яЁё\u0300\u0301+]+)*/g : /[A-Za-zÄÖÜäöüß'’]+/g)].filter(m => !ru || /[А-Яа-яЁё]/.test(m[0]));
    const woerter = treffer.map(m => ({ w: m[0], von: m.index, ...betone(m[0]) }));
    const eingabe = [], silben = [];
    const teile = [...woerter.map(x => ({ x })), ...platz.map(m => ({ p: m }))].sort((a, b) => (a.x ? a.x.von : a.p.index) - (b.x ? b.x.von : b.p.index));
    for (const { x, p } of teile) {
      if (p) {   // Platzhalter: jede Gruppe aus x oder X ist eine Silbe, ein Reimklang am Ende auch
        if (p.luecke) continue;
        let pos = p.index;
        for (const seg of p[1].split('-')) {
          const betont = /^[xX]+$/.test(seg) ? seg.includes('X') : /^[A-W]$/.test(seg) || /^[A-ZÄÖÜ]/.test(seg);
          silben.push({ von: pos, bis: pos + seg.length, st: betont ? 2 : 0, platz: true });
          eingabe.push({ mehrsilbig: true, stufe: betont ? 2 : 0, klasse: null });
          pos += seg.length + 1;
        }
        continue;
      }
      const n = x.stufen.length, mehr = n > 1;
      if (!n) continue;   // russische Präpositionen ohne Vokal (в, к, с) sind keine Silbe
      let pos = x.von;
      x.silbeAb = silben.length;
      schreibSilbenTeilen(x.w, n, sprache).forEach((teil, i) => {
        silben.push({ von: pos, bis: pos + teil.length, st: x.stufen[i] ?? 0 });
        pos += teil.length;
        // weich: Kandidat eines russischen Homographen – wird am Zeilenende nicht zur Pflicht-Hebung (kern/metrik.mjs)
        eingabe.push({ mehrsilbig: mehr, stufe: x.stufen[i] ?? 0, klasse: mehr ? null : (x.einsilberKlasse || 'c'), p: x.vers ? x.vers[i] : null, ...(x.varianten ? { weich: true } : {}) });
      });
    }
    // Vollvokal am Zeilenende (Bräuti|gam) darf die Hebung tragen: weicher Nebenton
    const letzt = woerter[woerter.length - 1];
    if (!ru && letzt && letzt.stufen.length > 1 && letzt.stufen[letzt.stufen.length - 1] === 0 && (sprache === 'en' ? letzteSilbeVollEn : letzteSilbeVoll)(letzt.w))
      eingabe[eingabe.length - 1] = { ...eingabe[eingabe.length - 1], stufe: 1, weich: true };
    const { muster, fassung } = hebungen(eingabe, sprache);
    silben.forEach((s, i) => { s.m = muster[i]; });
    // Russische Homographen (за́мок/замо́к, ру́ки/руки́): das Versmaß hat gewählt – die Betonung, die auf der Hebung steht, gilt
    // (sonst die häufigere); Anzeige und Reim folgen der Wahl
    if (ru) for (const x of woerter) if (x.varianten && x.silbeAb != null) {
      const auf = x.varianten.find(v => muster[x.silbeAb + v.haupt] === 'S') || x.varianten[0];
      x.wahl = auf.haupt;
      x.stufen.forEach((_, i) => { silben[x.silbeAb + i].st = i === auf.haupt ? 2 : 0; });
    }
    const letzteStelle = teile[teile.length - 1];
    const letztes = letzteStelle && letzteStelle.x ? letzteStelle.x : null;   // endet die Zeile mit einem Platzhalter, reimt sie (noch) nicht
    return {
      typ: 'zeile', sprache, silben, fassung, ...(platz.length ? { platzhalter: platz.length } : {}),
      n: silben.length, h: muster.filter(m => m === 'S').length,
      k: muster.length ? (muster[muster.length - 1] === 'S' ? 'm' : 'w') : '',
      letztesWort: letztes ? letztes.w : null, letztesVon: letztes ? letztes.von : null, ...(letztes && letztes.wahl != null ? { letzteBetonung: letztes.wahl } : {}),
      _woerter: woerter.map(x => ({ w: x.w, von: x.von, bis: x.von + x.w.length, inhalt: x.stufen.length > 1 || (x.einsilberKlasse || 'c') !== 'u' })),
      ...(ru && letztes && letztes.varianten && letztes.silbeAb != null ? { _ende: { varianten: letztes.varianten, ab: letztes.silbeAb, eingabe } } : {}),
    };
  });
  const enden = zeilen.map(z => {
    if (z.typ === 'abschnitt') return BAUTEIL.test(z.name) ? '§' : null;
    if (z.typ !== 'zeile' || !z.letztesWort) return null;
    const imWort = z.silben.filter(s => s.von >= z.letztesVon);
    const hebung = imWort.map(s => s.m).lastIndexOf('S'), akzent = imWort.map(s => s.st).lastIndexOf(2);
    if (z.sprache === 'ru') return { w: z.letztesWort, sprache: 'ru', ab: z.letzteBetonung ?? null };
    return { w: z.letztesWort, sprache: z.sprache, ab: hebung > akzent && akzent >= 0 ? hebung : null };
  });
  homographReim(zeilen, enden);
  const { buchst, art, asso } = reimschema(enden);
  zeilen.forEach((z, i) => {
    if (z.typ !== 'zeile' || (!buchst[i] && !asso[i])) return;
    if (buchst[i]) { z.reim = buchst[i]; z.reimArt = art[i]; } else z.assonanz = asso[i];
    // Englisch: Laute aus Muret, nicht nachgelesen → Reim nur vermutet (Jörg, 12.11.2026, „B a“; die Oberfläche zeigt ihn grau)
    if (z.sprache === 'en' && z.letztesWort && lautVermutetEn(z.letztesWort)) z.reimVermutet = true;
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
  wiederholteReime(zeilen, text.split('\n'), abschnittVon);
  binnenreime(zeilen);
  formen(zeilen, text.split('\n'));   // Vers- und Strophenformen (kern/formen.mjs)
  zeilen.forEach(z => { delete z._woerter; delete z._ende; });
  return zeilen;
}

// Russische Homographen am Zeilenende (следа́ / сле́да, ру́ки / руки́): Dichter reimen – reimt eine Lesart rein auf ein
// Zeilenende in der Nähe (≤ 4 Zeilen, selber Abschnitt), die gewählte aber nicht, gilt diese Lesart; das Versmaß der Zeile
// wird mit ihr neu gerechnet.
function homographReim(zeilen, enden) {
  const abschnitt = []; let nr = 0; enden.forEach((e, i) => { if (e === '§') nr++; abschnitt[i] = nr; });
  const lesarten = i => { const z = zeilen[i]; if (!z || z.typ !== 'zeile' || z.sprache !== 'ru' || !z.letztesWort) return [];
    return z._ende ? z._ende.varianten.map(v => v.haupt) : [z.letzteBetonung ?? null]; };
  const gut = st => st === 'rein' || st === 'fast rein' || st === 'rührend';
  zeilen.forEach((z, i) => {
    if (!z._ende) return;
    const reimt = h => { const a = reimteilWortRu(z.letztesWort, h);
      for (let j = Math.max(0, i - 4); j <= Math.min(zeilen.length - 1, i + 4); j++) {
        if (j === i || abschnitt[j] !== abschnitt[i]) continue;
        for (const hj of lesarten(j)) if (gut(reimStufeRu(a, reimteilWortRu(zeilen[j].letztesWort, hj)))) return true;
      }
      return false; };
    if (reimt(z.letzteBetonung)) return;
    const neu = z._ende.varianten.find(v => v.haupt !== z.letzteBetonung && reimt(v.haupt)); if (!neu) return;
    const { ab, eingabe } = z._ende, ein = eingabe.slice();
    z._ende.varianten.forEach(v => { ein[ab + v.haupt] = { ...ein[ab + v.haupt], stufe: 0, weich: false }; });
    ein[ab + neu.haupt] = { ...ein[ab + neu.haupt], stufe: 2, weich: false };
    const { muster, fassung } = hebungen(ein, 'ru');
    z.silben.forEach((s, k) => { s.m = muster[k]; });
    z._ende.varianten.forEach(v => { z.silben[ab + v.haupt].st = v.haupt === neu.haupt ? 2 : 0; });
    z.letzteBetonung = neu.haupt; z.fassung = fassung; z.h = muster.filter(m => m === 'S').length;
    z.k = muster[muster.length - 1] === 'S' ? 'm' : 'w';
    enden[i] = { ...enden[i], ab: neu.haupt };
  });
}

// Wiederholte Reime im Werk – nur zum Aufmerksammachen, keine Wertung (Jörg, 10.11.2026): dasselbe Reimpaar, dasselbe
// Reimwort oder derselbe Reimklang in einem anderen Abschnitt. Innerhalb eines Abschnitts zählt nichts (das ist das
// Reimschema). Refrains wiederholen sich gewollt: eine Zeile, die wortgleich in mehreren Abschnitten steht, zählt nicht
// (refrain: true). Je Endreimzeile: reimKlang (Reimteil ohne Länge) und wiederholt: [{ zeile, art: paar|wort|klang }].
function wiederholteReime(zeilen, roh, abschnittVon) {
  const norm = i => (roh[i] || '').toLowerCase().replace(/[^a-zäöüßа-яё]+/g, ' ').trim();
  const wo = new Map();
  zeilen.forEach((z, i) => { if (z.typ === 'zeile') { const k = norm(i); (wo.get(k) || wo.set(k, new Set()).get(k)).add(abschnittVon[i]); } });
  const R = [];
  zeilen.forEach((z, i) => { if (z.typ === 'zeile' && wo.get(norm(i)).size > 1) z.refrain = true; });
  zeilen.forEach((z, i) => {
    if (z.typ !== 'zeile' || !z.letztesWort) return;
    const rp = reimteilWort(z.letztesWort, z.sprache, z.letzteBetonung ?? null);
    if (rp && rp.voll) z.reimKlang = rp.voll.replace(/ː/g, '');
    if (z.refrain || !z.reim) return;
    R.push({ i, ab: abschnittVon[i], wort: z.letztesWort.toLowerCase(), partner: (z.partnerWort || '').toLowerCase(), klang: z.reimKlang || null });
  });
  for (const a of R) {
    const mit = [];
    for (const b of R) {
      if (b.ab === a.ab) continue;
      const paar = a.partner && b.partner && ((a.wort === b.wort && a.partner === b.partner) || (a.wort === b.partner && a.partner === b.wort));
      const art = paar ? 'paar' : a.wort === b.wort ? 'wort' : a.klang && a.klang === b.klang ? 'klang' : null;
      if (art) mit.push({ zeile: b.i, art });
    }
    if (mit.length) zeilen[a.i].wiederholt = mit;
  }
}

// Binnenreime: betonte Inhaltswörter, die rein (oder in der betonten Silbe) auf ein Wort derselben oder der
// Nachbarzeile reimen (im selben Abschnitt); beide Seiten werden markiert. Reimt das Partnerwort am Zeilenende, gilt dessen Buchstabe;
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
      // bei bloßem Silbenreim nur die betonte Silbe bis vor den nächsten Vokal markieren (Bräut|igam, Wass|er)
      const silbeBis = rs.von + ((x.w.slice(rs.von - x.von).match(z.sprache === 'ru' ? /^[^аеёиоуыэюя]*[аеёиоуыэюя][\u0300\u0301]?[^аеёиоуыэюя]*/i : /^[^aeiouäöüy]*[aeiouäöüy]+[^aeiouäöüy]*/i) || [''])[0].length || (rs.bis - rs.von));
      if (rp) posten.push({ i, abschnitt, sprache: z.sprache, w: x.w.toLowerCase(), ende, inhalt: x.inhalt, von: rs.von, bis: x.bis, silbeBis, markBis: 0, voll: rp.voll,
        silbe: z.sprache === 'en' ? silbeEn(rp) : z.sprache === 'ru' ? rp.silbe : rp.voll.replace(/^([^aɑɐeɛəiɪoɔuʊyʏøœ]*[aɑɐeɛəiɪoɔuʊyʏøœ][ːˑ\u0300-\u036F]*(?:[aɑɐeɛəiɪoɔuʊyʏøœ]\u032F)?[^aɑɐeɛəiɪoɔuʊyʏøœ]*).*$/, '$1'),
        r: ende ? z.reim : null, z });
    });
  });
  const naechster = {};   // je Abschnitt: höchster schon vergebener Buchstabe
  let ab = 0; zeilen.forEach(z => { if (z.typ === 'abschnitt' && BAUTEIL.test(z.name)) ab++; if (z.reim) naechster[ab] = Math.max(naechster[ab] || 0, z.reim.charCodeAt(0) - 64); });
  // Zeilenenden mit Endreim sind schon gefärbt; Enden ohne Endreim können Binnenreim-Partner sein –
  // auch untereinander (naß / Wass|er: reimen nur in der betonten Silbe)
  const frei = p => !p.ende || !p.z.reim;
  for (const x of posten) {
    if (!frei(x)) continue;
    for (const y of posten) {
      if (y === x || !y.inhalt || y.sprache !== x.sprache || y.abschnitt !== x.abschnitt || Math.abs(y.i - x.i) > 1 || y.w === x.w || (y.voll !== x.voll && y.silbe !== x.silbe)) continue;
      if (x.ende && y.ende && y.voll === x.voll) continue;   // ganzer Reim zweier Enden ist Sache des Endreims
      if (!x.r) x.r = y.r || (naechster[x.abschnitt] = (naechster[x.abschnitt] || 0) + 1, String.fromCharCode(64 + naechster[x.abschnitt]));
      if (!y.r) y.r = x.r;
      const bis = p => (y.voll === x.voll ? p.bis : p.silbeBis);
      x.markBis = Math.max(x.markBis, bis(x)); y.markBis = Math.max(y.markBis, bis(y));
    }
  }
  for (const x of posten) if (frei(x) && x.r && x.markBis) (x.z.binnen = x.z.binnen || []).push({ von: x.von, bis: x.markBis, r: x.r });
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
