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
   Nur Lieder mit Text (Caspar_D, 12.11.2026: „nur songs mit TExt“).

   Die Hüllkurve für die Glasperlenschnur (Caspar_D, 12.11.2026: „die Glasperlen sollten verschiedene Durchmesser haben und
   die Hüllkurve nachbilden“): je Sekunde ein Wert 0…1, die Lautstärke geglättet über drei Sekunden und auf das 95. Perzentil
   des Lieds bezogen - jedes Lied zeigt seine eigene Dynamik. Quelle: Sunos Hüllkurve `welle` (5 Werte je Sekunde), sonst die
   Wellenform-Stufen `wellenStufen` (Min/Max je Fach und Kanal; genommen wird die gröbste Stufe mit mindestens einem Fach je
   Sekunde). Als Ziffernfolge "0"…"9" je Sekunde. Fehlt beides, bleibt `huelle` leer und die Perlen sind gleich groß. */
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

function roheHuelle(s) {
  const D = +s.dauer || 0;
  if (Array.isArray(s.welle) && s.welle.length > 2) return { werte: s.welle.map(v => Math.abs(+v) || 0), dauer: D };
  const st = Array.isArray(s.wellenStufen) ? s.wellenStufen.filter(x => x && Array.isArray(x.data) && x.data[0] && x.data[0].length > 1) : [];
  const passend = st.filter(x => x.data[0].length / 2 >= D).sort((a, b) => a.data[0].length - b.data[0].length)[0];
  if (!passend) return null;
  const kanaele = passend.data, n = Math.floor(kanaele[0].length / 2), werte = new Array(n).fill(0);
  for (const k of kanaele) for (let i = 0; i < n; i++) werte[i] += Math.max(Math.abs(k[2 * i] || 0), Math.abs(k[2 * i + 1] || 0)) / kanaele.length;
  return { werte, dauer: D };
}
function huelle(s) {
  const roh = roheHuelle(s); if (!roh || !roh.dauer) return '';
  const N = Math.max(1, Math.round(roh.dauer)), je = roh.werte.length / roh.dauer, sek = new Array(N).fill(0);
  for (let t = 0; t < N; t++) {                          /* Mittel je Sekunde */
    const a = Math.floor(t * je), b = Math.max(a + 1, Math.floor((t + 1) * je)); let x = 0, c = 0;
    for (let i = a; i < b && i < roh.werte.length; i++) { x += roh.werte[i]; c++; }
    sek[t] = c ? x / c : 0;
  }
  const glatt = sek.map((_, t) => { let x = 0, c = 0; for (let k = t - 1; k <= t + 1; k++) if (k >= 0 && k < N) { x += sek[k]; c++; } return x / c; });
  const ref = [...glatt].sort((a, b) => a - b)[Math.floor(N * 0.95)] || 1;
  /* als Ziffernfolge 0…9, eine je Sekunde: die Perlen brauchen nicht mehr Stufen, und die Antwort bleibt klein */
  return glatt.map(v => Math.round(Math.min(1, v / ref) * 9)).join('');
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
  return { id: s.id, titel: s.titel || '', erstellt: s.erstellt || '', dauer: r(D), likes: s.likes || 0, quelle, abschnitte, huelle: huelle(s) };
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
