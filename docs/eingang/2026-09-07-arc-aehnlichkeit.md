# Ähnlichkeit für Musikbögen — was andere tun (Recherche, 07.09.2026)

**Status: OFFEN — Recherche, nichts gemessen, nichts gebaut**

Caspar_D: *„wir recherchieren erstmal, wie andere Ähnlichkeit von
Musikbögen definieren und messen"* — nachdem eine erste Untersuchung
zum Bogendiagramm an einer vorentschiedenen Merkmalswahl hängengeblieben
war (Chroma vorgegeben, punktweise verglichen).

Vorhaben dahinter: zwei Arc-Diagramme übereinander, oben die Musik,
unten die Lyrics, dazu einblendbar Sunos Abschnittsmarker.

Sechs Rechercheure, ein Gegenleser. Eine zweite Welle mit zehn weiteren
Blickwinkeln (Matrix Profile, SAX, Bioinformatik-Transfer, Signifikanz,
Kompression) lief zum Zeitpunkt dieser Ablage noch.

---
# Wie andere Aehnlichkeit von Musikboegen definieren und messen

Vorlage fuer Caspar_D. Recherchestand, nichts gemessen, nichts gebaut.

---

## 1. Der Kern

Wattenberg vergleicht Zeichen mit Zeichen. Ein Aehnlichkeitsmass kommt bei ihm gar nicht vor, nur Gleichheit, und der einzige Regler ist eine Mindestlaenge — 3 Noten bei Musik, 7 Symbole bei DNA, 10 bei seiner synthetischen Reihe, je nach Aufgabe von Hand gesetzt. Sobald an die Stelle der Notenfolge ein Signal tritt, muss dieser Gleichheitstest durch eine Zahl ersetzt werden, und mit der Zahl entsteht die Frage, ab wann sie gross genug ist. Auf diese Frage gibt es in der gesamten geprueften Literatur keine hergeleitete Antwort: keine absolute Aehnlichkeitsschwelle, in keiner Arbeit, weder in der Musikinformatik noch in der Rekurrenzplot-Physik, aus der die Verfahren stammen. Wer aus Ton Boegen rechnet, waehlt deshalb immer zweierlei — womit gemessen wird, und wie viel Bogen er sehen will. Das Zweite ist keine Eigenschaft der Musik, sondern eine Anzeigeentscheidung, und die ehrlichsten Arbeiten sagen das auch so.

---

## 2. Die drei Wege

### Weg 1 — Symbolisieren, dann exakt suchen

**Aehnlichkeit:** wird vor der Suche erledigt. Man quantisiert jeden Rahmen (oder Schlag) auf ein Symbol — Akkord, Tonhoehenklasse, Clusternummer — und laesst danach Wattenbergs Maschine unveraendert laufen. Sauberste Variante: VMO (Wang/Hsu/Dubnov 2015). Zwei Chroma-Rahmen bekommen dasselbe Symbol, wenn ihr Abstand unter theta liegt; das Alphabet entsteht aus dem Stueck selbst, ohne Tonart und ohne Akkordwoerterbuch. Darauf ein Suffixautomat, Wiederholungen sind die Suffix-Links.

**Schwelle:** wandert in die Quantisierungsgrenze und wird dort unsichtbar. VMO rechnet theta wirklich aus (Maximum der Information Rate ueber theta = 0 bis 2), aber die Mindestlaenge daneben ist L = alpha mal mittlere Laenge wiederholter Suffixe, mit alpha = 0,5 "set empirically". Die Zahl ist also nicht weg, sie steht nur an anderer Stelle.

**Bei dichtem Metal:** der schlechteste der drei. Dannenberg & Hu haben genau diesen Umweg 2002 gebaut — Audio, Transkription, Akkordanalyse, Zeichenkette — und berichten, die Akkordkette habe keine klaren Muster gezeigt; derselbe Aufsatz, dieselben Stuecke, ueber Chroma gerechnet, lieferte die Struktur vollstaendig. Ihre Fehlerdiagnose ist systematisch, nicht zufaellig: gleiches Material bekommt in verschiedener Umgebung verschiedene Labels. Dazu die Physik: ein verzerrter Powerchord ist spektral kein Akkord aus zwei Tonhoehenklassen, sondern durch Intermodulation ein quasi-harmonischer Klang eine Oktave unter dem gegriffenen Grundton (Deruty u. a. 2025). In der maj-min-Auswertung faellt er ohnehin durch, weil ihm die Terz fehlt.

