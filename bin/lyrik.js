#!/usr/bin/env node
/**
 * Bereinigte Lyrik — der gesungene Text, und nur der.
 *
 *   node bin/lyrik.js                 Bericht, schreibt nichts
 *   node bin/lyrik.js --tun           schreibt library/lyrik.json
 *   node bin/lyrik.js <id>            nur dieses Lied, ausführlich
 *   node bin/lyrik.js --unsicher      listet die Lieder, die durchfallen
 *
 * WARUM ES DAS GIBT (Caspar_D, 07.09.2026): „lyricsWorte sind uns schon
 * mehrmals auf die Füsse gefallen, wir brauchen einen Whisper-basierten
 * Lyricscleaner, der alles, was nicht Lyrics ist löscht und sicherstellt
 * dass die Wortzahlen stimmen."
 *
 * Das Feld `lyrics` im Katalog ist Caspar_Ds Einreichung an Suno. Darin
 * steht mehr als der Gesang: Regieanweisungen in eckigen Klammern,
 * Vorreden, Widmungen an andere Künstler, Playlist-Hinweise, und bei
 * vielen Liedern die vollständige zweite Sprachfassung. Jede Zählung auf
 * diesem Feld zählt das mit. `lyricsWorte` in bin/katalog.js versucht das
 * über Trennlinien abzufangen und bricht deshalb bei „Ulrich & Ännchen"
 * nach 25 von 292 Wörtern ab — dort trennen die Striche Strophen, nicht
 * Sprachfassungen.
 *
 * NICHTS VON SUNO WIRD VERÄNDERT (Caspar_D, 07.09.2026: „ein zweites
 * Fenster auf jeden Fall, nichts, was von suno kommt sollte verändert
 * werden"). `lyrics` und `worte` im Katalog bleiben, wie sie sind. Das
 * Ergebnis steht in einer eigenen Datei, wie klang.json und toene.json
 * auch.
 *
 * DIE QUELLE IST WHISPER, NICHT DER KATALOG. Das Feld `worte` im Katalog
 * stammt bei fast allen Liedern von Suno und ist aus dem eingereichten
 * Text abgeleitet — ein Abgleich damit vergleicht den Text mit sich
 * selbst (gemessen: 100 % Deckung bei identischer Wortzahl). Whisper hat
 * den Ton gehört; seine Marken liegen in library/whisper.ndjson.
 *
 * DAS VERFAHREN
 *   1. Regieanweisungen fliegen ohne Alignment. Zwei Formen:
 *      - Ganze Zeile: eckige Klammern über die ganze Zeile (auch mit
 *        Klammern darin), eine Regiezeile mit #, oder eine Trennlinie aus
 *        Strichen/Gleichzeichen.
 *      - Einschub in einer sonst gesungenen Zeile — „[soft] schau sie nur
 *        an." — der Klammerteil fällt aus dem Zeilentext, der Rest bleibt.
 *      Runde Klammern fliegen NICHT vorab — siehe FASSUNG 3 unten.
 *   2. Globales Alignment (Needleman-Wunsch) zwischen dem Wortstrom des
 *      Liedtexts und dem, was Whisper gehört hat.
 *   3. Zwei Zusätze, ohne die echte Zeilen verlorengehen — beide gemessen
 *      am Bestand, nicht geraten:
 *      - Wörter gelten als gleich bei einem Buchstaben Abstand. Whisper
 *        schreibt „finsterem", Caspar_D schreibt „finst'rem".
 *      - Eine ungedeckte Zeile ZWISCHEN gedeckten Zeilen bleibt stehen.
 *        Whisper überhört einzelne Zeilen; dass die Nachbarn sitzen, ist
 *        der Beleg, daß mitgesungen wurde. Über den Bestand rettet das
 *        1466 Wörter. Höchstens zwei Zeilen am Stück — eine ganze Strophe
 *        in einer anderen Sprache soll nicht durchrutschen.
 *   4. Zeitanker je Zeile aus denselben Whisper-Marken. Gerettete Zeilen
 *      haben keine eigenen und tragen deshalb `geschaetzt`.
 *
 * WO ES AUFHÖRT. Unter DECKUNG_MINDEST wird nicht gereinigt, sondern
 * gemeldet. Bei „Ik will …" (Plattdeutsch) versteht Whisper so wenig, daß
 * echte Zeilen durchfielen — dort darf die Software nicht entscheiden.
 * Dasselbe gilt, wenn Whisper gar nichts hat.
 *
 * FASSUNG 2 (Caspar_D, 25.09.2026). Zwei Befunde im Bestand:
 *
 * ERSTENS: Regieanweisungen kamen durch. Gezählt: 13 ganze Zeilen wie
 * „[Post-Chorus Hook (instrumental)]" und 190 Zeilen mit Einschüben wie
 * „[soft] schau sie nur an." Caspar_D: „das sollte in der bereinigten
 * Lyrics nicht passieren, ist ja bereinigt um sowas." Grund: die alte
 * `istRegie`-Regel (eine öffnende Klammer, dann kein `]`/`)` bis zum
 * Ende) scheitert an eigenen Klammern IN der Anweisung — „(instrumental)"
 * schließt vor dem äußeren „]", der Rest der Zeile passt dann nicht mehr
 * ins Muster. Einschübe MITTEN in einer Zeile prüfte sie gar nicht — nur
 * ganze Zeilen fielen unter „Regie". Jetzt: ganze Zeile via
 * `istRegieZeile` (== `istNichtGesungen` in web/index.html), Einschübe
 * separat via `EINSCHUB_ENTFERNEN`.
 *
 * ZWEITENS: zwei Fehler im Zeitverfahren, beide daraus, dass Whisper
 * (Verfahren „dtw") vielen Wörtern dieselbe Start- und Endzeit gibt
 * (Dauer 0) — echte Messung, aber ohne Standzeit.
 *   (a) Hat eine gesungene Zeile nur eine solche Marke, ist ihr `von`
 *       gleich ihrem `bis`. Die nächste Zeile ist oft `geschaetzt` und
 *       begann bisher GENAU an diesem `bis` — im selben Augenblick wie
 *       die vorige Zeile. 19 Zeilenpaare im Bestand teilten sich so ihr
 *       `von`. Jetzt: eine Zeile mit einer solchen entarteten Marke
 *       (Standzeit < 0,3 s) bekommt ihre Standzeit aus der Spanne bis zur
 *       nächsten ECHTEN (nicht entarteten) Marke, geteilt nach Zeichen-
 *       zahl mit den geschätzten Zeilen dazwischen — nicht mehr bei sich
 *       selbst abgeschnitten.
 *   (b) Landen zwei Textzeilen auf genau denselben Whisper-Marken (6 Fälle
 *       im Bestand), bekommen beide dieselbe Spanne verdoppelt. Jetzt:
 *       die eine gemeinsame Spanne wird nach Zeichenzahl zwischen den
 *       Zeilen geteilt.
 *   Beides ändert NUR geschätzte oder entartete Zeiten — eine echte,
 *   nicht-entartete Zeitmarke bleibt, wie Whisper sie gemessen hat.
 *
 * FASSUNG 3 (Caspar_D, 25.09.2026). Zwei weitere Entscheidungen, beide
 * von ihm im Gespräch getroffen:
 *
 * ERSTENS, RUNDE KLAMMERN. Bisher (Fassung 1/2) galt eine runde Klammer
 * über die GANZE Zeile als Regie wie eine eckige — gestrichen, ohne dass
 * Whisper je gefragt wurde. Caspar_D dazu: „Deckung würde ich immer ohne
 * eckige und runde Klammern berechnen, das ist dann sicher. Eckige
 * Klammern fliegen dann aber grundsätzlich raus" (wie bisher: ganze
 * eckige Zeilen und eckige Einschübe, VOR dem Alignment) — „runde
 * Klammern durchlaufen den Whisper-Einsatz." Jetzt also: `istRegieZeile`
 * kennt keine runden Klammern mehr. Jede runde Klammergruppe — auch eine,
 * die die ganze Zeile ausmacht — geht mit ins Alignment, GENAU wie der
 * Text davor und danach. Danach, je Gruppe: hat Whisper mindestens die
 * Hälfte ihrer Wörter gehört (aligniert), bleibt ihr Text in der Zeile
 * (Zähler `klammerGehoert`); sonst fällt die Gruppe aus der Zeile (Zähler
 * `klammerGestrichen`). Eine Zeile, die nur aus einer nicht gehörten
 * Gruppe bestand, ist danach leer und fällt ganz. Eine Klammer, die sich
 * über mehrere Zeilen erstreckt (öffnet, schließt erst Zeilen später —
 * Produktionsnotizen wie bei „Pfeifenwald") ist EINE Gruppe über alle
 * ihre Zeilen: nicht gehört, fallen alle diese Zeilen. Und: „die Zeichen
 * runde Klammer fliegen aber dann auch grundsätzlich raus" — im Text
 * einer Zeile steht kein `(` und `)` mehr, gehört oder nicht.
 *
 * Wichtig: die DECKUNG selbst (und das gesungen/offen-Kriterium je Zeile)
 * zählt nie ein Klammerwort mit, eckig oder rund, gehört oder nicht — sie
 * rechnet ausschließlich mit Wörtern AUSSERHALB jeder Klammer. Eine Zeile
 * ohne ein einziges Wort außerhalb von Klammern gilt als gesungen, wenn
 * am Ende noch Text übrig ist (ihre Gruppe wurde gehört), sonst wie eine
 * leere Zeile. Die Wörter einer gehörten Gruppe liefern der Zeile ihre
 * Zeitmarken wie jedes andere Wort auch.
 *
 * Grund für den Kurswechsel bei runden Klammern: die alte Sonderregel
 * ließ jede runde Klammerzeile durch — ob Produktionsnotiz oder tatsächlich
 * mitgesungene Zeile (Begleitstimme, Zwischenruf). Der Whisper-Abgleich
 * kann das unterscheiden, die Software musste es nicht mehr raten.
 *
 * ZWEITENS, ZIERZEICHEN UND EMOJI (Zusatz, Caspar_D, 25.09.2026: „ja,
 * will ich so"). Sie fliegen aus dem Zeilentext, bevor er in den Abgleich
 * geht — genauso wie die Klammerzeichen, denn sie sind so wenig Gesang
 * wie eine eckige Regieanweisung. Entfernt werden: Zeichen der Klasse
 * `Extended_Pictographic` (Emoji, samt Variantenselektor U+FE0F und
 * Zusammenführer U+200D), eine Reihe ausdrücklich genannter Symbole
 * (✧ ★ ☆ ♪ ♫ ~ ・ ° 。 ✦ ✿ ❀ ❤ ♡ → ← ↑ ↓ ═ ─ │ ┃ ▪ ▫ ● ○ ■ □ ◆ ◇ und
 * einige gebräuchliche Verwandte), allgemein die Unicode-Kategorien „So"
 * (Symbol, sonstige) und „Sk" (Symbol, Modifikator), Box-/Rahmenzeichen
 * (U+2500–U+257F), sowie Ketten aus drei oder mehr gleichen Sonderzeichen
 * hintereinander, die nicht zu den gewöhnlichen Satzzeichen zählen. Ein
 * entferntes Zeichen wird durch EIN Leerzeichen ersetzt statt ersatzlos
 * gestrichen — sonst verschmölzen zwei Wörter, die nur durch ein
 * Zierzeichen getrennt waren, zu einem, das es nie gab (geprüft an
 * „minor→major"). Mehrfach-Leerzeichen werden danach zusammengezogen.
 * Normale Satzzeichen (, . ! ? ; : – — „ " ' … ¿ ¡ und ähnliche) und
 * Buchstaben und Ziffern jeder Schrift bleiben unangetastet. Eine Zeile,
 * die danach leer ist (reine Zierzeile), fällt wie eine Trennlinie
 * (Zähler `zierZeilen`) — zählt nirgends zur Deckung, bekommt keine Zeit.
 * Zierzeichen zählten schon vorher nicht als eigene Wörter in `woerter()`
 * — bis auf eine Lücke: einzelne japanische Interpunktions- und
 * Dehnungszeichen (・ und die Halbton-Zeichen ゚/゜) liegen im CJK-Bereich,
 * den `woerter()` zeichenweise als Wort zählt („・゚✧" wurde bisher zu
 * zwei „Wörtern"). Weil sie jetzt schon vor der Wortzählung herausfallen,
 * bleibt das ohne weitere Änderung an `woerter()` folgenlos. Zähler je
 * Lied: `zier` (entfernte Zeichen) und `zierZeilen` (gefallene Zeilen).
 *
 * DAS DOPPELVERHÖR (bin/whisper.js). Whisper bekommt den Liedtext als
 * Prompt (senkt seine Fehlerrate), und bislang blieben runde Klammern
 * darin stehen — Whisper konnte also Wörter aus einer Produktionsnotiz
 * „hören", die es nur gelesen hatte. Mit FASSUNG 3 räumt bin/whisper.js
 * seinen Prompt genauso auf wie eckige Klammern schon lange: runde
 * Klammergruppen fliegen aus dem PROMPT (nicht aus dem Katalog), damit
 * künftige Whisper-Läufe unbeeinflusst bleiben. Das ändert nichts an
 * alten Whisper-Läufen — nur an denen, die danach neu laufen.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const K    = require('./katalog.js');

const WURZEL   = path.join(__dirname, '..');
const WHISPER  = path.join(WURZEL, 'library', 'whisper.ndjson');
const ZIEL     = path.join(WURZEL, 'library', 'lyrik.json');

/* Hochzaehlen bei jeder Aenderung am Verfahren (Regeln oben im Kopf-
   kommentar) - steht als `fassung` in library/lyrik.json, damit man
   hinterher weiss, nach welchen Regeln eine Zeile bereinigt wurde. */
