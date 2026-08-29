# Einmessen — was am Hörplatz wirklich ankommt

Vierte Lasche im Tonstudio. Ein Prüfton geht über den normalen Ausgang,
das Mikrofon nimmt auf, und aus der Differenz zweier Durchgänge wird
ablesbar, was die Kette aus Rechner, Lautsprecher, Raum und Hörplatz mit
dem Signal macht.

Dieses Dokument sammelt alles dazu: den geführten Ablauf, die Signale,
die Auswertung, die Diagramme — und die Befunde, die dabei herausgekommen
sind. Entstanden am 27.08.2026 in einer langen Sitzung, in der Caspar_D
Schritt für Schritt durchgegangen ist und gesagt hat, was er sieht.

---

## Das Messdokument (29.08.2026) — der heutige Hauptweg

Der Messgang lebt seit dem 29.08. als **ein Dokument im Einmessen-Register**
(Knopf „Raum vermessen — das Messdokument"): Es beginnt oben, wächst nur nach
unten, der aktive Block ankert unter den feststehenden Registerlaschen, Fertiges
bleibt stehen, Vergängliches fliegt raus. Regeln in HAUSREGELN.md („Das
Messdokument"); der Code trägt seine Begründungen als Kommentare (dok*-Funktionen
in web/index.html).

**Der Gang:** Kopf & Geräte (Dropdowns, Ampeln) → anklickbares Inhaltsverzeichnis
(✓/▸/·, Sprung ersetzt den festen Block des Tests an Ort und Stelle) →
Zusammenfassungstext → Stilletest (12 s, superfein, Nadeln samt Deutung; Bezug der
Serie) → Piep-Eichung (zwei Einzelpieps: Latenz-Median + Konstanz-Spanne;
Anhebeschleife 50→71→100 %, bis der Piep 20 dB über der Ruhe liegt; Rauschprobe
2 s rosa bestätigt je Band) → je Signal 2 Läufe (weiß/rosa/blau, Sweep log/linear;
alle auf −12 dBFS Energie normiert, Signal-QS vor dem Senden, Exklusiv-Wächter,
Live-Bild „Ende der Audiokette" + „Mikrofon" auf einer Uhr; Rauschen wird
detektiert mit automatischer Einmal-Wiederholung bei Latenzabweichung, Sweeps
laufen auf der GESETZTEN Eichlatenz) → Lautstärkerampen weiß + sweep (Start am
Eichpegel, 3-dB-Stufen, Ende wenn der Baßabfall von der Folgestufe BESTÄTIGT ist
— Kennlinie statt Gängelung) → **Zusammenfassung & Steckbrief** (spielt nur mit
dem Zwischenspeicher: Steckbrief Stille/Latenz/Kette/Meßgüte mit ISO-3382-
Einordnung samt Schroeder-Vorbehalt; Raumkurven-Schar mit datengetriebenem
Vergleichsband, außerhalb blaß; Wiederholstreuung; Formtreue je Rampenstufe mit
4-dB-Marke; EQ-Absenkung mit Übernehmen; Kompressor mit Umschalter Kette/
Hörbarkeit; Latenz-Übernahme als Textversatz). Über-alles-Test fährt alles ohne
Bestätigungen und sammelt Fehlschläge zur Nachhol-Liste.

**Zwischenspeicher:** je Schritt nach `library/messungen/tontestdurchlaeufe.json`
(EINE Datei, ein Schlüssel je Durchlauf; PUT/GET `/api/messungen/durchlauf`,
Liste `/durchlaeufe`). Lange FFTs aufs 1024er-Logruster eingedampft (Maximum).

**Offen (siehe BACKLOG):** Entfaltung → Klirr/RT60/C50/C80; Anzeigen an den
gemessenen Versatz koppeln (Tabelle im BACKLOG); Messpegel-Deckel −12 dBFS
(„wenn wir immer noch cappen…"); Werkzeugmodus-Altteile abräumen.

---

## Der Grundgedanke

**Eine einzelne Messung ist keine Eichung.** Ein Mikrofon nimmt immer das
Produkt aus vier Dingen auf: Signal, Lautsprecher, Raum und Mikrofon.
Ohne Meßmikrofon mit Kalibrierdatei lassen die sich nicht trennen.

Aber die **Differenz zweier Durchgänge** — einmal neutral, einmal mit
Einstellung — zeigt die Bearbeitung allein, weil Mikrofon, Lautsprecher
und Raum in beiden Messungen dieselben sind und sich herauskürzen. Alles,
was dieses Fenster berechnet, kommt aus solchen Differenzen.

---

## Der geführte Ablauf

Wer „Einmessen" öffnet, sieht **einen Text und einen Knopf**. Alles
weitere erscheint erst, wenn es dran ist — Diagramme, sobald es etwas zu
zeigen gibt, Erklärungen am Ende. Ein leeres Diagramm mit „Noch nicht
gemessen" ist schlechter als gar keins.

Der Ablauf führt durch sieben Schritte. **Kein Schritt beginnt
ungefragt**: jeder sagt an, was gemessen wird und daß es still sein muß,
und wartet dann. Nach jedem Schritt gibt es „Paßt — weiter" und „Nochmal
— es gab eine Störung"; das Wiederholen startet sofort, ohne die Ansage
zu wiederholen.

| | Schritt | Signal | Ton |
|---|---|---|---|
| 1 | Raum abhören | — | nein |
| 2 | Bezugsmessung | rosa Rauschen, 13 s | ja |
| 3 | Derselbe Durchgang mit Sweep (freiwillig) | Sweep, 13 s | ja |
| 4 | Baß | rosa Rauschen | ja |
| 5 | Höhen | rosa Rauschen | ja |
| 6 | Ein Band voll aufgedreht (445 Hz +12) | rosa Rauschen | ja |
| 7 | Lautstärke durchfahren | Sweep, mehrere Stufen | ja |

Die Reglerstellungen nimmt das Programm vor. Wer messen will, was der
Equalizer am Hörplatz bewirkt, soll das nicht von Hand nachbauen müssen.

**Während des Ablaufs bleibt es still**: die Musik läuft nach einem
Durchgang nicht wieder an. Sie spielte sonst in die Ruhephase des
nächsten hinein und verfälschte dessen Grundpegel.

Ein **Abbruchknopf** erscheint, solange etwas läuft. Ein Husten, ein
Anruf, ein Tastendruck verdirbt eine Messung; ohne Abbruch müßte man
zusehen, wie eine verdorbene Reihe zu Ende läuft.

---

## Einmessen am Hörplatz (27.08.2026)

Vierte Lasche im Tonstudio. Ein Prüfton geht über den normalen Ausgang,
das Mikrofon nimmt auf, und aus der Aufnahme entsteht ein Spektrum über
31 Terzbänder.

### Drei Signale

| | Neigung je Oktave | wofür |
|---|---|---|
| **Sweep** 20 Hz – 20 kHz | −3,20 dB | Standard der Raumakustik: trägt seine Energie nacheinander, deshalb auch in halligen Räumen auswertbar |
| **Rosa Rauschen** | −3,03 dB | gleiche Energie je Oktave; womit Beschallungsleute einmessen |
| **Weißes Rauschen** | −0,04 dB | gleiche Energie je Hertz; ehrlichste Anregung für lineare Fächer |

Alle drei mit 50-ms-Blende an beiden Enden — ein hart einsetzendes
Signal knackt, und der Knack ist breitbandig.

Das rosa Rauschen entsteht nach **Voss-McCartney**: mehrere
Zufallsreihen, jede halb so oft erneuert wie die vorige. Das ergibt
sauber 3 dB Abfall je Oktave ohne Filter.

### Der Prüfton nimmt den Musikweg

Als WAV über **das Element, das die Musik spielt** — nicht über die
`destination` des AudioContext. Web Audio kennt AirPlay nicht; über den
Kontext käme der Ton aus dem eingebauten Lautsprecher statt aus den
HomePods. Dasselbe gilt für den Chirp der Latenzmessung.

Aufgenommen wird über Web Audio (ein Eingang, davon unberührt), mit
abgeschalteter Echounterdrückung, Rauschunterdrückung und
Pegelautomatik.

### Was die Messung nicht ist

**Keine Eichung.** Ein Mikrofon nimmt das Produkt aus vier Dingen auf:

```
gemessen = Signal × Lautsprecher × Raum × Mikrofon
```

Ohne Meßmikrofon lassen sich die vier nicht trennen. Für eingebaute
Mac-Mikrofone gibt es keine Kennlinien — Apple veröffentlicht keine, und
es existiert keine Datenbank. Qualitativ bekannt ist: Hochpaß bei etwa
100 Hz, Betonung um 2–5 kHz, Abfall über 10 kHz.

**Eine automatische EQ-Korrektur daraus wäre schädlich**: Sie höbe den
Baß an, um ein Loch auszugleichen, das im Mikrofon sitzt und nicht im
Raum.

### Warum zwei Durchgänge

In der **Differenz** kürzen sich Mikrofon, Lautsprecher und Raum heraus
— sie sind in beiden Messungen dieselben. Übrig bleibt, was das
Tonstudio am Hörplatz wirklich bewirkt, Raummoden und Reflexionen
inbegriffen.

Für eine absolute Skala bräuchte es ein Meßmikrofon mit
Kalibrierdatei. Das **miniDSP UMIK-1** (rund 100 €) bringt eine
individuelle Datei zur Seriennummer mit — schlichte Frequenz/dB-Paare,
leicht einzulesen. Das Behringer ECM8000 hat einen typischen, aber
keinen individuellen Frequenzgang.


## Die Kette digital nachgemessen (27.08.2026)

Ohne Mikrofon, über zwei Analyser an `quelle` und `summe`. Gemessen
wird die Differenz je Terzband — was das Tonstudio zwischen den beiden
Punkten tut.

**Das Meßverfahren braucht ein konstantes Eingangssignal.** Mit Musik
schwankten die Werte um 0,73 dB zwischen zwei identischen Zuständen —
mehr als die Unterschiede selbst. Mit rosa Rauschen in Endlosschleife
und vier Sekunden Einschwingzeit je Zustand fiel die Gegenprobe auf
**0,16 dB**. Der Master steht dabei auf null: digital meßbar, hörbar
still.

### Was die Filter tun

| Eingriff | Wirkung |
|---|---|
| 445 Hz **+8 dB** | 315-Hz-Band 1,7 → **7,0** · übrige Bänder unberührt |
| 2500 Hz Shelf **−6 dB** | 5 kHz 6,8 → **−1,2** · 20 kHz 6,7 → **−1,7** |
| zurückgestellt | alle Bänder wieder auf Ausgangsniveau |

Die Kette zeigt Anhebung und Absenkung an der richtigen Frequenz und in
der richtigen Größenordnung.

### Latenz

| | |
|---|---|
| Basislatenz (Web Audio) | 5,33 ms |
| Ausgabelatenz (System) | 16,00 ms |
| zusammen | **21,33 ms** |
| Kompressor-Vorschau | 2,67 ms (128 Bilder bei 48 kHz) |

Zum Vergleich: Der gemessene AirPlay-Versatz zu den HomePods liegt bei
**2079 ms** — das Hundertfache. Die lokale Verarbeitung ist gegen den
Funkweg vernachlässigbar.

---

## Warum sich der Mikrofonfrequenzgang nicht schätzen läßt

Naheliegender Gedanke: Man kennt idealtypische Mikrofonkurven und
vielleicht die des Lautsprechers — ergäbe das nicht eine Näherung?

**Nein, und der Grund liegt beim Lautsprecher.** HomePods führen eine
**adaptive Raumkorrektur** aus: Sie messen ihre Aufstellung selbst und
ändern danach ihren Frequenzgang. Es gibt also keine feste
HomePod-Kurve, die man abziehen könnte — sie ist in jedem Raum und
nach jedem Verrücken eine andere. Apple veröffentlicht ohnehin keine
Meßschriebe; was kursiert, sind Fremdmessungen einzelner Exemplare in
einzelnen Räumen.

Beim Mikrofon dasselbe in kleiner: Bekannt ist nur die Richtung
(Hochpaß um 100 Hz, Präsenzanhebung 2–5 kHz, Abfall über 10 kHz), nicht
der Betrag.

**Eine Korrektur aus geschätzten Kurven wäre schlechter als keine**, weil
sie Genauigkeit vortäuscht, wo Vermutung steht — und weil sich zwei
Schätzfehler addieren statt aufzuheben.

Was bleibt, ist der Weg, der ohne diese Kurven auskommt: die
**Differenz zweier Durchgänge**. Was in beiden Messungen steckt, kürzt
sich heraus, gleichgültig wie es aussieht. Für eine absolute Skala
führt kein Weg an einem Meßmikrofon mit Kalibrierdatei vorbei.


## Der Equalizer bandweise durchgemessen (27.08.2026)

Caspar_D: *„ferner sollst du verschiedene frequenzen testen aus den
typischen eq bändern"* — und, nachdem ich ihn nach Einstellungen fragte:
*„warum soll ich da was einstellen, du kannst das reproduzierbar viel
besser und schneller als ich"*. Also 19 Einstellungen selbst gefahren,
jede digital gemessen.

**Erst der Einwand richtiggestellt.** Er vermutete, der Meßton rege alle
Frequenzen gleichzeitig an. Umgekehrt: der **Sweep** trägt seine Energie
*nacheinander* (deshalb ist er in halligen Räumen auswertbar), das
**Rauschen** regt gleichzeitig an. Für eine bandweise Prüfung ist
gleichzeitig sogar richtig — man sieht den ganzen Frequenzgang in einem
Zug, statt ihn aus Einzeltönen zusammenzustückeln.

### Aufbau

Zwei Analyser als Sackgassen, einer an `quelle`, einer an `summe` — genau
die beiden Punkte, die das Spektrum als *Codiertes Signal* und
*Ausgabe-Signal* führt. Rosa Rauschen (Voss-McCartney, 8-s-Schleife) an
`quelle`, `master` auf 0, damit nichts nach draußen dringt. FFT 16384 →
2,69 Hz Auflösung, zusammengefaßt in 31 Terzbänder. Gemessen wird die
**Differenz** Ausgang minus Eingang; was beiden gemeinsam ist, kürzt sich
heraus.

**Der Takt kommt aus dem Audio-Thread**, nicht von `setTimeout`. Ein
verstecktes Browserfenster drosselt Timer auf einen Schlag je Sekunde —
die erste Messung lief deshalb ins Zeitlimit. Ein `ScriptProcessor` mit
16384 Samples Blockgröße feuert alle 371 ms, unbeirrt von der
Sichtbarkeit, und liest **beide Analyser im selben Augenblick**. Sonst
vergleicht man zwei verschiedene Rauschabschnitte miteinander.

### Nullprobe: ±0,02 dB

Alle Regler auf 0, gemessen von 25 Hz bis 12,9 kHz: die größte Abweichung
ist **0,02 dB**. Die Kette ist bei neutraler Stellung vollkommen
durchsichtig — EQ, Kerbe, Kompressor, Breite, alles. Damit ist jeder
folgende Wert echte Reglerwirkung und kein Meßartefakt. (Die frühere
Gegenprobe über das Mikrofon kam auf 0,16 dB; der Unterschied ist der
Raum, nicht die Software.)

### Die acht Bänder einzeln, je +12 dB

| Regler | Typ | Spitze gemessen | wo |
|---|---|---|---|
| 40 Hz | lowshelf | +10,1 dB | 25 Hz (läuft nach unten weiter) |
| 56,6 Hz | peaking | +11,2 dB | 50–64 Hz |
| 113 Hz | peaking | +11,4 dB | 101–127 Hz |
| 224 Hz | peaking | +11,3 dB | 202–254 Hz |
| 445 Hz | peaking | +11,3 dB | 403–508 Hz |
| 886 Hz | peaking | +11,3 dB | 806 Hz |
| 1768 Hz | peaking | +11,4 dB | 1613 Hz |
| 2500 Hz | highshelf | +12,0 dB | ab 10 kHz |

Die 11,3 statt 12,0 bei den Glocken sind kein Fehler: ein Terzband ist
breiter als die Spitze, der Mittelwert liegt darunter.

**Die beiden Shelfs verhalten sich lehrbuchgenau.** Bei einem Shelf ist
die genannte Frequenz der Punkt der **halben** Anhebung, nicht der
vollen: bei 40 Hz gemessen +6,1 dB, bei 2560 Hz +6,3 dB — beide Male die
Hälfte von 12. Voll wird es erst weit außerhalb (Band 8 erreicht +12,0
ab 10 kHz). Wer am 40-Hz-Regler zieht, hebt also vor allem an, was
*unter* 40 Hz liegt.

### Der eigentliche Befund: die Bänder überlappen

Mit Q = 1 ist jede Glocke gut 1,7 Oktaven breit. Nachbarn addieren sich:

| Einstellung | erwartet | gemessen |
|---|---|---|
| nur 445 Hz auf +3 | +3 | **+2,84** |
| nur 886 Hz auf +3 | +3 | **+2,85** |
| beide auf +3 | +3 | **+4,04** |
| alle acht auf +3 | +3 | **+5,29** |
| alle acht auf −3 | −3 | **−5,29** |

Wer alle Regler gleichmäßig um 3 dB anhebt, bekommt **5,3 dB** — fast das
Doppelte. Das ist keine Lautstärkeregelung mit Umweg, sondern acht
überlappende Glocken, die einander aufaddieren.

### Und die Gegenprobe: feine Zacken gehen nicht

Regler abwechselnd +6 / −6 gestellt. Heraus kommt in der Mitte nur
±2,5 dB — die Nachbarn löschen einander weitgehend aus:

```
50 Hz −2,7   101 Hz +2,3   202 Hz −2,4   403 Hz +2,5
806 Hz −2,3  1613 Hz +2,9  3225 Hz −2,5  12,9 kHz −6,0
```

Nur ganz oben setzt sich die volle Stellung durch (−6,0 dB) — der
Highshelf hat keinen Nachbarn über sich, der ihm entgegenarbeitet.
Dasselbe gilt unten für den Lowshelf. **Die Enden der Kette sind
durchsetzungsfähig, die Mitte ist ein Kompromiß der Nachbarn.**

Praktisch heißt das: der Equalizer ist ein Werkzeug für breite Griffe —
Badewanne, Bassfundament, Stimmenband. Wer eine schmale Störfrequenz
treffen will, nimmt die **Kerbe**, nicht die Regler.

### Was die fünf Klassiker wirklich tun

| Name | größte Anhebung | größte Absenkung | Spanne |
|---|---|---|---|
| loudness | +5,1 dB @ 25 Hz | −1,5 dB @ 403 Hz | 6,6 dB |
| bass | +6,6 dB @ 50 Hz | 0,0 dB @ 4 kHz | 6,6 dB |
| hoehen | +5,3 dB @ 5,1 kHz | 0,0 dB @ 25 Hz | 5,3 dB |
| stimme | +4,5 dB @ 508 Hz | −2,0 dB @ 25 Hz | 6,5 dB |
| nacht | +1,1 dB @ 508 Hz | −4,8 dB @ 32 Hz | ~6 dB |

Bei *stimme* stehen zwei Regler auf +3 (445 und 886 Hz) — heraus kommen
**+4,5 dB bei 508 Hz**. Die Überlappung wieder, diesmal als gewollter
Effekt: das Stimmenband wird breiter und lauter, als die Reglerstellung
vermuten läßt.

## Am Hörplatz gemessen — und was die HomePods davon übriglassen (27.08.2026)

Erste vollständige Mikrofonmessung, TONOR TM20, Ausgabe über AirPlay auf
die HomePods, Sweep 20 Hz – 20 kHz, Lautstärke 60 %. Neutraler Durchgang
als Bezug, Störabstand 31 dB, Laufzeit 2100 ms.

### Drei Fehler, die vorher zu beheben waren

**Das Mikrofon.** Der Lauf nahm das Standardgerät — hier ein virtuelles
Audiogerät. Gemessen worden wäre ein Umweg im Rechner statt des Raums.

**Der Versatz.** Das Auswertefenster stand fest auf 1,8–5,5 s nach dem
Start. Über AirPlay kommt der Ton erst nach 2,1 s an; ausgewertet wurde
also Stille plus die untere Hälfte des Sweeps. Jetzt wird die Ankunft
aus der Aufnahme abgelesen.

**Die Musik im Puffer.** Nach jedem Lauf startet die Musik wieder. Beim
nächsten Lauf wird sie zwar angehalten, aber im AirPlay-Puffer stehen
noch zwei Sekunden — die genau während der Ruhephase erklingen. Der
Ruhepegel wurde an Musik gemessen: erster Lauf 33 dB Störabstand,
folgende 0 bis 15 dB. Vorlauf auf 3,5 s verlängert, Ruhe erst im letzten
Stück davor gemessen — danach alle Läufe 29–33 dB.

### Was ankommt

| Einstellung | digital | am Hörplatz |
|---|---|---|
| bass, 63 Hz | +6,0 dB | +1,3 dB |
| bass, Spitze | +6,6 dB | +3,5 dB |
| 445 Hz +12 | +11,3 dB | +4,1 dB |
| hoehen, 8 kHz | +5,1 dB | +0,9 dB |
| hoehen, 2 kHz | +5,2 dB | +4,1 dB |
| loudness, 32 Hz | +5,0 dB | −0,3 dB |

### Es ist Begrenzung, nicht Raumkorrektur

Naheliegend wäre gewesen, das der adaptiven Raumkorrektur der HomePods
zuzuschreiben. Die Gegenprobe sagt etwas anderes:

| Einstellung | am Hörplatz | Ausbeute |
|---|---|---|
| 445 Hz **+12** bei 60 % | +4,9 dB | 43 % |
| 445 Hz **+6** bei 60 % | +4,2 dB | 74 % |
| 445 Hz **+12** bei 30 % | +7,1 dB | 63 % |

Die doppelte Anhebung bringt am Ohr fast nichts mehr; dieselbe Anhebung
leiser abgespielt bringt mehr durch. **Es entscheidet der Pegel, nicht
die Frequenz** — das Verhalten eines Kompressors.

Der Verlust sitzt außerhalb der Software: digital verläßt das Signal die
Kette mit +11,3 dB, und die Kette ist neutral auf ±0,02 dB durchsichtig.
Zwischen `summe` und dem Lautsprecher liegt nur der Lautstärkeregler,
ein frequenzneutraler Faktor.

**Folge für die Arbeit:** Wer über die HomePods mischt, mischt gegen
einen unsichtbaren Kompressor, und je lauter, desto mehr. Für
EQ-Entscheidungen taugen sie nur bedingt.

Der 30-%-Durchgang meldete von selbst *„Störabstand 10 dB — zu leise für
eine belastbare Messung"*. Die Zahlen zeigen die Richtung, tragen aber
allein nicht; sie stehen hier nur, weil die anderen beiden dasselbe
sagen.

### Offen

Ob der Verlust wirklich im HomePod sitzt oder schon in der Übergabe an
macOS/AirPlay, ließe sich mit einer Messung über die iMac-Lautsprecher
trennen. Das ist ein Eingriff in den Tonweg und wartet auf ein Wort.



## Wie lange gemessen wird — und warum

Nicht nach der Uhr, sondern **bis das Bild steht** (Caspar_D: *„wie bei
multiple exposures in der Mikroskopie, weniger Rauschen, klarere
Signale"*). Das Rauschen sinkt mit der Wurzel aus der Zahl der
Aufnahmen; es fehlte nur ein Kriterium, wann genug ist.

**Zwei Halbmittelungen**, jede aus jeder zweiten Aufnahme. Beide sehen
dasselbe Signal, aber unabhängiges Rauschen — ihre mittlere Abweichung
*ist* damit das verbleibende Rauschen, ohne jede Annahme darüber, wie es
verteilt sein müßte. Geteilt durch zwei, weil die Differenz zweier
Halbmittelungen um √2 größer ist als der Fehler der Gesamtmittelung.

Gemessen in Caspar_Ds Raum: 10 Aufnahmen → 0,36 dB, 21 → 0,15 dB,
32 → 0,06 dB.

**Die Mindestdauer kommt aber nicht von der Mittelung**, sondern von der
Auflösung. Für Raummoden im Baß gilt:

| Meßdauer | Auflösung | eine Mode Q 34 bei 34 Hz ist dann |
|---|---|---|
| 4 s | 0,336 Hz | 3 Punkte breit |
| 8 s | 0,168 Hz | 6 Punkte |
| **13 s** | **0,084 Hz** | **12 Punkte** |

Unter vier Punkten läßt sich keine Güte angeben. Deshalb laufen die
Meßsignale mindestens dreizehn Sekunden — nicht zwölf: die FFT nimmt die
größte Zweierpotenz, die hineinpaßt, und 2¹⁹ sind bei 44,1 kHz genau
11,89 s. Bei zwölf Sekunden blieben nach Abzug der Einschwingzeit 11,7
übrig, und die Auflösung fiel auf die Hälfte zurück.

---

## Wie fein es geht

| | Auflösung | Fenster |
|---|---|---|
| Terzbänder | 1/3 Oktave | — |
| `AnalyserNode`, sein Maximum | 1,35 Hz | 0,74 s |
| **Lange FFT über die Rohaufnahme** | **0,084 Hz** | 11,9 s |

Der `AnalyserNode` kann höchstens 32768 Punkte. Über die
mitgeschriebene Rohaufnahme geht mehr — eine eigene FFT mit 2¹⁹ Punkten.
Die physikalische Schranke ist hart: Auflösung × Fensterdauer ≈ 1.

**Wofür die feine Auflösung gut ist**, und wofür nicht:

Sie zeigt die *Breite* einer Störlinie. Ein Netzbrummen ist nadelscharf,
ein Lüfter hat einige Hertz Breite, eine Raummode eine, aus der sich ihre
Güte ablesen läßt. Bei 1,35 Hz Raster ist all das ein einzelner Punkt.
Und sie unterscheidet: die Linien in Caspar_Ds Raum liegen bei 55,2 und
86,1 Hz — kein Netzbrummen (das läge exakt bei 50), sondern der Lüfter.

Nach oben ist mehr sinnlos: bei 1 kHz ist ein Terzband bereits 230 Hz
breit, dort wirft man 170 Meßpunkte hinein und mittelt sie gleich wieder
zusammen. Das ist die Schwäche der linearen FFT — das Gehör ist
logarithmisch, sie ist es nicht.

Und noch länger zu fenstern hilft nicht: ein Raumgeräusch ist über eine
Sekunde stabil, über zehn meist nicht. Dann verschmiert das Fenster mehr,
als es auflöst. Deshalb bleibt die **gemittelte** Kurve die Aussage und
die **lange FFT** die Lupe daneben.

Beim Reduzieren auf Bildpunkte gilt: **Spitzenwert, nicht Mittelwert.**
Zwischen 10 und 20 kHz fallen 7400 FFT-Punkte auf ein Zehntel der
Bildbreite; wer dort mittelt, ersäuft eine einzelne scharfe Linie in
ihren leisen Nachbarn — genau das Signal, das man sehen will. Der Preis
ist ein höher liegender Rauschteppich.

---

## Der Störabstand wird je Band gemessen

Beim Umstieg auf rosa Rauschen meldete die Bezugsmessung 13, dann 17 dB
und verweigerte sich — während derselbe Regler mit dem Sweep 33 dB
gebracht hatte. Zwei Ursachen:

**Das Signal war nicht normiert.** In `rauschenRosa` stand „Summe durch
acht", ein willkürlicher Teiler. Auf 0,95 Spitze skaliert sind es rund
neun Dezibel mehr. Der Rest des Unterschieds bleibt und ist Physik:
Rauschen hat einen Scheitelfaktor von 11,4 dB gegen 3 beim Sinus.

**Der Maßstab war falsch.** Breitbandig gemessen sieht ein Sweep viel
besser aus: er legt seine ganze Energie in eine Frequenz, das Rauschen
verteilt sie auf alle. Für das Ergebnis zählt aber, wie weit **jedes
einzelne Band** über dem Grundgeräusch liegt — und dort mittelt das
Rauschen über die volle Zeit, während der Sweep nur vorbeihuscht.

Der Unterschied ist groß: dieselbe Messung ergibt **breitbandig 14,2 dB**
(Fehlalarm) und **je Band 39,9 dB** (trägt problemlos). Gemessen wird der
Median über 63 Hz bis 8 kHz — ein einzelnes taubes Randband soll das
Urteil nicht kippen.

---

## Die Diagramme

**Was der Raum von sich aus macht** (Schritt 1, ohne Ton). Terzbänder als
Säulen, darüber die feine FFT als Linie, Störlinien rot markiert und
benannt — Netzbrummen samt Oberwellen, Lüfter, Schaltnetzteil. Verdacht,
nicht Diagnose. Eine wiederholte Messung bleibt als gelbe Vergleichslinie
stehen: wer eine Geräuschquelle abstellt, sieht in welchen Bändern es
geholfen hat.

**Wann war es laut — Zeitverlauf** (Ridge Plot). Dieselben Daten über die
Zeit gestapelt, älteste Zeile oben. Ein Lüfter zieht einen durchgehenden
Kamm durch alle Zeilen; ein Tastendruck erscheint in genau einer. Damit
läßt sich nachträglich sagen, ob eine Messung durch eine Störung
verdorben wurde. Ausgedünnt wird **gleichmäßig über die ganze Messung**,
nicht die letzten N — sonst zeigt der Verlauf nur das Ende.

**Der Raum im Baß — Moden und ihre Güte.** Die lange FFT von 20 bis
400 Hz. Zu jeder Mode Güte und der Wandabstand, der sie erzeugt
(f = c/2L). Dazu ein Kammfilter-Befund per Autokorrelation: der Abstand
der Einbrüche ist der Kehrwert der Laufzeitdifferenz, daraus folgt der
Umweg in Metern.

**Was eingestellt war und was ankam.** Steht in *Differenzen*, nicht in
Pegeln — erst dadurch wird die Messung mit der Einstellung vergleichbar.
Gestrichelt die eigene Rechnung des Equalizers, durchgezogen was das
Mikrofon davon gehört hat, in derselben Farbe.

**Wie die Kette auf Lautstärke reagiert** und **welche Frequenzen bei
welcher Lautstärke nachgeben.** Kennlinie und Formänderung.

Alle Diagramme folgen den Hausregeln: schwarzes Datenfeld mit runden
Ecken, keine Gitternetzlinien, Fläche gedämpft mit Kontur in voller
Stärke (gilt ausdrücklich für Säulen des Spektrums), Datenlinien ≥ 2,5 px,
Beschriftungen 10,5 und 12 px, Dezimalkomma.

---

## Drei Fallen beim Auswerten

Alle drei erzeugen Zahlen, die wie Meßwerte aussehen und keine sind.

**Die Auflösungsgrenze.** Eine Spitze aus zwei, drei Meßpunkten bekommt
rechnerisch eine gewaltige Güte — gemessen ist sie nicht, nur schmaler
als das Raster. Gemeldet wurde Q 528 bei 355 Hz, das wären 0,67 Hz Breite
bei 0,336 Hz Auflösung. Unter vier Punkten gibt es keine Güteangabe.

**Die Physik.** Die Güte einer Raummode hängt an der Nachhallzeit:
Q ≈ π·f·RT60/6,9. Ein Wohnraum mit einer halben Sekunde Nachhall kommt
bei 100 Hz auf etwa 22, bei einer ganzen auf 45. Über hundert ist es kein
Raum mehr, sondern ein Dauerton — und tatsächlich: „148 Hz mit Q 147"
war die Lüfterlinie, die bei der Raumstille schon bei 145,3 Hz stand. Was
in der Stille da war, ist keine Raummode.

**Die Glättung verändert das Q.** Bei voller Auflösung zappelt das
Spektrum so, daß die Modensuche gar nichts mehr findet; geglättet findet
sie wieder. Aber die Glättung verbreitert die Spitzen: dieselbe Mode
ergab bei 0,2 Hz Glättung Q 41, bei 0,5 Hz Q 17, bei 1,0 Hz Q 6. Eine
Zahl, die vom Suchverfahren abhängt, ist keine Messung. Also: **gesucht
wird geglättet, gemessen wird roh.**

---

## Rauschen gegen Sweep — der Vergleich

Beide Signale, dieselbe Kette, Equalizer neutral, gleiche Länge. Was sie
unterscheidet, ist allein das Verfahren.

| | Rauschen | Sweep |
|---|---|---|
| Unruhe der Kurve | 4,59 dB | **3,78 dB** |
| Raummoden gefunden | 2 | 1, **keine gemeinsame** |

Der Frequenzgang stimmt zwischen beiden auf **1,48 dB** überein, nach
Abzug eines Pegelunterschieds von 4,8 dB.

**Der Sweep ist bei gleicher Länge ruhiger**, nicht unruhiger — gegen die
Erwartung. Bei vier Sekunden wäre es umgekehrt; bei dreizehn bekommt
jedes Band genug Zeit, und dann spielt der Sweep seinen Vorteil aus, die
ganze Energie in eine Frequenz zu legen.

**Der Frequenzgang stimmt überein.** 1,48 dB zwischen zwei völlig
verschiedenen Signalen ist Meßgenauigkeit, nicht Zufall. Den
Pegelunterschied erklärt der Scheitelfaktor vollständig.

**Die Moden stimmen nicht überein** — und das ist das eigentliche
Ergebnis des Vergleichs. Eine Raummode ist eine Eigenschaft des Raums und
müßte in beiden auftauchen. Die Suche ist also nicht robust genug; Moden
werden seither als „in beiden Signalen bestätigt" oder „noch unbestätigt"
gekennzeichnet.

---

## Der Befund: der HomePod hat einen eingebauten Kompressor

Caspar_D vermutete es, die Messung bestätigt es. Sieben Stufen,
gleichmäßig in Dezibel (der Regler wirkt quadratisch, gleiche
Prozentschritte wären ungleiche dB-Schritte), Sweep, dreizehn Sekunden je
Stufe. **Von leise nach laut** — dann läßt sich abbrechen, sobald der
Abfall einsetzt, und der Krach bleibt einem erspart.

Gemessen wird das **Verhältnis**, nicht der Pegel: jede Stufe auf ihre
eigenen Mitten bezogen (250–2000 Hz, dort begrenzt praktisch kein
Lautsprecher), dann mit der leisesten Stufe verglichen. Daß mit dem
Regler alles leiser wird, ist ja sein Zweck.

| Regler | Baß | Höhen |
|---|---|---|
| 25 % | Bezug | Bezug |
| 32 % | −0,5 dB | −0,4 dB |
| 40 % | −0,4 dB | −1,3 dB |
| **50 %** | **−3,6 dB** | −1,3 dB |
| **63 %** | **−7,0 dB** | −1,4 dB |

**Bis 40 % ist die Kette ehrlich.** Ab 50 % greift die Baßbegrenzung, und
zwar schnell: rund 3,5 dB je Vier-Dezibel-Stufe — der Lautsprecher gibt
im Baß fast nichts mehr dazu, egal was man ihm schickt. Die Höhen fallen
um gut ein Dezibel und bleiben dann stehen.

Eine frühere Messung von oben herab zeigt dasselbe noch drastischer: bei
100 % gegen 25 % fehlten **13,2 dB bei 32 Hz** und 4,9 dB bei 63 Hz, bei
unangetasteten Mitten und −2,4 dB bei 8 kHz.

Das ist das Lehrbuchbild einer Schutzbegrenzung: tiefe Töne brauchen die
größte Membranauslenkung, also werden sie zuerst zurückgenommen; die
Mitten bleiben, weil dort die Lautheit sitzt.

**Und das erklärt die Ausbeute-Messungen rückwirkend.** Von der
Baß-Anhebung kamen 44 % an, von 445 Hz +12 nur 28 % — bei 60 %
Lautstärke. Es lag nicht am Equalizer und nicht am Raum, sondern daran,
daß der Lautsprecher genau das wegregelt, was man ihm mehr gibt.

**Praktisch:** Bei 40 % Abhörlautstärke hört man, was in der Musik ist.
Darüber wird der Baß zunehmend dünner, ohne daß es auffällt, weil
gleichzeitig alles lauter wird.

---

## Was man mit dem Ergebnis tun darf

Zwei Dinge sehen in der Messung gleich aus und verlangen entgegengesetztes
Handeln.

**Überhöhungen darf man dämpfen.** Eine stehende Welle lädt Energie in ein
Band; ein Regler nimmt sie wieder weg. Das funktioniert und ist
Standardpraxis. Der Korrekturvorschlag nimmt 70 % der gemessenen Spitze,
höchstens 6 dB: ein Regler soll eine Spitze brechen, nicht den Raum
umbauen. Gesucht wird gegen den geglätteten Verlauf, nicht gegen den
Mittelwert der ganzen Kurve — sonst wäre jeder Baßhang eine „Überhöhung".

**Einbrüche darf man nicht auffüllen.** Ein Loch kommt meist von einer
Auslöschung zwischen Direktschall und Reflexion; mehr Pegel wird genauso
ausgelöscht und verheizt nur Kopfraum. Dagegen hilft ein anderer Platz,
kein Regler.

**Fehlende Ausbeute darf man nur hochrechnen, wenn nichts begrenzt.**
Regelt der Lautsprecher zurück, macht mehr Pegel es schlimmer. Deshalb
ist „Lautstärke durchfahren" die Bedingung dafür und nicht die Zierde.
Bei Caspar_Ds HomePods lautet die Antwort: es begrenzt, also wird nicht
hochgerechnet — dort hilft nur leiser abhören.

**Der absolute Frequenzgang bleibt unangetastet.** Ihn zu glätten
bräuchte ein Mikrofon mit bekannter Kennlinie, sonst hebt man Bässe an,
um ein Loch auszugleichen, das im Mikrofon sitzt.

---

## Die Laufzeit — und was sie für den mitlaufenden Text heißt

Über AirPlay braucht der Ton **rund 2100 ms** vom Rechner bis zum
Hörplatz; das ist der Puffer, den AirPlay absichtlich anlegt, damit
mehrere Lautsprecher zusammenbleiben. Reproduzierbar über viele
Messungen: 2030 bis 2170 ms.

Derselbe Betrag gehört als Versatz an den mitlaufenden Text. Das Fazit
hält die gemessene Laufzeit gegen den eingestellten Textversatz und
bietet an, ihn zu übernehmen. Ein positiver Versatz läßt den Text später
kommen — genau richtig, damit das Wort dasteht, wenn es zu hören ist,
statt wenn es abgeschickt wurde.


---

## Was noch offen ist

**Die Impulsantwort per Entfaltung.** Die Zutaten liegen vor: der
logarithmische Sweep, die rohe Aufnahme und die Kenntnis des gesendeten
Signals. Es fehlt die Entfaltung — eine FFT-Division. Daraus fielen
Nachhallzeit RT60 je Terzband, Klarheit C50/C80, die Erstreflexionen
einzeln und der Klirrfaktor an (beim log-Sweep trennen sich die
Verzerrungsprodukte zeitlich von der Hauptantwort). Das ist, was
Toningenieure wirklich messen.

**Mehrere Mikrofone gleichzeitig.** `getUserMedia` kann mehrere Geräte
zugleich öffnen. Der Nutzen liegt weniger im Mitteln — die
Kammfiltermuster verschiedener Orte addieren sich zu neuem Unsinn — als
in der **Unterscheidung**: Zeigen drei Mikrofone an drei Orten dasselbe
Loch, ist es der Lautsprecher. Zeigen sie drei verschiedene, ist es der
Raum. Das kann eine Einzelmessung grundsätzlich nicht trennen.

**Die Modensuche robuster machen.** Der Vergleich Rauschen gegen Sweep
hat gezeigt, daß beide Signale verschiedene Moden finden. Vermutlich
müßte die Suche beide Spektren gemeinsam auswerten statt zweimal
getrennt.

**Eine Lautstärke-Empfehlung.** Der Punkt, ab dem die Kette ehrlich
arbeitet, ist meßbar (bei Caspar_D 40 %). Das Programm könnte ihn nennen
und beim Abhören daran erinnern.

---

## Die Meßdaten liegen bei

`library/messungen/` — trotz `.gitignore` für `library/` mit im Repo,
weil sie klein sind und im Gegensatz zum Audio **nicht reproduzierbar**:
ein Raum an einem bestimmten Abend läßt sich nicht nachstellen.

| Datei | Inhalt |
|---|---|
| `einmessung-2026-08-27.json` | eine vollständige Bezugsmessung: 31 Terzbänder und die lange FFT auf 2731 Punkte eingedampft (0,084 Hz Auflösung, 11,9 s Fenster) |
| `2026-08-27-befunde.json` | alle Zahlen des Tages, von Hand aus den Meldungen übertragen — Laufzeiten, Störlinien, Modenverdacht, beide Pegelreihen, der Signalvergleich |

Die **Rohaufnahmen wurden nicht gespeichert.** Das ist eine Lücke: mit
ihnen ließe sich jede Auswertung nachträglich anders rechnen, ohne noch
einmal Ton zu machen. Bei 13 Sekunden und 44,1 kHz wären es 1,1 MB je
Durchgang als Float32 — vertretbar, wenn man sie nach der Auswertung
gleich als WAV ablegt.

---

## Nachtrag 28.08.2026: der Weg, den die Fachwelt geht

Eine GitHub-Recherche hat ein Verfahren zutage gebracht, das mehreres
auf einmal löst — ausführlich in `docs/BACKLOG.md` unter „Einmessen: was
die Welt besser macht". Hier nur, was es für die Messungen oben
bedeutet.

**Angelo Farina, AES 108 (2000):** Bei einem **exponentiellen** Sweep
erscheinen die harmonischen Verzerrungen nach der Entfaltung als eigene
Impulsantworten, zeitlich **vor** der Hauptantwort. Sie lassen sich
einzeln herausschneiden.

Damit fällt in einem einzigen Durchgang an:

- der Frequenzgang, wie bisher
- **der Klirranteil je Harmonische** — und damit die Antwort auf die
  Frage, die oben offen bleibt: ob die HomePods ab 50 % begrenzen oder
  nur zurücknehmen. Kompression ohne Klirr sieht anders aus als ein
  überfahrener Verstärker.
- mehr Dynamik — wieviel, ist offen. Farinas „20 dB" gelten gegenüber
  MLS-Geräten, und MLS benutzen wir nicht.

> **Berichtigung 28.08.2026.** Hier stand zuerst „der Störabstand von
> 14,2 dB je Band". Das war vertauscht: 14,2 dB ist der **breitbandige**
> Wert und ausdrücklich der Fehlalarm, **je Band** waren es 39,9 dB —
> nachzulesen weiter oben unter „Der Maßstab war falsch". Die abgelegte
> Messung vom 27.08. nennt **34,8 dB je Band** und 36,58 dB breitbandig.
>
> Der Unterschied ist nicht akademisch: **ISO 3382-1 verlangt für T20
> einen Abklingbereich von 35 dB** über dem Grundgeräusch, für T30
> deren 45. Mit 34,8 dB liegt eine T20-Auswertung genau an der Schwelle
> und T30 außer Reichweite. Mit 14 dB wäre gar nichts davon möglich
> gewesen.
- Nachhallzeit, Klarheit C50/C80 und Reflexionen mit Laufzeit, alles
  aus derselben Aufnahme

**Und hier schließt sich der Kreis zum Absatz darüber:** Genau deshalb
sind die Rohaufnahmen so wertvoll. Läge die Aufnahme des Sweeps vor,
ließe sich die Entfaltung **nachträglich** rechnen — ohne noch einmal
Ton zu machen, ohne den Raum noch einmal still zu halten. Die Messungen
vom 27.08. sind für diese Auswertung verloren; die nächsten müßten es
nicht sein.

Für die Nachhallzeit nennt **ISO 3382-1** das Verfahren: Schroeder-
Integration, also die rückwärts integrierte Abklingkurve, ausgewertet
als EDT, T20 und T30. Unsere Modengüte über `Q ≈ π·f·RT60/6,9` steht
bisher auf einem geschätzten RT60 — mit einem gemessenen bekäme sie
ihren Bezug.
