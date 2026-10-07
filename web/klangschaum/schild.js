/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   DIE ECKE (Plakat „Randlos", 07.10.2026). Caspar_D: „ich hätte gern noch eine Randlose Variante mit einer fehlenden Ecke im
   gleichen Format wie das Biold, wo Titel, Legende, Avatar und Name drin stehen" – „die Schildzelle ist eine autonome
   Hierarchieebene, die braucht kein Reißverschluss, sie muß normal Konvex sein" – „120° sieht viel besser aus" – „kann man
   solange die obere ebene optimieren, bis das rauskommt, was wir wollen, also mehr mal mit verschiedenen Seeds rechnen lassen" –
   „0,5 Sekunden". Dann (1.0.58): „die schildecke wird nicht gezeichnet, sie ist der normale Hintergrund; daraus wird oben der
   Avatar in rundem Beschnitt wie in Suno gezeigt, darunter unten- und rechtsbündig Text" – „versuch mal vorher festzulegen, wie
   gross die Ecke dafür sein muß, ggf das Gewicht etwas vermindern, das kann ja in die Optimierung am Anfang mit einfließen, ob
   nach der ersten Zerlegung das so reinpasst" – „vielleicht definierbar machen in welcher ecke man das gerne hätte".
   Die Ecke ist ein Areal der obersten Ebene mit einem einzigen Blatt. Die oberste Ebene (Areale + Ecke) wird wiederholt gelegt
   (nur sie, maxDepth 0 – Millisekunden je Lauf), jedes Mal mit anderen Startpunkten; der Schaum macht von selbst 120° an den
   Knoten und trifft den Rand senkrecht. Was in die Ecke kommt (Avatar, Legende, Zeilen), steht vorher fest: ein BLOCK aus
   Teilen von oben nach unten, in Druckgröße vermessen (plakat.js), bündig zur gewählten Ecke. Gewertet wird die RESERVE: um
   wie viel man den Block vergrößern könnte, bis ein Teil samt Luft die Wand der Ecke berührt. Erst wird der Anteil der Ecke
   an der Fläche aus dem Block geschätzt, dann gesucht, dann der Anteil so nachgeführt, dass die Reserve knapp über 1 liegt
   (so klein wie möglich, der Block passt mit Luft), beim neuen Anteil weitergesucht und zum Schluss der kleinste passende Anteil
   eingeschachtelt. Das Zielformat (bis 1.0.57: das
   Format des Plakats) entfällt - die Form folgt dem Block.
   Versuche in der Werkstatt (50 × 70, vier Areale, 128 Blätter): Anteil statt 12 % je nach Ecke 6,4 … 8,8 %; der volle Lauf
   mit denselben Startpunkten hielt die Reserve genau (1,03 … 1,19 vor und nach); 76 … 102 Läufe in 0,5 s. */
import { buildTree, layoutTree } from "./foamtree.js";
import { blockLage, blockReserve, inDerEcke, rechtsVon, untenVon } from "./eckblock.js";

// kleiner, wiederholbarer Zufall (dieselben Daten -> dieselbe Folge von Startlagen)
function zufall(saat) { let z = saat >>> 0 || 1; return () => (z = (Math.imul(z, 1103515245) + 12345) >>> 0) / 4294967296; }
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/* Die besten Startpunkte und der kleinste Anteil der Ecke. rows/tree/layout wie für grossLegen (rows samt der Zeile der Ecke);
   ecke: { name, ecke, block, rahmen, luft, ms, xMin, xMax }. Gibt Startpunkte (oberste Ebene = Arealname, darunter die des
   Klangraums nachgeführt), den Anteil, die Zeilen mit dem neuen Gewicht der Ecke und die Reserve zurück. */
export function schildSaat(rows, tree, layout, { name, ecke = "ur", block, rahmen, luft = 0, ms = 500, xMin = 0, xMax = Infinity }) {
  const W = layout.width, H = layout.height, t0 = Date.now(), wKey = tree.weight, lev0 = tree.levels[0];
  const iE = rows.findIndex(r => r[lev0] === name);
  if (iE < 0 || !block || !rahmen) return { seeds: null, laeufe: 0, ms: 0 };
  const summe = rows.reduce((s, r, i) => s + (i === iE ? 0 : (+r[wKey] || 0)), 0);
  const mitAnteil = (a) => rows.map((r, i) => i === iE ? { ...r, [wKey]: String(summe * a / (1 - a)) } : r);
  xMax = Math.min(xMax, W);
  /* ohne den Startpunkt der Wurzel (seeds['']): mit ihm versetzt die Engine alle Startpunkte der obersten Ebene um (Mitte des
     Rahmens − Wurzelpunkt), und der volle Lauf landete woanders als der bewertete */
  const basis = { ...(layout.seeds || {}) }; delete basis[""];
  const umrissVon = (seeds, a) => { const res = layoutTree(buildTree(mitAnteil(a), tree), { ...layout, seeds, maxDepth: 0, onProgress: null });
    const n = res.nodes.find(k => k.depth === 0 && k.name === name && k.outline); return n && n.outline; };
  const namen = [...buildTree(rows, tree).kids.values()].map(k => k.key ?? k.name);
  const rnd = zufall(hash(namen.join("|") + "|" + rows.length + "|" + W + "x" + H + "|" + ecke));
  // Schätzung: Hüllkasten des Blocks samt Abstand zum Rand und Luft, ein Drittel Zuschlag für die gebogenen Wände
  const lage = blockLage(block, ecke, rahmen), bw = Math.max(...lage.map(t => t.x1 - t.x0)), bh = lage.reduce((a, t) => a + t.y1 - t.y0, 0);
  const mx = rechtsVon(ecke) ? W - rahmen.x1 : rahmen.x0, my = untenVon(ecke) ? rahmen.y0 : H - rahmen.y1;
  const maxA = 0.35 * (xMax - xMin) / W;                     // im Triptychon auf die äußere Tafel bezogen
  const klemme = (a) => Math.min(maxA, Math.max(0.02, a));
  let anteil = klemme((bw + mx + luft) * (bh + my + luft) * 1.3 / (W * H));
  const geschaetzt = anteil, ZIEL = 1.08;
  let best = null, laeufe = 0;
  const pruefe = (oben, a) => { laeufe++; const o = umrissVon({ ...basis, ...oben }, a);
    if (!o || !inDerEcke(o, ecke, W, H, xMin, xMax)) return null;
    return { oben, a, reserve: blockReserve(o, block, ecke, rahmen, luft) }; };
  const eckPunkt = () => { const fx = (0.06 + 0.12 * rnd()) * (xMax - xMin), fy = (0.04 + 0.1 * rnd()) * H;
    return [rechtsVon(ecke) ? xMax - fx : xMin + fx, untenVon(ecke) ? fy : H - fy]; };
  const zufallsLage = () => { const oben = {}; for (const n of namen) oben[n] = n === name ? eckPunkt() : [(0.06 + 0.88 * rnd()) * W, (0.06 + 0.88 * rnd()) * H]; return oben; };
  /* eine Runde beim Anteil a bis zur Zeit bis: der Bisherige zuerst (beim neuen Anteil), dann der Auftrag selbst (Klangraum,
     nur die Ecke in ihre Ecke gesetzt - liegt sie damit schon gut, bleibt der Schaum dem am Schirm am nächsten), dann Zufall */
  const runde = (a, bis) => {
    let b = null; const nimm = (r) => { if (r && (!b || r.reserve > b.reserve)) b = r; };
    if (best) nimm(pruefe(best.oben, a));
    else if (namen.every(n => n === name || basis[n])) nimm(pruefe({ [name]: eckPunkt() }, a));
    while (Date.now() - t0 < bis) nimm(pruefe(zufallsLage(), a));
    return b;
  };
  // Runde 1 beim geschätzten Anteil; liegt nie eine Ecke in der Ecke (Block zu groß für die Schätzung), größer weitersuchen
  best = runde(anteil, ms * 0.5);
  if (!best) { anteil = klemme(anteil * 1.5); best = runde(anteil, ms * 0.8); }
  if (best && best.reserve > 0) anteil = klemme(anteil * (ZIEL / best.reserve) ** 2);
  best = runde(anteil, ms) || best;
  /* Zu diesen Startpunkten den kleinsten Anteil einschachteln, bei dem der Block passt (Reserve ≥ 1). Die Reserve springt mit dem
     Anteil (der Schaum legt sich bei anderem Gewicht anders) - das Nachführen mit (Ziel/Reserve)² pendelte (Fallensuche 1.0.58:
     1,44 → 0,67 → 1,44 …) und behielt dann eine viel zu große Ecke; darum Intervallhalbierung zwischen passend und nicht passend. */
  let gut = null, naechst = best;                             // naechst: die größte Reserve, falls nichts passt
  if (best) {
    const probe = (a) => { const r = pruefe(best.oben, a); if (r && (!naechst || r.reserve > naechst.reserve)) naechst = r; return r && r.reserve >= 1 ? r : null; };
    let lo = null;
    if (best.reserve >= 1) { gut = best; for (let i = 0, x = best.a; i < 4; i++) { x = klemme(x * 0.8); if (x >= gut.a - 1e-6) break; const r = probe(x); if (r) gut = r; else { lo = x; break; } } }
    else { lo = best.a; for (let i = 0, x = best.a; i < 8 && x < maxA - 1e-6; i++) { x = klemme(x * 1.25); const r = probe(x); if (r) { gut = r; break; } lo = x; } }
    if (gut && lo != null) for (let i = 0; i < 6; i++) { const m = (lo + gut.a) / 2, r = probe(m); if (r) gut = r; else lo = m; }
  }
  /* Nichts passt (Titel breiter als die Tafel, Legende sehr lang): die Lage mit der größten Reserve nehmen und es melden - das
     Plakat setzt den Block dann verkleinert; liegt gar keine Ecke in der Ecke, bekommt der volle Lauf wenigstens einen Startpunkt
     für sie (ohne ihn verwarf die Engine alle Startpunkte der obersten Ebene, die Ecke landete mitten im Plakat). */
  const wahl = gut || naechst;
  if (!wahl) return { seeds: null, eckStart: { [name]: eckPunkt() }, anteil, geschaetzt, fehlschlag: true, laeufe, ms: Date.now() - t0 };
  best = wahl; anteil = wahl.a;
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
  return { seeds, anteil, geschaetzt, reserve: best.reserve, fehlschlag: !gut, rows: mitAnteil(anteil), laeufe, ms: Date.now() - t0 };
}
