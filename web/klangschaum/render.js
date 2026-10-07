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
   nichts Feldfremdes überlappt". Ohne die Optionen zeichnet render.js genau wie die Quelle. */
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
export function placeLabel(poly, text, { maxSize = Infinity, minSize = 0, maxLines = 2, measure = null, fit = false, leading = 1.1, drop = 0, huelle = null } = {}) {
  const [px, py, r] = poleOf(poly), [xa, xb] = chordAt(poly, [px, py]);
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
// the words in k lines, the longest line as short as possible (every way to cut, words are few)
function bestSplit(words, k) {
  let best = null, bestLen = Infinity;
  const go = (start, left, acc) => {
    if (left === 1) { const all = [...acc, words.slice(start).join(" ")], m = Math.max(...all.map(t => t.length)); if (m < bestLen) { bestLen = m; best = all; } return; }
    for (let e = start + 1; e <= words.length - left + 1; e++) go(e, left - 1, [...acc, words.slice(start, e).join(" ")]);
  };
  go(0, k, []);
  return best || [words.join(" ")];
}

export function renderSVG(result, { scale = 1, pad = 20, title = "", lines = [], colourOf = defaultColour, labelDepth = 1, strokes = [3.2, 2.0, 1.2, 0.7, 0.35], gutters = null, leafLabels = false, smallLabel = null, cushion = 0, labelLevel = null, labelSizes = [4, 24], measureText = null, labelLeading = 1.1, labelDrop = 0 } = {}) {
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
      const lab = placeLabel(vis, k.name.slice(0, 60), { maxSize: labelSizes[1] / scale, minSize: labelSizes[0] / scale, maxLines: 3, measure: measureText, fit: true, leading: labelLeading, drop: labelDrop, huelle: k.outline });
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
