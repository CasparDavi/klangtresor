# Chatthread vom 04.09.2026 — Mann oder Frau singt hier

**Status: OFFEN — Rohtext liegt vor, noch nicht ausgewertet**

Geführt am 04.09.2026 auf claude.ai (Modell Opus 5 Maximal), Titel dort
*„Speaker diarization mit pyannote"*. Herübergeholt am 07.09.2026 aus
dem Browser.

**Zur Vollständigkeit:** Anfang und Ende stehen im Wortlaut. Der
mittlere Teil (vier Wechsel, unten als solcher gekennzeichnet) ließ sich
nur als Bildschirmfoto lesen, weil die Oberfläche ihn nicht als Text
herausgibt — dort können kleine Lesefehler stecken. Wer es genau
braucht, öffnet den Thread selbst.

**Nicht ungeprüft übernehmen.** Modellnamen, Dateigrößen, SDR-Werte und
Lizenzangaben stammen aus Websuchen im Gespräch und sind hier nicht
nachgeprüft.

## Warum das projektrelevant ist

Ein Befund von Caspar_D steht hier zum ersten Mal aufgeschrieben:
**„weiblich landet immer im Schlagzeug stem"** — also ein Übersprechen
in `bin/stems.js` (htdemucs_6s), das bisher nirgends im Repo vermerkt
ist. Das gehört geprüft, unabhängig von allem anderen im Thread; im
Gespräch steht auch der billige Vorabtest dafür (Reihenfolge der Quellen
im Modell: drums, bass, other, vocals, guitar, piano — ein Indexversatz
sähe genauso aus).

## Was beim Auswerten zu tun ist

1. ~~Erst Indexversatz ausschließen~~ — **am 07.09. erledigt, ohne
   Messung:** `bin/stems.js` führt die Spurliste in der
   Ausgabereihenfolge des Modells (`drums, bass, other, vocals, guitar,
   piano`), mit einem Kommentar darüber, der genau vor dem Umsortieren
   warnt. Ein Versatz ist ausgeschlossen. Bleibt echtes Übersprechen —
   das gehört noch gemessen.
2. Die vorgeschlagene Kette gegen den vorhandenen Bestand halten:
   Wortanker liegen in `library/whisper.ndjson`, YIN und Stimmlage
   rechnen bereits, `onnxruntime-node` ist über `bin/klang.js` da.
3. Entscheiden, ob das ein eigener Strang wird — und wenn ja, mit
   Blindwert und Meßweg-Stempel, wie im Haus üblich.
4. Danach Status oben umsetzen.

---

## Rohtext

### Caspar_D

> speaker diarization. Wie macht man das in wave oder mo3

### Claude (dachte 9 s nach)

Das Dateiformat ist egal — pyannote & Co. dekodieren beides, intern wird
ohnehin auf 16 kHz Mono resampled. MP3 höchstens vorher mit ffmpeg
wandeln, wenn eine Library zickt:

```bash
ffmpeg -i input.mp3 -ar 16000 -ac 1 output.wav
```

Standardweg: pyannote.audio (State of the Art, open source, braucht
kostenlosen HuggingFace-Token mit akzeptierten Nutzungsbedingungen):

```python
from pyannote.audio import Pipeline

pipe = Pipeline.from_pretrained(
    "pyannote/speaker-diarization-3.1",
    use_auth_token="HF_TOKEN")

diarization = pipe("audio.wav")   # oder num_speakers=2, wenn bekannt

for turn, _, speaker in diarization.itertracks(yield_label=True):
    print(f"{turn.start:.1f}s–{turn.end:.1f}s: {speaker}")
```

Ausgabe: Zeitsegmente mit Sprecherlabels (SPEAKER_00, SPEAKER_01 …). Wer
tatsächlich spricht, weiß das Modell nicht — nur *dass* es verschiedene
Stimmen sind.

Wenn du gleichzeitig Transkript willst: WhisperX — kombiniert
Whisper-Transkription mit pyannote-Diarisierung und alignt beides
wortgenau. Für „wer hat was gesagt" der praktischste Weg:

```bash
whisperx audio.mp3 --diarize --hf_token HF_TOKEN --language de
```

