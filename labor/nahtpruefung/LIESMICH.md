# Nahtprüfung: loopt der Effektclip-Export?

Caspar_D, 14.09.2026: „es muss halt der effekt wieder zum Ursprung zurückkehren auf dem letzten frame".
Im Export (LOOP>0) muss Bild(t0+L) == Bild(t0) sein, für jeden Effekt und jede Reglerstellung. Dieser
Prüfstand misst das über den **echten Exportweg** des Studios (`ausschnitt()`, `raster()`,
`exportBuendel()`, `exportBild()`, `LOOP`, `FEIN` wie im kodierenden Weg) in headless Chrome, ohne Pakete.
Methode: VIDEO-PLAN §6.5 (Nahtquotient) und §6.8 (vier Klassen). Befund aus der Code-Lesung: `befund.md`.

## Aufruf

```bash
node labor/nahtpruefung/naht.mjs                              # alle Fälle, Tabelle auf der Konsole
node labor/nahtpruefung/naht.mjs --faelle puls-zufall,licht   # nur diese
node labor/nahtpruefung/naht.mjs --typ laser                  # alle Fälle mit einem Laser
node labor/nahtpruefung/naht.mjs --jobs 4 --aus ergebnis.json # vier Chrome nebeneinander, Ergebnis ablegen
node labor/nahtpruefung/naht.mjs --vorschau-vergleich labor/nahtpruefung/vorschau-vorher.json   # hat sich die Vorschau verändert?
node labor/nahtpruefung/naht.mjs --taktlage                  # Katalogmessung der Taktlage über taktLage() im Studio
node labor/nahtpruefung/naht.mjs --taktlage /pfad/x.json      # dasselbe, Ergebnis in eine andere Datei
```

Weitere Schalter: `--vorschau-speichern datei` (je Fall drei LOOP=0-Bilder, 64×86), `--lange 360`
(lange Seite des Exports), `--bilder verzeichnis` (Bild 0, N−1 und N als PNG zum Hinsehen),
`--faelle-datei`. `--wachhund <s>` setzt den Abbruch ohne Fortschritt (Vorgabe seit 15.09.2026 **1800 s**; die Kombinationen `rand-kombi*` brauchen rund 900 s). **Wiederaufnahme:** Jeder fertige Fall landet sofort in `.zwischenstand/`. Ein abgebrochener Lauf wird mit demselben Aufruf fortgesetzt und übernimmt die fertigen Fälle, solange Studio-Stand, Messart, Schalter und Falldefinition gleich sind; Fälle mit Abbruch werden nie übernommen, `--neu` verwirft den Zwischenstand. Caspar_D: *„sei bei den Wächtern einfach immer etwas großzügiger und mach es idempotent"*.

**Vorbereitung je Fall** (`vorb` im Fall, 18.09.2026): ein Objekt wie im gespeicherten Rezept (`belichtung`,
`kontrast`, `lichter`, `schatten`, `saettigung`, `temperatur`, `farbton`, `sepia`, `schaerfe`, `grad`). Es geht
durch `vorbAus()` wie beim Öffnen eines Titels. Bis zum 18.09.2026 stand in **keinem** Fall eine Vorbereitung —
und genau darum blieb unbemerkt, dass die Vorbereitung den fertigen Ausschnitt der Ken-Burns-Parallaxe ein
zweites Mal ausschnitt (mittlere Abweichung 56,4 von 255). Wer eine neue Stufe **vor** die Kette baut, nimmt
einen Fall mit `vorb` dazu.

Datenvarianten (`daten` im Fall, mit Komma kombinierbar, der Reihe nach): `ohneEins`, `ohneSchlaege`, `dreiviertel`, `sechs` (6/8), `nurEinsen`, `gestreckt:f` (Schlagzeiten um jetzt f-mal gedehnt, `gestreckt:3.22` gibt auf Titel a einen Takt von 5,1 s), `wenige:n` (nur die n Schläge um jetzt), `tempowechsel:f` (ab jetzt f-mal so langsam). Gruppe `raender` (Gegenprüfung 15.09.2026): Ergebnisse in `ergebnis-raender*.json`. Gruppe `nachbesserung` (Nachbesserung nach der Gegenprüfung, 15.09.2026): Tempo-Gegenproben (`nachbess-bewegung-licht-fest` zeigt, wie viel `tempoVerh` der Puls einer Leuchte allein ausmacht, rund 1,4) und der Farbtausch der Laufstreifen; Stand vorher `ergebnis-nachbesserung-vorher.json`, nachher `ergebnis-nachher.json`. Jeder Lauf nimmt freie Ports und ein eigenes Profil `.profil-<pid>-<job>` und räumt
beides weg; Läufe dürfen parallel stehen. Die Ports 8788 und 18811 fasst er nicht an.

