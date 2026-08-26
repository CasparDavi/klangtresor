#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Musikstil vermessen: Klang-Embedding, Stil, Genre, Stimmung und
 * Instrumente je Song - lokal, ohne Python, ohne Netz.
 *
 *   node bin/klang.js                  alle Songs ohne Eintrag
 *   node bin/klang.js <id>             nur diesen Song (und zeigen)
 *   node bin/klang.js --anzahl 5       nur fuenf (zum Probieren)
 *   node bin/klang.js --still          ohne Lebenszeichen je Song
 *   node bin/klang.js --neu            alle neu rechnen (nach Aenderungen hier)
 *   node bin/klang.js <id> --pruefen   Zwischenwerte (PCM, Mel, Netz) zeigen
 *
 * Ergebnis: library/klang.json  { stand, modell, songs: { id: {...} } }
 *   emb          1280 Zahlen - die "Ohren" der KI (Discogs-EffNet),
 *                Grundlage fuer Karte und Cluster (bin/karte.js)
 *   stile        Top 5 der 400 Discogs-Stile (Modellkopf des EffNet)
 *   genre        Top 5 der 87 MTG-Jamendo-Genres
 *   stimmung     Top 5 der 56 MTG-Jamendo-Stimmungen/Themen
 *   instrumente  Top 5 der 40 MTG-Jamendo-Instrumente
 *   patches      wie viele 2-Sekunden-Fenster gemittelt wurden
 *
 * Modelle (library/modelle/, einmalig geholt, zusammen 27 MB):
 *   discogs-effnet-bsdynamic-1.onnx     Embedding + 400 Stile (Essentia)
 *   mtg_jamendo_{genre,moodtheme,instrument}-discogs-effnet-1.onnx
 *   dazu je ein .json mit den Klassennamen (von essentia.upf.edu/models)
 *
 * Vorverarbeitung EXAKT wie Essentias TensorflowInputMusiCNN /
 * TensorflowPredictEffnetDiscogs (aus dem C++-Quellcode abgelesen,
 * 21.08.2026 - der alte SunoAnalyzer hatte die Achsen vertauscht und
 * HTK-Mel statt Slaney benutzt, seine Werte waren deshalb nicht
 * vergleichbar):
 *   16 kHz mono · Frames 512, Hop 256, Hann (symmetrisch, unnormiert)
 *   Betragsspektrum^2 (MelBands type=power) · 96 Slaney-Mel-Baender
 *   0..8000 Hz, lineare Dreiecke, Normierung unit_tri (Flaeche 1)
 *   log10(1 + 10000 * x) · Patches 128 Frames, Hop 62
 *   Eingang [Batch, 128, 96]; Ausgaenge: activations [B,400],
 *   embeddings [B,1280]. Alle Patches eines Songs gemittelt.
 *
 * Laeuft mit onnxruntime-node (package.json; einzige Abhaengigkeit).
 * Rechnet mit allen Kernen; etwa 10-20 s je Song auf dem Intel-Mac.
 * Der Morgenlauf ruft ihn fuer neue Songs; er ueberspringt, was er
 * schon hat. Mac bleibt wach: caffeinate kommt vom Morgenschritt oder
 * der Selbsthuelle unten (wie in whisper.js).
 */
'use strict';
const fs   = require('node:fs');
const path = require('node:path');
const os   = require('node:os');
const { spawnSync } = require('node:child_process');

const WURZEL  = path.join(__dirname, '..');
const SONGS   = path.join(WURZEL, 'library', 'songs');
const MODELLE = path.join(WURZEL, 'library', 'modelle');
const ZIEL    = path.join(WURZEL, 'library', 'klang.json');
const args    = process.argv.slice(2);

if (process.platform === 'darwin' && !process.env.KLANG_WACH) {
  const r = spawnSync('caffeinate', ['-i', process.execPath, __filename, ...args],
    { stdio: 'inherit', env: { ...process.env, KLANG_WACH: '1' } });
  process.exit(r.status === null ? 1 : r.status);
}

const K   = require('./katalog.js');
const ort = require('onnxruntime-node');

const nur    = args.find(a => /^[0-9a-f-]{36}$/.test(a));
const still  = args.includes('--still');
const pruefen = args.includes('--pruefen');   // Zwischenwerte zeigen
const anzahl = args.includes('--anzahl') ? +args[args.indexOf('--anzahl') + 1] : Infinity;

