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
 *   Programm/library/       der Bestand, ohne WAV, ohne Stems (nur --stems),
 *                           ohne roh/, backup/, node-portabel/, suno-wege/,
 *                           kondensate/arbeit/, export-lauf.json
 *   Programm/library/export-stand.json   {exportiertAm, dateien, bytes, mitStems, handle}
 *   node/<plattform>/       das mitgebrachte Node aus library/node-portabel/
 *
 * WAS NIE MITKOMMT: geheim/ (Zugangsdaten), .git (die Werkstatt), die
 * WAV-Originale (17 GB, nur für Messungen, die längst gerechnet sind).
 *
 * WERKZEUG: rsync - kopiert nur, was sich geändert hat, und räumt weg,
 * was zu Hause nicht mehr da ist. Ein zweiter Lauf frischt also auf.
 * Für Musik/ dasselbe von Hand: eine MP3 wird nur neu getaggt, wenn
 * Tonspur oder Bild zu Hause jünger sind als die Datei auf dem Stick.
 *
 * DER LAUF SCHREIBT MIT: library/export-lauf.json, fortlaufend, damit
 * die Oberfläche (GET /api/export/stand) zusehen kann:
 *   { laeuft, seit, pid, schritt, zeilen: [...], fertig, fehler, ergebnis }
 *   fertig = true nur bei gutem Ende; ein Abbruch lässt fertig = false
 *   und schreibt den Grund nach fehler. ergebnis =
 *   { dateien, bytes, dauerS, probestart: "ok" | "fehlgeschlagen: ..." | "übersprungen" }
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

/* ---------------------------------------------------------------- Mitschrift */
const lauf = { laeuft: true, seit: new Date(START).toISOString(), pid: process.pid, probe, stems, ziel: ZIEL,
               schritt: '', fortschritt: null, zeilen: [], fertig: false, fehler: null, ergebnis: null };
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
function abbruch(grund) {
  lauf.laeuft = false; lauf.fertig = false; lauf.fehler = String(grund && grund.message || grund);
  lauf.schritt = 'abgebrochen';
  console.error('\n  ABBRUCH: ' + lauf.fehler + '\n');
  laufSchreiben(true);
  process.exit(1);
}
process.on('uncaughtException', abbruch);
process.on('unhandledRejection', abbruch);
process.on('SIGINT',  () => abbruch('unterbrochen (SIGINT)'));
process.on('SIGTERM', () => abbruch('beendet (SIGTERM)'));

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

/* ---------------------------------------------------------------- rsync */
/* Ohne -p/-o/-g: der Stick ist exFAT oder FAT32 und kennt weder Rechte
   noch Besitzer - rsync -a endete dort mit "chmod failed" und Exit 23.
   -L löst Verweise auf (ein Stick kann keine tragen), --modify-window=2
   verzeiht die 2-Sekunden-Uhr von FAT. --delete räumt weg, was zu Hause
   fehlt; --delete-excluded auch das, was inzwischen ausgeschlossen ist
   (eine WAV von einem früheren Export). */
