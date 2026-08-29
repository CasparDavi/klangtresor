#!/usr/bin/env node
/* Eichkasten-Messlauf, 28.08.2026 — rein lesend.
   Hält die im Gespräch entwickelte Soll-Matrix (Playlists als bekannte
   Wahrheit) gegen die drei Vektorsätze: Kondensat, Volltext, Klang. */
'use strict';
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const REPO = '/Volumes/Extreme_SSD/Entwicklung/SunoArchive';
const lies = p => JSON.parse(fs.readFileSync(path.join(REPO, p)));

const katalog = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(REPO, 'library/katalog.json.gz'))));
const kond = lies('library/geschichten.json').songs;                       // Kondensat-Vektoren
const voll = lies('library/kondensate/vorher-vektoren/geschichten.json').songs; // Volltext-Vektoren
const klang = lies('library/klang.json').songs;                            // Klang-Vektoren

/* ---- Song-Menge: die 257 mit Geschichten-Vektor -------------------- */
const ids = Object.keys(kond);
const idx = new Map(ids.map((id, i) => [id, i]));
const titelVon = id => (katalog.songs[id] || {}).titel || '(?)';

/* ---- Kosinus-Matrizen je Raum -------------------------------------- */
function matrix(vek) {
  const n = ids.length, dim = vek[ids[0]].emb.length;
  const V = ids.map(id => {
    const e = vek[id] ? vek[id].emb : null;
    if (!e) return null;
    let s = 0; for (const x of e) s += x * x;
    const norm = Math.sqrt(s) || 1;
    return Float64Array.from(e, x => x / norm);
  });
  const M = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    if (!V[i] || !V[j]) { M[i][j] = M[j][i] = NaN; continue; }
    let d = 0; const a = V[i], b = V[j];
    for (let k = 0; k < dim; k++) d += a[k] * b[k];
    M[i][j] = M[j][i] = d;
  }
  return M;
}
console.log('Rechne Kosinus-Matrizen (3 Räume à 257×257) …');
const MK = matrix(kond), MV = matrix(voll), MC = matrix(klang);
const RAUM = { kondensat: MK, volltext: MV, klang: MC };

