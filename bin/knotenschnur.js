/* DIE KNOTENSCHNUR – Daten (Caspar_D, 12.11.2026: „das ganze werk als Inkaknotenschnur, jedes lied ein angeknoteter
   Substrang mit grössen proportionalen abschnitten in den richtigen farben … die gesamtschnur so lang wie der song“).
   Je Lied mit Text: Dauer, Likes und die Abschnitte mit ihrer Anfangszeit. Die Seite (web/knotenschnur.js) knotet daraus
   die Schnur; die Farben der Abschnitte kommen dort aus KlangfederBlatt.ABS_FARBE, die Art hier aus derselben Datei.

   Woher die Zeiten kommen (Caspar_D: B1):
   - „zeit“: Sunos Wortmarken (worteV3, sonst worte) tragen die Kopfzeilen [Intro], [Verse 1] … mit Zeitstempel. Eine
     Kopfzeile kann über mehrere Marken verteilt sein, darum wird im zusammengesetzten Text gesucht und jedem Zeichen die
     Anfangszeit seiner Marke gegeben. Gilt nur, wenn ALLE Abschnitte des Liedtexts dort wiederkommen – sonst wäre die
     Zuordnung geraten.
   - „silben“: sonst die Spieldauer nach dem Silbenanteil der Abschnitte (Vokalgruppen gezählt) – eine Schätzung, und so
     heißt sie in der Seite auch.
   - „ohne“: Text ohne Abschnittsmarken – ein Stück, grau.
   Ein Abschnitt beginnt mit seinem ersten gesungenen Wort; ein Vorspiel vor dem ersten Wort ist darum ein eigenes,
   unbenanntes Stück (art null), das Nachspiel gehört zum letzten Abschnitt.
   Nur Lieder mit Text (Caspar_D, 12.11.2026: „nur songs mit TExt“). */
'use strict';
const path = require('path');
require(path.join(__dirname, '..', 'web', 'klangfeder-blatt.js'));
const KB = globalThis.KlangfederBlatt;

const kopf = (name) => KB.BAUTEIL.test(String(name).trim());
/* Nur der Name vorn, nicht die Anweisung dahinter („Verse 1 – clear baritone …" heißt Verse 1) */
const kurz = (name) => String(name).split(/\s[–—-]\s|[,:;(|]/)[0].trim();

function abschnitteAusLyrics(lyrics) {
  const aus = []; let akt = null;
  for (const z of String(lyrics).split('\n')) {
    const m = z.trim().match(/^\[([^\]]*)\]$/);
    if (m && kopf(m[1])) { akt = { name: m[1].trim(), silben: 0 }; aus.push(akt); continue; }
    if (akt && !/^\[/.test(z.trim())) akt.silben += (z.match(/[aeiouäöüyàáâèéêìíîòóôùúûаеёиоуыэюя]+/gi) || []).length;
  }
  return aus;
}

function abschnitteAusWorten(worte, soll) {
  if (!worte || !worte.length) return null;
  let text = ''; const zeit = [];
  for (const [a, , t] of worte) for (const ch of String(t)) { text += ch; zeit.push(a); }
  const k = [];
  for (const m of text.matchAll(/\[([^\]]*)\]/g)) if (kopf(m[1])) k.push({ t: zeit[m.index], name: m[1].trim() });
  return k.length === soll ? k : null;
}

function lied(s) {
  const D = +s.dauer || 0;
  const roh = abschnitteAusLyrics(s.lyrics);
  const r = (x) => Math.round(x * 100) / 100;
  let quelle = 'ohne', abschnitte = [];
  const k = roh.length && (abschnitteAusWorten(s.worteV3, roh.length) || abschnitteAusWorten(s.worte, roh.length));
  if (k) {
    quelle = 'zeit';
    if (k[0].t > 1) abschnitte.push([0, null, '']);
    for (const x of k) abschnitte.push([r(x.t), KB.abschnittArt(x.name), kurz(x.name)]);
  } else if (roh.length && roh.some(x => x.silben)) {
    quelle = 'silben';
    const summe = roh.reduce((a, x) => a + x.silben, 0); let t = 0;
    for (const x of roh) { abschnitte.push([r(t), KB.abschnittArt(x.name), kurz(x.name)]); t += D * x.silben / summe; }
  } else abschnitte.push([0, null, '']);
  return { id: s.id, titel: s.titel || '', erstellt: s.erstellt || '', dauer: r(D), likes: s.likes || 0, quelle, abschnitte };
}

/* Ein Durchgang je Katalogstand: gemerkt am Katalogobjekt selbst (der Server lädt bei neuem Stand ein neues). */
const merker = new WeakMap();
function stand(katalog) {
  if (!katalog) return null;
  if (merker.has(katalog)) return merker.get(katalog);
  const songs = Object.values(katalog.songs || {})
    .filter(s => s.lyrics && s.lyrics.trim() && s.dauer > 0)
    .map(lied)
    .sort((a, b) => a.erstellt.localeCompare(b.erstellt));
  const aus = { erstelltAm: katalog.erstelltAm || null, songs };
  merker.set(katalog, aus);
  return aus;
}

module.exports = { stand, lied };
