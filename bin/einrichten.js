#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   KlangTresor einrichten
   -------------------------------------------------------------
   WARUM DAS HIER EIN JAVASCRIPT IST UND KEIN SKRIPT JE SYSTEM.

   Caspar_D, 11.09.2026: „am schönsten wäre natürlich, du downloadest
   nur node.js zuerst und machst dann ein schickes installations-js".
   Genau so ist es gebaut. Je System gibt es nur noch einen kurzen
   Anlasser, der eines tut: Node beschaffen. Alles danach steht hier,
   einmal, für Windows, macOS und Linux zugleich.

   Drei Dinge werden dadurch besser:

   1. EINE WAHRHEIT. Vorher lag dieselbe Abfolge dreimal da — in
      PowerShell, in Bash für Linux, in Bash für den Mac. Jede Änderung
      musste dreimal gemacht und dreimal geprüft werden, und beim
      dritten Mal vergaß man sie.
   2. KEINE KODIERUNGSFALLE. Eine .ps1 ohne Byte Order Mark liest
      PowerShell 5.1 als CP1252, und jedes Sonderzeichen zerfällt
      (Casto, 23.08.2026: „1000 Fehlermeldungen"). Node liest UTF-8,
      immer. Darum stehen hier Umlaute, und darum darf es hübsch sein.
   3. ECHTE FARBEN. Node schaltet auf Windows die Farbverarbeitung
      selbst ein. Die Konsole kann damit die Hausfarben zeigen statt
      der sechzehn Standardfarben.

   Aufruf:
     node bin/einrichten.js            einrichten
     node bin/einrichten.js --ohne-start   alles, aber nicht starten

   ABBRECHEN IST ERLAUBT, an jeder Stelle. Was schon da ist, wird
   erkannt und übersprungen; der nächste Lauf macht dort weiter.
   ============================================================= */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const https = require('node:https');
const http = require('node:http');
const { spawnSync } = require('node:child_process');
const readline = require('node:readline');

const WURZEL = path.resolve(__dirname, '..');
const WERKZEUG = path.join(WURZEL, 'werkzeug');
const OHNE_START = process.argv.includes('--ohne-start');
/* DIE OBERFLAECHE. Caspar_D, 13.09.2026: „es soll ein js sein und nicht
   mehr alles ein cmd script" - und „der text bleibt der fallback".
   Ohne --text oeffnet die Einrichtung eine Seite im Browser: Tresortuer,
   Schrittleiste, Fortschritt, Erklaerungen, Anreisser. Die Konsole
   laeuft trotzdem weiter - sie ist das Protokoll und die Rueckfalltuer.
   Alles, was hier ausgegeben oder gefragt wird, geht an beide. */
const NUR_TEXT = process.argv.includes('--text');
/* Fuer Probelaeufe: Seite bereitstellen, aber keinen Browser aufreissen. */
const OHNE_BROWSER = process.argv.includes('--ohne-browser');
const ZUSTAND = { schritte: [], aktuell: 0, zeilen: [], fortschritt: null, frage: null, fertig: false, adresse: null, gesamt: 10 };
const ohneFarbe = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, '');
function merken(art, text) {
  ZUSTAND.zeilen.push({ art, text: ohneFarbe(text).replace(/^\s{5}/, ''), t: Date.now() });
  if (ZUSTAND.zeilen.length > 400) ZUSTAND.zeilen.splice(0, ZUSTAND.zeilen.length - 400);
}
/* Probelauf einer frischen Einrichtung: alles tun, aber nur N Titel
   Medien holen. Damit laesst sich die ganze Kette pruefen, ohne einen
   fremden Server fuer nichts dreihundertmal anzufassen.
   Nicht fuer den Alltag gedacht - es steht deshalb in keinem Text. */
const PROBE = (() => {
  const i = process.argv.indexOf('--probe');
  return i >= 0 && process.argv[i + 1] ? ['--test', process.argv[i + 1]] : [];
})();
process.chdir(WURZEL);

/* ---- Farben ------------------------------------------------------
   Nur wenn die Ausgabe wirklich auf einem Schirm landet. Läuft sie in
   eine Datei oder durch eine Pipe, bleibt der Text nackt - sonst stehen
   Steuerzeichen im Protokoll, und das ist schlimmer als keine Farbe.
   NO_COLOR ist die verbreitete Abmachung, sie wird beachtet. */
const BUNT = process.stdout.isTTY && !process.env.NO_COLOR;
const f = (r, g, b) => (t) => BUNT ? `\x1b[38;2;${r};${g};${b}m${t}\x1b[0m` : t;
const MARKE = f(249, 123, 20);      // das KlangTresor-Orange
const AKZENT = f(227, 28, 121);     // das Magenta daneben
const MATT = f(139, 139, 144);
const HELL = f(242, 242, 242);
const GUT = f(63, 185, 80);
const WARN = f(210, 153, 34);
const BOESE = f(229, 83, 75);

const schreib = (t = '') => process.stdout.write(t + '\n');
const matt = (t) => { schreib('     ' + MATT(t)); merken('matt', t); };
const satz = (t) => { schreib('     ' + t); merken('satz', t); };
const leer = () => { schreib(''); merken('leer', ''); };
const gut = (t) => { schreib('     ' + GUT('[ok]') + '  ' + t); merken('gut', t); };
const wink = (t) => { schreib('     ' + WARN('[!] ') + '  ' + t); merken('wink', t); };
const boese = (t) => { schreib('     ' + BOESE('[x] ') + '  ' + t); merken('boese', t); };
const tut = (t) => { schreib('     ' + MARKE('->  ') + '  ' + t); merken('tut', t); };

let SCHRITT = 0;
const SCHRITTE = 10;
function schritt(t) {
  SCHRITT++;
  leer();
  schreib('  ' + AKZENT(`[${SCHRITT}/${SCHRITTE}]`) + ' ' + HELL(t));
  merken('schritt', `[${SCHRITT}/${SCHRITTE}] ${t}`);
  if (ZUSTAND.schritte[SCHRITT - 2]) ZUSTAND.schritte[SCHRITT - 2].zustand = 'fertig';
  ZUSTAND.schritte[SCHRITT - 1] = { nr: SCHRITT, name: t, zustand: 'laeuft' };
  ZUSTAND.aktuell = SCHRITT;
  ZUSTAND.fortschritt = null;
}

/* Die Tresortür. Rein aus ASCII gezeichnet, damit sie überall gleich
   steht - auch in einer Konsole, die keine Linienzeichen kann. */
function marke() {
  const t = [
    "     .----------------------------.",
    "     |   .--------------------.   |",
    "     |   |                    |   |",
    "     |   |    @KLANGTRESOR@     |   |",
    "     |   |                    |   |",
    "     |   |       #( o )#        |   |",
    "     |   |                    |   |",
    "     |   '--------------------'   |",
    "     '----------------------------'",
  ];
  leer();
  for (const z of t) {
    if (z.includes('@')) {
      const [a, wort, b] = z.split('@');
      schreib(MARKE(a) + HELL(wort) + MARKE(b));
    } else if (z.includes('#')) {
      const [a, rad, b] = z.split('#');
      schreib(MARKE(a) + AKZENT(rad) + MARKE(b));
    } else schreib(MARKE(z));
  }
  leer();
  matt('dein eigenes Archiv, auf deinem Rechner');
  leer();
}

/* ---- Fragen ------------------------------------------------------ */
/* OHNE TERMINAL-MODUS. Im Terminal-Modus schaltet readline die Konsole
   auf Rohbetrieb, deutet Tastenfolgen als Escape-Sequenzen und zeichnet
   die Eingabezeile selbst. Auf der Windows-Konsole ging das am
   13.09.2026 zweimal schief, beide Male nach dem Umzug in den neuen
   Ordner: die erste Antwort kam nicht an, der Prozess stand still, Enter
   half nicht - erst ein Escape setzte den Zustand zurueck, danach
   erschien die Frage ein Dutzend Mal neu gezeichnet. Ohne Terminal-Modus
   puffert die Konsole die Zeile selbst, nichts wird umgedeutet, und die
   Rueckschritttaste funktioniert trotzdem - das erledigt die Konsole. */
const leser = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
/* EINE FRAGE, ZWEI WEGE. Die Konsole zeigt sie wie immer; die Seite
   bekommt sie als Zustand mit Schaltflaechen. Wer zuerst antwortet,
   gewinnt - eine Zeile in der Konsole oder ein POST /antwort. */
let _antwort = null, _frageNr = 0;
leser.on('line', (z) => { if (_antwort) { const f = _antwort; _antwort = null; ZUSTAND.frage = null; f(String(z || '').trim()); } });
function antwortVonSeite(id, wert) {
  if (!_antwort || !ZUSTAND.frage || ZUSTAND.frage.id !== id) return false;
  const f = _antwort; _antwort = null; ZUSTAND.frage = null; f(String(wert == null ? '' : wert).trim());
  return true;
}
function fragen(t, meta) {
  process.stdout.write(t);
  ZUSTAND.frage = Object.assign({ id: ++_frageNr, art: 'text', text: ohneFarbe(t).trim() }, meta || {});
  return new Promise((r) => { _antwort = r; });
}

async function jaNein(text, vorgabe = 'j') {
  const zeige = vorgabe === 'j' ? '[J/n]' : '[j/N]';
  const a = await fragen('     ' + AKZENT(`${text} ${zeige} `),
    { art: 'wahl', text, vorgabe, optionen: [{ wert: 'j', label: 'Ja', vor: vorgabe === 'j' }, { wert: 'n', label: 'Nein', vor: vorgabe !== 'j' }] });
  if (!a) return vorgabe === 'j';
  return /^[jJyY]/.test(a);
}

/* Ein Fehlschlag ist kein Weltuntergang, solange die Sache verzichtbar
   ist. Dann wird gefragt, statt abzubrechen. */
async function wieWeiter(was, folge) {
  leer();
  wink(`${was} hat nicht geklappt.`);
  matt(folge);
  leer();
  matt('  [w] noch einmal versuchen');
  matt('  [ü] jetzt überspringen und ohne weitermachen');
  matt('  [s] hier Schluss machen — später neu starten');
  const a = await fragen('     ' + AKZENT('Was tun? [w/ü/s] '),
    { art: 'wahl', text: `${was} hat nicht geklappt. ${folge}`, vorgabe: 'ü',
      optionen: [{ wert: 'w', label: 'Noch einmal versuchen' }, { wert: 'ü', label: 'Überspringen und weiter', vor: true }, { wert: 's', label: 'Schluss — später neu starten' }] });
  if (/^[wW]/.test(a)) return 'wieder';
  if (/^[sS]/.test(a)) return 'schluss';
  return 'ueber';
}

