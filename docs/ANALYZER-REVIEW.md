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
> — dieselbe Warnung wie in ANALYZER-REVIEW.md, aus demselben Grund.

---

## Stand der Umsetzung (25.08.2026, Abend)

**Umgesetzt und einzeln belegt** (Commits vom 25.08.): die drei
Streaming-Texte und die Clipping-Läufe (1); beide Bugs und beide
Histogramm-Kuren (2, 3); die Fragenkarten samt Gesundheitscheck; die
Höhenkante (neu, ersetzt v-grenz); die Korrelationsspur; PSR samt
kurzMax-Heilung; die Pufferflächen-Kur fürs Flux-Bild; sämtliche
Löschungen aus Abschnitt 1 (Standalone-Reste, fetchMeta, export-section
mit der Persona-Textarea, kern.abgelegt, _blobURL, extractUUID,
mp3Cache, _struktur, Attack-Kopie, bipolar-Zweig, Byte-Tabelle war
bereits fort); die Maßstabsreihe fährt nicht mehr in die Ablagen; die
Wachen für densityLoop, renderInstruments und die totgelegten
Funken-Karten; rafProgress ging in updatePlayheads auf; das
Live-Spektrum ruht bei Pause; fmt/zeitTxt sind eine Uhr (floor statt
round); kaskadeName ersetzt seine zwei Inline-Kopien; das Chroma-P95
rechnet einmal je Datenstand; data-h hat Vorrang vor der Höhenliste.

**Nachtrag (25.08.2026, spät): Caspar_D hat die Entscheidungsfragen
entschieden** — „1 wegwerfen / 2 wegwerfen / 3 umstellen / 4 Rückweg
aufgeben / 5+6 wenn wir keine Daten dabei verlieren, die nicht effizient
wiederzubeschaffen wären, weg damit." Alles umgesetzt:

- **Essentia-Sektion gelöscht** (Block, Markup, CSS, phIds, mixToMono/
  resampleLinear): damit fiel die letzte Fremdadresse
  (caspardavi.github.io) — der Analyzer ist endgültig netzfrei. Titel
  jetzt „v5 · offline".
- **Demucs-Sektion gelöscht** (Server-Anbindung, Player, Markup, CSS,
  __SA-Einträge). Der STEM_RANG-Farbblock (Hausbeschluss 24.08.) wohnte
  versehentlich dort und wäre fast mitgefallen — er steht jetzt bei den
  Einzelspuren, zu denen er gehört. Die Einzelspuren selbst kommen
  weiter aus dem Trennlauf (bin/stems.js), der am 25.08. alle
  321 Songs × 6 Stems fertiggestellt hat.
- **spurBild/spurTopline umgestellt**: spurTopline kann jetzt x-Versatz
  und Deckung, und alle Hand-Toplines (Taktmarken, Befundspur-Blöcke,
  Chroma-Zellen in beiden Bildern) rufen es; der Einzelspuren-Zeichner
  baut sein SVG über spurBild. Die Hausregel „Nichts von Hand
  nachbauen" stimmt wieder.
- **Rückweg aufgegeben**: setStatus/setProgress samt aller Rufstellen
  und der #status/#progress-CSS gelöscht; Fehlermeldungen gehen in die
  Konsole, den Fortschritt zeigen die Karten (chart-pending) selbst.
- **Worker-Puffer**: left/right werden nach der letzten
  fft_partial-Nachricht genullt (~115 MB frei; die Nachrichtenreihen-
  folge ist geprüft, fft_partial isFinal ist die letzte). **Rechter
  Kanal**: wird auf keinem Weg mehr vorgehalten (~53 MB je Song);
  goertzelKanal misst dann mono, die maßgebliche Zonen-Messung kommt
  ohnehin stereo aus bin/toene.js. Bedingung erfüllt: alles ist aus
  audio.wav jederzeit neu dekodierbar, verloren geht nichts.
- Geprüft: Ablage-Weg und Frischanalyse liefern identische Werte
  (LUFS −13,9 am Prüfsong), Zoom/Playheads laufen, Export-Selbst-
  prüfung Exit 0.

**Der Stand vom 25.08. ist überholt** — nachgeprüft am 26.08.2026:

- **zahl-Doppel**, **Höhenkarten-Doppel** und der
  **linienSpuren-Doppelaufruf**: bestätigt nicht mehr vorhanden.
- **chromaZonen/chromaTakt-Zusammenlegung** und **Goertzel-sr** hingen
  am „vorgehaltenen Werkzeug-Cluster". Der ist am 25.08.2026 gelöscht —
  `chromaTaktZeichnen` mit 275 Zeilen, der Bass-Lader und sechs
  Hilfsfunktionen, darunter `goertzelKanal`. Damit sind beide Punkte
  gegenstandslos: Es gibt nur noch eine Zonen-Rechnung, und die steht
  in `bin/toene.js`.
