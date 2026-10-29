# Installer für Windows, macOS und Linux

Stand 29.10.2026. Auftrag (Caspar_D, 29.10.2026, nachts):

> „ich rufe eine setup.exe auf und der Rest passiert von alleine, ggf noch einen avatar namen aufrufen."
> „ab avatar geht alles im browser"
> „solche installer hätte ich dann auch für die anderen Systeme — das Scriptgefrickel kann keiner, ich verliere
> alle Nutzer schon bevor sie angefangen haben"
> „ja, erstmal zertifikatfreie installer"

## Was für alle drei gilt

| | |
|---|---|
| **Ein Klick zum Start** | Der Nutzer lädt eine Datei, öffnet sie, und der Rest läuft. Er sieht kein Terminal, keine `.cmd`, keine `.sh` und keinen Befehl zum Abtippen. |
| **Was schon da ist, wird gezeigt** | Liegt schon ein KlangTresor da, nennt der Installer Fassung, Archiv (Titel, Größe), KI-Modelle (x von y), ffmpeg und Whisper und sagt, was jetzt passiert. Das Archiv bleibt immer unberührt. |
| **Mitgeliefert** | Das Programm, Node.js und die Pakete (`node_modules`, für das Zielsystem gebaut). |
| **Geholt, an der Quelle** | ffmpeg (GPL, KlangTresor verteilt es nicht: `quellen.txt`), die KI-Modelle (Lizenzen verbieten die Weitergabe oder fehlen: Kopf von `bin/modelle-holen.js`) und Whisper (3,1 GB). Das geschieht mit Balken: Datei, MB, Quelle, Restzeit. |
| **Ein Kern zum Holen** | `bin/installieren.js` holt ffmpeg, Modelle und Whisper. Es benutzt dieselben Programme wie der Tab „System“ im Profil (`modelle-holen.js`, `whisper-holen.js`) und schreibt seinen Stand in eine Datei, die der Installer anzeigt. |
| **Ab dem Avatar im Browser** | Danach öffnet sich die Einrichtung im Browser, ohne Fenster (`bin/einrichten.js --nach-setup`). Sie hakt die Werkzeug-Schritte als „ist da“ ab und fragt nach dem Suno-Namen. Danach holt sie Songliste, Dateien und Bilder. |
| **Ort** | Alles liegt im Ordner `KlangTresor` im Nutzerverzeichnis, wie bisher. Programm, `library/` und `modelle/` liegen zusammen, nichts braucht Verwalterrechte. |
| **Ohne Zertifikat** | Vorerst unsigniert. Jedes System warnt einmal; die Download-Seite zeigt mit Bild, wo man klickt (siehe unten). |
| **Updates** | Wie bisher über Profil → System bzw. `aktualisieren.js`. Eine neue Installer-Datei über eine alte Installation zu legen, geht ebenfalls: Sie erkennt den Bestand und erneuert nur das Programm. |
| **Entfernen** | Das Programm geht. Archiv und Modelle bleiben, Ort und Größe werden genannt. |

## Windows: `KlangTresor-Setup.exe` (gebaut)

NSIS, gebaut auf dem Mac mit `node bin/paket.js` (ruft `bin/setup-bauen.js`). Skript: `bin/setup/klangtresor.nsi`.

| Seite | Was der Nutzer sieht |
|---|---|
| 1. Ordner | Vorschlag `C:\Users\<Name>\KlangTresor`, oder der Ordner der letzten Installation. Ein Ordner mit fremden Dateien wird abgelehnt. |
| 2. Was schon da ist | „Neu“ oder „KlangTresor 1.0.133 gefunden, wird auf 1.0.134 erneuert“. Dazu Archiv, ffmpeg, KI-Modelle x von 15, Whisper, was geholt wird (rund … GB) und der freie Platz. |
| 3. Kopieren | Programm, Node, Pakete: rund 30 Sekunden. |
| 4. Holen | Ein Balken über alles: was gerade geladen wird, „1,2 GB von 4,3 GB · huggingface.co · noch etwa 12 Min.“. Danach geht es von allein weiter. Kommt etwas nicht an, sagt die Seite, was fehlt, und bietet „Noch einmal versuchen“ an; KlangTresor läuft auch ohne. Fehlt nichts, entfällt die Seite. |
| 5. Fertig | Häkchen „Weiter im Browser: Suno-Name und Lieder“. Der Browser geht auf, die Einrichtung fragt nach dem Suno-Namen. Danach startet KlangTresor in seinem gewohnten Fenster. |

Größe: 82 MB (ohne ffmpeg, Modelle und Whisper). Startmenü: „KlangTresor“, „KlangTresor entfernen“. Eintrag unter „Apps“.
Stiller Lauf für Tests: `KlangTresor-Setup.exe /S /D=C:\Pfad` (`/OHNEHOLEN` lässt das Holen aus).

**Warnung ohne Zertifikat:** SmartScreen „Der Computer wurde durch Windows geschützt“ → „Weitere Informationen“ →
„Trotzdem ausführen“. Kostenloser Ausweg später: SignPath Foundation (Open Source; Herausgeber heißt dann „SignPath
Foundation“, Bau müsste in GitHub Actions laufen). Casto kann nicht signieren (Voicechat 29.10.2026).

