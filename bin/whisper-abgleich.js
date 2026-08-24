/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Whisper-Wörter nachträglich mit den Lyrics abgleichen.
 *
 *   node bin/whisper-abgleich.js            alle Einträge in whisper.ndjson
 *   node bin/whisper-abgleich.js --probe    nur zählen, nichts schreiben
 *
 * WOZU: bin/whisper.js gleicht schon beim Rechnen ab - aber nur gegen
 * die Lyrics, die es DA gab. Kommen Lyrics später dazu (ein privater
 * Song wird veröffentlicht, ein Text nachgetragen), oder wurde ein
 * Eintrag vor einer Verbesserung des Abgleichs gerechnet, holt dieser
 * Lauf das nach. (Caspar_D, 20.08.2026 - "wichtig".)
 *
 * Was er tut: je Eintrag die aktuellen Lyrics aus dem Katalog holen
 * (nur echte - keine, die Whisper selbst gehört hat), Schreibweise
 * der Treffer übernehmen, Zeile neu schreiben. Zeiten bleiben, wie
 * sie sind. Danach: node bin/aufbereiten.js, damit der Katalog die
 * korrigierten Wörter übernimmt.
 */
const fs   = require('node:fs');
const path = require('node:path');
const K    = require('./katalog.js');
const T    = require('./whisper-text.js');

const WURZEL = path.join(__dirname, '..');
const DATEI  = path.join(WURZEL, 'library', 'whisper.ndjson');
const probe  = process.argv.includes('--probe');

const katalog = K.lesen();
if (!katalog) { console.error('Kein Katalog.'); process.exit(1); }
if (!fs.existsSync(DATEI)) { console.error('Kein whisper.ndjson.'); process.exit(1); }

const zeilen = fs.readFileSync(DATEI, 'utf8').split('\n').filter(z => z.trim());
let geprueft = 0, veraendert = 0, ohneText = 0, worteNeu = 0;
const aus = [];

for (const z of zeilen) {
  let e; try { e = JSON.parse(z); } catch (x) { aus.push(z); continue; }
  const s = katalog.songs[e.id];
  const lyrics = s && s.lyricsQuelle !== 'whisper' && s.lyrics && s.lyrics.trim();
  if (!lyrics || e.instrumental || !Array.isArray(e.worte) || !e.worte.length) {
    if (!lyrics) ohneText++;
    aus.push(z); continue;
  }
  geprueft++;
  const gehoert = e.worte.map(w => ({ s: w[0], e: w[1], text: w[2] }));
  const treffer = T.abgleichen(gehoert, T.lyricsWoerter(lyrics));
  const neu = gehoert.map(w => [w.s, w.e, w.text]);
  const anders = JSON.stringify(neu) !== JSON.stringify(e.worte);
  if (anders) {
    veraendert++;
    worteNeu += neu.filter((w, i) => w[2] !== e.worte[i][2]).length;
    e.worte = neu; e.abgeglichen = treffer; e.abgleichAm = new Date().toISOString();
  }
  aus.push(JSON.stringify(e));
}

if (!probe && veraendert) fs.writeFileSync(DATEI, aus.join('\n') + '\n');
console.log(`\n  ${geprueft} Einträge gegen Lyrics gelegt` +
            (ohneText ? ` (${ohneText} ohne echten Text übersprungen)` : '') + ':');
console.log(`  ${veraendert} Einträge ${probe ? 'würden sich ändern' : 'korrigiert'}, ${worteNeu} Wörter in offizielle Schreibweise gebracht.`);
if (!probe && veraendert) console.log('  Dann: node bin/aufbereiten.js — übernimmt die Korrekturen in den Katalog.\n');
else console.log('');
