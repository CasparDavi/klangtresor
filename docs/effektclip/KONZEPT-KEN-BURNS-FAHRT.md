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
sondern **über wie viele Takte die Fahrt läuft**. Die Halte ergeben sich aus dem Rest. Hat der Titel
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
| **Tempo** | über wie viele Takte die Fahrt läuft |
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
| **4** | **Parallaxe.** | Augenschein; Kosten je Bild; ohne Tiefenkarte grau mit Grund |
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