/* ---- Mel-Vorverarbeitung (Essentia-treu) ---------------------------- */
const SR = 16000, FRAME = 512, HOP = 256, BINS = FRAME / 2 + 1, BAENDER = 96;
const PATCH = 128, PATCH_HOP = 62, F_MAX = SR / 2;

function hz2mel(hz) {                      // Slaney (Auditory Toolbox)
  const lin = 3 / 200;
  if (hz < 1000) return hz * lin;
  return 1000 * lin + Math.log(hz / 1000) / (Math.log(6.4) / 27);
}
function mel2hz(mel) {
  const lin = 3 / 200;
  if (mel < 1000 * lin) return mel / lin;
  return 1000 * Math.exp((mel - 1000 * lin) * (Math.log(6.4) / 27));
}

/* Dreiecksbank wie TriangularBands::createFilters mit weighting=linear
   und normalize=unit_tri. Als duenne Liste (Band -> [jbegin, koeff]). */
function melBank() {
  const mMin = hz2mel(0), mMax = hz2mel(F_MAX);
  const kanten = [];
  for (let i = 0; i < BAENDER + 2; i++) kanten.push(mel2hz(mMin + (mMax - mMin) * i / (BAENDER + 1)));
  const skala = (SR / 2) / (BINS - 1);
  const bank = [];
  for (let b = 0; b < BAENDER; b++) {
    const f0 = kanten[b], f1 = kanten[b + 1], f2 = kanten[b + 2];
    const s1 = f1 - f0, s2 = f2 - f1;
    const jb = Math.ceil(f0 / skala), je = Math.min(BINS - 1, Math.floor(f2 / skala));
    const k = new Float64Array(je - jb + 1);
    const flaeche = (s1 + s2) / 2;          // unit_tri: theoretische Dreiecksflaeche
    for (let j = jb; j <= je; j++) {
      const f = j * skala;
      k[j - jb] = (f < f1 ? (f - f0) / s1 : (f2 - f) / s2) / flaeche;
    }
    bank.push({ jb, k });
  }
  return bank;
}

const HANN = new Float64Array(FRAME);
for (let i = 0; i < FRAME; i++) HANN[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (FRAME - 1));

/* FFT 512 (Radix-2, vorberechnete Drehfaktoren + Bitumkehr).
   Hier stand "Reelle FFT", und das stimmte nie: Das Signal geht reell
   hinein (im = 0), gerechnet wird aber komplex - die halbe Arbeit ist
   umsonst. Eine echte reelle FFT wuerde das auf 1,68x bringen, wie in
   bin/stoerfrequenz.js nachgemessen; sie steht hier trotzdem nicht,
   weil sich der Aufwand nicht lohnt: Die Mel-Frames sind 262 ms eines
   Laufs von 5,3 s (4,9 %), und die FFT ist nur ein Teil davon. Alles
   andere kostet das neuronale Netz, das ohnehin alle Kerne auslastet.
   (26.08.2026, gemessen an einem Song.) */
const BITS = Math.log2(FRAME) | 0;
const UMKEHR = new Uint16Array(FRAME);
for (let i = 0; i < FRAME; i++) { let j = 0; for (let b = 0; b < BITS; b++) j = (j << 1) | ((i >> b) & 1); UMKEHR[i] = j; }
const COS = new Float64Array(FRAME / 2), SIN = new Float64Array(FRAME / 2);
for (let i = 0; i < FRAME / 2; i++) { COS[i] = Math.cos(-2 * Math.PI * i / FRAME); SIN[i] = Math.sin(-2 * Math.PI * i / FRAME); }
const re = new Float64Array(FRAME), im = new Float64Array(FRAME);
function leistungsSpektrum(pcm, von, aus) {
  for (let i = 0; i < FRAME; i++) { const s = von + i; re[UMKEHR[i]] = (s >= 0 && s < pcm.length ? pcm[s] : 0) * HANN[i]; im[i] = 0; }
  for (let len = 2; len <= FRAME; len <<= 1) {
    const schritt = FRAME / len, halb = len >> 1;
    for (let i = 0; i < FRAME; i += len) {
      for (let j = 0; j < halb; j++) {
        const wr = COS[j * schritt], wi = SIN[j * schritt];
        const a = i + j, b = a + halb;
        const vr = re[b] * wr - im[b] * wi, vi = re[b] * wi + im[b] * wr;
        re[b] = re[a] - vr; im[b] = im[a] - vi; re[a] += vr; im[a] += vi;
      }
    }
  }
  for (let k = 0; k < BINS; k++) aus[k] = re[k] * re[k] + im[k] * im[k];
}

