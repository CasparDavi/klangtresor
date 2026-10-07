/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   Caspar_Ds Schaum-Engine „foamtree", unverändert übernommen am 06.10.2026 aus
   ~/Prophane/tools/foam-lab/engine/ (Stand dort: 06.10.2026, die neueste der drei Fassungen;
   die anderen: Treemapper/engine/, eingebettet im Prophane-Viewer). Geändert ist nur die
   Endung .mjs -> .js (der Server liefert .js als JavaScript) samt den Importpfaden.
   Änderungen gehören in die Quelle zurück, nicht nur hierher.
   GEAENDERT AM 07.10.2026 (KlangTresor, noch nicht in foam-lab): renderSVG und placeLabel kennen labelLeading (Zeilenabstand
   in em, Vorgabe 1,1 wie bisher) und labelDrop (Namensblock um diesen Anteil des Innenkreisradius tiefer, Vorgabe 0) -
   Caspar_D: „den Text etwas unter die optische Mitte verschieben und die Zeilen ggf etwas näher zusammenrücken lassen.
   Ein Durchschuß in der Grösse des i/i-Punkt Abstandes war immer ganz gut" und „immer noch drauf achten, dass der Text
   nichts Feldfremdes überlappt". Ohne die Optionen zeichnet render.js genau wie die Quelle.
   DAZU (1.0.52): labelInk – Einzelbuchstaben-Kästen statt Zeilenkasten (Caspar_D: „Eigentlich bin ich kein freund von
   Textboxen, weil BEreiche ohne Ober oder Unterlängen verschenkter Platz sind"), siehe placeLabel; labelUnten(k) – Zellen
   mit Bild: der Name so tief wie möglich, nicht groesser als bisher (untenSetzen); labelName(k) – der gezeigte Name (Vorgabe
   k.name). Ohne die Optionen wie bisher. */
// SVG for a laid-out tree (foamtree.layoutTree): leaves filled, borders thicker the higher the level, names of the upper
// levels. Dark ground. Leaves of a level that was filled from the level above (no own name there) are lighter and hatched,
// with names in italics; members merged into "n small" are grey. Math coordinates (y up) are flipped to the screen.

import { shoelace, centroid, insetOutline, poleOf, chordAt, inside } from "./foamtree.js";

const HUES = [205, 25, 140, 280, 50, 340, 175, 95, 245, 0, 310, 65];
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function chainOf(k) { const c = []; for (let n = k; n && n.depth >= 0; n = n.parent) if (!n.twig) c.unshift(n); return c; }   // twig bundles of the tree view are left out
const indexIn = n => n.colourIndex ?? (n.parent.shown || [...n.parent.kids.values()].sort((a, b) => b.count - a.count)).indexOf(n);

// The level that carries the hues: the top level on which no single branch holds more than 80 % (as the main categories in the
// Prophane viewer); e.g. phyla rather than domains when bacteria dominate.
export function hueDepthOf(result) {
  const total = result.root.count0 ?? result.root.count;
  for (let d = 0; d < 6; d++) {
    const at = result.nodes.filter(k => k.depth === d && !k.small && !k.twig);
    if (!at.length) return Math.max(0, d - 1);
    if (Math.max(...at.map(k => (k.count0 ?? k.count) / total)) <= 0.8) return d;
  }
  return 0;
}
// default colour: one hue per group on the hue level, shades by the levels below (and above, for the few cells there)
export function defaultColour(k, hueDepth = 0) {
  const c = chainOf(k), hd = Math.min(hueDepth, c.length - 1);
  const h = HUES[Math.max(0, indexIn(c[hd])) % HUES.length];
  const v = d => c[d] ? Math.max(0, indexIn(c[d])) : 0;
  return `hsl(${(h + (v(hd + 1) % 5 - 2) * 7 + 360) % 360} ${36 + (v(hd + 2) % 4) * 7}% ${30 + (v(hd + 1) * 7 + v(hd + 3) * 5) % 26 + (v(hd + 4) % 3) * 2}%)`;
}

export { insetOutline };

// CIE lightness L* (0 black … 100 white) of a CSS colour: #rgb, #rrggbb, rgb(), hsl() – for the contrast rule of the names
export function lightnessOf(css) {
  let r, g, b, m;
  const c = String(css).trim();
  if ((m = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i))) {
    const h = m[1].length === 3 ? [...m[1]].map(x => x + x).join("") : m[1];
    [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  } else if ((m = c.match(/^rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/i))) [r, g, b] = [m[1], m[2], m[3]].map(x => +x / 255);
  else if ((m = c.match(/^hsla?\(([\d.]+)(?:deg)?[ ,]+([\d.]+)%[ ,]+([\d.]+)%/i))) {
    const h = +m[1] / 360, sat = +m[2] / 100, l = +m[3] / 100, q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat, p = 2 * l - q;
    const t = x => { x = (x + 1) % 1; return x < 1 / 6 ? p + (q - p) * 6 * x : x < 1 / 2 ? q : x < 2 / 3 ? p + (q - p) * (2 / 3 - x) * 6 : p; };
    [r, g, b] = [t(h + 1 / 3), t(h), t(h - 1 / 3)];
  } else return 50;
  const lin = x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  const Y = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return Y > 216 / 24389 ? 116 * Math.cbrt(Y) - 16 : Y * 24389 / 27;
}

// Punkt im Vieleck ODER auf seinem Rand (Abstand zu einer Kante hoechstens eps) - inside() allein entscheidet Randpunkte zufaellig.
function imOderAufRand(poly, p, eps) {
  if (inside(poly, p)) return true;
  for (let k = 0; k < poly.length; k++) {
    const a = poly[k], b = poly[(k + 1) % poly.length], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
    const t = L > 0 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)) : 0;
    if (Math.hypot(a[0] + t * dx - p[0], a[1] + t * dy - p[1]) <= eps) return true;
  }
  return false;
}

