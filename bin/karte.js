#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Die Musik-Karte: aus den Klang-Embeddings (bin/klang.js) eine
 * 2-D-Karte der Sammlung und Stilgruppen - mit Namen in Klartext.
 *
 *   node bin/karte.js            → library/karte.json
 *   node bin/karte.js --gruppen 8   Gruppenzahl erzwingen (sonst Silhouette)
 *
 * Zwei getrennte Rechnungen, absichtlich (CLUSTERING-RECHERCHE.md: der
 * haeufigste Fehler ist, auf der 2-D-Karte zu clustern):
 *
 *   1. GRUPPEN im vollen 1280-dim-Raum: agglomerativ, complete linkage,
 *      Kosinus-Abstand. Die Gruppenzahl waehlt die Silhouette (4..14).
 *      Im Haus gebaut statt HDBSCAN - bei ~320 Punkten ist das
 *      transparent, deterministisch und ohne weitere Abhaengigkeit;
 *      HDBSCAN laesst sich spaeter an derselben Stelle einsetzen.
 *   2. KARTE mit UMAP (umap-js, Kosinus, nNeighbors 15, minDist 0.1,
 *      gesaeter Zufall → jeder Lauf dieselbe Karte). Koordinaten 0..1.
 *
 * Jede Gruppe bekommt:
 *   name        aus den haeufigsten Genres + Stimmung ihrer Songs
 *               ("Rock · Metal — energisch")
 *   genres, stimmungen, stile, instrumente   Mittel der Top-Listen
 *   erdung      KlangTresor-Messwerte im Mittel (BPM, LUFS, Dur/Moll-Anteil,
 *               Dauer) aus library/analyse-index.json - die Gruppen in
 *               der Sprache des Hauses ("langsame Moll-Songs um 70 BPM")
 *   profil      Mittel der 8-Band-Klangprofile (eq-profil.json) -
 *               das Stilgruppen-Preset fuer den Equalizer
 *
 * Deutsche Namen fuer die Jamendo-Tags stehen unten (UEBERSETZUNG);
 * was dort fehlt, bleibt englisch.
 */
'use strict';
const fs   = require('node:fs');
const path = require('node:path');
const { UMAP } = require('umap-js');

const WURZEL = path.join(__dirname, '..');
const LIB    = path.join(WURZEL, 'library');
const args   = process.argv.slice(2);

/* ---- DREI RAEUME, EINE RECHNUNG ---------------------------------------
   Caspar_D, 28.08.2026: "wir haben Klang-Raum und Geschichten-Raum und
   Lied-Raum (das sind die beiden aneinandergehaengten Vektoren)."

   Es aendern sich nur die Vektoren, mit denen gerechnet wird - alles
   danach ist identisch. Die Etiketten (Stil, Genre, Stimmung) kommen in
   jedem Raum aus klang.json, denn sie beschreiben den Song und nicht den
   Raum: dieselben Lieder, dieselben Namen, andere Anordnung. */
const RAEUME = {
  klang:       { datei: 'karte.json',              was: 'Klang-Raum' },
  geschichten: { datei: 'karte-geschichten.json',  was: 'Geschichten-Raum' },
  lied:        { datei: 'karte-lied.json',         was: 'Lied-Raum' },
};
const RAUM = args.includes('--raum') ? args[args.indexOf('--raum') + 1] : 'klang';
if (!RAEUME[RAUM]) { console.error('  Raum unbekannt: ' + RAUM + ' (klang | geschichten | lied)'); process.exit(1); }
const ZIEL   = path.join(LIB, RAEUME[RAUM].datei);
const GRUPPEN_FEST = args.includes('--gruppen') ? +args[args.indexOf('--gruppen') + 1] : 0;

let klang;
try { klang = JSON.parse(fs.readFileSync(path.join(LIB, 'klang.json'), 'utf8')); }
catch (e) { console.log('  Klangraum: noch keine Vermessung (library/klang.json fehlt) — erst node bin/klang.js.'); process.exit(0); }
let analyse = {}, profile = {}, katalog = { songs: {} };
try { analyse = JSON.parse(fs.readFileSync(path.join(LIB, 'analyse-index.json'), 'utf8')).songs || {}; } catch (e) {}
try { profile = JSON.parse(fs.readFileSync(path.join(LIB, 'eq-profil.json'), 'utf8')).songs || {}; } catch (e) {}
try { katalog = require('./katalog.js').lesen(); } catch (e) {}

let geschichten = null;
if (RAUM !== 'klang') {
  try { geschichten = JSON.parse(fs.readFileSync(path.join(LIB, 'geschichten.json'), 'utf8')).songs; }
  catch (e) { console.log('  ' + RAEUME[RAUM].was + ': library/geschichten.json fehlt - erst node bin/geschichten.js.'); process.exit(0); }
}

/* Im Geschichten- und im Lied-Raum sind nur die Lieder MIT Text dabei.
   Die uebrigen fehlen dort, und das soll man sehen - nicht so tun, als
   waeren sie allem unaehnlich. */
const ids = Object.keys(klang.songs).filter(id =>
  (katalog.songs || {})[id] && !katalog.songs[id].fremd &&
  (RAUM === 'klang' || (geschichten && geschichten[id])));
if (ids.length < 8) { console.log(`  Karte: erst ${ids.length} Songs vermessen — zu wenig für eine Karte.`); process.exit(0); }

