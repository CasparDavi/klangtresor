/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   Caspar_Ds Schaum-Engine „foamtree", unverändert übernommen am 06.10.2026 aus
   ~/Prophane/tools/foam-lab/engine/ (Stand dort: 06.10.2026, Commit 6a5ab87 mit powerCells und ccvt im Export; die neueste der drei Fassungen;
   die anderen: Treemapper/engine/, eingebettet im Prophane-Viewer). Geändert ist nur die
   Endung .mjs -> .js (der Server liefert .js als JavaScript) samt den Importpfaden.
   Änderungen gehören in die Quelle zurück, nicht nur hierher. */
// foamtree – area-exact treemaps as a 2D dry foam (or with straight walls), every level inside the cells of the level above.
// ES module without dependencies, for the browser (also in a worker) and for Node. Treemapper engine, 04.10.2026.
//
// Per vessel (the outer rectangle, or a cell of the level above, as a counter-clockwise polygon):
// 1. power diagram with capacity constraints (CCVT): sites to the cell centroids, weights by a damped Newton step with the
//    full area Jacobian (semi-discrete optimal transport); straight walls, exact areas ("power" method ends here);
// 2. foam ("foam" method): every inner wall a circular arc with curvature = pressure difference, 120 degrees at junctions,
//    90 degrees at the vessel wall, every cell keeps its area; pressures and film half-angles are unknowns, Levenberg-Marquardt
//    with a grouped finite-difference Jacobian and conjugate gradients on the sparse normal equations;
// 3. a foam vessel is not convex where a neighbour with higher pressure bulges in, so a straight power line can split a cell:
//    then the topology comes from the vessel's chord polygon or a disk of equal area, mapped onto the vessel by arc length;
// 4. a wall junction stalling on a corner of the vessel is pinned there while that is stable (the film cannot get shorter
//    by sliding along either side); an inconsistent wall graph falls back to the power diagram (exact areas, straight walls).
// Math coordinates (y up).

