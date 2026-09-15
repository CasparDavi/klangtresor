# Effektclip: Videostudio-Recherche

Stand 15.09.2026. Anlass ist Caspar_D am selben Tag: *„toll, das mal angesagt zu bekommen, das ffmpeg
bei einigen unter der Haube arbeitet. Da wäre vielleicht eine Analyse gut, auch habe ich grade gesehen,
dass es sammlungen von ffmpeg transitions auf github gibt. sehr sehr spannend. ja, und auch bei uns
wird es auf ein kleines Videostudio hinauslaufen."*

**Zustand: recherchiert, nichts gebaut, nichts geholt.** Grundlage sind drei Rechercherichtungen
(Übergänge, Werkzeuge, Browser), jede in einer zweiten Runde nachgeprüft: GitHub-API (Lizenz-SPDX,
Push, Releases), README-, LICENSE- und Quelldateien, Doku-Seiten. Was nur aus dem Gedächtnis kommt,
steht als *ungeprüft* da. Der Stand im Haus ist am Code nachgesehen (`web/index.html`,
`server/server.js`, `labor/`). Bezug: [VIDEO-PLAN.md](VIDEO-PLAN.md) §4, §6, §7, §11.

---

## 0 · Das Ergebnis in fünf Sätzen

1. Die „ffmpeg transitions"-Sammlungen auf GitHub sind fast immer **dieselben GLSL-Dateien aus
   gl-transitions**. ffmpeg kann sie nur über einen selbst gebauten Filter oder über eine
   GL-Stufe in Node ins Video bringen. **Wir haben die GL-Stufe schon, im Browser.**
2. **gl-transitions passt direkt in unseren WebGL-Maler** und ist lizenzrechtlich sauber: 125
   Übergänge, 123 MIT, 2 BSD (eigener Hinweis nötig).
3. ffmpegs eingebauter `xfade` ist eine **eigene** Sammlung (58 Übergänge, C-Code), nicht
   gl-transitions. Er taugt nur serverseitig, und dort sieht der Nutzer in der Vorschau etwas
   anderes als im Export.
4. Unser Weg (Bild = Funktion von t, WebCodecs kodiert, ffmpeg muxt nur) ist derselbe, den
   Remotions Browser-Renderer, Diffusion Studio und Omniclip gehen. Er ist Stand der Technik, kein
   Sonderweg.
5. Die zwei echten Lücken sind **bildgenaues Dekodieren der Videoquelle** und **ein Datenmodell für
   Abschnitte und Übergänge**. Beides kommt vor jeder Übergangssammlung.

