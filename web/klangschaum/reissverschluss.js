/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   DER REISSVERSCHLUSS - Paketnaehte in grossen Schaeumen wegrechnen
   web/klangschaum/reissverschluss.js

   Caspar_D, 07.10.2026: „das treemap problem lösen wir richtig" - grosse flache Schaeume (Groupieschaum mit 4500 Personen)
   entstehen in Paketen; an den Paketgrenzen stossen Waende im rechten Winkel auf eine durchgehende Linie (90°/90°/180°, oft eine
   Ecke knapp ueber 180°), die Pakete bleiben lesbar. Der Reissverschluss gibt nur ein Band um jede Naht frei und friert den Schaum
   draussen ein: frei sind Knoten, deren Zellen alle zur Kachel gehoeren, die Woelbung der Waende zwischen zwei freien Zellen und die
   Druecke der freien Zellen - dieselben Gleichungen wie foamSolve der Engine (120° an jedem Knoten, Laplace, Sollflaeche). Kein
   Gefaess, keine Startzellen, keine Neuordnung; eingefrorene Zellen bleiben exakt.
   Werkstatt und Zahlen: Treemapper/docs/paper/LABORBUCH-grosse-schaeume.md, Abschnitte 10-12 (4500 Zellen: 1052 Nahtknoten mit
   60° Abweichung -> keiner ueber 2°, Ecken ueber 180° 532 -> 0 an Paketnaehten; Arealgrenzen bleiben glatt, Entscheidung Caspar_D).
   ES-Modul ohne Abhaengigkeiten - laeuft im Worker des Browsers und in Node.
   ============================================================= */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], len = a => Math.hypot(a[0], a[1]);
const rot = (a, t) => [a[0] * Math.cos(t) - a[1] * Math.sin(t), a[0] * Math.sin(t) + a[1] * Math.cos(t)];

