#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   DIE LIED-FAMILIEN
   bin/fassungen.js  ·  läuft NACH bin/karte.js und bin/geschichten.js

   Welche Lieder sind dasselbe Lied in anderer Fassung? Übersetzung,
   Neuaufnahme, v2, ClubMix. Der Katalog weiß es nicht: Sunos
   Herkunftsfelder sind für diesen Bestand tot (35 upsample_clip_id,
   davon null im Archiv auflösbar; 98 concat_history, null auflösbar).

   KEINE SCHWELLE, KEINE PFLEGE. Caspar_D, 07.09.2026: „ich will
   eigentlich nicht den Klassifikator spielen, das System soll das
   können." Also kein Regler, keine Zahl, die jemand einstellt, und
   keine Liste zum Abhaken.

   Das Kriterium ist die GEGENSEITIGE NACHBARSCHAFT in drei Räumen,
   die alle schon gerechnet dastehen:

     Text      library/geschichten.json   Bedeutung des gesungenen
                                          Textes, sprachübergreifend
                                          (768 Dim., Kondensat)
     Klang     library/karte.json         Klangfarbe und Machart
                                          (1280 Dim., sqrt(1-cos))
     Harmonie  library/analyse/<id>.bin   Akkordfolge (Chroma)

   Zwei Lieder gehören zusammen, wenn JEDES das andere unter seinen
   zwei ähnlichsten Partnern führt UND mindestens ZWEI der drei Räume
   das unabhängig sagen. Aus den Kanten werden Familien
   (Zusammenhangskomponenten).

   WARUM ZWEI PARTNER UND NICHT EINER. Am 06.09.2026 kam „Glut und Eis
   - Die Braut von Corinth" dazu und ergänzte die deutsche und die
   englische Fassung von 2025. Mit nur dem BESTEN Partner fällt es
   durch: die beiden alten sind sich gegenseitig die nächsten
   (Harmonie 0,847), der Dritte bleibt draußen. Zwei Partner sind also
   keine Feineinstellung, sondern die Aussage „eine Familie kann mehr
   als zwei Mitglieder haben". Bei einer VIERTEN Fassung desselben
   Liedes müsste die Zahl mitwachsen - dann steht sie hier und wird
   nicht zum Regler.

   WARUM DREI RÄUME. Dasselbe Beispiel: „Glut und Eis" wurde vom Text
   NICHT gefunden - gefunden haben es Klang (0,712) und Harmonie
   (0,702). Umgekehrt findet der Text die japanischen Paare, die
   klanglich nichts gemein haben. Ein Raum allein reicht für keine der
   beiden Sorten.

   Beim Textraum lag es in diesem Fall nicht am Lied: Caspar_D nennt
   „Glut und Eis" ein Cover der deutschen Fassung, inhaltlich nah, nur
   anders formuliert. Der niedrige Textwert (0,664) kommt daher, dass
   das Lied noch kein Kondensat hat und deshalb gegen eine andere
   Textsorte gemessen wurde - siehe den Block über textNachbarn(). Die
   Lehre bleibt trotzdem dieselbe: ein Raum kann ausfallen, ohne dass
   man es ihm ansieht, und dann tragen die beiden anderen.

   NUR LIEDER MIT TEXT. Die Instrumentals haben keinen
   Geschichten-Vektor, für sie blieben zwei Räume - und dann wäre
   „zwei einig" gleichbedeutend mit „beide einig". Vor allem aber
   würden die Naturklang-Stücke Familien bilden, die keine sind:
   „Waldesrauschen" und „Waldesrauschen" sind zwei Aufnahmen desselben
   Motivs, nicht zwei Fassungen eines Liedes. Genau daran ist die erste
   Messung am 07.09. gescheitert.

   NICHT IN DEN KLANGRAUM. Caspar_D: „das gehört aber nicht in den
   Klangraum - hier ist ja der Klang das, was die Clusterung bestimmt.
   Die Songversionen/-gruppen müssen separat auftreten." Der
   Doppelstern dort bleibt, was er ist: eine Klangaussage mit fester
   Schwelle 0,17. Diese Datei versorgt eine eigene Schaltfläche.

   Ergebnis: library/fassungen.json
     { stand, verfahren, kandidaten, familien: [ { lieder:[id],
       kanten:[{a,b,raeume,text,klang,harmonie}] } ] }

   Aufruf:
     node bin/fassungen.js            rechnet und schreibt
     node bin/fassungen.js --probe    rechnet und zeigt, schreibt NICHT
   ============================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const os = require('os');
