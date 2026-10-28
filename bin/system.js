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
    const mo = require('./modellordner.js').modellOrdner(), alt = path.join(LIB, 'modelle');
    const archiv = await ordnerGroesse(LIB, [alt]);
    /* PROGRAMM UND MODELLE = der Programmordner ohne Archiv und ohne .git (darin KlangTresor/modelle, wenn die Modelle
       dort liegen), dazu ein eigener Modellordner ausserhalb, noch nicht umgezogene Modelle in library/modelle/ und
       ein Whisper-Programm aus dem Suchpfad. (Bis 28.10.2026 fehlte Whisper in der Summe: der Tab zeigte 1,3 statt
       4,4 GB.) */
    const echt = (p) => { try { return fs.realpathSync(p); } catch (e) { return p; } };
    const innen = (p) => echt(p).startsWith(echt(WURZEL) + path.sep);
    let programm = (await ordnerGroesse(WURZEL, [LIB, path.join(WURZEL, '.git')])) + (await ordnerGroesse(alt));
    if (!innen(mo)) programm += await ordnerGroesse(mo);
    try { const pr = require('./whisper.js').wo().programm; if (pr && !innen(pr)) programm += fs.statSync(echt(pr)).size; } catch (e) {}
    groessen = { archiv, programm }; groessenZeit = Date.now();
  })().catch(() => {}).finally(() => { zaehltGerade = false; });
}

function platz() {
  groessenZaehlen();   /* nur im Server - der Start (bin/starten.js) fragt mit ohnePlatz */
  let frei = null;
  try { const s = fs.statfsSync(WURZEL); frei = s.bavail * s.bsize; } catch (e) {}
  return { frei, archiv: groessen ? groessen.archiv : null, programm: groessen ? groessen.programm : null };
}

async function stand(opt = {}) {
  const w = await werkzeuge(), m = modelle();
  const mo = require('./modellordner.js');
  return {
    system: process.platform,
    modellOrdner: { pfad: mo.modellOrdner(), eigen: mo.eigenerOrdner(), container: mo.imContainer(), da: fs.existsSync(mo.modellOrdner()) },
    werkzeuge: w, modelle: m, verbindungen: verbindungen(), platz: opt.ohnePlatz ? null : platz(),
    fehlt: w.filter(x => !x.da).length + m.filter(x => !x.da).length,
  };
}

/* ---- AUFTRAEGE: HOLEN UND UPDATE (bin/auftrag.js) ----
   Nur einer zur Zeit. Wer was holt, steht in library/auftrag.json, die Ausgabe in library/auftrag.log. */
const AUFTRAG = path.join(LIB, 'auftrag.json');
const PROTOKOLL = path.join(LIB, 'auftrag.log');
const lebt = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };

