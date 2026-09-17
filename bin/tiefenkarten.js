#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   TIEFENKARTEN AUS DEN STANDBILDERN
   bin/tiefenkarten.js

     node bin/tiefenkarten.js            was fehlt, wird gerechnet
     node bin/tiefenkarten.js --neu      alles noch einmal
     node bin/tiefenkarten.js --test 5   nur fuenf, zum Ansehen
     node bin/tiefenkarten.js --nur 0ac2e049  nur dieser Titel (Anfang der Kennung genuegt)

   Aus jedem Standbild wird ein Graubild: hell ist nah, dunkel ist fern.
   Es liegt neben seinem Bild und in dessen Massen:

     titelbild.jpg (sonst cover.jpg)  ->  tiefe.png
     eigen.jpg, eigen-2.jpg ...       ->  eigen.tiefe.png, eigen-2.tiefe.png ...

   DIE KARTE GEHOERT ZUR QUELLE, NICHT ZUM TITEL (Caspar_D, 17.09.2026:
   „wir sollten die tiefenkarte immer an die quelle haengen, alles andere
   macht gar keinen sinn"). Das Effektclip-Studio malt auf einer von
   mehreren Quellen je Titel; bis heute bekam jede von ihnen die Karte des
   TITELBILDS untergelegt. Fuer ein eigenes Standbild ist das hier behoben:
   es bekommt seine eigene. Fuer Bewegtbilder gibt es hier KEINEN Rechenweg -
   sie brauchen einen Weg ueber den Server (Bild fuer Bild), und bis den
   jemand baut, stehen die Tiefenzeilen dort ausgegraut mit Grund.

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
  quelle: 'titelbild.jpg bzw. cover.jpg, dazu jedes eigene Standbild (eigen<n>.jpg)',   /* siehe bildQuelle() und eigenBilder() */
  lizenz: 'CC BY-NC-4.0',
};
/* WAS EINEN MODELLWECHSEL AUSMACHT — UND WAS NUR DANEBENSTEHT (17.09.2026).
   Verglichen werden die Felder, die die ZAHLEN bestimmen: Modell, Fassung,
   Kante. `quelle` beschreibt, WELCHE Bilder gerechnet werden, `lizenz` gar
   nichts am Ergebnis. Beide standen bis heute mit im Vergleich — und als die
   eigenen Standbilder dazukamen, haette allein das umformulierte `quelle`-Feld
   alle 325 vorhandenen Karten fuer ungueltig erklaert und eine Viertelstunde
   lang identische Bilder neu gerechnet. Welches Bild eine Karte wirklich hatte,
   steht ohnehin je Karte (`art`), und daran haengt das Nachrechnen. */
const MODELLIDENT = (a) => JSON.stringify([a && a.modell, a && a.fassung, a && a.kante]);

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

/* DIE EIGENEN STANDBILDER. Dieselbe Namensbildung wie in server.js (eigenNummern)
   und in medienUrl() der Oberflaeche: Nr. 1 heisst eigen.jpg, danach eigen-2.jpg,
   eigen-3.jpg. Die Karte traegt den Namen ihres Bildes plus .tiefe.png, damit
   nebeneinander steht, was zusammengehoert — wie eigen.sprung.mp4 neben eigen.mp4. */
function eigenBilder(id) {
  const ordner = path.join(SONGS, id);
  let namen = []; try { namen = fs.readdirSync(ordner); } catch (e) { return []; }
  const aus = [];
  for (const n of namen) {
    const m = /^eigen(?:-(\d+))?\.jpg$/.exec(n); if (!m) continue;
    const datei = path.join(ordner, n);
    try { if (fs.statSync(datei).size <= 0) continue; } catch (e) { continue; }
    aus.push({ nr: m[1] ? parseInt(m[1], 10) : 1, datei, rumpf: n.slice(0, -4) });
  }
  return aus.sort((a, b) => a.nr - b.nr);
}
/* JEDES BILD EINES TITELS, DAS EINE KARTE BEKOMMT — als ein Auftrag je Bild, nicht
   je Titel. `schluessel` ist der Platz im Herkunftsbuch: der Titel selbst fuer sein
   Titelbild (so bleiben die 325 vorhandenen Eintraege gueltig) und Titel/Dateiname
   fuer jedes eigene Standbild. Eine Titelkennung enthaelt nie einen Schraegstrich,
   also koennen sich die beiden nie in die Quere kommen. */
