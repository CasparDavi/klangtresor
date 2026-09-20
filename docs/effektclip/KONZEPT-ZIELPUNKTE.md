# Die Ken Burns Fahrt, neu gefasst — Zielpunkte statt Läufe

Durchspezifiziert mit Caspar_D am 18.09.2026. Dieses Blatt ersetzt die Abschnitte 4 („Die Läufe")
und 6 („Die Regler") von `KONZEPT-KEN-BURNS-FAHRT.md`; die Klammer, die Zielsuche und die Parallaxe
stehen weiter dort.

---

## 1. Der Satz, aus dem alles folgt

> „wir fangen immer im Ganzbild an, dann zoomen wir während der Wanderung zum ersten Punkt —
> Suchen die Schärfe (ggf), verharren, laufen weiter, am Ende zoomen wir wieder aufs gesamtbild."
> — Caspar_D, 18.09.2026

Damit ist die Fahrt **eine einzige Bewegung**, nicht sechs Läufe:

```
Ganzbild → [ fahren+zoomen → fokussieren → verharren ] × n → Ganzbild
```

Der Zoom ist **kein eigener Schritt**. Er läuft während der Wanderung mit.

**Alle sechs Läufe fallen** („alle anderen Fahrten fallen"). Der Regler „Lauf" fällt mit. Was die
Läufe unterschieden hat, ist jetzt einfach die **Zahl und die Lage der Zielpunkte**: ein Punkt ist
Hineinfahren, zwei sind Zwei Stationen, vier sind eine Wanderung. Streifen und Abrastern fallen
ersatzlos — wer abrastern will, setzt vier Punkte.

**Die Naht schließt sich von selbst.** Anfang und Ende sind dasselbe Ganzbild. Die Frage, ob der
Lauf im Clip geschlossen bleiben muss, ist damit beantwortet, ohne dass jemand sie beantworten
musste.

---

## 2. Was ein Zielpunkt ist

| | woher |
|---|---|
| **Ort** | gesetzt — in Anteilen der **Quelle**, nicht der Leinwand |
| **Enge** | gesetzt — wie nah dieses eine Bild herangeht |
| **Tiefe** | **gelesen**, aus der Tiefenkarte an diesem Ort |

Die Tiefe ist kein Regler: sie steht im Bild, also liest die Software sie. Fehlt die Karte, hat der
Punkt keine Tiefe — die Fahrt läuft trotzdem, nur das Fokussieren bleibt still und sagt warum.

Der Ort liegt in **Quellkoordinaten**, weil die Leinwand während der Fahrt einen wandernden
Ausschnitt zeigt; ein Punkt, der an der Leinwand hinge, würde durch das Motiv wandern.

**Höchstens fünf.**

---

## 3. Der Effekt ist nie leer

Beim Einfügen kommen **zwei Zielpunkte mit**, die das Bild vorschlägt (Detaildichte plus
Tiefenkante, die vorhandene Zielsuche). Man schiebt sie an die richtige Stelle oder löst sie und
setzt eigene.

Das ist der einzige Ort, an dem die automatische Suche noch läuft: **einmal beim Einfügen, als
Vorschlag.** Danach gehören die Punkte dem Nutzer. Es gibt keine dauernde Suche mehr, keine
Vorgabe, kein Preset, das sie einschaltet.

**Warum zwei und nicht einer:** mit einem Punkt zoomt die Kamera nur hinein und wieder heraus. Erst
mit zweien *fährt* sie.

---

## 4. Die Reihenfolge ist die Choreografie

Die Punkte werden in der Reihenfolge abgefahren, in der sie gesetzt wurden. Das ist die ganze
Choreografie und sie braucht keinen Regler.

---

## 5. Die Zeit rechnet die Software

Bei n Punkten: **n+1 Züge** (Ganzbild → 1, 1 → 2, …, n → Ganzbild) und **n Halte**. Passt das nicht
in die Cliplänge, ist es nicht die Aufgabe des Nutzers, das auszurechnen — **die Zeile unter der
Liste sagt, wie viele Punkte hineinpassen.**

**Die Halte sind alle gleich lang** und ergeben sich aus dem Rest. Kein Regler.

„Tempo" bleibt, wie es ist: über wie viele Takte ein Zug läuft.

---

## 6. Fokussieren bei Ankunft

Drei Stellungen:

| | |
|---|---|
| **aus** | die Schärfe bleibt, wo sie ist |
| **gerichtet** | die Schärfenebene zieht auf die Tiefe des Punkts und sitzt |
| **suchend** | sie geht darüber hinaus und kommt zurück — ein Schärfezieher, der den Punkt **sucht** |

Es geschieht **im Halt**, nicht im Zug: die Kamera kommt an, dann zieht die Schärfe nach. Im
**Ganzbild** am Anfang und am Ende ist **alles scharf**.

Gebaut wird es nach Tiefenbändern, und das ist eine bewusste Umkehr gegenüber der Parallaxe:

> Eine **Verschiebung** lässt sich nicht überblenden — zwei verschieden weit geschobene Ebenen halb
> übereinander geben ein Doppelbild. Eine **Weichzeichnung** lässt sich überblenden: halb blur(2)
> über halb blur(6) sieht aus wie dazwischen.

Wie viele Bänder, entscheidet die Messung, nicht die Meinung.

---

## 7. Die Parallaxe ist standardmäßig aus

Vorgabe **0**. Wer sie will, schaltet sie ein. Alles andere an ihr bleibt, wie es am 18.09.2026
gebaut und gemessen wurde.

---

## 8. Die alte „Fahrt" fällt

> „sie fällt, es ist eine Untermenge von dem, was wir jetzt schon haben" — Caspar_D

Im Archiv liegen 20 Rezepte, **genau eines** benutzt sie. Es wird übersetzt, nicht verloren
(Hausregel 12). Der Code wird gelöscht, die Begründung bleibt als Kommentar (Hausregel: totlegen
nur mit löschen).

Sie fällt **zuletzt** — erst wenn die neue Fahrt gewonnen hat.

---

## 9. Die Bedienung: die Geste des Glockenstuhls

> `/* Die Punkte SIND die Regler */` — Kommentar im Equalizer, 20.08.2026

| Geste | was sie tut |
|---|---|
| Klick auf freie Fläche | neuer Zielpunkt, hinten angehängt |
| Ziehen auf einer Marke | sie verschieben |
| Mausrad über einer Marke | ihre Enge |
| **Doppelklick auf eine Marke** | **löst sie** |

Caspar_D, 18.09.2026: *„wenn glockenstuhl doppelklick ist, dann hier auch"* — also kein Rechtsklick.

Solange die Karte offen ist, zeigt die Bühne das **ganze Bild** und die Fahrt steht; sonst ließe
sich auf ein wanderndes Bild kein Punkt ins Motiv setzen. Beim Zuklappen läuft sie wieder.

**Marken sind Bedienung, kein Bild.** Sie dürfen niemals in den Export und niemals in die Kachel.

---

## 10. Der Weg, in drei Schritten

Caspar_D, 18.09.2026: *„wir machen dinge fertig und nicht alles zugleich — ich will Fortschritt
sehen."* Jeder Schritt wird gezeigt, bevor der nächste anfängt.

| # | Schritt | Nachweis |
|---|---|---|
| **1** | **Die eine Fahrt**: Läufe fallen, Zielpunkte als Daten, zwei beim Einfügen, die Marke auf der Bühne, Parallaxe aus. | Syntax; Naht über alle kenburns-Fälle; die 193 Fälle gegen `studio-parallaxe.json` — außer Ken Burns darf sich **nichts** ändern; Marken nicht im Export |
| **2** | **Fokussieren bei Ankunft** (aus \| gerichtet \| suchend). Davor die Kosten der Weichzeichnung je Tiefenband messen. | die Zahl vor der ersten Zeile Code; danach Naht und Augenschein |
| **3** | **Die alte „Fahrt" fällt**, das eine Rezept wird übersetzt. | vorher/nachher an diesem Rezept |

**Der Nachweis wird auf das Risiko zugeschnitten.** Caspar_D, 18.09.2026: *„du hast jedesmal die
5 h Testmaschinerie angeworfen, damit war es eben nicht nur eine Zeile."* Grundlinienvergleich für
alles, was den gemeinsamen Malweg anfasst — eine Messreihe über den Bestand nur dann, wenn eine
Zahl im Code oder in der Oberfläche daraus hervorgeht.

---

## 12. Die Tiefenschärfe — durchspezifiziert am 19.09.2026

**Berichtigung zuerst.** In Abschnitt 6 stand „Fokussieren bei Ankunft" als Sache der Tiefenbänder,
und ich hatte sie später für erledigt erklärt, weil Caspar_D die Bewegungsunschärfe bestellt hatte.
Das war falsch. Sein Satz war:

> „Ich weiss, dass die Schärfe Tiefenabhängig ist, könnte man **bei den Videos nicht wenigstens** so
> tun, als ob man am Ziel nochmal scharf stellt?"

Also: ein **Ersatz für Videos**, nicht ein Ersatz für die Tiefenschärfe. Ich habe aus „zusätzlich"
ein „stattdessen" gemacht und damit etwas entschieden, was nie spezifiziert war. Caspar_D:
*„tiefenschärfe, hab ich gar nix zu gesagt, du hast das einfach entschieden obwohl nie spezifiziert
wurde, wie das bild reagieren soll."*

### Die Regel

> „die lokalisation des zielpunkts ist scharf · der rest wird weicher · nur im halt, aber nicht
> plötzlich sondern als prozess · theoretisch dürfte es nur eine übergangszeit geben, bis die
> tiefenkarte da ist, fallback meinetwegen bewegungsunschärfe"
>
> „20% der gesamttiefe werden scharf, der rest unscharf · und ich meine die **tiefennachbarschaft
> des zielpunktes**" · „ja, geschnitten, nicht verschoben"

Daraus:

| | |
|---|---|
| **Scharf** | alles, dessen Nähe um höchstens **±10 %** von der Nähe des **Zielpunkts** abweicht — zusammen 20 % der Gesamttiefe |
| **Weich** | alles andere, und zwar **immer weicher, je weiter von der Ebene entfernt** — wie bei einem Objektiv |
| **Am Rand** | liegt der Zielpunkt ganz vorn oder ganz hinten, wird das Band **abgeschnitten, nicht verschoben** — vor dem Vordersten ist nichts, was unscharf werden könnte |
| **Wann** | **nur im Halt**, und als **Prozess**: nicht schlagartig, sondern über die Haltzeit |
| **Ohne Karte** | Rückfall auf die **Bewegungsunschärfe**. Das ist ein Übergang, kein Zustand — sobald die Tiefenspur für Bewegtbilder steht, fällt der Unterschied weg |

**Das scharfe Band wandert mit jedem Punkt.** Ein Punkt auf dem Gesicht stellt das Gesicht scharf,
der nächste auf dem Hintergrund stellt den Hintergrund scharf und lässt das Gesicht weich werden.
Das ist der Zug, den man sehen will.

### Warum das billig ist

**Zwei Zonen, nicht viele Bänder.** Eine scharfe Ebene und ein weicher Rest heißt *eine*
Weichzeichnung und *eine* Maske — die weiche Grenze können die Tiefenmasken im Haus schon
(`tiefeMaske` mit Grenze und Weichheit). Das ist der Unterschied zwischen einem Vollbildgang und
einem Bänderstapel, und er kommt aus Caspar_Ds eigener Formulierung.

### Wie die beiden Unschärfen zusammenpassen

**Die Bewegungsunschärfe gehört zum Zug, die Tiefenschärfe zum Halt.** Das eine ist die Kamera, die
fährt, das andere die Kamera, die angekommen ist und nachfasst. Sie konkurrieren nicht.

### Die drei letzten Antworten (19.09.2026)

1. **„der rest wird immer weicher — wieviel, weiss ich doch nicht, mach was generisch gut
   aussehendes."** Also zunehmend, nicht eine Weichheit. Wie stark, ist damit **meine** Sache und
   keine Einstellung; es wird gemessen und begründet, nicht geraten.
2. **Die Spalte bekommt eine vierte Stellung, und sie heißt „Tiefenebene"** — nicht „Tiefe". Ohne
   Karte fällt sie auf die Bewegungsunschärfe zurück.
3. **„er kommt und geht."** Der Prozess baut sich im Halt auf und löst sich im Halt wieder. Damit
   ist er am Ende des Halts bei null, der nächste Zug startet ohne Rest, und die Naht bleibt von
   selbst geschlossen — dieselbe Bauform wie beim Nachfassen der Stellung „Suche".

### Die Spalte „Fokus bei Ankunft", vollständig

| Stellung | im Zug | im Halt |
|---|---|---|
| **Scharf** | nichts | nichts |
| **Unscharf** | schmiert | scharf, sofort |
| **Suche** | schmiert | scharf, mit Nachfassen |
| **Tiefenebene** | nichts | die Tiefenebene des Punktes bleibt scharf, der Rest wird weicher — kommt und geht |

Ohne Tiefenkarte wird aus **Tiefenebene** die Bewegungsunschärfe, und die Zeile sagt es.