const FASSUNG  = 3;

/* Unter dieser Deckung wird nicht gereinigt, sondern gemeldet. 0,60 ist
   nicht geraten: Bei dieser Grenze fallen 14 von 254 Liedern durch, und
   das sind genau die, bei denen Whisper an der Sprache scheitert
   (Plattdeutsch, Japanisch) oder der Text zu mehr als der Hälfte aus
   einer zweiten Fassung besteht. Bei 0,80 wären es 71 — darunter viele,
   die sauber gereinigt werden. */
const DECKUNG_MINDEST = 0.60;

/* Wieviele ungedeckte Zeilen am Stück die Nachbarschaft noch überbrücken
   darf. Drei und mehr sind im Bestand fast immer ein eigener Block. */
const LUECKE_MAX = 2;

/* Unter dieser Standzeit (bis-von) gilt die eigene Whisper-Marke einer
   Zeile als entartet, nicht als gemessen (Caspar_D, 25.09.2026, FASSUNG
   2 - siehe Kopfkommentar, Fehler (a)). Whisper (Verfahren „dtw") gibt
   sehr vielen Wörtern dieselbe Start- und Endzeit; hat eine Zeile nur
   eine solche Marke, ist ihr `von` echt, ihre Standzeit aber nicht. 0,3 s
   ist die Zahl aus Caspar_Ds Befund. */
