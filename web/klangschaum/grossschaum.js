/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   GROSSE SCHAEUME - alle einzeln, ohne Paketnaehte
   web/klangschaum/grossschaum.js

   Caspar_D, 07.10.2026: „das treemap problem lösen wir richtig" - ein flacher Schaum mit Tausenden Zellen (Groupieschaum,
   Tarja: 4816 Personen) braucht in einem Gefaess Minuten bis Stunden (die Loeserschritte wachsen mit der Zellzahl). Bisher
   (1.0.31) darum: die 400 Aktivsten einzeln, der Rest je Areal als „+N weitere". Jetzt, fuer jedes Areal mit mehr als SCHWELLE
   Zellen, Caspar_Ds Verfahren (Laborbuch Treemapper/docs/paper/LABORBUCH-grosse-schaeume.md):
     1. VORENTWURF aus den Startlagen der Seite (Areal-Streifen, Sonnenblumenspirale, die Fleissigsten in der Mitte): Kreise
        mit der Sollflaeche der Zelle werden von dort aus zusammengeschoben, bis sie sich nicht mehr ueberlappen - die Anordnung
        bleibt, die Flaechen passen (die Spirale allein verteilt nach Rang, nicht nach Flaeche: Pakete daraus quollen auf).
     2. PAKETE direkt aus dem Vorentwurf (~PAKET Zellen, k-Mittel auf den Kreisen, gewichtet nach Flaeche) - „du rechnest gleich
        die Pakete und innerhalb der Paketgrenzen ordnest du die Zellen zu".
     3. SCHAUM je Paket mit der Engine (Pakete als Gefaesse im Areal, Zellen darin, Startpunkte aus dem Vorentwurf).
     4. REISSVERSCHLUSS (reissverschluss.js): die Paketnaehte mit eingefrorenem Rand wegrechnen; Arealgrenzen bleiben glatt.
   Ergebnis: derselbe Baum, den layoutTree liefert (Areale und Blaetter mit Umriss und Kantenmarken) - die Seite zeichnet ihn
   wie jeden anderen. Kleine Schaeume und Areale gehen den bisherigen Weg.
   ============================================================= */
import { buildTree, layoutTree, layoutTreeParallel, nodeKey, inside, centroid, shoelace, tagEdges } from './foamtree.js';
import { reissverschluss } from './reissverschluss.js';

export const SCHWELLE = 600, PAKET = 100;
const blaetterVon = (n) => n.kids && n.kids.size ? [...n.kids.values()].flatMap(blaetterVon) : [n];

/* Kreise mit Radius r von ihren Startpunkten aus im Vieleck poly zusammenschieben (Ueberlappungen je zur Haelfte nach dem
   Groessenverhaeltnis aufloesen, am Rand nach innen schieben). Grosse Kreise (> 2,5 x Median) pruefen ihre Nachbarn eigens -
   sonst muesste das Raster fuer jeden kleinen Kreis den Radius des groessten absuchen. */
