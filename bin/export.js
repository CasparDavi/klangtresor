#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * KlangTresor als EINGEFRORENES Archiv auf den Stick - reinstecken,
 * Startskript, Browser auf, alle Titel da. Für den Nachlass, für das
 * Autoradio, für den Tag, an dem Suno zumacht.
 *
 *   node bin/export.js --ziel /Volumes/Stick/KlangTresor          kopieren
 *   node bin/export.js --probe                                    nur rechnen, nichts ins Ziel
 *   node bin/export.js --stems                                    die Stems (28 GB) dazu
 *   node bin/export.js --ohne-probestart                          Ziel nicht anlaufen lassen
 *
 * Ohne --ziel gilt exportZiel aus library/konfig.json (setzt der
 * Server, wenn die Oberfläche ein Ziel nennt).
 *
 * WAS ENTSTEHT (Caspar_D, 09.09.2026, der Plan):
 *   START-Mac.command, START-Windows.cmd, START-Linux.sh, LIES-MICH.md
 *   Sternenhimmel.html      standalone, Bild und Ton relativ aus Programm/
 *   Musik/<Titel>.mp3       für Fernseher, Autoradio, VLC: Dateiname =
 *                           Name des Titels, ID3v2.3 mit Titelbild
 *   Programm/               web/, server/, bin/, browser/, docs/, package.json,
 *                           LICENSE, README - das Programm, wie es ist
 *   Programm/library/       der Bestand-Kern als echte Dateien: Katalog mit
 *                           allen Liedtexten, Whisper, Reaktionen, Beobachter,
 *                           Klangraum, Alben, kleine Ordner - ohne roh/, backup/,
 *                           node-portabel/, suno-wege/, modelle/, kondensate/arbeit/
 *   Programm/library/bestand-001.tar ...   DIE BEHÄLTER (bin/behaelter.js): Ton,
 *                           Kacheln, Titelbilder, Bewegtbilder, Analyse-Ablage,
 *                           Herzen-Listen, Stems - als tar-Stücke bis 2 GB,
 *                           rein sequenziell geschrieben. Caspar_D, 09.09.2026:
 *                           "gut, dann arbeiten wir mit Behältern" - ein Stick
 *                           schreibt 4.000 kleine Dateien in über einer Stunde,
 *                           dieselben Bytes am Stück in zehn Minuten. Der
 *                           eingefrorene Server liest per Versatz daraus.
 *   Programm/library/bestand-index.ndjson  das Verzeichnis der Behälter
 *   Programm/library/export-stand.json   {exportiertAm, dateien, bytes, mitStems, handle}
 *   node/<plattform>/       das mitgebrachte Node aus library/node-portabel/
 *
 * WAS NIE MITKOMMT: geheim/ (Zugangsdaten), .git (die Werkstatt), die
 * WAV-Originale (17 GB, nur für Messungen, die längst gerechnet sind).
 *
 * IN STUFEN, NACH WICHTIGKEIT (Caspar_D, 09.09.2026: "so aufbauen, dass die
 * nötigen Dateien zuerst und die weniger nötigen später geschrieben werden,
 * sodass bei Start trotzdem schon so viel wie möglich funktioniert" - der
 * Fall: "ich will los, habe keine Stunde mehr, reicht nicht auch eine
 * Viertelstunde für was Vorzeigbares"):
 *   1 Starten       Programm, Startskripte, Bestand-Kern (Katalog mit allen
 *                   Liedtexten, Whisper, Reaktionen, Herzen, Beobachter,
 *                   Klangraum, Alben), Sternenhimmel.html, node/
 *   2 Titel         je Titel audio.mp3, kachel.jpg, titelbild.jpg - NEUESTE
 *                   ZUERST, das ist die Vorführung
 *   3 Titelbilder   cover.jpg und was sonst im Titelordner liegt, neueste zuerst
 *   4 Analyse       die Analyse-Ablage je Titel, neueste zuerst
 *   5 Fernseher     Musik/ mit ID3, docs/
 *   6 Stems         nur mit --stems, ganz zuletzt ("die hört sich eh keiner an")
 *   7 Abschluss     ein rsync-Aufräumlauf über alles (holt Reste, räumt weg,
 *                   was zu Hause fehlt), Beifang, LIES-MICH, Stand, Probestart
 * Die Stufen 1-4 und 6 schreibt dieses Skript selbst in die Behälter, Datei
 * für Datei in genau dieser Reihenfolge - rsync sortiert seine Liste immer
 * nach Namen. Geschrieben wird nur, was fehlt oder sich geändert hat (Größe
 * und Zeit, wie rsync -t mit --modify-window=2); Geändertes hängt hinten an,
 * Gelöschtes verschwindet aus dem Verzeichnis, und ist mehr als ein Viertel
 * der Stücke Ballast, verdichtet Stufe 7 sie. Der Bestand-Kern und Musik/
 * bleiben echte Dateien (wenige bzw. für Fernseher nötig).
 *
 * ANHALTEN: SIGTERM (die Oberfläche: Knopf "Anhalten", POST /api/export/stop)
 * beendet die laufende Datei, schreibt den Stand und geht - der Stick ist
 * dann vorzeigbar bis zur letzten fertigen Datei. Ein zweites SIGTERM
 * bricht hart ab. Nach jeder Stufe (und in Stufe 2 alle 25 Titel) liegt
 * Programm/library/export-stand.json als TEILKOPIE: { teilkopie: true,
 * stufe: {nr, von, name}, titel, exportiertAm, handle, anzeigename }; der
 * eingefrorene Server zeigt dann nur die Titel, deren MP3 da ist, und die
 * App sagt "Teilkopie von @alias vom Datum".
 *
 * Für Musik/ gilt wie bisher: eine MP3 wird nur neu getaggt, wenn
 * Tonspur oder Bild zu Hause jünger sind als die Datei auf dem Stick.
 *
 * DER LAUF SCHREIBT MIT: library/export-lauf.json, fortlaufend, damit
 * die Oberfläche (GET /api/export/stand) zusehen kann:
 *   { laeuft, seit, pid, schritt, stufe: {nr, von, name}, zielDateisystem, fortschritt, zeilen: [...], fertig, fehler, ergebnis }
 *   fertig = true nur bei gutem Ende; ein Abbruch lässt fertig = false
 *   und schreibt den Grund nach fehler. ergebnis =
 *   { dateien, bytes, dauerS, probestart: "ok" | "fehlgeschlagen: ..." | "übersprungen" }
 *   oder nach Anhalten { angehalten: true, stufe: {nr, von, name}, titel, dauerS }
 *   fortschritt (Caspar_D, 09.09.2026: ein Balken mit Restzeit, nicht nur
 *   eine Prozentzahl) = null zwischen den Schritten, sonst
 *   { prozent, was: "Programm" | "Kern" | "Titel" | "Bilder" | "Analyse" | "Musik" | "Node" | "Stems" | "Abschluss",
 *     bytesGesamt, bytesFertig, bytesProSekunde, restS,
 *     dateienGesamt, dateienFertig }
 *   bytesGesamt kommt aus einer Vorabmessung je rsync-Schritt (Trockenlauf
 *   mit --stats, "Total transferred file size" - dauert Sekunden, dafür
 *   stimmt der Balken); bytesProSekunde ist gleitend über die letzten
 *   zehn Sekunden, restS daraus gerechnet. Bei Musik/ zählt der Anteil
 *   der Dateien. Höchstens viermal je Sekunde geschrieben.
 *
 * DAS MEDIUM: vor dem ersten Byte steht das Dateisystem des Ziels im
 * Protokoll (aus der mount-Ausgabe). Zwei Fälle brechen ab, bevor
 * etwas halb Kopiertes liegt (Caspar_D, 09.09.2026): FAT32 ("msdos")
 * kennt keine Datei über 4 GB - mit Stems wäre eine dabei; NTFS hängt
 * der Mac nur lesend ein.
 *
 * DER PROBESTART: am Ende wird das ZIEL angelaufen, so wie es der Stick
 * täte - Programm/server/server.js --eingefroren auf einem freien Port
 * ab 18790 - und /api/index gefragt, ob alle Titel da sind. Beendet
 * wird nur dieser eine Kindprozess über seine PID; der KlangTresor auf
 * 8788 bleibt unberührt.
 */
'use strict';
const fs   = require('node:fs');
const path = require('node:path');
const net  = require('node:net');
const http = require('node:http');
const { spawn, spawnSync } = require('node:child_process');
const K    = require('./katalog.js');
const { Behaelter } = require('./behaelter.js');

const WURZEL = path.join(__dirname, '..');
const LIB    = path.join(WURZEL, 'library');
const SONGS  = path.join(LIB, 'songs');
const LAUF   = path.join(LIB, 'export-lauf.json');
const START  = Date.now();

/* ---------------------------------------------------------------- Aufruf */
const args = process.argv.slice(2);
const option = (name) => { const i = args.indexOf(name); if (i < 0) return null; const w = args[i + 1]; if (!w || w.startsWith('--')) { console.error(`\n  ${name} braucht einen Wert.\n`); process.exit(1); } return w; };
const probe        = args.includes('--probe');
const stems        = args.includes('--stems');
const ohneProbestart = args.includes('--ohne-probestart');
const konfig = (() => { try { return JSON.parse(fs.readFileSync(path.join(LIB, 'konfig.json'), 'utf8')); } catch (e) { return {}; } })();
/* Der Ort: --ziel, sonst das erste nackte Wort (die alte Aufrufform von
   August), sonst exportZiel aus der Konfiguration. */
const zielRoh = option('--ziel') || args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--ziel') || konfig.exportZiel;
if (!zielRoh) {
  console.error('\n  Wohin? Aufruf:  node bin/export.js --ziel /Volumes/Stick/KlangTresor [--stems] [--probe] [--ohne-probestart]');
  console.error('  Oder exportZiel in library/konfig.json setzen (macht die Oberfläche).\n');
  process.exit(1);
}
const ZIEL = path.resolve(zielRoh);

/* DER MAC BLEIBT WACH (Caspar_D, 09.09.2026: "der Mac war zwischenzeitlich
   in den Ruhemodus gegangen" - und der Stick meldete sich als "nicht
   ordnungsgemäß ausgeworfen"). Ein Export auf einen langsamen Stick dauert
   eine Stunde; schläft der Rechner ein, verliert der Stick den Strom und
   rsync schreibt ins Leere. caffeinate -i verhindert den Leerlaufschlaf,
   solange dieser Prozess lebt (-w). Nur auf dem Mac, nur beim echten Lauf;
   der Morgenlauf des Servers macht es genauso. */
if (process.platform === 'darwin' && !probe) {
  try { require('node:child_process').spawn('caffeinate', ['-i', '-w', String(process.pid)], { detached: true, stdio: 'ignore' }).unref(); }
  catch (e) { /* ohne caffeinate läuft der Export trotzdem */ }
}

/* ---------------------------------------------------------------- Mitschrift */
const STUFEN = 7;
const lauf = { laeuft: true, seit: new Date(START).toISOString(), pid: process.pid, probe, stems, ziel: ZIEL, zielDateisystem: null,
               schritt: '', stufe: null, fortschritt: null, zeilen: [], fertig: false, fehler: null, ergebnis: null };
let zuletztGeschrieben = 0;
function laufSchreiben(erzwingen) {
  /* Höchstens viermal je Sekunde - rsync meldet Fortschritt öfter, und
     jede Fassung geht über einen Umweg (tmp + rename), damit der Server
     nie eine halbe Datei liest. */
  const jetzt = Date.now();
  if (!erzwingen && jetzt - zuletztGeschrieben < 250) return;
  zuletztGeschrieben = jetzt;
  try {
    const tmp = LAUF + '.' + process.pid + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(lauf, null, 1));
    fs.renameSync(tmp, LAUF);
  } catch (e) { /* die Mitschrift ist Beiwerk; der Export selbst geht weiter */ }
}
function zeile(text) {
  console.log('  ' + text);
  lauf.zeilen.push(text);
  if (lauf.zeilen.length > 400) lauf.zeilen.splice(0, lauf.zeilen.length - 400);
  laufSchreiben(true);
}
function schritt(name) { lauf.schritt = name; lauf.fortschritt = null; zeile('» ' + name); }
function stufe(nr, name) { lauf.stufe = { nr, von: STUFEN, name }; schritt(`Stufe ${nr} von ${STUFEN}: ${name}`); }

