# Songstrukturanalyse — Wiederholungen finden und zeigen

**Stand 07.09.2026.** Eine Sitzung, in der aus einer verworfenen Idee ein
tragfähiges Verfahren wurde. Dieses Dokument hält fest, was gemessen
wurde, welche Fehler dabei gemacht wurden — die sind der lehrreichere
Teil — und welche Quellen gelesen sind. Caspar_D: *„Ich will besser sein,
als alles, was bisher da ist, darum merke dir auch die Quellen."*

Das Vorhaben: **zwei Bogendiagramme übereinander auf gemeinsamer
Zeitachse.** Oben die Wiederholungen der Musik, gemessen. Unten die
Wiederholungen des Textes, belegt. Dazwischen Sunos Abschnittsmarken.
Der Witz daran ist die Prüfbarkeit: Die untere Hälfte ist Grundwahrheit,
die obere ist Messung — das Bild behauptet nichts, es stellt gegenüber.

---

## 1. Der Anfang: eine verworfene Idee

Eine erste Untersuchung hatte Selbstähnlichkeit als Bogendiagramm
**verworfen**. Die Begründung: 287 von 323 Liedern haben kein Tal
oberhalb des Gipfels der Ähnlichkeitsverteilung, jede Schwelle wäre
gesetzt statt gefunden; bei fester Bogenzahl lieferte sogar
blockgemischtes Material zehn selbstbewusste Bögen.

Caspar_D hielt das für unplausibel — *„aber wenigstens chorusse müsste
man doch wieder finden, das ist komisch"* — und behielt recht. Die
Untersuchung hatte zwei Konstruktionsfehler:

