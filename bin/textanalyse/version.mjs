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
// 2026-11-11.7: Viëtor 1921 (gemeinfrei, eigene Digitalisierung, CC0) als zweites Aussprachelexikon hinter ipa-dict –
// kern/vietor-de.tsv, 11 223 Wörter, die ipa-dict nicht kennt; Nebenton in Zusammensetzungen aus dem Endglied. Reim und
// Betonung; Duden-Liste bleibt als Stufe dahinter (Jörg: „C ja, D Duden bleibt drin, V wird publiziert“)
// 2026-11-12.1: Muret-Sanders 1900 (gemeinfrei, eigene Auswertung) als Betonungsquelle hinter Lexikon und Duden-Liste, nur für
// ganze Wörter – kern/muret-de.tsv, 50 078 Wörter mit Haupt- und Nebenton; un- vorn betont wie heute (ungesagt). Krech 2009,
// Wörter außerhalb des Lexikons: 73,4 → 74,1 % Hauptakzent richtig; Haider, Reim und Soll-Test unverändert
// 2026-11-12.2: Silbentrennung nach den TeX-Trennmustern (kern/trennung.mjs, trennmuster-de/-en.txt; Liang), wo sie genau so
// viele Stücke ergeben, wie das Wort Silben hat – aal-ähn-lich, mög-lich, kö-nig-reich, in-cred-i-ble; sonst die eigene Regel.
// Ändert nur die Silbengrenzen der Anzeige (von/bis), nicht Betonung, Hebungen oder Reim. Dazu wahlweise Bühnendeutsch
// (aussprache('buehne'), Voreinstellung Alltagsdeutsch = unverändert).
// 2026-11-12.3: Englisch – verkürzte Formen der Dichtersprache (turn'd, heav'n, wand'ring = volles Wort mit e, die
// ausgelassene Silbe fällt; o'er, e'er, ne'er, e'en, ta'en … in korrekturen-en.tsv) und Muret-Sanders Teil I (um 1900,
// gemeinfrei, bin/muret-betonung-en.mjs) hinter CMUdict: kern/muret-en.tsv, 101 946 Wörter mit Betonung und Reimteil
// (6 679 nachgelesen = sicher, sonst „vermutet“, grau); kern/muret-1900-en.tsv, 785 Wörter nur bei der Wahl „um 1900“.
// Gutenberg-Versenden ohne CMU: Betonung nach Notregel 63,0 → 41,8 %, mit Lauten 64,2 → 76,4 %. Haider en test/dev:
// Silbenzahl 99,2/99,2 → 99,3/99,4 %, Wort 85,2/82,9 → 85,4/83,1 %, Vers 91,4/90,8 → 91,6/91,0 %, Zeilen 68,9/66,5 gleich;
// Reim en 99,7/98,5/99,4 % gleich. Dazu Lieder-Statistik neu (daten: 27 213 statt 20 901 Lieder).
// 2026-11-13.1: Russisch als dritte Textsprache – Zeilen mit kyrillischer Schrift sind „ru“ statt „fremd“ (ukrainische,
// belarussische, serbische Buchstaben bleiben fremd). Betonung aller Wortformen aus dem Wiktionary (en + ru, 3 Mio. Formen),
// е/ё-Auflösung über die Häufigkeitsliste, eigene Zeichen des Schreibers (за́мок, замОк, зам+ок), Endungsmodell für
// Unbekanntes; Homographen (за́мок/замо́к) entscheiden Gedichte (Wikisource), Versmaß und Reim. Lautregeln für den Reim
// (Reduktion, Weichheit, Auslaut, Angleichung; Reimteil 96,2 % wie die Wiktionary-IPA), Kosten K_RU (monoU 0,1, poly0 0,8).
// RIFMA test: Wortton 97,3 %, Silben 95,6 %, Zeilen 82,2 %, Reime erkannt 81,5 % bei 92,6 % Genauigkeit. Onegin-Strophe.
// Deutsch und Englisch unverändert (Haider de test 95,7/82,9, en test 91,6/68,9; Reim en 99,7/98,5/99,4, Haider-Reim 97,3/73,2).
// 2026-11-13.2: Russisch, dreisilbige Verse – Zeilen, deren Hebungsabstände überwiegend zwei Senkungen sind, rechnet das
// Versmaß ein zweites Mal mit dreisilbigen Kosten (kern/metrik.mjs K_RU.ternaer): der Anapäst behält seinen zweisilbigen
// Auftakt. RIFMA test: Zeilen 82,2 → 84,5 %, Silben 95,6 → 95,8 %; Anapäst ~30 → 64,7 %, Daktylus 82,9 %, Jambus/Trochäus
// gleich. Wortwolke Deutsch: eigene Stichwörter bleiben ihre Grundform (Haus statt Hau, Eis statt Ei; kern/grundformen-de.tsv).
// Deutsch und Englisch im Versmaß unverändert (Kosten ohne ternaer; Soll-Test grün).
export const KERN_VERSION = '2026-11-13.2';
