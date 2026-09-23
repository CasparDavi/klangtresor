# Die Tiefenzonen der Szene — wo ein Effekt wohnt

Entstanden im Gespräch mit Caspar_D am 21.09.2026. Der Entwurf ist seiner:

> „wir setzen Tiefenzonen analog zum rot / blau Farbmodell
> Scheibe | Leere Zone | Vordergrund | Hintergrund | Hintergrundleinwand"

Und die Ratlosigkeit, die dazu gehört, ebenfalls:

> „das dumme ist halt, die Tiefenkarte ist ordinal und wir brauchen die Zonen"

**Stand 21.09.2026, abends: das Meiste ist gebaut.** Was hier als Entwurf steht, ist in die App
eingezogen; der letzte Abschnitt sagt, was noch offen ist.

Gebaut:
- Die **Zonenkarte** entsteht aus der Talsuche, sobald die Tiefenkarte da ist (`zonenTaeler`,
  Scale-Space-Modenzählung). Höchstens fünf Grenzen, also sechs Teile.
- Die **Station Tiefe** zeigt statt des Bildes das Relief, drehbar, mit dem Tiefen-Histogramm am
  rechten Bildrand. Klick setzt eine Grenze, Doppelklick nimmt sie weg, Ziehen verschiebt.
- Jeder Effekt **kreuzt seine Zonen an** (`zonenVonEffekt`, `zonenMaske`). Angekreuzt werden die
  festen Bereichsnamen, nicht die Zonen dieses Bildes — darum trägt dasselbe Rezept auf einem
  Porträt und auf einer Landschaft.
- **Effektscheibe und Effektraum** stehen in derselben Liste, ganz oben. Wer dort wohnt, wird von
  nichts verdeckt.
- Entfallen: Trennung, Weichheit der Trennung, Hintergrundfläche ab und die ganze
  Falschfarben-Maschinerie, die ihnen vorausging (244 Zeilen weniger).

**Zwei Dinge sind anders gekommen als hier zunächst beschrieben.** Sie stehen unten in Abschnitt 11.

---

## 1. Es sind zwei Probleme, nicht eines

Genau daran hing die Ratlosigkeit. Wer beide zusammen sieht, hält sie für unlösbar, weil das eine
das andere zu verbieten scheint. Getrennt ist jedes für sich gelöst:

| | Frage | Wer es löst |
|---|---|---|
| **Zuordnung** | In welcher Zone wohnt ein Effekt? | Die Bühne. Eine kleine Menge benannter Ebenen mit je einer Funktion. |
| **Grenzfindung** | Wo liegt die Grenze in *diesem* Bild? | Die Rangstatistik. Grenzen aus der Verteilung des jeweiligen Bildes. |

Die Bühnentechnik kann die zweite Frage prinzipiell nicht beantworten: Im Theater plant ein Mensch
das Bühnenbild. Sie liefert die **Namen und die Funktionslogik**, nicht die Automatik. Umgekehrt
sagt kein Rechenverfahren, was eine Zone *bedeutet*. Beides wird gebraucht, und beides getrennt.

---

## 2. Die Linse teilt zuerst

Caspar_D, 21.09.2026:

> „auch ist das Korn nicht vor der Linse, das stimmt einfach nicht. Alles was vor der Linse ist,
> ist zoombar, alles dahinter nicht."

Das ist der erste und härteste Schnitt, und er ist ein Ja/Nein-Test an jedem einzelnen Effekt:

**Hinter der Linse** — zoomt nicht mit, klebt am Bild:
Korn auf dem Film, Vignette und Verzeichnung des Objektivs.

**Vor der Linse** — fährt bei jeder Kamerafahrt mit, wird beim Zoomen größer:
alle fünf Zonen unten.

Ein Effekt vor der Linse, der nicht mitfährt, ist ein Fehler, kein Geschmack. Ein Effekt hinter der
Linse, den eine Kamerafahrt berührt, ebenso.

---

## 3. Die fünf Zonen

