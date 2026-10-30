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

## macOS: `KlangTresor.dmg` (geprüft 30.10.2026, veröffentlicht mit 1.0.142)

Gebaut mit `bin/dmg-bauen.js` (aus `bin/paket.js`), 164 MB. Geprüft in einer macOS-26-VM (Intel): Erster Start legt
das Programm nach `~/KlangTresor` und öffnet die Einrichtung; Update per Glocke 1.0.138 → 1.0.141 lief durch. Der
Absturz beim allerersten Start (Fenster doppelt freigegeben) ist seit 1.0.142 behoben. Apple Silicon ist eingebaut,
aber noch nicht auf einem echten Gerät geprüft.

- `KlangTresor.app/Contents/MacOS/KlangTresor`: der Starter (`bin/mac/KlangTresor.swift`), Intel und Apple Silicon
  in einer Datei. Er legt das Programm nach `~/KlangTresor` (Node und whisper-cli für den eigenen Prozessor), entfernt
  dort das Quarantäne-Merkmal, startet beim ersten Mal die Einrichtung im Browser und danach den Server.
  KlangTresor steht im Dock: Klick öffnet die Seite, Rechtsklick „Protokoll anzeigen“ und „Neu starten“, Cmd-Q beendet.
- `Resources/`: Programm mit `node_modules` (onnxruntime darwin), `node-x64`, `node-arm64`, `whisper-x64`,
  `whisper-arm64`. whisper-cli wird beim Bau übersetzt (MIT) und zwischengespeichert. Bisher baute die Einrichtung es
  beim Nutzer und brauchte dafür Apples Entwicklerwerkzeuge.
- ffmpeg holt die Einrichtung jetzt auch auf dem Mac selbst (ffmpeg.martin-riedl.de, Intel und Apple Silicon) statt
  `brew install ffmpeg`.
- Ad-hoc signiert, nicht notarisiert: macOS verlangt einmal „Dennoch öffnen“ in Systemeinstellungen → Datenschutz &
  Sicherheit. Die DMG enthält dazu „Zuerst lesen“.

## Linux: `KlangTresor-x86_64.AppImage` (gebaut und geprüft 29.10.2026, veröffentlicht mit 1.0.136)

**Was der Nutzer tut:**
1. Die Datei laden. Rechtsklick → Eigenschaften → „Als Programm ausführen“ erlauben (einmal; jeder Dateimanager
   verlangt das bei einer heruntergeladenen Datei).
2. Doppelklick. Ein Hinweis „KlangTresor wird nach ~/KlangTresor gelegt …“, dann geht der Browser auf: die Einrichtung
   zeigt, was da ist, holt ffmpeg (statischer Bau, johnvansickle.com), die KI-Modelle und Whisper mit Balken und fragt
   nach dem Suno-Namen.
3. Danach läuft KlangTresor als **Symbol im Panel** (Öffnen, Protokoll anzeigen, Beenden). Wo das Panel keine
   AppIndicator-Symbole kennt (reines GNOME ohne Erweiterung), läuft es ohne Symbol und wird über **Profil → System →
   KlangTresor beenden** beendet (Entscheidung „Beides“).
4. Im Anwendungsmenü steht „KlangTresor“ (zeigt auf das AppImage). Ein neueres AppImage erneuert beim Start das
   Programm; ein älteres überschreibt nie ein neueres. Läuft KlangTresor gerade, fragt das neuere AppImage, ob es
   beenden und erneuern darf.

**Wie es gebaut ist:** `bin/appimage-bauen.js` (aus `bin/paket.js`), auf dem Mac: squashfs (`brew install squashfs`)
plus das statische Laufzeitprogramm von AppImage/type2-runtime (braucht kein libfuse2). Inhalt: `AppRun`
(`bin/linux/AppRun`), Programm, Node linux-x64, `node_modules` mit onnxruntime nur linux/x64. 104 MB.
Das Symbol: `bin/linux/klangtresor-symbol.py` (Python 3 + GTK + AyatanaAppIndicator3 aus dem System, nichts
nachinstalliert). Der Knopf „KlangTresor beenden“ (`/api/system/beenden`, nur vom Rechner selbst) beendet den Server
mit Code 0; Symbol (Linux und Windows) und `bin/starten.js` verstehen das als gewollt.

**Nur x64** (Entscheidung 29.10.2026). Getestet in einer Ubuntu-24.04-Desktop-VM (Parallels, „Ubuntu KlangTresor“,
`Entwicklung/_linux-vm/`).

