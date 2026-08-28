# Was die Fachliteratur sagt

*Tiefenanalyse zu drei Themen: Songanalyse, Raumakustik, Gehörakustik.*

Stand 28.08.2026. Ergänzt die GitHub-Recherchen desselben Tages
(`docs/BACKLOG.md`) um das, was in Papers steht, aber in keinem
Repositorium liegt.

**Ein Befund wiegt schwerer als alle anderen und steht deshalb vorn:**
Bei den Raummoden — genau unserem Problembereich — ist die Norm, die
ich gestern empfohlen habe, das falsche Werkzeug. Das steht unten unter
„Die Schroeder-Frequenz".

---

# 1 · Songanalyse

## Wo unser Tonartverfahren steht

Die Zahlen sind unerwartet klar:

| Verfahren | Genauigkeit |
|---|---|
| Chroma-Templates (Krumhansl-Schmuckler) | **75–85 %** |
| Moderne neuronale Netze | **über 90 %** |

Unser Verfahren gehört zur ersten Klasse — Goertzel je Halbton statt
FFT-Chroma, aus der Baßspur statt aus dem Vollmix, was es innerhalb
dieser Klasse besser macht. Aber der Sprung auf über 90 % ist ein
Klassenunterschied, keine Feinabstimmung.

**Vorsicht bei den Zahlen:** Der MIREX-Bewertungsschlüssel vergibt nicht
nur richtig/falsch, sondern Teilpunkte — 1,0 für die richtige Tonart,
**0,5 für eine Quinte daneben**, 0,3 für die Paralleltonart, 0,2 für
gleichnamiges Dur/Moll. Eine „Genauigkeit von 80 %" kann also bedeuten,
daß ein gutes Stück davon Quintverwechslungen sind. Wer Zahlen
vergleicht, muß wissen, welche Skala gemeint ist.

