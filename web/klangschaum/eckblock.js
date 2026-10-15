/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   DER BLOCK IN DER ECKE (Plakat „Randlos", 1.0.58): Lage und Passprobe von Avatar, Legende und Zeilen in der Ecke. Gemeinsam
   für die Suche im Worker (schild.js, mit welchem Anteil und welchen Startpunkten die Ecke den Block fasst) und das Setzen auf
   der Seite (plakat.js, dieselbe Lage, damit gesetzt wird, was geprüft wurde). Ohne Engine - plakat.js lädt nur dies hier. */

/* ECKEN: 'ur' unten rechts, 'ul' unten links, 'or' oben rechts, 'ol' oben links. Schaum-Koordinaten: y nach oben (Mathematik),
   unten heisst y = 0. */
export const ECKEN = ["ur", "ul", "or", "ol"];
export const rechtsVon = (ecke) => ecke[1] === "r", untenVon = (ecke) => ecke[0] === "u";

/* DIE VIERTEL-ACHSE (Caspar_D, 15.10.2026, „ich nehme die Viertel-Lösung"; ersetzt die Zentrierung auf den Sehnen):
   eine gemeinsame senkrechte Achse für den ganzen Block. Jedes Teil - der Avatar als Einheit, jede Zeile, die Legende als ganzer
   Block (plakat.js eckTeile gibt allen ihren Einträgen die Breite des Blocks) - liegt zu drei Vierteln seiner Breite auf der Seite
   der schrägen Schaumgrenze und zu einem Viertel auf der Seite der geraden Blattkante (Ecke rechts: ¾ links der Achse, ¼ rechts;
   Ecke links gespiegelt). Die Achse liegt so, dass das breiteste Teil am Rahmen endet (Schnitt + Abstand: die Luft vor der
   Blattkante). Suche (schild.js) und Setzen (plakat.js) nehmen dieselbe Lage, die Ecke fasst also genau diesen Block. */
export const EIN_VIERTEL = 0.25;
/* Lage des Blocks: Teile { typ: 'kreis', d } | { typ: 'luecke', h } | sonst { w, h } (Zeilen, Legende), von oben nach unten.
   rahmen = Innenkante (Schnitt + Abstand) in Schaum-Einheiten { x0, x1, y0, y1 }; der Block sitzt in dessen Ecke an der
   Viertel-Achse, s vergrößert ihn um den Eckpunkt. Gibt je Teil x0, x1, y0, y1 zurück (y nach oben). */
export function blockLage(block, ecke, rahmen, s = 1) {
  const rechts = rechtsVon(ecke), teile = block.map(t => ({ ...t, w: (t.typ === "kreis" ? t.d : t.w || 0) * s, h: (t.typ === "kreis" ? t.d : t.h || 0) * s }));
  const hoehe = teile.reduce((a, t) => a + t.h, 0), breit = Math.max(0, ...teile.map(t => t.w));
  const achse = rechts ? rahmen.x1 - EIN_VIERTEL * breit : rahmen.x0 + EIN_VIERTEL * breit;
  let y = untenVon(ecke) ? rahmen.y0 + hoehe : rahmen.y1;
  return teile.map(t => { const y1 = y, y0 = y - t.h; y = y0;
    const x0 = rechts ? achse - (1 - EIN_VIERTEL) * t.w : achse - EIN_VIERTEL * t.w;
    return { ...t, x0, x1: x0 + t.w, y0, y1 }; });
}
function innen(p, o) { let c = false; for (let i = 0, j = o.length - 1; i < o.length; j = i++) { const a = o[i], b = o[j];
  if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
// schneidet die Strecke p-q das Rechteck r (auch nur ein Stück davon)? Liang-Barsky
function streckeImRechteck(p, q, r) { let t0 = 0, t1 = 1; const dx = q[0] - p[0], dy = q[1] - p[1];
  for (const [pp, qq] of [[-dx, p[0] - r.x0], [dx, r.x1 - p[0]], [-dy, p[1] - r.y0], [dy, r.y1 - p[1]]]) {
    if (pp === 0) { if (qq < 0) return false; } else { const t = qq / pp; if (pp < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } } }
  return t0 <= t1; }
/* Das umschließende Rechteck des Blocks in seiner Lage (die Bilderschau sperrt es als Wand, plakat.js bilderEcke). */
export function blockRechteck(block, ecke, rahmen, s = 1) {
  const t = blockLage(block, ecke, rahmen, s).filter(q => q.typ !== "luecke" && q.w > 0 && q.h > 0);
  if (!t.length) return null;
  return { x0: Math.min(...t.map(q => q.x0)), x1: Math.max(...t.map(q => q.x1)), y0: Math.min(...t.map(q => q.y0)), y1: Math.max(...t.map(q => q.y1)) };
}
function abstand(c, p, q) { const dx = q[0] - p[0], dy = q[1] - p[1], l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((c[0] - p[0]) * dx + (c[1] - p[1]) * dy) / l2)); return Math.hypot(c[0] - p[0] - t * dx, c[1] - p[1] - t * dy); }
/* Passt der Block (um s vergrößert) samt Luft in den Umriss der Ecke? Rechtecke: alle vier Ecken innen und keine Wand
   schneidet hinein (so auch bei nicht konvexem Umriss); Kreis: Mitte innen und jede Wand mindestens Radius + Luft entfernt. */
export function blockPasst(umriss, block, ecke, rahmen, luft, s = 1) {
  const o = umriss, n = o.length;
  for (const t of blockLage(block, ecke, rahmen, s)) {
    if (t.typ === "luecke" || !(t.w > 0 && t.h > 0)) continue;
    if (t.typ === "kreis") { const c = [(t.x0 + t.x1) / 2, (t.y0 + t.y1) / 2], r = t.w / 2 + luft;
      if (!innen(c, o)) return false; for (let i = 0; i < n; i++) if (abstand(c, o[i], o[(i + 1) % n]) < r) return false; continue; }
    const r = { x0: t.x0 - luft, x1: t.x1 + luft, y0: t.y0 - luft, y1: t.y1 + luft };
    for (const p of [[r.x0, r.y0], [r.x1, r.y0], [r.x0, r.y1], [r.x1, r.y1]]) if (!innen(p, o)) return false;
    for (let i = 0; i < n; i++) if (streckeImRechteck(o[i], o[(i + 1) % n], r)) return false;
  }
  return true;
}
/* Die Reserve: der größte Faktor, um den der Block wachsen könnte und noch passt (0, wenn nicht einmal ein Zwanzigstel passt). */
export function blockReserve(umriss, block, ecke, rahmen, luft) {
  if (!umriss || umriss.length < 3 || !blockPasst(umriss, block, ecke, rahmen, luft, 0.05)) return 0;
  let lo = 0.05, hi = 4;
  for (let i = 0; i < 14; i++) { const m = (lo + hi) / 2; if (blockPasst(umriss, block, ecke, rahmen, luft, m)) lo = m; else hi = m; }
  return lo;
}
/* Liegt der Umriss in der Ecke (berührt beide Ränder) und ganz zwischen xMin und xMax (Triptychon: auf der äußeren Tafel)? */
export function inDerEcke(o, ecke, W, H, xMin = 0, xMax = W) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of o) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const eps = 1e-3 * W;
  return (rechtsVon(ecke) ? x1 > W - eps : x0 < eps) && (untenVon(ecke) ? y0 < eps : y1 > H - eps) && x0 >= xMin - eps && x1 <= xMax + eps;
}
