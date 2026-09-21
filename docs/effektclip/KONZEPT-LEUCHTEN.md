# Leuchten mit einem Ort im Raum — das Beleuchtungsmodell

Entstanden im Gespräch mit Caspar_D am 21.09.2026, ausgehend von einem Satz:

> „mir gefällt ehrlich gesagt der Lichtpuffer nicht … es ist tatsächlich die 2dimensionalität für
> etwas dreidimensionales"

Und, zum zweiten Teil:

> „die Teilung Lichtpuffer und Lichtorte ist auch nicht sehr vertrauenserweckend"

**Nichts davon ist gebaut.** Dieses Blatt hält den Entwurf fest, solange er klar ist.

---

## 1. Was heute wirklich dasteht

### Der Licht-Puffer

Eine zweite Leinwand in Dioramagröße, auf Schwarz. Vor dem Malen der Kette läuft ein **Fülllauf**:
Jeder Effekt mit dem Merkmal `leuchtet` malt seine Abstrahlung dort **zusätzlich additiv** hinein.
Das Ergebnis ist ein Graustufenbild mit genau einer Aussage: **wie viel Licht kommt an dieser
Stelle an.** Zweidimensional, kein Volumen. Das Medium (Nebel) liest daraus und streut:

```
Ergebnis = Bild × Durchlass  +  Farbe × (Umgebung + Streulicht × 4) × (1 − Durchlass)
```

Darum wird ein Strahl im Nebel sichtbar, gleich an welcher Stelle der Kette der Nebel hängt — es
ist ein Raum, keine Stapelung (Regel 6).

**Was er nicht ist — eine Projektion.** Caspar_D fragte, ob der Puffer „eine Projektion der
Dreidimensionalität auf eine Glasplatte vor dem Diorama" sei. Als Beschreibung der **Wirkung**
trifft es; als Beschreibung der **Entstehung** nicht, und der Unterschied ist der Kern: Eine
Projektion setzte eine räumliche Lichtverteilung voraus, die auf eine Ebene abgebildet wird — dabei
ginge die Tiefe verloren, aber sie wäre vorher da gewesen. Hier malt jede Leuchte **direkt flach**.
Die Tiefe war nie vorhanden, sie wird nicht weggeworfen.

Auch die Glasplatte trifft nicht ganz: Eine Platte wäre ein Ding an einem Ort. Der Puffer liegt
nirgends — er ist ein **Nachschlagewerk**: eine Tabelle, in der zu jeder Bildstelle eine Zahl steht,
und jeder darf fragen. Genau deshalb wirkt er unabhängig von der Reihenfolge in der Kette.

Damit ist der Mangel in einem Satz sagbar: **In der Tabelle steht nur eine Zahl je Stelle.** Stünde
dort „wie hell, aus welcher Richtung, aus welcher Tiefe", wären alle drei Befunde unten erledigt —
ohne Projektion und ohne Volumen.

### Und daneben: die Lichtorte

Der Puffer sagt **wie viel**, nicht **woher**. Für die Richtung gibt es eine zweite, getrennte
Sache: `LICHTORTE`, eine Liste von Punkten mit Gewicht. Vier Leuchten melden dort ihren Ursprung —
Scheinwerfer, Laser, Feuer, Lichtstrahlen. Das Stroboskop meldet bewusst nichts, weil es von
überall leuchtet.

**Genau ein Effekt liest die Liste: das Streiflicht.** Und was es bekommt, ist `lichtOrtMittel()` —
der **gewichtete Schwerpunkt aller Lampen, ein einziger Wert für das ganze Bild.**

---

## 2. Die drei Befunde

### a) Das Licht ist das einzige, das die Tiefe ignoriert

Seit dem Diorama-Umbau liegt die Tiefenkarte **deckungsgleich** auf dem Diorama. Seither nutzen sie
alle: die Parallaxe marschiert darin, die Masken schneiden danach, die Partikel stehen in ihren
Bändern, der Schlagschatten des Streiflichts marschiert vierzehn Schritte hindurch. Nur der
Licht-Puffer kennt sie nicht. Eine Lampe hinter einer Figur leuchtet ihr mitten durch den Rücken.

