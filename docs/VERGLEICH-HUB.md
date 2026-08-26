# KlangTresor neben dem Music AI Multi-Tool Hub

Aufgenommen am 26.08.2026, nachdem Caspar_D auf
<https://music-ai-multi-tool-hub.pages.dev/> gestoßen war und fragte: *„da wo
wir scheitern, wie machen die das"*.

Der Hub ist ein Werkzeugkasten für KI-Musik von **@spupuz**, mit @flickerlog
als Tester. React, TypeScript, Tailwind, auf Cloudflare Pages, mit
Proxy-Relais zu Suno und Gemini. Rund zwanzig Werkzeuge, ausdrücklich nicht
kommerziell. Quelltext: `github.com/spupuz/music-ai-multi-tool-hub`.

## Zuerst die Lizenzlage

**Das Repo hat keine LICENSE-Datei.** Damit gilt das gesetzliche „alle Rechte
vorbehalten": Wir dürfen von dort **keine Zeile** übernehmen — auch nicht
sinngemäß umgeschrieben. Anschauen und daraus lernen ist erlaubt, kopieren
nicht.

Musiktheoretisches Allgemeinwissen ist davon nicht berührt. Daß in Dur die
zweite Stufe ein Mollakkord ist, steht in jedem Harmonielehrbuch und gehört
niemandem.