Grundlinie vor jeder Reparatur: `ergebnis-vorher.json`, `vorschau-vorher.json` (Stand bdbb44c plus
der verhaltensneutralen Umstellung `exportBuendel`/`exportBild` in web/index.html).

Rauschshader (15.09.2026): Grundlinie der Gruppe `shader` in `ergebnis-shader-vorher.json` und
`vorschau-shader-vorher.json` (dort auch die Vergleichsbilder der neuen Fälle), nachher `ergebnis-shader.json`,
Rechenzeit `ergebnis-shader-zeit.json` (`--jobs 1 --lange 816`), der verworfene Torus-Weg im Vergleich
`ergebnis-shader-torus-versuch.json` und `ergebnis-shader-rauch-torus-versuch.json` (Fälle mit Endung `-torus`).

## Stand (14.09.2026, Nachbesserung 15.09.)

Die Loop-Reparatur ist gebaut: **170 Fälle, keiner mit `gleich` ≥ 1**,
vorher brachen 41 der 85 Grundlinienfälle. Vollmessung `ergebnis-nachher.json`, unabhängige Kontrolle `ergebnis-kontrolle.json`,
Grundlinie `ergebnis-vorher.json`. Tabelle, Abweichungen vom Pult und offene Punkte: `docs/NAECHSTER_CHAT.md`
„Loop-Reparatur gebaut und gemessen", Verfahren: VIDEO-PLAN §6.8 Nachtrag, Regel 17 in EFFEKTCLIP-REGELN.

| Ergebnisdatei | Gruppe / Zweck |
|---|---|
| `ergebnis-vorher.json`, `vorschau-vorher.json` | Grundlinie vor jeder Reparatur (85 Fälle, Vorschaubilder) |
| `ergebnis-zeit-alle.json` | nach der Zeitmaschinerie (`lp*`, Raster, Vorlauf, `loopNein`) |
| `ergebnis-leuchten.json`, `-stichprobe` | Scheinwerfer, Schatten, Laser |
| `ergebnis-partikel-vorher.json`, `ergebnis-partikel.json` | Lebensdauer-Betrieb Partikel/Tropfen |
| `ergebnis-stoerungen.json`, `-stichprobe` | Zufall je Bild/Fenster/Schlag, Streifen, Risse |
| `ergebnis-shader*.json`, `vorschau-shader-vorher.json` | Rauschshader, Rechenzeit, Torus-Versuch |
| `ergebnis-linse*.json` | Gruppe `linse` (Bewegungsfälle mit Linse) |
| `ergebnis-raender*.json` | Gegenprüfung, 30 Randfälle |
| `ergebnis-nachbesserung-*.json`, `ergebnis-nachher.json` | Nachbesserung und Vollmessung |
| `ergebnis-taktlage.json` | Taktlage (15.09.2026): alle Katalogtitel über `taktLage()`, je Titel Lage, Sitzanteil, Nachrechnung am Exportraster, Lage von vorher |
| `studiofeld.json`, `studio-vorher.json`, `massstab-vorher.json` | Studiomass (15.09.2026): Vorgabefeld des Studios, Hashes in Studiogröße, Größenabhängigkeit 360/1080 - Grundlinie vor der Einheit u |
| `massstab-nachher.json`, `ergebnis-massstab-loop.json` | nach dem Einbau der Einheit: Größenabhängigkeit und Loop-Vollmessung |
| `ergebnis-loop-ansicht.json`, `ergebnis-loopstufe-loop.json` | Stufe „Schleife schließen" (bis 15.09. abends „Loop verbinden") (15.09.2026): Loop-Ansicht gegen Export, Loop-Vollmessung danach |
| `studio-parallaxe.json` | **Hashes aller 193 Fälle in Studiogröße nach der Parallaxe (18.09.2026).** Gegen den Stand davor (`63ea4450…`) gemessen: 184 bitgleich, **verändert nur die 9 Ken-Burns-Fälle mit Parallaxe > 0**; `kb-parallaxe-aus` und `kb-vorb` bitgleich. Damit ist belegt, dass der neue Gang niemanden sonst anfasst. Aufruf: `--studio-vergleich labor/nahtpruefung/studio-parallaxe.json` |
| `ergebnis-kenburns.json` | Gruppe `kenburns` (18.09.2026): die sechs Läufe der Ken Burns Fahrt, drei Stellungen der Parallaxe, Vorbereitung mit und ohne Parallaxe |
| `ergebnis-taktlage-loop.json` | Vollmessung nach dem Einbau der Taktlage, mit Gruppe `taktlage` (Phase, Schlagraster mit Gruppe und Kick, 3/4, ohne Einsen, Tempowechsel) |

