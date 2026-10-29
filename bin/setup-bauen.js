#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   DIE SETUP.EXE FUER WINDOWS BAUEN - AUF DEM MAC
   bin/setup-bauen.js

     node bin/setup-bauen.js            → ../KlangTresor-Setup.exe
     node bin/setup-bauen.js --frisch   holt Node neu, statt das zuletzt geholte zu nehmen

   Laeuft am Ende von bin/paket.js mit - jedes Release traegt die Setup.exe (Entscheidung vom 28.10.2026). Braucht
   makensis (brew install makensis) und das fertige ../KlangTresor.zip: dessen Inhalt hat paket.js schon geprueft
   (keine library/, kein Schluessel), darauf baut die Setup.exe auf, statt eine zweite Pruefung zu fuehren.

   Was dazukommt, steht in bin/setup/klangtresor.nsi oben: werkzeug\node und node_modules, beide fuer
   Windows x64. Die Adressen kommen aus quellen.txt - dieselben, von denen die Einrichtung sonst holen wuerde.
   Die KI-Modelle und Whisper holt die Setup.exe beim Nutzer selbst (bin/installieren.js): mitliefern verbieten ihre
   Lizenzen (bin/modelle-holen.js, Kopf).

   onnxruntime-node traegt in seinem npm-Paket die fertigen Dateien fuer alle Systeme (darwin, linux, win32, je x64 und
   arm64; geprueft 28.10.2026 an 1.20.1); sein Installationsskript tut unter Windows nichts (es holt nur unter Linux
   CUDA-Teile). Darum laesst sich node_modules hier auf dem Mac fuer Windows bauen: npm ci ohne Skripte, danach
   bleibt von onnxruntime nur win32/x64 - der Rest waere 120 MB Ballast.

   Die Downloads liegen ausserhalb des Repos in ../_setup-bau/geholt/; der Ordner, wie er beim Nutzer landet, entsteht
   in einem Wegwerfordner auf der Systemplatte (siehe BAU).
   ============================================================= */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const WURZEL = path.join(__dirname, '..');
/* Die Downloads bleiben auf der SSD (../_setup-bau/geholt). Der Inhalt entsteht auf der Systemplatte und wird danach
   geloescht: die SSD ist exFAT, und dort legt macOS zu jeder Datei eine Begleitdatei ._name an - die laegen sonst
   alle in der Setup.exe (so geschehen beim ersten Bau, 28.10.2026). */
const BAU = fs.mkdtempSync(path.join(os.tmpdir(), 'klangtresor-setup-'));
const GEHOLT = path.join(WURZEL, '..', '_setup-bau', 'geholt');
const INHALT = path.join(BAU, 'inhalt');
process.on('exit', () => fs.rmSync(BAU, { recursive: true, force: true }));
const ZIP = path.join(WURZEL, '..', 'KlangTresor.zip');
const AUSGABE = path.join(WURZEL, '..', 'KlangTresor-Setup.exe');
const NSI = path.join(__dirname, 'setup', 'klangtresor.nsi');
const frisch = process.argv.includes('--frisch');
const VERSION = require('../package.json').version;

const sag = (t) => console.log('  ' + t);
function stirb(t) { console.error('\n  ABGEBROCHEN — ' + t + '\n'); process.exit(1); }
function lauf(befehl, args, opt = {}) {
  const r = spawnSync(befehl, args, { stdio: 'inherit', ...opt });
  if (r.status !== 0) stirb(`${befehl} ${args.slice(0, 3).join(' ')} … endete mit ${r.status}`);
}

/* --- Voraussetzungen --- */
if (spawnSync('makensis', ['-VERSION']).status !== 0) stirb('makensis fehlt. Einmal: brew install makensis');
if (!fs.existsSync(ZIP)) stirb('../KlangTresor.zip fehlt — zuerst node bin/paket.js');
const kopf = spawnSync('git', ['log', '-1', '--format=%ct'], { cwd: WURZEL, encoding: 'utf8' }).stdout.trim();
if (fs.statSync(ZIP).mtimeMs / 1000 < Number(kopf)) stirb('../KlangTresor.zip ist älter als der letzte Commit — zuerst node bin/paket.js');

