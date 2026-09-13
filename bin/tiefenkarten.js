#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   TIEFENKARTEN AUS DEN TITELBILDERN
   bin/tiefenkarten.js

     node bin/tiefenkarten.js            was fehlt, wird gerechnet
     node bin/tiefenkarten.js --neu      alles noch einmal
     node bin/tiefenkarten.js --test 5   nur fuenf, zum Ansehen

   Aus jedem cover.jpg wird ein Graubild: hell ist nah, dunkel ist fern.
   Es liegt neben dem Cover als tiefe.png, 518x518.

   WOFUER. Caspar_D, 14.09.2026: „ich will Tiefenkarten, auch wenn das im
   Dokument weiter hinten steht, ist es das Tool, was ich fuer ziemlich
   outstanding halte." Der Plan (docs/effektclip/VIDEO-PLAN.md, §9.7)
   nennt sie einen GRUNDKANAL neben dem Licht-Puffer, keine Zutat: Dunst
   daempft dann entlang der Entfernung statt als Schicht, Partikel
   verschwinden hinter der Figur, der Scheinwerferfleck legt sich ueber
   sie, der Laserstrahl endet dort, wo er auftrifft.

   WELCHES MODELL, und warum das grosse - gemessen am 14.09.2026 an
   zwoelf Covern quer durch den Bestand (Intel-Mac):

     Small   94 MB    294 ms je Cover    Texturen werden ein weicher Brei
     Base   371 MB    880 ms             mehr Struktur
     Large  640 MB   2700 ms             einzelne Steine mit Relief

   Large in fp16, weil das den Download halbiert (640 MB statt 1,2 GB)
   und das Bild praktisch gleich bleibt: mittlere Abweichung 0,08 von
   255, groesste Einzelabweichung 3.

   WAS HIER SCHON EIN ANFANG DES ABLEITUNGSBUCHS IST. Neben den Karten
   liegt library/tiefenkarten.json und traegt zweierlei: die
   MODELLIDENTITAET (welches Modell, welche Fassung, welche Kante) und je
   Karte die HERKUNFT - Groesse und Zeitstempel des Covers, aus dem sie
   entstand. Damit weiss ein spaeterer Lauf, was neu zu rechnen ist,
   statt alles oder nichts zu tun; und ein Modellwechsel faellt auf,
   statt still andere Karten zu erzeugen. Das ist die kleine Fassung
   dessen, was als eigenes Dokument nach docs/haus/ gehoert.
   ============================================================= */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const melden = require('./melden.js');

const WURZEL = path.join(__dirname, '..');
const SONGS  = path.join(WURZEL, 'library', 'songs');
const MODELL = path.join(WURZEL, 'library', 'modelle', 'depth-anything-v2-large-fp16.onnx');
const BUCH   = path.join(WURZEL, 'library', 'tiefenkarten.json');

/* Die Eingabekante von Depth Anything V2. Nicht frei waehlbar: das Netz
   ist darauf trainiert, andere Kanten liefern schlechtere Karten. */
const N = 518;
const MEAN = [0.485, 0.456, 0.406], STD = [0.229, 0.224, 0.225];

const NEU  = process.argv.includes('--neu');
const TEST = (() => { const i = process.argv.indexOf('--test'); return i >= 0 ? Number(process.argv[i + 1]) || 0 : 0; })();

const AUSWEIS = {
  modell: 'depth-anything-v2-large',
  fassung: 'fp16 (onnx-community)',
  kante: N,
  lizenz: 'CC BY-NC-4.0',
};

const buchLesen = () => { try { return JSON.parse(fs.readFileSync(BUCH, 'utf8')); } catch (e) { return { ausweis: AUSWEIS, karten: {} }; } };
const stempel = (p) => { try { const s = fs.statSync(p); return s.size + ':' + Math.round(s.mtimeMs); } catch (e) { return null; } };

/* Bild holen und Karte schreiben - beides ueber ffmpeg, das ohnehin im
   Haus ist. Kein zweites Bildpaket. */
function bildRoh(datei) {
  const e = spawnSync('ffmpeg', ['-v', 'error', '-i', datei,
    '-vf', `scale=${N}:${N}:flags=bicubic`, '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'],
    { maxBuffer: 1 << 28 });
  return e.stdout && e.stdout.length === N * N * 3 ? e.stdout : null;
}
function grauSchreiben(grau, breite, hoehe, ziel) {
  const e = spawnSync('ffmpeg', ['-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'gray',
    '-s', `${breite}x${hoehe}`, '-i', '-', '-frames:v', '1', '-y', ziel], { input: grau });
  return e.status === 0;
}