function bilderVon(id) {
  const aus = [];
  const q = bildQuelle(id);
  if (q) aus.push({ id, schluessel: id, datei: q.datei, art: q.art, ziel: path.join(SONGS, id, 'tiefe.png') });
  for (const e of eigenBilder(id))
    aus.push({ id, schluessel: id + '/' + path.basename(e.datei), datei: e.datei, art: 'eigen',
               ziel: path.join(SONGS, id, e.rumpf + '.tiefe.png') });
  return aus;
}

/* VERWAISTE KARTEN — GEMELDET, NICHT GELOESCHT (Gegenlesen 17.09.2026). Wird eigen-2.jpg
   geloescht, bleibt eigen-2.tiefe.png daneben liegen und ihr Eintrag steht weiter im Buch:
   die Karte eines Bildes, das es nicht mehr gibt. Gerechnet wird sie nie wieder, also faellt
   sie auch nie wieder auf — sie liegt nur herum und laesst das Buch mehr behaupten, als da ist.
   GELOESCHT WIRD HIER NICHTS. In library/ loescht niemand ungefragt; dieser Lauf schreibt
   Karten und nichts sonst. Er SAGT, was er findet, und der Mensch entscheidet.
   Gesucht wird nur in den Titeln, die dieser Lauf ohnehin ansieht (mit --nur also nur dort) -
   sonst meldete ein Probelauf ueber fuenf Titel etwas ueber den ganzen Bestand. */
