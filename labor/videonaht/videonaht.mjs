#!/usr/bin/env node
/* Videonaht: wie stark weichen Anfang und Ende der Bewegtbilder im Bestand ab, und welcher Uebergang
 * passt (VIDEO-PLAN §2, §6.1, §6.3-6.5, §6.7).
 *
 * Caspar_D, 15.09.2026: "Die Videos hast du alle in der Hand, du kannst schauen, wie stark Anfang und
 * Ende abweichen und ggf daraus ableiten, ob eine harte Taktnaht oder echte Effekte eingesetzt werden
 * und Vorschlaege machen." Randbedingung: der Loop ist hoechstens 10 s lang, der Uebergang liegt
 * innerhalb der 10 s.
 *
 *   node labor/videonaht/videonaht.mjs [--jobs 4] [--neu] [--nur id,id]
 *
 * Liest library/songs/<id>/{artwork.mp4, artwork.sprung.mp4, eigen.mp4} (nur lesen) und
 * library/katalog.json.gz (Titel). Schreibt nach labor/videonaht/:
 *   ergebnis.json   alle Kennzahlen je Video
 *   tabellen.md     Verteilungen und Tabelle je Video, maschinell (die Auswertung mit Pruefung am Bild
 *                   steht von Hand in statistik.md - die ueberschreibt der Lauf nicht)
 *   bilder/         Kontaktbogen je Video (Start, 1/3, 2/3, Ende, Schnitt i, Schnitt j-1)
 *   cache/          Rohkennzahlen je Video (Schluessel: Groesse + mtime); --neu rechnet alles neu
 *
 * Dekodiert wird mit ffmpeg (rawvideo rgb24, lange Seite 256), gerechnet in node worker_threads -
 * je Arbeiter hoechstens ein ffmpeg, also hoechstens --jobs (max 4) gleichzeitig. Keine Pakete.
 * Der Kontaktbogen wird in node gemalt (eigene 5x7-Schrift, PNG ueber zlib), weil dieses ffmpeg
 * ohne drawtext gebaut ist.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Worker, isMainThread, parentPort } from 'node:worker_threads';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '../..');
const SONGS = path.join(WURZEL, 'library/songs');
const BILDER = path.join(HIER, 'bilder');
const CACHE = path.join(HIER, 'cache');
const FFMPEG = '/usr/local/bin/ffmpeg', FFPROBE = '/usr/local/bin/ffprobe';
const DATEIEN = ['artwork.mp4', 'artwork.sprung.mp4', 'eigen.mp4'];
const LANGE_SEITE = 256;      // Rechengroesse
const BLOCK = 16;             // Blockkante fuer d(i,j), wie §6.5
const TAUS = [1, 2, 4, 8, 15, 30, 60, 120];
const MIN_S = 4, MAX_S = 10;  // Clip-Laenge der Nahtsuche
const RECHEN_FASSUNG = 9;    // Cache-Schluessel: bei Aenderung der Rohkennzahlen erhoehen

/* ======================================================================================
 * Rechnen je Video (laeuft im Arbeiter)
 * ==================================================================================== */

function sonde(datei) {
  const j = JSON.parse(execFileSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,avg_frame_rate,r_frame_rate,nb_frames,duration:format=duration',
    '-of', 'json', datei], { encoding: 'utf8' }));
  const s = j.streams[0];
  const bruch = t => { const [a, b] = String(t).split('/').map(Number); return b ? a / b : a; };
  return {
    breite: s.width, hoehe: s.height,
    fps: bruch(s.avg_frame_rate) || bruch(s.r_frame_rate),
    bilderMeta: +s.nb_frames || null,
    dauer: +s.duration || +j.format.duration || null,
  };
}