/* ---- Titel-Normalisierung für Werkfamilien ------------------------- */
function basis(t) {
  return t.toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/\((ft\.?|feat\.?)[^)]*\)/gi, ' ')
    .replace(/\([^)]*\)\s*$/g, ' ')          // Klammerzusatz am Ende
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[-–—\s]*v\d+\b/gi, ' ')
    .replace(/\s+2\.0\b/g, ' ')
    .replace(/['’]25\b/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
const familie = new Map();                    // basis -> [ids]
for (const id of ids) {
  const b = basis(titelVon(id));
  if (!familie.has(b)) familie.set(b, []);
  familie.get(b).push(id);
}
/* Vertreter: höchste v-Nummer, sonst jüngstes Erstellungsdatum */
function vertreter(mitglieder) {
  const vNr = id => { const m = titelVon(id).match(/v(\d+)\b/i); return m ? +m[1] : 0; };
  return [...mitglieder].sort((a, b) =>
    vNr(b) - vNr(a) || String(katalog.songs[b].erstellt).localeCompare(String(katalog.songs[a].erstellt)))[0];
}
const vertreterVon = new Map();               // id -> Familienvertreter-id
for (const [, mg] of familie) { const v = vertreter(mg); for (const id of mg) vertreterVon.set(id, v); }

/* ---- Playlists ------------------------------------------------------ */
const PL = {
  lea: '041a95dd-8e82-4430-9f2f-0effcae363ac',
  atme: '6c2d7753-bb4a-4891-846a-dd7f5114770f',
  bioGefahr: '7de2239d-3c52-4981-bae7-709a6c65049e',
  biohazard: 'f3306c7f-4db5-4737-903d-3ab3783115d5',
  essen: '11045396-717e-4339-8118-689925987526',
  guteLaune: '7324b0d6-820e-467d-a7c0-9267794cd25b',
  balladen: 'dd857498-6133-4266-b355-969d5276bd5c',
  vorLangerZeit: '305d7805-ed18-461b-b484-276a3236bf1d',
  deutscheSchatten: '9597981b-42c3-45ed-a35d-155dd107e395',
  teutonicTales: '5ca07ea2-9980-431e-a0a6-fbaa01e1d636',
  kaeshi: 'e4b2352d-c143-47a6-b32b-86e16d457c6a',
  gegenueber: 'a13d2d5a-abec-4bc2-8e38-9918b8b3a366',
  ahnheim: '96f9a78e-8b29-4748-9abe-52e05e148756',
  ndh: 'fbe4026a-f0de-48ab-ac3f-4b9fc5e074cc',
  industrial: '41338c7e-6873-4f1f-9449-f732ad63daed',
  edm: 'e865beec-709e-497c-bb5c-645a28d63494',
  minimal: 'b9f4ac6f-5951-4784-9c29-7b0ddb327aa7',
  energyMetal: 'e8779caf-19bf-497c-973c-3a49c9a646a9',
  niceSongs: 'c1c095f6-98ec-4d4b-8c66-7f903d49d80b',
  hochgefuehl: '6e8022ee-db9f-406e-8136-289a34cdf423',
  deutschPop: 'a07b341f-0798-4be3-9957-a51db7688586',
  fokus: 'c0c1547f-d62e-46ea-9cb2-740a952a6a10',
};
function eintraege(plKey) {
  return [...katalog.playlists[PL[plKey]].eintraege]
    .sort((a, b) => a.position - b.position);
}
function eigeneMitVektor(plKey) {              // [{songId, position}]
  return eintraege(plKey).filter(e => e.eigen !== false && idx.has(e.songId));
}
function gefaltet(plKey, extraFamilien = []) { // ein Vertreter je Werkfamilie
  const extra = new Map();                     // id -> Gruppenschlüssel für Handfamilien
  for (const fam of extraFamilien) for (const t of fam) extra.set(t.toLowerCase(), fam[0].toLowerCase());
  const gesehen = new Map();
  for (const e of eigeneMitVektor(plKey)) {
    const t = titelVon(e.songId);
    const schluessel = extra.get(t.toLowerCase()) || basis(t);
    if (!gesehen.has(schluessel)) gesehen.set(schluessel, vertreterVon.get(e.songId) || e.songId);
  }
  return [...new Set(gesehen.values())].filter(id => idx.has(id));
}

/* ---- Paar-Statistik ------------------------------------------------- */
const stat = werte => {
  const w = werte.filter(x => Number.isFinite(x));
  if (!w.length) return { n: 0 };
  const m = w.reduce((a, b) => a + b, 0) / w.length;
  const sd = Math.sqrt(w.reduce((a, b) => a + (b - m) ** 2, 0) / w.length);
  return { n: w.length, mittel: +m.toFixed(4), streuung: +sd.toFixed(4) };
};
const paareKos = (M, paare) => paare.map(([a, b]) => M[idx.get(a)][idx.get(b)]);
const binnenPaare = liste => { const p = []; for (let i = 0; i < liste.length; i++) for (let j = i + 1; j < liste.length; j++) p.push([liste[i], liste[j]]); return p; };
const kreuzPaare = (A, B) => { const p = []; for (const a of A) for (const b of B) if (a !== b) p.push([a, b]); return p; };

/* ---- Bekannte Paare rekonstruieren ---------------------------------- */
/* v2-Familien: alle Familien mit >1 Mitglied */
const v2Paare = [];
for (const [, mg] of familie) if (mg.length > 1) v2Paare.push(...binnenPaare(mg));

/* Gegenüber: 19 Nachbarpaare */
const gg = eigeneMitVektor('gegenueber');
const gegenueberPaare = [];
for (let i = 0; i + 1 < gg.length; i += 2) gegenueberPaare.push([gg[i].songId, gg[i + 1].songId]);

/* Ahnheim: 9 Nachbarpaare an bekannten Positionen; Zuordnung Fassung/Formzwilling folgt empirisch */
const ahnE = eintraege('ahnheim');
const beiPos = p => { const e = ahnE.find(x => x.position === p); return e && idx.has(e.songId) ? e.songId : null; };
const ahnheimNachbarn = [[2,3],[4,5],[7,8],[10,11],[16,17],[18,19],[20,21],[22,23],[24,25]]
  .map(([a, b]) => [beiPos(a), beiPos(b)]).filter(([a, b]) => a && b);

/* Übersetzungen: DS(1-7)↔TT(1-7), Bio↔Biohazard (Titelzuordnung), Lakritz, Kaeshi (2,3),(5,6),(9,10) */
const dsE = eintraege('deutscheSchatten'), ttE = eintraege('teutonicTales');
const uePare = [];
for (let p = 1; p <= 7; p++) {
  const d = dsE.find(x => x.position === p), t = ttE.find(x => x.position === p);
  if (d && t && idx.has(d.songId) && idx.has(t.songId)) uePare.push([d.songId, t.songId, 'de↔en']);
}
const bioMap = [['Dogma', 'The Dogma'], ['Wirt', 'Host'], ['Erweckt', 'Awakened'], ['Asche und Staub', 'Ashes and Dust'], ['Testosteron v2', 'Testosterone']];
const idVonTitel = t => { const s = Object.values(katalog.songs).find(x => x.titel === t && idx.has(x.id)); return s ? s.id : null; };
for (const [de, en] of bioMap) { const a = idVonTitel(de), b = idVonTitel(en); if (a && b) uePare.push([a, b, 'de↔en']); }
{ const a = idVonTitel('Lakritz'), b = idVonTitel('Lakritz means LICORICE'); if (a && b) uePare.push([a, b, 'de↔en']); }
const kaE = eintraege('kaeshi');
for (const [pJ, pD] of [[2, 3], [5, 6], [9, 10]]) {
  const j = kaE.find(x => x.position === pJ), d = kaE.find(x => x.position === pD);
  if (j && d && idx.has(j.songId) && idx.has(d.songId)) uePare.push([j.songId, d.songId, 'ja↔de']);
}

/* ---- Serien und Gruppen --------------------------------------------- */
const lea = eigeneMitVektor('lea').map(e => e.songId);
const atme = eigeneMitVektor('atme').map(e => e.songId);
const gruppen = {
  lea, atme,
  bioGefahr: gefaltet('bioGefahr'),
  biohazard: gefaltet('biohazard'),
  essen: gefaltet('essen', [['Lakritz', 'Lakritz means LICORICE']]),
  guteLaune: gefaltet('guteLaune'),
  balladen: gefaltet('balladen'),
  vorLangerZeit: gefaltet('vorLangerZeit'),
  deutscheSchatten: gefaltet('deutscheSchatten'),
  teutonicTales: gefaltet('teutonicTales'),
  ndh: gefaltet('ndh'), industrial: gefaltet('industrial'), edm: gefaltet('edm'),
  minimal: gefaltet('minimal'), energyMetal: gefaltet('energyMetal'),
  niceSongs: gefaltet('niceSongs'), hochgefuehl: gefaltet('hochgefuehl'),
  deutschPop: gefaltet('deutschPop'), fokus: gefaltet('fokus'),
};

/* ---- Untergrund: Paare ohne bekannte Beziehung ---------------------- */
const verwandt = new Set();
const merk = paare => { for (const [a, b] of paare) { verwandt.add(a + '|' + b); verwandt.add(b + '|' + a); } };
merk(v2Paare); merk(gegenueberPaare); merk(ahnheimNachbarn); merk(uePare.map(p => [p[0], p[1]]));
for (const g of Object.values(gruppen)) merk(binnenPaare(g));
function untergrund(M) {
  const w = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++)
    if (!verwandt.has(ids[i] + '|' + ids[j])) w.push(M[i][j]);
  return stat(w);
}

/* ---- A) Leiter je Raum ---------------------------------------------- */
const ergebnis = { stand: '2026-08-28', leiter: {}, ahnheimEinzeln: [], serien: {}, matrixZeilen: {}, japanisch: [], zeitpfeil: {}, kollision: {} };
for (const [raum, M] of Object.entries(RAUM)) {
  const u = untergrund(M);
  ergebnis.leiter[raum] = {
    fassungen: stat(paareKos(M, v2Paare)),
    gegenueber: stat(paareKos(M, gegenueberPaare)),
    uebersetzungen: stat(paareKos(M, uePare.map(p => [p[0], p[1]]))),
    ahnheimNachbarn: stat(paareKos(M, ahnheimNachbarn)),
    leaBinnen: stat(paareKos(M, binnenPaare(lea))),
    atmeBinnen: stat(paareKos(M, binnenPaare(atme))),
    leaAtmeKreuz: stat(paareKos(M, kreuzPaare(lea, atme))),
    untergrund: u,
  };
}
/* Ahnheim-Nachbarn einzeln (Fassung oder Formzwilling?) — im Kondensatraum */
for (const [a, b] of ahnheimNachbarn)
  ergebnis.ahnheimEinzeln.push({ paar: titelVon(a) + '  ×  ' + titelVon(b), kondensat: +MK[idx.get(a)][idx.get(b)].toFixed(3), volltext: +MV[idx.get(a)][idx.get(b)].toFixed(3), klang: +MC[idx.get(a)][idx.get(b)].toFixed(3) });

/* ---- C) Vier-Felder-Matrix: Kompaktheit je Gruppe je Raum ----------- */
for (const [name, mitglieder] of Object.entries(gruppen)) {
  if (mitglieder.length < 3) { ergebnis.matrixZeilen[name] = { n: mitglieder.length, zuKlein: true }; continue; }
  const zeile = { n: mitglieder.length };
  for (const [raum, M] of Object.entries(RAUM)) {
    const b = stat(paareKos(M, binnenPaare(mitglieder)));
    const u = ergebnis.leiter[raum].untergrund;
    zeile[raum] = { binnen: b.mittel, z: +((b.mittel - u.mittel) / u.streuung).toFixed(2) };
  }
  ergebnis.matrixZeilen[name] = zeile;
}

/* ---- D) Zeitpfeil in den Serien ------------------------------------- */
function spearman(x, y) {
  const rang = v => { const s = [...v].map((w, i) => [w, i]).sort((a, b) => a[0] - b[0]); const r = new Array(v.length); s.forEach(([, i], k) => r[i] = k + 1); return r; };
  const rx = rang(x), ry = rang(y), n = x.length;
  const mx = rx.reduce((a, b) => a + b) / n, my = ry.reduce((a, b) => a + b) / n;
  let zä = 0, nx = 0, ny = 0;
  for (let i = 0; i < n; i++) { zä += (rx[i] - mx) * (ry[i] - my); nx += (rx[i] - mx) ** 2; ny += (ry[i] - my) ** 2; }
  return zä / Math.sqrt(nx * ny);
}
function zeitpfeil(serie, plKey, M) {
  const posVon = new Map(eigeneMitVektor(plKey).map(e => [e.songId, e.position]));
  const dPos = [], dVek = [];
  for (const [a, b] of binnenPaare(serie)) {
    dPos.push(Math.abs(posVon.get(a) - posVon.get(b)));
    dVek.push(1 - M[idx.get(a)][idx.get(b)]);
  }
  const rho = spearman(dPos, dVek);
  /* Permutationstest, fester Startwert — reproduzierbar */
  let saat = 42; const zufall = () => (saat = (saat * 1103515245 + 12345) % 2147483648) / 2147483648;
  const posListe = [...new Set(dPos)]; // nicht gebraucht, Klarheit halber
  const positionen = serie.map(id => posVon.get(id));
  let extremer = 0; const RUNDEN = 2000;
  for (let r = 0; r < RUNDEN; r++) {
    const p = [...positionen];
    for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(zufall() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    const dP = []; let k = 0;
    for (let i = 0; i < serie.length; i++) for (let j = i + 1; j < serie.length; j++) dP.push(Math.abs(p[i] - p[j]));
    if (spearman(dP, dVek) >= rho) extremer++;
  }
  return { rho: +rho.toFixed(3), p: +(extremer / RUNDEN).toFixed(3) };
}
ergebnis.zeitpfeil = {
  lea: { kondensat: zeitpfeil(lea, 'lea', MK), volltext: zeitpfeil(lea, 'lea', MV) },
  atme: { kondensat: zeitpfeil(atme, 'atme', MK), volltext: zeitpfeil(atme, 'atme', MV) },
};

/* ---- E) Japanisch: Partner-Rang Volltext vs. Kondensat -------------- */
function partnerRang(M, von, zu) {
  const i = idx.get(von), zielJ = idx.get(zu);
  const reihe = [];
  for (let j = 0; j < ids.length; j++) if (j !== i && Number.isFinite(M[i][j])) reihe.push([M[i][j], j]);
  reihe.sort((a, b) => b[0] - a[0]);
  return reihe.findIndex(([, j]) => j === zielJ) + 1;
}
for (const [a, b, art] of uePare) {
  ergebnis.japanisch.push({
    art, paar: titelVon(a) + '  ×  ' + titelVon(b),
    volltext: { kos: +MV[idx.get(a)][idx.get(b)].toFixed(3), rangHin: partnerRang(MV, a, b), rangZurueck: partnerRang(MV, b, a) },
    kondensat: { kos: +MK[idx.get(a)][idx.get(b)].toFixed(3), rangHin: partnerRang(MK, a, b), rangZurueck: partnerRang(MK, b, a) },
  });
}

/* ---- G) Kollision Gute Laune ↔ Lea ---------------------------------- */
for (const [raum, M] of Object.entries(RAUM)) {
  ergebnis.kollision[raum] = {
    leaBinnen: stat(paareKos(M, binnenPaare(lea))).mittel,
    guteLauneBinnen: stat(paareKos(M, binnenPaare(gruppen.guteLaune))).mittel,
    kreuz: stat(paareKos(M, kreuzPaare(gruppen.guteLaune, lea))).mittel,
    untergrund: ergebnis.leiter[raum].untergrund.mittel,
  };
}

/* ---- Randnotizen ----------------------------------------------------- */
ergebnis.notizen = {
  gruppenGroessen: Object.fromEntries(Object.entries(gruppen).map(([k, v]) => [k, v.length])),
  fassungsPaare: v2Paare.length,
  uebersetzungsPaare: uePare.length,
  achsenEnden: ['Okkultation', 'Gleich', 'Stumm'].map(t => {
    const s = Object.values(katalog.songs).find(x => x.titel === t);
    return { titel: t, lyricsZeichen: s && s.lyrics ? s.lyrics.length : 0, imGeschichtenRaum: s ? idx.has(s.id) : false };
  }),
};

const ZIEL = path.join(__dirname, 'messlauf-ergebnis.json');
fs.writeFileSync(ZIEL, JSON.stringify(ergebnis, null, 1));
console.log('→', ZIEL);

/* ---- Protokoll ------------------------------------------------------- */
const z = x => x === undefined ? '  —  ' : x.toFixed ? x.toFixed(3) : x;
console.log('\n== LEITER (mittlerer Kosinus | n) ==');
for (const sprosse of ['fassungen', 'gegenueber', 'uebersetzungen', 'ahnheimNachbarn', 'leaBinnen', 'atmeBinnen', 'leaAtmeKreuz', 'untergrund']) {
  const k = ergebnis.leiter.kondensat[sprosse], v = ergebnis.leiter.volltext[sprosse], c = ergebnis.leiter.klang[sprosse];
  console.log(`  ${sprosse.padEnd(16)} Kondensat ${z(k.mittel)} (${k.n})   Volltext ${z(v.mittel)} (${v.n})   Klang ${z(c.mittel)} (${c.n})`);
}
console.log('\n== AHNHEIM-NACHBARN EINZELN (Kondensat / Volltext / Klang) ==');
for (const e of ergebnis.ahnheimEinzeln) console.log(`  ${z(e.kondensat)} / ${z(e.volltext)} / ${z(e.klang)}  ${e.paar}`);
console.log('\n== VIER-FELDER (z-Wert gegen Untergrund: Geschichte=Kondensat | Klang) ==');
for (const [name, r] of Object.entries(ergebnis.matrixZeilen)) {
  if (r.zuKlein) { console.log(`  ${name.padEnd(16)} zu klein (n=${r.n})`); continue; }
  console.log(`  ${name.padEnd(16)} n=${String(r.n).padStart(2)}  Geschichte z=${String(r.kondensat.z).padStart(6)}  Klang z=${String(r.klang.z).padStart(6)}  (Volltext z=${r.volltext.z})`);
}
console.log('\n== ZEITPFEIL (Spearman-rho, Permutations-p) ==');
for (const [s, r] of Object.entries(ergebnis.zeitpfeil))
  console.log(`  ${s.padEnd(5)} Kondensat rho=${r.kondensat.rho} (p=${r.kondensat.p})   Volltext rho=${r.volltext.rho} (p=${r.volltext.p})`);
console.log('\n== ÜBERSETZUNGSPAARE: Partner-Rang (hin/zurück) Volltext → Kondensat ==');
for (const e of ergebnis.japanisch)
  console.log(`  [${e.art}] VT ${z(e.volltext.kos)} R${e.volltext.rangHin}/${e.volltext.rangZurueck}  →  KD ${z(e.kondensat.kos)} R${e.kondensat.rangHin}/${e.kondensat.rangZurueck}   ${e.paar}`);
console.log('\n== KOLLISION Gute Laune ↔ Lea ==');
for (const [raum, r] of Object.entries(ergebnis.kollision))
  console.log(`  ${raum.padEnd(9)} LeaBinnen ${z(r.leaBinnen)}  GLBinnen ${z(r.guteLauneBinnen)}  Kreuz ${z(r.kreuz)}  Untergrund ${z(r.untergrund)}`);
console.log('\n== NOTIZEN ==');
console.log('  Gruppengrößen (gefaltet):', JSON.stringify(ergebnis.notizen.gruppenGroessen));
console.log('  Fassungspaare:', ergebnis.notizen.fassungsPaare, '| Übersetzungspaare:', ergebnis.notizen.uebersetzungsPaare);
for (const a of ergebnis.notizen.achsenEnden) console.log('  Achsen-Ende:', a.titel, '| Zeichen:', a.lyricsZeichen, '| im Geschichten-Raum:', a.imGeschichtenRaum);
