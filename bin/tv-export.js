/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * TV-Export: das Archiv als Stick oder DVD, die JEDES Gerät versteht.
 *
 *   node bin/tv-export.js /Volumes/Stick/MUSIK              Ordner bauen
 *   node bin/tv-export.js ~/tv-export --iso                 dazu ein DVD-Abbild
 *   node bin/tv-export.js ... --ohne-playlists              nur "Alle Songs" (DVD-Platz)
 *   node bin/tv-export.js ... --probe                       nur zählen
 *
 * Fernseher, DVD-Player, Autoradios und Küchenlautsprecher führen kein
 * HTML aus - sie haben Medienplayer für Dateien. Was ÜBERALL läuft
 * (Caspar_Ds Frage vom 20.08.2026): MP3 auf FAT32, Cover als JPEG IM Tag.
 *
 *   - Dateisystem: der Stick sollte FAT32 sein (Grenze 4 GB je Datei -
 *     für MP3 egal). exFAT können erst Geräte ab ~2015.
 *   - MP3 bleibt MP3: kein Neukodieren, kein Qualitätsverlust. ffmpeg
 *     kopiert die Tonspur und setzt nur ID3v2.3-Tags (Titel, Interpret,
 *     Album, Nummer) plus das Cover als eingebettetes Bild - TV-Player
 *     zeigen NUR, was im Tag steht.
 *   - Ordner sind die Navigation: "Alle Songs" chronologisch
 *     durchnummeriert, dazu ein Ordner je Playlist in Suno-Reihenfolge.
 *     Fremde Songs aus Playlists bleiben draußen - ihre Dateien liegen
 *     nicht im Archiv, und es sind nicht Caspar_Ds Werke.
 *   - Dateinamen FAT32-tauglich: keine Sonderzeichen, keine Emojis.
 *
 * DVD: --iso baut mit hdiutil ein Hybrid-Abbild (UDF + ISO9660/Joliet),
 * das Daten-DVD-Player seit ~2005 und jeder Computer lesen. Brennen:
 *   drutil burn <name>.iso     (oder im Finder: Rechtsklick, Brennen)
 * Eine ECHTE Video-DVD (für Uralt-Player) wäre Neukodierung nach
 * MPEG-2 mit Qualitätsverlust und 4,7-GB-Grenze - bewusst nicht gebaut.
 */
const fs   = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const K    = require('./katalog.js');

const WURZEL = path.join(__dirname, '..');
const SONGS  = path.join(WURZEL, 'library', 'songs');
const args   = process.argv.slice(2);
const ziel   = args.find(a => !a.startsWith('--'));
const probe  = args.includes('--probe');
const iso    = args.includes('--iso');
const ohnePl = args.includes('--ohne-playlists');

if (!ziel) {
  console.error('\n  Wohin? Aufruf:  node bin/tv-export.js /Volumes/Stick/MUSIK [--iso] [--ohne-playlists] [--probe]\n');
  process.exit(1);
}

const k = K.lesen();
if (!k) { console.error('Kein Katalog.'); process.exit(1); }
const interpret = (k.profil && (k.profil.display_name || k.profil.handle)) || 'KlangTresor';

/* FAT32-tauglich: nur Buchstaben, Zahlen und wenige Zeichen; Umlaute
   bleiben (FAT32 kann Unicode), Emojis und Verbotenes fliegen. */
