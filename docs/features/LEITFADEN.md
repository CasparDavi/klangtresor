# Feature-Seite und White Paper – wie wir sie bauen

Was wir beim KlangTresor-Feature-Dokument (27./28.10.2026) gelernt haben, in Regeln gegossen.
Gilt für **jedes** solche Projekt, nicht nur für KlangTresor. Die KlangTresor-Einzelwerte (Bildschnitt,
Zimmerlicht, Handys, Effektclip) stehen in [STIL.md](STIL.md), Dateien und Abläufe in [MARKETING.md](MARKETING.md).

Lehre vorweg: Am Anfang wussten weder der Auftraggeber noch Claude, was gewollt und was machbar ist. Das
Einstellen aufeinander hat gedauert. Die Regeln hier sollen diese Zeit beim nächsten Mal sparen.

---

## A. Arbeitsweise

1. **Erst die Vorlage, dann der Bau.** Ein Stilvorbild benennen und zeigen (hier: Apples Feature-Zusammenfassung
   nach einem Event, siehe Teil C). Das Vorbild ist die Primärquelle; eigene Regeln leiten sich davon ab.
   Ohne Vorbild wird jede Kachel einzeln verhandelt.
2. **Die Gliederung kommt vom Nutzer her, nicht von der Software.** Abschnitte nach dem, was jemand tut
   (Holen, Hören, Entspannen, Gestalten …), nicht nach Modulen. Wichtiges vor Neuem, nichts Beta, nichts Selbstverständliches.
3. **Von oben nach unten, ein Abschnitt nach dem anderen.** Ein Abschnitt fertig, gezeigt, abgenommen – dann der nächste.
4. **Jedes Bild sofort im Zusammenhang zeigen.** Ein Bild wird in seiner Kachel beurteilt, nie allein.
   Bildschirmfoto nach jeder Änderung, nicht am Ende.
5. **Inhaltliche Wahl fragen, nicht entscheiden:** welcher Song, welches Farbschema, welche Szene.
   Handwerk entscheidet Claude, Inhalt und Geschmack der Auftraggeber.
6. **Entscheidungen als Varianten anbieten** (A/B/C/D, nebeneinander als Bild) statt als Beschreibung.
   So entstanden Richtung D der Broschüre und Farbstufe D.
7. **Präzisionsarbeit dem Menschen geben, wenn er es besser kann.** Ecken eingesetzter Bildschirme setzt der
   Auftraggeber selbst im Eckenwerkzeug; Claude rechnet danach exakt weiter. Schätzen kostet mehr Runden als Fragen.
8. **Für Gestaltung Fachagenten holen** (Layout, White Paper, Typografie), mehrere unabhängig, mit dem Auftrag,
   Richtungen vorzuschlagen – nicht eine Lösung zu bauen.
9. **Behauptungen am Stand prüfen.** Wenn Erinnerung und Stand auseinandergehen („war das Bild nicht drin?“),
   den Zeitstand belegen (Übersichtsbild mit Uhrzeit), nicht argumentieren.
10. **Nach außen nur Fertiges.** Nichts verlinken, was noch nicht online ist. Nach jedem Hochladen die Live-Seite
    selbst abrufen (alle Sprachen, Bilder, Links, Handybreite).
11. **Persönliches bleibt lokal.** Sonderausgaben mit echten Personen (hier: Tarja-Edition) per `.gitignore` aus dem Repo,
    veröffentlicht nur mit Zustimmung der Person. Nie eine Zweig-Historie pushen, die solches Material enthält –
    stattdessen einzelne Dateien in **einen** Commit auf main.
12. **Werkzeuge aufheben.** Jedes Aufnahme-, Einsetz- und Hochrechenskript gehört in `werkzeug/`, nicht ins Scratchpad.
    Beim nächsten Bildwechsel braucht man es wieder.

## B. Vom White Paper zum PDF

**Die Lehre:** Eine Webseite per Druck-Stylesheet in ein PDF zu verwandeln, ergibt kein professionelles Dokument.
Der erste Versuch („Schrott“) hatte weiße Ränder, umbrechende Kacheln, halbe Bilder auf zwei Seiten und
einen Schriftzug, der als Kasten druckte. Eine Broschüre ist ein **eigenes Layout** über **denselben Inhalt**.

1. **Eine Textquelle, zwei Layouts.** Alle Texte und Bildlisten in einer Datei (`inhalt.js`), geladen von Seite
   **und** Broschüre. Die Broschüre enthält nur Seitenplan, ein paar Rahmenwörter (S., Inhalt, Abb.) und ihr Layout.