const QUELLEN = {};
for (const z of fs.readFileSync(path.join(WURZEL, 'quellen.txt'), 'utf8').split('\n')) {
  const t = z.trim(); const i = t.indexOf('=');
  if (t && !t.startsWith('#') && i > 0) QUELLEN[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

/* Holen mit Balken (curl), einmal geholt bleibt geholt - ausser --frisch. */
function holen(schluessel) {
  const url = QUELLEN[schluessel];
  if (!url) stirb(`in quellen.txt fehlt '${schluessel}'`);
  fs.mkdirSync(GEHOLT, { recursive: true });
  const datei = path.join(GEHOLT, schluessel + '-' + path.basename(new URL(url).pathname));
  if (fs.existsSync(datei) && !frisch) {
    sag(`${schluessel}: liegt schon da (${(fs.statSync(datei).size / 1048576).toFixed(0)} MB, geholt ${fs.statSync(datei).mtime.toISOString().slice(0, 10)}) — ${url}`);
    return datei;
  }
  sag(`${schluessel}: wird geholt — ${url}`);
  const teil = datei + '.teil';
  lauf('curl', ['-L', '--fail', '--progress-bar', '-o', teil, url]);
  fs.renameSync(teil, datei);
  return datei;
}

/* Entpacken und den einen Ordner darin an seinen Platz heben (node-v22…-win-x64/ → werkzeug/node). */
function einsetzen(zip, ziel) {
  const roh = path.join(BAU, '_roh');
  fs.rmSync(roh, { recursive: true, force: true });
  lauf('unzip', ['-q', zip, '-d', roh]);
  const drin = fs.readdirSync(roh).filter((n) => !n.startsWith('.') && n !== '__MACOSX');
  const quelle = drin.length === 1 && fs.statSync(path.join(roh, drin[0])).isDirectory() ? path.join(roh, drin[0]) : roh;
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  fs.renameSync(quelle, ziel);
  fs.rmSync(roh, { recursive: true, force: true });
}

const groesse = (p) => {
  let n = 0;
  for (const e of fs.readdirSync(p, { withFileTypes: true, recursive: true })) if (e.isFile()) n += fs.statSync(path.join(e.parentPath || e.path, e.name)).size;
  return n;
};
const mb = (b) => (b / 1048576).toFixed(0) + ' MB';

console.log(`\n  KlangTresor-Setup.exe ${VERSION}\n`);

/* 1. Das geprüfte Paket */
fs.rmSync(INHALT, { recursive: true, force: true });
fs.mkdirSync(INHALT, { recursive: true });
lauf('unzip', ['-q', ZIP, '-d', INHALT]);
for (const n of ['library', 'modelle', 'werkzeug', 'node_modules'])
  if (fs.existsSync(path.join(INHALT, n))) stirb(`${n}/ liegt im Paket — gehört nicht hinein`);
sag(`Programm aus KlangTresor.zip: ${mb(groesse(INHALT))}`);

/* 2. Node.js für Windows x64 */
einsetzen(holen('node-windows-x64'), path.join(INHALT, 'werkzeug', 'node'));
if (!fs.existsSync(path.join(INHALT, 'werkzeug', 'node', 'node.exe'))) stirb('node.exe fehlt nach dem Auspacken');
sag(`werkzeug/node: ${mb(groesse(path.join(INHALT, 'werkzeug', 'node')))}`);
/* ffmpeg NICHT: ein GPL-Bau - KlangTresor verteilt es nicht, die Setup.exe holt es beim Nutzer (bin/installieren.js,
   quellen.txt Abschnitt FFMPEG). Bis 29.10.2026 lag es hier drin. */

/* 3. Die Pakete, genau nach package-lock.json */
const NPM = path.join(BAU, '_npm');
fs.rmSync(NPM, { recursive: true, force: true });
fs.mkdirSync(NPM, { recursive: true });
for (const f of ['package.json', 'package-lock.json']) fs.copyFileSync(path.join(INHALT, f), path.join(NPM, f));
sag('Pakete nach package-lock.json (npm ci, ohne Installationsskripte):');
lauf('npm', ['ci', '--ignore-scripts', '--no-fund', '--no-audit', '--omit=dev'], { cwd: NPM });
const ORT = path.join(NPM, 'node_modules', 'onnxruntime-node', 'bin', 'napi-v3');
for (const sys of fs.readdirSync(ORT)) {
  for (const arch of fs.readdirSync(path.join(ORT, sys))) if (!(sys === 'win32' && arch === 'x64')) fs.rmSync(path.join(ORT, sys, arch), { recursive: true, force: true });
  if (!fs.readdirSync(path.join(ORT, sys)).length) fs.rmdirSync(path.join(ORT, sys));
}
for (const f of ['onnxruntime_binding.node', 'onnxruntime.dll'])
  if (!fs.existsSync(path.join(ORT, 'win32', 'x64', f))) stirb(`onnxruntime: win32/x64/${f} fehlt`);
fs.renameSync(path.join(NPM, 'node_modules'), path.join(INHALT, 'node_modules'));
fs.rmSync(NPM, { recursive: true, force: true });
sag(`node_modules (onnxruntime nur win32/x64): ${mb(groesse(path.join(INHALT, 'node_modules')))}`);

/* 4. Was das Entfernen löschen darf: genau die obersten Einträge dieses Inhalts */
const ENTFERNEN = path.join(BAU, 'entfernen.nsh');
const zeilen = fs.readdirSync(INHALT, { withFileTypes: true }).map((e) =>
  e.isDirectory() ? `RMDir /r "$INSTDIR\\${e.name}"` : `Delete "$INSTDIR\\${e.name}"`);
fs.writeFileSync(ENTFERNEN, '; erzeugt von bin/setup-bauen.js\r\n' + zeilen.join('\r\n') + '\r\n');
sag(`Gesamt, ausgepackt: ${mb(groesse(INHALT))}\n`);

/* 4b. Die Liste der KI-Modelle fuer die Seite „Was schon da" - aus bin/modelle-holen.js, derselben Liste, nach der
   bin/installieren.js holt. Nie von Hand abgeschrieben. */
const MODELLE = path.join(BAU, 'modelle.nsh');
{
  const { DATEIEN } = require('./modelle-holen.js');
  const z = DATEIEN.map(([n, , m]) => `  !insertmacro ModellPruefen "${n}" ${m} ${Math.ceil(m / 1048576)}`);
  fs.writeFileSync(MODELLE, `; erzeugt von bin/setup-bauen.js aus bin/modelle-holen.js\r\n!define MODELLE_ANZAHL ${DATEIEN.length}\r\n!macro ModellListe\r\n${z.join('\r\n')}\r\n!macroend\r\n`);
}

/* 5. makensis */
fs.rmSync(AUSGABE, { force: true });
lauf('makensis', ['-V2', '-INPUTCHARSET', 'UTF8', `-DVERSION=${VERSION}`, `-DINHALT=${INHALT}`, `-DAUSGABE=${AUSGABE}`,
  `-DENTFERNEN=${ENTFERNEN}`, `-DMODELLE=${MODELLE}`, NSI],
  /* Ohne UTF-8-Locale liest makensis auf dem Mac das Skript nicht („Bad text encoding" schon an Zeile 1) - auch mit
     -INPUTCHARSET UTF8, auch mit BOM. Aus dem Terminal mit LANG=de_DE.UTF-8 ginge es, aus anderen Aufrufern nicht. */
  { env: { ...process.env, LC_ALL: 'en_US.UTF-8' } });
const summe = crypto.createHash('sha256').update(fs.readFileSync(AUSGABE)).digest('hex');
console.log(`\n  ${path.basename(AUSGABE)} — ${mb(fs.statSync(AUSGABE).size)}`);
console.log(`  SHA-256 ${summe}\n`);
