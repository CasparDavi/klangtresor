# Tagesbericht 10.09.2026 — das Effektclip-Studio

44 Commits zwischen 00:07 und 19:58, alle auf `main` (`52a7e85` … `b49daa6`). Ein Tag, ein Thema: aus dem
„dynamischen Titelbild" wurde der **Effektclip** mit seinem **Effektclip-Studio** — ein Bild oder Video je Titel,
auf das eine Effektkette gemalt wird, live im Takt des Songs, nichts wird gebacken.

## Nacht (00:07–02:03): der Vorrat wird groß
- `52a7e85` Das dynamische Titelbild als Rezept am Song, live gemalt — der Grundstein.
- `23d3021` `1269a2b` Theaternebel mit Turbulenz („Änderung pro Ort"), Feuer aus Zungen.
- `5893752` `736ffec` WebGL-Stufe (Rauschen aus `web/fremd/webgl-noise`, MIT) und 16 neue Effekte: Wellen, Kaustik,
  Linse, Dunst, Flammen, Lichtstrahlen, Spiegelung, Filmkorn, Glitch-Blöcke, Farbton, Kippen, Partikel-Arten.
  Verrechnung vollständig: 17 Canvas-Modi, gruppiert.
- `2b4301a` Endlosrekursion beim Verlassen einer Kachel behoben.
- `fe51c74` `4a4081b` Plan und Labor-Abnahme für den Quellen-Blätterer.

## Morgen (07:53–10:30): Quellen, Videos, Bühne, Name
- `f91ec81` Entscheidung: Quellen und Rezepte getrennt. **Vorgaberegel** je Titel: Effektclip > jüngstes eigenes
  Video > Suno-Video > eigenes Titelbild > Suno-Titelbild. Ein Rezept je Titel, seine Quelle darf Bild oder Video sein.
- `652df25` Quelle-Blätterer, Video als Malgrund (stumm, am Player-Takt), Duplizieren, Pult zweigeteilt.
- `e015dbb` Mehrere eigene Videos je Titel (`eigen-2.mp4` …), Karte „Bewegtbild" als Liste, das jüngste spielt.
- `87b46a8` Bühne: die Vorgabe läuft; bei Maus im Bild erscheint die flüchtige Leiste **eines | alle | blättern**
  („alle" wechselt an Abschnittsgrenzen). Standbild bleibt still.
- `598e31f` Gruppe **Glas**: Risse, Beschlag, Tropfen treffen, Tropfen laufen.
- `c5e919c` **Effektclip** und **Effektclip-Studio** — Lebendbild, dynamisches Titelbild und Titelbild-Studio abgelöst.
- `f1f360a` Einbau in-place über Marker im Haus statt Neubau vom Schnappschuss.

## Nachmittag (15:15–16:51): Bedienung nach Jörgs Spezifikation
- `a683108` Stiller Einstieg (leere Kette, Erklärtext mit Beispiel-Link), Quelle als Vorschaubilder samt Testbild und
  zwei Testporträts, Kette als Tabelle mit Kopfzeile, Akkordeon (nur eine Karte offen), Kopfzeile an|solo|Symbol|
  Effekt|Nr.|Kopie|×|↑|↓|auf/zu.
- `4ab1965` **Vorbereitung**: statische Bildanpassung vor der Kette (Histogramm, Gradation, Belichtung, Kontrast,
  Lichter, Schatten, Sättigung, Temperatur, Farbton, Sepia, Schärfe) nach dem Muster von Apples Vorschau.
- `6892cba` … `25f6d29` Beschriftung nur an der gewählten Quelle; `f7c6aca` Kopfzeile erst ab zwei Effekten;
  `300e514` … `5886bed` Vorbereitung startet zugeklappt, „Anpassung löschen", Fuß gedimmt bis etwas angewendet ist,
  eigene Auswahlliste mit Gruppen- und Effektsymbolen, Kopf ragt nicht mehr über den Kasten.
- `490b8d7` `8773b06` „Rezept" ist Entwicklersprache — in der Oberfläche heißt es **Effektkette**.

## Abend (17:09–18:57): Licht wird Beleuchtung
- `131f50b` Lichter als **Farbig abwedeln**, Schatten nachbelichten, Nebel bleibt Screen, tiefschwarzer Grund;
  Preset „Licht im Nebel". `40131c5` Laserfächer immer von außerhalb. `7843443` `518970d` Feuer, Flammen, Partikel
  leuchten selbst und behalten ihre Vorgabe.
- `6b8bc96` **Lichtmischpult**: ein Antrieb (LFO) für alle Lichter — Takt, Eins, zufällige Schläge, Frequenz;
  Muster als Kurvenbilder (Rampen, Spitzen, Rechteck, Sinus, Zufall), Tiefe, Versatz, invers, Vorschau.
- `79c27b8` **Lichtsequenzer**: Muster „Sequenz" — gemalte Schritte je Periode wie an einer Drum-Machine, Vorlagen.
- `76e9903` `3a8b665` **Raum-Block** für Scheinwerfer und Schatten: Ursprung/Ziel, Bewegung bis zum Moving Head
  (Fahrt, Schritt), Plateau mit Kante, Hotspot, Ellipse mit Gefälle, Kegel, Blenden (Gobo), Profilgrafik mit Fleck.
- `9ac4ae9` Theaternebel: Dichte 0 ist wirklich durchsichtig (war die Schwaden-Zahl).

## 19:58: der große Tiefen-Check (`b49daa6`)
Messreihe im Labor über alle 38 Effekte (jeder Regler Minimum, Mitte, Maximum; jede Auswahl, jeder Schalter, jede
Farbe; mittlere Pixelabweichung), Zeitscans für Ereignis-Effekte, fünf Leser Register gegen Maler, je Befund ein
Skeptiker: 61 bestätigte Befunde, daraus 20 Fehlerpunkte. Alle behoben, dann Gegenleser über den Diff (13 weitere
Punkte, ebenfalls behoben). Beispiele: Sicherungswackeln war unsichtbar (Schwarz abgewedelt), Kaustik brannte das Bild
aus, die Antrieb-Tiefe des Stroboskops war tot, Vorlagen trugen alte Schlüssel, die Linsen der Tropfen ignorierten die
Stärke, die Linse war verkehrt herum, die Pulse überschrieben sich, der Laser war praktisch nicht zu sehen.
**Stärke-Regel** (jetzt im Modulkopf, im Handbuch unter „die Stärke" und als Tooltip): Stärke ist immer die Deckkraft,
0–100 %; alle anderen Regler formen den Effekt; Schlag, Tiefe und Dichte sind weg; Geometrie und reine Verzerrer haben
keinen Stärke-Regler. Ablagen tragen `fassung: 2`, ältere werden beim Laden gefaltet und übersetzt.

## Was der Nutzer heute Abend hat
Ein Studio, das aus jedem Titel einen Effektclip macht: Quelle wählen, Vorbereitung, Effektkette aus 38 Effekten in
neun Gruppen, Lichtmischpult mit Sequenzer, Raum-Block, Verrechnung und Stärke je Karte, Presets — und beim Sichern
malen Kachel und Bühne es live im Takt. Offen für die nächste Runde: Raum- und Zeitmuster auch für Laser, Konfetti-
kanonen, halbdurchsichtige Vorhänge; die vorhandenen Effekte auf bessere Parametrisierungen durchgehen (erst Diskussion).

## Discord-Beitrag (Entwurf in Jörgs Ton)
```
Heute war Effektclip-Tag im KlangTresor. Was das ist: zu jedem Titel kann jetzt ein Bild oder Video liegen, auf das
eine Effektkette gemalt wird, live im Takt des Songs. Nichts wird gerendert, nichts wird gebacken, die Kachel und die
Bühne malen es einfach, während der Titel läuft.

Was man im Effektclip-Studio machen kann:
- Quelle wählen: Suno-Titelbild, Suno-Video, eigene Videos (auch mehrere je Titel, das jüngste spielt) oder eigene
  Bilder. Zum Probieren gibt es ein Testbild und zwei Testporträts.
- Vorbereitung: Gradation, Belichtung, Kontrast, Lichter, Schatten, Sättigung, Temperatur, Farbton, Sepia, Schärfe,
  wie in Apples Vorschau, nur vor der Kette.
- Effektkette: 38 Effekte in neun Gruppen. Pulse im Takt (Helligkeit, Zoom, Schärfe, Kontrast, Sättigung, Farbton,
  Kippen, RGB), Blitze (Stroboskop, Sicherungswackeln), Läufe (Scheinwerfer, Schatten, Laser, Farbschleier,
  Theaternebel, Feuer), Störungen, Anmutung (Scanlines, Bloom, Nachzieh), Partikel (Schnee, Regen, Asche, Funken,
  Blasen, Staub, Blätter), Glas (Risse, Beschlag, Tropfen) und die WebGL-Entwürfe (Wellen, Kaustik, Linse, Dunst,
  Flammen). Jeder Effekt beliebig oft, jede Karte mit Verrechnung und Stärke.
- Lichtmischpult: ein Antrieb für alle Lichter, im Takt, auf der Eins, auf zufälligen Schlägen oder mit fester
  Frequenz, Muster als Kurven, dazu ein Lichtsequenzer, den man wie eine Drum-Machine malt.
- Raum-Block für Scheinwerfer und Schatten: wo das Gerät hängt, wohin es leuchtet, wie es fährt (bis zum Moving
  Head), Fleck mit Plateau, Kante und Hotspot, Kegel, Blenden wie Gobos.
- Sichern, fertig. Die Bühne zeigt bei mehreren Videos eine kleine Leiste: eines, alle, blättern.

Heute Abend lief dann der große Tiefen-Check: jeder Regler jedes Effekts gemessen, ob er wirklich tut, was drauf-
steht. 20 Fehler gefunden und behoben (die Sicherung war unsichtbar, die Kaustik brannte das Bild aus, der Laser war
kaum zu sehen). Und eine Regel, die ich mir schon lange gewünscht habe: Stärke ist immer die Deckkraft, 0 bis 100
Prozent, alles andere formt den Effekt. Doppelte Regler sind raus.

Tipp zum Einstieg: leise anfangen. Ein Helligkeitspuls, ein Schatten kaum sichtbar, ein Hauch Nebel. Das wirkt mehr
als jede Wucht.
```
