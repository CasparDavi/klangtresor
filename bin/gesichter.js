#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   GESICHTER IN DEN STANDBILDERN
   bin/gesichter.js

     node bin/gesichter.js            was fehlt, wird gesucht
     node bin/gesichter.js --neu      alles noch einmal
     node bin/gesichter.js --test 5   nur fuenf, zum Ansehen
     node bin/gesichter.js --nur 0ac2e049  nur dieser Titel (Anfang der Kennung genuegt)

   WOFUER. Caspar_D, 06./07.10.2026: „schön wäre auch, wenn immer das Zentrum des Geschehens der
   Coverart in der Kachel zu sehen wäre" und „damit keine Gesichter in den PDFs angeschnitten sind".
   Schaum und Plakat legen jedes Bild so in seine Zelle, dass es sie deckt; bisher immer mittig. Mit den
   Gesichtern aus diesem Lauf rueckt es so, dass die Gesichter in der Zelle liegen (schaumBildPlatz in
   web/index.html). Gesucht wird in denselben Bildern wie bei den Tiefenkarten: titelbild.jpg, sonst
   cover.jpg, dazu jedes eigene Standbild - genau die Bilder, die Schirm und Druck zeigen.

   WELCHER ERKENNER, und warum (gemessen am 07.10.2026 an 40 Covern: die 10 neuesten Titel, das Testbild
   und eine feste Zufallsauswahl; Referenz von Hand gesetzt, 23 Hauptgesichter; Werkstatt
   _werkstatt_gesicht/, nicht im Paket):
                       Hauptgesichter  Fehlalarme   Groesse   Lizenz
     YuNet 2023mar  0,7     21/23          1         0,2 MB   MIT (OpenCV)
     UltraFace-320  0,7     20/23          0         1,2 MB   MIT
     SCRFD-500M     0,5     22/23          0         2,5 MB   nur nichtkommerziell (InsightFace)
     Zufallsboden           0,8/23
   YuNet: fast so gut wie das beste, das kleinste, und seine Lizenz passt zum Paket. Verpasst haben alle
   drei dasselbe: einen holzschnittartig gezeichneten Koenig im Profil. Rund 70 ms je Bild (Intel-Mac).

   DAS BUCH. library/gesichter.json traegt den AUSWEIS des Erkenners und je Bild die HERKUNFT (Groesse und
   Zeitstempel der Datei), dazu Breite und Hoehe des Bildes und die Gesichter in Bildanteilen
   [x0, y0, x1, y1, wertung] ab Wertung 0,6 - die Oberflaeche nimmt ab 0,7 (der gemessene Punkt), die
   Zahlen darunter bleiben zum Nachsehen. Geschrieben wird nur das Buch, sonst nichts in library/.
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const melden = require('./melden.js');

const WURZEL = path.join(__dirname, '..');
const SONGS  = path.join(WURZEL, 'library', 'songs');
const MODELL = path.join(WURZEL, 'library', 'modelle', 'face_detection_yunet_2023mar.onnx');
const BUCH   = path.join(WURZEL, 'library', 'gesichter.json');
const S = 640;                       /* Eingabe des Erkenners: das Bild eingepasst in 640×640, Rest schwarz */
const AB = 0.6;                      /* ins Buch ab dieser Wertung; die Oberflaeche nimmt ab 0,7 */
const AUSWEIS = { modell: 'yunet', fassung: '2023mar (opencv_zoo)', eingabe: S + '×' + S + ' eingepasst', ab: AB, lizenz: 'MIT' };
const MODELLIDENT = (a) => JSON.stringify([a && a.modell, a && a.fassung, a && a.eingabe, a && a.ab]);

const NEU  = process.argv.includes('--neu');
const TEST = (() => { const i = process.argv.indexOf('--test'); return i >= 0 ? Number(process.argv[i + 1]) || 0 : 0; })();
const NUR  = (() => { const i = process.argv.indexOf('--nur'); return i >= 0 ? String(process.argv[i + 1] || '') : ''; })();

