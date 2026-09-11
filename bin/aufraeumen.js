#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ============================================================
   Hausputz auf dem Medium
   ------------------------------------------------------------
   Zwei Dinge, die auf exFAT unvermeidlich entstehen und beide Platz
   kosten - unter Umstaenden sehr viel, weil ein Block hier ein ganzes
   MEGABYTE ist. Eine Datei von 300 Bytes belegt also 1 MB.

   1. APPLE-BEIAKTEN (`._name`). macOS stempelt seit Ventura jede
      geschriebene Datei mit dem erweiterten Attribut
      com.apple.provenance. exFAT kann keine erweiterten Attribute,
      also legt macOS je Datei eine 4-KB-Beiakte daneben - die dann
      1 MB belegt. Einen Schalter dagegen gibt es nicht, weder je
      Medium noch systemweit; sie entstehen sofort wieder.
      Sie sind nicht nur Ballast: beim Packen des Objektspeichers hat
      git am 11.09.2026 versucht, eine `._pack-….idx` als Paketindex zu
      lesen, und Fehler geworfen. Es ist darueber gestolpert und
      trotzdem fertig geworden - darauf sollte man sich nicht verlassen.

   2. LOSE GIT-OBJEKTE. Jeder Commit legt kleine Einzeldateien an, und
      jede belegt ein Megabyte. Gemessen am 11.09.2026: 2536 lose
      Objekte, 125 MB Inhalt, 2572 MB belegt. Nach dem Packen: 40
      Dateien, 48 MB belegt. 2,5 GB zurueck, ohne Risiko.

   Was dieses Skript NICHT tut: es fasst nur `._`-Dateien an und nur
   innerhalb des Projektordners, es folgt keinen Verweisen nach
   draussen, und es packt nur, wenn sich das Packen lohnt.

   Aufruf:
     node bin/aufraeumen.js            aufraeumen
     node bin/aufraeumen.js --pruefen  nur nachsehen, nichts anfassen
   ============================================================ */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const WURZEL = path.resolve(__dirname, '..');
const NUR_PRUEFEN = process.argv.includes('--pruefen');
const BLOCK = 1048576;                 /* exFAT auf diesem Medium: 1 MB je Block */
const LOSE_GRENZE = 500;               /* darunter lohnt das Packen die Zeit nicht */

/* Beiakten suchen. Verweisen wird NICHT gefolgt - das Labor legt Verweise ins
   Archiv und in die Seite, und dahinter hat dieses Skript nichts zu suchen. */
function beiakten(ordner, gefunden = []) {
  let eintraege;
  try { eintraege = fs.readdirSync(ordner, { withFileTypes: true }); } catch (e) { return gefunden; }
  for (const e of eintraege) {
    const p = path.join(ordner, e.name);
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) { beiakten(p, gefunden); continue; }
    if (e.name.startsWith('._')) gefunden.push(p);
  }
  return gefunden;
}

function belegt(dateien) {
  let b = 0;
  for (const p of dateien) {
    try { b += Math.max(BLOCK, Math.ceil(fs.statSync(p).size / BLOCK) * BLOCK); } catch (e) {}
  }
  return b;
}
const mb = b => (b / 1048576).toFixed(0);

function loseObjekte() {
  try {
    const t = execFileSync('git', ['count-objects', '-v'], { cwd: WURZEL, encoding: 'utf8' });
    const m = t.match(/^count:\s+(\d+)/m);
    return m ? parseInt(m[1], 10) : 0;
  } catch (e) { return 0; }
}

function gitGroesse() {
  const alle = [];
  (function lauf(o) {
    let es; try { es = fs.readdirSync(o, { withFileTypes: true }); } catch (e) { return; }
    for (const e of es) { const p = path.join(o, e.name);
      if (e.isSymbolicLink()) continue;
      e.isDirectory() ? lauf(p) : alle.push(p); }
  })(path.join(WURZEL, '.git'));
  return belegt(alle);
}

console.log('Hausputz auf dem Medium\n');

/* --- 1. Beiakten ------------------------------------------------ */
let weg = beiakten(WURZEL);
const weggBytes = belegt(weg);
if (!weg.length) console.log('  Apple-Beiakten: keine');
else if (NUR_PRUEFEN) console.log(`  Apple-Beiakten: ${weg.length} Stück, ${mb(weggBytes)} MB belegt — nicht angefasst`);
else {
  let n = 0;
  for (const p of weg) { try { fs.unlinkSync(p); n++; } catch (e) {} }
  console.log(`  Apple-Beiakten: ${n} entfernt, ${mb(weggBytes)} MB frei`);
}

/* --- 2. Objektspeicher packen ----------------------------------- */
const lose = loseObjekte();
let gespart = 0;
if (lose < LOSE_GRENZE) {
  console.log(`  Objektspeicher: ${lose} lose Objekte — unter ${LOSE_GRENZE}, Packen lohnt nicht`);
} else if (NUR_PRUEFEN) {
  console.log(`  Objektspeicher: ${lose} lose Objekte, ${mb(gitGroesse())} MB belegt — würde gepackt`);
} else {
  const vorher = gitGroesse();
  try {
    /* Zweimal: der erste Lauf schreibt neue Pakete, macOS legt sofort Beiakten
       daneben, und die stoeren den naechsten Lauf. Also dazwischen kehren. */
    execFileSync('git', ['gc', '--quiet', '--prune=now'], { cwd: WURZEL, stdio: 'ignore', timeout: 900000 });
    for (const p of beiakten(path.join(WURZEL, '.git'))) { try { fs.unlinkSync(p); } catch (e) {} }
    execFileSync('git', ['gc', '--quiet', '--prune=now'], { cwd: WURZEL, stdio: 'ignore', timeout: 900000 });
    for (const p of beiakten(path.join(WURZEL, '.git'))) { try { fs.unlinkSync(p); } catch (e) {} }
    gespart = vorher - gitGroesse();
    console.log(`  Objektspeicher: ${lose} lose Objekte gepackt, ${mb(vorher)} → ${mb(gitGroesse())} MB`);
  } catch (e) {
    console.log(`  Objektspeicher: Packen ging nicht — ${String(e.message).slice(0, 120)}`);
  }
  /* Nach dem Packen nachsehen, ob das Archiv unversehrt ist. Lieber hier laut
     werden als beim naechsten Griff danach. */
  try {
    execFileSync('git', ['fsck', '--connectivity-only', '--no-progress'], { cwd: WURZEL, stdio: 'ignore', timeout: 600000 });
    console.log('  Prüfsumme:      in Ordnung');
  } catch (e) { console.log('  Prüfsumme:      ACHTUNG, git fsck meldet etwas — von Hand nachsehen'); }
}

const frei = (NUR_PRUEFEN ? 0 : weggBytes) + gespart;
console.log(`\n→ ${NUR_PRUEFEN ? 'Zu holen wären' : 'Frei geworden:'} ${mb(frei)} MB`);
