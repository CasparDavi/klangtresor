# Musikalisches Clustering per KI — Recherche (Nacht 20./21.08.2026)

> **Namenswechsel:** Das Projekt hieß bis zum 24.08.2026 *MySuno*. Es heißt jetzt **KlangTresor** — „Suno" ist seit dem 06.01.2026 eingetragene Marke von Suno Inc., ausdrücklich für Software zum Abspielen und Bearbeiten von Audioinhalten. Wo in Zitaten und in der Chronik noch der alte Name steht, bleibt er stehen.

> **Nachtrag 21.08. (Tag):** Entschieden und gebaut wurde NICHT der
> CLAP-Python-Weg unten, sondern Discogs-EffNet als ONNX in Node
> (bin/klang.js, siehe MORGENROUTINE-PLAN.md Schritt 5). Grund: keine
> Python-Umgebung nötig, 6–10 s je Song, fertige Genre/Stimmungs/
> Instrument-Köpfe statt Zero-Shot. Die „Essentia verworfen"-Wertung
> unten galt der Python-Installation — das ONNX-Modell läuft problemlos.
> Was tatsächlich in die Distanz eingeht: nur das 1280er-Embedding,
> L2-normiert, Kosinus. Tags und Hausmaße dienen der Beschreibung.

Caspar_Ds Auftrag: die Songs nach KLANG clustern (nicht nach Styleprompts
— „die taugen nicht"), frei, lokal auf dem Intel-Mac, gern als
Nachtlauf. Recherchiert von zwei Agenten in der Nacht; Ziel-Anwendungen
im Projekt: Stilgruppen-Preset im EQ (Backlog seit 20.08.) und eine
Klangkarte der Sammlung.

## Teil 1: Das Embedding-Modell (die Ohren der KI)

### Empfehlung: LAION-CLAP, Modell `laion/larger_clap_music`

Der einzige Kandidat, der auf dem alten Intel-Mac mit einem simplen
pip-Install sicher läuft, alle ~320 Songs in einer Nacht durchrechnet
(60–120 s je Track auf CPU, 30-s-Ausschnitte entsprechend schneller),
kompakte 512-dim-Embeddings liefert — und den entscheidenden
Zusatztrick kann: **Zero-Shot-Beschriftung**. CLAP bettet Audio UND
Text in denselben Raum; man kann Cluster-Zentroide gegen eine Liste
von Text-Prompts halten („melancholic piano music", „aggressive
electronic dance music", Template „This is a sound of …" bringt
messbar bessere Treffer) und bekommt die Clusternamen geschenkt.

**Installation (Python 3.11):**

```bash
python3.11 -m venv clap-env && source clap-env/bin/activate
pip install torch==2.2.2 torchaudio==2.2.2 "transformers==4.57.*" \
            librosa soundfile scikit-learn
```

**Die Versionsfalle, die alles entscheidet:** torch 2.2.2 ist die
LETZTE Version mit macOS-x86_64-Wheels (Python 3.8–3.12); transformers
muss die 4er-Serie sein (4.57.x verlangt torch>=2.2 — die aktuelle v5
verlangt torch>=2.5 und fällt auf Intel aus).

- Eingabe 48 kHz; das Modell verarbeitet 10-s-Fenster, längeres Audio
  fenstern und mitteln.
- Praxisreferenz: AudioMuse-AI macht CLAP-Musik-Ähnlichkeit CPU-only,
  Minimalanforderung „4-Kern-Intel mit AVX2, ab ~2015".

### Fallback 1: derselbe CLAP als ONNX (ohne PyTorch)

Xenova/clap-htsat-unfused liefert fertige ONNX-Exporte (~619 MB);
dann reicht `onnxruntime==1.23.*` (die letzte Version mit
x86_64-macOS-Binaries; braucht macOS ≥ 13.4 — auf älterem macOS
ältere onnxruntime pinnen). Gleiches Modell, gleiche Embeddings.

### Fallback 2 / zweite Meinung: MERT-v1-95M

Rein akustisches Modell (kein Text-Encoder, also keine
Zero-Shot-Namen), 768-dim, gleicher torch-Stack plus `nnAudio`,
Eingabe 24 kHz, `trust_remote_code=True` (zickt der Modellcode mit
transformers 4.57, auf ~4.38–4.44 zurückgehen). Auf alter CPU gut
machbar (~15–40 s je 30-s-Clip); als zweite, andersartige Sicht
interessant (Embeddings konkatenieren). MERT-330M lohnt den
CPU-Aufwand nicht.

### Verworfen

- **Essentia/essentia-tensorflow** (Discogs-EffNet, 1280-dim, dazu
  fertige Genre-/Mood-Tags): fachlich gut und CPU-schnell, aber die
  Installation ist auf altem Intel-Mac praktisch tot — das einzige
  PyPI-Wheel verlangt Python 3.14 + macOS 15; Homebrew-Essentia kommt
  ohne TensorFlow. Einziger gangbarer Weg wäre Docker
  (`mtgupf/essentia-tensorflow`, amd64) — nur ziehen, wenn die
  fertigen Genre-Tags wirklich gewollt sind.
- **OpenL3**: TF-Abhängigkeitsfummelei, wenig gepflegt, qualitativ
  hinter allen dreien — Notnagel, nicht mehr.

### Quellen (Auswahl)

- torch 2.2.2 = letzte x86_64-macOS-Version: https://discuss.pytorch.org/t/why-no-macosx-x86-64-build-after-torch-2-2-2-cp39-none-macosx-10-9-x86-64-whl/204546 · https://pypi.org/project/torch/2.2.2/#files
- CLAP: https://huggingface.co/laion/clap-htsat-unfused · https://huggingface.co/docs/transformers/model_doc/clap
- CPU-Praxiszeiten: https://www.themusicase.com/blog/ai-music-analysis-audio-vectoring-how-clap-embeddings-are-changing-music-intelligence/
- AudioMuse-AI (CPU-only-Praxisprojekt): https://github.com/NeptuneHub/AudioMuse-AI-DCLAP
- MERT: https://huggingface.co/m-a-p/MERT-v1-330M · https://github.com/yizhilll/MERT
- ONNX-CLAP: https://huggingface.co/Xenova/clap-htsat-unfused · onnxruntime-x86_64-Ende: https://github.com/microsoft/onnxruntime/releases
- Essentia-Lage: https://pypi.org/project/essentia-tensorflow/ · https://essentia.upf.edu/models.html

## Teil 2: Clustering und Klangkarte

### Die Pipeline: UMAP + HDBSCAN (De-facto-Standard)

**Zwei getrennte UMAP-Läufe** — der häufigste Fehler ist, auf der
2D-Karte zu clustern (die Kompression verzerrt Dichten):

```python
# Vorher: Embeddings L2-normalisieren
umap_cluster = umap.UMAP(n_neighbors=15, n_components=5, min_dist=0.0,
                         metric="cosine", random_state=42)   # zum CLUSTERN
umap_karte   = umap.UMAP(n_neighbors=15, n_components=2, min_dist=0.1,
                         metric="cosine", random_state=42)   # fuer die KARTE
hdbscan.HDBSCAN(min_cluster_size=5, min_samples=3,
                cluster_selection_method="eom")
```

- n_neighbors 10–20 (bei ~320 Punkten 15 und 25 vergleichen);
  min_cluster_size 5–8 (≈2–3 % der Sammlung), min_samples KLEINER als
  min_cluster_size, sonst zu viel Rauschen.
- HDBSCAN erklärt gern 30–50 % zu Noise (-1) — Noise-Punkte dem
  nächsten Zentroid nachzuordnen; random_state setzen (sonst nicht
  reproduzierbar); PCA-Vorstufe bei 512 dim/320 Punkten unnötig.
- scikit-learn ≥1.3 hat HDBSCAN EINGEBAUT (sklearn.cluster.HDBSCAN) —
  das separate hdbscan-Paket kann entfallen.
- Sanity-Check: AgglomerativeClustering(cosine, average) mit
  Dendrogramm bzw. PCA(50)+k-means mit Silhouetten-Score über k=5…15.

### Song-Pooling

Drei nicht überlappende Fenster bei **10 %, 45 % und 80 %** der
Songlänge einzeln encodieren, mitteln, L2-renormalisieren (robust
gegen Intro/Outro, CPU-günstig). CLAP ist auf ~10-s-Fenster trainiert
— NIE den ganzen Song am Stück durch den Encoder. Ein Punkt pro Song.

### Cluster benennen (Zero-Shot)

Tag-Listen als Prompts encodieren, Kosinus zum Cluster-Zentroid,
Top-3 als Label. Bewährt:
- Template **„This audio is a {genre} song"** (das offizielle
  GTZAN-Prompt von LAION-CLAP); Prompt-Ensembles (mehrere Templates
  mitteln) verbessern messbar.
