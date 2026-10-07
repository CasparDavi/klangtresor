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
   Verpasst haben alle drei dasselbe: einen holzschnittartig gezeichneten Koenig im Profil. Zuerst (1.0.37) lief
   YuNet - fast so gut wie das beste, das kleinste, MIT. Dann Caspar_D, 07.10.2026: „nimm ruhig SCRFD, KlangTresor
   soll nicht kommerziell bleiben" - seither SCRFD-500M, der eine Treffer mehr, ohne Fehlalarm. Seine Gewichte
   liegen nicht im Paket; bin/modelle-holen.js holt sie aus InsightFaces buffalo_sc (Lizenz: web/fremd/LIZENZEN.md).

   SCHRIFT (Caspar_D, 07.10.2026: „da der Titel ja in die Zelle geschrieben wird, eine Optimierung auf
   Nicht-Sichtbarkeit des Covertitels"). Dazu sucht ein zweiter kleiner Erkenner die Schrift im Bild: PP-OCRv3 aus
   dem OpenCV-Modellzoo (2,4 MB, Apache 2.0). Gemessen an denselben 40 Covern: 32 von 35 markierten
   Schriftbereichen gedeckt; Fehlalarme auf Schneeflocken, Holzschnitt und unscharfen Laternen. Die Boxen stehen
   als t im Buch; schaumBildPlatz in web/index.html rueckt und zoomt danach (bis 1,4-fach), Gesichter gehen vor.

   AVATARE (Caspar_D: „auch bei den Groupies wäre eine Gesichtserkennung hilfreich"): die Avatare, die
   bin/avatare.js nach library/avatare/ geholt hat, werden hier mit durchsucht - Schluessel avatar/<datei>.

   DAS BUCH. library/gesichter.json traegt den AUSWEIS des Erkenners und je Bild die HERKUNFT (Groesse und
   Zeitstempel der Datei), dazu Breite und Hoehe des Bildes und die Gesichter in Bildanteilen
   [x0, y0, x1, y1, wertung] ab Wertung 0,4 - die Oberflaeche nimmt ab 0,5 (der gemessene Punkt; steht als
   schwelle im Ausweis und kommt so ueber /api/gesichter zur Seite), die Zahlen darunter bleiben zum Nachsehen. Geschrieben wird nur das Buch, sonst nichts in library/.
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const melden = require('./melden.js');

const WURZEL = path.join(__dirname, '..');
const SONGS  = path.join(WURZEL, 'library', 'songs');
const MODELL = path.join(WURZEL, 'library', 'modelle', 'scrfd_500m.onnx');
const TEXTMODELL = path.join(WURZEL, 'library', 'modelle', 'text_detection_en_ppocrv3_2023may.onnx');
const AVATARE = path.join(WURZEL, 'library', 'avatare');
const BUCH   = path.join(WURZEL, 'library', 'gesichter.json');
const S = 640;                       /* Eingabe des Erkenners: das Bild eingepasst in 640×640, Rest schwarz */
const AB = 0.4;                      /* ins Buch ab dieser Wertung; die Oberflaeche nimmt ab SCHWELLE */
const SCHWELLE = 0.5;                /* der gemessene Punkt: 22 von 23 Hauptgesichtern, kein Fehlalarm */
const TS = 736;                      /* Eingabe des Texterkenners */
const AUSWEIS = { modell: 'scrfd-500m', fassung: 'buffalo_sc det_500m (InsightFace v0.7)', eingabe: S + '×' + S + ' eingepasst', ab: AB,
                  schwelle: SCHWELLE, lizenz: 'nur nichtkommerziell (InsightFace)',
                  schrift: null };   /* wird nach dem Nachholen gesetzt, siehe unten */
const SCHRIFTAUSWEIS = 'ppocrv3-en 2023may, ' + TS + ', Schwelle 0,3 (Apache 2.0)';
const MODELLIDENT = (a) => JSON.stringify([a && a.modell, a && a.fassung, a && a.eingabe, a && a.ab, a && a.schrift]);

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
/* Die geholten Avatare (bin/avatare.js) - je Datei ein Bild. */
function avatarBilder() {
  let buch = null; try { buch = JSON.parse(fs.readFileSync(path.join(WURZEL, 'library', 'avatare.json'), 'utf8')); } catch (e) { return []; }
  const aus = [], gesehen = new Set();
  for (const e of Object.values((buch && buch.bilder) || {})) {
    if (!e || !e.datei || gesehen.has(e.datei)) continue; gesehen.add(e.datei);
    const datei = path.join(AVATARE, e.datei); if (fs.existsSync(datei)) aus.push({ id: 'avatar', schluessel: 'avatar/' + e.datei, datei, art: 'avatar' });
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
function pixel(datei, feld = S) {
  const e = spawnSync('ffmpeg', ['-v', 'error', '-i', datei, '-vf', `scale=w=${feld}:h=${feld}:force_original_aspect_ratio=decrease,pad=${feld}:${feld}:0:0:black`,
    '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 64 << 20 });
  return e.status === 0 && e.stdout && e.stdout.length === feld * feld * 3 ? e.stdout : null;
}
/* PP-OCRv3: Wahrscheinlichkeitskarte fuer Schrift (RGB, ImageNet-Normierung), Schwelle 0,3, zusammenhaengende Gebiete
   als Boxen, um 0,4 ihrer Hoehe aufgeweitet (die Karte ist schmaler als die Schrift) - Bildanteile [x0,y0,x1,y1]. */
async function schriftSuchen(ort, sitzung, datei, w, h) {
  const rgb = pixel(datei, TS); if (!rgb) return null;
  const k = Math.min(TS / w, TS / h), t = new Float32Array(3 * TS * TS), mean = [0.485, 0.456, 0.406], std = [0.229, 0.224, 0.225];
  for (let i = 0; i < TS * TS; i++) for (let c = 0; c < 3; c++) t[c * TS * TS + i] = (rgb[3 * i + c] / 255 - mean[c]) / std[c];
  const o = await sitzung.run({ [sitzung.inputNames[0]]: new ort.Tensor('float32', t, [1, 3, TS, TS]) });
  const p = o[sitzung.outputNames[0]].data, seen = new Uint8Array(TS * TS), boxen = [];
  for (let i = 0; i < TS * TS; i++) {
    if (seen[i] || p[i] < 0.3) continue;
    let x0 = TS, y0 = TS, x1 = 0, y1 = 0, n = 0; const st = [i]; seen[i] = 1;
    while (st.length) { const j = st.pop(), x = j % TS, y = (j / TS) | 0; n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (const q of [j - 1, j + 1, j - TS, j + TS]) if (q >= 0 && q < TS * TS && !seen[q] && p[q] >= 0.3 && Math.abs((q % TS) - x) <= 1) { seen[q] = 1; st.push(q); } }
    if (n < 30) continue;
    const ex = (y1 - y0 + 1) * 0.4, q = (v, m) => +Math.min(1, Math.max(0, v / k / m)).toFixed(4);
    boxen.push([q(x0 - ex, w), q(y0 - ex, h), q(x1 + ex, w), q(y1 + ex, h)]);
  }
  return boxen;
}
/* SCRFD-500M (InsightFace): RGB (x - 127,5) / 128, das Bild eingepasst in 640×640. Je Stufe 8/16/32 zwei Anker
   je Rasterpunkt, eine Wertung und vier Abstaende (links, oben, rechts, unten) in Stufen - wie SCRFD.detect in
   insightface/model_zoo/scrfd.py. Die Ausgaben stehen dort in dieser Reihenfolge: drei Wertungen, drei Boxen,
   drei Punktsaetze (Augen, Nase, Mund - hier nicht gebraucht). */
async function suchen(ort, sitzung, datei, w, h) {
  const rgb = pixel(datei); if (!rgb) return null;
  const t = new Float32Array(3 * S * S), k = Math.min(S / w, S / h);
  for (let i = 0; i < S * S; i++) for (let c = 0; c < 3; c++) t[c * S * S + i] = (rgb[3 * i + c] - 127.5) / 128;
  const o = await sitzung.run({ [sitzung.inputNames[0]]: new ort.Tensor('float32', t, [1, 3, S, S]) });
  const nm = sitzung.outputNames, roh = [];
  [8, 16, 32].forEach((st, j) => {
    const sc = o[nm[j]].data, bb = o[nm[j + 3]].data, n = S / st;
    for (let i = 0; i < sc.length; i++) {
      const s = sc[i]; if (s < AB) continue;
      const stelle = Math.floor(i / 2), cx = (stelle % n) * st, cy = Math.floor(stelle / n) * st;
      const q = (v, m) => Math.min(1, Math.max(0, v / k / m));
      roh.push({ s, b: [q(cx - bb[4 * i] * st, w), q(cy - bb[4 * i + 1] * st, h), q(cx + bb[4 * i + 2] * st, w), q(cy + bb[4 * i + 3] * st, h)] });
    }
  });
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
  /* FEHLENDE MODELLE NACHHOLEN (07.10.2026). Tarja: in bestehenden
     Installationen und im Docker kamen die beiden neuen Modelle nie an -
     der Docker-Entrypoint holt nur beim ersten Start, bin/einrichten.js nur
     bei der Einrichtung, der Morgenlauf gar nicht. Beide zusammen rund
     5 MB, also Sekunden; scheitert es, gilt die Meldung darunter. */
  const fehlen = [MODELL, TEXTMODELL].filter(f => !fs.existsSync(f)).map(f => path.basename(f));
  if (fehlen.length) {
    console.log(`Gesichter — hole fehlende Modelle: ${fehlen.join(', ')}`);
    spawnSync(process.execPath, [path.join(__dirname, 'modelle-holen.js'), '--nur', fehlen.join(',')], { stdio: 'inherit' });
  }
  AUSWEIS.schrift = fs.existsSync(TEXTMODELL) ? SCHRIFTAUSWEIS : null;
  if (!fs.existsSync(MODELL)) {
    console.log(`Gesichter — das Modell fehlt: ${path.relative(WURZEL, MODELL)}`);
    console.log('  Einmal nachholen mit:  node bin/modelle-holen.js\n');
    return;
  }
  const ort = require('onnxruntime-node');
  /* hoechstens vier Faeden - der Lauf ist klein, der Rechner soll nebenher frei bleiben */
  const sitzung = await ort.InferenceSession.create(MODELL, { intraOpNumThreads: 4, logSeverityLevel: 3 });
  const textSitzung = fs.existsSync(TEXTMODELL) ? await ort.InferenceSession.create(TEXTMODELL, { intraOpNumThreads: 4, logSeverityLevel: 3 }) : null;
  if (!textSitzung) console.log('  Ohne Texterkenner (library/modelle/text_detection_en_ppocrv3_2023may.onnx fehlt - node bin/modelle-holen.js).');
  const buch = buchLesen();
  if (MODELLIDENT(buch.ausweis) !== MODELLIDENT(AUSWEIS) && Object.keys(buch.bilder).length) {
    console.log('  Der Erkenner hat gewechselt — alle Bilder werden neu durchsucht.');
    buch.bilder = {};
  }
  buch.ausweis = AUSWEIS;

  let titel = [];
  try { titel = fs.readdirSync(SONGS).filter((d) => !d.startsWith('.')); } catch (e) {}
  if (NUR) titel = titel.filter((id) => id.startsWith(NUR));
  const alle = titel.reduce((s, id) => s.concat(bilderVon(id)), []).concat(NUR ? [] : avatarBilder());
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
    /* Schrift nur auf Covern - bei Avataren steht der Name im Kopf der Zelle, nicht auf dem Bild */
    const t = textSitzung && b.art !== 'avatar' ? await schriftSuchen(ort, textSitzung, b.datei, m[0], m[1]) : null;
    buch.bilder[b.schluessel] = { quelle: stempel(b.datei), art: b.art, w: m[0], h: m[1], g, t, gerechnet: new Date().toISOString() };
    if (g.some(x => x[4] >= SCHWELLE)) mitGesicht++;
    if (n % 25 === 0 || n === offen.length) {
      console.log(`  [${n}/${offen.length}] ${b.id.slice(0, 8)}  ${g.length} Gesicht${g.length === 1 ? '' : 'er'}`);
      buchSchreiben(buch);
    }
    melden.lauf({ was: 'Gesichter werden gesucht', n, von: offen.length, nEinheit: 'Standbild', jetzt: b.id.slice(0, 8) });
  }
  if (offen.length) buchSchreiben(buch);
  melden.ausLauf();
  const ms = offen.length ? Math.round((Date.now() - t0) / offen.length) : 0;
  console.log(`\n  ${n - fehler} Bilder durchsucht${fehler ? `, ${fehler} nicht lesbar` : ''}, ${mitGesicht} mit Gesicht (ab ${String(SCHWELLE).replace(".", ",")}) — ${ms} ms je Bild.`);
  console.log(`  Buch: ${path.relative(WURZEL, BUCH)}\n`);
})().catch((e) => { console.error('  FEHLER:', e.message); process.exit(1); });
