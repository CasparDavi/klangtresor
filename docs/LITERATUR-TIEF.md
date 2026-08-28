# Was die Fachliteratur wirklich sagt

*Systematische Recherche zu Songanalyse, Raumakustik und Gehörakustik —
jeweils bewertet gegen den Stand von KlangTresor.*

Stand 28.08.2026.

## Wie das hier entstanden ist

Drei getrennte Recherchen, parallel, jede mit dem Auftrag: **erst
Übersichtsarbeiten suchen, von dort die meistzitierten Primärarbeiten
verfolgen, die wiederkehrenden Namen herausschreiben, Widersprüche
benennen** — und jeden Fund gegen unseren Stand bewerten statt ihn nur
zu sammeln. Zusammen rund **310 Werkzeugaufrufe**, Semantic Scholar und
OpenAlex für Zitationszahlen, PubMed/PMC für die Audiologie, arXiv und
die AES-Bibliothek für die Akustik.

Der Unterschied zum ersten Durchgang (`docs/LITERATUR.md`, neun
Websuchen) zeigt sich am Ertrag: Diese Fassung hat **zwei Fehler in
unseren eigenen Dokumenten** gefunden und **zwei Verfahren im Browser
nachgemessen** statt sie zu schätzen.

Wo eine Zahl nicht zu belegen war, steht es dabei. Mehrere Volltexte
blieben hinter Bezahlschranken (ScienceDirect, AES, Salford); auch das
steht jeweils dort, wo es fehlt.

---

## Was diese Recherche an unseren eigenen Zahlen berichtigt hat

**1. Der Störabstand war vertauscht.** In `docs/BACKLOG.md` und in
meinem Nachtrag zu `docs/EINMESSEN.md` stand „Störabstand je Band
14,2 dB". Falsch: 14,2 dB ist der **breitbandige** Wert und im
Originaltext ausdrücklich als Fehlalarm gekennzeichnet; **je Band**
waren es 39,9 dB. Die abgelegte Messung vom 27.08. nennt **34,8 dB je
Band**.

Das ist keine Kleinigkeit: **ISO 3382-1 verlangt für T20 einen
Abklingbereich von 35 dB**, für T30 deren 45. Mit 34,8 dB liegt eine
T20-Auswertung an der Schwelle — mit 14 dB wäre keine einzige
Nachhallauswertung möglich gewesen. Beide Stellen sind berichtigt.

**2. Die „20 dB mehr Dynamik" gelten nicht für uns.** Farinas Zahl ist
der Vergleich **ESS gegen MLS-Meßgeräte**. Wir benutzen kein MLS. Der
Gewinn der Entfaltung ist trotzdem groß, aber er hat einen anderen
Grund — siehe die Sweeprate-Grenze unten.

---

# 1 · Songanalyse

## 1.1 Der wertvollste Fund: die Karte lügt über Nachbarschaften

**Chari & Pachter, „The specious art of single-cell genomics", PLOS
Computational Biology 2023** — die schärfste methodische Kritik an
UMAP, aus der Genomik, aber unmittelbar auf uns anwendbar:

- Die **Jaccard-Distanz zwischen den Nachbarschaften im 2D-Bild und im
  Ursprungsraum liegt im Mittel über 0,7** — die nächsten Nachbarn im
  Bild sind zu über 70 % nicht die nächsten Nachbarn in den Daten.
- Bei gleich weit entfernten Gruppen erscheinen im Bild **4- bis
  200-fach** verzerrte Abstandsverhältnisse.
- Die Rangkorrelation der Nachbarschaftsordnung liegt **bei ≤ 0,4**.

Dazu die **Hubness** (Radovanović et al., JMLR 2010): In hohen
Dimensionen werden einzelne Punkte zu Nachbarn unverhältnismäßig vieler
anderer, während andere nie auftauchen. MIR-Datensätze werden dort
ausdrücklich als besonders betroffen genannt. 1280 Dimensionen bei 321
Songs ist genau die Lage, in der beides zubeißt.

**Wo wir stehen:** Das Clustering läuft bereits richtig — „agglomerativ
auf sqrt(1−cos) im **1280-dim-Raum**", so steht es in `bin/karte.js`.
Die Nachbarschaftslisten in `karte.json` entstehen an derselben Stelle,
also ebenfalls im vollen Raum. **Das ist gut und war offenbar Absicht**
(`docs/CLUSTERING-RECHERCHE.md` hält den Fehler fest, den beide Seiten
vermeiden).

### Und zwei weitere Befunde, die uns nicht treffen

Die Recherche fand, daß `umap-js` **keine spektrale Initialisierung**
rechnet und `Math.random` **ohne Saat** benutzt — jede Neuberechnung
ergäbe eine andere Karte. Beides steht so im Quelltext der Bibliothek.

**Wir übergeben aber einen eigenen Zufallszahlengeber** mit fester Saat
(`mulberry32(20260821)`, `bin/karte.js`). Und im Kommentar daneben steht
Caspar_Ds Einwand vom 21.08.2026: „UMAP bewahrt nur die Nachbarschaft,
die Abstände auf der Karte sind erfunden — Ketten und Inseln sind
Artefakte." Deshalb rechnet `karte.js` zusätzlich **NMDS**. Die
Literaturkritik war vorweggenommen, bevor sie gefunden wurde.

