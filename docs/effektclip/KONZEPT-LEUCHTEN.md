# Leuchten mit einem Ort im Raum — das Beleuchtungsmodell

Entstanden im Gespräch mit Caspar_D am 21.09.2026, ausgehend von einem Satz:

> „mir gefällt ehrlich gesagt der Lichtpuffer nicht … es ist tatsächlich die 2dimensionalität für
> etwas dreidimensionales"

Und, zum zweiten Teil:

> „die Teilung Lichtpuffer und Lichtorte ist auch nicht sehr vertrauenserweckend"

**Stand 21.09.2026: die ersten beiden Etappen sind gebaut** (`lichtRaum`, Herkunfts-Puffer) — siehe
Abschnitt 6. Alles Übrige ist Entwurf.

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

## 3a. Das Verfahren — und es ist nicht neu

Caspar_D, 21.09.2026: *„wie machen es denn die Raytracer, nichts anderes machen wir hier doch"* —
und dazu die berechtigte Rüge: *„da hättest du aber schon eher mal in die Spieleecke schauen
können."* Stand der Technik klären gehört vor die Arbeit (Hausregel 3).

### Warum kein klassisches Raytracing

Ein Raytracer schießt von jedem getroffenen Punkt einen **Schattenstrahl** zur Lampe. Der muss
durch die Szene reisen können — auch dorthin, wo die Kamera nicht hinsieht. Wir haben ein Relief,
keine Szene: hinter einem Objekt ist nichts. Dasselbe gilt für **Shadow Maps**, die aus Lampensicht
gerendert werden; dafür bräuchte es eine Geometrie, die es nicht gibt.

### Was die Echtzeitgrafik für genau diesen Fall entwickelt hat

**Deferred Shading.** Die Szene wird erst in mehrere Puffer gemalt — Farbe, Tiefe, Normale — und
**danach im Bildraum beleuchtet**. Der Sammelpuffer heißt dort **G-Buffer**.

**Screen-Space-Verfahren.** Verdeckung, Spiegelung und Schatten werden allein aus der Tiefenkarte
gerechnet, per Marsch entlang eines Strahls im Bildraum.

**Und beides läuft hier bereits:**

| im Haus | in der Fachsprache |
|---|---|
| Schlagschatten des Streiflichts — „ein Marsch im Bildraum Richtung Licht, vierzehn Schritte" | Screen Space Shadows |
| Die Parallaxe — „Verschiebung je Bildpunkt, rückwärts gesucht, erster Treffer ist die vorderste Fläche" | Parallax Occlusion Mapping |
| Die Normale aus dem Tiefengradienten im Streiflicht | Normal from depth |

Das Verfahren ist im Haus, läuft an zwei Stellen — und beim Licht wird es nicht benutzt.

### Die Wahl: Deferred, weil wir es schon sind

**Der Licht-Puffer IST bereits ein G-Buffer, nur ein unvollständiger.** Nebel und Streiflicht fragen
*nachträglich* „wie hell ist es hier", ohne zu wissen, welche Leuchten in der Kette hängen — das ist
die Definition von Deferred Lighting. Es geht also nicht um einen Architekturwechsel, sondern um die
**Vervollständigung** einer Architektur, die schon so gebaut ist.

Forward Lighting — jede Leuchte rechnet direkt beim Beleuchten — hieße, dass der Nebel die
Leuchtenliste kennt und durchläuft. Das wäre der Umbau, nicht dies.

### Zwei Puffer, zwei Namen

| | trägt | Kanäle |
|---|---|---|
| **Lichtmenge** (heute `olicht`) | wie viel Licht kommt hier an, in welcher Farbe | RGB, wie bisher |
| **Lichtherkunft** (neu) | woher und aus welcher Tiefe | siehe unten |

### Der Kniff: nicht die Richtung speichern, sondern den Ort

Eine Richtung kann negativ sein, und in einem additiv beschriebenen Puffer gibt es keine negativen
Zahlen. Gespeichert wird deshalb **der helligkeitsgewichtete Lampenort** — der liegt immer zwischen
0 und 1:

| Kanal | was jede Leuchte hineinaddiert |
|---|---|
| **R** | x-Ort der Lampe × Helligkeit |
| **G** | y-Ort der Lampe × Helligkeit |
| **B** | z-Ort der Lampe × Helligkeit |
| **A** | Helligkeit |

