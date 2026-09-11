/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   DIE SUNO-SIGNATUR LESEN
   bin/suno-signatur.js

   Eine Suno-Datei erkennt man an ihrem Inhalt, nie am Dateinamen.
   Titel kommen doppelt vor („Lakritz" zweimal), tragen Sonderzeichen,
   werden umbenannt oder bekommen beim zweiten Download ein „ (1)".
   Im Kopf der Datei dagegen steht die Clip-UUID, und die ist eindeutig.

   Diese Regel wird an zwei Stellen gebraucht — beim Einlesen aus dem
   Download-Ordner (bin/uebernehmen.js) und beim Entgegennehmen vom
   Lesezeichen (server/server.js). Deshalb steht sie hier einmal.

   -------------------------------------------------------------
   DREI SPUREN, NICHT EINE

   Am 11.09.2026 gemessen, und der Befund war unangenehm: von 94
   Audiodateien in Caspar_Ds eigenem Suno-Ordner erkannte die alte
   Fassung GENAU NULL, obwohl 59 davon die UUID im Kopf tragen.

     1. `made with suno; created=…; id=…`
        Was Suno seit dem 22.01.2026 schreibt. Davor hieß es
        `made by suno` (12.–21.01.2026, 14 Titel im Bestand).
        Bei WAV steht es im INFO/ICMT-Block hinter dem RIFF-Kopf,
        bei MP3 im ID3-Kopf.

     2. `WOAS` mit `https://suno.com/song/<uuid>`
        Der Rahmen, den der Browser-Download setzt. Alle 59 mp3 in
        Caspar_Ds Suno-Ordner tragen ihn — und keine einzige Spur 1.

     3. UTF-16
        Bei älteren Browser-Downloads (ID3v2.3) steht die Signatur
        nicht als schlichter Text, sondern UTF-16-kodiert im
        COMM-Rahmen. Jedes zweite Byte ist dann Null, und eine Suche
        im rohen Text greift ins Leere. Deshalb wird der Kopf zweimal
        gelesen: einmal Byte für Byte, einmal als UTF-16.

   VOR DEM 12.01.2026 GIBT ES GAR KEINE MARKE. 217 von 324 Dateien im
   Archiv tragen nur `TSSE = Lavf…`, und das ist kein Suno-Merkmal,
   sondern heißt bloß „mit ffmpeg verpackt" — 25 von 6387 fremden
   Musikdateien tragen es ebenfalls. Für diese Dateien führt kein Weg
   über die Signatur; sie brauchen einen Rückweg über den Klang.

   -------------------------------------------------------------
   DER ZUFALLSBODEN

   Eine Erkennung ohne ihre Falschmeldungsrate ist wertlos. Gemessen am
   11.09.2026 gegen fremde Audiodateien aus ~/Music und
   /Volumes/Daten/Privat (ohne den Suno-Ordner): siehe den Eintrag in
   docs/suno/AUDIO-BEZUG.md. Wer diese Regeln ändert, misst neu.
   ============================================================= */
'use strict';
const fs = require('node:fs');

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

const SPUREN = [
  new RegExp('made (?:with|by) suno[^\\0]{0,300}?id=(' + UUID + ')', 'i'),
  new RegExp('suno\\.com/song/(' + UUID + ')', 'i'),
  new RegExp('id=(' + UUID + ')', 'i'),
];

/* 64 KB reichen für beide Formate reichlich; die ganze Datei zu lesen
   wäre bei 66-MB-WAVs Verschwendung. Die drei Dateien mit eingebettetem
   Coverbild tragen ihren Tag in 460 KB — bei denen greift Spur 2, die
   weit vorn im ID3-Kopf steht. */
const FENSTER = 64 * 1024;

function ausPuffer(puffer) {
  for (const text of [puffer.toString('latin1'), puffer.toString('utf16le')]) {
    for (const spur of SPUREN) {
      const m = text.match(spur);
      if (m) return m[1].toLowerCase();
    }
  }
  return null;
}

function ausDatei(datei) {
  let fd;
  try {
    fd = fs.openSync(datei, 'r');
    const puffer = Buffer.alloc(FENSTER);
    const gelesen = fs.readSync(fd, puffer, 0, puffer.length, 0);
    return ausPuffer(puffer.subarray(0, gelesen));
  } catch (e) { return null; }
  finally { if (fd !== undefined) try { fs.closeSync(fd); } catch (e) {} }
}

module.exports = { ausDatei, ausPuffer, FENSTER, UUID };
