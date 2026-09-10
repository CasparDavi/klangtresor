# Effektclip-Studio: die Regeln

Stand 10.09.2026. Entstanden aus dem großen Tiefen-Check, bei dem 38 Effekte mit allen ihren
Reglern durchgemessen und gegen ihren Code gelesen wurden. Caspar_D am selben Abend: „hast du
eigentlich deine Testergebnisse irgendwo niedergeschrieben, damit wir jederzeit wissen, was wir
nicht mehr machen dürfen."

Das ist diese Datei. Sie sagt, was gilt, wie man es nachprüft und was beim letzten Lauf
herauskam. Wer einen Effekt baut oder ändert, liest sie vorher.

---

## Die Gesetze

**1. Stärke ist immer die Deckkraft.** Wie stark das fertige Ergebnis eines Effekts ins Bild
gemischt wird, zuletzt angewandt, 0 bis 100 Prozent. Nichts anderes.

**2. Kein zweiter Regler darf nur Deckkraft sein.** Findet sich im Maler ein reines Produkt aus
Stärke und einem anderen Regler, ist einer davon zu viel. So sind „Schlag", „Tiefe" und „Dichte"
verschwunden. Alle anderen Regler formen den Effekt: wie groß, wie viele, wie schnell, wie weit,
wie hell.

**3. Was keine Deckkraft hat, bekommt keinen Stärke-Regler.** Geometrie (Fahrt, Zoom, Kippen) und
reine Verzerrer (Wellen, Linse, Bildlauf, Verwackeln, Blöcke) verändern das Bild, sie mischen
nichts hinein. Eine Überblendung zwischen verzerrt und unverzerrt ist kein schwächerer Effekt,
sondern ein Geisterbild. Registry-Merkmal: `ohneStaerke`.

**4. Vollbild-Ergebnisse vertragen nur „Über".** Wer das ganze Bild neu ausgibt (Nachbearbeitung,
Shader, die Grund-Pulse), darf keine Verrechnung anbieten: sie würde das Bild mit sich selbst
verrechnen. Ausnahmen tragen `verrFrei` und sind es, weil sie wirklich nur einen Zuschlag liefern
(Bloom, Kaustik).

**5. Licht ist Beleuchtung, nicht Farbe.** Lichter rechnen mit Farbig abwedeln: sie hellen auf,
was schon da ist. Ein Strahl im Leeren ist unsichtbar — das ist richtig so. Schatten ist das
Spiegelbild und rechnet mit Farbig nachbelichten. Wer schwarz abwedelt, malt nichts (daran starb
das Sicherungswackeln einen halben Tag lang).

**6. Nebel leuchtet nicht selbst, er wird beleuchtet.** Der Theaternebel ist ein Medium:
`mische(Bild, Farbe × (Grundlicht × Umgebung + Licht × Streuung), Dichte)`. Das Licht kommt aus dem
Licht-Puffer, in den alle Leuchten der Kette zusätzlich additiv malen. Darum wird ein Strahl im
Nebel sichtbar, gleich an welcher Stelle der Nebel in der Kette hängt. Wer einen neuen Leuchter
baut, setzt `leuchtet` in der Registry — sonst ist er im Nebel nicht zu sehen.

**6a. Ein Medium mischt gegen seine Umgebung, nicht gegen eine feste Zahl.** „Umgebung" ist die grob
verwaschene Helligkeit des Bildes an dieser Stelle, aus neun Griffen in die Quelltextur. Ein fester
Grauwert zog helle Stellen herunter und dunkle herauf, und beides zusammen fraß Kontrast und Farbe:
bei gleicher Dichte gingen 32 % Kontrast und 46 % Buntheit verloren, mit der Umgebung nur 14 % und
28 %. Wer eine Schicht über das ganze Bild legt, fragt zuerst, wogegen sie mischt.

**7. Selbstleuchter sind keine Beleuchtung.** Feuer, Flammen und Partikel leuchten selbst und
behalten ihre eigene Verrechnung. Sie werden nicht auf Abwedeln umgestellt.

**8. Die Kette gilt in ihrer Reihenfolge.** Was oben steht, wirkt zuerst. Das gilt seit dem
10.09.2026 auch für Nachbearbeitung und Shader; vorher sanken sie stillschweigend ans Ende und
die Oberfläche versprach etwas, das nicht stimmte.

**9. Jeder Regler muss messbar wirken, über seinen ganzen Weg.** Ein Bereichsende ohne Wirkung ist
ein Fehler, kein Spielraum. Beispiele aus dem Tiefen-Check: die Nebeldichte war oberhalb von 0,7
tot, die Stärke oberhalb von 100 Prozent bei sieben Typen, die Antriebstiefe beim Stroboskop auf
ihrer ganzen Länge.

