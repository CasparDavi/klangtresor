# Die Einrichtung als Seite — Texte und Aktionen je Schritt

Caspar_D, 13.09.2026: *„Es war Sinn der Sache, alles in JS auszugeben und nicht einfach
Textausgaben umzubiegen. Ich wollte echte Fortschrittsbalken pro Schritt."* Und: *„Links nur
abhaken, keine Fortschrittsbalken. Die Balken nur, solange etwas läuft."*

Dieses Dokument entsteht Schritt für Schritt im Gespräch: je Schritt die beschlossene
Überschrift, was der Code tatsächlich tut, welche Texte erscheinen, und was beim Bau zu
korrigieren ist. Es ist die Vorlage für `web/einrichtung/index.html` und für die
Meldezeilen der Kinderskripte (`@@ {…}`), aus denen die Seite ihre Zahlen bezieht.

**DIE HAUSFORM GILT** (Caspar_D, 13.09.2026: „schau bitte nochmal in die Hausregeln, wie die UI
gestaltet werden muß, insbesondere Registerlaschen" — meine ersten Skizzen verstießen gegen
fünf davon). Verbindlich aus `docs/haus/HAUSREGELN.md` und `web/index.html`:

- **Registerlaschen sind unterstrichene Reiter, kein Pillen-Klon** (`.reg`): kein Grund, kein
  Rahmen, nur `border-bottom:2px solid transparent`, `padding:7px 14px`, `margin-bottom:-1px`,
  14 px/600, Farbe `--schwach`; aktiv `--text` + `border-bottom-color:var(--akzent)`. Sie
  **stehen beim Scrollen fest**. Auf der Einrichtungsseite: zwei Register — **Einrichtung** |
  **Protokoll** (dort landet das rohe Protokoll, statt unter der Seite zu hängen).
- **Pillen statt Knöpfe** (Regel 18): `border-radius:999px`, `--flaeche2`, `1px solid --rand`,
  `padding:6px 13px`, 12 px. **Gewählt = RAND, nicht Füllung**: 2 px `--akzent` + Schimmer.
  Keine Checkboxen — die gibt es im Haus nicht.
- **Druckfeedback** (Regel 19): `:active{transform:scale(0.95)}`.
- **12 px ist die Lesegrenze** (Regel 14), Nebenwerte 10,5. Dezimalkomma überall.
- **Abstände als Verhältnisse** (Regel 17): Grundwert 10 px — halb innerhalb einer Gruppe,
  doppelt zwischen Gruppen, dreifach zum nächsten Block.
- `[hidden]{display:none!important}` neben jedem `display:flex` (Regel 21).
- **`--akzent` ist auf der Einrichtungsseite das Hausorange `#f97b14`** — im Haus ist es
  veränderlich und bleibt grau, bis ein Lied Farbe mitbringt; in der Einrichtung läuft keins.
  So gelten alle Hausregeln wörtlich, und die Seite trägt die Hausfarbe. Der Verlauf
  Orange→Magenta bleibt der Wortmarke vorbehalten.

**Grundregeln der Seite (beschlossen 13.09.2026):**
- Links die Schrittliste: nur Haken (fertig), Punkt (läuft), leer (offen). Keine Balken.
- Rechts der laufende Schritt: Überschrift, Erklärtext, Prüfzeilen mit Haken, ein Balken
  nur, solange etwas geladen oder gerechnet wird — mit Zahlen (n von N, MB, Rest).
- Fragen als Karten mit Schaltflächen; Ausnahmefragen nur, wenn der Fall eintritt.
- Kein Konsolentext auf der Seite. Das rohe Protokoll nur zugeklappt („für die Fehlersuche").
- Die Konsole bleibt der Rückfall und bezieht ihre Zahlen aus derselben Quelle.
- **„Ton" ist kein Wort für Audiodateien** (Caspar_D, 13.09.2026: „ich hatte schon mal gesagt,
  dass Ton ein besch… Begriff hier ist"). Auf der Seite heißt es **Audiodateien**, im Zweifel
  **Suno-Dateien**. „Ton" nur dort, wo wirklich Klang gemeint ist (Klanganalyse, Ton- und
  Bilddaten). Vgl. [[nomenklatur-praezision]].

---

## Schritt 1 — Ordner prüfen: Schreibrecht, keine Verwalterrechte, Platz