const STANDZEIT_ENTARTET = 0.3;

/* ---- Wortvergleich ---------------------------------------------------
   CJK-Zeichen zählen einzeln als Wort: Japanisch kennt keine Leerzeichen,
   und Whisper setzt sie anders als der Liedtext. Zeichenweise alignieren
   umgeht die Frage der Wortgrenzen ganz. */
function woerter(text) {
  const aus = [];
  let puffer = '';
  for (const z of String(text).toLowerCase()) {
    const code = z.codePointAt(0);
    const cjk = (code >= 0x3040 && code <= 0x30ff) || (code >= 0x4e00 && code <= 0x9fff);
    if (cjk) { if (puffer) { aus.push(puffer); puffer = ''; } aus.push(z); continue; }
    if (/[a-zäöüß0-9]/.test(z)) puffer += z;
    else if (/['’`´]/.test(z)) continue;          // Elision: finst'rem
    else if (puffer) { aus.push(puffer); puffer = ''; }
  }
  if (puffer) aus.push(puffer);
  return aus;
}

/* Fast gleich: identisch, ein Buchstabe Abstand bei Wörtern ab vier
   Zeichen, oder ein gemeinsamer Anfang von fünf Zeichen. */
function fastGleich(a, b) {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;
  if (Math.abs(a.length - b.length) > 1) {
    let k = 0;
    while (k < a.length && k < b.length && a[k] === b[k]) k++;
    return k >= 5;
  }
  let i = 0, j = 0, fehler = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++fehler > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return fehler + (a.length - i) + (b.length - j) <= 1;
}

/* ---- Alignment -------------------------------------------------------
   Needleman-Wunsch, zwei Zeilen im Speicher, der Weg als Bitfeld. Für
   1200 gegen 1400 Wörter sind das 1,7 MB und Millisekunden.
   Rückgabe je Textwort: der Index des Whisper-Wortes, auf das es fällt,
   oder -1. Der Index trägt später die Zeitmarke. */
function alignieren(a, b) {
  const n = a.length, m = b.length;
  const paar = new Int32Array(n).fill(-1);
  if (!n || !m) return paar;
  const TREFFER = 2, FEHL = -1, LUECKE = -1;
  const weg = new Uint8Array((n + 1) * (m + 1));
  let vor = new Int32Array(m + 1), jetzt = new Int32Array(m + 1);
  for (let j = 0; j <= m; j++) { vor[j] = j * LUECKE; weg[j] = 2; }
  for (let i = 1; i <= n; i++) {
    jetzt[0] = i * LUECKE; weg[i * (m + 1)] = 1;
    for (let j = 1; j <= m; j++) {
      const diag = vor[j - 1] + (fastGleich(a[i - 1], b[j - 1]) ? TREFFER : FEHL);
      const hoch = vor[j] + LUECKE;
      const link = jetzt[j - 1] + LUECKE;
      let best = diag, r = 0;
      if (hoch > best) { best = hoch; r = 1; }
      if (link > best) { best = link; r = 2; }
      jetzt[j] = best; weg[i * (m + 1) + j] = r;
    }
    const t = vor; vor = jetzt; jetzt = t;
  }
  let i = n, j = m;
  while (i > 0 && j > 0) {
    const r = weg[i * (m + 1) + j];
    if (r === 0) { if (fastGleich(a[i - 1], b[j - 1])) paar[i - 1] = j - 1; i--; j--; }
    else if (r === 1) i--;
    else j--;
  }
  return paar;
}

/* Ganze Zeile ist Regie, kein Text - dieselbe Regel wie `istNichtGesungen`
   in web/index.html (dort ~Zeile 16881, per grep gefunden), MINUS die
   runden Klammern (FASSUNG 3, siehe Kopfkommentar: die durchlaufen jetzt
   den Abgleich statt vorab zu fliegen). Die alte Regel fuer eckige
   Klammern (`/^\s*[[(][^\]\)]*[\])]?\s*$/`) scheiterte an einer Klammer IN
   der Anweisung: „[Post-Chorus Hook (instrumental)]" schließt das `)`
   schon vor dem äußeren `]`, danach passt der Rest nicht mehr ins Muster -
   13 solcher Zeilen im Bestand kamen so durch (Caspar_D, 25.09.2026,
   FASSUNG 2). Das Muster fuer eckige Klammern ist gierig und schließt
   über jede innere Klammer hinweg. Die Bühne (istNichtGesungen) lässt
   runde Klammerzeilen ohnehin stehen - sie zeigt den Rohtext. */
const istRegieZeile = (z) => {
  const t = z.trim();
  /* Eine Zeile, die mit einer eckigen Klammer beginnt und nirgends
     schliesst, ist der Anfang einer mehrzeiligen Notiz (Pfeifenwald:
     „[Voix Céleste ... ueber mehrere Zeilen). */
  return /^\[.*\]$/.test(t) || /^\[[^\]]*$/.test(t) || /^#/.test(t) || /^[-=]{3,}/.test(t);
};

/* Regieanweisung MITTEN in einer sonst gesungenen Zeile - „[soft] schau
   sie nur an.", „Sonst hell das Licht. [pause] Heute nur wir." Die alte
   Regel prüfte nur ganze Zeilen; ein Einschub blieb komplett im Text
   stehen und lief mit ins Alignment (190 Zeilen im Bestand, Caspar_D,
   25.09.2026: „das sollte in der bereinigten Lyrics nicht passieren, ist
   ja bereinigt um sowas"). ERKENNEN ohne `g`-Flag (fuer .test, kein
   lastIndex-Zustand), ENTFERNEN mit `g` (fuer .replace, alle Einschübe
   einer Zeile). */
const EINSCHUB_ERKENNEN  = /\[[^\]]*\]/;
const EINSCHUB_ENTFERNEN = /\[[^\]]*\]/g;

/* ---- Zierzeichen und Emoji (FASSUNG 3, Zusatz) -----------------------
   Ausdruecklich genannte Symbole, dazu was `woerter()` als CJK-Zeichen
   falsch fuer ein Wort haelt (・ und die Halbton-Zeichen ゚/゜ liegen im
   Hiragana/Katakana-Block). Kategorien So/Sk und Box-/Rahmenzeichen deckt
   `istZierZeichen` unten allgemein ab; diese Liste faengt nur, was DORT
   NICHT hineinfaellt (Interpunktion nach Unicode, z.B. ・ und 。, oder
   Symbolkategorie „Math", z.B. ~ → ← ↑ ↓), plus die genannten Beispiele
   zur Sicherheit auch dann, wenn eine andere Unicode-Version sie anders
   einordnet. */