**Vor dem Einbau eines neuen Effekts oder Reglers** (Regel 17e): Fall in `faelle-bauen.js` eintragen (und
in faelle.json anhängen), `naht.mjs --faelle <neu> --vorschau-vergleich vorschau-vorher.json`, Urteil `gleich`
und `gleichFolge`. Neue Fälle haben kein Vergleichsbild, bis jemand `--vorschau-speichern` auf dem alten Stand
laufen lässt — ohne das ist „Vorschau unverändert" nur Code-Lesung.

Taktlage (15.09.2026): `naht.mjs --taktlage [datei]` liest `library/katalog.json.gz` (nur lesen), reicht die
Titel in Häppchen von 12 per CDP an `taktLage()` im gebauten Studio und rechnet zwei Kartenlagen: `schlag` (keine
Karte liest die Eins) und `takt` (eine Karte liest die Eins). Je Titel stehen N, M, P, φ, `sitzt`, `anzeige`,
`einsQuote`, `refrain`, `grund`, Rechenzeit, `nach` (Nachrechnung am exportierten Raster, muss `anzeige` gleichen)
und `vorher` (altes `ausschnitt()` mit Phase 0, nach denselben Regeln gezählt). Stand: ohne Eins-Karte Median
98,4 % (vorher 19,4), mit Eins-Karte angezeigt 59,6 % (vorher 15,5). Der Fallsatz hat dazu die Gruppe `taktlage`
(7 Fälle, dazu Titel d und e): **sie steht nur in `faelle.json`, nicht in `faelle-bauen.js`** — wer faelle.json neu
schreibt, trägt sie vorher dort nach. Zahlen, Modell und offene Punkte: `docs/NAECHSTER_CHAT.md` „Taktlage: der
Zehnsekünder sitzt auf dem Lied", VIDEO-PLAN §3 „Gebaut 15.09.2026", Regel 18 in EFFEKTCLIP-REGELN.

## Studiomass: skalieren die Effekte mit dem Bild? (15.09.2026)

Caspar_D, 15.09.2026: „unsere eigenen Effektclips skalieren nicht mit dem zoom auf die videos. Die Schneeflockengröße,
die Laserbreite bleiben immer gleich" – „im Studio arbeite ich ja nach Augenschein, was dort rauskommt ist der Maßstab,
den wir am Ende brauchen." – „ich benutzte bisher immer die vorgegebene Fenstergröße." Drei Messungen, aufgenommen vor
dem Umbau auf die Einheit u (Bildbreite der Leinwand durch Breite desselben Bildes im Studio in Vorgabegröße):

```bash
node labor/nahtpruefung/naht.mjs --studiofeld                                   # -> studiofeld.json
node labor/nahtpruefung/naht.mjs --studio-speichern labor/nahtpruefung/studio-vorher.json --jobs 3 --wachhund 1500
node labor/nahtpruefung/naht.mjs --studio-vergleich labor/nahtpruefung/studio-vorher.json --aus /scratch/studio-nachher.json --jobs 3 --wachhund 1500
node labor/nahtpruefung/naht.mjs --massstab labor/nahtpruefung/massstab-nachher.json --jobs 3 --wachhund 1500 [--bilder verzeichnis]
```

- **`--studiofeld [datei]`** öffnet das Studio in headless Chrome mit Fenster 2560×1440, 1920×1080 und 1440×900 (je einmal
  Sichtfläche = Fenster, einmal um 87 px Browserleiste gekürzt) und liest `#tbs-feld`, Kasten, Kopf, Pult und die Leinwand
  nach `groesse()` für die Titel a–e ab. Bindend ist `vorgabe.feld` bei 2560×1440: **898 × 889** (Kasten 1720×940, Kopf 49,
  Pult 820; mit und ohne Leiste gleich). Bei 1920×1080 ist das Feld 950×889 (Pult 40vw = 768), bei 1440×900 819×804 bzw. 819×721.
