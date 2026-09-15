# Modelle auf der Radeon: was die Grafikkarte im iMac für KlangTresor tun kann

Stand 15.09.2026. Anlass ist Caspar_D am selben Tag, nachdem `rife-ncnn-vulkan` die Radeon
gefunden hatte: *„ist ja cool, sollten wir mal eine recherche machen, welche modelle auf vulkan
basis die radeon nutzen koennen und welche uns davon weiterbringen."*

**Zustand: recherchiert, nichts gebaut, nichts geholt, nichts ausgeführt.** Grundlage sind eine
Inventur des Repos und drei Rechercherichtungen: Laufzeiten, Bild und Video, Audio und Text. Jede
Richtung wurde in einer zweiten Runde nachgeprüft, über GitHub-API (Lizenz, Push, Release-Dateien),
README-, LICENSE- und Workflow-Dateien, Issue-Texte, Doku-Seiten und Hugging-Face-Dateilisten.
Was nur aus dem Gedächtnis kommt, steht als *ungeprüft* da. Eigene Überschlagsrechnungen sind als
*eigene Rechnung* markiert.

Maschine, um die es geht: iMac 5K, Intel i7-10700K, **AMD Radeon Pro 5500 XT (8 GB)**, 64 GB RAM,
macOS. KlangTresor muss außerdem unter Windows (AMD, NVIDIA, Intel) und in Docker laufen.

Bezug: [VIDEO-PLAN.md](../effektclip/VIDEO-PLAN.md) §6.7, §9.7 ·
[VIDEOSTUDIO-RECHERCHE.md](../effektclip/VIDEOSTUDIO-RECHERCHE.md) Stufe 3 ·
[GESCHICHTEN-RAUM.md](../klangraum/GESCHICHTEN-RAUM.md) · `docs/BACKLOG.md` Z. 2092–2101, 2424–2433 ·
[web/fremd/LIZENZEN.md](../../web/fremd/LIZENZEN.md).

---

## 0 · Das Ergebnis in fünf Sätzen

1. **Die Radeon rechnet nur über Vulkan zuverlässig**, und Vulkan gibt es auf dem Mac nur über
   die Übersetzungsschicht MoltenVK. Metal direkt liefert bei allen ggml-Programmen (llama.cpp,
   whisper.cpp) Zeichensalat oder Abbrüche. CUDA, MLX, aktuelles PyTorch und Ollama fallen aus.
2. **Heute rechnet kein einziges KlangTresor-Modell auf der Radeon.** Alles läuft auf der CPU.
3. **Der größte sichere Gewinn liegt bei Bild und Video:** die ncnn-Programme (RIFE für
   Zwischenbilder, Real-ESRGAN für Hochskalieren) sind MIT, fertig gebaut für Mac, Windows und
   Linux, und der ncnn-Weg ist auf genau dieser Karte gemessen.
4. **Der größte Zeitgewinn läge beim Sprachmodell:** llama.cpp mit Vulkan ist auf der
   Schwesterkarte 5500M rund drei- bis viermal schneller als die CPU. Man muss es aber auf dem Mac
   selbst bauen, und es gibt bekannte Fallen (Flash-Attention, lange Prompts).
5. **Die dicksten Brocken im Morgenlauf (Stems, Whisper) haben keinen belegten GPU-Weg auf dem
   Intel-Mac.** Dazu kommt ein Warnsignal: onnxruntime liefert für Intel-Macs keine neuen Fassungen
   mehr. Die Obergrenze ist 1.23.x.

---

## 1 · Was die Radeon im Intel-iMac kann

### 1.1 Die Wege zur Karte