**Was es hier kostet:** VMO ist reine Arithmetik auf unserem Chroma, billig. Akkorderkennung waere eine neue Abhaengigkeit (Chordino, C++-Vamp, GPL, kein Netz) mit unbekannter Laufzeit auf 323 Liedern — gemessen hat das niemand.

### Weg 2 — Matrix und Diagonalen

**Aehnlichkeit:** jeder Rahmen ist ein Vektor, jedes Rahmenpaar bekommt eine Zahl, Wiederholung erscheint als Streifen parallel zur Hauptdiagonale. Foote 1999 nimmt Kosinus auf MFCC. Goto 2006 nimmt euklidisch auf maximumnormiertem Chroma, r(t,l) = 1 − ||v(t) − v(t−l)|| / sqrt(12), und schreibt ausdruecklich, diese Kombination sei dem Kosinus ueberlegen. Serra 2009 und Wu & Bello 2010 vergleichen nicht Rahmen, sondern Fenster: Zeitverzoegerungs-Einbettung, bei Wu & Bello m = 25 bei 2 Rahmen/s, also 12,5 Sekunden Musik in einem Vektor. Das ist der Schritt, der aus "klingt gleich" ein "verlaeuft gleich" macht, und er ist die billigste wirksame Massnahme im ganzen Feld.

**Schwelle:** siehe Abschnitt 3. Quote, kNN oder Otsu auf einer abgeleiteten Groesse.

**Bei dichtem Metal:** die beste dokumentierte Aussicht, aber mit einer benannten Gefahr. Gotos zweite Hauptfehlerursache ist woertlich die Wiederholung aehnlicher Begleitung ueber weite Teile eines Stuecks — das ist die Beschreibung eines durchlaufenden Riffs. Das Gegenmittel haben wir und die Literatur nicht: getrennte Stems. Belegt ist der Hebel nicht, benannt als Fehlerquelle schon (VMO nennt das Zusammenwerfen der Stimmen als eigene Hauptfehlerquelle und schlaegt Quellentrennung vor).

**Was es hier kostet:** am wenigsten. Chroma liegt in library/analyse/<id>.bin. Schlagsynchron gemittelt werden aus rund 4800 Rahmen etwa 400 Schlaege; eine 400x400-Matrix rechnet Node in Millisekunden, ohne Bibliothek, ohne WASM, ohne Modell. Die Schlagzeiten liegen im Katalog, taktBpm auch — damit entfaellt sogar die Tempo-Mehrfachfilterung, gegen die Muellers und Serras Verfahren gebaut sind; die ist ein Klassikproblem, nicht unseres.

### Weg 3 — Kompression und Sparsamkeit

**Aehnlichkeit:** gar keine. Meredith (COSIATEC, SIATECCompress) kennt nur exakte Translationen in einer Punktmenge aus Anschlagzeit und Tonhoehe; ausgewaehlt wird nach Kompressionsverhaeltnis, dann Kompaktheit, dann ueberdeckter Bereich, dann Musterlaenge, dann kuerzere Dauer, dann kleinere Bounding-Box. Sechs Stufen, rein ordinal, keine einzige Zahl. Grundhypothese: Musikanalyse ist Musikkompression. Louboutin & Meredith weisen empirisch einen Zusammenhang zwischen Kompressionsfaktor und Analysequalitaet nach.

**Schwelle:** wirklich keine. Das ist der einzige geprueste Fall.

**Bei dichtem Metal:** nicht anwendbar. Das Verfahren braucht eine Partitur. Der Weg dorthin ist Weg 1, mit dessen Problemen.

