#!/usr/bin/env node
// Ruecklauf-Probe fuer "Glut und Eis - Die Braut von Corinth" (Laborprobe, Anfrage Caspar_D 15.09.2026).
// Nach dem Vorwaertslauf [A, B) spult das Video im Fenster D rueckwaerts von B-1 bis A zurueck (wie ein Band),
// dann beginnt es wieder bei A. Nur echte Bilder, keine Verzerrung; die Naht ist zeitlich stetig.
// Ausschnitt, Takt und D aus rueckmorph.json (direkter Vergleich mit glut-rueckmorph.mp4, gleiche Periode).
//
// Quellposition s(t) (Quellbilder ab A) je Ausgabebild t, Periode P = F + D:
//   Vorwaerts t in [0, F], F = L: Tempo c * e(t), e = sin²-Anlauf ueber R, 1, sin²-Abbremsen ueber R; s(F) = L-1.
//   R = D/2 je Seite: Anlauf + Abbremsen kosten zusammen genau einen Takt Ruhe - so viel wie das Abbremsen in
//   Kachel 4 -, und das Vorwaertstempo c = (L-1)/(F-R) liegt dann fast gleich auf (x1,10 gegen x1,11).
//   Rueckwaerts t in [F, P]: Tempo -vmax sin²(pi tau), tau = (t-F)/D, vmax = 2 (L-1)/D; Integral = genau L-1.
//   Tempo ist ueberall stetig und an beiden Wenden 0.
import { spawnSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '../../../..');
const ID = '89ef9f63-c885-4fe5-b082-8e2bf9513c4d';
const QUELLE = `${WURZEL}/library/songs/${ID}/artwork.sprung.mp4`;
const FFMPEG = '/usr/local/bin/ffmpeg', FFPROBE = '/usr/local/bin/ffprobe';
const OUT = path.resolve(HIER, '..');
const VERGLEICH = `${OUT}/glut-rueckmorph.mp4`;
const FPS = 24, OW = 360, LOOPS = 3;
const SIGMA_ANTEIL = 0.035;       // Vergleich: halbe Unschaerfe, der Ruecklauf soll erkennbar bleiben
const t0 = performance.now(), zeit = () => ((performance.now() - t0) / 1000).toFixed(1) + ' s';
const komma = (x, st = 2) => x.toFixed(st).replace('.', ',');

const rm = JSON.parse(fs.readFileSync(`${HIER}/rueckmorph.json`, 'utf8'));
const { takt, A, B, L } = rm;
const D = Math.round(takt * FPS);            // ein Takt
const F = L, P = F + D, S = L - 1;
if (P !== rm.P) throw new Error(`Periode ${P} weicht von rueckmorph ${rm.P} ab`);
if (P / FPS > 10) throw new Error('Periode > 10 s');
const R = D / 2, c = S / (F - R), vmax = 2 * S / D;
const ramp = u => c * (u / 2 - R / (2 * Math.PI) * Math.sin(Math.PI * u / R));   // Integral des sin²-Anlaufs
function s(t) {
  t = ((t % P) + P) % P;
  if (t <= F) {
    if (t < R) return ramp(t);
    if (t <= F - R) return c * (R / 2 + (t - R));
    return S - ramp(F - t);
  }
  const tau = (t - F) / D;
  return S * (1 - (tau - Math.sin(2 * Math.PI * tau) / (2 * Math.PI)));
}
console.log(`Takt ${takt.toFixed(4)} s, [${A}, ${B}) L=${L}, D=${D} (${komma(D / FPS, 3)} s), P=${P} = ${komma(P / FPS)} s,`,
  `R=${R}, vorwaerts x${c.toFixed(4)}, Ruecklauf mittel x${(S / D).toFixed(2)} max x${vmax.toFixed(2)}`);
// Kontrolle der Stetigkeit
console.log('s(0)', s(0).toFixed(4), 's(F)', s(F).toFixed(4), 's(F-R)', s(F - R).toFixed(4), 's(R)', s(R).toFixed(4), 's(P-1e-9)', s(P - 1e-9).toFixed(4));

