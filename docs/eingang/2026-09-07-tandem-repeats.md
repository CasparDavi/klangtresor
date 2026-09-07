# Tandem Repeats — was die Bioinformatik dazu hat (07.09.2026)

**Status: OFFEN — Recherche, nichts gebaut**

Caspar_D: *„das sind tandem repeats, schau, wie das die bioinformatiker
handhaben"* — zu den 18 % der belegten Textwiederholungen, die enger
beieinander liegen als das Suchfenster und deshalb von keinem
Nicht-Überlappungs-Verfahren gefunden werden können.

Fünf Rechercheure, ein Gegenleser. Grundlage ist Bensons freie
Methodenbeschreibung plus der Quelltext von TRF 4.10.0 — der
NAR-Volltext von 1999 liegt nur als Scan ohne Textebene vor.

**Zwei Befunde, die unsere eigene Arbeit berichtigen, stehen unten:**
Wattenberg hat den Tandem-Fall bereits (repetition regions), und unsere
Nichtüberlappungsregel ist strenger als seine.

---
# Tandem Repeats im Bogendiagramm — was davon hier greift

## Der Kern

Der Begriff greift, und das Werkzeug greift zur Hälfte. Was ganz trägt, ist der Perspektivwechsel: TRF sucht keine Paare, sondern fragt für jeden Versatz d, ob über eine zusammenhängende Strecke durchgehend Position t und t−d ähnlich sind — und kennt deshalb weder Ausschlusszone noch Mindestabstand, Perioden beginnen bei 1. Was ebenfalls trägt, ist der teure Teil, das Wraparound-DP; TRF rechnet seit Version 4 ohnehin gegen eine Substitutionsmatrix (`tr30dat.h` Z.321: `match(a,b) = SM[256*a+b]`, die Gleichheitsfassung in Z.313 ist auskommentiert), eine reellwertige Ähnlichkeit einzusetzen ist ein Einzeiler. Was nicht trägt, ist die billige Erkennungsstufe samt der vier Verteilungen und alles, was TRF am Ende ausgibt — und zwar aus einem strukturellen Grund, nicht weil die Zahlen an DNA geeicht sind.

## Was direkt übertragbar ist

**Die Suchrichtung umdrehen.** Statt für jede Position die drei ähnlichsten Partner: für jeden Versatz d die maximalen periodischen Strecken. Bei 300–600 Schlägen und Versätzen bis 64 sind das wenige hunderttausend Operationen je Lied. Für 323 Lieder Sekunden. Das ist der billigste Teil der ganzen Kette.

**Lauflängen statt Einzeltreffer.** Bensons `nummatches` ist die Summe der Längen aller Läufe von mindestens k aufeinanderfolgenden Treffern auf derselben Diagonale (`add_tuple_match_to_Distance_entry`, `tr30dat.c` Z.2231). Übersetzt: Ähnlichkeit je Schlagpaar an einer Schwelle binarisieren, dann je Diagonale die Trefferläufe ab Länge k aufsummieren. Ringpuffer, Fenster nachziehen, Lauf verlängern — eins zu eins übernehmbar.

**Die Fensteruntergrenze — das ist der eigentliche Griff für die 18 %.** Das Zählfenster ist nicht d lang, sondern `max(d, 20)` (`Min_Distance_Window`, `tr30dat.h` Z.169). Bei Perioden unter 20 zählt TRF also über mehrere Kopien hinweg im selben Fenster. Das ist die bioinformatische Antwort auf „die Wiederholung ist kürzer als mein Fenster": nicht das Fenster verkleinern, sondern über aufeinanderfolgende Kopien akkumulieren. In Schlägen: für d unter etwa 8 über ein Fenster von 8–16 Schlägen sammeln.

**Das Random-Walk-Band.** Δd_max = floor(2,3·√(P_I·d)), im Quelltext wörtlich (`tr30dat.c` Z.61). Wichtig ist die Wurzel: der zulässige Drift wächst mit √d, nicht linear. Wir verschmelzen derzeit nur Positionen mit *gleichem* Versatz, also Δd_max = 0. Mit dem Band überleben Wiederholungen, bei denen ein Auftakt dazukommt oder eine Zählzeit verschluckt wird.

**Wraparound-DP, reellwertig.** S[r][c] = max(0, S_diag + s(x_r, P_c), S_up + Δ, S_left + Δ), Rückfaltung der letzten Spalte auf die erste, zwei Durchläufe je Zeile (`newwrap`, Z.604). Alphabetfrei. Eine Falle, die keine Stellschraube ist: die 0 macht es lokal, und lokales Alignment verlangt E[s] < 0 unter dem Nullfall (Karlin & Altschul 1990). Chroma-Kosinus ist nichtnegativ mit stark positivem Mittel — ohne Abzug eines Versatzes τ läuft das Alignment über das ganze Lied. τ nicht raten, sondern auf den Median der Kosinusähnlichkeit zufälliger Schlagpaare desselben Liedes setzen. Kosten mit Schmalband: bei d = 32 und Radius 6 sind das 13 Zellen je Zeile.

