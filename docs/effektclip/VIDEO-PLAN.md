# Effektclip: der Weg zum Video

Stand 12.09.2026. Entstanden in einer reinen Konzeptsitzung Caspar_D / Claude,
ohne Zugang zum Haus. **Zustand: zu planen.** Nichts hiervon ist gebaut, nichts ist gemessen außer
dem, was ausdrücklich als gemessen gekennzeichnet ist.

Die Gesetze des Studios stehen in [EFFEKTCLIP-REGELN.md](EFFEKTCLIP-REGELN.md) und gelten
unverändert. Wo dieses Dokument sich an ihnen misst, steht die Regelnummer dabei.

Die Fassung vom Vormittag desselben Tages ist damit abgelöst; was sich geändert hat, steht hier,
damit die alte Logik nicht aus dem git zurückgeholt wird.

**Was sich gegenüber der Vormittagsfassung geändert hat:** Der Suno-Zehnsekünder ist wieder ein eigener
Rechenweg mit eigener Uhr (§1) — die erste Fassung hatte ihn zum Fenster auf der Liedachse gemacht,
das war zu aufgeräumt gedacht. Neu sind die Materialtypologie (§2), die Optimierung von Länge,
Periode und Phase gegen die Schlagkarte (§3) und die Ableitung der Abschnitte aus Lyrics, Whisper
und Suno (§5). Die Nahtfamilien (§6) sind geblieben, ihre Rangfolge gilt aber nur noch für einen
Teil des Materials; dazugekommen sind der **Vorrat an Übergängen** (§6.7), der **Loop-Check aller
Effekte** (§6.8) und die **Arbeitsteilung Automatik / Mensch** (§8a), die zugleich Frage 5 des
Laufs beantwortet. **§9 ist ganz neu geschrieben:** die erste Fassung nahm an, Ken Burns sei
vorhanden und müsse nur anders verwendet werden — am Code nachgesehen stimmt das nicht, und aus der
Nachschau kommen drei Befunde zur „Fahrt" sowie die Aufwertung der Tiefenkarte zum Grundkanal.
**§9a ist ebenfalls neu:** Quellfläche und Sichtfeld für Partikel — dieselbe Änderung, die §6.8
Klasse 2 loopfähig macht. **§9b** nimmt sich Lichtstrahlen und Laser vor, beide am Code nachgesehen. **§9.7a–d** führen die
Tiefenkarte aus: Dunst als Dämpfung statt als Schicht, Tiefe als generischer Parameter, und wo sie
sonst trägt. **§9c** macht den Raum dreidimensional, **§9d** sagt, woran Bühnenreife zu messen ist,
und **§12** wägt Aufwand gegen Ertrag.

---

## 0 · Woran angeknüpft wird

Stand des Hauses am 11.09.2026 nachts: 38 Effekte in neun Gruppen, Lichtmischpult mit Sequenzer,
Raum-Block, Vorbereitung, ein Rezept je Titel. Der 10-Sekunden-Export läuft über `MediaRecorder`
mit Loop-Modus, das Haus schneidet mit ffmpeg auf [0, L) zurück. Das Ausgabebuch
`library/effektclips.json` bucht jeden Export, über die Erkennung eigener Clips entscheidet der
Mensch (`bin/effektclip-buch.js pruefen`).

Offen: die vier Shader (Wellen, Kaustik, Dunst, Flammen) und der Nachzieheffekt loopen nicht,
`MediaRecorder` verliert gelegentlich Bilder (Naht 7,7 gegen stärksten normalen Bildwechsel 7,4),
der Nebel entsättigt die Umgebung entgegen seinem Kommentar, und der „Lauf" ist am 11.09. wieder
ausgebaut worden.

**Gemessen am 12.09.2026 (Caspar_D):** Sunos Player reiht hochgeladenes Video-Artwork ohne sichtbare
Naht aneinander. Die Nahtqualität zahlt sich im Zielmedium also aus.

---

## 1 · Zwei Uhren, eine Maschine

Der wichtigste Befund des Tages, und er widerspricht der ersten Fassung.

**Der Suno-Zehnsekünder ist nicht taktsynchron zu bekommen** (Caspar_D): im Lied gibt es Takt- und
Geschwindigkeitswechsel, Suno spielt aber immer denselben Clip als Schleife. Daraus folgt mehr als
eine Einschränkung — der Clip **gehört zu keiner Stelle im Lied**. Er läuft auf der Titelseite und
im Feed, während irgendeines Takts. Ganze Takte im Export wären nur dann etwas wert, wenn er an
der Stelle säße, aus der sie stammen, und das tut er nie.

| | **Suno-Clip** | **alles Lange** |
|---|---|---|
| Uhr | eigene | Liedzeit |
| Periodizität | aus sich selbst, L/n | Takte und Abschnitte |
| Effekte | taktlos oder auf freier Frequenz | Puls auf der Eins erlaubt |
| Schluss | **muss** sich schließen | muss nicht |
| Länge | frei, ≤ 10 s (Sunos Grenze) | Ausschnitt oder ganzer Titel |

Ein Helligkeitspuls auf der Eins ist im Zehnsekünder ein **Fehler**: er verspricht einen Takt, den
es dort nicht gibt. Für die Bedienung heißt das: Effekte, die das Schlagraster brauchen, bekommen
im Zehnsekünder-Modus eine freie Frequenz oder stehen gar nicht erst zur Wahl. Das Lichtmischpult
kann das bereits (Takt · Eins · zufällige Schläge · feste Frequenz) — im Zehnsekünder bleibt die
feste Frequenz, und sie rastet auf ein ganzes Vielfaches von 1/L ein.

**Der heutige Loop-Modus ist damit richtig, aber falsch begründet.** Nicht „damit der Export
schließt", sondern: *weil es hier keinen Takt gibt.*

Was beide Uhren teilen, ist die Maschine: derselbe Maler, dasselbe bildweise Rendern, dieselben
Nahtfamilien. Gegen die Hausregel „zwei Wahrheiten gibt es nicht" verstößt das nicht — es sind zwei
verschiedene Dinge, nicht zwei Fassungen desselben.

### Die drei Ausgabeziele

| Ziel | Uhr | Länge | schließt sich |
|---|---|---|---|
| **Cover-Art-Loop** | eigene | frei, ≤ 10 s | ja, gegen sich selbst |
| **Hook-Video** | Liedzeit | Abschnittsgrenze bis Abschnittsgrenze | nein, offene Kanten |
| **Volles Video** | Liedzeit | ganzer Titel | nein |

Nur die letzte Spalte löst Rechenarbeit aus. Beim Hook-Video bleibt die Frage, wie es anfängt und
aufhört: ein Ausschnitt, der bei laufendem Bild beginnt, wirkt auf YouTube wie ein Fehler. Zwei
Takte Auf- und Abblende auf der ersten und letzten Eins lösen das — das ist Vorbereitung, kein
neuer Effekt.

---

## 2 · Materialtypologie — sie bestimmt die Strategie

Caspar_D am 12.09.: manche der eigenen Videos sind **Mikrohandlungen**, bei denen ruhig zu sehen
sein darf, dass sie wieder von vorn laufen — nur der harte Schnitt ist schlecht.

Das kippt eine Annahme der ersten Fassung: Die Nahtsuche (§6.1) war dafür gebaut, die Wiederholung
zu **verstecken**. Wenn sie sichtbar sein darf, gibt es nichts zu verbergen, und das Ziel ist ein
anderes — die Wiederholung soll lesbar sein und trotzdem nicht stoßen.

| Typ | Beispiel | Naht | Pendel | was optimiert wird |
|---|---|---|---|---|
| **Mikrohandlung** | Szene mit Anfang, Mitte, Ende | sichtbar erlaubt, **nicht stolpernd** | **nie** — rückwärts zerstört die Kausalität | die Rate; L ist durch die Handlung gesetzt |
| **Textur** | Rauch, Feuer, Wasser, Drift | nahtlos, Suche lohnt | gratis | L frei |
| **Standbild mit Effekten** | „lebendes Foto" | kein Nahtproblem | — | alles frei |

„Nicht stolpernd" heißt konkret: mit der sin²-Kurve (`1 + (s−1)·sin²(πx)`, beginnt und endet bei 1
mit Steigung 0) die Quellgeschwindigkeit zur Naht hin auf null fahren, kurz stehen, wieder los. Die
Handlung fängt sichtbar von vorn an, aber sie stolpert nicht hinein.

**Die Phasenmarke.** Eine Mikrohandlung hat einen Moment, der sitzen soll — wenn etwas bei 4,2 s
zerbricht, gehört das auf eine Eins oder eine Snare. Das ist der Unterschied zwischen „Video läuft
unter Musik" und „Video ist auf Musik geschnitten" und kostet fast nichts: eine Marke je Video, von
Hand beim Abspielen gesetzt, eine Zahl. Die Länge legt sich um die Marke herum.

**Offen (Caspar_D):** wie sich die eigenen Videos auf diese Typen verteilen. Davon hängt ab, ob die
Phasenmarke zentrales Bedienelement wird oder Nebensache für eine Handvoll Clips.

---

## 3 · Länge, Periode und Phase als Optimierungsproblem

Der zweite große Befund des Tages. Caspar_D: die Optimierung muss darauf zielen, dass **die
wichtigen Teile des Stücks** on beat sind — und dazu darf der Zehnsekünder auch kürzer werden,
wenn die Phase sonst wegliefe.

**Zehn Sekunden sind eine Obergrenze, keine Zielgröße.** L wird damit eine freie Variable, und
optimiert wird über das Tripel **(L, n, φ)**: Cliplänge, Anzahl der Perioden darin, Phasenversatz.

### Die Zielfunktion, in zwei Ebenen

**Ebene 1 — driftet der Clip?** Beim Loop wird die Periode bei jedem Übergang neu aufgesetzt. Liegt
L leicht neben einem Vielfachen der Schlagdauer, akkumuliert der Fehler über die Durchläufe. Ist L
ein genaues Vielfaches ganzer Schläge, driftet der Clip **nie** — ein anderer Zustand als „driftet
langsam". Beispiel: bei 128 BPM sind 10 s = 21,33 Schläge, 9,844 s dagegen exakt 21.

**Ebene 2 — welche Schläge werden getroffen?** Mittlerer Abstand jedes Pulszeitpunkts zum
nächstgelegenen Schlag, normiert aufs Schlagintervall: 0 = genau drauf, 0,5 = maximal daneben.

Die Phase φ ist dabei vermutlich der größere Hebel als n: eine Periode kann gut passen und trotzdem
durchgehend zwischen den Schlägen liegen. Ein konstanter Versatz repariert das, ohne die
Periodizität anzutasten — er macht den Loop nicht auf.

### Gewichtung — der eigentliche Zugriff

Nicht alle Sekunden sind gleich wichtig. **Refrains doppelt oder dreifach, Strophen einfach, Intro
und Outro fast null.** Die Gewichte liefert die Abschnittsetikettierung aus §5 gratis mit.

Dann kann herauskommen, dass ein Clip, der über das ganze Lied mittelmäßig sitzt, schlechter ist
als einer, der in den Refrains exakt sitzt und in der Bridge ausläuft — was musikalisch stimmt,
weil dort ohnehin niemand hinsieht. Das ist zugleich die ehrliche Antwort auf Tempowechsel: nicht
eine Zahl, die über das ganze Lied lügt, sondern Optimierung auf die Teile mit stabilem Tempo.

Zusätzlich die **Zählzeiten** nutzen, die im Katalog liegen: die Eins doppelt gewichten. Dann sucht
die Optimierung von selbst Perioden, die mit dem *Takt* kommensurabel sind und nicht nur mit dem
Puls. Bei Vierviertel fällt das zusammen, bei krummem Tempo ist es der Unterschied zwischen „trifft
irgendwelche Schläge" und „trifft die betonten".

### Offbeat ist ein Zielwert, keine Abweichung

Caspar_D: ein leichtes Pulsieren sieht auch offbeat gut aus. Damit ist das Ziel nicht zwingend
Abstand 0, sondern ein **wählbarer Zielabstand** — 0 für auf dem Schlag, 0,5 für durchgehend
offbeat. Dieselbe Rechnung, anderer Zielwert. Offbeat konsequent durchgehalten ist musikalisch
etwas anderes als zufällig daneben, und genau dieser Unterschied wird hier steuerbar.

### Der Suchraum ist klein

L in Bildschritten von 4 bis 10 s bei 30 fps sind 181 Werte, n von 1 bis 40, φ in Schritten: ein
paar hunderttausend Auswertungen einer Summe über die Schlagkarte. Sekunden.

Das Ergebnis sollte deshalb **eine Landkarte sein, kein Einzelwert** — welche Längen gut sind, nicht
nur die beste. Bei mehreren fast gleich guten Lösungen entscheidet das Material, nicht die Zahl.

### Die Kopplung an §2, und sie ist bindend

Die Optimierung darf **nicht frei über L laufen**, sondern nur über die zulässigen L des Materials:

- **Mikrohandlung:** L ist durch die Handlung gesetzt, optimiert wird die **Rate**.
- **Textur:** L frei.
- **Standbild:** alles frei.

**Anzeigen statt vortäuschen:** neben dem Mittelwert die **Streuung des Abstands über die
Liedlänge**. Ist sie groß, hat der Titel kein stabiles Tempo, und die ehrliche Anzeige lautet „passt
am Anfang" statt einer Zahl, die Präzision behauptet.

**Nebenwirkung:** krumme, materialabhängige Längen sind für die ffprobe-Erkennung im Ausgabebuch ein
noch stärkeres Merkmal als vorher.

**Was das nicht kostet:** keinen neuen Mechanismus. Das Einrasten auf L/n gibt es schon; es bekommt
ein Kriterium für die Wahl von n, dazu L und φ.

---

## 4 · Der Export wird eine reine Funktion, keine Aufnahme

Unverändert aus der ersten Fassung, weil der Befund trägt: **`zeichneFrame(t)` ist eine reine
Funktion von t.** Dann ist `MediaRecorder` das falsche Werkzeug — eine Kamera, die dem Bildschirm
zusieht und Bilder verliert, sobald der Rechner nicht mitkommt. Daher die Naht bei 7,7 statt 0 und
der Umweg über Zugabe und Rückschnitt.

**Vorschlag:** Bild für Bild. t = k/30 setzen, zeichnen, mit `VideoEncoder` (WebCodecs) als H.264
kodieren, Rohstrom ans Haus, ffmpeg muxt (`-f h264 -i - -c copy`, kein neues Paket, keine
Neukodierung).

- **Genau L Bilder**, unabhängig von der Rechnerleistung. Naht 0. Zugabe und Rückschnitt entfallen;
  der Schnitt-Endpunkt bleibt stehen, solange der alte Weg existiert.
- **Der Nachzieheffekt loopt:** eine Runde ungesehen vorlaufen, die zweite aufnehmen — eine
  Rückkopplung mit Abklingen ist nach einer Runde periodisch. Dass er sich selbst füttert, ist
  genau der Grund, warum das geht.
- **Rechenzeit entkoppelt sich von Live.** Eine Qualitätsstufe je Effekt (live / Export) wird
  möglich; Gottesstrahlen mit ~100 Abtastungen je Bildpunkt bleiben live verboten (Regel 14) und
  sind im Export unproblematisch.
- **Nicht-ganzzahlige Raten:** live nimmt `playbackRate` das ab, im bildweisen Export muss zwischen
  zwei Quellbildern gemischt werden — sonst bei Rate 0,91 alle elf Bilder eine sichtbare Dopplung.
  Lineares Mischen reicht und liest sich als leichte Bewegungsunschärfe.
- **Linear dekodieren statt springen:** `VideoDecoder` einmal durch die Quelle, nur das Kopffenster
  von D Sekunden halten (bei 0,5 s rund 15 Bilder). Damit entfallen die **124,6 ms je Sprung**, die
  Arbeitskopie aus lauter Schlüsselbildern und ihr 3,7-facher Platzbedarf. Die Nahtsuche braucht
  ohnehin einen linearen Durchlauf — der liefert die Abstandsmatrix gratis mit.

**Vor der Architekturentscheidung zu prüfen, je fünf Zeilen:** ob `VideoEncoder` im Zielbrowser
H.264 in der gebrauchten Größe annimmt; ob `VideoDecoder` mit den Suno-MP4s sauber durchläuft und
die Bildreihenfolge bei B-Frames ohne Extraarbeit stimmt.

---

## 5 · Abschnittsgrenzen aus drei Quellen

Caspar_D: die Grenzen können aus den Lyrics, aus Sunos Abschnittsgrenzen und aus dem
Whisper-Transkript kommen. Das sind aber **drei verschiedene Dinge**, keine drei Meinungen über
dasselbe:

