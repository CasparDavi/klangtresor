#!/usr/bin/env node
/* Trägt die Karte? — 2D/3D-Treue der Playlist-Kompaktheit und der
   Nachbarschaften, gemessen an der geparkten Geschichten-Karte. */
'use strict';
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const REPO = '/Volumes/Extreme_SSD/Entwicklung/SunoArchive';
const lies = p => JSON.parse(fs.readFileSync(path.join(REPO, p)));

const katalog = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(REPO, 'library/katalog.json.gz'))));
const kond = lies('library/geschichten.json').songs;
/* Die Karte liegt in library/, solange der Raum offen ist; beiseitegelegt
   liegt sie in library/entwurf/. Beide Orte werden probiert. */
const kartePfad = fs.existsSync(path.join(REPO, 'library/karte-geschichten.json'))
  ? 'library/karte-geschichten.json' : 'library/entwurf/karte-geschichten.json';
const karte = lies(kartePfad);

const karteVon = new Map((Array.isArray(karte.songs) ? karte.songs : Object.values(karte.songs)).map(s => [s.id, s]));
const ids = Object.keys(kond).filter(id => karteVon.has(id));
const idx = new Map(ids.map((id, i) => [id, i]));
const titelVon = id => (katalog.songs[id] || {}).titel || '(?)';

/* ---- 768d-Kosinus-Matrix ------------------------------------------- */
const V = ids.map(id => {
  const e = kond[id].emb; let s = 0; for (const x of e) s += x * x;
  const n = Math.sqrt(s) || 1; return Float64Array.from(e, x => x / n);
});
const n = ids.length;
const HOCH = Array.from({ length: n }, () => new Float64Array(n));
for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
  let d = 0; for (let k = 0; k < 768; k++) d += V[i][k] * V[j][k];
  HOCH[i][j] = HOCH[j][i] = d;
}

/* ---- Karten-Distanzen (euklidisch) je Projektion -------------------- */
function distMatrix(koord) {
  const M = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    let s = 0; for (let k = 0; k < koord[i].length; k++) s += (koord[i][k] - koord[j][k]) ** 2;
    M[i][j] = M[j][i] = Math.sqrt(s);
  }
  return M;
}
const PROJ = {
  'NMDS 2D': distMatrix(ids.map(id => [karteVon.get(id).x, karteVon.get(id).y])),
  'UMAP 2D': distMatrix(ids.map(id => karteVon.get(id).umap)),
  'NMDS 3D': distMatrix(ids.map(id => karteVon.get(id).xyz)),
  'UMAP 3D': distMatrix(ids.map(id => karteVon.get(id).umap3)),
};

/* ---- Gruppen (wie im Messlauf: eigene, mit Vektor, gefaltet) -------- */
const basis = t => t.toLowerCase().replace(/ß/g, 'ss')
  .replace(/\((ft\.?|feat\.?)[^)]*\)/gi, ' ').replace(/\([^)]*\)\s*$/g, ' ')
  .replace(/\[[^\]]*\]/g, ' ').replace(/[-–—\s]*v\d+\b/gi, ' ')
  .replace(/\s+2\.0\b/g, ' ').replace(/['’]25\b/g, ' ').replace(/\s+/g, ' ').trim();
const PL = {
  lea: '041a95dd-8e82-4430-9f2f-0effcae363ac', atme: '6c2d7753-bb4a-4891-846a-dd7f5114770f',
  bioGefahr: '7de2239d-3c52-4981-bae7-709a6c65049e', essen: '11045396-717e-4339-8118-689925987526',
  guteLaune: '7324b0d6-820e-467d-a7c0-9267794cd25b', balladen: 'dd857498-6133-4266-b355-969d5276bd5c',
  deutscheSchatten: '9597981b-42c3-45ed-a35d-155dd107e395', teutonicTales: '5ca07ea2-9980-431e-a0a6-fbaa01e1d636',
};
function gefaltet(plId) {
  const gesehen = new Map();
  for (const e of [...katalog.playlists[plId].eintraege].sort((a, b) => a.position - b.position)) {
    if (e.eigen === false || !idx.has(e.songId)) continue;
    const b = basis(titelVon(e.songId));
    if (!gesehen.has(b)) gesehen.set(b, e.songId);
  }
  return [...gesehen.values()];
}
const gruppen = Object.fromEntries(Object.entries(PL).map(([k, id]) => [k, gefaltet(id)]));

/* ---- Kompaktheit je Raum: z, Vorzeichen = kompakt ------------------- */
const binnen = g => { const p = []; for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) p.push([idx.get(g[i]), idx.get(g[j])]); return p; };
function untergrundStat(M, vorzeichen) {
  const w = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) w.push(M[i][j]);
  const m = w.reduce((a, b) => a + b, 0) / w.length;
  const sd = Math.sqrt(w.reduce((a, b) => a + (b - m) ** 2, 0) / w.length);
  return { m, sd, vorzeichen };
}
const U = { hoch: untergrundStat(HOCH, +1) };
for (const [name, M] of Object.entries(PROJ)) U[name] = untergrundStat(M, -1);