/* ANHALTEN, SANFT. Das erste SIGTERM setzt nur die Flagge: die laufende
   Datei wird fertig (bei rsync und ffmpeg: das Kind bekommt das Signal
   und räumt seine halbe Datei selbst weg), dann schreibt der Lauf den
   Stand und geht. Das zweite SIGTERM bricht hart ab. */
let anhalten = false;
function anhaltenAnfordern(signal) {
  if (anhalten) return abbruch('abgebrochen (' + signal + ', zum zweiten Mal)');
  anhalten = true;
  zeile(`Anhalten angefordert (${signal}) - die laufende Datei wird fertig, dann steht der Stand`);
  for (const k of kindProzesse) { try { k.kill('SIGTERM'); } catch (e) {} }
}

/* DAS TEMPO, GLEITEND. Caspar_D, 09.09.2026: die Restzeit soll nicht
   bei jedem Ruckeln des Sticks springen - deshalb der Durchschnitt über
   die letzten zehn Sekunden, nicht die Momentanzahl von rsync. Ein
   Messer je Schritt: fuettern(bytesFertig) gibt Bytes je Sekunde oder
   null, solange keine Sekunde gemessen ist. */
function tempoMesser() {
  const proben = [];
  return (bytesFertig) => {
    const t = Date.now();
    proben.push({ t, b: bytesFertig });
    while (proben.length > 1 && t - proben[0].t > 10000) proben.shift();
    const dt = (t - proben[0].t) / 1000;
    return dt >= 1 ? Math.max(0, Math.round((bytesFertig - proben[0].b) / dt)) : null;
  };
}
/* Der Fortschritt eines Schritts in die Mitschrift: mess = { was, gesamt,
   dateienGesamt, tempo } ist der Rahmen, fertig = { bytes, dateien, prozent }
   der Stand. prozent kommt aus den Bytes, wo die Summe bekannt ist, sonst
   aus dem, was rsync selbst meldet (im Trockenlauf gibt es keine Vorabmessung). */
function fortschritt(mess, fertig) {
  const gesamt = mess.gesamt || null;
  const bytesFertig = fertig.bytes || 0;
  const tempo = mess.tempo ? mess.tempo(bytesFertig) : null;
  const prozent = fertig.prozent != null ? fertig.prozent : (gesamt ? Math.min(100, Math.round(100 * bytesFertig / gesamt)) : 0);
  lauf.fortschritt = {
    prozent, was: mess.was,
    bytesGesamt: gesamt, bytesFertig,
    bytesProSekunde: tempo,
    restS: (gesamt && tempo) ? Math.max(0, Math.round((gesamt - bytesFertig) / tempo)) : null,
    dateienGesamt: mess.dateienGesamt != null ? mess.dateienGesamt : null,
    dateienFertig: fertig.dateien != null ? fertig.dateien : null,
  };
  laufSchreiben(false);
}
/* Die Kindprozesse (rsync, ffmpeg) sterben mit - sonst schreibt ein
   verwaister rsync weiter auf den Stick, waehrend die Oberflaeche schon
   "angehalten" sagt (09.09.2026: drei rsync blieben nach dem Anhalten
   uebrig, zwei davon im Plattenwarten auf dem eingeschlafenen Stick). */
const kindProzesse = new Set();
function abbruch(grund) {
  lauf.laeuft = false; lauf.fertig = false; lauf.fehler = String(grund && grund.message || grund);
  lauf.schritt = 'abgebrochen'; lauf.fortschritt = null;
  console.error('\n  ABBRUCH: ' + lauf.fehler + '\n');
  for (const k of kindProzesse) { try { k.kill('SIGTERM'); } catch (e) {} }
  laufSchreiben(true);
  process.exit(1);
}
process.on('uncaughtException', abbruch);
process.on('unhandledRejection', abbruch);
process.on('SIGINT',  () => anhaltenAnfordern('SIGINT'));
process.on('SIGTERM', () => anhaltenAnfordern('SIGTERM'));

/* Läuft schon einer? Zwei rsyncs auf denselben Stick zerlegen sich
   gegenseitig; der Server fragt vorher, aber der Aufruf von Hand nicht. */
try {
  const alt = JSON.parse(fs.readFileSync(LAUF, 'utf8'));
  if (alt.laeuft && alt.pid && alt.pid !== process.pid) {
    let lebt = false; try { process.kill(alt.pid, 0); lebt = true; } catch (e) {}
    if (lebt) { console.error(`\n  Es läuft schon ein Export (PID ${alt.pid}, seit ${alt.seit}).\n`); process.exit(2); }
  }
} catch (e) {}

/* ---------------------------------------------------------------- Vorbedingungen */
const katalog = K.lesen();
if (!katalog) abbruch('Kein Katalog (library/katalog.json.gz) - erst  node bin/sammeln.js');
const handle = (katalog.profil && katalog.profil.handle) || konfig.handle || '';
if (!handle) abbruch('Kein Suno-Alias im Katalog und in library/konfig.json - das Archiv wäre namenlos');
const anzeigename = (katalog.profil && katalog.profil.display_name) || handle;
const eigene = Object.values(katalog.songs).filter(s => !s.fremd)
  .sort((a, b) => (a.erstellt || '').localeCompare(b.erstellt || ''));

/* Das Ziel darf nicht im Haus liegen (rsync kopierte sonst in sich
   selbst hinein) und sein Elternordner muss DA sein: /Volumes/Stick
   ohne Stick anzulegen hieße, auf die Systemplatte zu exportieren. */
if ((ZIEL + path.sep).startsWith(WURZEL + path.sep) || ZIEL === WURZEL) abbruch('Das Ziel liegt im KlangTresor selbst: ' + ZIEL);
if (!fs.existsSync(path.dirname(ZIEL))) abbruch('Der Ort ist nicht eingehängt: ' + path.dirname(ZIEL));
for (const w of ['rsync', 'ffmpeg']) if (spawnSync('which', [w]).status !== 0) abbruch(w + ' fehlt - ohne geht der Export nicht');

console.log(`\n  ${probe ? 'Probe (nichts wird ins Ziel geschrieben)' : 'Archiv-Export'} → ${ZIEL}`);
console.log(`  ${eigene.length} Titel von ${anzeigename} (@${handle})${stems ? ', mit Stems' : ', ohne Stems'}, ohne WAV\n`);
laufSchreiben(true);

/* ---------------------------------------------------------------- Das Medium */
/* Welches Dateisystem unter dem Ziel liegt, sagt die mount-Ausgabe: auf
   dem Mac "/dev/disk2s1 on /Volumes/INTENSO (exfat, local, ...)", unter
   Linux "/dev/sdb1 on /media/x/STICK type vfat (rw,...)". Den
   Einhängepunkt nennt df - nicht die längste passende mount-Zeile: auf
   dem Mac liegt /Users über einen Firmlink auf /System/Volumes/Data, und
   die Präfixsuche fände das versiegelte "/" (apfs, read-only) - ein
   Export auf den Schreibtisch bräche dann grundlos ab (09.09.2026, beim
   Prüfen gesehen). Die Präfixsuche bleibt als Rückfall, wenn df schweigt.
   Gefragt wird nach dem nächsten Ordner, den es schon gibt - das Ziel
   selbst gibt es beim ersten Export noch nicht. */
function dateisystemVon(pfad) {
  let da = pfad; while (da !== path.dirname(da) && !fs.existsSync(da)) da = path.dirname(da);
  let punktDf = null;
  { const df = (spawnSync('df', ['-P', da], { encoding: 'utf8' }).stdout || '').trim().split('\n').pop() || '';
    const m = df.match(/^(.*?)\s+\d+\s+\d+\s+\d+\s+\d+%\s+(.+?)\s*$/); if (m) punktDf = m[2]; }
  const aus = (spawnSync('mount', [], { encoding: 'utf8' }).stdout || '');
  let bester = null;
  for (const z of aus.split('\n')) {
    const m = z.match(/^(.+?) on (.+?)(?: type (\S+))? \(([^)]*)\)\s*$/);
    if (!m) continue;
    const punkt = m[2];
    if (punktDf ? punkt !== punktDf : (pfad !== punkt && !pfad.startsWith(punkt.endsWith('/') ? punkt : punkt + '/'))) continue;
    if (bester && bester.pfad.length >= punkt.length) continue;
    const optionen = m[4].split(',').map(o => o.trim().toLowerCase());
    bester = { geraet: m[1], pfad: punkt, dateisystem: (m[3] || optionen[0] || '').toLowerCase(),
               nurLesen: optionen.includes('read-only') || optionen.includes('ro') };
  }
  return bester;
}
/* Die 4-GB-Grenze von FAT32 trifft seit den Behältern nichts mehr: die
   Stücke bleiben unter 2 GB, und alles, was größer sein könnte (Stems),
   liegt in ihnen. Die frühere Prüfung zuGrosseDateien() ist damit weg
   (09.09.2026). */
{
  const medium = dateisystemVon(ZIEL);
  if (!medium) zeile('Ziel: Dateisystem nicht ermittelt (kein Einhängepunkt in der mount-Ausgabe passt)');
  else {
    lauf.zielDateisystem = medium.dateisystem;
    zeile(`Ziel liegt auf ${medium.pfad} (${medium.dateisystem}${medium.nurLesen ? ', nur lesen' : ''})`);
    const ntfs = medium.dateisystem.startsWith('ntfs');     /* Linux nennt es ntfs3 */
    if (ntfs && medium.nurLesen && process.platform === 'darwin') abbruch('NTFS ist auf dem Mac nur lesbar - der Stick müsste als exFAT formatiert werden');
    if (medium.nurLesen) abbruch(`Das Ziel ist nur lesbar eingehängt (${medium.pfad}, ${medium.dateisystem})`);
    if (ntfs && process.platform === 'darwin') zeile('   NTFS ist hier beschreibbar (fremder Treiber) - der Export läuft, aber ohne Gewähr');
    if (medium.dateisystem === 'msdos' || medium.dateisystem === 'vfat' || medium.dateisystem === 'fat32')
      zeile('   FAT32: die Behälter-Stücke bleiben unter 2 GB, es kann losgehen');
  }
}

