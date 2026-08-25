# Prüfung des SunoAnalyzers (23.08.2026)

> **Die Zeilennummern in diesem Dokument stimmen nicht mehr.** Sie
> stammen aus einem älteren Stand; `web/fremd/analyzer.js` ist seither
> von rund 7 000 auf über 8 000 Zeilen gewachsen. Die genannten
> Funktions- und Variablennamen stimmen weiterhin — danach suchen, nicht
> nach der Zeile. (Festgestellt beim Funktionstest am 25.08.2026.)

> **Namenswechsel:** Das Projekt hieß bis zum 24.08.2026 *MySuno*. Es heißt jetzt **KlangTresor** — „Suno" ist seit dem 06.01.2026 eingetragene Marke von Suno Inc., ausdrücklich für Software zum Abspielen und Bearbeiten von Audioinhalten. Wo in Zitaten und in der Chronik noch der alte Name steht, bleibt er stehen.

Caspar_D: „der Analyzer macht offensichtlich falsche Dinge — auch die Stimmerkennung
klemmt." Sechs Prüfer haben je eine Messgröße **nachgerechnet** (nicht nur den
Code gelesen): mit dem echten Rechenkern in Node, an allen 321 Songs, gegen
Referenzen — Sunos Schlagzeiten, ffmpeg/EBU R128, ein Feinspektrum mit 2,7 Hz
Auflösung, Kunstsignale mit vorher bekannter Antwort, und Caspar_Ds eigene Angaben
im Stil-Prompt. Jeder Fund wurde anschließend von einem zweiten Agenten
angegriffen; 17 von 18 überprüften Funden hielten stand.

## Das Muster

**Was eine Selbstprüfung hat, stimmt. Alles andere nicht.**

Der Lautheitsteil hat mit `bin/pruefe-lautheit.js` eine Prüfung gegen die Norm —
und er ist einwandfrei: integrierte Lautheit, Schwankungsbreite und True Peak
stimmen bei allen 321 Songs mit ffmpegs `ebur128` überein (Median 0,03 LU
Abweichung, schlechtester Fall 0,10 LU; True Peak auf 0,12 dB genau, vierfach
überabgetastet wie die Norm es verlangt). Auch die Krumhansl-Profile der
Tonarterkennung sind korrekt abgeschrieben, und an sauberer Kunstmusik trifft
das Verfahren 8 von 8.

Alles ohne Selbstprüfung misst etwas anderes, als sein Name sagt.

## Die Befunde nach Messgröße

### Prüfbericht 1

Die Stimmerkennung klemmt nicht an einer Stelle, sie mißt durchgehend das Falsche. Nachgerechnet wurde mit dem echten Rechenkern (analyzer-worker.js über new Function wie in bin/vorrechnen.js) an allen 321 Songs des Archivs, an fünf Songs zusätzlich mit Bandbegrenzung, und an Kunstsignalen mit vorher bekanntem Ergebnis (Quelle-Filter-Modell einer Singstimme, Baßlinie mit Kick, rosa Rauschen, Streicherakkord).\n\nDer Kern hat keine Stimmtrennung. Er rechnet auf dem rohen linken Kanal (Zeile 576), und alle vier Merkmale, aus denen das Urteil entsteht, beschreiben das Arrangement statt den Sänger. Das Tor, das Gesangsfenster von instrumentalen trennen soll (Zeile 766), prüft nur, ob überhaupt Mitten im Fenster sind — deshalb bekam von 321 Songs kein einziger die Antwort „instrumental\", auch die 64 Stücke ohne eine Textzeile nicht: Waldesrauschen wird „weiblich\" mit 305 Hz, Landregen „weiblich\" mit 258 Hz. Die Bänder „männlich 80–165 Hz\" / „weiblich 165–350 Hz\" (Zeile 758) sind auf einem Mix Baß- und Kickbänder. Und die Grundfrequenz mißt nicht die Stimme: nimmt man einem Song alles unter 200 Hz weg — der Gesang bleibt dabei vollständig erhalten —, kippt das Urteil bei allen fünf geprüften Stücken auf „weiblich\", auch bei dem, dessen Stilangabe „German deep male baritone\" lautet. Umgekehrt liefert der Anteil unter 200 Hz allein, in dem gar keine Stimme sein kann, dieselben f0-Werte wie der volle Mix.\n\nDazu zwei handwerkliche Fehler, die das Ergebnis zusätzlich zerlegen: f0 wird nicht interpoliert und liegt deshalb auf einem 23,4-Hz-Raster, während die Entscheidungsschwellen 160 und 200 Hz zwischen den Rasterpunkten liegen (über 321 Songs traten genau zehn verschiedene f0-Werte auf, 65 % davon auf zwei Punkten). Und die HPS-Suche rechnet ein Produkt roher Beträge ohne Normierung (Zeile 780), was bei einer nackten Männerstimme von 110 Hz die dritte Harmonische findet: der Kern meldet 328 Hz und urteilt „weiblich\".\n\nDas Gesamtergebnis: gemessen an Sunos eigenen Stilangaben trifft der Kern bei 142 eindeutig beschrifteten Songs 40 %; wer immer „männlich\" sagte, träfe 77 %. Von 33 Stücken mit weiblicher Stimme werden 6 erkannt. Ja, „weiblich\" kommt heraus — 20 von 321 Mal, darunter eine Regenaufnahme und zweimal Wind.\n\nAlle Skripte und Meßreihen liegen in einem Arbeitsordner außerhalb des Projekts (kern.js, stimme.js, probe.js, kernprobe.js, filterprobe.js, pitchpruef.js, stat.js, stimme-alle-321.json). Die Kopie des Stimmblocks in stimme.js wurde gegen den echten Kern geprüft und liefert Zeichen für Zeichen dasselbe. Es wurde keine Projektdatei geändert.

### Prüfbericht 2

Nachgerechnet an allen 321 Songs des Archivs (nicht nur gelesen): Der Rechenkern wurde in Node wortgleich nachgebaut und liefert für alle 321 Songs exakt den in library/analyse/<id>.bin abgelegten BPM-Wert — die Messung ist also der Produktionscode selbst. Als Referenz dient das Feld "schlaege" aus dem Katalog (Tempo = 60/Median der Schlagabstände); die Suno-Raster sind sauber: bei allen geprüften Stücken liegen 98–100 % der Abstände innerhalb von 20 ms um den Median, Zählzeiten 1-2-3-4 durchgehend.

Bilanz gegen Suno: Der AKF-Skalarwert (analyzer-worker.js:699) trifft 171 von 321 (53 %), ist bei 58 genau eine Oktave zu langsam, bei 23 eine Oktave zu schnell, bei 69 anders daneben — von diesen 69 sind aber 53 ebenfalls metrische Verwechslungen (21 mal 1,5 Schläge, 32 mal 0,75 Schläge). Der Wert, den der Analyzer im Feld "BPM" ANZEIGT, ist gar nicht dieser Skalar, sondern der Median der geglätteten IOI-Median-Kurve (analyzer.js:5689): der trifft nur 98 von 321 (31 %) und liegt bei 160 von 321 Songs zwischen den metrischen Stufen — mittlerer Abstand zur nächsten Stufe 84 Cent gegenüber 16 Cent beim Skalar.

Die Ursache ist nicht ein Rechenfehler, sondern ein fehlendes Verfahren: Es gibt keine Oktavauflösung. Der Suno-Schlag ist nur bei 75 von 321 Songs überhaupt der höchste Gipfel der Autokorrelation; in 103 Fällen ist es die Zwei-Schlag-Ebene, in 57 der ganze Takt, in 18 der halbe Schlag. Der Code nimmt kommentarlos den höchsten Gipfel im Fenster 60–181,8 BPM. Damit entscheidet die Bereichsgrenze über die metrische Ebene, nicht die Musik — und wo zwei Ebenen ins Fenster passen (60 und 120), gewinnt die zufällig höhere.

Skripte und Rohzahlen liegen in einem Arbeitsordner außerhalb des Projekts (kern-bpm.js, batch.js, batch.json, angezeigt.js, angezeigt.json, gipfel.js, tor.js, ioi.js, logenv.js). Keine Projektdatei wurde geändert.

Tabelle für 13 gemischte Songs (Suno | AKF-Skalar | angezeigt | stärkster AKF-Gipfel in Schlägen | Rang des Suno-Schlags unter den Gipfeln):
Erweckt v2 140,0 | 139,5 | 134,6 | 1,00 | 1
Waifu with White Hair 91,2 | 90,9 | 125,9 | 2,01 | 2
Erste Regentropfen 82,6 | 83,3 | 122,9 | 2,00 | 2
Das Bild – Ich komme 141,4 | 146,3 | 128,5 | 2,99 | 4
Stars of the deep 120,5 | 60,0 | 118,6 | 2,01 | 10
Emma 124,0 | 61,9 | 126,3 | 2,00 | 3
Der Schimmelreiter 148,0 | 74,1 | 145,3 | 2,00 | 3
Lichtpunkte 74,7 | 150,0 | 151,7 | 0,36 | 19
Das Geschenk – Es ist raus 85,9 | 171,4 | 127,9 | 1,50 | 5
Lagerfeuer – Schön war's 122,0 | 81,1 | 109,6 | 4,01 | 7
Rosaroter Frühling 184,1 | 122,4 | 135,2 | 3,99 | 10
Mutterns Hände 101,2 | 122,4 | 112,8 | 4,00 | 26
4 Nachglut III 68,0 | 122,4 | 92,8 | 0,56 | 3

### Prüfbericht 3

