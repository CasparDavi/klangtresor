# Wo die Software still etwas erfindet

> **Die Arbeitsliste steht in [WAS-OFFEN-IST.md](WAS-OFFEN-IST.md).**
> Dieses Dokument ist der Bericht dazu — Messungen, Begründungen,
> Herleitung. Was noch zu TUN ist, steht seit dem 25.08.2026 nur noch an
> der einen Stelle, damit es nicht zwei Antworten auf dieselbe Frage
> gibt (Hausregel).

**Protokoll vom 25.08.2026.** Caspar_D: *„den Befund, daß still Dinge
erfunden werden, muß aber protokolliert werden."*

Der Code trägt an vielen Stellen die Regel *„lieber nichts zeigen als
etwas erfinden"* — an den Rändern der Glättung, bei den Notenzonen, bei
den Kaskadenbändern. Die Stellen unten halten sie **nicht** ein, und
zwar unbemerkt: Es kracht nichts, es sieht nach einer Messung aus.

Gemessen über den ganzen Bestand (321 Songs), nicht geschätzt.

---

> ## ✔ BEHOBEN am 25.08.2026 — Abschnitt 1 und der Text-Teil von 2
>
> Caspar_D: *„nimm bitte alle Instrumentals von den Analysen aus, die
> Text generieren/analysieren, und lösche Text-Items, die von diesen
> Stücken abgeleitet wurden."*
>
> **Gelöscht:** die halluzinierten Wort-Zeitmarken bei 35 Stücken; alle
> 64 Instrumentals tragen jetzt `instrumental: true`. Gegenprobe: kein
> einziger Song im Bestand trägt noch ein Halluzinationsmuster.
>
> **Gesperrt, damit es nicht wiederkommt** — an zwei Stellen, weil die
> vorhandene Erkennung das Gegenteil prüft (`worte.length < 5` sucht ZU
> WENIG Text, eine Halluzination hat zu viel):
> - `bin/whisper.js` rechnet Stücke ohne Liedtext gar nicht erst
> - `bin/aufbereiten.js` übernimmt nichts für sie, falls doch Daten da sind
>
> **Gesichert:** `library/backup/vor-instrumental-bereinigung-*`
>
> Offen bleibt die **Stimmlage** (Abschnitt 2) — sie ist kein Text-Item
> und steht weiter bei allen 64.

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

Caspar_D: *„wie sicher ist denn unsere Grundtonermittlung?"*

Belastbar beantwortet **nur durch den Fassungsvergleich** unten. Der
naheliegende Weg über die Prompt-Angabe ist eine Sackgasse — und zwar
eine bekannte, siehe die Warnung gleich darunter.

**Das Verfahren** (`bin/toene.js:341`): Der Grundton ist der häufigste
Baßton auf der **Eins des Takts**, sofern mindestens zwölf solche Töne
vorliegen (`woher: 'bass'`); sonst korreliert der Tonvorrat mit Dur-
und Moll-Profilen (`woher: 'leiter'`). `einsAnteil` sagt, wie oft der
gewählte Ton unter allen Baß-Einsen vorkommt — 48 % heißt: bei knapp
jeder zweiten Eins.

### ⚠ Ein verworfener Maßstab, und warum er hier trotzdem steht

Der erste Anlauf maß gegen die **Tonartangabe im Prompt** (28 Songs
nennen eine) und kam auf 57 % Treffer. **Dieser Maßstab ist am
23.08.2026 ausdrücklich verworfen worden** (ANALYZER-PRUEFUNG.md,
Caspar_Ds Einwand):

> *„niemand garantiert, daß Suno die Prompt-Tonart auch wirklich
> benutzt."* Der Prompt ist eine Absicht, kein Meßwert — Suno kann
> transponieren, etwas anderes erzeugen oder die Angabe ignorieren.

Die 57 % messen deshalb **nicht die Genauigkeit unserer Ermittlung**,
sondern die Übereinstimmung zweier Unbekannter: wie tontreu Suno
arbeitet **mal** wie gut wir messen. Aus einer solchen Zahl läßt sich
keines von beidem herauslösen. Sie steht hier nur als Warnung, damit
niemand den Weg ein drittes Mal geht.

