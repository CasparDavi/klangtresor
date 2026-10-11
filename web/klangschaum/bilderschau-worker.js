/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   Die Bilderschau haengt im Worker (bilderschau.js): erst die Areale mit foamtree (nur die oberste Ebene),
   dann die Bilder; je Runde wird nachgeteilt. Ein, zwei Sekunden Rechnen sollen die Seite nicht anhalten.
   Ein: { gruppen, W, H, seeds, opt, kopfBreite }  Aus: { res } oder { fehler }. */
import { buildTree, layoutTree } from "./foamtree.js";
import { haengenMitSchaum } from "./bilderschau.js";

self.onmessage = (e) => {
  const { gruppen, W, H, seeds, opt, kopfBreite } = e.data;
  try {
    const lege = (gew) => {
      if (gruppen.length < 2) return [{ name: gruppen[0].name, poly: [[0, 0], [W, 0], [W, H], [0, H]] }];
      const rows = gruppen.map(g => ({ gruppe: g.name, w: String(gew.get(g.name)) }));
      const res = layoutTree(buildTree(rows, { levels: ["gruppe"], weight: "w" }), { width: W, height: H, seeds });
      return res.nodes.filter(n => n.depth === 0 && n.outline).map(n => ({ name: n.name, poly: n.outline.map(p => [p[0], H - p[1]]) }));   /* y nach unten */
    };
    const res = haengenMitSchaum(gruppen, W, H, lege, { ...opt, kopfBreite: (n) => (kopfBreite && kopfBreite[n]) || 8 * n.length });
    self.postMessage({ res });
  } catch (err) {
    self.postMessage({ fehler: String(err && err.stack || err) });
  }
};
