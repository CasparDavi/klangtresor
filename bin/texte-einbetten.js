/* Liedtexte als Vektoren - der Geschichten-Raum.

   multilingual-e5-small, mehrsprachig ueber 100 Sprachen. Der Witz
   daran: Deutsch und Englisch landen im SELBEN Raum. Ein deutscher
   Text ueber Abschied liegt neben einem englischen ueber dasselbe -
   ohne dass irgendwo uebersetzt wird. Genau deshalb braucht es keine
   Uebersetzung, und genau deshalb waere eine schaedlich: Reim,
   Wortspiel und Klang ueberleben sie nicht. */
'use strict';
const ort = require('onnxruntime-node');
const { tokenizerLaden } = require('./tokenizer.js');

const MAX = 512;   /* Modellgrenze. Laengere Texte werden gefaltet, s.u. */

async function einbetterLaden(modell, tokenizer) {
  const tk = tokenizerLaden(tokenizer);
  const sitzung = await ort.InferenceSession.create(modell);

  async function einVektor(ids) {
    const n = ids.length;
    const gross = BigInt64Array.from(ids.map(BigInt));
    const maske = BigInt64Array.from(new Array(n).fill(1n));
    const typen = BigInt64Array.from(new Array(n).fill(0n));
    const aus = await sitzung.run({
      input_ids:      new ort.Tensor('int64', gross, [1, n]),
      attention_mask: new ort.Tensor('int64', maske, [1, n]),
      token_type_ids: new ort.Tensor('int64', typen, [1, n]),
    });
    const h = aus.last_hidden_state;
    const [, laenge, dim] = h.dims;
    /* Mittelwert ueber die Token - so ist e5 trainiert. */
    const v = new Float64Array(dim);
    for (let t = 0; t < laenge; t++)
      for (let d = 0; d < dim; d++) v[d] += h.data[t * dim + d];
    for (let d = 0; d < dim; d++) v[d] /= laenge;
    return v;
  }

  function normieren(v) {
    let s = 0; for (const x of v) s += x * x; s = Math.sqrt(s) || 1;
    for (let i = 0; i < v.length; i++) v[i] /= s;
    return v;
  }

  /* Lange Texte: in Stuecke von hoechstens MAX Token schneiden, jedes
     einzeln einbetten, dann mitteln. Ein Liedtext hat Refrains - die
     wiederholen sich ohnehin, ein Mittel verzerrt also wenig. */
  async function einbetten(text) {
    const ids = tk.zerlegen('query: ' + text);
    if (ids.length <= MAX) return normieren(await einVektor(ids));
    const stuecke = [];
    const kern = ids.slice(1, -1);
    for (let i = 0; i < kern.length; i += MAX - 2)
      stuecke.push([ids[0], ...kern.slice(i, i + MAX - 2), ids[ids.length - 1]]);
    const teile = [];
    for (const s of stuecke) teile.push(await einVektor(s));
    const dim = teile[0].length, v = new Float64Array(dim);
    for (const t of teile) for (let d = 0; d < dim; d++) v[d] += t[d] / teile.length;
    return normieren(v);
  }
  return { einbetten };
}
module.exports = { einbetterLaden };
