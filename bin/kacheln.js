/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ============================================================
   KlangTresor · Kacheln vorrechnen
   ------------------------------------------------------------
   Erzeugt pro Song ein fertiges kachel.jpg im Format 3:4 (hochkant).

   Warum überhaupt:
   Die Artworks haben unterschiedliche Seitenverhältnisse -
   quadratische Cover, hochkant stehende Video-Standbilder, alles
   mögliche. Ein aufgeräumtes Raster braucht aber ein einheitliches
   Format. Statt das bei jedem Bildaufbau im Browser zu lösen
   (zwei Bilder je Kachel, Weichzeichner auf dem Telefon), rechnen
   wir es einmal hier aus - so machen es Plex, Jellyfin und jedes
   Medienarchiv.

   Verfahren:
     Hintergrund = dasselbe Bild formatfüllend, beschnitten,
                   weichgezeichnet und abgedunkelt
     Vordergrund = das vollständige Bild, mittig daraufgelegt

   Nichts vom Motiv geht verloren, und es entsteht keine tote
   Fläche.

   Aufruf:
     node bin/kacheln.js            fehlende erzeugen
     node bin/kacheln.js --neu      alle neu erzeugen
   ============================================================ */

const fs   = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const K    = require('./katalog.js');

const WURZEL = path.join(__dirname, '..');
const SONGS  = path.join(WURZEL, 'library', 'songs');

const BREITE = 600, HOEHE = 800;          // 3:4 hochkant, reicht für Retina
const NEU    = process.argv.includes('--neu');
const PARALLEL = 4;

const filter =
  `[0:v]scale=${BREITE}:${HOEHE}:force_original_aspect_ratio=increase,` +
  `crop=${BREITE}:${HOEHE},boxblur=28:4,eq=brightness=-0.10:saturation=1.35[hg];` +
  `[0:v]scale=${BREITE}:${HOEHE}:force_original_aspect_ratio=decrease[vg];` +
  `[hg][vg]overlay=(W-w)/2:(H-h)/2`;

function rechne(quelle, ziel) {
  return new Promise((fertig) => {
    execFile('ffmpeg', [
      '-v', 'error', '-y',
      '-i', quelle,
      '-filter_complex', filter,
      '-frames:v', '1', '-q:v', '4',
      ziel,
    ], (fehler) => fertig(!fehler));
  });
}

(async () => {
  const katalog = K.lesen();
  if (!katalog) { console.error('Kein Katalog - erst bin/aufbereiten.js.'); process.exit(1); }

  const songs = Object.values(katalog.songs);
  const offen = [];

  for (const s of songs) {
    const quelle = path.join(SONGS, s.id, 'cover.jpg');
    const ziel   = path.join(SONGS, s.id, 'kachel.jpg');
    if (!fs.existsSync(quelle)) continue;
    if (!NEU && fs.existsSync(ziel) && fs.statSync(ziel).size > 0) continue;
    offen.push({ titel: s.titel, quelle, ziel });
  }

  console.log(`${songs.length} Songs, ${offen.length} Kacheln zu rechnen\n`);
  if (!offen.length) { console.log('Nichts zu tun.'); return; }

  let fertig = 0, misslungen = 0, bytes = 0;
  const start = Date.now();

  // In kleinen Gruppen, damit alle Kerne arbeiten, ohne den Mac
  // lahmzulegen.
  for (let i = 0; i < offen.length; i += PARALLEL) {
    const gruppe = offen.slice(i, i + PARALLEL);
    const ergebnis = await Promise.all(gruppe.map(a => rechne(a.quelle, a.ziel)));
    ergebnis.forEach((ok, j) => {
      if (ok && fs.existsSync(gruppe[j].ziel)) { fertig++; bytes += fs.statSync(gruppe[j].ziel).size; }
      else { misslungen++; console.log(`  ✗ ${gruppe[j].titel}`); }
    });
    process.stdout.write(`\r  ${fertig + misslungen}/${offen.length}`);
  }

  const dauer = Math.round((Date.now() - start) / 1000);
  console.log(`\n\nfertig:     ${fertig}`);
  if (misslungen) console.log(`misslungen: ${misslungen}`);
  console.log(`Größe:      ${(bytes/1048576).toFixed(1)} MB `
            + `(Schnitt ${Math.round(bytes/Math.max(fertig,1)/1024)} KB)`);
  console.log(`Dauer:      ${dauer} s`);
  console.log(`\nHinweis: Auf dieser exFAT-Platte belegt jede Kachel einen`);
  console.log(`ganzen 1-MB-Block, also rund ${fertig} MB statt ${(bytes/1048576).toFixed(0)} MB.`);
})();
