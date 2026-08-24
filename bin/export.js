/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * KlangTresor als selbsttragendes Archiv exportieren - für den USB-Stick,
 * den Nachlass, den Tag, an dem Suno zumacht.
 *
 *   node bin/export.js /Volumes/Stick/KlangTresor            kopieren
 *   node bin/export.js /Volumes/Stick/KlangTresor --probe    nur rechnen, nichts schreiben
 *   node bin/export.js ... --ohne-analysen              spart die 3-GB-Ablage
 *
 * WAS MITKOMMT: das Programm (web/, server/, bin/, browser/, docs/),
 * der komplette Datenbestand (Katalog, Medien als MP3, Cover, Videos,
 * Kacheln, Reaktionen, Notizen, Whisper, Analyse-Ablage) - alles, was
 * das Archiv zum Laufen braucht: `node server/server.js`, Browser auf.
 *
 * WAS NICHT MITKOMMT:
 *   - audio.wav        die WAV-Originale, ~17 GB. "Ohne waves, die
 *                      sind nur für die Analysen wichtig" (Caspar_D,
 *                      20.08.2026) - und die Analysen sind ja fertig
 *                      gerechnet und liegen als Ablage bei.
 *   - geheim/          Zugangsdaten. Niemals.
 *   - .git/            Geschichte gehört zur Werkstatt, nicht zum Stick.
 *   - roh/             Unverarbeitetes gehört verarbeitet, nicht kopiert.
 *
 * Werkzeug: rsync - kopiert nur, was sich geändert hat. Denselben
 * Export ein zweites Mal laufen zu lassen, frischt ihn also nur auf.
 */
const { spawnSync } = require('node:child_process');
const fs   = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..');
const args   = process.argv.slice(2);
const ziel   = args.find(a => !a.startsWith('--'));
const probe  = args.includes('--probe');
const ohneAnalysen = args.includes('--ohne-analysen');

if (!ziel) {
  console.error('\n  Wohin? Aufruf:  node bin/export.js /Volumes/Stick/KlangTresor [--probe] [--ohne-analysen]\n');
  process.exit(1);
}

const AUSSCHLUSS = [
  '--exclude', 'geheim/',
  '--exclude', '.git/',
  '--exclude', '.gitignore',
  '--exclude', 'library/roh/',
  '--exclude', 'audio.wav',            // die WAV-Originale, in jedem Songordner
  '--exclude', '._*',                  // exFAT-Beifang
  '--exclude', '*.lock',               // Schloss eines laufenden Detektors (library/stoerfrequenz.lock)
  '--exclude', '.DS_Store',
  '--exclude', 'node_modules/',
];
if (ohneAnalysen) AUSSCHLUSS.push('--exclude', 'library/analyse/');

const argv = ['-a', '--delete-excluded', ...(probe ? ['--dry-run'] : []),
              '--stats', ...AUSSCHLUSS, WURZEL + '/', ziel + '/'];

console.log(`\n  ${probe ? 'Probe (nichts wird geschrieben)' : 'Exportiere'} → ${ziel}`);
console.log(`  ohne WAV-Originale${ohneAnalysen ? ', ohne Analyse-Ablage' : ''}, ohne geheim/, ohne git\n`);

if (!probe) fs.mkdirSync(ziel, { recursive: true });
const r = spawnSync('rsync', argv, { encoding: 'utf8' });
if (r.status !== 0) { console.error(r.stderr || 'rsync schlug fehl'); process.exit(1); }

const zeilen = (r.stdout || '').split('\n');
const zahl = (name) => {
  const z = zeilen.find(x => x.includes(name)) || '';
  const m = z.match(/([\d,.]+)\s*(bytes)?\s*$/) || z.match(/:\s*([\d,.]+)/);
  return m ? m[1] : '?';
};
console.log(`  Dateien gesamt: ${zahl('Number of files')}`);
console.log(`  Übertragen:     ${zahl('Total transferred file size')} Bytes`);
console.log(`  Bestand:        ${zahl('Total file size')} Bytes`);

if (!probe) {
  fs.writeFileSync(path.join(ziel, 'START.md'), `# KlangTresor — Archiv-Export

Erzeugt am ${new Date().toISOString().slice(0, 10)} mit bin/export.js.

## Starten

    node server/server.js

und im Browser: http://localhost:8788

Mehr braucht es nicht — Node.js genügt, kein Internet nötig.
Alles liegt hier: Songs (MP3), Cover, Videos, Texte, Wort-Zeitmarken,
Kommentare und Likes (library/reaktionen.ndjson), eigene Notizen,
Messwerte. Es fehlen nur die WAV-Originale und die Zugangsdaten.

Das Archiv ist eine Kopie vom oben genannten Datum. Es aktualisiert
sich nicht selbst — dafür gibt es das Original mit Lesezeichen und
rotem Knopf (docs/UEBERGABE.md).
`);
  console.log(`\n  START.md geschrieben — auf dem Ziel: node server/server.js\n`);
} else console.log('');
