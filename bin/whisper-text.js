/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Der Text-Abgleich zwischen gehörten und offiziellen Wörtern -
 * gemeinsamer Kern von bin/whisper.js (beim Rechnen) und
 * bin/whisper-abgleich.js (nachträglich über den Bestand).
 *
 * Whisper hört - und verhört sich. Der Abgleich legt die gehörten
 * Wörter per längster gemeinsamer Teilfolge über die offiziellen
 * Lyrics: Wo sie sich treffen, gewinnt die offizielle Schreibweise
 * ("Glykosi de" wird "Glükoside"); was Whisper zusätzlich hört
 * (Ad-libs, Wiederholungen), bleibt als gehört stehen. Die ZEITEN
 * bleiben unangetastet - korrigiert wird nur die Schrift.
 * (Caspar_D, 20.08.2026: "die Whisper-erkannten Wörter nochmal gegen die
 * Lyrics abgleichen und ggf. die Schreibweise korrigieren.")
 */

const norm = (w) => String(w).toLowerCase().normalize('NFKD')
  .replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]/gu, '');

/* Offizielle Lyrics als Wortliste; Zeilenumbrüche bleiben am Wort,
   [Anweisungen] werden zu Zeilengrenzen. */
function lyricsWoerter(lyrics) {
  const ohne = String(lyrics).replace(/\[[^\]]*\]/g, '\n');
  const out = [];
  for (const zeile of ohne.split('\n')) {
    const ws = zeile.split(/\s+/).filter(Boolean);
    ws.forEach((w, i) => out.push(w + (i === ws.length - 1 ? '\n' : ' ')));
  }
  return out.filter(w => norm(w));
}

/* gehoert: [{text, ...}] wird IN PLACE korrigiert; Rückgabe: Treffer. */
function abgleichen(gehoert, offiziell) {
  const A = gehoert.map(w => norm(w.text)), B = offiziell.map(norm);
  const n = A.length, m = B.length;
  if (!n || !m || n * m > 4e6) return 0;           // zu groß: lassen
  const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  let i = 0, j = 0, treffer = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { gehoert[i].text = offiziell[j]; treffer++; i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) i++;
    else j++;
  }
  return treffer;
}

module.exports = { norm, lyricsWoerter, abgleichen };
