/* Sammelt die Zehn-Substantive-Kondensate aller Modelle in EINE Datei.
   Caspar_D, 28.08.2026: "kannst du die kondensierten varianten gut
   archivieren, vielleicht benutze ich sie fuer meine sammlung weiter".

   Das Archiv liegt in library/kondensate/ und ist absichtlich getrennt
   vom Rest: es entsteht nicht im Morgenlauf, sondern wenn ein Modell
   gelaufen ist, und es soll Neurechnungen der Karten ueberleben.

   Aufruf:  node bin/kondensate-sammeln.js <quellverzeichnis> [...]
   Quellen sind JSON-Dateien der Form {id8: [zehn Substantive]} oder
   {modell: {id8: [...]}}. Vorhandenes wird ergaenzt, nicht ersetzt. */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const LIB = path.join(__dirname, '..', 'library');
const ZIEL = path.join(LIB, 'kondensate', 'kondensate.json');
const LESBAR = path.join(LIB, 'kondensate', 'kondensate.txt');

const kat = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(LIB, 'katalog.json.gz')))).songs;
const vollId = k8 => Object.keys(kat).find(i => i.startsWith(k8)) || k8;

let archiv = { aufgabe: null, stand: null, lieder: {} };
if (fs.existsSync(ZIEL)) archiv = JSON.parse(fs.readFileSync(ZIEL, 'utf8'));
archiv.aufgabe = archiv.aufgabe || 'Kondensiere den Liedtext auf zehn Substantive, '
  + 'geordnet vom Kennzeichnendsten zum Allgemeineren. Nur Substantive, Einzahl, '
  + 'deutsch - auch bei englischen oder japanischen Texten. Benenne, WOVON das Lied '
  + 'handelt, nicht welche Woerter darin vorkommen.';

/* Aus einer Datei die Paare (modellname -> {id8: woerter}) herausloesen.
   Zwei Formen kommen vor: flach je Modell, oder ein Bund aller Modelle. */
function einlesen(datei) {
  const d = JSON.parse(fs.readFileSync(datei, 'utf8'));
  const name = path.basename(datei, '.json').replace(/^kondensat-/, '');
  const werte = Object.values(d);
  const istListe = werte.length && Array.isArray(werte[0]);
  return istListe ? { [name]: d } : d;
}

let neu = 0, ersetzt = 0;
for (const quelle of process.argv.slice(2)) {
  const dateien = fs.statSync(quelle).isDirectory()
    /* Teillaeufe (-a01, -a02 ...) ueberspringen: ihr Inhalt steckt schon im
         Gesamtlauf, und als eigene "Modelle" gefuehrt verstopfen sie das Archiv. */
      ? fs.readdirSync(quelle).filter(f => /^kondensat.*\.json$/.test(f) && !/-a\d+\.json$/.test(f)).map(f => path.join(quelle, f))
    : [quelle];
  for (const datei of dateien) {
    let bund; try { bund = einlesen(datei); } catch (e) { console.error(`  ${path.basename(datei)}: ${e.message}`); continue; }
    for (const [modell, lieder] of Object.entries(bund)) {
      if (!lieder || typeof lieder !== 'object') continue;
      let n = 0;
      for (const [k8, worte] of Object.entries(lieder)) {
        if (!Array.isArray(worte) || !worte.length) continue;
        const id = vollId(k8);
        const e = archiv.lieder[id] = archiv.lieder[id] || { titel: (kat[id] || {}).titel || null, modelle: {} };
        if (e.modelle[modell]) ersetzt++; else neu++;
        e.modelle[modell] = worte;
        n++;
      }
      if (n) console.log(`  ${path.basename(datei)} -> ${modell}: ${n} Lieder`);
    }
  }
}

archiv.stand = new Date().toISOString().slice(0, 10);
const modelle = new Set();
for (const e of Object.values(archiv.lieder)) for (const m of Object.keys(e.modelle)) modelle.add(m);
archiv.modelle = [...modelle].sort();

fs.mkdirSync(path.dirname(ZIEL), { recursive: true });
fs.writeFileSync(ZIEL, JSON.stringify(archiv, null, 1));

/* Zum Lesen und Vergleichen - je Lied alle Modelle untereinander. */
const zeilen = [`ZEHN SUBSTANTIVE JE LIED — Stand ${archiv.stand}`, '',
  archiv.aufgabe, '', `Modelle: ${archiv.modelle.join(', ')}`, ''];
for (const [id, e] of Object.entries(archiv.lieder).sort((a, b) => (a[1].titel || '').localeCompare(b[1].titel || '', 'de'))) {
  zeilen.push(`### ${e.titel || id.slice(0, 8)}   [${id.slice(0, 8)}]`);
  const b = Math.max(...Object.keys(e.modelle).map(m => m.length));
  for (const m of archiv.modelle) if (e.modelle[m]) zeilen.push(`  ${m.padEnd(b)}  ${e.modelle[m].join(' · ')}`);
  zeilen.push('');
}
fs.writeFileSync(LESBAR, zeilen.join('\n'));

console.log(`\n${Object.keys(archiv.lieder).length} Lieder, ${archiv.modelle.length} Modelle `
  + `(${neu} neu, ${ersetzt} ersetzt)\n  ${ZIEL}\n  ${LESBAR}`);
