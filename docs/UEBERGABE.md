# KlangTresor · Übergabe

> **Namenswechsel:** Das Projekt hieß bis zum 24.08.2026 *MySuno*. Es heißt jetzt **KlangTresor** — „Suno" ist seit dem 06.01.2026 eingetragene Marke von Suno Inc., ausdrücklich für Software zum Abspielen und Bearbeiten von Audioinhalten. Wo in Zitaten und in der Chronik noch der alte Name steht, bleibt er stehen.

Stand: 18.08.2026. Dieses Dokument ist der Einstieg; die Details stehen in
den Fachdokumenten daneben.

| Dokument | Inhalt |
|---|---|
| [DATENEXTRAKTION.md](DATENEXTRAKTION.md) | Wie die Daten aus Suno kommen, Endpunkte, Fallstricke |
| [FARBHANDLING.md](FARBHANDLING.md) | Farbextraktion aus den Covern, Farbräume, Regeln |
| [VISUALIZER.md](VISUALIZER.md) | Bühne, Audioanalyse, Darstellungsarten, Visualizer |
| [NORMEN.md](NORMEN.md) | Lautheitsnormen, Tore, Zielpegel, CB Audio Analyzer |
| [BACKLOG.md](BACKLOG.md) | Was offen ist, mit Begründung und Aufwand |
| [HISTORY.md](HISTORY.md) | Chronologie der Entscheidungen und der Irrtümer |
| [NAECHSTER_CHAT.md](NAECHSTER_CHAT.md) | Text zum Kopieren in eine neue Sitzung |
| [../WAV-PROTOKOLL.md](../WAV-PROTOKOLL.md) | WAV-Originale: Endpunkt, Skript, Ablauf |

---

## Was das Ding ist

Lokales Archiv der auf Suno veröffentlichten Songs von Caspar_D
(Künstlername **Caspar_D**, `@caspar_d`). Anlass: Suno begrenzt ab
September 2026 auf 60 Downloads pro Monat.

**321 Songs**, 14.04.2025 bis 17.08.2026, 26,3 Stunden, 22 GB Medien.

---

## Aktueller Stand

| | |
|---|---|
| Songs im Katalog | **321** |
| davon veröffentlicht | 248 |
| davon **privat** (unveröffentlicht) | 73 |
| MP3 / Artwork | 321 / 321 |
| Sunos Lyric-Videos | nicht archiviert — die Bühne ersetzt sie |
| Eigene Video-Artworks | 83 (alle bei veröffentlichten) |
| Wortgenaue Zeitmarken | 253 (244 + 9) |
| Farbpaletten | 321, Kontrastziel überall erreicht |
| Playlists | 25 (23 öffentlich, 2 privat) |
| **WAV-Originale** | **321** — PCM 16 Bit, 48 kHz, vollständig |
| Katalog gepackt | 2,1 MB |
| Medien | 6.9G |

**Die 73 privaten Songs** stehen alle in Caspar_Ds Playlists — er hat sie selbst
einsortiert, sie sind also kuratiert und nicht bloß Rohmaterial. Sie
zerfallen in 9 Songs mit Text (und Zeitmarken) und 64 textlose Stücke,
überwiegend eine durchkomponierte Wetter-Serie in zwölf Sätzen à vier
Fassungen: Morgendämmerung · Wiese mit Insekten · Waldesrauschen ·
Murmelnder Bach · Stärkerer Wind · Wind im Wald · Erste Regentropfen ·
Landregen · Wolkenbruch · Aufklaren · Rückkehr zur Wiese · Abenddämmerung.

**`bin/laden.js` lädt von Haus aus nur Veröffentlichtes** — die privaten
Songs kommen nur mit `--alle` mit. Beim Monatslauf daran denken.

Alles läuft mit Node-Bordmitteln. Zusätzlich installiert: **ffmpeg**
(Homebrew) für Kacheln und Farbextraktion.

---

## Woran als Nächstes gearbeitet wird

**Der SunoAnalyzer wird angebunden — Schritt 1 steht seit dem
18.08.2026.** Der Knopf **Analyse** im Pult der Bühne öffnet ihn in
einem eigenen Tab, mit dem laufenden Song darin, aus dem Archiv statt
vom CDN.

