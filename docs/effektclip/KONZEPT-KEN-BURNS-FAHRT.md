# Ken Burns Fahrt — Spezifikation

**Stand 17.09.2026.** Caspar_D: *„wir nennen das ding Ken Burns Fahrt / und wir bauen es so, dass es
endlich gut ist."*

Neuer Effekt **neben** der alten „Fahrt", nicht an ihrer Stelle (Hausregel: Neubau neben dem Alten,
eigener Name, keine Übersetzung — das Alte fällt erst, wenn das Neue gewonnen hat). Damit bleibt jedes
gespeicherte Rezept unberührt, ohne Beweisführung.

---

## 1. Warum die alte Fahrt lahm wirkt

Der ganze Effekt steht in einer Zeile (`web/index.html`, `zeichneFrame`):

```js
crop *= (1-(1-e.zoom)*s);
panx += tri(t/lpP(e.tempo))*e.weite*s;
pany += tri(t/lpP(e.tempo*1.3))*e.weite*s;
```

Daraus folgt der Befund, und er hat nichts mit dem Tempo zu tun:

- **Sie zoomt nicht.** `crop` ist über die Zeit konstant. „Ausschnitt" setzt eine feste Vergrößerung.
  Der Effekt heißt Fahrt und fährt nicht.
- **Die Bewegung ist eine Dreieckschwingung.** `tri` läuft linear hin und linear zurück, mit einem
  Knick am Umkehrpunkt. Konstantes Tempo, kein Anfahren, kein Auslaufen, **kein Stillstand**.
- **Sie hat kein Ziel.** x und y schwingen mit Tempo und Tempo × 1,3 — eine Lissajous-Figur. Der
  Ausschnitt zieht herum, ohne irgendwo anzukommen.
- **„Weite"** ist die Amplitude dieses Wanderns, als Anteil des überhaupt möglichen Wegs (Vorgabe
  0,24). Caspar_D kannte die Bedeutung nach Wochen nicht — ein Regler, der seinen Namen verfehlt.

Caspar_D: *„ich sehe momentan einen eingezoomten Ausschnitt, der irgendwie unmotiviert rumwandert."*

---

## 2. Was Ken Burns anders macht

Fünf Dinge, keines davon heute im Code:

1. **Die Bewegung ist eingeklammert.** Sie beginnt auf einem stehenden Bild und endet auf einem
   stehenden Bild. Ohne die Ruhe davor und danach hat die Bewegung keinen Bezug — man sieht kein
   Fahren, nur Treiben. **Das ist die Ursache von „lahm".**
2. **Ein Zug je Bild.** Ein Hineinfahren *oder* ein Zug zur Seite, kein Rundgang.
3. **Weich anfahren, weich auslaufen**, in der Mitte gleichmäßig.
4. **Das Endbild ist komponiert** — es ist selbst ein Foto. Deshalb plant man Anfangs- und Endbild,
   nicht eine Bewegungsrichtung.
5. **Der Zug ist motiviert.** Die Kamera geht auf das zu, wovon erzählt wird, und kommt an, wenn es
   genannt wird. Das Ankommen ist der Punkt.

Punkt 5 ist nicht zu kopieren — wir haben keinen Erzähler. Wir haben zwei Dinge, die er nicht hatte:
**die Musik und die Tiefenkarte.**

---

## 3. Das Gesetz

> **Halten · fahren · halten.** Weich an, weich aus. Die Fahrt landet auf der Eins.

**Getaktet, nicht in Sekunden.** Der Regler „Tempo" sagt nicht mehr „Periode einer Schwingung",
sondern **über wie viele ~~Takte~~ Schläge die Fahrt läuft** (seit dem 23.09.2026 in Schlägen, Vorgabe 2; KONZEPT-ZIELPUNKTE §5). Die Halte ergeben sich aus dem Rest. Hat der Titel
kein Schlagraster, gilt ein Ersatzmaß, und die Zeile sagt das.

**Die Schleife schließt, also ist der Lauf geschlossen.** Im Effektclip gilt das Loop-Gesetz: das
letzte Bild ist das erste. Ein Hineinfahren, das eng endet, kann das nicht. Im Clip ist ein Lauf
darum ein **geschlossener Weg**: halten · hin · halten · zurück · halten. Im Voll-Titel-Video, das
nicht loopt, darf derselbe Lauf einfach sein.