## Was danach mit dem Alten passiert

Die Installer ersetzen den Handweg. Die Zip-Pakete mit `einrichten-*.cmd/.command/.sh` bleiben vorerst als Rückfall
stehen („Neubau neben dem Alten, Altes fällt, wenn Neues gewonnen hat“). Wenn die drei Installer bei dir und bei Casto
durchgelaufen sind, fliegen Handweg, Anlasser (`bin/anlasser.ps1`) und das Windows-Zwischenlager
(`%LOCALAPPDATA%\KlangTresor`) heraus, und `START-HIER.md` beschreibt nur noch den Installer.

## Entscheidungen (Caspar_D, 29.10.2026 morgens)

- **A — Windows: kein Konsolenfenster mehr.** KlangTresor läuft als Symbol unten rechts in der Taskleiste („Öffnen“, „Beenden“).
- **B — Mac und Linux: Fortschritt im Browser.** „wenn das nicht anders geht, dann muß es wohl so sein“
- **C — Mac: Beenden über das Dock bzw. Cmd-Q.** „genau so“
- **D — Reihenfolge:** erst Linux, dann Mac.

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

## SmartScreen: der Weg eines echten Nutzers (geprüft 29.10.2026, Windows 11, Edge)

Drei Rückfragen, mit Bildern in START-HIER/HERE/RU (`docs/bilder/windows-download/`):
1. Edge: „… wird häufig nicht heruntergeladen“, dann „…“ und „Behalten“.
2. SmartScreen: „Stellen Sie sicher, dass Sie … vertrauen“. „Trotzdem behalten“ steckt hinter dem Pfeil ˅ neben „Löschen“.
3. Beim Start: „Der Computer wurde durch Windows geschützt“, dann „Weitere Informationen“ und „Trotzdem ausführen“.

Achtung beim Testen in Parallels: Edge speichert dort in die Mac-Downloads (`C:\Mac\Home\Downloads`). Die Markierung
„aus dem Internet“ (Zone.Identifier) geht auf der Freigabe verloren, deshalb fehlt dort Schritt 3. Geprüft wurde mit
einer Kopie auf der Windows-Platte und von Hand gesetzter `ZoneId=3`.

Kostenloser Ausweg, ohne Zertifikat: die Setup.exe bei Microsoft als Softwarehersteller einreichen („Submit a file for
malware analysis“, Kategorie „Software developer“). Das verkürzt die Zeit, bis SmartScreen sie kennt. Je Release einmal,
von Hand, mit dem Microsoft-Konto des Herausgebers – das kann nur Caspar_D.

## Geprüft: Linux (29.10.2026, Ubuntu 24.04.5 Desktop in Parallels, Testbenutzer)

| Fall | Ergebnis |
|---|---|
| Frisch: AppImage ausführbar machen, starten | Hinweis „wird nach ~/KlangTresor gelegt“, Firefox mit der Einrichtung; ffmpeg 40 MB, Modelle und Whisper 4 GB mit Balken; Suno-Name caspar_d, 268 Titel, Bilder; am Ende das Symbol im Panel und KlangTresor im Browser. Menüeintrag und Schreibtisch-Verknüpfung zeigen auf das AppImage. |
| Symbol | Als StatusNotifierItem angemeldet; Menü „läuft seit …“, Öffnen, Protokoll, Beenden. „Beenden“ lässt keinen Prozess zurück. |
| Knopf in Profil → System | Beendet Server und Symbol (Code 0). |
| Neustart über das Anwendungsmenü | Startet Symbol und Server. |
| Neueres AppImage, während KlangTresor läuft | Rückfrage „… 1.0.135 läuft. Dieses AppImage bringt 1.0.136 …“, Ja: beendet, erneuert, startet neu. Der erste Versuch scheiterte (das eingehängte AppImage war nach dem Beenden weg); seither liegt das Programm vor der Frage bereit. |

Unterwegs gefunden:
- Ubuntu 24.04 hat zwar die Symbol-Erweiterung, aber nicht die Python-Bibliothek dazu. Deshalb meldet sich das Symbol jetzt direkt über D-Bus an.
- Die Einrichtung ohne Terminal endete mitten in der ersten Frage. Jetzt hält sie ihr Seitenserver am Leben.
- ffmpeg holt die Einrichtung unter Linux jetzt selbst, statt auf `sudo apt install` zu verweisen.