export function kreisePacken(poly, start, r, runden = 220) {
  const n = start.length, P = start.map(p => p.slice()), c0 = centroid(poly);
  const sortiert = r.slice().sort((a, b) => a - b), med = sortiert[n >> 1] || 1, grenzR = 2.5 * med, zelle = 2 * grenzR;
  const gross = [], kanten = poly.map((p, i) => [p, poly[(i + 1) % poly.length]]);
  for (let i = 0; i < n; i++) if (r[i] > grenzR) gross.push(i);
  const randAbstand = (p) => { let best = Infinity, nx = 0, ny = 0;
    for (const [a, b] of kanten) { const ex = b[0] - a[0], ey = b[1] - a[1], L2 = ex * ex + ey * ey || 1e-300;
      const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / L2)), qx = a[0] + t * ex, qy = a[1] + t * ey, d = Math.hypot(p[0] - qx, p[1] - qy);
      if (d < best) { best = d; nx = (p[0] - qx) / (d || 1); ny = (p[1] - qy) / (d || 1); } }
    return [best, nx, ny]; };
  const paar = (i, j, dx, dy) => { const p = P[i], q = P[j], ex = q[0] - p[0], ey = q[1] - p[1], d = Math.hypot(ex, ey) || 1e-9, ueber = r[i] + r[j] - d;
    if (ueber <= 0) return; const wi = r[j] / (r[i] + r[j]), wj = 1 - wi;
    dx[i] -= ex / d * ueber * wi * 0.5; dy[i] -= ey / d * ueber * wi * 0.5; dx[j] += ex / d * ueber * wj * 0.5; dy[j] += ey / d * ueber * wj * 0.5; };
  for (let it = 0; it < runden; it++) {
    const grid = new Map(), dx = new Float64Array(n), dy = new Float64Array(n);
    for (let i = 0; i < n; i++) { const k = Math.floor(P[i][0] / zelle) + ',' + Math.floor(P[i][1] / zelle); let l = grid.get(k); if (!l) grid.set(k, l = []); l.push(i); }
    for (let i = 0; i < n; i++) { if (r[i] > grenzR) continue; const gx = Math.floor(P[i][0] / zelle), gy = Math.floor(P[i][1] / zelle);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const l = grid.get((gx + a) + ',' + (gy + b)); if (l) for (const j of l) if (j > i && r[j] <= grenzR) paar(i, j, dx, dy); } }
    for (const i of gross) { const reich = Math.ceil((r[i] + grenzR) / zelle), gx = Math.floor(P[i][0] / zelle), gy = Math.floor(P[i][1] / zelle);
      for (let a = -reich; a <= reich; a++) for (let b = -reich; b <= reich; b++) { const l = grid.get((gx + a) + ',' + (gy + b)); if (l) for (const j of l) if (j !== i && (r[j] <= grenzR || j > i)) paar(i, j, dx, dy); } }
    const rand = it % 4 === 0 || it >= runden - 8;
    for (let i = 0; i < n; i++) { P[i][0] += dx[i]; P[i][1] += dy[i];
      if (!rand) continue;
      if (!inside(poly, P[i])) { P[i][0] += (c0[0] - P[i][0]) * 0.25; P[i][1] += (c0[1] - P[i][1]) * 0.25; continue; }
      const [d, nx, ny] = randAbstand(P[i]); if (d < r[i]) { P[i][0] += nx * (r[i] - d); P[i][1] += ny * (r[i] - d); } }
  }
  for (let i = 0; i < n; i++) for (let g = 0; g < 30 && !inside(poly, P[i]); g++) { P[i][0] += (c0[0] - P[i][0]) * 0.2; P[i][1] += (c0[1] - P[i][1]) * 0.2; }
  return P;
}
/* k-Mittel, gewichtet: Start mit der groessten Zelle und dann jeweils der fernsten (deterministisch), 12 Runden */
export function kMittel(P, g, k) {
  const n = P.length, zent = [], dmin = new Float64Array(n).fill(Infinity);
  let i0 = 0; for (let i = 1; i < n; i++) if (g[i] > g[i0]) i0 = i; zent.push(P[i0].slice());
  while (zent.length < k) { const z = zent[zent.length - 1]; let best = -1, bi = 0;
    for (let i = 0; i < n; i++) { const d = (P[i][0] - z[0]) ** 2 + (P[i][1] - z[1]) ** 2; if (d < dmin[i]) dmin[i] = d; if (dmin[i] > best) { best = dmin[i]; bi = i; } }
    zent.push(P[bi].slice()); }
  const zu = new Int32Array(n);
  for (let it = 0; it < 12; it++) {
    for (let i = 0; i < n; i++) { let b = 0, bd = Infinity; for (let j = 0; j < k; j++) { const d = (P[i][0] - zent[j][0]) ** 2 + (P[i][1] - zent[j][1]) ** 2; if (d < bd) { bd = d; b = j; } } zu[i] = b; }
    const s = zent.map(() => [0, 0, 0]); for (let i = 0; i < n; i++) { const t = s[zu[i]]; t[0] += P[i][0] * g[i]; t[1] += P[i][1] * g[i]; t[2] += g[i]; }
    s.forEach((t, j) => { if (t[2] > 0) zent[j] = [t[0] / t[2], t[1] / t[2]]; });
  }
  return { zu, zent };
}

/* HELFER-POOL: n Worker aus neu() (Browser: new Worker(..., {type:'module'}); Node: eine Bruecke). Ein freier Helfer nimmt die
   groesste wartende Aufgabe (wie im Prophane-Viewer). Fuer layoutTreeParallel: size, beginPass, run; dazu alle() fuer
   Rundsendungen und kacheln() fuer den Reissverschluss. */
