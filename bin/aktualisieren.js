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

   VERSIONEN OHNE DIESE DATEI. Caspar_D, 15.10.2026: „wenn jemand die
   scripte noch nicht hat, dann funktioniert das update nicht – kannst du
   die Scripte separat downloadable machen, damit leute mit nicht
   updatenfähigen Klangtresor-Versionen auch das script nutzen können, sie
   müssen es natürlich in den Klangtresor/MySuno Ordner kopieren“. Bis
   1.0.72 gab es weder diese Datei noch die Anlasser. Darum haengt an jeder
   Release neben KlangTresor.zip das KlangTresor-Update.zip (bin/paket.js
   baut es): diese Datei als aktualisieren.js und die drei Anlasser, FLACH,
   ohne bin/ - der Finder ersetzt beim Kopieren einen vorhandenen Ordner
   bin/, statt ihn zusammenzufuehren. Darum laeuft die Datei auch direkt im
   Hauptordner (WURZEL unten), und darum raeumt sie sich dort nach einem
   Lauf ohne Fehler selbst weg, sobald bin/aktualisieren.js da ist - sonst
   liefe kuenftig ein veraltetes Skript. Am Namen des Ordners haengt
   nichts: KlangTresor, MySuno oder sonstwie.

   Aufruf — im Projektordner (dort liegen bin/ und library/, nicht docker/):
     ./aktualisieren-linux.sh
     node bin/aktualisieren.js              nachsehen und einspielen
     node aktualisieren.js                  dasselbe, die Kopie aus KlangTresor-Update.zip im Hauptordner
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
const { T } = require('./sprache.js');

/* WO DAS PROGRAMM LIEGT (Weg A, 15.10.2026): liegt diese Datei in bin/, ist es der Ordner darueber; sonst ihr eigener -
   die Kopie aus KlangTresor-Update.zip liegt im Hauptordner, neben library/. */
const WURZEL = path.basename(__dirname).toLowerCase() === 'bin' ? path.resolve(__dirname, '..') : path.resolve(__dirname);
/* NODE IN DEN SUCHPFAD (23.10.2026, im Windows-11-Test gefunden): npm fuehrt Installationsskripte ueber
   cmd.exe aus - bei onnxruntime-node `node ./script/install`. Kommt Node nur aus werkzeug\node und steht nicht
   im PATH, findet cmd.exe kein `node`, das Skript scheitert, und npm rollt ALLE Pakete zurueck (Lutz' fehlendes
   umap-js). Also den Ordner des laufenden Node vorn in den PATH - fuer uns und alle Kinder. */
process.env.PATH = path.dirname(process.execPath) + path.delimiter + (process.env.PATH || '');
/* Was KlangTresor-Update.zip in den Ordner bringt, so wie Git die Pfade kennt (bin/aktualisieren.js nur, wenn jemand
   die Kopie dorthin legt; aktualisieren.js im Hauptordner kennt Git nie und haelt darum auch keinen Zug auf). */
const PAKET = ['aktualisieren-linux.sh', 'aktualisieren-macos.command', 'aktualisieren-windows.cmd', 'bin/aktualisieren.js'];
const UA ='KlangTresor/1.0 (persoenliches Musikarchiv; github.com/CasparDavi/klangtresor)';
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
function dockerFragen(name) {
  return dockerLauf(['inspect', '-f',
    '{{.State.Status}}|{{index .Config.Labels "com.docker.compose.project.working_dir"}}|{{range .Mounts}}{{if eq .Destination "/app/library"}}{{.Source}}{{end}}{{end}}',
    name]);
}
/** { art: 'keins' | 'unseres' | 'fremd' | 'unerreichbar', status } */
function dockerZustand() {
  const r = dockerFragen('klangtresor');
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
/* Welche Version im laufenden Container steckt - der Container wird aus dem Ordner gebaut, also kann er hinter dem
   Ordner zurueckliegen (ein gescheiterter oder ausgelassener Neubau). null, wenn man nicht fragen kann. */
function containerFassung() {
  const r = dockerLauf(['exec', 'klangtresor', 'node', '-p', "require('/app/package.json').version"]);
  return r.status === 0 ? (r.stdout || '').trim() || null : null;
}
/* DER CONTAINER AUS DER MYSUNO-ZEIT hiess „mysuno“, seine docker-compose.yml lag im Hauptordner (./library). Den baut
   dieses Skript nicht um: es fragt nur lesend, ob es ihn gibt und ob er zu DIESEM Ordner gehoert, und sagt dann, was
   zu tun ist. Sonst liefe er nach dem Update unbemerkt mit dem alten Programm weiter. Status oder null. */
function alterContainer() {
  const r = dockerFragen('mysuno');
  if (r.error || r.status !== 0) return null;
  const [status, ordner, quelle] = (r.stdout || '').trim().split('|');
  const unser = gleicherOrdner(ordner, WURZEL) || gleicherOrdner(ordner, path.join(WURZEL, 'docker'))
    || gleicherOrdner(quelle, path.join(WURZEL, 'library'));
  return unser ? (status || 'da') : null;
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
    if (tiefe > 5) return bruch(new Error(T('zu viele Umleitungen')));
    const nimm = u.startsWith('https') ? https : http;
    const req = nimm.get(u, { headers: kopf, timeout: timeoutMs }, (a) => {
      if (a.statusCode >= 300 && a.statusCode < 400 && a.headers.location) {
        a.resume();
        return los(new URL(a.headers.location, u).href, tiefe + 1);
      }
      if (a.statusCode !== 200) {
        a.resume();
        return bruch(new Error(u.includes('api.github.com') ? T('GitHub antwortet HTTP {code}', { code: a.statusCode }) : T('Download HTTP {code}', { code: a.statusCode })));
      }
      antwort(a);
    });
    req.on('timeout', () => req.destroy(new Error(u.includes('api.github.com') ? T('keine Antwort von GitHub') : T('Download steht still'))));
    req.on('error', bruch);
  };
  los(url, 0);
}
function holenText(url, timeoutMs) {
  return new Promise((fertig, bruch) => {
    anfrage(url, { 'User-Agent': UA, Accept: 'application/json' }, timeoutMs || 12000, (a) => {
      const stuecke = [];
      a.on('data', t => stuecke.push(t));
      a.on('aborted', () => bruch(new Error(T('GitHub brach die Antwort ab'))));
      a.on('error', bruch);
      a.on('end', () => { if (a.complete) fertig(Buffer.concat(stuecke).toString('utf8')); else bruch(new Error(T('GitHub brach die Antwort ab'))); });
    }, bruch);
  });
}