- Tag-Listen: GTZAN (10 Genres, grob) und vor allem die
  **MTG-Jamendo-Taxonomie** (87 Genre- + 56 Mood/Theme-Tags — beste
  freie Sammlung für Genre+Stimmung).
- Genre und Stimmung GETRENNT scoren (getrennte Softmax), sonst
  gewinnt immer das Genre.

### Fertige freie Projekte (geprüft 20.08.2026)

- **AudioMuse-AI** (2 463 Sterne, sehr aktiv): CLAP-Analyse,
  Clustering mit Parametersuche, interaktive UMAP-„Music Map" im
  Browser — will aber Docker + Medienserver (Navidrome/Jellyfin).
  Als REFERENZ lesenswert (docs/ALGORITHM.md), als Werkzeug zu schwer.
- **Deep Cuts** (rlupi, v0.1, 2026): lokaler Kollektions-Explorer,
  CLAP via ONNX (ohne PyTorch!), 3-Fenster-Pooling, UMAP-Canvas.
- MTG/music-explore, latent-musicvis, music-collection-analyzer:
  kleiner/älter.
- **Fazit**: Für KlangTresor ist der SELBSTBAU der schlanken Pipeline
  (laion-clap → UMAP → HDBSCAN → JSON → eigene Karte im KlangTresor-Stil)
  realistischer und fügt sich in Haus und Hausregeln.