function dekodieren(datei, W, H) {
  return new Promise((ok, fehl) => {
    const p = spawn(FFMPEG, ['-v', 'error', '-i', datei, '-map', '0:v:0', '-fps_mode', 'passthrough',
      '-vf', `scale=${W}:${H}:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'],
      { stdio: ['ignore', 'pipe', 'pipe'] });
    const teile = []; let fehler = '';
    p.stdout.on('data', c => teile.push(c));
    p.stderr.on('data', c => { fehler += c; });
    p.on('error', fehl);
    p.on('close', code => {
      if (code !== 0) return fehl(new Error('ffmpeg ' + code + ': ' + fehler.slice(0, 300)));
      const buf = Buffer.concat(teile), g = W * H * 3, n = Math.floor(buf.length / g);
      const bilder = [];
      for (let k = 0; k < n; k++) bilder.push(new Uint8Array(buf.buffer, buf.byteOffset + k * g, g));
      ok(bilder);
    });
  });
}

/* Blockeinteilung: etwa 16 px, Raender gleichmaessig verteilt statt schmaler Reststreifen */
function bloecke(laenge) {
  const n = Math.max(1, Math.round(laenge / BLOCK)), grenzen = [];
  for (let k = 0; k <= n; k++) grenzen.push(Math.round(k * laenge / n));
  return grenzen;
}

function abstandsRechner(bilder, W, H) {
  const bx = bloecke(W), by = bloecke(H), nbx = bx.length - 1, nby = by.length - 1;
  const N = bilder.length, memo = new Float32Array(N * N).fill(-1);
  const memoMittel = new Float32Array(N * N), memoAnteil = new Float32Array(N * N);
  const nBloecke = nbx * nby, ANTEIL_SCHWELLE = 20;
  let zaehler = 0;
  /* d(a,b) = max ueber Bloecke der mittleren |dR|+|dG|+|dB| / 3, Skala 0..255 */
  function d(a, b) {
    if (a === b) return 0;
    if (a > b) { const t = a; a = b; b = t; }
    const m = memo[a * N + b]; if (m >= 0) return m;
    const A = bilder[a], B = bilder[b];
    let best = 0, summe = 0, ueber = 0;
    for (let ky = 0; ky < nby; ky++) {
      const y0 = by[ky], y1 = by[ky + 1];
      for (let kx = 0; kx < nbx; kx++) {
        const x0 = bx[kx], x1 = bx[kx + 1];
        let s = 0;
        for (let y = y0; y < y1; y++) {
          let o = (y * W + x0) * 3; const e = (y * W + x1) * 3;
          for (; o < e; o++) { const v = A[o] - B[o]; s += v < 0 ? -v : v; }
        }
        const w = s / (3 * (y1 - y0) * (x1 - x0));
        if (w > best) best = w;
        summe += w; if (w > ANTEIL_SCHWELLE) ueber++;
      }
    }
    zaehler++;
    memo[a * N + b] = best; memoMittel[a * N + b] = summe / nBloecke; memoAnteil[a * N + b] = ueber / nBloecke;
    return best;
  }
  /* Nebenprodukte desselben Durchgangs: Mittel ueber die Bloecke (Bildmittel) und Anteil der Bloecke > 20 */
  const lies = (feld, a, b) => { if (a === b) return 0; if (a > b) { const t = a; a = b; b = t; } d(a, b); return feld[a * N + b]; };
  const dMittel = (a, b) => lies(memoMittel, a, b), anteil = (a, b) => lies(memoAnteil, a, b);
  return { d, dMittel, anteil, zaehlerStand: () => zaehler, nbx, nby };
}

const median = arr => { if (!arr.length) return null; const s = Float64Array.from(arr).sort(); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
function perzentil(arr, p) {
  if (!arr.length) return null;
  const s = Float64Array.from(arr).sort(), x = p * (s.length - 1), u = Math.floor(x), o = Math.min(s.length - 1, u + 1);
  return s[u] + (s[o] - s[u]) * (x - u);
}
const r3 = x => x == null || !isFinite(x) ? x : Math.round(x * 1000) / 1000;

/* Nahtsuche §6.1: Clip [i, j), Abspielen springt von j-1 nach i. Gute Naht, wenn Bild i dem Bild j
 * gleicht (j waere der natuerliche Nachfolger von j-1) - und zwar mitsamt den Nachbarn, damit die
 * Bewegungsrichtung mitzaehlt: dd = sum w_k d(i+k, j+k) / sum w_k, k = -1,0,1, w = 1,2,1, nur
 * gueltige Indizes. Gibt es keinen (i = 0 und j = N), zaehlt der tatsaechliche Sprung d(j-1, i). */
function nahtsuche(N, fps, d, p95, anteil) {
  const Lmax = Math.min(Math.floor(MAX_S * fps + 1e-6), N);
  const Lmin = Math.min(Math.ceil(MIN_S * fps - 1e-6), Lmax);
  const W3 = [1, 2, 1];
  const dd = (i, j) => {
    let s = 0, w = 0;
    for (let k = -1; k <= 1; k++) {
      const a = i + k, b = j + k;
      if (a < 0 || b > N - 1) continue;
      s += W3[k + 1] * d(a, b); w += W3[k + 1];
    }
    return w ? { wert: s / w, geglaettet: true } : { wert: d(j - 1, i), geglaettet: false };
  };
  const fenster = [];
  for (let s = MIN_S; s < MAX_S; s++) fenster.push({ von_s: s, bis_s: s + 1, best: null });
  let best = null, bestSprung = null;
  for (let L = Lmax; L >= Lmin; L--) {             // lange zuerst: Gleichstand geht an die laengere
    for (let i = 0; i + L <= N; i++) {
      const j = i + L, r = dd(i, j), kand = { i, j, L, dd: r.wert, geglaettet: r.geglaettet };
      if (!best || kand.dd < best.dd - 1e-9) best = kand;
      const sprung = d(j - 1, i);
      if (!bestSprung || sprung < bestSprung.sprung - 1e-9) bestSprung = { ...kand, sprung };
      const sek = L / fps;
      let fi = Math.floor(sek) - MIN_S; if (fi === fenster.length) fi--;   // genau 10 s gehoert ins letzte Fenster
      if (fi >= 0 && fi < fenster.length) { const f = fenster[fi]; if (!f.best || kand.dd < f.best.dd - 1e-9) f.best = kand; }
    }
  }
  const aufbereiten = k => k && ({
    i: k.i, j: k.j, bilder: k.L, laenge_s: r3(k.L / fps), von_s: r3(k.i / fps), bis_s: r3(k.j / fps),
    dd: r3(k.dd), geglaettet: k.geglaettet,
    sprung: r3(d(k.j - 1, k.i)), quotient: r3(d(k.j - 1, k.i) / Math.max(p95, 0.5)),
    anteil_bloecke: r3(anteil(k.j - 1, k.i)),     // Flaeche des Sprungs: Anteil der Bloecke > 20 (Flaechentausch, s. vorschlagen)
    vorlauf_s: r3(k.i / fps), nachlauf_s: r3((N - k.j) / fps),
  });
  return {
    Lmin, Lmax, bester: aufbereiten(best),
    /* nur zum Vergleich: der Schnitt mit dem kleinsten tatsaechlichen Sprung d(j-1, i), ohne Glaettung -
     * blind fuer die Bewegungsrichtung, darum nicht die Wahl */
    kleinster_sprung: aufbereiten(bestSprung),
    landkarte: fenster.map(f => ({ fenster: `${f.von_s}-${f.bis_s} s`, ...(f.best ? aufbereiten(f.best) : { leer: true }) })),
  };
}

/* Globale Bewegung: Grauwert, Paare mit Abstand 15, bester ganzzahliger Versatz in +-12 px und
 * Massstab 0,96..1,04 um die Bildmitte. Grob-fein: Versatz im 2er-Raster, dann +-1, dann Massstab. */
function globaleBewegung(bilder, W, H, fps) {
  const N = bilder.length, ABST = 15, R = 12;
  if (N <= ABST) return null;
  const grau = k => { const A = bilder[k], g = new Float32Array(W * H); for (let p = 0, o = 0; p < W * H; p++, o += 3) g[p] = 0.299 * A[o] + 0.587 * A[o + 1] + 0.114 * A[o + 2]; return g; };
  const cx = (W - 1) / 2, cy = (H - 1) / 2, SCHRITT = 2;
  function fehler(G0, G1, dx, dy, s) {
    let sum = 0, n = 0;
    for (let y = R; y < H - R; y += SCHRITT) {
      const yy = Math.round(cy + (y - cy) * s + dy);
      if (yy < 0 || yy >= H) continue;
      for (let x = R; x < W - R; x += SCHRITT) {
        const xx = Math.round(cx + (x - cx) * s + dx);
        if (xx < 0 || xx >= W) continue;
        const v = G0[y * W + x] - G1[yy * W + xx]; sum += v < 0 ? -v : v; n++;
      }
    }
    return n ? sum / n : Infinity;
  }
  const PAARE = 8, paare = [];
  for (let q = 0; q < PAARE; q++) {
    const a = Math.round(q * (N - 1 - ABST) / (PAARE - 1)), G0 = grau(a), G1 = grau(a + ABST);
    const e0 = fehler(G0, G1, 0, 0, 1);
    let b = { dx: 0, dy: 0, s: 1, e: e0 };
    for (let dy = -R; dy <= R; dy += 2) for (let dx = -R; dx <= R; dx += 2) { const e = fehler(G0, G1, dx, dy, 1); if (e < b.e) b = { dx, dy, s: 1, e }; }
    const g = { ...b };
    for (let dy = g.dy - 1; dy <= g.dy + 1; dy++) for (let dx = g.dx - 1; dx <= g.dx + 1; dx++) { if (Math.abs(dx) > R || Math.abs(dy) > R) continue; const e = fehler(G0, G1, dx, dy, 1); if (e < b.e) b = { dx, dy, s: 1, e }; }
    const v = { ...b };
    for (const s of [0.96, 0.98, 1.02, 1.04]) for (let dy = v.dy - 2; dy <= v.dy + 2; dy++) for (let dx = v.dx - 2; dx <= v.dx + 2; dx++) { const e = fehler(G0, G1, dx, dy, s); if (e < b.e) b = { dx, dy, s, e }; }
    paare.push({ bild: a, dx: b.dx, dy: b.dy, massstab: b.s, fehler_ohne: r3(e0), fehler_mit: r3(b.e), gewinn: r3(e0 > 0 ? 1 - b.e / e0 : 0) });
  }
  const proS = fps / ABST;
  const mx = paare.reduce((s, p) => s + p.dx, 0) / paare.length, my = paare.reduce((s, p) => s + p.dy, 0) / paare.length;
  const betr = paare.map(p => Math.hypot(p.dx, p.dy));
  const mittelBetrag = betr.reduce((s, x) => s + x, 0) / betr.length;
  return {
    paare,
    verschiebung_px_s: r3(median(betr) * proS),                       // auf der Rechengroesse (lange Seite 256)
    verschiebung_prozent_s: r3(median(betr) * proS / Math.max(W, H) * 100),
    richtung_px_s: [r3(mx * proS), r3(my * proS)],
    richtungstreue: r3(mittelBetrag > 0 ? Math.hypot(mx, my) / mittelBetrag : 0),   // 1 = alle Paare gleichgerichtet
    zoom_prozent_s: r3(median(paare.map(p => (p.massstab - 1) * 100)) * proS),
    gewinn_median: r3(median(paare.map(p => p.gewinn))),
  };
}

/* ---------- Kontaktbogen: 5x7-Schrift und PNG ---------- */
const SCHRIFT = {
  A: '01110100011000111111100011000110001', B: '11110100011000111110100011000111110', C: '01110100011000010000100001000101110',
  D: '11110100011000110001100011000111110', E: '11111100001000011110100001000011111', F: '11111100001000011110100001000010000',
  G: '01110100011000010111100011000101111', H: '10001100011000111111100011000110001', I: '01110001000010000100001000010001110',
  J: '00111000100001000010000101001001100', K: '10001100101010011000101001001010001', L: '10000100001000010000100001000011111',
  M: '10001110111010110101100011000110001', N: '10001100011100110101100111000110001', O: '01110100011000110001100011000101110',
  P: '11110100011000111110100001000010000', Q: '01110100011000110001101011001001101', R: '11110100011000111110101001001010001',
  S: '01111100001000001110000010000111110', T: '11111001000010000100001000010000100', U: '10001100011000110001100011000101110',
  V: '10001100011000110001100010101000100', W: '10001100011000110101101011010101010', X: '10001100010101000100010101000110001',
  Y: '10001100010101000100001000010000100', Z: '11111000010001000100010001000011111',
  0: '01110100011001110101110011000101110', 1: '00100011000010000100001000010001110', 2: '01110100010000100010001000100011111',
  3: '11111000100010000010000011000101110', 4: '00010001100101010010111110001000010', 5: '11111100001111000001000011000101110',
  6: '00110010001000011110100011000101110', 7: '11111000010001000100010000100001000', 8: '01110100011000101110100011000101110',
  9: '01110100011000101111000010001001100', '.': '00000000000000000000000000110001100', '/': '00000000010001000100010001000000000',
  '-': '00000000000000011111000000000000000', '=': '00000000001111100000111110000000000', ':': '00000011000110000000011000110000000',
  '[': '01110010000100001000010000100001110', ')': '01000001000001000010000100010001000', '(': '00010001000100001000010000010000010',
  '#': '01010010101111101010111110101001010', '<': '00010001000100010000010000010000010', '>': '01000001000001000001000100010001000',
  ' ': '00000000000000000000000000000000000',
};
function schreibe(bild, BW, BH, text, x0, y0, skala, farbe) {
  let x = x0;
  for (const zeichen of String(text).toUpperCase()) {
    const g = SCHRIFT[zeichen] || SCHRIFT[' '];
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) {
      if (g[r * 5 + c] !== '1') continue;
      for (let sy = 0; sy < skala; sy++) for (let sx = 0; sx < skala; sx++) {
        const px = x + c * skala + sx, py = y0 + r * skala + sy;
        if (px < 0 || py < 0 || px >= BW || py >= BH) continue;
        const o = (py * BW + px) * 3; bild[o] = farbe[0]; bild[o + 1] = farbe[1]; bild[o + 2] = farbe[2];
      }
    }
    x += 6 * skala;
  }
}
function pngSchreiben(datei, rgb, W, H) {
  const roh = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) { roh[y * (W * 3 + 1)] = 0; Buffer.from(rgb.buffer, rgb.byteOffset + y * W * 3, W * 3).copy(roh, y * (W * 3 + 1) + 1); }
  const stueck = (typ, daten) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(daten.length);
    const td = Buffer.concat([Buffer.from(typ, 'ascii'), daten]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  fs.writeFileSync(datei, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), stueck('IHDR', ihdr), stueck('IDAT', zlib.deflateSync(roh, { level: 9 })), stueck('IEND', Buffer.alloc(0))]));
}
function kontaktbogen(datei, bilder, W, H, fps, eintraege, kopf) {
  const KH = 200, KW = Math.max(1, Math.round(W * KH / H)), SPALT = 6, RAND = 8, KOPF = 22, FUSS = 34;
  const BW = RAND * 2 + eintraege.length * KW + (eintraege.length - 1) * SPALT, BH = RAND + KOPF + KH + FUSS + RAND;
  const bogen = new Uint8Array(BW * BH * 3);
  for (let o = 0; o < bogen.length; o += 3) { bogen[o] = 17; bogen[o + 1] = 17; bogen[o + 2] = 20; }
  schreibe(bogen, BW, BH, kopf, RAND, RAND + 2, 1, [200, 200, 210]);
  eintraege.forEach((e, n) => {
    const A = bilder[e.bild], ox = RAND + n * (KW + SPALT), oy = RAND + KOPF;
    for (let y = 0; y < KH; y++) {                  // Flaechenmittel beim Verkleinern
      const sy0 = Math.floor(y * H / KH), sy1 = Math.max(sy0 + 1, Math.floor((y + 1) * H / KH));
      for (let x = 0; x < KW; x++) {
        const sx0 = Math.floor(x * W / KW), sx1 = Math.max(sx0 + 1, Math.floor((x + 1) * W / KW));
        let r = 0, g = 0, b = 0, c = 0;
        for (let yy = sy0; yy < sy1; yy++) for (let xx = sx0; xx < sx1; xx++) { const o = (yy * W + xx) * 3; r += A[o]; g += A[o + 1]; b += A[o + 2]; c++; }
        const o = ((oy + y) * BW + ox + x) * 3; bogen[o] = r / c; bogen[o + 1] = g / c; bogen[o + 2] = b / c;
      }
    }
    const farbe = e.schnitt ? [255, 200, 90] : [230, 230, 235];
    schreibe(bogen, BW, BH, e.name, ox, oy + KH + 4, 2, farbe);
    schreibe(bogen, BW, BH, `#${e.bild} ${(e.bild / fps).toFixed(2)}S`, ox, oy + KH + 22, 1, [170, 170, 180]);
  });
  pngSchreiben(datei, bogen, BW, BH);
}

async function videoRechnen(auftrag) {
  const t0 = Date.now();
  const info = sonde(auftrag.pfad);
  const langeBreite = info.breite >= info.hoehe;
  const W = langeBreite ? LANGE_SEITE : Math.round(LANGE_SEITE * info.breite / info.hoehe / 2) * 2;
  const H = langeBreite ? Math.round(LANGE_SEITE * info.hoehe / info.breite / 2) * 2 : LANGE_SEITE;
  const bilder = await dekodieren(auftrag.pfad, W, H);
  const N = bilder.length, fps = info.fps;
  const { d, dMittel, anteil, zaehlerStand, nbx, nby } = abstandsRechner(bilder, W, H);

  const wechsel = []; for (let i = 0; i + 1 < N; i++) wechsel.push(d(i, i + 1));
  const p95 = perzentil(wechsel, 0.95), med = median(wechsel);
  const nahtRoh = d(N - 1, 0);
  const zeitkurve = {}, zeitkurveMittel = {};
  for (const tau of TAUS) {
    if (tau >= N) break;
    const w = [], wm = [];
    for (let i = 0; i + tau < N; i++) { w.push(d(i, i + tau)); wm.push(dMittel(i, i + tau)); }
    zeitkurve[tau] = r3(median(w)); zeitkurveMittel[tau] = r3(median(wm));
  }

  /* Harte Schnitte: ein Schnitt tauscht den Inhalt in einem einzigen Bildwechsel - er ist ein
   * vereinzelter Ausreisser, nicht nur ein grosser Wert (schnelle Bewegung ist ueber mehrere Wechsel
   * gross). Schwelle: > max(20, 5 x Median der echten Wechsel) UND > 2,5 x der groessere Nachbarwechsel.
   * Doppelbilder (c < 0,5, etwa 12 fps in 24 fps verpackt) zaehlen dabei nicht: sie druecken den Median
   * und machen jeden echten Wechsel zum scheinbaren Einzelausreisser - Nachbar ist darum der naechste
   * echte Wechsel je Seite. Und ein Schnitt tauscht die Flaeche: >= 30 % der Bloecke weichen um mehr als
   * 20 ab - sonst ist es ein oertliches Aufflackern (Kerzenflamme, Blitz im Bildteil). */
  const GLEICH = 0.5;
  const echte = wechsel.filter(c => c >= GLEICH), medEcht = median(echte) ?? 0;
  const nachbar = (i, schritt) => { for (let k = i + schritt; k >= 0 && k < wechsel.length; k += schritt) if (wechsel[k] >= GLEICH) return wechsel[k]; return 0; };
  /* Aufblitzen statt Schnitt: kehrt das Bild innerhalb von 3 Bildern zurueck (d(i, i+k) oder d(i-1, i+k)
   * unter der Haelfte des Sprungs), war es ein Blitz - Inhalt vorher und nachher gleich. */
  const schnitte = [], blitze = [];
  for (let i = 0; i < wechsel.length; i++) {
    const c = wechsel[i], nb = Math.max(nachbar(i, -1), nachbar(i, 1));
    const flaeche = anteil(i, i + 1);
    if (!(c > Math.max(20, 5 * medEcht) && c > 2.5 * nb && flaeche >= 0.3)) continue;
    let rueck = Infinity;
    for (let k = 2; k <= 4 && i + k < N; k++) { rueck = Math.min(rueck, d(i, i + k)); if (i > 0) rueck = Math.min(rueck, d(i - 1, i + k)); }
    const eintrag = { nach_bild: i, zeit_s: r3((i + 1) / fps), d: r3(c), faktor_median: r3(c / Math.max(medEcht, 0.01)), anteil_bloecke: r3(flaeche), rueckkehr_d: r3(rueck) };
    (rueck < 0.5 * c ? blitze : schnitte).push(eintrag);
  }
  const gleichbilder = wechsel.filter(c => c < 0.5).length;

  const anteilP95 = perzentil(wechsel.map((_, i) => anteil(i, i + 1)), 0.95);
  const suche = nahtsuche(N, fps, d, p95, anteil);
  const bewegung = globaleBewegung(bilder, W, H, fps);

  const b = suche.bester;
  const auswahl = [
    { name: 'START', bild: 0 }, { name: '1/3', bild: Math.round((N - 1) / 3) }, { name: '2/3', bild: Math.round(2 * (N - 1) / 3) },
    { name: 'ENDE', bild: N - 1 }, { name: 'I', bild: b.i, schnitt: true }, { name: 'J-1', bild: b.j - 1, schnitt: true },
  ];
  const bildDatei = `${auftrag.id}-${auftrag.datei.replace(/\.mp4$/, '')}.png`;
  kontaktbogen(path.join(BILDER, bildDatei), bilder, W, H, fps, auswahl,
    `Q ROH ${(nahtRoh / Math.max(p95, 0.5)).toFixed(2)}   Q SCHNITT ${b.quotient.toFixed(2)} [${b.von_s.toFixed(2)}S ${b.bis_s.toFixed(2)}S)   P95 ${p95.toFixed(1)}   ${auftrag.datei.replace(/\.mp4$/, '')}`);

  return {
    rechen_fassung: RECHEN_FASSUNG,
    quelle: { breite: info.breite, hoehe: info.hoehe, fps: r3(fps), bilder_meta: info.bilderMeta, dauer_meta_s: r3(info.dauer) },
    rechengroesse: { breite: W, hoehe: H, bloecke: `${nbx}x${nby}` },
    bilder: N, dauer_s: r3(N / fps),
    bildwechsel: { median: r3(med), median_ohne_doppelbilder: r3(medEcht), p95: r3(p95), max: r3(Math.max(...wechsel)), gleichbilder, anteil_p95: r3(anteilP95) },
    naht_roh: r3(nahtRoh), quotient_roh: r3(nahtRoh / Math.max(p95, 0.5)),
    zeitkurve, zeitkurve_mittel: zeitkurveMittel,
    /* Schlussbild wiederholt Bild 0: der Sprung N-1 -> 0 ist kleiner als ein halber gewoehnlicher
     * Wechsel. Dann ist [0, N-1) der vorgesehene Loop, und alle N Bilder zu loopen hiesse ein Doppelbild */
    schlussbild_wiederholt_anfang: nahtRoh < 0.5 * medEcht,
    quotient_normaler_wechsel: r3(medEcht / Math.max(p95, 0.5)),
    schnitte, blitze,
    nahtsuche: suche,
    bewegung,
    kontaktbogen: 'bilder/' + bildDatei,
    rechenzeit_s: r3((Date.now() - t0) / 1000), abstaende_gerechnet: zaehlerStand(),
  };
}

if (!isMainThread) {
  parentPort.on('message', async auftrag => {
    try { parentPort.postMessage({ id: auftrag.schluessel, ergebnis: await videoRechnen(auftrag) }); }
    catch (e) { parentPort.postMessage({ id: auftrag.schluessel, fehler: String(e && e.stack || e) }); }
  });
}

/* ======================================================================================
 * Urteil (Hauptfaden): Klasse und Vorschlag aus den Rohkennzahlen
 * ==================================================================================== */

/* Schwellen - Begruendung steht in SCHWELLEN_TEXT und landet in ergebnis.json / tabellen.md */
const SCHWELLE = {
  standbild_median: 3.0,     // Median d(i,i+1) darunter: kaum mehr als Kodierrauschen im Block-Maximum
  standbild_Dmax: 8,         // ... und in keinem Abstand tau weicht ein Block im Median um mehr als 8/255 ab
  fahrt_prozent_s: 1.5,      // globale Verschiebung >= 1,5 % der langen Seite je Sekunde
  fahrt_zoom_s: 3.0,         // oder Massstab aendert sich >= 3 % je Sekunde (Median-Massstab mind. 1,02 je 15 Bilder)
  fahrt_zoom_treue: 0.75,    // und >= 75 % der Paare zoomen in dieselbe Richtung
  fahrt_gewinn: 0.08,        // Ausrichten muss den Grauwertfehler um >= 8 % senken (ruhende Bilder: exakt 0)
  fahrt_treue: 0.6,          // und die Verschiebung muss ueber die Paare gleichgerichtet sein
  stationaer: 1.5,           // S (Bildmittel-Kurve, Spitze ab tau 15 / D(15)) darunter: Textur, darueber: Mikrohandlung
  q_unsichtbar: 1, q_neutral: 2,
  tausch_anteil: 0.5,        // Naht mit >= 50 % springender Bloecke (> 20) ...
  tausch_faktor: 2,          // ... und >= 2 x Flaeche des p95-Bildwechsels: neues Bild -> Ereignis (Begruendung in vorschlagen)
};

function klassifizieren(r) {
  const z = r.zeitkurve_mittel, taus = Object.keys(z).map(Number);
  const tauMax = Math.max(...taus);
  const D15 = z[15] ?? null, Dmax = z[tauMax];
  const DSpitze = Math.max(...taus.filter(t => t >= 15).map(t => z[t]));
  /* S nimmt die Spitze ueber tau >= 15, nicht nur D(tau_max): ein Video, das nach 60 Bildern weit weg
   * und nach 120 wieder nahe am Anfang ist (Pendel, Kreisbewegung), ist nicht stationaer */
  const S = D15 ? DSpitze / Math.max(D15, 0.5) : null;
  const periodisch = DSpitze > 0 && Dmax < 0.7 * DSpitze;
  const bw = r.bewegung;
  const zoomTreue = bw ? (() => { const vz = Math.sign(bw.zoom_prozent_s); return vz ? bw.paare.filter(p => Math.sign(p.massstab - 1) === vz).length / bw.paare.length : 0; })() : 0;
  const fahrt = bw && bw.gewinn_median >= SCHWELLE.fahrt_gewinn &&
    ((bw.verschiebung_prozent_s >= SCHWELLE.fahrt_prozent_s && bw.richtungstreue >= SCHWELLE.fahrt_treue) ||
     (Math.abs(bw.zoom_prozent_s) >= SCHWELLE.fahrt_zoom_s && zoomTreue >= SCHWELLE.fahrt_zoom_treue));
  let klasse;
  if (r.schnitte.length) klasse = 'mit Schnitten';
  else if (r.bildwechsel.median < SCHWELLE.standbild_median && Math.max(...Object.values(r.zeitkurve)) < SCHWELLE.standbild_Dmax) klasse = 'Standbild-nah';
  else if (fahrt) klasse = 'Kamerafahrt';
  else if (S != null && S < SCHWELLE.stationaer) klasse = 'Textur';
  else klasse = 'Mikrohandlung';
  return { klasse, stationaritaet: r3(S), stationaritaet_tau_max: r3(D15 ? Dmax / Math.max(D15, 0.5) : null), periodisch, tau_max: tauMax, D15: D15, D_tau_max: Dmax, D_spitze: DSpitze, zoom_treue: r3(zoomTreue), fahrt: !!fahrt };
}

function vorschlagen(r, k) {
  const b = r.nahtsuche.bester, q = b.quotient;
  const schnitt = `[${b.von_s.toFixed(2)} s, ${b.bis_s.toFixed(2)} s)`;
  const reserve = Math.min(b.vorlauf_s, b.nachlauf_s);       // Material vor i und nach j
  const mischD = r3(2 * reserve);                            // groesstes D eines mischenden Uebergangs
  let stufe = q < SCHWELLE.q_unsichtbar ? 'keiner' : q <= SCHWELLE.q_neutral ? 'Neutralzustand' : 'Ereignis';
  /* Flaechentausch hebt auf "Ereignis" (Pruefung am Kontaktbogen, 15.09.2026): das Block-Maximum saettigt
   * bei viel Bewegung - p95 liegt dann bei 50-100 von 255, und ein Sprung auf ein ganz anderes Bild
   * erreicht nur 1,2-1,7 x p95. Gesehen: "Ich, Thiel" (Totale mit Zug -> Grossaufnahme Junge, q 1,70),
   * "Auf ganzer Linie" (Taxi am Zug -> Luftbild Dorf, q 1,36), "Das Bild - Ich komme" (Tuer -> Bett,
   * q 1,65), "Waifu" (Handschlag -> Paar geht weg, q 1,39) - alle als Neutralzustand eingestuft, am Bild
   * eindeutig ein neues Bild. Wie beim harten Schnitt zaehlt darum die Flaeche: weichen >= 50 % der
   * Bloecke um mehr als 20 ab UND ist das >= 2 x so viel Flaeche wie beim 95. Perzentil der normalen
   * Bildwechsel, ist die Naht ein Schnitt auf ein anderes Bild. Alle schon als Ereignis erkannten
   * Flaechenspruenge (Erlkoenig 0,55, Testosteron 0,52, Dopamier 0,58, Glut 0,72, Labskaus 0,77, "Ich dreh
   * mich nicht um" 0,96) liegen darueber; perfekte Nahten liegen bei 0-0,1. 0,3 (die Schnitt-Schwelle)
   * waere zu scharf: Lenore 0,33 und Electric rain 0,33 sind Lichtwechsel bzw. Galopp-Versatz, sichtbar,
   * aber kein neues Bild. */
  const flaeche = b.anteil_bloecke, flaecheNormal = r.bildwechsel.anteil_p95 ?? 0;
  const flaechentausch = flaeche != null && flaeche >= SCHWELLE.tausch_anteil && flaeche >= SCHWELLE.tausch_faktor * flaecheNormal;
  const angehoben = flaechentausch && stufe !== 'Ereignis';
  if (angehoben) stufe = 'Ereignis';
  const innereSchnitte = r.schnitte.filter(s => s.nach_bild >= b.i && s.nach_bild + 1 < b.j);
  let text;
  if (stufe === 'keiner') {
    text = `Naht unsichtbar: Schnitt ${schnitt}, kein Uebergang`;
  } else if (stufe === 'Neutralzustand') {
    const welcher = {
      'Textur': 'Nebel als Medium (Filmnebel) oder Unschaerfe',
      'Standbild-nah': 'Unschaerfe oder Nebel; eigentlich kein Nahtproblem - die Effekte tragen die Bewegung',
      'Mikrohandlung': 'sin²-Abbremsen zur Naht (§6.4), dort Unschaerfe oder Schwarz zwischen zwei Standbildern; kein Pendel',
      'Kamerafahrt': 'Zoom bis zur Textur oder Whip Pan in Fahrtrichtung',
      'mit Schnitten': 'Unschaerfe oder Blitz; das Video hat eigene Schnitte, die Naht faellt als weiterer Schnitt kaum auf',
    }[k.klasse];
    text = `Neutralzustand: ${welcher}. Schnitt ${schnitt}`;
  } else {
    const welcher = {
      'Textur': 'harte Taktnaht: Schnitt auf der Eins plus 2-3 Bilder Blitz',
      'Standbild-nah': 'harte Taktnaht: Schnitt auf der Eins plus 2-3 Bilder Blitz (Sprung bei kaum Bewegung - Blende wuerde als Geist stehen)',
      'Mikrohandlung': 'Mikrohandlung §6.4: sin²-Abbremsen zur Naht, Blende zwischen zwei Standbildern; alternativ harte Taktnaht mit Blitz; kein Pendel',
      'Kamerafahrt': 'harte Taktnaht mit Blitz oder Whip Pan in Fahrtrichtung - die Fahrt kehrt nicht zum Anfang zurueck',
      'mit Schnitten': 'harte Taktnaht: Schnitt auf der Eins plus 2-3 Bilder Blitz - passt zur Schnittsprache des Videos',
    }[k.klasse];
    text = `Ereignis: ${welcher}. Schnitt ${schnitt}`;
  }
  const hinweise = [];
  if (angehoben) hinweise.push(`Flaechentausch: ${Math.round(flaeche * 100)} % der Bloecke springen (normal p95 ${Math.round(flaecheNormal * 100)} %) - Quotient ${q} unterschaetzt die Naht, weil das Block-Maximum bei p95 ${r.bildwechsel.p95} saettigt; darum Ereignis`);
  if (r.schlussbild_wiederholt_anfang) hinweise.push(`Schlussbild ${r.bilder - 1} wiederholt Bild 0 (Sprung ${r.naht_roh} gegen Median-Wechsel ${r.bildwechsel.median_ohne_doppelbilder}): der vorgesehene Loop ist [0, ${r.bilder - 1}) = ${r3((r.bilder - 1) / r.quelle.fps)} s` + (b.i === 0 && b.j === r.bilder - 1 ? ' - genau den hat die Nahtsuche gewaehlt' : ''));
  if (k.klasse === 'Kamerafahrt') hinweise.push(`Kamerafahrt (${r.bewegung.verschiebung_prozent_s} %/s, Zoom ${r.bewegung.zoom_prozent_s} %/s): ` + (stufe === 'keiner' ? 'die Fahrt kehrt im Schnitt zum Anfang zurueck (Loop-Fahrt)' : 'die Fahrt kehrt nicht zum Anfang zurueck') + ', Pendel waere eine sichtbare Umkehr');
  if (innereSchnitte.length) hinweise.push(`Schnitt enthaelt ${innereSchnitte.length} harte(n) Schnitt(e) im Video bei ${innereSchnitte.map(s => s.zeit_s + ' s').join(', ')}`);
  if (stufe !== 'keiner') {
    if (mischD >= 0.5) hinweise.push(`<=10 s: mischender Uebergang moeglich bis D = ${mischD} s (Material ${b.vorlauf_s} s vor, ${b.nachlauf_s} s nach dem Schnitt)`);
    else hinweise.push(`<=10 s: kein Material ueber den Schnitt hinaus (${b.vorlauf_s} s / ${b.nachlauf_s} s) - nur Neutralzustand oder Blitz, kein mischender Uebergang`);
  }
  return { stufe, text, hinweise, misch_d_max_s: mischD, flaechentausch: !!flaechentausch, angehoben };
}

const KENNZAHLEN_TEXT = `d(a,b): Bilder auf Rechengroesse (lange Seite 256, Seitenverhaeltnis erhalten, ffmpeg scale flags=area), rgb24. Bild in etwa 16x16 px grosse Bloecke geteilt (Anzahl = round(Kante/16), Grenzen gleichmaessig). Je Block m = Summe |R_a-R_b|+|G_a-G_b|+|B_a-B_b| / (3 * Pixel im Block); d = Maximum ueber alle Bloecke (0..255). Wie VIDEO-PLAN §6.5 und labor/nahtpruefung: das Maximum misst Sichtbarkeit, das Bildmittel nur Flaeche.
Bildwechsel c_i = d(i,i+1), i = 0..N-2. p95 = 95. Perzentil der c_i (linear interpoliert); median = Median der c_i = Bewegungsenergie.
naht_roh = d(N-1, 0) (Sprung beim Loopen des ganzen Videos). quotient_roh = naht_roh / max(p95, 0.5). Unter 1 unsichtbar (§6.5). Erwartungswert daneben: quotient_normaler_wechsel = median_ohne_doppelbilder / max(p95, 0.5) - so gross ist der Quotient eines ganz gewoehnlichen Bildwechsels; eine perfekte Naht liegt dort, nicht bei 0. Ein Quotient weit darunter (naht_roh < 0,5 * Median, schlussbild_wiederholt_anfang) ist ein Doppelbild an der Naht: das Schlussbild ist das Anfangsbild, Loopen aller N Bilder ruckt um ein Standbild, der eigentliche Loop ist [0, N-1).
Nahtsuche (§6.1, Video Textures): Clip [i, j), Laenge L = j-i Bilder mit ceil(4 fps) <= L <= min(floor(10 fps), N). Kosten dd(i,j) = (1*d(i-1,j-1) + 2*d(i,j) + 1*d(i+1,j+1)) / Gewichtssumme der gueltigen Terme (Indizes in 0..N-1) - Bild i soll dem natuerlichen Nachfolger j von j-1 gleichen, und die Nachbarn mit, damit die Bewegungsrichtung zaehlt. Hat (i=0, j=N) keinen gueltigen Term, zaehlt d(N-1,0). Minimum von dd, bei Gleichstand die laengere Laenge. quotient_bester_schnitt = d(j-1, i) / max(p95, 0.5) - der Sprung, den man beim Abspielen des Clips sieht. landkarte: dasselbe Minimum je 1-s-Fenster der Clip-Laenge (4-5 ... 9-10 s, 10,0 s zaehlt ins letzte).
Zeitkurve D(tau) = Median ueber i von d(i, i+tau), tau = 1,2,4,8,15,30,60,120 Bilder (tau < N) - zeitkurve. Dieselbe Kurve mit dem Bildmittel statt dem Block-Maximum (Mittel ueber alle Bloecke) - zeitkurve_mittel. Stationaritaet S = max_{tau>=15} D_mittel(tau) / max(D_mittel(15), 0.5). Textur saettigt frueh und bleibt flach (S nahe 1), Mikrohandlung und Fahrt steigen weiter. Warum das Bildmittel: das Block-Maximum saettigt, sobald irgendein Block ganz wechselt (Median D(15) liegt bei 60-140 von 255), und macht dann auch eine hereinlaufende Figur flach - fuer Sichtbarkeit richtig, fuer Stationaritaet blind. Warum die Spitze statt D(120): eine Bewegung, die bei tau = 120 zurueckkehrt (periodisch: D(tau_max) < 0,7 * Spitze), ginge sonst als Textur durch.
Harte Schnitte: c_i > max(20, 5 * median_ohne_doppelbilder) UND c_i > 2,5 * max(naechster echter Wechsel links, rechts) UND >= 30 % der Bloecke weichen um mehr als 20 ab (anteil_bloecke). Ein Schnitt ist ein vereinzelter Ausreisser ueber die Flaeche; schnelle Bewegung ist ueber mehrere Wechsel gross (Nachbarkriterium), oertliches Flackern (Kerzenflamme) trifft wenige Bloecke (Flaechenkriterium). Echte Wechsel = c >= 0,5: Doppelbilder (12 fps in 24 fps verpackt) werden uebersprungen, sonst waere jeder echte Wechsel zwischen zwei Doppelbildern ein Ausreisser. Die 20 (von 255) verhindert, dass bei fast stehenden Bildern ein Kodier-Schluesselbild zaehlt. Kehrt das Bild innerhalb von 2-4 Bildern zurueck (min d(i,i+k), d(i-1,i+k) < 0,5 * c), ist es ein Blitz (blitze), kein Schnitt.
Globale Bewegung: 8 gleichverteilte Bildpaare (a, a+15), Grauwert, jedes 2. Pixel, Rand 12 px ausgespart. Bester ganzzahliger Versatz dx,dy in +-12 px (2er-Raster, dann +-1 verfeinert), danach Massstab 0,96/0,98/1,02/1,04 um die Mitte mit Versatz +-2. gewinn = 1 - Fehler_ausgerichtet/Fehler_unverschoben. verschiebung_px_s = Median |(dx,dy)| * fps/15 (Rechengroesse), verschiebung_prozent_s = das in % der langen Seite; zoom_prozent_s = Median (Massstab-1)*100*fps/15; richtungstreue = |mittlerer Vektor| / mittlerer Betrag.
gleichbilder = Anzahl c_i < 0,5 (doppelte Bilder). anteil_bloecke (je Schnitt der Nahtsuche) = Anteil der Bloecke mit m > 20 im Sprung d(j-1,i); bildwechsel.anteil_p95 = 95. Perzentil desselben Anteils ueber die Bildwechsel c_i.`;

const SCHWELLEN_TEXT = `Klasse, in dieser Reihenfolge:
1. "mit Schnitten": mindestens ein harter Schnitt (Kriterium oben) im Video.
2. "Standbild-nah": median c < ${SCHWELLE.standbild_median} UND fuer jedes tau D(tau) < ${SCHWELLE.standbild_Dmax} (Block-Maximum). Kodierrauschen allein liefert im Block-Maximum etwa 1-2; bleibt auch ueber 5 s jeder Block im Median unter 8/255, bewegt sich nichts sichtbar.
3. "Kamerafahrt": gewinn_median >= ${SCHWELLE.fahrt_gewinn} UND ((verschiebung >= ${SCHWELLE.fahrt_prozent_s} %/s der langen Seite UND richtungstreue >= ${SCHWELLE.fahrt_treue}) ODER (|zoom| >= ${SCHWELLE.fahrt_zoom_s} %/s UND >= ${SCHWELLE.fahrt_zoom_treue * 100} % der Paare zoomen gleichsinnig)). Ruhende Bilder haben gewinn exakt 0 (bester Versatz 0); Textur mit lokaler Bewegung findet Versaetze, aber ohne Richtungstreue; 1,5 %/s heisst ueber 10 s 15 % der Bildkante, 3 %/s Zoom ist die kleinste Stufe (Massstab 1,02 je 15 Bilder bei 24 fps) - die Fahrt kann dann nicht zum Anfang zurueck.
4. "Textur": S < ${SCHWELLE.stationaer} - das Bildmittel waechst nach 15 Bildern (0,6 s) um weniger als die Haelfte: stationaerer Prozess. Die Verteilung von S ist stetig (1,0 ... 8,3, Median etwa 1,8); 1,5 trennt am Kontaktbogen geprueft Dampf, Schnee, Glut (1,0-1,45) von hereinlaufenden Figuren und Gesichtsbewegung (ab etwa 1,6). Grenzfaelle 1,4-1,6 sind unsicher.
5. "Mikrohandlung": sonst - der Abstand waechst mit tau weiter, das Video entwickelt sich (Handlung, Veraenderung).
Vorschlag (§6.7): quotient_bester_schnitt < ${SCHWELLE.q_unsichtbar} keiner; ${SCHWELLE.q_unsichtbar}..${SCHWELLE.q_neutral} Neutralzustand; > ${SCHWELLE.q_neutral} Ereignis. Flaechentausch hebt auf Ereignis: springen an der Naht >= ${SCHWELLE.tausch_anteil * 100} % der Bloecke um mehr als 20 UND ist das >= ${SCHWELLE.tausch_faktor} x der Anteil beim 95. Perzentil der normalen Bildwechsel (bildwechsel.anteil_p95), ist die Naht ein Schnitt auf ein anderes Bild, auch wenn der Quotient klein bleibt - das Block-Maximum saettigt bei viel Bewegung (p95 50-100), am Kontaktbogen gesehen bei "Ich, Thiel", "Auf ganzer Linie", "Das Bild - Ich komme", "Waifu" (q 1,36-1,70, jeweils ein ganz anderes Bild). Mikrohandlung bekommt §6.4 (sin²-Abbremsen, Blende zwischen Standbildern, nie Pendel). <=10 s-Regel: ein mischender Uebergang der Laenge D braucht D/2 Material vor i und D/2 nach j; misch_d_max_s = 2*min(i, N-j)/fps. Neutralzustaende und Blitz brauchen nichts.`;

/* ======================================================================================
 * Hauptfaden
 * ==================================================================================== */

async function haupt() {
  const arg = {}; { const a = process.argv.slice(2); for (let i = 0; i < a.length; i++) { if (!a[i].startsWith('--')) continue; const k = a[i].slice(2); const v = (a[i + 1] && !a[i + 1].startsWith('--')) ? a[++i] : true; arg[k] = v; } }
  if (arg.hilfe || arg.help) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]); return; }
  const JOBS = Math.min(4, Math.max(1, +arg.jobs || 4));
  fs.mkdirSync(BILDER, { recursive: true }); fs.mkdirSync(CACHE, { recursive: true });

  const katalog = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(WURZEL, 'library/katalog.json.gz'))));
  const nur = typeof arg.nur === 'string' ? new Set(arg.nur.split(',')) : null;
  const auftraege = [];
  for (const id of fs.readdirSync(SONGS).sort()) {
    if (id.startsWith('.') || (nur && !nur.has(id))) continue;
    for (const datei of DATEIEN) {
      const pfad = path.join(SONGS, id, datei);
      if (!fs.existsSync(pfad)) continue;
      const st = fs.statSync(pfad);
      auftraege.push({ id, datei, pfad, schluessel: `${id}-${datei}`, groesse: st.size, mtime: st.mtimeMs,
        gruppe: datei === 'eigen.mp4' ? 'eigen' : datei === 'artwork.sprung.mp4' ? 'suno-sprung' : 'suno',
        titel: katalog.songs?.[id]?.titel ?? null });
    }
  }
  console.log(`${auftraege.length} Videos, ${JOBS} Arbeiter`);

  const ergebnisse = new Map(), offen = [];
  for (const a of auftraege) {
    const cf = path.join(CACHE, a.schluessel + '.json');
    if (!arg.neu && fs.existsSync(cf)) {
      try { const c = JSON.parse(fs.readFileSync(cf, 'utf8')); if (c.groesse === a.groesse && c.mtime === a.mtime && c.roh.rechen_fassung === RECHEN_FASSUNG && fs.existsSync(path.join(HIER, c.roh.kontaktbogen))) { ergebnisse.set(a.schluessel, c.roh); continue; } } catch { /* neu rechnen */ }
    }
    offen.push(a);
  }
  const tStart = Date.now();
  if (offen.length) {
    let naechster = 0, fertig = 0;
    await Promise.all(Array.from({ length: Math.min(JOBS, offen.length) }, () => new Promise((ok, fehl) => {
      const w = new Worker(fileURLToPath(import.meta.url));
      const schicke = () => { if (naechster >= offen.length) { w.terminate(); return ok(); } w.postMessage(offen[naechster++]); };
      w.on('message', m => {
        const a = auftraege.find(x => x.schluessel === m.id);
        fertig++;
        if (m.fehler) { console.error(`FEHLER ${m.id}: ${m.fehler}`); ergebnisse.set(m.id, { fehler: m.fehler }); }
        else {
          ergebnisse.set(m.id, m.ergebnis);
          fs.writeFileSync(path.join(CACHE, m.id + '.json'), JSON.stringify({ groesse: a.groesse, mtime: a.mtime, roh: m.ergebnis }));
          console.log(`[${fertig}/${offen.length}] ${m.id}  ${m.ergebnis.bilder} B  q_roh ${m.ergebnis.quotient_roh}  q_schnitt ${m.ergebnis.nahtsuche.bester.quotient}  ${m.ergebnis.rechenzeit_s} s`);
        }
        schicke();
      });
      w.on('error', fehl);
      schicke();
    })));
  }
  console.log(`gerechnet in ${((Date.now() - tStart) / 1000).toFixed(1)} s (${offen.length} neu, ${auftraege.length - offen.length} aus dem Cache)`);

  /* Urteil */
  const videos = [];
  for (const a of auftraege) {
    const r = ergebnisse.get(a.schluessel);
    if (!r || r.fehler) { videos.push({ id: a.id, datei: a.datei, gruppe: a.gruppe, titel: a.titel, fehler: r?.fehler ?? 'fehlt' }); continue; }
    const k = klassifizieren(r), v = vorschlagen(r, k);
    videos.push({ id: a.id, datei: a.datei, gruppe: a.gruppe, titel: a.titel, klasse: k.klasse, klassen_merkmale: k,
      quotient_roh: r.quotient_roh, quotient_bester_schnitt: r.nahtsuche.bester.quotient, vorschlag: v, ...r });
  }
  const ausgabe = { erzeugt: new Date().toISOString(), werkzeug: 'labor/videonaht/videonaht.mjs', kennzahlen: KENNZAHLEN_TEXT, schwellen: SCHWELLEN_TEXT, schwellenwerte: SCHWELLE, videos };
  fs.writeFileSync(path.join(HIER, 'ergebnis.json'), JSON.stringify(ausgabe, null, 1));
  fs.writeFileSync(path.join(HIER, 'tabellen.md'), statistik(videos));
  console.log('geschrieben: ergebnis.json, tabellen.md, bilder/');
}

