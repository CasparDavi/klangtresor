#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   KLANGTRESOR AKTUALISIEREN
   bin/aktualisieren.js

   Caspar_D hat uns (Tarja, 14.10.2026) die Aufgabe gegeben, fuer
   Updatemoeglichkeiten zu sorgen. Der rote Knopf holt Suno-Daten, nicht
   den Code. Die neue Fassung liegt auf GitHub
   (github.com/CasparDavi/klangtresor), als Release-Zip und als main.

   EINE WAHRHEIT, wie bin/einrichten.js: die drei Anlasser
   (aktualisieren-linux.sh / -macos.command / -windows.cmd) beschaffen
   nur Node und rufen dies hier. Git-Klon, Zip-Installation und Docker
   laufen durch dieselbe Datei.

   WAS ES ANFASST
     · Programmdateien (bin/, server/, web/, docker/, …)
     · bei Docker das Image (compose up --build)
     · bei Bedarf node_modules (npm ci), wenn package-lock sich aenderte

   WAS ES NICHT ANFASST
     · library/  — das Archiv
     · werkzeug/ — mitgebrachtes Node/ffmpeg
     · .git/

   Im Container selbst laeuft es nicht: der Container hat weder Git noch
   den Docker-Socket, und ein Overlay im laufenden Image waere beim
   naechsten Restart weg. Deshalb Abbruch, sobald /.dockerenv da ist.

   Aufruf — im Projektordner (dort liegen bin/ und library/, nicht docker/):
     ./aktualisieren-linux.sh
     node bin/aktualisieren.js              nachsehen und einspielen
     node bin/aktualisieren.js --nur-stand  nur nachsehen, nichts schreiben
     npm run aktualisieren -- --nur-stand   dasselbe, aus jedem Unterordner
     node bin/aktualisieren.js --trotzdem   Zip nochmal, auch bei gleicher Nummer
     node bin/aktualisieren.js --zip        Release-Zip, auch wenn .git da ist

   Stand fuer die Oberflaeche: standHolen() (GET /api/fassung). Die
   Nachfrage an GitHub geht erst, wenn jemand den Knopf drueckt — nicht
   beim Seitenaufbau.
   ============================================================= */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const { spawnSync } = require('node:child_process');

const WURZEL = path.resolve(__dirname, '..');
const UA = 'KlangTresor/1.0 (persoenliches Musikarchiv; github.com/CasparDavi/klangtresor)';
const ZIP_NAME = 'KlangTresor.zip';
const BLEIBT = new Set(['library', 'werkzeug', 'node_modules', '.git', 'proben']);
const NUR_STAND = process.argv.includes('--nur-stand');
const TROTZDEM = process.argv.includes('--trotzdem');
const ZWINGE_ZIP = process.argv.includes('--zip');

const QUELLEN = (() => {
  const aus = {
    zip: 'https://github.com/CasparDavi/klangtresor/releases/latest/download/KlangTresor.zip',
    fassung: 'https://api.github.com/repos/CasparDavi/klangtresor/releases/latest',
  };
  try {
    for (const z of fs.readFileSync(path.join(WURZEL, 'quellen.txt'), 'utf8').split('\n')) {
      const t = z.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i < 1) continue;
      const k = t.slice(0, i).trim(), v = t.slice(i + 1).trim();
      if (k === 'klangtresor-zip') aus.zip = v;
      if (k === 'klangtresor-fassung') aus.fassung = v;
    }
  } catch (e) {}
  return aus;
})();

function paketVersion() {
  try { return JSON.parse(fs.readFileSync(path.join(WURZEL, 'package.json'), 'utf8')).version || null; }
  catch (e) { return null; }
}
function teile(v) {
  return String(v || '').replace(/^v/i, '').split(/[.+-]/).map(x => parseInt(x, 10) || 0);
}
function vergleich(a, b) {
  const A = teile(a), B = teile(b), n = Math.max(A.length, B.length);
  for (let i = 0; i < n; i++) { const d = (A[i] || 0) - (B[i] || 0); if (d) return d; }
  return 0;
}
function imContainer() {
  try { return fs.existsSync('/.dockerenv'); } catch (e) { return false; }
}
function istGit() {
  try { return fs.existsSync(path.join(WURZEL, '.git')); } catch (e) { return false; }
}
function git(args, okAuchFehler) {
  const r = spawnSync('git', args, { cwd: WURZEL, encoding: 'utf8' });
  if (r.status !== 0 && !okAuchFehler) {
    const m = (r.stderr || r.stdout || '').trim().split('\n')[0] || ('git ' + args[0] + ' ' + r.status);
    throw new Error(m);
  }
  return (r.stdout || '').trim();
}
function dockerInspect(fmt) {
  const r = spawnSync('docker', ['inspect', '-f', fmt, 'klangtresor'], { encoding: 'utf8', timeout: 8000 });
  if (r.status !== 0) return null;
  return (r.stdout || '').trim();
}
function dockerDa() {
  return dockerInspect('{{.State.Status}}') != null;
}
function cudaGenutzt() {
  const env = dockerInspect('{{range .Config.Env}}{{println .}}{{end}}') || '';
  return env.split('\n').some(z => z === 'KLANG_CUDA=1');
}

