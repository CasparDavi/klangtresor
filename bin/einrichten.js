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
/* --seite N: die Seite soll auf Port N horchen, weil dort schon eine auf
   uns wartet - der Fall nach dem Umzug (siehe dort). Dann geht auch kein
   zweites Browserfenster auf. */
const SEITE_WUNSCH = (() => { const i = process.argv.indexOf('--seite'); return i >= 0 ? Number(process.argv[i + 1]) || 0 : 0; })();
/* DER ZUSTAND IST DIE OBERFLAECHE - nicht der Konsolentext.

   Jeder Schritt traegt, was die Seite von ihm zeigt: seinen Namen in der
   Liste (kurz), die Ueberschrift und den Erklaertext rechts, seine
   Haken-/Teilzeilen, seine Ergebniszahlen und - solange etwas laeuft -
   einen Balken mit Zahlen. Caspar_D, 13.09.2026: "links nur abhaken,
   keine Fortschrittsbalken; die Balken nur, solange etwas laeuft."

   ZUSTAND.zeilen bleibt daneben bestehen: das ist das rohe Protokoll,
   das auf der Seite nur noch hinter der Registerlasche "Protokoll"
   steht - fuer die Fehlersuche, nicht als Oberflaeche. */
const ZUSTAND = { schritte: [], aktuell: 0, zeilen: [], fortschritt: null, frage: null, dialog: null, fertig: false, adresse: null, weiter: null, gesamt: 10, dauer: null };
const SYS = process.platform === 'win32' ? 'win' : process.platform === 'darwin' ? 'mac' : 'linux';
const jetztSchritt = () => ZUSTAND.schritte[ZUSTAND.aktuell - 1] || null;
/* „Du musst nicht warten." Schritt 9 laesst sich abbrechen - bisher nur
   mit Escape im Fenster. Caspar_D wollte es als Knopf; ausserdem gibt es
   kein Escape, wenn die Einrichtung ohne Terminal laeuft. Die Seite
   setzt diesen Wunsch ueber POST /abbrechen. */
let ABBRUCHWUNSCH = false;

/* Eine Haken- oder Teilzeile im laufenden Schritt. Gleiche id = dieselbe
   Zeile, sie wird fortgeschrieben (aus "wird durchgesehen" wird "1.146
   Dateien, 48 von Suno"). */
function zeile(id, text, wert, art) {
  const s = jetztSchritt(); if (!s) return;
  const alt = s.zeilen.find((z) => z.id === id);
  if (alt) { alt.text = text; if (wert !== undefined) alt.wert = wert; if (art) alt.art = art; return; }
  s.zeilen.push({ id, text, wert: wert === undefined ? null : wert, art: art || 'fertig' });
}
/* Eine Ergebniszahl. Gleiche Bezeichnung = derselbe Kasten. */
function kachel(name, wert) {
  const s = jetztSchritt(); if (!s) return;
  const alt = s.kacheln.find((k) => k.name === name);
  if (alt) alt.wert = wert; else s.kacheln.push({ name, wert });
}
/* Der Balken. null loescht ihn - er steht nur, solange etwas laeuft. */
function lauf(o) { const s = jetztSchritt(); if (s) s.lauf = o || null; ZUSTAND.fortschritt = o || null; }
/* Ein Titel, der durchlaeuft (Schritt 7). Die letzten sechs genuegen. */
function titelZeigen(text, neben) {
  const s = jetztSchritt(); if (!s) return;
  s.titel.unshift({ text, neben }); if (s.titel.length > 6) s.titel.length = 6;
}
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
/* Die Liste links steht von Anfang an da - man soll sehen, was kommt,
   nicht erst, was schon war. Die Namen hier sind dieselben, die
   schritt() spaeter als "kurz" setzt. */
const KURZ = ['Ordner prüfen', 'Was ist schon da?', 'ffmpeg', 'Pakete', 'KI-Modelle',
              'Dein Suno-Name', 'Songliste', 'Deine Suno-Dateien', 'Bilder', 'Zum Schluss'];
KURZ.forEach((k, i) => { ZUSTAND.schritte[i] = { nr: i + 1, kurz: k, name: k, erklaerung: '', zustand: '', zeilen: [], kacheln: [], titel: [], lauf: null }; });
/* kurz  - wie der Schritt in der Liste links heisst
   titel - die Ueberschrift rechts, in ganzen Worten
   erklaerung - was hier geschieht und warum; steht nur auf der Seite,
                die Konsole hat ihre eigenen, kuerzeren Saetze.
   Beide Texte stehen HIER, nicht in der Seite: dann gibt es sie genau
   einmal, und sie koennen sagen, was auf DIESEM System gilt. */