(async () => {
  if (!fs.existsSync(MODELL)) {
    console.log('  Das Tiefenmodell fehlt. Einmal:  node bin/modelle-holen.js');
    process.exit(1);
  }
  const ort = require('onnxruntime-node');
  const t0 = Date.now();
  const sitzung = await ort.InferenceSession.create(MODELL);
  console.log(`Tiefenkarten — Modell geladen in ${((Date.now() - t0) / 1000).toFixed(1)} s\n`);

  const buch = buchLesen();
  /* Ein Modellwechsel macht jede alte Karte zu etwas anderem. */
  const gewechselt = JSON.stringify(buch.ausweis) !== JSON.stringify(AUSWEIS);
  if (gewechselt && Object.keys(buch.karten || {}).length) {
    console.log('  Das Modell hat gewechselt — alle Karten werden neu gerechnet.');
    console.log(`    vorher: ${buch.ausweis && buch.ausweis.modell} ${buch.ausweis && buch.ausweis.fassung}`);
    console.log(`    jetzt:  ${AUSWEIS.modell} ${AUSWEIS.fassung}\n`);
    buch.karten = {};
  }
  buch.ausweis = AUSWEIS;

  let alle = [];
  try { alle = fs.readdirSync(SONGS).filter((d) => !d.startsWith('.') && fs.existsSync(path.join(SONGS, d, 'cover.jpg'))); } catch (e) {}
  const offen = alle.filter((id) => {
    if (NEU) return true;
    const quelle = stempel(path.join(SONGS, id, 'cover.jpg'));
    const eintrag = buch.karten[id];
    return !(eintrag && eintrag.quelle === quelle && fs.existsSync(path.join(SONGS, id, 'tiefe.png')));
  }).slice(0, TEST || undefined);

  console.log(`  ${alle.length} Titelbilder, ${offen.length} zu rechnen.\n`);
  if (!offen.length) { console.log('  Nichts zu tun.\n'); return; }

  let n = 0, fehler = 0;
  const zeiten = [];
  for (const id of offen) {
    n++;
    const cover = path.join(SONGS, id, 'cover.jpg');
    const roh = bildRoh(cover);
    if (!roh) { console.log(`  [${n}/${offen.length}] ${id.slice(0, 8)}  Bild ließ sich nicht lesen`); fehler++; continue; }

    const f = new Float32Array(3 * N * N);
    for (let i = 0; i < N * N; i++) for (let k = 0; k < 3; k++)
      f[k * N * N + i] = (roh[i * 3 + k] / 255 - MEAN[k]) / STD[k];

    const t = Date.now();
    const aus = await sitzung.run({ pixel_values: new ort.Tensor('float32', f, [1, 3, N, N]) });
    zeiten.push(Date.now() - t);

    const d = aus.predicted_depth.data, masse = aus.predicted_depth.dims;
    const [H, W] = masse.slice(-2);
    let min = Infinity, max = -Infinity;
    for (const v of d) { if (v < min) min = v; if (v > max) max = v; }
    /* Auf 0..255 normiert. Die Karte ist RELATIV - sie sagt, was naeher
       ist, nicht wie weit etwas weg ist. Absolute Entfernungen gibt ein
       monokulares Modell nicht her, und ein Dichteparameter gilt deshalb
       je Bild, nicht allgemein (VIDEO-PLAN §9.7d). */
    const spanne = (max - min) || 1;
    const grau = Buffer.alloc(H * W);
    for (let i = 0; i < H * W; i++) grau[i] = Math.round((d[i] - min) / spanne * 255);

    const ziel = path.join(SONGS, id, 'tiefe.png');
    if (!grauSchreiben(grau, W, H, ziel)) { console.log(`  [${n}/${offen.length}] ${id.slice(0, 8)}  Schreiben ging nicht`); fehler++; continue; }
    buch.karten[id] = { quelle: stempel(cover), gerechnet: new Date().toISOString() };

    const rest = zeiten.length ? Math.round((offen.length - n) * zeiten[zeiten.length - 1] / 1000) : 0;
    console.log(`  [${n}/${offen.length}] ${id.slice(0, 8)}  ${W}x${H}`);
    melden.lauf({ was: 'Tiefenkarten werden gerechnet', n, von: offen.length, nEinheit: 'Titelbild',
      jetzt: id.slice(0, 8), rest: rest > 3 ? `noch etwa ${rest > 90 ? Math.round(rest / 60) + ' Minuten' : rest + ' Sekunden'}` : '' });
    if (n % 20 === 0) fs.writeFileSync(BUCH, JSON.stringify(buch, null, 1));
  }

  fs.writeFileSync(BUCH, JSON.stringify(buch, null, 1));
  melden.ausLauf();
  zeiten.sort((a, b) => a - b);
  console.log(`\n  ${n - fehler} Karten gerechnet${fehler ? `, ${fehler} Fehler` : ''} — Median ${zeiten[zeiten.length >> 1]} ms je Bild.`);
  console.log(`  Buch: ${path.relative(WURZEL, BUCH)}\n`);
})().catch((e) => { console.error('  FEHLER:', e.message); process.exit(1); });
