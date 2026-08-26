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
(`Dockerfile.cuda`, Tarja). Es baut auf
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

**Das ist die einzige Lizenz hier mit Einschränkungen**, und sie sind zu
beachten: Namensnennung (BY), keine kommerzielle Nutzung (NC), keine
Weitergabe veränderter Fassungen (ND). Für ein privates Archiv ist das
unproblematisch. Wer die Modelle weitergibt, muß sie unverändert lassen
und diese Nennung mitführen.

Die Programmbibliothek *Essentia* selbst steht unter AGPL-3.0. Sie wird
hier nicht benutzt — nur die Modelle, über ONNX Runtime.

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