/* Dieselbe Bildwahl wie bin/tiefenkarten.js (bildQuelle, eigenBilder): was die Oberflaeche zeigt. */
function bilderVon(id) {
  const aus = [], ordner = path.join(SONGS, id);
  const t = path.join(ordner, 'titelbild.jpg'), c = path.join(ordner, 'cover.jpg');
  if (fs.existsSync(t)) aus.push({ id, schluessel: id, datei: t, art: 'titelbild' });
  else if (fs.existsSync(c)) aus.push({ id, schluessel: id, datei: c, art: 'cover' });
  let namen = []; try { namen = fs.readdirSync(ordner); } catch (e) {}
  for (const n of namen) {
    if (!/^eigen(?:-\d+)?\.jpg$/.test(n)) continue;
    const datei = path.join(ordner, n);
    try { if (fs.statSync(datei).size <= 0) continue; } catch (e) { continue; }
    aus.push({ id, schluessel: id + '/' + n, datei, art: 'eigen' });
  }
  return aus;
}
const stempel = (p) => { try { const s = fs.statSync(p); return s.size + ':' + Math.round(s.mtimeMs); } catch (e) { return null; } };

function masse(datei) {
  const e = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', datei], { encoding: 'utf8' });
  const [w, h] = String(e.stdout || '').trim().split(',').map(Number);
  return w > 0 && h > 0 ? [w, h] : null;
}
/* Das Bild eingepasst in S×S (oben links, Rest schwarz) als RGB-Bytes - ueber ffmpeg, das ohnehin da ist. */
function pixel(datei) {
  const e = spawnSync('ffmpeg', ['-v', 'error', '-i', datei, '-vf', `scale=w=${S}:h=${S}:force_original_aspect_ratio=decrease,pad=${S}:${S}:0:0:black`,
    '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 64 << 20 });
  return e.status === 0 && e.stdout && e.stdout.length === S * S * 3 ? e.stdout : null;
}
/* YuNet (OpenCV, 2023): BGR 0..255, je Stufe 8/16/32 eine Wertung (Wurzel aus Klasse mal Objekt) und eine
   Box (Mitte relativ zur Rasterzelle, Breite/Hoehe logarithmisch) - wie FaceDetectorYN in OpenCV. */
async function suchen(ort, sitzung, datei, w, h) {
  const rgb = pixel(datei); if (!rgb) return null;
  const t = new Float32Array(3 * S * S), k = Math.min(S / w, S / h);
  for (let i = 0; i < S * S; i++) { t[i] = rgb[3 * i + 2]; t[S * S + i] = rgb[3 * i + 1]; t[2 * S * S + i] = rgb[3 * i]; }
  const o = await sitzung.run({ input: new ort.Tensor('float32', t, [1, 3, S, S]) });
  const roh = [];
  for (const st of [8, 16, 32]) {
    const cls = o['cls_' + st].data, obj = o['obj_' + st].data, bb = o['bbox_' + st].data, n = S / st;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const i = r * n + c, s = Math.sqrt(Math.min(1, Math.max(0, cls[i])) * Math.min(1, Math.max(0, obj[i])));
      if (s < AB) continue;
      const cx = (c + bb[4 * i]) * st, cy = (r + bb[4 * i + 1]) * st, bw = Math.exp(bb[4 * i + 2]) * st, bh = Math.exp(bb[4 * i + 3]) * st;
      const q = (v, m) => Math.min(1, Math.max(0, v / k / m));
      roh.push({ s, b: [q(cx - bw / 2, w), q(cy - bh / 2, h), q(cx + bw / 2, w), q(cy + bh / 2, h)] });
    }
  }
  /* Ueberlappende Boxen zusammenlegen (NMS 0,3), die staerkste bleibt */
  roh.sort((a, b) => b.s - a.s);
  const iou = (a, b) => { const x0 = Math.max(a[0], b[0]), y0 = Math.max(a[1], b[1]), x1 = Math.min(a[2], b[2]), y1 = Math.min(a[3], b[3]);
    const i = Math.max(0, x1 - x0) * Math.max(0, y1 - y0), u = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - i; return u > 0 ? i / u : 0; };
  const aus = [];
  for (const g of roh) if (!aus.some(a => iou(a.b, g.b) > 0.3)) aus.push(g);
  return aus.map(g => [...g.b.map(v => +v.toFixed(4)), +g.s.toFixed(3)]);
}

function buchLesen() {
  try { const b = JSON.parse(fs.readFileSync(BUCH, 'utf8')); if (b && b.bilder) return b; } catch (e) {}
  return { ausweis: AUSWEIS, bilder: {} };
}
function buchSchreiben(buch) {
  const neben = `${BUCH}.neu-${process.pid}`;
  fs.writeFileSync(neben, JSON.stringify(buch));
  fs.renameSync(neben, BUCH);
}

(async () => {
  if (!fs.existsSync(MODELL)) {
    console.log(`Gesichter — das Modell fehlt: ${path.relative(WURZEL, MODELL)}`);
    console.log('  Einmal nachholen mit:  node bin/modelle-holen.js\n');
    return;
  }
  const ort = require('onnxruntime-node');
  /* hoechstens vier Faeden - der Lauf ist klein, der Rechner soll nebenher frei bleiben */
  const sitzung = await ort.InferenceSession.create(MODELL, { intraOpNumThreads: 4, logSeverityLevel: 3 });
  const buch = buchLesen();
  if (MODELLIDENT(buch.ausweis) !== MODELLIDENT(AUSWEIS) && Object.keys(buch.bilder).length) {
    console.log('  Der Erkenner hat gewechselt — alle Bilder werden neu durchsucht.');
    buch.bilder = {};
  }
  buch.ausweis = AUSWEIS;

  let titel = [];
  try { titel = fs.readdirSync(SONGS).filter((d) => !d.startsWith('.')); } catch (e) {}
  if (NUR) titel = titel.filter((id) => id.startsWith(NUR));
  const alle = titel.reduce((s, id) => s.concat(bilderVon(id)), []);
  let offen = alle.filter((b) => {
    if (NEU || NUR) return true;
    const e = buch.bilder[b.schluessel];
    return !e || e.quelle !== stempel(b.datei) || e.art !== b.art;
  });
  if (TEST) offen = offen.slice(0, TEST);
  console.log(`Gesichter — ${offen.length} von ${alle.length} Bildern zu durchsuchen\n`);

  let n = 0, fehler = 0, mitGesicht = 0; const t0 = Date.now();
  for (const b of offen) {
    n++;
    const m = masse(b.datei);
    const g = m ? await suchen(ort, sitzung, b.datei, m[0], m[1]) : null;
    if (!g) { fehler++; console.log(`  [${n}/${offen.length}] ${b.id.slice(0, 8)}  ${path.basename(b.datei)} nicht lesbar`); continue; }
    buch.bilder[b.schluessel] = { quelle: stempel(b.datei), art: b.art, w: m[0], h: m[1], g, gerechnet: new Date().toISOString() };
    if (g.some(x => x[4] >= 0.7)) mitGesicht++;
    if (n % 25 === 0 || n === offen.length) {
      console.log(`  [${n}/${offen.length}] ${b.id.slice(0, 8)}  ${g.length} Gesicht${g.length === 1 ? '' : 'er'}`);
      buchSchreiben(buch);
    }
    melden.lauf({ was: 'Gesichter werden gesucht', n, von: offen.length, nEinheit: 'Standbild', jetzt: b.id.slice(0, 8) });
  }
  if (offen.length) buchSchreiben(buch);
  melden.ausLauf();
  const ms = offen.length ? Math.round((Date.now() - t0) / offen.length) : 0;
  console.log(`\n  ${n - fehler} Bilder durchsucht${fehler ? `, ${fehler} nicht lesbar` : ''}, ${mitGesicht} mit Gesicht (ab 0,7) — ${ms} ms je Bild.`);
  console.log(`  Buch: ${path.relative(WURZEL, BUCH)}\n`);
})().catch((e) => { console.error('  FEHLER:', e.message); process.exit(1); });
