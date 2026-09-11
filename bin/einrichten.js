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
const matt = (t) => schreib('     ' + MATT(t));
const satz = (t) => schreib('     ' + t);
const leer = () => schreib('');
const gut = (t) => schreib('     ' + GUT('[ok]') + '  ' + t);
const wink = (t) => schreib('     ' + WARN('[!] ') + '  ' + t);
const boese = (t) => schreib('     ' + BOESE('[x] ') + '  ' + t);
const tut = (t) => schreib('     ' + MARKE('->  ') + '  ' + t);

let SCHRITT = 0;
const SCHRITTE = 10;
function schritt(t) {
  SCHRITT++;
  leer();
  schreib('  ' + AKZENT(`[${SCHRITT}/${SCHRITTE}]`) + ' ' + HELL(t));
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
const leser = readline.createInterface({ input: process.stdin, output: process.stdout });
const fragen = (t) => new Promise((r) => leser.question(t, (a) => r(String(a || '').trim())));

async function jaNein(text, vorgabe = 'j') {
  const zeige = vorgabe === 'j' ? '[J/n]' : '[j/N]';
  const a = await fragen('     ' + AKZENT(`${text} ${zeige} `));
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
  const a = await fragen('     ' + AKZENT('Was tun? [w/ü/s] '));
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

function laeuft(befehl, argumente) {
  const e = spawnSync(befehl, argumente, { stdio: 'inherit', shell: process.platform === 'win32' });
  return e.status === 0;
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
function seiteAufmachen(adresse) {
  const w = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', adresse]]
    : process.platform === 'darwin' ? ['open', [adresse]]
      : ['xdg-open', [adresse]];
  try {
    const { spawn } = require('node:child_process');
    spawn(w[0], w[1], { stdio: 'ignore', detached: true }).unref();
  } catch (e) {}
}

function da(befehl) {
  const e = spawnSync(process.platform === 'win32' ? 'where' : 'which', [befehl],
    { stdio: 'pipe', encoding: 'utf8' });
  if (e.status !== 0) return null;
  return String(e.stdout).split('\n')[0].trim() || null;
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
     demselben Verzeichnis. Dieselbe Falle war in KlangTresor-starten.cmd
     am 11.09.2026 schon erkannt und dort behoben - hier nicht.
     Gefunden in der Pruefung vor der Veroeffentlichung. */
  process.env.PATH = path.dirname(process.execPath) + path.delimiter + process.env.PATH;

  marke();

  if (!quellenLesen()) {
    boese('quellen.txt fehlt — dort stehen die Adressen der Werkzeuge.');
    matt('Die Datei gehört neben package.json. Aus dem Paket von GitHub ist sie dabei.');
    leer(); schluss(1);
  }

  matt('Ich lege KlangTresor in diesen Ordner:');
  satz(HELL(WURZEL));
  matt('Du kannst den Ordner jederzeit woanders hinschieben. Nur die innere');
  matt('Struktur sollte bleiben, wie sie ist — daran hängt alles.');

  /* ---- Der Hinweis, der vor allem anderen stehen muss -------------
     Caspar_D, 11.09.2026: „der Nutzer wird keinen Datenbestand mehr
     runterladen können … wenn er nur einen Nopay-Account hat, kommt
     alles nicht infrage." Wer das erst nach einer halben Stunde
     erfährt, ist zu Recht verärgert. */
  leer();
  wink('Bevor du anfängst — eine Sache, die Zeit spart:');
  matt('Suno gibt seine Audiodateien seit dem 03.09.2026 nicht mehr über Links');
  matt('heraus. Jeder Song muss bei Suno einmal von Hand freigeschaltet werden:');
  matt('Drei Punkte, Download, „Unlock and Download". Das kostet ein Guthaben');
  matt('aus deinem Download-Kontingent.');
  leer();
  matt('Ohne bezahlten Plan hast du kein Kontingent. Dann archiviert dein');
  matt('KlangTresor Titelbilder, Texte, Zahlen und deine ganze Suno-Geschichte —');
  matt('aber keinen Ton. Alles andere funktioniert.');
  leer();
  matt('Am besten schaltest du jetzt schon ein paar Titel bei Suno frei, dann');
  matt('liegen sie bereit, wenn KlangTresor danach fragt.');
  leer();
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
    gut(`Platz: ${(platz / 1073741824).toFixed(1)} GB frei.`);
    matt('Die Einrichtung braucht rund 500 MB. Dein Archiv wächst danach mit');
    matt('jedem Song — bei ein paar hundert Titeln sind das schnell zehn GB.');
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
          if (fs.existsSync(ffEigen)) { ffmpeg = ffEigen; gut('ffmpeg liegt jetzt in werkzeug/ffmpeg.'); }
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
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  if (!laeuft(npm, ['install', '--no-fund', '--no-audit'])) {
    const w = await wieWeiter('npm install', 'Ohne die Pakete startet der Server nicht.');
    if (w !== 'ueber') { wiederkommen(); schluss(1); }
  } else gut('Pakete sind da.');

  /* ================================================================ */
  schritt('KI-Modelle holen (rund 284 MB)');
  matt('Stemtrennung und Musikstil. Klappt das nicht, läuft alles andere trotzdem.');
  if (!laeuft(process.execPath, [path.join('bin', 'modelle-holen.js')])) {
    const w = await wieWeiter('Modelle holen', 'Ohne sie fehlen Stemtrennung und Musikstil — sonst nichts.');
    if (w === 'schluss') { wiederkommen(); schluss(0); }
    if (w === 'wieder') laeuft(process.execPath, [path.join('bin', 'modelle-holen.js')]);
  } else gut('Modelle sind da.');

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
    matt('Dein Suno-Name ist das, was hinter dem @ steht — bei');
    matt('suno.com/@caspar_d also caspar_d. Nicht deine E-Mail-Adresse und');
    matt('nicht der Anzeigename, der über deinen Liedern steht.');
    leer();
    handle = (await fragen('     ' + AKZENT('Dein Suno-Name: '))).replace(/^@/, '').trim();
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
  if (!laeuft(process.execPath, [path.join('bin', 'sammeln.js'), handle])) {
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
  if (!laeuft(process.execPath, [path.join('bin', 'aufbereiten.js')])) {
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
  matt(`In ${path.join(os.homedir(), 'Downloads')} sehe ich nebenbei mit nach.`);
  matt('Liegt dasselbe Lied an beiden Stellen, ordne ich es einmal ein —');
  matt('welche Datei gemeint ist, sagt die Kennung, nicht der Name.');
  leer();
  let ordner = await fragen('     ' + AKZENT('Dein Suno-Ordner (Eingabetaste = überspringen): '));
  /* Wer einen Ordner ins Fenster zieht, bekommt Anführungszeichen oder
     maskierte Leerzeichen mitgeliefert. Beides hier wegnehmen, statt den
     Menschen mit einem „Ordner nicht gefunden" heimzuschicken. */
  ordner = ordner.replace(/^['"]|['"]$/g, '').replace(/\\ /g, ' ').trim();

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
  laeuft(process.execPath, einlesen);

  /* ================================================================ */
  schritt('Titelbilder und Bewegtbilder laden');
  matt('Das dauert am längsten — abbrechen und später fortsetzen ist');
  matt('erlaubt, was da ist wird nicht noch einmal geholt.');
  if (PROBE.length) wink(`Probelauf: es werden nur ${PROBE[1]} Titel geholt.`);
  laeuft(process.execPath, [path.join('bin', 'wiederherstellen.js'), ...PROBE]);

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
  leer();
  const netz = [];
  for (const [, liste] of Object.entries(os.networkInterfaces())) {
    for (const a of liste || []) {
      if (a.family === 'IPv4' && !a.internal) netz.push(a.address);
    }
  }
  satz(MATT('Adresse:  ') + MARKE('http://localhost:8788'));
  if (netz[0]) satz(MATT('Im WLAN:  ') + MARKE(`http://${netz[0]}:8788`));
  matt('Zum Beenden Strg-C. Später genügt der Starter im Projektordner.');
  leer();
  leser.close();
  if (OHNE_START) return;
  /* Erst aufmachen, dann starten: der Browser braucht laenger zum
     Hochkommen als der Server zum Horchen. */
  seiteAufmachen('http://localhost:8788');
  laeuft(process.execPath, [path.join('server', 'server.js')]);
})();
