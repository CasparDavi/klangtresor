/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ============================================================
   KlangTresor · Archiv aus den Rohdaten wiederherstellen
   ------------------------------------------------------------
   Baut aus library/roh/ das komplette Archiv neu auf: Katalog,
   Medien, Kacheln, Farbpaletten.

   DER PUNKT DABEI: Kein einziger dieser Schritte braucht eine
   Anmeldung bei Suno. Die Mediendateien liegen offen auf dem CDN.
   Nur das Sammeln der Rohdaten selbst geht durch den Browser, weil
   es ein Clerk-Token braucht - und genau diese Rohdaten sind
   deshalb der einzige Teil, der wirklich gesichert werden muss.

     library/roh/     ~11 MB   unersetzlich
     alles andere     ~5 GB    daraus reproduzierbar

   Aufruf:
     node bin/wiederherstellen.js           alles neu aufbauen
     node bin/wiederherstellen.js --pruefen nur nachsehen, was fehlt
   ============================================================ */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const WURZEL = path.join(__dirname, '..');
const ROH    = path.join(WURZEL, 'library', 'roh');
const NUR_PRUEFEN = process.argv.includes('--pruefen');

// Die Rohdatenarten und was ohne sie fehlt. "pflicht" heißt: ohne
// diese Datei lässt sich das Archiv nicht sinnvoll aufbauen.
const ARTEN = [
  { zweck: 'profil',      pflicht: true,  was: 'die veröffentlichten Songs' },
  { zweck: 'privat',      pflicht: false, was: 'die unveröffentlichten Songs aus Playlists' },
  { zweck: 'playlists',   pflicht: false, was: 'Playlists und ihre Einträge' },
  { zweck: 'timing',      pflicht: false, was: 'Wort-Zeitmarken für die Bühne' },
  { zweck: 'profilinfo',  pflicht: false, was: 'Autorenangaben und Suno-Statistik' },
];

function rohdateien(zweck){
  if (!fs.existsSync(ROH)) return [];
  return fs.readdirSync(ROH)
    .filter(f => f.startsWith(zweck + '-') && f.endsWith('.json'))
    .filter(f => !f.startsWith('._'));          // AppleDouble-Reste auf exFAT
}

// --- Bestandsaufnahme -------------------------------------------

console.log('Rohdaten in library/roh/:\n');

let fehltPflicht = false;
let bytes = 0;
for (const a of ARTEN){
  const d = rohdateien(a.zweck);
  const gr = d.reduce((s,f) => s + fs.statSync(path.join(ROH,f)).size, 0);
  bytes += gr;
  const marke = d.length ? '✓' : (a.pflicht ? '✗' : '–');
  if (!d.length && a.pflicht) fehltPflicht = true;
  console.log(`  ${marke} ${(a.zweck + '-*').padEnd(13)} ${String(d.length).padStart(2)} Datei(en)`
            + `${gr ? ', ' + (gr/1048576).toFixed(1) + ' MB' : ''}`
            + `${d.length ? '' : '   -> fehlt: ' + a.was}`);
}
console.log(`\n  zusammen ${(bytes/1048576).toFixed(1)} MB\n`);

/* Seit dem 20.08.2026 wandern verarbeitete Rohdateien nach
   roh/verarbeitet/ - ein leerer roh-Ordner ist dann NORMAL. Der
   Katalog traegt alles Noetige (URLs stecken je Song in rohdaten).
   Abbruch nur, wenn es WEDER Rohdaten NOCH einen Katalog gibt. */
const K = require('./katalog.js');
if (fehltPflicht && !K.lesen()){
  console.error('Weder Rohdaten noch Katalog. Erst im Browser sammeln:');
  console.error('  Lesezeichen auf suno.com (siehe docs/UEBERGABE.md)');
  process.exit(1);
}
if (fehltPflicht) console.log('Keine neuen Rohdaten — der Katalog ist die Quelle.\n');

