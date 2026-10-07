/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   DIE MALMASCHINE DES RANDS (Plakat „Randlos", 07.10.2026): rechnet die Streifen des gemalten Rands (rand.js) abseits der
   Oberfläche und gibt sie als fertige Bilder zurück. Nachricht { id, auftrag, teile, typ = 'image/jpeg', qualitaet = 0.92 }:
   auftrag wie für randStreifen ohne teil, teile z. B. ['oben', 'unten', 'links', 'rechts']. Unterwegs { id, fortschritt } (0..1,
   etwa alle 5 % eines Streifens), am Ende { id, streifen: [{ teil, x, y, w, h, blob }] } (Lage in mm auf der Seite), bei einem
   Fehler { id, fehler }. Ein Streifen ohne Fläche (sehr kleine Seite, die Streifen oben und unten treffen sich) kommt mit
   blob null zurück. Die Vorbereitung (Farbläufe, Bahnen, Blüten, Tabellen) teilen sich die Streifen eines Auftrags in rand.js. */
import { randStreifen } from './rand.js';

self.onmessage = async (e) => {
  const { id, auftrag, teile, typ = 'image/jpeg', qualitaet = 0.92 } = e.data || {};
  try {
    if (!auftrag || !Array.isArray(teile) || !teile.length) throw new Error('rand-worker: auftrag und teile fehlen');
    const streifen = [], n = teile.length;
    for (let k = 0; k < n; k++) {
      const melde = (f) => self.postMessage({ id, fortschritt: (k + f * 0.95) / n });   // der Rest bis 1 ist das Verpacken
      const r = randStreifen({ ...auftrag, teil: teile[k], melde });
      let blob = null;
      if (r.breite > 0 && r.hoehe > 0) {
        const leinwand = new OffscreenCanvas(r.breite, r.hoehe), cx = leinwand.getContext('2d');
        cx.putImageData(new ImageData(r.daten, r.breite, r.hoehe), 0, 0);
        blob = await leinwand.convertToBlob({ type: typ, quality: qualitaet });
      }
      streifen.push({ teil: r.teil, x: r.x, y: r.y, w: r.w, h: r.h, blob });
      self.postMessage({ id, fortschritt: (k + 1) / n });
    }
    self.postMessage({ id, streifen });
  } catch (err) {
    self.postMessage({ id, fehler: String((err && err.message) || err) });
  }
};