const cp = require('child_process');

const WURZEL = path.join(__dirname, '..');
const LIB = path.join(WURZEL, 'library');
const ZIEL = path.join(LIB, 'fassungen.json');

/* Wie viele Partner je Lied zählen, und wie viele Räume zustimmen
   müssen. Beides steht hier und ist im Kopf begründet - es sind
   Aussagen über Lied-Familien, keine Stellschrauben. */
const PARTNER = 2;
const STIMMEN = 2;
/* Das Chroma-Fenster in halben Sekunden: 60 Rahmen = 30 s. Kurz genug,
   dass eine Neuaufnahme mit anderer Länge noch überlappt. */
const FENSTER = 60;
const RAHMEN_PRO_SCHRITT = 10;             // 0,5-s-Raster aus den Rohrahmen

const probe = process.argv.includes('--probe');

/* ---------------------------------------------------------------
   Laden
--------------------------------------------------------------- */
function jsonLesen(datei, gz) {
  if (!fs.existsSync(datei)) return null;
  const roh = fs.readFileSync(datei);
  try { return JSON.parse(gz ? zlib.gunzipSync(roh) : roh.toString('utf8')); }
  catch (e) { return null; }
}

const katalog = jsonLesen(path.join(LIB, 'katalog.json.gz'), true);
if (!katalog || !katalog.songs) {
  console.error('Kein Katalog — erst node bin/katalog.js');
  process.exit(1);
}
const songs = katalog.songs;
const titel = (id) => (songs[id] || {}).titel || id.slice(0, 8);

const geschichten = jsonLesen(path.join(LIB, 'geschichten.json'));
if (!geschichten || !geschichten.songs) {
  /* Kein Fehler, nur nichts zu tun: der Geschichten-Raum ist
     beiseitegelegt oder noch nie gerechnet worden. Die Oberfläche
     zeigt die Schaltfläche dann gar nicht erst an. */
  console.log('Kein Geschichten-Raum (library/geschichten.json) — nichts zu rechnen.');
  process.exit(0);
}
const karte = jsonLesen(path.join(LIB, 'karte.json'));

/* Der Kandidatenraum: Lieder mit Text, die auch im Katalog stehen. */
const ids = Object.keys(geschichten.songs).filter((id) => songs[id]);
const N = ids.length;
const platz = new Map(ids.map((id, i) => [id, i]));
console.log(`Lieder mit Text: ${N}  (von ${Object.keys(songs).length} im Katalog)`);
if (N < 4) { console.log('Zu wenige für Familien.'); process.exit(0); }

const paarSchluessel = (a, b) => (a < b ? a + '|' + b : b + '|' + a);

