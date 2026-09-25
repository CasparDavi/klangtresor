# Fremde Bausteine

Was hier liegt und was beim Einrichten dazukommt, stammt zum Teil von
anderen. Diese Datei nennt sie und ihre Lizenzen.

Der eigene Code steht unter der **MIT-Lizenz** — siehe
[LICENSE](../../LICENSE). Sie gilt **nicht** für:

* Die **Butterchurn-Dateien** in diesem Ordner (`butterchurn*.min.js`).
  Sie stammen von anderen und tragen ihre eigene Lizenz — unten steht,
  welche.
* Die KI-Modelle. Sie liegen nicht im Repositorium und werden beim
  Einrichten geholt; auch sie stehen unten.
* Die Songs, Texte und Artworks in einem damit gebauten Archiv. Sie
  gehören ihren Urhebern und sind nicht Teil dieses Repositoriums.

**Vier Dateien in diesem Ordner sind trotz seines Namens eigener Code**
und stehen unter MIT wie alles andere: `analyzer.js`,
`analyzer-worker.js`, `analyse-ablage.js` und `gradation-worklet.js`.
Sie liegen hier, weil der Ordner ursprünglich für ausgelagerte Module
gedacht war — nicht, weil sie fremd wären. Ihre Dateiköpfe sagen es
selbst.

> Der Hinweis stand zunächst unter dem Lizenztext selbst. Er ist
> hierher gewandert, weil GitHub eine LICENSE mit Zusatz nicht mehr als
> MIT erkennt, sondern als „Other" anzeigt — und dann sieht niemand auf
> einen Blick, woran er ist.

---

## Im Repositorium (geht beim Klonen mit)

### Butterchurn — MIT

Die MilkDrop-Visualisierung und ihre Presets.

| Datei | Fassung |
|---|---|
| `butterchurn.min.js` | 2.6.7 |
| `butterchurnPresetsExtra.min.js` | 2.4.7 |
| `butterchurnPresetsExtra2.min.js` | 2.4.7 |
| `butterchurnPresetsMD1.min.js` | 2.4.7 |

> Copyright (c) 2013–2018 Jordan Berg
> MIT License — vollständiger Text in [BUTTERCHURN-LICENSE.txt](BUTTERCHURN-LICENSE.txt)

