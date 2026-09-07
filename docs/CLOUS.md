# Clous — was KlangTresor können könnte, das andere nicht können

**Stand 07.09.2026.** Caspar_D: *„ich will eigentlich was am Klangtresor
machen, was in Musiksoftware etwas neues ist, irgendein Clou oder
Knüller, sowas wie den Klangraum. Dieses Kaliber."*

Dieses Dokument sammelt, was nach einem Tag Suche und Messung übrig
geblieben ist. Es ist keine Wunschliste: Jeder Eintrag trägt, was
gemessen wurde, was es kostet und woran es scheitern kann. Was an den
eigenen Zahlen gescheitert ist, steht am Ende — damit es niemand ein
zweites Mal rechnet.

Die Herkunft: 48 Agenten haben 24 Ideen erzeugt und jede auf Neuheit und
Datenlage geprüft; die Vorlage im Wortlaut steht in
`docs/eingang/2026-09-07-ideenvorlage.md`. Alles zur Strukturanalyse in
`docs/SONGSTRUKTUR.md`.

---

## 1. Das Doppel-Bogendiagramm — am weitesten gediehen

**Was es ist.** Zwei Bogendiagramme übereinander auf gemeinsamer
Zeitachse: oben die Wiederholungen der Musik, gemessen; unten die des
Textes, belegt; dazwischen Sunos Abschnittsmarken. Der Betrachter sieht
selbst, wo Messung und Beleg zusammenfallen — das Bild behauptet nichts,
es stellt gegenüber.

**Stand:** gemessen und gezeichnet, aber noch nicht im Analyzer.
60 % der Abschnittspaare werden gefunden, 20 Bögen je Lied, 4,5 Sekunden
Rechenzeit je Lied. Details in `docs/SONGSTRUKTUR.md`.

**Warum es das noch nicht gibt.** Ein Bogendiagramm von Liedtexten
existiert nirgends — die gesamte Textwiederholungsforschung zeichnet
Matrizen. Silva, Yeh, Batista & Keogh haben 2016 auf der ISMIR
Arc-Diagramme aus dem Matrix Profile skizziert, mit Zitat auf Wattenberg,
und es nie ausgebaut. Fell u. a. haben 2021 gemessen, dass Text und Audio
sich **ergänzen** statt sich zu doppeln (70,8 / 70,4 / 75,3 % F1) — das
ist die Rechtfertigung, aber sie haben Matrizen gezeichnet, keine Bögen.

**Was fehlt:** Einbau in den Analyzer, Reduktion der Bogenzahl, und die
18 % nahen Wiederholungen (Tandem Repeats), die kein
Nicht-Überlappungs-Verfahren erreichen kann. Für die letzten beiden gibt
es seit heute Abend je eine Vorlage
(`docs/eingang/2026-09-07-tandem-repeats.md`): die Suchrichtung umdrehen —
statt für jede Position die k ähnlichsten Partner, für jeden Versatz d
die maximalen periodischen Strecken, mit Zählfenster `max(d, 20)` — und
für die Darstellung die Bogenhöhe an den Versatz binden statt an nichts,
dann liegen Tandembögen flach an der Achse und Refrainbögen hoch. Beides
ungemessen.

**Der Vorbehalt, den ein Gutachter zuerst schriebe:** Der Bestand ist
maschinell erzeugt. Genau das, was die Messung begünstigt — dieselbe
Strophe ist wirklich derselbe Klang —, macht ihn als Beleg für Musik im
Allgemeinen angreifbar. Umgekehrt ist er für die Frage „wie strukturiert
ein Generator" ein ungewöhnlich sauberer Datensatz, den sonst niemand hat.

---

## 2. Die Taktweiche — das große Kaliber

**Was es ist.** Der Bestand als Streckennetz in der Zeit. Ein Lied läuft,
vor dem Spielkopf liegt ein schmales Band mit den nächsten acht Takten.
Wo ein Takt einen gemessenen Ausgang in ein anderes Lied hat, steht dort
eine Weiche. Nimmt man sie, setzt das andere Lied auf der Eins ein, der
Ton reißt nie. Nach einer Stunde ist man durch zwanzig Lieder gefahren,
ohne eines ausgewählt zu haben.

