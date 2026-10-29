#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   DIE MAC-APP BAUEN - KlangTresor.dmg
   bin/dmg-bauen.js

     node bin/dmg-bauen.js            → ../KlangTresor.dmg
     node bin/dmg-bauen.js --frisch   holt Node neu und baut whisper-cli neu

   Laeuft am Ende von bin/paket.js mit (wie setup-bauen.js und appimage-bauen.js). Braucht die Entwicklerwerkzeuge
   von Apple (swiftc, clang) und cmake - beides nur hier beim Bauen, nie beim Nutzer.

   KlangTresor.app/Contents/
     MacOS/KlangTresor        der Starter (bin/mac/KlangTresor.swift), Intel und Apple Silicon in einer Datei
     Resources/programm/      KlangTresor aus dem Zip + node_modules (onnxruntime fuer darwin x64 und arm64)
     Resources/node-x64, node-arm64        Node fuer beide Macs; der Starter nimmt den passenden
     Resources/whisper-x64, whisper-arm64  whisper-cli, hier gebaut (MIT) - bisher baute die Einrichtung es beim
                                           Nutzer und brauchte dafuer Apples Entwicklerwerkzeuge (ein Dialog mehr)
   NICHT darin: ffmpeg (GPL), die KI-Modelle, das Whisper-Modell - die holt die Einrichtung mit Balken.

   Unsigniert (Entscheidung: kein bezahltes Apple-Konto); ad-hoc signiert, damit Apple Silicon die Programme
   ueberhaupt ausfuehrt. Beim ersten Oeffnen verlangt macOS „Dennoch oeffnen" in Systemeinstellungen → Datenschutz &
   Sicherheit - die DMG zeigt das neben der App. Plan: docs/INSTALLER.md.
   ============================================================= */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const WURZEL = path.join(__dirname, '..');
const BAU = fs.mkdtempSync(path.join(os.tmpdir(), 'klangtresor-dmg-'));
process.on('exit', () => fs.rmSync(BAU, { recursive: true, force: true }));
const GEHOLT = path.join(WURZEL, '..', '_setup-bau', 'geholt');
const APP = path.join(BAU, 'dmg', 'KlangTresor.app');
const RES = path.join(APP, 'Contents', 'Resources');
const PROG = path.join(RES, 'programm');
const ZIP = path.join(WURZEL, '..', 'KlangTresor.zip');
const AUSGABE = path.join(WURZEL, '..', 'KlangTresor.dmg');
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

if (process.platform !== 'darwin') stirb('die Mac-App wird auf einem Mac gebaut');
for (const w of ['swiftc', 'cmake', 'hdiutil', 'codesign']) if (spawnSync('which', [w]).status !== 0) stirb(w + ' fehlt');
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
  if (fs.existsSync(datei) && !frisch) { sag(`${name}: liegt schon da (${mb(fs.statSync(datei).size)})`); return datei; }
  sag(`${name}: wird geholt — ${url}`);
  lauf('curl', ['-L', '--fail', '--progress-bar', '-o', datei + '.teil', url]);
  fs.renameSync(datei + '.teil', datei);
  return datei;
}

console.log(`\n  KlangTresor.dmg ${VERSION}\n`);

/* 1. Programm */
fs.mkdirSync(PROG, { recursive: true });
lauf('unzip', ['-q', ZIP, '-d', PROG]);
for (const n of ['library', 'modelle', 'werkzeug', 'node_modules'])
  if (fs.existsSync(path.join(PROG, n))) stirb(`${n}/ liegt im Paket — gehört nicht hinein`);
sag(`Programm: ${mb(groesse(PROG))}`);

/* 2. Node für beide Macs */
for (const a of ['x64', 'arm64']) {
  const url = QUELLEN['node-macos-' + a]; if (!url) stirb(`in quellen.txt fehlt 'node-macos-${a}'`);
  const tgz = holen(`node-macos-${a}-` + path.basename(new URL(url).pathname), url);
  const roh = path.join(BAU, '_node-' + a); fs.mkdirSync(roh, { recursive: true });
  lauf('tar', ['-xzf', tgz, '-C', roh]);
  const drin = fs.readdirSync(roh).filter((n) => !n.startsWith('.'));
  fs.renameSync(path.join(roh, drin[0]), path.join(RES, 'node-' + a));
  for (const n of ['include', 'share']) fs.rmSync(path.join(RES, 'node-' + a, n), { recursive: true, force: true });
  sag(`node-${a}: ${mb(groesse(path.join(RES, 'node-' + a)))}`);
}