Alternativen: NVIDIA NeMo (Sortformer, gut bei Überlappungen), oder
Cloud-APIs (AssemblyAI, Google Speech), wenn du nichts lokal aufsetzen
willst — bei sensiblen Aufnahmen aber Datenschutz bedenken.

Praktische Fallstricke: Überlappende Sprecher und ähnliche Stimmen
bleiben die Schwachstelle jeder Pipeline; bei schlechter
Aufnahmequalität vorher Rauschunterdrückung hilft messbar. GPU ist für
pyannote quasi Pflicht, auf CPU dauert eine Stunde Audio ewig.

Wofür brauchst du's — Interviews, Meetings, was Forensisches?

### Caspar_D

> ich will männlich und weiblich unterscheiden

### Claude (dachte 7 s nach)

Dann brauchst du keine Diarisierung, sondern Geschlechtsklassifikation —
dafür gibt's ein Tool, das genau das macht:

**inaSpeechSegmenter** — segmentiert Audio direkt in
male/female/music/noise:

```bash
pip install inaSpeechSegmenter
```

```python
from inaSpeechSegmenter import Segmenter

seg = Segmenter()
for label, start, end in seg("audio.mp3"):
    print(f"{start:.1f}s–{end:.1f}s: {label}")
# label: 'male', 'female', 'music', 'noEnergy'
```

Fertig — kein HF-Token, MP3 direkt, CNN-basiert und deutlich robuster
als reine Pitch-Heuristik.

Alternative: selbst per Grundfrequenz (F0), wenn du's transparent und
ohne Blackbox willst:

```python
import librosa
y, sr = librosa.load("audio.wav", sr=16000)
f0, voiced, _ = librosa.pyin(y, fmin=65, fmax=300, sr=sr)
import numpy as np
med = np.nanmedian(f0[voiced])
print("männlich" if med < 155 else "weiblich", f"({med:.0f} Hz)")
```

Faustregel: Männer ~85–155 Hz, Frauen ~165–255 Hz. Die Zone 145–170 Hz
ist aber echt ambig — tiefe Frauenstimmen und hohe Männerstimmen landen
beide dort, deshalb ist das ML-Modell zuverlässiger (es nutzt auch
Formanten und Spektralform, nicht nur Pitch).

Kombination mit Diarisierung, falls mehrere Sprecher pro Geschlecht:
erst pyannote für „wer", dann pro Sprechersegment inaSpeechSegmenter
oder F0-Median für „männlich/weiblich". Ein Sprecher = ein
Mehrheitsvotum über alle seine Segmente, das glättet Ausreißer.

Einschränkung ehrlich benannt: Klassifiziert wird die akustische
Stimmlage, nicht das tatsächliche Geschlecht — bei Kindern (beide
~250–300 Hz) und untypischen Stimmen liegt jedes Verfahren daneben.

---

> **Ab hier aus Bildschirmfotos übertragen** — die Oberfläche gab diesen
> Abschnitt nicht als Text heraus. Sinngemäß vollständig, im Wortlaut
> aber ohne Gewähr.

### Caspar_D

> ich will wissen, ob Mann oder Frau in einem Dong die vocals singt, am
> besten noch alter und Stimmlage Und alles in js

### Claude

Lieferte ein fertiges Werkzeug als Artefakt („Vokalanalyse", eine
einzelne HTML-Datei, kein Build, keine Dependencies, läuft offline im
Browser). Darin: YIN-Pitchtracking über FFT-Autokorrelation (Fenster
2048 bei 16 kHz, Hop 512), Medianfilter gegen Oktavsprünge, daraus
Umfang, Tessitura, Fach-Scoring gegen Referenzumfänge,
Geschlechtsheuristik aus Median-F0 plus Spektralschwerpunkt, dazu
Jitter/Shimmer/Vibrato.

Ehrlich zur Machbarkeit der drei Fragen:

- **Stimmlage/Fach** — das geht gut. Ist reine Frequenzstatistik, das
  Werkzeug macht es zuverlässig. Einschränkung: echtes Fach ist Timbre
  und Passaggio, nicht nur Umfang; ein Bariton, der nur im Refrain
  singt, sieht aus wie ein Tenor.
