# Zehn Substantive je Lied — die Regeln und warum sie so lauten

Der Text der Aufgabe steht in [`bin/kondensat-prompt.js`](../bin/kondensat-prompt.js),
und **nur dort**. Hier steht, warum jede Regel so lautet, mit Datum, Zitat
und Meßwert. Wer die Aufgabe ändert, ändert dieses Dokument mit und zählt
`FASSUNG` hoch — sonst weiß hinterher niemand mehr, welches Kondensat nach
welchen Regeln entstand.

Stand: 28.08.2026, Fassung 2.

---

## Wozu das Ganze

Ein Liedtext besteht zum größten Teil aus Füllwörtern, Refrainwiederholungen
und Reimzwang. Zehn Substantive sind der destillierte Inhalt. Gemessen an
den Werkgruppen, bei denen die Wahrheit bekannt ist (Übersetzungspaare,
Gegenüber-Paare):

| Verfahren | Rang des Partners | Abstand zum Untergrund |
|---|---|---|
| ganzer Liedtext | 6,08 | 1,02 Streuungen |
| **zehn Substantive** | **1,00** | **2,63** |
| nur die ersten 120 Zeichen | 5,75 | 1,50 |

Die letzte Zeile ist die wichtige Kontrolle: Ein **gekürzter** Text von
derselben Länge wie das Kondensat bringt nichts. Der Gewinn kommt nicht
von der Kürze, sondern davon, daß es *die richtigen zehn Wörter* sind.

Caspar_D, 28.08.2026, als die Idee aufkam:
> „kannst du Kraft deiner Interpretationsfähigkeit nicht mal selbst
> schauen, was du an begriffen zuordnen würdest in einer Reihenfolge von
> 10 Substantiven, wenn du die Texte liest"

---

## Die Regeln im einzelnen

### Genau zehn, kein Wort zweimal

Kleine Modelle liefern regelmäßig neun oder acht, und wiederholen Wörter
innerhalb derselben Liste. Gemessen an `llama3.2:3b`: nur 14 von 32 Listen
hatten genau zehn, vier enthielten ein Wort doppelt („Getrennt" bekam
Datei · Raum · **Datei · Datei**). Das große Modell hielt die Form bei
allen 257 Liedern ein.

### Deutsch, auch bei fremdsprachigen Texten

