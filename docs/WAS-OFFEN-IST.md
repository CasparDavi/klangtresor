# Was offen ist

**Zusammengeführt am 25.08.2026** aus zwölf Dokumenten — Caspar_D:
*„in wievielen Dateien sammeln wir gerade geplante Implementierungen
bzw. andere ToDos, bitte alles vereinigen."* Es waren zwölf.

**Diese Datei ist ab jetzt die Arbeitsliste.** Die Fachdokumente
bleiben, was sie sind: Berichte mit Messungen und Begründungen. Wer
wissen will, WARUM etwas ansteht, folgt der Quellenangabe; wer wissen
will, WAS ansteht, liest hier.

**179 Punkte**, nach Dedup und ohne das am 25.08. Erledigte.
Aufwand: **S** klein, **M** mittel, **L** groß, **?** unklar.

| | Punkte |
|---|---|
| Fehler | 46 |
| Pflicht | 26 |
| Entscheidung | 27 |
| Verbesserung | 60 |
| Idee | 20 |

---


## Fehler


### S · 'True Peak je Fenster' ist stellenweise nur die Abtastspitze

Überabgetastet wird nur um Abtastwerte über der halben globalen Spitze; in leisen Fenstern steht in der Kurve deshalb die blanke Abtastspitze, bei 'Pasta al Limone' 82 von 3592 Fenstern bis 1,09 dB zu tief. Die Plattformurteile hängen nicht daran, die Beschriftung 'spitzeVerlauf (True Peak je Fenster)' löst ihr Versprechen dort aber nicht ein. Entweder die Schwelle an die angezeigte Plattformschwelle koppeln oder die Reihe ehrlich benennen; zusätzlich den interpolierten Wert dem Fenster von m zuschlagen statt dem von i.

*Quelle: docs/ANALYZER-PRUEFUNG.md, Fund 58 (analyzer-worker.js:407) · wartet auf: nichts — kann sofort gemacht werden*

### S · --bgrund wird gesetzt, aber nirgends gelesen

Die CSS-Eigenschaft --bgrund wird gesetzt und von keiner Stelle ausgewertet. Entweder ist eine beabsichtigte Wirkung nie angeschlossen worden, oder sie ist ein Rest aus dem Umbau der Bühnentext-Lesbarkeit und gehört nach der Hausregel „wer ersetzt, räumt ab" heraus. Erst klären, welcher Fall vorliegt.

*Quelle: docs/NAECHSTER_CHAT.md — „Nachtrag 24.08.2026 (Nachmittag)", Abschnitt „Offen und lohnend" · wartet auf: nichts — kann sofort gemacht werden*

### S · Abspielknopf im Bühnenpult zeigt den falschen Zustand

Der Abspielknopf hängt am Fortschritt statt am Play-Ereignis. Beim Pausieren bleibt er deshalb auf „Pause" stehen und behauptet, es liefe noch. Vollständige Liste in docs/LEISTEN-UND-TONKETTE.md.

*Quelle: docs/OFFEN.md § 6.4 — Aus der Leisten-Bestandsaufnahme (erster Punkt) · wartet auf: nichts — kann sofort gemacht werden*

### S · Alles außer Lautheit rechnet nur auf dem linken Kanal

'var ch=left' trägt Hüllkurve, Energie, Struktur/Abschnitte, Signalenergie, Dynamik und alle FFT-Runden; nur LUFS, True Peak, Stereobreite und Phasenkorrelation sehen beide Kanäle. Bei breiten Mischungen fehlen Ereignisse, und die Karten 'Lautheit dB'/'Dynamik dB' liegen bis 1,4 dB zu niedrig, weil die höhere Kanalspitze nie gesehen wird. Zwei Änderungen: ch als (left+right)/2 bilden, und für Spitze/Effektivwert beide Kanäle zusammenfassen wie es lautheitNachNorm() und echteSpitze() schon tun.

*Quelle: docs/ANALYZER-PRUEFUNG.md, Funde 34, 44 und 49 (analyzer-worker.js:576 bzw. 673) · wartet auf: nichts im Code — sichtbar wird es erst nach einem Neulauf über die 321 Ablagen*

### S · Ausgeschriebene Abschnittsmarken laufen im Karaoketext mit

Der Filter für `bSingbar` erkennt Abschnittsmarken an der eckigen Klammer. Bei zwei Songs stehen die Abschnitte als „Strophe 1" ausgeschrieben; sie werden dadurch als gesungene Zeile mitgezählt und stehen im Karaokeband. Da bei fehlender eckiger Klammer bewusst nichts weggelassen wird (sonst verschwände der ganze Text), braucht es eine zusätzliche Erkennung ausgeschriebener Marken — eng gefasst, damit keine echte Textzeile verschwindet.

*Quelle: docs/VISUALIZER.md — „Was im Karaokeband nicht mitzählt" (Absatz „Bekannte Lücke") · wartet auf: nichts — kann sofort gemacht werden*

### S · Bandbeschriftung der Fluktuation ist falsch

Einer von drei ausdrücklich als fehlerhaft — nicht bloß offen — bezeichneten Punkten: die Beschriftung der Bänder bei der Fluktuation stimmt nicht. Die Einzelheiten stehen in docs/OFFEN.md; von den drei Fehlern ist bisher nur der dritte (Notenzonen als Einzeldateien) durch die Sammeldatei erledigt.

*Quelle: docs/NAECHSTER_CHAT.md — „Stand 24.08.2026 — Stems, Töne, Notenzonen" (Verweis auf docs/OFFEN.md) · wartet auf: nichts — kann sofort gemacht werden*

### S · Doku-Stand der Tonstudio-Datei nachziehen

Drei Stellen widersprechen dem gebauten Stand: die „Offen"-Liste führt die Störfrequenz-Kerbe noch als „nächstes Thema", obwohl sie samt Review fertig ist; der Satz „Offen: Tiefe/Güte am Gerät einstellbar, Detektor in den Morgenlauf, Kerbe im Export, Lauf über alle 321 Songs" ist in allen vier Punkten überholt; und die Anschluss-Bedienung sagt „nicht bei der Klangraum-Reise", während ein späterer Abschnitt den Anschluss auf der Reise beschreibt und mit −3 ms misst. Ein späterer Chat liest sonst den falschen Stand.

*Quelle: docs/TONSTUDIO.md — „Offen (Stand 23.08.2026)", Zeile 598, „Anschluss — Songübergänge" (Bedienung) · wartet auf: nichts — kann sofort gemacht werden*

### S · Doppelte Akzentpixel in der Tonliste

Bei „Doppio passo" und „Okkultation" zeigen zwei verschiedene Farbtöne auf dasselbe Pixel, in der Tonliste steht dieselbe Farbe zweimal. Ursache: Die Verteilungsanalyse benutzt ein weiteres Fenster als die Tonauswahl. Auf die Palette wirkt es sich nicht aus (die Zweitfarbe filtert Dubletten), in der Liste sieht es seltsam aus.

*Quelle: docs/BACKLOG.md — „Klein und konkret / Doppelte Akzentpixel" · wartet auf: nichts — kann sofort gemacht werden*

### S · EQ-Stummschaltung lässt Solo und Störton weiterfiltern

eqSoloAnwenden() (2861) prüft nur eqAus, nicht anEq: Wer die EQ-Stufe stummstellt, während im Glockenstuhl ein Solo läuft, hört die Bandzweige weiter — die Stufe ist nicht überbrückt, nur ihre Verstärkungen sind genullt. Dasselbe beim engen Bandpass „Störton allein hören" (Q 25, Zeile 2939), der ebenfalls nur von eqAus abgeschaltet wird. Beide Stellen zusätzlich gegen anEq prüfen.

*Quelle: docs/LEISTEN-UND-TONKETTE.md, 2.6 · wartet auf: nichts — kann sofort gemacht werden*

### S · Eintrag „Lyrics" im Pult ohne Sperrflag

Der Eintrag „Lyrics" im Pult trägt als einziger kein Sperrflag, während die Fußzeile denselben Eintrag über s.hatLyrics ausgraut. Beide Leisten sollten dieselbe Bedingung benutzen.

*Quelle: docs/OFFEN.md § 7.3 — Kosmetisch (vierter Punkt) · wartet auf: nichts — kann sofort gemacht werden*

### S · Erklärungstext zur Tonart beschreibt noch das alte Verfahren

Der Hinweistext sagt 'Tonart via Krumhansl-Schmuckler über akkumulierte Chroma-Frames, wird nach jeder FFT-Runde verfeinert' — beides traf schon vorher nicht zu. Der Fund verschiebt die Reparatur ausdrücklich auf den Tag, an dem das Verfahren steht; seit dem Nachtrag steht es: Grundton aus dem Bass auf Sunos Eins, Tongeschlecht aus der gezählten Terz, und ohne Terz wird keine behauptet. Text darauf umschreiben, sonst schickt er den nächsten Leser wieder in die falsche Ecke.

*Quelle: docs/ANALYZER-PRUEFUNG.md, Fund 55 (analyzer.js:7559) in Verbindung mit dem Nachtrag 'Tonart (v-key)' · wartet auf: nichts — kann sofort gemacht werden*

### S · FARBHANDLING rechnet noch mit 248 Covern

Das Dokument nennt durchgehend 248 Cover: die Tabelle der gefundenen Töne summiert sich auf genau 248 (18+21+93+65+34+17), die Laufzeit steht mit "rund 280 Sekunden für alle 248 Cover", und der Kontrast gilt "bei allen 248 Covern erreicht". Der Katalog hat inzwischen 321 Songs mit 321 Paletten (siehe UEBERGABE). Zahlen und Laufzeit nach einem Lauf von bin/farben.js --neu nachziehen.

*Quelle: docs/FARBHANDLING.md, Abschnitte "Grundsatz", "1. Volle Auflösung abtasten", "9. Kontrast absichern" · wartet auf: einen Neulauf über die 321 Ablagen*

### S · Hüllkurve aus lauter Nullen fällt durch beide Netze

Besteht eine Hüllkurve nur aus Nullen, greift weder der Kurvenweg noch der graue Rückfall. Übrig bliebe eine leere schwarze Bahn ohne jeden Hinweis.

*Quelle: docs/OFFEN.md § 7.3 — Kosmetisch (zweiter Punkt) · wartet auf: nichts — kann sofort gemacht werden*

### S · Hüllkurven-Skalierung bei x²

Die Hüllkurve kommt jetzt aus dem eigenen Rechenkern (energy, 20 Werte/s) und wird als Amplitude gezeigt, mit drei Formen zur Wahl: x² · x · √x. Bei der Form x² stimmt die Skalierung nicht. Der Rechenweg steht in OFFEN.md Abschnitt 6.

*Quelle: docs/NAECHSTER_CHAT.md — „Nachtrag 25.08. Nacht", „Offene Arbeitsliste" (docs/OFFEN.md Abschnitt 6) · wartet auf: nichts — kann sofort gemacht werden*

### S · Karaoke wird verweigert, obwohl Zeitmarken da sind

karaokeMoeglich fragt bSong.worte (Katalog-Hauptspur), der Text kommt aber aus bWorte() (gewählte Spur v2/v3/Whisper). Bei „Kartoffeln mit Dip" fehlt worte, worteV3 hat 391 Wörter: Steht die Spurwahl auf v3, läuft der Text wortgenau mit, und daneben steht „Karaoke (keine Zeitmarken)". Richtig wäre bWorte().length.

*Quelle: docs/OFFEN.md § 7.2 — Was still etwas Falsches zeigt (erster Punkt) · wartet auf: nichts — kann sofort gemacht werden*

### S · Kurzzeitkurve der Schwankungsbreite nur einmal je Sekunde

Die LRA-Kurzzeitwerte entstehen mit 3-s-Fenster und 1-s-Schritt; EBU Tech 3341 führt den Zeiger mindestens zehnmal je Sekunde nach, ffmpeg rechnet mit 100 ms. Dadurch fällt die angezeigte Schwankungsbreite systematisch zu klein aus (bis 0,58 LU gegen ffmpeg). Schritt auf Math.round(sr*0.1) setzen — die kumulierte Summe liegt schon vor — und in bin/pruefe-lautheit.js einen Fall gegen ffmpeg aufnehmen, weil der bestehende Test mit 1,0 LU Toleranz zu grob ist.

*Quelle: docs/ANALYZER-PRUEFUNG.md, Fund 41 (analyzer-worker.js:283) · wartet auf: nichts — kann sofort gemacht werden*

### S · MP3-Rückfall in der Ablage stempeln

Die Analyse läuft richtig auf dem WAV (index.html:11802), fällt aber bei Songs ohne WAV stumm auf das 192-kbps-MP3 zurück, und die Ablage ist danach ununterscheidbar. Aus MP3 seriös: LUFS/LRA/PLR, BPM, Struktur, Chroma, Panorama. Zwingend WAV: Tiefpasskante, True-Peak-Urteil, Clipping, Rauschteppich, alle Artefakt-Indikatoren. Die Quelldatei als Feld in die Ablage schreiben, sonst sind die kanten- und spitzenbezogenen Werte im Bestand nicht auseinanderzuhalten.