// A label inside a cell: at the centre of its largest inscribed circle, as large as the horizontal width there and the circle
// allow (text width estimated at 0.56 em per character), on one or two lines, whichever gives the larger font. In user
// units of the layout; null if it would be smaller than minSize.
export function placeLabel(poly, text, { maxSize = Infinity, minSize = 0, maxLines = 2, measure = null, fit = false, leading = 1.1, drop = 0, huelle = null, ink = null, unten = false, startSize = null, kursiv = false } = {}) {
  const [px, py, r] = poleOf(poly), [xa, xb] = chordAt(poly, [px, py]);
  if (ink && fit && unten) return untenSetzen(poly, huelle, text, { px, py, r, xa, xb, maxSize, minSize, maxLines, leading, drop, ink, startSize, kursiv });
  if (ink && fit) return tinteSetzen(poly, huelle, text, { px, py, r, xa, xb, maxSize, minSize, maxLines, leading, drop, ink, kursiv });
  const cx = (Math.max(xa, px - 3 * r) + Math.min(xb, px + 3 * r)) / 2, width = 0.92 * (Math.min(xb, px + 3 * r) - Math.max(xa, px - 3 * r));
  // width of a line in em: measured with the real font where the page offers it (measure), else estimated at 0.56 em a character
  const ems = t => measure ? measure(t) : 0.56 * t.length;
  const one = Math.min(width / ems(text), 1.4 * r, maxSize);
  let lines = [text], size = one;
  // more lines where that gives a clearly larger font (Jörg 05.10.2026: "ggf zeilenumbruch in der zelle, wenn das platz schafft"):
  // the words split into k lines with the shortest longest line; the block's height limits the font by the inscribed circle
  const words = text.split(" ");
  for (let k = 2; k <= Math.min(maxLines, words.length); k++) {
    if (k === 2 && text.length <= 14) continue;
    const split = bestSplit(words, k), longest = Math.max(...split.map(ems));
    const s = Math.min(width / longest, (k === 2 ? 0.75 : 0.48) * r, maxSize);
    if (s > size * 1.15) { lines = split; size = s; }
  }
  // the whole text block inside the cell (Jörg 05.10.: "Pseudomonadota passt nicht in die Zelle"): the width was only checked
  // on the one horizontal line through the centre; with fit, the corners and edge midpoints of every line's box must lie in
  // the cell, else the font shrinks step by step
  // the glyphs reach 0.65 em above and below a line's middle (ascenders, descenders), italics a little wider than measured;
  // a margin of 0.08 em all round, and points along every edge of each line's box (Jörg 05.10.: "no assignment überlappt
  // auch rechts die grenze")
  /* labelDrop (07.10.2026): der Block sitzt um drop * r tiefer (Mathematik: y nach oben); passt er dort nicht, erst halb so tief,
     dann auf dem Pol - erst danach wird die Schrift kleiner. Die Pruefung umfasst jede Zeile mit ihrem Zeilenabstand. */
  const tiefen = drop > 0 ? [drop * r, drop * r / 2, 0] : [0];
  const passt = (y) => lines.flatMap((t, j) => {
      const w = ems(t) * size * 1.04 + 0.16 * size, mid = y + ((lines.length - 1) / 2 - j) * leading * size, y0 = mid + 0.73 * size, y1 = mid - 0.73 * size;
      const xs = [0, 0.25, 0.5, 0.75, 1].map(f => cx - w / 2 + f * w);
      return [...xs.map(x => [x, y0]), ...xs.map(x => [x, y1]), [cx - w / 2, mid], [cx + w / 2, mid]]; }).every(p => inside(poly, p) && (!huelle || inside(huelle, p)));
  let y = py - tiefen[0];
  if (fit) for (let i = 0; i < 40 && size >= minSize; i++) {
    const t = tiefen.find(d => passt(py - d));
    if (t !== undefined) { y = py - t; break; }
    size *= 0.92;
  }
  return size >= minSize ? { x: cx, y, size, lines, leading } : null;
}
/* EINZELBUCHSTABEN-KAESTEN (labelInk, 07.10.2026; Caspar_D aus der Spotbeschriftung auf 2D-Gelen: „Ist in der Ecke einer
   Zelle unten noch platz für unterlngen, kann es daneben schon nicht mehr passen. Eigentlich bin ich kein freund von
   Textboxen, weil BEreiche ohne Ober oder Unterlängen verschenkter Platz sind"). Statt eines Kastens je Zeile (1,46 em hoch)
   gilt die Tinte: ink.runs(zeile, groesse) liefert die Tintenkaesten der Buchstaben in em, benachbarte gleicher Hoehe schon
   zusammengefasst ([x0, x1, ueber, unter] ab dem linken Rand der Zeile und der Grundlinie), gemessen von der Seite in der
   Groesse, in der der Name erscheint. Jeder Kasten bekommt 0,1 em Rand und muss ganz in der eingerueckten Zelle und im echten
   Umriss liegen - geprueft als Kantenschnitt (keine Zellkante beruehrt den Kasten, seine Mitte liegt innen), nicht mehr an
   Stichpunkten, zwischen denen eine konkave Spitze eindringen konnte. Zeilenabstand fest (leading, die Studio-Definition),
   Grundlinien aus Ober- und Unterlaenge der Schrift (ink.o, ink.u). Lage: zuerst drop * r unter dem Pol, dann in Schritten
   von 0,06 r hoeher (bis ueber den Pol), tiefer und seitlich - erst wenn keine dieser Lagen passt, wird die Schrift kleiner. */