- **Mann/Frau** — geht meistens, aber im *Gesang* deutlich schlechter
  als in Sprache. Männliche Popstimmen liegen im Refrain oft bei
  220–300 Hz, weibliche Verses ebenfalls. Deswegen gibt das Tool bei
  Median-F0 zwischen ca. 210 und 300 Hz explizit „nicht entscheidbar"
  aus, statt zu raten.
- **Alter** — nicht seriös bestimmbar. Beste publizierte Modelle auf
  sauberer *Sprache* kommen auf ~±10 Jahre MAE; auf Gesang mit Tuning,
  Kompression und Effekten kenne ich kein Verfahren mit belastbarer
  Genauigkeit. Das Tool gibt deshalb die Rohmaße aus und keine
  Jahreszahl.

Der eigentliche Flaschenhals ist der Mix. Bass, Snare und Leadsynth
liegen im selben Frequenzband wie die Stimme. Hochpass + Clarity-Gate
holen einiges raus, aber für saubere Werte vorher separieren — Demucs
oder UVR5, dann den Vocal-Stem reinwerfen. Das ist Python, in JS gibt es
dafür realistisch nur den Weg über ONNX Runtime Web mit einem
konvertierten Modell (schwer, ~50–100 MB, aber machbar).

Wissenslücke, die ich nicht überspiele: es gibt auf HuggingFace
wav2vec2-basierte Age/Gender-Modelle (audeering u. a.), die deutlich
besser wären als meine Heuristik. Ob davon aktuell brauchbare
ONNX-Exporte für `transformers.js` existieren, weiß ich nicht — müsstest
du prüfen. Falls ja, wäre das die stärkere Variante, aber trainiert ist
das alles auf Sprache, nicht auf Gesang.

Geht's um deine eigenen Suno-Tracks? Bei AI-Vocals ist die
Geschlechtsklassifikation nochmal eine Stufe wackliger, weil das Modell
Formanten frei setzt, ohne dass ein realer Vokaltrakt dahintersteckt.

### Caspar_D

> Es geht um suno tracks und mein github tool Klangtresor. Und
> Heuristiken funktionieren erfahrungsgemäß schlecht. Ich brauche ein
> ki-modell

### Claude (Web durchsucht, Speicher durchsucht)

Konkrete Modelle, keine Heuristik:

1. **Vocals rausziehen (ONNX Runtime Web).** `huangjackson/Kim_Vocal_2`
   — die UVR-MDX-Netz-Variante als ONNX, 66,8 MB. Läuft im Browser, löst
   dein Suno-Mix-Problem, bevor der Klassifikator überhaupt anfängt.
2. **Geschlecht — das ist der beste Treffer für dich.**
   `alice-sabrina-ivy/voice-gender-classifier-onnx-q8`: ECAPA-TDNN, auf
   VoxCeleb2 feinjustiert, q8-quantisiert auf 15 MB statt ~62 MB FP32,
   ausdrücklich für Transformers.js im Browser gebaut und
   MIT-lizenziert. Eingabe rohes Mono-Float32 bei 16 kHz, Ausgabe Logits
   über {0: male, 1: female}. Wichtige Falle: Das Modell hat seine
   eigene Log-Mel-Vorverarbeitung im ONNX-Graph. `do_normalize: false`
   muss gesetzt sein, sonst normalisiert Transformers.js audioseitig
   nochmal drüber und verzerrt die interne Mel-Normalisierung.

   ```js
   import { pipeline } from "@huggingface/transformers";
   const clf = await pipeline("audio-classification",
     "alice-sabrina-ivy/voice-gender-classifier-onnx-q8", { dtype: "q8" });
   const out = await clf(vocalStem16k);   // Float32Array, 16 kHz mono
   ```

   Alternative mit mehr Parametern:
   `prithivMLmods/Common-Voice-Gender-Detection-ONNX`,
   wav2vec2-base-Finetune, 94,6 M Parameter, in deren Testreport 98,5 %
   Accuracy. Größer, aber gut belegt.
