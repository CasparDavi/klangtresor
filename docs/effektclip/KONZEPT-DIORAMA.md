# Das Diorama und die Kamera — die Ordnung des Malwegs

Durchspezifiziert mit Caspar_D am 19.09.2026, nachdem er beim Ausprobieren der Ken Burns Fahrt
gesehen hat, was fehlt:

> „ich sehe ein Problem, der Zoom muß auf alles wirken, auch Effekte müssen mitgezoomt werden,
> momentan zoomt nur die Quelle, die Effekte bleiben wo sie sind"

Und, nachdem ich Beschlag, Tropfen und Risse ans Objektiv gelegt hatte:

> „würde ich nicht so sehen, es ist eine Scheibe vor dem Diorama, nicht vor der Linse, deswegen
> vergrössert es mit."
>
> „die idee, die Ken Burns erst ganz hinten draufzulegen ist konsequent"

---

## 1. Das Bild, aus dem alles folgt

**Es gibt ein Diorama, und davor steht eine Kamera.**

Alles, was im Diorama ist oder auf seiner Glasscheibe klebt, wird größer, wenn die Kamera
heranfährt. Alles, was an der Kamera selbst sitzt — das Korn des Films, ein Streulicht im
Objektiv, ein Wackeln des Stativs —, bleibt, wo es ist. **Eine Kamera, die zoomt, zoomt ihr
eigenes Filmkorn nicht.**

Das ist keine Einstellung, sondern die Natur der Sache, und sie beantwortet jede Einzelfrage von
selbst.

---

## 2. Der Malweg, in drei Stufen

| | was dort geschieht | in welchem Maß |
|---|---|---|
| **1 · Das Diorama** | die Quelle, die Vorbereitung und alle Szenen-Effekte | **Quellkoordinaten, Quellauflösung** |
| **2 · Die Kamera** | Ausschnitt, Zoom, Schwenk, Drehung, Parallaxe, Bewegungsunschärfe | die Leinwand entsteht hier |
| **3 · Objektiv und Film** | was an der Kamera sitzt | Leinwandkoordinaten |

Heute ist die Reihenfolge eine andere: die Kamera schneidet die **Quelle** aus, und alle Effekte
werden danach in Leinwandkoordinaten daraufgemalt. Darum bleiben sie stehen, während das Motiv
unter ihnen wegfährt.

---

## 3. Wer wohin gehört

**Ins Diorama** (fährt mit, wird größer):

