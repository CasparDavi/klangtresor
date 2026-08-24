/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Baut den Analyse-Index: die Skalare aller vorgerechneten Songs in einer Datei.
 *
 *   node bin/analyse-index.js          → library/analyse-index.json
 *
 * WOZU
 * 321 Songs liegen vorgerechnet in library/analyse/<id>.bin, je 10 MB.
 * Wer nach BPM sortieren will, darf nicht 3 GB lesen. Dieser Index zieht
 * je Song die Zahlen heraus - Lautheit, Dynamik, True Peak, Stereobreite -
 * und legt sie in EINE Datei von wenigen KB. Der
 * Server liefert sie mit /api/index aus; die Albumseite sortiert damit.
 *
 * Das ist das Versprechen aus dem Backlog (Punkt 5.3): "alle Songs
 * vorrechnen - macht BPM, Tonart und Lautheit im Raster filter- und
 * sortierbar." Eingeloest am 19.08.2026.
 *
 * Laeuft im Morgenlauf direkt nach dem Vorrechnen. Schnell: nur der
 * Kopf jeder .bin wird gelesen, nicht die Reihen.
 */
const fs   = require('node:fs');
const path = require('node:path');

const WURZEL  = path.join(__dirname, '..');
const ANALYSE = path.join(WURZEL, 'library', 'analyse');
const ZIEL    = path.join(WURZEL, 'library', 'analyse-index.json');

/* Nur den Kopf lesen - er steht vorne, mit seiner Laenge davor. Die
   Reihen dahinter (Megabytes) werden nicht angefasst. */
function kopfLesen(datei) {
  const fd = fs.openSync(datei, 'r');
  try {
    const l = Buffer.alloc(4); fs.readSync(fd, l, 0, 4, 0);
    const n = l.readUInt32LE(0);
    if (n <= 0 || n > 64 * 1024 * 1024) return null;
    const k = Buffer.alloc(n); fs.readSync(fd, k, 0, n, 4);
    return JSON.parse(k.toString('utf8'));
  } finally { fs.closeSync(fd); }
}

const rund = (v, n) => (typeof v === 'number' && isFinite(v)) ? +v.toFixed(n) : null;

/* TOTGELEGT — 23.08.2026, Belege in docs/ANALYZER-PRUEFUNG.md
   ------------------------------------------------------------------
   Diese Größen messen nachweislich etwas anderes, als ihr Name sagt.
   Sie werden weiter GERECHNET und liegen weiter in der Ablage
   (library/analyse/<id>.bin) — gelöscht ist nichts (Caspar_D, 23.08.2026:
   "alles tot legen, was nicht funktioniert, aber nicht löschen").
   Sie kommen nur nicht mehr in den Index, und damit nicht mehr in
   Sortierung, Filter, Steckbrief und Klangraum-Legende. Wer eine
   zurückholen will, nimmt ihren Namen hier heraus.

     bpm       Der Autokorrelationsgipfel wird ohne Prüfung auf halbes
               oder doppeltes Tempo genommen; auf sauberer Stichprobe
               liegen 33 % auf der falschen metrischen Ebene. ERSATZ:
               `taktBpm` aus Sunos Schlagzeiten (im Katalog, für alle
               321 Songs, 306 davon taktfest) — Sortierung "Tempo
               (Sunos Takt)".
     stimme    Es gibt keine Stimmtrennung: gemessen wird der ganze Mix,
               die Bänder erfassen Kick und Baß. Von 321 Songs bekam
               KEIN einziger "instrumental", auch die 64 ohne Textzeile
               nicht ("Waldesrauschen" gilt als weiblich).
     f0        Liegt auf einem 23,4-Hz-Raster; für 321 Songs gibt es nur
               15 verschiedene Werte, und die Entscheidungsschwellen
               fallen zwischen die Rasterpunkte.
     centroid  Stammt aus einem einzigen 43-ms-Fenster bei 30 % der
               Spieldauer — kein Kennwert des Songs.
   ------------------------------------------------------------------ */
const TOT = new Set(['bpm', 'stimme', 'f0', 'centroid']);

function skalare(kopf) {
  const n = Object.fromEntries((kopf.nachrichten || []).map(m => [m.type, m]));
  const norm = n.norm || {}, sk = n.scalars || {}, fft = n.fft_partial || {}, vok = n.vocal_analysis || {};
  /* Tonart und Modus kamen aus schaetzeTonart() im Rechenkern - einer
     Krumhansl-Korrelation ueber das Chroma des Vollmix, die an echter
     Musik 1 von 20 traf. Das Verfahren ist am 24.08.2026 ausgebaut
     worden; die gueltige Tonart steht in library/toene.json (Bass auf
     Sunos Eins, gezaehlte Terz). */
  return {
    bpm:        rund(sk.bpm, 1),
    lufs:       rund(norm.lufs, 1),
    lra:        rund(norm.lra, 1),
    truePeak:   rund(norm.truePeak, 1),
    clip:       norm.clip || 0,
    dynamik:    rund(sk.dynamic, 1),
    stereo:     rund(sk.stereoWidth, 2),
    centroid:   rund(sk.centroid, 0),
    stimme:     vok.gender || sk.vocalGender || null,
    f0:         vok.f0 || null,
    korrelation: rund(norm.korr, 2),
    dauer:      rund(kopf.dauer, 0),
    stand:      kopf.stand,
  };
}

/* Die totgelegten Größen aus dem Eintrag nehmen - gerechnet bleiben sie. */
function ohneTote(e){
  const r = {};
  for (const [k, v] of Object.entries(e)) if (!TOT.has(k)) r[k] = v;
  return r;
}

let dateien = [];
try { dateien = fs.readdirSync(ANALYSE).filter(f => /^[0-9a-f-]{36}\.bin$/.test(f)); }
catch (e) { console.error('Keine Ablage unter library/analyse/'); process.exit(1); }

const index = {};
let gut = 0, schief = 0;
for (const f of dateien) {
  const id = f.slice(0, 36);
  try {
    const k = kopfLesen(path.join(ANALYSE, f));
    if (!k) { schief++; continue; }
    index[id] = ohneTote(skalare(k));
    gut++;
  } catch (e) { schief++; }
}

fs.writeFileSync(ZIEL, JSON.stringify({ erzeugtAm: new Date().toISOString(), anzahl: gut, songs: index }));
const kb = (fs.statSync(ZIEL).size / 1024).toFixed(0);
console.log(`\n  Analyse-Index: ${gut} Songs${schief ? `, ${schief} unlesbar` : ''} — ${kb} KB\n`);