console.log('== KOMPAKTHEIT DER GRUPPEN: z-Wert (positiv = kompakt) ==');
console.log('Gruppe            768d   NMDS2D  UMAP2D  NMDS3D  UMAP3D');
for (const [name, g] of Object.entries(gruppen)) {
  const zeile = [name.padEnd(16)];
  const bp = binnen(g);
  { const w = bp.map(([i, j]) => HOCH[i][j]); const mw = w.reduce((a, b) => a + b, 0) / w.length;
    zeile.push(((mw - U.hoch.m) / U.hoch.sd).toFixed(2).padStart(6)); }
  for (const [pn, M] of Object.entries(PROJ)) {
    const w = bp.map(([i, j]) => M[i][j]); const mw = w.reduce((a, b) => a + b, 0) / w.length;
    zeile.push(((U[pn].m - mw) / U[pn].sd).toFixed(2).padStart(7));
  }
  console.log(zeile.join(' '));
}

/* ---- Nachbarschaftstreue: echte Top-10 vs. Karten-Top-10 ------------ */
function topK(M, i, k, groesserIstNaeher) {
  const reihe = [];
  for (let j = 0; j < n; j++) if (j !== i) reihe.push([M[i][j], j]);
  reihe.sort((a, b) => groesserIstNaeher ? b[0] - a[0] : a[0] - b[0]);
  return new Set(reihe.slice(0, k).map(([, j]) => j));
}
console.log('\n== NACHBARSCHAFTSTREUE: Anteil der echten Top-10 (768d), die die Projektion in ihren Top-10 behält ==');
console.log('(Zufallserwartung: 0,04)');
for (const [pn, M] of Object.entries(PROJ)) {
  let summe = 0;
  for (let i = 0; i < n; i++) {
    const echt = topK(HOCH, i, 10, true), proj = topK(M, i, 10, false);
    let treffer = 0; for (const j of echt) if (proj.has(j)) treffer++;
    summe += treffer / 10;
  }
  console.log(`  ${pn.padEnd(8)} ${(summe / n).toFixed(3)}`);
}

/* ---- Gespeicherte Nachbarn: aus welchem Raum stammen sie? ----------- */
console.log('\n== GESPEICHERTE NACHBARLISTE der Karte vs. echte 768d-Top-10 ==');
let deckungGesamt = 0, deckbar = 0;
for (let i = 0; i < n; i++) {
  const gespeichert = (karteVon.get(ids[i]).nachbarn || []).map(([id]) => id).filter(id => idx.has(id));
  if (!gespeichert.length) continue;
  const echt = topK(HOCH, i, gespeichert.length, true);
  let treffer = 0; for (const id of gespeichert) if (echt.has(idx.get(id))) treffer++;
  deckungGesamt += treffer / gespeichert.length; deckbar++;
}
console.log(`  Deckung über ${deckbar} Songs: ${(deckungGesamt / deckbar).toFixed(3)}`);
const bsp = ids[0];
const gesp = (karteVon.get(bsp).nachbarn || []).slice(0, 3);
for (const [nid, d] of gesp) {
  const cos = HOCH[idx.get(bsp)][idx.get(nid)];
  console.log(`  Beispiel: dist ${d} | 1−cos = ${(1 - cos).toFixed(3)}  (${titelVon(nid)})`);
}
console.log('\nStress der Karte: 2D', karte.stress, '| 3D', karte.stress3d);