**Was trägt:** 169.766 gemessene Schläge, davon 47.159 Zählzeit-Einsen,
kein Lied unter 57 — daraus 43.445 lückenlose Acht-Schlag-Fenster über
306 Lieder. Tempoangleich und Uhrmechanik stehen aus dem Tonstudio
bereits. Trennschärfe geprüft: Zufallspaare bei 0,998, bester Nachbar bei
0,317.

**Draußen gibt es die Hälften einzeln:** Infinite Jukebox (2012)
verzweigt taktweise, aber nur *innerhalb* eines Liedes. AutoMashUpper
(2013) vermisst einen Bestand, liefert aber ein fertiges Stück statt einer
Fahrt. Wwise und Abletons Follow Actions verzweigen von Hand gebaut. Über
einen gemessenen Bestand, während man hört: nirgends.

**Was schiefgehen kann.** 78 % der besten Treffer sind transponiert,
während der Ton tonhöhenfest bleiben soll. Die Schwelle darf kein Regler
werden und entscheidet trotzdem alles: bei 0,20 haben 85 % der Takte
keinen Ausgang, bei 0,35 im neunzigsten Perzentil zweihundert. Deck B ist
zwölf Sekunden vor Songende schon für die Endnaht belegt — es bräuchte
einen dritten Tonweg.

**Erster Schritt:** kein UI, kein Ton. Die Fenster in Schlägen statt in
Zonen neu bauen, Transposition auf null festnageln, auszählen wie viele
der 43.445 Takte bei 0,25 und 0,30 überhaupt einen Ausgang haben. Bei
Transposition 0 fällt die Ausbeute von 56 % auf 32 %.

---

## 3. Das Schlagblatt — das sicherste

**Was es ist.** Das Lied in seinen eigenen Schlägen statt in Sekunden.
Darüber zwei Lineale: Sunos nachträgliche Abschnittsgrenzen und die
eigenen `[chorus]`-Marken aus dem Liedtext. Sie decken sich nicht, und
**das** ist der Inhalt: nur 47,5 % der Grenzen liegen auf einer Zählzeit,
im Median 87 ms daneben, im schlimmsten Fall 560 ms. Das Blatt sagt
nicht, wer recht hat.

**Was trägt:** `schlaege` 323/323, Raster sehr stabil (Schwankung im
Median 0,004, 169.443 Übergänge ohne einen Ausreißer). `abschnitte`
323/323. Die ganze Rechnung für alle Lieder: 766 Millisekunden.

**Warum es das noch nicht gibt.** Songle und die DJ-Programme zeigen
Schlagraster. Das Neue ist schmal: die Selbstauskunft der erzeugenden
Maschine liegt urteilslos neben der Messung an ihrem eigenen Ergebnis.
Das macht kein Werkzeug, weil es sonst niemanden gibt, der den Text
vorher geschrieben hat.

**Was schiefgehen kann:** alles, was einfärbt. Die Ähnlichkeit aller
Schlagpaare liegt zwischen 0,89 und 1,00; eine Quantilschwelle darauf
macht aus 0,02 Kosinus eine Farbe. Also keine Färbung, kein Vierergitter
(15 % der Takte sind keine Vierer).

---

## 4. Die Wortkette

**Was es ist.** Jedes gesungene Wort wird zur Adresse im ganzen Bestand.
„Nacht" anklicken: 119 Fundstellen aus 62 Liedern, jede mit der Zeile
drumherum. Ein Druck, und die Kette läuft — zwei Sekunden vor und nach
dem Wort, ein Lied nach dem anderen, durch Metal, Ballade und
Plattdeutsch.

**Was trägt:** 259 Lieder mit Wortmarken, 84.416 gesungene Marken nach
Abzug der Regieklammern, 11.243 Wortformen, 1.629 in mindestens fünf
Liedern. Die Umkehrliste sind 1,9 MB reines Sortieren.