// ---------- geometry helpers ----------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, s) => [a[0] * s, a[1] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1], len = a => Math.hypot(a[0], a[1]);
const rot = (a, t) => [a[0] * Math.cos(t) - a[1] * Math.sin(t), a[0] * Math.sin(t) + a[1] * Math.cos(t)];
function shoelace(ps) { let s = 0; for (let k = 0; k < ps.length; k++) { const a = ps[k], b = ps[(k + 1) % ps.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
function centroid(ps) {
  let a = 0, cx = 0, cy = 0;
  for (let k = 0; k < ps.length; k++) { const p = ps[k], q = ps[(k + 1) % ps.length], c = p[0] * q[1] - q[0] * p[1]; a += c; cx += (p[0] + q[0]) * c; cy += (p[1] + q[1]) * c; }
  return a ? [cx / (3 * a), cy / (3 * a)] : ps[0];
}
function inside(ps, p) {
  let c = false;
  for (let k = 0, j = ps.length - 1; k < ps.length; j = k++) {
    const a = ps[k], b = ps[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
function perimeter(ps) { let s = 0; for (let k = 0; k < ps.length; k++) s += len(sub(ps[(k + 1) % ps.length], ps[k])); return s; }

// ---------- container: closed CCW polygon, parametrised by arc length ----------
function makeContainer(pts) {
  const m = pts.length, cum = [0];
  for (let k = 0; k < m; k++) cum.push(cum[k] + len(sub(pts[(k + 1) % m], pts[k])));
  const L = cum[m];
  const dir = k => { const d = sub(pts[(k + 1) % m], pts[k]); return mul(d, 1 / len(d)); };
  const segOf = s => { s = ((s % L) + L) % L; let lo = 0, hi = m - 1; while (lo < hi) { const md = (lo + hi + 1) >> 1; if (cum[md] <= s) lo = md; else hi = md - 1; } return lo; };
  const posAt = s => { s = ((s % L) + L) % L; const k = segOf(s); return add(pts[k], mul(dir(k), s - cum[k])); };
  // tangent blended along each segment between the averaged directions at its ends, so that it varies continuously along a
  // sampled arc; a real corner (directions differing by more than 10 degrees) keeps its one-sided direction
  const vt = pts.map((_, k) => { const a = dir((k - 1 + m) % m), b = dir(k); if (dot(a, b) < Math.cos(Math.PI / 18)) return null; const t = add(a, b); return mul(t, 1 / len(t)); });
  const dirAt = s => {
    s = ((s % L) + L) % L;
    const k = segOf(s), u = (s - cum[k]) / (cum[k + 1] - cum[k]), t0 = vt[k] || dir(k), t1 = vt[(k + 1) % m] || dir(k);
    const t = add(mul(t0, 1 - u), mul(t1, u));
    return mul(t, 1 / len(t));
  };
  const sOn = (p, k) => cum[k] + dot(sub(p, pts[k]), dir(k));
  const between = (sa, sb) => { // container corners strictly between sa and sb, going counter-clockwise
    sa = ((sa % L) + L) % L; sb = ((sb % L) + L) % L;
    const out = [];
    if (sb >= sa) { for (let k = 0; k < m; k++) if (cum[k] > sa && cum[k] < sb) out.push(pts[k]); }
    else { for (let k = 0; k < m; k++) if (cum[k] > sa) out.push(pts[k]); for (let k = 0; k < m; k++) if (cum[k] < sb) out.push(pts[k]); }
    return out;
  };
  const corners = vt.map((t, k) => t ? null : k).filter(k => k !== null);
  return { pts, m, cum, L, posAt, dirAt, segDir: dir, segOf, sOn, between, corners, area: shoelace(pts) };
}

// ---------- power diagram by half-plane clipping, edges labelled with their neighbour (>= 0) or container segment (< 0) ----------
function powerCells(C, sites, w) {
  // neighbours ring by ring from a grid of the sites; a site j at distance d can cut the cell of i at most at
  // (d^2 + w_i - max w) / 2d from s_i, so the search ends once the next ring is beyond the cell's radius
  const n = sites.length, cells = [], wmax = Math.max(...w);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of C.pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  for (const p of sites) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  const cs = Math.max(1e-12, Math.sqrt(((x1 - x0) * (y1 - y0) || 1) / Math.max(1, n))), GX = Math.max(1, Math.ceil((x1 - x0) / cs) + 1), GY = Math.max(1, Math.ceil((y1 - y0) / cs) + 1);
  const grid = Array.from({ length: GX * GY }, () => []);
  const gx = p => Math.min(GX - 1, Math.max(0, Math.floor((p[0] - x0) / cs))), gy = p => Math.min(GY - 1, Math.max(0, Math.floor((p[1] - y0) / cs)));
  sites.forEach((p, j) => grid[gy(p) * GX + gx(p)].push(j));
  const maxRing = Math.max(GX, GY);
  for (let i = 0; i < n; i++) {
    const si = sites[i], ci = gx(si), cj = gy(si);
    let poly = C.pts.map((p, s) => ({ p, l: -1 - s }));
    let rmax = 0; for (const v of poly) rmax = Math.max(rmax, Math.hypot(v.p[0] - si[0], v.p[1] - si[1]));
    for (let ring = 0; ring <= maxRing && poly.length; ring++) {
      const dmin = Math.max(0, ring - 1) * cs;   // every site in this ring is at least this far
      if (dmin > 0 && (dmin * dmin + w[i] - wmax) / (2 * dmin) > rmax) break;
      const cand = [];
      for (let a = ci - ring; a <= ci + ring; a++) for (let b = cj - ring; b <= cj + ring; b++) {
        if (Math.max(Math.abs(a - ci), Math.abs(b - cj)) !== ring || a < 0 || b < 0 || a >= GX || b >= GY) continue;
        for (const j of grid[b * GX + a]) if (j !== i) { const dx = sites[j][0] - si[0], dy = sites[j][1] - si[1]; cand.push(dx * dx + dy * dy, j); }
      }
      const order = []; for (let t = 0; t < cand.length; t += 2) order.push(t);
      order.sort((x, y) => cand[x] - cand[y]);
      for (const t of order) {
        if (!poly.length) break;
        const d2 = cand[t], j = cand[t + 1], d = Math.sqrt(d2);
        if ((d2 + w[i] - wmax) / (2 * d) > rmax) continue;
        const nx = 2 * (sites[j][0] - si[0]), ny = 2 * (sites[j][1] - si[1]);
        const c = sites[j][0] * sites[j][0] + sites[j][1] * sites[j][1] - si[0] * si[0] - si[1] * si[1] - w[j] + w[i];
        const out = [];
        let cut = false;
        for (let k = 0; k < poly.length; k++) {
          const P = poly[k], Q = poly[(k + 1) % poly.length], fp = nx * P.p[0] + ny * P.p[1] - c, fq = nx * Q.p[0] + ny * Q.p[1] - c;
          if (fp <= 0 && fq <= 0) out.push(P);
          else if (fp <= 0) { const u = fp / (fp - fq); out.push(P); out.push({ p: [P.p[0] + u * (Q.p[0] - P.p[0]), P.p[1] + u * (Q.p[1] - P.p[1])], l: j }); cut = true; }
          else if (fq <= 0) { const u = fp / (fp - fq); out.push({ p: [P.p[0] + u * (Q.p[0] - P.p[0]), P.p[1] + u * (Q.p[1] - P.p[1])], l: P.l }); cut = true; }
          else cut = true;
        }
        poly = out;
        if (cut && poly.length) { rmax = 0; for (const v of poly) rmax = Math.max(rmax, Math.hypot(v.p[0] - si[0], v.p[1] - si[1])); }
      }
    }
    cells.push(poly);
  }
  return cells;
}

// Start points in a vessel for the chosen arrangement (the members come largest first). The points are the golden-angle
// spiral of ccvt (golden angle about 137.5 degrees); only which member gets which point differs. "big-centre" is ccvt's own
// start and needs no points from here. Seen on the 2011 OntologyMaps poster: the start shapes the layout strongly. Measured
// (rank correlation of size and place, treemap3 / Prophane KOfam): big-centre 0.74 / 0.60, big-top 0.85 / 0.77, small-top
// 0.82 / 0.84, small-centre about 0: with 5 to 11 members the relaxation to compact cells moves a small middle cell outwards.
export const ARRANGEMENTS = ["big-centre", "small-centre", "big-top", "small-top", "random"];
export function arrangedStart(C, n, arrange) {
  const cen = centroid(C.pts), R = 0.62 * Math.sqrt(C.area / Math.PI), golden = Math.PI * (3 - Math.sqrt(5));
  const pts = Array.from({ length: n }, (_, k) => add(cen, mul([Math.cos(k * golden), Math.sin(k * golden)], R * Math.sqrt((k + 0.5) / n))));
  let order = pts.map((p, k) => k);                                       // point for member k (big-centre: point k)
  if (arrange === "small-centre") order.reverse();                        // the smallest member gets the innermost point
  else if (arrange === "big-top") order.sort((a, b) => pts[b][1] - pts[a][1]);   // math coordinates: larger y is higher up
  else if (arrange === "small-top") order.sort((a, b) => pts[a][1] - pts[b][1]);
  else if (arrange === "random") { let s = (n * 2654435761) >>> 0 || 1;   // the same shuffle for the same number of members
    for (let k = n - 1; k > 0; k--) { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; const r = s % (k + 1); [order[k], order[r]] = [order[r], order[k]]; } }
  return order.map(k => pts[k]);
}

// ---------- CCVT ----------
// weights: damped Newton on the areas with the full Jacobian (dA_i/dw_j = -e_ij / 2d_ij, dA_i/dw_i = sum_j e_ij / 2d_ij; one weight
// pinned), a step is taken only if no cell becomes empty and the area error shrinks (semi-discrete optimal transport, cf.
// Kitagawa, Merigot & Thibert 2019); sites: damped steps to the cell centroids, shortened while a cell would become empty
function ccvt(C, target, { moveTol = 1e-3, maxOuter = 150, sites0 = null } = {}) {   // moveTol: in units of the typical cell size; sites0: start points
  const n = target.length, cen = centroid(C.pts), R = 0.62 * Math.sqrt(C.area / Math.PI), golden = Math.PI * (3 - Math.sqrt(5));
  const order = target.map((t, i) => i);   // the caller's order (largest first): the largest in the middle, stable between passes
  let sites = new Array(n);
  order.forEach((i, k) => {
    let p = add(cen, mul([Math.cos(k * golden), Math.sin(k * golden)], R * Math.sqrt((k + 0.5) / n)));
    if (sites0) p = sites0[i];
    for (let g = 0; g < 40 && !inside(C.pts, p); g++) p = add(cen, mul(sub(p, cen), 0.8));
    sites[i] = p;
  });
  let w = new Array(n).fill(0);
  const state = (S, w) => {
    const cells = powerCells(C, S, w), areas = cells.map(c => c.length > 2 ? shoelace(c.map(v => v.p)) : 0);
    const l2 = Math.sqrt(areas.reduce((s, a, i) => s + (a - target[i]) ** 2, 0));
    return { cells, areas, l2, minA: Math.min(...areas), err: Math.max(...areas.map((a, i) => Math.abs(a - target[i]) / target[i])) };
  };
  const solveWeights = st => {
    for (let it = 0; it < 60 && st.err > 1e-9; it++) {
      let d;
      if (n <= 40) {
        const J = Array.from({ length: n }, () => new Float64Array(n));
        st.cells.forEach((c, i) => { for (let k = 0; k < c.length; k++) if (c[k].l >= 0) {
          const e = len(sub(c[(k + 1) % c.length].p, c[k].p)), d = len(sub(sites[c[k].l], sites[i])), v = e / (2 * d);
          J[i][i] += v; J[i][c[k].l] -= v;
        } });
        const M = [], rhs = [];
        for (let i = 1; i < n; i++) { M.push(Float64Array.from(J[i].slice(1))); rhs.push(target[i] - st.areas[i]); }
        d = [0, ...solve(M, rhs)];
      } else {
        // many cells (a sub-vessel of hundreds of small members): the dense solve costs n^3 per Newton step; the Jacobian is a
        // sparse graph Laplacian, so the same step comes from conjugate gradients on its edges (both sides' e/2d averaged)
        const pair = new Map();
        st.cells.forEach((c, i) => { for (let k = 0; k < c.length; k++) { const j = c[k].l; if (j < 0) continue;
          const v = len(sub(c[(k + 1) % c.length].p, c[k].p)) / (2 * len(sub(sites[j], sites[i]))), key = i < j ? i * n + j : j * n + i;
          pair.set(key, (pair.get(key) || 0) + v / 2);
        } });
        const N = n - 1, diag = new Float64Array(n), ei = [], ej = [], ev = [];
        for (const [key, v] of pair) { const i = Math.floor(key / n), j = key % n; diag[i] += v; diag[j] += v; if (i > 0) { ei.push(i - 1); ej.push(j - 1); ev.push(v); } }
        const b = new Float64Array(N), pre = new Float64Array(N);
        for (let i = 1; i < n; i++) { b[i - 1] = target[i] - st.areas[i]; pre[i - 1] = diag[i] || 1; }
        const apply = (x, y) => { for (let i = 0; i < N; i++) y[i] = diag[i + 1] * x[i]; for (let m = 0; m < ev.length; m++) { y[ei[m]] -= ev[m] * x[ej[m]]; y[ej[m]] -= ev[m] * x[ei[m]]; } };
        d = [0, ...pcg(N, apply, b, pre)];
      }
      let a = 1, ok = false;
      for (let k = 0; k < 30 && !ok; k++, a /= 2) {
        const wn = w.map((v, i) => v + a * d[i]), sn = state(sites, wn);
        if (sn.minA > 0 && sn.l2 < (1 - a / 4) * st.l2) { w = wn; st = sn; ok = true; }
      }
      if (!ok) break;
    }
    return st;
  };
  let st = solveWeights(state(sites, w));
  for (let outer = 0; outer < maxOuter; outer++) {
    const goal = st.cells.map((c, i) => c.length > 2 ? centroid(c.map(v => v.p)) : sites[i]);
    let a = 0.5, moved = 0, stepped = false;
    for (let k = 0; k < 8; k++, a /= 2) {
      const S = sites.map((p, i) => add(p, mul(sub(goal[i], p), a)));
      if (!S.every(p => inside(C.pts, p))) continue;
      const sn = state(S, w);
      if (sn.minA > 0) { moved = Math.max(...S.map((p, i) => len(sub(p, sites[i])))); sites = S; st = sn; stepped = true; break; }
    }
    const w0 = w;
    st = solveWeights(st);
    if (!stepped && w === w0) break;   // neither sites nor weights changed: every further round would repeat this one exactly
    if (outer >= Math.min(20, maxOuter - 1) && st.err < 1e-7 && moved < moveTol * Math.sqrt(C.area / n)) break;
  }
  return { sites, w, cells: st.cells, err: st.err };
}

// ---------- foam graph ----------
function buildGraph(C, cells) {
  const n = cells.length, vlist = [], innerKey = new Map(), wallByPair = new Map(), tol = 1e-6 * Math.sqrt(C.area);
  const loops = [];
  for (let i = 0; i < n; i++) {
    const c = cells[i], items = [];
    for (let k = 0; k < c.length; k++) {
      const lp = c[(k - 1 + c.length) % c.length].l, ln = c[k].l, p = c[k].p;
      if (lp < 0 && ln < 0) continue; // a container corner: part of the container, not of the foam
      let v;
      if (lp >= 0 && ln >= 0) {
        const key = [i, lp, ln].sort((x, y) => x - y).join(",");
        if (!innerKey.has(key)) { innerKey.set(key, vlist.length); vlist.push({ kind: "inner", p: p.slice() }); }
        v = innerKey.get(key);
      } else {
        const nb = lp < 0 ? ln : lp, seg = -1 - (lp < 0 ? lp : ln), key = [i, nb].sort((x, y) => x - y).join(",");
        const list = wallByPair.get(key) || [];
        let hit = list.find(q => len(sub(vlist[q].p, p)) < tol);
        if (hit === undefined) { hit = vlist.length; vlist.push({ kind: "wall", p: p.slice(), s: C.sOn(p, seg) }); list.push(hit); wallByPair.set(key, list); }
        v = hit;
      }
      items.push({ v, next: ln }); // next: the edge leaving v (neighbour index, or < 0 for the container)
    }
    loops.push(items);
  }
  const films = [];
  for (let i = 0; i < n; i++) {
    const it = loops[i];
    for (let k = 0; k < it.length; k++) if (it[k].next > i) films.push({ a: it[k].v, b: it[(k + 1) % it.length].v, L: i, R: it[k].next });
  }
  for (let i = 0; i < n; i++) for (let k = 0; k < loops[i].length; k++) {
    const e = loops[i][k];
    if (e.next >= 0) { const b = loops[i][(k + 1) % loops[i].length].v; e.film = films.findIndex(f => (f.a === e.v && f.b === b) || (f.a === b && f.b === e.v)); }
  }
  return { vlist, loops, films };
}

// ---------- foam solve ----------
// unknowns: inner vertices (x, y), sliding wall vertices (arc-length position s), the half-angle of every film, the pressures
// (p_0 = 0). A wall vertex pinned at a corner of the container (where the walls of the level above meet) is held there and
// has no 90-degree condition; layout() decides about pinning. init: a previous state to start from.
function foamSolve(C, G, target, pinned = new Map(), init = null) {
  const n = target.length, NF = G.films.length;
  const inner = G.vlist.map((v, k) => v.kind === "inner" ? k : -1).filter(k => k >= 0);
  const wall = G.vlist.map((v, k) => v.kind === "wall" ? k : -1).filter(k => k >= 0);
  const free = wall.filter(k => !pinned.has(k));
  const NI = inner.length, NW = free.length;
  const wallOrder0 = wall.slice().sort((a, b) => G.vlist[a].s - G.vlist[b].s);
  const cyc = ord => { const k0 = ord.indexOf(wallOrder0[0]); return ord.slice(k0).concat(ord.slice(0, k0)).join(","); };
  const ref = wallOrder0.join(",");
  const P0 = init ? init.P : G.vlist.map(v => v.p), S0 = init ? init.S : G.vlist.map(v => v.s);
  const x0 = [];
  for (const k of inner) x0.push(...P0[k]);
  for (const k of free) x0.push(S0[k]);
  for (let f = 0; f < NF; f++) x0.push(init ? init.phi[f] : 0);   // half-angle of every film (0 = straight)
  for (let i = 1; i < n; i++) x0.push(init ? init.p[i] : 0);     // pressures, p_0 = 0

  const unpack = x => {
    const P = G.vlist.map(v => v.p), S = S0.slice();
    inner.forEach((k, m) => { P[k] = [x[2 * m], x[2 * m + 1]]; });
    free.forEach((k, m) => { S[k] = x[2 * NI + m]; });
    pinned.forEach((sv, k) => { S[k] = sv; });
    wall.forEach(k => { P[k] = C.posAt(S[k]); });
    return { P, S, phi: x.slice(2 * NI + NW, 2 * NI + NW + NF), p: [0, ...x.slice(2 * NI + NW + NF)] };
  };
  // a film as a circular arc through its two vertices with half-angle phi (phi > 0: bulges to the right of a->b, into R); the
  // half-angle is an unknown of its own, so arcs pass smoothly through the semicircle (a small cell at the wall) and beyond
  function filmGeo(f, P, phi) {
    const u0 = sub(P[f.b], P[f.a]), c = len(u0);
    if (c < 1e-9 || Math.abs(phi) > Math.PI - 0.05) return null;
    const u = mul(u0, 1 / c), sn = Math.sin(phi);
    const small = Math.abs(phi) < 1e-4;
    const seg = small ? c * c * phi / 6 : c * c * (2 * phi - Math.sin(2 * phi)) / (8 * sn * sn);
    const arc = small ? c : c * phi / sn;
    return { c, phi, kap: 2 * sn / c, seg, arc, ta: rot(u, -phi), tb: rot(mul(u, -1), phi) };
  }
  function cellPolygon(i, P, S) {
    const it = G.loops[i], pts = [];
    for (let k = 0; k < it.length; k++) {
      pts.push(P[it[k].v]);
      if (it[k].next < 0) pts.push(...C.between(S[it[k].v], S[it[(k + 1) % it.length].v]));
    }
    return pts;
  }
  const why = { order: 0, outside: 0, film: 0 };
  function evaluate(x) {
    const { P, S, phi, p } = unpack(x), geo = [];
    if (cyc(wall.slice().sort((a, b) => ((S[a] % C.L) + C.L) % C.L - ((S[b] % C.L) + C.L) % C.L)) !== ref) { why.order++; return null; } // wall vertices kept their order
    for (const k of inner) if (!inside(C.pts, P[k])) { why.outside++; return null; }
    for (let m = 0; m < NF; m++) { const g = filmGeo(G.films[m], P, phi[m]); if (!g) { why.film++; return null; } geo.push(g); }
    const force = G.vlist.map(() => [0, 0]);
    G.films.forEach((f, m) => { force[f.a] = add(force[f.a], geo[m].ta); force[f.b] = add(force[f.b], geo[m].tb); });
    const areas = G.loops.map((_, i) => shoelace(cellPolygon(i, P, S)));
    G.films.forEach((f, m) => { areas[f.L] += geo[m].seg; areas[f.R] -= geo[m].seg; });
    const res = [];
    for (const k of inner) res.push(force[k][0], force[k][1]);
    for (const k of free) res.push(dot(force[k], C.dirAt(S[k])));
    G.films.forEach((f, m) => res.push(2 * Math.sin(phi[m]) - geo[m].c * (p[f.L] - p[f.R])));   // Laplace: curvature = pressure difference
    for (let i = 0; i < n; i++) res.push(3 * (areas[i] - target[i]) / target[i]);
    return { res, P, S, phi, p, geo, areas, force };
  }
  const cost = e => e ? e.res.reduce((s, r) => s + r * r, 0) : Infinity;

  // structure of the Jacobian: which residuals each unknown can touch; unknowns with disjoint rows share one evaluation
  const rowOfVertex = new Map();   // force rows of inner vertices, wall row of free wall vertices
  inner.forEach((k, i) => rowOfVertex.set(k, [2 * i, 2 * i + 1]));
  free.forEach((k, i) => rowOfVertex.set(k, [2 * NI + i]));
  const lapRow = m => 2 * NI + NW + m, areaRow = i => 2 * NI + NW + NF + i;
  const filmsAt = G.vlist.map(() => []);
  G.films.forEach((f, m) => { filmsAt[f.a].push(m); filmsAt[f.b].push(m); });
  const touchFilm = (m, set) => { const f = G.films[m]; for (const v of [f.a, f.b]) for (const r of rowOfVertex.get(v) || []) set.add(r); set.add(lapRow(m)); set.add(areaRow(f.L)); set.add(areaRow(f.R)); };
  const DEP = [];
  for (const k of inner) { const set = new Set(); for (const m of filmsAt[k]) touchFilm(m, set); const d = [...set]; DEP.push(d, d); }
  for (const k of free) { const set = new Set(); for (const m of filmsAt[k]) touchFilm(m, set); for (const loop of G.loops) if (loop.some(e => e.v === k)) for (let i = 0; i < n; i++) if (G.loops[i] === loop) set.add(areaRow(i)); DEP.push([...set]); }
  for (let m = 0; m < NF; m++) { const set = new Set(); touchFilm(m, set); DEP.push([...set]); }
  for (let i = 1; i < n; i++) { const set = new Set(); G.films.forEach((f, m) => { if (f.L === i || f.R === i) set.add(lapRow(m)); }); DEP.push([...set]); }
  const GROUPS = [], used = [];
  DEP.forEach((rows, j) => {
    let gi = 0;
    for (; gi < GROUPS.length; gi++) if (rows.every(r => !used[gi].has(r))) break;
    if (gi === GROUPS.length) { GROUPS.push([]); used.push(new Set()); }
    GROUPS[gi].push(j); for (const r of rows) used[gi].add(r);
  });

  let x = x0.slice(), cur = evaluate(x), lam = 1e-3, it = 0;
  if (!cur) return { cur: null, it: 0, startCost: Infinity, endCost: Infinity, NI, NW, NF, why };
  const startCost = cost(cur);
  const hist = [];
  for (; it < 400 && cost(cur) > 1e-24; it++) {
    const m = cur.res.length, N = x.length, cols = new Array(N);   // sparse columns: [[row, value], ...]
    const hOf = j => j < 2 * NI + NW ? 1e-7 * Math.sqrt(C.area) : j < 2 * NI + NW + NF ? 1e-8 : 1e-10 / Math.sqrt(C.area / 1e5);
    const single = j => {
      const h = hOf(j), xp = x.slice(); xp[j] += h;
      let e = evaluate(xp), sgn = 1;
      if (!e) { xp[j] -= 2 * h; e = evaluate(xp); sgn = -1; if (!e) { cols[j] = []; return; } }
      cols[j] = DEP[j].map(r => [r, sgn * (e.res[r] - cur.res[r]) / h]);
    };
    for (const group of GROUPS) {
      if (group.length === 1) { single(group[0]); continue; }
      const xp = x.slice(); for (const j of group) xp[j] += hOf(j);
      const e = evaluate(xp);
      if (!e) { for (const j of group) single(j); continue; }
      for (const j of group) { const h = hOf(j); cols[j] = DEP[j].map(r => [r, (e.res[r] - cur.res[r]) / h]); }
    }
    // normal equations (J^T J + lam diag) d = -J^T r, solved by preconditioned conjugate gradients on the sparse J
    const g = new Float64Array(N), diag = new Float64Array(N), rowCount = new Int32Array(m + 1);
    for (let j = 0; j < N; j++) for (const [r, v] of cols[j]) if (v) { rowCount[r + 1]++; g[j] += v * cur.res[r]; diag[j] += v * v; }
    for (let r = 0; r < m; r++) rowCount[r + 1] += rowCount[r];   // row pointers of J in compressed rows
    const nnz = rowCount[m], colIdx = new Int32Array(nnz), vals = new Float64Array(nnz), fill = rowCount.slice(0, m);
    for (let j = 0; j < N; j++) for (const [r, v] of cols[j]) if (v) { colIdx[fill[r]] = j; vals[fill[r]++] = v; }
    const Jv = new Float64Array(m);
    const applyA = (v, lamNow, out) => {
      for (let r = 0; r < m; r++) { let t = 0; for (let q = rowCount[r]; q < rowCount[r + 1]; q++) t += vals[q] * v[colIdx[q]]; Jv[r] = t; }
      out.fill(0);
      for (let r = 0; r < m; r++) { const t = Jv[r]; if (t) for (let q = rowCount[r]; q < rowCount[r + 1]; q++) out[colIdx[q]] += vals[q] * t; }
      for (let a = 0; a < N; a++) out[a] += lamNow * (diag[a] || 1e-12) * v[a];
    };
    let accepted = false;
    for (let tries = 0; tries < 14 && !accepted; tries++) {
      const d = pcg(N, (v, out) => applyA(v, lam, out), Array.from(g, v => -v), diag.map(v => (v || 1e-12) * (1 + lam)));
      const xn = x.map((v, k) => v + d[k]), en = evaluate(xn);
      if (cost(en) < cost(cur)) { x = xn; cur = en; lam = Math.max(lam / 3, 1e-12); accepted = true; }
      else lam *= 4;
    }
    if (!accepted) break;
    hist.push(cost(cur));
    if (hist.length > 15 && hist[hist.length - 1] > 0.99 * hist[hist.length - 16] && hist[hist.length - 1] > 1e-12) break;   // stalled
  }
  return { cur, it, startCost, endCost: cost(cur), NI, NW, NF, why, wall, free, state: { P: cur.P, S: cur.S, phi: cur.phi, p: cur.p } };
}

function pcg(N, apply, b, pre, maxIt = 3 * N + 50) { // preconditioned conjugate gradients, Jacobi preconditioner
  const x = new Float64Array(N), r = Float64Array.from(b), z = new Float64Array(N), p = new Float64Array(N), Ap = new Float64Array(N);
  let bn = 0; for (let i = 0; i < N; i++) bn += b[i] * b[i]; bn = Math.sqrt(bn) || 1;
  for (let i = 0; i < N; i++) { z[i] = r[i] / pre[i]; p[i] = z[i]; }
  let rz = 0; for (let i = 0; i < N; i++) rz += r[i] * z[i];
  for (let it = 0; it < maxIt; it++) {
    apply(p, Ap);
    let pAp = 0; for (let i = 0; i < N; i++) pAp += p[i] * Ap[i];
    if (!(pAp > 0)) break;
    const al = rz / pAp;
    let rn = 0; for (let i = 0; i < N; i++) { x[i] += al * p[i]; r[i] -= al * Ap[i]; rn += r[i] * r[i]; }
    if (Math.sqrt(rn) < 1e-13 * bn) break;
    let rz2 = 0; for (let i = 0; i < N; i++) { z[i] = r[i] / pre[i]; rz2 += r[i] * z[i]; }
    const be = rz2 / rz; rz = rz2;
    for (let i = 0; i < N; i++) p[i] = z[i] + be * p[i];
  }
  return x;
}

function solve(M, b) {
  const N = b.length;
  for (let c = 0; c < N; c++) {
    let piv = c; for (let r = c + 1; r < N; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]]; [b[c], b[piv]] = [b[piv], b[c]];
    const d = M[c][c] || 1e-300;
    for (let r = c + 1; r < N; r++) { const f = M[r][c] / d; if (!f) continue; const Mr = M[r], Mc = M[c]; for (let k = c; k < N; k++) Mr[k] -= f * Mc[k]; b[r] -= f * b[c]; }
  }
  const x = new Array(N).fill(0);
  for (let r = N - 1; r >= 0; r--) { let s = b[r]; for (let k = r + 1; k < N; k++) s -= M[r][k] * x[k]; x[r] = s / (M[r][r] || 1e-300); }
  return x;
}

// ---------- outlines: arcs sampled by length ----------
function arcPoints(A, g, step) {
  const k = g.kap, nS = Math.max(6, Math.ceil(g.arc / step), Math.ceil(Math.abs(2 * (g.phi || 0)) / (4 * Math.PI / 180))), out = [];
  if (Math.abs(k) * g.c < 1e-9) { for (let s = 1; s <= nS; s++) out.push(add(A, mul(g.ta, g.c * s / nS))); return out; }
  const th0 = Math.atan2(g.ta[1], g.ta[0]);
  for (let s = 1; s <= nS; s++) { const t = g.arc * s / nS; out.push([A[0] + (Math.sin(th0 + k * t) - Math.sin(th0)) / k, A[1] + (-Math.cos(th0 + k * t) + Math.cos(th0)) / k]); }
  return out;
}
function outline(C, G, i, P, S, geo, step) {
  const it = G.loops[i], pts = [];
  for (let k = 0; k < it.length; k++) {
    const a = it[k].v, b = it[(k + 1) % it.length].v;
    pts.push(P[a]);
    if (it[k].next < 0) { pts.push(...C.between(S[a], S[b])); continue; }
    const f = G.films[it[k].film];
    const g = geo ? geo[it[k].film] : { kap: 0, c: len(sub(P[f.b], P[f.a])), arc: len(sub(P[f.b], P[f.a])), ta: mul(sub(P[f.b], P[f.a]), 1 / len(sub(P[f.b], P[f.a]))) };
    const seg = arcPoints(P[f.a], g, step); seg.pop();
    if (f.a === a) pts.push(...seg); else pts.push(...seg.reverse());
  }
  return pts;
}
function angleStats(C, G, P, S, geo) {
  const tang = G.vlist.map(() => []);
  G.films.forEach((f, m) => {
    const u = mul(sub(P[f.b], P[f.a]), 1 / len(sub(P[f.b], P[f.a])));
    tang[f.a].push(geo ? geo[m].ta : u); tang[f.b].push(geo ? geo[m].tb : mul(u, -1));
  });
  let innerMax = 0, wallMax = 0;
  G.vlist.forEach((v, k) => {
    if (v.kind === "inner" && tang[k].length === 3) for (let a = 0; a < 3; a++) {
      const t = Math.acos(Math.max(-1, Math.min(1, dot(tang[k][a], tang[k][(a + 1) % 3])))) * 180 / Math.PI;
      innerMax = Math.max(innerMax, Math.abs(t - 120));
    }
    if (v.kind === "wall" && tang[k].length === 1) wallMax = Math.max(wallMax, Math.abs(Math.acos(Math.min(1, Math.abs(dot(tang[k][0], C.dirAt(S[k]))))) * 180 / Math.PI - 90));
  });
  return { innerMax, wallMax };
}

// ---------- one container: CCVT, then foam ----------
// A vessel from the level above is curved and, where its walls bulge inwards, not convex; a straight power line can cut it twice
// and split a cell. So the topology comes from the power diagram of the vessel's chord polygon (straight lines between its
// corners), and the wall vertices are carried over to the curved vessel in proportion to arc length; the foam then relaxes in
// the real vessel and meets its areas exactly. If that fails, the power diagram of the vessel itself is tried.
function layout(C, target, step, method = "foam", sites0 = null) {
  const n = target.length;
  if (n === 1) return { n, power: [C.pts], foam: [C.pts], ok: true, single: true };
  if (method === "power") { // straight walls: the capacity-constrained power diagram itself
    const base = ccvt(C, target, { sites0 }), outs = base.cells.map(c => c.map(v => v.p));
    const ok = base.cells.every(c => c.length > 2) && base.err < 1e-6;
    return { n, power: outs, foam: outs, ok, reason: ok ? null : `areas off by ${(base.err * 100).toFixed(3)} %`, ccvtErr: base.err,
      errFoam: base.err, compPower: outs.map(o => 4 * Math.PI * Math.abs(shoelace(o)) / perimeter(o) ** 2), compFoam: outs.map(o => 4 * Math.PI * Math.abs(shoelace(o)) / perimeter(o) ** 2), via: "power" };
  }
  let direct = layoutVia(C, C, target, step, null, false, sites0);
  if (!direct.ok && direct.graph) { const again = layoutVia(C, C, target, step, null, true, sites0); if (again.ok || !direct.graph) direct = again; }   // converged start
  if (direct.ok || !(C.corners.length >= 3 && C.corners.length < C.m)) return { ...direct, via: "vessel" };
  // the vessel's own power diagram split a cell or did not relax: topology from the chord polygon (if convex) or a disk
  const Cc = makeContainer(C.corners.map(k => C.pts[k]));
  const tries = [];
  if (isConvex(Cc.pts)) tries.push(["chords", Cc, mapChords]);
  tries.push(["disk", diskOf(C), mapDisk]);
  const reasons = [`vessel: ${direct.reason}`];
  const candidates = [];   // consistent wall graphs with their best foam state: [graph, state]
  if (direct.graph && direct.reason !== "inconsistent wall graph" && direct.reason !== "empty power cell") candidates.push([direct.graph, direct.state]);
  for (const [via, Cp, map] of tries) {
    const r = layoutVia(C, Cp, target, step, map);
    if (r.ok) return { ...r, via, chordReason: reasons.join("; ") };
    reasons.push(`${via}: ${r.reason}`);
    if (r.graph) candidates.push([r.graph, r.state]);
  }
  // the foam may settle from another start (Prophane 05.10.2026: a vessel whose foam did not settle fell back to slices or a
  // fan, and every level inside those thin cells failed too): the other arrangements of the start points, loose and tight
  for (const arrange of ["small-centre", "big-top", "random"]) {
    const s = arrangedStart(C, n, arrange);
    for (const tight of [false, true]) {
      const r = layoutVia(C, C, target, step, null, tight, s);
      if (r.ok) return { ...r, via: `foam from the ${arrange} start`, chordReason: reasons.join("; ") };
      if (r.graph && r.reason !== "inconsistent wall graph" && r.reason !== "empty power cell") candidates.push([r.graph, r.state]);
    }
  }
  reasons.push("other starts: no foam");
  // a film that shrinks to nothing asks for a change of neighbours (T1): start the power diagram again from the centroids of
  // the cells of the best foam state; the near-vanished wall then usually gives way to the other pair of neighbours
  for (const [graph, state] of candidates) {
    if (!state) continue;
    const geo = graph.films.map((f, m) => filmArc(state.P, f, state.phi[m]));
    if (geo.some(g => !g) || Math.min(...geo.map(g => g.c)) > 0.05 * Math.sqrt(C.area / n)) continue;
    const cells = graph.loops.map((_, i) => outline(C, graph, i, state.P, state.S, geo, step));
    const seeds = cells.map(o => centroid(o));
    for (const tight of [false, true]) {
      const r = layoutVia(C, C, target, step, null, tight, seeds);
      if (r.ok) return { ...r, via: "neighbour swap (T1), then foam", chordReason: reasons.join("; ") };
    }
    reasons.push("neighbour swap: no foam");
  }
  // no route settled: make the areas exact on a consistent wall graph (never a split cell), from the best foam state with its
  // walls' curvature kept, else with straight walls; then the foam once more from there
  for (const [graph, state] of candidates.reverse()) for (const start of state ? [state, null] : [null]) {
    const fit = areaFit(C, graph, target, start);
    if (!fit.ok) { reasons.push(`area fit${start ? " (curved)" : ""}: ${fit.areaErr == null ? "no valid start" : fit.areaErr.toExponential(1)}`); continue; }
    const r = finishFoam(C, graph, target, step, fit.state);
    if (r.ok) return { ...r, via: "area fit, then foam", chordReason: reasons.join("; ") };
    const geo = graph.films.map((f, m) => filmArc(fit.state.P, f, fit.state.phi[m]));
    const outs = graph.loops.map((_, i) => outline(C, graph, i, fit.state.P, fit.state.S, start ? geo : null, step));
    return { ...r, power: outs, foam: outs, ok: false, via: start ? "nearly foam, exact areas" : "straight walls, exact areas", reason: `foam did not settle (${r.reason})`,
      chordReason: reasons.join("; "), errFoam: Math.max(...outs.map((o, i) => Math.abs(Math.abs(shoelace(o)) - target[i]) / target[i])) };
  }
  // elongated vessels: slices across, then the foam on that row of cells
  const strip = stripStart(C, target);
  if (strip) {
    const tg = strip.order.map(i => target[i]), r = finishFoam(C, strip.G, tg, step, null), back = new Array(n);
    const outs = r.ok ? r.foam : strip.G.loops.map((_, k) => outline(C, strip.G, k, strip.G.vlist.map(v => v.p), strip.G.vlist.map(v => v.s), null, step));
    strip.order.forEach((i, k) => { back[i] = outs[k]; });
    const errOf = o => Math.max(...o.map((q, i) => Math.abs(Math.abs(shoelace(q)) - target[i]) / target[i]));
    if (r.ok || errOf(back) < 1e-6) return { ...r, n, power: back, foam: back, ok: r.ok, via: r.ok ? "slices, then foam" : "slices across the vessel, exact areas",
      reason: r.ok ? null : `foam did not settle (${r.reason})`, chordReason: reasons.join("; "), errFoam: errOf(back), compFoam: r.ok ? back.map(o => 4 * Math.PI * Math.abs(shoelace(o)) / perimeter(o) ** 2) : null };
  }
  // last resort, valid and exact for a vessel that is star-shaped around its pole: a fan of sectors (never a split cell)
  const fan = fanCells(C, target);
  if (fan) return { n, power: fan, foam: fan, ok: false, via: "fan from the vessel's centre, exact areas", reason: "no foam and no area fit", chordReason: reasons.join("; "),
    errFoam: Math.max(...fan.map((o, i) => Math.abs(shoelace(o) - target[i]) / target[i])), compPower: fan.map(o => 4 * Math.PI * shoelace(o) / perimeter(o) ** 2) };
  return { ...direct, via: "vessel", chordReason: reasons.join("; ") };   // not star-shaped either: the vessel's own power diagram
}
function isConvex(ps) {
  const m = ps.length;
  return ps.every((p, k) => { const a = ps[(k + m - 1) % m], b = ps[(k + 1) % m]; return (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]) >= -1e-9; });
}
// Slices across an elongated vessel (a crescent, say): the two boundary points farthest apart are the tips, the boundary
// between them gives two chains, and cut k joins the points at the same fraction of arc length on both chains; each cut's
// fraction is found by bisection so that every slice gets its exact area. Returns a wall graph with a valid state (cells in a
// row, every film from wall to wall) for the foam to relax, or null if a cut leaves the vessel.
function stripStart(C, target) {
  const n = target.length, pts = C.pts, m = pts.length;
  let ia = 0, ib = 0, best = -1;
  for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) { const d = (pts[i][0] - pts[j][0]) ** 2 + (pts[i][1] - pts[j][1]) ** 2; if (d > best) { best = d; ia = i; ib = j; } }
  const sA0 = C.cum[ia], sA1 = C.cum[ib], lenA = sA1 - sA0, lenB = C.L - lenA;   // chain A: tip a -> tip b, chain B: tip b -> tip a
  const onA = f => sA0 + f * lenA, onB = f => (sA1 + (1 - f) * lenB) % C.L;      // cut at fraction f joins A(f) and B(1 - f)
  const regionArea = f => { const sa = onA(f), sb = onB(f), poly = [C.posAt(sA0), ...C.between(sA0, sa), C.posAt(sa), C.posAt(sb), ...C.between(sb, sA0)]; return shoelace(poly); };
  const idx = target.map((t, i) => i).sort((a, b) => target[b] - target[a]), order = [];
  for (let lo = 0, hi = idx.length - 1; lo <= hi; ) { order.push(idx[lo++]); if (lo <= hi) order.push(idx[hi--]); }
  const scale = C.area / target.reduce((a, t) => a + t, 0), cuts = [];
  let cum = 0, fLo = 0;
  for (let q = 0; q < n - 1; q++) {
    cum += target[order[q]] * scale;
    let lo = fLo, hi = 1;
    for (let it = 0; it < 60; it++) { const mid = (lo + hi) / 2; if (regionArea(mid) < cum) lo = mid; else hi = mid; }
    const f = (lo + hi) / 2, a = C.posAt(onA(f)), b = C.posAt(onB(f));
    for (let t = 0.1; t < 1; t += 0.1) if (!inside(pts, [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])])) return null;
    cuts.push({ f, sa: onA(f), sb: onB(f) }); fLo = f;
  }
  // wall graph: vertex 2k = A end of cut k, 2k+1 = B end; film k from A to B separates slice k (left) and slice k+1
  const vlist = [], films = [], loops = Array.from({ length: n }, () => []);
  cuts.forEach(c => { vlist.push({ kind: "wall", s: c.sa, p: C.posAt(c.sa) }, { kind: "wall", s: c.sb, p: C.posAt(c.sb) }); });
  cuts.forEach((c, k) => films.push({ a: 2 * k, b: 2 * k + 1, L: k, R: k + 1 }));
  for (let k = 0; k < n; k++) {
    const loop = [];
    if (k > 0) loop.push({ v: 2 * (k - 1), next: -1 });                // along chain A to this slice's own cut
    if (k < n - 1) loop.push({ v: 2 * k, next: k + 1, film: k }, { v: 2 * k + 1, next: k > 0 ? -1 : -1 });
    if (k > 0) loop.push({ v: 2 * (k - 1) + 1, next: k - 1, film: k - 1 });
    loops[k] = loop;
  }
  // container edges between consecutive loop items are walls; mark them (next < 0) correctly
  for (let k = 0; k < n; k++) { const L = loops[k]; for (let i = 0; i < L.length; i++) if (L[i].film === undefined) L[i].next = -1; }
  // slices were filled in `order`; the graph's cell k is order[k]
  const G = { vlist, films, loops };
  return { G, order };
}

// Sectors from the vessel's pole of inaccessibility with exact areas: the fan triangle (pole, b_j, b_j + t (b_j+1 - b_j)) grows
// linearly in t, so every cut point is found exactly. Valid only if every boundary point is seen from the pole (all fan
// triangles positive); large and small cells alternate around the fan. Returns null otherwise.
function fanCells(C, target) {
  const n = target.length, pts = C.pts, m = pts.length;
  const fanOf = p => pts.map((a, j) => { const b = pts[(j + 1) % m]; return ((a[0] - p[0]) * (b[1] - p[1]) - (a[1] - p[1]) * (b[0] - p[0])) / 2; });
  // a centre that sees the whole boundary: the pole if possible, else the best of a grid inside the vessel (the deepest one)
  let p = poleOf(pts), fanA = fanOf(p);
  if (fanA.some(a => a <= 0)) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const q of pts) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }
    let best = null;
    for (let gx = 1; gx < 24; gx++) for (let gy = 1; gy < 24; gy++) {
      const q = [x0 + (x1 - x0) * gx / 24, y0 + (y1 - y0) * gy / 24];
      if (!inside(pts, q)) continue;
      const f = fanOf(q);
      if (f.every(a => a > 0)) { const depth = edgeDist(q, pts); if (!best || depth > best.depth) best = { q, f, depth }; }
    }
    if (!best) return null;
    p = best.q; fanA = best.f;
  }
  const idx = target.map((t, i) => i).sort((a, b) => target[b] - target[a]), order = [];
  for (let lo = 0, hi = idx.length - 1; lo <= hi; ) { order.push(idx[lo++]); if (lo <= hi) order.push(idx[hi--]); }
  const scale = C.area / target.reduce((a, t) => a + t, 0), cells = new Array(n);
  let j = 0, used = 0, start = pts[0].slice();   // the current cut point lies on edge j at fraction `used` of its fan area
  for (let q = 0; q < order.length; q++) {
    const i = order[q], poly = [[p[0], p[1]], start.slice()];
    let need = target[i] * scale;
    if (q === order.length - 1) { for (let k = j; k < m; k++) poly.push(pts[(k + 1) % m].slice()); cells[i] = poly; break; }   // back to the first cut, pts[0]
    for (;;) {
      const rest = fanA[j] * (1 - used);
      if (need <= rest) {
        used += need / fanA[j];
        const a = pts[j], b = pts[(j + 1) % m];
        start = [a[0] + used * (b[0] - a[0]), a[1] + used * (b[1] - a[1])];
        poly.push(start.slice());
        break;
      }
      need -= rest; j++; used = 0;
      poly.push(pts[j % m].slice());
    }
    cells[i] = poly;
  }
  return cells.every(c => c && shoelace(c) > 0) ? cells : null;
}