**10. Ein ausgeblendeter Regler ist nicht abgeschaltet.** `when` versteckt nur die Zeile, der Wert
bleibt stehen und wird weitergereicht. Wer eine Auswahl „keine" anbietet, muss den Wert selbst auf
null zwingen. Der Nebel zog sonst bei „Absaugung: keine" trotzdem zur Bildmitte.

**11. Die Beschriftung ist ein Versprechen.** Sagt der Regler „Breite in Grad", ist es der ganze
Winkel und nicht der halbe. Sagt die Beschreibung „nur auf der Eins", darf der Code nicht jeden
Schlag nehmen. Sagt sie „lodert höher", muss es höher werden und nicht zwischendurch niedriger.

**12. Alte Ablagen werden übersetzt, nie stillschweigend anders gelesen.** Jede Bedeutungsänderung
bekommt eine Übersetzung in `effektAusRezept`. Ablagen tragen `fassung`; ältere gelten als alt und
werden gefaltet. Schlüssel, die es nicht mehr gibt, werden beim Laden entfernt, damit sie nicht
beim nächsten Sichern wieder mitgehen.

**13. Nichts speichern, was nicht gelesen wird.** Was `effekteJSON` schreibt, muss ein Maler auch
brauchen. Tote Schlüssel in der Ablage sind Fallen für den Übernächsten.

**14. Ein Filter gehört nicht in eine Schleife.** `ctx.filter` wirkt je Zeichenzug, nicht je Fläche:
jeder einzelne Zug bekommt einen eigenen Weichzeichnungs-Durchgang. Die Scheinwerferblende malte so
bis zu 6889 einzeln weichgezeichnete Kreise je Bild und brauchte für ein einziges Bild 465
Millisekunden, im Kegel drei Sekunden. Regel: unscharf wird einmal am Ende über die fertige Fläche
gezeichnet. Und was sich wiederholt, wird einmal in eine Kachel gemalt und als Muster gefüllt.

**15. Der Maler wirft nicht.** Jeder Effekt läuft in seinem eigenen try. Ein fehlender Parameter
darf nicht den ganzen Bildaufbau anhalten; darum legt `effektAusRezept` gespeicherte Werte über die
Vorgaben des Typs und nicht umgekehrt.

---

## Wie geprüft wird

Zwei Wege, und beide sind nötig.

**Die Messreihe.** `labor/effektclip-studio/messreihe.js` hängt jeden Effekt einzeln ein, schaltet
ihn an und aus, fährt jeden Regler von Minimum auf Maximum, schaltet jede Auswahl und jeden Schalter
durch und misst jedes Mal die mittlere Abweichung je Bildpunkt. Uhr steht fest auf einem Schlag,
Quelle ist das Testporträt in Farbe. Vier Minuten. Eine Null ist ein Verdacht, kein Urteil.

**Das Gegenlesen.** Register gegen Maler, Zeile für Zeile: wird der Parameter überhaupt gelesen,
tut er, was seine Beschriftung sagt, gibt es tote Zweige, gibt es zwei Regler für eine Zahl. Dazu
je Befund ein Skeptiker, der ihn zu widerlegen versucht. Von 66 Befunden hielten 61, von 21 beim
Nachbau des Nebels hielten 3.

Der Weg ins Haus und zurück läuft über `bin/effektclip-labor.js`:

```bash
node bin/effektclip-labor.js aus     # Block aus web/index.html holen
node bin/effektclip-labor.js ein     # zurück spleißen, mit Syntaxprüfung
node bin/effektclip-labor.js daten   # Prüfdaten und Verweise anlegen
```

---

## Was der Mittelwert nicht sieht

Vier Fallen, in die der Autor dieser Zeilen an einem Abend alle vier getappt ist.

- **Ereignisse.** Sicherungswackeln und Glitch-Blöcke feuern selten und kurz. Bei stehender Uhr
  messen sie null, im Zeitlauf über acht Sekunden 43 beziehungsweise 2,5. Ereignis-Effekte brauchen
  einen Zeitlauf, keinen Einzelblick.
- **Punktuelles.** Tropfen, Einschläge und Risse bedecken wenig Fläche. Ihr Mittelwert liegt unter
  eins, ihr stärkster Bildpunkt bei 126 bis 197. Der Mittelwert misst Fläche, nicht Sichtbarkeit.
- **Abhängiges.** Der Nebelregler „Im Licht" misst allein null, weil ohne Leuchte in der Kette kein
  Licht aufzunehmen ist. Mit einem Scheinwerfer misst derselbe Regler 21 bis 143. Das ist der
  Beweis für das Medium, nicht sein Fehler.