### Die belastbare Probe: Fassungen desselben Stücks

14 Paare, nur Songs mit Liedtext, **ohne jede äußere Wahrheit** — zwei
Fassungen eines Stücks müssen dieselbe Tonart haben, egal wie tontreu
das Modell arbeitet:

**10 von 14 einig — 71 %.**

Die vier Abweichler:

| Stück | gemessen | Abstand |
|---|---|---|
| autophagie | D (52 %) ↔ A (87 %) | **Quinte** |
| ulrich & ännchen | D (95 %) ↔ G (30 %) | **Quinte** |
| erweckt | G (32 %) ↔ F (33 %) | Sekunde |
| dogma | D (52 %) ↔ C (100 %) | Sekunde |

**Zweimal die Quinte** — und das ist der eine Befund, der die
Prompt-Probe überlebt: Der Baß spielt auf der Eins die fünfte Stufe
statt der ersten, und das Verfahren nimmt sie für den Grundton. Hier
gemessen ohne Rückgriff auf irgendeine Prompt-Angabe.

### Was `einsAnteil` taugt

Als Filter gegen Rauschen **nicht** (Abschnitt 3). Als Maß für die
Verläßlichkeit **schon** — und auch das zeigt sich prompt-unabhängig:
Bei jedem uneinigen Paar hat eine Fassung deutlich mehr Sicherheit als
die andere, und es ist die plausiblere. „dogma" C mit **100 %** gegen D
mit 52 %, „ulrich & ännchen" D mit **95 %** gegen G mit 30 %.

Die naheliegende Auswertung „ab welcher Sicherheit stimmt es?" ließe
sich nur gegen einen Maßstab rechnen — und den gibt es nicht. Was
bleibt, ist die Beobachtung, daß die sichere Fassung bei allen vier
Paaren die plausiblere ist.

### Was daraus zu machen wäre

- **Den Quintenfehler abfangen** — der einzige Befund, der ohne äußeren
  Maßstab auskommt. Liegt der zweithäufigste Baßton eine Quarte unter
  dem häufigsten, ist der häufigste vermutlich die Quinte.
  Prüfbar wäre das erst nach einer Neurechnung — `toene.json` legt nur
  den gewählten Ton und `einsAnteil` ab, nicht die ganze Verteilung.
  **Sie mit abzulegen kostet 12 Zahlen je Song** und macht die Frage
  ohne Neulauf beantwortbar.
- **Die Sicherheit anzeigen.** Sie wird gemessen und nicht gezeigt. Ein
  Grundton mit 30 % ist etwas anderes als einer mit 95 %, und der
  Unterschied ist für den Betrachter heute unsichtbar.
- **Einen echten Maßstab bauen, falls die Frage je wichtig wird.** Der
  Fassungsvergleich prüft nur Konsistenz, nicht Richtigkeit. Belastbar
  wäre eine unabhängige Nachrechnung mit einem anderen Verfahren — oder
  der Abtastraten-Test aus ANALYZER-PRUEFUNG.md: Dieselbe Aufnahme bei
  44,1 / 48 / 32 / 22,05 kHz muß dieselbe Tonart ergeben. Der brachte
  die ALTE Tonartmessung zu Fall (12 von 12 Songs bekamen verschiedene
  Tonarten) und ist auf die heutige noch nicht angewandt.

### Warum ein geschulter Mensch es kann und der Rechner nicht

Caspar_D: *„jeder geschulte Mensch kann die Tonart bestimmen, warum
können Computer das nicht?"*

**Vorbemerkung — ein zweiter verworfener Weg.** Der erste Anlauf dieser
Antwort verglich das heutige Verfahren mit **Krumhansl-Schmuckler**.
Auch das ist erledigte Sache: Am **19.08.2026** wurde die
Tonartbestimmung genau deshalb ersetzt — *„Baß auf Sunos Eins statt
Krumhansl über den Vollmix"* (HAUSREGELN.md) —, weil das Verfahren
massiv E-Moll überrepräsentierte. `schaetzeTonart()` samt
Krumhansl-Tabellen ist ausgebaut (BACKLOG.md).

