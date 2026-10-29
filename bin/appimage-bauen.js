#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   DAS APPIMAGE FUER LINUX BAUEN - AUF DEM MAC
   bin/appimage-bauen.js

     node bin/appimage-bauen.js            → ../KlangTresor-x86_64.AppImage
     node bin/appimage-bauen.js --frisch   holt Node und das AppImage-Laufzeitprogramm neu

   Laeuft am Ende von bin/paket.js mit, wie bin/setup-bauen.js fuer Windows. Braucht mksquashfs (brew install squashfs)
   und das fertige ../KlangTresor.zip.

   Ein AppImage ist ein kleines Laufzeitprogramm (AppImage/type2-runtime, statisch gebaut - braucht kein libfuse2, das
   Ubuntu 24.04 nicht mehr mitbringt) mit einem angehaengten squashfs. Beides entsteht hier ohne Linux: mksquashfs
   gibt es fuer den Mac, und das Anhaengen ist ein cat. Plan und Entscheidungen: docs/INSTALLER.md.

   Darin, unter programm/: KlangTresor aus dem Zip, werkzeug/node (Linux x64) und node_modules (npm ci ohne Skripte;
   onnxruntime nur linux/x64 - sein Installationsskript holt nur CUDA-Teile, die KlangTresor nicht nutzt). NICHT darin:
   ffmpeg (GPL), die KI-Modelle und Whisper - die holt die Einrichtung beim Nutzer an ihrer Quelle, mit Balken.
   Oben im AppImage: AppRun (bin/linux/AppRun), die .desktop-Datei und das Symbol.
   ============================================================= */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const WURZEL = path.join(__dirname, '..');
/* Gebaut auf der Systemplatte: auf der exFAT-SSD haengt macOS an jede Datei eine ._-Beiakte (siehe setup-bauen.js) */
const BAU = fs.mkdtempSync(path.join(os.tmpdir(), 'klangtresor-appimage-'));
process.on('exit', () => fs.rmSync(BAU, { recursive: true, force: true }));
const GEHOLT = path.join(WURZEL, '..', '_setup-bau', 'geholt');
const APPDIR = path.join(BAU, 'KlangTresor.AppDir');
const PROG = path.join(APPDIR, 'programm');
const ZIP = path.join(WURZEL, '..', 'KlangTresor.zip');
const AUSGABE = path.join(WURZEL, '..', 'KlangTresor-x86_64.AppImage');
const LAUFZEIT = 'https://github.com/AppImage/type2-runtime/releases/download/continuous/runtime-x86_64';
const frisch = process.argv.includes('--frisch');
const VERSION = require('../package.json').version;

const sag = (t) => console.log('  ' + t);
function stirb(t) { console.error('\n  ABGEBROCHEN — ' + t + '\n'); process.exit(1); }
function lauf(befehl, args, opt = {}) {
  const r = spawnSync(befehl, args, { stdio: 'inherit', ...opt });
  if (r.status !== 0) stirb(`${befehl} ${args.slice(0, 3).join(' ')} … endete mit ${r.status}`);
}
const groesse = (p) => { let n = 0; for (const e of fs.readdirSync(p, { withFileTypes: true, recursive: true })) if (e.isFile()) n += fs.statSync(path.join(e.parentPath || e.path, e.name)).size; return n; };
const mb = (b) => (b / 1048576).toFixed(0) + ' MB';

if (spawnSync('mksquashfs', ['-version']).status !== 0) stirb('mksquashfs fehlt. Einmal: brew install squashfs');
if (!fs.existsSync(ZIP)) stirb('../KlangTresor.zip fehlt — zuerst node bin/paket.js');
const kopf = spawnSync('git', ['log', '-1', '--format=%ct'], { cwd: WURZEL, encoding: 'utf8' }).stdout.trim();
if (fs.statSync(ZIP).mtimeMs / 1000 < Number(kopf)) stirb('../KlangTresor.zip ist älter als der letzte Commit — zuerst node bin/paket.js');