function holenText(url, timeoutMs) {
  return new Promise((fertig, bruch) => {
    const los = (u, tiefe) => {
      if (tiefe > 5) return bruch(new Error('zu viele Umleitungen'));
      const nimm = u.startsWith('https') ? https : http;
      const req = nimm.get(u, { headers: { 'User-Agent': UA, Accept: 'application/json' } }, (a) => {
        if (a.statusCode >= 300 && a.statusCode < 400 && a.headers.location) {
          a.resume();
          return los(new URL(a.headers.location, u).href, tiefe + 1);
        }
        if (a.statusCode !== 200) {
          a.resume();
          return bruch(new Error('GitHub antwortet HTTP ' + a.statusCode));
        }
        const stuecke = [];
        a.on('data', t => stuecke.push(t));
        a.on('end', () => fertig(Buffer.concat(stuecke).toString('utf8')));
      });
      req.on('error', bruch);
      req.setTimeout(timeoutMs || 12000, () => { req.destroy(new Error('keine Antwort von GitHub')); });
    };
    los(url, 0);
  });
}

function holenDatei(url, ziel) {
  return new Promise((fertig, bruch) => {
    fs.mkdirSync(path.dirname(ziel), { recursive: true });
    const los = (u, tiefe) => {
      if (tiefe > 5) return bruch(new Error('zu viele Umleitungen'));
      const nimm = u.startsWith('https') ? https : http;
      const req = nimm.get(u, { headers: { 'User-Agent': UA } }, (a) => {
        if (a.statusCode >= 300 && a.statusCode < 400 && a.headers.location) {
          a.resume();
          return los(new URL(a.headers.location, u).href, tiefe + 1);
        }
        if (a.statusCode !== 200) {
          a.resume();
          return bruch(new Error('Download HTTP ' + a.statusCode));
        }
        const datei = fs.createWriteStream(ziel);
        a.pipe(datei);
        datei.on('finish', () => { datei.close(); fertig(ziel); });
        datei.on('error', bruch);
      });
      req.on('error', bruch);
      req.setTimeout(30000, () => { req.destroy(new Error('Download steht still')); });
    };
    los(url, 0);
  });
}

async function githubRelease() {
  const roh = await holenText(QUELLEN.fassung);
  let d;
  try { d = JSON.parse(roh); } catch (e) { throw new Error('GitHub lieferte kein JSON'); }
  const tag = d.tag_name || d.name || '';
  const version = String(tag).replace(/^v/i, '') || null;
  const zipAsset = Array.isArray(d.assets) ? d.assets.find(a => a && a.name === ZIP_NAME) : null;
  return {
    tag: tag || null,
    version,
    name: d.name || tag || null,
    am: d.published_at || null,
    seite: d.html_url || null,
    zip: (zipAsset && zipAsset.browser_download_url) || QUELLEN.zip,
  };
}

/* Die GitHub-API erlaubt ungefragt 60 Anfragen je Stunde und IP.
   Dreissig Minuten merken reicht: wer den Knopf zweimal drueckt, soll
   dieselbe Auskunft sehen, nicht das Kontingent verbrauchen. */
let standVorrat = null, standVorratBis = 0;

/** Stand fuer CLI und GET /api/fassung. Fragt GitHub, schreibt nichts. */
async function standHolen() {
  const hier = paketVersion();
  const gitDa = istGit();
  const jetzt = Date.now();
  let github = null, grund = null;
  if (standVorrat && jetzt < standVorratBis) github = standVorrat;
  else {
    try {
      github = await githubRelease();
      standVorrat = github;
      standVorratBis = jetzt + 30 * 60 * 1000;
    } catch (e) { grund = e.message || String(e); }
  }
  const ghV = github && github.version;
  return {
    hier,
    github: ghV,
    tag: github && github.tag,
    name: github && github.name,
    am: github && github.am,
    seite: github && github.seite,
    zip: github && github.zip,
    neuer: !!(ghV && hier && vergleich(ghV, hier) > 0),
    git: gitDa,
    docker: dockerDa(),
    container: imContainer(),
    grund,
    geprueftAm: new Date().toISOString(),
  };
}

