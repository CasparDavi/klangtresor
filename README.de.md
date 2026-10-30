<a href="https://caspardavi.github.io/klangtresor/features/?lang=de"><img src="docs/features/img/readme-de.jpg" alt="KlangTresor — Deine Suno-Musik. Bei dir." width="100%"></a>

<p align="center"><b>Deutsch</b> · <a href="README.md">English</a> · <a href="README.ru.md">Русский</a></p>

# KlangTresor

**Deine Suno-Musik. Bei dir.**
Suno macht die Titel. KlangTresor bewahrt sie, spielt sie ab, misst sie aus und zeigt sie — auf jedem Bildschirm in deinem Zuhause.
Frei und quelloffen. Kein Konto. Läuft auf deinem eigenen Rechner.

**[Alles, was es kann → Feature-Seite](https://caspardavi.github.io/klangtresor/features/?lang=de)** · Broschüre (PDF): [für den Bildschirm, 8 MB](https://caspardavi.github.io/klangtresor/features/KlangTresor-Broschuere-de.pdf) · [zum Drucken, 70 MB](https://github.com/CasparDavi/klangtresor/releases/download/broschuere-2026-10-28/KlangTresor-Broschuere-de-druck.pdf)

## Herunterladen

<p align="center">
<a href="https://github.com/CasparDavi/klangtresor/releases/latest/download/KlangTresor-Setup.exe"><img alt="Herunterladen für Windows 10/11 (87 MB)" src="https://img.shields.io/badge/Windows_10%2F11-Herunterladen-ff8a2a?style=for-the-badge&logo=windows&logoColor=white"></a>
<a href="https://github.com/CasparDavi/klangtresor/releases/latest/download/KlangTresor.dmg"><img alt="Herunterladen für macOS 11 oder neuer (164 MB)" src="https://img.shields.io/badge/macOS_11+-Herunterladen-ff8a2a?style=for-the-badge&logo=apple&logoColor=white"></a>
<a href="https://github.com/CasparDavi/klangtresor/releases/latest/download/KlangTresor-x86_64.AppImage"><img alt="Herunterladen für Linux x86_64 (109 MB)" src="https://img.shields.io/badge/Linux_x86__64-Herunterladen-ff8a2a?style=for-the-badge&logo=linux&logoColor=white"></a>
<br><sub>Setup.exe 87 MB · DMG 164 MB (Intel und Apple Silicon) · AppImage 109 MB</sub>
</p>

**Systemanforderungen.** Ein 64-Bit-Rechner mit Windows 10 oder 11, macOS 11 oder neuer oder Linux (x86_64). Rund
5 GB frei für Programm und KI-Modelle, dazu etwa 15 MB je Titel (mit WAV-Original etwa 70 MB). Ein aktueller
Browser — für den vollen Funktionsumfang **Google Chrome**; zum Hören genügt jedes Handy, Tablet oder jeder Fernseher
im Heimnetz.

## Was es kann

<a href="https://caspardavi.github.io/klangtresor/features/?lang=de"><img src="docs/features/img/readme-quartett-de.jpg" alt="Jeder Bildschirm zu Hause, ein echtes Studio im Browser, Klangraum, die Bühne" width="100%"></a>

- **Dein Archiv.** Jeder Titel, den du bei Suno gemacht hast — MP3 und WAV, Liedtexte, Titelbilder, Bewegtbilder,
  Playlists, Kommentare und Herzen — in einem Ordner auf deinem eigenen Rechner.
- **Eine Bühne für jeden Titel.** Karaoke mit Text, der Wort für Wort mitläuft, Visualisierer mit den Farben des
  Titelbilds, Vollbild auf dem Fernseher.
- **Ein echtes Studio im Browser.** 8-Band-Equalizer, Kompressor und Raum, eingemessen an deinem Hörplatz.
- **Ein Blick in deine Titel.** Lautheit, Tonart, Stimmumfang, sechs getrennte Instrumentspuren — und eine
  Sternenkarte, die deine ganze Sammlung nach Klang oder nach Inhalt ordnet.
- **Mach etwas daraus.** Plakat-Studio für dein Gesamtwerk, Effektclips aus einem Standbild, Export auf einen Stick
  oder als Musikordner fürs Auto.

## Erste Schritte

1. **Herunterladen und öffnen**, die Datei für dein System. Die Installer sind noch nicht signiert, darum fragt der
   erste Start einmal nach:
   - **Windows:** „Der Computer wurde durch Windows geschützt“ → *Weitere Informationen* → *Trotzdem ausführen*.
     Edge will den Download vorher eventuell *beibehalten*.
   - **macOS:** Ist es blockiert: Systemeinstellungen → Datenschutz & Sicherheit → *Dennoch öffnen*.
   - **Linux:** Rechtsklick → Eigenschaften → *Als Programm ausführen* erlauben, dann Doppelklick. Kein sudo.

   [START-HIER.md](START-HIER.md) zeigt jeden Klick mit Bildern.
2. **Die Einrichtung läuft im Browser.** Sie holt ffmpeg und die KI-Modelle mit Balken, fragt nach deinem
   Suno-Namen und sammelt deine öffentlichen Titel.
3. **KlangTresor läuft als Symbol** in Taskleiste, Dock oder Panel. Die Seite liegt auf **http://localhost:8788**.
   Für Handy, Tablet und Fernseher im selben WLAN zeigt *Profil → Aufs Handy* die Adresse und einen QR-Code.
4. **Private Titel, Alben und Wort-Zeitmarken** brauchen deine Suno-Anmeldung. KlangTresor sieht dein Passwort nie:
   Ein Lesezeichen, das du in deinem eigenen Suno-Tab anklickst, schickt sie herüber. Seine Adresse steht im
   Morgenfenster hinter dem roten Knopf.

Danach holt der **rote Knopf** oben rechts, was neu ist.

## Aktualisieren und sichern

- **Aktualisieren:** Gibt es eine neue Fassung, erscheint neben dem roten Knopf eine Glocke. Ein Klick spielt sie in
  der App ein; ein neuerer Installer tut dasselbe. Dein Archiv bleibt unberührt.
- **Sichern:** Sichere **`library/katalog.json.gz`** in deinem KlangTresor-Ordner. Darin steht, was sich nicht neu
  holen lässt — Liedtexte, Wort-Zeitmarken, Kommentare, Playlists, der Zählerverlauf. Alles andere (Medien, Bilder,
  Analysen) baut `node bin/wiederherstellen.js` neu. Instrumentspuren rechnet der Morgenlauf nach; WAV-Originale
  kommen nicht zurück — wer sie behalten will, sichert auch `library/songs/`.

## Deine Daten

Deine Titel bleiben auf deinem Rechner. KlangTresor hat kein Konto, keine Cloud und kein Tracking. Ins Netz geht es
nur, um deine eigenen Titel bei Suno zu holen, bei der Einrichtung seine Werkzeuge und Modelle zu laden und bei
GitHub nach einer neuen Fassung zu fragen.

## Fragen

<details><summary><b>Das Handy öffnet die Seite nicht.</b></summary>

Handy und Rechner müssen im selben WLAN sein. Beim ersten Start fragt die Firewall des Rechners, ob Node Verbindungen
annehmen darf — erlauben.
</details>

<details><summary><b>Windows oder macOS meldet, die App sei unsicher.</b></summary>

Die Installer sind noch nicht signiert. Einmal bestätigen, wie unter [Erste Schritte](#erste-schritte) beschrieben.
</details>

<details><summary><b>„Port 8788 ist schon belegt“.</b></summary>

Es läuft schon ein KlangTresor. Über sein Symbol beenden, oder http://localhost:8788 öffnen und nachsehen, ob das
das gemeinte Archiv ist.
</details>

<details><summary><b>Bei der Einrichtung ist ein Download gescheitert.</b></summary>

Die Einrichtung sagt, was fehlt, und bietet einen neuen Versuch an. KlangTresor läuft auch ohne; fehlende Modelle
lassen sich später unter *Profil → System* holen.
</details>

<details><summary><b>Wie entferne ich es wieder?</b></summary>

Windows: Einstellungen → Apps → KlangTresor. macOS: die App in den Papierkorb ziehen. Linux: das AppImage löschen.
Dein Archiv und die KI-Modelle bleiben im Ordner `KlangTresor` in deinem Benutzerordner — wer alles los sein will,
löscht ihn.
</details>

## Gut zu wissen

- **Kein Suno-Client.** Was öffentlich ist, wird öffentlich geholt; alles andere in deinem eigenen, angemeldeten
  Suno-Tab. Es sammelt nur deine eigenen Titel.
- **Nicht mit Suno Inc. verbunden.** Suno ist eine Marke der Suno Inc. Bis August 2026 hieß das Programm *MySuno*.
- **Es folgt Suno.** Ändert Suno seine Seite, braucht der Morgenlauf womöglich eine neue Fassung. Alles, was schon zu
  Hause ist, bleibt spielbar.
- **Getestet** unter Windows 10 und 11, macOS 26 (Intel) und Ubuntu 24.04. Apple Silicon ist eingebaut, aber noch
  nicht auf einem echten Gerät getestet.

## Lizenz

Der Code steht unter der **MIT-Lizenz** ([LICENSE](LICENSE)): nutzen, ändern, weitergeben. Fremde Bausteine und
KI-Modelle behalten ihre eigenen Lizenzen — siehe [web/fremd/LIZENZEN.md](web/fremd/LIZENZEN.md). Achtung: Die
Modelle zur Musikstil-Erkennung stehen unter CC BY-NC-ND und dürfen nicht kommerziell genutzt werden. Die Titel,
Texte und Bilder in einem Archiv gehören ihren Urhebern.

KlangTresor ist von Caspar_D mit Tarja, Casto und Henry. Große Teile des Codes entstanden im Dialog mit einem
KI-Sprachmodell; Gestaltung und Entscheidungen sind von Caspar_D ([docs/haus/HAUSREGELN.md](docs/haus/HAUSREGELN.md)).

<details><summary><b>Andere Wege zu installieren</b> — Zip, Docker, Git, WSL</summary>

- **Zip:** `KlangTresor.zip` aus der [neuesten Release](https://github.com/CasparDavi/klangtresor/releases/latest)
  laden, entpacken und `einrichten-windows.cmd`, `einrichten-macos.command` oder `einrichten-linux.sh` doppelklicken.
- **Docker:** dasselbe mit `einrichten-docker-*` — alles läuft im Container, `library/` bleibt auf deiner Platte.
- **Git:** `git clone https://github.com/CasparDavi/klangtresor && cd klangtresor && npm ci && npm start`.
- **Aktualisieren** solcher Installationen: die Glocke in der App, oder `aktualisieren-*` im Programmordner.
- **WSL:** Der Browser muss ebenfalls in WSL laufen, sonst erreicht das Lesezeichen den Server nicht.

Einzelheiten: [docs/INSTALL-ADVANCED.md](docs/INSTALL-ADVANCED.md) (Englisch).
</details>

<details><summary><b>Umstieg von MySuno oder Fassung 1.0.72 und älter</b></summary>

Diese Fassungen haben noch kein Aktualisierungsskript. Aus
[KlangTresor-Update.zip](https://github.com/CasparDavi/klangtresor/releases/latest/download/KlangTresor-Update.zip)
`aktualisieren.js` und das Skript für dein System in den Ordner kopieren, in dem `library/` liegt, und starten.
Archiv und Einstellungen bleiben; die Analysen werden einmal neu gerechnet.
Einzelheiten: [docs/MIGRATION-MYSUNO.md](docs/MIGRATION-MYSUNO.md) (Englisch).
</details>

<details><summary><b>Für Entwickler</b></summary>

```
git clone https://github.com/CasparDavi/klangtresor && cd klangtresor && npm ci
npm start                      # server/server.js → http://localhost:8788
```

Node 20 oder neuer; zwei Abhängigkeiten (`onnxruntime-node`, `umap-js`). Aufbau: `server/` der Server fürs Heimnetz ·
`web/` die Oberfläche · `bin/` Sammeln, Messen, Einrichten, Aktualisieren · `browser/` das Lesezeichen · `docker/`.
Installer: `node bin/paket.js` baut Zip, Setup.exe, AppImage und DMG.

| | |
|---|---|
| [docs/LIESMICH.md](docs/LIESMICH.md) | Landkarte aller Dokumente |
| [docs/haus/HAUSREGELN.md](docs/haus/HAUSREGELN.md) | Gestaltungsregeln, jede mit ihrem Anlass |
| [docs/analyse/NORMEN.md](docs/analyse/NORMEN.md) | Lautheitsnormen, Gates, Zielpegel |
| [docs/analyse/FARBHANDLING.md](docs/analyse/FARBHANDLING.md) | Farbgewinnung und Farbräume |
| [docs/ton/TONSTUDIO.md](docs/ton/TONSTUDIO.md) | Equalizer, Kompressor, Raum |
| [docs/suno/WHISPER.md](docs/suno/WHISPER.md) | Wort-Zeitmarken aus dem Hören |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Was offen ist, und was verworfen wurde |
| [docs/haus/HISTORY.md](docs/haus/HISTORY.md) | Chronik, samt Umwegen und Namenswechsel |

Warum etwas so gebaut ist, steht meist als Kommentar direkt im Quellcode.
</details>