/* Der Balken im Tab „System" (28.10.2026): bin/melden.js, wenn es da ist - aktualisieren.js laeuft auch als Kopie aus
   KlangTresor-Update.zip in Installationen ohne bin/melden.js, dort bleibt es bei den Saetzen. */
const melden = (() => { try { return require('./melden.js'); } catch (e) { const n = () => {}; n.lauf = n; n.ausLauf = n; n.zeile = n; return n; } })();
function holenDatei(url, ziel) {
  return new Promise((fertig, bruch) => {
    fs.mkdirSync(path.dirname(ziel), { recursive: true });
    anfrage(url, { 'User-Agent': UA }, 30000, (a) => {
      const soll = Number(a.headers['content-length']) || 0;
      let ist = 0, zuletzt = 0;
      const quelle = (() => { try { return new URL(url).hostname; } catch (e) { return ''; } })();
      a.on('data', t => { ist += t.length;
        if (Date.now() - zuletzt > 400) { zuletzt = Date.now(); melden.lauf({ was: 'KlangTresor.zip', bytes: ist, gesamt: soll || null, quelle }); } });
      a.on('end', () => melden.ausLauf());
      pipeline(a, fs.createWriteStream(ziel), (fehler) => {
        if (fehler) return bruch(new Error(T('Download abgebrochen: {grund}', { grund: fehler.message || fehler })));
        if (!a.complete || (soll && ist !== soll)) return bruch(new Error(T('Download unvollstaendig ({ist} von {soll} Bytes)', { ist, soll: soll || '?' })));
        fertig(ziel);
      });
    }, bruch);
  });
}

async function githubRelease() {
  const roh = await holenText(QUELLEN.fassung);
  let d;
  try { d = JSON.parse(roh); } catch (e) { throw new Error(T('GitHub lieferte kein JSON')); }
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
   und danach alle 12 h von selbst, dazu jedes Aufgehen des Fensters
   „KlangTresor“ - Neuladen und ein zweites Aufgehen sollen dieselbe
   Auskunft sehen, nicht das Kontingent verbrauchen. Gebuendelt wird nicht: Tabs, die im selben
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
    /* lage: 1 = GitHub ist neuer, 0 = gleich, -1 = hier ist neuer (ohne -1 nennte die Oberflaeche 1.0.72 gegen
       1.0.71 „die neueste Version“), null = eine Nummer fehlt */
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
        "$ProgressPreference='SilentlyContinue'; Expand-Archive -LiteralPath " + JSON.stringify(zip) + ' -DestinationPath ' + JSON.stringify(ziel) + ' -Force']]
    : process.platform === 'darwin'
      ? ['ditto', ['-x', '-k', zip, ziel]]
      : ['unzip', ['-q', '-o', zip, '-d', ziel]];
  const e = spawnSync(w[0], w[1], { encoding: 'utf8' });
  if (e.status !== 0) throw new Error(T('Auspacken ging nicht ({programm}).', { programm: w[0] }));
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
   das blosse npm scheiterte dort, und ein geaenderter package-lock wurde nie nachgezogen. */
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
  sag(T('  Pakete neu setzen (package-lock hat sich geaendert) …'));
  const r = spawnSync(n.befehl, n.vorn.concat(['ci', '--omit=dev']), { cwd: WURZEL, stdio: 'inherit', shell: n.schale });
  if (r.status !== 0) throw new Error(T('npm ci ist gescheitert.'));
  return true;
}

