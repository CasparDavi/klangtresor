#!/usr/bin/env node
/* Werkbank für das Effektclip-Studio.
 *
 * Das Studio lebt als ein Block in web/index.html, zwischen Markern. Zum Arbeiten
 * will man es als eigene Datei haben (Editor, Diff, Prüfstand), zum Ausliefern
 * muss es wieder in die Seite. Damit es nie zwei Wahrheiten gibt, ist web/index.html
 * die Quelle und die Laborkopie das Abgeleitete:
 *
 *   node bin/effektclip-labor.js aus     Block aus web/index.html in die Laborkopie holen
 *   node bin/effektclip-labor.js ein     Laborkopie zurück in web/index.html spleißen
 *   node bin/effektclip-labor.js daten   Prüfdaten und Verweise für den Prüfstand anlegen
 *
 * "ein" prüft vorher jedes Inline-Skript der Seite auf Syntax und bricht ab, wenn
 * eines nicht baut - eine kaputte index.html merkt man sonst erst im Browser.
 * (Caspar_D, 10.09.2026: "Magst du die Kritzelordner möglichst auch noch systematisieren
 * und retten." - gerettet wird der Weg, nicht die Kopien.)
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const WURZEL = path.resolve(__dirname, '..');
const HAUS = path.join(WURZEL, 'web/index.html');
const LABOR = path.join(WURZEL, 'labor/effektclip-studio');
const BLOECKE = [
  { datei: 'tbs.css', auf: '/* >>> Effektclip-Studio (tbs.css) */', zu: '/* <<< Effektclip-Studio (tbs.css) */' },
  { datei: 'tbs-modul.js', auf: '/* >>> Effektclip-Studio (tbs-modul.js) */', zu: '/* <<< Effektclip-Studio (tbs-modul.js) */' }
];

function grenzen(text, b) {
  const i = text.indexOf(b.auf), j = text.indexOf(b.zu);
  if (i < 0 || j < 0) throw new Error('Marker für ' + b.datei + ' fehlt in web/index.html');
  if (text.indexOf(b.auf, i + 1) >= 0 || text.indexOf(b.zu, j + 1) >= 0) throw new Error('Marker für ' + b.datei + ' kommt mehrfach vor');
  if (j < i) throw new Error('Marker für ' + b.datei + ' stehen verkehrt herum');
  return [i + b.auf.length, j];
}

function aus() {
  const text = fs.readFileSync(HAUS, 'utf8');
  fs.mkdirSync(LABOR, { recursive: true });
  for (const b of BLOECKE) {
    const [i, j] = grenzen(text, b);
    fs.writeFileSync(path.join(LABOR, b.datei), text.slice(i, j).replace(/^\n/, '').replace(/\n$/, '') + '\n');
    console.log('geholt: ' + b.datei + ' (' + (j - i) + ' Zeichen)');
  }
}

/* Jedes Inline-Skript der Seite einmal bauen. Baut eines nicht, wird nichts geschrieben. */
function skripteBauen(text) {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let m, n = 0;
  while ((m = re.exec(text))) {
    n++;
    try { new Function(m[1]); }
    catch (e) { throw new Error('Skript ' + n + ' der Seite baut nicht: ' + e.message); }
  }
  return n;
}

function ein() {
  let text = fs.readFileSync(HAUS, 'utf8');
  for (const b of BLOECKE) {
    const datei = path.join(LABOR, b.datei);
    if (!fs.existsSync(datei)) throw new Error(datei + ' fehlt - erst "aus" laufen lassen');
    const inhalt = fs.readFileSync(datei, 'utf8').replace(/^\n/, '').replace(/\n$/, '');
    const [i, j] = grenzen(text, b);
    text = text.slice(0, i) + '\n' + inhalt + '\n' + text.slice(j);
  }
  const n = skripteBauen(text);
  fs.writeFileSync(HAUS, text);
  console.log('eingebaut, ' + n + ' Inline-Skripte gebaut, ' + text.length + ' Zeichen');
}

