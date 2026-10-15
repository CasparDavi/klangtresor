#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   KLANGTRESOR AKTUALISIEREN
   bin/aktualisieren.js

   Caspar_D hat uns (Tarja, 14.10.2026) die Aufgabe gegeben, fuer
   Updatemoeglichkeiten zu sorgen. Der rote Knopf holt Suno-Daten, nicht
   den Code. Die neue Version liegt auf GitHub
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
     node bin/aktualisieren.js --ohne-docker  Docker nicht fragen (KlangTresor laeuft ohne Container)
   --trotzdem gilt auch, wenn neben dem Programm kein library/ liegt (frischer Klon).

   Stand fuer die Oberflaeche: standHolen() (GET /api/fassung). Die Seite
   fragt von selbst beim Oeffnen und danach alle 12 h (nach einem
   Fehlschlag nach 2 h), dazu jedes Mal, wenn das Fenster „KlangTresor“
   aufgeht; die Glocke oben zeigt eine neue Version an. Einen Knopf zum
   Nachsehen gibt es seit dem 15.10.2026 nicht mehr (Caspar_D: „aber er
   hat doch schon eine gefunden, warum steht dieser Text hier“). Eine
   Antwort von GitHub haelt standHolen() 30 min vor und nennt mit gefragtAm,
   wann sie wirklich geholt wurde. Der eingefrorene Stick fragt nie
   (server.js sperrt /api/fassung dort).
   ============================================================= */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const { spawnSync } = require('node:child_process');
const { pipeline } = require('node:stream');

const WURZEL = path.resolve(__dirname, '..');
const UA = 'KlangTresor/1.0 (persoenliches Musikarchiv; github.com/CasparDavi/klangtresor)';
const ZIP_NAME = 'KlangTresor.zip';
const BLEIBT = new Set(['library', 'werkzeug', 'node_modules', '.git', 'proben']);
const NUR_STAND = process.argv.includes('--nur-stand');
const TROTZDEM = process.argv.includes('--trotzdem');
const ZWINGE_ZIP = process.argv.includes('--zip');
const OHNE_DOCKER = process.argv.includes('--ohne-docker');

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
/* DOCKER WIRD AM ORDNER ERKANNT, NICHT AM NAMEN (Pruefung bei der Uebernahme, 15.10.2026). Ein Container „klangtresor"
   kann zu einer anderen Installation gehoeren; umgebaut wird nur, wenn er zu DIESEM Ordner gehoert - das sagt compose
   im Label working_dir (der Ordner docker/ auf dem Rechner, so wie die Kommandozeile ihn kennt), sonst die Quelle des
   eingehaengten /app/library. Und: ein gestoppter Docker-Dienst ist nicht „kein Docker". Antwortet der Dienst nicht,
   laesst sich nicht klaeren, ob hier ein Container laeuft - dann wird nicht einfach als Ordner-Installation
   weitergemacht (der Container bliebe alt, und der naechste Lauf saehe „nichts zu holen"). */
function dockerLauf(args, ms) {
  return spawnSync('docker', args, { encoding: 'utf8', timeout: ms || 8000 });
}
function gleicherOrdner(a, b) {
  if (!a || !b) return false;
  const n = (p) => path.resolve(p).replace(/[\\/]+$/, '');
  return process.platform === 'win32' ? n(a).toLowerCase() === n(b).toLowerCase() : n(a) === n(b);
}
/** { art: 'keins' | 'unseres' | 'fremd' | 'unerreichbar', status } */
function dockerZustand() {
  const r = dockerLauf(['inspect', '-f',
    '{{.State.Status}}|{{index .Config.Labels "com.docker.compose.project.working_dir"}}|{{range .Mounts}}{{if eq .Destination "/app/library"}}{{.Source}}{{end}}{{end}}',
    'klangtresor']);
  if (r.error && r.error.code === 'ENOENT') return { art: 'keins' };            /* kein docker auf diesem Rechner */
  if (r.status === 0) {
    const [status, ordner, quelle] = (r.stdout || '').trim().split('|');
    const unser = gleicherOrdner(ordner, path.join(WURZEL, 'docker')) || gleicherOrdner(quelle, path.join(WURZEL, 'library'));
    return { art: unser ? 'unseres' : 'fremd', status: status || null };
  }
  /* inspect scheiterte: kein Container dieses Namens - oder der Dienst antwortet nicht */
  const info = dockerLauf(['info', '--format', '{{.ServerVersion}}']);
  if (info.status !== 0 && fs.existsSync(path.join(WURZEL, 'docker', 'docker-compose.yml'))) return { art: 'unerreichbar' };
  return { art: 'keins' };
}
/* Welche Fassung im laufenden Container steckt - der Container wird aus dem Ordner gebaut, also kann er hinter dem
   Ordner zurueckliegen (ein gescheiterter oder ausgelassener Neubau). null, wenn man nicht fragen kann. */
