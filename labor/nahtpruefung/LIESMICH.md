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
`--faelle-datei`. `--wachhund <s>` verlängert den Abbruch ohne Fortschritt (Vorgabe 180 s; die Kombinationen `rand-kombi*` brauchen rund 900 s).

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
