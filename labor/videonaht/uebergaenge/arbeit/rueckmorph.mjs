#!/usr/bin/env node
// Rueckmorph-Probe fuer "Glut und Eis - Die Braut von Corinth" (Laborprobe, Anfrage Caspar_D 15.09.2026).
// Idee: das Video selbst kennt den Weg von Bild a nach Bild b-1 (Kette der Einzelfluesse).
// Am Loop-Ende wird dieser Weg in einem Fenster D rueckwaerts gemorpht, statt hart zu schneiden.
// Nur node (keine Pakete) + /usr/local/bin/ffmpeg. Aufruf: node rueckmorph.mjs [--nur-fluss] [--diagnose]
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { spawnSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '../../../..');
const ID = '89ef9f63-c885-4fe5-b082-8e2bf9513c4d';
const QUELLE = `${WURZEL}/library/songs/${ID}/artwork.sprung.mp4`;
const FFMPEG = '/usr/local/bin/ffmpeg';
const FFPROBE = '/usr/local/bin/ffprobe';
const OUT = path.resolve(HIER, '..');
const FPS = 24;
const CW = 320;          // Rechengroesse (Quelle 960x960 quadratisch)
const OW = 360;          // Kachelgroesse
const LEVELS = 4;        // 320, 160, 80, 40
const RADIUS = 5;        // Fenster 11x11
const ITER = 5;          // Iterationen je Ebene (Einzelschritt)
const ITER_DIREKT = 10;  // Iterationen je Ebene (direkter Fluss b-1 -> a)
const LAMBDA = 2;        // Tikhonov auf dem Strukturtensor (Grauwerte 0..255)
const FB_SCHWELLE = 1.0; // Vorwaerts-Rueckwaerts-Fehler in Rechenpixeln
const GLATT = 4;         // Glaettung (sigma, Rechenpixel) des nicht-affinen Anteils im Morph-Feld
const LOOPS = 3;
const ARBEITER = 8;
const CACHE = `${HIER}/rueckmorph-fluss.bin`;
const PARAM = JSON.stringify({ CW, LEVELS, RADIUS, ITER, LAMBDA, FB_SCHWELLE, v: 3 });

// ---------------------------------------------------------------- Bildwerkzeuge
function gauss(src, w, h, sigma) {
  const r = Math.max(1, Math.ceil(3 * sigma)), k = new Float32Array(2 * r + 1);
  let s = 0;
  for (let i = -r; i <= r; i++) { k[i + r] = Math.exp(-i * i / (2 * sigma * sigma)); s += k[i + r]; }
  for (let i = 0; i < k.length; i++) k[i] /= s;
  const t = new Float32Array(w * h), o = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let a = 0;
      for (let i = -r; i <= r; i++) { let xx = x + i; xx = xx < 0 ? 0 : xx >= w ? w - 1 : xx; a += k[i + r] * src[row + xx]; }
      t[row + x] = a;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let a = 0;
      for (let i = -r; i <= r; i++) { let yy = y + i; yy = yy < 0 ? 0 : yy >= h ? h - 1 : yy; a += k[i + r] * t[yy * w + x]; }
      o[y * w + x] = a;
    }
  }
  return o;
}

// Mittelwert ueber (2r+1)^2, am Rand auf den vorhandenen Teil normiert (laufende Summen, O(N))
function boxMean(src, w, h, r, out, tmp) {
  for (let y = 0; y < h; y++) {
    const row = y * w; let acc = 0;
    for (let x = 0; x <= Math.min(r, w - 1); x++) acc += src[row + x];
    for (let x = 0; x < w; x++) {
      const lo = Math.max(0, x - r), hi = Math.min(w - 1, x + r);
      tmp[row + x] = acc / (hi - lo + 1);
      if (x + r + 1 < w) acc += src[row + x + r + 1];
      if (x - r >= 0) acc -= src[row + x - r];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = 0; y <= Math.min(r, h - 1); y++) acc += tmp[y * w + x];
    for (let y = 0; y < h; y++) {
      const lo = Math.max(0, y - r), hi = Math.min(h - 1, y + r);
      out[y * w + x] = acc / (hi - lo + 1);
      if (y + r + 1 < h) acc += tmp[(y + r + 1) * w + x];
      if (y - r >= 0) acc -= tmp[(y - r) * w + x];
    }
  }
  return out;
}

function bil(img, w, h, x, y) {
  x = x < 0 ? 0 : x > w - 1 ? w - 1 : x; y = y < 0 ? 0 : y > h - 1 ? h - 1 : y;
  let x0 = x | 0, y0 = y | 0; if (x0 >= w - 1) x0 = w - 2; if (y0 >= h - 1) y0 = h - 2;
  const fx = x - x0, fy = y - y0, i = y0 * w + x0;
  return (img[i] * (1 - fx) + img[i + 1] * fx) * (1 - fy) + (img[i + w] * (1 - fx) + img[i + w + 1] * fx) * fy;
}

function down2(src, w, h) {
  const b = gauss(src, w, h, 1.0), w2 = w >> 1, h2 = h >> 1, o = new Float32Array(w2 * h2);
  for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) {
    const i = 2 * y * w + 2 * x; o[y * w2 + x] = 0.25 * (b[i] + b[i + 1] + b[i + w] + b[i + w + 1]);
  }
  return o;
}

function pyramide(g, w, h) {
  const p = [{ img: gauss(g, w, h, 0.7), w, h }];
  for (let l = 1; l < LEVELS; l++) { const q = p[l - 1]; p.push({ img: down2(q.img, q.w, q.h), w: q.w >> 1, h: q.h >> 1 }); }
  return p;
}

// Flussfeld (u,v) von (w1,h1) auf (w2,h2) umrechnen, Werte mitskalieren
function resample(u, v, w1, h1, w2, h2) {
  const s = w2 / w1, U = new Float32Array(w2 * h2), V = new Float32Array(w2 * h2);
  for (let y = 0; y < h2; y++) {
    const sy = (y + 0.5) / s - 0.5;
    for (let x = 0; x < w2; x++) {
      const sx = (x + 0.5) / s - 0.5;
      U[y * w2 + x] = s * bil(u, w1, h1, sx, sy); V[y * w2 + x] = s * bil(v, w1, h1, sx, sy);
    }
  }
  return [U, V];
}