/* ---------------------------------------------------------------
   Raum 1: TEXT — Kosinus der Kondensat-Vektoren

   ZWEI TEXTSORTEN, DIE NICHT VERGLEICHBAR SIND. bin/geschichten.js
   bettet normalerweise die zehn kondensierten Substantive ein
   (quelle: 'kondensat'); wo noch kein Kondensat vorliegt, nimmt es den
   Volltext (quelle: 'volltext'). Ein frisches Lied ist also so lange
   Volltext, bis jemand das Kondensat erzeugt hat.

   Gemessen am 07.09.2026 über 259 Lieder (257 Kondensat, 2 Volltext):

     Kondensat × Kondensat   n=32.896   Median 0,514   p99 0,826   max 1,000
     gemischt                n=   514   Median 0,370   p99 0,637   max 0,703

   Ein Volltext-Lied kann die Werte der Kondensat-Paare nicht einmal
   erreichen - sein Maximum liegt unter deren p99. Schlimmer: die beiden
   Volltext-Lieder fanden EINANDER als stärksten Textpartner (0,738),
   nicht weil sie verwandt wären, sondern weil sie dieselbe Textsorte
   sind. Das verschiebt die Rangfolge und damit die Nachbarschaft.

   Caspar_D am 07.09.2026 zu genau diesem Fall: „der neue Text ist
   inhaltlich schon nah am alten, nur wörtlich eben nicht, die
   Textübereinstimmungslinie müsste da sein, aber weniger präsent."
   Sie war da - auf der gemischten Skala beim 98,8. Perzentil. Nur ihr
   Rohwert (0,664) sah aus wie Mittelmaß.

   DESHALB WERDEN NUR PAARE GLEICHER TEXTSORTE VERGLICHEN. Eine
   Messung, die nicht vergleichbar ist, zählt nicht - sie wird gemeldet.
   Für ein Lied, dessen Sorte im Bestand allein steht, entscheiden Klang
   und Harmonie, und weil zwei Stimmen nötig sind, müssen dann beide
   einig sein. Das ist streng und ehrlich.

   WICHTIG FÜR FREMDE BESTÄNDE: geprüft wird auf GLEICHHEIT der Sorte,
   nicht auf 'kondensat'. Ein Archiv, in dem gar keine Kondensate
   vorliegen, ist durchgehend Volltext - eine einheitliche Skala, auf
   der alles vergleichbar ist und der Textraum voll mitzählt. Genau so
   kommt jeder fremde Suno-Bestand hier an. Der Mischfall ist der
   Sonderfall, und er entsteht in einem gepflegten Archiv bei jedem
   neuen Lied.
--------------------------------------------------------------- */
const textSorte = (id) => (geschichten.songs[id] || {}).quelle || 'unbekannt';
const sorten = {};
for (const id of ids) (sorten[textSorte(id)] = sorten[textSorte(id)] || []).push(id);
if (Object.keys(sorten).length > 1) {
  /* Ein Mischbestand. Sagen, wie er aussieht, und wen es trifft: die
     kleinste Gruppe verliert ihre Textstimme fast ganz. */
  console.log('  Textsorten gemischt — nur Paare gleicher Sorte werden verglichen:');
  for (const [sorte, liste] of Object.entries(sorten).sort((a, b) => b[1].length - a[1].length))
    console.log(`    ${String(liste.length).padStart(4)} × ${sorte}`
              + (liste.length <= 5 ? `  (${liste.map(titel).join(', ')})` : ''));
}

function textNachbarn() {
  const V = ids.map((id) => {
    const e = geschichten.songs[id].emb;
    let s = 0; for (const x of e) s += x * x;
    s = Math.sqrt(s) || 1;
    return Float64Array.from(e, (x) => x / s);
  });
  const best = ids.map(() => []);
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
    /* Paare mit ungleicher oder fehlender Textsorte gar nicht erst
       einsortieren - siehe der Block über dieser Funktion. */
    if (textSorte(ids[i]) !== textSorte(ids[j])) continue;
    const a = V[i], b = V[j];
    let s = 0; for (let k = 0; k < a.length; k++) s += a[k] * b[k];
    einsortieren(best[i], j, s); einsortieren(best[j], i, s);
  }
  return best;
}

/* Nur die besten PARTNER je Lied behalten - eine volle Matrix wäre
   bei 259 Liedern zwar tragbar, bei 2000 nicht mehr. */
function einsortieren(liste, j, wert) {
  if (liste.length < PARTNER) { liste.push([j, wert]); liste.sort((x, y) => y[1] - x[1]); return; }
  if (wert <= liste[liste.length - 1][1]) return;
  liste[liste.length - 1] = [j, wert];
  liste.sort((x, y) => y[1] - x[1]);
}

/* ---------------------------------------------------------------
   Raum 2: KLANG — aus den Nachbarlisten, die bin/karte.js führt
--------------------------------------------------------------- */
function klangNachbarn() {
  const best = ids.map(() => []);
  if (!karte) return best;
  const liste = Array.isArray(karte.songs) ? karte.songs : Object.values(karte.songs || {});
  for (const p of liste) {
    const i = platz.get(p.id);
    if (i === undefined || !p.nachbarn) continue;
    for (const [id, abstand] of p.nachbarn) {
      const j = platz.get(id);
      if (j === undefined) continue;
      einsortieren(best[i], j, 1 - abstand);
    }
  }
  return best;
}

