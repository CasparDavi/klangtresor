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
const LIB     = path.join(WURZEL, 'library');
const ZIEL    = path.join(LIB, 'geschichten.json');
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

/* ---- NACHGESCHOBENE UEBERSETZUNGEN -----------------------------------
   Caspar_D, 28.08.2026: "und englische Texte, die nachgeschoben sind in
   deutschen Versionen müssen auch weg".

   Manche Lieder tragen ihren Text zweimal: erst deutsch, dann englisch.
   Sichtbar wird das, wenn man den Sprachverlauf ueber die Zeilen
   auftraegt - er sieht dann so aus:

       DDDDDEEEEEE

   Fuer den Geschichten-Raum ist das doppelt schaedlich: Der Song zieht
   in beide Sprachraeume, und weil alle Uebersetzungen dieselben
   englischen Fuellwoerter tragen, ruecken sie untereinander naeher,
   als ihre Themen es rechtfertigen.

   ABGESCHNITTEN WIRD NUR EIN SAUBERER BLOCK am Ende: Beide Haelften
   muessen fuer sich einsprachig sein und die Sprachen sich
   unterscheiden. Ein Lied, das zwischen den Sprachen SPIELT - Refrain
   englisch, Strophe deutsch -, hat kein solches Profil und bleibt
   unangetastet. Lieber eine Uebersetzung uebersehen als ein
   zweisprachiges Lied halbieren. */
const W_DE = /\b(und|der|die|das|ich|nicht|ist|mit|wir|du|sich|ein|eine|dem|den|für|auf|von|aus|mir|dir|mich|dich|wie|noch|nur|aber|wenn|dann|hat|war|kein|schon|immer|sind|hab|mein|dein|durch|über|ohne|zu)\b/gi;
const W_EN = /\b(the|and|you|that|with|for|are|this|have|from|your|will|can|all|but|not|was|what|when|who|out|now|get|just|like|know|time|love|don|been|would|its|our|they|there|into)\b/gi;

function sprache(zeile) {
  const d = (zeile.match(W_DE) || []).length, e = (zeile.match(W_EN) || []).length;
  if (d + e < 1) return null;                 /* zu wenig zum Urteilen */
  return d > e ? 'de' : e > d ? 'en' : null;
}

function ohneUebersetzung(text) {
  const zeilen = text.split('\n');
  const sp = zeilen.map(z => z.trim().length > 6 ? sprache(z) : null);
  const bewertbar = sp.filter(Boolean).length;
  if (bewertbar < 8) return text;             /* zu kurz fuer ein Urteil */

  /* Die Schnittstelle suchen, an der beide Haelften am reinsten sind. */
  let bester = null;
  for (let i = Math.floor(zeilen.length * 0.25); i < Math.floor(zeilen.length * 0.75); i++) {
    const vorn = sp.slice(0, i).filter(Boolean), hinten = sp.slice(i).filter(Boolean);
    if (vorn.length < 4 || hinten.length < 4) continue;
    const anteil = (a, s) => a.filter(x => x === s).length / a.length;
    for (const [a, b] of [['de', 'en'], ['en', 'de']]) {
      const rein = Math.min(anteil(vorn, a), anteil(hinten, b));
      if (rein > 0.8 && (!bester || rein > bester.rein)) bester = { i, rein };
    }
  }
  return bester ? zeilen.slice(0, bester.i).join('\n') : text;
}