Zum Maßstab: [S-KEY](https://arxiv.org/html/2501.12907) (selbstüberwacht)
erreicht auf FMAKv2 einen MIREX-Score von 72,1 %, mit einer Million
Songs 73,2 % — und liegt damit gleichauf mit dem überwachten Stand der
Technik von 73,1 %. Auf schwierigen Datensätzen sind auch die besten
Systeme weit von Perfektion entfernt.

## Foundation Models: ein Modell statt zehn

**MERT-330M** erreicht allein, wofür vorher die besten Ergebnisse aus
**zehn verschiedenen Modellen** nötig waren — überwachte eingeschlossen
—, und setzt bei vier Maßen einen neuen Bestwert
([Paper](https://arxiv.org/html/2306.00107v3),
[Code](https://github.com/yizhilll/MERT)).

Gemessen wird auf **MARBLE**: 18 nachgelagerte Aufgaben, 13 Kategorien,
12 Datensätze — Beat, Tonart, Akkorde, Genre, Stimmung, Instrumente,
Sänger, Segmentierung.

Bemerkenswert für uns ist, **wo** MERT stark ist: bei lokalen Merkmalen
— Beat, Tonhöhe, Klangfarbe — und nur „konkurrenzfähig" bei globalen wie
Tagging, Tonart und Genre. Genau umgekehrt zu unserer Lage: Wir haben
die globalen Etiketten (Discogs-EffNet) und lassen uns die lokalen von
Suno geben.

**MuQ übertrifft MERT** inzwischen in nahezu allen MARBLE-Aufgaben. Wer
einsteigt, sollte dort anfangen, nicht bei MERT.

## Was das für uns heißt

Ein Foundation Model wäre **ein** Modell statt vieler: Es liefert
Einbettungen, aus denen sich Beat, Tonart, Struktur und Etiketten mit je
einem kleinen aufgesetzten Klassifikator gewinnen lassen. Das ersetzte
Discogs-EffNet, die eigene Tonartrechnung und die fehlende
Beat-Erkennung in einem Zug.

Der Preis: 330 M Parameter statt 18 MB, und die Klassifikatoren müßten
trainiert werden — dafür braucht es beschriftete Daten, die wir nicht
haben.

**Nüchtern:** Für den Klangraum reicht Discogs-EffNet. Der Gewinn läge
bei Tonart und Beat, und dort ist ein spezialisiertes Modell
(beat_this) der billigere Weg als ein Foundation Model mit
Trainingsaufwand.

---

# 2 · Raumakustik

## Die Schroeder-Frequenz — und warum ISO 3382 bei uns danebengreift

Das ist der wichtigste Fund dieser Recherche, und er korrigiert die
Empfehlung vom selben Tag.

Die **Schroeder-Frequenz** trennt zwei völlig verschiedene akustische
Welten:

```
f_s = 2000 · √(RT60 / V)        V = Raumvolumen in m³
```

- **Darüber** überlappen sich so viele Moden, daß ein statistisches
  Schallfeld entsteht. Sabine, Eyring und ISO 3382 gelten.
- **Darunter** gibt es nur einzelne Resonanzen mit eigener Frequenz,
  eigenem Ort und **eigener Abklingzeit**.

In Wohnräumen liegt sie bei **100 bis 200 Hz**, in kleinen Regieräumen
bei 150 bis 250 Hz.

**Und damit liegt unser ganzer Problembereich darunter.** Die Moden, die
das Panel sucht, die Baßfrage vom 27.08., die stehenden Wellen — alles
unterhalb der Schroeder-Frequenz.

Die Folge, wörtlich aus der Literatur: *Standardmessungen nach ISO 3382
erreichen in Terzbändern keine genauen Werte, weil die Abklingvorgänge
durch Raummoden nichtlinear sind.* Ein RT60 unterhalb f_s ist keine
einzelne Exponentialfunktion — **jede Mode klingt mit ihrer eigenen Rate
ab**. Die Schroeder-Integration mittelt darüber hinweg und liefert eine
Zahl, die keinen physikalischen Vorgang beschreibt.

## Was statt dessen gilt

Die Literatur nennt die **modale Nachhallzeit**: Abklingzeit **je
Resonanzfrequenz**, einzeln bestimmt. Als robusteste Verfahren gelten

- die fensterbreitenoptimierte **Stockwell-Transformation** (S-Transform),
- die kontinuierliche **Wavelet-Transformation**,
- die **Morlet-Wave-Methode**.

Und ein Satz daraus ist für uns Gold wert: Ihre Anwendbarkeit werde
dadurch erhöht, *daß nur eine einzige Messung an der gewählten
Mikrofonposition nötig ist*.

Das heißt: **Für die Modenanalyse brauchen wir das iPhone nicht.** Eine
Aufnahme am Hörplatz genügt, wenn sie richtig ausgewertet wird. Der
Ortswechsel bleibt nützlich, um zu sehen, wo man sitzen sollte — für die
Kennzahlen ist er nicht nötig.

## Zusammenfassung für unser Panel

| | bisher | richtig wäre |
|---|---|---|
| Modengüte | über `Q ≈ π·f·RT60/6,9`, RT60 geschätzt | modale Abklingzeit je Resonanz |
| Verfahren | Spektrum des Sweeps | Stockwell/Wavelet auf der Impulsantwort |
| Meßpositionen | eine | eine reicht — belegt |
| RT60 global | nicht erhoben | **oberhalb** f_s sinnvoll, darunter nicht |

Farinas Entfaltung (siehe Backlog) bleibt der erste Schritt: Ohne
Impulsantwort keine Zeit-Frequenz-Analyse.

---

# 3 · Gehörakustik

## Wie gut Selbsttests wirklich sind

Eine Metaanalyse über **25 Studien mit 4.470 Patienten** gibt für
Smartphone-Audiometrie:

- Empfindlichkeit **89 %**
- Spezifität **93 %**
- Fläche unter der ROC-Kurve **0,95**

Das ist als *Erkennung eines Hörverlusts* brauchbar. Für die
Schwellenbestimmung selbst gilt anderes: Abweichungen von über 8 dB HL
im ruhigen Raum, über 14 dB in normaler Umgebung, davon allein 6,2 dB
Standardabweichung durch Kalibrierfehler.

## Der entscheidende Befund: 8 kHz ist eine physikalische Grenze

Eine Studie von 2025 mit **Consumer-Kopfhörern** (Sennheiser HD 300)
fand Abweichungen von **unter 2 dB zwischen 250 und 4000 Hz** — und
deutlich größere bei **6000 und 8000 Hz**.

Der Grund ist nicht schlechte Technik, sondern Physik: Oberhalb von etwa
8 kHz erreicht die **Wellenlänge die Größenordnung des Gehörgangs**.
Es bilden sich **stehende Wellen** darin — an manchen Stellen ist der
Druck hoch, an anderen nahezu null. Wörtlich aus der Literatur: Eine
genaue Kalibrierfunktion zu berechnen sei dort *schwierig, wenn nicht
unmöglich*.

Dazu kommt die Ankopplung: Schon geringe Änderungen im Sitz des
Kopfhörers erzeugen oberhalb 8 kHz große spektrale Unterschiede.

**Konsequenz für unseren Bauplan:**

- **250 Hz bis 4 kHz** — verläßlich, unter 2 dB Abweichung.
- **6 kHz** — mitmessen, aber als unsicher kennzeichnen.
- **Über 8 kHz** — gar nicht erst anbieten. Was dort herauskäme, wäre
  die Sitzposition des Kopfhörers, nicht das Gehör.

Das ist eine unangenehme Grenze, denn Altersschwerhörigkeit beginnt
genau dort oben. Aber ein Meßwert, der die Kopfhörerplatzierung mißt,
ist schlechter als kein Meßwert — er sähe nur so aus, als wüßte man
etwas.

## ISO 7029 als Plausibilitätsprüfung

**ISO 7029:2017** gibt die statistische Verteilung der Hörschwelle nach
Alter und Geschlecht, für 18 bis 80 Jahre und **125 Hz bis 8 kHz** —
also genau bis dorthin, wo die Messung ohnehin endet.

Damit läßt sich ein Ergebnis einordnen, ohne es zu bewerten: Liegt die
gemessene Kurve weit außerhalb dessen, was für das Alter zu erwarten
wäre, spricht mehr für eine schlechte Messung als für ein
außergewöhnliches Ohr. Dieselbe Art Prüfung wie beim Einmessen die
Frage, ob eine gefundene Mode zum Wandabstand paßt.

---

# Was ich daraus mitnehmen würde

**1. Die Modenanalyse auf modale Abklingzeit umstellen.** Das ist der
größte Hebel, weil unser gesamter Problembereich unterhalb der
Schroeder-Frequenz liegt und die bisherige Rechnung dort keine
physikalische Entsprechung hat. Voraussetzung ist Farinas Entfaltung.

**2. Beim Hörtest bei 8 kHz aufhören** und 6 kHz als unsicher
kennzeichnen — mit der Begründung im Panel, nicht in einer Fußnote.

**3. Bei der Tonart nichts überstürzen.** Der Abstand zum Stand der
Technik ist real (75–85 % gegen über 90 %), aber ein Foundation Model
brächte Trainingsaufwand mit, den wir nicht stemmen. Falls Tonart je
wichtiger wird, ist ein spezialisiertes Modell der Weg.