| Quelle | sagt | sagt nicht |
|---|---|---|
| **Lyrics-Text** | *was* und in welcher Reihenfolge (`[Verse]`, `[Chorus]`) | keine Zeit |
| **Suno `abschnitte.peak_times`** | *wann* etwas wechselt | nicht was — es sind Klangwechsel: ein Break im Refrain ist dort eine Grenze, ein Refrain ohne Umbau fehlt |
| **Whisper-Wortmarken** | *wann welches Wort* | nichts über Instrumentales |

Also eine Kette mit Rollen statt einer Fusion: **Whisper trägt die Zuordnung, der Lyrics-Text
liefert die Etiketten, Suno korrigiert die Kante.**

**Der Weg.** Gesungene Wörter gegen den Lyrics-Text ausrichten (Textalignment über Wortfolgen, kein
neues Modell; robust gegen Auslassungen und Wiederholungen, weil Lücken und Einfügungen dort
vorgesehen sind). Jedes Wort erbt die Blockmarke seines Textblocks.

**Die Kante, die man nicht nehmen darf:** Der Abschnitt beginnt nicht beim ersten Wort.
**Instrumentalvorlauf gehört zum Abschnitt** — ein Refrain fängt an, wenn die Gitarre einsetzt,
nicht wenn die erste Silbe fällt. Die Lücke kann mehrere Takte lang sein.

Und **nur hier** kommt Suno herein: Liegt eine `peak_time` in dieser Lücke, ist das die Grenze.
Sonst rückwärts vom ersten Wort auf die nächste Takt-Eins. Der schwache Zeuge stimmt ab, der starke
entscheidet.

**Zwei Fälle, an denen es scheitert, beide erkennbar:** rein instrumentale Abschnitte (Intro, Solo,
Outro) kennt Whisper nicht — dort ist Suno die einzige Quelle. Und mehrere gleich lautende Refrains
kann das Alignment vertauschen, wenn eine Strophe dazwischen schlecht erkannt wurde; monoton
wachsende Zeiten und plausible Abschnittsdauern fangen das ab.

**Der eigentliche Gewinn ist nicht die Liste, sondern die Typisierung.** Refrain 1 und Refrain 3
sind derselbe Text, also dasselbe Video und dieselbe Effektkette — automatisch. Damit läuft die
Zuweisung über den **Abschnittstyp**, nicht über die einzelne Stelle: ein Video für Strophe, eins
für Refrain, eins für die Bridge, und ein Lied mit acht Abschnitten ist mit drei Zuweisungen fertig.

**Nebenprodukt über die Videos hinaus:** Dieselbe Ausrichtung sagt, welche Zeilen Suno ausgelassen
oder wiederholt hat — genau die dritte Textebene für die YouTube-Untertitel (Prompt-Text,
Anzeige-Text, tatsächlich Gesungenes). Ein Apparat, zwei Erträge.

**Voraussetzung, laut Caspar_D gegeben:** die Sauberkeit der Lyrics im Katalog ist gesichert, bis
hin zum Lyricsputzer.

---

## 6 · Übergänge — die Grammatik, nicht ein Detail

Die vier Familien gelten für **jede Stelle, an der zwei Bildzustände aneinanderstoßen**: die Naht
eines Loops, ein Abschnittswechsel im langen Video, der Wechsel zwischen zwei Videos. Der Loop ist
nur der Spezialfall mit genau einer Naht.

**Die Rangfolge in §6.5 gilt für Textur.** Bei Mikrohandlung ist §6.4 (Geschwindigkeit auf null)
der Normalfall, weil dort nichts zu verstecken ist.

### 6.1 Die Naht suchen, statt sie zu machen

Im Quellvideo das Bildpaar (i, j) finden, das sich am ähnlichsten ist, und dort schneiden — der
Kern von **Video Textures** (Schödl, Szeliski, Salesin, Essa; SIGGRAPH 2000).

Abstandsmatrix über alle Paare auf 32×32 Grau: bei 300 Bildern 90.000 Vergleiche, Millisekunden.
Die Einschränkung macht die Suche schärfer statt teurer — j − i nahe an der Ziellänge lässt ein
paar Dutzend Kandidaten übrig, und der beste braucht oft **gar keinen Übergang**.

**Die Falle aus demselben Paper:** Einzelbildvergleich reicht nicht. Ein Pendel sieht an derselben
Stelle gleich aus, gleich ob es links- oder rechtsherum schwingt — der Schnitt springt dann in der
Bewegungsrichtung. Abhilfe: die Matrix über zwei bis drei Nachbarbilder gewichtet glätten, dann
wird Geschwindigkeit mitverglichen.

### 6.2 Verzerren statt mischen

Optischen Fluss vom End- zum Anfangsbild rechnen und die letzten D Sekunden zunehmend dorthin
verbiegen. Kein Doppelbild, nur Verformung — und Verformung steht in unserem Vokabular (Linse,
Wellen, Verwackeln), Geisterbilder nicht (**Regel 3**). Bei großen Differenzen wird es ein
Gummituch; dann ist das eine bewusste Ästhetik, keine Panne.

### 6.3 Überblenden

**Regel 3 erklärt, warum das die schwächste Familie ist:** eine Überblendung zwischen zwei
Bewegungen ist kein weicher Übergang, sondern ein Geisterbild. Bei Nebel, Schnee und Funken fällt
es nicht auf, weil stochastische Textur mit sich selbst überlagert wieder wie Textur aussieht; bei
allem mit Struktur sofort.

Wenn doch: **Länge musikalisch** (ein Schlag oder halber Takt, nicht 0,5 s) · **in linearem Licht
mischen**, nicht in sRGB — sonst sackt die Mitte ab, derselbe Mechanismus wie bei Regel 6a ·
**Gewichte**: lineares Paar bei verwandtem Inhalt, Wurzelgewichte bei unverwandtem, sonst verliert
die Mitte Energie (die Konstantleistungs-Frage aus dem Audio-Crossfade, mit Bildvarianz statt
Pegel).

**Beim Wechsel zwischen zwei Videos ändert sich die Bewertung:** dort *darf* der Übergang sichtbar
sein, er sagt „anderer Ort". Aus der Notlösung wird das richtige Werkzeug.

### 6.4 Die Naht besitzen

Ein harter Schnitt auf der Eins ist Musikvideo-Grammatik: das Ohr erwartet dort ein Ereignis, und
ein globaler Helligkeitstransient maskiert einen räumlichen Sprung zuverlässig. Zwei bis drei Bilder
Stroboskop, Sicherungswackeln oder Farbschleier über der Naht. Kostet nichts.

**Der Hybrid ist der Normalfall für Mikrohandlungen:** mit der sin²-Kurve zur Naht hin auf null
fahren — dann stehen beide Seiten still und die Blende liegt zwischen zwei **Standbildern** statt
zwischen zwei Bewegungen. Filmsprache, kein Geist.

### 6.5 Die Auswahl automatisieren

> **Nahtquotient** = Sprung an der Naht ÷ 95. Perzentil der normalen Bildwechsel derselben Datei.
> Unter 1 heißt unsichtbar.

Für Textur: Nahtsuche → Quotient < 1 → fertig; sonst Verzerrung; sonst Blende; sonst Blitz.
Für Mikrohandlung: §6.4 direkt.

**Zwei Messregeln, beide aus schon bezahlten Fehlern:** **Maximum über 16×16-Blöcke, nicht
Bildmittel** — der Mittelwert misst Fläche, nicht Sichtbarkeit. Und **zweistufig messen**:
Kandidatensuche auf der rohen Quelle, Urteil am fertigen Bild nach der Kette, denn die Kette kann
eine Naht zudecken oder selbst eine aufreißen.

### 6.6 Übergangstakt und τ als Liste

**τ(t) wird eine kurze Liste (Zeit, Gewicht)** — im Normalfall ein Eintrag, im Übergangsfenster
zwei. Das ersetzt das „zwei Videoelemente gleichzeitig" aus dem Backlog-Punkt „Bewegtbild
schneiden statt nur bemalen".

**Ein Übergangstakt trägt beide Quellen.** Seine Lage ist entscheidend: er gehört in den **letzten
Takt der Strophe**, damit er auf der Eins des Refrains *landet* und nicht erst dort anfängt — sonst
hinkt das Bild der Musik einen Takt hinterher.

**Zwei Regeln, nicht eine:** An einer Abschnittsgrenze darf der Übergang sichtbar sein und etwas
sagen. Mitten in einem Abschnitt — etwa wenn drei Videos hintereinander laufen, weil eines allein
zu kurz ist — erwartet niemand ein Ereignis, dort soll er verschwinden.

**Zeitdehnung bei ungleich langen Abschnitten** (Caspar_D): Strophe und Refrain sind oft
verschieden lang. Zwei Stellschrauben, Rate und Durchlaufzahl. Regel: Taktzahl b so wählen, dass
b·T_Takt möglichst nahe an der Videolänge liegt, den Rest über die Rate. Ein 7,3-s-Video bei 2-s-Takt
wird 4 Takte bei Rate 0,91 oder 3 Takte bei Rate 1,22. **Gleichstand geht zum Langsameren** —
Verlangsamen sieht fast immer besser aus als Beschleunigen. Wo die Toleranz reißt, ein zweiter
Durchlauf statt noch mehr Tempo.

**Nicht belastbar, zu eichen:** wie weit die Ratentoleranz reicht. Daumenwert für menschliche
Bewegung 10–15 %, für Textur viel mehr — das ist keine Messung. Am eigenen Material eichen, wie bei
den Effektreglern.

### 6.7 Der Vorrat an Übergängen (12.09.2026)

Für die Stelle **Ende → Anfang** am Loop und **Abschnitt → Abschnitt** im langen Video. Bei
nahtlosen Loops entfällt das; hier geht es um alles andere.

**Die Ordnung dahinter.** Auf zirkulärer Zeit ist **Kontinuität gratis**: läuft das
Übergangsfenster von L−D/2 bis +D/2 und rechnet der Maler modulo L, gibt es keinen Zustandsbruch,
gleich was der Übergang tut. Zu leisten ist nicht Stetigkeit, sondern das Kaschieren des
**Inhaltssprungs**. Dafür gibt es zwei Mechanismen, und alles unten ist einer von beiden:

**(a) durch einen Neutralzustand gehen** — einen Zustand, in dem der Inhalt nicht sichtbar ist;
jeder solche Zustand *ist* ein Übergang · **(b) den Wechsel als Ereignis lesbar machen** — dann ist
er kein Fehler, sondern Grammatik.

#### (a) Neutralzustände

| Übergang | Weg | vorhanden? |
|---|---|---|
| **Schwarz / Weiß** | Ende → Neutral → Anfang. Weiß wirkt härter, passt zum Blitz | Vorbereitung |
| **Akzentfarbe statt Schwarz** | durch die Coverfarbe; bindet den Übergang ans Titelbild | `farben.akzent` |
| **Unschärfe** | beide Seiten auf volle Defokussierung, in der Mitte tauschen — liest sich als Objektivwechsel, nicht als Schnitt | Vorbereitung |
| **Rauschen / Korn** | hochziehen bis Vollabdeckung, tauschen, zurück | Filmkorn, Rauschausfall |
| **Nebel als Medium** | Dichte auf 1, tauschen, zurück. **Ästhetisch der stärkste**, weil der Theaternebel ein Medium ist und keine Schicht: er verschluckt das Bild, statt es zu überdecken (Regel 6) | Theaternebel |
| **Zoom bis zur Textur** | hineinzoomen, bis nur Fläche zu sehen ist, tauschen, heraus. Sehr sauber — der Neutralzustand ist der Bildinhalt selbst, kein Fremdmaterial | Zoom |
| **Überbelichten** | Lichter hoch bis Clipping — der Lichtleck-Übergang ohne Fremd-Overlay | Vorbereitung |
| **Entfärben → neues Schema** | Sättigung auf null, Standbild, im neuen Schema wieder einfärben. Erzählt „anderer Ort" | Vorbereitung |
| **Whip Pan** | beide Seiten schnell in dieselbe Richtung wegziehen, starke Richtungsunschärfe; der Neutralzustand ist der Schmierstreifen. Rein geometrisch, also **Regel-3-konform** | neu, klein |

#### (b) Ereignis-Übergänge

| Übergang | Weg | vorhanden? |
|---|---|---|
| **Schnitt plus Blitz** | 2–3 Bilder Stroboskop über der Naht; kostet null, kaschiert zuverlässig | ja |
| **Wisch mit Luminanz-Verdrängung** | die Helligkeit des ausgehenden Bildes bestimmt, welche Bildpunkte zuerst wechseln — Dunkles zuerst, Helles zuletzt. Der Trick hinter fast allen guten Wischern, ein Zehnzeiler im Shader | neu, klein |
| **Verdrängung entlang Rauschfeld** | beide Seiten auseinanderziehen und wieder zusammen; aktueller Motion-Look | **noise4D liegt bereit** |
| **Iris aus einer Lichtquelle** | öffnet dort, wo das Gerät hängt | Raum-Block |
| **Riss** | der Bruch reißt das alte Bild auf | Glas-Gruppe |
| **Slit-Scan** | eine Scanlinie wandert durch, links davon das neue Bild, rechts das alte; industrial-tauglich, trivial | neu, klein |
| **Pixel-Sortierung** | Spalten nach Helligkeit sortieren, tauschen, entsortieren | neu, klein |

#### Der Griff mit dem besten Verhältnis: GL Transitions

Rund achtzig fertige GLSL-Übergänge — dieselbe Sammlung, aus der ffmpeg's `xfade` schöpft.
Uniform-Schnittstelle: zwei Texturen, ein Fortschritt 0…1. Unser Maler liefert beides ohnehin. **Ein
Adapter, und der Vorrat ist auf einen Schlag groß.**

**Vor dem Einbau:** Lizenz steht je Datei, meist MIT — gehört nach `LIZENZEN.md`, wie bei
`web/fremd/webgl-noise`.

#### Cutting edge, aber erreichbar

- **Bildverschleppung (Pseudo-Datamosh).** Blockweise Bewegungsschätzung auf 16×16 — **dieselben
  Blöcke wie beim Nahtquotienten (§6.5)** — und die *alten* Bildpunkte entlang der *neuen*
  Bewegungsvektoren weiterschieben. Sieht aus wie Datamosh, ist aber deterministisch und steuerbar.
  Echtes Datamosh über weggelassene Schlüsselbilder wäre mit WebCodecs möglich, wird aber von Sunos
  Neukodierung unberechenbar; die Verschleppung im Maler überlebt sie, weil sie in den Bildpunkten
  steckt.
- **Bildzwischenberechnung als Übergang.** RIFE oder FILM auf die zwei Naht-Bilder, sechs bis zwölf
  erfundene Zwischenbilder einsetzen. **FILM ist ausdrücklich für große Bewegung zwischen fast
  unverwandten Bildern gebaut** — genau unser Fall — und liefert eine echte Morphung statt einer
  Blende, also kein Geisterbild (Regel 3). Als ONNX klein genug für `onnxruntime-node`. Die Lizenzen
  der beiden unterscheiden sich deutlich, das ist vor dem Holen zu klären.
- **Tiefenkarte für Parallaxe.** Depth Anything V2 small als ONNX: aus dem Standbild eine Tiefe
  schätzen und am Übergang hindurchfliegen statt hineinzoomen. Macht aus einem Foto einen Raum —
  **dieselbe Karte hebt zugleich das „lebende Foto" auf ein anderes Niveau.**
- **Freistellung.** Leichtes Matting-Modell trennt Vordergrund vom Hintergrund; der Hintergrund
  wechselt zuerst, die Figur folgt einen halben Takt später. Wirkt teuer, ist ein Modell plus zwei
  Ebenen.
- **Phasenkorrelation als Match Cut.** Vor dem Schnitt beide Bilder per FFT auf Versatz, Drehung und
  Maßstab ausrichten, dann schneiden. Ein ausgerichteter Schnitt braucht oft **gar keinen
  Übergang** mehr. Die FFT liegt im Haus.

#### Zwei Regeln für die Auswahl

**An den Nahtquotienten koppeln**, sonst wird das ein Menü mit achtzig Einträgen:

| Quotient | Übergang |
|---|---|
| < 1 | keiner |
| 1 … 2 | Neutralzustand (a) |
| > 2 | Ereignis (b) |

**Die Länge ist musikalisch** — ein Schlag oder ein halber Takt, nie eine Zahl in Sekunden (wie
§6.3).

### 6.8 Loopfähigkeit aller 38 Effekte — eine zweite Messreihe (12.09.2026)

Caspar_D: **Standbilder mit Effekten sind in der Regel voll loopfähig ohne Übergang** — also müssen
alle Effekte daraufhin abgeklopft werden. Was es nicht ist, wird tauglich gemacht; was sich nicht
machen lässt, braucht einen echten Übergang (§6.7).