*Quelle: docs/ANALYZER-REVIEW.md, 5 („Was fehlt", Punkt 5) · wartet auf: nichts — kann sofort gemacht werden (Altbestand ggf. nachstempeln)*

### S · Phasenkorrelation ist Kosinusähnlichkeit, '% negativ' zählt erst ab -0,10

Gerechnet wird ohne Abzug der Mittelwerte, also die Kosinusähnlichkeit statt des Pearson-Koeffizienten, den der Name verspricht; der Gleichanteil wird als dcL/dcR sogar getrennt gemessen, fließt aber nicht ein. Gezählt wird 'k<-0.10', angezeigt als '% negativ', und ein Fenster gilt schon ab etwa -133 dBFS als 'klingend'. Mittelwerte je Fenster abziehen, die Schwelle in den Text schreiben und das Tor für 'klingend' an den Songpegel koppeln. Die Karte ist stehengeblieben, der Zahlenwert ist brauchbar — die Beschriftung nicht.

*Quelle: docs/ANALYZER-PRUEFUNG.md, Fund 60 (analyzer-worker.js:631) · wartet auf: nichts — kann sofort gemacht werden*

### S · Pult kommt beim Tastaturfokus nicht zurück

Bei Karaoke und „aus" ist .bpult eine Schublade (830/832) — weiterhin fokussierbar, nur außerhalb des Bildes. Hervorgeholt wird sie nur von mousemove (10979) und touchstart (10990); einen focusin-Horcher gibt es nicht. pultVerbergen() weigert sich zwar einzufahren, solange der Fokus drin sitzt (10975), holt die Schublade aber nicht heraus.

*Quelle: docs/LEISTEN-UND-TONKETTE.md, 2.9 · wartet auf: nichts — kann sofort gemacht werden*

### S · Pult-Abspielknopf hängt am falschen Faden

$('babspielen').innerHTML wird ausschließlich in buehneTakt() gesetzt (13130), das an ontimeupdate hängt — beim Pausieren feuert kein timeupdate mehr, also bleibt der Pultknopf auf dem Pausensymbol stehen und behauptet, es liefe noch. Die Hauptleiste macht es richtig über onplay/onpause (13311/13312). babspielen in deckMelder() an dieselben zwei Melder hängen; verschärfend kommt der Frühausstieg 'if (el !== audio || !audio.duration) return' (13324) dazu, der bei frisch gewechselter Quelle nie korrigiert.

*Quelle: docs/LEISTEN-UND-TONKETTE.md, 2.1 (und Vorschlag 6.2) · wartet auf: nichts — kann sofort gemacht werden*

### S · Relatives Tor der Schwankungsbreite sitzt am falschen Bezug

Das relative LRA-Tor wird als integriert-20 gebildet; nach Norm gehört es 20 LU unter das ungegatete Mittel der Kurzzeitwerte. Beim heutigen, durchkomprimierten Bestand bleibt der Fehler unter 0,1 LU, aber sobald ein Stück ein leises Intro, eine Zwischenstille oder einen langen Ausklang hat, kippt die Zahl auf 0,00 LU — im Testsignal 22 LU Unterschied. Tor aus den Kurzzeitwerten selbst bilden und mit dem Zweipegel-Signal in bin/pruefe-lautheit.js absichern.

*Quelle: docs/ANALYZER-PRUEFUNG.md, Fund 42 (analyzer-worker.js:293) · wartet auf: nichts — kann sofort gemacht werden*

### S · Tastatur-Horcher: Befehlstaste und Auswahlfelder

Der Horcher (13400) prüft weder metaKey noch ctrlKey noch altKey — Cmd+F löst zusätzlich Vollbild aus, Cmd+M schaltet stumm, Cmd+Pfeile springen den Song. Und die Wache 'if (e.target.tagName === "INPUT") return' (13401) schützt Schieberegler und Textfelder, aber nicht die Auswahlfelder, aus denen die Bedienzeile der Bühne besteht (12732): mit Fokus darin verstellt Pfeil hoch/runter die Lautstärke statt zu blättern. Zwei Bedingungen erweitern, SELECT (und TEXTAREA) mit aufnehmen.

*Quelle: docs/LEISTEN-UND-TONKETTE.md, 2.7 und 2.8 (Vorschlag 6.6) · wartet auf: nichts — kann sofort gemacht werden*

### S · Titel „Tonverteilung je Notenzone" blitzt beim Aufbau auf

Die Überschrift steht kurz sichtbar da, bevor sie sich ausblendet. Das Einzelspuren-Panel macht es richtig und startet versteckt — dieselbe Startbedingung würde genügen.

*Quelle: docs/OFFEN.md § 7.3 — Kosmetisch (dritter Punkt) · wartet auf: nichts — kann sofort gemacht werden*

### S · Trennlauf gegenprüfen — Deadlock-Ursache ungeklärt

Der Hänger nach der dritten Spur ist am 25.08. umgangen worden (flacSchreiben() schreibt in eine Datei statt durch eine Pipe), die genaue Ursache ist aber ausdrücklich nicht geklärt. Passiert es trotz Datei wieder, war die Pipe nicht schuld. Zur Erkennung gehört außerdem: jeden stems/-Ordner auf sechs .flac prüfen und halbfertige verwerfen, weil stems.js Fertiges nur an piano.flac erkennt und ein Ordner mit drei Spuren sonst durchfällt.

*Quelle: docs/OFFEN.md § 2.10 — Der Trennlauf hängt reproduzierbar nach der dritten Spur · wartet auf: einen vollständigen Trennlauf über die restlichen Songs*

### S · UEBERGABE steht auf 18.08. — Zahlen und Doku-Tabelle

Zwei Sachen sind schief. Erstens die Mediengröße: der Kopf sagt "22 GB Medien", die Standtabelle "Medien 6.9G", der Abschnitt zur Sicherung "zusammen 5,1 GB" — drei verschiedene Zahlen, mindestens zwei davon falsch. Zweitens fehlt KLANGRAUM.md in der Tabelle der Fachdokumente, obwohl der Klangraum inzwischen ein eigenes Register ist (Werke · Alben · Klangraum) und eine eigene Datenkette hat (klang.js, karte.js, himmel-export.js).

*Quelle: docs/UEBERGABE.md, Kopf, Dokumententabelle und Abschnitt "Aktueller Stand" · wartet auf: nichts — kann sofort gemacht werden*

### S · Untergrund bei offener Bühne nicht aus dem Tabulator nehmen

Es gibt im ganzen Haus kein inert und kein aria-hidden auf dem Untergrund; #player bleibt bei offener Bühne display:block und im Tabulator-Lauf (2579). Wer auf der Bühne Tab drückt, wandert durch die komplette unsichtbare Leiste bis zum EQ-Knopf und öffnet mit der Eingabetaste das Studio in die Sackgasse aus 2.2. Es ist der einzige Weg, studioAuf() bei offener Bühne auszulösen — ein Weg, den niemand gebaut hat.

*Quelle: docs/LEISTEN-UND-TONKETTE.md, 2.3 · wartet auf: nichts — sinnvoll zusammen mit dem Studio-Schließen (2.2)*

### S · Wortlaut im Titel der Notenzonen

Der zweite der drei als fehlerhaft markierten Punkte: der Wortlaut im Titel der Notenzonen ist falsch. Nicht zu verwechseln mit dem dritten Punkt derselben Aufzählung (Einzeldateien auf 1-MB-Blöcken), der mit library/notenzonen.json erledigt ist. Genauer Wortlaut und Begründung stehen in docs/OFFEN.md.

*Quelle: docs/NAECHSTER_CHAT.md — „Stand 24.08.2026 — Stems, Töne, Notenzonen" (Verweis auf docs/OFFEN.md) · wartet auf: nichts — kann sofort gemacht werden*

### S · buehneAuf() schließt das Tonstudio nicht

Weder buehneAuf() (12958) noch buehneZu() (13066) rufen studioZu(). Ein offenes Studio bleibt unter der Bühne liegen (z-index 56 unter 60), ist nicht display:none und rechnet deshalb weiter: studioSpitze(true) hält ein 100-ms-Intervall am Leben, dazu je nach Lasche blasterLcd, kompAnzeige oder parSpektrum samt Bildschleifen (3508). Abgeräumt wird das nur in studioZu(), das bei offener Bühne niemand erreicht — eine Zeile in buehneAuf() beendet die unsichtbare Rechenschleife.

*Quelle: docs/LEISTEN-UND-TONKETTE.md, 2.2 (und Vorschlag 6.3) · wartet auf: nichts — kann sofort gemacht werden*

### S · eqJeSong beim Start laden statt in studioAuf()

eqJeSong wird ausschließlich in studioAuf() geholt (3537). Beim Songwechsel liest der Zweig für das geschlossene Studio (8999) aus genau dieser Sammlung und setzt stumpf auf neutral, solange sie leer ist. Wer über die Bühne einsteigt und das Studio nie öffnet, bekommt seine gespeicherten Einstellungen nie zu hören — sonst bleiben sie ein Zufallsprodukt.

*Quelle: docs/LEISTEN-UND-TONKETTE.md, 2.4 (und Vorschlag 6.5) · wartet auf: nichts — kann sofort gemacht werden*

### S · momentanMax und kurzMax sind in allen 321 Ablagen NaN

fensterEnergienMitte() schreibt an beiden Rändern absichtlich NaN, und Math.max.apply über das ganze Feld liefert deshalb immer NaN — nicht manchmal. Repariert wurde bisher nur das Symptom (Verpackung als {__z:'NaN'} in web/fremd/analyse-ablage.js), samt einer Erklärung im Kommentar, die auf keinen dieser Songs zutrifft. Größtwert in einer Schleife über die endlichen Werte bilden (isFinite), Kommentar richtigstellen; die gespeicherten Werte bleiben bis zum Neulauf unbrauchbar.

*Quelle: docs/ANALYZER-PRUEFUNG.md, Fund 43 (analyzer-worker.js:344) · wartet auf: nichts im Code — die 321 gespeicherten Werte erst nach einem Neulauf*

### S · toeneDaten wird nach leerer Antwort nie nachgeladen

Liefert der erste Abruf ein leeres {songs:{}} — so antwortet der Server, solange toene.json fehlt —, sieht der Wächter if (!toeneDaten) danach ein wahres Objekt und lädt nie nach. Trifft nur ein frisches Archiv, ist aber ein echter Hänger für den Erstlauf.

*Quelle: docs/OFFEN.md § 7.2 — Was still etwas Falsches zeigt (fünfter Punkt) · wartet auf: nichts — kann sofort gemacht werden*

### S · v3-Zeitmarken fehlen bei zwei Songs

Bei zwei Songs fehlen die Suno-v3-Wortmarken (worteV3 im Katalog). Nachladen geht über das Lesezeichen, Option „Suno v3 nachladen" — der erste Lauf stößt nur an, running zählt nicht, erst der nächste sammelt ein. Welche zwei Songs es sind, steht in OFFEN.md Abschnitt 6.

*Quelle: docs/NAECHSTER_CHAT.md — „Nachtrag 25.08. Nacht", „Offene Arbeitsliste" (docs/OFFEN.md Abschnitt 6) · wartet auf: einen Lesezeichen-Lauf mit Token (zwei Durchgänge)*

### S · whisper -dtw large.v3 liefert t_dtw = -1

Der Schalter -dtw large.v3 sollte genauere Token-Zeiten liefern, gibt aber t_dtw = -1 zurück. Zu prüfen ist, ob der Modellname anders heißen muss. Nicht dringend — die Standard-Zeitmarken sind fürs Karaoke gut genug.

*Quelle: docs/BACKLOG.md — „Tarjas Wünsche / Whisper für die Wort-Zeitmarken", Absatz „Offen" · wartet auf: nichts — kann sofort gemacht werden*

### S · „Kein Text hinterlegt." ist in #bprompts unerreichbar

teile[] beginnt immer mit dem Paßfoto, also ist join('') nie leer und der Rückfalltext erscheint nicht. Für die 64 Songs ohne Text bleibt die rechte Spalte im Analysemodus stumm, statt die Abwesenheit zu benennen. In #btext erscheint der Satz korrekt.

*Quelle: docs/OFFEN.md § 7.3 — Kosmetisch (erster Punkt) · wartet auf: nichts — kann sofort gemacht werden*

### M · Das ursprüngliche Chroma-Bild rechnet mit der kaputten Bin-Zuordnung weiter

Die 'Kumulierte Tonverteilung' ist als Spur stehengeblieben, rechnet aber unverändert: jeder FFT-Bin wird auf den nächsten Halbton gerundet, bei fftSize 1024 deckt ein Bin bei C2 elf Halbtöne ab, C bekommt vier Bins und F# neun. Für die Notenzonen-Fassung ist das schon behoben — Goertzel bei jeder Halbtonfrequenz, Fensterlänge nach konstanter Güte, beide Kanäle addiert. Diese Rechnung auch unter das Chroma-Bild legen, sonst zeigt eine geprüfte und eine ungeprüfte Fassung derselben Sache nebeneinander verschiedene Bilder.

*Quelle: docs/ANALYZER-PRUEFUNG.md, Nachtrag 'Chroma — die Bin-Zuordnung war das Problem' sowie Funde 11 und 12 · wartet auf: nichts — die Goertzel-Rechnung liegt in bin/toene.js bereits vor*

### M · Fensterversatz in den übrigen Analyzer-Kurven

Die Kurzzeitlautheit wird seit der Umstellung an der Fenstermitte gezeichnet, die übrigen aus Fenstern gebildeten Kurven nicht: Crest (500 ms → 250 ms zu spät), Impulsdichte (500 ms → 250 ms), Energie (50 ms → 25 ms) und die FFT-Kurven (4096 Abtastwerte → 43 ms). Solange das so bleibt, bedeutet Index i nicht in jeder Kurve dieselbe Zeit, und jeder Vergleich zweier Kurven zeigt Spitzen an Lautstärkewechseln, die es nicht gibt. Zu tun ist dasselbe wie bei der Lautheit: die Fenster zentriert bilden, an den Rändern NaN statt eines abgeschnittenen Fensters.

*Quelle: docs/VISUALIZER.md — „Der Bezugspunkt eines gleitenden Fensters ist seine MITTE" (Absatz „Noch offen") · wartet auf: nichts — kann sofort gemacht werden*

### M · Gemerkte EQ-Einstellungen greifen erst nach einmal Studio öffnen

Die gespeicherten EQ-Einstellungen werden erst wirksam, nachdem das Tonstudio einmal offen war. Wer über die Bühne einsteigt, hört sie nie. Betrifft den Tonpfad, also vorher ansagen.

*Quelle: docs/OFFEN.md § 6.4 — Aus der Leisten-Bestandsaufnahme (dritter Punkt) · wartet auf: nichts — kann sofort gemacht werden*

### M · Lautstärke und Stumm sitzen vor allen Analysern

