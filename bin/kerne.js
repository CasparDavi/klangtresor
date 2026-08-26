/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Wieviele Arbeiter parallel? Eine Quelle fuer alle Laeufe.
 *
 * Caspar_D, 26.08.2026: "messe, wieviele Kerne da sind und passe die
 * Parallelisierung entsprechend an."
 *
 * Gefragt sind die PHYSISCHEN Kerne, nicht die logischen. Die Laeufe des
 * Hauses sind rechengebunden - FFT, Goertzel, Histogramme lasten eine
 * Kernpipeline voll aus, und zwei Faeden auf demselben Kern teilen sich
 * dann dieselben Recheneinheiten, statt doppelt so schnell zu sein. Nur
 * der ffmpeg-Anteil profitiert von Hyperthreading, und der ist zu klein,
 * um den Ausschlag zu geben.
 *
 * NACHGEMESSEN am 26.08.2026 auf diesem Rechner (8 physische, 16
 * logische Kerne):
 *
 *   Stoerfrequenz-Detektor, 16 Songs      vorrechnen.js, 12 Songs
 *     1 Arbeiter   49 s                     6 Arbeiter   99 s
 *     4 Arbeiter   16 s                     8 Arbeiter   92 s   <-
 *     8 Arbeiter   11 s   <-               10 Arbeiter   94 s
 *    12 Arbeiter   13 s
 *    16 Arbeiter   11 s
 *
 * Ueber die physischen Kerne hinaus bringt es nichts; darunter bleibt
 * Zeit liegen. vorrechnen.js hatte bis dahin einen festen Deckel von 6
 * und verschenkte damit drei Minuten je vollem Lauf.
 *
 * Auf macOS sagt sysctl die physischen Kerne. Wo es das nicht gibt, ist
 * die Haelfte der logischen die uebliche Annahme (SMT mit zwei Faeden je
 * Kern). Einer bleibt frei, damit Server und Oberflaeche waehrend eines
 * langen Laufs atmen koennen.
 */
'use strict';
const os = require('node:os');
const { spawnSync } = require('node:child_process');

let _gemerkt = 0;
function arbeiterZahl() {
  if (_gemerkt) return _gemerkt;
  const logisch = os.availableParallelism ? os.availableParallelism() : os.cpus().length;
  let physisch = 0;
  if (process.platform === 'darwin') {
    const r = spawnSync('sysctl', ['-n', 'hw.physicalcpu'], { encoding: 'utf8' });
    if (r.status === 0) physisch = parseInt(String(r.stdout).trim(), 10) || 0;
  }
  if (!physisch) physisch = Math.max(1, Math.round(logisch / 2));
  return (_gemerkt = Math.max(1, Math.min(physisch, logisch - 1)));
}

module.exports = { arbeiterZahl };
