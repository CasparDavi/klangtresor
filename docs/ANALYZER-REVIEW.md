# Analyzer-Review vom 25.08.2026

Auftrag (Caspar_D): „Codereview für den Analyzer … Was kann noch an
Altlasten weg. Was kann optimiert werden, gibt es Redundanz und was ist
für den audiophilen Klanganalysierer sinnvoll, was nicht und was sollte
noch dazukommen."

**Methode:** Vier unabhängige Prüfer lasen `web/fremd/analyzer.js`
(7873 Zeilen) und `web/fremd/analyzer-worker.js` vollständig, je mit
eigenem Blickwinkel: Altlasten, Redundanz, Laufzeitkosten, audiophile
Fachlichkeit. Alle 42 Befunde, die Code löschen oder ändern wollten,
wurden danach von Skeptikern adversarial gegengeprüft — mit den
bekannten Fallen im Auftrag: dynamisch gebaute IDs, Aufrufe über
`SunoAnalyzer.*` und `__SA`, das kern-Objekt, das MARKUP-Template, und
die Hausregel, dass datierte Kommentare Designbeschlüsse sind. Ergebnis:
**36 bestätigt, 5 verworfen, 1 unklar**, dazu 16 Hinweise ohne
Codeeingriff.

> **Zeilenverweise gelten für den Stand `974734b` (25.08.2026).** Jede
> spätere Änderung verschiebt sie. Wer hier liest, prüft die Stelle nach
> — dieselbe Warnung wie in ANALYZER-PRUEFUNG.md, aus demselben Grund.

---

## 1. Sicher löschbar (bestätigt, zusammen rund 300 Zeilen)

- **~185 Zeilen Standalone-Reste ohne Aufrufer** — Nachzügler des
  Ausbaus vom 25.08.: die drawEnvelope-Kette (am Aufrufpunkt 6216 durch
  `drawLufsHist(msg.lufs)` ersetzen), `extractUUID`, `mp3Cache`, der
  `#song-info`-Block in analyzeFile, zwei `_blobURL`-Leerläufe.
  Ausdrücklich stehen lassen: `setStatus`/`setProgress` (abgesichert,
  25.08.).