// A convex stand-in for the vessel (its chord polygon, or a disk of equal area) carries every vessel boundary point at the same
// fraction of arc length; inner points are carried over with mean value coordinates (Floater 2003): a point is a weighted mean
// of the stand-in's boundary points, and the same weights applied to the vessel's points give its image. On a convex source
// the weights are positive and the map is smooth, so a valid partition of the stand-in gives a valid start in the vessel.
function standIn(C, Cp, kind) {
  if (Cp.mvc) return Cp.mvc;
  const src = C.pts.map((p, j) => {
    const s = C.cum[j];
    if (kind === "disk") { const t = 2 * Math.PI * s / C.L; return [Cp.center[0] + Cp.R * Math.cos(t), Cp.center[1] + Cp.R * Math.sin(t)]; }
    const k = C.corners.reduce((acc, kc, i) => C.cum[kc] <= s + 1e-12 ? i : acc, 0), s0 = C.cum[C.corners[k]], s1 = k + 1 < C.corners.length ? C.cum[C.corners[k + 1]] : C.L;
    const u = (s - s0) / (s1 - s0 || 1), a = Cp.pts[k], b = Cp.pts[(k + 1) % Cp.m];
    return [a[0] + u * (b[0] - a[0]), a[1] + u * (b[1] - a[1])];
  });
  return (Cp.mvc = { src, dst: C.pts });
}
function mvcMap(src, dst, x) {
  const m = src.length, w = new Float64Array(m);
  const d = src.map(p => [p[0] - x[0], p[1] - x[1]]), r = d.map(v => Math.hypot(v[0], v[1]));
  for (let i = 0; i < m; i++) if (r[i] < 1e-12) return dst[i].slice();
  const tanHalf = i => { const a = d[i], b = d[(i + 1) % m], cr = a[0] * b[1] - a[1] * b[0], dt = a[0] * b[0] + a[1] * b[1]; const ang = Math.atan2(cr, dt); return Math.tan(ang / 2); };
  let sum = 0;
  for (let i = 0; i < m; i++) { w[i] = (tanHalf((i - 1 + m) % m) + tanHalf(i)) / r[i]; sum += w[i]; }
  let X = 0, Y = 0;
  for (let i = 0; i < m; i++) { X += w[i] * dst[i][0]; Y += w[i] * dst[i][1]; }
  return [X / sum, Y / sum];
}
// chord polygon -> vessel: a point on chord k at fraction u goes to the same fraction of the vessel's arc between corners k and k+1
function mapChords(C, Cp, v) {
  if (v.kind !== "wall") { const M = standIn(C, Cp, "chords"); v.p = mvcMap(M.src, M.dst, v.p); return; }
  const sc = ((v.s % Cp.L) + Cp.L) % Cp.L, k = Cp.segOf(sc), u = (sc - Cp.cum[k]) / (Cp.cum[k + 1] - Cp.cum[k]);
  const s0 = C.cum[C.corners[k]], s1 = k + 1 < C.corners.length ? C.cum[C.corners[k + 1]] : C.L;
  v.s = s0 + u * (s1 - s0); v.p = C.posAt(v.s);
}
// a disk of the vessel's area around its centroid, its boundary parametrised like the vessel's (fraction of the length)
function diskOf(C) {
  const c = centroid(C.pts), R = Math.sqrt(C.area / Math.PI), M = 360, pts = [];
  for (let k = 0; k < M; k++) { const t = 2 * Math.PI * k / M; pts.push([c[0] + R * Math.cos(t), c[1] + R * Math.sin(t)]); }
  const D = makeContainer(pts); D.center = c; D.R = R; return D;
}
function mapDisk(C, D, v) {
  if (v.kind === "wall") { const f = (((v.s % D.L) + D.L) % D.L) / D.L; v.s = f * C.L; v.p = C.posAt(v.s); return; }
  const M = standIn(C, D, "disk"); v.p = mvcMap(M.src, M.dst, v.p);
}

