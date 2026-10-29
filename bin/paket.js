/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Packt das Weitergabe-ZIP — und prüft vorher, daß nichts Privates hinein kann.
 *
 *   node bin/paket.js              → ../KlangTresor.zip, ../KlangTresor-Update.zip, ../KlangTresor-Setup.exe
 *
 * Alle drei gehoeren an jede Release:
 *   gh release create vX ../KlangTresor.zip ../KlangTresor-Update.zip ../KlangTresor-Setup.exe ../KlangTresor-x86_64.AppImage ../KlangTresor.dmg …
 * Fehlt eines, liefert seine feste Adresse 404.
 *
 * Das ZIP entsteht aus `git archive HEAD`. Damit kommt nur hinein, was
 * git kennt - library/ und alles andere aus .gitignore sind von
 * vornherein draußen. Das ist der eigentliche Schutz.
 *
 * Dieses Skript verläßt sich nicht darauf, sondern PRÜFT es: Es schaut
 * in das fertige ZIP hinein und bricht mit Fehler ab, wenn ein Schlüssel,
 * ein Cookie, eine Katalogdatei oder Rohdaten darin lägen. Lieber kein
 * Paket als ein falsches.
 */
const fs   = require('node:fs');
const os   = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const WURZEL = path.join(__dirname, '..');
const stempel = new Date().toISOString().slice(0, 10);
/* EIN NAME, AUS DEM ALLES ANDERE FOLGT.

   Der Ordnername im ZIP und die Verbotsmuster darunter muessen
   zusammenpassen. Standen sie getrennt da, wie bis zum 24.08.2026,
   dann genuegte eine Umbenennung an einer Stelle - und die Pruefung
   auf library/ lief ins Leere, ohne dass jemand es merkte. Ein Paket
   mit dem halben Archiv darin haette als sauber gegolten. Deshalb
   steht der Name jetzt genau einmal. */
const PREFIX = 'KlangTresor';
/* OHNE OBERSTEN ORDNER, MIT FESTEM NAMEN. Caspar_D, 13.09.2026: "was
   aetzend ist, wenn ich das zip auspacke entsteht folgende
   ordnerstruktur C:\Users\...\klangtresor-main\klangtresor-main".
   GitHubs Branch-Zip traegt einen Ordner klangtresor-main/ in sich, und
   Windows' "Alle extrahieren" legt noch einen mit dem Zip-Namen darum.
   Ein Zip OHNE obersten Ordner, das KlangTresor.zip heisst, entpackt
   Windows nach KlangTresor\ und der Mac ebenso: eine Ebene, richtiger
   Name. Dafuer ist es als Release-Datei gedacht, mit fester Adresse
   .../releases/latest/download/KlangTresor.zip - nicht als Branch-Zip. */
const ziel = path.join(WURZEL, '..', `${PREFIX}.zip`);

/* Was NIE im Paket sein darf. Pfadmuster auf den Einträgen im ZIP. */
const VERBOTEN = [
  /* Eigene Bestandsdaten, die NICHT unter library/ liegen und deshalb
     durch die alte Liste fielen: docs/eichkasten/ trug 2,75 MB mit 257
     Song-IDs und je einem 768er-Textvektor aus den Liedtexten - zwoelfmal
     mehr als die Einmesskurven, die am selben Tag auffielen. Gefunden in
     der Pruefung vor der Veroeffentlichung, 11.09.2026. */
  new RegExp('^docs/eichkasten/vorher-vektoren/'),
  new RegExp('^docs/eichkasten/.*\\.vor-schritt'),
  /suno-cookie/i,                    // auch unter anderem Namen
  /__client/,
  new RegExp('^library/'),              // Rohdaten, Katalog, Medien, Kommentare
  /\.ndjson$/,                       // reaktionen.ndjson o. ä.
  /katalog\.json/,
  /\.env$/,
];

const a = spawnSync('git', ['archive', '--format=zip', '-o', ziel, 'HEAD'],
                    { cwd: WURZEL, encoding: 'utf8' });
if (a.status !== 0) { console.error('git archive:', a.stderr); process.exit(1); }