function auspacken(zip, ziel) {
  fs.mkdirSync(ziel, { recursive: true });
  const w = process.platform === 'win32'
    ? ['powershell', ['-NoProfile', '-Command',
        `$ProgressPreference='SilentlyContinue'; Expand-Archive -LiteralPath ${JSON.stringify(zip)} -DestinationPath ${JSON.stringify(ziel)} -Force`]]
    : process.platform === 'darwin'
      ? ['ditto', ['-x', '-k', zip, ziel]]
      : ['unzip', ['-q', '-o', zip, '-d', ziel]];
  const e = spawnSync(w[0], w[1], { encoding: 'utf8' });
  if (e.status !== 0) throw new Error('Auspacken ging nicht (' + w[0] + ').');
}

function zipUeberlegen(quelle) {
  /* Release-Zip ist flach (kein klangtresor-main/). Ein Branch-Zip hat
     genau einen Ordner — den heben wir, sonst landet der Inhalt eine
     Ebene zu tief und library/ bleibt unangetastet, das Programm aber auch. */
  const namen = fs.readdirSync(quelle).filter(n => n !== '__MACOSX' && n !== '.DS_Store');
  const nur = namen.length === 1 ? path.join(quelle, namen[0]) : quelle;
  const stamm = fs.statSync(nur).isDirectory() ? nur : quelle;
  let n = 0;
  for (const name of fs.readdirSync(stamm)) {
    if (BLEIBT.has(name) || name === '.DS_Store') continue;
    const von = path.join(stamm, name);
    const nach = path.join(WURZEL, name);
    fs.cpSync(von, nach, { recursive: true, force: true, dereference: false });
    n++;
  }
  return n;
}

