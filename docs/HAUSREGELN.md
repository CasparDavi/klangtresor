# Die KlangTresor-Hausregeln

> **Namenswechsel:** Das Projekt hieß bis zum 24.08.2026 *MySuno*. Es heißt jetzt **KlangTresor** — „Suno" ist seit dem 06.01.2026 eingetragene Marke von Suno Inc., ausdrücklich für Software zum Abspielen und Bearbeiten von Audioinhalten. Wo in Zitaten und in der Chronik noch der alte Name steht, bleibt er stehen.

Gewachsen in den Sitzungen vom 20.–21.08.2026, in denen das Tonstudio
gebaut wurde. Jede Regel ist teuer bezahlt oder von Caspar_D gestiftet —
sie gilt für ALLE Diagramme, Panels und Bedienelemente, nicht nur
fürs Studio. Ein späterer Chat liest das hier ZUERST.

## Wahrheit der Darstellung

1. **Analyse blockig, Filterung glockig** (Caspar_Ds Formel). Bandweise
   gemessene Daten (Decke, Bandprofil) werden als TREPPE gezeichnet —
   eine Verbindungslinie erfände Zwischenwerte. Was Filter wirklich
   tun, ist rund: echte Antworten zeichnen (getFrequencyResponse),
   keine Schemata. „Wer weiß, wie ein EQ funktioniert, bestellt keine
   Treppe" — darum gibt es keine Regler-Treppe: Punkte = Einstellung,
   Kurve = Ergebnis.
2. **Messpunkte stehen fest.** Die Messung ist längst passiert — ihre
   Marken (Ringe der Decke) wandern nie mit den Reglern.
3. **Nichts darf lügen.** Es gilt immer genau EIN Modus (Equalizer ↔
   Glockenstuhl schalten die echten Filter um); eine Ansicht, die
   nicht mehr stimmt, wird ersetzt, nicht stehengelassen. Zustände,
   die nicht gelten, werden grau (A/B Original) oder erlöschen ehrlich
   (Lampen nur, wenn der Effekt wirklich eingreift).
4. **Analyzer sind Rohdatenwerkzeuge** — sie messen das Werk, nie die
   Filter. Anzeige-Analyser (LCD, Spektralfläche) hängen am master:
   what you hear is what you get.
5. **Kein Zappeln.** Live-Anzeigen sind gemittelt (Blaster-L/R 3 s,
   Spektralfläche mit einstellbarem Intervall). Kontextflächen sind
   still und tragen keine Skala-Behauptung.
6. Suno-WAV-Originale sind TABU — nie verändern.

## Diagramme

7. **Datenpunkte sind Kreise mit Freizone**: die eigene Kurve stößt
   nicht an den Punkt. Freizonen als HALO-Kreise in Grundfarbe
   stanzen — NIE als SVG-Maske/clipPath-Referenz (die versagen beim
   ersten Zeichnen im Verborgenen; gefunden 20.08.). Messmarken
   (Deckenringe) sind hohl, und an sie DARF die Linie stoßen.
8. **Schwarzer Datenbereich, keine Gitternetzlinien.** Ein schwarzes
   Rect mit runden Ecken (rx 6) trägt die Daten; Achszahlen genügen,
   die Wertbeschriftung am Punkt übernimmt die Ablesbarkeit.
