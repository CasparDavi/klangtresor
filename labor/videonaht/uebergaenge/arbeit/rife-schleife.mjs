#!/usr/bin/env node
// RIFE-Schleife fuer "Glut und Eis - Die Braut von Corinth" (Laborprobe, Anfrage Caspar_D 15.09.2026).
// Die Schleife (Ende b-1 -> Anfang a) wird mit Zwischenbildern geschlossen, die RIFE (rife-ncnn-vulkan, MIT,
// labor/videonaht/werkzeuge/) erfindet - statt des eigenen verketteten Flusses aus rueckmorph.mjs.
// Ausschnitt [A, B), Takt, D und Periode aus rueckmorph.json; Kachel 3/4 aus glut-ruecklauf.mp4 / glut-rueckmorph.mp4.
//
// Aufruf: node rife-schleife.mjs            Versuche messen, beste Variante waehlen, Kachelvideo rendern
//         node rife-schleife.mjs --nur-versuche
//
// Versuche (Messzeitpunkte t = 0,2 / 0,5 / 0,8 zwischen Bild b-1 (t=0) und Bild a (t=1)):
//   Modell (rife-v4.6, rife-v4, rife-UHD), Rechengroesse (360 = Ausgabe, 960 = Quelle, danach Lanczos auf 360),
//   TTA (-x raeumlich, -z zeitlich), UHD-Modus (-u), Stuetzbilder (Tiefe d: zuerst rekursiv Mittelbilder auf dem
//   Raster i/2^d, dann RIFE nur noch zwischen den beiden benachbarten Stuetzbildern).
// Masse (Grauwert, 360x360, "Boden" daneben: lineare Blende und harter Schnitt):
//   schaerfe  = mittlerer Sobel-Betrag des Zwischenbildes / zeitlich gewichtetes Mittel der beiden Endbilder
//   geist     = Anteil der Bildpunkte mit deutlichem Unterschied d = |a - (b-1)| > 24, an denen das Zwischenbild naeher
//               an der linearen Blende liegt als die Haelfte des Wegs zum naeheren Endbild (< min(t,1-t) d / 2);
//               Blende = 1, harter Schnitt = 0
//   blendAbst = mittlere |Zwischenbild - Blende| / mittlere |a - (b-1)| auf denselben Punkten (Blende 0, Schnitt 0,5 bei t=1/2)
import { spawnSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '../../../..');
const ID = '89ef9f63-c885-4fe5-b082-8e2bf9513c4d';
const QUELLE = `${WURZEL}/library/songs/${ID}/artwork.sprung.mp4`;
const FFMPEG = '/usr/local/bin/ffmpeg', FFPROBE = '/usr/local/bin/ffprobe';
const RIFE_DIR = path.resolve(HIER, '../../werkzeuge/rife-ncnn-vulkan-20221029-macos');
const RIFE = `${RIFE_DIR}/rife-ncnn-vulkan`;
const OUT = path.resolve(HIER, '..');
const FPS = 24, OW = 360, QW = 960, LOOPS = 3, PARALLEL = 3;
const TMP = `${HIER}/rife-tmp-${process.pid}`;
const t0 = performance.now(), zeit = () => ((performance.now() - t0) / 1000).toFixed(1) + ' s';
const komma = (x, st = 2) => x.toFixed(st).replace('.', ',');
const nurVersuche = process.argv.includes('--nur-versuche');

const rm = JSON.parse(fs.readFileSync(`${HIER}/rueckmorph.json`, 'utf8'));
const { takt, A, B, L } = rm;
const D = Math.round(takt * FPS), P = L + D;
if (D !== rm.Dn || P !== rm.P) throw new Error(`D/P ${D}/${P} weichen von rueckmorph ${rm.Dn}/${rm.P} ab`);
console.log(`Takt ${takt.toFixed(4)} s, [${A}, ${B}) L=${L}, D=${D}, P=${P} = ${komma(P / FPS)} s`);
fs.mkdirSync(TMP, { recursive: true });
const aufraeumen = () => fs.rmSync(TMP, { recursive: true, force: true });
process.on('exit', aufraeumen);

