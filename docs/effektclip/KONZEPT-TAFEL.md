# Konzept: die Effektclip-Tafel

Stand 19.10.2026. Entstanden am 26.09. aus dem Brainstorm mit Caspar_D, ergänzt am 29.09. nach
einer Rückmeldung aus dem Umfeld (Übergabe §39) und am 19.10. um den Videoschnitt-Fall und den
Bestand ringsum (Kapitel 11). Es ist noch nichts gebaut. Das Blatt sammelt, was
entschieden ist (mit Wortlaut) und was daraus folgt. Wer etwas anderes baut, ändert erst dieses
Blatt.

## 1. Der Anlass

Caspar_D: *„Ich schaue dem Effektclip-Studio eher gerade passiv beim Wachsen zu, und es braucht
doch gewisse Leitplanken, damit daraus kein Wildwuchs wird."* Die Fragen dahinter: Sollen
verschiedene Medien verschiedene Effektketten bekommen? Brauchen lange Stücke zeitabhängigen
Einsatz der Effekte und dynamische Parameter — *„variabler Schneefall, Schnee wird zu Regen, die
Farbe des Regens ändert sich von weiß zu blutrot, immer, wie es zum Song passt"*? Und der untere
Teil des Bedienungskarussells soll *„eher wieder registermäßig"* werden.