function layoutVia(C, Cp, target, step, map, tight = false, sites0 = null) {
  const n = target.length, mapped = !!map;
  const cpConvex = Cp.pts.every((p, k) => { const a = Cp.pts[(k + Cp.m - 1) % Cp.m], b = Cp.pts[(k + 1) % Cp.m]; return (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]) >= -1e-9; });
  const base = ccvt(Cp, target.map(t => t * Cp.area / C.area), { ...(tight ? {} : { moveTol: 1e-2, maxOuter: 40 }), sites0 });   // a loose start first: the foam reshapes the cells anyway
  const plain = reason => { // the power diagram as it is: straight walls, exact areas
    const outs = base.cells.map(c => c.map(v => v.p));
    return { n, power: outs, foam: outs, ok: false, reason, cpConvex, ccvtErr: base.err, errPower: Math.max(...outs.map((o, i) => Math.abs(Math.abs(shoelace(o)) - target[i]) / target[i])),
      compPower: outs.map(o => 4 * Math.PI * Math.abs(shoelace(o)) / perimeter(o) ** 2), compFoam: null };
  };
  if (base.cells.some(c => c.length < 3)) return plain("empty power cell");
  const G = buildGraph(Cp, base.cells);
  if (mapped) {
    const cen = centroid(C.pts);
    for (const v of G.vlist) { map(C, Cp, v); if (v.kind !== "wall") for (let g = 0; g < 30 && !inside(C.pts, v.p); g++) v.p = add(cen, mul(sub(v.p, cen), 0.9)); }
  }
  // the wall graph must be consistent: every edge to a neighbour is a film, films join two different vertices, inner vertices have three films
  const deg = G.vlist.map(() => 0);
  G.films.forEach(f => { deg[f.a]++; deg[f.b]++; });
  if (G.loops.some(l => l.some(e => e.next >= 0 && e.film < 0)) || G.films.some(f => f.a === f.b) || G.vlist.some((v, k) => v.kind === "inner" && deg[k] !== 3) || G.vlist.some((v, k) => v.kind === "wall" && deg[k] !== 1))
    return plain("inconsistent wall graph");
  return { ...finishFoam(C, G, target, step, null), cpConvex, ccvtErr: base.err, graph: G,
    sumCheck: Math.abs(base.cells.reduce((s, c) => s + (c.length > 2 ? shoelace(c.map(v => v.p)) : 0), 0) - C.area) / C.area };
}