Beim Lesen: `Lampenort = RGB / A`, und die Einfallsrichtung ist `normalize(Lampenort − Bildpunkt)`.
Alles additiv, alles positiv, alles in einem gewöhnlichen Canvas — kein Float-Target, keine
Erweiterung, die WebGL 1 nicht hat.

**Die Pointe: Das ist exakt, was `lichtOrtMittel()` heute schon rechnet** — ein
helligkeitsgewichteter Lampenort, nur **einmal für das ganze Bild** statt je Bildpunkt. Die Formel
muss nicht erfunden, sondern dorthin verschoben werden, wo sie hingehört. Damit ist auch Befund (b)
erledigt: zwei Scheinwerfer links und rechts ergeben an jeder Stelle die Lampe, die dort wirklich
wirkt, statt einer erfundenen in der Mitte.

**Die Genauigkeit reicht:** 8 Bit auf 0…1 sind rund drei Bildpunkte Ortsgenauigkeit bei 792 Breite.
Für eine Lichtrichtung weit mehr als nötig.

### Die Verdeckung

Nichts Neues nötig: der **Screen-Space-Marsch entlang des Lichtstrahls in der Tiefenkarte**, wie ihn
der Schlagschatten des Streiflichts seit dem 14.09.2026 fährt — vierzehn Schritte, mit den zwei
Vorkehrungen gegen die geschätzte Karte (erst ab dem dritten Schritt, weil eine monokulare Karte
daneben rauscht; weich abgestuft, weil sie keine harten Kanten hergibt).

### Was das Verfahren nicht kann — die Grenze des Bildraums

Screen Space heißt: **was nicht im Bild ist, existiert nicht.** Der Marsch findet keine Verdeckung
durch etwas, das außerhalb des Ausschnitts liegt oder selbst verdeckt ist. In der Spielegrafik ist
das die bekannte Schwäche dieser Verfahren, und die übliche Antwort ist dieselbe wie hier: **weich
zurückfallen, nicht schwarz.** Das steht als Vorkehrung schon im Streiflicht.

### Kosten

Ein zusätzlicher Vollbildgang je Bild, und nur dann, wenn eine Leuchte in der Kette hängt — dieselbe
Bedingung, unter der heute der Licht-Puffer gefüllt wird. Die Leuchten schreiben zwei Puffer statt
einen; der Marsch läuft nur dort, wo Licht ankommt. Gemessen wird vor dem Einbau, mit Zaunmarke und
Grafikkennung.

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

---

## 5a. Migrationsplan: alle Leuchten auf den Lichtpuffer (22.09.2026, gegen Morgen)

Caspar_D: *„wir wollten alle Lichteffekte so nach und nach auf den Lichtpuffer migrieren."*
Bestandsaufnahme, wie WEIT jede Leuchte schon ist — nicht nur ob sie schreibt, sondern wie stark
und wie sauber der Mechanismus ist.

### Der Mechanismus ist strukturell einheitlich

`leuchteInPuffer(e,cx,t,W,H)` unterscheidet zwei Wege:
- **GL-Effekte** (`lichtRaum`, `laserRaum`, `strahlenRaum`): über `GL.run(...)`, die Stärke wird
  von AUSSEN als `globalAlpha` beim Compositen aufgeprägt.
- **Canvas-Effekte** (`licht`, `laser`, `strahlen`, `feuer`, `strobe`): laufen durch dieselbe
  zentrale `malen()`-Funktion wie in der normalen Kette. Diese Funktion setzt
  `LICHTMAL?'lighter':(VMODE[e.verr]||'source-over')` bereits an ihrem Kopf — **jeder Effekt, der
  durch sie geroutet wird, ist damit automatisch additiv im Puffer**, ohne dass er selbst etwas
  dafür tun muss. Nur `licht` hat eine eigene Spezialfunktion (`lichtMalen`, wegen der Blende) und
  prüft `LICHTMAL` darin selbst — korrekt.

**Das heißt: Die Hürde für einen neuen Leuchter ist nicht der Mechanismus** (der ist da und
funktioniert für jeden, der durch `malen()` läuft) — **sie ist die Markierung `leuchtet:true`
UND ein Malvorgang, der bei Stärke > 0 tatsächlich etwas Sichtbares hinterlässt, das auch als
Schein taugt** (nicht nur ein harter, kleiner Farbfleck).