if (NUR_PRUEFEN){
  console.log('Nur geprüft, nichts geändert. Ohne --pruefen läuft der Aufbau.');
  process.exit(0);
}

// --- Aufbau ------------------------------------------------------

/* --nur-medien (Morgenlauf): Der Katalog wurde dort gerade als
   eigener Schritt gebaut - ihn hier nochmal zu bauen waere doppelt. */
const nurMedien = process.argv.includes('--nur-medien');
const SCHRITTE = [
  ...(nurMedien ? [] : [['aufbereiten.js', [], 'Katalog aus den Rohdaten']]),
  ['laden.js',       ['--alle'],'Medien vom CDN (auch die privaten Songs)'],
  ['kacheln.js',     [],        'Kacheln im Format 3:4'],
  ['farben.js',      [],        'Farbpaletten aus den Covern'],
];

const start = Date.now();
for (let i = 0; i < SCHRITTE.length; i++){
  const [datei, args, zweck] = SCHRITTE[i];
  console.log(`\n${'='.repeat(64)}`);
  console.log(`[${i+1}/${SCHRITTE.length}] ${datei} ${args.join(' ')} - ${zweck}`);
  console.log('='.repeat(64) + '\n');

  const e = spawnSync(process.execPath, [path.join(__dirname, datei), ...args],
                      { stdio: 'inherit' });
  if (e.status !== 0){
    console.error(`\nAbgebrochen bei ${datei} (Rückgabewert ${e.status}).`);
    console.error('Die fertigen Schritte bleiben erhalten - einfach erneut starten,');
    console.error('es wird nur nachgeholt, was fehlt.');
    process.exit(e.status || 1);
  }
}

const dauer = Math.round((Date.now() - start)/1000);
console.log(`\n${'='.repeat(64)}`);
console.log(`Fertig in ${Math.floor(dauer/60)} min ${dauer%60} s.`);

/* EHRLICH SAGEN, WAS NICHT DABEI IST (24.08.2026).
   Bis hierher stand nur "Fertig" - und wer versehentlich in einem
   leeren Ordner neu angelegt hatte, glaubte, sein Archiv sei wieder da.
   Zurueck kommen aber nur MP3, Cover und Artwork: rund 2,7 von 44 GB.
   Die WAV-Originale holt bin/wav.js, die Instrumentspuren rechnet
   bin/stems.js lokal - beides steht in KEINEM Schritt hier. Der Verlust
   war still: Die Oberflaeche spielt MP3, es faellt erst im Tonstudio
   oder an den Stemspuren auf. */
try {
  const fs2 = require('node:fs');
  const SONGS = path.join(__dirname, '..', 'library', 'songs');
  if (fs2.existsSync(SONGS)) {
    const ordner = fs2.readdirSync(SONGS).filter(d => !d.startsWith('._'));
    let mp3 = 0, wav = 0, stems = 0;
    for (const d of ordner) {
      if (fs2.existsSync(path.join(SONGS, d, 'audio.mp3'))) mp3++;
      if (fs2.existsSync(path.join(SONGS, d, 'audio.wav'))) wav++;
      if (fs2.existsSync(path.join(SONGS, d, 'stems')))     stems++;
    }
    console.log(`\n  ${mp3} Songs als MP3, ${wav} als WAV, ${stems} mit Instrumentspuren.`);
    const fehlt = [];
    if (wav < mp3)   fehlt.push(`  WAV-Originale (${mp3 - wav} fehlen):        node bin/wav.js`);
    if (stems < mp3) fehlt.push(`  Instrumentspuren (${mp3 - stems} fehlen):  node bin/stems.js   — rund 4 min je Song`);
    if (fehlt.length) {
      console.log('\n  NICHT dabei, weil kein Schritt hier sie holt:');
      for (const z of fehlt) console.log(z);
      console.log('\n  Beides ist nachholbar und laeuft im Hintergrund weiter.');
    }
  }
} catch (e) {}

console.log('\nAnhören:  node server/server.js');
