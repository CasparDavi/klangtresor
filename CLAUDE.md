# Hausregeln für die Zusammenarbeit an KlangTresor

Diese Karte wird zu Beginn jeder Sitzung geladen. Sie enthält nur, was **jeden Vorschlag** betrifft.
Ausführlich: `docs/haus/HAUSREGELN.md` (Gestaltung), `docs/haus/ZUSAMMENARBEIT.md`, `docs/NAECHSTER_CHAT.md` (Stand).

## 1. Die App macht alles für den Produktivbetrieb selbst

KlangTresor läuft **ohne Claude und ohne Laborwerkzeug**. Ein Betriebsweg darf nur voraussetzen, was im
ausgelieferten Paket steckt: der Browser des Nutzers, der Node-Server, ffmpeg.

**Werkstatt ist nicht Betrieb.** `labor/`, headless Chrome, CDP-Skripte, Agenten und Prüfstände sind Werkzeug für
uns beim Messen und Prüfen. Nichts davon darf in einem Weg vorkommen, den ein Nutzer geht — auch nicht als
„der Server startet einfach …". Erklärungen, Checklisten und Warnungen gehören ins UI oder ins Protokoll der App,
nicht in den Chat.

**Prüffrage vor jedem Vorschlag:** Läuft das bei jemandem, der nur das Zip entpackt hat? Bei Casto unter Windows?
Wenn nein, ist es ein Werkzeug für uns, kein Vorschlag.

## 2. Jörgs Bestand ist unantastbar

`library/` ist sein echtes Archiv: lesen ja, schreiben nur über die Wege, die die App selbst benutzt. Neue Funktionen
nie am Produktivbestand ausprobieren — Sandkasten mit Kopien, große Medien höchstens verlinkt.

### Sandkasten: kopieren, nicht verlinken

Ein Sandkasten **kopiert** `server/`, `bin/` und `web/`. Node löst `__dirname` über Symlinks auf — ein verlinkter
`server/`-Ordner lässt den Sandkasten-Server Jörgs **echtes** `library/` bedienen. So wurde am 16.09.2026 ein Rezept
im Archiv überschrieben (wiederhergestellt). Verlinkt werden höchstens einzelne Mediendateien. Vor und nach jedem Lauf
`find library -newermt <Startzeit>` — was auftaucht, gehört erklärt.

### Die Datei, mit der Jörg arbeitet

`web/index.html` ist die ganze App, und sein Browser lädt sie beim Neuladen in einem Stück. Wer sie in vielen kleinen
Schritten schreibt, während Jörg arbeitet, riskiert, dass er sich eine halbfertige Fassung holt (passiert am
16.09.2026, kaputter Export). Bauaufträge laufen darum auf einer **Kopie**; die fertige Fassung kommt in einem Zug ins
Repo, und erst dann heißt es: neu laden.

## 3. Was gemessen wird, wird nicht behauptet

Jede Trefferquote braucht ihren Zufallsboden daneben. Erst das Verfahren klären, dann messen. Bei einer Fehlermeldung
zuerst die **eigene** Rechnung mit echten Daten durchspielen, bevor Daten, Browser oder Cache verdächtigt werden.

## 4. Nichts darf lügen

Was nicht gilt, wird grau mit Grund — nicht versteckt. Zahlen, die nichts aussagen, werden nicht angezeigt.
Schätzungen heißen Schätzungen. Abgeklemmter Code wird gelöscht, seine Begründung bleibt als Kommentar.

## 5. Erst der Plan, dann der Bau

Bei Entwurfsfragen zuerst eine Skizze, dann Text, dann Code. Lautes Denken ist kein Auftrag. Was die Software
ausrechnen kann, wird kein Regler.

## 6. Eingriffe, die Jörg ansagen will

`server/server.js` startet sich bei Änderung selbst neu — erst Sandkasten, dann ansagen, dann einsetzen und prüfen,
dass er wieder antwortet. Ports 8788 und 18811 gehören ihm. Kein zweites App-Fenster zum Testen.
Je Änderung ein neues Release, nie `--clobber`.