**Was es hier kostet:** zu viel, und es setzt Weg 1 voraus. Die Audio-Echos dieses Gedankens sind VMOs Information Rate und Muellers Fitness-Mass — bei beiden steht die Zahl aber wieder woanders (alpha = 0,5; und unter der Fitness wird die Matrix weiterhin relativ geschwellt, rho = 0,15, mit Strafwert delta = −2).

---

## 3. Die Schwellenfrage

Die Verteilung hat keine Kante, und das ist bekannt. Marwan hat 2011 den einzigen Ansatz, der die Kante in der Rohverteilung sucht (Gao & Jin, Maximum von dRR/de), als mehrdeutig und hochgradig instabil verworfen, und schreibt, eine systematische Studie zur Schwellenwahl bleibe eine offene Aufgabe. Dass ein Versuch an dieser Stelle einmal gescheitert ist, ist also kein Projektfehler, sondern ein publiziertes Ergebnis.

Was stattdessen gemacht wird, in vier Familien:

**Quote statt Schwelle.** Serra 2009: hoechstens kappa = 0,1 Nachbarn je Zeile und Spalte, Optimalbereich 0,05 bis 0,15, kein Feintuning noetig; sie berichten ausdruecklich, ein fester Prozentsatz sei einer festen Schwelle ueberlegen. Essentia: binarizePercentile 0,095. Mueller: die obersten rho mal 100 Prozent, zusaetzlich zeilen- und spaltenweise. Wu & Bello: Zieldichte RR = 0,2, "after informal experimentation" — und sie benennen den Preis selbst: Strophenform und Rondo wurden von den Versuchspersonen verwechselt, weil eine feste Dichte genau den Formunterschied wegnormiert.

**Schwelle auf eine abgeleitete Groesse, in der eine Kante entsteht.** Goto wendet Otsus Zweiklassenkriterium nicht auf die Rohaehnlichkeit an, sondern auf die Hoehen der Gipfel in R_all(l), der ueber die Zeit aufsummierten Lag-Funktion. Dort gibt es zwei Klassen, also greift das Verfahren. Er tut das an drei Stellen im selben Aufsatz. Das ist der praktikabelste Zug im ganzen Bestand: nicht N² Zellen schneiden, sondern eine eindimensionale Kurve.

Diese Kurve hat einen Namen, den unsere Recherche uebersehen hat: Foote & Uchihashi nennen sie 2001 **Beat Spectrum**, B(l) = Summe ueber die l-te Diagonale der Aehnlichkeitsmatrix. Das ist genau die Autokorrelation, nach der das Vorhaben heisst, und genau Gotos R_all(l). REPET (Rafii & Pardo 2013) schaetzt daraus die Wiederholungsperiode, ganz ohne Aehnlichkeitsschwelle.

**Schwelle durch ein Ziel ersetzt.** VMO maximiert die Information Rate, Meredith das Kompressionsverhaeltnis, Mueller die Fitness aus Praezision mal Abdeckung. Elegant, aber schwer zu erklaeren, warum gerade dieses Ziel — und bei zweien von dreien steht die Zahl nur woanders.

**Gar nicht schneiden, sondern ordnen.** Casey & Slaney entscheiden nie "Treffer ja/nein", sondern nehmen die N naechsten Nachbarn. SiMPle zeichnet alle Boegen und codiert die Distanz als Deckkraft: je dunkler der Bogen, desto naeher die Teilfolgen. Ihre Abbildung 6 zeigt beide Varianten nebeneinander, mit und ohne Schwelle.

**Die ehrliche Antwort auf "gibt es einen Weg ohne gesetzte Schwelle":** genau einen — Merediths —, und der laeuft nicht auf Audio. Ueberall sonst taucht die Zahl an anderer Stelle wieder auf, meist als Mindestlaenge: Wattenberg 3 Noten, Goto 6,4 Sekunden, McFee ein Mehrheitsfenster von 17 Schlaegen, SiMPle 5 Sekunden, Burges 6 Sekunden Mindestabstand. Serra 2014 nennt seine eigene Schwelle mu + sigma "rather arbitrary" und hat sie nachtraeglich an Annotationen geeicht. Das oeffentlich einzige Audio-System, das bogenartige Musterpaare ausgibt (MotivesExtractor), setzt eine Toleranz von 0,35 von Hand und senkt sie danach in Schritten, bis ueberhaupt etwas gefunden wird.