function npmCiWennNoetig(vorherHash) {
  const lock = path.join(WURZEL, 'package-lock.json');
  let nachher = null;
  try { nachher = fs.readFileSync(lock); } catch (e) { return false; }
  if (vorherHash && vorherHash.equals(nachher)) return false;
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  sag('  Pakete neu setzen (package-lock hat sich geaendert) …');
  const r = spawnSync(npm, ['ci', '--omit=dev'], { cwd: WURZEL, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) throw new Error('npm ci ist gescheitert.');
  return true;
}

function composeBauen() {
  const dateien = ['-f', 'docker/docker-compose.yml'];
  if (cudaGenutzt() && fs.existsSync(path.join(WURZEL, 'docker', 'docker-compose.cuda.yml'))) {
    dateien.push('-f', 'docker/docker-compose.cuda.yml');
    sag('  NVIDIA-Overlay bleibt dabei (KLANG_CUDA).');
  }
  let cmd = 'docker', args = ['compose', ...dateien, 'up', '-d', '--build'];
  const probe = spawnSync('docker', ['compose', 'version'], { encoding: 'utf8' });
  if (probe.status !== 0) {
    cmd = 'docker-compose';
    args = [...dateien, 'up', '-d', '--build'];
  }
  sag('  Container neu bauen — das dauert ein paar Minuten.');
  const r = spawnSync(cmd, args, { cwd: WURZEL, stdio: 'inherit' });
  if (r.status !== 0) throw new Error('Docker-Build ist gescheitert.');
}

function sag(t) { console.log(t); }

function gitZustand() {
  const zweig = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  const schmutz = git(['status', '--porcelain']);
  git(['fetch', 'origin'], true);
  let origin = null;
  try { origin = git(['rev-parse', 'origin/main']); } catch (e) { origin = null; }
  const kopf = git(['rev-parse', 'HEAD']);
  let lage = 'unbekannt';
  if (origin) {
    if (kopf === origin) lage = 'gleich';
    else {
      const basis = git(['merge-base', 'HEAD', 'origin/main']);
      if (basis === kopf) lage = 'dahinter';
      else if (basis === origin) lage = 'davor';
      else lage = 'auseinander';
    }
  }
  return { zweig, schmutz, lage, kopf, origin };
}

async function main() {
  sag('');
  sag('  KlangTresor — neue Fassung einspielen');
  sag('  =====================================');
  sag('');

  if (imContainer()) {
    sag('  Das hier laeuft im Container. Aktualisieren gehoert auf den Rechner,');
    sag('  in den Projektordner (dort liegt library/ daneben):');
    sag('    ./aktualisieren-linux.sh');
    sag('    oder aktualisieren-macos.command / aktualisieren-windows.cmd');
    sag('');
    process.exit(1);
  }
  if (!fs.existsSync(path.join(WURZEL, 'package.json')) || !fs.existsSync(path.join(WURZEL, 'server', 'server.js'))) {
    sag('  Hier liegt kein KlangTresor. Die Datei gehoert in den Ordner');
    sag('  mit server/ und web/, nicht daneben.');
    sag('');
    process.exit(1);
  }

  const stand = await standHolen();
  sag('  Ordner:   ' + WURZEL);
  sag('  Hier:     ' + (stand.hier || '—'));
  sag('  GitHub:   ' + (stand.github ? stand.github + (stand.tag && stand.tag !== stand.github ? '  (' + stand.tag + ')' : '') : (stand.grund || 'keine Antwort')));
  sag('  Weg:      ' + (stand.git && !ZWINGE_ZIP ? 'Git' : 'Release-Zip') + (stand.docker ? ' + Docker' : ''));
  sag('');

  if (NUR_STAND) {
    if (stand.neuer) sag('  Auf GitHub liegt eine neuere Fassung.');
    else if (!stand.github) sag('  Nachsehen ist gescheitert: ' + stand.grund);
    else sag('  Das ist dieselbe Fassung (oder du liegst davor).');
    sag('');
    return;
  }

  if (!stand.github && !stand.git) {
    sag('  Ohne GitHub-Antwort und ohne Git kann ich nichts holen.');
    sag('  ' + (stand.grund || ''));
    sag('');
    process.exit(1);
  }

  const lockVorher = (() => { try { return fs.readFileSync(path.join(WURZEL, 'package-lock.json')); } catch (e) { return null; } })();

  if (stand.git && !ZWINGE_ZIP) {
    const g = gitZustand();
    if (g.schmutz && !TROTZDEM) {
      sag('  Im Ordner liegen ungesicherte Aenderungen. Die fasse ich nicht an.');
      sag('  Erst festlegen oder weglegen, dann noch einmal — oder --trotzdem');
      sag('  (dann bleibt der Schmutz, und git pull kann scheitern).');
      sag('');
      process.exit(1);
    }
    if (g.zweig !== 'main' && g.zweig !== 'master' && !TROTZDEM) {
      sag('  Du bist auf dem Zweig „' + g.zweig + '“. Aktualisieren zieht origin/main.');
      sag('  Wechsle auf main, oder rufe mit --trotzdem auf.');
      sag('');
      process.exit(1);
    }
    if (g.lage === 'auseinander' && !TROTZDEM) {
      sag('  main und origin/main sind auseinandergelaufen. Das loese ich nicht');
      sag('  von allein. git status ansehen, oder --trotzdem (rebase).');
      sag('');
      process.exit(1);
    }
    if (g.lage === 'gleich' && !stand.neuer && !TROTZDEM) {
      sag('  origin/main ist schon da. Nichts zu holen.');
      sag('');
      return;
    }
    if (g.lage === 'davor' && !stand.neuer && !TROTZDEM) {
      sag('  Deine Fassung liegt vor origin/main. Nichts zu holen.');
      sag('');
      return;
    }
    sag('  → git pull --rebase origin main');
    const r = spawnSync('git', ['pull', '--rebase', 'origin', 'main'], { cwd: WURZEL, stdio: 'inherit' });
    if (r.status !== 0) {
      sag('');
      sag('  git pull ist gescheitert. Der Arbeitsbaum bleibt, wie er war.');
      process.exit(1);
    }
  } else {
    if (!stand.neuer && !TROTZDEM) {
      sag('  Release und lokale Nummer sind gleich. Nichts zu holen.');
      sag('  (Erneut einspielen: --trotzdem)');
      sag('');
      return;
    }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'klangtresor-update-'));
    const zip = path.join(tmp, ZIP_NAME);
    const entpackt = path.join(tmp, 'aus');
    try {
      sag('  → hole ' + ZIP_NAME);
      await holenDatei(stand.zip || QUELLEN.zip, zip);
      sag('  → packe ueber die Programmdaten (library/ bleibt)');
      auspacken(zip, entpackt);
      const n = zipUeberlegen(entpackt);
      sag('  ' + n + ' Eintraege erneuert.');
    } finally {
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {}
    }
  }

  if (stand.docker) {
    composeBauen();
    sag('');
    sag('  Fertig. Die Seite einmal hart neu laden (Bilder und Skripte sonst aus dem Vorrat).');
    sag('  Adresse:  http://localhost:8788');
  } else {
    try { npmCiWennNoetig(lockVorher); } catch (e) {
      sag('  ' + e.message);
      sag('  Das Programm liegt, die Pakete musst du von Hand setzen: npm ci');
    }
    sag('');
    sag('  Fertig. Den laufenden Server einmal neu starten:');
    sag('    ./starten-linux.sh   oder starten-macos.command / starten-windows.cmd');
    sag('  Danach die Seite hart neu laden.');
  }
  sag('');
}

module.exports = { standHolen, paketVersion, vergleich };

if (require.main === module) {
  main().catch(e => {
    console.error('\n  ' + (e && e.message ? e.message : e) + '\n');
    process.exit(1);
  });
}
