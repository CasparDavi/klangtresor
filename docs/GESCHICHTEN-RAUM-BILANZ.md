# Der Geschichten-Raum — Bilanz eines Tages

Stand 28.08.2026. Die Räume „Geschichten" und „Lied" sind beiseitegelegt
(`library/entwurf/`, dort auch der Rückweg). Caspar_D:

> „wir schließen die Türen zu den alternativen Räumen erstmal zu, sie
> dürfen ja gern existieren aber zum Zeigen ist das nix."

Dieses Dokument hält fest, was probiert wurde, was davon trägt und woran
es am Ende hing — damit beim Wiederaufmachen nichts doppelt gemacht wird.

---

## Was gebaut wurde

**Drei Räume als Register:** Klang (Audio-Einbettungen), Geschichten
(Liedtexte), Lied (beide Vektoren verkettet, je 1/√2 gewichtet, damit der
Kosinus das Mittel der Einzelkosinus ist). Je Raum eigene NMDS-Karte und
eigene Stilgruppen. Technisch funktioniert das alles — Sound-Schiff,
Flugbahn, Nebel, Export laufen in jedem Raum.

**Textstrecke:** `bin/geschichten.js` (Filter + Einbettung),
`bin/tokenizer.js` (Unigram-Viterbi, selbst gebaut, damit
onnxruntime-node die einzige ML-Abhängigkeit bleibt),
`bin/texte-einbetten.js` (ONNX, Mean Pooling), `bin/geschichten-namen.js`
(Gruppennamen und Zero-Shot-Achsen).

**Modellwahl:** Suchmodelle (e5, BGE, GTE) taugen nicht — sie drängen
alle Werte in acht Tausendstel zusammen, jede Nachbarschaft ist Zufall.
Ähnlichkeitsmodelle (paraphrase-multilingual-mpnet) spreizen zehnmal
weiter. Entscheidend war die Messung der Spreizung, nicht die Modellgröße:
e5-base ordnete *schlechter* als e5-small. Es ist die Familie, nicht die
Größe.

---

## Was gemessen wurde — und hält

**Der Raum versteht Inhalt.** Geprüft an Werkgruppen, bei denen die
Wahrheit bekannt ist:

| Stufe | Paare | Kosinus | mittl. Rang |
|---|---|---|---|
| v2-Fassungen (gleicher Text) | 17 | 0,952 | 1,6 |
| Gegenüber (gleiche Szene, andere Perspektive) | 19 | 0,863 | 20,4 |
| Übersetzungen (gleicher Inhalt, andere Sprache) | 22 | 0,835 | 17,2 |
| Ahnheim (gleicher Stoff, andere Zeit/Form) | 11 | 0,793 | 58,5 |
| Zufallspaare | 32.820 | 0,661 | 128,5 |

Die Enden sind gesichert, die Mitte überlappt. Deutsch↔Englisch findet
in 19 von 20 Fällen die richtige Fassung; der Sprachwechsel kostet nicht
mehr als eine Neuformulierung in derselben Sprache (0,835 gegen 0,834).
Japanisch trägt nur halb. Der schönste Befund: die Ahnheim-Zwillinge sind
im Geschichten-Raum nah und im Klang-Raum **unter Zufallsniveau** fern —
die Räume messen wirklich Verschiedenes.

**Ein echter Fehler wurde dabei gefunden:** Die 2-D-NMDS kollabierte auf
einen Punkt (Stress-1 ist skaleninvariant, „alles auf einem Punkt" ist
die triviale Lösung). Alle 257 Lieder standen bei x = y = 0,04. Behoben
durch Skalenverankerung nach jedem Guttman-Schritt (`bin/karte.js`).

**Klassifikatoren:** Die Klang-Etiketten erklären den Lied-Raum (43 von
47 über einer gemessenen Zufallsschwelle), den Geschichten-Raum nicht
(0 von 47 nach Ausschluß). Die Schwelle ist das 99-%-Quantil von η² bei
gemischten Gruppen — gerechnet, kein Regler.

**Zero-Shot-Achsen:** Ohne Sockel bekamen 88 % der Lieder die Haltung
„Anklage" — die Achse trug null Information. Mit Sockel (Grundniveau je
Kategorie abziehen) sind alle Kategorien belegt. Der Sockel ist
eingefroren (`library/achsen-sockel.json`), weil er sonst mit dem Bestand
wandert und alte Lieder umetikettiert: gemessen 12 von 100 je 30 neue
Lieder, eingefroren exakt null. Ein *mitwachsendes* Vokabular wäre noch
schlimmer — 86 von 100 wechseln je Zuwachs, und dieselben 86 wechseln
schon bei bloßem Saatwechsel. Es ist nicht bestandsabhängig, es ist
zufällig.