**Das Ziel kommt aus dem Bild, nicht aus einem Regler** (Hausregel: was die Software ausrechnen kann,
wird kein Regler).

> **BERICHTIGT am 18.09.2026.** Hier stand: „Das Motiv ist fast immer das Nahe und das Detailreiche."
> Das war mein Satz, und er ist **widerlegt** — die nahe Zone einer Tiefenkarte ist der **Boden**.
> Gemessen über alle 325 Titel, Ausschnitt 0,50, derselbe Code mit und ohne Karte: mit Nähe landen
> **259 von 325 Zielen in der unteren Bildhälfte** (79,7 %), ohne Karte 139 (42,8 %); die Karte
> schiebt das Ziel bei 236 Titeln nach unten, Median +0,118 der Bildkante, rein senkrecht. Von 18
> angesehenen Titeln lagen fünf daneben, alle fünf nach unten: Köpfe angeschnitten, Rahmen auf
> Asphalt und Kleid. Bei einem Porträt fällt es nicht auf, weil das Gesicht selbst nah ist — sobald
> eine Figur *in* einem Raum steht, ist der Vordergrund der Asphalt vor ihr.
>
> **Richtig ist: ein Motiv ist nicht, was nah ist, sondern was sich abhebt.** Eine Figur erzeugt eine
> **Kante** in der Tiefe; der Boden ist nah, aber in der Tiefe glatt — er steigt gleichmäßig zum
> Horizont, ohne Sprung. Gültig ist daher: **lokale Detaildichte plus Tiefenkante.** Damit ist der
> senkrechte Zug weg (Median +0,007 statt +0,118), und es ist nicht bloß „Karte ignorieren": bei
> 35 % der Titel verschiebt die Kante das Ziel um mehr als ein Viertel des freien Wegs.
>
> Vier Lesarten stehen im Code und sind umstellbar (`KB_LESART`), bis Caspar_D entschieden hat.
> **Was sich nicht messen lässt:** ob das Ziel *sitzt*. Jedes Maß dafür müsste sich selbst ausdenken,
> was ein Motiv ist, und prüfte dann eine Lesart gegen eine zweite. Das Urteil gehört dem Auge.

Gibt das Bild nichts her, fährt der Lauf auf die Mitte, und die Zeile **sagt es**. Auch das war zu
optimistisch aufgeschrieben: gemessen greift der Rückfall bei den beiden geprüften Reglerstellungen
nie, über den ganzen Reglerbereich aber bei sechs von 18 Titeln, ab Ausschnitt 0,85. Und die
Fundschwelle ist **je Lesart verschieden** geeicht — mit der Kanten-Lesart bleiben nur 3 % Luft.

---

## 4. Die Läufe