**Genauigkeit der Begriffe:** Das Diorama ist kein Körper, sondern ein **Relief** — eine Fläche mit
einem Tiefenwert je Bildpunkt. Hinter einem Objekt ist nichts. Das erlaubt Verdeckung, Neigung,
Silhouetten, Säume und Gegenlicht; es erlaubt kein Licht um eine Ecke, keine sichtbare Lampe im
Raum und keinen volumetrischen Strahl.

### b) Ein globaler Lichtort ist bei mehreren Leuchten falsch

Zwei Scheinwerfer links und rechts ergeben einen Lichtort **in der Mitte, wo keine Lampe steht**.
Das Streiflicht rechnet dann mit einer Leuchte, die es nicht gibt, und nichts im Bild sagt es.

### c) Die Richtung einer gerichteten Quelle existiert gar nicht als Größe

Hier ist der eigentliche Kern, und er betrifft **alle** gerichteten Leuchten. Caspar_D:

> „der Laser genauso, der Laserfächer, das Laserarray, alles muß ja aus einer Richtung kommen"

Zwei Richtungen sind zu unterscheiden:

| | was es ist | woraus es folgt |
|---|---|---|
| **Einfallsrichtung** | Woher kommt das Licht, das an *diesem* Bildpunkt ankommt? | aus dem **Ort** der Lampe — ein Punkt genügt |
| **Ausrichtung** | Wohin zeigt der Kegel, der Fächer, das Raster? | braucht **zwei** Punkte |