**Überschrift (beschlossen):** „Ordner prüfen: Schreibrecht, keine Verwalterrechte, Platz"
(links kurz: „Ordner prüfen").

**Erklärtext der Seite:** KlangTresor schreibt nur in seinen eigenen Ordner — kein
Systemordner, keine Registry, keine Administratorrechte. Erhöhte Rechte wären sogar
schädlich: Alles Angelegte gehörte danach dem Verwalter, und du kämst an dein eigenes
Archiv nicht mehr heran.

**Was der Code tut, in dieser Reihenfolge (am endgültigen Ordner, nach der Wohin-Frage):**

| # | Aktion | Text | passt |
|---|---|---|---|
| 1 | Probedatei `.schreibprobe-<pid>` schreiben und löschen | „Schreibrecht im Projektordner: ja." / sonst Abbruch mit Hinweis auf `~/KlangTresor` | ja |
| 2 | Pfad auf Systembereiche prüfen (`program files`, `windows/`; `/usr/ /bin/ /sbin/ /system/ /library/`) | „Dieser Ordner liegt in einem Systembereich …" → *Trotzdem hier bleiben?* | ja — **Korrektur:** auf dem Mac nur `/Library/` am Anfang und `~/Library/`, nicht jedes `/library/` |
| 3 | Windows `net session`, sonst `uid == 0` | „Keine erhöhten Rechte nötig — und es laufen auch keine." / sonst Warnung → *Trotzdem so weitermachen?* | ja |
| 4 | `statfs`: freie Blöcke × Blockgröße; Warnung unter 1 GB | „Platz: 47,3 GB frei — die Einrichtung braucht rund 500 MB." | **nein — Korrektur:** Schwelle 1 GB, Text 500 MB, Bedarf ~900 MB (Node 30, ffmpeg 100, Pakete ~200, Modelle 550). Überall „rund 1 GB", auch im Wohin-Text. |
| 5 | nur Windows: Pfad beginnt mit `\\` (Netzfreigabe) — sagt es, fragt nicht | „KlangTresor liegt nicht auf dieser Maschine …" | ja, doppelt zur Wohin-Frage; kürzen |

**Drei Prüfzeilen im Normalfall:** Schreibrecht — ja · Keine erhöhten Rechte — und es laufen
auch keine · Platz — 47,3 GB frei, die Einrichtung braucht rund 1 GB.

**Regeln für die Ausnahmekarten (Caspar_D, 13.09.2026: „wo ist *hier* bei ‚hier bleiben' —
es sollte der Ordner angezeigt werden"; „was meint ‚abbrechen und verschieben'?"):**
- Der Erklärtext nennt den geprüften Ordner: „Geprüft wird `C:\Program Files\KlangTresor`."
- Jede Karte nennt den Ordner im Satz und auf der Schaltfläche: „Trotzdem in
  `C:\Program Files\KlangTresor` bleiben". Nie ein nacktes „hier".
- Die zweite Schaltfläche sagt, was dann passiert, und die Karte zählt die Handgriffe auf, die
  der Mensch selbst macht: 1. die Einrichtung beenden, 2. den ganzen Ordner verschieben,
  3. dort den Einstieg (`einrichten-windows.cmd` / `-macos.command` / `-linux.sh`) erneut
  starten — er macht weiter, wo er war. Beschriftung: „Beenden, ich verschiebe den Ordner".
- Dasselbe Muster für die anderen Ausnahmen (erhöhte Rechte: „Beenden, ich starte ohne
  Verwalterrechte neu"; zu wenig Platz: „Beenden, ich schaffe Platz").

---

## Schritt 2 — Was wird gebraucht, was ist schon da? Archiv, Werkzeuge, KI-Modelle

**Beschlossen (Weg B, Bestandsaufnahme; Texte von Caspar_D, 13.09.2026).** Der Schritt sieht
nach Archiv, ffmpeg, Paketen, Modellen und Port und sagt, was die nächsten Schritte holen
werden — mit Größen. Kein „Weiter?"-Klick im Normalfall. Links kurz: „Was ist schon da?".

**Erklärtext:** `C:\Users\Jörg\KlangTresor` zeigt folgendes. Nichts wird doppelt geholt und
nichts überschrieben: Was fehlt, wird in den nächsten Schritten geholt — ich sage genau, worum
es sich handelt.

**Fünf Zeilen (✓ vorhanden, → wird geholt):**
- KlangTresor-Archiv — 251 Titel sind da, nur Änderungen werden ergänzt
- ffmpeg zur Medienbearbeitung — fehlt, wird geholt (rund 100 MB)
- Pakete: Programmbausteine des Servers — fehlen, werden geholt (19 Pakete, rund 240 MB)
  *(kein eigenes Werkzeug wie ffmpeg, sondern Teile von KlangTresor selbst: Bildverkleinerung,
  Klangraum-Rechenkern, Datenbankfreie Suche u. a.)*
- KI-Modelle zur Klanganalyse und Stemextraktion — 11 von 11 im Zwischenlager dieses Rechners,
  werden kopiert (550 MB). *Nicht dabei: Whisper (Text-Zeitmarken) — das gehört zum Haus und
  wird separat gehalten; „Untertiteloptimierung" wäre hier falsch.*
- Port 8788 für den Server, der lokal den KlangTresor im Browser darstellt — frei

**Summe:** Zu holen: rund 340 MB. Dauer: ein paar Minuten bis ca. 30 min für alles bei
Standard-Netz-Anbindung.

**Was der Code tut / Korrekturen beim Bau:**
- Sanity (package.json, bin/, server/, web/) bleibt, Abbruch mit Hinweis.
- Archiv am Katalog erkennen, Titelzahl aus `library/songs/`.
- NEU: die Prüfungen aus Schritt 3–5 (ffmpeg da? `node_modules` da? Modelle in `library/modelle`
  bzw. im Zwischenlager?) hier vorab aufrufen, nur anzeigen; geholt wird weiter dort.
- Port-Prüfung wie bisher (1,5 s Verbindungsversuch).
- Die beiden „Weiter?"-Fragen entfallen.
- Nachbar-Archiv (Geschwisterordner): Karte mit zwei Wegen — „Das Archiv in `…/MySuno`
  weiterführen" (Vorgabe; derselbe Umzugsweg wie bei der Wohin-Frage) / „In `…/KlangTresor` neu
  anfangen". Text: „In `C:\Users\Jörg\KlangTresor` ist noch kein Archiv — aber nebenan liegt
  eines: `C:\Users\Jörg\MySuno` mit 251 Titeln. Vermutlich ist das der Ordner, der gemeint war.
  Willst du den nutzen oder ein neues Archiv komplett neu aufsetzen?"
- Adresse belegt: „Unter `localhost:8788` antwortet bereits ein KlangTresor. Solange der läuft,
  kann dieser hier nicht starten — und der Browser würde den anderen zeigen. Beende dort erst
  das Fenster mit Strg-C." Schaltflächen „Trotzdem weitermachen" / „Beenden, ich schließe den
  anderen zuerst".

---

## Schritt 3 — Lokale Medienverarbeitung mit ffmpeg

**Grundregel, ab hier für ALLE Schritte (Caspar_D, 13.09.2026): „wenn ich gerade unter Windows
bin, interessieren mich die anderen nicht und umgekehrt."** Jeder Text nennt nur das System,
auf dem er gerade läuft — kein „unter Windows … auf Mac und Linux …" in einem Satz, keine
Befehle für fremde Systeme, keine Pfade in fremder Schreibweise.

**Überschrift (Windows):** „Lokale Medienverarbeitung mit ffmpeg: Lokale Verfügbarkeit wird
geprüft, ggf. wird das Paket geladen"
**Überschrift (Mac/Linux):** „Lokale Medienverarbeitung mit ffmpeg: Lokale Verfügbarkeit wird
geprüft" — dort wird nichts geladen, der Paketverwalter ist zuständig.
Links kurz: „ffmpeg".

**Erklärtext (Windows):** ffmpeg arbeitet mit den Ton- und Bilddaten: Klanganalyse,
Wellenformen, Videoschnitt. Es wird geholt und nach `…\KlangTresor\werkzeug\ffmpeg` gelegt.
**Erklärtext (Mac):** … Auf dem Mac ist dafür der Paketverwalter zuständig — ein Befehl im
Terminal, und es gilt für den ganzen Rechner. (Linux entsprechend.)

**Prüfzeile:** „ffmpeg — nicht auf diesem Rechner: Es wird geholt" bzw. „✓ ffmpeg — liegt in
`werkzeug\ffmpeg`" / „✓ ffmpeg — auf diesem Rechner vorhanden" / „✓ ffmpeg — aus dem
Zwischenlager dieses Rechners kopiert".

**Balken (nur während des Ladens, Windows):** Kopf „ffmpeg wird geladen · von gyan.dev,
Adresse aus quellen.txt", darunter „41,2 MB von 98,7 MB" und „3,4 MB/s · noch etwa 17 s".
Die Zahlen liefert `holen()` bereits (Bytes/Gesamt); Tempo und Rest daraus gerechnet.

**Ausnahmekarte Windows (Laden fehlgeschlagen):** „ffmpeg holen hat nicht geklappt:
<Grund> nach 41,2 MB. ffmpeg ist nicht unbedingt notwendig — allerdings funktionieren
Klangmessung und Videoschnitt nicht. Ein späterer Lauf holt es nach." Zweiter Absatz, der
Weg von Hand — mit der echten Adresse aus `quellen.txt` und dem Zielpfad: „<URL> laden,
auspacken und den Inhalt nach `…\werkzeug\ffmpeg` legen — darin muss `bin\ffmpeg.exe`
liegen." Schaltflächen: Noch einmal versuchen (Vorgabe) · Ich habe es hingelegt — nochmal
prüfen · Ohne ffmpeg weitermachen · Beenden, später neu starten.

**Ausnahmekarte Mac/Linux (ffmpeg fehlt):** „ffmpeg fehlt. Im Terminal einmal: `brew install
ffmpeg`" (Linux: `sudo apt install ffmpeg`, nach Distribution) — „Das dauert einige Zeit.
Danach hier ‚nochmal prüfen' — oder jetzt ohne weitermachen, ein späterer Lauf findet es
dann." Schaltflächen: Ich habe es installiert — nochmal prüfen (Vorgabe) · Ohne ffmpeg
weitermachen.

**Was der Code tut / Korrekturen beim Bau:**
- Sucht `werkzeug/ffmpeg/bin/ffmpeg(.exe)`, dann `ffmpeg` im PATH; fehlt beides, kopiert es aus
  dem Zwischenlager des Rechners (`%LOCALAPPDATA%\KlangTresor` / `~/Library/Caches/…`).
  **Korrektur:** die Kopie aus dem Zwischenlager wird heute als „ffmpeg ist da" gemeldet —
  eigene Prüfzeile.
- Windows: Adresse aus `quellen.txt`, laden, auspacken, Ordner heben, Kopie ins Zwischenlager.
- **NEU:** „nochmal prüfen" als Wiederholung der Suche, ohne Neustart der Einrichtung — ersetzt
  das heutige „Danach dieses Einrichten noch einmal starten".
- Hängt ffmpeg an den PATH dieses Prozesses und schreibt `werkzeug/werkzeug.txt` (Pfade zu node
  und ffmpeg) für den Server. Caspar_D, 13.09.2026: „nicht installiert, nichts am System
  verändert — interessiert niemanden, weglassen, hab ich doch genau so angegeben." Der Satz
  steht nicht auf der Seite; der Zielpfad sagt es schon.

---

## Schritt 4 — Programmbausteine des Servers: 19 Pakete werden geladen und eingerichtet

**Überschrift (beschlossen, Variante a).** Links kurz: „Pakete".

**Erklärtext:** Fertige Bausteine, die KlangTresor benutzt statt sie selbst zu bauen: der
Rechenkern für die Klangmodelle, die Karte des Klangraums, Matrixrechnung. Sie liegen nicht im
Paket, weil sie für jedes System eigens gebaut werden — deshalb werden sie jetzt geholt, nach
`…\KlangTresor\node_modules`.

**Balken (nur während des Laufs):** Kopf „Pakete werden geladen und eingerichtet · Paket 12 von
19", darunter „onnxruntime-node — 152 MB von rund 240 MB" und „noch etwa 1 Minute". Dazu die
Zeile, die die stille Phase erklärt: „Zwischendurch ist es still: Manche Bausteine holen nach
dem Laden noch eigene Teile nach. Das dauert, sieht aber nur nach Stillstand aus."

**Ausnahmekarte (Laden fehlgeschlagen):** „Die Pakete konnten nicht geholt werden: <Fehler>.
Ohne sie startet der Server nicht — dieser Schritt ist der einzige, der sich nicht überspringen
lässt." Zweiter Absatz: „Meist hilft: noch einmal versuchen. Bleibt es dabei, blockiert oft ein
Firmennetz oder ein Virenschutz den Zugang zu `registry.npmjs.org`." Schaltflächen: Noch einmal
versuchen (Vorgabe) · Beenden, später neu starten. **Kein „Überspringen"** — heute bietet
`wieWeiter()` es an, obwohl der Server danach nicht startet.

**Was der Code tut (gemessen 13.09.2026):**
- Ruft `npm-cli.js` direkt mit dem laufenden Node auf (nicht `npm.cmd`) — sonst scheitert es auf
  Netzfreigaben an cmd.exe; dort zusätzlich `pushd` als Laufwerksbuchstabe.
- `npm install` liest `package-lock.json`: **19 Pakete**, Ergebnis **244 MB** in `node_modules/`
  (ml-matrix 55, onnxruntime-node 41, umap-js 35, onnxruntime-common 28 MB). `onnxruntime-node`
  lädt in seinem Installationsskript noch eigene Binärdateien nach — daher die Stille.
- Fortschritt ist messbar, obwohl npm schweigt: alle 500 ms `node_modules/` messen (Bytes von
  ~240 MB erwartet) und die angelegten Ordner zählen (Paket n von 19).

**FEHLER GEFUNDEN UND BEHOBEN (13.09.2026, beim Durchgehen der Texte):**
`if (!npmLaufen([…]))` — `npmLaufen` ist `async`, also stand dort ein Promise, und `!Promise`
ist immer falsch. Ein **gescheitertes `npm install` wurde als „Pakete sind da." gemeldet**; die
Frage „noch einmal / überspringen / Schluss" konnte nie erscheinen, und Schritt 5 lief in einen
Server ohne Pakete. `await` ergänzt.

---

## Schritt 5 — KI-Modelle: Stemtrennung, Musikstil und Textverständnis

**AM LADEN WIRD NICHTS GEÄNDERT.** Caspar_D, 13.09.2026: „am Laden der KI-Modelle nichts
verändern, der Schritt bleibt wie er ist." Es werden weiter alle 11 Dateien in einem Zug
geholt — kein Teilen, keine Rückfrage, kein Nachladen später. Geändert werden nur die Texte,
die das Geholte benennen.

**Überschrift:** „KI-Modelle: Stemtrennung, Musikstil und Textverständnis — 11 Dateien, rund
560 MB". Links kurz: „KI-Modelle".

**Erklärtext:** Sie rechnen später bei dir, auf deinem Rechner: nichts davon verlässt ihn dafür. Geholt wird einmal; auf diesem Rechner Gefundenes wird kopiert statt geladen.

**Drei Kacheln (jede hakt einzeln ab) — gemessen am 13.09.2026 in library/modelle:**
| Kachel | Text | Dateien | Größe |
|---|---|---|---|
| Musikstil | Hört heraus, wonach ein Stück klingt: Genre, Stimmung, Instrumente. | 4 | 26 MB |
| Stemtrennung | Zerlegt ein Lied in Gesang, Schlagzeug, Bass, Gitarre, Klavier und Rest. | 1 | 258 MB |
| Textverständnis | Macht aus Liedtexten Zahlen — damit Ähnliches beieinander liegt. | 2 | 295 MB |

**Korrektur der Texte (nicht des Ladens):** Heute heißt es „rund 550 MB — Stemtrennung und
Musikstil". Gemessen sind es **562 MB**, und die dritte Gruppe (mpnet, 295 MB, für
`geschichten.js`, `geschichten-achsen.js`, `ortsbegriffe.js`) fehlt im Text ganz — mehr als
die Hälfte des Downloads war unbenannt.