**Konsens per Median.** TRF bildet spaltenweise die Mehrheit und richtet neu aus. Auf reellen Werten ist der komponentenweise Median das Gegenstück. Das ist nicht neu zu erfinden: REPET (Rafii & Pardo, IEEE TASLP 21(1):73–84, 2013) macht genau das seit zwölf Jahren auf Musik — Beat Spectrum für die Periode, dann *„compute the repeating segment by taking the median over the segments"*. Der Vorgabe-Periodenbereich dort ist 1 bis 10 Sekunden, also genau unsere Spanne.

## Was am diskreten Alphabet hängt

**Das k-Tupel-Hashing.** Setzt exakte Fenstergleichheit voraus. Bei 300 Schlägen ist der direkte Diagonalenscan ohnehin billiger als jede Hash-Trickserei. Weglassen.

**Die Tupelgrößen-Staffelung — und das ist der schmerzhafte Punkt.** In der DNA ist die Zufallstrefferrate 4^−k, fest und unabhängig von P_M. Deshalb kann Benson Empfindlichkeit (P_M) und Spezifität (k) getrennt einstellen, und genau daraus lebt seine Antwort auf kurze Perioden: k = 3 für d ≤ 29, k = 5 bis 159, k = 7 darüber. Binarisiert man eine reellwertige Ähnlichkeit an θ, dann sind P_M(θ) und die Nulltrefferrate q(θ) dieselbe Funktion desselben θ. Es bleibt kein zweiter Parameter, mit dem man Spezifität zurückkauft. Die Staffelung ist nicht übertragbar, auch nicht mit neu gerechneten Tabellen.

**Die iid-Annahme.** Bensons ganzes Modell steht auf unabhängigen Bernoulli-Versuchen. Ein Akkord hält vier Schläge, das Band bleibt liegen, die Tonart das ganze Lied. Lange Trefferläufe entstehen bei uns viel häufiger zufällig, als ein Bernoulli-Modell vorhersagt. Wer die Tabellen übernimmt, bekommt Bögen überall.

**Alle Ausgabegrößen.** Periodengröße = häufigster Abstand einander entsprechender *übereinstimmender* Zeichen; das Traceback testet wörtlich `(*pcurr==*pdiag) && (match_yes_no==Alpha)` (Z.588). Dasselbe gilt für % matches, % indels und den Mehrheitskonsens. Wer sie will, muss die Binarisierung wieder einführen.

**Die Kopienzahl-Schwelle.** Copynumber ≥ 1,9 für d ≤ 50 (Z.4166). Unser Fall — dieselbe Zeile zweimal im selben Refrain — ist genau zwei Kopien, liegt also auf der Schwelle. TRF wie ausgeliefert fände diese Fälle grenzwertig, nicht komfortabel.

**Die exakte Maschinerie.** Runs, Suffixbäume, Lyndon-Wurzeln, die Schranke ρ(n) < n: alles braucht Transitivität. Aus d(a,b) ≤ τ und d(b,c) ≤ τ folgt nicht d(a,c) ≤ τ. Kein Schleichweg um die Quantisierung.

## Die Darstellungsfrage

Zuerst eine Korrektur an uns selbst: Wattenberg hat den Fall bereits. Neben dem maximal matching pair kennt er *repetition region* und *fundamental substring*, und ein essential matching pair ist ausdrücklich auch „zwei aufeinanderfolgende fundamental substrings einer repetition region". Seine Abbildung 3 heißt wörtlich *Immediate repetition*. Die Nichtüberlappungsbedingung gilt für maximal matching pairs; in Wiederholungsregionen wird sie ausgesetzt. Bei n Kopien zeichnet er n−1 Bögen. Unsere Ausschlusszone von einer halben Fensterlänge stammt nicht von ihm, sondern aus dem kNN-auf-Diagonalen-Verfahren — im Matrix Profile heißt sie *exclusion zone*, m/2 vor und nach der Position, und ist dort auch so dokumentiert.

Die beste Vorlage ist keine Symbolik, sondern Geometrie plus Stapelung:

- **Bogenhöhe = Versatz** (Hi-C-Konvention: obere Dreiecksmatrix um 45 Grad gedreht, Diagonale waagerecht an der Achse). Tandembögen liegen dann von selbst flach an der Zeitachse, Refrainbögen hoch. Kein zweiter Symbolsatz nötig, kein Verdecken. Bekannte Grenze: die Höhe ist durch den Bildschirm begrenzt, weite Bögen müssen gekappt werden.
- **Gieriges Zeilenpacken** aus igv.js (`featurePacker.js`, 28 Zeilen, ein Array von Endkoordinaten, ein Durchlauf nach Sortierung). Dazu UCSCs Stufung dense/squish/pack/full: bei Überfüllung automatisch eindichten statt abschneiden. Warnung beim Abschreiben: `maxRows` wird im Original nicht durchgesetzt.
- **Zwei Bogensätze an einer Achse, oben und unten.** Genau unsere geplante Anordnung, und in der RNA-Visualisierung etabliert (differential RNAbow, R-chie: bekannte gegen vorhergesagte Struktur). Güte als Strichstärke und Schattierung, nicht als Farbe. Kreuzende Bögen nicht verstecken — bei AABA-Formen sind sie der Befund.
- **Krümmung als Freiheitsgrad** (Genome U-Plot), wenn zwei Bögen fast dieselbe Spannweite haben und Stapeln nicht hilft.