const TINTE_RAND = 0.1;
/* JEDE ZEILE AUF IHRE SEHNE (Caspar_D, 07.10.2026: „horizontal die Zeilen so gegeneinander verschieben, das es auch bei nicht
   symmetrischen Zellen gut passt"): als Lage probiert wird nicht nur eine gemeinsame Mitte, sondern auch je Zeile die Mitte der
   breitesten waagerechten Strecke durch die Zelle auf der Hoehe dieser Zeile - in einer schiefen Zelle folgen die Zeilen der Form. */
function breitesteMitte(poly, yy, sonst) {
  const xs = [];
  for (let k = 0, j = poly.length - 1; k < poly.length; j = k++) {
    const a = poly[k], b = poly[j];
    if ((a[1] > yy) !== (b[1] > yy)) xs.push(a[0] + (yy - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
  }
  xs.sort((u, v) => u - v);
  let best = null;
  for (let i = 0; i + 1 < xs.length; i += 2) if (!best || xs[i + 1] - xs[i] > best[1] - best[0]) best = [xs[i], xs[i + 1]];
  return best ? (best[0] + best[1]) / 2 : sonst;
}
// die Tintenkaesten eines Namensblocks je Zeile, relativ zu (Zeilenmitte x, Blockmitte y), Mathematik (y nach oben)
function tintenBlock(lines, size, ink, leading, m, kursiv = false) {
  const n = lines.length, zeilen = [];
  let u = Infinity, ob = -Infinity, links0 = Infinity, rechts0 = -Infinity;
  lines.forEach((t, j) => {
    const l = ink.runs(t, size, kursiv), mid = ((n - 1) / 2 - j) * leading * size, g = mid - (ink.o - ink.u) / 2 * size, links = -l.w * size / 2, kaesten = [];
    let rechtsBis = -Infinity;
    for (const [a0, a1, o2, un] of l.runs) {
      const k = [links + (a0 - m) * size, g - (un + m) * size, links + (a1 + m) * size, g + (o2 + m) * size];
      k.neu = k[0] > rechtsBis;            // beginnt eine neue zusammenhaengende Gruppe (keine Ueberlappung mit den Kaesten davor)
      rechtsBis = Math.max(rechtsBis, k[2]);
      kaesten.push(k); u = Math.min(u, k[1]); ob = Math.max(ob, k[3]); links0 = Math.min(links0, k[0]); rechts0 = Math.max(rechts0, k[2]);
    }
    zeilen.push({ mid, kaesten });
  });
  return { lines, zeilen, u, ob, links: links0, rechts: rechts0, leer: !zeilen.some(z => z.kaesten.length) };
}
/* Passt der Block? Keine nahe Kante beruehrt einen Kasten, und die Kaesten liegen innen. Ueberlappen Kaesten einer Zeile (mit
   ihrer Luft), bilden sie eine zusammenhaengende Gruppe: beruehrt keine Kante, liegt die Gruppe ganz innen oder ganz aussen -
   ein Innen-Test je Gruppe genuegt (der Strahltest kostet alle Ecken). Die Gruppen stehen in tintenBlock (k.neu); vorher hiess
   es pauschal „ab 0,15 em Luft je Zeile einer" - der Schwachstellenagent fand: ein Leerzeichen ist in SF 0,29-0,32 em breit,
   ein doppeltes oder U+3000 reisst die Zeile auf, und ein Wort jenseits einer Zellwand galt als innen. */
function blockPasst(b, xs, y, poly, nP, huelle, nH) {
  return b.zeilen.every((z, j) => z.kaesten.every((k) => {
    const [a, c, e, d] = k, x = xs[j], innen = k.neu;
    return rechteckFrei(nP, x + a, y + c, x + e, y + d) && (!innen || inside(poly, [x + (a + e) / 2, y + (c + d) / 2]))
      && (!huelle || (rechteckFrei(nH, x + a, y + c, x + e, y + d) && (!innen || inside(huelle, [x + (a + e) / 2, y + (c + d) / 2]))));
  }));
}
function rechteckFrei(nahe, x0, y0, x1, y1) {
  for (const [a, b] of nahe) if (streckeTrifft(a, b, x0, y0, x1, y1)) return false;
  return true;
}
const gesetzt = (b, xs, y, size, leading, ink) => ({ x: xs[(xs.length - 1) >> 1], xs, y, size, lines: b.lines, leading, tinte: { o: ink.o, u: ink.u } });
function tinteSetzen(poly, huelle, text, { px, py, r, xa, xb, maxSize, minSize, maxLines, leading, drop, ink, kursiv = false }) {
  const m = TINTE_RAND, x0c = Math.max(xa, px - 3 * r), x1c = Math.min(xb, px + 3 * r), cx = (x0c + x1c) / 2, W = x1c - x0c;
  const s0 = Math.min(maxSize, 2 * r), breit = t => ink.runs(t, s0, kursiv).w + 2 * m;
  // obere Grenze je Zeilenzahl: Breite der Sehne durch den Pol; ein Block, breiter als hoch, ist hoechstens 2 r hoch
  const bis = (k, laengste) => Math.min(W / laengste, 2 * r / ((k - 1) * leading + ink.o + ink.u + 2 * m), maxSize);
  let lines = [text], size = bis(1, breit(text));
  const words = text.split(" ");
  for (let k = 2; k <= Math.min(maxLines, words.length); k++) {
    if (k === 2 && text.length <= 14) continue;
    const split = bestSplit(words, k), s = bis(k, Math.max(...split.map(breit)));
    if (s > size * 1.15) { lines = split; size = s; }
  }
  let xl = Infinity, xr = -Infinity; for (const p of poly) { xl = Math.min(xl, p[0]); xr = Math.max(xr, p[0]); }
  const st = 0.06 * r, tx = cx, ty = py - drop * r, lagen = [];
  for (let k = -3; k <= 3; k++) for (let q = -2; q <= 2; q++) lagen.push([q, k, (k > 0 ? 1 : 1.5) * Math.abs(k) + 1.3 * Math.abs(q)]);
  lagen.sort((a, b) => a[2] - b[2]);
  for (let i = 0; i < 40 && size >= minSize; i++, size *= 0.94) {
    const b = tintenBlock(lines, size, ink, leading, m, kursiv);
    if (b.leer) return null;
    const fenster = [xl, ty + b.u - 3 * st, xr, ty + b.ob + 3 * st];
    const nP = naheKanten(poly, fenster), nH = huelle ? naheKanten(huelle, fenster) : null;
    for (const [q, k] of lagen) {
      const y = ty + k * st, gemeinsam = lines.map(() => tx + q * st);
      if (blockPasst(b, gemeinsam, y, poly, nP, huelle, nH)) return gesetzt(b, gemeinsam, y, size, leading, ink);
      if (q === 0 && lines.length > 1) {
        const je = b.zeilen.map(z => breitesteMitte(poly, y + z.mid, tx));
        if (blockPasst(b, je, y, poly, nP, huelle, nH)) return gesetzt(b, je, y, size, leading, ink);
      }
    }
  }
  return null;
}
/* NAMEN UNTER DEM BILD (labelInk mit unten, 07.10.2026). Caspar_D: „Ziel war nicht, die Zelle maximal auszufüllen sondern
   mehr Platz zum verrücken zu gewinnen, sodass das visuelle Zentrum des Artworks möglichst wenig verdeckt wird und der Text
   etwas atmen kann" - „lass möglichst viel vom Bild übrig und schieb den TExt so weit wie möglich nach unen und lass ihn
   trotzdem gut lesbar sein" - „ganze Breite at y position wäre schon gut". Also: die Schrift so gross wie bisher (der
   Zeilenkasten-Satz, gemessen wie 1.0.51 - nie groesser), die Tintenkaesten mit 0,3 em Luft; gesucht wird von der Unterkante
   der Zelle aufwaerts, auf jeder Hoehe mittig auf der Sehne dort und zuerst einzeilig, dann zwei-, dann dreizeilig (die ganze
   Breite der Zelle auf dieser Hoehe); die tiefste Lage, die passt, gewinnt. Passt die Groesse nirgends, wird sie kleiner.
   Ohne Bild (Treemaps, Zellen ohne Cover) bleibt der Fuellmodus tinteSetzen - Caspar_D: „merke dir die maximalgroße
   Beschriftung für die Treemaps ohne Bilder, wo ausschliesslich die Grösse der Zellen eine Rolle spielt". */
const TINTE_LUFT_BILD = 0.3;
/* Gemessen wird die OBERKANTE des Namens (07.10.2026, erster Versuch: die tiefste Unterkante gewann - ein schmaler Zweizeiler
   kam in runden Zellen tiefer hinunter als ein breiter Einzeiler, reichte aber hoeher ins Bild): je Fassung (jeder Umbruch in
   eine, zwei oder drei Zeilen) die tiefste Lage, die passt; es gewinnt die tiefste Oberkante, bei Gleichstand (5 % der Schrift)
   die mit weniger Zeilen. Flache Fassungen zuerst - eine hoehere wird nur noch probiert, wenn sie die beste Oberkante
   ueberhaupt unterbieten kann. Zweiter Versuch: dann wurden kurze Namen zweizeilig („Nur Reden", „Time Out" - der schmale
   Block kam tiefer), gemeint war aber „ganze Breite at y position". Darum: jede weitere Zeile muss die Oberkante um mehr als
   eine Zeilenhoehe tiefer bringen, und bis 14 Zeichen nie zwei Zeilen (die Hausregel des Fuellmodus; drei bleiben erlaubt -
   „Wer / hatte / das?" passt in der bisherigen Groesse nur so). */
function alleUmbrueche(words, maxLines) {
  const out = [[words.join(" ")]], w = words.length;
  if (maxLines >= 2 && words.join(" ").length > 14) for (let c = 1; c < w; c++) out.push([words.slice(0, c).join(" "), words.slice(c).join(" ")]);
  if (maxLines >= 3 && w >= 3) {   // dreizeilig nur die sechs ausgewogensten (kuerzeste laengste Zeile) - sonst bis zu 55 Fassungen
    const drei = [];
    for (let c = 1; c < w; c++) for (let d = c + 1; d < w; d++) drei.push([words.slice(0, c).join(" "), words.slice(c, d).join(" "), words.slice(d).join(" ")]);
    out.push(...drei.filter(umbruchErlaubt).sort((a, b) => Math.max(...a.map(t => t.length)) - Math.max(...b.map(t => t.length))).slice(0, 6));
  }
  return out.filter(umbruchErlaubt);
}
function untenSetzen(poly, huelle, text, o) {
  const { px, maxSize, minSize, maxLines, leading, drop, ink, startSize, kursiv } = o;
  // die bisherige Groesse: der Zeilenkasten-Satz - oder vorgegeben (startSize, das Glasfeld des Plakats rechnet sie selbst)
  const alt = startSize ? { size: startSize } : placeLabel(poly, text, { maxSize, minSize, maxLines, measure: ink.breite, fit: true, leading, drop, huelle });
  if (!alt) return tinteSetzen(poly, huelle, text, o);   // der Zeilenkasten fand keinen Platz - dann so gross, wie die Tinte erlaubt
  const m = TINTE_LUFT_BILD, fassungen = alleUmbrueche(text.split(" ").filter(Boolean), maxLines);
  let y0 = Infinity, y1 = -Infinity, xl = Infinity, xr = -Infinity;
  for (const p of poly) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); xl = Math.min(xl, p[0]); xr = Math.max(xr, p[0]); }
  for (let i = 0, size = alt.size; i < 40 && size >= minSize; i++, size *= 0.94) {
    const bloecke = fassungen.map(lines => tintenBlock(lines, size, ink, leading, m, kursiv)).filter(b => !b.leer)
      .sort((a, b) => (a.ob - a.u) - (b.ob - b.u) || a.lines.length - b.lines.length);
    if (!bloecke.length) return null;
    const schritt = Math.max(0.01 * (y1 - y0), 0.06 * size), gleich = 0.05 * size, zeile = leading * size;
    let best = null;
    for (const b of bloecke) {
      const extra = (b.lines.length - 1) * zeile;                          // jede weitere Zeile zaehlt eine Zeilenhoehe
      const grenze = best ? best.wert - gleich - extra : y1;               // so hoch darf die Oberkante hoechstens liegen
      if (y0 + (b.ob - b.u) > grenze) continue;                          // kann die beste Fassung nicht schlagen
      const probe = (y) => {
        const reihe = [xl, y + b.u, xr, y + b.ob], nP = naheKanten(poly, reihe), nH = huelle ? naheKanten(huelle, reihe) : null;
        const je = b.zeilen.map(z => breitesteMitte(poly, y + z.mid, px)), mitte = breitesteMitte(poly, y + (b.u + b.ob) / 2, px);
        return [je, b.lines.map(() => mitte), b.lines.map(() => px)].find(xs => blockPasst(b, xs, y, poly, nP, huelle, nH));
      };
      // grob in vierfachen Schritten aufwaerts, dann fein zurueck: die tiefste Lage auf einen Schritt genau
      const start = y0 - b.u, grob = 4 * schritt;
      for (let y = start; y + b.ob <= grenze + grob; y += grob) {
        const yy = Math.min(y, grenze - b.ob);
        if (!probe(yy)) { if (yy < y) break; continue; }
        let gefunden = { y: yy, xs: probe(yy) };
        for (let f = Math.max(start, yy - grob + schritt); f < yy - 1e-9; f += schritt) { const xs = probe(f); if (xs) { gefunden = { y: f, xs }; break; } }
        best = { b, xs: gefunden.xs, y: gefunden.y, wert: gefunden.y + b.ob + extra };
        break;
      }
    }
    if (best) return gesetzt(best.b, best.xs, best.y, size, leading, ink);
  }
  /* nirgends Platz mit 0,3 em Luft: wie ohne Bild setzen, aber nicht groesser als bisher - sonst fehlte der Name ganz (der
     Schwachstellenagent fand „Glas Hydra" mit alter Groesse 4,08 - unter minSize / 0,94 gab es nur einen Versuch) */
  return tinteSetzen(poly, huelle, text, { ...o, maxSize: Math.min(maxSize, alt.size) });
}
// die Kanten eines Vielecks, deren Huellkasten das Fenster [x0, y0, x1, y1] beruehrt
function naheKanten(P, [x0, y0, x1, y1]) {
  const out = [];
  for (let k = 0; k < P.length; k++) {
    const a = P[k], b = P[(k + 1) % P.length];
    if (Math.max(a[0], b[0]) >= x0 && Math.min(a[0], b[0]) <= x1 && Math.max(a[1], b[1]) >= y0 && Math.min(a[1], b[1]) <= y1) out.push([a, b]);
  }
  return out;
}
// beruehrt die Strecke a-b das Rechteck? (Liang-Barsky)
function streckeTrifft(a, b, x0, y0, x1, y1) {
  const dx = b[0] - a[0], dy = b[1] - a[1]; let t0 = 0, t1 = 1;
  const seite = (p, q) => {
    if (p === 0) return q >= 0;
    const t = q / p;
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
    return true;
  };
  return seite(-dx, a[0] - x0) && seite(dx, x1 - a[0]) && seite(-dy, a[1] - y0) && seite(dy, y1 - a[1]);
}
/* UMBRUCHREGELN (Caspar_D, 07.10.2026: „dass "..." einzelbuchstaben oder - Zahlen auf neuer Zeile, bindestriche am
   zeilenanfang nicht erlaubt sind"): eine zweite oder dritte Zeile ist nie nur „…"/„...", nie nur ein Buchstabe, nie nur eine
   Zahl (auch „v2", „'25") und beginnt nie mit einem Strich - „Ich erwarte dich – / Track 1" statt „… dich / – Track 1". */
