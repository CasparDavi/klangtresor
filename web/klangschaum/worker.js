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

self.onmessage = async e => {
  const { rows, tree, layout } = e.data;
  try {
    /* Helfer: halb so viele wie Kerne, hoechstens acht (der Rechner soll nebenher frei bleiben); ohne Unter-Worker der Reihe nach */
    const anzahl = Math.max(1, Math.min(8, Math.floor(((self.navigator && self.navigator.hardwareConcurrency) || 4) / 2)));
    const helfer = typeof Worker !== "undefined" ? () => new Worker(new URL("./grossschaum-helfer.js", import.meta.url), { type: "module" }) : null;
    const res = await grossLegen(rows, tree, { ...layout, onProgress: (done, total, node) => self.postMessage({ type: "progress", done, total, name: node.name }) },
      { helfer, anzahl, melde: (m) => self.postMessage({ type: "progress", ...m }) });
    self.postMessage({ type: "done", res, summary: summarize(res, tree.levels.length) });
  } catch (err) {
    self.postMessage({ type: "error", message: String(err && err.stack || err) });
  }
};
