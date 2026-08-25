# Wo die Software still etwas erfindet

**Protokoll vom 25.08.2026.** Caspar_D: *„den Befund, daß still Dinge
erfunden werden, muß aber protokolliert werden."*

Der Code trägt an vielen Stellen die Regel *„lieber nichts zeigen als
etwas erfinden"* — an den Rändern der Glättung, bei den Notenzonen, bei
den Kaskadenbändern. Die Stellen unten halten sie **nicht** ein, und
zwar unbemerkt: Es kracht nichts, es sieht nach einer Messung aus.

Gemessen über den ganzen Bestand (321 Songs), nicht geschätzt.

---

## 1. Erfundener Liedtext — 19 Songs

Whisper hört auf Naturklang Sprache, wo keine ist. Die Ausgabe steht als
Wort-Zeitmarken im Katalog (`worte`) und wird in der Bühne angezeigt wie
jeder echte Text — mitlaufend, klickbar, mit Zeitmarken.

Erkannt an drei Mustern: fremde Schrift (singhalesisch, arabisch,
thailändisch), Danksagungen aus Video-Abspännen, Untertitel-Hinweise —
dazu Wortschleifen, bei denen ein einziges Wort über 40 % des Textes
ausmacht.

| Song | Worte | erkannt an |
|---|---|---|
| Abenddämmerung | 209 | fremde Schrift, Wortschleife „අපි" 60 % |
| Abenddämmerung | 17 | Untertitel-Hinweis, Wortschleife „thank" 41 % |
| Aufklaren | 147 | fremde Schrift, Wortschleife „අපි" 54 % |
| Aufklaren | 17 | Untertitel-Hinweis, Wortschleife „thank" 41 % |
| Erste Regentropfen | 195 | fremde Schrift, Wortschleife „අපි" 63 % |
| Erste Regentropfen | 325 | fremde Schrift, Wortschleife „අපි" 73 % |
| Erste Regentropfen | 168 | fremde Schrift |
| Landregen | 161 | fremde Schrift, Wortschleife „අපි" 48 % |
| Landregen | 57 | Untertitel-Hinweis |
| Murmelnder Bach | 248 | fremde Schrift, Wortschleife „අපි" 58 % |
| Murmelnder Bach | 12 | Wortschleife „thank" 42 % |
| Murmelnder Bach | 262 | fremde Schrift, Wortschleife „අපි" 55 % |
| Rückkehr zur Wiese | 181 | fremde Schrift, Wortschleife „අපි" 58 % |
| Rückkehr zur Wiese | 16 | Untertitel-Hinweis |
| Rückkehr zur Wiese | 158 | fremde Schrift, Wortschleife „අපි" 49 % |
| Waldesrauschen | 215 | fremde Schrift, Wortschleife „අපි" 51 % |
| Waldesrauschen | 14 | Untertitel-Hinweis |
| Wind im Wald | 33 | Untertitel-Hinweis |
| Wolkenbruch | 43 | Untertitel-Hinweis |

**Das ist die Untergrenze.** Erkannt werden nur die offensichtlichen
Fälle; ein halluziniertes deutsches Wort auf Wind sieht wie echter Text
aus. Von den 64 Songs ohne Liedtext haben **35** überhaupt
Wort-Zeitmarken — die übrigen 16 tragen also vermutlich ebenfalls
Erfundenes, nur unauffälliger.

## 2. Stimmlage ohne Stimme — 64 von 64 Songs

**Jedem** textlosen Stück wird eine Stimmlage zugeschrieben, durchweg
„männlich". Der Wächter in `bin/toene.js` verlangt mindestens 20
gemessene Tonhöhen in der Gesangsspur — bei Naturklang enthält die aber
kein Schweigen, sondern Übersprechen, und YIN findet darin tausende:

| Song | Lage | gemessene Tonhöhen |
|---|---|---|
| Wind im Wald | männlich | 5631 |
| Murmelnder Bach | männlich | 4888 |
| 4 Nachglut IV | männlich | 4693 |
| 3 Atem der Nacht III | männlich | 4561 |
| 3 Atem der Nacht IV | männlich | 4363 |
| Abenddämmerung | männlich | 4174 |
| Erste Regentropfen | männlich | 4065 |
| 3 Atem der Nacht II | männlich | 3954 |
| 1 Unter der Haut III | männlich | 3527 |
| 1 Unter der Haut I | männlich | 3484 |

„Wind im Wald" gilt als männlich, aus 5631 Tonhöhen im Rauschen.

**Der Weg wäre:** nicht fragen, ob Tonhöhen *meßbar* sind, sondern ob
überhaupt Gesang da ist — etwa über den Liedtext, über Sunos
`instrumental`-Flag oder über die Frage, wieviel lauter die Gesangsspur
gegenüber den anderen ist.

## 3. Tonart auf Rauschen — 50 von 50 Naturklang-Stücken

Jedes Naturklang-Stück bekommt eine Tonart, „Wiese mit Insekten" gleich
vier verschiedene in vier Fassungen (E Dur, F Dur, D Moll, A Moll).

**Die naheliegende Abhilfe funktioniert nicht.** Die Software mißt die
Eindeutigkeit des Grundtons bereits mit (`tonart.einsAnteil`) und zeigt
sie nur nicht. Als Filter taugt sie trotzdem nicht:

| | n | Median | p10 | p90 |
|---|---|---|---|---|
| mit Liedtext | 257 | 44 % | 30 % | 72 % |
| ohne Liedtext | 64 | 40 % | 25 % | 60 % |

Die Verteilungen überlappen fast vollständig. Eine Schwelle bei 35 %
nähme **62 echten Songs** die Tonart und erwischte dabei nur 19 der 64
textlosen. Der Filter müßte woanders ansetzen — beim Material, nicht
beim Meßwert.

## 4. Spuren, die nur Übersprechen tragen

Siehe [OFFEN.md 2.5](OFFEN.md) — der Piano-Befund ist derselbe
Mechanismus: `huelle()` normiert jede Stem-Spur auf **ihren eigenen**
Spitzenwert und legt die absolute Spitze nicht ab. Eine Spur mit bloßem
Übersprechen sieht danach aus wie eine tragende. Songs, deren Prompt
*no piano* sagt, haben die lauteste Klavierspur im Archiv (Median
99,5 %).

---

## 5. Und wie sicher ist der Grundton, wo es einen gibt?

Caspar_D: *„wie sicher ist denn unsere Grundtonermittlung?"* — gemessen
mit zwei voneinander unabhängigen Proben.

**Das Verfahren** (`bin/toene.js:341`): Der Grundton ist der häufigste
Baßton auf der **Eins des Takts**, sofern mindestens zwölf solche Töne
vorliegen (`woher: 'bass'`); sonst korreliert der Tonvorrat mit Dur-
und Moll-Profilen (`woher: 'leiter'`). `einsAnteil` sagt, wie oft der
gewählte Ton unter allen Baß-Einsen vorkommt — 48 % heißt: bei knapp
jeder zweiten Eins.

### Probe 1: gegen die Tonartangabe im Prompt (28 Songs)

**16 von 28 Grundtönen richtig — 57 %.** Vorsicht beim Lesen: Der Prompt
sagt, was Suno tun *sollte*, nicht was es getan hat. 57 % ist deshalb
eine Untergrenze.

Aufschlußreicher als die Quote sind die **Fehlerabstände**:

| Abstand | Fälle | |
|---|---|---|
| 0 (richtig) | 16 | |
| ±1 Halbton | 3 | |
| ±2 Halbtöne | 3 | |
| +3 | 1 | |
| −4 | 1 | |
| **−5 Halbtöne** | **4** | **die Quinte** |

Vier der zwölf Fehler liegen auf derselben Stufe: Der Baß spielt auf
der Eins die **Quinte statt des Grundtons**. Das ist kein Rauschen,
sondern ein benennbarer Fehler des Verfahrens.

### Probe 2: Fassungen desselben Stücks (14 Paare, nur Songs mit Text)

Ohne jede äußere Wahrheit — zwei Fassungen eines Stücks müssen dieselbe
Tonart haben:

**10 von 14 einig — 71 %.** Die vier Abweichler: zweimal die Quinte
(autophagie D↔A, ulrich & ännchen D↔G), zweimal eine Sekunde.

### Was `einsAnteil` wirklich taugt

Als Filter gegen Rauschen **nicht** (siehe Abschnitt 3). Als Maß für
die Verläßlichkeit **schon**:

| Sicherheit | Trefferquote gegen den Prompt |
|---|---|
| alle | 57 % |
| ab 45 % | 71 % |
| ab 50 % | 70 % |
| **ab 55 %** | **86 %** |

Und bei den uneinigen Fassungen zeigt sie, welche stimmt: „ulrich &
ännchen" D mit **95 %** gegen G mit 30 %, „dogma" C mit **100 %** gegen
D mit 52 %. Die sichere Fassung ist die plausible.

### Was daraus zu machen wäre

- **Den Quintenfehler abfangen.** Liegt der zweithäufigste Baßton eine
  Quarte unter dem häufigsten, ist der häufigste vermutlich die Quinte.
  Prüfbar wäre das erst nach einer Neurechnung — `toene.json` legt nur
  den gewählten Ton und `einsAnteil` ab, nicht die ganze Verteilung.
  **Sie mit abzulegen kostet 12 Zahlen je Song** und macht die Frage
  ohne Neulauf beantwortbar.
- **Die Sicherheit anzeigen.** Sie wird gemessen und nicht gezeigt. Ein
  Grundton mit 30 % ist etwas anderes als einer mit 95 %, und der
  Unterschied ist für den Betrachter heute unsichtbar.

---

## Was alle vier gemeinsam haben

Ein Verfahren wird auf Material angewandt, für das es nicht gedacht ist,
und liefert brav ein Ergebnis: YIN findet Tonhöhen im Wind, Whisper
findet Sprache im Regen, die Tonartschätzung findet einen Grundton im
Rauschen, die Trennung findet ein Klavier im Übersprechen. Keines der
Verfahren kann sagen *„hier ist nichts"* — das müßte die Stelle davor
entscheiden.

**Nichts davon ist entschieden.** Das Protokoll hält den Zustand fest,
mit Zahlen und Songlisten, damit die Bearbeitung nicht neu messen muß.