function composeBauen(laeuft) {
  const dateien = ['-f', 'docker/docker-compose.yml'];
  if (cudaGenutzt() && fs.existsSync(path.join(WURZEL, 'docker', 'docker-compose.cuda.yml'))) {
    dateien.push('-f', 'docker/docker-compose.cuda.yml');
    sag(T('  NVIDIA-Overlay bleibt dabei (KLANG_CUDA).'));
  }
  /* War der Container angehalten, bleibt er es: neu gebaut und angelegt, aber nicht gestartet (--no-start). */
  const hoch = laeuft ? ['up', '-d', '--build'] : ['up', '--no-start', '--build'];
  let cmd = 'docker', args = ['compose'].concat(dateien, hoch);
  const probe = spawnSync('docker', ['compose', 'version'], { encoding: 'utf8' });
  if (probe.status !== 0) {
    cmd = 'docker-compose';
    args = dateien.concat(hoch);
  }
  sag(T('  Container neu bauen — das dauert ein paar Minuten.') + (laeuft ? '' : ' ' + T('Er war angehalten und bleibt es.')));
  const r = spawnSync(cmd, args, { cwd: WURZEL, stdio: 'inherit' });
  if (r.status !== 0) throw new Error(T('Docker-Build ist gescheitert.'));
}

function sag(t) { console.log(t); }

/* Die Anlasser fuer dieses System - die Meldungen nennen den, den man hier wirklich startet. */
function anlasser(art) {
  if (process.platform === 'win32') return art + '-windows.cmd';
  if (process.platform === 'darwin') return art + '-macos.command';
  return art + '-linux.sh';
}
/* Ein Befehl zum Abtippen, mit dem Wechsel in diesen Ordner davor (im Terminal bzw. in der Eingabeaufforderung). */
function befehlHier(zeile) {
  const win = process.platform === 'win32';
  sag('    cd ' + (win ? '/d ' : '') + '"' + WURZEL + '"');
  sag('    ' + (win ? '' : './') + zeile);
}

/* WORAN EIN KLANGTRESOR ZU ERKENNEN IST (Weg A, 15.10.2026): an server/server.js, nicht an package.json - die fehlt
   in der MySuno-Zeit (18.08.2026), und bis zum 23.08. stand keine Nummer darin. Der Kopf der Datei sagt am 18.08.
   wie in 1.0.76 „Suno-Archiv · Server“; daran wird geprueft, damit eine Kopie nicht in einen fremden Ordner
   einspielt, der zufaellig auch ein server/server.js hat. */
function istKlangTresor(ordner) {
  try {
    const fd = fs.openSync(path.join(ordner, 'server', 'server.js'), 'r');
    const b = Buffer.alloc(4096);
    const n = fs.readSync(fd, b, 0, b.length, 0);
    fs.closeSync(fd);
    return /Suno-Archiv|KlangTresor|MySuno/.test(b.toString('utf8', 0, n));
  } catch (e) { return false; }
}

/* git status mit Pfaden. Ungekuerzt, nicht ueber git(): dessen trim() schnitte der ersten Zeile das fuehrende
   Leerzeichen der Form „XY pfad“ ab. Nur VERFOLGTE Aenderungen zaehlen: werkzeug/ (von einrichten-* angelegt) und
   andere ungetrackte Ordner haelt git pull nicht auf - vorher brach jede eingerichtete Installation hier ab. */
function gitSchmutz() {
  const r = spawnSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: WURZEL, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(((r.stderr || '').trim().split('\n')[0]) || T('git status scheiterte'));
  return (r.stdout || '').replace(/\s+$/, '');
}
function schmutzPfade(schmutz) {
  return String(schmutz || '').split('\n').filter(Boolean).map(z => {
    let p = z.slice(3);
    const pfeil = p.indexOf(' -> ');
    if (pfeil >= 0) p = p.slice(pfeil + 4);
    return p;
  });
}

/* SICHERN, BEVOR ETWAS UEBERSCHRIEBEN WIRD: verfolgte, nicht festgelegte Aenderungen kommen als Eintrag in den git
   stash. Der Arbeitsbaum bleibt dabei, wie er ist - stash create legt nur das Objekt an, stash store traegt es ein.
   Zurueck holt man es mit git stash apply. Geht das Sichern nicht, wird nichts ueberschrieben. */
function gitSichern(schmutz, warum) {
  if (!schmutz) return false;
  const h = git(['stash', 'create'], true);
  if (!h) throw new Error(T('Die ungesicherten Aenderungen liessen sich nicht im git stash sichern. Ich lasse alles, wie es ist.'));
  git(['stash', 'store', '-m', 'KlangTresor-Update ' + new Date().toISOString().slice(0, 10) + ': ' + warum, h]);
  return true;
}

