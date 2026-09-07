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

**Diese 60 % sind am Abend des 07.09.2026 stark relativiert worden**
(`SONGSTRUKTUR.md` Abschnitt 7). Eine Attrappe mit gleicher Bogenzahl,
gleichem Versatz und gleicher Länge, nur gewürfelter Lage, trifft schon
44 bis 52 % — es bleiben rund 20 %, und derselbe Wert kommt bei allen
sieben geprüften Bahnen heraus. Der Engpass ist nicht das Merkmal,
sondern die Bogendichte.

**Was das für den Bau heißt, ist aber besser als es klingt.** Genau die
Doppelanlage rettet die Idee: wo Text- und Klangbogen übereinstimmen,
treffen sie zu **79,8 bis 81,0 %** auf Sunos Abschnittsetiketten und
erreichen damit das Niveau von Sunos eigenen Marken (80,2 %), während
jede Quelle für sich bei 62 bis 63 % liegt. Der Konsens kostet 90 % der
Klangbögen — bei 20 Bögen je Lied ist das kein Verlust, sondern die
gesuchte Reduktion. Das Diagramm sollte also nicht zwei Bogensätze
nebeneinander zeigen und den Betrachter vergleichen lassen, sondern die
Übereinstimmung selbst zur Auswahl machen.

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

**Was schiefgehen kann.** 79,0 % der besten Treffer sind transponiert,
während der Ton tonhöhenfest bleiben soll — die Originalzahl 78 % ist
nachgerechnet und stimmt. *Nur ist der Vergleichswert nicht null:* bei
zwölf Rotationen gewinnt der Nullversatz ohne jedes Tonartgefüge in einem
Zwölftel der Fälle, der Nullwert für „transponiert" ist also **91,7 %**
(gerechnet 92,3 %). Tonhöhengleichheit ist damit 2,5-fach angereichert,
nicht abwesend. Der Gegenleser hat die Anreicherung allerdings weiter
zurückgeschnitten: dreht man ganze Lieder gegeneinander, kommen 10,3 %
heraus gegen 11,6 % gemessene Grundtonkollision — es ist im Wesentlichen
Sunos Tonartvorrat, nicht musikalische Verwandtschaft. Der praktische
Befund bleibt und ist der eigentliche Punkt: tonhöhenfest haben bei
Schwelle 0,30 zwischen 65,5 und 72,8 % der Takte keinen Ausgang. Die Schwelle darf kein Regler
werden und entscheidet trotzdem alles: bei 0,20 haben 85 % der Takte
keinen Ausgang, bei 0,35 im neunzigsten Perzentil zweihundert. Deck B ist
zwölf Sekunden vor Songende schon für die Endnaht belegt — es bräuchte
einen dritten Tonweg.

**Erster Schritt:** kein UI, kein Ton. Die Fenster in Schlägen statt in
Zonen neu bauen, Transposition auf null festnageln, auszählen wie viele
der 43.445 Takte bei 0,25 und 0,30 überhaupt einen Ausgang haben. Bei
Transposition 0 fällt die Ausbeute von 56 % auf 32 %.

*Nachgemessen am 07.09.2026, und es hilft der Idee:* Die Weiche steht
nicht am einzelnen Takt, sondern am Vorausband — und in dieser Einheit
ist es nicht leer. Über vier Takte hinweg haben bei 0,30 tonhöhenfest
**58,0 %** der Bänder einen Ausgang, bei 0,35 sogar 77,5 %. Die vorher
gesetzte Entscheidungsregel (60 % der Takte) ändert das nicht, aber sie
misst die falsche Einheit.

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

**Der alte Vorbehalt ist erledigt** — und war doppelt gebucht. Die
12.419 Regieklammern sind in den 84.416 gesungenen Marken bereits
abgezogen; sie noch einmal als Risiko zu führen, war unser Fehler. Seit
`library/lyrik.json` steht die Zahl anders: **66.424 Wortanker aus 239
Liedern**, jedes gesungene Wort einzeln adressierbar, Ankerdauer im
Median 0,38 s, nur 0,42 % teilen sich eine Marke. 8.824 Wortformen, davon
43,6 % in mindestens zwei Liedern — und **90,5 % aller Anker tragen eine
Form, die auch anderswo im Bestand vorkommt.** Das alles ohne neues
Alignment, allein aus der vorhandenen Rechnung.