3. **Alter.** `audeering/wav2vec2-large-robust-24-ft-age-gender` gibt
   Alter als 0…1 (≈ 0–100 Jahre) plus Wahrscheinlichkeiten für
   child/female/male aus, ein ONNX-Export liegt auf Zenodo
   (doi:10.5281/zenodo.7761387). Publizierte Leistung: MAE zwischen 7,1
   und 10,8 Jahren, Geschlecht ≥ 91,1 % ACC. Zwei Haken: 318 M Parameter
   sind für den Browser grenzwertig, und die Lizenz ist CC-BY-NC-SA 4.0
   — nicht-kommerziell und viral, das kollidiert mit den meisten
   GitHub-Lizenzen. Prüf das, bevor du es in Klangtresor einbaust.

**Der eigentliche Knackpunkt:** Alle diese Modelle sind auf *Sprache*
trainiert — VoxCeleb2, Common Voice, TIMIT. Gesang ist Out-of-Domain,
und der systematische Ausfall ist männliches Falsett, das zuverlässig
als weiblich klassifiziert wird. Genau dafür gibt es einen Datensatz:
`ccmusic-database/chest_falsetto` labelt vier Klassen — m chest,
m falsetto, f chest, f falsetto — auf 0,25-s-Clips als Mel-, CQT- und
Chroma-Spektrogramme, 8.974 Dateien. Damit lässt sich ein Kopf
nachtrainieren, der genau den Fehlerfall abdeckt.

Und dein stärkster Hebel: Du kennst bei deinen Suno-Tracks die
Style-Prompts, hast also Ground-Truth-Labels umsonst.
ECAPA-Embeddings ziehen, logistische Regression drauf, fertig — das
schlägt jedes generische Sprachmodell auf deiner eigenen Domäne, und du
brauchst dafür vielleicht 200 Tracks.

Klangtresor kenne ich nicht — läuft das im Browser oder unter Node?
Davon hängt ab, ob Transformers.js oder direkt onnxruntime-node der
bessere Weg ist.

### Caspar_D

> schau in github, ist mein altes MySuno

### Claude (Web durchsucht, eine Erinnerung gelesen)

Kommt nicht durch — ich habe keinen GitHub-Zugang, nur öffentliche
Seiten über Websuche. Unter deinem Account taucht nichts auf, was zu
Klangtresor oder MySuno passt, was ins Bild passt: dein haeckel-Repo ist
ja auch privat.

Drei Wege, wie ich trotzdem reinschauen kann:

- README und die relevante Datei hier reinkopieren oder hochladen
- Claude in Chrome — der Weg, über den du bei Haeckel ohnehin schon
  committest, da bist du eingeloggt
- Repo kurz auf public stellen, dann komme ich per Fetch ran

Was ich für die Modellauswahl wirklich brauchen würde, ist nur eins:
läuft Klangtresor im Browser wie Haeckel, oder ist das ein Node-Tool?
Bei Browser wäre der ECAPA-Klassifikator mit 15 MB die naheliegende Wahl
und passt zu deiner ONNX-Runtime-Web-Schiene, die du für Haeckel sowieso
schon aufbaust — gleiche Infrastruktur, zweiter Anwendungsfall. Bei Node
hättest du dagegen keinen Größendruck und könntest direkt das
audeering-Modell mit Alterskopf nehmen.

### Caspar_D

> heisst dort KlangTresor und ist von caspardavi maintained

### Claude (Web durchsucht)

Geht nicht — mein Fetch lässt nur Adressen zu, die vorher in einer Suche
aufgetaucht sind, und `caspardavi/KlangTresor` taucht in keiner auf. Das
ist erwartbar, wenn das Repo privat ist: Suchmaschinen sehen es nicht,
und einen authentifizierten GitHub-Zugang habe ich nicht. Ich kann dir
also nicht sagen, was drinsteht.

Selbst reinschauen kannst du mich per Claude in Chrome lassen — da bist
du eingeloggt, das ist derselbe Weg wie bei deinen Haeckel-Commits.

Schneller wäre allerdings, mir die zwei Dateien direkt zu geben, aus
denen alles Nötige hervorgeht:

- `package.json`, falls vorhanden — beantwortet Node vs. Browser sofort
- die Einstiegsdatei (`index.html` oder `main.js`) — zeigt Modulsystem
  und wie du die Tracks hältst

Damit kann ich den Klassifikator so einhängen, dass er zu deiner
Struktur passt, statt dir generischen Beispielcode zu geben, den du dann
selbst umbauen musst.

### Caspar_D

> https://github.com/CasparDavi/klangtresor

---