- **`--studio-speichern datei`** malt je Fall mit LOOP=0 drei Augenblicke (t0, t0+2,3, t0+5,7) auf eigenen Leinwänden in
  Studio-Vorgabegröße: Quellbild eingepasst in das Feld aus `studiofeld.json` wie `groesse()` (Titel a: 629×889). Frische
  Karten, Zufall gesät (777), Nachzieh mit 45 Bildern Anlauf, ohne Hauszeichen. Je Augenblick SHA-256 über alle
  RGBA-Bildpunkte. Jeder Augenblick wird zweimal gemalt: ungleiche Hashes heißen `deterministisch: false`, dann steht das
  `eigenrauschen` (mittel, max, block) daneben. Die Vergleichsbilder (lange Seite 96, RGB) gehen nach `<datei>.bilder.json`.
- **`--studio-vergleich datei`** malt dasselbe und vergleicht: `gleich` (alle Hashes gleich, das Urteil für „bei u = 1
  bitgleich"); sonst `abwMittel`/`abwMax` gegen das Vergleichsbild (0..255). `massGleich` meldet eine andere Leinwandgröße.
  Ergebnis nur mit `--aus`.
- **`--massstab datei`** malt je Fall mit LOOP=0 den Augenblick t0+2,3 einmal mit langer Seite 360 und einmal mit 1080, beide
  mit `imageSmoothingQuality high` auf lange Seite 256 verkleinert: `mittel` und `block` (größter 16×16-Block), 0..255.
  Klein heißt: das Bild sieht in beiden Größen gleich aus, der Effekt skaliert. Je Titel läuft ein Kontrollfall `boden-<titel>`
  ohne Effekt mit (auch in den Studio-Läufen; `--ohne-boden` lässt ihn weg); `ueberBodenMittel`/`ueberBodenBlock` ziehen ihn ab.
  Weichzeichnende Effekte können unter dem Boden liegen, weil sie das Aliasing der kleinen Leinwand selbst glätten.
  `jeTyp` sortiert die Typen nach dem schlechtesten Block. `--bilder` legt je Fall beide Fassungen nebeneinander als PNG ab.

Stand 3542c0a (15.09.2026, 177 Fälle + 5 Böden): alle 182 Fälle in Studiogröße deterministisch, auch WebGL über SwiftShader;
ein zweiter, unabhängiger Lauf gibt 182 von 182 gleiche Hashes. **Achtung:** Bitgleichheit hängt am Laden. Der erste
Grundlinienlauf lief neben einem zweiten `naht.mjs`, dessen `stand.js` die Verweise in `site/` kurz abräumte; ein Job lud
dabei ein Titelbild anders und 54 Fälle wichen um ~0,2 im Mittel ab (bis 38 im Pixel). `stand.js` lässt richtige Verweise
seitdem stehen – trotzdem keinen zweiten Lauf starten, während ein Studio-Lauf seine Chrome hochfährt. Größenabhängigkeit, Vorgabefall über dem Boden (Block): partikel 32,8,
schaerfe 21,2, risse 15,2, tropfen 11,8, laser 10,3, bloom 8,5, spiegel 7,5, einschlag 6,5, wackeln 5,0, scanlines 4,7,
rauschen 2,3; schlechteste Fälle partikel `rand-ohneSchlaege-takt` 80,3, einschlag `rand-jetzt-anfang` 48,8, licht
`rand-wenige7` 31,9, streiflicht `streiflicht-licht` 21,1. Null über dem Boden heißt nur „zu t0+2,3 nicht sichtbar"
(licht, streiflicht, sicherung, streifen, bloecke im Vorgabefall) – kein Freispruch. Boden: Titel a 1,80/9,33, e 6,86/16,01.

Grundlinien vor dem Umbau: `studiofeld.json`, `studio-vorher.json` (Hashes, versioniert; Bilder in `studio-vorher.bilder.json`,
lokal), `massstab-vorher.json`. Die alte `vorschau-vorher.json` (Exportgröße, lange Seite 360, dort ist u ≈ 0,4) ist für
größenabhängige Effekte nach dem Umbau nicht mehr vergleichbar – Maßstab für „Studio unverändert" ist `studio-vorher.json`.

Nach dem Einbau der Einheit (EINHEIT in web/index.html, 15.09.2026): `--studio-vergleich studio-vorher.json` 182 von 182 bitgleich;
`massstab-nachher.json` (über dem Boden, Block, Vorgabefall vorher → nachher): partikel 32,8 → 0,0, schaerfe 21,2 → −7,6, risse 15,2 → 4,8,
tropfen 11,8 → 0,7, laser 10,3 → 0,0, bloom 8,5 → 0,0, spiegel 7,5 → 0,7, einschlag 6,5 → 0,0, scanlines 4,7 → 4,0, rauschen 2,3 → 0,5;
schlechteste Fälle vorher partikel 80,3 → 2,7, einschlag 48,8 → 0,2, licht 31,9 → −2,9, streiflicht 21,1 → 0,0, filmnebel mit Scanner 15,2 → −1,6.
Übrig: wackeln 5,0 (unverändert, Nachabtastung der Bandversätze), risse 4,8 (Striche unter einem Bildpunkt), kaustik+wellen 4,9.
Loop-Vollmessung danach: `ergebnis-massstab-loop.json`, 177 Fälle, gleich und gleichFolge höchstens 0,092.

## Loop-Ansicht: zeigt die Stufe „Loop verbinden" das Suno-Bild? (15.09.2026)

Caspar_D, 15.09.2026: „ein Modusknopf im Studio - 10 Sek. Loop wäre gut". Die vierte Stufe im Pult zeigt die Lage, die der
Export wählen würde, und mit „10-s-Loop ansehen" zur Songzeit s das Clipbild i = round((s mod L)·30) mod N.

```bash
node labor/nahtpruefung/naht.mjs --loop-ansicht labor/nahtpruefung/ergebnis-loop-ansicht.json --jobs 3 --wachhund 3600   # rand-kombi* brauchen mehr als 1500 s
```

Je Fall sieben Songzeiten (0,06 s, jetzt, knapp vor 3·L auf beiden Seiten der Rundung zu Bild 0/N−1, 7,5·L, 12·L + 0,49 Bild,
Liedende). `lageGleich`: die Stufe rechnet dieselbe Lage wie `ausschnitt()`; `satzGleich`: ihre Zeile endet auf `taktSatz()`;
`bitgleich`: Ansichtsbild (`loopBildMalen(zeit())`, frische Karten, Saat 777) gegen `exportBild()` auf frischem Bündel gleicher
Größe bei t0 + i/30, i im Haken unabhängig gerechnet (SHA-256 aller RGBA-Bildpunkte); `folge` (Hinweis, kein Urteil): gegen den
echten Export Bild 0…i der Reihe nach – dort tragen Nachzieh-Spur und gewürfelter Zufall ihre Vorgeschichte; `dicht`: LOOP und
FEIN stehen nach jedem Ansichtsbild auf 0/false; `ausGleich`: ausgeschaltet malen `rahmen()` und danach `zeichneFrame()` bitgleich
das Pultbild von vor dem Einschalten (zweites Bild in Folge; `ausErstesBildVorher` sagt, ob schon das erste gleich war – bei
`scanlines` nicht: das erste Bild nach einem Kartenwechsel erbt Zeichenzustand der Pultleinwände, `frisch()` setzt nur Transform,
Alpha und Verrechnung; das ist älter als die Stufe).

Stand 15.09.2026 (web/index.html mit der Stufe): 174 Fälle × 7 Songzeiten = 1218 von 1218 bitgleich, Lage und Satz in allen
gleich, dicht, aus gleich (`ergebnis-loop-ansicht.json`, 2867 s mit `--jobs 3`); die drei `rand-kombi*` (Nachhall 0,98 mit
Nebel und Teilchen, je Songzeit rund eine Stunde) nur mit `--loop-zeiten 1 --ohne-folge`: 3 von 3 bitgleich
(`ergebnis-loop-ansicht-kombi.json`). Gegen die echte Exportfolge weichen nur `scanlines` (0,05) und drei Nachzieh-Fälle (bis 0,17 Block)
ab – Vorgeschichte, kein Rechenfehler. Danach `--studio-vergleich studio-vorher.json` 182 von 182 gleich, Loop-Vollmessung
`ergebnis-loopstufe-loop.json` 177 Fälle, gleich und gleichFolge höchstens 0,092.
Achtung: `zeit()` nimmt den Player erst ab 0,05 s – darunter läuft die freie Uhr, darum 0,06 statt 0.

## Was hier liegt

| Datei | |
|---|---|
| `naht.mjs` | Lauf: baut den Stand, statischer Server, headless Chrome über CDP, Tabelle |
| `stand.js` | holt tbs-modul.js/tbs.css aus web/index.html nach `site/`, setzt den Prüfhaken ein, Verweise auf Medien |
| `haken.js` | der Prüfhaken `window.__naht` - lebt nur in `site/`, nie in web/index.html |
| `faelle.json` | die Fälle: jeder der 38 Typen mit Vorgaben plus die Unterfälle aus befund.md, feste Titel-IDs |
| `faelle-bauen.js` | schreibt faelle.json neu und sucht die Titel aus _songs.json aus |
| `syntax.js` | baut jedes Inline-Skript von web/index.html (Exitcode ≠ 0 bei Fehler) |
| `befund.md` | Code-Lesung mit Zeilennummern, Arbeitsgrundlage |
| `taktlage-prototyp.js` | Taktlage-Prototyp vom 15.09.2026, vor dem Einbau: rechnet (N, M, φ) in node am Katalog (nur lesend), Schalter `--raster takt\|schlag`, `--varianten` (Toleranz, Gleichstand, Gewichte, N-Untergrenze, brauch), `--brauch n`, `--json datei` (je Titel die Wahl, am besten ins Scratchpad), `--wie-eingebaut` (Korrekturen der ersten Gegenprüfung). **Historisch:** er kennt die Nachbesserung vom 15.09. abends nicht (Takt-Einsen, 80-ms-Fenster, Doppeltempo, Abstand am ganzen Lied) und trifft den eingebauten Code nicht mehr Titel für Titel. Maßstab ist `naht.mjs --taktlage` |

`site/`, `.profil-*` und `bilder-*/` sind abgeleitet und stehen in .gitignore. Ebenso lokal bleiben die
Vorschau-Grundlinien `vorschau-*.json` (je Fall drei kleine Bilder der Titelbilder, zusammen rund 7 MB) und die
Laufprotokolle `lauf-*.log`. Wer die Vorschau-Grundlinie neu braucht, laesst `--vorschau-speichern` auf dem Stand
vor der Aenderung laufen (etwa in einem `git worktree` des vorigen Commits).

## Messgrößen je Fall

Bildfolge exakt wie der Export: t0+i/30, i = 0 … N (N = round(L·30)), der Reihe nach (Zustand wird
weitergetragen), dazu K = 15 Bilder über N hinaus. Jedes Bild wird auf lange Seite 256 verkleinert,
Abweichung je 16×16-Block als Mittel über RGB (0..255), davon das Maximum.

| Größe | |
|---|---|
| `gleich` | Block-Max \|F(N) − F(0)\| - bei exaktem Loop 0. **Das Urteil über „kehrt zum Ursprung zurück".** |
| `gleichFolge` | schlechtestes der Paare F(N+k)/F(k), k < 15 - fängt Ereignisse, die in genau einem Bild zufällig gleich stehen |
| `naht` | Block-Max \|F(0) − F(N−1)\| - der Sprung, den man beim Abspielen sieht |
| `erwartet` | Block-Max \|F(N) − F(N−1)\| - der Sprung, den die weiterlaufende Animation an derselben Stelle hätte |
| `p95` | 95. Perzentil der normalen Bildwechsel i→i+1 (i < N−1) |
| `quotient` | naht / max(p95, 0,5) - VIDEO-PLAN §6.5: unter 1 unsichtbar |
| `gl` | lief der WebGL-Weg wirklich (Shader gebaut, Rauschen geladen)? `null` ohne GL-Effekt |
| `vorschauAbw` | mittlere Abweichung Exportbild (LOOP=L) gegen Vorschaubild (LOOP=0, echte Schläge) zur Clipmitte - Hinweis, kein Urteil |
| `tempoVerh` | nur mit Partikeln/Tropfen: Bildänderung über 2 Bilder im Export durch dieselbe in der Vorschau, zehnmal über den Clip (`bewegungExport`, `bewegungVorschau`). 1 heißt gleich viel Bewegung. `vorschauAbw` taugt dafür nicht, weil Teilchen zur selben Songzeit ohnehin woanders stehen. Sättigt bei schnellen Teilchen und zählt Blinken und Überblenden mit - Hinweis, kein Tachometer |
| `kontrastExport`, `kontrastVorschau` | nur Rauschshader: je Stichbild Streuung der Helligkeit (`kontrast`) und des Musteranteils (`muster`, Bild minus Mittel der Stichbilder), als [min, max]. Schwankt der Export deutlich mehr als die Vorschau, pulsiert die Überblendung der Lagen. Konsole: `muster exp (vorschau)` |
| `msExport`, `msVorschau`, `msGLExport`, `msGLVorschau` | Rechenzeit je Bild: Export in Exportgröße mit LOOP=L, Vorschau (nur Rauschshader) in Pultgröße mit LOOP=0; `msGL*` nur die Zeit in GL.run (Hochladen, Shader, ein Punkt zurückgelesen). SwiftShader rechnet auf der CPU - nur Verhältnisse sind aussagekräftig, und nur mit `--jobs 1`. Gleiche Größe für beide: `--lange 816` |
| `glSchleife` | lief die loopfähige Exportform eines Rauschshaders (`typ:ja`)? |
| `vorschauRegression` | mit `--vorschau-vergleich`: mittlere Abweichung der drei gespeicherten Vorschaubilder |
| `M`, `phiF`, `sitzt`, `anzeige`, `einsQuote`, `satz` | Taktlage des Falls: Schläge im Clip, Lage des Clipschlags 0 in Bildern, Anteil des Lieds im Takt (Fenster 1/8 Schlag, höchstens 80 ms; eine 1, der binnen 1,5 Schlägen wieder eine 1 folgt, zählt nicht als Takt-Eins; bei Eins-Lesern angezeigt das Kleinere aus Schlägen und Einsen; unter 8 Schlägen `anzeige` null) und der Satz der Statuszeile |
| `synchron` | dieselben Anteile, unabhängig nachgerechnet: echte Schläge des Falls bei Songzeit s = k·L + τ gegen die Bilder, auf denen das exportierte Raster einen Puls zeigt - muss `sitzt`/`anzeige` gleichen |
| `fehler` | Konsolenfehler und -warnungen während des Falls |
| `loopNeinAnzeige` | was `loopNein(e)` dem Nutzer melden würde (vor dem Umbau: die Typliste LOOP_NEIN) |

**Lesen:** `gleich` ≈ 0 und `gleichFolge` ≈ 0 heißt exakter Loop. Ist dann trotzdem `quotient` ≥ 1, liegt
die Naht auf einem Ereignis (Schlag, Puls alle 8 Schläge), und `naht` ≈ `erwartet` zeigt das: der Sprung
ist derselbe, den der Clip ohnehin hätte. Der Quotient allein hält solche Loops für sichtbar, und
umgekehrt verdeckt ein hohes `p95` (Pulse, Blitze) einen echten Bruch - darum stehen beide Zahlen.

## Grenzen

- Der Vorlauf des Nachzieheffekts läuft seit 15.09.2026 wie in beiden Exportwegen über `vorlaufen()` in Häppchen vor dem ersten Bild; die Taktung des MediaRecorder-Wegs (Zeitstempel nach der Uhr) misst der Prüfstand nicht.
- Die Live-Vorschau `rahmen()` steht während der Messung still - seit dem 14.09.2026 auch im echten Export
  (`exportLaeuft`), vorher malte sie in den Wartepausen mit denselben Effektobjekten dazwischen (befund.md §5/§6).
- `Math.random` ist während eines Falls gesät, die Effektnummern beginnen je Fall bei 1 - sonst wäre
  kein Lauf mit dem nächsten vergleichbar.
- WebGL läuft über SwiftShader (`--use-angle=swiftshader`), damit Läufe auf jeder Maschine gleich rechnen.
- Titel a/b/c (seit der Taktlage auch d = Okkultation, e = Universe 25 english) und die Datenvarianten stehen in faelle.json.
- `synchron` prüft das Raster gegen die Songzeit s = k·L + τ und setzt voraus, dass Suno Song und Video bildgenau zusammen startet. Das ist nicht gemessen.
- Bewegtbild als Quelle wird nicht gemessen (befund.md §4): der Stand malt immer auf dem Titelbild. Im Studio loopt es weiterhin nicht, die Statuszeile meldet es.
- Nicht messbar, nur gelesen: MediaRecorder-Zeitstempel, Doppelklick-Sperre, Öffnen/Schließen während des Exports, Statussätze, Rückfall ohne noise4D.
