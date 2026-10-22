/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* WORAUS WURDE EINE ANALYSE GEMESSEN - UND GILT SIE NOCH?
   bin/ablage-quelle.js

   Jede Ablage (library/analyse/<id>.bin) traegt im Kopf das Feld `quelle`: audio.wav, eigen.wav oder
   audio.mp3 (web/fremd/analyse-ablage.js). Seit dem 23.10.2026 misst KlangTresor auch aus dem MP3, wenn
   keine WAV da ist - neue Bestaende haben keine, Suno gibt sie nur noch einzeln frei (Lutz, Discord:
   „0 von 1010"). Kommt die WAV spaeter dazu, ist die MP3-Messung VERALTET: Server und
   bin/vorrechnen.js zaehlen sie dann nicht mehr als fertig, und sie wird aus der WAV neu gerechnet.

   Gelesen wird nur der Anfang des Kopfes - `quelle` steht dort vorn. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ZWISCHEN = new Map();   /* Pfad -> { mtime, quelle } */

function quelleLesen(bin) {
  let st; try { st = fs.statSync(bin); } catch (e) { return null; }
  const z = ZWISCHEN.get(bin);
  if (z && z.mtime === st.mtimeMs) return z.quelle;
  let quelle = null;
  try {
    const fd = fs.openSync(bin, 'r');
    const b = Buffer.alloc(600);
    const n = fs.readSync(fd, b, 0, 600, 4);
    fs.closeSync(fd);
    const m = /"quelle":"([^"]*)"/.exec(b.slice(0, n).toString('utf8'));
    quelle = m ? m[1] : 'audio.wav';   /* aeltere Ablagen ohne Feld: damals nur aus der WAV */
  } catch (e) { quelle = null; }
  ZWISCHEN.set(bin, { mtime: st.mtimeMs, quelle });
  return quelle;
}

/* true, wenn die Ablage aus dem MP3 stammt und inzwischen eine WAV (Sunos oder die eigene) daliegt. */
function veraltet(analyseOrdner, songsOrdner, id) {
  if (quelleLesen(path.join(analyseOrdner, id + '.bin')) !== 'audio.mp3') return false;
  return fs.existsSync(path.join(songsOrdner, id, 'audio.wav')) || fs.existsSync(path.join(songsOrdner, id, 'eigen.wav'));
}

module.exports = { quelleLesen, veraltet };