2. **Feste Seitenkästen**, z. B. 210 × 297 mm, jeder mit `overflow:hidden` und Seitenumbruch danach.
   `@page{margin:0}` – Chrome malt `@page`-Ränder immer weiß, auch auf dunklem Grund.
3. **Ein Seitenplan statt Fließtext.** `PLAN` sagt, welche Kacheln auf welcher Seite stehen. Der Mensch entscheidet
   die Seiten, nicht der Umbruch des Browsers.
4. **Zwei Register:** Titel und Kapitelauftakte im Magazinstil (randlose Szene, ins Schwarz auslaufend, große Ziffer),
   Innenseiten im Schweizer Raster (12 Spalten, Marginalspalte mit Kachelnummer, Text rechts, Bilder voll breit).
5. **Das Skript prüft und verweigert.** Vor dem PDF meldet die Seite selbst (`window.BERICHT`): Überlauf je Seite,
   fehlende Kacheln, kaputte Bilder, Seitenzahl nicht durch 4 teilbar (Klammerheftung), Füllgrad je Seite
   (unter 70 % wird gemeldet). Bei Fehlern **kein** PDF. Es wird nie stillschweigend abgeschnitten.
6. **Abstände als Regeln, nicht nach Augenmaß:** Bild → Text 3 mm, Text → Bild 9 mm, Text → Text 6 mm,
   als CSS-Variablen, auf jeder Seite nachgemessen (`--abstaende`).
7. **Was im Browser geht, druckt nicht immer:** Verlauf als Textfarbe und CSS-Masken druckten als Kasten →
   eingebettetes SVG mit `currentColor`. Auf Bildschirmen interaktive Teile (Plus, Overlay, Songliste) im Druck aus,
   Einzelheiten stattdessen immer gedruckt.
8. **Zwei Fassungen:** Bildschirm-PDF (≈ 8 MB, verkleinert, zum Verlinken) und Druckerei-PDF (Szenen mit Real-ESRGAN
   hochgerechnet, echte Bildschirme danach exakt wieder eingesetzt; nur lokal).
9. **Prüfen mit der richtigen Engine.** Seiten mit `pdftoppm` oder `sips` rastern; Ghostscript ließ Glyphen weg,
   die im PDF da waren (Fehlalarm). Links im PDF prüfen (`/URI`) – auch nach der Verkleinerung.
10. **Links gehören ins PDF.** Projektadresse auf Titel und Rückseite als echter Link; Chrome übernimmt `<a href>`.

## C. Styleguide

### Die Primärquelle

**Maßstab ist Apples Feature-Zusammenfassung, die nach einem Event erscheint** (die Seite, die nach einer Keynote
alle Neuerungen eines Produkts oder Betriebssystems auf einer Seite sammelt). Bei jeder Gestaltungsfrage wird
**dort** nachgesehen, nicht in unseren Tabellen. Was wir von ihr übernehmen, beschreiben wir nach seiner Rolle,
nicht als Kopie einzelner Teile:

- **Die Seite ist eine Übersicht, kein Handbuch.** Man überfliegt sie und weiß danach, was das Produkt kann.
- **Gliederung in Themen**, je Thema eine große Überschrift mit kurzer Unterzeile.
- **Kacheln unterschiedlicher Breite** in einem festen Raster; jede Kachel eine Neuerung: kurzer Name,
  eine Schlagzeile, ein Satz, ein Bild.
- **Das Bild trägt.** Text erklärt nur, was das Bild nicht zeigen kann.
- **Einzelheiten auf Abruf**, nicht auf der Seite.
- **Ruhige Fläche, eine Akzentfarbe,** große Schrift, viel Luft; nichts schmückt, was keine Aufgabe hat.

Unsere Abweichungen sind bewusst und begründet: **hell auf dunkel** (Sehbedingung des Auftraggebers, Hausregel),
die Akzentfarbe aus der eigenen App, das Einzelheiten-Fenster direkt am Plus.

### Unsere Umsetzung (Sekundärquelle)

Die folgenden Werte sind **aus der Primärquelle abgeleitet** und am KlangTresor-Dokument abgenommen. Sie sind ein
Startpunkt, kein Gesetz: Ein neues Projekt prüft sie am Vorbild nach, statt sie fortzuschreiben.

#### Web

