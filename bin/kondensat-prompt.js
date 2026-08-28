/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ============================================================
   Die Aufgabe "Kondensiere den Liedtext auf zehn Substantive"
   ------------------------------------------------------------
   HIER steht sie, und nur hier. Jeder Lauf - lokal ueber Ollama,
   ueber ein grosses Modell, kuenftig vielleicht ueber ein anderes -
   holt sie aus dieser Datei.

   WARUM AN EINER STELLE: Beim ersten Durchgang stand der Prompt
   zweimal, einmal im Ollama-Skript und einmal im Auftrag an das
   grosse Modell. Die beiden liefen auseinander, und der Vergleich
   der Modellgroessen mass am Ende den Unterschied der Prompts mit.
   Das darf nicht wieder passieren.

   DIE BEGRUENDUNG JEDER REGEL steht in docs/KONDENSAT-REGELN.md,
   mit Datum, Zitat und Messwert. Wer hier etwas aendert, aendert
   sie dort mit und zaehlt FASSUNG hoch - sonst weiss hinterher
   niemand mehr, welches Kondensat nach welchen Regeln entstand.
   ============================================================ */
'use strict';

/* Hochzaehlen bei jeder Aenderung am Text unten. Steht im Archiv bei
   jedem Kondensat dabei. */
const FASSUNG = 2;

const REGELN = `Kondensiere den Liedtext auf ZEHN SUBSTANTIVE.

- Genau zehn. Kein Wort zweimal.
- Nur Substantive, Einzahl, DEUTSCH - auch bei englischen oder
  japanischen Texten. Keine Adjektive, keine Verben.
- Geordnet vom Kennzeichnendsten zum Allgemeineren.
- Nenne das Thema, nicht das Vokabular. Ein Wort darf im Text gar
  nicht vorkommen, wenn es beschreibt, wovon er handelt.
- BENUTZT DAS LIED EIN BILD, so nenne BEIDE Ebenen: das Bild und das
  Gemeinte. Ein Beziehungslied in Schachbildern bekommt sowohl
  "Schachpartie" als auch "Annaeherung" - sonst landet es bei
  Schachliedern statt bei verpassten Gelegenheiten.
- Nimm das Wort, das am genauesten passt, auch wenn es gewoehnlich
  ist. FUER DASSELBE THEMA IMMER DASSELBE WORT - nicht jedesmal ein
  anderes Synonym. Zehn Liebeslieder mit zehn verschiedenen Woertern
  fuer Liebe zu etikettieren streut sie ueber die halbe Karte.
- Kennzeichnend heisst: ein Lied ueber ein anderes Thema bekaeme
  diese Substantive NICHT. Wenn zwei verschiedene Lieder dieselbe
  Liste bekaemen, fielen sie in der Karte aufeinander.
- Eigennamen nur, wenn die Figur das Thema IST (Klabautermann,
  Erlkoenig) - nicht fuer Nebenfiguren.
- Nimm nur Woerter, die zu DIESEM Text gehoeren. Nichts aus dieser
  Anweisung uebernehmen.`;

/* Reihenfolge: erst der Text, dann die Aufgabe. Bei kleinen Modellen
   wirkt die zuletzt gelesene Anweisung staerker, und das Material
   steht so klar davor statt dahinter. */
const einzeln = (text) =>
  'Hier ist ein Liedtext:\n\n---\n' + text + '\n---\n\n' + REGELN
  + '\n\nAntworte AUSSCHLIESSLICH mit den zehn Substantiven, durch Komma'
  + ' getrennt, in einer Zeile. Keine Nummerierung, keine Erklaerung,'
  + ' kein Vorspann.';

/* Fuer Modelle, die ein ganzes Buendel auf einmal bekommen und ihre
   Antwort strukturiert zurueckgeben. */
const gebuendelt = () =>
  REGELN + '\n\nLies jeden Text GANZ, bevor du entscheidest - die Pointe'
  + ' steht oft am Ende. Arbeite die Lieder der Reihe nach ab und lass'
  + ' keines aus.';

module.exports = { FASSUNG, REGELN, einzeln, gebuendelt };
