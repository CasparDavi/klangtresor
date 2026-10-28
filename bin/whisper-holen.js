#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * WHISPER EINRICHTEN — Programm und Modell, ohne Handgriff.
 *   node bin/whisper-holen.js            holen, was fehlt
 *   node bin/whisper-holen.js --still    ohne Rueckfragen (Morgenlauf): kein Apple-Dialog, nur Bericht
 *   node bin/whisper-holen.js --pruefen  nur sagen, was da ist und was fehlt
 *
 * WARUM (Caspar_D, 27.10.2026): Das Feature-Dokument versprach Karaoke-Zeitmarken mit Whisper, die
 * Einrichtung holte Whisper aber nicht - START-HIER.md schickte jeden durch git clone, cmake und zwei
 * Umgebungsvariablen. „wenn die installation funktioniert, muss nichts von hand eingerichtet werden,
 * ansonsten waere das ein installationsfehler". Das war er.
 *
 * WAS GEHOLT WIRD (Adressen in quellen.txt, dort aenderbar):
 *   Programm  whisper.cpp v1.9.2 (MIT, ggml-org)
 *             Windows: das fertige Paket whisper-bin-x64.zip      -> werkzeug/whisper/Release/whisper-cli.exe
 *             Linux:   whisper-bin-ubuntu-x64/arm64.tar.gz        -> werkzeug/whisper/whisper-cli
 *             macOS:   kein fertiges Programm von whisper.cpp - es wird hier gebaut: Quelltext und ein
 *                      tragbares cmake in einen Zwischenordner auf der Systemplatte (auf exFAT haengt macOS
 *                      an jede Datei eine ._-Beiakte, und cmake stolpert ueber das Herkunftsattribut,
 *                      docs/suno/WHISPER.md), gebaut ohne geteilte Bibliotheken, dann nur das fertige
 *                      Programm nach werkzeug/whisper/whisper-cli. Intel ohne Metal (der Metal-Pfad brach
 *                      dort mit GGML_ASSERT ab), Apple Silicon mit Metal. Braucht Apples Entwicklerwerkzeuge;
 *                      fehlen sie, oeffnet macOS seinen eigenen Installationsdialog (ein Klick).
 *   Modell    ggml-large-v3.bin (3,1 GB, MIT, OpenAI-Gewichte im ggml-Format) -> library/modelle/
 *             Im Strom auf die Platte, nicht in den Speicher; bricht die Leitung ab, macht der naechste
 *             Versuch an derselben Stelle weiter (.teil-Datei, HTTP Range).
 * Was schon da ist - auch ein selbst gebautes whisper.cpp an den Orten, die bin/whisper.js kennt -,
 * wird uebersprungen.
 */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const melden = require('./melden.js');
const { T } = require('./sprache.js');

const WURZEL = path.join(__dirname, '..');
const WERKZEUG = path.join(WURZEL, 'werkzeug');
const ZIEL = path.join(WERKZEUG, 'whisper');
const MODELLE = require('./modellordner.js').modellOrdner();   /* bin/modellordner.js - dort liegt auch Whisper */
const args = process.argv.slice(2);
const STILL = args.includes('--still');
const NUR_PRUEFEN = args.includes('--pruefen');
const EXE = process.platform === 'win32' ? '.exe' : '';