**Vorgeschichte (Backlog „Bewegtbild schneiden statt nur bemalen", Caspar_D, 10.09.2026).** Die
Tafel hat einen älteren Kern; Jörgs Liste von damals, unverändert im Wortlaut:

- *„Abschnittsabhängig. Was passiert, richtet sich nach dem Songabschnitt, nicht nur nach dem
  Takt. Die Abschnitte liegen bereits vor (`abschnitte.peak_times`)."*
- *„Später Hook-Videos für Suno exportieren. Das ist das Ziel dahinter: aus dem, was der
  Effektclip live macht, eine Datei ziehen, die man wieder hochladen kann. (Tarja legt ihre
  Suno-Hooks heute schon als eigene Bewegtbilder ab.)"*
- *„Aneinanderhängen und Überblenden, auch invers aneinanderhängen. Und zwar automatisch, nach
  Takt und Abschnitt, ‚nicht dass man ewig am Schneidprogramm sitzen muss'."*
- *„Dasselbe Video mehrfach hintereinander, jedes Mal mit anderen Effekten."*

Dazu die Machbarkeitsnotiz von damals: Aneinanderhängen und Überblenden brauchen zwei
Videoelemente zugleich; der Export braucht einen Aufnahmeweg (inzwischen da: der volle Export) und
eine Antwort auf die Länge (inzwischen da: Sunos Regeln, Kapitel 6). Der fünfte Punkt der Liste,
Ablaufartefakte im Takt, ist ein Effekt auf die Videoquelle und bleibt im Backlog.

## 2. Entscheidungen (mit Datum)

| Entscheidung | Wortlaut Caspar_D | Datum |
|---|---|---|
| Der Song wird **abschnittsweise** gestaltet; ein Titel ohne Grenzen ist ein Abschnitt | „Wir arbeiten abschnittsweise. Der Song ist erstmal ein Abschnitt." | 26.09. |
| Grenzen kommen **automatisch** aus einer Abschnittswahrheit, wie die Grenzen der Tiefenkarte | „Wie bei den Tiefenabschnitten in der Tiefenkarte können automatisch Grenzen eingefügt werden; der Standard wäre durch die Whisper-Spracherkennung und die Suno-Abschnittsgrenzen eine Abschnittswahrheit, die Intro, Outro, Strophen, Chorusse etc. abbildet." | 26.09. |
| **Je Abschnitt ein Effektclip** im heutigen Sinne; der Song ist eine Reihe davon | „Jeder Abschnitt bekommt etwas, was z. Z. in einem Effektclip abgebildet wird. Eigentlich ist jeder Song dann eine Aneinanderreihung von Effektclips im heutigen Sinne." | 26.09. |
| Der Ort heißt **Effektclip-Tafel** | „Effektclip-Tafel" — „gut" (Alternativen: Szenen-Tafel, Effektclip-Dramaturgie, Effektclip-Reihe/Reihung) | 26.09. |
| **Teilen erbt**: beide Hälften bekommen den Effektclip, jede ist danach für sich | „Wenn ich einen Abschnitt nochmal splitte, erben beide Abschnitte den Effektclip und ich kann jeden einzeln modifizieren? Würde ich so machen." | 26.09. |
| Effektclips lassen sich in andere Abschnitte **kopieren** | „Kann man Effektclips kopieren und in einen anderen Abschnitt einfügen?" — ja, mit der Ablage | 26.09. |
| Der Grenzen-Editor zeigt die **Hüllkurve** und spielt den Ton | „Sieht man die Hüllkurve und hört den Sound? Ich würde sagen, ja. Die Hüllkurve als Pendant der Histogramme bei der Tiefenkarte." | 26.09. |
| Die **Quellen werden Bildmaterial** mit n Stücken, Fotos und Videoschnipsel, je Abschnitt eines | „Dann müssen wir aber auch Videos oder Standbilder für Abschnitte definieren können; die Quellen müssen auf n Elemente erweitert werden." | 26.09. |
| **Hook und ganzer Titel** sind Fenster auf dieselbe Reihe | „Dann ist das Gesamtvideo also eine Erweiterung des Hooks — aber selbst Hooks können schon aus mehreren Szenen bestehen, nur eben weniger." | 26.09. |
| Am Abschnittswechsel wird **geblendet** | „Szenen pro Abschnitt definieren ist sehr vernünftig und sie am Szenen-Wechsel ineinander blenden lassen." | 26.09. |
| Die **Tiefe** bekommt einen eigenen Karusselleintrag | „ob wir bei der Vorbereitung die Tiefe herauslösen und ihr einen völlig eigenen Karusseleintrag zuweisen" | 26.09. |
| Grenzen rasten auf **Schläge**, nicht nur auf die Eins; Wechsel dürfen auf den Schlag knallen oder je Schlag stufen | „Grenzen nur auf der Eins wäre zu fest gefügt, manchmal möchte man Bilder auf Schlägen reinknallen lassen oder die Helligkeit stufenweise pro Schlag auf Weiß blenden." | 26.09. |
| Beim **Löschen einer Grenze** fragt die Tafel, welches der beiden Rezepte die entstehende Spanne bekommt | „wenn ich eine Grenze lösche, kann ruhig eine Nachfrage kommen, welches der beiden Rezepte für die entstehende Zeitspanne angewandt werden soll" | 26.09. |
| Das **Takt- und Schlagmuster** ist auf der Tafel als eigene Spur zu sehen | „damit man das Einrasten besser versteht" | 26.09. |
| Snippet und Hook bekommen **deutsche Wörter**: Zehnsekünder und Anreißer | „Snippet und Hook sind englische Worte — bitte Vorschläge" — „Anreißer ist gut, in Klammern oder der Erklärung darf Suno-Hook fallen" | 26.09. |
| Der **Wechsel mischt fertige Bilder**, er paart keine einzelnen Effekte | „ja" — zur Rückmeldung: die Blende mischt das fertige Bild des einen Abschnitts gegen das des nächsten, beide auf derselben Liedzeit | 29.09. |
| Die **Lage des Wechsels** hängt an seiner Form | „harte Schnitte – auf Grenze; Stufen – entweder Anfang oder Ende auf Grenze; Rampe – Ende auf Grenze" (die Rampe heißt im Blatt Blende) | 29.09. |
| **Nie drei Bilder zugleich** | „nie drei Bilder zugleich" | 29.09. |
| Eine **sanfte Änderung innerhalb einer Strophe** muss gehen | „sanfte Änderung innerhalb einer Strophe — ja, das ist wichtig" | 29.09. |
| Die **Tiefe gehört zum Bild**, nicht zum Abschnitt | „ja" — zur Rückmeldung: dieselbe Quelle in zwei Abschnitten ist eine Karte, eine Änderung gilt für beide | 29.09. |
| **Einfügen in einen anderen Titel** bringt die Kette, nicht die fremde Mediendatei | „ja" | 29.09. |
| Der **Morgenlauf überschreibt keine Grenze**, die jemand verschoben hat | „ja" — zur Rückmeldung: der Vorschlag bleibt ein Vorschlag, bis man ihn ausdrücklich neu übernimmt | 29.09. |

## 3. Die Wörter

* **Abschnitt** — eine Zeitspanne des Songs zwischen zwei Grenzen. Namen kommen aus der
  Abschnittswahrheit (Intro, Strophe, Refrain, Bridge, Outro) oder vom Nutzer.
* **Effektclip** — unverändert die Einheit von heute: Quelle, Vorbereitung, Effektkette, Schleife,
  gesichert als Rezept (Fassung 7). Ein Effektclip gehört zu genau einem Abschnitt.
* **Effektclip-Tafel** — der Ort: Grenzen, je Abschnitt ein Effektclip, die Hüllkurve, der Player.
  „Die Reihe der Effektclips" ist die Abfolge, kein zweiter Name.
* **Bildmaterial** — die Medien eines Titels, aus denen ein Effektclip seine Quelle wählt:
  Titelbild, Cover, Bewegtbild, eigene Fotos und Videoschnipsel, jedes mit seiner Tiefe (Caspar_D:
  „Bildmaterial"; im Blatt vorher „Vorrat").
* **Ausgabe** — ein Fenster auf die Reihe: Haus (Kachel und Bühne, live), der **Zehnsekünder**
  (10 s als Schleife; das Wort gibt es im Haus schon, „Snippet" fällt), der **Anreißer** (der
  Suno-Hook: das Stück, das der Feed zeigt und Lust aufs Ganze macht, von Marke bis Marke; in
  Klammern oder in der Erklärung darf „Suno-Hook" stehen — Caspar_D, 26.09.; verworfen: Auszug,
  Kostprobe, Anriss, Aufmacher, Schaufenster), ganzer Titel.

Kein drittes Wort für Abschnitt plus Effektclip („Szene"); kein Wort für zwei Dinge.

## 4. Die Leitplanken

1. **Ein Titel, eine Reihe.** Es gibt keine Kette je Ausgabe. Was sich je Ausgabe unterscheidet, ist
   das Zeitfenster und was in diesem Fenster wegfällt (heute schon: Karaoke und Auftritt im
   Zehnsekünder, die Karte sagt es).
2. **Zeit kommt aus dem Song.** Grenzen rasten auf Schläge, die Eins ist nur die stärkste Raste;
   nichts hängt an Sekundenzahlen. Wo die Abschnittswahrheit fehlt, gibt es einen Abschnitt.
3. **Abschnitte statt Kurven.** Was sich über die Länge ändert, ist ein anderer Effektclip im
   nächsten Abschnitt. Der Wechsel hat eine Form je Grenze, drei zur Wahl: **Schnitt** auf den
   Schlag (das Bild knallt rein), **Blende** über n Takte (der Anteil des neuen Bildes steigt
   stetig), **Stufen** je Schlag über n Schläge (er steigt mit jedem Schlag; die Helligkeit Schlag
   für Schlag auf Weiß ist der Wechsel in einen Abschnitt, dessen Bild weiß ist). Form und Länge stehen an der Grenze
   (Caspar_D zur Länge: „kommt drauf an" — Vorgabe ein Takt, gezählt in Takten oder Schlägen, nie
   in Sekunden). Kurven je Parameter gibt es nicht — das wäre der Wildwuchs.
   * **Der Wechsel mischt fertige Bilder.** Beide Effektclips malen auf derselben Liedzeit ihr
     fertiges Bild, gemischt werden die zwei Bilder. Einzelne Effekte werden über die Grenze hinweg
     nicht gepaart, und kein Regler wird zwischen zwei Werten geführt — das wäre die Kurve durch
     die Hintertür. Probe: beim Anteil 0 steht das Bild des alten Effektclips unverändert, beim
     Anteil 1 das des neuen.
   * **Lage.** Der Schnitt liegt auf der Grenze. Die Blende endet auf der Grenze: der neue
     Abschnitt steht auf seinem ersten Schlag voll da. Die Stufen beginnen oder enden auf der
     Grenze, zur Wahl.
   * **Nie drei Bilder zugleich.** Zwei Wechsel überlappen nicht. Ein Wechsel reicht höchstens bis
     zur benachbarten Grenze; liegen in einem Abschnitt zwei (Stufen, die an seiner vorderen Grenze
     beginnen, und ein Wechsel, der an seiner hinteren endet), sind sie zusammen höchstens so lang
     wie der Abschnitt.
   * **Sanfte Änderung innerhalb einer Strophe.** Abschnitt teilen, im hinteren Teil ändern, die
     Blende lang stellen. Unterscheiden sich die zwei Effektclips nur in der Farbe, ist die
     Bildmischung der Farbübergang (Regen von weiß zu blutrot); unterscheiden sie sich in der Form
     (Schnee zu Regen), ist sie eine Doppelbelichtung: der Schnee dünnt aus, der Regen kommt. Eine
     Flocke, die zum Tropfen wird, gibt es nicht. Voraussetzung: beide Effektclips malen bei
     gleicher Liedzeit dieselben Teilchen. Nachgesehen am 29.09.: mindestens drei Stellen des
     Studios (Rauschen, Rauschkachel, Zittern je Band) säen aus der Effektnummer oder aus
     `Math.random`; beim Teilen muss die Saat mitgehen, zu prüfen für jeden Effekt mit Zufall
     (Schritt 4).
   * **Der Preis.** Im Wechsel wird doppelt gemalt, und zwei Videoquellen laufen zugleich. Im
     Export kostet das Zeit, im Haus Bildrate; gemessen wird vor dem Bau der Grenzen (Schritt 4).
4. **Altes bleibt gültig.** Ein Rezept ohne Tafel ist ein Abschnitt über den ganzen Song mit der
   einen Quelle von heute (Regel 12 der Texteffekte gilt hier ebenso: alte Rezepte malen dasselbe
   Bild). Der Zehnsekünder bleibt, wie er ist.
5. **Jede Karte behält das Versprechen** (Regel 11) in jedem Abschnitt und jeder Ausgabe: derselbe
   Regler heißt und bedeutet dasselbe; malt er in dieser Ausgabe nichts, sagt es die Karte.
6. **Nichts am KlangTresor vorbei.** Neue Stücke des Bildmaterials kommen durch die App in den Titel
   (Upload), ihre Tiefe rechnet der Morgenlauf; im Archiv wird nichts von Hand gelegt.

## 5. Die Tafel, wie sie aussieht

Skizze vom 26.09. (Übergabe §34): über der Hüllkurve je Abschnitt die Kachel seines Effektclips;
die Hüllkurve; darunter als **eigene Spur das Takt- und Schlagmuster** (die Eins stark, die
anderen Schläge leicht), damit man das Einrasten sieht; die Grenzen als Griffe — Klick setzt,
Doppelklick entfernt, Ziehen verschiebt, rastet auf Schläge (die Bediensprache aller Flächen mit
gesetzten Punkten); der Spielkopf des Players, gestrichelt, Klick auf die Hüllkurve springt hin;
darunter die Abschnittsnamen mit Zeiten. Beim Ziehen einer Grenze spielt der Player einen Takt vor
und einen Takt nach der Grenze, so hört man den Schnitt. An jeder Grenze stehen Form und Länge
des Wechsels (Schnitt, Blende, Stufen), bei den Stufen auch, ob sie an der Grenze beginnen oder
enden.

**Teilen** kopiert den Effektclip in beide Hälften; beim **Löschen einer Grenze** fragt die Tafel,
welches der beiden Rezepte die entstehende Spanne bekommt — ohne Antwort passiert nichts, es gibt
keine Vorgabe (Caspar_D). **Ein Abschnitt ohne Effektclip** (nur durch Entfernen möglich, weil Teilen
erbt) zeigt das nackte Bild des Titels: das Suno-Bewegtbild in seiner Schleife, sonst das Titelbild,
ohne Effekte; die Tafel zeigt ihn als leer, der Wechsel hinein und hinaus ist ein Wechsel wie jeder
andere. **Kopieren/Einfügen** ist die bestehende Ablage des Studios
(`mysuno-tbs-ablage`), die schon heute über Titel hinweg trägt. Eingefügt werden Farbe, Ton und
Effektkette; Quelle und Tiefe bleiben die des Zielabschnitts, eine fremde Mediendatei wandert nicht
mit. Ein Klick auf die Kachel eines
Abschnitts öffnet das Studio für diesen Effektclip; das Studio bleibt, wie es ist, und weiß nur,
zu welchem Abschnitt es gehört.

## 6. Das Karussell des Studios

Reihenfolge nach dem Weg des Bildes: **Quelle** (aus dem Bildmaterial) · **Tiefe** (Tiefenkarte, Zonen,
Grenzen — neu, eigener Eintrag, hängt am Stück des Bildmaterials) · **Vorbereitung** (nur noch Farbe und Ton:
Sättigung, Gradation) · **Effektkette** · **Ausgabe** mit vier Registern:

| Register | Zeit | Takt | Text | Eigenes |
|---|---|---|---|---|
| Haus | Songzeit, live | voll | Karaoke, Auftritt | Kachel und Bühne |
| Zehnsekünder | 10 s als Schleife | fällt nach der ersten Runde | ohne | die Schleife (heute eigener Karusselleintrag, wandert hierher) |
| Anreißer (Suno-Hook) | von Marke bis Marke, echte Zeit | voll | Karaoke; Auftritt am Anfang, Abgang am Ende | zwei Zeitmarken, Ton |
| ganzer Titel | 0 bis Ende | voll | Karaoke, Auftritt | Ton, Format |

Sichern, Löschen, Kopieren, Einfügen gehören zum Rezept, nicht zur Ausgabe, und bleiben bei der
Kette. Was eine Ausgabe sich merken muss (Schleife, Marken des Anreißers), liegt beim Titel neben der Reihe.

**Die Tiefe gehört zum Bild.** Dieselbe Quelle in zwei Abschnitten hat eine Tiefe; wer sie in einem
Abschnitt ändert, ändert sie für alle Abschnitte mit diesem Bild, und die Karte sagt das. Heute
stehen die Tiefenwerte im Rezept unter `vorbereitung`, neben Farbe und Ton: `raumtiefe`,
`trennung`, `trennWeich`, `leerraum`, `zonenGrenzen`. Mit „Teilen erbt" bekäme jede Hälfte ihre
eigene Kopie davon. Sie ziehen darum zum Stück des Bildmaterials um (Kapitel 8).

**Marken des Anreißers:** zwei Marken auf der Tafel, rastend auf Schläge; die Software schlägt einen
Anreißer vor, wenn sie die Abschnitte kennt (etwa den ersten Refrain), der Nutzer verschiebt.
**Sunos Regeln für Hooks** (nachgesehen 26.09.2026, suno.com/hub und help.suno.com): mindestens
10 Sekunden, höchstens vier Minuten, Hochformat 9:16; der Nutzer wählt in der Suno-App per Scrubbing
den Startpunkt im Song, lädt das Video vom Gerät hoch und kann die Lyrik einblenden lassen. Für den
Export heißt das: Hochformat, Länge zwischen den Marken 10 s bis 4 min, und die Tafel zeigt die
Startzeit des Anreißers, damit der Nutzer in Suno dieselbe Stelle trifft. Ton: Suno ignoriert den Ton
des Videos (Caspar_D) — „Ton dazu" bleibt wie beim ganzen Titel ein Schalter, Vorgabe aus.

## 7. Die Abschnittswahrheit

Was im Haus schon liegt (geprüft an Auftakt, 26.09.):

* `abschnitte` im Katalog: Sunos Strukturanalyse mit `peak_times` und `segment_labels` (A, B, C —
  welche Teile sich gleichen), Zustand `complete`.
* Die Regiezeilen der Suno-Lyrik (`[Intro]`, `[Verse]`, `[Chorus]` …), die `bin/lyrik.js` erkennt
  und aus der bereinigten Lyrik streicht — sie geben den Segmenten Namen.
* Die Whisper-Zeiten der Zeilen (bereinigte Lyrik) — sie legen die Grenzen an die gesungene Zeit.
* `wellenStufen` im Katalog: die Hüllkurve als Stufenpyramide in zwölf Auflösungen.
* Die Schläge (`schlaege`) mit der Eins.

Der Morgenlauf führt die drei ersten zusammen zu einer Abschnittsliste je Titel (Name, von, bis,
Quelle der Grenze), wie er die Tiefenkarte rechnet; die Tafel zeigt sie als Vorschlag, der Nutzer
verschiebt. Die Wahrheit ist Vorschlag, nicht Gesetz: Grenzen dürfen auch frei innerhalb eines
Abschnitts der Wahrheit liegen, auf jedem Schlag (Caspar_D: „ja"). Ohne Lyrik oder ohne Analyse:
ein Abschnitt. Für Songs, die nicht von Suno kommen, fiele die Analyse weg — Abschnittswechsel
wären dann „nur geraten" (Backlog, 28.08.2026); msaf als Ersatz für Abschnittsgrenzen steht dort
als nachrangig, weil ohne Text ohnehin nur zu raten ist, was Strophe und was Refrain heißt.

**Der Morgenlauf überschreibt die Reihe nie.** Die Abschnittswahrheit ist gerechnet und darf bei
jedem Lauf neu gerechnet werden. Die Reihe gehört dem Nutzer und wird nur von der Tafel geschrieben.
Rechnet ein späterer Lauf andere Grenzen, zeigt die Tafel den neuen Vorschlag neben der Reihe;
übernommen wird er nur ausdrücklich.

## 8. Das Rezept

Heute: `eigen-effekt.json` je Titel, Fassung 7, ein Effektclip. Künftig trägt der Titel zusätzlich
die Reihe: Grenzen und je Abschnitt ein Rezept im heutigen Format, dazu Schleife und die Marken des
Anreißers neben der Reihe. Ein Titel ohne Reihe liest sich wie heute (Leitplanke 4). Das genaue
Format ist Teil des Baus, nicht dieses Blatts; Regel 12 der Texteffekte (Altwerte behalten ihre
Bedeutung) gilt.

Zwei Dinge verlassen dabei das Rezept des Effektclips. **Die Tiefenwerte** liegen künftig beim Stück
des Bildmaterials; ein Rezept der Fassung 7 gibt seine Tiefenwerte beim Lesen an das Bild ab, das
es als Quelle nennt. **Die Quelle** nennt ein Stück aus dem Bildmaterial des eigenen Titels (heute
Rolle und Nummer, `quelle:{art,nr}`); über Titel hinweg gilt sie nicht, darum bleibt beim Einfügen
die Quelle des Zielabschnitts.

## 9. Der Bau, in Schritten, jeder mit seiner Probe

1. **Abschnittswahrheit** im Morgenlauf: Liste je Titel aus Suno-Analyse, Regiezeilen, Whisper;
   Prüfung an zehn Titeln gegen das Ohr (Caspar_D). Ohne Oberfläche. Der Morgenlauf schreibt nur
   die Wahrheit, nie die Reihe.
2. **Karussell**: Tiefe als eigener Eintrag, Ausgabe mit vier Registern, Schleife in den
   Zehnsekünder.
   Reines Sortieren, keine neue Fähigkeit; Probe: Labor-Studio, Prüfstand unverändert.
3. **Tafel** mit einem Abschnitt: Hüllkurve, Schläge, Spielkopf, Kachel des einen Effektclips;
   Klick öffnet das Studio. Probe im Sandkasten.
4. **Grenzen**: setzen, entfernen (mit Nachfrage), ziehen, rasten auf Schläge, hören; die
   Schlagspur; Teilen erbt, die Saat des Zufalls geht mit; Reihe im Rezept und Tiefenwerte beim
   Bild (eine neue Fassung für beides); Wechsel als Schnitt, Blende oder Stufen, als Mischung
   zweier fertiger Bilder. Vorher messen: doppelte Malzeit im Wechsel, Kachel und Bühne. Probe:
   Prüfstand mit Fällen über eine Grenze (Naht und Vorschau; Anteil 0 und Anteil 1 bitgleich zum
   einzelnen Effektclip).
5. **Anreißer**: zwei Marken, Fenster als Export; Sunos Regeln stehen in Kapitel 6. Prüffall: der
   Zusammenschnitt vom 19.10. (Kapitel 11).
6. **Bildmaterial**: Upload durch die App, Tiefe im Morgenlauf, Quelle je Effektclip aus dem Bildmaterial.

Reihenfolge nach Nutzen und Risiko; jeder Schritt lässt den vorigen Stand nutzbar zurück.

## 10. Was nicht dazugehört

Kurven je Parameter, Keyframes, eine Zeitleiste je Effekt. Verschiedene Ketten je Ausgabe. Medien
von Hand im Archiv. Einzelne Effekte über eine Grenze hinweg paaren. Ein Morph von einer Form in die
andere. Drei Bilder zugleich.

## 11. Der Videoschnitt-Fall und der Bestand ringsum (19.10.2026)

Nachgesehen am 19.10.2026 in Backlog, Effektclip-Dokumenten, Übergabe und Code, nur gelesen. Was
die Tafel in den Kapiteln 1 bis 10 schon selbst sagt, steht hier nicht noch einmal. Caspar_D:
*„bitte kein neues dokument sondern alles zur Tafel hinzufügen, damit wir nicht in immer neuen
Dokumenten ertrinken"*.

### Der Fall

Claude hatte für „Ein bisschen doch" vier Schleifen aus einem Videogenerator (imagineX)
aneinandergehängt. Caspar_D: *„das sollte in den Klangtresor eingebaut sein, aber dazu brauchen
wir eine Videoschnitt-Session"*. Von Hand hätte er rund 20 Minuten gebraucht.

- **Material:** vier Schleifen zu je 10 s. Die Dateien sind 960×960 groß, haben 30 fps, h264
  High mit 18–23 Mbit/s und keinen Ton. Anfangs- und Endbild sind gleich, im Generator war
  dasselbe Standbild als Start und als Ende gesetzt.
- **Gemacht:** Die Reihenfolge richtet sich nach der Download-Zeit. Einmal aneinandergehängt
  ergibt das 40 s und 101 MB, das Ganze zweimal 80 s und 202 MB. Verbunden wurde mit
  `ffmpeg -f concat -c copy`, ohne Neukodierung.
- **Naht:** Letztes gegen erstes Bild je Schleife ergibt PSNR 39,5–39,7 dB. Fürs Auge sind die
  Bilder gleich. An jeder Fuge stand deshalb ein Bild doppelt.

Was daraus folgt:

1. Das ist der Anreißer aus Tarjas Rückmeldung (Kapitel 1, Übergabe NAECHSTER_CHAT.md:7329–7330),
   hier mit vier Stücken Bildmaterial und mit Wiederholung. Er gehört zu den Schritten 5 und 6.
2. Eine Folge n-mal wiederholen gehört dazu.
3. **Das letzte Bild jeder Schleife fällt weg**, wenn Schleifen aneinanderstoßen. Das ist Caspar_Ds
   Regel vom 10.09. für den Zehnsekünder: *„aber es muss doch das letzte bild fehlen, damit das
   erste = das letzte ist"* (server/server.js:1811–1812). Am 19.10. ist das noch nicht so gemacht
   worden.
4. Videos aus fremden Generatoren sind Bildmaterial wie eigene Videos (heute `eigen-N.mp4`). Der
   Effektclip des Studios ist kein solches Stück.
5. **Größe:** Caspar_D arbeitet mit höchstens 200 MB, eine Datei heißt „…_final_200mb.mp4".
   Kopieren statt neu kodieren, solange es passt.
6. **Offen:** Der Fall war quadratisch, der Anreißer verlangt 9:16 (Kapitel 6). Nicht entschieden
   ist, was mit quadratischem oder querem Bildmaterial im Hochformat geschieht: Rand, Ausschnitt
   oder unscharfer Hintergrund.

### Was schon gebaut ist und die Tafel benutzen kann

- **Schleife mit zwölf Übergangsarten** (`SCHLEIFE_ARTEN`, web/tbs-modul.js:5662). Abgenommen am
  15.09.: *„ja sehr schön geworden, genehmigt"* (NAECHSTER_CHAT.md:4368). Dazu gehört der
  Rücklauf mit 8 % Unschärfe. RIFE ist bei Posenwechseln verworfen
  (KONZEPT-LANGE-VIDEOS.md:47–50).
- **Wiederholungsregel des ganzen Titels:** *„dehnen oder schrumpfen (nie mehr als 1/3) oder
  mehrmals loopen"* (KONZEPT-LANGE-VIDEOS.md:145), gebaut als `vollRunde()`
  (tbs-modul.js:9565–9584). An jeder Wiederholungsnaht liegt ein Übergang der Schleife.
- **Ganzer Titel:** Knopf und `/api/vollvideo/*` (server.js:1352–1378, 1890–2050). Gerechnet
  wird in Paketen zu 600 Bildern, höchstens 2 GB je Lauf. Der Ton ist optional (AAC 192k).
  `-shortest` verliert bei Annex-B-Eingang die Tonspur (server.js:1983–1989).
- **Zehnsekünder:** WebCodecs-Kodierer, der Server muxt nur (`-c:v copy`, server.js:1852–1855).
  Dazu `taktLage()` (tbs-modul.js:9099) mit dem Zufallsboden 44 %.
- **Mehrere eigene Videos je Titel** (`eigen.mp4`, `eigen-2.mp4` …, server.js:4226–4230).
  Entstanden ist das, weil Tarja das eine eigene Video für Hooks *„missbraucht"*
  (NAECHSTER_CHAT.md:2354–2355). Die Bühne wechselt im Modus „alle" hart an den
  Abschnittsgrenzen, ohne Blende (index.html:22596–22631).
- **Sprungkopie** (`/api/sprungkopie`, server.js:2120–2165) für bildgenaues Springen.
- **Ausgabebuch** `library/effektclips.json` mit `bin/effektclip-buch.js`. Es erkennt eigene
  Ausgaben, wenn sie über Suno zurückkommen; `bin/laden.js` markiert sie nur.
- **Suno-Hook-Felder** `hookBildUrl` und `hatHook` (bin/aufbereiten.js:159–160) werden gesammelt,
  aber nirgends benutzt. Die Endpunkte `/api/video/hooks/…` sind nur gelesen
  (docs/suno/WEGE.md:518), `/hooks/create` ist nie betreten.
- **imagineX** kennt das Haus nur als Dateinamenmuster (`imaginexvideo`, bin/eigen-artwork.js:129).

### Was vor dem Bau zu beachten ist

- **Die Sprungkopie lehnt über 60 s ab.** Begründung: *„Hookmaterial sind Schnipsel von 5 bis
  20 Sekunden (Caspar_D, 11.09.2026)"* (server.js:2154). Der Anreißer darf aber bis zu 4 min
  lang sein, der Fall hatte 80 s.
- **Werkzeug** (VIDEOSTUDIO-RECHERCHE.md:236–285):
  - Bildgenau dekodieren mit `VideoDecoder` und dazu Mediabunny (MPL-2.0) oder mp4box.js, dann
    GL-Übergänge, *„mit drei bis fünf Dateien anfangen"*.
  - ffmpeg `xfade` und `concat` nur als Rückfall für harte Schnitte.
  - Nie: ffmpeg.wasm, Remotion, Code aus GPL oder LGPL.
  - Offen ist dort, wo man anfängt und ob Mediabunny oder mp4box.js (Z. 297–299).
  - Im Haus gibt es `concat` und `xfade` heute nicht, nur im Labor
    (`labor/videonaht/uebergaenge/arbeit/bau.py`).
- **Teilstück-Rendern:** Abschnitte einzeln kodieren und am Server per Kopie verbinden
  (VIDEOSTUDIO-RECHERCHE.md:271–272). Das passt zum Wechsel als Schnitt.
- **Suno kodiert neu** und behält dabei Bildzahl und Bildrate; L·30 muss ganzzahlig sein
  (VIDEO-PLAN.md:243–255). Ob Suno Song und Video bildgenau zusammen startet, ist ungeprüft
  (VIDEO-PLAN.md:336–338).
- **Nahtmaß:** Der Nahtquotient ist der Sprung an der Naht geteilt durch das 95. Perzentil der
  normalen Bildwechsel; unter 1 ist die Naht unsichtbar (VIDEO-PLAN.md:479–494). Prüfstand:
  `labor/nahtpruefung/`. Archiv-Statistik: `labor/videonaht/`, 91 Videos, davon brauchen 63
  keinen Übergang.
- **Abschnittsgrenzen** (zu Kapitel 7): Suno bestätigt 52 % der Textgrenzen, der Zufallsboden
  liegt bei 23 %. Das Taktraster ist bei 136 von 325 Titeln unsauber
  (KONZEPT-LANGE-VIDEOS.md:193–195).

### Offene Wünsche ringsum, die hineinspielen

- Ansicht in der Songanalyse: BPM gegen 10-s-Clip, schlecht sitzende Clips rot (Backlog, 15.09.).
- Ablaufartefakte im Takt wie Stottern oder Rückläufe (Backlog: *„Erst besprechen, dann bauen."*).
- Wiederholtes Abschnittsvideo: Laufen die Effekte mit oder weiter? (VIDEO-PLAN.md:791–796)
- Die Nahtsuche („bester Ausschnitt") fehlt in der App (NAECHSTER_CHAT.md:4252).
- Effekte im Video-Übergang sind nicht getestet, sieben Loop-Abweichungen warten aufs Ansehen
  (NAECHSTER_CHAT.md:4261–4266).
- Die RIFE-Messung M1 (GPU gegen CPU) ist nicht gelaufen (Backlog).
- Zum Lyric-Video steht Caspar_Ds Urteil über die Beispielvideos aus (Wiedervorlage 22).

### Widersprüche, die die Tafel auflöst oder noch auflösen muss

- **Wörter:** „Snippet, Hook" steht noch im Backlog und in der Übergabe
  (NAECHSTER_CHAT.md:7128–7135). Es gelten Zehnsekünder und Anreißer (Kapitel 3).
- **Kanten des Anreißers:** VIDEO-PLAN.md:85 gibt dem Hook „offene Kanten", dagegen steht
  *„10-Sekünder und Hook sind je eine Szene — geschlossen"* (KONZEPT-LANGE-VIDEOS.md:184). Die
  Tafel gibt dem Anreißer Auftritt und Abgang (Kapitel 6). Zu entscheiden ist, ob er außerdem
  als Schleife schließen muss. Im Fall vom 19.10. tat er es.
- **Takt im Zehnsekünder:** Kapitel 6 sagt „fällt nach der ersten Runde". Seit dem 15.09. sitzt
  der Zehnsekünder aber auf Songzeit 0, und `taktLage` hält im Median 98 % des Lieds im Takt
  (EFFEKTCLIP-REGELN.md:220–226, Regel 18). Die Zeile in Kapitel 6 ist zu prüfen.
- **Überholt im VIDEO-PLAN:**
  - VIDEO-PLAN.md:3–5 („nichts gebaut") gilt für Schleife, Takt und Dunst nicht mehr.
  - VIDEO-PLAN.md:53–74 (Zehnsekünder nicht taktsynchron) ist durch VIDEO-PLAN.md:223–227
    überholt.
  - „nicht heimlich ein Schnittprogramm" (VIDEO-PLAN.md:1448) ist abgelöst durch *„es darf
    durchaus eines werden, es muss nur bedienbar sein"* (KONZEPT-LANGE-VIDEOS.md:29).