function umbruchErlaubt(lines) {
  return lines.every((t, j) => j === 0 || !(/^(\.{2,}|…)$/.test(t) || /^\p{L}$/u.test(t) || /^['’]?v?\d+([.,]\d+)?$/i.test(t) || /^[-–—]/.test(t)));
}
// the words in k lines, the longest line as short as possible (every way to cut, words are few)
function bestSplit(words, k) {
  let best = null, bestLen = Infinity;
  const go = (start, left, acc) => {
    if (left === 1) { const all = [...acc, words.slice(start).join(" ")], m = Math.max(...all.map(t => t.length)); if (m < bestLen && umbruchErlaubt(all)) { bestLen = m; best = all; } return; }
    for (let e = start + 1; e <= words.length - left + 1; e++) go(e, left - 1, [...acc, words.slice(start, e).join(" ")]);
  };
  go(0, k, []);
  return best || [words.join(" ")];
}

export function renderSVG(result, { scale = 1, pad = 20, title = "", lines = [], colourOf = defaultColour, labelDepth = 1, strokes = [3.2, 2.0, 1.2, 0.7, 0.35], gutters = null, leafLabels = false, smallLabel = null, cushion = 0, labelLevel = null, labelSizes = [4, 24], measureText = null, labelLeading = 1.1, labelDrop = 0, labelInk = null, labelUnten = null, labelName = null } = {}) {
  const { width: W, height: H, nodes, leaves } = result;
  if (colourOf === defaultColour && result.root) { const hd = hueDepthOf(result); colourOf = k => defaultColour(k, hd); }
  const top = pad + (title ? 26 : 0);
  const X = p => (pad + p[0] * scale).toFixed(2), Y = p => (top + (H - p[1]) * scale).toFixed(2);
  const d = o => "M" + o.map(p => X(p) + "," + Y(p)).join("L") + "Z";
  const sw = k => strokes[Math.min(k, strokes.length - 1)];
  const isFilled = k => chainOf(k).some(n => n.filled);
  const cush = cushion ? `<filter id="cushion" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="${(cushion * scale).toFixed(2)}" result="b"/><feDiffuseLighting in="b" surfaceScale="${(2.2 * cushion * scale).toFixed(2)}" diffuseConstant="1" lighting-color="#ffffff" result="l"><feDistantLight azimuth="225" elevation="50"/></feDiffuseLighting><feComposite in="SourceGraphic" in2="l" operator="arithmetic" k1="0.55" k2="0.52" k3="0" k4="0" result="c"/><feComposite in="c" in2="SourceAlpha" operator="in"/></filter>` : "";
  let body = `<defs>${cush}<pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#121417" stroke-opacity="0.35" stroke-width="1.6"/></pattern></defs>`;
  body += cushion ? `<g filter="url(#cushion)">` : "";
  leaves.forEach((k, i) => {
    if (!k.outline) return;
    if (gutters) { // gaps instead of lines: the cell itself is drawn smaller, nothing paints over it
      const o = k.tags ? insetOutline(k.outline, k.tags, gutters.map(g => g / scale)) : k.outline;
      if (!o) return;
      body += `<path d="${d(o)}" fill="${colourOf(k)}" stroke="none" data-i="${i}"${isFilled(k) ? ' fill-opacity="0.72"' : ""}/>`;
      if (isFilled(k)) body += `<path d="${d(o)}" fill="url(#hatch)" stroke="none" pointer-events="none"/>`;
      return;
    }
    body += `<path d="${d(k.outline)}" fill="${colourOf(k)}" stroke="#121417" stroke-width="${sw(k.depth)}" stroke-linejoin="round" data-i="${i}"${isFilled(k) ? ' fill-opacity="0.72"' : ""}/>`;
    if (isFilled(k)) body += `<path d="${d(k.outline)}" fill="url(#hatch)" stroke="none" pointer-events="none"/>`;
  });
  body += cushion ? "</g>" : "";
  const maxDepth = Math.max(0, ...nodes.map(k => k.depth));
  if (!gutters) for (let dd = maxDepth; dd >= 0; dd--) for (const k of nodes) if (k.depth === dd && k.outline && !leaves.includes(k)) body += `<path d="${d(k.outline)}" fill="none" stroke="#121417" stroke-width="${sw(dd)}" stroke-linejoin="round" pointer-events="none"/>`;
  const textAt = (lab, cls, extra) => {   // one or two centred lines
    if (lab.tinte) {   // Einzelbuchstaben-Kaesten: ein <text> je Name, jede Zeile auf ihrer Grundlinie wie in placeLabel gerechnet
      const fs = lab.size * scale, x = X([lab.x, 0]), n = lab.lines.length, xj = j => lab.xs ? X([lab.xs[j], 0]) : x;
      const zeile = (t, j) => `<tspan x="${xj(j)}" y="${(top + (H - (lab.y + ((n - 1) / 2 - j) * lab.leading * lab.size - (lab.tinte.o - lab.tinte.u) / 2 * lab.size)) * scale).toFixed(2)}">${esc(t)}</tspan>`;
      return `<text${cls ? ` class="${cls}"` : ""} x="${x}" font-size="${fs.toFixed(2)}" text-anchor="middle" pointer-events="none"${extra}>${lab.lines.map(zeile).join("")}</text>`;
    }
    const fs = lab.size * scale, x = X([lab.x, 0]), lead = lab.leading || 1.1, y0 = top + (H - lab.y) * scale - (lab.lines.length - 1) * fs * lead / 2;
    return lab.lines.map((t, i) => `<text${cls ? ` class="${cls}"` : ""} x="${x}" y="${(y0 + i * fs * lead).toFixed(2)}" font-size="${fs.toFixed(2)}" text-anchor="middle" dominant-baseline="middle" pointer-events="none"${extra}>${esc(t)}</text>`).join("");
  };
  if (labelLevel != null) { // the names of one level only, each as large as its cell allows (Jörg 05.10.2026: a slider for
    // the level; largest 24, smallest 4; white without an edge, 30 % transparent), on up to three lines; "n small" bundles stay unnamed
    // contrast (Jörg 05.10.: "wenn der untergrund zu hell wird, switche den text zu schwarz"): the colour of the leaf right under
    // the name decides; L* >= 58 takes black, as the viewer's icicles do; both 30 % transparent, so they only lighten or darken
    const leavesBelow = k => k.kids && k.kids.size ? [...(k.shown || k.kids.values())].flatMap(leavesBelow) : [k];
    const visible = k => (gutters && k.tags && insetOutline(k.outline, k.tags, gutters.map(g => g / scale))) || k.outline;
    for (const k of nodes) {
      if (k.depth !== labelLevel || !k.outline || k.small) continue;
      /* (07.10.2026) Das um die Fugen eingerueckte Vieleck entartet in winzigen Zellen (Fugen breiter als der Platz) - dann
         „passt" ein Name scheinbar und ragt in Fuge und Nachbarzelle. Darum zusaetzlich gegen den echten Umriss pruefen, und ein
         eingeruecktes Vieleck, das nicht klar im Umriss liegt, gilt nicht: lieber kein Name als einer ueber fremdem Feld.
         „Im Umriss" schliesst seinen Rand ein (1.0.51): am Bildrahmen wird nicht eingerueckt (Rahmenfuge 0), die Ecken liegen dort
         GENAU auf dem Umriss, und der Strahltest inside() zaehlt solche Randpunkte je nach Lage hinein oder hinaus - in 1.0.50
         verloren so die Randzellen oben und rechts ihre Namen (Caspar_D: „Randzellen haben oft keinen Namen obwohl sie gross
         genug wären"). */
      const vis = visible(k), aV = Math.abs(shoelace(vis)), aK = Math.abs(shoelace(k.outline)), eps = 1e-6 * Math.sqrt(aK);
      if (vis !== k.outline && !(aV > 0 && aV < aK && vis.every(p => imOderAufRand(k.outline, p, eps)))) continue;
      const lab = placeLabel(vis, (labelName ? labelName(k) : k.name).slice(0, 60).trim(), { maxSize: labelSizes[1] / scale, minSize: labelSizes[0] / scale, maxLines: 3, measure: measureText, fit: true, leading: labelLeading, drop: labelDrop, huelle: k.outline, ink: labelInk, unten: !!(labelUnten && labelUnten(k)), kursiv: isFilled(k) });
      if (!lab) continue;
      const below = leavesBelow(k).filter(x => x.outline), under = below.find(x => inside(x.outline, [lab.x, lab.y])) || below[0] || k;
      const ink = lightnessOf(colourOf(under)) >= 58 ? "#000000" : "#ffffff";
      body += textAt(lab, "level-label", ` fill="${ink}" fill-opacity="0.7"${isFilled(k) ? ' font-style="italic"' : ""}`);
    }
  }
  if (leafLabels && labelLevel == null) for (const k of leaves) { // names of the leaves, sized to the cell; the page shows them only when zoomed in
    if (!k.outline || k.depth <= labelDepth) continue;
    const lab = placeLabel(k.outline, k.name.slice(0, 40), { maxSize: 14 / scale, measure: measureText, fit: true });
    if (lab) body += textAt(lab, "leaf-label", ` fill="#f4f4f2"${isFilled(k) ? ' font-style="italic"' : ""}`);
  }
  // group names: the top level always, deeper ones only where their box is free; a child named like its group is skipped
  const placed = [];
  const boxOf = lab => { const w = Math.max(...lab.lines.map(t => t.length)) * 0.56 * lab.size, h = lab.lines.length * 1.1 * lab.size; return [lab.x - w / 2, lab.y - h / 2, lab.x + w / 2, lab.y + h / 2]; };
  const hits = b => placed.some(q => b[0] < q[2] && q[0] < b[2] && b[1] < q[3] && q[1] < b[3]);
  const groups = nodes.filter(k => k.depth <= labelDepth && k.outline && (!k.small || smallLabel) && !(k.parent && k.parent.name === k.name && k.parent.depth >= 0))
    .sort((a, b) => a.depth - b.depth || Math.abs(shoelace(b.outline)) - Math.abs(shoelace(a.outline)));
  for (const k of labelLevel != null ? [] : groups) {
    const name = k.small && smallLabel ? smallLabel(k.small.length) : k.name.slice(0, 48);
    const lab = placeLabel(k.outline, name, { maxSize: (k.depth === 0 ? 24 : 15) / scale, minSize: 8 / scale, measure: measureText, fit: true });
    if (!lab) continue;
    const box = boxOf(lab);
    if (k.depth > 0 && hits(box)) continue;
    placed.push(box);
    body += textAt(lab, "", ` fill="#f4f4f2" stroke="#121417" stroke-width="${k.depth === 0 ? 3 : 2.2}" paint-order="stroke" font-weight="${k.depth === 0 ? 500 : 400}"${isFilled(k) ? ' font-style="italic"' : ""}${k.depth === 0 ? "" : ' opacity="0.88"'}`);
  }
  const w = W * scale + 2 * pad, h = H * scale + top + pad + lines.length * 16;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w.toFixed(0)}" height="${h.toFixed(0)}" viewBox="0 0 ${w.toFixed(0)} ${h.toFixed(0)}" font-family="IBM Plex Sans Condensed, Helvetica, sans-serif">
<rect width="100%" height="100%" fill="#121417"/>
${title ? `<text x="${pad}" y="${pad + 14}" fill="#979ca3" font-size="14">${esc(title)}</text>` : ""}
${body}
${lines.map((l, i) => `<text x="${pad}" y="${(top + H * scale + 18 + i * 16).toFixed(0)}" fill="#c9cbc7" font-size="12">${esc(l)}</text>`).join("\n")}
</svg>`;
}