const BANK = melBank();
/* Mel-Frames des ganzen Songs als flaches Float32Array [nFrames * 96].
   FrameCutter-Standard: erster Frame um t=0 zentriert (halb Nullen). */
function melFrames(pcm) {
  const n = Math.max(0, Math.floor((pcm.length + FRAME / 2) / HOP) + 1);
  const aus = new Float32Array(n * BAENDER);
  const spek = new Float64Array(BINS);
  for (let t = 0; t < n; t++) {
    leistungsSpektrum(pcm, t * HOP - FRAME / 2, spek);
    for (let b = 0; b < BAENDER; b++) {
      const { jb, k } = BANK[b];
      let s = 0;
      for (let j = 0; j < k.length; j++) s += spek[jb + j] * k[j];
      aus[t * BAENDER + b] = Math.log10(1 + 10000 * s);
    }
  }
  return { daten: aus, n };
}

/* ---- Audio: ffmpeg liefert 16-kHz-Mono als rohe float32 ------------ */
function pcmLaden(mp3) {
  const ff = spawnSync('ffmpeg', ['-v', 'error', '-i', mp3, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'],
    { maxBuffer: 1 << 30 });
  if (ff.status !== 0) throw new Error('ffmpeg: ' + String(ff.stderr || '').trim().slice(0, 120));
  const b = ff.stdout;
  return new Float32Array(b.buffer, b.byteOffset, b.byteLength >> 2);
}

/* ---- Modelle ---------------------------------------------------------- */
const KOEPFE = [
  ['genre',       'mtg_jamendo_genre-discogs-effnet-1'],
  ['stimmung',    'mtg_jamendo_moodtheme-discogs-effnet-1'],
  ['instrumente', 'mtg_jamendo_instrument-discogs-effnet-1'],
];
function klassen(name) { return JSON.parse(fs.readFileSync(path.join(MODELLE, name + '.json'), 'utf8')).classes; }
function top(mittel, namen, n = 5) {
  return Array.from(mittel).map((p, i) => [namen[i], p]).sort((a, b) => b[1] - a[1]).slice(0, n)
    .map(([name, p]) => [name, +p.toFixed(3)]);
}

async function modelleLaden() {
  /* KLANG_CUDA=1: auf Linux mit NVIDIA-Karte zuerst CUDA versuchen
     (onnxruntime-node bringt den Provider mit; braucht CUDA 12 +
     cuDNN 9 im System). Klappt es nicht, CPU - und sagen. */
  const anbieter = process.env.KLANG_CUDA ? ['cuda', 'cpu'] : ['cpu'];
  const opt = { executionProviders: anbieter, graphOptimizationLevel: 'all', intraOpNumThreads: os.cpus().length };
  if (process.env.KLANG_CUDA) {
    try { await ort.InferenceSession.create(path.join(MODELLE, 'mtg_jamendo_genre-discogs-effnet-1.onnx'), { executionProviders: ['cuda'] }); console.log('  CUDA aktiv'); }
    catch (e) { console.log('  CUDA nicht verfügbar (' + String(e.message).split('\n')[0].slice(0, 80) + ') — rechne auf der CPU'); opt.executionProviders = ['cpu']; }
  }
  const effnet = await ort.InferenceSession.create(path.join(MODELLE, 'discogs-effnet-bsdynamic-1.onnx'), opt);
  const koepfe = {};
  for (const [schl, datei] of KOEPFE) {
    koepfe[schl] = { s: await ort.InferenceSession.create(path.join(MODELLE, datei + '.onnx'), opt), namen: klassen(datei) };
  }
  return { effnet, koepfe, stile: klassen('discogs-effnet-bs64-1') };
}

/* ---- Ein Song --------------------------------------------------------- */
const BATCH = 16;
async function vermessen(M, mp3) {
  const pcm = pcmLaden(mp3);
  const { daten, n } = melFrames(pcm);
  if (pruefen) {
    const zaehl = (arr) => { let b = 0; for (let i = 0; i < arr.length; i++) if (!Number.isFinite(arr[i])) b++; return b; };
    console.log(`  pruefen: pcm ${pcm.length} Werte (${zaehl(pcm)} nicht endlich), mel ${n} Frames (${zaehl(daten)} nicht endlich)`);
    console.log(`  pruefen: Bank leer ${BANK.filter(b => !b.k.length).length}, Bank nicht endlich ${BANK.filter(b => zaehl(b.k)).length}`);
    console.log(`  pruefen: mel Frame 1000 = ${Array.from(daten.subarray(1000 * BAENDER, 1000 * BAENDER + 6)).map(v => v.toFixed(3)).join(' ')} …`);
  }
  const starts = [];
  for (let t = 0; t + PATCH <= n; t += PATCH_HOP) starts.push(t);
  if (!starts.length) throw new Error('zu kurz für ein Fenster');

  const emb = new Float64Array(1280), stil = new Float64Array(M.stile.length);
  const patchEmbs = [];                                   // fuer die Streuung (s. u.)
  const koepfe = {};
  for (const schl in M.koepfe) koepfe[schl] = new Float64Array(M.koepfe[schl].namen.length);

  for (let i = 0; i < starts.length; i += BATCH) {
    const teil = starts.slice(i, i + BATCH);
    const x = new Float32Array(teil.length * PATCH * BAENDER);
    teil.forEach((t, p) => x.set(daten.subarray(t * BAENDER, (t + PATCH) * BAENDER), p * PATCH * BAENDER));
    const aus = await M.effnet.run({ [M.effnet.inputNames[0]]: new ort.Tensor('float32', x, [teil.length, PATCH, BAENDER]) });
    const E = aus.embeddings.data, A = aus.activations.data;
    if (pruefen && i === 0) console.log(`  pruefen: emb ${Array.from(E.slice(0, 4)).map(v => v.toFixed(3)).join(' ')} … act ${Array.from(A.slice(0, 4)).map(v => v.toFixed(3)).join(' ')}`);
    for (let p = 0; p < teil.length; p++) {
      patchEmbs.push(Float32Array.from(E.subarray(p * 1280, (p + 1) * 1280)));
      for (let k = 0; k < 1280; k++) emb[k] += E[p * 1280 + k];
      for (let k = 0; k < stil.length; k++) stil[k] += A[p * stil.length + k];
    }
    for (const schl in M.koepfe) {
      const kopf = M.koepfe[schl];
      const r = await kopf.s.run({ [kopf.s.inputNames[0]]: new ort.Tensor('float32', E, [teil.length, 1280]) });
      const P = r[kopf.s.outputNames[0]].data, m = kopf.namen.length;
      for (let p = 0; p < teil.length; p++) for (let k = 0; k < m; k++) koepfe[schl][k] += P[p * m + k];
    }
  }
  const N = starts.length;
  /* Streuung (Caspar_D, 21.08.2026): mittlerer Abstand sqrt(1-cos) der
     einzelnen 2-s-Patches zum Songmittel. Ein Song, der durchgehend
     gleich klingt, liegt bei ~0,3; ein Hybrid (Ballade-Strophe,
     Metal-Refrain) deutlich hoeher. Das Mittel allein wuerde ihn
     irgendwo dazwischen ablegen, wo er zu niemandem passt. */
  const m = Float64Array.from(emb, v => v / N); let nm = 0; for (const v of m) nm += v * v; nm = Math.sqrt(nm) || 1;
  let streu = 0;
  for (const pe of patchEmbs) { let s = 0, np = 0; for (let k = 0; k < 1280; k++) { s += pe[k] * m[k]; np += pe[k] * pe[k]; } streu += Math.sqrt(Math.max(0, 1 - s / (nm * (Math.sqrt(np) || 1)))); }
  const e = {
    streuung: +(streu / N).toFixed(3),
    emb: Array.from(emb, v => +(v / N).toFixed(4)),
    stile: top(stil.map(v => v / N), M.stile),
    patches: N, sekunden: +(pcm.length / SR).toFixed(1),
  };
  for (const schl in koepfe) e[schl] = top(koepfe[schl].map(v => v / N), M.koepfe[schl].namen);
  return e;
}

/* ---- Lauf --------------------------------------------------------------- */
(async () => {
  let alt = { songs: {} };
  try { alt = JSON.parse(fs.readFileSync(ZIEL, 'utf8')); } catch (e) {}
  const ergebnis = alt.songs || {};
  const katalog = K.lesen();
  if (!katalog) { console.log('  Musikstil: noch kein Katalog — erst sammeln (node bin/sammeln.js <handle>) und bauen (node bin/wiederherstellen.js).'); return; }
  let liste = Object.values(katalog.songs || {});
  if (nur) liste = liste.filter(s => s.id === nur);
  else if (!args.includes('--neu')) liste = liste.filter(s => !ergebnis[s.id]);
  /* Die neuesten zuerst (Caspar_D, 21.08.2026): wer zwischendurch
     hineinschaut, sieht zuerst, was ihn gerade beschaeftigt. */
  liste.sort((a, b) => String(b.erstellt || '').localeCompare(String(a.erstellt || '')));
  liste = liste.filter(s => fs.existsSync(path.join(SONGS, s.id, 'audio.mp3'))).slice(0, anzahl);
  if (!liste.length) { console.log('  Musikstil: nichts zu tun — alle Songs vermessen.'); return; }

  /* Ohne Modelle freundlich aussteigen (Exit 0), damit der Morgenlauf
     weitergeht - der Klangraum bleibt dann leer, alles andere laeuft
     (22.08.2026: Kollege unter Windows, Modelle kamen nicht an). */
  const fehlt = ['discogs-effnet-bsdynamic-1.onnx', 'discogs-effnet-bs64-1.json', 'mtg_jamendo_genre-discogs-effnet-1.onnx', 'mtg_jamendo_genre-discogs-effnet-1.json',
    'mtg_jamendo_moodtheme-discogs-effnet-1.onnx', 'mtg_jamendo_moodtheme-discogs-effnet-1.json', 'mtg_jamendo_instrument-discogs-effnet-1.onnx', 'mtg_jamendo_instrument-discogs-effnet-1.json']
    .filter(n => !fs.existsSync(path.join(MODELLE, n)));
  if (fehlt.length) { console.log(`  Musikstil: ${fehlt.length} Modelldatei(en) fehlen in library/modelle/ — erst node bin/modelle-holen.js (START-HIER.md). Übersprungen.`); return; }

  const t0 = Date.now();
  const M = await modelleLaden();
  if (!still) console.log(`  Modelle geladen (${((Date.now() - t0) / 1000).toFixed(1)} s), ${liste.length} Songs zu vermessen`);
  let n = 0, schief = 0, lfd = 0;
  for (const s of liste) {
    const t1 = Date.now(); lfd++;
    try {
      ergebnis[s.id] = { ...await vermessen(M, path.join(SONGS, s.id, 'audio.mp3')), stand: new Date().toISOString() };
      n++;
      if (!still || nur) {
        const e = ergebnis[s.id];
        console.log(`  ${lfd}/${liste.length} ${s.titel.slice(0, 40).padEnd(40)} ${((Date.now() - t1) / 1000).toFixed(1).padStart(5)} s  ${e.stile[0][0]} · ${e.genre[0][0]} · ${e.stimmung[0][0]}`);
      }
      if (nur) console.log(JSON.stringify({ ...ergebnis[s.id], emb: `[${ergebnis[s.id].emb.length} Zahlen]` }, null, 1));
    } catch (e) {
      schief++;
      console.log(`  ! ${s.titel.slice(0, 40)}: ${e.message}`);
    }
    if (n % 10 === 0) { schreiben(ergebnis); if (still) console.log(`  ${lfd}/${liste.length} vermessen`); }
  }
  schreiben(ergebnis);
  console.log(`  Musikstil: ${n} neu vermessen, ${schief} schief, ${Object.keys(ergebnis).length} insgesamt ` +
    `(${((Date.now() - t0) / 60000).toFixed(1)} min) → ${path.relative(WURZEL, ZIEL)}`);
})().catch(e => { console.error('  Musikstil brach ab:', e.message); process.exit(1); });

function schreiben(songs) {
  const tmp = ZIEL + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify({
    stand: new Date().toISOString(),
    modell: 'discogs-effnet-bsdynamic-1 + mtg_jamendo genre/moodtheme/instrument (Essentia-Vorverarbeitung, 96 Mel, 128er Patches)',
    songs,
  }));
  fs.renameSync(tmp, ZIEL);
}