const ZIER_EXPLIZIT = new Set([
  /* Das Gradzeichen fehlt hier mit Absicht: "5 °C" ist Text, kein Schmuck (dieselbe Regel wie im Band der Buehne). */
  '✧', '★', '☆', '♪', '♫', '~', '・', '。', '✦', '✩', '✪', '✫', '✬', '✭', '✮', '✯',
  '✿', '❀', '❤', '♡', '→', '←', '↑', '↓', '═', '─', '│', '┃', '▪', '▫', '●', '○', '■', '□', '◆', '◇',
  '〜', '～', '゜', '゚', '゛', '∘', '·',
]);
/* Diese Satzzeichen bleiben immer stehen - auch als Kette von drei oder
   mehr (z.B. „…" oder „..." zum Verklingen, „---" bräuchte sonst die
   eigene Trennlinien-Regel oben, die auf ganze Zeilen zielt). */
const SATZZEICHEN_GESCHUETZT = new Set([
  ',', '.', '!', '?', ';', ':', '–', '—', '„', '"', "'", '…', '¿', '¡', '‘', '’', '“', '”', '-', '(', ')', '[', ']',
]);

function istZierZeichen(ch) {
  if (ZIER_EXPLIZIT.has(ch)) return true;
  const cp = ch.codePointAt(0);
  if (cp === 0xfe0f || cp === 0x200d) return true; // Variationsselektor, Zusammenfuehrer (ZWJ)
  if (cp >= 0x2500 && cp <= 0x257f) return true;   // Box-/Rahmenzeichen
  if (/\p{Extended_Pictographic}/u.test(ch)) return true;
  if (/\p{gc=So}/u.test(ch) || /\p{gc=Sk}/u.test(ch)) return true;
  return false;
}

/* Ein entferntes Zeichen wird durch EIN Leerzeichen ersetzt, nicht
   ersatzlos gestrichen - sonst verschmelzen zwei Wörter, die nur durch
   das Zierzeichen getrennt waren ("minor→major" würde sonst zu
   "minormajor", ein Wort, das es nie gab). Mehrfach-Leerzeichen werden
   danach zusammengezogen, aber NUR wenn ueberhaupt etwas entfernt wurde -
   eine Zeile ohne jedes Zierzeichen bleibt BYTE-GLEICH, aus demselben
   Grund wie beim Einschub-Entfernen oben. */
function zierBereinigen(zeile) {
  const zeichen = Array.from(zeile);
  const aus = [];
  let entfernt = 0;
  let i = 0;
  while (i < zeichen.length) {
    const ch = zeichen[i];
    if (!/[\p{L}\p{N}\s]/u.test(ch) && !SATZZEICHEN_GESCHUETZT.has(ch)) {
      let j = i;
      while (j < zeichen.length && zeichen[j] === ch) j++;
      if (j - i >= 3) { entfernt += (j - i); aus.push(' '); i = j; continue; }
    }
    if (istZierZeichen(ch)) { entfernt++; aus.push(' '); i++; continue; }
    aus.push(ch); i++;
  }
  if (!entfernt) return { text: zeile, entfernt: 0 };
  return { text: aus.join('').replace(/\s+/g, ' ').trim(), entfernt };
}

/* ---- Runde-Klammer-Gruppen, ueber Zeilen hinweg (FASSUNG 3) -----------
   Zerlegt jede NICHT-Regiezeile in Stuecke: Klartext (gruppe: null) und
   Klammerinhalt (gruppe: fortlaufende Nummer). Eine Gruppe ist EINE
   runde Klammer von ihrem `(` bis zu ihrem `)` - auch wenn dazwischen
   mehrere Zeilen liegen (Zustand `tiefe`/`aktuelleGruppe` läuft über die
   `forEach`-Schleife hinweg mit). Verschachtelte Klammern bilden keine
   eigene Gruppe, sie bleiben Teil der aeusseren. Die Klammerzeichen
   selbst gehen in keinem Stueck mit - sie fliegen so oder so raus. */
function gruppenExtrahieren(zeilen) {
  let tiefe = 0, naechsteId = 0, aktuelleGruppe = null;
  const segmenteJeZeile = [];
  const gruppen = new Map();
  zeilen.forEach((z, zi) => {
    if (istRegieZeile(z)) { segmenteJeZeile.push([{ text: '', gruppe: null }]); return; }
    const segs = [];
    let puffer = '';
    for (const ch of z) {
      if (ch === '(') {
        if (tiefe === 0) {
          segs.push({ text: puffer, gruppe: null }); puffer = '';
          naechsteId++; aktuelleGruppe = naechsteId;
          gruppen.set(naechsteId, { start: zi, ende: zi });
        }
        tiefe++;
        continue;
      }
      if (ch === ')') {
        if (tiefe > 0) tiefe--;
        if (tiefe === 0 && aktuelleGruppe !== null) {
          segs.push({ text: puffer, gruppe: aktuelleGruppe }); puffer = '';
          gruppen.get(aktuelleGruppe).ende = zi;
          aktuelleGruppe = null;
        }
        continue;
      }
      puffer += ch;
    }
    segs.push({ text: puffer, gruppe: tiefe > 0 ? aktuelleGruppe : null });
    segmenteJeZeile.push(segs);
  });
  return { gruppen, segmenteJeZeile };
}

/* Eine Zeitspanne [von, bis) der Reihe nach auf eine Gruppe von Zeilen
   verteilen, nach Zeichenzahl der Zeile — eine lange Zeile bekommt mehr
   Standzeit als „Ja." nebenan. Mutiert die Objekte der Liste direkt.
   Genutzt für beide Zeitfehler aus FASSUNG 2 (siehe Kopfkommentar):
   die entartete Zeile mit ihren geschätzten Nachbarn, und zwei Zeilen
   auf derselben Spanne. Mindestens ein Zeichen je Zeile, damit eine
   leere Zeile nicht mit Gewicht 0 dasteht. */
function verteilenNachZeichen(gruppe, von, bis) {
  const laengen = gruppe.map(g => Math.max(1, g.text.length));
  const gesamt = laengen.reduce((a, b) => a + b, 0);
  const spanne = bis - von;
  let cursor = von;
  gruppe.forEach((g, idx) => {
    const ende = idx === gruppe.length - 1 ? bis : +(cursor + spanne * laengen[idx] / gesamt).toFixed(2);
    g.von = +cursor.toFixed(2);
    g.bis = ende;
    cursor = ende;
  });
}

