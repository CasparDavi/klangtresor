# KlangTresor — für dein eigenes Suno-Archiv

> **Namenswechsel:** Das Projekt hieß bis zum 24.08.2026 *MySuno*. Es heißt jetzt **KlangTresor** — „Suno" ist seit dem 06.01.2026 eingetragene Marke von Suno Inc., ausdrücklich für Software zum Abspielen und Bearbeiten von Audioinhalten. Wo in Zitaten und in der Chronik noch der alte Name steht, bleibt er stehen.

Das hier ist ein lokales Archiv deiner auf Suno veröffentlichten Songs.
Es lädt deine Musik, Artworks, Lyrics und Playlists auf deinen Rechner
und gibt dir eine Website dafür, die im eigenen WLAN läuft — auch auf
iPhone und iPad.

Alles bleibt bei dir: keine Cloud, kein Konto außer deinem Suno-Login,
keine Datenbank. Was du hier startest, läuft auf deinem Rechner und
redet nur mit Suno — in eine Richtung, lesend.

**Du musst nichts eintragen und nichts anpassen.** Dein Suno-Konto
erkennt das Programm selbst, sobald du einmal sammelst.

---

## Der schnelle Weg — ein Skript, das alles macht

Im Ordner liegen Einrichtungsskripte. **Eines** davon genügt — such dir die
Zeile für dein System und deinen Weg:

| dein System | der übliche Weg | mit Docker |
|---|---|---|
| **macOS** | `einrichten-macos.command` doppelklicken | `einrichten-docker.command` doppelklicken |
| **Linux** | `./einrichten-linux.sh` | `./einrichten-docker.sh` |
| **Windows** | Doppelklick auf `KlangTresor-einrichten.cmd` | Rechtsklick auf `einrichten-docker.ps1` → „Mit PowerShell ausführen" |

Beim ersten Doppelklick auf dem Mac fragt das System, ob du der Datei traust —
dann einmal Rechtsklick → Öffnen wählen.

Unter Windows **nicht** die `.ps1` direkt anklicken: Viele Rechner lehnen
Skripte ab, und das Fenster schließt sich, bevor man die Meldung lesen
kann — man hält das Programm dann für kaputt. Der `.cmd`-Starter umgeht
beides. (Beigesteuert von Casto, der genau darüber gestolpert ist.)

**Der übliche Weg** prüft, was fehlt (Node ab 20, ffmpeg) und sagt dir für dein
System, wie du es bekommst. Dann holt er die Pakete und die KI-Modelle, fragt
nach deinem Suno-Alias, sammelt deine Songs, lädt die Medien und startet
KlangTresor — in einem Durchgang. Abbrechen ist jederzeit erlaubt; beim nächsten
Start wird nur nachgeholt, was fehlt.

**Der Docker-Weg** ist für alle, die sich nichts installieren wollen: Node und
ffmpeg liegen dann im Container, auf deinem Rechner bleibt nichts davon zurück.
Dein Archiv bleibt trotzdem draußen auf der Platte (`library/`) — den Container
kannst du wegwerfen und neu bauen, die Musik bleibt. Und er startet ab dann mit
dem Rechner von selbst wieder.

Gebraucht wird nur Docker — und welches das richtige ist, hängt vom System ab.
**Das Skript sagt es dir**, wenn es fehlt: auf dem Mac die Fassung für deinen
Prozessor (Apple Silicon oder Intel), unter Windows erst WSL 2 und dann Docker
Desktop, unter Linux die Docker **Engine** (nicht Desktop) samt der beiden
Schritte, die dort gern vergessen werden — den Dienst starten und sich selbst
zur Gruppe `docker` hinzufügen. Ist Docker da, läuft aber nicht, bietet das
Skript an, es zu starten und zu warten.

Nach dem Docker-Start machst du **im Browser** weiter: oben rechts den Alias
eintragen, dann den roten Knopf drücken — er holt die Songliste, lädt die
Medien und rechnet die Analysen. Ein Terminal brauchst du danach nicht mehr.

Wer lieber Schritt für Schritt geht oder wissen will, was die Skripte tun,
liest einfach weiter — sie machen genau das, was unten steht.

---

## Was du brauchst

