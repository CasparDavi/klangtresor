/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* Helfer fuer grosse Schaeume (grossschaum.js): ein Worker, der
   - Teilbaeume legt, im Protokoll des Prophane-Viewers fuer layoutTreeParallel (init, pass, task) - Caspar_D, 05.10.2026:
     „ab der ersten ebene könnte man doch treemaps massiv parallelisieren";
   - Kacheln des Reissverschlusses loest (netz, kacheln): eine eigene Kopie des Netzes aus denselben Umrissen, je Auftrag der
     aktuelle Zustand hinein, die Aenderungen zurueck. Innerhalb eines Durchgangs sind die Kacheln unabhaengig. */
import { buildTree, layoutSubtree, indexTree, setLeafCounts } from './foamtree.js';
import { netzBauen, netzIndex, kachelLoesen } from './reissverschluss.js';

const H = {};
const zaehlen0 = x => { if (x.kids.size) for (const k of x.kids.values()) zaehlen0(k); else x.count0 = x.count0 ?? x.count; };
self.onmessage = (e) => {
  const m = e.data;
  try {
    if (m.type === 'init') { H.root = buildTree(m.rows, m.tree); zaehlen0(H.root); H.layout = m.layout; H.index = indexTree(H.root, m.layout); return; }
    if (m.type === 'pass') { setLeafCounts(H.root, H.index, m.counts); H.seeds = m.seeds; return; }
    if (m.type === 'task') {
      const teil = layoutSubtree(H.root, H.index, m.key, m.outline, m.tags, { ...H.layout, seeds: H.seeds }, m.limit,
        (k, o, t) => self.postMessage({ id: m.id, spawn: [k, o, t] }));
      self.postMessage({ id: m.id, ...teil }); return; }
    if (m.type === 'netz') { H.netz = netzIndex(netzBauen(m.blaetter, m.W, m.H)); H.soll = m.soll; H.netz.druck = new Float64Array(H.netz.zellen.length); return; }
    if (m.type === 'kacheln') {
      const netz = H.netz;
      netz.knoten.forEach((k, v) => { k.p = [m.lage[2 * v], m.lage[2 * v + 1]]; });
      netz.filme.forEach((f, n) => { f.phi = m.phi[n]; f.c = Math.hypot(netz.knoten[f.b].p[0] - netz.knoten[f.a].p[0], netz.knoten[f.b].p[1] - netz.knoten[f.a].p[1]); f.neu = false; });
      netz.druck.set(m.druck);
      const aus = [];
      for (const k of m.kacheln) {
        const frei = new Set(k), e2 = kachelLoesen(netz, frei, H.soll), v = [], f = [], d = [];
        const vs = new Set(); for (const z of k) for (const u of netz.schleife[z]) if (!vs.has(u)) { vs.add(u); const kn = netz.knoten[u]; if (!kn.rahmen && kn.zellen.every(c => frei.has(c))) v.push(u, kn.p[0], kn.p[1]); }
        const fs = new Set(); for (const z of k) for (const s of netz.zellen[z].filme) { const n = s >= 0 ? s : ~s; if (fs.has(n)) continue; fs.add(n); const fi = netz.filme[n]; if (fi.R >= 0 && frei.has(fi.L) && frei.has(fi.R)) f.push(n, fi.phi); }
        for (const z of k) d.push(z, netz.druck[z]);
        aus.push({ v, f, d, ok: e2.ok });
      }
      self.postMessage({ id: m.id, aus }); return; }
  } catch (err) { self.postMessage({ id: m.id, error: String(err && err.stack || err) }); }
};