/* DIE HINEINKOPIERTEN UPDATE-DATEIEN IM GIT-KLON (Weg A, 15.10.2026). Bis 1.0.72 kennt Git die Anlasser nicht: als
   unversionierte Dateien hielten sie den Zug auf („wuerden ueberschrieben“, geprobt an einem Klon auf v1.0.72), obwohl
   origin/main dieselben bringt. Sie kommen beiseite - im Speicher, und bei einem Fehlschlag zurueck, damit man es noch
   einmal starten kann. Was nicht aus dem Paket stammt, haelt den Zug weiter an: das sind Dateien des Nutzers. */
function paketBeiseite() {
  const bekannt = new Set(git(['ls-files', '--'].concat(PAKET), true).split('\n').filter(Boolean));
  const dort = new Set(git(['ls-tree', '-r', '--name-only', 'origin/main', '--'].concat(PAKET), true).split('\n').filter(Boolean));
  const weg = [];
  for (const n of PAKET) {
    const p = path.join(WURZEL, n);
    if (bekannt.has(n) || !dort.has(n) || !fs.existsSync(p)) continue;
    weg.push({ name: n, pfad: p, inhalt: fs.readFileSync(p), modus: fs.statSync(p).mode & 0o777 });
  }
  for (const w of weg) fs.unlinkSync(w.pfad);
  return weg;
}
function paketZurueck(weg) {
  for (const w of weg) {
    try { if (!fs.existsSync(w.pfad)) { fs.writeFileSync(w.pfad, w.inhalt); fs.chmodSync(w.pfad, w.modus); } } catch (e) {}
  }
}

/* git laeuft hier? (Ein Mac ohne Entwicklerwerkzeuge hat /usr/bin/git nur als Platzhalter, der mit Fehler endet.) */
function gitDa() {
  const r = spawnSync('git', ['--version'], { encoding: 'utf8' });
  return !r.error && r.status === 0;
}
/* lage: 'gleich' | 'dahinter' | 'davor' | 'auseinander' | 'unverwandt' | 'unbekannt'
         | 'unerreichbar' | 'ohne-origin' | 'ohne-git' */
function gitZustand() {
  if (!gitDa()) return { lage: 'ohne-git' };
  const zweig = git(['rev-parse', '--abbrev-ref', 'HEAD'], true);
  const schmutz = gitSchmutz();
  const quelle = git(['remote', 'get-url', 'origin'], true);
  const unserOrigin = /github\.com[:/]CasparDavi\/klangtresor(\.git)?\/?$/i.test(quelle);
  if (!quelle) return { zweig, schmutz, quelle, unserOrigin, lage: 'ohne-origin' };
  /* ein gescheitertes fetch ist „Stand unbekannt", nicht „nichts zu holen" (Pruefung bei der Uebernahme) */
  const geholt = spawnSync('git', ['fetch', 'origin'], { cwd: WURZEL, encoding: 'utf8' });
  if (geholt.status !== 0) return { zweig, schmutz, quelle, unserOrigin, lage: 'unerreichbar', grund: ((geholt.stderr || '').trim().split('\n')[0] || T('git fetch scheiterte')) };
  const origin = git(['rev-parse', '--verify', '-q', 'origin/main'], true) || null;
  const kopf = git(['rev-parse', '--verify', '-q', 'HEAD'], true) || null;
  let lage = 'unbekannt';
  if (origin) {
    if (kopf === origin) lage = 'gleich';
    else {
      /* UNVERWANDTE GESCHICHTE (Weg A, 15.10.2026): ein Klon aus der MySuno-Zeit traegt eine Geschichte, die mit der
         auf GitHub keinen Vorfahren teilt (das heutige Repo beginnt am 24.08.2026 neu). merge-base antwortet dann leer
         mit Exit 1 - vorher brach das Skript hier mit „git merge-base 1“ ab, auch mit --trotzdem. */
      const basis = kopf ? git(['merge-base', kopf, origin], true) : '';
      if (!basis) lage = 'unverwandt';
      else if (basis === kopf) lage = 'dahinter';
      else if (basis === origin) lage = 'davor';
      else lage = 'auseinander';
    }
  }
  return { zweig, schmutz, quelle, unserOrigin, lage, kopf, origin };
}

/* SELBST WEGRAEUMEN (Weg A, 15.10.2026): die Kopie aus KlangTresor-Update.zip im Hauptordner geht, sobald
   bin/aktualisieren.js da ist - sonst laege dort spaeter ein veraltetes Skript. Nur nach einem Lauf ohne Fehler (auch
   „nichts zu holen“ und mit Docker), nie bei --nur-stand: das schreibt nichts. Unter Windows geht das Loeschen der
   laufenden Datei, Node haelt sie nicht offen. */