// Quellbilder A..B-1 in Ausgabegroesse
const r0 = spawnSync(FFMPEG, ['-v', 'error', '-i', QUELLE, '-vf', `scale=${OW}:${OW}:flags=lanczos`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 30 });
if (r0.status !== 0) throw new Error(r0.stderr.toString());
const on = OW * OW, m3 = on * 3, NQ = r0.stdout.length / m3;
if (NQ < B) throw new Error('zu wenig Quellbilder ' + NQ);
const bild = k => r0.stdout.subarray((A + k) * m3, (A + k + 1) * m3);     // k = 0..S
const LIN = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 255; LIN[i] = x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }
const ZUR = new Uint8Array(4097); for (let i = 0; i <= 4096; i++) { const x = i / 4096; ZUR[i] = Math.round(255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055)); }
const zuByte = v => ZUR[v <= 0 ? 0 : v >= 1 ? 4096 : Math.round(v * 4096)];
const nah = t => Math.min(S, Math.max(0, Math.round(s(t))));

// Bandspulen-Schmier: Belichtung ueber [t-1/2, t+1/2] (360°-Verschluss), jedes ueberstrichene Quellbild k
// mit dem Anteil seiner Zelle [k-1/2, k+1/2] am Intervall gewichtet, in linearem Licht gemittelt.
function schmier(t) {
  let lo = s(t - 0.5), hi = s(t + 0.5); if (lo > hi) [lo, hi] = [hi, lo];
  lo = Math.max(-0.5, lo); hi = Math.min(S + 0.5, hi);
  const gew = [];
  if (hi - lo < 1e-9) gew.push([nah(t), 1]);
  else for (let k = Math.max(0, Math.round(lo)); k <= Math.min(S, Math.round(hi)); k++) {
    const w = Math.min(hi, k + 0.5) - Math.max(lo, k - 0.5); if (w > 0) gew.push([k, w / (hi - lo)]);
  }
  const lin = new Float32Array(m3);
  for (const [k, w] of gew) { const b = bild(k); for (let i = 0; i < m3; i++) lin[i] += w * LIN[b[i]]; }
  return { lin, n: gew.length };
}
const zuRgb = lin => { const o = Buffer.alloc(m3); for (let i = 0; i < m3; i++) o[i] = zuByte(lin[i]); return o; };
// gblur (sigma UND sigmaV) auf linearem Licht, gbrpf32le
function unschaerfe(lin, sigma) {
  if (sigma < 0.05) return lin;
  const pl = Buffer.alloc(m3 * 4);
  const ord = [1, 2, 0];   // gbrp: G, B, R
  for (let p = 0; p < 3; p++) for (let i = 0; i < on; i++) pl.writeFloatLE(lin[i * 3 + ord[p]], (p * on + i) * 4);
  const r = spawnSync(FFMPEG, ['-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'gbrpf32le', '-s', `${OW}x${OW}`, '-i', '-',
    '-vf', `gblur=sigma=${sigma.toFixed(3)}:sigmaV=${sigma.toFixed(3)}:steps=6`, '-f', 'rawvideo', '-pix_fmt', 'gbrpf32le', '-'], { input: pl, maxBuffer: 1 << 28 });
  if (r.status !== 0 || r.stdout.length !== m3 * 4) throw new Error('gblur ' + r.stderr.toString());
  const o = new Float32Array(m3);
  for (let p = 0; p < 3; p++) for (let i = 0; i < on; i++) o[i * 3 + ord[p]] = r.stdout.readFloatLE((p * on + i) * 4);
  return o;
}

