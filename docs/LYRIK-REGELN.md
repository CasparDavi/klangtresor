# Die bereinigte Lyrik — Regeln (Fassung 3)

`bin/lyrik.js` baut aus dem Liedtext des Katalogs und den Whisper-Wortmarken (`library/whisper.ndjson`)
die **bereinigte Lyrik** `library/lyrik.json`: je Lied Zeilen mit Text, `von`, `bis`. Sie ist die
Quelle des Karaoke-Effekts und der Spur „rein" auf der Bühne. Läuft im Morgenlauf nach dem
Whisper-Schritt. Das Feld `fassung` in der Datei sagt, nach welchen Regeln sie entstand; die
Begründungen stehen ausführlich im Kopf von `bin/lyrik.js`.

## Was die Datei ist — und was nicht

Sie ist die Wahrheit über die **gesungenen Wörter und ihre Zeiten**. Sie ist kein Abbild des
Liedtexts: Regie, Verzierung und Ungesungenes stehen nicht darin. Der Rohtext bleibt im Katalog und
in der Lyrics-Ansicht der Bühne unverändert (Caspar_D, 07.09.2026: „nichts, was von Suno kommt,
sollte verändert werden").

## Regeln (Caspar_D, 25.09.2026)

1. **Eckige Klammern fliegen grundsätzlich** — ganze Zeilen (auch mit Klammern darin), Einschübe
   mitten in der Zeile, mehrzeilige Notizen von der öffnenden bis zur schließenden Klammer, dazu
   Zeilen mit `#` und Trennlinien. Vor dem Abgleich.
2. **Runde Klammern durchlaufen den Whisper-Abgleich.** Hat Whisper mindestens die Hälfte der
   Wörter einer Gruppe gehört, bleibt ihr Text in der Zeile; sonst fällt die Gruppe. Eine Zeile, die
   nur aus einer nicht gehörten Gruppe bestand, fällt ganz. Die Zeichen `(` `)` stehen im Ergebnis
   nie. *„Suno entscheidet neuerdings intelligent, ob runde Klammern Regie oder Echo sind — Whisper
   hört es: erkannt bleibt es drin, sonst fliegt es raus."*
3. **Die Deckung rechnet ohne Klammern**, eckig wie rund, gehört oder nicht — nur Wörter außerhalb
   jeder Klammer zählen, für das Lied und für das Kriterium gesungen/offen je Zeile. *„Das ist dann
   sicher."*
4. **Zierzeichen und Emoji fliegen** vor dem Abgleich (Emoji samt Selektoren, Symbole, Pfeile,
   Rahmenzeichen, Ketten aus drei gleichen Sonderzeichen), ersetzt durch ein Leerzeichen — sonst
   verschmelzen zwei Wörter. Reine Zierzeilen fallen wie Trennlinien. Das Gradzeichen bleibt: „5 °C"
   ist Text. Satzzeichen, Buchstaben und Ziffern aller Schriften bleiben.
5. **Unter 60 % Deckung wird nicht gereinigt**, sondern zurückgestellt (mit Grund in `unsicher`).
6. **Zeiten.** Echte Whisper-Marken bleiben, wie gemessen. Zeilen ohne eigene Marke tragen
   `geschaetzt` und liegen anteilig nach Zeichenzahl zwischen ihren Nachbarn. Eine Zeile mit nur einer
   entarteten Marke (Standzeit unter 0,3 s) bekommt ihre Standzeit aus der Spanne bis zur nächsten
   echten Marke (`standzeitGeschaetzt`); zwei Zeilen auf denselben Marken teilen sich die Spanne
   (`zeitAngepasst`). Es gibt keine doppelten Startzeiten mehr.
7. **Whisper-Prompt ohne Klammern.** `bin/whisper.js` gibt Whisper den Liedtext als Prompt, ohne
   eckige und ohne runde Klammern — Whisper soll den Gesang angekündigt bekommen, nicht die Regie.
   Gilt für künftige Läufe; die Zählung vom 25.09. zeigte keine Verzerrung durch den alten Prompt.

## Zähler je Lied

`deckung`, `worte`, `zeilen`, `gestrichen` (ungewiss, unter der Deckungsgrenze), `geschaetzt`,
`regie`, `einschuebe`, `zeitAngepasst`, `standzeitGeschaetzt`, `klammerGehoert`, `klammerGestrichen`,
`zier`, `zierZeilen`. Die Karaoke-Karte im Studio nennt Deckung, geschätzte und gestrichene Zeilen.

## Wer sie liest

`/api/lyrik/<id>` (Server, mit `stand`-Prüfung der Datei), der Karaoke-Effekt (`lyrikVon`, mit
Sicherheitsnetz für Klammern und Zierzeichen aus alten Fassungen), die Bühne (Spur „rein"),
`bin/gesundheit.js` (Ersatzzeichen), der Prüfstand (`_lyrik.json` der Prüftitel).

## Stand der Läufe

| Fassung | Datum | Was sich änderte |
|---|---|---|
| 1 | bis 24.09.2026 | Alignment, Regie nur als ganze Zeile, Interpolation gleichverteilt |
| 2 | 25.09.2026 nachts | Klammerzeilen mit innerer Klammer, Einschübe, entartete Marken, doppelte Startzeiten |
| 3 | 25.09.2026 vormittags | runde Klammern über den Abgleich, Deckung ohne Klammern, Zierzeichen, mehrzeilige eckige Notizen, Prompt ohne Klammern |

Ernstlauf Fassung 3: 244 Lieder gereinigt, 19 zurückgestellt, 77 Klammergruppen gehört, 44
gestrichen, 48 Zierzeichen entfernt, Pfeifenwald von 66 % auf 100 % Deckung.