const BEIFANG = ['--exclude', '._*', '--exclude', '.DS_Store', '--exclude', '.git', '--exclude', '.git*', '--exclude', '*.lock', '--exclude', '*.tmp'];
function rsync(quelle, ziel, zusatz) {
  return new Promise((aufloesen, verwerfen) => {
    const argv = ['-rtL', '--modify-window=2', '--delete', '--delete-excluded', '--stats', '--info=progress2',
                  ...(probe ? ['--dry-run'] : []), ...BEIFANG, ...(zusatz || []), quelle + '/', ziel + '/'];
    if (!probe) fs.mkdirSync(ziel, { recursive: true });
    const k = spawn('rsync', argv, { stdio: ['ignore', 'pipe', 'pipe'] });
    let aus = '', fehler = '', rest = '';
    k.stdout.setEncoding('utf8');
    k.stdout.on('data', (d) => {
      aus += d;
      /* progress2 schreibt mit \r auf dieselbe Zeile: "  1,234,567  45%  12MB/s  0:00:12 (xfr#12, to-chk=100/2000)" */
      const teile = (rest + d).split(/[\r\n]/); rest = teile.pop();
      for (const t of teile) { const m = t.match(/\s(\d+)%\s/); if (m) { lauf.fortschritt = { prozent: +m[1], was: path.basename(ziel) }; laufSchreiben(false); } }
    });
    k.stderr.setEncoding('utf8'); k.stderr.on('data', (d) => { fehler += d; });
    k.on('error', verwerfen);
    k.on('close', (code) => {
      /* 24 = "some files vanished" - jemand hat zu Hause gerade etwas
         umgeräumt; kein Grund, den ganzen Export wegzuwerfen. */
      if (code !== 0 && code !== 24) return verwerfen(new Error(`rsync ${path.basename(ziel)}: Exit ${code}\n${fehler.trim().split('\n').slice(-5).join('\n')}`));
      const zahl = (name) => { const z = aus.split('\n').find(x => x.startsWith(name)) || ''; const m = z.match(/:\s*([\d,.]+)/); return m ? +m[1].replace(/[,.]/g, '') : 0; };
      aufloesen({ dateien: zahl('Number of files'), uebertragen: zahl('Number of regular files transferred'),
                  bytes: zahl('Total file size'), bytesUebertragen: zahl('Total transferred file size') });
    });
  });
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
    const arbeiter = async () => {
      while (i < offen.length) {
        const { e, zielDatei } = offen[i++];
        const r = await musikBauen(e, zielDatei);
        if (r.ok) { neu++; bytes += fs.statSync(zielDatei).size; }
        else { fehl++; zeile(`   ffmpeg scheiterte an "${e.name}": ${r.grund}`); }
        lauf.fortschritt = { prozent: Math.round(100 * (neu + fehl) / Math.max(1, offen.length)), was: 'Musik' }; laufSchreiben(false);
      }
    };
    await Promise.all([0, 1, 2, 3].map(arbeiter));
    /* Aufräumen: MP3s, die keinem Titel mehr gehören (umbenannt, gelöscht,
       aus einem älteren Export). Nur .mp3, nur in Musik/ - alles andere
       dort hat jemand von Hand hingelegt und bleibt. */
    for (const f of fs.readdirSync(ordner)) {
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
      fs.mkdirSync(path.dirname(nach), { recursive: true });
      fs.copyFileSync(von, nach);
      try { fs.chmodSync(nach, 0o755); } catch (e) {}     /* auf exFAT wirkungslos, auf APFS nötig */
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
  Katalog, Titel, Titelbilder, Texte, Wort-Zeitmarken, Herzen und
  Abrufe, Beobachter, Alben, Notizen, Messwerte.
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
    if (j.anzahl !== eigene.length) return `fehlgeschlagen: das Ziel meldet ${j.anzahl} Titel, der Katalog hat ${eigene.length}`;
    if (!j.eingefroren) return `fehlgeschlagen: ${j.anzahl} Titel da, aber der Server meldet keinen Modus eingefroren (Server-Teil fehlt noch?)`;
    zeile(`Probestart: ${j.anzahl} Titel auf Port ${port || wunsch}, eingefroren seit ${j.eingefroren.seit}`);
    return 'ok';
  } finally { await beenden(); }
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

  schritt('Programm kopieren');
  for (const o of ['web', 'server', 'bin', 'browser', 'docs']) {
    if (!fs.existsSync(path.join(WURZEL, o))) { zeile(`   ${o}/ gibt es zu Hause nicht - übersprungen`); continue; }
    const r = await rsync(path.join(WURZEL, o), path.join(PROGRAMM, o), ['--exclude', 'node_modules/']);
    dateien += r.dateien; bytes += r.bytes;
    zeile(`   ${o}/: ${r.dateien} Dateien, ${r.uebertragen} ${probe ? 'zu übertragen' : 'übertragen'}`);
  }
  for (const f of fs.readdirSync(WURZEL).filter(f => f === 'package.json' || f === 'LICENSE' || /^README/i.test(f))) {
    const von = path.join(WURZEL, f), nach = path.join(PROGRAMM, f);
    const sv = fs.statSync(von); let sn = null; try { sn = fs.statSync(nach); } catch (e) {}
    dateien++; bytes += sv.size;
    if (sn && sn.size === sv.size && sn.mtimeMs >= sv.mtimeMs - 2000) continue;
    if (!probe) { fs.mkdirSync(PROGRAMM, { recursive: true }); fs.copyFileSync(von, nach); }
  }

  schritt('Bestand kopieren (library/)');
  const AUSSCHLUSS = [
    '--exclude', '/songs/*/audio.wav',
    ...(stems ? [] : ['--exclude', '/songs/*/stems/']),
    '--exclude', '/roh/', '--exclude', '/backup/', '--exclude', '/node-portabel/', '--exclude', '/suno-wege/',
    '--exclude', '/kondensate/arbeit/', '--exclude', '/export-lauf.json',
    /* KI-Modelle (ONNX, 564 MB) rechnen Musikstil und Klangraum - das
       eingefrorene Archiv rechnet nichts, es spielt (Caspar_D, 09.09.2026). */
    '--exclude', '/modelle/',
    /* geschützt, nicht ausgeschlossen: der Stand des letzten Exports liegt
       nur im Ziel und würde von --delete sonst jedes Mal erst gelöscht */
    '--filter', 'P /export-stand.json',
  ];
  /* Stems, die ein früherer Lauf mit --stems gebracht hat, bleiben ohne
     --stems liegen: 28 GB löscht man nicht, weil ein Häkchen fehlt. */
  if (!stems) AUSSCHLUSS.push('--filter', 'P /songs/*/stems/');
  const rl = await rsync(LIB, path.join(PROGRAMM, 'library'), AUSSCHLUSS);
  dateien += rl.dateien; bytes += rl.bytes;
  zeile(`   library/: ${rl.dateien} Dateien, ${(rl.bytes / 1073741824).toFixed(2)} GB, ${rl.uebertragen} ${probe ? 'zu übertragen' : 'übertragen'} (${(rl.bytesUebertragen / 1048576).toFixed(0)} MB)`);

  schritt('Musik/ (MP3 mit Tags und Titelbild)');
  const rm = await musik();
  dateien += rm.dateien; bytes += rm.bytes;

  schritt('node/ (mitgebrachtes Node.js)');
  const rn = nodeKopieren();
  dateien += rn.dateien; bytes += rn.bytes;

  let probestartErgebnis = 'übersprungen';
  if (!probe) {
    schritt('Sternenhimmel.html (Bild und Ton relativ)');
    const rh = spawnSync(process.execPath, ['bin/himmel-export.js', '--relativ', 'Programm/library/songs', '--ziel', path.join(ZIEL, 'Sternenhimmel.html')],
                         { cwd: WURZEL, encoding: 'utf8' });
    if (rh.status === 0) zeile('  ' + (rh.stdout || '').trim().split('\n').pop());
    else zeile(`   Sternenhimmel nicht gebaut (Exit ${rh.status}): ${((rh.stderr || rh.stdout || '').trim().split('\n').filter(Boolean).slice(-2).join(' | '))}`);

    schritt('Startskripte und LIES-MICH.md');
    const stand = { exportiertAm: new Date().toISOString(), dateien: 0, bytes: 0,
                    mitStems: stems || fs.existsSync(path.join(PROGRAMM, 'library', 'songs')) && fs.readdirSync(path.join(PROGRAMM, 'library', 'songs')).some(id => fs.existsSync(path.join(PROGRAMM, 'library', 'songs', id, 'stems'))),
                    handle, node: rn.da.map(p => p.ordner) };
    fs.writeFileSync(path.join(ZIEL, 'START-Mac.command'), MAC_SKRIPT);
    fs.writeFileSync(path.join(ZIEL, 'START-Linux.sh'), LINUX_SKRIPT);
    fs.writeFileSync(path.join(ZIEL, 'START-Windows.cmd'), WIN_SKRIPT);
    for (const f of ['START-Mac.command', 'START-Linux.sh']) { try { fs.chmodSync(path.join(ZIEL, f), 0o755); } catch (e) {} }
    /* Das alte START.md (Export vom August) hat hier nichts mehr verloren:
       es riet zu "node server/server.js", und den Ordner gibt es so nicht mehr. */
    try { fs.unlinkSync(path.join(ZIEL, 'START.md')); } catch (e) {}

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
    zeile(`Ziel: ${dateien} Dateien, ${(bytes / 1073741824).toFixed(2)} GB`);

    if (!ohneProbestart) {
      schritt('Probestart vom Ziel');
      probestartErgebnis = await probestart();
      zeile('Probestart: ' + probestartErgebnis);
    }
  } else {
    zeile(`Probe: ${dateien} Dateien, ${(bytes / 1073741824).toFixed(2)} GB würden im Ziel liegen (Sternenhimmel, Startskripte und LIES-MICH.md nicht mitgezählt)`);
  }

  const dauerS = Math.round((Date.now() - START) / 1000);
  lauf.ergebnis = { dateien, bytes, dauerS, probestart: probestartErgebnis };
  lauf.laeuft = false; lauf.fertig = true; lauf.schritt = 'fertig'; lauf.fortschritt = null;
  laufSchreiben(true);
  console.log(`\n  ${probe ? 'Probe' : 'Export'} fertig nach ${dauerS} s.${probestartErgebnis.startsWith('fehlgeschlagen') ? ' Der Probestart aber nicht - siehe oben.' : ''}\n`);
  if (probestartErgebnis.startsWith('fehlgeschlagen') || rm.fehl) process.exitCode = 3;
})().catch(abbruch);
