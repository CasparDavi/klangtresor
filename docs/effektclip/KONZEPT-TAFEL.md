# Konzept: die Effektclip-Tafel

Stand 26.09.2026, aus dem Brainstorm mit Caspar_D am selben Tag. Es ist noch nichts gebaut. Das
Blatt sammelt, was entschieden ist (mit Wortlaut), was daraus folgt, und was offen bleibt. Wer
etwas anderes baut, ändert erst dieses Blatt.

## 1. Der Anlass

Caspar_D: *„Ich schaue dem Effektclip-Studio eher gerade passiv beim Wachsen zu, und es braucht
doch gewisse Leitplanken, damit daraus kein Wildwuchs wird."* Die Fragen dahinter: Sollen
verschiedene Medien verschiedene Effektketten bekommen? Brauchen lange Stücke zeitabhängigen
Einsatz der Effekte und dynamische Parameter — *„variabler Schneefall, Schnee wird zu Regen, die
Farbe des Regens ändert sich von weiß zu blutrot, immer, wie es zum Song passt"*? Und der untere
Teil des Bedienungskarussells soll *„eher wieder registermäßig"* werden.

## 2. Entscheidungen (mit Datum)

| Entscheidung | Wortlaut Caspar_D | Datum |
|---|---|---|
| Der Song wird **abschnittsweise** gestaltet; ein Titel ohne Grenzen ist ein Abschnitt | „Wir arbeiten abschnittsweise. Der Song ist erstmal ein Abschnitt." | 26.09. |
| Grenzen kommen **automatisch** aus einer Abschnittswahrheit, wie die Grenzen der Tiefenkarte | „Wie bei den Tiefenabschnitten in der Tiefenkarte können automatisch Grenzen eingefügt werden; der Standard wäre durch die Whisper-Spracherkennung und die Suno-Abschnittsgrenzen eine Abschnittswahrheit, die Intro, Outro, Strophen, Chorusse etc. abbildet." | 26.09. |
| **Je Abschnitt ein Effektclip** im heutigen Sinne; der Song ist eine Reihe davon | „Jeder Abschnitt bekommt etwas, was z. Z. in einem Effektclip abgebildet wird. Eigentlich ist jeder Song dann eine Aneinanderreihung von Effektclips im heutigen Sinne." | 26.09. |
| Der Ort heißt **Effektclip-Tafel** | „Effektclip-Tafel" — „gut" (Alternativen: Szenen-Tafel, Effektclip-Dramaturgie, Effektclip-Reihe/Reihung) | 26.09. |
| **Teilen erbt**: beide Hälften bekommen den Effektclip, jede ist danach für sich | „Wenn ich einen Abschnitt nochmal splitte, erben beide Abschnitte den Effektclip und ich kann jeden einzeln modifizieren? Würde ich so machen." | 26.09. |
| Effektclips lassen sich in andere Abschnitte **kopieren** | „Kann man Effektclips kopieren und in einen anderen Abschnitt einfügen?" — ja, mit der Ablage | 26.09. |
| Der Grenzen-Editor zeigt die **Hüllkurve** und spielt den Ton | „Sieht man die Hüllkurve und hört den Sound? Ich würde sagen, ja. Die Hüllkurve als Pendant der Histogramme bei der Tiefenkarte." | 26.09. |
| Die **Quellen werden ein Vorrat** mit n Stücken, Fotos und Videoschnipsel, je Abschnitt eines | „Dann müssen wir aber auch Videos oder Standbilder für Abschnitte definieren können; die Quellen müssen auf n Elemente erweitert werden." | 26.09. |
| **Hook und ganzer Titel** sind Fenster auf dieselbe Reihe | „Dann ist das Gesamtvideo also eine Erweiterung des Hooks — aber selbst Hooks können schon aus mehreren Szenen bestehen, nur eben weniger." | 26.09. |
| Am Abschnittswechsel wird **geblendet** | „Szenen pro Abschnitt definieren ist sehr vernünftig und sie am Szenen-Wechsel ineinander blenden lassen." | 26.09. |
| Die **Tiefe** bekommt einen eigenen Karusselleintrag | „ob wir bei der Vorbereitung die Tiefe herauslösen und ihr einen völlig eigenen Karusseleintrag zuweisen" | 26.09. |

## 3. Die Wörter

* **Abschnitt** — eine Zeitspanne des Songs zwischen zwei Grenzen. Namen kommen aus der
  Abschnittswahrheit (Intro, Strophe, Refrain, Bridge, Outro) oder vom Nutzer.
* **Effektclip** — unverändert die Einheit von heute: Quelle, Vorbereitung, Effektkette, Schleife,
  gesichert als Rezept (Fassung 7). Ein Effektclip gehört zu genau einem Abschnitt.