**Was jetzt schiefgehen kann** (der neue Vorbehalt löst den alten ab):
Die verlockendste Zahl trägt nicht. „65,6 % der Sätze baubar" ist in der
Gegenrechnung vollständig durch die Worthäufigkeit erklärt — echt 68,0 %
gegen ein faires Nullmodell von 68,5 bis 68,9 %. Der Bestand kann einen
Satz nicht besser bauen, als seine Wortverteilung es ohnehin hergibt. Und
das Wortende ist bei 65,4 % der Anker abgeleitet, bei 4,9 % reine
Konstruktion; der Wortanfang ist gestützt (0,093 s Übereinstimmung mit
Sunos eigenem Ausrichter), das Ende nicht. Kein Ohr hat je einen Anker
geprüft.

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

**Der Satz „es gibt keine trennende Schwelle" ist am 07.09.2026
widerlegt worden.** Er stand auf einem 30-Sekunden-Fenster. Im selben
Lauf lief eine dritte Spalte mit — 60 Sekunden — und wurde verworfen,
weil sie am 80-%-Ausbeutepunkt ähnlich schlecht aussah. Bei gleicher
Ausbeute ist sie an jedem Punkt zwischen 10 und 45 Treffern deutlich
schärfer, und dafür gibt es einen Grund statt Glück: ein doppelt so
langes Fenster lässt sich durch eine Stilfamilie viel schwerer zufällig
treffen.

Die Zahlen im 60-s-Fenster, Schwelle 0,702: **26 der 49 belegten
Fassungspaare liegen oben, gegen 4 ungeklärte aus 33.362** — davon drei
am selben Lied. Rund 590-fache Anreicherung, ROC-Fläche 0,944. Die
Reinheit ist wegen der unvollständigen Wahrheitsliste eine Untergrenze
und kann nur besser werden. Nachgeprüft: die vier Ankerwerte des
Originallaufs reproduzieren sich aufs Tausendstel, die Grundwahrheit
stammt aus Text und Handpflege (nicht aus derselben Quelle wie das
Merkmal), und die Schwellenregel lag vor dem Lauf fest.

**Was trotzdem schiefgeht:** Die volle Ausbeute ist unerreichbar. ClubMix,
Retro-Fassung und Neuarrangement liegen in jeder Spalte unter dem
Untergrundmedian — mehr als die Hälfte der bekannten Paare wird Chroma
nie finden. Auf Stellenebene bleibt es tot: 92 der 200 stärksten Funde
sind Naturklang gegen Naturklang. Die Idee ist also nicht als *Entscheider*
rehabilitiert, sondern als **Finder für die eine Hälfte**: 26 Treffer, 4
Fehlgriffe, eine Liste zum Abhaken. Danach steht ein **bestätigtes**
Register im Katalog.

---

## 6. Der Gabelweg — am 07.09.2026 zurückgeholt

**Was es ist.** Die Sammlung als Entscheidungsbaum aus hörbaren Fragen.
Nicht „wähle ein Genre", sondern: schneller oder langsamer? Mit Gitarre
oder ohne? Am Ende jedes Astes steht ein kleiner Haufen Lieder, und man
ist dorthin gekommen, ohne einen Namen zu kennen.

**Warum er verworfen war:** „Von allen hörbaren Messgrößen hat genau eine
ein Tal: das Tempo bei 109,5 BPM. Der ehrliche Baum endet nach drei
Gabeln, größtes Blatt 92 Lieder, kein einziges steht allein."

