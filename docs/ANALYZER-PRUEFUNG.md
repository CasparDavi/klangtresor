# Prüfung des SunoAnalyzers (23.08.2026)

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

## Alle Funde, nach Schwere

### 1. Das Tor „hat dieses Fenster Gesang?" ist ein Mitten-Tor, kein Stimm-Tor — „instrumental" kommt nie heraus
**hoch** · `analyzer-worker.js`:766

**Fehler:** Ob ein Fenster überhaupt Gesang enthält, entscheidet allein formantRatio = (E[400–900 Hz] + E[900–2800 Hz]) / E[gesamt] < 0,03 (Zeile 763/766). Das ist kein Formantmaß. Ein Formant ist eine schmale Resonanzspitze an einer bestimmten Stelle; hier werden zwei 500 bzw. 1900 Hz breite Bänder gegen das Gesamtspektrum gerechnet. Gemessen wird also nur: „hat dieses Fenster überhaupt Mitten?". Gitarre, Becken, Streicher, Regen erfüllen das genauso wie eine Stimme. Dahinter (Zeile 805) steht vocalWindowCount<3, also „weniger als drei Sekunden des ganzen Songs haben Mitten".

**Beleg:** Alle 321 Songs des Archivs durch den Kern gerechnet: kein einziger bekam „instrumental" — auch die 64 Stücke ohne eine Textzeile nicht. Waldesrauschen → „weiblich", f0=305 Hz, 288 von 290 Fenstern als Gesang gezählt. Landregen → „weiblich", f0=258 Hz. Wind im Wald → „gemischt", f0=258 Hz. Wiese mit Insekten → „männlich", f0=117 Hz. Kleinste je gezählte Fensterzahl über alle 321 Songs: 86 — die Schwelle steht bei 3, also 29-fach darunter. Kunstsignale durch den echten Kern (onmessage): rosa Rauschen → „gemischt", f0=117 Hz; Streicherakkord C-Moll ohne Gesang → „männlich", f0=141 Hz. Nur ein Signal aus reinem Bass+Kick, das fast keine Mitten hat, fällt durch das Tor.

**Wirkung:** Für 64 stumme Stücke im Archiv zeigt der Analyzer eine Stimmlage und eine Grundfrequenz an, und das Panel „Stimmanalyse" zeichnet für eine Regenaufnahme eine volle Gesangskurve. Die Antwort „instrumental" ist praktisch tot.

**Vorschlag:** Gesang braucht ein eigenes Merkmal, nicht ein Energieverhältnis: Harmonizität (Anteil der Energie auf ganzzahligen Vielfachen eines gefundenen f0) plus Stimmhaftigkeit über die Zeit — eine Stimme hält eine Tonhöhe 100–300 ms und wackelt dabei (Vibrato/Portamento), ein Streicherakkord nicht. Und die Schwelle muß an echten Instrumentals geeicht werden, nicht geraten; die 64 textlosen Stücke im Archiv sind eine fertige Probe.

### 2. f0 und Stimmlage werden auf dem ganzen Mix gemessen — was herauskommt, ist die Basstonhöhe
**hoch** · `analyzer-worker.js`:576

**Fehler:** Zeile 576 setzt ch=left; die gesamte Stimmanalyse (Zeile 728–816) läuft auf dem unbearbeiteten linken Kanal. Es gibt keine Mitte-Bildung, keine Bandbegrenzung auf den Stimmbereich, keine Trennung von Begleitung. Ein Mix ohne Stimmtrennung liefert bei einem Verfahren, das das energiereichste tieffrequente Muster sucht, die Tonhöhe des Basses.