### Gemessen: Wirkung auf den Nebel, Vorgabewerte, Testbild „Stumm"

Stärke an/aus, mit Filmnebel (Vorgabe), Antrieb wo vorhanden auf „stetig" für einen fairen
Vergleich (Puls würde sonst die Messung verfälschen, wie gestern Nacht beim Laser gelernt):

| Effekt | mittlere Bildänderung | Fläche (Punkte >8) | größter Wert |
|---|---|---|---|
| licht (Scheinwerfer, alt) | 25,09 | 56.502 | 224 |
| laser (Laserstrahl, alt) | 6,27 | 26.707 | 200 |
| strahlen (Lichtstrahlen, alt) | 41,32 | 215.174 | 130 |
| feuer | 54,65 | 265.874 | 255 |
| lichtRaum (Scheinwerfer mit Tiefe) | 17,35 | 55.674 | 242 |
| laserRaum (Laser mit Tiefe) | 3,50 | 20.663 | 234 |
| strahlenRaum (Lichtstrahlen mit Tiefe) | 10,46 | 47.727 | 237 |
| strobe (Stroboskop, im Blitzmoment gemessen) | 48,59 | 274.752 | 228 |

**Strobe brauchte eine zweite Messung**: mit Antrieb „stetig" (meine erste, „faire"
Vergleichsmethode) malt Stroboskop **gar nichts** — das steht explizit im Code
(`if(q==='stetig') return;`), ein Blitzeffekt ohne Antrieb ist sinnlos. Erst mit seinem eigenen
Antrieb (Hz), im stärksten Moment des Pulses gemessen, zeigt sich seine wahre Stärke — dann ist
es der zweitstärkste Leuchter im Feld, weil es das ganze Bild trifft.

**Die drei „mit Tiefe"-Geräte liegen alle unter ihren alten Pendants** — `lichtRaum` bei 69 % von
`licht`, `laserRaum` bei 56 % von `laser`, `strahlenRaum` bei nur 25 % von `strahlen`. Letzteres
ist der schon bekannte, noch nicht vollständig gelöste Befund von heute Nacht (Vorgabe angehoben,
Restschwäche in der Marsch-Normierung offen — siehe Übergabe, Abschnitt 6f).

Feuer schreibt am kräftigsten — durch den eigens gebauten „Schein"-Mechanismus (Caspar_D,
14.09.2026: „Feuer sollte einen weichen Schein in den Puffer malen"), der einmal gemalt wird und
dadurch von selbst in Bild UND Puffer landet. Vorgabe `schein:0,35`, nicht 0 — trägt also bei
Standardwerten bei.

### Kandidaten für die nächste Migration, nach Aufwand geordnet (Vermutung, nicht geprüft)

1. **Flammen (Rauschen)** — `art:'gl'`, kein `leuchtet`. Müsste wie `lichtRaum` behandelt werden:
   `leuchtet:true` setzen und in `leuchteInPuffer` den GL-Zweig durchlaufen — der ruft `GL.run`
   generisch auf, das sollte für JEDEN `art:'gl'`-Effekt automatisch funktionieren, sobald die
   Markierung da ist. **Vermutlich der einfachste Fall**, weil kein neuer Malweg nötig ist, nur
   die Markierung fehlt. Zu prüfen: ob der Flammen-Shader bei `u_modus`/`u_inPuffer` überhaupt
   auf irgendetwas reagieren müsste, oder ob er einfach unverändert in den Puffer rendert.
2. **Kaustik (Lichtnetz)** — ebenfalls `art:'gl'`, `verrFrei:true`, kein `leuchtet`. Gleiches
   Muster wie Flammen vermutlich.
3. **Partikel als Leuchten** (Glühwürmchen, Glitzer, Funken, Bokeh, Sternschnuppen) — schwieriger,
   weil `leuchtet` hier wie `medium` eine **Frage an die Art** sein müsste
   (`e=>['gluehwuermchen','glitzer','funken','bokeh','sternschnuppen'].includes(e.art)`), nicht
   eine Marke am Typ `partikel` — sonst leuchtet auch Schnee und Staub. Das Muster dafür steht
   schon im Haus (`EFFEKTE.partikel.medium = e=>e.art==='schwaden'`), nur für `leuchtet` noch
   nicht gebaut.