- **`fetchMeta()`** (5615–**5671**, 57 Zeilen) — würde suno.com
  abfragen; der einzige Rufer war `analyze()`, seit 25.08. ausgebaut.
  ⚠ Der Skeptiker hat die Löschgrenze korrigiert: **nur bis 5671** —
  ab 5673 beginnt der lebende Kommentar „ZUSATZ FÜR MYSUNO". Mit der
  Funktion fällt die zweite (tote) Fremdadresse und die letzte Nutzung
  von `DEMUCS_URL` außerhalb des Demucs-Blocks. Den überholten Kommentar
  bei kopfFuellen (7634–7641, „Fremde Songs behalten den alten Weg")
  mitschreiben.
- **`#export-section`-Markup** (584–612, 29 Zeilen) plus Selektor in
  Z. 46 — der Kommentar-Generator ist ausgebaut, sein Markup blieb.
  **Wichtig vor jeder Veröffentlichung: die Persona-Textarea (608–610)
  trägt Caspar_Ds Klartext-Selbstbeschreibung**, die nichts mehr nutzt.
  Der Schutzkommentar „Stillgelegt, nicht gelöscht" (Z. 39–45) ist für
  diese Sektion überholt: es gibt keine Funktion mehr, die ins Leere
  greifen könnte, und das Wiedereinschalten ist keine Zeile mehr.
- **`kern.abgelegt()` samt `ablageVorhanden()`** (7851–7853, 5695–5697)
  — der Rückgabewert von `aufbauen()` wird nirgends aufgefangen.
- **Sieben tote CSS-Regeln** für Elemente aus dem Standalone-/
  Pitch-Ausbau (`input[type=text]`, `button.p`, `.g2`, `#progress-wrap`,
  `#sa-transport` …). `#status`/`#progress-bar` (525/527) nur zusammen
  mit einer Entscheidung über den Wiederbelebungsweg anfassen.
- **Die Byte-zu-Amplitude-Tabelle doppelt** (7066–7077) — die
  Analyzer-Kopie ist zugleich tot; das globale `AMP` deckt alles.
- **`window._struktur`** — wird bei jeder structure-Nachricht gesetzt,
  nirgends gelesen. Entfernen oder als Konsolen-Sichtfenster
  kennzeichnen (wie `window._ablageSpur`).
- **Der bipolar-Zweig in linienSpurenZeichnen** (~15 Zeilen) —
  unerreichbar und zugleich ein Duplikat von abweichungSpurZeichnen.

## 2. Zwei echte Fehler

- **Latenter Absturz:** Im Rückfallzweig von `drawFluxFromFrames`
  (6624–6632) steht eine verwaiste Kopie der Bandbeschriftung, die beim
  Lauf werfen würde — der Zweig zeichnet eine Summenkurve ohne Bänder.
  Ersatzlos streichen.
- **Lesen hinter dem Array-Ende:** In den FFT-Vorschaurunden schickt der
  Worker heruntergerechnete Frames (max. ~2000 Spalten), meldet aber
  `msg.numFrames` als volle Zahl. `_spectroPerc` und der
  Spektrogramm-Bildaufbau lesen dann weit hinter dem Array-Ende — die
  Vorschaubilder sind falsch. Fix: `frames.length/bins` statt
  `msg.numFrames` als Spaltenzahl, oder Perzentile/Bild nur in der
  Endrunde.

## 3. Laufzeit und Speicher

**Die Blockade am Analyse-Ende hat zwei Namen:**

- **`_stereoP95`**: schüttet in der Endrunde ~29 Mio Werte in ein
  ungetyptes JS-Array (>230 MB Boxen) und sortiert — synchron im
  onmessage-Handler. Ersatz: `Uint32Array(128)`-Histogramm, einmal
  durchzählen, Perzentil ablesen. ~10 Zeilen, exaktes Ergebnis,
  mehrere Sekunden und Hunderte MB GC gespart.
- **`_spectroPerc`**: rechnet in **jeder** der fünf FFT-Runden 512
  Sortierungen (Endrunde über je ~56 000 Werte, grob 1–3 s Hauptfaden).
  Nur in der Endrunde rechnen — behebt zugleich das OOB-Lesen.

**Rechnen für Unsichtbares** (je 1–2 Zeilen Wache):

- `densityLoop` rechnet und malt **je Frame** ein Dichte-Spektrum in
  `#density-canvas` — liegt in `#meta`, eingebettet doppelt unsichtbar
  (CSS `!important` + `OPT.kopf:false`).
- `renderInstruments`/`detectInstruments` (~170 Zeilen) läuft bei jeder
  envelope-Nachricht und jeder FFT-Runde — fünf Sortierungen über bis
  ~56 000 Werte für eine per `!important` verborgene Sektion. Als
  einzige Sektion **ohne** OPT-Wächter. Abklemmen nach der Hausregel
  (Caspar_D, 18.08.: „abklemmen, damit es keine Rechenzeit kostet").
- `funkenZeichnen` sortiert für jede der 12 Sparkline-Karten die volle
  Reihe — **7 der 12 sind totgelegt**. Eine Zeile:
  `if (karte.dataset.totgelegt) return;` — beim Zurückholen aus SA_TOT
  kommen sie automatisch wieder.

**Ablage und Speicher:**

- **Die Maßstabsreihe** (7 Lautheitskurven) ist seit 18.08. abgeklemmt,
  wird aber weiter gerechnet und in **jede Ablage geschrieben: ~420 KB
  je Song, ~135 MB über 321 Songs.** Aus der norm-Nachricht nehmen;
  alte Ablagen bleiben lesbar (überzählige Felder stören nicht).
- Beim frischen Rechnen liegen bis zu **6 vollständige PCM-Fassungen**
  eines 5-Minuten-Songs gleichzeitig im Speicher (~700 MB Spitze).
  Drei billige Gewinne: Worker-Puffer nach isFinal nullen (−115 MB
  Dauerbelegung), `_chartData.fft.frames` nach dem Pufferflächen-Aufbau
  verwerfen, Blob-Zwischenstufen freigeben.
- Der **Ablage-Abspielweg** dekodiert die volle WAV erneut und behält
  beide Kanäle (~106 MB), obwohl der rechte nur für die
  Goertzel-Messung gebraucht wird — und die entfällt, wenn Notenzonen
  vorliegen. Erst `chromaZonenHolen` fragen, dann ggf. nur links
  behalten: ~53 MB je betrachtetem Song.
- **Vier RAF-Schleifen laufen ständig parallel** (rafProgress,
  updatePlayheads, densityLoop, Live-Spektrum). Das Live-Spektrum malt
  auch bei **Pause** 60×/s die volle Fläche neu; updatePlayheads misst
  je Frame ~20 offsetWidth. Eine gemeinsame Uhr mit Früh-Ausstieg bei
  `!LAEUFT()`.
- `drawFluxFromFrames` malt ein fillRect **je Frame** statt je
  Bildpunkt (bis ~450 000 fillRects auf 800 px) und sortiert
  `bandP95` bei jedem Zoom-Event neu — die Pufferflächen-Kur
  (Kommentar 6378–6404) wurde hier nie angewandt.
- Im norm-Handler wird `linienSpurenZeichnen` **zweimal** hintereinander
  gerufen (direkt in 6197 und via lautheitSpurenZeichnen). Eine Zeile.

## 4. Redundanz (bestätigt)

- **mm:ss-Formatierer**: zwei identische im Analyzer (`fmt`/`zeitTxt`),
  dazu fünf eigene Fassungen in index.html. Auf `fmt` vereinheitlichen
  (mit `Math.floor` — behebt den x:60-Randfall).
- **Goertzel-Kern zweimal**: `goertzelKanal` und die Inline-Kopie in
  `bassVektor`. Einen sr-Parameter ergänzen, ~10 Zeilen weniger.
- **Perzentil-Muster fünfmal ausgeschrieben** → ein Helfer
  `perzentil(werte, p)`.
- **`zahl(v)` zweimal identisch**; Millisekunden-Formatierung doppelt
  mit inkonsistentem Dezimaltrennzeichen (Punkt/Komma).
- **chromaZonenZeichnen / chromaTaktZeichnen** zeichnen dasselbe Bild
  mit zwei Kopien derselben Routine → eine Zeichenfunktion, beide
  Aufrufer mappen nur ihre Daten.
- **Attack-Berechnung zweimal wortgleich** in nachrichtVerarbeiten —
  die fft_partial-Kopie (6344–6368) streichen.
- **rafProgress und updatePlayheads** treiben dieselbe Abspielanzeige —
  zusammenlegen.
- `spurSichtSetzen` führt eine Höhenkarte, die die Zeichner über
  `data-h` größtenteils selbst liefern → eine Quelle je Höhe.

## 5. Audiophile Fachlichkeit

### Das Rückgrat ist echt — nicht anfassen

- **True Peak mit echter 4-fach-Überabtastung** (12-Tap-Hann-Sinc,
  mathematisch verlustfrei beschleunigt), **LUFS-Gating exakt nach
  BS.1770-4** (400 ms/100 ms, −70 LUFS absolut, −10 LU relativ), die
  **K-Gewichtung aus der analogen Vorlage je Abtastrate vorverzerrt**
  (pyloudnorm-Konstanten — damit stimmt auch 44,1 kHz), **LRA nach
  EBU Tech 3342**.
- Methodisch überdurchschnittlich: Notenzonen-Chroma per Goertzel mit
  konstanter Güte direkt auf den Halbtonfrequenzen (Raster aus dem
  Bass-Stem, Beträge beider Kanäle addiert); Lautheitskurven auf
  Fenstermitte mit ehrlichen NaN-Rändern; die Stapelspur stapelt in
  **Energie** statt Dezibel; das Spektrogramm-Warnband (weiß =
  abgeschnitten, pink = unter 1 dB Luft); Live-Spektrum mittelt in
  Amplitude, nicht in Byte-Dezibel.

### Fachlich falsch oder schief (bestätigt)

- **Zwei Texte behaupten eine dynamische Streaming-Regelung, die es
  nicht gibt.** Normalisierung ist ein **statischer** Verstärkungswert
  je Track aus der integrierten Lautheit. Falsch daher: „Schwankung …
  überlebt die Regelung nicht" (LRA ist verstärkungsinvariant) und die
  Bahn „Lauter als das Ziel — wird beim Abspielen heruntergeregelt"
  (eine 3-s-Strecke wird nicht einzeln abgesenkt). Bahnen behalten,
  Kausalbehauptungen korrigieren; einzig realer Sonderfall: Anheben
  leiser Tracks kann in einen Begrenzer laufen.
- **Clipping zählt Einzelwerte statt Läufe** (|x| ≥ 0,9999): ein heißes,
  sauberes Master gilt als „übersteuert", und Float-Overshoots der
  Kodierkette zählen mit. Zusätzlich Läufe ≥ 3 zählen und nur diese
  „übersteuert" nennen; die Einzelwertzahl als „Werte am Anschlag"
  weiterführen. Kosten null (derselbe Durchgang).

### Was fehlt — nach Nutzen für den Modellvergleich v2 → v4.5+

1. **Die Tiefpasskante, richtig gemessen.** `v-grenz` ist zu Recht
   totgelegt — Ursache ist das 160-Logband-Raster (oberhalb 16 kHz ist
   ein Band 700–900 Hz breit), nicht die FFT (11,7 Hz je Bin, längst
   fein genug). Im bandVerlauf-Durchgang das mittlere Leistungsspektrum
   je Bin akkumulieren (2048 Floats, praktisch kostenlos); Kante =
   höchste Frequenz, ab der der Pegel dauerhaft ~30 dB unter der
   1–8-kHz-Referenz bleibt, dazu **Flankensteilheit in dB/kHz** (steil
   = Codec-/Modell-Tiefpass, flach = natürlicher Rolloff). Vermutlich
   **die wertvollste Einzelmessung für den Modellvergleich**. Nur auf
   WAV seriös — das MP3 trägt seine eigene Encoderkante.
2. **Stereo-Korrelation als Verlaufsspur.** `korrVerlauf` liegt
   vollständig vor (400-ms-Fenster), sichtbar sind nur
   Ausnahme-Strecken < −0,10. Eine bipolare Spur (−1…+1) nach dem
   Muster von abweichungSpurZeichnen: Rechenkosten null, und man sieht,
   ob v4.5 breiter mischt als v2 und ob der Korrelationsgrad über
   Strophen/Refrains atmet.
3. **PSR** (True Peak minus Kurzzeit-Maximum, AES TD1004) — die
   aussagekräftigere der beiden Reserven („totkomprimierte Refrains"
   vs. „wirklich dynamisch"). ⚠ `kurzMax` ist wegen NaN-Rändern in
   allen 321 Ablagen NaN (`Math.max.apply` über NaN) — NaN-sicher
   bilden behebt beides zugleich.
4. **Zwei billige Artefakt-Näherungen** im bestehenden Durchgang:
   Energie **oberhalb der gemessenen Kante** („Birdies") und der
   **Rauschteppich** (mittleres Spektrum der leisesten 5 % der
   Fenster). Echte Aliasing-Detektion bewusst nicht: forschungsnah,
   teuer, viele Fehltreffer an Musik.
5. **MP3-Rückfall kennzeichnen.** Die Analyse läuft richtig auf dem WAV
   (index.html:11802), fällt aber bei Songs ohne WAV **stumm** auf das
   192-kbps-MP3 zurück, und die Ablage ist ununterscheidbar. Aus MP3
   seriös: LUFS/LRA/PLR, BPM, Struktur, Chroma, Panorama. Zwingend WAV:
   Tiefpasskante, True-Peak-Urteil, Clipping, Rauschteppich, alle
   Artefakt-Indikatoren. Quelldatei als Feld in die Ablage stempeln.
   Und die Einordnung: auch das WAV ist das Ende von Sunos
   Erzeugungskette — gemessen wird immer Modell + Pipeline, und genau
   dieser Verbund ist das Vergleichsobjekt.

## 6. Entscheidungsfragen (kein Selbstläufer)

- **`#stems-section`** (~390 Zeilen Code + 53 Markup): der ganze
  Demucs-Player hängt an `OPT.demucs`, das nie übergeben wird.
- **`#essentia-section`** (~325 Zeilen): hängt an `OPT.essentia`, nie
  übergeben — und trägt die **letzte Fremdadresse**
  (`caspardavi.github.io`, zwei ONNX-Modelle, Z. 4422).
  `mixToMono`/`resampleLinear` gehören zum Cluster.
  → OFFEN.md Abschnitt 3 sagt teils „ganz ausgebaut", der Code
  widerspricht. Entweder beide Sektionen wirklich entfernen (damit
  fällt die Fremdadresse) oder den Beschluss richtigstellen.
- **`spurBild`/`spurTopline`**: kein einziger Aufrufer, aber
  HAUSREGELN.md führt sie als vorgehaltenen Werkzeugkasten („Nichts von
  Hand nachbauen …"). Widerspruch im Haus: entweder die
  Befundspur-Toplines wirklich darüber führen, oder streichen und die
  Hausregel ändern.
- **Horizontband-Reste** (`abstandZurUmgebung`, `gleitMittel`,
  UMGEBUNG_-Konstanten, ~71 Zeilen): technisch tot, aber der
  Abklemm-Beschluss Z. 302–306 deckt sie vermutlich. Urteil: unklar.

## 7. Von den Skeptikern verworfen — Hausbeschlüsse halten

- **SA_TOT-Rechnungen** (bpm_curve ~380 Mio Op., vocal_analysis)
  weiter laufen zu lassen ist datierter Beschluss vom 23.08.: „Sie
  werden weiter GERECHNET und abgelegt."
- **Die drawCurve-Familie** deckt das Zitat vom 18.08.: „nicht
  wegwerfen, nur verschwinden lassen oder abklemmen" (wörtlich an zwei
  Stellen im Code).
- **Das Lautheitshistogramm** (linkskanalig, ohne K-Gewichtung) ist
  dokumentiert und bekannt — kein Neufund.

## 8. Empfohlene Reihenfolge

1. **Ein-Zeilen-Wachen**: funkenZeichnen, densityLoop,
   renderInstruments, doppelter linienSpuren-Aufruf — sofort spürbar,
   minimales Risiko.
2. **Die zwei Bugs**: Flux-Rückfall-Absturz, OOB-Lesen der
   Vorschaurunden.
3. **Die Blockade**: _stereoP95-Histogramm, _spectroPerc nur Endrunde.
4. **Maßstabsreihe** aus der norm-Nachricht (−0,4 MB je Ablage).
5. **Löschungen** aus Abschnitt 1 — die Persona-Textarea zuerst
   (öffentliches Repo).
6. **Fachliche Korrekturen**: die zwei Regelungs-Texte, Clipping-Läufe.
7. **Neue Messungen**: Tiefpasskante, Korrelationsspur, PSR (+
   kurzMax-Fix), Artefakt-Näherungen, MP3-Stempel.
8. **Entscheidungen** aus Abschnitt 6 fällen.