> **Ab hier wieder im Wortlaut.**

### Claude (Web durchsucht)

Das ändert die Empfehlung, und zwar zu deinen Gunsten.

**onnxruntime-node 1.20.1 ist schon drin** — für `bin/klang.js`. Ein
Geschlechtsklassifikator kostet dich also keine neue Abhängigkeit, nur
eine weitere `.onnx`-Datei in `bin/modelle-holen.js`. Dein
Ein-Abhängigkeits-Prinzip bleibt unangetastet.

**Damit fällt Transformers.js weg** — und das ist kein Verzicht, sondern
genau der Grund, warum das ECAPA-Modell für dich passt: Die
Log-Mel-Vorverarbeitung steckt im ONNX-Graph selbst (STFT,
Mel-Filterbank, Log, Frame-Normalisierung). Eingang ist rohes
Mono-Float32 bei 16 kHz. Das liefert dir ffmpeg direkt in die Pipe, und
du rufst die Session nackt auf. 15 MB neben deinem 246-MB-Stem-Modell
fällt nicht ins Gewicht.

Wichtig dabei: Die dokumentierte `do_normalize: false`-Falle betrifft
nur den Transformers.js-Pfad. Rufst du das ONNX direkt, darfst du eben
keine wav2vec2-artige Normalisierung davorschalten — rohes Audio rein,
fertig. Der eine Punkt, den ich nicht aus der Ferne garantieren kann: ob
ORT 1.20.1 den STFT-Operator im Graph auf deinem CPU-Provider klaglos
frisst. Das ist ein Fünf-Zeilen-Test, kein Umbau.

Und lizenzrechtlich ist es MIT — passt zu deinem Repo, ohne dass du in
`LIZENZEN.md` eine zweite NC-Ausnahme neben den Musikstil-Modellen
führen musst.

Zwei Sachen brauchst du gar nicht mehr zu bauen: Der Vocal-Stem kommt
aus `bin/stems.js`, damit ist mein Separationsvorschlag hinfällig, und
dein YIN auf der getrennten Gesangsspur macht die Stimmlage schon. Das
Modell ergänzt das, es ersetzt es nicht — YIN sagt dir *wo* die Stimme
liegt, ECAPA sagt dir *wie sie klingt*, und die Kombination fängt genau
den Falsett-Fall ab, an dem F0 allein scheitert.

Alter bleibt das schwache Glied. Das audeering-Modell wäre der einzige
Weg, aber CC-BY-NC-SA gegen dein MIT und 1,27 GB gegen deine 246 MB —
der Preis steht in keinem Verhältnis zu ±10 Jahren MAE, gemessen auf
Sprache, angewendet auf synthetischen Gesang.

Der eigentliche Gewinn liegt woanders: Deine Style-Prompts stehen im
Katalog. Du hast Ground Truth für jeden Song, kannst also nachmessen
statt glauben — Konfusionsmatrix über den eigenen Bestand, und du weißt,
wo das Modell kippt. Das ist dieselbe Logik wie dein Meßweg-Stempel und
deine belegten Farbregeln. Der wird übrigens auch fällig, wenn die
Stimmlage künftig zwei Quellen hat.

Soll ich mir `bin/klang.js` ansehen, wie du dort die ORT-Session
aufziehst? Dann baue ich den Klassifikator im selben Muster statt in
meinem.

### Caspar_D

> das klingt zu optimistisch, weiblich landet immer im Schlagzeug stem.
> Ich will einen znabhängigen steang

### Claude (Web durchsucht)

Du hast recht, ich war zu optimistisch — ich habe `bin/stems.js` als
gelöst abgehakt, statt zu fragen, wie gut es trennt.

**Vorab der billige Test:** htdemucs_6s liefert die Quellen in fester
Reihenfolge (drums, bass, other, vocals, guitar, piano). Ein
Indexversatz würde genau so aussehen. Dass es *weibliche* Stimmen trifft
und nicht alle, spricht dagegen — aber fünf Minuten zum Ausschließen
sind billiger als ein Umbau auf falscher Annahme.

