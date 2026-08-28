#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   DER GESCHICHTEN-RAUM  ·  bin/geschichten.js

   Liest die Liedtexte und macht aus jedem einen Vektor. Was der
   Klangraum fuer den Ton ist, ist dieser fuer den Text: Naehe heisst
   "handelt von aehnlichem", unabhaengig davon, wie es klingt.

   Ergebnis: library/geschichten.json { stand, modell, songs: {...} }

   -------------------------------------------------------------
   WARUM KEINE UEBERSETZUNG

   Caspar_D, 28.08.2026: "es ging um Liedtextuebersetzung um Lieder
   klanglich als auch textlich zu clustern."

   Der Gedanke lag nahe - und er ist nicht noetig. Das Modell
   multilingual-e5-small bildet ueber hundert Sprachen in DENSELBEN
   Raum ab. Ein deutscher Text ueber Abschied liegt neben einem
   englischen ueber dasselbe, ohne dass irgendwo uebersetzt wird.

   Nachgemessen am 28.08.2026:
     deutscher Abschiedstext gegen englischen   0,913
     deutscher Tanztext gegen englischen        0,903
     deutscher Abschied gegen deutschen Tanz    0,855
   Die Uebersetzungspaare liegen also HOEHER als zwei verschiedene
   Themen derselben Sprache. Genau darauf kommt es an.

   Und eine Uebersetzung waere schaedlich: Reim, Wortspiel und Klang
   ueberleben sie nicht, das Thema ueberlebt sie ohnehin. Man
   verloere etwas und gewaenne nichts. Im Bestand liegen ausserdem
   221 deutsche, 24 englische und 12 gemischte Texte - dazu ein
   japanischer Titel. Ein einsprachiges Modell haette hier von
   vornherein nichts zu suchen.

   -------------------------------------------------------------
   Die 64 Lieder ohne Text bekommen KEINEN Vektor. Sie fehlen im
   Geschichten-Raum, und das soll man sehen - nicht so tun, als
   waeren sie allem unaehnlich.
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const K = require('./katalog.js');
const { einbetterLaden } = require('./texte-einbetten.js');

const WURZEL  = path.join(__dirname, '..');
const MODELL  = path.join(WURZEL, 'library', 'modelle', 'paraphrase-multilingual-mpnet.onnx');
const TOKEN   = path.join(WURZEL, 'library', 'modelle', 'paraphrase-multilingual-mpnet-tokenizer.json');
const ZIEL    = path.join(WURZEL, 'library', 'geschichten.json');
const MINDEST = 50;   /* Kuerzere "Texte" sind Platzhalter, keine Geschichte. */

/* ---- NUR DAS GESUNGENE ------------------------------------------------
   Caspar_D, 28.08.2026: "gib ihm aber nur die Texte ohne Regie etc pp".

   Sunos Texte tragen ein Geruest aus Regieangaben: [Intro], [Verse 1],
   [Chorus], [Bridge]. Gezaehlt am Bestand: 3641 Vorkommen in 252 von 257
   Liedern - und zwar UEBERALL DIESELBEN Woerter. Wer sie mit einbettet,
   misst zu einem guten Teil, dass alle Lieder ein Geruest haben.

   Das war auch der Grund fuer eine Auffaelligkeit im ersten Lauf: die
   Abstaende lagen alle zwischen 0,19 und 0,42, also unnatuerlich eng.

   RUNDE Klammern bleiben stehen. Bei Suno sind das meist Begleitstimmen
   oder Zwischenrufe - "Ich geh (ich geh) fort" -, und die gehoeren zum
   Lied. Nur die wenigen offensichtlichen Regieworte darin fliegen raus. */
const REGIEWORT = /^(spoken|whispered?|instrumental|silence|talking|sound effects?|sfx|ad-?lib\w*)$/i;

function nurGesungenes(text) {
  return text
    .replace(/\[[^\]]{1,60}\]/g, ' ')                      /* [Verse 1] und Verwandte */
    .replace(/\*[^*\n]{1,60}\*/g, ' ')                      /* *fluesternd* */
    .replace(/\(([^)\n]{1,60})\)/g, (m, inhalt) =>
      REGIEWORT.test(inhalt.trim()) ? ' ' : m)              /* (spoken) raus, (ich geh) bleibt */
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n').map(z => z.trim()).filter(Boolean).join('\n')
    .trim();
}

(async () => {
  for (const [d, was] of [[MODELL, 'Modell'], [TOKEN, 'Tokenizer']])
    if (!fs.existsSync(d)) {
      console.error(`  ${was} fehlt: ${path.relative(WURZEL, d)}\n  node bin/modelle-holen.js`);
      process.exit(1);
    }

  const katalog = K.lesen();
  if (!katalog) { console.error('Kein Katalog.'); process.exit(1); }

  const liste = Object.values(katalog.songs)
    .filter(s => s.lyrics && s.lyrics.trim().length >= MINDEST);
  const ohne = Object.keys(katalog.songs).length - liste.length;

  console.log(`  Geschichten: ${liste.length} Lieder mit Text, ${ohne} ohne`);

  /* Vorhandenes weiterverwenden - nur neue und geaenderte rechnen. */
  let alt = {};
  try { alt = JSON.parse(fs.readFileSync(ZIEL, 'utf8')).songs || {}; } catch (e) {}

  const e = await einbetterLaden(MODELL, TOKEN);
  const songs = {};
  let gerechnet = 0, uebernommen = 0, uebersprungen = 0;
  const t0 = Date.now();

  for (const s of liste) {
    const n = s.lyrics.length;
    if (alt[s.id] && alt[s.id].zeichen === n) { songs[s.id] = alt[s.id]; uebernommen++; continue; }
    const rein = nurGesungenes(s.lyrics);
    if (rein.length < MINDEST) { uebersprungen++; continue; }
    const v = await e.einbetten(rein);
    songs[s.id] = { emb: Array.from(v, x => +x.toFixed(6)), zeichen: n, gesungen: rein.length };
    gerechnet++;
    if (gerechnet % 25 === 0)
      process.stdout.write(`\r  ${gerechnet} gerechnet …`);
  }
  if (gerechnet >= 25) process.stdout.write('\r');

  fs.writeFileSync(ZIEL, JSON.stringify({
    stand: new Date().toISOString().slice(0, 10),
    modell: 'paraphrase-multilingual-mpnet-base-v2 (mehrsprachig, 768 Dimensionen)',
    songs,
  }));

  const mb = fs.statSync(ZIEL).size / 1048576;
  console.log(`  ${gerechnet} gerechnet, ${uebernommen} uebernommen`
    + (uebersprungen ? `, ${uebersprungen} ohne Text nach dem Filtern` : '')
    + `, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  console.log(`  → library/geschichten.json (${mb.toFixed(1)} MB)`);
})();