export const schl = p => p[0].toFixed(6) + ',' + p[1].toFixed(6);
export const signFl = o => { let a = 0; for (let i = 0; i < o.length; i++) { const p = o[i], q = o[(i + 1) % o.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
export function schwerpunkt(o) {   // Flaechenschwerpunkt (die Eckpunkte liegen auf Boegen ungleich dicht - ihr Mittel waere verschoben)
  let a = 0, x = 0, y = 0;
  for (let i = 0; i < o.length; i++) { const p = o[i], q = o[(i + 1) % o.length], c = p[0] * q[1] - q[0] * p[1]; a += c; x += (p[0] + q[0]) * c; y += (p[1] + q[1]) * c; }
  return a ? [x / (3 * a), y / (3 * a)] : o[0];
}
export function innen(o, p) {
  let c = false;
  for (let i = 0, j = o.length - 1; i < o.length; j = i++) { const a = o[i], b = o[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; }
  return c;
}

/* Punktraster: Eckpunkte (je Schluessel einmal), Abfrage im Rechteck. */
export class Raster {
  constructor(g = 4) { this.g = g; this.m = new Map(); this.da = new Set(); }
  add(p) { const k = schl(p); if (this.da.has(k)) return; this.da.add(k);
    const s = Math.floor(p[0] / this.g) + ',' + Math.floor(p[1] / this.g); let l = this.m.get(s); if (!l) this.m.set(s, l = []); l.push(p); }
  *kasten(x0, y0, x1, y1) { const g = this.g;
    for (let i = Math.floor(x0 / g); i <= Math.floor(x1 / g); i++) for (let j = Math.floor(y0 / g); j <= Math.floor(y1 / g); j++) { const l = this.m.get(i + ',' + j); if (l) yield* l; } }
}
/* Punkte, die echt im Inneren der Strecke a->b liegen (Abstand zur Geraden < 1e-6 * Kantenlaenge), nach Lage sortiert. */
function aufKante(a, b, raster) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy; if (L2 < 1e-24) return [];
  const L = Math.sqrt(L2), ka = schl(a), kb = schl(b), tol = 1e-6 * L, aus = [];
  for (const p of raster.kasten(Math.min(a[0], b[0]) - tol, Math.min(a[1], b[1]) - tol, Math.max(a[0], b[0]) + tol, Math.max(a[1], b[1]) + tol)) {
    const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2; if (t <= 0 || t >= 1) continue;
    if (Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / L >= tol) continue;
    const k = schl(p); if (k === ka || k === kb) continue; aus.push([t, p, k]);
  }
  aus.sort((u, v) => u[0] - v[0]);
  return aus.filter((u, i) => i === 0 || u[2] !== aus[i - 1][2]).map(u => u[1]);
}
/* T-Stellen schliessen: jeder Umriss bekommt die Eckpunkte anderer Umrisse, die auf einer seiner Kanten liegen. Danach hat
   jede gemeinsame Wand auf beiden Seiten dieselben Eckpunkte (Nachbarschaft und Vereinigung werden exakt). Kollineare
   Punkte: Form und Flaeche bleiben. */
export function verfugen(umrisse) {
  const r = new Raster(4); for (const o of umrisse) if (o) for (const p of o) r.add(p);
  let neu = 0;
  const aus = umrisse.map(o => { if (!o) return o; const q = [];
    for (let i = 0; i < o.length; i++) { const a = o[i], b = o[(i + 1) % o.length]; q.push(a); const t = aufKante(a, b, r); neu += t.length; q.push(...t); }
    return q; });
  return { umrisse: aus, neu };
}

/* Vereinigung von Zellumrissen zu Schleifen. Gerichtete Kanten (Schluessel aus toFixed(6) der Endpunkte); a->b und b->a heben
   sich auf; Restkanten werden an Eckpunkten geteilt, die auf ihnen liegen (punkte: Liste der Kandidaten, sonst die Eckpunkte
   der Umrisse selbst), und noch einmal aufgehoben; der Rest wird zu Schleifen verkettet (an Beruehrpunkten die Kante, die
   im Uhrzeigersinn zuerst von der Ankunftsrichtung kommt - so bleibt das Gebiet links). Ergebnis: Schleifen mit
   vorzeichenbehafteter Flaeche (> 0 aussen, gegen den Uhrzeigersinn; < 0 Loch). */

/* Flaeche des Kreissegments zwischen Sehne c und Bogen mit halbem Oeffnungswinkel phi (vorzeichenbehaftet) - wie filmGeo */
export const segment = (c, phi) => Math.abs(phi) < 1e-4 ? c * c * phi / 6 : c * c * (2 * phi - Math.sin(2 * phi)) / (8 * Math.sin(phi) ** 2);

export function netzBauen(blaetter, W = 1000, H = 600) {
  const { umrisse } = verfugen(blaetter.map(b => b.outline));
  /* Echte Stuetzpunkte des Bogens: die der Engine. verfugen setzt zusaetzlich Punkte auf die geraden Verbindungen (T-Stellen) -
     die liegen auf der Sehne zwischen zwei Stuetzpunkten, nicht auf dem Bogen, und taugen nicht fuer den Peripheriewinkel. */
  const echt = new Set(); for (const b of blaetter) for (const p of b.outline) echt.add(schl(p));
  const zellenAn = new Map();
  umrisse.forEach((o, i) => { for (const p of o) { const k = schl(p); let s = zellenAn.get(k); if (!s) zellenAn.set(k, s = new Set()); s.add(i); } });
  const eps = 1e-6, amRahmen = p => p[0] < eps || p[0] > W - eps || p[1] < eps || p[1] > H - eps;
  const ecke = p => (p[0] < eps || p[0] > W - eps) && (p[1] < eps || p[1] > H - eps);
  const istKnoten = (p) => { const n = zellenAn.get(schl(p)).size; return n >= 3 || (n >= 2 && amRahmen(p)) || ecke(p); };

  const knoten = [], knotenNr = new Map();
  const knotenVon = (p) => { const k = schl(p); if (!knotenNr.has(k)) { knotenNr.set(k, knoten.length); knoten.push({ p, rahmen: amRahmen(p), ecke: ecke(p), zellen: [...zellenAn.get(k)] }); } return knotenNr.get(k); };

  const filme = [], filmNr = new Map(), zellen = [];
  let ohneKnoten = 0;
  umrisse.forEach((o, i) => {
    const idx = []; o.forEach((p, j) => { if (istKnoten(p)) idx.push(j); });
    if (idx.length < 2) { ohneKnoten++; zellen.push({ row: blaetter[i].row, paket: blaetter[i].paket, filme: [] }); return; }
    const z = { row: blaetter[i].row, paket: blaetter[i].paket, filme: [] };
    for (let m = 0; m < idx.length; m++) {
      const j0 = idx[m], j1 = idx[(m + 1) % idx.length], kette = [];
      for (let j = j0; ; j = (j + 1) % o.length) { kette.push(o[j]); if (j === j1 && kette.length > 1) break; }
      const a = knotenVon(kette[0]), b = knotenVon(kette[kette.length - 1]);
      /* der Nachbar: die Zelle ausser i, die alle Punkte der Kette teilt (Rahmen: -1) */
      let andere = null;
      for (const p of (kette.length > 2 ? kette.slice(1, -1) : kette)) { const s = zellenAn.get(schl(p)); const r = [...s].filter(x => x !== i);
        andere = andere === null ? new Set(r) : new Set(r.filter(x => andere.has(x))); }
      const nachbar = andere && andere.size ? [...andere][0] : -1;
      /* Schluessel unabhaengig von der Laufrichtung: der kleinste Schluessel der inneren Punkte (beide Seiten haben nach
         verfugen dieselben Punkte, nur in umgekehrter Reihenfolge) */
      const mitte = kette.length > 2 ? kette.slice(1, -1).map(schl).sort()[0] : '';
      const key = [Math.min(a, b), Math.max(a, b), Math.min(i, nachbar), Math.max(i, nachbar), mitte].join('|');
      let f = filmNr.get(key);
      if (f === undefined) {
        /* Bogen anpassen: Pfeilhoehe an der Sehnenmitte -> phi = 2 atan(2s/c); i liegt links von a->b (Umriss gegen den Uhrzeigersinn) */
        /* Bogen exakt ueber den Peripheriewinkel: fuer jeden Punkt P auf dem Kreisbogen ist der Winkel APB = pi - |phi|;
           Vorzeichen: P rechts von a->b heisst Woelbung nach rechts (phi > 0). Genommen wird der Punkt naechst der
           Sehnenmitte (am besten bedingt). */
        const A = kette[0], B = kette[kette.length - 1], u = sub(B, A), c = len(u);
        let phi = 0, best = Infinity;
        for (const p of kette.slice(1, -1)) { if (!echt.has(schl(p))) continue;
          const t = ((p[0] - A[0]) * u[0] + (p[1] - A[1]) * u[1]) / (c * c); if (Math.abs(t - 0.5) >= best) continue; best = Math.abs(t - 0.5);
          const pa = sub(A, p), pb = sub(B, p), w = Math.acos(Math.max(-1, Math.min(1, (pa[0] * pb[0] + pa[1] * pb[1]) / (len(pa) * len(pb)))));
          const rechts = (u[0] * (p[1] - A[1]) - u[1] * (p[0] - A[0])) < 0;
          phi = (rechts ? 1 : -1) * (Math.PI - w); }
        if (Math.abs(phi) < 1e-9) phi = 0;
        f = filme.length; filmNr.set(key, f);
        filme.push({ a, b, L: i, R: nachbar, phi, c, punkte: kette });
      } else if (filme[f].a !== a) { /* Gegenseite: i laeuft b->a, liegt also rechts von a->b - stimmt mit R ueberein */ }
      z.filme.push(filme[f].a === a ? f : ~f);
    }
    zellen.push(z);
  });
  return { knoten, filme, zellen, umrisse, ohneKnoten };
}

/* Flaeche jeder Zelle aus dem Netz: Polygon der Knoten + Segmente der Boegen (L gewinnt, R verliert bei phi > 0) */
export function netzFlaechen(netz) {
  const { knoten, filme, zellen } = netz;
  return zellen.map((z, i) => {
    if (!z.filme.length) return null;
    const poly = z.filme.map(s => { const f = filme[s >= 0 ? s : ~s]; return knoten[s >= 0 ? f.a : f.b].p; });
    let a = signFl(poly);
    for (const s of z.filme) { const f = filme[s >= 0 ? s : ~s]; a += (f.L === i ? 1 : -1) * segment(f.c, f.phi); }
    return a;
  });
}
/* Winkel an jedem Knoten: Tangenten der Waende (ta = rot(u, -phi) an a, tb = rot(-u, phi) an b), der Reihe nach */
export function netzWinkel(netz) {
  const { knoten, filme } = netz, an = knoten.map(() => []);
  filme.forEach(f => {
    const u0 = sub(knoten[f.b].p, knoten[f.a].p), c = len(u0); if (c < 1e-12) return;
    const u = [u0[0] / c, u0[1] / c], ta = rot(u, -f.phi), tb = rot([-u[0], -u[1]], f.phi);
    an[f.a].push(Math.atan2(ta[1], ta[0])); an[f.b].push(Math.atan2(tb[1], tb[0]));
  });
  return an.map((w, k) => {
    if (knoten[k].rahmen || w.length < 2) return null;
    w.sort((x, y) => x - y);
    const d = w.map((x, i) => { let v = (i + 1 < w.length ? w[i + 1] : w[0] + 2 * Math.PI) - x; return v * 180 / Math.PI; });
    return { grad: w.length, winkel: d, abweichung: Math.max(...d.map(v => Math.abs(v - 120))), ueber180: d.filter(v => v > 180).length };
  });
}

/* Netz um Lookups erweitern: Waende je Knoten, Knotenschleife je Zelle */
export function netzIndex(netz) {
  const { knoten, filme, zellen } = netz;
  netz.waendeAn = knoten.map(() => []);
  filme.forEach((f, n) => { netz.waendeAn[f.a].push(n); netz.waendeAn[f.b].push(n); });
  netz.schleife = zellen.map(z => z.filme.map(s => { const f = filme[s >= 0 ? s : ~s]; return s >= 0 ? f.a : f.b; }));
  return netz;
}

/* Eine Kachel loesen. frei: Set der freien Zellen. soll: Sollflaechen je Zelle. Aendert netz (Knoten p, Wand phi) an Ort. */
export function kachelLoesen(netz, frei, soll, { maxIt = 60, tol = 1e-8 } = {}) {
  const { knoten, filme, zellen, waendeAn, schleife } = netz;
  const zellenFrei = [...frei];
  const vFrei = []; const vSet = new Set();
  for (const z of zellenFrei) for (const v of schleife[z]) {
    if (vSet.has(v)) continue; vSet.add(v);
    const k = knoten[v]; if (k.rahmen) continue;
    if (k.zellen.every(c => frei.has(c))) vFrei.push(v);
  }
  const vIdx = new Map(vFrei.map((v, i) => [v, i]));
  const fFrei = []; const fIdx = new Map();
  for (const z of zellenFrei) for (const s of zellen[z].filme) { const n = s >= 0 ? s : ~s; if (fIdx.has(n)) continue; const f = filme[n];
    if (f.R >= 0 && frei.has(f.L) && frei.has(f.R)) { fIdx.set(n, fFrei.length); fFrei.push(n); } }
  const cIdx = new Map(zellenFrei.map((c, i) => [c, i]));
  const NV = vFrei.length, NF = fFrei.length, NC = zellenFrei.length, N = 2 * NV + NF + NC;
  if (!NV && !NF) return { ok: true, it: 0, N: 0, kosten: 0, frei: NC };
  /* Zustand <-> Vektor */
  const x0 = new Float64Array(N);
  vFrei.forEach((v, i) => { x0[2 * i] = knoten[v].p[0]; x0[2 * i + 1] = knoten[v].p[1]; });
  fFrei.forEach((n, i) => { x0[2 * NV + i] = filme[n].phi; });
  zellenFrei.forEach((c, i) => { x0[2 * NV + NF + i] = netz.druck ? (netz.druck[c] || 0) : 0; });
  const pos = (v, x) => { const i = vIdx.get(v); return i === undefined ? knoten[v].p : [x[2 * i], x[2 * i + 1]]; };
  const phiVon = (n, x) => { const i = fIdx.get(n); return i === undefined ? filme[n].phi : x[2 * NV + i]; };
  const druck = (c, x) => x[2 * NV + NF + cIdx.get(c)];
  /* betroffene Waende: alle Waende der freien Zellen */
  const fAlle = [...new Set(zellenFrei.flatMap(z => zellen[z].filme.map(s => s >= 0 ? s : ~s)))];
  function auswerten(x) {
    const geo = new Map();
    for (const n of fAlle) { const f = filme[n], A = pos(f.a, x), B = pos(f.b, x), u0 = sub(B, A), c = len(u0); if (c < 1e-9) return null;
      const phi = phiVon(n, x); if (Math.abs(phi) > Math.PI - 0.05) return null;
      const u = [u0[0] / c, u0[1] / c]; geo.set(n, { c, phi, ta: rot(u, -phi), tb: rot([-u[0], -u[1]], phi), seg: segment(c, phi) }); }
    const r = [];
    for (const v of vFrei) { let fx = 0, fy = 0; for (const n of waendeAn[v]) { const g = geo.get(n); const t = filme[n].a === v ? g.ta : g.tb; fx += t[0]; fy += t[1]; } r.push(fx, fy); }
    for (const n of fFrei) { const f = filme[n], g = geo.get(n); r.push(2 * Math.sin(g.phi) - g.c * (druck(f.L, x) - druck(f.R, x))); }
    for (const z of zellenFrei) {
      let a = signFl(schleife[z].map(v => pos(v, x)));
      for (const s of zellen[z].filme) { const n = s >= 0 ? s : ~s, f = filme[n]; a += (f.L === z ? 1 : -1) * geo.get(n).seg; }
      if (!(a > 0)) return null;
      r.push(3 * (a - soll[z]) / soll[z]);
    }
    return r;
  }
  const kosten = r => r.reduce((s, v) => s + v * v, 0);
  let x = Float64Array.from(x0), r = auswerten(x); if (!r) return { ok: false, grund: 'Startzustand ungueltig', N };
  let c0 = kosten(r), lambda = 1e-3, it = 0;
  const M = r.length;
  const h = new Float64Array(N); for (let j = 0; j < N; j++) h[j] = j < 2 * NV ? 1e-6 : 1e-7;
  for (; it < maxIt && c0 > tol; it++) {
    /* Jacobi-Matrix (M x N), vorwaerts */
    /* Jacobi-Matrix zeilenweise duenn: jede Gleichung haengt nur an wenigen Unbekannten */
    const zeilen = Array.from({ length: M }, () => []);
    for (let j = 0; j < N; j++) { const xj = x[j]; x[j] = xj + h[j]; const rj = auswerten(x); x[j] = xj;
      if (!rj) continue;
      for (let i = 0; i < M; i++) { const d = (rj[i] - r[i]) / h[j]; if (d !== 0) zeilen[i].push(j, d); } }
    /* JtJ, Jtr aus den duennen Zeilen */
    const A = new Float64Array(N * N), g = new Float64Array(N);
    for (let i = 0; i < M; i++) { const z = zeilen[i], ri = r[i];
      for (let p = 0; p < z.length; p += 2) { const a = z[p], ja = z[p + 1]; g[a] += ja * ri;
        for (let q = 0; q < z.length; q += 2) A[a * N + z[q]] += ja * z[q + 1]; } }
    let besser = false;
    for (let versuch = 0; versuch < 12 && !besser; versuch++) {
      const B = Float64Array.from(A); for (let a = 0; a < N; a++) B[a * N + a] += lambda * (A[a * N + a] + 1e-12);
      const d = cholLoesen(B, g, N); if (!d) { lambda *= 10; continue; }
      const xn = Float64Array.from(x); for (let a = 0; a < N; a++) xn[a] -= d[a];
      const rn = auswerten(xn);
      if (rn && wendeOrdnungGleich(netz, vFrei, x, xn, pos) && kosten(rn) < c0) { x = xn; r = rn; c0 = kosten(rn); lambda = Math.max(1e-9, lambda / 4); besser = true; }
      else lambda *= 8;
    }
    if (!besser) break;
  }
  /* uebernehmen */
  vFrei.forEach((v, i) => { knoten[v].p = [x[2 * i], x[2 * i + 1]]; });
  fFrei.forEach((n, i) => { filme[n].phi = x[2 * NV + i]; filme[n].neu = true; });
  if (!netz.druck) netz.druck = new Float64Array(zellen.length);
  zellenFrei.forEach((c, i) => { netz.druck[c] = x[2 * NV + NF + i]; });
  for (const n of fAlle) { const f = filme[n]; f.c = len(sub(knoten[f.b].p, knoten[f.a].p)); }
  return { ok: c0 <= 1e-5, it, N, M, kosten: c0, frei: NC, vFrei: NV, fFrei: NF };
}
/* Reihenfolge der Waende um jeden freien Knoten darf sich nicht umkehren (sonst klappt eine Zelle um) */
function wendeOrdnungGleich(netz, vFrei, x, xn, pos) {
  const { knoten, filme, waendeAn } = netz;
  const ordnung = (v, X) => waendeAn[v].map(n => { const f = filme[n], o = f.a === v ? f.b : f.a, d = sub(pos(o, X), pos(v, X)); return [Math.atan2(d[1], d[0]), n]; })
    .sort((p, q) => p[0] - q[0]).map(p => p[1]).join(',');
  const zyk = s => { const t = s.split(','); const m = t.indexOf(String(Math.min(...t.map(Number)))); return t.slice(m).concat(t.slice(0, m)).join(','); };
  for (const v of vFrei) if (zyk(ordnung(v, x)) !== zyk(ordnung(v, xn))) return false;
  return true;
}
function cholLoesen(A, b, n) {
  const L = Float64Array.from(A);
  for (let j = 0; j < n; j++) {
    let s = L[j * n + j]; for (let k = 0; k < j; k++) s -= L[j * n + k] ** 2; if (!(s > 0)) return null; const d = Math.sqrt(s); L[j * n + j] = d;
    for (let i = j + 1; i < n; i++) { let t = L[i * n + j]; for (let k = 0; k < j; k++) t -= L[i * n + k] * L[j * n + k]; L[i * n + j] = t / d; }
  }
  const y = new Float64Array(n); for (let i = 0; i < n; i++) { let t = b[i]; for (let k = 0; k < i; k++) t -= L[i * n + k] * y[k]; y[i] = t / L[i * n + i]; }
  const z = new Float64Array(n); for (let i = n - 1; i >= 0; i--) { let t = y[i]; for (let k = i + 1; k < n; k++) t -= L[k * n + i] * z[k]; z[i] = t / L[i * n + i]; }
  return z;
}

/* Kreisbogen von A nach B mit halbem Oeffnungswinkel phi (phi > 0: Woelbung rechts von A->B); Mittelpunkt auf der Gegenseite
   der Woelbung (h = r cos phi uebernimmt grosse Boegen), Laufrichtung die, deren Bogenmitte auf der Woelbungsseite liegt. */
function bogen(A, B, phi, schritt) {
  const c = Math.hypot(B[0] - A[0], B[1] - A[1]); if (Math.abs(phi) < 1e-6 || c < 1e-12) return [A, B];
  const s = Math.sign(phi), r = c / (2 * Math.sin(Math.abs(phi))), ux = (B[0] - A[0]) / c, uy = (B[1] - A[1]) / c, h = r * Math.cos(phi);
  const cx = (A[0] + B[0]) / 2 + s * (-uy) * h, cy = (A[1] + B[1]) / 2 + s * ux * h;
  const a0 = Math.atan2(A[1] - cy, A[0] - cx), a1 = Math.atan2(B[1] - cy, B[0] - cx);
  let d = a1 - a0; while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
  const mitteRechts = (dd) => { const t = a0 + dd / 2, px = cx + r * Math.cos(t), py = cy + r * Math.sin(t); return (ux * (py - A[1]) - uy * (px - A[0])) < 0; };
  if (mitteRechts(d) !== (s > 0)) d = d > 0 ? d - 2 * Math.PI : d + 2 * Math.PI;
  const n = Math.max(2, Math.ceil(Math.abs(d) * r / schritt)), aus = [];
  for (let i = 0; i <= n; i++) { const t = a0 + d * i / n; aus.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
  aus[0] = A; aus[n] = B; return aus;
}

/* DER GANZE REISSVERSCHLUSS. blaetter: [{ paket: 'areal\u0001paket', outline }], soll: Sollflaechen je Blatt.
   Band = Zellen an Paketnaht-Knoten + ein Ring, je Areal (Arealgrenzen bleiben glatte Boegen - Entscheidung Caspar_D);
   Durchgang 1: Kacheln (~K Zellen) ueber das Band; Durchgang 2: Kacheln ueber die Grenzen der ersten; Nachlese: um jeden noch
   schlechten Nahtknoten (> 2°) eine Kachel mit ihm in der Mitte, in Gruppen ohne gemeinsame oder benachbarte Zelle.
   loesen(kacheln, netz): fuehrt eine Liste UNABHAENGIGER Kacheln aus (Vorgabe: der Reihe nach hier; ein Aufrufer kann sie auf
   Worker verteilen). Ergebnis: neue Umrisse (unveraenderte Waende behalten ihre Punkte) und Zahlen. */
export async function reissverschluss(blaetter, soll, { W = 1000, H = 600, K = 55, loesen = null, melde = null } = {}) {
  const t0 = Date.now();
  const netz = netzIndex(netzBauen(blaetter, W, H)), areal = p => String(p).split('\u0001')[0];
  const { knoten, filme, zellen } = netz; netz.druck = new Float64Array(zellen.length);
  const ausfuehren = loesen || (async (liste) => { for (const k of liste) kachelLoesen(netz, new Set(k), soll); });
  const nb = zellen.map(() => new Set()); filme.forEach(f => { if (f.R >= 0) { nb[f.L].add(f.R); nb[f.R].add(f.L); } });
  const nahtKnoten = knoten.map(k => !k.rahmen && new Set(k.zellen.map(z => areal(blaetter[z].paket))).size === 1 && new Set(k.zellen.map(z => blaetter[z].paket)).size > 1);
  const band = new Set(); knoten.forEach((k, v) => { if (nahtKnoten[v]) for (const z of k.zellen) band.add(z); });
  for (const z of [...band]) for (const n of nb[z]) if (areal(blaetter[n].paket) === areal(blaetter[z].paket)) band.add(n);
  const zahlen = { band: band.size, nahtKnoten: nahtKnoten.filter(Boolean).length };
  if (!band.size) return { umrisse: blaetter.map(b => b.outline), geaendert: new Set(), zahlen };
  const kacheln = (saat) => { const zu = new Map(), aus = [];
    for (const s of saat) { if (zu.has(s)) continue; const a = areal(blaetter[s].paket), k = [s], q = [s]; zu.set(s, aus.length);
      while (q.length && k.length < K) { const z = q.shift(); for (const n of nb[z]) if (band.has(n) && !zu.has(n) && areal(blaetter[n].paket) === a && k.length < K) { zu.set(n, aus.length); k.push(n); q.push(n); } }
      aus.push(k); }
    return { aus, zu }; };
  const mitte = z => { const s = netz.schleife[z].map(v => knoten[v].p); return [s.reduce((a, p) => a + p[0], 0) / s.length, s.reduce((a, p) => a + p[1], 0) / s.length]; };
  const bandListe = [...band].sort((x, y) => { const a = mitte(x), b = mitte(y); return (Math.floor(a[1] / 40) - Math.floor(b[1] / 40)) || (a[0] - b[0]); });
  const d1 = kacheln(bandListe);
  if (melde) melde({ schritt: 'naht', n: 0, von: 3 });
  await ausfuehren(d1.aus, netz);
  const grenze = bandListe.filter(z => [...nb[z]].some(n => band.has(n) && d1.zu.get(n) !== d1.zu.get(z)));
  if (melde) melde({ schritt: 'naht', n: 1, von: 3 });
  await ausfuehren(kacheln(grenze.concat(bandListe)).aus, netz);
  for (let runde = 1; runde <= 2; runde++) {
    const w = netzWinkel(netz), schlecht = knoten.map((k, v) => v).filter(v => w[v] && w[v].abweichung > 2 && !knoten[v].rahmen
      && new Set(knoten[v].zellen.map(z => areal(blaetter[z].paket))).size === 1);
    zahlen['nachlese' + runde] = schlecht.length; if (!schlecht.length) break;
    const offen = new Set(schlecht), liste = [];
    for (const v of schlecht) { if (!offen.has(v)) continue;
      const a = areal(blaetter[knoten[v].zellen[0]].paket), k = [...knoten[v].zellen], im = new Set(k), q = [...k];
      while (q.length && k.length < 40) { const z = q.shift(); for (const n of nb[z]) if (!im.has(n) && areal(blaetter[n].paket) === a && k.length < 40) { im.add(n); k.push(n); q.push(n); } }
      for (const z of k) for (const u of netz.schleife[z]) if (knoten[u].zellen.every(c => im.has(c))) offen.delete(u);
      liste.push(k); }
    let rest = liste;
    while (rest.length) { const belegt = new Set(), gruppe = [], spaeter = [];
      for (const k of rest) { const huelle = new Set(k.flatMap(z => [z, ...nb[z]]));
        if ([...huelle].some(z => belegt.has(z))) { spaeter.push(k); continue; } for (const z of huelle) belegt.add(z); gruppe.push(k); }
      await ausfuehren(gruppe, netz); rest = spaeter; }
    if (melde) melde({ schritt: 'naht', n: 1 + runde, von: 3 });
  }
  /* Umrisse: geaenderte Waende als Bogen abgetastet (Schritt wie die Engine: ~ Wurzel der Zellflaeche / 80, hoechstens 3),
     unveraenderte behalten ihre Punkte */
  /* JEDE WAND EINMAL abtasten und beiden Zellen dieselben Punkte geben - mit einer Schrittweite je Zelle bekaemen die Nachbarn
     verschiedene Punkte auf derselben Wand, und die Wand waere nicht mehr gemeinsam (gefunden an der ersten App-Probe). Schritt
     nach der kleineren Nachbarzelle, wie die Engine (~ Wurzel der Flaeche / 80, hoechstens 3). */
  const geaendert = new Set(), abgetastet = new Map();
  const kettenVon = (n) => { let k = abgetastet.get(n); if (k) return k; const f = filme[n];
    const kl = Math.min(soll[f.L], f.R >= 0 ? soll[f.R] : Infinity);
    k = bogen(knoten[f.a].p, knoten[f.b].p, f.phi, Math.min(3, Math.max(0.2, Math.sqrt(kl) / 80))); abgetastet.set(n, k); return k; };
  const umrisse = zellen.map((z, i) => { const pts = [];
    for (const s of z.filme) { const n = s >= 0 ? s : ~s, f = filme[n];
      let kette = f.neu ? kettenVon(n) : f.punkte;
      if (f.neu) geaendert.add(i);
      if (s < 0) kette = kette.slice().reverse();
      pts.push(...kette.slice(0, -1)); }
    return pts.length > 2 ? pts : blaetter[i].outline; });
  const w = netzWinkel(netz);
  zahlen.ueber180 = w.reduce((s, x) => s + (x ? x.ueber180 : 0), 0);
  zahlen.ms = Date.now() - t0;
  return { umrisse, geaendert, zahlen, netz };
}