Wenn es echtes Übersprechen ist, ist die Ursache plausibel: Weibliche
Grundtöne plus Zischlaute liegen spektral dort, wo auch Becken und
Snare-Crack sitzen, und das 6-Stem-Modell muss jeden Punkt auf sechs
Töpfe verteilen statt auf vier. Bei dichtem, hart komprimiertem
NDH-Material ist das genau die Konstellation, in der es kippt.

**Der unabhängige Strang, den du willst: ein reines Vocal-Modell.**
Mel-Band RoFormer ist Ein-Stem — es erzeugt nur die Gesangsspur, das
Instrumental ist schlicht Mischung minus Vocals. Damit ist dein
Fehlermuster strukturell ausgeschlossen: Es gibt keinen
Schlagzeug-Topf, in den etwas fallen könnte. Dazu kommt, dass die
Roformer-Modelle HTDemucs bei der Gesangstrennung deutlich schlagen —
SDR 10,98 für Kimberley Jensens Vocal-Modell, 11,43 für die
viperx-Variante.

Als ONNX gibt es `silverdaw/mel-band-roformer-vocals-onnx`, ein Re-Host
von `musetric/vocal-separation-roformer-onnx` mit byte-identischen
Gewichten. Die Gewichte stammen aus der Kim-Vocal-2-Linie und stehen
nach der Neulizenzierung unter MIT — passt zu deinem Repo, keine zweite
NC-Ausnahme.

**Der ehrliche Preis, den ich beim letzten Mal unterschlagen hätte:**

Das ist ein *host-STFT*-Export. Das Modell frisst keinen Rohton, sondern
einen STFT-Tensor der Form [1, 2050, 1101, 2] und gibt eine komplexe
Maske gleicher Form zurück. Komplexe Multiplikation auf das Spektrum,
hüllkurvennormalisierte iSTFT und Overlap-Add auf Chunk-Ebene machst du
selbst. Reflect-Pad, Framing, Fensterung, FFT — alles in deinem
Node-Code. Machbar, weil du für R128 und YIN ohnehin Spektralcode hast,
aber es ist kein Modell-einhängen-und-fertig.

Zwei Dinge kenne ich nicht und würde ich vor der Entscheidung prüfen:
die Dateigröße des ONNX (das Modell hat rund 228 M Parameter, in fp32
wären das grob 900 MB gegen deine bisherigen 246 MB) und die Laufzeit —
ein Transformer ist auf CPU spürbar langsamer als Demucs, deine zwei
Minuten je Song werden mehr.

Was es bezahlbar macht: Für die Klassifikation brauchst du den Song
nicht komplett getrennt. Zehn bis zwanzig Sekunden der am klarsten
stimmhaften Passagen genügen dem Klassifikator völlig — und welche das
sind, weiß dein YIN-Lauf bereits. Du trennst also gezielt drei, vier
Ausschnitte statt vier Minuten und bist beim Zehntel der Rechenzeit. Der
Strang bleibt vollständig unabhängig von `bin/stems.js`, und die Stems
behalten ihre eigene Aufgabe.

### Caspar_D

> ich habe whisper drin und fpr jeden song eine zeitanker-Text datei

### Claude (dachte 28 s nach)

Dann fällt die Ausschnittwahl von der Heuristik auf exakt.

**Segmente statt Schätzung.** Du brauchst kein YIN-Clarity-Gate mehr, um
zu raten, wo gesungen wird — die Wortanker sagen es dir. Dichte
Wortfolgen ohne Lücken sind zusammenhängender Gesang, und daraus
schneidest du die drei, vier Fenster, die der Klassifikator sieht.

Der Feinschliff dazu: Rechne pro Wort Dauer geteilt durch Zeichenzahl.
Ausreißer nach oben sind gehaltene Töne — Melismen, lange offene Vokale.
Genau darauf arbeiten Stimmklassifikatoren am besten, weil stimmhafte
Dauerlaute die Formanten tragen. Konsonantenreiche Stakkato-Passagen
sind das schlechteste Material und würdest du sonst zufällig erwischen.

**Der größere Gewinn ist die Negativkontrolle.** Die Lücken zwischen den
Wörtern und alles vor dem ersten und nach dem letzten Wort sind
instrumental. Lass den Klassifikator da drauflaufen. Wenn er auf einem
Intro ohne jede Stimme selbstbewusst „weiblich" sagt, liest er deine
Instrumentierung und nicht die Stimme — und du weißt das pro Song, ohne
ein einziges Label von Hand zu setzen. Das ist ein sauberer Blindwert
und deckt genau den Fehler auf, den dir sonst niemand zeigt.

