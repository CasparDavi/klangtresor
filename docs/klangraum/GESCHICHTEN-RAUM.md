# Der Geschichten-Raum

Stand 28.08.2026. Zwei Dokumente desselben Tages, zusammengelegt am 11.09.2026: der Messlauf am
Abend und die Bilanz. Sie beschreiben dieselbe Sache von zwei Seiten und gehören zusammen.

---

## Bilanz eines Tages

## Der Geschichten-Raum — Bilanz eines Tages

Stand 28.08.2026. Die Räume „Geschichten" und „Lied" sind beiseitegelegt
(`library/entwurf/`, dort auch der Rückweg). Caspar_D:

> „wir schließen die Türen zu den alternativen Räumen erstmal zu, sie
> dürfen ja gern existieren aber zum Zeigen ist das nix."

Dieses Dokument hält fest, was probiert wurde, was davon trägt und woran
es am Ende hing — damit beim Wiederaufmachen nichts doppelt gemacht wird.

---

### Was gebaut wurde

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

### Was gemessen wurde — und hält

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

### Die Kondensate — der Gewinn des Tages

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

### Woran es am Ende hing

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

### Beim Wiederaufmachen

1. `mv library/entwurf/karte-*.json library/` — Raumleiste und
   Laschenname stellen sich selbst um.
2. Zuerst die **Gruppierung**, nicht die Namen: Ereignishaftigkeit als
   Achse, feinere Gruppen für 257 Lieder dieser Spannbreite.