function kopieWegraeumen() {
  const eigen = path.join(WURZEL, 'bin', 'aktualisieren.js');
  if (gleicherOrdner(__filename, eigen) || !fs.existsSync(eigen)) return;
  try {
    fs.unlinkSync(__filename);
    sag(T('  Die Kopie {datei} im Hauptordner habe ich weggeraeumt –\n  ab jetzt spielt bin/aktualisieren.js das Update ein.', { datei: path.basename(__filename) }));
  } catch (e) {
    sag(T('  Die Kopie {pfad} liess sich nicht wegraeumen ({grund}).\n  Bitte von Hand loeschen - ab jetzt gilt bin/aktualisieren.js.', { pfad: __filename, grund: e.code || e.message }));
  }
  sag('');
}

async function main() {
  sag('');
  sag(T('  KlangTresor — Update einspielen'));
  sag('  ===============================');
  sag('');

  if (imContainer()) {
    sag(T('  Das hier laeuft im Container. Aktualisieren gehoert auf den Rechner,\n  in den Projektordner (dort liegt library/ daneben):'));
    sag('    ./aktualisieren-linux.sh');
    sag(T('    oder aktualisieren-macos.command / aktualisieren-windows.cmd'));
    sag('');
    process.exit(1);
  }
  if (!istKlangTresor(WURZEL)) {
    const darueber = path.dirname(WURZEL);
    if (WURZEL === path.resolve(__dirname) && istKlangTresor(darueber)) {
      sag(T('  Diese Datei liegt eine Ebene zu tief, in {ordner}/.\n  Kopiere aktualisieren.js und {anlasser} in den Ordner darueber,\n  dort, wo library/ liegt, und starte es dort:', { ordner: path.basename(WURZEL), anlasser: anlasser('aktualisieren') }));
      sag('    ' + darueber);
    } else {
      sag(T('  Hier liegt kein KlangTresor:  {ordner}\n  Kopiere aktualisieren.js und {anlasser} in deinen\n  KlangTresor- bzw. MySuno-Ordner (dort, wo library/ liegt) und starte es dort.', { ordner: WURZEL, anlasser: anlasser('aktualisieren') }));
    }
    sag('');
    process.exit(1);
  }
  /* DER RICHTIGE ORDNER (Pruefung bei der Uebernahme): wer ein neues Zip auspackt und darin aktualisieren-* startet,
     spielt in den Entpackordner ein statt in seine Installation - dort liegt kein library/. */
  if (!NUR_STAND && !fs.existsSync(path.join(WURZEL, 'library')) && !TROTZDEM) {
    sag(T('  Neben diesem Programm liegt kein library/ – das ist wohl nicht deine\n  Installation, sondern ein frisch ausgepacktes Zip. Starte das Skript im\n  Ordner, in dem dein KlangTresor laeuft (dort liegt library/).'));
    sag(T('  Wirklich hier einspielen: --trotzdem'));
    sag('');
    process.exit(1);
  }

  const stand = await standHolen();
  /* OHNE NUMMER (MySuno-Zeit: package.json fehlt oder traegt keine version) gilt als aelter als jede Release - vorher
     hiess das „Hier: —“ und „Release und lokale Nummer sind gleich. Nichts zu holen.“ */
  const neuer = stand.neuer || (!stand.hier && !!stand.github);
  const dz = stand.docker || { art: 'keins' };
  /* AUS DER APP GESTARTET (Glocke, Tab „System"; KT_AUFTRAG aus bin/auftrag.js): dann laeuft KlangTresor gerade direkt
     aus diesem Ordner - der Container verweigert das Update ja selbst (server.js, grund 'container'). Ein Docker, das
     nicht antwortet, darf dann nicht abbrechen. Im Mac-Test vom 30.10.2026 gefunden: die Release-Zip traegt docker/,
     Docker Desktop war installiert, aber aus - und die Glocke endete nach 2 s mit „Starte Docker". */
  const ausDerApp = process.env.KT_AUFTRAG === '1';
  if (dz.art === 'unerreichbar' && !OHNE_DOCKER && !NUR_STAND && !ausDerApp) {
    sag(T('  Docker antwortet nicht. Ob dein KlangTresor im Container laeuft, laesst\n  sich so nicht klaeren – und ohne Neubau bliebe ein Container alt.\n  Starte Docker (Docker Desktop) und rufe noch einmal auf.'));
    sag(T('  Laeuft dein KlangTresor ohne Docker: --ohne-docker'));
    sag('');
    process.exit(1);
  }
  const mitDocker = dz.art === 'unseres' && !OHNE_DOCKER;
  /* „laeuft" heisst: soll laufen - auch im Neustart-Kreislauf oder pausiert. Nur ein angehaltener (exited/created)
     Container bleibt nach dem Neubau angehalten (Pruefung bei der Uebernahme: 'restarting' war danach aus). */
  const laeuft = mitDocker && ['running', 'restarting', 'paused'].includes(dz.status);
  const mysuno = OHNE_DOCKER ? null : alterContainer();

  /* DER WEG. Git, wenn .git da ist - ausser die Geschichte hier ist mit der auf GitHub nicht verwandt (Weg A,
     15.10.2026): dann gibt es keinen Git-Zug (git pull --rebase blieb am ersten alten Commit mit 24 Konflikten stehen,
     git pull ohne rebase verweigert unverwandte Geschichten). Zeigt origin auf github.com/CasparDavi/klangtresor, kommt
     das Release-Zip, angesagt, und ungesicherte Aenderungen liegen vorher im git stash. Zeigt origin woandershin oder
     fehlt, ueberschreibe ich keinen Git-Ordner still mit Zip-Dateien: dann ein Hinweis mit --zip. */
  let weg = stand.git && !ZWINGE_ZIP ? 'git' : 'zip';
  let g = null, unverwandt = false;
  if (weg === 'git' && !NUR_STAND) {
    g = gitZustand();
    if (g.lage === 'unverwandt' && g.unserOrigin) { weg = 'zip'; unverwandt = true; }
  }

  sag(T('  Ordner:   {ordner}', { ordner: WURZEL }));
  sag(T('  Hier:     {version}', { version: stand.hier || T('ohne Nummer') }));
  sag('  GitHub:   ' + (stand.github ? stand.github + (stand.tag && stand.tag !== stand.github ? '  (' + stand.tag + ')' : '') : (stand.grund || T('keine Antwort'))));
  const gitGehtNicht = !!g && (g.lage === 'ohne-git' || g.lage === 'ohne-origin' || (g.lage === 'unverwandt' && !g.unserOrigin));
  sag(T('  Weg:      {weg}', { weg: (gitGehtNicht ? T('Git geht hier nicht') : weg === 'git' ? 'Git' : T('Release-Zip')) + (mitDocker ? ' + Docker' + (laeuft ? '' : ' ' + T('(Container angehalten)')) : '') }));
  if (unverwandt) {
    sag(T('  Hinweis:  die Git-Geschichte hier stammt nicht von github.com/CasparDavi/klangtresor\n            (etwa ein Klon aus der MySuno-Zeit) - ein Git-Zug geht so nicht. Darum das\n            Release-Zip; .git/ und library/ bleiben, wie sie sind.'));
  }
  if (dz.art === 'fremd') sag(T('  Hinweis:  der Container „klangtresor" gehoert zu einem anderen Ordner – er bleibt unberuehrt.'));
  if (dz.art === 'unerreichbar' && !OHNE_DOCKER && !ausDerApp) sag(T('  Hinweis:  Docker antwortet nicht – einspielen ginge so nicht (Docker starten oder --ohne-docker).'));
  if (mysuno) sag(T('  Hinweis:  der Container „mysuno“ aus der MySuno-Zeit gehoert zu diesem Ordner ({status}).', { status: mysuno }));
  sag('');

  /* Der Container aus der MySuno-Zeit: was zu tun ist, damit er nicht alt weiterlaeuft. */
  const mysunoSchritte = () => {
    if (!mysuno) return;
    sag(T('  Der Container „mysuno“ laeuft mit dem alten Programm weiter - ihn baut\n  dieses Skript nicht um. Einmal:'));
    sag('    docker stop mysuno');
    befehlHier(anlasser('einrichten-docker'));
    sag(T('  Das baut den Container „klangtresor“ aus der neuen Version. library/ bleibt,\n  wo sie ist; den alten Container kannst du danach wegwerfen (docker rm mysuno).'));
    sag('');
  };
  /* Nach einem Lauf ohne Fehler, an jedem Ausgang: Hinweise und die Kopie im Hauptordner. */
  const schluss = () => { mysunoSchritte(); kopieWegraeumen(); };

  if (NUR_STAND) {
    if (neuer) sag(T('  Auf GitHub liegt eine neuere Version.'));
    else if (!stand.github) sag(T('  Nachsehen ist gescheitert: {grund}', { grund: stand.grund }));
    else if (stand.lage === -1) sag(T('  Deine Version ist neuer als die neueste auf GitHub.'));
    else sag(T('  Das ist die neueste Version.'));
    sag('');
    mysunoSchritte();
    return;
  }

  if (g && g.lage === 'ohne-git') {
    sag(T('  Hier liegt ein Git-Ordner (.git/), aber git laeuft auf diesem Rechner nicht.\n  Entweder git einrichten und noch einmal - oder das Release-Zip ueber das\n  Programm legen. library/ und .git/ bleiben; was in Git noch nicht festgelegt\n  ist, kann ich ohne git aber nicht sichern. Im Terminal:'));
    befehlHier(anlasser('aktualisieren') + ' --zip');
    sag('');
    process.exit(1);
  }
  if (gitGehtNicht) {
    if (g.lage === 'ohne-origin') {
      sag(T('  Dieser Git-Ordner hat kein origin – woher die neue Version kommen soll,\n  sagt Git hier nicht.'));
    } else {
      sag(T('  Die Git-Geschichte hier hat mit origin/main nichts gemein, und origin zeigt\n  nicht auf github.com/CasparDavi/klangtresor (origin: {quelle}).', { quelle: g.quelle }));
    }
    sag(T('  Einen Git-Ordner ueberschreibe ich nicht still mit Zip-Dateien. Das Release-Zip\n  ueber das Programm legen - library/ und .git/ bleiben, ungesicherte Aenderungen\n  lege ich vorher in den git stash. Im Terminal:'));
    befehlHier(anlasser('aktualisieren') + ' --zip');
    sag('');
    process.exit(1);
  }

  if (!stand.github && weg === 'zip') {
    sag(T('  Ohne GitHub-Antwort kann ich kein Release-Zip holen.'));
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
    if (alt) { sag(T('  Die Programmdateien sind aktuell, der Container laeuft aber noch mit {version} – er wird neu gebaut.', { version: alt })); return false; }
    sag('  ' + satz); sag(''); schluss(); return true;
  };

  const lockVorher = (() => { try { return fs.readFileSync(path.join(WURZEL, 'package-lock.json')); } catch (e) { return null; } })();
  let geholt = true;

  if (weg === 'git') {
    /* Hineinkopierte Update-Dateien zaehlen nicht als Aenderung des Nutzers (Weg A): ab 1.0.73 kennt Git die Anlasser,
       eine kopierte andere Fassung hielt den Zug mit „ungesicherte Aenderungen“ an (geprobt an v1.0.74). Sie gehen
       vor dem Zug auf den Git-Stand zurueck, ihr Inhalt vorher in den git stash; der Zug bringt die neuen. */
    const geaendert = schmutzPfade(g.schmutz);
    const paketGeaendert = geaendert.filter(p => PAKET.indexOf(p) >= 0);
    if (geaendert.length > paketGeaendert.length && !TROTZDEM) {
      sag(T('  Im Ordner liegen ungesicherte Aenderungen. Die fasse ich nicht an.\n  Erst festlegen oder weglegen, dann noch einmal — oder --trotzdem\n  (dann lege ich sie fuer den Zug beiseite und danach wieder auf; widerspricht\n  eine davon dem Neuen, bleibt sie im git stash liegen).'));
      sag('');
      process.exit(1);
    }
    if (g.zweig !== 'main' && g.zweig !== 'master' && !TROTZDEM) {
      sag(T('  Du bist auf dem Zweig „{zweig}“. Aktualisieren zieht origin/main.\n  Wechsle auf main, oder rufe mit --trotzdem auf.', { zweig: g.zweig }));
      sag('');
      process.exit(1);
    }
    if (g.lage === 'unerreichbar') {
      sag(T('  origin ist nicht erreichbar ({grund}).\n  Ob es etwas Neues gibt, laesst sich so nicht sagen – noch einmal, wenn das Netz da ist.', { grund: g.grund }));
      sag('');
      process.exit(1);
    }
    if (g.lage === 'auseinander' && !TROTZDEM) {
      sag(T('  main und origin/main sind auseinandergelaufen. Das loese ich nicht\n  von allein. git status ansehen, oder --trotzdem (rebase).'));
      sag('');
      process.exit(1);
    }
    if ((g.lage === 'gleich' || g.lage === 'davor') && !neuer && !TROTZDEM) {
      if (nichtsZuHolen(g.lage === 'gleich' ? T('origin/main ist schon da. Nichts zu holen.') : T('Deine Version liegt vor origin/main. Nichts zu holen.'))) return;
      geholt = false;
    }
    if (geholt) {
      if (paketGeaendert.length) {
        gitSichern(g.schmutz, 'hineinkopierte Update-Dateien vor dem Zug');
        git(['checkout', 'HEAD', '--'].concat(paketGeaendert));
        sag(T('  Hineinkopiert und anders als in Git: {dateien}\n  Sie gehen auf den Git-Stand zurueck (ihr Inhalt liegt im git stash), der Zug bringt die neuen.', { dateien: paketGeaendert.join(', ') }));
      }
      const beiseite = paketBeiseite();
      if (beiseite.length) {
        sag(T('  Hineinkopiert, Git kennt sie hier noch nicht: {dateien}\n  Der Zug bringt sie mit.', { dateien: beiseite.map(w => w.name).join(', ') }));
      }
      /* --trotzdem bei verfolgten Aenderungen: ohne --autostash verweigert git den Rebase immer (Pruefung bei der Uebernahme) -
         die Aenderungen werden beiseitegelegt und danach wieder aufgelegt */
      const zug = ['pull', '--rebase'].concat(gitSchmutz() ? ['--autostash'] : [], ['origin', 'main']);
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
            ? T('  git pull ist an einem Konflikt gescheitert. Den Rebase habe ich abgebrochen – der Arbeitsbaum ist wieder, wie er war.')
            : T('  git pull ist an einem Konflikt gescheitert, und der Rebase liess sich nicht abbrechen. Bitte: git rebase --abort'));
        } else sag(T('  git pull ist gescheitert. Der Arbeitsbaum bleibt, wie er war.'));
        paketZurueck(beiseite);
        process.exit(1);
      }
    }
  } else {
    if (!neuer && !TROTZDEM) {
      if (nichtsZuHolen(stand.lage === -1 ? T('Release und lokale Nummer sind gleich (oder deine ist neuer). Nichts zu holen. (Erneut einspielen: --trotzdem)') : T('Release und lokale Nummer sind gleich. Nichts zu holen. (Erneut einspielen: --trotzdem)'))) return;
      geholt = false;
    }
    if (geholt) {
      /* Ueber einen Git-Ordner (--zip oder unverwandte Geschichte): erst sichern, was Git noch nicht festgehalten hat -
         Festgelegtes steht ohnehin in .git/, und .git/ fasst das Zip nicht an. */
      if (stand.git && gitDa() && gitSichern(gitSchmutz(), 'Stand vor dem Release-Zip')) {
        sag(T('  Ungesicherte Aenderungen liegen jetzt im git stash (ansehen: git stash show -p).'));
      }
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'klangtresor-update-'));
      const zip = path.join(tmp, ZIP_NAME);
      const entpackt = path.join(tmp, 'aus');
      try {
        sag(T('  → hole {datei}', { datei: ZIP_NAME }));
        await holenDatei(stand.zip || QUELLEN.zip, zip);
        sag(T('  → packe ueber die Programmdaten (library/ bleibt)'));
        auspacken(zip, entpackt);
        const n = zipUeberlegen(entpackt);
        sag(T('  {n} Eintraege erneuert.', { n }));
      } finally {
        try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {}
      }
    }
  }

  if (mitDocker) {
    composeBauen(laeuft);
    sag('');
    if (laeuft) {
      sag(T('  Fertig. Die Seite einmal hart neu laden (Bilder und Skripte sonst aus dem Vorrat).'));
      sag(T('  Adresse:  {adresse}', { adresse: 'http://localhost:8788' }));
    } else {
      sag(T('  Der Container ist neu gebaut und angehalten, wie vorher. Starten: docker start klangtresor'));
      /* Ein alter, angehaltener Container kann neben einer inzwischen direkt laufenden Installation stehen
         (Pruefung bei der Uebernahme) - dann braucht auch der Ordner seine Pakete und seinen Neustart. */
      if (fs.existsSync(path.join(WURZEL, 'node_modules'))) {
        try { npmCiWennNoetig(lockVorher); } catch (e) { sag('  ' + e.message); sag(T('  Die Pakete musst du von Hand setzen: npm ci')); }
        sag(T('  Laeuft dein KlangTresor ohne Container: den Server einmal neu starten (starten-linux.sh /\n  starten-macos.command / starten-windows.cmd) und die Seite hart neu laden.'));
      }
    }
  } else {
    try { npmCiWennNoetig(lockVorher); } catch (e) {
      sag('  ' + e.message);
      sag(T('  Das Programm liegt, die Pakete musst du von Hand setzen: npm ci'));
    }
    /* Hier wurden bis 28.10.2026 fehlende Pakete still nachgeholt (bin/pakete.js, Lutz' umap-js vom 23.10.). Seit der
       Regel „alles in der Einrichtung, nichts hinterher" zeigt der Tab „System" im Profil, was fehlt, und holt es dort
       auf Knopfdruck mit Balken. Geaenderte Pakete eines Updates setzt npmCiWennNoetig oben weiterhin - das gehoert
       zum Einspielen der neuen Version. */
    try { const fehlt = require('./pakete.js').fehlende();
          if (fehlt.length) sag(T('  Es fehlen Programmbausteine: {liste} — holen: Profil → System.', { liste: fehlt.join(', ') })); }
    catch (e) {}
    sag('');
    /* Aus dem Tab „System" gestartet (bin/auftrag.js): der Server hat die neue server.js gesehen und startet von selbst neu */
    if (process.env.KT_AUFTRAG === '1') sag(T('  Fertig. Der Server startet von selbst neu – danach die Seite neu laden.'));
    else {
      sag(T('  Fertig. Den laufenden Server einmal neu starten:'));
      sag(T('    ./starten-linux.sh   oder starten-macos.command / starten-windows.cmd'));
      sag(T('  Danach die Seite hart neu laden.'));
    }
  }
  sag('');
  schluss();
}

module.exports = { standHolen, paketVersion, vergleich };

if (require.main === module) {
  main().catch(e => {
    console.error('\n  ' + (e && e.message ? e.message : e) + '\n');
    process.exit(1);
  });
}
