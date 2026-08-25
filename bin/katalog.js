/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ============================================================
   Suno-Archiv · Katalog-Zugriff
   ------------------------------------------------------------
   Der gesamte Kleinkram - Metadaten, Lyrics, Prompts, Zähler-
   verlauf - liegt in EINER gzip-Datei statt in tausenden kleinen
   Einzeldateien.

   Grund: Die SSD ist exFAT mit 1-MB-Blöcken. Eine 8-KB-Datei
   belegt dort ein volles Megabyte. Bei 251 Songs mal zwei Dateien
   wären das ~500 MB für ~3 MB Nutzdaten. Gepackt in einer Datei
   sind es nun etwa 0,5 MB - also ein einziger Block.

   Bei jedem Schreiben wandert die bisherige Fassung nach
   library/backup/. Das kostet fast nichts und rettet dich, falls
   ein Lauf mal Unsinn schreibt.
   ============================================================ */

const fs   = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const WURZEL  = path.join(__dirname, '..');
const LIB     = path.join(WURZEL, 'library');
const KATALOG = path.join(LIB, 'katalog.json.gz');
const BACKUP  = path.join(LIB, 'backup');

const BACKUPS_BEHALTEN = 10;

/** Katalog laden. Gibt null zurück, wenn es noch keinen gibt. */
function lesen() {
  if (!fs.existsSync(KATALOG)) return null;
  const roh = zlib.gunzipSync(fs.readFileSync(KATALOG));
  return JSON.parse(roh.toString('utf8'));
}

/**
 * Katalog schreiben. Die bisherige Fassung wird vorher nach
 * library/backup/ gesichert; alte Sicherungen werden ausgedünnt.
 */
function schreiben(daten) {
  fs.mkdirSync(LIB, { recursive: true });

  if (fs.existsSync(KATALOG)) {
    fs.mkdirSync(BACKUP, { recursive: true });
    const stempel = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    fs.copyFileSync(KATALOG, path.join(BACKUP, `katalog-${stempel}.json.gz`));

    const alte = fs.readdirSync(BACKUP)
      .filter(f => f.startsWith('katalog-') && f.endsWith('.json.gz'))
      .sort();
    for (const f of alte.slice(0, Math.max(0, alte.length - BACKUPS_BEHALTEN))) {
      fs.unlinkSync(path.join(BACKUP, f));
    }
  }

  // Stufe 9 = stärkste Kompression. Bei dieser Datenmenge dauert
  // das den Bruchteil einer Sekunde, spart aber spürbar.
  const gepackt = zlib.gzipSync(Buffer.from(JSON.stringify(daten), 'utf8'), { level: 9 });
  fs.writeFileSync(KATALOG, gepackt);

  return {
    datei:      path.relative(WURZEL, KATALOG),
    bytes:      gepackt.length,
    ungepackt:  JSON.stringify(daten).length,
  };
}

/**
 * Nur die schlanken Felder - das, was das Raster braucht.
 * Wichtig: Lyrics, Wort-Zeitmarken und Wellenform bleiben draußen.
 * Bei 248 Songs sind das sonst mehrere Megabyte, die das Telefon
 * für eine Kachelansicht laden müsste.
 */
/* DAS TEMPO AUS SUNOS SCHLAEGEN - eine Quelle fuer alle (23.08.2026).
   Median der Schlagabstaende (robust gegen Ausreisser) und die
   90-%-Abweichung als Mass fuer die Gleichmaessigkeit. Ueber 0,09 ist es
   kein Taktstueck. Nicht die gemessene BPM der Klanganalyse: die liegt bei
   30 % der Songs eine Oktave daneben und bei 7 % schlicht falsch
   (docs/ANALYZER-REVIEW.md). */
function takt(schlaege) {
  if (!Array.isArray(schlaege) || schlaege.length < 16) return null;
  const d = [];
  for (let i = 1; i < schlaege.length; i++) d.push(schlaege[i][0] - schlaege[i - 1][0]);
  const sortiert = d.slice().sort((x, y) => x - y);
  const schlagS = sortiert[sortiert.length >> 1];
  if (!(schlagS > 0.2 && schlagS < 1.4)) return null;
  const ab = d.map(x => Math.abs(x - schlagS) / schlagS).sort((x, y) => x - y);
  return { bpm: +(60 / schlagS).toFixed(1), fest: +ab[Math.floor(ab.length * 0.9)].toFixed(3),
           schlagS, taktS: 4 * schlagS };
}