Circos brauchen wir nicht; es löst ein Problem mit vielen Chromosomen, ein Lied hat eine Achse.

## Was ich bauen würde

Ein Verfahren, drei Teile, in dieser Reihenfolge — aber nur der erste ist jetzt dran.

**Der Nachmittag.** Kein DP, keine Bögen, keine Darstellung. Nur die Messung, ob das Umdenken die 18 % erreicht:

1. Je Lied und je Versatz d = 1..64: m_d[t] = 1, wenn cos(chroma_t, chroma_{t−d}) > θ.
2. Je d die Summe der Längen aller Trefferläufe ab Länge k = 2, gezählt über ein gleitendes Fenster von max(d, 8) Schlägen.
3. Nullverteilung nicht durch Mischen, sondern **aus dem Bestand**: Schlag t des Liedes gegen Schlag t−d eines *anderen* Liedes. Das erhält die Autokorrelation exakt und erspart die ganze Surrogat-Diskussion (IAAFT, Blockshuffle, Phasenrandomisierung). 323 eigene Lieder sind genug Material.
4. Auswerten, ausschließlich auf der 18-%-Teilmenge: wie viele der belegten engen Textwiederholungen bekommen einen Wert über dem 95-%-Quantil des Nullmodells?

Das trägt, wenn deutlich mehr als die Hälfte durchkommt. Kosten: Minuten für den ganzen Bestand, kein Modell, keine FFT nötig.

Zur Messung gleich mit: die alte Trefferquote muss auf der alten Teilmenge stehen bleiben und die neue getrennt auf der ganzen Menge ausgewiesen werden. Sonst sieht echter Fortschritt nach Rückschritt aus, weil der Nenner gewachsen ist.

**Danach, in dieser Reihenfolge:** Wraparound-DP im Schmalband zur Verifikation der überlebenden Perioden, Median-Konsens und Neuausrichtung, dann als Aufräumregel der harmonische Test aus AniAnn's (echte Perioden erzeugen abfallende Gipfel bei 2L, 3L, 4L; Verhältnis Rn ≥ 2) statt TRFs 90-%-Überlappungsregel. Sonst malen wir für denselben Refrain Bögen bei 8, 16, 24 und 32 Schlägen übereinander.

**Nicht bauen:** k-Tupel-Hash, Bensons Tabellen, HMM, SAX-Quantisierung. Alles vier löst Probleme, die wir bei 300 Schlägen nicht haben, oder wirft weg, worauf es ankommt.

Die Empfehlung ist damit klar. Die Entscheidung liegt bei dir.

## Was wir nicht wissen

- Den NAR-Volltext von 1999 haben wir nicht gelesen. PMC148217 liegt nur als Scan ohne Textebene vor. Grundlage ist Bensons eigene, freie Methodenbeschreibung plus der Quelltext 4.10.0. Die Substanz ist belegt, der Wortlaut des Papiers nicht. Eine bekannte Diskrepanz: die Doku nennt für P_M = 0,75, k = 5, d = 100 den Wert 26, die ausgelieferte Tabelle sagt 27.
- Wir haben **keine** Arbeit gefunden, die TRF-artige Verfahren auf musikalische Merkmalsreihen überträgt. Die Verbindung ist unsere Konstruktion aus belegten Bausteinen. Es gibt keine erprobten Parameter zum Abschreiben. Das ist Chance und Risiko zugleich.
- REPET ist die nächste vorhandene Fassung, aber es sucht eine globale Periode zur Quellentrennung, nicht lokale Bögen. Übertragbar ist der Median-Konsens, nicht das Ziel.
- θ ist ungeprüft. Die Nulltrefferrate q(θ) schwankt mit Tonart, Instrumentierung und Chroma-Normierung von Lied zu Lied. Wir haben sie nicht gemessen.
- Ob das Nullmodell „fremdes Lied" fair ist, wissen wir nicht. 323 eigene Suno-Lieder ähneln einander womöglich so stark, dass der Test zu streng wird.
- P_M und P_I aus der Textgrundwahrheit zu schätzen ist unser Vorschlag, nicht bioinformatische Praxis — dort werden sie gesetzt. Es braucht getrennte Daten für Schätzung und Bewertung, sonst überschätzen wir die Trefferquote.
- Wie viele Bögen ein Lied „richtig" hat, ist offen. Die Schranke ρ(n) < n gilt nur über diskretem Alphabet, und im fehlertoleranten Fall wächst die Ausgabe mit O(n·k·log k) — je großzügiger die Toleranz, desto überproportional mehr Bögen.
- Die Zahlen 61,7 / 57,1 / 55,9 und die 18 % sind ungeprüft übernommen.