- **Das Merkmal war im Auftrag vorgegeben** („Selbstähnlichkeitsmatrix
  aus Chroma"), statt erst zu fragen, womit man misst.
- **Die Neuheitsrecherche lief parallel zur Messung**, nicht davor. Der
  Befund, dass alle vergleichbaren Arbeiten entlang Zeitverschiebungen
  rechnen, kam an, als die Messungen fertig waren.

Daraus die Regel, die seither gilt: *Im Prüfauftrag wird die Frage
vorgegeben, nie die Größe.* Und: Wenn ein nicht gewähltes Merkmal besser
abschneidet als das gewählte, ist das der Hauptbefund, keine Randnotiz —
die Energie-Hüllkurve schlug die Chroma damals mit AUC 0,641 gegen
0,521, und es stand als Nebensatz da.

---

## 2. Was die Recherche ergab

Zwei Wellen mit zusammen sechzehn Rechercheuren und drei Gegenlesern.
Die Kernbefunde:

**Es gibt keine hergeleitete absolute Ähnlichkeitsschwelle.** In keiner
geprüften Arbeit. Marwan hat 2011 den einzigen Ansatz, der die Kante in
der Rohverteilung sucht (Gao & Jin), als mehrdeutig und hochgradig
instabil verworfen und nennt die Schwellenwahl eine offene Aufgabe.
Serrà nennt seine eigene Schwelle 2014 wörtlich *„rather arbitrary"*.

**Wattenberg ist selbst nicht schwellenfrei.** Er filtert Teilfolgen
unter zehn Symbolen weg, begründet mit *„the kind of large-scale
repetition that is unlikely to occur by chance"* — ein
Signifikanzargument, eine Ebene tiefer versteckt. Der Übergang von Text
zu Audio geht also nicht von „keine Schwelle" zu „Schwelle", sondern von
einer Längenschwelle zu einer Längenschwelle.

**Das Doppeldiagramm ist empirisch geprüft.** Fell u. a. (2021) haben
Text- und Audiostruktur gegeneinander gehalten — als Matrizen, nicht als
Bögen: Text allein 70,8 % F1, Audio allein 70,4 %, beides zusammen
75,3 %. Die Seiten sind **nicht redundant, sondern ergänzend**. Das ist
die Rechtfertigung für das ganze Vorhaben.

**Ein Bogendiagramm von Liedtexten gibt es nirgends.** Die gesamte
Textwiederholungsforschung zeichnet Matrizen.

**Silva, Yeh, Batista & Keogh haben 2016 unser Vorhaben skizziert** —
ISMIR, Abschnitt 5.3, mit direktem Zitat auf Wattenberg: alle Information
für solche Bögen stecke bereits im Matrix Profile und seinem Index. Sie
haben es nie ausgebaut.

**Für Musikstruktur existiert kein Signifikanzrahmen.** Der aktuelle
Übersichtsartikel der ISMIR-Transactions enthält keinen Abschnitt zu
Nullmodellen, Permutationstests oder chance-korrigierten Maßen. Bewertet
wird gegen Annotationen, nicht gegen Zufall. Unsere Blockmisch-Gegenprobe
ist eine Übertragung aus der Bioinformatik, kein Literaturbefund.

---

## 3. Die Grundwahrheit — und ihr Fehler

Aus `library/lyrik.json` (siehe `bin/lyrik.js`): Wo dieselbe Textzeile
mehrfach gesungen wird, ist an diesen Stellen nachweislich dasselbe
passiert. Zeitanker aus Whisper.

**Der teuerste Fehler des Tages lag hier.** Ich habe Zeilenpaare gezählt
statt Refrainwiederholungen. Caspar_D: *„moment, der song hat keine 8
refrains, in den refrains werden zum teil zeilen wiederholt"*.

An „Noch lachst Du" nachgerechnet: zehn Zeilenpaare, aber nur **drei**
Refrains. Drei Paare liegen *innerhalb* eines Refrains (die Zeile steht
dort zweimal, zwölf Sekunden auseinander) — die kann ein Verfahren, das
nicht überlappende Wiederholungen sucht, prinzipiell nicht finden. Sechs
weitere beschreiben **dieselbe** Verbindung zwischen zwei Refrains, nur
über verschiedene Zeilen.

Über den Bestand:

| | |
|---|---|
| Zeilenpaare gesamt | 4.946 |
| davon innerhalb eines Abschnitts (nicht auffindbar) | 888 — **18 %** |
| nach dem Zusammenfassen: **Abschnittspaare** | **1.062** |

Die Korrektur änderte die Bewertung von 26 % auf **61,7 %**. Der Fehler
lag in der Zählung, nicht im Verfahren.

**Merke:** Eine Grundwahrheit ist selbst ein Konstrukt und gehört
geprüft, bevor man Verfahren an ihr misst.

---

## 4. Die Verfahren, in der Reihenfolge ihrer Prüfung

### 4.1 Was durchweg gilt: positionsdeckend schlägt geschwellt

Dreimal aufgetreten, dreimal dasselbe Ergebnis:

| Auswahl | Ergebnis |
|---|---|
| globales Ranking nach Güte, beste 12 je Lane | 1 von 8 Textpaaren |
| absolute NCC-Schwelle über dem Untergrund (99,5-%-Quantil) | 1 von 8 |
| **je Position die k besten Partner** | 3 von 8, über den Bestand 61,7 % |

**Die ähnlichsten Stellen eines Liedes sind nicht seine Refrains.** Ein
durchlaufendes Instrumental oder zwei ruhige Passagen gleichen einander
im Zahlenwert stärker als zwei gesungene Refrains, die sich in Betonung,
Atmung und Ausschmückung unterscheiden. Wer nach Güte auswählt, greift
systematisch das Falsche ab.

Die richtige Frage lautet nicht „welche Paare sind am ähnlichsten",
sondern **„was gehört zu dieser Stelle"** — und jede Stelle bekommt eine
Antwort, auch die unauffällige. Caspar_D hatte das als
Vollständigkeitsforderung formuliert: *„es müssten ja alle refrains mit
bögen verbunden sein"*.

### 4.2 Merkmale im Vergleich

Alle mit demselben Verfahren, gegen dieselbe Grundwahrheit. Abstand zum
blockgemischten Material in Prozentpunkten, Fensterlänge durchgefahren:

| Merkmal | bester Abstand | bei |
|---|---|---|
| Chroma + bandFlux | 26,4 | 16 s |
| **Chroma (12 Halbtöne)** | **25,8** | 12 s |
| bandFlux, obere drei Bänder | 25,2 | 12 s |
| Stem-Hüllkurven (alle sechs) | 22,6 | 16 s |
| lBands / rBands / stereo16 | 21–22 | 12 s |
| entropy | 17,0 | 16 s |
| flux, spitzeVerlauf, energy | 11–13 | 16–24 s |
| lufs, crest, korrVerlauf, momentan, onsets | 7–10 | 16–24 s |
| clipVerlauf | 0,9 | — |
| `kurz` (LUFS-kurz) | **0,0** | ungeklärt |

**Nebenbefunde:**

- `bandFlux` und `entropy` werden gerechnet, in der Ablage gehalten und
  **in keiner Bahn gezeigt**. `bandFlux` trägt fast so weit wie Chroma.
- Von den acht Bändern tragen die **oberen drei** allein 24,9 Punkte
  gegen 25,2 für alle acht. Die fünf unteren bringen drei Zehntel.
- Die **Gesangsspur allein** (24,0) schlägt das Aggregat aus allen sechs
  Stems (22,6). Gitarre (4,8) und Klavier (7,4) tragen fast nichts —
  htdemucs trennt sie bei dichtem Material unzuverlässig.
- `kurz` liefert über zwölf Fensterlängen exakt null. Das ist kein
  schwaches Merkmal, das ist vermutlich ein Lesefehler. **Offen.**

### 4.3 Die Fensterlänge — gemessen, nicht gesetzt

Rampe von 1 bis 64 Sekunden, 213 Lieder, 4.946 Paare, jede Zahl mit
Gegenprobe:

```
  1s    2s    3s    4s    6s    8s   12s   16s   24s   32s   48s   64s
17,0  20,6  20,8  22,0  24,1  25,3  25,8  25,6  22,5  19,7  15,6  11,2
                                      ▲ Gipfel
```

Ein echtes Maximum mit Plateau von 8 bis 16 Sekunden. **Das gemischte
Material bleibt über die ganze Rampe flach** (1,6 bis 2,1 %) — der
Parameter kann das Ergebnis nicht künstlich erzeugen.

Unabhängige Bestätigung aus dem Text: Ein Refrain dauert im Median
**14,7 s** und hat vier Zeilen (889 Abschnitte aus den `[Chorus]`-Marken
von 232 Liedern). Goto setzt in RefraiD 6,4 s, SiMPle 5 s — beide per
Augenmaß. Unser Wert fällt aus den eigenen Daten.

| Abschnittsart | Anzahl | 10 % | Median | 90 % | Zeilen |
|---|---|---|---|---|---|
| Intro | 108 | 8,0 | 14,1 | 30,2 | 4 |
| Strophe | 848 | 9,2 | 16,5 | 28,7 | 6 |
| **Refrain** | 889 | 7,0 | **14,7** | 27,9 | 4 |
| Brücke | 217 | 8,8 | 15,7 | 30,8 | 6 |
| Outro | 191 | 6,8 | 17,4 | 40,5 | 6 |

Die Refrainlänge ist **innerhalb** eines Liedes nicht fest (Spanne
geteilt durch Median: 0,59; nur 17 % der Lieder auf ±10 % gleich). Ein
Teil davon ist Musik — der letzte Refrain wird oft verlängert —, ein Teil
Messfehler der Marken-Zuordnung.

### 4.4 Taktkacheln und Bildkorrelation

Caspar_Ds Vorschlag: *„wir sollten fenster benutzen, die einer Taktlänge
entsprechen und ggf auf die bpm skala abbilden und diese bilder
miteinander vergleichen und ggf fusionieren"* — und *„du darfst die
bänder nicht normieren, ich dachte du alignierst bilder,
Graustufenbilder"*.

Beide Hinweise trafen echte Fehler:

- **Ein festes Sekundenfenster ist musikalisch willkürlich.** 14,7 s sind
  mal drei Takte, mal fünf. Ein Takt ist die Einheit, in der Musik gebaut
  ist. Sunos Schlagraster trägt die Zählzeiten mit, also lassen sich
  Takte direkt bilden: von einer Eins zur nächsten.
- **Die Abbildung auf feste Kachelbreite** macht Takte verschiedener
  Dauer zu Bildern gleicher Größe. Erst dann ist eine Bildkorrelation
  zulässig.
- **Bandweise Normierung zerstört das Bild.** Jedes Band einzeln auf
  [0,1] zu ziehen hebt leise Höhen auf dasselbe Gewicht wie tragende
  Mitten — danach ist es kein Graustufenbild mehr, sondern ein Stapel
  unabhängiger Kurven.

Gemessen mit normalisierter Kreuzkorrelation über die Kacheln:

**Der Untergrund liegt bei 0,868.** Zwei zufällige Takte desselben
Liedes korrelieren im Median schon so hoch — dasselbe Instrumentarium,
derselbe Mix. Eine absolute Schwelle von 0,8 liegt *unter* dem
Untergrund und fängt alles (719 Bögen).

### 4.5 Die Frequenzbereiche

25 Lieder, 130 Abschnittspaare, Taktkacheln, drei Partner je Takt:

| Bereich | Bögen/Lied | getroffen |
|---|---|---|
| **ohne Tiefen — 150 Hz – 16 kHz** | 20,5 | **60,0 %** |
| melodisch — 100 Hz – 4 kHz | 21,6 | 54,6 % |
| eng — 200 Hz – 1,2 kHz | 20,9 | 54,6 % |
| voll — 40 Hz – 16 kHz | 24,5 | 52,3 % |
| Gesang — 150 Hz – 2 kHz | 21,0 | 51,5 % |
| ohne Höhen — 40 Hz – 4 kHz | 24,6 | 50,8 % |

**Nicht die Becken stören, sondern die Tiefen.** Kick und Bass laufen bei
diesem Material durch und machen alle Takte einander ähnlich; was sich
mit dem Arrangement ändert, sind Zischlaute, Becken und Obertöne. Das
deckt sich mit dem Bänder-Befund aus 4.2.

### 4.6 Phasenkorrelation — das Bildalignment aus HAECKEL

Übernommen aus `haeckel.html` (Zeile 3693 ff.), Kuglin & Hines 1975. Als
**Maß** geprüft, an 184 Liedern, 4.904 echten gegen 4.322 Zufallspaare:

| | echte Paare | Zufall | AUC |
|---|---|---|---|
| Gipfelhöhe | 0,327 | 0,217 | **0,751** |
| Eindeutigkeit (Gipfel/zweitbester) | 1,713 | 1,186 | 0,740 |
| Transposition = null | **72,6 %** | 39,1 % | — |
| Zeitversatz ≤ 2 Schläge | 76,9 % | — | — |

Der eingebaute Blindwert funktioniert: Bei echten Wiederholungen findet
die Korrelation auf der Chroma-Achse keine Verschiebung, bei zufälligen
Stellen in 61 % der Fälle eine.

**Transponierte Refrains gibt es in diesem Bestand praktisch nicht.** Bei
jedem Versatz außer null liegen die echten Paare *unter* dem
Zufallsniveau. Nur 18 von 4.904 Paaren haben klaren Gipfel und
Transposition — davon sieben bei einer Quinte, was nach Obertonartefakt
aussieht. Das ist eine Aussage über den Generator: Suno macht den
Halbtonschritt im letzten Refrain nicht von selbst.

**Wichtig:** Phasenkorrelation und euklidischer Abstand messen auf
denselben Daten Verschiedenes. Über 8.001 Fensterpaare: Korrelation
**−0,157**, Spearman −0,089, und unter den je zwanzig besten Paaren
**keine einzige Überschneidung**. Der euklidische Abstand fragt „stehen
dieselben Töne gleich laut da", die Phasenkorrelation „hat der Verlauf
dieselbe Gestalt, egal wie laut". Bei 46 % der Paare findet sie eine
Zeitverschiebung über einen Schlag — diese Paare sieht ein starrer
Vergleich nie.

---

## 5. Die Darstellung

**Ein Bogen ist ein Band, keine Linie.** Vier Ecken, zwei geschwungene
Kanten, die geraden Seiten liegen auf der Zeitachse und markieren die
Abschnitte. Ein dicker Strich verbreitert sich senkrecht zur Bahn und
zeigt an den Enden nicht mehr, was er meint.

**Die Kanten müssen parallel sein.** Zwei konzentrische Bögen: ein
Mittelpunkt, zwei Radien. Das geht auf, weil beide Abschnitte gleich lang
sind — dann fällt `(a1+b2)/2` mit `(a2+b1)/2` zusammen. Gedeckelt wird
nicht je Kante, sondern beide bekommen denselben Stauchfaktor.

**Keine überlappenden Abschnitte.** Ohne diese Prüfung liefen bei „Noch
lachst Du" **17 von 38 Funden** überlappend — die Innenkante läuft dann
rückwärts und die Form dreht sich um sich selbst. Inhaltlich sind sie
meist wertlos: Eine Stelle ähnelt ihrer eigenen Nachbarschaft immer.

*Berichtigung vom selben Abend:* Wir haben die Regel Wattenberg
zugeschrieben. Das ist falsch. Bei ihm gilt *non-overlapping* nur für das
maximal matching pair; daneben kennt er die **repetition region** und das
**fundamental substring**, und ein essential matching pair ist
ausdrücklich auch „zwei aufeinanderfolgende fundamental substrings einer
repetition region" — seine Abbildung 3 heißt *Immediate repetition*, bei
n Kopien zeichnet er n−1 Bögen. In Wiederholungsregionen wird die
Bedingung also ausgesetzt. Unsere Ausschlusszone von einer halben
Fensterlänge stammt nicht von ihm, sondern aus dem
kNN-auf-Diagonalen-Verfahren: im Matrix Profile heißt sie *exclusion
zone*, m/2 vor und nach der Position, und ist dort auch so begründet. Sie
ist eine Notwendigkeit des Suchverfahrens, keine Aussage über Musik — und
genau sie kostet uns die 18 % aus Abschnitt 8.

**Bogenhöhe = Versatz** (Vorschlag, nicht gebaut). Die Hi-C-Konvention
der Genomik: obere Dreiecksmatrix um 45 Grad gedreht, Diagonale waagerecht
an der Achse. Tandembögen liegen dann von selbst flach an der Zeitachse,
Refrainbögen hoch — ohne zweiten Symbolsatz und ohne Verdecken. Grenze:
die Höhe ist durch den Bildschirm begrenzt, weite Bögen müssten gekappt
werden. Fürs Zeilenpacken bei Überfüllung gibt es mit igv.js
(`featurePacker.js`, 28 Zeilen) und UCSCs Stufung dense/squish/pack/full
eine erprobte Vorlage.

**Hausform gilt** (`docs/HAUSREGELN.md`, „Die Formsprache der
Diagramme"): Fläche halb deckend **plus** Topline von 1 px in voller
Stärke, dieselbe Farbe. Nicht entweder-oder. Dazu Regel 8 (schwarzer
Datenbereich, keine Gitternetzlinien), Regel 14 (12 px Lesegrenze) und
Dezimalkomma.

**Small Multiples statt Stapel.** Im gestapelten Bild verdecken sich die
Lanes, und was verdeckt ist, kann man nicht überfahren. Je Lane ein
Streifen, gemeinsame Zeitachse unten, Sunos Marken an jeder Grundlinie —
dann liest man Deckungsgleichheit senkrecht ab.

**Der Mouseover zeigt die Textzeilen beider Abschnitte.** Caspar_D:
*„Musik kann man ja nicht einfach so erfassen."* Bei einem Musikband
steht damit da, *was* an den zwei Stellen gesungen wird, die der Klang
für gleich hält — daran sieht man, ob die Messung recht hat.

**Ein Fehler, der zweimal auftrat:** Merkmal und Verfahren dürfen nicht
als gleichrangige Lanes nebeneinanderstehen. Chroma-Lane und
Phasenkorrelations-Lane arbeiteten auf denselben Zahlen — das war kein
zweites Merkmal, sondern ein zweites Verfahren.

---

## 6. Was am Ansatz selbst fehlt

Caspar_D am Abend des 07.09.2026: *„was mich eigentlich erschreckt, ich
höre intuitiv, was ein Refrain, was Strophe ist, und die Physik hat große
Probleme damit und ich verstehe nicht warum. Was machen wir falsch."*

Die Antwort ist unangenehm konkret und betrifft nicht die Feinheiten
oben, sondern den Zuschnitt der ganzen Aufgabe.

**Wir messen nur die Hälfte des Begriffs.** Ein Refrain ist zwei Dinge
zugleich: er *kommt wieder*, und er ist *anders als das drumherum*.
Sämtliche Verfahren in Abschnitt 4 beantworten ausschließlich die erste
Frage — Matrix Profile, Bildkorrelation, Phasenkorrelation, alle fragen
sie, welche zwei Stellen einander ähneln. Keines fragt, an welcher Stelle
sich etwas ändert. Genau das hört das Ohr zuerst: den Einsatz nach der
Strophe, das Aufgehen der Instrumentierung, den Lautheitssprung, die
zweite Stimme, die dazukommt.

Dafür gibt es seit 1999 ein Verfahren — Footes Schachbrett-Kernel, den
man die Hauptdiagonale der Selbstähnlichkeitsmatrix entlangzieht und der
überall dort ausschlägt, wo vorher und nachher sich unterscheiden. Foote
steht seit heute in unserer Quellenliste (Abschnitt 9). Gerechnet haben
wir ihn nie. Das ist keine Feinheit, das ist eine Lücke im Fundament.

**Die Reihenfolge ist verkehrt herum.** Das Ohr hört nicht „diese Sekunde
ähnelt jener Sekunde". Es hört „hier fängt etwas Neues an", und danach
„das kenne ich". Erst Grenzen, dann Zuordnung. Wir machen es umgekehrt
und hoffen, dass aus lauter Fensterähnlichkeiten die Abschnitte von
selbst herausfallen. Sie fallen nicht heraus — daher 20 Bögen je Lied,
wo vier Abschnitte stehen sollten.

Caspar_D hat daraus die richtige Bauform abgeleitet: *„die Trennung des
musikalischen Kontexts setzt also die Grenzen der Regionen fest."* Die
Kontrastmessung liefert die Schnitte, und erst innerhalb dieser Regionen
wird verglichen. Das räumt nebenbei zwei Probleme mit ab, an denen wir
uns oben abgearbeitet haben: die Fensterlänge wird nicht mehr gesetzt,
sondern ergibt sich aus den Schnitten, und die Nichtüberlappung wird zur
natürlichen Folge (zwei Regionen überlappen nicht), statt eine
aufgezwungene Regel zu sein, die die nahen Wiederholungen kostet.

**Die Lauflänge gehört in die Bewertung, nicht in die Nachbearbeitung.**
Wir suchen erst k nächste Nachbarn je Fenster und fassen danach Läufe ab
Länge 8 zusammen. Das Zusammenfassen kommt zu spät: es kann nur noch
zusammenkleben, was die Nachbarschaftssuche einzeln bereits durchgelassen
hat. Ein einzelnes stark ähnliches Fenster überlebt, acht mittelmäßige in
Folge sterben — obwohl der zusammenhängende Lauf der viel bessere Beleg
ist. Beide Nachbarfächer sagen dasselbe: Benson zählt in TRF die Summe
der Längen aller Läufe ab k aufeinanderfolgenden Treffern auf derselben
Diagonale, ein isolierter Treffer zählt gar nicht; die Musikinformatik
nennt dasselbe *path enhancement* und glättet die Ähnlichkeitsmatrix
entlang der Diagonalen, bevor überhaupt eine Schwelle angesetzt wird.
Caspar_D am 07.09.2026, unabhängig auf denselben Schluss gekommen:
*„taktabhängig und Takte zusammenfassen, bei Korrelation lange Stretches
gewinnen über kurze."*

**Wir mitteln weg, woran das Ohr es erkennt.** Der Chroma-Kosinus über
14 Sekunden ist eine einzige Zahl. Darin verschwindet, dass der Titel
gesungen wird, dass die Melodie ihren höchsten Ton erreicht, dass alle
Instrumente gleichzeitig einsetzen. Das Ohr wertet drei oder vier sehr
auffällige Merkmale; wir werten hundert unauffällige und teilen durch
hundert.

**Was uns nicht ganz anzulasten ist.** Der Hörer hört mit Gedächtnis und
Erwartung: der erste Refrain ist beim ersten Hören noch keiner, er wird
rückwirkend einer, wenn er wiederkommt. Bei eigenen Liedern kommt hinzu,
dass man sie kennt. Ein Verfahren, das ein Lied einmal von vorn nach
hinten liest, hat diesen Vorsprung nicht. Und die Aufgabe ist objektiv
schwer: der Stand der Technik draußen liegt bei 60 bis 70 %, und
menschliche Annotatoren stimmen untereinander nur zu etwa drei Vierteln
überein — sie merken es bloß nicht, weil jeder seine eigene Einteilung
für die selbstverständliche hält. Unsere 61,7 % sind also kein
Ausreißer nach unten. Nur sind wir dort mit einem halben Werkzeug
hingekommen; die andere Hälfte, der Kontrast, ist noch gar nicht
angefasst.

---

## 7. Der Stand

Bestes Verfahren nach heutigem Stand:

- **Zeitachse:** Sunos Schlagraster, Takte aus den Zählzeiten
- **Merkmal:** `|L|+|R|`-Spektrogramm, 150 Hz bis 16 kHz, auf feste
  Kachelbreite je Takt abgebildet, eine Graustufenskala fürs ganze Bild
- **Vergleich:** normalisierte Kreuzkorrelation je Taktpaar
- **Auswahl:** drei Partner je Takt, positionsdeckend, keine Schwelle
- **Fusion:** benachbarte Takte mit benachbarten Partnern aneinanderhängen
- **Ergebnis:** 60 % der Abschnittspaare, 20 Bögen je Lied

Zum Vergleich: Sunos eigene Etiketten treffen 80,2 % gegen eine
Zufallsbasis von 45,1 % — Faktor 1,8. Das Matrix Profile auf Chroma
kommt auf 35,1 % gegen 8,7 % — Faktor 4,0. Die Faktoren sind der faire
Vergleich, nicht die Rohprozente.

**Rechenzeit:** Spektrogramm 4,5 s je Lied (24 Minuten für den Bestand),
Korrelation unter einer Sekunde. Kein Modell, keine Fremdbibliothek, die
FFT liegt in `bin/stoerfrequenz.js`.

---

## 8. Was offen ist

1. **Die 18 % nahen Wiederholungen** — Tandem Repeats im Sinne der
   Bioinformatik. Ein Verfahren, das nicht überlappende Wiederholungen
   sucht, kann sie nicht finden. Die Recherche ist zurück
   (`docs/eingang/2026-09-07-tandem-repeats.md`) und nennt einen konkreten
   Griff: TRFs Zählfenster ist nicht d lang, sondern `max(d, 20)` — bei
   Perioden unter 20 wird über mehrere Kopien im selben Fenster
   akkumuliert, statt das Fenster zu verkleinern. In Schlägen: für d unter
   etwa 8 über 8–16 Schläge sammeln. Dazu das Random-Walk-Band
   Δd_max = floor(2,3·√(P_I·d)) — der zulässige Drift wächst mit der
   Wurzel, wir verschmelzen bisher nur bei *gleichem* Versatz. Nicht
   übertragbar ist Bensons Statistik: seine Tupelgrößen-Staffelung lebt
   davon, dass Empfindlichkeit und Spezifität in der DNA getrennt
   einstellbar sind (Zufallstrefferrate 4^−k, unabhängig von P_M);
   binarisiert man eine reellwertige Ähnlichkeit an θ, sind beide
   dieselbe Funktion desselben θ. Und sein Modell steht auf unabhängigen
   Bernoulli-Versuchen — ein Akkord hält vier Schläge, die Tonart das
   ganze Lied.
   Offen bleibt die Falle beim Wraparound-DP: lokales Alignment verlangt
   E[s] < 0 unter dem Nullfall (Karlin & Altschul 1990), Chroma-Kosinus
   ist nichtnegativ mit stark positivem Mittel. Ohne Abzug eines Versatzes
   τ läuft das Alignment über das ganze Lied.
2. **Das Alphabet.** Der Text ist bereits eines. Die zwölf Halbtöne wären
   eines, wenn man je Schlag einen Gewinner bestimmt — dann wäre
   Wattenbergs Verfahren samt seiner Statistik direkt anwendbar. Was das
   an Genauigkeit kostet, ist ungemessen.
3. **`kurz` liefert exakt null** über alle Fensterlängen. Vermutlich ein
   Lesefehler in der Ablage.
4. **Die Marken-Zuordnung** (Textabschnitte auf Zeiten) verrutscht bei
   Liedern mit vielen gleichen Zeilen. Zwei Plausibilitätsprüfungen sind
   eingebaut, es bleiben Ausreißer.
5. **Der Zuschnitt oberhalb 16 kHz und unterhalb 150 Hz** ist gemessen,
   aber grob gerastert. Eine feinere Rampe könnte mehr hergeben.
6. **Die Bogenzahl.** 20 je Lied ist für ein Diagramm noch viel.
7. **Nichts davon ist im Analyzer.** Alles liegt als Skripte im
   Arbeitsverzeichnis.
8. **Der Kontrast ist nicht gemessen** (Abschnitt 6). Footes
   Schachbrett-Kernel steht in der Quellenliste und ist nie gerechnet
   worden. Solange das so bleibt, misst der ganze Bau nur die halbe
   Definition von „Refrain".
9. **Wir haben keine Zuverlässigkeitszahl.** Alle Trefferquoten oben
   messen gegen eine Grundwahrheit, keine misst das Verfahren gegen sich
   selbst. Caspar_D am 07.09.2026: *„sollten die tiefenfreien FFTs von
   links und rechts die gleichen Bögen liefern, wir müssen einfach mal
   schauen, dass wir uns validiert bekommen."* Genau das ist die fehlende
   Zahl — und die Ablage hält `lBands` und `rBands` getrennt, der Test
   ist also ohne neue Rechnung am Ton möglich.

---

## 9. Quellen

Gelesen oder geprüft im Lauf dieser Sitzung. Wo eine Angabe aus zweiter
Hand stammt, steht es dabei.

### Bogendiagramme

- **Wattenberg, M.** (2002): *Arc Diagrams: Visualizing Structure in
  Strings.* IEEE InfoVis. `hint.fm/papers/arc-diagrams.pdf` —
  Definitionen von *maximal matching pair* (identisch, nicht
  überlappend, konsekutiv, maximal) und *essential matching pair*.
  Mindestlänge zehn Symbole, begründet mit Zufallsunwahrscheinlichkeit.
- **Wattenberg, M.** (2001): *The Shape of Song.*
  `bewitched.com/song.html` — Java-Applet, MIDI, Viewer-Link tot (404).
- Umsetzungen auf Strings: `github.com/aomader/arc-diagrams` (Python),
  `github.com/j-brent/arc-diagrams`, `github.com/dela3499/arc-chart`
- **Carter-Enyi, A.** u. a. (2021): *ATAVizM.* ISMIR.
  `archives.ismir.net/ismir2021/paper/000008.pdf` — symbolisch, statisch.
- Interactive Arc Diagrams Generator, CCRMA Stanford (Ben Williams).
  `ccrma.stanford.edu/~benwill1/arcs/about.html` — Humdrum und MIDI,
  **kein Audio**.
- Wattenbergs GitHub (`github.com/wattenberg`): vier Repositories, nichts
  zu Musik.

### Musikstrukturanalyse

- **Foote, J.** (1999): Selbstähnlichkeitsmatrix, Checkerboard-Kernel.
- **Foote & Uchihashi** (2001): *Beat Spectrum* — B(l) als Summe über die
  l-te Diagonale der Ähnlichkeitsmatrix. Das ist die Autokorrelation.
- **Goto, M.** (2003/2006): *RefraiD*, Lag-Matrix, Refrainerkennung.
  Abstandsmaß r(t,l) = 1 − ||v(t) − v(t−l)|| / √12 auf maximumnormiertem
  Chroma, ausdrücklich dem Kosinus vorgezogen. Otsu auf die Gipfelhöhen
  von R_all(l), nicht auf die Rohähnlichkeit. Mindestlänge 6,4 s.
- **Serrà, J.** u. a. (2009, 2012, 2014): Zeitverzögerungs-Einbettung,
  *Structure Features*, Qmax. Nachbarschaftsanteil κ = 0,1 statt fester
  Schwelle; κ zwischen 0,05 und 0,15 unkritisch.
- **Wu & Bello** (2010): m = 25 bei 2 Rahmen/s, Zieldichte RR = 0,2
  *„after informal experimentation"*.
- **McFee & Ellis** (2014): Laplacian segmentation, Mehrheitsfenster
  17 Schläge.
- **Müller & Ewert**: path enhancement, Fitness-Maß (ρ = 0,15, δ = −2).
- **Paulus, Müller & Klapuri** (2010): Übersicht Musikstrukturanalyse.
- **Marmoret, Cohen & Bimbot** (2023): CBM, Correlation Block-Matching.
  TISMIR. Taktweise Matrix, dynamische Programmierung über alle
  Zerlegungen, RBF-Breite aus der Abstandsverteilung des Liedes —
  schwellenfrei, liefert aber Grenzen, keine Bögen.
- **Dannenberg & Hu** (2002): Audio → Transkription → Akkordkette →
  Zeichenkette. Die Akkordkette zeigte **keine** klaren Muster, dieselben
  Stücke über Chroma gerechnet lieferten die Struktur vollständig.
- **Nieto, O.** u. a. (2020): Schlagsynchronisation macht Wiederholungen
  erst zu sauberen Diagonalen. MSAF, SALAMI.
- **Rafii & Pardo** (2013): REPET — Wiederholungsperiode aus dem Beat
  Spectrum, ohne Ähnlichkeitsschwelle.
- **Wang, Hsu & Dubnov** (2015): VMO, Variable Markov Oracle. θ über die
  Information Rate gesucht, nicht gesetzt; Mindestlänge L = α × mittlere
  Suffixlänge mit α = 0,5 *„set empirically"*.
- **Silva, Yeh, Batista & Keogh** (2016): *SiMPle.* ISMIR, Abschnitt 5.3 —
  Arc-Diagramme aus dem Matrix Profile skizziert, mit Zitat auf
  Wattenberg, nie ausgebaut. Hub-Anfälligkeit: nur ein Nachbar je Fenster.
- **Casey & Slaney**: audio shingles, N nächste Nachbarn statt Schwelle.
- **Ogle & Ellis**: Landmarken-Selbstvergleich, 97 % Recall auf
  Produktionsaudio (aus zweiter Hand).
- **Deruty** u. a. (2025): Ein verzerrter Powerchord ist spektral kein
  Akkord aus zwei Tonhöhenklassen, sondern durch Intermodulation ein
  quasi-harmonischer Klang eine Oktave unter dem Grundton.

### Text und Doppeldiagramm

- **Watanabe, K.** u. a. (2016): Selbstähnlichkeitsmatrix über Liedzeilen,
  sim = 1 − normalisierte Levenshtein-Distanz auf Zeichen. 144.891
  Lieder. 84,79 % haben mindestens eine exakt wiederholte Zeile.
- **Fell, M.** u. a. (2018): CNN auf der Matrix. Das **einfachste** Maß
  ist das beste Einzelmaß: 66,5 % F1 für Zeichenvergleich, 64,2 %
  phonetisch, 59,9 % lexiko-syntaktisch.
- **Fell, M.** u. a. (2021), *Natural Language Engineering* 28(3): Text
  70,8 % — Audio 70,4 % — beides 75,3 %. **Ablation über die
  Ausrichtungsgüte:** gut 75,3 %, mittel 66,5 %, schlecht 41,9 % (Text)
  bzw. 36,1 % (Audio). Die Genauigkeit der Zeitanker ist die Obergrenze
  für beide Hälften.
- **Watanabe & Goto** (2020): RefraiD-Refrainzeiten über Zeitanker auf
  Textzeilen, gegen menschliche Annotation: F = 68,0 %.

### Schwellen, Nullmodelle, Kompression

- **Marwan, N.** (2011): Schwellenwahl bei Rekurrenzplots. Gao & Jins
  Ansatz (Maximum von dRR/dε) als mehrdeutig und instabil verworfen;
  systematische Studie bleibt offene Aufgabe.
- **Meredith, D.**: COSIATEC, SIATEC, SIATECCompress. Nur exakte
  Translationen in Punktmengen, Auswahl über sechs ordinale Kriterien —
  **keine einzige Zahl**. Braucht aber eine Partitur.
- **Louboutin & Meredith**: Zusammenhang zwischen Kompressionsfaktor und
  Analysequalität. Warnung: BZIP2 komprimierte am besten und
  klassifizierte am schlechtesten.
- **Chiu, Keogh & Lonardi** (2003): SAX. Gleichwahrscheinlichkeit der
  Symbole *„by our discretization procedure"* — **widerlegt** durch
  ASTRIDE (2023): D'Agostino-K²-Test über 86 Datensätze, alle verwerfen
  die Normalität der Segmentmittel bei 5 %.
- **Keogh, Mueen** u. a.: Matrix Profile, STAMP/STOMP/SCRIMP++, MASS,
  mSTAMP. FLUSS/CAC: Fensterlänge *„by visual inspection"*.
- **Essentia**: `binarizePercentile` 0,095.
- **MotivesExtractor**: Toleranz 0,35 von Hand, danach schrittweise
  gesenkt, bis etwas gefunden wird.

### Bioinformatik

- **Benson, G.** (1999): *Tandem repeats finder.* Nucleic Acids Research
  27(2):573–580. Erkennungsphase mit k-tuple matches und Abstandslisten,
  Analysephase mit wraparound dynamic programming, vier statistische
  Kriterien. Der NAR-Volltext liegt nur als Scan ohne Textebene vor —
  gelesen wurde Bensons freie Methodenbeschreibung plus der **Quelltext
  von TRF 4.10.0**: `Min_Distance_Window` = max(d,20) (`tr30dat.h`
  Z.169), das Random-Walk-Band (`tr30dat.c` Z.61), `newwrap` (Z.604),
  `add_tuple_match_to_Distance_entry` (Z.2231), Kopienzahl-Schwelle 1,9
  (Z.4166) und die Substitutionsmatrix `match(a,b) = SM[256*a+b]`
  (`tr30dat.h` Z.321) — seit Version 4 rechnet TRF ohnehin nicht mehr
  gegen Gleichheit, die Gleichheitsfassung in Z.313 ist auskommentiert.
- **Karlin, S. & Altschul, S.** (1990), PNAS 87:2264–2268: lokales
  Alignment setzt einen negativen Erwartungswert der Ähnlichkeit unter
  dem Nullfall voraus. Der Grund, warum man Chroma-Kosinus nicht
  ungezogen in ein Smith-Waterman-Schema steckt.
- **Rafii, Z. & Pardo, B.** (2013): *REPET.* IEEE TASLP 21(1):73–84.
  Beat Spectrum für die Periode, dann der Median über die Segmente —
  Konsensbildung auf reellen Werten, seit zwölf Jahren auf Musik, mit
  Vorgabe-Periodenbereich 1 bis 10 Sekunden. Das Ziel ist ein anderes
  (Quellentrennung, globale Periode); übertragbar ist der Median-Konsens.
- **igv.js**, `featurePacker.js`: gieriges Zeilenpacken, ein Array von
  Endkoordinaten, ein Durchlauf nach Sortierung. Dazu UCSCs Stufung
  dense/squish/pack/full. Warnung fürs Abschreiben: `maxRows` wird im
  Original nicht durchgesetzt.
- **Kuglin & Hines** (1975): Phasenkorrelation. Umgesetzt in
  `haeckel.html` (Caspar_Ds Mikroskopie-Projekt), dort mit Log-Polar nach
  **Reddy & Chatterji** für Drehung und Skalierung sowie NCC.
- **Martin, Brown, Hanna & Ferraro** (2012), ISMIR: BLAST auf Chroma —
  Wortliste, Diagonalen-Clustering, X-drop. **Kein E-Value**: die
  Karlin-Altschul-Statistik setzt ein diskretes Alphabet mit unabhängigen
  Buchstaben voraus, Audio hat keins. Stattdessen drei gesetzte Zahlen.
- **Altschul & Erickson**: dinucleotide shuffling als Nullmodell.
- **Benjamini & Hochberg**: False Discovery Rate — bei Millionen von
  Fenstertests unverzichtbar, in der Musikinformatik unüblich.
- DeepVariant (Google) / NVIDIA Parabricks: Pileups als
  Sechs-Kanal-Graustufenbilder, CNN darauf. Die **Kodierung** ist
  übertragbar, das Netz nicht (kein Modell im Betrieb).

---

## 10. Die Werkzeuge im Haus

- **FFT**: `bin/stoerfrequenz.js:75` (Radix-2, dazu `rfft` ab Zeile 131,
  am 26.08.2026 auf reelle FFT umgestellt) — **nicht exportiert**.
  Dieselbe Bauart in `web/fremd/analyzer-worker.js:25`. Eigene
  Sinustabellen in `bin/klang.js:126`. Wer eine vierte schreibt, macht
  etwas falsch.
- **Phasenkorrelation**: `haeckel.html`, `phaseCorr` / `phaseCorrF` ab
  Zeile 3693, mit Gipfelverhältnis als Eindeutigkeitsmaß und radialem
  Bandpass.
- **Daten je Lied**: `library/analyse/<id>.bin` — 34 durchgehende Reihen.
  **Der Datenblock beginnt beim nächsten Vielfachen von ACHT**
  (`web/fremd/analyse-ablage.js:204`); wer auf vier rundet, liest bei 164
  von 323 Liedern ein um einen Halbton rotiertes Chroma, und die Zahlen
  sehen gültig aus.
- **Kein volles Spektrogramm in der Ablage** — nur die abgeleiteten
  Größen. Das `|L|+|R|`-Bild rechnet der Analyzer live und legt es als
  `.spektro.webp` ab.
- **`library/lyrik.json`** (aus `bin/lyrik.js`): der gesungene Text je
  Zeile mit Zeitankern, 239 von 256 Liedern.
- **`library/toene.json`**: Hüllkurven je Stem, Tonart, Stimmlage.

---

## 11. Arbeitsstand

Alle Skripte liegen im Arbeitsverzeichnis der Sitzung
(`/private/tmp/claude-501/…/scratchpad/`), nichts davon ist im Projekt:

| Skript | Zweck |
|---|---|
| `takte-knn.js` | Taktkacheln, Bildkorrelation, k Partner je Takt |
| `baender-rampe.js` | Frequenzbereiche durchfahren |
| `abschnittspaare.js` | Grundwahrheit als Abschnittspaare, Bestandslauf |
| `multiples.js` | Small Multiples mit Blockstreifen |
| `matrix.js` | Selbstähnlichkeitsmatrizen mit farbigen Diagonalen |
| `phasenkorr-rampe.js` | Phasenkorrelation als Maß, Rampe |
| `vergleich-masse.js` | euklidisch gegen Phasengipfel |
| `konstanz.js` | tragen die Bögen Folgen oder Zustände |

Die Ideen, die über die Strukturanalyse hinausgehen, stehen in
`docs/eingang/2026-09-07-ideenvorlage.md`; die Recherchen im Wortlaut in
`docs/eingang/2026-09-07-arc-aehnlichkeit.md`, `-arc-welle2.md` und
`-tandem-repeats.md`.