Die Ausrichtung ist heute **keine Zahl, sondern ein Malergebnis**. Der Scheinwerfer malt eine Form
(„Kreis, Ellipse mit Gefälle oder Kegel von außen"), der Laser malt einen Fächer. Man kann die
Richtung nicht abfragen, nicht weitergeben und nicht mit der Tiefe verrechnen — es gibt sie nicht.

**Die Krücken, an denen man es ablesen kann:**

| Regler | was er in Wahrheit ersetzt |
|---|---|
| Scheinwerfer: `Bauart` (Kreis / Ellipse mit Gefälle / Kegel von außen) | wie ein Kegel auf eine Fläche trifft — also die Richtung |
| Laser: `Ursprung X`, `Ursprung Y` | der Ort — in der Fläche, **ohne Tiefe** |
| Laser: `Neigung (0 Wand, 1 Boden)` | auf welche Fläche der Fächer trifft |
| Laser: `Drehen` | die Rotation dieser Ebene |
| Laser: `Aufsetzen (Tiefenkarte)` | dass die Punkte auf dem Relief landen sollen |
| Streiflicht: `Einfall` (−1 … +1) | die **dritte Achse der Lampe**, nachgereicht an einem anderen Effekt |

`Neigung (0 Wand, 1 Boden)` ist der verräterischste: In einem Relief gibt es weder Wand noch Boden,
sondern eine Karte. Wo der Fächer auftrifft und wie schräg, **steht bereits im Bild** — der Regler
lässt den Nutzer von Hand raten, was die Karte weiß. Das ist die Hausregel auf den Kopf gestellt:
*Was die Software ausrechnen kann, wird kein Regler.*

Und `Einfall` am Streiflicht bedeutet: **Der Ort einer Lampe ist auf zwei Effektkarten verteilt.**
x/y steht am Scheinwerfer, z steht am Streiflicht.

---

## 3. Das Modell

**Eine Leuchte ist ein Ort im Raum, ein Ziel und eine Öffnung.** Alles andere folgt:

| | folgt aus |
|---|---|
| die Achse | Ort und Ziel |
| der Fleck auf dem Relief | **ausgerechnet** — rund auf einer Wand, verzerrt auf dem Boden, angeschmiegt an das Motiv |
| die Einfallsrichtung je Bildpunkt | Ort minus Bildpunkt — geschenkt für Streiflicht und Nebel |
| Verdeckung und Gegenlicht | Tiefenvergleich: liegt der Bildpunkt vor oder hinter der Lampe |

| z der Lampe gegen die Karte an (x,y) | |
|---|---|
| **näher** | Lampe steht vor dem Motiv — beleuchtet es von vorn |
| **ferner** | Lampe steht dahinter, verdeckt — Gegenlicht, leuchtende Säume |

Die Lampe selbst bleibt unsichtbar; sie ist eine Rechengröße, kein Gegenstand. Für Silhouetten und
Säume reicht das vollständig.

**Was von selbst wegfiele:** `Neigung`, `Aufsetzen`, `Bauart` als Formauswahl, der `Einfall` am
Streiflicht, `LICHTORTE` samt seinem Mittelwert.

**Scheinwerfer, Laser und Lichtstrahlen sind dasselbe Ding** — eine Leuchte mit Ort, Ziel und
Öffnung. Was sie unterscheidet, ist nur die Form des Bündels: ein Kegel, ein Fächer, ein Raster.
Heute ist jede eine eigene Malroutine mit eigenen Krücken für dieselbe fehlende Geometrie.

---

## 4. Der Weg — Neubau neben dem Alten

Caspar_D, 21.09.2026:

> „ich würde es so wie bei ken burns machen. Ich würde Scheinwerfer und Laser erstmal gar nicht
> anfassen und erstmal einen gerichteten Scheinwerfer oder einen gerichteten Laser als Effekt
> implementieren, dem genau dieses Beleuchtungsmodell zugrundeliegt — und wenn das funktioniert,
> die alten Scheinwerfer rauswerfen und die gerichteten neu benennen, mit den alten Namen."

Das ist die Hausregel *Neubau neben dem Alten*: eigener Name, keine Übersetzung, das Alte fällt
erst, wenn das Neue gewonnen hat. Bei Ken Burns hat sie getragen — die neue Fahrt lief neben der
alten, bis Caspar_D sagte: *„schmeiss die alte Fahrt schon raus, die kann ja nix."*

**Damit bleibt jedes gespeicherte Rezept unberührt, ohne Beweisführung.**

### Die Rückwärtskompatibilität ist aufgehoben — und das ist der Punkt

Caspar_D, 21.09.2026, zuerst:

> „damit die Rezepte mit Scheinwerfer und Laser immer noch auf einen Effekt zugreifen können, der
> unter anderem auch das alte noch kann."

Und dann, nachdem die Folge benannt war:

> „wenn uns die Rückwärtskompatibilität beschränkt in der Radikalität des Ansatzes, dann will ich
> sie nicht."

**Das ist eine Entscheidung über das Modell, nicht über die Daten.** Müsste der neue Effekt
`Bauart: Ellipse mit Gefälle` als Sonderfall nachbilden, würde die alte Formauswahl im neuen Effekt
**weiterleben — nur versteckt, als Umrechnung**. Die Krücken wären dann nicht weg, sondern
eingebaut. Ohne die Auflage kommt der Fleck rein aus der Geometrie, und `Bauart`, `Neigung`,
`Aufsetzen` und `Einfall` verschwinden wirklich.

**Was es kostet:** 13 Rezepte im Archiv verlieren ihre Leuchte, wenn der alte Effekt fällt —
6 mit `licht`, 3 mit `laser`, 4 mit `strahlen`. Es sind Caspar_Ds eigene, und er macht sie neu.

**Hausregel 12 bleibt gewahrt**, denn ihr Kern ist das Wort *stillschweigend*: „Alte Ablagen werden
übersetzt, **nie stillschweigend** anders gelesen." Bei der alten „Fahrt" hat Caspar_D den Weg
selbst vorgegeben — *„das Studio sagt maximal Bescheid, dass der tote Effekt nicht mehr da ist und
aus dem Rezept gelöscht wird."* Derselbe Weg trägt hier. Verboten ist, dass ein Rezept anders
aussieht und niemand es merkt; erlaubt ist, dass etwas wegfällt und das Studio es sagt.

**Warum jetzt und nicht später:** Solange nur Caspar_Ds eigene Rezepte betroffen sind, ist die
Entscheidung folgenlos. Sobald KlangTresor mit fremden Beständen läuft — ein Release, ein zweiter
Nutzer —, wäre dieselbe Entscheidung teuer. Der Zeitpunkt ist Teil der Begründung.

### Was vor der ersten Zeile entschieden sein muss

**Wie spricht die neue Leuchte mit Nebel und Streiflicht?** Beide lesen heute den flachen Puffer und
den gemittelten Lichtort. Eine Leuchte, die ihren Ort im Raum kennt, hat niemanden, der danach
fragt. Drei Zuschnitte stehen zur Wahl:

1. **Die neue Leuchte trägt sich zusätzlich in die alte Liste ein** und wirkt vorerst wie bisher.
   Das Neue steht wirklich neben dem Alten, nichts wird angefasst — aber das Gegenlicht funktioniert
   noch nicht, also fehlt gerade der Beweis, um den es geht.
2. **`LICHTORTE` wird eine Liste von Leuchten** mit vollem Ort; das Streiflicht nimmt den echten Ort
   statt des Mittelwerts, solange genau eine Leuchte da ist. Kleiner Eingriff ins Alte, dafür der
   erste sichtbare Gewinn.
3. **Der Puffer bekommt seine Kanäle gleich mit** — Menge, Richtung je Bildpunkt, Tiefe. Sauberste
   Form, größter erster Schritt.

### Offen, weil es Caspar_D gehört

- **Welche Leuchte zuerst?** Empfehlung: der **Scheinwerfer**. Der Laser ist geometrisch reiner —
  eine Gerade, mehr braucht er nicht —, aber das Ziel ist Gegenlicht mit Säumen, und das hängt am
  Zusammenspiel Leuchte ↔ Streiflicht. Beim Scheinwerfer ist der Gewinn außerdem sofort sichtbar.
- **Wie wird die Lampe bedient?** Caspar_Ds erster Vorschlag war ein Würfel: *„das Diorama hat
  Seitenflächen von 3x3 … 27 Innenpunkte, wo man eine Lichtquelle hinstellen könnte, dann mit Klick
  auf ein Quadrat die Richtung festlegen."* Die Alternative wäre die Geste des Glockenstuhls — zwei
  Marken auf der Bühne, je mit einer Tiefe. Der Würfel ist anschaulicher, die Marken sind feiner und
  liegen im Motiv.
- **Woher nimmt die Lampe ihre Tiefe?** Gesetzt, oder aus der Karte an ihrem Ort gelesen
  („die Lampe steht dort, wo das Motiv dort ist")?
- **Was ohne Tiefenkarte?** Der neue Effekt braucht einen ehrlichen Rückfall, der sagt, was fehlt —
  wie die Tiefenebene ihn hat.
- **Der Name.** *Neubau neben dem Alten* verlangt einen eigenen, keine Nummerierung.

### Was der Umbau kostet

Größer als das Diorama. Das Diorama hat die **Reihenfolge** des Malwegs geändert und die Effekte
selbst in Ruhe gelassen. Hier würden am Ende vier Leuchten und zwei Medien neu geschrieben. Der Weg
über den Neubau macht das beherrschbar, weil jeder Schritt für sich sichtbar ist — aber die Summe
bleibt groß, und sie sollte nicht als Nebensache geplant werden.

---

## 5. Was das Relief nicht hergibt

Damit die Arbeit nicht gegen eine Wand läuft, die erst spät sichtbar wird:

| | warum es am Relief scheitert |
|---|---|
| **Schlagschatten bei Gegenlicht** | Der Marsch des Streiflichts läuft im Bildraum Richtung Licht. Steht die Lampe hinter dem Motiv, marschiert er ins Verdeckte — dort steht keine Information. Silhouetten gehen, der Schatten nach vorn nicht. |
| **Ein sichtbarer Lichtkegel im Raum** | ein Strahl, der sich durch die Tiefe zieht und an einem Objekt bricht — der Nebel kann ihn nur flächig |
| **Licht um eine Ecke** | braucht Rückseiten, die es nicht gibt |
| **Objekte, die sich gegenseitig anleuchten** | dasselbe |
| **Flächenlichter** (Fenster, Himmel) | haben keine Punktrichtung, sondern eine Ausdehnung |

Der erste ist der einzige, der in der Richtung liegt, in die gefragt wurde: Gegenlicht liefert die
Säume, aber keinen Schatten, den das Motiv nach vorn wirft.