/* ---- Ein Lied reinigen ----------------------------------------------- */
function reinigen(lyrics, marken) {
  /* Schritt 1: eckige Regie/Einschuebe - UNVERAENDERT wie in FASSUNG 2.
     Zeilen ohne Einschub bleiben BYTE-GLEICH (kein trim, keine
     Leerzeichen-Normierung) — sonst wäre ein Lied ohne jeden Regie-Tag
     nicht mehr bitgleich zur vorigen Fassung. Ganze Regiezeilen
     (`istRegieZeile`) bleiben unangetastet, sie fliegen weiter unten
     komplett raus. */
  let einschuebeEntfernt = 0, inEckig = false;
  const zeilenEckig = String(lyrics || '').split('\n').map(z => {
    /* MEHRZEILIGE ECKIGE NOTIZ (25.09.2026, Gegenlesen der Fassung 3): oeffnet eine Zeile eine eckige Klammer und
       schliesst sie nicht, sind auch die folgenden Zeilen Regie, bis eine ein ] traegt. Vorher rutschten Mittel-
       und Schlusszeilen als Text durch und wurden teils sogar ueber die Luecken-Rettung "gerettet" (Pfeifenwald,
       10 Zeilen mit ] im Ergebnis). Die Folgezeilen werden in eckige Klammern gesetzt, damit istRegieZeile sie
       ueberall weiter unten als Regie erkennt - der Text selbst faellt ohnehin. */
    if (inEckig) {
      if (!z.includes(']')) return '[' + z.trim() + ']';
      inEckig = false; const rest = z.slice(z.indexOf(']') + 1).trim();
      return rest ? rest : '[]';   /* was nach dem ] steht, ist wieder Text; sonst bleibt die Zeile Regie */
    }
    { const o = z.lastIndexOf('['); if (o >= 0 && z.indexOf(']', o) < 0) {   /* oeffnet, schliesst nicht - auch mitten in der Zeile */
        inEckig = true; const vor = z.slice(0, o).trim(); return vor ? vor : z; } }
    if (istRegieZeile(z)) return z;
    if (!EINSCHUB_ERKENNEN.test(z)) return z;
    einschuebeEntfernt++;
    return z.replace(EINSCHUB_ENTFERNEN, ' ').replace(/\s+/g, ' ').trim();
  });

  /* Schritt 2: Zierzeichen/Emoji raus - vor dem Alignment, wie die
     eckigen Klammern (FASSUNG 3, Zusatz, siehe Kopfkommentar). Eine
     Zeile, die dadurch leer wird, ist eine reine Zierzeile und faellt
     wie eine Trennlinie - eigener Zustand `zier`, siehe unten. */
  let zierEntfernt = 0, zierZeilenAnzahl = 0;
  const zierLeer = new Array(zeilenEckig.length).fill(false);
  const zeilen = zeilenEckig.map((z, i) => {
    if (istRegieZeile(z)) return z;
    const r = zierBereinigen(z);
    if (!r.entfernt) return z;
    zierEntfernt += r.entfernt;
    /* "Leer" heisst hier: kein Buchstabe, keine Ziffer mehr uebrig - nicht
       nur "der String ist leer". Sonst wuerde liegen gebliebene Interpunktion
       ("* :*", uebrig von "✧・゚: *✧・゚:*") die Zeile als "gesungen" durchgehen
       lassen (gefunden im Probelauf: `woerter()` liefert dafuer null Woerter,
       und ohne diese Praezisierung faellt die Zeile in denselben Zweig wie
       eine gehoerte Klammergruppe). */
    if (!/[\p{L}\p{N}]/u.test(r.text)) { zierLeer[i] = true; zierZeilenAnzahl++; return ''; }
    return r.text;
  });

  /* Schritt 3: runde Klammern in Gruppen zerlegen - sie fliegen NICHT
     vorab, sie durchlaufen den Abgleich (FASSUNG 3, siehe Kopfkommentar).
     Eine zier-geleerte Zeile hat nichts mehr, in dem noch eine Klammer
     stehen könnte - `gruppenExtrahieren` sieht dort einfach eine leere
     Zeile. */
  const { gruppen, segmenteJeZeile } = gruppenExtrahieren(zeilen);

  const bTexte = marken.map(w => String(w[2]));
  const bW = [], bZuMarke = [];
  bTexte.forEach((t, mi) => { for (const w of woerter(t)) { bW.push(w); bZuMarke.push(mi); } });
  if (bW.length < 20) return { grund: 'Whisper hat zu wenig gehört', deckung: 0 };

  /* aW enthaelt jetzt AUCH die Woerter aus runden Klammern, mit ihrer
     Gruppen-Nummer markiert (aZuGruppe) - sie durchlaufen dasselbe
     Alignment wie der Rest, zaehlen aber unten NICHT zur Deckung. */
  const aW = [], aZuZeile = [], aZuGruppe = [];
  zeilen.forEach((z, zi) => {
    if (istRegieZeile(z)) return;
    for (const seg of segmenteJeZeile[zi]) {
      for (const w of woerter(seg.text)) { aW.push(w); aZuZeile.push(zi); aZuGruppe.push(seg.gruppe); }
    }
  });
  if (aW.length < 10) return { grund: 'zu wenig Text', deckung: 0 };

  /* ZWEI SCHRIFTEN, KEIN ALIGNMENT (gefunden 07.09.2026). Bei den
     japanischen Liedern steht der Text in japanischer Schrift, Whisper
     aber schreibt lateinische Umschrift und übersetzt streckenweise ins
     Englische: „本物が見える" gegen „HONMONO NO MAMORI HITOYO / I can see
     the real thing". Zeichenweise alignieren hilft da nicht — es sind
     verschiedene Alphabete. Das ist kein Fehler des Verfahrens, und es
     soll auch nicht als „0 % gedeckt" durchgehen, was nach schlechtem
     Gesang klänge. Eine Umschrift wäre der Weg, wenn es je nötig wird. */
  const cjkAnteil = (liste) => {
    if (!liste.length) return 0;
    let n = 0;
    for (const w of liste) if (/[぀-ヿ一-鿿]/.test(w)) n++;
    return n / liste.length;
  };
  const cjkText = cjkAnteil(aW), cjkGehoert = cjkAnteil(bW);
  if (cjkText > 0.3 && cjkGehoert < 0.05)
    return { grund: 'Text in japanischer Schrift, Whisper in Umschrift', deckung: 0, schriftbruch: true };

  const paar = alignieren(aW, bW);

  /* Je runder Klammergruppe: gehört, wenn mindestens die Hälfte ihrer
     eigenen Wörter aligniert ist (FASSUNG 3). Eine Gruppe ohne ein
     einziges Wort (leere Klammer „()") zählt als nicht gehört - da ist
     nichts, das Whisper hätte hören können. */
  const gruppenN = new Map(), gruppenGut = new Map();
  paar.forEach((p, k) => {
    const g = aZuGruppe[k];
    if (g === null) return;
    gruppenN.set(g, (gruppenN.get(g) || 0) + 1);
    if (p >= 0) gruppenGut.set(g, (gruppenGut.get(g) || 0) + 1);
  });
  const gruppeGehoert = new Map();
  let klammerGehoertAnzahl = 0, klammerGestrichenAnzahl = 0;
  for (const gid of gruppen.keys()) {
    const n = gruppenN.get(gid) || 0;
    const gut = gruppenGut.get(gid) || 0;
    const gehoert = n > 0 && gut / n >= 0.5;
    gruppeGehoert.set(gid, gehoert);
    if (gehoert) klammerGehoertAnzahl++; else klammerGestrichenAnzahl++;
  }

  /* Je Zeile: wieviele Wörter, wieviele gedeckt, und die Whisper-Marken,
     auf die sie fallen - NUR aus Wörtern AUSSERHALB jeder Klammer
     (Caspar_D, 25.09.2026: „Deckung würde ich immer ohne eckige und
     runde Klammern berechnen, das ist dann sicher"). Klammerwörter
     zählen hier nie mit, gehört oder nicht. */
  const proZeile = new Map();
  paar.forEach((p, k) => {
    if (aZuGruppe[k] !== null) return;
    const zi = aZuZeile[k];
    if (!proZeile.has(zi)) proZeile.set(zi, { n: 0, gut: 0, marken: [] });
    const e = proZeile.get(zi);
    e.n++;
    if (p >= 0) { e.gut++; e.marken.push(bZuMarke[p]); }
  });
  /* Die Wörter einer GEHÖRTEN Gruppe liefern der Zeile trotzdem ihre
     Zeitmarken, wie jedes andere Wort - nur die Deckung zählen sie nicht
     (Kopfkommentar: „Die Wörter einer gehörten Gruppe liefern der Zeile
     ihre Zeitmarken wie jedes andere Wort auch"). */
  paar.forEach((p, k) => {
    const g = aZuGruppe[k];
    if (g === null || !gruppeGehoert.get(g) || p < 0) return;
    const zi = aZuZeile[k];
    if (!proZeile.has(zi)) proZeile.set(zi, { n: 0, gut: 0, marken: [] });
    proZeile.get(zi).marken.push(bZuMarke[p]);
  });

  /* Zeilentext nach dem Klammer-Entscheid: nicht gehörte Gruppen raus,
     gehörte bleiben - beide ohne ihre Klammerzeichen (die fliegen immer,
     Kopfkommentar). Eine Zeile ohne jede Klammer bleibt BYTE-GLEICH. */
  const zeilenText = zeilen.map((z, i) => {
    if (istRegieZeile(z)) return z;
    if (zierLeer[i]) return '';
    const segs = segmenteJeZeile[i];
    if (segs.length === 1 && segs[0].gruppe === null) return z;
    let veraendert = false;
    const stuecke = segs.map(seg => {
      if (seg.gruppe === null) return seg.text;
      veraendert = true;
      return gruppeGehoert.get(seg.gruppe) ? seg.text : '';
    });
    return veraendert ? stuecke.join('').replace(/\s+/g, ' ').trim() : z;
  });

  const zustand = zeilen.map((z, i) => {
    if (istRegieZeile(z)) return 'regie';
    if (zierLeer[i]) return 'zier';
    const e = proZeile.get(i);
    /* Keine Wörter ausserhalb einer Klammer: die Zeile bestand nur aus
       einer oder mehreren runden Klammern. Ob sie „gesungen" zählt,
       entscheidet dann, ob am Ende noch Text übrig ist (mindestens eine
       ihrer Gruppen wurde gehört) - Kopfkommentar: „Eine Zeile, die nur
       aus einer nicht gehörten Gruppe bestand, ist danach leer und fällt
       ganz." */
    if (!e || e.n === 0) {
      /* Nur wenn auf dieser Zeile ueberhaupt eine runde Klammer sass,
         haengt "gesungen oder leer" vom Gehoert-Status ab. Jede andere
         Zeile ohne zaehlbares Wort bleibt wie in FASSUNG 1/2 schlicht
         "leer" - unveraendertes Verhalten fuer alles ausserhalb der neuen
         Klammerregel (z.B. eine Zeile in einer Schrift, die `woerter()`
         gar nicht tokenisiert). */
      const hatKlammer = segmenteJeZeile[i].some(seg => seg.gruppe !== null);
      if (!hatKlammer) return 'leer';
      return zeilenText[i] ? 'gesungen' : 'leer';
    }
    return e.gut / e.n >= 0.5 ? 'gesungen' : 'offen';
  });

  /* Offene Zeilen zwischen gesungenen retten — höchstens LUECKE_MAX am
     Stück, und nur, wenn auf beiden Seiten wirklich gesungen wird.
     `zier` läuft als Füllzustand mit, wie `leer` und `regie`. */
  for (let i = 0; i < zustand.length; i++) {
    if (zustand[i] !== 'offen') continue;
    let j = i;
    while (j < zustand.length && (zustand[j] === 'offen' || zustand[j] === 'leer' || zustand[j] === 'regie' || zustand[j] === 'zier')) j++;
    const offen = [];
    for (let k = i; k < j; k++) if (zustand[k] === 'offen') offen.push(k);
    const davor = zustand.slice(0, i).filter(x => x === 'gesungen' || x === 'offen').pop();
    const danach = zustand.slice(j).find(x => x === 'gesungen' || x === 'offen');
    if (offen.length <= LUECKE_MAX && davor === 'gesungen' && danach === 'gesungen')
      for (const k of offen) zustand[k] = 'gerettet';
    i = j - 1;
  }

  /* Zeilen bauen. Zeitmarken aus den Whisper-Marken der Zeile; gerettete
     Zeilen bekommen die Lücke zwischen ihren Nachbarn und tragen das
     ausdrücklich als `geschaetzt`. Eine Zeile, deren eigene Marken auf
     eine Standzeit unter STANDZEIT_ENTARTET zusammenfallen (`von`/`bis`
     fast oder ganz gleich), bekommt vorerst KEIN `bis` — ihr `von` ist
     echt, ihre Standzeit nicht (Fehler (a), FASSUNG 2, Kopfkommentar). */
  const behalten = [];
  zeilen.forEach((z, i) => {
    if (zustand[i] !== 'gesungen' && zustand[i] !== 'gerettet') return;
    const e = proZeile.get(i);
    /* Verirrte Klammerzeichen (ein ] ohne [, ein [ ohne ]) stehen im Ergebnis nie - sie sind nie Gesang. */
    const text = (/[\[\]]/.test(zeilenText[i]) ? zeilenText[i].replace(/[\[\]]/g, ' ').replace(/\s+/g, ' ') : zeilenText[i]).trim();   /* nur Zeilen mit Klammer anfassen - alle anderen bleiben bytegleich */
    if (!text) return;
    if (e && e.marken.length) {
      const mi = e.marken;
      const von = Math.min(...mi.map(x => marken[x][0]));
      const bis = Math.max(...mi.map(x => marken[x][1]));
      const roh = { von: +von.toFixed(2), bis: +bis.toFixed(2), text };
      if (roh.bis - roh.von < STANDZEIT_ENTARTET) { roh.bis = null; roh.entartet = true; }
      behalten.push(roh);
    } else {
      behalten.push({ von: null, bis: null, text, geschaetzt: true });
    }
  });

  /* FEHLER (b), FASSUNG 2: zwei echte (nicht entartete) Zeilen hinter-
     einander auf exakt derselben Spanne — dieselben Whisper-Marken wurden
     beiden zugeschlagen. Die eine gemessene Spanne wird nach Zeichenzahl
     zwischen ihnen geteilt, statt beiden verdoppelt zu gehören. */
  let zeitAngepasstAnzahl = 0;
  for (let i = 0; i < behalten.length; i++) {
    if (behalten[i].von === null || behalten[i].entartet) continue;
    let j = i + 1;
    while (j < behalten.length && !behalten[j].entartet
           && behalten[j].von === behalten[i].von && behalten[j].bis === behalten[i].bis) j++;
    if (j - i < 2) { i = j - 1; continue; }
    const gruppe = behalten.slice(i, j);
    verteilenNachZeichen(gruppe, behalten[i].von, behalten[i].bis);
    for (let k = i; k < j; k++) behalten[k].zeitAngepasst = true;
    zeitAngepasstAnzahl += j - i;
    i = j - 1;
  }

  /* FEHLER (a), FASSUNG 2: die entartete Zeile und ihre `geschaetzt`en
     Nachbarn zusammen in die Lücke bis zur nächsten ECHTEN (nicht
     entarteten) Marke legen. Ein Lauf OHNE jede entartete Zeile bekommt
     exakt die alte Gleichverteilung (spanne/anzahl) — bitgleich zur
     vorigen Fassung. Ein Lauf MIT mindestens einer entarteten Zeile wird
     an deren `von` als Fixpunkt in Teilstücke zerlegt, jedes Teilstück
     nach Zeichenzahl geteilt: die entartete Zeile bekommt so ihre
     Standzeit aus der Spanne bis zur nächsten echten Marke, statt bei
     sich selbst (Dauer 0) zu enden. Ohne eine echte Marke am Ende bleibt
     die entartete Zeile bei ihrer alten, unveränderten Standzeit (Dauer
     0) — eine erfundene Zeit wäre schlimmer als keine. */
  let standzeitGeschaetztAnzahl = 0;
  for (let i = 0; i < behalten.length; i++) {
    if (behalten[i].bis !== null) continue;
    let j = i; while (j < behalten.length && behalten[j].bis === null) j++;
    const a = i - 1, b = j;
    if (b >= behalten.length) { i = j; continue; } // kein Ende in Sicht - unveraendert lassen (wie bisher)
    const hatFixpunkt = behalten.slice(i, j).some(z => z.von !== null);
    if (!hatFixpunkt) {
      /* Alter Weg, unveraendert: Gleichverteilung ueber den ganzen Lauf.
         Braucht eine Zeile davor (`a`), sonst wie bisher unveraendert. */
      if (a < 0) { i = j; continue; }
      const spanne = behalten[b].von - behalten[a].bis;
      const anzahl = j - i;
      if (spanne > 0 && anzahl >= 1) {
        const teil = spanne / anzahl;
        for (let k = i; k < j; k++) {
          behalten[k].von = +(behalten[a].bis + (k - i) * teil).toFixed(2);
          behalten[k].bis = +(behalten[a].bis + (k - i + 1) * teil).toFixed(2);
        }
      }
    } else {
      /* Neuer Weg: an jedem bekannten `von` (entartete Zeile) in Gruppen
         zerlegen, jede Gruppe fuer sich nach Zeichenzahl verteilen. Steht
         der erste Fixpunkt schon an Position `i` selbst (die entartete
         Zeile beginnt den Lauf), braucht die erste Gruppe kein `a` -
         ihr Start ist der Fixpunkt selbst. Nur eine FÜHRENDE Gruppe rein
         geschätzter Zeilen VOR dem ersten Fixpunkt braucht `a.bis`. */
      const segVonAnfang = behalten[i].von !== null ? behalten[i].von : (a >= 0 ? behalten[a].bis : null);
      if (segVonAnfang === null) { i = j; continue; } // kein Anker vorn - unveraendert lassen
      let segStart = i, segVon = segVonAnfang;
      for (let p = i + 1; p <= j; p++) {
        const istGrenze = p === j || behalten[p].von !== null;
        if (!istGrenze) continue;
        const segBis = p === j ? behalten[b].von : behalten[p].von;
        if (segBis > segVon) {
          verteilenNachZeichen(behalten.slice(segStart, p), segVon, segBis);
          for (let k = segStart; k < p; k++) {
            if (!behalten[k].entartet) continue;
            behalten[k].standzeitGeschaetzt = true;
            standzeitGeschaetztAnzahl++;
          }
        }
        segStart = p; segVon = segBis;
      }
    }
    i = j - 1;
  }

  /* Übrig gebliebene entartete Zeilen ohne echte Marke danach (Rand des
     Lieds, kein `b` gefunden): auf die alte, unveränderte Standzeit
     (Dauer 0) zurückfallen — s.o. Das interne `entartet`-Merkzeichen
     gehört nicht in die Ausgabe. */
  for (const z of behalten) {
    if (!z.entartet) continue;
    if (z.bis === null) z.bis = z.von;
    delete z.entartet;
  }

  /* worteGesamt/worteBehalten zaehlen NUR Woerter ausserhalb jeder
     Klammer (proZeile.n ist bereits so gebaut) - die Deckung eines
     Lieds rechnet nie mit Klammerinhalt, gehört oder nicht. */
  const worteGesamt = aZuGruppe.filter(g => g === null).length;
  const worteBehalten = zeilen.reduce((a, z, i) =>
    a + ((zustand[i] === 'gesungen' || zustand[i] === 'gerettet') && proZeile.has(i) ? proZeile.get(i).n : 0), 0);
  const gestrichen = zeilen
    .map((z, i) => (zustand[i] === 'offen' ? (zeilenText[i] || z).trim() : null))
    .filter(Boolean);
  const regieZeilen = zustand.filter(x => x === 'regie').length;

  return {
    deckung: worteGesamt ? worteBehalten / worteGesamt : 0,
    zeilen: behalten,
    worte: worteBehalten,
    worteRoh: worteGesamt,
    gestrichen,
    regieZeilen,
    einschuebeEntfernt,
    zeitAngepasst: zeitAngepasstAnzahl,
    standzeitGeschaetzt: standzeitGeschaetztAnzahl,
    gerettet: zustand.filter(x => x === 'gerettet').length,
    geschaetzt: behalten.filter(z => z.geschaetzt).length,
    klammerGehoert: klammerGehoertAnzahl,
    klammerGestrichen: klammerGestrichenAnzahl,
    zier: zierEntfernt,
    zierZeilen: zierZeilenAnzahl,
  };
}