// the foam on a consistent wall graph, from the graph's own positions or from start (a state with exact areas)
function finishFoam(C, G, target, step, start) {
  const n = target.length;
  const convex = C.pts.every((p, k) => { const a = C.pts[(k + C.m - 1) % C.m], b = C.pts[(k + 1) % C.m]; return (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]) >= -1e-9; });
  const P0 = start ? start.P : G.vlist.map(v => v.p), S0 = start ? start.S : G.vlist.map(v => v.s);
  const power = G.loops.map((_, i) => outline(C, G, i, P0, S0, null, step));
  // a wall vertex that stalls on a corner of the container is pinned there; a pin is released when the film could get shorter
  // by sliding along either side (outgoing tangent t: stable iff t.d <= 0 for both directions d away from the corner)
  const pinned = new Map(), tolS = 1e-4 * Math.sqrt(C.area);
  let F, init = start ? { P: start.P, S: start.S.slice(), phi: start.phi, p: start.p } : null, rounds = 0, pinsUsed = 0;
  for (; rounds < 8; rounds++) {
    F = foamSolve(C, G, target, pinned, init);
    if (!F.cur) break;
    init = F.state;
    let changed = false;
    if (F.endCost > 1e-12) {
      for (const k of F.free) {
        const sv = ((init.S[k] % C.L) + C.L) % C.L;
        for (const kc of C.corners) { const cs = C.cum[kc], d = Math.min(Math.abs(cs - sv), C.L - Math.abs(cs - sv)); if (d < tolS) { pinned.set(k, cs); pinsUsed++; changed = true; } }
      }
    } else {
      for (const [k, cs] of [...pinned]) {
        const kc = C.corners.find(c => C.cum[c] === cs), m = G.films.findIndex(f => f.a === k || f.b === k), g = F.cur.geo[m];
        const t = G.films[m].a === k ? g.ta : g.tb, dOut = C.segDir(kc), dBack = mul(C.segDir((kc - 1 + C.m) % C.m), -1);
        if (dot(t, dOut) > 1e-9) { pinned.delete(k); init.S[k] = cs + 2 * tolS; changed = true; }
        else if (dot(t, dBack) > 1e-9) { pinned.delete(k); init.S[k] = cs - 2 * tolS; changed = true; }
      }
    }
    if (!changed) break;
  }
  const ok = !!F.cur && F.endCost < 1e-12;
  const reason = ok ? null : !F.cur ? "no valid start" : `not converged (cost ${F.endCost.toExponential(1)})`;
  const foam = ok ? G.loops.map((_, i) => outline(C, G, i, F.cur.P, F.cur.S, F.cur.geo, step)) : power;
  const angP = angleStats(C, G, P0, S0, null), angF = ok ? angleStats(C, G, F.cur.P, F.cur.S, F.cur.geo) : null;
  const errOf = outs => Math.max(...outs.map((o, i) => Math.abs(Math.abs(shoelace(o)) - target[i]) / target[i]));
  const comp = outs => outs.map(o => 4 * Math.PI * Math.abs(shoelace(o)) / perimeter(o) ** 2);
  return {
    n, power, foam, ok, reason, convex, state: F && F.cur ? F.state : null, dbg: { NI: F.NI, NW: F.NW, NF: F.NF, why: F.why, pinned: pinned.size, pinsUsed, rounds, corners: C.corners.length }, iterations: F.it, endCost: F.endCost,
    errPower: errOf(power), errFoam: ok ? errOf(foam) : null, angP, angF,
    compPower: comp(power), compFoam: ok ? comp(foam) : null,
    shortestFilm: ok ? Math.min(...F.cur.geo.map(g => g.c)) : null, shortRel: F.cur ? Math.min(...F.cur.geo.map(g => g.c)) / Math.sqrt(C.area / n) : null, why: F.why,
  };
}

// a film as a circular arc with half-angle phi between its vertices (same convention as in foamSolve)
function filmArc(P, f, phi) {
  const u0 = sub(P[f.b], P[f.a]), c = len(u0);
  if (c < 1e-12) return null;
  const u = mul(u0, 1 / c), sn = Math.sin(phi), small = Math.abs(phi) < 1e-4;
  const seg = small ? c * c * phi / 6 : c * c * (2 * phi - Math.sin(2 * phi)) / (8 * sn * sn);
  return { c, phi, kap: 2 * sn / c, seg, arc: small ? c : c * phi / sn, ta: rot(u, -phi), tb: rot(mul(u, -1), phi) };
}

