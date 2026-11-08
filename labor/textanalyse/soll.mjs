// Soll-Test für beide Sprachen: der eingebaute Kern muss für diese Songs aus Jörgs Bestand genau diese
// Werte liefern (Kern 2026-11-08.3). Liest die Texte über die KlangTresor-API.
// Aufruf: node labor/textanalyse/soll.mjs [http://127.0.0.1:8788]   (in der KlangFeder: labor/soll.mjs)
// Im KlangTresor: Kern aus bin/textanalyse/, Woerterbuecher aus dem Modellordner (bin/modellordner.js).
import { createRequire } from 'node:module';
import path from 'node:path';
import { setzeDaten } from '../../bin/textanalyse/pfade.mjs';
setzeDaten(path.join(createRequire(import.meta.url)('../../bin/modellordner.js').modellOrdner(), 'textanalyse'));
const { anzeige } = await import('../../bin/textanalyse/analyse.mjs');
const { spracheText } = await import('../../bin/textanalyse/sprache.mjs');
const TRESOR = process.argv[2] || 'http://127.0.0.1:8788';
const SOLL = [
  { id: '24dd6816-3393-41cc-a109-4b2ab7baf726', titel: 'Rusalka / Русалка', sprache: 'de', zeilen: 76, fremd: 21, deutsch: 76, englisch: 0, vierHebungen: 58, silben: 547,
    reime: 'AABBCCDDEEFFGGAA--ABABAABBAABBAAAABBCCDD-E-EAABBCCAABBCC-AA-A-B-B----AABB---' },
  { id: '6250449b-8780-4231-a17a-d0d2c621b06c', titel: 'Stars of the deep', sprache: 'en', zeilen: 75, fremd: 0, deutsch: 0, englisch: 75, vierHebungen: 29, silben: 464,
    reime: '-A-A----AABBAABB-A-A-----AA---AA---A-A-----AA---AA--AABBAABB-AA------------' },
];
let ok = true;
for (const soll of SOLL) {
  const s = await (await fetch(TRESOR + '/api/song/' + soll.id)).json();
  const z = anzeige(s.lyrics), zz = z.filter(x => x.typ === 'zeile');
  const ist = { sprache: spracheText(s.lyrics).gesamt, zeilen: zz.length, fremd: z.filter(x => x.typ === 'fremd').length,
    deutsch: zz.filter(x => x.sprache === 'de').length, englisch: zz.filter(x => x.sprache === 'en').length,
    vierHebungen: zz.filter(x => x.h === 4).length, silben: zz.reduce((a, x) => a + x.n, 0), reime: zz.map(x => x.reim || '-').join('') };
  console.log(soll.titel);
  for (const k of Object.keys(ist)) { const g = ist[k] === soll[k]; ok &&= g; console.log(`  ${g ? '✓' : '✗'} ${k}: ${ist[k]}${g ? '' : '  (Soll ' + soll[k] + ')'}`); }
}
process.exit(ok ? 0 : 1);