/* ---------------------------------------------------------------
   Raum 3: HARMONIE — Chroma aus den Analyse-Ablagen
--------------------------------------------------------------- */
/* DER DATENBLOCK BEGINNT BEIM NÄCHSTEN VIELFACHEN VON ACHT
   (web/fremd/analyse-ablage.js:204). Wer auf vier rundet, liest bei
   rund der Hälfte der Lieder ein um einen Halbton rotiertes Chroma -
   und die Zahlen sehen gültig aus. */
function chromaLesen(id) {
  const datei = path.join(LIB, 'analyse', id + '.bin');
  if (!fs.existsSync(datei)) return null;
  const b = fs.readFileSync(datei);
  const kopfLaenge = b.readUInt32LE(0);
  let kopf;
  try { kopf = JSON.parse(b.toString('utf8', 4, 4 + kopfLaenge)); } catch (e) { return null; }
  let von = 4 + kopfLaenge; von += (8 - (von % 8)) % 8;
  const letzte = (kopf.nachrichten || []).filter((m) => m.chroma && m.chroma.__r !== undefined).pop();
  if (!letzte) return null;
  const reihe = kopf.reihen[letzte.chroma.__r];
  const roh = new Float32Array(b.buffer.slice(b.byteOffset + von + reihe.von,
                                              b.byteOffset + von + reihe.von + reihe.laenge * 4));
  /* Auf 0,5-s-Schritte mitteln, dann je Schritt logarithmisch stauchen,
     über die zwölf Töne zentrieren und auf Länge eins bringen. Die
     Zentrierung nimmt die Lautstärke heraus - verglichen wird die FORM
     des Tonvorrats, nicht seine Höhe. */
  const schritte = Math.floor((reihe.laenge / 12) / RAHMEN_PRO_SCHRITT);
  const aus = new Float32Array(schritte * 12);
  for (let i = 0; i < schritte; i++) {
    const v = new Float64Array(12);
    for (let k = 0; k < RAHMEN_PRO_SCHRITT; k++)
      for (let t = 0; t < 12; t++) v[t] += roh[((i * RAHMEN_PRO_SCHRITT + k) * 12) + t];
    let mitte = 0;
    for (let t = 0; t < 12; t++) { v[t] = Math.log(1 + 10 * v[t] / RAHMEN_PRO_SCHRITT); mitte += v[t]; }
    mitte /= 12;
    let laenge = 0;
    for (let t = 0; t < 12; t++) { v[t] -= mitte; laenge += v[t] * v[t]; }
    laenge = Math.sqrt(laenge) || 1;
    for (let t = 0; t < 12; t++) aus[i * 12 + t] = v[t] / laenge;
  }
  return { a: aus, n: schritte };
}

/* Bestes gleitendes Fenster über alle Versätze, ohne Transposition:
   eine Fassung darf später einsetzen, aber nicht in einer anderen
   Tonart stehen - sonst fände das Maß jede Stilfamilie. */
function harmonieMass(A, B) {
  let bestes = -2;
  const nA = A.n, nB = B.n, a = A.a, b = B.a;
  for (let d = -(nB - FENSTER); d <= nA - FENSTER; d++) {
    const i0 = Math.max(0, d), i1 = Math.min(nA, nB + d), len = i1 - i0;
    if (len < FENSTER) continue;
    let summe = 0;
    const punkt = (t) => {
      const ia = (i0 + t) * 12, ib = (i0 + t - d) * 12;
      let p = 0; for (let k = 0; k < 12; k++) p += a[ia + k] * b[ib + k];
      return p;
    };
    for (let t = 0; t < FENSTER; t++) summe += punkt(t);
    if (summe / FENSTER > bestes) bestes = summe / FENSTER;
    for (let t = FENSTER; t < len; t++) {
      summe += punkt(t) - punkt(t - FENSTER);
      if (summe / FENSTER > bestes) bestes = summe / FENSTER;
    }
  }
  return bestes;
}

