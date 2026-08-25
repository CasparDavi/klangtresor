# Die zwei Bedienleisten und die Tonkette — Bestandsaufnahme

**Erhoben am 25.08.2026** auf Caspar_Ds Frage *„kannst du mal die ganzen
Playbars synchronisieren, ich seh gerade, dass im Analysierer kein EQ
drin ist"* — mit dem ausdrücklichen Zusatz **„keine Änderungen"**.

Die Bestandsaufnahme selbst hat nichts geändert. Ein Fehler wurde
danach auf ausdrücklichen Auftrag behoben — die fehlende Gesamthüllkurve
(Abschnitt 0). Alles andere steht hier als Befund, nicht als Absicht.

**Wie erhoben:** vier unabhängige Prüfblicke auf `web/index.html`
(Elementvergleich, Zustandsgleichlauf, Tonkette, Bedienung), dazu eigene
Messungen am laufenden Browser. 67 Einzelbefunde, hier zusammengeführt.

**Zeilennummern** beziehen sich auf den Stand `caa710a`. Sie verschieben
sich mit jeder Änderung — die Suchwörter daneben halten länger.

---

## 0. Der Anlass hinter dem Anlass: die fehlende Gesamthüllkurve

> **Behoben am 25.08.2026 — aber in zwei Anläufen.** Der erste Fund
> (falsche Abtastwerte) war echt, erklärte aber NICHT, was Caspar_D
> vermisste. Die eigentliche Ursache stand woanders. Beide Wege sind
> unten festgehalten, weil beide etwas über die Bauart sagen.

Während der Analyse fiel auf, dass bei *Moissanit* die große Wellenform
ganz oben im Analyzer fehlt. **Das ist ein eigener Fehler und hat mit den
Leisten nichts zu tun.**

Die Daten sind vollständig: Moissanit hat alle sechs Stem-Hüllkurven
(gerechnet 24.08., 23:29), und `/api/toene` liefert sie korrekt aus.

**Der Beweis, dass es an der Seite liegt:** Im Browser lagen
12 213 935 Abtastwerte — bei 44,1 kHz sind das **4:37**. Moissanit ist
aber **4:14** lang. Die geladenen Werte gehörten zum vorher gespielten
Song.

**Die Ursache** steht in `web/fremd/analyzer.js`, in
`abtastwerteNachladen()`:

```js
if (window._audioSamples && window._audioSamples.length) return;
```

Diese Wache soll doppeltes Laden verhindern. Sie fragt aber nur, **ob**
Abtastwerte da sind — nicht, ob sie zum **richtigen** Song gehören. Beim
Songwechsel in der offenen Bühne:

1. Der Analyzer baut sein Markup neu → `main-waveform-canvas` ist frisch
   und leer
2. `abtastwerteNachladen()` sieht die alten Werte → kehrt sofort um
3. `drawMainWaveform()` wird nie erreicht → die Fläche bleibt leer

Es gibt nur zwei Rufer von `drawMainWaveform()`: den Nachladeweg und die
Frischanalyse. Fällt der erste aus, zeichnet niemand.

**Warum sie „bei anderen Tracks da ist":** Beim ersten Song nach dem
Seitenladen liegen keine alten Werte vor, das Nachladen läuft durch, die
Wellenform erscheint. Ab dem zweiten Song fehlt sie — bis die Seite neu
geladen wird.

**Kein Regress vom 25.08.:** Der Stand vom Vorabend (`b4eeddf`) wurde
gegengeprüft. Wache und fehlende Rücksetzung waren dort schon so; die
Löschungen des 25.08. haben den Block nicht berührt. `window._audioSamples`
wird an keiner Stelle des Projekts je zurückgesetzt — auch nicht von
`analyzerAbraeumen()` oder `buehneZu()`.

### Was geändert wurde

