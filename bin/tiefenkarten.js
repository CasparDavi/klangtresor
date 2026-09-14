#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   TIEFENKARTEN AUS DEN TITELBILDERN
   bin/tiefenkarten.js

     node bin/tiefenkarten.js            was fehlt, wird gerechnet
     node bin/tiefenkarten.js --neu      alles noch einmal
     node bin/tiefenkarten.js --test 5   nur fuenf, zum Ansehen
     node bin/tiefenkarten.js --nur 0ac2e049  nur dieser Titel (Anfang der Kennung genuegt)

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

/* DIE LANGE KANTE. Depth Anything V2 ist auf 518 trainiert, aber NICHT auf
   ein Quadrat festgelegt: der Graph nimmt jedes Seitenverhaeltnis, solange
   beide Kanten Vielfache von 14 sind (der Fenstergroesse des ViT).
   Nachgemessen am 14.09.2026: 518x518, 392x518 und 378x504 laufen alle,
   die Ausgabe hat jeweils dieselbe Form wie die Eingabe.

   Warum das wichtig ist: 22 von 80 gepruefte Cover sind HOCHKANT (Suno
   liefert je nach Modell 1:1 oder 2:3). Auf ein Quadrat gequetscht sieht
   das Netz ein um ein Drittel gestauchtes Gesicht und antwortet
   entsprechend; beim Zurueckstrecken stimmt zwar die Geometrie wieder,
   aber die Karte ist die eines verzerrten Bildes.
   Caspar_D, 14.09.2026: „ich hab auch den Eindruck, dass die Depthmap
   nicht pixelgenau auf dem Bild sitzt." */
const KANTE = 518;
/* Auf Vielfache von 14 runden, laengste Kante = KANTE, Seitenverhaeltnis bleibt. */
function eingabeMasse(breite, hoehe) {
  const v = (x) => Math.max(14, Math.round(x / 14) * 14);
  if (breite >= hoehe) return [v(KANTE), v(KANTE * hoehe / breite)];
  return [v(KANTE * breite / hoehe), v(KANTE)];
}
const MEAN = [0.485, 0.456, 0.406], STD = [0.229, 0.224, 0.225];

const NEU  = process.argv.includes('--neu');
const TEST = (() => { const i = process.argv.indexOf('--test'); return i >= 0 ? Number(process.argv[i + 1]) || 0 : 0; })();
/* Einen einzelnen Titel rechnen - solange nicht feststeht, dass die Karten
   richtig sitzen, waere ein Lauf ueber alle verschwendet (Caspar_D,
   14.09.2026: „macht es Sinn, ueberhaupt alle durchzurechnen, solange wir
   nicht wissen, wie es richtig ist"). */
const NUR = (() => { const i = process.argv.indexOf('--nur'); return i >= 0 ? String(process.argv[i + 1] || '') : ''; })();

const AUSWEIS = {
  modell: 'depth-anything-v2-large',
  fassung: 'fp16 (onnx-community)',
  kante: KANTE + ' gerechnet, geschrieben in den Maßen des Bildes',
  quelle: 'titelbild',        /* siehe bildQuelle() - seit 14.09.2026 */
  lizenz: 'CC BY-NC-4.0',
};

/* WELCHES BILD. Nicht cover.jpg - das ist bei 181 von 324 Titeln NICHT
   das Bild, das die Oberflaeche zeigt.

   Caspar_D, 14.09.2026, nach dem ersten Blick auf den Nebel: „ich hab
   auch den Eindruck, dass die Depthmap nicht pixelgenau auf dem Bild
   sitzt." Sie sass nicht daneben - sie gehoerte zu einem anderen Bild.
   Beispiel cb02e238: cover.jpg ist 1528x1528, titelbild.jpg 1030x1528,
   und der Inhalt weicht im Mittel um 29 von 255 ab. Eine Karte des einen
   ueber dem anderen liest sich als Fehlausrichtung und stellenweise als
   verkehrte Tiefe.

   Genommen wird dasselbe, was sunoTitelbild() in web/index.html nimmt:
   titelbild.jpg, wenn es da ist, sonst cover.jpg. Welche Datei es war,
   steht im Buch - damit ein spaeterer Lauf es merkt, wenn ein Titelbild
   nachtraeglich dazukommt. */
function bildQuelle(id) {
  const t = path.join(SONGS, id, 'titelbild.jpg');
  if (fs.existsSync(t)) return { datei: t, art: 'titelbild' };
  const c = path.join(SONGS, id, 'cover.jpg');
  if (fs.existsSync(c)) return { datei: c, art: 'cover' };
  return null;
}

const buchLesen = () => { try { return JSON.parse(fs.readFileSync(BUCH, 'utf8')); } catch (e) { return { ausweis: AUSWEIS, karten: {} }; } };
const stempel = (p) => { try { const s = fs.statSync(p); return s.size + ':' + Math.round(s.mtimeMs); } catch (e) { return null; } };

/* Bild holen und Karte schreiben - beides ueber ffmpeg, das ohnehin im
   Haus ist. Kein zweites Bildpaket. */