function containerFassung() {
  const r = dockerLauf(['exec', 'klangtresor', 'node', '-p', "require('/app/package.json').version"]);
  return r.status === 0 ? (r.stdout || '').trim() || null : null;
}
function cudaGenutzt() {
  const r = dockerLauf(['inspect', '-f', '{{range .Config.Env}}{{println .}}{{end}}', 'klangtresor']);
  return r.status === 0 && (r.stdout || '').split('\n').some(z => z === 'KLANG_CUDA=1');
}

/* ZEITGRENZEN UND ABBRUECHE (Pruefung bei der Uebernahme): die Grenze gilt schon VOR dem Verbinden (Option timeout -
   req.setTimeout griff erst am offenen Socket, ein haengender Verbindungsaufbau lief bis zu zwei Minuten), und ein
   Strom, der mittendrin endet, ist ein Fehler und kein Erfolg (vorher endete ein abgebrochener Download stumm mit
   Exit 0, und der Server blieb auf /api/fassung ohne Antwort). Beim Download zaehlt zusaetzlich Content-Length. */
function anfrage(url, kopf, timeoutMs, antwort, bruch) {
  const los = (u, tiefe) => {
    if (tiefe > 5) return bruch(new Error('zu viele Umleitungen'));
    const nimm = u.startsWith('https') ? https : http;
    const req = nimm.get(u, { headers: kopf, timeout: timeoutMs }, (a) => {
      if (a.statusCode >= 300 && a.statusCode < 400 && a.headers.location) {
        a.resume();
        return los(new URL(a.headers.location, u).href, tiefe + 1);
      }
      if (a.statusCode !== 200) {
        a.resume();
        return bruch(new Error((u.includes('api.github.com') ? 'GitHub antwortet HTTP ' : 'Download HTTP ') + a.statusCode));
      }
      antwort(a);
    });
    req.on('timeout', () => req.destroy(new Error(u.includes('api.github.com') ? 'keine Antwort von GitHub' : 'Download steht still')));
    req.on('error', bruch);
  };
  los(url, 0);
}
function holenText(url, timeoutMs) {
  return new Promise((fertig, bruch) => {
    anfrage(url, { 'User-Agent': UA, Accept: 'application/json' }, timeoutMs || 12000, (a) => {
      const stuecke = [];
      a.on('data', t => stuecke.push(t));
      a.on('aborted', () => bruch(new Error('GitHub brach die Antwort ab')));
      a.on('error', bruch);
      a.on('end', () => { if (a.complete) fertig(Buffer.concat(stuecke).toString('utf8')); else bruch(new Error('GitHub brach die Antwort ab')); });
    }, bruch);
  });
}

