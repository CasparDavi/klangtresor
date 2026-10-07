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
  const { rows, tree, schild } = e.data;
  let { layout } = e.data;
  try {
    /* Plakat „Randlos": erst 0,5 s lang die oberste Ebene mit dem Schild legen und die Lage waehlen, deren Schild in der Ecke liegt
       und dem Plakat im Format am naechsten kommt (schild.js), dann mit deren Startpunkten voll legen */
    let schildInfo = null;
    if (schild) {
      self.postMessage({ type: "progress", schritt: "schild" });
      schildInfo = schildSaat(rows, tree, layout, schild);
      if (schildInfo.seeds) layout = { ...layout, seeds: schildInfo.seeds };
    }
    /* Helfer: halb so viele wie Kerne, hoechstens acht (der Rechner soll nebenher frei bleiben); ohne Unter-Worker der Reihe nach */
    const anzahl = Math.max(1, Math.min(8, Math.floor(((self.navigator && self.navigator.hardwareConcurrency) || 4) / 2)));
    const helfer = typeof Worker !== "undefined" ? () => new Worker(new URL("./grossschaum-helfer.js", import.meta.url), { type: "module" }) : null;
    const res = await grossLegen(rows, tree, { ...layout, onProgress: (done, total, node) => self.postMessage({ type: "progress", done, total, name: node.name }) },
      { helfer, anzahl, melde: (m) => self.postMessage({ type: "progress", ...m }) });
    const summary = summarize(res, tree.levels.length);
    if (schildInfo) summary.schild = { format: schildInfo.format, fuellung: schildInfo.fuellung, ziel: schildInfo.ziel, laeufe: schildInfo.laeufe, ms: schildInfo.ms };
    self.postMessage({ type: "done", res, summary });
  } catch (err) {
    self.postMessage({ type: "error", message: String(err && err.stack || err) });
  }
};
