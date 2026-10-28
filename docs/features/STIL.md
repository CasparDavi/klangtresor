# Stylesheet für das Feature-Dokument

So entsteht `docs/features/index.html`. Alles hier ist mit Caspar_D am 27.10.2026 Kachel für Kachel
erarbeitet worden; jede Regel hat ein Bild hinter sich, an dem sie gescheitert oder gelungen ist.
Wer eine Kachel neu macht, liest zuerst hier — und zeigt das Ergebnis, bevor er weiterbaut.
Die projektunabhängigen Regeln (Arbeitsweise, Web → PDF, Styleguide, Mehrsprachigkeit) stehen in [LEITFADEN.md](LEITFADEN.md).

## 1. Arbeitsweise

- **Von oben nach unten, Abschnitt für Abschnitt.** Erst der eine Abschnitt fertig, dann der nächste.
- **Bild sofort einsetzen und zeigen.** Ein Bild wird im Zusammenhang beurteilt, nie allein.
- **Song-Auswahl und Farbschema fragen, nicht entscheiden.** („zu viel Entscheidung von deiner Seite")
- **Wichtiges vor Neuem.** Was heute gebaut wurde, ist nicht deshalb ein Feature.
- **Nichts Beta.** (Der Geschichten-Raum flog raus.)
- **Nichts Selbstverständliches.** „Farben nie erfunden" o. Ä. steht nie im Material.
- **Nur öffentliche Titel in Bildern.** Ausnahme: Plakate brauchen alle Cover, sonst haben sie Löcher.

## 2. Farbe und Grund

- **Marsianer-Orange überall.** Töner „Marsianer" in der App, Palette `#ff7a1a #a3201c #e8c27a #c2531d …`.
- **Hell auf dunkel.** Kein weißer Grund. Wo Papier gezeigt wird, steht es im **Zimmerlicht** (Abschnitt 6).
- **Der rote Morgenknopf bleibt rot** (`#e31c79`), auch im Schaubild, auch beim Umfärben.
- **Schaum:** Farbregler 70 %, Fläche nach Kommentaren. Groupie-Schaum: Maß „Treue".
- **Kein schwarzes Plakat ins Zimmer.** Papier-Vorlage, warm beleuchtet.

## 3. Die Kachel

```
┌───────────────────────────────┐
│ Augenbraue (orange)        ⊕  │  grauer Textteil, oben
│ Überschrift                   │  Überschriften einer Reihe auf derselben Grundlinie (subgrid)
│ Ein Satz                      │
├───────────────────────────────┤
│                               │  schwarzer Bildteil, Rahmen innen 1.5px in Panelfarbe (::after); hell (#4a4a52) nur beim Nachbarschafts-Diagramm
│           Grafik              │  Kante an Kante, steht auf dem Boden
└───────────────────────────────┘
```

- Breiten `w`: 4/5/6/7/8/12 von 12 Spalten. Flags: `oben` (Text oben), `quer`.
- **Bildunterkanten einer Reihe fluchten.** Das gelingt nur, wenn die Seitenverhältnisse zur Breite
  passen: gleiche Höhe heißt `w₁/f₁ = w₂/f₂` (f = Breite/Höhe). Beispiele aus dem Dokument:
  - Zimmer 3:2 (1,5) + Ausschnitt 1,045 → **7 + 5**
  - Papier-Plakat 1,398 + Skizzenbuch 0,679 → **8 + 4**
- **Bleibt oben ein schwarzer Streifen**, ist das Bild zu flach für seine Kachel — höher schneiden,
  nicht skalieren. Zweizeilige Überschriften machen den Bildteil kürzer; nachmessen mit Bildschirmfoto.
- Das Seitenverhältnis steht in `FORMAT` und muss zum geschnittenen Bild passen.
- Nach jedem Bildwechsel `BV` hochzählen (Cache).
- Abschnittsüberschrift und Kachelüberschrift nie gleich.

## 4. Bildschnitt

- **Format folgt der Kachel.** Hochkant-Kachel → hochkant schneiden.
- **Keine textlastigen Bildschirmfotos.** Nur den Grafikteil, Text schreiben wir selbst in die Kachel.
- **Nie Helles oder Schrift anschneiden.** Schnitte liegen in Lücken (Zeilenzwischenräume).
  Bewusst angeschnitten werden darf, was flächig weiterläuft: Wand, Schaum, Himmel.
- **Wenig Leerfläche.** Was keine Aufgabe hat, fliegt raus.
- **Keine Gestaltungsreste** an den Rändern: graue Panelränder, Rollbalken, Beta-Pillen, halbe Beschriftungen.

## 5. Schärfe

- In **Anzeigebreite** speichern: w12 ≈ 2360 px, w8 ≈ 1560, w7/w6/w5/w4 ≈ 1180.
- Kette: `scale=…:flags=lanczos,unsharp=3:3:0.4` → `cwebp -q 93 -sharp_yuv`.
- **Eingesetzte Bildschirme nie weich:** erst Lanczos auf Zielgröße, dann verzerren (`werkzeug/setzen.mjs`).
- **Ecken messen, nicht schätzen.** Kantenanpassung (`werkzeug/kanten.mjs`) oder Caspar_D setzt die
  Ecken selbst im Eckenwerkzeug (Sandkasten `web/features/ecken/`).
- zsh-Falle: `$h:flags` ist ein Modifikator. Immer `${h}:flags`.

## 6. Papier im Zimmerlicht

Gilt für jedes Papier-Plakat, das allein steht, und für Ausschnitte daraus. Weißes Papier „knallt"
auf dem dunklen Grund; es bekommt dieselbe Lichtstimmung wie das Zimmerbild.

| Größe | Wert | Bedeutung |
|---|---|---|
| `ST` | 0.85 | Grundhelligkeit |
| `WARM` | 255,196,134 | Lampenfarbe |
| `FALL` | 0.52 | Abfall von der Lampe (links) nach rechts |

- `werkzeug/licht.mjs` — Plakat im Zimmerbild: Licht, Schlagschatten, Körnung.
- `werkzeug/ton.mjs` — flaches Plakat oder Ausschnitt mit **derselben** Formel; der Ausschnitt wird an
  seinen Ort im Plakat gerechnet, damit Ausschnitt und Ganzes zusammenpassen.
- Prüfung: Papierfarbe links im Zimmer 189/144/95, im getönten Ausschnitt 191/145/96.
- **Skizzenbuch (Pergament): Kerzenlicht** mit `werkzeug/kerze.mjs` — Lichtfarbe 255,190,120, ST 0.9,
  Lichtpunkt bei 40 % / 55 %, quadratischer Abfall FALL 0.45, **nie dunkler als BODEN 0.55**.
  Nicht ffmpeg `vignette`: die läuft an den Ecken bis Schwarz und schluckte Titel und Ecke.
  Erst nur abdunkeln (×0,8) war zu wenig — das Pergament wirkte grünlich-grau neben dem warmen Papier.
- Herleitung: zwei Varianten (A: dunkler, B: wärmer) → „ein Zwischending der oberen beiden" → diese Werte.

## 7. Druckbilder

- PDF aus dem Plakat-Studio abfangen (`Page.printToPDF`), dann mit der **Apple-Engine** rastern:
  `sips -s format png -Z 4000`.
- Papier-Ausschnitt: `crop=1405:1345:0:1445` aus dem 4000×2862-Raster (Zellen 44–62, Zeitleiste,
  Titel, Werkverzeichnis bis zur letzten Zeile).
- Skizzenbuch: `crop=1564:2304:0:0` aus 2807×4000 (Titel, Inspirazione, oberer Schaum).

## 8. Sprachen

- EN voreingestellt, DE, RU\*. Jedes Bild mit Oberflächentext je Sprache (`-de`, `-en`); RU fällt auf EN.
- Aufnahmen per `SPR`-Umgebungsvariable in der richtigen Sprache, nie nachträglich übersetzt.
- Russisch kyrillisch.

## 9. Handys auf der Platte (Abschnitt „Entspannen“)

- **Aufnahmen:** `werkzeug/handys/haengung.mjs` — echte App im Sandkasten, ein Gerät 390×844 bei DPR 3; je Lage ein
  eigener Chrome (`QUER=1`), sonst bleibt die Bühne halbhoch. Marsianer, Fläche nach Kommentaren, Groupies nach Treue.
  Nur, was auf dem Handy wirklich geht: kein Tonstudio, kein Ringspektrum. Liedzeilen ohne Anzüglichkeiten (Vanille-Eis).
  Sternhimmel: Doppelklick, dann zwei Zoomschritte und ein Stück nach oben schieben (der Zoom hält das Schiff fest).
- **Hängung:** Caspar_Ds Zeichnung ausgelesen (Flächenschwerpunkt und Hauptachsen je Handy), gerade gedreht, Fugen gleich.
- **Platte:** `werkzeug/handys/platte2.mjs` — Chrome malt nur Platte, Glanz, Lichtschein und Sockel; jedes Gerät wird
  **flach** gerendert (`gesicht.html`), mit Lanczos auf Zielgröße gebracht und **selbst entzerrt** auf die Ecken, die
  Chrome für unsichtbare Eckpunkte meldet. Chromes eigene 3D-Ebenen rastern ohne Fenster zu grob (weich oder treppig).
- **Beschnitt:** Caspar_D zieht den Rahmen. Die Suche (`beschnitt4.mjs`) zeigte: Bei einer gezackten Gruppe gibt es
  kein 2:1-Rechteck mit Handys an allen Rändern — die Gruppe ist in der Aufnahme ein Band von etwa 3,5:1.

## 10. Effektclip (Abschnitt „Gestalten“)

- Der Clip entsteht **über den Export des Studios** im Sandkasten (`werkzeug/handys/okkult.mjs`, Knopf „Video“,
  Download abgefangen), nie von Suno geholt. Titelbild und Tiefenkarte als einzelne Mediendateien verlinken.
- Tiefenkarte nicht weiß zeigen: Grau → Schwarz bis Marsianer-Orange (`lutrgb` r·1, g·0,48, b·0,10). Hell bleibt nah.
- Die Effekte heißen wie im Studio (`ec.effekt.*.name`, `ec.wahl.art.*`), je Sprache aus `web/ui-sprache*.js`.
- **Halbe Geschwindigkeit** nicht über `playbackRate` (30 → 15 Bilder/s, ruckelt), sondern neu gerechnet:
  `minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts=2*PTS`, `-r 30 -crf 17`.
