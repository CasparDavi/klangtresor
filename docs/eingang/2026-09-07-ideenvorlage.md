# Ideen vom Kaliber Klangraum — die Vorlage vom 07.09.2026

**Status: OFFEN — nichts entschieden, nichts gebaut**

Caspar_D am 07.09.2026: *„ich will eigentlich was am Klangtresor machen,
was in Musiksoftware etwas neues ist, irgendein Clou oder Knüller, sowas
wie den Klangraum. Dieses Kaliber. Aber mir fehlt grade die Inspiration."*

Daraufhin eine breite Suche: vier Kundschafter nahmen den Bestand auf
(welche Daten liegen ungenutzt herum, was kann die App schon, was wurde
verworfen, was gibt es draußen), acht Ideengeber mit verschiedenen Linsen
lieferten 24 Vorschläge, und jeder ging durch zwei Prüfungen — ist der
Kern wirklich neu (Websuche gegen Roon, Plexamp, Serato, Songle, Infinite
Jukebox, audiogrep, Panako, ISMIR-Arbeiten), und trägt der vorhandene
Datenbestand ihn überhaupt. 48 Agenten, 1646 Werkzeugaufrufe.

**Die Zahlen in diesem Dokument stammen aus Messungen am eigenen
Bestand**, die die Prüfer selbst gerechnet haben. Wo eine Idee an ihren
eigenen Zahlen gescheitert ist, steht das unten unter „Was rausgeflogen
ist" — dieser Teil ist womöglich der nützlichere.

---
# Vorlage für die Entscheidung

## Was bei der Suche herauskam

Ehrlich: vom Kaliber Klangraum gibt es genau eine, und auch die nur zur Hälfte. Dreizehn Ideen sind durch die Neuheits- und die Machbarkeitsprüfung gegangen. Zwei haben beide bestanden. Die **Taktweiche** ist die einzige, die groß ist, in den Daten trägt und deren Kern draußen nicht existiert — aber sie kostet einen Eingriff in den Tonpfad und drei Entscheidungen vorher. Die **Wortkette** trägt sauber, ist aber im Kern seit 2014 gebaut (audiogrep). Alles andere ist Mittleres, und der Rest von drei großen Ideen ist nachgemessen kleiner, als die Idee behauptet hat. Vier Vorschläge sind an ihren eigenen Zahlen gescheitert — nicht an fehlenden Daten, sondern daran, dass die Messung das Gegenteil sagt. Das ist kein schlechtes Ergebnis. Es heißt nur: es gibt keinen zweiten Klangraum, der fertig herumliegt. Es gibt einen, der Arbeit kostet, und drei ordentliche mittlere Sachen.

---

## 1. Die Taktweiche

**Kern:** Der Bestand als Streckennetz in der Zeit. An gemessenen Taktanfängen zweigen Wege in andere Lieder ab, der Ton reißt nie.

**Was du siehst.** Ein Lied läuft. Vor dem Spielkopf liegt ein schmales Band mit den nächsten acht Takten, gezeichnet aus dem Schlagraster. Wo ein Takt einen gemessenen Ausgang hat, steht eine Weiche mit ihrer Zahl daneben. Nimmst du sie, setzt das andere Lied auf der Eins ein. Lässt du sie liegen, läuft alles weiter. Nach einer Stunde bist du durch zwanzig Lieder gefahren, ohne eines ausgewählt zu haben. Takte ohne Ausgang zeigen nichts — keine schwache Andeutung.

**Woraus es gebaut ist.** `schlaege` für alle 323 Lieder, 169.766 Schläge, davon 47.159 Zählzeit-Einsen, kein Lied unter 57. `library/notenzonen.json` mit 233.255 Zonen für 321 Lieder. Daraus 43.445 lückenlose Acht-Schlag-Fenster über 306 Lieder. Der Tempoangleich und die Uhrmechanik stehen schon (`docs/TONSTUDIO.md`, Naht bei +7/-2 ms). Die Nachbarrechnung ist Minuten auf der CPU, kein Modell.

