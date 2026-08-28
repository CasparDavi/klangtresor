# Backlog

> **Namenswechsel:** Das Projekt hieß bis zum 24.08.2026 *MySuno*. Es heißt jetzt **KlangTresor** — „Suno" ist seit dem 06.01.2026 eingetragene Marke von Suno Inc., ausdrücklich für Software zum Abspielen und Bearbeiten von Audioinhalten. Wo in Zitaten und in der Chronik noch der alte Name steht, bleibt er stehen.

Stand 17.08.2026, Nachtrag 24.08.2026. Sortiert nach Nutzen im
Verhältnis zum Aufwand.

---

## Die tote Tonart — ERLEDIGT 24.08.2026

Ausgebaut. Was blieb, steht in `docs/HISTORY.md` unter „Das alte
Tonartverfahren ausgebaut" — warum 4096 statt 1024, warum Beträge statt
Mono-Summe, und die zwei Lehren aus dem Wächter.

**Entfernt:** `schaetzeTonart()` samt Krumhansl-Tabellen im
Rechenkern, die Kirchentonart-Erkennung (hing am selben Vollmix-Chroma),
die Felder `key` und `mode` aus beiden Worker-Nachrichten, die Karte
`v-mode`, `tonart`/`modus` aus dem Analyse-Index, der Wächter in
`vorrechnen.js`, `bin/ablage-kopf-reparieren.js`, der Tonart-Filter,
der Quintenzirkel, „Tonart × Likes" und „Tonart-Zwillinge".

**Zwei Funde, die sonst Schaden gemacht hätten** (beide aus der
Gegenprobe, nicht aus dem ersten Durchgang):

- `exportForLLM()` las `v('v-mode')` — die tote Kirchentonart stand
  bis dahin in **jedem Kommentar-Prompt**, den Caspar_D kopierte. Die Karte
  war unsichtbar, ihr Textinhalt aber lesbar.
- `analyzer.js:6498` schrieb in ebendiese Karte. Ohne sie hätte
  `getElementById(null).textContent` einen TypeError mitten im
  fft_partial-Zweig geworfen — bei **jedem** Abspielen aus der Ablage,
  weil alle 321 `.bin` ein `scalars.mode` trugen.

**Was bewusst stehen blieb:** `MESSWEG` in `analyse-ablage.js` (ihn zu
entfernen hieße, das Format anzufassen, an dem 4 GB hängen),
`chromaFlat` und `msg.chroma` (Akkordrate und die beiden Chroma-Bilder),
`rfft` (8 Rufer).

**Offen bleibt:** Die 321 vorhandenen `.bin` tragen `key` und `mode`
physisch weiter — sie werden nur von niemandem mehr gelesen. Sie
verschwinden, wenn ein Song ohnehin neu gerechnet wird. Und die
gültige Tonart aus `bin/toene.js` liegt bisher für 4 von 321 Songs vor;
bis `toene.js` durchgelaufen ist, zeigt die Karte für die übrigen einen
Strich. Das ist ehrlicher als eine Zahl, die 1 von 20 trifft.

---

## Dringend

### Datensicherung — entschärft
Alles liegt weiterhin nur auf der einen Platte, aber der Umfang des
Problems ist geklärt: **Zu sichern sind 10,8 MB, nicht 5 GB.**

Unersetzlich ist allein `library/roh/` — es entsteht nur im Browser mit
einem Clerk-Token. Katalog, Medien, Kacheln und Paletten baut
`node bin/wiederherstellen.js` daraus ohne jede Anmeldung neu auf; die
Mediendateien liegen offen auf Sunos CDN.

Caspar_Ds Haltung dazu (17.08.2026): entspannt — im Zweifel wird neu
geladen, wichtig ist nur, dass es **reproduzierbar** funktioniert. Das
ist es jetzt und wurde durchgetestet.

Offen bleibt trotzdem: eine Kopie der 10,8 MB irgendwohin, wo nicht
dieselbe Platte hängt.

---

## Klein und konkret

### Weitergabe — erledigt (18.08.2026)
Das Programm ist generisch. Ein anderes Suno-Konto kann damit sein
eigenes Archiv bauen, ohne eine Zeile zu ändern:

- **Der Handle wird nirgends eingetragen.** `browser/02-sammeln.js`
  liest ihn aus `location.pathname` der Profilseite, auf der es läuft,
  und sortiert fremde Songs danach aus. `bin/sammelskript.js` nimmt ihn
  für die Anleitung aus dem Katalog; beim allerersten Lauf steht dort
  `@DEIN-HANDLE` samt Hinweis.
- **Das Profilbild** kommt aus dem Konto: `bin/laden.js` holt
  `profil.avatar_image_url` nach `library/avatar.<endung>`, der Server
  liefert es unter `/avatar`. Caspar_Ds Bild ist aus dem Repo entfernt.
- **Erzeugte Dateien** (`browser/02-sammeln-aktuell.js`,
  `web/farbvergleich.html`) stehen in der `.gitignore` — sie tragen den
  eigenen Handle und die eigenen Song-IDs.
- **Die README** beschreibt Einrichtung und Monatslauf ohne Bezug auf
  ein bestimmtes Konto.

Die Fachdokumente in `docs/` nennen weiterhin Caspar_Ds Namen und seine
Messwerte. Das bleibt so: Sie belegen die Entscheidungen, an denen das
Programm gewachsen ist — die Zahlen sind Beweise, keine Konfiguration.

### Playlists
**Rohdaten sind geholt** (17.08.2026): 25 Playlists, 599 Einträge, in
`library/roh/playlists-<stempel>.json`. Endpunkte und Fallstricke stehen in
[DATENEXTRAKTION.md](DATENEXTRAKTION.md).

Offen ist der Einbau in Katalog und Oberfläche — und davor drei
Entscheidungen, weil die Playlists mehr enthalten als das Archiv:

- **117 Einträge sind Songs anderer Leute** (primelli, bardinlia, snmsounds
  und andere). Caspar_Ds Playlists sind kuratierte Sammlungen, keine reinen
  Eigenwerke.
- **73 eigene Songs stehen nicht im Archiv.** Titel wie „Der Blogger v2"
  oder viermal „Morgendämmerung" deuten auf Takes aus dem Arbeitsbereich.
  Anders als die übrigen ~2200 Takes hat Caspar_D diese selbst in Playlists
  einsortiert, sie sind also bewusst ausgewählt.
- **27 der 248 Archiv-Songs** stehen in keiner Playlist.

Das Feld `albums` gibt es im Katalog bereits an jedem Song, es ist bei
allen 248 leer. Für die Playlist-Zuordnung ist es frei.

### Doppelte Akzentpixel
Bei „Doppio passo" und „Okkultation" zeigen zwei verschiedene Farbtöne auf
dasselbe Pixel — in der Tonliste steht dieselbe Farbe zweimal. Ursache:
Die Verteilungsanalyse benutzt ein weiteres Fenster als die Tonauswahl.
Wirkt sich auf die Palette nicht aus (die Zweitfarbe filtert Dubletten),
sieht in der Liste aber seltsam aus.

### Artwork-Format auf der Bühne
Ist auf das Format des Mediums umgestellt. Ob das bei sehr breiten Videos
noch stimmt, wurde nicht geprüft — es gibt in der Sammlung keins.

### Aufräumen
Zwei Kleinigkeiten, rein kosmetisch:

`server/empfang.js` ist am 18.08.2026 gelöscht worden — toter Code,
Chrome blockiert den Weg. Die Begründung steht weiter unten unter
„Verworfen"; der Code selbst liegt in der git-Historie.

Erzeugte Dateien liegen weiterhin zwischen den Quelldateien
(`browser/02-sammeln-aktuell.js`, `web/farbvergleich.html`) — sie
müssen dort liegen, wo sie liegen. Seit dem 18.08.2026 stehen sie
immerhin in der `.gitignore`.

---

## Sammeln und Einlesen auf Knopfdruck — ✅ erledigt (19.08.2026)

Caspar_Ds Wunsch (18.08.2026): ein Knopf in der Oberfläche, der Sammeln
und Import erledigt — „am liebsten unter der Oberfläche, und die Daten
sind dann einfach da".

**Gebaut als Morgenlauf:** roter Knopf oben rechts, zwei Stufen (sehen,
dann übernehmen), selbstkalibrierender Balken. Dazu das Lesezeichen
`browser/morgens.js` für alles, was Token braucht. Einzelheiten in
`UEBERGABE.md` unter „Der Morgenlauf". Was darunter steht, ist die
ursprüngliche Überlegung — stehengelassen als Weg dorthin.

**Teilweise machbar. Der Ablauf zerfällt in zwei Hälften:**

**Der Import ja.** Alles nach dem Sammeln — Rohdatei einsortieren,
Katalog bauen, Medien laden, Kacheln, Farben — läuft ohne Anmeldung
und ist bereits ein einziger Befehl (`bin/wiederherstellen.js`). Ein
Knopf in der Oberfläche kann das anstoßen, der Server führt es aus und
meldet den Fortschritt zurück. Noch schöner: die heruntergeladene
Datei per Ziehen und Ablegen ins Fenster, den Rest macht der Server.

**Das Sammeln selbst nicht — jedenfalls nicht aus KlangTresor heraus.**
Zwei Hindernisse, beide gemessen und dokumentiert:

1. Es braucht ein **Clerk-Token**, das nur auf suno.com existiert und
   **60 Sekunden** lebt. Von `localhost:8788` aus gibt es keins.
2. **Chrome blockiert** Anfragen von suno.com an `127.0.0.1` und
   `localhost` vollständig — auch mit korrekten Kopfzeilen. Deshalb
   liegt der Weg über den Blob-Download überhaupt vor.

**Was das Kopieren trotzdem ersparen würde:**

- **Ein Lesezeichen (Bookmarklet).** Einmal in die Lesezeichenleiste
  gelegt, dann auf der Profilseite ein Klick statt Konsole öffnen und
  Skript einfügen. Kleiner Aufwand, großer Gewinn im Alltag.
- **Eine Chrome-Erweiterung.** Die dürfte auf localhost zugreifen und
  könnte alles in einem Zug erledigen — Sammeln *und* Übergabe. Das
  wäre die vollständige Antwort auf den Wunsch, kostet aber ein
  eigenes kleines Projekt und wäre die zweite Fremdkomponente.

Empfehlung: erst der Import-Knopf mit Ziehen und Ablegen, dann das
Lesezeichen. Damit bleiben genau zwei Handgriffe übrig — Klick auf der
Suno-Seite, Datei ins Fenster ziehen.

---

## Bühne

### Erweiterungen (Plugins)
Das Auswahlfeld „Darstellung" in der Bühne ist auf **Gruppen** ausgelegt
(`MODI[].gruppe`); eine Erweiterung braucht nur einen weiteren Eintrag mit
eigener Gruppe. Bewertung der Kandidaten, Stand 17.08.2026:

| | Einschätzung |
|---|---|
| **Butterchurn** | Der eigentliche Gewinn für einen Party-Modus. MilkDrop-Presets, WebGL. **Aber:** bringt eigene Farben mit und ignoriert die Coverpalette — der erste Bruch mit der Regel „nichts erfinden". Nur als ausdrücklich deklarierter Ausnahme-Modus, nicht als Standard. |
| **Meyda** | Der einzige echte Analyse-Gewinn. Zentroid, Fluss, Bänder und Schlagerkennung stehen bereits selbst gebaut zur Verfügung; **Chroma und Bark-Lautheit** gibt es noch nicht. |
| **Three.js** | Nur für ein, zwei Modi mit echter Tiefe. ~600 KB für die eine Sache; additive 2D-Überlagerung holt einen Großteil der Wirkung billiger. |
| **audioMotion-analyzer** | Doppelt zum Bestand — „Spektrum" ist bereits Frequenzbalken im Kreis. Neu wären nur Oktavband-Skalierung und LED-Optik, dafür käme ein zweiter Analyser-Graph neben den vorhandenen. |
| Astrofox · WaveSurfer.js · Peaks.js | Für Editor, Timeline und Annotation gebaut, nicht für Bühnenvisuals. |

Zu bedenken bei allem: Das Projekt ist bisher **eine Datei ohne
Abhängigkeiten**. Jede Erweiterung ist die erste Fremddatei.

### Partytauglich machen
Caspar_Ds Wunsch (17.08.2026), noch nicht ausgearbeitet. Offene Fragen:
Läuft die Bühne auf dem Mac-Bildschirm oder an Fernseher/Beamer? Danach
richtet sich, ob es um Skalierung oder ein eigenes Layout geht.
Kandidaten: größere Schrift für Ableseabstand, Bedienelemente
ausblenden, weicher Songwechsel mit Ankündigung, kräftigere
Visualisierungen.

### Lyrics konsistenter unterbringen
Caspar_Ds Befund: Der Text sitzt in der Bühne nicht sauber. Zusammen mit
der Idee dreier Felder neben der Playerleiste — **Stage · Lyrics ·
Analyzer**. Vorschlag: Stage und Analyzer schließen sich aus (beide
besetzen die Fläche), Lyrics ist unabhängig zuschaltbar. Damit wird
auch „Analyzer + Lyrics" möglich, also Karaoke mit Visuals. **Offen.**

### Lyrics fremder Songs
Gemessen: `api/clip/<id>` liefert **ohne Anmeldung** Titel, Lyrics,
Stil und Dauer (HTTP 200). `api/gen/<id>/aligned_lyrics/` verlangt ein
Token (**401**). Fremde Songs könnten also Text bekommen, aber keine
wortgenauen Zeitmarken — es bliebe das gleichmäßige Mitwandern, das für
die vier eigenen Songs ohne Zeitmarken schon existiert. Holen über den
lokalen Server (kein CORS-Problem), Zwischenspeicher als **eine**
gepackte Datei.

---

## Mittel