Der Vorrat trägt jetzt den Namen seines Songs: `window._audioSamplesFuer`
wird überall dort gesetzt, wo `window._audioSamples` gesetzt wird — im
Nachladeweg und in der Frischanalyse. Die Wache fragt danach:

```js
if (window._audioSamples && window._audioSamples.length
    && window._audioSamplesFuer === _laufendeId){
  if (typeof drawMainWaveform === 'function') drawMainWaveform();
  return;
}
```

Zwei Dinge auf einmal: Gehören die Werte zu einem **anderen** Song, wird
neu geladen. Gehören sie zum **richtigen**, wird nicht neu geladen — aber
**gezeichnet**, denn die Fläche kann trotzdem frisch und leer sein (der
Analyzer baut sein Markup bei jedem Aufbau neu). Genau dieser zweite Fall
fehlte vorher und war die eigentliche Ursache.

**Nachgemessen im Browser** — bei jedem Song stimmen Abtastwerte und
Dauer jetzt überein:

| Song | Abtastwerte | Songdauer | Wellenform |
|---|---|---|---|
| erster nach dem Laden | 327 s | 327 s | da |
| nach 1. Wechsel | 283 s | 283 s | da |
| nach 2. Wechsel (zurück) | 327 s | 327 s | da |
| Moissanit | 255 s | 255 s | **da** |

Vorher lagen in Moissanits Anzeige 277 s — die des Vorgängers.

### Aber das war nicht, was fehlte

`main-waveform-canvas` ist im Bühnenbetrieb **immer** unsichtbar:
`#buehne.text-analyzer #custom-player{display:none}` ([index.html:676]).
Der Fix oben war also richtig und folgenlos zugleich — er heilt die
Datenlage (auch das Notenzonen-Chroma liest `_audioSamples`), aber er
bringt kein Bild zurück.

**Gemeint war die bunte Wellenform unter „Track-Struktur"** — eine ganz
andere Anzeige. Sie liegt in der Befundspur und wird aus Sunos eigener
Hüllkurve (`welle`, rund 1700 Werte im Katalog) gezeichnet, eingefärbt
nach den Abschnitten des Liedtexts.

**Die echte Ursache:**

```js
var abs = abschnitteAusText(quelleWorte, dauer);
if (abs.length) bahnen.unshift({ name:'Track-Struktur', ..., welle: ... });
```

Die Bahn entstand nur, wenn Abschnitte gefunden wurden — und weil die
Hüllkurve in derselben Bahn liegt, fiel sie mit ihnen weg.
`abschnitteAusText()` suchte ausschließlich nach `[Verse 1]` in eckigen
Klammern. Moissanits Text gliedert auf Deutsch und ohne Klammern:
„Strophe 1", „Refrain", „Bridge".

**Die Lage im Bestand:**

| | Songs |
|---|---|
| mit `[Klammer]`-Marken | 251 |
| ohne Marken, aber mit deutscher Gliederung | 1 (Moissanit) |
| ohne Marken (Whisper-Transkripte) | 39 |
| ohne `welle` im Katalog | 68 |

Die 39 sind Whisper-Transkripte — erkennbar an „Thank you.", an
singhalesischen Zeichen und ähnlichen Halluzinationen über
Instrumentalstellen. Whisper hört den Gesang und kennt keine
Abschnittsmarken.

**Zwei Änderungen:**

1. **`abschnitteAusText()` erkennt Namen ohne Klammern** — am
   Zeilenanfang und am Eintragsende, damit ein „Refrain" im Fließtext
   keine falsche Marke setzt. Bei wortweisen Zeitmarken hängt das
   Satzende des vorigen Abschnitts noch davor (`".\n\nStrophe"`),
   deshalb `(^|\n)` statt nur `^`; steht Text davor, beginnt der neue
   Abschnitt erst am Eintragsende. `art` und `kuerzel` kannten die
   deutschen Namen längst — nur das Finden kannte sie nicht.
