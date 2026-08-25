# Der Klangraum (21.08.2026)

> **Namenswechsel:** Das Projekt hieß bis zum 24.08.2026 *MySuno*. Es heißt jetzt **KlangTresor** — „Suno" ist seit dem 06.01.2026 eingetragene Marke von Suno Inc., ausdrücklich für Software zum Abspielen und Bearbeiten von Audioinhalten. Wo in Zitaten und in der Chronik noch der alte Name steht, bleibt er stehen.

Register **Werke · Alben · Klangraum** (Taufe 21.08.: Tracks → Werke,
Playlists → Alben, Karte → Klangraum; intern heißen die Schlüssel
weiter tracks/playlists/karte). Der Klangraum ist der Sternenhimmel
der Sammlung: jeder Song ein Stern, Nähe = Klangnähe.

## Datenkette

1. `bin/klang.js` — Discogs-EffNet (ONNX, onnxruntime-node, Modelle in
   library/modelle/). Vorverarbeitung exakt nach Essentia-Quellcode
   (96 Mel × 128 Frames, log10(1+10000x)). Je Song: 1280er Embedding
   (Mittel aller 2-s-Patches), Top-5 Discogs-Stile, Jamendo Genre/
   Stimmung/Instrumente, **Streuung** der Patches um das Songmittel
   (Hybride). → library/klang.json. ~6–10 s je Song, neueste zuerst,
   `--neu` rechnet alles neu. Läuft unter caffeinate.
