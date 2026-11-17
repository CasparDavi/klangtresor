#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   HAELT DER EIGENE KOPIERER, WAS RSYNC HIELT?
   bin/spiegeln-pruefen.js

   bin/spiegeln.js hat rsync im Export ersetzt (17.11.2026). Die gefaehrliche
   Haelfte davon ist aufraeumen(): es LOESCHT im Ziel. Ein falsches Filtermuster
   loescht auf dem Stick - und zwar genau das, was dort nur liegt, weil es nur
   dort liegen kann (der Stand des letzten Exports, die Behaelter).

   Darum wird hier nicht behauptet, sondern gemessen, und zwar mit GLEICHEM MASS
   AUF BEIDEN SEITEN: ein Baum aus Faellen wird angelegt, dann entscheidet
   einmal echtes rsync (--dry-run --itemize-changes, dieselben Argumente, die
   bis zum 17.11.2026 im Export standen) und einmal bin/spiegeln.js. Verglichen
   wird, WELCHE EINTRAEGE IM ZIEL UEBERLEBEN - nicht die Wortlaute der Ausgaben,
   denn rsync zaehlt beim Loeschen eines Ordners dessen Inhalt mit auf, wir
   nennen nur den Ordner.

   Braucht rsync. Ist keines da, sagt das Werkzeug das und endet mit 2 - der
   Vergleich ist dann nicht gelaufen, nicht bestanden.

   Aufruf:  node bin/spiegeln-pruefen.js            prueft und sagt das Urteil
            node bin/spiegeln-pruefen.js --zeigen   dazu jede Entscheidung
   ============================================================= */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { BEIFANG, filterBauen, aufraeumen } = require('./spiegeln.js');
const WERKZEUG = require('./werkzeug.js');

const ZEIGEN = process.argv.includes('--zeigen');
/* Welches rsync? Auf dem Mac liegen zwei: Apples openrsync (/usr/bin/rsync,
   Protokoll 29) und das echte GNU-rsync (3.5.0 aus Homebrew), das auch Linux
   benutzt. Gemessen wird gegen das, was die Suche findet - mit KT_RSYNC laesst
   sich das andere waehlen. docs/handbuch/SKIZZEN.md fuehrte als offene Frage,
   ob sich beide bei --delete-excluded unterschiedlich verhalten; hier ist sie
   messbar. */
const rsyncPfad = process.env.KT_RSYNC || WERKZEUG.finde('rsync');
if (!rsyncPfad) {
  console.log('\n  Kein rsync da - der Vergleich kann nicht laufen.');
  console.log('  Das ist KEIN Bestanden: ohne die Gegenseite ist nichts gemessen.\n');
  process.exit(2);
}

/* ---------------------------------------------------------------- Die Fälle */
/* Jeder Fall deckt eine Form ab, die im Export vorkommt. Was in beiden Bäumen
   steht, soll bleiben; was nur im Ziel steht, soll weg - es sei denn, ein
   Schutz (--filter P) hält es. */
const AUSSCHLUSS = [
  '--exclude', '/songs/', '--exclude', '/analyse/', '--exclude', '/kondensate/arbeit/',
  '--exclude', '/export-lauf.json', '--exclude', '/modelle/',
  '--filter', 'P /export-stand.json', '--filter', 'P /bestand-*.tar', '--filter', 'P /bestand-index.ndjson',
];

const QUELLE = {
  'katalog.json': 'bleibt (steht in beiden)',
  'texte/eins.json': 'bleibt (tiefer, steht in beiden)',
  'texte/zwei.json': 'bleibt',
  'kondensate/gut.json': 'bleibt (kondensate selbst ist nicht ausgeschlossen)',
  'songs/abc/audio.mp3': 'ausgeschlossen - zu Hause da, im Ziel nicht erwünscht',
  'analyse/abc.json': 'ausgeschlossen',
  'modelle/gross.onnx': 'ausgeschlossen',
  'export-lauf.json': 'ausgeschlossen',
  '.DS_Store': 'Beifang',
  'texte/.DS_Store': 'Beifang, tiefer',
  'notiz.tmp': 'Beifang (*.tmp)',
  '.gitignore': 'Beifang (.git*)',
};
const ZIEL = {
  'katalog.json': 'bleibt',
  'texte/eins.json': 'bleibt',
  'texte/zwei.json': 'bleibt',
  'kondensate/gut.json': 'bleibt',
  'texte/alt.json': 'WEG - zu Hause nicht mehr da',
  'altes/ganz/tief.json': 'WEG - ganzer Ordner zu Hause weg',
  'songs/abc/audio.mp3': 'WEG - ausgeschlossen (liegt im Behälter)',
  'analyse/abc.json': 'WEG - ausgeschlossen',
  'modelle/gross.onnx': 'WEG - ausgeschlossen',
  'export-lauf.json': 'WEG - ausgeschlossen',
  'kondensate/arbeit/zwischen.bin': 'WEG - ausgeschlossen, verankert und tiefer',
  'export-stand.json': 'BLEIBT - geschützt, lebt nur im Ziel',
  'bestand-0001.tar': 'BLEIBT - geschützt (Muster mit *)',
  'bestand-index.ndjson': 'BLEIBT - geschützt',
  'bestand-index.ndjson.tmp': 'WEG - NICHT geschützt (nur .ndjson steht im Schutz), und *.tmp ist Beifang',
  '.DS_Store': 'WEG - Beifang',
  'tief/bestand-0002.tar': 'WEG - der Schutz ist verankert, gilt nur an der Wurzel',
};

