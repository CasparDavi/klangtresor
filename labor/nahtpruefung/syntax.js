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
/* Seit das Studio eine Datei ist (27.09.2026): auch jede <script src="/x.js">-Datei unter web/ bauen. */
const web = path.dirname(datei); let d = 0;
for (const s of text.matchAll(/<script[^>]*\bsrc="\/([^"?]+)(?:\?[^"]*)?"/g)) {
  const f = path.join(web, s[1]); if (!fs.existsSync(f)) { kaputt++; console.error('Skriptdatei fehlt: ' + s[1]); continue; }
  d++; try { new Function(fs.readFileSync(f, 'utf8')); } catch (e) { kaputt++; console.error(s[1] + ' baut nicht: ' + e.message); }
}
console.log(path.relative(process.cwd(), datei) + ': ' + n + ' Inline-Skripte, ' + d + ' Skriptdateien, ' + (kaputt ? kaputt + ' kaputt' : 'alle bauen'));
process.exit(kaputt ? 1 : 0);