function wiederkommen() {
  leer();
  matt('Nichts ist verloren. Starte das Einrichten einfach noch einmal —');
  matt('es erkennt, was schon da ist, und macht dort weiter.');
  leer();
}

function schluss(code = 0) { leser.close(); process.exit(code); }

/* ---- Quellen ----------------------------------------------------- */
const QUELLEN = {};
function quellenLesen() {
  const d = path.join(WURZEL, 'quellen.txt');
  if (!fs.existsSync(d)) return false;
  for (const z of fs.readFileSync(d, 'utf8').split('\n')) {
    const t = z.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    QUELLEN[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return true;
}

/* ---- Holen ------------------------------------------------------
   Begrenzt wird der STILLSTAND, nicht die Gesamtdauer: hundert Megabyte
   dürfen lange dauern, aber zwei Minuten ohne ein einziges Byte heißen,
   dass nichts mehr kommt. Dieselbe Regel wie in bin/modelle-holen.js. */
const MB = (n) => (n / 1048576).toFixed(1) + ' MB';
const STILLSTAND = 120000;

function holen(url, ziel, was, tiefe = 0) {
  return new Promise((fertig) => {
    if (tiefe > 5) return fertig(false);
    const nimm = url.startsWith('https') ? https : http;
    const anfrage = nimm.get(url, { headers: { 'User-Agent': 'KlangTresor-Einrichtung' } }, (a) => {
      if (a.statusCode >= 300 && a.statusCode < 400 && a.headers.location) {
        a.resume();
        return fertig(holen(new URL(a.headers.location, url).href, ziel, was, tiefe + 1));
      }
      if (a.statusCode !== 200) {
        a.resume();
        boese(`${was} ging nicht: die Gegenstelle sagt ${a.statusCode}`);
        return fertig(false);
      }
      const ganz = Number(a.headers['content-length']) || 0;
      const datei = fs.createWriteStream(ziel);
      let summe = 0, zuletzt = 0;
      const begonnen = Date.now();
      let wacht = setInterval(() => {
        if (Date.now() - zuletzt > STILLSTAND) {
          clearInterval(wacht); a.destroy(); datei.close();
          boese(`${was}: zwei Minuten ohne ein einziges Byte — die Leitung schweigt.`);
          fertig(false);
        }
      }, 5000);
      zuletzt = Date.now();
      let gemalt = 0;
      a.on('data', (st) => {
        summe += st.length; zuletzt = Date.now();
        const takt = BUNT ? 400 : 5000;
        if (Date.now() - gemalt < takt) return;
        gemalt = Date.now();
        const sek = Math.max(1, (Date.now() - begonnen) / 1000);
        const tempo = summe / sek;
        let rest = '';
        if (ganz && tempo > 0) {
          const s = Math.round((ganz - summe) / tempo);
          rest = s >= 60 ? `, noch etwa ${Math.ceil(s / 60)} min` : `, noch etwa ${s} s`;
        }
        const teil = ganz ? ` von ${MB(ganz)} (${Math.round(summe / ganz * 100)} %)` : '';
        const zeile = `     ${MARKE('->  ')}  ${was} … ${MB(summe)}${teil}${rest}`;
        ZUSTAND.fortschritt = { was, bytes: summe, gesamt: ganz || null, rest: rest.replace(/^, /, '') };
        /* Auf dem Schirm überschreibt sich die Zeile. In einer Datei täte
           sie das nicht - dort hinge jede Zwischenmeldung an der vorigen
           und das Protokoll wäre unlesbar (gesehen am 11.09.2026). */
        if (BUNT) process.stdout.write('\r' + zeile + '          ');
        else schreib(zeile);
      });
      a.pipe(datei);
      datei.on('finish', () => {
        clearInterval(wacht); datei.close();
        if (BUNT) process.stdout.write('\r' + ' '.repeat(78) + '\r');
        ZUSTAND.fortschritt = null;
        gut(`${was} geholt (${MB(summe)})`);
        fertig(true);
      });
    });
    anfrage.on('error', (e) => { boese(`${was} ging nicht: ${e.message}`); fertig(false); });
    anfrage.setTimeout(30000, () => { anfrage.destroy(new Error('keine Antwort')); });
  });
}

/* Auspacken ohne fremde Pakete - die gibt es an dieser Stelle noch
   nicht. Jedes System bringt sein eigenes Werkzeug mit. */
function auspacken(zip, ziel) {
  try { fs.rmSync(ziel, { recursive: true, force: true }); } catch (e) {}
  fs.mkdirSync(ziel, { recursive: true });
  const w = process.platform === 'win32'
    ? ['powershell', ['-NoProfile', '-Command',
        `$ProgressPreference='SilentlyContinue'; Expand-Archive -LiteralPath '${zip}' -DestinationPath '${ziel}' -Force`]]
    : process.platform === 'darwin'
      ? ['ditto', ['-x', '-k', zip, ziel]]
      : ['unzip', ['-q', '-o', zip, '-d', ziel]];
  const e = spawnSync(w[0], w[1], { stdio: 'ignore' });
  if (e.status !== 0) { boese(`Auspacken ging nicht (${w[0]} meldet ${e.status}).`); return false; }
  return true;
}

/* Ein entpacktes Paket hat meist genau einen Ordner darin. Der soll an
   den festen Platz, damit kein Pfad an einer Versionsnummer hängt. */
function einenOrdnerHeben(von, nach) {
  const drin = fs.readdirSync(von).map((n) => path.join(von, n))
    .filter((p) => fs.statSync(p).isDirectory());
  const quelle = drin.length === 1 ? drin[0] : von;
  try { fs.rmSync(nach, { recursive: true, force: true }); } catch (e) {}
  fs.renameSync(quelle, nach);
  try { fs.rmSync(von, { recursive: true, force: true }); } catch (e) {}
}

/* DIE EINGABEAUFFORDERUNG NUR DANN, WENN ES NICHT ANDERS GEHT.

   shell:true war unter Windows pauschal gesetzt, damit Dinge wie
   `npm.cmd` ueberhaupt starten - eine .cmd-Datei kann Node nicht direkt
   ausfuehren. Der Preis ist hoch: cmd.exe WEIGERT SICH, einen UNC-Pfad
   als Arbeitsverzeichnis zu nehmen, springt stillschweigend nach
   C:\Windows, und das dort gestartete Programm schreibt seine Dateien an
   die falsche Stelle:

       UNC-Pfade werden nicht unterstuetzt.
       npm error EPERM: open 'C:\Windows\package-lock.json'

   Am 13.09.2026 zweimal in derselben Sitzung gemessen - beim zweiten Mal,
   weil ich nur den npm-Aufruf umgestellt hatte und diese Zeile uebersah.
   Der Aufruf ging danach an node.exe statt an npm.cmd und lief trotzdem
   durch cmd.exe.

   Ein Programm mit vollem Pfad braucht keine Schale. Node startet es
   selbst, und Node kommt mit UNC-Pfaden zurecht. Nur fuer Namen ohne
   Pfad - `npm`, `npm.cmd` - bleibt sie noetig. */
/* LAUFEN LASSEN, MIT ESCAPE UNTERBRECHBAR.

   Caspar_D, 13.09.2026, mitten in Schritt 9: „es waere gut, wenn hier
   eine Message gestanden haette: mit Escape abbrechen ermoeglicht, den
   Datendownload zu unterbrechen und den KlangTresor fuer einen ersten
   Blick zu starten. Der Datendownload kann mit dem roten Knopf oben
   rechts fortgesetzt werden."

   Strg+C wuerde die ganze Einrichtung toeten - kein Server, keine
   Verknuepfung. Escape hier beendet nur das Kind und macht weiter.
   Dafuer muss die Tastatur kurz roh gelesen werden; ohne Bildschirm
   (Roehre, ferngesteuert) faellt es auf den gewoehnlichen Lauf zurueck.
   Danach kommt keine Frage mehr, ein verirrtes Escape-Byte stoert
   also niemanden. */
function laeuftAbbrechbar(befehl, argumente) {
  const { spawn } = require('node:child_process');
  const stdin = process.stdin;
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    return laeuft(befehl, argumente).then((ok) => ({ ok, abgebrochen: false }));
  }
  return new Promise((fertig) => {
    const kind = spawn(befehl, argumente, { stdio: 'inherit' });
    let abgebrochen = false, zu = false;
    const horcher = (b) => {
      for (const x of b) if (x === 0x1b || x === 0x03) {
        abgebrochen = true;
        try { kind.kill(); } catch (e) {}
        if (process.platform === 'win32') {
          try { spawnSync('taskkill', ['/PID', String(kind.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (e) {}
        }
        return;
      }
    };
    const aufraeumen = () => {
      if (zu) return; zu = true;
      try { stdin.removeListener('data', horcher); stdin.setRawMode(false); stdin.pause(); } catch (e) {}
    };
    try { stdin.setRawMode(true); stdin.resume(); stdin.on('data', horcher); } catch (e) {}
    kind.on('error', () => { aufraeumen(); fertig({ ok: false, abgebrochen }); });
    kind.on('close', (code) => { aufraeumen(); fertig({ ok: code === 0 && !abgebrochen, abgebrochen }); });
  });
}

/* Asynchron und mitgelesen: die Ausgabe der Kinder (npm, Modelle, sammeln)
   geht weiter auf die Konsole und ausserdem zeilenweise in den Zustand. */
function laeuft(befehl, argumente) {
  const brauchtSchale = process.platform === 'win32' && !path.isAbsolute(befehl);
  return new Promise((fertig) => {
    const { spawn } = require('node:child_process');
    const kind = spawn(befehl, argumente, { stdio: ['inherit', 'pipe', 'pipe'], shell: brauchtSchale });
    let restAus = '', restErr = '';
    const zeilenweise = (s, quelle) => {
      process.stdout.write(s);
      const puffer = (quelle === 'err' ? restErr : restAus) + String(s).replace(/\r/g, '\n');
      const teile = puffer.split('\n'); const rest = teile.pop();
      if (quelle === 'err') restErr = rest; else restAus = rest;
      for (const z of teile) if (z.trim()) merken('kind', z);
    };
    kind.stdout.on('data', (s) => zeilenweise(s, 'aus'));
    kind.stderr.on('data', (s) => zeilenweise(s, 'err'));
    kind.on('error', () => fertig(false));
    kind.on('close', (code) => fertig(code === 0));
  });
}

/* ---- Rechte und Platz -------------------------------------------
   Caspar_D, 11.09.2026: „darf man denn einfach so von node.js ein
   programm aufrufen, was auf die platte schreibt, bitte privilegien
   checken, bevor du loslegst."

   Die Antwort auf den ersten Teil: node hat KEINE besonderen Rechte. Es
   laeuft mit genau den Rechten dessen, der es gestartet hat, und kommt
   nur dorthin, wo dieser Mensch ohnehin schreiben darf. Geschrieben wird
   ausserdem nur in den Projektordner - kein Systemordner, keine
   Registry, kein PATH.

   Der zweite Teil ist trotzdem richtig: lieber jetzt nachsehen als nach
   zwanzig Minuten scheitern. Drei Dinge koennen schiefgehen, und alle
   drei sind vorher erkennbar. */

/* Laeuft das hier mit erhoehten Rechten? Das BRAUCHT niemand, und es
   schadet: die angelegten Dateien gehoeren danach dem Verwalter, und der
   normale Benutzer kommt an sein eigenes Archiv nicht mehr heran. */
function erhoeht() {
  if (process.platform === 'win32') {
    const e = spawnSync('net', ['session'], { stdio: 'ignore' });
    return e.status === 0;
  }
  try { return typeof process.getuid === 'function' && process.getuid() === 0; } catch (e) { return false; }
}

/* Ein Systemordner ist der falsche Platz: dort darf ein normaler
   Benutzer spaeter nicht schreiben, und genau das braucht das Archiv
   staendig. */
function imSystemordner(p) {
  const q = p.replace(/\\/g, '/').toLowerCase();
  const verdacht = process.platform === 'win32'
    ? ['/program files', '/program files (x86)', '/windows/']
    : ['/usr/', '/bin/', '/sbin/', '/system/', '/library/'];
  return verdacht.some((v) => q.includes(v));
}

function freierPlatz(p) {
  try { const s = fs.statfsSync(p); return s.bavail * s.bsize; } catch (e) { return null; }
}

function darfSchreiben(p) {
  const probe = path.join(p, '.schreibprobe-' + process.pid);
  try { fs.writeFileSync(probe, 'x'); fs.unlinkSync(probe); return true; }
  catch (e) { return false; }
}

/* Antwortet auf 8788 schon ein KlangTresor? Dann zeigt der Browser
   gleich das ANDERE Archiv, waehrend dieser hier mit „Adresse belegt"
   stirbt - und das sieht von aussen nach Erfolg aus. */
function jemandAufPort(port) {
  return new Promise((fertig) => {
    const net = require('node:net');
    const draht = net.connect({ host: '127.0.0.1', port });
    const schluss = (antwort) => { try { draht.destroy(); } catch (e) {} fertig(antwort); };
    draht.setTimeout(1500);
    draht.once('connect', () => schluss(true));
    draht.once('timeout', () => schluss(false));
    draht.once('error', () => schluss(false));
  });
}

/* Die Seite im Browser aufmachen - jedes System auf seine Art. Schlaegt
   es fehl, steht die Adresse ja auch im Text. */
const { chromeFinden, seiteAufmachen } = require('./browser.js');

/* WO LIEGT DAS HIER EIGENTLICH - UND ZWAR SO, DASS ER ES WIEDERFINDET.

   Caspar_D, 13.09.2026, zur ersten Fassung: „Der Klartext ist doof, der
   ist ja nur fuer den besonderen parallels Fall gueltig. Versetze dich
   in den Nutzer, was er wirklich sehen muss in der genauen Situation."

   Richtig: „Das ist dein Benutzerordner auf dem Mac" hilft niemandem.
   Was hilft, ist der Pfad, unter dem er den Ordner SPAETER OEFFNET - und
   der ist bei einer Parallels-Freigabe ein ganz anderer als der, den
   Windows anzeigt. Auf einem normalen Windows erklaert sich C:\Users\...
   von selbst; dort steht gar nichts. */
function ortInWorten(p) {
  const q = String(p).replace(/\\/g, '/');
  const m = q.match(/^\/\/psf\/Home\/(.*)$/i);
  if (m) return 'Auf dem Mac öffnest du ihn unter:  ~/' + m[1];
  if (/^\/\/psf\//i.test(q)) return 'Der Ordner liegt auf dem Mac, nicht in Windows.';
  const n = q.match(/^\/\/([^/]+)\/([^/]+)/);
  if (n) return `Der Ordner liegt auf dem Rechner „${n[1]}", Freigabe „${n[2]}" — nicht hier.`;
  return null;
}

function da(befehl) {
  const e = spawnSync(process.platform === 'win32' ? 'where' : 'which', [befehl],
    { stdio: 'pipe', encoding: 'utf8' });
  if (e.status !== 0) return null;
  return String(e.stdout).split('\n')[0].trim() || null;
}

/* EINE VERKNUEPFUNG AUF DEM SCHREIBTISCH.

   Caspar_D, 13.09.2026, nachdem er den umgezogenen Ordner suchen
   musste: „das findet kein DAU".

   Er hat recht. Ein Programm, das man nur wiederfindet, indem man einen
   Pfad abtippt, ist fuer die meisten Menschen verloren. Im normalen Lauf
   faellt das nicht auf - die Einrichtung zieht um und laeuft im selben
   Fenster weiter -, aber SPAETER will er es ja wieder starten. Dafuer
   muss etwas dort liegen, wo er ohnehin hinsieht.

   Jedes System auf seine Art, und keines davon ist heikel: eine .lnk
   ueber WScript.Shell, ein Verweis auf dem Mac, eine .desktop-Datei
   unter Linux. Schlaegt es fehl, ist das kein Grund zur Aufregung - es
   wird gesagt und weitergemacht. */
/* DAS ZWISCHENLAGER - EINMAL GEHOLT IST EINMAL GEHOLT.

   Caspar_D, 13.09.2026: „wenn ich jetzt jedesmal warten muss, bis ffmpeg
   runtergeladen ist, ist das eine Zumutung".

   Er hat recht, und es trifft nicht nur ihn: Wer neu entpackt, wer eine
   zweite Kopie anlegt, wer nach einem Fehlschlag von vorn beginnt - alle
   holten bisher dieselben 384 MB noch einmal. ffmpeg und die Modelle
   gehoeren aber nicht zum Archiv, sie gehoeren zum RECHNER.

   Also landen sie zusaetzlich in einem Lager ausserhalb des
   Projektordners, dort wo das System solche Dinge erwartet, und beim
   naechsten Mal werden sie von dort kopiert statt geladen. Das Lager
   darf jederzeit weg - dann wird eben neu geholt. */
function lagerOrdner() {
  const heim = os.homedir();
  const p = process.platform === 'win32'
    ? path.join(process.env.LOCALAPPDATA || path.join(heim, 'AppData', 'Local'), 'KlangTresor')
    : process.platform === 'darwin'
      ? path.join(heim, 'Library', 'Caches', 'KlangTresor')
      : path.join(process.env.XDG_CACHE_HOME || path.join(heim, '.cache'), 'klangtresor');
  try { fs.mkdirSync(p, { recursive: true }); return p; } catch (e) { return null; }
}

/* Aus dem Lager holen. Gibt true, wenn danach etwas da ist. */
function ausLager(name, ziel) {
  const lager = lagerOrdner();
  if (!lager) return false;
  const q = path.join(lager, name);
  try {
    if (!fs.existsSync(q) || !fs.readdirSync(q).length) return false;
    tut(`${name} liegt schon auf diesem Rechner — ich kopiere statt zu laden.`);
    fs.mkdirSync(path.dirname(ziel), { recursive: true });
    fs.cpSync(q, ziel, { recursive: true, force: true });
    return true;
  } catch (e) { return false; }
}

/* Ins Lager legen. Fehler sind hier belanglos - es ist nur Bequemlichkeit. */
function insLager(name, quelle) {
  const lager = lagerOrdner();
  if (!lager) return;
  try {
    if (!fs.existsSync(quelle)) return;
    const z = path.join(lager, name);
    fs.rmSync(z, { recursive: true, force: true });
    fs.cpSync(quelle, z, { recursive: true, force: true });
  } catch (e) {}
}

/* WO DER SCHREIBTISCH WIRKLICH LIEGT.

   ~/Desktop zu raten geht oft gut und manchmal schief. Unter Windows
   biegt OneDrive ihn nach %USERPROFILE%\OneDrive\Desktop um - bei sehr
   vielen Rechnern ist das die Voreinstellung -, und unter Linux heisst
   er je nach Sprache anders. Das System weiss es; also fragen wir es,
   statt zu raten. */
function schreibtisch() {
  const heim = os.homedir();
  if (process.platform === 'win32') {
    const e = spawnSync('powershell', ['-NoProfile', '-Command',
      "[Environment]::GetFolderPath('Desktop')"], { encoding: 'utf8' });
    const w = String(e.stdout || '').trim();
    if (w && fs.existsSync(w)) return w;
  }
  if (process.platform === 'linux') {
    const e = spawnSync('xdg-user-dir', ['DESKTOP'], { encoding: 'utf8' });
    const w = String(e.stdout || '').trim();
    if (w && fs.existsSync(w)) return w;
  }
  for (const n of ['Desktop', 'Schreibtisch', 'Bureau', 'Escritorio']) {
    const d = path.join(heim, n);
    if (fs.existsSync(d)) return d;
  }
  return null;
}

function schreibtischVerknuepfung(ordner) {
  /* IMMER, MIT SYMBOL, UND SIE STARTET ALLES. Caspar_D, 13.09.2026: „um
     den Server zu starten, soll das Setup einen Link auf den Desktop
     legen, immer - wer das nicht will, loesche ihn einfach - und wenn es
     geht mit dem KlangTresor-Icon des Favicons. Der Link startet den
     Server und ruft den Browser, praeferenziell Chrome, auf mit Fallback
     auf den Systembrowser, und zeigt die Uebersicht."
     Das tut bin/starten.js; die Verknuepfung zeigt darauf. Das Symbol
     liegt als .ico/.icns/.png in web/symbol/, aus dem Favicon gebaut. */
  const desk = schreibtisch();
  if (!desk) return null;
  try {
    if (process.platform === 'win32') {
      const lnk = path.join(desk, 'KlangTresor.lnk');
      const ps = [
        '$w = New-Object -ComObject WScript.Shell',
        `$s = $w.CreateShortcut(${JSON.stringify(lnk)})`,
        `$s.TargetPath = ${JSON.stringify(path.join(ordner, 'starten-windows.cmd'))}`,
        `$s.WorkingDirectory = ${JSON.stringify(ordner)}`,
        `$s.IconLocation = ${JSON.stringify(path.join(ordner, 'web', 'symbol', 'klangtresor.ico') + ',0')}`,
        '$s.Description = "KlangTresor starten"',
        '$s.Save()',
      ].join('; ');
      spawnSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'ignore' });
      return fs.existsSync(lnk) ? lnk : null;
    }
    if (process.platform === 'darwin') {
      /* Ein kleines Programmbuendel: das ist auf dem Mac der einzige Weg zu
         einem Doppelklick-Symbol mit eigenem Bild. */
      const app = path.join(desk, 'KlangTresor.app');
      fs.rmSync(app, { recursive: true, force: true });
      fs.mkdirSync(path.join(app, 'Contents', 'MacOS'), { recursive: true });
      fs.mkdirSync(path.join(app, 'Contents', 'Resources'), { recursive: true });
      fs.writeFileSync(path.join(app, 'Contents', 'Info.plist'), `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>KlangTresor</string>
  <key>CFBundleIdentifier</key><string>de.klangtresor.starter</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleExecutable</key><string>KlangTresor</string>
  <key>CFBundleIconFile</key><string>klangtresor</string>
  <key>LSMinimumSystemVersion</key><string>10.13</string>
</dict></plist>
`);
      fs.copyFileSync(path.join(ordner, 'web', 'symbol', 'klangtresor.icns'), path.join(app, 'Contents', 'Resources', 'klangtresor.icns'));
      const exe = path.join(app, 'Contents', 'MacOS', 'KlangTresor');
      /* Der Starter selbst ist starten-macos.command im Projektordner -
         dieselbe Datei, die man auch von Hand doppelklicken kann. Das
         Ausfuehrungsrecht kann beim Entpacken verlorengehen; hier wird es
         sicherheitshalber gesetzt. */
      const starter = path.join(ordner, 'starten-macos.command');
      try { fs.chmodSync(starter, 0o755); } catch (e) {}
      fs.writeFileSync(exe, `#!/bin/bash
# KlangTresor starten - angelegt von bin/einrichten.js
open -a Terminal ${JSON.stringify(starter)}
`, { mode: 0o755 });
      return app;
    }
    const d = path.join(desk, 'klangtresor.desktop');
    const starter = path.join(ordner, 'starten-linux.sh');
    try { fs.chmodSync(starter, 0o755); } catch (e) {}
    fs.writeFileSync(d, ['[Desktop Entry]', 'Type=Application', 'Name=KlangTresor',
      'Comment=Dein eigenes Suno-Archiv', `Exec=${JSON.stringify(starter)}`,
      `Path=${ordner}`, `Icon=${path.join(ordner, 'web', 'symbol', 'klangtresor-256.png')}`, 'Terminal=true', ''].join('\n'), { mode: 0o755 });
    return d;
  } catch (e) { return null; }
}

/* =================================================================== */
(async function haupt() {
  /* DAS MITGEBRACHTE NODE MUSS IN DEN PATH.

     Hat der Anlasser Node selbst geholt - also genau auf dem Rechner,
     fuer den er gebaut ist -, liegt es in werkzeug/node und ist NICHT im
     PATH. Der Anlasser ruft es mit absolutem Pfad auf. Damit findet der
     Schritt „Pakete holen" spaeter kein `npm`, obwohl es direkt daneben
     liegt, und der Mensch liest „Ohne die Pakete startet der Server
     nicht." - auf einem Rechner, auf dem alles vorhanden ist.

     process.execPath ist das Node, das GERADE laeuft; npm liegt in
     demselben Verzeichnis. Dieselbe Falle war in starten-windows.cmd
     am 11.09.2026 schon erkannt und dort behoben - hier nicht.
     Gefunden in der Pruefung vor der Veroeffentlichung. */
  process.env.PATH = path.dirname(process.execPath) + path.delimiter + process.env.PATH;

  /* DIE SEITE. Ein winziger Server nur fuer diesen Lauf, nur auf
     127.0.0.1, auf dem ersten freien Port ab 8790. Er liefert
     web/einrichtung/index.html, den Zustand als JSON, nimmt Antworten
     entgegen und oeffnet auf Wunsch den Ordnerdialog des Systems. Geht
     kein Browser auf, laeuft die Konsole wie immer weiter. */
  if (!NUR_TEXT) {
    const http = require('node:http');
    const SEITE = path.join(WURZEL, 'web', 'einrichtung');
    const rumpf = (req) => new Promise((f) => { let s = ''; req.on('data', (c) => { s += c; if (s.length > 65536) req.destroy(); }); req.on('end', () => f(s)); });
    const antwort = (res, code, typ, inhalt) => { res.writeHead(code, { 'Content-Type': typ, 'Cache-Control': 'no-store' }); res.end(inhalt); };
    const srv = http.createServer(async (req, res) => {
      const u = new URL(req.url, 'http://x');
      try {
        if (u.pathname === '/' || u.pathname === '/index.html') return antwort(res, 200, 'text/html; charset=utf-8', fs.readFileSync(path.join(SEITE, 'index.html')));
        if (u.pathname === '/anreisser.json') return antwort(res, 200, 'application/json; charset=utf-8', fs.readFileSync(path.join(SEITE, 'anreisser.json')));
        if (u.pathname === '/stand') return antwort(res, 200, 'application/json; charset=utf-8', JSON.stringify(ZUSTAND));
        if (u.pathname === '/antwort' && req.method === 'POST') {
          let d = {}; try { d = JSON.parse(await rumpf(req) || '{}'); } catch (e) {}
          const ok = antwortVonSeite(d.id, d.wert);
          if (ok) schreib(HELL(String(d.wert == null ? '' : d.wert)) + MATT('   (aus der Seite)'));
          return antwort(res, 200, 'application/json', JSON.stringify({ ok }));
        }
        if (u.pathname === '/ordner' && req.method === 'POST') {
          let d = {}; try { d = JSON.parse(await rumpf(req) || '{}'); } catch (e) {}
          const pfad = require('./ordnerdialog.js').ordnerWaehlen(os.homedir(), String(d.titel || 'Ordner wählen').slice(0, 120));
          return antwort(res, 200, 'application/json', JSON.stringify({ pfad: pfad || null }));
        }
        return antwort(res, 404, 'text/plain', 'nicht da');
      } catch (e) { return antwort(res, 500, 'text/plain', String(e.message)); }
    });
    const horchen = (port) => new Promise((f) => {
      srv.once('error', () => f(false));
      srv.listen(port, '127.0.0.1', () => f(true));
    });
    let port = 8790;
    while (port < 8840 && !(await horchen(port))) port++;
    if (srv.listening) {
      ZUSTAND.adresse = `http://127.0.0.1:${port}/`;
      const inChrome = OHNE_BROWSER ? false : seiteAufmachen(ZUSTAND.adresse);
      matt(`Die Einrichtung läuft auch als Seite: ${ZUSTAND.adresse}` + (inChrome ? ' (Chrome)' : ''));
      matt('Hier im Fenster siehst du dasselbe — und hier kannst du auch antworten.');
      srv.unref();
    }
  }

  marke();

  if (!quellenLesen()) {
    boese('quellen.txt fehlt — dort stehen die Adressen der Werkzeuge.');
    matt('Die Datei gehört neben package.json. Aus dem Paket von GitHub ist sie dabei.');
    leer(); schluss(1);
  }

  /* ================================================================
     WOHIN KLANGTRESOR GEHOERT - UND ZWAR BEVOR ETWAS GEHOLT WIRD.

     Caspar_D, 13.09.2026: „warum erst irgendwo hinlegen und verschieben,
     warum nicht gleich an die richtige stelle".

     Bis hierher hielt KlangTresor den Ort, an dem das Zip entpackt
     wurde, fuer sein Zuhause. Das ist falsch. Der entpackte Ordner ist
     etwas Voruebergehendes - ein Download. Ein Programm, dessen Archiv
     auf zehn Gigabyte anwaechst, hat im Download-Ordner nichts verloren,
     und schon gar nicht auf einer Netzfreigabe, wo unter Windows die
     Pakete scheitern.

     Also entscheidet die Einrichtung das jetzt selbst: sie schlaegt ein
     Zuhause vor, zieht sich dorthin um und macht dort weiter. Der
     entpackte Ordner darf danach weg.

     Umziehen heisst KOPIEREN und neu starten, nicht verschieben: der
     laufende Ordner ist in Benutzung, unter Windows gesperrt. Der alte
     bleibt liegen und wird am Ende genannt. */
  /* DER ORDNERDIALOG DES SYSTEMS, nicht unser eigener.

     Caspar_D, 13.09.2026: „Ich hatte mir das eigentlich so vorgestellt,
     dass ein Filechooser aufgeht und ich selbst bestimme, wo die
     Installation stattfindet, mit Default User-Home/KlangTresor."

     Jedes System bringt einen mit, und der Mensch kennt ihn. Ein
     selbstgebauter waere fremd und schlechter. Gewaehlt wird der
     ELTERNORDNER - darin wird „KlangTresor" angelegt. Das ist
     eindeutig; ein Dialog, bei dem unklar ist, ob man den Ordner selbst
     oder seinen Platz waehlt, ist eine Falle.

     Geht kein Dialog auf (kein Bildschirm, ferngesteuerte Sitzung,
     zenity fehlt), wird nicht gefragt, sondern die Vorgabe genommen. */
  const ordnerWaehlenRoh = require('./ordnerdialog.js').ordnerWaehlen;
  const ordnerWaehlen = (vorgabe) => ordnerWaehlenRoh(vorgabe, 'Wo soll KlangTresor liegen? Es wird ein Ordner „KlangTresor" darin angelegt.');

  function heimatVorschlag() {
    const heim = os.homedir();
    return path.join(heim, 'KlangTresor');
  }

  function mussUmziehen(p) {
    const q = p.replace(/\\/g, '/');
    if (process.platform === 'win32' && q.startsWith('//')) return 'auf einer Netzfreigabe';
    if (/\/(downloads|download)(\/|$)/i.test(q))            return 'im Download-Ordner';
    if (/\/(temp|tmp)(\/|$)/i.test(q))                       return 'in einem temporären Ordner';
    if (/^klangtresor[-_]?(main|master)$/i.test(path.basename(p))) return 'in einem Ordner, den GitHub benannt hat';
    return null;
  }

  /* WO SOLL ES HIN - DREI ZEILEN, EINE TASTE.

     Caspar_D, 13.09.2026: „ich faende gut, wenn du schon bei Start des
     Einrichten-Scripts sagen wuerdest: Du bist hier in Ordner XYZ (dort
     wo das Zip ausgepackt wurde). D - per default wird dein KlangTresor
     genau hier installiert. N - alternativ kann der KlangTresor in
     deinem Nutzerverzeichnis (n GB frei) installiert werden. Dann liegt
     alles bei deinen Daten. Denke aber daran, dass der KlangTresor fuer
     das Funktionieren ALLER Features ziemlich viel Platz braucht."

     Genau so, plus eine dritte Zeile fuer die externe Platte, die er
     vorher wollte. Die Vorgabe ist „hier" - ausser hier ist der
     Download-Ordner oder eine Netzfreigabe, dann ist die Vorgabe das
     Nutzerverzeichnis, und die erste Zeile sagt warum. */
  const gbFrei = (p) => {
    let q = p;
    while (q && !fs.existsSync(q) && path.dirname(q) !== q) q = path.dirname(q);
    const f = freierPlatz(q);
    return f === null ? null : f / 1073741824;
  };
  const gbText = (g) => g === null ? '' : `  (${g.toFixed(0)} GB frei)`;

  const grund = mussUmziehen(WURZEL);
  const schonZuhause = !grund && path.basename(WURZEL) === 'KlangTresor';
  const heimZiel = path.join(os.homedir(), 'KlangTresor');
  let ziel = WURZEL;

  if (schonZuhause) {
    matt('KlangTresor liegt hier, und hier bleibt es:');
    satz(HELL('  ' + WURZEL) + MATT(gbText(gbFrei(WURZEL))));
  } else {
    matt('Du bist hier — dort, wo das Zip ausgepackt wurde:');
    satz(HELL('  ' + WURZEL) + MATT(gbText(gbFrei(WURZEL))));
    { const wo = ortInWorten(WURZEL); if (wo) matt('  ' + wo); }
    leer();
    const vorgabe = grund ? 'n' : 'd';
    satz(HELL('  [D]') + MATT('  hier bleiben — KlangTresor wird genau in diesem Ordner eingerichtet'));
    if (grund) matt('       Achtung: das liegt ' + grund + ' — dort wird gern aufgeräumt' +
                    (grund.includes('Netz') ? ', und die Pakete scheitern' : '') + '.');
    satz(HELL('  [N]') + MATT('  in dein Nutzerverzeichnis: ') + HELL(heimZiel) + MATT(gbText(gbFrei(heimZiel))));
    matt('       Dann liegt alles bei deinen Daten.');
    satz(HELL('  [W]') + MATT('  woanders — ein Fenster geht auf, du wählst (etwa eine externe Platte)'));
    leer();
    matt('Denk daran: für alle Funktionen braucht KlangTresor ziemlich viel Platz.');
    matt('Die Einrichtung selbst rund 500 MB — dazu je Titel bis zu 100 MB, wenn');
    matt('WAV und Instrumentspuren dabei sind. Bei 200 Titeln sind das rund 20 GB.');
    leer();
    const antwort = (await fragen('     ' + AKZENT(`Wohin? [${vorgabe === 'd' ? 'D' : 'd'}/${vorgabe === 'n' ? 'N' : 'n'}/w] `),
      { art: 'wahl', text: 'Wohin soll KlangTresor?', vorgabe,
        hinweis: (grund ? `Achtung: das hier liegt ${grund} - dort wird gern aufgeräumt. ` : '') + `Nutzerverzeichnis: ${heimZiel}`,
        optionen: [
          { wert: 'd', label: 'Hier bleiben', vor: vorgabe === 'd' },
          { wert: 'n', label: 'In mein Nutzerverzeichnis', vor: vorgabe === 'n' },
          { wert: 'w', label: 'Woanders - Ordner wählen …' }] })).toLowerCase() || vorgabe;
    if (antwort.startsWith('n')) ziel = heimZiel;
    else if (antwort.startsWith('w')) {
      const eltern = ordnerWaehlen(os.homedir());
      if (eltern) ziel = path.basename(eltern) === 'KlangTresor' ? eltern : path.join(eltern, 'KlangTresor');
      else { matt('Kein Ordner gewählt — dann bleibt es hier.'); ziel = WURZEL; }
    }
    leer();
    satz(MATT('Ziel:  ') + HELL(ziel));
  }

  /* Der freie Platz DORT, wo das Archiv hinkommt. Fuer einen Ordner, den
     es noch nicht gibt, zaehlt sein naechster vorhandener Elternordner. */
  {
    let p = ziel;
    while (p && !fs.existsSync(p) && path.dirname(p) !== p) p = path.dirname(p);
    const frei = freierPlatz(p);
    if (frei !== null) {
      const gb = frei / 1073741824;
      if (gb < 20) {
        wink(`Dort sind nur ${gb.toFixed(1)} GB frei.`);
        matt('Die Einrichtung selbst braucht rund 500 MB, aber dein Archiv wächst mit');
        matt('jedem Lied — bei ein paar hundert Titeln sind es schnell zehn GB und mehr.');
        matt('Eine externe Platte ist dafür völlig in Ordnung. Trotzdem hier?');
        leer();
        if (!await jaNein('Hier weitermachen?', 'n')) { wiederkommen(); schluss(0); }
      } else {
        gut(`Dort sind ${gb.toFixed(0)} GB frei — das reicht lange.`);
      }
    }
  }
  leer();

  if (path.resolve(ziel) !== path.resolve(WURZEL)) {
    const zielBelegt = fs.existsSync(ziel) && fs.readdirSync(ziel).filter((n) => n !== '.DS_Store').length;
    const zielIstKlangTresor = zielBelegt &&
      fs.existsSync(path.join(ziel, 'package.json')) && fs.existsSync(path.join(ziel, 'bin'));

    if (zielBelegt && !zielIstKlangTresor) {
      wink('Dort liegt schon etwas anderes — das fasse ich nicht an.');
      matt('Räum es weg oder benenn es um, dann starte noch einmal.');
      matt('Oder lass KlangTresor hier liegen; es kann gutgehen.');
      leer();
      if (!await jaNein('Hier weitermachen?', 'n')) { wiederkommen(); schluss(0); }
    } else {
      /* Kopieren und dort neu starten. Liegt am Ziel schon ein
         KlangTresor, ist das der Aktualisierungsfall: Programmdateien
         darueber, alles Geholte bleibt - library/, werkzeug/,
         node_modules/. Vorher hiess es hier "raeum es weg"; fuer ein
         Update genau verkehrt. */
      if (zielIstKlangTresor) {
        gut('Dort liegt schon ein KlangTresor — ich aktualisiere ihn.');
        matt('Dein Archiv, die Werkzeuge und die Pakete bleiben, nur das Programm wird erneuert.');
      } else tut('Umziehen …');
      const bleibt = new Set(['library', 'werkzeug', 'node_modules', '.git', 'proben']);
      let gezogen = false;
      try {
        fs.mkdirSync(ziel, { recursive: true });
        for (const n of fs.readdirSync(WURZEL)) {
          if (n === '.DS_Store') continue;
          if (zielIstKlangTresor && bleibt.has(n)) continue;
          fs.cpSync(path.join(WURZEL, n), path.join(ziel, n), { recursive: true, force: true, dereference: false });
        }
        gezogen = fs.existsSync(path.join(ziel, 'bin', 'einrichten.js'));
      } catch (e) {
        boese('Das ging nicht: ' + String(e.message).slice(0, 120));
      }
      if (gezogen) {
        gut('Liegt jetzt in ' + ziel + '.');
        matt('Ich mache dort weiter — dieses Fenster bleibt, du siehst alles.');
        matt('Den entpackten Ordner darfst du danach wegwerfen.');
        leer();
        leser.close();
        const e = spawnSync(process.execPath,
          [path.join(ziel, 'bin', 'einrichten.js'), ...process.argv.slice(2)],
          { stdio: 'inherit', cwd: ziel });
        process.exit(e.status === null ? 1 : e.status);
      }
      matt('Ich mache hier weiter, wo ich bin.');
      leer();
    }
  }

  wink('Bevor du anfängst — zwei Sätze zu deinen Suno-Titeln und ihren Audiodateien:');
  matt('Deine Titelbilder, Texte, Zahlen und deine ganze Suno-Geschichte holt');
  matt('KlangTresor selbst. Beim Ton gibt es zwei Wege, und der erste kostet');
  matt('nichts.');
  leer();
  satz(HELL('  1. Was du schon hast.'));
  matt('  Hast du deine Lieder bei Suno früher heruntergeladen? In deinen');
  matt('  Download- und Musikordnern sehe ich von selbst nach; liegen sie');
  matt('  woanders, zeig mir den Ordner. Ich erkenne die');
  matt('  Dateien am Inhalt, nicht am Namen, auch umbenannte, auch in');
  matt('  Unterordnern, und ordne sie deinen Titeln zu. Das ist der');
  matt('  Hauptweg, und er kostet nichts.');
  leer();
  satz(HELL('  2. Was dir fehlt.'));
  matt('  Suno gibt Audiodateien seit dem 03.09.2026 nicht mehr über Links');
  matt('  heraus, auch dem Besitzer nicht. Was du nicht schon hast, musst du');
  matt('  bei Suno einmal freischalten: Drei Punkte, Download, „Unlock and');
  matt('  Download". Das kostet ein Guthaben aus deinem Download-Kontingent,');
  matt('  gilt dann aber dauerhaft und für alle Formate.');
  leer();
  matt('Ohne bezahlten Plan ist nur der zweite Weg versperrt. Der erste bleibt');
  matt('offen, und alles andere funktioniert ohnehin.');
  leer();
  matt('Am besten legst du dir jetzt schon zurecht, wo dein Suno-Zeug liegt.');
  matt('Und wenn du bei Suno etwas freischalten willst: jetzt ist ein guter');
  matt('Moment, dann liegt es bereit, wenn ich danach frage.');
  leer();
  if (!chromeFinden()) {
    wink('Noch etwas: Chrome ist nicht installiert.');
    matt('Zum Hören und Stöbern reicht jeder Browser. Für die Daten, die nur du');
    matt('sehen darfst — unveröffentlichte Titel, wer geherzt und kommentiert hat —');
    matt('braucht es aber Chrome. Das lässt sich auch später nachholen.');
    leer();
  }
  if (!await jaNein('Verstanden, weiter?')) {
    matt('Dann bis später. Das Einrichten läuft nicht weg.');
    wiederkommen(); schluss(0);
  }

  leer();
  matt('Beim ersten Mal werden rund 450 MB geholt. Wie lange das dauert, hängt');
  matt('an deiner Leitung — von wenigen Minuten bis zu einer halben Stunde.');
  leer();
  matt('Lass das Fenster am besten offen, dann siehst du sofort, ob es gut');
  matt('läuft oder ob es hakt. Bei Abbruch kann man einfach von diesem Stand');
  matt('fortsetzen.');
  leer();
  /* Caspar_D, 13.09.2026, nach einer halben Stunde Fehlersuche an einem
     Fenster, das gar nicht haengen geblieben war: „das musst du als
     ausgabe ganz am Anfang hinschreiben, dass sowas passieren kann".

     Windows-Konsolen haben QuickEdit standardmaessig an: EIN KLICK ins
     Fenster schaltet in den Markierungsmodus und HAELT DEN PROZESS AN -
     mitten in der Ausgabe, ohne Hinweis ausser einem Wort in der
     Titelleiste. Es sieht nach Absturz aus und ist keiner. */
  /* Nur Windows. Auf Mac und Linux gibt es den Markierungsmodus nicht,
     und eine Warnung vor etwas, das es nicht gibt, ist schlechter als
     keine. */
  if (process.platform === 'win32') {
    wink('Wenn es plötzlich stehenbleibt: einmal Escape drücken.');
    matt('Ein Klick ins Fenster schaltet Windows in den Markierungsmodus und');
    matt('hält alles an — es sieht nach Absturz aus, ist aber keiner. Escape');
    matt('löst es wieder. Am besten gar nicht erst hineinklicken.');
  }

  /* ================================================================ */
  schritt('Rechte und Platz prüfen');

  if (!darfSchreiben(WURZEL)) {
    boese('In diesen Ordner darf ich nicht schreiben.');
    matt('KlangTresor legt hier seine Werkzeuge und sein Archiv ab — ohne');
    matt('Schreibrecht geht das nicht.');
    leer();
    matt('Verschiebe den Ordner an einen Platz, der dir gehört, zum Beispiel');
    matt(process.platform === 'win32' ? '  C:\\Users\\<du>\\KlangTresor' : '  ~/KlangTresor');
    leer(); schluss(1);
  }
  gut('Schreibrecht im Projektordner: ja.');

  if (imSystemordner(WURZEL)) {
    wink('Dieser Ordner liegt in einem Systembereich.');
    matt('Das geht meist eine Weile gut und bricht dann an einer Stelle, die');
    matt('niemand vermutet. Besser wäre ein Ordner, der dir selbst gehört.');
    leer();
    if (!await jaNein('Trotzdem hier bleiben?', 'n')) { wiederkommen(); schluss(0); }
  }

  if (erhoeht()) {
    wink('Das läuft gerade mit erhöhten Rechten (Administrator bzw. root).');
    matt('Gebraucht wird das NICHT — KlangTresor schreibt nur in seinen eigenen');
    matt('Ordner. Es schadet aber: alles Angelegte gehört danach dem Verwalter,');
    matt('und im Alltag kommst du an dein eigenes Archiv nicht mehr heran.');
    leer();
    matt('Besser: dieses Fenster schließen und ohne erhöhte Rechte neu starten.');
    leer();
    if (!await jaNein('Trotzdem so weitermachen?', 'n')) { wiederkommen(); schluss(0); }
  } else {
    gut('Keine erhöhten Rechte nötig — und es laufen auch keine.');
  }

  /* Platz: rund 500 MB fuer Werkzeuge, Pakete und Modelle. Das ARCHIV
     kommt danach und kann ein Vielfaches werden - darum wird die Zahl
     genannt und nicht nur geprueft. */
  const platz = freierPlatz(WURZEL);
  if (platz === null) {
    matt('Freien Platz konnte ich nicht ermitteln — ich mache weiter.');
  } else if (platz < 1073741824) {
    boese(`Hier sind nur ${MB(platz)} frei. Für die Einrichtung braucht es rund 500 MB,`);
    matt('und das Archiv kommt danach erst noch dazu.');
    leer();
    if (!await jaNein('Trotzdem versuchen?', 'n')) { wiederkommen(); schluss(0); }
  } else {
    gut(`Platz: ${(platz / 1073741824).toFixed(1)} GB frei — die Einrichtung braucht rund 500 MB.`);
  }

  /* Ein Projekt auf einer Netzwerkfreigabe ist unter Windows heikel:
     cmd.exe nimmt UNC-Pfade nicht als Arbeitsverzeichnis, und manches
     Werkzeug stolpert darueber. npm umgehen wir inzwischen, aber sagen
     sollte man es trotzdem. */
  if (process.platform === 'win32' && WURZEL.startsWith('\\\\')) {
    leer();
    wink('KlangTresor liegt nicht auf dieser Maschine.');
    matt(`  ${WURZEL}`);
    { const wo = ortInWorten(WURZEL); if (wo) matt(`  ${wo}`); }
    matt('Windows kommt mit solchen Pfaden nur halb zurecht: manche Werkzeuge');
    matt('springen stillschweigend nach C:\\Windows. npm gehört dazu, und ich');
    matt('helfe ihm gleich mit einem Kniff darüber hinweg — verlassen würde');
    matt('ich mich darauf nicht.');
    leer();
    matt('Sicherer ist ein Ordner auf der Platte dieses Rechners, etwa');
    matt('C:\\Users\\<du>\\KlangTresor. Wenn du jetzt abbrichst, den Ordner');
    matt('dorthin verschiebst und neu startest, bleibt alles Geholte erhalten.');
  }

  /* ================================================================ */
  schritt('Nachsehen, wo wir stehen');

  for (const n of ['package.json', 'bin', 'server', 'web']) {
    if (!fs.existsSync(path.join(WURZEL, n))) {
      boese('Das sieht nicht nach KlangTresor aus.');
      matt(`Hier fehlt ${n}. Beim Aktualisieren gehört der INHALT des Pakets in`);
      matt('den bestehenden Ordner, nicht der ausgepackte Ordner daneben.');
      leer(); schluss(1);
    }
  }

  /* Woran man ein Archiv erkennt: am KATALOG. Nicht an library/roh/ —
     der ist im gesunden Betrieb leer, weil aufbereiten.js ihn abräumt. */
  const katalogDa = fs.existsSync(path.join(WURZEL, 'library/katalog.json.gz')) ||
                    fs.existsSync(path.join(WURZEL, 'library/katalog.json'));
  let songs = 0;
  try { songs = fs.readdirSync(path.join(WURZEL, 'library/songs')).length; } catch (e) {}

  if (katalogDa || songs > 0) {
    gut(`Hier liegt ein KlangTresor-Archiv: ${songs} Songs.`);
    matt('Es wird ergänzt, nichts überschrieben.');
    leer();
    if (!await jaNein('Weiter?')) { wiederkommen(); schluss(0); }
  } else {
    /* Caspar_D, 24.08.2026: „Hier kann wirklich am meisten schief gehen."
       Wer den ausgepackten Ordner NEBEN das Archiv legt und dort startet,
       lädt alles neu — und zurück kommen 2,7 von 44 GB. Darum wird nicht
       gefragt, sondern nachgesehen, auch nebenan. */
    let nachbar = null;
    try {
      for (const n of fs.readdirSync(path.dirname(WURZEL))) {
        const p = path.join(path.dirname(WURZEL), n);
        if (p === WURZEL) continue;
        if (fs.existsSync(path.join(p, 'library/katalog.json.gz')) ||
            fs.existsSync(path.join(p, 'library/katalog.json'))) { nachbar = p; break; }
      }
    } catch (e) {}
    if (nachbar) {
      wink('Hier ist kein KlangTresor-Archiv — aber nebenan liegt eines:');
      satz('    ' + HELL(nachbar));
      leer();
      matt('Vermutlich ist das der Ordner, der gemeint war. Beim Aktualisieren');
      matt('gehört der INHALT dieses Pakets dorthin, nicht der Ordner daneben.');
      matt('Fängst du hier neu an, wird alles neu geladen — und zurück kommen');
      matt('Titelbilder und Bewegtbilder, aber keine WAV und keine Instrumentspuren.');
      leer();
      if (!await jaNein('Trotzdem hier neu anfangen?', 'n')) { wiederkommen(); schluss(0); }
    } else {
      gut('Hier ist noch kein KlangTresor-Archiv. Ich lege eines an.');
      leer();
      if (!await jaNein('Weiter?')) { wiederkommen(); schluss(0); }
    }
  }

  if (await jemandAufPort(8788)) {
    leer();
    wink('Auf Port 8788 antwortet bereits ein KlangTresor.');
    matt('Solange der läuft, kann dieser hier nicht starten — und der Browser');
    matt('würde den anderen zeigen. Erst dort das Fenster mit Strg-C beenden.');
    leer();
    if (!await jaNein('Trotzdem weitermachen?', 'n')) { wiederkommen(); schluss(0); }
  }

  /* ================================================================ */
  schritt('ffmpeg bereitstellen');
  matt('Für Klanganalyse, Wellenformen und den Videoschnitt.');

  const ffEigen = path.join(WERKZEUG, 'ffmpeg', 'bin',
    process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  /* Liegt es schon auf diesem Rechner? Dann kopieren statt hundert
     Megabyte noch einmal durch die Leitung zu ziehen. */
  if (!fs.existsSync(ffEigen) && !da('ffmpeg')) ausLager('ffmpeg', path.join(WERKZEUG, 'ffmpeg'));
  let ffmpeg = fs.existsSync(ffEigen) ? ffEigen : da('ffmpeg');
  if (ffmpeg) {
    gut(`ffmpeg ist da: ${ffmpeg}`);
  } else if (process.platform !== 'win32') {
    /* Auf Mac und Linux gibt es einen Paketverwalter, der es besser kann
       als ein Download an ihm vorbei. */
    wink('ffmpeg fehlt.');
    matt(process.platform === 'darwin' ? '  brew install ffmpeg' : '  sudo apt install ffmpeg');
    matt('Danach dieses Einrichten noch einmal starten — es macht hier weiter.');
  } else {
    const url = QUELLEN['ffmpeg-windows'];
    if (!url) wink("In quellen.txt fehlt die Zeile 'ffmpeg-windows' — ich mache ohne weiter.");
    else {
      let versuche = true;
      while (versuche && !ffmpeg) {
        tut('ffmpeg holen — rund 100 MB.');
        fs.mkdirSync(WERKZEUG, { recursive: true });
        const zip = path.join(WERKZEUG, 'ffmpeg.zip');
        const roh = path.join(WERKZEUG, '_ff_roh');
        if (await holen(url, zip, 'ffmpeg') && auspacken(zip, roh)) {
          einenOrdnerHeben(roh, path.join(WERKZEUG, 'ffmpeg'));
          try { fs.rmSync(zip, { force: true }); } catch (e) {}
          if (fs.existsSync(ffEigen)) {
            ffmpeg = ffEigen; gut('ffmpeg liegt jetzt in werkzeug/ffmpeg.');
            insLager('ffmpeg', path.join(WERKZEUG, 'ffmpeg'));
          }
        }
        if (!ffmpeg) {
          const w = await wieWeiter('ffmpeg holen',
            'Ohne ffmpeg läuft alles — nur Klangmessung und Videoschnitt fehlen.');
          if (w === 'schluss') { wiederkommen(); schluss(0); }
          if (w === 'ueber') { wink('Weiter ohne ffmpeg. Ein späterer Lauf holt es nach.'); versuche = false; }
        }
      }
    }
  }
  if (ffmpeg) {
    process.env.PATH = path.dirname(ffmpeg) + path.delimiter + process.env.PATH;
    /* Damit der Starter und der Morgenlauf dieselben Werkzeuge finden,
       ohne dass jemand am PATH des Systems dreht. */
    fs.mkdirSync(WERKZEUG, { recursive: true });
    fs.writeFileSync(path.join(WERKZEUG, 'werkzeug.txt'),
      '# Von bin/einrichten.js geschrieben. Löschen ist harmlos - dann wird neu gesucht.\n' +
      `node=${process.execPath}\nffmpeg=${ffmpeg}\n`);
  }

  /* ================================================================ */
  schritt('Pakete holen (npm install)');
  matt('Ein bis fünf Minuten, und zwischendurch ist es still.');
  /* NPM OHNE EINGABEAUFFORDERUNG AUFRUFEN.

     `await laeuft()` startet unter Windows mit shell:true, also ueber cmd.exe -
     und cmd.exe WEIGERT SICH, einen UNC-Pfad als Arbeitsverzeichnis zu
     nehmen. Es springt stillschweigend nach C:\Windows und npm versucht
     dort package-lock.json anzulegen:

         UNC-Pfade werden nicht unterstuetzt.
         npm error EPERM: operation not permitted,
                   open 'C:\Windows\package-lock.json'

     Gemessen am 13.09.2026 in der Windows-10-Maschine, Projekt auf einer
     Freigabe unter \\psf\Home\... Es trifft jeden, der von einem
     Netzlaufwerk aus arbeitet - nicht nur Parallels.

     Der Ausweg: npm ist selbst ein Node-Programm. Rufen wir npm-cli.js
     direkt mit dem laufenden Node auf, ist gar keine Eingabeaufforderung
     im Spiel, und Node kommt mit UNC-Pfaden zurecht. */
  function npmAufruf() {
    const nd = path.dirname(process.execPath);
    for (const k of [path.join(nd, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
                     path.join(nd, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js')]) {
      /* --no-warnings: npm unter Node 22 meldet sonst eine ExperimentalWarning
         zu ES-Modulen - Rauschen, das der Mensch fuer einen Fehler haelt. */
      if (fs.existsSync(k)) return { befehl: process.execPath, vorn: ['--no-warnings', k] };
    }
    return { befehl: process.platform === 'win32' ? 'npm.cmd' : 'npm', vorn: [] };
  }
  /* UND NPM SELBST STARTET DOCH WIEDER cmd.exe.

     Auch wenn wir npm ohne Schale aufrufen: npm fuehrt die
     Installationsskripte seiner Pakete grundsaetzlich ueber
     `cmd.exe /d /s /c` aus. Bei onnxruntime-node ist das
     `node ./script/install` - und cmd.exe springt wieder nach
     C:\Windows, wo das Skript nicht liegt:

         npm error Cannot find module 'C:\Windows\script\install'

     Darauf haben wir keinen Zugriff; das steckt in npm.

     Der Kniff: `pushd` bildet einen UNC-Pfad auf einen freien
     Laufwerksbuchstaben ab. Darunter ist cmd.exe zufrieden - auch in
     npms eigenen Kindprozessen, denn die erben das Arbeitsverzeichnis.
     Der Buchstabe verschwindet mit der cmd-Sitzung von selbst. */
  async function npmLaufen(args) {
    const na = npmAufruf();
    if (process.platform === 'win32' && WURZEL.startsWith('\\\\')) {
      tut('Der Ordner liegt auf einer Freigabe — ich blende ihn kurz als Laufwerk ein.');
      const teile = [`pushd "${WURZEL}"`, '&&',
                     `"${na.befehl}"`, ...na.vorn.map((v) => `"${v}"`), ...args].join(' ');
      const e = spawnSync('cmd', ['/d', '/c', teile], { stdio: 'inherit' });
      return e.status === 0;
    }
    return laeuft(na.befehl, [...na.vorn, ...args]);
  }
  if (!npmLaufen(['install', '--no-fund', '--no-audit'])) {
    const w = await wieWeiter('npm install', 'Ohne die Pakete startet der Server nicht.');
    if (w !== 'ueber') { wiederkommen(); schluss(1); }
  } else gut('Pakete sind da.');

  /* ================================================================ */
  schritt('KI-Modelle holen (rund 550 MB)');
  matt('Stemtrennung und Musikstil. Klappt das nicht, läuft alles andere trotzdem.');
  const modelle = path.join(WURZEL, 'library', 'modelle');
  if (!fs.existsSync(modelle) || !fs.readdirSync(modelle).length) ausLager('modelle', modelle);
  if (!await laeuft(process.execPath, [path.join('bin', 'modelle-holen.js')])) {
    const w = await wieWeiter('Modelle holen', 'Ohne sie fehlen Stemtrennung und Musikstil — sonst nichts.');
    if (w === 'schluss') { wiederkommen(); schluss(0); }
    if (w === 'wieder') await laeuft(process.execPath, [path.join('bin', 'modelle-holen.js')]);
  } else { gut('Modelle sind da.'); insLager('modelle', modelle); }

  /* ================================================================
     AB HIER WIRD ERKLAERT, NICHT NUR GEMACHT.

     Caspar_D, 11.09.2026: „und nachher im script immer gut erklären,
     was passiert". Wer zum ersten Mal ein fremdes Programm auf seinen
     Rechner laesst und ihm dann auch noch seinen Musikbestand zeigt,
     hat ein Recht darauf zu wissen, was es tut - vorher, nicht danach.

     Drei Dinge werden deshalb ausdruecklich gesagt: WER hier bei Suno
     anklopft (ein Besucher, kein Angemeldeter), WAS dabei herkommt, und
     WAS NICHT - und was man tun muesste, wenn man auch das will. */
  schritt('Dein Suno-Name');
  matt('KlangTresor ist eingerichtet und bereit, deine Musik aufzunehmen.');
  leer();
  matt('Dazu melde ich mich bei Suno an wie jeder beliebige Besucher deiner');
  matt('Profilseite: nur lesend, ohne Passwort, ohne Anmeldung. Was ein');
  matt('Fremder sehen kann, kann ich holen. Alles andere kommt später.');
  leer();
  let handle = '';
  try { handle = JSON.parse(fs.readFileSync(path.join(WURZEL, 'library/konfig.json'), 'utf8')).handle || ''; } catch (e) {}
  if (handle) gut(`Gemerkt: @${handle}`);
  else {
    matt('Dein Suno-Name ist das, was hinter dem @ steht: Wenn deine Profilseite');
    matt('suno.com/@musikfreund heißt, ist es „musikfreund". Nicht deine');
    matt('E-Mail-Adresse und nicht der Anzeigename über deinen Liedern.');
    leer();
    /* Kleingeschrieben und ohne @ - so, wie Suno ihn fuehrt. Wer "Caspar_D"
       tippt, meint caspar_d; am 13.09.2026 fuehrte genau das zu einem
       leeren Katalog, weil der Wächter in aufbereiten.js buchstabengenau
       verglich. Dort ist es jetzt auch behoben; hier wird gar nicht erst
       Zweideutiges weitergegeben. */
    handle = (await fragen('     ' + AKZENT('Dein Suno-Name: '))).replace(/^@/, '').trim().toLowerCase();
  }
  if (!handle) { boese('Ohne den Namen geht es nicht weiter.'); wiederkommen(); schluss(1); }

  /* ================================================================ */
  schritt(`Songliste von @${handle} holen`);
  matt('Ich lese deine Profilseite durch, Seite für Seite, zwanzig Titel je');
  matt('Seite. Schnell geht das nicht, und das ist Absicht: ein fremder');
  matt('Server bekommt eine Anfrage nach der anderen, nie hundert auf einmal.');
  leer();
  matt('Was dabei hereinkommt: Titel, Liedtexte, Stilangaben, Modell und');
  matt('Datum — dazu Abrufe, Herzen und Kommentarzahlen, und die Alben,');
  matt('soweit sie öffentlich stehen.');
  leer();
  if (!await laeuft(process.execPath, [path.join('bin', 'sammeln.js'), handle])) {
    const w = await wieWeiter('Songliste holen', 'Ohne sie gibt es nichts zu archivieren.');
    if (w !== 'ueber') { wiederkommen(); schluss(1); }
  }
  /* DEN KATALOG GLEICH BAUEN, NICHT ERST IN SCHRITT 9.

     sammeln.js legt nur Rohdaten in library/roh/ ab; der Katalog
     entsteht in bin/aufbereiten.js. Ohne diesen Aufruf steht der
     naechste Schritt vor einem leeren Katalog - und bin/uebernehmen.js
     ordnet nur zu, was dort steht. Am 11.09.2026 im ersten echten
     Probelauf aufgefallen: alle 75 gefundenen Dateien landeten unter
     „Nicht im Katalog", ein frischer Nutzer haette keinen einzigen Ton
     bekommen, obwohl seine Dateien danebenlagen.

     Dieselbe Reihenfolge wie im Morgenlauf: Katalog, dann uebernehmen,
     dann laden. */
  matt('Ich ordne das Gesammelte zu einem Katalog — das dauert einen Moment.');
  if (!await laeuft(process.execPath, [path.join('bin', 'aufbereiten.js')])) {
    wink('Der Katalog ließ sich nicht bauen — der nächste Schritt findet dann nichts.');
  }

  /* Erst tun, dann benennen. Ein neuer Mensch kennt den „Morgenlauf"
     nicht - er kann ihn erst einordnen, wenn er einmal gesehen hat,
     was dabei passiert. */
  leer();
  matt('Genau das passiert von jetzt an jeden Morgen: KlangTresor sieht');
  matt('nach, was neu dazugekommen ist, und hält dein Archiv auf Stand.');
  matt('Einen Knopf dafür findest du später auf der Seite.');

  /* ================================================================
     DEIN EIGENES SUNO-ZEUG ZUERST.

     Caspar_D, 11.09.2026: „zeig mal den suno archiv her und du holst
     erstmal dort ab was geht mitsamt unterordnern? … und dann erst über
     den SunoServer?"

     Genau diese Reihenfolge, und sie ist auch die billigste:

       1. Was schon auf der Platte liegt — kostet nichts, braucht kein Netz.
       2. Was bei Suno freigeschaltet ist — kostet nichts (11.09. gemessen).
       3. Was ein Guthaben verlangt — das entscheidet ein Mensch.

     Seit dem 03.09.2026 gibt Suno den Ton nicht mehr über Links heraus.
     Wer seit 2025 dabei ist, hat aber meist alles schon einmal
     heruntergeladen und irgendwo liegen — und DAS ist der Bestand, den
     KlangTresor sonst nie wiederbekäme. */
  schritt('Deine Klangdateien');
  matt('Die Bibliothek steht. Es fehlt das Wichtigste: der Ton.');
  leer();
  matt('Suno gibt Audiodateien seit dem 03.09.2026 nicht mehr über Links');
  matt('heraus — auch dem Besitzer nicht. Ich kann sie also nicht einfach');
  matt('holen. Aber du hast sie vermutlich längst: Wer eine Weile dabei ist,');
  matt('hat seine Lieder heruntergeladen und irgendwo liegen.');
  leer();
  matt('Zeig mir, wo dein Suno-Zeug bisher lagert. Ich sehe dort nach, auch');
  matt('in Unterordnern, sechs Ebenen tief.');
  leer();
  matt('Erkannt wird am INHALT, nie am Dateinamen: Suno schreibt seine');
  matt('Kennung in den Kopf jeder Datei. Was sie nicht trägt, fasse ich');
  matt('nicht an — deine übrige Musik bleibt unberührt. Nichts wird');
  matt('verschoben und nichts gelöscht, nur kopiert.');
  leer();
  matt('In deinen Download- und Musikordnern sehe ich ohnehin nach — jetzt und');
  matt('bei jedem Abgleich. Nennen musst du nur, was woanders liegt. Taucht');
  matt('dasselbe Lied zweimal auf, ordne ich es einmal ein — welche Datei');
  matt('gemeint ist, sagt die Kennung, nicht der Name.');
  leer();
  /* KEIN PFADFELD. Caspar_D, 13.09.2026, zum dritten Mal: „hier wird
     immer noch nach einem Textpfad gefragt, nochmal, das kann kein DAU."
     Eine Ja/Nein-Frage, und bei Ja der Ordnerdialog des Systems - kein
     Mensch tippt einen Pfad. Ohne Bildschirm (Roehre, ferngesteuert)
     geht kein Dialog auf; dann bleibt es bei Download- und Musikordnern,
     und die Kommandozeile mit --ordner steht im Text. */
  matt('Liegen deine Suno-Dateien noch woanders — in einem Backup, auf einer');
  matt('externen Platte? Dann öffne ich ein Fenster, in dem du den Ordner wählst.');
  leer();
  let ordner = '';
  if (await jaNein('Ordner wählen?', 'n')) {
    ordner = ordnerWaehlenRoh(os.homedir(), 'Wo liegen deine Suno-Dateien?') || '';
    if (!ordner) {
      matt('Kein Ordner gewählt — dann nur Download- und Musikordner. Später jederzeit');
      matt('auf der Seite unter „Suno-Dateien aus einem weiteren Ordner einlesen".');
    }
  }

  const einlesen = [path.join('bin', 'uebernehmen.js'), '--tun'];
  if (ordner) {
    if (!fs.existsSync(ordner)) {
      wink(`Den Ordner gibt es nicht: ${ordner}`);
      matt('Ich sehe trotzdem im Download-Ordner nach. Später jederzeit:');
      matt('  node bin/uebernehmen.js --ordner /pfad/zum/ordner --tun');
    } else {
      einlesen.push('--ordner', ordner);
      matt('Der Pfad wird gemerkt: ich sehe von jetzt an bei jedem Abgleich');
      matt('auch dort nach, ohne dass du ihn noch einmal nennen musst.');
    }
  }
  leer();
  await laeuft(process.execPath, einlesen);

  /* ================================================================ */
  schritt('Titelbilder und Bewegtbilder laden');
  matt('Das dauert am längsten — abbrechen und später fortsetzen ist');
  matt('erlaubt, was da ist wird nicht noch einmal geholt.');
  if (PROBE.length) wink(`Probelauf: es werden nur ${PROBE[1]} Titel geholt.`);
  if (process.stdin.isTTY) {
    leer();
    wink('Escape unterbricht das Laden und startet KlangTresor für einen ersten Blick.');
    matt('Weitergeladen wird dann mit dem roten Knopf oben rechts im KlangTresor —');
    matt('was schon da ist, wird nicht noch einmal geholt.');
    leer();
  }
  {
    const e = await laeuftAbbrechbar(process.execPath, [path.join('bin', 'wiederherstellen.js'), ...PROBE]);
    if (e.abgebrochen) {
      leer();
      gut('Das Laden ist unterbrochen — der rote Knopf oben rechts holt später den Rest.');
    }
  }

  /* ================================================================
     DER EHRLICHE SCHLUSS: was ein Besucher NICHT sieht.

     Bis hierher lief alles ohne Anmeldung. Wer mehr will, muss das
     Lesezeichen einrichten - und der Grund dafuer gehoert dazu, sonst
     klingt es nach Schikane statt nach Vorsicht. */
  schritt('Zum Schluss: was ein Fremder nicht sehen darf');
  matt('Bis hierher war alles öffentlich. Was nur dir gehört, fehlt noch:');
  leer();
  satz(MATT('  · deine unveröffentlichten Titel, mit Abrufen und Herzen'));
  satz(MATT('  · wer dir gefolgt ist, wer geherzt, wer kommentiert hat —'));
  satz(MATT('    mit Namen und Zeitpunkt'));
  satz(MATT('  · deine Alben, auch die privaten'));
  satz(MATT('  · Sunos eigene Analyse: Tempo, Taktraster, Hüllkurve'));
  satz(MATT('  · die Wort-Zeitmarken für den mitlaufenden Text'));
  satz(MATT('  · und der Ton für alles, was du bei Suno schon freigeschaltet hast'));
  leer();
  matt('Dafür brauche ich dich, und das hat einen guten Grund. Der Ausweis,');
  matt('den Suno dafür verlangt, lebt etwa eine Minute und gilt nur im');
  matt('Browser. KlangTresor bekommt ihn nicht und soll ihn nicht bekommen:');
  matt('So liegt auf deiner Platte kein Schlüssel zu deinem Suno-Konto.');
  leer();
  matt('Deshalb sitzt das Werkzeug als Lesezeichen dort, wo du ohnehin');
  matt('angemeldet bist. Es kostet einen Klick, einmal am Tag.');
  leer();
  matt('Die KlangTresor-Seite geht gleich auf. Dort findest du den roten');
  matt('Knopf für den täglichen Abgleich — und darunter diese Frage:');
  leer();
  satz(HELL('  „Willst Du auch die nur Dir zugänglichen Daten'));
  satz(HELL('   im KlangTresor sehen?"'));
  leer();
  matt('Dahinter liegt das Lesezeichen zum Hineinziehen, samt Anleitung.');
  matt('Chrome wird dafür gebraucht — in anderen Browsern gibt es das nicht.');
  leer();
  matt('Der Ton, den du bei Suno freigeschaltet hast, kostet dabei nichts —');
  matt('ein Guthaben zahlst du nur beim Freischalten selbst, und das machst');
  matt('du bei Suno, nicht hier.');
  leer();
  matt('Das geht auch später jederzeit. KlangTresor läuft auch ohne.');

  /* ================================================================ */
  leer();
  schreib('  ' + MARKE('####') + '  ' + HELL('Fertig. KlangTresor ist eingerichtet.'));
  merken('schritt', 'Fertig. KlangTresor ist eingerichtet.');
  if (ZUSTAND.schritte[SCHRITT - 1]) ZUSTAND.schritte[SCHRITT - 1].zustand = 'fertig';
  ZUSTAND.fertig = true;
  leer();
  const netz = [];
  for (const [, liste] of Object.entries(os.networkInterfaces())) {
    for (const a of liste || []) {
      if (a.family === 'IPv4' && !a.internal) netz.push(a.address);
    }
  }
  { const v = schreibtischVerknuepfung(WURZEL);
    if (v) gut('Auf dem Schreibtisch liegt jetzt „KlangTresor" — damit startest du es künftig.');
    else matt('Zum späteren Starten: der Starter liegt in ' + WURZEL + '.'); }
  leer();
  satz(MATT('Adresse:  ') + MARKE('http://localhost:8788'));
  if (netz[0]) satz(MATT('Im WLAN:  ') + MARKE(`http://${netz[0]}:8788`));
  matt('Zum Beenden Strg-C. Später genügt der Starter im Projektordner.');
  leer();
  leser.close();
  if (OHNE_START) return;
  /* Erst aufmachen, dann starten: der Browser braucht laenger zum
     Hochkommen als der Server zum Horchen. */
  /* DIE FIREWALL FRAGT GLEICH. Sobald der Server auf 0.0.0.0:8788 horcht,
     zeigt Windows "Die Windows Defender Firewall hat einige Features
     dieser App blockiert" - fuer "Node.js JavaScript Runtime", mit
     "Oeffentliche Netzwerke" vorangehakt und "Private" NICHT. Wer da
     nur auf Zulassen klickt, hat KlangTresor im eigenen WLAN nicht
     erreichbar. Am 13.09.2026 im ersten Windows-Lauf gesehen. Also
     vorher sagen, was kommt und was anzuhaken ist. */
  if (process.platform === 'win32') {
    wink('Gleich fragt Windows, ob „Node.js JavaScript Runtime" ins Netzwerk darf.');
    matt('Das ist der KlangTresor-Server. Hake „Private Netzwerke" an — sonst');
    matt('erreichst du ihn im eigenen WLAN nicht, etwa vom Handy — und klicke');
    matt('„Zugriff zulassen". „Öffentliche Netzwerke" brauchst du nicht.');
    leer();
  }
  if (seiteAufmachen('http://localhost:8788')) gut('KlangTresor geht in Chrome auf.');
  else {
    wink('KlangTresor geht in deinem Standardbrowser auf — Chrome habe ich nicht gefunden.');
    matt('Zum Hören und Stöbern reicht jeder Browser. Nur das Lesezeichen für die');
    matt('Daten, die nur du sehen darfst, läuft ausschließlich in Chrome:');
    satz(MATT('  ') + MARKE('https://www.google.com/chrome/'));
  }
  await laeuft(process.execPath, [path.join('server', 'server.js')]);
})();