/* DAS SYMBOL FUER WINDOWS KOMMT MIT INS ZIP (29.10.2026), damit das Update es erneuert - siehe bin/windows/symbol-bauen.js.
   NICHT unter seinem Laufnamen im Hauptordner, sondern als bin/windows/KlangTresor.exe: das Update spielt das Skript
   der ALTEN Fassung ein, und das kopiert stur - auf die laufende KlangTresor.exe gaebe es „Datei in Benutzung", und das
   Update braeche mittendrin ab (server/ und web/ kommen im Alphabet danach). Eingesetzt wird sie vom neuen Server beim
   Start (exeEinsetzen in server/server.js). Unter Mac und Linux liegt sie unbenutzt dabei (rund 50 KB). */
{
  const T = fs.mkdtempSync(path.join(os.tmpdir(), 'klangtresor-symbol-aus-'));
  try {
    require('./windows/symbol-bauen.js').symbolBauen(T, require('../package.json').version);
    fs.mkdirSync(path.join(T, 'bin', 'windows'), { recursive: true });
    for (const f of ['KlangTresor.exe', 'KlangTresor.exe.config']) fs.renameSync(path.join(T, f), path.join(T, 'bin', 'windows', f));
    const z = spawnSync('zip', ['-q', ziel, 'bin/windows/KlangTresor.exe', 'bin/windows/KlangTresor.exe.config'], { cwd: T, encoding: 'utf8' });
    if (z.status !== 0) { console.error('zip (Symbol):', z.stderr); process.exit(1); }
  } catch (e) { fs.rmSync(ziel, { force: true }); console.error('\n  ABGEBROCHEN — ' + e.message + '\n'); process.exit(1); }
  finally { fs.rmSync(T, { recursive: true, force: true }); }
}

const liste = spawnSync('unzip', ['-Z1', ziel], { encoding: 'utf8' }).stdout.split('\n').filter(Boolean);
if (!liste.includes('bin/windows/KlangTresor.exe')) { fs.rmSync(ziel, { force: true }); console.error('\n  ABGEBROCHEN — KlangTresor.exe fehlt im Zip.\n'); process.exit(1); }
const treffer = liste.filter(e => VERBOTEN.some(m => m.test(e)));

if (treffer.length) {
  fs.rmSync(ziel, { force: true });
  console.error('\n  ABGEBROCHEN — im Paket lägen private Dateien:\n');
  for (const t of treffer) console.error('    ' + t);
  console.error('\n  Das ZIP wurde gelöscht. .gitignore prüfen.\n');
  process.exit(2);
}

const mb = (fs.statSync(ziel).size / 1048576).toFixed(2);
console.log(`\n  ${path.basename(ziel)} — ${liste.length} Dateien, ${mb} MB`);
console.log('  Geprüft: kein Schlüssel, kein Cookie, keine library/ im Paket.\n');

/* DAS UPDATE-PAKET FUER VERSIONEN OHNE UPDATE-SKRIPT. Caspar_D, 15.10.2026: „wenn jemand die scripte noch nicht hat,
   dann funktioniert das update nicht – kannst du die Scripte separat downloadable machen, damit leute mit nicht
   updatenfähigen Klangtresor-Versionen auch das script nutzen können, sie müssen es natürlich in den
   Klangtresor/MySuno Ordner kopieren“. Bis 1.0.72 lag weder bin/aktualisieren.js noch ein Anlasser bei.

   KlangTresor-Update.zip, feste Adresse .../releases/latest/download/KlangTresor-Update.zip, traegt genau vier
   Dateien, FLACH: aktualisieren.js und die drei Anlasser. Ohne bin/, weil der Finder beim Kopieren einen vorhandenen
   Ordner bin/ ersetzt, statt ihn zusammenzufuehren - das alte Programm waere weg. bin/aktualisieren.js laeuft darum
   auch im Hauptordner und raeumt sich dort nach dem ersten Lauf ohne Fehler selbst weg.

   Gebaut aus git archive wie das Hauptpaket: so kommen die Rechte mit (.command/.sh/.js ausfuehrbar) und die .cmd
   mit CRLF (.gitattributes). Derselbe Waechter, nur strenger: statt einer Verbotsliste die feste Liste genau dieser
   vier Namen - was sonst darin laege, gehoert nicht hinein. */
const UPDATE = { 'bin/aktualisieren.js': 'aktualisieren.js',
                 'aktualisieren-macos.command': 'aktualisieren-macos.command',
                 'aktualisieren-windows.cmd': 'aktualisieren-windows.cmd',
                 'aktualisieren-linux.sh': 'aktualisieren-linux.sh' };