/* ---------------------------------------------------------------- rsync */
/* Ohne -p/-o/-g: der Stick ist exFAT oder FAT32 und kennt weder Rechte
   noch Besitzer - rsync -a endete dort mit "chmod failed" und Exit 23.
   -L löst Verweise auf (ein Stick kann keine tragen), --modify-window=2
   verzeiht die 2-Sekunden-Uhr von FAT. --delete räumt weg, was zu Hause
   fehlt; --delete-excluded auch das, was inzwischen ausgeschlossen ist
   (eine WAV von einem früheren Export). */
const BEIFANG = ['--exclude', '._*', '--exclude', '.DS_Store', '--exclude', '.git', '--exclude', '.git*', '--exclude', '*.lock', '--exclude', '*.tmp'];
/* --info=progress2 meldet den ganzen Lauf statt jeder Datei; dazu gehört
   --no-inc-recursive, sonst kennt rsync die Summe erst am Ende und die
   Prozentzahl liefe rückwärts (Caspar_D, 09.09.2026). Die Zeile kommt
   mit \r auf dieselbe Stelle: "  1,234,567  45%   12.34MB/s    0:01:23 (xfr#12, to-chk=100/2000)".
   mess = { was, gesamt, vorher, tempo }: der Rahmen für die Mitschrift -
   gesamt aus der Vorabmessung, vorher = Bytes, die frühere rsyncs
   desselben Schritts schon geschafft haben (Programm/ sind fünf Aufrufe,
   ein Balken). Ohne mess läuft rsync stumm - der Trockenlauf der Messung. */
function rsync(quelle, ziel, zusatz, mess, trocken) {
  return new Promise((aufloesen, verwerfen) => {
    const argv = ['-rtL', '--modify-window=2', '--delete', '--delete-excluded', '--stats', '--info=progress2', '--no-inc-recursive',
                  ...((probe || trocken) ? ['--dry-run'] : []), ...BEIFANG, ...(zusatz || []), quelle + '/', ziel + '/'];
    if (!probe && !trocken) fs.mkdirSync(ziel, { recursive: true });
    const k = spawn('rsync', argv, { stdio: ['ignore', 'pipe', 'pipe'] });
    kindProzesse.add(k); k.on('close', () => kindProzesse.delete(k));
    let aus = '', fehler = '', rest = '';
    k.stdout.setEncoding('utf8');
    k.stdout.on('data', (d) => {
      aus += d;
      if (!mess) return;
      const teile = (rest + d).split(/[\r\n]/); rest = teile.pop();
      for (const t of teile) {
        const m = t.match(/^\s*([\d,.]+)\s+(\d+)%\s/);
        if (!m) continue;
        const hier = +m[1].replace(/[,.]/g, '');
        fortschritt(mess, { bytes: (mess.vorher || 0) + hier, prozent: mess.gesamt ? null : +m[2] });
      }
    });
    k.stderr.setEncoding('utf8'); k.stderr.on('data', (d) => { fehler += d; });
    k.on('error', verwerfen);
    k.on('close', (code) => {
      /* Angehalten: rsync hat sein Signal bekommen und die halbe Datei
         selbst weggeräumt - kein Fehler, der Lauf endet gleich sauber. */
      if (anhalten && code !== 0) return aufloesen({ dateien: 0, uebertragen: 0, bytes: 0, bytesUebertragen: 0, angehalten: true });
      /* 24 = "some files vanished" - jemand hat zu Hause gerade etwas
         umgeräumt; kein Grund, den ganzen Export wegzuwerfen. */
      if (code !== 0 && code !== 24) return verwerfen(new Error(`rsync ${path.basename(ziel)}: Exit ${code}\n${fehler.trim().split('\n').slice(-5).join('\n')}`));
      const zahl = (name) => { const z = aus.split('\n').find(x => x.startsWith(name)) || ''; const m = z.match(/:\s*([\d,.]+)/); return m ? +m[1].replace(/[,.]/g, '') : 0; };
      aufloesen({ dateien: zahl('Number of files'), uebertragen: zahl('Number of regular files transferred'),
                  bytes: zahl('Total file size'), bytesUebertragen: zahl('Total transferred file size') });
    });
  });
}
/* DIE VORABMESSUNG: ein Trockenlauf je rsync-Schritt, "Total transferred
   file size" ist dann die Summe, gegen die der Balken läuft. Kostet
   Sekunden (rsync muss beide Seiten einmal ansehen), spart aber den
   Balken, der bei 100 % noch eine Stunde weiterläuft. In der Probe
   entfällt sie - die Probe IST der Trockenlauf. Rückgabe: Bytes je
   Aufruf, in derselben Reihenfolge wie die Paare. */
async function vorabmessen(paare) {
  if (probe) return paare.map(() => 0);
  const ab = Date.now();
  const summen = [];
  for (const p of paare) summen.push((await rsync(p.quelle, p.ziel, p.zusatz, null, true)).bytesUebertragen);
  const gesamt = summen.reduce((a, b) => a + b, 0);
  zeile(`   Vorabmessung: ${(gesamt / 1048576).toFixed(0)} MB zu übertragen (${Math.round((Date.now() - ab) / 1000)} s)`);
  return summen;
}

/* ---------------------------------------------------------------- Musik/ */
/* Dateiname aus dem Namen des Titels. Verboten sind auf Windows und in
   FAT die neun Zeichen  / \ : * ? " < > |  plus Steuerzeichen; ein Name
   darf nicht auf Punkt oder Leerzeichen enden, und CON, NUL, COM1 ...
   sind dort Geräte. Umlaute und andere Schriften bleiben - exFAT und
   NTFS können Unicode, und "Morgendämmerung" soll auch so heißen. */