### Dritte Stufe der Farbwahl
Bei den **21 Covern mit nur einem Ton** entsteht die Palette derzeit aus
diesem einen Ton. Besser wäre, sie aus dessen **Helligkeits- und
Buntheitsverteilung** zu bauen: Grund am Häufigkeitsgipfel, Akzent am
Buntheitsmaximum. Die Daten liegen schon im Katalog (`grundL`, `akzentL`
je Ton), benutzt werden sie noch nicht.

Begründung: Bei „Doppio passo" fand das Verfahren vier Rottöne, die sich
als praktisch dieselbe Farbe erwiesen (`#5c0000`, `#550006`, `#4f0013`).
Bei einem einfarbigen Cover ist der Farbton die falsche Achse.

### Rot und Gold verschmelzen
Bei „Die Gedanken ..." (hellblau, goldgelb, rote Kameralinsen) wird das
Gold gefunden (`#ef6312`, 11 %), das Rot nicht — beide liegen nur rund
16 Grad auseinander, und die abgeleitete Trennschärfe war größer. Denkbar:
die Trennschärfe zusätzlich nach unten aufweichen, wenn zwei Gipfel klar
getrennte Spitzenbuntheiten haben.

### Mitte/Seite für die Stereo-Farbfelder
Caspar_Ds Mischungen sind energetisch nahezu mono, die Links-rechts-Trennung
gibt optisch kaum etwas her. Statt L und R sollte **M = (L+R)/2** und
**S = (L−R)/2** gemessen werden. S isoliert Hall und Stereobreite und ist
deutlich dynamischer. Aufwand: ein zusätzlicher Knoten im Audiographen,
ein sechster Analyser.

### Bewegung beurteilen
Sämtliche Visualisierungen wurden nur über Standbilder und Messwerte
geprüft — der ferngesteuerte Browser hält `requestAnimationFrame` an.
Ob sie *in Bewegung* gut aussehen, hat noch niemand systematisch bewertet.
Kandidaten für Nachjustierung: Geschwindigkeiten, Deckkräfte,
Abklingzeiten.

---

## Größer

### Der Arbeitsbereich
Es gibt rund **2200 Clips** im Suno-Arbeitsbereich — alle Takes und
Varianten. Bewusst nicht archiviert, weil Caspar_D nur das Veröffentlichte
wollte. Die Entscheidung ist jederzeit umkehrbar, kostet aber einen
Sammellauf von mehreren Stunden und rund 40 GB.

Ein Zwischenweg: nur die **Metadaten** des Arbeitsbereichs sichern (wenige
MB). Damit wäre die Entstehungsgeschichte jedes Songs dokumentiert, auch
ohne die Audiodateien.

### Kommentare — ✅ erledigt (19.08.2026)
Die Community-Kommentare unter den Songs sind fremder Inhalt auf fremdem
Server — genau das, was bei einer Abschaltung unwiederbringlich weg wäre.

**Gesichert:** 471 Kommentare + 308 Antworten von 107 Menschen, seit
April 2025, in `library/reaktionen.ndjson` (eine Datei, angehängt, nie
überschrieben). `bin/reaktionen.js`, im Morgenlauf. Dazu der
Benachrichtigungsstrom über das Lesezeichen: Likes mit Namen und Zeit,
vier Wochen zurück, ab jetzt wachsend. Angezeigt im Community-Fenster
(Daumen/Sprechblase an der Kachel). Endpunkte in `SUNO-API.md`.

### SunoAnalyzer als vierte Bildebene der Bühne
Das Schwesterprojekt `../SunoAnalyzer/` analysiert einzelne Songs —
LUFS, Spektrogramm, Onset, BPM, Chroma, Struktur, Stimmcharakter,
Instrumenterkennung über ONNX — und trennt über `../DemucsServer/`
(Port 5001) Stems.

**Caspar_Ds Vorgabe (18.08.2026):** Er soll nicht wie ein eigenes Werkzeug
aussehen, sondern **ein weiterer Modus** sein. Kein zusätzlicher Tab,
kein Ladebereich, kein Kommentar-Generator. Die Bühne bleibt, wie sie
ist — **statt der Visuals erscheint der Analyzer.** Er analysiert
sofort den laufenden Song, füllt sich aus lokalen Daten und
kontaktiert Suno nie; einzige Ausnahme sind fremde Songs aus
Playlists, die nicht lokal liegen.

**Ganz wichtig:** Die Anzeige muss **synchron zum Bühnenplayer**
laufen, damit man sieht, wo im Song man ist. Kein eigener Player,
nur Anzeige.

**Vorerst stillgelegt** (18.08.2026): Stem-Trennung und
Instrumenterkennung. Beide sind in der Bühne nicht sinnvoll — und mit
ihnen fällt jeder Netzzugriff des Analyzers weg.

#### Zwischenstand
Am 18.08.2026 entstand ein erster Schritt, der bewusst wieder
verschwindet: eine Kopie unter `web/analyzer.html` samt Knopf
„Analyse", der einen eigenen Tab öffnet. Er ist Rückfall und Beweis,
dass die lokale Adresse trägt — mit dem Modus fällt beides weg.

#### Entschieden
**Einbau als JS-Modul unter `web/fremd/analyzer.js`**, nicht als
iframe. Ausschlaggebend war die Synchronität:

| | iframe | Modul |
|---|---|---|
| Spielkopf | Nachrichten, 24/s oder interpoliert | liest dieselbe Zeit |
| Live-Anzeigen | AudioContext ist **nicht** über Dokumentgrenzen teilbar | hängt an `hörer.quelle` |
| Songwechsel, Maus, Tastatur | drei eigene Aufgaben | entfallen |

Der Präzedenzfall steht im eigenen Haus: Butterchurn und audioMotion
bekommen ebenfalls keinen eigenen Zugang zum Ton, sondern den
vorhandenen Quellknoten. Der Preis ist bekannt und angenommen: Ein
Nachziehen des Originals wird zur Zusammenführung statt zum Kopieren.

**Der Zuschnitt trägt.** Von 200 KB sind 177 KB Skript, 22 KB Markup
und 3,4 KB CSS — Markup und Stil kann das Modul selbst erzeugen. Und
der Worker steckt bereits als **String** im Skript (`workerCode` →
Blob → `new Worker`), braucht also keine zweite Datei.

#### Die Schnittstelle
Der kleinste Eingriff für die Synchronität ist ein **Zeitgeber statt
einer Zeit**: Das Modul behält seine eigenen rAF-Schleifen und fragt
statt `player.currentTime` eine von außen gereichte Funktion.

```js
SunoAnalyzer.aufbauen(flaeche, { zeit: () => audio.currentTime, sprung, farben })
SunoAnalyzer.quelle(hörer.quelle, audioCtx)
SunoAnalyzer.song({ id, titel, tonUrl, welle, … })
SunoAnalyzer.abraeumen()
```

`abraeumen()` ist Pflicht: dieselbe Lehre wie bei den Visualizern,
deren Schleifen nach einem Moduswechsel weiterliefen — hier kommt ein
Worker dazu, der sonst weiterrechnet.

#### Aufgaben

**0 · Umzug ins Modul**
0.1 ✅ **erledigt am 18.08.2026.** `web/fremd/analyzer.js` (218 KB) trägt
    CSS, Markup und Skript; `web/analyzer.html` ist auf 1,2 KB
    geschrumpft und nur noch Wirtsseite. Gegenprobe: dieselben Messwerte
    wie vorher (117 BPM, −14,7 LUFS, F Dur, 8 Abschnitte, 13 Diagramme).
    Drei Dinge waren dabei nötig und stehen im Kopf der Datei:
    **CSS eingehegt** (`body`, `*`, `button`, `canvas` hätten sonst die
    Bühne umgefärbt), **Skript in eine Funktion gelegt** (rund 300 Namen
    blieben sonst im globalen Raum, wo `song`, `player` und `audio`
    schon vergeben sind), **`requestAnimationFrame` überschattet**, damit
    sich alle Zeichenschleifen anhalten lassen, ohne eine Zeile des
    Originals anzufassen
0.2 ✅ **erledigt am 18.08.2026.** Die Schnittstelle steht:

    ```js
    SunoAnalyzer.aufbauen(flaeche, { zeit, laeuft, sprung })
    SunoAnalyzer.song({ …/api/song/<id>…, tonUrl, bild })
    SunoAnalyzer.analysiere(adresse, titel, bild)   // Fremdes ohne Katalog
    SunoAnalyzer.abraeumen()
    ```

    Drei Auskünfte statt einer: `zeit()` liefert die Stelle, `laeuft()`
    sagt, ob gespielt wird, `sprung(t)` ist der Rückkanal. Ohne
    `laeuft()` wäre es nicht gegangen — zwei Schleifen des Analyzers
    ruhen, solange seine eigene Wiedergabe pausiert, und mit fremder Uhr
    hätten sie für immer geruht. Alle drei haben Rückfälle auf den
    eigenen Player, damit die Wirtsseite als Prüfstand weiterläuft.

    Gemessen mit einer gestellten Uhr: **16 Spielköpfe** im Gleichschritt,
    320 s von 334 s ergeben 802 von 837 px; Zeitanzeige und
    Struktur-Cursor folgen; Klick in die Wellenform meldet 167 s bei
    erwarteten 167 s zurück; bei achtfachem Zoom wandert der Ausschnitt
    mit und hält den Spielkopf mittig.

    **`quelle()` fehlt noch** — die beiden Live-Anzeigen brauchen einen
    echten Audiographen, und den gibt es erst in der Bühne. Kommt mit 2.2
0.3 ✅ **erledigt.** Wirtsseite gelöscht, Tab-Knopf entfernt. Der
    Analyzer öffnet sich nirgends mehr separat

**Zwei Fehler kamen dabei ans Licht:**

**`songDuration` wurde auf dem Dateiweg nie gesetzt.** Im Original tut
das nur `analyze()`, also der Weg über die Suno-Songseite;
`analyzeFile()` setzte allein die *Anzeige* der Dauer. Damit blieben auf
genau dem Weg, den KlangTresor benutzt, **alle 17 Spielköpfe und der Zoom
tot** — beide brechen bei `songDuration === 0` sofort ab. Es fiel nie
auf, weil auf diesem Weg nie jemand abgespielt hat. Gesetzt wird es
jetzt in `startWorkerAnalysis()`, wo beide Wege durchkommen.

**Die Handler-Brücke war unvollständig.** Beim Umzug wurden nur
`onclick`, `onchange`, `oninput` und `onload` umgeschrieben —
`onmousedown` und `ontouchstart` nicht. Der Sprung in der Wellenform
zeigte dadurch ins Leere. **Lehre:** Wer Handler umschreibt, muss die
Ereignisliste aus dem Markup gewinnen, nicht aus dem Gedächtnis.

**Fallstrick für die Einbettung:** Der Server liefert `.js` mit einem
Jahr Cache-Dauer — richtig für die Visualizer-Bibliotheken, die sich nie
ändern, tödlich für ein Modul in Arbeit. Die Wirtsseite hängt deshalb
eine Kennung an die Adresse. Für `index.html` ist das noch zu
entscheiden.

**Nebenbefund zur Einbettung:** 147 Kennungen im Analyzer gegen 75 in
der Bühne — **genau eine Kollision**, `player`. Sie verschwindet mit
1.3 von selbst. Danach ist das Markup ohne Umbenennungen einbettbar.

**1 · Was verschwindet** — ✅ erledigt am 18.08.2026
1.1 ✅ Kopfbereich, 1.2 ✅ Kommentar-Generator, 1.3 ✅ Transportzeile,
    Abspielknopf und eigene Lautstärke — dazu die Überschrift mit der
    Fassungsnummer. **Die Wellenform bleibt**: Sie ist die Hüllkurve mit
    dem Spielkopf, also Anzeige, nicht Wiedergabe.
    Das `<audio>`-Element heißt jetzt `sa-player` — damit ist die
    einzige Kennungskollision mit der Bühne weg.
1.4 **Stem-Trennung stillgelegt** (Caspar_D, 18.08.2026): keine Demucs-Abfrage,
    kein Stems-Abschnitt. Sie dauert Minuten und braucht einen zweiten
    Server — in der Bühne vorerst nicht sinnvoll