**Beleg:** Bandbegrenzungsprobe an fünf Songs, jeweils voller Mix gegen dasselbe Stück ohne alles unter 200 Hz (dreifacher Hochpaß, ffmpeg). Unter 200 Hz kann kein Vokalformant liegen — der Gesang bleibt vollständig erhalten, nur Baß und Kick fallen weg. Monolith („German deep male baritone" laut Stilangabe): voller Mix männlich/f0=94 Hz → ohne Baß weiblich/f0=234 Hz. Unerreicht („deep melancholic male vocals"): männlich/117 → weiblich/234. Okkultation („Female lead"): männlich/94 → weiblich/328. Vanille-Eis: gemischt/164 → weiblich/258. In allen fünf Fällen kippt das Urteil auf „weiblich", sobald der Baß fehlt, obwohl die Stimme unverändert im Signal steht. Umgekehrt: nur der Anteil unter 200 Hz allein (keine Stimme möglich) ergibt genau dieselben f0-Werte wie der volle Mix. Über alle 321 Songs: f0-Median der Stücke, deren Stilangabe nur eine weibliche Stimme nennt = 141 Hz; der mit nur männlicher Stimme = 117 Hz; der 64 Stücke ganz ohne Gesang = 117 Hz. Die Stücke ohne jede Stimme liegen also auf demselben Wert wie die mit männlicher — die Zahl trägt keine Stimminformation.

**Wirkung:** Das Feld f0 mißt nicht die Stimme, sondern die untere Kante dessen, was gerade im Spektrum steht. Der ganze nachfolgende Punktestand (Zeile 788–801) urteilt damit über das Arrangement, nicht über den Sänger.

**Vorschlag:** Vor der Stimmanalyse aus links/rechts die Mitte bilden (Gesang steht fast immer mittig) und das Signal für die f0-Suche auf den Stimmbereich begrenzen — nicht durch einen Hochpaß, der den Grundton wegnimmt, sondern indem die Tonhöhe aus dem Obertonabstand geschätzt wird (Autokorrelation/YIN oder Cepstrum auf 200–3000 Hz). Dann bleibt ein Bariton bei 110 Hz, auch wenn 110 Hz gar nicht mehr im Signal steht.

### 3. Die Bänder „männlich 80–165 Hz" und „weiblich 165–350 Hz" messen Kick und Baß, nicht Stimmen
**hoch** · `analyzer-worker.js`:758

**Fehler:** Zeile 758/759 teilt 80–350 Hz in ein „männliches" und ein „weibliches" Band, Zeile 789 macht daraus den ersten Punkt des Urteils. Bei einer isolierten Stimme wäre das ein grober, aber vertretbarer Gedanke. Auf einem Mix ist 80–165 Hz der Bereich, in dem Baßgitarre und Kick ihre Grundtöne haben — in fast jeder Produktion der lauteste Teil des Spektrums. Der Term ist damit ein Baßanteil-Messer, der als Geschlechtsmerkmal verrechnet wird. Zweitens überlappen die Stimmlagen real (Mann ~85–180 Hz, Frau ~165–255 Hz); eine harte Grenze bei 165 Hz kann sie grundsätzlich nicht trennen.

**Beleg:** Kunstsignal durch den echten Kern, Quelle-Filter-Modell einer Singstimme (Sägezahn plus drei Formantresonanzen, Vibrato, Silbenhüllkurve): Frauenstimme 260 Hz allein → „weiblich". Dieselbe Stimme unverändert, dazu eine Baßlinie auf 65 Hz und ein Kick → „männlich". Die f0-Schätzung blieb dabei richtig (258 Hz) — gekippt hat allein der Bandterm. Über alle 321 Songs liegt der Bandanteil 80–165 Hz an 80–350 Hz im Median bei 0,558, bei 193 von 321 Songs über 0,5: der Term zieht also bei zwei Dritteln des Archivs nach „männlich", unabhängig davon, wer singt.

**Wirkung:** Ein leiser Mix mit wenig Baß wird eher „weiblich", ein Metalstück mit stehender Baßwand fast zwangsläufig „männlich". Genau das zeigt das Archiv: von 33 Stücken, deren Stilangabe nur eine weibliche Stimme nennt, wurden 26 mit f0 unter 165 Hz gemessen.

**Vorschlag:** Den Bandterm ersatzlos streichen. Nach einer brauchbaren f0-Schätzung auf der Mitte trägt er nichts bei, was f0 nicht besser sagt; solange die f0-Schätzung nicht trägt, ersetzt er nur einen Fehler durch einen zweiten.

### 4. f0 liegt auf einem 23,4-Hz-Raster — die Entscheidungsschwellen 160 und 200 Hz fallen zwischen die Rasterpunkte
**hoch** · `analyzer-worker.js`:785

**Fehler:** vFftSize=2048 (Zeile 729) ergibt bei 48 kHz eine Auflösung von 48000/2048 = 23,4375 Hz. Zeile 785 rechnet f0 = bestHpsK·sr/vFftSize, ohne Schwerpunkt- oder Parabelinterpolation über die Nachbarbins. f0 kann deshalb nur diese Werte annehmen: 93,75 · 117,19 · 140,63 · 164,06 · 187,5 · 210,94 · 234,38 · 257,81 · 281,25 · 304,69 … Zeile 791 entscheidet an 160 Hz und 200 Hz. Zwischen diesen Schwellen liegen genau zwei erreichbare Werte (164,06 und 187,5); ein einziger Bin Abstand — 23 Hz, in der Stimmlage rund drei Halbtöne — kippt das Urteil von „männlich" auf „neutral" auf „weiblich".

**Beleg:** Über alle 321 Songs traten genau zehn verschiedene f0-Werte auf: 94 Hz (37×), 117 (172×), 141 (55×), 164 (29×), 188 (10×), 211 (6×), 234 (6×), 258 (4×), 281 (1×), 305 (1×) — jeder davon ein exaktes Vielfaches von 23,4375. 65 % des Archivs liegen auf nur zwei Rasterpunkten (94 und 117 Hz). Ein Halbton bei 200 Hz sind 12 Hz; das Raster ist doppelt so grob wie der kleinste musikalische Schritt.

**Wirkung:** Die angezeigte Grundfrequenz ist keine Messung, sondern eine Bin-Nummer. Zwei Sängerinnen, die eine Quarte auseinanderliegen, können denselben Wert bekommen; zwei Rahmen desselben Tons können um drei Halbtöne auseinanderliegen.

**Vorschlag:** Entweder das Fenster deutlich vergrößern (8192 → 5,9 Hz) oder — billiger und genauer — den gefundenen Bin mit einer Parabel über die beiden Nachbarn interpolieren. Bei Tonhöhe ist ohnehin die Autokorrelation im Zeitbereich das passendere Werkzeug: ihre Auflösung wächst nicht mit dem Fenster, sondern mit der Abtastrate.

### 5. Die harmonische Produktspektrum-Suche ist nicht normiert und greift systematisch die falsche Harmonische
**hoch** · `analyzer-worker.js`:780

**Fehler:** Zeile 780–783 bildet hv = |X(k)| · |X(2k)| · |X(3k)| aus den rohen Beträgen und nimmt das Maximum. Zwei Denkfehler stecken darin. Erstens: Musikspektren fallen zu hohen Frequenzen hin ab; ein Produkt roher Beträge wird deshalb dort am größten, wo die Beträge selbst am größten sind — also bei kleinem k. Ohne Normierung (etwa auf die Summe der beteiligten Bins oder im Logarithmus) ist das Verfahren systematisch zum tiefsten Kandidaten hin verzerrt. Zweitens: das Produkt wird auch dann groß, wenn 2k und 3k zufällig auf Formanten oder auf andere Instrumente fallen — dann findet HPS eine Harmonische der Stimme statt ihres Grundtons.

**Beleg:** Kunstsignal durch den echten Kern, nackte Männerstimme 110 Hz, Vokal /a/ (F1=730, F2=1090, F3=2440), kein weiteres Instrument im Signal: der Kern meldet f0=328 Hz — das ist 3×110, denn 2k und 3k dieser Harmonischen landen auf 660 und 990 Hz, also mitten in F1 und F2. Das Urteil lautet folgerichtig „weiblich" für eine reine Männerstimme. Nackte Frauenstimme 220 Hz → f0=445 Hz (2×220). Frau 175 Hz → 352 Hz (2×175). Im Mix kippt derselbe Mechanismus in die andere Richtung: dort gewinnt der Baß, siehe die Rasterverteilung mit 65 % auf 94/117 Hz.

**Wirkung:** Die f0-Schätzung ist in beide Richtungen oktav- bzw. quintverschoben: allein stehende Stimmen werden zu hoch, Stimmen im Mix zu tief gemessen. Damit ist der mit 1,5 Punkten schwerstgewichtete Term des Urteils (Zeile 791) unbrauchbar.

**Vorschlag:** HPS im Logarithmus rechnen (Summe der log-Beträge statt Produkt) und die gefundene Spitze gegen ihre Subharmonischen prüfen: liegt bei f0/2 ebenfalls Energie mit passenden Vielfachen, ist f0/2 der Grundton. Besser noch: YIN/Autokorrelation, die diese Oktavprüfung eingebaut hat.

### 6. Das Verfahren trifft seltener zu als eine feste Antwort
**hoch** · `analyzer-worker.js`:813

**Fehler:** Die Kette aus Bandanteil, gerasterter f0, Spektralschwerpunkt und F1/F2-Verhältnis (Zeile 789–795) und die Schwellen in Zeile 813/814 ergeben zusammen kein Urteil, das mehr Auskunft trägt als ein konstanter Wert. Das ist kein Feinschliff-Problem, sondern die Summe der Punkte oben: alle vier Terme messen Eigenschaften des Arrangements.

**Beleg:** Als Sollwert dient Sunos eigene Stilangabe im Katalog (stilPrompt/stilAusschluss). 142 Songs nennen eindeutig entweder nur eine weibliche oder nur eine männliche Stimme. Der Kern trifft davon 57 = 40 %. Wer immer „männlich" sagte, träfe 109 = 77 %. Von den 33 eindeutig weiblichen Stücken erkennt der Kern 6. Über alle 321 Songs lautet das Urteil 142× männlich, 159× gemischt, 20× weiblich — und unter den 20 „weiblichen" sind eine Regenaufnahme (Landregen), Waldesrauschen und Wind im Wald.

**Wirkung:** Das Feld „Stimme" in der Oberfläche sieht aus wie eine Messung, ist aber im Mittel irreführender als gar keine Angabe.

**Vorschlag:** Bis das Verfahren steht: die Anzeige an eine Vertrauensangabe binden und im Zweifel nichts behaupten. Und eine Selbstprüfung nach dem Vorbild von bin/pruefe-lautheit.js anlegen — Kunstsignale mit bekanntem Ergebnis (Stimme allein, Stimme über Baß, Baß ohne Stimme, Rauschen), die beim Bauen mitlaufen. Die vier Signale, mit denen die Fehler hier gefunden wurden, reichen dafür schon aus.

### 7. Der Autokorrelationsgipfel wird ohne jede Oktav- oder Metrumsprüfung als Tempo genommen
**hoch** · `analyzer-worker.js`:698

**Fehler:** Zeile 697-699 sucht das Maximum der Autokorrelation über die Lags 33..100 und gibt 6000/bestL zurück. Es gibt keinen Vergleich der Gipfelhöhen bei T, T/2 und 2T, keine Kammbewertung über die Vielfachen (r(L)+r(2L)+r(3L)...), keine Phasenprüfung gegen die Anschläge, keine Tempovorliebe. Das ist die Annahme, der höchste Gipfel der Autokorrelation sei der Taktschlag. Diese Annahme ist in dieser Musik meistens falsch: Die Autokorrelation einer Hüllkurve mißt den häufigsten Abstand zwischen Ereignissen, und der ist bei Popmusik der Zweier oder der ganze Takt, weil die Basstrommel auf 1 und 3 lauter ist als alles dazwischen.

**Beleg:** An allen 321 Songs nachgerechnet (Skript batch.js): Der Suno-Schlag ist nur bei 75 von 321 der HÖCHSTE Gipfel der Autokorrelation. Bei 103 Songs liegt der höchste Gipfel auf 2 Schlägen, bei 57 auf 4 Schlägen (ein Takt), bei 18 auf dem halben Schlag, bei 21 auf 1,5 und bei 22 auf 0,75 Schlägen. Der Suno-Schlag steht als Gipfel auf Rang 1 bei 75, Rang 2 bei 67, Rang 3 bei 65, Rang 4-5 bei 48, Rang 6-10 bei 38, jenseits Rang 10 bei 28 Songs. Beispiel "Mutterns Hände" (80d81627): Suno 101,2 BPM (Lag 59,3; Raster über 429 Schläge und 255 s vollkommen gleichmäßig). Die stärksten Gipfel sind L237 = 4 Schläge (1,00), L118 = 2 Schläge (0,82), L49 (0,79). Der Schlag selbst hat nur 0,66 und ist Rang 26. Der Kern nimmt L49 = 122,4 BPM — das sind 0,83 Schläge, also gar keine metrische Ebene. Beispiel "Stars of the deep" (6250449b): Suno 120,5, Kern 60,0.

**Wirkung:** Von 321 Songs sind 58 genau eine Oktave zu langsam und 23 eine Oktave zu schnell. Von den 69 übrigen Fehlmessungen sind 21 bei genau 2/3 (Gipfel auf 1,5 Schlägen) und 32 bei genau 4/3 (0,75 Schläge) — zusammen also 134 von 321 Songs, deren Tempo eine falsche metrische Ebene benennt.

**Vorschlag:** Nach dem Gipfelsuchen eine Ebenenentscheidung einziehen: die Kandidaten T, T/2, 2T (und 3T/2, 2T/3) gegeneinander bewerten, indem die Autokorrelation an allen Vielfachen aufsummiert wird, und die Ebene mit einer Tempovorliebe um 120 BPM festlegen. Eine Probe dieses Verfahrens (variante.js) hat im Versuch drei der Oktavfehler (Stars of the deep, Emma, Das Geschenk) auf Anhieb geheilt, ohne einen richtigen Wert zu verderben.

### 8. Angezeigt wird nicht die gemessene Autokorrelation, sondern ein arithmetisches Mittel über Fenster — das erzeugt Tempi, die im Stück nicht vorkommen
**hoch** · `analyzer.js`:5689

**Fehler:** Zeile 5587 setzt das Feld "BPM" zunächst auf msg.bpm (den AKF-Skalar). Sobald die Nachricht bpm_curve eintrifft, überschreibt Zeile 5689 es mit dem Median von bpmsMedian. Diese Reihe ist im Kern zweimal arithmetisch gemittelt worden: Zeile 872 nimmt je 8-s-Fenster den Median der Anschlagabstände, Zeile 879 mittelt diese Mediane über ±4 Fenster arithmetisch. Ein arithmetisches Mittel über BPM-Werte verschiedener metrischer Ebenen ist keine Ebene mehr: Der Mittelwert aus 100 und 150 ist 125, ein Tempo, das nirgends im Stück steht. Derselbe Fehler noch einmal in Zeile 871, wo bpmsIOI das arithmetische Mittel der Abstände in BPM bildet.

**Beleg:** Aus den abgelegten Analysen aller 321 Songs (Skript angezeigt.js): Der angezeigte Wert trifft den Suno-Takt bei 98 von 321 Songs (31 %), der überschriebene AKF-Skalar bei 171 (53 %). Abstand zur nächstgelegenen metrischen Stufe (1/4,1/3,1/2,2/3,3/4,1,4/3,3/2,2,3,4 des Suno-Schlags): der AKF-Skalar liegt bei 304 von 321 Songs innerhalb 60 Cent auf einer Stufe, mittlerer Abstand 16 Cent. Der angezeigte Wert liegt bei 160 von 321 dazwischen, mittlerer Abstand 84 Cent. Beispiel "Waifu with White Hair" (98f74c73): Suno 91,2, AKF 90,9 richtig, angezeigt 125,9. Beispiel "Erste Regentropfen" (c66edee5): Suno 82,6, AKF 83,3 richtig, angezeigt 122,9. Rohe Fenstermediane dieses Songs springen zwischen 176, 167, 136, 120, 143, 130, 167 — die Glättung macht daraus 122,9.

**Wirkung:** Der Wert im BPM-Feld ist bei zwei Dritteln der Songs falsch, und anders als beim Skalarwert ist der Fehler nicht mehr als Oktavverwechslung erkennbar: Es steht eine Zahl da, die zu keiner Zählebene des Stücks gehört. Die bessere Messung (53 %) wird von der schlechteren (31 %) überschrieben.

**Vorschlag:** Den AKF-Skalar stehen lassen, statt ihn zu überschreiben; und wenn über Fenster zusammengefaßt wird, dann über die PERIODEN (Sekunden je Schlag) und mit Median statt arithmetischem Mittel, nach vorheriger Faltung aller Fenster auf dieselbe metrische Ebene.

### 9. Autokorrelation ohne Normierung auf die Zahl der Summanden — in der 5-Sekunden-Kurve ein systematischer Vorteil von 17 % für schnelle Tempi
**hoch** · `analyzer-worker.js`:836

**Fehler:** Die Summe in Zeile 836 läuft über diff2.length-lag Glieder und wird nicht durch diese Zahl geteilt. Bei einem 5-Sekunden-Fenster hat diff2 498 Werte; bei Lag 33 werden 465 Produkte addiert, bei Lag 100 nur 398. Der kurze Lag bekommt also allein durch die Fensterlänge 17 % mehr Summe geschenkt. Verglichen werden dadurch keine Autokorrelationskoeffizienten, sondern Summen unterschiedlicher Länge. (Beim globalen Wert in Zeile 698 ist derselbe Fehler vorhanden, fällt aber nicht ins Gewicht, weil diff dort einige Zehntausend Werte lang ist.)

**Beleg:** Für alle 321 Songs die 5-s-Kurve zweimal gerechnet, einmal wortgleich wie im Kern und einmal durch (N-lag) geteilt (Skript batch.js, Felder kurveMedRoh/kurveMedNorm): Der Median der Kurve verschiebt sich bei 211 von 321 Songs, im Mittel um 17,75 BPM, und zwar durchweg nach oben — die ungeteilte Fassung mißt zu schnell.

**Wirkung:** Die BPM-Kurve, die unter dem Spielkopf mitläuft, zeigt in der oberen Hälfte des Suchbereichs systematisch zu hohe Werte. Der Fehler ist keine Streuung, sondern eine Neigung: Er verschwindet nicht durch Mitteln über die Zeit.

**Vorschlag:** Die Summe durch (diff2.length - lag) teilen, bevor verglichen wird.

### 10. Das Energietor vergleicht einen Effektivwert mit einem Mittelquadrat und sperrt deshalb praktisch nie
**hoch** · `analyzer-worker.js`:830

**Fehler:** Zeile 726 bildet die Schwelle aus dem Feld energy, und energy[i] ist ein MITTELQUADRAT (Zeile 680: s += ch[j]*ch[j], dann s/eStep). Zeile 829 bildet aus dem Fenster dagegen einen EFFEKTIVWERT (Math.sqrt). In Zeile 830 wird dann Amplitude mit Amplitude-zum-Quadrat verglichen. Da alle Werte unter 1 liegen, ist das Mittelquadrat viel kleiner als der Effektivwert, und die Bedingung wird fast nie wahr. Dieselbe Verwechslung noch einmal in Zeile 854/855 für die IOI-Kurve.

**Beleg:** Aus den abgelegten Analysen aller 321 Songs gezählt (Skript onsets.js): Von 92 852 Fenstern der BPM-Kurve sind 10 durch das Tor gesperrt (NaN). Mit einheitenrichtigem Vergleich (Fenster-Mittelquadrat gegen Schwelle) wären es 7141, also 7,7 % (Skript batch.js, Feld gesperrtRichtig). Einzelmessung (Skript tor.js): "Stars of the deep" Schwelle 5,00e-3, kleinster Fenster-Effektivwert 5,15e-2 — gesperrt 0 von 303 Fenstern; einheitenrichtig läge die Schwelle bei 7,07e-2 und das leiseste Fenster wäre gesperrt. Bei "Lichtpunkte" Schwelle 3,57e-4 gegen kleinsten Fensterwert 4,67e-3 — gesperrt 0 von 227.

**Wirkung:** Stille Fenster und Ausblendungen bekommen ein Tempo zugewiesen statt NaN. Da diese Fenster keinen Takt haben, liefert die Autokorrelation dort Zufallswerte, und die Glättung trägt sie in die Nachbarschaft hinein. Das im Kommentar angekündigte Tor ist wirkungslos.

**Vorschlag:** Entweder beide Seiten als Mittelquadrat vergleichen oder beide als Effektivwert (Math.sqrt(energyP5)). Danach den Faktor 3 neu prüfen — er wurde nie an einer wirksamen Schwelle erprobt.

### 11. Das Chroma addiert jedes FFT-Fach — 70 % davon ist Grundrauschen, kein Ton
**hoch** · `analyzer-worker.js`:222

**Fehler:** Die Schleife in Zeile 222-226 nimmt JEDEN Betrag zwischen 80 und 4000 Hz, rundet seine Mittenfrequenz auf den nächsten Halbton und addiert ihn dort auf. Ein FFT-Fach, in dem gar kein Ton steht, trägt genauso bei wie der Gipfel eines Grundtons. In dichter, komprimierter Musik ist der Bodensatz zwischen den Teiltönen größer als die Teiltöne selbst. Gedacht ist es als 'Energie je Tonklasse', gemessen wird aber 'Energie je Fächergruppe', und die Fächergruppen haben mit Musik nichts zu tun.

**Beleg:** Gemessen an 14 Songs: nur 29,0 bis 32,2 % der aufaddierten Beträge stehen überhaupt auf einem Spektralgipfel (Fach höher als beide Nachbarn und mindestens 5 % des lautesten Fachs); die restlichen rund 70 % sind Rauschboden und Fensterausschmierung. Folge im Chroma, hier drei Songs, die Caspar_D ausdrücklich als E-Moll angelegt hat — Terz gegen Terz, G gegen G#: Stumm 0,65/0,78 im Kern, aber 0,69/0,38 in der Referenz; Roßtrappe v2 0,69/0,84 gegen 0,62/0,39; Moissanit 0,89/0,92 gegen 0,83/0,44. Der Kern dreht die Terz um und meldet dreimal E Dur. Im Kern-Chroma liegt kein einziger Wert unter 0,39 — der Boden hebt alle zwölf Tonklassen an und frißt den Unterschied zwischen vorhandenen und fehlenden Tönen. Gegenprobe mit sonst wortgleichem Code: nimmt man statt aller Fächer nur die Gipfel, steigt die Trefferzahl von 1/14 auf 5/14, mit zusätzlicher Normierung je Rahmen auf 6/14.

**Wirkung:** Die Tonart im ganzen Archiv ist unbrauchbar. Gegen Caspar_Ds eigene Tonartangabe im Stil-Prompt trifft der Kern 1 von 20 Songs (Zufall wäre etwa 1). Bei den sieben Songs, bei denen der Prompt UND alle drei Literaturprofile übereinstimmen (Enzian, Mutterns Hände, Stumm, Herr von Ribbeck, Wenn Du da bist, Roßtrappe v2, Moissanit), liegt der Kern 7 mal daneben.

**Vorschlag:** Nur Spektralgipfel ins Chroma nehmen (Fach größer als beide Nachbarn und über einer Schwelle relativ zum lautesten Fach des Rahmens), die genaue Frequenz durch parabolische Verfeinerung bestimmen und je Rahmen normieren, damit kein lauter Refrain den ganzen Song überstimmt.

### 12. Die gemessene Tonart hängt an der Abtastrate der Datei, nicht an der Musik
**hoch** · `analyzer-worker.js`:223

**Fehler:** Die Fächer der FFT liegen in gleichen Hz-Abständen, die Halbtöne aber in gleichen Verhältnissen. Die Rundung auf den nächsten Halbton in Zeile 224 verteilt deshalb ungleich viele Fächer auf die zwölf Tonklassen, und wie ungleich, hängt allein von sr/4096 ab. Der Kommentar in Zeile 202-203 behauptet, 4096 sei 'fein genug, dass ab 80 Hz jeder Halbton seinen eigenen Bin hat'. Das stimmt nicht: ein Fach entspricht einem Halbton erst ab 181 Hz (44,1 kHz) bzw. 197 Hz (48 kHz). Darunter — also im Bass und dort, wo die Grundtöne liegen — ist das Raster gröber als die Musik.

**Beleg:** Dieselbe Musik, nur anders abgetastet: 12 von 12 geprüften Songs bekommen bei 44100, 48000, 32000 und 22050 Hz jeweils eine ANDERE Tonart. Beispiel Erlkönig: D Moll / E Dur / A# Moll / D Dur. Beispiel Herr von Ribbeck: D Dur / F# Moll / B Moll / G Dur. Fächerzahl je Tonklasse bei 48 kHz: C:19 C#:23 D:22 D#:24 E:25 F:28 F#:28 G:31 G#:32 A:35 A#:35 B:33 — Verhältnis 1,84 zwischen größter und kleinster. Zwischen 80 und 197 Hz bekommen 5 von 16 Halbtönen gar kein eigenes Fach. Dieses nackte Raster, ganz ohne Ton, korreliert am besten mit G# Moll (r=0,30) und E Dur (r=0,21). Reines Rauschen, das keine Tonart hat, ordnet der Kern trotzdem eine zu: weißes Rauschen 6 von 8 Durchgängen 'A Moll', rosa Rauschen 7 von 8 'A Moll' (r=0,58), braunes Rauschen 8 von 8 'F Dur' (r=0,77).

**Wirkung:** Alle 321 abgelegten Analysen sind mit den 48-kHz-WAVs gerechnet (bin/vorrechnen.js Zeile 168-173 nimmt die WAV, wenn sie da ist). Genau dort zieht das Raster nach E Dur — und E Dur ist mit 58 von 321 die häufigste Antwort im Archiv, gefolgt von G Moll (36). Würde derselbe Song aus der MP3 gerechnet, käme oft etwas anderes heraus; die Zahl beschreibt die Containerdatei, nicht die Musik.

**Vorschlag:** Nicht auf Fächer runden, sondern das Chroma über eine logarithmische Frequenzachse bilden — je Halbton ein Fenster mit weicher Gewichtung über die darin liegenden Fächer, unten mit größerer FFT (16384) oder aus Gipfelfrequenzen statt Fachmitten. Dann ist die Zuordnung von der Abtastrate unabhängig. Als Selbstprüfung in bin/pruefe-lautheit.js: derselbe Song bei zwei Abtastraten muß dieselbe Tonart ergeben.

### 13. Die Kirchentonart ist die Reihenfolge zweier Schleifen, keine Messung
**hoch** · `analyzer-worker.js`:1144

**Fehler:** Die Bewertung in Zeile 1147-1149 addiert die sieben Leitertöne und zieht die übrigen fünf halb ab. Beides hängt ausschließlich am TONVORRAT, nicht daran, welcher Ton der Grundton ist. C-Ionisch, D-Dorisch, E-Phrygisch, F-Lydisch, G-Mixolydisch, A-Äolisch und B-Lokrisch haben denselben Tonvorrat und bekommen deshalb exakt dieselbe Zahl. Der Vergleich in Zeile 1150 ist ein strenges Größer, also gewinnt, wer zuerst drankommt: der tiefste im Vorrat enthaltene Grundton, C vor C# vor D. Ein Name wie 'C Mixolydisch' ist damit nur eine andere Schreibweise für 'der Tonvorrat von F-Dur bzw. d-Moll' und sagt nichts über den Grundton der Musik.

**Beleg:** Wortgleiche Übernahme des Codes, gefüttert mit makellosen Leiterchromas: bei jedem der sieben Modi liegen exakt 7 Kandidaten gleichauf. Ein reines C-Dur-Chroma ergibt 'C Ionisch', ein reines G-Dur-Chroma 'C Lydisch', ein reines F-Dur-Chroma 'C Mixolydisch', ein reines B-Dur-Chroma 'C# Dorisch'. In der Ablage stehen für 321 Songs genau vier verschiedene Antworten: 265x C# Dorisch, 23x C Mixolydisch, 22x C# Mixolydisch, 11x C Lokrisch — der Grundton ist immer C oder C#, nie etwas anderes.

**Wirkung:** Das Feld 'Modus' auf der Karte (analyzer.js Zeile 663) ist wertlos, und es widerspricht dem Feld 'Tonart' daneben. Der Export in analyzer.js Zeile 1122 schreibt beides in eine Zeile: 'Tonart: E Dur C# Dorisch' — E Dur hat vier Kreuze, C# Dorisch fünf. Von den 265 Songs mit 'C# Dorisch' hat kein einziger tatsächlich C# als Grundton.

**Vorschlag:** Den Grundton nicht aus dem Tonvorrat holen — der enthält ihn nicht. Entweder den Grundton aus der Tonartschätzung übernehmen und nur noch das Geschlecht/die Alteration bestimmen (dann ist 'Mixolydisch' die Aussage 'Dur mit kleiner Septime'), oder gewichtete Profile je Modus benutzen, in denen Grundton und Quinte schwerer wiegen als die übrigen Stufen. So wie es dasteht, sollte das Feld eher verschwinden als falsche Namen liefern.

### 14. Frequenzauflösung: ein Ton wird über bis zu 63 FFT-Bins verschmiert — die gemessene Hervorhebung hängt an der Frequenz, nicht am Ton
**hoch** · `analyzer-worker.js`:459

**Fehler:** bandVerlauf() rechnet mit N=4096 (Zeile 459) und legt 160 logarithmische Bänder darüber (Zeile 444). Je Band wird die MITTLERE Leistung aller enthaltenen Bins genommen (Zeile 476-478: 's/=(obn-von)'). Bei 44,1 kHz ist ein Bin 10,8 Hz breit, ein Band aber 4,4 %: 1 Bin bei 450 Hz, 4 bei 1 kHz, 31 bei 8 kHz, 63 bei 16 kHz. Die Energie eines schmalen Tons wird also mit 10·log10(Binzahl) verdünnt, der Nachbarschaftspegel dagegen nicht. Was der Kern 'Hervorhebung' nennt, ist damit zu einem großen Teil eine Eigenschaft des Bandrasters.

**Beleg:** Kunstsignal (weißes Rauschen + Sinus fester Amplitude, 40 s, 44,1 kHz): die echte schmalbandige Hervorhebung ist überall +32 dB. Der Kern meldet: 500 Hz +22,6 dB · 2000 Hz +18,5 dB · 4000 Hz +15,2 dB · 8000 Hz +12,4 dB · 12000 Hz +10,4 dB. Gemessene Bandbreiten: 2 / 8 / 16 / 31 / 49 Bins. Im echten Song ('Morgen', Referenz sauber, Sinus zugemischt) muss ein Dauerton erreichen: +14 dB bei 500 Hz, +16 dB bei 1 kHz, +19 dB bei 3150 Hz, +22 dB bei 8 kHz, +26 dB bei 12,5 kHz, bevor er überhaupt gemeldet wird.

**Wirkung:** Der echte Dauerton in 'Remix Mich' (7999,6 Hz) ist unsichtbar: Referenz +12,2 dB in 88 % des Songs, im Bandverfahren liegt er in Band 7905 Hz mit 0 % der Rahmen. Ebenso in 'Die Gedanken ...' (7999,6 Hz, +13,2 dB, 84 % → 1 %). Der Ton ist echt und unabhängig belegt: ffmpeg-Bandpass (20 Hz breit) über audio.wav ergibt 7999,6 Hz = −48,6 dB gegen −53,0/−52,2/−56,4/−57,3 dB bei 7400/7700/8300/8600 Hz; im MP3 dasselbe Bild. Er steckt also im Material, nicht im Kodierer.

**Vorschlag:** Für die Schimmersuche eine eigene, feine FFT rechnen (16384 Punkte = 2,7 Hz, wie bin/stoerfrequenz.js) statt das 160-Band-Raster mitzubenutzen. Ersatzweise je Band den SPITZENWERT statt des Mittelwerts nehmen — dann bleibt wenigstens die Verdünnung aus, die Frequenzangabe bleibt aber grob.

### 15. Die angezeigte dB-Zahl ist ein bedingter Mittelwert und kann strukturell nie klein werden
**hoch** · `analyzer-worker.js`:542

**Fehler:** 'hervorSum+=hervor' steht INNERHALB von 'if(verdaechtig)' (Zeile 540-542). hervorMittel=hervorSum/treffer (Zeile 554) ist damit der Mittelwert genau derjenigen Rahmen, die die Schwelle HERVOR=7,8 dB bereits überschritten haben — eine Auswahl auf sich selbst. Der Wert kann rechnerisch nie unter 7,8 liegen. Die Oberfläche zeigt ihn als Eigenschaft des Tons: 'X dB über der Nachbarschaft' (analyzer.js:1881) und als Spalte 'über Nachbarn' (analyzer.js:1943).

**Beleg:** 139 Befunde aus 26 Songs, gerechnet auf audio.wav (dieselbe Quelle wie bin/vorrechnen.js): angezeigte Hervorhebung im Mittel +16,6 dB — tatsächlicher Mittelwert derselben Größe über ALLE Rahmen desselben Bandes: +4,1 dB. Kleinster je angezeigter Wert über alle 139 Befunde: +11,0 dB, nie darunter. Einzelfall 'Remix Mich', 736 Hz: angezeigt +14,9 dB, im Feinspektrum steht die Linie (740,2 Hz) im Median nur +6,0 dB über ihrer Nachbarschaft; 499 Hz: angezeigt +15,5 dB, echt +3,7 dB.

**Wirkung:** Jeder Befund sieht gleich dramatisch aus. Die Zahl unterscheidet nicht zwischen einem kräftigen Pfeifton und einem gerade eben über die Schwelle gerutschten Musikton — sie sagt nur, wie weit die ausgewählten Ausreißer über der Schwelle lagen. Sie taugt weder zum Vergleich zwischen Songs noch zwischen Frequenzen.

**Vorschlag:** Zwei getrennte Zahlen führen: den Median der Hervorhebung über ALLE Rahmen (die Stärke) und den Anteil der Rahmen über der Schwelle (die Dauer). Den bedingten Mittelwert gar nicht anzeigen.

### 16. Gehaltene Musiktöne werden nicht ausgeschlossen — 137 von 137 Befunden bis 6 kHz liegen auf einem Halbton
**hoch** · `analyzer-worker.js`:525

**Fehler:** schimmerFinden() (Zeile 524-572) kennt keinen einzigen Test, der Musik von Störung trennt: keine Tonhöhenprüfung, keine Obertonreihe, kein Intervallvergleich zwischen den Befunden. Die ganze Last trägt MIND_ANTEIL=0,25 (Zeile 525) — die Annahme, ein gehaltener Musikton komme in weniger als einem Viertel der Rahmen vor. Diese Annahme ist falsch: der Grundton und die Quinte einer Tonart stehen in fast jedem Stück länger als ein Viertel der Zeit im Spektrum.

**Beleg:** 26 Songs, 139 Befunde (audio.wav): 137 liegen innerhalb ±15 Cent eines gleichstufigen Halbtons — bis 6 kHz sind es 137 von 137, also 100 % (Zufallserwartung ±15 Cent = 30 %). Verteilung der Cent-Abweichung: 100 Befunde in der Klasse 0 c, 27 bei +10 c, 4 bei −10 c. Bei den meisten stehen die Obertonpartner ½, ⅓, 2×, 1,5× ebenfalls dauerhaft im Feinspektrum. 'Der Todt vnd das Mägdlein': die vier stärksten Befunde sind D5 −2 c (+21,1 dB echt), E5 +1 c, A5 ±0 c, D6 +2 c — die Melodie. 'Morgen', von der Referenz als sauber eingestuft, liefert 5 Befunde: A5 ±0 c, D5 −2 c, F6 ±0 c, D7 ±0 c, A4 +16 c. Die Referenz bin/stoerfrequenz.js stuft 149 ihrer 189 Kandidaten selbst als 'wahrscheinlich Musik' ein und verwirft sie; nur 4 bleiben als 'Stoerton' übrig.

**Wirkung:** 25 der 26 geprüften Songs bekommen mindestens einen Befund, 7 die vollen acht; 112 der 139 Befunde erscheinen rot (schwere ≥ 0,70) mit dem Rat '−2 bis −3 dB'. Die Oberfläche behauptet dabei ausdrücklich das Gegenteil: 'Ein gehaltener Gesangston fällt heraus, ein stehender Ton nicht: Gefordert sind mindestens 25 % des Songs' (analyzer.js:1952-1954). Wer dem Rat folgt, schneidet dem Sänger die Töne aus dem Song.

**Vorschlag:** Die Prüfungen aus bin/stoerfrequenz.js übernehmen: Cent-Abstand zum nächsten Halbton, Obertonreihe (n·f0 mit ebenso dauerhaftem Grundton), musikalische Intervalle zwischen den Kandidaten. Und die Dauerschwelle von 25 % auf 80 % heben.

### 17. Deckel von acht Befunden, sortiert nach 'schwere' — der einzige echte Störton fällt hinten heraus
**hoch** · `analyzer-worker.js`:569

**Fehler:** Die Befunde werden nach 'schwere' sortiert (Zeile 562) und die Schleife bricht bei acht ab (Zeile 569). 'schwere' (Zeile 556) baut auf hervorMittel — dem bedingten Mittelwert, der bei Musiktönen hoch ausfällt, weil deren Bänder schmal genug sind, um nicht verdünnt zu werden (siehe Befund 1). Die Musiktöne verdrängen damit systematisch die hochfrequenten Störtöne aus der Liste. Nebenbei: der Kommentar in Zeile 555 sagt 'Hervorstand und Dauer je zur Hälfte', die Gewichte sind aber 0,58 und 0,84.

**Beleg:** 'Wiese mit Insekten' (eca8fea7): die Referenz findet genau einen Störton, 7200,2 Hz, +15,1 dB, 82 % des Songs. Im Bandverfahren liegt er als Band 7251 Hz mit +11,6 dB in 40 % der Rahmen vor — über allen Schwellen. Die vollständige, ungekappte Liste zeigt ihn auf Rang 13 mit schwere 0,64; die acht Plätze sind mit Musiktönen (995, 837, 619, 499, 736, 913, 4709, 544 Hz, schwere 0,70 bis 0,97) belegt. Er wird nie angezeigt.

**Wirkung:** Selbst dort, wo das Bandverfahren einen echten Störton knapp erwischt, kommt er nicht auf den Schirm. Der Deckel wirkt genau gegen die Befunde, für die die Anzeige gedacht ist.

**Vorschlag:** Erst Musik aussortieren, dann deckeln. Solange nicht sortiert wird, den Deckel nach Frequenzgruppen vergeben (z. B. höchstens vier unter 2 kHz), damit der obere Bereich nicht verhungert.

### 18. Centroid im Index stammt aus einem einzigen 43-ms-Fenster bei 30 % der Spieldauer
**hoch** · `analyzer-worker.js`:707

**Fehler:** Die scalars-Nachricht rechnet Centroid und Rolloff aus GENAU EINER FFT von 2048 Werten, gelegt bei 30 % der Spieldauer: 'var fftSize=2048,mid=Math.floor(n*0.3); var magC=rfft(ch,mid,fftSize);'. Das sind 43 ms aus einem Song von vier Minuten. Ein Klangfarbenmaß ist ein Mittel über die Zeit; hier wird stattdessen eine Momentaufnahme genommen, die zufällig auf eine Pause, einen Beckenschlag oder eine Basstrommel fallen kann. bin/analyse-index.js:64 schreibt genau diesen Wert als 'centroid' in library/analyse-index.json - die Datei, die laut ihrem eigenen Kopf zum Sortieren und Filtern da ist. Die Oberfläche zeigt in derselben Karte einen anderen Wert: analyzer.js:5762 überschreibt den Ein-Fenster-Wert später mit dem Mittel über alle Rahmen. Zwei Zahlen, ein Name.

**Beleg:** Vergleich Ein-Fenster-Wert gegen Mittel über alle Rahmen (12 Songs, WAV-Quelle): 'Ulrich & Ännchen' 581 Hz statt 1382 Hz; 'Das Bild - Ich komme' 6151 Hz statt 2191 Hz; 'Checkout um Zwölf' 6787 Hz statt 3369 Hz. Verhältnis Ein-Fenster zu Rahmenmittel: 0,33 bis 2,15 - Streuung Faktor 6,5. Dasselbe Fenster eine Sekunde später verschoben: 'Das Bild' 6151 -> 1105 Hz, 'Ich betrachte uns' 1228 -> 683 Hz. Über 200 zufällige Fenster desselben Songs: p10 614 Hz, p50 2067 Hz, p90 4821 Hz. Elf der zwölf Indexwerte stimmen auf die Stelle genau mit dem nachgerechneten Ein-Fenster-Wert überein - der Mechanismus ist damit belegt.

**Wirkung:** Der Centroid im Analyse-Index ist ein Losentscheid. Jede Sortierung, jeder Songvergleich und jede Ähnlichkeitsrechnung, die diese Zahl benutzt, ordnet nach dem Zufall der 30-%-Stelle. Zusätzlich zeigen Karte und Index verschiedene Werte für dasselbe Feld.

**Vorschlag:** Den Ein-Fenster-Block streichen und die scalars-Nachricht denselben Rahmenmittelwert schicken, den die FFT-Runden ohnehin liefern (meanCentroid/meanRolloff, Zeile 1096). Rahmen unter einer Energieschwelle dabei ausschließen, sonst zählt Stille mit.

### 19. Rolloff summiert Amplituden statt Leistung - unter dem gemeldeten Wert liegen 94 bis 99 % der Energie, nicht 85 %
**hoch** · `analyzer-worker.js`:1068

**Fehler:** Der Schwellwert wird aus der Summe der BETRÄGE gebildet ('thr3=tot2*0.85' mit tot2=cden2, und cden2 ist die Summe von mag[k]), und aufsummiert wird ebenfalls mag[k]. Der Erklärungstext in analyzer.js:7558 sagt aber ausdrücklich 'Frequenz unterhalb derer 85% der Spektralenergie liegt'. Energie ist mag². Mit der Amplitudensumme zählt jedes Bin mit der Wurzel seiner Leistung - ein breites, leises Höhenband aus mehreren hundert Bins schlägt einen lauten, schmalen Bass. Bei fftSize 1024 und 48 kHz liegen 469 der 512 Bins über 2 kHz; die Grenze wandert deshalb in die Mitte der BIN-Achse statt dorthin, wo die Energie sitzt. Derselbe Fehler steht in der Ein-Fenster-Fassung in Zeile 713.

**Beleg:** Für jeden der 12 Songs habe ich das mittlere Leistungsspektrum (FFT 4096, ganzer Song) gerechnet und nachgesehen, wieviel Energie tatsächlich unter dem gemeldeten Rolloff liegt: 94,2 / 97,3 / 97,0 / 99,0 / 97,1 / 98,0 / 97,4 / 98,6 / 97,9 / 99,4 / 96,9 / 99,0 Prozent - nie 85. Der echte 85-%-Energiepunkt liegt weit tiefer: 'Wenn das Licht geht' 1090 Hz statt gemeldeter 8072 Hz (Faktor 7,4); 'Waldesrauschen' 480 statt 1395 Hz; 'Erweckt v2' 1055 statt 8223 Hz. Gegenprobe mit weißem Rauschen (flaches Spektrum, dort sind Amplituden- und Leistungssumme gleichwertig): der Kern meldet 20390 Hz, rechnerisch richtig sind 20400 Hz - die Formel stimmt also nur für ein flaches Spektrum, also für kein Musikstück.

**Wirkung:** Die Karte 'Rolloff Hz' meldet für jeden Song eine Frequenz, die zwei- bis siebenmal zu hoch liegt, und die Skala ('4-14 kHz Normalbereich') ist auf diese zu hohen Werte eingestellt. Der Wert misst nicht die Klanghelligkeit, sondern hauptsächlich die Breite des Rauschteppichs.

**Vorschlag:** Über mag[k]*mag[k] summieren und die Bezugsgröße in den Erklärungstext schreiben ('85 % der Leistung'). Danach die Skalengrenzen in cardScales.rolloff neu setzen - die alten passen dann nicht mehr.

### 20. Akkordwechsel/s zählt Rahmenflimmern und hängt an der Schrittweite der FFT-Runde
**hoch** · `analyzer-worker.js`:1129

**Fehler:** Für jeden einzelnen FFT-Rahmen wird aus einem 1024er-Chroma unabhängig der beste von 24 Dreiklängen gewählt; jeder Unterschied zum Vorrahmen zählt als Akkordwechsel (Zeile 1127). In der letzten Runde ist der Schritt 256 Werte = 5,3 ms, also 187 Rahmen je Sekunde. Was gezählt wird, ist damit nicht Harmonik, sondern das Zittern des Chroma von Rahmen zu Rahmen. Weil die Größe in jeder der fünf Runden neu gerechnet wird (Zeile 962: hop 8192, 4096, 2048, 1024, 256) und die Anzeige nach jeder Runde überschrieben wird, hängt die gezeigte Zahl allein daran, welche Runde zuletzt fertig war.

**Beleg:** Derselbe Song, fünf Runden: 'Ich betrachte uns' 1,02 -> 1,78 -> 3,03 -> 5,03 -> 14,83 Wechsel/s; 'Ik will …' 2,80 -> 5,39 -> 9,59 -> 18,09 -> 54,65. Der Wert wächst fast genau mit 1/Schrittweite. Über alle 321 Songs (letzte Runde, das ist der gespeicherte Wert): min 2,56, p50 20,0, max 62,1 Wechsel je Sekunde. Die Skala der Karte (cardScales['chord-rate']) reicht von 0 bis 2 mit p95=1,5 - kein einziger der 321 Songs liegt im Anzeigebereich.

**Wirkung:** Die Karte 'Akkordwechsel/s' zeigt für jeden Song eine physikalisch unmögliche Zahl (20 Akkorde je Sekunde im Mittel) und der Zeiger steht bei allen 321 Songs am rechten Anschlag. Die Größe geht außerdem mit 20 % Gewicht in den Textur-Index ein und sprengt ihn dort.

**Vorschlag:** Den Akkord nicht je Rahmen bestimmen, sondern über ein Fenster von etwa einer halben bis einer Sekunde mitteln, und einen Wechsel erst zählen, wenn der neue Akkord mehrere Fenster lang hält. Dann ist das Ergebnis von der Rundenschrittweite unabhängig.

### 21. Textur-Index steht bei 286 von 321 Songs auf 100 %, weil die Akkordrate die Formel sprengt
**hoch** · `analyzer.js`:5773

**Fehler:** 'var texture=Math.round((sc.entropy*0.4+(1-meanHarm)*0.4+sc.chordRate/2*0.2)*100); texture=Math.min(100,texture);' - der dritte Summand teilt die Akkordrate durch 2, unterstellt also einen Wertebereich 0..2 Wechsel/s. Tatsächlich liegt die Akkordrate zwischen 2,6 und 62,1. Allein dieser Summand ergibt im Mittel 2,0 statt höchstens 0,2 und schiebt die Summe über den Deckel. Die beiden anderen Anteile, um die es eigentlich geht, sind damit wirkungslos. Zusätzlich stimmt der Erklärungstext (analyzer.js:7564) nicht mit dem Code überein: er nennt 'Inharmonizität (40%)', gerechnet wird (1-meanHarm), also die Gegen-Harmonizität aus harmArr.

**Beleg:** Rohwert der Formel vor Math.min für alle 321 Songs aus den gespeicherten Analysen: min 42 %, p10 99 %, p50 220 %, p90 398 %, max 653 %. Auf 100 geklemmt werden 286 von 321 Songs = 89 %. Von den 12 nachgerechneten Songs zeigen 10 exakt '100 %', nur '1 Unter der Haut IV' (80 %) und 'Waldesrauschen' (97 %) liegen darunter.

**Wirkung:** Die Karte 'Textur-Index' sagt bei neun von zehn Songs dasselbe ('100 %', Skalentext 'extrem dicht') und unterscheidet damit nichts mehr - auch nicht zwischen 'Ulrich & Ännchen' (mittelalterliche Ballade) und 'Asche und Staub' (Metal).

**Vorschlag:** Die Akkordrate zuerst reparieren, dann durch einen Wert teilen, der zum reparierten Bereich paßt, und den Erklärungstext auf die tatsächlich benutzte Größe umschreiben. Wenn ein Anteil geklemmt werden muß, gehört die Klemme auf den einzelnen Summanden, nicht auf die Summe.

### 22. Inharmonizität kann nicht messen, was sie heißt: das Suchfenster ist immer genau ein Bin breit
**hoch** · `analyzer-worker.js`:1052

**Fehler:** 'var searchW=Math.max(1,Math.round(f0bin*0.1));' - bei fftSize 1024 liegt der Tonhöhen-Bin f0bin zwischen 2 und 13 (hpsPitch sucht nur zwischen 80 und 600 Hz, Zeile 97), also ist f0bin*0.1 immer unter 1,35 und searchW immer genau 1. Der Beitrag jedes Teiltons kann deshalb nur 0 oder 1/(f0bin*h) sein - eine Treppe, die allein vom Tonhöhen-Bin abhängt, nicht vom Klang. Was Inharmonizität physikalisch bedeutet (f_h = h*f0*sqrt(1+B*h²), Saitensteifigkeit) kommt in der Formel nicht vor. Dazu: der 'Gipfel' ist einfach das größte von drei benachbarten Bins - bei Rauschen ein Münzwurf.

**Beleg:** Prüfung mit Signalen, deren Antwort feststeht (30 s, 48 kHz): reiner Sinus 220 Hz -> Anzeige 122,7 (richtig wäre 0, ein Sinus hat keine Obertöne). Sägezahn 220 Hz mit 16 exakt ganzzahligen Teiltönen -> 49,1 (richtig wäre 0). Über alle 321 Songs liegen die Werte in dem engen Band 59,5 bis 93,1 - genau in dem Bereich, den die Bin-Treppe für f0bin 2 bis 4 vorgibt (122,7 / 81,8 / 61,4). Die Anzeige (analyzer.js:5765) rechnet iv=sc.inharm*1000 und setzt den Zeiger auf Math.min(100, iv*5); ab iv=20 steht er am Anschlag - bei allen 321 Songs.

**Wirkung:** Die Karte 'Inharmonizität' liefert für jeden Song eine Zahl um 75 und einen Zeiger am rechten Anschlag mit dem Text 'extrem inharmonisch'. Die Größe entscheidet außerdem in der Instrumentenerkennung (analyzer.js ab 4720: 'if(inharmMed>0.03&&inharmMed<0.12) guitarScore+=2') über Gitarre/Klavier/Synthesizer, obwohl sie nur die Tonhöhenlage kennt.

**Vorschlag:** Ohne feinere Frequenzauflösung ist die Größe nicht zu retten. Entweder mit deutlich größerer FFT und Parabel-Interpolation des Gipfels rechnen (dann wird die Abweichung ein Bruchteil eines Bins statt 0 oder 1), oder die Karte streichen, bis das da ist.

### 23. Kirchentonart: die sieben Modi sind punktgleich, der Gewinner entscheidet sich in der letzten Nachkommastelle
**hoch** · `analyzer-worker.js`:1150

**Fehler:** Die Bewertung addiert nur die Chroma-Werte der sieben Stufen und zieht die übrigen fünf zur Hälfte ab. Damit bewertet sie ausschließlich den TONVORRAT. C-Ionisch, D-Dorisch, E-Phrygisch, F-Lydisch, G-Mixolydisch, A-Äolisch und B-Lokrisch haben aber denselben Tonvorrat - die 84 Paare (Grundton, Modus) ergeben nur 12 verschiedene Mengen. Was einen Modus ausmacht, ist der Grundton, und der geht in die Rechnung überhaupt nicht ein. Weil 'if(score>bestModeScore)' echt größer verlangt, gewinnt bei Gleichstand, wer zuerst drankommt; und weil die sieben Summen in verschiedener Reihenfolge addiert werden, entscheidet die Fließkomma-Rundung.

**Beleg:** Nachgebaut und geprüft: 84 Paare ergeben 12 verschiedene Tonvorräte. Ein eindeutiges A-Moll-Chroma wird als 'C Ionisch' gemeldet. Die sieben besten Lesungen eines echten Chroma-Vektors: C Ionisch 4,055000000000001 / D Dorisch 4,055000000000001 / G Mixolydisch 4,055000000000001 / A Äolisch 4,055000000000001 / E Phrygisch 4,055000000000000 / F Lydisch 4,055000000000000 / B Lokrisch 4,055000000000000 - ein Tonvorrat, Unterschied in der 15. Stelle. In der Sammlung: 265 von 321 Songs 'Dorisch', 45 'Mixolydisch', 11 'Lokrisch' - und kein einziger Ionisch oder Äolisch, also nie normales Dur oder Moll.

**Wirkung:** Die Karte 'Modus' behauptet bei 82 % der Songs 'Dorisch'. Das ist keine Aussage über die Musik, sondern über die Schleifenreihenfolge in Zeile 1144. Der Erklärungstext (analyzer.js:7561) verspricht ausdrücklich 'Ionisch = normales Dur, Äolisch = normales Moll' - beides kommt nie vor.

**Vorschlag:** Den Grundton mitbewerten - z. B. Korrelation mit einem Profil je Modus, wie es schaetzeTonart mit den Krumhansl-Profilen für Dur/Moll schon richtig macht - statt nur die Stufenmenge zu summieren. Bis dahin ist die Karte irreführend.

### 24. Harmonische Dichte antwortet umgekehrt: weißes Rauschen 15,8 statt ~0, reiner Sinus 5,0 statt 1
**hoch** · `analyzer-worker.js`:1086

**Fehler:** 'for(var h=1;h<=16;h++){var hb=Math.round(f0bin*h); if(mag[hb]>noiseFloor) harmDens++;}' mit noiseFloor=mag[f0bin]*0.1. Gezählt wird also, wie viele von 16 Bins über einem Zehntel des Grundton-Bins liegen. Bei f0bin=2 sind das die Bins 2, 4, 6, ..., 32 - ein Kamm über das untere Ende des Spektrums, kein Obertonsatz. Ein Signal mit gleichmäßig verteilter Energie erfüllt die Bedingung an jeder Stelle und bekommt deshalb den Höchstwert; ein reiner Sinus bekommt mehrere Treffer, weil das Hann-Fenster in die Nachbarbins streut. Die Größe zählt Spektraldichte, nicht Obertöne.

**Beleg:** Prüfsignale, 30 s, 48 kHz: weißes Rauschen -> 15,83 von 16 (der Erklärungstext analyzer.js:7569 sagt 'weißes Rauschen ≈ 0'); reiner Sinus 220 Hz -> 5,00 (Text: 'Sinuston = 1'); Sägezahn 220 Hz mit genau 16 Teiltönen -> 3,00 (richtig wären 16). Über alle 321 Songs: 4,3 bis 12,0 - der Bereich, in dem dichte Mischungen liegen.

**Wirkung:** Die Karte 'Harmonische Dichte' zeigt das Gegenteil dessen, was ihr Erklärungstext verspricht: je rauschiger, desto höher. Sie geht mit in die Instrumentenerkennung (analyzer.js 4696 ff.) und verdreht dort die Entscheidung zwischen Schlagzeug, Orgel und Sinusflächen.

**Vorschlag:** Den Grundton erst genau bestimmen, dann je Teilton den Gipfel im Umfeld suchen und ihn gegen den örtlichen Rauschboden im Umfeld prüfen, nicht gegen den Grundton. Ohne brauchbaren Grundton kann die Größe nicht funktionieren.

### 25. Attack bleibt bei 297 von 321 Songs leer; die 24 gefüllten Werte gehen bis 19 Sekunden auf einer 0-500-ms-Skala
**hoch** · `analyzer.js`:5808

**Fehler:** Gesucht wird der erste Anstieg von 10 % auf 90 % - aber der Bezug ist der GRÖSSTE Energierahmen des ganzen Songs ('var peak' über die vollständige energy-Reihe), und gesucht wird nur in den ersten 400 Rahmen = 20 Sekunden. Der lauteste Moment eines Songs liegt fast nie in den ersten zwanzig Sekunden; also wird t90 nie gefunden und die Bedingung 't10>=0&&t90>t10' scheitert. Wo sie doch greift, mißt man nicht den Anschlag eines Tons, sondern wie lange das Intro braucht - in Rasterschritten von 50 ms. Dieselbe Rechnung steht zweimal im Code (5658 ff. und 5792 ff.).

**Beleg:** Nachgerechnet mit den gespeicherten Hüllkurven aller 321 Songs, exakt nach dem Code der Oberfläche: gefüllt bei 24 Songs, leer bei 297. Die 24 Werte lauten 50, 600, 800, 1050, 1100, 1200, 1450, 1600, 1700, 2250, 4300, 4550, 5300, 6700, 6700, 7650, 8200, 8400, 10250, 13250, 15700, 16100, 17700, 19100 ms. Die Skala der Karte (cardScales.attack) reicht von 0 bis 500 ms; 23 der 24 Werte liegen darüber. Bei allen 12 einzeln nachgerechneten Songs bleibt die Karte leer.

**Wirkung:** Die Karte 'Attack ms' steht bei 93 % der Songs auf '—'. Wo sie etwas zeigt, ist es die Intro-Länge in Sekunden, nicht eine Anschlagzeit. Der Wert geht außerdem in die Instrumentenerkennung ein (analyzer.js 4691: 'if(attackMs>0&&attackMs<40) drumScore+=2') - dort ist er praktisch immer 0 und stimmt für kein Instrument.

**Vorschlag:** Nicht den Songgipfel als Bezug nehmen, sondern je erkanntem Einsatz den örtlichen Gipfel, und über alle Einsätze mitteln. Dafür braucht es eine feinere Hüllkurve als 50 ms - die envStep-Kurve mit 10 ms liegt schon vor (analyzer-worker.js:665).

### 26. Die Tempo-Karte zeigt den schlechtesten der drei Schätzer, der Erklärungstext nennt ihn den robustesten
**hoch** · `analyzer.js`:5688

**Fehler:** Die Karte wird zuletzt aus dem Median der IOI-Median-Kurve gesetzt. Deren Verfahren (analyzer-worker.js ab 826) sucht Gipfel in einer 20-ms-Energiekurve mit Mindestabstand 10 Rahmen und behält nur Abstände zwischen 50 und 200 BPM. Damit zählt es nicht Taktschläge, sondern Notendichte: Achtel und Sechzehntel fallen in dasselbe Fenster und ziehen den Median in die Mitte des erlaubten Bereichs. Der Erklärungstext (analyzer.js:7553) nennt dieses Verfahren 'Robustester der drei Algorithmen'.

**Beleg:** Gegen Sunos eigene Schlagzeiten (Feld 'schlaege', Tempo = 60/Median der Abstände), 306 taktfeste Songs: Autokorrelationswert (scalars.bpm, steht im Index) 165 richtig auf ±3 % = 53,9 %; IOI-Median (steht auf der Karte) 81 richtig = 26,5 %. Betrag der relativen Abweichung p50: Autokorrelation 1,2 %, IOI 20,0 %. Die 173 IOI-Fehlschläge häufen sich bei 110-140 BPM unabhängig vom wahren Tempo (Suno-Median 104, IOI-Median 126). Beispiele: 'Mensch Mädel' Suno 84,2 - Karte 152,5; 'Digitale ID' Suno 96,4 - Karte 141,1; 'Abend im Park' Suno 73,9 - Karte 105,1.

**Wirkung:** Drei von vier Tempoangaben auf der Karte sind falsch, und der zuverlässigere Wert liegt im selben Programm bereits vor. Außerdem stehen auf Karte und im Index verschiedene Tempi für denselben Song ('Waldesrauschen': Karte 80,8, Index 60,0, Suno 120,0).

**Vorschlag:** Wo Sunos schlaege vorliegen (321 von 321 Songs, 306 taktfest), das Tempo daraus nehmen - das tut bin/katalog.js:100 als taktBpm bereits. Die gemessenen Kurven bleiben als Verlauf sinnvoll, die EINE Zahl auf der Karte sollte die verläßlichste sein.

### 27. Tonhöhe wird auf ein Raster von 23,4 Hz gerundet - nur 15 verschiedene f0-Werte für 321 Songs
**hoch** · `analyzer-worker.js`:1037

**Fehler:** Die Tonhöhe kommt aus hpsPitch mit fftSize 1024 (Zeile 1037) bzw. aus der Stimmanalyse mit fftSize 2048 (Zeile 793 ff.) und wird als bestK*sr/fftSize zurückgegeben - der nackte Bin-Index, ohne jede Interpolation. Bei 48 kHz sind das 46,9 Hz bzw. 23,4 Hz Schrittweite. Weil außerdem nur zwischen 80 und 600 Hz gesucht wird (Zeile 97), bleiben zwölf mögliche Tonhöhen übrig. Bei 117 Hz ist ein Bin 3,4 Halbtöne breit; zwischen den beiden untersten Bins liegen sieben Halbtöne. Eine Tonhöhe mit Quintauflösung ist keine Tonhöhe.

**Beleg:** library/analyse-index.json enthält für 321 Songs genau 15 verschiedene f0-Werte: 86, 94, 108, 117, 129, 141, 151, 164, 172, 188, 211, 234, 258, 281, 305 Hz. Das sind exakt die Bins 4 bis 8 bei 44,1 kHz (Raster 21,5 Hz) und 4 bis 13 bei 48 kHz (Raster 23,4 Hz). Gegenprobe mit einem reinen Sinus von 220 Hz: der Kern meldet 94 Hz - ein Oktavfehler des HPS-Verfahrens dazu. Die Tonhöhenkurve eines Songs nimmt über 70000 Rahmen nur elf verschiedene Werte an.

**Wirkung:** Die Karte 'F0' und die Tonhöhenspur zeigen ein Treppenmuster statt einer Melodie. Alles, was darauf aufbaut, erbt den Fehler: Noten-Stabilität, Inharmonizität, Harmonische Dichte und die Stimmerkennung (deren Grenzen 160/200 Hz zwischen die Rasterpunkte fallen).

**Vorschlag:** Den Gipfel parabolisch zwischen den Bins interpolieren - drei Zeilen, kostet nichts und bringt sofort etwa ein Zehntel Bin Genauigkeit. Für tiefe Männerstimmen zusätzlich die FFT auf 4096 vergrößern oder auf ein Zeitbereichsverfahren (Autokorrelation/YIN) umstellen.

### 28. Der f0-Median wird über alle Fenster gebildet, auch über die rein instrumentalen
**mittel** · `analyzer-worker.js`:810

**Fehler:** detectedF0s (Zeile 792) wird in jedem Fenster gefüllt, das das Mitten-Tor passiert hat — und das sind praktisch alle. Der Median in Zeile 810 läuft damit über Intro, Solo, Break und Ausklang mit. Bei einem Stück, das zur Hälfte instrumental ist, bestimmt die instrumentale Hälfte die angezeigte „Grundfrequenz der Stimme" mit.

**Beleg:** Über alle 321 Songs wurden im Median 250 von 305 Fenstern gezählt, im Minimum 86, im Maximum 458 — bei einem Hop von 1 s heißt das: die ganze Spieldauer geht ein. Bei Okkultation (352 s) sind es 308 von 353 Fenstern; das Stück hat lange instrumentale Teile. Direkter Beleg für die Folge: die 64 Stücke ohne jeden Gesang liefern denselben f0-Median (117 Hz) wie die 109 Stücke mit männlicher Stimme.

**Wirkung:** Selbst wenn die f0-Schätzung repariert wäre, mischte der Median Gesangs- und Instrumentalstellen zu einer Zahl, die keiner von beiden entspricht.

**Vorschlag:** Den Median nur über die Fenster bilden, die ein tragfähiges Stimmkriterium erfüllt haben — und die Anzahl dieser Fenster mitliefern, damit sichtbar ist, worauf die Zahl beruht.

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

### 31. Die Tonhöhenspur hat 46,9 Hz Auflösung, und der Hilfetext beschreibt eine Funktion, die es nicht gibt
**mittel** · `analyzer.js`:7644

**Fehler:** Der zweite f0-Weg (analyzer-worker.js Zeile 1037, hpsPitch auf fftSize2=1024) hat bei 48 kHz eine Auflösung von 46,875 Hz. Der Hilfetext zum Panel „Stimmfrequenzen" verspricht dagegen: Bereich 80–600 Hz, nur Rahmen mit Harmonizität über 35 %, blau für F0<165 Hz, orange für F0>185 Hz, Grau als Übergangsbereich, und eine zweite Stimme per Spectral Subtraction. Die zeichnende Funktion drawPitchFromFrames (analyzer.js Zeile 6627–6718) filtert nicht nach Harmonizität (nur f>60 && f<2000), färbt nicht nach Stimmlage, sondern weiß/gelb/orange nach Notenstabilität, und im Kern gibt es keinen zweiten f0-Durchgang und keine Spektralsubtraktion — nur den einen hpsPitch-Aufruf in Zeile 1037.

**Beleg:** Tonhöhenspur zweier Songs durch den echten Kern ausgelesen. Vanille-Eis: 57.175 Rahmen, genau 11 verschiedene Werte, alle Vielfache von 46,875 Hz (93,8 / 140,6 / 187,5 / 234,4 / 281,3 / 328,1 / 375,0 / 421,9 / 468,8 / 515,6 / 562,5). 93,8 Hz allein in 30.199 Rahmen = 53 %. Monolith: 56.412 von 66.070 Rahmen auf 93,8 Hz. Im vom Hilfetext genannten Graubereich 165–185 Hz: 0 Rahmen in beiden Songs — er ist physikalisch unerreichbar, weil dort kein Bin liegt. Rahmen mit Harmonizität über 35 %: 53.903 von 57.175 bzw. 61.268 von 66.070 — die Zeichnung filtert danach ohnehin nicht.

**Wirkung:** Die Spur wird in der Zeichnung auf Halbtöne gerundet; bei 46,9 Hz Rasterabstand liegen benachbarte Rasterpunkte in Stimmlage 3 bis 7 Halbtöne auseinander. Das Bild kann keine Melodie zeigen, sondern nur, auf welchem der elf Bins der Rahmen gelandet ist. Wer den Hilfetext liest, hält die Balken für gefilterte Gesangstöne mit Geschlechtsfarbe.

**Vorschlag:** Entweder die Spur auf ein Verfahren mit brauchbarer Auflösung stellen (Autokorrelation, oder Parabelinterpolation über die Nachbarbins) — oder, bis dahin, den Hilfetext auf das zurückführen, was die Zeichnung wirklich tut.

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

### 46. Spektral-Tilt stellt 10 Bass-Bins gegen 469 Höhen-Bins - rosa Rauschen gilt als treblelastig
**mittel** · `analyzer-worker.js`:1080

**Fehler:** 'tiltArr[frame]=(bassE-trebleE)/(bassE+trebleE)' mit bassE = Summe der BETRÄGE über Bins 1 bis 10 und trebleE = Summe über Bins 43 bis 511. Drei Dinge stimmen nicht: (1) es wird nicht auf die Bandbreite normiert, die Höhen bekommen 47-mal so viele Summanden; (2) es sind Amplituden, nicht Leistungen; (3) das Band zwischen 500 und 2000 Hz - dort steckt der Hauptteil der Musik - kommt gar nicht vor. Der Erklärungstext (analyzer.js:7568) nennt außerdem falsche Grenzen: bei fftSize 1024 und 48 kHz reicht das Bassband von 47 bis 469 Hz (nicht ab 20 Hz, so tief gibt es kein Bin) und das Höhenband bis 23953 Hz (nicht bis 16 kHz). Ein Tilt ist üblicherweise eine Steigung in dB je Oktave; das hier ist ein Bin-Zählverhältnis.

**Beleg:** Rosa Rauschen (gleiche Leistung je Oktave - der übliche neutrale Bezug beim Abmischen) ergibt tilt = -0,720, auf der Skala 'sehr hell / treblelastig'. Weißes Rauschen ergibt -0,958, also fast den Extremwert -1. Über alle 321 Songs liegt der Median bei +0,051, die Spanne bei -0,551 bis +0,900 - der Nullpunkt der Anzeige entspricht also keinem definierten Klang.

**Wirkung:** Die Karte 'Spektral Tilt' hat keinen erkennbaren Nullpunkt; positiv/negativ trennt nicht bassig von hell, sondern nur Songs mit viel Tiefton von allen anderen. Sie geht mit in die Instrumentenerkennung ein (analyzer.js:4706).

**Vorschlag:** Beide Bänder durch ihre Bin-Anzahl teilen (also mittlere Leistungsdichte statt Summe) und in dB rechnen, oder gleich eine Ausgleichsgerade durch das Log-Log-Spektrum legen und deren Steigung in dB/Oktave angeben - dann stimmt auch die Bezeichnung.

### 47. Grenzfrequenz ist bei 19,57 kHz gedeckelt und kennt nur 12 verschiedene Werte; 242 von 321 Songs liegen am Deckel
**mittel** · `analyzer-worker.js`:508

**Fehler:** Gesucht wird das oberste der 160 logarithmischen Bänder, das noch über 'Bezug minus 50 dB' liegt, und zurückgegeben wird die MITTENFREQUENZ dieses Bandes ('var grenze=bv.mitten[BAENDER-1]' als Startwert). Weil BAND_BIS in Zeile 444 auf 20000 festgelegt ist, ist die oberste Bandmitte 19572,9 Hz - mehr kann die Funktion nie melden, auch wenn das Signal bis zur halben Abtastrate reicht. Bei 48 kHz Abtastrate wären das 24 kHz. Der Deckel liegt also unter dem, was das Material tatsächlich enthält.

**Beleg:** Über alle 321 Songs gibt es nur 12 verschiedene Werte (10694, 11659, 12710, 13271, 14468, 15106, 15773, 16469, 17195, 17954, 18746, 19573 Hz), und 242 davon (75 %) melden exakt 19572,9 Hz - den Höchstwert. Prüfung mit selbst erzeugten MP3s aus demselben Song: bei 64 kbit/s meldet der Kern 11,2 kHz (echte Kante 11,2), bei 96 kbit/s 15,1 (echt 14,9), bei 128 kbit/s 16,5 (echt 16,0) - das funktioniert. Bei 320 kbit/s meldet er 19,6 kHz (echte Kante 20,1) und beim unkomprimierten WAV ebenfalls 19,6 kHz (echte Kante 24,0). Über 19,6 kHz kann er MP3 und WAV nicht mehr unterscheiden.

**Wirkung:** Für drei Viertel der Sammlung steht auf der Karte dieselbe Zahl, und sie sagt nur 'irgendwo über 19,6 kHz'. Gerade der Fall, für den die Karte gedacht ist - erkennen, ob eine Datei bandbegrenzt ist -, ist bei Caspar_Ds 48-kHz-Material der ungeprüfte.

**Vorschlag:** BAND_BIS an die halbe Abtastrate koppeln statt fest auf 20000, und statt der Bandmitte die interpolierte Stelle des Schwellwertdurchgangs melden. Dann steht am oberen Ende 24,0 kHz für 'nicht begrenzt' und die Auflösung ist nicht mehr auf 12 Stufen beschränkt.

### 48. Noten-Stabilität wird durch den längsten Lauf DESSELBEN Songs geteilt und ist deshalb zwischen Songs nicht vergleichbar
**mittel** · `analyzer-worker.js`:1115

**Fehler:** 'for(var i=0;i<numFrames;i++) noteStabArr[i]/=maxStab;' - jeder Lauf wird durch den längsten Lauf des eigenen Songs geteilt. Das Maximum ist damit bauartbedingt immer genau 1,0, und der Mittelwert sagt nur, wie ein Song sich zu seinem eigenen ruhigsten Moment verhält. Die Karte zeigt diesen Mittelwert aber auf einer absoluten Skala mit Texten wie 'extrem statisch / Drone'. Zweiter Fehler: die Schwelle für einen Notenwechsel ist 1,5 Halbtöne (Zeile 1111), aber das Tonhöhenraster kann unterhalb von 516 Hz gar keinen Schritt unter 1,5 Halbtönen darstellen - der kleinste mögliche Sprung zwischen benachbarten Bins beträgt 7,0 / 5,0 / 3,9 / 3,2 / 2,7 / 2,3 / 2,0 / 1,8 / 1,7 / 1,5 Halbtöne. Jedes Zittern des Bins gilt daher als neue Note.

**Beleg:** Zwei selbst erzeugte Signale: A = 30 Noten zu je 2 Sekunden -> 77 %. B = genau dieselbe Melodie, dahinter ein 30 Sekunden gehaltener Ton -> 37 %. Die 2-Sekunden-Noten sind in beiden identisch. Über 40 Songs aus der Ablage liegt der Wert zwischen 4 % und 24 % (p50 11 %); die Skala nennt alles unter 30 % 'eher unruhig / viele Glissandi' - das gilt damit für jeden Song.

**Wirkung:** Die Karte 'Noten-Stabilität' vergleicht Songs mit sich selbst und wird trotzdem als absoluter Wert gelesen. Ihre Aussage kippt allein dadurch, ob irgendwo im Song ein langer Ton liegt.

**Vorschlag:** Die Lauflängen in Sekunden umrechnen (Lauf * hop/sr) und den Median angeben - 'Note wird im Mittel 0,8 s gehalten' ist vergleichbar und lesbar. Die Normierung auf maxStab nur für die Farbgebung der Kurve behalten.

### 49. Fast alle Messgrößen werden nur aus dem linken Kanal gerechnet
**mittel** · `analyzer-worker.js`:576

**Fehler:** 'var ch=left, n=ch.length, dur=n/sr;' - danach benutzen Hüllkurve, Energie, BPM, Centroid, Rolloff, Tonart, Struktur, Stimmanalyse und alle FFT-Runden ausschließlich 'ch', also den linken Kanal. Nur Lautheit, True Peak, Stereobreite und Phasenkorrelation sehen beide Kanäle. Bei breit abgemischtem Material ist der linke Kanal aber nicht das Stück, sondern eine Hälfte davon; die Mitte (L+R)/2 wäre der übliche Bezug und für die Klangfarbe auch der richtige.

**Beleg:** Kanäle getauscht und dieselbe Analyse noch einmal laufen lassen: '1 Unter der Haut IV' (Stereobreite 0,77) meldet Tonart 'D Moll' aus dem linken und 'G Moll' aus dem rechten Kanal, Centroid 874 gegen 977 Hz (11,7 % Unterschied). 'Ich betrachte uns' (Breite 0,50): Tonart 'C# Dur' gegen 'A# Moll', Centroid 2002 gegen 2295 Hz (14,6 %). Bei mittigem Gesang ('Ulrich & Ännchen') bleibt alles gleich.

**Wirkung:** Bei breit abgemischten Stücken hängt die gemeldete Tonart davon ab, welcher Kanal zuerst kommt. Das erklärt einen Teil der Tonart-Streuung, die sonst als Ratefehler des Verfahrens erscheint.

**Vorschlag:** 'var ch' aus der Mitte bilden: ch[i] = (left[i]+right[i])/2. Das ist eine Zeile und ändert nichts an den geprüften Normwerten, weil die ohnehin beide Kanäle nehmen.

### 50. Harmonizität ist mit Faktor 4 überstreckt und steht bei 70 % der Rahmen am Anschlag
**mittel** · `analyzer-worker.js`:1041

**Fehler:** 'harmArr[frame]=totalE>0?Math.min(1,harmE/totalE*4):0;' - der Anteil der Energie in den ersten sechs Vielfachen des Grundton-Bins wird mit 4 malgenommen und dann bei 1 abgeschnitten. Sobald ein Viertel der Energie in diesem Kamm sitzt, ist der Wert 1 und alles darüber wird nicht mehr unterschieden. Der Faktor 4 ist eine reine Streckung ohne Begründung im Code; er verwandelt eine stetige Größe in ein fast binäres Signal.

**Beleg:** Anteil der Rahmen, die genau auf 1,0 stehen, über 40 Songs aus der Ablage: p10 = 50 %, p50 = 70 %, p90 = 87 %. Der Mittelwert der Kurve liegt bei den 12 nachgerechneten Songs zwischen 0,752 und 0,964 - also fast durchweg im gesättigten Bereich.

**Wirkung:** Die Harmonizitätskurve ist über weite Strecken eine gerade Linie am oberen Rand. Sie geht mit 40 % Gewicht in den Textur-Index ein (analyzer.js:5773) und trägt dort deshalb praktisch keine Information mehr bei.

**Vorschlag:** Den Faktor 4 streichen und die Skala der Kurve stattdessen auf den tatsächlich vorkommenden Bereich legen, oder den Anteil in dB angeben. Wenn geklemmt werden muß, dann erst weit oberhalb des üblichen Bereichs.

### 51. Die BPM-Autokorrelation kennt nur 68 mögliche Ergebnisse und ist nicht auf die Überlappungslänge normiert
**mittel** · `analyzer-worker.js`:697

**Fehler:** Gerechnet wird auf einer Hüllkurve mit 100 Werten je Sekunde, die Verschiebung läuft ganzzahlig von 33 bis 100, und das Tempo ist bpm=6000/bestL. Damit gibt es genau 68 darstellbare Tempi zwischen 60,0 und 181,8 BPM; bei 180 BPM liegen die Nachbarwerte 5,4 BPM auseinander. Außerdem summiert 'for(var i=0;i<diff.length-lag;i++)' bei großen Verschiebungen über weniger Glieder als bei kleinen, ohne durch die Anzahl zu teilen - das bevorzugt systematisch kurze Verschiebungen, also hohe Tempi.

**Beleg:** Alle 321 BPM-Werte in library/analyse-index.json sind exakt 6000/ganze Zahl; es kommen nur 67 verschiedene Werte vor. Gegen Sunos Schlagzeiten (306 taktfeste Songs): 165 richtig (53,9 %), 56 im halben Tempo, 21 im doppelten, 47 auf einem anderen Bruchteil, 17 völlig daneben. Beispiel für die Rasterwirkung: 'Das Bild - Ich komme' hat laut Suno 141,4 BPM; das Raster kennt nur 142,86 (Lag 42) und 146,34 (Lag 41), gemeldet wird 146,3.

**Wirkung:** Selbst wo das Verfahren den richtigen Schlag findet, ist der Wert auf ein grobes Raster gerundet; eine Sortierung nach Tempo bringt Songs mit 3 BPM Unterschied in dieselbe Stufe.

**Vorschlag:** Den Gipfel der Autokorrelation zwischen den ganzzahligen Verschiebungen interpolieren und die Summe durch die Anzahl der Glieder teilen. Beides zusammen ist ein Dutzend Zeichen und behebt Raster und Schieflage.

### 52. Lücken in der Tonhöhenspur werden mit erfundenen Werten gefüllt
**niedrig** · `analyzer-worker.js`:1103

**Fehler:** pitchArr[i]=(pitchArr[i-1]+pitchArr[i+1])/2 für jedes i mit Wert 0. Eine Null heißt an dieser Stelle „keine Tonhöhe gefunden" — also Stille oder unharmonisches Signal. Das Mittel der Nachbarn setzt dort eine Tonhöhe hin, die nie gemessen wurde. Weil die Schleife von links nach rechts läuft und den eben erst gesetzten Wert weiterverwendet, entsteht in längeren Lücken eine Halbierungskette.

**Beleg:** Tonhöhenspur von Monolith: neben den 11 Rasterwerten stehen die Werte 82,0 · 41,0 · 20,5 · 10,3 · 5,1 · 2,6 · 1,3 · 0,6 · 0,3 · 0,2 · 0,1 Hz, jeweils genau einmal — die Halbierungskette einer Lücke am Rand. Dazu 46,9 · 35,15 · 11,72 · 5,86 Hz, ebenfalls je einmal. Keiner dieser Werte kann aus hpsPitch stammen, dessen kleinster möglicher Rückgabewert 93,75 Hz ist.

**Wirkung:** Der Hilfetext sagt „Lücken = Instrumental, Pause" — die Lücken werden aber vorher zugeschüttet. Und die eingesetzten Werte liegen teils weit unterhalb des Suchbereichs, tauchen also als Phantomtöne im Datensatz auf.

**Vorschlag:** Lücken als Lücken stehen lassen. Wenn geglättet werden soll, dann nur über Rahmen, die selbst einen Wert hatten, und höchstens über eine Lücke von ein bis zwei Rahmen — nicht über beliebig lange.

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