**Reihenfolge-Empfehlung:** Flammen zuerst (kleinster Schritt, reine Markierung), dann Kaustik
(gleiches Muster), dann die Partikel-Frage (eigener Bau, weil pro Art zu entscheiden). Das folgt
der Hausregel „ein Effekt nach dem anderen" — noch nicht gebaut, nur vorbereitet.

## 6. Was gebaut ist (21.09.2026)

### Etappe 1 — der Effekt „Scheinwerfer mit Tiefe" (`lichtRaum`)

Eine Lampe mit Ort, Ziel und Öffnungswinkel, alle drei mit Tiefe. Der Fleck wird **ausgerechnet**:
Der Kegelquerschnitt am Ziel erscheint als Ellipse, quer zur Achse mit vollem Radius, längs mit
`|a_z|` gestaucht, gekippt in Achsenrichtung. Steht die Lampe frontal, wird ein Kreis daraus; steht
sie schräg, eine Ellipse mit Gefälle — **ohne dass jemand eine Bauart wählt.**

**Die eine Setzung, und sie steht als solche im Code:** das Diorama ist so tief wie breit. Die
Tiefenkarte hat keine Eichung, also gibt es keinen Maßstab, in dem sich ein Öffnungswinkel
ausdrücken ließe. Wird die Karte je geeicht, tritt der gemessene Wert an genau diese eine Stelle
(`LR_TIEFE_JE_BREITE`).

**Die Verdeckung** ist ein Zahlenvergleich, kein Marsch: Was näher steht als die Lampe, bekommt ihr
Licht nicht. Steht sie hinter einer Figur, bleibt die Figur dunkel und die Silhouette entsteht von
selbst.

**Zwei Dinge, die Caspar_D am Bild gefunden hat und die nachgezogen wurden:** Der Effekt lag bei
`screen` statt `abwedeln`, weil die Liste in Zeile 27507 alle Leuchten überschreibt und er nicht
darin stand — der Fleck lag als Farbe über dem Bild, statt aufzuhellen, was da ist (Regel 5). Und
er hatte kein Antriebspult, weil auch das je Effekt zugewiesen wird; jetzt pulst er im Takt wie die
anderen Leuchten.

### Etappe 2 — der Herkunfts-Puffer

Ein zweiter Puffer neben dem Licht-Puffer. Er trägt je Bildpunkt den **helligkeitsgewichteten
Lampenort**: R, G, B = Ort × Helligkeit, A = Helligkeit; beim Lesen `RGB/A`. x und y sind verschoben
gespeichert (`(v+0,5)/2`), damit eine Lampe außerhalb des Bildes stehen darf.

Gefüllt wird er in einem **zweiten Fülllauf**, der nur Leuchten mit Raumort malt — derselbe Maler,
dieselbe Geometrie, dieselbe Verdeckung, nur die Ortsfarbe statt der Lichtfarbe. Der alte
Scheinwerfer, der Laser und die Lichtstrahlen kennen keine Tiefe und bleiben draußen; wer sie
benutzt, bekommt weiter den alten Weg. `HERKUNFT_DA` sagt den Lesern, welche Wahrheit gilt.

**Das Streiflicht liest daraus**, über Textur 4. Und damit ist der Regler `Einfall` an dieser Stelle
überflüssig geworden: Die dritte Achse ist **gemessen statt gestellt** — steht die Lampe näher als
der Bildpunkt, fällt Licht von vorn ein, steht sie ferner, von hinten. Ist der Puffer leer, gilt der
alte Weg mit dem global gemittelten Ort; der Übergang ist absichtlich sichtbar.

**Der Beweis, am Bild:** Dasselbe Rezept (Lampe + Streiflicht), nur die Lampentiefe von 0,12 auf
0,98 geändert — einmal Gegenlicht mit Saum auf der Figur, einmal das modellierte Relief, bei dem
die Rippen des Mantels hervortreten. Kein `Einfall`-Regler angefasst. Die Prüffälle heißen
`lichtraum-saeume` und `lichtraum-saeume-vorn`.

### Die Grenze, die im Code steht

Bei mehreren sehr hellen Leuchten läuft die Summe der Helligkeiten über 1, Canvas klemmt auf 255,
und der gerechnete Ort wandert zur helleren Lampe. Bei ein bis zwei Leuchten unsichtbar, bei fünf
gleich hellen ein Fehler. Wer das braucht, braucht einen Float-Puffer und damit WebGL 2.