// Straight walls with exact areas on a consistent wall graph: only the areas are solved (junctions and wall points move as
// little as possible, no angle conditions). The safe fallback when the foam does not settle, and a start for one more try.
function cellPolygonOf(C, G, i, P, S) {
  const it = G.loops[i], pts = [];
  for (let k = 0; k < it.length; k++) {
    pts.push(P[it[k].v]);
    if (it[k].next < 0) pts.push(...C.between(S[it[k].v], S[it[(k + 1) % it.length].v]));
  }
  return pts;
}
function areaFit(C, G, target, start = null) {   // start: a valid state (P, S, phi); its walls keep their half-angles
  // Homotopy: begin with the areas the start already has (exact there), move the targets towards the real ones in steps,
  // each solved from the previous solution; a step that fails is halved. The geometry stays valid all the way.
  const n = target.length, sc = Math.sqrt(C.area / n), reg = 1e-3;
  const inner = G.vlist.map((v, k) => v.kind === "inner" ? k : -1).filter(k => k >= 0);
  const wall = G.vlist.map((v, k) => v.kind === "wall" ? k : -1).filter(k => k >= 0);
  const order0 = wall.slice().sort((a, b) => G.vlist[a].s - G.vlist[b].s).join(",");
  const P00 = start ? start.P : G.vlist.map(v => v.p), S00 = start ? start.S : G.vlist.map(v => v.s), phis = start ? start.phi : G.films.map(() => 0);
  const xStart = []; for (const k of inner) xStart.push(...P00[k]); for (const k of wall) xStart.push(S00[k]);
  const N = xStart.length;
  const unpack = x => {
    const P = P00.slice(), S = S00.slice();
    inner.forEach((k, m) => { P[k] = [x[2 * m], x[2 * m + 1]]; });
    wall.forEach((k, m) => { S[k] = x[2 * inner.length + m]; P[k] = C.posAt(S[k]); });
    return { P, S };
  };
  const areasOf = x => {
    const { P, S } = unpack(x), norm = v => ((v % C.L) + C.L) % C.L;
    const ord = wall.slice().sort((a, b) => norm(S[a]) - norm(S[b])), k0 = ord.indexOf(+order0.split(",")[0]);
    if (wall.length && ord.slice(k0).concat(ord.slice(0, k0)).join(",") !== order0) return null;
    for (const k of inner) if (!inside(C.pts, P[k])) return null;
    const areas = G.loops.map((_, i) => shoelace(cellPolygonOf(C, G, i, P, S)));
    for (let m = 0; m < G.films.length; m++) { if (!phis[m]) continue; const g = filmArc(P, G.films[m], phis[m]); if (!g) return null; areas[G.films[m].L] += g.seg; areas[G.films[m].R] -= g.seg; }
    if (areas.some(a => !(a > 0))) return null;
    return { areas, P, S };
  };
  function solveFor(tgt, xInit) {
    let x = xInit.slice(), anchor = x.slice(), lam = 1e-3;
    const evaluate = xx => { const r = areasOf(xx); if (!r) return null; const res = r.areas.map((a, i) => (a - tgt[i]) / tgt[i]); for (let j = 0; j < N; j++) res.push(reg * (xx[j] - anchor[j]) / sc); return { res, ...r }; };
    const cost = e => e ? e.res.reduce((a, r) => a + r * r, 0) : Infinity;
    let cur = evaluate(x);
    if (!cur) return null;
    for (let it = 0; it < 60; it++) {
      anchor = x.slice(); cur = evaluate(x);
      const areaErr = Math.max(...cur.res.slice(0, n).map(Math.abs));
      if (areaErr < 1e-11) break;
      const m = cur.res.length, J = Array.from({ length: m }, () => new Float64Array(N));
      for (let j = 0; j < N; j++) { const h = 1e-7 * sc, xp = x.slice(); xp[j] += h; const e = evaluate(xp); if (!e) continue; for (let r = 0; r < m; r++) J[r][j] = (e.res[r] - cur.res[r]) / h; }
      const A = Array.from({ length: N }, () => new Float64Array(N)), g = new Float64Array(N);
      for (let r = 0; r < m; r++) { const Jr = J[r]; for (let a = 0; a < N; a++) { if (!Jr[a]) continue; g[a] += Jr[a] * cur.res[r]; for (let b = 0; b < N; b++) A[a][b] += Jr[a] * Jr[b]; } }
      let accepted = false;
      for (let tries = 0; tries < 12 && !accepted; tries++) {
        const M = A.map((row, a) => { const r = Float64Array.from(row); r[a] += lam * (row[a] || 1e-12); return r; });
        const d = solve(M, Array.from(g, v => -v)), xn = x.map((v, k) => v + d[k]), en = evaluate(xn);
        if (cost(en) < cost(cur)) { x = xn; cur = en; lam = Math.max(lam / 3, 1e-12); accepted = true; } else lam *= 4;
      }
      if (!accepted) break;
    }
    const fin = evaluate(x);
    return fin ? { x, err: Math.max(...fin.res.slice(0, n).map(Math.abs)), P: fin.P, S: fin.S } : null;
  }
  const a0 = areasOf(xStart);
  if (!a0) return { ok: false };
  let x = xStart, t = 0, dt = 0.25, last = null;
  while (t < 1 && dt > 1 / 512) {
    const tn = Math.min(1, t + dt), tgt = a0.areas.map((a, i) => (1 - tn) * a + tn * target[i]);
    const r = solveFor(tgt, x);
    if (r && r.err < (tn < 1 ? 1e-6 : 1e-9)) { x = r.x; t = tn; last = r; dt = Math.min(0.5, dt * 1.5); } else dt /= 2;
  }
  const ok = t >= 1 && !!last, fin = last || { P: P00, S: S00, err: 1 };
  return { ok, areaErr: ok ? last.err : 1 - t, state: { P: fin.P, S: fin.S, phi: phis.slice(), p: start && start.p ? start.p.slice() : new Array(n).fill(0) } };
}


// A cell drawn smaller by its gutters: every edge moves inwards by half the gutter of the boundary it lies on (gutters[d] for a
// boundary between siblings at depth d, frame for the outer frame), corners are mitred (limited), so neighbours stay apart
// and no border paints over a cell. Returns null when nothing visible remains.
function insetOutline(out, tags, gutters, frame = 0) {
  const cap = 0.12 * Math.sqrt(Math.abs(shoelace(out)));   // a gap never eats more than about a quarter of a tiny cell
  const n = out.length, off = tags.map(t => Math.min(cap, (t < 0 ? frame : gutters[Math.min(t, gutters.length - 1)]) / 2));
  const res = [];
  for (let k = 0; k < n; k++) {
    const p = out[k], a = out[(k - 1 + n) % n], b = out[(k + 1) % n];
    const d1 = [p[0] - a[0], p[1] - a[1]], d2 = [b[0] - p[0], b[1] - p[1]];
    const l1 = Math.hypot(d1[0], d1[1]) || 1e-12, l2 = Math.hypot(d2[0], d2[1]) || 1e-12;
    const n1 = [-d1[1] / l1, d1[0] / l1], n2 = [-d2[1] / l2, d2[0] / l2];   // inward normals of a counter-clockwise outline
    const o1 = off[(k - 1 + n) % n], o2 = off[k];
    // intersection of the two shifted edge lines: p + n1 o1 + s d1 = p + n2 o2 + t d2
    const cr = d1[0] * d2[1] - d1[1] * d2[0];
    let q;
    if (Math.abs(cr) < 1e-9 * l1 * l2) q = [p[0] + (n1[0] + n2[0]) / 2 * (o1 + o2) / 2 * 2 / Math.max(1e-9, Math.hypot(n1[0] + n2[0], n1[1] + n2[1])), p[1] + (n1[1] + n2[1]) / 2 * (o1 + o2) / 2 * 2 / Math.max(1e-9, Math.hypot(n1[0] + n2[0], n1[1] + n2[1]))];
    else {
      const rx = n2[0] * o2 - n1[0] * o1, ry = n2[1] * o2 - n1[1] * o1, s = (rx * d2[1] - ry * d2[0]) / cr;
      q = [p[0] + n1[0] * o1 + s * d1[0], p[1] + n1[1] * o1 + s * d1[1]];
      const mx = 3 * Math.max(o1, o2), dq = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (dq > mx && dq > 0) q = [p[0] + (q[0] - p[0]) * mx / dq, p[1] + (q[1] - p[1]) * mx / dq];
    }
    res.push(q);
  }
  return shoelace(res) > 0 ? res : null;
}