/* 3. Pakete; onnxruntime nur darwin */
{
  const NPM = path.join(BAU, '_npm'); fs.mkdirSync(NPM, { recursive: true });
  for (const f of ['package.json', 'package-lock.json']) fs.copyFileSync(path.join(PROG, f), path.join(NPM, f));
  lauf('npm', ['ci', '--ignore-scripts', '--no-fund', '--no-audit', '--omit=dev'], { cwd: NPM });
  const ORT = path.join(NPM, 'node_modules', 'onnxruntime-node', 'bin', 'napi-v3');
  for (const sys of fs.readdirSync(ORT)) if (sys !== 'darwin') fs.rmSync(path.join(ORT, sys), { recursive: true, force: true });
  for (const a of ['x64', 'arm64']) if (!fs.existsSync(path.join(ORT, 'darwin', a, 'onnxruntime_binding.node'))) stirb(`onnxruntime: darwin/${a} fehlt`);
  fs.renameSync(path.join(NPM, 'node_modules'), path.join(PROG, 'node_modules'));
  sag(`node_modules (onnxruntime nur darwin): ${mb(groesse(path.join(PROG, 'node_modules')))}`);
}

/* 4. whisper-cli für beide Macs - einmal gebaut, im Zwischenlager aufgehoben (der Bau dauert Minuten) */
{
  const url = QUELLEN['whisper-quelltext'] || 'https://github.com/ggml-org/whisper.cpp/archive/refs/tags/v1.9.2.tar.gz';
  const fass = (url.match(/v\d+(\.\d+)*/) || ['x'])[0];
  for (const a of ['x64', 'arm64']) {
    const fertig = path.join(GEHOLT, `whisper-cli-macos-${a}-${fass}`);
    if (!fs.existsSync(fertig) || frisch) {
      const tgz = holen(`whisper-quelltext-${fass}.tar.gz`, url);
      const q = path.join(BAU, '_whisper-' + a); fs.mkdirSync(q, { recursive: true });
      lauf('tar', ['-xzf', tgz, '-C', q, '--strip-components', '1']);
      sag(`whisper-cli ${a} wird gebaut …`);
      /* wie bin/whisper-holen.js: ohne geteilte Bibliotheken; Intel ohne Metal (dort brach der Metal-Pfad ab),
         Apple Silicon mit Metal, die Shader eingebettet. GGML_NATIVE aus: nicht fuer DIESE CPU optimieren. */
      lauf('cmake', ['-S', q, '-B', path.join(q, 'b'), '-DCMAKE_BUILD_TYPE=Release', '-DBUILD_SHARED_LIBS=OFF', '-DGGML_NATIVE=OFF',
        '-DWHISPER_BUILD_TESTS=OFF', '-DWHISPER_BUILD_SERVER=OFF', `-DCMAKE_OSX_ARCHITECTURES=${a === 'arm64' ? 'arm64' : 'x86_64'}`,
        '-DCMAKE_OSX_DEPLOYMENT_TARGET=11.0', `-DGGML_METAL=${a === 'arm64' ? 'ON' : 'OFF'}`, '-DGGML_METAL_EMBED_LIBRARY=ON',
        ...(a === 'arm64' ? [] : ['-DGGML_AVX=ON', '-DGGML_AVX2=ON', '-DGGML_FMA=ON', '-DGGML_F16C=ON']), '-Wno-dev'], { stdio: 'ignore' });
      lauf('cmake', ['--build', path.join(q, 'b'), '--config', 'Release', '-j', '8', '--target', 'whisper-cli'], { stdio: 'ignore' });
      fs.copyFileSync(path.join(q, 'b', 'bin', 'whisper-cli'), fertig);
    }
    fs.copyFileSync(fertig, path.join(RES, 'whisper-' + a)); fs.chmodSync(path.join(RES, 'whisper-' + a), 0o755);
    const info = spawnSync('lipo', ['-archs', path.join(RES, 'whisper-' + a)], { encoding: 'utf8' }).stdout.trim();
    sag(`whisper-${a}: ${mb(fs.statSync(fertig).size)} (${info})`);
  }
}