**Warum es das noch nicht gibt.** Infinite Jukebox (2012) hat die Mechanik, aber nur innerhalb eines Liedes. AutoMashUpper (2013) hat die Bestandsmessung, liefert aber ein fertiges Stück statt einer Fahrt. Wwise und Abletons Follow Actions verzweigen taktweise, aber von Hand gebaut. Über einen gemessenen Bestand, während man hört: nirgends. Wirklich unbesetzt sind zwei kleinere Dinge — die Zahl als Grund an jeder Weiche und das Vorausband.

**Was schiefgehen kann.** Die Trennschärfe ist besser als befürchtet (Zufallspaare Median 0,998 gegen bester Nachbar 0,317; 163 Weichen führten zu 112 verschiedenen Liedern). Das Problem ist die Anzeige. Der Takt ist keine feste Größe: nur 79 % der Zählzeit-Abstände sind Vierer, 40 Lieder liegen unter 50 %. Sunos Phrasenmarken liegen im Median 0,322 s neben der Takt-Eins — "beides Phrasenanfang" wäre erfunden. 78 % der besten Treffer sind transponiert, während der Ton tonhöhenfest bleiben soll; die Zahl an der Weiche beschriebe dann einen Vergleich, den du nicht hörst. "Höchstens vier Ausgänge" ist ein Schnitt, keine Messung — bei Schwelle 0,35 sind es im p90 zweihundert. Und Deck B ist zwölf Sekunden vor Songende schon für die Endnaht belegt; es bräuchte einen dritten Tonweg.

**Erster Schritt.** Kein UI, kein Ton. Die Fenster in Schlägen statt in Zonen neu bauen (die dritte Zonenspalte ist die Teilung, nicht die Zählzeit — `bin/toene.js:330`), Transposition auf null festnageln, dann auszählen: wie viele der 43.445 Takte haben bei 0,25 und bei 0,30 überhaupt einen Ausgang, und wohin. Bei Transposition 0 fällt die Ausbeute von 56 % auf 32 % (Schwelle 0,30). Danach weißt du, ob das Band meistens etwas zu zeigen hat oder meistens leer ist. Das entscheidet alles Weitere.

---

## 2. Die Wortkette

**Kern:** Jedes gesungene Wort wird zur Adresse im ganzen Bestand.

**Was du siehst.** Du hörst "Nacht" und klickst es an. Rechts fährt eine Spalte auf: 119 Fundstellen aus 62 Liedern, jede mit der Zeile drumherum, dem Titel und einem Balken, der zeigt, wo im Lied die Stelle sitzt. Ein Druck, und die Kette läuft — zwei Sekunden vor und nach dem Wort, ein Lied nach dem anderen, durch Metal, Ballade und Plattdeutsch.

**Woraus es gebaut ist.** 259 Lieder mit Wortmarken, 84.416 gesungene Marken nach Abzug der Regieklammern, 11.243 Wortformen, 1.629 in mindestens fünf Liedern. Gegen Whisper gemessen liegen 227 von 253 Liedern im Median unter einer Viertelsekunde. `audio.mp3` und `audio.wav` liegen für alle 323 lokal, `server/server.js:108` beherrscht Range. Die Umkehrliste sind 1,9 MB reines Sortieren.

**Warum es das noch nicht gibt.** Es gibt es. audiogrep/videogrep (Lavigne, seit 2014) schneidet alle Fundstellen eines Wortes zu einem Supercut, mit Padding. Der Lyrics-Seeker des SyncPlayer (Bonn 2007) springt an die gesungene Stelle. Neu wäre nur die Verschmelzung: die Konkordanz als lebende Spalte im laufenden Player statt als Kommandozeile mit exportierter Datei. Das ist ein ordentlicher Bau, keine Erfindung.