### Die Hubness — gemessen, nicht vermutet

Die offene Frage war, ob bei 321 Songs in 1280 Dimensionen einzelne
Stücke zu „Hubs" werden, die überall als Nachbar auftauchen, während
andere nie erscheinen. Die Literatur nennt beide Möglichkeiten: Der
Datensatz `dexter` (n = 300) zeigt eine Schiefe von 3,98, `haberman`
(n = 306) nur 0,09. **Entscheidend ist nicht die Sammlungsgröße, sondern
die intrinsische Dimension.** Das ließ sich nur messen.

Gemessen an den echten Einbettungen, 321 Songs, Kosinus auf
L2-normierten Vektoren, k = 5:

| | roh | mit Mutual Proximity |
|---|---|---|
| Schiefe S₅ | **0,96** | −0,02 |
| größter Hub | 19× (erwartet 5) | 10× |
| **Waisen** (in keiner Top-5-Liste) | **19 von 321** | **7** |
| Erreichbarkeit | 94,1 % | **97,8 %** |

**Die Schiefe liegt unter Schnitzers Wirkschwelle von 1,4.** Zum
Vergleich: Der FM4-Soundpark des ORF, ein echter Empfehlungsdienst mit
11.229 Liedern, lag bei 5,65 — und dort waren **27,4 % aller Lieder
prinzipiell unerreichbar**. Bei uns sind es 5,9 %.

**Trotzdem lohnt die Korrektur**, denn die Erreichbarkeit ist das
Maß, das für ein persönliches Archiv zählt: **Zwölf Songs, die heute in
keiner einzigen Ähnlichkeitsliste auftauchen, würden auffindbar.**
19,1 % aller Empfehlungen ändern sich.

Kosten: **52 ms**, gemessen. Rund 15 Zeilen JavaScript, keine
Abhängigkeit. Die Literatur warnt vor der kubischen Laufzeit von Mutual
Proximity — bei 321 Songs ist sie billiger als die Distanzmatrix davor,
weil dort die 1280 Dimensionen eingehen und hier nicht.

Ein Nebenbefund, der die niedrige Schiefe erklärt: **31,4 % der
Einbettungskomponenten sind negativ.** Radovanović nennt genau einen
hubness-freien Fall — Kosinusdistanz auf um null verteilten Daten, weil
dort kein Vektor räumlich zentraler ist als ein anderer. Wir liegen
näher an diesem Fall als an dem eines positiven Orthanten.

**Was noch offen ist:** die Nachbarschaftstreue der Karte selbst —
Jaccard-Überlappung der k nächsten Nachbarn in 1280D gegen die
2D-Koordinaten. Das sagt, wie sehr das Bild in die Irre führt, und
gehört als Satz in die Legende.

## 1.2 Größer ist bei Ähnlichkeit nicht besser — mit Zahlen

**Tamm & Aljanaki, RecSys 2024** (Music4All-Onion: 17.053 Nutzer,
56.193 Stücke, 5,1 Mio. Interaktionen). Eingefrorene Einbettungen, drei
Empfehlungsmodelle:

| Einbettung | Tonart | **Empfehlung** |
|---|---|---|
| MusicFM | 0,674 | 0,261 |
| Jukebox (5 Mrd. Parameter) | 0,667 | **0,219** |
| MERT | 0,656 | 0,360 |
| **MusiCNN** (klein, überwacht) | **0,128** | **0,385** |

Das kleinste Modell ist bei Empfehlung das beste und bei Tonart das
schlechteste; Jukebox mit fünf Milliarden Parametern ist bei Empfehlung
das schlechteste.

**Discogs-EffNet ist der nächste Verwandte von MusiCNN.** Unsere
Aufteilung — kleines überwachtes Netz für den Klangraum, eigenes
DSP-Verfahren für die Tonart — ist damit nicht Kompromiß, sondern genau
das, was diese Zahlen nahelegen. **Ein Wechsel auf MERT würde die
Ähnlichkeit voraussichtlich verschlechtern.**

**MAEST ist der einzige belegte Aufrüstungspfad** — gleiches Labor,
gleiche Discogs-Vortrainierung, und das ONNX liegt bei Essentia
**offiziell mit dynamischer Stapelgröße** bereit, kein Export nötig:

| | Δ ROC | Δ mAP |
|---|---|---|
| Genre | +0,5 | +1,7 |
| **Instrumente** | **+2,4** | **+3,1** |
| **Stimmung** | **+2,5** | **+1,8** |

Preis: **~340 MB statt ~18 MB**, das 19-fache. Ein einmaliger
Neuberechnungslauf über 321 Songs läge bei Minuten. Aber es ist ein
Eingriff in den Datenfluß: andere Einbettungsdimension, neue Köpfe,
Analyzer und Ähnlichkeitsindex müssen neu gerechnet werden.

**Ein Wechsel auf CLAP wäre dagegen ein Rückschritt.** Der
MGPHot-Benchmark (2025) mißt genau unsere Aufgabe — MTG-Jamendo, mAP:
**MAEST 0,154 · MERT 0,139 · CLAP 0,124.** Ein Wechsel von der
Discogs-Linie auf CLAP verlöre rund ein Fünftel. Der Grund ist
strukturell: 87 der 185 MTG-Jamendo-Etiketten sind Genre-Etiketten, die
mit dem Discogs-Trainingsvokabular überlappen. Diese Paßgenauigkeit ist
unser Vorteil, und sie ist nicht wegzuoptimieren.