* **Effektclip-Tafel** — der Ort: Grenzen, je Abschnitt ein Effektclip, die Hüllkurve, der Player.
  „Die Reihe der Effektclips" ist die Abfolge, kein zweiter Name.
* **Vorrat** — die Medien eines Titels, aus denen ein Effektclip seine Quelle wählt: Titelbild,
  Cover, Bewegtbild, eigene Fotos und Videoschnipsel, jedes mit seiner Tiefe.
* **Ausgabe** — ein Fenster auf die Reihe: Haus (Kachel und Bühne, live), Snippet (10 s als
  Schleife), Hook (von Marke bis Marke), ganzer Titel.

Kein drittes Wort für Abschnitt plus Effektclip („Szene"); kein Wort für zwei Dinge.

## 4. Die Leitplanken

1. **Ein Titel, eine Reihe.** Es gibt keine Kette je Ausgabe. Was sich je Ausgabe unterscheidet, ist
   das Zeitfenster und was in diesem Fenster wegfällt (heute schon: Karaoke und Auftritt im
   Zehnsekünder, die Karte sagt es).
2. **Zeit kommt aus dem Song.** Grenzen liegen auf Abschnitten und rasten auf die Eins; nichts hängt
   an Sekundenzahlen. Wo die Abschnittswahrheit fehlt, gibt es einen Abschnitt.
3. **Abschnitte statt Kurven.** Was sich über die Länge ändert, ist ein anderer Effektclip im
   nächsten Abschnitt. Die Software blendet am Wechsel über einen Takt: Quelle und Kette zugleich,
   ein Effekt, der im nächsten Abschnitt fehlt, blendet aus, ein neuer ein. Kurven je Parameter gibt
   es nicht — das wäre der Wildwuchs.
4. **Altes bleibt gültig.** Ein Rezept ohne Tafel ist ein Abschnitt über den ganzen Song mit der
   einen Quelle von heute (Regel 12 der Texteffekte gilt hier ebenso: alte Rezepte malen dasselbe
   Bild). Der Zehnsekünder bleibt, wie er ist.
5. **Jede Karte behält das Versprechen** (Regel 11) in jedem Abschnitt und jeder Ausgabe: derselbe
   Regler heißt und bedeutet dasselbe; malt er in dieser Ausgabe nichts, sagt es die Karte.
6. **Nichts am KlangTresor vorbei.** Neue Stücke des Vorrats kommen durch die App in den Titel
   (Upload), ihre Tiefe rechnet der Morgenlauf; im Archiv wird nichts von Hand gelegt.

## 5. Die Tafel, wie sie aussieht

Skizze vom 26.09. (Übergabe §34): über der Hüllkurve je Abschnitt die Kachel seines Effektclips;
die Hüllkurve mit den Schlägen als Ticks; die Grenzen als Griffe — Klick setzt, Doppelklick
entfernt, Ziehen verschiebt, rastet auf die Eins (die Bediensprache aller Flächen mit gesetzten
Punkten); der Spielkopf des Players, gestrichelt, Klick auf die Hüllkurve springt hin; darunter die
Abschnittsnamen mit Zeiten. Beim Ziehen einer Grenze spielt der Player einen Takt vor und einen
Takt nach der Grenze, so hört man den Schnitt.

**Teilen** kopiert den Effektclip in beide Hälften; **Zusammenlegen** behält den vorderen, der
hintere fällt (Vorschlag, offen). **Kopieren/Einfügen** ist die bestehende Ablage des Studios
(`mysuno-tbs-ablage`), die schon heute über Titel hinweg trägt. Ein Klick auf die Kachel eines
Abschnitts öffnet das Studio für diesen Effektclip; das Studio bleibt, wie es ist, und weiß nur,
zu welchem Abschnitt es gehört.

## 6. Das Karussell des Studios

Reihenfolge nach dem Weg des Bildes: **Quelle** (aus dem Vorrat) · **Tiefe** (Tiefenkarte, Zonen,
Grenzen — neu, eigener Eintrag, hängt am Vorratsstück) · **Vorbereitung** (nur noch Farbe und Ton:
Sättigung, Gradation) · **Effektkette** · **Ausgabe** mit vier Registern:

| Register | Zeit | Takt | Text | Eigenes |
|---|---|---|---|---|
| Haus | Songzeit, live | voll | Karaoke, Auftritt | Kachel und Bühne |
| Snippet | 10 s als Schleife | fällt nach der ersten Runde | ohne | die Schleife (heute eigener Karusselleintrag, wandert hierher) |
| Hook | von Marke bis Marke, echte Zeit | voll | Karaoke; Auftritt am Anfang, Abgang am Ende | zwei Zeitmarken, Ton |
| ganzer Titel | 0 bis Ende | voll | Karaoke, Auftritt | Ton, Format |

Sichern, Löschen, Kopieren, Einfügen gehören zum Rezept, nicht zur Ausgabe, und bleiben bei der
Kette. Was eine Ausgabe sich merken muss (Schleife, Hook-Marken), liegt beim Titel neben der Reihe.

**Hook-Marken:** zwei Marken auf der Tafel, rastend auf die Eins; die Software schlägt einen Hook
vor, wenn sie die Abschnitte kennt (etwa den ersten Refrain), der Nutzer verschiebt. Wie lang Suno
einen Hook erlaubt und in welchem Format, ist zu prüfen, bevor eine Zahl im Regler steht.

## 7. Die Abschnittswahrheit

Was im Haus schon liegt (geprüft an Auftakt, 26.09.):

* `abschnitte` im Katalog: Sunos Strukturanalyse mit `peak_times` und `segment_labels` (A, B, C —
  welche Teile sich gleichen), Zustand `complete`.
* Die Regiezeilen der Suno-Lyrik (`[Intro]`, `[Verse]`, `[Chorus]` …), die `bin/lyrik.js` erkennt
  und aus der bereinigten Lyrik streicht — sie geben den Segmenten Namen.
* Die Whisper-Zeiten der Zeilen (bereinigte Lyrik) — sie legen die Grenzen an die gesungene Zeit.
* `wellenStufen` im Katalog: die Hüllkurve als Stufenpyramide in zwölf Auflösungen.
* Die Schläge (`schlaege`) mit der Eins.

Der Morgenlauf führt die drei ersten zusammen zu einer Abschnittsliste je Titel (Name, von, bis,
Quelle der Grenze), wie er die Tiefenkarte rechnet; die Tafel zeigt sie als Vorschlag, der Nutzer
verschiebt. Ohne Lyrik oder ohne Analyse: ein Abschnitt.

## 8. Das Rezept

Heute: `eigen-effekt.json` je Titel, Fassung 7, ein Effektclip. Künftig trägt der Titel zusätzlich
die Reihe: Grenzen und je Abschnitt ein Rezept im heutigen Format, dazu Schleife und Hook-Marken
neben der Reihe. Ein Titel ohne Reihe liest sich wie heute (Leitplanke 4). Das genaue Format ist
Teil des Baus, nicht dieses Blatts; Regel 12 der Texteffekte (Altwerte behalten ihre Bedeutung) gilt.

## 9. Der Bau, in Schritten, jeder mit seiner Probe

1. **Abschnittswahrheit** im Morgenlauf: Liste je Titel aus Suno-Analyse, Regiezeilen, Whisper;
   Prüfung an zehn Titeln gegen das Ohr (Caspar_D). Ohne Oberfläche.
2. **Karussell**: Tiefe als eigener Eintrag, Ausgabe mit vier Registern, Schleife ins Snippet.
   Reines Sortieren, keine neue Fähigkeit; Probe: Labor-Studio, Prüfstand unverändert.
3. **Tafel** mit einem Abschnitt: Hüllkurve, Schläge, Spielkopf, Kachel des einen Effektclips;
   Klick öffnet das Studio. Probe im Sandkasten.
4. **Grenzen**: setzen, entfernen, ziehen, rasten, hören; Teilen erbt; Reihe im Rezept; Übergang
   am Wechsel über einen Takt. Probe: Prüfstand mit Fällen über eine Grenze (Naht und Vorschau).
5. **Hook**: zwei Marken, Fenster als Export; vorher Sunos Hook-Regeln prüfen.
6. **Vorrat**: Upload durch die App, Tiefe im Morgenlauf, Quelle je Effektclip aus dem Vorrat.

Reihenfolge nach Nutzen und Risiko; jeder Schritt lässt den vorigen Stand nutzbar zurück.

## 10. Offen

* Dürfen Grenzen auch innerhalb eines Abschnitts der Wahrheit liegen (freie Marke auf der Eins)?
  Vermutlich ja — die Wahrheit ist Vorschlag, nicht Gesetz.
* Zusammenlegen: bleibt der vordere Effektclip (Vorschlag) oder fragt die Tafel?
* Wie lang darf der Übergang sein: ein Takt fest, oder je Abschnittswechsel aus der Musik?
* Sunos Hook: Länge, Format, Hochformat?
* Ein Wort für den Vorrat, wenn er auf der Oberfläche steht.

## 11. Was nicht dazugehört

Kurven je Parameter, Keyframes, eine Zeitleiste je Effekt. Verschiedene Ketten je Ausgabe. Medien
von Hand im Archiv.
