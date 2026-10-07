/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   DAS SCHILD IN DER ECKE (Plakat „Randlos", 07.10.2026). Caspar_D: „ich hätte gern noch eine Randlose Variante mit einer
   fehlenden Ecke im gleichen Format wie das Biold, wo Titel, Legende, Avatar und Name drin stehen" – „die Schildzelle ist eine
   autonome Hierarchieebene, die braucht kein Reißverschluss, sie muß normal Konvex sein" – „120° sieht viel besser aus" –
   „Eigentlich muss es wie ein nahezu ein Rectangle aussehen; kann man solange die obere ebene optimieren, bis das rauskommt, was
   wir wollen, also mehr mal mit verschiedenen Seeds rechnen lassen" – „Zielfunktion ist gleiches Format wie das Plakat" –
   „0,5 Sekunden".
   Das Schild ist ein Areal der obersten Ebene mit einem einzigen Blatt. Die oberste Ebene (Areale + Schild) wird wiederholt
   gelegt (nur sie, maxDepth 0 – Millisekunden je Lauf), jedes Mal mit anderen Startpunkten; der Schaum macht von selbst 120° an
   den Knoten und trifft den Rand senkrecht. Gewertet wird: das Schild liegt unten rechts in der Ecke (berührt beide Ränder),
   sein Format (Breite : Höhe des Hüllkastens) liegt nahe am Ziel (dem Format des Plakats bzw. einer Tafel); bei gleichem
   Format gewinnt, wer seinen Hüllkasten besser füllt. Der erste Kandidat sind die Startpunkte des Auftrags selbst (der
   Klangraum) – liegt das Schild damit schon gut, bleibt der Schaum dem am Schirm am nächsten.
   Versuche in der Werkstatt (80 Startlagen, 70 × 100): 10 verschiedene Endlagen, Format 0,63 … 1,36, Füllung 0,90 … 0,93,
   immer zwei Areal-Nachbarn; 80 Läufe 0,4 s. */
import { buildTree, layoutTree } from "./foamtree.js";

// kleiner, wiederholbarer Zufall (dieselben Daten -> dieselbe Folge von Startlagen)
function zufall(saat) { let z = saat >>> 0 || 1; return () => (z = (Math.imul(z, 1103515245) + 12345) >>> 0) / 4294967296; }
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/* Bewertung einer Lage der obersten Ebene: Infinity, wenn das Schild nicht in der Ecke liegt (oder links von minX beginnt -
   im Triptychon muss es ganz auf der rechten Tafel liegen). */
export function schildWert(res, name, { W, ziel, minX = 0 }) {
  const sch = res.nodes.find(n => n.depth === 0 && n.name === name && n.outline);
  if (!sch) return { wert: Infinity };
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, a = 0;
  const o = sch.outline;
  for (let i = 0; i < o.length; i++) { const p = o[i], q = o[(i + 1) % o.length]; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); a += p[0] * q[1] - q[0] * p[1]; }
  const eps = 1e-3 * W, w = x1 - x0, h = y1 - y0;
  if (!(x1 > W - eps && y0 < eps) || x0 < minX) return { wert: Infinity };   // unten rechts (Mathematik: y nach oben)
  const format = w / h, fuellung = Math.abs(a / 2) / (w * h);
  return { wert: Math.abs(Math.log(format / ziel)) + 0.5 * (1 - fuellung), format, fuellung };
}

/* Die besten Startpunkte der obersten Ebene. rows/tree/layout wie für grossLegen; schild: { name, ziel, ms, minX }.
   Gibt die Startpunkte (nur oberste Ebene, Schlüssel = Arealname) und die Bewertung zurück. */
export function schildSaat(rows, tree, layout, { name, ziel, ms = 500, minX = 0 }) {
  const W = layout.width, H = layout.height, t0 = Date.now();
  /* ohne den Startpunkt der Wurzel (seeds['']): mit ihm versetzt die Engine alle Startpunkte der obersten Ebene um (Mitte des
     Rahmens − Wurzelpunkt), und der volle Lauf landete woanders als der bewertete */
  const basis = { ...(layout.seeds || {}) }; delete basis[""];
  const lauf = (seeds) => layoutTree(buildTree(rows, tree), { ...layout, seeds, maxDepth: 0, onProgress: null });
  const namen = [...buildTree(rows, tree).kids.values()].map(k => k.key ?? k.name);
  const rnd = zufall(hash(namen.join("|") + "|" + rows.length + "|" + W + "x" + H));
  let best = null, laeufe = 0;
  const pruefe = (oben) => {
    laeufe++;
    const res = lauf({ ...basis, ...oben });
    const b = schildWert(res, name, { W, ziel, minX });
    if (b.wert < Infinity && (!best || b.wert < best.wert - 1e-9)) best = { ...b, oben };
  };
  const ecke = () => [W - (0.06 + 0.12 * rnd()) * W, (0.04 + 0.1 * rnd()) * H];
  // 1. der Auftrag selbst (Klangraum), nur das Schild in seine Ecke gesetzt
  if (namen.every(n => n === name || basis[n])) pruefe({ [name]: ecke() });
  // 2. Zufallslagen der obersten Ebene, bis die Zeit um ist
  while (Date.now() - t0 < ms) {
    const oben = {};
    for (const n of namen) oben[n] = n === name ? ecke() : [(0.06 + 0.88 * rnd()) * W, (0.2 + 0.76 * rnd()) * H];
    pruefe(oben);
  }
  if (!best) return { seeds: null, laeufe, ms: Date.now() - t0 };
  /* Startpunkte für den vollen Lauf: oberste Ebene = genau die STARTpunkte des gewählten Laufs (dann wiederholt die oberste
     Ebene ihn; mit den Mitten seiner Endlage als Start entspannte der Schaum im Querformat in eine andere Lage: Format 1,14 statt
     1,47). Darunter die Sterne des Klangraums: die Engine führt sie um (jetzige Mitte − Startpunkt) ihres Areals nach; vorher um
     (Startpunkt − Klangraum-Punkt des Areals) verschoben, landen sie dort, wo sie im Klangraum relativ zu ihrem Areal lagen. */
  const seeds = {};
  for (const [k, p] of Object.entries(basis)) {
    const areal = k.split("\u0001")[0], start = best.oben[areal], alt = basis[areal];
    seeds[k] = k.includes("\u0001") && start && alt ? [p[0] + start[0] - alt[0], p[1] + start[1] - alt[1]] : p;
  }
  Object.assign(seeds, best.oben);
  for (const n of namen) if (!seeds[n] && basis[n]) seeds[n] = basis[n];
  return { seeds, format: best.format, fuellung: best.fuellung, ziel, laeufe, ms: Date.now() - t0 };
}
