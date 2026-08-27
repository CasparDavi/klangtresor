# Das KlangTresor-Tonstudio

> **Namenswechsel:** Das Projekt hieß bis zum 24.08.2026 *MySuno*. Es heißt jetzt **KlangTresor** — „Suno" ist seit dem 06.01.2026 eingetragene Marke von Suno Inc., ausdrücklich für Software zum Abspielen und Bearbeiten von Audioinhalten. Wo in Zitaten und in der Chronik noch der alte Name steht, bleibt er stehen.

Entstanden am 20.08.2026 in einer langen Sitzung mit Caspar_D. Dieses
Dokument hält fest, was gebaut ist, welche Regeln dahinterstehen und
welche Worte Caspar_D dafür gewählt hat — damit ein späterer Chat nichts
davon „verbessert".

## Öffnen

**EQ**-Knopf im Player (rechts, bei Zufall/Schleife). Das Panel
schwebt 10 px über der Playleiste, voll deckend (97 % Deckung wirkte
wie ein Grauschleier), Rand in der Akzentfarbe — die sich wie alles
aus dem Cover des laufenden Songs färbt. Überschrift: KlangTresor
Tonstudio. Drei Registerlaschen im Stil der Albumseite (unterstrichene
Reiter): **Equalizer · Ghettoblaster · Kompressor**. Oben global:
A/B-Kippschalter und Quelle.