### JSON-Export für die eigene Karte

Flaches songs-Array (id, titel, x/y auf 0–1 normiert und gerundet,
cluster, clusterLabel, tags, conf = HDBSCAN-Wahrscheinlichkeit) plus
separates clusters-Objekt (Label, Farbe). Bei 320 Punkten reicht
SVG/Canvas — kein deck.gl nötig. (Und im Haus gelten die Hausregeln:
Punkte mit Halo, Legende zeigt statt beschreibt …)

## Das Kurzrezept für morgen

1. Python 3.11-venv; `torch==2.2.2 torchaudio==2.2.2
   transformers==4.57.* librosa soundfile scikit-learn umap-learn`.
2. CLAP `laion/larger_clap_music`; je Song 3 Fenster (10/45/80 %),
   mitteln, L2 → embeddings.json (Nachtlauf, grob 2–5 h für alles).
3. UMAP 5D → HDBSCAN (5/3) fürs Clustern; UMAP 2D für die Karte;
   Noise nachzuordnen; AgglomerativeClustering als Gegenprobe.
4. Zentroide gegen MTG-Jamendo-Prompts („This audio is a {} song",
   Genre und Mood getrennt) → Clusternamen.
5. soundmap.json → Klangkarte in KlangTresor; Cluster-Mittel der 8-Band-
   Profile → das Stilgruppen-Preset im EQ (Backlog eingelöst).

Quellen in den Agentenberichten: UMAP-Doku (Clustering/FAQ),
HDBSCAN-Parameter-Guide, LAION-CLAP-Repo, TSPE-Paper (Prompt-
Ensembles, arXiv 2501.00398), AudioMuse-AI/ALGORITHM.md, Deep Cuts.

## Eigener Schatz (schon vorgerechnet, als Erdung der Cluster)

Für alle 321 Songs liegen lokal bereits vor: 8-Band-Klangprofile
(eq-profil.json), BPM, Tonart, LUFS, Spanne, True Peak, Korrelation
(Katalog-Analyse) und seit 21.08. die Lautheitshistogramme (hists).
Die CLAP-Embeddings sind die Hauptstimme fürs Clustern; die eigenen
Messwerte beschreiben die gefundenen Cluster in KlangTresor-Sprache
(„langsame Moll-Songs um 70 BPM mit engem Spielraum im Bass").
