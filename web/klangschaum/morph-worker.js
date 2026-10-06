/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   Rechnet den Plan eines Morphs (morph.js) abseits der Seite: { alt, neu } (zwei Netze aus morphNetz)
   hinein, { plan } oder { fehler } heraus - die Seite bleibt waehrend der rund 0,3 s bedienbar. */
import { morphPlan } from './morph.js';

self.onmessage = (e) => {
  try { self.postMessage({ plan: morphPlan(e.data.alt, e.data.neu) }); }
  catch (err) { self.postMessage({ fehler: String(err && err.stack || err) }); }
};
