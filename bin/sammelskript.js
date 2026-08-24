/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ============================================================
   Suno-Archiv · Sammelskript erzeugen
   ------------------------------------------------------------
   Backt die Liste der bereits archivierten Songs in die Vorlage
   browser/02-sammeln.js und schreibt browser/02-sammeln-aktuell.js.

   Nötig, weil Chrome der Suno-Seite verbietet, den Mac zu fragen,
   was schon vorhanden ist. Also legen wir die Antwort vorher ins
   Skript hinein.

   Aufruf:  node bin/sammelskript.js
   ============================================================ */

const fs   = require('node:fs');
const path = require('node:path');
const K    = require('./katalog.js');

const WURZEL   = path.join(__dirname, '..');
const VORLAGE  = path.join(WURZEL, 'browser', '02-sammeln.js');
const ZIEL     = path.join(WURZEL, 'browser', '02-sammeln-aktuell.js');

// Die bekannten Songs stehen im Katalog, nicht in den Ordnern -
// ein Ordner entsteht erst, wenn Medien geladen wurden.
const katalog = K.lesen();
const ids = katalog ? Object.keys(katalog.songs) : [];

/* Beim allerersten Lauf gibt es library/roh/ noch nicht - dort landet
   gleich die gesammelte Datei. Anlegen statt den Benutzer erst an
   einem mkdir scheitern zu lassen. */
fs.mkdirSync(path.join(WURZEL, 'library', 'roh'), { recursive: true });

const vorlage = fs.readFileSync(VORLAGE, 'utf8');

if (!vorlage.includes('/*BEKANNTE_IDS*/')) {
  console.error('Die Vorlage enthält die Marke /*BEKANNTE_IDS*/ nicht mehr.');
  process.exit(1);
}

// Die IDs in Zeilen zu je vier, damit die Datei lesbar bleibt
const zeilen = [];
for (let i = 0; i < ids.length; i += 4) {
  zeilen.push('    ' + ids.slice(i, i + 4).map(x => `'${x}'`).join(', '));
}

/* Der eigene Handle steht im Katalog, sobald einmal gesammelt wurde.
   Beim allerersten Lauf gibt es ihn noch nicht - dann bleibt ein
   Platzhalter stehen. Das Sammelskript selbst braucht ihn NICHT: Es
   liest ihn aus der Adresse der Profilseite, auf der es läuft. Er
   dient hier nur der Anleitung. */
const handle = (katalog && katalog.profil && katalog.profil.handle) || null;
const profilAdresse = 'https://suno.com/@' + (handle || 'DEIN-HANDLE') + '?page=songs';

const fertig = vorlage
  .replace('/*BEKANNTE_IDS*/', ids.length ? '\n' + zeilen.join(',\n') + '\n  ' : '')
  .replace('https://suno.com/@DEIN-HANDLE?page=songs', profilAdresse)
  .replace('KlangTresor · Sammeln  (Vorlage)', 'KlangTresor · Sammeln  (erzeugt am '
           + new Date().toISOString().slice(0, 10) + ')');

fs.writeFileSync(ZIEL, fertig);

console.log(`browser/02-sammeln-aktuell.js geschrieben.`);
console.log(`  ${ids.length} bereits archivierte Songs eingetragen.`);
console.log('');
console.log('Jetzt:');
console.log('  1. Chrome -> ' + profilAdresse);
if (!handle) console.log('     (DEIN-HANDLE durch den eigenen Suno-Handle ersetzen)');
console.log('  2. Rechtsklick -> Untersuchen -> Console');
console.log('  3. Inhalt von browser/02-sammeln-aktuell.js einfügen, Enter');
