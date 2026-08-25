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
const ZIEL   = path.join(LIB, 'karte.json');
const args   = process.argv.slice(2);
const GRUPPEN_FEST = args.includes('--gruppen') ? +args[args.indexOf('--gruppen') + 1] : 0;

let klang;
try { klang = JSON.parse(fs.readFileSync(path.join(LIB, 'klang.json'), 'utf8')); }
catch (e) { console.log('  Klangraum: noch keine Vermessung (library/klang.json fehlt) — erst node bin/klang.js.'); process.exit(0); }
let analyse = {}, profile = {}, katalog = { songs: {} };
try { analyse = JSON.parse(fs.readFileSync(path.join(LIB, 'analyse-index.json'), 'utf8')).songs || {}; } catch (e) {}
try { profile = JSON.parse(fs.readFileSync(path.join(LIB, 'eq-profil.json'), 'utf8')).songs || {}; } catch (e) {}
try { katalog = require('./katalog.js').lesen(); } catch (e) {}

const ids = Object.keys(klang.songs).filter(id => (katalog.songs || {})[id] && !katalog.songs[id].fremd);
if (ids.length < 8) { console.log(`  Karte: erst ${ids.length} Songs vermessen — zu wenig für eine Karte.`); process.exit(0); }

/* ---- Embeddings, L2-normiert ----------------------------------------- */
const X = ids.map(id => {
  const e = Float64Array.from(klang.songs[id].emb);
  let n = 0; for (const v of e) n += v * v; n = Math.sqrt(n) || 1;
  for (let i = 0; i < e.length; i++) e[i] /= n;
  return e;
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
    const gm = new Float64Array(bestK), gn = new Int32Array(bestK); let m = 0;
    for (let i = 0; i < N; i++) { gm[label[i]] += pj[i]; gn[label[i]]++; m += pj[i]; } m /= N;
    for (let g = 0; g < bestK; g++) gm[g] = gn[g] ? gm[g] / gn[g] : 0;
    let ssb = 0, sst = 0;
    for (let g = 0; g < bestK; g++) ssb += gn[g] * (gm[g] - m) ** 2;
    for (let i = 0; i < N; i++) sst += (pj[i] - m) ** 2;
    let best = 0; for (let g = 1; g < bestK; g++) if (gm[g] > gm[best]) best = g;
    tags.push({ name, art, xyz: c.map(v => +v.toFixed(4)), masse: +masse.toFixed(2), songs: l.length, streu: +streu.toFixed(3),
      erklaert: +(sst ? ssb / sst : 0).toFixed(3), markiert: best,
      /* Sternbild: die acht staerksten Mitglieder (Caspar_D, 21.08.2026 -
         Tags sind Benennungen von Sterngruppen, keine Objekte) */
      sterne: [...l].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([i]) => ids[i]) });
  }
}
tags.sort((a, b) => b.erklaert - a.erklaert);
/* (deutsche Namen bekommen die Tags unten, wenn UEBERSETZUNG steht) */
console.log(`  Tags als Punkte: ${tags.length} (Masse >= 1,5, >= 3 Songs)`);

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

const gruppen = [];
for (let g = 0; g < bestK; g++) {
  const m = []; for (let i = 0; i < N; i++) if (label[i] === g) m.push(i);
  const genres = mittelListe(m, 'genre'), stimmungen = mittelListe(m, 'stimmung');
  const werte = m.map(i => analyse[ids[i]]).filter(Boolean);
  const prof = m.map(i => profile[ids[i]]).filter(p => p && p.length === 8);
  const name = genres.slice(0, 2).map(x => de(x[0])).join(' · ') + (stimmungen[0] ? ' — ' + de(stimmungen[0][0]) : '');
  gruppen.push({
    nr: g, name, anzahl: m.length, genres, stimmungen,
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
  verfahren: 'agglomerativ/complete auf sqrt(1-cos) im 1280-dim-Raum; Karte x/y = NMDS (Kruskal, SMACOF), umap = UMAP(15, 0.1, Saat 20260821)',
  stress: +NM.stress.toFixed(3), stress3d: +NM3.stress.toFixed(3),
  tags,
  gruppen, songs,
}));
console.log(`  Karte: ${N} Songs, ${bestK} Gruppen (Silhouette ${bestS.toFixed(3)}) → ${path.relative(WURZEL, ZIEL)}`);
for (const g of gruppen) console.log(`    ${String(g.nr + 1).padStart(2)}. ${String(g.anzahl).padStart(3)} Songs  ${g.name}` +
  (g.erdung.bpm ? `  (${g.erdung.bpm} BPM nach Sunos Takt, ${g.erdung.lufs} LUFS)` : ''));