/* Prüfdaten: ein schmaler Auszug des Katalogs (nur was das Studio liest) und die
 * Verweise auf Medien und Testbilder. Die Auszüge sind Archivdaten und bleiben
 * darum aus git heraus - dieser Befehl legt sie jederzeit neu an. */
function daten() {
  const gz = path.join(WURZEL, 'library/katalog.json.gz');
  if (!fs.existsSync(gz)) throw new Error('library/katalog.json.gz fehlt - ohne Archiv kein Prüfstand');
  const katalog = JSON.parse(zlib.gunzipSync(fs.readFileSync(gz)).toString('utf8'));
  const roh = Array.isArray(katalog) ? katalog : (katalog.songs || {});
  const alle = (Array.isArray(roh) ? roh : Object.values(roh)).filter(s => s && s.id && Array.isArray(s.schlaege) && s.schlaege.length);
  if (!alle.length) throw new Error('kein Titel mit Schlagerkennung im Katalog');
  /* Über den Bestand verteilt statt die ersten zwölf - sonst prüft man immer dieselbe Ecke. */
  const schritt = Math.max(1, Math.floor(alle.length / 12));
  const wahl = [];
  for (let i = 0; i < alle.length && wahl.length < 12; i += schritt) wahl.push(alle[i]);
  const schmal = wahl.map(s => ({
    id: s.id, titel: s.titel, dauer: s.dauer, farben: s.farben || {},
    schlaege: s.schlaege, abschnitte: s.abschnitte || null, videoCoverUrl: s.videoCoverUrl || null
  }));
  fs.mkdirSync(LABOR, { recursive: true });
  fs.writeFileSync(path.join(LABOR, '_songs.json'), JSON.stringify(schmal));
  console.log('Prüfdaten: ' + schmal.length + ' Titel aus ' + alle.length);

  /* Startlage: welche Titel ein randloses Titelbild haben, welche eigene Dateien. Sie folgt der Auswahl,
   * sonst zeigt der Prüfstand Merkmale von Titeln, die gar nicht dabei sind. Von Hand gesetzte Merkmale
   * bleiben, soweit ihr Titel noch in der Auswahl ist. */
  const eigen = path.join(LABOR, 'labor-eigen.json');
  let alt = {};
  try { alt = JSON.parse(fs.readFileSync(eigen, 'utf8')).eigenArt || {}; } catch (e) {}
  const ids = new Set(schmal.map(s => s.id));
  const eigenArt = {};
  for (const id of Object.keys(alt)) if (ids.has(id)) eigenArt[id] = alt[id];
  fs.writeFileSync(eigen, JSON.stringify({ eigenArt, titelbild: schmal.map(s => s.id) }));
  console.log('Startlage: ' + Object.keys(eigenArt).length + ' Titel mit eigenen Dateien');
  /* fremd/ ist Pflicht: der WebGL-Nebel holt sein Rauschen aus web/fremd/webgl-noise. Fehlt der Verweis,
   * faellt das Studio still auf den Leinwand-Nebel zurueck und man misst tagelang den falschen Maler. */
  for (const [name, ziel] of [['media', '../../library/songs'], ['testbild', '../../web/testbild'], ['fremd', '../../web/fremd']]) {
    const p = path.join(LABOR, name);
    try { if (fs.lstatSync(p)) fs.unlinkSync(p); } catch (e) {}
    fs.symlinkSync(ziel, p);
    console.log('Verweis ' + name + ' → ' + ziel);
  }
  console.log('\nPrüfstand starten:\n  cd ' + path.relative(process.cwd(), LABOR) + ' && python3 -m http.server 18811\n  dann http://127.0.0.1:18811/labor-haus.html');
}

const was = process.argv[2];
try {
  if (was === 'aus') aus();
  else if (was === 'ein') ein();
  else if (was === 'daten') daten();
  else { console.log('Aufruf: node bin/effektclip-labor.js aus | ein | daten'); process.exit(1); }
} catch (e) { console.error('Abbruch: ' + e.message); process.exit(1); }
