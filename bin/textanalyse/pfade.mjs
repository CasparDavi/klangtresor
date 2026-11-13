// Eine Stelle für den Ort der Wörterbücher. Standard: <Projekt>/daten. Wer den Kern woanders einbaut
// (z. B. im KlangTresor), setzt KLANGFEDER_DATEN oder ruft setzeDaten() vor dem ersten Gebrauch.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Ablage: wo Wörterbücher und eigene Dateien (Fassungen, Arbeitsordner, Einstellungen) liegen – im Programmordner,
// wie beim KlangTresor (Jörg, 11.11.2026, Neubau des Setups: „A wie KlangTresor“): ein Ordner nach Wahl, vorgeschlagen
// ~/KlangFeder, Programm und Wörterbücher zusammen. Das Entfernen nimmt nur das Programm; daten/ und entwuerfe/ bleiben.
// KLANGFEDER_ABLAGE überstimmt (z. B. externe Platte).
const PROGRAMM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ENTWICKLUNG = fs.existsSync(path.join(PROGRAMM, '.git'));
export const ABLAGE = process.env.KLANGFEDER_ABLAGE || PROGRAMM;
export const ablage = (...teile) => path.join(ABLAGE, ...teile);
export const programm = (...teile) => path.join(PROGRAMM, ...teile);
let DATEN = process.env.KLANGFEDER_DATEN || path.join(ABLAGE, 'daten');
export const daten = (...teile) => path.join(DATEN, ...teile);
export function setzeDaten(ordner) { DATEN = ordner; }
// Daten nur der KlangFeder (Lautdatenbank, Reimpaare, Wortfolgen): immer <KlangFeder>/daten, auch wenn die
// Wörterbücher woanders liegen (gemeinsame Kopie, KLANGFEDER_DATEN)
const EIGEN = path.join(ABLAGE, 'daten');
export const eigeneDaten = (...teile) => path.join(EIGEN, ...teile);

// Korrekturdateien gehören zum Code (liegen neben dem Kern), nicht zu den Wörterbüchern
const HIER = path.dirname(fileURLToPath(import.meta.url));
export function korrekturen(datei) {
  const f = path.join(HIER, datei);
  if (!fs.existsSync(f)) return [];
  return fs.readFileSync(f, 'utf8').split('\n').map(z => z.trim()).filter(z => z && !z.startsWith('#'))
    .map(z => z.split('\t')).filter(t => t.length >= 2 && t[0] && t[1]).map(([w, aussprache]) => [w.trim(), aussprache.trim()]);
}
