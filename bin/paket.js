/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Packt das Weitergabe-ZIP — und prüft vorher, daß nichts Geheimes hinein kann.
 *
 *   node bin/paket.js              → ../KlangTresor-<datum>.zip
 *
 * Das ZIP entsteht aus `git archive HEAD`. Damit kommt nur hinein, was
 * git kennt - library/, geheim/ und alles andere aus .gitignore sind von
 * vornherein draußen. Das ist der eigentliche Schutz.
 *
 * Dieses Skript verläßt sich nicht darauf, sondern PRÜFT es: Es schaut
 * in das fertige ZIP hinein und bricht mit Fehler ab, wenn ein Schlüssel,
 * ein Cookie, eine Katalogdatei oder Rohdaten darin lägen. Lieber kein
 * Paket als ein falsches.
 */
const fs   = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const WURZEL = path.join(__dirname, '..');
const stempel = new Date().toISOString().slice(0, 10);
/* EIN NAME, AUS DEM ALLES ANDERE FOLGT.

   Der Ordnername im ZIP und die Verbotsmuster darunter muessen
   zusammenpassen. Standen sie getrennt da, wie bis zum 24.08.2026,
   dann genuegte eine Umbenennung an einer Stelle - und die Pruefung
   auf geheim/ und library/ lief ins Leere, ohne dass jemand es
   merkte. Ein Paket mit dem Schluessel darin haette als sauber
   gegolten. Deshalb steht der Name jetzt genau einmal. */
const PREFIX = 'KlangTresor';
const ziel = path.join(WURZEL, '..', `${PREFIX}-${stempel}.zip`);

/* Was NIE im Paket sein darf. Pfadmuster auf den Einträgen im ZIP. */
const VERBOTEN = [
  new RegExp('^' + PREFIX + '/geheim/'),               // der Schlüssel
  /suno-cookie/i,                    // auch unter anderem Namen
  /__client/,
  new RegExp('^' + PREFIX + '/library/'),              // Rohdaten, Katalog, Medien, Kommentare
  /\.ndjson$/,                       // reaktionen.ndjson o. ä.
  /katalog\.json/,
  /\.env$/,
];

const a = spawnSync('git', ['archive', '--format=zip', `--prefix=${PREFIX}/`, '-o', ziel, 'HEAD'],
                    { cwd: WURZEL, encoding: 'utf8' });
if (a.status !== 0) { console.error('git archive:', a.stderr); process.exit(1); }

const liste = spawnSync('unzip', ['-Z1', ziel], { encoding: 'utf8' }).stdout.split('\n').filter(Boolean);
const treffer = liste.filter(e => VERBOTEN.some(m => m.test(e)));

if (treffer.length) {
  fs.rmSync(ziel, { force: true });
  console.error('\n  ABGEBROCHEN — im Paket lägen geheime oder private Dateien:\n');
  for (const t of treffer) console.error('    ' + t);
  console.error('\n  Das ZIP wurde gelöscht. .gitignore prüfen.\n');
  process.exit(2);
}

const mb = (fs.statSync(ziel).size / 1048576).toFixed(2);
console.log(`\n  ${path.basename(ziel)} — ${liste.length} Dateien, ${mb} MB`);
console.log('  Geprüft: kein Schlüssel, kein Cookie, keine library/ im Paket.\n');
