# Farbhandling

> **Die Arbeitsliste steht in [WAS-OFFEN-IST.md](WAS-OFFEN-IST.md).**
> Dieses Dokument ist der Bericht dazu — Messungen, Begründungen,
> Herleitung. Was noch zu TUN ist, steht seit dem 25.08.2026 nur noch an
> der einen Stelle, damit es nicht zwei Antworten auf dieselbe Frage
> gibt (Hausregel).

Wie aus einem Cover eine Palette wird. `bin/farben.js`, Diagnosewerkzeug
`bin/farbvergleich.js`.

---

## Grundsatz

**Es wird nichts erfunden.** Jede Farbe der Palette ist ein Pixel, das im
Cover tatsächlich steht. Auch die *Anzahl* kommt aus dem Bild:

| Gefundene Töne | Cover |
|---|---|
| 0 (echtes Graustufenbild) | 18 |
| 1 | 21 |
| 2 | 93 |
| 3 | 65 |
| 4 | 34 |
| 5 | 17 |

Die Palette wird nicht nur in der Bühne benutzt: `uiFaerben()` in
`web/index.html` legt sie beim Start eines Songs auf die **gesamte
Oberfläche** — Hintergrund, Flächen, Ränder, Akzente. Siehe
[VISUALIZER.md](VISUALIZER.md).

Eine frühere Fassung leitete aus einer Leitfarbe vier weitere im
72°-Abstand ab, ein „Farbtonpentagramm". Für ein Rotwein-Cover lieferte
das Grün, Türkis und Magenta. Ersatzlos entfallen.

---

## Farbräume — was wofür

**Gerechnet wird in OKLab** (Björn Ottosson, 2020). Dort entspricht
gleicher Zahlenabstand ungefähr gleichem Seheindruck. In RGB ist das nicht
so: Ein Clusterverfahren wirft dort Farben zusammen, die deutlich
verschieden aussehen, und trennt andere, die identisch wirken.

### Helligkeit ist nicht gleich Helligkeit

**V aus HSV und L aus HSL taugen nicht.** Beide stammen aus dem
Hexkegel-Modell von 1978 und wurden gewählt, weil sie billig zu rechnen
waren. Die Probe: Reines Gelb `#FFFF00` und reines Blau `#0000FF` haben in
HSV beide V = 1,0 und in HSL beide L = 0,5 — obwohl das Gelb rund
**zehnmal** so hell strahlt.

| Größe | Was sie ist | Wofür |
|---|---|---|
| **V / L (HSV/HSL)** | Geometrie ohne Bezug zum Sehen | für nichts |
| Luma Y′ | kanalgewichtet, aber auf gammakodierten Werten | Video |
| **Relative Luminanz Y** | physikalisch korrekt | **WCAG-Kontrast** |
| **L\* (CIELAB) / OKLab L** | wahrnehmungsgerecht, ≈ dritte Wurzel der Luminanz | **Auswahl und Filterung** |
| Munsell Value | dasselbe, aber 1905–1915 **empirisch** ermittelt | das Original, L\* ist dessen Nachbau (L\* ≈ 10 × Value) |

**Brightness vs. Lightness:** Brightness ist die wahrgenommene *absolute*
Intensität und hängt von der Beleuchtung ab. Lightness ist die Intensität
*relativ zu einem Bezugsweiß*. Für Bilder auf einem Schirm ist Lightness
richtig.

**Nicht erfasst:** der Helmholtz-Kohlrausch-Effekt — gesättigte Farben
wirken heller, als ihre Luminanz hergibt. Weder L\* noch OKLab L bilden das
ab; CAM16 teilweise.

**Konsequenz:** zwei Maße für zwei Aufgaben. OKLab L zum Auswählen,
relative Luminanz für den Kontrast. Das ist kein Widerspruch — mit einer
anderen Größe stünden am Ende WCAG-Zahlen da, die nicht bedeuten, was sie
behaupten.

---

## Das Verfahren, Schritt für Schritt

### 1. Volle Auflösung abtasten

**Nicht verkleinern.** ffmpeg mittelt dabei über Pixelblöcke, und kleine
kräftige Details verschmelzen mit ihrer Umgebung. Gemessen an
„Die Gedanken ..." (hellblau, goldgelb, winzige rote Kameralinsen):

| Abtastung | buntestes Pixel | Buntheit | rote Pixel |
|---|---|---|---|
| 64×64 | `#89552a` | 0,090 | **0** |
| 256×256 | `#d76c1a` | 0,159 | 27 |
| **voll (1254²)** | `#f9383d` | **0,227** | **1254** |

Kosten: rund 280 Sekunden für alle 248 Cover. Speicher wird über
typisierte Felder gehalten, Objekte je Pixel wären bei 1,5 Millionen
Pixeln nicht tragbar.

### 2. Extreme ausschließen — mit ABSOLUTEN Grenzen

OKLab L zwischen 0,10 und 0,95. Dort, wo es fast schwarz oder fast weiß
ist, lässt sich kein Farbton ablesen.

**Nicht der Interquartilbereich.** Bei einem dunklen Cover ist dessen
mittlere Hälfte selbst das Beinahe-Schwarz: Bei „Doppio passo" lag sie
zwischen L 0,073 und 0,104, und von 59 kräftigen Pixeln im Bild lag dort
**kein einziger**. Man sucht dann die buntesten Farben genau dort, wo es
keine gibt.

