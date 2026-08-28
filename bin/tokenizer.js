/* XLM-RoBERTa-Tokenizer (Unigram/SentencePiece) in reinem JavaScript.

   WARUM SELBST GEBAUT: Das Haus hat genau eine ML-Abhaengigkeit,
   onnxruntime-node. Transformers.js waere eine zweite und braechte
   eine eigene Laufzeit mit. Ein Unigram-Tokenizer ist eine
   Viterbi-Suche - das sind hundert Zeilen, keine Bibliothek.

   ZUR NORMALISIERUNG: SentencePiece bringt eine vorkompilierte
   Zeichentabelle mit (precompiled_charsmap). Ihr Kern ist NFKC, und
   das kann JavaScript selbst. Fuer lateinschriftliche Texte ist der
   Unterschied vernachlaessigbar; bei Schriften mit eigenen
   Sonderregeln waere er es nicht. */
'use strict';
const fs = require('node:fs');

function tokenizerLaden(pfad) {
  const roh = JSON.parse(fs.readFileSync(pfad, 'utf8'));
  const eintraege = roh.model.vocab;                 // [[stueck, score], ...]
  const nach = new Map();
  for (let i = 0; i < eintraege.length; i++) nach.set(eintraege[i][0], i);
  const punkte = eintraege.map(e => e[1]);
  /* Laengstes Vokabularstueck - begrenzt die Viterbi-Suche. */
  let maxLaenge = 0;
  for (const [s] of eintraege) if (s.length > maxLaenge) maxLaenge = s.length;

  const UNK = roh.model.unk_id ?? 3;
  const BOS = nach.get('<s>') ?? 0, EOS = nach.get('</s>') ?? 2;

  function zerlegen(text) {
    /* Metaspace: Leerzeichen werden zu U+2581, davor eines eingefuegt. */
    const norm = ('▁' + text.normalize('NFKC').replace(/\s+/g, '▁'));
    const n = norm.length;
    /* Viterbi: bester Pfad durch alle moeglichen Zerlegungen. */
    const beste = new Float64Array(n + 1).fill(-Infinity);
    const woher = new Int32Array(n + 1).fill(-1);
    const stueckId = new Int32Array(n + 1).fill(-1);
    beste[0] = 0;
    for (let i = 0; i < n; i++) {
      if (beste[i] === -Infinity) continue;
      const bis = Math.min(n, i + maxLaenge);
      let gefunden = false;
      for (let j = i + 1; j <= bis; j++) {
        const id = nach.get(norm.slice(i, j));
        if (id === undefined) continue;
        gefunden = true;
        const p = beste[i] + punkte[id];
        if (p > beste[j]) { beste[j] = p; woher[j] = i; stueckId[j] = id; }
      }
      /* Kein Vokabularstueck passt - ein Zeichen als <unk> ueberspringen.
         Ohne diesen Ausweg bricht die Kette bei fremden Zeichen ab. */
      if (!gefunden && beste[i + 1] === -Infinity) {
        beste[i + 1] = beste[i] - 100; woher[i + 1] = i; stueckId[i + 1] = UNK;
      }
    }
    const ids = [];
    for (let k = n; k > 0; k = woher[k]) { ids.push(stueckId[k]); if (woher[k] < 0) break; }
    ids.reverse();
    return [BOS, ...ids, EOS];
  }
  return { zerlegen, groesse: eintraege.length };
}
module.exports = { tokenizerLaden };