// ---------------------------------------------------------------- Bilder
function roh(datei, w) {
  const r = spawnSync(FFMPEG, ['-v', 'error', '-i', datei, '-vf', `scale=${w}:${w}:flags=lanczos`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(r.stderr.toString());
  return r.stdout;
}
function png(rgb, w, datei) {
  const r = spawnSync(FFMPEG, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${w}x${w}`, '-i', '-', '-frames:v', '1', datei], { input: rgb });
  if (r.status !== 0) throw new Error(r.stderr.toString());
  return datei;
}
const quelle360 = roh(QUELLE, OW), m3 = OW * OW * 3;
const q360 = k => quelle360.subarray(k * m3, (k + 1) * m3);            // Quellbild k (absolut)
if (quelle360.length / m3 < B) throw new Error('zu wenig Quellbilder');
const png960 = (k, datei) => {    // Quellbild k in voller Aufloesung, unskaliert
  const r = spawnSync(FFMPEG, ['-y', '-v', 'error', '-i', QUELLE, '-vf', `select=eq(n\\,${k})`, '-frames:v', '1', datei]);
  if (r.status !== 0) throw new Error(r.stderr.toString());
  return datei;
};
const pngB = { 360: png(q360(B - 1), OW, `${TMP}/b-360.png`), [QW]: png960(B - 1, `${TMP}/b-960.png`) };
const pngA = { 360: png(q360(A), OW, `${TMP}/a-360.png`), [QW]: png960(A, `${TMP}/a-960.png`) };

let laufend = 0; const warte = [];
async function rife(p0, p1, aus, t, { model = 'rife-v4.6', flags = [] } = {}) {
  while (laufend >= PARALLEL) await new Promise(ok => warte.push(ok));
  laufend++;
  try {
    await new Promise((ok, fehl) => {
      const p = spawn(RIFE, ['-0', p0, '-1', p1, '-o', aus, '-s', t.toFixed(6), '-m', `${RIFE_DIR}/${model}`, ...flags], { stdio: ['ignore', 'ignore', 'pipe'] });
      let err = ''; p.stderr.on('data', d => { err += d; });
      p.on('close', c => (c === 0 && fs.existsSync(aus) ? ok() : fehl(new Error(`rife ${c} ${err.slice(-400)}`))));
    });
  } finally { laufend--; const n = warte.shift(); if (n) n(); }
  return aus;
}
let zaehler = 0;
const neuPng = tag => `${TMP}/${tag}-${zaehler++}.png`;

// Interpolator je Variante: liefert fuer t in (0,1) ein 360er RGB-Bild zwischen b-1 (t=0) und a (t=1)
function interpolator(v) {
  const res = v.res, stuetz = new Map();   // Stuetzbilder auf dem Raster i/2^tiefe (Pfad)
  const key = (i, d) => `${i}/${2 ** d}`;
  async function stuetzbild(i, d) {       // Bruch i/2^d, gekuerzt
    while (d > 0 && i % 2 === 0) { i /= 2; d--; }
    if (d === 0) return i === 0 ? pngB[res] : pngA[res];
    const k = key(i, d);
    if (!stuetz.has(k)) stuetz.set(k, (async () => {
      const [l, r] = await Promise.all([stuetzbild(i - 1, d), stuetzbild(i + 1, d)]);
      return rife(l, r, neuPng('s'), 0.5, v);
    })());
    return stuetz.get(k);
  }
  return async t => {
    const n = 2 ** v.tiefe, seg = Math.min(n - 1, Math.floor(t * n + 1e-9)), lokal = t * n - seg;
    let datei;
    if (lokal < 1e-6) datei = await stuetzbild(seg, v.tiefe);
    else {
      const [l, r] = await Promise.all([stuetzbild(seg, v.tiefe), stuetzbild(seg + 1, v.tiefe)]);
      datei = await rife(l, r, neuPng('z'), lokal, v);
    }
    const rgb = roh(datei, OW), rand = Math.min(t, 1 - t);
    if (!v.rand || rand >= v.rand) return rgb;
    // Randangleich: RIFE springt fuer t nahe 0/1 nicht auf das Endbild (gemessen: 8-15 Grauwerte MAD bei t = 1/40),
    // daher zum Rand hin mit dem naeheren Endbild mischen, Gewicht (1 - rand/r)² -> an t = 0 und 1 exakt das Endbild
    const w = (1 - rand / v.rand) ** 2, E = t < 0.5 ? q360(B - 1) : q360(A);
    for (let i = 0; i < m3; i++) rgb[i] = Math.round((1 - w) * rgb[i] + w * E[i]);
    return rgb;
  };
}

// ---------------------------------------------------------------- Masse
const grau = rgb => { const g = new Float32Array(OW * OW); for (let i = 0; i < g.length; i++) g[i] = 0.299 * rgb[3 * i] + 0.587 * rgb[3 * i + 1] + 0.114 * rgb[3 * i + 2]; return g; };
function sobel(g) {
  let s = 0;
  for (let y = 1; y < OW - 1; y++) for (let x = 1; x < OW - 1; x++) {
    const i = y * OW + x;
    const gx = g[i - OW + 1] + 2 * g[i + 1] + g[i + OW + 1] - g[i - OW - 1] - 2 * g[i - 1] - g[i + OW - 1];
    const gy = g[i + OW - 1] + 2 * g[i + OW] + g[i + OW + 1] - g[i - OW - 1] - 2 * g[i - OW] - g[i - OW + 1];
    s += Math.hypot(gx, gy);
  }
  return s / ((OW - 2) * (OW - 2));
}
const GB = grau(q360(B - 1)), GA = grau(q360(A)), SB = sobel(GB), SA = sobel(GA);
function masse(rgb, t) {
  const g = grau(rgb); let n = 0, geist = 0, abst = 0, diff = 0;
  for (let i = 0; i < g.length; i++) {
    const d = Math.abs(GA[i] - GB[i]); if (d <= 24) continue;
    const bl = (1 - t) * GB[i] + t * GA[i], e = Math.abs(g[i] - bl);
    n++; diff += d; abst += e; if (e < 0.5 * Math.min(t, 1 - t) * d) geist++;
  }
  return { schaerfe: sobel(g) / ((1 - t) * SB + t * SA), geist: geist / n, blendAbst: abst / diff };
}
const blende = t => { const a = q360(A), b = q360(B - 1), o = Buffer.alloc(m3); for (let i = 0; i < m3; i++) o[i] = Math.round((1 - t) * b[i] + t * a[i]); return o; };

// ---------------------------------------------------------------- Versuche
const V = (name, model, res, tiefe, flags = [], ts = null, rand = 0) => ({ name, model, res, tiefe, flags, ts, rand });
const RAND = 0.25;   // Randangleich ueber je ein Viertel des Fensters
const VARIANTEN = [
  V('v4.6 360 direkt', 'rife-v4.6', 360, 0),
  V('v4.6 960 direkt', 'rife-v4.6', 960, 0),
  V('v4.6 960 -u', 'rife-v4.6', 960, 0, ['-u']),
  V('v4.6 360 -x', 'rife-v4.6', 360, 0, ['-x']),
  V('v4.6 360 -z', 'rife-v4.6', 360, 0, ['-z']),
  V('v4.6 360 -x -z', 'rife-v4.6', 360, 0, ['-x', '-z']),
  V('v4.6 960 -x -z', 'rife-v4.6', 960, 0, ['-x', '-z']),
  V('v4 360 direkt', 'rife-v4', 360, 0),
  V('v4 960 direkt', 'rife-v4', 960, 0),
  V('UHD 960 Stuetz d2', 'rife-UHD', 960, 2, [], [0.25, 0.5, 0.75]),   // rife-UHD kann nur t = 1/2: nur Stuetzbilder, gemessen an 1/4, 1/2, 3/4
  V('v4.6 360 Stuetz d1', 'rife-v4.6', 360, 1),
  V('v4.6 360 Stuetz d2', 'rife-v4.6', 360, 2),
  V('v4.6 360 Stuetz d3', 'rife-v4.6', 360, 3),
  V('v4.6 960 Stuetz d2', 'rife-v4.6', 960, 2),
  V('v4.6 960 -u Stuetz d2', 'rife-v4.6', 960, 2, ['-u']),
  V('v4.6 360 direkt + Rand', 'rife-v4.6', 360, 0, [], null, RAND),
  V('v4.6 960 -x -z + Rand', 'rife-v4.6', 960, 0, ['-x', '-z'], null, RAND),
  V('v4 960 direkt + Rand', 'rife-v4', 960, 0, [], null, RAND),
  V('v4.6 960 Stuetz d2 + Rand', 'rife-v4.6', 960, 2, [], null, RAND),
];
// Randsprung: mittlere Grauwert-Abweichung des ersten/letzten Fensterbildes (t = 1/(D+1), D/(D+1)) vom Endbild,
// in "Blendschritten" = mittlere |a - (b-1)| / (D+1) (so weit laeuft die lineare Blende je Bild; Blende = 1)
const madG = (x, y) => { let s = 0; for (let i = 0; i < x.length; i++) s += Math.abs(x[i] - y[i]); return s / x.length; };
const blendSchritt = madG(GA, GB) / (D + 1);
const TS = [0.2, 0.5, 0.8];   // 0,2 und 0,8 liegen nicht auf dem Stuetzraster: dort unterscheiden sich die Tiefen
const mittel = arr => ({ schaerfe: arr.reduce((s, m) => s + m.schaerfe, 0) / arr.length, geist: arr.reduce((s, m) => s + m.geist, 0) / arr.length, blendAbst: arr.reduce((s, m) => s + m.blendAbst, 0) / arr.length });
const versuche = [];
const bodenBlende = mittel(TS.map(t => masse(blende(t), t)));
const bodenSchnitt = mittel(TS.map(t => masse(t < 0.5 ? q360(B - 1) : q360(A), t)));
console.log('Boden Blende', JSON.stringify(bodenBlende), '| harter Schnitt', JSON.stringify(bodenSchnitt));
const tafel = [];   // Versuchstafel: je Variante t=1/4, 1/2, 3/4 verkleinert
for (const v of VARIANTEN) {
  const tv = performance.now(), ip = interpolator(v);
  const ts = v.ts || TS, bilder = await Promise.all(ts.map(t => ip(t)));
  const je = bilder.map((b, i) => masse(b, ts[i])), m = mittel(je);
  let randSchritte = null;
  if (!v.ts) {
    const [r0, r1] = await Promise.all([ip(1 / (D + 1)), ip(D / (D + 1))]);
    randSchritte = (madG(grau(r0), GB) + madG(grau(r1), GA)) / 2 / blendSchritt;
  }
  versuche.push({ ...v, messT: ts, ...m, randSchritte, jeT: je, sekunden: +((performance.now() - tv) / 1000).toFixed(1) });
  tafel.push({ name: v.name, bilder });
  console.log(`  ${v.name.padEnd(24)} schaerfe ${m.schaerfe.toFixed(3)} geist ${(100 * m.geist).toFixed(1)} % blendAbst ${m.blendAbst.toFixed(3)} randsprung ${randSchritte === null ? '-' : randSchritte.toFixed(1)}  (${((performance.now() - tv) / 1000).toFixed(1)} s)`);
}
// Wahl: nur Varianten, die jeden Zeitschritt koennen und am Fensterrand hoechstens 3 Blendschritte springen
// (sonst ruckt die Naht - erster Lauf mit "v4 960 direkt": Naht-MAD 9,5 gegen 0,5 bei Ruecklauf/Rueckmorph);
// darunter kleinster Geisterbild-Anteil, und unter denen hoechstens 2 Prozentpunkte darueber die schaerfste.
const tauglich = versuche.filter(x => !x.ts && x.randSchritte <= 3);
const gMin = Math.min(...tauglich.map(x => x.geist));
if (!tauglich.length) throw new Error('keine Variante ohne Randsprung');
const beste = tauglich.filter(x => x.geist <= gMin + 0.02).reduce((p, q) => (q.schaerfe > p.schaerfe ? q : p));
console.log('Wahl:', beste.name, zeit());

// Versuchstafel als PNG (Zeile je Variante: die drei Messzeitpunkte, je 180 px, Name per drawtext waere Schriftabhaengig -> Chrome-Beschriftung links)
{
  const KW = 180, zeilen = [{ name: 'lineare Blende (Boden)', bilder: TS.map(blende) }, ...tafel];
  const html = '<html><head><meta charset="utf-8"><style>html,body{margin:0;background:#111}.z{height:' + KW + 'px;width:260px;box-sizing:border-box;padding:8px 10px;color:#fff;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:20px;border-bottom:1px solid #222}i{font-style:normal;color:#ccc;font-size:12.5px}</style></head><body>' +
    zeilen.map(z => { const m = z.name.startsWith('lineare') ? bodenBlende : versuche.find(x => x.name === z.name); return `<div class="z"><b>${z.name}</b><br><i>Schärfe ${komma(m.schaerfe, 3)}<br>Geisterbild ${komma(100 * m.geist, 1)} %<br>Blendabstand ${komma(m.blendAbst, 3)}${m.randSchritte != null ? '<br>Randsprung ' + komma(m.randSchritte, 1) + ' Blendschritte' : ''}</i></div>`; }).join('') + '</body></html>';
  const lab = `${TMP}/tafel-label.png`, profil = `${TMP}/.profil`;
  spawnSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--user-data-dir=${profil}`, `--screenshot=${lab}`, `--window-size=260,${KW * zeilen.length}`, 'data:text/html;charset=utf-8,' + encodeURIComponent(html)], { timeout: 90000 });
  const W = 3 * KW, buf = Buffer.alloc(W * KW * zeilen.length * 3);
  zeilen.forEach((z, zi) => z.bilder.forEach((b, bi) => {
    for (let y = 0; y < KW; y++) for (let x = 0; x < KW; x++) for (let c = 0; c < 3; c++) {
      let s = 0; for (const [dy, dx] of [[0, 0], [0, 1], [1, 0], [1, 1]]) s += b[((2 * y + dy) * OW + 2 * x + dx) * 3 + c];
      buf[((zi * KW + y) * W + bi * KW + x) * 3 + c] = s >> 2;
    }
  }));
  const r = spawnSync(FFMPEG, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${KW * zeilen.length}`, '-i', '-', '-i', lab,
    '-filter_complex', '[1][0]hstack=inputs=2', '-frames:v', '1', `${OUT}/glut-rife-versuche.png`], { input: buf });
  if (r.status !== 0) throw new Error(r.stderr.toString());
}
const bericht = { takt, A, B, L, D, P, wahlRegel: 'Randsprung <= 3 Blendschritte, dann kleinster Geisterbild-Anteil, darunter (<= +2 Prozentpunkte) die schaerfste', blendSchritt, beste: beste.name, boden: { blende: bodenBlende, harterSchnitt: bodenSchnitt }, versuche };
fs.writeFileSync(`${HIER}/rife-schleife.json`, JSON.stringify(bericht, null, 1));
if (nurVersuche) { console.log('fertig (nur Versuche)', zeit()); process.exit(0); }

// ---------------------------------------------------------------- Rendern
const nutPfad = k => `${TMP}/k${k}.nut`;
function schreiber(k) {
  const p = spawn(FFMPEG, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${OW}x${OW}`, '-r', String(FPS), '-i', '-', '-c:v', 'ffv1', nutPfad(k)], { stdio: ['pipe', 'inherit', 'inherit'] });
  const fertig = new Promise((ok, fehl) => p.on('close', x => (x === 0 ? ok() : fehl(new Error('ffmpeg ' + x)))));
  return { schreib: b => new Promise(ok => (p.stdin.write(b) ? ok() : p.stdin.once('drain', ok))), ende: () => { p.stdin.end(); return fertig; } };
}
const ip = interpolator(beste), mitte = Math.floor(D / 2);
const smooth = u => u * u * (3 - 2 * u);
// Abbremsen wie rueckmorph.mjs Kachel 4: Tempo cT bis T1, dann cos²-Auslauf ueber Bn = D Bilder, deckt a..b-1 in L Bildern
const Bn = D, T1 = L - 1 - Bn, cT = (L - 1) / (L - 1 - Bn / 2);
const quellzeit = t => t <= T1 ? cT * t : cT * T1 + cT * ((t - T1) / 2 + Bn / (2 * Math.PI) * Math.sin(Math.PI * (t - T1) / Bn));