/* quellen.txt: name = adresse; fehlt eine Zeile, gilt die eingebaute Adresse. */
const Q = (() => {
  const q = {
    'whisper-windows':     'https://github.com/ggml-org/whisper.cpp/releases/download/v1.9.2/whisper-bin-x64.zip',
    'whisper-linux-x64':   'https://github.com/ggml-org/whisper.cpp/releases/download/v1.9.2/whisper-bin-ubuntu-x64.tar.gz',
    'whisper-linux-arm64': 'https://github.com/ggml-org/whisper.cpp/releases/download/v1.9.2/whisper-bin-ubuntu-arm64.tar.gz',
    'whisper-quelltext':   'https://github.com/ggml-org/whisper.cpp/archive/refs/tags/v1.9.2.tar.gz',
    'cmake-macos':         'https://github.com/Kitware/CMake/releases/download/v3.31.6/cmake-3.31.6-macos-universal.tar.gz',
    'whisper-modell':      'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin',
  };
  try {
    for (const z of fs.readFileSync(path.join(WURZEL, 'quellen.txt'), 'utf8').split('\n')) {
      const m = /^\s*([a-z0-9-]+)\s*=\s*(\S+)/.exec(z.replace(/#.*/, ''));
      if (m && m[1] in q) q[m[1]] = m[2];
    }
  } catch (e) {}
  return q;
})();
const MODELL_NAME = 'ggml-large-v3.bin', MODELL_MIN = 3000000000;   /* 3 095 033 483 Bytes */

/* DIESELBEN ZWEI ORTE WIE bin/whisper.js - dieselbe Funktion (wo()), nicht eine zweite Liste (28.10.2026). */
const istDatei = (p) => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } };
const programmDa = () => require('./whisper.js').wo().programm;
const modellDa = () => require('./whisper.js').wo().modell;

/* Fuer den Tab „System" (bin/system.js): dieselbe Suche wie hier und in bin/whisper.js, ohne etwas zu holen. */
if (require.main !== module) { module.exports = { programmDa, modellDa }; return; }

const sag = (t) => console.log('  ' + t);
const mb = (n) => (n / 1048576).toFixed(0) + ' MB';
function laeuft(befehl, argumente, opt) {
  const r = spawnSync(befehl, argumente, { stdio: STILL ? 'pipe' : 'inherit', encoding: 'utf8', ...opt });
  return r.status === 0;
}

/* LADEN IM STROM, MIT FORTSETZEN. Begrenzt wird der Stillstand (45 s ohne Byte), nicht die Dauer -
   drei Gigabyte duerfen an einer langsamen Leitung ihre Zeit haben. Bis zu acht Anlaeufe; jeder macht
   bei der Groesse der .teil-Datei weiter. */
async function laden(url, ziel, name, mindestens) {
  const teil = ziel + '.teil';
  for (let versuch = 1; versuch <= 8; versuch++) {
    const schon = istDatei(teil) ? fs.statSync(teil).size : 0;
    const steuer = new AbortController(); let stand = Date.now();
    const wacht = setInterval(() => { if (Date.now() - stand > 45000) steuer.abort(); }, 1000);
    try {
      const r = await fetch(url, { redirect: 'follow', signal: steuer.signal, headers: schon ? { Range: `bytes=${schon}-` } : {} });
      if (!(r.ok || r.status === 206)) throw new Error('HTTP ' + r.status);
      const weiter = r.status === 206;
      const ganz = (weiter ? schon : 0) + (Number(r.headers.get('content-length')) || 0);
      const aus = fs.createWriteStream(teil, { flags: weiter ? 'a' : 'w' });
      let n = weiter ? schon : 0, zuletzt = 0;
      for await (const stueck of r.body) {
        stand = Date.now(); n += stueck.length;
        if (!aus.write(stueck)) await new Promise(f => aus.once('drain', f));
        if (Date.now() - zuletzt > 500) {
          zuletzt = Date.now();
          melden.lauf({ was: T('{name} wird geladen', { name }), bytes: n, gesamt: ganz || mindestens, quelle: new URL(url).hostname,
            jetzt: ganz ? T('{teil} von {ganz}', { teil: mb(n), ganz: mb(ganz) }) : mb(n) });
          if (process.stdout.isTTY && !STILL) process.stdout.write(`\r  ${name} … ${mb(n)}${ganz ? ' / ' + mb(ganz) : ''}   `);
        }
      }
      await new Promise((f, w) => aus.end((e) => e ? w(e) : f()));
      if (process.stdout.isTTY && !STILL) process.stdout.write('\n');
      if (fs.statSync(teil).size < mindestens) throw new Error(T('zu klein ({n} Bytes)', { n: fs.statSync(teil).size }));
      fs.renameSync(teil, ziel); melden.ausLauf();
      return true;
    } catch (e) {
      sag(T('Laden unterbrochen ({grund}) — Anlauf {n} von 8, es geht an derselben Stelle weiter.', { grund: e.message, n: versuch }));
      await new Promise(f => setTimeout(f, 2000 * versuch));
    } finally { clearInterval(wacht); }
  }
  melden.ausLauf();
  return false;
}