function nurGesungenes(text) {
  /* ALLES VOR DER ERSTEN KLAMMER faellt weg. Caspar_D, 28.08.2026:
     "alles was vor der ersten eckigen Klammer steht, muß auch raus".

     Dort stehen Notizen an sich selbst - "Dieser Song gehoert zu meiner
     GEGENUEBER-Playlist" -, Stilangaben und Ansagen an Suno. Kein
     gesungenes Wort. Das Lied faengt mit der ersten Regieangabe an.

     Nur wenn ueberhaupt eine Klammer da ist: Ein Text ohne jede Regie
     ist von vorn bis hinten Gesang. */
  const ersteKlammer = text.indexOf('[');
  if (ersteKlammer > 0) text = text.slice(ersteKlammer);
  return text
    /* ALLES in eckigen Klammern, ohne Laengengrenze. Caspar_D,
       28.08.2026: "regie steht in suno immer in eckigen klammern" - und
       damit ist die Regel so einfach, wie sie aussieht.

       Die erste Fassung begrenzte auf 60 Zeichen. Damit blieben 388 der
       4274 Klammern stehen, darunter "[Verse 1 - Clean guitar
       arpeggios, mid tempo, intimate bariton vocal]", und im
       Geschichten-Raum hiess eine Gruppe daraufhin "Drums · Outro ·
       Slow". Eine Grenze zu ziehen, wo die Quelle keine hat, schafft
       nur eine Luecke. */
    .replace(/\[[^\]]*\]/gs, ' ')                          /* [Verse 1] und alles Weitere */
    .replace(/\*[^*\n]{1,60}\*/g, ' ')                      /* *fluesternd* */
    .replace(/\(([^)\n]{1,60})\)/g, (m, inhalt) =>
      REGIEWORT.test(inhalt.trim()) ? ' ' : m)              /* (spoken) raus, (ich geh) bleibt */
    /* Verwaiste Klammern: In drei Liedern des Bestands fehlt die
       oeffnende oder es stehen zwei schliessende hintereinander
       ("…Rhodes deepens]break]"). Was zwischen einer solchen Klammer und
       dem Zeilenrand steht, ist Regie ohne Gegenstueck - weg damit. */
    .replace(/^[^\[\]\n]*\]/gm, '')
    .replace(/\[[^\[\]\n]*$/gm, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n').map(z => z.trim()).filter(Boolean).join('\n')
    .trim();
}

/* Erst die Regie weg, dann die Uebersetzung - in dieser Reihenfolge:
   Der Sprachverlauf ist nur lesbar, wenn keine englischen Regiewoerter
   mehr dazwischenstehen. */
const nurGesungenesGanz = (text) => ohneUebersetzung(nurGesungenes(text));

/* Auch karte.js braucht den Filter - fuer die Gruppennamen im
   Geschichten-Raum. Einmal geschrieben, zweimal benutzt. */
module.exports = { nurGesungenes: nurGesungenesGanz, ohneRegie: nurGesungenes };

if (require.main !== module) return;

(async () => {
  /* Fehlt das Modell, wird der Schritt UEBERSPRUNGEN, nicht abgebrochen
     (Exit 0): im Wartungslauf ist eine fehlende Voraussetzung kein
     Fehler - der Rest des Morgens soll trotzdem laufen. Wichtig fuer
     Bestaende, auf denen bin/modelle-holen.js noch nie lief. */
  for (const [d, was] of [[MODELL, 'Modell'], [TOKEN, 'Tokenizer']])
    if (!fs.existsSync(d)) {
      console.log(`  Geschichten: ${was} fehlt (${path.relative(WURZEL, d)}) — Schritt übersprungen. Holen: node bin/modelle-holen.js`);
      process.exit(0);
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

  /* ---- WAS EINGEBETTET WIRD -------------------------------------------
     Caspar_D, 28.08.2026, ueber die Gruppennamen: "die
     gruppenbezeichnungen sind Quark, sorry. Das geht gar nicht."

     Er hatte recht, und das Problem lag nicht bei den Namen. Aus dem
     GANZEN Liedtext entstand eine Gruppe mit 144 von 257 Liedern - ihr
     Schwerpunkt IST damit die Gesamtmitte, sie hat kein gemeinsames
     Thema, also kann kein Verfahren eines finden. Der Text besteht zum
     groessten Teil aus Fuellwoertern, Refrainwiederholungen und
     Reimzwang; was ein Lied ERZAEHLT, geht darin unter.

     Deshalb werden, wo vorhanden, die ZEHN KONDENSIERTEN SUBSTANTIVE
     eingebettet (library/kondensate/, erzeugt nach den Regeln in
     bin/kondensat-prompt.js). Gemessen:

       Vektor aus     k  Silhouette  groesste Gruppe
       Volltext       5      0,183      154 (60 %)
       Kondensat      7      0,150       84 (33 %)

     Die Silhouette faellt, aber sie belohnt wenige grosse Klumpen - eine
     Loesung mit einer 60-%-Gruppe sieht gut aus und ist unbrauchbar. Und
     an den Werkgruppen mit bekannter Wahrheit gemessen findet das
     Kondensat den Partner eines Liedes auf Rang 1,00 statt 6,08.

     Wer kein Kondensat hat - ein frisch importiertes Lied etwa -,
     bekommt weiter den gefilterten Volltext. Die Karte bleibt damit
     vollstaendig, und das Feld 'quelle' sagt je Lied, woher der Vektor
     stammt. */
  let kondensate = null;
  const kondPfad = path.join(LIB, 'kondensate', 'kondensate.json');
  if (fs.existsSync(kondPfad)) {
    const A = JSON.parse(fs.readFileSync(kondPfad, 'utf8'));
    const reihe = ['opus-f2-gesamt', 'opus', 'opus-gesamt'];
    kondensate = {};
    for (const [id, eintrag] of Object.entries(A.lieder || {})) {
      const m = reihe.find(k => eintrag.modelle && eintrag.modelle[k]);
      if (m) kondensate[id] = eintrag.modelle[m];
    }
    if (!Object.keys(kondensate).length) kondensate = null;
    else console.log(`  Kondensate: ${Object.keys(kondensate).length} Lieder mit zehn Substantiven`);
  }

  const songs = {};
  let gerechnet = 0, uebernommen = 0, uebersprungen = 0, ausKondensat = 0;
  const t0 = Date.now();

  for (const s of liste) {
    const n = s.lyrics.length;
    const kond = kondensate && kondensate[s.id];
    const quelle = kond ? 'kondensat' : 'volltext';
    /* Uebernehmen nur, wenn Text UND Quelle gleich geblieben sind - sonst
       stuende ein alter Volltext-Vektor neben neuen Kondensat-Vektoren,
       und die Karte mischte zwei Massstaebe. */
    if (alt[s.id] && alt[s.id].zeichen === n && (alt[s.id].quelle || 'volltext') === quelle) {
      songs[s.id] = alt[s.id]; uebernommen++; if (kond) ausKondensat++; continue;
    }
    let text, gesungen;
    if (kond) {
      text = kond.join(', ');
      gesungen = text.length;
      ausKondensat++;
    } else {
      text = nurGesungenesGanz(s.lyrics);
      if (text.length < MINDEST) { uebersprungen++; continue; }
      gesungen = text.length;
    }
    const v = await e.einbetten(text);
    songs[s.id] = { emb: Array.from(v, x => +x.toFixed(6)), zeichen: n, gesungen, quelle };
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