/* ---- Embeddings, L2-normiert ----------------------------------------- */
function norm(arr) {
  const e = Float64Array.from(arr);
  let n = 0; for (const v of e) n += v * v; n = Math.sqrt(n) || 1;
  for (let i = 0; i < e.length; i++) e[i] /= n;
  return e;
}
const X = ids.map(id => {
  const kl = () => norm(klang.songs[id].emb);
  const ge = () => norm(geschichten[id].emb);
  if (RAUM === 'klang')       return kl();
  if (RAUM === 'geschichten') return ge();
  /* LIED-RAUM: beide aneinander. Vorher jeden Teil auf 1/sqrt(2)
     herunterskalieren - dann ist das Skalarprodukt des Ganzen genau das
     Mittel der beiden Einzelprodukte, und der Klang uebertoent die
     Geschichte nicht, obwohl er 1280 gegen 384 Dimensionen hat. Ohne
     diese Wichtung entschiede allein die Dimensionszahl. */
  const w = Math.SQRT1_2;
  const a = kl(), b = ge();
  const v = new Float64Array(a.length + b.length);
  for (let i = 0; i < a.length; i++) v[i] = a[i] * w;
  for (let i = 0; i < b.length; i++) v[a.length + i] = b[i] * w;
  return v;
});
const N = X.length;
/* Abstand: WURZEL des Kosinus-Abstands, sqrt(1 - <a,b>) (Caspar_D,
   21.08.2026: "damit die grossen etwas kleiner gegenueber den kleinen
   werden"). Staucht die Weiten, spreizt die Naehe - und ist anders als
   1 - cos eine echte Metrik (Dreiecksungleichung gilt). Gilt fuer
   Gruppen, Karte, Nachbarn gleichermassen. */
const abstand = (a, b) => { let s = 0; for (let k = 0; k < a.length; k++) s += a[k] * b[k]; return Math.sqrt(Math.max(0, 1 - s)); };
const D = new Float64Array(N * N);
for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) D[i * N + j] = D[j * N + i] = abstand(X[i], X[j]);

/* ---- Agglomerativ, complete linkage ----------------------------------- */
function agglomerativ(zielK) {
  let cl = ids.map((_, i) => [i]);
  /* Complete linkage (Caspar_D, 21.08.2026: "in der Regel schoener"):
     Abstand zweier Gruppen = ihr WEITESTES Paar. Ergibt kompakte,
     aehnlich grosse Gruppen statt der Ketten von average/single. */
  const dist = (A, B) => { let m = 0; for (const a of A) for (const b of B) { const d = D[a * N + b]; if (d > m) m = d; } return m; };
  while (cl.length > zielK) {
    let best = Infinity, bi = 0, bj = 1;
    for (let i = 0; i < cl.length; i++) for (let j = i + 1; j < cl.length; j++) {
      const d = dist(cl[i], cl[j]); if (d < best) { best = d; bi = i; bj = j; }
    }
    cl[bi] = cl[bi].concat(cl[bj]); cl.splice(bj, 1);
  }
  const label = new Int32Array(N);
  cl.forEach((c, g) => c.forEach(i => { label[i] = g; }));
  return label;
}
function silhouette(label, k) {
  let summe = 0;
  for (let i = 0; i < N; i++) {
    const s = new Float64Array(k), n = new Int32Array(k);
    for (let j = 0; j < N; j++) if (j !== i) { s[label[j]] += D[i * N + j]; n[label[j]]++; }
    const a = n[label[i]] ? s[label[i]] / n[label[i]] : 0;
    let b = Infinity; for (let g = 0; g < k; g++) if (g !== label[i] && n[g]) b = Math.min(b, s[g] / n[g]);
    summe += (b - a) / Math.max(a, b || 1);
  }
  return summe / N;
}
let bestK = GRUPPEN_FEST, bestS = -1, label;
if (!bestK) {
  for (let k = 4; k <= Math.min(14, Math.floor(N / 4)); k++) {
    const l = agglomerativ(k), s = silhouette(l, k);
    if (s > bestS) { bestS = s; bestK = k; label = l; }
  }
} else { label = agglomerativ(bestK); bestS = silhouette(label, bestK); }

/* ---- UMAP 2-D, gesaet --------------------------------------------------- */
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const umap = new UMAP({ nComponents: 2, nNeighbors: Math.min(15, N - 1), minDist: 0.1, spread: 1,
  distanceFn: abstand,
  random: mulberry32(20260821) });
const xyUmap = umap.fit(X.map(e => Array.from(e)));
/* UMAP auch in 3-D (Caspar_D, 21.08.2026) - als Vergleichsblick zum NMDS-Raum. */
const umap3 = new UMAP({ nComponents: 3, nNeighbors: Math.min(15, N - 1), minDist: 0.1, spread: 1, distanceFn: abstand, random: mulberry32(20260821) });
const xyzUmapRoh = umap3.fit(X.map(e => Array.from(e)));

/* ---- NMDS (Kruskal, nicht-metrisch) --------------------------------------
   Caspar_Ds Einwand (21.08.2026): UMAP bewahrt nur die Nachbarschaft, die
   Abstaende auf der Karte sind erfunden - Ketten und Inseln sind
   Artefakte. NMDS sucht eine 2-D-Lage, in der die RANGFOLGE aller
   Paarabstaende stimmt. Start: klassisches MDS (Torgerson); dann
   SMACOF mit isotoner Regression (Pool-Adjacent-Violators). Guete:
   Kruskal-Stress-1 (< 0,1 gut, < 0,2 brauchbar). Deterministisch. */