**Korrektur an VIDEO-PLAN §6.7:** „Rund achtzig fertige GLSL-Übergänge — dieselbe Sammlung, aus der
ffmpeg's `xfade` schöpft" stimmt zweimal nicht. Es sind **125**
([gl-transitions/transitions](https://github.com/gl-transitions/gl-transitions), alle Dateiköpfe am
15.09.2026 gelesen), und `xfade` hat seine eigenen 58
([ffmpeg-filters.html#xfade](https://ffmpeg.org/ffmpeg-filters.html#xfade), doc/filters.texi auf
master). Nach GL-Transitions übertragen hat sie erst das Drittprojekt
[xfade-easing](https://github.com/scriptituk/xfade-easing).

---

## 1 · Wie ffmpeg in anderen Werkzeugen arbeitet — vier Muster

| Muster | Wer so arbeitet | wo gerechnet wird | Vorschau = Export? |
|---|---|---|---|
| **A · ffmpeg als Filtergraph auf der Kommandozeile** | LosslessCut, Shutter Encoder, ffmpeg-transitions (Rickkorsten), unser Server heute | ffmpeg-Prozess, CPU | nein: die Vorschau ist ein Browser-Player, der Filter läuft erst beim Export |
| **B · eigene Engine, libav nur zum Lesen und Schreiben** | MLT (Shotcut, Kdenlive, Flowblade), libopenshot, Olive, HandBrake (libhb) | C/C++-Engine, Filter auf CPU oder GPU | ja, beide Consumer hängen am selben Graphen |
| **B′ · Node mit headless-gl, ffmpeg über Pipes** | editly, ffmpeg-concat; als ffmpeg-Patch ffmpeg-gl-transition | Server mit nativem GL-Kontext | nur, wenn die Vorschau denselben Renderer nutzt (editly „fast mode") |
| **C · Browser: Canvas/WebGL-Maler + WebCodecs** | **wir**, Remotion web-renderer, Diffusion Studio, Omniclip, twick | Browser-GPU, Kodieren per `VideoEncoder` | **ja, dieselbe Stelle** |
| **D · ffmpeg.wasm** | Omniclip (neben WebCodecs), twick (Audio-Mux) | ffmpeg als WebAssembly im Browser | theoretisch ja |

### A · ffmpeg-Filtergraph

Beispiel `xfade`: 58 benannte Übergänge plus `custom`-Ausdruck, Dauer 0–60 s, Offset. **Beide
Eingänge brauchen gleiche Bildrate (konstant), Auflösung, Pixelformat und Zeitbasis.** Easing gibt
es nicht. `xfade_vulkan` kann nur 17 davon (Quelle:
[ffmpeg-filters.html#xfade](https://ffmpeg.org/ffmpeg-filters.html#xfade); xfade seit 4.3,
xfade_vulkan seit 6.1 laut Changelog auf master). LosslessCut zeigt im Chromium-Player und schneidet
über die ffmpeg-Binärdatei ([README](https://github.com/mifi/lossless-cut), v3.69.0 vom 04.06.2026).

- **Für uns:** ffmpeg ist schon da, nativ schnell, keine GPU nötig.
- **Gegen uns:** Was ffmpeg rechnet, zeigt der Maler nicht. Vorschau und Export laufen auseinander,
  genau das hat VIDEO-PLAN §4 beim `MediaRecorder` beseitigt. Effekte aus unserem Maler kann ffmpeg
  nicht nachrechnen.

### B · eigene Engine mit libav

MLT ist ein Graph aus Producer, Filter, Transition (zwei Spuren, in/out) und Consumer, speicherbar
als MLT-XML ([Framework-Doku](https://www.mltframework.org/docs/framework/)). ffmpeg ist dort nur der
`avformat`-Producer und -Consumer. Keyframes als Zeichenkette mit Interpolationsart je Punkt und
Zeiten relativ zum Ende ([propertyanimation](https://www.mltframework.org/docs/propertyanimation/)).
LGPL-2.1, v7.40.0 vom 25.06.2026 ([GitHub](https://github.com/mltframework/mlt)).

- **Für uns:** das reifste Datenmodell (Übergang als eigenes Objekt mit zwei Eingängen, Keyframes).
- **Gegen uns:** C/C++, je Plattform nativ zu bauen, Editoren darauf GPL-3. Nur Ideen nehmen.
- **Warnung:** Olive hat beim Umbau zum freien Knotensystem angehalten, letzter Push 05.12.2024
  ([GitHub](https://github.com/olive-editor/olive)). Die Ursache ist nicht belegt.

### B′ · Node mit headless-gl

editly liest und schreibt über ffmpeg-rawvideo-Pipes (RGBA) und rechnet Übergänge mit headless-gl
und gl-transitions (`src/index.ts`, `src/sources/video.ts`; [GitHub](https://github.com/mifi/editly),
MIT, letzter Push 12.05.2025). ffmpeg-concat schreibt Zwischenbilder als Dateien ins
Temp-Verzeichnis und meldet unter macOS kaputtes OpenGL bei Node 12.13.1–13.6.0
([README](https://github.com/transitive-bullshit/ffmpeg-concat)). ffmpeg-gl-transition verlangt einen
eigenen ffmpeg-Build mit GLEW/GLFW oder EGL, eine Windows-Anleitung fehlt
([README](https://github.com/transitive-bullshit/ffmpeg-gl-transition), ruhend seit 2022).

- **Für uns:** zeigt, dass die Shader-Sammlung ohne Browser nutzbar ist.
- **Gegen uns:** native GL-Bindung auf Mac, Windows und Docker (Casto) ist genau das, was wir nicht
  wollen; der Zeichenpfad wäre doppelt.

### C · Browser mit WebGL-Maler und WebCodecs

Remotions web-renderer kodiert „with WebCodecs using Mediabunny instead of FFmpeg"
([Doku](https://www.remotion.dev/docs/web-renderer/), stabil ab 4.0.491). Diffusion Studio baut auf
Mediabunny und WebCodecs, gezeichnet auf Canvas 2D
([README](https://github.com/diffusionstudio/core)). Omniclip nutzt gl-transitions auf PixiJS und
WebCodecs ([package.json](https://github.com/omni-media/omniclip)).

- **Für uns:** Vorschau und Export sind dieselbe Funktion. Offline, ohne native Abhängigkeit, auf
  jedem Rechner mit Chrome/Edge. Teure Effekte dürfen im Export teurer rechnen (`FEIN`).
- **Gegen uns:** H.264 hängt am Codec-Angebot des Browsers. Das **Dekodieren bildgenau** muss man
  selbst bauen, `<video>.currentTime` ist dafür zu grob. Speicher bei langen Videos.

### D · ffmpeg.wasm

Laut [FAQ](https://github.com/ffmpegwasm/ffmpeg.wasm): 2 GB harte Grenze, „still a lot slower than
native", MT-Variante „more unstable". Das Dockerfile baut x264, x265 und libvpx ein, praktisch also
GPL. Letztes Release-Tag v12.15 vom 07.01.2025.

- **Gegen uns:** doppelt ungünstig. Langsamer als unser nativer Server-ffmpeg, und die Filter sehen
  den Maler trotzdem nicht. **Nie.**

**Befund:** Wir sind heute schon Muster C mit einem Rest von A (ffmpeg muxt). Das ist die richtige
Aufteilung. Serverseitiges Rendern über headless Chrome (Remotion, Revideo mit Puppeteer und
PostHog-Telemetrie, [render-video.ts](https://github.com/midrender/revideo)) brauchen wir nicht: der
Nutzer sitzt ohnehin am Browser.

---

## 2 · Übergangssammlungen

### 2.1 Tabelle

„Maler" = läuft in unserer WebGL-Stufe, Vorschau und Export an derselben Stelle. „Server" = nur
über ffmpeg nach dem Malen.

| Name | Art | Lizenz | Stand | wie einbinden | Eignung |
|---|---|---|---|---|---|
| [gl-transitions](https://github.com/gl-transitions/gl-transitions) | 125 GLSL-Übergänge + Spec v1 | 123 MIT, `InvertedPageCurl` BSD-3, `StereoViewer` BSD-2 (Dateiköpfe gelesen); Repo-LICENSE MIT | Push 22.06.2026, npm 1.71.0 | einzelne `.glsl` nach `web/fremd/`, Wrapper-Shader in der WebGL-Stufe | **Maler. Erste Wahl.** |
| [gl-transition](https://github.com/gre/gl-transition-libs) | JS-Renderfunktion zur Sammlung | MIT | npm 2.1.0 | nicht einbinden, nur als Vorlage für den Wrapper | Maler, Referenz |
| [pixi-filters](https://github.com/pixijs/filters) | 37 Effekt-Shader (`.frag` + `.wgsl`) | MIT | v6.1.5 vom 29.11.2025 | einzelne `.frag` auf unser Quad portieren (Pixi-Uniforms umschreiben) | Maler, Effekte, keine Übergänge |
| [glfx.js](https://github.com/evanw/glfx.js) | 22 Bildfilter, WebGL1 | MIT | ruhend seit 23.10.2023 | als Vorlage abschreiben | Maler, Effekte |
| `StripDatamoshGlitch` in gl-transitions | Pseudo-Datamosh als Übergang | MIT | Merge #264, 22.06.2026 | wie gl-transitions | Maler (§6.7 Datamosh) |
| [FFmpeg xfade](https://ffmpeg.org/ffmpeg-filters.html#xfade) | 58 eingebaute Übergänge + `custom` | FFmpeg LGPL-2.1+/GPL (*ungeprüft in dieser Runde*); als externes Programm aufgerufen | seit 4.3 | `-filter_complex xfade=…` am Server | **Server.** Rückfall für harte Abschnittsgrenzen |
| [xfade-easing](https://github.com/scriptituk/xfade-easing) | Ausdrücke für xfade, >90 portierte GL-Übergänge, Easing | MIT; Shadertoy-Ports je Übergang eigene Lizenz | v3.6.6, Push 09.09.2026 | Ausdrücke (`-filter_complex_threads 1`, langsam) oder gepatchter ffmpeg | Server; **Easing-Katalog** als Vorbild für `progress`-Kurven |
| [ffmpeg-gl-transition](https://github.com/transitive-bullshit/ffmpeg-gl-transition) | ffmpeg-Filter `gltransition` | MIT nur im README, keine LICENSE-Datei | ruhend seit 2022 | eigener ffmpeg-Build mit GL | Server, **nein** |
| [ffmpeg-concat](https://github.com/transitive-bullshit/ffmpeg-concat) | Node-CLI, verkettet mit gl-transitions | MIT nur in package.json | 1.2.3, ruhend | headless-gl | Server, **nein** |
| [editly](https://github.com/mifi/editly) | deklarativer Schnitt, gl-transitions + `directional-*` | MIT | v0.15.0-rc.1 vom 19.01.2025 | headless-gl | Server, **nein**; Datenmodell als Vorbild |
| [MLT luma](https://www.mltframework.org/plugins/TransitionLuma/) | Wisch über Graustufenkarte, `softness`, `reverse` | LGPL-2.1 | MLT v7.40.0 | — | **nur das Verfahren**, im Shader nachbauen |
| [Jonray1-Lumas](https://github.com/Jonray1/Luma-files-for-video-transitions-in-Shotcut-and-other-video-editors) | 20 PNG-Karten 1920×1080 | **keine Lizenz** | ruhend seit 2019 | — | **nein** |
| [Kosette-Transitions](https://github.com/andeon/Kosette-Transitions) | 7 PGM-Karten | **GPL-2.0** laut README | ruhend seit 2015 | — | **nein** |
| [Remotion transitions](https://github.com/remotion-dev/remotion/tree/main/packages/transitions) | 20 Presentations (`clock-wipe`, `iris`, …) | **Remotion License, nicht frei** | v4.0.524 vom 13.09.2026 | — | **nein**; Idee „Überlappung zieht Dauer ab" |
| [Motion Canvas](https://github.com/motion-canvas/motion-canvas) | Szenenübergänge `fade`, `slide`, `zoomIn/Out` | MIT | v3.17.2 vom 14.12.2024 | — | Schnittstellen-Idee, kein GLSL |
| [rife-ncnn-vulkan](https://github.com/nihui/rife-ncnn-vulkan) | Zwischenbilder, fertige Binaries Mac/Win/Linux | Programm MIT; **Modelllizenz im README nicht genannt** | Release 20221029 | Server-Werkzeug, `-s` Zeitschritt, `-g -1` CPU | später, Morph-Übergang (§6.7) |
| [FILM](https://github.com/google-research/frame-interpolation) | Zwischenbilder, TensorFlow 2 | Apache-2.0 | **archiviert** | — | nur Referenz |
| [tiberiuiancu/datamoshing](https://github.com/tiberiuiancu/datamoshing), [moshpit](https://github.com/CrushedPixel/moshpit) | echtes Datamosh auf dem Bitstrom | Unlicense / MIT | ruhend | eigener Kodierlauf | nein für Loops (Sunos Neukodierung, VIDEO-PLAN §6.7) |

### 2.2 Welche passt in unseren Maler

**Nur gl-transitions**, dazu pixi-filters und glfx.js als Vorlagen für Effekte. Die Spec
([README](https://github.com/gl-transitions/gl-transitions)) ist genau unsere Form: eine Funktion
`vec4 transition(vec2 uv)` mit `getFromColor(uv)`, `getToColor(uv)`, `progress` 0…1 und
`ratio` = Breite/Höhe, dazu eigene Uniforms mit Standardwert im Kommentar. **Bei `progress` 0 zeigt
sie nur „von", bei 1 nur „nach"** — damit ist die Loopnaht-Bedingung der Spec selbst eingebaut.

Was unsere Stufe dafür braucht, am Code nachgesehen (`const GL=` in `web/index.html`): heute ein
WebGL-1-Kontext, ein Quad als `TRIANGLE_STRIP`, **eine** Bildtextur. Neu wären eine zweite Textur und
ein Wrapper, der `getFromColor`/`getToColor` auf die beiden Texturen legt. Die Referenz zeichnet ein
großes Dreieck statt eines Quads
([gl-transition](https://github.com/gre/gl-transition-libs), `drawArrays(TRIANGLES,0,3)`); das ist
gleichwertig. **Ungeprüft:** ob alle 125 Dateien unter WebGL 1 (GLSL ES 1.00) übersetzen. Das zeigt
ein Prüfhaken, der jede Datei einmal kompiliert.

**Nur serverseitig nützlich:** `xfade`, xfade-easing, ffmpeg-gl-transition, ffmpeg-concat, editly.
Alle haben denselben Haken: sie mischen fertige Videodateien, also **nach** dem Maler. Ein Effekt,
der über die Naht läuft (Nebel, Lichtmischpult), wäre dort zweimal gemalt und einmal gemischt.

**Lizenzrechtlich sauber für unser MIT-Repo:** gl-transitions (die zwei BSD-Dateien mit Hinweis),
gl-transition, pixi-filters, glfx.js, xfade-easing (ohne Shadertoy-Ports), editly, Motion Canvas,
rife-ncnn-vulkan als Programm. **Nicht sauber:** Kosette (GPL-2.0), Jonray1 (ohne Lizenz), Remotion,
twick (Sustainable Use License), etro (GPL-3.0), jeder Code aus MLT, Shotcut, Kdenlive, OpenShot.
ffmpeg-gl-transition und ffmpeg-concat sind MIT nur ohne LICENSE-Datei, also dünn belegt, werden aber
ohnehin nicht gebraucht.

### 2.3 Was die Videonaht-Statistik dazu sagt

Aus [`labor/videonaht/statistik.md`](../../labor/videonaht/statistik.md) (91 Videos, 15.09.2026):

| | Anzahl |
|---|---:|
| brauchen **keinen** Übergang (Nahtquotient bester Schnitt < 1) | 63 |
| Neutralzustand (1–2) | 14 |
| Ereignis (> 2) | 14 |
| davon ≤ 10 s **ohne Material** über den Schnitt hinaus | 17 von 28 |
| mischender Übergang möglich, Median D | 11 Videos, 2 s |

**Folge:** Für den **Suno-Loop aus einem einzigen Video** tragen gl-transitions wenig. Zwei Drittel
brauchen gar nichts, und von den übrigen 28 können 17 nicht mischen, weil vor dem Anfang und nach dem
Ende kein Material liegt (VIDEO-PLAN §6.7 „höchstens zehn Sekunden"). Dort helfen die
Neutralzustände, und die sind schon Effekte im Studio. **Ihren Platz haben gl-transitions an den
Abschnittsgrenzen der langen Videos (§7) und beim Wechsel zwischen zwei Quellen.** Dort liegen
immer zwei verschiedene Bilder vor, und der Übergang darf sichtbar sein (§6.3, §6.6).

---

## 3 · Was ein kleines Videostudio bei uns braucht

### 3.1 Wo wir stehen (am Code und im Labor nachgesehen)

| Baustein | Stand | Beleg |
|---|---|---|
| **Maler** `zeichneFrame(t)` als reine Funktion von t | gebaut; Canvas 2D + WebGL-Stufe mit noise4D | `web/index.html`, VIDEO-PLAN §4 |
| **Bildweiser Export** | gebaut 14.09.2026: `VideoEncoder` H.264 Annex B, Zeitstempel selbst gesetzt, Schlüsselbild alle 2 s, Vorlauf in Häppchen; ffmpeg muxt über `POST /api/effektclip-bauen`; `MediaRecorder` nur Rückfall | `kodieren()` in `web/index.html`, `server/server.js` |
| **Nahtprüfstand** | gebaut 14.09.2026, 170 Fälle über den echten Exportweg in headless Chrome | `labor/nahtpruefung/`, VIDEO-PLAN §6.8 Nachtrag |
| **Videonaht-Statistik** | 91 Videos klassiert, Nahtquotient, bester Schnitt, Übergangsstufe | `labor/videonaht/statistik.md` |
| **Loopfähigkeit** der Effekte | 85 Grundlinienfälle, schlechtestes `gleich` 0,09 | VIDEO-PLAN §6.8 Nachtrag |
| **Zeit beugen + Springen im Video (der „Lauf", 11.09.2026)** | **gebaut und am selben Morgen wieder ausgebaut** (Caspar_D: *„wir brauchen ein Konzept, so vibe mässig wird das nix"*); Code im git, Begründung in NAECHSTER_CHAT „Der Lauf ist wieder ausgebaut". Erprobt und wiederverwendbar: `t → f(t)` einmal oben in `zeichneFrame` (vorwärts, **Pendel**, Stottern, Standbild); Pendel als Kosinus mit Höhe `Lseg/π`; weiche Tempoformen `1+(s−1)·sin²(πx)`; Rasterkanten im Index statt in Sekunden runden; Export auf ein Vielfaches der Pendelperiode kürzen. **Sprungkopie** `POST /api/sprungkopie` (ffmpeg, lauter Schlüsselbilder, `<basis>.sprung.mp4`): **124,6 ms gegen 14,9 ms** je Sprung, 0,74 s Bauzeit je 10 s, 3,7-facher Platz. Die zwei `artwork.sprung.mp4` im Archiv sind Reste davon. Die sechs offenen Konzeptfragen von damals (Einheit, was darf springen, was schließt, folgen Effekte der gebogenen Zeit, Grenze zum Schnittprogramm, Sichern) gelten weiter | `git show da7310c` (Lauf), `a79575e` (Sprungkopie), `ee1fe0b` (Ausbau); VIDEO-PLAN §4 zieht danach **lineares Dekodieren** mit `VideoDecoder` dem Springen vor |

### 3.2 Lücken

| Lücke | warum sie zählt | heute |
|---|---|---|
| **Bildgenaues Dekodieren** | Ein Übergang mischt Bild k von A mit Bild k von B. Mit einem frei laufenden `<video>` ist das Zufall | `quelleSync()` setzt das Video erst bei **> 0,2 s** Abweichung nach. VIDEO-PLAN §6.8: „Bewegtbild als Quelle loopt weiterhin nicht" |
| **Zeitleiste / Abschnitte als Datenmodell** | §5 liefert Abschnitte, §7 will „Zustände je Abschnitt und Übergänge dazwischen". Ohne Liste gibt es keinen Ort für einen Übergang | nicht vorhanden; heute ein Rezept je Titel |
| **Übergang als Karte** | passt in die zweispaltige Karte (§9a.5): Übergangsart links, Dauer in Schlägen und Kurve rechts | nicht vorhanden |
| **Keyframes** | ein Regler über Liedzeit (Nebel steigt im Refrain) | nicht vorhanden; der Antrieb moduliert periodisch, er setzt keine Werte zu Zeitpunkten |

### 3.3 Was man von anderen lernen kann — Ideen, kein Code

| Von | Idee | für uns |
|---|---|---|
| **Kdenlive** ([Doku](https://docs.kdenlive.org/en/compositing/transitions.html)) | *Mix* = Naht zweier Clips auf einer Spur; *Komposition* = zwei Spuren überlagert über eine Zeitspanne | Mix ist unsere Loopnaht und Abschnittsgrenze; Komposition ist ein Effektclip über dem Video. Zwei Begriffe, nicht einer |
| **MLT / Shotcut** ([luma](https://www.mltframework.org/plugins/TransitionLuma/)) | Luma-Wisch = Graustufenkarte + `softness` + `reverse`; Keyframes mit Interpolationsart je Punkt, Zeit relativ zum Ende | Wisch als `smoothstep(p−s, p+s, karte)`, Karte **prozedural** statt als Bilddatei (umgeht Lizenz und 8-Bit-Stufen). Shotcut 26.8.1 hat „Overlay-Übergänge" als vorbereitete Clips mit Alpha ([Blog](https://www.shotcut.org/blog/)) — das ist unser Effektclip |
| **Remotion TransitionSeries** ([Doku](https://www.remotion.dev/docs/transitions/transitionseries)) | Ein Übergang überlappt beide Szenen und **verkürzt die Gesamtdauer** (60 + 40 − 30 = 70), ein Overlay nicht | Muss bei uns ausdrücklich im Datenmodell stehen, sonst verschiebt jeder Übergang die Liedzeit. Bei uns gilt: **Liedzeit ist fest, Übergänge sind Overlays** über der Grenze (§6.6: im letzten Takt, landet auf der Eins) |
| **BBC VideoContext** ([README](https://github.com/bbc/VideoContext)) | Graph aus Quelle, EffectNode, **TransitionNode** mit Mix-Parameter über der Zeit, CompositingNode | Übergang als eigene Knotenart mit zwei Eingängen. Apache-2.0, aber seit 2019 kein Release — nur Vorbild |
| **libopenshot** ([v1.0.0](https://github.com/OpenShot/libopenshot/releases/tag/v1.0.0)) | jede Eigenschaft ist eine Kurve; ein fester Wert ist eine Kurve mit einem Punkt; „Beat Sync" | Keyframes ohne Sonderfall: Regler = Kurve über Liedzeit, Standard ein Punkt |
| **auto-editor v3** ([Timeline v3](https://auto-editor.com/docs/v3)) | `timebase` als Bruch („30/1"), `start`/`dur` in Bildern, Übergänge **am Schnittpunkt**, nicht am Clip | Bildgenaue Taktbindung ohne Gleitkomma-Drift; gemeinfrei (Unlicense) |
| **Motion Canvas** (`waitUntil`, [scheduling.ts](https://github.com/motion-canvas/motion-canvas)) | im Code steht ein Name, die Zeit kommt aus der Zeitleiste | Übergang hängt an „Refrain 2", die Sekunde kommt aus §5 |

---

## 4 · Empfehlung in Stufen

### Stufe 1 — zuerst (je ein bis zwei Tage)

1. **Bildgenaues Dekodieren der Videoquelle.** Ohne das mischt jeder Übergang die falschen Bilder,
   und Bewegtbild-Loops bleiben offen. Weg nach VIDEO-PLAN §4: `VideoDecoder` linear durch die Quelle,
   Kopffenster halten, Bild zu t = letztes Bild mit Zeitstempel ≤ t.
   Zum Demuxen zwei Kandidaten, beide als Einzeldatei neben `index.html` ohne Build:
   [Mediabunny](https://github.com/Vanilagy/mediabunny) (MPL-2.0, v1.56.2 vom 12.09.2026;
   `CanvasSink.getSample(t)` liefert laut [Doku](https://mediabunny.dev/guide/media-sinks) „the last
   sample with a timestamp less than or equal to the search timestamp") oder
   [mp4box.js](https://github.com/gpac/mp4box.js) (BSD-3, v2.4.1, nur MP4, Seek und B-Frames von
   Hand). **Vorher je fünf Zeilen prüfen** (VIDEO-PLAN §13): läuft `VideoDecoder` mit den Suno-MP4s,
   stimmt die Reihenfolge bei B-Frames. MPL-2.0 ist Datei-Copyleft: unverändert eingebunden
   verträglich, gehört nach `web/fremd/LIZENZEN.md` (*für unseren Fall ungeprüft*).
2. **GL-Transitions-Adapter in der WebGL-Stufe.** Zweite Textur, Wrapper-Shader, `progress` als
   Funktion der Liedzeit mit Kurve (Easing-Namen aus xfade-easing). **Mit drei bis fünf Dateien
   anfangen, nicht mit 125** — Auswahl nach §6.7 (a)/(b): `luma` (Wisch), `StripDatamoshGlitch`,
   `crosswarp`, `GlitchMemories`, `cube` (alle fünf im Repo belegt). Je Datei Autor und Lizenz aus dem Kopf nach `LIZENZEN.md`.
   Ein Prüfhaken im Nahtprüfstand: `progress` 0 gleich Bild A, 1 gleich Bild B, bitgleich.

### Stufe 2 — danach (mehrere Tage)

3. **Abschnittsliste als Datenmodell**, so klein wie möglich: `[{typ, von, bis, quelle, rezept}]` in
   Bildern auf rationaler Bildrate, **Übergänge an der Grenze** `{art, schlaege, kurve}`. Liedzeit
   fest, Übergänge überlappen nicht (Remotion-Regel umgekehrt). Speist sich aus §5.
4. **Übergang als Karte** im Studio, mit Nutzerwörtern (*Wisch*, *Schieben*, *Aufdecken*,
   *Blende* — das Namensschema von `xfade` taugt als Wortschatz). Die Auswahl macht die Automatik aus
   dem Nahtquotienten (§6.7), der Mensch korrigiert.
5. **Keyframes als Kurve über Liedzeit**, ein Punkt = fester Wert (libopenshot-Modell). Erst, wenn
   ein Abschnitt tatsächlich einen wandernden Regler braucht.

### Stufe 3 — später, nur mit Messung

6. **Morph-Übergang mit rife-ncnn-vulkan** als Server-Werkzeug zwischen zwei Standbildern. Vorher
   Modelllizenz belegen und Rechenzeit auf dem Intel-Mac mit `-g -1` messen.
7. **Browser-Mux mit Mediabunny** statt ffmpeg, falls der Server-Mux einmal stört. Heute kein Grund.
8. **Teilstück-Rendern:** Abschnitte einzeln kodieren, am Server per Kopie verbinden (Revideo-Idee).
   Setzt gleiche Kodierparameter und ein Schlüsselbild am Abschnittsanfang voraus. Erst bei vollen
   Musikvideos.

### Nie

| Was | Warum |
|---|---|
| ffmpeg.wasm | GPL-Core, langsamer als unser nativer ffmpeg, 2-GB-Grenze |
| ffmpeg-gl-transition, ffmpeg-concat, editly als Abhängigkeit | eigener ffmpeg-Build oder headless-gl auf Mac/Windows/Docker; doppelter Zeichenpfad |
| `xfade` als Hauptweg für Übergänge | Vorschau ≠ Export; mischt nach dem Maler. Höchstens Rückfall für harte Schnitte am Server |
| Remotion, twick, Diffusion Studio | keine freie Lizenz bzw. Wasserzeichen; React-Bindung |
| Code aus MLT, Shotcut, Kdenlive, OpenShot, etro | LGPL/GPL |
| Kosette- und Jonray1-Lumas | GPL-2.0 bzw. ohne Lizenz; Formen selbst prozedural erzeugen |
| Knotengraph-Editor | Olive steht seit dem Umbau still; lineare Effektstapel plus Übergänge an Grenzen reichen |

**Einordnung in VIDEO-PLAN §11:** Stufe 1.1 ist der offene Rest von Punkt 5 (§4, „linear dekodieren
statt springen"), Stufe 1.2 gehört zu Punkt 10 (§6), Stufe 2.3 ist Punkt 7 und 9 (§5, §7). Die
Reihenfolge dort bleibt richtig: Dekodieren vor Übergängen.

---

## 5 · Offene Fragen an Caspar_D

| | Frage |
|---|---|
| 1 | ~~**Welche Sammlung hast du gesehen?**~~ Beantwortet (15.09.2026): [Rickkorsten/ffmpeg-transitions](https://github.com/Rickkorsten/ffmpeg-transitions) — MIT, 5 KB, zwei Commits vom 18.07.2024. Keine eigene Sammlung, sondern eine TypeScript-Hülle, die Clips mit den 58 eingebauten `xfade`-Übergängen plus `acrossfade` verkettet (Befehlszeile als Text, nicht loopfähig, jeder Übergang kürzt das Ergebnis). Caspar_D: *„dann ist dieses Miniprojekt nur der Aufmerksamkeitstrigger für github für mich gewesen."* |
| 2 | **Wo zuerst Übergänge:** am Suno-Loop (laut Statistik brauchen 63 von 91 keinen, 17 können nicht mischen) oder an den Abschnittsgrenzen der langen Videos, wo sie wirklich tragen? |
| 3 | **Mediabunny (MPL-2.0) als erste Fremdbibliothek mit Datei-Copyleft** neben MIT — einverstanden, oder lieber mp4box.js (BSD-3) mit mehr Handarbeit? |
