#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   WERKZEUGE FINDEN - AUF ALLEN DREI SYSTEMEN
   bin/werkzeug.js

   Gemeldet von Apex (17.11.2026, Windows): „Habe Ziel gewählt, bin dann auf
   Export starten und bekomme dann die Meldung, das noch kein Export auf
   K:\\Klangtresor bereit ist." Der Export brach in der Vorbedingung ab:

     for (const w of ['rsync', 'ffmpeg']) if (spawnSync('which', [w]).status !== 0) abbruch(...)

   `which` gibt es auf Windows nicht - dort heisst es `where`. Damit galt auch
   das MITGELIEFERTE ffmpeg als fehlend, obwohl es unter
   werkzeug/ffmpeg/bin/ffmpeg.exe liegt. Die Meldung lautete „ffmpeg fehlt",
   und gesehen hat sie niemand, weil der Server den Export mit stdio:'ignore'
   startet.

   Dieselbe Suche stand im Haus dreimal, jede ein wenig anders:
   bin/takt.js (ffmpegPfad), bin/system.js (programm) und bin/whisper.js
   (imPfad). Hier ist sie EINMAL - keine zwei Apparate fuer dieselbe Frage.

   DIE REIHENFOLGE IST ABSICHT: zuerst das Mitgelieferte unter werkzeug/,
   dann der Suchpfad des Systems. Wer ein eigenes ffmpeg installiert hat,
   soll nicht ein anderes bekommen als die Einrichtung geprueft hat.

   Von Hand:  node bin/werkzeug.js        sagt, was gefunden wird
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const WURZEL = path.resolve(__dirname, '..');
const EXE = process.platform === 'win32' ? '.exe' : '';

const istDatei = (p) => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } };

/* Im Suchpfad des Systems: `where` auf Windows, `which` sonst. Beide geben den
   Pfad auf der Standardausgabe; `where` kann mehrere Zeilen liefern, die erste
   gilt. Gibt den Pfad oder null. */
function imPfad(name) {
  const r = spawnSync(EXE ? 'where' : 'which', [name + EXE], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  const erste = String(r.stdout || '').trim().split(/\r?\n/)[0];
  return erste && istDatei(erste) ? erste : (erste || null);
}

/* Wo die mitgelieferten Werkzeuge liegen. ffmpeg und ffprobe stecken in
   werkzeug/ffmpeg/bin/, whisper-cli in werkzeug/whisper/ (dort auch in
   Release/, so legt es der Windows-Bau ab). */
const EIGENE = {
  ffmpeg:  [['werkzeug', 'ffmpeg', 'bin', 'ffmpeg' + EXE]],
  ffprobe: [['werkzeug', 'ffmpeg', 'bin', 'ffprobe' + EXE]],
  'whisper-cli': [['werkzeug', 'whisper', 'whisper-cli' + EXE],
                  ['werkzeug', 'whisper', 'Release', 'whisper-cli' + EXE]],
};

/* Der Pfad zu einem Werkzeug, oder null. Erst das Mitgelieferte, dann der
   Suchpfad. */
function finde(name) {
  for (const teile of EIGENE[name] || []) {
    const p = path.join(WURZEL, ...teile);
    if (istDatei(p)) return p;
  }
  return imPfad(name);
}

/* Fuer Aufrufe, die ohnehin nur den Namen brauchen: der gefundene Pfad, sonst
   der nackte Name - dann entscheidet der Suchpfad des Kindprozesses. So bleibt
   ein Aufruf moeglich, auch wenn die Suche nichts fand (etwa weil `where`
   gesperrt ist), und die Fehlermeldung kommt vom Programm selbst. */
function pfad(name) { return finde(name) || name; }

/* Ist es da? Fuer Vorbedingungen. */
function da(name) { return !!finde(name); }

module.exports = { finde, pfad, da, imPfad, EXE };

if (require.main === module) {
  for (const n of ['ffmpeg', 'ffprobe', 'whisper-cli', 'rsync', 'git', 'node']) {
    const p = finde(n);
    console.log('  ' + n.padEnd(14) + (p ? p.replace(WURZEL + path.sep, '') : '— nicht gefunden'));
  }
}