- **Abschnitt 3 (Laufzeit) ist vollständig erledigt.** Nachgesehen:
  `_stereoP95` und `_spectroPerc` haben beide eine Wache und rechnen nur
  noch einmal je Datenstand; von der Maßstabsreihe und `rafProgress`
  stehen nur noch Kommentare, die auf ihren Ausbau verweisen.
- **Der rechte Kanal wird wieder vorgehalten** — und zwar mit Absicht.
  Am 25.08. war er gestrichen worden („wird auf keinem Weg mehr
  vorgehalten, ~53 MB je Song"); seit dem 26.08. trägt er das
  R-Spektrogramm, die Summe |L|+|R| und alle Größen, die vorher nur den
  linken Kanal sahen. Er wird nach der letzten fft_partial-Nachricht
  genullt, zusammen mit dem linken — der Speichergewinn bleibt also,
  nur eben nach der Rechnung statt vorher.

**Was am 26.08.2026 dazukam:** vier Spektrogramm-Register (L, R,
|L|+|R|, Seitenlage) mit vorgerechneten Bildern; beide Kanäle statt nur
links in Hüllkurve, Energie, Lautheit, Scheitelfaktor, Chroma, Fluss,
Entropie und Abschnittserkennung; eine eigene Chroma-Rechnung mit 8192
Punkten, Gipfelauswahl und parabolisch verfeinerter Scheitelfrequenz.
Belege in den Commits `031a315`, `a735f90`, `3352a99`.

**Abschnitt 5, Punkt 4 — verworfen (26.08.2026).** Die zwei
Artefakt-Näherungen setzen eine scharfe Tiefpasskante voraus, über der
ein Codec Artefakte streut. Die gibt es in den Suno-WAVs nicht.
Gemessen mit ffmpeg-Bandpässen an fünf Songs, Abfall von 17 auf 21 kHz:
8,5 · 19,6 · 18,2 · 11,8 · 14,0 dB — ein allmählicher Rolloff über vier
Kilohertz. Ein MP3-Tiefpass macht dort über 40 dB auf einem Kilohertz.
Ohne Kante gibt es kein „oberhalb der Kante"; man würde Rauschen messen
und Artefakte nennen. Der Rauschteppich läge bei allen Songs um −90 dB.
Was zwischen den Songs wirklich schwankt, ist der Höhenanteil — bei
17 kHz von −50,8 bis −82,5 dB —, und das zeigt die schon gebaute
Höhenkante samt Flankensteilheit bereits. (Caspar_D: *„ist es sinnvoll,
diese zwei Artefakt-Näherungen noch zu implementieren?"* — nach dieser
Messung: nein.)

**Abschnitt 5, Punkt 5 — erledigt (26.08.2026).** Caspar_D: *„MP3 sollte
gar nicht genutzt werden, immer vom WAV ausgehen, es sind ja alle da."*
Der Analyzer nahm schon immer das WAV, unabhängig von der Hörwahl; was
fehlte, war der stille Rückfall für Songs ohne WAV und die
Kennzeichnung. Beides gemacht:

- Fehlt das WAV, wird **nicht mehr gemessen**, sondern übersprungen und
  in die Konsole geschrieben. Lieber keine Messung als eine, die anders
  heißt, als sie ist. Geprüft: alle 321 Songs haben ihre WAV, der Fall
  tritt derzeit nicht ein.
- Der Ablagekopf trägt jetzt `quelle` neben `stand` und `messweg`.
- **`MESSWEG` steht auf 3** — die Zählung war seit dem 25.08. überholt,
  weil das Verfahren sich geändert hat (beide Kanäle im Zeitbereich,
  eigene Chroma-FFT). Die Begründung steht bei der Zählung.

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

---

## 9. Die Meßprüfung — was davon offen blieb

Neben diesem Review lief eine zweite Untersuchung: `ANALYZER-REVIEW.md`,
sechs Prüfberichte, die jede Meßgröße gegen Kunstsignale mit bekannter
Antwort und gegen unabhängige Werkzeuge (ffmpeg, eigene Feinspektren)
hielten. Sie fand **60 Befunde**.

Am 25. und 26.08.2026 sind **43 davon erledigt** — fast alle nicht durch
Reparatur, sondern weil die Rechnung dahinter gefallen ist: die alte
Stimmerkennung, die Temposchätzung, die Kirchentonart, der Schimmer, die
zehn verborgenen Karten und alles, was nur sie fütterte. Die Begründung
steht jeweils als Kommentar an der Stelle, wo die Rechnung stand; die
Belege in der Historie (`ea62d34`, `3b09043`, `41b6023`, `4518334`,
`fcc9354`, `ab6ba82`, `94926f9`, `a735f90`, `3352a99`).

Die Meßprüfung selbst ist damit aufgelöst. Was von ihr bleibt, steht
hier: der Methodenteil und die 17 Befunde, die noch gelten.

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

> **ERLEDIGT (Stimmerkennung).** das Verfahren ist am 25.08.2026 ausgebaut. Der Bericht bleibt, weil er die Meßmethode zeigt und weil er belegt, wie weit eine Zahl danebenliegen kann, ohne aufzufallen.


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

> **ERLEDIGT (Tonart).** am 24.08.2026 mit b69e898 gefallen, samt Krumhansl-Tabellen.


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


### Die 17 Befunde, die noch gelten

### 12. Es gibt kein R und kein L+R — magR wird gerechnet und weggeworfen
**mittel** · `analyzer-worker.js`:943, `bin/vorrechnen.js`

**Fehler:** Der Rechenkern bildet in jedem Rahmen `magR`, das Spektrum des rechten Kanals (`analyzer-worker.js`:943), benutzt es aber nur für die Seitenlage und wirft es dann weg. Abgelegt werden je Song genau zwei Bilder: `<id>.spektro.webp` (linker Kanal) und `<id>.stereo.webp` (Seitenlage). Der rechte Kanal für sich und die Summe beider gibt es nirgends. Dazu stimmt der Kommentar „spectro (mono)" an Zeile 945 nicht: `var ch = left` (Befund 34), es ist der linke Kanal allein — die Beschriftung im Analyzer sagt das seit dem 25.08.2026 auch so.

**Wirkung:** Caspar_Ds Wunsch nach vier Registern (L, R, L+R, Seitenlage) ließ sich am 25.08.2026 nur zur Hälfte erfüllen. Es sind die zwei vorhandenen Bilder geworden.

**Vorschlag:** Der Weg ist kurz, weil die Bildmathematik schon geteilt ist: `bin/vorrechnen.js` lädt `web/fremd/analyzer-worker.js` mit `new Function` und rechnet dieselben Bildpunkte, die der Browser rechnen würde — es gibt keine zweite Fassung, die auseinanderlaufen könnte. Zwei weitere Bilder je Song, `<id>.rechts.webp` und `<id>.summe.webp`, und der Analyzer lädt sie wie die anderen beiden. Eigene Meßreihen braucht es dafür nicht: Aus dem linken Kanal und der Seitenlage `p` folgt `|R| = |L|·(1−p)/(1+p)` und `|L|+|R| = 2·|L|/(1+p)`, bei einer Auflösung von 1/127 für p mit einem Fehler unter 0,2 dB. Kosten: rund 5 MB je Song mehr in `library/analyse/`.

**Berichtigung (25.08.2026):** Hier stand zuerst, die Spektrogramm-Rahmen seien nach dem Zeichnen weg und deshalb liefe der Zoom ins Leere. Das erste stimmt — `window._chartData.fft.frames` ist bei aus der Ablage geladenen Songs undefiniert —, das zweite nicht: Genau für diesen Fall gibt es den `ohneRoh`-Zweig in `_drawSpectrogramFromFrames` (`analyzer.js`:6801). Er zeichnet aus `window._pufferFlaechen`, den Flächen aus den gespeicherten Bildern, und zwar ausschnittweise nach `viewStart`/`viewEnd` — der Zoom arbeitet also über die Bilder, in mehreren Auflösungsstufen bis 16383 px Breite. Daß die Rohdaten nach dem Zeichnen fallen, ist Absicht und kein Fehler.

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

### 39. An einer Spektrumskante mittelt medianVon zwei Welten — ein Phantomton bei 15106 Hz
**mittel** · `analyzer-worker.js`:489

**Fehler:** Die Nachbarschaft besteht aus genau 10 Bändern (Zeile 532-536: d=−6..+6 ohne |d|≤1), also einer geraden Anzahl. medianVon() mittelt dann den 5. und den 6. Wert (Zeile 489). Fällt das Spektrum in der Nachbarschaft steil ab — bei einer MP3-Tiefpasskante liegen die fünf oberen Nachbarn 40 dB unter den fünf unteren —, so sind der 5. und der 6. Wert genau die beiden Werte diesseits und jenseits der Kante. Der 'Nachbarschaftspegel' wird zum arithmetischen Mittel zweier Pegel, die nichts miteinander zu tun haben, und liegt bei keinem der beteiligten Bänder.

**Beleg:** 'Wolkenbruch' (c2d89acc), audio.mp3: der Kern meldet 15106 Hz als STÄRKSTEN stehenden Ton, +20,1 dB in 82 % der Rahmen, schwere 1,00 (rot). Im Feinspektrum steht dort nichts: stärkste Linie 14987 Hz mit +2,1 dB. Das mittlere Bandspektrum fällt an der Stelle monoton: 14468 Hz −26,0 · 15106 Hz −27,2 · 15773 Hz −27,9 · 16469 Hz −33,0 dB. In 100 % der zählenden Rahmen ist der 5. Wert ein Band oberhalb der Kante und der 6. eines unterhalb, z. B. Rahmen 0: Band 15106 Hz = −32 dB, 5. Wert 17954 Hz = −73 dB, 6. Wert 13271 Hz = −29 dB → 'Nachbarschaft' = −51 dB → Hervorhebung +19,0 dB. In 18 von 26 geprüften MP3s tritt derselbe Phantomton auf, im Mittel mit +20,0 dB angezeigt bei +1,6 dB echter Hervorhebung.

**Wirkung:** Auf verlustbehaftetem Material erzeugt das Verfahren einen Spitzenbefund, wo kein Ton ist — und zwar mit dem höchsten Schweregrad, also ganz oben in der Liste. Reichweite: bin/vorrechnen.js liest audio.wav, wenn vorhanden (alle 321 Songs haben eine), dort fehlt die Kante und der Phantomton bleibt aus; im Browser trifft es jede eingeworfene MP3-Datei. Zur Kontrolle nachgerechnet: derselbe Song über audio.wav meldet 15106 Hz nicht, über audio.mp3 sowohl bei 44,1 als auch bei 48 kHz.

**Vorschlag:** Die Nachbarschaft auf eine ungerade Anzahl bringen (echter Median statt Mittelwert zweier Werte) und Bänder oberhalb der ermittelten Grenzfrequenz — grenzfrequenz() rechnet sie ohnehin, Zeile 497 — aus der Nachbarschaft ausschließen.

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

**Betrifft seit dem 25.08.2026 nur noch die Grenzfrequenz.** Der Schimmer, der dieselben Bänder las, ist gefallen — dieser Befund wiegt damit leichter, gilt aber weiter.

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

### 53. Die Onset-Reihe zählt mit einer absoluten Schwelle und mißt damit Pegel, nicht Anschläge
**niedrig** · `analyzer-worker.js`:692

**Fehler:** if(diff[j]>0.01) — eine feste Schwelle auf die Differenz einer nicht normierten Amplitudenhüllkurve. Ob ein Rahmen als Anschlag zählt, hängt damit an der Aussteuerung der Datei, nicht an der Musik. Außerdem wird nicht auf Gipfel geprüft: gezählt wird jeder der 50 Zehn-Millisekunden-Rahmen einer halben Sekunde, dessen Hüllkurve gestiegen ist. Die Obergrenze der Reihe ist dadurch 50 je Sekunde.

**Beleg:** Aus den abgelegten Analysen aller 321 Songs (Skript onsets.js): Die Korrelation der mittleren Onset-Dichte mit der Lautheit (LUFS) beträgt r = 0,616. Die höchsten Dichten im ganzen Archiv haben die Naturaufnahmen ohne jeden Anschlag: "Murmelnder Bach" 36,1/s, "Wolkenbruch" 38,4/s, "Wind im Wald" 34,3/s — bei einer theoretischen Obergrenze von 50/s. Also werden dort drei von vier Rahmen als Anschlag gezählt.

**Wirkung:** Die Kurve "Anschläge je Sekunde" ist bei rauschhaftem Material am höchsten und bei klarem Schlagzeug niedriger. Als Anschlagsmaß ist sie nicht brauchbar; als Lautheitsmaß ist sie überflüssig, weil die Lautheit daneben nach Norm gemessen wird.

**Vorschlag:** Auf Gipfel prüfen statt auf Anstiege, und die Schwelle relativ setzen (etwa Median plus ein Vielfaches der Streuung der diff-Reihe des Stücks).

### 57. 37 der 160 Bänder sind Dubletten — unter 193 Hz lesen benachbarte Bänder denselben FFT-Bin
**niedrig** · `analyzer-worker.js`:476

**Betrifft seit dem 25.08.2026 nur noch die Grenzfrequenz und Höhenkante.** Der Schimmer, der dieselben Bänder las, ist gefallen — dieser Befund wiegt damit leichter, gilt aber weiter.

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