const QUELLEN = {};
for (const z of fs.readFileSync(path.join(WURZEL, 'quellen.txt'), 'utf8').split('\n')) {
  const t = z.trim(); const i = t.indexOf('=');
  if (t && !t.startsWith('#') && i > 0) QUELLEN[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}
function holen(name, url) {
  fs.mkdirSync(GEHOLT, { recursive: true });
  const datei = path.join(GEHOLT, name);
  if (fs.existsSync(datei) && !frisch) { sag(`${name}: liegt schon da (${mb(fs.statSync(datei).size)}) — ${url}`); return datei; }
  sag(`${name}: wird geholt — ${url}`);
  lauf('curl', ['-L', '--fail', '--progress-bar', '-o', datei + '.teil', url]);
  fs.renameSync(datei + '.teil', datei);
  return datei;
}

console.log(`\n  KlangTresor-x86_64.AppImage ${VERSION}\n`);

/* 1. Das geprüfte Paket */
fs.mkdirSync(PROG, { recursive: true });
lauf('unzip', ['-q', ZIP, '-d', PROG]);
for (const n of ['library', 'modelle', 'werkzeug', 'node_modules'])
  if (fs.existsSync(path.join(PROG, n))) stirb(`${n}/ liegt im Paket — gehört nicht hinein`);
sag(`Programm aus KlangTresor.zip: ${mb(groesse(PROG))}`);

/* 2. Node.js für Linux x64 */
{
  const url = QUELLEN['node-linux-x64']; if (!url) stirb("in quellen.txt fehlt 'node-linux-x64'");
  const tgz = holen('node-linux-x64-' + path.basename(new URL(url).pathname), url);
  const roh = path.join(BAU, '_node'); fs.mkdirSync(roh, { recursive: true });
  lauf('tar', ['-xzf', tgz, '-C', roh]);
  const drin = fs.readdirSync(roh).filter((n) => !n.startsWith('.'));
  fs.mkdirSync(path.join(PROG, 'werkzeug'), { recursive: true });
  fs.renameSync(path.join(roh, drin[0]), path.join(PROG, 'werkzeug', 'node'));
  /* npm, npx, corepack und die Kopfdateien braucht der Betrieb nicht (Pakete liegen fertig da; npm bleibt fuer
     Updates, die neue Pakete brauchen) - nur include/ und share/ fallen weg */
  for (const n of ['include', 'share']) fs.rmSync(path.join(PROG, 'werkzeug', 'node', n), { recursive: true, force: true });
  if (!fs.existsSync(path.join(PROG, 'werkzeug', 'node', 'bin', 'node'))) stirb('node fehlt nach dem Auspacken');
  sag(`werkzeug/node: ${mb(groesse(path.join(PROG, 'werkzeug', 'node')))}`);
}

/* 3. Die Pakete, genau nach package-lock.json; onnxruntime nur linux/x64 */
{
  const NPM = path.join(BAU, '_npm'); fs.mkdirSync(NPM, { recursive: true });
  for (const f of ['package.json', 'package-lock.json']) fs.copyFileSync(path.join(PROG, f), path.join(NPM, f));
  lauf('npm', ['ci', '--ignore-scripts', '--no-fund', '--no-audit', '--omit=dev'], { cwd: NPM });
  const ORT = path.join(NPM, 'node_modules', 'onnxruntime-node', 'bin', 'napi-v3');
  for (const sys of fs.readdirSync(ORT)) {
    for (const arch of fs.readdirSync(path.join(ORT, sys))) if (!(sys === 'linux' && arch === 'x64')) fs.rmSync(path.join(ORT, sys, arch), { recursive: true, force: true });
    if (!fs.readdirSync(path.join(ORT, sys)).length) fs.rmdirSync(path.join(ORT, sys));
  }
  if (!fs.existsSync(path.join(ORT, 'linux', 'x64', 'onnxruntime_binding.node'))) stirb('onnxruntime: linux/x64/onnxruntime_binding.node fehlt');
  fs.renameSync(path.join(NPM, 'node_modules'), path.join(PROG, 'node_modules'));
  sag(`node_modules (onnxruntime nur linux/x64): ${mb(groesse(path.join(PROG, 'node_modules')))}`);
}

/* 4. Oben im AppImage: AppRun, .desktop, Symbol */
fs.copyFileSync(path.join(WURZEL, 'bin', 'linux', 'AppRun'), path.join(APPDIR, 'AppRun'));
fs.chmodSync(path.join(APPDIR, 'AppRun'), 0o755);
fs.chmodSync(path.join(PROG, 'bin', 'linux', 'klangtresor-symbol.py'), 0o755);
fs.copyFileSync(path.join(WURZEL, 'web', 'symbol', 'klangtresor-256.png'), path.join(APPDIR, 'klangtresor.png'));
fs.copyFileSync(path.join(WURZEL, 'web', 'symbol', 'klangtresor-256.png'), path.join(APPDIR, '.DirIcon'));
fs.writeFileSync(path.join(APPDIR, 'klangtresor.desktop'), ['[Desktop Entry]', 'Type=Application', 'Name=KlangTresor',
  'Comment=Your own Suno archive', 'Exec=AppRun', 'Icon=klangtresor', 'Terminal=false', 'Categories=AudioVideo;Audio;',
  `X-AppImage-Version=${VERSION}`, ''].join('\n'));
sag(`Gesamt, ausgepackt: ${mb(groesse(APPDIR))}`);

/* 5. squashfs + Laufzeitprogramm */
const laufzeit = holen('appimage-runtime-x86_64', LAUFZEIT);
const SQ = path.join(BAU, 'inhalt.squashfs');
lauf('mksquashfs', [APPDIR, SQ, '-root-owned', '-noappend', '-comp', 'zstd', '-quiet', '-processors', '8']);
fs.rmSync(AUSGABE, { force: true });
fs.writeFileSync(AUSGABE, Buffer.concat([fs.readFileSync(laufzeit), fs.readFileSync(SQ)]));
fs.chmodSync(AUSGABE, 0o755);
const summe = crypto.createHash('sha256').update(fs.readFileSync(AUSGABE)).digest('hex');
console.log(`\n  ${path.basename(AUSGABE)} — ${mb(fs.statSync(AUSGABE).size)}`);
console.log(`  SHA-256 ${summe}\n`);