### Auf Videos

`tiefeUrl` liefert für Bewegtbild ausdrücklich `null`. Kegelgeometrie, Hotspot, Kante, Farbe und
Antrieb funktionieren; **Verdeckung, Säume und Gegenlicht fallen aus**, weil sie das Relief
brauchen. Der Regler „Verdeckung" trägt `brauchtKarte` und sagt es.

Caspar_D, 21.09.2026: *„fürs Video wird gar nichts gemacht, bis die Tiefenkarte da ist, und dann
schauen wir, ob wir etwas kompensieren müssen, was vielleicht nicht so geht, wie wir uns das
dachten."* Also **kein Ersatzweg** — die Tiefenspur für Bewegtbilder löst es, oder es bleibt, wie
es ist.

### Etappe 3 — der Kegel trifft das Relief

Caspar_D, 21.09.2026: *„der Strahl dreht sich um die Lampe — das ist natürlich Unsinn, die Lampe
kippt und projiziert den Strahl auf die Raumbegrenzungen. Sie kippt in alle Richtungen wie ein
Kugelgelenk oder zwei Kippgelenke."*

Die Korrektur war mehr als Wortwahl. **Bis dahin rechnete der Effekt den Kegelquerschnitt in der
Zieltiefe** und projizierte diesen Kreis auf die Bildebene — die Ellipse entstand aus dem Winkel
zwischen Achse und *Bildebene*, und das Relief wirkte nur als Verdeckung, nicht als
Projektionsfläche. Auf einem Boden, der nach hinten wegkippt, blieb der Fleck eine saubere Ellipse.

Jetzt wird **je Bildpunkt gefragt, ob er im Kegel liegt**: Sein Ort im Raum steht in der
Tiefenkarte, der Winkel zur Kegelachse entscheidet, und Fleck, Verzerrung und Abfall fallen
gemeinsam heraus. Der Lichtkegel läuft über den Boden nach hinten aus, wie er es soll.

**Damit wurde der Effekt vom Canvas-Maler zum Shader** — die Frage „liegt dieser Punkt im Kegel"
lässt sich nicht auf einer fremden Leinwand beantworten. Zwei Folgen:

- **Der Fülllauf des Licht-Puffers lernt Shader.** Er rief bisher nur `malen()`. Jetzt geht beides
  über `leuchteInPuffer`, damit Licht- und Herkunftslauf nicht auseinanderlaufen. Die Stärke muss
  dort selbst angewandt werden: in der Kette legt sie die Verrechnung auf, im Fülllauf gibt es
  keine Kette.
- **`glZusatz` bekommt die Zeit.** Der Schwenk wird an einer Stelle gerechnet und als Uniform
  weitergereicht; die Kippung im Shader zu wiederholen wäre eine zweite Wahrheit über dieselbe
  Bewegung.

**Ohne Tiefenkarte liegt im Shader alles in Zieltiefe** — die Szene ist dann flach, und es kommt
genau die Ellipse von früher heraus. Ein Weg, zwei Fälle, kein zweiter Maler. Deshalb konnten
`lrRaum`, `lrKegel`, `lrSchwenkZiel` und `herkKod` ersatzlos fallen; die Ellipsenrechnung war eine
Näherung, die niemand mehr braucht.

**Isotrope Koordinaten**, weil Winkel gleiche Maße auf allen Achsen brauchen: x in Bildbreiten, y
mal dem Seitenverhältnis, z eine Bildbreite tief. In uv-Koordinaten wäre ein Kegel auf einem
hochkanten Bild eine Ellipse, ohne dass jemand gekippt hätte.

Sieben Prüffälle, Naht überall `gleich = 0,00`.

### Eine Frage, die entschieden wurde, ohne etwas zu bauen

Caspar_D: *„ich glaube, ein Scheinwerfer ist ein Zwischending zwischen abwedeln und screen, sollte
man einen Regler einfügen, der die Balance zwischen beiden einstellt?"*

Physikalisch sind das zwei getrennte Vorgänge: **Reflexion** an einer Oberfläche ist multiplikativ
(Schwarz bleibt schwarz → abwedeln), **Einstreuung** an Partikeln in der Luft ist additiv (kommt
direkt zur Kamera → screen). Ein Regler dafür hieße also nicht „Balance", sondern *wie viel Dunst
in der Luft ist*.