function auftragStand() {
  let a = null;
  try { a = JSON.parse(fs.readFileSync(AUFTRAG, 'utf8')); } catch (e) { return null; }
  let text = '';
  try {
    const fd = fs.openSync(PROTOKOLL, 'r'), g = fs.fstatSync(fd).size, n = Math.min(g, 262144), b = Buffer.alloc(n);
    fs.readSync(fd, b, 0, n, g - n); fs.closeSync(fd); text = b.toString('utf8');
  } catch (e) {}
  let lauf = null; const zeilen = [];
  /* Eine @@KT-Meldung kann mitten in einer Zeile stehen (modelle-holen.js schreibt „hole … " ohne Zeilenende und
     meldet dann den Fortschritt) - vor ihr ist Text, ab ihr JSON bis zum Zeilenende. */
  for (const z of text.split(/\r?\n/)) {
    const i = z.indexOf('@@KT ');
    const vorn = (i >= 0 ? z.slice(0, i) : z).replace(/\x1b\[[0-9;]*m/g, '').replace(/\r/g, '').trimEnd();
    if (vorn.trim()) zeilen.push(vorn);
    if (i >= 0) { try { const m = JSON.parse(z.slice(i + 5)); if ('lauf' in m) lauf = m.lauf; } catch (e) {} }
  }
  const laeuft = !a.ende && !!a.pid && lebt(a.pid);
  return { id: a.id, seit: a.seit, ende: a.ende || null, code: a.code == null ? null : a.code,
           laeuft, abgebrochen: !a.ende && !laeuft, lauf: laeuft ? lauf : null, zeilen: zeilen.slice(-8) };
}

/* id: 'alle' | 'update' | 'pakete' | 'whisper' | ein Zweck aus ZWECKE ('tiefe', …) */
async function auftragStarten(id) {
  const jetzt = auftragStand();
  if (jetzt && jetzt.laeuft) return { ok: false, grund: 'laeuft', id: jetzt.id };
  const s = await stand();
  const mh = require('./modelle-holen.js');
  const modellBefehl = (ids) => {
    const dateien = s.modelle.filter(m => ids.includes(m.id) && m.id !== 'whisper' && !m.da).flatMap(m => m.fehlen);
    return dateien.length ? [['bin/modelle-holen.js', '--nur', dateien.join(',')]] : [];
  };
  let befehle = [];
  if (id === 'update') befehle = [['bin/aktualisieren.js']];
  else if (id === 'pakete') befehle = [['bin/pakete.js', '--tun']];
  else if (id === 'whisper') befehle = [['bin/whisper-holen.js']];
  else if (id === 'alle') {
    if (s.werkzeuge.some(w => w.id === 'pakete' && !w.da)) befehle.push(['bin/pakete.js', '--tun']);
    befehle.push(...modellBefehl(mh.ZWECKE.map(z => z.id)));
    if (s.modelle.some(m => m.id === 'whisper' && !m.da)) befehle.push(['bin/whisper-holen.js']);
  } else if (mh.ZWECKE.some(z => z.id === id)) befehle = modellBefehl([id]);
  else return { ok: false, grund: 'unbekannt' };
  if (!befehle.length) return { ok: false, grund: 'nichts' };
  fs.writeFileSync(PROTOKOLL, '');
  fs.writeFileSync(AUFTRAG, JSON.stringify({ id, seit: new Date().toISOString(), ende: null, code: null }, null, 1));
  const aus = fs.openSync(PROTOKOLL, 'a');
  const args = [path.join('bin', 'auftrag.js'), id];
  for (const b of befehle) args.push('--', ...b);
  const kind = require('node:child_process').spawn(process.execPath, args,
    { cwd: WURZEL, detached: true, stdio: ['ignore', aus, aus], windowsHide: true });
  kind.unref(); fs.closeSync(aus);
  /* Die Nummer des Auftrags gleich eintragen - sonst saehe eine Nachfrage in der ersten Zehntelsekunde einen Auftrag
     ohne Prozess und meldete ihn als abgebrochen (so im ersten Test, 28.10.2026). auftrag.js schreibt dieselbe Nummer. */
  fs.writeFileSync(AUFTRAG, JSON.stringify({ id, seit: new Date().toISOString(), pid: kind.pid, ende: null, code: null }, null, 1));
  return { ok: true, id };
}

module.exports = { stand, auftragStand, auftragStarten };

if (require.main === module) (async () => {
  const s = await stand();
  const z = (da, name, rest) => console.log(`  ${da ? '✓' : '✗'} ${name}${rest ? '  ' + rest : ''}`);
  console.log('\n  Werkzeuge');
  for (const x of s.werkzeuge) z(x.da, x.id, x.da ? (x.wert || '') : (x.fehlen ? 'fehlt: ' + x.fehlen.join(', ') : 'fehlt'));
  console.log('\n  KI-Modelle');
  for (const x of s.modelle) z(x.da, x.id, x.da ? '' : 'fehlt: ' + x.fehlen.join(', '));
  console.log(`\n  ${s.fehlt ? s.fehlt + ' Teil(e) fehlen' : 'Alles da'}.\n`);
})();