function bildMasse(datei) {
  const e = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', datei], { encoding: 'utf8' });
  const m = String(e.stdout || '').trim().split('x').map(Number);
  return (m[0] > 0 && m[1] > 0) ? m : null;
}
function bildRoh(datei, w, h) {
  const e = spawnSync('ffmpeg', ['-v', 'error', '-i', datei,
    '-vf', `scale=${w}:${h}:flags=bicubic`, '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'],
    { maxBuffer: 1 << 28 });
  return e.stdout && e.stdout.length === w * h * 3 ? e.stdout : null;
}
/* DIE KARTE HAT DIE MASSE DES BILDES. Caspar_D, 14.09.2026: „du kommst auf
   Ideen, wieso überhaupt ein anderes Format als das Bild hat."

   Gerechnet wird bei 518 (darauf ist das Netz trainiert, und beide Kanten
   muessen Vielfache von 14 sein - der Transformer sieht in 14er-Feldern).
   Geschrieben wird aber in den Massen der Quelle: dann ist die Karte
   Bildpunkt fuer Bildpunkt dasselbe Format wie das Bild, und niemand muss
   sich spaeter fragen, ob irgendwo gestreckt wird. */
function grauSchreiben(grau, breite, hoehe, zielBreite, zielHoehe, ziel) {
  const e = spawnSync('ffmpeg', ['-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'gray',
    '-s', `${breite}x${hoehe}`, '-i', '-',
    '-vf', `scale=${zielBreite}:${zielHoehe}:flags=bicubic`,
    '-frames:v', '1', '-y', ziel], { input: grau });
  return e.status === 0;
}

(async () => {
  if (!fs.existsSync(MODELL)) {
    /* KEIN ABBRUCH. Dieser Schritt haengt in bin/wiederherstellen.js und damit im
       Morgenlauf; ein fehlendes Modell ist dort kein Fehler, sondern ein Zustand -
       wer die Modelle uebersprungen hat, soll trotzdem Medien und Kacheln bekommen.
       Echte Fehler geben weiterhin 1 zurueck. */
    console.log('  Das Tiefenmodell fehlt — Tiefenkarten werden übersprungen.');
    console.log('  Einmal nachholen mit:  node bin/modelle-holen.js\n');
    return;
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
  try { alle = fs.readdirSync(SONGS).filter((d) => !d.startsWith('.') && bildQuelle(d)); } catch (e) {}
  if (NUR) alle = alle.filter((id) => id.startsWith(NUR));
  const offen = alle.filter((id) => {
    if (NEU || NUR) return true;
    const q = bildQuelle(id);
    const eintrag = buch.karten[id];
    /* Auch die ART zaehlt: kommt spaeter ein titelbild.jpg dazu, ist die
       Karte aus dem cover ueberholt, obwohl dessen Stempel gleich blieb. */
    return !(eintrag && eintrag.quelle === stempel(q.datei) && eintrag.art === q.art && fs.existsSync(path.join(SONGS, id, 'tiefe.png')));
  }).slice(0, TEST || undefined);

  const mitTitelbild = alle.filter((id) => bildQuelle(id).art === 'titelbild').length;
  console.log(`  ${alle.length} Titel, ${offen.length} zu rechnen — ${mitTitelbild} aus titelbild.jpg, ${alle.length - mitTitelbild} aus cover.jpg.\n`);
  if (!offen.length) { console.log('  Nichts zu tun.\n'); return; }

  let n = 0, fehler = 0;
  const zeiten = [];
  for (const id of offen) {
    n++;
    const q = bildQuelle(id);
    const bm = bildMasse(q.datei);
    if (!bm) { console.log(`  [${n}/${offen.length}] ${id.slice(0, 8)}  Maße nicht lesbar`); fehler++; continue; }
    const [BW, BH] = eingabeMasse(bm[0], bm[1]);
    const roh = bildRoh(q.datei, BW, BH);
    if (!roh) { console.log(`  [${n}/${offen.length}] ${id.slice(0, 8)}  Bild ließ sich nicht lesen`); fehler++; continue; }

    const punkte = BW * BH;
    const f = new Float32Array(3 * punkte);
    for (let i = 0; i < punkte; i++) for (let k = 0; k < 3; k++)
      f[k * punkte + i] = (roh[i * 3 + k] / 255 - MEAN[k]) / STD[k];

    const t = Date.now();
    const aus = await sitzung.run({ pixel_values: new ort.Tensor('float32', f, [1, 3, BH, BW]) });
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
    if (!grauSchreiben(grau, W, H, bm[0], bm[1], ziel)) { console.log(`  [${n}/${offen.length}] ${id.slice(0, 8)}  Schreiben ging nicht`); fehler++; continue; }
    buch.karten[id] = { quelle: stempel(q.datei), art: q.art, gerechnet: new Date().toISOString() };

    const rest = zeiten.length ? Math.round((offen.length - n) * zeiten[zeiten.length - 1] / 1000) : 0;
    console.log(`  [${n}/${offen.length}] ${id.slice(0, 8)}  ${bm[0]}x${bm[1]}  (gerechnet ${W}x${H})  aus ${q.art}`);
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