- **Das falsche Feld.** Wer „das hellste Bildviertel" misst, misst beim Testbild die Kugel und
  nicht den Strahl. Immer gegen den Bereich messen, um den es geht.
- **Rechenzeit ohne Rücklesen.** `performance.now()` um Zeichenbefehle misst nur, wie schnell man
  Befehle abschickt, nicht wie lange sie brauchen. Die Blende sah so nach 5,8 ms aus und brauchte in
  Wahrheit 465. Nach jedem Durchgang einen Bildpunkt zurücklesen, dann stimmt die Zahl.
  `labor/effektclip-studio/blendentest.html` macht das vor, ohne Studio und ohne laufenden Maler.

Und eine Falle im Aufbau: fehlt dem Prüfstand der Verweis auf `web/fremd`, findet der Shader sein
Rauschen nicht, das Studio fällt still auf den Leinwand-Nebel zurück, und man misst tagelang den
falschen Maler. `bin/effektclip-labor.js daten` legt den Verweis darum immer mit an.

---

## Grundlinie

Der volle Satz Zahlen liegt in `labor/effektclip-studio/messreihe-2026-09-10.json` und ist zum
Vergleichen da: fällt ein Wert bei einem späteren Lauf auf null, ist unterwegs etwas kaputtgegangen.
Die Eckwerte:

| Effekt | an/aus | stärkster Regler | Anmerkung |
|---|---|---|---|
| Zoom schlägt | 44,2 | Wucht 54,0 | |
| Fahrt | 51,2 | Ausschnitt 59,8 | |
| Bildlauf | 76,2 | Tempo 77,5 | der wuchtigste Effekt im Vorrat |
| Linse | 45,8 | Wölbung 88,2 | |
| Stroboskop | 44,9 | Stärke 148,9 | Stärke misst über 100, weil sie hell und dunkel spannt |
| Farbschleier | 31,3 | Stärke 78,4 | |
| Kippen schlägt | 32,9 | Neigung 46,6 | |
| Verwackeln | 26,9 | Amplitude 38,4 | |
| Beschlag | 19,8 | Stärke 33,0 | |
| Wellen | 19,0 | Amplitude 34,5 | |
| Spiegelung | 18,3 | Horizont 41,8 | |
| Sättigung schlägt | 16,4 | Sättigung 38,4 | |
| Scanlines | 16,3 | Linien 23,0 | |
| Kaustik | 16,0 | Schärfe 24,2 | |
| Helligkeit schlägt | 13,6 | Wucht 27,0 | |
| Farbkanal-Puls | 13,5 | Versatz 30,0 | |
| Theaternebel | 12,4 | Grundlicht 44,8 | im Strahl 88,5 — siehe Regel 6 |
| Flammen | 12,2 | Höhe 20,9 | |
| Kontrast schlägt | 11,7 | Tonwert 45,1 | |
| Nachzieheffekt | 11,6 | Stärke 22,8 | |
| Laufstreifen | 10,4 | Breite 34,0 | |
| Farbton schlägt | 9,1 | Winkel-Mitte 25,0 | |
| Schatten | 8,7 | Größe 61,9 | |
| Feuer | 7,8 | Dichte 19,8 | |
| Schärfe schlägt | 7,7 | Weichheit 10,4 | |
| Scheinwerfer | 7,7 | Größe 54,2 | |
| Lichtstrahlen | 6,6 | Breite 20,8 | |
| Filmkorn | 3,1 | Stärke 5,9 | leise, das ist der Zweck |
| Partikel | 1,6 | Größe 10,3 | punktuell |
| Laserstrahl | 1,3 | Strahlen 4,8 | punktuell, im Nebel 88,5 |
| Risse | 1,0 | Breite 1,9 | punktuell, höchster Punkt 140 |
| Rauschausfall | 0,8 | Körnung 3,5 | |
| Tropfen | 0,4 | Größe 2,4 | punktuell, höchster Punkt 197 |
| Einschlag | 0,1 | Größe 1,2 | punktuell, höchster Punkt 126 |
| Sicherungswackeln | 0 | im Zeitlauf 43,5 | Ereignis |
| Glitch-Blöcke | 0 | im Zeitlauf 2,5 | Ereignis |

---

## Was daraus schon geändert wurde

Die vollständige Liste der 20 behobenen Fehler und der 13 Nachbesserungen steht in
`docs/NAECHSTER_CHAT.md` unter „Tiefen-Check aller Effekte" und „Korrigiert und konsolidiert".
Die Stärke-Regel steht zusätzlich im Kopf des Moduls, in `docs/handbuch/WOERTER.md` unter
„die Stärke" und als Hinweistext an jedem Stärke-Regler.
