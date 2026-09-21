#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Zonen-Labor — die Tiefenkarte als Relief ansehen und die Zonengrenzen prüfen.
 *
 * ---------------------------------------------------------------------
 * WOFÜR ES DA IST
 *
 * Bevor die Zonenkarte in die App kommt, muss man sehen können, ob die
 * Talsuche auf den eigenen Bildern überhaupt findet, was sie finden soll.
 * Das Werkzeug baut dafür eine einzelne HTML-Datei, die ohne Server läuft:
 * links das Relief zum Drehen, rechts der Zonenstapel zum Verschieben.
 *
 * Caspar_D, 21.09.2026: „nimm die Tiefenkarte, mach eine Höhenmap draus und
 * stell sie senkrecht hin und färbe sie scheibenweise entsprechend der
 * Talsuche ein" — und: „du legst das Original als Graustufenbild unten drunter
 * und dann pappst du per farbig abwedeln die Zonenfarben drauf".
 *
 * WAS HIER PASSIERT und was nicht: Dieses Skript holt nur die Bilder und setzt
 * sie in die Vorlage. Gerechnet — Talsuche, Zonen, Relief, Verrechnung — wird
 * ausschließlich in labor/zonen/vorlage.html. Eine zweite Fassung der Rechnung
 * würde abdriften, und dann zeigte die Ansicht etwas, das die App nicht tut.
 *
 * KARTE UND BILD STEHEN IN EINEM PNG, übereinander: oben die Tiefenkarte, unten
 * das Original in denselben Maßen. Zwei getrennte Quellen waren am 21.09.2026
 * schon einmal der Fehler — kam die zweite nicht an, blieb der Umschalter still.
 *
 * DIE ABTASTBREITE IST EINE FESTGESCHRIEBENE ZAHL, kein Zufall. Gemessen am
 * selben Bild: bei 170 Punkten findet die Talsuche zwei Grenzen, bei 150 drei —
 * die dritte trennt das Blatt vom Hintergrund. Wer sie ändert, ändert die
 * Zoneneinteilung.
 *
 * AUFRUF
 *   node bin/zonen-labor.js                 die zehn neuesten Titel
 *   node bin/zonen-labor.js <id> [<id> …]   bestimmte Titel
 *   node bin/zonen-labor.js --breite 170    andere Abtastbreite (siehe oben)
 *
 * Ergebnis: labor/zonen/index.html — im Browser öffnen.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execFileSync } = require('child_process');

const WURZEL = path.resolve(__dirname, '..');
const ZIEL = path.join(WURZEL, 'labor', 'zonen');
const VORLAGE = path.join(ZIEL, 'vorlage.html');

/* Die Abtastbreite bestimmt die Zonenzahl — siehe Kopf. */
const arg = process.argv.slice(2);
let BREITE = 150;
const ids = [];
for (let i = 0; i < arg.length; i++) {
  if (arg[i] === '--breite') { BREITE = Number(arg[++i]) || BREITE; continue; }
  if (arg[i] === '--hilfe' || arg[i] === '--help') {
    console.log('node bin/zonen-labor.js [--breite N] [<song-id> …]'); process.exit(0); }
  ids.push(arg[i]);
}

function katalog() {
  const f = path.join(WURZEL, 'library', 'katalog.json.gz');
  return JSON.parse(zlib.gunzipSync(fs.readFileSync(f)).toString()).songs || {};
}
function ffmpeg(args) { execFileSync('ffmpeg', ['-v', 'error', '-y', ...args]); }
function ffprobeHoehe(datei) {
  return Number(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=height', '-of', 'csv=p=0', datei]).toString().trim());
}

const songs = katalog();
let wahl = ids;
if (!wahl.length) {
  /* die zehn neuesten mit Tiefenkarte — der Prüfsatz des Hauses */
  wahl = Object.entries(songs)
    .sort((a, b) => String(b[1].erstelltAm || b[1].created_at || '')
                     .localeCompare(String(a[1].erstelltAm || a[1].created_at || '')))
    .map(([id]) => id)
    .filter(id => fs.existsSync(path.join(WURZEL, 'library', 'songs', id, 'tiefe.png')))
    .slice(0, 10);
}

const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'zonen-'));
const daten = [];
for (const id of wahl) {
  const ordner = path.join(WURZEL, 'library', 'songs', id);
  const karte = path.join(ordner, 'tiefe.png');
  if (!fs.existsSync(karte)) { console.error('ohne Tiefenkarte: ' + id); continue; }
  let bild = path.join(ordner, 'titelbild.jpg');
  if (!fs.existsSync(bild)) bild = path.join(ordner, 'cover.jpg');
  if (!fs.existsSync(bild)) { console.error('ohne Bild: ' + id); continue; }

  const k = path.join(tmp, id + '-k.png');
  ffmpeg(['-i', karte, '-vf', `scale=${BREITE}:-1,format=gray`, k]);
  const h = ffprobeHoehe(k);
  const paar = path.join(tmp, id + '-paar.jpg');
  ffmpeg(['-i', k, '-i', bild, '-filter_complex',
    `[1:v]scale=${BREITE}:${h},format=gray[o];[0:v]format=gray[t];[t][o]vstack=inputs=2,format=gray`,
    '-q:v', '2', paar]);

  daten.push({
    titel: (songs[id] && (songs[id].titel || songs[id].title)) || id.slice(0, 8),
    h,
    bild: 'data:image/jpeg;base64,' + fs.readFileSync(paar).toString('base64'),
  });
  console.log('  ' + (daten[daten.length - 1].titel));
}
fs.rmSync(tmp, { recursive: true, force: true });

if (!daten.length) { console.error('nichts zu zeigen'); process.exit(1); }
const html = fs.readFileSync(VORLAGE, 'utf8').replace('/*DATEN*/', JSON.stringify(daten));
const aus = path.join(ZIEL, 'index.html');
fs.writeFileSync(aus, html);
console.log('\n' + daten.length + ' Titel, Abtastbreite ' + BREITE
  + '\n' + path.relative(WURZEL, aus) + ' — im Browser öffnen');