function baumLegen(wurzel, eintraege) {
  for (const rel of Object.keys(eintraege)) {
    const p = path.join(wurzel, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, rel);
  }
}
/* Alle Einträge unter wurzel, relativ, Ordner mit / am Ende. */
function alleEintraege(wurzel) {
  const aus = [];
  const rein = (ordner, rel) => {
    for (const x of fs.readdirSync(ordner, { withFileTypes: true })) {
      const r = rel ? rel + '/' + x.name : x.name;
      if (x.isDirectory()) { aus.push(r + '/'); rein(path.join(ordner, x.name), r); }
      else aus.push(r);
    }
  };
  rein(wurzel, '');
  return aus.sort();
}

/* ---------------------------------------------------------------- Die zwei Urteile */
/* rsync, mit genau den Argumenten, die bis zum 17.11.2026 im Export standen. */
function rsyncLoescht(quelle, ziel) {
  const argv = ['-rtL', '--modify-window=2', '--delete', '--delete-excluded', '--dry-run', '--itemize-changes',
                ...BEIFANG, ...AUSSCHLUSS, quelle + '/', ziel + '/'];
  const r = spawnSync(rsyncPfad, argv, { encoding: 'utf8' });
  if (r.status !== 0 && r.status !== 24) throw new Error('rsync Exit ' + r.status + '\n' + (r.stderr || ''));
  const weg = new Set();
  for (const z of String(r.stdout || '').split('\n')) {
    const m = /^\*deleting\s+(.+?)\s*$/.exec(z);
    if (m) weg.add(m[1]);
  }
  return weg;
}
/* Unsere Seite: aufraeumen() nennt beim Ordner nur den Ordner - fuer den
   Vergleich wird sein Inhalt dazugerechnet. */
function unserLoescht(quelle, ziel, alle) {
  const filter = filterBauen(AUSSCHLUSS);
  const weg = new Set(aufraeumen(quelle, ziel, filter, { trocken: true }));
  for (const r of [...weg]) {
    if (!r.endsWith('/')) continue;
    for (const e of alle) if (e.startsWith(r)) weg.add(e);
  }
  return weg;
}

/* ---------------------------------------------------------------- Lauf */
const zu = fs.mkdtempSync(path.join(os.tmpdir(), 'klangtresor-spiegeln-'));
const quelle = path.join(zu, 'zuhause');
const ziel = path.join(zu, 'stick');
let schlecht = 0;
try {
  baumLegen(quelle, QUELLE);
  baumLegen(ziel, ZIEL);
  const alle = alleEintraege(ziel);
  const rs = rsyncLoescht(quelle, ziel);
  const un = unserLoescht(quelle, ziel, alle);

  console.log('\n  ' + alle.length + ' Einträge im Ziel, ' + Object.keys(QUELLE).length + ' zu Hause.');
  console.log('  rsync ' + rsyncPfad + '\n');
  const kopf = '  ' + 'Eintrag'.padEnd(34) + 'rsync'.padEnd(10) + 'wir'.padEnd(10) + 'Urteil';
  if (ZEIGEN) { console.log(kopf); console.log('  ' + '-'.repeat(kopf.length)); }
  for (const e of alle) {
    const a = rs.has(e), b = un.has(e);
    const gleich = a === b;
    if (!gleich) schlecht++;
    if (ZEIGEN || !gleich) {
      console.log('  ' + e.padEnd(34) + (a ? 'löscht' : 'behält').padEnd(10) + (b ? 'löscht' : 'behält').padEnd(10)
        + (gleich ? '✓' : '✗  UNEINIG')
        + (ZIEL[e] || ZIEL[e.replace(/\/$/, '')] ? '   (' + (ZIEL[e] || ZIEL[e.replace(/\/$/, '')]) + ')' : ''));
    }
  }
  console.log('');
  if (schlecht) console.log('  ' + schlecht + ' von ' + alle.length + ' Entscheidungen weichen ab - NICHT BESTANDEN.\n');
  else console.log('  Alle ' + alle.length + ' Entscheidungen gleich wie rsync - bestanden.');

  /* UND JETZT WIRKLICH LOESCHEN. Bis hierher war beides ein Trockenlauf; eine
     Absicht ist noch keine Tat. Der Zielbaum wird neu gelegt, aufraeumen()
     laeuft scharf, und uebrig bleiben muss genau das, was rsync behalten
     haette. */
  fs.rmSync(ziel, { recursive: true, force: true });
  baumLegen(ziel, ZIEL);
  aufraeumen(quelle, ziel, filterBauen(AUSSCHLUSS), { trocken: false });
  const uebrig = new Set(alleEintraege(ziel));
  const sollBleiben = alle.filter((e) => !rs.has(e));
  const zuviel = [...uebrig].filter((e) => !sollBleiben.includes(e));
  const zuwenig = sollBleiben.filter((e) => !uebrig.has(e));
  if (zuviel.length || zuwenig.length) {
    schlecht += zuviel.length + zuwenig.length;
    for (const e of zuviel) console.log('  ✗ liegt noch da, rsync hätte es gelöscht: ' + e);
    for (const e of zuwenig) console.log('  ✗ ist weg, rsync hätte es behalten:     ' + e);
    console.log('\n  Scharf gelaufen: NICHT BESTANDEN.\n');
  } else {
    console.log('  Scharf gelaufen: ' + uebrig.size + ' Einträge übrig, genau die richtigen - bestanden.\n');
  }
} finally {
  try { fs.rmSync(zu, { recursive: true, force: true }); } catch (e) {}
}
process.exit(schlecht ? 1 : 0);