| Lauf | wofür | geschlossen im Clip |
|---|---|---|
| **Hineinfahren** | Verdichten. Die Vorgabe. | halten · hinein · halten · heraus · halten |
| **Aufdecken** | Von einem Detail auf das Ganze. Anfang eines Liedes. | umgekehrt |
| **Zwei Stationen** | Detail A, Zug, Detail B. Braucht mindestens acht Takte. | A · B · A |
| **Streifen** | Nur seitlich, kein Zoom. Breite Bilder, liest sich wie Lesen. | hin und zurück |
| **Spirale nach innen / außen** | Sehr langsam und sehr flach, sonst liest es sich als Effekt statt als Kamera. | hinein und heraus |
| **Slalom nach unten** | Liest sich als Suchen. Hohe Bilder. | hinab und hinauf |
| **Atemzug** | Fast stehendes Bild, minimaler Zug, damit es nicht gefroren wirkt. Langsame Stücke. | von selbst |
| **Auf den Schlag** | Eine Folge kurzer Halte, jeder landet auf einer Eins. Das Verfahren gibt es schon („Schritt auf den Schlag" bei den Moving Heads). | von selbst |

### Zwei Läufe von Caspar_D, 18.09.2026 — und sie sind besser als die Liste darüber

*„ken burns braucht noch verschiedene Pfade, auf denen sich der Ausschnitt bewegt … Diese einzige
Fahrt zu einem Ziel ist wenig."*

| Lauf | wofür | geschlossen im Clip |
|---|---|---|
| **Wanderung** | *„immer hinfahren - etwas reinzoomen, wie ein stück raus, weiter"* — kein Ankommen und Stehenbleiben, sondern ein Fluss über mehrere Stationen. Das ist die Antwort auf „zu wenig". | Rundweg: die letzte Station führt zur ersten zurück |
| **Abrastern** | *„ggf einfach nur zufällig abrastern"* — die Fläche absuchen, ohne Ziel. | nur als Rundweg; im Vollvideo offen |

**Und der Satz, der die Betriebsart trennt:** *„es muß ja nicht nur auf die 10 sek reichen."* Im
**Voll-Titel-Video** stimmt das uneingeschränkt — dort läuft der Weg über das ganze Lied, und die
Wanderung kann so viele Stationen haben, wie das Lied Takte hat. Im **Clip** gilt das Loop-Gesetz:
ein Weg, der nicht zurückkommt, lässt die Naht springen. Beides wird gebaut, und der Unterschied
wird **gezeigt**, statt die Naht heimlich aufzugeben.

**Reihenfolge:** Hineinfahren (gebaut) · **Wanderung** · Aufdecken · Zwei Stationen · Streifen ·
**Abrastern**. Die Wanderung zuerst, weil sie Caspar_Ds eigentlicher Einwand ist. Spirale, Slalom,
Atemzug und Auf den Schlag kommen danach, weil sie Geschmacksfragen offenlassen.

---

## 5. Was nur hier geht

**Parallaxe beim Hineinfahren.** Ein Zoom auf einem Foto ist kein Kamerazug — alles wird gleichmäßig
größer. Mit der Tiefenkarte wird daraus eine **echte Fahrt**: das Nahe wandert schneller als das
Ferne. Das ist der Unterschied zwischen einem vergrößerten Bild und einer Kamera, die sich bewegt.
Auf einem Rostrum-Tisch mit einem Abzug ist das unmöglich.

Ohne Tiefenkarte ist die Zeile grau und sagt warum. Der Lauf selbst funktioniert weiter, flach.

**Die Schärfe wandert** (Fokus zieht von vorn nach hinten, während die Kamera steht) — auch nur mit
Tiefenkarte. **Nicht in der ersten Fassung**, aber der Aufbau darf sie nicht verbauen.

---

## 6. Die Regler

| Regler | was er sagt |
|---|---|
| **Lauf** | welcher Kameraweg |
| **Ausschnitt** | wie eng das engste Bild ist |
| **Tempo** | über wie viele Schläge ein Zug läuft (bis 23.09.2026: Takte) |
| **Parallaxe** | wie stark das Nahe dem Fernen vorauseilt (grau ohne Tiefenkarte) |

**„Weite" gibt es nicht mehr.** Wenn die Fahrt ein Ziel hat, ist die Amplitude keine Einstellung,
sondern eine Folge.

Was **keinen** Regler bekommt, und wer stattdessen entscheidet:

| Sache | wer |
|---|---|
| Wohin die Fahrt geht | das Bild (Detaildichte + Tiefenkante — siehe die Berichtigung in Abschnitt 3) |
| Wie lang die Halte sind | der Takt, aus Tempo und Cliplänge |
| Die Form der Beschleunigung | das Gesetz (weich an, weich aus) |
| Ob der Lauf geschlossen ist | die Betriebsart: Clip ja, Voll-Titel-Video nein |

---

## 7. Bauweg

| # | Schritt | Nachweis |
|---|---|---|
| **1** | **Der Kern:** neuer Effekt neben der alten Fahrt, die Klammer halten·fahren·halten, weiche Kurve, auf den Takt gerastert, geschlossener Lauf. Lauf „Hineinfahren", Ziel noch die Bildmitte. | Naht bitgleich; alte Rezepte unberührt (der Effekt ist neu, also per Bau); Augenschein bei Caspar_D |
| **2** | **Das Ziel aus dem Bild:** nahe Zone plus Detaildichte, je Quelle und Einstellung gerechnet und behalten. Ehrlicher Rückfall auf die Mitte, mit Grund. | die gefundenen Ziele auf echten Covern als Blatt gezeigt; Kosten je Einstellungswechsel |
| **3** | **Die übrigen drei Läufe** der ersten Fassung. | Augenschein |
| **4** | **Parallaxe.** ✔ 18.09.2026 — ein gl-Gang mit Marsch, keine Schichten; Regler bis 2,6 %, Vorgabe 1,5 %. Abschnitt 8. | Naht bitgleich in allen sechs Läufen; 0,087 ms je Bild; ohne Tiefenkarte grau mit Grund |
| **5** | **Die alte Fahrt fällt**, wenn die neue gewonnen hat — Entscheidung von Caspar_D. Begründung bleibt als Kommentar. | die Rezepte, die sie benutzen, vorher/nachher |

**Gemessen wird nur, was man sich nicht überlegen kann:** die Kosten der Parallaxe je Bild und die
Kosten der Zielsuche je Einstellungswechsel. Alles andere ist Augenschein — Hausregel „Zeigen statt
Gegenlesen".

### Offen, weil Geschmack

1. Welche Läufe nach der ersten Fassung dazukommen, und welcher die Vorgabe wird.
2. Ob ein Lauf im Clip lieber **nicht** geschlossen sein soll — dann springt die Naht, und die
   Schleife wäre aufgegeben. Für das Voll-Titel-Video stellt sich die Frage nicht.
3. Wie viel Parallaxe „richtig" aussieht. Die Tiefenkarte hat keinen Maßstab, also ist es eine
   Setzung wie „Leerraum vor Tiefenkarte".

---

## 8. Die Parallaxe — gebaut und gemessen (18.09.2026)

Schritt 4 ist gebaut. Abschnitt 5 hatte sie versprochen, dieser Abschnitt sagt, **was daraus
geworden ist** — und an welcher Stelle der Entwurf danebenlag.

### Keine Schichten. Ein Marsch.

Der nächstliegende Weg wäre, das Bild in ein paar Tiefenschichten zu zerlegen und jede verschieden
weit zu schieben. Er ist falsch, und zwar messbar. Über alle 325 Tiefenkarten des Bestands, bei 3 %
Stärke:

| Schichten | Lochbreite je Grenze | Lochfläche | davon **erfunden** |
|---|---|---|---|
| 2 | 13,5 px | 1,84 % | 100 % |
| 4 | 6,7 px | 2,55 % | 98 % |
| 8 | 3,4 px | 2,76 % | 76 % |
| 32 | 0,8 px | 2,92 % | 40 % |

„Erfunden" heißt: an dieser Grenze hat die Karte **gar keine Stufe** — die Schichtung schneidet
Höhenlinien in eine glatte Fläche. Und die Lochfläche **fällt nicht** mit mehr Schichten, sie
steigt und läuft gegen die Gesamtöffnung des Bildes. Es gibt keine richtige Schichtzahl.

**Vier Schichten sind für die Teilchen richtig und für das Bild falsch.** Der Unterschied ist keine
Einstellung, sondern die Natur der Sache: Teilchen *sind* Punkte in Entfernungen, ein Bild ist eine
Fläche. Die Hälfte der Gesamtöffnung (49 %) ist **Rampe, nicht Riss** — sie will gedehnt werden,
nicht aufgeschnitten.

Gebaut ist darum **ein** gl-Gang mit einem Marsch entlang der Sichtlinie: Verschiebung je
Bildpunkt, rückwärts gesucht, erster Treffer ist die vorderste Fläche. Rissfläche bei 3 %:
**1,47 % gegen 2,55 %** bei vier Schichten.

### Die Verschiebung ist strahlig, nicht seitlich

Der Entwurf sagte „das Nahe wandert schneller als das Ferne" und dachte dabei an eine seitliche
Bewegung. Beim Bau kam heraus: der Kameraweg an einer Stelle **ist genau das, was der Ausschnitt
dort schon verschiebt**. Damit geht die Verschiebung strahlig aus dem Punkt heraus, auf den die
Fahrt zuläuft — jede Tiefenebene wird um diesen Punkt herum verschieden stark gedehnt.

Drei Folgen, alle angenehm:
- Rückwärts ist es eine **eindimensionale** Suche auf dem Strahl.
- Bei w = 0 (weites, stehendes Bild) ist der Weg null, also die Parallaxe auch — **die Naht ist
  bitgleich, ohne dass etwas dafür getan werden musste.**
- Der volle Wert wird nur in der fernsten Ecke erreicht. Gemessen liegt der Versatz im Bild bei
  **etwa der Hälfte** dessen, was der Regler verspricht. Der Regler ist eine Obergrenze, kein
  Erfahrungswert, und die Zeile unter ihm sagt das.

### Wo der Regler endet, und warum dort

**2,6 %,** und die Zahl ist gerechnet, nicht gesetzt. Zwei Nachbarn mit Nähesprung *d* landen im
Abstand 1 + s_px·d — was über 1 hinausgeht, deckt kein Quellpunkt mehr ab. Der größte Nähesprung
über **einen** Bildpunkt beträgt je Karte im Median 0,3788 (325 Karten, Studiomaß; unabhängig
nachgemessen: 0,3804 und 0,396). Acht Bildpunkte Lücke — die Breite, ab der die Randfortsetzung am
Augenschein nicht mehr trägt — wären bei 2,6458 % erreicht.

**Es gibt keine Stärke, bei der nichts aufreißt.** Auch bei 0,5 % ist die größte Lücke im Median
0,7 Bildpunkte. Der Regler kauft keine Fehlerfreiheit, er hält den Fehler unter dem, was zu sehen
ist.

**Vorgabe 1,5 %.** An 20 Zufallstiteln war dort nichts zu sehen. Gemessen am fertigen Bild:
Versatz Median 1,0–1,4 Bildpunkte, p90 2,0–3,2.

### Was es kostet

0,087 ms je Bild bei der Vorgabe (14 Schritte), 0,123 ms am Anschlag (23 Schritte), auf der Radeon
Pro 5500 XT bei 623×880. Das sind **0,26 % eines 30-Hz-Bildes** — so viel wie **ein** Tiefenband
der Teilchen. Die Kosten sind linear in den Schritten: 3,45 Mikrosekunden je Schritt.

### Der Fehler, den erst der Prüfstand fand

Die Parallaxe ersetzt das `drawImage`, mit dem der Ausschnitt sonst auf die Leinwand kommt — nur so
hat sie außerhalb des Bildes noch Stoff für die Risse. Die **Vorbereitung** (Belichtung, Kontrast,
Gradation) schnitt danach aber weiter mit den **Quellkoordinaten** aus und zoomte damit ein zweites
Mal in ein bereits ausgeschnittenes Bild. Mittlere Abweichung 56,4 von 255, größte 255.

Gefunden wurde er nicht am Augenschein, sondern weil **nie eine Vorbereitung in einem Prüffall
stand** — und das fiel beim Nachtragen der Ken-Burns-Fälle auf. Der Prüfstand kennt seit dem
18.09.2026 `vorb` je Fall, und `kb-parallaxe-vorb` ist der Fall, der den Fehler trug.

### Was die Parallaxe nicht mitnimmt

Sie verschiebt das **Bild**. Die Tiefenkarte, die danach die Masken der Kette, die Bänder der
Teilchen und den Geburtsort legt, fährt weiter nur mit der Geometrie. Eine Maskenkante kann also um
höchstens 13,5 (Vorgabe) bzw. 23,3 Bildpunkte (voll) danebenliegen — zum Vergleich: der am
18.09.2026 ausgeräumte Fehler „die Tiefenkarte fuhr nicht mit" war bis zu 364 Bildpunkte groß. Das
steht als Rest im Code, nicht als Versehen; wer die Karte auch durch die Parallaxe schickt, braucht
einen zweiten Gang.

### Offen, weil Geschmack

4. **Die Schrift.** Suno schreibt den Titel auf viele Cover, und die Tiefenkarte hält aufgedruckte
   Schrift für ein **nahes Objekt**. Eine Kamera, die sich bewegt, hebt keine Bildunterschrift vom
   Bild ab. Bei 1,5 % fällt es nicht auf, bei 2,6 % fangen die Zeilen an zu wandern. Zwei Auswege:
   den Regler tiefer legen, oder die Parallaxe an geraden, langen, kontrastreichen Kanten dämpfen.
   Bewusst ist der einfache Weg gebaut, damit erst hingesehen wird.
5. **Ob es sich als Kamera liest.** Im stehenden Vergleich sieht man bei der Vorgabe nichts — ein
   bis drei Bildpunkte auf 890. In der Bewegung schon: über zwei Sekunden Zug gelesen ist es ein
   echter Tiefenhinweis. Das gehört dem Auge, nicht der Messung.