function schlank(s) {
  /* Die grossen Reihen bleiben draussen - das Raster braucht sie nicht.
     Dafuer je ein Merker, ob sie da sind: Danach entscheidet das
     Lesezeichen, was es noch holen muss. */
  const { rohdaten, lyrics, zaehlerVerlauf, worte, welle, worteV3, worteV2,
          schlaege, abschnitte, wellenStufen, ...rest } = s;
  rest.hatLyrics = !!(lyrics && lyrics.trim());
  /* Wortzahl der Lyrics ohne Regieanweisungen: alles in eckigen
     Klammern ([Intro], [Chorus], [Outro] ...) zaehlt nicht. Die
     Lyrics selbst bleiben draussen - das Raster braucht sie nicht. */
  rest.lyricsWorte = lyrics ? lyricsWorte(lyrics) : 0;
  rest.hatTiming = !!(worte && worte.length);
  rest.hatSchlaege = !!(schlaege && schlaege.length);
  /* Das TEMPO aus Sunos Schlaegen - Median der Abstaende, robust gegen
     Ausreisser (Caspar_D, 23.08.2026: "wir sortieren nach Tempo und spielen das
     ab"). Nicht die gemessene BPM der Klanganalyse: die liegt bei 30 % der
     Songs eine Oktave daneben (60 statt 120) und bei 7 % schlicht falsch -
     eine Tempo-Reihenfolge zerreisst das. `taktFest` sagt, wie gleichmaessig
     das Raster ist (90-%-Abweichung); ueber 0,09 ist es kein Taktstueck. */
  const t = takt(schlaege);
  if (t){ rest.taktBpm = t.bpm; rest.taktFest = t.fest; }
  rest.hatAbschnitte = !!(abschnitte && abschnitte.state === 'complete');
  rest.hatWellenStufen = !!(wellenStufen && wellenStufen.length);
  rest.hatV3 = !!(worteV3 && worteV3.length);
  rest.bewegung   = bewegung(s, zaehlerVerlauf, 7);    // letzte Woche
  rest.bewegung28 = bewegung(s, zaehlerVerlauf, 28);   // letzte vier Wochen
  return rest;
}

/* Woerter des GESUNGENEN Textes. Das Lyrics-Feld traegt bei Caspar_D oft
   mehr: eine Vorrede, dann der Text mit [Intro] ... [Outro]/[End],
   dann Uebersetzung, Original oder die englische Fassung - die
   Struktur faengt dann von vorn an, oder eine Trennzeile steht davor.
   Gezaehlt wird ab dem ersten [Tag] bis: [End], eine Trennlinie
   (----, ####, ====), eine Ueberschrift wie "english translation" /
   "Original" / "English Version", oder das erste Tag kommt wieder.
   (Caspar_D, 20.08.2026: "bei der Laenge musst du Mehrsprachigkeit
   ignorieren") */
