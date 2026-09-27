#!/usr/bin/env node
/* Werkbank für das Effektclip-Studio.
 *
 *   node bin/effektclip-labor.js daten   Prüfdaten und Verweise für den Prüfstand anlegen
 *   node bin/effektclip-labor.js lyrik   bereinigte Lyrik der Prüftitel anlegen (_lyrik.json)
 *
 * Bis zum 27.09.2026 gab es hier auch "aus" und "ein": das Studio lebte als Block in web/index.html
 * zwischen Markern, "aus" holte ihn als Laborkopie heraus, "ein" spleißte ihn mit Syntaxprüfung zurück
 * (Caspar_D, 10.09.2026: "Magst du die Kritzelordner möglichst auch noch systematisieren und retten." -
 * gerettet wurde der Weg, nicht die Kopien). Seit das Studio eine eigene Datei ist (web/tbs-modul.js,
 * web/tbs.css), braucht es keine Kopie mehr: die Laborseite lädt die echte Datei über Verweise, die
 * "daten" anlegt. Zwei Wahrheiten gibt es nicht. Die Syntax der Seite prüft labor/nahtpruefung/syntax.js.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const WURZEL = path.resolve(__dirname, '..');
const LABOR = path.join(WURZEL, 'labor/effektclip-studio');

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
  /* tbs-modul.js und tbs.css sind seit dem 27.09.2026 Verweise auf die echten Dateien unter web/ - keine Kopie,
   * keine zweite Wahrheit. Eine alte Kopie aus "aus" wird dabei ersetzt. */
  for (const [name, ziel] of [['media', '../../library/songs'], ['testbild', '../../web/testbild'], ['fremd', '../../web/fremd'], ['tbs-modul.js', '../../web/tbs-modul.js'], ['tbs.css', '../../web/tbs.css'], ['fonts', '../../web/fonts']]) {   /* fonts: die Paketschriften der Texteffekte, sonst 404 und Rueckfallschrift (27.09.2026) */
    const p = path.join(LABOR, name);
    try { if (fs.lstatSync(p)) fs.unlinkSync(p); } catch (e) {}
    fs.symlinkSync(ziel, p);
    console.log('Verweis ' + name + ' → ' + ziel);
  }
  /* Zusatz, kein Muss (Gegenlesen 24.09.2026): ohne library/lyrik.json (frischer Klon, fremder Bestand) laeuft der
   * Pruefstand ohne Karaoke-Lyrik weiter - die Karaoke-Faelle sagen es dann auf der Karte. Nur der eigene Befehl wirft. */
  try { lyrik(); } catch (e) { console.warn('Hinweis: ' + e.message + ' - der Prüfstand läuft ohne Lyrik'); }
  console.log('\nPrüfstand starten:\n  cd ' + path.relative(process.cwd(), LABOR) + ' && python3 -m http.server 18811\n  dann http://127.0.0.1:18811/labor-haus.html');
}

/* Die bereinigte Lyrik der Prüftitel (24.09.2026, Karaoke-Effekt): _lyrik.json neben _songs.json, für
 * dieselben Titel. Die Laborseite beantwortet /api/lyrik/<id> daraus, so wie /api/song aus _songs.json.
 * Eigener Befehl (lyrik), damit _songs.json nicht neu gewürfelt werden muss - die Fälle in faelle.json
 * hängen an festen Prüftiteln, und daten() wählt nach der Länge des Katalogs. Archivdaten, aus git. */
function lyrik() {
  const sj = path.join(LABOR, '_songs.json');
  if (!fs.existsSync(sj)) throw new Error('labor/effektclip-studio/_songs.json fehlt - erst "node bin/effektclip-labor.js daten"');
  const songs = JSON.parse(fs.readFileSync(sj, 'utf8'));
  const f = path.join(WURZEL, 'library/lyrik.json');
  if (!fs.existsSync(f)) throw new Error('library/lyrik.json fehlt - ohne sie kein Karaoke im Prüfstand');
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  const lieder = {}, unsicher = [];
  for (const s of songs) {
    if (d.lieder && d.lieder[s.id]) lieder[s.id] = Object.assign({ verfahren: d.verfahren || '' }, d.lieder[s.id]);
    const u = (d.unsicher || []).find(x => x && x.id === s.id); if (u) unsicher.push(u);
  }
  fs.writeFileSync(path.join(LABOR, '_lyrik.json'), JSON.stringify({ lieder, unsicher }));
  console.log('Lyrik: ' + Object.keys(lieder).length + ' von ' + songs.length + ' Titeln, ' + unsicher.length + ' zurückgestellt');
}

const was = process.argv[2];
try {
  if (was === 'daten') daten();
  else if (was === 'lyrik') lyrik();
  else if (was === 'aus' || was === 'ein') { console.log('"' + was + '" gibt es seit dem 27.09.2026 nicht mehr: das Studio ist web/tbs-modul.js und web/tbs.css, die Laborseite lädt sie über Verweise (daten).'); process.exit(1); }
  else { console.log('Aufruf: node bin/effektclip-labor.js daten | lyrik'); process.exit(1); }
} catch (e) { console.error('Abbruch: ' + e.message); process.exit(1); }