Von der Kamera nach hinten. Die Namen sind Caspar_Ds, mit einer Korrektur: aus „Leere Zone" wird
**Leerraum**, weil der Regler in der Vorbereitung schon so heißt und „Zone" jetzt der Oberbegriff
für alle fünf ist — ein Wort darf nicht zwei Dinge tragen.

| Zone | Funktion | Wer dort wohnt |
|---|---|---|
| **Scheibe** | das Glas vor dem Objektiv | Beschlag, Tropfen, Kratzer |
| **Leerraum** | der leere Vorraum zwischen Kamera und Motiv | Nebel und Teilchen vor allem, was das Bild zeigt |
| **Vordergrund** | vor der Trennung | Funken vom Feuer, Schnee vor der Figur |
| **Hintergrund** | hinter der Trennung | Regen dahinter, Dunst im Mittelgrund |
| **Hintergrundleinwand** | die letzte Ebene | Sternschnuppe, später Polarlicht, Sterne |

### Zwei Sorten Zonen, und das muss man sehen

**Leinwand, Hintergrund und Vordergrund sind Mengen von Bildpunkten.** Sie sind ortsabhängig und in
der Falschfarben-Ansicht sichtbar.

**Leerraum und Scheibe sind Raumschichten.** Sie gelten überall gleich und haben im Falschfarbenbild
keinen Ort. Wer fünf Farben ins Bild malt, lässt jemanden den Leerraum suchen, den es dort nicht
gibt. Vorschlag: drei Farben im Bild, die beiden vorderen als Streifen am Rand.

### Die Namen kommen aus der Bühne, und dort stimmen sie genau

| Bühne | Hier |
|---|---|
| **Portal** — der Rahmen zum Zuschauerraum | die Bildkante |
| **Gasse** — Zwischenraum zwischen zwei seitlichen Kulissen, durchnummeriert nach hinten | Vordergrund / Hintergrund |
| **Prospekt** — gemalter Hintergrundvorhang | Hintergrundleinwand (innen: die Rückwand) |
| **Rundhorizont / Zyklorama** — die gebogene, hellblau grundierte Projektionswand ganz hinten | Hintergrundleinwand (außen: der Himmel) |
| **Schleiergaze** — halbdurchsichtiger Stoff, je nach Beleuchtung blickdicht oder durchscheinend | der Nebel zwischen zwei Zonen |

Der entscheidende Zug daran: **Eine Bühne kennt keine Tiefe in Metern.** „Auftritt aus der zweiten
Gasse links" ist eine gültige Regieanweisung auf jeder Bühne — eine kleine hat drei Gassen, eine
große sieben. Die Gasse ist ein **Rang**, kein Maß. Genau das, was eine ordinale Tiefenkarte kann.

Und der Rundhorizont ist nicht „der Bereich ab Meter zwölf". Er ist **die Fläche, auf die der Himmel
kommt** — funktional bestimmt, nicht durch Abstand. Wie weit er physisch weg ist, weiß niemand und
braucht niemand zu wissen.

Dasselbe beim Film: **Foreground / Midground / Background**, und ganz hinten das **Translite** — die
hinterleuchtete Großfotografie hinter den Fenstern eines Sets. Auch die Einstellungsgrößen (weit,
halbnah, nah) sind über den Anteil der Figur im Bild definiert, nie in Metern.

---

## 4. Woher jede Grenze kommt