**Balken (nur während des Ladens):** „htdemucs_6s wird geladen · Datei 5 von 11 · von
huggingface.co", darunter „98 MB von 258 MB · insgesamt 214 MB von 562 MB" und „2,8 MB/s ·
noch etwa 2 Minuten". `modelle-holen.js` hat die Bytes bereits (Fortschrittszeile), die
Sollgrößen stehen in seiner Dateiliste.

**Ausnahmekarte (eine Datei kam nicht an):** nennt die Datei statt „Modelle holen hat nicht
geklappt": „`htdemucs_6s.onnx` kam nicht an: <Grund> nach 98 MB. Ohne dieses Modell läuft alles
andere — nur die Stemtrennung fehlt, und die lässt sich jederzeit nachholen." Dazu der Weg von
Hand, den `modelle-holen.js` heute schon druckt. Schaltflächen: Noch einmal versuchen (Vorgabe)
· Ohne <diese Funktion> weitermachen · Beenden, später neu starten.

---

## Schritt 6 — Wie heißt du bei Suno? Der Name entscheidet, wessen Daten geholt werden

**Beschlossen 13.09.2026** („das ist gut gemacht"). Links kurz: „Dein Suno-Name". Die einzige
Eingabe der ganzen Einrichtung.

**KORREKTUR (Caspar_D, 13.09.2026): „wessen Daten geholt werden, Musik können wir nicht mehr
holen."** Seit dem 03.09.2026 gibt Suno den Ton nicht mehr über Links heraus — von der
Profilseite kommen Daten, keine Audiodateien. Überall „Daten" statt „Musik", auch im
Erklärtext („bereit, dein Archiv anzulegen" statt „bereit, deine Musik aufzunehmen").

**Erklärtext (aus dem Skript, es gehört zu „immer gut erklären, was passiert"):**
KlangTresor ist eingerichtet und bereit, dein Archiv anzulegen. Dazu ruft es deine
Suno-Profilseite auf wie jeder beliebige Besucher: nur lesend, ohne Passwort, ohne Anmeldung.
Was ein Fremder sehen kann, kann KlangTresor holen. Alles andere kommt später.

**Das Feld:** `suno.com/@` steht als fester Vorsatz VOR dem Eingabefeld — so kann niemand das
@ oder die ganze Adresse mit eintippen (der häufigste Fehler). Darunter ein Bild der
Adresszeile mit hervorgehobenem Teil: `suno.com/@`**musikfreund**. Dazu: „**Nicht** deine
E-Mail-Adresse. **Nicht** der Anzeigename über deinen Liedern — der darf Leerzeichen und
Großbuchstaben haben, der Suno-Name nicht."

**NEU: Knopf „Prüfen".** Die Seite fragt das Profil sofort ab und meldet „251 Titel gefunden"
oder die Ausnahmekarte. Heute merkt man einen Vertipper erst, wenn Schritt 7 nichts findet.

**Ausnahmekarte (Name nicht gefunden):** „Unter `suno.com/@musikfreud` ist kein Profil zu
sehen. Tippfehler? Oder ist das Profil auf privat gestellt — dann kann auch KlangTresor nichts
lesen." Schaltflächen: Anderen Namen eingeben (Vorgabe) · Trotzdem weiter mit @…

**Was der Code tut:** liest `handle` aus `library/konfig.json` — ist er da, wird nicht gefragt
(„✓ Gemerkt: @caspar_d"). Sonst Eingabe, dabei `@` abschneiden, trimmen, **klein schreiben**
(seit 13.09.2026: „Caspar_D" ≠ „caspar_d" hatte den Katalog geleert). Leer = Abbruch.

---

## Schritt 7 — Deine Songliste von @…: Titel, Texte, Stile, Alben

**Beschlossen 13.09.2026: „hier alles so lassen."** Die Skizze gilt wie gezeigt; meine beiden
Zusatzvorschläge (den Morgenlauf-Satz nach Schritt 10 verschieben, eine eigene Hakenzeile für
den Katalogbau) sind damit VOM TISCH. Links kurz: „Songliste".

**Erklärtext:** Gelesen wird deine Profilseite, Seite für Seite, zwanzig Titel je Seite. Es
kommen Titel, Liedtexte, Stilangaben, Modell und Datum — dazu Abrufe, Herzen und
Kommentarzahlen, und die Alben, soweit sie öffentlich stehen. Noch keine Audiodateien: die
kommen in den nächsten beiden Schritten.

**Balken:** „Profilseite wird gelesen · Seite 8 von 13", darunter „156 von 251 Titeln" und
„noch etwa 40 Sekunden". Die Gesamtzahl steht nach der ersten Seite fest (`sammeln.js` kennt
sie als `gesamt`). Dazu während des Wartens: „Eine Anfrage nach der anderen, nie hundert auf
einmal — Sunos Server soll von KlangTresor keine Last haben. Deshalb dauert es."

**Die Titel laufen durch, während gesammelt wird:** „Sommerregen · 14.08.2026 · 412 Abrufe".
Der erste Moment, in dem der Mensch seine eigene Musik sieht.

**Vier Ergebniskacheln:** Titel · davon neu · Alben · Liedtexte.

**Ausnahmekarte (Sammeln fehlgeschlagen):** „Die Songliste konnte nicht geholt werden:
<Fehler>. Ohne sie gibt es nichts zu archivieren — die nächsten Schritte fänden nichts vor."
Schaltflächen: Noch einmal versuchen (Vorgabe) · **Anderen Suno-Namen eingeben** (neu; heute
gibt es nur wiederholen/abbrechen, obwohl ein Vertipper die häufigste Ursache ist) · Beenden,
später neu starten.

**Was der Code tut:** `sammeln.js <name>` liest die Profilseite seitenweise (20 je Seite) und
legt Rohdaten in `library/roh/` ab; direkt danach `aufbereiten.js`, das den Katalog baut. Der
Aufruf MUSS hier stehen — sonst fände Schritt 8 einen leeren Katalog und ordnete keine einzige
Tondatei zu (Fehler vom 11.09.2026).

---

## Schritt 8 — Bereits heruntergeladene Suno-Dateien werden erkannt und eingeordnet

**Überschrift (Caspar_D, 13.09.2026, wörtlich — nur die Beugung gerade gezogen:
„heruntergeladene").** Links kurz: „Deine Suno-Dateien".

**Erklärtext (Caspar_D, wörtlich):** Die Daten für deine KlangTresor-Bibliothek sind jetzt da —
es fehlen die Audiodateien. Suno gibt sie seit dem 03.09.2026 nicht mehr über Links heraus,
selbst dem Besitzer nicht. Aber du hast sie vermutlich längst auf der Platte. Erkannt werden
sie durch KlangTresor am Inhalt, nie am Dateinamen: Suno schreibt eine Kennung in den Kopf
jeder Datei. KlangTresor wird nur lesen und kopieren. Nichts wird verschoben, nichts gelöscht.

**Die Suchorte stehen als Liste und haken einzeln ab, während gesucht wird:**
„✓ C:\Users\Jörg\Downloads — 1.146 Dateien durchgesehen, 48 von Suno" · „→ C:\Users\Jörg\Music
— wird durchgesehen …" · „◇ D:\Backup\Suno 2025 — von dir gewählt, danach". Heute sieht man
während der ganzen Suche nichts.

**Der eigene Ordner ist eine Schaltfläche, keine Ja/Nein-Frage:** „Liegt dein Suno-Zeug noch
woanders — in einem Backup, auf einer externen Platte? Durchsucht wird bis sechs Ebenen tief;
der Ordner wird gemerkt und bei jedem Abgleich wieder angesehen." → „Ordner wählen …"
(Vorgabe) / „Nein, die beiden oben genügen".

**Balken:** „Dateien werden geprüft und eingeordnet · Datei 812 von 1.146", darunter
„Sommerregen.mp3 — 48 übernommen, 512 MB" und „noch etwa 20 Sekunden".

**Vier Ergebniskacheln:** übernommen · schon im Archiv · nicht von Suno · **noch ohne
Audiodatei** (die Zahl, die heute im Fließtext untergeht — sie ist der Übergang zu dem, was das
Lesezeichen später holt).

**Was der Code tut:** `uebernehmen.js --tun` durchsucht Download- und Musikordner (vom System
erfragt, OneDrive mitgedacht) und den gewählten Ordner — sechs Ebenen tief, Symlinks aus,
Deckel bei 20.000 Ordnern. Aus den ersten 64 KB liest es die Suno-Kennung, ordnet über den
Katalog zu, kopiert (nie verschieben), prüft die Kopie, merkt sich per Größe+Zeit das schon
Gesehene. Der gewählte Ordner landet in `konfig.sunoOrdner`.

---

## Schritt 9 — Titelbilder und Bewegtbilder werden geladen und aufbereitet

**Beschlossen 13.09.2026 („das ist gut so, prima").** Links kurz: „Bilder". Der längste Schritt;
oben rechts läuft die Restzeit mit.

**Erklärtext:** Zu jedem Titel gehört sein Bild — und wo Suno eines hat, ein kurzes Video.
Beides liegt offen auf Sunos Bildspeicher, dafür braucht es keine Anmeldung. Aus den Bildern
rechnet KlangTresor danach die Kacheln und die Farben, mit denen die Oberfläche sich später
einfärbt. Das ist der längste Schritt.

**Drei Teilaufgaben, einzeln abhakend** (heute rauschen sie als `[1/3] [2/3] [3/3]` durch):
- Titelbilder und Videos — 251 Titel, 137 geladen  (`laden.js --alle`)
- Kacheln im Format 3:4 — wird gerechnet …  (`kacheln.js`)
- Farbpaletten aus den Bildern — danach  (`farben.js`)
Dass am Ende *gerechnet* und nicht mehr geladen wird, erklärt die stillen Minuten.

**Balken:** „Titelbilder und Videos werden geladen · Titel 137 von 251", darunter „Sommerregen —
2,1 GB geladen" und „3,4 MB/s · noch etwa 6 Minuten". Statt der Zeichenkolonne `G V · G`.

**Die Bilder erscheinen als Raster, während sie ankommen** — neue leuchten kurz auf. Der Moment,
in dem die Bibliothek sichtbar wird.

**Abbrechen ist eine Schaltfläche, keine Taste:** „**Du musst nicht warten.** KlangTresor kann
jetzt schon starten — die Bilder holt der rote Knopf oben rechts später nach, und was da ist,
wird nicht noch einmal geladen. Du siehst dann eine vollständige Bibliothek, nur mit ein paar
grauen Kacheln." → „Jetzt starten, Rest später" (Vorgabe) / „Weiter warten". Escape tut
weiterhin dasselbe (`laeuftAbbrechbar`), aber niemand muss eine Taste erraten.

---

## Schritt 10 — Fertig: und was nur du selbst holen kannst

**Beschlossen 13.09.2026 („genau so") — und zugleich das Muster für die HAUSFORM aller
Schritte.** Links kurz: „Zum Schluss". Oben rechts im Kopf steht „eingerichtet · in 11 Minuten".

**Der Kasten „KlangTresor ist eingerichtet."** mit vier Zahlen (Titel · mit Audiodatei · Alben ·
Bilder) und darunter die Adressen: „Auf diesem Rechner: http://localhost:8788" · „Im WLAN, etwa
vom Handy: http://192.168.1.42:8788" · „Auf dem Schreibtisch liegt jetzt „KlangTresor" — damit
startest du es künftig."

**Dann ehrlich, was fehlt:** „Bis hierher war alles öffentlich — KlangTresor hat nur gelesen,
was jeder Besucher deiner Profilseite sehen kann. Was nur dir gehört, fehlt noch:" — deine
unveröffentlichten Titel (mit Abrufen und Herzen) · wer dir gefolgt ist, wer geherzt, wer
kommentiert hat (mit Namen und Zeitpunkt) · deine privaten Alben · Sunos eigene Analyse (Tempo,
Taktraster, Hüllkurve) · die Wort-Zeitmarken für den mitlaufenden Text · **die Audiodateien**
für alles, was du bei Suno schon freigeschaltet hast.

**Der Grund (am Rand, mit Akzentlinie):** „Dafür braucht KlangTresor dich — und das hat einen
guten Grund. Der Ausweis, den Suno verlangt, lebt etwa eine Minute und gilt nur im Browser.
KlangTresor bekommt ihn nicht und soll ihn nicht bekommen: So liegt auf deiner Platte kein
Schlüssel zu deinem Suno-Konto. Deshalb sitzt das Werkzeug als Lesezeichen dort, wo du ohnehin
angemeldet bist — ein Klick, einmal am Tag."

**Wo es weitergeht:** „Auf der KlangTresor-Seite findest du oben rechts den roten Knopf für den
täglichen Abgleich — und darunter die Frage **„Willst Du auch die nur Dir zugänglichen Daten im
KlangTresor sehen?"**. Dahinter liegt das Lesezeichen zum Hineinziehen, samt Anleitung. Chrome
wird dafür gebraucht." Dazu: „Was du bei Suno schon freigeschaltet hast, kostet dabei nichts —
ein Guthaben zahlst du nur beim Freischalten selbst, und das machst du bei Suno, nicht hier.
Das alles geht auch später jederzeit: KlangTresor läuft auch ohne."

**Windows-Karte (nur dort):** „Windows fragt in einem Moment, ob „Node.js JavaScript Runtime"
ins Netzwerk darf. Das ist der KlangTresor-Server. Hake **„Private Netzwerke"** an — sonst
erreichst du ihn im eigenen WLAN nicht, etwa vom Handy — und klicke „Zugriff zulassen".
„Öffentliche Netzwerke" brauchst du nicht."

**Pillen unten:** „KlangTresor öffnen" (an) · „Dieses Fenster schließen".

**Was der Code tut:** setzt `ZUSTAND.fertig`, legt die Schreibtisch-Verknüpfung an
(`schreibtischVerknuepfung`), sammelt die WLAN-Adressen aus `os.networkInterfaces()`, schließt
readline und öffnet `http://localhost:8788` (Chrome bevorzugt, sonst Systembrowser) — davor
unter Windows die Firewall-Ansage. `--ohne-start` überspringt das Öffnen.