2. **Die Bahn entsteht auch ohne Gliederung**, sobald eine Hüllkurve da
   ist. Sie heißt dann „Hüllkurve — aus dem Katalog": „Track-Struktur"
   verspricht eine Gliederung, die es dann nicht gibt.

**Nachgemessen:** Moissanit bekommt 10 Abschnitte (Strophe 1–6,
Refrain ×2, Bridge, dazu Pre-Intro/Outro), seine Befundspur wächst von
123 auf 246 px. Staub bleibt exakt bei 280 px mit unveränderten
Abschnitten — der neue Zweig läuft nur, wenn keine Klammer gefunden
wurde (`if(!m)`), die 251 Klammer-Songs sind unberührt.

---

## 1. Die gute Nachricht: der Gleichlauf steht

Am laufenden Browser Zustand für Zustand verglichen — beide Leisten
zeigten dasselbe:

| Zustand | Hauptleiste | Bühnenpult |
|---|---|---|
| Play/Pause-Symbol | `#i-pause` | `#i-pause` |
| Zufall / Schleife / Anschluss | aus | aus |
| Lautstärke | 72 | 72 |
| Zeit | 2:51 / 4:22 | 2:51 / 4:22 |

Im Code bestätigt: Zufall (`9198`) und Schleife (`9216`) fassen beide
Knöpfe in **einer** Schleife an — vorbildlich. Lautstärke und Stumm
ziehen wirklich beide Regler mit (`13251`). Zeit und Fortschritt kommen
aus einer Quelle (`13325`). Der Songwechsel zieht beide Leisten nach
(`9012`).

**Der einzige fehlende Knopf ist der EQ** (`studioknopf`, Zeile 2579).
Sonst ist die Ausstattung deckungsgleich.

---

## 2. Echte Fehler

### 2.1 Der Abspielknopf im Pult hängt am falschen Faden ⚠ wichtigster

`$('babspielen').innerHTML` wird **ausschließlich** in `buehneTakt()`
gesetzt (13130) — und `buehneTakt()` läuft an `ontimeupdate`.

Die Hauptleiste macht es richtig: `#abspielen` hängt an `onplay` und
`onpause` (13311/13312) und schaltet sofort um. `$('babspielen')` kommt
in beiden Meldern **nicht vor**.

Folge: **Beim Pausieren feuert kein `timeupdate` mehr.** Der Pultknopf
bleibt auf dem Pausensymbol stehen und behauptet, es liefe noch. Der
Player zeigt Play, das Pult zeigt Pause — gleicher Zustand, zwei
Aussagen.

Verschärfend (13324): `ontimeupdate` beginnt mit
`if (el !== audio || !audio.duration) return;`. Solange `audio.duration`
0 oder NaN ist — frisch gewechselte Quelle, hängende Wiedergabe, fremder
Song im Laden — wird `babspielen` nie korrigiert.

*(Dass mein Live-Vergleich oben beide gleich sah, war Glück: Es lief
gerade.)*

### 2.2 Das Tonstudio verschwindet unter der Bühne — und rechnet weiter

Weder `buehneAuf()` (12958) noch `buehneZu()` (13066) rufen
`studioZu()`. Ein offenes Studio bleibt beim Öffnen der Bühne offen —
unsichtbar darunter, weil `#studio` auf `z-index:56` (1363) unter
`#buehne` auf `z-index:60` (526) mit deckendem Hintergrund liegt.

Es ist **nicht** `display:none`, also rechnet und zeichnet es weiter:
`studioSpitze(true)` hält ein `setInterval` mit 100 ms am Leben, das aus
beiden Analysern Daten zieht; je nach gemerkter Lasche laufen zusätzlich
`blasterLcd`, `kompAnzeige` oder `parSpektrum` samt Bildschleifen (3508).
Abgeräumt wird das alles nur in `studioZu()` (3659) — das bei offener
Bühne niemand aufrufen kann.