Quelle · Vorbereitung (Belichtung, Gradation, Sepia — *„die Vorbereitung gehört zur Quelle"*) ·
Scheinwerfer · Schatten · Laserstrahl · Lichtstrahlen · Feuer · Flammen · Partikel · Filmnebel ·
Streiflicht · Kaustik · Wellen · Spiegelung · Farbschleier · **Beschlag · Tropfen · Einschlag ·
Risse im Glas** (die Scheibe steht vor dem Diorama) · **Helligkeit, Kontrast, Sättigung, Farbton**
(*„wenn wir davon ausgehen, dass die Pulse Beleuchtungspulse sind, gehört es ins Diorama"*)

**Die Kamera:**

Ken Burns Fahrt · Zoom schlägt · Kippen schlägt · Parallaxe · Bewegungsunschärfe · Schärfe schlägt

**Objektiv und Film** (bleibt, wo es ist):

Filmkorn · Scanlines / Röhre · Bloom / Halation · Linse · Farbkanal-Puls · Rauschausfall ·
Glitch-Blöcke · Bildlauf · Verwackeln · Sicherungswackeln · Stroboskop · Laufstreifen ·
Nachzieheffekt

---

## 4. Was von selbst wegfällt

Das ist der eigentliche Gewinn, und er war nicht geplant:

- **`geoKarteLegen` und die ganze Maschinerie „die Tiefenkarte fährt mit der Geometrie mit".** Wird
  das Diorama in Quellkoordinaten gemalt, liegt die Tiefenkarte **deckungsgleich** darauf. Nichts
  muss umgerechnet werden.
- **Damit eine ganze Fehlerklasse.** Am 17.09.2026 war die Karte an *drei* Stellen nicht
  mitgefahren, bis zu 364 Bildpunkte Versatz, 26 % der Fläche auf der falschen Seite der
  Verdeckungskante. Solche Fehler kann es nach dem Umbau nicht mehr geben — es gibt keine zweite
  Umrechnung, die jemand vergessen könnte.
- **`geoZuQuelle` / `geoZuLeinwand` für die Szenen-Effekte.** Die Orte sind schon Quellorte.

Die Parallaxe bleibt, wo sie ist: sie **ist** die Kamera.

---

## 5. Was es kostet, und was gemessen werden muss

Das Diorama wird in **Quellauflösung** gemalt statt in Ausgabegröße. Typisch 1057×1442 gegen
792×1080 — **1,8-mal so viele Bildpunkte je Szenen-Effekt.** Bei Videos ist es 1:1, die liegen
schon in Ausgabegröße vor.

**Das ist die eine Zahl, die man sich nicht überlegen kann**, und sie wird gemessen, bevor eine
Zeile entsteht: die Kosten je Bild für eine volle Kette aus Szenen-Effekten, in Quellauflösung
gegen Ausgabegröße, mit Zaunmarke.

Warum nicht kleiner malen: Der Ausschnitt muss aus etwas geschnitten werden, das mehr Bildpunkte
hat als die Leinwand — sonst wäre jeder Zoom eine Vergrößerung von bereits Verkleinertem, und die
Fahrt würde *unschärfer* als heute. Die Quellauflösung ist genau die Grenze, die das Haus ohnehin
kennt (`ausgabeMass` deckelt bei 1080 und vergrößert die Quelle nie).

---

## 6. Was sich sichtbar ändert — mehr, als man zuerst denkt

**Jedes Rezept mit einem Szenen-Effekt ändert sich minimal**, auch ohne Kamerabewegung. Heute
werden die Effekte in Ausgabegröße gemalt; nachher in Quellauflösung und danach verkleinert. Das
ist **Überabtastung** — es sieht glatter aus, aber es ist nicht bitgleich.

Das ist kein Rückschritt, sondern eine Verbesserung, die man benennen muss, damit sie niemanden
überrascht: der Prüfstand wird für nahezu jeden Fall eine kleine Abweichung melden, und jede
einzelne muss diese Erklärung tragen — sonst versteckt sich ein echter Fehler darin.

**Grob hingegen ändert sich wenig:** Im Archiv liegen 20 Rezepte, **drei** haben überhaupt eine
Kamerabewegung — zwei davon Caspar_Ds Ken-Burns-Versuche vom 19.09., das dritte hat „Zoom schlägt"
ausgeschaltet.

---

## 7. Die Falle, die ich schon kenne

**Das Maß der Effekte wechselt seinen Bezug.** `EINHEIT` rechnet heute gegen die Leinwand; im
Diorama muss es gegen das Diorama rechnen. Bei Zoom 1 muss dabei herauskommen, was heute
herauskommt — das ist der Prüfstein für jeden einzelnen Effekt, und es ist der mechanische Teil
der Arbeit.

**Weichzeichnung über `ctx.filter` skaliert nicht mit einer Zeichentransformation.** Wer die Kamera
als Transformation legt statt als Ausschnitt, bekommt Weichzeichner in Leinwandmaß statt in
Dioramamaß. Darum wird das Diorama auf eine eigene Leinwand gemalt und die Kamera schneidet daraus
— keine Transformation, ein Ausschnitt, genau wie heute bei der Quelle.

**Sechs Effekte laufen im Shader** (Streiflicht, Filmnebel, Wellen, Kaustik, Linse, Flammen). Fünf
davon gehören ins Diorama, die Linse ans Objektiv. Der Shader-Weg muss also auf zwei Stufen laufen
können, in zwei verschiedenen Größen.

---

## 8. Der Weg

| # | Schritt | Nachweis |
|---|---|---|
| **1** | **Messen**: Kosten einer vollen Szenen-Kette in Quellauflösung gegen Ausgabegröße, mit Zaunmarke. | die Zahl, vor der ersten Zeile |
| **2** | **Die drei Stufen bauen**, Effekt für Effekt einsortiert; bei Zoom 1 muss jeder aussehen wie heute. | Grundlinie: jede Abweichung einzeln begründet; Naht bitgleich |
| **3** | **`geoKarteLegen` und Verwandtschaft löschen**, Begründung bleibt als Kommentar. | die Tiefeneffekte vorher/nachher |

Caspar_D, 18.09.2026: *„wir machen dinge fertig und nicht alles zugleich."* Diese Arbeit ist groß,
aber sie ist **eine** Baustelle — die Kamera. Sie wird nicht mit anderem vermischt.