**Entschieden: die Einstreuung bleibt beim Medium.** Der Nebel liest den Licht-Puffer und streut —
deshalb wird ein Strahl im Nebel sichtbar, egal wo der Nebel in der Kette hängt, und Regel 5 sagt
ausdrücklich, dass ein Strahl im Leeren unsichtbar ist. Ein Streuanteil an der Lampe wäre eine
zweite Quelle für dieselbe Sache. Wenn der Nebel künftig Lichtabfall und Phasenfunktion kann,
entsteht der sichtbare Strahl dort physikalisch richtig.

### Was es kostet — gemessen am 21.09.2026

Auf der **echten Grafikkarte** (Radeon Pro 5500 XT, 629×889), Median aus fünf Läufen. Dafür hat
`naht.mjs` einen Schalter `--gpu` bekommen, der SwiftShader weglässt: Die Softwarerasterung ist für
Bitgleichheit richtig und für Kosten die falsche Maschine.

**Wie falsch, ist selbst eine Zahl:** leeres Bild 2,4 ms gegen 43,8 ms, Blende „Punkte" 5,3 gegen
156,3, neuer Scheinwerfer 7,7 gegen 102,5 — **Faktor 13 bis 29**, und für Canvas und Shader
verschieden. Wer auf SwiftShader Kosten misst, misst ein anderes Verhältnis, nicht nur eine andere
Geschwindigkeit.

| Effekt | netto | Art |
|---|---|---|
| Linse | **10,9 ms** | Shader, ohne Tiefenkarte |
| Scheinwerfer mit Tiefe | 5,6 ms | Shader, mit Tiefenkarte |
| Streiflicht (abzüglich Lampe) | ~4,1 ms | Shader, Tiefenkarte **und** Marsch |
| Flammen | 4,3 ms | Shader, fraktales Rauschen |
| Blenden (Gitter/Punkte/Wolken) | 3,2–3,7 ms | Canvas |
| alter Scheinwerfer | 0,4 ms | Canvas |
| Antrieb | **nicht messbar** | |

**Die 5,6 ms sind der Preis eines Shader-Gangs, keine Eigenheit der Lampe** — sie liegt am unteren
Ende des Feldes. Der Grund ist plausibel: Sie liest die Quelltextur gar nicht, sie gibt nur ihren
Kegel aus; die Linse liest sie verzerrt, also mit schlechter Cache-Lokalität.

**Sie skaliert unterlinear:** eine Lampe 5,6 · zwei 8,1 · drei 11,6. Mit Medium in der Kette 13,3,
denn dann läuft der Fülllauf und die Lampe malt zweimal (Licht und Herkunft).

**Die Blenden kosten 3,2–3,7 ms, und alle drei Arten gleich viel** — obwohl „Punkte" die feinste
Zellteilung hat. Ein Filter in einer Schleife würde dort herausstechen (Regel 14); er tut es nicht.

**Die Genauigkeit, ehrlich:** Zwischen zwei Messreihen sind die Werte um 10–20 % gewandert, der
Boden von 2,40 auf 2,70 ms. Das ist Drift durch Systemlast und Wärme. Die Zahlen tragen auf ±20 %
— genug für „ist der neue Scheinwerfer ein Ausreißer?", nicht genug für „kostet Gitter mehr als
Wolken?".

**Ein Nebenbefund, der nicht hierher gehört, aber notiert sein will:** Die **Linse kostet 10,9 ms**,
ein Drittel eines 30-Hz-Bildes für einen einzigen Effekt. Das hat nie jemand gemessen.

### Laser und Lichtstrahlen — wie sie ins Modell passen (21.09.2026)

Caspar_D: *„während der Laser ja fast punktförmig das Ziel erreicht, der scanning laser einen
Strich — sind die Lichtstrahlen ja eigentlich in irgendeiner Geometrie angeordnete
Scheinwerferbündel (korrigier mich, wenn ich falsch liege)."*

Fast. Die Lichtstrahlen sind **nicht mehrere Scheinwerfer, sondern einer mit einer Maske im
Strahlengang**. Sonnenlicht durchs Fenster ist eine Quelle; die Schächte entstehen an den Sprossen.
Die Bühnentechnik nennt die Schablone **Gobo**, und das Haus hat sie längst — der alte Scheinwerfer
nennt sie *Blende* (Gitter, Streifen, Punkte, Wolken).