Und der Punkt, der uns von allen unterscheidet: diese Arbeiten muessen blind setzen, weil sie nichts haben, woran sie messen koennten. Wir haben etwas. Wir muessen deshalb gar keine Regel uebernehmen — wir koennen den Parameter durchfahren und die ganze Kurve zeigen, mit 47 Prozent und 80 Prozent als zwei waagerechten Linien.

---

## 4. Die Textseite

Wie Wiederholung in Liedtexten gemessen wird, ist erstaunlich schlicht. Watanabe u. a. (2016, 144 891 Lieder) bauen eine Selbstaehnlichkeitsmatrix ueber die Zeilen mit sim = 1 − normalisierte Levenshtein-Distanz, auf Zeichen. Fell u. a. (2018) ersetzen die Nachbearbeitung durch ein CNN, das die Matrix als Bild liest, und stellen fest, dass das einfachste Mass das beste Einzelmass ist: 66,5 Prozent F1 fuer den Zeichenvergleich, 64,2 fuer die phonetische Variante, 59,9 fuer die lexiko-syntaktische. Die aufwendigen Masse schleppen Fehler von Tokenizer und POS-Tagger ein.

Grundzahlen zur Einordnung: 84,79 Prozent der Lieder haben mindestens eine exakt wiederholte Zeile, 90,34 Prozent bei milder Wertung. Bei ganzen Abschnitten 37,73 gegen 54,57 Prozent. Auf Zeilenebene bewegt eine Schwellenentscheidung also wenig, auf Abschnittsebene fast ein Drittel des Bestands.

Fuer unsere untere Haelfte gilt Wattenberg buchstaeblich: gesungene Zeilen sind ein String ueber einem Alphabet von Zeilen, Wiederholung ist exakt, die Mindestlaenge ist eine Zeile. Das ist die einzige Haelfte, fuer die es ein seit 2002 definiertes, unstrittiges Verfahren gibt — und genau der Grund, warum sie als Grundwahrheit taugt. Eine Einschraenkung dazu: Wattenbergs Definitionen sind nachweislich unvollstaendig, es fehlt eine Minimalitaetsbedingung bei den Wiederholungsregionen, und sein eigenes Beispiel 10101010 erfuellt seine Definition 1.3 nicht. Wer essential matching pairs baut, trifft zwei bis drei eigene Entscheidungen, die im Papier fehlen.

**Hat jemand Text und Klang schon gegeneinandergestellt? Ja, zweimal.**

Fell u. a. (2021, Natural Language Engineering 28(3), offen in Fells Dissertation) bauen auf zeitsynchronisierten Lyrics zwei Matrizen mit identischer Zeilenrasterung — jede Audiozeile ist genau das Zeitintervall der gesungenen Textzeile. Ergebnis: Text allein 70,8 Prozent F1, Audio allein 70,4 Prozent. Gleichstand. Beides zusammen 75,3 Prozent, signifikant besser. Die beiden Seiten sind nicht redundant, sondern ergaenzend. Das ist die empirische Antwort auf die Frage, ob der Musikbogen dasselbe sagt wie der Textbogen: nein, und gerade deshalb lohnt das Nebeneinander.

Watanabe & Goto (2020) haben in die andere Richtung geprueft: Refrainzeiten aus dem Ton (RefraiD) ueber Zeitanker auf Textzeilen uebertragen und gegen menschliche Annotation gehalten. F = 68,0 Prozent. Unsere 80 Prozent fuer Sunos segment_labels liegen darueber. Der Massstab, den wir angelegt haben, ist also kein bescheidener, sondern ein ungewoehnlich hoher.