| Element | Wert |
|---|---|
| Grund / Kachel / Kachel 2 / Linie | `#000` / `#141416` / `#1c1c1f` / `#2a2a2e` |
| Text / leise | `#f5f5f7` / `#a8a8ad` (≥ 7 : 1) |
| Akzent | **eine** Farbe mit Verlauf-Partner (hier `#ff8a2a` → `#d9531e`), nur für Bedeutung |
| Schrift | Systemschrift (`-apple-system, SF Pro …, Helvetica`), 17 px / 1,47 |
| Titel | 112 px, Verlauf in Akzentfarbe, Marke (Symbol) in Versalhöhe; auf dem Handy auf Spaltenbreite eingepasst |
| Abschnitt | Augenbraue 17 px Akzent · Überschrift 34–56 px · Unterzeile 18–21 px leise · 120 px Abstand |
| Kachelraster | 12 Spalten, 20 px Fuge, Breiten 4/5/6/7/8/12, Kachelradius 28 px, max. 1180 px |
| Kachel | Textteil oben (Augenbraue, Überschrift 24–32 px, ein Satz), Bildteil unten Kante an Kante |
| Reihe | Überschriften auf einer Grundlinie (subgrid), Bildunterkanten fluchten (`w₁/f₁ = w₂/f₂`) |
| Einzelheiten | „+“ rechts unten → Fenster **am Plus**, Kreuz an der Stelle des Plus, Hintergrund nur leicht gedimmt (≈ 38 %) |
| Fahrten | Pinning sparsam: nur für dasselbe Bild in Stufen oder Ganzes → Detail; Überschrift steht mit, Fallback Einzelkacheln |
| Bilder | in Anzeigebreite speichern, Lanczos + leichtes Schärfen, WebP; Cache-Zähler im Bildpfad |
| Fuß | „Gut zu wissen“ (Grenzen ehrlich nennen), Projektadresse als Link |
| Vorschau | Open Graph statisch (Crawler führen kein JavaScript aus), Bild 1280 × 640 |

#### Druck (Broschüre)

Für den Druck ist Apples Seite nur die Anmutung. Die Primärquellen der Broschüre sind das **Schweizer Raster**
(Innenseiten: Spaltenraster, Marginalspalte, Haarlinien) und das **Magazinlayout** (Titel und Kapitelauftakte).


| Element | Wert |
|---|---|
| Satzspiegel | A4, Ränder außen 18 mm, oben 15 mm, unten 18 mm; 12 Spalten, Steg 4 mm, Marginalspalte = 4 Spalten |
| Schrift | Helvetica Neue; Text 10/14 pt, Überschrift 12/14,5 pt, Einzelheiten 8,5/11,5 pt, Kolumne 6,5 pt Versalien |
| Kapitelauftakt | Ziffer 96 pt dünn in Akzent, Überschrift 30/32 pt, Vorspann 12/16 pt |
| Farbstufen | Überschrift `#a8a59f`, Text `#8b8984`, Einzelheiten `#75736f` – gedämpft, kein „Knallweiß“ |
| Linien | Haarlinien 0,3 pt `#3a3a40` |
| Inhaltsverzeichnis | so breit wie die Textspalte, Seitenzahlen auf der Grundlinie |

## D. Mehrsprachig von Anfang an

Nachträglich übersetzen kostet überall: Bilder mit Oberflächentext, Seitenüberlauf, Aufnahmeskripte, Grammatik.
Von Anfang an eingeplant kostet es fast nichts.

1. **Jeder Text ist ein Objekt `{en, de, ru}`** – ab der ersten Zeile, auch Rahmenwörter, Alt-Texte, Knöpfe.
   Kein Text steht wörtlich im Layout.
2. **Sprachweiche** oben. Reihenfolge: gemerkte Wahl (`localStorage`) → `?lang=` → Browsersprache → EN.
   Maschinelle Übersetzung mit Stern kennzeichnen (RU\*) und im Fuß erklären.
3. **Bilder mit Oberflächentext je Sprache aufnehmen**, nie nachträglich übersetzen: Aufnahmeskripte nehmen die
   Sprache als Parameter (`SPR=ru`) und suchen Bedienelemente nicht über deutschen Text.
   Fehlt ein Bild, fällt es auf EN zurück – und steht in der Liste offener Punkte.
4. **Layout für die längste Sprache bauen.** Russisch ist oft am längsten: Broschürenseiten in allen Sprachen
   prüfen, das Skript baut alle drei in einem Lauf und meldet Überlauf je Sprache.
5. **Kyrillisch in Text und Dateinamen**, nie Umschrift. Schriftfallback für Sonderzeichen prüfen.
6. **Begriffe der App übernehmen**, nicht neu übersetzen (Effektnamen aus den Sprachdateien der App).
7. **Fehler in der Übersetzung der App** gehören in die App (eigenes Release), nicht nur ins Dokument.
