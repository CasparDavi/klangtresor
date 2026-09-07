#!/usr/bin/env node
/**
 * Bereinigte Lyrik — der gesungene Text, und nur der.
 *
 *   node bin/lyrik.js                 Bericht, schreibt nichts
 *   node bin/lyrik.js --tun           schreibt library/lyrik.json
 *   node bin/lyrik.js <id>            nur dieses Lied, ausführlich
 *   node bin/lyrik.js --unsicher      listet die Lieder, die durchfallen
 *
 * WARUM ES DAS GIBT (Caspar_D, 07.09.2026): „lyricsWorte sind uns schon
 * mehrmals auf die Füsse gefallen, wir brauchen einen Whisper-basierten
 * Lyricscleaner, der alles, was nicht Lyrics ist löscht und sicherstellt
 * dass die Wortzahlen stimmen."
 *
 * Das Feld `lyrics` im Katalog ist Caspar_Ds Einreichung an Suno. Darin
 * steht mehr als der Gesang: Regieanweisungen in eckigen Klammern,
 * Vorreden, Widmungen an andere Künstler, Playlist-Hinweise, und bei
 * vielen Liedern die vollständige zweite Sprachfassung. Jede Zählung auf
 * diesem Feld zählt das mit. `lyricsWorte` in bin/katalog.js versucht das
 * über Trennlinien abzufangen und bricht deshalb bei „Ulrich & Ännchen"
 * nach 25 von 292 Wörtern ab — dort trennen die Striche Strophen, nicht
 * Sprachfassungen.
 *
 * NICHTS VON SUNO WIRD VERÄNDERT (Caspar_D, 07.09.2026: „ein zweites
 * Fenster auf jeden Fall, nichts, was von suno kommt sollte verändert
 * werden"). `lyrics` und `worte` im Katalog bleiben, wie sie sind. Das
 * Ergebnis steht in einer eigenen Datei, wie klang.json und toene.json
 * auch.
 *
 * DIE QUELLE IST WHISPER, NICHT DER KATALOG. Das Feld `worte` im Katalog
 * stammt bei fast allen Liedern von Suno und ist aus dem eingereichten
 * Text abgeleitet — ein Abgleich damit vergleicht den Text mit sich
 * selbst (gemessen: 100 % Deckung bei identischer Wortzahl). Whisper hat
 * den Ton gehört; seine Marken liegen in library/whisper.ndjson.
 *
 * DAS VERFAHREN
 *   1. Regieanweisungen ([...] / (...) allein auf einer Zeile) fliegen
 *      ohne Alignment. Sie sind Anweisung, nicht Text.
 *   2. Globales Alignment (Needleman-Wunsch) zwischen dem Wortstrom des
 *      Liedtexts und dem, was Whisper gehört hat.
 *   3. Zwei Zusätze, ohne die echte Zeilen verlorengehen — beide gemessen
 *      am Bestand, nicht geraten:
 *      - Wörter gelten als gleich bei einem Buchstaben Abstand. Whisper
 *        schreibt „finsterem", Caspar_D schreibt „finst'rem".
 *      - Eine ungedeckte Zeile ZWISCHEN gedeckten Zeilen bleibt stehen.
 *        Whisper überhört einzelne Zeilen; dass die Nachbarn sitzen, ist
 *        der Beleg, daß mitgesungen wurde. Über den Bestand rettet das
 *        1466 Wörter. Höchstens zwei Zeilen am Stück — eine ganze Strophe
 *        in einer anderen Sprache soll nicht durchrutschen.
 *   4. Zeitanker je Zeile aus denselben Whisper-Marken. Gerettete Zeilen
 *      haben keine eigenen und tragen deshalb `geschaetzt`.
 *
 * WO ES AUFHÖRT. Unter DECKUNG_MINDEST wird nicht gereinigt, sondern
 * gemeldet. Bei „Ik will …" (Plattdeutsch) versteht Whisper so wenig, daß
 * echte Zeilen durchfielen — dort darf die Software nicht entscheiden.
 * Dasselbe gilt, wenn Whisper gar nichts hat.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const K    = require('./katalog.js');

const WURZEL   = path.join(__dirname, '..');
const WHISPER  = path.join(WURZEL, 'library', 'whisper.ndjson');
const ZIEL     = path.join(WURZEL, 'library', 'lyrik.json');
const FASSUNG  = 1;

/* Unter dieser Deckung wird nicht gereinigt, sondern gemeldet. 0,60 ist
   nicht geraten: Bei dieser Grenze fallen 14 von 254 Liedern durch, und
   das sind genau die, bei denen Whisper an der Sprache scheitert
   (Plattdeutsch, Japanisch) oder der Text zu mehr als der Hälfte aus
   einer zweiten Fassung besteht. Bei 0,80 wären es 71 — darunter viele,
   die sauber gereinigt werden. */
