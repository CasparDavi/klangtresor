/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   WORTPAARE AM EIGENEN KERN NACHSTUFEN
   labor/textanalyse/stufen.mjs - Werkstatt, nicht Betrieb.

   Wofuer: Jeder Beispieltext in der Oberflaeche, der eine Reimstufe behauptet („Assonanz: blind/ertrinkt"), muss
   dieselbe Stufe bekommen wie vom Werkzeug selbst. Sonst widerspricht die Legende der Analyse darunter. Am 13.11.2026
   stand im russischen Text „ровно/поздно" als Assonanz - der Kern stuft es als „unrein" ein.

   Aufruf:  node labor/textanalyse/stufen.mjs  [sprache wort1 wort2] …
   ohne Argumente laufen die Paare, die in der Oberflaeche stehen.

   Die Woerterbuecher liegen im KlangTresor unter modelle/textanalyse, nicht unter daten/ wie in der KlangFeder -
   darum wird KLANGFEDER_DATEN hier gesetzt. Fehlt cmudict, raet der Kern die englischen Laute aus Muret-Sanders und
   stuft womoeglich anders; das Skript sagt es dann. */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
process.env.KLANGFEDER_DATEN ||= path.join(WURZEL, 'modelle', 'textanalyse');

const { reimVergleich, reimteilWort, reimteilWortRu } =
  await import(path.join(WURZEL, 'bin', 'textanalyse', 'analyse.mjs'));
const { KERN_VERSION } = await import(path.join(WURZEL, 'bin', 'textanalyse', 'version.mjs'));

const teil = (w, sp) => ({ sprache: sp, rp: sp === 'ru' ? reimteilWortRu(w) : reimteilWort(w, sp) });

/* Was in der Oberflaeche steht (web/ui-sprache.js, web/ui-sprache-ru.js: ta.leg.asso und ta.leg.w.asso) */
const AUS_DER_OBERFLAECHE = [
  ['de', 'blind', 'ertrinkt', 'Assonanz'],
  ['en', 'slow', 'road', 'Assonanz'],
  ['ru', 'ночь', 'мощь', 'Assonanz'],
];

const argumente = process.argv.slice(2);
const paare = argumente.length >= 3
  ? Array.from({ length: Math.floor(argumente.length / 3) }, (_, i) => argumente.slice(i * 3, i * 3 + 3))
  : AUS_DER_OBERFLAECHE;

const fehlt = ['de/ipa-dict-de.txt', 'en/cmudict.dict']
  .filter(f => !fs.existsSync(path.join(process.env.KLANGFEDER_DATEN, f)));
if (fehlt.length) console.log('ACHTUNG, Wörterbuch fehlt: ' + fehlt.join(', ') + ' – die Stufen können abweichen.\n');

console.log('Kern ' + KERN_VERSION + ', Wörterbücher aus ' + process.env.KLANGFEDER_DATEN + '\n');
console.log('Spr  Paar                      Stufe            erwartet');
let schief = 0;
for (const [sp, a, b, soll] of paare) {
  let stufe;
  try { stufe = reimVergleich(teil(a, sp), teil(b, sp)) ?? '— (kein Reim)'; }
  catch (e) { stufe = 'FEHLER: ' + e.message; }
  const passt = !soll || stufe === soll;
  if (!passt) schief++;
  console.log(sp.padEnd(4), (a + '/' + b).padEnd(24), stufe.padEnd(16), soll ? (passt ? '✓ ' + soll : '✗ ' + soll) : '');
}
if (paare.some(p => p[3])) {
  console.log('\n' + (schief ? schief + ' Paar(e) weichen ab – die Oberfläche widerspricht dem Werkzeug.' : 'Alle Paare stimmen mit der Oberfläche überein.'));
  process.exit(schief ? 1 : 0);
}