/* Der teure Teil, auf alle Kerne verteilt. Jeder Teillauf rechnet die
   Zeilen i, i+NW, i+2*NW ... und meldet nur die besten PARTNER je
   Zeile zurück - die volle Matrix muss nie durch eine Pipe. */
function harmonieNachbarn() {
  const M = new Array(N);
  let fehlen = 0;
  for (let i = 0; i < N; i++) {
    M[i] = chromaLesen(ids[i]);
    if (!M[i] || M[i].n < FENSTER) { M[i] = null; fehlen++; }
  }
  if (fehlen) console.log(`  ${fehlen} Lieder ohne brauchbares Chroma (zu kurz oder keine Ablage)`);

  const teil = process.argv.indexOf('--teil');
  if (teil >= 0) {
    const w = +process.argv[teil + 1], NW = +process.argv[teil + 2];
    const zeilen = [];
    for (let i = w; i < N; i += NW) {
      if (!M[i]) continue;
      const best = [];
      for (let j = 0; j < N; j++) {
        if (i === j || !M[j]) continue;
        einsortieren(best, j, harmonieMass(M[i], M[j]));
      }
      zeilen.push(i + '\t' + best.map(([j, v]) => j + ':' + v.toFixed(5)).join(' '));
    }
    process.stdout.write(zeilen.join('\n') + '\n');
    process.exit(0);
  }

  /* ECHT NEBENEINANDER, nicht nacheinander. Mit execFileSync in einer
     Schleife laufen die Teile seriell - beim ersten Lauf am 07.09.2026
     dauerte das 759 s, also so lange wie einkernig, obwohl zwoelf
     Prozesse gestartet wurden. Der Fehler faellt nicht auf, weil das
     Ergebnis stimmt; nur die Uhr verraet ihn. */
  const kerne = Math.max(1, Math.min(12, (os.cpus() || []).length - 1));
  console.log(`  Harmonie: ${N} Lieder auf ${kerne} Kernen …`);
  const best = ids.map(() => []);
  const t0 = Date.now();
  const laeufe = [];
  for (let w = 0; w < kerne; w++) laeufe.push(new Promise((fertig, schief) => {
    const kind = cp.execFile(process.execPath, [__filename, '--teil', String(w), String(kerne)],
      { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' },
      (fehler, aus) => fehler ? schief(fehler) : fertig(aus));
    kind.on('error', schief);
  }));
  return Promise.all(laeufe).then((ausgaben) => {
    for (const aus of ausgaben) for (const zeile of aus.split('\n')) {
      if (!zeile.trim()) continue;
      const [i, rest] = zeile.split('\t');
      if (!rest) continue;
      best[+i] = rest.split(' ').map((s) => { const [j, v] = s.split(':'); return [+j, +v]; });
    }
    console.log(`  Harmonie fertig nach ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    return best;
  });
}

/* ---------------------------------------------------------------
   Gegenseitige Nachbarschaft und Familien
--------------------------------------------------------------- */
function gegenseitig(best) {
  const kanten = new Map();
  const oben = best.map((l) => new Map(l.map(([j, v]) => [j, v])));
  for (let i = 0; i < N; i++) for (const [j, v] of oben[i])
    if (oben[j] && oben[j].has(i)) kanten.set(paarSchluessel(ids[i], ids[j]), v);
  return kanten;
}

/* Ab hier wird gewartet: der Harmonie-Teil laeuft in Unterprozessen. */
async function rechnen() {
console.log('Räume:');
const raeume = {};
process.stdout.write('  Text …');
raeume.text = gegenseitig(textNachbarn());
console.log(` ${raeume.text.size} gegenseitige Paare`);
process.stdout.write('  Klang …');
raeume.klang = gegenseitig(klangNachbarn());
console.log(` ${raeume.klang.size} gegenseitige Paare`);
raeume.harmonie = gegenseitig(await harmonieNachbarn());
console.log(`  Harmonie: ${raeume.harmonie.size} gegenseitige Paare`);

const alleKanten = new Set([...raeume.text.keys(), ...raeume.klang.keys(), ...raeume.harmonie.keys()]);
const kanten = [];
for (const k of alleKanten) {
  const dabei = ['text', 'klang', 'harmonie'].filter((r) => raeume[r].has(k));
  if (dabei.length < STIMMEN) continue;
  const [a, b] = k.split('|');
  kanten.push({
    a, b, raeume: dabei,
    text: raeume.text.has(k) ? +raeume.text.get(k).toFixed(3) : null,
    klang: raeume.klang.has(k) ? +raeume.klang.get(k).toFixed(3) : null,
    harmonie: raeume.harmonie.has(k) ? +raeume.harmonie.get(k).toFixed(3) : null,
  });
}
console.log(`\nKanten mit mindestens ${STIMMEN} Stimmen: ${kanten.length}`);

/* Zusammenhangskomponenten - Union-Find mit Pfadverkürzung. */
const eltern = new Map();
const wurzel = (x) => { while (eltern.get(x) !== x) { eltern.set(x, eltern.get(eltern.get(x))); x = eltern.get(x); } return x; };
for (const k of kanten) for (const x of [k.a, k.b]) if (!eltern.has(x)) eltern.set(x, x);
for (const k of kanten) { const ra = wurzel(k.a), rb = wurzel(k.b); if (ra !== rb) eltern.set(ra, rb); }
const sammler = new Map();
for (const x of eltern.keys()) {
  const r = wurzel(x);
  if (!sammler.has(r)) sammler.set(r, []);
  sammler.get(r).push(x);
}

const familien = [...sammler.values()].map((mitglieder) => {
  const eigene = kanten.filter((k) => mitglieder.includes(k.a) && mitglieder.includes(k.b));
  /* Innerhalb der Familie nach Entstehung - die erste Fassung oben. */
  const sortiert = [...mitglieder].sort((x, y) =>
    String((songs[x] || {}).erstellt || '').localeCompare(String((songs[y] || {}).erstellt || '')));
  return {
    lieder: sortiert,
    groesse: sortiert.length,
    /* Wie einig sich die Räume über diese Familie sind: mittlere
       Stimmenzahl ihrer Kanten. Die Oberfläche kann daran zeigen, wie
       fest ein Fund steht, ohne eine Schwelle zu behaupten. */
    einigkeit: +(eigene.reduce((s, k) => s + k.raeume.length, 0) / eigene.length).toFixed(2),
    kanten: eigene,
  };
});
/* Größte Familie zuerst, bei gleicher Größe die einigere. */
familien.sort((a, b) => b.groesse - a.groesse || b.einigkeit - a.einigkeit
  || titel(a.lieder[0]).localeCompare(titel(b.lieder[0])));

const ergebnis = {
  stand: new Date().toISOString(),
  verfahren: `gegenseitige Nachbarschaft unter den ${PARTNER} ähnlichsten, `
           + `mindestens ${STIMMEN} von 3 Räumen einig (Text, Klang, Harmonie); `
           + `Familien = Zusammenhangskomponenten`,
  kandidaten: N,
  familien,
};

const inFamilien = familien.reduce((s, f) => s + f.groesse, 0);
const groessen = {};
for (const f of familien) groessen[f.groesse] = (groessen[f.groesse] || 0) + 1;
console.log(`Familien: ${familien.length}  ·  Lieder darin: ${inFamilien}`);
console.log('Größen: ' + Object.entries(groessen).sort((a, b) => b[0] - a[0])
  .map(([g, n]) => `${n}× ${g}`).join(', '));

if (probe) {
  console.log('\n--probe: es wird nichts geschrieben.\n');
  for (const f of familien) {
    console.log(`${f.groesse} Fassungen, ${f.einigkeit}/3 einig:`);
    for (const id of f.lieder)
      console.log(`   ${String((songs[id] || {}).erstellt || '').slice(0, 10)}  ${titel(id)}`);
  }
} else {
  fs.writeFileSync(ZIEL, JSON.stringify(ergebnis, null, 1));
  console.log(`→ library/fassungen.json (${(fs.statSync(ZIEL).size / 1024).toFixed(1)} kB)`);
}
}

rechnen().catch((e) => { console.error(e); process.exit(1); });