9. **Punkte sind Regler**: groß genug zum Treffen (r 9 + Halo 12,
   „wie ein Slider-Daumen"), Wertlabels UNTER dem Punkt (Nudging:
   regelwidriges Ziehen kollidiert sichtbar), Doppelklick = neutral,
   Magnete führen (Decke, Standardmitte), Deckel erzwingen („Kein
   Übersteuern"). Kein Punkt wandert über seine Nachbarn.
10. **Innenabstand**: Halo + 1/3 Punktgröße Luft zum Rand — nichts
    ragt aus dem Datenbereich, auch geklemmte Marken nicht (gleiche
    Klemmung für Linie und Marke!).
11. **Cursor sagt, was geht**: vertikal ↕ an nur-vertikalen Punkten,
    ↔ an Schultern/Wendepunkten, Vier-Richtungs-Kreuz wo beides geht,
    sonst neutral.
12. Linien durchgehend statt gestrichelt (Tufte: Komplexität minimal
    halten); gestrichelt nur als Auszeichnung (aktive Glocke,
    Diagonale). Datenlinien ≥ 2,5 px — „so dick, dass man sie ernst
    nimmt". Sichtbarkeit beweist man mit den AUGEN (Screenshot),
    nie mit querySelector — die NaN-Kurve war im DOM und unsichtbar
    (Float64Array.map presst Pfadtexte zu NaN → Array.from).
13. **Kontrast messen, nicht raten**: WCAG-Grafikgrenze 3:1 gegen
    alle echten Hintergründe; Akzent auf Akzent ist unsichtbar —
    Summenkurven in der ZWEITfarbe (oder hell gemischt per
    color-mix). Bei Deckungs-Stapeln: Verlauf je Schicht (Außenkante
    intensiv → Basis dunkel) + Haarlinien auf den Kanten.

## Schrift und Maß

14. **12 px ist die Lesegrenze** — alle Beschriftungen mindestens in
    Fußnotengröße (Faktoren/Nebenwerte 10,5). Avenir Next Condensed
    NUR im Blaster-LCD. Dezimalkomma überall („+3,5 dB", „Q 1,4").
15. **dB mit Faktoren übersetzen** (+6 = ×2) — Logarithmen greifbar
    machen. Achsbeschriftung mit Atem (8 px zur y-Achse, ~9 px unter
    der x-Achse, Bezug ist die SÄULENBASIS, nicht der Rand).
16. **Pixelgenau eichen und NACHMESSEN statt glauben**: Beweislinien,
    getBoundingClientRect, 0,0 px als Ziel. Bekannte Fallen: Inline-
    Spans erben Zeilenhöhe; SVG ohne preserveAspectRatio="none" bei
    viewBox ≠ Renderbreite verschiebt alles; Wertzeilen brauchen
    FIXE Höhe (Inhalt ließ sie wachsen und verschob Ticks um 2 px).
17. Abstände als Verhältnisse denken (verdoppeln, 1/3 kleiner, 2/3)
    und nach Caspar_Ds Auge nachjustieren; Spalten so bemessen, dass sie
    GLEICH HOCH enden (Satzspiegel).

## Bedienelemente

18. **Pillen statt Checkboxen** (Checkboxen gibt es im Haus nicht).
    Gewählt = Rand, nicht Füllung; AN-Zustand deutlich (2 px
    Akzentrahmen, aus gedimmt). ACHTUNG Spezifitätsfalle: ID-Regeln
    (#studiokopf button …) überstimmen .pille.an — immer eine
    ID-scoped .an-Regel danebenstellen (zweimal bezahlt!).
19. **Echte Dropdowns**: aufklappen und aussuchen; stille Zustände
    („Frei — von Hand geregelt") als hidden option. Zustandsknöpfe
    geben Rückmeldung als ZUSTAND (Flag), nie über zerbrechliche
    Wertvergleiche (MEGA BASS scheiterte am Deckel-Vergleich).
    Drück-Feedback: :active scale 0.95.
20. **Zustände sind keine Mengen**: Slider für Zustände (Tempo,
    Stereo-Breite) ohne Füllbalken — die Mitte ist die Heimat.
    Mengen-Slider dürfen sich füllen.
21. Schließen-Knöpfe rund mit Rand, Flex-zentriertes ×. Löschbares
    zeigt sein × am Objekt (Referenz-Knopf). display:flex überstimmt
    das hidden-Attribut — immer [hidden]{display:none} danebensetzen.
22. Tooltips erklären das Prinzip, nicht nur den Namen; Fußnoten nur
    dort, wo ihr Gegenstand sichtbar ist; Erklärtexte ERGÄNZEN die
    Legende statt sie zu wiederholen.

## Legenden und Texte

23. **Die Legende zeigt, statt zu beschreiben**: Wörter tragen ihre
    eigene Farbe („Anhebungen" in Akzent) — Meta-Wörter („in Akzent",
    „Zweitfarbig:") entfallen. Gefüllte Flächen als Pille mit echter
    Füllfarbe und Deckung. Jede Entität ein Absatz.
24. Bedienung und Zeichenerklärung zweispaltig (Bedienung links,
    schmaler); Herkunft der Daten nennen („vorgerechnet vom Analyzer,
    keine Live-Messung").
25. **Caspar_Ds Worte sind kanonisch**: Überschreien (nicht Übersteuern),
    „das Zeug gehört dem Song" (kein dein/mein), Formen statt
    Eigennamen (Glockenstuhl, Decke, Kuller). Umbenennungen mit
    Taufnotiz in der Doku festhalten.

## Architektur

26. **Register sind Stationen der Kette** — was drauf setzt, bekommt
    eine Lasche; was dieselbe Station feiner zeigt, ist ein MODUS in
    derselben Lasche. Es gilt immer genau einer.
27. Ein Gerät, mehrere Sichten: geteilter Zustand, gemeinsame
    Funktionen (data-Attribute statt Index-Annahmen), zentrale
    Maßtabellen (EQ_MASSE/PAR_MASSE/GRAD_MASSE) statt verstreuter
    Zahlen.
28. Solo/Abhören greift in den STREAM (parallele Filterbank), nicht
    in die Einstellungen; Abhörzustände sind flüchtig, gespeicherte
    Einstellungen bleiben unangetastet. Eine Datei je Datentyp
    (exFAT), Tempo wird nie gemerkt.
29. Eingriffe in Tonpfad/Player/Datenfluss vorher ansagen; nach jedem
    Patch grep-verifizieren; Panels müssen ins Fenster passen
    (nachmessen!).

## Tooltips (23.08.2026)
Der native `title`-Kasten erscheint erst nach rund anderthalb Sekunden, und
diese Wartezeit ist nicht einstellbar (Caspar_D: „brauchen zu lange zum
Aufploppen"). Die Playerleiste hat deshalb einen **eigenen Tooltip** (`#tipp`):
nach 120 ms da, über dem Gegenstand, am Bildrand geklemmt. Die Texte bleiben
als `title` im HTML stehen — wartbar und für Vorleseprogramme lesbar; beim
Überfahren wandert der Text kurz nach `data-tipp` (sonst käme der native Kasten
obendrauf) und danach zurück. Dadurch stimmen auch Texte, die sich zur Laufzeit
ändern, etwa der des Anschlusses. Erweiterbar: Der Zuständigkeitsbereich steht
im Selektor (`#player [title]`).

## Schrift muss lesbar sein, nicht nur stilvoll

Gemessen wird nach WCAG: mindestens **4,5:1** gegen den Hintergrund für
alles unter 18,66 px. Am 24.08.2026 lagen **11 von 30** Textvarianten
darunter, die schlechteste bei **1,39:1**.

Der Fehler war eine Multiplikation: Die Grundfarbe `#555` liegt schon bei
2,80:1, und darauf saßen Deckkraft-Abstufungen bis 0,45 herab. **Zwei
Dämpfungen multiplizieren sich.** Wer eine Farbe dämpft, muss von einer
Grundfarbe ausgehen, die den Spielraum hat.

Auf `#0a0a0a` braucht es rgb(120) für 4,5:1 und rgb(154) für 7:1.

**Farbige Beschriftungen** tragen die Farbe ihres Gegenstands — das
ordnet zu, aber ein dunkles Bandblau kommt als Text auf 2,4:1. Dafür gibt
es `lesbar(farbe, ziel)` in `analyzer.js`: hellt nur so weit gegen Weiß
auf, bis die Schwelle erreicht ist. Der Farbton bleibt, die Flächen
behalten ihre Farbe unverändert — dort steht nichts zu lesen.

## Die Bildunterschrift hängt näher am Bild als die Überschrift

Sonst liest sich der Text als Einleitung des nächsten Diagramms. Konkret:
Überschrift → Grafik 5 px, Grafik → Unterschrift 4 px. Der Abstand
*einer* Unterschrift darf nie größer sein als der zwischen Überschrift
und Grafik.

Erklärungen stehen **unter** der Abbildung, nicht darüber: Eine
Überschrift muss knapp sein, eine Erklärung darf ausführlich sein. Beides
in eine Zeile zu zwingen reißt Lücken, sobald der Text kürzer ist als die
Breite.

## Alle Zeitspuren auf denselben Kanten

Wer den Spielkopf von einer Spur zur nächsten verfolgt, muss dieselbe
Zeit an derselben Stelle finden. Am 24.08.2026 lagen drei Raster
nebeneinander — 1400, 1424 und 1376 px —, jeweils durch fehlendes oder
doppeltes Polster. Nach jeder Änderung an einer Spur nachmessen:
`getBoundingClientRect()` über alle `.spur-flaeche` und `canvas`.

## exFAT: ein Block ist ein Megabyte

Die Arbeitsplatte hat **1 MB Allocation Block Size**. Jede Datei belegt
mindestens ein volles Megabyte, gleich wie klein sie ist. 321 Dateien à
65 KB belegen **321 MB statt 20**.

Viele kleine Dateien sind hier also teuer. Sammeldateien sind die Regel
(`katalog.json`, `klang.json`, `toene.json`); wer je Song eine Datei
anlegt, muss einen Grund haben, der ein Megabyte wert ist.

## Takt und Taktschlag sind zwei Dinge

Ein **Takt** ist die Gruppierung, ein **Taktschlag** die Zeiteinheit
darin — ein 3/4-Takt hat drei Taktschläge. Sunos `schlaege` liefert
einzelne Schläge mit ihrer Zählzeit, daran erkennt der Analyzer die Eins.

Gemessen wird zwischen zwei Schlägen. Steht in einer Anzeige „Takte", wo
Schläge gemeint sind, behauptet die Zahl das Vierfache an Zeit.

Ebenso: Anteile über **Schläge** zählen, nicht über Zonen. Ein
geviertelter Schlag ergibt vier Zonen und ein ganzer eine — in Zonen
gezählt erscheint die feine Teilung viermal so häufig, wie sie ist.

## Die Formsprache der Diagramme: Fläche gedämpft, Kontur in voller Stärke

**Das ist die zentrale Regel für alles Gezeichnete.** Sie wurde mehrfach
neu verhandelt, weil sie nirgends stand — das kostete am 23.08.2026 eine
Stunde.

Jede Datenform besteht aus **zwei** Teilen:

1. eine **Fläche**, halb deckend
2. darüber eine **Kontur** von 1 px in voller Stärke — die **Topline**

Beides in **derselben Farbe**. Die Topline trägt die Farbe ihres
Gegenstands: *„bei rot muß die topline rot sein."* Sie ist keine
Hervorhebung, sondern die Kante der Daten — erst durch sie liest man
einen Verlauf als Linie statt als Wolke.

Das gilt für **alles**: Hüllkurven, Balken, Blöcke der Befundspur, Säulen
des Spektrums, Bänder des Chroma, Histogrammbalken.

### Die Werkzeuge

In `analyzer.js` stehen `spurZug()`, `spurTopline()` und `spurBild()`.
`spurZug({flaeche, linie}, farbe, {deckung})` macht beides in einem Zug.
Nichts von Hand nachbauen, was diese Funktionen schon können.

### Wo die Kontur liegt

- **Fläche auf einer Grundlinie** → Kontur **nur oben**.
- **Gespiegelte Fläche** (symmetrisch um eine Mittellinie) → ebenfalls
  **nur oben**. Das war eine ausdrückliche Entscheidung: *„die helle
  topline nur oben, wie ganz oben in der Hüllkurve."*
- **Ausnahme, die einzige:** die große Wellenform (`drawMainWaveform`)
  führt die Kontur **ringsum**. Sie steht allein und darf sich einfassen;
  wo mehrere Spuren dicht übereinanderliegen, verdoppelt eine Kontur
  ringsum jede Linie, bis der Block zuwächst.

### Die Deckung

`SPUR_DECKUNG` = 0,66 ist der Hausstandard. Wo **viele Flächen
übereinanderliegen** — Chroma mit zwölf Zeilen, der Stemblock mit sechs —
sind es **0,45**: Zwölf halbdeckende Flächen summieren sich im Auge zu
einer hellen Masse, und dann trägt die Kante nichts mehr.

Die Kontur läuft bei voller Stärke oder 0,85. Sie muss **deutlich heller**
sein als die Fläche; gemessen sollte der Abstand mindestens Faktor zwei
betragen. Beim Chroma: Fläche 84, Topline 159.

### Die SVG-Falle

Die Spuren zeichnen in einem **gestreckten viewBox** — die Breite wird
skaliert, die Höhe nicht. Eine Linie mit `stroke-width="1"` würde
horizontal mitgestreckt und verschwände. Deshalb gehört an **jede**
Kontur:

```
vector-effect="non-scaling-stroke"
```

Ebenso: `height="1"` ist genau ein Bildpunkt, und ein Strich der Länge
null mit `stroke-linecap="square"` ergibt ein unverzerrtes Quadrat.

### Woran man merkt, dass es falsch ist

Wenn eine Fläche „wie eine Wolke" aussieht, fehlt die Kontur. Wenn die
Kontur nicht auffällt, ist die Fläche zu hell oder die Kontur zu dunkel —
nachmessen, nicht schätzen. Wenn eine Kontur bei Zoom verschwindet, fehlt
`non-scaling-stroke`.

## Der Liedtext auf der Bühne: drei Ebenen, keine Grelle

Festgeschrieben am 24.08.2026, nachdem der Text über Monate praktisch
unlesbar war und es niemandem auffiel, weil es „irgendwie ging".

**Der Befund, damit er nicht wiederkommt:** Von 26 sichtbaren Zeilen
lagen 25 unter der WCAG-Schwelle — die kommenden bei 1,79:1. Zwei
Ursachen, beide lehrreich:

1. **Der geprüfte Grund war nie zu sehen.** `bin/farben.js` rechnet den
   Kontrast gegen `p.grund`. Der wird auf `#buehne` gesetzt, liegt dort
   aber unter dem weichgezeichneten Coverbild begraben. Wer auf der
   Bühne Kontrast rechnet, muss gegen **das Bild** rechnen, nicht gegen
   die Palette. (`bGrundEcht` hält den Wert.)
2. **Zwei Dämpfungen multiplizieren sich.** Auf der schon gedämpften
   `--bleise` saß zusätzlich `opacity:.34`. Zusammen blieben 21 %.

### Die drei Ebenen

Was die laufende Zeile kenntlich macht, ist **nicht** ihre Helligkeit:

- **Marke** — ein Punkt in Akzentfarbe davor sagt, *welche* Zeile.
  Als Fläche von wenigen Pixeln darf er die Coverfarbe roh tragen;
  die WCAG-Schwellen gelten für Schrift, nicht für Marken.
- **Kontur** — `-webkit-text-stroke` mit `paint-order:stroke fill`
  macht sie *dicker*. Nie `font-weight`: das ändert die Laufweite, und
  der Text springt bei jedem Zeilenwechsel. Konturfarbe **immer**
  `currentColor`, sonst bekommt das gesungene Wort einen andersfarbigen
  Rand statt nur dicker zu werden.
- **Wisch** — die Front lässt hinter sich eine hellere Schrift zurück.
  Ihr Ziel wird **relativ** zum Grundtext gerechnet (Faktor 1,55 auf den
  Kontrast, gedeckelt bei 11:1), nie als feste Farbe: jeder Song bringt
  seine eigene Textfarbe mit.
- Dazu eine **Abdunklung** hinter der laufenden Zeile. Ihre Breite folgt
  dem **Text**, nicht dem Kasten — `.zeile` ist ein Block und immer
  randvoll. In der Höhe darf sie übergreifen und weich auslaufen.

Damit muss keine Zeile mehr schreien, und der ganze Text trägt dieselbe
ruhige Helligkeit.

### Der Grund wird gemessen, nicht geraten

`brightness` des Hintergrundbildes ist **keine feste Zahl**.
`buehnenGrundMessen()` nimmt so viel Licht weg, dass hinter der Schrift
bei jedem Cover dasselbe Dunkel steht. 116 Songs bleiben unangetastet,
185 werden gedimmt.

Gemessen wird das **Cover**, nicht die Palette: 20 der 321 Songs haben
darin gar keine Farbtöne (Graufallback für farblose Cover), und
ausgerechnet „Denunziant" ist einer davon und sehr hell. Ein Bild auf
**einen Bildpunkt** gezeichnet ist sein Mittelwert — und genau den macht
`blur(60px)` daraus.

### Struktur kommt aus den Lyrics

Absätze werden **nicht** aus Pausenlängen geraten (ihr Median liegt bei
0,05 s), sondern aus Caspar_Ds eigenem Text gelesen. Weil Karaoke- und
Lyricszeilen sich nur bei 186 von 256 Songs 1:1 decken, läuft die
Zuordnung über die **längste gemeinsame Teilfolge** — dasselbe
Verfahren wie im Whisper-Vergleich. Vor Abschnitten (`[...]`) steht
**immer** Luft, auch ohne Leerzeile im Original.

## Wer ersetzt, räumt ab — Code und Daten

**Caspar_D, 24.08.2026:** „Wenn etwas ersetzt wird, immer alles aus dem
Code und den Daten werfen, was mit der veralteten Entsprechung zu tun
hat."

Ein Verfahren gilt nicht als ersetzt, solange sein Vorgänger noch
irgendwo steht. Halb ersetzt ist schlimmer als gar nicht ersetzt: Dann
gibt es zwei Antworten auf dieselbe Frage, und niemand weiß mehr,
welche gerade gilt.

### Was der Fall gekostet hat

Am 19.08.2026 wurde die Tonartbestimmung ersetzt — Bass auf Sunos Eins
statt Krumhansl über den Vollmix. Die neue Karte war da, die alte
Rechnung blieb stehen, und die alten Werte blieben in 321 Ablagen. Fünf
Tage später:

- Ein Wächter „reparierte" die alten Werte und tauschte dabei eine
  unbrauchbare Zahl gegen eine andere unbrauchbare.
- Der halbe Nachmittag ging für die Suche nach einem Datenschaden
  drauf, den es nie gab.
- Und dabei kam heraus, dass die tote Kirchentonart in **jedem**
  Kommentar-Prompt stand, den Caspar_D kopierte — die Karte war
  unsichtbar, ihr Textinhalt lesbar.

### Die Liste beim Ersetzen

Was abzuräumen ist, in dieser Reihenfolge:

1. **Die Rechnung** und alles, was nur sie braucht — Konstanten,
   Hilfstabellen, Zwischenvariablen.
2. **Die Felder in den Nachrichten** und damit in der Ablage.
3. **Die Anzeige** — Karte *und* die Stelle, die sie beschreibt. Beide
   im selben Schritt: Bleibt die Schreibstelle ohne Karte stehen, wirft
   `getElementById(null).textContent` einen TypeError mitten im Lauf.
4. **Die stillen Leser** — Export-Funktionen, Prompts, Tooltips. Eine
   auf `display:none` gesetzte Karte hat immer noch einen `textContent`.
5. **Die gespeicherten Daten** — Index, Katalog, abgeleitete Dateien.
6. **Die Werkzeuge**, die den alten Wert gepflegt haben.
7. **Die Kommentare**, die ihn erklären. Vorher das Hausgedächtnis
   retten: *warum* es so gebaut war und *warum* es weg musste, gehört
   nach `docs/HISTORY.md` — sonst wird derselbe Fehler in ein paar
   Jahren neu gebaut.

### Zwei Regeln für den Ausbau selbst

**Erst die Rufer, dann die Quelle.** Wer die Funktion zuerst löscht,
legt alles lahm, was sie noch anspricht — beim Tonart-Ausbau hätte eine
einzige Zeile in `bin/vorrechnen.js` das gesamte Vorrechnen zum
Absturz gebracht, samt Spektrogrammen und Hüllkurven. Nach jedem
Einzelschritt muss der Bestand lauffähig sein.

**Bevor du einen Wert reparierst, prüfe, ob ihn jemand liest.** Diese
Frage hätte den ganzen Umweg erspart; die Antwort stand in
`bin/analyse-index.js`, zwei Zeilen über dem Eintrag, den ich am selben
Nachmittag nachgeschlagen hatte.