Nachgerechnet an 40 Songs des Archivs plus 20 gezielt ausgewählten (laut/leise, Metal/Ambient, mit und ohne Gesang). Mein Prüfstand reproduziert die abgelegten Werte exakt (10 von 10 aus library/analyse/*.bin), die Messungen sind also am selben Gegenstand gemacht.

WAS RICHTIG IST: Die Profile in Zeile 213/214 sind die echten Krumhansl-Kessler-Zahlen, korrekt abgeschrieben. Die Pearson-Korrelation ist richtig gerechnet, das Hann-Fenster in rfft() sitzt, die mittleren 70 % sind eine vernünftige Wahl. An klarer Kunstmusik (Kadenzen mit Obertönen, acht Tonarten) trifft der Kern 8 von 8 — sein Verfahren ist also nicht grundsätzlich verkehrt. Auch die Stimmung der Suno-Songs ist mit ±5 Cent so sauber, dass ein fehlender Stimmungsausgleich hier nichts kostet.

WAS FALSCH IST: An echter Musik trifft der Kern 1 von 20 (gegen Caspar_Ds eigene Tonartangabe im Stil-Prompt) bzw. 13 von 40 (gegen eine unabhängige Referenz). Auf den sieben Songs, bei denen der Prompt UND alle drei Literaturprofile (Krumhansl-Kessler, Temperley 2001, Albrecht-Shanahan 2013) dasselbe sagen, liegt der Kern 7 mal daneben. Der Grund ist ein Verfahrensfehler, kein Zahlendreher: Das Chroma addiert JEDES FFT-Fach, nicht nur die, in denen ein Ton steht. Gemessen sind rund 30 % Gipfel und 70 % Grundrauschen und Fensterausschmierung. Dieser Bodensatz verteilt sich nach dem Fächerraster, und das Raster hängt an der Abtastrate — 12 von 12 Songs bekommen bei 44,1 / 48 / 32 / 22,05 kHz VERSCHIEDENE Tonarten aus derselben Musik. Alle 321 WAVs liegen mit 48 kHz vor, und genau dort klingt das nackte Raster nach E-Dur — daher die 58 mal "E Dur" im Archiv.

Der Modus ("C# Dorisch") ist kein Meßwert, sondern die Reihenfolge zweier for-Schleifen: Die Bewertung hängt allein am Tonvorrat, alle sieben Kirchentonarten desselben Vorrats bekommen exakt dieselbe Zahl, und es gewinnt der tiefste Grundton. Deshalb stehen für 321 Songs nur vier verschiedene Antworten in der Ablage, mit dem Grundton immer C oder C#.

Meine Skripte und Rohausgaben liegen in einem Arbeitsordner außerhalb des Projekts (ref-tonart.js = unabhängige Referenz, probe-rate.js = Abtastraten-Versuch, probe-modus.js = Beweis für den Modus, probe-boden.js = Gipfelanteil, probe-diag.js = Variantenversuch, batch.json/vergleich.json = Meßreihen). Am Projekt wurde nichts geändert.

### Prüfbericht 4

Nachgerechnet an 12 Songs im Einzelnen und an 26 Songs in Reihe, jeweils mit dem Kern (über vm geladen wie in bin/pruefe-lautheit.js) gegen ein Feinspektrum mit FFT 16384 (2,7 Hz), dazu Kunstsignale mit vorher bekanntem Ergebnis und eine unabhängige Gegenprobe mit ffmpeg-Bandpass. Ergebnis: Recht hat bin/stoerfrequenz.js. Der Schimmer im Rechenkern misst nicht, was sein Name sagt.\n\nDer Widerspruch bei "Remix Mich" löst sich vollständig auf. Der Kern meldet 736 Hz und 499 Hz mit je rund 15 dB; im Feinspektrum stehen dort 740,2 Hz (F#5, +1 Cent) mit echten +6,0 dB und 495,3 Hz (H4, +5 Cent) mit +3,7 dB — Musiktöne, und die 15 dB sind ein Rechenartefakt (Befund 2). Der Ton bei 7999,6 Hz, den die Referenz mit +12,2 dB in 88 % des Songs findet, ist echt: ein 20 Hz breiter ffmpeg-Bandpass zeigt ihn 4 bis 9 dB über den Nachbarstellen, auch in der WAV-Datei. Der Kern sieht ihn nicht, weil sein Band dort 334 Hz breit ist und den Ton über 31 FFT-Bins verteilt (Befund 1).\n\nDrei Ursachen tragen den Fehler:\n\n1. Auflösung. Die 4096er-FFT in 160 logarithmischen Bändern verdünnt einen schmalen Ton um 10·log10(Binzahl) — 0 dB bei 450 Hz, 15 dB bei 8 kHz, 18 dB bei 16 kHz. Der gleiche Ton mit der gleichen echten Hervorhebung wird als +22,6 dB (500 Hz) bis +10,4 dB (12 kHz) gemeldet. Im echten Song steigt die Nachweisschwelle von +14 dB bei 500 Hz auf +26 dB bei 12,5 kHz; unter 450 Hz wird gar nicht gesucht, ein voll ausgesteuertes 100-Hz-Brummen bleibt unentdeckt.\n\n2. Auswahl auf sich selbst. Die angezeigte dB-Zahl ist der Mittelwert genau der Rahmen, die die Schwelle 7,8 dB schon überschritten haben. Über 139 Befunde: angezeigt im Mittel +16,6 dB, tatsächlich +4,1 dB; kleinster je angezeigter Wert +11,0 dB, nie darunter.\n\n3. Kein Unterschied zwischen Musik und Störung. 137 von 137 Befunden bis 6 kHz liegen innerhalb ±15 Cent eines gleichstufigen Halbtons (Zufallserwartung 30 %), meist mit vollständiger Obertonreihe. Der Kern zeigt dem Benutzer die Melodie und rät bei 112 von 139 Befunden zu einem Schnitt von 2 bis 3 dB. Die Begründung in der Oberfläche ("Ein gehaltener Gesangston fällt heraus … mindestens 25 % des Songs") trägt nicht; die Referenz verwirft mit denselben Daten 149 ihrer 189 Kandidaten als "wahrscheinlich Musik".\n\nDazu zwei Nebenfehler mit sichtbarer Wirkung: an einer MP3-Tiefpasskante mittelt medianVon() über eine gerade Nachbarschaft den 5. und 6. Wert und erzeugt so bei 15106 Hz einen Phantomton mit +20 dB und höchstem Schweregrad, wo im Feinspektrum +1,6 dB stehen (18 von 26 geprüften MP3s; über die WAV-Dateien, die bin/vorrechnen.js benutzt, tritt er nicht auf). Und gemeldet wird nicht die gemessene Frequenz, sondern die Bandmitte — im Median 17 Cent, im Höchstfall 63 Cent daneben, was den beigefügten Filterrat unausführbar macht.\n\nWas das Bandverfahren der Referenz voraus hat und behalten sollte, ist die Zeitachse: es weiß, WANN ein Ton steht (von/bis, längster Lauf), und kann darauf springen. Das richtige Verfahren wäre die Rechnung von bin/stoerfrequenz.js — feine FFT, Median über alle Rahmen, 80 % Dauer, Halbwertsbreite, Obertonreihe und Intervallprüfung — ergänzt um diese Zeitachse.\n\nArbeitsdateien (nichts im Projekt geändert): einem Arbeitsordner außerhalb des Projekts/

### Prüfbericht 5

Nachgerechnet an echten Songs, nicht nur gelesen. Ergebnis vorweg: DER NORMKERN SELBST STIMMT. Die K-Bewertung liefert exakt die Koeffizienten aus BS.1770-4 fuer 48 kHz (Shelf b0=1,53512485958697 / a1=-1,69065929318241 …, RLB a1=-1,99004745483398, a2=0,99007225036621 - stellengleich); die Bloecke sind 400 ms mit 100 ms Schritt (75 % Ueberlappung), beide Tore (-70 LUFS absolut, -10 LU relativ) sind richtig gesetzt, die Kanalgewichte sind 1,0/1,0, und der True Peak wird wirklich vierfach ueberabgetastet und nicht bloss als Abtastspitze gemeldet. Alle 321 gespeicherten Analysen gegen "ffmpeg -af ebur128=peak=true" geprueft: Integrated max 0,05 LU Abweichung (Median 0,03), True Peak max 0,12 dB (Median 0,03) - kein einziger Fund nach der gesetzten Grenze. Zusaetzlich gegen eine unabhaengige 8fache Ueberabtastung (swr, filter_size 512, 384 kHz) an 12 Songs: max 0,01 dB. Auch der Zeitbezug der Anzeigekurven stimmt (Testton 5-15 s: Momentankurve steigt bei 4,82 s = Mitte minus 200 ms, Kurzzeitkurve bei 3,56 s = Mitte minus 1,5 s). Die Fehler sitzen daneben, nicht im Kern: bei der Schwankungsbreite (Schrittweite und relatives Tor), bei zwei Groesstwerten, die im ganzen Archiv NaN sind, bei den Karten "Lautheit dB" und "Dynamik dB", die nur den linken Kanal messen, bei einer Stille-Maske, die einen Effektivwert gegen eine Leistung vergleicht, bei einer als "True Peak je Fenster" beschrifteten Kurve, die stellenweise nur die Abtastspitze ist, und bei zwei Messwegen (Node mit 48 kHz, Browser mit 44,1 kHz), die nebeneinander ins selbe Archiv schreiben. Geprueft an 50 Songs im Einzelvergleich (Metal, Ambient, Orgel, Akustik, Jazz, Synth-Pop, Theremin, instrumental und mit Gesang, laut und leise) und an allen 321 im Sammelvergleich. Eigene Skripte liegen in einem Arbeitsordner außerhalb des Projekts/ - im Projekt wurde nichts geaendert.

### Prüfbericht 6

Nachgerechnet wurde an 12 echten Songs (leise Jazzballade bis lautes Industrial, -18 bis -8 LUFS, Stereobreite 0,19 bis 0,77), an allen 321 gespeicherten Analysen aus library/analyse/*.bin, gegen Sunos eigene Schlagzeiten (306 taktfeste Songs), gegen ffmpeg/EBU R128 und gegen selbst erzeugte Prüfsignale, deren Antwort feststeht.

ZUERST DAS GUTE: Der Normteil des Kerns ist einwandfrei. Integrierte Lautheit, Schwankungsbreite und echter Spitzenwert stimmen bei allen 12 Songs mit ffmpegs ebur128 überein — LUFS im Mittel 0,01 dB Abweichung (schlechtester Fall 0,10), LRA 0,07 LU (schlechtester Fall 0,40), True Peak auf 0,0 dB genau. Auch die Stereobreite ließ sich unabhängig auf drei Stellen bestätigen. Das ist genau der Teil, für den bin/pruefe-lautheit.js eine Selbstprüfung gegen die Norm hat.

ALLES OHNE SELBSTPRÜFUNG IST KAPUTT. 18 Befunde, davon 10 schwer. Vier Muster ziehen sich durch:

1. EINE MOMENTAUFNAHME STATT EINES MITTELS. Der Centroid, der im Analyse-Index steht, stammt aus einem einzigen Fenster von 43 ms bei 30 % der Spieldauer. Verschiebt man es um eine Sekunde, springt der Wert von 6151 auf 1105 Hz.

2. DIE AUFLÖSUNG TRÄGT DIE MESSUNG NICHT. Die Tonhöhe ist der nackte FFT-Bin-Index: 46,9 Hz Raster, unterhalb von 516 Hz kann sie keinen Schritt unter 1,5 Halbtönen darstellen. Für 321 Songs gibt es 15 verschiedene f0-Werte. Darauf bauen Inharmonizität, Harmonische Dichte und Noten-Stabilität auf — alle drei erben den Fehler. Das Tempo kennt nur 68 mögliche Werte (6000 geteilt durch eine ganze Zahl), die Grenzfrequenz nur 12.

3. WERTEBEREICHE, DIE NICHT ZUR SKALA PASSEN. Der Textur-Index steht bei 286 von 321 Songs auf 100 %, weil die Akkordrate mit /2 skaliert wird, tatsächlich aber Werte bis 62 annimmt; der Rohwert der Formel hat den Median 220 %. Der Zeiger der Inharmonizität steht bei allen 321 Songs am Anschlag. Die Grenzfrequenz liegt bei 242 von 321 Songs auf ihrem Höchstwert 19,57 kHz. Die Attack-Karte bleibt bei 297 von 321 Songs ganz leer.

4. DEFINITIONEN, DIE NICHT MESSEN, WAS SIE HEISSEN. Der Rolloff summiert Amplituden statt Leistung — unter dem gemeldeten Wert liegen tatsächlich 94 bis 99 % der Energie, nicht 85 %. Die Harmonische Dichte antwortet umgekehrt: weißes Rauschen bekommt 15,8 von 16, ein reiner Sinus 5,0 statt 1. Der Spektral-Tilt stellt 10 Bass-Bins gegen 469 Höhen-Bins, weshalb rosa Rauschen als treblelastig gilt. Die Kirchentonart bewertet nur den Tonvorrat und nicht den Grundton; die sieben Modi sind deshalb bis auf die 15. Nachkommastelle punktgleich, ein reines A-Moll wird als "C Ionisch" gemeldet, und in der ganzen Sammlung kommt kein einziges Mal Ionisch oder Äolisch vor — also nie normales Dur oder Moll.

Dazu zweimal dieselbe Karte mit zwei verschiedenen Zahlen: Beim Centroid zeigt die Oberfläche das Rahmenmittel, der Index speichert die Momentaufnahme. Beim Tempo zeigt die Karte den IOI-Median (26,5 % richtig gegen Suno), der Index speichert die Autokorrelation (53,9 %) — und der Erklärungstext nennt ausgerechnet den schlechteren "den robustesten der drei Algorithmen".

Und: fast alles wird nur aus dem linken Kanal gerechnet. Tauscht man die Kanäle, ändert sich bei breiten Mischungen die gemeldete Tonart (D Moll wird G Moll) und der Centroid um bis zu 15 %.

Der kürzeste Weg nach vorn ist der, den bin/pruefe-lautheit.js schon vorzeichnet: für jede Messgröße ein Prüfsignal mit bekannter Antwort. Sinus, Sägezahn, weißes und rosa Rauschen, eine bandbegrenzte Datei, eine Tonleiter — damit fallen sieben der zehn schweren Befunde beim ersten Lauf auf.

## Gelöst — und wodurch

Die Befunde 1–10 stehen nicht mehr einzeln hier, weil ihre Verfahren
ersetzt sind. Was sie beschrieben, gilt weiterhin — nur rechnet es
niemand mehr:

**1–6 · Die alte Stimmerkennung** maß auf dem rohen Mix und lieferte
die Basstonhöhe statt der Stimme: Das Gesangs-Tor war ein Mitten-Tor
(„instrumental" kam nie heraus, auch bei Regen und Wind nicht), die
Bänder 80–165/165–350 Hz messen Kick und Baß, f0 lag auf einem
23,4-Hz-Raster mit den Schwellen dazwischen, die Harmonischen-Suche war
unnormiert. Gemessen an Sunos Stilangaben traf sie 40 %, wer immer
„männlich" sagte, träfe 77 %.

> **Gelöst (Caspar_D, 25.08.2026):** *„für Stimme haben wir eine
> Lösung, wir nehmen die Vocal-Spur aus der Stem-Zerlegung."* Die
> Stimmlage kommt aus `bin/toene.js` — YIN auf dem getrennten
> vocals-Stem, unteres Viertel. Instrumentale Stücke tragen seit dem
> 25.08. den Vermerk „instrumental" statt einer erfundenen Lage.

**7–10 · Die Tempo-Schätzung** nahm den höchsten Autokorrelationsgipfel
ohne Prüfung auf halbes oder doppeltes Tempo (33 % lagen auf der
falschen metrischen Ebene), zeigte statt der Messung ein Mittel über
Fenster, rechnete ohne Normierung auf die Zahl der Summanden (17 %
Vorteil für schnelle Tempi) und hatte ein Energietor, das einen
Effektivwert mit einem Mittelquadrat verglich und deshalb nie sperrte.

> **Gelöst (Caspar_D, 25.08.2026):** *„für Tempo nehmen wir Sunos
> Daten, brauchen wir also auch nie wieder."* Die Taktspur zeigt Sunos
> Schlagraster; die BPM-Karte ist totgelegt, mit genau diesem Befund
> als Begründung.

Beide Altrechnungen werden ausgebaut — *„wenn es noch alten Code gibt,
der dieses Zeug macht, weg damit."*

**11 + 12 · Das Chroma, das alles nimmt.** Beide Befunde
beschreiben dasselbe Verfahren (`analyzer-worker.js`:1044). **11:** Die
Schleife nimmt JEDEN Betrag zwischen 80 und 4000 Hz, rundet seine
Mittenfrequenz auf den nächsten Halbton und schlägt ihn dort auf — ein
Fach ohne Ton trägt genauso bei wie der Gipfel eines Grundtons; nur 29
bis 32 % der Beträge stehen überhaupt auf einem Spektralgipfel.
**12:** Die Fächer liegen in gleichen Hz-Abständen, die Halbtöne in
gleichen Verhältnissen — also bekommen die zwölf Tonklassen ungleich
viele Fächer, und wie ungleich, hängt allein an der Abtastrate.
Dieselbe Musik, anders abgetastet, ergab bei 12 von 12 Songs eine
andere Tonart. Gegen Caspar_Ds eigene Angabe im Stil-Prompt traf der
Kern 1 von 20 — Zufall wäre etwa 1.

> **Gelöst (25.08.2026):** An diesem Chroma hängt keine Zahl mehr.
>
> *Die Tonart* kommt aus `bin/toene.js` — häufigster Basston auf Sunos
> Eins —, die Karte ist totgelegt, mit genau diesen Befunden als
> Begründung.
>
> *Die Harmonien und die Teilung* kommen aus dem **zweiten** Chroma
> (Caspar_D, 25.08.2026: *„chroma gibt es ja zwei … der andere, der nur
> Zwischenschlag-Areale mittelt. Das sollte dazu dienen, die Harmonien
> rauszuholen. Zum Tonart-Holen ungeeignet, aber zum Viertel-, Achtel-,
> Sechzehntel-Schätzen geeignet."*). Das mißt **tonrein**:
> `chromaVektor()` legt auf jede Notenfrequenz einen Goertzel-Filter,
> dessen Fenster zur Tonhöhe paßt (`bin/toene.js`:236). Kein Fach, kein
> Raster, kein Bodensatz — beide Befunde greifen dort nicht. Auf diesem
> Vektor läuft die hierarchische Frage „ändert sich zwischen den
> Hälften etwas? und innerhalb einer Hälfte?" und daraus die Teilung in
> Viertel, Achtel oder Sechzehntel (`bin/toene.js`:298-305). Liegen die
> Zonen noch nicht vor, zeigt die Takt-Spur nichts, statt selbst zu
> rechnen.

**Die Chroma-Spur bleibt stehen wie sie ist.** Ein Verbraucher hängt
noch am ersten Chroma — das Bild der Tonklassen über die Zeit. Es zeigt
größtenteils das Raster. Caspar_D hat es an der Spur selbst gesehen:
*„sieh, daß F# ein einziger Match ohne Variation ist"* und, am
44,1-kHz-Song, *„hier ist F völlig variationslos."* Nachgemessen am
25.08.2026:

*Immer dieselben Töne oben.* Sechs verstreute Songs, verschiedene
Tonarten: fünf beginnen mit **F# C# A#**, vier davon mit G# an vierter
Stelle. Das nackte Raster — wie viele Fächer jede Tonklasse abbekommt,
ganz ohne Musik — lautet bei 48 kHz F# (9), A# (9), C# (8), G# (8) oben
und C (4), D (4) unten. Die Rangkorrelation zwischen Raster und
gemessenem Chroma beträgt 0,86.

*Der sechste Song beweist es.* „Komm noch näher" wurde mit 44,1 kHz
gerechnet und beginnt mit **F C A** — und das Raster lautet dort A (12),
F (9), A# (9), C (8) oben, C# (4) unten. C# steht bei 48 kHz auf Platz 2
und bei 44,1 kHz auf Platz 11. Derselbe Ton, nur eine andere Rechnung.

*Die hellste Zeile trägt die wenigste Information.* Bei „Komm noch
näher" ist F zugleich die hellste (Mittel 0,847) und die ruhigste Zeile
(Schwankung 0,27 — Streuung geteilt durch Mittel). Die drei hellsten
sind die drei ruhigsten; die dunkelste, D#, schwankt am stärksten
(1,04). Der Sockel steht still, die Musik bewegt sich — und die Spur
zeigt den Sockel am deutlichsten.

*Der Befund unterschätzte die Sache doppelt.* Die FFT ist 1024 groß,
nicht 4096: ein Fach ist 46,9 Hz breit, unterhalb von rund 800 Hz sitzt
kein Halbton mehr allein in seinem Fach. Und die Abtastrate kommt nicht
aus der Datei — alle 321 WAVs im Archiv sind 48 kHz, gemessen wurde
dieser Song trotzdem mit 44,1 kHz. Sie stammt vom Audiokontext des
Browsers zum Zeitpunkt der Messung. Dieselbe Datei kann deshalb an
verschiedenen Tagen ein anderes Chroma-Bild ergeben.

> **Entschieden (Caspar_D, 25.08.2026):** *„wir lassen es stehen wie es
> ist."* Kein Umbau, kein Totlegen. Die Spur bleibt, und wer sie liest,
> weiß jetzt, was er sieht: F# beziehungsweise F als durchgehender
> Balken ist das Raster, nicht die Musik.

**Neue Hausregel aus derselben Entscheidung:** *„wir legen nichts mehr
tot ohne den Code mitzulöschen, das macht nur Probleme."* Die alte Regel
— abklemmen, nicht löschen — gilt nicht mehr. Was wegfällt, kommt weg;
was bleibt, ist die Begründung: als Kommentar an Ort und Stelle oder als
Absatz hier. Das Löschen-ist-nicht-gut aus derselben Sitzung meint die
**Befunde** in diesem Dokument, nicht den Code.

**13 + 23 · Die Kirchentonart, zweimal notiert.** Beide Befunde
beschreiben denselben Fehler: Die Bewertung addierte die sieben
Leitertöne und zog die übrigen fünf halb ab — sie hing also
ausschließlich am TONVORRAT und nie am Grundton. C-Ionisch, D-Dorisch,
E-Phrygisch, F-Lydisch, G-Mixolydisch, A-Äolisch und B-Lokrisch haben
denselben Tonvorrat und bekamen deshalb exakt dieselbe Zahl; die 84
Paare (Grundton, Modus) ergaben nur 12 verschiedene Mengen. Weil der
Vergleich ein strenges Größer war, gewann, wer zuerst drankam. Die
sieben besten Lesungen eines echten Chroma-Vektors lagen bei
4,055000000000001 gegen 4,055000000000000 — ein Tonvorrat, Unterschied
in der 15. Stelle. In der Sammlung standen 265 von 321 Songs auf
„C# Dorisch", und kein einziger auf Ionisch oder Äolisch, also nie
normales Dur oder Moll — während der Erklärungstext genau das
versprach. Caspar_D hat es am 25.08.2026 aus dem Gedächtnis genau so
zusammengefaßt: *„die Kirchentonarten unterscheiden sich nicht, die
erste gewinnt immer."*

> **Gelöst am 24.08.2026, Commit `b69e898`** („Altes Tonartverfahren,
> Schritte 5–6: Anzeige und Rechenkern"). Gefallen sind: die Karte
> `v-mode` samt Schreibstelle, ihr `SA_TOT`-Eintrag, Anzeigereihenfolge,
> beide Rücksetzlisten und der Tooltip — und im Rechenkern die
> Modus-Erkennung, `keyDisplay`, die Felder `key:` und `mode:` aus
> beiden Nachrichten, die Fortschrittsmeldung „Tonart…" und zuletzt
> `schaetzeTonart()` selbst samt den drei Krumhansl-Tabellen, 67 Zeilen.
>
> **Die Stelle, die niemand auf dem Zettel hatte:** `exportForLLM()` las
> `v('v-mode')`. Die Karte war unsichtbar, ihr Textinhalt aber lesbar —
> die tote Kirchentonart stand damit bis zum 24.08. in JEDEM
> Kommentar-Prompt, den Caspar_D kopiert hat.
>
> Nachgeprüft am 25.08.2026: Suche im ganzen Projekt nach Ionisch,
> Dorisch, Phrygisch, Lydisch, Mixolydisch, Äolisch, Lokrisch,
> `modeName`, `MODE_`, `bestModeScore` — **null Treffer**. Der
> Rechenkern liefert in `scalars` weder Tonart noch Modus
> (`analyzer-worker.js`:1118), und keine abgelegte `.bin` trägt ein
> solches Feld. Der Grundton kommt heute aus `bin/toene.js`, gemessen
> am Baß auf Sunos Eins; eine Modusangabe macht das Archiv gar nicht
> mehr.
>
> *Berichtigung:* Hier stand zuerst, die Rechnung sei schon vor dem
> ersten Commit dieses Repos weg gewesen. Das stimmt nicht — sie fiel
> am 24.08. Sichtbar wird das nur in der **alten Historie**: Dieses
> Repo beginnt bei 62 Commits, das Vorprojekt („MySuno", ab dem
> 17.08.2026) hat 636. Es liegt als git-Bundle in
> `../SunoArchive-privat/`, mit einem eigenen Zweig `vor-tonart-ausbau`
> für den Stand davor.

**14 · Der Schimmer maß das Bandraster, nicht den Ton.** `bandVerlauf()`
legt 160 logarithmische Bänder über eine FFT mit 4096 Punkten und nimmt
je Band die MITTLERE Leistung aller enthaltenen Bins. Ein Bin ist 10,8 Hz
breit, ein Band aber 4,4 % — also 1 Bin bei 450 Hz, 4 bei 1 kHz, 31 bei
8 kHz, 63 bei 16 kHz. Ein schmaler Ton wird um 10·log10(Binzahl)
verdünnt, sein Nachbarschaftspegel nicht. Kunstsignal mit überall +32 dB
echter Hervorhebung: gemeldet wurden 500 Hz +22,6 · 2000 Hz +18,5 ·
4000 Hz +15,2 · 8000 Hz +12,4 · 12000 Hz +10,4 dB. Der echte Dauerton in
„Remix Mich" bei 7999,6 Hz (+12,2 dB in 88 % des Songs, unabhängig mit
ffmpeg-Bandpaß belegt) erschien in 0 % der Rahmen.

> **Gelöst (23.08.2026):** `SA_SCHIMMER_TOT = true`. Die Begründung steht
> im Code selbst: *„Sie finden Musik, keine Störung — 137 von 137
> Befunden bis 6 kHz liegen auf einer Note, und die gemeldeten dB sind
> ein Rechenartefakt."* Ersatz ist `bin/stoerfrequenz.js` mit 2,7 Hz
> Auflösung; es läuft als Schritt der Morgenroutine, hat alle 321 Songs
> vermessen, und seine Funde stehen im Glockenstuhl des Tonstudios.
>
> **Die Bandrechnung selbst bleibt.** Sie trägt außerdem die
> Grenzfrequenz (`grenzfrequenz()` mittelt über `bv.werte`), und dort
> stört das grobe Raster nicht: Gesucht wird ein breitbandiger Abfall,
> kein schmaler Ton. Die Höhenkante nimmt ohnehin die feinen Bins
> (`bv.binMittel`).
>
> **Rest:** `schimmerFinden()` rechnet weiter bei jeder Analyse, obwohl
> niemand das Ergebnis mehr liest — nach der Regel vom 25.08.2026 („nichts
> mehr totlegen ohne den Code mitzulöschen") gehört es weg. Steht noch
> an, weil zum Zeitpunkt der Prüfung der Nachrechnungslauf für die
> Spektrogramme auf genau diesem Rechenkern lief.

**15 + 16 + 17 · Drei Fehler in derselben Funktion.** Alle drei sitzen in
`schimmerFinden()` und sind mit Befund 14 zusammen gelöst — die Anzeige
ist seit dem 23.08.2026 aus (`SA_SCHIMMER_TOT`), Ersatz ist
`bin/stoerfrequenz.js`.

**15 · Die dB-Zahl war eine Auswahl auf sich selbst.** `hervorSum+=hervor`
stand INNERHALB von `if(verdaechtig)`, der Mittelwert also über genau die
Rahmen, die die Schwelle von 7,8 dB schon überschritten hatten. Er konnte
rechnerisch nie darunter fallen. Über 139 Befunde: angezeigt im Mittel
+16,6 dB, tatsächlich +4,1 dB; kleinster je angezeigter Wert +11,0 dB.
Bei „Remix Mich" standen 736 Hz mit angezeigten +14,9 dB im Feinspektrum
bei +6,0, und 499 Hz mit +15,5 bei +3,7. Jeder Befund sah gleich
dramatisch aus.

**16 · Kein einziger Test trennte Musik von Störung** — keine
Tonhöhenprüfung, keine Obertonreihe, kein Intervallvergleich. Die ganze
Last trug die Annahme, ein gehaltener Musikton komme in weniger als einem
Viertel der Rahmen vor. Grundton und Quinte stehen in fast jedem Stück
länger. Ergebnis: Von 139 Befunden lagen 137 innerhalb ±15 Cent eines
gleichstufigen Halbtons, bis 6 kHz **137 von 137** — bei einer
Zufallserwartung von 30 %. 100 Befunde lagen exakt auf 0 Cent. Der Kern
zeigte dem Benutzer die Melodie und riet, sie herauszufiltern.

**17 · Der Deckel warf gerade die echten Störtöne heraus.** Sortiert
wurde nach „schwere", und die baut auf dem bedingten Mittelwert aus
Befund 15 — der bei Musiktönen hoch ausfällt, weil ihre Bänder schmal
genug sind, um nicht verdünnt zu werden (Befund 14). Bei acht Einträgen
brach die Schleife ab. „Wiese mit Insekten": Der einzige echte Störton
(7200,2 Hz, +15,1 dB, 82 % des Songs) lag auf Rang 13; die acht Plätze
davor waren mit Musiktönen belegt. Er wurde nie angezeigt.

> Die drei Fehler verstärkten sich gegenseitig: 14 verdünnte hohe Töne,
> 15 machte jeden Fund dramatisch, 16 ließ Musik durch, und 17 sorgte
> dafür, daß am Ende genau die Musiktöne oben standen. Der Rest ist
> derselbe wie bei 14 — `schimmerFinden()` rechnet weiter, obwohl
> niemand liest; siehe „Wartet auf den Rechenkern".

## Am 25.08.2026 aus dem Rechenkern entfernt

Beide Schnitte, die auf das Ende des Nachrechnungslaufs warteten, sind
gemacht.

**1 · Der Schimmer.** `schimmerFinden()` samt Aufruf und Nachrichtenfeld,
dazu auf der Anzeigeseite die Bahn „stehende Töne", die Befundtabelle,
das Feld und die Konstante `SA_SCHIMMER_TOT`. `bandVerlauf()` blieb
stehen — es trägt auch die Grenzfrequenz, und dort stört das grobe
Raster nicht.

**2 · Die zehn verborgenen Karten** und alles, was nur sie fütterte. Im
Analyzer: `SA_TOT`, `totLegen()`, die Karten, ihre Einträge in
Anzeigereihenfolge, Rücksetzlisten, Mittelwert-Karten und `gaugeIds`,
die Funken-Kurven, die Erklärtexte. Im Rechenkern: `hpsPitch()` (die
Grundtonsuche über das harmonische Produktspektrum), Harmonizität,
Tonhöhe, Inharmonizität, Centroid, Rolloff, Spektral-Neigung,
harmonische Dichte, Noten-Stabilität, Akkordwechselrate — mitsamt ihren
Arrays, Mittelwerten, Übertragungspuffern und Nachrichtenfeldern. Von
`scalars` bleibt ein einziges Feld: `entropy`.

*Was das gebracht hat, nachgemessen:* 30 Sekunden Ton durch den echten
Kern, bester von drei Läufen — vorher 1,91 s, jetzt 1,83 s, also **4 %**.
Weniger als erwartet: Die FFT selbst dominiert, und die bleibt. Der
Gewinn liegt woanders — acht Arrays weniger im Speicher, eine schlankere
Ablage, und vor allem keine Zahlen mehr, die falsch sind und trotzdem
gerechnet werden.

*Was bleibt:* `entropy` (die Karte ist sichtbar und war nie in `SA_TOT`),
`flux` und `bandFlux` (eigene Spur), `chroma` (beide Chroma-Laschen),
`bandVerlauf` mit Grenzfrequenz und Höhenkante, die ganze
Lautheitsrechnung nach EBU R128.

## Mit dem Rechenkern-Schnitt gegenstandslos geworden

Fünfzehn Befunde beschreiben Größen, die es seit dem 25.08.2026 nicht
mehr gibt. Sie sind nicht repariert worden — sie sind mit ihren Karten
und ihrer Rechnung gefallen, weil aus falschen Zahlen nichts Richtiges
zu machen war und niemand sie mehr las:

  **18** · Centroid im Index stammt aus einem einzigen 43-ms-Fenster bei 30 % der Spieldauer
  **19** · Rolloff summiert Amplituden statt Leistung - unter dem gemeldeten Wert liegen 94 bis 99 % der Energie, nicht 85 %
  **20** · Akkordwechsel/s zählt Rahmenflimmern und hängt an der Schrittweite der FFT-Runde
  **21** · Textur-Index steht bei 286 von 321 Songs auf 100 %, weil die Akkordrate die Formel sprengt
  **22** · Inharmonizität kann nicht messen, was sie heißt: das Suchfenster ist immer genau ein Bin breit
  **24** · Harmonische Dichte antwortet umgekehrt: weißes Rauschen 15,8 statt ~0, reiner Sinus 5,0 statt 1
  **25** · Attack bleibt bei 297 von 321 Songs leer; die 24 gefüllten Werte gehen bis 19 Sekunden auf einer 0-500-ms-Skala
  **26** · Die Tempo-Karte zeigt den schlechtesten der drei Schätzer, der Erklärungstext nennt ihn den robustesten
  **27** · Tonhöhe wird auf ein Raster von 23,4 Hz gerundet - nur 15 verschiedene f0-Werte für 321 Songs
  **28** · Der f0-Median wird über alle Fenster gebildet, auch über die rein instrumentalen
  **31** · Die Tonhöhenspur hat 46,9 Hz Auflösung, und der Hilfetext beschreibt eine Funktion, die es nicht gibt
  **46** · Spektral-Tilt stellt 10 Bass-Bins gegen 469 Höhen-Bins - rosa Rauschen gilt als treblelastig
  **48** · Noten-Stabilität wird durch den längsten Lauf DESSELBEN Songs geteilt und ist deshalb zwischen Songs nicht vergleichbar
  **50** · Harmonizität ist mit Faktor 4 überstreckt und steht bei 70 % der Rahmen am Anschlag
  **52** · Lücken in der Tonhöhenspur werden mit erfundenen Werten gefüllt

Die Belege stehen weiter in der Historie (Commits `4518334` für die
Anzeigeseite und `fcc9354` für den Rechenkern) und, wo sie eine
Entscheidung tragen, als Kommentar an der Stelle, wo die Rechnung stand.
Der Sammelkommentar an der Stelle von `SA_TOT` nennt für jede der zehn
Karten in einer Zeile, was an ihr falsch war.

**Ausdrücklich NICHT erledigt** sind zwei, die in derselben Suche
auftauchten: Befund **49** (fast alles wird nur aus dem linken Kanal
gerechnet — `var ch = left` steht unverändert in `analyzer-worker.js`:572
und trägt weiterhin Hüllkurve, Anschläge und Energierahmen) und Befund
**61** (Stereobreite richtig gerechnet, aber als Prozentwert
beschriftet).

## Alle Funde, nach Schwere

### 12. Es gibt kein R und kein L+R — magR wird gerechnet und weggeworfen
**mittel** · `analyzer-worker.js`:943, `bin/vorrechnen.js`

**Fehler:** Der Rechenkern bildet in jedem Rahmen `magR`, das Spektrum des rechten Kanals (`analyzer-worker.js`:943), benutzt es aber nur für die Seitenlage und wirft es dann weg. Abgelegt werden je Song genau zwei Bilder: `<id>.spektro.webp` (linker Kanal) und `<id>.stereo.webp` (Seitenlage). Der rechte Kanal für sich und die Summe beider gibt es nirgends. Dazu stimmt der Kommentar „spectro (mono)" an Zeile 945 nicht: `var ch = left` (Befund 34), es ist der linke Kanal allein — die Beschriftung im Analyzer sagt das seit dem 25.08.2026 auch so.

**Wirkung:** Caspar_Ds Wunsch nach vier Registern (L, R, L+R, Seitenlage) ließ sich am 25.08.2026 nur zur Hälfte erfüllen. Es sind die zwei vorhandenen Bilder geworden.

**Vorschlag:** Der Weg ist kurz, weil die Bildmathematik schon geteilt ist: `bin/vorrechnen.js` lädt `web/fremd/analyzer-worker.js` mit `new Function` und rechnet dieselben Bildpunkte, die der Browser rechnen würde — es gibt keine zweite Fassung, die auseinanderlaufen könnte. Zwei weitere Bilder je Song, `<id>.rechts.webp` und `<id>.summe.webp`, und der Analyzer lädt sie wie die anderen beiden. Eigene Meßreihen braucht es dafür nicht: Aus dem linken Kanal und der Seitenlage `p` folgt `|R| = |L|·(1−p)/(1+p)` und `|L|+|R| = 2·|L|/(1+p)`, bei einer Auflösung von 1/127 für p mit einem Fehler unter 0,2 dB. Kosten: rund 5 MB je Song mehr in `library/analyse/`.

**Berichtigung (25.08.2026):** Hier stand zuerst, die Spektrogramm-Rahmen seien nach dem Zeichnen weg und deshalb liefe der Zoom ins Leere. Das erste stimmt — `window._chartData.fft.frames` ist bei aus der Ablage geladenen Songs undefiniert —, das zweite nicht: Genau für diesen Fall gibt es den `ohneRoh`-Zweig in `_drawSpectrogramFromFrames` (`analyzer.js`:6801). Er zeichnet aus `window._pufferFlaechen`, den Flächen aus den gespeicherten Bildern, und zwar ausschnittweise nach `viewStart`/`viewEnd` — der Zoom arbeitet also über die Bilder, in mehreren Auflösungsstufen bis 16383 px Breite. Daß die Rohdaten nach dem Zeichnen fallen, ist Absicht und kein Fehler.

### 29. Die untere Suchgrenze liegt faktisch bei 93,75 Hz statt bei den beabsichtigten 80 Hz
**mittel** · `analyzer-worker.js`:779

**Fehler:** Math.ceil(80·2048/48000) = ceil(3,413) = 4, und Bin 4 entspricht 93,75 Hz. Die Schleife kann also nie einen Wert unter 93,75 Hz liefern, obwohl im Quelltext 80 steht. Am oberen Ende dasselbe Muster: k < floor(500·2048/48000) = 21, höchster erreichbarer Wert 468,75 Hz — die Prüfung hpsF0<500 in Zeile 790 ist dadurch wirkungslos.

**Beleg:** Über alle 321 Songs ist 94 Hz der kleinste je aufgetretene Wert (37 Songs), und kein Wert liegt darüber hinaus über 305 Hz. Rechnerisch nachgeprüft: die erreichbare Wertemenge im Bereich 80–500 Hz ist 93,75 / 117,19 / 140,63 / … / 468,75.

**Wirkung:** Ein tiefer Bariton kann grundsätzlich nicht richtig gemessen werden: G2 = 98 Hz liegt gerade eben im Raster, F2 = 87 Hz und E2 = 82 Hz sind unerreichbar und werden nach oben auf 93,75 Hz gezogen. Caspar_Ds eigene Stimmlage sitzt genau an dieser Kante.

**Vorschlag:** Die Grenze aus der gewünschten Frequenz herunterrechnen und abrunden statt aufrunden, oder — wirksamer — das Fenster vergrößern, damit 80 Hz überhaupt auf einem Bin liegt. Bei 2048 Punkten und 48 kHz gibt es unterhalb von 100 Hz nur vier Stützstellen; für Tonhöhe in Stimmlage ist das zu wenig.

### 30. Die Schwellen 0,42 und 0,58 sind nicht auf die Verteilung geeicht, die das Verfahren tatsächlich erzeugt
**mittel** · `analyzer-worker.js`:813

**Fehler:** ratio = femaleScoreSum/(male+female) wird in Zeile 812 gebildet und in Zeile 813/814 an 0,58 und 0,42 geschnitten. Die Schwellen sind symmetrisch um 0,5 gesetzt, als läge die Verteilung dort. Sie tut es nicht: die Punktevergabe in Zeile 789–795 ist durch den Bandterm nach unten verschoben. Damit trennt 0,42 nicht „männlich von unentschieden", sondern schneidet mitten durch die Häufung.

**Beleg:** Über alle 321 Songs: ratio-Median 0,430 — also praktisch auf der unteren Schwelle. 10 %-Punkt 0,341, 90 %-Punkt 0,546, Maximum 0,666. Nur 20 Songs überschreiten 0,58. Nach Sollwert getrennt: Songs mit weiblicher Stimmangabe haben ratio-Median 0,494, Songs mit männlicher 0,422 — der Abstand beträgt 0,072, das mittlere Fenster „gemischt" ist mit 0,16 mehr als doppelt so breit. Folge: 159 von 321 Songs landen in „gemischt", darunter 55 von 109 eindeutig männlichen.

**Wirkung:** Die Kategorie „gemischt" ist keine Aussage über ein Duett, sondern der Auffangbehälter für die Mitte der Verteilung. Von 6 Songs, deren Stilangabe ausdrücklich ein Duett nennt, wird keiner deswegen erkannt.

**Vorschlag:** Solange kein tragfähiges Merkmal darunterliegt, keine Schwellen nachjustieren — das verschöbe nur den Fehler. Wenn das Merkmal steht, die Schwellen an den 33 weiblichen und 109 männlichen Stücken des Archivs ablesen statt setzen. „Gemischt" sollte aus zwei getrennt gefundenen Stimmen entstehen, nicht aus einem unentschiedenen Punktestand.

### 32. Das Ergebnis ist auf ein 10-ms-Lagraster gequantelt: nur 68 verschiedene BPM-Werte sind überhaupt möglich
**mittel** · `analyzer-worker.js`:699

**Fehler:** Die Hüllkurve hat 10 ms Schrittweite (envStep = floor(sr/100)), der Gipfel wird als GANZZAHLIGER Lag genommen, und bpm = 6000/bestL. Damit sind im ganzen Suchbereich nur die 68 Werte 6000/33 ... 6000/100 darstellbar. Der Scheitel wird nicht interpoliert (weder parabolisch noch durch eine feinere Hüllkurve), obwohl die Nachbarwerte der Kurve dafür bereits vorliegen.

**Beleg:** 321 Songs benutzen 67 verschiedene BPM-Werte (Skript batch.js). Rasterweite: 0,61 BPM bei 60, 2,45 BPM bei 120, 5,35 BPM bei 180. Bei den 171 als richtig geltenden Songs beträgt der Betragsfehler im Median 0,34 BPM, im Größtfall 4,97 BPM — reiner Rasterfehler. Der von Caspar_D genannte Wert 122,4 für "Mutterns Hände" ist exakt 6000/49, keine gerundete Messung.

**Wirkung:** Auch eine im Kern richtige Messung kann am oberen Ende des Bereichs um bis zu 2,7 BPM danebenliegen. Die Anzeige rundet auf ganze BPM und verbirgt, daß dazwischen nichts darstellbar ist.

**Vorschlag:** Den Scheitel parabolisch aus den drei Werten um bestL interpolieren; das kostet drei Zeilen und bringt die Auflösung auf deutlich unter 0,5 BPM.

### 33. Die Bereichsgrenze wird als Meßwert ausgegeben, und die obere Grenze ist nicht die beabsichtigte
**mittel** · `analyzer-worker.js`:697

**Fehler:** minL = Math.floor(6000/180) = 33 ergibt als schnellstes Tempo 6000/33 = 181,8 BPM, nicht die im Ausdruck genannten 180. Vor allem aber: Liegt das Maximum auf dem Rand des Suchfensters, wird der Randwert ausgegeben, als wäre er ein Gipfel — es gibt keine Prüfung, ob die Kurve dort noch steigt. Der Bereich ist damit das einzige, was die metrische Ebene festlegt, und er tut es stumm.

**Beleg:** Bei 11 von 321 Songs liegt bestL genau auf dem Rand: 9 mal Lag 100 (Ausgabe exakt 60,0 BPM) und 2 mal Lag 33 (181,8 BPM). "Stars of the deep" ist einer davon: Ausgabe 60,0 bei Suno 120,5; die Gipfel bei Lag 39, 25, 199, 98, 47 liegen mit 0,93 bis 0,97 fast gleichauf — die Entscheidung fällt an der Grenze, nicht an der Musik. Ein Song des Archivs ("Rosaroter Frühling", Suno 184,1 BPM = Lag 32,6) liegt vollständig außerhalb des darstellbaren Bereichs; der Kern gibt 122,4 aus, das sind 1,5 Schläge.

**Wirkung:** Neun Songs tragen den Wert 60,0 BPM, der nichts gemessen hat, sondern nur den Rand des Suchfensters benennt. Songs über 181,8 BPM sind grundsätzlich nicht darstellbar.

**Vorschlag:** Den Suchbereich weiter fassen (etwa 30..300 BPM) und die metrische Ebene ausdrücklich entscheiden, statt sie dem Fensterrand zu überlassen; einen Gipfel auf dem Rand verwerfen oder kennzeichnen.

### 34. Die gesamte Hüllkurve entsteht allein aus dem linken Kanal
**mittel** · `analyzer-worker.js`:576

**Fehler:** var ch = left. Daraus werden Hüllkurve, Anschläge, Tempo, Tonart, Stimmanalyse und die Energierahmen gebildet. Eine Monosumme (left+right)/2 gibt es nicht. Ein Schlagzeug, das nach rechts gelegt ist, wirkt dadurch mit deutlich geringerem Gewicht auf die Tempomessung ein, ein hart rechts liegendes Element gar nicht.

**Beleg:** Zeile 576 setzt ch=left; alle folgenden Rechnungen (Zeilen 668-880) greifen ausschließlich auf ch zu. Zum Vergleich: die Lautheitsmessung in Zeile 651 bekommt ordnungsgemäß left UND right. Die Stereobreite wird in Zeile 703 aus beiden Kanälen gerechnet, ist also im Archiv vorhanden — nur die Tempomessung nutzt sie nicht.

**Wirkung:** Die Anschlagsfolge, aus der das Tempo gewonnen wird, ist eine unvollständige Abbildung des Stücks. Bei breit abgemischten Stücken fehlt ein Teil der Ereignisse, die den Takt tragen — das verschlechtert genau jene Gipfelkontraste, an denen die Ebenenentscheidung ohnehin schon knapp scheitert.

**Vorschlag:** ch als (left+right)/2 bilden. Der Aufwand ist eine Zeile; alle abhängigen Größen werden dadurch nur besser gestützt.

### 35. Die Anschlagsfunktion ist die rohe Differenz einer linearen Betragshüllkurve — laute Stellen überstimmen den Takt
**mittel** · `analyzer-worker.js`:690

**Fehler:** diff[i] = max(0, env[i]-env[i-1]) auf einer LINEAREN Hüllkurve aus mittlerem Betrag. Damit ist der Beitrag eines Ereignisses proportional zu seiner Amplitude: Der laute Schlag auf 1 zählt ein Vielfaches des leisen auf 2. Genau das hebt die Takt- und Zweierebene über die Schlagebene und ist der Grund, warum der bloße Größtwert in Zeile 698 meistens die falsche Ebene trifft. Üblich wäre eine logarithmische oder wurzelkomprimierte Hüllkurve (relativer Anstieg), gern bandweise.

**Beleg:** Derselbe Weg, nur mit log-Hüllkurve gerechnet (Skript logenv.js, Monosumme, sonst identisch): "Erweckt v2" — Gipfel bei 1,00 / 2,01 / 3,99 / 3,01 Schlägen, Suno-Schlag auf Rang 1 (linear: Rang 1, aber Nachbarn dicht). "Erste Regentropfen" — Gipfel bei 1,01 / 2,00 / 0,50 Schlägen, Suno-Schlag Rang 1 statt Rang 2 mit dem 2-Schlag-Gipfel davor. "Rosaroter Frühling" — Gipfel sauber bei 3,99 / 1,99 / 1,50 / 2,52 Schlägen statt eines verschmierten Feldes. Die Ebenenstruktur wird durch die Kompression überhaupt erst erkennbar.

**Wirkung:** Die Autokorrelation bekommt ein Signal, in dem die metrischen Ebenen nach Lautstärke sortiert sind statt nach Regelmäßigkeit. Jede Gipfelwahl, die darauf aufsetzt, erbt diese Verzerrung.

**Vorschlag:** diff aus log(env+eps) bilden, oder die Hüllkurve in wenige Bänder teilen und die gleichgerichteten Anstiege summieren (spektraler Fluß). Beides ist wenige Zeilen und ändert am Rest des Wegs nichts.

### 36. Der Modus wird aus genau dem Chroma gebildet, das die Datei selbst für unbrauchbar erklärt
**mittel** · `analyzer-worker.js`:1137

**Fehler:** chromaSum kommt aus chromaFlat (Zeile 1091-1099), und das wird mit fftSize2 = 1024 gerechnet (Zeile 960). Der Kommentar direkt darunter, Zeile 1154-1158, sagt ausdrücklich: 'das 1024er-Chroma traegt ein Bin-Raster-Artefakt' und die Tonart dürfe deshalb NICHT daraus genommen werden. Genau dieses Chroma ist aber die einzige Grundlage des Modus-Zweigs zwölf Zeilen darüber. Die erkannte Schwäche wurde für die Tonart umgangen und für den Modus stehengelassen.

**Beleg:** Bei 48 kHz sind 1024 Fächer 46,9 Hz breit. Ein Fach entspricht einem Halbton erst ab 788 Hz; bei 80 Hz ist ein einziges Fach 9,9 Halbtöne breit. Von den rund 65 Halbtönen zwischen 80 und 4000 Hz werden überhaupt nur 44 verschiedene je getroffen. Die Fächerzahlen je Tonklasse schwanken von 4 (C, D) bis 9 (F#, A#). Das nackte Raster allein — ohne jeden Ton — ergibt im Modus-Zweig 'D# Äolisch' bei 48 kHz und 'E Lokrisch' bei 44,1 kHz.

**Wirkung:** Dass 265 von 321 Songs denselben Tonvorrat (B-Dur/g#-Moll) zugeschrieben bekommen, ist keine Eigenschaft des Archivs, sondern dieses Rasters. Der Modus wäre auch dann noch falsch, wenn der Schleifenfehler behoben würde.

**Vorschlag:** Den Modus aus demselben, sauber gebildeten Chroma rechnen wie die Tonart (4096 oder größer, Gipfel statt aller Fächer) statt aus dem 1024er-Verlaufschroma, das für die Spektrogramme gedacht ist.

### 37. Die Tonart wird nur aus dem linken Kanal geschätzt
**mittel** · `analyzer-worker.js`:576

**Fehler:** Zeile 576 setzt 'var ch=left', und Zeile 719 reicht dieses ch an schaetzeTonart(). Der rechte Kanal geht in die Tonart nicht ein. Bei breit aufgestellten Mischungen — und Suno stellt breit auf — trägt jede Seite eine andere Auswahl der Instrumente. Ein nach rechts gelegtes Instrument fehlt in der Harmonieauswertung ganz.

**Beleg:** An 16 Songs bei 44,1 kHz gemessen: bei 5 von 16 liefert der linke Kanal eine andere Tonart als die Mitte (L+R)/2, bei 2 von 16 unterscheiden sich linker und rechter Kanal direkt. Mutterns Hände: L=G Dur, R=D Dur, Mitte=D Dur. Stumm: L=A Moll, R=F Dur, Mitte=F Dur. Okkultation und Roßtrappe v2: L=A Moll, Mitte=F Dur. Belsazar: L=D Dur, Mitte=D Moll.

**Wirkung:** Rund ein Drittel der Tonartwerte hängt daran, welchen Kanal man nimmt. Das ist keine Eigenschaft der Musik, und es ist auch keine bewusste Entscheidung — 'ch=left' ist eine Abkürzung, die überall im Kern mitläuft.

**Vorschlag:** Für die Tonart die Mitte (left+right)/2 bilden. Das kostet einen Durchlauf und nimmt beide Seiten mit.

### 38. Alles unter 450 Hz ist unsichtbar — auch Netzbrummen bei Vollaussteuerung
**mittel** · `analyzer-worker.js`:528

**Fehler:** 'if(bv.mitten[b]<MIND_HZ) continue;' mit MIND_HZ=450 (Zeile 525) schließt 72 der 160 Bänder von der Suche aus. Damit fällt genau der Bereich weg, in dem der klassische stehende Ton sitzt: 50/60 Hz Netzbrummen und seine Vielfachen, Trittschall, Raumresonanzen. bin/stoerfrequenz.js sucht ab 30 Hz und hat eigens eine Brummen-Erkennung auf 50/60 Hz.

**Beleg:** Echter Song 'Morgen' (Referenz: sauber), ein durchgehender Sinus zugemischt und der Pegel in 3-dB-Schritten von −60 dBFS bis 0 dBFS hochgefahren: bei 50 Hz, 100 Hz, 200 Hz und 400 Hz wird auch bei 0 dBFS (Vollaussteuerung, also lauter als die Musik) NICHTS gemeldet. Ab 500 Hz greift der Kern bei −39 dBFS. 67 der 189 Kandidaten aus library/stoerfrequenzen.json liegen unter 450 Hz.

**Wirkung:** Die Anzeige meldet 'Keine Frequenz ragt dauerhaft aus ihrer Nachbarschaft heraus' (analyzer.js:1957) auch dann, wenn ein voll ausgesteuertes Brummen im Song steht.

**Vorschlag:** MIND_HZ auf etwa 30 Hz senken. Das setzt Befund 1 voraus: mit N=4096 sind die Bänder unter 250 Hz schmaler als ein Bin (siehe Befund 9), erst eine feinere FFT macht den Tiefton überhaupt messbar.

### 39. An einer Spektrumskante mittelt medianVon zwei Welten — ein Phantomton bei 15106 Hz
**mittel** · `analyzer-worker.js`:489

**Fehler:** Die Nachbarschaft besteht aus genau 10 Bändern (Zeile 532-536: d=−6..+6 ohne |d|≤1), also einer geraden Anzahl. medianVon() mittelt dann den 5. und den 6. Wert (Zeile 489). Fällt das Spektrum in der Nachbarschaft steil ab — bei einer MP3-Tiefpasskante liegen die fünf oberen Nachbarn 40 dB unter den fünf unteren —, so sind der 5. und der 6. Wert genau die beiden Werte diesseits und jenseits der Kante. Der 'Nachbarschaftspegel' wird zum arithmetischen Mittel zweier Pegel, die nichts miteinander zu tun haben, und liegt bei keinem der beteiligten Bänder.

**Beleg:** 'Wolkenbruch' (c2d89acc), audio.mp3: der Kern meldet 15106 Hz als STÄRKSTEN stehenden Ton, +20,1 dB in 82 % der Rahmen, schwere 1,00 (rot). Im Feinspektrum steht dort nichts: stärkste Linie 14987 Hz mit +2,1 dB. Das mittlere Bandspektrum fällt an der Stelle monoton: 14468 Hz −26,0 · 15106 Hz −27,2 · 15773 Hz −27,9 · 16469 Hz −33,0 dB. In 100 % der zählenden Rahmen ist der 5. Wert ein Band oberhalb der Kante und der 6. eines unterhalb, z. B. Rahmen 0: Band 15106 Hz = −32 dB, 5. Wert 17954 Hz = −73 dB, 6. Wert 13271 Hz = −29 dB → 'Nachbarschaft' = −51 dB → Hervorhebung +19,0 dB. In 18 von 26 geprüften MP3s tritt derselbe Phantomton auf, im Mittel mit +20,0 dB angezeigt bei +1,6 dB echter Hervorhebung.

**Wirkung:** Auf verlustbehaftetem Material erzeugt das Verfahren einen Spitzenbefund, wo kein Ton ist — und zwar mit dem höchsten Schweregrad, also ganz oben in der Liste. Reichweite: bin/vorrechnen.js liest audio.wav, wenn vorhanden (alle 321 Songs haben eine), dort fehlt die Kante und der Phantomton bleibt aus; im Browser trifft es jede eingeworfene MP3-Datei. Zur Kontrolle nachgerechnet: derselbe Song über audio.wav meldet 15106 Hz nicht, über audio.mp3 sowohl bei 44,1 als auch bei 48 kHz.

**Vorschlag:** Die Nachbarschaft auf eine ungerade Anzahl bringen (echter Median statt Mittelwert zweier Werte) und Bänder oberhalb der ermittelten Grenzfrequenz — grenzfrequenz() rechnet sie ohnehin, Zeile 497 — aus der Nachbarschaft ausschließen.

### 40. Gemeldet wird die Bandmitte, nicht die gemessene Frequenz — bis 63 Cent daneben
**mittel** · `analyzer-worker.js`:557

**Fehler:** 'befunde.push({hz:bv.mitten[b], ...})' schreibt die geometrische Mitte des Bandes in den Befund. Ein Band ist 4,4 % breit (0,75 Halbtöne); die tatsächliche Lage der Linie im Band bleibt ungemessen. Die Oberfläche druckt die Zahl gerundet in Hertz (analyzer.js:1941) und gibt dazu einen Filterrat ('−2 bis −3 dB', analyzer.js:1945) — eine Genauigkeit, die die Messung nicht hat.

**Beleg:** 139 Befunde gegen das Feinspektrum: Abweichung der Bandmitte von der wirklichen Linie im Median 17 Cent, im 90.-Perzentil 44 Cent, größte 63 Cent — mehr als ein halber Halbton. 'Points of Light': angezeigt 675 Hz, tatsächlich 659,5 Hz (E5). 'Erste Regentropfen': angezeigt 478 Hz, tatsächlich 465,7 Hz. 'Die Gedanken ...': angezeigt 802 Hz, tatsächlich 786,0 Hz.

**Wirkung:** Ein schmaler Filter auf die angezeigte Frequenz träfe den Ton nicht — bei 675 statt 659,5 Hz liegt er um mehr als die halbe Bandbreite daneben. Der Rat, der neben der Zahl steht, ist damit nicht ausführbar.

**Vorschlag:** Die Linie im Band durch Interpolation der drei stärksten FFT-Bins bestimmen und diese Frequenz melden (bin/stoerfrequenz.js meldet den Bin auf 0,1 Hz und dazu Notennamen und Cent-Abweichung).

### 41. Schwankungsbreite: Kurzzeitwerte nur einmal je Sekunde statt zehnmal
**mittel** · `analyzer-worker.js`:283

**Fehler:** Die Kurzzeitwerte fuer die LRA entstehen mit 3-s-Fenster und 1-s-Schritt: 'var eS=fensterEnergien(summe,n,Math.round(sr*3),Math.round(sr*1));'. Der Kommentar darueber behauptet, so verlange es EBU Tech 3342. Der Kurzzeitwert ist aber ein Zeiger, der mindestens zehnmal je Sekunde nachgefuehrt wird (EBU Tech 3341, worauf 3342 aufsetzt); libebur128 und damit ffmpeg rechnen ihn mit 100 ms Schritt. Mit 1 s Schritt bleiben von einem 135-Sekunden-Stueck nur 132 Kurzzeitwerte uebrig, und das 10. und das 95. Perzentil werden aus einer viel zu duennen Stichprobe gezogen. Falsch gedacht ist die Gleichsetzung 'minimale Ueberlappung = Vorschrift': 1 s ist die groebste noch zulaessige Abtastung des Zeigers, nicht die vorgeschriebene.

**Beleg:** 74eac426 'Wenn Du da bist ...': Kern 5,42 LU, ffmpeg ebur128 6,0 LU (LRA low -18,6 / high -12,6). Ursache nachgewiesen, indem im nachgebauten Rechenweg NUR der Schritt geaendert wurde: 1 s -> 5,42 LU (132 Werte), 100 ms -> 5,93 LU (1320 Werte). Tor und Perzentilformel blieben gleich, die Tore stimmen bei diesem Song sogar exakt ueberein (Kern -34,62, Norm -34,67; 132 von 132 Werten kommen bei beiden durch). Weitere Faelle: e64fd557 'Das Lied vom Rotmilan' 10,43 statt 10,61; f9d30e44 'Im Club - Sie tanzt' 5,08 statt 5,24; 96a0f525 'Morgendaemmerung' 3,97 statt 4,09. Ueber alle 321 gespeicherten Analysen gegen ffmpeg: max 0,58 LU, 95 % der Songs <= 0,24 LU, Median 0,06 LU.

**Wirkung:** Die angezeigte Schwankung faellt systematisch zu klein aus, weil die Extreme der Kurzzeitkurve zwischen den Stuetzstellen liegen bleiben. Bei einem von 321 Songs liegt die Abweichung ueber der Fundgrenze von 0,5 LU. Da die Schwankung im Register als Dynamikmass gegen den Crestfaktor gestellt wird ('Sie ist das bessere Dynamikmass'), traegt genau die Zahl, die als die verlaesslichere angepriesen wird, den groessten Fehler der drei Normwerte.

**Vorschlag:** Den Schritt fuer die LRA-Kurve auf Math.round(sr*0.1) setzen. Die kumulierte Summe liegt schon da, es kostet nur zehnmal so viele Subtraktionen; die Anzeigekurven laufen ohnehin mit 20 ms. Dann in bin/pruefe-lautheit.js einen Fall gegen ffmpeg aufnehmen, nicht nur gegen ein selbstgebautes Wechselsignal - der bestehende Test ('Wechsel -20/-30 dBFS', Toleranz 1,0 LU) ist zu grob, um 0,58 LU zu fangen.

### 42. Schwankungsbreite: relatives Tor am integrierten Wert statt am Mittel der Kurzzeitwerte
**mittel** · `analyzer-worker.js`:293

**Fehler:** 'var torL=Math.max(-70,integriert-20);'. Das relative Tor der LRA gehoert 20 LU unter das UNGEGATETE Mittel der Kurzzeitwerte, die das absolute Tor passiert haben. Der Kern nimmt statt dessen die integrierte Lautheit - und die ist selbst schon bei -10 LU gegated, liegt also immer hoeher als jenes Mittel, und zwar umso hoeher, je mehr leise Stellen ein Stueck hat. Das LRA-Tor liegt damit systematisch zu hoch und schneidet leise Kurzzeitwerte weg, die dazugehoeren. Der Kommentar zwei Zeilen darueber schreibt die falsche Regel ausdruecklich hin: 'Tor bei -70 und bei zwanzig LU unter dem integrierten Wert'.

**Beleg:** Testsignal, 60 s, zwei Musikpegel ohne digitale Stille: 24 s Rauschen bei -42 dBFS, dann 36 s bei -20 dBFS. Kurzzeitwerte des leisen Teils: -40,6 LUFS. Integriert -18,59 LUFS, Mittel der Kurzzeitwerte -20,74 LUFS. Tor Kern = -38,59 -> alle 22 leisen Werte fallen heraus, es bleiben 36 von 58, und LRA wird 0,00 LU. Tor nach Norm = -40,74 -> alle 58 Werte bleiben; ffmpeg meldet genau dieses Tor ('Threshold: -40,7 LUFS') und LRA 22,0 LU (low -40,6, high -18,6). Differenz 22 LU. Auf dem heutigen Bestand schlaegt es nicht durch: bei Okkultation liegen beide Tore bei -34,2, bei Pasta al Limone -34,3 gegen -34,6; ueber 321 Songs bleibt der Beitrag dieses Fehlers unter 0,1 LU, weil kein Suno-Master eine Stelle 20 LU unter seiner eigenen Lautheit hat.

**Wirkung:** Solange alle Songs durchkomprimiert sind, faellt der Fehler nicht auf. Sobald ein Stueck ein wirklich leises Intro, eine Zwischenstille oder einen langen Ausklang hat, kippt die Zahl - und zwar nicht ein bisschen, sondern auf null: Die Schwankungsbreite meldet 'keine Schwankung' genau fuer die Stuecke, die am meisten schwanken.

**Vorschlag:** Das Tor aus den Kurzzeitwerten selbst bilden: Mittel der ENERGIEN aller Kurzzeitbloecke mit lu > -70, davon lu() und minus 20. Beide Tore lassen sich in bin/pruefe-lautheit.js mit dem obigen Zweipegel-Signal pruefen; der jetzige Test enthaelt keinen Fall, bei dem sich die beiden Definitionen unterscheiden.

### 43. momentanMax und kurzMax sind in allen 321 gespeicherten Analysen NaN
**mittel** · `analyzer-worker.js`:344

**Fehler:** 'momentanMax:momentan.length?Math.max.apply(null,Array.prototype.slice.call(momentan)):-100'. Die Kurve 'momentan' kommt aus fensterEnergienMitte(), und das schreibt an beiden Raendern absichtlich NaN hinein (Zeile 186: 'if(a<0||b>anzahl){ aus.push(NaN); continue; }'). Math.max mit auch nur einem NaN im Feld liefert NaN. Der Groesstwert ist damit nicht 'manchmal' kaputt, sondern immer. Falsch gedacht ist die Ursachensuche: In web/fremd/analyse-ablage.js:119-131 steht als Erklaerung 'ein Song ohne einen einzigen Block ueber dem Tor hat keinen Groesstwert, und -Infinity ist die richtige Antwort darauf' - das trifft auf keinen dieser Songs zu. Repariert wurde deshalb nur das Symptom (NaN wird als {__z:'NaN'} verpackt, damit JSON nicht daran erstickt), nicht der Rechenweg.

**Beleg:** Alle 321 Dateien in library/analyse/*.bin tragen momentanMax und kurzMax als {"__z":"NaN"} - ausgezaehlt ueber die Kopfsaetze. Frisch nachgerechnet an f76a6706 'Okkultation': momentan[0..4] = NaN NaN NaN NaN NaN, momentanMax = NaN; die richtigen Groesstwerte waeren momentan -11,60 LUFS und kurz -12,26 LUFS. Ebenso an 2db520f3 'Pasta al Limone' (richtig waeren -9,14 und -9,88) und am synthetischen Testton.

**Wirkung:** Zwei Kennzahlen, die der Kern in jeder Normnachricht mitschickt und die in jeder der 321 Ablagen liegen, sind im ganzen Archiv unbrauchbar. Angezeigt wird derzeit keine von beiden (kein Leser in web/ oder bin/), der Fehler ist also stumm - aber er ist gespeichert, und die naechste Anzeige, die den Groesstwert der Momentanlautheit braucht, bekommt NaN.

**Vorschlag:** Den Groesstwert ueber die endlichen Werte bilden, etwa in einer Schleife mit isFinite()-Pruefung statt Math.max.apply. Das nimmt zugleich das Risiko, dass Math.max.apply bei langen Kurven an die Argumentgrenze stoesst.

### 44. Die Karten 'Lautheit dB' und 'Dynamik dB' messen nur den linken Kanal
**mittel** · `analyzer-worker.js`:673

**Fehler:** Ab Zeile 576 gilt 'var ch=left', und alles, was danach ohne K-Bewertung gerechnet wird, sieht nur diesen einen Kanal: 'var sumSq=0,peak=0; for(...){sumSq+=ch[i]*ch[i]; ... }' und 'var rms=Math.sqrt(sumSq/n), loudness=..., dynamic=20*Math.log10(peak+1e-10)-loudness;' (Zeilen 673-675). Genauso die 400-ms-Effektivwertreihe (682), die Signalenergie (679), die Crestkurve (686) und damit das Lautheitshistogramm. Die Spitze, gegen die die Dynamik gemessen wird, ist die Spitze des LINKEN Kanals - die des Stuecks kann rechts liegen. Zwei Meter im selben Werkzeug messen verschiedene Dinge: 'Lautheit LUFS' und 'True Peak dBTP' nehmen beide Kanaele, 'Lautheit dB' und 'Dynamik dB' nur einen.

**Beleg:** Je Kanal gemessen mit ffmpeg astats ueber 297 Songs. Groesster Spitzenunterschied: b78b446a 'Ulrich & Aennchen', Spitze links -4,67 dBFS, rechts -3,27 dBFS - die Karte 'Dynamik dB' zeigt 15,19 dB, richtig ueber beide Kanaele sind 16,55 dB (1,36 dB zu wenig). 6fa72e1a 'Der Wagen des Lebens' 11,75 statt 12,22. Groesster Effektivwertunterschied: de831507 'Grillabend - Neues Spiel', links -17,66 dB, rechts -16,30 dB - die Karte 'Lautheit dB' zeigt -17,66 dB, richtig sind -16,93 dB (0,73 dB zu leise). Ueber alle 297: Spitzenfehler bis 1,40 dB, Effektivwertfehler bis 1,16 dB, Median jeweils 0,00 bzw. 0,07 dB.

**Wirkung:** Bei mittiger Abmischung faellt es nicht auf (Median praktisch null), aber genau bei den Stuecken mit breitem Stereobild - also dort, wo man auf die Dynamik schaut - liegt die angezeigte Dynamik bis 1,4 dB daneben, und sie liegt immer zu NIEDRIG, weil die hoehere der beiden Kanalspitzen nie gesehen wird. Der Hinweistext zur Karte ('Normalbereich 6-16 dB', analyzer.js:7556) urteilt damit ueber eine halbe Messung.

**Vorschlag:** Fuer Spitze und Effektivwert beide Kanaele zusammenfassen (Spitze = Maximum ueber beide, Effektivwert = Wurzel aus dem Mittel beider Leistungen), so wie es lautheitNachNorm() und echteSpitze() bereits tun.

### 45. Stille-Maske vergleicht einen Effektivwert mit einer Leistung
**mittel** · `analyzer-worker.js`:726

**Fehler:** 'var energyP5=energySorted[p5idx]*3;' - energy[] ist die MITTLERE LEISTUNG je 50 ms (Zeile 680: 'energy[i]=s/eStep' mit s als Summe der Quadrate). Verglichen wird dieser Schwellwert an zwei Stellen mit einem EFFEKTIVWERT: Zeile 830 'wEnergy=Math.sqrt(wEnergy/bwinLen); if(wEnergy<energyP5)' und Zeile 855 ebenso. Quadrat gegen Wurzel - die beiden Seiten haben verschiedene physikalische Einheiten, der Schwellwert bedeutet nichts. Bei den hier vorkommenden Pegeln liegt die Leistung immer weit unter dem Effektivwert, die Maske greift deshalb nie.

**Beleg:** f76a6706 'Okkultation': energyP5 = 1,130e-2, die Fensterwerte wEnergy liegen zwischen 6,242e-2 und 1,761e-1 - 0 von 347 Fenstern werden maskiert. 4330f509 'Pfeifenwald': 2,634e-2 gegen 6,810e-2 .. 2,523e-1, 0 von 307. 4bcefa30 'Farben v2': 4,560e-3 gegen 8,024e-2 .. 2,138e-1, 0 von 289. bd235107 0 von 273, 80d81627 0 von 249.

**Wirkung:** Die Stille-Maske der beiden BPM-Kurven ist tot. Leise Stellen werden nicht ausgenommen, sondern voll mitgerechnet - dort schaetzt die Autokorrelation auf Rauschen und liefert einen Wert, der wie ein Messwert aussieht. Genau die NaN-Luecken, die die Kurve ehrlich machen wuerden, entstehen nie.

**Vorschlag:** Beide Seiten auf dieselbe Einheit bringen - entweder wEnergy nicht wurzeln, oder energyP5 aus Math.sqrt(energySorted[p5idx]) bilden. Der Faktor 3 gehoert dabei neu bemessen: auf den Effektivwert angewandt wuerde er in den geprueften Songs umgekehrt fast alles maskieren.

### 47. Grenzfrequenz ist bei 19,57 kHz gedeckelt und kennt nur 12 verschiedene Werte; 242 von 321 Songs liegen am Deckel
**mittel** · `analyzer-worker.js`:508

**Fehler:** Gesucht wird das oberste der 160 logarithmischen Bänder, das noch über 'Bezug minus 50 dB' liegt, und zurückgegeben wird die MITTENFREQUENZ dieses Bandes ('var grenze=bv.mitten[BAENDER-1]' als Startwert). Weil BAND_BIS in Zeile 444 auf 20000 festgelegt ist, ist die oberste Bandmitte 19572,9 Hz - mehr kann die Funktion nie melden, auch wenn das Signal bis zur halben Abtastrate reicht. Bei 48 kHz Abtastrate wären das 24 kHz. Der Deckel liegt also unter dem, was das Material tatsächlich enthält.

**Beleg:** Über alle 321 Songs gibt es nur 12 verschiedene Werte (10694, 11659, 12710, 13271, 14468, 15106, 15773, 16469, 17195, 17954, 18746, 19573 Hz), und 242 davon (75 %) melden exakt 19572,9 Hz - den Höchstwert. Prüfung mit selbst erzeugten MP3s aus demselben Song: bei 64 kbit/s meldet der Kern 11,2 kHz (echte Kante 11,2), bei 96 kbit/s 15,1 (echt 14,9), bei 128 kbit/s 16,5 (echt 16,0) - das funktioniert. Bei 320 kbit/s meldet er 19,6 kHz (echte Kante 20,1) und beim unkomprimierten WAV ebenfalls 19,6 kHz (echte Kante 24,0). Über 19,6 kHz kann er MP3 und WAV nicht mehr unterscheiden.

**Wirkung:** Für drei Viertel der Sammlung steht auf der Karte dieselbe Zahl, und sie sagt nur 'irgendwo über 19,6 kHz'. Gerade der Fall, für den die Karte gedacht ist - erkennen, ob eine Datei bandbegrenzt ist -, ist bei Caspar_Ds 48-kHz-Material der ungeprüfte.

**Vorschlag:** BAND_BIS an die halbe Abtastrate koppeln statt fest auf 20000, und statt der Bandmitte die interpolierte Stelle des Schwellwertdurchgangs melden. Dann steht am oberen Ende 24,0 kHz für 'nicht begrenzt' und die Auflösung ist nicht mehr auf 12 Stufen beschränkt.

### 49. Fast alle Messgrößen werden nur aus dem linken Kanal gerechnet
**mittel** · `analyzer-worker.js`:576

**Fehler:** 'var ch=left, n=ch.length, dur=n/sr;' - danach benutzen Hüllkurve, Energie, BPM, Centroid, Rolloff, Tonart, Struktur, Stimmanalyse und alle FFT-Runden ausschließlich 'ch', also den linken Kanal. Nur Lautheit, True Peak, Stereobreite und Phasenkorrelation sehen beide Kanäle. Bei breit abgemischtem Material ist der linke Kanal aber nicht das Stück, sondern eine Hälfte davon; die Mitte (L+R)/2 wäre der übliche Bezug und für die Klangfarbe auch der richtige.

**Beleg:** Kanäle getauscht und dieselbe Analyse noch einmal laufen lassen: '1 Unter der Haut IV' (Stereobreite 0,77) meldet Tonart 'D Moll' aus dem linken und 'G Moll' aus dem rechten Kanal, Centroid 874 gegen 977 Hz (11,7 % Unterschied). 'Ich betrachte uns' (Breite 0,50): Tonart 'C# Dur' gegen 'A# Moll', Centroid 2002 gegen 2295 Hz (14,6 %). Bei mittigem Gesang ('Ulrich & Ännchen') bleibt alles gleich.

**Wirkung:** Bei breit abgemischten Stücken hängt die gemeldete Tonart davon ab, welcher Kanal zuerst kommt. Das erklärt einen Teil der Tonart-Streuung, die sonst als Ratefehler des Verfahrens erscheint.

**Vorschlag:** 'var ch' aus der Mitte bilden: ch[i] = (left[i]+right[i])/2. Das ist eine Zeile und ändert nichts an den geprüften Normwerten, weil die ohnehin beide Kanäle nehmen.

### 51. Die BPM-Autokorrelation kennt nur 68 mögliche Ergebnisse und ist nicht auf die Überlappungslänge normiert
**mittel** · `analyzer-worker.js`:697

**Fehler:** Gerechnet wird auf einer Hüllkurve mit 100 Werten je Sekunde, die Verschiebung läuft ganzzahlig von 33 bis 100, und das Tempo ist bpm=6000/bestL. Damit gibt es genau 68 darstellbare Tempi zwischen 60,0 und 181,8 BPM; bei 180 BPM liegen die Nachbarwerte 5,4 BPM auseinander. Außerdem summiert 'for(var i=0;i<diff.length-lag;i++)' bei großen Verschiebungen über weniger Glieder als bei kleinen, ohne durch die Anzahl zu teilen - das bevorzugt systematisch kurze Verschiebungen, also hohe Tempi.

**Beleg:** Alle 321 BPM-Werte in library/analyse-index.json sind exakt 6000/ganze Zahl; es kommen nur 67 verschiedene Werte vor. Gegen Sunos Schlagzeiten (306 taktfeste Songs): 165 richtig (53,9 %), 56 im halben Tempo, 21 im doppelten, 47 auf einem anderen Bruchteil, 17 völlig daneben. Beispiel für die Rasterwirkung: 'Das Bild - Ich komme' hat laut Suno 141,4 BPM; das Raster kennt nur 142,86 (Lag 42) und 146,34 (Lag 41), gemeldet wird 146,3.

**Wirkung:** Selbst wo das Verfahren den richtigen Schlag findet, ist der Wert auf ein grobes Raster gerundet; eine Sortierung nach Tempo bringt Songs mit 3 BPM Unterschied in dieselbe Stufe.

**Vorschlag:** Den Gipfel der Autokorrelation zwischen den ganzzahligen Verschiebungen interpolieren und die Summe durch die Anzahl der Glieder teilen. Beides zusammen ist ein Dutzend Zeichen und behebt Raster und Schieflage.

### 53. Die Onset-Reihe zählt mit einer absoluten Schwelle und mißt damit Pegel, nicht Anschläge
**niedrig** · `analyzer-worker.js`:692

**Fehler:** if(diff[j]>0.01) — eine feste Schwelle auf die Differenz einer nicht normierten Amplitudenhüllkurve. Ob ein Rahmen als Anschlag zählt, hängt damit an der Aussteuerung der Datei, nicht an der Musik. Außerdem wird nicht auf Gipfel geprüft: gezählt wird jeder der 50 Zehn-Millisekunden-Rahmen einer halben Sekunde, dessen Hüllkurve gestiegen ist. Die Obergrenze der Reihe ist dadurch 50 je Sekunde.

**Beleg:** Aus den abgelegten Analysen aller 321 Songs (Skript onsets.js): Die Korrelation der mittleren Onset-Dichte mit der Lautheit (LUFS) beträgt r = 0,616. Die höchsten Dichten im ganzen Archiv haben die Naturaufnahmen ohne jeden Anschlag: "Murmelnder Bach" 36,1/s, "Wolkenbruch" 38,4/s, "Wind im Wald" 34,3/s — bei einer theoretischen Obergrenze von 50/s. Also werden dort drei von vier Rahmen als Anschlag gezählt.

**Wirkung:** Die Kurve "Anschläge je Sekunde" ist bei rauschhaftem Material am höchsten und bei klarem Schlagzeug niedriger. Als Anschlagsmaß ist sie nicht brauchbar; als Lautheitsmaß ist sie überflüssig, weil die Lautheit daneben nach Norm gemessen wird.

**Vorschlag:** Auf Gipfel prüfen statt auf Anstiege, und die Schwelle relativ setzen (etwa Median plus ein Vielfaches der Streuung der diff-Reihe des Stücks).

### 54. Der zweite Kandidat wird gerechnet, erreicht die Karte aber nie — und seine Schwelle ist eine Verhältnisschwelle auf einem Korrelationswert
**niedrig** · `analyzer-worker.js`:721

**Fehler:** Zeile 721 setzt tonartZweiteNah = (zweiteScore > score*0.9), Zeile 1159-1160 baut daraus 'X / Y' und schickt es als fft_partial.key. Die Karte schreibt die Tonart aber ausschließlich aus dem scalars-Zweig (analyzer.js Zeile 5592), und der trägt bestKey ohne Zusatz — der Kommentar in analyzer.js Zeile 5715-5722 verbietet die zweite Schreibstelle ausdrücklich. Der zweite Kandidat ist damit toter Code. Unabhängig davon ist die Schwelle schief: score ist eine Pearson-Korrelation, also eine Intervallskala. Ein Zehntel davon bedeutet bei score=0,25 einen Abstand von 0,025 und bei score=0,89 einen von 0,089 — dieselbe Bedingung heißt je nach Song etwas anderes.

**Beleg:** An 40 Songs gemessen liegt der zweite Kandidat bei 16 von 40 innerhalb der 10 %; die Spanne von score reicht von 0,25 bis 0,89. In keiner der 321 abgelegten Analysen steht ein Wert mit '/'. Beispiele aus dem Nachrechnen: S-Bahn - Ausstieg rechts F# Dur r=0,85 gegen C# Dur r=0,80; Digitale ID D# Moll r=0,52 gegen G# Moll r=0,51.

**Wirkung:** Bei jedem dritten Song stehen zwei Tonarten praktisch gleichauf, und die Karte zeigt trotzdem eine einzelne Zahl, als sei sie sicher. Die Unsicherheit ist bekannt und wird verschwiegen.

**Vorschlag:** Entweder die Ausgabe des zweiten Kandidaten löschen oder ihn im scalars-Zweig mitschicken und anzeigen — und den Abstand als Differenz (score - zweiteScore < 0,05) statt als Verhältnis prüfen.

### 55. Der Hinweistext auf der Karte beschreibt ein Verfahren, das es nicht gibt
**niedrig** · `analyzer.js`:7559

**Fehler:** Der Text lautet: 'Tonart via Krumhansl-Schmuckler über akkumulierte Chroma-Frames. Wird nach jeder FFT-Runde verfeinert.' Beides trifft nicht zu. Die Tonart kommt aus einem eigenen 4096er-Durchlauf, der genau einmal läuft (analyzer-worker.js Zeile 719), nicht aus den akkumulierten Chroma-Frames — der Kommentar in Zeile 1154-1158 sagt ausdrücklich, dass sie NICHT aus chromaSum stammt. Und verfeinert wird nichts: Zeile 1159 reicht denselben Wert in jeder der fünf Runden unverändert durch.

**Beleg:** analyzer-worker.js Zeile 719 (einmaliger Aufruf), Zeile 1159 'var keyDisplay=tonartGueltig' innerhalb der Rundenschleife ohne Neuberechnung, Zeile 1154-1158 (Kommentar, der die Chroma-Frames für die Tonart ausschließt).

**Wirkung:** Wer den Hinweis liest, hält den Wert für über den ganzen Song akkumuliert und mehrfach nachgebessert. Tatsächlich stammt er aus jedem zweiten 4096er-Fenster der mittleren 70 % des linken Kanals und wird nie wieder angefaßt. Das ist der Hinweis, der einen Leser davon abhält, an der richtigen Stelle zu suchen.

**Vorschlag:** Text auf das tatsächliche Verfahren umschreiben, sobald das Verfahren steht — sonst wandert der Fehler beim nächsten Mal wieder in die falsche Ecke.

### 56. Das absolute Tor 'wert>-77' ist kein Hörbarkeitstor — es liegt 36 dB unter dem 16-Bit-Rauschen
**niedrig** · `analyzer-worker.js`:540

**Fehler:** bandVerlauf() normiert die FFT nicht (Zeile 477-479: Summe der Betragsquadrate, geteilt nur durch die Binzahl). Die dB-Skala hängt damit an N und an der Fensterfunktion und hat keinen Bezug zu dBFS. Die Zahl −77 in Zeile 540 ist gegen diese unnormierte Skala gesetzt und soll ersichtlich stille Stellen aussperren — tut es aber nicht.

**Beleg:** Nachgemessen mit Sinus bekannten Pegels durch bandVerlauf(): 0 dBFS → Bandwert +55,4 · −40 dBFS → +15,4 · −80 dBFS → −24,6 · −120 dBFS → −64,6. Die Schwelle −77 entspricht also etwa −132 dBFS, rund 36 dB UNTER dem Rauschteppich einer 16-Bit-Datei. In 'Remix Mich' liegen 1,36 % aller Band/Zeit-Werte darunter (5.-Perzentil −8,8 · Median +11,6 · 95.-Perzentil +38,9).

**Wirkung:** Der 'Anteil', auf dem die Entscheidung 'stehender Ton' beruht, wird über Intro, Ausblendung und Fast-Stille mitgezählt, als wäre dort Musik. Außerdem verschiebt sich die Bedeutung der Schwelle stumm, sobald jemand N ändert — genau die Falle, gegen die bin/pruefe-lautheit.js im Kommentar warnt.

**Vorschlag:** Den Bandpegel auf dBFS normieren (durch Fenstersumme und N teilen) und das Tor relativ zur Lautheit des Songs setzen, z. B. 'Rahmen zählt nur, wenn er lauter ist als LUFS − 30'.

### 57. 37 der 160 Bänder sind Dubletten — unter 193 Hz lesen benachbarte Bänder denselben FFT-Bin
**niedrig** · `analyzer-worker.js`:476

**Fehler:** Die Bandgrenzen werden auf ganze Bins gerundet (Zeile 464). Unter etwa 243 Hz ist ein Band schmaler als ein Bin (10,8 Hz bei 44,1 kHz), die gerundeten Grenzen fallen zusammen, und 'obn=Math.max(von+1,grenzen[b+1])' (Zeile 476) sorgt dafür, dass das Band trotzdem einen Bin bekommt — denselben wie sein Nachbar. Die Kurve gibt im Tiefton eine Auflösung vor, die die FFT nicht liefert.

**Beleg:** Nachgezählt für 44,1 kHz: 37 Bänder (Band 0 bis 36, bis 193 Hz) haben einen leeren Bin-Bereich und lesen den Bin des Nachbarn. Gemessene Bandbreiten: 100 Hz → 1 Bin, 250 Hz → 1 Bin, 450 Hz → 1 Bin, 500 Hz → 2 Bins, 1000 Hz → 4 Bins.

**Wirkung:** Für die Schimmersuche folgenlos, weil MIND_HZ=450 diesen Bereich ohnehin ausblendet. bandVerlauf() ist aber als 'Pegel je Frequenzband über die Zeit' beschrieben (Zeile 437-440) und wird auch von grenzfrequenz() benutzt; im Tiefton ist die Kurve nicht das, was ihr Name sagt.

**Vorschlag:** Entweder die FFT vergrößern oder die Bänder unter 250 Hz zusammenlegen, damit jedes Band mindestens einen eigenen Bin hat.

### 58. Die als 'True Peak je Fenster' beschriftete Kurve ist stellenweise nur die Abtastspitze
**niedrig** · `analyzer-worker.js`:407

**Fehler:** 'var schwelle=abtastSpitze*0.5;' - ueberabgetastet wird nur um Abtastwerte herum, die ueber der halben GLOBALEN Spitze liegen. Fuer den Groesstwert ist das eine gute Abkuerzung. Der 100-ms-Verlauf aber wird als eigenstaendige Reihe herausgegeben und in analyzer.js:6943 ausdruecklich 'spitzeVerlauf (True Peak je Fenster)' genannt - und in jedem Fenster, dessen Abtastwerte alle unter der halben Gesamtspitze bleiben, steht dort die blosse Abtastspitze. Dazu kommt eine zweite Ungenauigkeit: der interpolierte Wert wird dem Fenster des Mittelpunkts i zugeschlagen ('var w2=(i/fw)|0'), obwohl er zu m=i-1 oder m=i+1 gehoeren kann und damit ins Nachbarfenster faellt.

**Beleg:** Vollstaendige 4fache Ueberabtastung ohne Schwelle, Fenster fuer Fenster nachgerechnet: 2db520f3 'Pasta al Limone' - 82 von 3592 Fenstern mehr als 0,3 dB zu tief, groesster Fehler 1,09 dB. f76a6706 'Okkultation' - 12 von 3522 Fenstern, groesster Fehler 0,78 dB. Die Fensterzuordnung: bei Schwelle -0,5 dBTP meldet der Kern 160 ueberschrittene Fenster, richtig sind 159.

**Wirkung:** Begrenzt. Die Urteile haengen nicht daran: bei den Plattformschwellen -1,0 / -0,5 / 0,0 dBTP wurde kein einziges Fenster uebersehen (geprueft an 2db520f3 und f76a6706), denn ein Fenster, dessen Abtastwerte alle 6 dB unter der Gesamtspitze liegen, kann diese Schwellen nicht erreichen. Betroffen ist die gezeichnete Kurve in den leisen Abschnitten - sie traegt einen Namen, den sie dort nicht einloest.

**Vorschlag:** Entweder die Schwelle an die angezeigte Plattformschwelle koppeln statt an die halbe Gesamtspitze, oder die Reihe ehrlich benennen ('Spitze je Fenster, ueberabgetastet nur nahe der Gesamtspitze'). Und den interpolierten Wert dem Fenster von m zuschlagen, nicht dem von i.

### 59. Zwei Messwege schreiben ins selbe Archiv, und Fertiges wird nie neu gerechnet
**niedrig** · `vorrechnen.js`:244

**Fehler:** bin/vorrechnen.js liest den Ton mit der Abtastrate der Datei ('Die Abtastrate wird NICHT umgerechnet'). Der Browserweg in web/fremd/analyzer.js:5418 geht ueber audioCtx.decodeAudioData(), und das rechnet die Datei auf die Rate des AudioContext um - auf dem Mac in der Regel 44,1 kHz. Der Kern misst dann nicht die Datei, sondern eine umgerechnete Kopie: Abtastspitze, Vollausschlaege und True Peak beziehen sich auf Abtastwerte, die in der Datei nicht vorkommen. Dazu kommt, dass fertig(id) nur prueft, ob drei Dateien dasitzen ('return da('bin') && (da('spektro.webp')||...)'), nie ob sie zu dem Ton passen, der heute daliegt - eine einmal abgelegte Analyse wird nie aufgefrischt.

**Beleg:** Alle 321 Tondateien im Archiv sind 48000 Hz stereo (ffprobe ueber alle). Trotzdem tragen 23 der 321 Ablagen sr=44100 im Kopf, und die Dauer beweist, dass wirklich mit 44,1 kHz gemessen wurde: ef1a4315 'Ich betrachte uns' hat dauer=372,51997732426304 - mal 44100 sind das genau 16428131 Abtastwerte, mal 48000 dagegen 17880958,912. Was der Unterschied ausmacht, an denselben Dateien ueber beide Wege gemessen: 5078257f 'Zug um Zug' True Peak -2,91 gegen -3,00 dBTP, Abtastspitze -2,91 gegen -3,00; 2db520f3 'Pasta al Limone' Abtastspitze 0,00 gegen 0,19 dBFS und Vollausschlaege 34 gegen 19. Die integrierte Lautheit bleibt dabei praktisch gleich (<= 0,01 LU).

**Wirkung:** Der Bestand ist gemischt: 298 Analysen aus dem Dateiweg, 23 aus dem Browserweg, und nichts als das sr-Feld unterscheidet sie. Fuer Lautheit und LRA ist das folgenlos, fuer Spitze und Vollausschlaege nicht - dieselbe Datei liefert je nach Weg 34 oder 19 Vollausschlaege, und daran haengt das Urteil 'uebersteuert' (analyzer.js:1817). Heute trifft es keinen der vier Songs mit Vollausschlaegen, denn alle vier wurden mit 48 kHz gerechnet; verlassen kann man sich darauf nicht.

**Vorschlag:** Im Browser mit einem OfflineAudioContext in der Rate der Datei dekodieren, damit beide Wege dieselben Abtastwerte sehen. Und fertig() um eine Probe erweitern, die zur Tondatei passt (Groesse und Aenderungszeit oder eine kurze Pruefsumme im Kopf der .bin), damit ein ausgetauschter Ton eine Neuberechnung ausloest.

### 60. Phasenkorrelation ist die Kosinusähnlichkeit, nicht der Korrelationskoeffizient; '% negativ' zählt erst ab -0,10
**niedrig** · `analyzer-worker.js`:631

**Fehler:** Berechnet wird k = Summe(L*R)/sqrt(Summe(L²)*Summe(R²)) ohne Abzug der Mittelwerte - das ist die Kosinusähnlichkeit. Beim Korrelationskoeffizienten nach Pearson müßte der Gleichanteil erst abgezogen werden; der wird im Kern zwar getrennt gemessen (dcL/dcR, Zeile 613), fließt hier aber nicht ein. Zweitens: gezählt wird 'if(k<-0.10)', angezeigt wird das aber als '% negativ' (analyzer.js:5609) - Fenster zwischen -0,10 und 0 gelten damit als nicht negativ. Drittens gilt ein Fenster schon ab einer Energiesumme von 1e-9 als 'klingend', das entspricht etwa -133 dBFS; Ausblendungen und Raumhall zählen also voll mit, obwohl der Kommentar von 'klingenden Fenstern' spricht.

**Beleg:** Gegenprobe mit dem mittelwertfreien Koeffizienten über den ganzen Song (12 Songs): Kern 0,557 / Referenz 0,602; 0,776 / 0,822; 0,258 / 0,388; 0,901 / 0,929 - der Unterschied kommt überwiegend aus der Fenstermittelung, der Gleichanteil trägt bei diesem Material wenig bei. Der Anteil negativer Fenster liegt zwischen 0,0 % und 21,6 %; von den negativen Fenstern sind bei 'Ulrich & Ännchen' nur 7 % leiser als -50 dBFS, die Zahl kommt also nicht aus der Stille.

**Wirkung:** Der Zahlenwert ist brauchbar, die Beschriftung nicht ganz: '1 % neg' verschweigt, daß erst ab -0,10 gezählt wird, und die Größe ist nicht der Koeffizient, den der Name verspricht.

**Vorschlag:** Die Mittelwerte je Fenster abziehen (drei Zeilen), die Schwelle in den Text schreiben ('Fenster unter -0,1') und das Tor für 'klingend' an den Songpegel koppeln statt an eine feste Zahl.

### 61. Stereobreite ist richtig gerechnet, aber als Prozentwert beschriftet und bei 1,0 abgeschnitten
**niedrig** · `analyzer-worker.js`:84

**Fehler:** computeStereoWidth liefert RMS(L-R)/RMS(L+R), also das Verhältnis von Seiten- zu Mittensignal - eine saubere, übliche Definition. Zwei Kleinigkeiten stimmen trotzdem nicht: der Rückgabewert ist mit 'Math.min(1, rmsS/rmsM)' nach oben abgeschnitten, obwohl das Verhältnis bei gegenphasigem Material über 1 gehen kann und gerade dann interessant wäre; und die Oberfläche zeigt ihn als '%' (analyzer.js:5593), obwohl es ein Verhältnis ist und kein Anteil an irgendetwas. Der Erklärungstext nennt ihn 'L-R-Differenz', was die Bezugsgröße (das Mittensignal) unterschlägt.

**Beleg:** Unabhängig nachgerechnet für alle 12 Songs, Übereinstimmung auf drei Stellen: 0,501 / 0,316 / 0,490 / 0,664 / 0,290 / 0,424 / 0,192 / 0,315 / 0,195 / 0,773 / 0,254 / 0,398. In dB ausgedrückt sind das -2,2 bis -14,3 dB Seiten gegen Mitte - plausible Werte für Popmischungen. Die von Caspar_D genannten '31 %' entsprechen 0,31, also -10 dB: ein normales, eher enges Stereobild. Nur 1 von 321 Songs steht an der Klemme 1,0.

**Wirkung:** Kein Rechenfehler; die Zahl stimmt. Missverständlich ist nur die Einheit und der abgeschnittene obere Rand.

**Vorschlag:** Die Klemme entfernen oder erst bei einem deutlich höheren Wert setzen, den Wert als Verhältnis oder in dB anzeigen und im Erklärungstext 'Seiten- zu Mittensignal' schreiben.

---

## Totgelegt — was daraus folgte (23.08.2026)

Caspar_Ds Entscheidung: „alles tot legen, was nicht funktioniert, aber nicht
löschen." Gerechnet wird weiter, in der Ablage (`library/analyse/<id>.bin`)
steht weiter alles — gezeigt wird nur noch, was geprüft ist.

**Eine Liste je Ort, alle umkehrbar:**

| Ort | Liste | Wirkung |
|---|---|---|
| `bin/analyse-index.js` | `TOT` | bpm, tonart, modus, stimme, f0, centroid kommen nicht mehr in den Index — damit verschwinden sie aus Sortierung, Filter, Steckbrief und Legende |
| `web/fremd/analyzer.js` | `SA_TOT`, `SA_TOT_ABSCHNITTE`, `SA_SCHIMMER_TOT` | 14 Karten und 7 Kurvenabschnitte der Bühne werden ausgeblendet; die „Stehenden Töne" zeigen einen Hinweis auf den Glockenstuhl |
| `web/index.html` | datengetrieben | Sortierungen und Filterkategorien erscheinen nur, wenn es Werte dazu gibt — kein festes Angebot mehr |
| `bin/karte.js` | Erdung | Stilgruppen zeigen Tempo (jetzt aus **Sunos Takt**) und LUFS; Moll-Anteil und Stimme entfallen ersatzlos |

**Was ersetzt wurde statt zu verschwinden:**
- **Tempo** → `taktBpm` aus Sunos Schlagzeiten. Die Rechnung liegt als
  `K.takt(schlaege)` in `bin/katalog.js` — eine Quelle für Katalog, Karte und
  Anschluss. Sortierung „Tempo (Sunos Takt)", Klangraum-Legende „114 BPM nach
  Sunos Takt".
- **Stehende Töne** → `bin/stoerfrequenz.js` (FFT 16384, 2,7 Hz), sichtbar im
  Glockenstuhl des Tonstudios.

**Was ohne Ersatz bleibt:** Tonart, Modus und Stimme.

Der Gedanke, die Tonart aus Caspar_Ds Stil-Prompt zu nehmen, ist **verworfen**
(sein Einwand, 23.08.2026): „niemand garantiert, dass Suno die Prompt-Tonart
auch wirklich benutzt." Der Prompt ist eine Absicht, kein Messwert — Suno kann
transponieren, etwas anderes erzeugen oder die Angabe ignorieren. Wenn so ein
Feld je auftaucht, dann als **„gewünschte Tonart"** beschriftet und niemals als
gemessene.

Damit ist auch die Zahl „1 von 20" richtig einzuordnen: Sie misst gegen die
schwächste der drei Referenzen. Belastbar ist **13 von 40** gegen eine
unabhängige Nachrechnung. Und die beiden stärksten Belege brauchen überhaupt
keine Wahrheit von außen:

- **12 von 12 Songs bekommen bei 44,1 / 48 / 32 / 22,05 kHz verschiedene
  Tonarten aus derselben Aufnahme.** Eine Messung, die an der Abtastrate der
  Datei hängt, misst nicht die Musik. Bei 48 kHz — so liegen alle 321 WAVs vor
  — klingt das nackte Fächerraster nach E-Dur; daher stehen 58 mal „E Dur" im
  Archiv.
- **Der Modus ist keine Messung**, sondern eine Schleifenreihenfolge: Alle
  sieben Kirchentonarten desselben Tonvorrats bekommen dieselbe Zahl, es
  gewinnt der tiefste Grundton. Für 321 Songs gibt es vier verschiedene
  Antworten, der Grundton immer C oder C#.

**Was stehen bleibt, weil es stimmt:** Lautheit (LUFS), Schwankungsbreite,
True Peak, Reserve/PLR, Clipping, Gleichspannung, Dauer, Stereobreite,
Phasenkorrelation, Spektrogramm, Abschnittsleiste — und der ganze
Streaming-Vergleich, der darauf aufbaut.

## Die Befundspur neu gebaut (23.08.2026, Caspar_Ds Entwurf)

Aufbau je Bahn, von oben: **Überschrift** — bei der ersten „Track-Struktur",
darunter „Teilweise Stereoauslöschung — Phase negativ" und so fort. Dann in der
Strukturbahn eine **Zeile mit den Abschnittskürzeln in ihrer Abschnittsfarbe**
(vorher standen sie weiß IM Block und mussten sich gegen die Füllung
behaupten). Dann die **Topline**: ein Bildpunkt hoch, volle Farbe, hart — kein
Schein (Caspar_Ds Korrektur an meiner ersten Fassung). Darunter die **Fläche**,
massiv abgedunkelt (17 % der Abschnittsfarbe auf Schwarz).

**Die Hüllkurve** trägt die Farbe, die vorher die Fläche hatte, aber
zurückhaltend: Ober- und Unterkante als harte Konturen in voller Deckung,
dazwischen ein seichter Verlauf — in der Mitte so dunkel wie der Grund, nach
oben und unten heller werdend, höchstens 80 % deckend. Technisch drei
Bausteine: ein waagerechter Verlauf trägt die Abschnittsfarben, eine Maske
macht daraus den senkrechten Verlauf, ein `clipPath` schneidet beides auf die
Kurvenform. Die Konturen sind Striche mit `vector-effect="non-scaling-stroke"`
— so bleiben sie einen Punkt dünn, auch wenn die Sicht gestreckt ist.

Die Strukturbahn ist zwei Drittel höher als die Befundbahnen; jede Befundbahn
bekommt dieselbe Formensprache (Topline in voller Stärke, darunter die Blöcke).

**Beim Durchsehen bis zum Frequenzspektrum gefunden und behoben:**
- Die Bahn „stehende Töne" stand noch in der Spur, während der Text darunter
  ihre Stilllegung erklärte — genau der Widerspruch, den die Hausregel
  verbietet.
- Die Karte „Dauer" blieb leer („—"). Leere Karten werden jetzt ausgeblendet,
  mit Nachlauf: Die Nachrichten des Kerns treffen nacheinander ein, wer sofort
  aufräumt, blendet Karten aus, die bloß noch nicht gefüllt sind.
- Die Zoomzeile im Bühnenpult saß fünf Pixel über der Mitte (ein
  `margin-bottom` als Attribut aus dem Analyzer-Markup, und das schlägt jede
  Regel aus der Datei). Jetzt liegen Zeit, Steuerung, Lautstärke und Zoom auf
  einer Linie.
- Die Playbar der Bühne trägt jetzt wie die Albumansicht **Zufall, Anschluss
  und Schleife**; der Zufallsknopf war dort früher bewusst ausgeblendet.

### Stand der Designsprache bis zum Spektrum (23.08.2026, abends)
- **Hüllkurve**: kein Hintergrund mehr, keine eigene Topline — die *Oberkante
  der Kurve* IST die Topline (voller Ton, ein Bildpunkt). Die Unterkante bleibt
  ohne Linie, die Fläche deckt 50 %. Von den Abschnittsflächen sind nur
  unsichtbare Trefferflächen für Klick und Tooltip geblieben.
- **Blockbahnen**: Blöcke halb deckend, darüber ihre eigene Topline in voller
  Stärke, keine Linie darunter.
- **Zwei neue Bahnen**, weil die Daten sie hergeben:
  - *Lauter als das Ziel — wird beim Abspielen heruntergeregelt*: Abschnitte,
    in denen die Kurzzeitlautheit (3 s) über dem Ziel der gewählten Plattform
    liegt.
  - *Stehende Töne — aus dem Glockenstuhl (2,7 Hz Auflösung)*: die Befunde des
    geprüften Detektors (`bin/stoerfrequenz.js`), von KlangTresor an den Analyzer
    gereicht. Er nennt keine Zeitabschnitte, sondern den Anteil am Song — also
    läuft der Block über die ganze Länge und der Anteil steht im Tooltip
    („8,00 kHz · Störton · 12,2 dB über der Nachbarschaft · in 88 % des Songs ·
    H8+21 Cent"). Ehrlicher als eine erfundene Stelle.
- **Live-Frequenzspektrum**: Sockel und weiße Spitzen halb deckend, ihre Kanten
  als harte Linien in voller Farbe — oben im linken, unten im rechten Spektrum.
  Sitzt eine weiße Spitze auf dem Sockel, trägt auch der Sockel dort seine
  Kante, sonst verschwimmen beide.

Der Geltungsbereich endet am Spektrum; die Verlaufsspuren danach bleiben
unverändert.

### Entrümpelt und in eine Sprache gebracht (23.08.2026, abends)
**Totgelegt über die Zeit** (Caspar_D: „leg den Bullshit über die Zeit tot"):
Impulsdichte, Tempo über Zeit, Klangtonalität, Spektrale Entropie,
Klangrauheit, Frequenzgewicht, Obertonreichtum, Tonhöhenverlauf. Vier davon
waren die Zeitform bereits toter Karten; die Impulsdichte zählt mit einer
absoluten Schwelle und misst Pegel statt Anschlägen; das Tempo zeigte den
schlechtesten der drei Schätzer. Liste: `SPUR_TOT` in `analyzer.js`.
Der Tonhöhenverlauf war der Totlegung vorher entkommen, weil die Überschriften
nach der Analyse ihre Messwerte angehängt bekommen und der Vergleich den alten
Wortlaut suchte — jetzt wird nur noch der Namensanfang geprüft.

**Geblieben:** Signalenergie und Dynamikumfang (einfache Größen, die den
geprüften Lautheitsteil ergänzen), Momentan-/Kurzzeitlautheit, Abweichung,
Histogramm, Stereopanorama, Chroma, gestapelte Bandanteile, beide
Spektrogramme, Klangveränderung.

**Der graue Hinweiskasten** über die stillgelegten stehenden Töne ist weg — die
Bahn zeigt die geprüften Befunde jetzt selbst, und ein Text, der eine
Abwesenheit erklärt, die es nicht mehr gibt, ist Lärm.

**Eine Formensprache für alle Balken bis zum Spektrum:** halb deckende Fläche,
darüber die Topline in voller Stärke. Das gilt jetzt für die Blöcke der
Befundspur, die Säulen des Live-Spektrums und die Balken des
Lautheitshistogramms.

**Die Hüllkurve** steht bei 94 px (verdoppelt).

### Taktbahn statt Tempo-Schätzung (23.08.2026)
Wo früher „Tempo über Zeit" stand — der schlechteste der drei Schätzer —, liegt
jetzt **Sunos eigenes Schlagraster**: `[Sekunde, Zählzeit 1..4]` aus dem
Katalog, für alle 321 Songs vorhanden, 306 davon taktfest. Keine Schätzung,
sondern die Messung, die Suno selbst mitliefert; das mittlere Tempo steht in
der Überschrift („Takt — Sunos Schlagraster · 104 BPM").

**Zoomabhängig, damit immer Lücken bleiben** (Caspar_D: „die verschwimmen alle
ineinander"). Gerechnet wird in BILDPUNKTEN auf dem Schirm, nicht in
viewBox-Einheiten — nur die zählen fürs Auge. Die Stufen, von weit nach nah:

| Platz je Schlag | Darstellung |
|---|---|
| zu eng | nur jede 2., 4., 8. … Eins — so viele, wie Platz haben |
| etwas Luft | alle Einsen, als Strich |
| ab ~7 px | auch die Zählzeiten 2-3-4 |
| viel Luft | Quadrate, die mit dem Zoom breiter werden — bis zur halben Bahnhöhe, dann nicht mehr |

Die Eins ist rot, die Zählzeiten 2-3-4 sind weiß und kleiner, alle auf der
Mittellinie. **Jede Marke trägt die Hausform**: Fläche halb deckend, darauf die
Kante in voller Stärke — und zwar in der Farbe der Marke selbst, nicht in Weiß
(„bei Rot muss die Topline rot sein"). Die Kante gehört zur Marke, nicht zur
Bahn.

Gezeichnet als echte Rechtecke: Weil die Bahn beim Zoomen ohnehin neu entsteht,
lässt sich die waagerechte Streckung ausrechnen (`einPx`) und die Breite in
viewBox-Einheiten passend setzen — so bleibt ein Quadrat quadratisch, ohne den
Umweg über eine Strecke der Länge null.

`spurSichtSetzen` zeichnet die Befundspur neu, wenn sich die SICHTBREITE
geändert hat — beim bloßen Verschieben nicht. Deshalb werden **alle** Marken
gezeichnet, nicht nur die gerade sichtbaren: Der erste Versuch malte nur den
Ausschnitt und lief beim Scrollen aus seinen Marken heraus („beim Zoom in sind
irgendwann keine Beats mehr in der Lane zu sehen"). Wie viele es überhaupt
sind, entscheidet ohnehin die Stufe. Bei „Remix Mich" sind das 111 Einsen und 330 übrige Schläge in zwei
`<path>`-Elementen. Beide mit `vector-effect="non-scaling-stroke"`, damit die
Striche einen Bildpunkt dünn bleiben: Beim Hineinzoomen treten die einzelnen
Schläge hervor, weit draußen bleibt ein Kamm aus Einsen. Eigene, ruhige Farbe
(`TAKT_FARBE`) — der Takt ist keine Warnung und soll nicht mit den Ampelfarben
der Befundbahnen verwechselt werden.

Die Bahn sitzt direkt unter der Track-Struktur: erst die Abschnitte, dann der
Puls, dann die Befunde. Damit hat der Analyzer wieder eine Tempo-Anzeige — nur
eine, die stimmt.

### Die Formensprache reicht jetzt weiter (23.08.2026, spät)
- **Klangveränderung** (Spektrale Fluktuation): Jedes der acht Bänder trägt oben
  eine harte Linie in voller Stärke statt der blassen Trennlinie dazwischen —
  vorher liefen die Zeilen ineinander.
- **Kumulierte Tonverteilung** (Chroma): Jede der zwölf Notenzeilen bekommt ihre
  Linie **in der Farbe der Taste** (weiße Tasten hell, schwarze dunkel). Damit
  liest man die Klaviatur auch dort ab, wo gerade nichts klingt — so wie jede
  Marke der Befundspur ihre eigene Farbe trägt.
- **Abschnittskürzel** der Track-Struktur zoomen und wandern mit: Sie sind HTML
  über dem SVG und standen in Prozent der GESAMTdauer, während das SVG seinen
  Ausschnitt per Attribut herausschneidet. `namenAusrichten()` rechnet sie auf
  die jeweilige Sicht um und läuft bei JEDER Sichtänderung — auch beim bloßen
  Verschieben, und ausdrücklich als Letztes: Beim Zurückzoomen baut
  `befundspurZeichnen` die Namen frisch, und die Ausrichtung darin lief noch mit
  der alten Sicht.
- **Der Analyzer-eigene Abspieler** (`#custom-player`) ist in der Bühne
  ausgeblendet: Den Ton steuert der Player unten (es gibt nur EINE Quelle), und
  die Hüllkurve steht in der Track-Struktur. Übrig geblieben war eine graue
  Fläche mit einem Spielkopf darin.

---

# Nachtrag 24.08.2026: zwei Anzeigen sind wieder da

Zwei der stillgelegten Anzeigen wurden **nicht repariert, sondern
ersetzt** — sie kommen jetzt aus einer anderen Quelle. Wer die alten
Befunde liest, darf sie deshalb nicht erneut totlegen.

## Tonart (v-key)

**Alter Befund:** „Trifft an echter Musik 1 von 20; das Chroma addiert zu
~70 % Grundrauschen." Der Modus war punktgleich über alle sieben
Kirchentonarten, weil nur der Tonvorrat bewertet wurde und kein Grundton.

**Jetzt:** `bin/toene.js`. Der Grundton kommt aus dem **Bass auf Sunos
Eins** — dort spielt er fast immer den Grundton des klingenden Akkords.
Das Tongeschlecht aus der **gezählten Terz**: drei Halbtöne über dem
Grundton heißt Moll, vier heißt Dur. Kommt keine Terz vor — bei
Powerchords die Regel —, wird auch keine behauptet; dann steht nur der
Grundton da.

Geprüft an den Songs mit Tonart im Prompt: Grundton 2 von 2 richtig.

**`v-mode` bleibt tot.** Die Kirchentonarten sind weiterhin punktgleich,
daran hat sich nichts geändert.

## Stimmlage (v-vocal)

**Alter Befund:** Das Tor „hat dieses Fenster Gesang?" war ein Mitten-Tor.
Von 321 Songs bekam keiner „instrumental", auch die 64 ohne Textzeile
nicht; eine Regenaufnahme wurde als „weiblich" gemeldet.

**Jetzt:** YIN auf dem **getrennten vocals-Stem**. Wo nicht gesungen
wird, ist der Stem leise, die Energieschwelle greift, und es wird gar
nicht erst gemessen. Genommen wird das **untere Viertel** der
f0-Verteilung, nicht der Median: Was an Oktavfehlern übrig bleibt, geht
nach oben. Zwischen 180 und 210 Hz überlappen Tenor und Alt wirklich —
dort steht ein **Fragezeichen** statt einer geworfenen Münze.

Die Gegenprobe steht noch aus: Die 64 Stücke ohne Textzeile müssten
durchgehend „?" liefern. Sie läuft mit dem Nachtbericht.

## Tonhöhe (Fund 27) — teilweise behoben

Der Befund gilt für den Worker unverändert: 15 verschiedene f0-Werte für
321 Songs, ein Bin bei 117 Hz 3,4 Halbtöne breit.

Umgangen wird er in `bin/toene.js` durch **YIN im Zeitbereich** mit
Fenstern, die aus Sunos Schlägen kommen — 400 ms statt 21 ms. Gemessen an
„Stars of the deep": 100 % der Basstöne in einer Dur-Leiter (Zufall wäre
58 %), Abweichung vom Halbtonraster 5 Cent.

Die **Piano-Roll im Analyzer** ist entfernt, nicht repariert. Der Code
liegt in git (Commits `52da1fe`, `20f337e`).

## Chroma — die Bin-Zuordnung war das Problem

Nicht in der ursprünglichen Prüfung: Das Chroma rundet jeden FFT-Bin auf
den nächsten Halbton. Bei `fftSize 1024` ist ein Bin 43 Hz breit — bei C2,
wo ein Halbton 3,9 Hz misst, deckt **ein Bin elf Halbtöne** ab. Dazu eine
schiefe Verteilung: C bekommt vier Bins, F# neun.

Behoben für die Notenzonen-Fassung: Goertzel bei **jeder
Halbtonfrequenz**, Fensterlänge nach konstanter Güte, **beide Kanäle** mit
addierten Beträgen. Das ursprüngliche Chroma-Bild rechnet unverändert
weiter.