// Pyramidales Lucas-Kanade, dicht: Fluss auf dem Gitter von P1, zeigt nach P2 (x -> x + f).
// init (Rechengroesse) wird je Ebene heruntergerechnet; die Pyramide schaetzt nur die Korrektur dazu,
// damit die Feinheiten der Vorgabe nicht durch die grobe Ebene ueberschrieben werden.
function lucasKanade(P1, P2, init, iter) {
  let dU = null, dV = null, dw = 0, dh = 0, U, V;
  for (let l = LEVELS - 1; l >= 0; l--) {
    const { w, h } = P1[l], I1 = P1[l].img, I2 = P2[l].img, n = w * h;
    let iu, iv;
    if (init) [iu, iv] = resample(init[0], init[1], P1[0].w, P1[0].h, w, h);
    else { iu = new Float32Array(n); iv = new Float32Array(n); }
    let cu, cv;
    if (dU) [cu, cv] = resample(dU, dV, dw, dh, w, h);
    U = new Float32Array(n); V = new Float32Array(n);
    for (let i = 0; i < n; i++) { U[i] = iu[i] + (cu ? cu[i] : 0); V[i] = iv[i] + (cv ? cv[i] : 0); }
    const gx1 = new Float32Array(n), gy1 = new Float32Array(n);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      gx1[i] = 0.5 * (I1[y * w + Math.min(w - 1, x + 1)] - I1[y * w + Math.max(0, x - 1)]);
      gy1[i] = 0.5 * (I1[Math.min(h - 1, y + 1) * w + x] - I1[Math.max(0, y - 1) * w + x]);
    }
    const W2 = new Float32Array(n), xx = new Float32Array(n), xy = new Float32Array(n), yy = new Float32Array(n),
      xt = new Float32Array(n), yt = new Float32Array(n), tmp = new Float32Array(n),
      Sxx = new Float32Array(n), Sxy = new Float32Array(n), Syy = new Float32Array(n), Sxt = new Float32Array(n), Syt = new Float32Array(n);
    for (let it = 0; it < iter; it++) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; W2[i] = bil(I2, w, h, x + U[i], y + V[i]); }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const gx = 0.5 * (gx1[i] + 0.5 * (W2[y * w + Math.min(w - 1, x + 1)] - W2[y * w + Math.max(0, x - 1)]));
        const gy = 0.5 * (gy1[i] + 0.5 * (W2[Math.min(h - 1, y + 1) * w + x] - W2[Math.max(0, y - 1) * w + x]));
        const gt = W2[i] - I1[i];
        xx[i] = gx * gx; xy[i] = gx * gy; yy[i] = gy * gy; xt[i] = gx * gt; yt[i] = gy * gt;
      }
      boxMean(xx, w, h, RADIUS, Sxx, tmp); boxMean(xy, w, h, RADIUS, Sxy, tmp); boxMean(yy, w, h, RADIUS, Syy, tmp);
      boxMean(xt, w, h, RADIUS, Sxt, tmp); boxMean(yt, w, h, RADIUS, Syt, tmp);
      for (let i = 0; i < n; i++) {
        const a = Sxx[i] + LAMBDA, b = Sxy[i], d = Syy[i] + LAMBDA, det = a * d - b * b;
        let du = -(d * Sxt[i] - b * Syt[i]) / det, dv = -(a * Syt[i] - b * Sxt[i]) / det;
        du = du > 1 ? 1 : du < -1 ? -1 : du; dv = dv > 1 ? 1 : dv < -1 ? -1 : dv;
        U[i] += du; V[i] += dv;
      }
    }
    // Korrektur vertrauensgewichtet glaetten (kleinster Eigenwert des Strukturtensors)
    const c = new Float32Array(n), cu2 = new Float32Array(n), cv2 = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const m = 0.5 * (Sxx[i] + Syy[i]), q = Math.sqrt(0.25 * (Sxx[i] - Syy[i]) ** 2 + Sxy[i] ** 2);
      c[i] = Math.max(0, m - q) + 1e-3;
      cu2[i] = c[i] * (U[i] - iu[i]); cv2[i] = c[i] * (V[i] - iv[i]);
    }
    const Gc = gauss(c, w, h, 1.0), Gu = gauss(cu2, w, h, 1.0), Gv = gauss(cv2, w, h, 1.0);
    dU = new Float32Array(n); dV = new Float32Array(n);
    for (let i = 0; i < n; i++) { dU[i] = Gu[i] / Gc[i]; dV[i] = Gv[i] / Gc[i]; U[i] = iu[i] + dU[i]; V[i] = iv[i] + dV[i]; }
    dw = w; dh = h;
  }
  return [U, V];
}

// Einzelschritt k -> k+1: Rueckwaertsfluss (Gitter k+1 -> Bild k), geprueft mit dem Vorwaertsfluss.
function schritt(gk, gk1, Pk, Pk1) {
  const n = CW * CW;
  let mad = 0; for (let i = 0; i < n; i++) mad += Math.abs(gk[i] - gk1[i]); mad /= n;
  if (mad < 0.1) return { u: new Float32Array(n), v: new Float32Array(n), doppel: 1, ausreisser: 0, fb: 0 };
  const [bu, bv] = lucasKanade(Pk1, Pk, null, ITER);
  const [fu, fv] = lucasKanade(Pk, Pk1, null, ITER);
  const ok = new Float32Array(n), wu = new Float32Array(n), wv = new Float32Array(n);
  let bad = 0, fbs = 0;
  for (let y = 0; y < CW; y++) for (let x = 0; x < CW; x++) {
    const i = y * CW + x, px = x + bu[i], py = y + bv[i];
    const ex = bu[i] + bil(fu, CW, CW, px, py), ey = bv[i] + bil(fv, CW, CW, px, py), e = Math.hypot(ex, ey);
    fbs += e;
    if (e <= FB_SCHWELLE) { ok[i] = 1; wu[i] = bu[i]; wv[i] = bv[i]; } else bad++;
  }
  // Ausreisser aus gueltigen Nachbarn auffuellen (normierte Faltung), danach leicht glaetten
  const Go = gauss(ok, CW, CW, 3), Gu = gauss(wu, CW, CW, 3), Gv = gauss(wv, CW, CW, 3);
  for (let i = 0; i < n; i++) if (!ok[i]) {
    if (Go[i] > 1e-4) { bu[i] = Gu[i] / Go[i]; bv[i] = Gv[i] / Go[i]; }
  }
  return { u: gauss(bu, CW, CW, 0.8), v: gauss(bv, CW, CW, 0.8), doppel: 0, ausreisser: bad / n, fb: fbs / n };
}