Das ist eine Erhebung, die im Haus schon einmal gelaufen ist: **die Messreihe, mit anderer Frage.**
Aufbau bleibt, nur —

| | Tiefen-Check 10.09. | Loop-Check |
|---|---|---|
| Uhr | steht auf einem Schlag | **läuft** über [0, L) |
| Frage | wirkt der Regler? | ist das Bild bei t gleich dem bei t+L? |
| Maß | mittlere Pixelabweichung | **Nahtquotient** (§6.5) |

Vier Minuten über 38 Effekte, Ergebnis ist eine Spalte in der Registry.

#### Vier Klassen — sie bestimmen, was zu tun ist

**1 · Periodisch von Natur aus.** Alles, was aus einer Sinusfunktion der Zeit lebt: Pulse, Wellen,
Scheinwerferfahrten, der Lichtsequenzer. Rasten schon auf L/n ein — das ist der heutige Loop-Modus.
**Nichts zu tun.**

**2 · Gerade Zeitachse — generisch reparierbar.** Die vier Shader lesen Rauschen entlang einer
Geraden, Partikel fallen von oben nach unten, Filmkorn würfelt je Bild neu. Drei Muster decken den
Großteil:

- **Rauschfeld:** Zeit auf einen Kreis legen → `noise4D`, liegt bereit.
- **Partikel:** Lebensdauer genau L/k, Startzeiten gleichverteilt in [0, L/k) → das Feld ist nach L
  identisch.
- **Zufall je Bild:** Generator aus (Bildnummer mod N) säen statt frei würfeln.

**3 · Effekte mit Gedächtnis — die unangenehme Klasse.** Nachzieheffekt füttert sich selbst, Tropfen
laufen, Beschlag baut sich auf, Risse wachsen. Keine Periode, die man erzwingen kann, sondern ein
Zustand aus der Vorgeschichte. Die Vorlaufrunde (§4) hilft **nur bei abklingendem Gedächtnis**: der
Nachzieheffekt vergisst exponentiell, ist also nach einer Runde eingeschwungen und periodisch. Ein
Riss, der wächst und nie zurückgeht, ist es nicht — Endzustand ≠ Anfangszustand, und das lässt sich
nicht wegrechnen. Ehrliche Antwort dort: **im Loop-Modus nicht zur Wahl** (oder gespiegelte Hälfte,
was bei Glas albern aussieht).

**4 · Ereignisse.** Sicherungswackeln, Glitch-Blöcke. Loopen, wenn die Ereigniszeiten aus einem
periodischen Generator kommen; sonst triviale Reparatur — Zeiten einmal für [0, L) auswürfeln und
wiederholen. **Messfalle wie gehabt:** bei stehender Uhr messen sie null, sie brauchen den Zeitlauf.

#### Zwei Registry-Spalten, nicht eine

„Loopfähig in Intervallen ≤ 10 s" ist **keine Eigenschaft des Effekts, sondern von Effekt und
Parameterstellung.** Ein Scheinwerfer mit zwölf Sekunden Fahrt loopt bei L = 8 nicht — nicht weil er
es nicht kann, sondern weil sein Regler zu langsam steht. Also:

- **`loopfaehig`** — ja / nein / nach Reparatur
- **`minPeriode`** — die kürzeste Periode, die die aktuelle Reglerstellung zulässt

Erst damit kann **§3 rechnen**: die Optimierung über (L, n, φ) hätte sonst keine Grenzen, die aus
der Kette kommen.

#### Folge für die Automatik

Der ruhige Standard fürs **lebende Foto** besteht ausschließlich aus Klasse 1 und den reparierten
aus Klasse 2. Kein Übergang nötig, **Nahtquotient 0 per Konstruktion.** Das ist der Fall, der 236
Titel betrifft — der einfachste und zugleich der häufigste.

---

## 7 · Die langen Videos für YouTube

Ohne Echtzeitzwang fällt die Zehn-Sekunden-Grenze weg; sie ist Sunos Grenze für Cover-Art-Videos
(Caspar_D, 27.08.2026), nicht unsere.

Ein Rezept über das ganze Lied: `schlaege` und `abschnitte` liegen für alle Titel vor, dreieinhalb
Minuten sind rund 6.300 Bilder.

**Loop und langes Video ziehen ästhetisch in entgegengesetzte Richtungen** — „dieselbe Maschine, nur
länger" ist eine Effizienzbehauptung, keine ästhetische. Ein Loop darf keine Entwicklung haben,
sonst merkt man beim vierten Durchlauf, dass er anfängt und aufhört; er will hypnotisch sein. Ein
langes Video braucht Entwicklung, sonst ist es ab Minute zwei ein Bildschirmschoner mit Ton. Ein
Rezept für beides ist entweder ein langweiliger Loop oder ein unruhiges Video.

Daher **zwei Rezepttypen über einer Maschine**: der Loop-Typ kennt einen Zustand und variiert
innerhalb der Periode; der Regie-Typ kennt Zustände je Abschnitt und Übergänge dazwischen.

**Serienrezept** je Reihe (Bio-Liturgie, Deutsche Schatten, GEGENÜBER) mit Überschreibung je Titel
— die visuelle Identität des Kanals, und zugleich die Antwort auf „Bewegte Standbilder — 236 Songs
ohne Video-Artwork" samt des dort offenen Serienlaufs. Der Lauf folgt der Linie vom Ausgabebuch:
der Rechner schlägt vor, der Mensch entscheidet — Nachtlauf, morgens Kontaktbögen, Daumen hoch oder
runter.

**Offene Frage, noch nicht entschieden:** Läuft ein wiederholtes Abschnittsvideo mit **mitlaufenden**
oder **weiterlaufenden** Effekten? Im Zehnsekünder müssen sie mitlaufen, sonst schließt der Clip
nicht. Im langen Video darf ein Refrainvideo beim dritten Durchlauf anders bemalt sein als beim
ersten — die Handlung wiederholt sich, das Licht entwickelt sich. Das ist der Unterschied zwischen
Schleife und Wiederaufnahme, und er entscheidet, ob eine Effektkette an der **Clip-Zeit** oder an
der **Lied-Zeit** hängt.

---

## 8 · Der Lauf — Antworten auf die sechs Fragen

Vorschläge, keine Entscheidungen. Die Fragen stehen in NAECHSTER_CHAT.md unter „Der Lauf ist wieder
ausgebaut (11.09.2026, nachts)".

| # | Frage | Vorschlag |
|---|---|---|
| 1 | Was ist die Einheit? | Der **Takt des Clips** aus dem Schlagraster. Je Takt ein Feld mit Videotakt, Richtung, Geschwindigkeitsform — eine Zeitkarte τ(t), sonst nichts. |
| 2 | Was darf springen? | **Jeder Schlag, den das Stück selbst betont** — nicht nur die Eins. Schnitte, die immer auf der Eins sitzen, werden metronomisch, und im Industrial liegen die Akzente oft auf 2 und 4. Das Schlagraster hat die Gewichte. Der Regler heißt **Dichte**, nicht Position: man bedient Tempo statt Zeitpunkte, und das ist der Unterschied zwischen einem Regler und einem Schnittprogramm. |
| 3 | Was schließt den Clip? | **Durch Konstruktion, nicht durch Prüfung.** Geschlossene Vorlagen; ein freier Modus zeigt die Naht als Zahl und warnt. |
| 4 | Folgen die Effekte der gebogenen Zeit? | **Nur das Bild folgt τ.** Effekte laufen vorwärts auf der Clip-Zeit; rückwärts nur, wenn ein Effekt das ausdrücklich will. |
| 5 | Wo hört der Sequenzer auf? | **Beim Abschnitt** — eine Form je Abschnittstyp, die Takte füllt die Vorlage. Die Frage dahinter (Mensch oder System?) ist am 12.09. beantwortet: siehe **§8a**. |
| 6 | Sichern? | Zeitkarte als Teil des Rezepts, `fassung: 3`, Übersetzung alter Ablagen nach Regel 12. |

---

## 8a · Automatik und Mensch — die Arbeitsteilung (12.09.2026)

Damit ist **Frage 5 beantwortet**: Vorzugsweise baut das System das Video zusammen, mit Eingriffs-
möglichkeit. Zielgröße Caspar_D: **in 80 % der Fälle zufriedenstellend.**

### Die Automatik hat keine ästhetische Aufgabe, nur eine handwerkliche

Caspar_Ds Formulierung, und sie entscheidet mehr als jede Bedienfrage:

> „Es gibt ruhige Standards, die relativ neutral sind, aber professionell funktionieren und wirken.
> Im Zweifel ist sowas sofort publizierbar, ohne sich einen Ruf zu ruinieren, maximal langweilig
> aber handwerklich perfekt. Alles, was darüber hinausgeht, ist Mensch."

Das macht die Automatik **prüfbar**. „Wirkt gut" kann man nicht messen, „ist sauber" schon: Naht
unter der Sichtbarkeitsschwelle, keine Rate über der Toleranz, kein Puls gegen den Takt, keine
Handlung rückwärts, kein Übergang, wo nichts passiert. Alles Zahlen, die in diesem Dokument stehen —
die Automatik kann damit von einer Messreihe abgenommen werden wie die Effekte selbst.

**Konsequenz für §6.7:** Datamosh-Verschleppung, Parallaxe aus der Tiefenkarte, Freistellung sind
**keine Kandidaten für die Vorgabe.** Sie liegen im Vorrat und warten auf den Menschen. Die
Automatik greift nie von selbst danach. Klare Linie: *alles, was auffällt, ist Mensch.* Der Preis
ist, dass ein automatisch gebautes Video nie eine Idee haben wird — bewusst gezahlt.

### Zwei Adressaten, ein Weg durch dieselbe Maschine

| | **Tarja und andere** | **Caspar_D** |
|---|---|---|
| Ergebnis ist | das Endprodukt | der **Ausgangspunkt** |
| Begründungsspur | unsichtbar | das eigentliche Bedienelement |
| Anspruch erfüllt durch | Treffer der Automatik | drei Handgriffe bis zum Ziel |

Caspar_D: *„das ist individuell, meine Ansprüche wirst du eher schwer erfüllen, andere Leute sind da
nicht so pingelig."* Die Automatik muss deshalb nicht klug sein, sondern **nachvollziehbar**.

### Die Kette — jede Stufe schreibt ihre Begründung mit

Abschnittstypen (§5) → Material je Typ → Längen und Raten (§3) → Übergänge über den Nahtquotienten
(§6.5 / §6.7) → Effektkette aus dem Serienrezept, moduliert nach Abschnittstyp.

Keine Stufe ist neu. Was fehlt, ist die Reihenfolge und die Regel, dass **jede Stufe mitschreibt,
welche Alternative sie verworfen hat und warum**. Damit ist ein Eingriff kein Neubau, sondern ein
Umschalten auf die zweitbeste Option, die schon dasteht.

### Drei Regeln

**1 · Zurückhaltung schlägt Ambition.** Die Automatik verliert nicht, wenn sie Langweiliges baut,
sondern wenn sie **Falsches** baut. Bei Unsicherheit die ruhigere Variante: Materialtyp unsicher →
kein Pendel. Nahtquotient grenzwertig → der mildere Übergang. Tempo instabil → keine taktgebundenen
Effekte. Das ist Caspar_Ds eigene Regel aus dem Discord-Entwurf vom 10.09.: *leise anfangen, ein
Helligkeitspuls, ein Schatten kaum sichtbar, ein Hauch Nebel — das wirkt mehr als jede Wucht.*

**2 · Vertrauensmaß je Stufe.** Ein handwerklich perfektes Ergebnis über falsch erkanntem Material
ist **perfekt falsch**. Unterhalb einer Schwelle sagt das System nicht „fertig", sondern „hier habe
ich geraten". Für Tarja ein Hinweis statt eines stillen Fehlers; für Caspar_D genau die Stelle, an
die er ohnehin sehen wollte.

**3 · Der ruhige Standard ist nicht einer, sondern drei** — je Materialtyp (§2) einer: Textur,
Mikrohandlung, lebendes Foto. Je zwei bis drei Effekte, kein Übergang außer dem mildesten, den der
Nahtquotient zulässt. Wenig genug, um es einmal richtig einzustellen und dann stehen zu lassen.

### Was der Mensch beisteuern muss

Zwei Dinge lassen sich nicht wegautomatisieren: die **Zuordnung Video → Abschnittstyp** (welches
Video zum Refrain gehört, weiß nur Caspar_D) und die **Phasenmarke** bei Mikrohandlungen (§2). Alles
danach kann das System.

### Die Eingriffe zählen — nicht für die 80 %, sondern gegen Wiederholung

Die brauchbare Messgröße ist nicht „gefällt / gefällt nicht", sondern **wie viele Eingriffe bis zur
Zufriedenheit**. Das System protokolliert je Eingriff, an welcher Stufe er nötig war. Nach dreißig
Videos ist sichtbar, wo es systematisch danebenliegt — und **wiederkehrende Korrekturen gehören dann
in die Vorgabe**. Bei Caspar_D liegt der Ertrag höher als bei Tarja, gerade weil er pingeliger ist.