1.5 ✅ **erledigt — und am 25.08.2026 gelöscht.** Die regelbasierte
    Instrumenterkennung ist weg, 172 Zeilen (Caspar_D: „die
    Instrumenterkennungsheuristik war scheisse und deswegen haben wir
    sie auch totgelegt und zum Löschen vorgesehen"). Die Fassung über
    Essentia/ONNX fiel schon vorher mit Essentia.
    Sie bewertete neun Instrumente mit Punktregeln über genau die
    Größen, deren Karten wegen erwiesener Fehler verborgen sind — aus
    falschen Zahlen kann keine Punktregel etwas Richtiges machen. Die
    Begründung steht ausführlich im Kommentar an ihrer Stelle in
    `analyzer.js`. Wer Instrumente wissen will, hat seit dem 24.08.2026
    die Stem-Zerlegung: sechs getrennte Spuren mit gemessenen Anteilen
    statt geratener Punkte.
    Das „stillgelegt heißt nicht gelöscht" von damals gilt nicht mehr —
    seit dem 25.08.2026 wird nichts mehr totgelegt, ohne den Code
    mitzulöschen. Erhalten bleibt die Begründung, nicht der tote Code.

**2 · Ein Ton, ein Spielkopf**
2.1 ✅ **erledigt.** Zehn Stellen waren es. Die Spielköpfe und das
    Mitwandern des Ausschnitts laufen unverändert weiter
2.2 ✅ **erledigt.** `quelle(knoten, ctx)` hängt die beiden
    Live-Anzeigen an den vorhandenen Graphen. Der Analyser MUSS an dem
    Kontext hängen, aus dem die Quelle stammt — Knoten aus verschiedenen
    AudioContexts lassen sich nicht verbinden. Beim Abräumen wird er
    ausdrücklich gelöst, sonst sammelten sich bei jedem Moduswechsel
    weitere an
2.3 ✅ **Rückkanal steht** (`sprung`). Der Klick in die Wellenform
    meldet die Zielzeit nach außen, statt selbst zu spulen
2.4 ~~Stems mit eigener Wiedergabe~~ — erledigt sich durch 1.4

**3 · Nur lokale Daten**
3.1 ✅ **erledigt.** `song()` füllt Titel, Autor, Datum, Modell, Plays,
    Likes, Kommentare, Verhältnis, Alter, Stil-Marken und Lyrics aus dem
    Katalog. Der **Ausschlussprompt** (`stilAusschluss`) kommt
    durchgestrichen mit — er sagt, was NICHT drin sein soll, und das ist
    beim Hören dieselbe Auskunft wert. Gegenprobe: **keine einzige
    Anfrage an suno.com**. `fetchMeta()` liegt still und wartet auf die
    fremden Songs (3.3)
3.2 Hüllkurve aus dem Katalog (`welle`) sofort zeigen, bevor gerechnet wird
3.3 Fremde Songs über eine eigene Proxy-Route im Server statt über den
    DemucsServer (dessen `/proxy?url=` ist der heutige CORS-Umweg)

**4 · Einbettung** — ✅ erledigt am 18.08.2026

Der Analyzer ist der **vierte Wert der Textachse**:
`Kein Text · Karaoke · Lyrics · Analyzer`. Die vier schließen sich aus.

Die Bühne trägt im Analysemodus **zwei** Klassen: `text-lyrics` liefert
das Grundgerüst — geteilter Schirm, festes Pult, keine Schublade —,
`text-analyzer` setzt nur die Unterschiede darauf. Dadurch musste keine
einzige der vorhandenen `:not(.text-lyrics)`-Regeln angefasst werden.

| Spalte | Inhalt |
|---|---|
| **links** | Marke „KlangTresor · Analyse" · Songtitel · **eine Zeile** Wiedergabesteuerung · darunter die Analysepanels, **scrollend** |
| **rechts** | Artwork in Thumbnailgröße · Stilprompt mit durchgestrichenem Ausschluss · Lyricsprompt — im **Systemsatz**, als Nachschlagetext |

**Das Artwork steht rechts, nicht links** (Caspar_D, 18.08.2026): „Im
Analyzer ist nicht der Platz für Video-Artworks oder große Visualizer,
nur Thumbnailgröße." Deshalb entfällt die Bildfläche `.bart` im
Analysemodus **ganz** — ein Thumbnail braucht deren Mechanik nicht.
Gezeigt wird **dieselbe Kachel wie in der Albumansicht**
(`kachel.jpg`, 3:4 hochkant, mit `cover.jpg` als Rückfall), damit ein
Song überall gleich aussieht.

**Der Player ist auf eine Zeile zusammengestrichen.** Übrig sind:
Textmodus, Tonqualität, Zurück/Abspielen/Weiter, Zeit, Lautstärke.
Weggelassen, weil es dort nichts tut:

| weg | Grund |
|---|---|
| Textversatz | verschiebt Karaoke-Text, den es hier nicht gibt |
| Bildebene | steuerte die Fläche, die es hier nicht gibt |
| Darstellung | wählte die Visualisierung, die es hier nicht gibt |
| Zufall | mitten in einer Analyse springt niemand weiter |

Die Knöpfe behalten dabei das **Größenverhältnis der übrigen Player**
(46/60 px maßstäblich verkleinert auf 38/50 px). Die **Zoomleiste** wird
zusätzlich nach oben ins Pult geholt — im scrollenden Bereich wäre sie
nach dem ersten Scrollen weg, obwohl sie auf alle Diagramme wirkt.

**Darunter, scrollend:** Karten · Wellenform · Struktur · Kurven. Die
Karten fließen in **ein** auffüllendes Raster (4:3 quer, gemessen acht
Spalten à 144×108 px) statt in sieben feste Vierergruppen. Die
Wellenform trägt eine **mitlaufende Zeitangabe auf dem Spielkopf**.

**Offen:** Die letzte Kartenzeile bleibt halb leer (26 Karten bei acht
Spalten). Sechs weitere würden sie genau füllen — und die Kandidaten
stehen schon fest, siehe „Funktionen aus dem CB Audio Analyzer prüfen":
Phasenkorrelation, Clipping, Balance und die Zielpegel je Plattform
sind aus dem bereits dekodierten Puffer billig zu rechnen, True Peak
braucht Überabtastung.

4.1 ✅ Vierter Wert `analyzer` in `#btextWahl`
4.2 ✅ Die Panels erben die Coverpalette über `--btext`
4.3 ✅ Linke Spalte wie oben
4.4 ✅ Rechte Spalte aus `stilPrompt`, `stilAusschluss` und `lyrics`
4.5 ✅ **Was scrollt:** nur die Panels. Titel, Paßfoto und Steuerung
    stehen.
    **Dafür musste die linke Spalte ein Raster werden.** Mit
    umbrechendem Flex wuchs der Panelbereich auf volle Inhaltshöhe —
    gemessen **3875 px in einer 1232 px hohen Spalte** — und scrollte
    die ganze Bühne statt sich selbst. Nur ein Raster kann einer Reihe
    ausdrücklich „der Rest der Höhe" zuweisen. `min-height:0` gehört
    dabei an **beide**, Raster und Kind
4.6 ✅ **Spaltenverhältnis umgekehrt zum Lyrics-Modus:** links die
    Fläche (Spektrogramme brauchen Breite), rechts
    `clamp(230px,26%,430px)`
4.7 ✅ Die Bildebene ist im Analysemodus **ganz weg**, nicht nur grau:
    Sie steuerte eine Fläche, die es dort nicht mehr gibt. Damit
    erledigt sich auch die Frage nach dem Video-Artwork im Thumbnail —
    es gibt keine bewegten Bilder im Analysemodus
4.8 ✅ **Hochformat:** Die rechte Spalte wandert unter die Panels
    (`@media (orientation:portrait)`), statt auf Briefmarkenbreite zu
    schrumpfen. Auf einem Gerät noch nicht geprüft
4.9 ✅ Die Schublade ist kein Thema mehr: Über `text-lyrics` steht das
    Pult ohnehin fest

**Fremde Songs** bekommen den Eintrag **grau** („Analyzer (nicht im
Archiv)"), und der Modus fällt auf „aus" zurück — dieselbe Regel wie bei
Karaoke ohne Zeitmarken. Geprüft an einem Eintrag aus „synthpop 80s".

**5 · Kosten** — ✅ alle drei erledigt (19.08.2026)
5.1 ✅ Analyse erst beim Umschalten in den Modus starten
5.2 ✅ Ergebnis je Song zwischenspeichern — die Ablage
    (`library/analyse/<id>.bin` + zwei WebP), laden 2 s statt 17
5.3 ✅ alle 321 Songs vorrechnen — `bin/vorrechnen.js` in Node,
    parallel, neunmal schneller ohne `vm.runInContext`. Und
    `bin/analyse-index.js` macht daraus die Sortierung: Schnellste,
    Lauteste, Dynamischste … im Raster, Gruppe „Gemessen".

**6 · Netzfreiheit — ergibt sich von selbst**

Mit 1.4 und 1.5 verliert der Analyzer **alle** Fremdadressen auf einmal.
Nachgezählt waren es genau vier:

| Adresse | wofür | Stand |
|---|---|---|
| `cdn.jsdelivr.net` | `onnxruntime-web` | entfällt mit 1.5 |
| `caspardavi.github.io` | Essentia-Modelle | entfällt mit 1.5 |
| `localhost:5001` | Demucs, und der Proxy für `fetchMeta` | entfällt mit 1.4 und 3.1 |
| `suno.com` / `cdn1.suno.ai` | Metadaten und Ton | entfällt mit 3.1 und 3.2 |

6.1 ✅ Die ONNX-Einbindung ist mit der Wirtsseite verschwunden
6.2 ✅ **Gemessen im Analysemodus der Bühne: null Fremdanfragen.**
    Dafür mussten DREI Wege abgeschaltet werden, nicht einer — die
    beiden `checkDemucsServer()` in den Analysewegen, ein
    `detectDemucsURL()` beim Aufbau und ein `setTimeout` eine Sekunde
    danach. Die ersten beiden abzuschalten genügte nicht; erst die
    Messung der ausgehenden Anfragen zeigte die anderen.
    **Lehre:** „Wir rufen es nicht mehr auf" ist keine Abnahme. Die
    Abnahme ist die Liste der tatsächlich gestellten Anfragen.

    Die Adressen stehen weiterhin im Quelltext — `analyze()` und
    `fetchMeta()` werden für die fremden Songs (3.3) noch gebraucht.
    Angesteuert wird keine davon

Damit gilt für den Analyzer wieder die Hausregel: **Eigenes lokal,
Fremdes remote** — und fremd ist hier nur noch der Ton der 117
Playlist-Einträge anderer Urheber.

### Funktionen aus dem CB Audio Analyzer prüfen
Ein Bekannter von Caspar_D (CastoByte) hat einen eigenen Analyzer gebaut,
Fassung 1.0.0, liegt unter `~/Downloads/CB_Audio_Analyzer_Linux_1`.
**Es geht ausschließlich um Funktionen, nicht um Einbettung** — sein
Programm ist Python mit Qt (PySide6, pyqtgraph, numpy/scipy) und
nimmt unter Linux die Monitorquelle von PulseAudio/PipeWire ab. Mit
KlangTresor hat es technisch nichts gemein; interessant ist, **was** es
misst.

Beiläufig, aber wichtig: Sein Code steht unter **GPL-3.0-or-later**.
Ideen und Messverfahren sind frei — sie stammen ohnehin aus offenen
Normen (EBU R128, ITU-R BS.1770). Codeübernahme würde KlangTresor unter
dieselbe Lizenz zwingen, und KlangTresor soll weitergegeben werden können.
Also: nachbauen, nicht kopieren.

**Was er kann, das der eigene Analyzer nicht kann** — aus Quelltext
und Beschreibung gelesen, nicht durch Ausführen:

| Funktion | Warum sie reizvoll ist |
|---|---|
| **Zielpegel je Plattform** — Spotify · YouTube · Club · Broadcast · Streaming, dazu `desired_gain_db` mit „anheben/absenken" | Der eigene Analyzer misst LUFS, sagt aber nicht, **wohin** damit. Ein Soll-Ist-Vergleich je Ziel ist der praktische Teil der Lautheitsmessung |
| **True Peak, 4-fach überabgetastet** | Der Spitzenwert zwischen zwei Abtastpunkten liegt höher als jeder einzelne — genau daran scheitern Songs beim Kodieren. Sample-Peak allein verschweigt das |
| **Song Check mit Zeitmarken** — `fault_start_seconds`/`fault_end_seconds`, `clipped_samples`, `eq_tips` | Nicht „der Song hat ein Problem", sondern **wo**. Das passt genau zur Bühne, die einen Spielkopf über alle Diagramme führt |
| **Phasenkorrelation** (`corr`, `corr_raw`) und `balance` | Beantwortet die im Backlog offene Frage nach Mitte/Seite von der anderen Seite — und Caspar_Ds Mischungen sind gemessen nahezu mono |
| **BPM-Vertrauen** (`bpm_confidence`) | Der eigene Analyzer nennt einen BPM-Wert ohne Angabe, wie sicher er ist |
| **Shimmer-Erkennung** | Noch unklar, was genau gemeint ist — nachfragen lohnt |

Nicht übertragbar: die Abnahme der Systemausgabe in Echtzeit (KlangTresor
hat die Datei), die Qt-Oberfläche, die Skins.

**Nächster Schritt:** Bei den drei Kandidaten mit dem besten Verhältnis
anfangen — Zielpegel, True Peak, Clipping mit Zeitmarken. Alle drei
rechnen auf dem Puffer, den der Analyzer ohnehin schon dekodiert hat.

### Wellenform anzeigen
Suno liefert zu jedem Song eine Hüllkurve mit rund 1700 Werten, sie liegt
bereits im Katalog (`welle`). Wird noch nirgends benutzt. Naheliegend: als
Fortschrittsbalken in der Bühne, oder als Grundlage einer Visualisierung,
die auch ohne Web-Audio-Analyse läuft.

---

## Verworfen — mit Begründung

**Sunos Lyric-Videos archivieren.** 2,51 GB für etwas, das die Bühne
besser kann — wortgenau statt zeilenweise, in den Coverfarben, mit
einstellbarem Versatz. Am 17.08.2026 gelöscht. Die Dateien liegen ohne
Anmeldung auf dem CDN und sind mit `node bin/laden.js --mit-lyricvideo`
jederzeit zurückzuholen.

**WAV archivieren.** Die Dateien existieren auf dem CDN erst, wenn sie auf
der Suno-Website einzeln angestoßen wurden. Vorher HTTP 403. Massenhaft
nicht machbar, einzeln würde es genau die Downloads kosten, die das Archiv
sparen soll.

**Empfänger-Server für die Browserdaten.** `server/empfang.js` war
gebaut, funktionierte aber nicht: Chrome blockiert Anfragen von suno.com an
`127.0.0.1` und `localhost` vollständig. Ersetzt durch Blob-Download.

**Farbtonpentagramm.** Fünf Töne im 72°-Abstand aus einer Leitfarbe. Erfand
Farben, die im Cover nicht vorkamen — für ein Rotwein-Cover Grün und
Magenta. Ersatzlos entfallen.

**Interquartil-Filter auf die Helligkeit.** Sollte Fast-Schwarz und
Fast-Weiß ausschließen, tat bei dunklen Covern das Gegenteil. Ersetzt
durch absolute Grenzen.

### Die FFT-Tonart im Rechenkern ist kaputt — ✅ repariert (19.08.2026, abends)
Ursache: 1024er-Bin-Raster (43 Hz je Bin) trifft songunabhängig dieselben
Halbtöne. Jetzt `schaetzeTonart()` mit 4096, eigene Funktion, Selbsttest
mit Tonleitern aus Sinustönen (20/20). Siehe HISTORY. Was darunter
steht, ist die ursprüngliche Notiz.

#### Ursprüngliche Notiz
`fft_partial.key` sagt für 298 von 321 Songs „F# Dur" und für keinen
Moll. `scalars.key` (frühe Schätzung) streut plausibel. Der Analyzer
zeigt auf der Karte „Tonart" vermutlich die kaputte — prüfen, welche
Karte welches Feld liest. Bis dahin nimmt `bin/analyse-index.js`
`scalars.key`. Ursache in `analyzer-worker.js` suchen: Chroma-Summe
über alle Frames, dann Template-Korrelation — wahrscheinlich wird ein
Offset nicht rotiert oder die Moll-Templates fehlen.

## Offen seit dem 19.08.2026

### Community-Fenster ausbauen
Follower-Liste (ins Profil-Fenster, nicht ins Song-Fenster);
`comment_like`, `hook_like`, `playlist_like` aus dem Strom zeigen;
„Ungelesen" als Punkt am Zähler auf der Kachel selbst.

### Sortierung nach Bewegung
„Plays der letzten 7 Tage" aus dem Zählerverlauf — was sich *gerade*
bewegt, nicht die Summe über sechzehn Monate. Lohnt in einer Woche,
wenn der Verlauf Tiefe hat.

### Suchfeld: Lyrics
Der Platzhalter versprach sie von Anfang an; durchsucht werden Titel und
Stil. Lyrics stehen nicht in der schlanken Liste — `lyricsKurz` in
`/api/index` oder serverseitige Suche.

### Analyzer: Tonart-Karte prüfen
Der Kern liefert jetzt die richtige Tonart. Ob die Karte das richtige
Feld liest und der zweite Kandidat sinnvoll erscheint — nachsehen.

### Aus SUNO-API.md prüfen
`aligned_lyrics/v3`, `gen/<id>/wav_file/`, `clips/get_songs_by_ids`,
`download/clip/` — siehe dort, Abschnitt „Lohnt sich wahrscheinlich".

## Tarjas Wünsche (20.08.2026)

### Whisper für die Wort-Zeitmarken — GEBAUT (20.08.2026)
Tarja untertitelt ihre Songs in Twitch-Streams live mit Whisper
`large-v3` — sie weiß also, was es kann. Caspar_Ds Entscheidung: „wir
nehmen das beste", alles auf der Entwicklungs-SSD, Nachtlauf, neueste
Songs zuerst.

**Stand:** whisper.cpp selbst gebaut (CPU + Accelerate, Metal stürzt
auf dem Intel-Mac ab), Modell `ggml-large-v3.bin` (3,1 GB), gemessen
~1,5× Echtzeit. `bin/whisper.js` rechnet Songs ohne Sunos Zeitmarken,
gleicht gehörte Wörter mit den offiziellen Lyrics ab, schreibt
`library/whisper.ndjson`; `bin/aufbereiten.js` trägt sie als `worte`
(Quelle whisper) ein. Details: `docs/WHISPER.md`.

**Offen:**
- Morgenlauf: optionaler Schritt „Whisper" nur für neue Songs ohne
  Zeitmarken (läuft lange — eher als eigener Nachtknopf als im
  Morgenlauf).
- Qualität gegen Sunos Zeitmarken messen: einen Song, der beides hat,
  mit `node bin/whisper.js <id>` rechnen und die Abweichung je Wort
  ausgeben (Median, 95 %).
- Für Songs ohne Text: Whispers gehörter Text steht als Lyrics mit
  Quelle whisper — in der Bühne als „Lyrics (Whisper gehört)" markiert.
  Ein Knopf „in die Lyrics übernehmen/verwerfen" fehlt.
- `-dtw large.v3` (genauere Token-Zeiten) lieferte `t_dtw = -1` — prüfen,
  ob der Modellname anders heißen muss; die Standard-Zeitmarken sind
  gut genug fürs Karaoke.

### Echte Stimmtrennung über Demucs (statt L−R-Trick)
Caspar_D (20.08.2026): der Karaoke-Trick (Mitte auslöschen) ist keine
Stimmentfernung — „dazu bedarf es Stem-Exklusion, und das geht nur
per KI". Richtig. Und die KI liegt schon da:
einem Ordner ausserhalb des Projekts (`…/DemucsServer`). Plan wie bei
Whisper: Nachtlauf je Song → Stems (mindestens Instrumental +
Gesang) als Dateien neben audio.mp3, Katalog-Merker, in der Bühne
ein ehrlicher „Instrumental"-Schalter (echte Spur, kein Filter).
Speicher bedenken: Stems sind groß — ggf. nur Instrumental als MP3.

### Tonstudio — Reststand (20.08.2026, spät; Details in docs/TONSTUDIO.md)
Gebaut und dokumentiert: 8-Band-EQ mit Gain-Raum-Diagramm + Decke,
parametrischer Modus, Presets, A/B, Ghettoblaster (Lampen, LCD nach
Caspar_Ds Skizze, Echo, Tempo, MEGA BASS), Kompressor/Limiter,
Messwerte, Erklärtexte in Caspar_Ds Sprache („Überschreien"!).
Offen: Professionell-Texte verständlicher (Caspar_Ds Anmerkungen stehen
aus!), Stilgruppen-Preset (nach Clustering), LED-VU-Retro (wenn
Lust), Bounce nur falls je gewünscht (Suno-WAV-Originale tabu).

### KI-Style-Clustering (Caspar_D, 20.08.2026: „superinteressant")
Songs nach KLANG clustern, nicht nach Styleprompts (die taugen nicht:
zu viel Regieanweisung, zu wenig Klang) und nicht nach Einzelwerten
(verworfen: „völlig verschiedene Dinge clustern zusammen, nur weil
sie in einer Eigenschaft übereinstimmen"). Zwei Wege, kombinierbar:
1. **Klang-Einbettungen**: ein Audio-Embedding-Modell (CLAP/MERT,
   laufen lokal via ONNX/ggml auch auf dem Intel-Mac) je Song ein
   Vektor aus dem MP3 → Clustern (HDBSCAN/UMAP-Karte im Profil).
   Kein LLM, keine Zugangsdaten, einmal über Nacht.
2. **Tonfall der Lyrics**: je Song eine LLM-Einschätzung (Stimmung,
   Erzählhaltung, Bildwelt) → zweite Cluster-Ebene. Für Caspar_D über
   Claude; für Dritte entweder eigener API-Schlüssel oder ein lokales
   kleines Modell (Qwen 3 4B über llama.cpp — dieselbe Werkzeugkette
   wie whisper.cpp, liegt schon auf der SSD).
Ehrlichkeitsregel: Cluster bekommen keine erfundenen Genre-Namen —
erst Hörprobe je Cluster, dann benennt Caspar_D sie selbst.

### Werkstattbuch ausbauen (Notizen stehen seit 20.08.2026)
Notizen je Song laufen (Cap-Marke → Karteiblatt). Später: Notizen
durchsuchbar machen (Suchfeld), Export ins Karteiblatt der Bühne.

### Captions: schreiben lassen (später, Caspar_D 20.08.2026)
Die Caption-Anzeige steht (Cap-Marke + Fenster). Später: Claude auf
die Songs loslassen — neue Captions automatisch entwerfen, eine
Kommentar-/Reformulier-Funktion. „Nicht dringend."

### Zeitstaffel: das Jahr-Ende ausformulieren
zeitRelativ endet bei „vor x Jahren" — Caspar_D will da noch brainstormen
(Jahrestag? „vor 2 Jahren (Aug 2024)"? Saros-Zyklen?).

### Whisper in den Alltag (nach den Auffüll-Nächten)
Wenn `--alle` durch ist, rechnet Whisper nur noch NEUE Songs — nie
mehr als zwei am Tag. Dann: als Schritt in den Morgenlauf (oder
Nachtknopf), mit Zustand im Server statt nohup-Kette. Caspar_D,
20.08.2026: „kann man, muss man aber nicht dringend robust machen.
Später." Nach jedem Lauf: `bin/whisper-abgleich.js` für Songs, deren
Lyrics nachträglich kamen.

### Profil: Halbwertszeit und Gesamtkurven (wenn der Verlauf reift)
Der Zählerverlauf sammelt seit 20.08. täglich sauber (alle Ernten
werden eingewoben). In ~2 Wochen: Halbwertszeit je Song (nach wie
vielen Tagen die Hälfte der Plays da war) und Plays/Likes-Gesamtkurve
ins Profil. Und: Whisper-Gesamtqualität messen (Median-Versatz aller
Songs gegen v2), dann entscheiden, ob Whisper überall Voreinstellung
wird.

### „Sinus-Equalizer" — GEKLÄRT (20.08.2026)
Caspar_D hat nachgefragt: Tarja meinte ein **Spektrogramm** — falsche
Wortwahl. Das gibt es längst: der Analysemodus der Bühne zeichnet
FFT-Spektrogramme (links/rechts, Stereo-Differenz, Wasserfall), seit
dem 19.08. vorberechnet für alle Songs. Nichts zu bauen; ggf. Tarja
im START-HIER auf den Analyzer-Knopf hinweisen.

### Light/Dark Mode
KlangTresor färbt sich aus dem Cover, dunkler Grund. Ein heller Modus
müßte die Paletten neu ableiten; Cover auf Weiß sieht nach Laden aus,
nicht nach Bühne. Wenn: Systemthema lesen, nur leicht aufhellen.
Geringer Ertrag, hinten anstellen.

### Deutsch / Englisch
Rund 400 Texte in der Oberfläche. Ein Wörterbuch, kein Zweig je
Sprache — ein Tag. Erst, wenn jemand kommt, der kein Deutsch liest.

## Aus Tarjas erstem Testlauf (Discord, 23.08.2026)
Tarja (Linux, Firefox als Standardbrowser, CUDA-Rechner) hat KlangTresor installiert
und durchprobiert. Was dabei auffiel — Caspar_Ds Durchsicht, sortiert:

### Fremde Rechner: Annahmen über Caspar_Ds Mac
- [x] **Whisper-Pfade** — ERLEDIGT 23.08.2026: `bin/whisper.js` sucht der Reihe nach
  Umgebungsvariable, `library/modelle/`, `werkzeuge/whisper.cpp/`, den Suchpfad
  (`which`), die üblichen Systemorte — und erst zuletzt Caspar_Ds Bauplatz. Fehlt es,
  nennt die Meldung alle geprüften Orte und den einfachsten Weg. Ursprünglich: `bin/whisper.js` Zeile 65/67:
  Vorgabe `…/werkzeuge/whisper.cpp/…` ausserhalb des Projekts. Die
  Umgebungsvariablen `WHISPER_CLI`/`WHISPER_MODELL` überschreiben das, aber ohne
  sie findet niemand sonst etwas. Vorgabe sollte im Projekt liegen
  (`library/modelle/`), sonst mit klarer Anleitung überspringen statt still.
- [ ] **GPU wird nicht genutzt.** Bei Tarja bleibt der VRAM leer, alles rechnet
  auf der CPU (Musikstil über onnxruntime-node, Whisper). Sie baut Docker-Dateien
  mit CUDA; Caspar_Ds Wunsch dazu: ein **Rückfall auf CPU**, wenn CUDA fehlt — lieber
  langsam im Hintergrund als gar nicht.
- [x] **Token-Meldung** — ERLEDIGT 23.08.2026, mit wahrscheinlichem Auslöser:
  `browser/morgens.js` fragte an fünf Stellen `window.Clerk && window.Clerk.session`
  ab und gab SOFORT auf. Auf einer frisch geladenen Suno-Seite ist die
  Anmeldebibliothek aber erst nach Sekunden da — wer zu früh klickt, bekommt „nicht
  angemeldet", obwohl er es ist. Passt zu Tarjas „erst ging es, dann nicht". Jetzt
  wartet `tokenHolen()` bis zu acht Sekunden und unterscheidet zwei Fälle. Ob es IHR
  Fall war, zeigt erst ein Test bei ihr. Ursprünglich: Der Token selbst ist nicht das
  Problem (`bin/token.js` holt alle ~50 s einen frischen JWT); ablaufen kann das
  **Cookie** in `geheim/suno-cookie.txt`. Das erklärt Tarjas „erst ging es, dann
  nicht". Die Meldung muss sagen, was zu tun ist: Cookie abgelaufen, so erneuerst
  du es. (Der Token-Fall selbst **ruht** — dafür bräuchte es Tarjas Mitarbeit.)

### Sichtbares
- [x] **Roter Knopf dreht sich nicht** — ERLEDIGT 23.08.2026, und es war kein
  Browser-Unterschied: Der Knopf gehörte dem Morgenfenster. Er drehte nur, solange
  DASSELBE Fenster den Serverstand abfragte — nach einem Neuladen der Seite stand er
  still, obwohl im Hintergrund alles lief, und beim Schließen des Fensters wurde die
  Abfrage sogar abgebrochen. Das erklärt auch Tarjas Satz davor: „weiß aber auch
  nicht, ob er das gerade machen sollte." Jetzt hat der Knopf einen eigenen Wächter
  (`morgenKnopfPruefen`, alle 4 s solange etwas läuft), der beim Seitenstart und beim
  Schließen des Fensters anläuft. Sein Tooltip sagt gleich, was los ist: „Läuft
  gerade: Klanganalyse für neue Songs rechnen (Schritt 3 von 9) · seit 8 min —
  klicken zum Zusehen". Damit ist ein Teil des Statusdialogs schon erledigt.
- [ ] **Kein Statusdialog für die Hintergrundarbeit** (Caspar_D selbst im Thread:
  „ich muß wohl noch einen Statusdialog einbauen, damit man das on the fly im UI
  checken kann"). Man sieht nicht, was gerade läuft.
- [x] **Kachelrand** — ERLEDIGT 23.08.2026: `bewegtEinpassen()` misst nach dem
  Einblenden und schiebt das Video nur so weit, dass es im Fenster bleibt (gemessen:
  250 px Video auf 188 px Kachel lag bei −13 px, jetzt bei 8 px). Ursprünglich: — beim ersten Track jeder Zeile.
  Die Breite wird für das Seitenverhältnis des Videos korrigiert, aber am linken
  Rand fehlt die Verschiebung. Caspar_D hat die Korrektur zugesagt.
- [x] **Favicon** — ERLEDIGT 23.08.2026: ein Stern mit Hof als SVG in der Seite,
  ohne zusätzliche Datei. Ursprünglich: Es gibt nur `<link rel="apple-touch-icon" href="/avatar">`,
  kein gewöhnliches Icon für den Browsertab.
- [x] **„Cap"** — ERLEDIGT 23.08.2026: heißt jetzt „Text" (Sunos Beschreibung) bzw.
  „Notiz" (eigene), mit sprechendem Tooltip. Ursprünglich: — Tarja musste fragen (es heißt Caption).
  Ausschreiben oder Tooltip am Gegenstand.
- [ ] **Stimmerkennung** — Tarja: „konntest du immer noch nicht fixen oder?"
  Läuft in der Analyzer-Prüfung vom 23.08.

### Erklärungsbedarf
- [x] **Lesezeichen erklärt** — ERLEDIGT 23.08.2026: eigener Abschnitt in START-HIER,
  warum es einen Suno-Tab braucht, dass es nur liest, und was bei der Anmelde-Meldung
  zu tun ist. Ursprünglich: gehört nach START-HIER: Es nutzt den
  Session-Key desselben Browsers, listet die eigenen Links auf, und der rote
  Knopf holt damit alles. Tarja musste fragen.
- [ ] **Whisper nachholen**: dass die Morgenroutine das bei jedem Lauf prüft,
  sollte sichtbar sein (Tarjas Frage).

### Wünsche
- [ ] **Flotte statt einem Schiff** (Caspar_D, 23.08.2026, nach Tarjas Raben-Wunsch):
  Name frei wählbar, Form aus einer Liste, Statuszeile „Im Orbit um …" /
  „Im Transfer zu …" (letztere gibt es halb schon: beim Transit steht „Kurs auf X
  · 12 s", im Orbit bisher nichts).
  **Als Vektor, nicht als GIF:** Das Schiff besteht aus Canvas-Pfaden, dreht sich
  in Flugrichtung, skaliert mit dem Zoom und färbt seine Triebwerksglut nach dem
  laufenden Song. Ein GIF kann davon nichts mitmachen und müsste im Canvas erst in
  Einzelbilder zerlegt werden. Ein Rabe mit Flügelschlag ist als Vektor einfach
  (zwei Flügelpfade, Schlagwinkel als Sinus — und er darf schneller schlagen, wenn
  das Schiff beschleunigt).
  **Die zwei Größen fürs Zoom gibt es schon:** `zeichneSchiff` hat eine Stufe
  `detail` (unter der Schwelle nur ein weißes Dreieck, darüber Rumpf mit Gondeln).
  Jede neue Form braucht also beide Stufen — Silhouette für fern, Details für nah.
  Je Form eigene Antriebsregeln (der Rabe hat keine Düsen; sein Schweif wäre
  Federstaub).
  **Rechtlich trennen:** Buran, Sputnik, Apollo, Voyager, Challenger sind reale
  Raumfahrzeuge und dürfen nachgezeichnet werden — sie passen auch zur Kosmologie.
  Enterprise, Borg-Würfel, Todesstern, Millennium Falcon sind geschützte Designs
  (Paramount, Disney); privat egal, aber KlangTresor wandert gerade in die Community.
  Der Rabe ist eigene Form.
  Vorschlag fürs Bauen: erst Gerüst + Rabe + Sputnik — daran sieht man, ob die
  Formensprache trägt, bevor zehn Schiffe gezeichnet sind.
- [ ] „Wer hat geliked" — Tarja vermutet, dass das nur die iOS-App zeigt.


## Klangraum — offen nach der Kosmologie (22.08.2026)

Stand: Bahnmechanik abgenommen (Knoten-Impulse, Ankunft auf der
Zielschale, Schautafel bahn3d.html), Sternkanäle, Laden, Spur, Schweif,
Schiff hinter dem Stern. Details in KLANGRAUM.md. Offen:

### Verworfen (Caspar_D, 23.08.2026: „davon gar nix realisieren")
Expedition mit Mindestabstand, Logbuch → Playlist, Steckbrief des Neuen im
Morgenfenster — keine Expeditionslogbücher. Nicht wieder vorschlagen.

### Stilgruppen-Preset im EQ
karte.json trägt je Gruppe das 8-Band-Mittel (profil). Als Voreinstellung
im Equalizer: „wie die Gruppe klingt".

### Feineres Metal-Clustering
Die Metal-Gruppe ist groß; agglomerativ innerhalb der Gruppe nachteilen
(oder HDBSCAN an derselben Stelle in karte.js). Erst, wenn mehr Songs da
sind; Caspar_D will das am Bild entscheiden. (23.08.: „ja, vielleicht".)

### Spur-Leistung über lange Sitzungen
reiseSpuren wächst (Deckel 40 000 Punkte ≈ 3 h) und wird jedes Bild
gezeichnet; bei Bedarf ausdünnen (Douglas-Peucker) oder in ein
Offscreen-Bild backen, das nur bei Zoom/Drehung neu entsteht. Nur, wenn
es je ruckelt — bisher nicht aufgefallen (23.08.).

### Tempo-Übergang beim Absprung (das Raumschiff, nicht die Musik)
Transit-Tempo = Strecke/Restzeit; am Absprung springt das Tempo (kein
Positionsknick). Wenn es auffällt: kurzer Gleitübergang wie bei der
Ankunft. — Nicht zu verwechseln mit dem nächsten Punkt.

### Anschluss — Songs gehen ineinander über (Caspar_D, 23.08.2026)
Beim Hören am Stück (Caspar_D: „ich höre sehr oft viele Sachen am Stück") sollen
zwei Songs so aneinanderstoßen, wie ein DJ es machen würde: **tonhöhenfest**
im Tempo angenähert, im Takt eingesetzt. Name: **Anschluss** (Formen statt
Eigennamen — kein Segue, kein Crossfade). Im Player ein Schalter neben Zufall
und Schleife, der nur leuchtet, wenn er wirklich arbeitet.

**Caspar_Ds vier Fälle** — was gilt, hängt von den Rändern beider Songs ab
(Namen aus dem Entwurf, alle vier beschreiben die Form):
1. **Fortsetzen** — hartes Ende, harter Anfang: NICHT überblenden. Das Taktmaß
   läuft weiter, dazwischen steht genau ein leerer Takt, dann setzt der Neue
   auf der Eins ein.
2. **Ineinander** — beide Ränder blenden: einfach überlappen lassen, der Neue
   beginnt dort, wo der Laufende ins Ausblenden geht.
3. **Eintakten** — Fade-Ende, harter Anfang: den harten Zweiten so eintakten,
   dass er in den Ausklang des Ersten hineinspielt.
4. **Anschlagen** — hartes Ende, blendender Anfang: der erste harte Takt des
   Neuen setzt genau eine Taktzeit nach dem letzten hörbaren Schlag ein.
Greift keine Regel: schlichte Blende, ohne Tempoangleich.

**Wer trägt den Angleich — eine Regel, kein Schalter** (Caspar_Ds Einwand gegen
einen Modus-Knopf, 23.08.): Der laufende Song soll möglichst unberührt
bleiben, sein Ende kennt man.
- Abstand **unter 4 %**: der NEUE trägt es allein (am Anfang eines noch nicht
  im Ohr sitzenden Songs fällt das nicht auf; der Laufende bleibt original).
- Abstand **4 bis 8 %**: beide kommen sich entgegen, je die Hälfte.
- Abstand **über 8 %**: kein Angleich, nur die Regel ohne Tempo.
Ebenso ohne Regler: Ist ein Phrasenanfang (8/16 Takte, aus Sunos `abschnitte`)
in Reichweite, wird er dem bloßen Takt vorgezogen; die Rampenlänge ergibt sich
aus dem Abstand (kleiner Abstand = kurze Rampe). Bleibt überhaupt etwas
einzustellen, dann EIN Regler mit drei Stellungen (zurückhaltend · normal ·
mutig), der alle Schwellen gemeinsam verschiebt — Vorbild „Stärke" im
Gradationskompressor.

**Datenlage — gerechnet, nicht geschätzt (23.08.2026):** Sunos Schlagzeiten
liegen für alle 321 Songs im Katalog (`schlaege`: [Sekunde, Zählzeit 1..4]) —
ein Taktraster MIT Phase, keine BPM-Schätzung (Caspar_D misstraut BPM-Messungen;
Sunos Schläge sind die bessere Quelle). Tempo = Median der Schlagabstände:
Spanne 64–184 BPM, Median 104; **304 von 321 taktfest** (90-%-Abweichung
unter 6 %). Wie oft der Angleich greift, je nachdem was ein Song von seinem
EIGENEN Tempo abweichen darf:

| je Song | überbrückt | Album | Klangraum-Nachbarn |
|---|---|---|---|
| ±2 % | 4 % | 35 % | 33 % |
| ±3 % | 6 % | 46 % | 45 % |
| **±4 %** | **8 %** | **53 %** | **51 %** |
| ±6 % | 12 % | 74 % | 70 % |

±4 % je Song ist unhörbar und greift bei jedem zweiten Übergang — halbes,
doppeltes und Dreiviertel-Tempo sind mitgezählt, die passen taktweise auch.

**Das eine Bild** (aus drei Entwürfen destilliert, die alle zu voll waren —
`web/entwurf-uebergang-a|b|c.html`, wieder entfernt): die Naht als ein
liegendes Diagramm. Links die Hüllkurve des Laufenden, rechts die des Neuen,
**je in der Songfarbe** (Caspar_D), dazwischen die Naht als senkrechte Marke;
darunter das Taktraster beider Songs, mit sichtbarem Unterschied zwischen
klingenden und nur gezählten Schlägen; ganz unten die beiden Tempolinien, die
sich am Treffpunkt begegnen und danach zum eigenen Tempo zurückgehen. Dazu
Pfeile links/rechts zum Blättern durch die Warteschlange und ein Knopf
„Naht hören" (spielt nur die ~40 s um die Naht — sonst müsste man jedes Mal
einen ganzen Song abwarten). NICHTS zum Ziehen: es gibt am Übergang selbst
manuell nichts zu ändern, nur an den Prinzipien. Der geltende Fall in einem
Satz, die anderen drei hinter einem Aufklapper.
Ob das eine Studio-Lasche wird oder eher eine Schautafel wie bahn3d.html, ist
offen — das Tonstudio dreht am Klang EINES Songs, der Anschluss fügt zwei.

**Was fehlt (Bauaufwand):** ein ZWEITER Tonweg für die Überlappung — heute
hängt alles an dem einen Player der Albumseite. Eingriff in den Tonpfad, also
vorher ansagen. Offen dabei: wessen EQ/Kerbe während der Überlappung gilt
(Vorschlag: zwei Quellen mit eigener Korrektur, gemeinsam ab dem Kompressor).
Tonhöhenfestes Tempo gibt es schon (`audio.playbackRate` + `preservesPitch`,
der Tempo-Regler im Ghettoblaster macht genau das). Nur bei fortlaufender
Wiedergabe (Album, Klangraum-Reise), nicht bei Handwahl.

### Raumschiff: Verdeckung am Stern stimmt nicht (Caspar_D, 23.08.2026)
- [ ] **Die Dimmung ist falsch herum**: „vor dem Stern gefadet, hinter dem Stern
  volle Deckung" — es müsste umgekehrt sein. Vorn = klar und voll, hinten =
  verdeckt. Stand der Analyse: Die Schichtung ist richtig verkabelt
  (`karteschiffhinten` liegt im DOM vor `karteglut`, also darunter; `karteschiff`
  darüber), und `hinterStern()` (web/index.html ~5467) prüft rechnerisch das
  Richtige: `proj()` liefert in `q[3]` die gedrehte Tiefe, und wegen
  `f = KAMERA/(KAMERA − z)` bedeutet **größer = näher an der Kamera**; betrachtet
  werden nur Sterne mit größerem z. Verdacht daher woanders: Die Sternenbühne
  (`karteglut`) ist **transparent** — ein Schiff dahinter scheint überall dort
  durch, wo kein Stern und kein Nebel liegt, wirkt also „voll sichtbar", während
  der großflächige Nebel es an anderer Stelle dämpft. Zu prüfen mit einer
  Messung während einer echten Reise: Was liefert `hinterStern` in dem Moment,
  in dem Caspar_D das Schiff vor bzw. hinter dem Stern SIEHT?
- [x] **Canvas wird zu früh gewechselt** — behoben 23.08.2026: Der Wechsel richtete
  sich allein nach der Schiffsnase; der Schweif hängt aber hinterher und sprang
  komplett mit. Jetzt bleibt alles vorn, solange auch nur ein Teil des Schweifs
  noch vor dem Stern liegt. Dafür liegen die Sterne einmal je Bild in einem
  **Gitter** (Zellengröße = Lichthof-Durchmesser, Sterne außerhalb des Bildes
  fallen raus); eine Verdeckungsfrage kostet damit den Blick in neun Zellen
  statt einen Durchlauf über alle 321 Sterne (Caspar_Ds Einwand gegen die erste,
  umständliche Fassung: „du musst doch in der Projektion nur schauen, welche
  Sterne in der Nähe sind"). Gemessen: 34 Bilder/s während einer Reise.

### Schautafel als Entwicklerwerkzeug
web/bahn.html und web/bahn3d.html liegen im Paket (harmlos). Wenn Tarja
das nicht braucht: in paket.js ausschließen.

## Tonstudio — Störfrequenz-Kerbe (Caspar_D, 23.08.2026)
Idee: eine einzelne Störfrequenz (Brumm, Resonanz, Pfeifen) gezielt
mit einem schmalen Notch auslöschen — aber **automatisch erkannt**,
nicht von Hand gesucht. Weg: aus den vorberechneten Analysedaten (FFT-
Spektrogramm der Bühne, seit 19.08. je Song) schmale, über die Zeit
stehende Spitzen finden (Median-Spektrum, Peak > N dB über der
Nachbarschaft, Breite < ⅓ Oktave, Dauer > x % des Songs) und als
Vorschlag anbieten: „Kerbe bei 3,1 kHz, −12 dB, Q 12" als neunte Glocke
im Glockenstuhl (oder eigener Zweig, damit die acht Bänder unberührt
bleiben). Erst Erkennung als Liste im Studio-Fuß zeigen, dann der Knopf.
Caspar_D: „führt gerade zu weit" — nach dem B-Block.

## Docker und Einrichtungsskripte (23.08.2026)
Tarja hat die Docker-Dateien gebaut (`Dockerfile`, `docker-compose.yml`,
`docker-entrypoint.sh`) — Node 20 auf bookworm, weil onnxruntime-node nur
glibc-Binaries liefert; ffmpeg im Bild; `library/` und `geheim/` als Volumes,
damit das Archiv den Container überlebt; Healthcheck und
`restart: unless-stopped`.

Dazu Einrichtungsskripte im Wurzelverzeichnis — **je System eines für den
üblichen Weg und eines für Docker**, weil das Dateiformat zum System passen
muss (Caspar_Ds Einwand: „wie kann jemand, der Windows hat, ./einrichten-docker.sh
ausführen — das geht doch nicht"):

| System | üblich | Docker |
|---|---|---|
| macOS | `einrichten-macos.command` | `einrichten-docker.command` |
| Linux | `einrichten-linux.sh` | `einrichten-docker.sh` |
| Windows | `einrichten-windows.ps1` | `einrichten-docker.ps1` |

Die drei üblichen prüfen die Voraussetzungen, holen Pakete und Modelle, fragen
nach dem Alias, sammeln, laden und starten. Die drei Docker-Skripte prüfen, ob
Docker da ist und läuft, legen `library/` und `geheim/` an, bauen die Kiste,
warten auf den Server und verweisen dann in den Browser.

**Dabei eine Lücke geschlossen:** `bin/sammeln.js` fand den Handle nur im
Argument oder im schon vorhandenen Katalog — nicht in `library/konfig.json`,
wo die Oberfläche ihn ablegt. Beim ERSTEN Lauf über den roten Knopf (Server
ruft ohne Argument auf, Katalog noch leer) brach es deshalb ab. Genau der
Moment, in dem Docker seinen Vorteil ausspielen soll. Jetzt ist die Konfig die
dritte Quelle.

Offen:
- [ ] Den Docker-Weg einmal wirklich durchspielen (auf diesem Mac ist Docker
      nicht installiert; geprüft sind nur Syntax und Logik).
- [ ] `einrichten-windows.ps1` und `einrichten-docker.ps1` sind ungetestet —
      hier gibt es kein PowerShell. Casto könnte beide prüfen.


---

## Entscheidungen und ihre Folgen (Caspar_D, 26.08.2026)

Entstanden aus dem Register „Woran es liegt". Dort werden bisher nur
vier Handlungsgrößen zerlegt — Songzahl, wem jemand folgt, Playlists,
Personas. Caspar_D hat die Liste weitergedacht:

> „was man noch bräuchte, abstand zwischen Songpublikationen vielleicht.
> oder ob songs abends publiziert wurden oder besser morgens. welche
> Entscheidungen gibt es: lange songs zu machen / wann sie publizieren /
> wieviel Zeit zwischen den Publikationen / wieviele Songs publizieren /
> wievielen Leuten folgen / wie oft kommentieren. das sind alles
> Entscheidungen, die Folgen haben, gibt es noch mehr"

**Heute nicht mehr** — hier liegt es, damit es nicht verlorengeht.

### Die Datenlage, und warum sie den Weg vorgibt

| | eigene 321 Songs | die 186 Nachbarn |
|---|---|---|
| Songlänge | ✅ `dauer` | ❌ |
| Publikationszeit | ✅ auf die Sekunde | ❌ |
| Abstand zwischen Stücken | ✅ | ❌ |
| Anzahl Songs | — (nur ein Autor) | ✅ |
| wem jemand folgt | — | ✅ |
| wie oft kommentiert wird | ✅ aus `reaktionen.ndjson` | ❌ |

Von den Nachbarn liegt nur die Profil-**Zusammenfassung** vor. Alle
Fragen nach Zeitpunkt, Abstand und Länge brauchen die **Songlisten** —
und die holen `community-profile.js` und `community-hirsch.js` nicht,
obwohl der Endpunkt sie mitliefert (`created_at`, `duration`,
`upvote_count` je Clip).

**Was ein Lauf kostete:** eine Seite je Person, also rund 186 Anfragen,
bei 1,5 s Abstand etwa fünf Minuten — für ungefähr 3.700 Songs von 186
Autoren. Erst damit ließe sich sagen, ob abends besser ist als morgens.
Bei einem einzigen Autor bleibt es Selbstbeobachtung.

### Die Liste der Entscheidungen, erweitert

**Zeitliches:** Tageszeit · Wochentag · Abstand zwischen Stücken ·
**stoßweise oder gleichmäßig** — fünf Songs an einem Tag und dann drei
Wochen nichts, gegen alle zwei Tage eines.

**Am Werk:** Länge · instrumental oder mit Gesang · Sprache des Textes ·
Nische oder Streuung über Genres · Fortsetzungen und Serien gegen
Einzelstücke · eigenes Cover oder das voreingestellte · Titellänge.

**Im Umgang:** zurückfolgen oder nicht (die Reziprozitätsquote) · auf
Kommentare antworten · wie oft selbst kommentieren · in fremden
Playlists auftauchen.

**Was sonst niemand fragen kann:** Lautheit, Tempo, Tonart und
Stimmlage liegen für alle 321 eigenen Songs gemessen vor. Ob laut
gemastertes Material mehr Plays bekommt, kann außer uns niemand
untersuchen — Suno zeigt es nicht, der Hub misst es schwächer.

### Der Fallstrick, der vor jeder dieser Rechnungen steht

**Plays wachsen mit dem Alter.** Ein Song vom März hatte fünf Monate
Zeit, einer von gestern einen Tag. Ohne Alterskorrektur mißt man nur,
welche Songs älter sind — und findet „morgens ist besser", wenn früher
morgens veröffentlicht wurde. Jede Auswertung braucht deshalb entweder
eine Normierung auf die Standzeit oder einen Vergleich innerhalb
gleicher Zeitfenster.

Dazu gilt weiter, was schon unter dem Register steht: **Ein Anteil ist
keine Ursache.** Aus einer Momentaufnahme läßt sich die Richtung nicht
klären.


## WAV-Dateien für neue Songs — Weg ist zu (27.08.2026)

Caspar_D: *„wir werden uns darum kümmern müssen, nachträglich
wav-Dateien in unser Repo zu legen."*

**Stand:** 321 von 321 Songs im Katalog haben ihr WAV, lückenlos. Der
neueste Song ist vom 17.08. — dem Tag vor dem Nachtlauf. Es fehlt also
derzeit nichts; sobald neue Songs dazukommen, fehlt es.

**GELÖST am selben Abend — von Tarja.** Sie kennt den Endpunkt, den
Sunos eigene Website benutzt: `GET studio-api.prod.suno.com/api/download/clip/<id>?format=wav`
liefert eine signierte S3-Adresse, die ohne Token ladbar ist. Nachgeprüft
und bestätigt, Beschreibung in `WAV-PROTOKOLL.md`. Der Download zählt
damit als offiziell — genau das, was ab 3. September für die Limits
zählt.

Was jetzt noch zu tun ist:

1. `bin/wav.js` auf den neuen Weg umstellen: Token besorgen (Browser
   oder übergeben), `/api/download/clip/` abfragen, pollen bis `ready`,
   dann die S3-Adresse laden — letzteres kann Node direkt.
   **Die Signatur gilt nur eine Stunde**, also je Datei kurz vor dem
   Laden anfordern, nicht alle auf Vorrat.
2. Das Kreuzchen im Lesezeichen (Beschreibung unten) — es wird
   einfacher als gedacht, weil derselbe Aufruf Anstoßen und Laden in
   einem erledigt. Ein getrenntes `convert_wav` braucht es nicht mehr.

---

**Das ursprüngliche Problem (überholt):** Der Weg aus `WAV-PROTOKOLL.md` funktioniert nicht mehr.
`cdn1.suno.ai/<id>.wav` liefert 403 statt 206, auch für Songs, deren WAV
wir besitzen. Mit `Authorization`-Header kommt die Anfrage gar nicht
durch (CORS-Vorabruf). `/api/gen/<id>/` gibt 404. Und `media_urls` in
`/api/clip/<id>` listet nur noch `m4a-opus` und `mp3`.

**Was zu tun wäre, in dieser Reihenfolge:**

1. Auf einer eigenen Songseite einen WAV-Download anstoßen und den
   Netzwerkverkehr mitschreiben. Das zeigt den heutigen Endpunkt.
2. Prüfen, ob `POST /api/gen/<id>/convert_wav/` noch antwortet. Nicht
   ungefragt — ab September zählt jede Erzeugung gegen das Kontingent
   (30 bzw. 60 je nach Plan, darüber wird extra abgerechnet).
3. Erst dann das Kreuzchen im Lesezeichen bauen (siehe unten).

**Der Plan für das Lesezeichen**, sobald der Weg wieder steht:

- Ein Kreuzchen in `browser/02-sammeln.js`, **standardmäßig aus**, mit
  einer Zahl daneben: wieviele Anstöße höchstens.
- **Neueste zuerst** (Caspar_D). Der Nachtlauf im August lief umgekehrt,
  aber das war Aufholen, kein laufender Betrieb.
- Vorher prüfen, welche WAVs schon existieren, und nur die fehlenden
  anstoßen — das spart Kontingent. Ob das cross-origin lesbar ist, war
  am 27.08. gegeben (`type: cors`, Status lesbar).
- **Kein Filter für Studio-Generierungen** — die kann man anstoßen, ohne
  daß es berechnet wird.
- Ein Monatszähler wäre nützlicher als ein starres Limit. Offen: wo er
  lebt — im `localStorage` der Suno-Seite oder in den Metadaten, die
  KlangTresor führt.

Das Lesezeichen hat den Token ohnehin (`window.Clerk.session.getToken()`
für die Metadaten); der Anstoß wäre kein neuer Mechanismus, sondern
zwanzig Zeilen im vorhandenen Skript.

---

## Bewegte Standbilder — 236 Songs ohne Video-Artwork

Aus dem Cover ein zehn Sekunden langes Bewegtbild rechnen, das sich zur
Musik regt. Keine fremde KI, kein Generator: Die Bewegung kommt aus
Zahlen, die längst im Katalog stehen.

**Entwurf und Werkbank liegen in `docs/entwuerfe/bewegtbild/`** — mit
Renderer, Reglern und einem Werkzeugkasten zum Drehen im Browser.

### Woher alles kommt

Für **alle 321 Songs** liegt vor, was gebraucht wird:

- `schlaege` — Sunos Schlagzeiten als `[zeit, zählzeit]`, die Eins des
  Takts ist Zählzeit 1
- `farben.akzent` / `akzent2` und die Tonliste aus dem Cover
- das Cover selbst

Der erste Anlauf am 26.08. rechnete die Hüllkurven aus den
Instrumentspuren. Das war der Umweg: **Sunos Schlagzeiten sind genauer,
liegen für jeden Song vor und kosten keine 85 MB je Stück.** Sie standen
die ganze Zeit im Katalog — `bin/katalog.js` nimmt sie beim Verschlanken
heraus, deshalb sind sie in der Browserfassung nicht zu sehen.

### Was probiert wurde

| | Bewegung woher | Befund |
|---|---|---|
| A | Ken Burns, nur Zeit | funktioniert überall, austauschbar |
| B | Baß-Hüllkurve → Zoom | zu subtil bei durchgehend kräftigem Baß |
| C | Trommel-Anstiege → Helligkeit | Caspar_Ds Wahl am 26.08. |
| D | alle drei zusammen | unentschieden |
| E | Puls nur in der Korona | **zu speziell** — brauchte eine von Hand gesuchte Stelle im Bild |
| F | schlagendes Rescale | generisch, läuft auf jedem Cover |
| G | Farbwechsel Akzent 1 → 2 | generisch, aber siehe unten |

Caspar_D, 27.08.2026: „das muß generischer werden, sowas spezielles
sollten wir nicht machen." E war der Wendepunkt — dort mußte die
Leuchtstelle im Bild gesucht werden, und sie saß erst 13 px daneben.
F und G brauchen keinen Blick ins Bild.

### Vier Befunde, die beim Bauen herauskamen

**Die Akzentfarben taugen nicht als Paar.** Median-Farbtonabstand
zwischen `akzent` und `akzent2`: **13 Grad**. Bei 13 % der Songs sind
sie identisch, bei 53 % unter 15 Grad. Über die Hälfte hätte einen
Wechsel, den man nicht sieht. Die beiden Felder sind offenbar als
UI-Paar gedacht, nicht als Kontrast. Deshalb der Regler
`mindestAbstand`: Darunter wird die zweite Farbe gedreht — dann kommt
sie allerdings nicht mehr aus dem Bild. **Offen:** ob das der richtige
Weg ist oder ob eine dritte Quelle besser wäre.

**Die Schleife muß einrasten.** Eine Wechselperiode, die sich nicht
ganzzahlig in die zehn Sekunden teilt, endet in einer anderen Farbe als
sie anfing — gemessen sprang die Naht um 13,3, mehr als die halbe
Wanderung selbst. Jetzt wird die gewünschte Periode auf den nächsten
Teiler der Laufzeit gerundet; Naht 0,28.

**Dunkle Cover nehmen kaum Farbe an.** Die Tönung wird mit der
Bildhelligkeit multipliziert — was dunkel ist, bleibt dunkel. Bei „Lea
Moreau" (Helligkeit 0,36) liegt die gemessene Bewegung **unter der
Grundlinie**, die ein reines Standbild allein durch x264-Rauschen
erzeugt. Der Regler „Dunkle Cover ausgleichen" hebt an, ist aber noch
nicht durchdacht. **Das ist der wichtigste offene Punkt.**

**Zehn Sekunden sind die Grenze.** Caspar_D, 27.08.2026: „nicht länger
als 10 sec, sonst lehnt suno das als cover art video ab."

### Was noch fehlt

- Die Dosierung an der Bildhelligkeit ausrichten
- Serienlauf über die Songs ohne Bewegtbild
- Der Weg in KlangTresor: Die Regler gehören ins Notizfenster neben
  „Mein Artwork", das Ergebnis als `eigen.mp4` in den Weg, den es
  schon gibt
- Ob der Ausschnitt an einer Takt-Eins beginnen sollte — dann wäre die
  Schleife auch musikalisch geschlossen, nicht nur farblich

### Eine Messfalle, die dreimal zugeschlagen hat

Ein reines Standbild zeigt bei `tblend=difference` eine mittlere
Änderung von **1,97**, nicht 0 — x264 kodiert es nicht bitgleich. Ohne
diese Grundlinie liest man jede Messung zu hoch. Und `metadata=print`
schreibt nach stderr; mit `-loglevel error` kommt gar nichts an, was wie
„keine Bewegung" aussieht statt wie „nicht gemessen".

---

## Fremde Songs im Tresor — Tarjas Vorschlag

Tarja, 28.08.2026: „hier (mit dem Text/Notizabzeichen auf dem artwork)
kann man zwar was ZUM Song anpassen, aber keinen NEUEN generieren,
welcher nicht bei Suno ist hinterlegen. hierfür wäre vielleicht ganz
unten, rechts neben dem letzten Song eine eigene große Kachel ‚neuen
Song hinzufügen' cool. Alternativ, und vermutlich zugänglicher links
neben dem roten Kreisel ein schwarzes +"

Caspar_Ds Antwort, 28.08.2026: „Neue und andere Songs wären ein ganz
anderes Kaliber. Sie fügen sich nicht mehr in das Suno Konzept ein, wir
hätten keine Schlagdaten mehr, keine Suno-Text/Zeitanker, keine
identisch generierte Hüllkurve, Abschnittswechsel und vieles mehr —
aber, den Klangtresor für eine ganze lokale Mediensammlung zu öffnen ist
natürlich durchaus reizvoll und über das Naheliegende nachzudenken auch
nicht verboten. Aber das wäre ein grösseres Projekt, von dem ich noch
nicht weiß, ob ich es angehen möchte."

**Was tatsächlich wegfiele**, wenn ein Song nicht von Suno kommt — und
was davon zu ersetzen wäre:

| | fällt weg | Ersatz denkbar? |
|---|---|---|
| Schlagzeiten | ja | ja, aber selbst gerechnet und ungenauer |
| Wort-Zeitmarken fürs Karaoke | ja | Whisper kann es, läuft schon |
| Abschnittswechsel | ja | nur geraten |
| Lyrics, Prompt, Modell | ja | von Hand |
| Plays, Likes, Kommentare | ja | entfällt ersatzlos |
| Lautheit, Tonart, Klangraum | **nein** | rechnet KlangTresor selbst |

Der Klangraum, die Analyse und das Tonstudio arbeiten am Ton, nicht an
Sunos Angaben — die liefen weiter. Was fehlte, ist alles, was Suno
*über* den Song weiß.

**Zwischenweg, den Caspar_D vorgeschlagen hat:** eine Suno-ID eines
privaten Songs angeben können. Das geht heute schon über den Umweg
einer Playlist — die Frage an Tarja ist, ob das reicht.

**Wenn es doch angegangen wird**, ist der Einstiegspunkt eher der zweite
ihrer Vorschläge: ein Pluszeichen neben dem roten Knopf. Eine Kachel
„ganz unten rechts" wandert mit jeder Sortierung woanders hin und ist
bei 321 Songs weit weg.

---

## Die Gegenprobe mit einem zweiten Mikrofon

**Die offene Frage vom 27.08.:** Die Messung zeigte, daß die HomePods ab
50 % Lautstärke den Baß zurücknehmen (25 %: Bezug, 40 %: −0,4 dB,
50 %: −3,6 dB, 63 %: −7,0 dB). Offen blieb, ob die Begrenzung im
Lautsprecher sitzt oder ob das Mikrofon überfordert war. Für den
Lautsprecher spricht die Form — Absenken ohne Oberwellen — und der
Kopfraum von −15,5 dB.

**Der Weg dahin braucht kein besseres Mikrofon, sondern ein anderes.**
Zeigen zwei verschieden gebaute Wandler denselben Abfall an derselben
Stelle, liegt er nicht am Mikrofon; so etwas passiert nicht zufällig
zweimal gleich. Zeigt der zweite ihn nicht, war der erste überfordert.
Kalibrierung braucht es dafür nicht.

### Was schon dasteht

Caspar_D, 28.08.2026: „also wir haben schon jetzt mehrere Mikrophone."

| | in der Güteliste | Bauart |
|---|---|---|
| **TONOR TM20** | 100, „Studiomikrofon am USB-Wandler" | USB-Kondensator, eigener Wandler |
| **iMac-Array** | 40, „eingebautes Array mit fester Störunterdrückung" | mehrere Kapseln, Signalverarbeitung |
| **Webcam** | 20, „Webcam-Mikrofon, auf Sprache getrimmt" | eine Kapsel, auf Stimme entzerrt |

Die drei sind so verschieden gebaut, wie man es sich für eine
Gegenprobe wünscht. **Die Messung vom 27.08. lief über das TONOR TM20** —
das steht in `library/messungen/2026-08-27-befunde.json`.

Das schwächt den Vorbehalt bereits: Ein TM20 hat reichlich Kopfraum, und
bei Zimmerlautstärke ist es weit von seiner Grenze entfernt. Die
Vermutung „Mikrofon überfordert" war naheliegend, aber sie paßt schlecht
zu dem Gerät, das tatsächlich gemessen hat.

### Was zu tun wäre

Denselben Sweep über alle drei Mikrofone, sonst nichts verändert. Dann:

- **Sehen alle drei den Abfall ab 50 %?** Dann sind es die HomePods, und
  der Vorbehalt ist erledigt.
- **Die Differenz zweier Läufe** zeigt zwar nicht, welches Mikrofon recht
  hat, aber wo sie sich unterscheiden. Ist sie über weite Strecken flach,
  sind beide dort brauchbar; wo sie auseinanderläuft, ist mindestens
  eines schlecht. Das ist auch ohne Kalibrierdatei aussagekräftig.

Im Panel fehlt dafür der Vergleich zweier gespeicherter Läufe. Das
Mikrofon wird in der Messung schon vermerkt, die Daten liegen also
richtig — es fehlt nur die Gegenüberstellung.

### Das iPhone — und was es zusätzlich kann

Caspar_D, 28.08.2026: „und mein iphone könnte ich auch verbinden und als
mikrophon benutzen."

Steht bereits in `MESS_GUETE` mit 60 Punkten, „Telefon per Continuity,
mit Funkstrecke" — über dem iMac-Array, unter dem TONOR. Der Abzug gilt
der Funkstrecke, nicht der Kapsel; die ist bei Apple ordentlich. Was
dabei durch Apples Signalverarbeitung läuft, weiß man allerdings nicht.

**Der eigentliche Gewinn ist nicht die Gegenprobe, sondern der Ort.**
Ein Mikrofon ohne Kabel läßt sich hinstellen, wohin man will — und
Raummoden hängen genau davon ab. Eine stehende Welle hat Knoten und
Bäuche: Am Bauch mißt man sie kräftig, am Knoten gar nicht. Alles, was
das Panel bisher über Moden sagt, stammt von **einem** Ort.

Damit wären Messungen möglich, die es bisher nicht gab:

- **Dieselbe Frequenz an mehreren Orten.** Fällt der Pegel an einer
  Stelle im Raum ein, während er zwei Meter weiter steht, ist die Mode
  bestätigt — und man weiß, wo man nicht sitzen sollte.
- **Hörplatz gegen Raummitte.** Der Unterschied sagt, wieviel von dem,
  was man hört, der Raum ist und nicht der Lautsprecher.
- **Nah am Lautsprecher.** Dort ist der Raum fast draußen. Was dort
  schon abfällt, kommt aus dem Gerät — das beantwortet die Baßfrage
  vom 27.08. direkter als jede Gegenprobe mit zwei Mikrofonen.

Der letzte Punkt ist der stärkste: **Aus 20 cm Abstand gemessen** ist
der Raumanteil so klein, daß ein Baßrückgang nur noch vom HomePod kommen
kann. Dafür braucht es weder Kalibrierung noch ein zweites Gerät,
sondern nur ein Mikrofon, das man dorthin bringen kann.

### Das Onkyo-Einmessmikrofon

Caspar_D hat eines vom AV-Receiver, muß es aber erst suchen
(28.08.2026). Seine Sorge: „das ding hat, fürchte ich, aber überhaupt
keine Frequenzwahrnehmung sondern nur trivial loudness."

Das trifft nicht zu — ein Mikrofon kann gar nicht anders, als den ganzen
Frequenzbereich zu übertragen; „nur Lautstärke" wäre eine Auswertung im
Receiver. Und der wertet mehr aus: AccuEQ stellt einen Equalizer ein,
dafür muß es Frequenzgänge messen; die älteren Onkyos mit Audyssey
nehmen die komplette Impulsantwort auf.

Was zutrifft: Es kommt **ohne Kalibrierdatei**, und bei einem billigen
Elektret weiß man nicht, wo es danebenliegt. Für eine Gegenprobe reicht
es trotzdem — dort zählt Verschiedenheit, nicht Genauigkeit.

**Hürde ist der Anschluß:** meist 3,5-mm-Mono-Klinke mit
Speisespannung aus dem Receiver. Der Mac-Kombianschluß ist auf Headsets
ausgelegt und erkennt einen Mono-Stecker oft nicht. Erster Test:
einstecken und sehen, ob es in der Mikrofonliste auftaucht. Wenn ja,
gehört sein Name in `MESS_GUETE` — heute liefe es als „unbekanntes
Gerät" mit 50 Punkten, zwischen iMac-Array und Studiomikrofon.

---

## Was andere besser können — GitHub-Recherche vom 28.08.2026

Caspar_D: „wer sich mit Songanalyse beschäftigt und ob die featurelisten
Blender sind oder ob tatsächlich ausgefeilte Verfahren, die besser als
unsere sind, dahinterstecken."

Antwort in einem Satz: **Die Bibliotheken sind kein Vorsprung, die
Forschungsgruppen schon — und zwar genau dort, wo wir bisher Suno
fragen.**

### Das Feld

| Gruppe | wer | was davon zu halten ist |
|---|---|---|
| Werkzeugkästen | librosa (8.578★), essentia (3.706★), aubio (3.754★), audioFlux (3.352★) | Bausteine, keine Verfahren. Lange Feature-Listen, aber da steht nur, was DSP eben kann. Essentia kennen wir — der Klangraum läuft auf deren Modellen. |
| Forschungscode | beat_this (374★), madmom (1.702★), BeatNet (515★), msaf (557★) | **Echte Substanz.** ISMIR-Papers, Meßzahlen, Vergleiche gegen Vorgänger. |
| Anwendungen | AudioMuse-AI (2.500★) | Uns am nächsten: lokale Bibliothek, Analyse, Playlists, ohne fremde Dienste. Ernsthafte Modellwahl. |

### Der wichtigste Fund: Downbeat ist lösbar

**[beat_this](https://github.com/CPJKU/beat_this)** (CPJKU Linz, ISMIR
2024, „Beat This! Accurate Beat Tracking Without DBN Postprocessing"):
Neuronales Netz auf Spektrogrammen, auf GTZAN **F1 88,9 % für Beats und
75,5 % für Downbeats**. Ein Nachfolger (BeatFM, 2026) kommt bei
Downbeats auf 79,6 %.

**Downbeat heißt: welcher Schlag ist die Eins.** In
`docs/KlangTresor-generalisieren.md` stand, das sei „nicht abzuleiten,
sondern gewußt". Das war falsch, und es ist der Grund, warum sich diese
Recherche gelohnt hat: Der teuerste Verlust bei einem Song ohne
Suno-Herkunft ist ersetzbar. Nicht gleichwertig — Suno *weiß* es, ein
Netz schätzt —, aber drei von vier richtig ist weit besser als nichts.

Es gibt einen [C++-Port](https://github.com/mosynthkey/beat_this_cpp),
läuft also ohne Python-Umgebung.

### Der zweite Fund: CLAP kann, was unser Klangraum nicht kann

AudioMuse-AI benutzt neben MusiCNN ein **CLAP**-Modell — Audio und Text
im selben Einbettungsraum, 512 Dimensionen, als ONNX. Damit findet man
Songs über eine Beschreibung: „ruhig, Streicher, langsam".

Unser Discogs-EffNet liefert feste Etiketten aus einer Liste. Es kann
sagen, was ein Song *ist*, aber nicht auf eine freie Frage antworten.
Das ist ein echter Vorsprung, und technisch nachvollziehbar: auch ONNX,
auch lokal, auch ohne Dienst.

Der Rest ihrer Kette zum Vergleich: Whisper-small für Lyrics, Silero für
Sprachaktivität, scikit-learn zum Clustern, UMAP/PCA zur Projektion —
und eine **evolutionäre Suche** über hunderte Cluster-Läufe mit sieben
Fitness-Maßen. Mehr Aufwand als unser UMAP; ob besser, ist offen. Vor
allem ist es teurer.

### Wo wir stehen

**Tonart:** Unser Verfahren mißt mit Goertzel bei jeder einzelnen
Halbtonfrequenz statt mit FFT-Chroma, und aus der Baßspur statt aus dem
Vollmix. Das ist aufwendiger als das, was libKeyFinder oder essentia
standardmäßig tun.

**Clustering:** `docs/CLUSTERING-RECHERCHE.md` hält den Fehler fest, den
beide Seiten vermeiden — nicht auf der 2-D-Karte clustern, sondern auf
den Einbettungen.

**Und etwas, das dort niemand hat:** das Einmessen. Kein Projekt aus
dieser Recherche mißt den Raum, in dem gehört wird. Das ist kein
Versäumnis, sondern ein anderes Fach — dafür gibt es REW. Aber die
Verbindung aus Songanalyse *und* Wiedergabekette gibt es sonst nicht.

### Was zu tun wäre, in dieser Reihenfolge

1. **beat_this als Rückfallebene** für Songs ohne Suno-Schlagzeiten.
   Betrifft die Taktbahn, die Notenzonen, „Signal zwischen
   Taktschlägen" und die bewegten Standbilder — alles, was heute
   ausfiele.
2. **CLAP neben Discogs-EffNet**, nicht als Ersatz, sondern für die
   Suche. „Zeig mir etwas Ruhiges mit Streichern" kann das Archiv heute
   nicht beantworten.
3. **msaf** für Abschnittsgrenzen, falls die Suno-Angaben je fehlen —
   nachrangig, weil ohne Text ohnehin nur zu raten ist, was Strophe und
   was Refrain heißt.

---

## Einmessen: was die Welt besser macht — Recherche vom 28.08.2026

Caspar_D: „einmessen, anderes Thema, gleiches Vorgehen, schau github an,
was uns weiter hilft."

Ein Fund überholt alles andere, und er betrifft ausgerechnet die Frage,
die seit dem 27.08. offen ist.

### Farinas Sweep — Frequenzgang und Klirr in einem Durchgang

Angelo Farina, *Simultaneous measurement of impulse response and
distortion with a swept-sine technique*, AES-Konvention 108 (2000).
Nachzulesen unter
[angelofarina.it](https://www.angelofarina.it/Public/Presentations/AES122-Farina.pdf).

**Der Kniff:** Bei einem **exponentiellen** Sweep — nicht bei einem
linearen — erscheinen die harmonischen Verzerrungen nach der Entfaltung
als **eigene Impulsantworten, zeitlich vor der Hauptantwort**. Sie lassen
sich einzeln herausschneiden: k2, k3, k4 je für sich, mit eigenem
Frequenzgang.

Was das für uns heißt:

- **Die HomePod-Frage wird nebenbei beantwortet.** Am 27.08. blieb offen,
  ob die Bässe ab 50 % begrenzt oder nur zurückgenommen werden.
  Kompression ohne Klirr sieht anders aus als ein überfahrener
  Verstärker — und der Klirranteil fällt bei dieser Methode ohne
  zusätzlichen Meßlauf an, aus derselben Aufnahme.
- **Rund 20 dB mehr Dynamik als MLS.** Unser Störabstand lag je Band bei
  14,2 dB, und das war der Grund für die lange Mittelung. Hier läge
  Reserve.
- **Ein Durchgang statt zwei.** Keine zusätzliche Stille, keine zweite
  Bitte an den Nutzer.

### Die Normen, an denen wir uns ausrichten sollten

[**phonometry**](https://github.com/jmrplens/phonometry) (108★) ist
standardkonform gebaut und nennt, woran man sich hält:

| Norm | wofür |
|---|---|
| **ISO 3382-1/2** | Raumakustik aus Impulsantworten |
| **IEC 61260-1** | Oktav- und Terzbänder |
| **IEC 61672-1** | Bewertungsfilter |
| IEC 60268-16 | Sprachverständlichkeit (STI) |

Und die Kennzahlen, die ein Raum hat:

- **EDT, T20, T30** über **Schroeder-Integration** — rückwärts
  integrierte Abklingkurve, nicht Abklingen nach Augenmaß
- **C50 / C80** (Klarheitsmaß): das Verhältnis von früher zu später
  Energie, in dB. Sagt, ob ein Raum Sprache oder Musik trägt.
- **Deutlichkeit D**

Der Code ist Python und für uns nicht direkt brauchbar. Der Wert liegt
in der Liste: Sie sagt, **welche** Kennzahlen es gibt und **wie** man
sie richtig rechnet. Unsere Modenerkennung arbeitet bisher ohne solchen
Bezug — Güte über `Q ≈ π·f·RT60/6,9` geschätzt, RT60 selbst geraten.

### Daß es im Browser geht, ist bewiesen

[**Broom**](https://github.com/DanielRudrich/Broom) (60★) mißt
Raumimpulsantworten vollständig im Browser: Sweep erzeugen, aufnehmen,
entfalten, herunterladen. Kein Server, kein Plugin. Dieselbe
Beschränkung, unter der wir arbeiten — und dieselbe Lösung.

### Was nicht hilft, und warum

- [**CamillaDSP**](https://github.com/HEnquist/camilladsp) (1.044★) und
  [DecayCore](https://github.com/VilhoValittu/DecayCore): FIR-Filter und
  Faltung in Echtzeit, also die *Korrektur*. Wir haben unseren
  Equalizer, und er sitzt an der richtigen Stelle in der Kette.
- [**Impulcifer**](https://github.com/jaakkopasanen/Impulcifer) (288★):
  binaurale Antworten für Kopfhörer-Virtualisierung. Anderes Ziel.
- Die Simulatoren (gpuRIR 611★, pffdtd, wayverb): rechnen Räume aus
  Geometrie, statt zu messen. Für uns umgekehrt herum.

### Der Hebel: ein Schritt, viele Kennzahlen

Wir messen bereits Sweeps. Was fehlt, ist **die Entfaltung zur
Impulsantwort**. Daraus kommt danach alles:

- Nachhallzeit nach Norm statt geschätzt
- Klarheit C50/C80 — Kennzahlen, die wir gar nicht haben
- Klirr je Harmonische, ohne Mehraufwand
- Reflexionen mit Laufzeit und Pegel, statt nur als Kammfiltermuster
- Moden mit belegter Güte statt mit geschätzter

**Es ist kein neues Meßverfahren, sondern eine andere Auswertung
dessen, was ohnehin aufgenommen wird.** Zwei Änderungen: Der Sweep muß
exponentiell sein statt linear, und das Ergebnis wird entfaltet statt
nur spektral betrachtet.

### Reihenfolge

1. **Sweep auf exponentiell umstellen** und entfalten. Ab da liegt eine
   Impulsantwort vor, und die Auswertungen lassen sich einzeln
   nachziehen.
2. **Klirr je Harmonische** herausschneiden — beantwortet die
   HomePod-Frage.
3. **RT60 nach ISO 3382** über Schroeder-Integration, dann bekommt auch
   die Modengüte ihren Bezug.
4. **C50/C80** dazu, mit Erklärung im Panel.

---

## Das Ohr einmessen — Recherche vom 28.08.2026

Caspar_D: „wenn wir Räume vermessen müssen wir auch Ohren vermessen. Im
Alter nimmt die Hörfähigkeit anfangs bei den hohen Frequenzen massiv ab.
… wie wir bspw bei der Kopfhörernutzung einen Hörtest a la Apple air
pods pro 3 machen können und die Ergebnisse zum kalibrieren des EQs
benutzen können."

Der Gedanke ist richtig: Eine eingemessene Kette endet am Trommelfell,
nicht am Lautsprecher. Was danach kommt, ist die größte
Einzelabweichung der ganzen Übertragung — und die einzige, die sich
nicht ersetzen läßt.

### Erster Befund: hier hilft GitHub nicht

Der größte Treffer im ganzen Feld hat **84 Sterne**
([woheller69/audiometry](https://github.com/woheller69/audiometry), eine
Android-App). Alles andere liegt im einstelligen Bereich. Audiometrie
ist medizinisch-kommerziell besetzt; es gibt nichts Ausgereiftes zum
Übernehmen. Was es gibt, sind zwei brauchbare Ideen und viel
Fachliteratur.

### Falle 1: Wir kennen den Absolutpegel nicht

Ein Browser weiß nicht, wieviel Schalldruck bei einem gegebenen
Zahlenwert aus dem Kopfhörer kommt. Die Zahlen dazu sind unangenehm:

- Standardabweichung durch **Kalibrierfehler allein: 6,2 dB**
- Selbstdurchgeführte Tests weichen im ruhigen Raum um **>8 dB HL** ab,
  in normaler Umgebung um **>14 dB**

Eine Aussage wie „du hast 30 dB Verlust bei 6 kHz" wäre damit nicht zu
halten.

**Wie hEARtest es löst:** entweder mehrere normalhörende Personen
zwischen 18 und 35 als Referenz messen — oder **einen einzigen Punkt bei
1000 Hz** kalibrieren und den Rest über **ISO 226:2003** (Kurven
gleicher Lautstärke) hochrechnen. Dazu die Auflage, die auch für uns
gilt: Der Kopfhörer darf keine eigene Lautstärkeautomatik und keinen
eigenen EQ haben.

### Falle 2: Die Hörschwelle darf man nicht umdrehen

Das ist die Falle, in die man von selbst tappt. Die Hörgeräteakustik
verordnet seit jeher **weniger** Verstärkung als der Verlust beträgt —
historisch die „half-gain rule", heute
[NAL-NL2](https://hearingreview.com/practice-building/practice-management/whats-new-about-nal-nl2).
Die Begründung ist nicht Vorsicht, sondern Wirkung:

- Ziel ist **Sprachverständlichkeit bei angenehmer Lautheit**, nicht die
  Wiederherstellung der Normalhörschwelle.
- Es gibt eine **Entsättigung** (*desensitization*): Bei größerem
  Verlust bringt zusätzliche Verstärkung immer weniger, weil das
  geschädigte Innenohr die Information nicht mehr auflöst. Mehr Höhen
  machen es dann schrill, nicht klarer.

Apple nennt seine Funktion ausdrücklich „mild amplification". Wer die
Audiogrammkurve invertiert und als EQ setzt, baut etwas, das lauter,
aber nicht besser klingt.

### Was trotzdem geht — und gut

Für unseren Zweck brauchen wir **keine Audiometrie**. Wir brauchen die
**Form** der Kurve, nicht ihren Absolutwert: Wo fällt das Gehör relativ
zu 1 kHz ab? Das beantwortet auch ein unkalibrierter Test — normiert man
auf 1 kHz, wird der Kalibrierfehler zu einem konstanten Versatz und
kürzt sich heraus.

Und Kopfhörer nehmen EQ bereitwillig an: RTINGS hat das an
[200 Nachmessungen](https://www.rtings.com/headphones/learn/research/eq-remeasurements)
belegt — gerechnete Kurve und gemessenes Ergebnis liegen dicht
beieinander. Was eingestellt wird, kommt also auch an.

### Bauplan

1. **Schwellensuche** bei den Audiometrie-Frequenzen (250, 500, 1k, 2k,
   3k, 4k, 6k, 8k Hz), adaptiv wie bei Apple: von 1 kHz aus, nach jedem
   Treffer 10 dB leiser, nach jedem Fehlschlag 5 dB lauter, mehrere
   Umkehrpunkte mitteln.
2. **Je Ohr getrennt** — der Unterschied zwischen links und rechts ist
   klinisch das Wichtigste und für die Wiedergabe ohnehin relevant.
3. **Auf 1 kHz normieren.** Das Ergebnis ist keine Hörschwelle, sondern
   ein Kurvenverlauf. So auch benennen.
4. **Halb kompensieren**, nicht ganz, und die Anhebung oben deckeln
   (etwa 12 dB bei 6–8 kHz).
5. **Gegen ISO 7029 prüfen** — die Norm beschreibt, wie sich die
   Hörschwelle mit dem Alter typischerweise verschiebt. Weicht das
   Ergebnis stark davon ab, war eher die Messung schlecht als das Ohr.
   Das ist dieselbe Art Plausibilitätsprüfung wie beim Einmessen die
   Frage, ob eine Mode zum Wandabstand paßt.

### Die Grenze, klar benannt

**Das ist kein Hörtest.** Es ist eine persönliche Entzerrung, die keine
Untersuchung ersetzt. Das gehört ins Panel, nicht in eine Fußnote — und
zwar mit dem konkreten Hinweis: Auffällige Ergebnisse, besonders ein
deutlicher Unterschied zwischen den Ohren, gehören zum HNO-Arzt.
Einseitiger Hörverlust hat Ursachen, die man nicht wegentzerrt.

### Anschluß an das Bestehende

Das Tonstudio hat den Equalizer bereits, und das Einmessen bringt die
Schrittfolge mit Text-Knopf-Text mit — der Hörtest wäre derselbe Ablauf
mit anderem Signal. Was fehlt, ist die Verrechnung: **Raumkorrektur und
Ohrkorrektur dürfen sich nicht summieren.** Über Kopfhörer gibt es
keinen Raum, über Lautsprecher gilt beides — das muß die Kette wissen.
