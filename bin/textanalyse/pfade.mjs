// Eine Stelle für den Ort der Wörterbücher. Standard: <Projekt>/daten. Wer den Kern woanders einbaut
// (z. B. im KlangTresor), setzt KLANGFEDER_DATEN oder ruft setzeDaten() vor dem ersten Gebrauch.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let DATEN = process.env.KLANGFEDER_DATEN || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'daten');
export const daten = (...teile) => path.join(DATEN, ...teile);
export function setzeDaten(ordner) { DATEN = ordner; }
// Daten nur der KlangFeder (Lautdatenbank, Reimpaare, Wortfolgen): immer <KlangFeder>/daten, auch wenn die
// Wörterbücher woanders liegen (gemeinsame Kopie, KLANGFEDER_DATEN)
const EIGEN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'daten');
export const eigeneDaten = (...teile) => path.join(EIGEN, ...teile);

// Korrekturdateien gehören zum Code (liegen neben dem Kern), nicht zu den Wörterbüchern
const HIER = path.dirname(fileURLToPath(import.meta.url));
export function korrekturen(datei) {
  const f = path.join(HIER, datei);
  if (!fs.existsSync(f)) return [];
  return fs.readFileSync(f, 'utf8').split('\n').map(z => z.trim()).filter(z => z && !z.startsWith('#'))
    .map(z => z.split('\t')).filter(t => t.length >= 2 && t[0] && t[1]).map(([w, aussprache]) => [w.trim(), aussprache.trim()]);
}
