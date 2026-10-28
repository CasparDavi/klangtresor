#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   WIE GESUND IST DAS SYSTEM? - DER STAND FUER DEN TAB „SYSTEM"
   bin/system.js

   Caspar_D, 28.10.2026: „wieso kann man nicht im Profil sehen, wie gesund das System ist, welche Modelle da sind,
   welche fehlen, und man genau dort auf das drückt, was fehlt. Ein Tab Systemgesundheit wäre gut."

   Hier wird nur NACHGESEHEN, nichts geholt. Die Antwort traegt vier Teile:
     werkzeuge     Node, ffmpeg, ffprobe, die Programmbausteine (Pakete)
     modelle       je Zweck (Instrumentspuren, Musikstil, …) da oder nicht - die Zuordnung steht in
                   bin/modelle-holen.js (ZWECKE), Whisper kommt aus bin/whisper-holen.js
     verbindungen  der letzte Befund von bin/gesundheit.js (Morgenlauf), nicht neu gefragt
     platz         frei auf dem Medium, Groesse des Archivs und von Programm und Modellen

   Die Groessen der Ordner zu zaehlen dauert auf exFAT Sekunden (tausende Dateien). Sie werden darum im
   Hintergrund gezaehlt und zehn Minuten gemerkt; bis dahin steht null, und die Seite sagt „wird gemessen".
   Gezaehlt wird der Inhalt der Dateien, nicht die belegten Bloecke (exFAT belegt je Datei ein ganzes Megabyte).

     node bin/system.js     derselbe Stand als Text, fuer ein Terminal
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');

const WURZEL = path.join(__dirname, '..');
const LIB = path.join(WURZEL, 'library');
const EXE = process.platform === 'win32' ? '.exe' : '';

/* ffmpeg und ffprobe: zuerst der Werkzeugordner der Einrichtung, dann der Suchpfad - wie die Starter es halten.
   ASYNCHRON: der Server darf dabei nicht stehen - er liefert nebenher Musik aus. */
const versuch = (befehl) => new Promise(r => execFile(befehl, ['-version'], { timeout: 5000, windowsHide: true },
  (fehler, aus) => r(fehler ? null : String(aus))));
async function programm(name) {
  const eigen = path.join(WURZEL, 'werkzeug', 'ffmpeg', 'bin', name + EXE);
  for (const befehl of fs.existsSync(eigen) ? [eigen, name] : [name]) {
    const aus = await versuch(befehl);
    if (aus !== null) return { da: true, wert: (/version\s+(\S+)/.exec(aus) || [])[1] || '', pfad: befehl };
  }
  return { da: false };
}

async function werkzeuge() {
  const nodeHaupt = +process.versions.node.split('.')[0];
  const [ff, fp] = await Promise.all([programm('ffmpeg'), programm('ffprobe')]);
  let pakete = { da: false, fehlen: ['?'], anzahl: 0 };
  try {
    const fehlen = require('./pakete.js').fehlende();
    let anzahl = 0;
    try { anzahl = Object.keys(JSON.parse(fs.readFileSync(path.join(WURZEL, 'package-lock.json'), 'utf8')).packages || {})
            .filter(k => k.startsWith('node_modules/')).length; } catch (e) {}
    pakete = { da: !fehlen.length, fehlen, anzahl };
  } catch (e) { pakete.fehler = e.message; }
  return [
    { id: 'node', da: nodeHaupt >= 20, wert: process.versions.node },
    { id: 'ffmpeg', da: ff.da, wert: ff.wert, pfad: ff.pfad },
    { id: 'ffprobe', da: fp.da, wert: fp.wert, pfad: fp.pfad },
    { id: 'pakete', ...pakete },
  ];
}