function lyricsWorte(lyrics) {
  const zeilen = lyrics.split('\n');
  const tagVon = (z) => { const m = /^\s*\[([^\]]*)\]\s*$/.exec(z); return m ? m[1].trim().toLowerCase() : null; };
  let start = zeilen.findIndex(z => tagVon(z) !== null);
  if (start < 0) start = 0;
  const erstesTag = tagVon(zeilen[start]);
  let n = 0, gesehen = 0;
  for (let i = start; i < zeilen.length; i++) {
    const z = zeilen[i], t = tagVon(z);
    if (/^\s*[-=#*_]{3,}/.test(z)) break;                                      // Trennlinie
    if (z.length < 80 && /translation|übersetzung|uebersetzung|english version|deutsche version|original\b/i.test(z) && !t) break;
    if (t !== null) {
      if (t === 'end') break;
      if (t === erstesTag && gesehen++ > 0) break;                           // Struktur faengt von vorn an
      continue;
    }
    n += (z.replace(/\[[^\]]*\]/g, ' ').match(/[\p{L}\p{N}'’-]+/gu) || []).length;
  }
  return n;
}

/* Was hat sich in den letzten sieben Tagen getan? Aus dem
   Zaehlerverlauf (aufbereiten.js: ein Eintrag je Tag, nur bei
   Aenderung). Bezugspunkt ist der juengste Stand VOR dem Fenster -
   der gilt bis zur naechsten Aenderung, also auch am Fenstertag.
   Gibt es keinen: Ist der Song juenger als sieben Tage, zaehlt er
   von null (Veroeffentlichung = 0, wie im Verlaufsdiagramm); sonst
   vom ersten bekannten Stand - mehr wissen wir nicht, und das wird
   ehrlich mit `seit` gesagt. Kein Verlauf: null, nicht 0 - die Seite
   bietet die Sortierung nur an, wenn es etwas zu sortieren gibt. */
function bewegung(s, verlauf, tage) {
  if (!Array.isArray(verlauf) || !verlauf.length) return null;
  const letzter = verlauf[verlauf.length - 1];
  const grenze  = new Date(Date.now() - tage * 86400000).toISOString().slice(0, 10);
  let basis = null;
  for (const e of verlauf) if (e.stand <= grenze) basis = e;
  if (!basis) {
    const jung = (s.erstellt || '').slice(0, 10) > grenze;
    basis = jung ? { stand: (s.erstellt || '').slice(0, 10), plays: 0, likes: 0, kommentare: 0 }
                 : verlauf[0];
  }
  if (basis === letzter) return { plays: 0, likes: 0, kommentare: 0, seit: basis.stand };
  return {
    plays:      (letzter.plays      || 0) - (basis.plays      || 0),
    likes:      (letzter.likes      || 0) - (basis.likes      || 0),
    kommentare: (letzter.kommentare || 0) - (basis.kommentare || 0),
    seit:       basis.stand,
  };
}

/* Sunos v3-Zeitmarken (aligned_lyrics/v3) kommen als Silbenstuecke -
   "D", "ae", "mmer" - mit dem Weissraum am ANFANG des naechsten
   Stuecks. Hier werden sie zu Woertern im v2-Format [[start, ende,
   "Wort "], ...]. Gemeinsam genutzt von aufbereiten.js (Import in den
   Katalog) und server.js (/api/zeitprobe fuer alte Rohdateien). */
function v3ZuWorten(d) {
  const roh = Array.isArray(d) ? d
            : (d && Array.isArray(d.aligned_words)) ? d.aligned_words
            : (d && Array.isArray(d.alignment)) ? d.alignment : null;
  if (!roh) return null;
  const aus = [];
  let akt = null;
  for (const t of roh) {
    const text = String(t.word ?? t.text ?? '');
    const von = t.start_s ?? t.start, bis = t.end_s ?? t.end;
    const m = /^(\s*)([\s\S]*)$/.exec(text);
    const fuehrend = m[1], rest = m[2];
    if (fuehrend && akt) { akt.text += fuehrend; aus.push([akt.s, akt.e, akt.text]); akt = null; }
    const endWeiss = rest.match(/\s+$/);
    const innen = rest.search(/\s/);
    if (innen > -1 && innen < rest.length - (endWeiss ? endWeiss[0].length : 0)) {
      const vorn = rest.slice(0, innen), hinten = rest.slice(innen);
      if (!akt) akt = { s: von, e: bis, text: '' };
      akt.text += vorn + (hinten.match(/^\s+/) || [''])[0];
      akt.e = bis;
      aus.push([akt.s, akt.e, akt.text]);
      akt = { s: von, e: bis, text: hinten.replace(/^\s+/, '') };
    } else {
      if (!akt) akt = { s: von, e: bis, text: '' };
      akt.text += rest; akt.e = bis;
    }
  }
  if (akt && akt.text.trim()) aus.push([akt.s, akt.e, akt.text + ' ']);
  return aus;
}

module.exports = { lesen, schreiben, schlank, takt, v3ZuWorten, KATALOG, BACKUP };