Bemerkenswert ist ihre `AI_POLICY.md`: Jede KI-Nutzung muß offengelegt werden,
mit Werkzeugnamen und Umfang; KI-Code muß vom Menschen im laufenden System
getestet sein (*„AI must not create hypothetically correct code that hasn't
been tested"*); keine KI-erzeugten Medien im Repo. Das deckt sich mit unserer
Arbeitsweise — sie haben es aufgeschrieben.

---

## Die Tabelle

Spalten: Haben wir das? · Haben wir es besser? · Haben wir ihre Machart
geprüft und verworfen?

### AI-Musikplattformen

| Werkzeug im Hub | Haben wir? | Besser? | Verworfen? |
|---|---|---|---|
| **Music Shuffler** — Player, Visualisierung, 10-Band-EQ | Ja — Bühne, Playbar, Butterchurn | **Ja:** 8-Band-*parametrischer* EQ plus Glockenstuhl, Kompressor, Gradation, Limiter; nahtloser Anschluß mit Tempoanpassung; Stems einzeln hörbar | — |
| **Suno User Stats** — ein Nutzer, Zahlen, Trends | Ja — Autorenseite | **Ja:** Zählerverlauf über Monate statt 30 Tage; Bewegungszahlen über 7 und 28 Tage; Hirschfaktor; Tonarten; Songlängen dreifach aufgeteilt | — |
| **Compliance Check** — Titel gegen Contest-Regeln, Lyrics per Gemini auf Sprache und Altersfreigabe (G…Explicit), Stapel, CSV | **Nein** | — | Nicht verworfen, nie gebraucht — für Wettbewerbe gebaut. Die Gemini-Anbindung widerspräche „die Daten bleiben hier vor Ort" |

### Kreativ- und Inhaltswerkzeuge

| Werkzeug im Hub | Haben wir? | Besser? | Verworfen? |
|---|---|---|---|
| **Song Structure Builder** — Blöcke ziehen, daraus ein Prompt | **Nein** | — | Nein. Wir *messen* Struktur (`hatAbschnitte`, Track-Struktur im Analyzer), erzeugen aber keine |
| **Cover Art Lab** — Textauflagen, Logo, Filter aufs Cover | **Nein** | — | Nein. `bin/kacheln.js` setzt Kacheln ins Format, gestaltet aber nichts |
| **MP3 Cutter** — Wellenform, Bereich wählen, Ausschnitt laden | **Nein** | — | Nein. Unsere Exporte sind Pakete, keine Schnitte |
| **Lyric Lab** — Silben je Zeile, Formatieren, Suchen/Ersetzen, Kopfzeilen | **Nein** | — | Ihre Silbenzählung ist eine **englische** Heuristik: Vokalgruppen zählen, 18 Diphthonge abziehen, Ausnahmeliste von 30 Wörtern (`"fire": 1`). Für deutsche Texte unbrauchbar — „Feuer" hat zwei Silben |
| **Lyrics Sync** — Zeitmarken von Hand klicken, LRC-Export | Ja — Karaoke auf der Bühne | **Ja:** Whisper mit DTW *automatisch*, 256 von 321 Stücken mit Zeitmarken. Sie klicken jede Marke einzeln | — |
| **Style Architect / Concept Blender** — Prompt-Generatoren mit Sperren und Favoriten | **Nein** | — | Nein, nie versucht |

### Theorie und Messung

| Werkzeug im Hub | Haben wir? | Besser? | Verworfen? |
|---|---|---|---|
| **Chord Progressions** — diatonische Folgen, römische Ziffern, hörbar, MIDI-Export | **Nein** | — | **Unsere echte Lücke.** Siehe unten |
| **Scale & Chord Viewer** — Skalen mit ihren Akkorden, hörbar | **Nein** | — | Nein |
| **Tempo & Key — BPM** | Ja — `taktBpm` | **Ja:** aus Sunos Schlagzeiten, 306 von 321 taktfest. Wir schätzen nicht, wir fragen den Erzeuger | **Ja.** Siehe „Ihre Verfahren" |
| **Tempo & Key — Tonart** | Ja — `bin/toene.js` | **Ja:** Goertzel je Halbtonfrequenz auf dem Baß-Stem, gemessen *zwischen* den Schlägen, Tongeschlecht aus der gezählten Terz, `einsAnteil` als Maß der Sicherheit | **Ja.** Siehe „Ihre Verfahren" |
| **Metronom** mit Unterteilungen | **Nein** | — | Nein |
| **Music Theory Wiki** | **Nein** | — | Nein |

### Gemeinschaft und Beiwerk

| Werkzeug im Hub | Haben wir? | Besser? | Verworfen? |
|---|---|---|---|
| **Magic Spin · Song Deck · SparkTune** | **Nein** | — | Nein — anderes Feld. SparkTune erzeugt trotz des Namens keine Theorieaufgaben, sondern Ankündigungsposts für Wettbewerbe |
| **Resource Nexus** — kuratierte Linksammlung | **Nein** | — | Nein |
| **Analytics** — Besucherzahlen, Länder | **Nein** | — | Bewußt: KlangTresor läuft lokal, es gibt keine Besucher |

### Was wir haben und wofür es dort nichts gibt

Klangraum mit NMDS und UMAP · Stilgruppen · Analyzer mit vorgerechneten
Ablagen · Stem-Trennung · Notenzonen · Hüllkurven je Stem · Lautheit nach
EBU R128 · Störfrequenz-Detektor · Hirschfaktor · Zählerverlauf über Monate ·
Latenzmessung per Mikrofon · Whisper-Abgleich · Morgenroutine ·
Vergleichsfenster · Rabenmagie.

---

## Ihre Verfahren im Einzelnen

Nachgelesen im Quelltext, damit niemand ein zweites Mal nachschauen muß.

### Schlagzahl (`BPMTapperTool.tsx`, `detectBpm`)

```
Tiefpaß 150 Hz (BiquadFilter)
→ absolute Schwelle 0,3, lokale Maxima
→ Intervalle zwischen Spitzen, gültig 0,3…3 s (20…200 BPM)
→ Tempo = 60/Intervall, auf 5 BPM gerundet
→ Histogramm, häufigste Klasse gewinnt
```

Nur Kanal 0. Keine Prüfung der metrischen Ebene.

Das ist wörtlich unser **Befund 53** aus `ANALYZER-REVIEW.md`: *„Die
Onset-Reihe zählt mit einer absoluten Schwelle und mißt damit Pegel, nicht
Anschläge."* Und die Ebenenfrage — halbes oder doppeltes Tempo, dasselbe
gemeint — stellen sie sich gar nicht.

### Tonart (`BPMTapperTool.tsx`, `detectKey`)

```js
analyser.fftSize = 4096;
offlineCtx.startRendering().then(() => {
  analyser.getFloatFrequencyData(freqData);   // ← nur EIN Fenster
```

Die Frequenzdaten werden **nach** dem Rendern aus dem Analyser geholt. Das
liefert den Zustand des letzten verarbeiteten Blocks — bei einem Fünfminüter
also die letzten 93 Millisekunden. Danach Bin → MIDI → Pitchklasse gerundet,
ohne Gipfelverfeinerung, und ein Skalarprodukt gegen zwei selbstgemachte
Profile:

```js
const majorTemplate = [1, 0, 0.5, 0, 1, 0.8, 0, 1, 0, 0.5, 0, 0.5];
```

Das ist die Krumhansl-artige Methode, die bei uns am 24.08.2026 ausgebaut
wurde — *„eine Krumhansl-Korrelation über das Chroma des Vollmix, die an
echter Musik 1 von 20 traf"* (`bin/analyse-index.js`). Ihre Fassung ist noch
schwächer, weil sie nur ein Fenster sieht.

---

## Die eine echte Lücke: Harmonie

Wir **messen** Töne und **deuten** keine Akkorde. Dabei liegt die Grundlage
längst da — `library/notenzonen.json` führt je Zone:

```
zonen: [[vonMs, bisMs, teil, …12 Bytes]]
```

Zwölf Bytes je Zone: ein Chroma je Notenzone, gemessen zwischen den Schlägen,
auf dem Baß-Stem geerdet. Das ist eine **bessere** Grundlage als die übliche —
gängige Akkorderkenner arbeiten auf dem Vollmix mit festen Fenstern, wir haben
Zonen an echten Notengrenzen.

Was fehlt, ist der Schritt danach, und der ist Lehrbuchwissen:

**1. Akkordvorlagen.** Ein Dreiklang ist ein Muster im Chroma:
Dur = Halbton 0, 4, 7 · Moll = 0, 3, 7 · vermindert = 0, 3, 6 ·
Dominantsept = 0, 4, 7, 10. Zwölf Grundtöne mal vier bis sechs Qualitäten sind
sechzig Skalarprodukte je Zone — für den Nachtlauf nichts.

**2. Die Stufe in der Tonart.**

| | I | II | III | IV | V | VI | VII |
|---|---|---|---|---|---|---|---|
| **Dur** | Dur | moll | moll | Dur | Dur | moll | vermindert |
| **Moll** | moll | verm. | Dur | moll | moll | Dur | Dur |

Damit wird aus „G-Dur in einem Stück in C" die Aussage **V** — die Dominante.
Aus einer Folge von Zonen wird `i–VI–III–VII`.

**3. Was daraus entstünde.** Ihre Werkzeuge *erzeugen* Akkordfolgen. Wir
könnten unsere **zählen**, über 321 Stücke: die häufigste Kadenz, ein
Histogramm der Stufenfolgen, die Harmonik je Stilgruppe. Dafür gibt es keine
fertige Software.

**Ehrlich zum Aufwand:** Akkorderkennung aus Chroma ist ein Forschungsfeld,
und die ersten Ergebnisse werden mittelmäßig. Das Gegenmittel ist eingebaut —
so wie `einsAnteil` bei der Tonart zeigt, wann die Messung unsicher war, ließe
sich je Zone dasselbe bilden. Was nicht sicher ist, wird nicht behauptet.

---

## Der Schluß in drei Zeilen

**Zweimal „verworfen, weil nachgemessen schlechter"** — Tempo und Tonart. Dort
sind wir nicht hinterher, sondern vorbei.

**Einmal eine echte Lücke** — Harmonie. Die Daten liegen, die Deutung fehlt.

**Siebenmal „haben wir nicht, nie gebraucht"** — Cover-Gestaltung, MP3-Schnitt,
Prompt-Generatoren, Metronom, Wiki, Gemeinschaftsspiele. Das ist keine Lücke,
sondern ein anderer Zweck: **Der Hub hilft beim Machen, KlangTresor beim
Verstehen, was man gemacht hat.**