**Was schiefgehen kann.** 12.419 Wortmarken stehen in Regieklammern und werden nie gesungen — klickst du "voice", hörst du 112 Stellen, an denen niemand singt. Die Klammern sind über Einträge verteilt, ein Regex je Eintrag reicht nicht. 10,2 % der Wörter haben keine eigene Sekunde (mehrwortige Einträge, Spanne p90 4,31 s). 15 bis 24 Lieder tragen Marken für beide Textfassungen und liegen bis zu 62,9 s daneben. Und die versprochene selbstrechnende Häufigkeitsgrenze gibt es nicht: die Verteilung hat keine Kante, jeder Schnitt, der "noch" und "kein" erwischt, nimmt "blick" und "licht" gleich mit. Ehrlich wäre: gar keine Grenze, alle Formen nach Liedzahl geordnet, du ziehst am Wort, das dich interessiert.

**Erster Schritt.** Klammerlauf über den zusammengesetzten Text mit Zeichenversatz, dann die Umkehrliste bauen. Ein Wort ausgeben, als Textliste mit Lied und Sekunde. Zehn Stellen von Hand anspringen. Wenn acht davon sitzen, trägt es.

---

## 3. Die Fassungspaare

**Kern:** Das Archiv zeigt, welche seiner Lieder dasselbe Lied sind — die Abstammung, die Suno nie geliefert hat.

**Was du siehst.** Eine ruhige Liste. "Points of Light" und "Lichtpunkte". "Awakened" und "Erweckt". "Host" und "Wirt". "Sir Ribbeck" und "Herr von Ribbeck". "The Corinthian Bride" und "Die Braut von Corinth". Am Lied selbst steht die Zeile: dieses Lied gibt es noch einmal, dort. Kein Pfeil, keine Herkunftsbehauptung — nur "gefunden".

**Woraus es gebaut ist.** `chroma` in allen 323 `.bin` unter `library/analyse`, 12 Werte bei 20 Rahmen/s, ein einziger Messweg, null Ausfälle. Der volle Lauf über alle 52.003 Paare hat gemessene 641 Sekunden gebraucht, einkernig, 230 MB Speicher. Kein PCA, kein Hash, kein Modell.

**Warum es das noch nicht gibt.** Panako und audfprint machen genau diese Duplikatsuche in Archiven, tempo- und tonhöhenrobust. Der Unterschied ist die Lage: Sunos Felder sind für diesen Bestand tot — 35 `upsample_clip_id`, davon null im Archiv auflösbar; 98 `concat_history`, null auflösbar. Der Katalog kennt neun markierte Übersetzungen. Der Lauf findet deutlich mehr. Das ist ein Zugewinn, aber keine Erfindungsbehauptung.

**Was schiefgehen kann.** Auf Stellenebene ist es tot: 92 der 200 stärksten Funde sind Naturklang gegen Naturklang. Regen ähnelt Regen. Und es gibt keine trennende Schwelle — ein Fremdpaar liegt bei 0,847, ein echtes Fassungspaar bei 0,815, ein belegtes Upsample-Paar bei 0,698. Jede Schwelle lügt in eine Richtung. Der einzige ehrliche Bau ist deshalb: die 64 Instrumentals raus, keine Schwelle, eine nach Abstand geordnete Liste, und du hakst von Hand ab, was stimmt. Danach steht ein bestätigtes Register im Katalog, keine Vermutung.

**Erster Schritt.** Den Lauf wiederholen, Instrumentals ausgeschlossen, die stärksten sechzig als Liste mit Titeln und Abstand. Eine Stunde abhören. Dann weißt du, ob zwanzig oder achtzig Paare übrig bleiben — und ob es sich lohnt, sie in den Katalog zu schreiben.

---

## 4. Das Schlagblatt

**Kern:** Das Lied in seinen eigenen Schlägen statt in Sekunden, mit den gesungenen Wörtern am Schlag und zwei Linealen darüber.