function verwaiste(titel, alle, buch) {
  const erwartetDatei = new Set(alle.map((b) => b.ziel));
  const erwartetSchluessel = new Set(alle.map((b) => b.schluessel));
  const karten = [], eintraege = [];
  for (const id of titel) {
    const ordner = path.join(SONGS, id);
    let namen = []; try { namen = fs.readdirSync(ordner); } catch (e) { continue; }
    for (const n of namen) {
      if (!/^(eigen(-\d+)?\.)?tiefe\.png$/.test(n)) continue;
      const datei = path.join(ordner, n);
      if (!erwartetDatei.has(datei)) karten.push(path.relative(WURZEL, datei));
    }
    /* Buchseiten dieses Titels: der Titel selbst (sein Titelbild) und Titel/Dateiname je
       eigenem Standbild - dieselbe Bildung wie in bilderVon(). */
    for (const k of Object.keys(buch.karten || {}))
      if ((k === id || k.startsWith(id + '/')) && !erwartetSchluessel.has(k)) eintraege.push(k);
  }
  return { karten, eintraege };
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
  const gewechselt = MODELLIDENT(buch.ausweis) !== MODELLIDENT(AUSWEIS);
  if (gewechselt && Object.keys(buch.karten || {}).length) {
    console.log('  Das Modell hat gewechselt — alle Karten werden neu gerechnet.');
    console.log(`    vorher: ${buch.ausweis && buch.ausweis.modell} ${buch.ausweis && buch.ausweis.fassung}`);
    console.log(`    jetzt:  ${AUSWEIS.modell} ${AUSWEIS.fassung}\n`);
    buch.karten = {};
  }
  buch.ausweis = AUSWEIS;

  let titel = [];
  try { titel = fs.readdirSync(SONGS).filter((d) => !d.startsWith('.')); } catch (e) {}
  if (NUR) titel = titel.filter((id) => id.startsWith(NUR));
  /* Ein Titel kann ein eigenes Standbild haben, ohne ein Cover zu haben — dann hat er
     trotzdem etwas zu rechnen. Darum wird ueber die BILDER gefiltert, nicht ueber bildQuelle(). */
  const alle = titel.reduce((s, id) => s.concat(bilderVon(id)), []);
  const offen = alle.filter((b) => {
    if (NEU || NUR) return true;
    const eintrag = buch.karten[b.schluessel];
    /* Auch die ART zaehlt: kommt spaeter ein titelbild.jpg dazu, ist die
       Karte aus dem cover ueberholt, obwohl dessen Stempel gleich blieb. */
    return !(eintrag && eintrag.quelle === stempel(b.datei) && eintrag.art === b.art && fs.existsSync(b.ziel));
  }).slice(0, TEST || undefined);

  const zaehl = (a) => alle.filter((b) => b.art === a).length;
  console.log(`  ${alle.length} Bilder aus ${titel.length} Titeln, ${offen.length} zu rechnen — `
    + `${zaehl('titelbild')} aus titelbild.jpg, ${zaehl('cover')} aus cover.jpg, ${zaehl('eigen')} aus eigenen Standbildern.\n`);
  const waise = verwaiste(titel, alle, buch);
  if (waise.karten.length || waise.eintraege.length) {
    console.log(`  ${waise.karten.length} Karte(n) ohne Bild und ${waise.eintraege.length} Bucheintrag/-eintraege ohne Bild:`);
    for (const d of waise.karten.slice(0, 20)) console.log(`    liegt herum:  ${d}`);
    if (waise.karten.length > 20) console.log(`    … und ${waise.karten.length - 20} weitere`);
    for (const k of waise.eintraege.slice(0, 20)) console.log(`    steht im Buch: ${k}`);
    if (waise.eintraege.length > 20) console.log(`    … und ${waise.eintraege.length - 20} weitere`);
    console.log('  Ihr Bild ist weg. Hier wird nichts gelöscht — wegräumen von Hand, wenn es stimmt.\n');
  }
  if (!offen.length) { console.log('  Nichts zu tun.\n'); return; }

  let n = 0, fehler = 0;
  const zeiten = [];
  for (const b of offen) {
    n++;
    const marke = b.id.slice(0, 8) + (b.art === 'eigen' ? ' ' + path.basename(b.datei) : '');
    const bm = bildMasse(b.datei);
    if (!bm) { console.log(`  [${n}/${offen.length}] ${marke}  Maße nicht lesbar`); fehler++; continue; }
    const [BW, BH] = eingabeMasse(bm[0], bm[1]);
    const roh = bildRoh(b.datei, BW, BH);
    if (!roh) { console.log(`  [${n}/${offen.length}] ${marke}  Bild ließ sich nicht lesen`); fehler++; continue; }

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

    if (!grauSchreiben(grau, W, H, bm[0], bm[1], b.ziel)) { console.log(`  [${n}/${offen.length}] ${marke}  Schreiben ging nicht`); fehler++; continue; }
    buch.karten[b.schluessel] = { quelle: stempel(b.datei), art: b.art, gerechnet: new Date().toISOString() };

    const rest = zeiten.length ? Math.round((offen.length - n) * zeiten[zeiten.length - 1] / 1000) : 0;
    console.log(`  [${n}/${offen.length}] ${marke}  ${bm[0]}x${bm[1]}  (gerechnet ${W}x${H})  aus ${path.basename(b.datei)} → ${path.basename(b.ziel)}`);
    melden.lauf({ was: 'Tiefenkarten werden gerechnet', n, von: offen.length, nEinheit: 'Standbild',
      jetzt: b.id.slice(0, 8), rest: rest > 3 ? `noch etwa ${rest > 90 ? Math.round(rest / 60) + ' Minuten' : rest + ' Sekunden'}` : '' });
    if (n % 20 === 0) fs.writeFileSync(BUCH, JSON.stringify(buch, null, 1));
  }

  fs.writeFileSync(BUCH, JSON.stringify(buch, null, 1));
  melden.ausLauf();
  zeiten.sort((a, b) => a - b);
  console.log(`\n  ${n - fehler} Karten gerechnet${fehler ? `, ${fehler} Fehler` : ''} — Median ${zeiten[zeiten.length >> 1]} ms je Bild.`);
  console.log(`  Buch: ${path.relative(WURZEL, BUCH)}\n`);
})().catch((e) => { console.error('  FEHLER:', e.message); process.exit(1); });