2. `bin/karte.js` — Abstand √(1−cos). Gruppen: agglomerativ, complete
   linkage, Silhouette (4–14). Lagen: NMDS 2D, **NMDS 3D auf
   Hauptachsen** (Standard; Stress 0,080), UMAP 2D/3D (Saat 20260821).
   Je Song 8 Nachbarn + Dichte (Rang des mittleren 6-NN-Abstands).
   Tags als supplementäre Punkte (CA-Logik: gewichteter Schwerpunkt),
   mit η² („erklärt die Gruppen"), `markiert`, `sterne` (Top 8).
   Je Gruppe Schwerpunkt, Hauptachse, Ausdehnung (für die Attraktoren).
   → library/karte.json. Morgenschritt 'musikstil' (Klang + Karte).
3. `bin/himmel-export.js` — EINE HTML-Datei (library/export/
   sternenhimmel.html): schneidet die Zeichenfunktionen aus index.html
   (keine zweite Kopie), bettet Daten ein, nur öffentliche Songs, Cover
   und MP3 von Sunos CDN, eigener Player, komplettes Panel, Reise,
   Schiff. Läuft per Datei ohne Server (Internet für Ton/Cover nötig).
   Knopf „Export" im Panel; Route POST /api/himmel-export, GET
   /export/sternenhimmel.html.

## Darstellung (web/index.html, Funktionen karte*)

- **Sterne** (Belegung 22.08.2026, „Biografie statt Geometrie",
  karteKennwerte() liefert Ränge 0..1): **Größe = Plays**, **Helligkeit
  = Likes** (Magnituden), **Korona = Kommentare** (Stärke/Ausdehnung;
  Farbe = Stilgruppe, voll gesättigt), **Beugungskreuz = Bewegung**
  (Plays-Zuwachs 7 Tage aus zaehlerVerlauf; Länge = wie viel; erst ab
  dem zweiten Morgenstand sichtbar), **Farbe = Alter** (Schwarzkörper),
  **Schatten = privat/versteckt** (dunkle Silhouette). Auf der
  Animationsschicht: **Flimmern = neu** (< 7 Tage), **Pulsieren =
  Hybrid** (Streuung Top 10 %, Periode nach Wechselhaftigkeit),
  **Doppelsystem = Zwillinge** (gemeinsame Hülle). Hover = **Spotlight**
  (alles andere auf 45 %, sechs Nachbarn im Licht, Fäden mit Deckung
  nach Nähe) — die weißen Nachbarringe sind weg. Cover, sobald ≤ 20
  Sterne im Bild (2 × Kern beim Umschalten).
- **Standard minimal**: nur Sterne. Zuschaltbar: Nebel (additive
  Moffat-Wolken mit Rauschmaske), Klassifikatoren (Genres/Instrumente/
  Stimmungen als **Sternbilder**: Name am Schwerpunkt der stärksten
  Songs, optional Linien = Minimalspannbaum; Rang nach η², räumlich
  entzerrt, mehr beim Zoomen), **Attraktoren** (ein Schwarzes Loch je
  Gruppe mit Akkretionsscheibe senkrecht zur Hauptachse, Jets entlang
  der Hauptachse, Klick hebt Gruppe hervor).
- **3D**: Quaternion-Rotation, Perspektive (Kamera 3,2), Klick dreht
  den Stern in 0,8 s nach vorn und spielt ihn, Ziehen = Trackball,
  Doppelklick = Landing (PC1/PC2). Tiefe → Größe/Helligkeit.
- **Zoom** ums Schiff (sonst Maus), Raststufe kurz vor der Cover-
  Schwelle (zweite Radgeste geht weiter). Feld füllt Breite und Höhe
  (gestreckt), Höhe zur Laufzeit gemessen — kein Scrollen.
- **Panel** (kartePanelHtml/kartePanelDran, geteilt mit Export):
  Visualisierung [2D|3D][NMDS|UMAP] · Klassifikatoren · Weiteres
  (Attraktoren, Sternbilder, Nebel, Export) · Sound-Schiff Caspar.
  Legende in Blöcken mit je zwei Spalten: Stilgruppen · Sterne ·
  Lebende Sterne · Zuschaltbar (karteLesarten(), geteilt mit Export).
- **Steckbrief** unten rechts (Stern unter der Maus, sonst laufender
  Song): Cover, Hausmesswerte, Stil, Genre/Stimmung/Instrumente als
  drei Spalten liegender Säulen, Wechselhaftigkeit, sechs Nachbarn.
- **Tooltip**: ein Element, Clusterfarbe, Lebenszeit 4 s.

## Klangreise und Sound-Schiff

`reise` (Toggle „Starte Reise" im Panel): am Songende fliegt die Musik
zum nächsten noch nicht besuchten Klangnachbarn (echte Abstände im
NMDS-Raum) statt zum nächsten der Liste; greift nur in `vor()` ein,
nie in den Tonpfad. `reiseWeg` hält alle Stationen — der ganze Pfad
bleibt sichtbar. Das Schiff (eigene Canvas-Schicht `karteschiff`)
fliegt auf einer Bézier-Bahn vom laufenden zum Zielstern, Position =
Songfortschritt (Pause = Stillstand), Transponder „SOUND-SCHIFF /
Caspar", zurückgelegte Bahn in Akzent, Zielring.

## Nachträge 21.08. (Abend)

- **Flugarten** (Dropdown in der Sound-Schiff-Zeile): Direkte Route ·
  Orbiter (Standard: Ellipse IM RAUM um den Stern, kippt mit der
  Drehung; Radius ≤ 45 % des Abstands zum nächsten Stern, außer
  Zwillinge = Klangabstand < 0,17 oder gleicher Titelstamm bei < 0,25;
  Umlauf = 16 Takte aus BPM, Kepler-Tempo; Abflug 10 s vor Schluss) ·
  Warpsprung (nur zu Nicht-Nachbarn: Kern lädt 3 s, Blitz,
  Sternstrahlen, Ankunftsring; zu Nachbarn Orbitflug).
- **Borg** (Pille): verlassene Sterne verlöschen in einer Supernova und
  bleiben dunkle Reste (Sitzungszustand).
- **Cover** erscheinen, sobald ≤ 20 Sterne im Bild sind (dynamische
  Raststufe der ersten Radgeste), Größe beim Umschalten = 2 × Kern,
  wächst mit weiterem Zoom (Deckel ~52 px); Maximalzoom 40.
- Rechte Maustaste verschiebt immer; linke dreht (3D) / verschiebt (2D).
- Schiff wächst mit √Zoom, ab ~2× Details (Gondeln, Cockpit, Lichter,
  Schriftzug). Ein Fehler im Schiff-Frame stoppt die Animation nicht.
- Tooltip: ein Element, 4 s Lebenszeit. Panel/Legende/Player auch im
  Export (MP3 von Sunos CDN). Paket für Linux: bin/modelle-holen.js,
  KLANG_CUDA=1, Whisper optional, caffeinate nur Mac.

## Bahnmechanik (Nacht 21./22.08.2026, mit Caspar_D am Bild entwickelt)

Zuerst Ellipsen mit Kepler-Tempo, dann verworfen: „Kreise, konstantes
Tempo, der Eindruck zählt". Stand:
- Kreisbahn, Bahngeschwindigkeit konstant (eine Runde auf dem
  Maximalkreis = 20 s; Caspar_D hat 2 s → 6 s → 20 s probiert). Eintritt auf dem FANGKREIS
  (7 px·√Zoom), Spirale nach außen 4,5 px/Runde bis zum Maximalkreis
  (45 % Nachbarabstand außer Zwillingen, Deckel 30 % der kurzen Seite).
- Absprung: Schub im letzten Viertel-Umlauf (Tempo → 1,5×, Schweif),
  Absprung dort, wo die Fahrtrichtung auf den Tangentenpunkt des
  Ziel-Fangorbits zeigt (letzter passender Punkt, Restzeit reicht);
  Transit geradeaus, Tempo = Strecke/Restzeit, nie unter
  Bahngeschwindigkeit. Kurs ab Schubbeginn eingefroren, relativ zu
  Stern und Ziel gespeichert (pan-fest).
- Zielorbit wird VORAB in seiner echten Raumebene gebaut (Ziel → dessen
  nächstes Ziel via reiseNaechster(ziel, …), plus unsere Richtung als
  Herkunft): Tangente an die PROJIZIERTE Ellipse (zwei Lösungen,
  Fahrtrichtung entscheidet), Eintrittswinkel + Umlaufsinn werden als
  Bahnparameter übergeben — kein Suchen bei Ankunft (0,0 px, 0,3°).
- Bahnebene eines Sterns = Ebene aus Herkunfts- und Zielrichtung
  (orbitBasis(hier, ziel, vorher)); dadurch Eintritt und Absprung im
  Raum tangential. Kamera dreht auf die Ebene des ZIELorbits, sobald
  das Ziel feststeht (2,6 s) — nicht bei Ankunft (sonst „Hineinfallen").
- Einfang als Vorbeiflug: halbe Runde Mischung Tangente↔Kreis
  (Smootherstep), Krümmung beginnt bei null; auch in der 3D-Spur.
- Pivot (Drehzentrum) = aktueller Stern; beim Wechsel wird das Bild so
  nachgeschoben, dass der neue Stern an seinem Bildort bleibt (sonst
  Sprung von 400 px). Geglättete Schiffszeit (nie rückwärts).
- Spur = wirklich geflogene Bahn in Raum-/Layoutkoordinaten, glatt
  gezeichnet. Probeflug (Pille): ohne Musik, 3 Runden à 1 s je Stern.
  web/bahn.html: 2D-Werkzeug mit Protokoll (#Nummern je Ereignis).
- Bekannte Reste: kleine Knicke ≤ 30° (Perspektive am Fangkreis),
  freies Drehen während eines Transits verschiebt den Kurs; Kepler-
  Tabellen (keplerPhase) ungenutzt im Code. Caspar_D: „nicht perfekt, aber
  besser als alles vorher — so lassen."

## Erster voller Morgenlauf mit der neuen Kette (22.08.2026, 0:xx Uhr)

Auswahlliste → Katalog → Kommentare → Analyse ×3 → Whisper (ein Song,
„Kartoffeln mit Dip", ~8 min) → Musikstil (nichts Neues) → Klangraum
neu gezeichnet. Fehlerfrei. Der rote Knopf meldet „fertig" erst am
Ende der Kette — Whisper ist der lange Schritt.

## Offen / Ideen

- Caspar_Ds Einschätzung 22.08.: Die Reise ist Vorführstück, nicht der
  Kern — der Wert des Klangraums ist „Wo landet der neue Song, was ist
  leer, was ist Zwilling, was sagt das Modell zum Prompt". Idee: drei
  Zeilen Steckbrief des Neuen im Morgenfenster.
- Reise „weiter springen" (Mindestabstand je Etappe) — Etappen sind
  oft kurz.
- Gravitationsachse der Tags (Kovarianz) statt gesäter Neigung — nur
  noch für die Gruppen-Attraktoren umgesetzt.
- Feineres Clustering innerhalb der Metal-Familie (106 Songs).
- Stilgruppen-Preset im EQ aus `gruppen[].profil` (Backlog).
- Hausregeln-Nachträge: Hausregel 21 erneut bezahlt (display:grid vs
  hidden beim Raster), „ein Tooltip mit Lebenszeit", Selektoren nach
  Umbau prüfen (Pillen ohne Handler).

## Prüfsystem und Tiefenanalyse (22.08.2026, „es bleibt hängen")

Caspar_D: „Baue ein System, das die Daten genau erfasst." → `schiffPruefung()`
in web/index.html (Konsole: `await schiffPruefung({ dauer: 10, stationen: 8 })`).
Fake-Songs ohne Ton, Zeit wird Schritt für Schritt gesetzt (kein rAF,
keine Glättung), jeder Frame legt `karteSchiffFrame.diag` ab (Phase,
Bild- und Raumposition, Radien, Zoom). Geprüft: Bild = Projektion(Raum)
(< 0,5 px), Stetigkeit im Raum, Orbitradius im Raum fest und zoom-
unabhängig, Transit mit Ankunft u = 1 am Songende, Stationswechsel über
den echten Weg (`vor(1)`), Flugkamera kehrt zurück. Optionen: zoom
(Zoomsprung mitten in der Station), kamera, dt, stationen.

Befunde und Korrekturen:
1. **Hängen am Songende**: Die Reise traf einen privaten Song; im
   Klangraum war `sichtbar` noch die gefilterte Werke-Liste (öffentlich),
   `spielenNachId` fand ihn nicht (bzw. sprang ins Werke-Register) — kein
   neuer Song, Ton aus. Jetzt ist im Klangraum die Wiedergabeliste der
   ganze Himmel, und das Register wird nicht verlassen.
2. **Orbit „zoomt nicht mit aus"**: Radien lebten in Bildpixeln; die
   Flugkamera zoomte beim Schub hinein, der Orbit schrumpfte im Raum.
   Jetzt werden die Radien je Station im Raum eingefroren; außerdem
   pausiert die Flugkamera, sobald man selbst am Rad dreht (sonst zog sie
   den Ausschnitt jedes Bild wieder heran). Kamera-Deckel 8×.
3. **Transit im Raum**: Absprung- und Eintrittspunkt werden als
   Raumpunkte gespeichert und je Frame projiziert (`projRoh`); der
   Transit ist eine Gerade im Raum, die Vorbeiflug-Gerade des Einfangs
   ebenso, das Einfangtempo in Raumeinheiten. Damit sind Zoom, Pan und
   Drehung während des Flugs unschädlich.
4. **Schiffszeit**: Hintergrund-Tab drosselt rAF auf 1 Bild/s, die
   geglättete Zeit hing minutenlang hinterher → bei > 5 s Abstand springen.
5. Kurze Songs: frühester Absprung nach einer halben Runde (Rückfall
   sprang sonst sofort ab).
Stand: 3D mit Kamera+Zoom (8 Stationen), 3D ohne, 2D mit Zoom: alles stimmig.

### Bahnebenenwechsel (22.08., Caspar_D: „wie in der Raumfahrt")
Die Hermite-Kurve (unten) ist wieder raus. Stattdessen: Die eigene
Bahnebene (e1 = Richtung zum Ziel, e2 aus der Herkunft) wird in den
letzten zwei Umläufen um die Achse e1 gekippt (Smootherstep), bis sie mit
der **Zielebene** zusammenfällt (g2 = Zielnormale × e1; die Zielebene
enthält unseren Stern, weil sie aus Ziel → dessen nächstes Ziel + unserer
Richtung gebaut wird). Dann liegen beide Kreise in einer Ebene und haben
eine echte gemeinsame Tangente: **äußere Tangente**, cos θ = (R − rT)/d,
Vorzeichen nach Umlaufsinn (σ = +1 → θ < 0), gleicher Sinn am Ziel. Der
Transit ist eine Gerade im Raum, Absprung und Ankunft exakt tangential
(Prüfstand: Absprung ≤ 2,7°, Ankunft 0°, 2-D 0,8°). Absprungzeit
analytisch (letzte Passage des Berührwinkels, für die die Restzeit
reicht; Spirale: R iteriert). Kippfenster endet zum Schubbeginn, je
Station eingefroren; ohne Lösung (Zwillinge, |c| > 1) ungekippt +
Notnagel (nächster Kreispunkt). Ziel-Fangkreis = eigener Fangkreis in
Raumeinheiten (drehfest). Einfang: Gerade und Kreis laufen mit derselben
Bogenlänge, das Tempo gleitet vom Transit- aufs Bahntempo (eine halbe
Runde). Nächstes Ziel nach dem Ziel: `karteZielDanach` (Reise:
Klangnachbar, sonst Listenfolge) — Gegenprüfung (21 Agenten) hatte die
Hilfsachse ohne Reise gefunden. 2-D: dieselbe Rechnung in z = 0.

### Nachtrag (22.08., „Sekante bei Ankunft") — teils überholt
- Caspar_Ds Bild: Schiff durchfliegt den Orbit als Sekante, fliegt zurück,
  schwenkt ein. Zwei Ursachen: (a) der Schweif wurde aus dem reinen
  Orbitmodell abgetastet und sprang zur echten (Einfang-)Position —
  jetzt zeichnet `einfangLage(t)` Schiff UND Schweif; (b) echte Knicke
  am **Absprung** (35–120° im Raum, Prüfung „knick"): die Ausrichtung
  wurde in der Projektion gesucht. Geometrie: zwei Kreise in
  verschiedenen Raumebenen haben keine gemeinsame Tangente, eine
  Gerade knickt an einem Ende. Lösung: Ausrichtung im Raum (winkel3),
  Transit als **Hermite-Kurve im Raum** (Orbittangente am Absprung,
  Zielkreis-Tangente am Ziel, Betrag 0,5 × Strecke — fast gerade, beide
  Enden knickfrei). Kein Absprung während des Einfangs; ohne
  Tangentenpunkt (Zwillinge) nächster Kreispunkt als Notnagel.
- Spur: je Darstellung (2-D/3-D) die ganze Sitzung sichtbar, auch ohne
  Reise, nie gelöscht; Sprünge (Klick/Warp) als Lücke, keine Linie quer.

### Knoten-Impulse und Ankunft auf der Schale (22.08., Schautafel web/bahn3d.html)
Caspar_D: „Das Schiff muss immer auf der Orbitschale bleiben", „Bahnebene
sukzessive mit jeder Umrundung kippen", „Transitlinien enden blind in
der Schale". Stand jetzt (in der Schautafel abgenommen: „erstklassig"):
- **Knoten-Impulse** statt gleitendem Kippen: bei jedem Durchgang durch
  die Knotenlinie (Verbindung zum Ziel, ψ = k·π) kippt die Ebene um
  ≤ 6° (KIPP_DECKEL), über ±20° Bogen geglättet (Brenndauer). Am Knoten
  sitzt das Schiff auf der Drehachse → kein Positionssprung, zwischen den
  Knoten ein Kreisbogen um den Stern. Beginn nach einer halben Runde;
  reichen die Knoten bis zum Absprung nicht, werden die Impulse größer.
  Kippgrad = Funktion des Bahnparameters th, Knotenliste je Station
  eingefroren (kippFest). Raumfahrt-Zahl: Δv = 2·v·sin(Δi/2), ~135 m/s
  je Grad in LEO — darum kleine Impulse am Knoten.
- **Ankunft auf der Zielschale**: kein Fangkreis, keine Spirale. Der
  Orbitradius des Ziels wird vorab nach derselben Regel berechnet
  (orbitRadiusPx, radienVorab) und bei Stationsstart übernommen; der
  Transit ist die äußere Tangente zwischen den beiden Orbitkreisen.
  Einfang-Mischung entfernt; nur das Tempo gleitet über eine halbe Runde
  vom Transit- aufs Bahntempo.
- Schautafel: Tetraeder aus vier Sternen, Zielebene wie in KlangTresor,
  Regler Deckel/Runden/Tempo, Protokoll, „Abstand zur Schale" = 0.