// ---------------------------------------------------------------- Arbeiter-Faden
if (!isMainThread) {
  const { grauSAB, flussSAB, statSAB, N } = workerData;
  const n = CW * CW, grau = new Float32Array(grauSAB), fluss = new Float32Array(flussSAB), stat = new Float32Array(statSAB);
  const G = k => grau.subarray(k * n, (k + 1) * n);
  parentPort.on('message', ({ von, bis }) => {
    let prev = null;
    for (let k = von; k < bis; k++) {
      const Pk = prev && prev.k === k ? prev.p : pyramide(G(k), CW, CW);
      const Pk1 = pyramide(G(k + 1), CW, CW);
      const r = schritt(G(k), G(k + 1), Pk, Pk1);
      fluss.set(r.u, k * 2 * n); fluss.set(r.v, k * 2 * n + n);
      stat[k * 3] = r.doppel; stat[k * 3 + 1] = r.ausreisser; stat[k * 3 + 2] = r.fb;
      prev = { k: k + 1, p: Pk1 };
      parentPort.postMessage({ fertig: k });
    }
    parentPort.postMessage({ block: von });
  });
} else {
  hauptprogramm().catch(e => { console.error(e); process.exit(1); });
}

// ---------------------------------------------------------------- Hauptfaden
function bilder(datei, groesse) {
  const r = spawnSync(FFMPEG, ['-v', 'error', '-i', datei, '-vf', `scale=${groesse}:${groesse}:flags=lanczos`,
    '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(r.stderr.toString());
  const m = groesse * groesse * 3, N = Math.floor(r.stdout.length / m);
  return { buf: r.stdout, N, bild: k => r.stdout.subarray(k * m, (k + 1) * m) };
}

function komma(x, st = 2) { return x.toFixed(st).replace('.', ','); }

async function hauptprogramm() {
  const t0 = performance.now(), zeit = () => ((performance.now() - t0) / 1000).toFixed(1) + ' s';
  const nurFluss = process.argv.includes('--nur-fluss');
  const n = CW * CW;

  // Takt: Median der Abstaende aufeinanderfolgender Einsen
  const kat = JSON.parse(zlib.gunzipSync(fs.readFileSync(`${WURZEL}/library/katalog.json.gz`)));
  const song = (kat.songs || kat)[ID];
  const einsen = song.schlaege.filter(s => s[1] === 1).map(s => s[0]);
  const abst = einsen.slice(1).map((t, i) => t - einsen[i]).sort((p, q) => p - q);
  const takt = abst[abst.length >> 1];
  console.log('Titel:', song.titel, '| Takt (Median Einsabstand):', takt.toFixed(4), 's aus', abst.length, 'Abstaenden');

  // (a) Bilder in Rechengroesse
  const rech = bilder(QUELLE, CW), N = rech.N;
  const grauSAB = new SharedArrayBuffer(N * n * 4), grau = new Float32Array(grauSAB);
  for (let k = 0; k < N; k++) {
    const b = rech.bild(k), g = grau.subarray(k * n, (k + 1) * n);
    for (let i = 0; i < n; i++) g[i] = 0.299 * b[3 * i] + 0.587 * b[3 * i + 1] + 0.114 * b[3 * i + 2];
  }
  console.log('Quelle', path.basename(QUELLE), N, 'Bilder,', zeit());
  const G = k => grau.subarray(k * n, (k + 1) * n);

  // (b) Einzelfluesse (mit Zwischenspeicher)
  const flussSAB = new SharedArrayBuffer((N - 1) * 2 * n * 4), fluss = new Float32Array(flussSAB);
  const statSAB = new SharedArrayBuffer((N - 1) * 3 * 4), stat = new Float32Array(statSAB);
  let ausCache = false;
  if (fs.existsSync(CACHE) && fs.existsSync(CACHE + '.json')) {
    const kopf = JSON.parse(fs.readFileSync(CACHE + '.json', 'utf8'));
    if (kopf.param === PARAM && kopf.N === N) {
      const fd = fs.openSync(CACHE, 'r');
      fs.readSync(fd, new Uint8Array(flussSAB), 0, flussSAB.byteLength, 0);
      fs.readSync(fd, new Uint8Array(statSAB), 0, statSAB.byteLength, flussSAB.byteLength);
      fs.closeSync(fd); ausCache = true;
      console.log('Einzelfluesse aus Zwischenspeicher, Rechenzeit damals', kopf.sekunden, 's');
    }
  }
  if (!ausCache) {
    const tf = performance.now();
    const bloecke = [], gr = Math.ceil((N - 1) / ARBEITER);
    for (let v = 0; v < N - 1; v += gr) bloecke.push({ von: v, bis: Math.min(N - 1, v + gr) });
    let erledigt = 0;
    await Promise.all(bloecke.map(bl => new Promise((ok, fehl) => {
      const w = new Worker(fileURLToPath(import.meta.url), { workerData: { grauSAB, flussSAB, statSAB, N } });
      w.on('message', m => {
        if (m.fertig !== undefined && ++erledigt % 40 === 0) console.log('  Fluesse', erledigt, '/', N - 1, zeit());
        if (m.block !== undefined) { w.terminate(); ok(); }
      });
      w.on('error', fehl);
      w.postMessage(bl);
    })));
    const sek = ((performance.now() - tf) / 1000).toFixed(1);
    fs.writeFileSync(CACHE, Buffer.concat([Buffer.from(flussSAB), Buffer.from(statSAB)]));
    fs.writeFileSync(CACHE + '.json', JSON.stringify({ param: PARAM, N, sekunden: sek }));
    console.log('Einzelfluesse gerechnet in', sek, 's');
  }
  let doppel = 0, ausr = 0, fbm = 0, betrag = 0;
  for (let k = 0; k < N - 1; k++) {
    doppel += stat[3 * k]; ausr += stat[3 * k + 1]; fbm += stat[3 * k + 2];
    const f = fluss.subarray(k * 2 * n, (k + 1) * 2 * n); let s = 0;
    for (let i = 0; i < n; i++) s += Math.hypot(f[i], f[n + i]); betrag += s / n;
  }
  console.log(`Einzelschritte: Doppelbilder ${doppel}, Ausreisser (FB > ${FB_SCHWELLE}px) im Mittel ${(100 * ausr / (N - 1)).toFixed(2)} %,`,
    `FB-Fehler im Mittel ${(fbm / (N - 1)).toFixed(3)} px, Schrittweite im Mittel ${(betrag / (N - 1)).toFixed(3)} px (Rechengroesse ${CW})`);
  const FU = k => fluss.subarray(k * 2 * n, k * 2 * n + n), FV = k => fluss.subarray(k * 2 * n + n, (k + 1) * 2 * n);

  // (c) Verkettung: Fluss von Bild b-1 nach Bild a
  function kette(a, b) {
    const U = new Float32Array(FU(b - 2)), V = new Float32Array(FV(b - 2));
    for (let k = b - 3; k >= a; k--) {
      const gu = FU(k), gv = FV(k);
      for (let y = 0; y < CW; y++) for (let x = 0; x < CW; x++) {
        const i = y * CW + x, px = x + U[i], py = y + V[i];
        U[i] += bil(gu, CW, CW, px, py); V[i] += bil(gv, CW, CW, px, py);
      }
    }
    return [U, V];
  }
  function restfehler(a, b, U, V) {
    const Ia = G(a), Ib = G(b - 1); let s = 0, s0 = 0, m = 0;
    for (let y = 0; y < CW; y++) for (let x = 0; x < CW; x++) {
      const i = y * CW + x, px = x + U[i], py = y + V[i];
      s0 += Math.abs(Ia[i] - Ib[i]);
      if (px < 0 || py < 0 || px > CW - 1 || py > CW - 1) continue;
      s += Math.abs(bil(Ia, CW, CW, px, py) - Ib[i]); m++;
    }
    return { rest: s / m, ohne: s0 / n, gueltig: m / n };
  }
  function affin(U, V) {
    // x' = x + U = A [x y 1]; kleinste Quadrate
    const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], bx = [0, 0, 0], by = [0, 0, 0];
    for (let y = 0; y < CW; y++) for (let x = 0; x < CW; x++) {
      const i = y * CW + x, r = [x, y, 1];
      for (let p = 0; p < 3; p++) { for (let q = 0; q < 3; q++) M[p][q] += r[p] * r[q]; bx[p] += r[p] * (x + U[i]); by[p] += r[p] * (y + V[i]); }
    }
    const loese = (A, bb) => { // Cramer
      const d = m => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
      const D = d(A);
      return [0, 1, 2].map(c => d(A.map((row, rI) => row.map((v, cI) => cI === c ? bb[rI] : v))) / D);
    };
    const ax = loese(M, bx), ay = loese(M, by);
    const skala = Math.sqrt(Math.abs(ax[0] * ay[1] - ax[1] * ay[0]));
    let res = 0;
    for (let y = 0; y < CW; y++) for (let x = 0; x < CW; x++) {
      const i = y * CW + x;
      res += Math.hypot(ax[0] * x + ax[1] * y + ax[2] - x - U[i], ay[0] * x + ay[1] * y + ay[2] - y - V[i]);
    }
    return { ax, ay, skala, restNichtAffin: res / n };
  }
  function betragStat(U, V) {
    const m = Array.from(U, (u, i) => Math.hypot(u, V[i])).sort((p, q) => p - q);
    return { mittel: m.reduce((p, q) => p + q, 0) / m.length, median: m[m.length >> 1], p95: m[Math.floor(0.95 * m.length)], max: m[m.length - 1] };
  }

  // (e) Ausschnitt waehlen: Fenster D = ganzer Takt (auch halber Takt zum Vergleich), Periode <= 10 s
  const tk = performance.now();
  const Dvoll = Math.round(takt * FPS), Dhalb = Math.round(takt * FPS / 2);
  const tabelle = [];
  for (const Dn of [Dvoll, Dhalb]) {
    const L = Math.min(10 * FPS - Dn, N);
    for (let a = 0; a + L <= N; a += 2) {
      const [U, V] = kette(a, a + L), r = restfehler(a, a + L, U, V);
      tabelle.push({ Dn, L, a, b: a + L, ...r });
    }
  }
  // kuerzere Ausschnitte zum Vergleich (Einschwingen des Bildes)
  for (const L of [48, 96, 144]) for (const a of [0, 241 - L - 1]) {
    const [U, V] = kette(a, a + L); tabelle.push({ Dn: '-', L, a, b: a + L, ...restfehler(a, a + L, U, V) });
  }
  for (const z of tabelle) console.log(`  D=${z.Dn} L=${z.L} [${z.a},${z.b}) Restfehler ${z.rest.toFixed(2)} (ohne Verzerrung ${z.ohne.toFixed(2)}), gueltig ${(100 * z.gueltig).toFixed(1)} %`);
  const kand = tabelle.filter(z => z.Dn === Dvoll);
  const wahl = kand.reduce((p, q) => (q.rest < p.rest ? q : p));
  const Dn = wahl.Dn, L = wahl.L, A = wahl.a, B = wahl.b, P = L + Dn;
  console.log(`Wahl: [${A}, ${B}) L=${L}, D=${Dn} Bilder (${komma(Dn / FPS)} s), Periode ${P} Bilder = ${komma(P / FPS, 4)} s; Auswahl ${((performance.now() - tk) / 1000).toFixed(1)} s`);

  // Plausibilitaet des verketteten Feldes: Jacobi-Determinante von x -> x + F. Wo das Feld faltet oder
  // Punkte in "Senken" zusammenzieht (Determinante weit unter/ueber dem Median), aus Nachbarn auffuellen.
  function faltenGlaetten(U, V) {
    const det = new Float32Array(n);
    for (let y = 0; y < CW; y++) for (let x = 0; x < CW; x++) {
      const i = y * CW + x, xl = Math.max(0, x - 1), xr = Math.min(CW - 1, x + 1), yu = Math.max(0, y - 1), yd = Math.min(CW - 1, y + 1);
      const ux = (U[y * CW + xr] - U[y * CW + xl]) / (xr - xl), uy = (U[yd * CW + x] - U[yu * CW + x]) / (yd - yu);
      const vx = (V[y * CW + xr] - V[y * CW + xl]) / (xr - xl), vy = (V[yd * CW + x] - V[yu * CW + x]) / (yd - yu);
      det[i] = (1 + ux) * (1 + vy) - uy * vx;
    }
    const med = Float32Array.from(det).sort()[n >> 1];
    const ok = new Float32Array(n), wu = new Float32Array(n), wv = new Float32Array(n);
    let bad = 0;
    for (let i = 0; i < n; i++) {
      if (det[i] > 0.35 * med && det[i] < 3 * med) { ok[i] = 1; wu[i] = U[i]; wv[i] = V[i]; } else bad++;
    }
    const Go = gauss(ok, CW, CW, 3), Gu = gauss(wu, CW, CW, 3), Gv = gauss(wv, CW, CW, 3);
    for (let i = 0; i < n; i++) if (!ok[i] && Go[i] > 1e-4) { U[i] = Gu[i] / Go[i]; V[i] = Gv[i] / Go[i]; }
    return bad / n;
  }
  function lokalFehler(I1, I2, U, V) {
    const e = new Float32Array(n);
    for (let y = 0; y < CW; y++) for (let x = 0; x < CW; x++) { const i = y * CW + x; e[i] = Math.abs(bil(I2, CW, CW, x + U[i], y + V[i]) - I1[i]); }
    return boxMean(e, CW, CW, 3, new Float32Array(n), new Float32Array(n));
  }
  // LK mit Vorgabe; je Bildpunkt gewinnt, was im 7x7-Fenster den kleineren Farbfehler hat (Vorgabe oder Verfeinerung)
  function verfeinere(k1, k2, U0, V0, iter) {
    const [U1, V1] = lucasKanade(pyramide(G(k1), CW, CW), pyramide(G(k2), CW, CW), [U0, V0], iter);
    const e0 = lokalFehler(G(k1), G(k2), U0, V0), e1 = lokalFehler(G(k1), G(k2), U1, V1);
    const U = new Float32Array(n), V = new Float32Array(n); let neu = 0;
    for (let i = 0; i < n; i++) { if (e1[i] < e0[i]) { U[i] = U1[i]; V[i] = V1[i]; neu++; } else { U[i] = U0[i]; V[i] = V0[i]; } }
    const falt = faltenGlaetten(U, V);
    return { U: gauss(U, CW, CW, 1.0), V: gauss(V, CW, CW, 1.0), neu: neu / n, falt };
  }
  // Verkettung in Stufen: Kurzschritte zu Stufen der Laenge S zusammensetzen, jede Stufe gegen ihre beiden
  // Bilder verfeinern, dann die Stufen zusammensetzen (nach jeder Zusammensetzung Faltenpruefung + leichte Glaettung).
  const STUFE = 8;
  function ketteStufen(a, b) {
    let U = null, V = null, cur = b - 1, stufen = 0, neuS = 0, faltS = 0;
    while (cur > a) {
      const nxt = Math.max(a, cur - STUFE);
      const [su, sv] = cur - nxt === 1 ? [new Float32Array(FU(nxt)), new Float32Array(FV(nxt))] : kette(nxt, cur + 1);
      const r = verfeinere(cur, nxt, su, sv, ITER);
      neuS += r.neu; faltS += r.falt; stufen++;
      if (!U) { U = r.U; V = r.V; }
      else {
        for (let y = 0; y < CW; y++) for (let x = 0; x < CW; x++) {
          const i = y * CW + x, px = x + U[i], py = y + V[i];
          U[i] += bil(r.U, CW, CW, px, py); V[i] += bil(r.V, CW, CW, px, py);
        }
        faltS += faltenGlaetten(U, V);
        U = gauss(U, CW, CW, 0.7); V = gauss(V, CW, CW, 0.7);
      }
      cur = nxt;
    }
    return { U, V, stufen, neu: neuS / stufen, falt: faltS / (2 * stufen - 1) };
  }

  // F = affiner Anteil + geglaetteter Rest (sigma >= 1000: nur affin)
  function glattAffin(U, V, aff, sigma) {
    if (sigma <= 0) return [U, V];
    const RU = new Float32Array(n), RV = new Float32Array(n);
    const au = (x, y) => aff.ax[0] * x + aff.ax[1] * y + aff.ax[2] - x, av = (x, y) => aff.ay[0] * x + aff.ay[1] * y + aff.ay[2] - y;
    for (let y = 0; y < CW; y++) for (let x = 0; x < CW; x++) { const i = y * CW + x; RU[i] = U[i] - au(x, y); RV[i] = V[i] - av(x, y); }
    const GU = sigma >= 1000 ? new Float32Array(n) : gauss(RU, CW, CW, sigma), GV = sigma >= 1000 ? new Float32Array(n) : gauss(RV, CW, CW, sigma);
    for (let y = 0; y < CW; y++) for (let x = 0; x < CW; x++) { const i = y * CW + x; GU[i] += au(x, y); GV[i] += av(x, y); }
    return [GU, GV];
  }
  const [NU, NV] = kette(A, B);   // naive Verkettung aller 200 Kurzschritte, nur zum Vergleich
  const rn = restfehler(A, B, NU, NV);
  const tst = performance.now();
  const ks = ketteStufen(A, B), KU = ks.U, KV = ks.V;
  const zstufen = ((performance.now() - tst) / 1000).toFixed(1);
  const rk = restfehler(A, B, KU, KV), bk = betragStat(KU, KV), af = affin(KU, KV);
  const td = performance.now();
  const dr = verfeinere(B - 1, A, KU, KV, ITER_DIREKT), DU = dr.U, DV = dr.V;
  const zdirekt = ((performance.now() - td) / 1000).toFixed(1);
  const rd = restfehler(A, B, DU, DV), bd = betragStat(DU, DV);
  const diff = betragStat(Float32Array.from(DU, (u, i) => u - KU[i]), Float32Array.from(DV, (v, i) => v - KV[i]));
  const diffN = betragStat(Float32Array.from(NU, (u, i) => u - KU[i]), Float32Array.from(NV, (v, i) => v - KV[i]));
  console.log('Naiv verkettet (', B - A - 1, 'Kurzschritte): Restfehler', rn, 'Abstand zur Stufenkette', diffN);
  console.log(`Stufenkette (${ks.stufen} Stufen zu ${STUFE}, ${zstufen} s, verfeinert uebernommen ${(100 * ks.neu).toFixed(1)} %, Falten ${(100 * ks.falt).toFixed(2)} %): Betrag`, bk,
    'Restfehler', rk, 'affin Skala', af.skala.toFixed(4), 'Nicht-affiner Anteil', af.restNichtAffin.toFixed(2), 'px');
  console.log(`Direkt b-1 -> a (init Stufenkette, ${zdirekt} s, uebernommen ${(100 * dr.neu).toFixed(1)} %): Betrag`, bd, 'Restfehler', rd);
  console.log('Unterschied direkt - verkettet (px, Rechengroesse):', diff);
  const bericht = { takt, A, B, L, Dn, P, naiv: { rest: rn, abstand: diffN }, verkettet: { stufen: ks.stufen, betrag: bk, rest: rk, skala: af.skala, nichtAffin: af.restNichtAffin, zeit: zstufen },
    direkt: { betrag: bd, rest: rd, uebernommen: dr.neu }, unterschied: diff,
    einzel: { doppel, ausreisserProzent: 100 * ausr / (N - 1), fbMittel: fbm / (N - 1) }, tabelle };
  fs.writeFileSync(`${HIER}/rueckmorph.json`, JSON.stringify(bericht, null, 1));
  if (process.argv.includes('--diagnose')) {
    // Einzelschritt-Restfehler und Sichtprobe: Bild a | a entlang Kette verzerrt | Bild b-1 | a entlang direktem Fluss
    let rs = 0, r0 = 0;
    for (let k = A; k < B - 1; k += 10) { const q = restfehler(k, k + 2, FU(k), FV(k)); rs += q.rest; r0 += q.ohne; }
    console.log('Einzelschritt-Restfehler (Stichprobe)', (rs / 20).toFixed(2), 'ohne Verzerrung', (r0 / 20).toFixed(2));
    for (const sg of [0, 2, 4, 8, 16, 1000]) {
      const [SU, SV] = glattAffin(KU, KV, af, sg);
      console.log(`  Stufenkette, nicht-affiner Anteil geglaettet sigma=${sg}: Restfehler`, restfehler(A, B, SU, SV).rest.toFixed(2));
    }
    const warp = (I, U, V) => Float32Array.from(I, (_, i) => bil(I, CW, CW, (i % CW) + U[i], ((i / CW) | 0) + V[i]));
    const [S4U, S4V] = glattAffin(KU, KV, af, 4), [S8U, S8V] = glattAffin(KU, KV, af, 8); const tafel = [warp(G(A), KU, KV), warp(G(A), S4U, S4V), warp(G(A), S8U, S8V), G(B - 1)], o = Buffer.alloc(4 * n);
    tafel.forEach((T, j) => { for (let y = 0; y < CW; y++) for (let x = 0; x < CW; x++) o[y * 4 * CW + j * CW + x] = Math.max(0, Math.min(255, T[y * CW + x])); });
    spawnSync(FFMPEG, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', `${4 * CW}x${CW}`, '-i', '-', '-frames:v', '1', `${HIER}/rueckmorph-diagnose.png`], { input: o });
  }
  if (nurFluss) { console.log('fertig (nur Fluss)', zeit()); return; }

  // (d) Ausgabe
  const aus = bilder(QUELLE, OW), on = OW * OW;
  const LIN = new Float32Array(256); for (let i = 0; i < 256; i++) { const c = i / 255; LIN[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
  const ZUR = new Uint8Array(4097); for (let i = 0; i <= 4096; i++) { const c = i / 4096; ZUR[i] = Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)); }
  const linear = k => { const b = aus.bild(k), o = new Float32Array(on * 3); for (let i = 0; i < on * 3; i++) o[i] = LIN[b[i]]; return o; };
  const zuByte = (v) => ZUR[Math.max(0, Math.min(4096, Math.round(v * 4096)))];
  const s = OW / CW;

  // Kurzschritt-Morph (Kachel 4, Abbremsen): Punkt x in QA liegt in QB bei x + F(x); zum Zeitpunkt t bei
  // y = x + t F(x), x per Fixpunkt-Iteration. Bei Einzelschritten (< 1 px) konvergiert das sicher.
  function morph(QA, QB, U, V, t) {
    const o = Buffer.alloc(on * 3);
    const Fat = (x, y) => [bil(U, OW, OW, x, y), bil(V, OW, OW, x, y)];
    for (let py = 0; py < OW; py++) for (let px = 0; px < OW; px++) {
      let x = px, y = py, f = [0, 0];
      for (let it = 0; it < 6; it++) { f = Fat(x, y); x = px - t * f[0]; y = py - t * f[1]; }
      const zx = x + f[0], zy = y + f[1], i = (py * OW + px) * 3;
      for (let c = 0; c < 3; c++) o[i + c] = zuByte((1 - t) * bilC(QA, x, y, c) + t * bilC(QB, zx, zy, c));
    }
    return o;
  }
  function bilC(img, x, y, c) {
    x = x < 0 ? 0 : x > OW - 1 ? OW - 1 : x; y = y < 0 ? 0 : y > OW - 1 ? OW - 1 : y;
    let x0 = x | 0, y0 = y | 0; if (x0 >= OW - 1) x0 = OW - 2; if (y0 >= OW - 1) y0 = OW - 2;
    const fx = x - x0, fy = y - y0, i = (y0 * OW + x0) * 3 + c, j = i + OW * 3;
    return (img[i] * (1 - fx) + img[i + 3] * fx) * (1 - fy) + (img[j] * (1 - fx) + img[j + 3] * fx) * fy;
  }
  const smooth = u => u * u * (3 - 2 * u);

  const [GKU, GKV] = glattAffin(KU, KV, af, GLATT);   // Morph-Feld: affin + geglaetteter Rest
  console.log(`Morph-Feld: Stufenkette, nicht-affiner Anteil sigma=${GLATT}, Restfehler`, restfehler(A, B, GKU, GKV).rest.toFixed(2));
  const [MU, MV] = resample(GKU, GKV, CW, CW, OW, OW);

  // Umkehrfeld H (Gitter von Bild a: Punkt z liegt in Bild b-1 bei z + H(z)) aus dem Morph-Feld durch
  // Fixpunkt-Umkehrung x = z - F(x), ausserhalb affin fortgesetzt; danach wie F geglaettet.
  // Grund (Pruefung am Bild): die fruehere Bahn-Iteration im Morph konvergierte an Faltstellen nicht,
  // Bild a wurde dann auch bei tau ~ 1 verzerrt gelesen und am Fensterende sprang es hart auf das Original.
  const affF = (x, y) => {
    const cx = x < 0 ? 0 : x > CW - 1 ? CW - 1 : x, cy = y < 0 ? 0 : y > CW - 1 ? CW - 1 : y;
    return [bil(GKU, CW, CW, cx, cy) + (af.ax[0] - 1) * (x - cx) + af.ax[1] * (y - cy), bil(GKV, CW, CW, cx, cy) + af.ay[0] * (x - cx) + (af.ay[1] - 1) * (y - cy)];
  };
  const HU0 = new Float32Array(n), HV0 = new Float32Array(n); let nichtKonv = 0;
  for (let zy = 0; zy < CW; zy++) for (let zx = 0; zx < CW; zx++) {
    let x = zx, y = zy;
    for (let it = 0; it < 30; it++) { const f = affF(x, y); x = 0.5 * x + 0.5 * (zx - f[0]); y = 0.5 * y + 0.5 * (zy - f[1]); }
    const f = affF(x, y); if (Math.hypot(x + f[0] - zx, y + f[1] - zy) > 1) nichtKonv++;
    HU0[zy * CW + zx] = x - zx; HV0[zy * CW + zx] = y - zy;
  }
  const afH = affin(HU0, HV0), [GHU, GHV] = glattAffin(HU0, HV0, afH, GLATT), [MHU, MHV] = resample(GHU, GHV, CW, CW, OW, OW);
  console.log(`Umkehrfeld: nicht umkehrbar (Rest > 1 px) ${(100 * nichtKonv / n).toFixed(1)} %, affin Skala ${afH.skala.toFixed(4)}`);

  // Zwischenbild nach Jiang et al. (Super SloMo): Fluss vom Zwischenzeitpunkt aus beiden Richtungsfeldern
  // angenaehert, keine Bahn-Iteration; bei t = 0 wird Bild b-1, bei t = 1 Bild a exakt am Ort gelesen.
  function morphZwei(QL, QF, U, V, HU, HV, t) {
    const o = Buffer.alloc(on * 3);
    const rand = (x, y) => Math.max(0, 1 - Math.max(0, -x, x - (OW - 1), -y, y - (OW - 1)) / 1.5);
    const a0 = -(1 - t) * t, b0 = t * t, a1 = (1 - t) * (1 - t), b1 = -t * (1 - t);
    for (let py = 0; py < OW; py++) for (let px = 0; px < OW; px++) {
      const i1 = py * OW + px, fu = U[i1], fv = V[i1], hu = HU[i1], hv = HV[i1];
      const lx = px + a0 * fu + b0 * hu, ly = py + a0 * fv + b0 * hv;   // Leseort in Bild b-1
      const ax = px + a1 * fu + b1 * hu, ay = py + a1 * fv + b1 * hv;   // Leseort in Bild a
      let wl = (1 - t) * rand(lx, ly), wa = t * rand(ax, ay), sum = wl + wa;
      if (sum < 1e-6) { wl = 1 - t; wa = t; sum = 1; }
      const i = i1 * 3;
      for (let c = 0; c < 3; c++) {
        const vl = wl > 0 ? bilC(QL, lx, ly, c) : 0, va = wa > 0 ? bilC(QF, ax, ay, c) : 0;
        o[i + c] = zuByte((wl * vl + wa * va) / sum);
      }
    }
    return o;
  }
  const LA = linear(A), LB = linear(B - 1);
  const tauFenster = j => smooth((j + 1) / (Dn + 1));

  // Abbremsen: Tempo c bis T1, dann c*cos^2 auf 0 ueber Bn Bilder; deckt genau a..b-1 in L Bildern ab
  const Bn = Dn, T1 = L - 1 - Bn, cT = (L - 1) / (L - 1 - Bn / 2);
  const quellzeit = t => t <= T1 ? cT * t : cT * T1 + cT * ((t - T1) / 2 + Bn / (2 * Math.PI) * Math.sin(Math.PI * (t - T1) / Bn));

  const nutPfad = k => `${HIER}/rueckmorph-k${k}.nut`;
  const schreiber = k => {
    const p = spawn(FFMPEG, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${OW}x${OW}`, '-r', String(FPS), '-i', '-',
      '-c:v', 'ffv1', nutPfad(k)], { stdio: ['pipe', 'inherit', 'inherit'] });
    const fertig = new Promise((ok, fehl) => p.on('close', c => (c === 0 ? ok() : fehl(new Error('ffmpeg ' + c)))));
    return { p, schreib: b => new Promise(ok => (p.stdin.write(b) ? ok() : p.stdin.once('drain', ok))), ende: () => { p.stdin.end(); return fertig; } };
  };
  const mitte = Math.floor(Dn / 2);
  let still2, still3;
  const tr = performance.now();
  const zeitK = {};
  for (let kachel = 1; kachel <= 4; kachel++) {
    const tk0 = performance.now(), w = schreiber(kachel);
    let zaehl = 0;
    for (let t = 0; t < L; t++) {
      if (kachel === 4) {
        const sq = quellzeit(t), k0 = Math.floor(sq + 1e-6), f = sq - k0;
        if (f < 1e-4 || k0 >= L - 1) await w.schreib(aus.bild(A + Math.min(k0, L - 1)));
        else {
          const [gu, gv] = resample(FU(A + k0), FV(A + k0), CW, CW, OW, OW);
          await w.schreib(morph(linear(A + k0 + 1), linear(A + k0), gu, gv, 1 - f));
        }
      } else await w.schreib(aus.bild(A + t));
      zaehl++;
    }
    for (let j = 0; j < Dn; j++) {
      const tau = tauFenster(j);
      let b;
      if (kachel === 1) b = aus.bild(B - 1);
      else if (kachel === 2) {
        const wl = (j + 1) / (Dn + 1); b = Buffer.alloc(on * 3);
        for (let i = 0; i < on * 3; i++) b[i] = zuByte((1 - wl) * LB[i] + wl * LA[i]);
        if (j === mitte) still2 = b;
      } else {
        b = morphZwei(LB, LA, MU, MV, MHU, MHV, tau);
        if (kachel === 3 && j === mitte) still3 = b;
      }
      await w.schreib(b); zaehl++;
    }
    await w.ende();
    zeitK[kachel] = ((performance.now() - tk0) / 1000).toFixed(1);
    console.log('Kachel', kachel, zaehl, 'Bilder,', zeitK[kachel], 's');
  }

  // Beschriftung per headless Chrome
  const Ds = komma(Dn / FPS), Ps = komma(P / FPS);
  const labels = [
    ['harter Schnitt', `Periode ${Ps} s · ${Ds} s Standbild`],
    ['Blende', `Periode ${Ps} s · ${Ds} s linear`],
    ['Rückmorph (verketteter Fluss)', `Periode ${Ps} s · ${Ds} s smoothstep`],
    ['Rückmorph + Abbremsen', `Periode ${Ps} s · sin² ${Ds} s, Tempo ×${komma(cT)}`],
  ];
  const html = '<html><head><meta charset="utf-8"><style>html,body{margin:0;background:#111}' +
    `.w{display:flex}.c{width:${OW}px;height:40px;box-sizing:border-box;padding:3px 8px;` +
    'background:#141414;color:#fff;font-family:Helvetica,Arial,sans-serif;overflow:hidden;white-space:nowrap}' +
    'b{display:block;font-size:15px;line-height:18px;font-weight:700}' +
    'i{display:block;font-style:normal;font-size:11.5px;line-height:15px;color:#d8d8d8}</style></head>' +
    '<body><div class="w">' + labels.map(([p, q]) => `<div class="c"><b>${p}</b><i>${q}</i></div>`).join('') + '</div></body></html>';
  const png = `${HIER}/rueckmorph-beschriftung.png`;
  if (fs.existsSync(png)) fs.unlinkSync(png);
  const profil = `${HIER}/.profil-${process.pid}`;
  spawnSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=1', `--user-data-dir=${profil}`, `--screenshot=${png}`, `--window-size=${OW * 4},40`,
    'data:text/html;charset=utf-8,' + encodeURIComponent(html)], { timeout: 90000 });
  fs.rmSync(profil, { recursive: true, force: true });
  if (!fs.existsSync(png)) throw new Error('Beschriftung fehlt');

  // Zusammensetzen: 4 Kacheln, drei Perioden
  const GES = LOOPS * P, ziel = `${OUT}/glut-rueckmorph.mp4`;
  const g = ['[4]split=4[l0][l1][l2][l3]'];
  for (let k = 0; k < 4; k++) {
    g.push(`[l${k}]crop=${OW}:40:${OW * k}:0[c${k}]`);
    g.push(`[${k}]loop=loop=${LOOPS - 1}:size=${P}:start=0,trim=end_frame=${GES},setpts=N/${FPS}/TB,pad=${OW}:${OW + 40}:0:40:color=0x141414[v${k}]`);
    g.push(`[v${k}][c${k}]overlay=0:0[t${k}]`);
  }
  g.push('[t0][t1][t2][t3]hstack=inputs=4,format=yuv420p[out]');
  let r = spawnSync(FFMPEG, ['-y', '-v', 'error', ...[1, 2, 3, 4].flatMap(k => ['-i', nutPfad(k)]), '-i', png, '-filter_complex', g.join(';'),
    '-map', '[out]', '-r', String(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-movflags', '+faststart', ziel]);
  if (r.status !== 0) throw new Error(r.stderr.toString());

  // Standbild Mitte des Fensters: Blende | Rueckmorph
  const zwei = Buffer.alloc(2 * OW * OW * 3);
  for (let y = 0; y < OW; y++) { still2.copy(zwei, y * 2 * OW * 3, y * OW * 3, (y + 1) * OW * 3); still3.copy(zwei, (y * 2 * OW + OW) * 3, y * OW * 3, (y + 1) * OW * 3); }
  const mittePng = `${OUT}/glut-rueckmorph-mitte.png`;
  r = spawnSync(FFMPEG, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${2 * OW}x${OW}`, '-i', '-', '-i', png,
    '-filter_complex', `[1]crop=${2 * OW}:40:${OW}:0[l];[l][0]vstack=inputs=2`, '-frames:v', '1', mittePng], { input: zwei });
  if (r.status !== 0) throw new Error(r.stderr.toString());
  console.log('Rendern gesamt', ((performance.now() - tr) / 1000).toFixed(1), 's');

  // Pruefung
  const pr = JSON.parse(spawnSync(FFPROBE, ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries',
    'stream=width,height,nb_read_frames,r_frame_rate,duration', '-show_entries', 'format=duration', '-of', 'json', ziel]).stdout);
  console.log('ffprobe', JSON.stringify(pr));
  const kl = spawnSync(FFMPEG, ['-v', 'error', '-i', ziel, '-vf', 'scale=144:40', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: 1 << 28 }).stdout;
  const m = 144 * 40, nb = kl.length / m;
  let maxPer = 0, maxNach = 0;
  for (let k = 0; k + P < nb; k++) {
    let d = 0, e = 0;
    for (let i = 0; i < m; i++) { d += Math.abs(kl[k * m + i] - kl[(k + P) * m + i]); if (k + 1 < nb) e += Math.abs(kl[k * m + i] - kl[(k + 1) * m + i]); }
    maxPer = Math.max(maxPer, d / m); maxNach = Math.max(maxNach, e / m);
  }
  console.log(`Periodenpruefung: ${nb} Bilder, max MAD(k, k+${P}) = ${maxPer.toFixed(2)} (zum Vergleich max MAD Nachbarbilder ${maxNach.toFixed(2)})`);
  bericht.render = { zeitK, cT, Bn, bilder: nb, maxPer, ffprobe: pr };
  fs.writeFileSync(`${HIER}/rueckmorph.json`, JSON.stringify(bericht, null, 1));
  for (let k = 1; k <= 4; k++) fs.unlinkSync(nutPfad(k));
  console.log('ZIEL', ziel, mittePng, 'gesamt', zeit());
}