// Kachel 1: RIFE direkt, Fensterzeitschritte (k+1)/(D+1)
const tr = performance.now();
const fenster1 = await Promise.all(Array.from({ length: D }, (_, k) => ip((k + 1) / (D + 1))));
let w = schreiber(1);
for (let t = 0; t < L; t++) await w.schreib(q360(A + t));
for (const b of fenster1) await w.schreib(b);
await w.ende();
console.log('Kachel 1 fertig', zeit());
// Kachel 2: Abbremsen, Zwischenbilder zwischen Nachbarbildern ebenfalls RIFE (v4.6, 360); Fenster smoothstep((j+1)/(D+1))
const pngQ = new Map();
const quellPng = k => { if (!pngQ.has(k)) pngQ.set(k, png(q360(k), OW, `${TMP}/q${k}.png`)); return pngQ.get(k); };
const lauf2 = await Promise.all(Array.from({ length: L }, async (_, t) => {
  const sq = quellzeit(t), k0 = Math.floor(sq + 1e-6), f = sq - k0;
  if (f < 1e-4 || k0 >= L - 1) return q360(A + Math.min(k0, L - 1));
  return roh(await rife(quellPng(A + k0), quellPng(A + k0 + 1), neuPng('l'), f), OW);
}));
const fenster2 = await Promise.all(Array.from({ length: D }, (_, j) => ip(smooth((j + 1) / (D + 1)))));
w = schreiber(2);
for (const b of [...lauf2, ...fenster2]) await w.schreib(b);
await w.ende();
console.log('Kachel 2 fertig', zeit());
// Kachel 3/4 aus den bisherigen Kachelvideos zuschneiden
const ausschnitt = (datei, x, k) => {
  const rp = JSON.parse(spawnSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate', '-of', 'json', datei]).stdout).streams[0];
  if (rp.width !== 4 * OW || rp.height !== OW + 40 || rp.r_frame_rate !== '24/1') throw new Error('Vergleichsvideo unerwartet ' + datei);
  const r = spawnSync(FFMPEG, ['-y', '-v', 'error', '-i', datei, '-vf', `crop=${OW}:${OW}:${x}:40,trim=end_frame=${P},setpts=N/${FPS}/TB`, '-c:v', 'ffv1', nutPfad(k)]);
  if (r.status !== 0) throw new Error(r.stderr.toString());
};
ausschnitt(`${OUT}/glut-ruecklauf.mp4`, 2 * OW, 3);
ausschnitt(`${OUT}/glut-rueckmorph.mp4`, 3 * OW, 4);
const sek = ((performance.now() - tr) / 1000).toFixed(1);

// Beschriftung per headless Chrome
const Ds = komma(D / FPS), Ps = komma(P / FPS), mod = beste.name;
const labels = [
  ['RIFE direkt', `Periode ${Ps} s · ${Ds} s linear · ${mod}`],
  ['RIFE + Abbremsen', `Periode ${Ps} s · sin² ${Ds} s, Tempo ×${komma(cT)}`],
  ['Rücklauf + massive Unschärfe (8 %)', `Periode ${Ps} s · aus glut-ruecklauf.mp4`],
  ['Rückmorph + Abbremsen (eigener Fluss)', `Periode ${Ps} s · aus glut-rueckmorph.mp4`],
];
const html = '<html><head><meta charset="utf-8"><style>html,body{margin:0;background:#111}' +
  `.w{display:flex}.c{width:${OW}px;height:40px;box-sizing:border-box;padding:3px 8px;` +
  'background:#141414;color:#fff;font-family:Helvetica,Arial,sans-serif;overflow:hidden;white-space:nowrap}' +
  'b{display:block;font-size:15px;line-height:18px;font-weight:700}' +
  'i{display:block;font-style:normal;font-size:11.5px;line-height:15px;color:#d8d8d8}</style></head>' +
  '<body><div class="w">' + labels.map(([p, q]) => `<div class="c"><b>${p}</b><i>${q}</i></div>`).join('') + '</div></body></html>';
const beschr = `${HIER}/rife-beschriftung.png`;
if (fs.existsSync(beschr)) fs.unlinkSync(beschr);
spawnSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--force-device-scale-factor=1', `--user-data-dir=${TMP}/.profil2`, `--screenshot=${beschr}`, `--window-size=${OW * 4},40`,
  'data:text/html;charset=utf-8,' + encodeURIComponent(html)], { timeout: 90000 });