Er kann LUFS-Kurve, Energie-Hüllkurve, Crestfaktor, Onset-Erkennung,
BPM-Kurve, Song-Struktur, Spektrogramm (auch stereo), Chroma,
spektralen Tilt und Centroid, Pitch-Kurve, Stimmcharakter und
Vokal-Aktivität — dazu Instrumenterkennung über ONNX (Essentia MTG,
40 Klassen). Die Stem-Trennung läuft über ein zweites
Schwesterprojekt:

```
…/DemucsServer/     (Flask, Port 5001, ausserhalb des Projekts)
```

**Seit dem 18.08.2026 liegt er als Modul unter `web/fremd/analyzer.js`**
— erzeugt aus dem Original in
einem frueheren eigenen Projekt (`…/SunoAnalyzer/suno_analyzer.html`), ab
jetzt aber von Hand gepflegt. Was beim Umzug geschah, steht im Kopf der
Datei; das Warum in [VISUALIZER.md](VISUALIZER.md#der-sunoanalyzer).

**Er ist der vierte Textmodus** — `Kein Text · Karaoke · Lyrics ·
Analyzer` — und übernimmt den geteilten Schirm des Lyrics-Modus: links
Paßfoto, Titel, die vorhandene Wiedergabesteuerung und darunter die
Analysepanels, rechts Stil- und Lyricsprompt im Systemsatz. Der
Spielkopf aller 16 Diagramme hängt am Bühnenplayer; der Analyzer spielt
nichts selbst.

Stem-Trennung und Instrumenterkennung sind stillgelegt — damit stellt
er **keine einzige Anfrage nach draußen** (gemessen). Offen sind noch
die Lyrics fremder Songs und ein Zwischenspeicher, damit die Analyse
beim zweiten Aufruf sofort steht; siehe [BACKLOG.md](BACKLOG.md).

---

## Verzeichnis

```
SunoArchive/
  bin/
    sammelskript.js    erzeugt das Browser-Sammelskript mit bekannten IDs
    aufbereiten.js     Rohdaten -> Katalog
    laden.js           lädt MP3, Artwork, Videos
    kacheln.js         rechnet die 3:4-Kacheln (ffmpeg)
    farben.js          Farbpaletten aus den Covern (ffmpeg)
    farbvergleich.js   Diagnosewerkzeug: neun Verfahren nebeneinander
    wiederherstellen.js  baut alles aus library/roh/ neu auf
    wav.js             prüft und holt die WAV-Originale
    katalog.js         Lesen/Schreiben/Sichern des Katalogs
  browser/
    01-erkundung.js    Diagnose der Suno-Endpunkte
    02-sammeln.js      Vorlage - nicht direkt benutzen
    02-sammeln-aktuell.js   erzeugt; DIESE im Browser ausführen
  server/
    server.js          die Website, Heimnetz, Range-fähig
  web/
    index.html         die gesamte Oberfläche, eine Datei
    fremd/             Butterchurn, analyzer.js
    farbvergleich.html erzeugt von bin/farbvergleich.js
  library/
    katalog.json.gz    ALLES außer Medien
    backup/            letzte 10 Fassungen
    roh/               unveränderte Suno-Antworten
    avatar.webp        Profilbild, von bin/laden.js geholt
    songs/<id>/        audio.mp3, audio.wav, cover.jpg, kachel.jpg, artwork.mp4
    playlistbilder/    <playlist-id>.jpg - die 25 Playlist-Cover
  docs/                dieses Verzeichnis
```

---

## Die Abläufe

### Anhören

```bash
node server/server.js
```

Adressen stehen in der Ausgabe. Im Heimnetz etwa `192.168.x.y:8788` —
hängt der Rechner in zwei Netzen, nennt der Server beide; welches das iPhone
nutzt, muss man ausprobieren.

**Tastatur:** Leertaste pausiert, Pfeil links/rechts wechselt den Song,
Pfeil hoch/runter regelt die Lautstärke, `m` schaltet stumm. In der Bühne
zusätzlich `f` für Vollbild, `+`/`-` für den Textversatz, `Esc` schließt.

**Bei Bluetooth-Kopfhörern** den Textversatz in der Bühne einstellen —
AirPods brauchen **−200 ms** (Text läuft vor).

**Der Knopf „Analyse"** im Pult der Bühne öffnet den SunoAnalyzer in
einem neuen Tab, mit dem laufenden Song. Welche Tonspur mitgeht,
entscheidet die Einstellung „Tonqualität" daneben. Fremde Songs aus
Playlists haben ihn nicht — sie liegen nicht im Archiv.

### Monatlich neue Songs holen

**Seit dem 18.08.2026 ohne Browser:**

```bash
node bin/sammeln.js            # Songliste direkt über die API
node bin/wiederherstellen.js   # Katalog, Medien, Kacheln, Farben
```

Das reicht für Songs, Metadaten, Lyrics und Medien. Der Profil-Endpunkt
antwortet **ohne Anmeldung** — siehe [DATENEXTRAKTION.md](DATENEXTRAKTION.md).

**`sammeln.js` vergleicht mit dem Katalog** und meldet, was sich
geändert hat:

```
--- Vergleich mit dem Katalog ---
  bereits bekannt:  248
  NEU:                3
  inhaltlich anders:  2
  nur Zähler:        17
```

Unterschieden wird zwischen **Inhalt** (Titel, Lyrics, Stil,
Sichtbarkeit, Cover, Video-Artwork) und **Zählern** (Plays, Likes).
Zähler ändern sich ständig und bedeuten nichts für die Dateien auf der
Platte — sie landen im Verlauf, lösen aber kein Nachladen aus.

**Die neuen IDs schreibt es nach `library/neue-songs.json`.** Nur für
sie muss ein WAV angestoßen werden; alles andere liegt längst da.
`wiederherstellen.js`, `laden.js` und `wav.js` überspringen ohnehin,
was vorhanden ist — der Monatslauf lädt also nur das Diff.

**Weiterhin über den Browser** (dort ist ein Token nötig):
Wort-Zeitmarken, Playlists und das Anstoßen der WAVs.

<details><summary>Der alte Weg über die Konsole (Rückfall)</summary>

```bash
node bin/sammelskript.js
node bin/wiederherstellen.js
```
</details>

Für die WAVs der neuen Songs siehe [WAV-PROTOKOLL.md](../WAV-PROTOKOLL.md).

### Alles wiederherstellen

```bash
node bin/wiederherstellen.js --pruefen   # nur nachsehen, was da ist
node bin/wiederherstellen.js             # Katalog, Medien, Kacheln, Farben
```

Baut aus `library/roh/` das komplette Archiv neu auf. **Kein Schritt
braucht eine Anmeldung bei Suno** — die Mediendateien liegen offen auf
dem CDN. Läuft beliebig oft; es wird nur nachgeholt, was fehlt.

### WAV-Originale holen

```bash
node bin/wav.js --pruefen   # Stand: wer hat schon ein WAV?
node bin/wav.js             # alles Fertige holen, älteste zuerst
```

WAVs entstehen erst auf Anforderung — der Auslöser ist ein einziger
Aufruf, den die Browserkonsole absetzt. **Vollständige Anleitung samt
Skript: `WAV-PROTOKOLL.md`.**

### Etwas an den Farben ändern

```bash
node bin/farbvergleich.js <songId>     # neun Verfahren im Vergleich
node bin/farben.js --neu               # alle Paletten neu rechnen (~5 min)
```

---

## Versionierung

**Versioniert wird nur das Programm, nicht das Archiv.** Ganz `library/`
steht in der `.gitignore` — Katalog, Rohdaten, Sicherungen und Medien
bleiben draußen. Das Repo umfasst rund 1,8 MB — davon 1,7 MB die beiden
Visualizer-Bibliotheken — und ist jederzeit weiterzugeben, ohne Caspar_Ds
Songs und Statistiken mitzuliefern.

Der Grund steht in der `.gitignore` selbst: Was einmal committet ist,
bleibt dauerhaft in der Historie. Deshalb die Trennung von Anfang an.

Alles liegt **lokal**. Kein GitHub, kein Fernarchiv. Branch: `master`.

**Nach größeren Commits `git gc` laufen lassen.** Git legt jedes Objekt
zuerst als eigene kleine Datei ab, und auf exFAT belegt jede davon einen
vollen 1-MB-Block — dasselbe Problem, aus dem `library/katalog.json.gz`
entstanden ist. Gemessen am 18.08.2026: **309 lose Objekte, 1,0 GB
belegt für 748 KiB echten Inhalt.** Nach dem Packen 41 MB.

```bash
git gc
find .git -name "._*" -type f -delete
find .git/objects -type d -empty -delete
```

Die `._…`-Dateien sind macOS-Beifang, der auf exFAT bei jedem
Schreibvorgang entsteht. **Sie müssen nach dem Packen weg, nicht
davor** — sonst sind sie sofort wieder da, und `git gc` meldet
„non-monotonic index", weil es die Beifangdatei neben einem Packindex
als Packindex zu lesen versucht. Die Umlagerung ändert an der Historie
nichts; `git fsck` bestätigt es.

**Nicht verwechseln:** Das ist keine Datensicherung. Das Repo liegt auf
derselben SSD wie alles andere. Siehe [BACKLOG.md](BACKLOG.md).

---

## Was man wissen muss, bevor man etwas anfasst

**Der Katalog ist die einzige Wahrheit.** `library/katalog.json.gz` enthält
Metadaten, Lyrics, Zeitmarken, Zählerverlauf und Paletten. Bei jedem
Schreiben wandert die alte Fassung nach `library/backup/`. Die Medien
liegen daneben und sind aus den URLs jederzeit neu ladbar.

**Beim Ändern von `bin/aufbereiten.js` aufpassen:** Es baut jeden Song aus
den Rohdaten neu. Alles, was NICHT aus den Rohdaten stammt — Zeitmarken,
Wellenform, Farben, Zählerverlauf, Playlist-Zuordnung — muss aus der Vorfassung
übernommen werden. Die entsprechenden Zeilen sind kommentiert. Ohne sie
sind sie beim nächsten Lauf still verschwunden.

**Playlists stehen im Katalog unter `playlists`**, nicht am Song. Am Song
steht nur die Liste der Playlist-IDs (`playlists: [...]`) als Rückverweis.
Gebaut wird beides bei jedem Lauf neu aus `library/roh/playlists-*.json` —
damit fällt es gar nicht erst unter die Übernahmeregel oben. Fehlt die
Rohdatei, bleibt der bisherige Stand stehen.

**Grundregel: Alles Eigene liegt lokal.** Songs, Artworks, Kacheln,
Playlist-Cover, Farbpaletten, der Katalog — und seit dem 18.08.2026
auch das **Profilbild**, das `bin/laden.js` nach `library/avatar.<endung>`
holt und der Server unter `/avatar` ausliefert. Nachgeprüft an den
Netzwerkanfragen der Oberfläche: Beim Blättern im Track-Register geht
**keine einzige** Anfrage nach außen; im Quelltext steht keine fest
verdrahtete Fremdadresse. Auch die beiden Visualizer-Bibliotheken
liegen lokal in `web/fremd/`.

Die einzige Ausnahme ist gewollt und betrifft nur, was nicht dem Autor
gehört:

**Fremde Songs in Playlists liegen NICHT im Archiv.** Sie werden live
von Sunos CDN geholt - Ton wie Bild - und sind an der Marke „remote"
erkennbar. Das Archiv ist damit für eigene Inhalte weiterhin autark,
für fremde nicht. Die Linie lautet: **Eigenes lokal, Fremdes remote.**

**Zwei Arten von „nicht öffentlich" nicht verwechseln:** `oeffentlich` am
Song ist Sunos `is_public` — die Songs, die Caspar_D nicht veröffentlicht hat.
`oeffentlich` an der Playlist ist deren eigener Sichtbarkeitsstand. Eine
öffentliche Playlist kann private Songs enthalten und umgekehrt.

**Zu sichern sind nur 11 MB, nicht 5 GB.** Unersetzlich ist allein
`library/roh/` (10,8 MB) — es entsteht nur im Browser mit einem
Clerk-Token. Alles andere, also Katalog, Medien, Kacheln, Kacheln und
Paletten (zusammen 5,1 GB), baut `node bin/wiederherstellen.js` daraus
vollautomatisch neu auf. Zusammen mit dem git-Repo (rund 300 KB) passt
die vollständige Sicherung auf jeden Stick.

**Die SSD ist exFAT mit 1-MB-Blöcken.** Jede kleine Datei belegt ein volles
Megabyte. Deshalb liegt aller Kleinkram in EINER gepackten Datei. Wer
Einzeldateien je Song anlegt, verbrennt hunderte Megabyte für nichts.
`du -sh` zeigt daher immer ein Vielfaches der echten Datenmenge.


## Der Morgenlauf (19.08.2026)

Zwei Knöpfe, weil die Anmeldung die Grenze zieht.

### Der rote Knopf in der Albumansicht
Oben rechts, immer sichtbar. Zwei Stufen:

1. **Sehen.** Der Server fragt bei Suno nach (`bin/sammeln.js`, ohne
   Anmeldung — die Profil-Schnittstelle braucht keine) und vergleicht
   mit dem Katalog. Dabei ändert sich **nichts**; geschrieben wird nur
   die Rohdatei. Das Fenster zeigt eine Liste: neue Songs als Zahl,
   inhaltlich geänderte und solche mit neuen Zählerständen je mit
   Kachel, Titel und Befund darunter. Höchstens zwölf Zeilen je
   Abschnitt.
2. **Übernehmen.** Erst dieser Knopf zieht nach: Katalog bauen,
   Kommentare sichern, Medien holen, Analysen rechnen — nacheinander,
   als eigene Prozesse im Server. Der Lauf läuft weiter, auch wenn das
   Fenster zugeht; der Knopf dreht sich, solange etwas läuft.

Plays, Likes und Kommentarzahlen kommen dabei mit. **Was dieser Knopf
nicht kann:** alles, was einen Token braucht — Wort-Zeitmarken,
Playlists, WAV-Anstoß, Schläge, Abschnitte, Wellenstufen. Der Grund ist
kein Mangel, sondern eine Regel des Browsers: Der Clerk-Token gehört der
Herkunft suno.com, und eine Seite auf 127.0.0.1 kann ihn nicht benutzen.

### Das Lesezeichen auf suno.com
Dafür gibt es `browser/morgens.js` — dasselbe Fenster, aber **auf einem
Suno-Tab**, wo die Anmeldung gilt. Der Server erlaubt genau dieser einen
Herkunft den Zugriff (CORS für `https://suno.com`).

**Einrichten, einmalig in Chrome:**

1. ⌘ + Shift + B — Lesezeichenleiste einblenden
2. Rechtsklick auf die Leiste → *Seite hinzufügen…*
3. Name: `KlangTresor morgens`
4. URL, als Ganzes:

   ```
   javascript:(function(){var s=document.createElement('script');s.src='http://localhost:8788/browser/morgens.js?'+Date.now();document.body.appendChild(s);})()
   ```

**Stolperfalle:** Chrome streicht beim Einfügen manchmal das
`javascript:` am Anfang weg. Dann sieht es gespeichert aus und tut
nichts. Nach dem Anlegen einmal bearbeiten und nachsehen — notfalls von
Hand davortippen.

**Benutzen:** Tab auf suno.com öffnen (angemeldet), Lesezeichen
anklicken. Das Fenster erscheint oben rechts in der Suno-Seite. Es
holt die Songliste, die Playlists und für jeden Song, dem sie fehlen,
Schläge, Abschnitte und Wellenstufen (rund zwei Sekunden je Song; beim
ersten Mal alle, danach nur die neuen), **sichert sofort**, zeigt dann
den Vergleich und wartet auf *Übernehmen*. Für neue Songs gibt es
danach einen eigenen Knopf, der die WAV-Erzeugung anstößt — eigener
Knopf, weil es das Suno-Konto anfaßt.

Der Server muß laufen, sonst sagt das Fenster es als allererstes und
tut nichts — noch vor der Frage, was geholt werden soll. Zwei Arten zu
starten: `node server/server.js` (einfach, für Tarja) oder
`./bin/server-start.sh` (lädt Änderungen an server.js selbst nach,
aber nie mitten in einem Morgenlauf — für die Entwicklung hier). Ohne
Server sagt das Fenster
es und tut nichts.

### Warum „erst sichern, dann vergleichen"
Die Ernte — zehn Minuten Schläge, Abschnitte, Wellenstufen — lag im
ersten Entwurf bis zum *Übernehmen* nur im Fenster. Einmal war der
Server genau dann neu gestartet, und alles war weg. Jetzt wird die
Rohdatei unmittelbar nach dem Holen geschrieben; der Katalog ändert
sich dadurch noch nicht, das tut erst der Lauf.

### „nicht mehr im öffentlichen Profil"
Gemeldet werden nur Songs, die **öffentlich waren** und jetzt nicht
mehr in der öffentlichen Liste stehen — also von jemandem zurückgezogen
wurden. Private Songs stehen dort nie und sind deshalb nicht „weg". Der
erste Entwurf meldete „73 nicht mehr im Profil", und 73 war genau die
Zahl der privaten Songs.
