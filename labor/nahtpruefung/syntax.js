#!/usr/bin/env node
/* Baut jedes Inline-Skript von web/index.html einmal mit new Function - dasselbe Verfahren wie
 * skripteBauen in bin/effektclip-labor.js, nur ohne zu schreiben. Exitcode 1, wenn eines nicht baut:
 * eine kaputte index.html merkt man sonst erst im Browser.
 *   node labor/nahtpruefung/syntax.js [datei.html]
 */
const fs = require('fs');
const path = require('path');

const datei = process.argv[2] || path.resolve(__dirname, '../../web/index.html');
const text = fs.readFileSync(datei, 'utf8');
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
let m, n = 0, kaputt = 0;
while ((m = re.exec(text))) {
  n++;
  try { new Function(m[1]); }
  catch (e) { kaputt++; console.error('Skript ' + n + ' (ab Zeile ' + (text.slice(0, m.index).split('\n').length) + ') baut nicht: ' + e.message); }
}
console.log(path.relative(process.cwd(), datei) + ': ' + n + ' Inline-Skripte, ' + (kaputt ? kaputt + ' kaputt' : 'alle bauen'));
process.exit(kaputt ? 1 : 0);