function statistik(videos) {
  const ok = videos.filter(v => !v.fehler);
  const GRUPPEN = [['suno', 'Suno-Bewegtbild (artwork.mp4)'], ['suno-sprung', 'Suno, Sprungfassung (artwork.sprung.mp4)'], ['eigen', 'eigene Videos (eigen.mp4)']];
  const KLASSEN = ['Standbild-nah', 'Textur', 'Mikrohandlung', 'Kamerafahrt', 'mit Schnitten'];
  const STUFEN = ['keiner', 'Neutralzustand', 'Ereignis'];
  const FAECHER = [[0, 0.5], [0.5, 1], [1, 1.5], [1.5, 2], [2, 3], [3, 5], [5, 10], [10, Infinity]];
  const fach = q => FAECHER.findIndex(([u, o]) => q >= u && q < o);
  const zeilen = [];
  const z = s => zeilen.push(s);
  const fmt = x => x == null ? '-' : (Math.round(x * 100) / 100).toString().replace('.', ',');
  const gruppen = GRUPPEN.map(([g, name]) => [g, name, ok.filter(v => v.gruppe === g)]).filter(x => x[2].length);

  z('# Videonaht - Tabellen über alle Bewegtbilder (maschinell)');
  z('');
  z(`Erzeugt ${new Date().toISOString().slice(0, 16).replace('T', ' ')} von \`labor/videonaht/videonaht.mjs\`. ${ok.length} Videos` + (videos.length > ok.length ? `, ${videos.length - ok.length} mit Fehler` : '') + '. Methode: VIDEO-PLAN §2, §6.1, §6.3–6.5, §6.7. Formeln und Schwellen am Ende; alle Zahlen in `ergebnis.json`, Kontaktbögen in `bilder/`.');
  z('');
  z('## Klassen');
  z('');
  z('| Klasse | ' + gruppen.map(g => g[1]).join(' | ') + ' | gesamt |');
  z('|---|' + gruppen.map(() => '---:').join('|') + '|---:|');
  for (const k of KLASSEN) z(`| ${k} | ` + gruppen.map(g => g[2].filter(v => v.klasse === k).length).join(' | ') + ` | ${ok.filter(v => v.klasse === k).length} |`);
  z('');
  z('## Nahtquotient: ganzes Video geloopt gegen besten Schnitt');
  z('');
  for (const [, name, liste] of gruppen) {
    z(`**${name}** (${liste.length})`);
    z('');
    z('| Quotient | roh | bester Schnitt |');
    z('|---|---:|---:|');
    FAECHER.forEach(([u, o], n) => {
      const roh = liste.filter(v => fach(v.quotient_roh) === n).length, best = liste.filter(v => fach(v.quotient_bester_schnitt) === n).length;
      z(`| ${fmt(u)} … ${o === Infinity ? '∞' : fmt(o)} | ${roh} ${'█'.repeat(roh)} | ${best} ${'█'.repeat(best)} |`);
    });
    z('');
    z(`Median roh ${fmt(median(liste.map(v => v.quotient_roh)))}, Median bester Schnitt ${fmt(median(liste.map(v => v.quotient_bester_schnitt)))}; unter 1: roh ${liste.filter(v => v.quotient_roh < 1).length}, bester Schnitt ${liste.filter(v => v.quotient_bester_schnitt < 1).length}.`);
    const zuLang = liste.filter(v => v.bilder > v.nahtsuche.Lmax), schlechter = liste.filter(v => v.quotient_bester_schnitt > v.quotient_roh + 0.05);
    z('');
    z('');
    z(`Schlussbild wiederholt Bild 0 (Loop ist [0, N−1)): ${liste.filter(v => v.schlussbild_wiederholt_anfang).length}. Erwartungswert: Median des Quotienten eines gewöhnlichen Bildwechsels ${fmt(median(liste.map(v => v.quotient_normaler_wechsel)))} - eine perfekte Naht liegt dort, nicht bei 0.`);
    z(`Länger als 10 s (ganzes Video als Loop nicht erlaubt): ${zuLang.length}. Bester Schnitt sichtbarer als das rohe Video: ${schlechter.length}` + (schlechter.length ? `, davon ${schlechter.filter(v => v.bilder > v.nahtsuche.Lmax).length} zu lang` : '') + `. Kleinster tatsächlicher Sprung unter 1: ${liste.filter(v => v.nahtsuche.kleinster_sprung.quotient < 1).length}.`);
    z('');
  }
  z('## Welcher Übergang (§6.7: < 1 keiner, 1–2 Neutralzustand, > 2 Ereignis; Flächentausch ≥ 50 % hebt auf Ereignis)');
  z('');
  z(`Durch Flächentausch angehoben: ${ok.filter(v => v.vorschlag.angehoben).map(v => v.titel).join(', ') || 'keins'}.`);
  z('');
  z('| Stufe | ' + gruppen.map(g => g[1]).join(' | ') + ' | gesamt |');
  z('|---|' + gruppen.map(() => '---:').join('|') + '|---:|');
  for (const s of STUFEN) z(`| ${s} | ` + gruppen.map(g => g[2].filter(v => v.vorschlag.stufe === s).length).join(' | ') + ` | ${ok.filter(v => v.vorschlag.stufe === s).length} |`);
  z('');
  z('Stufe je Klasse (alle Gruppen):');
  z('');
  z('| Klasse | ' + STUFEN.join(' | ') + ' |');
  z('|---|' + STUFEN.map(() => '---:').join('|') + '|');
  for (const k of KLASSEN) z(`| ${k} | ` + STUFEN.map(s => ok.filter(v => v.klasse === k && v.vorschlag.stufe === s).length).join(' | ') + ' |');
  z('');
  const brauchen = ok.filter(v => v.vorschlag.stufe !== 'keiner');
  const ohneMaterial = brauchen.filter(v => v.vorschlag.misch_d_max_s < 0.5);
  z(`**≤ 10 s:** von ${brauchen.length} Videos mit Übergang haben ${ohneMaterial.length} kein Material über den Schnitt hinaus (mischende Übergänge dort unmöglich, nur Neutralzustand oder Blitz); Median des möglichen D der übrigen ${fmt(median(brauchen.filter(v => v.vorschlag.misch_d_max_s >= 0.5).map(v => v.vorschlag.misch_d_max_s)))} s.`);
  z('');
  z('## Länge des besten Schnitts');
  z('');
  z('| Länge | ' + gruppen.map(g => g[1]).join(' | ') + ' |');
  z('|---|' + gruppen.map(() => '---:').join('|') + '|');
  for (let s = MIN_S; s < MAX_S; s++) z(`| ${s}–${s + 1} s | ` + gruppen.map(g => g[2].filter(v => { const L = v.nahtsuche.bester.laenge_s; return L >= s && (L < s + 1 || (s === MAX_S - 1 && L <= MAX_S)); }).length).join(' | ') + ' |');
  z('');
  z('## Alle Videos');
  z('');
  z('| Titel | Datei | Klasse | Bilder | fps | q roh | q Schnitt | Schnitt | q kleinster Sprung | q normaler Wechsel | Schlussbild = Bild 0 | S | Median c | Schnitte | Stufe |');
  z('|---|---|---|---:|---:|---:|---:|---|---:|---:|---|---:|---:|---:|---|');
  for (const v of [...ok].sort((a, b) => a.gruppe.localeCompare(b.gruppe) || a.quotient_bester_schnitt - b.quotient_bester_schnitt)) {
    const b = v.nahtsuche.bester;
    z(`| ${String(v.titel ?? v.id).replace(/\|/g, '/')} | [${v.datei}](bilder/${path.basename(v.kontaktbogen)}) | ${v.klasse} | ${v.bilder} | ${fmt(v.quelle.fps)} | ${fmt(v.quotient_roh)} | ${fmt(v.quotient_bester_schnitt)} | ${fmt(b.von_s)}–${fmt(b.bis_s)} s | ${fmt(v.nahtsuche.kleinster_sprung.quotient)} | ${fmt(v.quotient_normaler_wechsel)} | ${v.schlussbild_wiederholt_anfang ? 'ja' : ''} | ${fmt(v.klassen_merkmale.stationaritaet)} | ${fmt(v.bildwechsel.median)} | ${v.schnitte.length} | ${v.vorschlag.stufe} |`);
  }
  for (const v of videos.filter(v => v.fehler)) z(`| ${v.titel ?? v.id} | ${v.datei} | FEHLER | | | | | | | | | | | | |`);
  z('');
  z('## Kennzahlen');
  z('');
  for (const absatz of KENNZAHLEN_TEXT.split('\n')) { z(absatz); z(''); }
  z('## Schwellen');
  z('');
  for (const absatz of SCHWELLEN_TEXT.split('\n')) { z(absatz); z(''); }
  return zeilen.join('\n');
}

if (isMainThread) haupt().catch(e => { console.error(e); process.exit(1); });
