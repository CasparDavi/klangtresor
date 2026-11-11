// Stand des Kerns. Wer die Rechnung ändert, erhöht die Version – dann wird der ganze Bestand neu gerechnet
// (Gemeinsame Grundlage: alle Einträge gleich entstanden).
// 2026-11-11.1: Einsilber am Zeilenende in die Hebung (de, en), englische Betonung aus Gutenberg-Versen
// (kern/betonung-vers-en.json), unreine Reime nach der Verslehre (mir/Tür, u:ü, Dehnungs-h, g:ch), Kommentarzeilen (#),
// Platzhalter/Lücken, Vers- und Strophenformen (formen.mjs)
// 2026-11-11.2: weitere Abschnittsnamen (Vers, Pre Chorus mit Leerzeichen, Post Chorus, Epilog, Prolog, Prelude, Coda)
// 2026-11-11.3: Betonungsliste aus dem Duden-Wissensnetz (kern/betonung-korrektur-de.tsv, bin/duden-betonung.mjs) –
// 13 417 Wörter, die das Lexikon nicht kennt und deren gerechnete Betonung der Duden anders setzt (Fremd-/Fachwörter, Namen)
// 2026-11-11.4: Englisch, freie Fassung: Liedregel vor gelerntem Versanteil (Inhaltswort in der Senkung ≥ monoC, kleines Wort
// in der Hebung ≥ monoU) – „light HELD in her hand“, „FISherman SEES“ wieder richtig; Haider en dev 91,4 → 90,8 % bewusst
// 2026-11-11.5: Sprache je Zeile – „so“, „in“, „will“, „her“, „oh“ zählen nicht mehr als englisch, Lautmalerei (Mm-mm, ah-ah)
// gehört keiner Sprache; unentschiedene Zeilen erben zuerst aus ihrer Strophe („So weich, so leicht, / so ganz darin.“ → de)
// 2026-11-11.6: Vorspann – was vor der ersten Zeile mit „[“ steht (Playlist-Hinweis, Dank, Notiz an Suno), zählt wie ein
// #-Kommentar (Caspar_D: „alles vor [Intro] wird nicht berücksichtigt“); ohne jede Klammer im Text zählt alles
export const KERN_VERSION = '2026-11-11.6';
