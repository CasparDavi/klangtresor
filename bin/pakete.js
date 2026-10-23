#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   SIND ALLE PAKETE DA? - UND WENN NICHT, NUR DIE FEHLENDEN HOLEN
   bin/pakete.js

   Gemeldet von Lutz (Discord, 23.10.2026, Windows 11): „umap-js fehlte in
   node_modules - Klangraum und Geschichten-Raum neu zeichnen brachen jeden
   Morgen mit Cannot find module 'umap-js' ab." Das Paket stand im
   package-lock, aber:
     - einrichten.js sah nur nach onnxruntime-node und hielt damit alle
       Pakete fuer da,
     - aktualisieren.js setzt die Pakete nur neu, wenn sich package-lock
       geaendert hat - eine einmal unvollstaendige Installation blieb es
       fuer immer.
   Und: ein volles `npm install` scheiterte bei ihm still am
   Installationsskript von onnxruntime-node und rollte dann ALLES zurueck.
   Darum holt nachholen() nur, was fehlt, in genau der Fassung aus
   package-lock.json - und ohne Installationsskripte, wo keines noetig ist
   (nur onnxruntime-node hat eines).

   Geprueft wird jede Abhaengigkeit aus package.json: liegt ihr Ordner mit
   package.json und der Datei, auf die "main" zeigt?

   Von Hand:  node bin/pakete.js          sagt, was fehlt
              node bin/pakete.js --tun    holt es
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const WURZEL = path.resolve(__dirname, '..');
/* NODE IN DEN SUCHPFAD (23.10.2026, im Windows-11-Test gefunden): npm fuehrt Installationsskripte ueber
   cmd.exe aus - bei onnxruntime-node `node ./script/install`. Kommt Node nur aus werkzeug\node und steht nicht
   im PATH, findet cmd.exe kein `node`, das Skript scheitert, und npm rollt ALLE Pakete zurueck (Lutz' fehlendes
   umap-js). Also den Ordner des laufenden Node vorn in den PATH - fuer uns und alle Kinder. */
process.env.PATH = path.dirname(process.execPath) + path.delimiter + (process.env.PATH || '');

function lesen(datei) { try { return JSON.parse(fs.readFileSync(path.join(WURZEL, datei), 'utf8')); } catch (e) { return null; } }

/* Die Namen der Pakete, die fehlen oder unvollstaendig sind. */
function fehlende() {
  const pj = lesen('package.json') || {};
  const aus = [];
  for (const name of Object.keys(pj.dependencies || {})) {
    const ordner = path.join(WURZEL, 'node_modules', name);
    let p = null;
    try { p = JSON.parse(fs.readFileSync(path.join(ordner, 'package.json'), 'utf8')); } catch (e) {}
    if (!p) { aus.push(name); continue; }
    const haupt = p.main ? path.join(ordner, p.main) : path.join(ordner, 'index.js');
    if (!fs.existsSync(haupt) && !fs.existsSync(haupt + '.js') && !fs.existsSync(path.join(haupt, 'index.js'))) aus.push(name);
  }
  return aus;
}

/* npm neben dem laufenden Node - wie npmAufruf in einrichten.js und aktualisieren.js:
   kommt Node aus werkzeug/, steht npm nicht im PATH. */
function npmAufruf() {
  const nd = path.dirname(process.execPath);
  for (const k of [path.join(nd, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
                   path.join(nd, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js')]) {
    if (fs.existsSync(k)) return { befehl: process.execPath, vorn: ['--no-warnings', k], schale: false };
  }
  return { befehl: process.platform === 'win32' ? 'npm.cmd' : 'npm', vorn: [], schale: process.platform === 'win32' };
}

/* Holt die fehlenden Pakete in der Fassung aus package-lock.json. Gibt die
   Liste zurueck, die danach NOCH fehlt (leer = alles gut). sag: Ausgabe. */
function nachholen(sag = (t) => console.log(t)) {
  const fehlt = fehlende();
  if (!fehlt.length) return [];
  const lock = lesen('package-lock.json') || {};
  const pakete = lock.packages || {};
  const fassung = (n) => { const e = pakete['node_modules/' + n]; return e && e.version ? n + '@' + e.version : n; };
  const mitSkript = fehlt.filter((n) => (pakete['node_modules/' + n] || {}).hasInstallScript);
  const ohneSkript = fehlt.filter((n) => !mitSkript.includes(n));
  const npm = npmAufruf();
  const lauf = (namen, extra) => {
    if (!namen.length) return;
    sag(`  Pakete nachholen: ${namen.join(', ')} …`);
    spawnSync(npm.befehl, npm.vorn.concat(['install', '--no-save', '--no-fund', '--no-audit', ...extra, ...namen.map(fassung)]),
      { cwd: WURZEL, stdio: 'inherit', shell: npm.schale });
  };
  /* Erst die ohne Skript - die koennen nicht an einem fremden Skript scheitern. */
  lauf(ohneSkript, ['--ignore-scripts']);
  lauf(mitSkript, []);
  return fehlende();
}

/* Fuer Programme, die ein Paket brauchen (karte.js): fehlt es, wird es
   geholt; klappt das nicht, gibt es eine Meldung mit Ausweg statt eines
   Stapelabzugs. */
function brauche(name) {
  if (!fehlende().includes(name)) return true;
  console.log(`  Das Paket ${name} fehlt in node_modules — ich hole es nach.`);
  const rest = nachholen();
  if (!rest.includes(name)) return true;
  console.log(`  ${name} liess sich nicht holen. Ausweg: im KlangTresor-Ordner aktualisieren-* doppelklicken`);
  console.log('  oder in einem Terminal dort: node bin/pakete.js --tun');
  return false;
}

module.exports = { fehlende, nachholen, brauche };

if (require.main === module) {
  const fehlt = fehlende();
  if (!fehlt.length) { console.log('  Alle Pakete sind da.'); process.exit(0); }
  console.log('  Es fehlen: ' + fehlt.join(', '));
  if (!process.argv.includes('--tun')) { console.log('  Holen: node bin/pakete.js --tun'); process.exit(1); }
  const rest = nachholen();
  if (rest.length) { console.log('  Noch immer fehlen: ' + rest.join(', ') + '. Oft blockiert ein Firmennetz oder Virenschutz registry.npmjs.org.'); process.exit(1); }
  console.log('  Alle Pakete sind jetzt da.');
}