## Der Tonpfad (web/index.html, analyseStarten)

    audio (Tempo = playbackRate am Element)
    quelle ──► Analyser L/R (ROH — der Analyzer ist ein Rohdatentool,
    │          er misst das Werk, nie die Filter. Caspar_Ds Regel.)
    └─► 8×Biquad-EQ ─► Solo-Bank (8 Zweige ∥ Direktpfad)
          ─► [M/S-Breite, wenn „vor dem Kompressor"]
          ─► Gradation-Worklet (K-Bewertung, Spitzen-Hüllkurve im Limiter-Fall,
              Lookahead 1 Block, Rampe je Sample)
          ─► [M/S-Breite sonst] ─► master ─► Lautsprecher
              Worklet-Ausgang ─► Hall (Convolver) ─► master
              Worklet-Ausgang ─► Echo (Delay+Feedback) ─► master
    master ─► Anzeige-Analyser (Blaster-LCD) und anzL/anzR (Ausgang Spitze, CLIP)
    (Stand 23.08.2026)

A/B („Original") stellt alle Eingriffe auf neutral, ohne die Regler zu
bewegen; das ganze Panel wird dabei grau und stumm, nur der Schalter
bleibt. Standard ist „EQ Output". Kurzer Klick kippt, Alt-Klick öffnet
die Liste.

Quelle: **WAV ist Standard**, wo es liegt (Caspar_Ds Ursprungswunsch);
Dropdown zeigt die Dateigröße, ohne WAV gesperrt mit Begründung.

## Equalizer-Register

- **Die lebende Lehrbuchabbildung** (Caspar_Ds Wort, 20.08.2026): KEINE
  Slider mehr — ein einziges editierbares Diagramm (540×360, 2 hoch :
  3 breit, linksbündig), die roten Punkte SIND die Regler: vertikal
  ziehen (Raster 0,5 dB), Doppelklick = Band auf 0, Wert erscheint am
  Punkt. Punktgröße wie ein Slider-Daumen (r 9 + Halo), gut zu
  treffen. Die Legende wohnt rechts daneben, rechtsbündig, unten auf
  der x-Achsenlinie. Maße zentral in EQ_MASSE.
- **8 Bänder = die Messbänder des Analyse-Kerns** (20-40-80-160-315-
  630-1250-2500-20000 Hz). Bewusst nicht 10 ISO-Bänder: Messung,
  Automatik und Regler sprechen dieselbe Achse, sonst lügen die Kurven.
  Beschriftet sind die **Trennfrequenzen** (40 · 80 · … · 2,5k Hz);
  Filter-Mitten nur im parametrischen Modus (Eingabezeile unter dem
  Diagramm).
- **Gain-Raum**: ±12 dB. Die Skala trägt **Faktoren**: +6 dB = ×2
  Amplitude, −12 = ×¼ (Caspar_Ds Wunsch).
- **„Analyse blockig, Filterung glockig"** (Caspar_Ds Formel, 20.08.2026):
  Die Decke ist eine Treppe (bandweise Messung), die farbige Kurve die
  ECHTE Summenantwort der runden Biquad-Filter, die Punkte die
  Einstellung je Band. Eine Regler-TREPPE gab es kurz und flog wieder
  raus — „wer weiß, wie ein EQ funktioniert, bestellt keine Treppe".
  Die Überschreitungsfläche misst das Ergebnis gegen die Deckenstufen. **Verifiziert (20.08.2026):** Impuls durch eine echte
  Achterkette, unabhängige Fourier-Messung — gezeichnete vs. gemessene
  Kurve max. 0,01 dB Abweichung; die Güte-Griffe liegen exakt auf den
  Halb-Gain-Frequenzen der Cookbook-Definition (3,00 von 6 dB
  gemessen). Quellen: Audio EQ Cookbook (W3C), Rane/Bohn zu
  Constant-Q-Grafik-EQs ("what you see is not what you get").
- **Die Decke**: gestrichelt je Band der geschätzte Spielraum —
  Decke_i = (0 − TruePeak) + (lautestes Band − Band_i). Das ist das
  gespiegelte Songprofil. Läuft die Reglerkurve darüber, füllt sich
  die Fläche in Akzent. Eine −14-LUFS-Linie wurde bewusst NICHT
  eingezeichnet (Bandpegel ≠ integrierte Lautheit — wäre Deko mit
  falscher Bedeutung).
- **Legende in Caspar_Ds Worten** (nicht umformulieren!): „Farbig:
  Frequenzprofil nach Regelung · Grau: Maximum der Dynamik …
  · Gefüllt: … übersteuert das Signal (Verzerrungen, Überschreien)."
  **Überschreien** ist Caspar_Ds bewusst umgangssprachlicher Begriff fürs
  Verlassen der Dynamik; Übersteuern = Fachwort, Verzerren = Kompromiss.
  Der Erklärtext darunter ERGÄNZT die Legende (wiederholt sie nicht)
  und endet mit dem songspezifischen Spielraum-Satz (engstes/weitestes
  Band, live berechnet).
- **„Kein Übersteuern"-Pille** (hieß kurz „Decke halten" — „was
  eine Decke ist, weiß keiner"): der Auto-Modus —
  beim Einschalten, beim Ziehen und bei Presets wird jedes Band auf
  die Decke dieses Songs gedeckelt (global gemerkt,
  mysuno-eq-deckel). Der Magnet rastet, der Deckel klemmt.
- **Presets**: Neutral · An die Sammlung / An seine Playlist
  angleichen (halbe Stärke Richtung Zielprofil, ±6 dB Deckel) ·
  Referenzsong („Referenz = dieser Song" merkt den laufenden) ·
  Klassiker (Loudness, Bass+, Höhen+, Stimme frei, Nacht).
  Stilgruppen-Preset wartet auf das KI-Clustering.
- **Parametrisch**-Pille: je Band Frequenz (alle) und Güte (die sechs
  Glocken), live am Filter, global gemerkt (Reglereigenschaft, nicht
  Songkorrektur).
- **Gains je Song** in library/eq.json — EINE Datei für alle Songs
  (exFAT-Regel), bewusst getrennt von den erzeugten Analysedaten
  (die würden beim Neurechnen überschreiben). Datei wurde am
  20.08.2026 von Test-Rückständen geleert — was drinsteht, ist Caspar_Ds.

## Der Glockenstuhl (Modus im Equalizer-Register, 20.08.2026)

KEIN eigenes Register — Caspar_Ds Einwand: „die anderen Register setzen
was drauf, dieser hier ersetzt". Und: „es kann nur einen aktiven
geben". Darum eine **Modus-Dropdown** ganz links in der Kopfzeile
(abgesetzt mit Lücke, Kurzklick kippt wie beim A/B):
**Equalizer ↔ Glockenstuhl** (mysuno-eq-ansicht; hieß kurz
„Frequenzcontroller“ und „Glockenspiel EQ“ — am Ende der Nacht
fiel die Wahl endgültig auf den GLOCKENSTUHL, das Traggerüst, in dem
die Glocken hängen; fachlich ein vollparametrischer EQ). Der Modus
GILT exklusiv: Equalizer = die Filter laufen auf den acht
Standardbändern; Glockenspiel EQ = die freien Frequenzen/Güten
(bleiben gemerkt und kehren mit dem Modus zurück) —
eqFrequenzenAnwenden schaltet die echten Biquads beim Wechsel um.
Der Frequenzcontroller füllt die volle Panelbreite (918×400,
log-Achse 20 Hz-20 kHz), gleiche Gains je Song. Bausteine (Stand nach der langen Nacht 20./21.08. — Caspar_D: „wir
haben die besten EQs ever gebaut"):
- **Echte Filterantworten**: stiller OfflineAudioContext-Rechner
  (eqAntworten) mit denselben acht Biquads — gezeichnet wird per
  getFrequencyResponse, die Glocken SIND die gehörten. Aktive Glocke
  gestrichelt in Akzent, Nachbarn grau, die Summe dick in Akzent.
- **Ziehen**: vertikal Gain (0,5-Raster, Decken-Magnet, „Kein
  Übersteuern"-Deckel — alles wie drüben, Decke je Messband der
  aktuellen Mittenfrequenz); horizontal Mittenfrequenz (Magnet auf
  der Standardmitte, ±0,08 Oktaven); weiße **Gütengriffe** auf den
  −3-dB-Schultern (eqSchultern), auch Scrollrad; Doppelklick = 0,
  Alt-Doppelklick = Frequenz+Güte zurück auf Standard.
- **Decke als Treppe** (je Messband eine Stufe) mit Einrast-Ringen an
  den Reglerfrequenzen.
- **KEIN Zappelspektrometer**: hinter der Kurve liegt still das
  laufende Spektrum (anzL, getFloatFrequencyData), je Bin exponentiell
  gemittelt über das einstellbare Intervall („Anzeige-Mittelung",
  0,5-10 s, Standard 3 s, mysuno-par-mittel) — Kontext, keine Skala.
- Die Frequenz/Güte-Zahlenfelder (früher „Parametrisch"-Pille im
  Equalizer) wohnen jetzt hier, immer sichtbar. Die Pille ist weg.
- studioZeichnen ruft parZeichnen immer mit auf — beide Sichten
  bleiben synchron, gleicher Zustand, zwei Abbildungen.
- Die Frequenz/Güte-Zahlenfelder wohnen im Frequenzbild.
- Ein Sperr-Kasten (Bandansicht invalidiert) lebte kurz und wich der
  saubereren Modus-Exklusivität: nichts kann mehr lügen, weil immer
  nur ein Modus die Filter stellt.

## Ghettoblaster-Register

Gedämpftes Blech-Gehäuse (max. 5 % Grau!) mit Lampenleiste: POWER
(grün, atmet, respektiert prefers-reduced-motion) · WIDE · HALL ·
ECHO · TEMPO · MEGA BASS — Lampen zünden nur, wenn der Effekt wirklich
eingreift, Halo in Akzent. Regler: Stereo-Breite (M/S-Matrix 0-200 %),
Hall (nur DAZU — Hall entfernen kann Web Audio nicht, ehrlich
bleiben), Echo + Echozeit (Feedback gedeckelt 0,85), Tempo 50-200 %
mit „Tonhöhe halten"-**Leuchtpille** (Checkboxen gibt es im Haus
nicht). Tempo wird bewusst NICHT gemerkt (vergessenes 150 % wäre ein
Rätsel) und warnt direkt am Regler: wirkt auch auf Analyser/Karaoke.
MEGA BASS = Bass+-Preset als leuchtender Spaßknopf.

**Blaster-LCD** (nach Caspar_Ds Skizze, mehrfach verfeinert): Grund =
Akzentfarbe entsättigt + aufgehellt, dann auf 66 % gedimmt; 12 feine
Säulen (Momentan-Zellen dunkelgrau, Topblock schwarz, zappelt live);
je Säule zwei tiefschwarze L/R-Striche über volle Säulenbreite, Höhe
1/10 Block — das **echte 3-Sekunden-Ringmittel** je Kanal (zappelt
nicht); Buchstaben in Avenir Next Condensed dicht dran (Arial Narrow
ist auf dem Mac nicht installiert und fiel still auf die breite
Systemschrift zurück!). Seitenrand 26 px (mehr Luft außen als zwischen
Säulen), unten Beschriftungslane mit den Trennfrequenzen, letzte trägt
„Hz", hauchzarte Separatorlinien entspringen an den Zahlen.
Läuft nur bei offener Lasche.

## Kompressor-Register (hieß bis 20.08. „Professionell")

**Die Gradationskurve** — Caspar_Ds Grenzüberschreitung: die Tonwertkurve
der Fotografie, angewandt auf Lautheit. Große frei ziehbare Kennlinie
(Punkt ziehen / Klick setzt / Doppelklick entfernt, Endpunkte nur
vertikal), weißer Ring = Arbeitspunkt (wo die Hüllkurve gerade
steht). Über der Diagonale wird angehoben (Schatten aufziehen!),
darunter abgesenkt. DSP: eigenes AudioWorklet
(web/fremd/gradation-worklet.js) — Hüllkurve in dB mit Attack/Release
verfolgen, 61-Stützen-Tabelle nachschlagen, Verstärkung langsam
regeln, nie an der einzelnen Schwingung. Der klassische Kompressor
(Schwelle/Verhältnis/Aufholen + Limiter-Pille) ist nur noch der
**Startform-Geber**: Reglerbewegung erzeugt die Knick-Kurve und hebt
den Frei-Modus auf; jede Berührung der Kurve macht sie wieder frei.
Kann auch Leises anheben — das kann kein DynamicsCompressor. Kurve
global gemerkt (mysuno-grad-punkte). Dazu: träge Regelungs-Anzeige,
Messwerte-Zeile, absolutes Bandprofil, Erklärtext mit der
Gamma-Brücke („Der Kompressor ist eine Gammakorrektur der Lautheit —
mit Gedächtnis"; Attack/Release = Adaptionszeiten einer
Belichtungsautomatik; LUFS ↔ L*, dB ↔ Blendenstufen).

## Hausregeln, in dieser Sitzung erarbeitet

**Das vollständige, gepflegte Regelwerk steht in docs/HAUSREGELN.md —
dort zuerst lesen.** Hier nur die Urfassung:

- Kein „dein/mein" in den Texten — „das Zeug gehört dem Song".
- Fußnoten nur dort, wo ihr Gegenstand sichtbar ist.
- Schließen-Knöpfe: rund mit Rand, Flex-zentriertes ×, hausweit.
- Chips/Pillen: gewählt = nur Rand, keine Füllung.
- Datenpunkte immer kreisförmig, und die Kurve STÖSST NICHT an den
  Punkt — kleine Lücke davor (EQ: gekürzte Segmente; Kompressor:
  SVG-Maske um die Kontrollpunkte). Linien lieber durchgehend als
  gestrichelt — „Tufte sagt, Komplexität minimal halten".
- Alignment-Lehren (teuer bezahlt): (1) Inline-Spans als Tick-Träger
  erben Zeilenhöhe → Ticks verrutschen; (2) SVG ohne
  preserveAspectRatio="none" + viewBox ≠ Renderbreite skaliert
  uniform und verschiebt ALLE Linien. Bei Layoutarbeit im Studio
  nachmessen statt glauben. (3) SVG-<mask> via innerHTML versagt,
  wenn das erste Zeichnen im Verborgenen passiert — Freizonen darum
  als Halo-Kreise in Panelfarbe stanzen, nie als Maske.

## Offen (Stand 23.08.2026, siehe auch BACKLOG)

- **Störfrequenz-Kerbe** (nächstes Thema): stehende schmale Spitzen aus
  den vorberechneten Spektren erkennen, als Vorschlag anbieten, Notch als
  neunte Glocke — BACKLOG „Tonstudio — Störfrequenz-Kerbe".
- LED-VU-Retro (Stufe 6, wenn Lust) · Demucs-Stems für echtes „Stimme
  weg" (L−R-Trick verworfen, DemucsServer liegt in Entwicklung/) ·
  Bounce nur falls Caspar_D je will (Suno-WAV-Originale sind TABU).
- Echo im Takt: bewusst nicht (BPM-Messung nicht vertraut).
Erledigt seit dem 20.08.: Stilgruppen-Preset, Kompressor-Ziel (Deckungs-
Rückmeldung), Bedienphilosophie (zwei Werkzeuge), Limiter ehrlich, Hall
physikalischer, Spotlight-Dimmung raus.

## Nacht-Nachtrag 20./21.08.2026 (Glockenspiel-Feinschliff)

Stapelbild: Verlaufsschichten (Außenkante intensiv → Nulllinie
dunkel, unten gespiegelt), schwarze Haarlinien auf allen Kanten =
auch die Zwischenresultierenden (Filter für Filter aufgebaut),
aktive Glocke im helleren Verlauf (95→20%). Einzel-Glocken: alle als
Flächen mit 1/4-Deckung, Überlappung addiert sichtbar. Summenkurve in
der ZWEITEN Akzentfarbe (Akzent auf Akzent war unsichtbar).
NaN-Lehre: Float64Array.map presst Pfadtexte zu NaN — die Summenkurve
war deshalb lange unsichtbar; Sichtbarkeit beweist man mit Augen
(Caspar_Ds Screenshot), nicht mit querySelector. Werte-Tupel farbcodiert
(Hz weiß, dB Akzent, Q grau) und untereinander. Legende zweispaltig
(Bedienung links 31%, Zeichenerklärung rechts), Wörter tragen ihre
eigene Farbe. Anzeige-Mittelung mit Tooltip erklärt. Referenz-Knopf
mit × und Klartext. Alles-Schieber neben beiden Diagrammen (±6,
Differenz-Semantik ohne Federn, Klemme und Deckel greifen).

## Stufen-Schalter und Solo (21.08.2026, tiefe Nacht)

- **Drei Pillen im Studio-Kopf** (EQ · Effekte · Kompressor): jede
  Stufe einzeln hörbar/stumm, Einstellungen bleiben; flüchtig,
  Standard an. A/B „Original" bleibt der Über-Schalter. Wirkung über
  eqGainWirk (EQ), stumm-Flag in studioEffekte (Breite/Hall/Echo/
  Tempo + Lampen), neutral-Flag in gradSenden (Kompressor). Die
  LCD-Analyser hängen am master — alle drei Stufen wirken aufs Bild.
- **Solo im Glockenstuhl**: leere Kreise über den Frequenz/Güte-
  Spalten; Klick = dicker Innenpunkt, NUR dieses Band spielt;
  „Invers"-Pille daneben dreht es um (alle außer diesem). Der Punkt
  markiert immer, was SPIELT. Flüchtig, eqGains bleibt unangetastet
  (eqGainWirk rechnet Solo, A/B und EQ-Schalter zusammen); Kurven
  und Punkte zeigen die Wirkung ehrlich.
- Ghettoblaster-Politur: LCD 210 hoch mit Innenatem (Kopf 26, Fuß
  16, Lane 30, Zahlen 12px an der Säulenbasis), MEGA BASS quadratisch
  über drei Reglerzeilen (zweizeilig beschriftet), Regler-Grid,
  Tempo/Breite als Zustands-Slider ohne Füllbalken, Blaster-Fußnote.

## Das Diptychon (21.08.2026, tiefe Nacht II)

Die Kompressor-Lasche zeigt die EINE Kurve jetzt als zwei Quadrate:
links „Wie im Grafikprogramm" (linear, Amplitude 0-1) mit den
Grafik-Startformen Gamma / S-Kurve / Schwarzpunkt / Weißpunkt; rechts
„Wie im Studio" (doppelt logarithmisch, dB). Ein Zeichner, zwei
Abbildungen (kompKurveZeichnen, modus 'db'/'lin'); Ziehen in beiden
Bildern (gradZiehenAuf mit Mapping). Im linearen Bild wird die
dB-Gerade zur Gammakurve — die Grenzüberschreitung ist jetzt sichtbar
statt behauptet. An der AUSGANGSachse: Richtwert-Marken (Voll,
Streaming −14; Songwerte Spitze/≈Lautheit in Messgrau) mit
Label-Kollisionsschutz. Im Plot das graue Gebirge: das
**Lautheitshistogramm** („wie laut ist wieviel Prozent des Liedes"),
vorgerechnet in bin/eq-profil.js (hists in eq-profil.json, 2-dB-Bins
aus der stereo_curve-Energie), Morgenlauf-Schritt „Klangprofil und
Lautheitshistogramm nachziehen". Auch der Analyzer hat die Karte
(lufshist-canvas, aus der LUFS-Zeitreihe). Das Bandprofil ist aus der
Lasche gefallen (Fremdkörper — lebt als Decke im EQ). /api/eq-profil
wird mit cache:no-store geholt (der HTTP-Cache hielt die Datei ohne
hists fest).

## Nacht-Nachtrag 21.08., Teil III (das Diptychon reift)

- **Achsen-Semantik** (Caspar_Ds Einwand: „was heute am Song los ist, ist
  das Input-Signal"): Songwerte (Spitze heute, ≈ Lautheit heute) sind
  STÄBE an der Eingangsachse, mitten im Histogramm-Gebirge; die
  ZIELE (Voll — Überschreien, Streaming-Richtwert −14) sind Marken an
  der Ausgangsachse.
- **Projektionsgeraden** (Caspar_Ds Idee): angedeutete Punktlinien vom
  Stab hoch zur Kurve, abgeknickt zur Ausgangsachse, grauer
  Endstrich dort. Sie wandern beim Ziehen mit — man bringt sie mit
  den Zielmarken zur Deckung. Das Mathebuch-Ablesediagramm, lebendig.
- **Volle Breite**: zwei Bilder je 447×280, darunter je ihre
  Parameter — links die Grafik-Startformen (Gamma / S-Kurve /
  Schwarzpunkt / Weißpunkt, zweispaltig), rechts das klassische
  Kompressor-Panel (zweispaltig). Erklärung dreispaltig, gestrafft.
- **Lautheitshistogramm überall**: vorgerechnet in bin/eq-profil.js
  (hists, 2-dB-Bins aus der stereo_curve-Energie), Morgenlauf-Schritt
  „Klangprofil und Lautheitshistogramm nachziehen", Analyzer-Karte
  „Lautheitshistogramm" (aus der LUFS-Zeitreihe, lufshist-canvas).
  /api/eq-profil wird mit cache:no-store geholt (HTTP-Cache-Falle).

## ERLEDIGT 23.08.: Wo genau ist das Ziel? (Option b gebaut — Deckungs-Rückmeldung, s. u.)

Caspar_D: „die Richtung ist gut, aber ich bin noch nicht sicher, wo
genau das Ziel ist." Diskussionsstand — die Lasche bedient drei
Ziele: (1) Verstehen (erfüllt: Diptychon, Gamma-Brücke,
Projektionen); (2) ein messbares Ziel treffen — das unausgesprochene
Spiel lautet: „Bring die Lautheits-Projektion auf den
Streaming-Richtwert und halte die Spitzen-Projektion unter Voll";
(3) Geschmack (braucht kein Ziel). Zwei Bauoptionen für (2), beide
unentschieden:
a) **Ziel-Knopf** „Auf Streaming-Ziel einrichten": Startform mit
   Aufholen = Ziel − Lautheit plus weichem Deckel unter Voll
   (Schwester von „An die Sammlung angleichen").
b) **Deckungs-Rückmeldung**: Zielmarken wechseln auf Akzent, wenn
   die Lautheits-Projektion im ±1-dB-Fenster liegt und die Spitze
   unter Voll bleibt — der Song zeigt, das Werkzeug zwingt nicht.
Caspar_D schläft darüber. Nichts davon ist gebaut.

## Nachtstand Whisper (beim Zubettgehen)

Der --alle-Durchgang lief bei Song ~120/253 (≈1× Echtzeit, Lyrics-
Abgleich greift, z. B. 208/193 Wörter). Die Ergebnisse webt der
nächste Morgenlauf (aufbereiten) automatisch ein — bewusst NICHT
nachts automatisch in den Katalog geschrieben.


## Preset „An seine Stilgruppe angleichen" (22.08.2026)
Neu unter „Aus den Messdaten". Ziel = 8-Band-Mittel der Stilgruppe des
Songs aus dem Klangraum (karte.json, Feld `profil`, gerechnet von
bin/karte.js aus eq-profil.json). Gleiche Mechanik wie „Sammlung": Gains
= (Ziel − Songprofil)/2, ±6 dB, „Decke halten" gilt. Der Klangraum wird
bei Bedarf nachgeladen; ohne Klangraum/Profil nur ein Hinweis. Über der
EQ-Legende steht die Gruppe („Metal · Rock — energisch (106 Songs)").
Kein neuer Audioknoten.

## Review-Runde (22.08.2026 abends) — A: Unstimmigkeiten
A1 **Flüchtiger Zustand sichtbar.** `studioAuf` setzte A/B beim Öffnen
hart auf „EQ Output" (Klangsprung, wenn man mit „Original" geschlossen
hatte) → jetzt `abSetzen(eqAus)`. `studioFluechtig()` ist die eine
Wahrheitsquelle für das, was nicht je Song gemerkt wird (Original, Solo,
stumme Stufe, Tempo ≠ 100); `studioMarke()` setzt dafür eine Lampe am
EQ-Knopf im Player (Akzentpunkt, Tooltip nennt es: „wirkt gerade: …").
Gemerkte Gains zählen bewusst nicht — sonst leuchtete der Knopf immer.
A2 **Preset-Anzeige aus dem Ist-Zustand.** `eqPresetAnzeigen(gewaehlt)`
ist die eine Stelle, die Dropdown, `megaBassAn` und die Stilgruppen-Zeile
aus den Gains ableitet (alle 0 → Neutral, exakt ein Klassiker → dieser,
sonst Frei; beim Setzen eines Messdaten-Presets gilt das gewählte).
Aufrufe: Songwechsel, studioPreset (nach dem Deckel), Ziehen,
Doppelklick, Gesamtregler; MEGA BASS ruft nur noch studioPreset. Folge,
bewusst: Hat „Decke halten" ein Klassiker-Preset gekappt, zeigt der
nächste Songwechsel „Frei" — die Gains sind dann nicht mehr das Preset.
A3 **Messdaten-Presets gesperrt mit Begründung** (`studioPresetsPruefen`,
Muster der WAV-Quelle): „Wie der Referenzsong — noch keine Referenz
gemerkt", „An seine Stilgruppe angleichen — Song noch nicht vermessen",
„Album ohne genug Profile" usw. Der Fehlerpfad im Preset kann dadurch
praktisch nicht mehr eintreten; der Klangraum wird beim Öffnen des
Studios mitgeladen.
A4 **Glocken-Rechner mit der Abtastrate des Hörpfads.** `eqAntworten`
legte den stillen Rechner fest mit 44,1 kHz an; der Hörkontext nimmt die
Geräterate (oft 48 kHz). Jetzt folgt der Rechner `hörer.ctx.sampleRate`
und baut sich neu, wenn sie sich ändert — die gezeichnete Kurve ist
wieder exakt die gehörte.
A5 **Solo kennt jetzt den Modus.** Im Equalizer-Modus spielt ein Solo das
**Messband** (Hochpass an der unteren, Tiefpass an der oberen
Trennfrequenz, je 12 dB/Okt, Q 0,707; Ränder nur eine Kante); im
Glockenstuhl die **Glocke** (Bandpass auf Mitte + Güte). Vorher nahm das
Solo in beiden Modi Glockenstuhl-Mitte und -Güte — im EQ-Modus also
nicht das Messband. Der Moduswechsel zieht das Solo mit.

## Review-Runde — B: Kompressor ehrlich gemacht (23.08.2026)
Tonpfad-Eingriff, vorher angesagt. Nur das Gradation-Worklet und eine
Messung am master; EQ, Breite, Hall, Echo, Tempo unverändert.
- **K-Bewertung** (BS.1770: Shelf +4 dB ab 1,68 kHz, Hochpass 38 Hz,
  Koeffizienten für die Abtastrate gerechnet, gegen die Referenzwerte bei
  48 kHz geprüft) vor der Messung; Pegel = −0,691 + 10·log10 der
  Kanalsumme → die Hüllkurve spricht **LUFS**, der Arbeitspunkt-Ring liegt
  auf derselben Achse wie die Song-Stäbe und die −14-Marke. Dazu
  `lm` = 400-ms-Momentanlautheit in der Rückmeldung.
- **Spitzen-Hüllkurve**: ist die Kennlinie oben flach (Dach − Schulter
  < 1 dB = Limiter-Form), regelt max(Lautheit, Spitze); letzte Sicherheit
  nur dann: harte Kappe am Tabellendach. Geprüft: 0-dBFS-Sinus mit Dach
  −6 dB → −6,14 dB; live: Dach −46 → Ausgang −46,0 dBFS.
- **Lookahead** ein Block (128 Samples, 2,7 ms): Ausgabe um einen Block
  verzögert, Verstärkung aus dem nächsten Block — steht vor der Spitze.
- **Rampe je Sample** statt Blocktreppe; die feste 0,3-Glättung ist weg,
  Attack/Release wirken direkt („3 ms" heißt 3 ms).
- **Spitzenprojektion ehrlich**: „Spitze heute" bekommt den Kurvengewinn
  bei der Lautheit (nicht tabWert(Spitze)); über Voll wird gefüllt in
  Akzent markiert („Spitze 1,3 dB über Voll").
- **CLIP-Lampe + „Ausgang Spitze"**: Sample-Spitze an den Anzeige-
  Analysern hinter dem master, 100-ms-Takt, Lampe mit 500 ms Haltezeit,
  Wert in der Messwerte-Zeile (gehört, nicht vorberechnet).
- **B10 Deckungs-Rückmeldung** (Option b): `lufsAus = tabWert(lufs)`;
  liegt die Projektion im ±1-dB-Fenster einer Zielmarke, wird die Marke
  Akzent und nennt den Abstand („Streaming-Richtwert · +1,0 dB"). Dritte
  Marke „≈ Stilgruppe (−13,1)" aus karte.json (erdung.lufs), nur wenn sie
  nicht mit −14 zusammenfällt. `stilgruppeVon(id)` ist die gemeinsame
  Gruppen-Suche (auch im Preset).
- **Layout**: Der Studio-Kasten deckelt auf die Fensterhöhe und rollt
  innen, Kopf (A/B, Quelle, Stufen) bleibt sticky — bei 1300×1000 war
  der Kopf abgeschnitten. „Schwelle … dB" brach in eine zweite
  Rasterzeile um → Einheit im Wert.

## ERLEDIGT 23.08.: Bedienphilosophie der Gradationskurve (zwei Werkzeuge gebaut, s. u.)

**Anlass (Caspar_D):** „Die multiplen Knoten und Gamma beißen sich — entweder
Gamma oder multiple Knoten. Sigmoidal geht auch nicht." Und: Wie macht
es HAECKEL (Caspar_Ds Bildanalyse-App), und was lässt sich übernehmen?

**Befund HAECKEL** (haeckel.html: `levJS`, `drawHist`, `histWire`,
Anzeige-Flyout „Helligkeit"/„Deckkraft"):
- Schwarz-/Weißpunkt = zwei Dreiecke UNTER dem Histogramm, direkt
  ziehbar (Pointer greift den näheren Griff); oben zwei Kreise für die
  Deckkraft-Grenzen.
- Kurvenform **exklusiv**: Aus (linear — „keine Erfindung") · Gamma ·
  Sigmoidal, dazu EIN Regler „Tone" −1…+1: Gamma = 4^tone (¼…4),
  Sigmoid-Steilheit k = 10·tone, negativ = umgekehrtes S; normiert auf
  0/1 an den Enden.
- Keine freien Knoten. Histogramm: Roh grau, Ergebnis in Sichtfarbe,
  additiv; Kurve darüber; Achsen in echten Einheiten; Presets über
  Perzentile; „Linear zurücksetzen".

**Übertragung auf Lautheit** (Vorschlag, nicht gebaut):
| HAECKEL | Kompressor |
|---|---|
| Schwarzpunkt (Eingang) | Boden: darunter = Stille (Gate-Grenze) |
| Weißpunkt (Eingang) | Decke: darüber → Voll = der Limiter (statt Pille) |
| Gamma < 1 | Leises anheben = Kompression; > 1 = Expansion |
| Sigmoid + / − | Mitten spreizen (Expander) / stauchen (weicher Kompressor) |
| Tone-Regler | ein Regler −1…+1 |
| Ergebnis-Histogramm | Projektion der Song-Lautheit (Stäbe + Marken, vorhanden) |
Dazu als vierte Form `Kompressor` (Schwelle + Verhältnis, der Knick),
exklusiv. Freie Knoten und die vier Grafik-Slider fielen weg;
Attack/Release/Aufholen blieben („Gedächtnis", kein Foto-Gegenstück).
Hörbar ändert sich nichts an der Physik (Worklet bekommt weiter eine
61er-Tabelle); gespeicherte `mysuno-grad-punkte` würden verworfen oder in
die nächste Form übersetzt.

**Caspar_Ds Alternative:** wie bei Equalizer/Glockenstuhl **zwei exklusive
Modi** in der Lasche: (1) **Kompressor** — die klassische Knickkurve
(Schwelle, Verhältnis, Knie, Aufholen, Limiter), (2) **Gradations-
kompressor** — „wie ein Grafiktyp am Ton schraubt" (HAECKEL-Bedienung:
Schwarz-/Weißpunkt, Gamma | Sigmoidal, Tone). Ein Modus gilt, die Werte
des anderen bleiben gemerkt.

**Stand:** Caspar_D ist unschlüssig („oder ist das insgesamt doof"). Nichts
gebaut; heute gebaut wurden nur Block A (A1–A5), Block B (Worklet ehrlich:
K-Bewertung, Spitzen-Hüllkurve, Lookahead, Rampe; Spitzenprojektion;
CLIP/Ausgang Spitze) und B10 (Deckungs-Rückmeldung, Gruppenmarke) sowie
zwei Layout-Punkte. Die Entscheidung über die Bedienphilosophie kommt
vor jedem weiteren Umbau der Lasche.

## Kompressor-Lasche: zwei Werkzeuge, exklusiv (23.08.2026, gebaut)
Caspar_Ds Entscheidung: „genauso alternativ wie Equalizer und Glockenstuhl —
der Vergleich beider Kurven ist wichtig, aber nur im
Gradationskompressor." Dropdown `#kompmodus` (echte Dropdown wie
`#eqmodus`), gemerkt in `mysuno-komp-modus`.
- **Kompressor** (klassisch): EIN Bild (dB) links, rechts der Reglerkasten
  (Schwelle, Verhältnis, Attack, Release, Aufholen, Limiter-Pille); der
  Knickpunkt als runder Griff mit Halo. Tabelle = `gradKnick()`.
- **Gradationskompressor**: Diptychon (linear · dB). Bedienung wie
  HAECKEL (`levJS`): **Schwarz-/Weißpunkt** als Dreiecke unter dem
  Histogramm (Eingangsachse), in beiden Bildern ziehbar (Pointer greift
  den näheren, Doppelklick = −60/0); **Kurve** Aus | Gamma | Sigmoidal
  als Pillen; **Tone** ein Regler −1…+1 (Gamma = 4^tone, Sigmoid k =
  10·tone, negativ = umgekehrtes S, an den Enden normiert — `gradLev`).
  Ausgang = −60 + 60·lev(t), t = normierter Eingang zwischen Schwarz und
  Weiß: unter Schwarz Stille, über Weiß Voll = der Limiter des Grafikers
  (das Worklet erkennt die flache Schulter und regelt die Spitze).
  Regler-Kasten heißt hier „Gedächtnis": nur Attack/Release.
- **Freie Knoten sind weg** („beißen sich mit Gamma"); `mysuno-grad-
  punkte`/`-frei` werden beim Laden entfernt. „Auf Diagonale
  zurücksetzen" setzt das aktive Werkzeug; das andere bleibt gemerkt
  (`mysuno-grad-form/-tone/-sw/-ws`, `mysuno-komp-*`).
- Erklärtext je Modus (`.nurklassisch` / `.nurgradation`); die
  Gamma-Brücke (Caspar_Ds Text) bleibt in beiden.
- **Ziehen im Bild auch klassisch** (Caspar_D: „die Cursoränderung
  suggeriert, dass ich was machen kann — ich will das auch"): der
  Knickpunkt setzt Schwelle (x) und Aufholen (y − x), der Endpunkt rechts
  setzt das Verhältnis (seine Höhe bei 0 dB Eingang); beide als runde
  Griffe mit Halo, die Regler laufen mit. Doppelklick im Bild = aktives
  Werkzeug auf die Diagonale. Geprüft: Knick auf (−24, −21) → Schwelle
  −24, Aufholen +3; Ende auf −15 → Verhältnis 4:1.
- Benennung (Caspar_D): Schwarz-/Weißpunkt heißen am Ton **Leisepunkt /
  Lautpunkt** („Leise / Laut" in der Bedienzeile, Tooltips auf den
  Dreiecken); in Klammern bleibt der Grafiker-Begriff als Brücke.
- Bedienung auf Panels (Caspar_D): die Gradations-Bedienung sitzt in einem
  Kasten „Gradation" im Stil des Reglerkastens. Benennung: Pillen =
  **Form** (Aus · Gamma · Sigmoidal), Regler = **Stärke** (HAECKEL nennt
  ihn „Tone"; am Ton sagt „Stärke", was er tut: γ ¼…4, S −10…+10).

## Breite vor oder hinter dem Kompressor (23.08.2026)
Caspar_D: „dass es zwei Schulen gibt und keine Entscheidung, ist nicht so
schön — gib dem Stereoslider eine Checkbox" → Leuchtpille **„vor dem
Kompressor"** neben der Stereo-Breite (Hausregel: keine Checkboxen).
`hörer.breiteVerlegen(vorn)` steckt die M/S-Stufe live um: aus (Standard)
= EQ → Kompressor → Breite → master (Mastering-Schule); an = EQ →
Breite → Kompressor → master (der Kompressor sieht das fertige
Stereobild und hält auch aufgedrehte Breite unter der Decke). Hall/Echo
greifen in beiden Fällen hinter dem Kompressor ab. Gemerkt in
`mysuno-eq-breitevor`. Geprüft: Limiter −40 dB, Breite 200 %: hinten
−40,6 dBFS am Ausgang, vorn −41,5 — die Kappe gilt dann fürs breite
Signal. Die Stufen-Pillen im Kopf stehen in Kettenreihenfolge EQ ·
Kompressor · Effekte. Der Stärke-Regler hat einen 0-Punkt (Tick).

## Ghettoblaster (23.08.2026)
- **Hall physikalischer**: Impulsantwort = Rauschen × exp(−6,91·t/RT60)
  (RT60 2 s), laufender Ein-Pol-Tiefpass 8 kHz → 2 kHz über die Zeit,
  20 ms Vorlauf-Stille. Kein neuer Knoten, Regler unverändert.
- **Panel aufgeräumt**: zwei Kästen wie im Kompressor-Register — „Stereo
  und Raum" (Breite + „vor dem Kompressor", Hall, Echo, Echozeit) und
  „Tempo" (Tempo, Tonhöhe halten) mit „Spaßknopf" MEGA BASS; gleich hoch.
- **MEGA BASS = Aufsatz**: Bass+-Kurve zusätzlich zu den gemerkten Gains
  (`eqGainWirk`, Deckel ±12), flüchtig, nichts wird überschrieben oder
  gemerkt („drauf, weg, alles wie vorher"); zählt zur Lampe am EQ-Knopf.
- **Korrelationswächter**: Breite > 100 % bei Song-Korrelation < 0,3 →
  WIDE-Lampe in Warnfarbe, Tooltip „auf Mono prüfen".
- **Echo im Takt** bewusst nicht: Caspar_D traut der BPM-Messung nicht.

## Notweg gegen Stummschaltung (23.08.2026)
Caspar_D: „Ich höre den Song, öffne das Tonstudio, Ton verstummt." Ursache
der Klasse: `createMediaElementSource` kapert das Element; bricht danach
irgendetwas in `analyseStarten` ab (z. B. kein `audioWorklet` auf einer
unsicheren Verbindung http://192.168…, oder ein Fehler beim Aufbau),
hängt der Ton im Nichts. Jetzt: (1) ohne AudioWorklet bleibt der
Kompressor-Platz leer, der Ton läuft; (2) im catch wird die Quelle direkt
an die Lautsprecher gehängt — lieber ohne Studio als stumm; (3) ein
suspendierter Kontext wird beim Öffnen des Studios geweckt (Autoplay).
Geprüft mit erzwungenem Aufbau-Fehler: Ton läuft weiter.

## Review der Erklärtexte (23.08.2026, 34 Beanstandungen, 30 haltbar)
Drei Gutachter (Tontechniker, Text gegen Code, Gestalt), jede
Beanstandung am Code gegengeprüft. Urteil des Tontechnikers: „kann damit
leben; die Hand geht ihm nur einmal an die Stirn — bei ‚Maximum der
Dynamik' für das, was Headroom ist." Umgesetzt:
- EQ-Legende: „Maximum der Dynamik" → „die Decke — wie viel Luft ein Band
  noch bis zum Vollpegel hat"; Gefüllt = Kurve über der Decke; Solo-Kreise
  erklärt (Messband / Glocke / Invers).
- Kompressor: „harte Schulter" → „harte Kappe am Vollpegel — das
  abgeschnittene Ende der Fotokurve"; Aufholen nur bis ans Dach, flache
  Oberkante = Limiter-Modus; Limiter-Pille nennt Schwelle, Vorausschau,
  Kappe; Gamma des Gradationskompressors wirkt auf der dB-Achse (anderes γ
  als 1/Verhältnis, dieselbe Idee); Sigmoid-Tooltips ohne
  „Expander/Kompressor"-Etikett; Stäbe = LUFS des Songs + Spitze, Ring =
  Momentan-Lautheit; Deckungs-Rückmeldung und Stilgruppen-Marke im Text;
  Wegregelung auch „+"; Attack greift im Limiter-Fall nicht.
- Messwerte: LUFS nicht „log-gewichtet wie L*", sondern gehörgewichtet in
  dB „so wie L* nach dem Auge misst"; „Streaming zielt auf −14" → „die
  meisten Dienste normalisieren auf etwa −14 (Apple −16), Lauteres wird
  leiser gedreht"; „Alles vorgerechnet" korrigiert (Ausgang Spitze ist
  live); Glossar als Tooltips an der Messwertzeile.
- Tooltips: Glockenstuhl (sechs Glocken + zwei Shelves), Decke halten
  (MEGA BASS kennt die Grenze nicht), Breite-vor (Limiter fängt die Breite
  nur vorn), LCD (nach EQ, Kompressor und Effekten), Kompressor-Regler
  (fünf Tooltips in der Belichtungs-Sprache), Referenz-Hinweis nennt den
  echten Knopf; Blaster-Fußnote nennt CLIP und die Lampe am EQ-Knopf.
- **Gestalt** (Caspar_D): sichtbar bleiben Bedienungszeile je Modus + Legende
  (Gebirge/Stäbe/Marken/Ring); die Gammabrücke liegt in einer Lade
  „Hintergrund — Der Kompressor ist eine Gammakorrektur der Lautheit — mit
  Gedächtnis" (zu = nur die Kopfzeile, gemerkt in
  `mysuno-komp-hintergrund`). Beide Charts als **goldenes Rechteck im Querformat** (447×276; quadratisch war kurz drin, "doch nicht so ästhetisch";
  GRAD_MASSE.H), im klassischen Modus eines links mit Regler darunter,
  Texte rechts.

## Störfrequenz-Kerbe — Schritt 1 gebaut (23.08.2026, früh)
`bin/stoerfrequenz.js` → `library/stoerfrequenzen.json` { stand, songs:
{ id: [ {hz, db, dauer, breiteHz, pegel, note, cent, art} ] } }.
Verfahren: ffmpeg Mono 44,1 kHz, FFT 16384 (2,7 Hz), Hann, Hop 8192;
je Bin Median über die Zeit, Hervorhebung gegen gleitenden Median
±⅓ Oktave, Dauer = Anteil der Fenster > 6 dB über der Nachbarschaft.
Kandidat: lokales Maximum, ≥ 12 dB, Halbwertsbreite < ⅓ Oktave,
Dauer ≥ 80 %. Einordnung `art`: Brummen (50/60 Hz ×n) · wahrscheinlich
Musik (Obertonreihe oder musikalisches Intervall zu anderem Kandidaten)
· Ton auf Note (≤ 8 Cent) · Störton. Argumente: `<id>`, `--neu`,
`--anzahl N`, `--laut`. ~5–10 s je Song (nicht im Morgenlauf; parallel
zur Morgenroutine sehr langsam).
**Befund erste 30 Songs:** 27 sauber; „Remix Mich" und „Die Gedanken …"
tragen einen stehenden Ton bei exakt 7 999,6 Hz (+12–13 dB, 84–88 %,
11 Hz schmal, 21 Cent neben jeder Note → Störton, vermutlich
Codec-/Resampling-Artefakt) — der Fall für die Kerbe. „Farben v2":
441,4 Hz = A4 +5 c → Ton auf Note (Musik). „Atem der Nacht III": D5 +
A♯4 = große Terz → wahrscheinlich Musik (darum die Intervallprüfung).
**Schritt 2 (gebaut 23.08., früh):** eigener Filterknoten „Kerbe" hinter
dem EQ (peaking, Güte ~30, Tiefe −12…−30 dB, Frequenz fein), im
Glockenstuhl eine Zeile „Störfrequenzen: 8,0 kHz (Störton, +12 dB, 88 %)
· Kerbe setzen", je Song gemerkt (eqJeSong), in der gezeichneten Kurve
sichtbar; Server-Route GET /api/stoerfrequenzen; Vorschlag, kein
Automatismus.
Stand Schritt 2: Knoten `hörer.kerbe` (peaking) hinter der Solo-Bank,
neutral 0 dB; `eqKerbe` {hz, db, q} je Song in eq.json (Server PUT
/api/eq/<id> nimmt `kerbe` mit); Route GET /api/stoerfrequenzen; Zeile
„Störfrequenzen" im Glockenstuhl unter dem Bild: Vorschläge als Pillen
(Tooltip mit Note, Cent, dB, Dauer, Breite), Klick setzt −18 dB / Q 30,
× entfernt; A/B und EQ-Stufe schalten die Kerbe mit; sie geht in die
gezeichnete Summenkurve ein. Geprüft an „Remix Mich": Kurve bei 8 kHz
−18 dB, bei 7 kHz −0,4 dB, gemerkt im Server. Offen: Tiefe/Güte am
Gerät einstellbar (heute fest), Detektor in den Morgenlauf, Kerbe im
Export, Lauf über alle 321 Songs.
- Glockenstuhl: Summenkurve in der ersten Akzentfarbe (vorher --akzent2).
- Störfrequenzen **im Glockenstuhl-Bild**: je Kandidat ein senkrechter Stab
  an seiner Frequenz (Störton/Brummen in Akzent, Musik/Ton-auf-Note grau,
  Label oben), die gesetzte Kerbe als Kreis auf ihrer Tiefe; das
  Live-Spektrum dahinter (Anzeige-Mittelung) zeigt den Ton als stehende
  Nadel genau dort.

### Störfrequenzen — Bedienung am Tick (23.08.2026, vormittags)
Caspar_Ds Vorgabe: feine Trennlinie unter den Solo-Kreisen, kleine Überschrift
„Störfrequenzen", darunter je nach Stand:
- **kein Scan für diesen Song:** Schaltfläche „Scan dieses und aller anderen
  Songs starten" → POST `/api/stoerfrequenz/start` {id}; der Server startet
  `bin/stoerfrequenz.js <id>` und danach den Lauf über alle Songs ohne
  Eintrag; die Seite fragt alle 2 s nach, bis der Song seinen Eintrag hat
  (höchstens 10 min).
- **Daten da:** die Kandidaten als Pillen (Tooltip mit Note, Cent, dB, Dauer,
  Breite) und die gesetzte Kerbe als Wert; die Bedienung sitzt aber **im
  Bild**: an jedem Tick (Strichellinie an der Frequenz, Label bei ~+7 dB)
  zwei runde Griffe — **♪ allein hören** (der Kerbenknoten wird zum engen
  Bandpass, Güte 25, flüchtig, im Fuß als „Störton allein (8000 Hz)") und
  **⊘ Kerbe** (peaking −12 dB, Güte 30, je Song gemerkt). Aktiver Griff
  gefüllt; gesetzte Kerbe: Tick durchgezogen, Kreis auf ihrer Tiefe, Dip in
  der Summenkurve.
- Der Detektor hat jetzt ein **Schloss** (`library/stoerfrequenz.lock` mit
  PID; ein zweiter Start beendet sich mit Hinweis) und **schreibt mergend**
  (liest die Datei frisch und legt nur die eigenen Ergebnisse darüber) —
  Terminal-Lauf und Schaltfläche können sich nicht mehr überschreiben.
- Hörprobe Caspar_D an „Remix Mich": mit/ohne Kerbe kein hörbarer Unterschied —
  8 kHz, −47 dBFS, 12 dB über der Nachbarschaft: eher „Glanz" als Ton, und
  genau der Bereich, in dem das Gehör zuerst nachlässt. Darum der ♪-Griff:
  den Ton allein hören macht ihn fassbar.

### Störfrequenzen — Rest eingebaut (23.08.2026, „bau alles ein")
- **Tiefe und Güte an der Kerbe — per Maus wie die Bänder** (Caspar_D: „über die
  gleiche Mechanik … nur per Mausaktion"; die zwei Schieberegler gab es eine
  Stunde lang und sind wieder raus): ⊘ am Tick setzt die Kerbe (−12 dB, Güte
  30), danach ist sie ein **neunter Punkt im Glockenstuhl**: senkrecht ziehen
  = Tiefe (Achse des Bildes ±12 dB, Raster 0,5; plus hebt den Ton zum Anhören
  an), seitlich = Frequenz (Magnet auf dem nächsten gefundenen Ton), Scrollrad
  über dem Punkt = Güte 5…60, Doppelklick löst sie. Aktiv: weißer Ring und
  Werte-Tupel Hz/dB/Q. Schultergriffe gibt es bei der Kerbe nicht — bei Güte 30
  lägen sie 2 px neben dem Punkt. Jede Änderung speichert (eq.json). Altbestand
  mit −18 dB wird beim Laden auf die Achse geklemmt.
- **Morgenlauf:** neuer Schritt „Störfrequenzen suchen — stehende Töne für
  die Kerbe" hinter „Klangprofil und Lautheitshistogramm nachziehen"; rechnet
  nur Songs ohne Eintrag (Einheiten = Zahl der fehlenden), braucht audio.mp3
  (Schritt „Fehlende Medien laden" liegt davor). Ohne neue Songs: „nichts zu
  tun" in 0 s.
- **Export:** `bin/export.js` kopiert `library/` ohnehin komplett — `eq.json`
  (mit Kerbe) und `stoerfrequenzen.json` reisen mit (Probe: beide gelistet);
  nur die Schloss-Datei eines laufenden Detektors (`*.lock`) ist ausgeschlossen.
- **Befund des vollen Laufs (321 Songs, 17 min):** 240 sauber, 81 mit
  Kandidaten, davon 161 „wahrscheinlich Musik" + 41 „Ton auf Note" (gehaltene
  Noten). **9 Störtöne in 6 Songs:** 7 999,6 Hz in „Remix Mich" und „Die
  Gedanken…" (identische Frequenz → Codec-/Resampling-Artefakt; Caspar_D: mit der
  Kerbe „hervorragend" zu filtern, es funktioniert); „Erste Regentropfen"
  (10,4–10,7 kHz, vier dicht beieinander → eher ein Band), „Waldesrauschen"
  (4 737/4 740 Hz), „Wiese mit Insekten" (7 200 Hz) — Geräuschkulissen, deren
  Rauschen/Zirpen der Detektor nicht von einem Artefakt unterscheiden kann;
  Hörprobe mit ♪ entscheidet, Kerbe nur bei echtem Artefakt.

### Review der Störfrequenz-Arbeit (23.08.2026, drei Prüfer + Widerlegung)
18 bestätigte Funde, alle behoben:
- **Scan-Schaltfläche tot** — beim Ausbau der Regler war ihr Klick-Handler
  mit abgeschnitten (Beifang eines zu großen Schnitts). Wieder drin; fremde
  Songs bekommen keinen Knopf (kein Song als Datei, der Detektor überspringt sie).
- **Songwechsel bei geschlossenem Studio** ließ ♪-Bandpass und Kerbe des alten
  Songs stehen (der nächste Song wäre als 8-kHz-Pfeifen gelaufen) und lud die
  Kerbe des neuen nicht: `spielen()` schaltet jetzt den ganzen EQ-Zustand um.
- **Griffe** handeln auf pointerdown statt click (das Bild wird alle 250 ms neu
  gebaut, ein click auf ein ersetztes Element kam nicht an); dblclick wird
  geschluckt; Zeilen nach Lage statt Listenindex verteilt (Nachbarn <96 px
  bekommen verschiedene Zeilen).
- **Summenkurve beim ♪-Hören** zeigt jetzt den Bandpass (derselbe Knoten im
  stillen Rechner), nicht die Kerbe.
- **Magnet** rastet auf den nächsten statt den listenersten Ton.
- **Detektor:** dicht liegende Linien (innerhalb eines Halbtons) sind EIN
  Befund („Erste Regentropfen": 11 Linien 10,4–10,7 kHz = Regenzischen, ein
  Band — vorher vier „Störtöne"); Schloss atomar (`wx`), liegengebliebenes
  Schloss zählt nur, wenn die PID lebt UND ein Detektor ist (`ps`); keine
  SIGINT/SIGTERM-Handler mehr (die Schleife ist synchron, Ctrl-C wirkt sofort);
  Morgen-Einheiten zählen wie der Detektor nur Songs mit audio.mp3; der
  Server-Spawn hat einen error-Listener.

## Anschluss — Songübergänge (gebaut 23.08.2026)
Caspar_Ds Idee vom selben Tag, gebaut nach dem Konzept in BACKLOG.md.

**Zwei Decks.** `web/index.html` hat jetzt zwei `<audio>`-Elemente (`audio`,
`audio2`); die Variable `audio` zeigt auf das gerade tragende Deck, aller
übrige Code arbeitet unverändert damit weiter (`deckA`/`deckB`,
`deckAnderes()`, `deckMelder()` hängt beide Melder, nur das aktive steuert die
Oberfläche). Im Tonpfad hängt jedes Deck an einem eigenen Blendregler
(`hörer.blendA/blendB`), beide summieren sich **vor** den Analysern und vor dem
EQ: während der Naht klingen beide Songs durch dieselben Filter — ehrlich, denn
genau das hört man. Beide Regler stehen auf 1; zugezogen wird nur bei der
Notblende. Der Notweg im `catch` hängt jetzt beide Quellen direkt an die
Lautsprecher.

**Das Regelwerk** (`anschlussRechnen`): Ränder aus der Hüllkurve `welle`
(`anschlussRaender` — ein Ausblenden fällt über drei Sekunden auf unter 55 %,
ein hartes Ende steht bis zuletzt; dazu letzter/erster hörbarer Ton, denn das
Dateiende ist nicht das Klangende), Takt aus Sunos `schlaege`
(`anschlussTakt` — Median der Schlagabstände, 90-%-Streuung als Gütemaß, alle
Zählzeit-Einsen). Daraus Caspar_Ds vier Fälle: **Fortsetzen** (hart/hart, ein leerer
Takt), **Ineinander** (weich/weich), **Eintakten** (weich/hart),
**Anschlagen** (hart/weich, das Einblenden füllt die Pause). Halbes, doppeltes
und Dreiviertel-Tempo gelten als passend. Wer den Angleich trägt, ist
gerechnet: unter 4 % der Neue allein, bis 8 % beide je zur Hälfte (geometrisches
Mittel), darüber keine Regel — dann eine Notblende. Rampe acht Takte,
tonhöhenfest (`preservesPitch`).

**Timing.** Zwölf Sekunden vorher wird das andere Deck geladen
(`anschlussVorladen`) und der Auslöser gestellt — der Zeitgeber läuft dann
unabhängig von `timeupdate`, das nach dem Songende keines mehr liefert. Die
letzten Millisekunden im Bildtakt, dann `play()`. Bei Fall 1 und 4 liegt der
Einsatz **hinter** dem Songende (der leere Takt gehört zur Naht), darum hält
sich `onended` zurück, solange `anschlussSteht()`.

**Selbstprüfung** (wie beim Raumschiff): `anschlussProtokoll` schreibt jede
gefahrene Naht mit — Abweichung an der UHR gemessen, nicht an der Songzeit
(hinter dem Songende bleibt `currentTime` stehen, dort wäre jede Songzeit-
Messung Unsinn; genau daran ist die erste Messung gescheitert).
**Gemessen 23.08.2026, alle vier Fälle: +7, +7, +7 und −2 ms** — ein
Hundertstel Schlag, weit unter der Hörschwelle. Trockenlauf über 60
Nachbarpaare: **53 % greifen** (Eintakten 20, Ineinander 6, Anschlagen 4,
Fortsetzen 2, 28 wegen Tempo abgelehnt) — genau die vorhergesagte Quote. Die
Ränder verteilen sich 35× weich/hart, 16× weich/weich, 6× hart/weich,
3× hart/hart: Suno blendet gern aus und fängt hart an.

**Bedienung**: ein Knopf im Player neben Zufall und Schleife (zwei
ineinandergreifende Bogenenden). Aus = still, an = Akzentfarbe, und hell nur,
wenn wirklich eine Naht bereitsteht. Der Tooltip erzählt sie: „Eintakten:
Ausklang trifft harten Anfang · 121 → 120 BPM, Treffpunkt 121 (der Neue allein)
· nächster: Tiefengestirne v2". Sonst gibt es nichts einzustellen.
Nicht bei Schleife, nicht bei der Klangraum-Reise, nicht bei fremden Songs;
bei Zufall wird der Nächste vorgemerkt, damit `vor(1)` dieselbe Wahl trifft.

**Notblende geprüft (23.08.2026, nachgereicht).** Sie betrifft fast die Hälfte
der Übergänge und hatte zwei Fehler, die nur ein echter Lauf zeigt:
1. Ohne Regel fehlten dem Plan `vorlaufB`/`rateB` — die Startzeit wurde `NaN`,
   und weil **jeder Vergleich mit NaN falsch ist**, blieb der Auslöser stumm:
   die Blende lief nie, der Player fiel still auf den normalen Songwechsel
   zurück. Jetzt füllt `anschlussPlanen` alle Felder mit Vorgaben.
2. Die Rampe wurde nach Millisekunden wieder gelöscht: Die Übergabe stößt
   sofort die Planung des nächsten Songs an, und deren `anschlussAbbrechen`
   räumte die Blenden ab. Jetzt schützt `anschlussBlendeBis` eine laufende
   Blende.
Zusätzlich wartet der Einsatz nicht mehr allein im Bildtakt (der stockt, wenn
der Browser lädt oder dekodiert — einmal 1,9 s zu spät), sondern im Bildtakt
UND per Zeitgeber; wer zuerst da ist, gewinnt. Gemessen danach: **−4 ms**,
A blendet über 4 s aus, B über 2 s ein.

**Auf der Klangraum-Reise (nachgereicht 23.08.2026).** Der Anschluss greift
jetzt auch dort. Der Weiterschritt läuft über `vor(1, true)` statt über
`spielen(i, true)`: so bekommt die Reise ihre Besuchsliste und ihren Flug, der
Zufall seine vorgemerkte Wahl — alles wie sonst, nur ohne den Ton anzufassen.
`anschlussNaechster` fragt `reiseNaechster(aktuellId, new Set())`; die zweite
Menge macht den Aufruf seitenwirkungsfrei, denn ohne sie leert er am Ende der
Reise die Besuchsliste, würde die Reise also beim bloßen Fragen neu starten.
`reiseToggle` plant neu (der Nächste ist danach ein anderer). Vor der Übergabe
prüft `anschlussUebergeben`, ob der geplante Song überhaupt noch ansteht —
sonst wird die Naht verworfen, statt den falschen Ton weiterlaufen zu lassen.
Gemessen: Reise-Naht „Noch lachst Du → Monolith" (Ineinander) **−3 ms**,
Reiseweg und Besuchsliste wachsen korrekt mit, das Schiff fliegt.
**Trefferquote auf der Reise: 45 %** über 40 Etappen (Eintakten 7, Ineinander 6,
Fortsetzen 5) — also etwas WENIGER als die 53 % im Album. Die Vermutung,
klanglich verwandte Nachbarn seien auch tempoverwandt, war falsch.

### Nach Tempo sortieren — der Anschluss greift dann fast immer (Caspar_D, 23.08.2026)
Caspar_Ds Idee: „wir sortieren nach Tempo in der Album-Ansicht und spielen das ab."
Sie ist die Antwort auf den Befund, dass klanglich verwandte Nachbarn NICHT
tempoverwandt sind (Reise 45 %, Album 53 %).

**Das Tempo kommt jetzt aus Sunos Schlägen** und steht im Katalog: `taktBpm`
(Median der Schlagabstände) und `taktFest` (90-%-Abweichung) je Song, gebaut in
`bin/katalog.js` (`schlank`). Nicht die gemessene BPM der Klanganalyse — der
Vergleich über 70 Songs zeigt, warum: 63 % stimmen überein, **30 % liegen eine
Oktave daneben** (gemessen 60, Sunos Takt 120,5 — musikalisch beides vertretbar,
für eine Reihenfolge fatal), **7 % sind schlicht falsch** („Mutterns Hände":
122 gegen 101). Caspar_Ds Misstrauen gegen die BPM-Messung war berechtigt.

**Neue Sortiergruppe „Tempo (Sunos Takt)"**: „Langsam → schnell" / „Schnell →
langsam" (`taktAuf`/`taktAb`); Songs ohne Raster stehen hinten. Die alten
Einträge heißen jetzt ehrlich „(gemessen)". Spanne der Sammlung: 64,1 bis
184,1 BPM, 306 von 321 taktfest.

**Wirkung, gemessen über 60 Nachbarpaare der Tempo-Reihenfolge: 92 %**
(Eintakten 31, Fortsetzen 12, Ineinander 8, Anschlagen 4). Die fünf Ausfälle
sind **kein** Tempoproblem, sondern „Takt zu unruhig" — Ambient und
Geräuschkulissen ohne klares Raster; dort greift die Notblende. Zum Vergleich:
Album chronologisch 53 %, Klangraum-Reise 45 %.


## Einmessen am Hörplatz (27.08.2026)

Vierte Lasche im Tonstudio. Ein Prüfton geht über den normalen Ausgang,
das Mikrofon nimmt auf, und aus der Aufnahme entsteht ein Spektrum über
31 Terzbänder.

### Drei Signale

| | Neigung je Oktave | wofür |
|---|---|---|
| **Sweep** 20 Hz – 20 kHz | −3,20 dB | Standard der Raumakustik: trägt seine Energie nacheinander, deshalb auch in halligen Räumen auswertbar |
| **Rosa Rauschen** | −3,03 dB | gleiche Energie je Oktave; womit Beschallungsleute einmessen |
| **Weißes Rauschen** | −0,04 dB | gleiche Energie je Hertz; ehrlichste Anregung für lineare Fächer |

Alle drei mit 50-ms-Blende an beiden Enden — ein hart einsetzendes
Signal knackt, und der Knack ist breitbandig.

Das rosa Rauschen entsteht nach **Voss-McCartney**: mehrere
Zufallsreihen, jede halb so oft erneuert wie die vorige. Das ergibt
sauber 3 dB Abfall je Oktave ohne Filter.

### Der Prüfton nimmt den Musikweg

Als WAV über **das Element, das die Musik spielt** — nicht über die
`destination` des AudioContext. Web Audio kennt AirPlay nicht; über den
Kontext käme der Ton aus dem eingebauten Lautsprecher statt aus den
HomePods. Dasselbe gilt für den Chirp der Latenzmessung.

Aufgenommen wird über Web Audio (ein Eingang, davon unberührt), mit
abgeschalteter Echounterdrückung, Rauschunterdrückung und
Pegelautomatik.

### Was die Messung nicht ist

**Keine Eichung.** Ein Mikrofon nimmt das Produkt aus vier Dingen auf:

```
gemessen = Signal × Lautsprecher × Raum × Mikrofon
```

Ohne Meßmikrofon lassen sich die vier nicht trennen. Für eingebaute
Mac-Mikrofone gibt es keine Kennlinien — Apple veröffentlicht keine, und
es existiert keine Datenbank. Qualitativ bekannt ist: Hochpaß bei etwa
100 Hz, Betonung um 2–5 kHz, Abfall über 10 kHz.

**Eine automatische EQ-Korrektur daraus wäre schädlich**: Sie höbe den
Baß an, um ein Loch auszugleichen, das im Mikrofon sitzt und nicht im
Raum.

### Warum zwei Durchgänge

In der **Differenz** kürzen sich Mikrofon, Lautsprecher und Raum heraus
— sie sind in beiden Messungen dieselben. Übrig bleibt, was das
Tonstudio am Hörplatz wirklich bewirkt, Raummoden und Reflexionen
inbegriffen.

Für eine absolute Skala bräuchte es ein Meßmikrofon mit
Kalibrierdatei. Das **miniDSP UMIK-1** (rund 100 €) bringt eine
individuelle Datei zur Seriennummer mit — schlichte Frequenz/dB-Paare,
leicht einzulesen. Das Behringer ECM8000 hat einen typischen, aber
keinen individuellen Frequenzgang.


## Die Kette digital nachgemessen (27.08.2026)

Ohne Mikrofon, über zwei Analyser an `quelle` und `summe`. Gemessen
wird die Differenz je Terzband — was das Tonstudio zwischen den beiden
Punkten tut.

**Das Meßverfahren braucht ein konstantes Eingangssignal.** Mit Musik
schwankten die Werte um 0,73 dB zwischen zwei identischen Zuständen —
mehr als die Unterschiede selbst. Mit rosa Rauschen in Endlosschleife
und vier Sekunden Einschwingzeit je Zustand fiel die Gegenprobe auf
**0,16 dB**. Der Master steht dabei auf null: digital meßbar, hörbar
still.

### Was die Filter tun

| Eingriff | Wirkung |
|---|---|
| 445 Hz **+8 dB** | 315-Hz-Band 1,7 → **7,0** · übrige Bänder unberührt |
| 2500 Hz Shelf **−6 dB** | 5 kHz 6,8 → **−1,2** · 20 kHz 6,7 → **−1,7** |
| zurückgestellt | alle Bänder wieder auf Ausgangsniveau |

Die Kette zeigt Anhebung und Absenkung an der richtigen Frequenz und in
der richtigen Größenordnung.

### Latenz

| | |
|---|---|
| Basislatenz (Web Audio) | 5,33 ms |
| Ausgabelatenz (System) | 16,00 ms |
| zusammen | **21,33 ms** |
| Kompressor-Vorschau | 2,67 ms (128 Bilder bei 48 kHz) |

Zum Vergleich: Der gemessene AirPlay-Versatz zu den HomePods liegt bei
**2079 ms** — das Hundertfache. Die lokale Verarbeitung ist gegen den
Funkweg vernachlässigbar.

---

## Warum sich der Mikrofonfrequenzgang nicht schätzen läßt

Naheliegender Gedanke: Man kennt idealtypische Mikrofonkurven und
vielleicht die des Lautsprechers — ergäbe das nicht eine Näherung?

**Nein, und der Grund liegt beim Lautsprecher.** HomePods führen eine
**adaptive Raumkorrektur** aus: Sie messen ihre Aufstellung selbst und
ändern danach ihren Frequenzgang. Es gibt also keine feste
HomePod-Kurve, die man abziehen könnte — sie ist in jedem Raum und
nach jedem Verrücken eine andere. Apple veröffentlicht ohnehin keine
Meßschriebe; was kursiert, sind Fremdmessungen einzelner Exemplare in
einzelnen Räumen.

Beim Mikrofon dasselbe in kleiner: Bekannt ist nur die Richtung
(Hochpaß um 100 Hz, Präsenzanhebung 2–5 kHz, Abfall über 10 kHz), nicht
der Betrag.

**Eine Korrektur aus geschätzten Kurven wäre schlechter als keine**, weil
sie Genauigkeit vortäuscht, wo Vermutung steht — und weil sich zwei
Schätzfehler addieren statt aufzuheben.

Was bleibt, ist der Weg, der ohne diese Kurven auskommt: die
**Differenz zweier Durchgänge**. Was in beiden Messungen steckt, kürzt
sich heraus, gleichgültig wie es aussieht. Für eine absolute Skala
führt kein Weg an einem Meßmikrofon mit Kalibrierdatei vorbei.


## Der Equalizer bandweise durchgemessen (27.08.2026)

Caspar_D: *„ferner sollst du verschiedene frequenzen testen aus den
typischen eq bändern"* — und, nachdem ich ihn nach Einstellungen fragte:
*„warum soll ich da was einstellen, du kannst das reproduzierbar viel
besser und schneller als ich"*. Also 19 Einstellungen selbst gefahren,
jede digital gemessen.

**Erst der Einwand richtiggestellt.** Er vermutete, der Meßton rege alle
Frequenzen gleichzeitig an. Umgekehrt: der **Sweep** trägt seine Energie
*nacheinander* (deshalb ist er in halligen Räumen auswertbar), das
**Rauschen** regt gleichzeitig an. Für eine bandweise Prüfung ist
gleichzeitig sogar richtig — man sieht den ganzen Frequenzgang in einem
Zug, statt ihn aus Einzeltönen zusammenzustückeln.

### Aufbau

Zwei Analyser als Sackgassen, einer an `quelle`, einer an `summe` — genau
die beiden Punkte, die das Spektrum als *Codiertes Signal* und
*Ausgabe-Signal* führt. Rosa Rauschen (Voss-McCartney, 8-s-Schleife) an
`quelle`, `master` auf 0, damit nichts nach draußen dringt. FFT 16384 →
2,69 Hz Auflösung, zusammengefaßt in 31 Terzbänder. Gemessen wird die
**Differenz** Ausgang minus Eingang; was beiden gemeinsam ist, kürzt sich
heraus.

**Der Takt kommt aus dem Audio-Thread**, nicht von `setTimeout`. Ein
verstecktes Browserfenster drosselt Timer auf einen Schlag je Sekunde —
die erste Messung lief deshalb ins Zeitlimit. Ein `ScriptProcessor` mit
16384 Samples Blockgröße feuert alle 371 ms, unbeirrt von der
Sichtbarkeit, und liest **beide Analyser im selben Augenblick**. Sonst
vergleicht man zwei verschiedene Rauschabschnitte miteinander.

### Nullprobe: ±0,02 dB

Alle Regler auf 0, gemessen von 25 Hz bis 12,9 kHz: die größte Abweichung
ist **0,02 dB**. Die Kette ist bei neutraler Stellung vollkommen
durchsichtig — EQ, Kerbe, Kompressor, Breite, alles. Damit ist jeder
folgende Wert echte Reglerwirkung und kein Meßartefakt. (Die frühere
Gegenprobe über das Mikrofon kam auf 0,16 dB; der Unterschied ist der
Raum, nicht die Software.)

### Die acht Bänder einzeln, je +12 dB

| Regler | Typ | Spitze gemessen | wo |
|---|---|---|---|
| 40 Hz | lowshelf | +10,1 dB | 25 Hz (läuft nach unten weiter) |
| 56,6 Hz | peaking | +11,2 dB | 50–64 Hz |
| 113 Hz | peaking | +11,4 dB | 101–127 Hz |
| 224 Hz | peaking | +11,3 dB | 202–254 Hz |
| 445 Hz | peaking | +11,3 dB | 403–508 Hz |
| 886 Hz | peaking | +11,3 dB | 806 Hz |
| 1768 Hz | peaking | +11,4 dB | 1613 Hz |
| 2500 Hz | highshelf | +12,0 dB | ab 10 kHz |

Die 11,3 statt 12,0 bei den Glocken sind kein Fehler: ein Terzband ist
breiter als die Spitze, der Mittelwert liegt darunter.

**Die beiden Shelfs verhalten sich lehrbuchgenau.** Bei einem Shelf ist
die genannte Frequenz der Punkt der **halben** Anhebung, nicht der
vollen: bei 40 Hz gemessen +6,1 dB, bei 2560 Hz +6,3 dB — beide Male die
Hälfte von 12. Voll wird es erst weit außerhalb (Band 8 erreicht +12,0
ab 10 kHz). Wer am 40-Hz-Regler zieht, hebt also vor allem an, was
*unter* 40 Hz liegt.

### Der eigentliche Befund: die Bänder überlappen

Mit Q = 1 ist jede Glocke gut 1,7 Oktaven breit. Nachbarn addieren sich:

| Einstellung | erwartet | gemessen |
|---|---|---|
| nur 445 Hz auf +3 | +3 | **+2,84** |
| nur 886 Hz auf +3 | +3 | **+2,85** |
| beide auf +3 | +3 | **+4,04** |
| alle acht auf +3 | +3 | **+5,29** |
| alle acht auf −3 | −3 | **−5,29** |

Wer alle Regler gleichmäßig um 3 dB anhebt, bekommt **5,3 dB** — fast das
Doppelte. Das ist keine Lautstärkeregelung mit Umweg, sondern acht
überlappende Glocken, die einander aufaddieren.

### Und die Gegenprobe: feine Zacken gehen nicht

Regler abwechselnd +6 / −6 gestellt. Heraus kommt in der Mitte nur
±2,5 dB — die Nachbarn löschen einander weitgehend aus:

```
50 Hz −2,7   101 Hz +2,3   202 Hz −2,4   403 Hz +2,5
806 Hz −2,3  1613 Hz +2,9  3225 Hz −2,5  12,9 kHz −6,0
```

Nur ganz oben setzt sich die volle Stellung durch (−6,0 dB) — der
Highshelf hat keinen Nachbarn über sich, der ihm entgegenarbeitet.
Dasselbe gilt unten für den Lowshelf. **Die Enden der Kette sind
durchsetzungsfähig, die Mitte ist ein Kompromiß der Nachbarn.**

Praktisch heißt das: der Equalizer ist ein Werkzeug für breite Griffe —
Badewanne, Bassfundament, Stimmenband. Wer eine schmale Störfrequenz
treffen will, nimmt die **Kerbe**, nicht die Regler.

### Was die fünf Klassiker wirklich tun

| Name | größte Anhebung | größte Absenkung | Spanne |
|---|---|---|---|
| loudness | +5,1 dB @ 25 Hz | −1,5 dB @ 403 Hz | 6,6 dB |
| bass | +6,6 dB @ 50 Hz | 0,0 dB @ 4 kHz | 6,6 dB |
| hoehen | +5,3 dB @ 5,1 kHz | 0,0 dB @ 25 Hz | 5,3 dB |
| stimme | +4,5 dB @ 508 Hz | −2,0 dB @ 25 Hz | 6,5 dB |
| nacht | +1,1 dB @ 508 Hz | −4,8 dB @ 32 Hz | ~6 dB |

Bei *stimme* stehen zwei Regler auf +3 (445 und 886 Hz) — heraus kommen
**+4,5 dB bei 508 Hz**. Die Überlappung wieder, diesmal als gewollter
Effekt: das Stimmenband wird breiter und lauter, als die Reglerstellung
vermuten läßt.