`buehneZu()` räumt den Analyzer vorbildlich ab; das Studio hat diese
Fürsorge nie bekommen.

**Das ist auch die Antwort auf die ursprüngliche Frage:** Ein EQ-Knopf
im Pult allein würde nicht genügen. Er würde das Studio in genau diese
Sackgasse öffnen.

### 2.3 Der EQ-Knopf ist trotzdem erreichbar — über die Tabulatortaste

Es gibt im ganzen Haus kein `inert` und kein `aria-hidden` auf dem
Untergrund; `#player` bleibt bei offener Bühne `display:block` und im
Tabulator-Lauf (2579). Wer auf der Bühne Tab drückt, wandert erst durch
die komplette unsichtbare Liste und erreicht schließlich den EQ-Knopf.
Die Eingabetaste öffnet dann das Studio in die Sackgasse aus 2.2.

Es ist der einzige Weg, `studioAuf()` bei offener Bühne auszulösen —
ein Weg, den niemand gebaut hat.

### 2.4 Gemerkte EQ-Einstellungen greifen erst nach dem ersten Öffnen

`eqJeSong` wird ausschließlich in `studioAuf()` geholt (3537). Beim
Songwechsel liest der Zweig für das geschlossene Studio (8999) aus genau
dieser Sammlung — ist sie noch leer, setzt er stumpf auf neutral.

**Wer über die Bühne einsteigt und das Studio nie öffnet, bekommt seine
gespeicherten Einstellungen nie zu hören.**

### 2.5 Lautstärke und Stumm sitzen vor *allen* Analysern

`lautstaerkeSetzen()` schreibt `audio.volume` am Medienelement (13245) —
also vor `createMediaElementSource` und damit vor `quelle`.

Wer stummschaltet, bringt nicht nur den Ton zum Schweigen, sondern auch
Live-Spektrum, Dichte-Spektrum, Butterchurn und die Bandpegel auf null.