async function programmWindows() {
  fs.mkdirSync(ZIEL, { recursive: true });
  const zip = path.join(WERKZEUG, 'whisper.zip');
  if (!await laden(Q['whisper-windows'], zip, 'whisper.cpp', 1000000)) return false;
  /* tar liegt Windows 10/11 bei und kann Zip; sonst PowerShell. */
  const ok = laeuft('tar', ['-xf', zip, '-C', ZIEL]) ||
    laeuft('powershell', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${zip}' -DestinationPath '${ZIEL}' -Force`]);
  try { fs.rmSync(zip, { force: true }); } catch (e) {}
  return ok && istDatei(path.join(ZIEL, 'Release', 'whisper-cli.exe'));
}

async function programmLinux() {
  const url = process.arch === 'arm64' ? Q['whisper-linux-arm64'] : Q['whisper-linux-x64'];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kt-whisper-'));
  try {
    const tgz = path.join(tmp, 'whisper.tar.gz');
    if (!await laden(url, tgz, 'whisper.cpp', 1000000)) return false;
    if (!laeuft('tar', ['-xzf', tgz, '-C', tmp])) return false;
    const innen = fs.readdirSync(tmp).map(n => path.join(tmp, n)).find(p => fs.statSync(p).isDirectory());
    if (!innen) return false;
    fs.mkdirSync(ZIEL, { recursive: true });
    for (const n of fs.readdirSync(innen)) fs.cpSync(path.join(innen, n), path.join(ZIEL, n), { recursive: true, verbatimSymlinks: true });
    return istDatei(path.join(ZIEL, 'whisper-cli'));
  } finally { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {} }
}

/* MACOS: Entwicklerwerkzeuge (clang) pruefen, sonst Apples Dialog oeffnen und warten. */
function clangDa() { return spawnSync('xcode-select', ['-p']).status === 0 && spawnSync('clang', ['--version']).status === 0; }
async function entwicklerwerkzeuge() {
  if (clangDa()) return true;
  if (STILL) { sag(T('Für Whisper fehlen auf diesem Mac Apples Entwicklerwerkzeuge — das Einrichten öffnet dafür einmal Apples Installationsdialog.')); return false; }
  sag(T('Für Whisper braucht dieser Mac einmal Apples Entwicklerwerkzeuge. macOS öffnet jetzt seinen Installationsdialog — bitte dort auf „Installieren“ klicken.'));
  spawnSync('xcode-select', ['--install']);
  melden.lauf({ was: T('Warte auf Apples Entwicklerwerkzeuge') });
  for (let i = 0; i < 180; i++) {             /* bis zu 45 Minuten - der Download dort ist gross */
    await new Promise(f => setTimeout(f, 15000));
    if (clangDa()) { melden.ausLauf(); return true; }
  }
  melden.ausLauf();
  sag(T('Die Entwicklerwerkzeuge sind noch nicht da. Sobald die Installation fertig ist, das Einrichten noch einmal starten — es macht hier weiter.'));
  return false;
}

async function programmMac() {
  if (!await entwicklerwerkzeuge()) return false;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kt-whisper-'));
  try {
    let cmake = (() => { const r = spawnSync('which', ['cmake'], { encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : null; })();
    if (!cmake) {
      const tgz = path.join(tmp, 'cmake.tar.gz');
      if (!await laden(Q['cmake-macos'], tgz, 'cmake', 10000000) || !laeuft('tar', ['-xzf', tgz, '-C', tmp])) return false;
      const app = fs.readdirSync(tmp).find(n => /^cmake-.*macos/.test(n) && fs.statSync(path.join(tmp, n)).isDirectory());
      cmake = app && path.join(tmp, app, 'CMake.app', 'Contents', 'bin', 'cmake');
      if (!cmake || !istDatei(cmake)) return false;
    }
    const tgz = path.join(tmp, 'quelltext.tar.gz');
    if (!await laden(Q['whisper-quelltext'], tgz, 'whisper.cpp', 1000000) || !laeuft('tar', ['-xzf', tgz, '-C', tmp])) return false;
    const quelle = fs.readdirSync(tmp).map(n => path.join(tmp, n)).find(p => /whisper\.cpp-/.test(path.basename(p)) && fs.statSync(p).isDirectory());
    if (!quelle) return false;
    const bau = path.join(tmp, 'bau');
    const intel = process.arch !== 'arm64';
    melden.lauf({ was: T('whisper.cpp wird gebaut') });
    sag(T('whisper.cpp wird gebaut — ein paar Minuten, die Lüfter dürfen laufen.'));
    const kerne = String(Math.max(2, Math.floor(os.cpus().length / 2)));
    const ok = laeuft(cmake, ['-S', quelle, '-B', bau, '-DCMAKE_BUILD_TYPE=Release', '-DBUILD_SHARED_LIBS=OFF',
        '-DWHISPER_BUILD_TESTS=OFF', '-DWHISPER_BUILD_SERVER=OFF', '-DWHISPER_SDL2=OFF',
        ...(intel ? ['-DGGML_METAL=OFF'] : ['-DGGML_METAL=ON', '-DGGML_METAL_EMBED_LIBRARY=ON'])])
      && laeuft(cmake, ['--build', bau, '--config', 'Release', '-j', kerne, '--target', 'whisper-cli']);
    melden.ausLauf();
    const fertig = path.join(bau, 'bin', 'whisper-cli');
    if (!ok || !istDatei(fertig)) return false;
    fs.mkdirSync(ZIEL, { recursive: true });
    fs.copyFileSync(fertig, path.join(ZIEL, 'whisper-cli'));
    fs.chmodSync(path.join(ZIEL, 'whisper-cli'), 0o755);
    return true;
  } finally { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {} }
}

/* Laeuft das Programm wirklich? Ein Aufruf mit --help muss mit 0 enden. */
function programmLaeuft(p) {
  const r = spawnSync(p, ['--help'], { encoding: 'utf8', timeout: 20000 });
  return r.status === 0 || /usage/i.test(String(r.stdout) + String(r.stderr));
}

(async () => {
  let prog = programmDa(), modell = modellDa();
  if (NUR_PRUEFEN) {
    sag(T('Whisper-Programm: {wert}', { wert: prog || T('fehlt') }));
    sag(T('Whisper-Modell: {wert}', { wert: modell || T('fehlt') }));
    process.exit(prog && modell ? 0 : 1);
  }
  if (prog) sag(T('Whisper-Programm ist da: {pfad}', { pfad: prog }));
  else {
    sag(T('Whisper-Programm fehlt — wird eingerichtet.'));
    const ok = process.platform === 'win32' ? await programmWindows()
      : process.platform === 'darwin' ? await programmMac()
      : await programmLinux();
    prog = programmDa();
    if (!ok || !prog || !programmLaeuft(prog)) {
      sag(T('Whisper-Programm konnte nicht eingerichtet werden. Ohne Whisper läuft alles — der Liedtext läuft dann mit Sunos eigenen Zeitmarken mit.'));
      melden.zeile('whisper', 'Whisper', T('Programm fehlt'), 'wink');
      process.exitCode = 1;
    } else sag(T('Whisper-Programm eingerichtet: {pfad}', { pfad: prog }));
  }
  if (modell) sag(T('Whisper-Modell ist da: {pfad}', { pfad: modell }));
  else {
    sag(T('Whisper-Modell large-v3 fehlt — wird geladen (3,1 GB).'));
    fs.mkdirSync(MODELLE, { recursive: true });
    const ok = await laden(Q['whisper-modell'], path.join(MODELLE, MODELL_NAME), MODELL_NAME, MODELL_MIN);
    modell = modellDa();
    if (!ok || !modell) {
      sag(T('Whisper-Modell kam nicht an. Der nächste Lauf macht an derselben Stelle weiter.'));
      melden.zeile('whisper', 'Whisper', T('Modell fehlt noch'), 'wink');
      process.exitCode = 1;
    } else sag(T('Whisper-Modell geladen: {pfad}', { pfad: modell }));
  }
  if (prog && modell) melden.zeile('whisper', 'Whisper', T('bereit'), 'fertig');
})().catch(e => { console.error('  ' + T('Whisper einrichten brach ab:'), e.message); process.exit(1); });