- [**Node.js**](https://nodejs.org) — die LTS-Fassung reicht (ab 20)
- [**ffmpeg**](https://ffmpeg.org) — Mac: `brew install ffmpeg`,
  Linux: `sudo apt install ffmpeg` (oder dein Paketmanager),
  Windows: `winget install ffmpeg` (oder von ffmpeg.org, dann den
  `bin`-Ordner in den PATH) — danach das Terminal neu öffnen
- Platz auf der Platte: rund 15 MB je Song, mit WAV rund 70 MB

Einmalig im entpackten Ordner — das holt das einzige Paket, das das
Programm braucht (die KI-Laufzeit für den Klangraum), und die Modelle:

```bash
npm install
node bin/modelle-holen.js
```

Sonst nichts: keine Datenbank, kein Python, kein Docker. Läuft auf Mac,
Linux und Windows (PowerShell) gleich.

Meldet das Modelle-Holen „fetch failed", kommt dein Rechner nicht an die
Quellen (Proxy, Zertifikat, DNS). Das Skript versucht es dann selbst mit
`curl` und sagt dir sonst genau, welche Dateien du im Browser öffnen und
unter welchem Namen du sie nach `library/modelle/` speichern sollst —
danach `node bin/modelle-holen.js` noch einmal, Vorhandenes wird
übersprungen.

Einen Browser brauchst du für den Anfang **nicht** mehr.

---

## Schritt 1 — Sammeln

Terminal im entpackten Ordner öffnen, dann — **statt `dein-handle` den
Namen hinter dem `@` auf deiner Suno-Profilseite** einsetzen:

```bash
node bin/sammeln.js dein-handle
```

Das war es. Kein Anmelden, keine Browserkonsole, kein Kopieren: Sunos
Profil-Schnittstelle antwortet ohne Token und liefert die vollständigen
Songdaten samt Lyrics. Die Rohdatei legt das Programm selbst an der
richtigen Stelle ab.

Es sagt dir am Ende, was es gefunden hat — und beim zweiten Mal auch,
was **neu** ist gegenüber dem, was schon bei dir liegt.

---

## Schritt 2 — Alles bauen

```bash
node bin/wiederherstellen.js
```

Das holt deine MP3s und Artworks von Sunos Server, rechnet die Kacheln
und zieht aus jedem Cover eine Farbpalette. Je nach Sammlungsgröße
dauert es einige Minuten. Es lässt sich jederzeit abbrechen und erneut
starten — es wird nur nachgeholt, was fehlt.

---

## Schritt 3 — Anhören

```bash
node server/server.js
```

Die Adressen stehen in der Ausgabe: auf dem Rechner selbst
`http://localhost:8788`, auf iPhone und iPad die Adresse mit den
Zahlen. Beide Geräte müssen im selben WLAN sein. Beenden mit `Strg+C`.

**Tastatur:** Leertaste pausiert, Pfeil links/rechts wechselt den Song,
Pfeil hoch/runter regelt die Lautstärke, `m` schaltet stumm. In der
Bühne zusätzlich `f` für Vollbild und `Esc` zum Schließen.

**In der Fußzeile** stehen links Zurück, Abspielen und Weiter, dann
Kachel und Titel, dann Zufall und Schleife, die Lautstärke, und rechts
drei Knöpfe für die Bühne:

| | |
|---|---|
| **Mikrofon** | Karaoke — der Text läuft wortgenau mit |
| **Textblock** | Lyrics — ganzes Lied auf geteiltem Schirm |
| **Balken** | Analyse — siehe unten |

Ein Klick auf die **Kachel** öffnet die Bühne so, wie du sie zuletzt
hattest. Ist ein Knopf grau, fehlt dem Song die Voraussetzung — ohne
Wort-Zeitmarken kein Karaoke, ohne Text keine Lyrics.

**Whisper, dein Wunsch:** Für Songs, denen Suno keine Zeitmarken gibt,
rechnet KlangTresor sie mit Whisper `large-v3` nach — über Nacht, neueste
zuerst. Steht dann „Karaoke (Whisper)" am Knopf, sind die Marken
gehört, nicht von Suno ausgerichtet. Wie du es auf deiner Maschine
einrichtest (mit GPU deutlich schneller): `docs/WHISPER.md`.

---

## Optional — die WAV-Originale

Suno hält zu jedem Song auch eine verlustfreie Fassung bereit, aber
erst, wenn sie einmal angefordert wurde. Ob es sie schon gibt, sagt
dir:

```bash
node bin/wav.js --pruefen
node bin/wav.js              # holt alles, was bereitsteht
```

Ein **403** heißt dabei nicht „gesperrt", sondern „gibt es noch nicht".
Wie du fehlende anstößt, steht in `WAV-PROTOKOLL.md` — dafür brauchst
du einmal den Browser. Ein WAV wiegt rund 50 MB; in der Bühne kannst du
oben zwischen MP3 und WAV umschalten.

---

## Der Analysemodus

Der dritte Bühnenknopf öffnet eine Analyse des laufenden Songs. Sie
rechnet auf deinem Rechner und fragt nirgends im Netz nach.

Oben stehen **datenbasierte Vorschläge zur Verbesserung**, umschaltbar
je Plattform — Streaming, Spotify, Apple Music, YouTube, Club,
Rundfunk. Sie stellen gegenüber, was die Plattform verlangt und was
dein Song hat: Lautheit, Spitze, Schwankungsbreite, Vollausschläge,
Phase.

Zwei Dinge, die man leicht verwechselt:

**Weniger negativ heißt lauter.** −11,8 LUFS liegt über einem Ziel von
−14, nicht darunter. Die Luft bis zum Übersteuern ist eine andere
Größe — der True Peak.

**Zu laut ist bei Streaming kein Fehler.** Der Titel wird beim
Abspielen leiser geregelt. Verloren ist nur die Dynamik, die vorher mit
dem Begrenzer eingetauscht wurde.

Darunter eine **Zeitleiste mit den Fundstellen**: wo Spitzen über dem
Ziel liegen, wo sich die Phase auslöscht, wo ein Ton dauerhaft
heraussticht — jede Marke anklickbar, der Song springt dorthin. Die
oberste Bahn zeigt die Abschnitte deines Textes, in den Farben des
Suno-Editors.

Weiter unten Kurven für Lautheit, Energie, Dynamik, Tempo, Tonhöhe,
Stereobild und zwei Spektrogramme. Bei jeder Kurve kannst du unten das
Gewichtsprofil und die Fensterlänge einstellen — die kleinen Symbole
zeigen die Form des Fensters selbst.

---

## Was das Lesezeichen tut

Weil das immer wieder gefragt wird: Suno gibt die eigenen,
**nicht veröffentlichten** Songs nur an, wer angemeldet ist. Ein Programm auf
deinem Rechner ist das nicht — der Anmeldeschlüssel gehört dem Browser und der
Adresse `suno.com`, und Suno erlaubt keiner fremden Seite, ihn zu lesen.

Das Lesezeichen läuft deshalb **in einem Suno-Tab**, dort wo der Schlüssel
ohnehin liegt. Es holt sich damit die Liste deiner Songs samt der Adressen und
schickt sie an dein KlangTresor. Alles Weitere — Musik, Cover, Videos — lädt der
rote Knopf dann selbst, denn diese Adressen funktionieren auch ohne Anmeldung,
wenn man sie kennt.

Es ist eine **Einbahnstraße**: Es liest nur. Nach Suno geht nichts zurück, auch
keine Abspielzähler.

Wenn die Meldung kommt, die Anmeldung sei nicht erreichbar: Das Lesezeichen
gehört auf einen Tab von **suno.com** (nicht auf KlangTresor), die Seite muss fertig
geladen sein, und du musst dort angemeldet sein. Seit dem 23.08.2026 wartet es
bis zu acht Sekunden auf die Anmeldung, statt sofort aufzugeben.

## Später: neue Songs nachholen — der rote Knopf

Oben rechts in der Albumansicht sitzt ein **roter Knopf**. Drück ihn
morgens:

1. Er fragt bei Suno nach und zeigt dir, **was sich geändert hat** —
   neue Songs, geänderte, und welche neue Plays, Likes oder Kommentare
   bekommen haben. Mit Kachel und Zahl. Dabei ändert sich noch nichts.
2. Darunter eine **Auswahlliste**, was der Lauf tun soll — in drei
   Gruppen: mit Login (nur über das Lesezeichen), öffentlich von Suno
   (Kommentare, Medien), lokal (Katalog, Analyse, Whisper, Musikstil
   und Klangraum). Normal ist alles an.
3. **Übernehmen** zieht dann nach. Der Knopf dreht sich, solange es
   läuft; du kannst das Fenster zumachen und weiterhören.

Das Terminal brauchst du dafür nicht mehr. Die beiden Befehle von oben
tun weiterhin dasselbe, falls du sie lieber magst.

**Was der Knopf nicht kann**, weil es deine Anmeldung braucht: deine
Wort-Zeitmarken fürs Karaoke, private Songs, Playlists, und wer deine
Songs geliked hat. Dafür gibt es das **Lesezeichen** — der Knopf
erklärt es dir und gibt dir die Adresse zum Kopieren. Einmal in Chrome
anlegen, dann auf irgendeiner Suno-Seite klicken, wo du angemeldet
bist. Dein Paßwort wird dabei nirgends abgelegt.

---

## Der Klangraum — dein Archiv als Sternenhimmel

Das dritte Register. Eine Musik-KI (Discogs-EffNet, von den Essentia-
Leuten in Barcelona) hört jeden Song komplett durch und gibt ihm einen
Ort im Klangraum: Nähe = ähnlicher Sound, unabhängig vom Styleprompt.
Dazu Genre, Stimmung und Instrumente je Song. Daraus wird ein
Sternenhimmel in 3D — Stern anklicken spielt, „Starte Reise" lässt
das Sound-Schiff von Nachbar zu Nachbar fliegen.

Gerechnet wird das vom roten Knopf (Schritt „Musikstil und Klangraum",
etwa 6–10 Sekunden je Song auf der CPU) oder von Hand:

```bash
node bin/klang.js
node bin/karte.js
```

Hast du eine **NVIDIA-Karte** (Linux oder Windows, CUDA 12 + cuDNN 9
installiert), rechnet `KLANG_CUDA=1 node bin/klang.js` auf der GPU —
deutlich schneller; in PowerShell: `$env:KLANG_CUDA=1; node bin/klang.js`.
Klappt es nicht, sagt er es und nimmt die CPU.

„Export" im Klangraum-Panel schreibt `library/export/sternenhimmel.html`
— eine einzige Datei mit Player, die du verschicken kannst; sie zeigt
nur öffentliche Songs und läuft ohne Server (Ton und Cover kommen von
Suno).

---

## Karaoke-Zeitmarken mit Whisper (optional)

Sunos eigene Wort-Zeitmarken kommen über das Lesezeichen. Für Songs,
die keine haben (oder als zweite Spur), rechnet das Programm sie mit
[whisper.cpp](https://github.com/ggml-org/whisper.cpp) selbst — das
musst du einmal bauen und dem Programm sagen, wo es liegt:

```bash
git clone https://github.com/ggml-org/whisper.cpp
cd whisper.cpp && cmake -B build -DGGML_CUDA=1 && cmake --build build -j
sh ./models/download-ggml-model.sh large-v3
```

(`-DGGML_CUDA=1` nur mit NVIDIA-Karte — dann läuft ein Song in
Sekunden statt Minuten; ohne Karte weglassen.) Dann vor dem Start:

```bash
export WHISPER_CLI=/pfad/zu/whisper.cpp/build/bin/whisper-cli
export WHISPER_MODELL=/pfad/zu/whisper.cpp/models/ggml-large-v3.bin
```

Unter Windows (PowerShell) stattdessen:

```powershell
$env:WHISPER_CLI="C:\pfad\zu\whisper.cpp\build\bin\Release\whisper-cli.exe"
$env:WHISPER_MODELL="C:\pfad\zu\whisper.cpp\models\ggml-large-v3.bin"
```

Fehlt Whisper, überspringt der rote Knopf den Schritt mit einer
Meldung — alles andere läuft trotzdem.

---

## Wer hört zu — Likes und Kommentare

Auf jeder Kachel stehen jetzt ein **Daumen** und eine **Sprechblase**
mit Zahlen. Klick darauf, und ein Fenster öffnet sich an der Maus: der
Verlauf von Plays, Likes und Kommentaren über die Tage, wer geliked
hat (soweit Suno es verrät — die letzten vier Wochen), und **alle
Kommentare mit Antworten**, im Volltext, mit Emojis. Klick auf einen
Namen zeigt dir, wo diese Person sonst noch kommentiert hat.

Die Kommentare werden bei jedem Morgenlauf gesichert — auch wenn
jemand seinen später löscht, bleibt er bei dir.

---

## Sortieren und suchen

Im **Sortiermenü** stehen jetzt auch Dinge, die das Programm aus dem
Ton gemessen hat: Schnellste, Langsamste, Lauteste, Dynamischste,
Breitestes Stereo … Sie erscheinen erst, wenn deine Songs einmal
durchgerechnet sind — das passiert beim Morgenlauf von selbst.

Neben dem **Suchfeld** sitzt ein kleines **Filter**-Menü. Es kennt:
Modell, Tonart, Dur/Moll, Stimme, Jahr, Monat, wer kommentiert hat,
und was noch fehlt. Wähl einen Schlüssel, dann bekommst du nur die
Werte angeboten, die es in deinem Archiv wirklich gibt — mit Anzahl.
Ein Klick setzt sie ins Feld; mehrere lassen sich kombinieren.

---

## Was du sichern solltest

**`library/katalog.json.gz`** — rund 47 MB. Dort steckt alles, was
nicht aus einer Datei zurückkommt: Lyrics, Zeitmarken, Kommentare, der
Zählerverlauf, die Playlists. Dazu `library/roh/`, falls dort gerade
etwas liegt — der Ordner ist meist leer, weil `aufbereiten.js` die
verarbeiteten Rohdaten wegräumt, sobald ihr Inhalt im Katalog steht.

---

## Zwei Dinge, die du wissen solltest

**Songs anderer Leute in deinen Playlists** werden nicht kopiert,
sondern beim Abspielen direkt von Suno geholt. Sie sind mit **remote**
gekennzeichnet und brauchen Internet. Alles, was dir gehört, liegt
lokal und funktioniert auch ohne Netz.

**Unveröffentlichte eigene Songs** kommen mit ins Archiv, wenn sie in
einer deiner Playlists stehen. Sie tragen die Marke **privat**, und im
Filter oben kannst du zwischen *Öffentlich*, *Privat* und *Beides*
wählen.

---

## Wenn etwas klemmt

- **`sammeln.js` findet nichts:** Dann stimmt der Handle nicht — er muss
  genau so geschrieben sein wie hinter dem `@` auf deiner Profilseite,
  ohne das `@` selbst.
- **Es fehlen Songs:** Nochmal laufen lassen — Suno drosselt bei zu
  schnellen Abfragen, das Programm merkt das und sagt es dir.
- **Das iPhone erreicht die Seite nicht:** Beide Geräte im selben WLAN?
  Und beim ersten Start fragt die Firewall des Rechners, ob Node
  Verbindungen annehmen darf — das muss erlaubt sein.
- **Suno hat etwas geändert:** `browser/01-erkundung.js` in der
  Browserkonsole ausführen; es zeigt, welche Schnittstellen noch
  antworten.

<details><summary>Der alte Weg über die Browserkonsole</summary>

Falls Suno den Profil-Endpunkt einmal schließt, geht es weiterhin so:

```bash
node bin/sammelskript.js
# Adresse öffnen, Rechtsklick → Untersuchen → Console,
# Inhalt von browser/02-sammeln-aktuell.js hineinkopieren, Enter.
# Die heruntergeladene Datei dann:
mv ~/Downloads/suno-archiv-metadaten.json \
   library/roh/profil-$(date +%Y-%m-%d-%H-%M-%S).json
node bin/wiederherstellen.js
```
</details>

Mehr Hintergrund steht in [README.md](README.md) und ausführlich in
`docs/`. Die Fachdokumente sind am Archiv von Caspar_D
([@caspar_d](https://suno.com/@caspar_d)) entstanden und nennen dessen
Zahlen als Beispiele — sie beschreiben aber das Programm, nicht seine
Sammlung.

Viel Spaß damit.