**Warum das falsch war.** Mit dem *unveränderten* Talkriterium des
Originals über alle 33 Messgrößen gerechnet: **drei** haben ein
abgesichertes Tal, nicht eine — Tempo (Tal 0,176 bei 109,47, p = 0,003),
Gitarrenstille (0,088 bei 0,614, p = 0,003) und Gitarrenkorrelation
(0,016 bei 0,127, p = 0,020). Die übrigen 30 haben Tal 0,000. Der
Originallauf hatte schlicht nicht alle Größen geprüft.

Und der Baum, mit zwei Hürden gebaut (Bootstrap-Stabilität des Schnitts,
Permutations-Aussagekraft): **13 Gabeln, 14 Blätter, größtes Blatt 40**
statt 92, kein Blatt unter sechs Liedern, mittlere Tiefe 3,7. Die
Wurzelgabel reproduziert sich im unabhängigen Nachbau auf die vierte
Stelle (z = 33,4), sie bleibt innerhalb jeder Suno-Modellstufe stehen,
und der Nullbaum auf vertauschten Merkmalsspalten ergibt in acht von acht
Läufen **null** Gabeln.

**Was der Gegenleser stehen lässt und was nicht.** Es trägt: die
Wurzelgabel ist groß genug für ein Bild (Leave-one-out 89,5 % gegen
64,7 % bei der alten Tempo-Wurzel). Es trägt nicht: die Blattgüte war im
selben Raum gemessen, in dem der Baum angepasst wurde — in der
nachgeholten Kreuzprobe bleiben 12,6 statt 18,4 %, und k-Means direkt im
Klangraum schafft 32,8 %. Die „zwei Hürden" sind in Wahrheit eine. Und
ungeprüft bleibt, was diese Rechnung ohnehin nicht entscheiden kann: ob
ein Abstand im Discogs-Einbettungsraum etwas mit dem Ohr zu tun hat.

**Erster Schritt:** die drei Täler anhören. Wenn 109,47 BPM und
„Gitarre/keine Gitarre" sich beim Umschalten wirklich wie zwei
verschiedene Sachen anfühlen, ist der Baum eine Ansicht. Wenn nicht, war
es Statistik.

---

## 7. Kleineres, das trägt

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

## 8. Was an den eigenen Zahlen gescheitert ist

Damit es niemand ein zweites Mal rechnet. **Am 07.09.2026 wurde jede
dieser Verwerfungen einzeln nachgeprüft** — Herkunft der Zahl, Neumessung
mit heutigen Quellen, Gegenlesung. Ergebnis: zwei Ideen sind
zurückgeholt (Gabelweg als Abschnitt 6, Fassungspaare in Abschnitt 5),
drei bleiben offen, und **bei vier von fünf verbliebenen Verwerfungen war
das Ergebnis richtig, die Begründung aber falsch.** Die berichtigten
Begründungen stehen unten — sie sind der eigentliche Ertrag, weil eine
falsche Begründung beim nächsten Mal wieder in dieselbe Falle führt.

