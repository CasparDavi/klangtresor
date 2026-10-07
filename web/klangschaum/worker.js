/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   Caspar_Ds Schaum-Engine „foamtree", unverändert übernommen am 06.10.2026 aus
   ~/Prophane/tools/foam-lab/engine/ (Stand dort: 06.10.2026, die neueste der drei Fassungen;
   die anderen: Treemapper/engine/, eingebettet im Prophane-Viewer). Geändert ist nur die
   Endung .mjs -> .js (der Server liefert .js als JavaScript) samt den Importpfaden.
   Änderungen gehören in die Quelle zurück, nicht nur hierher. */
// Runs a layout off the main thread: { rows, tree, layout } in, progress messages and the laid-out tree out.
// Seit 1.0.48 (07.10.2026) ueber grossschaum.js: kleine Schaeume genau wie vorher (layoutTree), grosse zweistufige
// (Areale mit mehr als 600 Zellen) in Paketen mit Helfer-Workern und Reissverschluss - das Ergebnis ist derselbe Baum.
import { summarize } from "./foamtree.js";
import { grossLegen } from "./grossschaum.js";
import { schildSaat } from "./schild.js";

self.onmessage = async e => {
  const { tree, schild } = e.data;
  let { layout, rows } = e.data;
  try {
    /* Plakat „Randlos": erst 0,5 s lang die oberste Ebene mit der Ecke legen und die Lage samt dem kleinsten Anteil waehlen, bei
       dem Avatar, Legende und Text mit Luft in die Ecke passen (schild.js), dann mit deren Startpunkten und dem Gewicht voll legen */
    let schildInfo = null;
    if (schild) {
      self.postMessage({ type: "progress", schritt: "schild" });
      schildInfo = schildSaat(rows, tree, layout, schild);
      if (schildInfo.seeds) { layout = { ...layout, seeds: schildInfo.seeds }; rows = schildInfo.rows; }
      else if (schildInfo.eckStart && layout.seeds) layout = { ...layout, seeds: { ...layout.seeds, ...schildInfo.eckStart } };
    }
    /* Helfer: halb so viele wie Kerne, hoechstens acht (der Rechner soll nebenher frei bleiben); ohne Unter-Worker der Reihe nach */
    const anzahl = Math.max(1, Math.min(8, Math.floor(((self.navigator && self.navigator.hardwareConcurrency) || 4) / 2)));
    const helfer = typeof Worker !== "undefined" ? () => new Worker(new URL("./grossschaum-helfer.js", import.meta.url), { type: "module" }) : null;
    const res = await grossLegen(rows, tree, { ...layout, onProgress: (done, total, node) => self.postMessage({ type: "progress", done, total, name: node.name }) },
      { helfer, anzahl, melde: (m) => self.postMessage({ type: "progress", ...m }) });
    const summary = summarize(res, tree.levels.length);
    if (schildInfo) res.eckSuche = summary.schild = { anteil: schildInfo.anteil, geschaetzt: schildInfo.geschaetzt, reserve: schildInfo.reserve, fehlschlag: !!schildInfo.fehlschlag, laeufe: schildInfo.laeufe, ms: schildInfo.ms };
    self.postMessage({ type: "done", res, summary });
  } catch (err) {
    self.postMessage({ type: "error", message: String(err && err.stack || err) });
  }
};