Der Bestand ist deutsch, englisch, japanisch, plattdeutsch
(„Wenn he kloppt, blifft he") und frühneuhochdeutsch („Der Todt vnd das
Mägdlein"). Die Substantive müssen in **einem** Raum landen, sonst trennt
die Karte nach Sprache statt nach Inhalt.

Grenze der kleinen Modelle: `llama3.2:3b` liefert für die japanischen
Lieder 本物の守り人 und 手と木 **gar nichts** — in beiden Durchgängen.
Und läßt englische Wörter durch: Guilt, Vow, Domain, Womb, Reeds.

### Das Thema, nicht das Vokabular

Die frühere Fassung erklärte das an einem erfundenen Beispiellied:
*„Ein Lied über zwei Menschen, die sich am Strand vor Beobachtung
verstecken, bekommt ‚Verbergen' und ‚Beobachtung'."*

**Das war ein Fehler.** `llama3.2:3b` hielt das Beispiel für Material und
schrieb es ab: „Strand" stand in fünf Listen von Liedern, die nicht am
Strand spielen, bei „Hochzeit – Letzte Reihe" sogar alle drei Wörter am
Stück. Nach dem Umbau auf eine abstrakte Formulierung: **null Mal**.

Das große Modell hatte das Beispiel nie übernommen (Strand 1×,
Verbergen 2×, Beobachtung 3× auf 2570 Plätzen) — kleine Modelle trennen
Anweisung und Material nicht zuverlässig.

### Bei Bildern beide Ebenen nennen

Caspar_D, 28.08.2026:
> „viele meiner Lieder sind Liebes- bzw. Begehrens- oder
> verpasste-Chancen-Lieder … aus dem Remis Lied ein reines Schach-Ding,
> was es aber nur im Übertragenen Sinne ist"

„Zug um Zug – Kein Remis" ist ein Lied über eine verpaßte Gelegenheit,
erzählt in Schachbildern. `llama3.2:3b` sah nur das Brett — Königin, Feld,
Zug, Stellung — und hätte das Lied zu Schachliedern sortiert. Das große
Modell traf beide Ebenen von selbst:

> Schachpartie · Remis · Spielzug · Kapitulation · **Annäherung** ·
> Unumkehrbarkeit · Tischgespräch · Gewohnheit · **Wendepunkt** ·
> **Eingeständnis**

Weil das aber nicht dem Zufall überlassen bleiben soll, steht es jetzt
ausdrücklich in den Regeln.

### Für dasselbe Thema immer dasselbe Wort

Die frühere Fassung verbot „Allerweltsvokabeln wie Herz, Hand, Nacht,
Liebe, Zeit, Blick, Nähe". Caspar_D, 28.08.2026:

> „Sind Liebesvokabeln denn überhaupt Allerweltsvokabeln?"

Gemessen: **nein.** Im Kondensat kommt kein Wort aus diesem Feld öfter als
zehnmal vor — 3,9 % der Lieder. In den *Rohtexten* steht „Herz" in
ungefähr der Hälfte aller Stücke; dort wäre es ein Allerweltswort, im
Kondensat ist es ein Etikett für zehn Lieder. Das Verbot war von den
Rohtexten her gedacht und auf die Kondensate falsch übertragen.

**Und es hat geschadet.** Weil „Liebe" verboten war, wich das Modell auf
zwölf Synonyme aus:

| | | | |
|---|---|---|---|
| Hingabe 10× | Kuss 10× | Begehren 9× | Verlangen 9× |
| Verschmelzung 9× | Annäherung 9× | Anziehung 8× | Verlockung 7× |
| Sehnsucht 7× | Erregung 6× | Verführung 4× | Zärtlichkeit 3× |

Die Synonyme hängen im Einbettungsraum nur lose zusammen (mittlerer
Kosinus 0,648; gegen Sachbegriffe wie Kernreaktor oder Mikrobiom 0,380).
Einzeln wird es deutlich: **„Hingabe" liegt von „Liebe" weiter entfernt
(0,308) als der Durchschnitt zu einem Sachbegriff (0,380).** Zehn
Liebeslieder mit zehn verschiedenen Wörtern zu etikettieren streut sie
über die halbe Karte — das Gegenteil dessen, was das Kondensat leisten
soll.

Deshalb: kein Verbot mehr, sondern die Anweisung zur Einheitlichkeit.

### Keine zwei Lieder mit derselben Liste

Der schlimmste Fehler: Zwei verschiedene Lieder mit gleicher Liste fallen
in der Karte aufeinander. Gemessen am Lauf über alle 257 Lieder teilt nur
**ein** Paar acht oder mehr Wörter — „Loreley v2" und „Loreley – english",
9 von 10. Das sind aber keine zwei Lieder, sondern dieselbe Ballade in
zwei Sprachen; daß sie zusammenfallen, ist richtig. Die nächstliegenden
Paare (7 von 10) sind ebenfalls alle Versionspaare. **Kein Paar inhaltlich
verschiedener Lieder kommt über 7.**

Bei `haiku` dagegen bekamen zwei von acht Gegenüber-Paaren für **beide**
Perspektiven exakt dieselbe Liste.

### Eigennamen nur, wenn die Figur das Thema ist

Das frühere pauschale Verbot war zu streng: „Klabautermann" und
„Erlkönig" *sind* das Thema ihrer Lieder. `llama3.2:3b` nahm dagegen
Nebenfiguren auf — „Gräberknecht", „Fiedler Knauf", „Margreth".

### Nichts aus der Anweisung übernehmen

Direkte Folge des Strand-Fehlers oben.

---

## Reihenfolge: erst der Text, dann die Aufgabe

Bei kleinen Modellen wirkt die zuletzt gelesene Anweisung stärker, und das
Material steht so klar davor statt dahinter.

Ehrlich dazu: Der Umbau war ein **Tausch**, kein reiner Gewinn. Bei
`llama3.2:3b` verschwand das Abschreiben (8 → 0 Wörter aus dem Beispiel),
aber die Formtreue litt (23 → 14 Listen mit genau zehn Wörtern), und mehr
englische Wörter rutschten durch (7 → 10). Vermutlich hatte das konkrete
Beispiel dem Modell auch als Formvorlage gedient. Für die großen Modelle
ist der Unterschied ohne Belang.

---

## Was die Modellgrößen leisten

Gemessen an 32 Liedern aus den Werkgruppen mit bekannter Wahrheit:

| | verschiedene Wörter | Allerweltswörter je Liste | Paare mit identischer Liste |
|---|---|---|---|
| großes Modell | 174 / 320 | 1,19 | 0 von 8 |
| kleines Modell (Haiku) | 143 / 320 | 3,44 | **2 von 8** |
| `llama3.2:3b` lokal | 193 / 284 | — | japanisch: **Totalausfall** |

Über alle 257 Lieder erreichte das große Modell **1785 verschiedene Wörter
auf 2570 Plätzen (69,5 %)**; 1338 davon kommen genau einmal vor. Das
häufigste Wort steht in 4,7 % der Listen.

Für das bloße Wiederfinden eines Partners reicht auch ein kleines Modell
(Rang 1,17 gegen 1,00). Für einen Raum, in dem 257 Lieder auseinander
liegen sollen, reicht es nicht.

---

## Das Archiv

`library/kondensate/kondensate.json` — je Lied ein Eintrag mit Titel und
allen Modellen, die je gelaufen sind. `bin/kondensate-sammeln.js`
**ergänzt**, statt zu überschreiben: jeder neue Lauf kommt dazu, alte
bleiben stehen. `kondensate.txt` daneben zeigt dasselbe zum Lesen.

Caspar_D, 28.08.2026:
> „kannst du die kondensierten varianten gut archivieren, vielleicht
> benutze ich sie für meine sammlung weiter, wenn es gute gibt"

Teilläufe (`-a01`, `-a02` …) überspringt das Sammelskript — ihr Inhalt
steckt schon im Gesamtlauf, und als eigene „Modelle" geführt verstopfen
sie das Archiv.
