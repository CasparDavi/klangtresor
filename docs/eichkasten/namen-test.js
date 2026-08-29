#!/usr/bin/env node
/* Belastungstest: die 14 GERECHNETEN Gruppen von gestern früh (Sicherung
   vor Schritt 2) mit Ortsbegriffen benennen — alte Kontrastnamen gegen
   neue Ortsnamen. Nutzt den Wortvektoren-Cache. */
'use strict';
const fs = require('fs'), zlib = require('zlib');
const REPO = '/Volumes/Extreme_SSD/Entwicklung/SunoArchive';
const alt = JSON.parse(fs.readFileSync(REPO + '/library/entwurf/karte-geschichten.json.vor-schritt2'));
const kondJson = JSON.parse(fs.readFileSync(REPO + '/library/kondensate/kondensate.json')).lieder;
const gesch = JSON.parse(fs.readFileSync(REPO + '/library/geschichten.json')).songs;
const katalog = JSON.parse(zlib.gunzipSync(fs.readFileSync(REPO + '/library/katalog.json.gz')));
/* Wortvektoren aus dem Produktivstand (bin/ortsbegriffe.js pflegt sie). */
const wortVek = new Map(Object.entries(JSON.parse(fs.readFileSync(REPO + '/library/wortvektoren.json')).woerter)
  .map(([w, v]) => [w, Float64Array.from(v)]));

const ids = Object.keys(gesch);
const norm = e => { let s = 0; for (const x of e) s += x * x; const n = Math.sqrt(s) || 1; return Float64Array.from(e, x => x / n); };
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const liedVek = new Map(ids.map(id => [id, norm(gesch[id].emb)]));
const anzeige = new Map(), liedWoerter = new Map();
for (const id of ids) {
  const e = kondJson[id]; const m = e && (e.modelle['opus-f2-gesamt'] || e.modelle['opus']); if (!m) continue;
  liedWoerter.set(id, m.map(w => w.toLowerCase()));
  for (const w of m) if (!anzeige.has(w.toLowerCase())) anzeige.set(w.toLowerCase(), w);
}
const sockel = new Map();
for (const [w, v] of wortVek) { let s = 0; for (const id of ids) s += dot(v, liedVek.get(id)); sockel.set(w, s / ids.length); }

function ortsname(v, k = 3, naheLieder = 20) {
  const nah = ids.map(id => [dot(liedVek.get(id), v), id]).sort((a, b) => b[0] - a[0]).slice(0, naheLieder);
  const kandidaten = new Set();
  for (const [, id] of nah) for (const w of (liedWoerter.get(id) || [])) kandidaten.add(w);
  return [...kandidaten].map(w => [dot(wortVek.get(w), v) - sockel.get(w), w])
    .sort((a, b) => b[0] - a[0]).slice(0, k).map(([, w]) => anzeige.get(w)).join(' · ');
}

console.log('== 14 GERECHNETE GRUPPEN: Kontrastname (gestern) vs. Ortsname (generisch) ==\n');
const songsArr = Array.isArray(alt.songs) ? alt.songs : Object.values(alt.songs);
for (const g of alt.gruppen) {
  const m = songsArr.filter(s => s.gruppe === g.nr && liedVek.has(s.id)).map(s => s.id);
  if (!m.length) continue;
  const s = new Float64Array(768);
  for (const id of m) { const v = liedVek.get(id); for (let i = 0; i < 768; i++) s[i] += v[i]; }
  console.log(`  [${String(m.length).padStart(3)}]  alt: ${g.name}`);
  console.log(`         neu: ${ortsname(norm(s))}`);
  const bsp = m.slice(0, 3).map(id => (katalog.songs[id] || {}).titel).join(', ');
  console.log(`         z.B. ${bsp}\n`);
}