**Der Dämpfer:** Es gibt das im Kern seit 2014 als audiogrep/videogrep
(Lavigne) — alle Fundstellen eines Wortes zu einem Supercut. Der
Lyrics-Seeker des SyncPlayer (Bonn 2007) springt an die gesungene Stelle.
Neu wäre nur die Verschmelzung: die Konkordanz als lebende Spalte im
laufenden Player statt als Kommandozeile mit exportierter Datei.

**Was schiefgehen kann:** 12.419 Wortmarken stehen in Regieklammern und
werden nie gesungen. 10,2 % der Wörter haben keine eigene Sekunde. Und
eine selbstrechnende Häufigkeitsgrenze gibt es nicht — die Verteilung hat
keine Kante.

---

## 5. Die Fassungspaare

**Was es ist.** Das Archiv findet selbst, welche seiner Lieder dasselbe
Lied sind: *Points of Light* und *Lichtpunkte*, *Host* und *Wirt*, *Sir
Ribbeck* und *Herr von Ribbeck*. Am Lied steht die Zeile: dieses Lied
gibt es noch einmal, dort. Kein Pfeil, keine Herkunftsbehauptung — nur
„gefunden".

**Was trägt:** `chroma` in allen 323 `.bin`, ein Messweg, null Ausfälle.
Der volle Lauf über 52.003 Paare hat gemessene 641 Sekunden gebraucht,
einkernig, 230 MB.

**Die Lage ist der Unterschied:** Panako und audfprint machen genau diese
Duplikatsuche. Aber Sunos Herkunftsfelder sind für diesen Bestand tot —
35 `upsample_clip_id`, davon **null** im Archiv auflösbar; 98
`concat_history`, null auflösbar. Der Katalog kennt neun markierte
Übersetzungen, der Lauf findet deutlich mehr.

**Was schiefgehen kann:** Auf Stellenebene tot — 92 der 200 stärksten
Funde sind Naturklang gegen Naturklang. Und es gibt keine trennende
Schwelle: ein Fremdpaar bei 0,847, ein echtes Fassungspaar bei 0,815, ein
belegtes Upsample-Paar bei 0,698. Der einzige ehrliche Bau: Instrumentals
raus, keine Schwelle, eine nach Abstand geordnete Liste, von Hand
abhaken. Danach steht ein **bestätigtes** Register im Katalog.

---

## 6. Kleineres, das trägt

- **`bandFlux` und `entropy` sichtbar machen.** Beide werden gerechnet,
  in der Ablage gehalten und in keiner Bahn gezeigt. `bandFlux` trägt bei
  der Wiederholungssuche fast so weit wie Chroma — und seine oberen drei
  Bänder allein fast so weit wie alle acht.
- **Der Rauschboden.** 74-mal wurde derselbe Zettel wortgleich zweimal
  abgeschickt. Wie weit die beiden Ergebnisse auseinanderliegen, weiß das
  Archiv und hat es nie gezeigt.
- **Das Modulationsspektrum als Kurve** (aus der Hirnfrequenz-Frage): im
  Analyzer, waagerecht 0,3–10 Hz logarithmisch, mit 1/f-Geraden und einem
  Strich bei `taktBpm`. Ohne Zahl, ohne Bandnamen. Überschrift:
  „Schwankung der Lautheit über die Zeit". Eine Kurve behauptet keine
  Genauigkeit — und die Gerade zeigt sofort, dass der Gipfel ein Hügel
  ist. Mehr ist dort nicht ehrlich zu holen: 30 % der Lieder nennen aus
  ihren eigenen zwei Hälften zwei verschiedene Werte.
- **Der Videoexport** (Cover-Art, Untertitel, Alias) — der einzige Punkt
  auf Caspar_Ds eigener Bereichsliste, der etwas erzeugt, das den Tresor
  verlässt. Fünfstufige Strecke im Thread vom 06.09. beschrieben
  (`docs/eingang/2026-09-06-threads-unterwegs.md`).