function nmds(D, N, iter = 400, DIM = 2) {
  // Torgerson-Start: B = -1/2 J D^2 J, Top-2-Eigenvektoren per Potenzmethode
  const B = new Float64Array(N * N);
  const zeil = new Float64Array(N); let ges = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const v = D[i * N + j] ** 2; zeil[i] += v / N; ges += v / (N * N); }
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) B[i * N + j] = -0.5 * (D[i * N + j] ** 2 - zeil[i] - zeil[j] + ges);
  const X = Array.from({ length: DIM }, () => new Float64Array(N));
  for (let k = 0; k < DIM; k++) {
    let v = Float64Array.from({ length: N }, (_, i) => Math.sin(i * 1.7 + k));   // feste Startrichtung
    for (let t = 0; t < 200; t++) {
      const w = new Float64Array(N);
      for (let i = 0; i < N; i++) { let a = 0; for (let j = 0; j < N; j++) a += B[i * N + j] * v[j]; w[i] = a; }
      for (let q = 0; q < k; q++) { let d = 0; for (let i = 0; i < N; i++) d += w[i] * X[q][i]; for (let i = 0; i < N; i++) w[i] -= d * X[q][i]; }  // orthogonal zu den fertigen Achsen
      let nrm = 0; for (const a of w) nrm += a * a; nrm = Math.sqrt(nrm) || 1;
      for (let i = 0; i < N; i++) v[i] = w[i] / nrm;
    }
    let lam = 0; for (let i = 0; i < N; i++) { let a = 0; for (let j = 0; j < N; j++) a += B[i * N + j] * v[j]; lam += v[i] * a; }
    const sk = Math.sqrt(Math.max(lam, 1e-9));
    for (let i = 0; i < N; i++) X[k][i] = v[i];      // erst Einheitsvektoren (fuer die Orthogonalisierung) ...
    X[k].skal = sk;
  }
  for (let k = 0; k < DIM; k++) { const sk = X[k].skal; for (let i = 0; i < N; i++) X[k][i] *= sk; }   // ... dann skaliert

  // Paare nach Unaehnlichkeit sortiert (einmal)
  const paare = [];
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) paare.push([D[i * N + j], i, j]);
  paare.sort((a, b) => a[0] - b[0]);
  const M = paare.length, d = new Float64Array(M), dh = new Float64Array(M);
  let stress = 1;
  for (let t = 0; t < iter; t++) {
    // Konfigurationsabstaende in Sortierreihenfolge
    for (let m = 0; m < M; m++) { const [, i, j] = paare[m]; let q = 0; for (let a = 0; a < DIM; a++) q += (X[a][i] - X[a][j]) ** 2; d[m] = Math.sqrt(q); }
    // isotone Regression (PAVA): d-hat monoton in der Unaehnlichkeit
    const bl = []; // Bloecke [summe, anzahl]
    for (let m = 0; m < M; m++) {
      let su = d[m], an = 1;
      while (bl.length && bl[bl.length - 1][0] / bl[bl.length - 1][1] > su / an) { const b = bl.pop(); su += b[0]; an += b[1]; }
      bl.push([su, an]);
    }
    let m = 0; for (const [su, an] of bl) { const v = su / an; for (let q = 0; q < an; q++) dh[m++] = v; }
    // Stress-1
    let z = 0, nn = 0; for (let q = 0; q < M; q++) { z += (d[q] - dh[q]) ** 2; nn += d[q] ** 2; }
    stress = Math.sqrt(z / (nn || 1));
    // Guttman-Transformation: X <- (1/N) B(X) X
    const nxs = Array.from({ length: DIM }, () => new Float64Array(N));
    for (let q = 0; q < M; q++) {
      const [, i, j] = paare[q], dq = d[q] > 1e-9 ? dh[q] / d[q] : 0;
      for (let a = 0; a < DIM; a++) { const dd = (X[a][i] - X[a][j]) * dq; nxs[a][i] += dd; nxs[a][j] -= dd; }
    }
    for (let a = 0; a < DIM; a++) for (let i = 0; i < N; i++) X[a][i] = nxs[a][i] / N;

    /* SKALE FESTHALTEN (Caspar_D, 28.08.2026: "ja, repariere den kollaps")
       Stress-1 ist skaleninvariant. Deshalb hat die nichtmetrische MDS
       eine triviale Loesung: alle Punkte auf EINEM Punkt, alle Abstaende
       null, Stress null. Ohne Verankerung laeuft die Guttman-Iteration
       genau dorthin - langsam, aber sicher.

       Gemessen am Geschichten-Raum (257 Lieder): Spanne der ersten Achse
       0,73 im Start, 0,063 nach 50 Schritten, 4,3e-5 nach 200, exakt 0
       nach 400. Der Stress blieb dabei bis zuletzt bei 0,218 - die FORM
       war die ganze Zeit richtig, nur die GROESSE fiel weg. In der
       fertigen karte-geschichten.json stand deshalb bei allen 257
       Liedern x = y = 0,04 und stress = 0. Aufgefallen war es nie, weil
       die Karte auf 3D stand: dort rettete die nachtraegliche Normierung
       auf Radius 1 die Anzeige, waehrend die Rechnung selbst schon bei
       6e-5 lief.

       Also nach jedem Schritt die Ausdehnung festhalten: Wurzel des
       mittleren quadrierten Abstands auf 1. Das aendert an der Loesung
       nichts (Stress 3D vorher wie nachher 0,1526), verhindert aber den
       Unterlauf. */
    let q2 = 0;
    for (let q = 0; q < M; q++) {
      const [, i, j] = paare[q]; let s = 0;
      for (let a = 0; a < DIM; a++) s += (X[a][i] - X[a][j]) ** 2;
      q2 += s;
    }
    const f = Math.sqrt(M / (q2 || 1e-30));
    for (let a = 0; a < DIM; a++) for (let i = 0; i < N; i++) X[a][i] *= f;
  }
  return { xy: Array.from({ length: N }, (_, i) => X.map(ax => ax[i])), stress };
}
const t0 = Date.now();
const NM = nmds(D, N);
const xyNmds = NM.xy;
console.log(`  NMDS 2D: Stress-1 ${NM.stress.toFixed(3)} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);

/* ---- NMDS in 3D, auf Hauptachsen gedreht (Caspar_D, 21.08.2026) ------------
   Die Loesung ist rotationsinvariant; PCA der 3-D-Koordinaten legt sie
   so, dass PC1/PC2 die groesste Ausdehnung tragen (= Landing-Ansicht
   der Karte) und PC3 die Tiefe ist. Zentriert, auf Radius 1 skaliert. */
const t1 = Date.now();
const NM3 = nmds(D, N, 400, 3);
function hauptachsen(P) {                       // P: N x 3 -> N x 3, zentriert, gedreht
  const n = P.length, m = [0, 0, 0];
  for (const p of P) for (let a = 0; a < 3; a++) m[a] += p[a] / n;
  const Z = P.map(p => p.map((v, a) => v - m[a]));
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const z of Z) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) C[a][b] += z[a] * z[b] / n;
  // Eigenvektoren per Potenzmethode mit Deflation
  const V = [];
  for (let k = 0; k < 3; k++) {
    let v = [1, 0.7, 0.3].map((x, i) => x + 0.1 * k * i);
    for (let t = 0; t < 300; t++) {
      let w = [0, 1, 2].map(a => C[a][0] * v[0] + C[a][1] * v[1] + C[a][2] * v[2]);
      for (const u of V) { const d = w[0] * u[0] + w[1] * u[1] + w[2] * u[2]; w = w.map((x, i) => x - d * u[i]); }
      const nrm = Math.hypot(...w) || 1; v = w.map(x => x / nrm);
    }
    V.push(v);
  }
  const R = Z.map(z => V.map(v => z[0] * v[0] + z[1] * v[1] + z[2] * v[2]));
  let rmax = 0; for (const r of R) rmax = Math.max(rmax, Math.hypot(...r));
  return R.map(r => r.map(v => +(v / (rmax || 1)).toFixed(4)));
}
const xyz = hauptachsen(NM3.xy);
const xyzU = hauptachsen(xyzUmapRoh);          // UMAP-3D, ebenfalls auf Hauptachsen
console.log(`  NMDS 3D: Stress-1 ${NM3.stress.toFixed(3)} (${((Date.now() - t1) / 1000).toFixed(1)} s), auf Hauptachsen gedreht`);

/* ---- Tags als supplementaere Punkte (CA-Logik) --------------------------
   Jeder Tag sitzt im Schwerpunkt seiner Songs, gewichtet mit der
   Wahrscheinlichkeit: Uebergangsformel der Korrespondenzanalyse fuer
   Spaltenprofile, angewandt im NMDS-Raum. 'masse' = Summe der
   Wahrscheinlichkeiten, 'streu' = gewichtete mittlere Entfernung der
   Songs vom Tag-Punkt (klein = der Tag sitzt wirklich dort). */

/* Wie stark erklaert ein Tag die Gruppen? eta^2 = Varianz der
   Tag-Wahrscheinlichkeit ZWISCHEN den Gruppen / Gesamtvarianz
   (ANOVA-Effektstaerke, 0..1). Songs ohne den Tag in ihren Top 5
   zaehlen mit 0. 'best' = Gruppe mit dem hoechsten Mittel.
   (Caspar_D, 21.08.2026: "welche am staerksten die Clusterung erklaeren")
   Steht als Funktion da, weil sie zweimal gebraucht wird: einmal echt und
   einmal fuer den Zufallsvergleich weiter unten. */
function etaQuadrat(pj, zuordnung) {
  const gm = new Float64Array(bestK), gn = new Int32Array(bestK); let m = 0;
  for (let i = 0; i < N; i++) { gm[zuordnung[i]] += pj[i]; gn[zuordnung[i]]++; m += pj[i]; } m /= N;
  for (let g = 0; g < bestK; g++) gm[g] = gn[g] ? gm[g] / gn[g] : 0;
  let ssb = 0, sst = 0;
  for (let g = 0; g < bestK; g++) ssb += gn[g] * (gm[g] - m) ** 2;
  for (let i = 0; i < N; i++) sst += (pj[i] - m) ** 2;
  let best = 0; for (let g = 1; g < bestK; g++) if (gm[g] > gm[best]) best = g;
  return { eta: sst ? ssb / sst : 0, best };
}

const tags = [];
for (const [feld, art] of [['genre', 'Genre'], ['stimmung', 'Stimmung'], ['instrumente', 'Instrument']]) {
  const summe = {};
  ids.forEach((id, i) => { for (const [name, p] of (klang.songs[id][feld] || [])) (summe[name] = summe[name] || []).push([i, p]); });
  for (const [name, l] of Object.entries(summe)) {
    const masse = l.reduce((a, [, p]) => a + p, 0); if (masse < 1.5 || l.length < 3) continue;
    const c = [0, 0, 0]; for (const [i, p] of l) for (let a = 0; a < 3; a++) c[a] += p * xyz[i][a] / masse;
    let streu = 0; for (const [i, p] of l) streu += p * Math.hypot(xyz[i][0] - c[0], xyz[i][1] - c[1], xyz[i][2] - c[2]) / masse;
    /* Wie stark erklaert der Tag die Gruppen? eta^2 = Varianz der
       Tag-Wahrscheinlichkeit ZWISCHEN den Gruppen / Gesamtvarianz
       (ANOVA-Effektstaerke, 0..1). Songs ohne den Tag in ihren Top 5
       zaehlen mit 0. 'markiert' = Gruppe mit dem hoechsten Mittel.
       (Caspar_D, 21.08.2026: "welche am staerksten die Clusterung erklaeren") */
    const pj = new Float64Array(N); for (const [i, p] of l) pj[i] = p;
    const { eta, best } = etaQuadrat(pj, label);
    tags.push({ name, art, xyz: c.map(v => +v.toFixed(4)), masse: +masse.toFixed(2), songs: l.length, streu: +streu.toFixed(3),
      erklaert: +eta.toFixed(3), markiert: best, pj,
      /* Sternbild: die acht staerksten Mitglieder (Caspar_D, 21.08.2026 -
         Tags sind Benennungen von Sterngruppen, keine Objekte) */
      sterne: [...l].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([i]) => ids[i]) });
  }
}
tags.sort((a, b) => b.erklaert - a.erklaert);

/* ---- NUR TAGS, DIE ETWAS ERKLAEREN ------------------------------------
   Caspar_D, 28.08.2026, auf die Frage, was mit den Klassifikatoren im
   Lied-Raum geschehen soll: "im Kombiraum die, die etwas erklaeren".

   Die Etiketten kommen aus dem KLANG (library/klang.json, Genre,
   Stimmung, Instrument). In den Klang-Raum gehoeren sie; im
   Geschichten-Raum beschreiben sie etwas anderes als die Gruppen, die
   dort nach THEMEN entstanden sind. Gemessen am Bestand: bestes eta^2
   im Klang-Raum 0,783 (episch), im Lied-Raum 0,666 (romantisch), im
   Geschichten-Raum nur 0,242 - und dort liegen 30 von 47 Etiketten
   unter 0,10. Sichtbar wurden trotzdem drei, weil die Schwelle in der
   Oberflaeche eine feste Laenge war: "tief", "Poprock", "Elektronik"
   standen im Textraum, ohne dort etwas zu bedeuten.

   Die Schwelle wird GERECHNET, nicht eingestellt (Hausregel: was die
   Software ausrechnen kann, wird kein Regler). Ein Merkmal ohne jeden
   Zusammenhang mit der Gruppierung hat bei k Gruppen und N Liedern ein
   erwartetes eta^2 von (k-1)/(N-1) - das ist der Boden, auf dem alles
   liegt, was gar nichts erklaert. Wer nicht mindestens das Doppelte
   davon schafft, wird verworfen. */
/* ---- NUR TAGS, DIE ETWAS ERKLAEREN ------------------------------------
   Caspar_D, 28.08.2026, zu den Klassifikatoren im Lied-Raum:
   "im Kombiraum die, die etwas erklaeren".

   Die Etiketten kommen aus dem KLANG (library/klang.json: Genre,
   Stimmung, Instrument). Im Klang-Raum gehoeren sie hin; im
   Geschichten-Raum beschreiben sie etwas anderes als die Gruppen, die
   dort nach THEMEN entstanden sind. Gemessen: bestes eta^2 im
   Klang-Raum 0,783 (episch), im Lied-Raum 0,666 (romantisch), im
   Geschichten-Raum nur 0,242 - und dort liegen 30 von 47 Etiketten
   unter 0,10. Sichtbar wurden trotzdem drei, weil die Schwelle in der
   Oberflaeche eine feste Laenge war: "tief", "Poprock" und "Elektronik"
   standen im Textraum, ohne dort etwas zu bedeuten.

   DIE SCHWELLE WIRD GEMESSEN, NICHT EINGESTELLT (Hausregel: was die
   Software ausrechnen kann, wird kein Regler). Der Erwartungswert
   (k-1)/(N-1) taugt dafuer nicht - er ist die MITTE der Zufallsvertei-
   lung, und die Haelfte aller sinnlosen Tags liegt darueber. Gerechnet
   wird deshalb die Verteilung selbst: die Gruppenzuordnung wird
   gemischt und eta^2 neu bestimmt, oft genug fuer ein belastbares
   99-Prozent-Quantil. Was ein Tag bei GEMISCHTEN Gruppen erreicht, ist
   genau das, was nichts bedeutet.

   Gemischt wird mit fester Saat: die Karte soll bei gleichem Bestand
   gleich aussehen, nicht bei jedem Lauf anders. */
let saat = 20260828;
const wuerfel = () => ((saat = (saat * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const RUNDEN = 200;
const zufallsWerte = [];
const gemischt = Int32Array.from(label);
for (let r = 0; r < RUNDEN; r++) {
  for (let i = N - 1; i > 0; i--) {                      /* Fisher-Yates */
    const j = Math.floor(wuerfel() * (i + 1));
    const h = gemischt[i]; gemischt[i] = gemischt[j]; gemischt[j] = h;
  }
  for (const t of tags) zufallsWerte.push(etaQuadrat(t.pj, gemischt).eta);
}
zufallsWerte.sort((a, b) => a - b);
const SCHWELLE = zufallsWerte[Math.floor(zufallsWerte.length * 0.99)] || 0;

/* Im GESCHICHTEN-RAUM fliegen sie ganz raus, auch die zehn, die ueber
   der Schwelle liegen. Caspar_D, 28.08.2026: "und genres, instrumente in
   Geschichten muessten was voellig anderes sein - naemlich
   Geschichten-Genres". Was dort durchkam, waren House, Dance, downtempo
   und Keyboard - sie schaffen die Schwelle nur, weil "Elektronik" bei 203
   von 257 Liedern steht und darum mittelbar mit dem Textstil zusammen-
   haengt. Was ein Lied ERZAEHLT, sagen sie nicht. Der Raum bleibt so
   lange ohne Etiketten, bis die textlichen da sind. */
const vorherTags = tags.length;
const behalten = RAUM === 'geschichten' ? [] : tags.filter(t => t.erklaert >= SCHWELLE);
tags.length = 0;
tags.push(...behalten);
for (const t of tags) delete t.pj;                       /* nicht in die Datei */
/* (deutsche Namen bekommen die Tags unten, wenn UEBERSETZUNG steht) */
console.log(`  Tags als Punkte: ${tags.length} von ${vorherTags} (Masse >= 1,5, >= 3 Songs, `
  + `eta^2 >= ${SCHWELLE.toFixed(3)} = 99-%-Quantil bei gemischten Gruppen)`);
if (!tags.length) console.log('  -> kein Klang-Etikett erklaert diesen Raum. Die Zeile entfaellt dort.');

const normiere = (xy) => {
  const xs = xy.map(p => p[0]), ys = xy.map(p => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const k = Math.max(x1 - x0, y1 - y0) || 1;                // GLEICHER Massstab fuer beide Achsen
  return xy.map(([x, y]) => [+(0.04 + 0.92 * (x - x0) / k).toFixed(4), +(0.04 + 0.92 * (y - y0) / k).toFixed(4)]);
};
const U = normiere(xyUmap), Q = normiere(xyNmds);

/* ---- Gruppen beschreiben ------------------------------------------------ */
const UEBERSETZUNG = {
  rock: 'Rock', metal: 'Metal', pop: 'Pop', electronic: 'Elektronik', alternative: 'Alternative', folk: 'Folk',
  hiphop: 'Hip-Hop', rap: 'Rap', jazz: 'Jazz', classical: 'Klassik', ambient: 'Ambient', soundtrack: 'Soundtrack',
  chanson: 'Chanson', country: 'Country', blues: 'Blues', reggae: 'Reggae', punkrock: 'Punkrock', hardrock: 'Hardrock',
  heavymetal: 'Heavy Metal', singersongwriter: 'Singer-Songwriter', easylistening: 'Easy Listening', newage: 'New Age',
  world: 'Weltmusik', latin: 'Latin', funk: 'Funk', soul: 'Soul', dance: 'Dance', techno: 'Techno', house: 'House',
  trance: 'Trance', orchestral: 'Orchestral', instrumentalpop: 'Instrumental-Pop', poprock: 'Poprock', indie: 'Indie',
  experimental: 'Experimentell', atmospheric: 'atmosphärisch', electropop: 'Electropop', acousticguitar: 'Akustikgitarre',
  energetic: 'energisch', happy: 'fröhlich', heavy: 'schwer', love: 'Liebe', epic: 'episch', sad: 'traurig', dark: 'dunkel',
  melancholic: 'melancholisch', relaxing: 'entspannt', calm: 'ruhig', emotional: 'emotional', dramatic: 'dramatisch',
  romantic: 'romantisch', uplifting: 'aufbauend', hopeful: 'hoffnungsvoll', powerful: 'kraftvoll', fun: 'Spaß',
  dream: 'Traum', film: 'Film', meditative: 'meditativ', melodic: 'melodisch', slow: 'langsam', fast: 'schnell',
  soft: 'sanft', deep: 'tief', groovy: 'groovig', inspiring: 'inspirierend', motivational: 'motivierend', upbeat: 'beschwingt',
  positive: 'positiv', party: 'Party', summer: 'Sommer', nature: 'Natur', christmas: 'Weihnachten', children: 'Kinder',
  drums: 'Schlagzeug', bass: 'Bass', electricguitar: 'E-Gitarre', guitar: 'Gitarre', piano: 'Klavier', synthesizer: 'Synthesizer',
  voice: 'Stimme', strings: 'Streicher', violin: 'Geige', keyboard: 'Keyboard', orchestra: 'Orchester', acousticbassguitar: 'Akustikbass',
  drummachine: 'Drumcomputer', computer: 'Computer', beat: 'Beat', pad: 'Flächen', percussion: 'Perkussion', accordion: 'Akkordeon',
  cello: 'Cello', flute: 'Flöte', trumpet: 'Trompete', saxophone: 'Saxofon', organ: 'Orgel', brass: 'Bläser', choir: 'Chor',
};
const de = t => UEBERSETZUNG[t] || t;
const mittelListe = (mitglieder, feld) => {
  const summe = {};
  for (const i of mitglieder) for (const [name, p] of (klang.songs[ids[i]][feld] || [])) summe[name] = (summe[name] || 0) + p;
  return Object.entries(summe).map(([name, p]) => [name, +(p / mitglieder.length).toFixed(3)]).sort((a, b) => b[1] - a[1]).slice(0, 5);
};
const mittel = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
const median = arr => { const a = Array.from(arr).sort((x, y) => x - y); return a.length ? a[a.length >> 1] : 0; };

/* ---- NAMEN AUS DEN TEXTEN --------------------------------------------
   Caspar_D, 28.08.2026: "warum clustern die musikstile in der
   geschichtenansicht feiner und in anderen farben".

   Die Gruppen entstehen je Raum neu - das ist richtig. Falsch war, sie
   ueberall nach Genre und Stimmung zu benennen: Im Geschichten-Raum
   sind sie nach THEMEN gebildet, und ein Name wie "Pop · Elektronik"
   beschreibt dann etwas anderes als die Gruppe.

   Kennzeichnend ist ein Wort, das INNEN haeufig und AUSSEN selten ist.
   Nicht das haeufigste - "Herz" steht in der Haelfte aller Lieder und
   sagt ueber keine Gruppe etwas. Gezaehlt wird je LIED, nicht je
   Vorkommen: ein Refrain soll nicht dreimal zaehlen. */
const STOPP = new Set(('der die das den dem des ein eine einer eines einem einen und oder aber wenn dann weil dass '
  + 'ich du er sie es wir ihr mich dich sich uns euch mir dir ihm ihn ihnen mein dein sein unser euer '
  + 'ist sind war waren bin bist hat habe haben hatte wird werde werden wurde kann kannst koennen muss '
  + 'nicht nur noch schon auch mehr sehr ganz immer wieder hier dort jetzt heute wieder mal doch '
  + 'auf aus bei mit nach seit von vor zu zur zum ueber unter durch fuer ohne gegen um an in im '
  + 'wie was wer wo wann warum welche alle alles nichts etwas man kein keine als so wenn '
  + 'the and you are for with this that have from your will can all but not was what when who out now '
  + 'get got just like know time love our their they them there here then than into '
  + 'oh ah yeah hey uh mm la na da').split(/\s+/));

let TEXTE = null;
function texteLaden() {
  if (TEXTE) return TEXTE;
  let filter = (x) => x;
  try { filter = require('./geschichten.js').nurGesungenes || filter; } catch (e) {}
  TEXTE = {};
  for (const id of ids) {
    const l = (katalog.songs[id] || {}).lyrics;
    if (!l) continue;
    /* Je Lied die MENGE der Woerter, nicht ihre Zahl - siehe oben. */
    const w = new Set();
    for (const x of filter(l).toLowerCase().match(/[a-zäöüß]{4,}/g) || [])
      if (!STOPP.has(x)) w.add(x);
    TEXTE[id] = w;
  }
  return TEXTE;
}

/* Die drei kennzeichnendsten Woerter einer Gruppe. */
function themenName(m) {
  const T = texteLaden();
  const drin = m.map(i => T[ids[i]]).filter(Boolean);
  if (drin.length < 3) return null;
  const draussen = ids.map((id, i) => m.includes(i) ? null : T[id]).filter(Boolean);
  if (!draussen.length) return null;
  const zaehl = (menge, w) => menge.reduce((n, s) => n + (s.has(w) ? 1 : 0), 0);
  const kandidaten = new Set();
  for (const s of drin) for (const w of s) kandidaten.add(w);
  const bewertet = [];
  for (const w of kandidaten) {
    const i = zaehl(drin, w);
    if (i < 3 || i / drin.length < 0.12) continue;      /* zu selten, um zu kennzeichnen */
    const a = zaehl(draussen, w);
    /* Verhaeltnis der Anteile, mit Glaettung gegen Zufallstreffer. */
    bewertet.push([w, (i / drin.length + 0.02) / (a / draussen.length + 0.02)]);
  }
  bewertet.sort((x, y) => y[1] - x[1]);
  if (!bewertet.length) return null;
  return bewertet.slice(0, 3).map(([w]) => w[0].toUpperCase() + w.slice(1)).join(' · ');
}

const gruppen = [];
for (let g = 0; g < bestK; g++) {
  const m = []; for (let i = 0; i < N; i++) if (label[i] === g) m.push(i);
  const genres = mittelListe(m, 'genre'), stimmungen = mittelListe(m, 'stimmung');
  const werte = m.map(i => analyse[ids[i]]).filter(Boolean);
  const prof = m.map(i => profile[ids[i]]).filter(p => p && p.length === 8);
  const klangName = genres.slice(0, 2).map(x => de(x[0])).join(' · ') + (stimmungen[0] ? ' — ' + de(stimmungen[0][0]) : '');
  /* Klang-Raum: wie bisher. Geschichten-Raum: die Themen. Lied-Raum:
     beides, denn er ist beides - Thema zuerst, weil es das ist, was der
     Klangname nicht sagen kann. */
  const themen = RAUM === 'klang' ? null : themenName(m);
  const name = RAUM === 'geschichten' ? (themen || klangName)
             : RAUM === 'lied'        ? (themen ? themen + ' — ' + klangName : klangName)
             : klangName;
  gruppen.push({
    nr: g, name, anzahl: m.length, genres, stimmungen, themen,
    stile: mittelListe(m, 'stile'), instrumente: mittelListe(m, 'instrumente'),
    /* Die Erdung sagt, wie eine Gruppe klingt - aber nur mit Werten, die
       stimmen. Tempo, Tonart/Modus und Stimme sind seit der Prüfung vom
       23.08.2026 totgelegt (docs/ANALYZER-REVIEW.md) und stehen nicht mehr
       im Index; das Tempo kommt jetzt aus SUNOS SCHLAGZEITEN (taktBpm im
       Katalog), das ist die verlässliche Quelle. Moll-Anteil und Stimme
       entfallen ersatzlos - lieber eine Angabe weniger als eine erfundene. */
    erdung: {
      bpm: (() => { const K = require('./katalog.js');
                    const t = m.map(i => { const x = K.takt((katalog.songs[ids[i]] || {}).schlaege); return x && x.bpm; }).filter(Boolean);
                    return t.length ? Math.round(mittel(t)) : null; })(),
      lufs: werte.length ? +mittel(werte.map(w => w.lufs).filter(v => v != null)).toFixed(1) : null,
      dauer: werte.length ? Math.round(mittel(werte.map(w => w.dauer).filter(Boolean))) : null,
    },
    profil: prof.length ? Array.from({ length: 8 }, (_, b) => +mittel(prof.map(p => p[b])).toFixed(1)) : null,
  });
}
/* Je Gruppe EIN Schwarzes Loch: Schwerpunkt im Raum, Hauptachse
   (Eigenvektor der groessten Varianz) als Jet-Richtung, Ausdehnung
   entlang der Achse = Jet-Laenge. Vier Loecher sind Kosmologie,
   fuenfzig waeren Unfug. */
function gruppenGeometrie(g, raum) {
  const m = []; for (let i = 0; i < N; i++) if (label[i] === g.nr) m.push(raum[i]);
  const c = [0, 0, 0]; for (const v of m) for (let a = 0; a < 3; a++) c[a] += v[a] / m.length;
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const v of m) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) C[a][b] += (v[a] - c[a]) * (v[b] - c[b]) / m.length;
  let e = [1, 0.6, 0.3];
  for (let t = 0; t < 300; t++) { const w = [0, 1, 2].map(a => C[a][0] * e[0] + C[a][1] * e[1] + C[a][2] * e[2]); const n = Math.hypot(...w) || 1; e = w.map(x => x / n); }
  const lam = [0, 1, 2].reduce((acc, a) => acc + e[a] * (C[a][0] * e[0] + C[a][1] * e[1] + C[a][2] * e[2]), 0);
  const spur = C[0][0] + C[1][1] + C[2][2];
  return { xyz: c.map(v => +v.toFixed(4)), achse: e.map(v => +v.toFixed(4)),
    ausdehnung: +Math.sqrt(Math.max(0, lam)).toFixed(4),           // Standardabweichung entlang der Achse
    gerichtet: +(spur ? lam / spur : 0).toFixed(3) };              // Anteil der Varianz auf der Achse (1/3 = Kugel)
}
for (const g of gruppen) {
  Object.assign(g, gruppenGeometrie(g, xyz));                     // NMDS-Raum: xyz, achse, ausdehnung, gerichtet
  g.umap3 = gruppenGeometrie(g, xyzU);                            // UMAP-Raum
}
/* Gruppen nach Groesse nummerieren - die groesste zuerst, lesbarer. */
gruppen.sort((a, b) => b.anzahl - a.anzahl);
const neuNr = new Map(gruppen.map((g, i) => [g.nr, i]));
gruppen.forEach((g, i) => { g.nr = i; });

/* Nachbarschaft und Dichte (Sternenhimmel, Caspar_D 21.08.2026): je Song
   die 8 naechsten Nachbarn im Klangraum und eine Dichte = Kehrwert
   des mittleren Abstands zu den 6 naechsten, rangskaliert 0..1 - der
   hellste Stern ist der mit den engsten Nachbarn. */
const K_NACHBARN = 8;
const nachbarn = ids.map((_, i) => {
  const l = [];
  for (let j = 0; j < N; j++) if (j !== i) l.push([D[i * N + j], j]);
  l.sort((a, b) => a[0] - b[0]);
  return l.slice(0, K_NACHBARN);
});
const roh = nachbarn.map(l => 1 / (l.slice(0, 6).reduce((a, b) => a + b[0], 0) / 6 || 1e-9));
const rang = roh.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]).map(([, i], r) => [i, r]);
const dichte = new Float64Array(N); for (const [i, r] of rang) dichte[i] = N > 1 ? r / (N - 1) : 1;

for (const t of tags) { t.name = de(t.name); t.markiert = neuNr.get(t.markiert); }
const songs = ids.map((id, i) => ({
  id, x: Q[i][0], y: Q[i][1], umap: U[i], xyz: xyz[i], umap3: xyzU[i], gruppe: neuNr.get(label[i]),
  dichte: +dichte[i].toFixed(3),
  streuung: klang.songs[id].streuung ?? null,
  nachbarn: nachbarn[i].map(([d, j]) => [ids[j], +d.toFixed(3)]),
  stil: (klang.songs[id].stile[0] || [''])[0], genre: de((klang.songs[id].genre[0] || [''])[0]),
  stimmung: de((klang.songs[id].stimmung[0] || [''])[0]),
  /* Fuer den Steckbrief (Caspar_D, 21.08.2026): je Top 3 mit Wahrscheinlichkeit */
  stile: klang.songs[id].stile.slice(0, 3).map(([n, p]) => [n.replace('---', ' · '), p]),
  genres: klang.songs[id].genre.slice(0, 3).map(([n, p]) => [de(n), p]),
  stimmungen: klang.songs[id].stimmung.slice(0, 3).map(([n, p]) => [de(n), p]),
  instrumente: klang.songs[id].instrumente.slice(0, 3).map(([n, p]) => [de(n), p]),
}));

fs.writeFileSync(ZIEL, JSON.stringify({
  stand: new Date().toISOString(), anzahl: N, gruppenzahl: bestK, silhouette: +bestS.toFixed(3),
  abstand: { median6: +median(nachbarn.map(l => l[5] ? l[5][0] : 1)).toFixed(3), medianAlle: +median(Array.from(D).filter(Boolean)).toFixed(3) },
  raum: RAUM,
  verfahren: `agglomerativ/complete auf sqrt(1-cos) im ${X[0].length}-dim-Raum (${RAEUME[RAUM].was}); `
    + 'Karte x/y = NMDS (Kruskal, SMACOF), umap = UMAP(15, 0.1, Saat 20260821)',
  stress: +NM.stress.toFixed(3), stress3d: +NM3.stress.toFixed(3),
  tags,
  gruppen, songs,
}));
console.log(`  ${RAEUME[RAUM].was}: ${N} Songs, ${bestK} Gruppen (Silhouette ${bestS.toFixed(3)}) → ${path.relative(WURZEL, ZIEL)}`);
for (const g of gruppen) console.log(`    ${String(g.nr + 1).padStart(2)}. ${String(g.anzahl).padStart(3)} Songs  ${g.name}` +
  (g.erdung.bpm ? `  (${g.erdung.bpm} BPM nach Sunos Takt, ${g.erdung.lufs} LUFS)` : ''));