/* ---- Lauf ------------------------------------------------------------ */
function whisperLesen() {
  const m = new Map();
  if (!fs.existsSync(WHISPER)) return m;
  for (const z of fs.readFileSync(WHISPER, 'utf8').trim().split('\n')) {
    if (!z.trim()) continue;
    try { const e = JSON.parse(z); if (e.worte && e.worte.length) m.set(e.id, e.worte); }
    catch (err) { /* eine kaputte Zeile darf den Lauf nicht kippen */ }
  }
  return m;
}

function main() {
  const args = process.argv.slice(2);
  const tun = args.includes('--tun');
  const nurUnsicher = args.includes('--unsicher');
  const einer = args.find(a => /^[0-9a-f-]{30,}$/i.test(a)) || null;

  const kat = K.lesen();
  if (!kat) { console.log('  Kein Katalog.'); process.exit(1); }
  const whisper = whisperLesen();
  if (!whisper.size) { console.log('  Keine Whisper-Marken — library/whisper.ndjson fehlt.'); process.exit(1); }

  const lieder = {};
  const unsicher = [];
  let gerechnet = 0, wortSumme = 0, rohSumme = 0;

  for (const s of Object.values(kat.songs)) {
    if (einer && s.id !== einer) continue;
    if (!s.lyrics || !s.lyrics.trim()) continue;
    const marken = whisper.get(s.id);
    if (!marken) { unsicher.push({ id: s.id, titel: s.titel, grund: 'kein Whisper-Lauf' }); continue; }

    const e = reinigen(s.lyrics, marken);
    gerechnet++;
    if (!e.zeilen || e.deckung < DECKUNG_MINDEST) {
      unsicher.push({ id: s.id, titel: s.titel,
        grund: e.grund || `nur ${(100 * e.deckung).toFixed(0)} % gedeckt`,
        deckung: +e.deckung.toFixed(3) });
      continue;
    }
    wortSumme += e.worte; rohSumme += e.worteRoh;
    lieder[s.id] = {
      deckung: +e.deckung.toFixed(3),
      worte: e.worte,
      zeilen: e.zeilen,
      gestrichen: e.gestrichen.length,
      geschaetzt: e.geschaetzt,
      /* NEU in FASSUNG 2 (Caspar_D, 25.09.2026) - getrennt von `gestrichen`
         gehalten, das weiterhin nur die UNGEWISSEN (unter Deckungsgrenze
         gefallenen) Zeilen zaehlt. Diese hier sind SICHER keine Lyrics
         (Regie) bzw. reine Zeit-Korrekturen, nichts Ungewisses. */
      regie: e.regieZeilen,
      einschuebe: e.einschuebeEntfernt,
      zeitAngepasst: e.zeitAngepasst,
      standzeitGeschaetzt: e.standzeitGeschaetzt,
      /* NEU in FASSUNG 3 (Caspar_D, 25.09.2026) - runde Klammern (gehört
         vs. gestrichen) und Zierzeichen/Emoji, siehe Kopfkommentar. */
      klammerGehoert: e.klammerGehoert,
      klammerGestrichen: e.klammerGestrichen,
      zier: e.zier,
      zierZeilen: e.zierZeilen,
    };

    if (einer) {
      console.log(`\n  ${s.titel}`);
      console.log(`  Deckung ${(100 * e.deckung).toFixed(0)} % · ${e.worte} von ${e.worteRoh} Wörtern · `
        + `${e.regieZeilen} Regiezeilen · ${e.einschuebeEntfernt} Zeilen mit Einschub bereinigt · `
        + `${e.gerettet} Zeilen durch Nachbarschaft gerettet · ${e.geschaetzt} Zeitmarken geschätzt · `
        + `${e.standzeitGeschaetzt} Standzeiten nachgeschätzt · ${e.zeitAngepasst} Zeiten wegen `
        + `doppelter Marken angepasst · ${e.klammerGehoert} Klammergruppen gehört · `
        + `${e.klammerGestrichen} Klammergruppen gestrichen · ${e.zier} Zierzeichen entfernt · `
        + `${e.zierZeilen} Zierzeilen gefallen`);
      console.log('\n  --- bereinigt ---');
      for (const z of e.zeilen)
        console.log(`  ${z.von === null ? '   ?  ' : String(z.von).padStart(6)}  ${z.text}`
          + `${z.geschaetzt ? '   (Zeit geschätzt)' : ''}${z.standzeitGeschaetzt ? '   (Standzeit nachgeschätzt)' : ''}`
          + `${z.zeitAngepasst ? '   (Zeit angepasst, doppelte Marken)' : ''}`);
      if (e.gestrichen.length) {
        console.log('\n  --- gestrichen ---');
        for (const g of e.gestrichen) console.log(`  ${g.slice(0, 90)}`);
      }
      return;
    }
  }

  if (nurUnsicher) {
    console.log(`\n  ${unsicher.length} Lied(er) werden nicht gereinigt:\n`);
    for (const u of unsicher.sort((a, b) => (a.deckung || 0) - (b.deckung || 0)))
      console.log(`  ${String(u.deckung != null ? (100 * u.deckung).toFixed(0) + ' %' : '—').padStart(5)}  ${(u.titel || u.id).slice(0, 52)}   ${u.grund}`);
    return;
  }

  const anzahl = Object.keys(lieder).length;
  console.log(`\n  Bereinigte Lyrik · Fassung ${FASSUNG}`);
  console.log(`  ${gerechnet} Lieder mit Text und Whisper gerechnet.`);
  console.log(`  ${anzahl} gereinigt, ${unsicher.length} zurückgestellt (unter ${(100 * DECKUNG_MINDEST).toFixed(0)} % Deckung).`);
  if (rohSumme) console.log(`  ${rohSumme - wortSumme} von ${rohSumme} Wörtern gestrichen `
    + `(${(100 * (rohSumme - wortSumme) / rohSumme).toFixed(0)} %) — Vorreden, Widmungen, zweite Sprachfassungen.`);

  if (!tun) { console.log(`\n  Nichts geschrieben. Mit --tun schreibt es nach library/lyrik.json.`); return; }

  const aus = {
    stand: new Date().toISOString(),
    fassung: FASSUNG,
    verfahren: 'Regieanweisungen fliegen vor dem Alignment: ganze Zeilen in eckigen Klammern, '
      + 'mit „#" oder als Trennlinie, dazu Einschübe wie „[soft]" mitten in einer Zeile. Runde '
      + 'Klammern fliegen NICHT vorab - sie durchlaufen den Abgleich wie der Text drumherum; hat '
      + 'Whisper mindestens die Hälfte der Wörter einer Klammergruppe gehört, bleibt ihr Text in der '
      + 'Zeile, sonst fällt die Gruppe (eine Zeile, die nur aus einer nicht gehörten Gruppe bestand, '
      + 'fällt ganz); Klammerzeichen selbst stehen im Ergebnis nie. Zierzeichen und Emoji fliegen '
      + 'ebenso vor dem Abgleich raus, eine danach leere Zeile fällt wie eine Trennlinie. Die Deckung '
      + '(und das gesungen/offen-Kriterium je Zeile) zählt nie ein Wort aus einer Klammer, gehört oder '
      + 'nicht. Liedtext gegen die Whisper-Marken aligniert (Needleman-Wunsch, ein Buchstabe Abstand '
      + `erlaubt); ungedeckte Zeilen zwischen gedeckten bleiben (höchstens ${LUECKE_MAX} am Stück). `
      + 'Zeitanker aus denselben Whisper-Marken (auch aus gehörten Klammergruppen); Zeilen ohne eigene '
      + 'Marke tragen geschaetzt und liegen interpoliert zwischen ihren Nachbarn, anteilig nach '
      + `Zeichenzahl. Eine Zeile mit einer entarteten Marke (Standzeit unter ${STANDZEIT_ENTARTET} s - `
      + 'Whisper gibt vielen Wörtern dieselbe Start- und Endzeit) trägt standzeitGeschaetzt und bekommt '
      + 'ihre Standzeit ebenso aus der Spanne bis zur nächsten echten Marke; zwei Zeilen auf identischen '
      + `Marken tragen zeitAngepasst und teilen sich die eine gemessene Spanne. Unter `
      + `${(100 * DECKUNG_MINDEST).toFixed(0)} % Deckung wird nicht gereinigt.`,
    quelle: 'library/whisper.ndjson',
    mindestDeckung: DECKUNG_MINDEST,
    unsicher,
    lieder,
  };
  fs.writeFileSync(ZIEL, JSON.stringify(aus));
  const kb = (fs.statSync(ZIEL).size / 1024).toFixed(0);
  console.log(`\n  Geschrieben: library/lyrik.json (${kb} KB).`);
}

if (require.main === module) main();
module.exports = { reinigen, woerter, fastGleich, alignieren, gruppenExtrahieren, zierBereinigen, istZierZeichen };
