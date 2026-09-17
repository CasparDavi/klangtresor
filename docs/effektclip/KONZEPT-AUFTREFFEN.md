# Partikel und Tiefe — Spezifikation

**Stand 17.09.2026, nach einer vollständigen Spezifizierungsrunde mit Caspar_D. Nichts davon ist
gebaut.** Das Papier ist der Vertrag, nach dem gebaut wird.

Caspar_D zum Verfahren: *„und genau so stelle ich mir spezifizierungsrunden vor, kein lospreschen,
ewig viele tests machen und dann plötzlich merken, hoppla, so geht es ja gar nicht."* — und als Regel:
*„bitte nie wieder eine große Menge Tests machen, bevor wir nicht durchspezifiziert haben."*

---

## 1. Was vorher war, und warum es weg muss

Partikel hatten zwei Ämter gegenüber der Tiefenkarte:

- **Verdeckung** (`tiefeVerdeckung`) — das Teilchen ist hinter etwas, man sieht es nicht, es fliegt weiter.
- **Betretungsverbot** („Aufenthalt", `tiefeWirkt`, Werte *alles · nur vorn · nur hinten*) — das Teilchen
  darf in einer Zone nicht sein. Dort wird es schlicht **nicht gezeichnet**. Es ploppt weg.

Caspar_D gegen das Ploppen: *„es darf überhaupt keine richtungen geben, die in die verbotszone führen,
wir können doch nicht einfach ein objekt auf verbotener bahn fliegen lassen und es irgendwo im nichts
verschwinden lassen"*.

Der erste Lösungsversuch war eine **Geburtenkarte** — nur dort geboren werden, wo die ganze Bahn
erlaubt bleibt. Sie scheitert an der Sache: Regen legt sechs Bildhöhen je Clip zurück und durchquert
jede Bildzeile. Eine erlaubte Bahn gibt es für ihn nicht. **Verworfen.**

Der zweite Versuch war **Ausweichen** für alles Lebendige. Er ist mit dieser Spezifikation
**überflüssig geworden** — siehe Abschnitt 6.

---

## 2. Der Raum

Eine Tiefenkarte ist **eine Fläche, kein Volumen**. Hinter ihr ist kein Raum. Real ist nur der Raum
davor. Drei Sätze von Caspar_D, die das Modell festlegen:

**Nichts wird hinter die Fläche gesetzt.** *„warum haben wir nicht einfach gesagt, daß wir nicht
einfach so tun, als ob noch eine Tiefenschicht davor frei ist"* — und präziser: *„es gibt doch keine
einzige tiefenkarte, wo gleich vorne ein Überhang ist. die untere Kante kann doch maximal vorne
sein."* Der Fehler, der die ganze Runde ausgelöst hat: die Entfernung eines Teilchens wurde aus dem
*ganzen* Wertebereich gewürfelt, also auch hinter die Fläche. Solche Teilchen stecken im Boden und
sind nie zu sehen.

**Vor dem Ganzen liegt eine leere Ebene.** *„tiefenmap verhält sich genau so wie 2D, es gibt einen
layer vor dem ganzen, in dem noch Partikel generiert werden können."* Ein Teilchen dort wird von
nichts verdeckt und von nichts aufgehalten — das ist das heutige, flache Verhalten. Kein Sonderfall,
sondern das vordere Ende des freien Bereichs. Wie weit dieses Ende reicht, ist ein Regler.

**Der Boden ist eine Ebene, keine Kante.** *„entstehung unten, z.B. Schwaden, die können ja aus dem
ganzen boden entstehen, z.B. Nebel aus einer Wiese. und der ganze boden ist eine Fläche in der
Tiefenmap, auf der z.B. Regentropfen auftreffen würden."* Unten am Bildrand nah, am Horizont fern.
**Dieselbe Fläche, zwei Verwendungen: sie fängt Fallendes auf, und sie lässt Steigendes entstehen.**

---

## 3. Die Spezifikation

**1 · Herkunft.** Ein Geburtsort ist eine Stelle, an der **in Flugrichtung Freiraum** ist
(Caspar_Ds Formulierung). Drei Fälle, alle von der Art bestimmt, keiner konfiguriert:

| | wer |
|---|---|
| von oberhalb des Bildes | Regen, Schnee, Blätter, Konfetti, Daunen, Pusteblume |
| auf der unteren Fläche | Funken, Asche, Blasen, Schwaden |
| immer da, im freien Raum verteilt | Staub, Glitzer, Bokeh, Glühwürmchen, Schmetterlinge |
| eigene Bahn | Sternschnuppe, Konfetti-Kanone, Schwarm |

Dazu jederzeit die **gesetzte Quelle** (Punkt, Strich, Kreis, Ellipse — gibt es schon). Caspar_D:
*„lass es alles ruhig aus der unteren fläche entstehen, wenn ich quellen will, definiere ich."*

**2 · Entfernung.** Die Entfernung eines Teilchens wird aus dem **freien Bereich an seinem
Geburtsort** gewürfelt — von der Fläche dort bis an das vordere Ende. Reine Funktion seiner Nummer,
damit die Schleife exakt bleibt.

Weil der Boden eine schräge Ebene ist, hängt die Entfernung eines steigenden Teilchens davon ab, *wo*
auf dieser Ebene es entsteht: unten am Rand nah (steigt vorne vorbei), weiter oben fern (steigt hinter
den Dingen auf). Ein Feuer in der Nähe und ein Feuer in der Ferne — von selbst richtig, ohne Regel.

**3 · Verdeckt**, wo die Fläche näher ist als das Teilchen. Es fliegt weiter.

**4 · Aufgehalten** am **Anfang der letzten gesperrten Strecke** seiner Bahn — der, aus der die Bahn
bis zum Bildrand nicht mehr herauskommt.

### Warum Satz 4 so und nicht „erster Treffer"

Caspar_Ds Einwand: *„Wenn der Ast als barriere gelesen würde, würde regen nur weiterfallen, wenn er
vor dem Ast fällt, ein hinter gibt es nicht, er würde immer auftreffen. funken würden auch nur vor dem
Ast steigen, alles unter dem und hinter dem Ast würde blockiert."*

Richtig — für „erster Treffer". Eine Tiefenkarte kennt keinen Freiraum hinter einem Ast; sie sagt dort
nur „nah". Über die **Bahn** weiß sie mehr:

> Ein Ast ist etwas, aus dem die Bahn wieder **herauskommt**. Ein Boden ist etwas, aus dem sie nicht
> mehr herauskommt.

Damit trennen sich Verdeckung und Auftreffen **ohne willkürliche Zahl** — keine Mindestdicke, kein
Schwellwert, kein Vorausschauen. Durchgerechnet an einer Spalte (Himmel 0,1 · Ast Zeile 400–420 bei
0,9 · Boden ab Zeile 800 bei 1,0):

| Teilchen | gesperrte Strecken | letzte beginnt | Ergebnis |
|---|---|---|---|
| Tropfen, Entfernung 0,5 | 400–420, 800–889 | 800 | hinter dem Ast vorbei, Aufprall am Boden |
| Tropfen, Entfernung 1,05 (Vorraum) | keine | – | fällt an allem vorbei aus dem Bild |
| Tropfen, Entfernung 0,95 | 800–889 | 800 | vor dem Ast, Aufprall am Boden |
| Funke, geboren Zeile 880 (Boden nah) | keine | – | steigt vorne vorbei, verlässt das Bild oben |
| Funke, geboren Zeile 600 (Boden fern) | 400–420 | – | hinter dem Ast auf, verdeckt, verlässt das Bild |

Ein Ast hält nichts auf. Und es ist **billiger** als „erster Treffer": ein Durchgang über die Bahn,
kein Vorausschauen.

---

## 4. Was ausdrücklich verworfen ist

- **Liegenbleiben.** Kein Fleck, kein Haufen, keine Ablagerung. Caspar_D: *„etwas irgendwo
  liegenlassen ist schwierig, weil man sich merken muß, dass es dort liegt, ausserdem können dinge
  akkumulieren … dann müsste schnee auch liegenbleiben, das ist ein Faß, was ich nicht aufmachen
  möchte"*. Technisch derselbe Grund: der Maler führt kein Buch, ein wachsender Haufen wäre die Summe
  aller vorherigen Bilder, und die Schleife wäre hin.
- **Nass werden.** Dasselbe Fass, nur flacher. Das Objekt bleibt trocken, der Tropfen hört an ihm auf.
- **Einschlagsszenarien** für Sternschnuppen. *„das sollte der Partikeleffekt ja gar nicht leisten."*
- **Sonderregeln je Art.**
- **Die Geburtenkarte** und **das Ausweichen** (siehe 1 und 6).

---

## 5. Die Regler

Fünf, und die Namen sind Caspar_Ds.

| Regler | was er sagt |
|---|---|
| **Aufenthalt** — *Ganze Bildtiefe · Vordergrund · Hintergrund* | aus welchem Teil des Raums die Entfernung gewürfelt wird |
| **Vordergrund-Hintergrund-Grenze** | bewegt die Scheibe, die Vordergrund und Hintergrund trennt |
| **Schärfe der Grenze** | ob es eine Scheibe ist oder eine Gradienten-Übergangswand |
| **Leerraum vor Tiefenkarte** | wie breit der vorgelagerte Leerbereich ist |
| **Perspektive** (heute „Raumtiefe") | wie stark die Entfernung sich zeigt |

**Zwei Dinge zur Umsetzung:**

- **„Aufenthalt" wird umdefiniert.** Bisher fragte die Zeile, über *welcher Bildhälfte* ein Teilchen
  erscheinen darf — eine Regel über die Bildfläche, weil ein Teilchen keine Entfernung hatte. Jetzt
  hat es eine. Die Zeile sagt daher, aus welchem Teil des freien Bereichs seine Entfernung kommt.
  „Vordergrund" ist der rote Bereich der Trennebenen-Ansicht, „Hintergrund" der blaue.
- **„Schärfe der Grenze" läuft andersherum** als der heutige Wert (`tiefeWeich`, ein weiches Band von
  ±48 Graustufen). Schärfe 1 = Scheibe, 0 = Gradientenwand. Der Regler zieht sonst rückwärts.

### Die Trennlinie, die festlegt, was unter „Perspektive" gehört

> Was eine **Ja/Nein-Frage** ist — vor oder hinter, verdeckt oder nicht, aufgehalten oder nicht —,
> gilt **immer**. Da ist nichts zu dosieren.
>
> Was eine **Stärke** hat, weil der Tiefe der Maßstab fehlt — Größe, Tempo, zurückgelegte Strecke,
> Fächerbreite, Dunst —, hängt an **Perspektive**.

Der Grund ist ehrlich: Die Karte ist je Titel auf ihre eigene Spanne gedehnt. „Vor oder hinter" steht
darin eindeutig. „Um wie viel kleiner" steht nicht darin — das ist eine Setzung, und Setzungen
bekommen einen Regler.

### Was keinen Regler braucht, und wer stattdessen entscheidet

| Sache | wer entscheidet |
|---|---|
| Woher das Teilchen kommt | die Art |
| Verdeckt oder aufgehalten | die Bahn — kommt sie wieder heraus, war es ein Ast |
| Fächer in der Tiefe | dieselbe Zahl wie in der Bildebene: ein Fächer, drei Richtungen |
| Obergrenze des Perspektiv-Faktors | „Leerraum vor Tiefenkarte" — so weit nach vorn, so groß der Faktor |
| Wie das letzte Bild aussieht | der Körper: der Kopf steht auf der Fläche, der Strich wird gekürzt |

---

## 6. Zwei Zeilen fallen weg

**Die Zeile „Verdeckung" wird gelöscht.** Die Regel aus Satz 4 **entscheidet selbst**, ob etwas
verdeckt oder aufgehalten wird — da ist nichts zu wählen. Und der flache Aufsatz von früher (Schnee
vor allem, von nichts verdeckt) kommt ehrlich zustande: **Aufenthalt · Vordergrund** plus
**Leerraum vor Tiefenkarte**. Damit ist auch die Dopplung gelöst, die beim ersten Entwurf entstand:
„Aufenthalt · nur hinten" und „hält ihn auf" fragten dasselbe und der Aufenthalt griff zuerst — das
Auftreffen konnte nie sichtbar werden.

**Das Ausweichen wird nicht gebraucht.** Es war nur nötig, um lebende Teilchen aus einer *Verbotszone*
zu halten. Die gibt es nicht mehr: Ein Vogel, ein Schmetterling, ein Glühwürmchen fliegt in einer
Entfernung und wird verdeckt, wo etwas davor steht. Da ist nichts, dem er ausweichen müsste. Der
Schwarm, der heute als einziger ausweicht (`zAusweichen`), verliert seinen Sonderfall.

---

## 7. Der Fächer

**„Auffächern" wird ein echter Winkel.** Heute steckt in `flugbahn` genau eine Zahl für die Richtung:
`ang = (winkel + (hs(i+9400)-0.5)·360·streuung)·π/180`, und die geht in `cos` → x und `sin` → y. Zwei
Komponenten, keine dritte: der Fächer ist flach, ein Springbrunnen auf Glas gemalt.

Caspar_D: *„je weiter hinten, desto flacher der fächer."* Das ist Perspektive — die scheinbare Breite
geht mit 1 durch die Entfernung. Dieselbe Zahl, richtig projiziert: eine Quelle unten am Bildrand
(Boden nah) fächert weit, dieselbe Quelle weiter oben auf der Bodenebene (fern) schmal.

**Und der Fächer bekommt eine dritte Komponente.** Damit ist die Entfernung eines Teilchens nicht mehr
über sein Leben fest, sondern wandert: `pz(t) = pz₀ + vz·Alter`. Reine Funktion von Nummer und Zeit,
die Schleife bleibt exakt. Was daraus folgt, ohne weiteren Regler:

- Ein herankommendes Teilchen wird größer und schneller, ein wegfliegendes kleiner und blasser.
- Ein Funke, der vor der Balustrade startet und nach hinten fliegt, verschwindet **hinter** ihr — und
  einer, der nach vorn kommt, tritt aus der Verdeckung heraus. Das kann heute keine Art.
- Das Auftreffen braucht keine Änderung: die Regel vergleicht an jedem Schritt die Fläche mit der
  Entfernung des Teilchens, ob die konstant ist oder wandert.

Betroffen ist alles, was durch `flugbahn` läuft, und die Kanone. Regen und Schnee haben keinen Fächer
und keine Abschussrichtung.

---

## 8. Die Arten

Strecke je 10-Sekunden-Clip bei Tempo 1, aus `BASIS_ART` und `ART_AUFTRIEB`.

| Art | Richtung | Strecke je Clip | Herkunft nach dieser Spezifikation |
|---|---|---|---|
| Regen | fällt | 6,0 Bildhöhen | von oben |
| Funken | steigt | 2,5 | untere Fläche |
| Blätter | fällt | 0,9 | von oben |
| Blasen | steigt | 0,8 | untere Fläche (aber siehe 10.3) |
| Konfetti (fallend) | fällt | 0,7 | von oben |
| Schnee | fällt | 0,6 | von oben |
| Schwaden (Rauch) | steigt | 0,5 | untere Fläche |
| Asche | steigt | 0,3 | untere Fläche |
| Daunenfedern | fällt | 0,28 | von oben |
| Pusteblumensamen | fällt | 0,2 | von oben |
| Bokeh (Lichtkreise) | schwebt | 0,108 | immer da |
| Staub | schwebt | 0,048 | immer da |
| Schmetterlinge | schwebt | 0,045 | immer da |
| Glitzer | schwebt | 0,042 | immer da |
| Glühwürmchen | schwebt | 0,042 | immer da |
| Sternschnuppen | fällt schräg | 1,25 Bilddiagonalen | eigene Bahn, Start außerhalb |
| Konfetti (Kanone) | schräg, dann fällt | aus der Mündung | Quelle = Mündung |
| Schwarm | schwebt | eigene Bahn | Mitte der Schar |

**Die fünf Schwebenden** kommen nirgends her. Caspar_D: *„sie sind immer da."* Sie werden im freien
Raum geboren, wo sie sind, mit einer Entfernung aus dem freien Bereich an ihrer Stelle. Das Auftreffen
greift bei ihnen von selbst nicht — sie legen je Clip unter ein Zwanzigstel der Bildhöhe zurück, ihre
Bahn erreicht keine Fläche. Staub landet nicht in zehn Sekunden. **Verdeckt** werden sie vollständig,
und „Aufenthalt" ist für sie das sinnvollste von allem: Glühwürmchen nur im Hintergrund, Glitzer nur
vorn, Staub durch die ganze Bildtiefe.

**Zwei Berichtigungen von Claude, beide vom 17.09.2026:**

- **Glitzer schwebt frei.** Ich hatte behauptet, es sitze *auf* der Fläche, weil der Maler es als
  „ein AUFBLITZEN" beschreibt. Das beschreibt sein Verhalten in der *Zeit*, nicht seinen Platz.
  Caspar_D: *„auch Feuerwerk kann glitter machen, der schwebt frei in der Luft, feenstaub, magisches
  Zeug, dazu braucht man glitter, ich würde den frei schwebend lassen."*
- **Bokeh ist ein Ding im Raum.** Ich hatte behauptet, es entstehe im Objektiv und habe daher keinen
  Platz. Zu kurz: Ein Lichtkreis ist das unscharfe Bild **einer Lichtquelle in der Szene** — die hat
  einen Platz, und ein Licht hinter einer Säule wird verdeckt.

---

## 9. Was über den Bestand bekannt ist

Alle 325 `library/songs/*/tiefe.png`, Raster wie `tiefeProben` (160 Punkte breit).

| Befund | Zahl |
|---|---|
| Spanne der Karte (95. minus 5. Hundertstel), Median über 325 Titel | **209 von 255** |
| Karten mit Spanne 0 — dort trennt keine Ebene etwas | **1** |
| Karten mit Spanne unter 64 | **4** |
| ab welcher Spanne eine Karte brauchbar trennt (Augenschein Caspar_D) | **unter 126** |
| Titel, bei denen das unterste Zehntel näher ist als das oberste | 97,8 % |
| mittlere Nähe im untersten Zehntel / im obersten | 0,902 / 0,229 |
| Rasterhöhe | 100 … 375 Zeilen, Median 218 |

**Berichtigung einer eigenen Zahl.** Ein Zwischenbericht sprach von „30 Karten, bei denen nichts
trennt", und nahm dafür den **Median** der Karte (unter 20). Das ist das falsche Maß: Eine dunkle Karte
mit einer kleinen hellen Figur hat einen Median nahe null und trennt trotzdem perfekt — ein Titel im
Bestand hat Median 5 und Spanne 125. Maßgeblich ist die **Spanne**. Es sind nicht 30, es sind vier.

**Die Grenze des Vorhabens, ehrlich beziffert.** Am Auftreffpunkt ist im Bild selbst oft nichts zu
sehen — gemessen an 325 deckungsgleichen Bild/Karte-Paaren:

| | Wert |
|---|---|
| Auftreffpunkt ist eine echte Kante der Tiefenkarte (fallende Arten) | 42 … 46 % |
| sanfte Überschreitung | 38 … 48 % |
| dünne Struktur, die keine fünf Rasterzeilen hält | 9 … 17 %, mit Wind 1: **30 %** |
| **im Bild keine sichtbare Stufe am Auftreffpunkt** (unter 3 von 255) | **27,7 %** |

In gut einem Viertel der Fälle hört das Teilchen an einer Stelle auf, an der im Bild nichts ist. Das
ist kein Rechenfehler, sondern die Qualität einer geschätzten Tiefenkarte. Ob es störend aussieht,
entscheidet der Augenschein.

### Was gemessen wurde und NICHT gilt

Die Zahlen zur sichtbaren Fallstrecke (φ ≈ 0,21 Bildhöhen, „von 120 Teilchen sind 25 sichtbar",
„92,9 % der steigenden Arten nie zu sehen") sind unter dem **falschen Raummodell** entstanden:
Entfernung aus dem ganzen Bereich gewürfelt, also auch hinter die Fläche. Sie beschreiben diesen
Fehler, nicht diese Spezifikation. **Nicht wiederverwenden.**

Caspar_D dazu: *„Du hast jetzt mehrere Stunden getestet obwohl man ein Riesenhaufen mit gesundem
Menschenverstand regeln kann. Vorher mal nachdenken, ob die Natur der Partikel, die wir simulieren gut
getroffen wird."*

---

## 10. Bauweg

Jeder Schritt ist für sich vorzeigbar. Kein Schritt hinterlässt eine Baustelle: wer bei 2 aufhört, hat
eine bessere Verdeckung als heute; wer bei 3 aufhört, hat etwas Funktionierendes und Langsames.

| # | Schritt | was nachgewiesen wird |
|---|---|---|
| **1** | **Die Entfernung.** `pz` je Teilchen aus dem freien Bereich am Geburtsort. Dazu die Geburtsort-Maschinerie: Eintrittsspalte am oberen Rand (geschlossene Formel — das Teilchen trat vor `y0/v` Sekunden ein), Tabelle der Bodenflächen je Quelle und Einstellung, eigene Stelle für die Schwebenden. | kein gespeichertes Rezept ändert sich (Perspektive ist in 0 von 18 Rezepten > 0) |
| **2** | **Verdeckung je Entfernung, in Tiefenschichten.** Heute liegt *eine* Maske über allen Teilchen, weil alle dieselbe Tiefe hatten. Jetzt vier bis acht Bänder, jedes mit eigener Maske, von hinten nach vorn gemalt. Dann ist der Flügel, der halb hinter dem Pfosten steckt, auch halb weg — bildpunktgenau. | Kosten je Bild gemessen; die 3 Rezepte mit „Tiefe aus der Bildzeile" vorher/nachher als Bild gezeigt |
| **3** | **Das Auftreffen.** Letzte gesperrte Strecke, stumpfer Weg (Bahn durchlaufen). | Schleife exakt; der Ast an einem Bild mit Ast und Boden gezeigt |
| **4** | **Billig machen.** Merkzettel je Fallrunde, Rückfall auf den stumpfen Weg, wo er nicht greift. | bitgleich gegen Schritt 3 |
| **5** | **Die fünf Regler, die zwei Streichungen, die Ablage.** Ein Rezept muss den neuen Sinn tragen, nicht aus einer Vorgabe erben. | die betroffenen Altrezepte vorher/nachher gezeigt |
| **6** | **Perspektive.** Größe, Tempo, Strecke, Fächerbreite an einen Faktor, Obergrenze am Leerraum. | Augenschein |
| **7** | **Fächer in der Tiefe.** Dritte Komponente in `flugbahn`. | Augenschein; Schleife exakt |

**Gemessen wird genau zweimal:** was eine Tiefenschicht je Bild kostet, und was der Marsch kostet.
Alles andere steht hier oder ist Augenschein.

### Die Risiken, vorher benannt

1. **Die Schichten kosten.** Vier Leinwandgänge auf 898×889 sind nicht gratis. Rückweg: zwei
   Schichten, vorn und hinten — immer noch besser als heute.
2. **Eine Karte trennt gar nichts** (Spanne 0), drei weitere kaum (18, 44, 54). Dort gibt es keine
   Bodenfläche und keinen Vordergrund. Die Tabelle muss das **sagen**, nicht leer bleiben.
   Das Risiko ist damit kleiner als zuerst geschätzt: Caspar_D hat die zwölf schmalsten Karten
   angesehen und die Schwelle selbst gesetzt — *„die unterste zeile bei den gezeigten tiefenkarten
   trennt doch schon ganz gut"*, und das waren Spanne 126, 128 und 130. Vier von 325 sind also der
   ganze Fall, nicht dreißig.
3. **Gleichverteilt im Tiefenmaßstab ist eine Setzung**, keine Wahrheit — die Karte hat keinen
   Maßstab. Das gilt genauso für „wie weit nach hinten fächert ein Funke".

### Offene Punkte

1. **Wie das letzte Bild aussieht.** Der Kopf steht auf der Fläche; nimmt die Deckkraft über die
   letzten Körperlängen ab, oder endet es hart? Bei strichförmigen Arten (Regen) wird der Strich
   gekürzt statt ausgeblendet — dasselbe Verfahren, mit dem die Sternschnuppe heute ihren Schweif an
   der Grenze kürzt (acht Stützstellen, `sternBahn`).
2. **Was aus den fünf gespeicherten Partikel-Karten wird**, die das alte Betretungsverbot benutzen
   (3× „hinten", 2× „vorn"), und aus den drei mit „Tiefe aus der Bildzeile".
3. **Blasen** steigen aus Wasser, und Wasser erkennt die Karte nicht. Eher eine Quelle als die
   Bodenfläche.
4. **„Tiefe aus der Bildzeile"** (`verdecken`) gibt dem Teilchen heute eine *zweite* Tiefe aus seiner
   Bildzeile, mit einer anderen Normierung (`tiefeBei` statt `tiefeNahAn`). Mit einer echten Entfernung
   je Teilchen hat diese Zeile keinen Grund mehr. Streichen oder umbiegen — noch nicht entschieden.