const nutPfad = k => `${HIER}/ruecklauf-k${k}.nut`;
function schreiber(k) {
  const p = spawn(FFMPEG, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${OW}x${OW}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'ffv1', nutPfad(k)], { stdio: ['pipe', 'inherit', 'inherit'] });
  const fertig = new Promise((ok, fehl) => p.on('close', x => (x === 0 ? ok() : fehl(new Error('ffmpeg ' + x)))));
  return { schreib: b => new Promise(ok => (p.stdin.write(b) ? ok() : p.stdin.once('drain', ok))), ende: () => { p.stdin.end(); return fertig; } };
}

const SIGMA = SIGMA_ANTEIL * OW, mitte = Math.floor(D / 2);
const still = {}, spur = [];
let maxN = 0;
const w1 = schreiber(1), w2 = schreiber(2), w3 = schreiber(3);
for (let t = 0; t < P; t++) {
  if (t < F) {
    const b = bild(nah(t));
    await w1.schreib(b); await w2.schreib(b); await w3.schreib(b);
    spur.push([t, +s(t).toFixed(3), nah(t)]);
    continue;
  }
  const j = t - F, tau = j / D;
  const b1 = bild(nah(t));
  const { lin, n } = schmier(t); maxN = Math.max(maxN, n);
  const b2 = zuRgb(lin);
  const sg = SIGMA * Math.sin(Math.PI * tau) ** 2;      // gleicher Verlauf wie das Rueckspultempo
  const b3 = zuRgb(unschaerfe(lin, sg));
  await w1.schreib(b1); await w2.schreib(b2); await w3.schreib(b3);
  spur.push([t, +s(t).toFixed(3), nah(t), n, +sg.toFixed(2)]);
  if (j === mitte) Object.assign(still, { 1: Buffer.from(b1), 2: b2, 3: b3, t, s: s(t), n, sg });
}
await Promise.all([w1.ende(), w2.ende(), w3.ende()]);
console.log('Kacheln 1-3 fertig, hoechstens', maxN, 'Quellbilder je Ausgabebild,', zeit());

// Kachel 4: aus glut-rueckmorph.mp4 zuschneiden (gleicher Ausschnitt, gleiche Periode P, dort Kachel 4 bei x = 3*OW)
const rp = JSON.parse(spawnSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate', '-of', 'json', VERGLEICH]).stdout).streams[0];
if (rp.width !== 4 * OW || rp.height !== OW + 40 || rp.r_frame_rate !== '24/1') throw new Error('Vergleichsvideo unerwartet ' + JSON.stringify(rp));
let r = spawnSync(FFMPEG, ['-y', '-v', 'error', '-i', VERGLEICH, '-vf', `crop=${OW}:${OW}:${3 * OW}:40,trim=end_frame=${P},setpts=N/${FPS}/TB`,
  '-c:v', 'ffv1', nutPfad(4)]);
if (r.status !== 0) throw new Error(r.stderr.toString());

// Beschriftung per headless Chrome
const Ds = komma(D / FPS), Ps = komma(P / FPS);
const labels = [
  ['schneller Rücklauf', `Periode ${Ps} s · ${Ds} s sin², bis ×${komma(vmax, 1)} zurück`],
  ['Rücklauf + Bewegungsunschärfe', `Periode ${Ps} s · linear gemittelt, bis ${maxN} Bilder`],
  ['Rücklauf + massive Unschärfe', `Periode ${Ps} s · + Gauß σ bis ${Math.round(SIGMA)} px (${Math.round(100 * SIGMA_ANTEIL)} %)`],
  ['Rückmorph + Abbremsen', `Periode ${Ps} s · aus glut-rueckmorph.mp4`],
];
const html = '<html><head><meta charset="utf-8"><style>html,body{margin:0;background:#111}' +
  `.w{display:flex}.c{width:${OW}px;height:40px;box-sizing:border-box;padding:3px 8px;` +
  'background:#141414;color:#fff;font-family:Helvetica,Arial,sans-serif;overflow:hidden;white-space:nowrap}' +
  'b{display:block;font-size:15px;line-height:18px;font-weight:700}' +
  'i{display:block;font-style:normal;font-size:11.5px;line-height:15px;color:#d8d8d8}</style></head>' +
  '<body><div class="w">' + labels.map(([p, q]) => `<div class="c"><b>${p}</b><i>${q}</i></div>`).join('') + '</div></body></html>';
const png = `${HIER}/ruecklauf-beschriftung.png`;
if (fs.existsSync(png)) fs.unlinkSync(png);
const profil = `${HIER}/.profil-${process.pid}`;
spawnSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--force-device-scale-factor=1', `--user-data-dir=${profil}`, `--screenshot=${png}`, `--window-size=${OW * 4},40`,
  'data:text/html;charset=utf-8,' + encodeURIComponent(html)], { timeout: 90000 });
