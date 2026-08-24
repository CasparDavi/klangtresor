# Visualizer und Bühne

> **Namenswechsel:** Das Projekt hieß bis zum 24.08.2026 *MySuno*. Es heißt jetzt **KlangTresor** — „Suno" ist seit dem 06.01.2026 eingetragene Marke von Suno Inc., ausdrücklich für Software zum Abspielen und Bearbeiten von Audioinhalten. Wo in Zitaten und in der Chronik noch der alte Name steht, bleibt er stehen.

Alles in `web/index.html`. Eine Datei, keine Abhängigkeiten.

---

## Die Bühne

Der Knopf 🎤 im Player öffnet die Einzelsongansicht: großes Artwork links,
der Songtext groß rechts. **Seit dem 18.08.2026 öffnet auch ein Klick auf
das Artwork in der Fußzeile die Bühne** (Caspar_Ds Anweisung: „lege bitte die
Mikrofon-Klickaktion vorne auf das Artwork"). Vorher führten Bild und
Titel dort beide in die Detailansicht; jetzt folgt die Aufteilung dem,
was man anklickt — **das Bild führt zur Bildansicht, der Text zur
Detailansicht**. Der Knopf bleibt daneben: Er ist der auffindbare Weg,
das Bild der kurze. `⛶` oder Taste `f` schalten auf Vollbild, `Esc`
schließt. Im Hochformat — also auf dem iPhone — rutscht das Artwork nach
oben und der Text darunter.

**Der Text läuft wortgenau mit.** Aktive Zeile weiß, gesungene Wörter in
der Akzentfarbe, vergangene Zeilen gedimmt, Abschnittsmarken klein. Klick
auf eine Zeile springt an die Stelle im Song. Grundlage sind Sunos
Wort-Zeitmarken (244 Songs); fehlen sie, wandert der Text gleichmäßig mit
dem Fortschritt.

**Farben** kommen aus der Coverpalette, gesetzt als CSS-Variablen
`--bgrund`, `--btext`, `--bleise`, `--bakzent`, `--bakzent2`.

---

## Bedienelemente

### Symbole

**Keine Emoji, ausschließlich monochrome SVG.** Die Symbole liegen als
`<symbol>`-Vorrat am Anfang von `web/index.html` und werden über
`SYM('name')` eingesetzt. Sie sind mit `fill:currentColor` gesetzt und
erben damit die Coverpalette.

Emoji wären hier falsch: Sie bringen ihre eigene Farbgebung mit, ignorieren
die Palette und sehen je nach Betriebssystem anders aus.

Vorhanden: `play`, `pause`, `prev`, `next`, `zufall`, `buehne`, `laut`,
`leise`, `stumm`, `vollbild`, `zu`, `raster`, `film`, `eigenvideo`,
`plays`, `herz`, `kommentar`.

Emoji in **Songtiteln** bleiben unangetastet — das ist Caspar_Ds Inhalt, nicht
Oberfläche.

**Zwei Fallstricke, beide schon einmal zugeschlagen:**

Das erzeugte `<svg>` braucht eine eigene **`viewBox="0 0 24 24"`**. Ohne
sie skaliert der Browser nicht, sondern zeichnet das Symbol in seiner
Originalgröße von 24 Pixeln und schneidet auf die Elementgröße zu. Bei
15 Pixeln bleibt davon die linke obere Ecke übrig — beim Lautsprecher
sieht das aus wie ein weißes Rechteck. In der Bühne (19–26 px) fiel es
nicht auf.

Ein `<button>` hat von Haus aus einen **hellen Hintergrund**. Deshalb
steht global `button{background:none;border:none;cursor:pointer}` — wer
einen Hintergrund will, setzt ihn ausdrücklich. Ohne diese Regel erscheint
jeder neu hinzugefügte Knopf, den man zu gestalten vergisst, als weißer
Kasten.

### Die Fußzeile

Am 18.08.2026 neu geordnet. Caspar_Ds Grundsatz: **„was man am häufigsten
benutzt, muss vorne sein."** Von links nach rechts:

| | |
|---|---|
| **Zurück · Abspielen · Weiter** | ganz vorn — das Meistbenutzte |
| Kachel | öffnet die Bühne, wie sie zuletzt stand |
| Titel mit Zeit | darunter, wie gehabt |
| Zufall · **Schleife** | |
| Lautstärke | |
| Haarlinie | links davon die Wiedergabe, rechts die Ansicht |
| **Karaoke · Lyrics · Analyzer** | Zugriff auf die Bühne |

Im Markup stehen die Bedienelemente hinter Kachel und Titel; der
Transport holt sich den vordersten Platz mit **`order:-1`**. Das ist
kein Trick um seiner selbst willen: Die Klammer `.pknoepfe` muss alle
Symbole zusammenhalten, weil sie auf dem Telefon zur zweiten Zeile
wird — und ohne `order` müsste man sie dafür zerreißen.

#### Die Schleife ist neu

Das Wiederholen der **Liste** gibt es längst: `vor()` rechnet modulo,
am Ende geht es von selbst wieder vorn los. Neu und deshalb einen
Knopf wert ist die Wiederholung des **laufenden Titels** — „der
aktuelle Titel im Kreis" (Caspar_D).

`audio.loop` erledigt das im Browser: Bei gesetztem `loop` feuert
`ended` gar nicht erst, der Weiterschaltung kommt also niemand in die
Quere. Die Eigenschaft hängt am `<audio>`-Element, nicht an der
Quelle — ein Songwechsel von Hand nimmt die Schleife mit. Zwei
Zustände wie beim Zufall, Akzentfarbe wenn an, nichts gespeichert.

#### Die drei Bühnenmodi

Sie öffnen die Bühne unmittelbar in diesem Modus; steht sie schon
offen, wechseln sie nur den Modus, statt sie neu aufzubauen. Das
Mikrofon bedeutet damit, wonach es immer schon aussah — Karaoke. Ein
eigener Bühnenknopf entfällt.

| Symbol | Modus | möglich | grau |
|---|---|---|---|
| Mikrofon | Karaoke | 253 | 68 (keine Zeitmarken) |
| Textblock | Lyrics | 257 | 64 (kein Text — die Wetter-Serie) |
| Balken | Analyzer | alle 321 | die fremden Playlist-Einträge |

**Nur 4 Songs haben Text ohne Zeitmarken** — Karaoke und Lyrics fallen
also fast immer gemeinsam aus, bei denselben Stücken. Grau statt
versteckt, wie beim Karaokeknopf in der Bühne schon entschieden.

Die Angaben stehen bereits in der Rasterliste: `K.schlank()` legt
`hatTiming` und `hatLyrics` bei. Die Fußzeile braucht dafür **keine
zusätzliche Abfrage**.

**Kein Zurückschalten durch erneuten Klick.** Das war die Falle der
alten Knopfgruppen — geschlossen wird mit `Esc` und dem Kreuz.

**Der vierte Textwert hat kein Segment.** Für „aus", also die Bühne
mit reinen Visuals, ist kein eindeutiges Symbol zu zeichnen. Dorthin
führt der Klick auf die Kachel.

#### Kein Segment wird hervorgehoben — zwei Anläufe gescheitert

Gedacht waren die Segmente auch als **Zustandsanzeige**: Welcher Modus
steht gerade? Beide Umsetzungen sind gescheitert, die Idee ist
begraben.

**Erst nur bei offener Bühne gefüllt — unsichtbar.** Die Bühne liegt
`fixed` über dem ganzen Schirm (`z-index` 60 gegen 50); steht sie
offen, sieht man die Fußzeile gar nicht.

**Dann nach `bText` gefüllt, also auch bei geschlossener Bühne — eine
Falschaussage.** Caspar_Ds Einwand: „es darf kein knopf gehighlightet
sein, das würde bedeuten, es wäre schon auf, ist es aber nicht." Ein
gefülltes Segment liest sich als „läuft gerade".

#### Auf dem Telefon zwei Reihen und ein Ausklapper

| | |
|---|---|
| **Reihe 1** | Titel links, Zeitangabe rechtsbündig |
| **Reihe 2** | **alle** Symbole: Transport · Zufall · Schleife · Haarlinie · **ein** Mikrofonknopf |

Nebeneinander passen die Modi zwar in 375 px, aber dem Titel blieben
gemessene **46 px** — „Noc…" — und die Zeitangabe brach um. In zwei
Reihen bekommt er **224 px**; die 52 px hohe Kachel trägt beide
Reihen, die Fußzeile bleibt bei 88 px.

**Der Bühnenzugriff ist dort ein einziger Knopf, der nach oben
aufklappt.** Mit allen dreien nebeneinander braucht die Symbolzeile
337 px bei 295 verfügbaren — der Zugriff lief 32 px über den Rand.
Statt alles auf 30 px zu schrumpfen steht dort ein Mikrofon (32 statt
100 px), und die übrigen Ziele behalten 36 px. Die Liste geht nach
oben auf; sie darf das, weil `#player` kein `overflow` hat.

Drei Kunstgriffe stecken darin:

**`display:contents` an zwei Stellen.** `.pinfo` löst sich auf, damit
Titel und Zeit als eigene Rasterfelder liegen können. Und die Klammer
`.pknoepfe` löst sich auf **breitem** Schirm auf — dort bleiben die
Gruppen unmittelbare Kinder der `.preihe`.

**`justify-content:space-between` in der Knopfzeile.** Der Transport
steht unter dem Titelanfang, das Mikrofon unter der Zeitangabe; beide
Reihen fluchten an beiden Rändern.

**Der Wegklick-Horcher braucht `stopPropagation`** am Ausklapper —
sonst liest er den öffnenden Klick sofort wieder als „daneben" und
klappt zu.

#### `.nuranbreit` griff nie an der Lautstärke

Die Regel hieß `.psteuer .nuranbreit` und traf damit nur den
Zufallsknopf. Die Lautstärkegruppe trägt dieselbe Klasse, ist aber ein
Kind von `.preihe` — sie blieb auf dem Telefon stehen. Aufgefallen ist
es erst mit den drei Segmenten: **Gemessen bei 375 px lief die Reihe
137 px über den Rand**, der Transport stand außerhalb des Schirms.

### Zwei Register: Tracks und Playlists

Reiter über der Filterleiste. **Jedes Register bringt seine eigene
Leiste mit** — die Songfilter (Video, Veröffentlichung, Modell) ergeben
für Playlists keinen Sinn.

Beide malen in **dasselbe** Raster `#raster`. Der Unterschied steckt nur
darin, was in `sichtbar` landet — und damit auch, was die
Wiedergabeliste ist. Öffnet man eine Playlist, ist ihre Reihenfolge die
Wiedergabereihenfolge.

| Zustand | Anzeige |
|---|---|
| `register='tracks'` | die 321 Songs, wie bisher |
| `register='playlists'`, keine offen | 25 Playlist-Kacheln (quadratisch) |
| `register='playlists'`, eine offen | deren Einträge in Suno-Reihenfolge |

Adressen: `#playlist=<suno-id>` und `#playlists`.

**Der Größenregler steht in der Registerzeile**, nicht in einer der
Filterleisten. Die Spaltenzahl (`--spalten` am Wurzelelement) gilt für
beide Register, weil alle Ansichten in dasselbe Raster malen — in der
Trackleiste wäre der Regler unter Playlists unerreichbar gewesen,
obwohl er dort genauso wirkt.

**Die Reihenfolge innerhalb einer Playlist wird nicht umsortiert** — sie
ist Teil der Aussage. Die Positionsmarke zeigt Sunos `relative_index`,
nicht die Zeilennummer: Bei vier Playlists fehlen Einträge, die Suno
nicht mehr ausliefert, und diese Lücken sollen sichtbar bleiben.

### Fremde Songs kommen übers Netz

Die 117 Einträge fremder Urheber erscheinen **ausschließlich innerhalb
einer Playlist**, nie im Track-Register — dort steht nur, was Caspar_D
gehört.

Sie liegen nicht im Archiv. `alsSong()` baut aus dem Playlist-Eintrag
ein Ersatzobjekt mit `fremd: true`, dessen Ton und Bild direkt von Sunos
CDN kommen; nachschlagbar über `fremdVonId`. Erkennbar an der Marke
**remote**, darunter statt Plays und Likes der Urheber.

Zwei Stellen mussten dafür angepasst werden:

**`<audio crossorigin="anonymous">`** — Pflicht, nicht Kosmetik. Ohne
das Attribut gilt fremder Ton als verdorben, `createMediaElementSource`
liefert dem Analyser nur Nullen, und alle acht Visualisierungen blieben
bei fremden Songs schwarz. Sunos CDN sendet
`access-control-allow-origin: *`, also funktioniert es. Für eigene
Dateien ist das Attribut wirkungslos, die kommen vom selben Ursprung.

**`buehneAuf()`** — `/api/song/<id>` antwortet für fremde Songs mit 404.
Vorher lief die Funktion damit in einen Auswertungsfehler und die Bühne
öffnete **wortlos gar nicht**. Jetzt bekommen fremde Songs die Bühne
ohne Text (Lyrics und Zeitmarken gibt es nicht), aber mit
Visualisierungen.

`uiFaerben()` brauchte keine Änderung: Ohne Palette schaltet es auf die
unbunten Grundfarben — fremde Songs erfinden also keine Farben.

### Songs werden über Sunos ID referenziert

**Jede Karte trägt `data-id` mit Sunos eigener Song-ID** — dieselbe wie in
`https://suno.com/song/<id>`. Es gibt im Archiv keine eigene
Nummernvergabe.

Das ist keine Förmlichkeit: **Titel sind nicht eindeutig.** „Lakritz" gibt
es zweimal (26.03.2026 unveröffentlicht, 28.03.2026 veröffentlicht),
„Koffein" ebenso, und die Wetter-Serie hat zwölf Titel à vier Fassungen.
Insgesamt kommen 15 Titel mehrfach vor und betreffen 54 Songs.

Früher ermittelten drei Ereignisbehandlungen den Song über die **Position**
der Karte im Dokument (`indexOf(k)` → `sichtbar[i]`). Das funktionierte nur,
solange DOM-Reihenfolge und Liste exakt übereinstimmten — und wäre gebrochen,
sobald eine Karte ausgeblendet wird. Ersetzt durch `k.dataset.id` und das
Nachschlagewerk `song(id)`.

### Adressen enthalten die Song-ID

`#song=<suno-id>` — wird beim Start eines Songs gesetzt und beim Laden der
Seite ausgewertet. Damit ist jeder Song verlinkbar.

`history.replaceState` statt `pushState`, sonst füllt jeder Songwechsel die
Zurück-Historie. Es gibt dadurch auch keine Schleife mit `hashchange`:
`replaceState` löst das Ereignis nicht aus.

### Die Filterleiste

**Vier gleichartige Auswahlfelder, keine Filterknöpfe mehr.**

| Feld | Werte | Voreinstellung |
|---|---|---|
| `#video` | Alle · Mit Video-Artwork · Ohne Video-Artwork | Alle |
| `#sicht` | **Öffentlich** · Privat · Beides | **Öffentlich** |
| `#modell` | Alle Modelle · v4 … v5.5 | Alle |
| `#sortierung` | Neueste · Älteste · Plays · Likes · Titel | Neueste |

**Das Archiv startet mit „Öffentlich"**, zeigt also 248 der 321 Songs. Die
73 privaten sind ein Zusatz, nicht der Regelfall.

Beim Video-Feld ist ausdrücklich das **eigene** Video-Artwork gemeint (83
Songs), nicht Sunos Lyric-Video — das hat fast jeder Song. Deshalb steht es
auch so in der Beschriftung.

Alles frei kombinierbar. Ein paar Proben: „Mit Video-Artwork" 83, „Ohne"
bei Öffentlich 165 und bei Beides 238, „Privat + Mit Video-Artwork" 0 —
keiner der unveröffentlichten Songs hat ein eigenes Video-Artwork.

### Filter zurücksetzen

Knopf `#ruecksetzen`, **erscheint nur, wenn ein Filter von der
Voreinstellung abweicht**.

Er ist die Gegenmaßnahme dazu, dass es seit der Umstellung auf
Auswahlfelder keinen sichtbaren Anker „zeig mir wieder alles" mehr gibt:
Bei vier Bedienelementen sieht man einer kurzen Liste nicht an, welches
davon sie kurz hält.

**Die Sortierung wird nicht zurückgesetzt** und lässt den Knopf auch nicht
erscheinen — sie schränkt nichts ein.

`.knopf[hidden]{display:none}` steht ausdrücklich im Stylesheet: Sollte
`.knopf` je ein `display` bekommen, hätte die Browserregel für `[hidden]`
keine Chance dagegen.

**Ein Sonderfall, der leicht übersehen wird:** `spielenNachId()` setzt die
Auswahl auf **`beides`**, nicht auf die Voreinstellung. Sonst fände ein Link
auf einen privaten Song (`#song=<id>`) ihn nicht, weil das Archiv mit
„Öffentlich" startet.

**Die Marke „privat"** sitzt unten links an der Kachel, weil oben beide
Ecken belegt sind (Modell rechts, Video-Artwork links). Sie trägt **keine
feste Signalfarbe**: Der Rand nimmt über `color-mix` die Coverpalette auf,
wie der pulsierende Rahmen der laufenden Kachel. Im Ruhezustand ist damit
auch sie unbunt.

Gesetzt wird sie am selteneren Fall — 73 von 321 —, nicht am häufigen.

### Lautstärke

Regler **im Player und in der Bühne**, beide ziehen gleich. Zusätzlich
Pfeil hoch/runter und `m` für stumm. Die Einstellung bleibt pro Gerät
erhalten.

Der Wert wird **quadriert** auf `audio.volume` gelegt: Das Gehör empfindet
Lautstärke nicht linear, ein linearer Regler wirkt in der oberen Hälfte
fast wirkungslos und stürzt unten ab. Regler auf 50 % ergibt Pegel 0,25.

### Textversatz

Regler unter der Wiedergabesteuerung in der Bühne, dazu `+` und `-` für
Schritte von 25 ms. Bereich −800 bis +800 ms, bleibt pro Gerät erhalten.

Gerechnet wird mit `currentTime − Versatz`:

- **negativer Wert** → Text läuft **vor**, erscheint früher
- **positiver Wert** → Text läuft **nach**, erscheint später

**Referenzwert: Caspar_D braucht mit AirPods −200 ms** (17.08.2026), also
einen Vorlauf.

Das ist bemerkenswert, weil man das Gegenteil erwarten würde: Bluetooth
gibt verzögert wieder, der Text müsste also *später* kommen. In der Praxis
ist es umgekehrt — und das passt zu dem, was Karaoke-Systeme seit jeher
machen: Der Text muss lesbar sein, **bevor** die Zeile gesungen wird.

Deshalb steht die Richtung am Regler dran („früher ← → später") statt in
einer festen Regel. Ob früher oder später richtig ist, entscheidet das Ohr,
nicht die Theorie.

Der Versatz gilt ausschließlich für den Text. Fortschrittsbalken und
Zeitanzeige zeigen weiter die echte Position — sonst stimmte die Anzeige
nicht mehr mit dem Sprungverhalten überein.

### Die Oberfläche folgt dem Song

`uiFaerben()` setzt beim Start eines Songs die Grundfarben als
CSS-Variablen am Wurzelelement: `--bg`, `--flaeche`, `--flaeche2`,
`--rand`, `--akzent`, `--akzent2`. Alles andere leitet sich davon ab, weil
die Regeln durchgängig mit `var()` arbeiten. Übergang 0,8 Sekunden Blende.

Die **Textfarbe wird bewusst nicht** mitgesetzt: Sie ist gegen den Grund
auf Kontrast geprüft, aber in der Rasteransicht liegt kein Coverbild
dahinter, und ein Song mit sehr dunkler Palette würde die Lesbarkeit dort
verschlechtern.

**Ohne laufenden Song ist alles unbunt.** Die Voreinstellung in `:root`
besteht aus reinen Graustufen (gemessene Buntheit 1–5 von 255) — solange
keine Musik läuft, gibt es keine Coverfarbe, und dann soll die Oberfläche
auch keine erfinden. Dasselbe gilt für die 18 Cover, aus denen sich keine
Farbe gewinnen lässt.

Aus demselben Grund benutzt auch der pulsierende Rahmen der laufenden
Kachel `color-mix(in srgb, var(--akzent) …)` statt eines festen Farbwerts.

### Der Kopfbereich muss kleben

`header{position:sticky; top:0}` allein genügt nicht. Ein sticky-Element
klebt nur innerhalb der Box seines **Elternelements** — und `body` hatte
`height:100%`, war also genau einen Bildschirm hoch. Der Kopfbereich blieb
dadurch bis 1336 px oben und scrollte danach weg; bei 6708 px Seitenlänge
fiel das erst weit unten auf.

Deshalb: `html{height:100%}` **aber** `body{min-height:100%}`.

### Formate

| Wo | Regel |
|---|---|
| Rasterkachel | fest 3:4 hochkant, vorgerechnet von `bin/kacheln.js` |
| Videomarke | **nur bei eigenem Video-Artwork** (83 Songs) |
| Artwork auf der Bühne | Rahmen übernimmt das Format des Mediums |
| Visualisierungen | nehmen den ganzen verfügbaren Platz |
| Video im Raster (Hover) | **Höhe bestimmt die Größe**, Breite ergibt sich |

Sunos Lyric-Video bekommt **keine** Marke mehr: Fast jeder Song hat eins,
es würde also nichts unterscheiden — und seit es die Bühne gibt, ist es
inhaltlich überflüssig. Der Filter „Mit Video-Artwork" meint ebenfalls die
83 eigenen Videos.

Beim Hover-Video ragt ein breites Video seitlich über die Kachel hinaus,
statt beschnitten zu werden; Kachel und Karte heben dafür kurz ihr
Clipping auf. Auf der Bühne ist es umgekehrt gelöst — dort übernimmt der
Rahmen das Format, sonst ragte ein breites Video in die Textspalte.

### Der Aktiv-Rahmen wandert auf das Video

Sobald ein bewegtes Artwork sichtbar ist, sitzen Kontur und Puls **am
Video**, nicht mehr am Kachelrand (`.bild.laeuft.zeigtVideo`).

Grund: Kein einziges der 83 Video-Artworks trifft das 3:4-Format der
Kachel.

| Seitenverhältnis | Anzahl | Was der Rahmen an der Kachel täte |
|---|---|---|
| schmaler als 3:4 (0,57–0,67) | 61 | umschlösse links und rechts leere Fläche |
| genau 3:4 | 0 | — |
| breiter als 3:4 (bis 1,0) | 22 | wäre vom Video verdeckt |

Damit gilt weiterhin die Regel, die schon die Position am `.bild`
begründet hat: **Der Rahmen umschließt das, was man tatsächlich sieht.**

Der Puls braucht dafür eigene Keyframes (`pulsVideo`): Er läuft über
`box-shadow`, und das Video hat bereits einen Schlagschatten — ein
zweites `box-shadow` würde ihn ersetzen statt ergänzen. Deshalb steht er
in jedem Schritt mit drin. Dasselbe gilt unter `prefers-reduced-motion`.

Verworfen wurde die Alternative, das Video nur während der Mausberührung
laufen zu lassen: Das hätte den Rahmen nicht freigelegt, sondern die
Verdeckung nur verkürzt — und es hätte das bewegte Artwork auf dem iPhone
ganz entfernt, wo es mangels Mauszeiger allein am laufenden Song hängt.

**Nicht in Bewegung geprüft.** Der ferngesteuerte Browser bricht die
Videowiedergabe ab; nachgewiesen sind bisher nur die berechneten Stile.

---

## Audioanalyse

```
<audio> ──> ChannelSplitter ──> AnalyserNode links
                           └──> AnalyserNode rechts
        └──────────────────────> Lautsprecher
```

**Zwei Fallstricke:**

`createMediaElementSource` darf pro Element **nur einmal** aufgerufen
werden — daher die Wächtervariable `hörer`.

Sobald ein Audioelement in einem Graphen hängt, kommt der Ton **nur noch
über den Graphen**. Die Verbindung zum Ausgang ist Pflicht, sonst bleibt
es still.

### Bildrate

**24 Bilder je Sekunde**, nicht 60. Der AnalyserNode rechnet die
Fourier-Transformation erst beim Abholen der Daten — seltener abholen
spart also echte Rechenzeit, nicht nur Zeichnerei.

### Glättung

Die Analyser laufen mit `smoothingTimeConstant = 0.3`, also **wenig**
Glättung — sonst überleben die Transienten nicht, die eine Schlagerkennung
braucht. Fürs Auge wird separat geglättet (exponentiell, Faktor 0,7).

### Fünf Bänder

Genau fünf, weil sich daraus je eine Farbe zuordnen lässt:

| Band | Bereich |
|---|---|
| Sub | 20–120 Hz |
| Bass | 120–400 Hz |
| Mitten | 400–1200 Hz |
| Präsenz | 1200–4000 Hz |
| Höhen | 4000–16000 Hz |

### Schlagerkennung

Vergleich der Bassenergie gegen **Mittelwert plus Streuung** eines
Zeitfensters von 1,5 Sekunden. Ein Vergleich gegen den Langzeitmittelwert
versagt bei komprimierter Musik — dort liegt der Bass dauerhaft hoch und
überschreitet nie das Vielfache seines Mittels.

Das Fenster wird nach **Zeit** begrenzt, nicht nach Bildanzahl. Die
Bildrate schwankt; eine feste Anzahl entspräche mal einer halben, mal zehn
Sekunden. Die Schwelle ist zusätzlich gedeckelt, sonst macht ein einzelner
Ausreißer die Streuung so groß, dass danach kein Schlag mehr erkannt wird.

### Weitere Messgrößen

**Spektraler Schwerpunkt** — der lautstärkegewichtete Mittelwert aller
Frequenzen, beschreibt die Klanghelligkeit feiner als ein grobes Band.
Wird zusätzlich auf den Bereich normiert, den der jeweilige Song nutzt;
sonst klebt bei hellen Mixen alles am oberen Rand.

**Fluss** — Änderungsrate der Lautheit, also „Lautstärke pro Zeiteinheit".

**Seitenlage** — von −1 (ganz links) bis +1 (ganz rechts).

---

## Tonqualität: MP3 oder WAV

Auswahlfeld `#btonWahl` im Pult, Zustand in `bTon`, gemerkt pro Gerät.

Beide Fassungen liegen lokal. Das WAV ist das verlustfreie Original
(PCM 16 Bit, 48 kHz), wiegt aber rund 50 MB statt 5 — im Heimnetz
spürbar, beim Durchblättern lästig. Deshalb **MP3 als Voreinstellung**
und ein Schalter, nach derselben Logik wie beim Video-Artwork:
vorhanden heißt nicht automatisch aktiv.

Fehlt für einen Song das WAV, ist der Eintrag grau — es wird nie auf
eine Datei gezeigt, die es nicht gibt. Die Größe steht im Eintrag,
damit man vor dem Umschalten weiß, was man lädt.

`tonSetzen()` merkt sich die **Stelle im Song** und stellt sie nach dem
Quellwechsel wieder her; ein Wechsel der Quelle setzt sie sonst auf
null zurück.

**Für die Visualisierungen macht es keinen Unterschied** — die Web
Audio API dekodiert ohnehin zu Fließkomma, und die Analyse sieht bei
320 kbps praktisch dasselbe. Der Gewinn liegt allein im Hören.

Der Katalog kennt die WAVs über das Feld `wav` (Größe in Bytes).
`bin/aufbereiten.js` sieht dafür bei jedem Lauf im Dateisystem nach,
statt aus der Vorfassung zu übernehmen — verlässlich und nicht still
verlierbar.

---

## Die Textebene: aus · Karaoke · Lyrics

Die Textzeilen im Lyrics-Modus sind bewusst klein und dicht gesetzt
(`clamp(15px,1.65vw,27px)`, Zeilenhöhe 1,2, Abstand 0,13em; vorher
`clamp(19px,2.5vw,40px)` bei 1,32 und 0,34em). Dort liest man ganze
Strophen im Zusammenhang — dafür ist mehr Text im Blick wichtiger als
große Schrift. Gemessen: 44 Zeilen sichtbar statt rund 20. Fürs
Mitsingen aus Entfernung gibt es den Karaokemodus.


Zweite Achse neben der Bildebene, Zustand in `bText`.

| Wert | Was passiert |
|---|---|
| `aus` | nur Bild, bildschirmfüllend |
| `karaoke` | drei Zeilen auf abgedunkeltem Band, mittlere ist dran |
| `lyrics` | geteilter Schirm, ganzes Lied mit Positionsanzeige |

„Aus" hat keinen eigenen Knopf — erneuter Klick auf den aktiven
schaltet ab.

**Karaoke braucht Wort-Zeitmarken.** 68 der 321 Songs haben keine, alle
fremden ebenfalls nicht. Dort ist der Knopf **grau** und der Text fällt
auf `aus`. Bewusst kein stiller Rückfall auf Lyrics — Caspar_Ds Begründung:
Auf einer Party ist eine Wand voll Text, die keiner mitsingen kann,
schlimmer als gar keiner; so sieht man sofort, dass Weiterspulen lohnt.

### Was im Karaokeband nicht mitzählt

`bSingbar` hält die Indizes der gesungenen Zeilen. Übersprungen wird,
gemessen an allen 23.937 Lyrics-Zeilen des Archivs:

| | Anzahl | |
|---|---|---|
| `[Intro]`, `[Verse 1]`, `[Spoken]` | 3969 | Abschnittsmarken |
| **alles vor der ersten eckigen Klammer** | 438 Zeilen in 74 Songs | Widmungen, Playlist-Hinweise, Übersetzungsvermerke |
| `##### English version #####` | 21 | Regieanweisung |
| `-----`, `=====` | 15 | Trennlinie |

**Nicht** übersprungen werden runde Klammern: „(Nicht sie da.)",
„(Zu grau.)" — das sind 43 Begleitstimmen, also echter Gesang.

**Gibt es gar keine eckige Klammer, wird nichts weggelassen** — sonst
verschwände der ganze Text. Betrifft zwei Songs; geprüft an
„Moissanit", alle 67 Zeilen bleiben.

Bekannte Lücke: Bei diesen beiden Songs sind die Abschnitte als
„Strophe 1" ausgeschrieben statt in Klammern. Solche Marken erkennt der
Filter nicht und sie laufen als Textzeile mit.

Die Zeilen sind auf `min(1040px, 74vw)` begrenzt — über die volle
Breite gezogen findet das Auge den Anfang der nächsten Zeile nicht mehr.

---

## Bildfüllend mit unscharfer Füllung

Bei **Karaoke** und **aus** füllt die Fläche den Schirm — für **alle**
Bildarten, nicht nur für die Visualisierung.

Das Medium wird darin vollständig eingepasst (`object-fit: contain`):
Mindestens eine Dimension ist dadurch immer komplett ausgenutzt, bei
einem hochkanten Video auf breitem Schirm also die Höhe. Der übrige
Platz bleibt **nicht schwarz**, sondern trägt dieselbe Quelle noch
einmal — formatfüllend, `blur(38px)`, leicht vergrößert, damit die
Unschärfe nicht am Rand ausfranst.

Kein erfundener Inhalt: Es ist dasselbe Bild. `bin/kacheln.js` macht es
bei den Rasterkacheln seit jeher genauso.

Nur bei **Lyrics** übernimmt der Rahmen weiterhin das Format des
Mediums — dort ist er kleiner als der Schirm, es entstehen also keine
Ränder.

---

## Das Pult besteht aus Auswahlfeldern

Vier Felder nebeneinander, gebaut wie die Filterleiste der
Titelansicht — gleiche Bauart, gleiche Bedienung:

| Feld | Inhalt |
|---|---|
| `#bbildWahl` | Artwork · Video-Artwork · Visualizer |
| `#bmodusWahl` | die Visualisierungsart — **nur bei Visualizer** |
| `#btextWahl` | Kein Text · Karaoke · Lyrics · **Analyzer** |
| `#btonWahl` | MP3 · WAV |

Vorher waren es Knopfgruppen. Als Auswahlfeld bekommt „Kein Text"
endlich einen eigenen Eintrag — beim Knopf musste man den aktiven
erneut drücken, was niemand erraten konnte.

Nicht Mögliches ist **grau statt versteckt**: Karaoke ohne Zeitmarken,
WAV ohne Datei, Analyzer bei fremden Songs — und die **gesamte
Bildebene**, solange der Analysemodus läuft, weil sie dort nichts
steuert. So sieht man, dass es die Möglichkeit gibt und warum sie hier
nicht greift.

`textWaehlen()` setzt direkt, `textSetzen()` schaltet um — Letzteres
bleibt für den Aufruf von außen.

---

## Der SunoAnalyzer

Seit dem 18.08.2026 ist der Analyzer **ein Modus der Bühne**, kein
eigenes Werkzeug mehr: der vierte Wert der Textachse. Kein zusätzlicher
Tab, kein Ladebereich, kein Kommentar-Generator. Er analysiert den
laufenden Song, füllt sich aus dem Katalog und **fragt nirgends im Netz
nach**.

### Das Layout kommt vom Lyrics-Modus

Die Bühne trägt im Analysemodus **zwei** Klassen: `text-lyrics`
liefert das Grundgerüst — geteilter Schirm, festes Pult, keine
Schublade —, und `text-analyzer` setzt nur die Unterschiede darauf.
Dadurch musste **keine einzige** der vorhandenen
`:not(.text-lyrics)`-Regeln angefasst werden.

| Spalte | Inhalt |
|---|---|
| **links** | Marke „KlangTresor · Analyse" · Songtitel · **eine Zeile** Wiedergabesteuerung · darunter die Analysepanels, scrollend |
| **rechts** | Artwork in Thumbnailgröße · Stilprompt mit durchgestrichenem Ausschluss · Lyricsprompt — im Systemsatz |

**Keine Bildfläche.** `.bart` entfällt im Analysemodus ganz: Für
Video-Artworks und große Visualisierungen ist dort kein Platz, und ein
Thumbnail braucht deren Mechanik nicht. Gezeigt wird **dieselbe Kachel
wie in der Albumansicht** — `kachel.jpg`, 3:4 hochkant, mit
`cover.jpg` als Rückfall —, damit ein Song überall gleich aussieht.

**Der Player steht in einer Zeile.** Übrig sind Textmodus,
Tonqualität, Zurück/Abspielen/Weiter, Zeit und Lautstärke. Textversatz,
Bildebene, Darstellungswahl und Zufall sind weg — sie steuern hier
nichts. Gemessen: 111 px Pulthöhe in drei Zeilen, Marke, Titel,
Bedienung.

Die rechte Spalte ist **Nachschlagetext, kein Bühnentext**: der rohe
Prompt, nicht der mitlaufende. Deshalb der Systemsatz statt der großen
Schrift des Karaokemodus. Das Verhältnis ist gegenüber Lyrics
umgekehrt — dort ist links schmal, hier braucht links die Fläche, weil
Spektrogramme auf Breite angewiesen sind.

**Die linke Spalte musste ein Raster werden.** Mit umbrechendem Flex
wuchs der Panelbereich auf volle Inhaltshöhe — gemessen **3875 px in
einer 1232 px hohen Spalte** — und scrollte damit die ganze Bühne statt
sich selbst. Nur ein Raster kann einer Reihe ausdrücklich „der Rest der
Höhe" zuweisen. `min-height:0` gehört dabei an **beide**, Raster und
Kind: Ohne das weigert sich die Reihe zu schrumpfen und wächst weiter.

### Die Reihenfolge im Analysemodus

Von oben nach unten, festgelegt am 18.08.2026:

| | |
|---|---|
| **fest** | Marke · Songtitel · Bedienzeile · **Zoomleiste** |
| **scrollend** | Karten · Wellenform mit Spielkopf · Struktur · alle Kurven |

**Die Zoomleiste steht oben, nicht bei den Panels.** Sie gehört dem
Modul, wird aber von `analyzerAufbauen()` ins Pult geholt und beim
Abräumen wieder entfernt — im scrollenden Bereich wäre sie nach dem
ersten Scrollen aus dem Bild, obwohl sie auf alle Diagramme wirkt.

**Aus den Kacheln wurde eine Tabelle** (Caspar_D, 18.08.2026: „ich glaub,
ich mag die card buttons nicht, geht das auch tabellarisch und
microchartmässig a la edward tufte"). Die Kachel war ein Kasten um eine
Zahl — Rahmen, Fläche, Rundung und Mittelsatz kosteten Platz und trugen
nichts bei. Jetzt: Zeilen mit einer Haarlinie, linksbündige Benennung,
rechtsbündige Zahl in Tabellenziffern, daneben eine wortgroße Grafik.

| | vorher | jetzt |
|---|---|---|
| Zeile | Kachel 144×108 | Tabellenzeile 280×25 |
| Höhe aller 26 | über 500 px | **172 px** |
| Grafik | Farbverlaufsbalken | **10 Sparklines**, 4 Haarlinien-Marken |

**Zehn der Werte haben eine Zeitreihe** — Lautheit, Dynamik, BPM,
Centroid, Rolloff, Tilt, Harmonische Dichte, Entropie, Inharmonizität,
Noten-Stabilität. Sie liegen ohnehin vor, weil sie die großen Diagramme
weiter unten speisen; für die Sparkline werden sie auf 78 Punkte
eingedampft. Wo es keine Reihe gibt, aber einen bekannten Wertebereich,
bleibt die Bereichsmarke — als Haarlinie mit einer Marke, nicht als
Farbverlauf.

Möglich macht das Raster `display:contents` an den alten Vierergruppen:
Ihre Kinder rutschen damit in das Raster der Eltern, ohne dass am Markup
der Gruppen etwas zu ändern wäre.

**Sortiert wird nach einer Frage, nicht nach Bauzeitpunkt:** erst was
für ein Stück ist das (Dauer, BPM, Akkordwechsel, Energieform), dann wie
klingt es (Pegel, Harmonik, Klangfarbe, Raum), zuletzt wie ist es
angekommen (Modell, Plays, Likes). Gesetzt wird nur `order` an den
Rasterkindern — im Quelltext steht jede Karte weiterhin dort, wo sie
immer war.

**Zwei Fallstricke dabei, beide zugeschlagen:**
Die Messbalken sind Blockelemente mit absolut positioniertem Inhalt — in
einer mittig ausgerichteten Flexspalte schrumpfen sie auf **null** und
verschwinden spurlos. Und `kartenSortieren()` lief zuerst **vor**
`innerHTML = MARKUP`, also bevor es Karten gab.

**Die Wellenform sitzt unter den Karten** und trägt eine
**mitlaufende Zeitangabe auf dem Spielkopf** — so muss das Auge beim
Lesen nicht zwischen zwei Stellen hin- und herspringen.

**Die Knöpfe behalten das Größenverhältnis der übrigen Player:** der
Abspielknopf bleibt der größte, nur maßstäblich kleiner (46/60 px
wird zu 38/50 px), damit die Bedienzeile eine Zeile bleibt.

### Ein dritter Fall derselben Lücke

`window._audioSamples` — die Abtastwerte, aus denen die Wellenform
gezeichnet wird — setzte **wieder nur `analyze()`**, der Weg über die
Suno-Songseite. Auf dem Dateiweg brach `drawMainWaveform()` deshalb
sofort ab, und die Wellenform blieb leer: ausgerechnet die Anzeige, an
der der Spielkopf hängt. Gesetzt wird sie jetzt neben `songDuration`
in `startWorkerAnalysis()`.

**Damit ist es der dritte Fund derselben Art.** Wer im Analyzer etwas
vermisst, sollte zuerst prüfen, ob es nur im Suno-Weg gesetzt wird.

### Der Bezugspunkt eines gleitenden Fensters ist seine MITTE

Die wichtigste Regel dieses Abschnitts, und sie stand hier zu lange
falsch:

> Ein Fenster der Länge N, das bei t beginnt, beschreibt den Zeitpunkt
> **t + N/2**, nicht t. Gezeichnet wird an der Mitte.

**Was es gekostet hat:** Die Kurzzeitlautheit mit ihrem 3-Sekunden-
Fenster wurde **1,5 Sekunden zu spät** gezeichnet. Beim Mitlaufen stieg
die Kurve lange nach dem, was man hörte — und niemandem fällt das auf,
weil eine Lautheitskurve immer plausibel aussieht.

Aufgefallen ist es erst, als aus zwei Kurven eine Differenz gebildet
werden sollte: Dort verschiebt sich die eine gegen die andere um
1,3 Sekunden, und die Differenz zeigt an jedem Lautstärkewechsel eine
Spitze, die es gar nicht gibt.

**Der erste Anlauf war Flickwerk** — eine Indexverschiebung an der
Stelle, wo subtrahiert wird. Caspar_Ds Einwand traf den Kern: Der Fehler
steckte in der Definition, nicht in der Verwendung. Seit die Fenster
zentriert gebildet werden, bedeutet Index i in **jeder** Kurve dieselbe
Zeit, unabhängig von der Fensterlänge — und alles Weitere stimmt von
selbst.

**An den Rändern wird nichts erfunden.** Eine halbe Fensterlänge vorn
und hinten liefert keinen Wert. Ein abgeschnittenes Fenster misst
weniger Zeit und ergibt einen zu niedrigen Pegel; beim ersten Versuch
zog das die angezeigte Spanne von −53 auf −72 dB, obwohl im Song nichts
dergleichen steht. (Und ein NaN besteht den Vergleich `< -90` klaglos —
geprüft wird mit `isFinite`.)

**Die Normwerte sind davon unberührt.** Integrierte Lautheit und
Schwankungsbreite entstehen weiterhin aus Blöcken nach Vorschrift, ab
dem Anfang und in voller Länge. Zentriert wird nur, was gezeichnet wird.
Die Selbstprüfung läuft unverändert durch.

**Noch offen:** Dieselbe Verschiebung steckt in den übrigen Kurven des
Analyzers, die aus Fenstern entstehen — Crest (500 ms → 250 ms zu spät),
Impulsdichte (500 ms → 250 ms), Energie (50 ms → 25 ms), die
FFT-Kurven (4096 Abtastwerte → 43 ms). Klein, aber systematisch, und
beim Vergleich zweier Kurven wirkt es sich aus.

### Gewichtsprofile gleitender Fenster

Benannt wird die **Form**, nicht der Erfinder — Caspar_Ds Einwand: „ich hasse
Eigennamen, weil sie keinerlei Info liefern, wie ein Gewichtsprofil
aussieht."

| Form | Profil | Eigenname |
|---|---|---|
| **Rechteck** | flach, harte Kanten | — |
| **Dreieck** | Zelt, linear auf und ab | Bartlett |
| **Kuppel** | Kosinusbogen, null am Rand, weiche Landung | Hann |
| **Glocke** | wird nie null, muss abgeschnitten werden | Gauß |

Das Rechteck ist für die Anzeige die schlechteste Wahl: Es gewichtet ein
Ereignis am Fensterrand genauso stark wie in der Mitte und lässt es dann
schlagartig fallen. Ein einzelner Anschlag erzeugt dadurch ein **Plateau
von genau Fensterbreite mit harten Kanten** — man sieht die Form des
Fensters, nicht die des Signals.

#### Die wirksame Länge

Der Wert wird durch die Gewichtung **nicht verzerrt**: Bei konstantem
Signal kommt bei jedem Profil derselbe Wert heraus. Die Gewichtssumme ist
gleich der Fensterlänge (Mitte überwichtet, Ränder unterwichtet).

Was sich ändert, ist die Glättungswirkung:

```
N_eff = (Σw)² / Σw²      Rechteck N · Dreieck ¾N · Kuppel ⅔N
```

Eine 3-Sekunden-Kuppel glättet also so stark wie ein 2-Sekunden-Rechteck.
**Deshalb steht im Titel die wirksame Länge, nicht die nominelle** — sonst
verstellt ein Profilwechsel unbemerkt die Zeitkonstante mit.

Die Kehrseite spricht für die Kuppel: Beim Rechteck beeinflusst ein Knack
N Punkte lang mit voller Stärke und fällt dann schlagartig raus. Bei der
Kuppel klingt sein Einfluss aus, und das Maximum sitzt dort, wo der Knack
wirklich ist. **Kuppel glättet weniger, verschmiert aber sauberer.**

#### Gerechnet wird über Kastenkaskade

Ein gewichtetes Fenster direkt zu falten kostet Länge × Punkte — bei
16.000 Punkten und 400-ms-Fenster rund 300 Millionen Multiplikationen.
Stattdessen Kastenfilter hintereinander:

| Kästen | ergibt |
|---|---|
| 1 | Rechteck |
| 2 | Dreieck (exakt) |
| 3 | Kuppel (vom Kosinusbogen nicht zu unterscheiden) |
| 5 | Glocke |

Jeder Durchgang kostet über die kumulierte Summe zwei Subtraktionen je
Punkt. Und weil jeder durch seine eigene Länge teilt, bleibt ein
konstantes Signal konstant — die Normierung stellt sich von selbst ein.

### Neun Linienspuren, einstellbar

Alles, was sich als Linie beschreiben lässt, ist seit dem 18.08.2026 eine
SVG-Spur: Signalenergie · Dynamikumfang · Impulsdichte · Tempo ·
Klangtonalität · Spektrale Entropie · Klangrauheit · Frequenzgewicht ·
Obertonreichtum.

Je Spur zwei Auswahlfelder: **Profil** und **Fensterlänge**. Im Titel
stehen die Spanne der Werte und die wirksame Fensterlänge. Das
Frequenzgewicht ist zweiseitig gezeichnet — Vorzeichen als Farbe, mit
Beschnittpfaden an der Nulllinie.

Die alten Canvas-Kurven liegen unsichtbar darunter, bis sich die Spuren
bewährt haben.

### Sockelkaskade und Maßstabsreihe: Spitzen oben, Sockel unten

Umgebaut am 18.08.2026, nachdem Caspar_Ds Befund lautete: „die Flanken von
Einbrüchen werden künstlich hochgezogen, echte Spitzen seh ich kaum."

**Was gemessen wurde, bevor etwas geändert wurde** — an „Noch lachst
Du", 16.683 Punkte Momentanlautheit:

| Band | Größtwert |
|---|---|
| über 3,2 s | **23,8** |
| 3,2–1,6 s | 5,6 |
| 800–400 ms | 4,7 |
| unter 100 ms | **1,7** |

Bei **gemeinsamem Maßstab** wird die Spitzenzeile damit mit 7 % der
Zeilenhöhe gezeichnet — sie liegt praktisch flach. Das war die
Ursache, nicht die Zerlegung.

#### Zwei Vermutungen, beide gemessen widerlegt

Die Übergabe nannte zwei Ansätze. Beide sind gebaut, beide haben das
Problem **nicht** gelöst. Sie stehen hier, damit sie niemand ein
zweites Mal für die Lösung hält.

**Der erste Boden war wirkungslos.** Die Idee: alles unter dem
integrierten Wert minus 20 LU anheben, damit die Erosion in Pausen
nichts zu verschmieren hat. Gemessen griff er bei „Noch lachst Du" an
**38 von 16.683** Punkten (0,2 %) und bei „Abenddämmerung" an **13 von
23.978** (0,1 %). Ein fester Abstand unterstellt eine Dynamik, die das
Material nicht hat — die Momentanlautheit fällt hier gar nicht so tief
(Median −13,1, fünftes Perzentil −20,0).

**Jetzt kommt er aus der Verteilung:** so hoch, dass **95 % der
Zeitpunkte noch Signal darüber haben** — also das fünfte Perzentil
(Caspar_Ds Vorgabe, 18.08.2026). Gemessen an beiden Proben: genau 5,0 %
angehoben, Boden bei −18,7 bzw. −20,0 LUFS.

**Anheben macht den Sockel aber nicht klein.** Gemessen an „Noch lachst
Du" fällt sein Anteil an der Spanne von 97 % bei −32,8 nur auf 89 % bei
−18,7 — und auf 78 % selbst beim 25. Perzentil, wo schon ein Viertel
aller Punkte angehoben wird. Die grobe Parabel folgt dem getragenen
Pegel, und der ist über jedem Boden fast die ganze Höhe.

| Boden | angehoben | Spanne | Sockelanteil |
|---|---|---|---|
| −32,8 (integriert −20) | 0,2 % | 24,5 | 97 % |
| −22,8 (Tor der Norm) | 2,9 % | 14,5 | 93 % |
| **−18,7 (Perzentil 5)** | **5,0 %** | **10,4** | **89 %** |
| −14,7 (Perzentil 25) | 25,0 % | 6,3 | 78 % |

**Die Nebenwirkung ist eine Verbesserung.** Die Krümmung hängt an der
Spanne (`a = Spanne / r²`). Die war vorher Maximum minus Minimum, also
von einem einzigen tiefsten Einbruch bestimmt: 24,5 LU bei einem Stück,
das sich zwischen −18,7 und −8,3 abspielt. Jetzt sind es 10,4 LU. Die
Parabeln richten sich damit nach dem Arbeitsbereich des Stücks statt
nach seinem tiefsten Ausreißer.

**Die neue Zerlegung ändert an der Sichtbarkeit nichts.** Vorher bekam
jede Stufe den *Rest* der vorigen; jetzt liegen alle Parabeln unter
demselben Originalsignal, und Nachbarn werden voneinander abgezogen:

```
Signal = Ö(3,2 s) + [Ö(1,6 s) − Ö(3,2 s)] + … + [Signal − Ö(100 ms)]
```

Weil eine engere Parabel überall mindestens so hoch kommt wie eine
flachere, ist jede Differenz nicht negativ und die Summe fällt
teleskopisch auf das Signal zusammen — die Summeneigenschaft, auf der
das gestapelte Diagramm beruht, bleibt also erhalten.

Gemessen im direkten Vergleich auf denselben Daten:

| Band | alte Bauart | neue Bauart |
|---|---|---|
| über 3,2 s | 100 % | 100 % |
| 3,2–1,6 s | 31,1 % | 23,6 % |
| unter 100 ms | 10,1 % | **7,0 %** |

Sie bleibt trotzdem: Jedes Band trägt jetzt genau das, was auf **seiner**
Größenordnung neu hinzukommt, und erst damit stimmt die Abgrenzung zur
Maßstabsreihe, die der Quelltext schon vorher für sich beanspruchte —
dort enthält jede Zeile alles Feinere mit.

#### Was tatsächlich geholfen hat

**Je Band ein eigener Maßstab**, mit dem Größtwert im Titel. Dieselbe
Bedingung wie bei den beiden Lautheitsspuren: strecken ja, aber nie
ohne Angabe der Spanne.

**Spitzen oben, Sockel unten** — in der Maßstabsreihe (oben 25 ms,
unten 3 s) und, solange die Kaskade noch ein Ridge war, auch dort. Caspar_Ds Regel: „die Spitzen
sind das interessante, also visuell lauter als die Sockel." Die
Helligkeit folgt mit, oben am kräftigsten.

**Und die Tiefe folgt der Ordnung.** Gezeichnet wird von unten nach
oben, die oberste Zeile also zuletzt — sie liegt damit vorn. In einem
Ridge überdeckt die zuletzt gezeichnete Zeile ihre Nachbarn, und
überdeckt werden soll der Sockel, nicht die Spitze. Bei 44 Punkten
Amplitude gegen 24 Punkte Versatz überlappen sich die Zeilen deutlich,
das ist also keine Feinheit.

#### Die Kaskade ist ein Horizontband, kein Ridge mehr

Umgestellt am 18.08.2026. **Ein** Streifen, und die sechs Bänder sind
seine Schichten — nicht sechs Zeilen.

Alle Bänder werden von derselben Grundlinie aus übereinandergelegt.
Die Farbe zählt die **Deckung**: wie viele Schichten eine Höhe
erreichen.

**Gezeigt wird nicht die Höhe, sondern der Abstand zur Umgebung.**
Caspar_Ds Einwand (18.08.2026): „es ist auch egal, ob sie verschieden hoch
sind, es geht darum, ob sie von der umgebung verschieden sind."

Also eine **gleitende z-Transformation je Band**: Ortswert und Streuung
gleitend, gezeigt wird `(Wert − Ortswert) / Streuung`. Eine kleine
Spitze in einem leisen Band zählt damit genauso wie eine große in einem
tragenden — beide stechen gleich weit aus ihrer Umgebung heraus. Die
vorherige Normierung auf den Bandgrößtwert machte Bänder zwar
vergleichbar, maß aber weiter die Höhe: Ein tragendes Band war überall
halbhoch, ein leises überall niedrig, und beides sagt nichts darüber,
ob an *dieser* Stelle etwas passiert.

Drei Festlegungen dabei, alle einstellbar:

**Streuung als mittlere absolute Abweichung, nicht als
Standardabweichung.** Gesucht sind Ausreißer, und die
Standardabweichung wird von genau diesen Ausreißern aufgebläht — eine
kräftige Spitze hebt ihren eigenen Bezugswert an und verschwindet
darin. Derselbe Gedanke wie beim Schimmer-Verfahren, das den
Nachbarschaftsmedian unter Ausschluss der Spitze nimmt.

**Das Fenster kommt aus der eigenen Größenordnung** — vierfache
Bandlänge. Ein festes Fenster für alle würde die Eigenbewegung der
langsamen Bänder als Abweichung zählen.

**Die Streuung hat einen Boden** von 2 % des Bandgrößtwerts. In einer
stillen Passage ist sie fast null; ohne Boden wäre dort jedes
Rauschkorn eine Spitze.

**Und eine Schwelle, sonst fehlt der Grund.** Das erste Horizontband
zeichnete von null aufwärts — irgendeine Abweichung hat aber fast jeder
Zeitpunkt. Gemessen an „Noch lachst Du" erreichen **45,9 %** der
Zeitpunkte eine Streuung, 28,2 % zwei, 14,6 % drei. Die unterste
Schicht deckte damit den ganzen Streifen, und wo alles Figur ist, ist
nichts Figur (Caspar_D: „überzeugt mich nicht, was soll man da sehen
können"). Gezeichnet wird jetzt erst **ab zwei Streuungen**, voll
ausgeschlagen bei sechs. Rund drei Viertel des Streifens bleiben leer,
die Ausbrüche stehen darin.

Einseitig: nur positive Abweichungen. An den Rändern steht NaN, wo das volle Fenster
nicht hineinpasst — dieselbe Regel wie bei den Lautheitsfenstern.

| Deckung | Farbe |
|---|---|
| 1 Schicht | beige |
| 2 | gelb |
| 3 | hellorange |
| 4 | orange |
| 5 und mehr | rot |

**Gelesen wird es so:** Hohes Rot heißt, dass an dieser Stelle Wellen
mehrerer Größenordnungen **gleichzeitig** stark sind — ein Einsatz, der
von der langsamen Bewegung bis zur schnellen Spitze durchschlägt. Beige
allein heißt, dass nur eine einzige Größenordnung trägt.

Gezeichnet wird über den **geordneten** Werten: Von der Grundlinie bis
zum größten Bandwert liegt mindestens eine Schicht, bis zum
zweitgrößten mindestens zwei, und so fort. Also fünf ineinander
liegende Flächen, die größte zuerst — die höhere Deckung übermalt die
niedrigere.

**Zwei Anläufe waren falsch, beide von mir:**

Erst bekam **jedes Band eine eigene Horizontzeile** — sechs Streifen
statt einem. Caspar_D: „nein, nicht jedes band, jedes band ist eine
schicht."

Und in derselben Fassung wurde **jedes Band noch einmal in fünf
Wertscheiben zerlegt**. Caspar_D: „jedes band ist doch schon ein slice, es
macht keinen sinn, die nochmal zu zerlegen." Die Kaskade **ist** die
Zerlegung; sie ein zweites Mal zu schneiden verdoppelt nur die Achse.

#### Gestapelt wird in Energie, nicht in Dezibel

Caspar_Ds Frage am 18.08.2026: „ist loudness logarithmisch und stapeln wir
hier sachen, die wir gar nicht stapeln dürfen?" — **ja und ja.**

LUFS ist der Logarithmus eines Leistungsverhältnisses. Eine Summe von
Logarithmen ist der Logarithmus eines **Produkts**; wer Dezibelwerte
stapelt und daraus Prozentanteile rechnet, nennt „20 % der Summe" den
Anteil an gar nichts.

**Die beiden Streifen stehen dabei auf verschiedenen Seiten:**

| | Domäne | Warum |
|---|---|---|
| Horizontband (Abweichung) | **Dezibel** | Eine Differenz ist ein Verhältnis — „3 dB über der Umgebung" heißt doppelte Leistung, ob laut oder leise. Und das Ohr hört logarithmisch. |
| Gestapelte Anteile | **Energie** | Nur dort ist eine Summe eine Summe. |

Die Kaskade läuft für den Stapel also ein zweites Mal, auf
`10^(LUFS/10)`. Dieselbe Trennung wie bei den Farben, wo OKLab L zum
Auswählen dient und die relative Luminanz für den Kontrast — zwei Maße
für zwei Aufgaben.

**Was der Wechsel zeigt**, gemessen an „Noch lachst Du", Anteile ohne
Sockelband:

| Band | Median | 95. Perzentil |
|---|---|---|
| 3,2–1,6 s | 50,6 % | 100 % |
| 1,6–800 ms | 30,2 % | 59,4 % |
| 800–400 ms | 7,4 % | 37,5 % |
| 400–200 ms | 0,0 % | 21,4 % |
| 200–100 ms | 0,0 % | 6,7 % |
| unter 100 ms | 0,0 % | **0,0 %** |

**In Energie trägt alles unter 100 ms nichts bei**, auch nicht in der
Spitze. In Dezibel sah es nach etwas aus. Genau dafür ist der Wechsel
da.

#### Die Farbe ordnet, sie unterscheidet nicht

„Je sockliger was ist, desto dunkler" (Caspar_D). Das ist auch der richtige
Kanal: Die Bandgröße ist eine **geordnete** Größe, und geordnete Größen
gehören auf Helligkeit, nicht auf Farbton. Die alte Reihe lief von Blau
über Violett nach Orange und behauptete Unterschiede in der *Art*, wo
es Unterschiede im *Grad* gibt — welches der beiden Violett das gröbere
war, konnte man ihr nicht ansehen.

Genommen ist **Viridis**, sieben Stützstellen, dunkel unten: monoton in
der Helligkeit und zusätzlich mit Farbtonwechsel, damit benachbarte
Bänder unterscheidbar bleiben, ohne die Ordnung zu verlieren. Eine
reine Helligkeitsreihe in einem Ton kann das nicht.

#### Das gestapelte Diagramm zeigt die Aufteilung, nicht die Höhe

Es ist **je Zeitpunkt auf 100 % normiert** und lässt das Sockelband
weg — beides am 18.08.2026.

Vorher stand dort die absolute Höhe, und der Sockel nahm 89 % der
Fläche ein. Nur zu normieren genügte nicht: Gemessen nimmt er im Mittel
**81,4 %** der Summe ein (5. Perzentil 25,6, 95. Perzentil 99,6), und
für alle übrigen bleiben im Mittel 18,6 % — darin sind die feinen
Bänder ein Saum von 0,5 %, 0,2 %, 0,0 %.

Ohne ihn zeigt es die Aufteilung **unter den Größenordnungen, die
überhaupt Ereignisse tragen**: woraus der Song gerade besteht, nicht
wie laut er ist. Wie laut er ist, steht in den Spuren darüber.

**Das Sockelband wird nicht gezeichnet.** Es nimmt 89 % der Spanne ein
und trägt kein einziges Ereignis — die flachste Parabel folgt dem
getragenen Pegel. Was es sagt, nämlich wie laut das Stück gerade
insgesamt ist, steht ohnehin in der Momentan- und der Kurzzeitspur
darüber. Gezeichnet werden also sechs Zeilen statt sieben, und sie
bekommen dadurch mehr Höhe.

**Gerechnet wird es weiter.** Die Zerlegung bleibt vollständig, die
Summe aller sieben Bänder ergibt weiterhin das Signal, und
`window._kaskade` trägt es mit. Weggelassen ist es nur im Bild — und
der Titel sagt, was fehlt und wie groß es war.

**Nachrechenbar von außen:** `window._kaskade` trägt Bänder, Namen und
die Bodenzahlen — wie `_chartData` und `_normwerte`. Ob ein Band trägt
oder leer ist, sieht man dem Bild am wenigsten an.

### Warum 400 ms und 3 s — und warum das kein Schlagfenster ist

**400 ms** ist die momentane Lautheit nach BS.1770: Die zeitliche
Integration des Ohrs liegt bei 100–200 ms, verlängert auf 400, damit die
Anzeige ruhig genug zum Ablesen ist. Ein Kompromiss, keine hergeleitete
Konstante. **3 s** ist die Spanne, über die ein Hörer eine Passage
beurteilt.

Caspar_Ds Einwand, mit Zahlen bestätigt: Bei 117 BPM dauert ein Schlag
**513 ms**. Ein 400-ms-Fenster deckt fast vier Fünftel davon ab und
verschmiert den Anschlag beinahe vollständig; als Kuppel sind es wirksam
267 ms, gut die Hälfte eines Schlags. **400 ms ist ein Lautheitsfenster,
kein Rhythmusfenster.** Für Schläge braucht es 20–80 ms — dafür gibt es
Hüllkurve (10 ms) und Energie (50 ms).

Die übrigen Fensterlängen im Rechenkern — 10, 50, 500, 500 ms — sind
**runde Zahlen ohne dokumentierte Herleitung**. Nur das Bandfenster
(4096 Werte) hat einen Grund, und der ist die Frequenzauflösung.

### Pixelflächen: Puffer mit Auflösungsstufen

Spektrogramm und Stereo-Spektrogramm werden **einmal** über den ganzen
Song gezeichnet; Zoomen kopiert nur noch den Ausschnitt heraus. Darüber
Stufen, jede halb so breit wie die vorige, jede mit einem `drawImage`
aus der darüberliegenden erzeugt.

**Zwei Fehler auf dem Weg dahin**, beide gemessen:

Ein einzelner Puffer voller Auflösung war **schlechter als vorher** —
ihn auf Anzeigebreite herunterzurechnen kostete 110 statt 55 ms. Erst
die Stufen brachten den Gewinn.

Und der Zwischenspeicher-Schlüssel enthielt die Bildzahl. Jede FFT-Runde
liefert mehr Bilder, also entstand jedes Mal ein neuer Puffer: **fünf
Puffer derselben Fläche, 160 MB.**

**Die Breite ist auf 16.384 Spalten gedeckelt — und dabei wird
zusammengefasst, nicht ausgewählt.** Jede Spalte nimmt das Maximum über
die von ihr abgedeckten Bilder. Der erste Entwurf nahm ein
Stellvertreterbild; ein Knack von zwanzig Millisekunden wäre damit
spurlos verschwunden. **Derselbe Fehler wie bei 64×64 in der
Farbextraktion** — siehe [FARBHANDLING.md](FARBHANDLING.md).

Ergebnis: Hauptfaden beim Abspielen mit Zoom von **215 ms auf 7,9 ms**
Verzögerung.

### Spuren nach Art der Sequenzprofile

Vorbild ist `Angewandte_Bioinformatik/Sequenzstatistik/Sequenzstatistik.html`
— Caspar_Ds eigene Long-Range-Darstellung. Übernommen sind sechs Kunstgriffe:

| | |
|---|---|
| **SVG mit festem `viewBox`** (1000 Einheiten breit), per CSS gestreckt | scharf in jeder Fensterbreite, **ohne Neuzeichnen bei Größenänderung** — anders als Canvas mit `devicePixelRatio` |
| `vector-effect=non-scaling-stroke` | sonst würde die Linie mitgestreckt und in breiten Fenstern fett |
| **Fläche (Deckkraft 0,15) UND Linie (1,4 px)** aus demselben Pfad | die Fläche gibt Gewicht, die Linie die Genauigkeit |
| **flache Spuren, 44 px** statt 70–360 | erst dadurch passen viele auf einen Schirm, und nur dann sieht man Zusammenhänge |
| **Schwellen als gestrichelte Linie IM Bild** | der Bezugswert gehört dorthin, wo man ihn braucht |
| **Beschriftung in der Farbe der Spur** | keine Legendenkiste daneben |
| **Spiegelung statt Doppelung** | bei ihm die beiden Stränge, bei uns Momentan- gegen Kurzzeitlautheit |

**Gebaut: zwei Lautheitsspuren.** Momentanlautheit (400 ms) und
Kurzzeitlautheit (3 s), **jede für sich**, jede über ihren vollen
Wertebereich gestreckt, mit Kleinst- und Größtwert **im Titel**.

Zuerst waren es zwei Kurven in einem Band, gespiegelt. Caspar_Ds Einwand
war vernichtend und richtig: Er hatte die Spiegelung nicht einmal
bemerkt. Daraus die Regel, die hier künftig gilt:

> **Bevölkerungspyramiden-Prinzip.** Gespiegelte Kurven dürfen sich nie
> schneiden. Das Minimum liegt an der Mittelachse, die Maxima gehen
> nach außen.

Meine Fassung hing an den Außenkanten und wuchs nach innen — sie konnte
sich überlagern und wurde als eine Kurve gelesen.

**Die Streckung ist nur mit Angabe der Spanne zulässig.** Ohne sie sähen
zwei Songs gleich lebendig aus, obwohl der eine über 3 dB schwankt und
der andere über 30. Gemessen an „Noch lachst Du": Momentanlautheit
−53,6 bis −9,6 LUFS, Kurzzeitlautheit nur −26,3 bis −10,3. Erst die
Zahlen im Titel machen die Bilder vergleichbar.

**Echtes Minimum, nicht das zweite Perzentil.** Ausreißer abzuschneiden
hieße, eine Stille zu verstecken — derselbe Fehler wie beim Abtasten der
Cover.

Die Ziellinie steht nur in der Kurzzeitspur; deren Bereich wird so weit
aufgezogen, dass sie nicht aus dem Bild fällt.

Die alten Canvas-Diagramme stehen vorerst daneben, zum Vergleich.

**Eine Ausnahme bleibt:** Das Spektrogramm ist ein Bild aus Millionen
Werten, kein Pfad — es bleibt Canvas.

### Karte, Sparkline, Diagramm, Befund — was wohin gehört

Festgelegt am 18.08.2026, weil der Analyzer sonst wächst, ohne dass
jemand entscheidet, in welcher Form:

| | Frage | Form |
|---|---|---|
| **Karte** | Wie ist dieser Song? | eine Zahl über den ganzen Song |
| **Sparkline** | Wie kam die Zahl zustande? | wortgroß neben der Zahl, nicht zum Ablesen |
| **Diagramm** | **Wo** im Song? | Zeitachse, Spielkopf, ablesbare Werte |
| **Befund** | Was ist faul, und wo? | Ort, Schweregrad, Vorschlag — anklickbar |

Die Grenze zwischen Sparkline und Diagramm ist eine einzige Frage:
**Muss ich einen Wert an einer bestimmten Stelle ablesen können?** Dann
Diagramm. Genügt der Eindruck des Verlaufs, dann Sparkline.

Ein **Befund** ist weder das eine noch das andere. Er trägt keine Zahl
über den Song und keinen Verlauf, sondern eine Stelle und einen Rat.
Deshalb steht er in einer eigenen Liste über den Karten, und die
Zeitangabe ist anklickbar — man soll es hören, nicht glauben.

### Der Befundblock: Vorschläge je Plattform

Umgebaut am 18.08.2026 nach Caspar_Ds Vorgabe. Aufbau von oben nach unten:

| | |
|---|---|
| Überschrift | „Datenbasierte Vorschläge zur Verbesserung · plattformabhängig" |
| **Registerlaschen** | Streaming · Spotify · YouTube · Club · Rundfunk |
| **Gegenüberstellung** | was die Plattform verlangt ↔ was dieser Song hat, je Zeile eine Ampel |
| **Befundspur** | Zeitachse mit Strecken und Einzelfunden |
| Texte | Pegelurteil und Schimmerfunde wie bisher |

**Laschen, kein Klappfeld — bis der Platz fehlt.** Das Auswahlfeld
steht daneben und tritt erst an ihre Stelle, wenn die Laschen nicht
mehr nebeneinander passen. Entschieden wird das nach **gemessener**
Breite (`scrollWidth > clientWidth`, beobachtet über einen
`ResizeObserver`), nicht nach geratener Fensterbreite — im Analysemodus
hängt die Spaltenbreite an mehreren Dingen.

#### Die Plattform bestimmt mehr als zwei Zahlen

Zu Ziel-Lautheit und erlaubter Spitze kommt das **Verhalten**, und das
entscheidet über das Urteil:

| Verhalten | Folge |
|---|---|
| `leiser` (YouTube) | hebt leise Titel nicht an — zu laut ist harmlos, zu leise bleibt leise |
| `beides` (Spotify) | hebt auch an, mit Begrenzer — dann ist **zu leise** gefährlich |
| `nein` (Club, Rundfunk) | keine Regelung, der Pegel bleibt |

**Diese Angaben sind ungeprüft.** Sie stammen aus allgemeinem Wissen,
nicht aus einer Messung und nicht von den Anbietern; sie ändern sich
auch. Wer sie bestätigt, sollte es im Quelltext vermerken.

#### Hausregel: mehrspaltig, wenn der Platz reicht

Eine Tabelle mit vielen kurzen Zeilen lässt rechts eine leere Hälfte
stehen. Deshalb gilt seit dem 18.08.2026 für **alle** Tabellen des
Analyzers: **ab sechs Zeilen wird geteilt**, die Stücke stehen als
eigene Raster nebeneinander in einem umbrechenden Behälter
(`tabelleMehrspaltig()`).

**Entschieden wird das vom Umbruch, nicht von einer Messung.** Passen
die Stücke nicht nebeneinander, rutschen sie von selbst untereinander —
`flex-wrap` genügt, es braucht keinen `ResizeObserver` wie bei den
Registerlaschen (die brauchen ihn, weil dort nicht umbrochen, sondern
gegen ein Klappfeld getauscht wird).

Angewandt auf die Gegenüberstellung (6 Zeilen → 3 + 3) und die
Schimmerfunde (7 → 4 + 3). Gemessen bei 1799 px: zwei Spalten bei
x = 52 und 488 bzw. 52 und 600, der Block etwa halb so hoch wie zuvor.

**Die Kopfzeile steht in jeder Spalte.** Das ist keine überflüssige
Wiederholung, sondern die Bedingung dafür, dass die zweite Spalte
lesbar ist — anders als ein Wort, das in jeder *Zeile* stünde und in
den Kopf gehört.

#### Registerlaschen: wie in der Albumansicht, und ohne Rundung

Die Laschen der Plattformen sind aus `.register`/`.reg` der
Albumansicht übernommen: 14 px halbfett, 7/14 Polsterung, 4 px Abstand,
die Gruppe auf einer Haarlinie, der aktive hell mit Akzentlinie
darunter. Nur die Farben sind die des Analyzers — er bringt seine
eigene Palette mit und kennt die CSS-Variablen der Bühne nicht.

**`border-radius:0` ist dabei Pflicht, nicht Kosmetik.** Der Analyzer
hat eine globale Knopfregel mit 8 px Radius, und die rundet auch den
2 px starken Unterstrich an beiden Enden. Fünf Laschen nebeneinander
ergaben damit eine Reihe kleiner Bögen — „eine Art geschweifte
Klammer" (Caspar_D). In der Albumansicht tritt das nicht auf, weil dort die
Hausregel `button{border:none}` gilt und die Rundung nur an `.knopf`
und `select` hängt.

#### Helle Flächen auf dunklem Grund brauchen eine Kontur

Caspar_Ds Regel, mit Verweis auf Tufte. Ohne Kontur blüht eine helle Fläche
aus — das Auge zieht sie über ihren Rand hinaus, und zwei benachbarte
Marken verschmelzen optisch. Betroffen sind die Balken und Lollis der
Befundspur und die Ampelpunkte.

**Beim Lolli entsteht der Ring aus zwei Strichen:** erst ein dunkler
Punkt von 8 Einheiten, darauf der farbige von 6. Ein `<path>` ist
selbst schon ein Strich und kann keinen zweiten tragen — anders als ein
`<rect>`, das `fill` und `stroke` zugleich hat.

#### Wiederkehrende Worte gehören in den Spaltenkopf

Die Schimmerfunde standen als Sätze da: „874 Hz steht 15.3 dB **über
der Nachbarschaft**, in 37% **des Songs**" — siebenmal dieselben Worte
um verschiedene Zahlen herum. Jetzt eine Tabelle mit einer Kopfzeile:

```
ZEIT        FREQUENZ   ÜBER NACHBARN   ANTEIL   LAGE · RAT
2:59–3:03     593 Hz         17.0 dB     47 %   Gesang/Instrumental · −2 bis −3 dB
```

Zahlen rechtsbündig in Tabellenziffern, damit die Größenordnungen
untereinander stehen.

#### Kein Leerraum zwischen Bezeichnung und Wert

Caspar_Ds Einwand: „bitte negativ space vermeiden, es sind riesige
abstände zwischen Parameter bezeichnung und wert."

Zwei Ursachen, und die zweite war die eigentliche:

**Die mittlere Spalte stand auf `1fr`** und zog sich über die volle
Breite. Jetzt sind alle Spalten `auto` mit `justify-content:start` —
die Tabelle ist so breit wie ihr Inhalt (gemessen 84 / 66 / 64 / 145
px), der freie Platz bleibt rechts als Block stehen.

**Der lange Text stand in jeder Zeile.** „regelt in beide Richtungen,
hebt mit Begrenzer an" ist eine Eigenschaft der **Plattform**, nicht
des Parameters — er hat die Spalte für alle sechs Zeilen breit gezogen.
Jetzt steht er einmal über der Tabelle.

Dasselbe bei den Textbefunden: `.was` hatte `flex:1` und drückte den
Tipp an den rechten Rand. Mit `flex:0 1 auto` und `margin-right:auto`
am Tipp folgt er dem Text — Lücke von der halben Zeilenbreite auf 10 px.

**Regel daraus:** Bevor man an den Spaltenmaßen dreht, nachsehen, ob
ein Text überhaupt in die Zeile gehört. Was für alle Zeilen gilt,
gehört über die Tabelle.

#### Befunde sind Strecken, keine Zahlen

Caspar_Ds Einwand: „spitzen sind doch aber auch lokal, es geht doch darum,
ob es ganze ranges, wo meinetwegen alle 2 Sek eine Überspitze
auftritt". Genau das ging vorher verloren — ein Stück mit zwei
Ausreißern am Anfang und am Ende meldete denselben True Peak wie eines,
das durchgehend überschreitet.

Dafür liefert `analyzer-worker.js` seit dem 18.08.2026 **drei Verläufe
statt drei Zahlen**:

| Reihe | Schritt | Inhalt |
|---|---|---|
| `spitzeVerlauf` | 100 ms | größter True Peak des Fensters in dBTP |
| `clipVerlauf` | 100 ms | Zahl der Vollausschläge im Fenster |
| `korrVerlauf` | 400 ms | Phasenkorrelation, NaN in stillen Fenstern |

**Die Schwelle steckt nicht im Rechenkern.** Sie hängt an der Plattform,
und die wechselt man in der Lasche, ohne dass neu gerechnet wird. Der
Kern liefert den Verlauf, die Oberfläche bildet daraus die Strecken —
benachbarte Funde werden zusammengefasst (3 s Lücke bei Spitzen, 2 s
bei Clipping und Phase), und die Beschriftung nennt die **Dichte**:
„4:32–4:49: 14 Überschreitungen, etwa alle 1,2 s".

**Einzelfunde bekommen einen Lolli**, keinen Balken (Caspar_D). Ein
einzelnes Ereignis hat keine Ausdehnung; ein Balken von 0,1 s wäre
entweder unsichtbar oder gelogen. Unter einem halben Prozent Breite
schaltet die Spur auf Stiel und Kopf um. Mindestmaße gibt es keine mehr
— ein einzelner Vollausschlag ist genau die Stelle, die man hören will.

#### Die Abschnitte kommen aus dem Karaoketext, nicht aus der Erkennung

Zuerst lag die Strukturerkennung des Analyzers als farbiger Untergrund
in den Bahnen. Caspar_Ds Einwand (18.08.2026): „die dunkelfarbigen Blöcke
sind Ergebnisse des Analyzers, es ist nicht mal klar, ob die
hundertprozentig stimmen, deswegen würde ich sie dort nicht abbilden."

Stattdessen eine **eigene Bahn aus den Wort-Zeitmarken** — die stammen
vom Urheber, nicht von einer Schätzung.

**Die Farben sind die des Suno-Editors:**

| Abschnitt | Farbe | |
|---|---|---|
| Refrain | orange | `#f97b14` |
| Strophe | magenta | `#e31c79` |
| Bridge · Break | gelb | `#d8d81c` |
| alles übrige | grün | `#16be5c` |

Dass es nicht die Ampelfarben sind, ist hier ein Glücksfall: Die
bedeuten Schweregrad, und ein Refrain ist kein Befund.

**Woher sie stammen:** Sie sind nirgends dokumentiert und im
Stylesheet nicht als benannte Regel zu finden — der Editor setzt sie im
Skript, und er ist Pro. Zwei Websuchen und das Durchsuchen der
geladenen Regeln auf suno.com brachten nichts. Abgelesen sind sie aus
einem Bildschirmfoto des Editors (Caspar_D, 18.08.2026).

**Benachbarte Abschnitte gleicher Farbe werden abwechselnd etwas
heller** — auch das macht Suno so. Ohne es verschmelzen zwei Strophen
oder zwei grüne Abschnitte hintereinander zu einem Block, und die
Grenze zwischen ihnen ist verloren; der Spalt allein reicht bei
gleicher Farbe nicht.

Gemischt wird mit **Weiß**, nicht über die Deckkraft: Eine geringere
Deckkraft ließe den schwarzen Grund durchscheinen und machte den Block
stumpf statt hell.

Gemessen an „Noch lachst Du" greift es an drei Stellen — Verse 1 → 2
(`#e31c79` → `#e94e96`), Bridge → Break (`#d8d81c` → `#e1e14e`), Outro
→ Pause (`#16be5c` → `#49cc80`). Nicht benachbarte behalten den
Grundton.

**Blau ist, was zu keinem Abschnitt gehört** — vorn und hinten:

| | |
|---|---|
| **Pre-Intro** | Die Marke `[Intro]` steht beim ersten gesungenen **Wort**. Davor liegt Musik — gemessen 4,6 s bei „Noch lachst Du". |
| **Post-End** | Nach dem letzten Wort läuft das Stück weiter — dort 18 s. |

Caspar_Ds Vorgabe: „man muß die ganze Länge sehen, sonst macht das keinen
Sinn." Ein erster Anlauf zog stattdessen den ersten Abschnitt auf null.
Das ist bequemer, behauptet aber, die Vormusik sei Teil des Intros —
und verschweigt, dass dort gar keine Marke steht.

Im Editor bedeutet Blau etwas anderes: dort ist es der **ausgewählte**
Block (als einziger mit weißer Kontur, die Werkzeuge daneben). Auswahl
gibt es in der Befundspur nicht, die Farbe war also frei.

#### Die Palette des Analyzers folgt den Segmentfarben

Caspar_Ds Wunsch (18.08.2026): „kannst du die Farbstimmung des Editors an
den Segmentfarben orientieren, die gefallen mir eigentlich ganz gut."
Damit trägt der ganze Analysemodus dieselben fünf Töne wie die
Abschnittsbahn.

| | |
|---|---|
| **Blau `#4b93f0`** | der durchgehende Akzent — Titel, anklickbare Zeiten, Laschenlinie, Momentanlautheit. **Ein** Blau, nicht drei: Vorher standen `#7ab8f5` und `#5aa9e6` nebeneinander, 39 Stellen zusammen. |
| **Ampel** | grün `#16be5c` · gelb `#d8d81c` · magenta `#e31c79` |
| **Linienspuren** | Signalenergie orange · Crest grün · Impulsdichte magenta · Tempo helles Orange · Klangtonalität gelb · Entropie helles Magenta · Klangrauheit blau · Frequenzgewicht orange/blau · Obertonreichtum helles Grün |

**Magenta für den Fehlerfall**, nicht Rot: In der Palette gibt es kein
Rot, und Magenta ist der einzige Ton, der alarmiert — dazu vom Orange
der Refrains unterscheidbar. Ein erfundenes Rot hätte die Stimmung
wieder aufgebrochen.

**Zwei Farbreihen bleiben, wie sie sind:** die Horizontrampe der
Kaskade (beige bis rot, Caspar_Ds eigene Wahl) und Viridis im gestapelten
Diagramm. Beide kodieren eine *Ordnung* und dürfen deshalb nicht aus
einer Palette stammen, die *Arten* unterscheidet.

#### Sunos Hüllkurve deckt die Katalogdauer ab, nicht die Datei

Sie wurde zunächst über die volle Breite verteilt — das unterstellt,
sie decke die analysierte Dauer ab. Sie deckt aber die **Katalogdauer**
ab. Weichen die beiden voneinander ab, ist die Kurve gestreckt und
beginnt nicht dort, wo die Befunde darunter liegen; aufgefallen an
einem Song mit 399,9 s Datei.

Abgebildet wird sie deshalb über die **Zeit**:
`x = i/(n−1) · Katalogdauer / Dauer`. Reicht sie nicht bis zum Ende,
endet sie eben früher — das ist ehrlicher, als sie zu dehnen.

**Gegenprobe, dass die Zeitbasen sonst stimmen:** Sunos Hüllkurve gegen
die eigene Energiereihe geschoben ergibt als besten Versatz **−0,20 s**
— genau einen Rasterschritt, also keine Verschiebung.

**Pre-Chorus ist bei Suno grün, nicht orange.** Hochgestuft wird nur
der Refrain selbst, seine Vorbereitung zählt zum Rest. Im Muster muss
er deshalb **vor** dem Refrain geprüft werden, sonst fängt ihn dessen
Ausdruck ab.

Gemessen an „Noch lachst Du": 14 Abschnitte, benannt Intro · Verse 1–4 ·
Chorus · Interlude · Half-Chorus · Bridge · Final Chorus · Outro ·
Pause · Break.

**Das Format der Zeitmarken ist ein Array, kein Objekt** — und die
Abschnittsmarke steht **im** Text, nicht als eigenes Wort:

```js
[4.628, 12.686, "[Intro]\nAn "]     // [Anfang, Ende, Text]
```

Gesucht wird deshalb die eckige Klammer irgendwo im Text, nicht ein
Wort, das nur aus ihr besteht. Der erste Anlauf suchte nach
`w.text === '[…]'` und fand nichts.

**Der vierte Fund derselben Lücke:** Die Zeitmarken stehen in
`_katalogDaten`, nicht in `currentMeta` — Letzteres füllt nur
`analyze()`, also der Weg über die Suno-Songseite. Wer im Analyzer
etwas vermisst, sollte zuerst prüfen, ob es nur im Suno-Weg gesetzt
wird.

**Kürzel statt Namen**, damit auch schmale Blöcke etwas sagen:

| | | | |
|---|---|---|---|
| **I** Intro | **V** Verse / Strophe | **C** Chorus / Refrain | **Bk** Break |
| **B** Bridge | **H** Hook | **E** Ende | |

Eine Nummer wird mitgenommen, wo es eine gibt — aus „Verse 2" wird
**V2**. Unbekanntes wird auf **zwei** Buchstaben gekürzt, nicht auf
einen: „Interlude" wäre sonst ein zweites I neben dem Intro. Der volle
Name bleibt im Tooltip. Erst unter anderthalb Prozent der Länge bleibt
ein Block stumm.

**Sunos Hüllkurve liegt in der Bahn**, um die Mitte gespiegelt — so
zeigt es Suno im Editor selbst. Sie steckt seit jeher im Katalog
(`welle`, rund 1700 Werte) und wurde nirgends benutzt.

Gezeichnet wird sie **schwarz mit Teildeckung, nicht grau**. Grau legt
eine fremde Farbe über die Abschnitte und nimmt ihnen die Kennung;
Schwarz dunkelt, jeder Abschnitt behält seinen Ton und die Kurve
erscheint als dunklere Fassung desselben. Die Beschriftung liegt
darüber — sie ist HTML.

**Abgerundete Ecken mit schmalem Spalt.** Zuerst lagen die Blöcke Kante
an Kante und überlappten um zwei Einheiten, damit keine Naht blieb —
dann war aber auch die Grenze nicht mehr zu sehen. Ein ausdrücklicher
Spalt löst beides: Die Grenze ist sichtbar, und eine Naht kann gar
nicht entstehen, weil sich nichts berührt.

**Zwei Feinheiten, die beim Hinsehen auffielen:**

Eine Bahn mit eigenen Blockbeschriftungen bekommt **keinen Bahnnamen** —
er säße über dem ersten Block und deckte ihn zu.

Die Namen stehen **linksbündig mit Auslassungspunkten**, nicht mittig.
Mittig abgeschnitten zeigt ein schmaler Block seine Wortmitte: aus
„Verse 2" wird „erse", aus „Interlude" wird „terlu". Unter vier Prozent
der Länge bleibt der Block stumm und sagt es im Tooltip.

#### Zwei Panels standen nie auf der gemeinsamen Achse

Beim Ausrichten der Befundspur fielen zwei weitere auf, die es seit
jeher nicht taten — gemessen 29/496 gegen 41/472 bei allen Spuren:

**Die Wellenform** liegt im Bedienblock und hat keinen
`.section`-Rahmen, also auch nicht dessen 12 px Polsterung. Behoben mit
`margin:0 12px`.

**Die Stimmanalyse** hat einen `.section`-Rahmen, aber ein inline
gesetztes `padding:6px 0` hob die waagerechte Polsterung wieder auf;
die Beschriftung glich es mit eigenen 12 px aus, die Zeichenfläche
nicht. Jetzt `padding:6px 12px` und die Ausnahme an der Beschriftung
entfällt.

#### Im Zweifel SVG, und immer dieselbe Achse

**Regel, aus einem Fehlversuch gelernt:** Ein Diagramm auf der
Zeitachse wird als **SVG in `0..SPUR_W`** gebaut und in denselben
`.section`-Rahmen mit `.chart-outer` gesetzt wie jede andere Spur.
Nicht als HTML mit Prozentwerten.

Der erste Anlauf der Befundspur war HTML — mit einer 110-px-Spalte für
die Bahnnamen. Zwei Fehler auf einmal (Caspar_D: „dein plot ist nicht mit
der zeitleiste aligniert, das geht so nicht, auch muß immer ein
playhead mitlaufen"):

| | |
|---|---|
| **Die Namensspalte verschob die Zeitachse.** | Gemessen 52/1197 gegen 64/1173 bei allen anderen — dieselbe Stelle im Song lag an zwei verschiedenen Orten auf dem Schirm. |
| **Prozentwerte können den Zoom nicht mitmachen.** | Die Spuren zoomen über ein `viewBox`-Attribut, nicht durch Neuzeichnen. Eine HTML-Spur bliebe beim vollen Song stehen, während alles andere hineinzoomt. |
| **Kein Spielkopf.** | Ohne ihn sieht man den Befund, weiß aber nicht, wo man gerade ist. |

Behoben, und danach gemessen: Befundspur, Momentanspur und Kaskade
alle auf **64/1173**, der Spielkopf auf **450 px** in beiden, und bei
achtfachem Zoom dieselbe Sicht (`2210.3 0 187.5`) — nur die Höhe
unterscheidet sich.

Drei Kleinigkeiten, die dabei nötig waren:

**Die Höhe wechselt** mit der Zahl der Bahnen, deshalb trägt das SVG
sie als `data-h` bei sich; `spurSichtSetzen()` liest sie von dort statt
aus einer festen Tabelle.

**Die Bahnnamen liegen als HTML-Schicht über dem SVG**, nicht darin. In
einem `viewBox` mit `preserveAspectRatio="none"` würde Text
mitgestreckt. Sie zoomen auch nicht mit — sie beschriften die Bahn,
nicht die Zeit.

**Der Lollikopf ist eine Strecke der Länge null** mit runder Kappe und
`vector-effect="non-scaling-stroke"`. Dadurch bleibt er rund und gleich
groß, egal wie stark die Sicht gestreckt ist. Ein `<circle>` wäre zur
Ellipse gezerrt — dieselbe Falle, aus der auch
`non-scaling-stroke` bei den Linien stammt.

**Ein Fallstrick beim Bauen:** Die Dauer darf **nicht** aus
`_chartData.dur` kommen — die wird erst mit der Hüllkurven-Nachricht
gesetzt, und die Normnachricht ist früher da. Die Spur blieb dadurch
leer, obwohl Funde vorlagen. Genommen wird jetzt die Länge der Reihen
mal ihrem Schritt.

### Grenzfrequenz, Schimmer, Zielpegel

**Obere Grenzfrequenz** (Karte): wo das Spektrum abbricht, gemessen
gegen den Bezugspegel zwischen 200 Hz und 2 kHz, Schwelle 50 dB
darunter.

**Ein Befund gleich beim ersten Messen:** „Noch lachst Du" endet bei
**18,0 kHz — als MP3 *und* als WAV.** Der Abbruch stammt also nicht vom
Kodierer, sondern steckt bereits in Sunos Original. Ob das für alle
Songs gilt, wird der Durchlauf über das ganze Archiv zeigen.

**Schimmer** (Befund): dauerhafte schmale Frequenzspitzen — stehende
Pfeiftöne, metallische Resonanzen, typische Erzeugungsartefakte. Der
Kern des Verfahrens stammt aus dem CB Audio Analyzer und ist der
**Nachbarschaftsmedian unter Ausschluss der Spitze selbst**: Ohne das
höbe eine kräftige Spitze ihren eigenen Bezugswert mit an.

Sein Programm hört live mit und muss raten, ob eine Spitze bleibt; es
behilft sich mit gleitendem Mittel und einem Zähler. Wir haben die
ganze Datei und rechnen es genau: **Anteil der Rahmen**, in denen das
Band heraussticht, und das **längste zusammenhängende Zeitfenster**.
Gefordert werden 25 % des Songs — eine gehaltene Gesangsnote fällt
damit heraus, ein Pfeifton nicht.

**Zielpegel** (Befund): Streaming, Spotify, YouTube, Club, Rundfunk.
Der Kniff ist nicht die Tabelle, sondern der Abgleich zweier Größen:

```
Sollverstärkung = Ziel-LUFS − gemessene Lautheit
Spitzenreserve  = Ziel-Spitze − gemessener True Peak
```

Ist die Sollverstärkung positiv und größer als die Reserve, dann ist
der Song **zu leise und lässt sich trotzdem nicht lauter machen** — die
eine Diagnose, die man selbst nicht stellt, weil man auf die Lautheit
schaut und die Spitze vergisst.

Gemessen an „Noch lachst Du", und es zeigt genau, wozu die getrennte
Messung gut ist:

| | WAV | MP3 |
|---|---|---|
| Lautheit | −13,9 LUFS | −12,8 LUFS |
| True Peak | −3,4 dBTP | −0,9 dBTP |
| **Urteil** | **„Passt für Streaming."** | **„über dem Ziel — beim Kodieren droht Zerren."** |

### Lautheit nach Norm

Am 18.08.2026 dazugekommen, nachgebaut aus **ITU-R BS.1770-4**, **EBU
R128** und **EBU Tech 3342**:

| Karte | |
|---|---|
| **Lautheit LUFS** | integriert, mit K-Bewertung und beiden Toren |
| **Schwankung LU** | Loudness Range: 3-s-Fenster, 95. minus 10. Perzentil |
| **True Peak dBTP** | Scheitel *zwischen* den Abtastwerten, vierfach überabgetastet |
| **Reserve PLR** | True Peak minus Lautheit — wie viel Luft nach oben bleibt |
| Clipping · Gleichspannung · Phasenkorrelation · Ende | Fehlersuche |

**Warum das nötig war:** Was der Analyzer bisher „Lautheit dB" nannte,
ist der nackte Effektivwert — keine Gehörbewertung, keine Blöcke, keine
Tore. An „Noch lachst Du" gemessen: **−15,7 dB Effektivwert gegen −13,9
LUFS.** Fast zwei Dezibel, und jede Aussage über Zielpegel wäre damit
falsch gewesen.

Die **Schwankungsbreite** ist zusätzlich das ehrlichere Dynamikmaß: Der
vorhandene Crestfaktor misst, wie spitz das Signal ist, und ein einziger
Knall verdirbt ihn. Die Schwankungsbreite misst, wie stark die
**Lautheit über den Song** schwankt. Beide bleiben stehen, sie
beantworten verschiedene Fragen.

**Die Phasenlage wird über die Zeit gezählt**, nicht global gemittelt:
Anteil der klingenden Fenster mit negativer Korrelation. Eine örtliche
Auslöschung von zehn Sekunden verschwindet in einem Gesamtmittel
spurlos. Der Gedanke stammt aus dem CB Audio Analyzer.

#### Die Selbstprüfung

`node bin/pruefe-lautheit.js` prüft den Rechenkern gegen selbst
erzeugte Normsignale — **vierzehn Prüfungen, alle bestanden**:
Frequenzgang der K-Bewertung an vier Stellen, die Absolutkalibrierung
aus EBU Tech 3341 (Sinus mit Scheitel −23 dBFS ergibt −22,99 LUFS),
beide Tore, die Schwankungsbreite und der Spitzenwert zwischen den
Abtastwerten.

Das ist dasselbe Vorgehen wie in `bin/farben.js`, das beim Start
abbricht, wenn Weiß in OKLab nicht a=0, b=0 ergibt. **Der Grund ist
derselbe:** Ein LUFS-Wert sieht immer vernünftig aus, auch wenn Filter,
Blöcke oder Tore falsch sind — genau wie die Buntheitswerte nach dem
verrutschten Komma plausibel aussahen.

Zwei Fallen hat die Probe schon gefangen, beide bei mir:
Die K-Bewertung ist bei 100 Hz **nicht** flach, sondern liegt bei
−1,17 dB — der 38-Hz-Hochpass steigt mit Q ≈ 0,5 sehr sanft an. Und der
Pegel in den EBU-Testsignalen ist der **Scheitelwert**, nicht der
Effektivwert; wer ihn als Effektivwert liest, landet drei Dezibel
daneben und hält die eigene Umsetzung für kaputt.

#### Was der Vergleich MP3 gegen WAV zeigt

Dieselbe Datei, „Noch lachst Du", beide Fassungen gemessen:

| | WAV | MP3 | Unterschied |
|---|---|---|---|
| Lautheit | −13,9 LUFS | −12,8 LUFS | +1,1 dB |
| **True Peak** | **−3,4 dBTP** | **−0,9 dBTP** | **+2,5 dB** |
| Schwankung | 5,8 LU | 6,1 LU | +0,3 LU |

**Die Kodierung hebt den Spitzenwert um zweieinhalb Dezibel** — aus
bequemen −3,4 dBTP wird −0,9, also hart an der Grenze von −1 dBTP, die
für Streaming gilt. Genau dafür ist die Messung da, und genau deshalb
werden MP3 und WAV getrennt gerechnet statt einmal für beide.

#### Der Rechenkern liegt jetzt daneben

`web/fremd/analyzer-worker.js` — 38 KB, vorher eine Zeichenkette im
Modul. Der Browser lädt ihn als Worker, Node führt ihn unverändert aus.
**Nur so lässt sich prüfen, ob die Norm eingehalten wird**, und nur so
rechnet die geplante Datenbank später dasselbe wie der Schirm.

### Was stillgelegt ist

Stem-Trennung und Instrumenterkennung (beide Fassungen, die
regelbasierte und die über Essentia/ONNX). In der Bühne sind sie nicht
sinnvoll — die eine dauert Minuten und braucht einen zweiten Server,
die andere lädt Modelle aus dem Netz.

**Stillgelegt heißt nicht gelöscht:** Das Markup bleibt stehen und wird
über eine Handvoll CSS-Regeln ausgeblendet, die Aufrufe hängen an
`aufbauen(…, {essentia:true, demucs:true})`. So greift keine Funktion
ins Leere, und das Wiedereinschalten ist ein Wort.

### Netzfreiheit: drei Wege, nicht einer

Gemessen im Analysemodus: **null Fremdanfragen.** Dafür mussten drei
Wege nach draußen abgeschaltet werden — die beiden
`checkDemucsServer()` in den Analysewegen, ein `detectDemucsURL()`
beim Aufbau und ein `setTimeout` eine Sekunde danach. Die ersten
beiden zu schließen genügte nicht; erst die Liste der tatsächlich
gestellten Anfragen zeigte die übrigen.

**Lehre:** „Wir rufen es nicht mehr auf" ist keine Abnahme. Die Abnahme
ist die Liste der Anfragen, die der Browser wirklich stellt.

Die Adressen stehen weiterhin im Quelltext: `analyze()` und
`fetchMeta()` werden für die fremden Songs noch gebraucht, die nicht
im Archiv liegen. Angesteuert wird keine davon.

### Er liegt als Modul unter `web/fremd/analyzer.js`

**Das Original liegt im frueheren Projekt `…/SunoAnalyzer/suno_analyzer.html`.**
Am 18.08.2026 wurde daraus das Modul erzeugt; ab da wird es von Hand
gepflegt. Der Ort ist Bedingung, nicht Bequemlichkeit: Der Server
liefert statische Dateien ausschließlich aus `web/` aus, und nur bei
**gleichem Ursprung** ist `/media/<id>/audio.wav` abrufbar. Vom
`file://`-Ursprung aus blockt der Browser (CORS), und vom iPhone wäre
die Datei ohnehin unerreichbar.

`web/analyzer.html` ist seitdem nur noch **Wirtsseite**, 1,2 KB: ein
leerer Behälter, das Modul, ein Aufruf. Sie ist der Prüfstand, solange
die Bühne den Analyzer noch nicht führt, und entfällt danach.

#### Drei Eingriffe waren beim Umzug nötig

**Das CSS musste eingehegt werden.** Neun der 39 Regeln sprachen
allgemeine Bezeichner an — `body`, `*`, `button`, `canvas`,
`input`, `label`. In der Bühne hätten sie alles umgefärbt; besonders
`button` steht dort quer zur Hausregel
`button{background:none;border:none}`. Jede Regel trägt jetzt
`.sunoanalyzer` vor sich, `@keyframes` blieben unangetastet.
**Derselbe Fall wie einst die doppelt vergebene Klasse `marke`.**

**Das Skript liegt in einer Funktion**, nicht im globalen Raum. Es
bringt rund 300 Namen mit, und `song`, `player` und `audio` sind in
`index.html` bereits vergeben. Weil die Inline-Handler des Markups
trotzdem globale Namen brauchen, gibt es die Brücke `__SA` — sie
schrumpft auf null, sobald Kopfbereich, Kommentar-Generator und
eigener Player entfallen.

**`requestAnimationFrame` ist überschattet.** Innerhalb der Funktion
steht eine gleichnamige eigene Fassung, die jede vergebene Kennung
merkt. Der Analyzer ruft weiterhin schlicht
`requestAnimationFrame(...)` auf und merkt von der Umleitung nichts —
aber `abraeumen()` kann damit **alle** seine Zeichenschleifen auf
einmal anhalten, ohne eine einzige Zeile des Originals anzufassen.
Ohne das liefen sie nach einem Moduswechsel weiter, genau wie es bei
Butterchurn und audioMotion schon einmal passiert ist; hier käme
zusätzlich ein Worker dazu, der weiterrechnet.

#### Die Schnittstelle

```js
SunoAnalyzer.aufbauen(flaeche, { zeit, laeuft, sprung })
SunoAnalyzer.song({ …Felder aus /api/song/<id>…, tonUrl, bild })
SunoAnalyzer.analysiere(adresse, titel, bild)   // Fremdes ohne Katalogeintrag
SunoAnalyzer.abraeumen()
```

**Drei Auskünfte, nicht eine.** Naheliegend wäre allein `zeit()`
gewesen. Es genügt nicht: Zwei Schleifen des Analyzers ruhen, solange
seine eigene Wiedergabe pausiert — mit fremder Uhr hätten sie für immer
geruht. Deshalb `laeuft()`. Und `sprung(t)` ist der Rückkanal: Ein
Klick in die Wellenform spult nicht selbst, sondern **meldet die
Zielzeit nach außen**. Der Analyzer bleibt damit Anzeige, auch wo er
bedienbar ist.

Alle drei haben Rückfälle auf den eigenen Player. Ohne Angabe verhält
sich das Modul wie vorher — das hält die Wirtsseite als Prüfstand am
Leben.

`song()` erwartet die Felder von `/api/song/<id>` und zusätzlich
`tonUrl` und `bild`: **Welche Tonspur und welches Bild, weiß der
Aufrufer, nicht der Analyzer.** Der Stilprompt wird an den Kommas in
Marken geteilt; der Ausschlussprompt (`stilAusschluss`) kommt
durchgestrichen mit, weil „was nicht drin sein soll" beim Hören
dieselbe Auskunft wert ist.

Gemessen am 18.08.2026 mit einer gestellten Uhr: 16 Spielköpfe im
Gleichschritt, 320 s von 334 s ergeben 802 von 837 px, Zeitanzeige und
Struktur-Cursor folgen, der Klick meldet 167 s bei erwarteten 167 s
zurück, und bei achtfachem Zoom hält der wandernde Ausschnitt den
Spielkopf mittig.

#### Zwei Fehler, die dabei ans Licht kamen

**`songDuration` wurde auf dem Dateiweg nie gesetzt.** Das tat im
Original nur `analyze()`, der Weg über die Suno-Songseite;
`analyzeFile()` setzte allein die *Anzeige* der Dauer. Auf genau dem
Weg, den KlangTresor benutzt, waren damit **alle Spielköpfe und der Zoom
tot** — beide brechen bei `songDuration === 0` sofort ab. Aufgefallen
ist es erst, als der Spielkopf an einer fremden Uhr hängen sollte;
abgespielt hatte auf diesem Weg nie jemand. Gesetzt wird es jetzt in
`startWorkerAnalysis()`, durch das beide Wege kommen.

**Die Handler-Brücke war unvollständig.** Umgeschrieben wurden nur
`onclick`, `onchange`, `oninput` und `onload` — `onmousedown` und
`ontouchstart` nicht, und daran hängt der Sprung. **Lehre:** Die
Ereignisliste gehört aus dem Markup gelesen, nicht aus dem Gedächtnis.

#### Ein Fallstrick beim Laden

Der Server schickt `.js` mit `max-age=31536000` — ein Jahr. Für
Butterchurn und audioMotion ist das richtig, die ändern sich nie. Für
ein Modul in Arbeit heißt es: Man sieht seine eigene Änderung nicht.
Die Wirtsseite hängt deshalb eine Kennung an die Adresse. Bevor
`index.html` das Modul lädt, ist dasselbe dort zu entscheiden.

#### Kennungen kollidieren fast nicht

Gezählt am 18.08.2026: **147 Kennungen** im Analyzer gegen **75** in der
Bühne — und genau **eine** Überschneidung, `player`. Sie verschwindet
mit dem eigenen Player des Analyzers von selbst. Das Markup ist danach
ohne eine einzige Umbenennung einbettbar.

### Was am Analyzer geändert wurde

Er kannte nur zwei Einstiege: `analyze()` (UUID aus dem Eingabefeld →
Metadaten von der suno.com-Songseite → Ton vom CDN) und
`analyzeFile()` (Datei aus dem Dateidialog). Beide enden in denselben
drei Zeilen — `startWorkerAnalysis(buf)`, `runEssentia(buf)`,
`checkDemucsServer()`.

Dazugekommen ist ein dritter Einstieg:

```
analyzer.html?audio=/media/<id>/audio.wav&titel=<Titel>&bild=/media/<id>/cover.jpg
```

`analyzeUrl(src, titel, bild)` holt den Ton, verpackt ihn als
`File`-Objekt und reicht ihn an **`analyzeFile()` weiter**. Der Umweg
ist Absicht: Dort steckt bereits das vollständige Aufräumen des
vorherigen Laufs, die Anzeige und der Aufruf der Analyse. Ein eigener
Pfad hätte rund 40 Zeilen verdoppelt, die bei der nächsten Änderung
auseinandergelaufen wären.

Zwei Kleinigkeiten mussten mit:

**Der Song wird benannt.** `analyzeFile()` schreibt einen Namen in
`#song-title` und `#song-sub` — **beide Elemente gibt es in dieser
Fassung nicht**, der Aufruf verpufft also. Deshalb füllt `analyzeUrl()`
den Kopfbereich, den sonst `analyze()` benutzt: `#title`,
`#meta-sub` und `#artwork`. Ohne das stünde dort eine namenlose
Analyse.

**Das Eingabefeld wird geleert.** Dort steht als Voreinstellung eine
**fremde** Suno-Adresse, und die liest sich, als gehörte die Analyse zu
ihr. Der Weg über suno.com bleibt daneben benutzbar; der Platzhalter
sagt es an.

### Welcher Ton mitgeht

Dieselbe Regel wie in `tonSetzen()`: Steht die Bühne auf WAV **und**
liegt eines vor, geht das WAV mit, sonst das MP3. Fürs Spektrogramm ist
das WAV die ehrlichere Quelle — MP3 schneidet oben ab —, aber die Wahl
gehört dem Hörer und nicht der Bühne.

Zu bedenken: Der Analyzer lädt die Datei **vollständig** in den
Speicher, bevor er rechnet. Bei einem 60-MB-WAV über WLAN dauert das
entsprechend. Sein eigener Weg über das CDN tut allerdings dasselbe.

### Fremde Songs bekommen keinen Knopf

Die 117 Playlist-Einträge fremder Urheber liegen nicht im Archiv, es
gäbe also nichts zu öffnen. Statt eines toten Knopfes erscheint gar
keiner; `analyzerAuf()` bricht zusätzlich selbst ab. Denkbar wäre,
ihnen die CDN-Adresse mitzugeben — dann analysierte man aber übers Netz
und nicht aus dem Archiv.

### `.wav` fehlte in der Typtabelle des Servers

Aufgefallen bei diesem Einbau: `server/server.js` kannte `.wav` nicht
und lieferte es als `application/octet-stream` aus — **dieselbe Lücke,
die es einmal bei `.webp` gab.** Für das `<audio>`-Element mit
direkter Adresse ging das gut, weil der Browser hineinsieht; über einen
Blob mit diesem Typ spielt es nicht zuverlässig. Eingetragen ist jetzt
`audio/wav`. Der Analyzer leitet den Typ zusätzlich aus der Endung ab,
falls er einmal an einem anderen Server hängt.

### Er ist nicht netzfrei

Anders als KlangTresor: Der Analyzer holt `onnxruntime-web` von jsdelivr und
die Essentia-Modelle von `caspardavi.github.io`; die Stem-Trennung
verlangt den DemucsServer auf Port 5001. Ohne Netz fällt die
Instrumenterkennung aus — abschaltbar über `#essentia-toggle` —, alles
übrige rechnet er selbst. Beides lokal zu legen wäre der Weg von
`web/fremd/`, steht aber im Backlog.

### Gemessen am 18.08.2026

An „Noch lachst Du" (5:34), beide Tonquellen:

| | MP3 | WAV |
|---|---|---|
| BPM | 117 | 116 |
| Lautheit | −14,7 LUFS | −15,7 LUFS |
| Dynamik | 13,6 dB | 13,6 dB |
| Tonart | F Dur, mixolydisch | dieselbe |
| Struktur | 8 Abschnitte | dieselbe |

Der Lautheitsunterschied ist echt und erwartbar: Die MP3-Kodierung hebt
den gemessenen Pegel leicht an. Instrumenterkennung: Bass, Gesang,
Drums/Percussion, Gitarre.

---

## Das Pult fährt als Schublade ein

Bei **Karaoke** und **aus** liegt die Fläche frei; die Bedienelemente
(`#bpult`) fahren erst ein, wenn der Zeiger in die unteren 16 % kommt,
und wieder aus, wenn er sie verlässt — mit 450 ms Nachlauf, damit es
nicht flackert, während man auf einen Knopf zielt. Das Karaokeband
weicht dabei um 38 vh nach oben aus, statt sich zu überlagern.

Vorher standen die Bedienelemente dauerhaft im Bild und wurden vom
Verlauf des Karaokebands abgedunkelt. Sie **waren** bedienbar, sahen
aber aus wie abgeschaltet — Caspar_Ds Einwand: „bedienbar, obwohl gedimmt,
ist äußerst unintuitiv". Sichtbar oder ganz weg ist ehrlicher.

Der Grund des Pults ist **einfarbig** `rgba(0,0,0,.86)` — derselbe Wert
wie die dunkelste Stelle des Karaokebands. Bewusst kein Verlauf: Der
ließe die Bedienelemente im oberen Teil wieder halbdurchsichtig
wirken, also genau den Eindruck von „abgeschaltet", der die Schublade
überhaupt nötig gemacht hat.

**So flach wie möglich, in beiden Textzuständen:** alles in eine Reihe
statt untereinander, die Metazeile entfällt, der Titel wird klein und
abgeschnitten. Das Pult ist dadurch rund **100 px** hoch statt 368 —
bei Lyrics steht es in der schmalen linken Spalte und bricht dort um,
bleibt aber ebenso flach.

**Der Fortschrittsbalken fährt mit.** Er liegt außerhalb der Schublade
und bleibt immer sichtbar — wo im Song man gerade ist, will man auch bei
eingefahrener Bedienung sehen. Er sitzt **in beiden Textzuständen** an der Unterkante des Bildschirms,
über die volle Breite, 5 px hoch, und liegt im Stapel über dem Pult. Fährt die Schublade aus, rutscht er um dieselbe
Strecke nach oben (`--pulthoehe`) und bildet dann deren Oberkante —
der Abstand zum Karaokeband bleibt dadurch in beiden Zuständen
gleich (gemessen 21 px).

Bei **Lyrics** bleibt das Pult fest an seinem Platz — dort ist der
Schirm ohnehin geteilt.

**Ohne Zeiger** (iPhone) holt eine Berührung das Pult für vier
Sekunden hervor. `pultVerbergen()` weigert sich, solange der Zeiger
darauf steht oder ein Bedienelement den Fokus hat — sonst rutschte
einem der Regler unter der Hand weg.

**Dafür musste das DOM getrennt werden:** `.blinks` enthielt Bild und
Steuerung gemeinsam; ein Verschieben hätte das Bild mitgenommen. Alles
außer `.bart` liegt jetzt in `.bpult`.

**Ein Fallstrick dabei:** Die frühere Regel
`#buehne:not(.text-lyrics) .blinks > *:not(.bart){position:relative}`
war spezifischer als die Pult-Regel und überschrieb deren
`position:absolute` — die Schublade blieb dadurch im Fluss stehen. Sie
ist entfallen; `.blinks` hat nur noch zwei Kinder, und `.bpult`
positioniert sich selbst.

---

## Fertige Visualizer — die ersten Fremddateien

In `web/fremd/` liegen seit dem 18.08.2026 drei Bibliotheken. Es sind
die **ersten Abhängigkeiten** des Projekts, das bis dahin aus einer
einzigen Datei ohne Fremdcode bestand.

| Datei | Größe | |
|---|---|---|
| `audioMotion-analyzer.js` | 93 KB | 4.5.4, UMD → `window.AudioMotionAnalyzer` |
| `butterchurn.min.js` | 188 KB | 2.6.7 |
| `butterchurnPresetsExtra.min.js` | 824 KB | 2.4.7 |
| `butterchurnPresetsExtra2.min.js` | 595 KB | 2.4.7 |
| `butterchurnPresetsMD1.min.js` | 277 KB | 2.4.7, MilkDrop-1-Ära |

Die drei Preset-Dateien werden in `allePresets()` zusammengeführt und
ergeben **310 Presets**. Die vierte Sammlung des Pakets
(`butterchurnPresets.min.js`, 638 KB) fehlt bewusst: Sie setzt keinen
globalen Namen und wäre nicht erreichbar — sie lud nur mit, ohne etwas
beizutragen.

**Die Namen werden fürs Auswahlfeld gekürzt.** Im Original sind sie im
Mittel 41 Zeichen lang, der längste 136 — damit zöge das Feld die halbe
Bühne breit. `presetKurz()` schneidet das Autorenpräfix ab
(„Rovastar + Geiss - Hurricane Nightmare" → „Hurricane Nightmare") und
kappt bei 38 Zeichen; der volle Name bleibt als Tooltip und als
Kennung erhalten. Zusätzlich deckelt das Stylesheet die Feldbreite auf
`min(240px, 32vw)`.

**Bewusst lokal, nicht vom CDN.** Das Archiv soll ohne Netz laufen —
über ein CDN wäre die Bühne bei abgeschaltetem Internet halb tot.

**Sie bekommen keinen eigenen Zugang zum Ton**, sondern den vorhandenen
Quellknoten aus `analyseStarten()` (`hörer.quelle`). Pro Audioelement
ist genau ein `createMediaElementSource` erlaubt, und den hat die
eigene Analyse längst verbraucht. audioMotion läuft deshalb mit
`connectSpeakers: false` — der Ton geht schon über den eigenen Graphen.

**Abräumen ist Pflicht.** Beide bringen eigene Zeichenschleifen mit;
ohne `fremdVisAbraeumen()` liefen sie nach einem Moduswechsel weiter
und hingen weiter am Ton. Der Aufruf steht in `darstellungAufbauen()`
und in `buehneZu()`.

**Fehlt eine Datei, verschwindet der Eintrag** aus dem Auswahlfeld
(`MODI[].da()`), statt einen toten Modus anzubieten. Schlägt der Aufbau
trotzdem fehl, weicht die Bühne auf „Stereo-Farbfelder" aus.

**Auflösung gedeckelt** wie bei den eigenen Modi: Butterchurn auf 2,2
Millionen Punkte, audioMotion über `loRes: true`. Ungebremst wären es
im Vollbild 6,2 bzw. 11 Millionen Punkte je Bild.

### Butterchurn bricht die Farbregel — mit Absicht

MilkDrop-Presets bringen ihre eigene Farbwelt mit und **ignorieren die
Coverpalette**. Das ist der erste Bruch mit dem Grundsatz „es wird
nichts erfunden", der sonst im ganzen Projekt gilt.

Das ist entschieden und gewollt: Butterchurn ist der Party-Modus, und
genau dafür wurde er geholt. Die eigenen sieben Visualisierungen
bleiben palettentreu.

### Jede Variante ist einzeln wählbar

Das Auswahlfeld führt **41 Einträge in drei Gruppen**:

| Gruppe | Anzahl |
|---|---|
| Eigene Visualisierungen | 7 |
| audioMotion | 5 — Balken · Balken fein · LED-Balken · Gespiegelt · Linienzug |
| Butterchurn (MilkDrop) | 29 Presets |

Die Kennung trägt die Variante hinter einem Doppelpunkt:
`audiomotion:led`, `butterchurn:<Presetname>`. Anfangs stand hinter
jedem Werkzeug nur **eine** Darstellung, obwohl 29 bzw. rund zehn
verfügbar sind.

Von audioMotions Darstellungsarten sind fünf ausgewählt; der Rest sind
Zwischenstufen derselben Idee (Oktavbandbreite von 1/24 bis ganze
Oktave).

Fehlt eine Preset-Angabe — etwa aus einem älteren gespeicherten
Zustand —, entscheidet die **Song-ID**, damit derselbe Song wenigstens
immer gleich aussieht.

---

## Bildebene und Visualisierungsart sind getrennt

Zwei Achsen, zwei Zustände:

| | |
|---|---|
| `bBild` | was die Fläche zeigt: `artwork` · `video` · `vis` |
| `bModus` | **welche** Visualisierung, nur wirksam bei `bBild === 'vis'` |

Vorher steuerte `bModus` beides, mit `artwork` als einem Wert unter acht.
Dadurch war das **Standbild nicht wählbar**, sobald ein Video-Artwork
vorlag — „Artwork" nahm automatisch das Video.

**Video-Artwork haben nur 83 der 321 Songs.** Fehlt es, zeigt die Bühne
für dieses Lied still das Standbild; die Einstellung bleibt stehen und
greift beim nächsten Song, der eines hat. Bewusst ohne Hinweis — eine
Meldung bei 238 von 321 Songs wäre Lärm.

Das Auswahlfeld für die Visualisierungsart erscheint **nur** bei
`bBild === 'vis'`. Sonst stünde dort eine Klappliste, die auf nichts
wirkt.

**Altbestand:** Früher stand `artwork` in `mysuno-modus`. Beim Start wird
das einmal auf `mysuno-bild = artwork` und `mysuno-modus = stereo`
umgeschrieben — mit Zurückschreiben, sonst liefe die Umrechnung bei jedem
Start erneut.

---

## Die sieben Visualisierungen

Umschaltbar über das Auswahlfeld „Darstellung", das nur beim Visualizer
erscheint. Die Wahl wird pro Gerät gemerkt.

| Modus | Was passiert |
|---|---|
| **Stereo-Farbfelder** | fünf Bänder je Kanal, ovale Felder von den Rändern nach innen blutend, dazu ein wanderndes Mittenfeld |
| **Spuren** | Objekte an einer je Objekt aus dem Spektrum gezogenen Frequenz, verblassend |
| **Schwarm** | Boids nach Reynolds (1986), Zielkoordinate alle 3 s neu |
| **Spektrum** | Frequenzbalken im Kreis |
| **Blase** | Kontur von den Bändern verformt |
| **Partikel** | Schläge stoßen Punkte nach außen, dazu ein stetiges Rinnsal |
| **Nebel** | driftende Farbwolken, am sparsamsten |

### Deposit-and-Decay

„Spuren" und „Schwarm" löschen das Bild nicht, sondern legen pro Bild
einen fast durchsichtigen Schleier darüber. Alles Gemalte verblasst
dadurch von selbst — der billigste Weg zu Spuren.

### Spuren im Detail

Jedes Objekt zieht eine **eigene** Frequenz aus dem Spektrum, gewichtet
nach deren Lautstärke und zusätzlich mit **1/i**, damit jede Oktave gleich
viel beiträgt. Ohne diesen Ausgleich landet fast alles in den Höhen, weil
eine Oktave unten aus wenigen, oben aus hunderten Werten besteht.

Ein einzelner Mittelwert je Bild funktioniert hier **nicht** — er liegt
immer an derselben Stelle, alle Objekte lägen übereinander. Das war ein
echter Fehler und ist im Kommentar festgehalten.

Deckkraft bewusst niedrig (0,13): Additive Überlagerung sättigt sonst
binnen Sekunden zu Weiß.

### Schwarm im Detail

Zielkoordinate alle drei Sekunden neu, aus einem Paar, das die
**Klangfarbe** beschreibt statt der Lautstärke: waagerecht die mittlere
Klanghelligkeit, senkrecht der Bassanteil. Dadurch wandert der Schwarm mit
den Abschnitten eines Songs über die Fläche, ohne im Takt zu zappeln.

Jedes Tier hat einen eigenen Versatz in der Tonliste, sonst ist der ganze
Schwarm zu jedem Zeitpunkt einfarbig.

### Stereo-Farbfelder im Detail

Die Felder sitzen **außerhalb** der Fläche und ragen nur herein; ihr
Radius wächst mit der Bandenergie. Sie sind **oval**, weil ein Kreis mit
genug Reichweite auch senkrecht die Nachbarbänder verschlucken würde.

Das Mittenfeld folgt der Seitenlage, überlagert von einer langsamen
Eigenbewegung, deren Tempo am Bass hängt. Seine Farbe ist die des Bandes,
das gerade führt.

**Zu beachten:** Caspar_Ds Mischungen sind energetisch **nahezu mono**
(gemessen: Sub L 0,88 / R 0,86, Mitten 0,60 / 0,60, Seitenlage −0,006).
Die Links-rechts-Trennung gibt optisch daher wenig her. Siehe Backlog.

---

## Bekannte Eigenheiten der Testumgebung

Der ferngesteuerte Browser meldet `visibilityState: hidden`. In verborgenen
Tabs pausiert `requestAnimationFrame` **vollständig** — die Zeichenschleife
läuft dort nicht. Zum Prüfen muss `zeichneVis()` von Hand aufgerufen
werden. Standbilder und Messwerte lassen sich so kontrollieren, die
Bewegung nicht.

---

## Der Analysemodus, aufgeräumt (18.08.2026)

Ziel war Auslieferungsfähigkeit: Ein Empfänger soll nicht durch Reste
scrollen. Gemessen vorher **37 Panels, 4834 px**.

### Abgeklemmt, nicht gelöscht

| | warum |
|---|---|
| **Neun alte Canvas-Kurven** | Die SVG-Spuren zeigen dasselbe. Ausgeblendet war bisher nur die Zeichenfläche — ihre Überschrift stand weiter da: neun Streifen à 47 px, zusammen **423 px Beschriftung ohne Inhalt**. |
| **Strukturbalken** | geratene Einteilung; in der Befundspur ist die Einteilung aus dem Karaoketext an ihre Stelle getreten |
| **Maßstabsreihe · Sockelkaskade** | „hat uns nicht weitergebracht" (Caspar_D) |
| **Chroma-Wärmekarte** | ersetzt durch die SVG-Spur |

**Ausgeblendet wird die ganze `.section`**, nicht die Zeichenfläche —
sonst bleibt die Überschrift stehen.

### Nicht zeichnen, was niemand sieht

`sichtbar(id)` prüft `offsetParent !== null`; das ist null, sobald das
Element oder ein Vorfahr `display:none` trägt. Die Wache steht am
Anfang jeder betroffenen Zeichenfunktion. Damit kostet Ausgeblendetes
nichts mehr — auch nicht bei jedem Zoomschritt, denn
`redrawAllCharts()` fragt von sich aus nicht, ob etwas sichtbar ist.

**Kaskade und Stapel sind getrennt abgeklemmt.** Beide entstehen in
derselben Funktion, aber aus **zwei** Zerlegungen — die Kaskade aus der
Dezibelkurve, der Stapel aus der Energie. Wird nur eine gebraucht, wird
auch nur eine gerechnet; jede kostet sechs Öffnungen über 16.000
Punkte.

**Was das Zeichnen wirklich kostet**, gemessen: die beiden
Spektrogramme mit 5,6 s und 3,6 s. Alles andere zusammen unter 100 ms.
Die Doppelungen loszuwerden war also eine Frage der Ruhe, nicht des
Tempos.

### Chroma als SVG-Spur

Die Wärmekarte war eine Zeichenfläche in Anzeigebreite: auf einem
Schirm doppelter Punktdichte weichgezeichnet, beim Zoomen neu zu
rechnen. Als Pfad in `0..SPUR_W` ist sie scharf in jeder Breite, und
der Zoom kostet ein Attribut.

Zwölf Bänder, jedes um seine Mittellinie gespiegelt: **Breite =
Intensität, Farbe = Taste.** Weiße Tasten `#b0b0b6`, schwarze
`#6c6c72`, dazu ein sehr zurückhaltender Zeilenuntergrund für die
weißen. Reines Weiß war zu grell — zwölf Bänder in `#ffffff` auf
Schwarz sind zwölf Scheinwerfer.

### Die Wellenform zeichnet je Bildpunkt

Sie sah gröber aus als die Hüllkurve in der Abschnittsbahn. Grund: Die
Fläche wird mit `devicePixelRatio` angelegt, die Schleife lief aber
über die **CSS**-Breite — 1170 Spalten auf 2340 Bildpunkten. Jetzt eine
Spalte je Bildpunkt, und die ganze Spalte wird abgesucht statt einer
festen Schrittzahl ab ihrem Anfang.

### Die Palette: nur Suno-Farben

Alle verbliebenen bunten Töne sind auf den nächstliegenden Palettenton
bei **gleicher Helligkeit** gezogen (29 Stück). Graustufen bleiben —
sie sind Struktur, keine Aussage.

**Zwei Reihen mussten danach von Hand gerichtet werden:** die
Horizontrampe der Kaskade und die Stapelfarben. Eine automatische
Angleichung nach Farbton macht aus einer **geordneten** Rampe ein
Durcheinander, weil sie jede Stufe einzeln auf den nächsten Ton wirft.

> **Regel:** Geordnete Reihen müssen von Hand geordnet bleiben.

Min und Max stehen in Orange und Blau, ebenso die beiden Punkte in der
Sparkline; Mittelwert blau, Median gelb. Es ist überall dieselbe
Paarung: **orange = mehr, wärmer, heraus · blau = weniger, kühler,
hinein.**

**Der Player folgt weiterhin dem Cover, der Analyzer nicht.** Gemessen:
`--akzent` wechselt mit dem Song, der Analyzer benutzt praktisch keine
CSS-Variable mehr. Das ist Absicht — seine Farben *bedeuten* etwas, und
bei einem orangefarbenen Cover wäre die Ampel nicht mehr lesbar.
