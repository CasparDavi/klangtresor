# Whisper in KlangTresor — Wort-Zeitmarken aus dem Hören

> **Namenswechsel:** Das Projekt hieß bis zum 24.08.2026 *MySuno*. Es heißt jetzt **KlangTresor** — „Suno" ist seit dem 06.01.2026 eingetragene Marke von Suno Inc., ausdrücklich für Software zum Abspielen und Bearbeiten von Audioinhalten. Wo in Zitaten und in der Chronik noch der alte Name steht, bleibt er stehen.

Stand 20.08.2026. Gebaut auf Tarjas Wunsch (sie untertitelt ihre
Twitch-Streams mit Whisper large-v3) und Caspar_Ds Entscheidung: „wir nehmen
das Beste, alles auf der Entwicklungs-SSD, Nachtlauf, neueste zuerst."

## Wozu

Karaoke braucht Wort-Zeitmarken. Suno liefert sie (`aligned_lyrics`)
für 253 von 321 Songs; 68 haben keine — private, alte, Instrumentals,
oder Songs ohne Text im Archiv. Whisper hört den Song und liefert je
Wort Anfang und Ende; bei Songs ohne Text auch den Text selbst.

Was Whisper NICHT ersetzt: Sunos Zeitmarken bleiben, wo es sie gibt.
Suno kennt den Text und richtet aus; Whisper hört und verhört sich.

## Was wo liegt

| | Pfad |
|---|---|
| whisper.cpp (Quelltext + Build) | `…/werkzeuge/whisper.cpp/` (ausserhalb des Projekts) |
| Programm | `…/whisper.cpp/build/bin/whisper-cli` |
| Modell large-v3 (3,1 GB) | `…/whisper.cpp/modelle/ggml-large-v3.bin` |
| cmake (nur zum Bauen) | `~/werkzeuge/cmake-3.31.6-macos-universal/` — liegt auf der Systemplatte, weil macOS an heruntergeladene Dateien `com.apple.provenance` hängt, exFAT das in `._`-Dateien ablegt und cmake dann seine Module doppelt findet |
| Ergebnis | `library/whisper.ndjson`, eine Zeile je Song |
| Protokoll des Nachtlaufs | `library/whisper-lauf.log` |
| Skript | `bin/whisper.js` |

## Bauen (einmalig, schon geschehen)

```bash
cd ~/werkzeuge          # oder wohin man Werkzeuge legt
git clone --depth 1 https://github.com/ggml-org/whisper.cpp.git
cd whisper.cpp
export PATH=$HOME/werkzeuge/cmake-3.31.6-macos-universal/CMake.app/Contents/bin:$PATH
cmake -B build -DCMAKE_BUILD_TYPE=Release -DGGML_METAL=OFF -DWHISPER_COREML=OFF
cmake --build build -j 16 --config Release
mkdir modelle && curl -L -o modelle/ggml-large-v3.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin
```

`GGML_METAL=OFF` ist Pflicht auf dem Intel-Mac: der Metal-Pfad brach mit
`GGML_ASSERT(buf_dst)` ab. CPU + Apple Accelerate (BLAS) läuft.

Auf einem Rechner mit NVIDIA-Karte (Tarja?): `-DGGML_CUDA=ON`, dann ist
ein Song Sekunden statt Minuten. Auf Apple Silicon: Metal anlassen.

## Tempo

i7-10700K, 16 Threads: 4:02 Musik in 5:49 → ~1,5× Echtzeit.
68 Songs ≈ 4,5 h Musik ≈ 7 h Rechnen. Nachtlauf.

## Laufen lassen

```bash
node bin/whisper.js                 # alle ohne Zeitmarken, neueste zuerst
node bin/whisper.js --anzahl 5      # nur fünf
node bin/whisper.js <id>            # einer, auch mit Zeitmarken (Vergleich)
nohup node bin/whisper.js --still > library/whisper-lauf.log 2>&1 &   # Nacht
node bin/aufbereiten.js             # danach: in den Katalog
```

Jeder fertige Song wird sofort angehängt; Abbruch (Ctrl-C, Neustart)
kostet nur den angefangenen Song; der nächste Lauf überspringt, was da ist.

## Was das Skript tut

1. `audio.mp3` → 16-kHz-Mono-WAV (ffmpeg, temporär).
2. Hat der Song Lyrics: die ersten 800 Zeichen ohne `[Anweisungen]` als
   `--prompt` — Whisper hört dann die richtigen Wörter deutlich öfter.