**Zwei Zahlen zum Maßhalten:** Der weltweite Bestwert bei
MTG-Jamendo Stimmung liegt bei **PR-AUC 0,161** — auch der Beste liegt
bei vier von fünf Vorhersagen daneben. Und MagnaTagATune hat sich in
**neun Jahren um 2,0 ROC-Punkte** bewegt. Von einem Modellwechsel ist
kein Sprung zu erwarten, von keinem Modell.

## 1.3 Wo wir wirklich stehen: die Tonart

| Verfahren | GiantSteps (EDM) | Billboard (Pop) |
|---|---|---|
| Spitzenreiter (KeyMyna, 2026) | 75,9 % | 84,4 % |
| AllConv (Korzeniowski/Widmer) | 74,6 % | 85,1 % |
| MERT-95M | 73,0 % | 81,3 % |
| **Foundation Models allgemein** | **61,7–67,4 %** | — |
| Krumhansl-Vorlage (klassisch) | 53,4 % | — |

Die MIREX-Bewertung ist gewichtet: 1,0 richtig, **0,5 für die Quinte**,
0,3 für die Paralleltonart, 0,2 für gleichnamiges Dur/Moll. Eine
„Genauigkeit von 80 %" kann also viele Quintverwechslungen enthalten.

**Der Verdacht zu unserem Verfahren** — ausdrücklich unbelegt, aber
billig prüfbar: Wir rechnen die Tonart aus der **Bassspur**. Der Modus
(Dur gegen Moll) hängt aber an der **Terz**, und die liegt in
Mittelstimmen und Harmonieinstrumenten, nicht im Baß. Der Baß liefert
Grundtonbewegung, also Tonika-Kandidaten, aber kaum Geschlecht.

Wenn das zutrifft, verrät es sich durch eine **auffällig hohe Rate an
Varianten-Fehlern** (C-Dur statt c-Moll). Bei guten Vollmix-Verfahren
liegt sie bei 4–5 %.

**Der Test kostet nichts:** 30–50 Songs von Hand etikettieren, Fehler
nach MIREX-Klassen aufschlüsseln statt nur richtig/falsch zu zählen.
Bestätigt sich der Verdacht, ist die Reparatur klein — Modus aus der
Harmoniespur (das `other`-Stem liegt vor), Grundton weiter aus dem Baß.

Zur Literatur gibt es nichts zu Tonart aus separierten Spuren, weder
dafür noch dagegen. Wir wären dort allein.

## 1.4 Beat und Struktur: zwei verschiedene Antworten

**Beat This** (CPJKU Linz, ISMIR 2024) — und der praktische Fund: Es
gibt **zwei unabhängige ONNX-Portierungen, beide MIT-lizenziert**, und
eine liefert sogar **das Mel-Frontend als eigenes 270-KB-ONNX** mit. Es
muß also nichts in JavaScript nachgebaut werden.

- Kleines Modell **10 MB**, volles 83 MB
- Laufzeit auf einem M4: 4:32-Stück in **4,6 s**
- Genauigkeit gegen die Python-Referenz: F-Measure 1,0 (voll), ≥ 0,99 (klein)
- `onnxruntime-node` genügt — **keine neue Abhängigkeit**

**Aber nicht als Ersatz für Sunos Schlagzeiten, sondern als
Gegenprüfung.** Suno liefert Erzeugungswahrheit; ein Netz schätzt.
Niemand hat allerdings je geprüft, ob Sunos Metadaten zum **abgemischten
und gemasterten** Audio passen — dazu gibt es keine Literatur. Genau das
könnte ein lokaler Zweit-Tracker beantworten: Wo beide auseinanderlaufen,
lohnt Hinsehen.

Vergleichsvorschrift, damit die Zahlen zur Literatur passen: **±70 ms
Toleranz, erste 5 Sekunden verwerfen** (mir_eval-Konvention).

**Struktur dagegen: klares Nein** — und die Begründung ist eine andere,
als ich zuerst schrieb.