Das Versprechen des Kommentars vom 20.08. (*„misst das Werk, nicht die
Filter"*) hält gegen die EQ-Kette — aber nicht gegen den Lautstärkeregler.

### 2.6 Die EQ-Stummschaltung lässt zwei Wege weiterfiltern

- **Abhör-Solo** (2861): `eqSoloAnwenden()` prüft nur `eqAus`, nicht
  `anEq`. Wer die EQ-Stufe stummstellt, während im Glockenstuhl ein Solo
  läuft, hört die Bandzweige weiter — die Stufe ist nicht überbrückt,
  nur ihre Verstärkungen sind genullt.
- **Störton allein hören** (2939): Der enge Bandpass (Q 25) wird
  ebenfalls nur von `eqAus` abgeschaltet, nicht von `anEq`.

### 2.7 Tastaturkürzel wirken mit Befehlstaste mit

Der Horcher (13400) prüft weder `metaKey` noch `ctrlKey` noch `altKey`.
Cmd+F löst zusätzlich Vollbild aus, Cmd+M schaltet stumm, Cmd+Pfeile
springen den Song oder verstellen die Lautstärke. Jeder Browserbefehl
mit denselben Buchstaben löst nebenbei eine Wiedergabeaktion aus.

### 2.8 Die Auswahlfelder der Bühne sind mit der Tastatur unbedienbar

`if (e.target.tagName === 'INPUT') return;` (13401) schützt Schieberegler
und Textfelder, aber **nicht** die Auswahlfelder. Die Bedienzeile der
Bühne besteht genau daraus (12732). Mit Fokus darin: Pfeil hoch/runter
blättert nicht das Feld, sondern verstellt die Lautstärke.

### 2.9 Das Pult kommt beim Tastaturfokus nicht zurück

Bei Karaoke und „aus" ist `.bpult` eine Schublade (830/832) — weiterhin
fokussierbar, nur außerhalb des Bildes. Hervorgeholt wird sie von
`mousemove` (10979) und `touchstart` (10990); einen `focusin`-Horcher
gibt es nicht. `pultVerbergen()` weigert sich zwar einzufahren, solange
der Fokus drin sitzt (10975) — aber es holt die Schublade nicht heraus.

### 2.10 Kleinere Fehler

- **Die drei Modussegmente zeigen ihren Zustand nie an** (11125).
  `pmodiAufbauen()` setzt nur `.disabled` und `.title`, nie eine
  Aktiv-Klasse; im CSS gibt es dafür auch keine Regel. Der Kommentar
  1152–1160 verspricht ausdrücklich das Gegenteil: *„Das gefüllte
  Segment sagt, in welchem Zustand die Bühne steht."*
- **`#bmeta` wird bei jedem Bühnenaufbau gefüllt und ist immer
  unsichtbar** (2521). 13022 schreibt Modell, Datum, Plays und Likes
  hinein; die Regel `#buehne .bpult .bmeta{display:none}` (802) trifft
  das Element immer. Tote Anzeige — entweder sichtbar machen oder das
  Füllen weglassen.
- **Die Anschlusslampe leuchtet nur in der Hauptleiste** (272–274).
  `anschlussLampe()` setzt die Klassen auf beide Knöpfe (8803/8813), im
  Pult gibt es dafür keine CSS-Regel. Die Hauptleiste zeigt drei
  Zustände (aus / wartet / Naht bereit), das Pult zwei.
- **`#bstumm` ist der einzige Knopf beider Leisten ohne `title`**
  (2532). Beim Überfahren greift das `title="Lautstärke"` der Gruppe —
  der Knopf meldet den Text des Reglers. Auch der Tastenhinweis (m)
  fehlt dort.

---

## 3. Unterschiede zum Abwägen — kein Fehler, aber eine Entscheidung

- **Kein Weg vom Pult in die Detailansicht** (2520). In der Hauptleiste
  ist die Aufteilung ausdrücklich gebaut: Cover öffnet die Bühne,
  Titel die Details (13390/13391). `#btitel` ist ein nacktes `<h2>` ohne
  Handler.
- **Der schnelle Tooltip endet an der Hauptleiste** (13358). Der Horcher
  filtert auf `#player [title]`. Alle Pultknöpfe tragen `title`, bekommen
  aber den trägen System-Kasten.
- **Tonqualität MP3/WAV ist nur über das Pult erreichbar** (12693) —
  obwohl sie die *eine* Tonquelle umschaltet. Wer ohne Bühne hört, kommt
  an WAV nicht heran.
- **Bei fremden Songs verliert die Bühne die Herkunft** (13021). Die
  Hauptleiste hängt den Urheber an (8994), `btitel` bekommt nur den Titel.
- **Escape schließt alles außer dem Tonstudio** (13414).
- **Der Fortschrittsbalken der Bühne** (`#bleiste`, 2505) steht bewusst
  außerhalb des Pults, damit er bei eingefahrener Schublade sichtbar
  bleibt. Er wächst beim Überfahren von 5 auf 9 px, `#leiste` bleibt
  bei 4 px.
- **Beide Leisten können nur springen, nicht spulen** (13376) —
  identische Formel, in beiden Fällen nur `onclick`. Ziehen gibt es
  nirgends.

---

## 4. Was Absicht ist — bitte nicht „reparieren"

Diese Punkte sehen wie Ungereimtheiten aus, sind aber datierte
Beschlüsse. Sie stehen hier, damit sie niemand versehentlich glattbügelt.

- **Die Roh-Analyser hängen vor dem EQ** (10031). Caspar_D, 20.08.2026:
  *„Der Analyzer ist ein Rohdatentool und misst das Werk, nicht die
  Filter."* Gilt für die Kanalanalyser, Butterchurn, Live-Spektrum und
  das Dichte-Spektrum. **Das ist die Antwort auf „im Analysierer ist
  kein EQ drin": So ist es gewollt.**
- **Drei Analyser hängen bewusst hinter allem** (10113): `anzeige`,
  `anzL`, `anzR` sitzen am Master — hinter EQ, Solo, Kerbe, Kompressor
  und Breite. Der Kommentar sagt es ausdrücklich: *„Der zeigt, was man
  HÖRT."* Es gibt also beides, mit klarer Aufgabenteilung.
- **Die Analyse rechnet immer auf dem WAV** (12010), unabhängig davon,
  was das Pult gerade spielt (Caspar_D, 24.08.2026).
- **Die sechs Stem-Decks hängen vor dem EQ** (10012) — damit sie durch
  denselben EQ laufen und von denselben Analysern gemessen werden.
- **`eqAus` ist der Generalschalter, `bypeq` nur die eine Stufe** (3546).
- **Der Notweg im `catch`** hängt die Decks direkt an die Lautsprecher
  (10181).
- **Versatzregler, Zeitmarken-Wahl, Bild- und Visualizer-Wahl, Zoomzeile,
  Vollbild** gehören zur Bühne und haben in der Fußzeile nichts zu
  suchen (2537).
- **Die Lautstärkegruppe verschwindet in der Hauptleiste auf schmalem
  Schirm** (`.nuranbreit`, 1204) — begründet im Kommentar 1198–1216.

---

## 5. Die Tonkette in einem Satz

```
deckA / deckB → quellA / quellB → blendA / blendB → mixRegler → quelle
                                                                  │
   die sechs Stems gehen direkt in ────────────────────────────────┤
                                                                  │
   ├─ Roh-Analyser (l/r über ChannelSplitter)   ← messen das Werk
   ├─ Butterchurn, Live-Spektrum, Dichte        ← messen das Werk
   │
   └→ EQ-Kette (8 Bänder) → Kerbe → Kompressor → Breite → Hall/Echo
                                                            → master
                                                                │
                                     anzeige / anzL / anzR ─────┘
                                                   ↑ messen, was man hört
```

Zwei Nebenwirkungen, die aus dieser Bauart folgen und im Code nicht
kommentiert sind:

- **Stem-Solo verstellt die Roh-Analyser** (8925). `stemSolo()` fährt
  `mixRegler` auf 0 und den Gain der gewählten Spur auf 1. `mixRegler`
  sitzt vor `quelle`, die Stem-Gains hängen direkt an `quelle` — die
  Roh-Analyser sehen im Solo also die einzelne Spur statt des Mixes.
- **Stems umgehen die Anschluss-Blende** (10018).

---

## 6. Vorschläge — nichts davon ist entschieden

Nach Nutzen je Aufwand geordnet. Alles offen für Caspar_D.

1. ~~Die Wellenform reparieren~~ — **erledigt am 25.08.2026**, siehe
   Abschnitt 0.
2. **`babspielen` an `onplay`/`onpause` hängen** (2.1). Zwei Zeilen in
   `deckMelder()` — danach stimmen beide Leisten immer überein.
3. **`buehneAuf()` schließt das Studio** (2.2). Eine Zeile, und die
   unsichtbare Rechenschleife ist erledigt.
4. **Den EQ-Knopf ins Pult** — die ursprüngliche Frage. Sinnvoll erst
   nach 3, und mit einem `z-index` über der Bühne.
5. **`eqJeSong` beim Start laden statt in `studioAuf()`** (2.4) — sonst
   sind gespeicherte Einstellungen ein Zufallsprodukt.
6. Kleinkram: `metaKey`-Prüfung bei den Kürzeln (2.7), `SELECT` in den
   Tastaturschutz (2.8), `title` für `#bstumm`, `#bmeta` entscheiden.

---

*Erhoben mit vier parallelen Prüfblicken und Messungen am laufenden
Browser. Bis auf die Wellenform (Abschnitt 0, ausdrücklich beauftragt)
wurde kein Code angefasst.*