fs.rmSync(profil, { recursive: true, force: true });
if (!fs.existsSync(png)) throw new Error('Beschriftung fehlt');

// Zusammensetzen
const GES = LOOPS * P, ziel = `${OUT}/glut-ruecklauf-halb.mp4`;
const g = ['[4]split=4[l0][l1][l2][l3]'];
for (let k = 0; k < 4; k++) {
  g.push(`[l${k}]crop=${OW}:40:${OW * k}:0[c${k}]`);
  g.push(`[${k}]loop=loop=${LOOPS - 1}:size=${P}:start=0,trim=end_frame=${GES},setpts=N/${FPS}/TB,pad=${OW}:${OW + 40}:0:40:color=0x141414[v${k}]`);
  g.push(`[v${k}][c${k}]overlay=0:0[t${k}]`);
}
g.push('[t0][t1][t2][t3]hstack=inputs=4,format=yuv420p[out]');
r = spawnSync(FFMPEG, ['-y', '-v', 'error', ...[1, 2, 3, 4].flatMap(k => ['-i', nutPfad(k)]), '-i', png, '-filter_complex', g.join(';'),
  '-map', '[out]', '-r', String(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-movflags', '+faststart', ziel]);
if (r.status !== 0) throw new Error(r.stderr.toString());

// Standbild Fenstermitte: Kachel 1 | 2 | 3
const drei = Buffer.alloc(3 * m3);
for (let y = 0; y < OW; y++) for (let k = 0; k < 3; k++) still[k + 1].copy(drei, (y * 3 * OW + k * OW) * 3, y * m3 / OW, (y + 1) * m3 / OW);
const mittePng = `${OUT}/glut-ruecklauf-halb-mitte.png`;
r = spawnSync(FFMPEG, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${3 * OW}x${OW}`, '-i', '-', '-i', png,
  '-filter_complex', `[1]crop=${3 * OW}:40:0:0[l];[l][0]vstack=inputs=2`, '-frames:v', '1', mittePng], { input: drei });
if (r.status !== 0) throw new Error(r.stderr.toString());

// Pruefung: ffprobe + Bildvergleich k gegen k+P (je Kachel) und Naht P-1 -> P gegen Nachbarbilder
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
  const naht = [mad(P - 1, P, kachel), mad(2 * P - 1, 2 * P, kachel)];
  pruef.push({ kachel: kachel + 1, maxPer: +maxPer.toFixed(3), nahtMAD: naht.map(x => +x.toFixed(2)), mittelNachbar: +(summeNach / (nb - 1)).toFixed(2), maxNachbar: +maxNach.toFixed(2) });
}
console.log('Pruefung', JSON.stringify(pruef));
const bericht = { takt, A, B, L, D, P, periodeSekunden: P / FPS, R, vorwaerts: c, rueckMittel: S / D, rueckMax: vmax, sigmaMax: SIGMA, maxBilderJeAusgabe: maxN,
  mitte: { t: still.t, s: still.s, bilder: still.n, sigma: still.sg }, ffprobe: pr, pruef, spurFenster: spur.slice(F - 3) };
fs.writeFileSync(`${HIER}/ruecklauf-halb.json`, JSON.stringify(bericht, null, 1));
for (let k = 1; k <= 4; k++) fs.unlinkSync(nutPfad(k));
console.log('ZIEL', ziel, mittePng, 'gesamt', zeit());