function dateiname(titel) {
  let n = String(titel || '').replace(/[\\/:*?"<>|]/g, '-').replace(/[\x00-\x1f\x7f]/g, '')
    .replace(/\s+/g, ' ').trim().slice(0, 80).replace(/[. ]+$/, '');
  if (!n) n = 'Ohne Titel';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(n)) n += '_';
  return n;
}
/* Alle Titel bekommen ihren Namen, Doppelnamen (die vier "Waldesrauschen")
   in Entstehungsreihenfolge " (2)", " (3)" ... Verglichen wird ohne
   Groß/Klein - Windows und der Mac tun das auch. */
function musikPlan() {
  const gesehen = new Map(); const plan = [];
  eigene.forEach((s, i) => {
    const stamm = dateiname(s.titel); const k = stamm.toLowerCase();
    const n = (gesehen.get(k) || 0) + 1; gesehen.set(k, n);
    plan.push({ song: s, nr: i + 1, name: (n === 1 ? stamm : `${stamm} (${n})`) + '.mp3' });
  });
  return plan;
}
function musikBauen(eintrag, zielDatei) {
  return new Promise((aufloesen) => {
    const s = eintrag.song;
    const mp3  = path.join(SONGS, s.id, 'audio.mp3');
    const bild = ['titelbild.jpg', 'cover.jpg'].map(b => path.join(SONGS, s.id, b)).find(f => fs.existsSync(f));
    /* Über eine .tmp-Datei, damit ein abgebrochener Lauf keine halbe MP3
       unter gutem Namen hinterlässt; -f mp3, weil ffmpeg den Behälter
       sonst an der Endung erkennen will. */
    const tmp = zielDatei + '.tmp';
    const argv = ['-v', 'error', '-y', '-i', mp3];
    if (bild) argv.push('-i', bild, '-map', '0:a', '-map', '1:0', '-c', 'copy', '-disposition:v', 'attached_pic');
    else argv.push('-map', '0:a', '-c', 'copy');
    argv.push('-id3v2_version', '3', '-write_id3v1', '1',
      '-metadata', `title=${s.titel || ''}`,
      '-metadata', `artist=${anzeigename}`,
      '-metadata', `album=KlangTresor ${handle}`,
      '-metadata', `track=${eintrag.nr}`,
      '-metadata', `date=${(s.erstellt || '').slice(0, 4)}`,
      '-f', 'mp3', tmp);
    const k = spawn('ffmpeg', argv, { stdio: ['ignore', 'ignore', 'pipe'] });
    kindProzesse.add(k); k.on('close', () => kindProzesse.delete(k));
    let fehler = ''; k.stderr.setEncoding('utf8'); k.stderr.on('data', d => { fehler += d; });
    k.on('error', (e) => aufloesen({ ok: false, grund: e.message }));
    k.on('close', (code) => {
      if (code !== 0) { try { fs.unlinkSync(tmp); } catch (e) {} return aufloesen({ ok: false, grund: fehler.trim().split('\n').pop() || 'Exit ' + code }); }
      try { fs.renameSync(tmp, zielDatei); aufloesen({ ok: true }); } catch (e) { aufloesen({ ok: false, grund: e.message }); }
    });
  });
}
async function musik() {
  const ordner = path.join(ZIEL, 'Musik');
  const plan = musikPlan();
  const vorhanden = new Set(plan.map(e => e.name.toLowerCase()));
  let neu = 0, gleich = 0, ohne = 0, fehl = 0, weg = 0, bytes = 0;
  const jung = (f) => { try { return fs.statSync(f).mtimeMs; } catch (e) { return 0; } };
  const offen = [];
  for (const e of plan) {
    const mp3 = path.join(SONGS, e.song.id, 'audio.mp3');
    if (!fs.existsSync(mp3)) { ohne++; continue; }
    const zielDatei = path.join(ordner, e.name);
    const quelle = Math.max(jung(mp3), jung(path.join(SONGS, e.song.id, 'titelbild.jpg')), jung(path.join(SONGS, e.song.id, 'cover.jpg')));
    const da = jung(zielDatei);
    if (da && da >= quelle) { gleich++; bytes += fs.statSync(zielDatei).size; continue; }
    if (probe) { neu++; bytes += fs.statSync(mp3).size; continue; }
    offen.push({ e, zielDatei });
  }
  if (!probe) {
    fs.mkdirSync(ordner, { recursive: true });
    /* Vier ffmpeg nebeneinander: es wird nur kopiert, nicht gerechnet -
       die Platte ist die Grenze, nicht der Prozessor. */
    let i = 0;
    /* Der Balken zählt Dateien (jede MP3 dauert etwa gleich lang); die
       Bytes laufen als Quellgröße mit, damit Tempo und Restzeit stimmen. */
    const groesse = (e) => { try { return fs.statSync(path.join(SONGS, e.song.id, 'audio.mp3')).size; } catch (x) { return 0; } };
    const mess = { was: 'Musik', gesamt: offen.reduce((a, o) => a + groesse(o.e), 0), dateienGesamt: offen.length, tempo: tempoMesser() };
    let bytesFertig = 0;
    fortschritt(mess, { bytes: 0, dateien: 0, prozent: 0 });
    const arbeiter = async () => {
      while (i < offen.length && !anhalten) {
        const { e, zielDatei } = offen[i++];
        const r = await musikBauen(e, zielDatei);
        if (anhalten && !r.ok) break;                     /* ffmpeg hat das Signal bekommen, tmp ist weg */
        if (r.ok) { neu++; bytes += fs.statSync(zielDatei).size; }
        else { fehl++; zeile(`   ffmpeg scheiterte an "${e.name}": ${r.grund}`); }
        bytesFertig += groesse(e);
        fortschritt(mess, { bytes: bytesFertig, dateien: neu + fehl, prozent: Math.round(100 * (neu + fehl) / Math.max(1, offen.length)) });
      }
    };
    await Promise.all([0, 1, 2, 3].map(arbeiter));
    /* Aufräumen: MP3s, die keinem Titel mehr gehören (umbenannt, gelöscht,
       aus einem älteren Export). Nur .mp3, nur in Musik/ - alles andere
       dort hat jemand von Hand hingelegt und bleibt. Nicht beim Anhalten. */
    for (const f of anhalten ? [] : fs.readdirSync(ordner)) {
      if (!f.toLowerCase().endsWith('.mp3') || f.startsWith('._')) continue;
      if (vorhanden.has(f.toLowerCase())) continue;
      try { fs.unlinkSync(path.join(ordner, f)); weg++; } catch (e) {}
    }
  }
  zeile(`Musik/: ${plan.length} Titel, ${neu} ${probe ? 'zu schreiben' : 'geschrieben'}, ${gleich} unverändert` +
        (ohne ? `, ${ohne} ohne MP3 zu Hause` : '') + (fehl ? `, ${fehl} gescheitert` : '') + (weg ? `, ${weg} verwaiste entfernt` : ''));
  return { dateien: neu + gleich, bytes, fehl };
}

/* ---------------------------------------------------------------- node/ */
const NODE_PLATTFORMEN = [
  { ordner: 'win-x64',      dateien: ['node.exe', 'LICENSE'], system: 'Windows' },
  { ordner: 'darwin-x64',   dateien: ['node', 'LICENSE'],     system: 'Mac (Intel)' },
  { ordner: 'darwin-arm64', dateien: ['node', 'LICENSE'],     system: 'Mac (Apple Silicon)' },
];
function nodeKopieren() {
  const da = [], fehlt = [];
  let bytes = 0, dateien = 0;
  /* Erst sehen, was zu kopieren ist, dann kopieren - so hat der Balken
     eine Summe (drei Node-Binaries sind ein paar hundert MB, auf einem
     langsamen Stick eine Minute). */
  const offen = [];
  for (const p of NODE_PLATTFORMEN) {
    const quelle = path.join(LIB, 'node-portabel', p.ordner);
    if (!p.dateien.every(f => fs.existsSync(path.join(quelle, f)))) { fehlt.push(p); continue; }
    da.push(p);
    for (const f of p.dateien) {
      const von = path.join(quelle, f), nach = path.join(ZIEL, 'node', p.ordner, f);
      const sv = fs.statSync(von); let sn = null; try { sn = fs.statSync(nach); } catch (e) {}
      bytes += sv.size; dateien++;
      if (sn && sn.size === sv.size && sn.mtimeMs >= sv.mtimeMs - 2000) continue;
      if (probe) continue;
      offen.push({ von, nach, bytes: sv.size });
    }
  }
  if (offen.length) {
    const mess = { was: 'Node', gesamt: offen.reduce((a, o) => a + o.bytes, 0), dateienGesamt: offen.length, tempo: tempoMesser() };
    let bytesFertig = 0, fertig = 0;
    fortschritt(mess, { bytes: 0, dateien: 0 });
    for (const o of offen) {
      if (anhalten) break;
      const sv = fs.statSync(o.von);
      kopiereDatei(o.von, o.nach, sv.mtime, sv.atime, (summe) => fortschritt(mess, { bytes: bytesFertig + summe, dateien: fertig }));
      try { fs.chmodSync(o.nach, 0o755); } catch (e) {}     /* auf exFAT wirkungslos, auf APFS nötig */
      bytesFertig += o.bytes; fertig++;
      fortschritt(mess, { bytes: bytesFertig, dateien: fertig });
    }
  }
  /* Ein Node-Ordner, der zu Hause verschwunden ist, bleibt auf dem Stick -
     ein Stick, der läuft, wird nicht kaputtgemacht, weil zu Hause gerade
     aufgeräumt wurde. Steht in LIES-MICH.md als "fehlt", wenn er fehlt. */
  let version = ''; try { version = fs.readFileSync(path.join(LIB, 'node-portabel', 'VERSION'), 'utf8').trim(); } catch (e) {}
  zeile(`node/: ${da.map(p => p.ordner).join(', ') || 'nichts'}${version ? ' (' + version + ')' : ''}` +
        (fehlt.length ? ` - FEHLT für ${fehlt.map(p => p.system).join(', ')}: library/node-portabel/ ist dort noch leer, der Stick braucht dann ein installiertes Node.js` : ''));
  return { da, fehlt, version, bytes, dateien };
}

/* ---------------------------------------------------------------- Startskripte und LIES-MICH */
/* Die drei Skripte tun dasselbe: das mitgebrachte Node wählen (sonst das
   installierte), den Server EINGEFROREN auf 8788 starten, in seiner
   Ausgabe nachsehen, welchen Port er tatsächlich bekommen hat ("KlangTresor
   auf http://localhost:PORT" - ist 8788 belegt, nimmt er den nächsten
   freien), warten, bis /api/index antwortet, Browser auf. */
const MAC_SKRIPT = `#!/bin/bash
# KlangTresor - eingefrorenes Archiv - Start auf dem Mac
# Doppelklick genügt. Beim ersten Mal fragt macOS vielleicht nach
# (Rechtsklick > Öffnen hilft). Dieses Fenster offen lassen, solange
# KlangTresor laufen soll; Schließen beendet ihn.
cd "$(dirname "$0")" || exit 1
case "$(uname -m)" in arm64) P=darwin-arm64;; *) P=darwin-x64;; esac
NODE="$PWD/node/$P/node"
if [ -f "$NODE" ]; then
  chmod +x "$NODE" 2>/dev/null
  xattr -d com.apple.quarantine "$NODE" 2>/dev/null
else
  NODE="$(command -v node)"
  if [ -z "$NODE" ]; then
    echo; echo "  Für diesen Mac ($P) ist kein Node im Ordner node/ - und installiert ist auch keins."
    echo "  Node.js von https://nodejs.org holen (LTS), dann noch einmal doppelklicken."; echo
    read -r -p "  Eingabetaste zum Schließen "; exit 1
  fi
fi
LOG="\${TMPDIR:-/tmp}/klangtresor-archiv.log"; : > "$LOG"
echo; echo "  KlangTresor (Archiv, eingefroren) startet ..."
"$NODE" Programm/server/server.js --eingefroren --port 8788 >"$LOG" 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null' EXIT INT TERM HUP
PORT=""
for i in $(seq 1 60); do
  PORT=$(grep -o 'KlangTresor auf http://localhost:[0-9]*' "$LOG" | head -1 | sed 's/.*://')
  [ -n "$PORT" ] && break
  if ! kill -0 $PID 2>/dev/null; then echo "  Der Server ist gleich wieder ausgestiegen:"; tail -n 20 "$LOG"; read -r -p "  Eingabetaste zum Schließen "; exit 1; fi
  sleep 0.5
done
[ -z "$PORT" ] && PORT=8788
for i in $(seq 1 60); do curl -s -o /dev/null "http://localhost:$PORT/api/index" && break; sleep 0.5; done
open "http://localhost:$PORT/"
echo "  KlangTresor läuft: http://localhost:$PORT/"
echo "  Dieses Fenster offen lassen. Schließen (oder Strg+C) beendet KlangTresor."; echo
wait $PID
`;

const LINUX_SKRIPT = `#!/bin/sh
# KlangTresor - eingefrorenes Archiv - Start unter Linux
# Aufruf:  sh START-Linux.sh   - braucht ein installiertes Node.js (ab 20).
# Das Terminal offen lassen, solange KlangTresor laufen soll.
cd "$(dirname "$0")" || exit 1
NODE="$(command -v node)"
if [ -z "$NODE" ]; then
  echo; echo "  Kein Node.js gefunden. Bitte installieren (Paketverwaltung oder https://nodejs.org),"
  echo "  dann noch einmal:  sh START-Linux.sh"; echo; exit 1
fi
LOG="\${TMPDIR:-/tmp}/klangtresor-archiv.log"; : > "$LOG"
echo; echo "  KlangTresor (Archiv, eingefroren) startet ..."
"$NODE" Programm/server/server.js --eingefroren --port 8788 >"$LOG" 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null' EXIT INT TERM HUP
PORT=""
i=0
while [ $i -lt 60 ]; do
  PORT=$(grep -o 'KlangTresor auf http://localhost:[0-9]*' "$LOG" | head -n 1 | sed 's/.*://')
  [ -n "$PORT" ] && break
  if ! kill -0 $PID 2>/dev/null; then echo "  Der Server ist gleich wieder ausgestiegen:"; tail -n 20 "$LOG"; exit 1; fi
  sleep 0.5; i=$((i + 1))
done
[ -z "$PORT" ] && PORT=8788
i=0
while [ $i -lt 60 ]; do
  if command -v curl >/dev/null 2>&1; then curl -s -o /dev/null "http://localhost:$PORT/api/index" && break; else sleep 2; break; fi
  sleep 0.5; i=$((i + 1))
done
if command -v xdg-open >/dev/null 2>&1; then xdg-open "http://localhost:$PORT/" >/dev/null 2>&1; fi
echo "  KlangTresor läuft: http://localhost:$PORT/"
echo "  Dieses Terminal offen lassen. Strg+C beendet KlangTresor."; echo
wait $PID
`;

/* Windows: CRLF, weil cmd.exe Zeilen mit nacktem LF an manchen Stellen
   verschluckt. Die Ausgabe des Servers geht in eine Logdatei, weil ein
   mit "start" abgesetztes Fenster seine Ausgabe nicht hierher meldet;
   findstr fischt den Port daraus. */
const WIN_SKRIPT = [
  '@echo off',
  'rem KlangTresor - eingefrorenes Archiv - Start unter Windows',
  'rem Doppelklick genuegt. Meldet sich SmartScreen: "Weitere Informationen" und',
  'rem "Trotzdem ausfuehren". Es geht ein kleines Fenster "KlangTresor Server"',
  'rem auf - das bleibt offen, solange KlangTresor laufen soll.',
  'setlocal EnableDelayedExpansion',
  'cd /d "%~dp0"',
  'title KlangTresor (Archiv)',
  'set "NODE=%~dp0node\\win-x64\\node.exe"',
  'if not exist "%NODE%" (',
  '  where node >nul 2>nul',
  '  if errorlevel 1 (',
  '    echo.',
  '    echo   Im Ordner node\\win-x64 liegt kein node.exe - und installiert ist auch keins.',
  '    echo   Node.js von https://nodejs.org holen ^(LTS, .msi^), dann noch einmal doppelklicken.',
  '    echo.',
  '    pause',
  '    exit /b 1',
  '  )',
  '  set "NODE=node"',
  ')',
  'set "LOG=%TEMP%\\klangtresor-archiv.log"',
  'type nul > "%LOG%"',
  'echo.',
  'echo   KlangTresor (Archiv, eingefroren) startet ...',
  'start "KlangTresor Server - offen lassen" /min cmd /c ""%NODE%" Programm\\server\\server.js --eingefroren --port 8788 > "%LOG%" 2>&1"',
  'set "PORT="',
  'for /l %%i in (1,1,40) do (',
  '  if not defined PORT (',
  '    for /f "tokens=3 delims=: " %%p in (\'findstr /c:"KlangTresor auf http://localhost:" "%LOG%" 2^>nul\') do set "PORT=%%p"',
  '    if not defined PORT timeout /t 1 /nobreak >nul',
  '  )',
  ')',
  'if not defined PORT set "PORT=8788"',
  'where curl >nul 2>nul',
  'if errorlevel 1 (timeout /t 3 /nobreak >nul) else (',
  '  for /l %%i in (1,1,30) do (',
  '    curl -s -o nul "http://localhost:!PORT!/api/index" 2>nul && goto :auf',
  '    timeout /t 1 /nobreak >nul',
  '  )',
  ')',
  ':auf',
  'start "" "http://localhost:!PORT!/"',
  'echo   KlangTresor laeuft: http://localhost:!PORT!/',
  'echo   Das kleine Fenster "KlangTresor Server" offen lassen - es schliessen beendet KlangTresor.',
  'echo   Dieses Fenster hier darf zu.',
  'echo.',
  'pause',
  '',
].join('\r\n');

function liesMich(stand, nodeStand) {
  const datum = new Date(stand.exportiertAm).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const gb = (stand.bytes / 1073741824).toFixed(1).replace('.', ',');
  const fehlt = [
    'die WAV-Originale (nur für Messungen gebraucht, die längst gerechnet sind)',
    stand.mitStems ? null : 'die Stems (die getrennten Spuren; nur auf Wunsch, --stems)',
    'die Zugangsdaten (geheim/) - und damit alles, was bei Suno etwas holen würde',
    ...nodeStand.fehlt.map(p => `ein mitgebrachtes Node für ${p.system} - dort braucht es ein installiertes Node.js (https://nodejs.org)`),
  ].filter(Boolean);
  return `# KlangTresor - Archiv von ${anzeigename} (@${handle})

Stand: ${datum}. ${eigene.length} Titel, ${stand.dateien} Dateien, ${gb} GB.

Dieses Archiv ist **eingefroren**: es zeigt und spielt, holt aber nichts
nach und speichert nichts. Es aktualisiert sich nur durch den nächsten
Export zu Hause (dort: Archiv-Export in KlangTresor, dasselbe Ziel).

## Starten

**Mac** - Doppelklick auf \`START-Mac.command\`.
Fragt macOS nach: Rechtsklick > Öffnen. Das Terminalfenster offen lassen.
Der Browser geht von selbst auf (http://localhost:8788, sonst der nächste freie Port).

**Windows** - Doppelklick auf \`START-Windows.cmd\`.
Meldet sich SmartScreen: "Weitere Informationen", "Trotzdem ausführen".
Das kleine Fenster "KlangTresor Server" offen lassen; der Browser geht von selbst auf.

**Linux** - im Terminal \`sh START-Linux.sh\` (braucht ein installiertes Node.js ab 20).
Das Terminal offen lassen; der Browser geht von selbst auf (xdg-open).

## Was hier liegt

- \`Musik/\` - alle Titel als MP3, benannt nach dem Namen des Titels, mit
  Titelbild und Tags im Stück (ID3). Für Fernseher, Autoradio, VLC: den
  Ordner öffnen, fertig.
- \`Sternenhimmel.html\` - der Klangraum als eine Datei. Im Browser öffnen,
  Klick auf einen Stern spielt ihn - direkt von hier, ohne Netz.
- \`Programm/\` - KlangTresor selbst samt Bestand (\`Programm/library/\`):
  Katalog, Texte, Wort-Zeitmarken, Herzen und Abrufe, Beobachter, Alben,
  Notizen, Messwerte als Dateien - und Ton, Titelbilder, Bewegtbilder,
  Analyse und Herzen-Listen in \`bestand-001.tar\` (und weiteren Stücken
  bis 2 GB). KlangTresor liest direkt daraus; wer die Dateien einzeln
  will, packt die Stücke mit tar aus (Mac: Doppelklick, Windows: tar -xf).
- \`node/\` - das mitgebrachte Node.js${nodeStand.version ? ' (' + nodeStand.version + ')' : ''}, damit nichts installiert werden muss.

## Was fehlt

${fehlt.map(f => '- ' + f).join('\n')}

Erzeugt am ${datum} mit \`bin/export.js\` aus dem KlangTresor zu Hause.
`;
}

/* ---------------------------------------------------------------- Probestart */
function freierPort(ab) {
  return new Promise((aufloesen) => {
    const s = net.createServer();
    s.once('error', () => aufloesen(freierPort(ab + 1)));
    s.listen(ab, '127.0.0.1', () => s.close(() => aufloesen(ab)));
  });
}
function holen(url) {
  return new Promise((aufloesen) => {
    const r = http.get(url, { timeout: 4000 }, (res) => {
      let d = ''; res.setEncoding('utf8'); res.on('data', c => { d += c; });
      res.on('end', () => { try { aufloesen({ status: res.statusCode, json: JSON.parse(d) }); } catch (e) { aufloesen({ status: res.statusCode, json: null }); } });
    });
    r.on('error', () => aufloesen(null)); r.on('timeout', () => { r.destroy(); aufloesen(null); });
  });
}
const pause = (ms) => new Promise(r => setTimeout(r, ms));
async function probestart() {
  const wunsch = await freierPort(18790);
  const server = path.join(ZIEL, 'Programm', 'server', 'server.js');
  if (!fs.existsSync(server)) return 'fehlgeschlagen: Programm/server/server.js fehlt im Ziel';
  zeile(`Probestart: ${process.execPath} Programm/server/server.js --eingefroren --port ${wunsch} (vom Ziel aus)`);
  const k = spawn(process.execPath, ['Programm/server/server.js', '--eingefroren', '--port', String(wunsch)],
                  { cwd: ZIEL, env: { ...process.env, KLANGTRESOR_EINGEFROREN: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let aus = '', zuEnde = null;
  k.stdout.setEncoding('utf8'); k.stdout.on('data', d => { aus += d; });
  k.stderr.setEncoding('utf8'); k.stderr.on('data', d => { aus += d; });
  k.on('error', (e) => { zuEnde = 'konnte nicht starten: ' + e.message; });
  k.on('close', (code) => { if (zuEnde === null) zuEnde = 'Exit ' + code; });
  /* NUR DIESE PID. Der KlangTresor auf 8788 läuft weiter; sollte der
     kopierte Server den Modus noch nicht kennen und auf 8788 wollen,
     steigt er dort selbst aus ("läuft bereits") - wir fragen nie dort. */
  const beenden = async () => {
    if (zuEnde !== null) return;
    try { process.kill(k.pid, 'SIGTERM'); } catch (e) {}
    for (let i = 0; i < 30 && zuEnde === null; i++) await pause(100);
    if (zuEnde === null) { try { process.kill(k.pid, 'SIGKILL'); } catch (e) {} }
  };
  try {
    let port = null, antwort = null;
    for (let i = 0; i < 60 && !antwort; i++) {
      if (zuEnde !== null) return `fehlgeschlagen: Server ${zuEnde} - ${aus.trim().split('\n').slice(-3).join(' | ')}`;
      const m = aus.match(/KlangTresor auf http:\/\/localhost:(\d+)/);
      if (m) port = +m[1];
      /* Ohne Ausgabe des Ports bleibt nur der Wunschport - einen Server,
         der woanders lauscht, würden wir nie erreichen, und das ist gut so. */
      if (port || i >= 6) antwort = await holen(`http://localhost:${port || wunsch}/api/index`);
      if (!antwort) await pause(500);
    }
    if (!antwort) return `fehlgeschlagen: keine Antwort auf /api/index binnen 30 s - ${aus.trim().split('\n').slice(-3).join(' | ')}`;
    if (antwort.status !== 200 || !antwort.json) return `fehlgeschlagen: /api/index antwortet ${antwort.status}`;
    const j = antwort.json;
    /* Der eingefrorene Server zeigt nur Titel, deren MP3 da ist - also
       so viele, wie zu Hause eine MP3 haben. */
    const erwartet = eigene.filter(hatMp3).length;
    if (j.anzahl !== erwartet) return `fehlgeschlagen: das Ziel meldet ${j.anzahl} Titel, zu Hause haben ${erwartet} eine MP3`;
    if (!j.eingefroren) return `fehlgeschlagen: ${j.anzahl} Titel da, aber der Server meldet keinen Modus eingefroren (Server-Teil fehlt noch?)`;
    zeile(`Probestart: ${j.anzahl} Titel auf Port ${port || wunsch}, eingefroren seit ${j.eingefroren.seit}`);
    return 'ok';
  } finally { await beenden(); }
}

/* ---------------------------------------------------------------- Der Kopierer */
/* Die Stufen 1-4 und 6 laufen über diesen Kopierer statt über rsync, weil
   nur er die REIHENFOLGE hält (neueste Titel zuerst). Gleich ist eine
   Datei, wenn Größe und Zeit stimmen - dieselbe Regel wie rsync -t mit
   --modify-window=2 (FAT und exFAT runden auf zwei Sekunden). Kopiert
   wird über .tmp und rename, damit ein Abbruch nie eine halbe Datei
   unter gutem Namen hinterlässt, und die Zeit der Quelle wird auf die
   Kopie übertragen - sonst hielte der Aufräumlauf jede Kopie für
   geändert und kopierte alles noch einmal. */
/* Eine Datei in Stücken von 4 MB - nach jedem Stück eine Meldung, damit
   Balken, Tempo und Restzeit auch bei einer 110-MB-Datei laufen (Node auf
   dem Intenso: drei Minuten, in denen der Balken sonst stünde und die
   Restzeit aus einem einzigen Messpunkt Unsinn rechnete, 09.09.2026).
   Über .tmp und rename; die Zeit der Quelle kommt auf die Kopie. */
function kopiereDatei(von, nach, mtime, atime, melde) {
  fs.mkdirSync(path.dirname(nach), { recursive: true });
  const tmp = nach + '.tmp';
  const STUECK = 4 * 1048576;
  const puffer = Buffer.allocUnsafe(STUECK);
  const q = fs.openSync(von, 'r'); let z = null;
  try {
    z = fs.openSync(tmp, 'w');
    let gelesen, summe = 0;
    while ((gelesen = fs.readSync(q, puffer, 0, STUECK, null)) > 0) {
      fs.writeSync(z, puffer, 0, gelesen);
      summe += gelesen;
      if (melde) melde(summe);
    }
  } finally { fs.closeSync(q); if (z !== null) fs.closeSync(z); }
  try { fs.utimesSync(tmp, atime || mtime, mtime); } catch (e) {}
  fs.renameSync(tmp, nach);
}
function kopierListe(paare) {
  const offen = []; let gleich = 0, bytesGleich = 0, fehlt = 0;
  for (const q of paare) {
    let sv = null; try { sv = fs.statSync(q.von); } catch (e) { fehlt++; continue; }
    if (!sv.isFile()) continue;
    let sn = null; try { sn = fs.statSync(q.nach); } catch (e) {}
    if (sn && sn.size === sv.size && Math.abs(sn.mtimeMs - sv.mtimeMs) <= 2000) { gleich++; bytesGleich += sv.size; continue; }
    offen.push({ von: q.von, nach: q.nach, bytes: sv.size, mtime: sv.mtime, atime: sv.atime, titel: q.titel || null });
  }
  return { offen, gleich, bytesGleich, fehlt, bytesOffen: offen.reduce((a, o) => a + o.bytes, 0) };
}
/* Kopiert die Liste in ihrer Reihenfolge; meldet Fortschritt; hört auf,
   sobald Anhalten angefordert ist. jeTitel(o) wird nach jeder Datei mit
   dem Eintrag gerufen (Stufe 2 zählt damit die fertigen Titel). */
async function kopieren(liste, was, jeTitel) {
  const mess = { was, gesamt: liste.bytesOffen, dateienGesamt: liste.offen.length, tempo: tempoMesser() };
  let bytesFertig = 0, dateien = 0;
  fortschritt(mess, { bytes: 0, dateien: 0 });
  for (const o of liste.offen) {
    if (anhalten) break;
    if (!probe) kopiereDatei(o.von, o.nach, o.mtime, o.atime, (summe) => { if (o.bytes > 8 * 1048576) fortschritt(mess, { bytes: bytesFertig + summe, dateien }); });
    bytesFertig += o.bytes; dateien++;
    if (jeTitel) jeTitel(o);
    fortschritt(mess, { bytes: bytesFertig, dateien });
    /* Ein Atemzug je Datei, damit das Signal zum Anhalten zwischen zwei
       Dateien ankommt - copyFileSync blockt sonst die ganze Schleife. */
    await new Promise(r => setImmediate(r));
  }
  return { dateien, bytes: bytesFertig };
}
/* Die eigenen Titel, neueste zuerst - die Reihenfolge der Vorführung. */
const neuesteZuerst = eigene.slice().sort((a, b) => (b.erstellt || '').localeCompare(a.erstellt || ''));
const hatMp3 = (s) => fs.existsSync(path.join(SONGS, s.id, 'audio.mp3'));
/* Was NICHT über den Kopierer geht (und nie auf den Stick): dieselben
   Ausnahmen wie der Aufräumlauf unten. */
const KERN_AUSSEN = new Set(['roh', 'backup', 'node-portabel', 'suno-wege', 'modelle', 'songs', 'analyse', 'liker']);
function kernPaare(PROGRAMM) {
  const paare = [];
  const gehe = (rel) => {
    const ordner = path.join(LIB, rel);
    let e = []; try { e = fs.readdirSync(ordner, { withFileTypes: true }); } catch (x) { return; }
    for (const x of e) {
      if (x.name.startsWith('.') || x.name === 'export-lauf.json' || x.name === 'export-stand.json' || x.name.endsWith('.tmp')) continue;
      const r = rel ? path.join(rel, x.name) : x.name;
      if (x.isDirectory()) { if (!rel && KERN_AUSSEN.has(x.name)) continue; if (r === path.join('kondensate', 'arbeit')) continue; gehe(r); }
      else if (x.isFile()) paare.push({ von: path.join(LIB, r), nach: path.join(PROGRAMM, 'library', r) });
    }
  };
  gehe('');
  return paare;
}
/* Die Paare für die Behälter tragen rel = Pfad relativ zu library/ mit
   Vorwärtsschrägstrichen - so heißen die Einträge im Stück. */
function titelPaare(dateien) {
  const paare = [];
  for (const s of neuesteZuerst) for (const f of dateien) paare.push({ von: path.join(SONGS, s.id, f), rel: `songs/${s.id}/${f}`, titel: s.id });
  return paare;
}
/* Alles Übrige im Titelordner (cover.jpg, Bewegtbild ...), ohne WAV und
   ohne stems/ - und ohne, was Stufe 2 schon hatte. */
function titelRestPaare(ohne) {
  const paare = [];
  for (const s of neuesteZuerst) {
    let e = []; try { e = fs.readdirSync(path.join(SONGS, s.id), { withFileTypes: true }); } catch (x) { continue; }
    for (const x of e) if (x.isFile() && !x.name.startsWith('.') && x.name !== 'audio.wav' && !ohne.includes(x.name) && !x.name.endsWith('.tmp'))
      paare.push({ von: path.join(SONGS, s.id, x.name), rel: `songs/${s.id}/${x.name}`, titel: s.id });
  }
  return paare;
}
function analysePaare() {
  const A = path.join(LIB, 'analyse');
  let e = []; try { e = fs.readdirSync(A); } catch (x) { return []; }
  const rang = new Map(neuesteZuerst.map((s, i) => [s.id, i]));
  const r = (f) => { const m = f.match(/^([0-9a-f-]{36})/i); return m && rang.has(m[1]) ? rang.get(m[1]) : 1e9; };
  return e.filter(f => !f.startsWith('.') && !f.endsWith('.tmp')).sort((a, b) => r(a) - r(b) || a.localeCompare(b))
          .map(f => ({ von: path.join(A, f), rel: `analyse/${f}` }));
}
function likerPaare() {
  const L = path.join(LIB, 'liker');
  let e = []; try { e = fs.readdirSync(L); } catch (x) { return []; }
  return e.filter(f => f.endsWith('.json') && !f.startsWith('.')).sort().map(f => ({ von: path.join(L, f), rel: `liker/${f}` }));
}
function stemsPaare() {
  const paare = [];
  for (const s of neuesteZuerst) {
    const d = path.join(SONGS, s.id, 'stems');
    let e = []; try { e = fs.readdirSync(d); } catch (x) { continue; }
    for (const f of e) if (!f.startsWith('.') && !f.endsWith('.tmp')) paare.push({ von: path.join(d, f), rel: `songs/${s.id}/stems/${f}`, titel: s.id });
  }
  return paare;
}
/* Wie viele Titel auf dem Stick spielbar sind: die MP3 liegt im Behälter
   (oder, Altbestand, noch als Datei). */
function titelImZiel(PROGRAMM, b) {
  let n = 0;
  for (const s of eigene) if ((b && b.hat(`songs/${s.id}/audio.mp3`)) || fs.existsSync(path.join(PROGRAMM, 'library', 'songs', s.id, 'audio.mp3'))) n++;
  return n;
}
/* DER ZWISCHENSTAND: eine Teilkopie sagt, was sie ist. Der eingefrorene
   Server liest sie (/api/index: eingefroren.teilkopie) und die App zeigt
   "Teilkopie von @alias vom Datum". Am Ende überschreibt der volle Stand
   die Datei. */
let standTitel = 0, standStufe = null, behaelterStand = null;
function teilstandSchreiben(PROGRAMM, rn) {
  if (probe) return;
  const stand = { exportiertAm: new Date().toISOString(), teilkopie: true, stufe: standStufe, titel: standTitel, titelZuHause: eigene.filter(hatMp3).length,
                  dateien: null, bytes: null, mitStems: stems, handle, anzeigename, node: rn ? rn.da.map(p => p.ordner) : [], behaelter: behaelterStand };
  try { fs.mkdirSync(path.join(PROGRAMM, 'library'), { recursive: true }); fs.writeFileSync(path.join(PROGRAMM, 'library', 'export-stand.json'), JSON.stringify(stand, null, 1)); } catch (e) {}
}

/* ---------------------------------------------------------------- Zählen */
function zaehlen(ordner, ohne) {
  let dateien = 0, bytes = 0;
  const gehe = (d) => {
    let e = []; try { e = fs.readdirSync(d, { withFileTypes: true }); } catch (x) { return; }
    for (const x of e) {
      if (x.name.startsWith('._') || x.name === '.DS_Store') continue;
      const f = path.join(d, x.name);
      if (ohne && ohne.has(f)) continue;
      if (x.isDirectory()) gehe(f);
      else if (x.isFile()) { dateien++; try { bytes += fs.statSync(f).size; } catch (y) {} }
    }
  };
  gehe(ordner);
  return { dateien, bytes };
}

/* ================================================================ Der Lauf */
(async () => {
  const PROGRAMM = path.join(ZIEL, 'Programm');
  let dateien = 0, bytes = 0;
  const dauerS = () => Math.round((Date.now() - START) / 1000);
  /* Angehalten: Stand schreiben, Ergebnis in die Mitschrift, gehen. */
  const angehalten = (rn) => {
    if (B) { try { B.schliessen(); behaelterStand = B.masse(); } catch (e) {} }
    teilstandSchreiben(PROGRAMM, rn);
    lauf.ergebnis = { angehalten: true, stufe: standStufe, titel: standTitel, dauerS: dauerS() };
    lauf.laeuft = false; lauf.fertig = false; lauf.schritt = 'angehalten'; lauf.fortschritt = null;
    laufSchreiben(true);
    console.log(`\n  Angehalten nach ${standStufe ? 'Stufe ' + standStufe.nr + ' (' + standStufe.name + ')' : 'dem Start'}: ${standTitel} Titel auf dem Stick spielbar. Erneut starten setzt fort.\n`);
    process.exitCode = 4;
  };
  /* DER BEHÄLTER-SCHRITT: wie kopierSchritt, nur ins Stück statt auf
     Dateien. Gleich ist, was Größe und Zeit nach dem Verzeichnis hat;
     der Rest hängt hinten an, in Reihenfolge, mit Meldung alle 4 MB. */
  let B = null;
  const behaelterAuf = () => { if (!B && !probe) B = Behaelter.oeffnen(path.join(PROGRAMM, 'library'), true); return B; };
  const behaelterSchritt = async (name, paare, was, jeTitel) => {
    const b = behaelterAuf();
    const offen = []; let gleich = 0, bytesGleich = 0, fehlt = 0;
    for (const q of paare) {
      let sv = null; try { sv = fs.statSync(q.von); } catch (e) { fehlt++; continue; }
      if (!sv.isFile()) continue;
      if (b && b.gleich(q.rel, sv)) { gleich++; bytesGleich += sv.size; continue; }
      offen.push({ von: q.von, rel: q.rel, bytes: sv.size, stat: sv, titel: q.titel || null });
    }
    const bytesOffen = offen.reduce((s, o) => s + o.bytes, 0);
    zeile(`   ${offen.length} in den Behälter (${(bytesOffen / 1048576).toFixed(0)} MB), ${gleich} schon drin` + (fehlt ? `, ${fehlt} gibt es zu Hause nicht (kein Grund zur Sorge)` : ''));
    const mess = { was, gesamt: bytesOffen, dateienGesamt: offen.length, tempo: tempoMesser() };
    let bytesFertig = 0, n = 0;
    fortschritt(mess, { bytes: 0, dateien: 0 });
    for (const o of offen) {
      if (anhalten) break;
      if (b) b.schreiben(o.rel, o.von, o.stat, (s) => { if (o.bytes > 8 * 1048576) fortschritt(mess, { bytes: bytesFertig + s, dateien: n }); });
      bytesFertig += o.bytes; n++;
      if (jeTitel) jeTitel(o);
      fortschritt(mess, { bytes: bytesFertig, dateien: n });
      await new Promise(r => setImmediate(r));
    }
    if (b) { b.indexSchreiben(true); behaelterStand = b.masse(); }
    dateien += gleich + n; bytes += bytesGleich + bytesFertig;
    zeile(`   ${name}: ${n} ${probe ? 'zu schreiben' : 'geschrieben'} (${(bytesFertig / 1048576).toFixed(0)} MB)`);
    return { dateien: n, bytes: bytesFertig };
  };
  const kopierSchritt = async (name, paare, was, jeTitel) => {
    const liste = kopierListe(paare);
    /* "fehlt" ist kein Mangel: nicht jeder Titel hat ein beschnittenes
       Titelbild oder eine Kachel - die Liste fragt nach allen dreien. */
    zeile(`   ${liste.offen.length} zu kopieren (${(liste.bytesOffen / 1048576).toFixed(0)} MB), ${liste.gleich} schon da` + (liste.fehlt ? `, ${liste.fehlt} gibt es zu Hause nicht (kein Grund zur Sorge)` : ''));
    const r = await kopieren(liste, was, jeTitel);
    dateien += liste.gleich + r.dateien; bytes += liste.bytesGleich + r.bytes;
    zeile(`   ${name}: ${r.dateien} ${probe ? 'zu kopieren' : 'kopiert'} (${(r.bytes / 1048576).toFixed(0)} MB)`);
    return r;
  };

  /* ---- Stufe 1: Starten */
  stufe(1, 'Starten - Programm, Bestand-Kern, Sternenhimmel, Node');
  standStufe = lauf.stufe;
  const programmOrdner = ['web', 'server', 'bin', 'browser'].filter(o => {
    if (fs.existsSync(path.join(WURZEL, o))) return true;
    zeile(`   ${o}/ gibt es zu Hause nicht - übersprungen`); return false;
  });
  const programmPaare = programmOrdner.map(o => ({ quelle: path.join(WURZEL, o), ziel: path.join(PROGRAMM, o), zusatz: ['--exclude', 'node_modules/'] }));
  const programmSummen = await vorabmessen(programmPaare);
  const programmMess = { was: 'Programm', gesamt: programmSummen.reduce((a, b) => a + b, 0), vorher: 0, tempo: tempoMesser() };
  for (let i = 0; i < programmPaare.length && !anhalten; i++) {
    const p = programmPaare[i];
    const r = await rsync(p.quelle, p.ziel, p.zusatz, programmMess);
    programmMess.vorher += programmSummen[i];
    dateien += r.dateien; bytes += r.bytes;
    zeile(`   ${programmOrdner[i]}/: ${r.dateien} Dateien, ${r.uebertragen} ${probe ? 'zu übertragen' : 'übertragen'}`);
  }
  if (anhalten) return angehalten(null);
  for (const f of fs.readdirSync(WURZEL).filter(f => f === 'package.json' || f === 'LICENSE' || /^README/i.test(f))) {
    const von = path.join(WURZEL, f), nach = path.join(PROGRAMM, f);
    const sv = fs.statSync(von); let sn = null; try { sn = fs.statSync(nach); } catch (e) {}
    dateien++; bytes += sv.size;
    if (sn && sn.size === sv.size && sn.mtimeMs >= sv.mtimeMs - 2000) continue;
    if (!probe) { fs.mkdirSync(PROGRAMM, { recursive: true }); fs.copyFileSync(von, nach); }
  }
  /* Die Startskripte gleich jetzt - ab hier startet der Stick. */
  if (!probe) {
    fs.mkdirSync(ZIEL, { recursive: true });
    fs.writeFileSync(path.join(ZIEL, 'START-Mac.command'), MAC_SKRIPT);
    fs.writeFileSync(path.join(ZIEL, 'START-Linux.sh'), LINUX_SKRIPT);
    fs.writeFileSync(path.join(ZIEL, 'START-Windows.cmd'), WIN_SKRIPT);
    for (const f of ['START-Mac.command', 'START-Linux.sh']) { try { fs.chmodSync(path.join(ZIEL, f), 0o755); } catch (e) {} }
    try { fs.unlinkSync(path.join(ZIEL, 'START.md')); } catch (e) {}
  }
  await kopierSchritt('Bestand-Kern (Katalog, Texte, Reaktionen, Beobachter, Klangraum)', kernPaare(PROGRAMM), 'Kern');
  if (anhalten) return angehalten(null);
  await behaelterSchritt('Herzen-Listen (liker/)', likerPaare(), 'Kern');
  if (anhalten) return angehalten(null);
  if (!probe) {
    /* Der Sternenhimmel auf dem Stick spielt aus Musik/ (echte Dateien,
       Stufe 5) und trägt die Kacheln in sich - an die Behälter kommt eine
       file://-Seite nicht heran. Die Namen in Musik/ kennt nur dieses
       Skript (musikPlan), deshalb reisen sie über eine kleine Datei. */
    const namen = {}; for (const e of musikPlan()) namen[e.song.id] = e.name;
    fs.mkdirSync(path.join(LIB, 'export'), { recursive: true });
    const namenDatei = path.join(LIB, 'export', 'musik-namen.json');
    fs.writeFileSync(namenDatei, JSON.stringify(namen));
    const rh = spawnSync(process.execPath, ['bin/himmel-export.js', '--musik', 'Musik', '--namen', namenDatei, '--ziel', path.join(ZIEL, 'Sternenhimmel.html')],
                         { cwd: WURZEL, encoding: 'utf8' });
    if (rh.status === 0) zeile('   Sternenhimmel.html: ' + (rh.stdout || '').trim().split('\n').pop());
    else zeile(`   Sternenhimmel nicht gebaut (Exit ${rh.status}): ${((rh.stderr || rh.stdout || '').trim().split('\n').filter(Boolean).slice(-2).join(' | '))}`);
  }
  const rn = nodeKopieren();
  dateien += rn.dateien; bytes += rn.bytes;
  standTitel = probe ? 0 : titelImZiel(PROGRAMM, B);
  teilstandSchreiben(PROGRAMM, rn);
  if (anhalten) return angehalten(rn);

  /* ---- Stufe 2: Titel, neueste zuerst */
  stufe(2, 'Titel, neueste zuerst - Tonspur, Kachel, Titelbild');
  standStufe = lauf.stufe;
  {
    const fertigeTitel = new Set();
    let seitStand = 0;
    await behaelterSchritt('Titel', titelPaare(['audio.mp3', 'kachel.jpg', 'titelbild.jpg']), 'Titel', (o) => {
      if (!o.rel.endsWith('/audio.mp3') || fertigeTitel.has(o.titel)) return;
      fertigeTitel.add(o.titel); standTitel++;
      if (++seitStand >= 25) { seitStand = 0; if (B) B.indexSchreiben(true); teilstandSchreiben(PROGRAMM, rn); }
    });
    standTitel = probe ? standTitel : titelImZiel(PROGRAMM, B);
    zeile(`   ${standTitel} Titel auf dem Stick spielbar`);
    teilstandSchreiben(PROGRAMM, rn);
  }
  if (anhalten) return angehalten(rn);

  /* ---- Stufe 3: große Titelbilder und der Rest im Titelordner */
  stufe(3, 'Große Titelbilder und Bewegtbilder, neueste zuerst');
  standStufe = lauf.stufe;
  await behaelterSchritt('Titelbilder', titelRestPaare(['audio.mp3', 'kachel.jpg', 'titelbild.jpg']), 'Bilder');
  teilstandSchreiben(PROGRAMM, rn);
  if (anhalten) return angehalten(rn);

  /* ---- Stufe 4: Analyse-Ablage */
  stufe(4, 'Analyse-Ablage, neueste zuerst');
  standStufe = lauf.stufe;
  await behaelterSchritt('Analyse', analysePaare(), 'Analyse');
  teilstandSchreiben(PROGRAMM, rn);
  if (anhalten) return angehalten(rn);

  /* ---- Stufe 5: Musik/ für Fernseher und Autoradio, docs/ */
  stufe(5, 'Musik/ für Fernseher und Autoradio, Anleitung');
  standStufe = lauf.stufe;
  const rm = await musik();
  dateien += rm.dateien; bytes += rm.bytes;
  if (anhalten) return angehalten(rn);
  if (fs.existsSync(path.join(WURZEL, 'docs'))) {
    const [ds] = await vorabmessen([{ quelle: path.join(WURZEL, 'docs'), ziel: path.join(PROGRAMM, 'docs'), zusatz: [] }]);
    const rd = await rsync(path.join(WURZEL, 'docs'), path.join(PROGRAMM, 'docs'), [], { was: 'Programm', gesamt: ds, vorher: 0, tempo: tempoMesser() });
    dateien += rd.dateien; bytes += rd.bytes;
    zeile(`   docs/: ${rd.dateien} Dateien, ${rd.uebertragen} ${probe ? 'zu übertragen' : 'übertragen'}`);
  }
  teilstandSchreiben(PROGRAMM, rn);
  if (anhalten) return angehalten(rn);

  /* ---- Stufe 6: Stems */
  if (stems) {
    stufe(6, 'Stems, neueste zuerst');
    standStufe = lauf.stufe;
    await behaelterSchritt('Stems', stemsPaare(), 'Stems');
    teilstandSchreiben(PROGRAMM, rn);
    if (anhalten) return angehalten(rn);
  } else zeile(`» Stufe 6 von ${STUFEN}: Stems - nicht gewählt, übersprungen`);

  /* ---- Stufe 7: Abschluss */
  stufe(7, 'Abschluss - Aufräumlauf, Stand, Probestart');
  standStufe = lauf.stufe;
  const AUSSCHLUSS = [
    /* Was in den Behältern liegt, hat als Datei nichts mehr im Ziel zu
       suchen - der Aufräumlauf gilt nur dem Kern. */
    '--exclude', '/songs/', '--exclude', '/analyse/', '--exclude', '/liker/',
    '--exclude', '/roh/', '--exclude', '/backup/', '--exclude', '/node-portabel/', '--exclude', '/suno-wege/',
    '--exclude', '/kondensate/arbeit/', '--exclude', '/export-lauf.json',
    /* KI-Modelle (ONNX, 564 MB) rechnen Musikstil und Klangraum - das
       eingefrorene Archiv rechnet nichts, es spielt (Caspar_D, 09.09.2026). */
    '--exclude', '/modelle/',
    /* geschützt, nicht ausgeschlossen: der Stand des letzten Exports und
       die Behälter liegen nur im Ziel und würden von --delete sonst
       jedes Mal erst gelöscht */
    '--filter', 'P /export-stand.json', '--filter', 'P /bestand-*.tar', '--filter', 'P /bestand-index.ndjson', '--filter', 'P /bestand-index.ndjson.tmp',
  ];
  /* Der Aufräumlauf über den Kern: holt, was Stufe 1 nicht kannte, räumt
     weg, was zu Hause fehlt. */
  const [datenSumme] = await vorabmessen([{ quelle: LIB, ziel: path.join(PROGRAMM, 'library'), zusatz: AUSSCHLUSS }]);
  const rl = await rsync(LIB, path.join(PROGRAMM, 'library'), AUSSCHLUSS, { was: 'Abschluss', gesamt: datenSumme, vorher: 0, tempo: tempoMesser() });
  if (anhalten) return angehalten(rn);
  zeile(`   Kern: ${rl.dateien} Dateien, ${rl.uebertragen} ${probe ? 'zu übertragen' : 'übertragen'} (${(rl.bytesUebertragen / 1048576).toFixed(0)} MB)`);

  /* GRABSTEINE: was zu Hause weg ist, verschwindet aus dem Verzeichnis
     (die Bytes bleiben als Ballast im Stück, bis verdichtet wird). Stems
     bleiben, solange es sie zu Hause gibt - auch ohne Pille: 28 GB löscht
     man nicht, weil ein Häkchen fehlt. */
  if (B) {
    let weg = 0;
    for (const rel of B.liste()) if (!fs.existsSync(path.join(LIB, rel))) { B.loeschen(rel); weg++; }
    if (weg) zeile(`   ${weg} Einträge aus dem Verzeichnis genommen (zu Hause gelöscht)`);
    /* VERDICHTEN, wenn mehr als ein Viertel Ballast: die lebenden Einträge
       in neue Stücke, dann tauschen. Bricht das Anhalten es ab, bleibt
       alles beim Alten. */
    const m = B.masse();
    if (m.ballast > 0.25 * m.stuecke && m.stuecke > 64 * 1048576) {
      schritt(`Behälter verdichten (${(m.ballast / 1048576).toFixed(0)} MB Ballast in ${(m.stuecke / 1073741824).toFixed(2)} GB)`);
      const mess = { was: 'Verdichten', gesamt: m.lebt, dateienGesamt: m.dateien, tempo: tempoMesser() };
      const ok = B.verdichten((s) => fortschritt(mess, { bytes: s, dateien: null }), () => anhalten);
      zeile(ok ? `   verdichtet: ${(B.masse().stuecke / 1073741824).toFixed(2)} GB in ${B.masse().volumen} Stück(en)` : '   Verdichten abgebrochen, alles beim Alten');
      if (anhalten) return angehalten(rn);
    }
    /* ALTBESTAND: ein Stick aus der Zeit vor den Behältern hat songs/,
       analyse/ und liker/ noch als Dateien. Erst jetzt, wo alles in den
       Stücken liegt, kommen sie weg - vorher spielte der eingefrorene
       Server noch daraus. */
    for (const alt of ['songs', 'analyse', 'liker']) {
      const d = path.join(PROGRAMM, 'library', alt);
      if (!fs.existsSync(d)) continue;
      try { fs.rmSync(d, { recursive: true, force: true }); zeile(`   Altbestand ${alt}/ (Dateien vor den Behältern) entfernt`); }
      catch (e) { zeile(`   Altbestand ${alt}/ ließ sich nicht ganz entfernen: ${e.message} - beim nächsten Lauf noch einmal`); }
    }
    B.schliessen(); behaelterStand = B.masse();
    zeile(`   Behälter: ${behaelterStand.dateien} Einträge, ${(behaelterStand.stuecke / 1073741824).toFixed(2)} GB in ${behaelterStand.volumen} Stück(en)`);
  }
  /* Ab hier zählt, was im Ziel liegt (zaehlen), nicht die Summe der Stufen. */

  let probestartErgebnis = 'übersprungen';
  if (!probe) {
    const stand = { exportiertAm: new Date().toISOString(), dateien: 0, bytes: 0,
                    mitStems: stems || !!(B && B.liste('songs/').some(p => p.includes('/stems/'))),
                    handle, anzeigename, titel: titelImZiel(PROGRAMM, B), behaelter: behaelterStand, node: rn.da.map(p => p.ordner) };

    /* BEIFANG RAEUMEN. macOS legt auf exFAT/FAT neben jeder Datei mit
       Attributen eine "._"-Datei ab (AppleDouble). Fernseher und
       Autoradios zeigen die als Titel ("._Morgen.mp3", 4 KB, Stille), und
       bei Umlauten im Namen stehen sie in einer anderen Normalform als
       die Datei selbst - das Loeschen ueber die Shell scheiterte daran
       (09.09.2026, Probekopie). Deshalb hier ueber Byte-Pfade, ohne
       Normalisierung: was mit "._" beginnt, geht weg. */
    schritt('Beifang räumen (._-Dateien)');
    { let weg = 0;
      const raeumen = (ordner) => {
        let eintraege = []; try { eintraege = fs.readdirSync(ordner, { withFileTypes: true, encoding: 'buffer' }); } catch (e) { return; }
        for (const e of eintraege) {
          const name = e.name.toString('latin1');
          const voll = Buffer.concat([Buffer.from(ordner), Buffer.from('/'), e.name]);
          if (e.isDirectory()) raeumen(voll.toString());
          else if (name.startsWith('._')) { try { fs.unlinkSync(voll); weg++; } catch (x) {} }
        }
      };
      raeumen(ZIEL);
      zeile(`   ${weg} Beifang-Dateien entfernt`);
    }

    schritt('Zählen und export-stand.json');
    /* Gezählt wird, was jetzt da liegt, plus die zwei Dateien, die gleich
       noch (neu) geschrieben werden - LIES-MICH.md und export-stand.json
       bleiben beim Zählen draußen, sonst zählte ein zweiter Lauf sie
       doppelt. Eine Zahl, die in Mitschrift, Stand und LIES-MICH dieselbe ist. */
    const z = zaehlen(ZIEL, new Set([path.join(ZIEL, 'LIES-MICH.md'), path.join(PROGRAMM, 'library', 'export-stand.json')]));
    stand.dateien = z.dateien + 2; stand.bytes = z.bytes;
    fs.writeFileSync(path.join(ZIEL, 'LIES-MICH.md'), liesMich(stand, rn));
    fs.mkdirSync(path.join(PROGRAMM, 'library'), { recursive: true });
    fs.writeFileSync(path.join(PROGRAMM, 'library', 'export-stand.json'), JSON.stringify(stand, null, 1));
    dateien = stand.dateien; bytes = stand.bytes;
    zeile(`Ziel: ${dateien} Dateien, ${(bytes / 1073741824).toFixed(2)} GB, ${stand.titel} Titel${behaelterStand ? `, davon ${behaelterStand.dateien} Einträge in ${behaelterStand.volumen} Behälter-Stück(en)` : ''}`);

    if (!ohneProbestart) {
      schritt('Probestart vom Ziel');
      probestartErgebnis = await probestart();
      zeile('Probestart: ' + probestartErgebnis);
    }
  } else {
    zeile(`Probe: ${dateien} Dateien, ${(bytes / 1073741824).toFixed(2)} GB würden im Ziel liegen (Sternenhimmel, Startskripte und LIES-MICH.md nicht mitgezählt)`);
  }

  lauf.ergebnis = { dateien, bytes, dauerS: dauerS(), probestart: probestartErgebnis };
  lauf.laeuft = false; lauf.fertig = true; lauf.schritt = 'fertig'; lauf.fortschritt = null;
  laufSchreiben(true);
  console.log(`\n  ${probe ? 'Probe' : 'Export'} fertig nach ${dauerS()} s.${probestartErgebnis.startsWith('fehlgeschlagen') ? ' Der Probestart aber nicht - siehe oben.' : ''}\n`);
  if (probestartErgebnis.startsWith('fehlgeschlagen') || rm.fehl) process.exitCode = 3;
})().catch(abbruch);