Eine Warnung aus derselben Arbeit, die wichtiger ist als alles andere in diesem Abschnitt: Fells Ablation ueber die Ausrichtungsguete ergibt bei guter Synchronisation 75,3 Prozent, bei mittlerer 66,5, bei schlechter faellt Text auf 41,9 und Audio auf 36,1. Die Genauigkeit der Whisper-Zeitanker ist nicht ein Detail der unteren Haelfte, sie ist die Obergrenze fuer beide.

Nicht gefunden: irgendein Bogendiagramm von Liedtexten. Die gesamte Textwiederholungsforschung zeichnet Matrizen, nie Boegen. Die untere Haelfte waere in der Form neu, in der Sache gut abgesichert.

---

## 5. Was ich nehmen wuerde und warum

**Ein Merkmal: schlagsynchron gemitteltes Chroma.** Aus dem, was schon in library/analyse/<id>.bin liegt, mit den Schlagzeiten aus dem Katalog per Median zusammengefasst. Keine neue FFT, keine Abhaengigkeit, kein Modell. Begruendung: es ist das Arbeitspferd aller drei ernstzunehmenden Verfahren (Goto, McFee, Serra); unser Chroma ist gipfelbasiert und damit merkmalsseitig genau Serras HPCP-Familie, also fuer verzerrtes Material die richtige Bauart; und die Schlagsynchronisation ist laut Nieto u. a. 2020 das, was Wiederholungen ueberhaupt erst zu sauberen Diagonalen macht.

**Ein Mass: Gotos normierter euklidischer Abstand.** r(t,l) = 1 − ||v(t) − v(t−l)|| / sqrt(12), auf Vektoren, die auf ihr groesstes Element normiert sind. Drei Gruende. Erstens ist es das einzige Mass, dessen Autor es ausdruecklich gegen den Kosinus geprueft und fuer besser befunden hat. Zweitens liegt es in [0,1] und ist damit lesbar. Drittens — und das ist der eigentliche Grund — ist Gotos Kette die einzige veroeffentlichte, die vollstaendig von Audio bis zu Wiederholungspaaren fuehrt, also bis zu dem, was ein Bogen ist. Alles andere in der Literatur endet bei Grenzen.

**Die Schwelle: nicht setzen.** Summiere r ueber die Zeit zu R_all(l) — dem Beat Spectrum, unserer Autokorrelationskurve — und lege Otsu auf die Gipfelhoehen, wie Goto. Wenn die Gipfelhoehen eingipflig bleiben, liefert Otsu trotzdem einen Wert, der aussieht, als sei er gefunden; dann waere Rosins Verfahren fuer eingipflige Histogramme der naechste Griff, oder schlicht: die Kurve zeigen und den Regler sichtbar lassen.

**Was ich zunaechst weglassen wuerde:** Akkorde, Stems, Fusion mehrerer Sichten, Transpositionsinvarianz. Alles davon ist begruendbar, aber jedes davon ist eine zweite Stellschraube, bevor die erste geprueft ist.

**Woran man nach einem Nachmittag sehen wuerde, dass es nicht traegt.**

Vorher, eine halbe Stunde: ein Lied nehmen und pruefen, ob zwei Vorkommen desselben Refrains nahezu identisches Audio sind. Wenn ja, findet ein Landmarken-Selbstvergleich die Boegen in Minuten (Ogle & Ellis melden 97 Prozent Recall auf Produktionsaudio), und die ganze Chroma-Diskussion betrifft nur den Rest. Wenn nein, wissen wir, dass wir im schwierigen Fall sind. Der Unterschied zwischen diesen beiden Welten ist groesser als jeder Verfahrensunterschied in dieser Recherche.

Danach, der Nachmittag, zwanzig betextete Lieder:

Erster Test. Fuer jedes Lied R_all(l) rechnen und in dieselbe Kurve die Lags eintragen, die aus den Textwiederholungen folgen — der zeitliche Abstand zwischen zwei Vorkommen derselben Zeile. Frage: liegen die Text-Lags auf Gipfeln? Wenn in der Mehrzahl der Lieder die hoechsten Gipfel dort stehen, wo der Text nichts sagt, und die Text-Lags im Rauschen liegen, traegt das Merkmal nicht, und keine Schwelle repariert das. Das sieht man an zwanzig Bildern in einer Stunde.