function modelle() {
  const mh = require('./modelle-holen.js');
  const soll = new Map(mh.DATEIEN.map(d => [d[0], d[2]]));
  const aus = mh.ZWECKE.map(z => {
    let bytes = 0; const fehlen = [];
    for (const n of z.dateien) {
      let g = 0; try { g = fs.statSync(path.join(mh.ZIEL, n)).size; } catch (e) {}
      if (g >= (soll.get(n) || 1)) bytes += g; else { fehlen.push(n); bytes += soll.get(n) || 0; }
    }
    return { id: z.id, da: !fehlen.length, fehlen, bytes };
  });
  /* Whisper: Programm und Sprachmodell, gesucht wie in bin/whisper.js */
  let w = { programm: null, modell: null };
  try { const wh = require('./whisper-holen.js'); w = { programm: wh.programmDa() || null, modell: wh.modellDa() || null }; } catch (e) {}
  let wb = 0; try { if (w.modell) wb = fs.statSync(w.modell).size; } catch (e) {}
  aus.push({ id: 'whisper', da: !!(w.programm && w.modell), bytes: wb || 3095033483,
             fehlen: [...(w.programm ? [] : ['whisper-cli']), ...(w.modell ? [] : ['ggml-large-v3.bin'])] });
  return aus;
}

/* Der letzte Befund des Morgenlaufs. Zahlen sind Statuscodes (200/206 gut), Text ist eine Beobachtung. */
function verbindungen() {
  try {
    const g = JSON.parse(fs.readFileSync(path.join(LIB, 'gesundheit.json'), 'utf8'));
    return { stand: g.stand || null, befunde: Object.entries(g.befunde || {}).map(([name, wert]) =>
      ({ name, wert, ok: typeof wert === 'number' ? (wert === 200 || wert === 206) : null })) };
  } catch (e) { return { stand: null, befunde: [] }; }
}

/* ---- Groessen, im Hintergrund gezaehlt ---- */
let groessen = null, groessenZeit = 0, zaehltGerade = false;
async function ordnerGroesse(ordner, ohne = []) {
  let summe = 0;
  const stapel = [ordner];
  while (stapel.length) {
    const o = stapel.pop();
    let eintraege = [];
    try { eintraege = await fs.promises.readdir(o, { withFileTypes: true }); } catch (e) { continue; }
    for (const e of eintraege) {
      if (e.name.startsWith('._')) continue;   /* Apple-Beiakten auf exFAT */
      const p = path.join(o, e.name);
      if (ohne.includes(p)) continue;
      if (e.isDirectory()) stapel.push(p);
      else if (e.isFile()) { try { summe += (await fs.promises.stat(p)).size; } catch (er) {} }
    }
  }
  return summe;
}
function groessenZaehlen() {
  if (zaehltGerade || (groessen && Date.now() - groessenZeit < 600000)) return;
  zaehltGerade = true;
  (async () => {
    const modelle = path.join(LIB, 'modelle');
    const archiv = await ordnerGroesse(LIB, [modelle]);
    const programm = (await ordnerGroesse(modelle)) + (await ordnerGroesse(path.join(WURZEL, 'werkzeug')))
      + (await ordnerGroesse(path.join(WURZEL, 'node_modules')));
    groessen = { archiv, programm }; groessenZeit = Date.now();
  })().catch(() => {}).finally(() => { zaehltGerade = false; });
}

function platz() {
  groessenZaehlen();
  let frei = null;
  try { const s = fs.statfsSync(WURZEL); frei = s.bavail * s.bsize; } catch (e) {}
  return { frei, archiv: groessen ? groessen.archiv : null, programm: groessen ? groessen.programm : null };
}

async function stand() {
  const w = await werkzeuge(), m = modelle();
  return {
    system: process.platform,
    werkzeuge: w, modelle: m, verbindungen: verbindungen(), platz: platz(),
    fehlt: w.filter(x => !x.da).length + m.filter(x => !x.da).length,
  };
}

module.exports = { stand };

if (require.main === module) (async () => {
  const s = await stand();
  const z = (da, name, rest) => console.log(`  ${da ? '✓' : '✗'} ${name}${rest ? '  ' + rest : ''}`);
  console.log('\n  Werkzeuge');
  for (const x of s.werkzeuge) z(x.da, x.id, x.da ? (x.wert || '') : (x.fehlen ? 'fehlt: ' + x.fehlen.join(', ') : 'fehlt'));
  console.log('\n  KI-Modelle');
  for (const x of s.modelle) z(x.da, x.id, x.da ? '' : 'fehlt: ' + x.fehlen.join(', '));
  console.log(`\n  ${s.fehlt ? s.fehlt + ' Teil(e) fehlen' : 'Alles da'}.\n`);
})();