Herkunft: [github.com/jberg/butterchurn](https://github.com/jberg/butterchurn)
und [butterchurn-presets](https://github.com/jberg/butterchurn-presets).

Die Minified-Builds tragen selbst keinen Lizenzkopf; der Lizenztext lag
im npm-Paket daneben und ist beim Kopieren zunächst liegengeblieben. Am
24.08.2026 nachgetragen.

**Zu den Presets selbst:** Die MilkDrop-Presets sind über zwanzig Jahre
in der MilkDrop-Szene entstanden, von vielen einzelnen Autoren. Ihre
Urheberrechtslage hat nie jemand einzeln geklärt, auch das
Butterchurn-Projekt nicht. Wer sie weitergibt, erbt diese Unklarheit.
Die Presetnamen nennen ihre Autoren; mehr Zuordnung gibt es nicht.

### Inter und Gelasio — SIL Open Font License 1.1

Die zwei Paketschriften der Texteffekte (Titel, Karaoke) liegen unter `web/fonts/`, damit der
Effektclip-Export auf Mac, Windows und Bühne dieselbe Schrift malt (ohne sie fiel Windows von
„Helvetica Neue" auf Arial zurück, Georgia fehlte ganz). Inter ersetzt die Grotesk, Gelasio die
Serife — Gelasio ist metrisch Georgia-kompatibel, der Umbruch bleibt gleich. Die Lizenztexte liegen
daneben (`web/fonts/LIZENZ-inter.txt`, `web/fonts/LIZENZ-gelasio.txt`). Geholt am 25.09.2026;
statische Schnitte, keine Variable Fonts; Umlaute, ß und die deutschen Anführungszeichen geprüft.

| Datei | Schnitt | Quelle | Version | Byte | SHA-256 |
|---|---|---|---|---|---|
| `inter-400.woff2` | Inter Regular | github.com/rsms/inter, Release v4.1, `web/Inter-Regular.woff2` | 4.1 | 111268 | `e06f6b1bc553aaea4e4668023ed0ab0a147129c3107f511bc7d03d361b0ae085` |
| `inter-700.woff2` | Inter Bold | github.com/rsms/inter, Release v4.1, `web/Inter-Bold.woff2` | 4.1 | 114840 | `fa888127b6da015b65569f0351f3b5c391ad928904951f1c20e9f8462a8d95ea` |
| `gelasio-400.woff2` | Gelasio Regular | Google Fonts css2-API, Latin-Subset von fonts.gstatic.com | v14 | 19536 | `68e2b704c5624ba84e70d826e33c5fc08d75eb452f834d869abdecc39f3b26ac` |
| `gelasio-700.woff2` | Gelasio Bold | Google Fonts css2-API, Latin-Subset von fonts.gstatic.com | v14 | 19844 | `dff91a5084db8f15e401e902acdac8768f5ae1746205c5319ad2cf3655517170` |

### Eigene Dateien in diesem Ordner

`analyzer.js`, `analyzer-worker.js`, `analyse-ablage.js` und
`gradation-worklet.js` sind **nicht** fremd. Sie liegen hier, weil der
Ordner ursprünglich für ausgelagerte Module gedacht war. Für sie gilt
die MIT-Lizenz des Projekts.

Der Analyzer geht auf ein früheres eigenes Projekt zurück
(*SunoAnalyzer*). Das Verfahren zur Erkennung von Störfrequenzen ist
dem *CB Audio Analyzer* (GPL) **nachgebaut, nicht übernommen** — jener
ist Python mit Qt, dieser JavaScript. Die Stelle ist im Quelltext
vermerkt.

---

## Nicht im Repositorium (wird beim Einrichten geholt)

Diese Dateien liegen unter `library/modelle/` und sind von der
Versionsverwaltung ausgeschlossen. Wer das Projekt klont, bekommt sie
nicht mit, sondern holt sie selbst — die Lizenzen unten gelten für
seine Benutzung.

### htdemucs_6s — MIT

Trennt einen Song in sechs Instrumentspuren.

> Copyright (c) Meta Platforms, Inc. and affiliates — MIT License
> ONNX-Export: Copyright (c) 2026 StemSplit — MIT License

Das Verfahren: [github.com/adefossez/demucs](https://github.com/adefossez/demucs).
Die hier benutzte ONNX-Fassung:
[huggingface.co/StemSplitio/htdemucs-6s-onnx](https://huggingface.co/StemSplitio/htdemucs-6s-onnx).

Zur Vorgeschichte: Demucs stand bis zum 13.04.2020 unter CC BY-NC
(nicht-kommerziell) und ist seither MIT. Das Sechs-Spur-Modell entstand
erst am 07.12.2022, fällt also vollständig in die MIT-Zeit.

### NVIDIA CUDA-Images — NVIDIA Deep Learning Container License

Seit dem 26.08.2026 gibt es ein **optionales** GPU-Overlay
(`docker/Dockerfile.cuda`, Tarja). Es baut auf
`nvidia/cuda:12.4.1-devel-ubuntu22.04` und
`nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04` auf.

**Im Repositorium liegt davon nichts** — die Images werden beim Bauen
geholt. Ein `FROM`-Verweis ist keine Verteilung, unsere MIT-Lizenz
bleibt davon unberührt.

**Wer das gebaute Image weitergibt**, unterliegt dagegen NVIDIAs
Bedingungen: Die CUDA-Bibliotheken und cuDNN stehen unter der *NVIDIA
Deep Learning Container License*, nicht unter MIT. Für den eigenen
Gebrauch auf der eigenen Maschine ist das ohne Belang; ein fertiges
Image öffentlich anzubieten wäre etwas anderes.

Das Ubuntu-Grundsystem darin enthält wie jedes Linux GPL-Software.
Auch das berührt uns nicht: Wir verlinken nichts davon in eigenen Code
und geben nichts davon weiter.

> [catalog.ngc.nvidia.com](https://catalog.ngc.nvidia.com) ·
> [hub.docker.com/r/nvidia/cuda](https://hub.docker.com/r/nvidia/cuda)

### Whisper — MIT

Erkennt gesungene Sprache und liefert Wort-Zeitmarken.

> Copyright (c) 2022 OpenAI — MIT License
> whisper.cpp: Copyright (c) 2023–2026 The ggml authors — MIT License

[github.com/openai/whisper](https://github.com/openai/whisper) ·
[github.com/ggerganov/whisper.cpp](https://github.com/ggerganov/whisper.cpp)

OpenAI verbreitet dieselben Gewichte auf Hugging Face unter Apache-2.0
und auf GitHub unter MIT. Beide sind permissiv; die Lizenzen fallen
zwischen den Vertriebswegen auseinander, nicht zwischen Code und
Gewichten.

### Essentia-Modelle — CC BY-NC-ND 4.0

Erkennen Musikstil, Instrumente und Stimmung.

| Datei |
|---|
| `discogs-effnet-bsdynamic-1.onnx` |
| `mtg_jamendo_genre-discogs-effnet-1.onnx` |
| `mtg_jamendo_instrument-discogs-effnet-1.onnx` |
| `mtg_jamendo_moodtheme-discogs-effnet-1.onnx` |

> Music Technology Group, Universitat Pompeu Fabra, Barcelona
> Lizenz: [CC BY-NC-ND 4.0](https://essentia.upf.edu/models/LICENSE)

[essentia.upf.edu/models](https://essentia.upf.edu/models/)

**Neben Depth Anything (siehe unten) die einzigen Lizenzen hier mit
Einschränkungen**, und sie sind zu beachten: Namensnennung (BY), keine
kommerzielle Nutzung (NC), keine Weitergabe veränderter Fassungen (ND).
Für ein privates Archiv ist das unproblematisch. Wer die Modelle
weitergibt, muß sie unverändert lassen und diese Nennung mitführen.

Die Programmbibliothek *Essentia* selbst steht unter AGPL-3.0. Sie wird
hier nicht benutzt — nur die Modelle, über ONNX Runtime.

### Depth Anything V2 Large — CC BY-NC-4.0

Schätzt aus einem Standbild, was vorn und was hinten liegt. KlangTresor
rechnet daraus je Titelbild eine Tiefenkarte; Dunst, Licht, Schatten und
Partikel lesen sie.

| Datei |
|---|
| `depth-anything-v2-large-fp16.onnx` |
| `model_fp16.onnx_data` |

> Lihe Yang, Bingyi Kang, Zilong Huang, Zhen Zhao, Xiaogang Xu,
> Jiashi Feng, Hengshuang Zhao: *Depth Anything V2*, 2024.
> Lizenz: [CC BY-NC-4.0](https://creativecommons.org/licenses/by-nc/4.0/)
> Die ONNX-Fassung stammt von der Hugging-Face-Gruppe *onnx-community*
> und trägt dieselbe Lizenz.

[huggingface.co/depth-anything/Depth-Anything-V2-Large](https://huggingface.co/depth-anything/Depth-Anything-V2-Large) ·
[onnx-community/depth-anything-v2-large-ONNX](https://huggingface.co/onnx-community/depth-anything-v2-large-ONNX)

**Namensnennung und keine kommerzielle Nutzung** — wie bei den
Essentia-Modellen, nur ohne die ND-Klausel. Die **kleine** Fassung des
Modells steht unter Apache-2.0 und wäre ohne Einschränkung; sie liest
Texturen aber hörbar gröber (gemessen am 14.09.2026 an zwölf Covern:
einzelne nasse Steine werden bei *Small* ein weicher Brei, bei *Large*
bekommen sie Relief). Wer die NC-Klausel nicht tragen will, tauscht in
`bin/modelle-holen.js` die beiden Zeilen gegen
`onnx-community/depth-anything-v2-small-ONNX` — alles andere bleibt
gleich.

### npm-Pakete

Nicht im Repositorium (`node_modules/` ist ausgeschlossen), werden über
`npm install` geholt.

| Paket | Lizenz |
|---|---|
| `onnxruntime-node` 1.20.1 | MIT — Copyright (c) Microsoft Corporation |
| `umap-js` 1.4.0 | MIT |

Beide ziehen weitere Pakete nach, sämtlich permissiv (MIT, BlueOak-1.0.0,
ISC). Die genaue Liste steht in `package-lock.json`.

---

---

## Was einmal hier lag

`audioMotion-analyzer.js` (Henrique Avila Vianna) stand unter
AGPL-3.0-or-later — einer Copyleft-Lizenz, die sich auf das gesamte
Werk erstreckt, sobald es weitergegeben wird. Mit der MIT-Lizenz dieses
Projekts verträgt sich das nicht, deshalb ist die Datei am 24.08.2026
entfernt worden.

Sie brachte fünf Darstellungsarten mit (Balken, Balken fein,
LED-Balken, Gespiegelt, Linienzug). Der Verlust ist klein: Die eigene
Darstellung *Spektrum* zeichnet dieselben Frequenzbalken, nur radial.
Wer zuletzt eine audioMotion-Art eingestellt hatte, wird beim nächsten
Start einmalig dorthin umgeschrieben.