**Was du siehst.** Unter dem Spieler kein Sekundenbalken, sondern ein Blatt aus kleinen Feldern, zeilenweise wie Text. Ein Feld ist ein gemessener Schlag. Darüber zwei Lineale: Sunos nachträgliche Abschnittsgrenzen, und deine eigenen `[chorus]`/`[verse]`-Marken aus dem Liedtext. Sie decken sich nicht. Das ist der Inhalt: nur 47,5 % der Grenzen liegen auf einer Zählzeit 1, im Median 87 ms daneben, im schlimmsten Fall 560 ms. Das Blatt sagt nicht, wer recht hat.

**Woraus es gebaut ist.** `schlaege` 323/323, Raster sehr stabil (Schwankung der Abstände sd/Mittel im Median 0,004, 169.443 Übergänge ohne einen einzigen Ausreißer). `abschnitte` 323/323 aus `/api/gen/<id>/novelty-sections`. `worte`/`worteV3` für 258 bzw. 257 Lieder. Die Textmarken bei 254 Liedern. Zeilen je Blatt: Median 16. Die ganze Rechnung für alle 323 Lieder: 766 Millisekunden.

**Warum es das noch nicht gibt.** Songle und die DJ-Programme zeigen Schlag- und Taktraster. Das Neue ist schmal und liegt woanders: die Selbstauskunft der erzeugenden Maschine liegt urteilslos neben der Messung an ihrem eigenen Ergebnis. Das macht kein Werkzeug, weil es sonst niemanden gibt, der den Text vorher geschrieben hat.

**Was schiefgehen kann.** Alles, was einfärbt. Die Ähnlichkeit aller Schlagpaare liegt zwischen 0,89 und 1,00, bei 61 von 81 Liedern ist der ähnlichste Nachbar der Nachbarschlag. Eine Quantilschwelle darauf macht aus 0,02 Kosinus eine Farbe — ein Muster, das man glaubt. Also keine Färbung. Kein Vierergitter: 15 % der Takte sind keine Vierer, 85 Lieder haben keine Zählzeit bis vier. Wörter passen nicht ins Feld (Median 504 Felder, längste Zeile 225). Und der Begriff "Abschnitt" muss richtig heißen — was aus `novelty-sections` kommt, ist eine zweite Messung, nicht Sunos Ansage.

**Erster Schritt.** Ein Lied, ein SVG, auf einer Kopie. Schläge als Striche, Zählzeit-Einsen betont, die beiden Lineale darüber. Nichts einfärben, keine Wörter. Ansehen, ob der Versatz zwischen den Linealen etwas erzählt oder nur flimmert.

---

## Auch noch da

- **Das lange Band** — `wellenStufen` liegen für alle 323 Lieder da und werden im Frontend von niemandem gelesen, feinste Stufe 42,66 ms, deckungsgleich mit der WAV (Korrelation 0,992). Nur nicht auf einer Kalenderachse: Musik macht 0,216 % der 510 Tage aus, alle Lieder zusammen wären 3,46 Bildpunkte breit.
- **Der Lieferschein, halbiert** — nur Tempo: 127 Lieder nennen bpm, Median-Abweichung 2,1 % nach Oktavfaltung. Die Verbotshälfte trägt nicht (51 von 63 Verboten gelten für einen Abschnitt).
- **Der Bauplan, still** — Text gegen die Uhr, "gehört / nicht gehört" als leiser dritter Zustand, kein Wort "verschluckt", keine Archivstatistik. Vorher das lyrics-Feld von Hand schneiden.
- **Die Nachbarspanne** — was in den Rückbögen wirklich gemessen ist: Median-Bogen 9,32 Tage gegen 84,8 im Zufall, in 0 von 60 Permutationsläufen erreicht. Als Verteilung ehrlich, als einzelner Bogen mit Titel nicht.
- **Der Rauschboden** — 74-mal hast du denselben Zettel wortgleich zweimal abgeschickt. Wie weit die beiden Ergebnisse auseinanderliegen, weiß das Archiv und hat es nie gezeigt.
- **Der Stimmvorsprung je Zeile** — nicht je Wort. Die Stems trennen sauber (27 bis 85 dB), aber die Wortfenster tragen zu einem Viertel Stille.
- **Der Machartbogen, karg** — 49 Lieder mit aufgezeichneter Naht, ein Strich aus der Rohsekunde. Die Zeitachse stimmt (Kreuzkorrelation-Maximum exakt bei Versatz 0). Nur steht bei rund 85 % der Nähte "kein Sprung messbar".