const sauber = (t) => String(t)
  .replace(/[\\/:*?"<>|]/g, '–')
  .replace(/[^\p{L}\p{N} \-–_.,!'()&+]/gu, '')
  .replace(/\s+/g, ' ').trim().slice(0, 80) || 'Ohne Titel';

/* Ein MP3 mit Tags und eingebettetem Cover ans Ziel - Tonspur kopiert,
   nie neu kodiert. */
function schreiben(song, zielDatei, album, nummer) {
  const mp3   = path.join(SONGS, song.id, 'audio.mp3');
  const cover = path.join(SONGS, song.id, 'cover.jpg');
  if (!fs.existsSync(mp3)) return false;
  if (probe) return true;
  const hatCover = fs.existsSync(cover);
  const argv = ['-v', 'error', '-y', '-i', mp3];
  if (hatCover) argv.push('-i', cover, '-map', '0:a', '-map', '1:0', '-c', 'copy',
                          '-disposition:v', 'attached_pic');
  else argv.push('-map', '0:a', '-c', 'copy');
  argv.push('-id3v2_version', '3', '-write_id3v1', '1',
    '-metadata', `title=${song.titel || ''}`,
    '-metadata', `artist=${interpret}`,
    '-metadata', `album=${album}`,
    '-metadata', `track=${nummer}`,
    '-metadata', `date=${(song.erstellt || '').slice(0, 4)}`,
    zielDatei);
  return spawnSync('ffmpeg', argv).status === 0;
}

const eigene = Object.values(k.songs).filter(s => !s.fremd)
  .sort((a, b) => (a.erstellt || '').localeCompare(b.erstellt || ''));

console.log(`\n  ${probe ? 'Probe: ' : ''}TV-Export → ${ziel}`);
console.log(`  ${eigene.length} Songs, Interpret "${interpret}", MP3 unverändert, Cover im Tag\n`);

let dateien = 0, bytes = 0, fehlend = 0;
const tuWas = (song, ordner, name, album, nr) => {
  if (!probe) fs.mkdirSync(ordner, { recursive: true });
  const zielDatei = path.join(ordner, name);
  if (schreiben(song, zielDatei, album, nr)) {
    dateien++;
    bytes += probe ? (fs.existsSync(path.join(SONGS, song.id, 'audio.mp3')) ? fs.statSync(path.join(SONGS, song.id, 'audio.mp3')).size : 0)
                   : fs.statSync(zielDatei).size;
  } else fehlend++;
};

/* Alle Songs, chronologisch nummeriert */
const alleOrdner = path.join(ziel, 'Alle Songs');
eigene.forEach((s, i) => {
  const nr = String(i + 1).padStart(3, '0');
  tuWas(s, alleOrdner, `${nr} ${sauber(s.titel)}.mp3`, 'KlangTresor – Alle Songs', i + 1);
});
console.log(`  Alle Songs: ${dateien} geschrieben${fehlend ? `, ${fehlend} ohne MP3` : ''}`);

/* Ein Ordner je Playlist, in Suno-Reihenfolge */
if (!ohnePl) {
  for (const p of Object.values(k.playlists || {})) {
    const eintraege = (p.eintraege || []).filter(e => k.songs[e.songId] && !k.songs[e.songId].fremd)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    if (!eintraege.length) continue;
    const ordner = path.join(ziel, 'Playlists', sauber(p.name));
    eintraege.forEach((e, i) => {
      const nr = String(i + 1).padStart(2, '0');
      tuWas(k.songs[e.songId], ordner, `${nr} ${sauber(k.songs[e.songId].titel)}.mp3`, sauber(p.name), i + 1);
    });
  }
  console.log(`  Playlists:  dazu, gesamt jetzt ${dateien} Dateien`);
}

console.log(`\n  ${dateien} MP3s, ${(bytes / 1073741824).toFixed(2)} GB` +
            (bytes < 4.3e9 ? ' — passt auf eine Single-Layer-DVD (4,7 GB)' : ' — braucht Dual-Layer oder --ohne-playlists'));

if (iso && !probe) {
  const abbild = ziel.replace(/\/+$/, '') + '.iso';
  console.log(`\n  Baue DVD-Abbild ${path.basename(abbild)} …`);
  const r = spawnSync('hdiutil', ['makehybrid', '-udf', '-iso', '-joliet',
    '-default-volume-name', 'MYSUNO', '-o', abbild, ziel], { encoding: 'utf8' });
  if (r.status === 0) console.log(`  Fertig. Brennen:  drutil burn "${abbild}"`);
  else console.error('  hdiutil schlug fehl: ' + (r.stderr || '').slice(0, 200));
}
console.log('');
