#!/usr/bin/env node
/* Baut den Pruefstand der Nahtpruefung unter labor/nahtpruefung/site/.
 *
 * Quelle ist web/index.html (wie bei bin/effektclip-labor.js): die Bloecke tbs-modul.js und tbs.css
 * werden zwischen denselben Markern herausgeholt, dazu kommen der Haus-Ersatz aus
 * labor/effektclip-studio und Verweise auf dieselben Medien. Anders als "aus" schreibt dieser Stand
 * NIE nach labor/effektclip-studio - dort arbeitet Caspar_D live, und "aus" wuerde seine Laborkopie
 * ueberschreiben. Vor "return { oeffnen, ... }" kommt der Pruefhaken (haken.js) hinein; er lebt nur
 * in site/ und nie in web/index.html.
 *   node labor/nahtpruefung/stand.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const WURZEL = path.resolve(__dirname, '../..');
const HAUS = path.join(WURZEL, 'web/index.html');
const LABOR = path.join(WURZEL, 'labor/effektclip-studio');
const SITE = path.join(__dirname, 'site');
const BLOECKE = [
  { datei: 'tbs.css', auf: '/* >>> Effektclip-Studio (tbs.css) */', zu: '/* <<< Effektclip-Studio (tbs.css) */' },
  { datei: 'tbs-modul.js', auf: '/* >>> Effektclip-Studio (tbs-modul.js) */', zu: '/* <<< Effektclip-Studio (tbs-modul.js) */' }
];
const RUECKGABE = '  return { oeffnen, schliessen, clipAn, clipAus, clipNeu };';

function grenzen(text, b) {
  const i = text.indexOf(b.auf), j = text.indexOf(b.zu);
  if (i < 0 || j < 0) throw new Error('Marker für ' + b.datei + ' fehlt in web/index.html');
  if (text.indexOf(b.auf, i + 1) >= 0 || text.indexOf(b.zu, j + 1) >= 0) throw new Error('Marker für ' + b.datei + ' kommt mehrfach vor');
  if (j < i) throw new Error('Marker für ' + b.datei + ' stehen verkehrt herum');
  return [i + b.auf.length, j];
}

function bauen() {
  /* Fehlt der Katalogauszug, legt "daten" ihn an. Der Befehl schreibt nur _songs.json, labor-eigen.json und
     die drei Verweise - tbs-modul.js fasst er nicht an (nachgelesen in bin/effektclip-labor.js, daten()). */
  if (!fs.existsSync(path.join(LABOR, '_songs.json'))) {
    const quelle = fs.readFileSync(path.join(WURZEL, 'bin/effektclip-labor.js'), 'utf8');
    const daten = quelle.slice(quelle.indexOf('function daten()'), quelle.indexOf("const was = process.argv[2]"));
    if (/tbs-modul|writeFileSync\(path\.join\(LABOR, b\.datei/.test(daten)) throw new Error('effektclip-labor.js daten fasst tbs-modul.js an - nicht aufgerufen');
    execFileSync(process.execPath, [path.join(WURZEL, 'bin/effektclip-labor.js'), 'daten'], { stdio: 'inherit' });
  }
  const text = fs.readFileSync(HAUS, 'utf8');
  fs.mkdirSync(SITE, { recursive: true });
  for (const b of BLOECKE) {
    const [i, j] = grenzen(text, b);
    let inhalt = text.slice(i, j).replace(/^\n/, '').replace(/\n$/, '') + '\n';
    if (b.datei === 'tbs-modul.js') {
      const n = inhalt.split(RUECKGABE).length - 1;
      if (n !== 1) throw new Error('Rückgabezeile des Moduls ' + n + '-mal gefunden - Haken nicht eingesetzt');
      inhalt = inhalt.replace(RUECKGABE, fs.readFileSync(path.join(__dirname, 'haken.js'), 'utf8') + RUECKGABE);
      try { new Function(inhalt); } catch (e) { throw new Error('tbs-modul.js mit Haken baut nicht: ' + e.message); }
    }
    fs.writeFileSync(path.join(SITE, b.datei), inhalt);
  }
  for (const d of ['labor-haus.html', 'labor-eigen.json', '_songs.json']) fs.copyFileSync(path.join(LABOR, d), path.join(SITE, d));
  /* Verweise mit absolutem Ziel: die relativen aus labor/effektclip-studio zeigten von site/ aus ins Leere. */
  const ziele = { media: 'library/songs', testbild: 'web/testbild', fremd: 'web/fremd' };
  for (const name of Object.keys(ziele)) {
    let ziel;
    try { ziel = fs.realpathSync(path.join(LABOR, name)); } catch (e) { ziel = path.join(WURZEL, ziele[name]); }
    if (!fs.existsSync(ziel)) throw new Error('Ziel für ' + name + ' fehlt: ' + ziel);
    const p = path.join(SITE, name);
    /* Zeigt der Verweis schon richtig, bleibt er stehen (15.09.2026): ein zweiter Lauf, der site/ neu baut, riss ihn sonst kurz weg -
       ein laufender Chrome, der gerade ein Titelbild nachlud, malte dann einen ganzen Job lang anders (Studio-Grundlinie, Job 2, 54 Faelle). */
    let steht = false; try { steht = fs.realpathSync(p) === fs.realpathSync(ziel); } catch (e) {}
    if (steht) continue;
    try { if (fs.lstatSync(p)) fs.unlinkSync(p); } catch (e) {}
    try { fs.symlinkSync(ziel, p); } catch (e) { if (e.code !== 'EEXIST' || fs.realpathSync(p) !== fs.realpathSync(ziel)) throw e; }
  }
  console.log('Prüfstand gebaut: ' + path.relative(process.cwd(), SITE));
}

try { bauen(); } catch (e) { console.error('Abbruch: ' + e.message); process.exit(1); }