const DECKUNG_MINDEST = 0.60;

/* Wieviele ungedeckte Zeilen am Stück die Nachbarschaft noch überbrücken
   darf. Drei und mehr sind im Bestand fast immer ein eigener Block. */
const LUECKE_MAX = 2;

/* ---- Wortvergleich ---------------------------------------------------
   CJK-Zeichen zählen einzeln als Wort: Japanisch kennt keine Leerzeichen,
   und Whisper setzt sie anders als der Liedtext. Zeichenweise alignieren
   umgeht die Frage der Wortgrenzen ganz. */
function woerter(text) {
  const aus = [];
  let puffer = '';
  for (const z of String(text).toLowerCase()) {
    const code = z.codePointAt(0);
    const cjk = (code >= 0x3040 && code <= 0x30ff) || (code >= 0x4e00 && code <= 0x9fff);
    if (cjk) { if (puffer) { aus.push(puffer); puffer = ''; } aus.push(z); continue; }
    if (/[a-zäöüß0-9]/.test(z)) puffer += z;
    else if (/['’`´]/.test(z)) continue;          // Elision: finst'rem
    else if (puffer) { aus.push(puffer); puffer = ''; }
  }
  if (puffer) aus.push(puffer);
  return aus;
}

/* Fast gleich: identisch, ein Buchstabe Abstand bei Wörtern ab vier
   Zeichen, oder ein gemeinsamer Anfang von fünf Zeichen. */
function fastGleich(a, b) {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;
  if (Math.abs(a.length - b.length) > 1) {
    let k = 0;
    while (k < a.length && k < b.length && a[k] === b[k]) k++;
    return k >= 5;
  }
  let i = 0, j = 0, fehler = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++fehler > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return fehler + (a.length - i) + (b.length - j) <= 1;
}

/* ---- Alignment -------------------------------------------------------
   Needleman-Wunsch, zwei Zeilen im Speicher, der Weg als Bitfeld. Für
   1200 gegen 1400 Wörter sind das 1,7 MB und Millisekunden.
   Rückgabe je Textwort: der Index des Whisper-Wortes, auf das es fällt,
   oder -1. Der Index trägt später die Zeitmarke. */
function alignieren(a, b) {
  const n = a.length, m = b.length;
  const paar = new Int32Array(n).fill(-1);
  if (!n || !m) return paar;
  const TREFFER = 2, FEHL = -1, LUECKE = -1;
  const weg = new Uint8Array((n + 1) * (m + 1));
  let vor = new Int32Array(m + 1), jetzt = new Int32Array(m + 1);
  for (let j = 0; j <= m; j++) { vor[j] = j * LUECKE; weg[j] = 2; }
  for (let i = 1; i <= n; i++) {
    jetzt[0] = i * LUECKE; weg[i * (m + 1)] = 1;
    for (let j = 1; j <= m; j++) {
      const diag = vor[j - 1] + (fastGleich(a[i - 1], b[j - 1]) ? TREFFER : FEHL);
      const hoch = vor[j] + LUECKE;
      const link = jetzt[j - 1] + LUECKE;
      let best = diag, r = 0;
      if (hoch > best) { best = hoch; r = 1; }
      if (link > best) { best = link; r = 2; }
      jetzt[j] = best; weg[i * (m + 1) + j] = r;
    }
    const t = vor; vor = jetzt; jetzt = t;
  }
  let i = n, j = m;
  while (i > 0 && j > 0) {
    const r = weg[i * (m + 1) + j];
    if (r === 0) { if (fastGleich(a[i - 1], b[j - 1])) paar[i - 1] = j - 1; i--; j--; }
    else if (r === 1) i--;
    else j--;
  }
  return paar;
}

const istRegie = (z) => /^\s*[[(][^\]\)]*[\])]?\s*$/.test(z.trim()) && /^[\s[(]/.test(z.trim());

/* ---- Ein Lied reinigen ----------------------------------------------- */
function reinigen(lyrics, marken) {
  const zeilen = String(lyrics || '').split('\n');
  const bTexte = marken.map(w => String(w[2]));
  const bW = [], bZuMarke = [];
  bTexte.forEach((t, mi) => { for (const w of woerter(t)) { bW.push(w); bZuMarke.push(mi); } });
  if (bW.length < 20) return { grund: 'Whisper hat zu wenig gehört', deckung: 0 };

  const aW = [], aZuZeile = [];
  zeilen.forEach((z, zi) => {
    if (istRegie(z)) return;
    for (const w of woerter(z)) { aW.push(w); aZuZeile.push(zi); }
  });
  if (aW.length < 10) return { grund: 'zu wenig Text', deckung: 0 };

  /* ZWEI SCHRIFTEN, KEIN ALIGNMENT (gefunden 07.09.2026). Bei den
     japanischen Liedern steht der Text in japanischer Schrift, Whisper
     aber schreibt lateinische Umschrift und übersetzt streckenweise ins
     Englische: „本物が見える" gegen „HONMONO NO MAMORI HITOYO / I can see
     the real thing". Zeichenweise alignieren hilft da nicht — es sind
     verschiedene Alphabete. Das ist kein Fehler des Verfahrens, und es
     soll auch nicht als „0 % gedeckt" durchgehen, was nach schlechtem
     Gesang klänge. Eine Umschrift wäre der Weg, wenn es je nötig wird. */
  const cjkAnteil = (liste) => {
    if (!liste.length) return 0;
    let n = 0;
    for (const w of liste) if (/[぀-ヿ一-鿿]/.test(w)) n++;
    return n / liste.length;
  };
  const cjkText = cjkAnteil(aW), cjkGehoert = cjkAnteil(bW);
  if (cjkText > 0.3 && cjkGehoert < 0.05)
    return { grund: 'Text in japanischer Schrift, Whisper in Umschrift', deckung: 0, schriftbruch: true };

  const paar = alignieren(aW, bW);

  /* Je Zeile: wieviele Wörter, wieviele gedeckt, und die Whisper-Marken,
     auf die sie fallen. */
  const proZeile = new Map();
  paar.forEach((p, k) => {
    const zi = aZuZeile[k];
    if (!proZeile.has(zi)) proZeile.set(zi, { n: 0, gut: 0, marken: [] });
    const e = proZeile.get(zi);
    e.n++;
    if (p >= 0) { e.gut++; e.marken.push(bZuMarke[p]); }
  });

  const zustand = zeilen.map((z, i) => {
    if (istRegie(z)) return 'regie';
    const e = proZeile.get(i);
    if (!e) return 'leer';
    return e.gut / e.n >= 0.5 ? 'gesungen' : 'offen';
  });

  /* Offene Zeilen zwischen gesungenen retten — höchstens LUECKE_MAX am
     Stück, und nur, wenn auf beiden Seiten wirklich gesungen wird. */
  for (let i = 0; i < zustand.length; i++) {
    if (zustand[i] !== 'offen') continue;
    let j = i;
    while (j < zustand.length && (zustand[j] === 'offen' || zustand[j] === 'leer' || zustand[j] === 'regie')) j++;
    const offen = [];
    for (let k = i; k < j; k++) if (zustand[k] === 'offen') offen.push(k);
    const davor = zustand.slice(0, i).filter(x => x === 'gesungen' || x === 'offen').pop();
    const danach = zustand.slice(j).find(x => x === 'gesungen' || x === 'offen');
    if (offen.length <= LUECKE_MAX && davor === 'gesungen' && danach === 'gesungen')
      for (const k of offen) zustand[k] = 'gerettet';
    i = j - 1;
  }

  /* Zeilen bauen. Zeitmarken aus den Whisper-Marken der Zeile; gerettete
     Zeilen bekommen die Lücke zwischen ihren Nachbarn und tragen das
     ausdrücklich als `geschaetzt`. */
  const behalten = [];
  zeilen.forEach((z, i) => {
    if (zustand[i] !== 'gesungen' && zustand[i] !== 'gerettet') return;
    const e = proZeile.get(i);
    const text = z.trim();
    if (!text) return;
    if (e && e.marken.length) {
      const mi = e.marken;
      const von = Math.min(...mi.map(x => marken[x][0]));
      const bis = Math.max(...mi.map(x => marken[x][1]));
      behalten.push({ von: +von.toFixed(2), bis: +bis.toFixed(2), text });
    } else {
      behalten.push({ von: null, bis: null, text, geschaetzt: true });
    }
  });

  /* Die geschätzten Zeilen in die Lücke ihrer Nachbarn legen. Ohne
     Nachbarn bleiben sie ohne Marke — eine erfundene Zeit wäre schlimmer
     als keine. */
  for (let i = 0; i < behalten.length; i++) {
    if (behalten[i].von !== null) continue;
    let a = i - 1; while (a >= 0 && behalten[a].bis === null) a--;
    let b = i + 1; while (b < behalten.length && behalten[b].von === null) b++;
    if (a < 0 || b >= behalten.length) continue;
    const spanne = behalten[b].von - behalten[a].bis;
    const anzahl = b - a - 1;
    if (!(spanne > 0) || anzahl < 1) continue;
    const teil = spanne / anzahl, k = i - a - 1;
    behalten[i].von = +(behalten[a].bis + k * teil).toFixed(2);
    behalten[i].bis = +(behalten[a].bis + (k + 1) * teil).toFixed(2);
  }

  const worteGesamt = aW.length;
  const worteBehalten = zeilen.reduce((a, z, i) =>
    a + ((zustand[i] === 'gesungen' || zustand[i] === 'gerettet') && proZeile.has(i) ? proZeile.get(i).n : 0), 0);
  const gestrichen = zeilen
    .map((z, i) => (zustand[i] === 'offen' ? z.trim() : null))
    .filter(Boolean);
  const regieZeilen = zustand.filter(x => x === 'regie').length;

  return {
    deckung: worteGesamt ? worteBehalten / worteGesamt : 0,
    zeilen: behalten,
    worte: worteBehalten,
    worteRoh: worteGesamt,
    gestrichen,
    regieZeilen,
    gerettet: zustand.filter(x => x === 'gerettet').length,
    geschaetzt: behalten.filter(z => z.geschaetzt).length,
  };
}

/* ---- Lauf ------------------------------------------------------------ */
function whisperLesen() {
  const m = new Map();
  if (!fs.existsSync(WHISPER)) return m;
  for (const z of fs.readFileSync(WHISPER, 'utf8').trim().split('\n')) {
    if (!z.trim()) continue;
    try { const e = JSON.parse(z); if (e.worte && e.worte.length) m.set(e.id, e.worte); }
    catch (err) { /* eine kaputte Zeile darf den Lauf nicht kippen */ }
  }
  return m;
}

function main() {
  const args = process.argv.slice(2);
  const tun = args.includes('--tun');
  const nurUnsicher = args.includes('--unsicher');
  const einer = args.find(a => /^[0-9a-f-]{30,}$/i.test(a)) || null;

  const kat = K.lesen();
  if (!kat) { console.log('  Kein Katalog.'); process.exit(1); }
  const whisper = whisperLesen();
  if (!whisper.size) { console.log('  Keine Whisper-Marken — library/whisper.ndjson fehlt.'); process.exit(1); }

  const lieder = {};
  const unsicher = [];
  let gerechnet = 0, wortSumme = 0, rohSumme = 0;

  for (const s of Object.values(kat.songs)) {
    if (einer && s.id !== einer) continue;
    if (!s.lyrics || !s.lyrics.trim()) continue;
    const marken = whisper.get(s.id);
    if (!marken) { unsicher.push({ id: s.id, titel: s.titel, grund: 'kein Whisper-Lauf' }); continue; }

    const e = reinigen(s.lyrics, marken);
    gerechnet++;
    if (!e.zeilen || e.deckung < DECKUNG_MINDEST) {
      unsicher.push({ id: s.id, titel: s.titel,
        grund: e.grund || `nur ${(100 * e.deckung).toFixed(0)} % gedeckt`,
        deckung: +e.deckung.toFixed(3) });
      continue;
    }
    wortSumme += e.worte; rohSumme += e.worteRoh;
    lieder[s.id] = {
      deckung: +e.deckung.toFixed(3),
      worte: e.worte,
      zeilen: e.zeilen,
      gestrichen: e.gestrichen.length,
      geschaetzt: e.geschaetzt,
    };

    if (einer) {
      console.log(`\n  ${s.titel}`);
      console.log(`  Deckung ${(100 * e.deckung).toFixed(0)} % · ${e.worte} von ${e.worteRoh} Wörtern · `
        + `${e.regieZeilen} Regiezeilen · ${e.gerettet} Zeilen durch Nachbarschaft gerettet · `
        + `${e.geschaetzt} Zeitmarken geschätzt`);
      console.log('\n  --- bereinigt ---');
      for (const z of e.zeilen)
        console.log(`  ${z.von === null ? '   ?  ' : String(z.von).padStart(6)}  ${z.text}${z.geschaetzt ? '   (Zeit geschätzt)' : ''}`);
      if (e.gestrichen.length) {
        console.log('\n  --- gestrichen ---');
        for (const g of e.gestrichen) console.log(`  ${g.slice(0, 90)}`);
      }
      return;
    }
  }

  if (nurUnsicher) {
    console.log(`\n  ${unsicher.length} Lied(er) werden nicht gereinigt:\n`);
    for (const u of unsicher.sort((a, b) => (a.deckung || 0) - (b.deckung || 0)))
      console.log(`  ${String(u.deckung != null ? (100 * u.deckung).toFixed(0) + ' %' : '—').padStart(5)}  ${(u.titel || u.id).slice(0, 52)}   ${u.grund}`);
    return;
  }

  const anzahl = Object.keys(lieder).length;
  console.log(`\n  Bereinigte Lyrik · Fassung ${FASSUNG}`);
  console.log(`  ${gerechnet} Lieder mit Text und Whisper gerechnet.`);
  console.log(`  ${anzahl} gereinigt, ${unsicher.length} zurückgestellt (unter ${(100 * DECKUNG_MINDEST).toFixed(0)} % Deckung).`);
  if (rohSumme) console.log(`  ${rohSumme - wortSumme} von ${rohSumme} Wörtern gestrichen `
    + `(${(100 * (rohSumme - wortSumme) / rohSumme).toFixed(0)} %) — Vorreden, Widmungen, zweite Sprachfassungen.`);

  if (!tun) { console.log(`\n  Nichts geschrieben. Mit --tun schreibt es nach library/lyrik.json.`); return; }

  const aus = {
    stand: new Date().toISOString(),
    fassung: FASSUNG,
    verfahren: 'Liedtext gegen die Whisper-Marken aligniert (Needleman-Wunsch, ein Buchstabe '
      + 'Abstand erlaubt); Regieanweisungen ohne Alignment gestrichen; ungedeckte Zeilen zwischen '
      + `gedeckten bleiben (höchstens ${LUECKE_MAX} am Stück). Zeitanker aus denselben Whisper-Marken; `
      + 'Zeilen ohne eigene Marke tragen geschaetzt und liegen interpoliert zwischen ihren Nachbarn. '
      + `Unter ${(100 * DECKUNG_MINDEST).toFixed(0)} % Deckung wird nicht gereinigt.`,
    quelle: 'library/whisper.ndjson',
    mindestDeckung: DECKUNG_MINDEST,
    unsicher,
    lieder,
  };
  fs.writeFileSync(ZIEL, JSON.stringify(aus));
  const kb = (fs.statSync(ZIEL).size / 1024).toFixed(0);
  console.log(`\n  Geschrieben: library/lyrik.json (${kb} KB).`);
}

if (require.main === module) main();
module.exports = { reinigen, woerter, fastGleich, alignieren };