// Point inside a polygon farthest from its boundary (the centre of the largest inscribed circle), by refining a grid of
// cells best-first (after the "polylabel" idea); returns [x, y, distance]. Also the horizontal chord through a point.
function edgeDist(p, poly) {
  let inside = false, d2 = Infinity;
  for (let k = 0, j = poly.length - 1; k < poly.length; j = k++) {
    const a = poly[k], b = poly[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1e-300;
    const u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)), ex = a[0] + u * dx - p[0], ey = a[1] + u * dy - p[1];
    d2 = Math.min(d2, ex * ex + ey * ey);
  }
  return (inside ? 1 : -1) * Math.sqrt(d2);
}
function poleOf(poly, precision = null) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of poly) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  const size = Math.min(x1 - x0, y1 - y0) || 1e-9, prec = precision || size / 60;
  const cell = (x, y, h) => { const d = edgeDist([x, y], poly); return { x, y, h, d, max: d + h * Math.SQRT2 }; };
  const c = centroid(poly);
  let best = cell(c[0], c[1], 0);
  const q = [];
  for (let x = x0; x < x1; x += size) for (let y = y0; y < y1; y += size) q.push(cell(x + size / 2, y + size / 2, size / 2));
  for (let guard = 0; q.length && guard < 4000; guard++) {
    let bi = 0; for (let i = 1; i < q.length; i++) if (q[i].max > q[bi].max) bi = i;
    const cur = q.splice(bi, 1)[0];
    if (cur.d > best.d) best = cur;
    if (cur.max - best.d <= prec) continue;
    const h = cur.h / 2;
    q.push(cell(cur.x - h, cur.y - h, h), cell(cur.x + h, cur.y - h, h), cell(cur.x - h, cur.y + h, h), cell(cur.x + h, cur.y + h, h));
  }
  return [best.x, best.y, Math.max(0, best.d)];
}
function chordAt(poly, p) { // width of the polygon along the horizontal line through p, around p
  const xs = [];
  for (let k = 0, j = poly.length - 1; k < poly.length; j = k++) {
    const a = poly[k], b = poly[j];
    if ((a[1] > p[1]) !== (b[1] > p[1])) xs.push(a[0] + (p[1] - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
  }
  xs.sort((u, v) => u - v);
  for (let i = 0; i + 1 < xs.length; i += 2) if (xs[i] <= p[0] && p[0] <= xs[i + 1]) return [xs[i], xs[i + 1]];
  return [p[0], p[0]];
}

// ---------- public API ----------
// powerCells and ccvt for animating between two layouts (KlangTresor morph, Jörg 06.10.2026: "zwischen Blasen entstehen keine
// Lücken"): the power weights play the part of the pressures; solved once at both ends with the sites fixed (ccvt, maxOuter 0),
// then sites and weights are interpolated – every frame is one power diagram, gap-free, about 5 ms for 351 cells
export { shoelace, centroid, perimeter, inside, makeContainer, layout, tagEdges, insetOutline, poleOf, chordAt, fanCells, stripStart, powerCells, ccvt };

function clean(pts) { // drop repeated points; counter-clockwise
  const out = [];
  for (const p of pts) if (!out.length || len(sub(p, out[out.length - 1])) > 1e-9) out.push(p);
  while (out.length > 2 && len(sub(out[0], out[out.length - 1])) < 1e-9) out.pop();
  return shoelace(out) < 0 ? out.reverse() : out;
}

// Level of the boundary under every edge of a cell outline: an edge on the vessel's boundary keeps the vessel edge's tag (-1 =
// the outer frame, d = a boundary between siblings at depth d), an edge inside the vessel separates siblings at the cell's depth.
function tagEdges(out, vessel, vesselTags, depth) {
  const m = vessel.length, xs = vessel.map(p => p[0]), ys = vessel.map(p => p[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), span = Math.max(Math.max(...xs) - x0, Math.max(...ys) - y0) || 1;
  const G = Math.max(4, Math.ceil(Math.sqrt(m))), cell = span / G, grid = new Map();
  const key = (i, j) => i * 100003 + j;
  for (let k = 0; k < m; k++) { // every vessel edge into the grid cells its bounding box touches
    const a = vessel[k], b = vessel[(k + 1) % m];
    const i0 = Math.floor((Math.min(a[0], b[0]) - x0) / cell), i1 = Math.floor((Math.max(a[0], b[0]) - x0) / cell);
    const j0 = Math.floor((Math.min(a[1], b[1]) - y0) / cell), j1 = Math.floor((Math.max(a[1], b[1]) - y0) / cell);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const q = key(i, j); if (!grid.has(q)) grid.set(q, []); grid.get(q).push(k); }
  }
  const tol = 1e-6 * span;
  return out.map((a, t) => {
    const b = out[(t + 1) % out.length], mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const cand = grid.get(key(Math.floor((mid[0] - x0) / cell), Math.floor((mid[1] - y0) / cell))) || [];
    for (const k of cand) {
      const p = vessel[k], q = vessel[(k + 1) % m], d = sub(q, p), L2 = dot(d, d) || 1e-300;
      const u = Math.max(0, Math.min(1, dot(sub(mid, p), d) / L2)), r = sub(mid, add(p, mul(d, u)));
      if (len(r) < tol) return vesselTags[k];
    }
    return depth;
  });
}

// A tree from table rows. levels: column indices (0-based) top first, or "row" for one leaf per row (its name from leafName);
// an empty entry takes the name of the level above (filling to the right, so every row reaches every level). weight: the
// column holding the row's weight (null: every row counts 1); rows without a positive weight are left out.
export function buildTree(rows, { levels, weight = null, leafName = null } = {}) {
  const root = { name: "all", kids: new Map(), count: 0, depth: -1, parent: null };
  rows.forEach((r, ri) => {
    const wt = weight == null ? 1 : +r[weight];
    if (!(wt > 0)) return;
    let node = root, last = "(none)";
    root.count += wt;
    levels.forEach((lv, d) => {
      let key, name;
      if (lv === "row") { name = (leafName != null && r[leafName] && r[leafName].trim()) || `row ${ri + 1}`; key = `${name}\u0000${ri}`; }
      else { const v = (r[lv] || "").trim(); name = v || last; key = name; }
      if (lv !== "row") last = name;
      if (!node.kids.has(key)) node.kids.set(key, { name, key, kids: new Map(), count: 0, depth: d, parent: node, filled: lv !== "row" && !(r[lv] || "").trim(), row: lv === "row" ? ri : undefined });
      node = node.kids.get(key); node.count += wt;
    });
  });
  return root;
}

// Lays out every node inside the cell of its parent. Returns all nodes with .outline (math coordinates, counter-clockwise),
// statistics per vessel, and the leaves. Members too small to show (area below minArea at the full layout, or below minShare
// of their vessel) are merged into one node "n small" per vessel (decision of 04.10.2026): the vessel keeps its exact sum.
// gutters (widths per boundary level, in layout units) with compensate > 0: after a layout, every leaf's weight is scaled by
// ideal / visible area (visible = drawn smaller by its gutters) and the layout is repeated, so that the visible areas, not
// the cells under the gaps, are proportional to the weights. Original weights stay in .count0.
export function layoutTree(root, opts = {}) {
  const { gutters = null, compensate = 0 } = opts;
  if (!gutters || !compensate) return layoutOnce(root, opts);
  const leavesOf = n => n.kids.size ? [...n.kids.values()].flatMap(leavesOf) : [n];
  const all = leavesOf(root);
  for (const k of all) k.count0 = k.count0 ?? k.count;
  const W = opts.width || 1000, H = opts.height || 700, total0 = all.reduce((a, k) => a + k.count0, 0);
  const recount = n => { if (n.kids.size) n.count = [...n.kids.values()].reduce((a, k) => a + recount(k), 0); return n.count; };
  // every pass starts from the cells of the pass before (their centroids as start points): the weights change only a little,
  // so the foam settles at once and stays in place; a pass that leaves more vessels unsettled than the one before is not
  // taken – the earlier cells stand, with their small area error, rather than slices or fans (Prophane 05.10.2026)
  const failedOf = r => r.stats.filter(s => !s.single && !s.ok).length;
  const snapshot = r => [r, failedOf(r), new Map([root, ...r.nodes].map(n => [n, { outline: n.outline, tags: n.tags, pending: n.pending }]))];
  let res = null, seeds = opts.seeds || null, kept = null;
  for (let pass = 0; pass <= compensate; pass++) {
    res = layoutOnce(root, { ...opts, seeds, onProgress: pass === compensate ? opts.onProgress : null });
    res.passes = pass + 1;
    if (kept && failedOf(res) > kept[1]) {
      for (const [n, g] of kept[2]) Object.assign(n, g);
      res = kept[0]; res.passRejected = pass + 1;
      break;
    }
    kept = snapshot(res);
    if (pass === compensate) break;
    seeds = {};
    for (const n of res.nodes) if (n.outline && n.outline.length > 2) seeds[nodeKey(n)] = centroid(n.outline);
    // the gutters take some area in any case; what matters is that every leaf's visible share of the visible total equals its
    // weight share. New target = wanted visible area + what the gutters take from this cell now (area units; only ratios matter)
    const tot = recount(root), vis = all.map(k => k.outline && k.tags ? insetOutline(k.outline, k.tags, gutters) : null);
    const va = vis.map(v => v ? shoelace(v) : 0), visTotal = va.reduce((a, v) => a + v, 0);
    all.forEach((k, i) => {
      if (!k.outline || !k.tags) return;
      const want = k.count0 / total0 * visTotal, cellArea = k.count / tot * W * H;
      k.count = Math.max(0.25 * want, want + (cellArea - va[i]));
    });
    recount(root);
  }
  // the reported visible-area error, and shares from the original weights
  res.visibleError = visibleShareError(all, gutters, total0);
  return res;
}

// ---------- parallel layout (Jörg 05.10.2026: "ab der ersten ebene könnte man doch treemaps massiv parallelisieren") ----------
// Every cell depends only on its vessel and its members' weights, so subtrees can be laid out apart. A coordinator lays out the
// top of the tree and hands every subtree small enough to a helper the moment its cell stands; a helper holds the same tree
// (built from the same rows), lays out its subtree and sends back the cells; the coordinator puts them in by key and orders
// nodes and leaves as the sequential layout does. Every cell is computed from the same inputs, so the result is the same,
// bit for bit, as layoutTree's.

// a helper's index of its tree, the bundles of small members included (made as the sequential layout makes them)
export function indexTree(root, { width = 1000, height = 700, minArea = 0, minShare = 0 } = {}) {
  const ctx = { root, total: root.count, W: width, H: height, minArea, minShare }, byKey = new Map(), leaves = new Map();
  (function walk(n) { const kids = shownOf(n, ctx); n.shown = kids.length ? kids : n.shown; for (const k of kids) { byKey.set(nodeKey(k), k); if (!k.kids.size) leaves.set(nodeKey(k), k); walk(k); } })(root);
  const weight = new Map();   // leaves below a node: the measure of a task's size
  (function cnt(n) { let c = n.kids.size ? 0 : 1; for (const k of n.kids.values()) c += cnt(k); weight.set(n, c); return c; })(root);
  for (const n of byKey.values()) if (n.small) weight.set(n, n.small.reduce((a, k) => a + (weight.get(k) || 1), 0));
  return { byKey, leaves, ctx, root, weight };
}
// a helper's part: the cells below one node, its outline and edge tags given
// onSpawn(key, outline, tags): a big member handed back the moment its cell stands, not at the end of the part – else it
// would wait for all its small siblings, and the longest chain of the tree would grow
export function layoutSubtree(root, index, key, outline, tags, opts, limit = Infinity, onSpawn = null) {
  const node = index.byKey.get(key);
  if (!node) throw new Error(`no node ${key}`);
  node.outline = outline; node.tags = tags;
  const res = layoutOnce(root, { ...opts, start: node, onProgress: null, defer: k => (index.weight.get(k) || 1) > limit,
    onDefer: onSpawn ? k => onSpawn(nodeKey(k), k.outline, k.tags) : null });
  return { geo: res.nodes.map(n => [nodeKey(n), n.outline, n.tags]), deferred: onSpawn ? [] : res.deferred.map(nodeKey),
    stats: res.stats.map(st => { const { node: sn, ...rest } = st; return { ...rest, key: nodeKey(sn) }; }) };
}
// the weights of a pass, for the helpers (compensation changes them between passes): every node's weight as the coordinator
// has it – summing the leaves again in another order would differ in the last bit, and the foam would make other cells
export function leafCounts(index) { const c = { "": index.root.count }; for (const [k, n] of index.byKey) if (!n.small) c[k] = n.count; return c; }
export function setLeafCounts(root, index, counts) {
  root.count = counts[""];
  for (const [k, n] of index.byKey) if (!n.small && counts[k] != null) n.count = counts[k];
  // a bundle "n small" is summed where its parent is laid out (shownOf); a helper may start at the bundle itself, so its sums
  // are made here, in the same order
  for (const n of index.byKey.values()) if (n.small) {
    n.count = n.small.reduce((a, k) => a + k.count, 0);
    n.count0 = n.small.reduce((a, k) => a + (k.count0 ?? k.count), 0);
  }
}
// pool: { size, beginPass({counts, seeds}), run({key, outline, tags}, weight) -> Promise<{geo, stats}> }
export async function layoutTreeParallel(root, opts, pool) {
  const { gutters = null, compensate = 0 } = opts;
  const leavesOf = n => n.kids.size ? [...n.kids.values()].flatMap(leavesOf) : [n];
  const all = leavesOf(root);
  for (const k of all) k.count0 = k.count0 ?? k.count;
  const index = indexTree(root, opts);   // the bundles, decided from the original weights as in the sequential pass 0
  // a task this small is laid out whole by one helper; finer grains let a big chain find a free helper sooner (opts.grain)
  const limit = Math.max(4, all.length / ((opts.grain || 8) * pool.size));
  const onePass = async (seeds, last) => {
    pool.beginPass({ counts: leafCounts(index), seeds });
    const handed = [], statsByKey = new Map();
    let done = 0, open = 0, finish;
    const allDone = new Promise(r => { finish = r; });
    const report = () => { if (last && opts.onProgress) opts.onProgress(done, res.vesselsTotal); };
    const spawned = (k, o, t) => { const m = index.byKey.get(k); m.outline = o; m.tags = t; submit(m); };
    const submit = n => { open++; handed.push(n);
      pool.run({ key: nodeKey(n), outline: n.outline, tags: n.tags, limit }, index.weight.get(n) || 1, spawned).then(part => {
        for (const [k, o, t] of part.geo) { const m = index.byKey.get(k); if (m) { m.outline = o; m.tags = t; } }
        for (const st of part.stats) statsByKey.set(st.key, { ...st, node: index.byKey.get(st.key) });
        done += part.stats.filter(st => !st.single).length; report();
        for (const k of part.deferred) submit(index.byKey.get(k));
        if (--open === 0) finish(); }); };
    const res = layoutOnce(root, { ...opts, seeds, defer: () => true, onDefer: submit, onProgress: null });
    for (const st of res.stats) statsByKey.set(nodeKey(st.node), st);
    done += res.stats.filter(st => !st.single).length; report();
    if (open) await allDone;
    // the members as the sequential layout orders them: by the weights of this pass
    for (const n of handed) (function order(m) { const kids = shownOf(m, index.ctx); if (kids.length) { m.shown = kids; kids.forEach(order); } })(n);
    // nodes, leaves and statistics in the sequential order (depth first, members largest first)
    const nodes = [], leaves = [], stats = [];
    if (statsByKey.has("")) stats.push(statsByKey.get(""));
    (function walk(n) { for (const k of n.shown || []) { nodes.push(k); if (!k.kids.size) leaves.push(k); else { const st = statsByKey.get(nodeKey(k)); if (st) stats.push(st); walk(k); } } })(root);
    return { root, nodes, leaves, stats, skipped: 0, ms: res.ms, width: res.width, height: res.height };
  };
  if (!gutters || !compensate) return onePass(opts.seeds || null, true);
  const W = opts.width || 1000, H = opts.height || 700, total0 = all.reduce((a, k) => a + k.count0, 0);
  const recount = n => { if (n.kids.size) n.count = [...n.kids.values()].reduce((a, k) => a + recount(k), 0); return n.count; };
  const failedOf = r => r.stats.filter(st => !st.single && !st.ok).length;
  const snapshot = r => [r, failedOf(r), new Map([root, ...r.nodes].map(n => [n, { outline: n.outline, tags: n.tags, pending: n.pending }]))];
  let res = null, seeds = opts.seeds || null, kept = null;
  for (let pass = 0; pass <= compensate; pass++) {
    res = await onePass(seeds, pass === compensate);
    res.passes = pass + 1;
    if (kept && failedOf(res) > kept[1]) { for (const [n, g] of kept[2]) Object.assign(n, g); res = kept[0]; res.passRejected = pass + 1; break; }
    kept = snapshot(res);
    if (pass === compensate) break;
    seeds = {};
    for (const n of res.nodes) if (n.outline && n.outline.length > 2) seeds[nodeKey(n)] = centroid(n.outline);
    const tot = recount(root), vis = all.map(k => k.outline && k.tags ? insetOutline(k.outline, k.tags, gutters) : null);
    const va = vis.map(v => v ? shoelace(v) : 0), visTotal = va.reduce((a, v) => a + v, 0);
    all.forEach((k, i) => {
      if (!k.outline || !k.tags) return;
      const want = k.count0 / total0 * visTotal, cellArea = k.count / tot * W * H;
      k.count = Math.max(0.25 * want, want + (cellArea - va[i]));
    });
    recount(root);
  }
  res.visibleError = visibleShareError(all, gutters, total0);
  return res;
}

// deviation of the leaves' visible shares (drawn smaller by its gutters) from its weight share
export function visibleShareError(leaves, gutters, total0) {
  const va = leaves.map(k => { const v = k.outline && k.tags ? insetOutline(k.outline, k.tags, gutters) : null; return v ? shoelace(v) : 0; });
  const vt = va.reduce((a, v) => a + v, 0), t0 = total0 ?? leaves.reduce((a, k) => a + (k.count0 ?? k.count), 0);
  const e = leaves.map((k, i) => { const want = (k.count0 ?? k.count) / t0 * vt; return Math.abs(va[i] - want) / want; }).sort((a, b) => a - b);
  return { median: e[e.length >> 1] || 0, p95: e[Math.floor(e.length * 0.95)] || 0, max: e[e.length - 1] || 0, gutterShare: 1 - vt / leaves.reduce((a, k) => a + (k.outline ? shoelace(k.outline) : 0), 0) };
}

// the members a node shows, largest first: members too small to show (or to compute next to the large ones) go into one
// sub-vessel "n small" with the exact sum; inside it they are laid out again, so they appear when zoomed in. Decided once from
// the original weights. A function of its own, so that a parallel layout makes exactly the same bundles (Prophane 05.10.2026)
function shownOf(node, { root, total, W, H, minArea, minShare }) {
  let kids = [...node.kids.values()].sort((a, b) => (b.count0 ?? b.count) - (a.count0 ?? a.count));   // fixed by the original weights
  if (!kids.length || !(minArea > 0 || minShare > 0) || node.small) return kids;
  if (!node.mergePlan) {
    const c0 = k => k.count0 ?? k.count, total0 = root.count0 ?? total, n0 = node.count0 ?? kids.reduce((a, k) => a + c0(k), 0);
    node.mergePlan = kids.filter(k => c0(k) / total0 * W * H < minArea || c0(k) / n0 < minShare);
  }
  const tiny = node.mergePlan;
  if (tiny.length >= 2 && tiny.length < kids.length) {
    const agg = node.aggNode || (node.aggNode = { name: `${tiny.length} small`, kids: new Map(tiny.map((k, i) => [i, k])), depth: tiny[0].depth,
      parent: node, small: tiny, filled: false });
    for (const k of tiny) k.inSmall = agg;
    agg.count = tiny.reduce((a, k) => a + k.count, 0);
    agg.count0 = tiny.reduce((a, k) => a + (k.count0 ?? k.count), 0);
    kids = kids.filter(k => !tiny.includes(k)).concat(agg).sort((a, b) => (b.count0 ?? b.count) - (a.count0 ?? a.count));
  }
  return kids;
}

// a node's key, unique among siblings: its names from the root down
export const nodeKey = n => { const p = []; for (let k = n; k && k.depth >= 0; k = k.parent) p.unshift(k.key ?? k.name); return p.join("\u0001"); };

function layoutOnce(root, { width = 1000, height = 700, method = "foam", minArea = 0, minShare = 0, budgetMs = Infinity,
  onProgress = null, outline = null, seeds = null, arrange = "big-centre", maxDepth = Infinity, defer = null, onDefer = null, start = null } = {}) {
  // defer(node): a subtree handed to a helper (onDefer(node) once its cell stands); start: a node with outline and tags set,
  // laid out from there down (a helper's part) – both for layoutTreeParallel   // maxDepth: recursion steps to lay out (the foaming animation goes step by step)
  const keyOf = nodeKey;
  const seedOf = k => { if (!seeds) return null; if (seeds[keyOf(k)]) return seeds[keyOf(k)]; if (k.small) { const ps = k.small.map(m => seeds[keyOf(m)]).filter(Boolean); return ps.length ? [ps.reduce((a, p) => a + p[0], 0) / ps.length, ps.reduce((a, p) => a + p[1], 0) / ps.length] : null; } return seeds[keyOf(k)] || null; };
  const t0 = Date.now(), stats = [], nodes = [], leaves = [];
  let vesselsTotal = 0, vesselsDone = 0, skipped = 0;
  const deferred = [];
  const total = root.count, W = width, H = height;
  const ctx = { root, total, W, H, minArea, minShare };
  // the vessels as the layout will meet them: bundles of small members are vessels too, members merged into a bundle are not
  // (counted over the tree's own children the parallel layout reported "690 of 669 groups"; Prophane 06.10.2026)
  (function count(n) { const kids = shownOf(n, ctx); if (kids.length > 1) vesselsTotal++; for (const k of kids) count(k); })(root);
  function visit(node, C, lvl = 0) {
    const kids = shownOf(node, ctx);
    if (!kids.length) { leaves.push(node); return; }
    node.shown = kids;
    if (Date.now() - t0 > budgetMs) { skipped++; for (const k of kids) { k.outline = null; } return; }
    const step = Math.min(3, Math.max(1e-4, Math.sqrt(C.area) / 80)), t = Date.now();
    const s0 = seeds ? kids.map(seedOf) : arrange !== "big-centre" && kids.length > 1 ? arrangedStart(C, kids.length, arrange) : null;   // start points: from a swarm, or the chosen arrangement
    // start points from an earlier layout move with their vessel: shifted by the vessel's own move (its old centre is its seed),
    // and a point still outside is pulled towards the centre until inside – else a moved parent would throw away the start
    // points of everything below it, and the cells there would jump (Prophane 05.10.2026: cells keep their places between measures)
    let s1 = s0;
    if (seeds && s0 && s0.every(Boolean)) {
      const old = seeds[keyOf(node)], now = centroid(C.pts);
      if (old) s1 = s0.map(p => [p[0] + now[0] - old[0], p[1] + now[1] - old[1]]);
      s1 = s1.map(p => { let q = p; for (let i = 0; i < 30 && !inside(C.pts, q); i++) q = [now[0] + (q[0] - now[0]) * 0.8, now[1] + (q[1] - now[1]) * 0.8]; return q; });
    }
    const useSeeds = s1 && s1.every(p => p && inside(C.pts, p));
    const res = kids.length === 1 ? { single: true, ok: true, foam: [C.pts] } : layout(C, kids.map(k => k.count / node.count * C.area), step, method, useSeeds ? s1 : null);
    if (kids.length > 1) { vesselsDone++; if (onProgress) onProgress(vesselsDone, vesselsTotal, node); }
    stats.push({ depth: kids[0].depth, node, n: kids.length, single: !!res.single, ok: res.ok, ms: Date.now() - t, err: res.errFoam,
      ang: res.angF, comp: res.compFoam, compPower: res.compPower, shortRel: res.shortRel, reason: res.reason, via: res.via, routes: res.chordReason });
    const vesselTags = node.tags || C.pts.map(() => -1);
    kids.forEach((k, i) => {
      k.outline = clean(res.foam[i]);
      k.tags = tagEdges(k.outline, C.pts, vesselTags, node.small ? k.depth + 1 : k.depth);   // inside "n small": finer gaps
      nodes.push(k);
      if (!k.kids.size) leaves.push(k);
      else if (defer && defer(k)) { deferred.push(k); if (onDefer) onDefer(k); }
      else if (lvl < maxDepth) visit(k, makeContainer(k.outline), lvl + 1);
      else { k.pending = true; leaves.push(k); }   // laid out in a later step
    });
  }
  if (start) visit(start, makeContainer(start.outline));
  else {
    const frame = outline || [[0, 0], [W, 0], [W, H], [0, H]];
    root.outline = frame; root.tags = frame.map(() => -1);
    visit(root, makeContainer(frame));
  }
  return { root, nodes, leaves, stats, skipped, deferred, vesselsTotal, ms: Date.now() - t0, width: W, height: H };
}

// Numbers per level: vessels, solved, fallbacks, largest area error against the ideal share, angles, compactness 4 pi A / P^2.
export function summarize(result, depthCount) {
  const { root, nodes, stats, width: W, height: H } = result, ideal = k => k.count / root.count * W * H;
  const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
  const out = [];
  for (let d = 0; d < depthCount; d++) {
    const st = stats.filter(s => s.depth === d), real = st.filter(s => !s.single), ok = real.filter(s => s.ok);
    const ns = nodes.filter(k => k.depth === d && k.outline);
    out.push({ level: d + 1, cells: ns.length, vessels: st.length, solved: ok.length, fellBack: real.length - ok.length,
      maxAreaError: Math.max(0, ...ns.map(k => Math.abs(Math.abs(shoelace(k.outline)) - ideal(k)) / ideal(k))),
      maxAngleJunction: Math.max(0, ...ok.filter(s => s.ang).map(s => s.ang.innerMax)), maxAngleWall: Math.max(0, ...ok.filter(s => s.ang).map(s => s.ang.wallMax)),
      compactness: mean(ok.flatMap(s => s.comp || [])), compactnessStraight: mean(real.flatMap(s => s.compPower || [])),
      merged: ns.filter(k => k.small).reduce((a, k) => a + k.small.length, 0), ms: st.reduce((a, s) => a + s.ms, 0) });
  }
  return out;
}