## Was rausgeflogen ist und warum

- **Der Hörplatzteppich.** Datei-dBFS und Mikro-dB sind nicht vergleichbar. Ein einziger unbekannter Versatz lässt den Anteil leerer Zellen im Bass zwischen 19 % und 91 % wandern — und liefert dabei durchweg eine leerere Höhen- als Bassbahn, das Gegenteil des versprochenen Bildes. Dazu: die unterste Bahn ist bei 1024 Punkten der Gleichanteil.
- **Die Raumspur.** Bricht die Regel, dass Messungen exklusiv laufen, frontal. Die Eichung von 2084 ms ist ein Ereignis von einem Abend, dessen zehn Läufe schon um 62 ms streuen — zwei Drittel einer Rasterzelle.
- **Der Gegenlauf.** Wörter je Sekunde gegen Anschläge je Sekunde: r = 0,003 über 7.515 Fenster. Wo es keinen Gleichlauf gibt, gibt es keinen Gegenlauf. Auch die Rückfallfassung ist genau die mit r = 0,003.
- **Der Gabelweg.** Von allen hörbaren Messgrößen hat genau eine ein Tal: das Tempo bei 109,5 BPM. Der ehrliche Baum endet nach drei Gabeln, größtes Blatt 92 Lieder, kein einziges steht allein. Und "trägt eine Stimme" ist keine Messung, sondern die Anwesenheit einer Textzeile im Katalog.
- **Die Wortwaage.** Der Prompt als Maßstab ist am 23.08.2026 verworfen worden, `docs/ERFUNDENES.md` Abschnitt 5 endet mit dem Satz, die Warnung stehe da, damit niemand den Weg ein drittes Mal geht. Dazu: der beworbene ambient-Effekt (0,102) ist kleiner als das, was derselbe Zettel zweimal erzeugt (0,150).
- **Das Schichtbild.** Die acht Gegenproben gibt es nicht. Null Paare aus zwei unabhängigen Erzeugungen über eine Modellgrenze — alle zehn Kandidaten sind dieselbe Aufnahme mit anderer Versionsmarke. Und der größte Sprung im Bild gehört deiner Hand am Studio-Export, nicht Suno.
- **Die Zugbahnen.** NMDS hat keine Out-of-Sample-Projektion; die Pflichtkontrolle der Idee prüft eine Zahl, die per Konstruktion null ist. Außerdem existiert das Ding seit 2020 quelloffen (music-explore, UPF Barcelona).
- **Das Taktblatt mit Färbung** und **die Deckungsstellen auf Stellenebene** — beide scheitern an derselben Stelle: die Verteilung hat keinen Platz für eine Schwelle. Was übrig bleibt, steht oben als Punkt 3 und 4.

---

**Riskanteste:** die Taktweiche. Nicht wegen der Daten — die tragen besser als gedacht. Wegen des dritten Tonwegs, der Transpositionsfrage und der Schwelle, die kein Regler werden darf und trotzdem alles entscheidet (bei 0,20 haben 85 % der Takte keinen Ausgang, bei 0,35 im p90 zweihundert).

**Sicherste:** das Schlagblatt. Die Daten liegen vollständig, die Rechnung dauert 766 Millisekunden, es braucht keine Schwelle, und der eigentliche Befund — dass mehr als die Hälfte der Grenzen nicht auf einer Zählzeit liegt — ist schon gemessen und wartet nur darauf, gezeichnet zu werden.