| Weg | Auf dieser Maschine | Beleg |
|---|---|---|
| **Vulkan über MoltenVK** (Vulkan → Metal) | **Ja.** Gemessen: `rife-ncnn-vulkan` meldet `[0 AMD Radeon Pro 5500 XT] fp16-p/s/a=1/1/1` | Eigene Messung 15.09.2026. LunarG, *The State of Vulkan on Apple* (Jan. 2026): „nearly conformant" auch für x86_64, mit „minor" Lücken ([lunarg.com](https://www.lunarg.com/the-state-of-vulkan-on-apple-jan-2026/)) |
| **Metal direkt** (llama.cpp, whisper.cpp) | **Nein, upstream kaputt** | llama.cpp [#19563](https://github.com/ggml-org/llama.cpp/issues/19563) „Metal backend produces garbage output on AMD discrete GPUs (Radeon Pro 5300M)", geschlossen *not planned* 31.05.2026. [#15228](https://github.com/ggml-org/llama.cpp/issues/15228): 0,8 Token/s auf Metal gegen 21 auf der CPU (6900 XT), *not planned*. Unser eigener Befund: whisper.cpp-Metal stürzt ab, deshalb `GGML_METAL=OFF` (`bin/whisper.js:24-27`) |
| **Metal mit Patches** | Technisch möglich, für uns nicht nutzbar | [ToshLLM](https://github.com/engeldlgado/toshllm) (Push 15.09.2026) nennt ~61 Token/s für Qwen3-8B auf einer RX 6700 XT, Herstellerangabe. **GPL-3.0**, nur macOS |
| **Core ML** (über onnxruntime) | **Ungeprüft** | In unserer `libonnxruntime.1.20.1.dylib` (darwin/x64) stehen die Symbole `CoreMLExecutionProvider` und `…::GetCapability` (strings, nichts ausgeführt). onnxruntime [#16934](https://github.com/microsoft/onnxruntime/issues/16934) (Intel-Mac, 5500M): „Even with CoreML as the backend, it appears to be running on the CPU". Core ML weicht bei nicht unterstützten Operatoren still auf die CPU aus |
| **WebGPU** (onnxruntime nativ oder im Browser) | **Ungeprüft** | onnxruntime-node-README (main) zeigt WebGPU für macOS x64 „experimental". Keine Messung für Intel-Mac mit AMD gefunden. Chrome führt laut Sekundärquelle seit Version 142 eine WebGPU-Blocklist; ob die 5500 XT betroffen ist, ist ungeprüft |
| **CUDA** | Nein | Nur NVIDIA |
| **MLX** (Apple) | Nein | Install-Doku MLX 0.32.2: Apple Silicon Pflicht ([ml-explore.github.io](https://ml-explore.github.io/mlx/build/html/install.html)) |
| **PyTorch MPS** | Faktisch nein | Keine macOS-x86_64-Pakete ab 2.3.0 ([dev-discuss](https://dev-discuss.pytorch.org/t/pytorch-macos-x86-builds-deprecation-starting-january-2024/1690), Jan. 2024) |
| **Ollama** | Nein (nur CPU) | [#13127](https://github.com/ollama/ollama/issues/13127), Maintainer 21.11.2025: „Our Vulkan support is currently focused on Linux and Windows." Offen: [#1016](https://github.com/ollama/ollama/issues/1016) „Support AMD GPUs on Intel Macs". [docs.ollama.com/gpu](https://docs.ollama.com/gpu) (15.09.2026) nennt Vulkan nur für Windows und Linux. Passt zu unserer Messung vom 28.08.2026 |
| **KosmicKrisp** (LunarGs neuer Vulkan-Treiber) | Nein | Braucht Metal 4, „only … on Apple Silicon hardware" (LunarG, Jan. 2026) |

### 1.2 Grenzen

| Grenze | Wirkung | Beleg |
|---|---|---|
| **8 GB Grafikspeicher** | Sprachmodelle bis etwa 8B in Q4 mit begrenztem Kontext. Mit vollem Standardkontext lagert der Speicher aus, dann nur noch 0,6 Token/s | Gist [khalidhalba-jhu](https://gist.github.com/khalidhalba-jhu/d066c664e2b3386856d38464cf636692) (5500M, 23.07.2026): Pflicht `-c 4096`. *Eigene Rechnung:* Qwen3-8B-Q4_K_M sind 5,03 GB, KV-Cache bei 4096 Token etwa 0,6 GB, passt |
| **Hochskalieren großer Bilder** | Abbruch bei ~2,75 GB VRAM mit `-s 4`, `-s 2` lief | waifu2x-ncnn-vulkan [#154](https://github.com/nihui/waifu2x-ncnn-vulkan/issues/154), RX 5500 XT unter Linux. Also mit Kacheln (`-t`) fahren |
| **fp16-Pfad unter MoltenVK** | Absturz `vk::ErrorDeviceLost` bei Prompts über etwa 1–2k Token | Gist khalidhalba-jhu (Revision nach Suchauszug, nicht in jeder Fassung). Für Kondensate mit langen Lyrics wichtig |
| **maxStorageBufferRange** | Einzeltensoren über dem Limit brechen ab. MoltenVK „typically 256 MB", Dozen (WSL2) 128 MB | whisper.cpp [#3777](https://github.com/ggml-org/whisper.cpp/issues/3777), gemessen nur auf Dozen |
| **Keine Matrix-Kerne** | Langsames Prompt-Einlesen | Log in Ollama #13127 („matrix cores: none"). llama.cpp [#20886](https://github.com/ggml-org/llama.cpp/issues/20886), Maintainer 05.06.2026: „It won't be fixed on our end" |
| **Flash-Attention** | Unter MoltenVK Zeichensalat oder CPU-Rückfall | llama.cpp [#20029](https://github.com/ggml-org/llama.cpp/issues/20029): Melder behebt mit `-fa 0` |
| **Subgroup-Größe AMD** | Früher Zeichensalat | MoltenVK [PR #2755](https://github.com/KhronosGroup/MoltenVK/pull/2755) (maxSubgroupSize AMD 64 → 32), gemerged 11.07.2026, **enthalten in MoltenVK v1.4.2** vom 24.07.2026 (gh compare: 18 vor, 0 hinter dem Merge). In #20029 läuft die Umgehung am 02.07.2026 auf einer **RX 5500 XT** mit Qwen3.5-9B Q4_K_M |
| **Zukunft des Intel-Mac** | Begrenzt | LunarG: Apple-Support für Intel-Macs endet „in less than two years". onnxruntime baut keine x86_64-Mac-Pakete mehr (§1.3) |
| **Docker** | GPU nur auf Linux-Hosts mit `/dev/dri` bzw. NVIDIA-Toolkit | video2x [#1356](https://github.com/k4yt3x/video2x/issues/1356) „Docker container only uses llvmpipe instead of GPU", wslg [#1215](https://github.com/microsoft/wslg/issues/1215) offen. Docker Desktop auf dem Mac reicht keine GPU durch: *ungeprüft* |

### 1.3 Warnsignal onnxruntime auf dem Intel-Mac

Das betrifft KlangTresor auch ganz ohne GPU, denn `bin/klang.js`, `bin/stems.js`,
`bin/tiefenkarten.js` und `bin/texte-einbetten.js` hängen an `onnxruntime-node`.

- Die letzte Release-Fassung mit `onnxruntime-osx-x86_64` ist **v1.23.2** (25.10.2025). Ab v1.24.1 bis
  v1.30.0 gibt es nur noch `osx-arm64` ([Releases](https://github.com/microsoft/onnxruntime/releases)).
- npm: [#27961](https://github.com/microsoft/onnxruntime/issues/27961) (offen seit 03.04.2026)
  „The build artifact to support Mac on Intel is missing in the 1.24.x series". Die Reparatur-PRs
  #27968 und #29502 sind offen. Maintainer fs-eire schreibt am 12.09.2026, das Team biete keinen
  offiziellen x86_64-Mac-Build mehr an.
- **Folge:** Die feste Fassung `"onnxruntime-node": "1.20.1"` in `package.json` ist eine Falle, die
  bewusst verwaltet werden muss. Jedes Update über 1.23.x hinaus bricht KlangTresor auf Intel-Macs.
- **Widerspruch, noch nicht aufgelöst:** Die README-Tabelle am Tag v1.20.1 zeigt macOS x64 nur mit
  CPU, ab v1.22.0 mit CoreML und WebGPU. Die installierte 1.20.1 enthält aber schon
  CoreML-Symbole. Ob sie nutzbar sind, zeigt nur eine Messung (§5, M2).

---

## 2 · Bestand heute und wo die GPU sofort helfen würde

Alle Werte aus dem Repo (Kommentare, Messnotizen, Ergebnisdateien). Bestand 324 Titel.

| Aufgabe | Skript | Modell | Laufzeit heute | Rechenzeit je Titel | Titel | Gesamt (*eigene Rechnung*) | GPU-Weg auf dem Intel-Mac |
|---|---|---|---|---|---|---|---|
| Wort-Zeitmarken (Karaoke) | `bin/whisper.js` | Whisper large-v3 (`ggml-large-v3.bin`, 3,10 GB) | whisper.cpp, CPU + Accelerate | 4:02 Musik in 5:49 (`whisper.js:26-28`, 20.08.2026) | 265 | **≈ 26 h** (bei ~6 min je Lied) | whisper.cpp-Vulkan: **unbelegt** |
| Stemtrennung | `bin/stems.js` | htdemucs_6s ONNX, 246 MB | onnxruntime-node 1.20.1, CPU | ≈ 4 min (`stems.js:38-40`) | 321 | **≈ 21 h** | CoreML: ungeprüft. demucs-rs: kein Intel-Mac-Build |
| Kondensat (10 Substantive) | `docs/eichkasten/ollama.js` | qwen3:8b | Ollama, CPU | 56 s, 2,3 Token/s (`BACKLOG.md:2424-2433`) | nicht im Betrieb (Ziel ~260) | **≈ 4 h** | llama.cpp-Vulkan: **belegt auf 5500M und RX 5500 XT** |
| Musikstil | `bin/klang.js` | Discogs-EffNet + 3 Köpfe, 27 MB | onnxruntime-node, CPU | 6–20 s (`server.js:539`, `klang.js:41`) | 324 | ≈ 0,5–1,8 h | CoreML: ungeprüft |
| Geschichten-Raum | `bin/texte-einbetten.js` | paraphrase-multilingual-mpnet-base-v2, ~200 MB | onnxruntime-node, CPU | nicht dokumentiert | 260 | – | CoreML: ungeprüft |
| Tiefenkarte (Cover) | `bin/tiefenkarten.js` | Depth Anything V2 Large fp16, ~600 MB | onnxruntime-node, CPU | 2,7 s (`tiefenkarten.js:23-28`, 14.09.2026) | 324 | ≈ 15 min | CoreML: ungeprüft |
| Zwischenbilder | – (außerhalb des Repos) | RIFE v4.6 | ncnn-Vulkan, **GPU** | nicht gemessen | – | – | **gemessen, läuft** |

**Lesart:**
- **Für einen neuen Titel** kostet der Morgenlauf etwa 10 Minuten, fast alles Whisper und Stems.
  Genau dort fehlt ein belegter GPU-Weg.
- **Der sichere GPU-Weg (llama.cpp)** trifft eine Aufgabe, die heute gar nicht im Betrieb ist.
  Erwartungswert: Ollama-Fork auf der 5500M, Qwen2.5-Coder-7B Q4_K_M von 5,7 auf 22 Token/s, also
  Faktor 3,9 ([Momin010/ollama-vulkan-macos](https://github.com/Momin010/ollama-vulkan-macos),
  README). Übertragen auf 56 s je Lied wären das etwa 15 s, der ganze Bestand in rund einer Stunde
  statt vier. *Eigene Rechnung, ungeprüft.* Das Prompt-Einlesen bleibt unter MoltenVK langsam (#20886),
  der Faktor gilt nur fürs Erzeugen.
- **Tiefenkarte und Musikstil** sind schon kurz. Eine GPU spart dort Minuten, nicht Stunden.
- Der einzige GPU-Pfad im Code ist `KLANG_CUDA=1` (`bin/klang.js:185-192`), nur Linux mit NVIDIA.

---

## 3 · Kandidaten nach Nutzen

Spalte **Belegt** heißt: läuft nachweislich auf *dieser* Radeon Pro 5500 XT unter macOS.
„Schwesterkarte" ist die 5500M (gleicher Chip Navi 14, Mobilfassung).
Aufwand: **klein** = fertiges Programm von Node aufrufen · **mittel** = selbst bauen oder
Laufzeit umstellen · **groß** = Modell umwandeln oder neues Rechenwerk.

### 3.1 Effektclip und Videostudio

| # | Kandidat | Laufzeit | Belegt | Windows / Docker | Lizenz Code / Gewichte | Aufwand | Nutzen |
|---|---|---|---|---|---|---|---|
| V1 | [rife-ncnn-vulkan](https://github.com/nihui/rife-ncnn-vulkan) (nihui) | ncnn-Vulkan | **Ja**, 15.09.2026 | Win: fertig, jede Vulkan-GPU. Docker: nur Linux mit `/dev/dri` | MIT / MIT ([hzwer/Practical-RIFE](https://github.com/hzwer/Practical-RIFE)) | klein | **Hoch.** Morph-Übergang und Zeitlupe (VIDEO-PLAN §6.7). Release 20221029, Modelle bis v4.6. `-x` (TTA) meiden: [#33](https://github.com/nihui/rife-ncnn-vulkan/issues/33) sperrt nach 10–13 Bildern das System (Vega 64, Mojave). Vulkan etwa 3× langsamer als CUDA ([#22](https://github.com/nihui/rife-ncnn-vulkan/issues/22)) |
| V2 | [Real-ESRGAN-ncnn-vulkan](https://github.com/xinntao/Real-ESRGAN-ncnn-vulkan) | ncnn-Vulkan | Nein (gleicher ncnn-Weg) | Win: fertig. Docker wie V1 | MIT / BSD-3-Clause (aus Vorrecherche, nicht erneut gelesen) | klein | **Hoch.** Cover für 1080p/4K hochrechnen. Neue Fähigkeit, in den Plänen bisher nicht erwähnt. v0.2.0 (24.04.2022), Mac-Zip 8,5 MB. Kacheln klein halten |
| V3 | [realcugan-ncnn-vulkan](https://github.com/nihui/realcugan-ncnn-vulkan) | ncnn-Vulkan | Nein | wie V2 | MIT / MIT ([bilibili/ailab](https://github.com/bilibili/ailab), gelesen) | klein | Mittel. Für KI-Illustrationen evtl. sauberer als V2 (*ungeprüft*), im Labor vergleichen |
| V4 | [rife-ncnn-vulkan (TNTwise)](https://github.com/TNTwise/rife-ncnn-vulkan) | ncnn-Vulkan, statisches MoltenVK | Nein. Release-Workflow baut ausdrücklich x86_64 auf `macos-13` | wie V1 | MIT / MIT | klein | Mittel bis hoch, falls v4.6 sichtbar schlechter ist als neuere RIFE-4.x. Mac-Zip ~830 MB |
| V5 | Tiefenkarte schneller: onnxruntime-node CoreML / WebGPU | ORT 1.20.1–1.23.x | Nein | Win: DirectML/WebGPU. Docker: CPU | Apache-2.0 / **Large CC BY-NC 4.0**, Small Apache-2.0 ([README](https://github.com/DepthAnything/Depth-Anything-V2)) | mittel | Gering bis mittel (heute 15 min für den Bestand). Wichtiger ist die **Lizenzfrage** für Large (`tiefenkarten.js:90`) |
| V6 | [BiRefNet](https://github.com/ZhengPeng7/BiRefNet) (Freistellung) | ONNX (Release v1, u. a. 512×512 fp16) | Nein, heute CPU | Win: DirectML. Docker: CPU | MIT / MIT (Gewichte im selben Repo) | mittel | Mittel. VIDEO-PLAN hat Matting zurückgenommen (Z. 1212). Nur falls es wiederkommt |
| V7 | [MODNet](https://github.com/ZHKKKe/MODNet) (Porträt-Freistellung) | ONNX | Nein | wie V6 | Apache-2.0 / Apache-2.0 | mittel | Gering, nur Porträt-Cover |
| V8 | [NeuFlow v2](https://github.com/neufieldrobotics/NeuFlow_v2) (optischer Fluss) | ONNX über [ibaiGorordo-Portierung](https://github.com/ibaiGorordo/ONNX-NeuFlowV2-Optical-Flow) (MIT) | Nein | wie V6 | Apache-2.0 | mittel | Gering. „Verzerren statt mischen" (§6.2), im Konzept schnitt Fluss schlechter ab als Wischen |
| V9 | MobileSAM / SAM 2 (Maske per Klick) | ONNX-Export | Nein | wie V6 | Apache-2.0 / nicht gesondert geprüft | groß | Mittel als neue Studio-Fähigkeit, nicht geplant |

**Ausgeschlossen wegen Lizenz:** Upscayl und upscayl-ncnn (AGPL-3.0), video2x (AGPL-3.0),
Flowframes (GPL-3.0), RobustVideoMatting (GPL-3.0), rembg mit Standardmodell bria-rmbg
(RMBG-2.0: CC BY-NC 4.0), gmfss-ncnn (Konverter GPL-3.0, Gewichte unklar).
Die Programme dürfen Vorbild sein, einbinden kommt das MIT-Original.

### 3.2 Audio und Ton

| # | Kandidat | Laufzeit | Belegt | Windows / Docker | Lizenz Code / Gewichte | Aufwand | Nutzen |
|---|---|---|---|---|---|---|---|
| A1 | [whisper.cpp](https://github.com/ggml-org/whisper.cpp) mit Vulkan | ggml-Vulkan über MoltenVK | **Nein, unbelegt.** Repo-Suche „MoltenVK" findet nur #3777 und #1021. Gleicher ggml-Vulkan-Code wie llama.cpp, daher plausibel | Win: selbst bauen (kein Vulkan-Binary, [#3673](https://github.com/ggml-org/whisper.cpp/issues/3673) geschlossen). Docker: `ghcr.io/ggml-org/whisper.cpp:main-vulkan`, unter WSL2 bricht large-v3 F16 ab (#3777) | MIT / MIT (*nicht nachgeprüft*) | mittel | **Hoch, falls es läuft** (≈ 26 h Bestand). Risiken: [#3611](https://github.com/ggml-org/whisper.cpp/issues/3611) `VK_ERROR_DEVICE_LOST` auf RX 5500 XT unter Linux beim KV-Cache; fp16-DeviceLost (Gist). *Eigene Rechnung:* größter Tensor in large-v3 F16 ist die Token-Einbettung mit 51866 × 1280 × 2 Byte ≈ 133 MB, also unter 256 MB (MoltenVK), über 128 MB (Dozen) |
| A2 | onnxruntime-node **CoreML** für Stems | ORT 1.20.1 (installiert) | Nein | nur macOS | MIT / htdemucs MIT | klein (Sandkasten) | Mittel bis hoch (≈ 21 h Bestand). STFT- und Transformer-Teile von htdemucs fallen wahrscheinlich auf die CPU zurück (*ungeprüft*) |
| A3 | onnxruntime-node **DirectML / WebGPU** (Windows) | ORT 1.30.0 | entfällt | Win: fertig, jede DX12-GPU. Docker/WSL2: nein | MIT | klein | Mittel für Windows-Tester. `klang.js` versucht heute nur `cuda` |
| A4 | [demucs-rs](https://github.com/nikhilunni/demucs-rs) (HTDemucs in Rust/Burn) | wgpu: Metal/Vulkan/WebGPU | Nein. v0.3.4 (10.03.2026): Mac nur arm64 | Win und Linux x86_64 fertig. Docker: ungeprüft | Apache-2.0 / Gewichte ungenannt | groß | Plan B für Stems, weil ORT auf Intel-Mac eingefroren ist. Gleichwertigkeit zu `htdemucs_6s.onnx` erst beweisen |
| A5 | [demucs.onnx](https://github.com/sevagh/demucs.onnx) (sevagh) | ORT, STFT außerhalb des Graphen | Nein | portabel | MIT | groß | Detail zu A2: STFT außerhalb würde CoreML entlasten |
| A6 | [Beat This!](https://github.com/CPJKU/beat_this) / beat_this_cpp | ORT, CPU reicht | entfällt | überall | MIT / MIT (*nicht nachgeprüft*) | mittel | Neue Fähigkeit oder Zweitmeinung zu Suno-Downbeats. **Keine GPU nötig** |
| A7 | [basic-pitch](https://github.com/spotify/basic-pitch) (Audio → MIDI) | ORT, CPU reicht | entfällt | überall | Apache-2.0 | mittel | Neue Fähigkeit (Melodie-Skizze je Stem). **Keine GPU nötig** |
| A8 | [onnxcrepe](https://github.com/yqzhishen/onnxcrepe) (Tonhöhe) | ORT | entfällt | überall | MIT | mittel | Neue Fähigkeit Gesangsanalyse. **Keine GPU nötig** |
| A9 | [LAION CLAP](https://huggingface.co/laion/larger_clap_music_and_speech) | ORT / transformers.js | Nein | CPU überall | Apache-2.0 (*nicht nachgeprüft*) | mittel | Lizenzsaubere Alternative zu Discogs-EffNet (CC BY-NC-ND). Steht im Backlog (Z. 1596–1635) |

**Kein Weg:** python-audio-separator (Python, keine GPU auf Intel+AMD), sherpa-ncnn
(Sprach-, nicht Gesangserkennung, kein Whisper), Metal-Backend von whisper.cpp (siehe §1.1).

### 3.3 Text

| # | Kandidat | Laufzeit | Belegt | Windows / Docker | Lizenz Code / Gewichte | Aufwand | Nutzen |
|---|---|---|---|---|---|---|---|
| T1 | [llama.cpp](https://github.com/ggml-org/llama.cpp) mit Vulkan, `llama-server` | ggml-Vulkan über MoltenVK ≥ 1.4.2 | **Auf der Schwesterkarte ja, auf unserem Chip (RX 5500 XT, Monterey) laut #20029-Kommentar ja**, auf diesem iMac nein | Win: `llama-b10981-bin-win-vulkan-x64.zip` fertig. Linux: `ubuntu-vulkan-x64`. Docker: Linux mit `/dev/dri` (*ungeprüft*). Mac: **selbst bauen**, das Release `macos-x64` ist CPU (release.yml: `-DGGML_METAL=OFF`, kein Vulkan) | MIT / Qwen3 Apache-2.0 (*HF-Tag, nicht nachgeprüft*). MoltenVK Apache-2.0 (Eintrag und NOTICE in LIZENZEN.md) | mittel | **Sehr hoch** für Kondensate. Messwerte auf der 5500M: 3B Q4_K_M 46–54 Token/s gegen 13,4 auf der CPU (Gist, b10106). Andere Gist-Revision und Fork-README nennen 36–38 Token/s. Pflicht: `-ngl 99 -fa 0 -c 4096`. Risiken: DeviceLost über 1–2k Token, Prompt-Einlesen fiel in [Discussion #19781](https://github.com/ggml-org/llama.cpp/discussions/19781) von 438 auf 18,8 Token/s (W6800X, b6123 → b8121). Build-Nummer einfrieren. OpenAI-kompatible HTTP-API, passt zu Node |
| T2 | Ollama offiziell | ggml, intern llama.cpp | Nein, CPU | Win: Vulkan/CUDA/ROCm, gut für Windows-Tester | MIT | – | Auf dem Mac kein Gewinn. Fork Momin010: „SOURCE-AVAILABLE, NOT OPEN SOURCE", Weitergabe verboten, **ausgeschlossen** |
| T3 | [Qwen3-Embedding-0.6B](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B-GGUF) über `llama-server --embedding` | wie T1 | Nein | wie T1 | MIT / Apache-2.0 (*nicht nachgeprüft*) | mittel | Qualitätswechsel für den Geschichten-Raum, keine nötige Beschleunigung. Nebeneffekt: macht Text-Einbettungen unabhängig vom Mac-x64-Aus von onnxruntime |
| T4 | WebLLM / transformers.js im Browser | WebGPU (Chrome, Dawn → Metal) | Nein | Win: D3D12. Docker: entfällt, Browser beim Nutzer | Apache-2.0 | klein (Machbarkeitstest) | Gering: Tab muss offen sein, keine Stapelverarbeitung im Server, Numerik schwankt je GPU |
| T5 | MLC-LLM | TVM Metal/Vulkan | Unsicher, [#2999](https://github.com/mlc-ai/mlc-llm/issues/2999) ohne Antwort | ungeprüft | Apache-2.0 | groß | Gering, T1 ist einfacher und besser belegt |

---

## 4 · Hausregel „Fähigkeit gegen Grundlage"

Memory-Regel: neue Fähigkeiten frei wählbar. Gemeinsame Grundlagen, die für alle Titel gleich
erzeugt werden müssen, einheitlich erzeugen.

**Was eine GPU an einer Grundlage ändert:** Ein anderes Rechenwerk rechnet mit anderer
Gleitkomma-Reihenfolge und oft in fp16. Das Ergebnis ist dann nicht mehr bitgleich zur CPU, beim
Sprachmodell kann sogar ein anderer Text herauskommen. Deshalb gehört **das Rechenwerk mit ins
Ableitungsbuch**, neben Modellidentität und Prüfsumme (Muster: `tiefenkarten.json`). Und vor
jedem Wechsel steht ein Vergleich GPU gegen CPU am selben Titel.

**Plattformgleichheit:** Ein Titel aus Caspar_Ds iMac (MoltenVK), einer vom Windows-Tester
(DirectML oder Vulkan) und einer aus Docker (CPU) müssen in derselben Karte zusammenpassen, wenn
sie in eine Sammlung wandern. Innerhalb einer Sammlung darf es nur **ein** Rechenwerk je Grundlage
geben, sonst gilt die Neubau-Regel: geschlossen für alle Titel.

| Aufgabe | Einordnung | Folge für die GPU |
|---|---|---|
| Musikstil `klang.json` (Karte, Cluster) | **Grundlage** | GPU nur mit Nachweis, dass die Vektoren innerhalb Toleranz gleich sind. Gewinn klein, also kein Handlungsbedarf |
| Geschichten-Raum `geschichten.json` | **Grundlage** | Wie Musikstil. Modellwechsel (T3) nur als geschlossener Neubau |
| Tiefenkarte `tiefe.png` (Grundkanal, VIDEO-PLAN §9.7) | **Grundlage** | Bildvergleich gegen die CPU-Karten. Gewinn klein |
| Stems | **Grundlage** (Tonpfad, Karaoke, Analysen) | GPU nur mit Hörvergleich und Messung gegen CPU-Stems. Größter Zeitgewinn, aber kein belegter Weg |
| Whisper-Zeitmarken `whisper.ndjson`, Lyrik `lyrik.json` | **Grundlage** | Wortmarken GPU gegen CPU vergleichen. Abweichung in Millisekunden zählt, Text muss gleich sein |
| Kondensat (LLM) | **Grundlage**, sobald es in den Morgenlauf kommt. Heute extern von Opus/Haiku, also schon jetzt uneinheitlich | Wechsel Ollama → llama.cpp heißt: alle Kondensate neu. Sprachmodell-Ausgaben sind nicht bitgleich über Rechenwerke. Deshalb: festes Modell, feste Build-Nummer, Temperatur 0, und **eine** Erzeugungsstelle je Sammlung |
| Zwischenbilder (RIFE), Hochskalieren (Real-ESRGAN) | **Fähigkeit** | Frei. Werden je Clip beim Rendern erzeugt, nicht für alle Titel gespeichert |
| Freistellung, optischer Fluss, Maske per Klick | **Fähigkeit** | Frei |
| Beats, MIDI, Tonhöhe (A6–A8) | Beginnt als **Fähigkeit**. Wird zur Grundlage, sobald Karte oder Suche darauf bauen | Brauchen keine GPU, also kein Plattformproblem |

**Kurz:** Die GPU ist für Fähigkeiten sofort frei. Bei Grundlagen ist sie nur ein
Geschwindigkeitsgewinn, der erst einen Gleichheitsnachweis bestehen muss. Vorher ist
Plattformgleichheit wichtiger als Tempo.

---

## 5 · Messplan (Vorschlag, nichts davon ist geholt)

**Downloads nur mit Freigabe von Caspar_D.** Alles auf die SSD, nicht auf die Systemplatte.
Nie am Produktivbestand: Kopien der Prüftitel in einen Sandkasten, Zufallstitel statt immer des
ersten. Sandkasten-Prozesse nur über ihre eigene PID beenden. Größen aus GitHub-API bzw.
Hugging-Face-Dateiliste, gelesen 15.09.2026.

| # | Was | Herunterladen | Größe | Messen | Grundlinie | Erfolg heißt |
|---|---|---|---|---|---|---|
| **M1** | RIFE: Tempo GPU gegen CPU | **nichts**, `rife-ncnn-vulkan` liegt schon da | – | 12 Zwischenbilder zwischen zwei Nahtbildern aus `labor/videonaht/`, 1080p. `-g 0` (GPU) gegen `-g -1` (CPU), ohne `-x`. Zeit, GPU-Auslastung (Aktivitätsanzeige) | `-g -1` auf dem i7-10700K | GPU deutlich schneller, keine Hänger über 100 Durchläufe |
| **M2** | onnxruntime CoreML mit der **installierten** 1.20.1 | **nichts** | – | Sandkasten-Skript mit `executionProviders:['coreml','cpu']`, Log-Stufe VERBOSE: wie viele Knoten landen bei Core ML? Dann Tiefenkarte (12 Cover) und ein Stem-Abschnitt | Tiefenkarte Large 2700 ms je Cover (14.09.2026). Stems 3,6 s je 7,8-s-Abschnitt | Mehrheit der Knoten auf Core ML, schneller, und Ergebnis innerhalb Toleranz gleich (Bilddifferenz, Stem-Differenz in dB) |
| **M3** | llama.cpp mit Vulkan selbst bauen | Quellcode [llama.cpp Tag b10981](https://github.com/ggml-org/llama.cpp/releases/tag/b10981) (Quelltext-Archiv, Größe nicht abgelesen) · [MoltenVK-macos.tar v1.4.2](https://github.com/KhronosGroup/MoltenVK/releases/tag/v1.4.2) · Shader-Compiler `glslc` aus dem Vulkan SDK oder Homebrew (Größe *ungeprüft*) · [Qwen3-8B-Q4_K_M.gguf](https://huggingface.co/Qwen/Qwen3-8B-GGUF) | MoltenVK 59,6 MB · Modell **5,03 GB** | `-ngl 99 -fa 0 -c 4096`, Temperatur 0. Prompt aus `bin/kondensat-prompt.js`, 12 Zufallstitel, darunter japanische und die zwei längsten Lyrics (> 2k Token, DeviceLost-Grenze). Token/s Einlesen und Erzeugen, Sekunden je Lied, Abstürze. Dann dieselben 12 mit `-ngl 0` (CPU, gleiches Binary) | Ollama qwen3:8b CPU: 56 s je Lied, 2,3 Token/s (28.08.2026) | ≤ 20 s je Lied, kein Absturz bei langen Lyrics, Kondensate inhaltlich gleichwertig zur CPU-Ausgabe |
| **M4** | whisper.cpp mit Vulkan selbst bauen | Quellcode [whisper.cpp v1.9.4](https://github.com/ggml-org/whisper.cpp/releases/tag/v1.9.4) · MoltenVK und `glslc` aus M3 · Rückfallmodell [ggml-large-v3-q5_0.bin](https://huggingface.co/ggerganov/whisper.cpp) nur bei Abbruch mit F16 | Modell F16 liegt schon da (3,10 GB) · Q5_0: **1,08 GB** | 5 Zufallstitel, 3–5 min lang. Laufzeit und Echtzeitfaktor. Wortmarken gegen den CPU-Lauf: Text gleich? Mittlere und größte Abweichung der Wortanfänge in ms | CPU + Accelerate: 4:02 in 5:49 (20.08.2026), dazu die vorhandenen Einträge in `whisper.ndjson` | Schneller als Echtzeit, Text gleich, Wortmarken im Mittel < 20 ms Abweichung (Schwelle vorläufig, mit Caspar_D festlegen) |
| **M5** | Real-ESRGAN: Hochskalieren als neue Fähigkeit | [realesrgan-ncnn-vulkan-v0.2.0-macos.zip](https://github.com/xinntao/Real-ESRGAN-ncnn-vulkan/releases/tag/v0.2.0) | **8,5 MB** | 12 Cover ×2 und ×4, Kachelgröße `-t 200` und `-t 0`. Zeit je Cover, Speicherabbrüche. Kontaktbogen zum Ansehen (dunkel grundiert) | Heutige Hochskalierung im Browser (bilinear) | ×4 ohne Abbruch, sichtbar schärfer, < 5 s je Cover |

**Reihenfolge:** M1 und M2 kosten keinen Download und klären die zwei Grundfragen
(Wie schnell ist ncnn wirklich? Taugt Core ML auf der Radeon?). M3 ist der größte erwartete
Gewinn. M4 hat den größten möglichen Gewinn bei der dünnsten Beleglage. M5 ist klein und
eine reine Fähigkeit.

**Bauhinweis zu M3 und M4:** Bau mit `-DGGML_METAL=OFF -DGGML_VULKAN=ON` und `VK_ICD_FILENAMES`
auf `MoltenVK_icd.json` (Gist khalidhalba-jhu). Damit KlangTresor später ohne Handarbeit läuft,
müsste MoltenVK mitgeliefert werden. Das ist erst nach bestandener Messung zu entscheiden.

---

## 6 · Offene Fragen

1. **Soll das Kondensat überhaupt in den Morgenlauf?** Nur dann lohnt der Eigenbau von llama.cpp
   für den Mac, samt mitgeliefertem MoltenVK und festgefrorener Build-Nummer. Heute kommen die
   Kondensate extern von Opus/Haiku.
2. **Wie gleich muss eine Grundlage über Mac, Windows und Docker sein?** Reicht „gleiches Modell,
   gleiches Rechenwerk je Sammlung, Toleranzvergleich beim Wechsel"? Oder muss sie bitgleich sein?
   Im zweiten Fall bleibt die GPU auf Fähigkeiten beschränkt.
3. **Wie lange trägt der Intel-Mac?** onnxruntime-node ist dort bei 1.23.x am Ende, Apple beendet
   den Support in unter zwei Jahren. Bleibt die Bindung an 1.20.1 bewusst stehen, oder wird ein
   Ersatzweg gesucht (llama.cpp für Text, demucs-rs für Stems)? Daran hängt auch die offene
   Lizenzfrage der Tiefenkarte Large (CC BY-NC 4.0) vor einem öffentlichen Release.