| Idee | Stand | Woran es wirklich liegt |
|---|---|---|
| **Der Gegenlauf** (wo Text und Klang auseinanderziehen) | **offen, aber nicht bauen** | Die alte Zahl (r = 0,003) ist reproduziert — die Rechnung stimmt, die Klangachse nicht. „Anschläge je Sekunde" war die Zahl der 10-ms-Rahmen mit Pegelanstieg über einer *absoluten* Schwelle, Median 30,8 je Sekunde (kein Musikstück hat das) und mit r = 0,777 gegen die Lautheit praktisch ein Lautheitsmaß. Die Schlagzeug-Hülle lag seit dem 26.08. bereit. Neu gemessen mit ihr: gepoolt r = 0,074, also leichter *Gleich*lauf, und die vorab gesetzte Marke (36 von 239 Liedern) wird mit 22 nirgends erreicht. Aber auch die Ersatzachse ist nicht geprüft — sie läuft mit r = 0,748 gegen den Schlagzeugpegel und mit r = −0,196 gegen die echten Schlagzeiten. Wer die Idee je wieder anfasst, schuldet zuerst eine geprüfte Anschlagsachse |
| **Das Schichtbild** (Handschrift der Modellversionen) | verworfen, Begründung berichtigt | Es gibt sehr wohl acht Paare über eine Modellgrenze — die alte Aussage „null Paare" war falsch. Nur trägt keines der acht Maße den Vorzeichentest (kleinster p = 0,0703, Benjamini-Hochberg nimmt keines an). Der wahre Grund ist ein **Auswahleffekt**: die Altseiten sind ausgesuchte, nicht gezogene Stücke und liegen beim 69. Perzentil ihrer Typgruppe; aus reiner Rückkehr zur Mitte erwartet man −3,30 LU, gemessen wurden −3,20 LU. Nebenbei gefunden und nie gerechnet: über die 210 reinen Erzeugungen ist die Schichtung des Übersteuerungsrands echt (η² = 0,385 gegen ein 95-%-Quantil von 0,048) — aber die Schichten liegen 0,90 dB auseinander bei 1,06 dB Rauschen zwischen zwei Clips desselben Auftrags. Kein Diagramm |
| **Die Wortwaage** (Prompt gegen Ergebnis) | **offen** | Die alte Verwerfung ist arithmetisch tot: die 0,150 des Rauschbodens gibt es nur mit Titelstamm-Filter aus 14 Zetteln und 74 *abhängigen* Paaren. Ehrlich gezählt sind es 30 Zettel, Median 0,107 — und innerhalb der Naturklang-Serie 0,157 gegen 0,075 außerhalb, ein Zirkelschluss um Faktor 2,1. Der Vergleich mit einer Gruppenmitteldifferenz war zudem ein Kategorienfehler. Was die Idee trotzdem nicht rettet: 43 der 93 ambient-Lieder stammen aus einer einzigen Sitzung, innertags schrumpft der Effekt auf −0,046, AUC 0,69. Zu wenig zum Wiederbeleben, zu viel zum Beerdigen |
| **Die Rückbögen** (Lied verbunden mit seinem klanglichen Vorfahren) | verworfen, Begründung berichtigt | Der alte Satz („30 der 44 Bögen über dem Median") hatte gar keinen Maßstab — der fehlende Erwartungswert ist **42,4 %**, nicht 50 %. Was die Verwerfung wirklich trägt: jenseits eines Tages ist der klanglich nächste frühere Nachbar nicht besser als der Zufall, und der Einzelbogen ist für **306 von 322 Liedern schlicht unprüfbar** — eine Ansicht, die jedem Lied einen Vorfahren zuweist, hätte für 95 % der Lieder keinen Beleg. Übrig bleibt ein großer, sauberer Befund, der aber etwas anderes zeigt: klanglich ähnliche Lieder entstehen **zeitlich nah** (Median 11,93 gegen 87,66 Tage, 0 von 1000 Zufallsläufen). Das ist der Sitzungsrhythmus, nicht die Wiederkehr |
| **Der Hörplatzteppich** (Datei-Pegel gegen Mikrofon-Pegel) | verworfen, Begründung berichtigt | Der Kalibrierversatz war **nicht unbekannt**, sondern bestimmbar: K = +37,7 dB bei nur 0,94 dB Streuung über acht Bänder — er lag weit außerhalb des durchprobierten Fensters von ±10 dB. Mit dem richtigen Wert bleiben 2,8 % leere Zellen im Bassband statt der Spanne 19 bis 91 %. Die alte Begründung maß also nur die eigene Ratlosigkeit. Es reicht trotzdem nicht: im Liedkern färben sich in drei von fünf tauglichen Bahnen 0,05 bis 0,07 % der Zellen, 69 von 323 Liedern haben in der obersten Bahn gar kein Loch |
| **Die Raumspur** | verworfen | Bricht die Regel, dass Messungen exklusiv laufen. Kein Datenfehler, eine Hausregel |
| **Die Zugbahnen** (neue Lieder in die Karte einzeichnen) | verworfen, Begründung **ersatzlos gestrichen** | Beide Hälften der alten Begründung sind falsch: eine Out-of-Sample-Projektion existiert sehr wohl, und die Pflichtkontrolle ist nicht per Konstruktion null — leave-one-out bleiben 65,4 % gegen 0,31 % Zufall, der Zirkel kostet 0,76 Punkte. Was die Verwerfung trägt, ist kein Test, sondern **Geometrie**: bei 323 Sternen mit Medianabstand 0,0162 haben die Bahnen einen Medianradius von zwölf Nachbarabständen — ein Zwei-Sekunden-Fenster liegt genauso weit von seinem eigenen Lied entfernt wie das Lied von seinen ähnlichsten Nachbarn. Kein lesbares Diagramm. Die verkleinerte Fassung (zwei bis fünf Lieder) würde tragen — und existiert seit 2020 als music-explore, im lokalen Abzug Zeile für Zeile bestätigt, samt dem Hinweis „Best works with t-SNE and N < 10" |
| **Gehirnwellen-Ankopplung** | verworfen | Messbar ist nur die Musik, nie der Hörer. Der Gipfel im Modulationsspektrum ist ein Hügel: Schärfe 67 gegen 15.233 bei echter Sinusmodulation, und 30 % der Lieder nennen aus zwei Hälften zwei Werte. Ein EEG-Weg scheitert am Störabstand — Nutzsignal Zehntel-Mikrovolt gegen Lidschläge von 100 bis 200 µV im selben Band |

**Was aus dieser Runde als Regel bleibt.** In fünf von zehn Fällen war der
Fehler dieselbe Sorte: **eine Zahl ohne ihren Erwartungswert.** 78 %
transponiert klingt vernichtend, bis man weiß, dass der Nullwert 91,7 %
ist. 30 von 44 Bögen über dem Median klingt vernichtend, bis man weiß,
dass 42,4 % zu erwarten waren. 65,6 % baubare Sätze klingt großartig, bis
das Nullmodell 68,5 % sagt. Und ein „unbekannter Kalibrierversatz" war
schlicht nie ausgerechnet worden.

---

## 9. Die Reihenfolge, wenn es nach den Zahlen ginge

*Neu geordnet am Abend des 07.09.2026, nachdem die Nullkontrollen
durch waren.*

1. **Fassungspaare** — von Platz drei nach vorn. 26 belegte Paare gegen
   4 Fehlgriffe aus 33.362 Kandidaten, rund 590-fache Anreicherung, und
   die Reinheit kann nur besser werden, weil die Wahrheitsliste
   unvollständig ist. Ein Nachmittag Rechnen, eine Stunde Abhören, danach
   steht ein bestätigtes Register im Katalog. Von allen Ideen hier die
   einzige, deren Zahl eine Nullkontrolle nicht nur überlebt, sondern
   dabei besser aussieht als vorher.
2. **Schlagblatt** — die Daten liegen vollständig, 766 ms Rechenzeit,
   keine Schwelle nötig, der Befund ist schon gemessen und wartet nur
   darauf, gezeichnet zu werden. Unverändert sicher.
3. **Doppel-Bogendiagramm** — am weitesten gediehen und weiterhin die
   einzige Idee, deren Kern draußen nachweislich fehlt. Aber der Bau
   muss anders aussehen als geplant: nicht zwei Bogensätze
   nebeneinander, sondern der Konsens als Auswahl (80 % statt 62 %), und
   davor Footes Kontrastmessung, damit überhaupt weniger gezeichnet
   wird. Das ist einen Arbeitstag mehr als gedacht.
4. **Gabelweg** — neu in der Liste, weil die Verwerfung nicht trug. Erst
   die drei Täler anhören, dann entscheiden. Kostet eine Stunde und
   klärt, ob der Baum eine Ansicht ist oder Statistik.
5. **Taktweiche** — das größte Kaliber, aber drei Entscheidungen und ein
   Eingriff in den Tonpfad davor. Das Vorausband über vier Takte
   (58,0 % bei 0,30) macht sie plausibler als der Einzeltakt.

Die Entscheidung trifft Caspar_D.
