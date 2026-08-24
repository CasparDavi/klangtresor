/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Klangprofil je Song für den Equalizer der Tonstudioseite.
 *
 *   node bin/eq-profil.js          → library/eq-profil.json
 *
 * Aus der Ablage (library/analyse/<id>.bin) liest dieser Lauf die
 * stereo_curve-Reihen: 8 Frequenzbänder × Zeit, je Kanal die
 * RMS-Energie. Daraus je Song EIN Profil: die mittlere Energie je
 * Band in dB, links+rechts zusammen. Dazu das Mittel über alle Songs
 * - die Klangfarbe der Sammlung.
 *
 * Die 8 Bänder sind DIE des Analyse-Kerns (analyzer-worker.js,
 * sBands) - der Equalizer regelt bewusst dieselben Bänder, damit
 * Eingangskurve (gemessen) und Regler (gestellt) dieselbe Achse
 * sprechen. Zehn ISO-Bänder wären üblicher, aber dann zeigte die
 * Kurve etwas anderes, als der Regler anfasst.
 *
 *   20-40 · 40-80 · 80-160 · 160-315 · 315-630 · 630-1250 ·
 *   1250-2500 · 2500-20000 Hz
 *
 * dB relativ zur Vollaussteuerung (20*log10(rms)), auf eine
 * Nachkommastelle. Läuft einmal über alle 321 Ablagen (~3 GB lesen,
 * wenige Minuten); der Morgenlauf ruft ihn nach dem Vorrechnen für
 * neue Songs erneut - er überspringt, was er schon hat.
 */
const fs   = require('node:fs');
const path = require('node:path');

const WURZEL  = path.join(__dirname, '..');
const ANALYSE = path.join(WURZEL, 'library', 'analyse');
const ZIEL    = path.join(WURZEL, 'library', 'eq-profil.json');

const BAENDER = [[20,40],[40,80],[80,160],[160,315],[315,630],[630,1250],[1250,2500],[2500,20000]];

/* analyse-ablage.js ist ein Browser-Skript ohne Exporte - derselbe
   Kniff wie in vorrechnen.js: Text laden, ausführen, Funktion greifen. */
const quelle = fs.readFileSync(path.join(WURZEL, 'web', 'fremd', 'analyse-ablage.js'), 'utf8');
const mod = {};
new Function('ziel', quelle + '\nziel.entpacken = ablageEntpacken;')(mod);

let alt = { songs: {}, hists: {} };
try { alt = JSON.parse(fs.readFileSync(ZIEL, 'utf8')); } catch (e) {}

const dateien = fs.readdirSync(ANALYSE).filter(f => /^[0-9a-f-]{36}\.bin$/.test(f));
const songs = { ...alt.songs };
const hists = { ...(alt.hists || {}) };   // Lautheitshistogramm je Song (Caspar_D, 21.08.2026)
let neu = 0, schief = 0, uebersprungen = 0;

for (const f of dateien) {
  const id = f.slice(0, 36);
  if (songs[id] && hists[id]) { uebersprungen++; continue; }
  try {
    const buf = fs.readFileSync(path.join(ANALYSE, f));
    const d = mod.entpacken(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    const st = (d.nachrichten || []).find(m => m.type === 'stereo_curve');
    if (!st || !st.lBands || st.lBands.length !== 8) { schief++; continue; }
    const profil = [];
    for (let b = 0; b < 8; b++) {
      const L = st.lBands[b], R = st.rBands[b];
      let s = 0, n = 0;
      for (let i = 0; i < L.length; i++) { const v = (L[i] + R[i]) / 2; if (v > 0) { s += v * v; n++; } }
      const rms = n ? Math.sqrt(s / n) : 0;
      profil.push(rms > 0 ? +(20 * Math.log10(rms)).toFixed(1) : -80);
    }
    songs[id] = profil;
    /* Lautheitshistogramm: je Zeitfenster die Gesamtenergie ueber die
       Baender (Wurzel der Quadratsumme), in dB, einsortiert in 30
       2-dB-Faecher von -60..0. Antwortet auf Caspar_Ds Frage: "wie laut
       ist wieviel Prozent des Liedes." Anteil 0..1, 3 Nachkommastellen. */
    const L0 = st.lBands[0].length;
    const bins = new Array(30).fill(0);
    let zaehl = 0;
    for (let t = 0; t < L0; t++){
      let en = 0;
      for (let b = 0; b < 8; b++){
        const v = (st.lBands[b][t] + st.rBands[b][t]) / 2;
        en += v * v;
      }
      if (en <= 0) continue;
      const db = 10 * Math.log10(en);
      const k = Math.max(0, Math.min(29, Math.floor((db + 60) / 2)));
      bins[k]++; zaehl++;
    }
    hists[id] = bins.map(n => zaehl ? +(n / zaehl).toFixed(3) : 0);
    neu++;
  } catch (e) { schief++; }
}

/* Das Mittel der Sammlung - Band für Band, über alle Songs. */
const alle = Object.values(songs);
const mittel = BAENDER.map((_, b) =>
  +(alle.reduce((s, p) => s + p[b], 0) / Math.max(1, alle.length)).toFixed(1));

fs.writeFileSync(ZIEL, JSON.stringify({
  stand: new Date().toISOString(),
  baender: BAENDER,
  mittel,
  songs,
  hists,
}));

console.log(`\n  EQ-Profile: ${Object.keys(songs).length} Songs` +
            `${neu ? ` (${neu} neu)` : ''}${uebersprungen ? `, ${uebersprungen} übersprungen` : ''}` +
            `${schief ? `, ${schief} ohne stereo_curve` : ''}`);
console.log(`  Sammlung: ${mittel.map(v => v.toFixed(0)).join(' · ')} dB`);
console.log(`  ${path.relative(WURZEL, ZIEL)} (${(fs.statSync(ZIEL).size / 1024).toFixed(0)} KB)\n`);