**Und damit bist du bei deiner Ausgangsfrage.** Klassifikation pro
Segment statt pro Song beantwortet nicht nur „Mann oder Frau", sondern
„wer wann" — Strophe männlich, Refrain weiblich, Duette, Stimmwechsel.
Das ist Diarisierung, aufgehängt an der Liedstruktur statt an blinder
Segmentierung, und für Suno-Tracks vermutlich robuster als generisches
Clustering, weil die Wortanker die Grenzen schon kennen.

Ein Haken dabei, ehrlich: Fürs Clustern brauchst du Embeddings, nicht
die zwei Logits des Geschlechtsklassifikators. Die attention-gepoolte
1536er-Schicht davor wäre das Richtige — die musst du beim ONNX-Export
als zusätzlichen Ausgang mitnehmen, oder du nimmst ein eigenes
Sprecher-Embedding-Modell dazu. Zweites Modell, zweiter Download.

Kleiner Vorbehalt zu den Zeitmarken: Whisper ist auf Sprache trainiert,
und bei langen Melismen driften die Wortgrenzen. Nicht hart auf die
Marke schneiden, sondern ein paar hundert Millisekunden Puffer an beiden
Enden — sonst erwischst du den Attack der nächsten Zeile oder verlierst
den Vokalkern.

### Caspar_D

> du sagst also:
> vocal stem zuerst extrahieren und dann ein gender embedding in den
> richtigen Fragmenten drüberschicken

### Claude

Ja — mit einer Präzisierung an der Reihenfolge.

Nicht: Stem für den ganzen Song, dann Fragmente rausschneiden. Sondern:
**Fragmente zuerst bestimmen, dann nur diese trennen.** Die Wortanker
liegen als Textdatei vor, das kostet nichts. Der Roformer läuft
anschließend auf vier mal fünf Sekunden statt auf vier Minuten — das ist
der Unterschied zwischen tragbar und unbenutzbar, weil das Modell auf
CPU langsam ist.

Zwei Punkte in deiner Formulierung, die ich schärfen würde:

**Klassifikator, nicht Embedding.** Für „Mann oder Frau" gibt dir das
ECAPA-Modell direkt zwei Logits — fertig. Embeddings brauchst du erst,
wenn du clustern willst, also für „wer wann" bei Duetten oder
Stimmwechseln. Das sind zwei verschiedene Ausbaustufen, und die erste
kostet dich ein 15-MB-Modell und keinen zusätzlichen Export.

**Ein Zwischenschritt fehlt: Aggregation.** Du bekommst pro Fragment ein
Ergebnis, nicht pro Song. Die zusammenzuführen ist nicht
Mittelwertbildung — bei einem Song mit männlicher Strophe und weiblichem
Refrain wäre der Mittelwert das Falscheste von beidem. Sinnvoller ist,
die Verteilung anzuschauen: eng beieinander heißt eine Stimme,
zweigipflig heißt zwei. Der Sonderfall ist die eigentliche Information,
nicht das Rauschen, das man wegmittelt.

Damit steht die Kette:

- Wortanker lesen, Segmente mit langen Vokalen wählen, Puffer an den Rändern
- dieselben Segmente aus den Instrumentalpausen als Blindwert
- Roformer nur auf diese Schnipsel, 16 kHz Mono raus
- ECAPA je Schnipsel
- Verteilung auswerten, Blindwerte gegenprüfen
- Ergebnis mit neuem Meßweg-Stempel nach `library/messungen/`

Die Stelle, an der das kippen kann, ist immer noch der Roformer-Export:
host-STFT, du baust Fensterung und Rücktransformation selbst. Bevor du
irgendetwas anderes anfasst, würde ich einen einzelnen
Fünf-Sekunden-Schnipsel durchschicken und das Ergebnis anhören. Klingt
es sauber, trägt der Rest. Klingt es nach Phasenmatsch, stimmt die
iSTFT-Normalisierung nicht, und alles Nachgelagerte ist Zeitverschwendung.

*(Ende des Threads — die letzte Antwort blieb unbeantwortet.)*
