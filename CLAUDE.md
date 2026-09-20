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

### Stichprobe statt Rundumschlag

Caspar_D, 19.09.2026: *„Du testest in Zukunft so, als hättest du kein data repository zur freien
Verfügung, du machst einen Testplan an Stichproben, die repräsentativ sind, nie an allen, und du
fragst, woran du testen sollst."*

**Der Prüfsatz sind die 10 NEUESTEN Titel plus die Testbilder.** Begründung von ihm: *„die sind eine
gute Stichprobe, weil der Style grade der ist, den ich verfolge; in erster Linie soll das alles für
mich arbeiten und erst in zweiter Linie für mein Umfeld."* Der Satz wird **gerechnet, nicht
abgeschrieben** — er wandert mit. Nachgesehen am 19.09.2026: kein Instrumental darunter.

**Instrumentalstücke so gut wie nie.** Erkannt wird das mit `istInstrumental` (Hand schlägt
Automatik, sonst: kein Liedtext heißt instrumental) — 64 von 325. Die Falle steht dort im Kommentar:
wer im Index auf `s.lyrics` statt auf `hatLyrics` prüft, hält JEDEN Song für instrumental.

**Trotzdem so generisch wie möglich bauen.** Die Stichprobe ist zum Prüfen da, nicht zum
Maßschneidern.

**Vor jeder Messung ein kurzer Testplan:** welche Frage, welche Stichprobe, wie lange. Braucht eine
Zahl wirklich den ganzen Bestand, wird das einzeln begründet und erlaubt — nicht stillschweigend
gemacht, weil die Daten ja dalagen.

### Zeitmanagement

Caspar_D, 19.09.2026: *„es kann nicht sein, dass ich mich darauf verlasse, wir haben etwas
substanzielles, wenn ich wieder da bin."*

**Vor der Arbeit die Ansage:** was fertig sein wird und ungefähr wann. **An jedem Punkt, an dem er
weggeht, steht ein eingesetzter, benutzbarer Stand** — kein halber Apparat und keine Fassung, die
nur im Sandkasten läuft.

### Persönliches bleibt draußen

Material, das Caspar_D als Person betrifft — Liedtexte im Volltext, seine eigenen Einordnungen dazu,
Bildarbeit an seiner Gestalt — gehört **nicht ins Repo und nicht in die Übergabe**. Es ist nicht Teil
der Software. Solche Arbeit bleibt im Scratchpad und wird ihm als Datei gegeben; was davon dauerhaft
gebraucht wird, steht im Gedächtnis, nicht in git.

## 4. Nichts darf lügen

Was nicht gilt, wird grau mit Grund — nicht versteckt. Zahlen, die nichts aussagen, werden nicht angezeigt.
Schätzungen heißen Schätzungen. Abgeklemmter Code wird gelöscht, seine Begründung bleibt als Kommentar.

## 5. Erst der Plan, dann der Bau

Bei Entwurfsfragen zuerst eine Skizze, dann Text, dann Code. Lautes Denken ist kein Auftrag. Was die Software
ausrechnen kann, wird kein Regler.

**Keine große Messreihe vor der fertigen Spezifikation.** Caspar_D, 17.09.2026: *„bitte nie wieder eine große
Menge Tests machen, bevor wir nicht durchspezifiziert haben"* — nachdem eine Messung über 325 Tiefenkarten
etwas belegt hatte, was eine Minute Nachdenken beantwortet: ein Funke kommt aus einem Feuer, nicht aus der
ganzen Bildfläche. **Erst fragen, was das Ding IST und woher es kommt**, dann die Betriebsart prüfen, dann
messen — und nur das, was das Modell offenlässt: Zeitverhalten, Rechenkosten, Anteile im echten Bestand.
Passt die Betriebsart nicht zu dem Satz, wird die Betriebsart geändert, nicht gemessen.

Und: **die vorhandene Maschinerie kennen, bevor etwas dazugebaut wird.** Dieselbe Runde hat drei geplante
Bauarbeiten aufgelöst, weil die Lösung schon im Haus stand.

**Eine Baustelle.** Caspar_D, 18.09.2026: *„ich würde am liebsten die Effekte einen nach dem anderen aus dem
Entwurf in den Profimodus bringen … das habe ich diese ganze Woche gelernt, wir haben ständig an allen
Effekten zugleich optimiert und nichts ist wirklich fertig geworden und das Zeit-Regime ist völlig aus dem
Ruder gelaufen."* Genau ein Effekt ist offen; innerhalb davon kleine Schritte, jeder einzeln gezeigt.
Was bei einem anderen Effekt auffällt, wird **aufgeschrieben, nicht gebaut** — auch nicht „nebenbei".

**Die Größe einer Änderung ist die Größe ihres Beweises.** Caspar_D zur Ausrede „es ist nur eine Zeile":
*„wenns so wäre, wäre es kein Problem, du hast aber jedesmal die 5 h Testmaschinerie angeworfen, damit war es
eben nicht nur eine Zeile."* Grundlinienvergleich (Minuten) für alles, was den gemeinsamen Malweg anfasst;
eine Messreihe über den Bestand nur, wenn eine Zahl im Code oder in der Oberfläche daraus hervorgeht. Keine
zwei Apparate für dieselbe Frage.

**Die Rollen:** Caspar_D ist Bauherr, Architekt und Abnahme; Claude ist Chefentwickler. Der Architekt
zeichnet zuerst — es wird nicht gebaut, bevor die Zeichnung steht. Agenten heißen `-agent`
(Bauagent, Testagent, Schwachstellenagent, Nörgelagent), keine substantivierten Partizipien.

## 6. Eingriffe, die Jörg ansagen will

`server/server.js` startet sich bei Änderung selbst neu — erst Sandkasten, dann ansagen, dann einsetzen und prüfen,
dass er wieder antwortet. Ports 8788 und 18811 gehören ihm. Kein zweites App-Fenster zum Testen.
Je Änderung ein neues Release, nie `--clobber`.