Die verbreitete Angabe, Menschen erreichten „~90 %", stammt aus dem
TISMIR-Survey und steht dort **unbelegt** („is thought to be").
Gemessen wurde es von Ullrich, Schlüter und Grill (ISMIR 2014) an 498
doppelt annotierten SALAMI-Stücken: **F ≈ 0,67–0,68 bei ±0,5 s
Toleranz, 0,76 bei ±3 s.** Zwei Fachleute sind sich also zu zwei
Dritteln einig, nicht zu neun Zehnteln.

Damit liegt der Weltstand (SongFormer 2025: 0,703) sogar *auf*
menschlichem Niveau. Die Schlußfolgerung bleibt trotzdem: Suno liefert
keine Schätzung, sondern den Erzeugungsplan. Ein lokales Verfahren
könnte ihn bestenfalls bestätigen.

Zwei Zahlen zum Maßhalten aus derselben Arbeit: Eine **triviale
Grundlinie**, die einfach gleichmäßig verteilte Grenzen setzt, erreicht
schon **F = 0,33 bei ±3 s.** Der ganze nutzbare Spielraum zwischen
„nichts können" und „so gut wie ein Mensch" ist also 0,43 breit. Und
alles, was ohne Training lokal liefe, landet bei 0,35–0,50 — näher an
der Trivialgrenze als am Menschen.

Dazu ein methodischer Fund, der Vorsicht bei allen Vergleichen gebietet:
**Ungetrimmte Metriken schenken bis zu 9 F-Punkte.** Anfang und Ende
einer Datei sind semantisch keine Grenzen, aber `mir_eval` zählt sie
standardmäßig mit — und viele Arbeiten sagen nicht, welche Variante sie
verwenden.

### Was Suno tatsächlich liefert — nachgesehen

Eine Annahme mußte ich dabei berichtigen: **Suno liefert keine
Funktionsnamen.** Das Feld `abschnitte` enthält kein „Strophe" oder
„Refrain", sondern anonyme Gruppenbuchstaben:

```
{ state: "complete",
  peak_times:     [11.72, 20.64, 25.6, 47, 62.44, …],
  segment_labels: ["A", "A", "A", "B", "C", "C", "D", …] }
```

Das sind Cluster — „diese Stellen klingen gleich" —, nicht Bedeutungen.
Wer daraus „Refrain" macht, legt eine Deutung darüber.

**Und der billige Plausibilitätstest, den die Recherche vorschlug, ist
gemacht:** Liegt die letzte Abschnittsgrenze plausibel zur Dauer? Bei
Bearbeitungen (Crop, Extend, Replace Section) könnten die Zeitmarken
verrutschen — das wäre die einzige Fehlerklasse, die überhaupt plausibel
ist.

**Ergebnis: 321 von 321 stimmig, keine einzige Auffälligkeit.** Median
15 Grenzen je Song, zwischen 7 und 39. Alle im Zustand `complete`.
Die Suno-Angaben passen zum Audio.

## 1.5 Der Dämpfer

**„The SMC Blind Spot"** (2026): Auf den Standarddatensätzen ist
Beat-Tracking gelöst — Ballroom 0,986. Auf SMC (ausdrucksstarke Musik,
Median 71 BPM) fällt es auf **0,627**. Ein Abstand von über 0,35.

Und ein Befund, der alte Gewißheiten stürzt: **Das DBN-Nachbearbeiten
schadet** — −0,051 F-Measure, 58 % der Stücke werden schlechter. Beat
This kommt bewußt ohne aus; madmom baut darauf.

Für uns: 321 Suno-Songs sind vermutlich metronomisch stabil und im
Trainingsbereich. Aber ein Abweichungsalarm heißt „hinsehen", nicht
„Suno hat unrecht".

---

# 2 · Raumakustik

## 2.1 Der Befund, der alles Weitere begründet

Nicht die 20 dB. Sondern: **Das heutige Verfahren kann die Moden gar
nicht sehen, um die es geht.**

Ein exponentieller Sweep von 20 Hz bis 20 kHz in 13 s hat bei der
Frequenz f eine Sweeprate von f · 6,908 / 13. Eine Mode mit der
Bandbreite B braucht 1/(πB) zum Einschwingen. Verlangt man drei
Zeitkonstanten Verweildauer, folgt B² ≳ df/dt:

| f | Sweeprate | nötige Modenbreite | entspricht Q ≤ | RT60 ≤ |
|---|---|---|---|---|
| 40 Hz | 21,3 Hz/s | 4,6 Hz | 8,7 | **0,48 s** |
| 63 Hz | 33,5 Hz/s | 5,8 Hz | 10,9 | **0,38 s** |
| 100 Hz | 53,1 Hz/s | 7,3 Hz | 13,7 | 0,30 s |
| 200 Hz | 106,3 Hz/s | 10,3 Hz | 19,4 | 0,21 s |

**Bei 63 Hz kann das Betragsspektrum eines Sweeps keine Mode mit einer
Nachhallzeit über 0,38 s richtig darstellen.** Sie erscheint zu breit
und zu flach, ihre Güte zu niedrig. Genau solche Moden hört man aber.

Das erklärt rückwirkend, warum Rauschen und Sweep verschiedene „Moden"
gefunden haben und warum ein Q von 528 bei 355 Hz herauskam: Das
Verfahren mißt an dieser Stelle sich selbst, nicht den Raum.

**Die Entfaltung hebt diese Grenze vollständig auf**, weil sie eine
lineare Systemidentifikation ist und keine eingeschwungenen Zustände
braucht. Das ist das eigentliche Argument, viel stärker als jede
Dynamikzahl.

*(Diese Rechnung stammt aus der Recherche selbst, nicht aus einer
Einzelquelle — sie folgt aber direkt aus der Einschwingzeit eines
Resonators.)*

## 2.2 Die Entfaltung ist im Browser fast umsonst

**Broom** (60★) entfaltet **ohne jede FFT-Bibliothek**. Der Quelltext
zeigt den Trick: ein `OfflineAudioContext`, der inverse Sweep als
Impulsantwort in einen `ConvolverNode` (Normalisierung aus), das
aufgenommene Signal hindurch, `startRendering()`. **Die Faltung macht
der Browser in C++.**

Zum Vergleich wurde die Alternative gemessen — eigene Radix-2-FFT in
reinem JavaScript, auf diesem Rechner:

| Länge | Zeit |
|---|---|
| 2¹⁹ = 524.288 | 31,1 ms |
| 2²⁰ = 1.048.576 | 75,0 ms |
| **vollständige Entfaltung (3 × FFT 2²⁰)** | **246 ms** |

Beide Wege sind bezahlbar. 13 s bei 44,1 kHz sind 573.300 Abtastwerte;
2²⁰ entspricht 23,8 s und faßt Sweep plus 10,8 s Abklingen.

**Ein Nachmittag Arbeit**, verteilt auf: Sweep exponentiell machen (15
Zeilen), inverses Filter (zeitumgekehrt, amplitudengewichtet, 15
Zeilen), Entfaltung (40 Zeilen), Fensterung der Harmonischen (20).

## 2.3 Und ein Schritt, der zwingend dazugehört

**Farina 2007** nennt fünf Fallen des Verfahrens. Eine trifft uns
direkt:

> Wird über Geräte gemessen, deren Takte auseinanderlaufen, wird die
> Impulsantwort **zeitlich verzerrt**.

Genau das liegt vor: Der Ton geht über **AirPlay auf den HomePod**
(dessen Takt), aufgenommen wird über ein **USB-Mikrofon** (dessen Takt).
Zwei unabhängige Quarze. Was das über 13 s bedeutet:

| Taktabweichung | Versatz | Abtastwerte | Phasenfehler bei 10 kHz |
|---|---|---|---|
| 10 ppm | 130 µs | 5,7 | 1,3 Perioden |
| **50 ppm** | **650 µs** | **28,7** | **6,5 Perioden** |
| 100 ppm | 1300 µs | 57,3 | 13,0 Perioden |

**Ohne Taktabgleich wäre eine Impulsantwort über AirPlay im Baß
belastbar und oberhalb etwa 1 kHz wertlos** — und man sähe es ihr nicht
an. Erstreflexionen, C50/C80, alles Zeitliche im Hochton wäre Erfindung.

Farinas Gegenmittel braucht keine Referenzmessung: das inverse Filter
**vorgedehnt** ansetzen. Praktisch: die Länge über ±200 ppm in etwa 20
Stufen durchfahren und die nehmen, bei der die Spitze der Impulsantwort
am höchsten ist. Kosten: **unter 5 Sekunden**. Die gefundene Abweichung
ist nebenbei eine Meßgröße, die man anzeigen kann.

## 2.4 Unterhalb der Schroeder-Frequenz gilt ISO 3382 nicht — zweifach

**Grund eins, Störabstand.** ISO 3382-1 verlangt 35 dB für T20, 45 für
T30. Wir haben 34,8 dB je Band. T20 liegt an der Schwelle, T30 ist
außer Reichweite.

**Grund zwei, das Bandbreite-Zeit-Produkt.** Für Terzfilter gilt
klassisch BT ≥ 16, Terzbandbreite = 0,2316 · f:

| f | Terzbandbreite | BT bei RT60 = 0,4 s |
|---|---|---|
| 31,5 Hz | 7,3 Hz | **2,9** |
| 50 Hz | 11,6 Hz | **4,6** |
| 63 Hz | 14,6 Hz | **5,8** |
| 100 Hz | 23,2 Hz | **9,3** |
| 200 Hz | 46,3 Hz | 18,5 |

Für BT ≥ 16 bräuchte es bei 50 Hz eine Nachhallzeit von **1,38 s**. Ein
Wohnraum hat 0,3 bis 0,6 s. **Ein Terzband-T20 unter 160 Hz ist hier
grundsätzlich nicht normkonform** — unabhängig vom Gerät, unabhängig vom
Störabstand.

Und ein Wert fehlt uns für alles Weitere: **das Raumvolumen ist
nirgends vermerkt.** Ohne es ist die Schroeder-Frequenz eine Schätzung.
Fünf Minuten mit dem Zollstock.

## 2.5 Was statt dessen gilt — und es wurde nachgemessen

Die robusten Verfahren für modale Abklingzeit sind laut zweier
Vergleichsarbeiten (J. Sound Vib. 493, 2021; Measurement, 2022) die
**fensterbreitenoptimierte Stockwell-Transformation**, die
**kontinuierliche Wavelet-Transformation** und die **Morlet-Wave-
Methode** — und ausdrücklich: *nur eine Meßposition nötig.*

Die Recherche hat eine Stockwell-Transformation in reinem JavaScript
gebaut und laufen lassen. Der Trick, der es billig macht: **vor der
Analyse dezimieren.** Für 20–200 Hz genügen 1000 Hz Abtastrate.

```
Stockwell 20–200 Hz, 0,5-Hz-Schritte (361 Frequenzen), N = 16384:  305 ms
ohne Dezimation:                                                    11 s
```

**Etwa 150 Zeilen, keine Bibliothek, eine Drittelsekunde.**

Dazu **Karjalainen et al. 2002** (JAES 50(11)): Das Abklingen wird als
exponentiell fallende Sinusschwingung **plus stationärem Rauschteppich**
modelliert, statt eine Gerade an eine Kurve zu legen, die im Rauschen
abknickt. Bei 34,8 dB Störabstand ist das kein Luxus. Genau dieser
Schätzer ist die Grundlage von Genelecs modaler Entzerrung.

Damit wird `Q ≈ π·f·RT60/6,9` ersetzt — eine Formel, die zwar richtig
ist, aber **zirkulär**: Sie rechnet die Güte aus einer Nachhallzeit, die
wir nie gemessen haben.

## 2.6 Der harte Befund zum Equalizer

Unsere acht Bänder haben **Q = 1**, jede Glocke ist gut 1,7 Oktaven
breit. Eine reale Raummode:

| Mode | Breite | in Oktaven |
|---|---|---|
| 34 Hz, Q = 30 | 1,13 Hz | 0,048 |
| 45 Hz, Q = 15 | 3,00 Hz | 0,096 |
| **unsere Glocke, Q = 1** | — | **≈ 1,7** |

**Faktor 20 bis 35.** Mit festen Frequenzen und festem Q = 1 kann dieser
Equalizer eine Raummode strukturell nicht bekämpfen — er senkt eine
ganze Oktave ab, um drei Hertz zu treffen. Room EQ Wizard hat aus
demselben Grund eine eigene Einstellung „schmale Filter unter 200 Hz
erlauben".

**Solange Frequenz und Güte nicht frei sind, ist die Modenmessung
Diagnose, nicht Korrektur.** Das ist eine Änderung am Tonstudio, nicht
am Einmeß-Panel.

## 2.7 Drei Versuche, die die HomePod-Frage heute beantworten

Alle drei ohne Entfaltung, ohne neuen Rechenweg:

**A — Sweep gegen Rauschen bei 63 %.** Ein exponentieller Sweep legt
**4,33 Sekunden lang** seine gesamte Energie unter 200 Hz. Rosa Rauschen
hat dort zu jedem Zeitpunkt nur einen Bruchteil. Ist die Begrenzung
pegelgetrieben, **muß der Baßverlust bei beiden Signalen verschieden
ausfallen.** Beide Signale sind da; es fehlt nur der Vergleich bei 63 %
statt bei neutraler Lautstärke. Kosten: ein Meßlauf.

**B — Der Abstand als Gegenprobe.** Denselben Lauf aus doppeltem
Abstand. Bleibt der Baßverlust, sitzt er im Lautsprecher; verschwindet
er, saß er im Mikrofon. Dazu ein Fund: Das TONOR TM20 meldet sich als
`0d8c:0134` — ein **C-Media-Serienchip**. Grenzschalldruck und Klirr
sind nicht veröffentlicht, die Herstellerseite antwortet mit 404. **Der
Maximalpegel unseres Mikrofons ist eine unbelegte Größe.**

**C — Die Hüllkurve eines Tonstoßes.** 40 Hz, eine Sekunde, bei 63 %.
Ein Kompressor zeigt eine **Anstiegs- und eine Rückstellflanke**: die
ersten Millisekunden voller Pegel, dann das Absacken. Eine passive
Grenze zeigt das nicht. Die eindeutigste Signatur, und sie braucht nur
eine Hüllkurvendarstellung der Rohaufnahme.

Und eine Warnung dazu: **Ein Kompressor verletzt die Voraussetzung des
Entfaltungsverfahrens.** Die Impulsantwort ist nur für lineare,
zeitinvariante Systeme definiert. Was herauskommt, ist die Antwort des
eingeregelten Arbeitspunkts bei diesem Pegel — verwertbar, aber so zu
beschriften. Wie groß der Fehler dabei ist, **konnte in der Literatur
niemand beziffern.** Das ist eine echte Lücke, und ausgerechnet unser
Fall.

## 2.8 Was die Korrektur grundsätzlich nicht kann

**Cecchi, Carini, Spors 2018** (Applied Sciences, 86 Zitate, 46 Seiten,
244 Quellen) listet acht Gründe. Zwei betreffen uns unmittelbar:

> Exakt entzerrt wird nur **ein Ort**; die entzerrte Zone ist ein
> Bruchteil der Wellenlänge — bei hohen Frequenzen **kleiner als der
> Ohrabstand von 18 cm**.

Also: **Oberhalb einiger hundert Hertz ist eine Einpunktkorrektur nicht
zu rechtfertigen.** Dort korrigiert man den Meßpunkt, nicht den Hörplatz.

> Der Entzerrer soll den natürlichen Abfall des Lautsprechers erhalten:
> Anheben könnte „nichtlineare Effekte, Energieverluste und mögliche
> Schäden" verursachen.

Das ist wörtlich der HomePod-Fall. Die Literatur sagt seit Jahrzehnten,
was wir am 27.08. gemessen haben.

**Und die Gegenrichtung, von Toole 2006:** „Equalization works because
**low-frequency room resonances behave as minimum-phase systems**."
Unterhalb der Übergangsfrequenz *darf* man entzerren — genau dort, wo
unsere acht Bänder sitzen. Dazu seine Zahl: **rund 30 % des
Gesamturteils über Klangqualität hängen am Baß.**

---

# 3 · Gehörakustik

## 3.1 Der stärkste Befund: nicht messen, einstellen lassen

**Sabin, Van Tasell, Rabinowitz & Dhar 2020** (Trends in Hearing, **57
Zitate** — die meistzitierte Arbeit zu genau diesem Problem). Statt
Audiogramm: **zwei Regler**. Feldversuch über einen Monat, Selbstgruppe
n = 38 gegen audiologische Bestpraxis mit Real-Ear-Verifikation n = 37.

- Selbstgewählte Verstärkung lag im Mittel **1,8 dB** an der des
  Audiologen
- **Die Selbstgruppe berichtete bessere Klangqualität als die
  Audiologengruppe**
- Im blinden Vergleich bevorzugten sie ihre eigenen Einstellungen

| Weg | Streuung | Aufwand |
|---|---|---|
| Hörtest, fremde Kopfhörer | **SD 8–11 dB** | Kalibrierung, 8 Frequenzen × 2 Ohren, ruhiger Raum |
| **Zwei Regler** | **σ ≈ 2,8 dB** | 3–6 min, kein ruhiger Raum |

**Dreimal wiederholgenauer** — und es mißt direkt, was gefällt, statt
einer Hilfsgröße, aus der man darauf nicht schließen kann.

Bestätigt von **Mackersie et al. 2020**: „Die Gruppenmittelwerte deuteten
**nicht** auf die Notwendigkeit einer schwellenbasierten Verordnung als
Ausgangspunkt hin." Und von **Boothroyd et al. 2022**: Von drei auf zwei
Regler zu gehen **halbierte die Einstellzeit** bei vernachlässigbarer
Auswirkung.

## 3.2 Der verläßliche Bereich ist schmaler als gedacht

Nicht 250 Hz bis 8 kHz, sondern **1 bis 4 kHz**:

| Frequenz | erreichbar | begrenzt durch |
|---|---|---|
| unter 500 Hz | ICC 0,20–0,51 zu Hause | **Umgebungsgeräusch** — die Störungen liegen bei 160–630 Hz |
| 1 kHz | SD ~8 dB | Kalibrierung |
| **2–4 kHz** | SD ~8 dB | **bester Bereich** |
| 6 kHz | kritische Differenz ±5 dB | Ankopplung |
| 8 kHz | **Aufsetzunterschied allein 13,9 dB** (n = 324) | stehende Wellen im Gehörgang |
| über 8 kHz | 32 % innerhalb ±10 dB **selbst mit Spezialhardware** | keine tragfähige Referenz |

Nach unten scheitert es also am Raum, nach oben an der Physik: Oberhalb
etwa 8 kHz erreicht die Wellenlänge die Größe des Gehörgangs, es bilden
sich stehende Wellen darin, und eine Kalibrierfunktion zu berechnen sei
laut Literatur *„schwierig, wenn nicht unmöglich"*.

## 3.3 Zwei Wege, die nicht funktionieren

**ISO 226 als Kalibrierersatz — widerlegt.** ISO 226 beschreibt das
**Freifeld**, die Audiometrie den Druck im **Kuppler unter einem
Kopfhörer**. Die nötige Korrektur:

| | 125 Hz | 500 Hz | 1 kHz | 4 kHz | 8 kHz |
|---|---|---|---|---|---|
| Differenz | +22,9 dB | +7,1 dB | +4,6 dB | **+14,9 dB** | +0,4 dB |

**Sie schwankt über 22,5 dB und ist nicht monoton.** Wer so kalibriert,
verbiegt die Kurvenform — bei 4 kHz um fast 15 dB, also genau dort, wo
gemessen werden soll.

**Selbstkalibrierung — ein Zirkelschluß.** Biologische Kalibrierung
setzt einen **normalhörenden** Menschen voraus. Wer sich selbst
kalibriert, kalibriert seinen eigenen Verlust weg und mißt danach eine
flache Kurve.

Übrig bleiben: eine zweite, jüngere Person (SD ~4 dB) — oder eine
Gerätedatenbank mit vorvermessenen Kopfhörern, wie Mimi sie hat (±5 dB,
dafür nur rund zwanzig unterstützte Modelle).

## 3.4 Von der Kurve zur Verstärkung

Die exakte NAL-R-Formel, verifiziert an einer Referenzimplementierung:

```
G = X + 0,31 · Hörverlust + k
X = 0,05 · (HTL₅₀₀ + HTL₁₀₀₀ + HTL₂₀₀₀)
k = [−17, −8, +1, −1, −2, −2] dB bei [250, 500, 1k, 2k, 4k, 6k] Hz
```

Ausgerechnet ergibt das einen Kompensationsanteil von **0,2 bis 0,5**,
im Mittelbereich **0,43–0,48**. Die „halbe Verstärkung" trifft es also
ziemlich genau — im Tiefton bewußt weniger, um Verdeckung zu vermeiden.

**Warum nicht voll kompensiert wird**, direkt belegt: **Smeds 2004**,
21 Erstnutzer, Feldversuch mit Wechsel — normale gegen leicht
reduzierte Gesamtlautheit. **19 von 21 bevorzugten die leisere**, bei
gleichem Sprachverstehen. Und der Trend geht seit 25 Jahren weiter nach
unten: NAL-NL2 verordnet 3 dB weniger als NAL-NL1, Frauen 2 dB weniger
als Männern, Erstnutzern nochmals deutlich weniger.

Dazu eine Grenze, die unseren EQ betrifft: **Moore 2012** fand die
besten Klangqualitätsurteile, wenn **die Welligkeit des Frequenzgangs
unter ±5 dB** blieb. Acht Glocken, die eine gemessene Kurve nachzeichnen,
erzeugen zwischen den Stützstellen genau solche Welligkeit.

## 3.5 Ob es überhaupt hilft: die Belege sind schwach

- **Madsen & Moore 2014** (523 Hörgeräteträger): **29 % fanden Musik
  verschlechtert, 21 % verbessert.** 53 % berichteten Verzerrung.
- **Greasley et al. 2026** (1.507 Träger): häufigstes Problem
  Verzerrung; häufigste Gegenstrategie **die Geräte abnehmen**;
  Musikprogramme der Hersteller bringen „derzeit keinen wesentlichen
  Nutzen".
- **Cadenza-Challenge 2026**: acht ML-Systeme gegen eine Grundlinie aus
  Quellentrennung plus NAL-R. **Kein einziges übertraf die Grundlinie.**
- **Søgaard Jensen 2019** (doppelblind): Verbesserung der
  Grundklangqualität ja — aber **kein klarer Zusammenhang zwischen der
  Anpassung und dem empfundenen Nutzen**; die Vorlieben seien
  „hochgradig individuell und schwer vorherzusagen".

Und für unseren Fall — leichter Verlust, kein Hörgeräteträger — gibt es
**keine kontrollierte Studie**. Alle belastbaren Arbeiten laufen mit
mindestens mittelgradigem Verlust.

## 3.6 Der Maßstab, den ich gestern falsch gewählt hatte

ISO 7029 gilt für **„otologisch normale"** Personen: frei von
Ohrerkrankungen, ohne Lärmbelastung, ohne ototoxische Stoffe, ohne
familiäre Vorbelastung. Das ist nicht der Durchschnitt — das ist das
**bestmögliche Altern**.

Besser paßt **von Gablenz, Hoffmann & Holube 2020** (PLoS ONE, n = 3.105,
ungescreent, deutsch). Ein Mann Mitte 50:

| | 4 kHz | 6 kHz | 8 kHz |
|---|---|---|---|
| ISO 7029 (otologisch normal) | 15 dB | 19 dB | 23 dB |
| **deutsche Bevölkerung** | **~25 dB** | **~31 dB** | **~36 dB** |
| NHANES (USA, ungescreent) | 25,9 dB | 31,3 dB | 36,0 dB |

Zwei unabhängige Erhebungen auf zwei Kontinenten, dieselben Zahlen — und
**10 dB Abstand zur Norm**. Wer sich gegen ISO 7029 mißt, hält sich für
schlechter, als er im Vergleich zu seinesgleichen ist.

---

# 4 · Was über alle drei Themen hinweg gilt

## Derselbe Befund, zweimal unabhängig gefunden

Die Raumakustik-Recherche und die Gehör-Recherche wußten nichts
voneinander. Beide kamen zum selben Schluß über unser Tonstudio:

**Der Equalizer kann nicht, was wir von ihm wollen.**

- **Für Raummoden**: Q = 1 gegen die nötigen Q = 15–30. Faktor 20 bis
  35 zu breit. Er senkt eine Oktave ab, um drei Hertz zu treffen.
- **Für das Gehör**: **kein einziges Band oberhalb 2500 Hz.** Der
  altersbedingte Verlust liegt bei 3 bis 8 kHz und ist dort steil — 19
  dB bei 3 kHz, 36 dB bei 8 kHz. Ein Höhenregal bei 2500 Hz hebt alles
  gleichmäßig an.

Beides führt auf dieselbe Änderung: **Frequenz und Güte der Bänder
müssen freie Parameter werden**, und es braucht Stützstellen oberhalb
2,5 kHz. Solange das nicht ist, sind beide Messungen Diagnose und keine
Korrektur.

## Was ich in dieser Reihenfolge täte

**Sofort und fast umsonst:**
1. Raumvolumen messen (Zollstock, fünf Minuten) — ohne es ist die
   Schroeder-Frequenz geraten
2. Rohaufnahmen als WAV ablegen (1,1 MB je Durchgang) — ohne sie ist
   jede spätere Auswertung ein neuer Meßabend
3. Die Versuche A, B, C — sie beantworten die HomePod-Frage ohne
   jeden neuen Rechenweg
4. Nachbarschaftstreue und Hubness im Klangraum messen — Millisekunden

**Danach, in dieser Reihenfolge:**
5. Entfaltung über `ConvolverNode` **zusammen mit** dem Taktabgleich —
   die beiden dürfen nicht getrennt werden
6. Stockwell-Abklingzeit für die Moden (305 ms gemessen)
7. Beat This als ONNX zur Gegenprüfung der Suno-Schlagzeiten
8. Tonart an 30–50 Songs messen, Fehler nach MIREX-Klassen aufschlüsseln

**Nicht tun:**
- MERT, MuQ, MusicFM anfassen (CC-BY-NC, kein ONNX, bei Tonart zehn
  Punkte hinter den Spezialisten)
- Discogs-EffNet gegen MAEST tauschen (19-fache Größe, bei 321 Songs
  nicht meßbar)
- Struktur selbst rechnen (Weltstand 0,61 gegen Sunos Erzeugungswahrheit)
- Einen Hörtest bauen, bevor die zwei Regler probiert sind