**Offen:** die Form des Eingriffs — **Regler** (Parameter drehen, System rechnet neu) ·
**Verwerfen** („nicht dieser Übergang", System nimmt den nächsten aus seiner Liste) · **Sperren**
(gut Gefundenes einfrieren, den Rest neu würfeln). Sperren wäre das mächtigste und in einem
rezeptbasierten System fast gratis; für Tarja bliebe es unsichtbar. Die anderen beiden müsste man
doppelt bauen.

---

## 9 · Der Ausschnitt als eigene Achse — Ken Burns (12.09.2026, am Code nachgesehen)

**Die erste Fassung war hier zu optimistisch.** Sie las sich, als wäre Ken Burns vorhanden und müsse
nur taktweise verwendet werden. Ein Blick in `web/index.html` zeigt: es ist nicht vorhanden.

### 9.1 Drei Befunde zur „Fahrt" — nachgerechnet, noch nicht behoben

Anlass: Caspar_D, 12.09.: *„ich hab gestern keine Fahrten oder lokale Zoom-ins und -outs gesehen."*
Der Eindruck stimmt.

**Befund 1 — die Fahrt zoomt nicht, nie.** In `zeichneFrame` steht

```js
if(e.typ==='fahrt'){ crop*=(1-(1-e.zoom)*s); panx+=tri(t/lpP(e.tempo))*e.weite*s; … }
```

`crop` ist **zeitunabhängig**: `e.zoom` setzt einen festen Ausschnitt, nur `panx`/`pany` laufen über
`tri()`. Der UI-Regler heißt korrekt „Ausschnitt", die Beschreibung verspricht aber *„Ein Ausschnitt
wandert **und zoomt** langsam über das Bild"*. **Verstoß gegen Regel 11** (die Beschriftung ist ein
Versprechen). In der ganzen Bibliothek gibt es **keinen langsamen Zoom**: `puls` („Zoom schlägt")
hängt an `pulsHub`, also am Schlag mit Abklingen, nicht an einer Rampe.

**Befund 2 — die Bewegung liegt bei den Vorgaben unter der Wahrnehmungsschwelle.** `weite` wird mit
`(bw−cw)/2` multipliziert, also mit dem ohnehin kleinen freien Weg. Doppelte Dämpfung:

| Ausschnitt | Weite | freier Weg je Seite | Weg Spitze zu Spitze |
|---|---|---|---|
| 0,8 *(Vorgabe)* | 0,24 *(Vorgabe)* | 10 % | **4,8 % der Breite** |
| 0,8 | 0,5 *(Max)* | 10 % | 10 % |
| 0,6 | 0,4 | 20 % | 16 % |
| 0,5 | 0,5 | 25 % | 25 % |

4,8 % der Breite über eine Halbperiode von 9 s. Auf der 452 px breiten Prüfleinwand sind das 21 px
in 9 s, gut 2 px/s. Nicht kaputt — **zu leise eingestellt.** Sichtbar wird es erst ab Ausschnitt 0,6
und Weite 0,4.

**Befund 3 — im Export ist der Tempo-Regler praktisch tot, und die Bahn kollabiert.** `lpP` rastet
die Periode auf einen Teiler von L ein. Bei L = 10 s:

| Tempo | Periode x | Periode y |
|---|---|---|
| 6 | 5 s | 10 s |
| **7 … 40** | **10 s** | **10 s** |

Zwei Folgen. Der Regler wirkt über 34 seiner 35 Stufen nicht — **Regel 9**. Und schwerer: `panx` und
`pany` sollen mit 1 : 1,3 eine Lissajous-Bahn zeichnen; kollabieren beide auf 10 s, läuft der
Ausschnitt auf einer **geraden Diagonale** hin und her. Genau das war zu sehen.

**Warum die Messreihe das nicht gefunden hat — eine fünfte Falle für die Regeln.** Fahrt misst 51,2
an/aus und „Ausschnitt" 59,8 als stärksten Regler — beides bei **stehender Uhr**. Damit ist der
*Beschnitt* und der *Versatz* gemessen, nicht die *Bewegung*. Ein Effekt, der den Ausschnitt nur
verschiebt und nie animiert, ergäbe dieselben Zahlen. Die Falle ist grundsätzlicher als die vier
notierten: nicht „Ereignisse brauchen einen Zeitlauf", sondern **Geometrie braucht einen Zeitlauf**
— jeder Effekt, der nur den Ausschnitt bewegt, ist bei stehender Uhr nicht von einem statischen
Versatz zu unterscheiden. Gehört nach `EFFEKTCLIP-REGELN.md`, „Was der Mittelwert nicht sieht".

**Nebenbei, Regel 10a (ein Wort steht für eine Sache):** „Der Lauf" ist das am 11.09. ausgebaute
Zeitbiege-Modul, „**Läufe**" ist eine Effektgruppe in der Oberfläche — und *fahrt* sitzt genau dort,
neben Streifen, Licht, Schatten, Laser, Farbschleier, Nebel und Feuer. Zwei Dinge, ein Wortstamm.
Fall für Umbenennung.

### 9.2 Was Ken Burns wirklich ist — und was schon trägt

Caspar_D: *„taktweiser Zoompuls ist ja schon da; Ken Burns wäre aber Fahrt durch das Bild mit Zoom-in
und -out-Marken."* Richtig, und **die beiden sind orthogonal**: der Puls moduliert den Maßstab auf
den Schlag, Ken Burns bewegt das Rechteck über die Zeit. Im Code multiplizieren sie sich bereits
sauber (`eff = crop/scaleMul`). Es fehlt nur die **Bahn** — `crop` und die Pan-Werte kämen aus Start-
und Zielrechteck statt aus einer Konstante und einer Dreieckswelle. Eine Funktion von t auf vier
Zahlen, kein Shader und kein Modell.

### 9.3 Die Randbedingung — und warum sie keine Reihenfolge ist

Caspar_D: *„bevor die Fahrt beginnt, muss es immer erst einen Zoom-in geben, sonst gerät der Viewport
außerhalb der Bildgrenzen."* Die Bedingung stimmt, die Reihenfolge ist strenger als nötig — und „erst
Zoom, dann Fahrt" zerlegt die Kamerabewegung in zwei Phasen und wirkt dadurch mechanisch.

Tatsächlich gilt: bei Maßstab z ist der freie Weg je Seite (1−z)/2, und das Rechteck bleibt drin,
solange |Versatz| ≤ (1−z)/2 **zu jedem Zeitpunkt**, je Achse getrennt. Das ist keine
Reihenfolgebedingung, sondern eine Kopplung.

**Die saubere Formulierung: in normierten Koordinaten fahren, nicht in Pixeln.** Das Zielrechteck
wird als Position im *freien Raum* angegeben (−1 … +1), die Umrechnung multipliziert mit (1−z(t))/2.
Dann ist die Bedingung **durch Konstruktion erfüllt**, bei jeder Zoomkurve — kein Vorlauf, keine
Klammerung, die die Bahn heimlich verbiegt. **Der Code rechnet bereits so** (`cx0 = bw/2 +
panx*(bw−cw)/2`, panx auf [−1,1] geklammert); die Normierung wird nur nicht ausgenutzt, weil `weite`
zusätzlich auf 0,5 gedeckelt ist — daher Befund 2.

Denkt man in *Bildkoordinaten* („zum Gesicht bei 0,78 / 0,31"), braucht der Zielpunkt einen
Mindestzoom: **z ≥ 1 − 2·max(|dx|, |dy|)**, gemessen von der Mitte. Der Zoom ergibt sich aus dem
Ziel, statt ihm vorauszugehen.

**Harte Regel daraus:** Der Maßstab darf nie auf 1 gehen, solange die Fahrt weitergeht — bei z = 1
ist der freie Weg null, jede Position außer der Mitte unmöglich, und ein Zoom-out auf Vollbild
zwingt die Bahn in die Mitte zurück. **Vollbild ist ein Endzustand, keine Zwischenstation.** Wer
zwischendurch „ganz raus" will, bleibt bei etwa 0,95.

### 9.4 Handwerk — drei Details, die über gut und billig entscheiden

- **Der Zoom wird geometrisch interpoliert, nicht linear.** Lineare Interpolation der Rechteckgröße
  lässt die gefühlte Zoomgeschwindigkeit anziehen; der Maßstab gehört exponentiell gefahren, dann ist
  die wahrgenommene Rate konstant. Häufigster Fehler in fertigen Ken-Burns-Umsetzungen.
- **Das Ziel sitzt auf einem Drittelpunkt, nicht in der Mitte.** Exakt zentriert liest sich als Zoom,
  leicht außermittig als Kamera.
- **Weichstart und Weichstopp** über die sin²-Kurve, die schon im Haus ist (beginnt und endet mit
  Steigung 0).

**Vorbehalt:** Bei geometrischer Zoom- und linearer Positionsinterpolation kann die Bahn in
Bildkoordinaten leicht ausbauchen, wenn Start- und Zielmaßstab weit auseinander liegen (etwa 0,9 auf
0,4). Innerhalb des Bildes bleibt sie, aber der Weg über das Motiv ist nicht die erwartete Gerade.

### 9.5 Loopfähigkeit — die Einschränkung

Ken Burns ist der **einzige geometrische Effekt, der nicht von Natur aus loopfähig ist**: eine Fahrt
in eine Richtung endet woanders, als sie anfing. Loopbar nur als **Pendel** — hin und zurück mit
weichem Umkehrpunkt. Für eine Kamera ist Zurückfahren legitim (anders als bei einer Mikrohandlung,
§2), aber es bleibt eine Einschränkung: **im Zehnsekünder gibt es eine Bewegung und ihre Rücknahme,
keine Folge von Marken.** Die Markenfolge — rein, halten, raus, andere Stelle — gehört ins lange
Video, wo sie sich an den Abschnitten festmacht.

### 9.6 Das Object of Interest

Caspar_D: *„gar nicht so einfach zu automatisieren, weil man ja das Object of Interest erkennen muss;
generisch sitzt das in der optischen Mitte, aber eben nicht immer."*

**Der Fall liegt besser als beim Korona-Versuch** (Variante E, an 13 px danebengesetzter Leuchtstelle
gescheitert, daraus die Lehre „generischer"). Dort wurde etwas *angeheftet* und der Punkt musste
exakt sein. Ken Burns braucht ihn nur ungefähr — der Fehlermodus ist „Bildmitte etwas unglücklich",
nicht „Leuchten sitzt daneben". 13 px bei 70 % Ausschnitt sind unsichtbar. **Darum ist Salienz hier
brauchbar, wo sie es dort nicht war.**

**Erst ablehnen, dann erkennen.** Positiv „das ist das Subjekt" zu bestimmen ist schwer, negativ
„dort ist nichts" leicht: lokale Varianz oder Kantendichte über ein Raster, alles unter einer Schwelle
ist als Ziel gesperrt. Dann landet die Fahrt nie im leeren Himmel — und mehr will man in 80 % der
Fälle nicht (§8a).

Leiter für die positive Suche, billig nach teuer:

1. **Spektralresiduum** (Hou/Zhang 2007) — Salienzkarte aus dem Log-Amplitudenspektrum, rund zehn
   Zeilen, **die FFT liegt im Haus**. Kein Modell, keine Lizenzfrage.
2. **Gesichtserkennung** — die Cover haben oft Figuren, ein Gesicht schlägt jede Salienzkarte.
   Kleines ONNX auf der bestehenden Runtime; Größe und Lizenz **nicht geprüft**.
3. **Tiefenkarte** — siehe §9.7.

**Was ehrlich schwer bleibt:** nicht den Punkt zu finden, sondern zu wissen, ob die Komposition
*taugt*. Ein Gesicht am Kinn angeschnitten ist schlechter als gar keine Bewegung, und dafür ist kein
billiger Test bekannt. Antwort ist die Rückfallregel aus §8a: **bei niedrigem Vertrauen nicht zum
geratenen Punkt fahren, sondern die Amplitude kleiner machen** — weniger Zoom, kürzerer Weg, näher
an der Mitte.

**Die empirische Abkürzung, vor jedem Apparat:** Kontaktbogen über alle 321 Cover mit dem
vorgeschlagenen Ziel eingezeichnet. In zehn Minuten ist klar, ob die Mitte in 60 oder in 90 % der
Fälle reicht. Bei 90 % ist die ganze Salienzfrage ein Regler für den Rest und kein Apparat.

### 9.7 Die Tiefenkarte wird ein Grundkanal, nicht eine Zutat

Caspar_D: *„dann könnte man sogar Beleuchtungseffekte nur auf den Vordergrund wirken lassen."* Damit
ändert die Tiefenkarte ihre Stellung im System — und ihre Kosten.

**Was sie für Ken Burns leistet:** ein **Rechteck statt eines Punktes** (Schwelle auf die Tiefe,
größte zusammenhängende Fläche, umschließendes Rechteck plus Rand). Das ist genau das Ziel, das die
Bahn braucht, und es beantwortet die Zoomtiefe gleich mit. Als **Ablehner** ist sie besser als
Varianz: flache, gleichförmige Tiefe heißt Himmel, Wand, Fläche — dorthin fährt man nicht.

**Was sie für die Beleuchtung leistet.** Nicht als harte Maske: „nur Vordergrund" gibt eine Silhouette
mit sichtbarer Kante, das sieht nach Freistellung aus, nicht nach Beleuchtung. Der überzeugende Weg
ist **Abstandsabfall** — der Lichtbeitrag nimmt mit der Tiefe ab. Die Figur wird heller als der
Hintergrund, ohne dass irgendwo eine Kante entsteht. Der Licht-Puffer rechnet bereits additiv, es käme
ein Faktor je Bildpunkt dazu.

- **Nebel als Luftperspektive.** Der Nebel mischt schon gegen seine Umgebung (Regel 6a); mit Tiefe
  mischt er gegen die *Entfernung* — hinten dichter, vorn dünner. Physikalisch richtig, ein Faktor im
  Shader, der `u_licht` ohnehin liest. **Von allem hier das, was am meisten nach Tiefe aussieht und
  am wenigsten kostet.**
- **Kegel trifft auf.** Der Raum-Block führt den Scheinwerfer bereits räumlich (Ursprung, Ziel,
  Kegel). Trifft der Kegel auf die Tiefe, wird der Fleck an einer nahen Figur breiter oder schmaler —
  der Unterschied zwischen Licht *auf* dem Bild und Licht *in* der Szene. Ein Rechenschritt, kein
  Apparat.
- **Schatten ist der interessantere Fall als das Licht.** Er rechnet mit Farbig nachbelichten, ist
  also das Spiegelbild — mit Tiefe wird daraus ein Vordergrund, der in den Hintergrund hinein
  abdunkelt. Liest sich sofort als Raum.

**Zwei Warnungen aus dem eigenen Regelwerk.** **Regel 5:** wo Licht ist, muss etwas sein, das
beleuchtet wird — daran starb das Sicherungswackeln einen halben Tag. Ein tiefenabhängiges Licht auf
dunklem Hintergrund malt weiterhin nichts, und das ist richtig so. **Nie schwellen, immer stetig:**
relative Tiefenmodelle haben an Silhouetten weiche, oft ungenaue Übergänge; eine harte Schwelle
erzeugt Artefakte genau dort, wo das Auge am genauesten hinsieht.

**Parallaxe — vorsichtiger als der Rest.** Ein relatives Modell liefert Ordnung, keine metrische
Tiefe; der Verschiebungsbetrag hängt am Skalenfaktor, zu viel und die Figur schwimmt. Der harte Teil
ist die **Verdeckung**: seitlich versetzt muss hinter der Figur Bild sein, das es nicht gibt.
Inpainting oder Kantenausstrich, und bei kleinen Amplituden fällt es nicht auf. **Parallaxe ist eine
Andeutung, kein Flug** — für das lebende Foto genügt das, dort ist wenig ohnehin die Vorgabe.

**Folge für die Stellung im System:** Die Tiefenkarte ist damit kein Zubehör für §6.7 und §9 mehr,
sondern ein **Grundkanal neben dem Licht-Puffer**, der mehrere Effektfamilien speist. Dann muss sie
für jedes Cover vorliegen, nicht nur dort, wo jemand Ken Burns anschaltet.

**Ungeprüft, vor dem Bau:** Größe und Lizenz von Depth Anything V2 small als ONNX, und ob
`onnxruntime-node` den Graphen frisst — dieselbe Frage wie beim ECAPA-Modell, ein Fünfzeiler.
Dazu: Rechenzeit über 321 Cover, und wo das Ergebnis liegt. Nach der Hauslinie *„was wir jederzeit neu
erzeugen können, archivieren wir nicht"* — bei einer Sekunde je Cover ist Neuberechnen billiger als
Buchführen, bei zehn Sekunden nicht.

### 9.7a Dunst mit Tiefe — und warum er nicht „hinter" die Objekte gelegt wird

Caspar_D: *„wie würde das eigentlich mit der Tiefenmap funktionieren, bspw. mit Dunst am Boden hinter
den Vordergrundobjekten?"* Die Pointe der Antwort trägt den ganzen Ansatz:

> **Dunst wird gar nicht hinter die Objekte gelegt.** Wer ihn als Schicht denkt, braucht eine Maske
> und bekommt eine Silhouettenkante. Physikalisch ist Dunst keine Schicht, sondern eine Dämpfung
> entlang des Sehstrahls.

```
Ergebnis = Bild · e^(−dichte·z)  +  Luftlicht · (1 − e^(−dichte·z))
```

Jeder Bildpunkt wird nach **seiner eigenen** Tiefe gedämpft: Vordergrund kleines z, kaum gedämpft,
bleibt scharf und bunt; Hintergrund läuft gegen die Luftlichtfarbe. Die Figur steht dadurch
**automatisch** vor dem Dunst — ohne Maske, ohne Schichtreihenfolge, ohne eine einzige Kante.

Das ist Koschmieders Sichtweitengleichung und genau das, was die Notiz zum Nebel-Shader schon
vorschlägt (*dämpfen plus Luftlicht, statt das Bild durch eine verwaschene Kopie zu ersetzen*). Mit
Tiefenkarte ist es keine Näherung mehr, sondern die richtige Rechnung — und **die 40-%-Entsättigung
aus §10 fällt ersatzlos weg**, weil die Entsättigung dann von selbst entsteht, dort wo sie hingehört.

**Bodendunst braucht eine zweite Größe: Höhe.** Die Karte gibt z, nicht die Höhe über dem Boden. Für
eine ungefähr waagerechte Bodenebene reicht die Lochkamera-Näherung

```
h ≈ (y − y_horizont) · z
```

— ein Parameter mehr (die Horizontlinie) und das Verhalten stimmt: Der Dunst klebt am Boden, läuft
zum Horizont zusammen, die Beine der Figur stehen darin, der Kopf ragt heraus. **Ohne den Höhenterm
gäbe es nur Ferndunst, überall gleich hoch.**

> **GEBAUT AM 14.09.2026 — und was dabei herauskam.** Der Dunst als Dämpfung steht im
> Theaternebel, als Regler „Tiefe (Karte)" von 0 (wie bisher) bis 1 (volle Rechnung). Vier
> Dinge, die dieser Abschnitt nicht vorhersehen konnte und die beim nächsten Verbraucher
> Zeit sparen:
>
> **Die Karte gehört zu dem Bild, das die Oberfläche ZEIGT.** Nicht zu `cover.jpg`: bei 181
> von 324 Titeln zeigt das Haus `titelbild.jpg` — dasselbe Motiv ohne den Rand, den
> `bin/kacheln.js` seit dem 09.09. wegschneidet, also anderer Ausschnitt *und* anderes
> Seitenverhältnis. Eine Karte des einen über dem anderen liest sich als Versatz und
> stellenweise als verkehrte Tiefe.
>
> **Das Modell nimmt jedes Seitenverhältnis**, solange beide Kanten Vielfache von 14 sind
> (nachgemessen: 518×518, 392×518, 378×504 laufen alle). Auf ein Quadrat zu quetschen ist
> unnötig und schadet — 22 von 80 geprüften Covern sind hochkant.
>
> **Die Kartendatei bekommt die Maße des Bildes.** Gerechnet wird bei 518, geschrieben in
> der Größe der Quelle. Dann muss sich niemand fragen, wo gestreckt wird.
>
> **§10 darf nicht allein stehen.** Die 40-Prozent-Entsättigung im Nebel stand dort, weil
> `umgebung()` kein Weichzeichner war, sondern ein **Ringabtaster**: acht Griffe auf zwei
> festen Ringen, für jeden Bildpunkt derselbe Winkel — also versetzte Kopien des Bildes, die
> sich überall an derselben Stelle addieren. Grau fielen sie nicht auf, in Farbe sofort
> („zwei Geisterbilder", „die Maske sitzt zu hoch"). Wer die Entsättigung entfernt, muss
> **zuerst** den Abtaster reparieren: drei Ringe, je acht Griffe, Startwinkel je Bildpunkt
> gewürfelt. Dann zerfallen die Kopien zu gleichmäßiger Trübung, und die Entsättigung kann
> ersatzlos weg.

### 9.7b Tiefe wird ein generischer Parameter, kein Einbau je Effekt

Der Architekturpunkt, wichtiger als jede Einzelanwendung. Ist die Tiefe ein Grundkanal, wird sie
**nicht in 38 Maler einzeln eingebaut**, sondern ist *eine Zeile in der generischen Spalte* (§9a.5):

> **wirkt auf — vorn / hinten / alles**, mit weichem Übergang.

Dann bekommt jeder Effekt Tiefenwirkung, ohne dass 38 Maler angefasst werden, und der Regler steht
bei allen an derselben Stelle. Dieselbe Logik wie bei der Quellfläche: **ein Begriff, überall gleich,
statt 38 Sonderlösungen.**

### 9.7c Wo die Tiefenkarte sonst noch trägt

**Partikel mit Tiefe — der stärkste Fall.** Jedes Teilchen bekommt ein z. Daraus folgt dreierlei von
selbst: Größe und Geschwindigkeit skalieren mit 1/z, nahe Teilchen sind unscharf, und **Teilchen
hinter der Figur verschwinden** (ein Tiefenvergleich je Teilchen). Schnee, der hinter der Figur fällt
und vor dem Hintergrund, ist der Unterschied zwischen echtem Wetter und aufgelegtem
Bildschirmschoner. Kostet eine Abfrage **je Teilchen, nicht je Bildpunkt** — fast nichts. Passt exakt
auf §9a: die Quellfläche bekommt eine dritte Koordinate.

**Schärfentiefe und Fokusfahrt.** Zwei verschieden verwaschene Kopien, tiefengewichtet gemischt.
Interessanter als der Effekt ist die Bewegung: über zwei Takte vom Hintergrund auf die Figur
scharfstellen — eine Kamerageste, die ohne Tiefe unmöglich ist. **Ehrlich dazu:** naive Tiefenschärfe
blutet den scharfen Vordergrund in den verwaschenen Hintergrund und macht Höfe an den Silhouetten.
Sauber wird das fummelig.

**Tiefenwischer als Übergang — Korrektur zu §6.7.** Dort steht Freistellung per Matting-Modell, damit
der Hintergrund vor der Figur wechselt. Mit der Tiefenkarte braucht es **kein zweites Modell**, und
das Ergebnis ist **stetig statt mit Kante**: Der Übergang läuft über die Tiefe, hinten zuerst, vorn
zuletzt. Das ist die Luminanz-Verdrängungskarte aus §6.7 — mit Tiefe statt Helligkeit.

**Der Laser bekommt beides aus einer Rechnung (§9b.5).** Den Strahl im Bildraum abmarschieren und
seine Tiefe mit der Karte vergleichen: wo die Karte näher ist, ist er verdeckt; wo er auftrifft,
sitzt der helle Punkt. **Verdeckung und Auftreffpunkt in einem** — in §9b.5 war der Auftreffpunkt noch
als Parameter vorgesehen.

**Farbgradierung nach Tiefe.** Hintergrund kühler und flauer, Vordergrund wärmer. Was Coloristen von
Hand mit Masken machen — und der billigste Griff, um ein flaches Cover fotografisch wirken zu lassen.

### 9.7d Was ehrlich dagegen steht — und der eine Punkt dafür

- **Relative Tiefe ist keine metrische.** Dichteparameter gelten je Bild, nicht allgemein. Es braucht
  eine Normierung über Perzentile, und selbst die wackelt zwischen Bildern mit und ohne nahes Objekt.
- **Weiche, ungenaue Silhouetten** in monokularen Karten: alles, was daraus eine harte Grenze macht,
  zeigt Artefakte genau dort, wo das Auge hinsieht (siehe die Warnung in §9.7).
- **Stilisierte Illustrationen.** Die Cover sind teils Artwork, die Modelle sind auf Fotos trainiert.
  Wie gut das sitzt, ist **unbekannt** — Fall für den Kontaktbogen aus §9.6, mit der Tiefenkarte als
  Falschfarbe daneben.

> **NACHGETRAGEN 14.09.2026 — die offene Frage ist beantwortet.** Zwölf Cover quer durch
> den Bestand, Kontaktbogen mit Karte daneben: **es taugt auf stilisiertem Artwork.**
> Figuren stehen frei, der See bekommt einen Verlauf zum Horizont, Seerosenblätter liegen
> auf verschiedenen Abständen. Gemessen wurden auch die drei Modellgrößen — Small macht aus
> nassen Steinen einen weichen Brei, **Large gibt jedem Stein Relief**, also genau dort, wo
> Dunst und Partikel hinsehen. Genommen: **Large in fp16**, 640 MB, 3,5 s je Cover, 19 min
> für alle 324 (Intel-Mac). fp16 gegen fp32: mittlere Abweichung 0,08 von 255.
>
> **Damit fällt der Grund weg, die Tiefenkarte in §11 und §12 hinten zu halten** — dort
> stand sie auf Platz 11, *weil* diese Annahme ungeprüft war. Sie rückt vor die Punkte, die
> von ihr abhängen: Gottesstrahlen mit Verdeckung (§9b.2), Auftreffpunkt des Lasers
> (§9b.5), 3D-Raum (§9c).
>
> Gebaut: `bin/tiefenkarten.js`, Karten unter `library/songs/<id>/tiefe.png`, daneben
> `library/tiefenkarten.json` mit Modellidentität und Herkunft je Karte. Einzelheiten und
> die offenen Punkte (Morgenroutine, Setup) stehen in der BACKLOG.

**Dafür spricht ein Punkt, der gern übersehen wird: die Quelle ist ein Standbild.** Die Karte wird
einmal gerechnet und ist danach konstant. Das größte Problem monokularer Tiefenschätzung im Video —
**das Flackern von Bild zu Bild — existiert hier gar nicht.** Für das lebende Foto ist das Verfahren
deshalb tragfähiger, als seine Reputation vermuten lässt.

### 9.8 Was zuerst zu tun ist

1. **Die drei Befunde aus 9.1 beheben** — unabhängig von allem Videozeug: Beschreibung berichtigen
   oder den Zoom wirklich einbauen, Vorgabewerte anheben, `lpP` im Loop für Fahrt entkoppeln.
2. **Die fünfte Messfalle** in `EFFEKTCLIP-REGELN.md` nachtragen.
3. **Ken Burns als eigener Effekt** bauen (Start-/Zielrechteck, geometrischer Zoom, sin²-Kurve,
   normierte Koordinaten) — ohne jede Zielerkennung, Ziel erst einmal von Hand oder Bildmitte.
4. **Kontaktbogen über 321 Cover**, bevor über Salienz oder Tiefe entschieden wird.

---

## 9a · Quellfläche und Sichtfeld — Partikel örtlich binden (12.09.2026)

Caspar_D: *„wenn auf einem Standbild ein Feuer ist, könnte man das animierte Feuer darüber legen …
auch eine Fackel mitten im Bild … bei Funken nicht das ganze Bild, sondern nur den Teil, wo das
Feuer brennt … bei Rauch nur dort, wo der Docht der ausgeblasenen Kerze ist. Also du siehst, viele
Partikelgenerierer könnten mehr Parameter vertragen."*

### 9a.1 Eine Korrektur vorweg: Feuer kann das schon fast

Die Registry hat **`boden` (0…1, nicht nur unten), `mitte` und `breite`**, und der Maler nutzt alle
drei: `baseY = Hn*e.boden`, `x0 = Wn*(e.mitte − e.breite/2)`. Die Grundlinie lässt sich heute schon
auf jede Höhe und jede Stelle legen. Was **wirklich** fehlt:

- **Wind gibt es bei Feuer und Flammen gar nicht.** Nur `sway`, ein symmetrisches Wackeln um die
  eigene Achse. Eine Fackel, deren Flamme zur Seite gezogen wird, ist nicht einstellbar. **Billigster
  Zugewinn im ganzen Block:** ein Parameter, der in `sway` einen Versatz addiert, der mit der Höhe
  wächst. (Partikel hat `wind` längst — die Ungleichheit ist historisch, nicht begründet.)
- **`breite` hat Minimum 0,1**, also 10 % der Bildbreite. Für ein Lagerfeuer passend, für einen
  Docht zu grob. Kleineres Minimum genügt; die Zungenbreite `tw = bw/n*1.6` skaliert automatisch mit.
- **Die Basis ist immer eine waagerechte Gerade.** Für eine Fackel egal (schmal genug ist ein Punkt),
  für Feuer an einer schrägen Kante nicht.

### 9a.2 Der gemeinsame Nenner: zwei Begriffe, die heute einer sind

Funken beim Feuer, Rauch über dem Docht, Tropfen am Wasserfall, Dusche, Schein ums Licht — das ist
**ein** fehlender Begriff, nicht sieben Wünsche. Bei Partikeln ist heute beides implizit „das ganze
Bild": wo sie entstehen und wo sie sein dürfen. Der Code verrät es — das Recycling ist ein Modulo
über die Leinwand:

```js
y = ((y0 + t*v) % Hn + Hn) % Hn;   x = ((x0 + gx + …) % Wn + Wn) % Wn;
```

Deshalb sind Partikel unvermeidlich vollflächig. Zu trennen ist:

| Begriff | was er sagt | Formen |
|---|---|---|
| **Quellfläche** | wo Teilchen geboren werden | Punkt (Docht) · Strecke (Wasserfall senkrecht, Dusche waagerecht) · Rechteck · Vollbild |
| **Sichtfeld** | wo sie zu sehen sein dürfen, mit **weichem** Rand | derselbe Gefälle-Regler, den der Scheinwerfer schon hat |

Der weiche Rand ist nicht Kosmetik: er ist der Unterschied zwischen „Funken nur über dem Feuer" und
„Funken in einem sichtbaren Kasten".

Dazu **Richtung plus Streuwinkel**, und dieselbe Beschreibung deckt alle Fälle ab: Funken steigen mit
breiter Streuung, Regen fällt eng gebündelt, Rauch steigt langsam und weitet sich, Schnee driftet.
Heute steckt das in jedem `e.art`-Zweig einzeln als fest verdrahtete Formel.

**Gebaut am 14.09.2026, und zwar nach Caspar_Ds eigener Fassung.** Drei Entwürfe, neun Gegenleser,
keiner trug. Die Fassung, die trägt, kam in fünf Sätzen aus dem Chat und ist an den Stellen besser,
an denen alle drei Entwürfe gescheitert sind:

| Begriff | Schlüssel | Herkunft |
|---|---|---|
| Quelle | `qForm` | neu: das ganze Bild · Punkt · Linie · Kreis · Ellipse |
| Ursprung, Winkel, Ort X/Y | `qUrsprung`, `qWinkel`, `qX`, `qY` | wörtlich der Raum-Block des Scheinwerfers |
| Ausdehnung (X/Y), Drehung | `qAus`, `qAusY`, `qDreh` | neu, aber nur im Block sichtbar |
| Auftrieb | `auftrieb` | neu: leichter, genauso schwer, schwerer als Luft |
| Druck, Richtung (°) | `druck`, `winkel` | `winkel` wie Streifen, Nachzieh, RGB |
| Fächer | `streuung` | wie der Laser, gleicher Trichter, gleiche Spanne 0…1 |
| Länge | `laenge` | wie Laserstrahl und Lichtstrahlen |
| Ausblenden | `ausblenden` | neu, fängt bei 0,1 an (Regel 16) |

**Warum der Auftrieb die eigentliche Lösung ist.** Die Gegenleser haben an allen drei Entwürfen
denselben tödlichen Befund gefunden: `lpV` rastet Geschwindigkeiten auf den Loop ein und ist als
`max(1, round(v·LOOP/weite))·weite/LOOP` geschrieben — es kann negative Werte gar nicht darstellen.
Heute steht das Vorzeichen deshalb außerhalb, fest verdrahtet je Art. Jede generische „Richtung in
Grad" schickt eine vorzeichenbehaftete Geschwindigkeit hinein und lässt Asche, Blasen, Staub und
Funken im Export nach unten fallen — im Pult unsichtbar, erst im fertigen Video. Der Auftrieb trennt
Betrag und Vorzeichen genau so, wie der Code es ohnehin tat.

**Das Sichtfeld ist kein zweiter Bereich.** Es ist der Korridor, den die Teilchen fliegen, und er
endet, indem sie ausgehen. Damit wird nie etwas Rechteckiges gezeichnet, und der „sichtbare Kasten"
aus §9a.2 ist nicht durch einen besseren Regler vermieden, sondern durch einen Regler weniger.

**Was offen bleibt:**
- `spreiz` bei den Lichtstrahlen meint denselben Trichter in Grad. Eine Übersetzung nach Regel 12,
  eigener Schritt, nicht in diesem Umbau.
- **Schwaden.** Caspar_D: *„Partikeleffekte: Teilchen oder Schwaden."* Der Rauch aus §9a.4 erbt
  diesen Block unverändert — Quelle, Auftrieb, Druck, Fächer, Länge — und unterscheidet sich nur
  darin, wie gezeichnet wird. Genau dafür steht der Block in der generischen Spalte.
- Der zurückgelegte Weg bleibt rund ein Achtel hinter der eingestellten Länge zurück, weil das
  letzte Stück im Ausblenden liegt. Gemessen: 0,25 → 0,22 · 0,70 → 0,62 · 1,40 → 0,87 (am Bildrand).

### 9a.3 Warum das billiger ist, als es aussieht — es ist dieselbe Änderung wie §6.8

Mit einer Quellfläche fällt das Modulo weg und wird durch **Lebensdauer** ersetzt: geboren an der
Quelle, lebt τ, wird neu geboren.

**Das ist exakt die Loop-Reparatur aus §6.8, Klasse 2** — Lebensdauer L/k mit gleichverteilten
Startzeiten, dann ist das Feld nach L identisch. Wer die Quellfläche baut, bekommt die Loopfähigkeit
geschenkt, und umgekehrt. **Der stärkste Grund, es überhaupt zu tun.**

### 9a.4 Zwei Fälle, die nicht in dieses Schema passen

**Rauch ist kein Partikel.** Über einem Docht ist er eine dünne, aufsteigende Fahne; als Punktwolke
sieht das aus wie Asche rückwärts. Der überzeugende Weg ist eine schmale Rauschsäule im Shader, also
näher an `flammen` als an `partikel`. **Eigener Effekt, kein Parameter.** (`rauch` fehlt in der
Art-Liste von `partikel` — zu Recht.)

**Nachtrag 14.09.2026 — die Quelle ist Bedingung, und Rauch ist ein Medium.** Caspar_D: *„dann
brauchen wir noch rauch, der von definierbaren Quellen aufsteigt, ähnlich die Partikeleffekte — so
ne art Theaternebel, aber von einer Quelle kommend konfigurierbar. Damit bspw Feuer auch Rauch
machen kann."* Das schärft den Punkt an zwei Stellen:

- **Er erbt die Quellfläche, nicht die Teilchen.** „Ähnlich die Partikeleffekte" heißt nicht, dass
  Rauch aus Punkten besteht, sondern dass er dieselben Wörter benutzt: Quellfläche, Richtung,
  Streuung, Sichtfeld. Das ist genau der Ertrag von §9a.5 — ein generischer Begriff bedeutet auf
  jeder Karte dasselbe. Eine Rauschsäule, deren Fuß auf der Quellfläche steht und die sich nach oben
  weitet, braucht keinen eigenen Wortschatz.
- **Er gehört zu den Medien, nicht zu den Selbstleuchtern.** Der Theaternebel trägt `medium:true`
  und liest den Licht-Puffer; wer `leuchtet` trägt, malt hinein. In der Registry steht heute
  `['licht','laser','strahlen','feuer','strobe']` als Leuchter — **das Feuer ist schon dabei.**
  Ein Rauch als Medium wird damit von dem Feuer beleuchtet, über dem er steht, ohne eine einzige
  Verbindung zwischen beiden Effekten: die Fahne über der Flamme glüht unten und wird nach oben
  kalt, weil das Licht nach oben ausgeht. Genau das meint **Regel 6** — der Rauch leuchtet nicht
  selbst, er wird beleuchtet. Als Selbstleuchter oder als Partikelwolke wäre dieser Gewinn weg.
  (`flammen` trägt `leuchtet` nicht und kann es auch nicht: der Licht-Puffer wird von den Malern
  gefüllt, nicht von den Shadern. Das ist eine eigene Lücke, die hier auffällt.)

Damit bleibt Rauch Punkt 5 der Reihenfolge, bekommt aber eine Bedingung dazu: **er wird erst gebaut,
wenn Quellfläche und Sichtfeld stehen**, weil er sie mitbenutzt statt sie zu kopieren.

**Entschieden und gebaut am 14.09.2026 — und zwar anders als hier steht.** Caspar_D: *„und rauch
kann sich genauso verhalten, nur das es schwaden statt teilchen sind."* Damit entfällt der eigene
Shader. **Schwaden ist eine Erscheinung des Partikeleffekts**, gleichberechtigt neben Schnee und
Asche, und erbt Quelle, Auftrieb, Druck, Fächer, Länge und Ausblenden unverändert. Der Einwand
oben („als Punktwolke sieht das aus wie Asche rückwärts") war richtig für *Punkte* und falsch für
das, was hier gezeichnet wird: drei weiche Lappen je Schwade, die mit dem Alter aufgehen.

Zwei Physikregeln machen daraus eine Fahne statt einer Wolke, beide ohne eigenen Regler:

- **Dünner beim Auffächern.** *„der rauch muß auch dünner werden, wenn er auffächert."* Eine Schwade
  trägt eine *Menge* Rauch, keine Deckkraft. Geht sie auf den g-fachen Radius auf, verteilt sich
  dieselbe Menge auf die g-fache Fläche im Quadrat. Ohne das wuchs die Fahne nach oben heller statt
  blasser: am Fuß 0,9 Graustufen Zuwachs je Zeile, im oberen Drittel 28,1. Danach 1,1 gegen 9,6.
- **Erst auskondensieren.** *„meist kondensiert auch erst etwas, also am Anfang dünn weil noch alles
  gasförmig, dann dicker, weil auskondensierend, dann verdünnend bei Auffächerung."* Die Menge
  sichtbaren Rauchs wächst über das erste Viertel des Lebens von null auf eins, die Fläche wächst
  die ganze Zeit. Die Dichte nimmt damit erst zu, dann ab; die dichteste Stelle liegt bei 25 % des
  Lebens, also ein Stück über der Quelle. Genau dort steht auch echter Rauch.

**Und der Rauch wird doch beleuchtet.** Ich hatte hier zuerst notiert, ein Maler könne kein Medium
sein, weil der Licht-Puffer von den Malern gefüllt und von den Shadern gelesen wird. Caspar_D:
*„häh, verstehe ich nicht, aber rauch muß vom feuer angeleuchtet werden können."* Der Einwand war
berechtigt, die Notiz war falsch: der Licht-Puffer ist eine **Leinwand**, und ein Maler kann sie
lesen wie jede andere. Gebaut in drei Griffen, denselben wie bei der Tiefenmaske:

1. Die Schwaden werden auf eine eigene Leinwand gemalt, nicht direkt ins Bild.
2. Der Licht-Puffer wird mit `destination-in` auf diese Leinwand beschnitten — damit ist er
   **Licht mal Rauchdichte**: wo viel Rauch steht, streut viel Licht, wo dünner Rauch steht weniger,
   wo keiner steht gar keins. Das ist Regel 6 in zwei Zeilen Leinwandarbeit.
3. Das Ergebnis kommt additiv auf die Rauchleinwand, und die geht als Ganzes ins Bild.

Dazu eine kleine Verallgemeinerung: **`medium` darf eine Frage an den Effekt sein statt einer festen
Marke.** Der Theaternebel ist immer ein Medium, die Partikel nur, solange sie Schwaden sind — als
Schnee wäre der Licht-Puffer reine Rechenzeit.

**Gemessen** mit einem Scheinwerfer mitten in der Fahne, Beitrag des Rauchs in Graustufen:

| Band | im Kegel | ohne Scheinwerfer | Gewinn |
|---|---|---|---|
| y 0,55–0,65 (Kern) | 32,8 | 2,3 | **30,4** |
| y 0,45–0,55 | 30,0 | 4,3 | 25,8 |
| y 0,35–0,45 (außerhalb) | 9,5 | 9,0 | 0,5 |

Der Rauch leuchtet also genau dort auf, wo Licht auf ihn fällt, und sonst nirgends.

**Ein Befund nebenbei, der bleibt:** das Feuer strahlt in den Licht-Puffer nur dort, wo seine
Flammen selbst stehen — es hat keinen Schein darüber hinaus. Rauch über dem Feuer bekommt von ihm
deshalb wenig ab; die Arbeit macht der kleine Scheinwerfer aus der Vorlage „Feuer mit Schein". Ob
das Feuer einen weicheren Schein in den Puffer malen sollte als auf das Bild, ist eine eigene Frage.

**„Schein nur ums Feuer" ist bereits gebaut.** Das ist der Scheinwerfer aus dem Raum-Block, klein
gestellt, mit Farbig abwedeln — **Regel 5** gilt, er hellt auf, was da ist. Der Antrieb aus dem
Lichtmischpult lässt ihn mit dem Feuer flackern. Kein neuer Parameter nötig, sondern ein **Preset,
das Feuer und Schein koppelt.** Das ist der erste Handgriff, weil er sofort funktioniert.

### 9a.5 Die Karte wird zweispaltig — spezifisch links, generisch rechts

Hier stand zuerst ein **Vorbehalt**: Feuer hat elf Parameter, die Quellfläche verdoppelt das, und
beim Lauf (§8, Frage 5) steht die Warnung, das Studio dürfe nicht heimlich ein Schnittprogramm
werden. Caspar_D hat den Einwand am 12.09. berichtigt, und die Berichtigung ist besser als der
Einwand:

> „Wenn das alles so sortiert wird, dass das, was ich brauche, immer dort ist, wo ich es suche, ist
> das überhaupt kein Problem. Schnittprogramme haben das Problem, dass generische Sachen irgendwo
> zentral stehen und nur die spezifischen an den Filtern … wir schreiben immer alles an jeden
> Effekt, nur sortiert nach spezifisch und generisch — ich muss mir nicht merken, wo was steht, was
> gerade für den Neuling nervenaufreibend ist, weil ständige Sucherei."

**Das Problem ist nicht die Anzahl, sondern die Verortung.** Ein Schnittprogramm ist nicht deshalb
unbedienbar, weil es zweihundert Parameter hat, sondern weil sie über Inspektor, Effektpanel,
Zeitleiste und Projekteinstellungen verstreut sind und man raten muss, wo ein Ding wohnt. Die Regel
dagegen heißt **Lokalität: alles, was diesen Effekt betrifft, steht auf dieser Karte. Nichts zeigt
woandershin.** Aus dem Vorbehalt wird damit eine Gestaltungsregel.

**Die Form: zwei Spalten** (Caspar_D, 12.09.: *„ggf. machen wir die Parameter zweispaltig,
spezifisch links, generisch rechts — zuklappen würde ich nicht"*).

| | |
|---|---|
| **links — spezifisch** | was nur dieser Effekt hat: Höhe, Glut, Flackern, Farbe unten/oben … |
| **rechts — generisch** | was viele haben: Quellfläche, Sichtfeld, Wind, Antrieb, Verrechnung, Stärke |

Die Spalte trägt die Bedeutung selbst: *links ist dieser Effekt, rechts ist das System.* Das muss
niemand lernen, das sieht man — eine beschriftete Trennlinie in einer Liste sagt dasselbe, aber man
muss sie lesen.

**Kein Zuklappen**, und das ist konsistent mit **Regel 10**: ein ausgeblendeter Regler ist nicht
abgeschaltet, der Wert bleibt stehen und wird weitergereicht (daran zog der Nebel bei „Absaugung:
keine" trotzdem zur Bildmitte). Eine zugeklappte Gruppe ist dieselbe Falle, nur größer.

**Drei Punkte, die über gut und ärgerlich entscheiden:**

- **Die rechte Spalte hat über alle Karten dieselbe Reihenfolge.** Sonst ist der Gewinn weg — der
  Sinn ist, dass der Blick nach zwei Karten weiß, wo Wind steht. Was ein Effekt nicht hat, lässt die
  Zeile frei oder überspringt sie; die Ordnung bleibt. **Verrechnung und Stärke ans Ende der rechten
  Spalte**, weil sie zuletzt wirken — Regel 1 sagt das fachlich, die Anordnung sagt es dann auch
  räumlich.
- **Ungleiche Spaltenhöhen.** Feuer hat zehn spezifische Parameter, Scanlines zwei. Links lang /
  rechts kurz ist unproblematisch; andersherum sieht es aus, als fehle etwas. Nicht wegzudesignen —
  oben bündig stehen lassen, Rest leer.
- **Schmales Pult.** Zwei Spalten mit Beschriftung und Schieberegler brauchen Breite. Unter einer
  Schwelle ist der saubere Rückfall **nicht Zuklappen, sondern Stapeln**: erst links, dann rechts,
  Trennlinie dazwischen, gleiche Reihenfolge.

**Was das erzwingt — eine Schärfung von Regel 10a.** Ein generischer Parameter muss überall
*dasselbe* bedeuten und gleich heißen. Wind bei Partikeln ist eine Driftgeschwindigkeit, Wind bei
Feuer wäre ein höhenabhängiger Zug; wenn beide „Wind" heißen und an derselben Stelle stehen, müssen
sie sich auch gleich anfühlen. Sonst ist die Lokalität erkauft und die Verlässlichkeit verspielt.
**Das ist die eigentliche Arbeit an diesem Block, nicht das Umsortieren.**

**Der größere Ertrag nebenbei:** Sobald die rechte Spalte für alle Effekte gleich aussieht, fällt
jede Ungleichheit auf. Warum hat Partikel Wind und Feuer nicht? Warum hat nur der Nebel eine
Absaugung? **Die Spalte ist damit auch ein Prüfwerkzeug für die Bibliothek** — und die erste Lücke,
die sie zeigt, ist genau die aus §9a.1.

**Was vom Vorbehalt bleibt:** die Quellfläche nicht als sieben Einzelregler bauen, sondern als
**Auswahl mit drei Formen und zwei Reglern je Form**, Vorgabe **„Vollbild"** — damit alles
Bestehende unverändert weiterläuft und Regel 12 (Ablagen werden übersetzt, nie stillschweigend
anders gelesen) ohne Umstände erfüllt ist.

### 9a.6 Reihenfolge in diesem Block

1. **Wind für Feuer und Flammen** — ein Parameter, sofort nützlich.
2. **`breite`-Minimum senken** — eine Zahl.
3. **Preset „Feuer mit Schein"** — koppelt Vorhandenes, kein neuer Code.
4. **Quellfläche und Sichtfeld** — zusammen mit der Loop-Reparatur §6.8 Klasse 2, nicht getrennt.
5. **Rauchfahne** als eigener Shader-Effekt — zuletzt, weil sie Quellfläche und Sichtfeld
   mitbenutzt (Nachtrag in §9a.4), und als **Medium**, damit das Feuer sie beleuchtet.

Die **Zweispaltigkeit (9a.5)** läuft quer dazu: sie ist keine Stufe in dieser Liste, sondern die
Form, in der Punkt 4 überhaupt erst in die Karte passt. Sinnvoll also **mit** Punkt 4, nicht danach.

## 9b · Lichtstrahlen und Laserstrahlen (12.09.2026, am Code nachgesehen)

Caspar_D: *„Lichtstrahlen soll Licht simulieren, das durch Bäume, Wolken oder Wasser fällt, es sieht
aber eher wie eine Schablone als wie echtes Licht aus"* — und zum Laser: *„die reagieren mir noch zu
starr, als Fächer einzelner Strahlen; Laserstrahlfächer sind doch eigentlich immer der gleiche Strahl,
massiv und schnell aufgefächert durch Spiegel … ferner können die ja auch zufällig zu diskreten
Positionen im Fächer springen, hier brauchen wir mehr Steuerung, auch des Takts."*

Beides stimmt, und beide Male steckt die Ursache in einer Zeile.

### 9b.1 Warum die Lichtstrahlen wie eine Schablone aussehen

Vier Befunde, absteigend nach Gewicht.

**1 · Der Strahl hat keine weichen Ränder — gar keine.** Der Maler zeichnet ein Dreieck und füllt es
mit einem Farbverlauf, der vom Scheitel nach außen läuft:

```js
const gr = cx.createRadialGradient(px,py,0, px,py,L);
cx.beginPath(); cx.moveTo(px,py); cx.lineTo(…); cx.lineTo(…); cx.closePath(); cx.fill();
```

Der Verlauf ändert sich mit dem **Abstand vom Scheitel**, also *längs* des Strahls. **Quer** zum
Strahl ist die Deckkraft konstant — die Flanke ist ein sauberer geometrischer Schnitt mit Deckkraft
0,55 auf der einen und 0 auf der anderen Seite. Das ist die Schablone. Echtes Streulicht hat quer zur
Achse einen weichen Abfall; die Kante ist das Erste, was das Auge als „ausgeschnitten" liest.

**Billigste Abhilfe:** `cx.filter = 'blur(Npx)'` vor dem Füllen, N proportional zur Strahlbreite.
Sauberer: ein zweiter, linearer Verlauf **quer** zur Achse mit Spitze in der Mitte — dann sind Länge
und Breite unabhängig einstellbar.

**2 · Das Muster ist erfunden, nicht geschattet.** Die Strahlen sitzen bei `i/(n−1)−0.5` also **exakt
gleichmäßig** im Fächer; `hs(i)` streut nur Breite und Deckkraft, nicht die Lage. Ein Fächer mit
gleichem Abstand ist ein Fächer. Echte Wolkenstrahlen sind der **Schattenwurf eines unregelmäßigen
Verdeckers** — Blattwerk, Wolkenkante, Wellengang: geklumpt, ungleich breit, mit Lücken. Die
Abhilfe ist fast gratis, weil `hs(i)` schon existiert: **dieselbe Streuung auch auf die Winkellage
anwenden.** Das allein verwandelt den Fächer in Blattwerk.

**3 · Am Scheitel stapelt sich die Deckkraft.** Alle n Dreiecke laufen im selben Punkt zusammen, und
der Verlauf ist dort am hellsten. Mit `screen` addiert sich das zu einer Nabe. Fällt heute selten auf,
weil der Vorgabepunkt mit `py = −0.2` über dem Bild liegt — aber innerhalb des Bildes wird es
sichtbar. Abhilfe: den Verlauf erst ab einem Innenradius beginnen lassen, wie es der Laser mit seinem
Kommentar zum Ansatz schon richtig macht.

**4 · Der Strahl weiß nichts vom Bild.** Er wird über alles gemalt. Das ist der Punkt, an dem **Regel
5** dem Effekt widerspricht: *wo Licht ist, muss etwas sein, das beleuchtet wird.*

### 9b.2 Der eigentliche Weg: Gottesstrahlen aus dem Bild statt über das Bild

Steht als Notiz schon in NAECHSTER_CHAT.md und gehört hierher gezogen: **helle Stellen des Bildes
auslesen (Bright-Pass), dann radial vom Lichtpunkt nach außen verwischen** (GPU Gems 3, Kenny
Mitchell). Dann ist das Strahlenmuster **der Bildinhalt selbst** — die Lücken zwischen den Blättern
stehen im Cover, man muss sie nicht erfinden. Das ist Regel 5 nicht nur erfüllt, sondern gebaut.
`u_licht` ist bereits die Lichtquellenkarte.

**Und mit der Tiefenkarte (§9.7) wird es das, was die Schablone nie sein kann:** ein Strahl, der
*hinter* der Figur verläuft und von ihr verdeckt wird. Erst die Verdeckung macht aus einer Auflage
einen Raum.

**Der bekannte Haken, und der Plan hat die Antwort schon:** ~100 Abtastungen je Bildpunkt — die
Größenordnung, die die Scheinwerferblenden lahmgelegt hat (Regel 14). Mit dem bildweisen Export aus
**§4** entkoppelt sich Rechenzeit von Echtzeit, und **eine Qualitätsstufe je Effekt (live/Export)**
ist dort ohnehin vorgesehen. Live grobe Abtastung, im Export die volle. Herkunft und Lizenz des
Ansatzes vorher klären.

**Reihenfolge hier:** Die vier Befunde aus 9b.1 sind Stunden und verbessern den vorhandenen Effekt
sofort. Die Gottesstrahlen sind ein **eigener, neuer** Effekt und ersetzen ihn nicht — ein weicher,
gemalter Schacht ist etwas anderes als ein aus dem Bild gerechneter.

### 9b.3 Laser: es gibt zwei Bauarten, das Studio kennt nur eine

Caspar_Ds physikalischer Einwand trifft, und die Auflösung ist: **beide Fächer sind echt, sie kommen
aus verschiedener Hardware.**

| Bauart | was man sieht | im Studio |
|---|---|---|
| **Gitter** (Strahlteiler) | ein Strahl wird in viele **gleichzeitig bestehende** Teilstrahlen zerlegt — fester Fächer, alle Positionen dauernd besetzt | **das ist der gebaute Effekt** |
| **Scanner** (Galvospiegel) | **ein** Strahl, schnell abgelenkt; was man sieht, ist Nachleuchten. Helligkeit ∝ Verweildauer, Austastung zwischen den Positionen | **fehlt** |

Der Maler setzt heute `ang = dir + (i/(n−1) − 0.5)*spread` — n feste, gleichverteilte Positionen, alle
dauernd an. Das ist sauber gebauter **Gitter**-Laser. Was fehlt, ist der Scanner, und mit ihm alles,
was Caspar_D beschreibt.

**Was der Scanner-Modus braucht:**

- **Sweep.** Ein Strahl, Position = f(t). Der sichtbare Fächer ist die Spur: innerhalb eines Bildes an
  einigen Dutzend Zwischenpositionen mit kleiner Deckkraft zeichnen. Bewegungsunschärfe entlang der
  Bahn — Dutzende Striche, nicht 100 Abtastungen je Bildpunkt, also **live bezahlbar**.
- **Verweilhelligkeit fällt gratis ab.** Tastet man die Bahn *gleichmäßig in der Zeit* ab, landen
  automatisch mehr Zwischenpositionen dort, wo der Spiegel langsam ist — an den Umkehrpunkten. Genau
  das macht echte Laserfächer an den Rändern heller. **Wer es richtig implementiert, bekommt es
  umsonst.**
- **Austastung.** Strahl aus auf einem Teil der Bahn — dadurch werden aus dem Sweep diskrete Strahlen,
  die zu springen scheinen. Das ist der Unterschied zwischen Bühnenlaser und Taschenlampe.
- **Diskrete Sprünge.** K erlaubte Winkel, je Schlag einer davon gewählt. Caspar_Ds *„zufällig zu
  diskreten Positionen im Fächer springen"*.
- **Flimmern gehört umgebaut.** Heute ein Sinus auf der Helligkeit
  (`1−flimmer*(0.5+0.5*sin(…))`) — weich und gleichmäßig. Ein Laser flimmert nicht sinusförmig, er
  **tastet aus**: an oder aus, hart. Das ist derselbe Regler mit anderer Kurve.

### 9b.4 Der Takt — und warum das fast nichts kostet

Caspar_D will Steuerung *„auch des Takts"*. Der Antrieb kann das schon fast: `antriebWert` rechnet
intern längst mit `idx` (**welcher Schlag**) und `p` (**Phase innerhalb des Schlags**), gibt aber nur
einen **Helligkeitsfaktor** zurück.

> **Der ganze Umbau: idx und p mit herausgeben.** Dann wird aus dem Lichtmischpult eine
> **Positions**quelle, nicht nur eine Helligkeitsquelle.

Damit fällt sofort ab: `idx` als Saat für die Winkelwahl → **je Schlag ein neuer, aber reproduzierbarer
Winkel** (reproduzierbar ist wichtig, sonst loopt es nicht). `p` steuert Austastung und Verweildauer
innerhalb des Schlags. Und der Teiler des Antriebs wird zur Sprungrate — jede Eins, jeder zweite
Schlag, jeder achte.

**Das ist der ertragreichste Einzelgriff in diesem Abschnitt**, weil er nicht nur dem Laser hilft: jeder
Effekt, der etwas *positionieren* statt nur *aufhellen* will, hängt danach am selben Pult. Im
Zehnsekünder gilt die eigene Uhr (§1): dort keine Schlagquelle, sondern die feste Frequenz, auf ein
ganzes Vielfaches von 1/L eingerastet.

### 9b.5 Zwei Kleinigkeiten, die den Laser echt machen

**Der Strahl endet nirgends.** Er läuft bis `len` und verläuft. Ein echter Strahl macht einen **hellen
Punkt**, wo er auf etwas trifft. Ohne Tiefenkarte ein Parameter (Auftreffpunkt), mit Tiefenkarte
rechenbar.

**Laser braucht Nebel.** Ein Strahl ist in klarer Luft auf seiner Länge unsichtbar — man sieht nur den
Auftreffpunkt. Genau deshalb laufen auf Bühnen Nebelmaschinen. Die Sichtbarkeit längs des Strahls
sollte an der Nebeldichte hängen, und **„Laser mit Nebel" ist ein Preset**, dieselbe Art Kopplung wie
„Feuer mit Schein" (§9a.4) — vorhandene Effekte aneinandergehängt, kein neuer Code.

### 9b.6 Reihenfolge in diesem Block

1. **Weiche Flanken bei Lichtstrahlen** — eine Zeile `filter`, größter sichtbarer Sprung.
2. **Winkellage streuen** statt gleichverteilen — `hs(i)` liegt schon da.
3. **Austastung statt Sinus** beim Laser-Flimmern — dieselbe Zahl, andere Kurve.
4. **`idx` und `p` aus dem Antrieb herausgeben** — der Hebel für alles Weitere.
5. **Scanner-Modus** als zweite Bauart neben dem Gitter (Auswahl, nicht Ersatz).
6. **Presets** „Laser mit Nebel", Auftreffpunkt.
7. **Gottesstrahlen** als eigener Effekt — nach §4, mit Qualitätsstufe.

---

## 9c · Der Raum wird dreidimensional (12.09.2026)

Caspar_D: *„momentan schwenken die zweidimensional, die müssten dann aber über kurz oder lang 3D
schwenken."*

**Nachgesehen:** Ursprung und Ziel des Raum-Blocks sind beide **Bildkoordinaten** — `rmUx`/`rmUy` und
`rmZx`/`rmZy`. „Ellipse (schräger Einfall)" und „Kegel von außen" sind 2D-Nachbauten von 3D, und
`rmStreckung` ist eine Zahl, die man einstellt, statt einer, die sich ergibt.

### 9c.1 Das Argument ist weniger Regler, nicht mehr Möglichkeiten

Mit Gerät bei (x, y, z) und Richtung als Pan/Tilt fällt alles von selbst an:

| heute eingestellt | mit 3D gerechnet |
|---|---|
| `rmStreckung` (Ellipse) | ergibt sich aus dem Einfallswinkel |
| `rmGroesse` fest | wächst mit der Wurfweite |
| Helligkeit konstant | fällt mit 1/r² |
| Fleck läuft gleichförmig | **läuft in der Mitte schnell, am Rand langsam** |

**Die Bahn ist das Entscheidende.** Ein Moving Head schwenkt mit gleichmäßiger
Winkelgeschwindigkeit; auf einer ebenen Fläche läuft der Fleck dann in der Mitte schnell und an den
Rändern langsam und wird dabei größer und dunkler. Das ist die Signatur eines echten Geräts, und 2D
kann sie nicht nachmachen — dort verschiebt sich ein Fleck, statt dass ein Scheinwerfer schwenkt.

### 9c.2 Die saubere Form: projektive Texturabbildung

Das Licht bekommt eine Sicht- und eine Projektionsmatrix. Jeder Bildpunkt wird mit seiner Tiefe in
den Lichtraum transformiert — **das gibt Gobo-Koordinate und Entfernung in einem**. Eine
Matrixmultiplikation je Bildpunkt, billiger als die heutige Blendenmaske.

Zwei Folgen: Die Blende wird ein **echt projiziertes Gobo** statt eines gedrehten Musters. Und mit
der Tiefenkarte (§9.7) legt sich der Fleck **über** die Figur, statt über sie hinwegzulaufen.

**Laser:** dasselbe — Ursprung und Richtung dreidimensional, sichtbar über die Nebeldichte (§9b.5),
endend auf der Tiefenfläche.

**Lichtstrahlen brauchen 3D am wenigsten.** Eine ferne Sonne ist als radiale Quelle im Bildraum
korrekt modelliert; der Gottesstrahlen-Ansatz (§9b.2) ist dort der richtige Weg, nicht ein Raum.

**Abhängigkeit:** 9c ist ohne Tiefenkarte machbar (ebene Projektionsfläche), wird aber erst mit ihr
das, was es sein soll. Reihenfolge: nach §9.7.

---

## 9d · Bühnenreife — was zu prüfen ist und wie (12.09.2026)

Caspar_Ds Hauptfrage: *„was ist an den einzelnen Effekten zu tun, um sie bühnenreif zu bekommen?"*

### 9d.1 Der größte Befund ist eine Zahl

**Nachgesehen in `web/index.html` (Zeilen 26860–26864):**

| | angehängt an | von 37 |
|---|---|---|
| **Antrieb (Lichtmischpult)** | licht, schatten, laser, strahlen, feuer, flammen, kaustik, bloom, strobe | **9** |
| **Raum-Block** | licht, schatten | **2** |

**Achtundzwanzig Effekte können auf den Takt gar nicht reagieren.** Nebel, Partikel, Wellen, Risse,
Glitch-Blöcke, Scanlines, Verwackeln, Bildlauf, Beschlag, Tropfen — alles läuft auf eigener Uhr und
weiß nichts vom Lied.

> Für ein Musikvideo ist das die **größte Einzellücke**, größer als jeder Detailmangel an einzelnen
> Effekten. Und die billigste: die Parameter werden zentral angehängt (`lmParams`), die Anwendung
> steht zentral in einer Zeile (~27698).

Der Aufwand liegt nicht im Anhängen, sondern in der Entscheidung **je Effekt, was der Antrieb
moduliert** — bei Nebel die Dichte, bei Partikeln die Rate, bei Rissen das Auslösen. Das ist eine
Zeile Nachdenken je Effekt, keine Zeile Code.

**Nachtrag 14.09.2026 — die Pulse zuerst, und dort ist es kein Anhängen, sondern ein Austausch.**
Caspar_D: *„demnächst will ich dann noch die ganzen pulseffekte mit den lfo steuerungen der
lichteffekte ausstatten."* Die acht Pulse (Helligkeit, Zoom, Schärfe, Kontrast, Sättigung, RGB,
Farbton, Kippen) sind der Sonderfall in der Tabelle oben: sie stehen nicht antrieblos da, sie haben
einen **eigenen, älteren Antrieb** — `antrieb` mit zwei Werten (im Takt / atmend), dazu `atempo` und
`invert`. Das Lichtmischpult kann alles davon und mehr: Quelle (Schläge, Taktanfang, zufällige
Schläge, freie Frequenz), Form der Kurve, Teiler, Tiefe, Versatz, Invers, Sequenzer.

Das ist damit **kein Anhängen, sondern ein Ersetzen** — und fällt unter **Regel 12**: die
gespeicherte Ablage wird übersetzt, nicht stillschweigend anders gelesen. Die Übersetzung ist klein
und muss vorher aufgeschrieben werden:

| alt | neu |
|---|---|
| `antrieb:'takt'` | `lmQuelle:'takt'`, `lmForm:'rampe_ab'`, `lmTeiler:1` |
| `antrieb:'atem'`, `atempo:s` | `lmQuelle:'hz'`, `lmHz:1/s`, `lmForm:'sinus'` |
| `invert:1` | `lmInvers:1` |

Danach zeigt die rechte Spalte auf **allen** Karten dasselbe Antriebsfeld, und die Ungleichheit, die
§9a.5 sichtbar macht, ist an dieser Stelle erledigt. Zu prüfen bleibt, ob „atmend" mit Sinus bei
gleicher Periode wirklich gleich aussieht — sonst ist die Übersetzung falsch und braucht eine
eigene Kurvenform.

**Gebaut am 14.09.2026, und die Übersetzungstabelle oben war an zwei Stellen falsch.**

- **`invert` wandert NICHT auf `lmInvers`.** Bei den Pulsen ist „invertieren" keine umgekehrte
  Kurve, sondern eine andere Wirkung: dunkler statt heller, 1/Sättigung statt Sättigung, gedreht
  ruhen statt gedreht schlagen. Ein Wort, ein Ding (Regel 10a) — es bleibt ein eigener Schalter in
  der linken Spalte. Mit auf das Pult gehen dagegen `abkling` (→ `lmAbkling`, Muster „An, dann
  Rampe ab") und `nurEins` (→ Quelle „auf der Eins").
- **Dem Pult fehlte nicht die Kurve, sondern die Langsamkeit.** Caspar_D: *„wieso konnte das pult
  den atem nicht, wir konnten kurven zuweisen, insbesondere die Sinuskurve — und die ist nichts
  anderes als Atem."* Richtig: die Form war immer da. Was fehlte, war der Bereich. „pro Sekunde" fing bei 0,5 an, ein Atemzug von vier
  Sekunden braucht 0,25 und der langsamste alte Atem von zwölf Sekunden 0,083. Die Übersetzung hätte
  jeden alten Atemzug bis auf das Sechsfache beschleunigt. Der Regler reicht jetzt bis 0,05 hinunter,
  also bis zu einem Zug in zwanzig Sekunden. Das ist keine Anpassung an die Vergangenheit, sondern
  eine Lücke, die erst beim Zusammenführen sichtbar wurde.

**Regel 2 beim Zusammenführen.** Die „Tiefe" des Pults wäre bei einem Puls ein zweiter Wucht-Regler
und damit ein reines Produkt aus zwei Deckkräften. Der Puls liest deshalb die **rohe** Kurve, und die
Tiefe-Zeile bleibt auf seiner Karte weg (`lmOhneTiefe`). Bei Scheinwerfern und Flammen bedeutet sie
etwas und steht weiter da.

**Was sich am Bild ändert, und es ist nicht nichts.** Der alte Takt-Antrieb summierte abklingende
Stöße mehrerer Schläge auf (`pulswert`, gedeckelt bei 1,5); das Pult rechnet aus der Phase im
Schlagabstand. Bei dichten Passagen stapelt sich also nichts mehr, und die Kurve ist eine Potenz
statt einer Exponentialfunktion. Gemessen an „Helligkeit schlägt", Wucht 0,45, Spanne der
Bildhelligkeit über 60 Bilder:

| Einstellung | Schnitt | Spanne |
|---|---|---|
| im Takt, Abklingen 1,8 | 36,8 | 9,8 |
| Abklingen 0,4 (lang) | 40,4 | 9,7 |
| Abklingen 3,6 (kurz) | 35,8 | 9,9 |
| Antrieb stetig | 43,4 | 0 |

Der Regler wirkt über seinen ganzen Weg (Regel 9), und „stetig" ist neu: ein Puls, der einfach
anbleibt, war vorher nicht einstellbar.

**Berichtigt am selben Tag, auf Einspruch.** Caspar_D: *„Die Tiefe geht im Pult über die
Kurvenamplitude, die Wucht ist eigentlich damit komplett abgedeckt, dachte ich … statt einer lokalen
Helligkeitskomponente wie bei Scheinwerfern, Lasern handelt es sich bei den Puls-Effekten um
bildglobale Effekte, die man ganz genauso steuern kann."* Richtig, und meine Begründung fürs
Ausblenden war falsch. Das Pult gibt `(1 − Tiefe) + Tiefe · Kurve` zurück:

- die **Wucht** setzt die Decke auf dem Schlag,
- die **Tiefe** setzt den Boden dazwischen.

Kein Produkt, sondern zwei Enden derselben Kurve — genau wie Stärke und Tiefe am Scheinwerfer. Die
Zeile steht damit auf jeder Pulskarte, und bei Tiefe 1 kommt heraus, was vorher lief.

**Ein Produkt gab es trotzdem, nur woanders.** Caspar_D: *„was soll der Unterschied zwischen Wucht
und Stärke überhaupt sein? Das ist doch dasselbe, nur als Produkt, sinnvoll ist das nicht."*
Nachgerechnet, Effekt für Effekt:

| Effekt | zweiter Regler | ist es ein Produkt mit der Stärke? |
|---|---|---|
| Helligkeit | Wucht | **ja**, das Ergebnis ist `Bild · (1 + Stärke · 1,2 · Wucht)` |
| Sättigung | Sättigung | **ja**, `saturate(1 + Stärke · (s − 1))`, exakt |
| Schärfe | Weichheit (px) | nein, die Stärke mischt ein weichgezeichnetes Bild dazu |
| Kontrast | Gradationskurve | nein, die Stärke mischt ein neu graduiertes Bild dazu |
| Farbton | Winkel | nein, die Stärke mischt ein farbverdrehtes Bild dazu |
| Farbkanal | Versatz, Richtung | nein, die Stärke mischt das verschobene Bild dazu |
| Zoom, Kippen | Wucht, Neigung | war schon gefaltet, beide haben gar keine Stärke |

Bei den ersten beiden ist die Stärke gefallen und wird beim Laden in den eigenen Regler gefaltet
(Regel 2 und Regel 12). Bei den vier anderen bleibt sie, weil sie dort etwas anderes tut als der
zweite Regler: sie sagt, **wie viel** von einem anderen Bild dazukommt, nicht **wie stark** dieses
Bild ist.

**Ein Fehler, den der Umbau selbst erzeugt hat.** Die Kette legt bei Effekten der Art `post`/`gl`
zusätzlich `antriebWert` auf die Deckkraft der Ebene. Sobald die Pulse Pult-Parameter hatten, griff
das auch bei ihnen — beim Farbkanal-Puls lag die Hüllkurve dadurch zweimal drin, einmal im Versatz
und einmal in der Deckkraft. Gefunden beim Nachlesen derselben Stunde, behoben mit der vorhandenen
Marke `lmNurSchub`: die Pulse lesen den Antrieb selbst.

### 9d.2 Woran sich Bühnenreife messen lässt

Aus dem Regelwerk und den heutigen Befunden, **messbar**:

| Prüfung | Regel | wer fiel heute durch |
|---|---|---|
| Jeder Regler wirkt über seinen ganzen Weg | 9 | Fahrt (`tempo` im Loop tot) |
| Die Vorgabe ist sichtbar | — | Fahrt (4,8 % der Breite) |
| Die Beschreibung stimmt mit der Wirkung | 11 | Fahrt („und zoomt"), Nebel (Entsättigung) |
| Der Effekt loopt bei L ≤ 10 s | §6.8 | vier Shader, Nachzieh — Rest ungeprüft |
| Der Effekt hängt am Antrieb | §9d.1 | **28 von 37** |

Und **nicht messbar** — dafür gibt es keinen Test, nur das Auge:

- harte Kanten, wo Licht weich sein müsste (Lichtstrahlen)
- erfundene Regelmäßigkeit, wo die Natur klumpt (Lichtstrahlen, Fächer statt Blattwerk)
- fehlender Bezug zum Bild (Regel 5)
- physikalisch falsch statt nur schematisch (Nebel als Kopie statt als Dämpfung)

### 9d.3 Das Vorgehen: zwei Hälften, zwei Werkzeuge

1. **Messreihe, um zwei Spalten erweitert** — Regler-Durchlauf über den ganzen Weg (nicht nur
   min/max) und Loop-Check (§6.8). Ein Lauf von Minuten, und er wird zum Regressionslauf (§10).
2. **Kontaktbogen über alle 37** — ein Clip je Effekt, hintereinanderweg angesehen. Dieselbe Methode
   wie beim Cover-Kontaktbogen (§9.6). Danach ist in einer halben Stunde klar, wo es klemmt, statt es
   aus dem Code zu erschließen.

**Warum nicht raten:** Heute wurden sechs Effekte nachgesehen — Fahrt, Lichtstrahlen, Laser, Feuer,
Flammen, Nebel, dazu Partikel strukturell. **Alle sechs hatten etwas.** Die Trefferquote spricht
dafür, dass in den übrigen einunddreißig ähnlich viel liegt. Das ist eine Vermutung, keine Messung —
und genau deshalb der Kontaktbogen.

---

## 10 · Kleines, das vorher heraus sollte

- **Nebel-Entsättigung.** `web/index.html` ~Zeile 27368: `mix(vec3(lum),um,0.6)` entsättigt die
  Umgebung um 40 %, während der Kommentar das Gegenteil behauptet. **Nur die Entsättigung hier
  herausnehmen** — die richtige Rechnung (dämpfen plus Luftlicht) steht in §9.7a und wartet auf die
  Tiefenkarte; beides nicht vermischen.
- **noise4D für die vier Shader.** `web/fremd/webgl-noise/noise4D.glsl` liegt bereit: vier
  Dimensionen lassen die Zeit auf einem Kreis laufen, das Feld ist nach einer Umdrehung exakt
  dasselbe. Damit loopen Wellen, Kaustik, Dunst und Flammen.
- **Dosierung an der Bildhelligkeit** als Vorgabe in der Vorbereitung — der offene Punkt der dunklen
  Cover („Lea Moreau", Helligkeit 0,36, Bewegung unter der Grundlinie).
- **Die Messreihe als Regressionslauf** mit **zwei Spalten** — Wirkung (Tiefen-Check 10.09.) und
  Loopfähigkeit (§6.8) —, damit die Grundlinie nicht stillschweigend kippt.

---

## 11 · Reihenfolge

**9.1 → 10 → 9a(1-3)+9b(1-4) → 6.8+9a.4 → 4 → 9.2-9.5 → 5 → 3 → 7 → 6 → 9.6-9.7+9b(5-7) → 8a → 8**

1. **§9.1 Die drei Fahrt-Befunde** — ganz nach vorn. Sie betreffen einen Effekt, der heute benutzt
   wird und nicht tut, was draufsteht; das ist unabhängig von jedem Videovorhaben.
2. **§10 Kleines** — billig, hält die Grundlinie sauber.
3. **§9a.6 Punkte 1–3 und §9b.6 Punkte 1–4** — Wind für Feuer und Flammen, `breite`-Minimum, Preset
   „Feuer mit Schein"; weiche Flanken bei Lichtstrahlen, gestreute Winkellage, Austastung statt Sinus,
   **`idx` und `p` aus dem Antrieb**. Sieben Handgriffe, alle sofort nützlich und unabhängig von allem
   anderen. Der letzte ist der Hebel für §9b.5.
4. **§6.8 Loop-Check + §9a.4 Quellfläche** — **zusammen**, nicht getrennt: die Lebensdauer-Umstellung
   ist dieselbe Änderung. Noch vor dem Export, denn die zwei Registry-Spalten sind Eingabe für §3 und
   die Reparaturen der Klasse 2 überschneiden sich mit §10 (noise4D).
5. **§4 Bildweiser Export** — alles Weitere steht darauf.
6. **§9.2–9.5 Ken Burns als Effekt** — Bahn, normierte Koordinaten, geometrischer Zoom, Pendel für
   den Loop. **Ohne Zielerkennung**, Ziel von Hand oder Bildmitte. Größter Effekt je Aufwand.
7. **§5 Abschnitte aus drei Quellen** — Voraussetzung für Typisierung *und* Gewichte.
8. **§3 Optimierung (L, n, φ)** — braucht die Gewichte aus §5 und die Grenzen aus §6.8.
9. **§7 Lange Videos** — abschnittsweise Zuordnung wird hier zur Regie; das **Hook-Video fällt
   danach fast gratis ab**, es ist nur ein Schnitt auf derselben Zeitachse.
10. **§6 Übergänge** — braucht den linearen Dekodierweg aus §4.
11. **§9.6–9.7 Zielerkennung und Tiefenkarte, dazu §9b.5–7** — erst nach dem Kontaktbogen, und die
    Tiefenkarte erst, wenn sie als Grundkanal gewollt ist; sie speist dann auch Licht, Schatten, Nebel,
    den Auftreffpunkt des Lasers und die Verdeckung der Gottesstrahlen. Der Scanner-Laser kann davor.
12. **§8a Automatik** — kann erst zusammengeschaltet werden, wenn die Stufen existieren, die sie
    verkettet. Die drei ruhigen Standards gehen aber schon vorher zu entwerfen.
13. **§8 Der Lauf zuletzt.** Auf einer Kamera, die Bilder verliert, lässt sich keine Zeitkarte
    prüfen — und er ist schon einmal daran auseinandergefallen, dass er als „offen" behandelt wurde,
    obwohl er „zu planen" war.

**Gegenüber der ersten Fassung verschoben:** Das Hook-Fenster war eigener früher Punkt, ist jetzt
Abfallprodukt von §7. Die abschnittsweise Zuordnung und „mehrere Videos" sind **eine** Stufe, nicht
zwei — beide brauchen dieselbe Umstellung, nämlich dass der Abschnitt die Einheit wird, die ein
Rezept trägt. Und „Standbild mit Effekten" gehört nach vorn statt in die letzte Stufe: es hat kein
Naht-, kein Tempo- und kein Phasenproblem und betrifft 236 Titel.

---

## 12 · Abwägung — was mit dem wenigsten Aufwand am meisten bringt

Caspar_D, 12.09.: *„dann brauchen wir eine Abwägung, was mit dem wenigsten Aufwand die besten Effekte
liefert."* §11 sagt, in welcher **Reihenfolge** gebaut wird (nach Abhängigkeiten); hier steht, was
den **Ertrag je Aufwand** angeht. Die beiden Listen sind nicht dasselbe.

Aufwand: **S** = Stunden · **M** = ein Tag · **L** = mehrere Tage · **XL** = Wochen oder ungewiss.

### Stufe 1 — Stunden, sofort sichtbar (der ganze Block ist ein Nachmittag)

| # | Was | Auf | Ertrag |
|---|---|---|---|
| 1 | **Weiche Flanken bei Lichtstrahlen** (`filter:blur`) | S | Der Effekt hört auf, wie eine Schablone auszusehen. **Größter sichtbarer Sprung im ganzen Dokument.** |
| 2 | **Winkellage streuen** statt gleichverteilen (`hs(i)` liegt da) | S | Aus einem Fächer wird Blattwerk |
| 3 | **Fahrt: Vorgaben anheben** (Ausschnitt 0,6 / Weite 0,4) | S | 4,8 % → 16 % Bildbreite: aus unsichtbar wird Bewegung |
| 4 | **Nebel-Entsättigung heraus** | S | Kontrast und Buntheit zurück |
| 5 | **Wind für Feuer und Flammen** | S | Fackeln, Zugluft — heute gar nicht möglich |
| 6 | **Fahrt: Beschreibung berichtigen** (Regel 11) | S | Kein falsches Versprechen mehr |
| 7 | **`breite`-Minimum senken** | S | Docht statt nur Lagerfeuer |
| 8 | **Austastung statt Sinus** beim Laser-Flimmern | S | Laser flimmert wie ein Laser |
| 9 | **Preset „Feuer mit Schein"** | S | Kopplung von Vorhandenem, kein neuer Code |

### Stufe 2 — ein Tag, struktureller Gewinn

| # | Was | Auf | Ertrag |
|---|---|---|---|
| 10 | **Antrieb an alle 37 Effekte** (§9d.1) | M | **Bester Einzelgriff überhaupt.** 28 Effekte hören auf, das Lied zu ignorieren. Aufwand steckt im Entscheiden, nicht im Code |
| 11 | **`idx` und `p` aus dem Antrieb herausgeben** (§9b.4) | S–M | Das Pult wird eine **Positions**quelle. Ermöglicht Laser-Sprünge und alles Spätere, was etwas platzieren will |
| 12 | **`lpP` für Fahrt entkoppeln** (§9.1) | S–M | Der Tempo-Regler lebt wieder, die Bahn ist keine Diagonale mehr |
| 13 | **noise4D für die vier Shader** | M | Vier Effekte werden loopfähig; die Datei liegt bereit |
| 14 | **Messreihe zweispaltig + Kontaktbogen der 37** (§9d.3) | M | Sagt, wo die übrigen 31 klemmen — **Voraussetzung dafür, nicht mehr zu raten** |

### Stufe 3 — mehrere Tage, ermöglicht das Übrige

| # | Was | Auf | Ertrag |
|---|---|---|---|
| 15 | **Bildweiser Export** (§4) | L | Naht 0 statt 7,7; Rechenzeit entkoppelt; Vorbedingung für 16, 19, 21 |
| 16 | **Quellfläche + Lebensdauer** (§9a.4 + §6.8) | L | Zwei Ziele mit einer Änderung: örtlich gebundene Partikel **und** Loopfähigkeit |
| 17 | **Ken Burns als Effekt** (§9.2–9.5) | M–L | Aus 321 Standbildern werden Kamerafahrten. Kein Shader, kein Modell |
| 18 | **Abschnitte aus drei Quellen** (§5) | L | Liefert Typisierung *und* Gewichte für §3 — und nebenbei die dritte Textebene für die Untertitel |

### Stufe 4 — teuer oder ungewiss, erst wenn Stufe 1–3 steht

| # | Was | Auf | Ertrag / Vorbehalt |
|---|---|---|---|
| 19 | **Tiefenkarte als Grundkanal** (§9.7) | L–XL | Sehr hoher Ertrag über viele Effekte — aber **ungeprüft auf stilisiertem Artwork**. Erst der Kontaktbogen, dann entscheiden |
| 20 | **Scanner-Laser** (§9b.3) | M–L | Eigenständig, wirkt sofort; keine Abhängigkeit außer 11 |
| 21 | **Gottesstrahlen** (§9b.2) | L | Braucht 15 (Qualitätsstufe). Lizenzfrage offen |
| 22 | **3D-Raum** (§9c) | XL | Größter ästhetischer Sprung bei den Lichtern — aber erst mit 19 das, was es sein soll |
| 23 | **Der Lauf** (§8) | XL | Braucht 15; schon einmal auseinandergefallen |
| 24 | **Automatik** (§8a) | XL | Kann erst verkettet werden, wenn die Stufen existieren |

### Was daraus folgt

**Die Stufen 1 und 2 zusammen sind zwei bis drei Tage** und heben die Bibliothek weiter, als es die
Stufen 3 und 4 zusammen täten. Neun von vierzehn dieser Punkte sind Zahlen, Zeilen oder Kopplungen —
kein neuer Apparat.

**Drei Punkte tragen doppelt** und gehören deshalb vorgezogen, auch wenn sie einzeln nicht am
billigsten sind:

- **#10 Antrieb an alle** — betrifft 28 Effekte auf einmal
- **#16 Quellfläche + Lebensdauer** — löst §9a und §6.8 mit einer Änderung
- **#14 Kontaktbogen** — verwandelt Raten in Wissen, und zwar für den ganzen Rest der Liste

**Was hier bewusst weit hinten steht:** die Tiefenkarte (#19), obwohl sie im Dokument den meisten
Platz einnimmt. Ihr Ertrag ist groß, aber sie hängt an einer ungeprüften Annahme — ob monokulare
Tiefenschätzung auf NDH-Artwork überhaupt taugt (§9.7d). Ein halber Tag Kontaktbogen entscheidet
darüber, und bis dahin ist jede Planung darauf spekulativ.

---

## 13 · Was offen ist und wer am Zug ist

| | Frage | wer |
|---|---|---|
| §2 | Wie verteilen sich die eigenen Videos auf Mikrohandlung / Textur / Standbild? Wie lang sind sie typischerweise? | Caspar_D |
| §4 | `VideoEncoder` H.264 und `VideoDecoder` mit Suno-MP4s — je fünf Zeilen, **vor** der Architekturentscheidung | Claude, am Gerät |
| §6.6 | Ratentoleranz am eigenen Material eichen | gemeinsam |
| §6.7 | GL Transitions: Lizenz je Datei prüfen, `LIZENZEN.md` nachtragen | Claude |
| §6.7 | RIFE gegen FILM — Lizenzen und Modellgröße, **vor** dem Holen | Claude |
| §7 | Effekte beim wiederholten Abschnittsvideo: mitlaufend oder weiterlaufend? | Caspar_D |
| §8a | Form des Eingriffs: Regler, Verwerfen oder Sperren? | Caspar_D |
| §8a | Die drei ruhigen Standards (Textur, Mikrohandlung, lebendes Foto) entwerfen | gemeinsam |
| §9.1 | Fahrt-Beschreibung: Zoom streichen **oder** wirklich einbauen? | Caspar_D |
| §9.6 | Kontaktbogen über 321 Cover — reicht die Bildmitte? | gemeinsam |
| §9.7 | Depth Anything V2 small: Größe, Lizenz, `onnxruntime-node`, Rechenzeit über 321 Cover | Claude, am Gerät |
| §9.7 | Tiefenkarte als Grundkanal gewollt — und wird sie archiviert oder neu gerechnet? | Caspar_D |
| §9a.5 | Quellfläche: drei Formen mit je zwei Reglern — reicht das, oder fehlt eine Form? | Caspar_D |
| §9a.5 | Feste Reihenfolge der generischen Spalte festlegen — sie gilt dann für alle 38 Karten | gemeinsam |
| §9a.5 | Generische Namen vereinheitlichen (Wind zuerst): gleiche Bedeutung, gleiches Gefühl | Claude |
| §9b.2 | Gottesstrahlen: Herkunft und Lizenz des GPU-Gems-Ansatzes klären | Claude |
| §9b.3 | Scanner-Laser als zweite Bauart — Auswahl neben dem Gitter, nicht Ersatz: einverstanden? | Caspar_D |
| §9.7a | Horizontlinie: je Cover von Hand oder aus der Tiefenkarte geschätzt? | gemeinsam |
| §9.7d | Taugen die Tiefenkarten auf stilisiertem Artwork? — Kontaktbogen mit Falschfarbe | gemeinsam |
| §9d.1 | Je Effekt entscheiden, **was** der Antrieb moduliert (28 offen) | gemeinsam |
| §9d.3 | Kontaktbogen über alle 37 Effekte — ein Clip je Effekt | gemeinsam |