3. Gruppennamen dann per Sprachmodell aus den Kondensaten der Gruppe
   („Ballade · Verhängnis · Warnung"), einmal gerechnet, fest —
   derselbe Weg wie bei den Kondensaten selbst.

---

### Nachtrag, 29.08.2026

Am Tag danach wurde der Rückweg ein anderer, und er ist gegangen —
die Messungen dazu in `docs/GESCHICHTEN-RAUM-EICHKASTEN.md`:

- **Der Lied-Raum bleibt zu**, endgültig (Caspar_D: „den kombinierten
  Raum machen wir nicht wieder auf"). Der Rückweg gilt nur noch für
  `karte-geschichten.json`.
- **Die Namen kommen nicht per Sprachmodell**, sondern aus den
  **Ortsbegriffen** (bin/ortsbegriffe.js): das eigene Kondensat-
  Vokabular, eingebettet mit der vorhandenen ONNX-Strecke, mit Sockel,
  Belegpflicht und Zufalls-Schwelle. Autark, generisch, am Eichkasten
  gemessen — der Punkt 3 oben ist damit überholt.
- Die **Achsen** (Punkt 2) laufen als bin/geschichten-achsen.js
  (Zero-Shot, Sockel eingefroren); die Ereignishaftigkeit als
  Zählachse (Pronomen, Tempus) ist gemessen tragfähig und steht im
  Backlog. Die feinere Gruppierung bleibt offen.
- **Seit dem Abend des 29.08. ist der Raum offen** — als „Geschichten
  (beta)". Die Türen sind also wieder auf, mit ehrlichem Etikett.


---

## Der Eichkasten — Messlauf am Abend

## Der Eichkasten — Messlauf am Abend

Stand 28.08.2026, abends. Am Morgen brach der Geschichten-Raum an den
Gruppennamen (siehe `GESCHICHTEN-RAUM-BILANZ.md`). Am Abend wurde nichts
gebaut und nichts verändert — nur gemessen, auf Caspar_Ds Wort: „Ich lass
dich jetzt mal experimentieren und schaue dann, was rausgekommen ist."

Die Idee dahinter, aus dem Brainstorming des Abends: **Die Playlists sind
handgepflegte, bekannte Wahrheit.** Jede beschreibt Caspar_D mit einem
Satz — und jeder Satz ist eine Vorhersage, die sich an den vorhandenen
Vektoren prüfen lässt. Gemessen wurde in drei Räumen: **Kondensat**
(der Produktivstand, Vektoren aus den zehn Substantiven), **Volltext**
(der Stand von heute Mittag, `kondensate/vorher-vektoren/` — seit 08.09.2026 unter `docs/eichkasten/vorher-vektoren/`) und **Klang**.
Alle 257 Lieder des Geschichten-Raums haben Vektoren in allen dreien.

---

### Der Prüfstein zuerst: Die Messung stimmt

Die Werkgruppen-Leiter der Bilanz, nachgerechnet auf den
Volltext-Vektoren, mit aus den Playlists rekonstruierten Paaren:

| Sprosse | Bilanz (heute Mittag) | nachgerechnet |
|---|---|---|
| Fassungen (v2/v3) | 0,952 (17 Paare) | 0,930 (19) |
| Gegenüber | 0,863 (19) | **0,863 (19)** |
| Übersetzungen | 0,835 (22) | 0,831 (16) |
| Ahnheim-Formzwillinge | 0,793 (11) | **0,791 (7)** |
| Untergrund | 0,661 | 0,658 |

Gegenüber auf drei Stellen exakt, Ahnheim auf zwei Tausendstel mit
anderer Paarauswahl. Zweierlei folgt: Der Messapparat ist belastbar —
und **die Leiter der Bilanz beschreibt den Volltext-Raum**. Der
Produktivstand (Kondensat) hat eine eigene Leiter, und die sieht anders
aus.

---

### Die Leiter in drei Räumen

Mittlerer Kosinus je Paarmenge. Untergrund = alle Paare ohne bekannte
Beziehung (27 507 von 32 896).

| Paare | n | Kondensat | Volltext | Klang |
|---|---|---|---|---|
| Übersetzungen | 16 | **0,916** | 0,831 | 0,918 |
| Fassungen (v2/v3, Titelfamilien) | 19 | 0,905 | 0,930 | 0,815 |
| Ahnheim-Formzwillinge | 7 | 0,852 | 0,791 | **0,471** |
| Gegenüber | 19 | 0,840 | 0,863 | 0,756 |
| Atme-Serie, binnen | 36 | 0,705 | 0,885 | 0,823 |
| Lea-Serie, binnen | 55 | 0,676 | 0,818 | 0,678 |
| Kreuz Lea × Atme | 99 | 0,631 | 0,793 | 0,526 |
| Untergrund | 27 507 | 0,508 ± 0,145 | 0,658 ± 0,144 | 0,491 ± 0,169 |

Was daran hängt:

**Die Sprachnormalisierung ist vollständig.** Im Kondensat-Raum liegen
die Übersetzungen *über* den Fassungen — kondensiert wird ja immer auf
deutsche Substantive, eine Übersetzung wird dadurch zur Fassung. Der
Zauberlehrling und The Sorcerer's Apprentice haben den Kosinus 1,000:
dieselbe Zehnerliste, zweimal gefunden.

**Japanisch ist geheilt.** Die Bilanz notierte „Japanisch trägt nur
halb" — das galt für den Volltext-Raum. Die drei eigenen ja↔de-Paare der
Kaeshi-uta-Playlist, Partner-Rang hin/zurück:

| Paar | Volltext | Kondensat |
|---|---|---|
| 桜の少女 × Sakura Mädchen | 1 / 1 | 1 / 1 |
| 手と木 × Hände und Holz | 2 / **100** | **1 / 1** |
| 本物の守り人 × Wächterin des Echten | 10 / **63** | **1 / 1** |

Auch die deutsch-englischen Härtefälle heilen: Die Braut von Corinth
fand ihre Corinthian Bride im Volltext auf Rang 155, im Kondensat auf
Rang 1; Wirt × Host von 119 auf 2, Lakritz × LICORICE von 34 auf 1.
Von 16 Paaren finden sich im Kondensat-Raum 13 beidseitig auf Rang 1
oder 2 (Volltext: 6).

**Ein Ausreißer, und er ist lehrreich: der Erlkönig.** Volltext Rang
1/1 (0,917) — Kondensat Rang 15/34 (0,793). Zwei unabhängige
Kondensierungen desselben Stoffs können auseinanderlaufen; das
Übersetzungspaar misst im Kondensat-Raum nicht mehr nur das Modell,
sondern **auch die Stabilität des Kondensierens**. Die 16 Paare wären
damit ein stehender Prüfstein für jede künftige Prompt-Fassung.
(Erweckt × Awakened zeigt dasselbe schwächer: Rang 2/12.)

**Die Serien sind die neue mittlere Sprosse.** Auf der geeichten Skala
(0 = Fassungen, 1 = Untergrund) liegen im Kondensat-Raum: Ahnheim 0,13 ·
Gegenüber 0,16 · **Atme-binnen 0,50 · Lea-binnen 0,58 · Kreuz 0,69**.
Genau das erhoffte Bild: Der Raum sieht die Verwandtschaft der Episoden
(binnen deutlich über Untergrund), ohne sie gleichzumachen — und die
Werkgrenze zwischen den beiden Begehrens-Serien existiert, ist aber
schmal (binnen − Kreuz ≈ 0,3–0,5 Untergrund-Streuungen). Der Raum
denkt eher in Themen als in Werken.

**Der Kondensat-Raum spreizt weiter.** Fassungen bis Untergrund:
0,397 statt 0,272 im Volltext — fast anderthalbfache Spannweite. Die
Enge, die die Bilanz am Volltext beklagte, ist mit den Kondensaten
tatsächlich gewichen.

---

### Ahnheim, aufgeklärt

Die Zeitenhall-Playlist trägt neun Nachbar-Paare. Der Klang sortiert
sie von selbst in zwei Sorten:

| Paar | Kondensat | Volltext | Klang |
|---|---|---|---|
| Ulrich & Ännchen × Ulrich & Ännchen | 0,955 | 0,810 | 0,364 |
| Hoch auf dem Lebenswagen × Der Wagen des Lebens | 0,908 | 0,960 | 0,389 |
| Randers × Nis Randers | 0,938 | 0,813 | 0,563 |
| Belsazar × Belsazar, König von Babylon | 0,933 | 0,802 | 0,508 |
| Finst're Nacht × Dunkel war's, der Mond schien helle | 0,886 | 0,671 | 0,457 |
| Das rote Zimmer × Haus im Roten Licht | 0,742 | 0,805 | 0,498 |
| Der Tod und das Mädchen × Der Todt vnd das Mägdlein | **0,604** | 0,676 | 0,519 |
| *Schlaraffenland 2.0 × v3 (Fassung)* | 0,972 | 0,816 | *0,876* |
| *Der Blogger × v2 (Fassung)* | 0,915 | 0,934 | *0,829* |

Die sieben echten Formzwillinge: Kondensat 0,852, Klang **0,471 — unter
dem Klang-Untergrund von 0,491**. Der schönste Befund der Bilanz („im
Geschichten-Raum nah, im Klang-Raum unter Zufall fern") bestätigt sich
an der ganzen Reihe. Die zwei Fassungspaare verraten sich umgekehrt
durch Klang-Nähe.

Der auffällige Fall Tod und Mädchen (0,604 / 0,676) löste sich durch
Lektüre beider Texte: **Die zwei erzählen wirklich Verschiedenes.**
„Der Todt vnd das Mägdlein" ist der werkstreue Claudius — Todesfurcht,
sanfter Trost, Ergebung; der Tod gewinnt mild („Sollst sanft in meinen
Armen schlafen"). „Der Tod und das Mädchen" ist eine Gegenerzählung
derselben Szene: Das Mädchen glüht, verführt, verweigert sich — und
schickt den Tod fort („Komm wieder, wenn die Glut verfliegt"). Die
Kondensate tragen genau diesen Unterschied: *Trost, Sanftmut, Ergebung*
gegen *Lebensgier, Weigerung, Aufschub* — bei nur drei gemeinsamen
Wörtern (Tod, Zwiegespräch, Jugend). Der Abstand ist kein schwaches
Kondensat, sondern eine richtige Messung. Damit ist das Paar kein
Ahnheim-Formzwilling im engen Sinn, sondern etwas Eigenes: ein
**Enden-Zwilling** — gleiche Szene, gegenläufiger Ausgang. Für die
Verlaufs- und Mythoi-Achse aus der Bilanz-Liste (Komödie / Romanze /
Tragödie / Ironie fürs Ende) wäre es der erste handverlesene Prüfstein.

---

### Das Vier-Felder-Schema: Soll gegen Ist

Kompaktheit je Gruppe als z-Wert gegen den Untergrund des jeweiligen
Raums (gefaltet: eine Stimme je Werkfamilie; nur eigene Lieder).
Caspar_Ds Ein-Satz-Beschreibungen sind die Soll-Spalte.

| Gruppe | n | Soll | Geschichte z | Klang z |
|---|---|---|---|---|
| Barden-Balladen | 12 | Erzählform | **1,47** | 1,48 |
| Vor langer Zeit (eigener Anteil) | 12 | Sagen, alter Duktus | 1,47 | 1,48 |
| Deutsche Schatten | 22 | Klassiker-Vorlagen | 1,33 | 1,64 |
| Teutonic Tales | 7 | dito englisch | 1,26 | 1,81 |
| Atme-Serie | 9 | ein Bogen, durchlebt | 1,36 | 1,97 |
| Lea-Serie | 11 | eine Welt, erzählt | 1,16 | 1,11 |
| **Essen & Trinken** | 8 | Stoff kompakt, Stile bunt | **0,81** | **0,17** |
| Gute Laune Pop | 8 | Haltung; sie steuert | 0,58 | **2,26** |
| **Bio-Gefahr** | 13 | „alles Wissenschaftsthemen" | **−0,10** | 1,55 |
| Biohazard | 5 | dito englisch | −0,16 | 2,18 |
| NDH Inferno | 68 | Klang | 0,02 | 1,81 |
| My Industrial Songs | 94 | Klang | 0,12 | 1,41 |
| Minimal Electronic | 14 | Klang | −0,61 | 1,61 |
| Energy Metal | 5 | Klang | −0,36 | 2,05 |
| Hochgefühl | 15 | Stimmung | 1,04 | 1,34 |
| DeutschPop 2025 | 19 | Regal | −0,22 | 0,39 |

Das Muster sitzt fast überall: **Alle vier Klang-Playlists liegen im
Geschichten-Raum bei null und im Klang-Raum hoch** — die Räume messen
nachweislich Verschiedenes, jetzt als Fläche, nicht nur am
Ahnheim-Paar. Essen & Trinken ist wie vorhergesagt das Gegenstück:
im Geschichten-Raum kompakt, im Klang-Raum nicht. „Nice Songs", „Fokus-
Wanderung" und „EDM" bestehen fast ganz aus fremden Liedern (n ≤ 1 im
eigenen Bestand) — die Regale stören die Eichung nicht einmal.

**Die eine Soll-Verletzung ist der Hauptbefund: Bio-Gefahr.**
Laut Autor eine Stoffgruppe („alles Wissenschaftsthemen") — im
Kondensat-Raum aber gar nicht kompakt (z = −0,10). Der Blick in die
Kondensate erklärt es: Die Gruppe teilt zwar Wörter (Kontrollverlust ×4,
Vermehrung, Selbstzerstörung, Neurochemie ×3), aber sie zerfällt in
zwei Wolken — die Zell-Ecke (Dogma, Wirt, Autophagie: Erbgut, Eiweiß,
Fließband) und die Begehrens-Ecke (Testosteron, Kuss: Begehren,
Tanzfläche). „Wissenschaft" ist ein Abstraktum, das in keinem
Kondensat steht — die Klammer existiert im Kopf des Autors und im
Klanggewand (z = 1,55), nicht im Substantiv-Raum.

Das Spiegelbild dazu: **Die Balladen teilen fast kein einziges Wort**
(Tod ×3, Grabmal ×2, Hochmut ×2 — das ist alles) und sind trotzdem die
kompakteste Stoffgruppe (z = 1,47). Sie halten über Wort*nachbarschaft* —
Tod, Grab, Fluch, Nacht liegen im Vektorraum beieinander. Damit ist die
Dreistufung der Benennungswege gemessen, nicht nur vermutet: Die
Kontrastrechnung auf Wortgleichheit konnte die Balladen *prinzipiell*
nicht benennen. Und eine Überraschung am Rand: Die Essen-Kondensate
handeln kaum von Speisen — sie kondensieren auf **Rausch, Begehren,
Sucht, Völlerei, Ritual**. Fassung 2 benennt, WOVON ein Lied handelt,
und hebt dabei eine Abstraktionsebene ab. Das heilt Sprachen und
findet Zwillinge — und es zieht zugleich verschiedene Stoffe auf
dieselben Abstrakta zusammen: „Begehren" steht in den Kondensaten von
Gute Laune Pop (6 von 8!), Bio-Gefahr (3) und Essen & Trinken (3).

---

### Die vorhergesagte Kollision — und ein Nullbefund

**Gute Laune Pop verschmilzt im Geschichten-Raum mit der Lea-Serie.**
Binnen 0,592, Kreuz zu Lea 0,579 — praktisch kein Unterschied; nur der
Klang-Raum trennt die beiden scharf (binnen 0,872, Kreuz 0,593). Die
Hotelvokabular-Prognose aus dem Gespräch war richtig: Was die zwei
Gruppen unterscheidet — dort „zwischen Nie und Nah", hier „knistert,
oberflächlich, sie steuert" —, ist eine Haltung, und die steht in
keinem Substantiv. Für die Ironie-Klammer sind die Kondensate blind;
das ist jetzt gemessen, nicht nur befürchtet.

**Der Zeitpfeil ist nicht nachweisbar.** Ob benachbarte Episoden
einander ähnlicher sind als entfernte: Lea rho = −0,16 (p = 0,88),
Atme rho = 0,19 (p = 0,13), im Volltext ebenso wenig. Bei elf und neun
Episoden wäre nur ein starker Effekt sichtbar gewesen; es gibt keinen.
Die Erzählordnung lebt in der Playlist, nicht im Raum.

---

### Die Achse, ohne Modell gezählt

Drei billige Zähler auf den gefilterten Texten (nur hinreichend
deutsche; Regie entfernt wie beim Einbetten): Präteritum-Signale je 100
Wörter, Erzähl-Anteil (3. Person an allen Personalpronomen),
Imperativ-/Ausruf-Zeilen.

| Gruppe | n | Prät./100 W | Erzähl-Anteil | Imperativ % |
|---|---|---|---|---|
| Barden-Balladen | 12 | **4,52** | **0,518** | 5,3 |
| Lea-Serie | 11 | 3,29 | 0,225 | 1,1 |
| Essen & Trinken | 9 | 2,45 | 0,196 | 8,4 |
| Atme-Serie | 9 | 2,16 | **0,018** | 1,6 |
| Bio-Gefahr | 16 | 1,71 | 0,278 | **21,9** |
| Gute Laune Pop | 8 | **0,71** | **0,006** | **10,4** |
| Betrachtungen (Okkultation, Gleich, Stumm) | 3 | 2,78 | 0,128 | 6,4 |
| Balladen-Enden (Erlkönig, Belsazar, Ulrich) | 3 | 2,48 | **0,527** | 8,6 |

Drei Lehren:

1. **Der Pronomen-Zähler trägt.** Er trennt die bekannten Enden
   (0,527 gegen 0,128) und staffelt die Begehrens-Gruppen exakt nach
   ihrer Grammatik: Lea erzählt (0,225), Atme spricht als Ich (0,018),
   Gute Laune fordert (0,006 — aber 10,4 % Imperativzeilen gegen 1,1
   und 1,6 der Schwestern). Die Titel-Beobachtung des Abends —
   Substantivserie, Verbserie, Imperativserie — steht jetzt als Zahl.
2. **Der Tempus-Zähler allein reicht nicht.** Der Erlkönig hat nur
   1,44 Präteritum-Signale je 100 Wörter und einen Erzähl-Anteil von
   0,172 — die Ballade erzählt durch *Rede*, nicht durchs Präteritum.
   Ereignishaftigkeit ist mehr als Tempus; die Achse braucht mehrere
   Zähler, und der Erlkönig gehört als Härtefall in jeden Test.
3. **Der Imperativ-Zähler misst zweierlei**: Lenkung (Gute Laune) und
   Parole (Bio-Gefahr 21,9 % — brachial und druckvoll heißt auch:
   Ausrufezeichen). Er taugt als Kontrast *innerhalb* eines Stoffs,
   nicht als Achse für alles.

Randnotiz: Okkultation, Gleich und Stumm tragen im Katalog
`hatGesang: false`, haben aber Text und Vektor — das Flag misst
offenbar etwas anderes als Textbesitz.

---

### Trägt die Karte? — Die Unterdimensionen-Frage

Caspar_Ds Einwand am Abend: Vielleicht geht das alles gar nicht, „weil
es immer nur Unterdimensionen gibt, wo unsere Playlists nahe beieinander
sind" — die eine Karte kann nicht alle Nachbarschaften des
768-dimensionalen Raums gleichzeitig zeigen. Nachgemessen an der
geparkten Karte (Stress 2D 0,238 · 3D 0,169):

**Kompaktheit der Gruppen, z-Wert je Projektion:**

| Gruppe | 768d | NMDS 2D | UMAP 2D | NMDS 3D | UMAP 3D |
|---|---|---|---|---|---|
| Balladen | 1,42 | 1,03 | 1,17 | 1,20 | 1,21 |
| Atme-Serie | 1,32 | 0,81 | 0,92 | 0,85 | 0,94 |
| Deutsche Schatten | 1,26 | 1,02 | 0,76 | 1,12 | 0,90 |
| Teutonic Tales | 1,21 | 0,83 | 0,66 | 0,97 | 0,77 |
| Lea-Serie | 1,12 | 0,96 | 0,62 | 0,99 | 0,68 |
| Essen & Trinken | 0,83 | **0,22** | 0,18 | 0,58 | 0,88 |
| Gute Laune Pop | 0,55 | 0,47 | **−0,27** | 0,56 | −0,43 |
| Bio-Gefahr | −0,30 | −0,47 | 0,34 | −0,07 | 0,32 |

**Nachbarschaftstreue** (Anteil der echten zehn nächsten Nachbarn, die
die Projektion unter ihren zehn behält; Zufall wäre 0,04): NMDS 2D
**0,28** · UMAP 2D 0,47 · NMDS 3D 0,38 · UMAP 3D 0,51.

Der Einwand ist also berechtigt: **Die 2D-Karte verliert.** Wer auf ihr
zum optisch nächsten Punkt geht, trifft in gut zwei Dritteln der Fälle
keinen echten Nachbarn; die schwächeren Gruppen (Essen & Trinken)
verwaschen in der Fläche. Aber zweierlei fängt das auf:

1. **Die gespeicherte Nachbarliste der Karte stammt aus dem echten
   Raum.** Deckung mit den 768d-Kosinus-Nachbarn: **1,000** über alle
   257 Lieder (die gespeicherte Distanz ist √(1 − Kosinus), dieselbe
   Ordnung). Das Wandern zu den Nachbarn — der Kernnutzen — ist damit
   von der Projektion unabhängig und lügt nicht. Die Karte ist das
   Fenster, nicht der Raum.
2. **Die benannten Inseln hängen nicht an der Geometrie.** Kommen
   Farben und Namen aus den Playlists, bleibt eine Gruppe auch dann
   wahr, wenn die Projektion sie auseinanderzieht — das Zerlaufen wird
   sichtbare Information („diese Klammer wohnt nicht im Stoffraum")
   statt eines Fehlers.

Merkregel daraus: Aus der 2D-Geometrie darf nichts abgeleitet werden —
keine Gruppen aus Karten-Klumpen, keine Namen aus Karten-Nähe. Lesen
darf man sie wie eine Landkarte: für den Überblick, nicht fürs Messen.
Wo mehr Treue gebraucht wird, liegen die Stellschrauben schon in der
Datei: 3D bewahrt deutlich mehr (Essen & Trinken 0,88 statt 0,18), und
UMAP hält Nachbarschaften besser, wo NMDS die großen Abstände besser
hält.

---

### Ortsbegriffe: von Koordinaten zu Wörtern (Nachtrag 29.08.)

Caspar_Ds Frage: Wie erfährt man für eine Stelle im Raum, welche
Begriffe sie beschreiben? Der Weg, prototypisch gemessen:

1. **Das Vokabular des Bestands einbetten** — die 1454 verschiedenen
   Kondensat-Wörter, mit derselben mpnet-ONNX-Strecke wie die Lieder
   (9,5 s auf der CPU, einmalig, dann fest). Jedes Wort liegt damit im
   selben 768er-Raum.
2. **Sockel abziehen**: Ein Wort beschreibt eine Stelle, wenn es ihr
   deutlich näher ist, als es dem Gesamtbestand im Mittel ist —
   dieselbe Sockel-Idee wie bei den Zero-Shot-Achsen. Ohne den Abzug
   gewinnen die Wörter der Raummitte.
3. **Belegpflicht**: Kandidaten sind nur die Wörter der zwanzig
   nächstliegenden Lieder; die Vektor-Nähe reiht nur noch, was belegt
   ist. Das tilgt morphologischen Beifang („Zungenbrecher" stand sonst
   über den Deutschen Schatten, weil Subword-Einbettungen Komposita
   klumpen) und macht jeden Begriff rückverfolgbar zu einem Lied.

Proben (Wert = Nähe minus Sockel): Okkultation-Stelle →
**Sonnenfinsternis 0,42**, Mondlicht, Sternenlicht, Saros.
Erlkönig-Stelle → **Kindsverlust, Trauer, Vaterliebe, Kinderangst,
Mutterangst** — Wörter teils aus Nachbarliedern, nicht aus dem eigenen
Kondensat: Feldnachbarschaft statt Worthäufigkeit, genau was der
Kontrastrechnung fehlte. Playlist-Schwerpunkte: Ahnheim → Königsmord,
Gotteslästerung, Totenbraut; Lea → Einsamkeit, Abschiedsbrief,
Heimlichkeit; Essen & Trinken → Kochrezept, Mahlzeit, Abendessen.
**Bio-Gefahr → Samenzelle, Zellverfall, Neurochemie, Autophagie** —
der Schwerpunkt der räumlich zerlaufenen Gruppe trägt trotzdem
präzise Ortsbegriffe; die Lage einer Playlist ist als Schwerpunkt
also benennbar, auch wo die Wolke den halben Raum überdeckt.

Selbsttreffer als Maß: An der Stelle jedes Lieds landet dessen
eigenes Vokabular im Mittel auf Median-Rang 118 von 1454 (oberste
8 %); bei 54 % der Lieder steht das erste Kondensatwort in den Top 10
der Stelle. Ordentlich, nicht perfekt — die Stelle mittelt ja zehn
Wörter. Die bekannte Grenze bleibt: Die Ironie-Klammer ist auch hier
unsichtbar (Gute Laune Pop → Liebesnacht, Sommerabend, Flirt — die
Oberfläche). Damit ist der Weg für eine Karten-Auskunft frei: Stelle
→ zwanzig nächste Lieder → belegte, gesockelte Ortsbegriffe — autark,
ohne Sprachmodell, Wortvektoren einmal gerechnet und gecacht.

---

### Was daraus folgt

1. **Der Eichkasten funktioniert und bleibt.** Alle Sprossen und
   Gruppen kommen aus Playlists und Titelmustern — jede künftige
   Änderung an Modell, Prompt oder Karte lässt sich in Minuten gegen
   dieselbe Wahrheit messen. Die 16 Übersetzungspaare prüfen dabei
   neuerdings auch die Kondensat-Stabilität (Erlkönig-Fall).
2. **Für die Gruppierung:** Der Kondensat-Raum trägt Themen gut
   (Balladen z = 1,47, Serien als eigene Sprosse), aber Werkgrenzen
   schwach und Haltungen gar nicht. Eine Gruppierung allein auf
   Kondensat-Vektoren wird Gute Laune in Lea hineinlegen und
   Bio-Gefahr zerteilen — Erstere trennt nur der Klang, Letztere nur
   der Autor. Das spricht für das Dreiklang-Bild des Abends: Stoff aus
   dem Kondensat-Raum, Ton aus dem Klang-Raum, Form von den Achsen.
3. **Für die Achse:** Pronomenverteilung zuerst, Tempus als Beifang,
   Imperative als Stoff-interner Kontrast. Prüfsteine: die zwei Serien,
   die Balladengruppe, der Erlkönig als bekannter Härtefall.
4. **Für die Namen:** Gemessen bestätigt — die Serie wäre per
   Wortkontrast benennbar (Eigennamen), Essen & Trinken per Wortfeld,
   Balladen und Bio-Gefahr nur eine Bedeutungsebene höher. Wer alle
   vier trifft, hat die Dreistufung gemeistert; die Playlist-Namen sind
   die Soll-Antworten.

### Wie gemessen wurde

Rein lesend auf `library/geschichten.json`,
`docs/eichkasten/vorher-vektoren/geschichten.json` (bis 08.09. `library/kondensate/vorher-vektoren/`),
`library/klang.json`, `library/katalog.json.gz`. Paare: Fassungen über
Titelfamilien (v-Suffixe, ß/ss); Gegenüber und Ahnheim über
Nachbarpositionen ihrer Playlists; Übersetzungen über Deutsche
Schatten ↔ Teutonic Tales (Position 1–7), Bio-Gefahr ↔ Biohazard
(Titel), Lakritz und die drei Kaeshi-uta-Paare. Gruppen gefaltet auf
eine Stimme je Werkfamilie. Untergrund = alle Paare ohne bekannte
Beziehung. **Die Messskripte liegen in `docs/eichkasten/`** (LIESMICH
dort) und laufen jederzeit rein lesend; alle Definitionen stehen
zusätzlich oben, der Lauf ist auch ohne sie wiederholbar.

### Umgesetzt noch am selben Tag

Die Folgerungen 2 bis 4 sind gebaut (29.08.2026, abends): Gruppennamen
aus **Ortsbegriffen** (bin/ortsbegriffe.js, in bin/karte.js), die
Text-Achsen als bin/geschichten-achsen.js, der Lied-Raum gestrichen,
der Wartungslauf pflegt den Raum nur, wenn er offen ist. **Der Raum
ist seit dem Abend des 29.08. offen** — als „Geschichten (beta)", denn
Caspar_D: „das ist es noch nicht so richtig." Was noch aussteht, im
Backlog unter „Geschichten-Raum: nächste Schritte" und „Kondensate
ohne Bezahl-Modell — HANDLUNGSBEDARF".


---
