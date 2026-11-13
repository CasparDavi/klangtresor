// Prüft einen Datenordner gegen den Datenausweis (kern/daten.json): vorhanden, Größe, SHA-256.
// Für beide Werkzeuge: KlangFeder wählt damit ihren Datenort, der KlangTresor prüft nach dem Holen.
// „optional“ (seit 2026-11-13.2, Russisch): fehlt eine solche Datei, bleibt der Ort gültig – der Kern rechnet die Sprache dann mit
// seinem Notbehelf (Russisch: Endungsmodell). Liegt sie da, muss sie stimmen.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
export const ausweis = () => JSON.parse(fs.readFileSync(path.join(HIER, 'daten.json'), 'utf8'));

export function pruefeDaten(ordner, { pruefsumme = true } = {}) {
  const dateien = ausweis().dateien.map(d => {
    const f = path.join(ordner, d.pfad);
    if (!fs.existsSync(f)) return { pfad: d.pfad, ok: false, grund: 'fehlt', ...(d.optional ? { optional: true } : {}) };
    if (fs.statSync(f).size !== d.groesse) return { pfad: d.pfad, ok: false, grund: 'falsche Größe' };
    if (pruefsumme && crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex') !== d.sha256)
      return { pfad: d.pfad, ok: false, grund: 'falsche Prüfsumme (andere Fassung)' };
    return { pfad: d.pfad, ok: true };
  });
  return { ordner, ok: dateien.every(d => d.ok || (d.optional && d.grund === 'fehlt')), dateien };
}
