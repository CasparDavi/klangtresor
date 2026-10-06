/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   Caspar_Ds Schaum-Engine „foamtree", unverändert übernommen am 06.10.2026 aus
   ~/Prophane/tools/foam-lab/engine/ (Stand dort: 06.10.2026, die neueste der drei Fassungen;
   die anderen: Treemapper/engine/, eingebettet im Prophane-Viewer). Geändert ist nur die
   Endung .mjs -> .js (der Server liefert .js als JavaScript) samt den Importpfaden.
   Änderungen gehören in die Quelle zurück, nicht nur hierher. */
// Runs a layout off the main thread: { rows, tree, layout } in, progress messages and the laid-out tree out.
import { buildTree, layoutTree, summarize } from "./foamtree.js";

self.onmessage = e => {
  const { rows, tree, layout } = e.data;
  try {
    const root = buildTree(rows, tree);
    const res = layoutTree(root, { ...layout, onProgress: (done, total, node) => self.postMessage({ type: "progress", done, total, name: node.name }) });
    self.postMessage({ type: "done", res, summary: summarize(res, tree.levels.length) });
  } catch (err) {
    self.postMessage({ type: "error", message: String(err && err.stack || err) });
  }
};