function schritt(kurz, titel, erklaerung) {
  SCHRITT++;
  leer();
  schreib('  ' + AKZENT(`[${SCHRITT}/${SCHRITTE}]`) + ' ' + HELL(titel || kurz));
  merken('schritt', `[${SCHRITT}/${SCHRITTE}] ${titel || kurz}`);
  if (ZUSTAND.schritte[SCHRITT - 2]) { const v = ZUSTAND.schritte[SCHRITT - 2]; v.zustand = 'fertig'; v.lauf = null; }
  ZUSTAND.schritte[SCHRITT - 1] = Object.assign(ZUSTAND.schritte[SCHRITT - 1] || {},
    { nr: SCHRITT, kurz, name: titel || kurz, erklaerung: erklaerung || '',
      zustand: 'laeuft', zeilen: [], kacheln: [], titel: [], lauf: null });
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
        lauf({ was, bytes: summe, gesamt: ganz || null, rest: rest.replace(/^, /, '') });
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
        lauf(null);
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
  /* EIN WEG FUER BEIDE. Vorher gab es zwei: mit Terminal wurde die
     Ausgabe des Kindes durchgereicht (stdio 'inherit'), ohne Terminal
     mitgelesen. Das war falsch, sobald die Kinder Zahlen melden: mit
     durchgereichter Ausgabe staenden die Meldezeilen (@@KT ...) roh im
     Fenster - und die Seite bekaeme trotzdem keinen Balken.

     Jetzt laeuft immer laeuft(): Ausgabe mitgelesen, Meldezeilen
     herausgefischt, Konsole sauber. Abgebrochen wird auf zwei Wegen -
     Escape im Fenster (nur mit Terminal) und der Knopf auf der Seite
     (immer). Beide beenden dasselbe Kind. */
  const stdin = process.stdin;
  ABBRUCHWUNSCH = false;
  const amFenster = stdin.isTTY && typeof stdin.setRawMode === 'function';
  let abgebrochen = false, zu = false;

  const beenden = () => {
    abgebrochen = true;
    for (const k of KINDER) {
      /* Die ganze Gruppe, nicht nur den Mittelsmann - siehe laeuft(). */
      if (k.eigeneGruppe) { try { process.kill(-k.pid, 'SIGTERM'); } catch (e) {} }
      try { k.kill(); } catch (e) {}
      if (process.platform === 'win32') {
        try { spawnSync('taskkill', ['/PID', String(k.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (e) {}
      }
    }
  };
  const horcher = (b) => { for (const x of b) if (x === 0x1b || x === 0x03) { beenden(); return; } };
  const wache = setInterval(() => { if (ABBRUCHWUNSCH && !zu) beenden(); }, 400);
  const aufraeumen = () => {
    if (zu) return; zu = true;
    clearInterval(wache);
    if (amFenster) { try { stdin.removeListener('data', horcher); stdin.setRawMode(false); stdin.pause(); } catch (e) {} }
  };
  if (amFenster) { try { stdin.setRawMode(true); stdin.resume(); stdin.on('data', horcher); } catch (e) {} }

  return laeuft(befehl, argumente, { gruppe: true }).then((ok) => {
    aufraeumen();
    return { ok: ok && !abgebrochen, abgebrochen };
  }, () => { aufraeumen(); return { ok: false, abgebrochen }; });
}

/* Was ein Kind gemeldet hat, in den Zustand legen. Fehlerhafte Zeilen
   werden still verworfen - eine kaputte Meldung darf die Einrichtung
   nicht anhalten. */
function meldungAnnehmen(roh) {
  let m; try { m = JSON.parse(roh); } catch (e) { return; }
  if (!m || typeof m !== 'object') return;
  if ('lauf' in m) lauf(m.lauf);
  if (m.zeile) zeile(m.zeile.id, m.zeile.text, m.zeile.wert, m.zeile.art);
  if (m.kachel) kachel(m.kachel.name, m.kachel.wert);
  if (m.titel) titelZeigen(m.titel.text, m.titel.neben);
}

/* Alle laufenden Kinder - fuer den Abbruchwunsch von der Seite. */
const KINDER = new Set();

/* Asynchron und mitgelesen: die Ausgabe der Kinder (npm, Modelle, sammeln)
   geht weiter auf die Konsole und ausserdem zeilenweise in den Zustand. */
function laeuft(befehl, argumente, optionen) {
  const brauchtSchale = process.platform === 'win32' && !path.isAbsolute(befehl);
  /* EIGENE PROZESSGRUPPE, wenn abgebrochen werden koennen soll.

     Schritt 9 startet bin/wiederherstellen.js, und DAS startet seine
     drei Teilschritte mit spawnSync. Ein SIGTERM an den Mittelsmann
     kommt dort erst an, wenn spawnSync zurueckkehrt - also erst, wenn
     das Laden von selbst fertig ist. Der Abbruch wirkte deshalb nicht
     (13.09.2026 im Probelauf gemessen: „abbrechen" blieb sechs Sekunden
     wirkungslos und danach auch).

     Mit detached bekommt der Mittelsmann eine eigene Gruppe, und
     process.kill(-pid) trifft ihn UND seine Enkel. Unter Windows tut das
     schon taskkill /T. */
  const eigeneGruppe = !!(optionen && optionen.gruppe) && process.platform !== 'win32';
  return new Promise((fertig) => {
    const { spawn } = require('node:child_process');
    /* KT_MELDEN=1: die Kinder duerfen Zahlen melden (bin/melden.js).
       Ohne das schweigen sie - fuer den Morgenlauf aendert sich nichts. */
    const kind = spawn(befehl, argumente, { stdio: ['inherit', 'pipe', 'pipe'], shell: brauchtSchale,
      detached: eigeneGruppe,
      env: Object.assign({}, process.env, { KT_MELDEN: '1' }) });
    kind.eigeneGruppe = eigeneGruppe;
    let restAus = '', restErr = '';
    /* Zeichen fuer Zeichen durchgereicht, nur die Meldezeilen bleiben
       haengen. Wichtig: der Wagenruecklauf (\r) geht MIT durch - davon
       leben die sich selbst ueberschreibenden Fortschrittszeilen der
       Kinder.

       Die Marke wird UEBERALL in der Zeile gesucht, nicht nur am Anfang:
       ein Kind, das gerade eine Fortschrittszeile ohne Zeilenende
       geschrieben hat, haengt seine Meldung hinten an dieselbe Zeile.
       Beim ersten Versuch stand sie deshalb auf der Konsole (13.09.2026,
       gleich in der ersten Probe aufgefallen). */
    const zeilenweise = (stueck, quelle) => {
      let puffer = (quelle === 'err' ? restErr : restAus) + String(stueck);
      let fuerDieKonsole = '', i;
      while ((i = puffer.search(/[\n\r]/)) >= 0) {
        const trenner = puffer[i];
        let z = puffer.slice(0, i);
        puffer = puffer.slice(i + 1);
        const p = z.indexOf('@@KT ');
        if (p >= 0) { meldungAnnehmen(z.slice(p + 5)); z = z.slice(0, p); if (!z) continue; }
        fuerDieKonsole += z + trenner;
        if (z.trim()) merken('kind', z);
      }
      if (quelle === 'err') restErr = puffer; else restAus = puffer;
      if (fuerDieKonsole) process.stdout.write(fuerDieKonsole);
    };
    kind.stdout.on('data', (s) => zeilenweise(s, 'aus'));
    kind.stderr.on('data', (s) => zeilenweise(s, 'err'));
    KINDER.add(kind);
    kind.on('error', () => { KINDER.delete(kind); lauf(null); fertig(false); });
    kind.on('close', (code) => { KINDER.delete(kind); lauf(null); fertig(code === 0); });
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

/* Liegt es schon im Zwischenlager dieses Rechners? Nur nachsehen, nicht
   kopieren - Schritt 2 will es wissen, bevor irgendetwas geholt wird. */
function lagerHat(name) {
  const lager = lagerOrdner();
  if (!lager) return false;
  try { const p = path.join(lager, name); return fs.existsSync(p) && fs.readdirSync(p).length > 0; } catch (e) { return false; }
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

  /* QUICKEDIT AUS, BEVOR DAS ERSTE WORT FAELLT. Warum: bin/konsole.js.
     Nach dem Umzug (--seite) ist es dasselbe Fenster, schon erledigt. */
  const QUICKEDIT_AUS = process.platform === 'win32' && !SEITE_WUNSCH ? require('./konsole.js').quickEditAus() : !!SEITE_WUNSCH;

  /* DIE SEITE. Ein winziger Server nur fuer diesen Lauf, nur auf
     127.0.0.1, auf dem ersten freien Port ab 8790. Er liefert
     web/einrichtung/index.html, den Zustand als JSON, nimmt Antworten
     entgegen und oeffnet auf Wunsch den Ordnerdialog des Systems. Geht
     kein Browser auf, laeuft die Konsole wie immer weiter. */
  let SEITENSERVER = null;
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
        if (u.pathname === '/abbrechen' && req.method === 'POST') {
          ABBRUCHWUNSCH = true;
          schreib(HELL('     Abbrechen — von der Seite aus.'));
          return antwort(res, 200, 'application/json', JSON.stringify({ ok: true }));
        }
        if (u.pathname === '/ordner' && req.method === 'POST') {
          let d = {}; try { d = JSON.parse(await rumpf(req) || '{}'); } catch (e) {}
          const r = await require('./ordnerdialog.js').ordnerWaehlenNebenher(os.homedir(), String(d.titel || 'Ordner wählen').slice(0, 120));
          return antwort(res, 200, 'application/json', JSON.stringify({ pfad: r.pfad || null, ging: r.ging }));
        }
        return antwort(res, 404, 'text/plain', 'nicht da');
      } catch (e) { return antwort(res, 500, 'text/plain', String(e.message)); }
    });
    const horchen = (port) => new Promise((f) => {
      srv.once('error', () => f(false));
      srv.listen(port, '127.0.0.1', () => f(true));
    });
    let port = SEITE_WUNSCH || 8790;
    while (port < 8840 && !(await horchen(port))) port++;
    if (srv.listening) {
      ZUSTAND.adresse = `http://127.0.0.1:${port}/`;
      const seiteWartet = SEITE_WUNSCH && port === SEITE_WUNSCH;   /* nach dem Umzug: die alte Seite kommt herueber */
      const inChrome = (OHNE_BROWSER || seiteWartet) ? false : seiteAufmachen(ZUSTAND.adresse);
      matt(`Die Einrichtung läuft auch als Seite: ${ZUSTAND.adresse}` + (inChrome ? ' (Chrome)' : ''));
      matt('Hier im Fenster siehst du dasselbe — und hier kannst du auch antworten.');
      /* unref: die Seite haelt die Einrichtung nicht am Leben. Sie endet,
         wenn die Arbeit endet - danach laeuft der KlangTresor-Server
         weiter, und die Seite ist ohnehin nicht mehr gemeint. */
      srv.unref();
      SEITENSERVER = srv;
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
  /* DER DIALOG LAEUFT NEBENHER, UND DER TEXT BLEIBT DER RUECKFALL.

     Caspar_D, 13.09.2026: „bei der Frage nach dem Ordner bleibt das js
     haengen, ich haette erwartet, dass ein FileChooser aufgeht." Drei
     Dinge steckten dahinter, alle in bin/ordnerdialog.js beschrieben -
     und eines hier: solange der Dialog offen war, stand das ganze
     Programm, also auch die Seite. Jetzt wartet es nebenher, die Seite
     sagt derweil, dass ein Fenster offen ist und wo es liegen kann.

     Und wenn kein Fenster aufgehen KANN (kein Bildschirm, zenity fehlt,
     PowerShell verschluckt sich), heisst es nicht „abgebrochen", sondern
     der Mensch darf tippen - „der text bleibt der fallback". */
  const { ordnerWaehlenNebenher } = require('./ordnerdialog.js');
  async function ordnerErfragen(titel) {
    matt('Ein Auswahlfenster geht auf. Siehst du es nicht? Dann liegt es hinter');
    matt('diesem Fenster - in der Taskleiste beziehungsweise im Dock nachsehen.');
    ZUSTAND.dialog = titel;
    let r;
    try { r = await ordnerWaehlenNebenher(os.homedir(), titel); }
    finally { ZUSTAND.dialog = null; }
    if (r.pfad) return r.pfad;
    if (r.ging) return null;
    wink('Das Auswahlfenster ging nicht auf' + (r.grund ? ' (' + r.grund + ')' : '') + '.');
    matt('Dann tippst du den Ordner hier - oder lässt es leer.');
    const t = await fragen('     ' + AKZENT('Ordner: '), { art: 'text', text: 'Das Auswahlfenster ging nicht auf. Ordner tippen - oder leer lassen.' });
    return String(t || '').trim().replace(/^["']|["']$/g, '') || null;
  }
  const ordnerWaehlen = () => ordnerErfragen('Wo soll KlangTresor liegen? Es wird ein Ordner „KlangTresor" darin angelegt.');

  function heimatVorschlag() {
    const heim = os.homedir();
    return path.join(heim, 'KlangTresor');
  }

  /* EIN ARCHIV GIBT ES VIELLEICHT SCHON - UND DAS MUSS ALS ERSTES GESAGT
     WERDEN. Caspar_D, 13.09.2026: „frueher hiess KlangTresor MySuno,
     frueher haben sie Files genau in diesen Ordner ausgepackt ... das
     Script sollte unbedingt darauf hinweisen, dass schon ein Ordner da
     ist." Vorher sah nur Schritt 2 in den Geschwisterordnern nach, nach
     dem Umzug, und bot dann nur „neu anfangen" oder „abbrechen".

     Erkannt wird ein Archiv am KATALOG (library/katalog.json.gz), nie am
     Namen - der Ordner darf MySuno, mysuno-main, KlangTresor oder sonstwie
     heissen. Gesucht wird dort, wo solche Ordner liegen: neben diesem,
     im Nutzerverzeichnis, in Downloads, auf dem Schreibtisch, in
     Dokumente und Musik - je zwei Ebenen tief (Downloads/mysuno-main/),
     hoechstens ein paar tausend Ordner. Das dauert unter einer Sekunde. */
  function archiveFinden() {
    const heim = os.homedir();
    const orte = new Set([path.dirname(WURZEL), heim]);
    for (const n of ['Downloads', 'Desktop', 'Schreibtisch', 'Documents', 'Dokumente', 'Music', 'Musik']) orte.add(path.join(heim, n));
    for (const n of ['Downloads', 'Desktop', 'Documents']) orte.add(path.join(heim, 'OneDrive', n));
    { const d = schreibtisch(); if (d) orte.add(d); }
    const istArchiv = (p) => fs.existsSync(path.join(p, 'library', 'katalog.json.gz')) || fs.existsSync(path.join(p, 'library', 'katalog.json'));
    const funde = [], gesehen = new Set();
    let zaehler = 0;
    const pruefe = (p) => {
      const r = path.resolve(p);
      if (gesehen.has(r) || r === path.resolve(WURZEL)) return;
      gesehen.add(r);
      if (!istArchiv(r)) return;
      let titel = 0; try { titel = fs.readdirSync(path.join(r, 'library', 'songs')).filter((n) => !n.startsWith('.')).length; } catch (e) {}
      let wann = null; try { wann = fs.statSync(path.join(r, 'library')).mtime; } catch (e) {}
      funde.push({ pfad: r, titel, wann });
    };
    for (const o of orte) {
      let kinder; try { kinder = fs.readdirSync(o, { withFileTypes: true }); } catch (e) { continue; }
      for (const k of kinder) {
        if (!k.isDirectory() || k.name.startsWith('.') || k.name === 'node_modules' || ++zaehler > 4000) continue;
        const p = path.join(o, k.name);
        pruefe(p);
        let enkel; try { enkel = fs.readdirSync(p, { withFileTypes: true }); } catch (e) { continue; }
        for (const e of enkel) if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && ++zaehler <= 4000) pruefe(path.join(p, e.name));
      }
    }
    funde.sort((a, b) => b.titel - a.titel || (b.wann || 0) - (a.wann || 0));
    return funde;
  }
  const archivText = (f) => f.pfad + MATT(` — ${f.titel} Titel` + (f.wann ? `, zuletzt ${f.wann.toLocaleDateString('de-DE')}` : ''));

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
  /* Liegt HIER schon ein Archiv, ist hier das Zuhause - auch im
     Download-Ordner. Wer eben „dieses Archiv weiterfuehren" gewaehlt hat
     oder sein altes MySuno dort liegen hat, wird nicht gleich wieder zum
     Umziehen gedraengt (im Sandkasten gesehen, 13.09.2026). Verschieben
     kann man den ganzen Ordner jederzeit von Hand. */
  const archivHier = fs.existsSync(path.join(WURZEL, 'library', 'katalog.json.gz')) || fs.existsSync(path.join(WURZEL, 'library', 'katalog.json'));
  const schonZuhause = archivHier || (!grund && path.basename(WURZEL) === 'KlangTresor');
  const heimZiel = path.join(os.homedir(), 'KlangTresor');
  let ziel = WURZEL;

  const funde = archiveFinden();

  if (schonZuhause) {
    matt(archivHier ? 'Hier liegt dein Archiv, und hier bleibt es:' : 'KlangTresor liegt hier, und hier bleibt es:');
    satz(HELL('  ' + WURZEL) + MATT(gbText(gbFrei(WURZEL))));
    if (archivHier && grund) matt('  (Das ist zwar ' + grund + ' — aber mit dem Archiv darin bleibt es hier. Umziehen: den ganzen Ordner verschieben.)');
    if (funde.length && !archivHier) {
      leer();
      wink('Aber woanders gibt es schon ein Archiv' + (funde.length > 1 ? `, sogar ${funde.length}` : '') + ':');
      for (const f of funde.slice(0, 3)) satz('    ' + HELL(archivText(f)));
      matt('Vermutlich dein bisheriges KlangTresor oder MySuno. Führe ich es dort weiter,');
      matt('wird nur das Programm erneuert — deine Titel, Bilder und Töne bleiben.');
      leer();
      if (await jaNein('Das vorhandene Archiv weiterführen?', 'j')) ziel = funde[0].pfad;
    }
  } else {
    matt('Du bist hier — dort, wo das Zip ausgepackt wurde:');
    satz(HELL('  ' + WURZEL) + MATT(gbText(gbFrei(WURZEL))));
    { const wo = ortInWorten(WURZEL); if (wo) matt('  ' + wo); }
    leer();
    const vorgabe = funde.length ? 'a' : (grund ? 'n' : 'd');
    if (funde.length) {
      wink('Ein Archiv gibt es schon' + (funde.length > 1 ? `, sogar ${funde.length}` : '') + ' — vermutlich dein bisheriges KlangTresor oder MySuno:');
      for (const f of funde.slice(0, 3)) satz('    ' + HELL(archivText(f)));
      leer();
      satz(HELL('  [A]') + MATT('  dieses Archiv weiterführen: ') + HELL(funde[0].pfad));
      matt('       Nur das Programm wird erneuert — Titel, Bilder und Töne bleiben, wie sie sind.');
    }
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
    const tasten = (funde.length ? [vorgabe === 'a' ? 'A' : 'a'] : []).concat([vorgabe === 'd' ? 'D' : 'd', vorgabe === 'n' ? 'N' : 'n', 'w']).join('/');
    const antwort = (await fragen('     ' + AKZENT(`Wohin? [${tasten}] `),
      { art: 'wahl', text: 'Wohin soll KlangTresor?', vorgabe,
        hinweis: (funde.length ? `Gefundenes Archiv: ${funde[0].pfad} (${funde[0].titel} Titel). ` : '') + (grund ? `Achtung: das hier liegt ${grund} - dort wird gern aufgeräumt. ` : '') + `Nutzerverzeichnis: ${heimZiel}`,
        optionen: [
          ...(funde.length ? [{ wert: 'a', label: `Vorhandenes Archiv weiterführen (${funde[0].titel} Titel)`, vor: true }] : []),
          { wert: 'd', label: 'Hier bleiben', vor: vorgabe === 'd' },
          { wert: 'n', label: 'In mein Nutzerverzeichnis', vor: vorgabe === 'n' },
          { wert: 'w', label: 'Woanders - Ordner wählen …' }] })).toLowerCase() || vorgabe;
    if (antwort.startsWith('a') && funde.length) ziel = funde[0].pfad;
    else if (antwort.startsWith('n')) ziel = heimZiel;
    else if (antwort.startsWith('w')) {
      const eltern = await ordnerWaehlen();
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
      ((fs.existsSync(path.join(ziel, 'package.json')) && fs.existsSync(path.join(ziel, 'bin'))) ||
       fs.existsSync(path.join(ziel, 'library', 'katalog.json.gz')) || fs.existsSync(path.join(ziel, 'library', 'katalog.json')));

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
        const weiter = [path.join(ziel, 'bin', 'einrichten.js'),
          ...process.argv.slice(2).filter((a, i, l) => a !== '--seite' && l[i - 1] !== '--seite')];
        if (ZUSTAND.adresse) {
          /* EIN FENSTER, NICHT ZWEI. Caspar_D, 13.09.2026: „wieso geht das
             einrichten javascript zweimal im browser auf?" Weil der Lauf am
             neuen Ort seine eigene Seite oeffnete. Jetzt bekommt er einen
             Port genannt (--seite) und oeffnet nichts; diese Seite hier
             wartet, bis er dort antwortet, und geht dann selbst hinueber.
             Solange laeuft dieser Prozess weiter - nur als Bruecke. */
          const net = require('node:net');
          const frei = (p) => new Promise((f) => { const t = net.createServer(); t.once('error', () => f(false)); t.listen(p, '127.0.0.1', () => t.close(() => f(true))); });
          let port = Number(new URL(ZUSTAND.adresse).port) + 1;
          while (port < 8840 && !(await frei(port))) port++;
          weiter.push('--seite', String(port));
          const dort = `http://127.0.0.1:${port}/`;
          const kind = require('node:child_process').spawn(process.execPath, weiter, { stdio: 'inherit', cwd: ziel });
          const horch = setInterval(() => {
            require('node:http').get(dort + 'stand', (r) => { r.resume(); if (r.statusCode === 200) { ZUSTAND.weiter = dort; clearInterval(horch); } }).on('error', () => {});
          }, 400);
          kind.on('error', () => { clearInterval(horch); process.exit(1); });
          kind.on('close', (code) => { clearInterval(horch); process.exit(code === null ? 1 : code); });
          return;
        }
        const e = spawnSync(process.execPath, weiter, { stdio: 'inherit', cwd: ziel });
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
  if (process.platform === 'win32' && QUICKEDIT_AUS) {
    matt('Ein Klick in dieses Fenster würde Windows sonst in den Markierungsmodus');
    matt('schalten und alles anhalten — für dieses Fenster ist das abgeschaltet.');
  } else if (process.platform === 'win32') {
    wink('Wenn es plötzlich stehenbleibt: einmal Escape drücken.');
    matt('Ein Klick ins Fenster schaltet Windows in den Markierungsmodus und');
    matt('hält alles an — es sieht nach Absturz aus, ist aber keiner. Escape');
    matt('löst es wieder. Am besten gar nicht erst hineinklicken.');
  }

  /* ================================================================ */
  schritt('Ordner prüfen', 'Ordner prüfen: Schreibrecht, keine Verwalterrechte, Platz',
    `Geprüft wird ${WURZEL}. KlangTresor schreibt nur in diesen Ordner — kein Systemordner, ` +
    'keine Registry, keine Administratorrechte. Erhöhte Rechte wären sogar schädlich: Alles ' +
    'Angelegte gehörte danach dem Verwalter, und du kämst an dein eigenes Archiv nicht mehr heran.');

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
  zeile('schreiben', 'Schreibrecht', 'ja');

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
    zeile('rechte', 'Keine erhöhten Rechte', 'es laufen auch keine');
  }

  /* Platz: rund 500 MB fuer Werkzeuge, Pakete und Modelle. Das ARCHIV
     kommt danach und kann ein Vielfaches werden - darum wird die Zahl
     genannt und nicht nur geprueft. */
  const platz = freierPlatz(WURZEL);
  if (platz === null) {
    matt('Freien Platz konnte ich nicht ermitteln — ich mache weiter.');
  } else if (platz < 1073741824) {
    boese(`Hier sind nur ${MB(platz)} frei. Für die Einrichtung braucht es rund 1 GB,`);
    zeile('platz', 'Platz', `nur ${MB(platz)} frei — gebraucht wird rund 1 GB`, 'wink');
    matt('und das Archiv kommt danach erst noch dazu.');
    leer();
    if (!await jaNein('Trotzdem versuchen?', 'n')) { wiederkommen(); schluss(0); }
  } else {
    gut(`Platz: ${(platz / 1073741824).toFixed(1)} GB frei — die Einrichtung braucht rund 1 GB.`);
    zeile('platz', 'Platz', `${(platz / 1073741824).toFixed(1).replace('.', ',')} GB frei, die Einrichtung braucht rund 1 GB`);
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
  schritt('Was ist schon da?', 'Was wird gebraucht, was ist schon da? Archiv, Werkzeuge, KI-Modelle',
    `${WURZEL} zeigt folgendes. Nichts wird doppelt geholt und nichts überschrieben: Was fehlt, ` +
    'wird in den nächsten Schritten geholt — ich sage genau, worum es sich handelt.');

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
    zeile('archiv', 'KlangTresor-Archiv', `${songs} Titel sind da, nur Änderungen werden ergänzt`);
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
      zeile('archiv', 'KlangTresor-Archiv', 'keins hier — aber eines nebenan: ' + nachbar, 'wink');
      if (!await jaNein('Trotzdem hier neu anfangen?', 'n')) { wiederkommen(); schluss(0); }
    } else {
      gut('Hier ist noch kein KlangTresor-Archiv. Ich lege eines an.');
      zeile('archiv', 'KlangTresor-Archiv', 'noch keins — es wird angelegt', 'laeuft');
    }
  }

  /* DIE BESTANDSAUFNAHME. Was die Schritte 3 bis 5 holen wuerden, wird
     hier schon einmal nachgesehen und benannt - mit Groessen, damit man
     vorher weiss, worauf man wartet. Geholt wird weiter dort. */
  {
    const ffDa = fs.existsSync(path.join(WERKZEUG, 'ffmpeg', 'bin', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')) || !!da('ffmpeg');
    const ffLager = !ffDa && lagerHat('ffmpeg');
    if (ffDa) zeile('ffmpeg', 'ffmpeg zur Medienbearbeitung', 'ist da');
    else if (ffLager) zeile('ffmpeg', 'ffmpeg zur Medienbearbeitung', 'liegt auf diesem Rechner, wird kopiert', 'laeuft');
    else if (process.platform === 'win32') zeile('ffmpeg', 'ffmpeg zur Medienbearbeitung', 'fehlt, wird geholt (rund 100 MB)', 'laeuft');
    else zeile('ffmpeg', 'ffmpeg zur Medienbearbeitung', 'fehlt — der Paketverwalter holt es, ein Befehl', 'wink');

    const paketeDa = fs.existsSync(path.join(WURZEL, 'node_modules', 'onnxruntime-node'));
    zeile('pakete', 'Pakete: Programmbausteine des Servers', paketeDa ? 'sind da' : 'fehlen, werden geholt (19 Pakete, rund 240 MB)', paketeDa ? 'fertig' : 'laeuft');

    let mDa = 0; try { mDa = fs.readdirSync(path.join(WURZEL, 'library', 'modelle')).filter((f) => !f.startsWith('.')).length; } catch (e) {}
    const mLager = !mDa && lagerHat('modelle');
    if (mDa >= 11) zeile('modelle', 'KI-Modelle zur Klanganalyse und Stemtrennung', '11 von 11 sind da');
    else if (mLager) zeile('modelle', 'KI-Modelle zur Klanganalyse und Stemtrennung', 'liegen auf diesem Rechner, werden kopiert (rund 560 MB)', 'laeuft');
    else zeile('modelle', 'KI-Modelle zur Klanganalyse und Stemtrennung', `${mDa} von 11 — der Rest wird geholt (rund 560 MB)`, 'laeuft');

    const zuHolen = (ffDa || ffLager || process.platform !== 'win32' ? 0 : 100) + (paketeDa ? 0 : 240) + (mDa >= 11 || mLager ? 0 : 560);
    if (zuHolen) zeile('summe', 'Zu holen', `rund ${zuHolen} MB — ein paar Minuten bis etwa eine halbe Stunde, je nach Leitung`, 'laeuft');
    else zeile('summe', 'Zu holen', 'nichts — alles liegt schon hier');
  }

  if (await jemandAufPort(8788)) {
    leer();
    wink('Auf Port 8788 antwortet bereits ein KlangTresor.');
    matt('Solange der läuft, kann dieser hier nicht starten — und der Browser');
    matt('würde den anderen zeigen. Erst dort das Fenster mit Strg-C beenden.');
    leer();
    zeile('port', 'Port 8788 für den Server', 'belegt — dort antwortet schon ein KlangTresor', 'wink');
    if (!await jaNein('Trotzdem weitermachen?', 'n')) { wiederkommen(); schluss(0); }
  } else zeile('port', 'Port 8788 für den Server, der KlangTresor im Browser zeigt', 'frei');

  /* ================================================================ */
  schritt('ffmpeg',
    process.platform === 'win32'
      ? 'Lokale Medienverarbeitung mit ffmpeg: Lokale Verfügbarkeit wird geprüft, ggf. wird das Paket geladen'
      : 'Lokale Medienverarbeitung mit ffmpeg: Lokale Verfügbarkeit wird geprüft',
    'ffmpeg arbeitet mit den Ton- und Bilddaten: Klanganalyse, Wellenformen, Videoschnitt. ' +
    (process.platform === 'win32'
      ? `Es wird geholt und nach ${path.join(WERKZEUG, 'ffmpeg')} gelegt.`
      : process.platform === 'darwin'
        ? 'Auf dem Mac ist dafür der Paketverwalter zuständig — ein Befehl im Terminal, und es gilt für den ganzen Rechner.'
        : 'Unter Linux ist dafür der Paketverwalter zuständig — ein Befehl, und es gilt für den ganzen Rechner.'));
  matt('Für Klanganalyse, Wellenformen und den Videoschnitt.');

  const ffEigen = path.join(WERKZEUG, 'ffmpeg', 'bin',
    process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  /* Liegt es schon auf diesem Rechner? Dann kopieren statt hundert
     Megabyte noch einmal durch die Leitung zu ziehen. */
  if (!fs.existsSync(ffEigen) && !da('ffmpeg')) ausLager('ffmpeg', path.join(WERKZEUG, 'ffmpeg'));
  let ffmpeg = fs.existsSync(ffEigen) ? ffEigen : da('ffmpeg');
  if (ffmpeg) {
    gut(`ffmpeg ist da: ${ffmpeg}`);
    zeile('ffmpeg', 'ffmpeg', ffmpeg.startsWith(WERKZEUG) ? 'liegt in werkzeug/ffmpeg' : 'auf diesem Rechner vorhanden');
  } else if (process.platform !== 'win32') {
    /* Auf Mac und Linux gibt es einen Paketverwalter, der es besser kann
       als ein Download an ihm vorbei. */
    wink('ffmpeg fehlt.');
    zeile('ffmpeg', 'ffmpeg', 'fehlt — ein Befehl im Terminal holt es', 'wink');
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
            zeile('ffmpeg', 'ffmpeg', 'geholt und abgelegt in werkzeug/ffmpeg');
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
  schritt('Pakete', 'Programmbausteine des Servers: 19 Pakete werden geladen und eingerichtet',
    'Fertige Bausteine, die KlangTresor benutzt statt sie selbst zu bauen: der Rechenkern für die ' +
    'Klangmodelle, die Karte des Klangraums, Matrixrechnung. Sie liegen nicht im Paket, weil sie für ' +
    `jedes System eigens gebaut werden — deshalb werden sie jetzt geholt, nach ${path.join(WURZEL, 'node_modules')}.`);
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
  /* await, nicht vergessen: npmLaufen ist async. Ohne await steht hier ein
     Promise, und !Promise ist immer falsch - ein gescheitertes npm install
     wurde als „Pakete sind da." gemeldet, und der naechste Schritt lief in
     einen Server ohne Pakete. Gefunden am 13.09.2026 beim Durchgehen der
     Texte, nicht durch einen Fehlschlag. */
  /* NPM SAGT NICHTS BRAUCHBARES - ALSO MESSEN WIR SELBST.
     Alle halbe Sekunde nachsehen, wie viele Pakete schon liegen und wie
     gross node_modules geworden ist. 19 Pakete und rund 240 MB sind die
     Sollwerte aus package-lock.json (gemessen 13.09.2026). Das ist ein
     echter Balken, kein geschaetzter. */
  const NM = path.join(WURZEL, 'node_modules');
  const paketBlick = setInterval(() => {
    let zahl = 0, bytes = 0;
    try {
      for (const d of fs.readdirSync(NM)) {
        if (d.startsWith('.')) continue;
        zahl++;
        try { for (const f of fs.readdirSync(path.join(NM, d), { recursive: true, withFileTypes: true })) {
          if (f.isFile()) { try { bytes += fs.statSync(path.join(f.parentPath || f.path, f.name)).size; } catch (e) {} }
        } } catch (e) {}
      }
    } catch (e) {}
    lauf({ was: 'Pakete werden geladen und eingerichtet', n: zahl, von: 19, bytes, gesamt: 240 * 1048576,
      hinweis: 'Zwischendurch ist es still: Manche Bausteine holen nach dem Laden noch eigene Teile nach. Das dauert, sieht aber nur nach Stillstand aus.' });
  }, 3000);
  const paketeGut = await npmLaufen(['install', '--no-fund', '--no-audit']);
  clearInterval(paketBlick); lauf(null);
  if (!paketeGut) {
    /* Kein „ueberspringen" hier: ohne die Pakete startet der Server
       nicht, die Wahl fuehrte also in eine Sackgasse. */
    zeile('pakete', 'Pakete', 'konnten nicht geholt werden', 'wink');
    wink('Die Pakete konnten nicht geholt werden.');
    matt('Ohne sie startet der Server nicht — dieser Schritt ist der einzige,');
    matt('der sich nicht überspringen lässt. Meist hilft: noch einmal versuchen.');
    matt('Bleibt es dabei, blockiert oft ein Firmennetz oder ein Virenschutz den');
    matt('Zugang zu registry.npmjs.org.');
    leer();
    if (await jaNein('Noch einmal versuchen?')) {
      if (!await npmLaufen(['install', '--no-fund', '--no-audit'])) { wiederkommen(); schluss(1); }
      gut('Pakete sind da.'); zeile('pakete', 'Pakete', '19 Pakete geholt');
    } else { wiederkommen(); schluss(1); }
  } else { gut('Pakete sind da.'); zeile('pakete', 'Pakete', '19 Pakete geholt'); }

  /* ================================================================ */
  schritt('KI-Modelle', 'KI-Modelle: Stemtrennung, Musikstil und Textverständnis — 11 Dateien, rund 560 MB',
    'Sie rechnen später bei dir, auf deinem Rechner: nichts davon verlässt ihn dafür. Geholt wird ' +
    'einmal; auf diesem Rechner Gefundenes wird kopiert statt geladen. Drei Gruppen: Musikstil ' +
    '(hört heraus, wonach ein Stück klingt — Genre, Stimmung, Instrumente), Stemtrennung (zerlegt ' +
    'ein Lied in Gesang, Schlagzeug, Bass, Gitarre, Klavier und Rest) und Textverständnis (macht ' +
    'aus Liedtexten Zahlen, damit Ähnliches beieinander liegt).');
  matt('Stemtrennung, Musikstil und Textverständnis. Klappt das nicht, läuft alles andere trotzdem.');
  const modelle = path.join(WURZEL, 'library', 'modelle');
  if (!fs.existsSync(modelle) || !fs.readdirSync(modelle).length) ausLager('modelle', modelle);
  if (!await laeuft(process.execPath, [path.join('bin', 'modelle-holen.js')])) {
    const w = await wieWeiter('Modelle holen', 'Ohne sie fehlen Stemtrennung und Musikstil — sonst nichts.');
    if (w === 'schluss') { wiederkommen(); schluss(0); }
    if (w === 'wieder') await laeuft(process.execPath, [path.join('bin', 'modelle-holen.js')]);
  } else { gut('Modelle sind da.'); zeile('modelle', 'KI-Modelle', '11 von 11 sind da'); insLager('modelle', modelle); }

  /* ================================================================
     AB HIER WIRD ERKLAERT, NICHT NUR GEMACHT.

     Caspar_D, 11.09.2026: „und nachher im script immer gut erklären,
     was passiert". Wer zum ersten Mal ein fremdes Programm auf seinen
     Rechner laesst und ihm dann auch noch seinen Musikbestand zeigt,
     hat ein Recht darauf zu wissen, was es tut - vorher, nicht danach.

     Drei Dinge werden deshalb ausdruecklich gesagt: WER hier bei Suno
     anklopft (ein Besucher, kein Angemeldeter), WAS dabei herkommt, und
     WAS NICHT - und was man tun muesste, wenn man auch das will. */
  schritt('Dein Suno-Name', 'Wie heißt du bei Suno? Der Name entscheidet, wessen Daten geholt werden',
    'KlangTresor ist eingerichtet und bereit, dein Archiv anzulegen. Dazu ruft es deine ' +
    'Suno-Profilseite auf wie jeder beliebige Besucher: nur lesend, ohne Passwort, ohne Anmeldung. ' +
    'Was ein Fremder sehen kann, kann KlangTresor holen. Alles andere kommt später.');
  matt('KlangTresor ist eingerichtet und bereit, dein Archiv anzulegen.');
  leer();
  matt('Dazu rufe ich deine Profilseite auf wie jeder beliebige Besucher:');
  matt('nur lesend, ohne Passwort, ohne Anmeldung. Was ein');
  matt('Fremder sehen kann, kann ich holen. Alles andere kommt später.');
  leer();
  let handle = '';
  try { handle = JSON.parse(fs.readFileSync(path.join(WURZEL, 'library/konfig.json'), 'utf8')).handle || ''; } catch (e) {}
  if (handle) { gut(`Gemerkt: @${handle}`); zeile('name', 'Dein Suno-Name', '@' + handle); }
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
    handle = (await fragen('     ' + AKZENT('Dein Suno-Name: '),
      { art: 'name', text: 'Dein Suno-Name',
        hinweis: 'Nicht deine E-Mail-Adresse. Nicht der Anzeigename über deinen Liedern — der darf Leerzeichen und Großbuchstaben haben, der Suno-Name nicht.' }))
      .replace(/^@/, '').replace(/^.*suno\.com\//i, '').replace(/^@/, '').trim().toLowerCase();
    if (handle) zeile('name', 'Dein Suno-Name', '@' + handle);
  }
  if (!handle) { boese('Ohne den Namen geht es nicht weiter.'); wiederkommen(); schluss(1); }

  /* ================================================================ */
  schritt('Songliste', `Deine Songliste von @${handle}: Titel, Texte, Stile, Alben`,
    'Gelesen wird deine Profilseite, Seite für Seite, zwanzig Titel je Seite. Es kommen Titel, ' +
    'Liedtexte, Stilangaben, Modell und Datum — dazu Abrufe, Herzen und Kommentarzahlen, und die ' +
    'Alben, soweit sie öffentlich stehen. Noch keine Audiodateien: die kommen in den nächsten ' +
    'beiden Schritten.');
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
  lauf({ was: 'Der Katalog wird gebaut' });
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
  schritt('Deine Suno-Dateien', 'Bereits heruntergeladene Suno-Dateien werden erkannt und eingeordnet',
    'Die Daten für deine KlangTresor-Bibliothek sind jetzt da — es fehlen die Audiodateien. Suno ' +
    'gibt sie seit dem 03.09.2026 nicht mehr über Links heraus, selbst dem Besitzer nicht. Aber du ' +
    'hast sie vermutlich längst auf der Platte. Erkannt werden sie durch KlangTresor am Inhalt, nie ' +
    'am Dateinamen: Suno schreibt eine Kennung in den Kopf jeder Datei. KlangTresor wird nur lesen ' +
    'und kopieren. Nichts wird verschoben, nichts gelöscht.');
  matt('Die Daten für deine Bibliothek sind da — es fehlen die Audiodateien.');
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
    ordner = (await ordnerErfragen('Wo liegen deine Suno-Dateien?')) || '';
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
  schritt('Bilder', 'Titelbilder und Bewegtbilder werden geladen und aufbereitet',
    'Zu jedem Titel gehört sein Bild — und wo Suno eines hat, ein kurzes Video. Beides liegt offen ' +
    'auf Sunos Bildspeicher, dafür braucht es keine Anmeldung. Aus den Bildern rechnet KlangTresor ' +
    'danach die Kacheln und die Farben, mit denen die Oberfläche sich später einfärbt. Das ist der ' +
    'längste Schritt — und du musst ihn nicht abwarten.');
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
    const s = jetztSchritt();
    if (s) s.abbrechbar = { text: 'Du musst nicht warten.',
      klein: 'KlangTresor kann jetzt schon starten — die Bilder holt der rote Knopf oben rechts später nach, und was da ist, wird nicht noch einmal geladen. Du siehst dann eine vollständige Bibliothek, nur mit ein paar grauen Kacheln.',
      knopf: 'Jetzt starten, Rest später' };
    const e = await laeuftAbbrechbar(process.execPath, [path.join('bin', 'wiederherstellen.js'), ...PROBE]);
    if (s) s.abbrechbar = null;
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
  schritt('Zum Schluss', 'Fertig — und was nur du selbst holen kannst',
    'Bis hierher war alles öffentlich — KlangTresor hat nur gelesen, was jeder Besucher deiner ' +
    'Profilseite sehen kann. Was nur dir gehört, holt ein Lesezeichen in Chrome, mit deiner eigenen ' +
    'Anmeldung.');
  { const a = jetztSchritt();
    if (a) a.abschluss = {
      fehlt: [
        ['Deine unveröffentlichten Titel', 'mit Abrufen und Herzen'],
        ['Wer dir gefolgt ist', 'wer geherzt, wer kommentiert hat — mit Namen und Zeitpunkt'],
        ['Deine privaten Alben', ''],
        ['Sunos eigene Analyse', 'Tempo, Taktraster, Hüllkurve'],
        ['Die Wort-Zeitmarken', 'für den mitlaufenden Text'],
        ['Die Audiodateien', 'für alles, was du bei Suno schon freigeschaltet hast'],
      ],
      warum: 'Dafür braucht KlangTresor dich — und das hat einen guten Grund. Der Ausweis, den Suno '
           + 'verlangt, lebt etwa eine Minute und gilt nur im Browser. KlangTresor bekommt ihn nicht und '
           + 'soll ihn nicht bekommen: So liegt auf deiner Platte kein Schlüssel zu deinem Suno-Konto. '
           + 'Deshalb sitzt das Werkzeug als Lesezeichen dort, wo du ohnehin angemeldet bist — ein Klick, '
           + 'einmal am Tag.',
      zitat: 'Auf der KlangTresor-Seite findest du oben rechts den roten Knopf für den täglichen Abgleich '
           + '— und darunter die Frage „Willst Du auch die nur Dir zugänglichen Daten im KlangTresor '
           + 'sehen?". Dahinter liegt das Lesezeichen zum Hineinziehen, samt Anleitung. Chrome wird dafür '
           + 'gebraucht.',
      nachsatz: 'Was du bei Suno schon freigeschaltet hast, kostet dabei nichts — ein Guthaben zahlst du '
              + 'nur beim Freischalten selbst, und das machst du bei Suno, nicht hier. Das alles geht auch '
              + 'später jederzeit: KlangTresor läuft auch ohne.',
    };
  }
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
  /* Was am Ende dasteht, wird gezaehlt: Ordner in library/songs, und
     darin, was wirklich liegt. */
  { const a = jetztSchritt();
    const S = path.join(WURZEL, 'library', 'songs');
    let titel = 0, mitTon = 0, mitBild = 0;
    try {
      for (const d of fs.readdirSync(S)) {
        if (d.startsWith('.')) continue;
        titel++;
        if (fs.existsSync(path.join(S, d, 'audio.mp3')) || fs.existsSync(path.join(S, d, 'audio.wav'))) mitTon++;
        if (fs.existsSync(path.join(S, d, 'cover.jpg')) || fs.existsSync(path.join(S, d, 'cover.png'))) mitBild++;
      }
    } catch (e) {}
    let alben = 0;
    try { const k = require('./katalog.js').lesen(); alben = (k && k.playlists ? k.playlists.length : 0); } catch (e) {}
    kachel('Titel', String(titel));
    kachel('mit Audiodatei', String(mitTon));
    if (alben) kachel('Alben', String(alben));
    kachel('Bilder', String(mitBild));
    if (a && a.abschluss) a.abschluss.adressen = [];
  }
  { const v = schreibtischVerknuepfung(WURZEL);
    if (v) { gut('Auf dem Schreibtisch liegt jetzt „KlangTresor" — damit startest du es künftig.');
             zeile('desktop', 'Auf dem Schreibtisch liegt jetzt „KlangTresor"', 'damit startest du es künftig'); }
    else { matt('Zum späteren Starten: der Starter liegt in ' + WURZEL + '.');
           zeile('desktop', 'Zum späteren Starten', 'der Starter liegt in ' + WURZEL, 'wink'); } }
  leer();
  satz(MATT('Adresse:  ') + MARKE('http://localhost:8788'));
  zeile('adresse', 'Auf diesem Rechner', 'http://localhost:8788');
  if (netz[0]) { satz(MATT('Im WLAN:  ') + MARKE(`http://${netz[0]}:8788`));
                 zeile('wlan', 'Im WLAN, etwa vom Handy', `http://${netz[0]}:8788`); }
  matt('Zum Beenden Strg-C. Später genügt der Starter im Projektordner.');
  leer();
  leser.close();
  if (OHNE_START) {
    /* Probelauf ohne Serverstart: die Seite bleibt stehen, damit man das
       Ergebnis ansehen kann. Sonst waere sie im selben Augenblick weg. */
    if (SEITENSERVER) { SEITENSERVER.ref(); matt('Die Seite bleibt offen — mit Strg-C beenden.'); }
    return;
  }
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
    { const a = jetztSchritt(); if (a && a.abschluss) a.abschluss.windows =
      'Windows fragt in einem Moment, ob „Node.js JavaScript Runtime" ins Netzwerk darf. Das ist der '
    + 'KlangTresor-Server. Hake „Private Netzwerke" an — sonst erreichst du ihn im eigenen WLAN nicht, '
    + 'etwa vom Handy — und klicke „Zugriff zulassen". „Öffentliche Netzwerke" brauchst du nicht.'; }
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