Daneben steht die Hausregel, gegen die ich verstoßen habe: *„Ein
Verfahren gilt nicht als ersetzt, solange sein Vorgänger noch irgendwo
steht."*

Auf Nachfrage geprüft, worauf meine Rechnung eigentlich lief — und die
Antwort ist: **auf dem Vollmix**, also genau der verworfenen
Kombination. Der Baß liefert in den Notenzonen nur das *Raster* (wo die
Zonengrenzen liegen), der Inhalt kommt aus dem Mix:

```js
const v = chromaVektor(mix, SR_ZONE, …);   // bin/toene.js:310
```

Ein Unterschied bleibt, und er ist der interessante Teil: Die alte
Messung zog ihr Chroma aus der **FFT**, meine aus **Goertzel**. Die
E-Häufung war ein Artefakt des Fächerrasters — *„bei 48 kHz klingt das
nackte Fächerraster nach E-Dur; daher stehen 58 mal E Dur im Archiv"*
(ANALYZER-PRUEFUNG.md). Mit Goertzel gemessen tritt sie nicht auf
(C-Moll 41, E-Moll 35, G-Moll 30; Streuung 3,25 von 3,58 möglichen).

**Das ändert am Urteil nichts:** besser war es trotzdem nicht (64 %
gegen 71 %), und ein ausgebautes Verfahren ist kein Maßstab. Es
verschiebt nur die Schuldzuweisung — die Verzerrung lag an der
Frequenzanalyse, nicht an der Korrelation.

### Was bleibt — und es reicht für die Antwort

Zwei Messungen, die ohne jedes verworfene Verfahren und ohne
Prompt-Angabe auskommen:

| Beobachtung | Wert |
|---|---|
| Fassungspaare, die dieselbe Tonart bekommen | 10 von 14 = **71 %** |
| Songs, die auf dem gemessenen Grundton **enden** | 83 von 257 = **32 %** |
| davon statt dessen auf der **Quinte** endend | 38 von 257 = **15 %** |

**Was der Mensch anders macht.** Er zählt keine Töne. Er hört, wo es zur
Ruhe kommt: Spannung, die sich auflöst — die Dominante, die zur Tonika
fällt. Das ist eine Aussage über den zeitlichen *Verlauf* und über
*Erwartung*, nicht über Häufigkeit. Unser Verfahren rechnet Statistik
über das ganze Stück, so als wollte man die Hauptfigur eines Romans
dadurch bestimmen, welcher Name am häufigsten vorkommt.

Genau daher der **Quintenfehler**: Der Baß spielt die fünfte Stufe
häufig und betont — für die Statistik sieht sie aus wie der Grundton,
fürs Ohr ist sie das Gegenteil, nämlich die Spannung, die noch
aufgelöst werden will. Die 15 % oben sind derselbe Befund von der
anderen Seite gesehen.

**Und KI-Musik macht es besonders schwer.** Der naheliegende
menschliche Griff — auf den Schluß hören — ist hier am wenigsten
verläßlich: Als Grundtonquelle geprüft, liefert der Schluß bei den
Fassungspaaren nur **21 %** Übereinstimmung, weil Suno-Stücke
ausblenden, im Instrumentalen enden oder mitten in der Phrase aufhören,
statt zu kadenzieren.

**Können Computer es also?** Ja — der Stand der Technik liegt bei
70–85 % für klassische Popmusik, mit trainierten Netzen, die
Akkordfolgen und Kadenzen lernen statt Töne zu zählen. Das ist eine
andere Größenordnung von Aufwand, und es setzt Material voraus, das
sich an Konventionen hält.

**Wichtig für die Einordnung:** Die 71 % sind *Konsistenz*, nicht
*Richtigkeit*. Ein Verfahren kann verläßlich dasselbe Falsche sagen.
Einen Maßstab für Richtigkeit haben wir nicht — der Prompt taugt nicht,
Krumhansl ist ausgebaut, und niemand hat die 321 Stücke von Hand
bestimmt.

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