### 3. Farbton-Histogramm, Auswahl nach Spitzenbuntheit

180 Fächer à 2°. Je Fach werden zwei Größen geführt: die Masse (Fläche,
gewichtet mit Buntheit hoch 1,4) und die **Spitzenbuntheit**.

**Ausgewählt wird nach Spitzenbuntheit, nicht nach Masse.** Nach Masse
gewinnt bei einem Regenbogen-Cover zweimal das Rot, weil Rot die größte
Fläche hat — Grün, Gelb und Cyan kommen nie vor.

### 4. Trennschärfe aus dem Bild ableiten

Gesucht wird der kürzeste Bogen, der 80 % des farbigen Materials enthält.
Die Trennschärfe folgt daraus, begrenzt auf 6° bis 40°.

Eine feste Zahl unterstellt, dass ein Bild über den Farbkreis streut.
„Doppio passo" hat **82,6 % seines farbigen Materials in einem einzigen
10-Grad-Sektor** — mit 40° Mindestabstand findet man dort genau einen Ton.

### 5. Zusätzlich Farbabstand in OKLab prüfen

Mindestens **0,12** zwischen den tatsächlichen Farben. Zwei Töne können
sechs Grad auseinanderliegen und trotzdem dieselbe Farbe sein.

### 6. Vertreter: ein echtes Pixel

Je Ton das **bunteste tatsächlich vorkommende Pixel** dieses Tonbereichs.
Kein Mittelwert — der ergibt über eine breite Gruppe immer einen matten
Braun- oder Grauton, den es im Bild nicht gibt.

### 7. Anteile über echte Zuordnung

Jedes farbige Pixel gehört zu **genau einem** Ton, dem nächstgelegenen.
Fenster fester Breite können das nicht: Liegen zwei Töne sechs Grad
auseinander, überlappen sich ihre Fenster, und die Anteile summieren sich
auf über 100 %.

### 8. Rollen vergeben

**Grund** = dunkel und wenig bunt, aus dem flächengrößten Ton. Er trägt
Fläche.

**Akzent = Buntheit × Kontrast × Flächenanteil.** Alle drei sind nötig:

- Buntheit allein wählt ein dunkles Rostbraun statt eines leuchtenden
  Cyans (Pfeifenwald).
- Buntheit × Kontrast wählt bei einem rot dominierten Cover ein Grün mit
  9 % Fläche (Farben v2).
- Der Flächenanteil stellt das richtig — und ein deutlich besserer
  Kontrast wiegt eine kleinere Fläche weiterhin auf: Pfeifenwalds Cyan
  gewinnt mit 40 % Fläche und Kontrast 8,2 gegen Rostbraun mit 60 % und
  Kontrast 3,5.

**Zweitfarbe** = der **häufigste** der übrigen Töne. Nicht der zweitbeste
der Bewertung, keine konstruierte Komplementärfarbe. Der
Fortschrittsbalken zeigt damit die beiden Farben, die das Cover prägen.

### 9. Kontrast absichern

WCAG-Ziel 4,5:1 für Text, 3:1 für Akzente. Wird nachgerechnet und notfalls
über die Helligkeit nachgezogen. Bei allen 248 Covern erreicht.

---

## Selbstprüfung

`bin/farben.js` bricht beim Start ab, wenn die OKLab-Umrechnung nicht
stimmt: Weiß **muss** a = 0 und b = 0 ergeben. Grund — in der Matrix stand
einmal `0.2428592205` statt `2.4285922050`, ein verrutschtes Komma. Die
Werte sahen plausibel aus, waren aber alle falsch, und es fiel erst nach
mehreren Runden auf.

---

## Ergebnis gegen Google Palette

Erreichte Buntheit (OKLab C) der Paletten:

| Cover | Google Palette | dieses Verfahren |
|---|---|---|
| Doppio passo | 0,206 | **0,238** |
| Farben v2 | 0,136 | **0,223** |
| Pfeifenwald | 0,110 | **0,142** |

Zum Nachvollziehen: `node bin/farbvergleich.js <songId>` stellt neun
Verfahren nebeneinander und zeigt zusätzlich, wo jeder Farbton im Bild
lebt — Helligkeitsverteilung je Ton, mit Buntheit je Stufe.

---

## Ein Befund aus den Verteilungen

Caspar_Ds Regel „je kleiner etwas ist, desto heller und bunter" ist messbar
richtig — und kippt an der Spitze.

Bei „Farben v2": 117° hat **1,6 %** Fläche bei Median L **0,61**, 255° hat
**18,4 %** bei Median L **0,31**. Die kleinste Farbe ist die hellste.

Bei „Pfeifenwald", 239° Blau: 29,9 % Fläche bei Buntheit 0,03 — und 2,9 %
Fläche bei Buntheit **0,13**. Das Kleine ist viermal so bunt.

**Aber:** Bei L 0,8 und 0,9 fällt die Buntheit auf 0,03 zurück. Die
hellsten Stellen sind ausgebrannte Glanzlichter, und die sind weiß, nicht
bunt. Die Akzentfarbe ist deshalb nicht die hellste, sondern die
**bunteste** — bei diesen Covern im oberen Mittelfeld, L 0,55 bis 0,65.