Zweiter Test, nur wenn der erste haelt. Nicht die Schwelle durchfahren, sondern die Bogendichte, von duenn nach dicht, und fuer jede Dichte auftragen, welcher Anteil der Textboegen von einem Musikbogen getroffen wird. Zwei waagerechte Linien: 47 Prozent Zufallsbasis, 80 Prozent Suno. Kreuzt die Kurve nie die 47, ist die Sache entschieden und sichtbar entschieden. Bleibt sie zwischen 47 und 80, ist die Messung schlechter als das, was ohnehin im Katalog liegt — dann bleiben Sunos Marker, und die Musikboegen sind bestenfalls eine zweite Meinung.

Diese Kurve ist zugleich die Antwort auf die Schwellenfrage. Wir muessen keine Regel aus der Literatur uebernehmen. Wir zeigen den Regler und seine Wirkung.

---

## 6. Was wir noch nicht wissen

1. **Ob Suno wiederholte Refrains als nahezu identisches Audio ausgibt.** Groesster einzelner offener Punkt, in einer halben Stunde entscheidbar, und die Konsequenz ist groesser als jeder Methodenunterschied.

2. **Zu stark verzerrter, dichter Musik sagt die Literatur nichts.** Gezielt gesucht, nichts gefunden — keine Arbeit, die belegt oder misst, dass Chroma an Verzerrung scheitert. Was es gibt, sind vier Indizien und eine Analogie zu EDM. Die oeffentliche Metal-Grundlage der Musikstrukturanalyse besteht aus fuenf Stuecken, rund 30 Minuten. Wer sagt, die Fachwelt wisse, dass das bei Metal nicht geht, hat dieselbe Luecke und fuellt sie mit Vermutung.

3. **Ob eine Messung je Stem besser laeuft als auf dem Mix.** Gut begruendete Hypothese (VMO nennt das Zusammenwerfen der Stimmen als eigene Hauptfehlerquelle und schlaegt Quellentrennung als Verbesserung vor), aber niemand hat es gemessen. Wir haben die Trennung. Das waere eigene Arbeit, kein Nachbau.

4. **Die Genauigkeit unserer Whisper-Zeitanker.** Unbekannt, und nach Fells Ablation ist sie die Obergrenze fuer beide Bildhaelften, nicht nur fuer die untere.

5. **Die 64 textlosen Stuecke haben keine untere Haelfte.** Dort steht das Bild allein und ist nicht pruefbar. Das sollte es zeigen, nicht kaschieren — es ist zugleich der ehrlichste Haertetest: was dort Unsinn zeigt, war auch bei den Liedern Unsinn, man hat es nur nicht gesehen.

6. **Laufzeiten.** Fuer alles mit Abhaengigkeit (Chordino, all-in-one) unbekannt, auf keiner Hardware belegt. Solange wir bei Weg 2 bleiben, irrelevant.

7. **"Path relevance" liess sich nicht als Fachbegriff belegen.** Zwei gezielte Suchen, kein kanonischer Beleg. Inhaltlich Verwandtes gibt es (Pfadfamilien-Score bei Mueller, Q_max bei Serra). Wenn der Begriff aus einer bestimmten Arbeit stammt, muesste die genannt werden.

8. **Ob genau dieses Bild schon jemand gebaut hat** — Musikboegen oben, Textboegen unten, gemeinsame Achse — liess sich nicht klaeren. Am naechsten kommen Wattenbergs Abbildung 16 (Fuer Elise doppelt, Tonhoehen oben, Intervalle gespiegelt darunter) und Fells nebeneinandergestellte Matrizen. Beides sind zwei Musikebenen oder zwei Matrizen, nicht Musik gegen Text als Boegen. Ausserhalb von ISMIR und InfoVis kann ich es nicht ausschliessen.