Damit fallen alle drei auf dieselbe Lampe zusammen:

| | Öffnung | Maske | sichtbarer Strahl |
|---|---|---|---|
| **Scheinwerfer** | weit | optional | durchs Medium |
| **Lichtstrahlen** | weit | **Gobo** | durchs Medium — daher die Schächte |
| **Laser** | sehr eng, fast eine Gerade | optional Beugungsgitter | durchs Medium |
| **Scanning-Laser** | sehr eng | — | schneller Pan, der Strich kommt vom Nachleuchten |

**Das macht die Ablösung kleiner, als sie aussieht:** keine drei Effekte, sondern eine Lampe mit
drei Einstellungen — Bündelung, Gobo, Schwenktempo.

**Eine Ausnahme, die kein Gobo ist:** Beim Laser mit **Beugungsgitter** entstehen echte
Mehrfachstrahlen aus einem Punkt, nicht ein zerschnittener Kegel. Beugung ist etwas anderes als
Abschattung.

### Der dritte Winkel: Roll

Caspar_D, am Bild des heutigen Lasers: *„die Fächerfläche steht momentan parallel zur
Diorama-Front-Scheibe."*

Richtig, und es ist dasselbe Muster wie überall hier. Ein Laserfächer ist eine **Ebene**; sie liegt
heute fest in der Bildebene. Ein echter Fächer kann beliebig im Raum stehen — kippt man ihn zur
Kamera, laufen die Strahlen in die Tiefe und erscheinen perspektivisch zusammenlaufend statt
nebeneinander.

Dafür fehlt dem Modell ein **dritter Winkel: Roll**, die Drehung um die eigene Strahlachse. Pan,
Tilt und Roll zusammen sind das Kugelgelenk. **Beim Scheinwerfer fällt Roll nicht auf**, weil ein
Kegel rotationssymmetrisch ist; beim Fächer und bei jedem Gobo ist es der entscheidende Winkel.

**Nicht am alten Laser reparieren.** Ihm fehlt dieselbe Geometrie wie dem alten Scheinwerfer —
`Neigung (0 Wand, 1 Boden)`, `Drehen` und `Aufsetzen` sind drei Krücken für eine Richtung, die es
als Größe nicht gibt. Ein Roll-Winkel dort wäre die vierte. Im neuen Modell ist es ein Winkel mehr
an einer Lampe, die ihre Achse ohnehin kennt.

### Noch offen

- ~~Der Schwenk~~ — gebaut: Pan und Tilt als Kippung der Lampe, fünf Stellungen (Steht, Pan, Tilt,
  Kreis, Acht). Die Bahn pendelt über `lpBahn`, wenn kein ganzer Umlauf in den Clip passt, und
  schließt damit von selbst.
- **Überstrahlung anzeigen.** Caspar_D: *„sollte man Regler begrenzen, sodass man keine
  Überstrahlung produziert, oder wenigstens einen Indikator einbauen, dass man jetzt den
  dynamischen Lichtbereich verlässt."* Begrenzen wäre falsch — Ausbrennen ist ein Mittel. Aber ab
  dem Punkt, wo alles geclippt ist, *scheint* ein Regler nur noch zu wirken, und das ist Regel 9.
  Vorschlag: eine Zahl in der Zeile, die erst auftaucht, wenn es passiert.
- **Der Nebel.** Aus dem Gespräch am 21.09.2026 über die vier Verfahren der Spielegrafik: Der
  Filmnebel ist **halb räumlich** — die Weglänge hängt an der Tiefe (Koschmieder, `T = exp(−3·weg)`,
  also Lambert-Beer), die **Dichte** aber nicht: die dritte Achse des Rauschens ist die Zeit. Drei
  Dinge hängen am selben Puffer und wären billig: **Lichtabfall mit der Entfernung** (heute erhellt
  eine Lampe den Nebel überall gleich), **räumliche Schwaden** (Tiefe als dritte Achse, Zeit als
  vierte — `wolke4(vec4)` existiert bereits für die Loop-Form), und eine echte **Phasenfunktion**
  statt des Mischreglers „Bündelung". Teurer wären God Rays und volumetrische Schächte mit
  Schattentest.