function holenDatei(url, ziel) {
  return new Promise((fertig, bruch) => {
    fs.mkdirSync(path.dirname(ziel), { recursive: true });
    anfrage(url, { 'User-Agent': UA }, 30000, (a) => {
      const soll = Number(a.headers['content-length']) || 0;
      let ist = 0;
      a.on('data', t => { ist += t.length; });
      pipeline(a, fs.createWriteStream(ziel), (fehler) => {
        if (fehler) return bruch(new Error('Download abgebrochen: ' + (fehler.message || fehler)));
        if (!a.complete || (soll && ist !== soll)) return bruch(new Error('Download unvollstaendig (' + ist + ' von ' + (soll || '?') + ' Bytes)'));
        fertig(ziel);
      });
    }, bruch);
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
   Dreissig Minuten merken reicht: jede offene Seite fragt beim Oeffnen
   und danach alle 12 h von selbst, dazu kommt der Knopf - Neuladen
   und ein zweiter Knopfdruck sollen dieselbe Auskunft sehen, nicht das
   Kontingent verbrauchen. Gebuendelt wird nicht: Tabs, die im selben
   Augenblick oeffnen, fragen GitHub je einmal (gemessen 15.10.2026: drei
   gleichzeitige Anfragen, drei Verbindungen). Gemerkt wird nur eine
   Antwort; nach einem Fehlschlag fragt die Seite in 2 h wieder. */
let standVorrat = null, standVorratBis = 0, standVorratAm = 0;

/** Stand fuer CLI und GET /api/fassung. Fragt GitHub, schreibt nichts.
    mitDocker: false fuer den Server (Caspar_D, 15.10.2026, bei der Uebernahme): dockerZustand() laeuft synchron
    (spawnSync, bis 8 s) - im Request-Handler stuende so lange der ganze Server still, auch die Musik. Die Seite
    braucht docker nicht (sie zeigt nur container, und das ist ein Dateitest); das Skript auf dem Rechner fragt weiter. */
async function standHolen({ mitDocker = true } = {}) {
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
      standVorratAm = jetzt;
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
    /* lage: 1 = GitHub ist neuer, 0 = gleich, -1 = hier ist neuer (die Oberflaeche sagte sonst „dieselbe Fassung"
       zu 1.0.72 gegen 1.0.71), null = eine Nummer fehlt */
    lage: ghV && hier ? Math.sign(vergleich(ghV, hier)) : null,
    git: gitDa,
    docker: mitDocker ? dockerZustand() : null,
    container: imContainer(),
    grund,
    geprueftAm: new Date().toISOString(),
    /* WANN GITHUB WIRKLICH GEFRAGT WURDE (Caspar_D, 15.10.2026: „Zuletzt nachgesehen: heute, 13:05“). geprueftAm ist
       der Augenblick dieser Antwort; kommt sie aus dem Vorrat, ist die Auskunft bis zu 30 min alt - das Fenster
       nennt darum diese Zeit. Ohne Nummer von GitHub: der eben gescheiterte Versuch. */
    gefragtAm: new Date(github ? standVorratAm : jetzt).toISOString(),
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

/* npm NEBEN DEM LAUFENDEN NODE (wie npmAufruf in einrichten.js): kommt Node aus werkzeug/, steht npm nicht im PATH -
   das blosse `npm` scheiterte dort, und ein geaenderter package-lock wurde nie nachgezogen. */
function npmAufruf() {
  const nd = path.dirname(process.execPath);
  for (const k of [path.join(nd, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
                   path.join(nd, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js')]) {
    if (fs.existsSync(k)) return { befehl: process.execPath, vorn: ['--no-warnings', k], schale: false };
  }
  return { befehl: process.platform === 'win32' ? 'npm.cmd' : 'npm', vorn: [], schale: process.platform === 'win32' };
}
function npmCiWennNoetig(vorherHash) {
  const lock = path.join(WURZEL, 'package-lock.json');
  let nachher = null;
  try { nachher = fs.readFileSync(lock); } catch (e) { return false; }
  if (vorherHash && vorherHash.equals(nachher)) return false;
  const n = npmAufruf();
  sag('  Pakete neu setzen (package-lock hat sich geaendert) …');
  const r = spawnSync(n.befehl, [...n.vorn, 'ci', '--omit=dev'], { cwd: WURZEL, stdio: 'inherit', shell: n.schale });
  if (r.status !== 0) throw new Error('npm ci ist gescheitert.');
  return true;
}

function composeBauen(laeuft) {
  const dateien = ['-f', 'docker/docker-compose.yml'];
  if (cudaGenutzt() && fs.existsSync(path.join(WURZEL, 'docker', 'docker-compose.cuda.yml'))) {
    dateien.push('-f', 'docker/docker-compose.cuda.yml');
    sag('  NVIDIA-Overlay bleibt dabei (KLANG_CUDA).');
  }
  /* War der Container angehalten, bleibt er es: neu gebaut und angelegt, aber nicht gestartet (--no-start). */
  const hoch = laeuft ? ['up', '-d', '--build'] : ['up', '--no-start', '--build'];
  let cmd = 'docker', args = ['compose', ...dateien, ...hoch];
  const probe = spawnSync('docker', ['compose', 'version'], { encoding: 'utf8' });
  if (probe.status !== 0) {
    cmd = 'docker-compose';
    args = [...dateien, ...hoch];
  }
  sag('  Container neu bauen — das dauert ein paar Minuten.' + (laeuft ? '' : ' Er war angehalten und bleibt es.'));
  const r = spawnSync(cmd, args, { cwd: WURZEL, stdio: 'inherit' });
  if (r.status !== 0) throw new Error('Docker-Build ist gescheitert.');
}

function sag(t) { console.log(t); }

function gitZustand() {
  const zweig = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  /* nur VERFOLGTE Aenderungen zaehlen: werkzeug/ (von einrichten-* angelegt) und andere ungetrackte Ordner haelt git pull
     nicht auf - vorher brach jede eingerichtete Installation hier ab */
  const schmutz = git(['status', '--porcelain', '--untracked-files=no']);
  /* ein gescheitertes fetch ist „Stand unbekannt", nicht „nichts zu holen" (Pruefung bei der Uebernahme) */
  const geholt = spawnSync('git', ['fetch', 'origin'], { cwd: WURZEL, encoding: 'utf8' });
  if (geholt.status !== 0) return { zweig, schmutz, lage: 'unerreichbar', grund: ((geholt.stderr || '').trim().split('\n')[0] || 'git fetch scheiterte') };
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
  sag('  KlangTresor — Update einspielen');
  sag('  ===============================');
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
  /* DER RICHTIGE ORDNER (Pruefung bei der Uebernahme): wer ein neues Zip auspackt und darin aktualisieren-* startet,
     spielt in den Entpackordner ein statt in seine Installation - dort liegt kein library/. */
  if (!NUR_STAND && !fs.existsSync(path.join(WURZEL, 'library')) && !TROTZDEM) {
    sag('  Neben diesem Programm liegt kein library/ – das ist wohl nicht deine');
    sag('  Installation, sondern ein frisch ausgepacktes Zip. Starte das Skript im');
    sag('  Ordner, in dem dein KlangTresor laeuft (dort liegt library/).');
    sag('  Wirklich hier einspielen: --trotzdem');
    sag('');
    process.exit(1);
  }

  const stand = await standHolen();
  const dz = stand.docker || { art: 'keins' };
  if (dz.art === 'unerreichbar' && !OHNE_DOCKER && !NUR_STAND) {
    sag('  Docker antwortet nicht. Ob dein KlangTresor im Container laeuft, laesst');
    sag('  sich so nicht klaeren – und ohne Neubau bliebe ein Container alt.');
    sag('  Starte Docker (Docker Desktop) und rufe noch einmal auf.');
    sag('  Laeuft dein KlangTresor ohne Docker: --ohne-docker');
    sag('');
    process.exit(1);
  }
  const mitDocker = dz.art === 'unseres' && !OHNE_DOCKER;
  /* „laeuft" heisst: soll laufen - auch im Neustart-Kreislauf oder pausiert. Nur ein angehaltener (exited/created)
     Container bleibt nach dem Neubau angehalten (Pruefung bei der Uebernahme: 'restarting' war danach aus). */
  const laeuft = mitDocker && ['running', 'restarting', 'paused'].includes(dz.status);
  sag('  Ordner:   ' + WURZEL);
  sag('  Hier:     ' + (stand.hier || '—'));
  sag('  GitHub:   ' + (stand.github ? stand.github + (stand.tag && stand.tag !== stand.github ? '  (' + stand.tag + ')' : '') : (stand.grund || 'keine Antwort')));
  sag('  Weg:      ' + (stand.git && !ZWINGE_ZIP ? 'Git' : 'Release-Zip') + (mitDocker ? ' + Docker' + (laeuft ? '' : ' (Container angehalten)') : ''));
  if (dz.art === 'fremd') sag('  Hinweis:  der Container „klangtresor" gehoert zu einem anderen Ordner – er bleibt unberuehrt.');
  if (dz.art === 'unerreichbar' && !OHNE_DOCKER) sag('  Hinweis:  Docker antwortet nicht – einspielen ginge so nicht (Docker starten oder --ohne-docker).');
  sag('');

  if (NUR_STAND) {
    if (stand.lage === 1) sag('  Auf GitHub liegt eine neuere Version.');
    else if (!stand.github) sag('  Nachsehen ist gescheitert: ' + stand.grund);
    else if (stand.lage === -1) sag('  Deine Version ist neuer als die neueste auf GitHub.');
    else sag('  Das ist die neueste Version.');
    sag('');
    return;
  }

  if (!stand.github && !stand.git) {
    sag('  Ohne GitHub-Antwort und ohne Git kann ich nichts holen.');
    sag('  ' + (stand.grund || ''));
    sag('');
    process.exit(1);
  }

  /* DER CONTAINER KANN HINTER DEM ORDNER LIEGEN (Pruefung bei der Uebernahme): ist ein Neubau gescheitert oder
     ausgelassen worden, sagt der Ordner „nichts zu holen", der Container laeuft aber alt weiter. Darum fragt der
     Docker-Weg den laufenden Container nach seiner Nummer und baut nach, wenn sie nicht stimmt. */
  const containerAlt = () => {                     /* die Nummer im laufenden Container, wenn sie nicht stimmt; sonst null */
    if (!laeuft) return null;
    const c = containerFassung();
    return c && stand.hier && c !== stand.hier ? c : null;
  };
  const nichtsZuHolen = (satz) => {
    const alt = mitDocker ? containerAlt() : null;
    if (alt) { sag('  Die Programmdateien sind aktuell, der Container laeuft aber noch mit ' + alt + ' – er wird neu gebaut.'); return false; }
    sag('  ' + satz); sag(''); return true;
  };

  const lockVorher = (() => { try { return fs.readFileSync(path.join(WURZEL, 'package-lock.json')); } catch (e) { return null; } })();
  let geholt = true;

  if (stand.git && !ZWINGE_ZIP) {
    const g = gitZustand();
    if (g.schmutz && !TROTZDEM) {
      sag('  Im Ordner liegen ungesicherte Aenderungen. Die fasse ich nicht an.');
      sag('  Erst festlegen oder weglegen, dann noch einmal — oder --trotzdem');
      sag('  (dann lege ich sie fuer den Zug beiseite und danach wieder auf; widerspricht');
      sag('  eine davon dem Neuen, bleibt sie im git stash liegen).');
      sag('');
      process.exit(1);
    }
    if (g.zweig !== 'main' && g.zweig !== 'master' && !TROTZDEM) {
      sag('  Du bist auf dem Zweig „' + g.zweig + '“. Aktualisieren zieht origin/main.');
      sag('  Wechsle auf main, oder rufe mit --trotzdem auf.');
      sag('');
      process.exit(1);
    }
    if (g.lage === 'unerreichbar') {
      sag('  origin ist nicht erreichbar (' + g.grund + ').');
      sag('  Ob es etwas Neues gibt, laesst sich so nicht sagen – noch einmal, wenn das Netz da ist.');
      sag('');
      process.exit(1);
    }
    if (g.lage === 'auseinander' && !TROTZDEM) {
      sag('  main und origin/main sind auseinandergelaufen. Das loese ich nicht');
      sag('  von allein. git status ansehen, oder --trotzdem (rebase).');
      sag('');
      process.exit(1);
    }
    if ((g.lage === 'gleich' || g.lage === 'davor') && !stand.neuer && !TROTZDEM) {
      if (nichtsZuHolen(g.lage === 'gleich' ? 'origin/main ist schon da. Nichts zu holen.' : 'Deine Version liegt vor origin/main. Nichts zu holen.')) return;
      geholt = false;
    }
    if (geholt) {
      /* --trotzdem bei verfolgten Aenderungen: ohne --autostash verweigert git den Rebase immer (Pruefung bei der Uebernahme) -
         die Aenderungen werden beiseitegelegt und danach wieder aufgelegt */
      const zug = ['pull', '--rebase', ...(g.schmutz ? ['--autostash'] : []), 'origin', 'main'];
      sag('  → git ' + zug.join(' '));
      const r = spawnSync('git', zug, { cwd: WURZEL, stdio: 'inherit' });
      if (r.status !== 0) {
        sag('');
        /* EIN HALBER REBASE IST KEIN „WIE VORHER" (Pruefung bei der Uebernahme): mit --trotzdem kann der Rebase an einem
           Konflikt stehen bleiben - dann wird er zurueckgerollt, und erst danach stimmt der Satz. */
        const gitDir = path.join(WURZEL, '.git');
        if (fs.existsSync(path.join(gitDir, 'rebase-merge')) || fs.existsSync(path.join(gitDir, 'rebase-apply'))) {
          const ab = spawnSync('git', ['rebase', '--abort'], { cwd: WURZEL, encoding: 'utf8' });
          sag(ab.status === 0
            ? '  git pull ist an einem Konflikt gescheitert. Den Rebase habe ich abgebrochen – der Arbeitsbaum ist wieder, wie er war.'
            : '  git pull ist an einem Konflikt gescheitert, und der Rebase liess sich nicht abbrechen. Bitte: git rebase --abort');
        } else sag('  git pull ist gescheitert. Der Arbeitsbaum bleibt, wie er war.');
        process.exit(1);
      }
    }
  } else {
    if (!stand.neuer && !TROTZDEM) {
      if (nichtsZuHolen('Release und lokale Nummer sind gleich' + (stand.lage === -1 ? ' (oder deine ist neuer)' : '') + '. Nichts zu holen. (Erneut einspielen: --trotzdem)')) return;
      geholt = false;
    }
    if (geholt) {
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
  }

  if (mitDocker) {
    composeBauen(laeuft);
    sag('');
    if (laeuft) {
      sag('  Fertig. Die Seite einmal hart neu laden (Bilder und Skripte sonst aus dem Vorrat).');
      sag('  Adresse:  http://localhost:8788');
    } else {
      sag('  Der Container ist neu gebaut und angehalten, wie vorher. Starten: docker start klangtresor');
      /* Ein alter, angehaltener Container kann neben einer inzwischen direkt laufenden Installation stehen
         (Pruefung bei der Uebernahme) - dann braucht auch der Ordner seine Pakete und seinen Neustart. */
      if (fs.existsSync(path.join(WURZEL, 'node_modules'))) {
        try { npmCiWennNoetig(lockVorher); } catch (e) { sag('  ' + e.message); sag('  Die Pakete musst du von Hand setzen: npm ci'); }
        sag('  Laeuft dein KlangTresor ohne Container: den Server einmal neu starten (starten-linux.sh /');
        sag('  starten-macos.command / starten-windows.cmd) und die Seite hart neu laden.');
      }
    }
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