3. `whisper-cli -l auto -ojf` → JSON mit Tokens und Zeiten.
4. Tokens → Wörter (Token mit führendem Leerzeichen = neues Wort),
   Segmentende = Zeilenumbruch. Format wie Sunos `worte`:
   `[[start, ende, "Wort "], ...]`.
5. Abgleich mit den offiziellen Lyrics: längste gemeinsame Teilfolge
   über normalisierte Wörter (klein, ohne Satzzeichen, ohne Akzente).
   Treffer bekommen die offizielle Schreibweise; Rest bleibt gehört.
   Beim Testsong „Selbstoptimiert": 337 gehört, 268 abgeglichen.
6. `instrumental: true`, wenn unter 5 Wörter oder nur ♪.

`aufbereiten.js` trägt ein: `worte` + `worteQuelle: 'whisper'` nur, wo
Suno keine hat; `lyrics` + `lyricsQuelle: 'whisper'` nur, wo kein Text
da ist. Die Bühne zeigt „Karaoke (Whisper)" bzw. „Lyrics (Whisper
gehört)".

## Der Vergleich an „Okkultation" (20.08.2026)

Drei Quellen, ein Song, Drei-Zeilen-Karaoke (`#vergleich=<id>`):

| | Wörter | Median-Versatz gegen v2 | Wortenden |
|---|---|---|---|
| Suno v2 | 387 | — | legato: Ende ≈ nächster Anfang (Lücken im Mittel 0,09 s) |
| Suno v3 | 402 (aus 668 Silbenstücken) | ≈ 0 | echte Lücken (0,62 s), 19 % Überlappungen |
| Whisper DTW | 491 | 91 ms | echte Lücken (0,72 s) |

Befund (Caspar_D): „Whisper hört auf, das Wort fortzusetzen, wenn es
vorbei ist; die Suno-Modelle halten das Wort." Stimmt und liegt an
der Bedeutung der Endzeit: v2 richtet den bekannten Text legato aus,
v3 und Whisper markieren den akustischen Moment. Für die
Karaoke-Bühne egal — sie schaltet nach Wort-ANFÄNGEN und hält selbst.

Whisper-Standard-Zeitheuristik (ohne DTW) lag dagegen im Median
0,55 s ZU FRÜH — deshalb ist DTW Pflicht.

## Ehrlichkeit

- Whisper-Zeitmarken sind Hörmarken: bei verzerrten Gitarren, Chören
  und schnellen Silben ±0,2–0,5 s. Fürs Mitlesen gut, für Schnitt nicht.