## macOS: `KlangTresor.dmg` (Plan)

**Was der Nutzer tut:**
1. Die `.dmg` öffnen. Ein Fenster zeigt `KlangTresor.app`, einen Pfeil und den Ordner „Programme“. Das Hintergrundbild erklärt den einen Klick, den macOS verlangt.
2. Die App in „Programme“ ziehen und öffnen.
3. Beim ersten Mal sagt macOS: „KlangTresor kann nicht geöffnet werden.“ Der Nutzer geht zu Systemeinstellungen → Datenschutz & Sicherheit → „Trotzdem öffnen“, einmalig. Ohne Apple-Entwicklerkonto (99 $ im Jahr) geht es nicht anders.
4. Der Browser geht auf, mit der Seite „KlangTresor wird eingerichtet“: was schon da ist, Balken für ffmpeg, Modelle und Whisper, dann der Suno-Name.

**Wie es gebaut ist:**
- `KlangTresor.app/Contents/MacOS/KlangTresor` ist ein kleiner Starter. Er kopiert beim ersten Start (und nach jedem Update der App) das Programm aus `Contents/Resources/` nach `~/KlangTresor`, ohne `library/` und `modelle/` anzufassen. Danach startet er von dort. Damit hat der Mac dieselbe Ordnerordnung wie Windows und Linux, und `server.js` muss nichts über App-Bündel wissen.
- Mit drin: Node für x64 und arm64 (eine App für beide Macs, der Starter wählt), `node_modules` mit onnxruntime für darwin x64 und arm64, und **whisper-cli, fertig gebaut**. whisper.cpp ist MIT, darf also mit. Heute baut `whisper-holen.js` es beim Nutzer aus dem Quelltext und braucht dafür Apples Entwicklerwerkzeuge. Das fällt weg.
- Geholt wird ffmpeg (GPL). Auf dem Mac gibt es keinen Hersteller-Bau wie gyan.dev unter Windows. In Frage kommen evermeet.cx (nur Intel) und ffmpeg.martin-riedl.de (Intel und Apple Silicon, signiert). Das ist noch zu prüfen. Heute verlangt die Einrichtung `brew install ffmpeg`, und genau das ist Gefrickel.
- Die Fortschrittsanzeige ist eine Seite im Browser, ein eigenes Fenster gibt es nicht: Ein Mac-Installer hat keine Assistentenseiten wie NSIS, und `.pkg` kann keinen Balken für Downloads zeigen. Die Seite liest denselben Stand von `installieren.js`.
- Gebaut auf diesem Mac mit `hdiutil`, ohne fremde Werkzeuge.

**Offen:**
- Apple Silicon kann ich hier nicht testen (der iMac ist Intel).
- Ob macOS Programme, die aus einer nicht notarisierten App nach `~/KlangTresor` kopiert wurden, ohne weitere Warnung startet: Das Quarantäne-Merkmal wird beim Kopieren entfernt, ist aber zu prüfen.

## Linux: `KlangTresor.AppImage` (Plan)

**Was der Nutzer tut:**
1. Die Datei laden.
2. Rechtsklick → Eigenschaften → „Als Programm ausführen“ erlauben. Das verlangt jeder Linux-Dateimanager einmal; manche fragen beim Doppelklick selbst.
3. Doppelklick. Danach läuft es wie auf dem Mac: Der Browser geht auf, zeigt was schon da ist, holt mit Balken und fragt nach dem Suno-Namen.
4. Beim ersten Start legt KlangTresor einen Menüeintrag an (`~/.local/share/applications/klangtresor.desktop`). Danach steht es im Anwendungsmenü wie jedes andere Programm.

**Wie es gebaut ist:**
- Dasselbe Prinzip wie auf dem Mac: Das AppImage trägt Programm, Node und `node_modules` (linux x64; arm64 als zweite Datei, wenn gewünscht) und kopiert beim ersten Start nach `~/KlangTresor`.
- whisper-cli liegt bei whisper.cpp fertig für Linux bereit, wird also geholt wie heute.
- Für ffmpeg gibt es fertige statische Bauten (johnvansickle.com), die geholt werden. Heute verlangt die Einrichtung `sudo apt install ffmpeg`.
- Gebaut im Docker auf diesem Mac mit `appimagetool`. Getestet in einem Ubuntu-Container (ohne Oberfläche) und, wenn du eine willst, in einer Linux-VM in Parallels.
- Hinweis: Neuere Ubuntu-Fassungen haben `libfuse2` nicht mehr vorinstalliert. Das aktuelle AppImage-Laufzeitprogramm kommt ohne aus; das ist beim Bau zu prüfen.

## Was danach mit dem Alten passiert

Die Installer ersetzen den Handweg. Die Zip-Pakete mit `einrichten-*.cmd/.command/.sh` bleiben vorerst als Rückfall
stehen („Neubau neben dem Alten, Altes fällt, wenn Neues gewonnen hat“). Wenn die drei Installer bei dir und bei Casto
durchgelaufen sind, fliegen Handweg, Anlasser (`bin/anlasser.ps1`) und das Windows-Zwischenlager
(`%LOCALAPPDATA%\KlangTresor`) heraus, und `START-HIER.md` beschreibt nur noch den Installer.