/* 5. Der Starter, Info.plist, Symbol */
{
  const T = path.join(BAU, '_starter'); fs.mkdirSync(T, { recursive: true });
  const quelle = path.join(__dirname, 'mac', 'KlangTresor.swift');
  for (const [a, ziel] of [['x86_64', 'x64'], ['arm64', 'arm64']])
    lauf('swiftc', ['-O', '-target', `${a}-apple-macos11`, '-o', path.join(T, ziel), quelle], { stdio: ['ignore', 'ignore', 'inherit'] });
  fs.mkdirSync(path.join(APP, 'Contents', 'MacOS'), { recursive: true });
  lauf('lipo', ['-create', path.join(T, 'x64'), path.join(T, 'arm64'), '-output', path.join(APP, 'Contents', 'MacOS', 'KlangTresor')]);
  fs.copyFileSync(path.join(WURZEL, 'web', 'symbol', 'klangtresor.icns'), path.join(RES, 'klangtresor.icns'));
  fs.writeFileSync(path.join(APP, 'Contents', 'Info.plist'), `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>KlangTresor</string>
  <key>CFBundleDisplayName</key><string>KlangTresor</string>
  <key>CFBundleIdentifier</key><string>de.klangtresor.app</string>
  <key>CFBundleVersion</key><string>${VERSION}</string>
  <key>CFBundleShortVersionString</key><string>${VERSION}</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleExecutable</key><string>KlangTresor</string>
  <key>CFBundleIconFile</key><string>klangtresor</string>
  <key>LSMinimumSystemVersion</key><string>11.0</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>LSApplicationCategoryType</key><string>public.app-category.music</string>
</dict></plist>
`);
}

/* 6. Ad-hoc signieren (Apple Silicon fuehrt nichts Unsigniertes aus) und die DMG */
lauf('codesign', ['--force', '--deep', '--sign', '-', APP], { stdio: ['ignore', 'ignore', 'inherit'] });
fs.symlinkSync('/Applications', path.join(BAU, 'dmg', 'Programme'));
fs.writeFileSync(path.join(BAU, 'dmg', 'Zuerst lesen - Read me first.txt'), [
  'KlangTresor ' + VERSION,
  '',
  'DEUTSCH',
  '1. KlangTresor auf „Programme" ziehen.',
  '2. KlangTresor in „Programme" öffnen. Beim ersten Mal sagt macOS, es könne die App nicht prüfen (sie ist nicht',
  '   bei Apple registriert). Dann: Apfel-Menü → Systemeinstellungen → Datenschutz & Sicherheit → ganz unten',
  '   „Dennoch öffnen" bei KlangTresor → noch einmal „Öffnen". Das gilt danach dauerhaft.',
  '3. Der Browser geht auf: KlangTresor holt ffmpeg und die KI-Modelle (Fortschrittsbalken) und fragt nach deinem',
  '   Suno-Namen. Danach steht KlangTresor im Dock; Cmd-Q beendet es.',
  '',
  'ENGLISH',
  '1. Drag KlangTresor onto "Applications".',
  '2. Open KlangTresor in "Applications". The first time macOS says it cannot verify the app (it is not registered',
  '   with Apple). Then: Apple menu → System Settings → Privacy & Security → at the bottom "Open Anyway" next to',
  '   KlangTresor → "Open" once more. From then on it just opens.',
  '3. The browser opens: KlangTresor fetches ffmpeg and the AI models (progress bars) and asks for your Suno name.',
  '   After that KlangTresor sits in the Dock; Cmd-Q quits it.',
  ''].join('\n'));
sag(`KlangTresor.app: ${mb(groesse(APP))}`);
fs.rmSync(AUSGABE, { force: true });
lauf('hdiutil', ['create', '-volname', 'KlangTresor', '-srcfolder', path.join(BAU, 'dmg'), '-fs', 'HFS+', '-format', 'UDZO', '-imagekey', 'zlib-level=9', '-quiet', AUSGABE]);
const summe = crypto.createHash('sha256').update(fs.readFileSync(AUSGABE)).digest('hex');
console.log(`\n  ${path.basename(AUSGABE)} — ${mb(fs.statSync(AUSGABE).size)}`);
console.log(`  SHA-256 ${summe}\n`);