---

## Die Kondensate — der Gewinn des Tages

Jörgs Idee: „Kondensiere den Text auf 10 Substantive." Gemessen:

| Vektor aus | Partner-Rang | Abstand zum Untergrund |
|---|---|---|
| ganzem Liedtext | 6,08 | 1,02 Streuungen |
| **zehn Substantiven** | **1,00** | **2,63** |
| ersten 120 Zeichen (Kontrolle) | 5,75 | 1,50 |

Der Gewinn kommt vom Kondensieren, nicht vom Kürzen. Alle 257 Lieder
liegen kondensiert in `library/kondensate/` (JSON + lesbare Textdatei),
Regeln mit Begründung in `docs/KONDENSAT-REGELN.md`, der Prompt an genau
einer Stelle (`bin/kondensat-prompt.js`, Fassung 2).

Gelernt dabei:
- Ein **konkretes Beispiel im Prompt** wird von kleinen Modellen
  abgeschrieben („Strand" stand in fünf Listen).
- Ein **Verbot von Allerweltswörtern** zwang zu zwölf Synonymen, die im
  Vektorraum lose hängen und zusammengehörige Lieder zerstreuen. Jörgs
  Einwand („Sind Liebesvokabeln denn überhaupt Allerweltsvokabeln?") war
  messbar richtig: kein Feldwort über 4 % der Lieder.
- **Bei Bildern beide Ebenen nennen** — sonst wird aus dem Remis-Lied ein
  Schach-Ding. Und: ein Kondensat kann falsch *aussehen*, weil der
  Messende die Geschichte nicht kennt („es war mal früher versäumnis …
  und jetzt wird was passieren") — am Ende entscheidet der Autor.

**Modellgrößen:** Opus lieferte 1785 verschiedene Wörter auf 2570
Plätzen, null Allerweltswörter, kein Paar verschiedener Lieder mit
gleicher Liste. Haiku reicht fürs Wiederfinden, verwäscht aber (3,4
Allerweltswörter je Liste, zwei Gegenüber-Paare mit identischen Listen).
**Lokale Modelle auf dieser Maschine: unbrauchbar für den Betrieb.**
Intel-Mac, AMD-Karte, Ollama rechnet auf der CPU — qwen3:8b braucht 56 s
je Lied, qwen3:14b 82 s, deepseek-r1 lieferte in 51 Minuten nichts.
llama3.2:3b fällt bei Japanisch ganz aus. Die Stichproben liegen im
Kondensat-Archiv zum Vergleich.

---

## Woran es am Ende hing

**Nicht an der Zuordnung — an den Namen.** Mit Kondensat-Vektoren fiel
die größte Gruppe von 154 auf 84 Lieder, und die Balladen fanden
zusammen: Erlkönig, Braut von Corinth, Ulrich & Ännchen, Barbier,
Belsazar, Mädchen im Moor in einer Gruppe. Aber die Gruppe hieß
„Gesellschaft — pathetisch", denn die Kontrastrechnung findet kein
gemeinsames Substantiv — Erlkönig, Totenbraut, Menetekel, Moor: jedes
Lied ist eigen benannt. Die Stärke der Kondensate wird bei der
Gruppenbenennung zur Schwäche.

**Was fehlt, ist eine Achse quer zu den Themen.** Die
Literaturwissenschaft hat sie: **Ereignishaftigkeit** (Hühn) — passiert
etwas, oder wird ein Zustand ausgebreitet? Sie trennt die Balladen von
den Betrachtungen. Dazu Sprechsituation (Hamburger), Fryes vier Mythoi
fürs Ende (Komödie/Romanze/Tragödie/Ironie), die Verlaufskurve über die
Strophen (Vonnegut/Reagan). Sprechsituation und Ereignishaftigkeit gingen
teilweise **ohne Modell** — Pronomenverteilung, Verbformen, Eigennamen.

---

## Beim Wiederaufmachen

1. `mv library/entwurf/karte-*.json library/` — Raumleiste und
   Laschenname stellen sich selbst um.
2. Zuerst die **Gruppierung**, nicht die Namen: Ereignishaftigkeit als
   Achse, feinere Gruppen für 257 Lieder dieser Spannbreite.
3. Gruppennamen dann per Sprachmodell aus den Kondensaten der Gruppe
   („Ballade · Verhängnis · Warnung"), einmal gerechnet, fest —
   derselbe Weg wie bei den Kondensaten selbst.