const zielUpdate = path.join(WURZEL, '..', `${PREFIX}-Update.zip`);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'klangtresor-paket-'));
try {
  const tar = path.join(tmp, 'teile.tar');
  const t = spawnSync('git', ['archive', '--format=tar', '-o', tar, 'HEAD', '--'].concat(Object.keys(UPDATE)),
                      { cwd: WURZEL, encoding: 'utf8' });
  if (t.status !== 0) { console.error('git archive:', t.stderr); process.exit(1); }
  const flach = path.join(tmp, 'flach');
  fs.mkdirSync(flach);
  if (spawnSync('tar', ['-x', '-f', tar, '-C', tmp]).status !== 0) { console.error('tar -x scheiterte'); process.exit(1); }
  for (const [von, nach] of Object.entries(UPDATE)) fs.renameSync(path.join(tmp, von), path.join(flach, nach));
  fs.rmSync(zielUpdate, { force: true });
  const z = spawnSync('zip', ['-q', '-X', zielUpdate].concat(Object.values(UPDATE)), { cwd: flach, encoding: 'utf8' });
  if (z.status !== 0) { console.error('zip:', z.stderr); process.exit(1); }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

/* Hineinsehen statt glauben: genau die vier Namen, keiner in einem Ordner, keiner auf der Verbotsliste; die Anlasser
   fuer Mac und Linux und die .js ausfuehrbar; die .cmd mit CRLF und ohne einzelnes LF. */
const zeilen = spawnSync('zipinfo', [zielUpdate], { encoding: 'utf8' }).stdout.split('\n')
  .filter(z => /^[-dl][rwxsStT-]{9}\s/.test(z));
const eintraege = zeilen.map(z => ({ rechte: z.slice(0, 10), name: z.trim().split(/\s+/).slice(8).join(' ') }));
const fehler = [];
const soll = Object.values(UPDATE).slice().sort();
const ist = eintraege.map(e => e.name).sort();
if (JSON.stringify(soll) !== JSON.stringify(ist)) fehler.push('Inhalt ist ' + ist.join(', ') + ' - soll ' + soll.join(', '));
for (const e of eintraege) {
  if (VERBOTEN.some(m => m.test(e.name))) fehler.push(e.name + ' steht auf der Verbotsliste');
  if (/\.(command|sh|js)$/.test(e.name) && e.rechte[3] !== 'x') fehler.push(e.name + ' ist nicht ausfuehrbar (' + e.rechte + ')');
}
const cmd = spawnSync('unzip', ['-p', zielUpdate, 'aktualisieren-windows.cmd']).stdout || Buffer.alloc(0);
const lfAllein = (cmd.toString('latin1').match(/(?<!\r)\n/g) || []).length;
if (!cmd.length || lfAllein) fehler.push('aktualisieren-windows.cmd: ' + (cmd.length ? lfAllein + '× einzelnes LF statt CRLF' : 'leer'));
if (fehler.length) {
  fs.rmSync(zielUpdate, { force: true });
  console.error('\n  ABGEBROCHEN — das Update-Paket waere falsch:\n');
  for (const f of fehler) console.error('    ' + f);
  console.error('\n  KlangTresor-Update.zip wurde gelöscht.\n');
  process.exit(2);
}
console.log(`  ${path.basename(zielUpdate)} — ${eintraege.length} Dateien, flach, ${fs.statSync(zielUpdate).size} Bytes`);
console.log('  Geprüft: genau die vier Dateien, Mac/Linux ausführbar, .cmd mit CRLF.\n');
/* DIE SETUP.EXE FUER WINDOWS (Entscheidung vom 28.10.2026: jedes Release traegt sie). Gebaut aus dem eben geprueften
   KlangTresor.zip, siehe bin/setup-bauen.js. Scheitert sie, scheitert das Paket - ein Release ohne Setup.exe liesse
   die feste Adresse .../latest/download/KlangTresor-Setup.exe ins Leere zeigen. */
const setup = spawnSync(process.execPath, [path.join(__dirname, 'setup-bauen.js')], { stdio: 'inherit' });
if (setup.status !== 0) { console.error('\n  ABGEBROCHEN — die Setup.exe liess sich nicht bauen (siehe oben).\n'); process.exit(3); }
/* Und das AppImage fuer Linux (29.10.2026, bin/appimage-bauen.js) - dieselbe Regel: ohne AppImage kein Paket */
const appimage = spawnSync(process.execPath, [path.join(__dirname, 'appimage-bauen.js')], { stdio: 'inherit' });
if (appimage.status !== 0) { console.error('\n  ABGEBROCHEN — das AppImage liess sich nicht bauen (siehe oben).\n'); process.exit(4); }
/* Und die Mac-App als DMG (29.10.2026, bin/dmg-bauen.js) */
const dmg = spawnSync(process.execPath, [path.join(__dirname, 'dmg-bauen.js')], { stdio: 'inherit' });
if (dmg.status !== 0) { console.error('\n  ABGEBROCHEN — die Mac-App liess sich nicht bauen (siehe oben).\n'); process.exit(5); }

console.log('  Release: gh release create vX ../KlangTresor.zip ../KlangTresor-Update.zip ../KlangTresor-Setup.exe ../KlangTresor-x86_64.AppImage ../KlangTresor.dmg …\n');
