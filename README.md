# KlangTresor #

*Ein Tresor für die eigene Musik — was drin liegt, gehört dir, und den
Schlüssel hast nur du.*

**Ein lokales Archiv der eigenen [Suno](https://suno.com)-Songs** — mit
Lyrics, Prompts, Artworks, Playlists und Metadaten. Dazu eine Website,
die im Heimnetz läuft und auf iPhone und iPad im Safari funktioniert.

Dahinter steckt ein Werkzeugkasten, der aus den eigenen Stücken liest,
was sich messen lässt: Lautheit nach EBU R128, Tonart aus dem Bass,
Stimmlage, Instrumentspuren, ein Tonstudio mit Equalizer und
Kompressor, eine Sternenkarte des eigenen Klangraums.

**Läuft mit Node-Bordmitteln.** Keine Datenbank, keine Anmeldung außer
der eigenen im Browser, eine einzige npm-Abhängigkeit (und die nur für
die Musikstil-Erkennung).

---

## Was das hier *nicht* ist

Damit keine Missverständnisse entstehen:

- **Kein Suno-Client und keine API-Umgehung.** Was ohne Anmeldung
  öffentlich abrufbar ist, wird öffentlich abgerufen. Alles Weitere —
  private Songs, Wort-Zeitmarken, Playlists — holt ein Lesezeichen im
  eigenen, bei Suno angemeldeten Browsertab. Der Zugang bleibt dort,
  wo er hingehört: bei suno.com.
- **Kein Weg an Sunos Bedingungen vorbei.** Das Archiv sichert die
  eigenen Werke, nicht fremde.
- **Kein Dienst.** Es läuft auf dem eigenen Rechner, im eigenen Netz,
  ohne Konto und ohne Server im Internet.
- **Keine fertige Anwendung.** Gebaut für ein Archiv und daran
  gewachsen. Wer es benutzen will, sollte mit einer Kommandozeile
  umgehen können.

---

## Rechte und Mitarbeit

Der Code steht unter der **MIT-Lizenz** — siehe [LICENSE](LICENSE). Das
heißt: Nimm ihn, ändere ihn, gib ihn weiter, baue etwas Eigenes daraus.
Die einzige Bedingung ist, daß der Urhebervermerk mitreist.

**Caspar_D behält das letzte Wort** darüber, was in dieses Projekt
einfließt. Das ist keine Lizenzbedingung, sondern schlicht die Folge
davon, wem das Repositorium gehört: Vorschläge sind willkommen,
zusammengeführt wird, was er zusammenführt. Wer es anders haben will,
darf jederzeit forken — dafür ist die Lizenz da.

Nicht unter dieser Lizenz stehen die fremden Bausteine und die
KI-Modelle. Was von wem stammt und was dabei zu beachten ist, steht in
[web/fremd/LIZENZEN.md](web/fremd/LIZENZEN.md). Eine Einschränkung
lohnt hervorgehoben zu werden: Die Modelle zur Musikstil-Erkennung
stehen unter CC BY-NC-ND und dürfen nicht kommerziell benutzt werden.

Die Songs, Texte und Artworks in einem damit gebauten Archiv gehören
ihren Urhebern und sind nicht Teil dieses Repositoriums.

## Wie das hier entstanden ist

Große Teile dieses Codes sind im Dialog mit einem KI-Sprachmodell
geschrieben worden. Entwurf, Auswahl, Prüfung und alle
Gestaltungsentscheidungen stammen von Caspar_D — nachzulesen in
[docs/HAUSREGELN.md](docs/HAUSREGELN.md), wo jede Regel mit ihrem Anlaß
steht, und in der Versionsgeschichte.

Das steht hier, weil es zutrifft und weil die Dokumente ohnehin davon
erzählen. Wer wissen will, wie so etwas zustande kommt, findet in
[docs/HISTORY.md](docs/HISTORY.md) auch die Irrwege.

---

## Was es kann

**Archiv**
- Alle eigenen Songs lokal — MP3 und WAV, Artwork, Video-Artworks
- Playlists samt Reihenfolge; fremde Songs darin laufen vom CDN
- Auch Unveröffentlichtes, sofern es in einer eigenen Playlist steht
- Kommentare und Reaktionen mit den Menschen dahinter

**Hören**
- Karaoke-Bühne mit wortgenau mitlaufendem Text und Vollbild
- Farbpaletten aus jedem Cover — die Oberfläche färbt sich nach dem
  laufenden Song, ohne je eine Farbe zu erfinden
- Sieben eigene Visualisierungen, dazu Butterchurn mit 333
  MilkDrop-Presets

**Messen**
- Lautheit nach EBU R128 mit beiden Toren, True Peak, Dynamikumfang
- Tonart aus dem Baß auf der Eins, Tongeschlecht aus der gezählten
  Terz — und wo keine Terz vorkommt, steht nur der Grundton
- Stimmlage per YIN auf der getrennten Gesangsspur
- Trennung in sechs Instrumentspuren, lokal und ohne Python
- Wort-Zeitmarken und Transkript aus whisper.cpp

**Werkzeuge**
- Tonstudio mit Equalizer, Kompressor, Raum und Störfrequenz-Kerbe
- Klangraum: die eigene Sammlung als Sternenkarte, mit Flugbahnen
- Autorenseite: die eigenen Zahlen im Verhältnis zur Nachbarschaft —
  wer hier kommentiert, geliked oder gefolgt hat, mit öffentlichen
  Profilzahlen und Hirschfaktor. Samt Erklärung, warum in dieser
  Rechnung fast jeder im unteren Drittel steht

---

## Einrichten

Voraussetzung: [Node.js](https://nodejs.org) und
[ffmpeg](https://ffmpeg.org) (`brew install ffmpeg` auf dem Mac,
`apt install ffmpeg` unter Linux).

```bash
node bin/sammelskript.js
```

Das Skript nennt die Adresse, die in Chrome zu öffnen ist. Dort:
Rechtsklick → *Untersuchen* → *Console*, den Inhalt der erzeugten
Datei `browser/02-sammeln-aktuell.js` einfügen, Enter. Am Ende liegt
`suno-archiv-metadaten.json` im Download-Ordner.

```bash
mv ~/Downloads/suno-archiv-metadaten.json \
   library/roh/profil-$(date +%Y-%m-%d-%H-%M-%S).json
node bin/wiederherstellen.js
node server/server.js
```

`wiederherstellen.js` baut alles Weitere: Katalog, Medien, Kacheln,
Farbpaletten. Der Server nennt die Adressen für Heimnetz und iPhone.

**Der eigene Handle wird nirgends eingetragen.** Das Sammelskript liest
ihn aus der Adresse der Profilseite, auf der es läuft, und sortiert
fremde Songs danach aus.

### Unter Windows

Doppelklick auf **`KlangTresor-einrichten.cmd`** — der Rest läuft von
selbst: prüfen, was fehlt, Pakete holen, Modelle holen, nach dem
Suno-Alias fragen, Songs sammeln, starten.

Nicht die `.ps1` direkt anklicken. Windows lehnt sie auf vielen Rechnern
ab, und das Fenster schließt sich, bevor man die Meldung lesen kann —
man hält das Programm dann für kaputt. Der `.cmd`-Starter umgeht beides;
er hält das Fenster offen und erlaubt das Skript nur für diesen einen
Aufruf, ohne an den Systemeinstellungen etwas zu ändern.

Fehlt ffmpeg, sagt das Skript, wie man es nachholt — mit `winget` in
einer Zeile, und für Rechner ohne `winget` Schritt für Schritt von Hand.

### Unter WSL

Läuft der Server in der Linux-Umgebung, muß auch der Browser dort
laufen — ein unter Windows gestarteter Chrome erreicht ihn nicht. Alles
andere funktioniert, nur das Lesezeichen findet den Server nicht.

---

## Der laufende Betrieb

Der rote Knopf oben rechts holt, was neu ist: erst zeigen, dann
übernehmen. Er braucht keine Anmeldung.

Für das, was nur mit Anmeldung sichtbar ist — Wort-Zeitmarken, private
Songs, Playlists, wer reagiert hat — gibt es das **Lesezeichen**. Es
läuft im eigenen Suno-Tab, sichert sofort und schickt die Ernte in
Paketen an den Server. Ein Zugangsschlüssel landet dabei nie auf der
Platte.

Die Zahlen der Nachbarschaft holen zwei Läufe, anzustoßen aus dem Panel
*Nachbarschaft* auf der Autorenseite oder von Hand:

```
node bin/community-profile.js    Profilzahlen der Leute, die hier vorkommen
node bin/community-hirsch.js     deren Hirschfaktoren (dauert deutlich länger)
```

Beide holen nur, was noch fehlt; ein zweiter Lauf kostet also nichts.
Sie lesen öffentlich und ohne Anmeldung — und halten sich dabei an die
Umgangsform aus [docs/HAUSREGELN.md](docs/HAUSREGELN.md): eine Anfrage
zur Zeit, 1,5 s Pause, ehrlicher User-Agent, und bei einer Bremse des
Dienstes sofort Schluß.

---

## Wer schon eine Installation hat

Das Programm hieß bis zum 24.08.2026 *MySuno*. Ein `git pull` genügt,
es geht nichts verloren:

- **Einstellungen bleiben.** Equalizer, Lautstärke, Darstellungsart,
  Kartenansicht — alle 52 Speicherschlüssel im Browser heißen weiter wie
  vorher. Sie umzubenennen hätte bei jedem Nutzer alles zurückgesetzt,
  und nach außen kennzeichnen sie nichts.
- **Das Archiv bleibt.** `library/` wird nicht angefaßt, das Ablageformat
  ist unverändert, kein Serverendpunkt ist weggefallen.
- **Das Verzeichnis darf heißen, wie es heißt.** Alle Skripte arbeiten
  relativ zu sich selbst; niemand muß etwas umbenennen.

Zwei Dinge ändern sich sichtbar:

**Die Analysen werden einmal neu gerechnet.** Seit dem Ausbau des alten
Tonartverfahrens tragen die Ablagen einen Meßweg-Stempel. Wer noch
Analysen von davor hat, bekommt sie beim nächsten Öffnen neu — einmalig,
danach ist Ruhe.

**Fünf Darstellungsarten sind fort.** `audioMotion` stand unter AGPL und
verträgt sich nicht mit der MIT-Lizenz dieses Projekts. Wer eine seiner
Arten eingestellt hatte, wird beim nächsten Start auf **Spektrum**
umgeschrieben — dieselben Frequenzbalken, nur radial statt auf einer
Grundlinie.

Nach dem Aktualisieren den Server einmal neu starten.

---

## Was gesichert werden muß

**`library/katalog.json.gz`** — rund 47 MB. Dort steckt alles, was
nicht aus einer Datei zurückkommt: Lyrics, Wort-Zeitmarken, Kommentare
mit ihren Antworten, der Zählerverlauf über Monate, die Playlists.

Dazu `library/roh/`, falls dort gerade etwas liegt.

> **Achtung, diese Anweisung stand hier lange falsch.** Sie nannte
> `library/roh/` als das einzig Unersetzliche. Das stimmte einmal —
> heute räumt `aufbereiten.js` die verarbeiteten Rohdaten weg, sobald
> ihr Inhalt im Katalog steht (so gewollt: „wozu das mitführen und
> Speicherplatz vergeuden"). Der Ordner ist im gesunden Betrieb also
> fast leer, und wer nur ihn sichert, sichert nichts.

Alles Übrige — Medien, Artworks, Kacheln, Paletten, Analysen — baut
`node bin/wiederherstellen.js` neu auf, ohne jede Anmeldung.

**Zwei Dinge holt es aber nicht zurück:** die WAV-Originale
(`node bin/wav.js`, sofern Suno sie noch vorhält) und die
Instrumentspuren (`node bin/stems.js`, rund vier Minuten je Song). Wer
die behalten will, sichert `library/songs/` gleich mit — das sind dann
allerdings zig Gigabyte.

---

## Verzeichnis

```
KlangTresor-einrichten.cmd   Starter für Windows (Doppelklick)
einrichten-*.sh/.command     dasselbe für macOS und Linux
bin/       Sammeln, Aufbereiten, Messen, Farben, Wiederherstellen
browser/   Skripte für die Suno-Konsole und das Lesezeichen
server/    Website fürs Heimnetz, Port 8788
web/       die gesamte Oberfläche in einer Datei
  fremd/   Analyzer, Butterchurn
library/   Katalog, Rohdaten, Medien — nicht im Repo
docs/      Fachdokumente
```

---

## Dokumentation

| | |
|---|---|
| [docs/UEBERGABE.md](docs/UEBERGABE.md) | Einstieg, Abläufe, Fallstricke |
| [docs/HAUSREGELN.md](docs/HAUSREGELN.md) | Die Gestaltungsregeln, jede mit ihrem Anlaß |
| [docs/NORMEN.md](docs/NORMEN.md) | Lautheitsnormen, Tore, Zielpegel |
| [docs/VISUALIZER.md](docs/VISUALIZER.md) | Bühne, Analyse, Darstellungsregeln |
| [docs/FARBHANDLING.md](docs/FARBHANDLING.md) | Farbextraktion, Farbräume, jede Regel mit Meßwert |
| [docs/TONSTUDIO.md](docs/TONSTUDIO.md) | Equalizer, Kompressor, Raum |
| [docs/WHISPER.md](docs/WHISPER.md) | Wort-Zeitmarken aus dem Hören |
| [docs/SUNO-API.md](docs/SUNO-API.md) | Die Wege der Web-API — was wir nutzen, was lohnt, was das Konto verändert |
| [docs/VERGLEICH-HUB.md](docs/VERGLEICH-HUB.md) | Funktionsvergleich mit einem verwandten Werkzeug — haben wir das, besser, oder verworfen? |
| [docs/ZUSAMMENARBEIT.md](docs/ZUSAMMENARBEIT.md) | Zu zweit am Repo: fremde Commits prüfen, bevor gezogen wird |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Was offen ist — und was verworfen wurde, mit Begründung |
| [docs/HISTORY.md](docs/HISTORY.md) | Chronologie einschließlich aller Irrwege |

Die Fachdokumente sind am Archiv ihres Autors
([@caspar_d](https://suno.com/@caspar_d)) entstanden und nennen dessen
Meßwerte und Beispiele. Sie beschreiben trotzdem das Programm, nicht
die Sammlung — die Zahlen sind Belege für die getroffenen
Entscheidungen.

Wer wissen will, warum etwas so gebaut ist und nicht anders, findet die
Antwort meist als Kommentar an Ort und Stelle im Quelltext. Das ist
Absicht: Begründungen wandern nicht in eine Datei, die niemand
aufschlägt.

---

## Grenzen

- **Entwickelt auf macOS** mit Chrome und Safari; unter Linux und WSL
  von Testern gelaufen.
- Die Sammelskripte hängen an Sunos Schnittstellen. Ändert Suno etwas,
  hilft `browser/01-erkundung.js` beim Nachziehen.
- Auf exFAT-Platten belegt jede kleine Datei einen vollen 1-MB-Block —
  deshalb liegt aller Kleinkram in Sammeldateien.
- Die Stem-Trennung braucht ein Modell von 246 MB
  (`npm run modelle`) und rechnet in etwa doppelter Echtzeit.

---

## Zum Namen

Das Projekt hieß bis zum 24.08.2026 *MySuno*. Der Name ist gefallen,
weil **SUNO** seit dem 06.01.2026 eingetragene Marke von Suno Inc. ist
([US-Reg. 8096778](https://tsdr.uspto.gov/statusview/sn98407583)) — und
zwar ausdrücklich für *„downloadable software to enable users to edit
and playback of audio content"*, also für genau diese Art Programm. Die
internationale Registrierung IR 1930809 vom 22.05.2026 benennt auch
Deutschland und die EU.

Eine fremde Marke im **Namen** eines Projekts ist heikel; sie in der
**Beschreibung** zu nennen, ist es nicht — deshalb steht oben weiterhin,
wofür das hier gut ist. Wo in Zitaten und in `docs/HISTORY.md` noch der
alte Name steht, bleibt er stehen: Was einmal gesagt wurde, schreibt man
nicht nachträglich um.

Auch die Speicherschlüssel im Browser (`mysuno-…`), die CSS-Klasse
`.sunoanalyzer` und `window.SunoAnalyzer` tragen weiter den alten Namen.
Sie umzubenennen würde bei jedem Nutzer die gespeicherten Einstellungen
wegwerfen, und nach außen kennzeichnen sie nichts.