| Grenze | Herkunft | Stand |
|---|---|---|
| Film ↔ Scheibe | **die Linse** — keine Zahl, ein Ja/Nein am Effekt | zu bauen |
| Scheibe ↔ Leerraum | das Glas selbst — keine Zahl | zu bauen |
| Leerraum ↔ Vordergrund | **gesetzt**: Regler „Leerraum vorn" | steht (`zoneLeerraum`) |
| Vordergrund ↔ Hintergrund | **Rang**: der Median dieses Bildes | steht (`zoneTrennung`, „von selbst" = Median) |
| Hintergrund ↔ Leinwand | **Rang**: die hintersten Prozent | **erledigt** — die Talsuche setzt sie, `zoneFlaecheAb` ist gestrichen |

Die Trennung machte es schon richtig, die Leinwand nicht — das war der ganze Fehler, und er ist
behoben. Was von der alten Trennung noch steht (`zoneTrennung`, `zoneWeich`), trägt nur noch drei
Leser über `tiefeSpanne`: die Notiz „wie groß ist die erlaubte Zone", die Teilchen-Notiz und die
Ken-Burns-Zielpunkte. Für das Bild selbst rechnet keiner von ihnen mehr.

---

## 5. Der Beleg: warum ein fester Grauwert nicht geht

Gemessen am 21.09.2026 an **20 Tiefenkarten aus dem Bestand**, Stichprobe über den Katalog verteilt:

| | min | Median | max |
|---|---|---|---|
| Fläche unter der festen Schwelle 13 von 255 | **0,5 %** | 7,2 % | **50,3 %** |
| Grauwert, bei dem die hintersten 12 % liegen | **2** | 26 | **76** |

Die erste Zeile ist der Fehler: Dieselbe Zahl trifft auf einem Bild ein halbes Prozent, auf einem
anderen die halbe Bildfläche. **Faktor hundert.**

Die zweite Zeile sagt, warum es keine Reparatur durch eine bessere Zahl gibt: Wer „die hintersten
12 %" will, bräuchte je nach Bild eine Schwelle zwischen 2 und 76. Eine feste Zahl kann das
prinzipiell nicht leisten. Ein Perzentil liefert per Konstruktion immer 12 %.

### Zwei Einzelfälle, an denen es aufgefallen ist

- **„Vierzehn Tage"** (Nachtwald, Himmel in Lücken zwischen Stämmen): 22,2 % der Punkte liegen
  unter der Vorgabe — aber das ist überwiegend dunkler Wald, nicht Himmel. Die hintersten 10 %
  liegen unter 7 von 255; *das* ist der Himmel.
- **Prüftitel b**: 0,9 % Fläche unter der Vorgabe. Eine Sternschnuppe fiel dort vollständig aus
  (`schnuppe-flaeche-b`, p95 von 3,48 auf 0,00). Der Malweg arbeitete korrekt — die Schwelle war
  unbrauchbar.

Caspar_D dazu, und das ist der Satz, der den Entwurf entschieden hat:

> „ganz ehrlich, es gibt nur einen Himmel ohne Wolken … bei mir sind Titelbilder mit klarem Himmel
> klar unterrepräsentiert"

---

## 6. Die Auflösung: eine Zone ist eine Kategorie, kein Zahlenbereich

Das war der Knoten. Er löst sich mit einem Satz:

**Eine Zone existiert immer. Ihre Fläche im Bild darf null sein.**

Dieselbe Bauart kommt aus zwei völlig unabhängigen Richtungen:

- **Spiel-Engines** behandeln den Himmel nicht als Schwellenwert auf der Tiefenachse, sondern als
  eigene deklarierte Kategorie (Skybox, Far-Plane). Sie ist immer da, auch wenn kein einziger
  Bildpunkt Himmel ist.
- **Im Theater** hat längst nicht jedes Bühnenbild einen Rundhorizont. Ein Kammerspiel hat keinen,
  nur Portal, Gassen und einen geschlossenen Innenraum-Prospekt. Trotzdem ist „Rundhorizont" ein
  gültiger Begriff — er ist auf dieser Bühne nur nicht besetzt.

Ein Porträt hat also keine Hintergrundleinwand. Das ist **kein Fehler des Modells, sondern eine
Auskunft**: „Auf diesem Bild gibt es keine Leinwand — eine Sternschnuppe hat hier nichts zu tun."
Die Karte sagt es, bevor jemand zehn Minuten sucht, warum nichts fliegt.

### Und: Verdecken braucht keine Maßeinheit

Grafikkarten machen seit Jahrzehnten bildpunktgenaue Verdeckung mit nichts als der Frage **„näher
als?"** (Early-Z). Das ist genau die Frage, die eine ordinale Karte beantworten kann — und sie ist
schon gebaut: `verdAn` prüft jedes Teilchen gegen die Karte, in vier Tiefenschichten.

Daraus folgt die wichtigste Bauregel:

**Die Zone bestimmt die Entfernung, nicht ein Malverbot.** Ein Effekt auf der Leinwand liegt ganz
hinten und wird von allem verdeckt, was davor steht. Die Sternschnuppe zieht durch die Lücken
zwischen den Stämmen und verschwindet hinter dem Ast — halb, nicht ganz. Eine Sperre („außerhalb
der Zone gar nicht zeichnen") kann das nicht: sie kennt nur da oder weg. Genau daran ist der
Versuch vom 21.09.2026 gescheitert und wurde am selben Tag zurückgenommen.

Was die Maßeinheit wirklich braucht, ist etwas anderes: das photometrische Entfernungsgesetz 1/r²
beim Scheinwerfer und Lambert-Beer beim Nebel. Dafür steht der Regler **Raumtiefe** in der
Vorbereitung. Die Zonen kommen ohne ihn aus.

---

## 7. Wie die Grenzen gefunden werden

In dieser Reihenfolge, und jeder Schritt darf aussteigen:

1. **Gibt es überhaupt mehrere Häufungen?** Ein Histogramm mit nur einem Haufen (Porträt ohne
   Himmel, Innenraum) hat keine Zonengrenze. Dann fällt die Leinwand weg — sie wird nicht erzwungen.
2. **Wenn ja: wo liegt das Tal?** Die Grenze gehört in die Lücke zwischen zwei Werte-Wolken, nicht
   auf einen festen Rang. Verfahren, die nur die Verteilung brauchen: Talsuche im Histogramm,
   Jenks natural breaks mit Güte-Prüfung, k-Means auf den Tiefenwerten, Valley-Emphasis-Otsu.
3. **Wenn kein Tal: das Perzentil als Rückfall.** „Die hintersten x %" ist immer definiert und
   immer stabil — der sichere, langweilige Weg.
4. **Die Zahl daneben, immer.** Wie viel Fläche diese Zone auf diesem Bild hat, steht auf der
   Karte. Null ist eine gültige Antwort.

Die Trennung „von selbst" (Median) ist bereits Schritt 3 für eine Grenze. Das Haus macht es an
einer Stelle schon richtig; es fehlt nur die Konsequenz.

### Zwei weitere Wege, die offenstehen

- **Antippen statt einstellen.** DaVinci Resolve lässt den Nutzer einen Punkt im Bild wählen und
  zeigt sofort, welche Zone das ergibt — keine Zahl als Bedienelement. Das deckt sich mit der
  Hausregel „was die Software ausrechnen kann, wird kein Regler" und mit den zwei Marken, die der
  Scheinwerfer mit Tiefe seit dem 21.09.2026 hat.
- **Die Leinwand am Bild erkennen, nicht an der Karte.** Die Bildlehre bestimmt die hinterste Ebene
  über **Luftperspektive**: Kontrastabfall, Schärfeverlust, Entsättigung, Verschiebung ins
  Blaugraue. Das ist eine zweite, von der Tiefenkarte unabhängige Quelle — und sie ist genau dort
  stark, wo die Karte schwach ist (fleckiger Himmel zwischen Stämmen).

---

## 8. Die Fallen

Gesammelt aus sieben Fachgebieten; jede davon hätte ich sonst gebaut.

1. **Otsu oder Talsuche blind auf jedes Bild.** Bei einem Histogramm mit nur einem Haufen liefert
   Otsu eine formal gültige, aber bedeutungslose Schwelle mitten im Haufen. Das *sieht aus* wie
   eine funktionierende Zonentrennung und ist keine. Die Prüfung auf Mehrgipfligkeit steht davor.
2. **Normalisieren und dann doch eine feste Schwelle ziehen.** Min/Max-Streckung macht den
   Wertebereich vergleichbar, sagt aber nichts darüber, *wo* die Objektgrenze liegt. Ein Bild mit
   Vordergrund und Wand normalisiert genauso glatt wie eines mit Vordergrund, Lücke und Himmel. Die
   Normalisierung ist notwendig, nicht hinreichend — Tutorials stellen sie oft als Lösung dar.
3. **Die Zonenzahl fest verdrahten.** Kein Fachverfahren tut das: Layered-Depth-Image-Verfahren
   lassen die Schichtzahl von der Tiefenkomplexität abhängen. Fünf Zonen sind die *Begriffe*, nicht
   die garantierte Zahl der belegten Zonen in einem Bild.
4. **Die hinterste Ebene mit „am dunkelsten" verwechseln.** Fachlich ist sie über Kontrast- und
   Schärfeverlust definiert. Bei Himmelslücken (**sky holes**) ist sie zudem gar nicht
   zusammenhängend — ein einzelner Schwellenwert bildet das strukturell nicht ab.
5. **Die Bühnenmetapher in Meter übersetzen.** Der Rundhorizont hat keine Distanz, er hat eine
   Funktion. Wer ihm einen festen Tiefenwert gibt, hat die Analogie in dem Moment verloren, in dem
   sie nützlich wurde.
6. **Auf der Stichprobe nachjustieren, bis es „meistens" passt.** Das ist keine Robustheit, das ist
   Anpassung an die Stichprobe — und bricht beim nächsten Motiv still und unbemerkt.

---

## 9. Was offen ist

**Die eine Entscheidung, die Caspar_D noch treffen muss:** Manche Effekte *wohnen* in einer Zone
(Sternschnuppe, Beschlag, Funken), andere *durchqueren* sie. Nebel füllt Leerraum bis Hintergrund,
ein Scheinwerfer leuchtet durch alle fünf. Bekommt ein Effekt also einen **Ort** (eine Zone) oder
eine **Ausdehnung** (von–bis)?

Vorschlag zur Abstimmung: beides, je nach Art — **Körper haben einen Ort, Medien eine Ausdehnung.**
Davon hängt ab, wie die Zeile „Aufenthalt" künftig aussieht.

Weiter offen:
- ~~Ob „Hintergrundfläche ab" als Regler bleibt.~~ — entfallen am 21.09. abends (`bb492b0`): die
  hinterste Zone „ganz hinten" leistet es. Ein flächiges Polarlicht braucht dann keine Fläche, sondern
  eine **Ausdehnung** — das ist die Entscheidung oben, kein eigener Regler. Rest im Code: `flaecheAb`
  wird in Vorbereitung und Rezept noch gelesen und geschrieben (Zeilen ~28647/28664), Regler und
  Beschriftung sind weg — löschen, nicht stehen lassen. (Durchsicht 23.09.)
- ~~Die Falschfarben-Ansicht auf drei Zonenfarben erweitern (heute zwei: rot/blau).~~ — gegenstandslos:
  die rot/blau-Ansicht ist am 21.09. abends mit `TSICHT`/`tiefesicht*` entfallen, die Zonenkarte ist
  ihr Nachfolger. (Durchsicht 23.09.)
- Ob die Luftperspektive als zweite Quelle wirklich gebaut wird oder Notiz bleibt.

---

## 10. Woher die Einsichten stammen

Sieben Fachgebiete, am 21.09.2026 parallel befragt. Was in diesem Papier steht, kommt daher:

| Gebiet | Was es beigetragen hat |
|---|---|
| Bühnentechnik / Guckkastenbühne | Portal, Gasse, Prospekt, Rundhorizont, Schleiergaze · „nie mehr als 4–6 Ebenen" · Rang statt Maß · die Falle der Meter-Übersetzung |
| Monokulare Tiefenschätzung | scale-and-shift-invariant, affine-invariant, ordinal · Percentile Clipping · AdaBins · Rangkorrelation als Gütemaß |
| Schwellwertbestimmung | Multi-Otsu, Valley-Emphasis, Triangle, Jenks mit Güte-Prüfung, Scale-Space-Modenzählung · die Unimodal-Falle |
| Echtzeit-Rendering | Early-Z („näher als" genügt) · Skybox als deklarierte Kategorie · Froxel relativ zum Frustum · verdecken ≠ nicht zeichnen |
| Compositing / VFX | Z-Normalize · Z-Slicing · histogrammbasierte Layer-Segmentierung · Resolves Antippen statt Einstellen |
| Bildkomposition / Bühnenbild-Theorie | Repoussoir · Luftperspektive · **sky holes** · Interposition als rein ordinale Tiefenangabe |
| 2.5D-Ken-Burns / Layered Depth Images | adaptive Schichtzahl statt fester · Kantenerkennung auf Tiefensprüngen · k-Means statt fixem Grauwert |


---

## 11. Was die Umsetzung geändert hat

### Die Abtastbreite hängt nicht an der Zonenzahl

Ich hatte behauptet, dieselbe Karte ergebe bei 170 Punkten zwei und bei 150 drei Grenzen, und
daraus eine Regel gemacht. **Nachgemessen stimmt das nicht:** an „Mensch Mädel" findet dieselbe
Rechnung bei 140, 150, 160, 170 und 180 Punkten jedes Mal dieselben zwei Täler. Die dritte Grenze,
die ich als Beleg anführte, hatte ich selbst von Hand gesetzt.

Die Abtastbreite bleibt trotzdem fest — aber weil zwei Werkzeuge, die dasselbe zeigen sollen, nicht
verschieden abtasten dürfen, nicht weil die Zonenzahl daran hinge. Das Studio rechnet mit 160
(`tiefeProben`), das Labor tastet ebenso ab.

### Nicht detektierte Bereiche werden nicht gezeigt

Zunächst standen alle sechs Bereiche in der Ankreuzliste, die fehlenden grau — nach Hausregel 4,
die Ausgrauen statt Verstecken verlangt. Caspar_D am 21.09.2026:

> „ich bin dafür, die grauen Zonen nicht zu zeigen, sie wurden nicht detektiert, also sind sie für
> dieses Bild auch nicht da"

Das ist richtig, und es widerspricht Regel 4 nicht: Sie schützt davor, eine **vorhandene**
Möglichkeit zu verbergen. Ein Bereich, den die Talsuche hier nicht gefunden hat, ist keine
verborgene Möglichkeit — er existiert auf diesem Bild nicht.

**Der Fall, der dadurch entsteht, wird abgefangen:** Ein Rezept von einem Bild mit Himmel trägt
„ganz hinten" mit; auf einem Porträt trifft das nichts, und der Effekt wirkt nirgends. Die Karte
sagt es, nennt die Namen und bietet einen Griff an („Auf die vorhandenen Zonen setzen"). Still
korrigiert wird nichts: ein Effekt, der von selbst woanders zu wirken begänne, wäre schlimmer als
einer, der nichts tut und es sagt.

---

## 12. Erledigt: die Entfernung der Teilchen

**Gebaut am 21.09.2026 abends.** `freiBereich` holte sich bis dahin die *Nähe zur alten
Trennlinie* — ein praktisch binärer Wert, weil `nahKurve` an der Grenze zwischen 0 und 1
umschlägt. Das Teilchen wusste also nur, auf welcher Seite es geboren wurde, nicht wie tief.

Jetzt liest es die rohe Tiefe am Geburtsort (`tiefeRohAn`), und die Skala fällt mit dem Raummodell
zusammen: 0…1 die Szene mit ihren Zonen, 1…1+L der Effektraum, 1+L die Effektscheibe.
`schichtBaender` schrumpfte dabei von zwanzig Zeilen auf vier, weil Entfernung und Tiefe nun
dieselbe Größe sind.

Gemessen: `partikel` p95 von 8,94 auf 9,08, `feuer` unverändert. Der Prüfstand sagt damit
„anders", nicht „besser" — die Richtung beurteilt Caspar_D am Bild. *(Stand 23.09.: noch nicht
beurteilt — Übergabe, Wiedervorlage 7.)*

Was aus dieser Liste noch **nicht** gefallen ist: `zoneTrennung`, `zoneWeich` und `tiefeSpanne`.
Sie tragen keinen Malweg mehr, aber noch drei Notizen und die Ken-Burns-Zielpunkte. `VH_GRENZE`,
`nahKurveZurueck` und `partikelMaske` sind weg.