export function helferPool(n, neu) {
  const warten = new Map(), schlange = []; let id = 0;
  const weiter = (h) => { if (h.belegt || !schlange.length) return; schlange.sort((a, b) => b.gewicht - a.gewicht); const t = schlange.shift();
    h.belegt = true; warten.set(t.id, t); h.w.postMessage({ ...t.nachricht, id: t.id }); };
  const hs = Array.from({ length: n }, () => { const w = neu(), h = { w, belegt: false };
    w.onmessage = (e) => { const m = e.data, t = warten.get(m.id); if (!t) return;
      if (m.spawn) { if (t.onSpawn) t.onSpawn(...m.spawn); return; }
      warten.delete(m.id); h.belegt = false; m.error ? t.nein(new Error(m.error)) : t.ok(m); weiter(h); };
    return h; });
  const auftrag = (nachricht, gewicht, onSpawn) => new Promise((ok, nein) => { schlange.push({ id: id++, nachricht, gewicht, onSpawn, ok, nein }); hs.forEach(weiter); });
  return { size: n,
    alle: (msg) => hs.forEach(h => h.w.postMessage(msg)),
    beginPass: (msg) => hs.forEach(h => h.w.postMessage({ type: 'pass', ...msg })),
    run: (task, weight, onSpawn) => auftrag({ type: 'task', ...task }, weight, onSpawn),
    kacheln: (zustand, liste) => auftrag({ type: 'kacheln', ...zustand, kacheln: liste }, liste.length),
    schliessen: () => hs.forEach(h => { try { h.w.terminate(); } catch (e) {} }) };
}

/* Wie layoutTree(buildTree(rows, tree), layout) - fuer grosse zweistufige Schaeume ueber die vier Schritte oben.
   melde({ schritt, n, von }) zeigt den Fortgang; loesen: optionaler Ausfuehrer fuer die Kacheln des Reissverschlusses. */
