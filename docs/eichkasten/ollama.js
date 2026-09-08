/* Kondensiert Liedtexte mit einem lokalen Modell ueber Ollama.
   Aufruf:  node ollama.js <modell> [buendel-nummer ...]
   Liest ${KRATZ}/buendel-N.json, schreibt kondensat-<modell>.json.
   Nur lesend auf library/ - die Buendel liegen im Kratzverzeichnis.

   HERKUNFT: Versuchsskript vom 28.08.2026 aus library/kondensate/arbeit/
   (Claudes Rechenlabor, am 08.09. geloescht). Dieses eine Stueck ist
   aufgehoben, weil docs/HANDARBEIT-PRUEFUNG.md (Empfehlung Kondensate,
   Weg c) darauf verweist: Beleg, dass ein Ollama-Kondensat technisch
   geht (56 s je Lied auf dem Intel-Mac, CPU). Die Buendel-Dateien, die
   es liest, gibt es nicht mehr; es laeuft nicht ohne Neubau. */
'use strict';
const fs = require('fs'), path = require('path');
const HIER = __dirname;

/* Die Aufgabe steht in bin/kondensat-prompt.js und NUR dort - sonst laufen
   die Fassungen auseinander und der Modellvergleich misst am Ende den
   Unterschied der Prompts mit. Begruendung je Regel: docs/KONDENSAT-REGELN.md */
const { FASSUNG, einzeln } = require('/Volumes/Extreme_SSD/Entwicklung/SunoArchive/bin/kondensat-prompt.js');

/* Ollama antwortet auf einen Rutsch (stream:false). Ein Denkmodell wie
   deepseek-r1 stellt seine Ueberlegung in <think>-Klammern voran - die
   wird hier weggeschnitten, sonst landet sie in den Substantiven. */
async function frage(modell, text, versuch = 0) {
  const r = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modell,
      prompt: einzeln(text),
      stream: false,
      /* Denkmodelle (qwen3, deepseek-r1) stellen ihrer Antwort einen
         <think>-Block voran. Mit einer knappen Token-Grenze ist der
         Vorrat aufgebraucht, bevor die Antwort kommt - gemessen an
         qwen3:8b: 191 Token fuer drei Woerter. Wo es geht, wird das
         Denken abgeschaltet; wo nicht (deepseek-r1 kann es nicht),
         bleibt genug Vorrat und der Block wird unten weggeschnitten. */
      think: /deepseek-r1/.test(modell) ? undefined : false,
      options: { temperature: 0, num_ctx: 8192, num_predict: 1200 },
    }),
  });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' von Ollama');
  let a = (await r.json()).response || '';
  a = a.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<\/?think>/g, '').trim();
  /* Die letzte nichtleere Zeile ist bei geschwaetzigen Modellen die Antwort. */
  const zeilen = a.split('\n').map(z => z.trim()).filter(Boolean);
  let zeile = zeilen.reverse().find(z => (z.match(/,/g) || []).length >= 5) || zeilen[0] || '';
  const worte = zeile.split(/[,;·]/).map(w => w
    .replace(/^\s*\d+[.)]?\s*/, '')      // Nummerierung
    .replace(/^[-*•]\s*/, '')            // Aufzaehlungszeichen
    .replace(/["'`]/g, '').trim())
    .filter(w => w && w.length > 1 && /^[A-ZÄÖÜ]/.test(w));
  if (worte.length < 8 && versuch < 2) return frage(modell, text, versuch + 1);
  return worte.slice(0, 10);
}

(async () => {
  const modell = process.argv[2];
  if (!modell) { console.error('Aufruf: node ollama.js <modell> [buendel ...]'); process.exit(1); }
  const nummern = process.argv.slice(3).length ? process.argv.slice(3) : ['1', '2', '3', '4'];
  const erg = {};
  const t0 = Date.now();
  for (const nr of nummern) {
    const datei = path.join(HIER, `buendel-${nr}.json`);
    if (!fs.existsSync(datei)) { console.error(`  buendel-${nr}.json fehlt - erst die Stichprobe bauen`); continue; }
    const buendel = JSON.parse(fs.readFileSync(datei, 'utf8'));
    const lieder = Array.isArray(buendel) ? buendel : (buendel.lieder || []);
    for (const l of lieder) {
      const t = Date.now();
      try {
        erg[l.id8] = await frage(modell, l.text || l.gesungen || '');
        console.log(`  ${l.id8}  ${String(((Date.now() - t) / 1000).toFixed(1)).padStart(5)} s  ${(l.titel || '').slice(0, 34).padEnd(34)} ${erg[l.id8].join(' · ')}`);
      } catch (e) {
        erg[l.id8] = null;
        console.log(`  ${l.id8}  FEHLER: ${e.message}`);
      }
    }
  }
  const ziel = path.join(HIER, `kondensat-${modell.replace(/[:/]/g, '_')}-f${FASSUNG}.json`);
  fs.writeFileSync(ziel, JSON.stringify(erg, null, 1));
  const fertig = Object.values(erg).filter(Boolean).length;
  console.log(`\n${fertig} von ${Object.keys(erg).length} Liedern in ${((Date.now() - t0) / 1000).toFixed(0)} s -> ${ziel}`);
})();