lautstaerkeSetzen() schreibt audio.volume am Medienelement (13245), also vor createMediaElementSource und damit vor quelle. Wer stummschaltet, bringt nicht nur den Ton zum Schweigen, sondern auch Live-Spektrum, Dichte-Spektrum, Butterchurn und die Bandpegel auf null. Das Versprechen des Kommentars vom 20.08. („misst das Werk, nicht die Filter") hält gegen die EQ-Kette, aber nicht gegen den Lautstärkeregler — die Abhilfe wäre ein Gain hinter den Roh-Analysern statt am Medienelement.

*Quelle: docs/LEISTEN-UND-TONKETTE.md, 2.5 · wartet auf: Caspar_Ds Entscheidung — Eingriff in die Tonkette, vorher ansagen*

### M · Raumschiff: Verdeckung am Stern ist falsch herum

Caspar_D sieht das Schiff vor dem Stern gefadet und hinter dem Stern in voller Deckung — es müsste umgekehrt sein. Die Schichtung ist richtig verkabelt und hinterStern() (web/index.html ~5467) prüft rechnerisch das Richtige. Verdacht: Die Sternenbühne karteglut ist transparent, ein Schiff dahinter scheint überall dort durch, wo kein Stern und kein Nebel liegt. Zu prüfen mit einer Messung während einer echten Reise: Was liefert hinterStern genau in dem Moment, in dem Caspar_D das Schiff vor bzw. hinter dem Stern SIEHT?

*Quelle: docs/BACKLOG.md — „Klangraum / Raumschiff: Verdeckung am Stern stimmt nicht" · wartet auf: eine Messung während einer echten Reise, mit Caspar_D am Bild*

### M · Systematisch durchsehen, was nur der Suno-Weg setzt

Viermal ist derselbe Fehler aufgetreten: `songDuration`, `window._audioSamples`, die Wort-Zeitmarken (`currentMeta` statt `_katalogDaten`) und die Handler-Brücke wurden nur auf dem Weg über die Suno-Songseite (`analyze()`) gefüllt, während KlangTresor den Dateiweg benutzt. Gefunden wurde jedes Mal erst, als etwas sichtbar fehlte. Zu tun: `analyze()` und `fetchMeta()` einmal Zeile für Zeile durchgehen und jede dort gesetzte globale Größe daraufhin prüfen, ob der Dateiweg sie auch bekommt.

*Quelle: docs/VISUALIZER.md — „Ein dritter Fall derselben Lücke" / „Der vierte Fund derselben Lücke" / „Zwei Fehler, die dabei ans Licht kamen" · wartet auf: nichts — kann sofort gemacht werden*

### M · Tonstudio verschwindet unter der Bühne

Das Tonstudio liegt bei z-index 56 gegen die Bühne mit 60 und verschwindet darunter, rechnet dort aber mit 100 ms weiter. buehneAuf und buehneZu fassen es nicht an. Betrifft den Tonpfad, also vorher ansagen.

*Quelle: docs/OFFEN.md § 6.4 — Aus der Leisten-Bestandsaufnahme (zweiter Punkt) · wartet auf: nichts — kann sofort gemacht werden*

### M · Zwei Messwege schreiben ins selbe Archiv, Fertiges wird nie aufgefrischt

bin/vorrechnen.js misst in der Rate der Datei (alle 321 sind 48 kHz), der Browserweg über decodeAudioData rechnet auf 44,1 kHz um — 23 der 321 Ablagen tragen deshalb sr=44100, und Abtastspitze und Vollausschläge unterscheiden sich (dieselbe Datei: 34 gegen 19 Vollausschläge, daran hängt das Urteil 'übersteuert'). Zusätzlich prüft fertig(id) nur, ob drei Dateien dasitzen, nie ob sie zum heutigen Ton passen. Im Browser mit OfflineAudioContext in der Dateirate dekodieren und fertig() um Größe/Änderungszeit oder eine Prüfsumme im .bin-Kopf erweitern.

*Quelle: docs/ANALYZER-PRUEFUNG.md, Fund 59 (vorrechnen.js:244) · wartet auf: nichts — kann sofort gemacht werden*

### M · huelle() legt die absolute Spitze nicht ab

huelle() normiert jede Stem-Spur auf ihren eigenen Spitzenwert und legt die absolute Spitze nicht ab. Der Browser kann deshalb eine Spur mit bloßem Übersprechen nicht von einer tragenden unterscheiden. Verwandt mit dem Piano-Befund aus 2.5; eine Änderung im Rechenkern zöge einen Neulauf über den Bestand nach sich.

*Quelle: docs/OFFEN.md § 7.2 — Was still etwas Falsches zeigt (vierter Punkt) · wartet auf: Neulauf über 321 Ablagen nach der Rechenkern-Änderung*

### ? · Stimmerkennung funktioniert nicht

Tarja fragte: „konntest du immer noch nicht fixen oder?" — der Fehler ist also älter und unbehoben. Der Text verweist auf die Analyzer-Prüfung vom 23.08., ein Ergebnis steht nicht dabei.

*Quelle: docs/BACKLOG.md — „Aus Tarjas erstem Testlauf / Sichtbares" · wartet auf: Ergebnis der Analyzer-Prüfung vom 23.08.*

### ? · Tarja fragen, was „die VODs" meint

Tarja meldete „die VODs werden z.B. nicht geschrieben". Es ist unklar, was gemeint ist — womöglich die Video-Artworks (artwork.mp4, 83 Stück), womöglich etwas anderes. Ohne ihre Antwort ist jede Suche Raten; also zuerst nachfragen, welcher Ordner und welcher Schritt gemeint war.

*Quelle: docs/NAECHSTER_CHAT.md — „Offen — und wer es beantworten muss" · wartet auf: Tarjas Antwort*

### ? · Tonart wird auf Rauschen gemeldet

50 von 50 Naturklang-Stücken bekommen eine Tonart zugewiesen, obwohl nur Rauschen vorliegt. In ERFUNDENES.md steht dazu ausdrücklich die Gegenprobe, warum die naheliegende Abhilfe bei der Tonart nicht funktioniert — es braucht also einen anderen Weg. Bisher ist nur protokolliert, nichts geändert.

*Quelle: docs/OFFEN.md § 7.2 — Protokollvermerk zu ERFUNDENES.md · wartet auf: Caspar_Ds Entscheidung und einen tragfähigen Weg*


## Pflicht

### S · Adversarial-Review der Rabe-Änderungen nachholen

Der Adversarial-Review der Rabe-Änderungen (Funken aus dem Flug mit Jitter und einem Bahnumfang Lebensdauer, Rabenmagie mit uiFaerben-Vorfahrt) wurde wegen Guthaben-Ende abgebrochen. Die Browser-Tests waren vollständig, der Review nicht. Er ist also nachzuholen, bevor die Änderungen als geprüft gelten.

*Quelle: docs/NAECHSTER_CHAT.md — „Nachtrag 25.08. spät", letzter Spiegelstrich · wartet auf: eine neue Sitzung mit Guthaben*

### S · Aktiv-Rahmen am Video-Artwork nie in Bewegung geprüft

Dass Kontur und Puls bei sichtbarem Video am Video statt am Kachelrand sitzen, ist bisher nur an den berechneten Stilen nachgewiesen: Der ferngesteuerte Browser bricht die Videowiedergabe ab und `requestAnimationFrame` ruht in verborgenen Tabs. Der eigene Puls-Keyframe `pulsVideo` mit dem mitgeführten Schlagschatten ist damit nie laufend gesehen worden. Zu tun: einmal von Hand an einem echten Fenster und am iPhone ansehen — auch unter `prefers-reduced-motion`.

*Quelle: docs/VISUALIZER.md — „Der Aktiv-Rahmen wandert auf das Video" / „Bekannte Eigenheiten der Testumgebung" · wartet auf: Prüfung von Hand an einem echten Browserfenster und am iPhone*

### S · Analysemodus im Hochformat auf einem echten Gerät prüfen

Im Hochformat wandert die rechte Spalte per @media (orientation:portrait) unter die Panels, statt auf Briefmarkenbreite zu schrumpfen. Der Text vermerkt ausdrücklich: auf einem Gerät noch nicht geprüft.

*Quelle: docs/BACKLOG.md — „SunoAnalyzer ... / 4.8" · wartet auf: ein Gerät im Hochformat*

### S · Analyzer: Tonart-Karte nachsehen

Der Rechenkern liefert seit der Reparatur vom 19.08. die richtige Tonart. Zu prüfen bleibt, ob die Karte auch das richtige Feld liest und ob der zweite Kandidat sinnvoll erscheint.

*Quelle: docs/BACKLOG.md — „Offen seit dem 19.08.2026 / Analyzer: Tonart-Karte prüfen" · wartet auf: nichts — kann sofort gemacht werden*

### S · Artwork-Format bei sehr breiten Videos prüfen

Die Bühne ist auf das Format des Mediums umgestellt. Ob das bei sehr breiten Videos noch stimmt, wurde nie geprüft, weil es in der Sammlung kein solches Medium gibt.

*Quelle: docs/BACKLOG.md — „Klein und konkret / Artwork-Format auf der Bühne" · wartet auf: ein sehr breites Video — in der Sammlung gibt es derzeit keins*

### S · Die beiden PowerShell-Skripte prüfen

einrichten-windows.ps1 und einrichten-docker.ps1 sind ungetestet, weil hier kein PowerShell existiert. Im Text ausdrücklich vermerkt: Casto könnte beide prüfen.

*Quelle: docs/BACKLOG.md — „Docker und Einrichtungsskripte (23.08.2026) / Offen" · wartet auf: Castos Test unter Windows*

### S · Gegenprobe der neuen Stimmlage an den 64 textlosen Stücken

Die Stimmlage kommt jetzt aus YIN auf dem getrennten vocals-Stem, mit Energieschwelle und einem Fragezeichen zwischen 180 und 210 Hz. Das Dokument sagt ausdrücklich: 'Die Gegenprobe steht noch aus' — die 64 Stücke ohne Textzeile müssten durchgehend '?' liefern. Ergebnis auswerten und im Dokument nachtragen; fällt auch nur ein Naturstück wieder als 'weiblich' heraus, greift die Energieschwelle nicht.

*Quelle: docs/ANALYZER-PRUEFUNG.md, Nachtrag 24.08.2026, Abschnitt 'Stimmlage (v-vocal)' · wartet auf: den Nachtbericht (Lauf über die 64 textlosen Stücke)*

### S · Hausregeln-Nachträge und Selektorenprüfung nach dem Umbau

Drei Nachträge sind noch nicht in HAUSREGELN.md eingetragen: Hausregel 21 wurde beim Raster erneut bezahlt (display:grid statt hidden), "ein Tooltip mit Lebenszeit" als Regel, und die Mahnung, Selektoren nach einem Umbau zu prüfen. Der letzte Punkt hat einen konkreten Anlass: Pillen ohne Handler nach der Umbenennung Tracks/Playlists/Karte → Werke/Alben/Klangraum. Also einmal alle Pillen-Selektoren gegen die Handler abgleichen.

*Quelle: docs/KLANGRAUM.md, Abschnitt "Offen / Ideen" (letzter Punkt) · wartet auf: nichts — kann sofort gemacht werden*

### S · Plattform-Zielwerte sind ungeprüft

Ziel-Lautheit, erlaubte Spitze und Regelverhalten (leiser/beides/nein) für Streaming, Spotify, YouTube, Club und Rundfunk stammen laut Text aus allgemeinem Wissen, nicht aus einer Messung und nicht von den Anbietern — und sie ändern sich. Auf ihnen hängt aber das ganze Urteil des Befundblocks. Zu tun: Werte je Plattform gegen die Angaben der Anbieter abgleichen und die Quelle im Quelltext vermerken, wie der Text es selbst verlangt.

*Quelle: docs/VISUALIZER.md — „Die Plattform bestimmt mehr als zwei Zahlen" · wartet auf: nichts — kann sofort gemacht werden (Quellen der Anbieter)*

### S · Sicherung außerhalb der SSD anlegen

Das git-Repo liegt auf derselben SSD wie das Archiv, ist also keine Sicherung. Unersetzlich sind nur library/roh/ (10,8 MB, entsteht ausschließlich im Browser mit Clerk-Token) plus das Repo (rund 300 KB) — zusammen etwa 11 MB, passt auf jeden Stick. Alles andere baut bin/wiederherstellen.js daraus neu auf. Das Anlegen selbst ist bisher nirgends als erledigt vermerkt.

*Quelle: docs/UEBERGABE.md, Abschnitt "Versionierung" ("Nicht verwechseln: Das ist keine Datensicherung") · wartet auf: einen Datenträger außerhalb der SSD*

### S · Sicherungskopie der 10,8 MB von der Platte weg

Unersetzlich ist allein library/roh/ mit 10,8 MB; Katalog, Medien, Kacheln und Paletten baut node bin/wiederherstellen.js daraus ohne Anmeldung neu auf. Diese 10,8 MB liegen aber weiterhin nur auf derselben Platte wie alles andere. Es fehlt eine Kopie irgendwohin, wo nicht dieselbe Platte hängt.

*Quelle: docs/BACKLOG.md — „Dringend / Datensicherung — entschärft" · wartet auf: nichts — kann sofort gemacht werden*

### S · Suno-Alias setzen („Das bin ich")

Server und Dialog sind gebaut (GET/PUT /api/konfig, /api/profil-pruefen, Alias-Zeile mit Einrichtungsfrage und „ändern", Ernte-Wächter im /api/morgen/roh mit 409 und Klartext). Der Alias ist bewusst noch NICHT gesetzt — Caspar_D drückt „Das bin ich" selbst, und erst ab dann greift der Wächter gegen eine Ernte mit fremdem Handle. Bis dahin ist der Schutz vorhanden, aber untätig.

*Quelle: docs/MORGENROUTINE-PLAN.md, 5 (Punkt 2) und 2 · wartet auf: Caspar_D muss im Morgen-Dialog „Das bin ich" drücken*

### S · Token-Meldung bei Tarja gegenprüfen

browser/morgens.js fragte an fünf Stellen window.Clerk ab und gab sofort auf; seit 23.08. wartet tokenHolen() bis zu acht Sekunden und unterscheidet zwei Fälle. Ob das wirklich Tarjas Fall war („erst ging es, dann nicht"), zeigt erst ein Test bei ihr — die zweite Erklärung, ein abgelaufenes Cookie in geheim/suno-cookie.txt, steht weiterhin im Raum.

*Quelle: docs/BACKLOG.md — „Aus Tarjas erstem Testlauf / Fremde Rechner: Token-Meldung" · wartet auf: Tarjas Gegentest*

### S · Versionsangabe mit Urheberschaft in die Oberfläche

Caspar_Ds erste Bedingung für das öffentliche GitHub: eine Versionsangabe mit Urheberschaft in der Oberfläche selbst, nicht nur in einer README, die niemand aufschlägt. Nicht als erledigt vermerkt. Zu klären ist dabei auch der Wortlaut, weil das Projekt seit dem 24.08. KlangTresor statt MySuno heißt.

*Quelle: docs/OFFEN.md § 5.1 — „Version X by Caspar_D" muss unter MySuno stehen · wartet auf: Caspar_Ds Versionsnummer und Wortlaut*

### S · Vier Endpunkte aus SUNO-API.md prüfen

Im Abschnitt „Lohnt sich wahrscheinlich" von SUNO-API.md stehen vier ungeprüfte Endpunkte: aligned_lyrics/v3, gen/<id>/wav_file/, clips/get_songs_by_ids und download/clip/. Jeweils messen, was sie ohne und mit Token liefern, und entscheiden, ob sie etwas Neues bringen.

*Quelle: docs/BACKLOG.md — „Offen seit dem 19.08.2026 / Aus SUNO-API.md prüfen" · wartet auf: nichts — kann sofort gemacht werden*

### S · Whisper-Zeitmarken gegen Sunos Zeitmarken messen

Einen Song nehmen, der beides hat — Sunos Zeitmarken und Whisper —, mit node bin/whisper.js <id> rechnen und die Abweichung je Wort ausgeben, Median und 95 %. Erst danach lässt sich entscheiden, ob Whisper überall Voreinstellung wird.

*Quelle: docs/BACKLOG.md — „Tarjas Wünsche / Whisper für die Wort-Zeitmarken", Absatz „Offen" · wartet auf: nichts — kann sofort gemacht werden*

### S · Zustimmung von Tarja und Casto zu ihren Zitaten

In docs/BACKLOG.md stehen wörtliche Zitate aus einem privaten Discord-Gespräch mit Tarja, dazu ihre Rechnerausstattung und dreimal „Tarja musste fragen"; Castos „1000 Fehlermeldungen" stehen mit Datum und Kanal in bin/pruefe-skripte.js. Alles trifft zu, und beide stehen als Mitstreiter im Fenster — aber das eine ist Anerkennung, das andere sind ihre Worte in einem inzwischen öffentlichen Repositorium. Beide fragen oder die Stellen entschärfen.

*Quelle: docs/NAECHSTER_CHAT.md — „Offen — und wer es beantworten muss" · wartet auf: Tarjas und Castos Antwort*

### S · Zwei Nebenwirkungen der Tonkette im Code festhalten

Zwei Folgen der Bauart stehen nirgends als Kommentar: stemSolo() (8925) fährt mixRegler auf 0 und den Gain der gewählten Spur auf 1 — weil mixRegler vor quelle sitzt und die Stem-Gains direkt an quelle hängen, sehen die Roh-Analyser im Solo die einzelne Spur statt des Mixes. Und die Stems umgehen die Anschluss-Blende (10018). Beides gehört an die Stelle im Code, sonst wird es beim nächsten Lesen neu hergeleitet.

*Quelle: docs/LEISTEN-UND-TONKETTE.md, 5 · wartet auf: nichts — kann sofort gemacht werden*

### S · caffeinate in den Whisper-Handstart einbauen

Der Mac schläft nachts — Whisper stand von 2 bis 9 Uhr bei Song 149/253. Der Morgenschritt läuft inzwischen unter caffeinate -i, der Handstart 'node bin/whisper.js --alle' noch nicht. Ein Wrapper oder ein caffeinate-Aufruf in der Whisper-Kette selbst schließt die Lücke, ebenso für die übrigen Langläufer.

*Quelle: docs/MORGENROUTINE-PLAN.md, 5 (Punkt 4) und 4 (Lehren des Morgens) · wartet auf: nichts — kann sofort gemacht werden*

### S · „Wer hat geliked" — klären, ob es das im Web gibt

Tarja vermutet, dass Suno die Liste der Likenden nur in der iOS-App zeigt. Zu prüfen, ob es dafür einen Endpunkt gibt — der Benachrichtigungsstrom liefert Likes mit Namen und Zeit bereits vier Wochen zurück.

*Quelle: docs/BACKLOG.md — „Aus Tarjas erstem Testlauf / Wünsche" · wartet auf: nichts — kann sofort gemacht werden*

### M · Abtastraten-Test auf die heutige Tonartmessung anwenden

Der Fassungsvergleich prüft nur Konsistenz (71 %), nicht Richtigkeit — einen Maßstab für Richtigkeit gibt es nicht. Der Abtastraten-Test aus ANALYZER-PRUEFUNG.md wäre einer: dieselbe Aufnahme bei 44,1 / 48 / 32 / 22,05 kHz muss dieselbe Tonart ergeben. Er brachte die ALTE Messung zu Fall (12 von 12 Songs bekamen verschiedene Tonarten) und ist auf die heutige Goertzel-Messung noch nicht angewandt.

*Quelle: docs/ERFUNDENES.md, 5 („Einen echten Maßstab bauen") · wartet auf: nichts — kann sofort gemacht werden*

### M · Den Docker-Weg einmal wirklich durchspielen

Tarjas Dockerfile, docker-compose.yml und docker-entrypoint.sh sind bisher nur auf Syntax und Logik geprüft — auf diesem Mac ist Docker nicht installiert. Der ganze Weg (Bild bauen, library/ und geheim/ als Volumes, Healthcheck, erster roter Knopf ohne Katalog) muss einmal echt durchlaufen.

*Quelle: docs/BACKLOG.md — „Docker und Einrichtungsskripte (23.08.2026) / Offen" · wartet auf: einen Rechner mit installiertem Docker*

### M · Gilt der 18-kHz-Abbruch für alle Songs?

Bei „Noch lachst Du" endet das Spektrum sowohl als MP3 als auch als WAV bei 18,0 kHz — der Abbruch steckt also schon in Sunos Original, nicht im Kodierer. Ob das für das ganze Archiv gilt, ist ausdrücklich offen und soll ein Durchlauf über alle Songs zeigen. Zu tun: obere Grenzfrequenz für alle Ablagen messen und die Verteilung festhalten.

*Quelle: docs/VISUALIZER.md — „Grenzfrequenz, Schimmer, Zielpegel" · wartet auf: Neulauf über 321 Ablagen*

### M · Visualisierungen in Bewegung beurteilen

Sämtliche Visualisierungen wurden nur über Standbilder und Messwerte geprüft, weil der ferngesteuerte Browser requestAnimationFrame anhält. Ob sie in Bewegung gut aussehen, hat noch niemand systematisch bewertet. Kandidaten für Nachjustierung: Geschwindigkeiten, Deckkräfte, Abklingzeiten.

*Quelle: docs/BACKLOG.md — „Mittel / Bewegung beurteilen" · wartet auf: einen Menschen vor dem laufenden Bildschirm — ferngesteuert nicht messbar*

### M · git-Historie auf Geheimnisse durchsehen

Was einmal committet wurde, bleibt in git, auch wenn es später gelöscht wurde. Durchzusehen sind alle Commits auf geheim/ (steht in .gitignore, aber war es das immer?), Tokens und Cookies aus der Clerk-Zeit samt bin/token.js und bin/paket.js, die __clerk_handshake-URL, die laut HISTORY einmal in ein Werkzeugprotokoll geraten ist, sowie Caspar_Ds E-Mail-Adresse und andere persönliche Angaben.

*Quelle: docs/OFFEN.md § 5.3 — Vor dem ersten Push zu prüfen: die HISTORIE, nicht nur der Stand · wartet auf: nichts — kann sofort gemacht werden*

### M · toene.js über die restlichen 317 Songs laufen lassen

Die gültige Tonart aus bin/toene.js liegt bisher für 4 von 321 Songs vor; für alle übrigen zeigt die Karte einen Strich. Nebenbei tragen die 321 vorhandenen .bin die toten Felder key und mode physisch weiter — sie verschwinden erst, wenn ein Song ohnehin neu gerechnet wird.

*Quelle: docs/BACKLOG.md — „Die tote Tonart — ERLEDIGT 24.08.2026", Absatz „Offen bleibt" · wartet auf: Neulauf über 321 Ablagen*


## Entscheidung

### S · Anschluss: zwei offene Entscheidungen

Erstens: Wessen EQ und Kerbe gilt während der Überlappung? Vorschlag im Text: zwei Quellen mit eigener Korrektur, gemeinsam ab dem Kompressor. Zweitens: Wird das Nahtbild eine Lasche im Tonstudio oder eine eigene Schautafel wie bahn3d.html — das Tonstudio dreht am Klang EINES Songs, der Anschluss fügt zwei.

*Quelle: docs/BACKLOG.md — „Klangraum / Anschluss", Absätze „Das eine Bild" und „Was fehlt" · wartet auf: Caspar_Ds Entscheidung*

### S · Boden der Sockelkaskade: anheben oder auslassen

Der Boden der Sockelkaskade (fünftes Perzentil der Momentanlautheit) hebt Werte darunter auf den Bodenwert an. Nach der Regel "Ein Tor wählt aus, es hebt nichts an" wäre die normgerechte Entsprechung, die betroffenen Zeitpunkte auf NaN zu setzen und im Bild als Lücke zu lassen. Das Dokument hält ausdrücklich fest: "Offen: ob der Boden der Kaskade auf Auslassen umgestellt wird. Entschieden ist es nicht." Die gemessenen Normwerte sind nicht betroffen, es geht allein um das Bild.

*Quelle: docs/NORMEN.md, Abschnitt "Was in KlangTresor davon betroffen ist" · wartet auf: Caspar_Ds Entscheidung — Darstellungsmittel oder Norm*

### S · Cache-Kennung für das Analyzer-Modul in index.html

Der Server liefert .js mit einem Jahr Cache-Dauer — richtig für die Visualizer-Bibliotheken, die sich nie ändern, tödlich für web/fremd/analyzer.js, das in Arbeit ist. Die alte Wirtsseite hängte deshalb eine Kennung an die Adresse; für index.html steht das laut Text noch zur Entscheidung an.

*Quelle: docs/BACKLOG.md — „SunoAnalyzer ... / Fallstrick für die Einbettung" · wartet auf: nichts — kann sofort gemacht werden*

### S · Cache-Kennung, wenn index.html das Analyzer-Modul lädt

Der Server schickt `.js` mit `max-age=31536000`; für ein Modul in Arbeit heißt das, dass man die eigene Änderung nicht sieht. Die Wirtsseite `web/analyzer.html` hängt deshalb eine Kennung an die Adresse. Der Text lässt ausdrücklich offen, wie das gelöst wird, wenn `index.html` das Modul lädt — entweder dieselbe Kennung dort, oder `web/fremd/analyzer.js` in der Server-Typtabelle von der Jahresfrist ausnehmen.

*Quelle: docs/VISUALIZER.md — „Ein Fallstrick beim Laden" · wartet auf: nichts — kann sofort entschieden werden*

### S · Entscheiden, was überhaupt mit ins öffentliche Repo soll

Der Code ist klar, aber library/ sind 22 GB von Caspar_Ds Musik, und docs/ ist voll mit seinen Zitaten und Arbeitsnotizen. Beides ist eine eigene Entscheidung und blockiert den ersten Push.

*Quelle: docs/OFFEN.md § 5.4 — Zu entscheiden: was überhaupt mitsoll · wartet auf: Caspar_Ds Entscheidung*

### S · Fensterlängen im Rechenkern ohne Herleitung

400 ms und 3 s sind über BS.1770 begründet, das Bandfenster (4096 Werte) über die Frequenzauflösung. Die übrigen Längen — 10, 50, 500 und 500 ms — sind laut Text runde Zahlen ohne dokumentierte Herleitung. Zu tun: je Größe entscheiden, was gemessen werden soll (Schläge brauchen 20–80 ms), die Wahl im Quelltext begründen oder die Länge anpassen.

*Quelle: docs/VISUALIZER.md — „Warum 400 ms und 3 s — und warum das kein Schlagfenster ist" · wartet auf: nichts — kann sofort gemacht werden*

### S · Horizontband-Reste: Urteil steht aus

abstandZurUmgebung, gleitMittel und die UMGEBUNG_-Konstanten (rund 71 Zeilen) sind technisch tot, aber der Abklemm-Beschluss in Z. 302–306 deckt sie vermutlich — der Review lässt das ausdrücklich als „unklar" stehen. Es ist der einzige Punkt aus Abschnitt 6, den Caspar_Ds Runde vom 25.08. abends nicht entschieden hat: löschen oder als abgeklemmt stehenlassen.

*Quelle: docs/ANALYZER-REVIEW.md, 6 (Entscheidungsfragen) · wartet auf: Caspar_Ds Entscheidung*

### S · Instrumenten-Kopf mitnehmen oder nicht

Neben Genre und Mood/Theme liegt der Jamendo-Instrumentenkopf als ONNX bereit. Der Plan hält dazu ausdrücklich fest: „Instrumente laut Caspar_D mitnehmen? OFFEN, er hatte sie in der Bühne stillgelegt." Zu klären, ob die Instrumenten-Tags in library/klang.json und in die Cluster-Namen einfließen.

*Quelle: docs/MORGENROUTINE-PLAN.md, 3 (bin/klang.js) · wartet auf: Caspar_Ds Entscheidung*

### S · Playlists: drei Entscheidungen zum Umfang

Die 25 geholten Playlists (599 Einträge) enthalten 117 Songs anderer Urheber, 73 eigene Songs, die nicht im Archiv stehen (Takes aus dem Arbeitsbereich, bewusst einsortiert), und 27 der 248 Archiv-Songs stehen in keiner Playlist. Vor jedem Einbau muss geklärt sein, was davon ins Archiv gehört und was nicht.

*Quelle: docs/BACKLOG.md — „Klein und konkret / Playlists" · wartet auf: Caspar_Ds Entscheidung*

### S · Restpunkt: übernommene Schwellwerte aus dem CB-Audio-Analyzer

Der Verdacht auf Codeübernahme ist ausgeräumt, aber die Schwellwerte 450 Hz, 7,8 dB und −77 dB sind identisch übernommen. Reine Zahlen sind keine Codeübernahme, doch das Dokument nennt es ausdrücklich als Restpunkt und als die Stelle, die ein Dritter ansähe. Vor der Veröffentlichung zu bewerten, etwa durch einen Herkunftsvermerk an der Fundstelle.

*Quelle: docs/OFFEN.md § 5.5 — audioMotion, Abschnitt „Entwarnung aus derselben Prüfung" · wartet auf: Caspar_Ds Entscheidung vor der Veröffentlichung*

### S · Schautafeln bahn.html und bahn3d.html aus dem Paket nehmen

web/bahn.html und web/bahn3d.html liegen im Paket und sind harmlos. Wenn Tarja sie nicht braucht, in paket.js ausschließen.

*Quelle: docs/BACKLOG.md — „Klangraum / Schautafel als Entwicklerwerkzeug" · wartet auf: Tarjas Rückmeldung, ob sie die Schautafeln braucht*

### S · Störtöne in den Geräuschkulissen-Songs abhören

Der volle Detektorlauf fand 9 Störtöne in 6 Songs. Zwei Fälle sind geklärt (7 999,6 Hz in „Remix Mich" und „Die Gedanken…", Codec-Artefakt, Kerbe wirkt „hervorragend"). Offen sind „Erste Regentropfen" (10,4–10,7 kHz, vier dichte Linien, eher ein Band), „Waldesrauschen" (4 737/4 740 Hz) und „Wiese mit Insekten" (7 200 Hz) — dort kann der Detektor Zirpen/Rauschen nicht von einem Artefakt unterscheiden. Der ♪-Griff im Glockenstuhl macht den Ton allein hörbar; danach entscheidet sich je Song, ob eine Kerbe gesetzt wird.

*Quelle: docs/TONSTUDIO.md — „Störfrequenzen — Rest eingebaut" / Befund des vollen Laufs (321 Songs) · wartet auf: Caspar_Ds Hörprobe an den drei Songs*

### S · Zeitstaffel: das Jahr-Ende ausformulieren

zeitRelativ endet bei „vor x Jahren". Wie es danach weitergeht, ist offen — im Gespräch waren Jahrestag, „vor 2 Jahren (Aug 2024)" oder Saros-Zyklen. Caspar_D will darüber noch brainstormen.

*Quelle: docs/BACKLOG.md — „Zeitstaffel: das Jahr-Ende ausformulieren" · wartet auf: Caspar_Ds Brainstorming*

### S · v3-Abschnittsmarken vor Whisper, wenn v2 fehlt?

Der Katalog nimmt die Wort-Zeitmarken aus v2 und greift sonst zu Whisper, das keine Abschnittsmarken kennt. Bei „Ich dreh mich nicht um!" (11 Marken, 203 Worte) und „Erste Liebe" (1 Marke, 95 Worte) liegt in v3 eine Gliederung, die dadurch verlorengeht. Zu klären ist, ob v3 vor Whisper kommen soll, wenn v2 fehlt — der Beschluss vom 20.08. regelt nur v2 gegen Whisper, nicht den Fall ohne jede Gliederung.

*Quelle: docs/OFFEN.md § 6.3 — Zwei Songs haben Abschnittsmarken in v3, die niemand nutzt · wartet auf: Caspar_Ds Entscheidung*

### M · Clustering-Verfahren, UMAP-Parameter und Palette entscheiden

Ausdrücklich Caspar_D vorbehalten: das Clustering-Verfahren will er als Omics-Analyst selbst mitentscheiden (erstmal Standard, HDBSCAN-JS oder agglomerativ als Gegenprobe, Noise dem nächsten Zentroid). Dazu die UMAP-Parameter — die Grundfrage lautet Inseln gegen Kontinuum — und die Palette der Karte. Ohne diese drei Festlegungen bleibt die Karte vorläufig.

*Quelle: docs/MORGENROUTINE-PLAN.md, 5 (Punkt 6, „Offen:") · wartet auf: Caspar_Ds Entscheidung*

### M · Erfundene Liedtexte kennzeichnen (19 Songs)

Whisper hört auf Naturklang Sprache, wo keine ist; die Ausgabe steht als Wort-Zeitmarken im Katalog (worte) und läuft in der Bühne mit wie echter Text. 19 Fälle sind namentlich belegt, erkannt an fremder Schrift (singhalesisch, arabisch, thailändisch), Danksagungen und Untertitel-Hinweisen sowie Wortschleifen über 40 %. Das ist die Untergrenze — von den 64 textlosen Songs tragen 35 Wort-Zeitmarken, die übrigen 16 also vermutlich ebenfalls Erfundenes, nur unauffälliger. Zu entscheiden, ob solche Texte gelöscht, markiert oder nur nicht angezeigt werden.

*Quelle: docs/ERFUNDENES.md, 1 · wartet auf: Caspar_Ds Entscheidung*

### M · Farblose Cover an die Gipfelschwelle koppeln

Sechs der zwanzig als farblos geltenden Cover haben in Wahrheit einen flächigen Farbstich (bei „Urgewalt" 96,9 % der Pixel über C>0,02) und scheitern nur an der festen Gipfelschwelle 0,06 in farbtoene(). Eine Kopplung statt der festen Schwelle gäbe ihnen eine Farbwelt — ändert aber die Palette ALLER Songs, deshalb ist es keine technische, sondern eine Geschmacksfrage.

*Quelle: docs/NAECHSTER_CHAT.md — „Nachtrag 24.08.2026 (Nachmittag)", Abschnitt „Offen und lohnend" · wartet auf: Caspar_Ds Entscheidung*

### M · Feineres Clustering innerhalb der Metal-Gruppe

Die Metal-Gruppe ist groß; innerhalb der Gruppe agglomerativ nachteilen oder HDBSCAN an derselben Stelle in karte.js. Erst, wenn mehr Songs da sind; Caspar_D will das am Bild entscheiden (23.08.: „ja, vielleicht").

*Quelle: docs/BACKLOG.md — „Klangraum / Feineres Metal-Clustering" · wartet auf: mehr Songs und Caspar_Ds Urteil am Bild*

### M · Fünf weitere Bedienunterschiede Pult gegen Hauptleiste abwägen

Ausdrücklich als Entscheidung, nicht als Fehler festgehalten: kein Weg vom Pult in die Detailansicht (#btitel ist ein nacktes h2 ohne Handler, 2520), der schnelle Tooltip endet an #player [title] und lässt alle Pultknöpfe im trägen System-Kasten (13358), bei fremden Songs verliert btitel die Herkunft, die die Hauptleiste anhängt (13021/8994), Escape schließt alles außer dem Tonstudio (13414), und beide Leisten können nur springen, nicht spulen (13376, nur onclick, Ziehen gibt es nirgends).

*Quelle: docs/LEISTEN-UND-TONKETTE.md, 3 · wartet auf: Caspar_Ds Entscheidung*

### M · Lyrics unabhängig von Stage und Analyzer zuschaltbar

Caspar_Ds Befund: Der Text sitzt in der Bühne nicht sauber. Vorschlag war: Stage und Analyzer schließen sich aus (beide besetzen die Fläche), Lyrics dagegen unabhängig zuschaltbar — damit wäre „Analyzer + Lyrics", also Karaoke mit Visuals, möglich. Gebaut ist bisher eine Textachse mit vier Werten, die sich alle gegenseitig ausschließen. Der Punkt ist im Text ausdrücklich als „Offen" markiert.

*Quelle: docs/BACKLOG.md — „Bühne / Lyrics konsistenter unterbringen" · wartet auf: Caspar_Ds Entscheidung*

### M · Rabenmagie im Sternenhimmel-Export nachziehen

Die Rabenmagie (globales Violett samt Cover-Schleier, Klasse .rabenmagie, rabenmagieAnwenden()) wirkt nicht im Sternenhimmel-Export library/export/sternenhimmel.html, weil uiFaerben Bühnen-Code ist; der Handler dort ist per typeof abgesichert. Nachziehen wäre möglich, ist aber ausdrücklich als „falls gewünscht" notiert — die Demo für Tarja soll eine Datei ohne Server bleiben.

*Quelle: docs/NAECHSTER_CHAT.md — „Nachtrag 25.08. spät", letzter Spiegelstrich · wartet auf: Caspar_Ds Entscheidung, ob das im Export überhaupt gewünscht ist*

### M · Tonart auf Naturklang unterdrücken — Filter beim Material

Alle 50 Naturklang-Stücke bekommen eine Tonart, „Wiese mit Insekten" gleich vier verschiedene in vier Fassungen. Die naheliegende Abhilfe über tonart.einsAnteil ist im Dokument bereits durchgerechnet und taugt nicht: die Verteilungen mit und ohne Liedtext überlappen fast vollständig, eine Schwelle bei 35 % nähme 62 echten Songs die Tonart und erwischte nur 19 der 64 textlosen. Der Filter muss beim Material ansetzen, nicht beim Messwert — dieselbe Vorentscheidung wie bei der Stimmlage.

*Quelle: docs/ERFUNDENES.md, 3 · wartet auf: Caspar_Ds Entscheidung, dann Neulauf über 321 Ablagen*

### M · WAV/MP3-Umschaltung nur über das Pult erreichbar

Die Tonqualität MP3/WAV liegt allein im Bühnenpult (12693), obwohl sie die eine Tonquelle umschaltet, an der alles hängt. Wer ohne Bühne hört, kommt an WAV nicht heran. Zu entscheiden, ob die Umschaltung in die Fußzeile gehört oder bewusst an der Bühne bleibt.

*Quelle: docs/LEISTEN-UND-TONKETTE.md, 3 · wartet auf: Caspar_Ds Entscheidung*

### ? · Bounce des bearbeiteten Tons

Ein Export der im Studio bearbeiteten Fassung ist notiert als „nur falls Caspar_D je will". Die Randbedingung steht fest: die Suno-WAV-Originale sind TABU, ein Bounce dürfte sie nie überschreiben, sondern nur zusätzlich ablegen. Ob es das überhaupt geben soll, ist nicht entschieden.

*Quelle: docs/TONSTUDIO.md — „Offen (Stand 23.08.2026)" · wartet auf: Caspar_Ds Entscheidung, ob er einen Bounce überhaupt will*

### ? · Fremdbibliothek in der Bühne: ja oder nein

Das Auswahlfeld „Darstellung" ist über MODI[].gruppe auf Erweiterungen ausgelegt. Bewertet sind Butterchurn (echter Party-Gewinn, bringt aber eigene Farben mit und ignoriert die Coverpalette — nur als ausdrücklich deklarierter Ausnahme-Modus) und Meyda (einziger echter Analyse-Gewinn: Chroma und Bark-Lautheit fehlen bisher). Das Projekt ist bisher eine Datei ohne Abhängigkeiten; jede Erweiterung wäre die erste Fremddatei.

*Quelle: docs/BACKLOG.md — „Bühne / Erweiterungen (Plugins)" · wartet auf: Caspar_Ds Entscheidung*

### ? · Instrumentenerkennung steht auf vier totgelegten Größen

Die Instrumentenerkennung entscheidet mit inharmMed (steht bei allen 321 Songs am Anschlag), harmDens (antwortet umgekehrt: weißes Rauschen 15,8 von 16), attackMs (bei 297 von 321 Songs leer, sonst Intro-Länge in Sekunden) und tilt (ohne definierten Nullpunkt). Alle vier sind als Karten totgelegt, die Erkennung selbst steht auf keiner der Listen TOT/SA_TOT/SPUR_TOT. Zu klären, ob sie noch angezeigt wird und ob sie mit totgelegt, neu gegründet oder vorerst mit Vertrauensangabe versehen wird.

*Quelle: docs/ANALYZER-PRUEFUNG.md, Funde 22, 24, 25 und 46 (analyzer.js ab 4691) · wartet auf: Caspar_Ds Entscheidung*

### ? · Metadaten des Suno-Arbeitsbereichs sichern

Rund 2200 Clips liegen im Suno-Arbeitsbereich (alle Takes und Varianten), bewusst nicht archiviert. Ein vollständiger Sammellauf kostet mehrere Stunden und rund 40 GB; der Zwischenweg wären nur die Metadaten (wenige MB), womit die Entstehungsgeschichte jedes Songs dokumentiert wäre. Zu entscheiden ist, ob und in welcher Tiefe.

*Quelle: docs/BACKLOG.md — „Größer / Der Arbeitsbereich" · wartet auf: Caspar_Ds Entscheidung*


## Verbesserung

### S · Abhängigkeiten im Auswahldialog sichtbar machen

Der Plan verlangt, die Abhängigkeiten zwischen den Kreuzen anzuzeigen: abgewähltes „Medien laden" graut „Musikstil" und „Whisper" für neue Songs aus, mit einem Satz warum; die Karte braucht Musikstil plus Analyse. Der am 21.08. gebaute Dialog (#morgenauswahl, MORGEN_KREUZE) kennt Pillen, Pflichtposten und gedimmte „Bald:"-Zeilen, aber kein Ausgrauen aus Abhängigkeit.

*Quelle: docs/MORGENROUTINE-PLAN.md, 1 (Schluss) · wartet auf: nichts — kann sofort gemacht werden*

### S · Analyzer 3.2: Hüllkurve aus dem Katalog sofort zeigen

Die Hüllkurve liegt als welle im Katalog. Sie soll beim Umschalten in den Analysemodus sofort gezeichnet werden, bevor gerechnet wird — der einzige noch offene der drei Unterpunkte neben 3.3.

*Quelle: docs/BACKLOG.md — „SunoAnalyzer als vierte Bildebene / 3 · Nur lokale Daten" · wartet auf: nichts — kann sofort gemacht werden*

### S · EQ-Knopf fehlt im Bühnenpult

Im Pult gibt es keinen EQ-Knopf — das war die ursprüngliche Frage aus der Bestandsaufnahme. Sinnvoll ist er laut Dokument erst, wenn das Tonstudio überhaupt über die Bühne kommt.

*Quelle: docs/OFFEN.md § 6.4 — Aus der Leisten-Bestandsaufnahme (vierter Punkt) · wartet auf: den z-index-Punkt: erst muss das Tonstudio über die Bühne kommen*

### S · Knopf „Whisper-Text in die Lyrics übernehmen/verwerfen"

Für Songs ohne hinterlegten Text steht Whispers gehörter Text als Lyrics mit Quelle whisper und wird in der Bühne als „Lyrics (Whisper gehört)" markiert. Ein Knopf, mit dem man diesen Text in die richtigen Lyrics übernimmt oder verwirft, fehlt.

*Quelle: docs/BACKLOG.md — „Tarjas Wünsche / Whisper für die Wort-Zeitmarken", Absatz „Offen" · wartet auf: nichts — kann sofort gemacht werden*

### S · Lesezeichen einmal durchlaufen lassen

Seit dem Einbau des Benachrichtigungsstroms ist browser/morgens.js nicht mehr gelaufen. Deshalb steht im Community-Fenster noch der Platzhalter „von wem, wissen wir erst für Likes ab August 2026" statt der Namen. Das ist kein Code, nur ein Lauf auf einem angemeldeten Suno-Tab; danach stehen die Like-Namen vier Wochen zurück da.

*Quelle: docs/NAECHSTER_CHAT.md — „Was als Nächstes ansteht", Punkt 1 · wartet auf: Caspar_D — nur er kann das Lesezeichen im angemeldeten Suno-Tab starten*

### S · Morgenschritt 'karte' einhängen

'musikstil' ist seit dem 21.08. ein Morgenschritt, 'karte' steht noch aus — im Auswahldialog erscheint dafür bisher nur die gedimmte „Bald:"-Zeile. Der Schritt gehört in Gruppe C (lokal) und braucht laut Plan Musikstil plus Analyse als Vorbedingung.

*Quelle: docs/MORGENROUTINE-PLAN.md, 5 (Punkt 6, „Offen:") und 1 (Gruppe C) · wartet auf: bin/karte.js muss laufen*

### S · Perzentil-Helfer und Millisekunden-Format vereinheitlichen

Das Perzentil-Muster steht fünfmal ausgeschrieben im Analyzer und gehört in einen Helfer perzentil(werte, p). Dazu gibt es die Millisekunden-Formatierung doppelt, mit inkonsistentem Dezimaltrennzeichen (einmal Punkt, einmal Komma). Die verwandten Doppel (fmt/zeitTxt, zahl(v), kaskadeName, Attack-Kopie) sind am 25.08. bereits erledigt — diese beiden nicht.

*Quelle: docs/ANALYZER-REVIEW.md, 4 · wartet auf: nichts — kann sofort gemacht werden*

### S · Prüfschritt für PowerShell-Skripte vor dem Versand

Der CP1252-Fehler bei TrYa wäre durch einen Prüfschritt vor dem Versand aufgefallen. Vorgeschlagen sind ein Vermerk in den Hausregeln und ein bin/pruefe-skripte.js, das reines ASCII, BOM und einen CP1252-Parserlauf prüft. Ein pwsh-Syntaxcheck allein genügt ausdrücklich nicht, weil PowerShell 7 UTF-8 auch ohne BOM liest und nichts meldet.

*Quelle: docs/OFFEN.md § 2.8 — PowerShell-Prüfung festhalten · wartet auf: nichts — kann sofort gemacht werden*

### S · Sicherheit des Grundtons anzeigen

einsAnteil wird gemessen und nicht gezeigt. Ein Grundton mit 30 % ist etwas anderes als einer mit 95 % — bei jedem der vier uneinigen Fassungspaare ist die sichere Fassung zugleich die plausiblere (dogma C mit 100 % gegen D mit 52 %). Als Rauschfilter taugt der Wert nicht, als Verlässlichkeitsmaß für den Betrachter schon; heute ist der Unterschied unsichtbar.

*Quelle: docs/ERFUNDENES.md, 5 („Was daraus zu machen wäre") · wartet auf: nichts — kann sofort gemacht werden*

### S · Sortierung nach Bewegung (Plays der letzten 7 Tage)

Aus dem Zählerverlauf „Plays der letzten 7 Tage" ableiten und als Sortierung anbieten — was sich gerade bewegt, statt der Summe über sechzehn Monate. Der Verlauf sammelt seit dem 20.08. täglich; der Text sagt: lohnt in einer Woche, wenn er Tiefe hat.

*Quelle: docs/BACKLOG.md — „Offen seit dem 19.08.2026 / Sortierung nach Bewegung" · wartet auf: Tiefe im Zählerverlauf — sammelt seit 20.08.*

### S · Stereobreite: Klemme bei 1,0 und Prozentzeichen

RMS(L-R)/RMS(L+R) ist sauber gerechnet und unabhängig auf drei Stellen bestätigt, wird aber mit Math.min(1, …) gedeckelt, obwohl das Verhältnis bei gegenphasigem Material über 1 gehen kann — genau dann wäre es interessant. Angezeigt wird es als '%', obwohl es ein Verhältnis ist, und der Erklärungstext nennt es 'L-R-Differenz' und unterschlägt den Bezug aufs Mittensignal. Klemme entfernen oder deutlich höher setzen, als Verhältnis oder in dB anzeigen, Text auf 'Seiten- zu Mittensignal' ändern.

*Quelle: docs/ANALYZER-PRUEFUNG.md, Fund 61 (analyzer-worker.js:84) · wartet auf: nichts — kann sofort gemacht werden*

### S · Stilgruppen-Preset im Equalizer

karte.json trägt je Stilgruppe bereits das 8-Band-Mittel im Feld profil. Das als Voreinstellung im Equalizer anbieten: „wie die Gruppe klingt".

*Quelle: docs/BACKLOG.md — „Klangraum / Stilgruppen-Preset im EQ" (auch im Tonstudio-Reststand genannt) · wartet auf: nichts — die Daten liegen in karte.json*

### S · Tarja im START-HIER auf den Analyzer-Knopf hinweisen

Tarjas „Sinus-Equalizer" meinte ein Spektrogramm, und das gibt es längst: Der Analysemodus der Bühne zeichnet FFT-Spektrogramme (links/rechts, Stereo-Differenz, Wasserfall), seit dem 19.08. für alle Songs vorberechnet. Zu bauen ist nichts — es fehlt nur der Hinweis im START-HIER, wo dieser Knopf sitzt.

*Quelle: docs/BACKLOG.md — „„Sinus-Equalizer" — GEKLÄRT (20.08.2026)" · wartet auf: nichts — kann sofort gemacht werden*

### S · Tonstudio: Professionell-Texte verständlicher machen

Die Erklärtexte im Tonstudio gibt es in Caspar_Ds Sprache („Überschreien"), die professionelle Fassung ist noch zu schwer. Der Text vermerkt ausdrücklich: Caspar_Ds Anmerkungen dazu stehen aus.

*Quelle: docs/BACKLOG.md — „Tonstudio — Reststand (20.08.2026)" · wartet auf: Caspar_Ds Anmerkungen zu den Texten*

### S · Toter Kepler-Code entfernen

Die Kepler-Tabellen sind seit der Umstellung auf Kreisbahn mit konstantem Tempo ungenutzt, stehen aber weiter im Code: web/index.html:5994–5999 (keplerPhase samt Kommentar) und bin/himmel-export.js:97, das sie beim Export mit ausschneidet (KEPLER_N, KEPLER_GES, ORBIT_EXZ, funktion('keplerPhase')). Beim Entfernen also beide Stellen anfassen, sonst bricht der Sternenhimmel-Export.

*Quelle: docs/KLANGRAUM.md, Abschnitt "Bahnmechanik", Punkt "Bekannte Reste" · wartet auf: nichts — kann sofort gemacht werden*

### S · Vier Kleinigkeiten im Pult, davon eine Entscheidung

pmodiAufbauen() (11125) setzt nur .disabled und .title, nie eine Aktiv-Klasse — die drei Modussegmente zeigen ihren Zustand nie an, obwohl der Kommentar 1152–1160 ausdrücklich das Gegenteil verspricht. #bmeta wird bei jedem Bühnenaufbau mit Modell, Datum, Plays und Likes gefüllt (13022) und ist durch Regel 802 immer unsichtbar: entweder sichtbar machen oder das Füllen weglassen. Dazu fehlt der Anschlusslampe im Pult die CSS-Regel (sie zeigt zwei statt drei Zustände, 272–274/8803/8813), und #bstumm ist der einzige Knopf beider Leisten ohne eigenes title samt Tastenhinweis (2532).

*Quelle: docs/LEISTEN-UND-TONKETTE.md, 2.10 · wartet auf: nichts — außer bei #bmeta: Caspar_Ds Entscheidung sichtbar machen oder Füllen weglassen*

### S · Vier Suno-API-Wege prüfen

Aus docs/SUNO-API.md lohnen vier Wege eine Probe: aligned_lyrics/v3 (neuer als das benutzte v2), gen/<id>/wav_file/ (sagt es, ob das WAV fertig ist?), clips/get_songs_by_ids (73 private Songs in einem Aufruf) und download/clip/ (sauberer Medienweg?). Verboten bleibt alles Verändernde: notification/v2/read, clear-badge, set_, toggle_, delete, trash.

*Quelle: docs/NAECHSTER_CHAT.md — „Was als Nächstes ansteht", Punkt 8 · wartet auf: teilweise Token — also einen angemeldeten Tab bzw. das Lesezeichen*

### S · Whisper-Nachholen sichtbar machen

Dass die Morgenroutine bei jedem Lauf prüft, ob Whisper etwas nachzuholen hat, ist nirgends sichtbar — Tarja musste danach fragen. Entweder als Schritt in der Fortschrittsanzeige oder als Zeile im Morgenfenster.

*Quelle: docs/BACKLOG.md — „Aus Tarjas erstem Testlauf / Erklärungsbedarf" · wartet auf: nichts — kann sofort gemacht werden*

### S · stems.js erkennt Fertiges nur an piano.flac

bin/stems.js hält einen Ordner für fertig, sobald piano.flac darin liegt; ein abgebrochener Ordner mit nur drei Spuren fällt durch die Prüfung und bleibt halb. Der Pipe-Fix in flacSchreiben hat den Hänger behoben und der Lauf über 321 Songs ist durch — ob der Härtungsvorschlag aus OFFEN.md 2.10 (alle sechs Spuren zählen statt nur piano.flac) ebenfalls eingebaut wurde, steht nirgends. Nachsehen und gegebenenfalls nachziehen, bevor der nächste Lauf über neue Songs geht.

*Quelle: docs/NAECHSTER_CHAT.md — „Was gerade läuft", Absatz „Wenn es wieder passiert" (Verweis auf docs/OFFEN.md 2.10) · wartet auf: nichts — kann sofort gemacht werden*

### S · x²-Hüllkurve: auf p98 normalisieren statt aufs Maximum

Beim Quadrieren wird der lauteste Punkt so dominant, dass alles andere verschwindet: Median der Auslenkung 3,5 % der halben Bahnhöhe, p95 25,2 %. Vorgeschlagen ist, nach der Umformung nicht auf das Maximum, sondern auf ein hohes Perzentil (etwa p98) zu normalisieren und darüber zu kappen. Ausdrücklich zu prüfen ist dabei, ob das Kappen bei der Wurzelform sichtbar stört.

*Quelle: docs/OFFEN.md § 6.1 — Die Hüllkurve fällt bei x² in sich zusammen · wartet auf: Caspar_Ds Entscheidung*

### S · Übergabetext nennt noch MySuno

Der Block, der ausdrücklich zum Kopieren in eine neue Sitzung gedacht ist, beginnt mit „Ich arbeite an MySuno" und listet die Dokumente in einem Stand vor der Umbenennung; im Kopf desselben Dokuments steht dagegen KlangTresor. Nach der Hausregel „Übergabedokumente immer sofort mitaktualisieren" gehört das nachgezogen — anders als die bewusst belassenen Altnamen (52 localStorage-Schlüssel mysuno-*, IndexedDB mysuno-morgens, .sunoanalyzer, window.SunoAnalyzer) und anders als Zitate und docs/HISTORY.md.

*Quelle: docs/NAECHSTER_CHAT.md — „Übergabetext für den nächsten Chat" · wartet auf: nichts — kann sofort gemacht werden*

### M · Analyzer: Lyrics fremder Songs

Der als vierter Textmodus eingebundene SunoAnalyzer zeigt rechts Stil- und Lyricsprompt. Für fremde Songs aus Playlists, die nicht im Archiv liegen und live vom CDN kommen, fehlen diese Texte noch. Ausdrücklich als offen benannt.

*Quelle: docs/UEBERGABE.md, Abschnitt "Woran als Nächstes gearbeitet wird" · wartet auf: nichts — kann sofort gemacht werden*

### M · Analyzer: Zwischenspeicher für die Analyse

Beim zweiten Aufruf eines Songs wird die komplette Analyse neu gerechnet. Gewünscht ist ein Zwischenspeicher, damit die 16 Diagramme sofort stehen. Als offener Punkt benannt, Details im BACKLOG.

*Quelle: docs/UEBERGABE.md, Abschnitt "Woran als Nächstes gearbeitet wird" · wartet auf: nichts — kann sofort gemacht werden*

### M · Baßton-Verteilung ablegen und den Quintenfehler abfangen

Der Quintenfehler ist der einzige Grundton-Befund, der ohne äußeren Maßstab auskommt: bei zwei von vier uneinigen Fassungspaaren liegt genau eine Quinte zwischen den Messungen, weil der Baß auf der Eins die fünfte Stufe spielt und das Verfahren sie für den Grundton nimmt (dazu passend: 15 % aller Songs enden auf der Quinte statt auf dem gemessenen Grundton). Die Regel wäre: liegt der zweithäufigste Baßton eine Quarte unter dem häufigsten, ist der häufigste vermutlich die Quinte. Prüfbar erst nach einer Neurechnung — toene.json legt nur den gewählten Ton und einsAnteil ab; die ganze Verteilung mitzulegen kostet 12 Zahlen je Song und macht die Frage künftig ohne Neulauf beantwortbar.

*Quelle: docs/ERFUNDENES.md, 5 („Was daraus zu machen wäre") · wartet auf: Neulauf über 321 Ablagen (bin/toene.js)*

### M · Community-Fenster ausbauen

Drei Ergänzungen: die Follower-Liste (ins Profil-Fenster, nicht ins Song-Fenster), comment_like, hook_like und playlist_like aus dem Benachrichtigungsstrom anzeigen, und „Ungelesen" als Punkt am Zähler auf der Kachel selbst.

*Quelle: docs/BACKLOG.md — „Offen seit dem 19.08.2026 / Community-Fenster ausbauen" · wartet auf: nichts — kann sofort gemacht werden*

### M · Community-Fenster: mehr aus dem Strom zeigen

comment_like (wer hat deinen Kommentar geliked), hook_like und playlist_like liegen bereits in library/reaktionen.ndjson, werden aber nirgends angezeigt. Zusätzlich die Idee, „Ungelesen" auf die Kachel selbst zu holen: ein Punkt am Zähler, wenn seit dem letzten Öffnen etwas dazugekommen ist.

*Quelle: docs/NAECHSTER_CHAT.md — „Was als Nächstes ansteht", Punkt 4 · wartet auf: nichts — kann sofort gemacht werden*

### M · Crest und Lautheit werden zu grob abgetastet

Crest-Faktor und Lautheit werden mit zu grobem Sampling gerechnet, während die Hüllkurve inzwischen 20 Werte je Sekunde liefert. Feiner abtasten hieße vermutlich einen Neulauf über alle 321 Ablagen — also vorher am Meßweg-Stempel klären, ob es eine Verfahrensänderung ist (neu rechnen) oder nur eine Formatfrage (neu laden).

*Quelle: docs/NAECHSTER_CHAT.md — „Nachtrag 25.08. Nacht", „Offene Arbeitsliste" (docs/OFFEN.md Abschnitt 6) · wartet auf: gegebenenfalls einen Neulauf über 321 Ablagen*

### M · Dritte Stufe der Farbwahl für einfarbige Cover

Bei den 21 Covern mit nur einem Ton entsteht die Palette derzeit aus diesem einen Ton. Besser wäre, sie aus dessen Helligkeits- und Buntheitsverteilung zu bauen: Grund am Häufigkeitsgipfel, Akzent am Buntheitsmaximum. Die Daten liegen mit grundL und akzentL je Ton schon im Katalog und werden nur nicht benutzt.

*Quelle: docs/BACKLOG.md — „Mittel / Dritte Stufe der Farbwahl" · wartet auf: nichts — kann sofort gemacht werden*

### M · EQ-Knopf ins Bühnenpult holen

Der studioknopf (Zeile 2579) ist der einzige Knopf, den das Pult gegenüber der Hauptleiste nicht hat — er war der Anlass der ganzen Bestandsaufnahme. Sinnvoll erst nach dem Studio-Schließen aus 2.2 und nur mit einem z-index über der Bühne, sonst öffnet der neue Knopf das Studio genau in die unsichtbare Sackgasse.

*Quelle: docs/LEISTEN-UND-TONKETTE.md, 1 und Vorschlag 6.4 · wartet auf: Punkt 2.2 (buehneAuf schließt das Studio) muss zuerst stehen*

### M · Eigene Schlagerkennung gegen Sunos downbeats prüfen

Seit dem 19.08. liegen Sunos eigene Schläge als Feld schlaege im Katalog (Zeit und Gewicht je Schlag). Der Analyzer rechnet Tempo selbst und war sich dabei nicht sicher. Die Gegenprobe der eigenen Onset-/BPM-Erkennung gegen diese Referenz ist im Dokument als Nutzen genannt, aber noch nicht gezogen.

*Quelle: docs/DATENEXTRAKTION.md, Abschnitt "Drei Auskünfte, die wir seither holen" / "Was das bringt" · wartet auf: nichts — die Schläge liegen im Katalog*

### M · Feineres Clustering in der Metal-Familie

Die Metal-Familie umfasst 106 Songs in einer Gruppe — grob im Verhältnis zum Rest der Karte. Das agglomerative Clustering (complete linkage, Silhouette 4–14) trennt sie nicht weiter auf. Zu prüfen, ob eine zweite Clusterstufe innerhalb dieser Gruppe sinnvolle Untergruppen ergibt.

*Quelle: docs/KLANGRAUM.md, Abschnitt "Offen / Ideen" · wartet auf: nichts — kann sofort gemacht werden*

### M · Follower-Liste im Profil-Fenster

Der Benachrichtigungsstrom trägt follow-Ereignisse, der Server sammelt sie bereits (/api/community → follower), und an der einzelnen Person steht „folgt dir seit". Es fehlt eine Liste ALLER Follower. Sie gehört ins Profil-Fenster (profilAuf()), ausdrücklich nicht ins Song-Fenster.

*Quelle: docs/NAECHSTER_CHAT.md — „Was als Nächstes ansteht", Punkt 2 · wartet auf: Datenlage aus dem Lesezeichen-Lauf; sonst nichts*

### M · Gravitationsachse der Tags aus der Kovarianz

Die Neigung der Tag-Darstellung wird bisher gesät (Zufallssaat) statt aus der Kovarianz der zugehörigen Songs gerechnet. Für die Gruppen-Attraktoren ist die echte Hauptachse bereits umgesetzt, für die Tags/Sternbilder noch nicht.

*Quelle: docs/KLANGRAUM.md, Abschnitt "Offen / Ideen" · wartet auf: nichts — kann sofort gemacht werden*

### M · Lyrics fremder Songs holen

Gemessen: api/clip/<id> liefert ohne Anmeldung Titel, Lyrics, Stil und Dauer (HTTP 200), api/gen/<id>/aligned_lyrics/ verlangt ein Token (401). Fremde Songs könnten also Text bekommen, aber keine wortgenauen Zeitmarken — es bliebe das gleichmäßige Mitwandern, das für die vier eigenen Songs ohne Zeitmarken schon existiert. Holen über den lokalen Server (kein CORS-Problem), Zwischenspeicher als eine gepackte Datei.

*Quelle: docs/BACKLOG.md — „Bühne / Lyrics fremder Songs" · wartet auf: die Playlist-Entscheidung — es geht um fremde Songs*

### M · Playlists in Katalog und Oberfläche einbauen

Die Rohdaten liegen seit 17.08. in library/roh/playlists-<stempel>.json, Endpunkte und Fallstricke in DATENEXTRAKTION.md. Das Feld albums gibt es im Katalog bereits an jedem Song und ist bei allen 248 leer, also für die Zuordnung frei. Anzeige in der Oberfläche fehlt vollständig.

*Quelle: docs/BACKLOG.md — „Klein und konkret / Playlists" · wartet auf: die drei Entscheidungen zum Umfang*

### M · Profil: Halbwertszeit und Gesamtkurven

Der Zählerverlauf sammelt seit dem 20.08. täglich sauber. In rund zwei Wochen daraus: Halbwertszeit je Song (nach wie vielen Tagen die Hälfte der Plays da war) und eine Plays/Likes-Gesamtkurve im Profil. Dazu die Whisper-Gesamtqualität als Median-Versatz aller Songs gegen v2.

*Quelle: docs/BACKLOG.md — „Profil: Halbwertszeit und Gesamtkurven (wenn der Verlauf reift)" · wartet auf: rund zwei Wochen Zählerverlauf — ab 20.08. gerechnet*

### M · Reste des Analyzer-Originals entfernen

Der Analyzer ist seit dem 18.08.2026 ein Modus der Bühne, trägt aber noch Kopfbereich, Kommentar-Generator und einen eigenen Player mit. Daran hängen drei Folgen, die der Text jeweils als „entfällt danach" beschreibt: die Brücke `__SA` schrumpft erst dann auf null, die einzige verbleibende Namenskollision (`player`) verschwindet erst dann von selbst, und die Wirtsseite `web/analyzer.html` (1,2 KB) wird überflüssig. Zu klären ist vorher, ob der Prüfstand noch gebraucht wird.

*Quelle: docs/VISUALIZER.md — „Er liegt als Modul unter web/fremd/analyzer.js", „Drei Eingriffe waren beim Umzug nötig", „Kennungen kollidieren fast nicht" · wartet auf: Caspar_Ds Entscheidung, ob der Prüfstand web/analyzer.html noch gebraucht wird*

### M · Rot und Gold trennen (Trennschärfe aufweichen)

Bei „Die Gedanken ..." wird das Gold gefunden (#ef6312, 11 %), das Rot der Kameralinsen nicht — beide liegen nur rund 16 Grad auseinander, und die abgeleitete Trennschärfe war größer. Denkbar: die Trennschärfe zusätzlich nach unten aufweichen, wenn zwei Gipfel klar getrennte Spitzenbuntheiten haben.

*Quelle: docs/BACKLOG.md — „Mittel / Rot und Gold verschmelzen" · wartet auf: nichts — kann sofort gemacht werden*

### M · Rund 210 Zeilen toter Analyzer-Code

In web/fremd/analyzer.js liegen etwa 210 Zeilen toter Code. In OFFEN.md 2.9 stehen zwei Fallen dazu, die zu beachten sind. Der Ausbau ist nach der Lehre vom 24.08. („ein halber Ausbau ist schlimmer als keiner") nur vollständig sinnvoll: Aufrufer zuerst suchen, sonst fliegt ein ReferenceError aus darstellungAufbauen() und die Bühne öffnet sich nicht mehr.

*Quelle: docs/NAECHSTER_CHAT.md — „Offen — und wer es beantworten muss" (Verweis auf docs/OFFEN.md 2.9) · wartet auf: nichts — kann sofort gemacht werden*

### M · Rückfall auf CPU, wenn CUDA fehlt

Bei Tarja bleibt der VRAM leer, alles rechnet auf der CPU (Musikstil über onnxruntime-node, Whisper). Sie baut Docker-Dateien mit CUDA; Caspar_Ds Wunsch dazu ist ein sauberer Rückfall auf CPU, wenn CUDA fehlt — lieber langsam im Hintergrund als gar nicht.

*Quelle: docs/BACKLOG.md — „Aus Tarjas erstem Testlauf / Fremde Rechner" · wartet auf: Tarjas CUDA-Rechner zum Gegenprüfen*

### M · Sechs weitere Messkarten für den Analyzer

Die letzte Kartenzeile bleibt halb leer (26 Karten bei acht Spalten); sechs weitere würden sie genau füllen, und die Kandidaten stehen fest: Zielpegel je Plattform (Spotify, YouTube, Club, Broadcast, Streaming mit Soll-Ist und „anheben/absenken"), True Peak (4-fach überabgetastet), Clipping mit Zeitmarken, Phasenkorrelation und Balance. Alles außer True Peak rechnet billig auf dem bereits dekodierten Puffer. Nachbauen, nicht kopieren — CastoBytes Code steht unter GPL-3.0-or-later, die Verfahren selbst stammen aus EBU R128 und ITU-R BS.1770.

*Quelle: docs/BACKLOG.md — „SunoAnalyzer ... / 4 · Einbettung", Absatz „Offen" + „Funktionen aus dem CB Audio Analyzer prüfen" · wartet auf: nichts — kann sofort gemacht werden*

### M · Statusdialog für die Hintergrundarbeit

Man sieht nicht, was gerade im Hintergrund läuft. Caspar_D selbst im Thread: „ich muß wohl noch einen Statusdialog einbauen, damit man das on the fly im UI checken kann." Ein Teil ist seit 23.08. durch den Tooltip des roten Knopfes abgedeckt („Läuft gerade: … Schritt 3 von 9 · seit 8 min"), der Dialog selbst fehlt.

*Quelle: docs/BACKLOG.md — „Aus Tarjas erstem Testlauf / Sichtbares" · wartet auf: nichts — kann sofort gemacht werden*

### M · Stereo-Farbfelder auf Mitte/Seite umstellen

Caspar_Ds Mischungen sind energetisch nahezu mono, die Links-rechts-Trennung gibt optisch kaum etwas her. Statt L und R sollten M = (L+R)/2 und S = (L−R)/2 gemessen werden; S isoliert Hall und Stereobreite und ist deutlich dynamischer. Kosten: ein zusätzlicher Knoten im Audiographen und ein sechster Analyser.

*Quelle: docs/BACKLOG.md — „Mittel / Mitte/Seite für die Stereo-Farbfelder" · wartet auf: nichts — kann sofort gemacht werden*

### M · Stilgruppen-Preset im EQ aus den Cluster-Mitteln

Aus den Cluster-Mitteln der 8-Band-Profile soll ein Stilgruppen-Preset im EQ entstehen — im Plan als „Backlog seit 20.08. eingelöst" geführt und in der Offen-Liste zu Punkt 6 wiederholt. Braucht die fertigen Cluster aus library/karte.json und die vorhandenen eq-profil-Daten.

*Quelle: docs/MORGENROUTINE-PLAN.md, 3 (Anzeige) und 5 (Punkt 6, „Offen:") · wartet auf: fertige Cluster aus bin/karte.js*

### M · Stimmlage nur bei nachgewiesenem Gesang

Jedem der 64 textlosen Stücke wird eine Stimmlage zugeschrieben, durchweg „männlich" — „Wind im Wald" aus 5631 im Rauschen gemessenen Tonhöhen. Der Wächter in bin/toene.js verlangt nur mindestens 20 gemessene Tonhöhen, und die Gesangsspur enthält bei Naturklang kein Schweigen, sondern Übersprechen. Der im Dokument genannte Weg: nicht fragen, ob Tonhöhen messbar sind, sondern ob überhaupt Gesang da ist — über den Liedtext, über Sunos instrumental-Flag oder über den Pegelabstand der Gesangsspur zu den anderen.

*Quelle: docs/ERFUNDENES.md, 2 · wartet auf: Neulauf über 321 Ablagen (bin/toene.js)*

### M · Strukturbalken aus novelty-sections wiederbeleben

Der Strukturbalken war abgeklemmt, weil die selbst gerechnete Struktur unsicher war. Mit dem Feld abschnitte (Sunos novelty-sections) gibt es jetzt eine Quelle. Zu beachten: Suno rechnet auf Anfrage und antwortet beim ersten Mal {state:"running"}, erst der nächste Lauf liefert complete — für Songs, die noch auf running stehen, braucht es also einen zweiten Durchgang.

*Quelle: docs/DATENEXTRAKTION.md, Abschnitt "Drei Auskünfte, die wir seither holen" · wartet auf: einen zweiten Morgenlauf für die Songs, die noch "running" melden*

### M · Störfrequenz-Kerbe: Schritt 2 im Glockenstuhl

Schritt 1, der Detektor, ist gebaut und committed, der Befund steht in docs/TONSTUDIO.md. Schritt 2, die Kerbe im Glockenstuhl, steht dort als „in Arbeit". Der Abschnitt widerspricht sich an einer Stelle selbst („gebaut 23.08." versus „in Arbeit") — also zuerst am Code nachsehen, welcher Stand gilt, dann abschließen.

*Quelle: docs/NAECHSTER_CHAT.md — „Stand 23.08.2026 (Nacht) — Tonstudio-Session" · wartet auf: nichts — kann sofort gemacht werden*

### M · Suchfeld durchsucht keine Lyrics

Der Platzhalter im Suchfeld verspricht die Lyrics von Anfang an, durchsucht werden aber nur Titel und Stil. Die Lyrics stehen nicht in der schlanken Liste. Zwei Wege stehen zur Wahl: /api/index um ein Feld lyricsKurz erweitern, oder die Suche serverseitig machen.

*Quelle: docs/NAECHSTER_CHAT.md — „Was als Nächstes ansteht", Punkt 6 · wartet auf: nichts — kann sofort gemacht werden*

### M · Suchfeld: Lyrics wirklich durchsuchen

Der Platzhalter im Suchfeld versprach Lyrics von Anfang an, durchsucht werden aber nur Titel und Stil. Lyrics stehen nicht in der schlanken Liste — entweder lyricsKurz in /api/index aufnehmen oder serverseitig suchen.

*Quelle: docs/BACKLOG.md — „Offen seit dem 19.08.2026 / Suchfeld: Lyrics" · wartet auf: nichts — kann sofort gemacht werden*

### M · Werkstattbuch: Notizen durchsuchbar und exportierbar

Notizen je Song laufen (Cap-Marke, Karteiblatt). Offen: ein Suchfeld über die Notizen und ein Export ins Karteiblatt der Bühne.

*Quelle: docs/BACKLOG.md — „Werkstattbuch ausbauen (Notizen stehen seit 20.08.2026)" · wartet auf: nichts — kann sofort gemacht werden*

### M · Whisper in den Alltag: Nachtknopf mit Zustand im Server

Wenn --alle durch ist, rechnet Whisper nur noch neue Songs, nie mehr als zwei am Tag. Dann als Schritt in den Morgenlauf oder besser als eigener Nachtknopf, mit Zustand im Server statt nohup-Kette; nach jedem Lauf bin/whisper-abgleich.js für Songs, deren Lyrics nachträglich kamen. Caspar_D am 20.08.: „kann man, muss man aber nicht dringend robust machen. Später."

*Quelle: docs/BACKLOG.md — „Whisper in den Alltag (nach den Auffüll-Nächten)" + „Whisper für die Wort-Zeitmarken" · wartet auf: die Auffüll-Nächte (--alle) müssen erst durch sein*

### M · Zeitachse für den geprüften Störtondetektor

bin/stoerfrequenz.js ist als Verfahren richtig (feine FFT, Median über alle Rahmen, 80 % Dauer, Halbwertsbreite, Obertonreihe, Intervallprüfung), kennt aber keine Zeitabschnitte — im Glockenstuhl läuft der Block deshalb über die ganze Songlänge und nennt nur den Anteil. Was das alte Bandverfahren voraus hatte und behalten sollte, ist genau diese Zeitachse: von/bis und längster Lauf je Befund, damit man auf die Stelle springen kann. Das ist der einzige Punkt, an dem die Ablösung noch etwas schuldig bleibt.

*Quelle: docs/ANALYZER-PRUEFUNG.md, Prüfbericht 4 (Schlussabsatz) und Abschnitt 'Stand der Designsprache bis zum Spektrum' · wartet auf: nichts — kann sofort gemacht werden*

### M · Zwei billige Artefakt-Näherungen ergänzen

Im bestehenden bandVerlauf-Durchgang ließen sich zwei Kennzahlen fast kostenlos mitnehmen: die Energie oberhalb der gemessenen Höhenkante („Birdies") und der Rauschteppich als mittleres Spektrum der leisesten 5 % der Fenster. Beide zielen auf den Modellvergleich v2 → v4.5+. Echte Aliasing-Detektion ist im Dokument bewusst ausgeschlossen (forschungsnah, teuer, viele Fehltreffer an Musik) — nur auf WAV seriös.

*Quelle: docs/ANALYZER-REVIEW.md, 5 („Was fehlt", Punkt 4) · wartet auf: nichts — die Höhenkante steht seit dem 25.08.*

### M · chromaZonen/chromaTakt zusammenlegen und Goertzel-sr

chromaZonenZeichnen und chromaTaktZeichnen zeichnen dasselbe Bild aus zwei Kopien derselben Routine; sinnvoll wäre eine Zeichenfunktion, in die beide Aufrufer nur ihre Daten abbilden. Dasselbe beim Goertzel-Kern, der in goertzelKanal und als Inline-Kopie in bassVektor steht — ein sr-Parameter spart rund zehn Zeilen. Beides hängt laut Dokument am vorgehaltenen Werkzeug-Cluster (chromaTaktZeichnen bleibt Werkzeug) und lohnt erst, wenn über dessen Zukunft entschieden ist.

*Quelle: docs/ANALYZER-REVIEW.md, „Stand der Umsetzung" (weiterhin offen) und 4 · wartet auf: Entscheidung über die Zukunft des Werkzeug-Clusters (chromaTaktZeichnen)*

### M · huelle() legt die absolute Spitze je Stem nicht ab

huelle() normiert jede Stem-Spur auf ihren eigenen Spitzenwert und legt die absolute Spitze nicht ab — eine Spur mit bloßem Übersprechen sieht danach aus wie eine tragende. Belegt am Piano-Befund: Songs, deren Prompt ausdrücklich „no piano" sagt, haben die lauteste Klavierspur im Archiv (Median 99,5 %). Die absolute Spitze mit abzulegen macht die Frage überhaupt erst entscheidbar.

*Quelle: docs/ERFUNDENES.md, 4 · wartet auf: Neulauf über 321 Ablagen (Stem-Hüllkurven)*

### ? · Archiv-Export als Morgenschritt (USB/TV)

In Gruppe C steht „Archiv-Export aktualisieren (USB/TV; standardmäßig AUS)" als eigenes Kreuz. In der Beschreibung des am 21.08. gebauten Dialogs (Punkt 3 der Reihenfolge) taucht die Zeile für Lokal nur mit Katalog, Analyse, Whisper und der gedimmten „Bald:"-Zeile auf — der Export ist dort nicht genannt. Zu prüfen, ob er noch fehlt oder anders untergebracht wurde.

*Quelle: docs/MORGENROUTINE-PLAN.md, 1 (Gruppe C) · wartet auf: nichts — erst im Code nachsehen, ob der Schritt schon existiert*

### L · Anschluss bauen — zweiter Tonweg für den Übergang

Zwei Songs sollen tonhöhenfest im Tempo angenähert und im Takt eingesetzt ineinander übergehen, mit vier Fällen (Fortsetzen, Ineinander, Eintakten, Anschlagen) und einer Angleichregel statt eines Schalters (unter 4 % trägt der Neue allein, 4–8 % beide je zur Hälfte, über 8 % kein Angleich). Die Datenlage steht: Sunos schlaege liegen für alle 321 Songs als Taktraster mit Phase vor, 304 davon taktfest; bei ±4 % je Song greift es bei jedem zweiten Übergang. Was fehlt, ist ein ZWEITER Tonweg für die Überlappung — heute hängt alles an dem einen Player der Albumseite. Das ist ein Eingriff in den Tonpfad und muss vorher angesagt werden.

*Quelle: docs/BACKLOG.md — „Klangraum / Anschluss — Songs gehen ineinander über" · wartet auf: Ansage und Freigabe von Caspar_D — Eingriff in den Tonpfad*

### L · Dynamikumfang dichter sampeln (überlappende Fenster)

Der Rechenkern schneidet in nicht überlappende Blöcke: Dynamikumfang 500 ms (2 Werte/s), Lautheit 400 ms (2,5 Werte/s). Dasselbe 500-ms-Fenster alle 50 ms ausgewertet gäbe 20 Werte je Sekunde bei unveränderter Messung. Der Preis ist eine Änderung im Rechenkern, wodurch die 321 abgelegten Analysen nicht mehr zum Code passen; für den vollen Nutzen braucht es einen Neulauf über den ganzen Bestand (rund eine Stunde). Sichtbare Folge heute: Glättungsfenster unter 1 s sind beim Dynamikumfang wirkungslos und seit dem 25.08. gesperrt.

*Quelle: docs/OFFEN.md § 6.2 — Dynamikumfang und Lautheit sind grob gesampelt · wartet auf: Caspar_Ds Entscheidung, dann Neulauf über 321 Ablagen*

### L · Selbstprüfung mit Prüfsignalen für jede Messgröße

Das Muster des ganzen Dokuments lautet: was eine Selbstprüfung hat, stimmt (Lautheit gegen bin/pruefe-lautheit.js), alles andere nicht. Vorgeschlagen ist, den Weg von bin/pruefe-lautheit.js auf jede Messgröße auszudehnen — Sinus, Sägezahn, weißes und rosa Rauschen, eine bandbegrenzte Datei, eine Tonleiter, dazu Stimme allein / Stimme über Baß / Baß ohne Stimme. Sieben der zehn schweren Befunde wären beim ersten Lauf aufgefallen. Fund 12 nennt zusätzlich eine billige Invarianzprobe: derselbe Song bei zwei Abtastraten muss dieselbe Tonart ergeben.

*Quelle: docs/ANALYZER-PRUEFUNG.md, Prüfbericht 6 (Schlussabsatz), Fund 6 und Fund 12 · wartet auf: nichts — kann schrittweise begonnen werden, je Messgröße ein Signal*

### L · bin/karte.js und das Register „Karte" fertigstellen

bin/karte.js (agglomerativ/Kosinus + Silhouette, UMAP gesät, Gruppennamen, Erdung, 8 Nachbarn und Dichte je Song) und das Register „Karte" als Sternenhimmel stehen als IN ARBEIT vom 21.08.: Helligkeit und Größe aus der Nachbardichte, additive Gauß-Glut im Canvas ('lighter'), Hover zeigt Nachbarn, Klick spielt. Ausgabe library/karte.json mit songs (id, x, y auf 0–1, cluster, label, tags, conf) und clusters (label, farbe).

*Quelle: docs/MORGENROUTINE-PLAN.md, 5 (Punkt 6, IN ARBEIT) · wartet auf: nichts für den Rohbau — die Verfahrensfragen darunter aber schon*


## Idee

### S · BPM-Vertrauen ergänzen, Shimmer bei CastoByte nachfragen

Der eigene Analyzer nennt einen BPM-Wert ohne Angabe, wie sicher er ist; CB hat dafür bpm_confidence. Und bei der Shimmer-Erkennung ist unklar, was genau gemeint ist — der Text sagt ausdrücklich „nachfragen lohnt".

*Quelle: docs/BACKLOG.md — „Funktionen aus dem CB Audio Analyzer prüfen" · wartet auf: Rückfrage bei CastoByte*

### S · Hüllkurve (welle) in der Bühne benutzen

Suno liefert zu jedem Song eine Hüllkurve mit rund 1700 Werten, sie liegt bereits als welle im Katalog und wird nirgends benutzt. Naheliegend: als Fortschrittsbalken in der Bühne, oder als Grundlage einer Visualisierung, die auch ohne Web-Audio-Analyse läuft.

*Quelle: docs/BACKLOG.md — „Größer / Wellenform anzeigen" · wartet auf: nichts — kann sofort gemacht werden*

### S · Reise: Mindestabstand je Etappe

Die Klangreise springt zum nächsten noch nicht besuchten Klangnachbarn; die Etappen sind dadurch oft sehr kurz. Vorschlag: einen Mindestabstand je Etappe fordern, damit die Reise weiter springt und mehr vom Raum zeigt.

*Quelle: docs/KLANGRAUM.md, Abschnitt "Offen / Ideen" · wartet auf: nichts — kann sofort gemacht werden*

### S · Reisespuren ausdünnen, falls es je ruckelt

reiseSpuren wächst bis zum Deckel von 40 000 Punkten (rund 3 Stunden) und wird jedes Bild neu gezeichnet. Bei Bedarf per Douglas-Peucker ausdünnen oder in ein Offscreen-Bild backen, das nur bei Zoom oder Drehung neu entsteht. Bisher ist nichts aufgefallen (Stand 23.08.).

*Quelle: docs/BACKLOG.md — „Klangraum / Spur-Leistung über lange Sitzungen" · wartet auf: dass es tatsächlich ruckelt*

### S · Tempo-Sprung des Raumschiffs beim Absprung glätten

Das Transit-Tempo ist Strecke durch Restzeit; am Absprung springt deshalb das Tempo, wenn auch ohne Positionsknick. Falls es auffällt: ein kurzer Gleitübergang wie bei der Ankunft. Betrifft das Raumschiff, nicht die Musik.

*Quelle: docs/BACKLOG.md — „Klangraum / Tempo-Übergang beim Absprung" · wartet auf: dass es auffällt*

### S · Vier bekannte API-Wege noch ungenutzt

Aus den 273 gesicherten Wegen (docs/suno-api-wege.txt) sind vier ausdrücklich als "noch nicht genutzt" vermerkt: aligned_lyrics/v3 (neuer als das benutzte v2 — Zeitmarken könnten genauer werden), comments/count, clips/<id>/attribution (öffentlich: woraus ein Song entstand — Abstammung ohne Token) und clips/get_similar. Erst ansehen, was sie liefern, dann entscheiden, ob eines davon in den Morgenlauf gehört.

*Quelle: docs/DATENEXTRAKTION.md, Schluss von "Die Adreßliste der Web-App" · wartet auf: nichts — kann sofort gemacht werden*

### M · BPM-Vertrauen, Balance und EQ-Hinweise aus dem CB-Vergleich

Aus dem Vergleich mit dem CB Audio Analyzer sind drei Anzeigen offen: ein Vertrauenswert zum BPM, die Kanalbalance und EQ-Hinweise. Wichtig: Sein Code steht unter GPL — nachbauen, nicht kopieren (der GPL-Verdacht gilt inzwischen als ausgeräumt, weil CB PySide6/numpy ist und hier JavaScript steht).

*Quelle: docs/NAECHSTER_CHAT.md — „Was als Nächstes ansteht", Punkt 7 · wartet auf: nichts — kann sofort gemacht werden*

### M · Bühne partytauglich machen

Caspar_Ds Wunsch vom 17.08., noch nicht ausgearbeitet. Erst zu klären: Läuft die Bühne auf dem Mac-Bildschirm oder an Fernseher/Beamer — danach richtet sich, ob es um Skalierung oder ein eigenes Layout geht. Kandidaten: größere Schrift für Ableseabstand, Bedienelemente ausblenden, weicher Songwechsel mit Ankündigung, kräftigere Visualisierungen.

*Quelle: docs/BACKLOG.md — „Bühne / Partytauglich machen" · wartet auf: Caspar_Ds Antwort: Mac-Bildschirm oder Fernseher/Beamer*

### M · Captions automatisch entwerfen lassen

Die Caption-Anzeige steht (Cap-Marke und Fenster). Später soll Claude auf die Songs losgelassen werden: neue Captions automatisch entwerfen, dazu eine Kommentar- und Reformulier-Funktion. Caspar_D: „Nicht dringend."

*Quelle: docs/BACKLOG.md — „Captions: schreiben lassen (später, Caspar_D 20.08.2026)" · wartet auf: Caspar_D — ausdrücklich zurückgestellt*

### M · Heller Modus (Light/Dark)

KlangTresor färbt sich aus dem Cover auf dunklem Grund. Ein heller Modus müsste die Paletten neu ableiten; Cover auf Weiß sieht nach Laden aus, nicht nach Bühne. Wenn überhaupt: Systemthema lesen und nur leicht aufhellen. Im Text ausdrücklich als geringer Ertrag markiert.

*Quelle: docs/BACKLOG.md — „Light/Dark Mode" · wartet auf: nichts — aber ausdrücklich hinten angestellt*

### M · Kennlinie der Stem-Hüllkurven: dB statt Wurzel

Die sechs Stem-Kurven laufen über weite Strecken am Anschlag, weil eine Wurzelkennlinie benutzt wird, damit Leises sichtbar bleibt. Vorgeschlagen ist eine dB-Skala mit Boden bei etwa −40 dB, die Binnendynamik zeigt statt nur „spielt / spielt nicht". Der Vorschlag steht seit dem 24.08. unbeantwortet.

*Quelle: docs/OFFEN.md § 2.1 — Hüllkurven der Stems: Kennlinie · wartet auf: Caspar_Ds Entscheidung*

### M · LED-VU-Retro für den Ghettoblaster

Als „Stufe 6, wenn Lust" notiert: eine LED-Balken-VU im Retro-Stil zusätzlich zum bestehenden Blaster-LCD. Die Messkette dafür hängt schon (anzL/anzR hinter dem master, 3-Sekunden-Ringmittel, CLIP-Lampe); es wäre reine Anzeige, kein neuer Audioknoten. Ausdrücklich als Kür markiert, nicht als Auftrag.

*Quelle: BACKLOG.md · TONSTUDIO.md · wartet auf: Caspar_Ds Lust — ausdrücklich „wenn Lust"*

### M · Oberfläche auf Englisch

Rund 400 Texte in der Oberfläche. Der Weg wäre ein Wörterbuch, kein Zweig je Sprache — veranschlagt ist ein Tag. Der Text sagt: erst, wenn jemand kommt, der kein Deutsch liest.

*Quelle: docs/BACKLOG.md — „Deutsch / Englisch" · wartet auf: jemanden, der kein Deutsch liest*

### M · Steckbrief des neuen Songs im Morgenfenster

Caspar_D hat den Wert des Klangraums neu benannt: nicht die Reise, sondern "Wo landet der neue Song, was ist leer, was ist Zwilling, was sagt das Modell zum Prompt". Vorschlag im Dokument: drei Zeilen Steckbrief des neuen Songs direkt im Morgenfenster. Die Daten dafür liegen bereits vor (Nachbarn, Dichte, Gruppe, Streuung aus karte.json).

*Quelle: docs/KLANGRAUM.md, Abschnitt "Offen / Ideen" (Caspar_Ds Einschätzung 22.08.) · wartet auf: nichts — kann sofort gemacht werden*

### M · Stilgruppen-Preset im EQ aus gruppen[].profil

Jede Stilgruppe der Karte trägt in karte.json ein Profil. Daraus ließe sich im EQ eine Voreinstellung je Stilgruppe ableiten, statt sie von Hand zu setzen. Im Dokument als offen mit Verweis auf den Backlog geführt.

*Quelle: docs/KLANGRAUM.md, Abschnitt "Offen / Ideen" · wartet auf: nichts — kann sofort gemacht werden*

### M · Störfrequenz-Kerbe im Tonstudio

Eine einzelne Störfrequenz (Brumm, Resonanz, Pfeifen) automatisch erkennen statt von Hand suchen: aus den seit 19.08. je Song vorberechneten FFT-Spektrogrammen schmale, über die Zeit stehende Spitzen finden (Median-Spektrum, Peak über N dB über der Nachbarschaft, Breite unter ⅓ Oktave, Dauer über x % des Songs) und als Vorschlag anbieten — „Kerbe bei 3,1 kHz, −12 dB, Q 12", als neunte Glocke oder eigener Zweig, damit die acht Bänder unberührt bleiben. Erst die Erkennung als Liste im Studio-Fuß zeigen, dann der Knopf. Caspar_D: „führt gerade zu weit".

*Quelle: docs/BACKLOG.md — „Tonstudio — Störfrequenz-Kerbe (Caspar_D, 23.08.2026)" · wartet auf: den B-Block — Caspar_D hat es ausdrücklich danach eingeordnet*

### ? · Stereo-Farbfelder tragen bei fast monofonen Mischungen wenig

Gemessen sind Caspar_Ds Mischungen energetisch nahezu mono (Sub L 0,88 / R 0,86, Mitten 0,60 / 0,60, Seitenlage −0,006). Die Links-rechts-Trennung, auf der die Darstellung beruht, gibt optisch daher kaum etwas her; der Text verweist selbst auf den Backlog. Zu entscheiden: die Achse durch eine tragfähigere ersetzen (etwa Klangfarbe statt Seitenlage), die Aussteuerung der Seitenlage spreizen, oder den Modus so lassen.

*Quelle: docs/VISUALIZER.md — „Stereo-Farbfelder im Detail" · wartet auf: Caspar_Ds Entscheidung*

### L · Akkordfolge aus den Notenzonen ableiten

Steht je Notenzone ein stabiler Tonvorrat, ließe sich daraus der Dreiklang ableiten, und die Zone könnte ihren Namen tragen. Aus der Tonverteilung würde damit eine Akkordfolge. Vorschlag ohne Antwort.

*Quelle: docs/OFFEN.md § 2.6 — Akkordfolge aus den Notenzonen · wartet auf: Caspar_Ds Entscheidung*

### L · Flotte statt einem Schiff

Name frei wählbar, Form aus einer Liste, Statuszeile „Im Orbit um …" / „Im Transfer zu …" (letztere gibt es halb: beim Transit steht „Kurs auf X · 12 s", im Orbit bisher nichts). Als Vektor, nicht als GIF: Canvas-Pfade, Drehung in Flugrichtung, Triebwerksglut nach dem laufenden Song; zeichneSchiff hat bereits zwei Detailstufen, jede neue Form braucht beide. Rechtlich trennen — Buran, Sputnik, Apollo, Voyager, Challenger sind real und dürfen nachgezeichnet werden, Enterprise, Borg-Würfel, Todesstern, Millennium Falcon sind geschützte Designs. Vorschlag: erst Gerüst plus Rabe plus Sputnik, dann sieht man, ob die Formensprache trägt.

*Quelle: docs/BACKLOG.md — „Aus Tarjas erstem Testlauf / Wünsche" · wartet auf: Caspar_Ds Startsignal*

### L · KI-Style-Clustering nach Klang

Songs nach Klang clustern, nicht nach Styleprompts (zu viel Regieanweisung) und nicht nach Einzelwerten (verworfen). Weg 1: ein Audio-Embedding-Modell (CLAP/MERT, lokal über ONNX/ggml auch auf dem Intel-Mac) je Song ein Vektor aus dem MP3, dann HDBSCAN/UMAP-Karte im Profil, einmal über Nacht. Weg 2 als zweite Ebene: je Song eine LLM-Einschätzung des Lyrics-Tonfalls. Ehrlichkeitsregel: keine erfundenen Genre-Namen — erst Hörprobe je Cluster, dann benennt Caspar_D selbst.

*Quelle: docs/BACKLOG.md — „KI-Style-Clustering (Caspar_D, 20.08.2026: „superinteressant")" · wartet auf: Caspar_Ds Startsignal*