if (!fs.existsSync(beschr)) throw new Error('Beschriftung fehlt');

// Zusammensetzen
const GES = LOOPS * P, ziel = `${OUT}/glut-rife.mp4`;
const g = ['[4]split=4[l0][l1][l2][l3]'];
for (let k = 0; k < 4; k++) {
  g.push(`[l${k}]crop=${OW}:40:${OW * k}:0[c${k}]`);
  g.push(`[${k}]loop=loop=${LOOPS - 1}:size=${P}:start=0,trim=end_frame=${GES},setpts=N/${FPS}/TB,pad=${OW}:${OW + 40}:0:40:color=0x141414[v${k}]`);
  g.push(`[v${k}][c${k}]overlay=0:0[t${k}]`);
}
g.push('[t0][t1][t2][t3]hstack=inputs=4,format=yuv420p[out]');
let r = spawnSync(FFMPEG, ['-y', '-v', 'error', ...[1, 2, 3, 4].flatMap(k => ['-i', nutPfad(k)]), '-i', beschr, '-filter_complex', g.join(';'),
  '-map', '[out]', '-r', String(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-movflags', '+faststart', ziel]);
if (r.status !== 0) throw new Error(r.stderr.toString());

// Standbild Fenstermitte (Ausgabebild L + mitte): Kachel 1 | 3 | 4
const bildAus = (k, n) => {
  const x = spawnSync(FFMPEG, ['-v', 'error', '-i', nutPfad(k), '-vf', `select=eq(n\\,${n})`, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 26 });
  if (x.status !== 0 || x.stdout.length !== m3) throw new Error('Standbild ' + x.stderr.toString());
  return x.stdout;
};
const drei = [fenster1[mitte], bildAus(3, L + mitte), bildAus(4, L + mitte)], still = Buffer.alloc(3 * m3);
for (let y = 0; y < OW; y++) drei.forEach((b, j) => b.copy(still, (y * 3 * OW + j * OW) * 3, y * OW * 3, (y + 1) * OW * 3));
const mittePng = `${OUT}/glut-rife-mitte.png`;
r = spawnSync(FFMPEG, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${3 * OW}x${OW}`, '-i', '-', '-i', beschr,
  '-filter_complex', `[1]split=3[x][y][z];[x]crop=${OW}:40:0:0[l1];[y]crop=${OW}:40:${2 * OW}:0[l3];[z]crop=${OW}:40:${3 * OW}:0[l4];[l1][l3][l4]hstack=3[l];[l][0]vstack=inputs=2`,
  '-frames:v', '1', mittePng], { input: still });
if (r.status !== 0) throw new Error(r.stderr.toString());

// Fenster-Verlauf der gewaehlten Variante: Masse je Fensterbild und Nachbarbild-Abstand (Flackern der Stuetzbilder?)
const verlauf = fenster1.map((b, k) => ({ t: +((k + 1) / (D + 1)).toFixed(4), ...masse(b, (k + 1) / (D + 1)) }));
const nachbar = [q360(B - 1), ...fenster1, q360(A)].map(grau);
const nachbarMAD = nachbar.slice(1).map((gg, i) => { let s = 0; for (let j = 0; j < gg.length; j++) s += Math.abs(gg[j] - nachbar[i][j]); return +(s / gg.length).toFixed(2); });

// Pruefung: ffprobe + Bildvergleich k gegen k+P je Kachel, Naht P-1 -> P
const pr = JSON.parse(spawnSync(FFPROBE, ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries',
  'stream=width,height,nb_read_frames,r_frame_rate,duration', '-show_entries', 'format=duration', '-of', 'json', ziel]).stdout);
console.log('ffprobe', JSON.stringify(pr.streams[0]), 'format', pr.format.duration);
const KW = 90, KH = 100, kl = spawnSync(FFMPEG, ['-v', 'error', '-i', ziel, '-vf', `scale=${4 * KW}:${KH}`, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: 1 << 28 }).stdout;
const mm = 4 * KW * KH, nb = kl.length / mm;
const mad = (a, b, kachel) => { let d = 0; for (let y = 10; y < KH; y++) for (let x = 0; x < KW; x++) { const i = y * 4 * KW + kachel * KW + x; d += Math.abs(kl[a * mm + i] - kl[b * mm + i]); } return d / ((KH - 10) * KW); };
const pruef = [];
for (let kachel = 0; kachel < 4; kachel++) {
  let maxPer = 0, maxNach = 0, summeNach = 0;
  for (let k = 0; k + 1 < nb; k++) {
    if (k + P < nb) maxPer = Math.max(maxPer, mad(k, k + P, kachel));
    const e = mad(k, k + 1, kachel); maxNach = Math.max(maxNach, e); summeNach += e;
  }
  pruef.push({ kachel: kachel + 1, maxPer: +maxPer.toFixed(3), nahtMAD: [mad(P - 1, P, kachel), mad(2 * P - 1, 2 * P, kachel)].map(x => +x.toFixed(2)), mittelNachbar: +(summeNach / (nb - 1)).toFixed(2), maxNachbar: +maxNach.toFixed(2) });
}
console.log('Pruefung', JSON.stringify(pruef));
console.log('Fenster Nachbar-MAD (b-1 .. a)', nachbarMAD.join(' '));
Object.assign(bericht, { render: { sekunden: sek, cT, Bn, mitteT: (mitte + 1) / (D + 1), fensterVerlauf: verlauf, nachbarMAD, ffprobe: pr, pruef } });
fs.writeFileSync(`${HIER}/rife-schleife.json`, JSON.stringify(bericht, null, 1));
console.log('ZIEL', ziel, mittePng, 'gesamt', zeit());