- Zahlen werden gehört, wie sie klingen („180" statt
  „einhundertachtzehn") — der Abgleich lässt das so, wenn die
  offiziellen Lyrics anders schreiben.
- Sprache `auto`: bei gemischten Songs (Deutsch/Englisch) entscheidet
  Whisper je 30-Sekunden-Fenster.

## Für Tarja

Gleicher Weg, andere Maschine: whisper.cpp bauen (siehe oben; mit GPU
deutlich schneller), Pfade per Umgebung setzen:

```bash
WHISPER_CLI=/pfad/zu/whisper-cli WHISPER_MODELL=/pfad/zu/ggml-large-v3.bin node bin/whisper.js
```

## Die bereinigte Lyrik — `bin/lyrik.js`, Regeln der Fassung 3 (25.09.2026)

`bin/lyrik.js` baut aus dem Liedtext des Katalogs und den Whisper-Wortmarken (`library/whisper.ndjson`)
die **bereinigte Lyrik** `library/lyrik.json`: je Lied Zeilen mit Text, `von`, `bis`. Sie ist die
Quelle des Karaoke-Effekts und der Spur „rein" auf der Bühne. Läuft im Morgenlauf nach dem
Whisper-Schritt. Das Feld `fassung` in der Datei sagt, nach welchen Regeln sie entstand; die
Begründungen stehen ausführlich im Kopf von `bin/lyrik.js`.

### Was die Datei ist — und was nicht

Sie ist die Wahrheit über die **gesungenen Wörter und ihre Zeiten**. Sie ist kein Abbild des
Liedtexts: Regie, Verzierung und Ungesungenes stehen nicht darin. Der Rohtext bleibt im Katalog und
in der Lyrics-Ansicht der Bühne unverändert (Caspar_D, 07.09.2026: „nichts, was von Suno kommt,
sollte verändert werden").

### Regeln (Caspar_D, 25.09.2026)

1. **Eckige Klammern fliegen grundsätzlich** — ganze Zeilen (auch mit Klammern darin), Einschübe
   mitten in der Zeile, mehrzeilige Notizen von der öffnenden bis zur schließenden Klammer, dazu
   Zeilen mit `#` und Trennlinien. Vor dem Abgleich.
2. **Runde Klammern durchlaufen den Whisper-Abgleich.** Hat Whisper mindestens die Hälfte der
   Wörter einer Gruppe gehört, bleibt ihr Text in der Zeile; sonst fällt die Gruppe. Eine Zeile, die
   nur aus einer nicht gehörten Gruppe bestand, fällt ganz. Die Zeichen `(` `)` stehen im Ergebnis
   nie. *„Suno entscheidet neuerdings intelligent, ob runde Klammern Regie oder Echo sind — Whisper
   hört es: erkannt bleibt es drin, sonst fliegt es raus."*
3. **Die Deckung rechnet ohne Klammern**, eckig wie rund, gehört oder nicht — nur Wörter außerhalb
   jeder Klammer zählen, für das Lied und für das Kriterium gesungen/offen je Zeile. *„Das ist dann
   sicher."*
4. **Zierzeichen und Emoji fliegen** vor dem Abgleich (Emoji samt Selektoren, Symbole, Pfeile,
   Rahmenzeichen, Ketten aus drei gleichen Sonderzeichen), ersetzt durch ein Leerzeichen — sonst
   verschmelzen zwei Wörter. Reine Zierzeilen fallen wie Trennlinien. Das Gradzeichen bleibt: „5 °C"
   ist Text. Satzzeichen, Buchstaben und Ziffern aller Schriften bleiben.
5. **Unter 60 % Deckung wird nicht gereinigt**, sondern zurückgestellt (mit Grund in `unsicher`).
6. **Zeiten.** Echte Whisper-Marken bleiben, wie gemessen. Zeilen ohne eigene Marke tragen
   `geschaetzt` und liegen anteilig nach Zeichenzahl zwischen ihren Nachbarn. Eine Zeile mit nur einer
   entarteten Marke (Standzeit unter 0,3 s) bekommt ihre Standzeit aus der Spanne bis zur nächsten
   echten Marke (`standzeitGeschaetzt`); zwei Zeilen auf denselben Marken teilen sich die Spanne
   (`zeitAngepasst`). Es gibt keine doppelten Startzeiten mehr.
7. **Whisper-Prompt ohne Klammern.** `bin/whisper.js` gibt Whisper den Liedtext als Prompt, ohne
   eckige und ohne runde Klammern — Whisper soll den Gesang angekündigt bekommen, nicht die Regie.
   Gilt für künftige Läufe; die Zählung vom 25.09. zeigte keine Verzerrung durch den alten Prompt.

### Zähler je Lied

`deckung`, `worte`, `zeilen`, `gestrichen` (ungewiss, unter der Deckungsgrenze), `geschaetzt`,
`regie`, `einschuebe`, `zeitAngepasst`, `standzeitGeschaetzt`, `klammerGehoert`, `klammerGestrichen`,
`zier`, `zierZeilen`. Die Karaoke-Karte im Studio nennt Deckung, geschätzte und gestrichene Zeilen.

### Wer sie liest

`/api/lyrik/<id>` (Server, mit `stand`-Prüfung der Datei), der Karaoke-Effekt (`lyrikVon`, mit
Sicherheitsnetz für Klammern und Zierzeichen aus alten Fassungen), die Bühne (Spur „rein"),
`bin/gesundheit.js` (Ersatzzeichen), der Prüfstand (`_lyrik.json` der Prüftitel).

### Stand der Läufe

| Fassung | Datum | Was sich änderte |
|---|---|---|
| 1 | bis 24.09.2026 | Alignment, Regie nur als ganze Zeile, Interpolation gleichverteilt |
| 2 | 25.09.2026 nachts | Klammerzeilen mit innerer Klammer, Einschübe, entartete Marken, doppelte Startzeiten |
| 3 | 25.09.2026 vormittags | runde Klammern über den Abgleich, Deckung ohne Klammern, Zierzeichen, mehrzeilige eckige Notizen, Prompt ohne Klammern |

Ernstlauf Fassung 3: 244 Lieder gereinigt, 19 zurückgestellt, 77 Klammergruppen gehört, 44
gestrichen, 48 Zierzeichen entfernt, Pfeifenwald von 66 % auf 100 % Deckung.
