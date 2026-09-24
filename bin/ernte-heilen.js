#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   DIE ERNTE HEILEN - Ersatzzeichen aus Sunos Antworten
   bin/ernte-heilen.js
     node bin/ernte-heilen.js            juengste Profil-Ernte in library/roh
     node bin/ernte-heilen.js <datei>    eine bestimmte Ernte
     node bin/ernte-heilen.js --probe    nur zeigen, nichts schreiben

   WAS KAPUTT IST. Sunos Profil-Endpunkt (/api/profiles/<handle>) liefert Texte
   sporadisch mit zerrissenen Mehrbyte-Zeichen: statt "gehoert" steht "geh��rt",
   zwei Ersatzzeichen fuer ein Zeichen. Gefunden am 24.09.2026 (Caspar_D: "der rote
   Knopf meldet mir regelmaessig, dass Songs geaenderte Inhalte in den Lyrics haetten,
   ich habe aber nichts veraendert"). Das Ersatzzeichen U+FFFD kommt in echtem Text
   nie vor - es ist die Narbe des Fehlers, und genau daran ist die Wahrheit zu erkennen:
   ein Text OHNE Ersatzzeichen ist die richtige Fassung.

   WOHER DIE WAHRHEIT KOMMT. Dieselbe Ernte traegt viele Titel ein zweites Mal - unter
   den Playlists (/api/playlist/<id>), und dort ist der Text sauber. Fuer jedes String-
   Feld eines Clips in der Liste `songs`, das ein Ersatzzeichen traegt, sucht dieses
   Skript in allen anderen Kopien desselben Clips (Playlists, private Liste) eine saubere
   Fassung, die bis auf die Ersatzstellen wortgleich ist, und nimmt sie. Ein Ersatzlauf
   darf fuer ein bis vier Nicht-ASCII-Zeichen stehen (zwei Bytes bis ein Emoji). Findet
   sich keine saubere Kopie, bleibt das Feld, wie es ist, und wird gemeldet.
   Die Regel selbst steht in bin/ersatzzeichen.js; hier ist nur der Aufruf mit Sicherung.

   NIE OHNE SICHERUNG. Die alte Datei bleibt als <name>.json.kaputt daneben liegen
   (endet nicht auf .json, also sieht sammeln.js sie nicht); geschrieben wird erst in
   eine .teil-Datei, dann umbenannt. Idempotent: eine geheilte Ernte hat nichts mehr
   zu heilen. Bytegleich bleibt alles, was nicht geheilt wurde: geschrieben wird
   dieselbe Struktur mit JSON.stringify ohne Einrueckung, wie das Lesezeichen sie legt.
   ============================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const WURZEL = path.resolve(__dirname, '..');
const ROH = path.join(WURZEL, 'library', 'roh');
const FF = '�';
const args = process.argv.slice(2);
const probe = args.includes('--probe');
const genannt = args.find(a => !a.startsWith('--'));

function juengste() {
  const l = fs.readdirSync(ROH).filter(f => /^profil-.*\.json$/.test(f) && !f.startsWith('._')).sort();
  return l.length ? path.join(ROH, l[l.length - 1]) : null;
}
const datei = genannt ? path.resolve(genannt) : juengste();
if (!datei || !fs.existsSync(datei)) { console.error('Keine Ernte gefunden.'); process.exit(1); }
const text = fs.readFileSync(datei, 'utf8');
const j = JSON.parse(text);

const E = require('./ersatzzeichen.js');
const liste = j.songs || j.alle || j.clips || [];
const bericht = E.heilen(j);
const kopien = new Set(); (function z(o){ if (Array.isArray(o)) { o.forEach(z); return; } if (!o || typeof o !== 'object') return; if (typeof o.id === 'string' && o.metadata) kopien.add(o.id); Object.values(o).forEach(z); })(j);
console.log(path.basename(datei) + ': ' + liste.length + ' Titel in songs, ' + kopien.size + ' Clips insgesamt.');
for (const z of bericht.geheilt) console.log('  geheilt   ' + z);
for (const z of bericht.offen) console.log('  offen     ' + z);
if (!bericht.geheilt.length) { console.log('Nichts zu heilen.'); process.exit(0); }
if (probe) { console.log('(Probe - nichts geschrieben.)'); process.exit(0); }
const sicherung = datei + '.kaputt';
if (!fs.existsSync(sicherung)) fs.copyFileSync(datei, sicherung);
const teil = datei + '.teil';
fs.writeFileSync(teil, JSON.stringify(j));
fs.renameSync(teil, datei);
console.log('Geschrieben. Sicherung: ' + path.basename(sicherung));
