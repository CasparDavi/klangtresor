// Eine Stelle für den Ort der Wörterbücher. Standard: <Projekt>/daten. Wer den Kern woanders einbaut
// (z. B. im KlangTresor), setzt KLANGFEDER_DATEN oder ruft setzeDaten() vor dem ersten Gebrauch.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let DATEN = process.env.KLANGFEDER_DATEN || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'daten');
export const daten = (...teile) => path.join(DATEN, ...teile);
export function setzeDaten(ordner) { DATEN = ordner; }