export async function grossLegen(rows, tree, layout, { melde = null, helfer = null, anzahl = 4 } = {}) {
  const root = buildTree(rows, tree);
  const zweistufig = tree.levels.length === 2 && root.kids && root.kids.size;
  if (!zweistufig || ![...root.kids.values()].some(a => blaetterVon(a).length > SCHWELLE)) return layoutTree(root, layout);
  const W = layout.width || 1000, H = layout.height || 700, t0 = Date.now(), seeds = layout.seeds || {};
  const opt = { width: W, height: H, method: layout.method || 'foam', minArea: 0, minShare: 0 };
  /* Helfer nur, wenn es sie gibt (Browser ohne Unter-Worker: alles der Reihe nach - langsamer, aber es geht) */
  let pool = null; try { if (helfer && anzahl > 1) pool = helferPool(anzahl, helfer); } catch (e) { pool = null; }
  /* 1. die Areale (Engine, mit ihren Startpunkten) */
  const r0 = layoutTree(root, { ...layout, maxDepth: 0 });
  const stats = [...r0.stats], paketVon = new Map(), areale = [...root.kids.values()].filter(a => a.outline);
  let nr = 0;
  for (const a of areale) {
    nr++; if (melde) melde({ schritt: 'areal', n: nr, von: areale.length });
    const bl = blaetterVon(a);
    if (bl.length <= SCHWELLE) {                       /* klein: wie bisher */
      const r = layoutTree(root, { ...opt, seeds: layout.seeds, start: a }); stats.push(...r.stats);
      for (const k of bl) paketVon.set(k, nodeKey(a)); continue; }
    /* 2. Vorentwurf: Startpunkte mit dem Areal verschoben (wie die Engine es tut), dann Kreise zusammenschieben */
    const poly = a.outline, flaeche = Math.abs(shoelace(poly)), c = centroid(poly), alt = seeds[nodeKey(a)];
    const dx = alt ? c[0] - alt[0] : 0, dy = alt ? c[1] - alt[1] : 0;
    const start = bl.map((k, i) => { const s = seeds[nodeKey(k)]; let p = s ? [s[0] + dx, s[1] + dy] : null;
      if (!p) { const rr = Math.sqrt((i + 0.5) / bl.length) * 0.4 * Math.sqrt(flaeche), w = i * 2.39996; p = [c[0] + rr * Math.cos(w), c[1] + rr * Math.sin(w)]; }
      return p; });
    const soll = bl.map(k => k.count / a.count * flaeche), radien = soll.map(s => Math.sqrt(s / Math.PI) * 0.9);
    const P = kreisePacken(poly, start, radien);
    /* 3. Pakete aus dem Vorentwurf, dann Schaum je Paket (Pakete als Gefaesse im Areal) */
    const k = Math.max(2, Math.round(bl.length / PAKET)), { zu, zent } = kMittel(P, soll, k);
    const unter = bl.map((b, i) => Object.assign({}, rows[b.row], { __paket: 'P' + zu[i] }));
    const uRoot = buildTree(unter, { levels: ['__paket', 'row'], weight: tree.weight, leafName: tree.leafName });
    const uSaat = {};
    for (const pk of uRoot.kids.values()) { const j = +String(pk.name).slice(1); if (zent[j]) uSaat[nodeKey(pk)] = zent[j];
      for (const lf of blaetterVon(pk)) uSaat[nodeKey(lf)] = P[lf.row]; }
    let ur;
    if (pool) { pool.alle({ type: 'init', rows: unter, tree: { levels: ['__paket', 'row'], weight: tree.weight, leafName: tree.leafName }, layout: opt });
      ur = await layoutTreeParallel(uRoot, { ...opt, seeds: uSaat, outline: poly, grain: 2 }, pool); }
    else ur = layoutTree(uRoot, { ...opt, seeds: uSaat, outline: poly });
    stats.push(...ur.stats.map(s => Object.assign({}, s, { depth: (s.depth || 0) + 1, gross: true })));
    for (const lf of blaetterVon(uRoot)) { const orig = bl[lf.row]; orig.outline = lf.outline; orig.pending = false;
      orig.tags = lf.outline ? tagEdges(lf.outline, poly, a.tags, orig.depth) : null; paketVon.set(orig, nodeKey(a) + '\u0001' + lf.parent.name); }
    a.pending = false;
  }
  /* 4. Reissverschluss ueber alle Blaetter (Arealgrenzen bleiben eingefroren) */
  const alle = blaetterVon(root).filter(k => k.outline && k.outline.length > 2);
  if (melde) melde({ schritt: 'naht', n: 0, von: 3 });
  const blaetter = alle.map(k => ({ paket: paketVon.get(k) || nodeKey(k.parent), outline: k.outline })), soll = alle.map(k => k.count / root.count * W * H);
  /* Kacheln eines Durchgangs auf die Helfer verteilen: Zustand hin, Aenderungen zurueck */
  let loesen = null;
  if (pool) { pool.alle({ type: 'netz', blaetter, soll, W, H });
    loesen = async (liste, netz) => { const { knoten, filme } = netz, lage = new Float64Array(2 * knoten.length);
      knoten.forEach((k, v) => { lage[2 * v] = k.p[0]; lage[2 * v + 1] = k.p[1]; });
      const zustand = { lage, phi: Float64Array.from(filme.map(f => f.phi)), druck: netz.druck };
      const teile = Array.from({ length: pool.size }, () => []); [...liste].sort((a, b) => b.length - a.length).forEach((k, i) => teile[i % pool.size].push(k));
      const antworten = await Promise.all(teile.filter(t => t.length).map(t => pool.kacheln(zustand, t)));
      for (const a of antworten) for (const e of a.aus) {
        for (let i = 0; i < e.v.length; i += 3) knoten[e.v[i]].p = [e.v[i + 1], e.v[i + 2]];
        for (let i = 0; i < e.f.length; i += 2) { filme[e.f[i]].phi = e.f[i + 1]; filme[e.f[i]].neu = true; }
        for (let i = 0; i < e.d.length; i += 2) netz.druck[e.d[i]] = e.d[i + 1]; }
      for (const f of filme) f.c = Math.hypot(knoten[f.b].p[0] - knoten[f.a].p[0], knoten[f.b].p[1] - knoten[f.a].p[1]); }; }
  const z = await reissverschluss(blaetter, soll, { W, H, loesen, melde });
  if (pool) pool.schliessen();
  for (const i of z.geaendert) { const k = alle[i]; k.outline = z.umrisse[i]; k.tags = tagEdges(k.outline, k.parent.outline, k.parent.tags, k.depth); }
  const nodes = [], leaves = [];
  (function lauf(n) { for (const kk of n.kids.values()) { if (kk.outline) nodes.push(kk); if (kk.kids.size) lauf(kk); else leaves.push(kk); } })(root);
  return { root, nodes, leaves, stats, skipped: 0, deferred: [], vesselsTotal: stats.length, ms: Date.now() - t0, width: W, height: H,
           gross: { zellen: leaves.length, reissverschluss: z.zahlen } };
}