## Entscheidungen für dich

- **A — Das Fenster „KlangTresor läuft“ unter Windows.** Der Server läuft heute in einem schwarzen Konsolenfenster, und wer es schließt, beendet KlangTresor. Soll das so bleiben, oder soll KlangTresor als Symbol unten rechts in der Taskleiste laufen, mit „Öffnen“ und „Beenden“? Das Symbol wäre ein eigenes kleines Projekt, etwa ein Tag.
- **B — Mac: Fortschritt im Browser.** Auf dem Mac (und unter Linux) gibt es kein Installer-Fenster mit Seiten. Die Balken für ffmpeg, Modelle und Whisper stünden dort im Browser, auf der Seite „KlangTresor wird eingerichtet“. Unter Windows stehen sie im Setup-Fenster. Einverstanden?
- **C — Mac: Wie beendet man KlangTresor?** Ohne Terminalfenster gibt es nichts, das man schließen könnte. Mein Vorschlag: Solange der Server läuft, steht KlangTresor im Dock; „Beenden“ dort (oder Cmd-Q) beendet den Server. Das verlangt einen kleinen echten Mac-Starter statt eines Skripts, gebaut mit Apples `swiftc`, das hier liegt. Rund ein halber Tag.
- **D — Reihenfolge:** zuerst Mac, dann Linux. Oder umgekehrt?

## Geprüft (29.10.2026, nachts, Windows 10 in Parallels, angemeldeter Nutzer)

| Fall | Ergebnis |
|---|---|
| Über eine bestehende Installation (1.0.133, ohne Modelle) | Seite „Was schon da“ zeigt 1.0.133, ffmpeg da, 0 von 16 Modellen, Whisper fehlt, 3,9 GB. Kopieren, Holen mit Balken (rund 6 Min. bei dieser Leitung), danach von allein zur Abschlussseite. „Weiter im Browser“ öffnet Edge, kein Konsolenfenster; Schritte 1 bis 6 sofort „fertig“, Schritt 7 fragt nach dem Suno-Namen. |
| Frisch in einen neuen Ordner (Pfad mit „ö“) | „Was schon da“: neu, ffmpeg fehlt, 0 von 16, Whisper fehlt, 4,0 GB. ffmpeg von www.gyan.dev mit Balken, dann Modelle, dann Whisper. |
| Abbrechen mitten im Whisper-Modell | Rückfrage, „Ja“: Setup und Holen enden, das halbe Modell bleibt als `.teil` (1,7 GB). |
| Zweiter Lauf in denselben Ordner | „Was schon da“: 16 von 16, Whisper fehlt; das Holen macht an der Abbruchstelle weiter (2,2 von 2,9 GB nach einer Minute). |
| Setup über eine Installation, deren Einrichtung gerade läuft | Rückfrage „KlangTresor läuft noch … Soll ich es beenden?“, „Ja“ beendet nur `node.exe` aus diesem Ordner, dann geht es weiter. |
| Entfernen | Dieselbe Rückfrage. Danach bleiben `library` und `modelle`; die Schlussseite nennt Ort und Größe (4,0 GB). Startmenü und „Apps“-Eintrag sind weg. |
| Neu installieren in den Ordner, aus dem entfernt wurde | Geht (vorher war „Weiter“ gesperrt, weil `modelle` als fremd galt); holt nur ffmpeg und das Whisper-Programm (118 MB). |
| Still (`/S /OHNEHOLEN /D=…`) | Rückgabe 0 nach 22 s; Node 22.11.0, Pakete genau nach package-lock; Entfernen still: Rückgabe 0, nichts übrig. |

Unterwegs gefunden und behoben:
- Die Rückfrage verlangte, „das schwarze Fenster“ zu schließen, das es nach der Setup.exe nicht gibt.
- Die Größe der Modelle wurde mit 1,1 statt 4,1 GB angezeigt (NSIS übergeht Dateien über 2 GB).
- Neu installieren nach dem Entfernen war gesperrt.
- Nach dem Entfernen blieb einmal `werkzeug` liegen (Virenschutz hielt `node.exe` fest; jetzt mit zweitem Durchgang).
- Texte waren abgeschnitten.

Nicht geprüft:
- Englische und russische Oberfläche (die Texte sind da, aber ungesehen).
- Windows 11 mit angemeldetem Nutzer (die VM steht am Sperrbildschirm).
- Die Einrichtung im Browser nach dem Suno-Namen bis zum Start von KlangTresor (ich habe keinen Suno-Namen eingegeben).
- SmartScreen beim Download aus dem Netz (die Datei kam über die Parallels-Freigabe).
- Zwei Installationen auf demselben Rechner teilen sich einen Eintrag unter „Apps“; wer eine entfernt, nimmt den Eintrag der anderen mit. Bei einer Installation je Nutzer, dem Normalfall, spielt das keine Rolle.