- **Hörkompensation mit Hörtest.** Steht auf Caspar_Ds Liste. Nicht neu
  in Musiksoftware (Sonarworks SoundID, Mimi), aber im Haus schlüssig,
  weil die Einmessung schon da ist.

---

## 7. Was an den eigenen Zahlen gescheitert ist

Damit es niemand ein zweites Mal rechnet.

| Idee | Woran |
|---|---|
| **Der Gegenlauf** (wo Text und Klang auseinanderziehen) | r = 0,003 über 7.515 Fenster. Wo es keinen Gleichlauf gibt, gibt es keinen Gegenlauf. **Aber:** die Ersatzgröße war Wörter/s gegen Anschläge/s — eine faire Messung mit Valenzwörterbüchern steht aus |
| **Das Schichtbild** (Handschrift der Modellversionen) | null Paare aus zwei unabhängigen Erzeugungen über eine Modellgrenze; alle Kandidaten sind dieselbe Aufnahme mit anderer Versionsmarke |
| **Die Wortwaage** (Prompt gegen Ergebnis) | am 23.08.2026 schon verworfen, `docs/ERFUNDENES.md` Abschnitt 5. Der beworbene Effekt (0,102) ist kleiner als das, was derselbe Zettel zweimal erzeugt (0,150) |
| **Die Rückbögen** (Lied verbunden mit seinem klanglichen Vorfahren) | 30 der 44 Bögen über 90 Tage haben einen Abstand **über** dem Median — es sind Reste, keine Wiederkehr |
| **Der Hörplatzteppich** (Datei-Pegel gegen Mikrofon-Pegel) | ein unbekannter Kalibrierversatz lässt den Anteil leerer Zellen zwischen 19 % und 91 % wandern |
| **Die Raumspur** | bricht die Regel, dass Messungen exklusiv laufen |
| **Die Zugbahnen** (neue Lieder in die Karte einzeichnen) | NMDS hat keine Out-of-Sample-Projektion — **fragwürdig**, dafür gibt es Nyström und Landmark-MDS; die Verwerfung ist nicht nachgeprüft |
| **Der Gabelweg** (Sammlung als Entscheidungsbaum) | nur das Tempo hat ein Tal (109,5 BPM); der Baum endet nach drei Gabeln, größtes Blatt 92 Lieder |
| **Gehirnwellen-Ankopplung** | messbar ist nur die Musik, nie der Hörer. Der Gipfel im Modulationsspektrum ist ein Hügel: Schärfe 67 gegen 15.233 bei echter Sinusmodulation, und 30 % der Lieder nennen aus zwei Hälften zwei Werte. Ein EEG-Weg scheitert am Störabstand — Nutzsignal Zehntel-Mikrovolt gegen Lidschläge von 100–200 µV im selben Band |

**Eine Nachprüfung dieser Verwerfungen ist angehalten** (Workflow
`wjpdeqkd1`, verlustfrei fortsetzbar). Anlass war Caspar_Ds Rüge, dass
ein Nein aus einer nicht hinterfragten Merkmalswahl kein Nein ist. Bei
mindestens zwei Fällen — Gegenlauf und Zugbahnen — steht der Verdacht im
Raum, dass die Begründung nicht trägt.

---

## 8. Die Reihenfolge, wenn es nach den Zahlen ginge

1. **Schlagblatt** — die Daten liegen vollständig, 766 ms Rechenzeit,
   keine Schwelle nötig, der Befund ist schon gemessen und wartet nur
   darauf, gezeichnet zu werden.
2. **Doppel-Bogendiagramm** — am weitesten gediehen, 60 % gemessen, und
   es ist die einzige Idee, deren Kern draußen nachweislich fehlt.
3. **Fassungspaare** — ein Nachmittag Rechnen, eine Stunde Abhören, und
   danach steht ein bestätigtes Register im Katalog.
4. **Taktweiche** — das größte Kaliber, aber drei Entscheidungen und ein
   Eingriff in den Tonpfad davor.

Die Entscheidung trifft Caspar_D.
