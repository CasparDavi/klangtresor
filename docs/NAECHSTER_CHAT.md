# Für den nächsten Chat — Stand 23.09.2026

## In drei Sätzen

Das Projekt hieß bis zum 24.08.2026 **MySuno** und heißt jetzt
**KlangTresor**; es steht seit dem 25.08. öffentlich unter
[github.com/CasparDavi/klangtresor](https://github.com/CasparDavi/klangtresor)
unter MIT-Lizenz. Der Ordner auf der Platte heißt weiterhin
`SunoArchive` — das stört nichts, kein Skript nimmt einen Namen an.
Die alte git-Historie ist **nicht** mitgegangen: Sie liegt hier als
`.git-alt-20260824/` und als Bundle in `../SunoArchive-privat/`.

**Das Neueste steht ganz unten.** Dieses Dokument wächst nach hinten;
wer eilig ist, liest diesen Kopf, den letzten Abschnitt und
docs/OFFEN.md.

ZUERST LESEN: den **letzten Abschnitt** dieses Dokuments (dort steht die
**Wiedervorlage** — was Caspar_Ds Auge oder Entscheidung braucht — und die
offenen Punkte in Reihenfolge), dann docs/haus/HAUSREGELN.md, dann
docs/effektclip/EFFEKTCLIP-REGELN.md. Fürs Tonstudio docs/ton/TONSTUDIO.md,
fürs Einmessen docs/ton/EINMESSEN.md. Das alte docs/OFFEN.md liegt unter
docs/archiv/.

## Was gerade läuft

**Nichts Langlaufendes mehr.** Die Nachtläufe vom 25.08. sind
abgeschlossen — Stems 321/321, Töne 321/321, keine Ausfälle. Was der
25.08. an Hängern gekostet hat, steht weiter unten im Abschnitt vom
25.08.; der Pipe-Fix hat gehalten.

Anzustoßen sind noch die beiden Nachbarschaftsläufe, aber sie dauern
Minuten, nicht Stunden, und laufen aus der Oberfläche heraus (Panel
*Nachbarschaft* → „Neue holen"). Wer sie von Hand startet:

```
node bin/community-profile.js    Sekunden bis Minuten
node bin/community-hirsch.js     ~20 min beim ersten vollen Lauf
```

**Zu Beginn jeder Sitzung** — seit Tarja (`myinqi`) mitschreibt:

```
node bin/fremdstand.js
```

# Übergabetext für den nächsten Chat

Diesen Text in eine neue Sitzung kopieren.

---

Ich arbeite an **MySuno**, einem lokalen Archiv meiner auf Suno
veröffentlichten Songs. Es liegt im Projektordner, in dem auch
`bin/` und `server/` liegen — wie er heißt, ist gleichgültig.

**Lies bitte zuerst ALLE Übergabedokumente, bevor du irgendetwas
erkundest oder vorschlägst:**

- `docs/UEBERGABE.md` — Einstieg, Verzeichnis, Abläufe, Fallstricke
- `docs/NORMEN.md` — Lautheitsnormen, die Torregel, Zielpegel, CB Audio Analyzer
- `docs/SUNO-API.md` — **neu**: alle 273 Wege der Suno-Web-API, geordnet, mit Sicherheitsgrad — erst hier nachsehen, dann raten
- `docs/VISUALIZER.md` — Bühne, Analysemodus, alle Darstellungsregeln
- `docs/DATENEXTRAKTION.md` — Suno-Endpunkte, was Token braucht
- `docs/FARBHANDLING.md` — Farbextraktion, Farbräume, jede Regel mit Messwert
- `docs/BACKLOG.md` — was offen ist, und was verworfen wurde
- `docs/HISTORY.md` — Chronologie inklusive aller Irrwege
- `WAV-PROTOKOLL.md` — WAV-Erzeugung: Endpunkt, Skript, Ablauf
- `START-HIER.md` — das Einstiegsdokument für JEDEN Empfänger (seit 23.08.2026
  generisch, nicht mehr auf eine Person gemünzt); sagt, was man anfassen kann

**Das ist wörtlich gemeint.** Beim letzten Übergang wurde nur der
Übergabetext gelesen und der Rest übersprungen; in der Folge kamen
Vorschläge, die gegen bereits erarbeitete Regeln verstießen. Das hat
Zeit und Nerven gekostet. Die Dokumente sind eine Zusammenfassung, kein
Gesprächsprotokoll — was dort steht, wurde teuer erarbeitet.

## Stand 20.08.2026, früh

**Arbeitsteilung neu (20.08. vormittags):** Das Lesezeichen ist die QUELLE, der
rote Knopf der VERARBEITER. Der Knopf prüft die jüngste Profil-Ernte:
jünger als 2 h → verwerten statt Suno neu fragen (sammeln.js
--aus-roh; Fenster nennt Herkunft + „Trotzdem frisch holen");
älter/keine → selbst holen (öffentlich, wie immer — Lesezeichen ist
nie Pflicht). aufbereiten.js liest ALLE liegengebliebenen Ernten und
webt jeden Tagesstand in den Zählerverlauf (idempotent); Verarbeitetes
wandert nach library/roh/verarbeitet/ (Tagebuch, nichts löschen).
Suno-v3-Zeitmarken importiert er als worteV3 in den Katalog (55 Songs
haben sie schon); Buehnen-Spurwahl „Suno v2 / v3 / Whisper" im Pult,
nur wo mehrere Spuren existieren. reaktionen.js fragt gezielt (nur
Songs mit mehr Kommentaren als gesichert), voller Durchgang alle 3
Tage. Lesezeichen: Option „Suno v3 nachladen" (erster Lauf stößt an,
running zählt nicht, nächster sammelt ein), Statuszeilen in Klartext,
Reste-Hinweis grau statt Alarm. Whisper-Kette läuft: erst Songs ohne
Suno-Marken, dann automatisch --alle (alle übrigen, mehrere Nächte).

## Stand 20.08.2026, nachts

**Läuft gerade über Nacht:** `node bin/whisper.js --still` (gestartet
20.08. ~23:35, Protokoll `library/whisper-lauf.log`), 67 Songs ohne
Sunos Zeitmarken, neueste zuerst, ~1,5× Echtzeit → Morgen früh:
`node bin/aufbereiten.js`, dann stehen die Whisper-Zeitmarken im
Katalog. Alles dazu in `docs/WHISPER.md`.

**Neu am 20.08.:** Kategorienfilter IM Suchfeld (Pfeil → Schlüssel →
Werte mit Anzahl, nur kategoriale Schlüssel); Sortierung „Bewegung, 7
Tage" (+ Kombizahl Plays + 2·Likes + 3·Kommentare) aus dem
Zählerverlauf; Profilfenster hinter dem Avatar als Zahlenseite: Top-10
(Likes/Plays/Kommentare, gestuft nach gesamt/4 Wochen/1 Woche),
Artwork-Reihe der meistgelikten, Kachelreihen (Wochentage+Stunden,
Jahreszeiten+Monate, Tonarten im Quintenzirkel, Tempo, Dauer,
Modelle), Likes je 100 Plays, Likes je 3 Minuten, längste Lyrics
(nur gesungener Text, `lyricsWorte` aus `katalog.js`), zwei
Karussells „Befunde" und „Kuriosa", Community-Ranglisten mit
Monat/Jahr/Immer. Drei Farben: Orange = Sunos Zähler, Blau = Zeit,
Grün = gemessen. Regeln aus dem Tag: Titel gleich hoch, Hinweise als
Fußzeile, Chips nur mit Rand, Kacheln einer Zeile gleich groß.

## Stand 19.08.2026, abends

**321 Songs** (248 veröffentlicht, 73 privat), 25 Playlists, alle als
WAV, **alle vorgerechnet** (Ablage 3,2 GB), 22 GB Medien.
**471 Kommentare + 308 Antworten** von 107 Menschen gesichert.

Server: `./bin/server-start.sh` (lädt Änderungen selbst nach, nie
mitten im Lauf) oder `node server/server.js` (einfach, für Empfänger).
Port 8788. Branch `master`, lokal, kein Fernarchiv. 70 Commits am
19.08.; der letzte steht in `git log`.

## Was am 19.08.2026 entstand

Ein langer Tag. Die Reihenfolge, in der man es lesen sollte:

**1 · Die Ablage.** Jede Analyse wird einmal gerechnet und als `.bin`
plus zwei WebP abgelegt (`library/analyse/`). Laden statt rechnen:
2 s statt 17. `bin/vorrechnen.js` rechnet in Node, parallel, ein
Kindprozeß je Kern — **neunmal schneller, seit der Kern nicht mehr in
`vm.runInContext` läuft** (224 s → 25 s, nur durch den Kontext).
Format und Bildmathematik liegen in `web/fremd/analyse-ablage.js`,
von Browser und Node gemeinsam benutzt. WebP über `cwebp`, nicht
ffmpeg (das hat hier keinen Encoder); Breite 16383, die WebP-Grenze.

**2 · Der Morgenlauf.** Roter Knopf oben rechts in der Albumansicht,
zwei Stufen: erst sehen (Liste mit Kacheln — neu, geändert, neue
Zahlen), dann *Übernehmen* (Katalog, Kommentare, Medien, Analysen,
Index). Selbstkalibrierender Balken, lernt die Dauer je Song. Alles
ohne Anmeldung — die Profil-Schnittstelle braucht keine.

**3 · Das Lesezeichen** (`browser/morgens.js`) für alles, was Token
braucht: Sunos eigene Analyse (Tempo, Struktur, Hüllkurve), private
Songs, Playlists, wer reagiert hat, WAV-Anstoß. Läuft auf einem
angemeldeten Suno-Tab, fragt erst, was es holen soll, sichert sofort
(IndexedDB, dann Server, in Paketen), überlebt den Tab. **Der
Server-Login über ein Cookie ist entschieden: nein** — siehe unten.

**4 · Kommentare und Reaktionen.** `bin/reaktionen.js` holt Kommentare
und Antworten (öffentlich, `/api/gen/<id>/comments`), das Lesezeichen
den Benachrichtigungsstrom (`/api/notification/v2`, Token) — das ist
die Like-Liste: wer wann. Alles in **einer** Datei
`library/reaktionen.ndjson`, angehängt, nie überschrieben (exFAT:
eine Datei je Song wären 321 MB).

**5 · Das Community-Fenster.** Klick auf Daumen oder Sprechblase an
einer Kachel: öffnet an der Maus, Rand in der Songfarbe, drei Small
Multiples (Plays, Likes, Kommentare über die Tage), Likes mit Namen
soweit der Strom reicht, Kommentare mit Antworten eingerückt, Namen
anklickbar → Person mit ihrer Spur durchs Archiv, Zurück-Pfeil im
Kopf, „Suno-Thread öffnen". Emojis richtig, weil `textContent`.

**6 · Analyse-Index und Sortierung.** `bin/analyse-index.js` zieht die
Skalare aus 321 `.bin` in 77 KB. Die Albumseite sortiert danach —
Schnellste, Lauteste, Dynamischste … — als Gruppe „Gemessen", **nur
wenn der Index da ist**. Backlog 5.3 eingelöst.

**7 · Kategoriale Filter im Suchfeld.** Dropdown mit zwölf Schlüsseln,
Werteliste aus dem Bestand mit Anzahl, Klick setzt `tonart:"E Dur"`.
`von:tarja_ravenveil`, `ohne:zeitmarken`, `modus:moll` …

**8 · Die Tonart war kaputt.** 298 von 321 „F# Dur" — ein Artefakt
des 1024er-Bin-Rasters. Jetzt `schaetzeTonart()` mit 4096, eigene
Funktion, Selbsttest mit Tonleitern aus Sinustönen in
`bin/pruefe-lautheit.js` (20 von 20 grün). Ablage brauchte keinen
Neulauf.

**9 · `docs/SUNO-API.md`** — alle 273 Wege der Web-API aus ihrem
Quelltext, geordnet, mit Sicherheitsgrad. **Erst dort nachsehen, dann
raten.**

## Entschieden — nicht wieder anfangen

**Server-Login über `__client`-Cookie: nein.** Der angemeldete Client
sitzt HttpOnly im Tab; jede Login- oder Clerk-Seite legt einen neuen,
leeren an. Drei gültige, leere Cookies kopiert, keines mit Session.
Caspar_D: „ich hab keinen Bock mehr, wir nehmen das Lesezeichen.“
**Am 11.09.2026 gelöscht** — `bin/token.js` und der Server-Weg, der das
Cookie entgegennahm. Die Begründung steht jetzt dort, wo sie hingehört:
`docs/suno/WEGE.md`, Abschnitt „Aufgegeben: Server-Login“.

**Keine Skripte im angemeldeten Suno-Tab ausführen**, um Tokens oder
Cookies zu ziehen. Dabei ist einmal eine URL mit `__clerk_handshake`
ins Werkzeugprotokoll geraten.

**Likes: die Web-API hat keinen Listenweg** — nur die Handlung und die
Summe. Der Benachrichtigungsstrom ist die Liste, vier Wochen zurück.
Wer gespielt hat, gibt es als Personen gar nicht.

## Die Regeln, die diesmal teuer waren

**1 · Ein Tor wählt aus, es hebt nichts an.** Alle Tore der Norm
entfernen Blöcke aus der Statistik; keines hebt sie auf die Schwelle.
Ich hatte einen „Boden" gebaut, der anhebt, und ihn ausgerechnet mit
dem Tor der Norm begründet. Dazu die Verwechslung der beiden Tore:
**−10 LU** gehört zur integrierten Lautheit, **−20 LU** zur
Schwankungsbreite. Einzelheiten in `NORMEN.md`.

**2 · Dezibel darf man nicht stapeln.** Eine Summe von Logarithmen ist
der Logarithmus eines Produkts; Prozentanteile daraus bedeuten nichts.
Was gestapelt wird, wird in **Energie** gerechnet (`10^(LUFS/10)`).
Differenzen dagegen sind in Dezibel richtig — sie sind Verhältnisse.

**3 · Weniger negativ heißt lauter.** −11,8 LUFS ist 2,2 LU **über**
einem Ziel von −14, nicht darunter. Die Luft bis zum Übersteuern ist
eine andere Größe: der True Peak.

**4 · Diagramme auf der Zeitachse:** SVG in `0..SPUR_W`, im
`.section`-Rahmen, mit Spielkopf. Kein HTML mit Prozentwerten — das
kann den `viewBox`-Zoom nicht mitmachen. Und keine Namensspalte, die
verschiebt die Achse gegen alle anderen.

**5 · Geordnete Reihen von Hand ordnen.** Eine automatische
Farbangleichung wirft jede Stufe einzeln auf den nächsten Ton und
zerstört damit jede Rampe.

**6 · Was für alle Zeilen gilt, gehört in den Spaltenkopf.** Und
Tabellen **ab vier Zeilen** zweispaltig, mit fester Zeilenhöhe
(Registerhaltigkeit). Vier, nicht sechs — bei sechs blieb die
Schimmertabelle mit ihren vier Funden einspaltig stehen, und rechts lag
die halbe Breite brach.

**7 · Nicht zeichnen, was niemand sieht.** `offsetParent === null`
genügt als Wache; ohne sie rechnen ausgeblendete Diagramme bei jedem
Zoomschritt mit.

**8 · Es gibt genau EINE Audioquelle.** Der Player der Albumseite.
Alles hängt daran — Karaoke, Visualizer, Analyzer. Pro Audioelement ist
nur ein `createMediaElementSource` erlaubt; wer den Ton braucht,
bekommt `hörer.quelle` gereicht und baut sich nichts eigenes. Der
Analyzer hatte bis zum 19.08.2026 ein zweites `<audio>` als Rückfall;
es ist gestrichen. **Ein Rückfall, der sich selbst eine Tonquelle baut,
ist kein Rückfall, sondern ein zweiter Zustand.**

Dazu die Regeln der Vorsitzung, die weiterhin gelten: Fenstermitte,
Zusammenfassen statt Auswählen, Bevölkerungspyramide, **Formen statt
Eigennamen**, an den Rändern nichts erfinden.

## Zwei Befunde zum Merken

**Der vierte Fund derselben Lücke:** Was der Analyzer vermissen lässt,
ist oft nur im **Suno-Weg** gesetzt. `currentMeta` füllt nur
`analyze()`; auf dem Katalogweg heißt es `_katalogDaten`. Vorher traf
es `songDuration` und `_audioSamples`.

**Sunos Hüllkurve (`welle`) deckt die Katalogdauer ab**, nicht die
analysierte Datei. Über die volle Breite verteilt ist sie gestreckt,
sobald die beiden auseinanderliegen.

**WAV: 403 heißt „gibt es noch nicht", nicht „gesperrt".** Gemessen an
vier fremden Songs: zwei liefern das WAV ohne Anmeldung aus, zwei
nicht. Suno erzeugt sie nicht von selbst, der `convert_wav`-Aufruf
bleibt nötig.

## Was als Nächstes ansteht

Alles vom 19.08. ist gebaut und committed. Offen, nach Ertrag:

**1 · Das Lesezeichen einmal durchlaufen lassen.** Seit dem Einbau des
Benachrichtigungsstroms ist es nicht gelaufen — im Community-Fenster
steht deshalb noch „von wem, wissen wir erst für Likes ab August 2026".
Ein Klick, und die Namen stehen da. Das ist kein Code, nur ein Lauf.

**2 · Community-Fenster: Follower.** Der Strom trägt `follow`-
Ereignisse, der Server sammelt sie (`/api/community` → `follower`),
die Person zeigt „folgt dir seit". ~~Eine Liste *aller* Follower fehlt
noch~~ — **ERLEDIGT** (09.09.2026): das Community-Fenster zeigt die
Beobachter samt „Neu seit dem letzten Lauf" und „Folgen dir nicht zurück".

**3 · Analyzer: Tonart-Karte prüfen.** Der Kern liefert jetzt die
richtige Tonart in beiden Nachrichten. Ob die Karte „Tonart" das
richtige Feld liest und ob der zweite Kandidat („F Dur / C Dur")
sinnvoll angezeigt wird — nachsehen, nicht annehmen.

**4 · Community-Fenster: mehr aus dem Strom.** `comment_like` (wer hat
deinen Kommentar geliked), `hook_like`, `playlist_like` liegen in der
Datei, werden aber nicht gezeigt. Und „Ungelesen" könnte auf der Kachel
selbst stehen — ein Punkt am Zähler, wenn seit dem letzten Öffnen etwas
kam.

**5 · Sortierung: Bewegung.** „Plays der letzten 7 Tage" aus dem
Zählerverlauf — sortiert nach dem, was sich *gerade* bewegt, statt nach
der Summe über sechzehn Monate. Die Daten wachsen täglich; in einer
Woche lohnt es sich.

**6 · Suchfeld: Lyrics.** — **ERLEDIGT**: `/api/lyrics-index` liefert sie,
die Suche liest `lyricsIndex` als Freitext mit.

**7 · Aus dem CB-Vergleich:** BPM-Vertrauen, Balance, EQ-Hinweise.
Sein Code ist GPL — nachbauen, nicht kopieren.

**8 · Aus `SUNO-API.md` lohnt zu prüfen:** `aligned_lyrics/v3` (neuer
als unser v2), `gen/<id>/wav_file/` (sagt es, ob die WAV fertig ist?),
`clips/get_songs_by_ids` (73 Private in einem Aufruf), `download/clip/`
(sauberer Medienweg?).

**Nicht tun:** `notification/v2/read`, `clear-badge`, alles mit `set_`,
`toggle_`, `delete`, `trash`. Das verändert das Konto.

## Der Monatslauf

```bash
node bin/sammeln.js            # Songliste über die API, OHNE Anmeldung
node bin/wiederherstellen.js   # Katalog, Medien, Kacheln, Farben
```

Token brauchen nur noch drei Dinge (jeweils 401 ohne): Wort-Zeitmarken,
Playlists, WAV-Erzeugung. Für neue Songs erst mit einem nackten GET
prüfen, ob das WAV schon existiert.

## Entschieden am 19.08.2026: das Lesezeichen, kein Server-Login

**Der Token bleibt im Browser.** Mehrere Stunden haben wir versucht,
dem Server einen eigenen Zugang zu verschaffen — `bin/token.js` kann
aus einem `__client`-Cookie Tokens holen, wie die Open-Source-Wrapper.
Aber der angemeldete `__client` sitzt HttpOnly im Tab, und jede Login-
oder Clerk-Seite legt stattdessen einen *neuen, leeren* Client an. Drei
gültige, leere Cookies kopiert, keines mit Session. Das ist Clerks
Schutz, und er hält.

**Nicht wieder anfangen.** Caspar_D: „ich hab keinen Bock mehr, wir nehmen
das Lesezeichen." Es läuft, holt alles mit Token, schickt die Ernte in
Paketen, überlebt den Tab — und läßt keinen Kontoschlüssel auf der
Platte.

*Nachtrag 11.09.2026:* Die Dateien sollten „liegen bleiben, falls Clerk
das Cookie eines Tages hergibt“. Das hat sich gerächt — wer den Code
liest statt dieses Dokuments, findet in `bin/token.js` einen Kopf namens
„WIE ES GEHT“ mit Schritt-für-Schritt-Anleitung und hält den Weg für
offen. Jetzt gelöscht; die Begründung steht in `docs/suno/WEGE.md`.

Wer den Token *einmalig* von Hand braucht: Im alten SunoAnalyzer gab es
dafür ein Eingabefeld — der `__session`-JWT aus den Cookies, gültig eine
Stunde. Das geht, ist aber Handarbeit alle sechzig Minuten.

**Nicht mehr tun:** Skripte im angemeldeten Suno-Tab ausführen, um
Tokens oder Cookies herauszuziehen. Dabei ist einmal eine URL mit
`__clerk_handshake` — Session-Tokens kodiert — ins Werkzeugprotokoll
geraten. Das Lesezeichen läuft *im* Tab und braucht das nicht.

## Arbeitsweise

Kleinschrittig, **Plan vor Umsetzung**, Freigabe abwarten. **Vor
Eingriffen in Tonpfad, Player oder Datenfluss ansagen, was angefasst
wird** — nicht erst melden, wenn es steht (Caspar_D, 19.08.2026: „ich
erwarte, dass du Bescheid sagst, wenn du größere Dinge anfassen mußt"). JavaScript
und git bitte erklären. **Übergabedokumente immer sofort
mitaktualisieren.** Nicht an offene Commits erinnern — er entscheidet,
wann gesichert wird.

**Bei jeder Zahl, die nicht paßt, erst aufschlüsseln, dann erklären.**
Am 19.08.2026 lief `vorrechnen.js` mit 166 s je Song, der Browser
schafft dasselbe in 17. Ich habe zwei Stunden lang „PNG ist teuer" und
„Node ist eben langsamer" erzählt. Die Messung dauerte zwanzig
Sekunden und zeigte: Bilder und WebP zusammen unter einer Sekunde, der
Rechenkern 224 s — weil er in `vm.runInContext` lief. Caspar_D: „das ist
schon bitter, sowas macht man doch nicht." Hat recht. Eine plausible
Erklärung ist keine Messung. Dasselbe am selben Tag beim angeblichen
Copyright-Filter und beim Stereo-Spektrogramm.

Bei Zweifeln an einem Ergebnis: **messen, nicht vermuten.** Caspar_Ds
Beobachtungen waren bisher durchweg belastbar; steckte hinter einer
Nachfrage ein Fehler, dann ein echter.

`git gc` nach größeren Commits ist freigegeben (exFAT, 1-MB-Blöcke) —
danach `find .git -name "._*" -type f -delete`.

### Prüfen im Browser: nie am ersten Song

**Caspar_D, 19.08.2026: „Fange bitte für Tests nicht immer mit dem ersten
Lied an, baue einen Zufallsgenerator ein."** Der erste Song der
Albumansicht war über zwei Sitzungen hinweg das einzige Prüfstück —
damit wird jeder Befund an genau einer Kombination aus Länge, Lautheit,
Struktur und Stimmlage gemessen, und alles, was diesem einen Song eigen
ist, bleibt unsichtbar.

Ins Fenster einsetzen, dann `await __zufallsSong()`:

```js
window.__zufallsSong = async function(){
  /* NICHT AUF EINEN ANDEREN SONG UMSCHALTEN.

     Zwei Fehler, beide am selben Abend gemacht:
     - spielenNachId(zufall) startet die Wiedergabe neu. Caspar_D hoert
       dann dreissigmal denselben Song ("es nervt").
     - buehneAuf(zufall) OHNE spielenNachId oeffnet die Buehne fuer
       einen anderen Song als den laufenden. Titel und Artwork gehoeren
       dem einen, der Ton dem anderen ("warum spielt ein falsches Lied,
       das nicht zum Artwork im Analyzer passt").

     Richtig ist: den LAUFENDEN Song nehmen. Er wechselt von selbst oft
     genug, und damit prueft man ueber die Zeit ohnehin viele. */
  const gespielt = (document.querySelector('audio').src
                    .match(/\/media\/([0-9a-f-]+)\//)||[])[1];
  buehneAuf(gespielt);

  /* DAZWISCHENFUNKEN IST ERLAUBT - aber merken und zuruecksetzen.
     Caspar_D, 20.08.2026: "du darfst ruhig dazwischenfunken, merk dir
     nur, wo ich war und setze dort fort." Also: vorher src, currentTime,
     paused und bText merken; pruefen; danach buehneAuf(alteId),
     currentTime zurueck, play() wenn es lief. Er hoert nach der Probe
     weiter, als waere nichts gewesen. */
  await new Promise(r=>setTimeout(r,300));
  textWaehlen('analyzer');
  for (let i=0;i<240;i++){
    if (window._chartData && window._chartData.fft
        && document.getElementById('zoom-slider')) break;
    await new Promise(r=>setTimeout(r,250));
  }
  await new Promise(r=>setTimeout(r,4000));   // FFT-Nachlauf
  return { titel: bSong.titel, id: k.dataset.id, von: alle.length };
};
```

Zwei Fallstricke, beide schon hineingelaufen:

- **`buehneAuf(id)` startet keinen Song.** Es öffnet die Bühne für eine
  ID, die Wiedergabe läuft weiter wie sie lief. Wer nur `buehneAuf()`
  ruft, sieht Titel und Artwork des einen Songs und hört einen anderen —
  Caspar_D hat genau das am 19.08.2026 auf dem Schirm gesehen, während ich
  maß. **Immer erst `spielenNachId(id)`.** Gegenprobe im Test:
  `audio.src` muss dieselbe ID tragen wie `bSong.id`.
- **`bSong` steht erst, wenn die Bühne offen ist.** Ein Klick auf die
  Kachel allein setzt es nicht; `buehneAuf(id)` braucht die ID selbst.
- **Wer misst, wartet.** Solange der Worker rechnet, sind alle Zeiten
  um ein Vielfaches zu hoch — dieselbe Messung ergab 1305 ms während
  der Analyse und 219 ms danach. Der Nachlauf oben ist kein Schmuck.

Und für Vorher/Nachher-Vergleiche **denselben** Song nehmen:
`git stash push web/fremd/analyzer.js`, neu laden, messen, `git stash
pop`. Zwei Zahlen von zwei Songs vergleichen heißt nichts.


## Nachtrag 21.08.2026 (Tag): Klangraum

Lies zuerst docs/KLANGRAUM.md — Datenkette (klang.js → karte.js →
himmel-export.js), Darstellung, Klangreise/Sound-Schiff, offene Ideen.
Register heißen jetzt Werke · Alben · Klangraum. Stand 22.08. früh:
Sternkanäle = Biografie (Plays/Likes/Kommentare/Bewegung/Alter/neu/
Hybrid/Zwillinge/privat), Orbiter mit Kreisbahnen (20 s je Runde),
Probeflug-Schalter, Paket für Tarja (Linux, CUDA) liegt bereit. Der Export
(library/export/sternenhimmel.html) ist die Demo für Tarja: eine Datei,
läuft ohne Server, Ton und Cover von Sunos CDN.

## Stand 22.08.2026 (abends) — Klangraum-Kosmologie

Heute nur Klangraum: Sternkanäle (Größe=Plays, Helligkeit=Likes,
Korona=Kommentare, Kreuz=Bewegung, Farbe=Alter, Flimmern=neu,
Pulsieren=Hybrid, Doppelsystem=Zwillinge, Schatten=privat), rechte
Spalte als drei Laden, Prüfsystem `schiffPruefung()` (Fake-Songs, Raum
vs Bild), Bahnmechanik neu: Bahnebenenwechsel per **Knoten-Impulse**
(≤ 6° je Knotendurchgang, ab halber Runde), äußere Tangente analytisch,
Ankunft direkt auf der Zielschale (kein Fangkreis, keine Spirale),
Transit gerade — mit Caspar_D an der Schautafel `web/bahn3d.html`
abgenommen („erstklassig"). Spur bleibt die ganze Sitzung, nur die
geflogene Bahn (0,25), Schweif Akzent→Weiß, Schiff verschwindet hinter
Sternen (Schicht `karteschiffhinten`, Himmel transparent), Kamera zoomt
nie selbst (Nachführung ab 30 % Abstand), Drehung Smootherstep 3,2 s,
Spotlight-Dimmung raus. Alles in KLANGRAUM.md; Offenes in BACKLOG.md
(„Klangraum — offen nach der Kosmologie"). Paket: `node bin/paket.js`.

## Stand 23.08.2026 (Nacht) — Tonstudio-Session

Review-Runde (31 Ideen, alle am Code geprüft) und Umsetzung: Block A
(A/B-Zustand bleibt, Lampe am EQ-Knopf für Flüchtiges, Preset-Anzeige
aus dem Ist-Zustand, gesperrte Presets mit Begründung, Rechner mit echter
Abtastrate, Solo = Messband/Glocke je Modus), Block B (Worklet ehrlich:
K-Bewertung/LUFS-Achse, Spitzen-Hüllkurve im Limiter-Fall, Lookahead,
Rampe; Spitzenprojektion; CLIP-Lampe + Ausgang Spitze; Deckungs-
Rückmeldung + Stilgruppen-Marke), Kompressor-Lasche mit ZWEI Werkzeugen
(klassisch / Gradationskompressor nach HAECKEL: Leise-/Lautpunkt-
Dreiecke, Form Aus|Gamma|Sigmoidal, Stärke; Charts quadratisch; Ziehen
im Bild, Cursor am Griff), Stufen-Pillen in Kettenreihenfolge, Breite
wahlweise vor dem Kompressor, Ghettoblaster (Hall physikalischer, zwei
Panels, MEGA BASS als Aufsatz, Korrelationswächter), Notweg gegen
Stummschaltung in analyseStarten, Texte nach Tontechniker-Review
(Gammabrücke als Lade). Alles in docs/TONSTUDIO.md. Nächstes Thema:
Störfrequenz-Kerbe (gebaut 23.08., siehe TONSTUDIO.md). Windows-Tester Casto meldet sich selbst, wenn etwas hakt — kein Backlog-Punkt.
Störfrequenzen: Schritt 1 (Detektor) gebaut und committed, Befund in
TONSTUDIO.md; Schritt 2 (Kerbe im Glockenstuhl) in Arbeit.

---

## Stand 24.08.2026 — Stems, Töne, Notenzonen

**ZUERST LESEN: `docs/OFFEN.md`.** Dort steht, was falsch ist und was
entschieden werden muss. Drei Punkte sind nicht bloß offen, sondern
fehlerhaft — die Bandbeschriftung der Fluktuation, der Wortlaut im Titel
der Notenzonen, und die Notenzonen als Einzeldateien auf einem
Dateisystem mit 1-MB-Blöcken.

### Was neu ist

**`bin/stems.js`** trennt jeden Song in sechs Spuren — lokal, ohne
Python. Modell `library/modelle/htdemucs_6s.onnx` (246 MB, MIT). Die
Spektralrechnung steckt im ONNX-Graphen: rohes Audio hinein, rohe Spuren
heraus. Läuft mit demselben `onnxruntime-node` wie der Klangraum. Der
Analyzer konnte das vorher schon, aber nur über einen Python-Server
außerhalb des Projekts, den kein Tester je einrichtet.

Ergebnis: `library/songs/<id>/stems/{drums,bass,other,vocals,guitar,piano}.flac`,
rund 100 MB je Song, gut zweifache Echtzeit.

**`bin/toene.js`** vermisst, was darin steht: sechs Hüllkurven, Tonart,
Stimmlage, Notenzonen. Schreibt `library/toene.json` und
`library/notenzonen/<id>.json`.

### Warum das mehr kann als der alte Analyzer

Drei Dinge greifen ineinander, die einzeln nichts taugen:

- **Die Stems** machen das Signal einstimmig genug. Im Vollmix ist jede
  Tonhöhenmessung ein Ratespiel.
- **Sunos Schläge** sagen, wo eine Note steht. Das Messfenster darf so
  lang werden wie die Note — 400 ms statt 21 ms bedeuten 2,9 Hz statt
  46,9 Hz Auflösung. Gemessen wird *zwischen* den Schlägen; der Anschlag
  ist transient und trägt keine Tonhöhe.
- **YIN und Goertzel im Zeitbereich** kennen kein Bin-Raster.

Die alte Tonhöhe hatte für 321 Songs genau **15 verschiedene f0-Werte**,
weil sie den nackten FFT-Bin nahm. Bei 117 Hz war ein Bin 3,4 Halbtöne
breit.

### Tonart und Stimmlage sind wieder da

Beide Karten waren totgelegt. Sie kommen jetzt aus anderer Quelle:

- **Tonart**: Grundton aus dem **Bass auf Sunos Eins** — er spielt dort
  fast immer den Grundton. Tongeschlecht aus der **gezählten Terz**, nicht
  aus einer Leiterkorrelation. Fehlt die Terz — bei Powerchords die Regel
  —, steht **nur der Grundton** da. Geprüft an zwei Songs mit Angabe im
  Prompt: beide richtig.
- **Stimmlage**: YIN auf dem **vocals-Stem**, unteres Viertel der
  f0-Verteilung (Oktavfehler gehen nach oben). Im Überlappungsbereich von
  Tenor und Alt steht ein **Fragezeichen**. Das alte Verfahren fragte im
  Vollmix „hat dieses Fenster Mitten?" und gab 64 stummen Stücken eine
  Stimmlage.

### Das Chroma misst jetzt bei den Tönen

Das alte legt ein lineares FFT-Raster über die logarithmische Tonleiter
und rundet. Bei `fftSize 1024` deckt **ein Bin im Bass elf Halbtöne** ab.
Caspar_Ds Beobachtung „warum ist das F so überrepräsentiert" war genau das —
nach der Umstellung dominiert es nicht mehr.

Neu: Goertzel bei **jeder Halbtonfrequenz**, Fensterlänge nach konstanter
Güte (C2 über 260 ms, C7 über 8), **beide Kanäle**, und zwar die
**Beträge addiert** — nicht die Signale, sonst löschen sich gegenphasige
Anteile aus.

Das Raster der Zonen kommt aus dem **Bass**: Er trägt den Akkordwechsel,
die Melodie bewegt sich innerhalb des Akkords. Hierarchisch geteilt —
erst die Hälften vergleichen, dann nur bei Bedarf innerhalb der Hälften.

### Fallstricke, die Zeit gekostet haben

- Ein frischer `AudioContext` startet ohne Nutzergeste **suspendiert**,
  und `decodeAudioData` kommt darin nicht zurück. Zum reinen Dekodieren
  einen **`OfflineAudioContext`** nehmen.
- Die **Ablage dekodiert das Audio nicht** (das ist ihr Sinn), deshalb
  fehlen `window._audioSamples`. Sie werden nachgeladen.
- `window.SunoAnalyzer` ist ein **anderes Objekt** als das innere, das
  `song()` und `abgelegt()` trägt. Wer nach außen etwas anbieten will,
  muss in **beide**.
- Ein `<audio>`-Element ohne `MediaElementSource` spielt **direkt über
  die Systemausgabe**, an EQ und Reglern vorbei. Sechs mitlaufende Stems
  ergaben so einen Kammfilter.
- Der Lautstärkeregler setzt `audio.volume` — neue Elemente erfahren
  davon nichts und laufen auf 1,0.
- `intraOpNumThreads` allein drosselt ONNX nicht; **`interOpNumThreads`**
  gehört dazu.
- Hintergrundläufe, an die Sitzung gebunden, werden mit ihr beendet.
  `nohup` + `disown`, dann ist PPID 1.

### Zahlen zum Wiedererkennen

- Analyzer: **8414 → 7068 Zeilen** nach dem Entfernen der abgelösten
  Canvas-Fassungen und toten Spuren.
- Kontraste: **11 von 30** Textvarianten lagen unter 4,5:1, die
  schlechteste bei 1,39. Jetzt eine.
- Zeitspuren: lagen in **drei verschiedenen Rastern**, jetzt alle auf
  links 64 / rechts 1464.
- Okkultation: **1025 Zonen, 570 Taktschläge**, davon 65 % ganze Viertel.

### Läuft gerade

Nachtkette, abgekoppelt (`nohup`, PPID 1), Protokoll
`library/nachtlauf.log`: Stems trennen → `toene.js` über alles →
`library/nachtbericht.txt` mit den Trefferquoten und der Gegenprobe an
den textlosen Stücken.


---

## Nachtrag 24.08.2026 (Nachmittag) — Whisper sichtbar, Bühnentext lesbar

**Transkript und Vergleich.** Die rechte Spalte der Analyse hat drei
Laschen: Lyrics · Transkript · Vergleich. Der gehörte Volltext lag für
256 Songs ungenutzt in `library/whisper.ndjson` — rund 440.000 Zeichen,
die gerechnet und nie gezeigt wurden. Neuer Endpunkt `/api/whisper/<id>`
nach dem Muster der Notenzonen (Sammeldatei, songweise ausgeliefert).
Der Vergleich richtet über die längste gemeinsame Wortfolge aus, nicht
nach Zeilennummer. 29 % der Songs haben im Lyricsfeld einen Vorspann,
den niemand singt; der wird als solcher benannt statt als
"nicht wiedererkannt".

**Der Bühnentext war unlesbar** — 25 von 26 Zeilen unter der Schwelle,
und zwar bei jedem Cover, nicht nur bei hellen. Alles dazu steht jetzt
in HAUSREGELN.md unter "Der Liedtext auf der Bühne". Kurz: der geprüfte
Grund war nie zu sehen (farben.js rechnet gegen einen Grund, den das
Coverbild zudeckt), und zwei Dämpfungen multiplizierten sich.

**Notenzonen sind eine Sammeldatei** (`library/notenzonen.json`), der
Topline-Ansatz steht in den Hausregeln.

**Offen und lohnend:** Sechs der zwanzig farblosen Cover haben in
Wahrheit einen flächigen Farbstich (Urgewalt 96,9 % der Pixel über
C>0,02) und scheitern nur an der festen Gipfelschwelle 0,06 in
farbtoene(). Das zu koppeln würde ihnen eine Farbwelt geben — ändert
aber die Palette aller Songs, deshalb liegt es bei Caspar_D.
Außerdem: `--bgrund` wird gesetzt und nirgends gelesen.


---

## Nachtrag 24.08.2026 (Abend) — altes Tonartverfahren raus, GitHub vorbereitet

### Das alte Tonartverfahren ist gelöscht — Code und Daten

Es gab zwei Tonartverfahren nebeneinander, und das schlechtere lief
weiter. `schaetzeTonart()` im Analyzer-Worker (67 Zeilen samt
Krumhansl-Tabellen) korrelierte das Chroma des **Vollmixes** gegen 24
Leiterprofile. Genau das war am 19.08. als kaputt erkannt und am 24.08.
durch den Weg über Baß und Taktschläge ersetzt worden — nur hat niemand
das alte ausgebaut.

Was daraus folgte, ist der eigentliche Fund: Der **Wächter**, der bei
neuen Suno-Daten alles nachrechnet, lief in der Morgenroutine mit und
schrieb **43 Ablagen** mit den alten, falschen Tonarten zurück. Ein
totes Verfahren ist nicht harmlos, solange etwas es noch aufruft.

Ausgebaut in neun Schritten: Funktion, Tabellen, `key`/`mode` aus beiden
Worker-Nachrichten, Leser im Analyzer, Kartenfeld, Ablageformat,
Wächteraufruf, die 43 falschen Ablagen, der Meßweg-Stempel.

**Zwei Lehren, beide in HAUSREGELN.md:**

- **Wer ersetzt, räumt ab.** Alles, was zur abgelösten Entsprechung
  gehört, fliegt aus Code *und* Daten. Caspar_D: „die Lehre daraus, wenn
  etwas ersetzt wird, immer alles aus dem Code und den Daten werfen, was
  mit der veralteten Entsprechung zu tun hat."
- **Kein Wächter läuft mit, während gebaut wird.** Er hat 43 Ablagen
  umgeschrieben, ohne daß jemand danach gefragt hätte. Steht prominent
  im Backlog.

### Analysen laufen jetzt immer auf WAV

`const datei = bSong.wav ? 'audio.wav' : 'audio.mp3';` — vorher nahm die
Analyse das MP3, obwohl das WAV danebenlag. Caspar_D: „wir wollten alle
analysen auf wav machen."

### Centroid und Rolloff aus beiden Kanälen

Sie liefen auf dem linken Kanal allein. Der Weg dahin ist die Antwort
auf eine Frage, die wiederkommt: *Wie merkt ein fremder Rechner, daß
seine Ablage nach altem Verfahren gerechnet wurde?* Antwort: ein
**Meßweg-Stempel** neben `ABLAGE_STAND`. Der eine sagt, welches
**Format** die Datei hat, der andere, nach welchem **Verfahren** ihr
Inhalt entstand. Formatänderung heißt neu laden, Verfahrensänderung
heißt neu rechnen — Caspar_D: „also eigentlich genau das, was passiert,
wenn neue daten von suno kommen."

### Stemspuren: Farbe und Platz sagen, wie zuverlässig die Spur ist

Es gab **zwei** Farbtabellen für dieselben sechs Spuren (eine im
Abspieler, eine in der Anzeige) und **drei** Reihenfolgen. Jetzt gibt es
`STEM_RANG` in `analyzer.js` als einzige Quelle für Farbe, Name und
Platz.

Die Ordnung folgt der Trenngenauigkeit von htdemucs_6s, die Farben der
Auffälligkeitsrangfolge aus den Untersuchungen zur Farbwirkung
(Caspar_D): warm vor kalt vor unbunt, innerhalb der warmen Rot vor
Orange vor Gelb, innerhalb der kalten Blau vor Grün. Wären mehr als
sechs zu vergeben, kämen zwischen kalt und unbunt Violett und Braun.

| | | | |
|---|---|---|---|
| Schlagzeug | Rot | Gitarre | Blau |
| Baß | Orange | Klavier | Grün |
| Gesang | Gelb | Rest | Grau |

Damit ist am Farbton ablesbar, wie sehr man einer Spur trauen kann.
Nachgemessen im OKLab-Raum: engstes Paar 0,152, über der Schwelle 0,10.
Klavier zu Schlagzeug steht bei 0,417 — mit dem alten Altrosa waren es
**0,089**, also unter der Unterscheidbarkeitsgrenze.

**Zwei Fallstricke dabei:**

- Das **Markup** der Spurrahmen mußte physisch umsortiert werden. Die
  Schleifenreihenfolge allein ändert nichts, das DOM bestimmt die
  Anzeige.
- **`bin/stems.js:86` darf nicht umsortiert werden.** Die Liste dort ist
  die Ausgabereihenfolge des Modells; der Index bindet an den
  Modellausgang. Wer sie umstellt, schreibt das Schlagzeug in
  `vocals.flac`. Steht jetzt als Warnung darüber.

Nebenbei ein zweiter Beleg für den Klavier-Verdacht aus OFFEN.md: Bei
„Kein Shutdown" klingt das Klavier in **99 %** des Stücks, der Rest nur
in 26 %. Die Klavierspur saugt auf, was sonst im Rest landen würde.

### GitHub: vorbereitet, nicht gepusht

Caspar_D: „wenn du damit fertig bist, legen wir ein öffentliches github
an." Zwei Bedingungen, beide eingelöst:

1. **„Version X by Caspar_D" in der Oberfläche.** Endstand nach mehreren
   Runden: In der Kopfzeile steht **nur** `mySuno`, anklickbar; alles
   Weitere öffnet sich als modales Fenster (`#wer`). Caspar_D: „mySuno
   übernimmt sozusagen die Über…-Funktion für die Software, nicht für
   den Inhalt des Archives." Die Version kommt aus `package.json` über
   `/api/index`, sie wird nicht doppelt gepflegt. Mitstreiter stehen im
   Fenster, derzeit Tarja.
2. **Das letzte Wort bleibt bei ihm.** Caspar_D: „Ferner will ich die
   Oberhoheit behalten und selbst bestimmen, was geändert wird und was
   nicht." Steht im README unter „Rechte und Mitarbeit": Quelltext offen
   zum Ansehen, jede Verwendung bedarf der Zustimmung.

**Was am Repo geschah:** Historie bereinigt (3,4 GB → 64 MB), Autorendaten
auf `Caspar_D` umgeschrieben (`git filter-branch --env-filter`),
Klarnamen und Vorname aus README, START-HIER.md, docs/UEBERGABE.md und
`.gitignore` entfernt, Werkstattpfade aus docs/ANALYZER-REVIEW.md,
`*.zip` in die `.gitignore`. Eine Bündelsicherung der alten Historie
liegt außerhalb des Repos unter `SunoArchive-privat/`.

**Offen vor dem Push:** die **LICENSE-Datei**. — **ERLEDIGT**, MIT liegt im
Repo. Sie muß zur Zusage im README passen — „offen zum Ansehen, Verwendung nur mit Zustimmung" ist
*keine* Open-Source-Lizenz. Eine der üblichen (MIT, Apache) würde genau
das Gegenteil zusichern. Das ist eine Entscheidung für Caspar_D, keine
technische Frage.

**Fallstrick beim Gegentest:** Ich habe gegen `HEAD~3` geprüft — das lag
*nach* dem Umbau. Richtig war `0858a79^`. Wer eine Historie umschreibt,
muß den Vergleichspunkt in der *alten* Zählung suchen.

### Zwei Arbeitsregeln aus dem Tag

- **Wer gackert, muß auch das Ei legen.** Ich hatte behauptet, eine
  Farbe sei bei Farbenblindheit problematisch, ohne es gerechnet zu
  haben. Caspar_D: „wer gackert muß aber auch das Ei legen, welche
  farben sind denn unpassend?"
- **Farben zeigen, nicht als Hexzahl nennen.** Caspar_D: „menschen
  können hexadizimalzahlen im Hirn relativ selten eine farbe zuordnen"
  — „zeige sie doch einfach."


---

## Nachtrag 25.08.2026, nachts — der Tag der Veröffentlichung

78 Commits an einem Tag. Was davon bleibt:

### Der Name

**KlangTresor** statt MySuno. Der Grund ist nicht Geschmack: **SUNO ist
seit dem 06.01.2026 eingetragene US-Wortmarke** (Reg. 8096778, Suno
Inc.), Klasse 9 wörtlich für *„downloadable software to enable users to
edit and playback of audio content"* — also für genau diese Art
Programm. Die internationale Registrierung IR 1930809 vom 22.05.2026
benennt Deutschland und die EU. Beides an den Amtsquellen nachgeprüft
(USPTO TSDR, WIPO Madrid Monitor), nicht bloß recherchiert.

Der Präzedenzfall, der am nächsten liegt: Apple gegen Podcast Ready
wegen **„myPodder"** (2006) — kostenlose Medienverwaltungs-Software,
ausdrücklich gegen den *Produktnamen*. Und ein Präfix rettet nicht: Das
EuG hielt 2017 Xiaomis „MI PAD" gegen Apples „IPAD" für verwechselbar.

**Klangtresor war geprüft:** null Markentreffer weltweit (TMview über
alle Ämter, DPMAregister mit Platzhaltern), GitHub und npm frei,
`.org`/`.com`/`.net`/`.app` frei, nur `.de` geparkt. Tresor Berlin
steht nicht im Weg — die Hegemann-Marken decken in Klasse 9 nur
Tonträger und in Klasse 41 Veranstaltungen; eine Anmeldung „TRESOR"
für Software wurde 2010 zurückgenommen.

**Klangraum wäre schlechter gewesen** (auch geprüft): identische
deutsche Wortmarke seit 2000 im Musikbereich, sechs weitere aktive
Kennzeichen, fünf besetzte Domains, 244 Wikipedia-Treffer. Er bleibt,
wo er ist — als Name der Sternenkarte.

**Was NICHT umbenannt wurde und warum:** die 52 localStorage-Schlüssel
`mysuno-*`, die IndexedDB `mysuno-morgens`, die CSS-Klasse
`.sunoanalyzer`, `window.SunoAnalyzer`. Sie umzubenennen hätte bei
jedem Nutzer alle Einstellungen weggeworfen, und nach außen
kennzeichnen sie nichts. Ebenso bleiben Zitate und docs/HISTORY.md.

### Die Lizenz: MIT

Entschieden nach einer Prüfung von zwölf Lizenzen. Der Kern:

**Zwei Bedingungen, nur eine ist eine Lizenzfrage.** „Erwähnung immer"
kann eine Lizenz leisten. „Ich habe das letzte Wort" kann keine — das
folgt daraus, wem das Repositorium gehört, und gilt unter jeder Lizenz.

**Gegen AGPL sprach die Durchsetzbarkeit.** Ihr Abschnitt 7b könnte die
Nennung bis auf den Bildschirm eines Forks tragen — aber jeder Weg
dorthin (Abmahnung wie DMCA-Meldung) verlangt Klarnamen und Anschrift.
Ein Pseudonym hält das nicht aus. Eine Lizenz, die man nie in die Hand
nimmt, ist ein Schwert an der Wand.

**Ein Fund erzwang eine Entscheidung:** `web/fremd/audioMotion-analyzer.js`
stand unter **AGPL-3.0-or-later** und wurde geladen. Beim Push wäre das
Verbreitung gewesen — AGPL §5(c): *„This License gives no permission to
license the work in any other way."* Entweder das ganze Projekt unter
AGPL oder die Datei raus. Caspar_D: *„spektrum visualisierer fliegen
wieder raus."*

**Der GPL-Verdacht beim CB Audio Analyzer ist ausgeräumt** — nachgebaut,
nicht übernommen; CB ist PySide6/numpy, dies ist JavaScript, kein
Python-Rest im Code.

**Die Essentia-Modelle stehen unter CC BY-NC-ND 4.0**, nicht unter MIT
und nicht unter SA. Das war im Repo `suno-analyzer` falsch angegeben.
Sie dürfen gespiegelt werden (unverändert, mit Nennung), aber nicht
kommerziell benutzt.

### Der erste Push

`github.com/CasparDavi/klangtresor`, MIT, fünf Commits.

**Der Login ist `CasparDavi`** — `CasparDavid` ist nur der Anzeigename.
URLs benutzen den Login; `github.com/CasparDavid/…` liefert 404.

**Frisches Repo statt bereinigter Historie.** Grund: 19 Commit-
Betreffzeilen nannten den Vornamen (GitHub zeigt sie in der Liste, ohne
dass jemand einen Commit öffnet), zwei Aufräum-Commits nannten den
vollen Namen im Fließtext, und der Branch `vor-tonart-ausbau` trug ihn
im Dateistand.

**Beim Anlegen fast danebengegangen:** Der erste `git add -A` merkte
**233 Dateien** statt 86 vor — `.git-alt-20260824` ist für git kein
versteckter Ordner. Steht jetzt in der `.gitignore`.

**Und die Lizenz war zuerst „Other".** GitHubs Erkennung vergleicht
LICENSE mit den Standardtexten und gibt auf, sobald etwas danebensteht.
Mein Geltungsbereich-Zusatz musste heraus; er steht jetzt in
`web/fremd/LIZENZEN.md`.

### Was am Programm geschah

- **Stemspuren nach Zuverlässigkeit**: `STEM_RANG` ist die einzige
  Quelle für Farbe, Name und Platz. Reihenfolge nach der
  Trenngenauigkeit von htdemucs_6s, Farben nach der Auffälligkeit
  (warm vor kalt vor unbunt). Das Markup musste **physisch** umgestellt
  werden — die Schleifenreihenfolge ändert nichts, das DOM entscheidet.
- **Der Klangraum filtert mit**: `karteAnflug`. Anfliegbar ist, was im
  Album sichtbar ist; ausgefilterte Sterne verblassen, statt zu
  verschwinden. Der laufende Song bleibt immer in der Liste, sonst löst
  `spielenNachId` alle Filter.
- **`seit:` und `bis:`** als gewöhnliche Suchschlüssel — zusammen
  ergeben sie die Spanne, jede Hälfte ist für sich vollständig.
- **Das Wurmloch** bei rückwärts laufender Zeitspanne, der
  **Borg-Würfel** in Zentralperspektive, die **Supernova** mit
  Refraktionskreuz in Clusterfarbe.

### Drei Lehren, die Zeit gekostet haben

**1 · Wer Zeichenkosten misst, misst die BILDRATE auf der ANGEZEIGTEN
Leinwand.** Der Weichzeichner ließ den Klangraum von 60,7 auf 9 Bilder
je Sekunde einbrechen. Zwei Messungen zeigten nichts: eine losgelöste
Leinwand (die darf der Browser optimieren) und eine Zeitmessung nur des
Zeichnens. Der Einbruch kommt vom **Zusammensetzen** — ein Canvas, auf
dem `g.filter` benutzt wurde, verliert seine GPU-Beschleunigung.
Ersetzt durch übereinandergelegte Züge; kein `g.filter` mehr im
Klangraum.

**2 · Ein halber Ausbau ist schlimmer als keiner.** `new
AudioMotionAnalyzer(...)` war ein blanker Bezeichner ohne
`window.`-Prüfung. Nur die Datei zu löschen hätte einen ReferenceError
geworfen, der aus `darstellungAufbauen()` fliegt — und in
`buehneOeffnen()` steht der Aufruf **vor** `classList.add('auf')`. Die
Bühne hätte sich nicht mehr geöffnet.

**3 · Suchen und Ersetzen ist fallabhängig.** Nach der Umbenennung
stand der Klarname noch dreimal in Großbuchstaben im Code. Gegenprobe
immer mit `git grep -i`.

### Was die Prüfungen gefunden haben

Vier Workflows liefen: Lizenzwahl, Namensfrage, Fremdgut, Update-Wege,
Endabnahme, Funktionstest. Die wichtigsten Funde, die **noch nicht
erledigt** sind, stehen in docs/OFFEN.md. Erledigt und erwähnenswert:

- **Die Sicherungsanweisung war gefährlich falsch.** README und
  START-HIER sagten „Nur `library/roh/` sichern". Der Ordner wird von
  `aufbereiten.js` geleert, sobald der Inhalt im Katalog steht. Wer dem
  folgte, sicherte zwei Dateien und hätte `katalog.json.gz` verloren —
  47 MB mit 257 Lyrics, 291 Zeitmarken, 134 Kommentarsätzen.
- **`wiederherstellen.js` log.** Es sagte „Fertig", während zwei
  Drittel fehlten: WAV (17,9 GB) und Stems (18 GB) holt kein Schritt.
  Jetzt zählt es nach und nennt die Befehle.
- **Die Einrichtungsskripte prüfen jetzt den Ort** — auch die
  Nachbarordner. Wer den ausgepackten Ordner neben sein Archiv legt,
  bekommt den Pfad genannt und einen Abbruch. Durchgespielt mit
  Attrappen für node/npm/ffmpeg, je macOS und Windows (pwsh).
- **`bin/pruefe-skripte.js` nimmt jetzt `.cmd` mit.** Dort gelten
  umgekehrte Regeln: BOM ist schädlich, CRLF Pflicht, ein einzelnes `%`
  frisst cmd.exe.

### Offen — und wer es beantworten muss

**Tarja fragen:** Sie meldete „die VODs werden z.B. nicht geschrieben".
Unklar, was gemeint ist — Video-Artworks (`artwork.mp4`, 83 Stück)?
Ohne ihre Antwort ist die Suche Raten.

**Tarja und Casto fragen:** In `docs/BACKLOG.md` stehen wörtliche
Zitate aus einem privaten Discord-Gespräch mit Tarja, ihre
Rechnerausstattung und dreimal „Tarja musste fragen". Castos
„1000 Fehlermeldungen" stehen mit Datum und Kanal in
`bin/pruefe-skripte.js`. Alles trifft zu, beide stehen als Mitstreiter
im Fenster — aber das eine ist Anerkennung, das andere sind ihre Worte.

**docs/OFFEN.md 2.5** (Piano-Stem) ist entscheidbar, sobald die
Stemkette durch ist: Dann liegen 321 statt vier Songs zum Nachrechnen
bereit. Der Rechenweg steht dort.

**docs/OFFEN.md 2.9**: ~210 Zeilen toter Analyzer-Code. Mit Warnung vor
zwei Fallen.

## Nachtrag 25.08. spät (Commits 6e528e7, e10ecf7, 1036c23)

- Analyzer: die fünf Entscheidungen umgesetzt — Essentia+Demucs ganz
  raus (netzfrei, „v5 · offline"), spurTopline/spurBild echte Nutzer,
  Rückweg weg, Worker-Puffer + rechter Kanal freigegeben. Details in
  ANALYZER-REVIEW.md „Stand der Umsetzung".
- Trennlauf FERTIG: 321 Songs × 6 Stems, Pipe-Fix hat gehalten.
- Rabe: Funken aus dem Flug (Jitter, ein Bahnumfang Lebensdauer),
  Rabenmagie = globales Violett samt Cover-Schleier (uiFaerben-Vorfahrt,
  Klasse .rabenmagie, rabenmagieAnwenden()).
- Offen: Rabenmagie gilt nicht im Sternenhimmel-Export (uiFaerben ist
  Bühnen-Code; Handler dort per typeof abgesichert) — falls gewünscht,
  dort nachziehen. Adversarial-Review der Rabe-Änderungen wurde wegen
  Guthaben-Ende abgebrochen; Browser-Tests waren aber vollständig.


## Nachtrag 25.08. Nacht (Commits b2fb760 … 1aa082c)

- **Tonlauf fertig**: 321/321 mit Hüllkurven, Notenzonen, Tonart,
  Stimmlage. Keine Ausfälle.
- **Hüllkurve** kommt jetzt aus dem eigenen Rechenkern (energy, 20
  Werte/s) statt aus Sunos welle (5/s, fehlte bei 68 Songs) — und als
  Amplitude, nicht als Leistung (Wurzel). Drei Formen zur Wahl:
  x² · x · √x, als mathematische Zeichen an der Kurve.
- **Sunos novelty-sections angezapft**: peak_times als Ticks unter der
  Hüllkurve, für alle 321 Songs. Lag ungenutzt im Katalog.
- **Track-Struktur** erkennt Abschnitte auch ohne eckige Klammern
  („Strophe 1" statt „[Verse 1]").
- **Piano-Verdacht entschieden** (OFFEN.md 2.5): Die Spur mißt kein
  Klavier. Songs mit *no piano* im Prompt haben 99,5 % Median.
- **Offene Arbeitsliste**: OFFEN.md Abschnitt 6 — Hüllkurven-Skalierung
  bei x², grobes Sampling von Crest/Lautheit, v3-Marken bei zwei Songs,
  die Leisten-Punkte.


## Stand 26.08.2026 — Autorenseite, Rechenzeit, Nachbarschaft

Ein langer Tag, 57 Commits. Vier Stränge.

### 1 · Der Analyzer mißt jetzt, was da ist

- **Beide Kanäle statt nur links** — Zeitbereich, Spektrum und Struktur.
  Vorsicht bei `ch`: Die Variable war bisher **immer der linke Kanal**,
  ein arglos eingefügtes `ch = (left+right)/2` hätte vier Stellen still
  verfälscht. Sie paaren `ch` jetzt ausdrücklich mit `right`.
- **Chroma bekommt eine eigene Rechnung.** Der Beleg für das alte
  Verfahren steht in `a111822`: Bei **98 % der Songs** zeigte das alte
  Chroma sein eigenes Raster, nicht die Musik.
- **Kein MP3 mehr in der Analyse**; die Ablage sagt jetzt, woraus sie
  stammt. Und der Browser hielt Analysen **ein Jahr** im Cache fest —
  behoben.
- Prüfton und Chirp laufen jetzt durch **dasselbe `<audio>` wie die
  Musik** — sonst geht AirPlay nicht mit. Ein 20-ms-Stream ist dafür zu
  kurz, es braucht Vorlauf. Die Lautsprecher-Verzögerung wird seither
  **gemessen statt geschätzt**, und der Versatz gilt überall.

### 2 · Rechenzeit, ohne die Lizenz anzufassen

Tarjas Grok-Vorschläge geprüft und drei davon umgesetzt — FFTW
ausgeschlossen (GPL, unvereinbar mit MIT):

| | vorher | nachher |
|---|---|---|
| Gleitender Median im Detektor | 878 ms | **3 ms** (mitgeschobenes 256er-Histogramm) |
| Störfrequenz-Detektor gesamt | | **5,7×** schneller |
| `toene.js` | 118 min | **31 min** |

Die **reelle FFT** (z[n] = x[2n] + i·x[2n+1], halbe Länge, danach
auftrennen) bringt 1,68× im Kern und 1,22× im Nachtlauf. **Die Ablage
ist bitgleich** — 0 von 2.687.660 Bytes verändert. Parallelisiert wird
nach **gemessenen physischen Kernen** (`bin/kerne.js`), nicht nach
`cpus().length`.

`zonenAblegen` schrieb nebenbei **4,7 GB für 14,7 MB Ergebnis** — die
Datei wurde 321 Mal neu geschrieben. Jetzt einmal am Schluß.

> **Falle, die fünf Meßreihen gekostet hat:** `--arbeiter 16` wurde als
> Song-ID gelesen, weil die Argumentprüfung nicht wußte, welche Schalter
> einen Wert tragen. Dafür gibt es jetzt in jedem Skript ein
> `MIT_WERT`-Set. Wer einen Schalter mit Wert ergänzt, trägt ihn dort
> ein.

### 3 · Die Autorenseite

Farbgebung folgt der Musik: geblurrtes Titelbild als Grund, Panels mit
transparentem Schwarz, Diagrammelemente in den Akzenten des laufenden
Titels — bei Stille die von KlangTresor. **Alle** Diagramme der Seite
laufen jetzt über `diaFlaeche()`/`diaTopline()`, also die Hausform:
Fläche auf 0,66 gedämpft, Topline 1 px aufgehellt, **immer oben** —
auch bei liegenden Balken.

Neu: Tonarten als Säulenreihe, Wörter je Stück daneben, drei
Längenhistogramme, die zehn bewegtesten Songs. Log-Odds für die
Tonarten wurden **verworfen**: Die Literatur liefert nur Spitzenwerte,
keine brauchbare Referenzverteilung.

Zwei Fehler, die den Blick kosteten: `.capmarke.leer` erbte
`padding:70px 20px` von der Leermeldung und wurde zum Balken (47×155
statt 19×19) — umbenannt zu `.ohne`. Und der Playknopf ließ sich seinen
Zustand erzählen, statt ihn zu lesen; `spielknoepfeStellen()` fragt
jetzt `audio.paused`.

### 4 · Nachbarschaft — die eigene Zahl bekommt einen Maßstab

Zwei neue Skripte lesen **öffentlich und ohne Anmeldung** die Profile
der Leute, die hier kommentiert, geliked oder gefolgt haben.

- **179 Profile**, **174 Hirschfaktoren**. Median 36 — Caspar_D hat 22,
  das ist **Rang 116 von 174**.
- Der Aufwand skaliert mit **Seiten ≈ h/20 + 1** (genauer: h/18,5 + 1 —
  eine Seite trägt im Median 20 Clips, nicht 22); 632 Seiten für alle.
  Zwei Nachbarn (h = 217 und h = 211) standen dicht an der damaligen
  Grenze von zwölf Seiten; sie liegt jetzt bei **zwanzig** (reicht bis
  h ≈ 350). `mrmeovv` brauchte 12 von 12 Seiten — der Puffer war exakt
  null. Wer sie reißt, bekommt eine Untergrenze — vermerkt als
  `genau: false`. Das trifft derzeit auf **0 von 175** Nachbarn zu.
- Die Falle: Beide `sort_by`-Parameter sind **Pflicht**. Ohne sie kommt
  422 mit einer leeren Hülle, in der jede Zahl `null` ist — das sieht
  aus wie ein stiller Nutzer, nicht wie ein Fehler. Steht jetzt in
  [SUNO-API.md](suno/WEGE.md).
- **Warum steht jeder im unteren Drittel?** Weil eine Community keine
  Zufallsstichprobe ist — Freundschaftsparadoxon. Das erklärt ein
  (i)-Kasten, der die Schiefe **aus den vorliegenden Daten rechnet**
  (Median gegen Mittel, Anteil der obersten 10 %).

Aufgefrischt wird aus dem Panel: „Neue holen" (Sekunden) und „Alles
auffrischen" (~20 min, ~800 Anfragen, mit Rückfrage). Der Lauf läuft
abgekoppelt weiter; der Fortschritt kommt **aus den Dateien**, nicht aus
dem Prozeß.

### Nebenbei

- **Tonstudio** liegt jetzt über allem und bleibt stehen, wenn die
  Bühne zugeht.
- **Hub-Vergleich**: [VERGLEICH-HUB.md](forschung/VERGLEICH-HUB.md), Funktion für
  Funktion mit „haben wir / besser / verworfen". Ergebnis: Tempo und
  Tonart sind dort schwächer als hier, die echte Lücke ist **Harmonie**.
- **61 veraltete Stimmlagen** korrigiert.
- **Zusammenarbeit**: Tarja (`myinqi`) schreibt mit,
  [ZUSAMMENARBEIT.md](haus/ZUSAMMENARBEIT.md) samt `bin/fremdstand.js`.

### 5 · Abends: ein stiller Datenverlust, gefunden beim Aufräumen

Die drei offenen Punkte sind erledigt — beim Nachsehen fiel aber ein
Fehler auf, den niemand gesucht hatte.

**Der Komma-Schlüssel.** `reaktionen.ndjson` hat **zwei Zeilenformen**:
`reaktionen.js` schreibt einen Menschen je Zeile (`von: "dermoth"`,
`name: "…"`), der Benachrichtigungsstrom schreibt Sunos Bündel
(`von: ["deven86","stadtrotfuchs","dermoth"]`, dazu `namen` im Plural —
ein Feld `name` gibt es dort gar nicht). `community-profile.js` behandelte
beide gleich und machte aus dem Bündel per Zeichenkettenwandlung **einen**
Schlüssel `deven86,stadtrotfuchs,dermoth`.

| | |
|---|---|
| Komma-Schlüssel | 37 |
| dadurch nie geholte Nachbarn | **12** |
| vergebliche Anfragen **je Lauf** | 37 sichere 404 |

Von Hand fiel das nie auf. Vor dem Einhängen in eine tägliche Routine
war es aber ein Dauerbruch der Regel „nur einmal holen". Behoben mit
`[].concat(e.von)` und `e.namen || e.name`; die 12 wurden nachgeholt,
**alle existierten**. Bestand jetzt: **192 Profile, 186 Hirschfaktoren**.

Geprüft, ob dieselbe Verwechslung anderswo steckt: `server.js` liest
`e.von` an drei Stellen als Array — dort greift es aber nur bei den
Benachrichtigungsarten, und die sind sauber getrennt (`kommentar` und
`antwort` tragen Strings, alle `*_like`/`follow`/`clip_*` Arrays). **Kein
zweiter Fundort.**

**Morgenroutine.** Zwei Schritte ganz am Ende von `MORGEN_SCHRITTE`,
gemeinsamer Schlüssel `nachbarn`, **ohne `--neu`**. Ans Ende, weil hier
als einzigem Schritt ein fremder Server in der Kette hängt — dort
blockiert ein Netzhänger nichts mehr. Zwei Wächter gegen den
Doppellauf: die Routine überspringt, wenn `global.communityLauf` steht;
`/api/community/start` lehnt ab, solange die Routine ihren
Nachbarschaftsschritt noch vor sich hat.

> **Falle, zweimal dieselbe Liste:** Ein Kreuz in `MORGEN_KREUZE`
> genügt nicht — `morgenStarten()` filtert die Abwahl gegen eine
> **zweite, fest verdrahtete Schlüsselliste**. Wer sie vergißt, baut ein
> Kreuz, das sich anklicken läßt, gemerkt wird und nichts bewirkt.

**Begriffe.** Die Verbform der Achsen ist jetzt durchgezogen: Tooltips
sagen „213 folgen · 154 gefolgt", die Pille heißt **„Folger"** (statt
„Anhänger"), und „Follower" ist aus dem sichtbaren Text verschwunden.
Die Datenfelder `p.follower`/`p.folgt` bleiben unberührt — sie stehen so
in `library/community-profile.json`.

**Untergrenzen sind jetzt sichtbar.** `genau` ging bisher an der ersten
Weiche verloren (`(…|| {}).h`). Der ganze Datensatz wird durchgereicht,
und wo eine Untergrenze steht, steht **≥** — im Punkt-Tooltip, im
Säulen-Tooltip („mindestens — der Lauf endete an der Seitengrenze"), in
der Fußnote und im (i)-Kasten. Der eigene Wert kommt aus dem eigenen
Bestand und ist nie eine Untergrenze.

Geprüft mit **künstlich gesetzten** `genau: false` an den drei Größten
(Echtdaten vorher gesichert, danach zurückgespielt): 3 von 186 Säulen
mit ≥, eigener Punkt ohne. Heute betrifft es **0 von 186** — die
Kennzeichnung ist Vorsorge, keine Anzeige.

### Offen

- Zwölf Befunde in `docs/ANALYZER-REVIEW.md`, Abschnitt 9.
- `schief` wird in beiden Community-Skripten nie zurückgesetzt: Der
  Kommentar sagt „zehn Fehler hintereinander", gemeint sind zehn
  insgesamt.
- Kein `fetch`-Timeout in beiden Skripten — Undici wartet in der Vorgabe
  bis zu fünf Minuten je Anfrage. Am Ende der Schrittliste kostet das
  nichts; weiter vorn eingehängt wäre es ein Blocker.
- Ein Neustart des Servers zerreißt einen laufenden Panel-Lauf:
  `community-profile.js` läuft als Waise weiter, `hirsch` wird nie
  gestartet, und der Stand behauptet „fertig".


## Stand 27.08.2026 — Analyzer, Audiokette, Einmessen

Der Tag hat den Analyzer und den Tonpfad umgebaut. Ein Fund darin war
mehr als eine Anzeigesache.

### Der Klangfehler, der dabei auffiel

Caspar_D fragte, ob leise Töne überhaupt noch im Equalizer ankommen.
Antwort: im Equalizer ja (lineare Filter, Fließkomma), im **Kompressor
nicht** — der arbeitet mit einer absoluten Kennlinie über −60…0 dB. Der
Lautstärkeregler saß am Abspielelement, also davor.

```
vorher:  Element(Lautstärke) → EQ → Kompressor → … → master → Ausgang
nachher: Element → EQ → Kompressor → … → summe → master(Lautstärke) → Ausgang
```

Gemessen an derselben Songstelle, mit Gegenprobe: Die Wegregelung
schwankte zwischen **+2,4 und +6,2 dB**, allein durch den Regler. Nach
dem Umbau steht die Hüllkurve bei −11,2 LUFS und die Regelung schwankt
um 0,13 dB. Details in HAUSREGELN.md.

**Neu im Graphen:** `summe` nimmt auf, was früher direkt in `master`
lief (trockener Weg, Hall, Echo). `master` ist jetzt nur noch die
Abhörlautstärke. Beide stehen im `hörer`-Objekt.

### Das Spektrum zeigt jetzt die Kette

Drei Register über dem Frequenzspektrum:

| | |
|---|---|
| **Signal aus der Sound-Datei** | Abgriff an `quelle`, vor jedem Eingriff |
| **Anpassung im Tonstudio [EQ]** | Abgriff an `summe`, nach allem — aber vor der Lautstärke |
| **Überlagert** | beides übereinander |

Im Overlay ist die **Deckung schwarz**: Es leuchtet nur, wo sich etwas
ändert (gemessen 5,7 % der Fläche). Die **Topline gehört dem Eingang** —
eine feste Bezugslinie in der Hausfarbe des Kanals. Gelb bzw. blaugrün
heißt, das Dateisignal steht höher (Tonstudio nimmt weg), rot bzw. blau,
die Anpassung steht höher (es hebt an).

Die Farben folgen Caspar_Ds Vorgabe: **Absorptionsfarben mit
Helligkeitskompensation**, nicht additiv. Beim rechten Kanal wurde aus
Grün Blaugrün, weil unser Blau im Farbton fast reines Blau ist (256°
gegen 267°) — mit Grün käme die Mischung bei Türkis heraus.

Die **Summendarstellung verschwindet im Overlay**: Sie legt beide Kanäle
zusammen, darin ist kein Platz für zwei Signale übereinander.

### Einmessen am Hörplatz

Neue Lasche im Tonstudio. Drei Signale, nachgemessen über 31
Terzbänder: Sweep −3,20 dB/Oktave, rosa −3,03, weiß −0,04. Der Prüfton
nimmt den Musikweg (WAV über das Abspielelement), sonst käme er nicht
über AirPlay.

**Zwei Durchgänge sind Pflicht.** Eine einzelne Messung ist keine
Eichung — sie zeigt Lautsprecher, Raum und Mikrofon mit. Erst die
Differenz (neutral gegen eingestellt) zeigt das Tonstudio allein.

> **Noch nicht mit dem Mikrofon geprüft.** Im Browserfenster der
> Werkstatt ist es gesperrt; geprüft sind Signalerzeugung,
> Spektrumrechnung und Zeichnung. Der erste echte Lauf steht aus.

### Kleineres

- **Kopiersymbol** in Stil-Prompt und Liedtext, oben rechts im Textfeld,
  ohne Fläche, erscheint beim Überfahren.
- **Hinter dem Tonstudio läßt sich scrollen** — `#studio` spannte die
  volle Breite und fing links und rechts vom Kasten (je 471 px) alles ab.
- **Der Erklärkasten zur Audiokette** ist von zwei Stellen erreichbar:
  (i) im Analyzer und (i) in der Kopfzeile des Tonstudios. Der Text
  liegt in `audioketteErklaeren()` in index.html — eine Quelle, zwei
  Zugänge.
- **Einmess-Panel gestaltet** nach den Hausregeln: Kopfzeile mit Flex
  statt Wortabständen (vorher 3–5 px), gleiche Höhen, Legende statt
  Fließtext, Bedienung und Erklärung zweispaltig 4:6.

### Am selben Abend erledigt

- ~~Das Tonstudio als freies Fenster~~ — **gebaut.** Verschiebbar am
  Titel, Doppelklick stellt zurück, Lage gemerkt. Der eigentliche Ärger
  war ein anderer als gedacht: der Kasten hing an `bottom` und wuchs
  nach oben, also sprang der Oberrand bei jedem Laschenwechsel um bis
  zu 330 Punkte. Jetzt oben verankert, Standardplatz mittig unter der
  Kopfleiste.
- ~~Die Einmessung mit dem Mikrofon prüfen~~ — **durchgeführt**, und
  daraus wurde der ganze Abend. Siehe [EINMESSEN.md](ton/EINMESSEN.md).
- ~~Mehrere Einstellungen durchmessen~~ — **erledigt**, digital wie am
  Hörplatz. Der Equalizer wurde bandweise vermessen (19 Einstellungen),
  und die Lautstärkereihe brachte den Befund des Tages: der HomePod
  regelt ab 50 % den Baß zurück.

### Offen

- Ob das Ausgabe-Signal die Abhörlautstärke enthalten soll (derzeit
  nicht — sonst zeigte der Vergleich den Regler statt der Bearbeitung).
- Ob im Overlay auch die Stereo-Asymmetrie erscheinen soll; dafür war
  „etwas heller als die Farben, aber nicht weiß" vorgesehen.
- **`bin/wav.js` auf Tarjas Weg umstellen** und das Kreuzchen im
  Lesezeichen bauen — siehe [BACKLOG.md](BACKLOG.md) und
  [WAV-PROTOKOLL.md](archiv/WAV-PROTOKOLL.md).
- **Ob die Baßbegrenzung wirklich im Lautsprecher sitzt** und nicht im
  Mikrofon. Klirranteil und Kopfraum werden seit dem 27.08. mitgemessen,
  lagen für die bisherigen Reihen aber noch nicht vor. Eine Wiederholung
  beantwortet es.


---

# 28.08.2026 — Die drei Räume, drei Literaturrecherchen, zwei fremde Rechner

Eine lange Nacht. Vier Stränge, in dieser Reihenfolge entstanden.

## 1 · Fremde Rechner: Fruusch und Tarja

**Dr. Fruusch richtete KlangTresor unter Windows ein** und brachte drei
echte Mängel ans Licht:

- **`bin/modelle-holen.js` hing ohne jedes Anzeichen.** `fetch` stand
  ohne Timeout da; die drei Wiederholversuche darunter liefen nie an,
  weil nie ein Fehler geworfen wurde. Jetzt liest es den Körper
  stückweise — das gibt Fortschrittsanzeige *und* eine Wache, die nach
  45 s ohne ein einziges Byte abbricht. **Dieselbe Zeile stand in
  `bin/laden.js`**, wo es schlimmer gewesen wäre: 89 Songs am Stück.
- **`npm` blockiert seit Version 11 Installationsskripte.** Die Freigabe
  für `onnxruntime-node` steht jetzt in `package.json` (`allowScripts`).
  Ohne sie hätte ab npm 12 jeder Neue ein halb installiertes Paket und
  einen ausgefallenen Klangraum ohne erkennbaren Grund.
- **`KlangTresor-starten.cmd`** ist neu — er hatte das PowerShell-Fenster
  zugemacht, in dem der Server lief. Kein Anfängerfehler: Nichts am
  Fenster verrät, daß dort etwas laufen muß.

**Tarja meldete zwei Fehler in der Oberfläche**, beide behoben: Das
Notizfenster wanderte bei jedem Klick nach oben (es wurde gemessen,
bevor `artZeichnen()` es füllte), und das bewegte Artwork verschluckte
alle Klicks auf die Kachelmarken (`pointer-events` fehlte, und weil das
Video breiter sein darf als die Kachel, traf es sogar die Nachbarn).

## 2 · Drei Recherchen — und was sie an unseren Zahlen berichtigt haben

Erst eine GitHub-Runde (`docs/BACKLOG.md`), dann eine richtige
Literaturrecherche mit Subagenten (`docs/LITERATUR-TIEF.md`, rund 310
Werkzeugaufrufe). Der erste Durchgang steht als `docs/LITERATUR.md` mit
einem Kasten obenauf, der sagt, was ihm fehlt.

**Zwei Fehler in unseren eigenen Dokumenten kamen dabei heraus:**

- **Der Störabstand war vertauscht.** 14,2 dB ist der *breitbandige*
  Wert und im Originaltext ausdrücklich der Fehlalarm; **je Band** waren
  es 39,9 dB, die abgelegte Messung nennt 34,8. Das ist keine
  Kleinigkeit: ISO 3382-1 verlangt für T20 einen Abklingbereich von
  35 dB.
- **Die „menschliche Obergrenze von 90 %"** bei der Struktursegmentierung
  steht im TISMIR-Survey **unbelegt**. Gemessen sind es **F ≈ 0,67–0,68**.

**Der wichtigste inhaltliche Fund**, zweimal unabhängig gefunden: **Das
Tonstudio kann nicht, was wir von ihm wollen.** Für Raummoden ist Q = 1
um Faktor 20–35 zu breit; fürs Gehör fehlt jedes Band oberhalb 2500 Hz,
und genau dort sitzt der altersbedingte Verlust (19 dB bei 3 kHz, 36 dB
bei 8 kHz). Beides führt auf dieselbe Änderung: **Frequenz und Güte der
acht Bänder müßten freie Parameter werden.**

Dazu für die Raumakustik: **Über AirPlay laufen zwei unabhängige Quarze**
(HomePod, USB-Mikrofon). Ohne Taktabgleich wäre eine Impulsantwort im Baß
belastbar und **oberhalb 1 kHz wertlos** — und man sähe es ihr nicht an.

## 3 · Der große Bau: drei Räume

Caspar_D: „wir haben Klang-Raum und Geschichten-Raum und Lied-Raum (das
sind die beiden aneinandergehängten Vektoren), 3 Register."

| Raum | Vektoren | Songs |
|---|---|---|
| **Klang** | Discogs-EffNet, 1280 Dim | 321 |
| **Geschichten** | Liedtexte, 768 Dim | 257 |
| **Lied** | beide, je auf 1/√2 skaliert | 257 |

Neu: `bin/geschichten.js`, `bin/texte-einbetten.js`, `bin/tokenizer.js`
(ein Unigram-Viterbi in hundert Zeilen — Transformers.js wäre eine
zweite ML-Abhängigkeit gewesen). `bin/karte.js` rechnet alle drei über
`--raum`. Server: `/api/karte?raum=…` und `/api/raeume`.

**Keine Übersetzung nötig** — das war der Ausgangspunkt und hat sich
erledigt. Ein mehrsprachiges Modell bildet Deutsch und Englisch in
denselben Raum ab. Gemessen: deutscher Abschiedstext zu englischem
0,913, deutscher Tanztext zu englischem 0,903 — *höher* als deutscher
Abschied gegen deutschen Tanz (0,855). Und eine Übersetzung wäre
schädlich: Reim und Wortspiel überleben sie nicht, das Thema ohnehin.

### Die Lehre der Nacht: Suchmodell ≠ Ähnlichkeitsmodell

Der erste Anlauf lief mit **e5** und lieferte Unsinn — „Autophagie"
(Zellen) landete neben „Der Blogger" (Datencenter), weil beide in
Systemvokabular reden.

**E5, BGE und GTE sind Suchmodelle**, trainiert auf „finde das Dokument
zu dieser Frage". Ungleiche Seiten, daher Präfixe wie `query:`. Dabei
zählt nur die Reihenfolge, nicht der Abstand — und so drängen sich alle
Werte oben zusammen: **0,9232 bis 0,9307 für sämtliche Lieder.** Darin
ist jede Nachbarschaft Zufall.

**Größer half nicht:** e5-base ordnete *schlechter* als e5-small und
fand nicht einmal die eigene zweite Fassung. Auch die unquantisierte
Fassung lag falsch. Es war die Familie, nicht die Größe.

Mit **paraphrase-multilingual-mpnet-base-v2** (Ähnlichkeitsmodell, kein
Präfix): Spreizung von 0,269 auf **0,664**, und „Autophagie v2" findet
„Autophagie".

### Der Textfilter, in drei Schritten scharfgestellt

Alle drei kamen von Caspar_D, alle drei waren nötig:

1. **Regie raus** — 3641 Angaben in 252 von 257 Liedern, überall
   dieselben Wörter. Spanne der Abstände +20 %.
2. **Keine Längengrenze** — „regie steht in suno immer in eckigen
   klammern". Meine 60-Zeichen-Grenze ließ 388 Klammern stehen; eine
   Gruppe hieß daraufhin „Drums · Outro · Slow".
3. **Vorspann raus** — alles vor der ersten Klammer. 76 Lieder, 31k
   Zeichen: Notizen an sich selbst, Ansagen an Suno. Eine Gruppe hieß
   „Playlist". Silhouette 0,084 → 0,101.

### Was am Ende noch auffiel

Die Gruppennamen kamen im Geschichten-Raum weiter aus den Klang-Etiketten
— „Pop · Elektronik" für eine Gruppe, die nach Themen gebildet wurde.
Jetzt kommen sie aus den Texten: Wörter, die *innen häufig und außen
selten* sind, je Lied gezählt statt je Vorkommen.

Und das **Raumschiff rechnete an 26 Stellen mit dem Klang-Raum** — es
wäre im Geschichten-Raum die falsche Bahn geflogen. Alles geht jetzt
über `raumK()`.

## 4 · Was offen ist

- ~~Englische Übersetzungen in deutschen Liedern~~ — **erledigt am
  28.08.** Sichtbar wird das am Sprachverlauf über die Zeilen: `DDDDDEEEEEE`.
  Abgeschnitten wird nur ein *sauberer* Block am Ende — beide Hälften
  müssen für sich einsprachig sein. Ein Lied, das zwischen den Sprachen
  *spielt*, hat kein solches Profil und bleibt ganz. Betroffen: 7 Lieder,
  16k Zeichen; von 8 Liedern mit gemischter Sprache blieb eines
  unangetastet, und das ist echte Zweisprachigkeit. Bei „Sync - Bio
  Anthem" sitzt der Schnitt genau bei der Zeile „SYNC - english lyrics".
  **Die Silhouette hat sich dadurch nicht verbessert** (0,101 → 0,086) —
  der Gewinn liegt in sauberen Texten, nicht in schärferen Gruppen.
- ~~**Die Stoppwortliste** für die Gruppennamen ist zu klein~~ —
  **überholt am 29.08.**: Die Namen kommen jetzt aus den Ortsbegriffen
  (bin/ortsbegriffe.js), die keine Stoppwortliste brauchen; siehe der
  Abschnitt zum 29.08. unten.
- **Das Vollbild** ist gebaut, aber im eingebetteten Browser nicht
  prüfbar („Permissions check failed"). In Chrome sollte es gehen.
- **Übersetzung der Oberfläche**: Plan steht im Backlog. 1.314 Texte,
  57 Normseiten — aber der Aufwand steckt in 110 zusammengesetzten
  Sätzen und 84 Dezimalkomma-Stellen, nicht im Übersetzen.
- **Bewegte Standbilder**: Werkbank in `docs/entwuerfe/bewegtbild/`,
  offen ist die Dosierung bei dunklen Covern.

---

# 29.08.2026 — Eichkasten, Ortsbegriffe, Reaktivierung

Der Tag nach dem Beiseitelegen. Erst wurde **gemessen statt gebaut**:
Caspar_Ds Playlists sind handgepflegte, bekannte Wahrheit — jede ein
Prüfstein. Alle Zahlen in `docs/GESCHICHTEN-RAUM-EICHKASTEN.md`;
Kurzfassung: Kondensate heilen die Sprachen (Japanisch-Paare von Rang
100 auf 1), die zwei Erzählserien sind eine neue mittlere Leitersprosse,
das Vier-Felder-Schema (Stoff- gegen Klang-Kompaktheit je Playlist)
bestätigt die Raumtrennung als Fläche, und der Pronomen-Zähler trennt
erzählend von betrachtend ohne Modell.

Dann der Umbau — **der Geschichten-Raum ist fertig zum Wiederaufmachen**
(`library/entwurf/karte-geschichten.json`, Anleitung in
`library/entwurf/WARUM-HIER.md`):

- **Namen aus Ortsbegriffen** (`bin/ortsbegriffe.js`, neu): das eigene
  Kondensat-Vokabular (1454 Wörter, `library/wortvektoren.json`) am
  Gruppen-Schwerpunkt — Sockel, Belegpflicht, Zufalls-Schwelle.
  „Opfermut · Urgewalt" statt „Gesellschaft — pathetisch"; ohne klaren
  Ort heißt es „(gemischte Gegend)". Generisch: braucht keine
  Playlists, nur Kondensate; ohne die fällt es auf den Wortkontrast
  zurück.
- **`bin/geschichten-namen.js` ist gelöscht**; der Achsenteil lebt als
  `bin/geschichten-achsen.js` (Stoff/Haltung/Ton, Sockel eingefroren).
- **Der Lied-Raum ist gestrichen** (Caspar_D: „den kombinierten Raum
  machen wir nicht wieder auf") — aus `bin/karte.js` und
  `server/server.js` entfernt.
- **Wartungslauf**: vier neue Schritte (Schlüssel `geschichten`), und
  `bin/karte.js` zeichnet den Raum nur, wenn er offen ist — der Lauf
  macht nichts von selbst auf.
- Frontend: Legende sagt im Geschichten-Raum „Themengruppen".

## Der Abend: aufgemacht, als Beta

- **Der Raum ist offen** (`mv` erfolgt, im internen Browser geprüft):
  Raumleiste Klang | „Geschichten (beta)", 3D/NMDS, Legende
  „Themengruppen" mit den Ortsnamen. Das **(beta)** hängt am
  Raumnamen (`RAUM_NAME` in web/index.html) — Caspar_D: „das ist es
  noch nicht so richtig."
- Die **Fußnote** der Karte sagt jetzt raumabhängig die Wahrheit über
  die Namensherkunft (Ortsbegriffe statt „Genres und Stimmungen").
- Ein im Browser **gemerkter Lied-Raum** fällt sauber auf Klang
  zurück.
- **Handlungsbedarf festgehalten** (Backlog: „Kondensate ohne
  Bezahl-Modell — HANDLUNGSBEDARF"): Die gute Ausbaustufe hängt am
  Kondensat-Schritt und damit an einem Bezahl- oder starken lokalen
  Modell. Ohne die Daten stuft alles weich ab (drei Stufen, kein
  Absturz — dort dokumentiert).
- Die **Eichkasten-Messskripte** liegen jetzt versioniert in
  `docs/eichkasten/` (LIESMICH dort), laufen rein lesend und
  reproduzieren die Referenzwerte.
- **Verbindungs-Wächter**: `bin/gesundheit.js` läuft als erster
  Schritt der Morgenroutine — ein GET je Suno-Adresse (Seite,
  Profil-API mit Pflicht-Query, Kommentar-API, Bild-/Video-CDN mit
  Range; HEAD blockt Sunos CDN), Statuscode gemeldet, Änderungen
  gegenüber `library/gesundheit.json` laut. Die Statusnummern stehen
  in normaler Sprache dabei („200 (in Ordnung)", „403 (Zugriff
  verweigert)"). Befund vom 29.08.: alles antwortet; Audio bleibt
  gesperrt (neue Songs tragen „forbidden"-Platzhalter statt Links,
  alte cdn1-Links → 403) — die Beobachtungszeile meldet es, falls
  Suno je wieder aufmacht.
- **Der volle Kreis ist getestet** (29.08., mittags): Lesezeichen in
  Chrome geklickt → zwei Ernte-Pakete angenommen (je 248 Songs samt
  Playlists und Benachrichtigungen) → Morgenroutine mit allen 17
  Schritten (Gesundheit als Schritt 0, die vier Geschichten-Schritte)
  ohne Fehler durch → beide Räume korrekt neu gezeichnet, Ortsnamen
  stabil, Achsen vollständig.

## Zum Fortsetzen (Geschichten-Raum)

Lesereihenfolge für eine frische Sitzung: dieses Kapitel →
`docs/GESCHICHTEN-RAUM-EICHKASTEN.md` (alle Messungen) → Backlog
„Geschichten-Raum: nächste Schritte" (priorisiert) und „Kondensate
ohne Bezahl-Modell" (der wunde Punkt). Zustand prüfen:
`curl localhost:8788/api/raeume` (beide Räume?), `node
docs/eichkasten/messlauf.js` (Referenzwerte im LIESMICH). Die
nächsten Schritte, kurz: Familienfaltung vor der Gruppierung (löst
die 38er-Mischgruppe), Ortsbegriffe beim Zeigen auf die Karte,
Achsen-Anzeige (die gesch-Felder liegen ungenutzt in der Karte),
Playlist-Ebene mit Auto-Erkennung, Ereignishaftigkeits-Zähler,
`bin/eichkasten.js` als Wache im Wartungslauf.

---

## 29.08.2026, spätabends — Das Messdokument steht; danach 10 Tage Pause

**Was heute abend entstand** (Details: EINMESSEN.md „Das Messdokument",
Regeln: HAUSREGELN.md gleichnamiger Abschnitt, Chronik: HISTORY.md):
Der komplette Messgang als EIN Dokument im Einmessen-Register —
Stilletest 12 s superfein · Doppelpiep-Eichung (Latenz-Median + Spanne,
Anhebeschleife bis der Piep 20 dB über der Ruhe liegt, Rauschprobe) ·
10 Läufe (weiß/rosa/blau, Sweep log/linear; −12-dBFS-Energie, Signal-QS,
Exklusiv-Wächter, Live „Ende der Audiokette ↔ Mikrofon" auf einer Uhr;
Sweep-Ankunft aus der Eichlatenz GESETZT) · Kennlinien-Rampen (Start am
Eichpegel, Ende bei bestätigtem Baßabfall) · Zusammenfassung & Steckbrief
mit Handgriffen (EQ übernehmen, Kompressor-Umschalter Kette/Hörbarkeit,
Latenz→Textversatz, Abhörpegel). Über-alles-Test ohne Bestätigungen;
anklickbares Inhaltsverzeichnis; Zwischenspeicher
library/messungen/tontestdurchlaeufe.json (PUT/GET
/api/messungen/durchlauf).

**Erster echter Durchlauf (20:46, AirPlay/HomePods):** Latenz 2084 ms
(Spanne 64) · Kette linear bis 100 % (Fehlbetrag 0,1 dB!) ·
Wiederholstreuung ±0,1–0,8 dB · Störabstände weiß/rosa 35–38 dB
(T20-tauglich nach ISO 3382-1), blau/linear-Sweep bauartbedingt schwach.

**Zum Fortsetzen nach der Pause:**
1. Offener Diskussionspunkt: Das datengetriebene Vergleichsband der
   Zusammenfassung fiel eng aus (57–226 Hz; 60-%-Kriterium) — Alternative
   „mind. 3 Läufe tragen" wäre eine Zeile (dokVergleichsBand).
2. BACKLOG „Anzeigen an den gemessenen Versatz koppeln" (Tabelle) —
   Textversatz-Übernahme existiert, Analyser-Anzeigen bräuchten einen
   Ringpuffer.
3. BACKLOG „Messpegel-Deckel −12 dBFS" („wenn wir immer noch cappen…") —
   abends nicht mehr diskutiert.
4. BACKLOG Entfaltung (Farina): Impulsantwort → Klirr → RT60 → C50/C80.
5. Aufräumen: alter geführter MESS_PLAN/Werkzeugmodus-Teile gegen das
   Dokument abwägen (Hausregel „Wer ersetzt, räumt ab").
6. Wiedereinstieg zum Testen: Seite laden → Tonstudio → Einmessen →
   „Raum vermessen — das Messdokument"; Daten ansehen ohne Ton:
   GET /api/messungen/durchlauf.

Der Verfahrensvergleich als eigener Panel-Plan wurde gelöscht (lebt im
Dokument); die Session davor (vormittags) brachte Geschichten-Raum-
Reaktivierung + gesundheit.js — steht weiter unten bzw. in HISTORY.

---

## 07.09.2026 — Eingang für Unerledigtes

Neu: `docs/eingang/`. Dort liegt Rohmaterial, das ins Repo gehört, aber
noch niemand ausgewertet hat, jede Datei mit Status im Kopf. Erster
Eintrag: die Chatthreads vom 06.09., unterwegs in der App geführt —
~~**der Rohtext fehlt noch**~~ — am 07.09.2026 nachgetragen, er steht
jetzt unter „## Rohtext" in der Datei. (Die Auswertung selbst bleibt offen.)

Wer das hier liest und Zeit hat: `docs/eingang/` durchsehen, verteilen,
Status setzen.

---

# Stand 08.09.2026, spät — Übergabe

Sitzung endete am Limit. Was läuft, was wartet, was entschieden ist.

## Der Albumweg — fertig und eingecheckt (`6055786`, 20:53)

Fünf Gegenleserunden am 08.09., alle im Sandkasten, keine gegen Suno.
Stand: Lesezeichen holt zweistufig mit Token (`/api/playlist/me` +
`/api/playlist/<id>`), Konto-Wächter über `/api/user/me`, Server schreibt
`playlists-<stempel>.json` mit Server-Uhr, `aufbereiten.js` übernimmt
Ergänzungen sofort und Wegnahmen erst nach zwei übereinstimmenden
vollständigen Ernten ≥ 2 h (`katalog.albenKandidaten`). Wegnahme heißt:
alte Id-Menge nicht Teilmenge der neuen — nicht: weniger.

~~**Noch nicht gelaufen.**~~ — gelaufen: am 09.09.2026 wurden Befunde aus
der Gegenlesung des Albumwegs behoben, und weiter unten steht die Korrektur
„Alben auf Suno" statt immer 0.

Randfälle aus der letzten Gegenlesung, nicht gebaut (Backlog):
- Katalog aus `library/backup/` zurückgespielt → alte Kandidaten leben
  wieder auf; eine wahre Ernte dazwischen ist vergessen. Regelfrage.
- `seit` eines Kandidaten von Hand in die Vergangenheit gesetzt → nächste
  gleiche Ernte löscht sofort. Keine Plausibilitätsgrenze. Handeingriff.
- Album, dessen Inhalt dauerhaft nur Hüllen ohne `clip` liefert, wird nach
  2 h geleert — ob das Sunos Wahrheit ist, entscheidet keine Regel.

**Dazu eingecheckt:** Whisper `--alle` als Morgenschritt, `bin/lyrik.js
--tun` als 19. Schritt, API-Probe im Lesezeichen gestrichen.

## ZUERST PRÜFEN — Verlaufsanzeige (Caspar_D, 21:20)

Bei *Glut und Eis* sehe die Abruf-Historie gekappt aus, die Herzen
stimmten nicht. Die DATEN sind vollständig: zaehlerVerlauf hat drei
Stände (06., 07., 08.09.), Abrufe 23 → 29, Herzen 11 konstant, geprüft
gegen die Sicherung von 16:24. Also die ANZEIGE prüfen: (a) Seite neu
geladen? (b) die Umbenennung Likes → Herzen (Commit 1a5a713) — hat sie
eine Stelle getroffen, die als Schlüssel diente (Verlaufskurve,
web/index.html um 15642, Kennzahlen 13673 ff.)? Der Gegenleser hatte
alle Schlüssel geprüft, aber genau dort ansetzen. (c) Ein Titel, der
drei Tage alt ist, hat drei Punkte — vielleicht ist das die Kappung.

## ZUERST PRÜFEN — Bereinigte Lyrik (Caspar_D, 21:25)

Nach dem ersten Lauf mit Whisper --alle und lyrik.js als Morgenschritt:
lyrik.json hat 240 Titel (vorher 239). *Glut und Eis* fehlt — lyrik.js
--unsicher sagt: nur 48 % gedeckt, zurückgestellt (Sperre < 60 %). Whisper
hatte 531 Wörter gehört, 480 abgeglichen. Warum dann 48 %? Vermutlich
zweite Textfassung oder Zitat im Lyrics-Feld (Braut von Corinth). Prüfen:
node bin/lyrik.js <id> ausführlich. Und: *Kartoffeln mit Dip* hat keinen
Whisper-Lauf trotz --alle — Whisper meldete nur 2 Titel. Instrumental-
Filter, OHNE_PLAYLISTS, oder Titelmuster I–IV? Nachsehen in whisper.js
Zeile 302 ff.

## ZUERST PRÜFEN — Whisper hing bei Kartoffeln mit Dip (gelöst, 21:30)

Nicht heute, sondern am 25.08. im Handlauf: whisper.ndjson trägt für
d1f21beb (Kartoffeln mit Dip, 268 s Musik) einen Eintrag mit 0 Wörtern,
kein Fehler, nicht instrumental, 4707 s gerechnet — das 17-fache der
Echtzeit statt 1,4. Whisper large-v3 ist in eine Schleife geraten und
hat nach 78 Minuten leer abgelegt. Seither gilt der Titel als fertig
(whisper.js Zeile 297 ff., fertig.has), --alle überspringt ihn, lyrik.js
sagt „kein Whisper-Lauf". FIX: Einträge mit 0 Wörtern und ohne
instrumental/fehler sind kein Ergebnis — aus fertig ausschließen, neu
rechnen; das Feld schleife ansehen. WAV gegen MP3 ist keine Frage:
whisper.js nimmt immer audio.mp3 und resampelt per ffmpeg auf 16 kHz
mono (Zeile 198–201); die audio.wav wird nie benutzt.

## Herzen im Buendel - was die Web-API hergibt (22:45, gemessen)

Rohbestand vom 08.09. 20:59 (Mitschnitt): 192 Benachrichtigungen, 127 vom
Typ Herz. Felder: id, updated_at, notification_type, user_profiles,
total_users, content_id, content_title. **Suno liefert je Buendel hoechstens
DREI user_profiles**, bei total_users bis 14 - ueber alle 127, ohne
Ausnahme. server.js:665 nimmt alles, was kommt; das Haus kuerzt nicht.
Die Web-App fragt notification/v2 nur mit before_datetime_utc (Blaettern);
in den 370 Wegen aus elf Seiten gibt es KEINEN, der die Herzen eines Titels
als Personen listet (update_reaction_type setzt nur, share/sharers sind
Teilende). Caspar_D: die Handy-App zeigt alle Einzelnamen. Dann hat sie
einen eigenen Weg, der nicht in den Web-Skripten steckt - zu finden nur
mit einem Mitschnitt vom Handy (Proxy im Heimnetz, mitmproxy, oder die
Fritzbox-Paketmitschnitt-Funktion), mit Caspar_Ds Mitwirkung. Buendel
entstehen, wenn viele zugleich reagieren (Streams). Bis dahin gilt Fix (a)
aus dem Pruefpunkt darueber: die Buendelgroesse zeigen und den falschen
Satz „aelter als Sunos Benachrichtigungen reichen" streichen.

## Entschieden, noch zu bauen (Reihenfolge)

1. Erster echter Albumlauf (oben), dann Ergebnis in DATENEXTRAKTION.md.
2. **Vierte Quelle** — GEBAUT `0d14b1b` (spät am 08.09.): `ausAlben` in
   `aufbereiten.js` vor dem Titelbau, nur ergänzend. Prüfstein: der private
   Titel *Bei mir klingelt keiner* (My Industrial Songs) muss nach dem
   nächsten Klick als Titel im Katalog stehen. BESTANDEN 21:33: zweiter
   Lesezeichen-Klick, Katalogbau, 324 Titel / 74 privat, der Titel drin mit
   Lyrics und Album. Whisper: 283 Woerter, 281 s fuer 314 s Musik (0,9-fach,
   keine Schleife), lyrik.js hat ihn bereinigt (241 Titel). Noch ohne Ton: der CDN-Weg ist tot, audio.mp3 kommt
   erst über Unlock und Download bei Suno plus bin/uebernehmen.js. Die 19
   Beschreibungen (MORGENSCHRITTE.json) sind NOCH NICHT im Morgenfenster -
   Bau 4. -- ERLEDIGT: der Server laedt sie, das Morgenfenster zeigt je
   Schritt Name, Beschreibung und Zustand.
3. **Nachtschritt Stems** (`bin/stems.js`, 4 min/250 MB je Titel),
   **Morgenschritt Tonart** (`bin/toene.js` vor `analyse-index.js`),
   Haken 14–16 aus HANDARBEIT-PRUEFUNG.md.
4. **Morgenfenster** neu: je Schritt Abschnitt mit Status ✓/✗/▸/·,
   Beschreibung aus `docs/handbuch/MORGENSCHRITTE.json`, Kurzergebnis,
   Einzelheiten aufklappbar; alle 19 sichtbar, scrollt; pflicht-Schritte
   brechen ab, andere werden rot und der Lauf geht weiter; Lernkurve
   nach `schluessel` statt Name; Ernte-Zähler „N Datensätze" statt
   Dateien. Mockup war abgenommen. Dazu ein Knopf *In den Hintergrund*
   (Caspar_D, spät am 08.09.: dann weiß man, dass man die Übersicht parallel
   benutzen kann — heute deutet nichts darauf hin).
   **Neue Titel zuerst und prominent** (Caspar_D, 21:40): das Fenster zeigt
   Cover für Titel mit geänderten Herzen/Abrufen, aber ganz neue Titel
   nicht — inkonsequent; ein neuer Titel ist Herzblut und muss als Erstes
   sichtbar sein, mit Titelbild, größer als die Geänderten. Befund: in
   bin/sammeln.js Zeile 312 ist `neu` nur eine Zahl (neuIds.length), keine
   Liste — die Anzeige hat nichts zu zeigen; und ein privater Neuer aus der
   vierten Quelle (Albumeinträge) kommt in sammeln.js nie als neu vor, weil
   der nur das öffentliche Profil vergleicht. Beides gehört in Bau 4:
   `neu: [{id, titel}]` aus dem Katalogbau (aufbereiten.js weiß, was neu
   ist), nicht aus sammeln.js. Danach die Schlusszeilen der 17
   Skripte (Vorschläge im Workflow-Ergebnis `morgenschritte-beschreiben`,
   `docs/handbuch/MORGENSCHRITTE.json`, Feld `kurzergebnis_muster`).
   **Zwei Phasen** (Caspar_D, spät am 08.09.: schnelles Zeug zuerst, solange
   keine Abhängigkeiten verletzt werden, dann das Langsame im Hintergrund):
   Phase 1 in Minuten — gesundheit, katalog, kommentare, medien übernehmen,
   analyse-index, eq-profil, geschichten (4), nachbarn (2), klangraum mit
   dem alten Musikstil-Stand. Danach sagt das Fenster: Bestand aktuell,
   im Hintergrund rechnen noch … Phase 2 in Stunden — medien laden,
   klanganalyse, störfrequenzen, musikstil, whisper, lyrik; und danach
   die billigen Abhängigen ein zweites Mal: analyse-index (braucht
   klanganalyse), klangraum (braucht musikstil), lyrik (braucht whisper).
   Abhängigkeiten, die nicht verletzt werden dürfen: katalog vor allem;
   lyrik nach whisper; klangraum nach musikstil; geschichten-zeichnen nach
   geschichten-vektoren; nachbarn nach katalog. Der Hintergrund-Knopf
   zeigt Phase 2 an.

5. **Tragende Endpunkt-Doku**: Rohdaten liegen in `library/suno-wege/`
   (elf Dateien, je Seite eine: Profil, Song, Playlist, me, create,
   discover, explore, hooks, labs, studio, notifications — 370 Pfade aus
   75 Skripten mit ±200 Zeichen Umfeld, gelesen über Caspar_Ds Browser aus
   dem Cache). Versioniert: `docs/suno-api-wege-2026-09-08.txt` (Pfad +
   Seiten) und `docs/suno-seiten-2026-09-08.txt` (87 Linkmuster).
   **Caspar_Ds Regel:** beim Abgrasen die Linkmuster merken und neue
   Muster besuchen — noch nicht betreten: `/style/{name}`, `/voice/{uuid}`,
   `/explore/feed/{for_you|following|because_you_like|editorial…}`,
   `/hook/{uuid}`, `/hooks/create`. Das JS für Lesen+Download steht im
   Sitzungsprotokoll; es gehört in `bin/suno-wege.js`. Plan:
   `bin/suno-wege.js` als Werkzeug (holt über Browser-Download,
   diff zum Vortag), dann acht Domänen-Agenten → `SUNO-API.md` neu, mit
   Abschnitt Abrechnung. Host-Wechsel: `studio-api.prod` (Punkt) ist
   Altbestand, Web-App nutzt `studio-api-prod` (Bindestrich) — in 7
   Skripten + Docs nachziehen. Die zehn Prüfklicks für Caspar_D stehen
   in `docs/SUNO-ENDPUNKTE-ABGLEICH.md` unten.
6. **KlangTresor-eigene Listen** neben Suno-Alben (`herkunft:
   'klangtresor'`), Zeichen: oranger runder Drops mit S / weißer Drops
   mit schlankem Tresorrad.
7. ~~Zwei Alt-Wege löschen: `bin/token.js` und den Server-Weg fürs
   Cookie~~ — **erledigt 11.09.2026**, samt Docker und
   Einrichtung. Begründung in `docs/suno/WEGE.md`.
8. **Handbuch.** Musterkapitel `docs/handbuch/12-klangraum.html` von
   Caspar_D am 08.09. um 22 Uhr abgenommen, mit elf Änderungen (alle
   umgesetzt): Geschichten-Raum „ordnet inhaltlich", Negationssatz raus,
   Sterneigenschaften ohne Relativsätze im Muster „Größer bei vielen
   Abrufen", Korona mit K, Raumschiff „im Orbit", Fäden „erscheinen", „was
   klingt ähnlich", Einstellungs-Absatz in seinen Worten, Geschichten-Raum
   aus dem Gruppen-Absatz gestrichen. Grundsätzlich: *„du formulierst
   grundsätzlich zu englisch"* — deutsche Wortstellung, jetzt Regel in
   `WOERTER.md`, Abschnitt „Anrede und Ton". Für die zwölf weiteren
   Kapitel schlug Caspar_D einen Gegenleser vor: *„vielleicht sollten wir
   Mistral zu Rate ziehen und die Texte dort gegenlesen lassen, oder du
   nutzt einen Prompt, der auf deutsche Wortstellung trimmt."* Option:
   lokales Mistral (Ollama, CPU) nur beim Schreiben. (Die dort zitierte Hausregel „keine
   KI außer Whisper" ist am 13.09.2026 gefallen — siehe BACKLOG, Abschnitt
   Kondensate. Ein Gegenleser beim Schreiben war ohnehin nie Betrieb.) Vor dem Einsatz Caspar_Ds Wort dazu einholen. Zweiter
   Durchgang am selben Abend (Gegenlesen auf Wortstellung): neun weitere
   Stellen umgestellt, darunter „Klicke auf einen Stern" (vorher ohne
   Verb), die Korona-Zeile im Tabellenmuster („Leuchtet bei Kommentaren
   …"), der Nachsatz zu Caspar_Ds Korona-Satz gestrichen, „Registerlasche"
   nach Wortliste. Für die Korona-Zeile und die Registerlasche wäre sein
   Blick beim nächsten Mal gut.

## Vertagt (Backlog)

Kondensate — lokales Modell planen. Bereinigte Lyrik als Bühnen-Vorgabe —
nach Analyse. SSD auf exFAT/32 kB neu formatieren — nach dem Backup.

## Backup

`~/Skripte/backup-ssd.sh ~/Skripte/backup-ssd.log` — inkrementell auf
`/Volumes/Daten/Extreme_SSD-Backup` (MyCloudPR4100). Beim Sitzungsende
lief `oakvar_modules` (letzter Ordner). Kleinteile als Archive unter
`_archive-kleinteile/`. NAS: SMB 2 in `~/Library/Preferences/nsmb.conf`
gesetzt (59–70 MB/s statt 28), Signing verlangt das NAS selbst; NFS wäre
der nächste Hebel (sudo, `resvport`).

## Regeln von heute (im Memory)

Nichts am KlangTresor vorbei · Credits nur von Hand · Nomenklatur-
Präzision (Kerbe→Kerbfilter) · Ernte→Datentransfer · Agenten beenden
Sandkasten-Server nur über eigene PID, nie `pkill -f`.

## ZUERST PRÜFEN — Herzen ohne Zeit (Caspar_D, 22:30)

Befund: *Glut und Eis* (erstellt 06.09., 12 Herzen) zeigt im
Reaktionsfenster drei Herzen mit Zeit und darunter „9 weitere — älter
als Sunos Benachrichtigungen reichen“. Bei einem zwei Tage alten Titel
kann das nicht stimmen. Dasselbe bei *Still you laugh* (1 Zeile, „4
weitere“). Diagnose vom 08.09., spätabends:

**Belegt.** Suno fasst mehrere Herzen auf denselben Titel zu EINER
Benachrichtigung zusammen — mit höchstens drei Namen, einer Gesamtzahl
und einer einzigen Zeit. In `library/reaktionen.ndjson` steht das so:
die Zeile `75eef79b…` für *Glut und Eis* hat `von` = 3 Namen, `anzahl`
= 8, `am` = 07.09. 19:22. Im ganzen Bestand: 142 Herz-Zeilen, 10 davon
gebündelt, 51 Personen ohne Namen und ohne eigene Zeit. Keine einzige
Zeile hat ein leeres `am` — die Zeit FEHLT also nirgends, sie steht nur
einmal für ein ganzes Bündel. Der Server übernimmt das Bündel eins zu
eins (`server/server.js:662` `am: n.updated_at`, `:665-667`
`von`/`namen` aus Sunos gekürzter Liste, `anzahl` aus `total_users`).
Die Oberfläche zeichnet je Bündel EINE Zeile mit dem ersten Namen und
der Bündelzeit (`web/index.html:15724-15726`) und erklärt die Differenz
zur Gesamtzahl aus dem Katalog (`bin/aufbereiten.js`, `upvote_count`,
liest reaktionen.ndjson gar nicht) mit dem Satz „älter als Sunos
Benachrichtigungen reichen“ (`web/index.html:15730`). Genau dieser Satz
ist bei frischen Titeln falsch: die 9 Herzen sind nicht zu alt, sie
stecken in Bündeln.

**Vermutet.** (1) Wächst ein Bündel weiter (das 12. Herz kam am 08.09.),
schickt Suno dieselbe Benachrichtigungs-ID mit neuer Zeit und neuer
Gesamtzahl. `server/server.js:655` überspringt bekannte IDs — das
Wachstum kommt nie in die Datei. Passt zum Bestand: Katalog 11 → 12
Herzen, im Datentransfer von 19:32 heute 186 Benachrichtigungen, aber
keine neue Herz-Zeile für *Glut und Eis*. Beweis fehlt, weil die
Rohdatei nach dem Einweben gelöscht wird. (2) *Bei mir klingelt
keiner* (1 Herz, keine Zeile): entweder eigenes Herz (Suno meldet das
nicht) oder nach 19:32 gekommen. (3) Ob die drei Namen die JÜNGSTEN
oder die ERSTEN des Bündels sind, sagt die API nicht.

**Fix, in Reihenfolge.** (a) Oberfläche, `web/index.html:15720-15731`:
je Bündel „Black Frequency und 5 weitere · vor 3 h“, und den Satz
„älter als …“ nur noch für den Rest, der auch nach Abzug aller
Bündelgrößen fehlt; die Bündel-Herzen als „ohne eigene Zeit, zwischen
Erscheinen und HH:MM“ beschriften. Eine Stunde. (b) Server,
`server/server.js:655`: bekannte ID nicht überspringen, wenn `updated_at`
oder `total_users` gewachsen sind — neue Zeile anhängen, in
`/api/kommentare/:id` (`:1296-1299`) je `sunoId` die jüngste gewinnen
lassen, wie bei Kommentaren. Halber Tag mit Probe an einer Kopie der
ndjson, nie am Bestand. (c) Nicht heilbar: die Einzelzeiten der
gebündelten Herzen liefert Suno nicht. Je öfter das Lesezeichen läuft,
desto kleiner die Bündel — das ist der einzige Hebel.

## Herzen im Bündel — gebaut (08.09.2026, spät)

- **Gebaut, Commit fc63ac2:** `server.js` `reaktionenLesen()` (Stromzeilen je
  Suno-ID im jüngsten Stand) und `reaktionenAnhaengen()` trägt gewachsene
  Bündel nach (`nachtrag: true`, `vorher: alte Zahl`); beide Leser
  (`/api/kommentare/:id`, Leute) gehen über `reaktionenLesen()`.
  Probe an einer Kopie: 8→12 wird eine Zeile, zweiter Lauf schreibt nichts.
  Oberfläche: je Bündel alle drei Namen anklickbar + „und N weitere";
  Restsatz „ohne Benachrichtigung — das eigene Herz meldet Suno nicht".
  Der falsche Satz „älter als Sunos Benachrichtigungen reichen" ist weg.
- **Wirkung erst beim nächsten Lesezeichenlauf** — dann muss das Bündel
  75eef79b für *Glut und Eis* von 8 auf 12 wachsen (Morgenzeile
  „N Bündel gewachsen").
- **Offen: der Weg der Handy-App zu allen Likern.** Netzrecherche
  (Wrapper, GitHub, APK-Anleitungen, ~12 Suchen) ergebnislos; alle Wrapper
  spiegeln die Web-App. Nächster Schritt, mit Caspar_D abgestimmt: die
  Android-APK auseinandernehmen (unzip + strings; bei nativem Code jadx).
  Die APK holt Caspar_D selbst (Regel: keine Downloads aus Drittquellen
  durch Claude), Ablage `/Volumes/Extreme_SSD/Entwicklung/apk/`.
- **Kachel-Klick als Toggle**, Commit ffd1103: laufender Titel hält an
  und läuft weiter; andere Kachel = anderer Titel.
- Tarja fragte nach dem Like-Weg: `GET /api/notification/v2`, Bearer-Token,
  Blättern mit `before_datetime_utc`.

## Suno-App auseinandergenommen (08.09.2026, nachts)

- **Werkzeug `bin/suno-app-wege.js`** liest Retrofit-Wege und Schema-Felder
  aus den dex-Dateien der Android-App (1.88.0, von Caspar_D geladen, liegt
  in `/Volumes/Extreme_SSD/Entwicklung/apk/`). Verb-Zuordnung aus Retrofits
  eigenem Parser (R8 hatte die Annotationen umbenannt). 48 Dienste, 246 Wege,
  96 Pfade nur in der App. Doku: `docs/SUNO-APP-WEGE.md`, Liste
  `docs/suno-app-wege-1.88.0.txt`, JSON `library/suno-wege/app-1.88.0.json`.
- **Herzen:** keinen Weg „alle Liker eines Titels" — auch nicht in der App.
  Stärkster Kandidat `GET notification/v3` (SDUI: avatars[], text[] mit
  Profil-Aktionen). Prüfung = eine GET-Anfrage mit Clerk-Token, **nur nach
  Freigabe** (App-Weg). Danach entscheiden: Lesezeichen von v2 auf v3?
- Zweiter Herz-Weg der App: `POST gen/{gen_id}/like/` mit `LikeSpec {like}`.

## notification/v3 geprüft (08.09.2026, 23:26, eine GET-Anfrage mit Freigabe)

- **v3 nennt alle Liker**: je Person eine Zeile mit eigener Zeit; Bündel
  tragen alle Avatare und Textaktionen. Handle in `action.url`
  (`suno://suno.com/@handle`), Titel-ID in `suno://suno.com/song/<id>`.
  Belegt in `docs/SUNO-APP-WEGE.md`, Zeile in `docs/SUNO-API.md`.
- **Plan (noch nicht freigegeben):** Lesezeichen liest v3 statt v2, Server
  legt je Zeile `von[]`/`namen[]` aus den Aktionen ab, `quelle: 'v3'`;
  Leser lassen v2-Herzzeilen weg, deren Zeit im Bereich der v3-Zeilen
  liegt (v3 reicht wie v2 vier Wochen zurück). Erst Ansage, dann Bau —
  Eingriff in den Datenfluss.

## Gegenleser eingearbeitet (08.09.2026, 23:50)

- `bin/suno-app-wege.js` umgebaut: alle Klassen (27 Wege mehr: cms/*,
  Clerk, Lokalise), Zuordnung aller 17 Retrofit-Annotationen aus der
  Quellreihenfolge in RequestFactory.Builder, Elemente als
  Widerspruchsprobe, HEAD, MUTF-8, Vorzeichen, Antworttypen mit Generika.
  273 Wege (246 com.suno), 228 Suno-Pfade, 95 nur App. Doku
  `docs/SUNO-APP-WEGE.md` Zeile für Zeile berichtigt (search/users und
  unified/feed sind Web; profiles/followers, recent_clips,
  clip_listen_history antworten in der App mit Unit).
- Gesundheit: die Zeile „Audio-Adresse gesperrt" ist weg (bekannt);
  gemeldet wird nur noch, wenn sie wieder antwortet.
- Backlog: Morgenfenster-Abschnitte nach und nach zeigen.
- **Offen:** Caspar_Ds Lesezeichenlauf 23:34:30 lief noch mit dem alten
  Skript (v2, 10 s nach dem Umbau) — keine v3-Zeilen; erneuter Lauf
  erbeten. „Rote Albumeinträge" (Caspar_D): Ursache unklar, nachfragen,
  welches Fenster und welcher Text — Kandidaten: Lesezeichen-Albumzeile
  (morgens.js:860, pink/orange), Kandidatenmeldungen aus aufbereiten.js.

## v3, Seite 2 (09.09.2026, 00:05, zweite Anfrage mit Freigabe)

- **v3 kürzt große Bündel wie v2**: 8er-Bündel von *Glut und Eis* = drei
  Avatare + „Black Frequency + 7 andere". Bis drei Personen nennt v3 alle.
  v2/v3 = dieselben Benachrichtigungen (gleiche IDs). Server zählt jetzt
  „+ N andere" mit (Regex, alle Segmente).
- **Kein Weg in der Android-App 1.88.0** zur Liker-Liste eines Titels —
  weder Schnittstelle noch Schema noch Feed-Kennung. Frage an Caspar_D:
  welches Handy / welche App-Version zeigt „Gefällt mir (12)"? Danach:
  iOS → Mitschnitt (mitmproxy) am Handy; neuere Android-Fassung → APK
  erneut durch `bin/suno-app-wege.js`.
- Lesezeichen 23:50 lief mit v3: 1 neue Zeile (VocalKidFolk314), Rest
  bekannt. Rohform künftiger Läufe: `library/suno-wege/benachrichtigungen-letzter-lauf.json`.

## Mitschnitt iPhone (09.09.2026, 00:34–00:50) — der Liker-Weg ist gefunden

- **`GET /api/gen/{clip_id}/likers/?cursor=`** (nur iOS): alle Liker eines
  Titels, 20 je Seite, `num_total_likes`, Cursor = base64 `{updated_at}`
  (Herz-Zeit des letzten der Seite), neueste zuerst, eigenes Herz dabei,
  keine Zeit je Person. Doku `docs/SUNO-APP-WEGE.md` (iOS-Abschnitt),
  `docs/SUNO-API.md`; Proben `library/suno-wege/likers-probe-*.json`.
- Gebaut: `kommentarId` in der Reaktionszeile (v2 `content_ancillary_id`,
  v3 `?comment_id=`), `/api/kommentare` ordnet Kommentar-Herzen darüber
  zu (Textanfang nur noch als Rückfall). Wirkt ab dem nächsten Lauf.
- Weitere Wege belegt: `unified/feed` mit `generic_playlist:<id>`,
  `user_songs`, `user_playlists` …; `profiles/v2/{handle}` (alles in einem
  Stück); `notification/v2?after_datetime_utc=`; iOS liest v2, nicht v3.
- **Entscheidung offen (Caspar_D):** likers/ aus dem Lesezeichen holen?
  Vorschlag: nur Titel mit geänderter Herzzahl, einmal voller Durchlauf;
  Ablage je Titel (Stand + Änderungsliste mit Laufzeit als Zeitfenster);
  Reaktionsfenster zeigt dann alle Namen. Vorher eine Probe, ob `page_size`
  angenommen wird (Freigabe). Kopfzeilen der App werden NICHT
  nachgeahmt — wir sind ein Web-Client auf einem iOS-Pfad, das muss
  Caspar_D wissen.
- Mitschnittdatei `/Volumes/Extreme_SSD/Entwicklung/apk/iphone/mitschnitt.flows`
  enthält Sitzungs-Token: nach Abschluss der Doku löschen (Caspar_D fragen).
- mitmproxy (Homebrew) bleibt installiert; Zertifikat in `~/.mitmproxy`.
- Nachtrag 01:10: Likes-Register nur bei eigenen Titeln; fremde (Tarja,
  `tarja_ravenveil`) haben es nicht. Proxy beendet, Telefon zurückgesetzt
  (Profil bleibt ohne Vertrauen). Kommentare der App tragen `num_replies`,
  `replies` (eingebettet) und `reaction_type`.

## Liker-Weg gebaut und gelaufen (09.09.2026, 01:18)

- Lesezeichen-Abschnitt 2e „Wer hat geherzt" (Haken, an), nur Titel mit
  geänderter Herzzahl gegen `/api/liker/stand`; Server `likerAblegen`
  → `library/liker/<song>.json` (Stand) + `library/liker-verlauf.ndjson`
  (dazu/weg ab dem zweiten Lauf); Reaktionsfenster zeigt alle Namen
  (Zeit aus Benachrichtigung, Seitenende, Cursor-Fenster, sonst „Zeit
  unbekannt"). Commit 9bc35e8.
- Erster Lauf: 266 Titel, 2214 Personen, 31 exakte Zeiten, 793 Fenster,
  1390 ohne Zeit (Titel mit einer Seite haben keinen Cursor). 14 Titel:
  Sunos Zahl = Liste + 1 (nicht das eigene Herz — das steht in 259 Listen).
- **Fehler gefunden und berichtigt:** v3-Bündelzahl war
  `Handles + "andere"` (3 + 7 = 10 statt 8); richtig ist `genannte Personen
  im Text + andere`, mindestens Handles. Die 14 falschen Nachträge des
  Laufs wurden aus reaktionen.ndjson entfernt und aus der Rohform neu
  erzeugt (Ergebnis: 0 Nachträge, nichts war gewachsen). Sicherung:
  `library/backup/reaktionen-vor-anzahl-korrektur-2026-09-09.ndjson`.

## Nachtrag 09.09.2026, 02:20 — Gemeinschaft aus den Liker-Listen

- Gebaut: `/api/community` zieht Herzen aus `library/liker` (1.760 mehr als
  der Strom, Tarja 100), Strom bleibt für Kommentare/Beobachter/Zeiten;
  Buendelzeiten wie im Song-Fenster; Personen-Spur „Zeit unbekannt";
  Reaktionsfenster: Buendelzeit fuer alle im Buendel (Nachbarn in der
  zeitlich sortierten Liste). Commits ca9270e, 9d20c87, 7c41450, e2bd70c.
- `bin/community-profile.js` sammelt Handles auch aus den Liker-Listen:
  491 statt 208; 283 Profile holt der naechste Morgenlauf (~7 min), danach
  `nachbarn-hirsch` fuer die Neuen (~20 min, zwei bis vier Seiten je Person).
- Entschieden (Caspar_D): Hirschfaktoren bleiben „herkoemmlich und
  vorsichtig" — Seiten sind innerhalb nicht sortiert, deshalb kein
  Sprungverfahren; der Abbruch am Seitenmaximum ist das Optimum.
- Offen, Vorschlag gemacht: Lesezeichen-Abschnitt „Beobachter" ueber
  `profiles/{handle}/followers|following?page=N` (24 Seiten, alle 352/102,
  `is_following_viewer`), Stand + Kommen/Gehen, im Profil vollstaendig.
- Rote Albumeintraege, Abschnitte nach und nach: weiter offen (siehe oben).

## Profil gegengelesen und berichtigt (09.09.2026, 02:50)

Zwei Gegenleser (Meine Gemeinschaft, Meine Daten), 22 Befunde, alle
umgesetzt (Server b8b629c, Oberfläche im Commit danach):
- Strom zählte dieselbe Person je Titel doppelt (einzeln + Bündel) →
  Schlüssel handle|song, Einzelzeile schlägt Bündel; eigener Handle
  überall ausgefiltert; folgtMir aus der Beobachterliste (der Liker-Weg
  liefert is_following_viewer immer false); Zeitfenster (zeitAb/zeitBis)
  reisen mit, imFenster zählt ein Herz, wenn sein Fenster ganz im Zeitraum
  liegt; Unterschriften nennen Stand und Ausgelassene.
- Personenseite fragt zuerst die Beobachterliste („folgt dir seit …",
  „du folgst zurück"); Spur zeigt Bündelzeit als „bis".
- Meine Daten: „Alben auf Suno" statt immer 0; Verlaufsbeginn = Minimum;
  „Tempo × Herzen" liest taktBpm (analyse.bpm tot, auch im Klangraum-
  Schiff ersetzt); Hirschfaktor an drei Stellen nur öffentliche Titel
  (hirschRechnen), mit Erklärung der privaten; Modelle-Kachel angehängt;
  Personas-Kachel gelöscht; Fußnote „Alle N Titel, auch M private";
  Wörter laut WOERTER.md (meistgeherzten, Titel, Titelseite, Im Blick,
  Längster Name).
- Nachbarschaft nennt „N Menschen aus den Liker-Listen noch ohne Profil".
- Ideen für die Gemeinschaftsansicht: docs/BACKLOG.md (Caspar_Ds Wunsch:
  Stilgruppen auf Zeit normiert, Vorlieben je Person).

## Stand 09.09.2026, 03:55 — Ende der Nachtsitzung

- Beobachterlauf (00:57): 352 Beobachter, 102 Gefolgte, 68 beidseitig,
  34 folgen nicht zurück, 296 herzen ohne zu folgen, 207 folgen ohne Herz.
  folgtMir jetzt aus der Beobachterliste (148 Liker).
- Morgenlauf danach: Nachbarschaftsprofile 208 → 490, Hirschfaktoren
  202 → 468; von 450 Leuten der Gemeinschaft haben 449 ein Profil.
- Titelbild ohne Rand (4bd4d7d): 181 von 324 Covern beschnitten,
  Katalogkopf `titelbild` (181), Bühne/Player nehmen titelbild.jpg.
  Server-Neustart wartet, solange ein Morgenlauf läuft (server.js:2692) —
  deshalb kam die Liste erst nach dem Lauf an.
- Seite hält sich seit 39fb343 selbst aktuell (/api/stand, 60 s).
- Offen: Abschnitte „nach und nach" im Morgenfenster (Backlog); Ideen
  Gemeinschaft (Backlog, Caspar_Ds Wunsch Stilgruppen zuerst); Mitschnitt-
  datei im apk/iphone-Ordner enthält Token — löschen, wenn Caspar_D zustimmt.

## Archiv-Export gebaut (09.09.2026, 09:30)

- Drei Teile, in einem Workflow parallel gebaut und von mir zusammengesetzt:
  `server/server.js` (`--eingefroren`, `--port` mit Weitersuche, 405 auf
  alles außer GET/HEAD, `/api/export/start|stand`, `/api/konfig
  {exportZiel}`, `/api/himmel-export {relativ}`), `bin/export.js` (neu:
  Programm/, Programm/library/ ohne WAV/Stems/roh/backup/modelle/…,
  Musik/ mit ID3 samt Titelbild, node/ aus library/node-portabel,
  Sternenhimmel.html relativ, Startskripte Mac/Windows/Linux, LIES-MICH,
  export-stand.json, Probestart vom Ziel), `bin/himmel-export.js`
  (`--relativ`, `--ziel`; elf seit 25.08. fehlende Namen ergänzt),
  `web/index.html` (Register „Export" im Profil, Klangraum-Knopf
  gestrichen, eingefrorener Modus mit Banner, Bild-Rückfall für alle).
- Ende-zu-Ende über den Server-Weg auf die SSD: 3.673 Dateien, 7,54 GB,
  65 s, Musik/ 324, Probestart ok; Probekopie danach gelöscht,
  `exportZiel` in konfig.json wieder leer.
- Portables Node v24.21.0 (LTS) in `library/node-portabel/` (gitignored):
  win-x64, darwin-x64, darwin-arm64, Prüfsummen geprüft.
- Offen: Windows-Startskript auf Castos Rechner testen (SmartScreen,
  findstr, curl); Handbuch-Kapitel Export; Stick-Ziel setzt Caspar_D im
  Register; Stems bleiben liegen, wenn ein früherer Lauf sie kopiert hat.
- Nachtrag 09:50: Sternenhimmel-Export — artworkBild war im Export ein
  Leerstummel (Steckbrief/Legende ohne Bild, „dead link", Caspar_D);
  jetzt die Bildadresse des Titels. Tote Tonadressen (/api/forbidden)
  kommen nicht mehr in die Demo, Klick öffnet Suno. Hausfassung „mit
  Medienordner" läuft über /media. Export räumt am Ende „._"-Beifang
  (exFAT/macOS, sonst Geistertitel auf Fernsehern). Probekopie gelöscht.

## Register „Mobiler KlangTresor" dreigeteilt (09.09.2026, 10:45)

- Caspar_D: „das Ganze ist eigentlich dreigeteilt — erst sagen wohin, dann
  sagen was, dann starten"; Mockup gezeigt, „das ist cool, genau so".
- `web/index.html`: Kopf mit **Piktogramm des Datenbestands** (Stick,
  Blöcke nach Größe, aus stand.bedarf; mit Stems-Haken kommt der Stems-
  Block dazu) links neben der Erklärung. **Schritt 1 Wohin**: Ordner-
  wähler, daneben Medium (Name · Dateisystem · Größe, frei) und die Marken
  Mac/Windows/Linux aus stand.medium.kompatibel, darunter der Hinweis des
  Servers. **Schritt 2 Was**: ✓ Datenbestand (mit Größe), ✓ Sternenhimmel
  (immer dabei — „größentechnisch pillepalle", kein eigener Export mehr),
  Haken Stems (Größe aus bedarf); darunter „Platz auf <Medium>": Stapel-
  balken [anderes belegt][KlangTresor je Teil][bleibt vom früheren Export]
  [frei danach], Legende je Teil mit Dateizahl, Zeile „Davon liegen schon
  X auf dem Medium — der Export frischt nur auf". **Schritt 3**: Knopf,
  Standzeile, Fortschrittsbalken (was · fertig von gesamt · MB/s · noch
  etwa), Lauf-Abschnitt, Ergebniskacheln. Darunter EINE Zeile „Sternen-
  himmel als Demo zum Verschicken" mit Knopf; der Knopf „mit Medien-
  ordner" ist gestrichen (dieselbe Datei entsteht beim Export).
- Farben je Teil fest über lagenRampe(8) (zwei Hausakzente), gleich im
  Stick und im Balken; Mockup-Farben (violett, türkis) verworfen — „ein
  dritter Akzent wäre wieder erfunden".
- Geprüft auf einer Probeseite mit Attrappen-Stand (Scratchpad, Port
  18811, danach beendet): voll / läuft (23 %, 1,1 MB/s, noch etwa 1.0 h)
  / knapp FAT32 mit Stems („Passt nicht … es fehlen 25,4 GB", Knopf zu) /
  alter Server ohne medium+bedarf (nur Form, nichts gesperrt). Kein
  Text im Stick breiter als 94 px. Nicht in Caspar_Ds Fenster geladen.
- `bin/export.js` (Workflow-Agent): rsync `--info=progress2`, Vorab-
  messung je Schritt (`--stats`, Trockenlauf — auf dem langsamen Stick
  spürbar, währenddessen fortschritt null), `fortschritt{prozent, was,
  bytesGesamt, bytesFertig, bytesProSekunde, restS}` in export-lauf.json
  (höchstens 4×/s), `zielDateisystem`, Abbruch bei NTFS-nur-lesen,
  nur-lesen-Ziel, FAT32 mit Datei > 4 GB.
- **Offen, sobald der Stick-Export durch ist** (Wächter b3mw0eis1):
  Server-Patch anwenden — `scratchpad/server-medium-patch.py` (aus dem
  Sitzungsprotokoll zurückgeholt, ein Agent hatte ihn gelöscht): medium
  {pfad, name, dateisystem, gesamt, frei, belegt, archivBytes,
  kompatibel} und bedarf {teile[], gesamt, gesamtMitStems, 10 min
  gemerkt} in /api/export/stand, dazu /api/export/bedarf. Solange läuft
  der Stick-Export (PID 43054), und eine Änderung an server.js startet
  den Server neu. Danach committen und pushen (fetch vorher).
- Wortfrage: WOERTER.md sagt „Export → die Ausgabe"; das Register sagt
  „Export starten / Export läuft", wie Caspar_D selbst spricht. Nicht
  entschieden.

## Register nach Hausregeln, Server-Patch drin (09.09.2026, 11:40)

- Caspar_D: „Hausregeln.md anschauen, wie Diagramme auszusehen haben".
  Umgesetzt: Stems als Pille (Regel 18), keine Schrift unter 12 px
  (Nebenwerte 10,5), schwarzer Datenbereich rx 6 für Platz- und
  Fortschrittsbalken (Regel 8), Legende als .stapellegende (Pille 22×11,
  Name in seiner Farbe, lesbarAuf 4,5:1), Titel als .diatitel, Legende 5 px
  unter dem Bild, Erklärsatz 14 px darunter, Dezimalkomma in
  morgenDauerText (hauswiet: „1,0 h" statt „1.0 h").
- Caspar_D zum ersten Entwurf: Farben zu dicht → **Kennfarben-Triade wie im
  Zählerverlauf** (exportPalette: beide Akzente in OKLCH um 120/240 Grad
  gedreht, sechs Töne im 60-Grad-Abstand, je Akzentpaar gemerkt); **sechs
  Teile statt acht** (Programm, Texte, Node = „Programm & Texte", Einzel-
  werte im Tooltip); **Satzspiegel**: erste Textzeile der Erklärung auf der
  Höhe der ersten Beschriftung, letzte auf der letzten, Stick so hoch wie
  der Text (exportKopfMasse misst die Zeilen, Bisektion über den Maßstab,
  Resize zieht nach); Stick fluchtet mit dem Text der Schritte (36 px).
- Caspar_D: „zeigen statt Gegenlesen" — Prüfer-Workflow gestoppt, Memory
  zeigen-statt-gegenlesen.md. Ausgerenderte Zustände liegen im Scratchpad
  (register-neu.html), nicht im Repo.
- **Server-Patch angewendet** (11:35): medium {pfad, name, dateisystem,
  gesamt, frei, belegt, archivBytes, kompatibel} und bedarf (asynchron mit
  fs.promises, 0,7 s, 10 min gemerkt) in /api/export/stand, dazu
  /api/export/bedarf; toter Export (pid lebt nicht) wird als abgebrochen
  in die Mitschrift zurückgeschrieben. Server neu gestartet, antwortet.
- **Stick-Export angehalten** (11:30, Caspar_D: „wir setzen den stick später
  fort"): Der Mac war in den Ruhemodus gegangen, INTENSO hatte sich
  ausgeworfen und neu eingehängt; rsync lief weiter, aber mit offenen
  Dateien auf dem alten Einhängepunkt. export.js hält den Mac jetzt wach
  (caffeinate -i -w) und nimmt beim Abbruch seine Kindprozesse mit. Zwei
  verwaiste rsync (43204/43205) hingen danach im Plattenwarten (UN) — ohne
  Zutun beenden sie sich, sobald der Stick antwortet; ggf. prüfen mit
  `pgrep -x rsync`. Auf dem Stick liegen ~6,3 GB Teilkopie ohne
  export-stand.json — der nächste Lauf frischt nur auf.
- Nächster Schritt mit Caspar_D: Register in seinem Fenster ansehen (Reload),
  dann den Stick-Export erneut starten und den Fortschritt live prüfen.

## Export in Stufen, nach Wichtigkeit (09.09.2026, 12:00)

- Caspar_D: „so aufbauen, dass die nötigen Dateien zuerst und die weniger
  nötigen später geschrieben werden … zuerst Server und unabdingbare
  Skripte, dann Aktuelles zuerst — MP3s, wenigstens eine Textspur —, Stems
  zuletzt." Der Fall: „ich will los … reicht nicht auch eine Viertelstunde
  für was Vorzeigbares." Plan abgestimmt (node/ in Stufe 1: ja; fehlende
  Titel nicht anzeigen, stattdessen Fußnote „Teilkopie von @alias vom Datum").
- `bin/export.js`: sieben Stufen — 1 Starten (Programm, Startskripte,
  Bestand-Kern = library-Wurzel und kleine Ordner, Sternenhimmel, node/),
  2 Titel neueste zuerst (audio.mp3, kachel.jpg, titelbild.jpg), 3 große
  Titelbilder und Rest im Titelordner, 4 Analyse-Ablage, 5 Musik/ + docs/,
  6 Stems (nur mit Pille), 7 Abschluss (rsync-Aufräumlauf mit --delete,
  Beifang, Stand, LIES-MICH, Probestart). Stufen 1–4 und 6 kopiert das
  Skript selbst (kopiereDatei: 4-MB-Stücke mit Meldung, .tmp + rename,
  mtime der Quelle bleibt — sonst kopierte der Aufräumlauf alles noch
  einmal; geprüft: Aufräumlauf überträgt 0 MB). Anhalten: erstes SIGTERM
  setzt die Flagge, laufende Datei wird fertig, rsync/ffmpeg bekommen das
  Signal und räumen selbst; Stand als Teilkopie; zweites SIGTERM bricht
  hart ab. Zwischenstand export-stand.json {teilkopie, stufe, titel,
  titelZuHause, handle, anzeigename} nach jeder Stufe und in Stufe 2 alle
  25 Titel. Probestart prüft gegen die Zahl der Titel mit MP3 zu Hause.
- `server/server.js`: eingefroren zeigt /api/index nur Titel mit MP3
  (eingefrorenVorhanden, 30 s gemerkt) und liefert eingefroren.teilkopie/
  stufe/titel/titelKatalog/handle; POST /api/export/stop schickt SIGTERM.
- `web/index.html`: Banner „Teilkopie von @caspar_d vom 09.09.2026 — 187
  von 324 Titeln, die neuesten · Stufe 2 von 7"; Register: Knopf
  „Anhalten" während des Laufs, Standzeile mit Stufe, „Angehalten nach
  Stufe n: N Titel spielbar — der Stick kann ausgeworfen werden",
  Teilkopie-Stand vom Stick, .ms-Zustand „angehalten" (Akzent, nicht Rot).
- Geprüft auf der SSD (eigene Mitschrift, Probeordner, danach gelöscht):
  Anhalten nach 25 s → Stufe 4, Stand teilkopie, keine .tmp; eingefrorener
  Server auf der Teilkopie (100 MP3 entfernt) meldet 224 von 324;
  Fortsetzen → alle Stufen, 3.674 Dateien, 7,54 GB, Probestart ok.
- Caspar_D hat den Stick-Export mit dem neuen Skript um 11:45 gestartet
  (Stufe 2 mit 7 MB/s); Wächter bgjbqf2fo meldet Stufenwechsel und Ende.
  Sein Fenster hat den Anhalten-Knopf erst nach einem Reload.
- Offen: die Restzeit in Stufe 1 (node/) war beim ersten Lauf Unsinn — seit
  der Kopie in Stücken behoben, im laufenden Export aber noch alter Stand.

## Behälter: der Bestand als tar-Stücke (09.09.2026, 12:30)

- Caspar_D: „das ist alles irre langsam … irgendwas, was diese Mikromengen
  auf großen Blöcken vermeidet" → Optionen besprochen (ISO, SQLite, DuckDB,
  tar) → „gut, dann arbeiten wir mit Containern (Behältern)". Grund: der
  Intenso schreibt große Dateien mit 14 MB/s, aber jede Datei kostet ihn
  1–2 s (exFAT-Metadaten); 4.000 Dateien = über eine Stunde, dieselben
  Bytes am Stück = 10 Minuten. Windows hat tar.exe seit Win 10 1803, der
  Stick braucht aber kein tar: der Server liest per Versatz.
- `bin/behaelter.js` (neu): ustar-Stücke `bestand-001.tar …` bis 2 GB
  (FAT32), pax-Vorsatz für Namen > 100 Byte, Verzeichnis
  `bestand-index.ndjson` (alle 5 s ganz neu geschrieben, Reihenfolge =
  Schreibreihenfolge), Wiederherstellung fehlender Einträge aus den
  tar-Köpfen, Anhängen (Endblöcke abschneiden), Grabsteine, masse()
  (Ballast), verdichten() (lebende Einträge in neue Stücke, tauschen;
  Abbruch lässt alles beim Alten), stream(rel, von, bis) für Byte-Bereiche.
  Nur Schreiber schreiben das Verzeichnis (schreibgeschützter Stick).
  Geprüft: Schreiben, Lesen, Bereich, langer Name, Anhängen, Löschen,
  Wiederherstellen ohne Verzeichnis, Verdichten; System-tar liest die Stücke.
- `bin/export.js`: Stufen 1–4 und 6 schreiben in den Behälter
  (behaelterSchritt: gleich = Größe+Zeit laut Verzeichnis; 4-MB-Meldung);
  Kern und Musik/ bleiben echte Dateien; Herzen-Listen (liker/) in Stufe 1
  in den Behälter; Sternenhimmel über `--musik Musik --namen
  library/export/musik-namen.json` (Kacheln eingebettet, 21,6 MB HTML);
  Stufe 7: Kern-Aufräumlauf (rsync, songs/analyse/liker ausgeschlossen,
  Stücke geschützt; --delete-excluded räumt Altbestand vor den Behältern
  selbst ab), Grabsteine für zu Hause Gelöschtes, Verdichten bei > 25 %
  Ballast, Stand mit `behaelter` = masse(). FAT32-4-GB-Prüfung gestrichen
  (Stücke < 2 GB).
- `server/server.js` (Agent): behaelterHolen() (LIB, neu bei Index-mtime),
  liefere() fällt nach statSync-Fehler auf den Behälter zurück (Range,
  Cache-Regeln unverändert), eingefrorenVorhanden, likerLesen/likerAlle/
  likerStand, analyseListe, /analyse/<name>, /api/eigen-artwork; BEOBACHTET
  + behaelter.js. Zu Hause unverändert (kein Behälter → echte Dateien).
- `bin/himmel-export.js` (Agent): Modus `--musik <ordner> --namen <json>`
  (Ton aus Musik/, Kacheln als data:-URI).
- Ende-zu-Ende auf der SSD (Probe, danach gelöscht): voller Lauf 28 s,
  553 Dateien statt 3.700, 3 Stücke (4,96 GB); Auffrischen 4 s;
  Altbestand weg; Anhalten nach 12 s → Teilkopie, Verzeichnis gelöscht →
  aus Köpfen wiederhergestellt (2.481 = 2.481), Fortsetzen 20 s; Probestart
  aus dem Ziel liest die Behälter: 324 Titel, ok.
- Caspar_Ds Stick-Export (altes Stufen-Skript, Dateien einzeln) läuft
  noch: Stufe 2 bei 50 % nach 40 min. Empfehlung: anhalten und mit der
  Behälter-Fassung neu starten (räumt in Stufe 7 die alten Dateien ab).
- Offen: ~~Register zeigt `behaelter` noch nicht~~ (**erledigt**, es zeigt
  „Behälter auf dem Medium" samt Ballast); Balken 2 („schon drauf / kommt
  noch") über Nachmessen des Ziels — mit wenigen großen Dateien jetzt
  billig; Kachelgröße (50 KB) für den Sternenhimmel.

## Erster vollständiger Stick mit Behältern (09.09.2026, 13:45)

- Der Intenso war nach den Versuchen des Tages auf 3 MB/s gefallen (gemessen:
  frische 300-MB-Datei 3,4 MB/s, Anhängen 2,7 MB/s) und stallte
  minutenlang — Schreibcache erschöpft plus zerstückelter Platz durch die
  3.700 Altdateien. Caspar_D: formatieren. Erledigt: `diskutil eraseDisk
  ExFAT INTENSO MBR disk2`, Spotlight aus (`mdutil -i off`),
  `.fseventsd/no_log`. 1-MB-Cluster scheiterten (newfs_exfat braucht
  root), es bleiben 128 KB.
- Voller Lauf danach: 16 min, 552 Dateien, 7,56 GB, 3 Stücke (4,96 GB,
  3.127 Einträge), Musik/ 324, Probestart ok, 51 GB frei.
- Register nachgezogen (alle committet): Gesamtbalken mit Etappen in den
  Farben ihrer Datentypen (1 Programm, 2 MP3, 3 Bilder, 4 Analyse, 5 Musik,
  6 Stems; ausstehend gedämpft), Unterschrift „Fortschritt des ganzen
  Laufs · Stufe n von 7 …", Balken bleibt zwischen Stufen stehen (Fehler:
  Schlüssel blieb am Kasten), Anhalten-Warnung orange / grün „sicher
  auswerfen", Starten/Anhalten groß, 32 px zwischen den Schritten, 22 px
  über dem Balken, Titel „Belegung von <Medium> nach Datentransfer".
- `bin/export.js`: Plan vor dem ersten Byte (plan.stufen, plan.teile,
  gesamt), Gesamtzähler läuft über Teilschritte durch; Meldung „gibt es zu
  Hause nicht" gestrichen.
- Offen: Balken 2 („schon drauf / kommt noch" durch Nachmessen des Ziels);
  ~~Register zeigt `behaelter` (Stücke, Ballast) noch nicht~~ (**erledigt**);
  Kachelgröße für den Sternenhimmel (21,6 MB HTML); Windows-Start bei Casto.

## Demo-Sternenhimmel: Sunos Player eingebettet (09.09.2026, Nachmittag)

- Caspar_D: der verschickte Sternenhimmel soll die Titel abspielen, nicht
  nur auf Suno verlinken ("wenn jeder Song auf Suno geht, ist der Reiz
  kaputt"). Weg: Sunos offizielle Einbettung `suno.com/embed/<id>`, die
  streamt ohne Anmeldung, nichts wird gespeichert. Tarjas Entschlüssel-
  Rezept NICHT gebaut (umginge Sunos Schutz).
- Untersucht (WebFetch + einmal Chrome, Skripte aus der Seite heraus
  durchsucht): der Einbett-Player ist Sunos eigene Next.js-App, kein
  Parameter/kein Theme, aber der Media-Player darin ist **Plyr** (MIT).
  Der Ton hängt an `crypto.subtle` + `/rights` (Tarjas Befund bestätigt).
  Also: eigener, frei gestalteter Player wäre leicht (Plyr), scheitert nur
  am verschlüsselten Ton.
- `bin/himmel-export.js`, Demo-Modus (ohne --relativ/--musik): der Himmel
  bildfüllend (Kopf/Fuss/untere Leiste aus); das ganze KlangTresor-Panel
  bleibt, schwebt aber als durchscheinendes Overlay oben rechts (kein
  Drawer, der zudeckt); Sunos Player oben links, unangetastet, 16:9,
  ein Fünftel Bildbreite, per transform:scale() verkleinert (nicht
  beschnitten - Suno hat eine Mindestgröße), Naturmaß 480x270. Klick auf
  einen Stern lädt `embed/<id>?autoplay=1` (allow="autoplay" + Klickgeste),
  Flugreise: nach Spieldauer vor() zum nächsten Klangnachbarn, sonst zu
  einem zufälligen noch nicht gespielten. Nachlade-Schutz: derselbe Stern
  nicht neu, zwei Ladevorgänge >= 3 s auseinander (Suno drosselt das
  Starten neuer Streams, sonst Weiterleitungsschleife über auth.suno.com).
  Caspar_D: "das sieht schon sehr gut aus."
- Grenze, die bleibt: der gestreamte Ton geht nur über Sunos Player und
  wird gedrosselt. Betrifft nur die Demo; das eigene Archiv (Haus + Stick)
  spielt lokale MP3, ohne Suno.
- Ebenfalls fertig, mitcommittet: der --musik-Sternenhimmel bettet die
  Kacheln auf 144 px verkleinert ein (2,4 statt 21,6 MB). Handbuch-Skizze
  "Mobiler KlangTresor" in docs/handbuch/SKIZZEN.md (Kapitel noch nicht
  geschrieben, der HTML-Entwurf des Agenten liegt im Scratchpad).


## Titelbild-Studio (09.09.2026, Abend)

**Was es ist.** Das dynamische Titelbild als Rezept am Song: `library/songs/<id>/eigen-effekt.json`
(viertes Eigenes neben eigen.mp4/jpg/mp3, gleicher `eigen-artwork`-Weg). Die App malt es live —
kein Video wird gebacken (Caspar_D: „Preset an den Titel gebunden … schneller zu ändern, weniger Datenflut").

**Stand.** Station A (Server: Index meldet `effekt`, PUT `application/json`, DELETE `?was=effekt`) und
Station B (Modul `const TitelbildStudio` am Ende des Hauptskripts, Klassen/IDs `tbs-`, Overlay wie `#wer`,
Knopf als viertes Feld `#capartstudio` in der Abzeichen-Karte) sind eingebaut; Parse aller Inline-Skripte
und Rauchtest im Scratch ok. Schnappschüsse: `.schnappschuss/index.html.vor-titelbildstudio`,
`.schnappschuss/server.js.vor-titelbildstudio`.

**Offen — Station C.** Live-Malen auf Kachel und Bühne, wenn `_eigenArt[id].effekt`: Canvas analog zu
`bewegtAn()` (video.bewegt) in den `.bild`-Kasten, Zeit aus `audio.currentTime` (eine Audioquelle),
Schläge per `/api/song/<id>`. Danach Hausregeln 9–13 der Studio-Durchsicht (Haus-Gradationswerkzeug,
`#tipp`, Pille-Spezifität, Kosten am Knopf, Panel nachmessen).

**Design-Labor** bleibt der Scratch `bewegt-proto.html` (Port 18811, lokale Cover-Kopien → Histogramm).

**Nachtrag (später am Abend).** Station C ist eingebaut: `hatLebendbild(s)`, Hausfunktionen `lebendAn/lebendAus`
(rufen ins Leere, bis das Modul am Skriptende steht — Modul ist deshalb `var`), Anschlüsse in `markieren()`,
Raster-Hover, `bewegtAufraeumen()`, `darstellungAufbauen()` (Bühne). Lebendbild hat Vorrang vor Video. Der
Einbau ist ein wiederholbares Skript (`scratchpad/einbau.py`, vom Schnappschuss aus). Offen: Abnahme durch
Caspar_D in der App; danach Hausregeln 9–13 (Haus-Gradationswerkzeug, `#tipp`, Pille-Spezifität, Panel nachmessen).

**Nach der ersten Abnahme (Caspar_D):** freie Uhr kreist über die Liedlänge (Puls hört nicht mehr auf), Knopf
**„▶ Titel abspielen"** im Studio-Kopf ruft `spielenNachId(id)` (Haus-Player), Pult 460 px / Kasten 1320 px ohne
Knopf-Umbrüche, Gradationskurve im goldenen Rechteck `447:276` (= `GRAD_MASSE`), neuer Effekt **Schatten**
(Gegenstück zum Scheinwerfer, Verrechnung Multiplizieren) in den Läufen. Einbau weiterhin über `scratchpad/einbau.py`.

**Lehre (09.09.2026, spät):** Ein Overlay mit Leinwand **erst zeigen, dann das Bild laden.** Ein Cover aus dem
Browser-Vorrat lädt sofort; misst `groesse()` dann ein noch unsichtbares Feld (0×0), schrumpft die Leinwand auf
1×1 und bleibt schwarz. Im Studio behoben (`oeffnen()`: zeigen → laden → `groesse()`; Riegel in der Schleife).

**Grundsatz (Caspar_D, 09.09.2026):** „Man muss die ganzen Effekte subtil und nicht plump anwenden, dann ist es
richtig gut." Der Schatten wirkt, *weil* er kaum da ist. Beim Feinschliff der Voreinstellungen/Presets beachten.

**Neu (09.09.2026, spät):** Effekt **Sicherungswackeln** (Gruppe Blitze, Gegenteil vom Stroboskop): kurze
unregelmäßige Helligkeitseinbrüche mit Zittern, frei (Häufigkeit je 10 s) oder im Takt (nur ein zufälliger Teil der
Schläge, deterministisch aus Schlag-Index). Aus der Liste „Neue Effekte" noch offen: Theaternebel, Partikel
(Schnee/Regen/Asche/Funken), Nachzieheffekt, Bloom/Halation, Scanlines/CRT.

**Batch H (09.09.2026, Nacht):** fünf neue Effekte — Theaternebel (Läufe), Partikel Schnee/Regen/Asche/Funken (eigene
Gruppe), Scanlines/Röhre, Bloom/Halation, Nachzieheffekt (Anmutung). Pipeline: Post-Effekte mit eigener Verrechnung
(`postVerr`, Bloom = Screen), Arbeitsflächen `_spur`/`_mc` bleiben aus dem Rezept (presetJSON filtert `_`).
**Leise Voreinstellungen** (`staerkeDef` je Typ, lautere Parameter runter) nach Caspar_Ds „subtil, nicht plump".
Presets nachgestimmt, neu: „Kaum da", „Nachtfahrt", und aus dem Bestand wertgenau „Nur Atem" (Still you laugh:
Sigmoidal, Tonwert −1, Weißpunkt 0,44, Atem) und „Schatten und Schlag" (Bei mir klingelt keiner: Sättigungs-Schlag +
Schatten + Unschärfe-Schlag, zwei stille Lichter aus). Stärke-Zeile im Verrechnungsblock 3-spaltig (Wert neben Balken).
Damit ist die Liste „Neue Effekte" abgearbeitet; Hausregeln 9–13 sind durch die Bauweise erfüllt.

**Nachtrag:** Theaternebel hat einen **Heterogenität**-Regler (Streuung von Größe, Dichte und Tempo je Schwade,
deterministisch); Partikel haben **Windstöße im Takt** (Pille) mit **Böenstärke** (nur sichtbar, wenn an): auf einem
zufälligen Teil der Schläge ein abklingender Stoß mit zufälliger Richtung/Wucht aus dem Schlag-Index, Regenstriche kippen mit.

**Nachtrag (10.09.2026):** Partikel haben eine **Farbspanne** („Farbe" bis „Farbe bis") mit **Farbheterogenität**;
jedes Teilchen zieht seinen Ton deterministisch aus der Spanne. Beim Wechsel der Art setzt `ART_FARBEN` passende Farben
(Funken rot→gelb 0,85; Asche grau→dunkel 0,6; Schnee/Regen weiß mit kaltem Hauch), aber nur, solange die Farben noch
die der vorigen Art sind — eigene bleiben (`_artVor` merkt die vorige Art, wandert nicht ins Rezept).

**Nachtrag:** Theaternebel hat neben Heterogenität (Unterschiede *zwischen* Schwaden) jetzt **Turbulenz** (räumliche
Frequenz *in* der Schwade — „viel Änderung pro Ort", Caspar_D): jede Schwade ist ein Bündel kleinerer Flecken, die um den
Kern kreisen; je höher, desto mehr, kleiner, schneller (bis 9, dreifaches Tempo; Deckung je Fleck voll, sonst verblasst die Schwade). Turbulenz 0 = der ruhige Fleck von vorher.

**Neu (10.09.2026):** Effekt **Feuer** (Läufe): prozedurale Flammen über einer Grundlinie (Boden/Mitte/Breite frei),
je Zunge ein Stapel aufsteigender Glutflecken — unten breit/gelb, oben schmal/rot, Deckung fällt mit der Höhe; Zungen
schwanken und flackern je eigen; Glut an der Basis; „lodert im Takt" lässt die Flammen auf Schlägen höher schießen.
Additiv verrechnet, damit Überlagerung heiß wird. Caspar_D: „Kannst du Feuer?"

**Nachtschicht 10.09.2026 — Entwürfe für Caspar_Ds Klickdurchgang.** Batch 1: **WebGL-Stufe** im Studio (Vollbild-Quad,
Bild als Textur, je Effekt ein Fragment-Shader; ohne WebGL oder vor dem Laden zeichnet sie nichts) und fünf Shader-Entwürfe
in der Gruppe „Entwürfe (WebGL)": Wellen (Brechung, mit Zone/Aufwind auch Hitzeflimmern), Kaustik (Lichtnetz), Linse
(Wölbung + Farbränder), Dunst (fraktaler Rauschnebel), Flammen (Rauschen). Fremdcode: `web/fremd/webgl-noise/`
(Ashima Arts / Stefan Gustavson, **MIT**, LICENSE + HERKUNFT.md daneben; zur Laufzeit als Shader-Vorspann geladen).
Einsortierung in die Familien nach dem Klickdurchgang.
Batch 2 (Leinwand): Gruppe „Entwürfe (Leinwand)" mit **Lichtstrahlen** (weiche Schächte aus einem Punkt, auch außerhalb),
**Spiegelung (Wasserfläche)**, **Filmkorn**, **Glitch-Blöcke** (frei/im Takt, Farbversatz); Pulse ergänzt um **Farbton schlägt**
(hue-rotate) und **Kippen schlägt** (Grundbild unter Drehung, leicht nachgezoomt); Partikel-Arten **Blasen, Staub, Blätter**
mit eigenen Farbspannen; „auch als …"-Hinweise bei Sicherungswackeln, Partikel, Theaternebel (Effekte sind Formen).
**Verrechnung für alle** (Caspar_D: „die effekte müssen aber alle die verrechnungen bekommen"): Post-/WebGL-Effekte
verrechnen ihr Ergebnis per Instanz (Bloom Vorgabe Screen), die Puls-Schläge (Schärfe/Kontrast/Sättigung/Farbton) ihre
Schlag-Ebene, Stroboskop (additiv), Sicherungswackeln/Scanlines (multiplizierend) und Filmkorn (**Überlagern**, neu in der
Liste) sind nicht mehr fest verdrahtet. Nur Fahrt/Zoom/Kippen bleiben ohne — sie verschieben das Bild, keine zweite Ebene.

### Verrechnungen vollständig (10.09.2026)
Die Verrechnung an jeder Karte kennt jetzt alle 17 Canvas-Modi, im Menü gruppiert
(Aufhellen: Additiv, Screen, Hell gewinnt, Abwedeln · Kontrast: Überlagern, Weich,
Hartes Licht · Abdunkeln: Multiplizieren, Dunkel gewinnt, Nachbelichten · Umkehren:
Differenz, Ausschluss · Farbe: Farbton, Sättigung, Farbe, Luminanz). Neu sind Hartes
Licht, Differenz, Ausschluss und die vier Farbmodi; `verrOptionen()` baut die
`<optgroup>`s aus der vierten Spalte von `VERR`. Rauchtest: jeder Modus verändert den
Bildmittelwert messbar. Kein Rezept musste angepasst werden (alte Schlüssel unverändert).

## Plan: Grund-Blätterer im Titelbild-Studio (Nachtschicht 10./11.09.2026, wartet auf Jörgs Go)

Jörgs Wunsch: „für einen Song alles durchblättern, was da ist, standardmäßig kommt das
Titelbild, mit Vor und Zurück, das Artwork oder ggf. weitere Artworks bzw. Videos“, und:
„erstmal kann nur ein handmade Video gespeichert werden, Tarja ‚missbraucht‘ das gerade
für Hook-Videos aus Suno“ → mehrere eigene Videos je Titel.

**Bestand je Titel (Karte aus fünf Lesern, geprüft):**
| Datei | wovon | Stück |
|---|---|---|
| cover.jpg | Sunos image_large_url, roh | 324 |
| titelbild.jpg | cover.jpg ohne Rand (kacheln.js), nur wo ein Rand war | 181 |
| kachel.jpg | 600×800 aus cover.jpg, nur fürs Raster | 324 |
| artwork.mp4 | Sunos video_cover_url = Bewegtbild, 6–10 s, quer | 84 |
| eigen.mp4 | eigenes Bewegtbild, ein Platz | 4 |
| eigen.jpg / eigen.mp3 | eigenes Titelbild / Tonfassung | 0 / 0 |
| eigen-effekt.json | Rezept des Studios | 4 |
Nicht lokal: Suno-Lyric-Video (video_url, 254, absichtlich nicht geladen), hook_preview_thumbnail_url (16).

**Zielbild (Studio-Kopf, Zeile „Grund“):**
```
Grund   ‹  Titelbild  1/4  ›   S  G  W        Würfeln  Grundzustand  Alle an  Einklappen
           ─────────────────
           Seiten:  Titelbild · Bewegtbild (Suno) · Eigenes Bewegtbild 1 · Eigenes Bewegtbild 2 · Eigenes Titelbild 1 …
```
- Der heutige Knopf „Cover“ wird zum Blätterer; S/G/W bleiben daneben. ←/→ blättern, solange das
  Studio offen ist (der globale Tastengriff schweigt dann — heute wechseln ←/→ im offenen Studio den Song
  und Escape schließt Studio UND Bühne zugleich).
- cover.jpg und titelbild.jpg sind EINE Seite „Titelbild“ (bei 143 Titeln identisch, artworkBild entscheidet).
  kachel.jpg ist keine Seite.
- Video als Grund läuft mit: Frame = Spielzeit modulo Videodauer (wie lebendZeit), stumm, verstecktes
  <video> je Maler. Der Maler ersetzt das sichtbare video.bewegt ganz (eine Bildschicht, nicht zwei).
  Querformat auf der 3:4-Kachel: beschnitten wie heute canvas.tbs-lebend (object-fit: cover), Bühne passt
  den Rahmen wie bisher an.

**Speicherung:**
- Rezept bekommt eine Hülle: `{ grund: {art:'titelbild'|'bewegtbild'|'bild'|'video'|'farbe', nr:1, wert:'schwarz'}, effekte:[…] }`.
  Altes reines Array gilt weiter als `grund: titelbild`. Damit wird auch S/G/W endlich gesichert (heute nur Modulzustand).
- Ohne Effekte zeigt das Haus die gewählte Quelle direkt (img/video, kein Maler) — so wird der Blätterer
  auch zur Auswahl „welches Bewegtbild spielt an der Kachel“.
- Fehlt die gesicherte Quelle später (Video gelöst): still zurück auf Titelbild, Studio zeigt es beim Öffnen an.
- Mehrere eigene Dateien: `eigen-2.mp4`, `eigen-3.mp4` … (eigen.mp4 bleibt Nr. 1, keine Umbenennung),
  ebenso `eigen-2.jpg`. Index meldet `videos:[1,2]`, `bilder:[1]`; PUT vergibt die nächste freie Nummer,
  DELETE `?was=video&nr=2`. Die Karte „Bewegtbild“ wird zur Liste mit „+ hinzufügen“. Behälter/Stick-Regex nachziehen.

**Bauschritte (jeder einzeln geprüft und eingecheckt):**
1. Modul: Hülle im Rezept + Grund-Blätterer + Video-Grund (Studio und Maler). Haus: Tastengriff schweigt bei offenem Studio.
2. Server: nummerierte eigene Dateien, Index, PUT/DELETE, Behälter-Regex; Karte „Bewegtbild“ als Liste.
3. Haus: ohne Effekte Quelle direkt zeigen; Rückfall bei fehlender Quelle.
4. Bühne im Standbildmodus auf artworkBild (heute fest cover.jpg — Doku und kacheln.js behaupten das Gegenteil). Eigener Commit.
5. Handbuch-Wörter: Lebendbild (oder „dynamisches Titelbild“) in WOERTER.md festlegen; „Kachel“ meint drei Dinge.

**Entscheidungen für Jörg:** (a) Seitenliste wie oben? (b) Video läuft mit (Empfehlung) oder festes Standbild zu einem Zeitpunkt?
(c) Nummerierung eigen-2.mp4 (Empfehlung) oder Ordner eigen/? (d) Schritt 4 mitnehmen?

**Nebenbefund sofort behoben (`2b4301a`):** die Hausfunktion `lebendAus(k)` rief sich selbst statt
`TitelbildStudio.lebendAus(k)` — Endlosrekursion bei jedem mouseout und in markieren(), seit dem Einbau.
Weitere Befunde, nicht angefasst: `bewegtAufraeumen()` ohne Aufrufer; titelbild.jpg fällt beim Server
nicht unter die „wandelbar“-Cache-Regel (nur der ?k=-Stempel schützt); CLI bin/eigen-artwork.js kennt
eigen.mp3/eigen-effekt.json nicht.

### Schritt 1 gebaut und im Labor abgenommen (Nachtschicht 11.09.2026) — Haus noch unberührt
Jörgs Go: „du baust die erste Phase, alles, bevor es ins Haus geht“. Gebaut in der Modulquelle
(Scratch `tbs-modul.js`, gespiegelt nach `.labor/titelbild-studio/`, untracked):
- **Grund-Zeile** `Grund ‹ Titelbild · 1/3 › S G W` (Knopf „Cover“ ersetzt). Seiten aus `seitenVon(id, song)`:
  Titelbild (Sunos, `sunoTitelbild` = titelbild.jpg/cover.jpg, ohne eigen.jpg-Vorrang) · Bewegtbild (Suno)
  bei `videoCoverUrl` · Eigenes Bewegtbild n aus `_eigenArt[id].video` bzw. künftig `.videos:[1,2]` (eigen.mp4,
  eigen-2.mp4 …) · Eigenes Titelbild n aus `.bild`/`.bilder`. ←/→ blättern nur im offenen Studio (Capture-Griff
  mit stopPropagation, ebenso Esc — das Haus muss nichts ändern); Auswahllisten geben nach der Wahl den Fokus ab.
- **Video als Grund**: stummes `<video>` außerhalb des DOM je Studio/Maler; `quelleSync`: mit Player-Uhr wird
  Drift > 0,2 s auf Spielzeit modulo Videodauer nachgesetzt (gemessen: ≤ 0,02 s), ohne Player-Uhr (Pause, anderer
  Titel) läuft es frei weiter (kein Sprung), unter Farbfläche S/G/W ruht es. Entladen bei Blättern, Schließen,
  lebendAus, Tick-Aufräumen; oeffnen() bricht ab, wenn zwischendurch geschlossen wurde.
- **Rezept-Hülle** `{grund:{art,nr,farbe?}, effekte:[…]}` — `farbe` ist Auflage auf der Seite (nicht `art:'farbe'`
  wie im Plan, damit S/G/W zusammen mit der Seite gesichert wird). Altes Array = Vorgabe-Seite. Vorgabe = was
  das Haus als Titelbild zeigt (eigen.jpg vor Sunos Bild, `grundVorgabe`). Fehlt die gesicherte Quelle: still
  zurück, Status „Quelle „…“ fehlt — Titelbild gezeigt“. Sichern ohne Effekte erlaubt („nur der Grund“).
- **Maler-Leinwand** deckt die Kachel scharf: `sk=max(kW·dpr/bw, kH·dpr/bh)`, lange Seite ≤ 960 px (vorher
  W=Kachelbreite, Querformat wurde 2,4× hochskaliert).
- Prüfung: Trockentests (Seitenliste beide Indexformen, rezeptLesen), Labor-Rauchtests in `labor-haus.html`
  (Haus-Attrappe mit Player, 12 Kacheln, Fetch-Ersatz im Speicher, Protokoll; Symlink `media -> library/songs`,
  nur lesen), Gegenlesen mit 5 Blickwinkeln + 2 Skeptikern je Befund (13 bestätigt, alle behoben außer dem
  Gestaltungspunkt unten).
- **Offen für Jörgs Blick:** Studio passt ein Querformat-Video ganz ein, Kachel/Bühne schneiden 3:4 (object-fit:
  cover) — soll das Studio den Kachelausschnitt anzeigen? Beschriftung „Eigenes Bewegtbild“ ohne Nummer, wenn es
  nur eines gibt. Vorgabe-Seite bei eigen.jpg = eigenes Bild (wie das Haus), nicht Sunos.
- **Nächste Schritte:** Schritt 1 ins Haus (einbau.py, Rauchtest mit Jörg), dann Schritt 2 (Server: eigen-2.mp4,
  Index `videos/bilder`, PUT nächste Nummer, DELETE `?was=video&nr=2`, Behälter-Regex; Karte „Bewegtbild“ als
  Liste), Schritt 3 (Haus zeigt Quelle ohne Effekte direkt), Schritt 4 (Bühne → artworkBild), Schritt 5 (WOERTER.md).
Labor starten: im Scratch-Ordner `python3 -m http.server 18811`, dann http://127.0.0.1:18811/labor-haus.html.

### Grundsatzentscheidung Quellen vs. Rezepte (Jörg, 11.09.2026 morgens) — ersetzt den Matrix-Gedanken
Vom Ziel her: Bühne und Kachel zeigen je Titel **das starre Bild** (genau eines: Titelbild = eigenes Bild,
sonst randlos, sonst Suno-Cover) **oder ein bewegtes Bild**. Bewegte Bilder je Titel: Sunos Bewegtbild,
angehängte Videos (mehrere, Tarjas Hooks), das Lebendbild (Quelle + Rezept; Quelle darf Titelbild oder Video sein).
Entschieden:
- **Ein Rezept je Titel**, es nennt seine Quelle (Bild oder Video erlaubt). Keine Matrix Quellen × Effekte.
- **Vorgabe ist eine Regel, kein Regler:** Rezept vorhanden → Lebendbild; sonst jüngstes angehängtes Video;
  sonst Sunos Bewegtbild; sonst starres Bild. Die **Kachel zeigt die Vorgabe**.
- **Blättern nur auf der Bühne** (flüchtig, durch starres Bild und alle bewegten) **und im Studio** (Wahl der
  Malquelle für das eine Rezept). „Alle bewegten spielen durch“ kommt nicht, bis es jemand vermisst.
- Mehrere angehängte Videos (eigen-2.mp4 …) sind der einzige neue Speicherplatz; Karte „Bewegtbild“ wird Liste.
- Studio-Wunsch nebenbei: **Effektkarte duplizieren** (⧉ im Kartenkopf, Kopie mit allen Werten direkt darunter),
  gebaut im Labor-Modul.
Bauschritte neu: (1) Modul ins Haus (Studio-Blätterer als Malquelle, Rezept-Hülle, Video-Grund, Duplizieren) ·
(2) Server: nummerierte eigene Videos, Index `videos`, PUT nächste Nummer, DELETE `?was=video&nr=`, Behälter-Regex;
Karte „Bewegtbild“ als Liste · (3) Haus: Vorgaberegel (jüngstes eigenes Video vor Sunos) + Bühnen-Blätterer ‹ ›
durch starres Bild und bewegte Bilder, flüchtig · (4) Bühne im Standbildmodus auf artworkBild · (5) WOERTER.md.
Lebendbild-Ablage auf der Kachel wie heute das Video (volle Höhe, mittig, ragt seitlich heraus), Bühne passt den
Rahmen an — „das Overlay hat immer das Format der Ursprungsdatei“ (Jörg).

### Zielbild Bühne, endgültig (Jörg, 11.09.2026) — ersetzt „Bühnen-Blätterer“ und „alle spielen durch“
Bewegtbild-Slots je Titel und ihre Priorität (die meiste Absicht gewinnt): (1) Quelle + Effekt (das eine Rezept;
Quelle darf starr oder bewegt sein, kein Effekt auf Effekt) · (2) hinzugefügte Videos, mehrere, jüngstes zuerst ·
(3) Sunos Bewegtbild · sonst Rückfall auf das starre Bild (kein Slot).
- Kachel: nur die Vorgabe. Studio: ‹ › nur als Wahl der Malquelle (aktiv, sobald der Titel mehr als das Titelbild hat).
- Bühne, Stellung „Bewegtbild“: die Vorgabe läuft endlos, nichts erscheint. **Maus im Bild / Tipp:** schmale
  Leiste unten im Bild (wie ein Videospieler, verschwindet 2 s nach der letzten Bewegung), nur wenn der Titel mehr
  als ein Bewegtbild hat: `‹ Eigenes Bewegtbild 2/3 ›` zum Blättern und Schalter **eines | alle**. „alle“ = im
  Kreis, Wechsel an Abschnittsgrenzen des Lieds, sonst alle acht Takte. Blättern von Hand setzt auf „eines“.
  Die Wahl gilt für die Bühnensitzung (über Titelwechsel), wird nicht gespeichert; beim nächsten Start Vorgabe.
Bauschritt 3 heißt damit: Vorgaberegel + Bühnenleiste (eines/alle/blättern).
- 11.09. vormittags, Labor: Pult zweigeteilt — Kasten **Quelle** (‹ Seite › S G W, „worauf das Rezept malt“) und
  Kasten **Effektkette** (Preset, Würfeln/Grundzustand/Alle an/Einklappen, Einhängen, Karten); **Rezept** als
  klebender Fuß mit Sichern/Lösen, Status und Hinweis „Rezept = Quelle + Effektkette“. Rezeptschlüssel heißt
  jetzt `quelle` (Code: `grund` = Malgrund; alte Laborrezepte mit `grund` werden noch gelesen). Dunst bewegt sich
  sichtbar (Drift + Wabern, Tempo-Vorgabe 0,5, bis 2). Karte duplizieren (⧉). Jörgs Wunschliste „Glas“ offen:
  Risse (auch wachsend), Beschlag/Dampf, Tropfen-Einschlag, Tropfen laufen herunter — als Entwürfe möglich
  (Leinwand für Risse/Tropfenbahnen, WebGL-Brechung wie bei Wellen für Glas und Tropfenlinsen).
- 11.09. mittags, Labor (Jörgs Durchsicht): Sichtbarkeit je Karte = Kreis / Kreis mit Kuller (Hausform der
  Solo-Kullerzeile, Haeckels ○/◉) statt Pille; Solo als Wort „solo“, damit kein zweiter Kreis. Werkzeugzeile der
  Effektkette in einer Zeile: Preset …, + Effekt …, ⚄ Würfeln, ↺ Grundzustand, ◉ Alle an, ⇅ Zu-/Aufklappen
  (Wörter im Tipp). Laute Presets entfernt (Alter Fernseher, Konzertlicht, Kaputtes Band, Nachtfahrt,
  Rave / Inferno) — „wir entwerfen sie selbst“; geblieben: Kaum da, Nur Atem, Schatten und Schlag, Traum (weich).
  Lehre: Jörg arbeitet live in der Labor-Scheibe (tab-25) — nicht mehr neu laden, Proben in eigenem Tab.

### Schritt 1 im Haus (11.09.2026, Jörg: „lass das Haus nicht länger warten“)
web/index.html per einbau.py vom Schnappschuss neu gespleißt (Diff nur CSS-Block und Modul). Enthalten: Quelle-
Blätterer im Studio, Video-Grund mit Player-Uhr, Rezept-Hülle `{quelle, effekte}` (Altbestand als Array bleibt lesbar,
vier Produktivrezepte geprüft), Karte duplizieren, Kreis-Schalter, Werkzeugzeile, leise Presets, Dunst-Bewegung,
Pult Quelle/Effektkette/Rezept. Gegenlesen des Einbaus (3 Blickwinkel, 2 Skeptiker je Befund, 12 bestätigt) traf
fast nur meine späte Ablage-Änderung „Kachel wie video.bewegt“ (zeigtVideo-Klassen, bewegtEinpassen, Rahmenwettlauf
auf der Bühne) — **gestrichen und vereinfacht:** das Lebendbild liegt wie ein Standbild ganz im Kasten
(`object-fit: contain`, Kachel und Bühne), nichts ragt heraus, nichts wird beschnitten; auf der Bühne verdeckt der
Maler img.motiv (cover.jpg), solange er malt, und rührt den Rahmen nicht an. Leinwandmaß = contain-Schärfe
(sk = min), lange Seite ≤ 960. Tasten im offenen Studio: ←/→ Seite, Esc schließen, ↑/↓ rollen das Pult (erreichen
das Haus nicht mehr); Leertaste und m gehen weiter an den Player. Server unverändert (JSON wird roh abgelegt).
Offen: Schritt 2 (eigen-2.mp4 …, Karte als Liste), 3 (Vorgaberegel + Bühnenleiste eines|alle|blättern),
4 (Bühne → artworkBild), 5 (WOERTER.md), Glas-Entwürfe.

### Schritt 2 im Haus (11.09.2026): mehrere eigene Videos je Titel
- Server: `eigen.mp4` = Nr. 1, dann `eigen-2.mp4`, `eigen-3.mp4` … (Nummer erst beim Schreiben vergeben = höchste + 1,
  eigener .teil-Name je Anfrage → zwei gleichzeitige Uploads bekommen verschiedene Nummern, im Sandkasten geprüft).
  Index meldet `videos:[…]`/`bilder:[…]` neben `video`/`bild` (Ja/Nein für den Altbestand), auch aus dem Behälter.
  PUT ohne `?nr` = dazulegen, `?nr=N` = ersetzen (Bilder schickt die Oberfläche mit `?nr=1`); DELETE `?was=video&nr=N`
  (ohne nr = 1; ohne was = alles). `eigen*` und `eigen-effekt.json` sind jetzt „wandelbar“ (no-cache + Last-Modified,
  304), weil eine Nummer nach Löschen der höchsten wiederkehren kann. Sandkasten: Kopie von server.js unter
  scratchpad/sandkasten mit zwei Attrappen-Titeln, Port 18899, nur eigene PID.
- Haus: `artworkVideo(id)` nimmt das jüngste eigene Video (höchste Nummer) — die Vorgaberegel für Videos steht
  damit; Rezept vor Video galt schon (hatLebendbild). Karte „Bewegtbild“ = Liste („spielt · Nr. n“, je „entfernen“,
  „+ weiteres Video hierher ziehen“); Upload-Sperre je Feld, solange einer läuft.
- bin/eigen-artwork.js (CLI) und bin/export.js (.teil-Filter) nachgezogen; CLI nicht im Lauf getestet (braucht Katalog).
- Gegenlesen (2 Blickwinkel, 2 Skeptiker): 7 bestätigt (Race, Nummern-Wiederkehr + Cache, CLI ×3, Export .teil),
  alle behoben. Offen: Schritt 3 Bühnenleiste (eines | alle | blättern bei Maus im Bild), 4 (Bühne → artworkBild),
  5 (WOERTER.md), Glas-Entwürfe.

### Schritt 3 + 4 im Haus (11.09.2026): Bühne
- **Bewegtbilder je Titel** (`bewegtbilder(s)`): Lebendbild (Rezept) · eigene Videos, jüngstes zuerst · Sunos Bewegtbild.
  Stellung „Bewegtbild“: die Vorgabe (erstes) läuft endlos, nichts erscheint. **Leiste `#bbewegt`** erscheint bei Maus im Bild
  (2 s, Tipp 4 s; bleibt, solange der Zeiger darauf ruht), nur bei ≥ 2 Bewegtbildern: `‹ Name k/n ›` und Schalter
  **eines | alle**. „alle“ wechselt an den Abschnittsgrenzen (`abschnitte.peak_times`, alle 324 Titel; Grenzen < 1 s
  zählen nicht; sonst jeder achte Taktanfang), geprüft in `el.ontimeupdate` (`bewegtWechselPruefen`), still bei zu-
  gemachter Bühne oder verborgenem Kasten (Titel-Analyse). Blättern von Hand setzt auf „eines“. Modus gilt für die
  Sitzung; Titelwechsel setzt die Handwahl zurück, Stand = laufende Zeit. Der Modusschalter zeichnet nur die Leiste neu.
  Im ungeteilten Schirm sitzt die Leiste bei 19 % Höhe — darunter fährt die Pult-Schublade aus (untere 16 %).
- **Standbild ist still** (Definition Jörg) — kein Lebendbild mehr in der Stellung „Standbild“; wer es sehen will, stellt
  „Bewegtbild“. Und das Standbild ist jetzt **artworkBild** (eigenes, randloses, sonst Sunos) statt fest cover.jpg = Schritt 4.
- Gegenlesen (2 Blickwinkel): 11 bestätigt (Leiste unter der Pult-Schublade, Ausblenden unter ruhender Maus, Stand −1,
  Neubau beim Modusklick, Videofehler nimmt die Leiste mit, Wache bei Titel-Analyse), alle behoben. Nicht am Fenster
  getestet (kein zweites App-Fenster) — Jörg prüft. Offen: Schritt 5 (WOERTER.md: Lebendbild oder „dynamisches
  Titelbild“, Kachel = drei Dinge), Glas-Entwürfe, bin/eigen-artwork.js im Lauf prüfen.

### Glas (11.09.2026, Jörg: „mach mal die Glasscheibeneffekte“) — im Haus
Gruppe **Glas** im Studio, alle Leinwand-Maler (`art:'mal'`, Verrechnung „Über“): **Risse im Glas** (verzweigte Linien
von Einschlägen, Licht- und Schattenkante, Wachsen stehend / mit der Zeit / Ast für Ast im Takt, Muster als Saat),
**Beschlag** (Bild weichgezeichnet unter hellem Schleier, vom Rand her und in Flecken, stehend oder zuwachsend),
**Tropfen treffen die Scheibe** (auf einen Teil der Schläge Ring + bleibende Linse), **Tropfen laufen herunter**
(Linsen mit Spur, Stöße im Takt). Linse = Kopie der Malfläche, umgekehrt und 1,25× vergrößert im Kreis, dazu
Lichtkante/Schattenkante/Glanzpunkt (`linse()`, `glasKopie()`). Labor-Rauchtest: alle vier zeichnen und bewegen sich;
Sichtprobe auf „Die Braut von Corinth“ gut. Eingespleißt per einbau2.py.
Namensfrage offen (Jörg brainstormt: Effekt-Bild, KlangTresor-Bild, Musik-Bild, Rhythmus-Bild, Beat-Bild,
KlangTresor-Visual; mein Vorschlag Taktbild, zweiter Platz Lebendbild) — erst auf sein Wort umbenennen.

### Umbenennung (11.09.2026, Jörg: „okay — Effektclip-Studio, ziehe es durch“)
Das gemalte Ding heißt **Effektclip** (Duden-Clip, zusammengeschrieben), das Werkzeug **Effektclip-Studio**. Durchgezogen
in Modul (`var EffektclipStudio`, `clipAn/clipAus/clipNeu/clipZeit/clipTick`, `clips`, Leinwandklasse `tbs-clip`),
Haus (`hatEffektclip`, Karte „Effektclip-Studio“ / „Effektclip liegt beim Titel“, Bühnenliste `k:'clip'`, Marker
„Effektclip-Studio (tbs.css|tbs-modul.js)“), Server-Kommentar, Labor-Attrappe, einbau*.py, WOERTER.md (vier Zeilen:
Effektclip, Rezept, Effektclip-Studio, Bewegtbild). Geblieben: das Präfix `tbs-` für Klassen/IDs (Namensraum, kein
Fachwort) und der Dateiname `eigen-effekt.json`. Ältere Abschnitte dieser Übergabe sagen noch „Lebendbild“ — historisch.
- Effektclip abgeschlossen (11.09.2026): Schritte 1–5 im Haus (`652df25`, `e015dbb`, `87b46a8`, `598e31f`, `c5e919c`), CLI
  `bin/eigen-artwork.js --liste` läuft mit Nummern (4 Titel). Offen nur noch: das Wort „Kachel“ (Rasterfeld, kachel.jpg,
  Zahlenfelder im Profil — Jörgs Entscheidung) und Jörgs Prüfung von Karte/Bühne am eigenen Fenster.

### Bedienung des Effektclip-Studios (11.09.2026, Jörgs Durchgang) — im Haus
Einstieg still: Standbild, leere Kette mit Erklärtext und „Beispiel laden: Helligkeit schlägt“ (neuer, einfachster Puls
`helligkeit`); Grundzustand und Zufall entfernt. **Quelle** als Vorschaubilder mit Rahmen und Unterschrift (Titelbild
vorgewählt, Bewegtbilder mit ▶), nach einem Strich drei Testbilder, die nie gesichert werden: Testbild aus Code
(Graustufen: Kugel, Grautreppe, Verlauf, Linienfächer, kleiner Farbabschnitt, Wasserzeichen; `testbildBauen()`),
Testporträt (Graustufen) und Testporträt (Farbe) aus `web/testbild/` (KI-erzeugt aus Jörgs Comic, HERKUNFT.md).
S/G/W und die Tasten s/w/g sind weg. **Effektkette:** vorne „+ Effekt“, dann „Presets“; darüber die Kopfzeile mit
denselben Spalten wie die Karten (an/aus für alle, Effekt, Nr., rotes × für alle mit Rückfrage, alle zuklappen).
Kartenkopf als Tabellenzeile: an | solo | Symbol | Effekt | Nr. (nur bei Mehrfachen) | Kopie | × (klein, rot, mit
Abstand) | hoch | runter | auf/zu. **Akkordeon:** nur eine Karte offen (`offenId`), neue/kopierte öffnen sich und
rollen ins Blickfeld. Regler: eigene zuerst, dann hinter der Linie Antrieb, Atem, Invertieren, Verrechnung, Stärke.

### Vorbereitung + Nachbesserungen (11.09.2026) — im Haus
- **Vorbereitung** (Jörg: „statischer Effektlayer … Gradation, Temperatur, Sättigung, all dieses 0-8-15 Zeug“, nach
  Apples „Farbe anpassen“): eigener Kasten zwischen Quelle und Effektkette, zugeklappt mit Stand („neutral“ / „n
  Änderungen“). Inhalt: Histogramm + Gradation (Haeckel-Widget, Kanäle V/R/G/B, Gamma/Sigmoidal, Tonwert, Auto-
  Niveaus 0,5/99,5 %), Zustands-Regler Belichtung, Kontrast, Lichter, Schatten, Sättigung, Temperatur, Farbton, dazu
  Sepia, Schärfe, „Alle zurücksetzen“. Technik: EIN Filter aufs Grundbild je Frame nach `ovb` (feColorMatrix für
  Temperatur/Farbton, feComponentTransfer = Kurve je Kanal inkl. Lichter/Schatten, feConvolveMatrix für Schärfe, dazu
  CSS brightness/contrast/saturate/sepia); die Effekte arbeiten auf `ovb`. Im Rezept als `vorbereitung` (nur wenn nicht
  neutral), Maler auf Kachel/Bühne rechnen es mit (`VORB` im Bündel). `gradZeichnen()` teilt sich das Kurvenbild mit
  „Kontrast schlägt“.
- Beschriftung unter den Vorschaubildern (Jörg, Nachtrag: nur die gewählte Quelle): linkestes linksbündig, letztes rechtsbündig, mittlere unter der
  Bildachse, weichen sie aus, an die Bildkante; höchstens 60 px breit, brechen um. Eine Lücke mit Strich trennt echte
  Quellen von den drei Testbildern.
- Gegenlesen des Bedienungs-Umbaus (9 bestätigt, behoben): Farbfläche S/G/W restlos entfernt (alte `quelle.farbe`
  wird ignoriert), Pult rollt nur noch, wenn eine andere Karte aufgeht, Kopfzeilen-Punkt folgt dem Kartenpunkt, totes
  CSS gelöscht, Kopfzeilen-× rot und rund, Spalten enger, Effektname darf umbrechen und steht voll im Tipp.
- 11.09. abends: **Licht ist Beleuchtung** — Vorgabe „Farbig abwedeln“ (color-dodge) für Scheinwerfer, Laser,
  Lichtstrahlen, Kaustik, Farbschleier, Stroboskop, Sicherung, Bloom; Feuer, Flammen, Partikel bleiben Screen (Selbstleuchter, Teilchen); Schatten „Farbig
  nachbelichten“; Nebel/Dunst bleiben Screen. Hinweis an den vier Lichteffekten: sichtbare Strahlen brauchen
  Theaternebel DAVOR in der Kette (Kette wird von oben nach unten gemalt). Preset „Licht im Nebel“. Testbild und
  Studiofeld tiefschwarz. Verrechnungsnamen wie in der Bildbearbeitung: Farbig abwedeln / Farbig nachbelichten.
  **Fehler behoben:** ein gespeicherter Effekt ohne (später dazugekommene) Parameter warf im Maler und hielt den
  ganzen Frame an — Effekte aus der Ablage liegen jetzt auf den Vorgaben ihres Typs (`effektAusRezept`), und ein
  werfender Effekt wird einmal gemeldet und ausgelassen statt den Frame zu stoppen. Messung: Mal-Effekte wirken
  aufeinander (zwei Vollflächen getauscht: völlig anderes Bild); ein dünner Strahl zählt im Mittelwert nur kaum.

### Lichtmischpult (11.09.2026 abends, Jörg: „bau mal bitte ein ganzes Lichtmischpult“) — im Haus
Ein **Antrieb** (Modulator, LFO) für alle Lichter: Scheinwerfer, Schatten, Laser, Lichtstrahlen, Feuer, Flammen,
Kaustik, Bloom, Stroboskop. Block am Ende jeder Karte (Bekanntes am selben Platz): **Antrieb** stetig | im Takt |
auf der Eins | zufällige Schläge | Frequenz · **Muster** als Kurvenbilder (Rampe auf dann aus · An dann Rampe ab ·
Aus mit An-Spitzen · An mit Aus-Spitzen · Rechteck · Sinus · Zufall je Periode) · Vorschau über zwei Perioden mit
laufendem Strich · Teiler (jeder/2./4./8. Schlag) bzw. pro Sekunde (0,5–30) · Anteil (bei Zufall) · Tiefe · Breite
(Spitzen/Rechteck) · Abklingen (Rampe ab) · Zeitversatz · invers. `antriebWert(e,t)` rechnet den Pegel 0..1 rein aus der
Zeit (Schläge aus `DATA.schlaege`, Taktanfang = Zählzeit 1), `lmSchub` für Shader-Schübe. Alte Ablagen mit `takt`
(und `frequenz` beim Stroboskop) werden beim Laden übersetzt (`effektAusRezept`); die Schalter sind aus den
Registern entfernt, bei den Störungen (Rauschen, Bildlauf, Verwackeln, Sicherung) bleibt `takt`.
Gemessen im Labor: Rampe ab hellt auf dem Schlag, An-mit-Aus-Spitzen dunkelt auf dem Schlag, Rechteck 4 Hz wechselt.
**Ideen von Jörg dazu (nicht gebaut):** je Farbkanal R/G/B eigene Wellen, Phase/Gegenphase zwischen Scheinwerfern,
ein Effekt als Auslöser für einen anderen (Modulationsmatrix wie am Synthesizer), der KlangTresor als Ansteuerung
für echte Lichtsteuerung (DMX/Art-Net) — „Möglichkeiten ohne Ende“.
- **Lichtsequenzer** (Jörg: „als wenn man eine Drum-Machine programmiert“): Muster „Sequenz“ im Antrieb — die Periode
  (Takt bei „auf der Eins“, sonst Schlag oder Sekunde) in 4/8/16/32 Schritte, jeder Schritt eine Höhe = Lichtstärke,
  in der Vorschau mit der Maus gemalt (Balken, Zählzeiten als Linien, laufender Strich). Vorlagen Doppelschlag,
  Wechsel, Anlauf, Ausklang, Offbeat; Schalter „weich“ interpoliert zwischen den Schritten. Schrittfolge
  `lmSchritte` im Rezept, Schrittzahl-Wechsel tastet die Form neu ab. Labor: Doppelschlag hell → schwächer → aus.

### Raum-Block für Scheinwerfer und Schatten (11.09.2026, Jörg: „definiere … das spatiale Verhalten der Lichtquelle“)
Licht = Zeit (Antrieb) × Raum × Farbe × Verrechnung. Der **Raum**-Block sitzt über dem Antrieb: **Ursprung** (außerhalb
auf einem Winkel um das Bild, oder im Bild x/y) · **Ziel** x/y · **Bewegung** fest, wandernd, Bogen, Schwenk (um den
Ursprung), Fahrt (Moving Head: fährt mit Anlauf und Bremsen zu zufälligen Zielen; Tempo, Weite, Trägheit), Schritt
(springt auf den Schlag, Taktquelle des Antriebs) · **Form** Kreis, Ellipse (schräger Einfall: gestreckt vom Ursprung
weg, nahes Ende heller = Gefälle), Kegel von außen (schmal und hell am Gerät, breit und schwächer am Fleck, Flanken
weich) · Größe, **Randschärfe** (Plateau mit Kante statt Gauß-Wolke), **Hotspot** · **Blende** (Gobo): Punkte,
Streifen, Gitter, Wolken, Sprenkel, Iris, Torblende, mit Größe, Drehung, Weichheit (Maske per destination-in auf
einer Zwischenleinwand) · **Profilgrafik**: links der Querschnitt des Flecks, rechts das Bild im Kleinen mit Ursprung,
live. Alte Ablagen (form/groesse/weichheit/fuehrung/tempo/bogen/dpx/dpy/schwenk) werden beim Laden übersetzt.
Offen (Schritt 2 des Raums): Laser, Lichtstrahlen, Stroboskop und Sicherung an den Raum-Block hängen (Ursprung,
Bewegung, Blende als Zerhacker/Muster).

## Tiefen-Check aller Effekte (Nachtschicht 11.09.2026) — Befunde, noch nichts geändert
Jörg: „mach jetzt mal den großen Tiefen-Check, ob alle Effekte mit ihren Parametern tatsächlich das machen, was sie
sollen. Auch ist mir oft nicht klar, was Stärke macht, wenn es noch parallele Regler wie Wucht, Dichte usw. gibt."
**Verfahren.** (1) Messreihe im Labor (`labor-haus.html`, Quelle Testporträt Farbe, Uhr steht auf Schlag 40 + 0,06 s):
jeder Effekt einmal an/aus, jeder Regler Minimum → Mitte → Maximum, jede Auswahl, jeder Schalter, jede Farbe; Maß ist
die mittlere Pixelabweichung (0..255) auf 64×86. (2) Zeitscan 8 s in 80-ms-Schritten für Ereignis-Effekte (Sicherung,
Blöcke, Einschlag, Rauschen, Laser, Partikel, Risse, Tropfen). (3) Fünf Leser, Register gegen Maler/Shader, je Befund
ein Skeptiker: 66 Befunde, 61 bestätigt. Rohdaten der Messreihe: `window.__sweep` im Labor-Tab, Lesebefunde in
`scratchpad/tiefencheck-statisch.md` (Sitzungs-Scratchpad).

### Kaputt — tut nicht, was Beschriftung oder Beschreibung sagen
1. **Sicherungswackeln ist unsichtbar.** Die Sammelzuweisung „Farbig abwedeln" (Z. 186) trifft auch die Sicherung;
   Schwarz abgewedelt ändert nichts. Messung: 0 in allen Zeitscans; mit Multiplizieren/Nachbelichten 68. → Vorgabe
   „Farbig nachbelichten" wie beim Schatten.
2. **Kaustik brennt das Bild aus.** Der Shader liefert Bild + Lichtnetz, danach wird dieses Vollbild mit Abwedeln über
   das Bild gelegt — das Bild wedelt sich selbst ab (Grau 0,5 → 1). Messung: an/aus 39, Stärke min→max 65. → Shader
   liefert nur das Licht auf Schwarz.
3. **Stroboskop:** Antrieb-Tiefe ohne Wirkung (`lmSchub` rechnet sie wieder heraus; gilt auch für Flammen-Schub),
   Tiefe 0 = dauernder Dunkelschleier, Antrieb „stetig" = Dauerschleier statt „kein Flackern". Messung: Tiefe 0→0,5 = 64,
   0,5→1 = 0.
4. **Vorlagen „Kaum da" und „Schatten und Schlag"** tragen alte Schlüssel (groesse, weichheit, tempo, fuehrung,
   takt:0); `E()` übersetzt sie nicht (nur `effektAusRezept` tut das). Die Vorlagen-Lichter laufen mit Raum-Vorgaben
   und pulsen im Takt, obwohl takt:0 gemeint war.
5. **Tropfen / Einschlag:** der Linsenkörper wird in `linse()` mit Alpha 1 gemalt, Stärke greift nur an Glanz und
   Kante. Messung Stärke min→max: Einschlag 0,06, Tropfen 0,45. Einschlag springt am Ende von „Bleibt" weg statt
   sich zu verlieren.
6. **Linse:** Wölbung verkehrt herum (negativ = Kissen, positiv = Tonne; die Beschreibung sagt das Gegenteil); bei −1
   falten sich die Ecken auf die Bildmitte. Stärke < 1 gibt ein Doppelbild, keine kleinere Wölbung. Wellen ebenso:
   Vorgabe 0,8 = 20 % stehendes Geisterbild.
7. **Grund-Pulse überschreiben sich.** Jeder Puls (Schärfe, Kontrast, Sättigung, Helligkeit, Farbton) malt eine
   gefilterte Kopie des Grundbilds, nicht des bisherigen Ergebnisses; auf dem Schlag bei Deckung 1 löscht Helligkeit den
   Sättigungs-/Kontrast-Puls. Feste Reihenfolge unabhängig von der Kette; eine zweite Schärfe-Instanz ist stumm.
8. **Kontrast schlägt:** Vorgabe Tonwert 0,55 ergibt die Logit-Kurve — auf dem Schlag *weniger* Mittenkontrast. Erst
   negativer Tonwert gibt die S-Kurve (Vorlage „Nur Atem" hat −1).
9. **Scheinwerfer/Schatten, Raum-Block:** Trägheit bei „Fahrt" verkehrt (1 = Sprung, 0 = Gleiten), bei „Schritt"
   richtig; Hotspot bei Stärke ≥ 1 unsichtbar (Alpha gekappt; Messung 0,33); Ursprung/Winkel ohne Wirkung bei Kreis
   ohne Schwenk/Blende (Messung 0, nur der Punkt in der Vorschau wandert); Blende-Weich bei „Wolken" tot; Blende-Größe
   bei Iris/Tor wirkt nur noch als Weichheit; Torblende liest die Streckung, die nur bei Ellipse einstellbar ist; Iris
   kappt die Ellipse; Blende-Größe am Minimum erzeugt >100 000 Kreise je Bild.
10. **Spiegelung:** Horizont < 0,5 lässt den unteren Rest ungespiegelt mit harter Naht.
11. **Beschlag:** „Vom Rand her" 0 gibt trotzdem einen Radialverlauf mit klarer Mitte; Dichte 0 schaltet auch die
    Weichzeichnung ab (Milchglas ohne Schleier nicht einstellbar).
12. **Glitch-Blöcke:** „Farbversatz" ist ein heller Doppelblock (screen), keine Kanaltrennung.
13. **Rauschausfall:** Körnung praktisch unsichtbar (≈330 Körner à 1,6 px auf 1 Mpx; Messung max 0,49); Beschreibung
    „nur auf der Eins" stimmt nicht, es ist jeder Schlag.
14. **Verwackeln:** kein Ganzbild-Kick, Takt skaliert nur das Band-Warble; das Zittern geht mit bp².
15. **Flammen (GL):** Antrieb wirkt doppelt — Höhe im Shader und Deckung in der Kette → zwischen den Schlägen halb
    durchsichtig. **Feuer:** „lodert im Takt höher" — es sinkt nur zwischen den Schlägen, nie über „Höhe".
16. **Partikel:** Asche, Blasen, Staub, Funken bekommen die Stärke doppelt (Farb-Alpha × globalAlpha = a²).
17. **Laufstreifen:** nur helle Bänder; „dunkle" gibt es nur über die Verrechnung, kein Regler.
18. **Laser:** bei Vorgabe kaum zu sehen (3 px breit, Alpha 0,7 → 0 über 1,1 Bildlängen, der helle Anfang liegt
    außerhalb des Bildes): in allen Verrechnungen ≤ 1,3 mittlere Abweichung, Maximalpixel 109. Tempo ist keine
    Sekundenperiode (2π·Tempo); Schwenk wirkt versteckt auch bei „wandernd".
19. **Antrieb:** Zeitversatz beim Muster „Zufall" tot; „An-Spitzen" und „Rechteck" sind derselbe Code; übersprungene
    Schläge (Quelle Zufall) nehmen den Kurven-Endwert — bei „Rampe auf" also *an* statt aus.
20. Kleineres: Kippen-Nachzoom bei 16:9 zu knapp (Ecken frei); Nachzieh-Nachhall wird intern quadriert; Filmkorn
    hellt die Mitteltöne auf (Kornmittel 155 statt 128 bei Overlay); Lichtstrahlen-„Breite" ist der halbe Winkel;
    Farbton-Invert nur Vorzeichen des Winkels; Farbkanal-Puls ohne „nur Eins", Invert springt bei Doppelschlägen
    negativ; Dunst Lage 0 ist nicht „überall gleich"; Stroboskop-Verrechnung wirkt nur beim Aufblitzen; Stärke
    100–150 % bei sieben Typen tot (`Math.min(1,…)`).

### Stärke gegen Wucht, Dichte, Tiefe, Schlag — was der Code heute tut
- **Reines Produkt mit Stärke, also Doppelung:** Schlag (Schärfe, Kontrast, Sättigung, Farbton); Tiefe (Stroboskop,
  Sicherung); Dichte (Theaternebel — dazu 0,7..1 tot; Dunst; Beschlag: Dichte steuert Maske *und* Schleier, Stärke
  legt dieselbe Ebene noch einmal auf); Wucht (Helligkeit: Ergebnis 1 + Stärke·1,2·Wucht; Zoom); Neigung (Kippen);
  Fahrt: Stärke skaliert Ausschnitt-Zoom und Weite nochmals, ungekappt bis 1,5.
- **Verschieden, aber verwandt:** Bloom Glut (Helligkeit der Glühschicht) vs Stärke (Deckung); Nachzieh Nachhall
  (Abklingzeit) vs Stärke (Mischung).
- **Keine Doppelung** (Stärke = Deckung, Typregler formen): Scheinwerfer, Schatten, Laser, Lichtstrahlen,
  Farbschleier, Feuer, Laufstreifen, Rauschausfall, Scanlines, Filmkorn, Risse, Partikel.
- **Verzerrer (post/GL):** Wellen, Linse, Bildlauf, Verwackeln, Blöcke, Spiegel — Stärke ist die Überblendung
  verzerrt/unverzerrt: unter 1 ein Geisterbild, nicht „weniger Effekt".
**Vorschlag Regel (wartet auf Jörg):** Stärke ist immer die Deckkraft — wie stark das fertige Ergebnis des Effekts ins
Bild gemischt wird, zuletzt angewandt, 0..100 %. Alle anderen Regler formen den Effekt (wie groß, wie viele, wie
schnell, wie weit, wie hell). Kein zweiter Regler darf nur Deckkraft sein. Folgen: Schlag ×4, Tiefe ×2, Dichte
(Nebel, Dunst, Beschlag) entfallen, Stärke übernimmt (alte Ablagen: Stärke·alt); Geometrie-Pulse (Zoom, Kippen, Fahrt)
und reine Verzerrer (Wellen, Linse, Bildlauf, Verwackeln, Blöcke) haben keine Deckkraft → dort verschwindet der
Stärke-Regler, die Amplitude ist der Regler; Spiegel behält Stärke (durchsichtiges Wasser); 150 % entfällt.

### Korrigiert und konsolidiert (10.09.2026, Jörg: „korrigiere die Fehler und konsolidiere die Regeln")
Alle 20 Punkte oben sind im Modul behoben (`scratchpad/patch-tiefencheck.py`, 84 Ersetzungen; Sicherung: Diff
`tiefencheck.diff`), dazu die **Stärke-Regel** wie vorgeschlagen — jetzt im Kopfkommentar des Moduls, im Handbuch
(WOERTER.md, Zeile „die Stärke") und im Stärke-Tooltip jeder Karte. Was sich für den Nutzer ändert:
- Stärke läuft 0–100 %, die 150 % sind weg. Schlag (Schärfe, Kontrast, Sättigung, Farbton), Tiefe (Stroboskop,
  Sicherung) und Dichte (Theaternebel, Dunst, Beschlag) sind weg; alte Ablagen werden beim Laden in die Stärke
  gefaltet (`effektAusRezept`, auch die Vorlagen laufen jetzt über diesen Weg → ihre alten Schlüssel werden übersetzt).
- Fahrt, Zoom, Kippen, Wellen, Linse, Bildlauf, Verwackeln, Blöcke haben keinen Stärke-Regler mehr (`ohneStaerke`);
  eine alte Stärke ≠ 1 wandert in Ausschnitt/Weite, Wucht bzw. Neigung. Verrechnung gibt es nur noch bei Malern,
  Bloom und Kaustik (`verrFrei`); andere post/gl-Effekte werden auf „Über" gesetzt.
- Sicherung: Vorgabe „Farbig nachbelichten", sichtbar (Messung 41 statt 0). Kaustik-Shader liefert nur das Licht
  (an/aus 16 statt 39, Mittel +16). Stroboskop: Antrieb-Tiefe wirkt (0 → 0, 0,5 → 22, 1 → 45), „stetig" = nichts.
  Laser: Doppelstrich (Saum + Kern), Ansatz bleibt voll bis 60 % der Länge, Tempo = Sekunden je Schwenk, Schwenk in
  beiden Modi, Vorgaben Fächer 0,35 und Breite 0,12 (mit Fächer 1 lief die Hälfte am Bild vorbei). Tropfen/Einschlag:
  Linsenkörper folgt der Stärke (0 → 0). Linse: Vorzeichen gedreht, Faltung gekappt (`max(0.15,…)`). Grund-Pulse laufen
  in Kettenreihenfolge auf dem bisherigen Ergebnis (Momentaufnahme nach `okc`), jeder Typ mehrfach möglich (Messung:
  Sättigung + Helligkeit ≠ Helligkeit allein, 29). Kontrast-Vorgabe Tonwert −0,55 (Streuung 63,5 → 66,8 auf dem
  Schlag). Raum: Trägheit einheitlich, Hotspot hellt die Farbe auf (`fleckStop`), Ursprung-Zeile nur wenn er wirkt,
  Blende: Reichweite auf den Fleck begrenzt (Zelle ≥ R/40), Wolken mit Weichheit, Iris folgt der Ellipse, Tor ohne
  verborgene Streckung, Blende-Größe bei Iris/Tor ausgeblendet, Minimum 0,05. Spiegel ohne Naht. Beschlag: Rand 0 =
  gleichmäßig. Glitch-Blöcke: echte Rot/Cyan-Trennung. Rauschkörnung ×11. Verwackeln: Ganzbild-Kick, Zittern einfach.
  Flammen: Antrieb nur auf die Höhe (`lmNurSchub`). Feuer: auf dem Schlag bis 1,5× so hoch. Partikel-Alpha einfach.
  Laufstreifen: Bänder hell/dunkel/abwechselnd. Antrieb: Spitzen halb so breit wie das Rechteck, übersprungene
  Schläge ruhen aus, Versatz bei „Zufall" ausgeblendet; `lmSchub` behält die Tiefe. Kippen-Nachzoom nach
  Seitenverhältnis. Nachzieh mit Alpha 1. Filmkorn um 128. Lichtstrahlen-Breite = ganzer Winkel. Farbkanal-Puls mit
  „nur die Eins", Invert ohne Negativsprung. Dunst Lage 0 = überall gleich.
- Nebenbefund beim Nachmessen, ebenfalls behoben: die Auswahlen des Raum-/Antrieb-Blocks (Blende, Form, Bewegung,
  Antrieb) zeichneten die Karte nicht neu, ihre abhängigen Regler erschienen erst nach Zu-/Aufklappen.
Verfahren: Labor-Tab neu geladen, gezielte Proben je Korrektur (`__p1`, `__p2`), Kachel-Maler mit fünf Effekten
(Bewegung zwischen zwei Zeitpunkten 26,8), volle Messreihe erneut, Gegenleser über den Diff.
Gegenleser über den Diff (25 Agenten, 13 von 21 Befunden bestätigt), alle behoben (`patch-tiefencheck2.py`): Grund-Pulse
ohne Verrechnung (fest „Über", auch beim Laden), Schärfe nach der Stärke-Regel (weiche Ebene = Ergebnis, Stärke 0 =
unverändert, auf dem Schlag scharf; invertiert umgekehrt), alte Sicherungs-Ablagen von „abwedeln" auf „nachbelichten",
Ablagen tragen jetzt `fassung:2` — ältere gelten als alt und Farbton-„invert" wird dort in einen negativen Winkel
übersetzt; Laufstreifen „abwechselnd" ohne Kippen am Umlauf; Linsenkante/Glanz ohne a²; Linse: Kissen als Division
(monoton, keine Faltung); Verwackeln: Warble immer, nur der Kick am Schlag; Spiegel: unter dem doppelten Horizont die
oberste Zeile gestreckt; Iris auf dem Fleck, nicht auf der Blende-Drehung; Vorschau des Schattens mit sichtbarem
Hotspot. Nachgemessen im Labor: altes Rezept (Fassung 1) lädt gefaltet (Sicherung 0,8·0,5 → 0,4 nachbelichten,
Kontrast 0,5, Nebel 0,3, Fahrt Ausschnitt 0,9/Weite 0,12, Farbton −40°/invert aus), Schärfe Stärke 0 → 0, Streifen-Umlauf
0,84. Haus gesplict (`einbau2.py`), Parse ok, Spiegel `.labor/effektclip-studio/`.
**Nächste Runde (Jörg):** „dann führen wir die Diskussion von Scheinwerfer (spatial) und (temporalen) Lichtpatterns auch
für andere menschengemachte Elemente, wie z. B. Laserstrahlen, Konfettikanonen, halbdurchsichtige Vorhänge und all so ein
Zeug. Wir checken auch die vorhandenen Effekte, ob da durch coole Parametrisierungen noch mehr rauszuholen ist" — erst
Diskussion, dann bauen.

## Nebel wird ein Medium (10.09.2026, Caspar_D: „gut, zeig her")
Vorausgegangen ist eine Nebeldiskussion. Jörgs Frage war, ob es den Leinwand-Theaternebel neben dem
Shader-Dunst überhaupt noch braucht. Antwort: nein. Der eigentliche Fund dabei war ein anderer —
**unser Nebel leuchtete selbst, echter Nebel wird beleuchtet.**

**Das Medium.** Vor der Kette malen alle aktiven Leuchten (Registry-Merkmal `leuchtet`: Scheinwerfer,
Laser, Lichtstrahlen, Feuer, Stroboskop) ihre Abstrahlung ein zweites Mal additiv auf Schwarz in den
Licht-Puffer `olicht` (Modulschalter `LICHTMAL` zwingt dabei „lighter"). Der Nebel-Shader liest ihn
als zweite Textur und rechnet `mische(Bild, Farbe·(Grundlicht + Licht·Streuung), Dichte)`. Damit ist
die alte Krücke weg, den Nebel vor das Licht hängen zu müssen: die Reihenfolge ist für die
Sichtbarkeit des Strahls gleichgültig. Gemessen: im Strahl 88,5 heller als ohne Leuchte, der Regler
„Im Licht" skaliert 21 / 55 / 88 / 143 über seinen Weg, außerhalb des Strahls 6,8.

**Ein Nebel, drei Sorten.** `dunst` (fast gleichmäßig, macht Strahlen sichtbar), `schwaden` (Ballen
mit Rand über eine Schwelle), `boden` (Schicht mit kräuselnder Oberkante, sinkt). Dazu gemeinsam:
Auftrieb, Wind, Absaugung (Ort und Sog), Lage, Dicke, Schichtkante, Körnung, Turbulenz, Wabern,
Ohne Licht, Im Licht. Stärke ist die Dichte. Der Effekt `dunst` ist entfallen, `nebel` ist jetzt
art `gl`; ohne WebGL malt `nebelLeinwand()` still als Rückfall (dann ohne Lichtaufnahme, gemessen 17,6).

**Kettenreihenfolge.** `zeichneFrame` läuft die Kette jetzt in ihrer Reihenfolge durch: Maler malen
auf die laufende Leinwand, Nachbearbeitung und Shader tauschen sie gegen ihr Ergebnis. `postKette`
ist gelöscht. Vorher sanken post und gl immer ans Ende, die Oberfläche versprach etwas anderes.
Gemessen: Laufstreifen und Linse getauscht ergeben 42,6 Unterschied.

**Alte Ablagen.** `nebelAusAlt` übersetzt: `dunst` → Sorte Dunst (Lage und Dicke umgerechnet),
Leinwand-Nebel → Sorte Schwaden (Größe → Körnung, Sekundentempo → Wabern), uralter Nebel mit
`dichte` als Schwadenzahl ebenso; die Dichte wird je Herkunft in die Stärke gefaltet, tote Schlüssel
werden entfernt. Im Labor mit einer Fassung-1-Ablage geprüft.

**Gegenlesen (21 Agenten, 3 von 21 bestätigt), alles behoben:** bei Absaugung „keine" zog der Nebel
trotzdem zur Bildmitte — `when` blendet nur den Regler aus, der Wert ging weiter an den Shader;
jetzt schaltet `glZusatz` den Sog. Dazu: Kaustik verspricht keine Lichtaufnahme mehr (sie läuft im
Shader und kann nicht in den Puffer malen), `LICHTMAL` wird in einem `finally` zurückgesetzt, die
Kräuselung der Schichtkante zieht mit der Körnung mit, und die zuletzt gewählte Sorte überlebt das
Laden. Nachgemessen: „keine" ist jetzt bildgleich mit Sog 0.

**Offen aus der Diskussion:** Kryo-Stoß als Ereignis am Antrieb, Nebelvorhang von der Traverse (das
ist zugleich Jörgs halbdurchsichtiger Vorhang), Scherung im Wind, Kantenfall des Bodennebels über
die Bildkante. Und Jörgs Frage nach einem Premium-Etikett: abgelehnt, stattdessen den fertigen
Effekten das Etikett „Entwürfe" abnehmen und für Scheinwerfer, Schatten, Laser, Lichtstrahlen und
Theaternebel eine eigene Gruppe „Bühnenlicht" — noch nicht entschieden.

## Kritzelordner aufgeräumt (10.09.2026, Caspar_D: „Magst du die Kritzelordner … systematisieren und retten")
Gerettet ist der Weg, nicht die Kopien. Neu:
- **`bin/effektclip-labor.js`** mit `aus`, `ein`, `daten`. Die Quelle bleibt `web/index.html`, die
  Laborkopie ist abgeleitet; `ein` prüft vor dem Schreiben jedes Inline-Skript der Seite auf Syntax.
  `daten` legt den Katalogauszug (zwölf Titel, über den Bestand verteilt), die Startlage und die drei
  Verweise `media`, `testbild`, `fremd` an. **`fremd` fehlte bisher** — ohne ihn findet der Shader sein
  Rauschen nicht und man misst still den Leinwand-Rückfall.
- **`labor/effektclip-studio/`** versioniert: Prüfstand, Startlage, `messreihe.js`, die Grundlinie
  `messreihe-2026-09-10.json` und die Rohbefunde des Tiefen-Checks. Abgeleitetes ist in `.gitignore`.
- **`docs/EFFEKTCLIP-REGELN.md`**: vierzehn Gesetze, das Prüfverfahren, die vier Fallen des
  Mittelwerts und die Grundlinie als Tabelle.
- Der Prüfstand läuft jetzt unter `18812` aus dem Repo. Der alte auf `18811` zeigt noch in den
  Sitzungsordner und kann weg, sobald Jörg ihn nicht mehr offen hat.
- **Gelöscht (10.09.2026, Jörg: „entscheide, welche Redundanz du löschst"):** `.labor/` (42 MB) und
  `.schnappschuss/` (6 MB). Vorher geprüft: die Schnappschüsse waren bytegleich mit `bbb9963`, der
  Prüfstand und die Rohbefunde liegen versioniert im neuen Labor, Modul und CSS sind aus
  `web/index.html` ableitbar, der Katalogauszug ist regenerierbar, `einbau.py`/`einbau2.py` sind
  durch `bin/effektclip-labor.js` ersetzt. Übrig blieben nur die Patch-Skripte als Gerüst; ihr
  Ergebnis samt Begründungen steht in 37 Commits an `web/index.html` (stichprobenweise geprüft).
  **Der Vorher-Stand des Studios ist `bbb9963`.**

## Scheinwerferblenden waren der Bremsklotz (10.09.2026, Caspar_D: „das ist jemand sehr greedy")
Jörgs ganzes System lagte. Ursache: in `blendeMaske` stand der Weichzeichner als **Kontext-Filter vor
der Zeichenschleife**. `ctx.filter` wirkt je Zeichenzug, nicht je Fläche — jeder einzelne Kreis der
Blende bekam also seinen eigenen Weichzeichnungs-Durchgang über die ganze Leinwand. Dazu wurden die
Muster Punkt für Punkt gemalt, obwohl sie sich wiederholen.

Gemessen mit erzwungenem Rücklesen (`labor/effektclip-studio/blendentest.html`), Leinwand 452×602,
je **ein** Scheinwerfer, je **ein** Bild:

| Fall | Züge | alt | neu |
|---|---|---|---|
| Vorgabe, Fleck | 169 | 424 ms | 3,0 ms |
| Vorgabe, Kegel | 961 | 2 826 ms | 2,9 ms |
| feine Blende, Fleck | 841 | 2 106 ms | 2,9 ms |
| feine Blende, Kegel | 6 889 | 18 475 ms | 3,5 ms |

Das galt je Maler: Studio, jede Kachel und die Profilvorschau rechneten das getrennt. Behoben: die
sich wiederholenden Muster (Punkte, Streifen, Gitter) werden einmal in eine kleine Kachel gemalt und
als Muster gefüllt — ein Zug statt Tausender, die Kachel wird gemerkt; weichgezeichnet wird einmal am
Ende über die fertige Maske, auf einer Zwischenfläche, die an der Maskenfläche hängt (damit Studio,
Kacheln und Vorschau sich nicht die Größe umstellen). Die Füllung reicht jetzt über die ganze
Leinwand statt nur bis `R`, dadurch fehlt am Rand kein Muster mehr. Sehprobe: gleiches Punktraster,
gleiche Drehung, gleiche Weichheit.

**Als Regel aufgenommen** (EFFEKTCLIP-REGELN, Nr. 14): ein Filter gehört nicht in eine Schleife, und
was sich wiederholt, wird zur Kachel. Dazu eine fünfte Falle beim Messen: Rechenzeit ohne Rücklesen
misst nur das Abschicken der Befehle.

**Der zweite Bremsklotz, nicht von uns:** ein eingefrorener Server vom Ausfuhr-Stick
(`/Volumes/INTENSO/KlangTresor/… server.js --eingefroren --port 8788`, PID 77446) lief seit acht
Stunden mit **95 % CPU und 500 Minuten Rechenzeit**. Der Grund: **der Stick war längst abgezogen**,
`/Volumes/INTENSO` gab es nicht mehr. Der Node-Prozess drehte als Waise eines verschwundenen
Laufwerks durch; Port 8788 hielt weiter der echte Entwicklungsserver (PID 34516, 30 Sekunden
Rechenzeit in elf Stunden), der eingefrorene kam also nie ans Netz. Auf Jörgs Wort beendet, genau
diese PID; der echte Server blieb unberührt. **Lehre für den Ausfuhr-Stick:** der eingefrorene
Server merkt nicht, wenn sein Laufwerk verschwindet, und er merkt auch nicht, dass sein Port schon
belegt ist. Beides gehört ihm beigebracht, sonst passiert das jedem, der den Stick abzieht, ohne
das Fenster zu schließen.

## Nebel graute das Bild aus (10.09.2026, Caspar_D: „es sieht sehr fade und grau aus")
Konstruktionsfehler im Medium: die Umgebungshelligkeit war eine **feste Zahl** (`u_grundlicht`), also
mischte der Nebel überall gegen denselben Grauwert. Über hellen Stellen zog er herunter, über dunklen
herauf — der Kontrast brach ein und die Farbe ging mit.

Behoben: die Umgebung kommt jetzt **aus dem Bild selbst**, grob verwaschen aus neun Griffen in die
Quelltextur (`umgebung(uv)` im Shader). Über Hellem ist der Nebel hell, über Dunklem dunkel. Er behält
60 % der Farbe darunter, sonst grauen satte Bilder trotzdem aus. „Ohne Licht" ist damit kein absoluter
Wert mehr, sondern ein Anteil der Umgebung: 1 lässt das Bild darunter so hell wie zuvor, darunter
schluckt der Nebel, darüber glüht er (Regler jetzt bis 1,5).

Gemessen am Testporträt in Farbe, **gleiche Stärke**, Kontrast und Buntheit als Streuung bzw. mittlerer
Farbabstand:

| | Kontrast | Buntheit |
|---|---|---|
| ohne Nebel | 64,1 | 55,3 |
| alt, Stärke 0,5 | 50,1 | 38,9 |
| **neu, Stärke 0,5** | **57,5** | **45,5** |
| alt, Stärke 0,8 | 43,5 | 29,9 |
| **neu, Stärke 0,8** | **54,8** | **39,8** |

Bildzeit bleibt bei 16,7 ms trotz der neun zusätzlichen Texturgriffe. Vorgaben nachgezogen: Stärke 0,4
statt 0,5, „Ohne Licht" je Sorte um 0,8 bis 0,95. **Ablagen tragen jetzt `fassung:3`**; ältere werden
übersetzt (alter Grundlicht-Wert × 2,2, gekappt bei 1,5), im Labor geprüft: 0,45 lädt als 0,99, ein
zweites Laden rechnet nicht noch einmal um.

Als **Regel 6a** aufgenommen: ein Medium mischt gegen seine Umgebung, nicht gegen eine feste Zahl.

## Videoexport für Suno (10.09.2026, Caspar_D: „ein 10 sec videoexport … damit man das in suno benutzen kann")
Vorgaben von Jörg: Seitenverhältnis der Quelle, stumm, nahtloser Loop („gerade bei Schneefall, Feuer,
Funkenflug"), das Hauszeichen in der Ecke, ins Download-Verzeichnis.

**Gebaut.** Knopf „10 s ausgeben" im Fuß des Studios. Ein **eigener Maler in Ausgabegröße** (lange Seite
1080, gerade Kantenlängen für H.264) — die Breite des Pults soll nicht über die Ausgabe entscheiden.
Länge: ganze Takte bis höchstens zehn Sekunden, auf ganze Bilder gerundet, 30 Bilder je Sekunde.
Aufgenommen wird mit `MediaRecorder` als **MP4 mit H.264 direkt aus dem Browser** — geprüft, kein Umweg
über WebM. Das Hauszeichen kommt aus dem `link rel=icon` der Seite, es gibt also nur eine Fassung davon.

**Der Loop.** Im Export läuft der Maler im `LOOP`-Modus: jede Geschwindigkeit rastet auf ein ganzes
Vielfaches von 1/Cliplänge ein (`lpR`, `lpP`, `lpW`, `lpV`), und das Schlagraster wird durch ein
**gleichmäßiges** ersetzt (das erkannte schwankt um Millisekunden). **Im Labor bewiesen: das Bild bei t
und bei t + Cliplänge ist bitgleich, Unterschied 0** — ohne Loop-Modus 3,8. Aufgenommen wird [0, L), das
Bild bei L fehlt, weil es dasselbe wie das erste ist (Jörgs Einwand, und er hatte recht).

**Der Umweg über das Haus.** `MediaRecorder` ist mit den letzten Bildern noch nicht fertig, wenn die
Aufnahme endet, und verliert unterwegs gelegentlich eines. Darum wird über die Naht hinaus aufgenommen
(0,7 s Zugabe, inhaltlich der Anfang des nächsten Durchlaufs) und der neue Endpunkt
**`POST /api/effektclip-schnitt?bilder=N&rate=30`** schneidet mit ffmpeg nach Zeit auf genau [0, L)
zurück, ohne neu abzutasten (`-fps_mode passthrough`). Antwortet das Haus nicht — etwa im Prüfstand —,
bleibt die Rohaufnahme und der Status sagt das.

**Gemessen** (Partikel, Feuer, Helligkeitspuls, 1024×878, 293 Bilder, 9,767 s): der Sprung an der Naht
liegt bei 7,7, der stärkste normale Bildwechsel derselben Datei bei 7,4, der Median bei 2,9. Die Naht ist
also **etwa ein kräftiger Bildwechsel**, kein Sprung über mehrere Bilder. Exakt wird sie erst, wenn die
Aufnahme kein Bild mehr verliert; das ist eine Eigenheit von `MediaRecorder`.

**Was noch nicht loopt:** Nachzieheffekt (füttert sich selbst) und die vier Shader Wellen, Kaustik, Dunst,
Flammen (lesen Rauschen entlang einer geraden Zeitachse). Der Status nennt sie beim Namen. **Vorbereitet:**
`web/fremd/webgl-noise/noise4D.glsl` ist geholt und in HERKUNFT.md begründet — mit vier Dimensionen läuft
die Zeit auf einem Kreis und das Feld ist nach einer Umdrehung exakt dasselbe. Das ist der zweite Schritt.

**Nebenbei:** das Hauszeichen steht jetzt auch vor dem Wort KlangTresor in der Kopfzeile
(`#markezeichen`). Es liegt **im** Titelverlauf, nicht daneben (Caspar_D: „dichter an das Wort und mit in
die Gradientenfärbung einbeziehen"): dieselbe Verlaufsangabe wie bei `h1`, das Rad wirkt nur als Maske
darauf, und der Verlauf ist achtmal so breit wie das Zeichen, damit er dort dieselbe Stelle zeigt wie
unter dem ersten Buchstaben. Ohne Platte, anders als das Favicon — das braucht sie, weil es im Reiter auf
fremdem Grund sitzt. Der Videoexport nimmt weiter die Fassung mit Platte, aus demselben Grund. Der Prüfstand hat dasselbe Zeichen im Kopf, damit sich Marke und
Export dort prüfen lassen, und einen Schalter `?schnitt=<Port>`, um den Schnitt gegen ein zweites Haus zu
testen.

## Eigene Effektclips kommen nicht zurück ins Archiv (11.09.2026)
Caspar_D: „jetzt kann ich mit KlangTresor Videos machen und sie auf suno hochladen, dummerweise erkennt
KlangTresor beim Verbinden mit Suno seine eigenen Videos als neu und will sie gleich ins Archiv werfen."

Ein selbstgemachter Header hilft nicht: wir schicken Header beim **Abholen**, die Datei liegt bei Suno.
Eine Marke *in* der Datei wäre möglich, überlebt aber vermutlich Sunos Neukodierung nicht. Entschieden
wurde stattdessen die Buchführung, und die Grundsatzfrage hat Jörg so beantwortet: **was wir jederzeit
neu erzeugen können, archivieren wir nicht.** Das ist dieselbe Linie wie beim Effektclip selbst — Rezept
statt gebackenem Video.

**Ausgabebuch `library/effektclips.json`.** Der Schnitt-Endpunkt schreibt je Titel mit, was er ausgegeben
hat: Zeit, Sekunden, Bildzahl, Bytes. Ohne Titel-Kennung wird nichts gebucht, dann kann auch nichts
fälschlich unterdrückt werden.

**Erkennung im Medienlauf (`bin/laden.js`).** Steht für einen Titel etwas im Buch, wird das geänderte
Video-Artwork einmal geholt, mit ffprobe gemessen und dann verworfen oder behalten. Geraten wird nicht.
Das starke Merkmal ist die **Länge**: unsere Clips sind ganze Takte genau dieses Liedes, auf ein Bild
gerundet, also krumme Werte wie 9,767 s; die Toleranz ist 0,05 s. Wird es erkannt, merkt sich das Buch die
Suno-Adresse, und beim nächsten Lauf wird gar nicht erst geladen. Neues Zeichen in der Laufzeile: `E`,
dazu eine Zeile in der Bilanz. Ohne ffprobe fällt die Erkennung aus und es wird archiviert wie bisher.

**Im Abgleich (`bin/sammeln.js`)** meldet sich ein erkanntes Video-Artwork nicht mehr als Änderung. Beim
allerersten Mal meldet es sich noch, weil es da noch niemand gemessen hat — das ist richtig so.

Geprüft: Ausgabebuch wird geschrieben (9,7667 s gebucht, Datei 9,766016 s), unser Clip wird als „eigen"
erkannt und die Adresse gemerkt, ein Video anderer Länge am selben Titel bleibt „fremd", ein Titel ohne
Eintrag bleibt „fremd". **Grenze:** lädt Jörg einen Clip bei einem *anderen* Titel hoch als dem, aus dem er
stammt, wird er archiviert. Das ist die sichere Richtung.

### Gegenlesen zum Ausgabebuch: drei bestätigte Befunde, alle behoben (11.09.2026)
Der erste Wurf konnte **echtes Suno-Material still und dauerhaft löschen**. Vierzehn Agenten, drei von
elf Befunden bestätigt, alle drei schwer:

1. **Das Urteil hing allein an der Länge und war unumkehrbar.** Traf ein echtes Video-Artwork zufällig
   eines von bis zu neun gebuchten Fenstern (±0,05 s), wurde es gelöscht, seine Adresse als „unsere"
   gebucht, nie wieder geholt und nie wieder gemeldet. Die gebuchte Bildzahl lag ungenutzt daneben.
2. **Ein liegengebliebenes Bruchstück (`.teil`) wurde ohne Adressprüfung fortgesetzt.** Wechselt das
   Video-Artwork, entstand ein Zwitter aus zwei Dateien, dessen Kopf noch die alte Länge trug — ffprobe
   maß die alte, und das *neue, echte* Video flog raus. Das war ein Fehler im Medienlauf, schon vor
   heute, den der neue Löschzweig gefährlich machte.
3. **Die Begründung wurde nie geprüft.** „Lässt sich jederzeit neu malen" gilt nur, wenn das Rezept
   wirklich beim Titel liegt. Gebucht wurde aber schon beim bloßen Ausgeben.

**Behoben:** Das Urteil braucht jetzt **drei Bedingungen zusammen** — das Rezept liegt beim Titel,
Länge *und* Bildgröße passen, und es passt **genau ein** Eintrag. Bei jedem Zweifel „fremd", also
archivieren: lieber eine Datei zu viel als eine zu wenig. Der Server bucht dafür Breite und Höhe mit.
Ein Bruchstück trägt seine Adresse daneben (`.teil.quelle`) und wird verworfen, sobald sie nicht mehr
stimmt; dazu wird die angekommene Größe gegen `Content-Length` geprüft. Und gelöscht wird nicht mehr
spurlos: neben dem Titel bleibt `artwork.mp4.eigen.json` mit Adresse, Messwerten und der Anleitung zum
Zurückholen liegen. Der Lauf nennt die betroffenen Titel beim Namen.

**Geprüft, alle vier Wege:** ohne Rezept → fremd · mit Rezept und passenden Maßen → eigen · Adresse
danach gemerkt → ja · gleiche Länge, andere Bildgröße → fremd. Und über das Netz: ein Bruchstück
fremder Herkunft wird verworfen und die Datei kommt bytegleich an, ein eigenes wird fortgesetzt.

### Die sechs schon hochgeladenen Clips nachgetragen (11.09.2026)
Jörg hatte sechs Clips ausgegeben und bei Suno längst als Artwork zugewiesen, **bevor** es das
Ausgabebuch gab. Für den Medienlauf waren sie damit fremdes Material und wären ins Archiv gewandert.
Neues Werkzeug **`bin/effektclip-buch.js`** trägt solche Clips nach:

```bash
node bin/effektclip-buch.js zeigen                    # was steht im Buch
node bin/effektclip-buch.js nachtragen                # ~/Downloads messen und zuordnen, nur zeigen
node bin/effektclip-buch.js nachtragen --schreiben    # und wirklich eintragen
```

Es liest nur, es verschiebt und löscht nichts. Erkannt werden Dateien nach dem Ausgabemuster
`<Titel> — Effektclip.mp4`; der Titel wird mit **derselben Säuberung** wie beim Ausgeben
(`[^\p{L}\p{N} _-]` weg, 60 Zeichen) gegen den Katalog gehalten. Deshalb findet „Die Gedanken" auch
den Katalogtitel „Die Gedanken …" wieder. Ist ein Titel unbekannt oder **mehrdeutig**, wird nichts
eingetragen, sondern berichtet — geraten wird nicht. Fehlt beim Titel `eigen-effekt.json`, gibt es
eine Warnung, denn ohne Rezept lehnt `bin/laden.js` den Clip ohnehin ab (die Begründung „jederzeit
neu zu malen" trägt dann nicht).

Gebucht wird die **gemessene** Länge der Datei, nicht die gerechnete. Die sechs stammen aus der Zeit
vor dem Schnitt-Endpunkt, sind also Rohaufnahmen; eine gerechnete Länge hätte danebengelegen.

Nachgetragen: *Bei mir klingelt keiner* 9,367 s · *Die Gedanken* 9,353 s · *Noch lachst Du* 8,934 s ·
*Okkultation* 9,767 s · *Seife* 9,567 s · *Still you laugh* 8,979 s. Alle sechs eindeutig, alle mit
gesichertem Rezept.

**Geprüft** im Sandkasten (Kopie des Buches, nachgelegte Rezepte, `bin/laden.js` im Original-Wortlaut):
alle sechs Dateien → `eigen`; drei echte Suno-Videos gegen zwei unserer Titel gehalten → sechsmal
`fremd`; zweiter Lauf → übersprungen, weil die Adresse im Buch steht. Das echte Buch blieb unberührt.
Nebenbefund, der die Längenregel bestätigt: Sunos eigene Videos sind glatt (10,041667 s, 12,041667 s),
unsere krumm — die beiden Mengen liegen weit auseinander.

**Offen bleibt:** Beim ersten Abgleich meldet `bin/sammeln.js` diese sechs noch als „Video-Artwork
geändert", weil die Suno-Adresse erst beim ersten Medienlauf ins Buch kommt. Das ist richtig so, auf
Suno hat sich wirklich etwas geändert.

### Kehrtwende: der Mensch entscheidet, nicht der Lauf (11.09.2026, abends)
**Alles oben über das automatische Urteil gilt nicht mehr.** Der erste Medienlauf mit der Erkennung
hat gezeigt, warum. Suno liefert hochgeladenes Video-Artwork **neu kodiert** aus und macht es dabei
null bis drei Bilder länger, die Bildgröße bleibt exakt:

| Titel | unser Export | von Suno | Differenz |
|---|---|---|---|
| Bei mir klingelt keiner | 9,3667 s | 9,3670 s | 0 Bilder |
| Okkultation | 9,7667 s | 9,7670 s | 0 Bilder |
| Die Gedanken | 9,3527 s | 9,3850 s | 1 Bild |
| Noch lachst Du | 8,9336 s | 9,0333 s | 3 Bilder |

Drei wurden erkannt und entfernt, **Noch lachst Du rutschte durch** und landete im Archiv, denn das
Fenster war ±0,05 s, also anderthalb Bilder. Ich habe es kurz auf ein einseitiges Fenster von −0,02
bis +0,15 s erweitert (einseitig, weil unsere Datei das Original ist und Sunos Kopie nie kürzer sein
kann). Dann kam Jörgs Einwand, und er hatte recht:

> „Was mich irritiert, wenn du Buch führst, wann wir was exportieren und beim Laden ausgerechnet
> zeitnah genau diese Clips wieder auftauchen, dann ist das schon Alarm, oder?"

> „Du kannst mir auch bei der Laderoutine die Liste der Songs zeigen, die plötzlich neue Videos
> haben und ich sage Daumen hoch oder runter. Ich werde ja nie in einer Nacht mehr als 5 neue Videos
> zuweisen. Das ist wirklich eher ein kleines Problem."

Die Länge war der schwache Zeuge und stand im Mittelpunkt. Der starke Zeuge ist die Verkettung:
derselbe Titel, Rezept liegt da, Export im Buch, und dort taucht kurz darauf ein Video auf. Den Rest
sieht ein Mensch in fünf Sekunden.

**Jetzt so:** `bin/laden.js` urteilt nicht mehr und **löscht nie etwas**. Es merkt vor, welche Titel
ein Video-Artwork tragen, für die ein Export im Buch steht, setzt dafür `?` in die Laufzeile und
zeigt die Liste am Ende. Damit läuft er weiter unbeaufsichtigt und auch mit fremden Beständen durch.

```bash
node bin/effektclip-buch.js pruefen
```

zeigt je Titel unsere Zahlen neben denen der Datei samt Bilddifferenz und fragt. **Ja** schreibt
`artwork.mp4.eigen.json`, löscht die Datei, merkt die Suno-Adresse im Buch. **Nein** schreibt
`artwork.mp4.fremd.json`. Ohne Antwort bleibt alles liegen. Entschiedenes wird nicht neu gefragt.

Entfernt, weil tot: `eigenerClip()`, `videoMass()`, `ausgabebuchSchreiben()`, `eigeneTitel` in
`bin/laden.js`. Die Begründungen stehen als Kommentar an ihrer Stelle.

**Zwei Fallen aus dem Umbau.** `schonErkannt()` ging beim Herausschneiden mit verloren, wurde aber
noch aufgerufen — die Syntaxprüfung sieht so etwas nicht, erst ein Sandkasten-Durchlauf. Und dieser
Durchlauf holte 27 Playlist-Cover von Suno, weil nur die Song-Adressen stillgelegt waren.

### Offen und für später
- **Nebel-Shader, graue Spuren.** Gefunden, noch nicht behoben: in `web/index.html` (Zeile ~27368)
  entsättigt `mix(vec3(lum),um,0.6)` die Umgebung um 40 %, während der Kommentar darüber das
  Gegenteil behauptet. Dazu Verwaschradien von 5,5 und 11,5 % der Bildbreite und eine Dunstdichte,
  die bei 0,45 beginnt. Vorschlag: Entsättigung raus, Radius kleiner, und physikalischer rechnen
  (Bild dämpfen plus Luftlicht) statt es durch eine verwaschene Kopie zu ersetzen.
- **Gottesstrahlen** (Occlusion Map plus radialer Weichzeichner, GPU-Gems-Ansatz) wären ein
  eigener Effekt, nicht die Lösung für die grauen Spuren. Unser Licht-Puffer `u_licht` ist bereits
  die Lichtquellenkarte. Achtung: 100 Abtastungen je Bildpunkt sind die Größenordnung, die uns die
  Scheinwerferblenden lahmgelegt hat. Herkunft und Lizenz wären vorher zu klären.

### Der Lauf wurde ein Sequenzer über die Takte (11.09.2026, nachts)
Erster Wurf: **eine** Laufform für den ganzen Clip. Jörgs Einwand kam sofort und war richtig:

> „ich kann dann ein Video nur auf eine art und weise manipulieren, nicht verschiedene Teile mal
> stottern, mal pendeln, mal laufenlassen"

**Jetzt:** ein Feld je Takt des Ausschnitts, mit der Maus bemalt, wie beim Lichtsequenzer. Vier
Formen als Pinsel: vorwärts, Pendel, Stottern, Standbild. Ein zweiter Klick mit demselben Pinsel
löscht das Feld wieder auf vorwärts.

**Zusammenhängende gleiche Felder verschmelzen zu einem Abschnitt.** Ein Pendel über zwei Takte sind
also einfach zwei gemalte Felder — der Regler „hin und zurück über N Takte" ist dadurch weggefallen,
und mit ihm die Sonderregel in `ausschnitt()`, die den Ausschnitt auf ein Vielfaches der
Pendelperiode kürzen musste.

**Warum die Naht hält:** jeder Abschnitt behält sein eigenes Stück Videozeit und biegt nur darin.
Die Quelle bleibt im Großen synchron, jeder Abschnitt schließt für sich, und an den Taktgrenzen
steht ein harter Schnitt — der ist im Musikvideo gewollt. Weil sich die ganze Folge nach L
wiederholt, gilt f(t+L) = f(t) + L von selbst, für jede Mischung.

**Geprüft** (`scratchpad/nahtprobe.js`, aus dem echten Modultext herausgeschnitten): **3328
gemischte Folgen** — vier Grundtempi, alle Formkombinationen über die vorhandenen Takte, vier
Rastereinstellungen — halten f(t+L) = f(t) + L auf die letzte Stelle, gerechnet unter
Exportbedingungen mit dem gleichmäßigen Raster takt = L/Takte.

**Die Kurve im Pult** zeichnet die Zeitverzerrung mit: waagerecht die Zeit im fertigen Clip,
senkrecht die Stelle im Video. Also x die unabhängige Größe und y = f(x). Andersherum wäre es keine
Funktion, denn unter dem Pendel kommt dieselbe Stelle zweimal vor. Darunter die Zahl, auf die es bei
Hookvideos ankommt, etwa „aus 4,16 s Video werden 9,77 s Clip".

**Zwei Fallen aus diesem Umbau.** Der Zwischenspeicher fürs Taktmaß startete auf `null`, und weil
`DATA` vor dem Öffnen ebenfalls `null` ist, hielt `null===null` den leeren Stand für gültig — beim
ersten Bild flog das Studio auseinander. Die Syntaxprüfung sieht so etwas nicht, nur der Prüfstand.
Und die erste Beschriftung unter der Kurve maß die Spanne statt der wirklich getroffenen Stellen und
log damit beim Stottern um das Doppelte.

**Offen an dieser Stelle:** die Folge wird noch nicht ins Rezept gesichert, geht also beim Neuladen
verloren. Und die Formparameter (Raster, Wiederholungen) gelten für alle Felder gemeinsam, nicht je
Takt.

**Korrektur am selben Abend: das Verschmelzen ist wieder raus.** Gleiche Nachbarfelder wurden zu
einem langen Abschnitt zusammengefasst, ein Pendel über zwei Takte wären also zwei gemalte Felder
gewesen. Jörg: *„aber dann kann ich keine hin und herpendelaktionen mehrfach hintereinander machen"* —
und er hat recht, das war meine Eleganz und nahm ihm das Naheliegende weg. Jetzt gilt: **ein Feld,
ein Takt, eine Aktion.** Zwei Pendelfelder nebeneinander sind zweimal hin und zurück.

Gemessen, Verlauf der Videostelle über zwei Pendelfelder bei 2 s Takt:
`0 0,25 0,5 0,75 1 0,75 0,5 0,25 | 2 2,25 2,5 2,75 3 2,75 2,5 2,25 | 4` — zwei Scheitel, wie gewollt.
Die Nahtprobe (3328 Folgen) hält weiterhin. Ein langsamerer Schwung über mehrere Takte wäre eine
eigene Form, keine Nebenwirkung des Malens.

### Der Lauf, zweiter Abend: Richtung, Spiegeln, Länge, Leuchten (11.09.2026)
In schneller Folge von Jörg getrieben, jeder Punkt sein Wortlaut:

- **„erst takte selektieren, dann ansagen, wie sie verschaltet werden sollen"** — der Pinsel ist weg.
  Takte wählen (klicken, ziehen, **Umschalt-Klick**), dann legt ein Formknopf die Form auf die
  Auswahl. Die gewählten Takte werden *ein* Abschnitt. Damit sind zwei getrennte Pendel zwei
  Auswahlen und ein langes Pendel eine lange — der alte Konflikt zwischen beidem ist weg.
- **„es darf ausser beim stottern nicht springen"** — der Faden läuft durch: jeder Abschnitt setzt
  an, wo der vorige aufhörte. Vorher bekam jeder sein eigenes Stück Videozeit und es sprang an jeder
  Grenze.
- **„verlangsamen und verschnellern mit echter sanfter beschleunigung / keine gezackte kurve"** —
  zwei neue Formen mit der Geschwindigkeit `1 + (s-1)·sin²(πx)`: beginnt und endet bei 1, dort auch
  Steigung 0, fügt sich also ohne Ruck ein. Und das Pendel kehrt mit dem Kosinus um statt eckig;
  Höhe `Lseg/π`, damit die schnellste Stelle genau normale Geschwindigkeit hat.
- **„eigentlich sind doch alles zeitmarken und wir schreiben nur die neuzeit und ob vorwärts oder
  rückwärts"** — genau so: je Takt stehen `{Form, beginnt-Abschnitt, Richtung}`. Rückwärts ist
  dieselbe Kurve mit umgekehrtem Vorzeichen, auch im Verbrauch.
- **„alles was ausgewählt ist gespiegelt dranhängen"** — `gespiegelt anhängen` schreibt die Auswahl
  seitenverkehrt direkt dahinter, letzter Abschnitt zuerst, Richtung gedreht. Eine **Handlung**,
  kein Modus: das Angehängte bleibt bearbeitbar.
- **„es müssen aber takte hinzukommen können, sonst komm ich nicht zurück"** und **„die takte der
  musik bestimmen die maximallänge"** — die Clip-Länge ist einstellbar (− / + im Kopf), Obergrenze
  sind die Takte des Liedes. `MAX_SEK` ist nur noch die *Vorgabe*. Der Ausgabeknopf trägt die echte
  Länge.
- **„die takte müssen aufleuchten, die grade durchlaufen"** — `laufLeuchten()` in `rahmen()`, fasst
  die Seite nur an, wenn der Takt *wechselt*.

**Geprüft:** 6400 zufällige Einteilungen halten `f(t+L) = f(t) + Verbrauch`, konstant über den
Ausschnitt. Umschalt-Klick und Ziehen im Prüfstand. Spiegeln: Faden rückt 11,61 s → nach dem Anhängen
0,00 s, „der Clip schließt". Länge: 4 → 8 Takte, 9,8 → 19,6 s, Ausgabeknopf folgt, Höchstwert 143.

**NICHT geprüft: das Leuchten.** In der Browser-Scheibe des Prüfstands feuert `requestAnimationFrame`
**null Mal je Sekunde** — die Bildschleife steht dort still, Standbilder zeigen das zuletzt gemalte
Bild. Das ist eine neue Messfalle: *wer Bewegung prüfen will, muss erst nachsehen, ob überhaupt Bilder
laufen.* Der Code ist gebaut und gegengelesen, gesehen hat ihn niemand.

**Weiter offen:** die Folge wird nicht ins Rezept gesichert, geht beim Neuladen verloren. Raster,
Wiederholungen und Tempo gelten für alle Takte gemeinsam, nicht je Abschnitt.

### Der Lauf ist wieder ausgebaut (11.09.2026, nachts)
Jörg: *„das ist Käse, inaktiviere das modul, wir kommen hier erstmal nicht weiter / wir brauchen ein
Konzept, so vibe mässig wird das nix."* Er hat recht. Das Ding ist in einem Abend über sechs
Umbauten gewachsen, jeder als Antwort auf den letzten Satz, und am Ende stand ein Modell, das ich
selbst nicht mehr in drei Sätzen erklären konnte.

Nach der Hausregel (*abgeklemmter Code bleibt nicht stehen, die Begründung schon*) ist der Code raus:
`web/index.html` auf den Stand vor `da7310c`, `server/server.js` auf den vor `a79575e` — der
Schnitt-Endpunkt und seine behobene `bilder`-Prüfung bleiben. Alles Gebaute steht im git, die
Commits `da7310c` bis `5a9320e`.

**Was sich als wahr erwiesen hat und ein Konzept nicht neu erfinden muss:**
- `zeichneFrame(t)` ist eine reine Funktion von t. Zeit beugen genügt, Bildbearbeitung braucht es nicht.
- Springen im Video ist nur mit einer Arbeitskopie aus lauter Schlüsselbildern bezahlbar:
  **124,6 ms gegen 14,9 ms** je Sprung, gemessen mit Nachweis des angekommenen Bildes. Die Kopie baut
  ffmpeg in 0,74 s je zehn Sekunden, sie wächst auf das 3,7-fache.
- Weiche Formen, die sich ohne Ruck einfügen: Geschwindigkeit `1 + (s-1)·sin²(πx)` beginnt und endet
  bei 1 mit Steigung 0. Pendel als Kosinus mit Höhe `Lseg/π` ist am Scheitel genau normal schnell.
- Suno kodiert hochgeladenes Video-Artwork neu, null bis drei Bilder länger, Bildgröße unverändert.

**Was ein Konzept klären muss, bevor wieder gebaut wird:**
1. **Was ist die Einheit?** Wir sind zwischen „Takt des Clips, irgendwie behandelt" und „Verweis auf
   einen Videotakt" hin und her gesprungen. Das Letzte war besser, aber dann ist unklar, was eine
   *Form* auf einem Verweis überhaupt bedeutet.
2. **Was darf springen?** Jörgs Regel war: außer beim Stottern nichts. Freie Positionierung erzeugt
   aber genau dort Sprünge, wo Felder auf nicht benachbarte Videotakte zeigen. Der Widerspruch ist
   nie aufgelöst worden.
3. **Was schließt den Clip?** Drei Wege (alles Pendel, gespiegelt anhängen, genau einmal durch das
   Video). Mit freier Positionierung ist das Schließen keine Garantie mehr, sondern eine Eigenschaft,
   die man prüft. Ist das gewollt?
4. **Folgen die Effekte der gebogenen Zeit, oder nur das Bild?** Bisher beides. Taktgetriebene
   Lichtpulse rückwärts laufen zu lassen ist eine Entscheidung, keine Selbstverständlichkeit.
5. **Wo hört der Sequenzer auf?** Jörg hält Schnittprogramme für unbedienbar. Das Ding darf nicht
   heimlich eines werden.
6. **Sichern.** Nichts davon landete je im Rezept.

**Drei Messfallen aus diesem Abend, alle neu:**
- `laufBeugt()` sah nur auf die Form, nicht auf Richtung und Videotakt — die Kurve blieb gerade,
  obwohl die Nummern stimmten. Der Berg fehlte nicht in der Rechnung, er wurde nie gerechnet.
- In der Browser-Scheibe des Prüfstands feuert `requestAnimationFrame` **null Mal je Sekunde**.
  Standbilder zeigen das zuletzt gemalte Bild. Wer Bewegung prüft, muss erst nachsehen, ob Bilder laufen.
- Ein Ziehzustand in der Closure einer Funktion, die sich beim ersten Klick selbst neu baut, ist
  beim zweiten Ereignis wieder weg. Das Ziehen ging nie, und niemand hätte es gemerkt.

### Warum das Lesezeichen jede Nacht dieselben Wort-Zeitmarken holte (11.09.2026)
Jörg: *„warum holt das Lesezeichen jedesmal / Wort-Zeitmarken — 7 geholt / jedes mal, kommen die nie
an?"* Sie kamen an. Gezählt hat sie niemand.

`/api/morgen/v2-fehlt` fragte nur, ob die **Hauptspur** von Whisper stammt. Eine nachgeladene v2
ersetzt Whisper aber absichtlich nicht (Regel vom 20.08.2026: *„v2 darf Whisper nicht ersetzen —
Whisper kennt die Zeitpunkte genau, da schlampt Suno"*), sie wird als zusätzliche Spur `worteV2`
danebengelegt. Damit blieb jeder Whisper-Titel für immer in der Fehlt-Liste. Bei v3 war es richtig
gemacht: dort zählt auch, was schon da ist.

Belegt an **„Bei mir klingelt keiner"**: 333 Worte in `worteV2`, und trotzdem jede Nacht neu geholt.

**Behoben:** vorhanden heißt jetzt *Hauptspur von Suno ODER `worteV2` vorhanden*, dazu — wie bei v3 —
zählt auch eine noch unverarbeitete Rohdatei. Am laufenden Haus geprüft: `v2-fehlt` meldet **4 statt
5**, 256 gelten als vorhanden; v3 unverändert 2 von 260.

Die sieben waren also fünf aus der v2-Liste plus zwei aus der v3-Liste.

**Offen, zweite Hälfte der Frage:** drei Titel (*Ich dreh mich nicht um!*, *Selbstoptimiert*, *Erste
Liebe*) haben Whisper und keine `worteV2`, *Kartoffeln mit Dip* hat gar keine Marken. Ob Suno für sie
überhaupt eine brauchbare v2 liefert, ließ sich nicht feststellen: in `library/roh` liegt **keine
einzige** `timing-*.json` mehr, sie sind nach dem Verarbeiten weggeräumt. Dazu zählt der
Lesezeichen-Lauf eine Antwort schon als „geholt", wenn sie kein Fehler ist — auch wenn keine Worte
darin stehen. Wer das klären will, muss beim nächsten Lauf in die frische Rohdatei sehen, bevor sie
verarbeitet wird.

### Die Einrichtung ist eine Seite, und die Einstiege sind aufgeräumt (13.09.2026)
Der Stand, den ein neuer Chat kennen muss — Einzelheiten in `docs/BACKLOG.md` (Abschnitt Einrichtung)
und `START-HIER.md`.

**Was liegt wo.** Im Projektordner genau neun Einstiege, nach einem Muster: `einrichten-windows.cmd` /
`-macos.command` / `-linux.sh`, dasselbe mit `-docker-` für den Weg ohne Installation, und `starten-*`
fürs bloße Starten (die Schreibtisch-Verknüpfung zeigt darauf). Was niemand anklicken soll, ist aus dem
Blick: `bin/anlasser.ps1` (Node holen, Windows) und `bin/anlasser.sh` (Mac/Linux) sind Geschwister; die
Docker-Bauanleitungen liegen in `docker/` (Kontext bleibt der Projektordner, `name: klangtresor`).
Jörg: *„räume bitte alle installationsdateien auf, dass es keine verwechslungen geben kann"*.

**Drei Stufen, jede fängt die nächste auf** — *„fallbacks, wenn es nicht mit js geht und dann natürlich
das schicke js"*: Skript des Systems (holt Node) → `bin/einrichten.js` (zehn Schritte) → Seite im
Browser auf 127.0.0.1:8790+ (`web/einrichtung/index.html`, pollt `/stand`, antwortet per
`POST /antwort`). Geht kein Browser auf, läuft dasselbe als Text; `--text` erzwingt das, `--ohne-browser`
ist für Probeläufe. Fragen tragen Metadaten (`art: 'wahl'|'text'`, `optionen`, `hinweis`) — die Seite
kennt keine Textmuster.

**Verteilung:** Release-Zip, feste Adresse
`https://github.com/CasparDavi/klangtresor/releases/latest/download/KlangTresor.zip` (flach, eine
Ebene). `node bin/paket.js` baut, `gh release upload v1.0.0 ../KlangTresor.zip --clobber` ersetzt.

**Geprüft:** Seite im Sandkasten bis Schritt 6 durchgespielt (Wahl-, Ja/Nein-, Textfrage kommen aus
der Seite an); `docker compose config` für beide Compose-Dateien; `bin/pruefe-skripte.js` für beide
`.ps1`. **Nicht geprüft:** ein Docker-Bau (hier läuft kein Daemon), Linux überhaupt, und der volle
Lauf aus dem Zip mit der Seite unter Windows und auf dem Mac — das macht Jörg selbst, aus dem
Release-Zip, nicht aus dem Repo.

**Offen:** zweite Schicht der Tonübernahme (bei Suno gelöschte Titel als eigene Katalogquelle), siehe
BACKLOG; die Fertig-Ansicht der Seite hat noch niemand gesehen.

### Windows-Abend: Ordnerdialog, Markierungsmodus, ein Reiter (13.09.2026, spät)
Jörg hat das Release-Zip in der Windows-10-VM durchgespielt. Drei Befunde, alle behoben, Release **v1.0.2**:

- **„bei der Frage nach dem Ordner bleibt das js hängen"** (Schritt 8). Der Dialog ging HINTER Chrome
  auf; Windows holt ein Fenster aus einem Hintergrundprozess nicht nach vorn. Dazu war die
  PowerShell-Zeile zerbrechlich (JSON.stringify ist kein PowerShell-Maskierer), die Ausgabe kam in der
  OEM-Codeseite („Jörg" → Salat), und `spawnSync` hielt die Seite an. `bin/ordnerdialog.js` neu:
  Skriptdatei mit BOM, unsichtbares TopMost-Fenster als Besitzer, UTF-8, `ordnerWaehlenNebenher`
  (Promise) — die Seite sagt derweil „Ein Auswahlfenster ist offen". Rückgabe `{pfad, ging, grund}`;
  `ging=false` heißt: gar kein Fenster möglich, dann darf man tippen („der Text bleibt der Fallback").
- **„bleibt alles hängen"** — dreimal, immer vor dem nächsten Satz an die Konsole. Das ist der
  Windows-Markierungsmodus (QuickEdit): ein Klick ins Fenster hält den Prozess an. `bin/konsole.js`
  schaltet QuickEdit für dieses Fenster ab (SetConsoleMode über `CONIN$`, in der VM gemessen
  0x1F7 → 0x1B7); `einrichten.js` und `starten.js` rufen es vor dem ersten Wort. Nicht als Einstellung,
  nur am Puffer dieses Fensters.
- **„wieso geht das einrichten javascript zweimal im browser auf"** — der Lauf am neuen Ort öffnete
  nach dem Umzug seine eigene Seite. Jetzt `--seite <Port>`: der alte Lauf bleibt als Brücke, die
  Seite geht im selben Reiter hinüber (`ZUSTAND.weiter`). Im Sandkasten gesehen: 8790 → 8791.

**Release-Regel seit heute:** je Änderung ein neues Release (`v1.0.x`), nie `gh release upload
--clobber` — der Austausch reißt eine Lücke, in der die feste Adresse 404 liefert; Jörg hat dreimal
genau da gezogen („existiert angeblich nicht mehr"). `latest/download/` hinkt nach einem neuen
Release ein paar Minuten hinterher — GitHub-Cache, kein Fehler.

**Was Jörg als Nächstes prüft:** der volle Windows-Lauf aus v1.0.2 (Dialog vorn, kein Hänger nach
Klick ins Fenster, ein Reiter), danach macOS. Linux und ein Docker-Bau sind weiter ungeprüft.

**Nachtrag, 13.09.2026, spät (v1.0.3):** Jörg: *„früher hieß KlangTresor MySuno, früher haben sie Files
genau in diesen Ordner ausgepackt … das Script sollte unbedingt darauf hinweisen, dass schon ein Ordner
da ist."* Jetzt sucht `archiveFinden()` in `bin/einrichten.js` **vor** der Wohin-Frage nach Archiven
(Katalog, nie Name) neben dem Ordner, im Home, in Downloads/Schreibtisch/Dokumente/Musik, zwei Ebenen
tief; Fund → Option **[A] dieses Archiv weiterführen** (Vorgabe) → Aktualisierungsweg, `library/`
bleibt. Ein Ordner mit Archiv gilt als Zuhause, auch in Downloads (sonst fragte der Lauf dort gleich
wieder „Wohin?"). Schritt 2s Geschwister-Prüfung bleibt als Netz.

**Windows-Lauf v1.0.4 durchgespielt (14.09.2026).** Caspar_D: *„ich habs durchlaufen lassen,
erstmal keine Fehler gesehen."* Damit ist die neue Oberfläche (Balken, Haken, Ergebniszahlen,
Registerlaschen) unter Windows 10 einmal komplett gelaufen — vom Doppelklick auf
`einrichten-windows.cmd` bis zur fertigen Seite. Die drei Befunde vom Vorabend (QuickEdit,
Ordnerdialog hinter dem Browser, zwei Browserfenster) sind damit auch im echten Lauf erledigt.

Offen bleibt: **macOS** aus dem Zip, **Linux** überhaupt, und ein **Docker-Bau**. Nachgezogen,
aber noch nicht veröffentlicht: der Platzbedarf sagt jetzt überall „rund 1 GB" statt 500 MB
(gemessen 930 MB) — die Wohin-Frage widersprach Schritt 1.

### Konzeptsitzung Video (12.09.2026) — ein Tag nur Reden, kein Code

Ein Tag nur Reden, kein Code. Ergebnis ist ein eigenes Moduldokument:
**[docs/effektclip/VIDEO-PLAN.md](effektclip/VIDEO-PLAN.md)**, Zustand *zu planen*. Wer am
Effektclip weiterbaut, liest das zuerst — hier steht nur, was man wissen muss, um es zu finden.

**Zwei Uhren.** Der Suno-Zehnsekünder ist nicht taktsynchron zu bekommen (Takt- und Tempowechsel im
Lied, Suno spielt immer denselben Clip) und gehört auch zu keiner Stelle im Lied. Er bekommt eine
eigene Uhr: Periodizität aus sich selbst, taktlose Effekte, muss sich schließen. Alles Lange läuft
auf Liedzeit. Der heutige Loop-Modus ist damit richtig, aber falsch begründet — nicht „damit der
Export schließt", sondern *weil es hier keinen Takt gibt*.

**Drei Befunde zur „Fahrt", nachgerechnet, noch nicht behoben** (Caspar_D: *„ich hab gestern keine
Fahrten oder lokale Zoom-ins und -outs gesehen"* — der Eindruck stimmt):
1. Die Fahrt **zoomt nicht**. `crop` ist zeitunabhängig, nur `panx`/`pany` laufen. Die Beschreibung
   verspricht Zoom — Regel 11. Einen langsamen Zoom gibt es in der ganzen Bibliothek nicht.
2. Bei den Vorgaben **4,8 % der Bildbreite** über 9 s, rund 2 px/s auf der Prüfleinwand. Nicht
   kaputt, zu leise: `weite` wird mit dem ohnehin kleinen freien Weg `(bw−cw)/2` multipliziert.
3. Im Loop rastet `lpP` die Periode auf Teiler von L ein: bei L = 10 s ergibt **Tempo 7…40 beide
   Male 10 s** — der Regler ist über 34 von 35 Stufen tot (Regel 9) und die Lissajous-Bahn
   kollabiert zur **geraden Diagonale**.

**Fünfte Messfalle, gehört nach EFFEKTCLIP-REGELN.md.** Fahrt misst 51,2 an/aus und „Ausschnitt"
59,8 — bei *stehender Uhr*. Das misst Beschnitt und Versatz, nicht Bewegung; ein Effekt, der den
Ausschnitt nur verschiebt und nie animiert, ergäbe dieselben Zahlen. Also: **Geometrie braucht einen
Zeitlauf**, nicht nur Ereignisse.

**Regel 10a, zweiter Fall.** „Der Lauf" ist das am 11.09. ausgebaute Zeitbiege-Modul, „**Läufe**" ist
eine Effektgruppe in der Oberfläche — und *fahrt* sitzt genau dort. Fall für Umbenennung.

**Feuer kann mehr, als gedacht.** `boden`, `mitte` und `breite` gibt es längst und der Maler nutzt
sie; die Grundlinie ist frei platzierbar. Was fehlt: **Wind bei Feuer und Flammen gar nicht** (nur
symmetrisches `sway`), `breite`-Minimum 0,1 zu grob für einen Docht, Basis immer waagerecht.

**Quellfläche und Sichtfeld.** Partikel sind vollflächig, weil das Recycling ein Modulo über die
Leinwand ist. Trennt man *wo geboren* von *wo sichtbar*, fällt das Modulo weg und wird
**Lebensdauer** — und das ist dieselbe Änderung, die die Loop-Reparatur braucht. Nicht getrennt
bauen.

**Die Karte wird zweispaltig**, spezifisch links, generisch rechts, **ohne Zuklappen** (Regel 10:
ein versteckter Regler wirkt trotzdem). Caspar_Ds Begründung: das Problem der Schnittprogramme ist
nicht die Anzahl der Parameter, sondern dass sie verstreut sind. Die eigentliche Arbeit daran ist
nicht das Umsortieren, sondern dass ein generischer Name überall dasselbe bedeutet.

**Automatik.** Das System baut vor, der Mensch greift ein; Ziel 80 % brauchbar. Die Automatik hat
**keine ästhetische Aufgabe, nur eine handwerkliche** — damit ist sie messbar. Alles, was auffällt,
ist Mensch.

**Reihenfolge** steht in §11 des Plans. Ganz vorn die drei Fahrt-Befunde, weil sie einen Effekt
betreffen, der heute benutzt wird und nicht tut, was draufsteht — unabhängig von jedem Videovorhaben.

**Offen und wer am Zug ist:** §12 des Plans, elf Zeilen.

*(Nachgetragen am 14.09.2026 aus einer Sitzung ohne Zugang zum Haus. Die vier
Befunde zu Fahrt, Nebel, Antrieb und Wind sind am 14.09. am Code gegengeprüft
und bestätigt — siehe unten.)*

**Die Gegenprüfung am Code (14.09.2026).** Vier Behauptungen des Plans, am laufenden Bestand
nachgesehen — alle vier bestätigt:

| Behauptung | gemessen |
|---|---|
| Fahrt zoomt nicht, `crop` zeitunabhängig | `crop*=(1-(1-e.zoom)*s)` — nur `panx`/`pany` laufen über `tri()` (web/index.html:27829) |
| Nebel entsättigt 40 % gegen seinen Kommentar | `mix(vec3(lum),um,0.6)` (web/index.html:27543) |
| Antrieb hängt nur an neun Effekten | licht, schatten, laser, strahlen, feuer, flammen, kaustik, bloom, strobe — alles andere weiß nichts vom Lied |
| Wind fehlt bei Feuer und Flammen, Partikel hat ihn | `partikel` hat `wind` und `boeen`, `feuer`/`flammen` nur `sway` |

Der mitgelieferte Patch ließ sich nicht mehr anwenden — `NAECHSTER_CHAT.md` ist seit dem 12.09.
gewachsen. Die Datei selbst ist byte-gleich mit dem Endstand des Patches (geprüft), die beiden
Doku-Einträge sind von Hand gesetzt.

**Eine Beobachtung zum Dokument selbst:** Es liest sich gegen seine eigene Rangfolge. Die
Tiefenkarte nimmt den meisten Raum ein (§9.7–9.7d, dazu Teile von §9b und §9c), steht in der
Reihenfolge aber bewusst weit hinten, weil sie an einer ungeprüften Annahme hängt — ob monokulare
Tiefenschätzung auf stilisiertem Artwork taugt. Wer nur den Text liest, hält sie für den Kern.

---

## Stand am Ende des 14.09.2026 — 37 Einchecks

Der Tag lief in vier Strängen. Was offen ist, steht ganz unten.

### 1 · Tiefenkarten (vormittags)

Depth Anything V2 **Large in fp16** (600 MB), gemessen gegen Small und Base an zwölf Covern:
Small 294 ms und ein weicher Brei, Base 880 ms, Large 2,7 s mit einzelnen Steinen im Relief.
Alle 324 Karten gerechnet, pixelgenau auf dem **Titelbild** (nicht dem Cover — das war ein Fehler,
181 von 324 hatten beide). Der Nebel ist damit eine **Dämpfung nach Koschmieder** statt einer
Schicht. `bin/tiefenkarten.js` läuft im Morgenlauf und in der Einrichtung.

Nebenbefund, der Geld wert war: der Weichzeichner des Nebels war ein **Ringabtaster** und erzeugte
Geisterbilder. Ich wollte den Fehler erst mit der alten Entsättigung kaschieren — Caspar_D:
*„du sollst den fehler ausbügeln und ihn nicht verstecken"*. Jetzt ein echter gejitterter Mehrring.

### 2 · Partikel: Quelle und Flug

Der größte Bau des Tages. **Die Fassung stammt von Caspar_D, nicht von mir** — drei Entwürfe von
Agenten, neun Gegenleser, keiner trug. Seine fünf Sätze trugen:

- **Auftrieb** statt Richtung in Grad (leichter, genauso schwer, schwerer als Luft). Das löst
  zugleich die härteste Falle: `lpV` kann als `max(1,round(…))` keine negativen Geschwindigkeiten.
  Wer die vorzeichenbehaftete Geschwindigkeit in den Loop-Raster schickt, dreht Asche, Blasen,
  Staub und Funken **im Export** um — im Pult unsichtbar.
- **Ein Fleck** mit x/y-Ausdehnung und Drehwinkel statt vier Formen.
- **Druck, der ausläuft** wie Luftwiderstand — die Gravitationskurve ohne zweiten Regler.
- Fächer heißt `streuung` wie beim Laser, Länge heißt `laenge` wie bei den Strahlen.

Nachgewiesen, nicht behauptet: **alle sieben Lagerechnungen sind Zeichen für Zeichen unverändert**,
solange die Quelle „das ganze Bild" ist.

Daraus fiel **Schwaden** (Rauch) fast umsonst heraus: dieselbe Quelle, derselbe Flug, nur anders
gezeichnet. Mit zwei Physikregeln von Caspar_D: dünner beim Auffächern (dieselbe Menge auf größerer
Fläche, also 1/g²) und erst auskondensieren (dichteste Stelle bei 25 % des Lebens). Und Schwaden
sind ein **Medium**: sie nehmen Licht auf. Mein Einwand, ein Maler könne das nicht, war falsch —
der Licht-Puffer ist eine Leinwand. Gemessen: im Scheinwerferkegel 32,8 Graustufen gegen 2,3.

### 3 · Das Lichtmischpult für alle Pulse

Die acht Pulse hingen an einem eigenen, älteren Antrieb. Jetzt am Pult. Dabei drei Berichtigungen
**auf Einspruch von Caspar_D**, alle drei waren meine Denkfehler:

| ich hatte | richtig ist |
|---|---|
| Tiefe ausgeblendet, sie sei ein zweiter Wucht-Regler | Wucht ist die Decke, Tiefe der Boden — kein Produkt |
| „das Pult kann den Atem nicht" | die Sinuskurve war immer da, nur der Bereich fehlte |
| Wucht und Stärke seien bei sechs Effekten ein Produkt | nur bei zwei (Helligkeit, Sättigung), dort gefaltet |

Dazu neu: **Bruchteile von Schlägen** (bis achtmal je Schlag), **Flackern** als echtes Wertrauschen
über drei Oktaven statt eines Werts je Periode, und die Regel für taktfreie Titel — taktgebundene
Quellen stehen dort nicht zur Wahl, eine gespeicherte fällt auf die feste Frequenz zurück.

**Die Grenze ist die Bildrate, nicht das Auge.** Export mit 30 Bildern: darstellbar bis 15 Hz,
als Flackern lesbar bis 7,5. Das Auge verschmilzt erst bei 50 bis 60.

### 4 · Oberfläche

Das Abzeichen heißt **Medien** (Taufnotiz in den Hausregeln, erster Eintrag überhaupt an dem neu
angelegten Ort). Das Fenster dahinter zeigt jetzt **beide Seiten**: links Suno zum Lesen, rechts
das Private zum Ändern. Drei Wege hinaus durch einen Griff: Kreuz, Esc, Klick daneben.

Der Regellauf über den Dialog fand drei echte Verstöße: die letzte Checkbox der Oberfläche
(Regel 18), dreimal „mein" (Regel 25) und fünf Schriftgrößen unter der Lesegrenze (Regel 14).

Und die **Lichtstrahlen** haben weiche Flanken bekommen: vorher eine Polygonkante, jetzt eine
Flanke über 9 % der Bildbreite.

### Was offen ist und auf Caspar_D wartet

1. **Der Serverteil des Videoexports.** Die Browserseite steht und ist folgenlos (`kodiererDa()`
   bekommt heute 404, der alte Weg läuft). Es fehlen rund 20 Zeilen in `server/server.js`: ein
   Endpunkt `/api/effektclip-bauen`, der den rohen H.264-Strom mit `ffmpeg -f h264 -r RATE` umhüllt.
   **Dabei startet Jörgs laufender Server neu** — deshalb angesagt und nicht gemacht.
   Danach ist der Weg frei für 60 Bilder je Sekunde und damit 30 Hz schnellstes Flimmern.
   Die Bildrate soll **nicht einstellbar** sein, sondern aus der schnellsten Kurve der Kette folgen.
2. **Der Docker-Start.** Der Container lädt 1,09 GB Modelle, **bevor** der Server antwortet, obwohl
   im Einstiegspunkt als Absicht steht, dass fehlende Modelle die Website nicht aufhalten sollen.
   Tarja sah deshalb zwei stille Minuten. Fix: Server zuerst starten, Modelle daneben holen.
3. Aus der Inventur der Zustandswechsel: `spreiz` bei den Lichtstrahlen meint denselben Trichter
   wie `streuung` — eine Übersetzung nach Regel 12, eigener Schritt.
4. Das Stroboskop braucht die Leuchter-Marke **je Ende** statt je Typ: die helle Hälfte gehört in
   den Licht-Puffer, die dunkle nicht.

## Filmnebel — der Nebel neu nach dem Standardmodell (14.09.2026)

Caspar_D: *„mit dem nebel ist massiv was faul, der macht nur dunkle schlieren, der laser wird
überhaupt nicht verstärkt"* · *„warum wird nebel ohne licht immer schwarz obwohl ich weiss
eingestellt habe"* · *„ich habe irgendwie einen Glücksspieleindruck"* · *„mach eine recherche, wie
andere das mit nebel machen, was wir hier haben ist zu kompliziert"* · *„wir nehmen keine Rücksicht
darauf, was schon da ist, wir bauen das mit deinen neuen Kenntnissen komplett neu, so wie die Profis
das machen"* · *„das Ding heisst Filmnebel. Theaternebel bleibt erstmal und wird, wenn Filmnebel
besser ist, gestrichen."*

**Der neue Effekt `filmnebel` steht neben dem alten `nebel`.** Nichts wurde übersetzt, nichts
gelöscht — beide laufen, der Theaternebel geht, wenn der Filmnebel gewonnen hat.

### Die Rechnung

```
Weg        = Schichtlage(Schwere) · Ballen(Schwaden) · Entfernung(Tiefenkarte)
Durchlass  = exp(−3·Weg)
Streulicht = Lichtpuffer·(0,25 + 0,75·Bündelung) + Lichthof·0,75·(1 − Bündelung)
Ergebnis   = Bild·Durchlass + Farbe·(Umgebung + Streulicht·4)·(1 − Durchlass)
```

Fünf Regler — Farbe, Schwere, Schwaden, Bündelung, Luftzug — plus Stärke als Dichte. Der alte hatte
fünfzehn. Der **Lichthof** (Mehrfachstreuung um jede Leuchte) ist der Lichtpuffer, einmal je Bild
auf ein Vierzehntel verkleinert und als vierte Textur gelesen; das Verkleinern IST der Weichzeichner.
Die **Farbe ist das Fluid**, nicht die Helligkeit. Begründung und Belege stehen als Regel 6b in
`docs/effektclip/EFFEKTCLIP-REGELN.md`.

### Gemessen

| | Theaternebel | Filmnebel |
|---|---|---|
| weißer Nebel ohne Leuchte, mittlere Änderung von 36 Graustufen | −6,9 (Vorgabe) bis −23,1 („Ohne Licht" 0) | **−0,05 bis −0,29** über den ganzen Stärkeweg |
| Laser auf den Strahlen, ohne Nebel 33,1 | 16,9 bei „Im Licht" 0 · 45,0 bei 1 · 62,0 bei 2 | **73,0** bei Vorgabe · 39,8…96,4 über die Stärke · **nie unter 33,1** |
| Bilder je Sekunde mit Laser | 60 | **60,2** |

„Schwere" zeigt sich ohne Leuchte nicht in der Helligkeit, sondern im **Ortskontrast** — Luftperspektive.
Kontrastverlust in sechs Streifen von oben nach unten bei Stärke 0,8: Schwere 0 → 55/51/50/47/24/31 %,
Schwere 0,5 → 0/0/15/38/23/32 %, Schwere 1 → 0/0/0/6/24/30 %. Der Nebel sinkt.

### Was der Filmnebel NICHT kann

- **Absaugung und Sog** gibt es nicht mehr, ersatzlos.
- **Ohne Leuchte in der Kette ist weißer Nebel in der Helligkeit unsichtbar.** Gewollt; wer eine
  milchige Scheibe will, nimmt eine hellgraue Farbe statt eines Reglers.
- **Der Höhenterm aus VIDEO-PLAN §9.7a fehlt** — Nebel, der am Boden klebt und zum Horizont
  zusammenläuft. Bewusst weggelassen: die Lochkamera-Rückrechnung `h ≈ (y − y_horizont)·z` braucht
  einen Schwellwert, der bei einer *geschätzten* Tiefenkarte je Bild woanders liegt — das wäre wieder
  ein Glücksspielregler. „Schwere" ist stattdessen eine Bildhöhe mit Tiefendämpfung.

### Offen aus der Code-Prüfung (161 Agenten, 21 von 52 Befunden hielten stand)

Alles am **alten** Theaternebel und am Umfeld, nicht am Filmnebel:

1. **`noiseLaden()` kennt keinen Endzustand für Misserfolg** — fehlt `/fremd/webgl-noise/noise3D.glsl`,
   läuft ein Abruf je Bild (404 je Bild), und der Leinwand-Rückfall wird dauerhaft, ohne dass es in
   der Oberfläche sichtbar wäre.
2. **Die Kacheln der Albumseite fordern das Rauschen nicht an** — vorgeladen wird es nur beim Öffnen
   des Studios. Die ersten Bilder jeder Nebel-Kachel malt garantiert der Rückfall.
3. **„wirkt auf" wird im Lichtpuffer nicht angewandt.** Der Fülllauf kennt `tiefeWirkt` nicht; in der
   Vorgabestellung „alles" folgenlos, sonst leuchtet der Nebel über die ganze Strahllänge weiter.
4. **Theaternebel, „Dicke" bei Bodennebel**: über 89 % des Reglerwegs tot, die Vorgabe 1,20 liegt
   mitten im toten Bereich (lebendig ist 0,10…0,26 bei Lage 0,74).
5. **Theaternebel, Wanderung Fassung < 3**: `typeof e.grundlicht==='number'` ist immer wahr, weil
   `neuerEffekt()` alle Vorgaben füllt; die Klemme bei 1,5 wirft 0,70 / 0,85 / 1,00 / 1,50 alle auf
   denselben Wert.

Ausdrücklich **in Ordnung geprüft** (nicht noch einmal aufmachen): Textureinheiten und `u_licht`, der
Y-Tausch beim Hochladen, `texL` mit NPOT und premultipliedAlpha, „Lage (0 oben)", und „Stärke ist die
Dichte" — das war der einzige Nebelregler, bei dem Wort und Rechnung sauber zusammenfielen.

## Scanner-Laser: Nachglühen, Kosten, Feinstufe (14.09.2026)

Caspar_D: *„der scanner laser glüht nicht nach, die augenträgheit muss eingebaut sein, also ein
Nachglühen, man sieht keine abgetastete Fläche"* — die Spur reichte nur ein Bild (1/60 s) zurück, also
ein Bogen statt einer Fläche. Jetzt reicht sie das **Nachglühen** zurück (Regler, Vorgabe 0,09 s) und
verglimmt zum Ende hin.

**Gemalt wird die Fläche, nicht die Bahn.** Als 240 Striche über die volle Strahllänge kostete der
Scanner bei weitem Fächer **7,5 Bilder je Sekunde** — nahe am Ansatzpunkt lagen dieselben Stellen
36-fach übereinander. Der Fächer wird deshalb in rund 4 px schmale Scheiben geteilt, jede
Zwischenstelle wird in ihre Scheiben eingezahlt, und jede Scheibe bekommt genau einen Keil, flach auf
eine Zwischenleinwand; der Auslauf nach außen wird einmal darübergezogen. **59,9 Bilder je Sekunde**,
bei jeder Reglerstellung. Verweilhelligkeit Rand/Mitte 1,26, die Austastung reißt wieder echte dunkle
Streifen hinein.

**Zwei eigene Fehler unterwegs**, beide gemessen und behoben: der weiche Saum als breiter Keil über
den *ganzen* belegten Bereich flutete ihn mit 22 % (Profil schnurgerade, Verweilhelligkeit 0,85 —
verkehrt herum); und eine Zwischenstelle ist kein Punkt, sie muss in alle Scheiben einzahlen, die ihr
Fleck überstreicht, sonst hängt die Helligkeit an der Feinheit der Scheiben statt am Strahl.

**Feinstufe im Export** (`FEIN`, Caspar_D: *„im Export bei ausreichend Rechenzeit vielleicht richtig
chic"*, Grenze: *„1 min für 10 sec wäre tragbar"*). Der kodierende Weg hängt an keiner Uhr und setzt
`FEIN=true`; der Rückfall über den Aufnehmer nicht, dort dehnt ein langsames Bild den Film. Die
Feinstufe tastet nur **feiner ab** (bis 2400 Zwischenstellen, 2 px statt 4 px breite Scheiben) — sie
malt nicht anders. Ich hatte zwischendurch den teuren Zeichenweg als Feinstufe eingebaut: 2,0 s je
Bild, also zehn Minuten je Clip — **und man sieht davon nichts**, weil sich die Scheiben nicht
überlappen und „Farbig abwedeln" Bildpunkt für Bildpunkt rechnet. Gemessen jetzt: 16,7 ms je Bild auch
bei Vollkreis und dickem Strahl, also 5 s für einen Zehnsekünder. Der Schalter trägt später die
Gottesstrahlen (§9b.2).

## Medien-Panel: „Auf Suno“ statt „Von Suno“ (14.09.2026)

Caspar_D: *„VON SUNO -> AUF SUNO“* · *„Privat — wird Sunos vorgezogen -> AUF KLANGTRESOR
ERGÄNZT — dominiert die Suno-Daten“* · *„bei leeren Suno Medien-Platzhaltern auch das
Suno-Abzeichen drauf machen und den Song ansteuern, damit man dort ein Video/Bild anfügen
kann“* · *„aber auch wenn eine caption da ist, vielleicht will ich die ja ändern auf Suno“*.

**Der Wortwechsel ist der eigentliche Entwurf.** „Von Suno“ beschreibt eine Herkunft, „Auf
Suno“ einen Ort, an den man gehen kann. Damit wird aus der linken Hälfte ein **Fenster statt
einer Vitrine** — und erst dadurch ergibt es Sinn, das Abzeichen auch auf die leeren Plätze zu
setzen. Die beiden Hälften haben jetzt je ein Verb: links **öffnen**, rechts **hinzufügen**.

| vorher | jetzt |
|---|---|
| Beschreibung | **Kurzbeschreibung (Caption) auf Suno** — Abzeichen auch am vollen Kasten |
| „keine Beschreibung“ | **„Keine Suno-Caption vorhanden“** |
| Notiz — bleibt lokal | **eigene Werknotiz (bleibt in KlangTresor)** |
| Tonfassung | **ersetzende Tonfassung**, darunter klein der Satz, was das heißt |
| „Tondatei hierher ziehen“ | **„eine bessere Tondatei hierherziehen“** |
| Bewegtbild ohne Video: das Wort „keins“ | **das Titelbild schwach dahinter** (20 %, entsättigt) |
| leere Suno-Kachel | **Rahmen + Suno-Abzeichen**, das auf den Titel zeigt |

`sunoZeichen(id, titel)` nimmt jetzt einen eigenen Hinweistext, damit jedes der drei Abzeichen
sagt, was sich dort ändern läßt.

**Mitbehobener Fehler:** die Fehlerbehandlung des Videos setzte `textContent='keins'` und löschte
damit den ganzen Kachelinhalt **samt Suno-Abzeichen**. Bei jedem Titel ohne Bewegtbild fehlte
also der Weg nach Suno — genau dort, wo man ihn braucht. Jetzt `this.remove()`.

**Nicht in die Kachel, sondern darunter:** der Erklärsatz zur Tonfassung brach in der schmalen
Spalte (ein Sechstel der Galerie) auf zehn Zeilen um. Er steht als Kleingedrucktes unter dem
Untertitel.

## Der Container startet jetzt sofort (14.09.2026)

`docker/docker-entrypoint.sh`: das Nachladen der Modelle steht in einer Funktion `nachladen`,
die mit `&` **neben** dem Server läuft; `exec "$@"` kommt sofort. Bis dahin lief es davor — der
Server startete erst, wenn rund 1 GB geladen war, und die Seite antwortete solange gar nicht.
Tarja saß zwei Minuten vor einer stummen Adresse und hielt es für kaputt. Der Kommentar im Kopf
behauptete schon vorher das Richtige (*„die Website soll trotzdem laufen“*) — er galt nur für den
FEHLSCHLAG, nicht fürs Warten. `init: true` in der compose-Datei setzt tini als PID 1 und räumt
den Nachlader auf.

## Windows-Testlauf mit Docker — was ein Fremder erlebt hätte (14.09.2026)

Caspar_D hat den Docker-Weg unter Windows durchgespielt (Parallels-VM). Zweieinhalb Stunden, vier
Stellen, an denen ein Fremder aufgegeben hätte. Sein Fazit: *„dieser ganze Computerscheiß kotzt
mich nur noch an“* — und: *„eigentlich sollte das Ding direkt unter Windows installiert werden.“*

**Gebaut** in `bin/einrichten-docker.ps1`:
- **Es schreibt alles mit** (`einrichten-docker.log` neben dem Skript). Vorher stand die Ausgabe
  nur im Fenster: *„das läuft einfach durch und ich kann nicht in cmd scrollen.“*
- **Docker Desktop wird auch ohne Administrator gefunden** (`%LOCALAPPDATA%\Programs\DockerDesktop`).
  Vorher suchte das Skript nur unter `C:\Program Files` und hätte „nicht gefunden“ gesagt,
  obwohl es installiert war.
- Antwortet Docker nicht, nennt es die zwei Windows-Features und `wsl --install`.

**Ausdrücklich NICHT gebaut** — Caspar_D: *„versuch jetzt nicht die ganzen
virtualisierungsbesonderheiten abzufedern … bin nur ich betroffen, ich wollte nur testen.“* Die
Ursache seines Ausfalls lag drei Schichten tief: die VM reichte kein VT-x weiter, deshalb konnte
Windows WSL 2 nicht anbieten, deshalb hatte Docker keinen Unterbau, deshalb antwortete die Pipe
mit HTTP 500. Keine der beteiligten Meldungen sagte das. Für Nutzer auf echtem Blech ist der Fall
irrelevant.

**Offen geblieben:**
- `failed to execute bake: exit status 1` — die Meldung, die nichts mitteilt, und unser „Die
  Meldungen oben sagen warum“. Sie sagen es nicht.
- Elf Minuten „sending tarball“: es lief ein Bau-Container (`moby/buildkit`), statt daß Docker
  Desktops eingebauter Bauer direkt in die Engine schreibt — 3,5 GB wandern einmal hin und zurück.

**Und eine Lehre für die Anleitung:** für Nutzer gibt es **genau eine Adresse**, und das ist die
Release-Datei `https://github.com/CasparDavi/klangtresor/releases/latest/download/KlangTresor.zip`
— flach, feste Adresse. Der Quellcode-Download von GitHub entpackt in
`klangtresor-main/klangtresor-main` und ist über diese doppelte Schachtel schon zweimal zur Falle
geworden.

**Im Release-ZIP v1.0.5 liegen Meßstände mit eigenen Daten** (49 Song-IDs in `docs/eichkasten/`
und `labor/`, dazu `messlauf-ergebnis.json` mit Kondensat- und Volltextfeldern, hartkodierte
Mac-Pfade, der Vorname in `docs/EINRICHTUNG-TEXTE.md`). Die Verbotsliste in `bin/paket.js` fängt
nur `docs/eichkasten/vorher-vektoren/` und `*.vor-schritt`. Caspar_D dazu: *„ist mir egal, seh ich
jetzt nicht so kritisch, können wir irgendwann mal aufräumen.“* — also **offen, nicht dringend**.

## „geheim/“ ist getilgt (14.09.2026)

Caspar_D, zum vierten Mal: *„geheim/ hat keinerlei Nutzen, weil der Clerk-Token nur eine Stunde
gültig ist, er sollte mal darin stehen, tut er aber nicht … Lösche endlich sämtliche Referenzen
darauf, auch aus gitignore.“*

**Null Treffer im ganzen Repo**, Labor eingeschlossen. 15 Dateien: `.gitignore` (der ganze Block),
`.dockerignore`, beide Dockerfiles (`mkdir`/`chown`), `bin/paket.js` (Verbotsmuster),
`bin/export.js`, `bin/fremdstand.js` (Prüfmuster jetzt nur `^library/`), `server/server.js` (der
Grabsteinkommentar) und sieben Dokumente.

Der Befund war eindeutig: **null Commits über alle Zweige**, im Arbeitsverzeichnis nicht vorhanden,
und `docs/suno/WEGE.md` hatte selbst *„leerer Ordner“* notiert. Die Sperren bewachten etwas, das es
nie gab. Die Begründung, die sie stehenließ, lautete „sie kosten nichts“ — das stimmte für die
Rechenzeit und war falsch für alles andere: sie haben den Gedanken am Leben gehalten, da läge ein
Schlüssel. Die Begründung steht jetzt als Nachtrag in `docs/suno/WEGE.md`, ohne den Namen.

## Streiflicht — die Tiefenkarte wird beleuchtet (14.09.2026)

Caspar_D: *„wenn Laser von einer seite kommt, wo in der tiefenmap eine vorwölbung ist, müßte
eigentlich ein Kantenblitz entstehen, wohingegen wo die tiefenmap flieht, eher schatten zu sehen
sein müßte"* — und zur offenen Frage, woher die Lichtrichtung kommt: *„von der Lichtquelle aus
gesehen würde ich denken."* Das war die Entscheidung; gebaut ist Weg (a).

**Die Leuchte meldet ihren Ort, während sie malt.** Der Lichtpuffer sagt, WIEVIEL Licht
irgendwo ankommt — aber nicht, aus welcher Richtung. Das weiß nur die Leuchte selbst, und zwar
genau in dem Augenblick, in dem sie zeichnet. Also trägt sie es dort ein (`LICHTORTE`,
`lichtOrtMelden`): der Scheinwerfer seinen Ursprung, der Laser seinen Fächerpunkt (der liegt
außerhalb des Bildes — genau die streifende Lage), die Lichtstrahlen ihren Punkt, das Feuer seine
Mitte über dem Boden. Das Stroboskop meldet nichts: es leuchtet von überall. Gewichtet wird mit
der Helligkeit — bei mehreren Leuchten zieht die hellste die Richtung.

**Gemessen** (Laser von links, additiv gerechnet, damit das Abwedeln die Zahlen nicht verbiegt) —
Beitrag des Streiflichts nach `dot(Normale, Licht)`:

| 0,0–0,2 | 0,2–0,4 | 0,4–0,6 | 0,6–0,8 | 0,8–1,0 |
|---|---|---|---|---|
| +0,08 | −0,11 | +0,32 | **+1,40** | **+2,69** |

Streng steigend, null wo die Fläche weggedreht ist, Spitze +61,8 Graustufen. Caspar_D am Bild:
*„am oberarm von ihr funktioniert es, sehr geil."*

**Zwei Vorkehrungen gegen die geschätzte Karte.** Der Schlagschatten dunkelte anfangs das ganze
Bild um 1,9 Graustufen ab, auch auf Flächen, die dem Licht voll zugewandt sind: eine monokular
geschätzte Karte rauscht, und jedes Rauschkorn galt als Verdecker. Jetzt fängt der Marsch erst
beim dritten Schritt an und trägt einen Vorhalt von 0,035 — erst eine echte Vorwölbung wirft
Schatten. Der Anstieg ist flacher: eine geschätzte Karte gibt keine harte Schattenkante her, und
eine harte Kante wäre hier gelogen (Regel 16).

**„Einfall" ist die dritte Achse** und geht von −1 bis +1: links hinter die Bildfläche
(*„auch leicht hinter der Bildfläche, wäre als effekt interessant"*) — dann fällt alles aus, was
der Kamera zugewandt ist, und nur die Silhouette bleibt stehen, also Gegenlicht. Mitte streifend,
rechts frontal. Ein Regler, drei Lichtsetzungen, und es ist ein Vorzeichen, kein zweiter Effekt.

**Ein Meßfehler, der festgehalten gehört:** die erste Messung ergab überall negative Werte. Das
war nicht der Effekt, sondern der Rauschboden — die Quelle dieses Titels bewegt sich, dieselbe
Lage 0,9 s später weicht im Mittel um **1,62 Graustufen** ab, 12,2 % der Punkte um mehr als 3.
Auf einer bewegten Quelle muß paarweise gemessen werden (an-Bild und aus-Bild rund 70 ms
auseinander), sonst mißt man die Bewegung.

## Laser-Punkte — das Beugungsgitter (14.09.2026)

Caspar_D: *„es gibt doch diese punktuellen Laserdots, die einfach in die Tanzfläche gestreut
werden, die finde ich total geil."* Keine neue Karte, sondern die **dritte Bauart am
Laserstrahl** — damit erbt sie Farbe, Ursprung, Auffächern, Flimmern, Austasten, das
Lichtmischpult und vor allem das Malen in den Lichtpuffer.

Gerechnet wird eine **Ebene im Raum**, nicht ein Muster auf der Scheibe: das Raster dreht sich um
seine Achse, kippt um die Waagerechte und wird perspektivisch geworfen. Der Fluchtpunkt kommt
daher von selbst. Drei Regler: Punkte je Reihe, Neigung (0 Wand, 1 Boden), Drehen.

**Gemessen** bei 12 Punkten je Reihe, Neigung 0,75: alle **144 von 144** im Bild, Punktgröße von
der vordersten zur hintersten Reihe **2,24 → 1,09**, Abstand **56,6 → 27,4 px** — beides Faktor
**2,07**. Vorher, ohne Verankerung, wuchs die Perspektive nach vorn ins Unendliche und **106 von
144 Punkten flogen aus dem Bild**; jetzt ist die vorderste Reihe der Maßstab (`w = 1 + (Z +
sin(Neigung))`). Gezeichnet wird EIN vorgerechnetes Punktbild als Kopie, nicht je Dot ein Verlauf.

### Die Tiefenstufe — gebaut am selben Abend

Der dritte Verbraucher der Tiefenkarte nach Filmnebel und Streiflicht. Vier Schritte, jeder aus
einem Satz von Caspar_D:

**1. Die z-Skalierung.** *„da mußt du aber jetzt die richtige z-skalierung hinkriegen, das ist
nicht einfach."* Die Karte ist relativ, nicht gemessen: auf diesem Cover liegen 52 % der
Bildpunkte im fernen Drittel und 11 % im nahen, beim nächsten ist es umgekehrt. Ein fester Faktor
auf den Rohwert trifft überall etwas anderes. Deshalb wird je Titel auf die **eigene Spanne**
gedehnt — 5. bis 95. Hundertstel, damit Ausreißer sie nicht auffressen. Danach heißt 0 „am
fernsten, was dieses Bild hat" und 1 „am nächsten", und ein Regler bedeutet überall dasselbe.

**2. Das Raster erreichte den Vordergrund gar nicht.** Gemessen: es deckte `y 321…655` ab, der
nächste Tiefenbereich hat seinen Schwerpunkt bei `y 798`. Im Band 0,60–1,00 lag **kein einziger
Punkt**. Jetzt liegt die nächste Reihe unten und das Raster läuft nach oben zum Horizont zusammen.

**3. Ellipsen statt Scheiben.** *„die regelmäßigkeit muß aus der seitlichen perspektive auch
brechen, weil Oberflächen teilweise curvy sind."* Ein Punkt auf einer gewölbten Fläche trifft
schräg auf und wird entlang des Gefälles gestreckt — um 1/cos des Auftreffwinkels, also `1/N.z`,
mit derselben Normale wie beim Streiflicht. Dieselbe Lichtmenge auf mehr Fläche heißt dunkler.
Und wo die Fläche vom Strahl **wegkippt**, kommt gar kein Punkt an — das bricht das Raster an den
Silhouetten, nicht der Versatz. Gemessen, Anteil länglicher Flecken (>1,5:1): **fern 34 %,
mittel 47 %, nah 59 %** — je näher und gewölbter, desto mehr Ellipsen.

**4. Die Reichweite.** *„hinten muß die länge der strahlen so sein, dass sie es nicht mehr
erreichen, so vermeidet man punkte im Himmel."* Braucht keinen neuen Regler — **„Länge" ist
das schon**. Gemessen, helle Punkte im Himmel (oberes Drittel und fernstes Viertel, 148.161
Bildpunkte):

| Länge | im Himmel | im ganzen Bild |
|---|---|---|
| 1,6 (volle Reichweite) | 300 | 20.450 |
| 0,95 | **0** | 10.813 |
| 0,5 | 0 | 423 |

Der Rand ist weich, nicht geschnitten (Regel 16).

Dazu **ein Regler, der einer bleiben muß: „Aufsetzen".** Der Abstand zwischen Leuchte und Kamera
geht aus einem flachen Bild nicht hervor — es gibt dafür keine Grundwahrheit. Er skaliert alle
Folgen zugleich: Größe, Helligkeit, Versatz und Streckung. 0 heißt: das Raster liegt auf der
Scheibe wie vorher.

## Glühwürmchen und Schmetterlinge (14.09.2026)

Caspar_D: *„magst du bei partikeln noch Glühwürmchen und Schmetterlinge einfügen — unberechenbare
Eigenbewegung."* Zwei neue Arten und ein neuer Regler, der allen Arten offensteht.

**„Eigenbewegung" ist der eigentliche Zusatz.** Schnee hat keine: er fällt, wohin der Wind ihn
trägt. Ein Tier entscheidet selbst. Gerechnet wird sie als **drei Schwingungen mit verschiedenen
Raten**, je Teilchen anders verschoben — das Auge findet darin kein Muster. Und weil jede Rate
durch `lpW` auf die Clipdauer gerastet wird, steht nach einem Durchlauf jedes Tier wieder da, wo
es angefangen hat: **der Export loopt.** Echter Zufall täte das nicht — das ist der Grund, warum
hier keiner steht.

**Glühwürmchen** leuchten nicht dauernd, sie **blinken**, jedes mit eigener Rate und eigener
Phase (auch die gerastet). Das unterscheidet sie von einem hellen Punkt. Weicher Hof plus harter
Kern, warmes Gelbgrün, wenige und klein, steigen langsam.

**Schmetterlinge** flattern: die Flügel öffnen und schließen, der Körper taumelt mit. Zwei
Ellipsen und ein Strich — mehr sieht bei acht Bildpunkten ohnehin niemand. Bunt (Farbstreuung
0,85), wenige und groß.

Der Artwechsel trägt die Eigenbewegung mit — je Schlüssel geprüft, je Schlüssel gesetzt, wie bei
Farben und Gewicht (Regel 6d). Wer sie von Hand gedreht hat, behält seinen Wert.

## Teilchen bekommen eine Tiefe (14.09.2026)

Caspar_D: *„können wir bei partikeln wirklich härter sagen, ab welcher vertikalen ebene im Bild
sie nicht mehr zu sehen sein sollen, gerade hinten leuchtet z.T. noch nach vorne durch Objekte
hindurch."*

**Beides ist dieselbe Frage.** Ein Teilchen leuchtet durch eine Figur, weil es keine Tiefe hat.
Es bekommt hier eine — aus der **Bildzeile**, in der es steht: am Horizont fern, unten nah. Steht
die Szene an dieser Stelle näher, ist etwas davor, und das Teilchen verschwindet. Zwei Regler:

- **Horizont (0 oben)** — ab welcher Zeile nichts mehr zu sehen ist. Der Schnitt ist schmal (drei
  Hundertstel der Bildhöhe), aber nicht hart: was innerhalb des Bildes aufhört, hört weich auf
  (Regel 16).
- **Von Objekten verdeckt** — wie stark die Tiefenkarte sie wegnimmt.

Beide Vorgabe 0, damit kein bestehendes Rezept anders aussieht.

**Gerechnet wird nicht je Teilchen, sondern einmal als Maske.** Die Tiefe hängt nur an der Zeile,
also ist die Sichtbarkeit eine reine Funktion des Ortes — die kann man hinlegen und
wiederverwenden. Drei Masken werden behalten; wer am Regler zieht, erzeugt sonst ein Dutzend zu je
vier Byte pro Bildpunkt. Die Teilchen malen dafür auf eine eigene Leinwand, die Maske schneidet
dort einmal, dann geht das Ganze mit der Verrechnung des Effekts aufs Bild.

**Gemessen** (Glühwürmchen, 260 Stück, paarweise gegen den Rauschboden):

| | ohne | mit (Horizont 0,45 · Verdeckung 1,0) |
|---|---|---|
| oberhalb des Horizonts | 0,318 | **−0,009** |
| unterhalb | 2,493 | 1,492 |
| wo die Szene **näher** ist als das Teilchen | 2,654 | **0,098** |
| wo sie ferner ist (freie Sicht) | 1,467 | 1,663 |

Oberhalb der Linie bleibt nichts, vor Objekten verschwinden 96 %, bei freier Sicht bleibt alles.


## Loopfähigkeit aller 38 Effekte — am Code gelesen, noch nicht gemessen (14.09.2026)

Caspar_D: *„analysierst du bitte, ob alles im 10sec Export loopfähig ist"* — und der Verweis auf
VIDEO-PLAN §6.8 (vier Klassen) und §6.7 (Übergänge nach Nahtquotient). Gelesen von sechs
Gruppenlesern plus einem Leser für die gemeinsame Zeitmaschinerie, jede Gruppe gegengeprüft.
**Das ist Code-Lesung, keine Messung** — die Nahtquotient-Reihe (§6.8) steht noch aus.

**Ergebnis:**

| | Effekte |
|---|---|
| **exakt** (8) | Fahrt, Farbschleier, Scanlines, Linse, Spiegelung, Bildlauf, Beschlag, Tropfen laufen |
| **unsichtbare Naht**, Zufall je Bild (3) | Rauschausfall, Filmkorn, Glitch-Blöcke |
| **Vorgabe loopt, Regler kann brechen** (17) | 7 Pulse, Farbkanal-Puls, Bloom, Stroboskop, Lichtstrahlen, Feuer (alle über `antriebWert`: Form *flackern*, Teiler 2/4/8 bei unteilbarer Schlagzahl, Titel ohne Takt) · Partikel (Staub immer, Schwaden ohne Quelle, Windstöße) · Laufstreifen *beide* bei ungerader Periodenzahl · Verwackeln-Kick bei ungerader Schlagzahl · Sicherungswackeln (Einbruch über der Naht) · Risse *im Takt* |
| **bricht schon in der Vorgabe** (10) | Scheinwerfer + Schatten (*wandernd*: y-Term `ph*1.3`), Laserstrahl (*wandern*: `cos(w*0.8)`; Punkte `drehen` rohes t; Scanner-Sprung), Streiflicht (erbt jede Leuchte im Lichtpuffer), Filmnebel (Schwaden > 0), Wellen, Kaustik, Flammen (rohes `u_t`), Tropfen treffen (Hash am Rasterindex, nur 2 Takte Vorlauf), Nachzieheffekt |

**Quelle zufall** bricht mit Raster *nicht* (Naht liegt auf einem Schlag, dort wird ohnehin neu
gewürfelt) — Gegenprüfung hat das korrigiert.

**Befunde in der gemeinsamen Maschinerie, schwerer als jeder Einzeleffekt:**

1. **Bewegtbild als Quelle loopt nie** — `quelleSync` setzt das Video nur bei `uhrEcht` nach.
2. **`Math.max(1,…)` in `lpR/lpP/lpV`** (Z. ~27473): Export weicht sichtbar von der Vorschau ab.
   Wind links → fliegt rechts; Wind 0 → eine Bildbreite je Clip; Staub/Glühwürmchen/Tropfen bis
   8× zu schnell, alle gleich schnell. Der Kommentar „höchstens ein Prozent" stimmt bei L ≤ 10 s
   nicht (Raster 1/L → bis ±50 %).
3. **`rahmen()` malt während des Exports weiter** auf denselben Effektobjekten → Nachzieh-Spur
   wird zerrissen.
4. **Titel mit < 3 Einsen:** `raster()` gibt die echten Schläge zurück, L=10 s liegt auf keinem.
5. **Statuszeile:** Kodierweg meldet immer „nahtlos"; `LOOP_NEIN` hat totes `dunst`, kein
   `filmnebel`, und prüft nur den Typ.

**Reparaturen nach §6.8 (alle hinter `LOOP>0`, Vorschau unverändert):** rohes t → lp-Helfer
(Einzeiler) · Hash-Indizes modulo Perioden im Clip (Klasse 4) · Taktzahl in `ausschnitt()` so, dass
die Schlagzahl durch 8 teilbar ist · Raster mit Vorlauf ≥ 30 s · Shader: Wabern über `noise4D`
(Zeit auf dem Kreis), gerichtete Drift (Steigen, Aufwind, Luftzug) über ein Nahtfenster von einem
halben Takt (§6.3, für Nebel/Textur zulässig) · Nachzieh: Vorlaufrunde + Spur vom Live-Rahmen
trennen · Risse *im Takt*: im Export ausgewachsen wie *mit der Zeit* · Video bildgenau setzen ·
`loopNein(e)` je Karte statt Typliste. **Noch nichts gebaut — wartet auf Caspar_Ds Wort.**

Rohbefund mit Zeilennummern: Workflow `wf_721af253-541`, journal.jsonl im Sitzungsordner.

## Loop-Reparatur gebaut und gemessen (14.09.2026)

Caspar_D: *„es muss halt der effekt wieder zum Ursprung zurückkehren auf dem letzten frame"* — und
zu den Rissen: *„was wachsendes nicht ploetzlich wieder kleiner werden sollte"*. Gebaut in fünf
Gruppen (Zeitmaschinerie, Leuchten, Partikel, Störungen, Shader), danach eine Gegenprüfung mit 30
Randfällen und eine Nachbesserung, danach eine unabhängige Kontrollmessung aller Fälle. Alles hängt an
`LOOP>0`; die Vorschau ist in allen 85 Fällen mit Vergleichsbild bitgleich (`vorschauRegression` 0).
Zusammenfassung der Verfahren: VIDEO-PLAN §6.8 „Nachtrag: gebaut", neue Regel 17 in
EFFEKTCLIP-REGELN.

**Ergebnis:** 170 Fälle, keiner mit `gleich` ≥ 1 (Maximum 0,09, Nachzieheffekt mit Nachhall 0,9). Vorher brachen
41 der 85 Grundlinienfälle. `gleichFolge` > 0 nur unter einer Graustufe (Scanlines, Nachzieh,
Blätter, Einschlag ohne Eins). **Jeder Fall mit Quotient ≥ 1 hat `naht` = `erwartet`**: die Naht
liegt auf einem gewöhnlichen Schlag, Puls oder Glitch — der Loop ist exakt, der Quotient sieht nur
den Sprung. Konsolenfehler: keine.

### Grundlinienfälle (Stand bdbb44c gegen nachher)

`gleich` ist das Schlechtere aus `gleich` und `gleichFolge`.

| Fall | Quotient vorher | nachher | gleich vorher → nachher |
|---|---|---|---|
| fahrt | 0,92 | 0,92 | 0 → 0 |
| puls | 1,02 | 1,02 | 0 → 0 |
| schaerfe | 1,09 | 1,09 | 0 → 0 |
| kontrast | 1,09 | 1,09 | 0 → 0 |
| helligkeit | 1,09 | 1,09 | 0 → 0 |
| saettigung | 1,11 | 1,11 | 0 → 0 |
| farbe | 0,26 | 0,26 | 0 → 0 |
| licht | 1,81 | 1 | 98,7 → 0 |
| schatten | 2,5 | 1,74 | 96,2 → 0 |
| laser | 1,99 | 0,73 | 63,1 → 0 |
| streifen | 0,96 | 0,96 | 0 → 0 |
| rauschen | 0,82 | 1,05 | 20,8 → 0 |
| vlauf | 0,85 | 0,85 | 0 → 0 |
| wackeln | 1,03 | 1,1 | 63,9 → 0 |
| rgb | 1,06 | 1,06 | 0 → 0 |
| strobe | 0 | 0 | 0 → 0 |
| sicherung | 0 | 0 | 59,5 → 0 |
| streiflicht | 0 | 0 | 0 → 0 |
| filmnebel | 6,1 | 0,18 | 3,1 → 0 |
| partikel | 0,54 | 0,47 | 0 → 0 |
| scanlines | 0,57 | 0,57 | 0 → 0,03 |
| bloom | 0 | 0 | 0 → 0 |
| nachzieh | 40,77 | 0,11 | 37,6 → 0,06 |
| feuer | 0,72 | 0,72 | 0 → 0 |
| wellen | 6,08 | 0,91 | 108,1 → 0 |
| kaustik | 1,72 | 0,69 | 49,8 → 0 |
| linse | 0 | 0 | 0 → 0 |
| flammen | 1,12 | 0,87 | 56,7 → 0 |
| strahlen | 0,49 | 0,49 | 0 → 0 |
| spiegel | 0,89 | 0,89 | 0 → 0 |
| risse | 0 | 0 | 0 → 0 |
| beschlag | 0 | 0 | 0 → 0 |
| einschlag | 1,5 | 1,58 | 24,9 → 0 |
| tropfen | 0,58 | 0,65 | 0 → 0 |
| korn | 0,99 | 0,93 | 7,1 → 0 |
| bloecke | 0 | 0 | 0 → 0 |
| farbton | 1,11 | 1,11 | 0 → 0 |
| kippen | 1,04 | 1,04 | 0 → 0 |
| puls-flackern-takt | 0,85 | 0,66 | 129,9 → 0 |
| puls-flackern-hz05 | 1,36 | 0 | 141,5 → 0 |
| puls-teiler8-a | 9,72 | 9,72 | 0 → 0 |
| puls-teiler8-b | 4,29 | 4,54 | 68,2 → 0 |
| puls-zufall | 0 | 0 | 118,2 → 0 |
| puls-ohneEins | 0,88 | 1,02 | 124,2 → 0 |
| strobe-ohneEins | 0 | 1 | 77 → 0 |
| puls-ohneSchlaege | 0,4 | 0,4 | 0 → 0 |
| puls-zufall-ohneSchlaege | 0,91 | 0 | 143,1 → 0 |
| strobe-ohneSchlaege | 0 | 0 | 77 → 0 |
| feuer-flackern | 0,52 | 0,5 | 15 → 0 |
| licht-fahrt | 1,92 | 1,05 | 96,8 → 0 |
| licht-schritt | 1,35 | 0,86 | 104,3 → 0 |
| licht-bogen | 0,94 | 0,94 | 0 → 0 |
| laser-wandern-scanner | 1,09 | 0,85 | 11,8 → 0 |
| laser-wandern-punkte | 1,24 | 0,37 | 10,5 → 0 |
| laser-wandern-punkte-drehen0 | 1,29 | 0,29 | 10,5 → 0 |
| laser-fest-punkte | 2,28 | 0,86 | 5,8 → 0 |
| laser-fest-punkte-drehen0 | 1,43 | 1,43 | 0 → 0 |
| laser-fest-gitter | 0,98 | 0,98 | 0 → 0 |
| laser-scanner-sprung-hz | 1,28 | 0 | 13,9 → 0 |
| laser-scanner-sprung-takt | 0,32 | 0 | 20,6 → 0 |
| streiflicht-licht | 1,91 | 0,98 | 127,3 → 0 |
| streiflicht-laserfest | 0,97 | 0,97 | 0 → 0 |
| partikel-regen | 0,53 | 1,04 | 0 → 0 |
| partikel-asche | 0,49 | 0,39 | 0 → 0 |
| partikel-funken | 0,69 | 1,07 | 0 → 0 |
| partikel-blasen | 0,69 | 0,82 | 0 → 0 |
| partikel-blaetter | 0,67 | 0,45 | 0,1 → 0,04 |
| partikel-staub | 0,43 | 0,53 | 0,8 → 0 |
| partikel-schwaden | 0,33 | 0,29 | 4 → 0 |
| partikel-gluehwuermchen | 0,92 | 0,86 | 0 → 0 |
| partikel-schmetterling | 0,5 | 0,92 | 0 → 0 |
| partikel-schwaden-quelle | 0,57 | 0,57 | 0 → 0 |
| partikel-boeen | 1,21 | 1,52 | 68,7 → 0 |
| partikel-wind-06neg | 0,54 | 0,45 | 0 → 0 |
| partikel-wind0 | 0,54 | 0,76 | 0 → 0 |
| streifen-beide | 24,93 | 0,92 | 73,5 → 0 |
| sicherung-frei-lang | 0,07 | 0,26 | 22,4 → 0 |
| sicherung-takt-800 | 0 | 0 | 0 → 0 |
| bloecke-frei | 0 | 0 | 19 → 0 |
| wackeln-kick-ungerade | 0,96 | 0,85 | 66,3 → 0 |
| filmnebel-schwaden0 | 0 | 0 | 0 → 0 |
| risse-takt | 10,78 | 0 | 5,4 → 0 |
| einschlag-bleiben30 | 1,75 | 1,06 | 29,4 → 0 |
| nachzieh-09 | 18,19 | 0,18 | 43,1 → 0,09 |
| filmnebel-licht | 2,75 | 0,99 | 176,5 → 0 |

### Neue Fälle (ohne Grundlinie), nach Typ der ersten Karte

Gruppen `zeit`, `leuchten`, `partikel`, `stoerungen2`, `shader`, `linse`, `raender`, `nachbesserung`.

| Typ | Fälle | Quotient | gleich (max) |
|---|---|---|---|
| puls | 13 | 0 … 19,01 | 0 |
| strobe | 2 | 0 … 0 | 0 |
| feuer | 1 | 0,49 … 0,49 | 0 |
| nachzieh | 4 | 0 … 2,1 | 0,064 |
| licht | 9 | 0,38 … 5,03 | 0 |
| schatten | 1 | 1,24 … 1,24 | 0 |
| laser | 4 | 0 … 1,02 | 0,001 |
| streiflicht | 1 | 0,32 … 0,32 | 0 |
| partikel | 9 | 0,18 … 1,11 | 0 |
| tropfen | 3 | 0,5 … 1,92 | 0 |
| rauschen | 1 | 0,5 … 0,5 | 0 |
| korn | 1 | 0 … 0 | 0 |
| wackeln | 2 | 1,11 … 1,18 | 0 |
| bloecke | 1 | 1,52 … 1,52 | 0 |
| sicherung | 2 | 0,63 … 1,21 | 0 |
| einschlag | 3 | 0 … 2,28 | 0,048 |
| risse | 3 | 0 … 1,24 | 0 |
| streifen | 2 | 0,69 … 0,92 | 0 |
| filmnebel | 17 | 0 … 1,58 | 0 |
| wellen | 1 | 1,02 … 1,02 | 0 |
| kaustik | 2 | 0,55 … 0,78 | 0 |
| flammen | 3 | 1,11 … 8,56 | 0 |

Hohe Quotienten bei `gleich` 0 (rand-nurEinsen-puls 19,0, rand-flammen-kurz 8,6, in der Grundlinie
puls-teiler8-a 9,7): Puls auf dem Schlag, `naht` = `erwartet`.

### Was bewusst vom Pult abweicht

- **Tempo gerastet:** `lpR/lpP/lpW` auf ganze Umläufe (Vorzeichen und Stillstand bleiben), `lpV`
  ohne Mindestumlauf. Sehr langsame Laufstreifen und Lichtbögen laufen dadurch bis 3,3-mal so schnell.
- **Scheinwerfer/Schatten *wandernd*, Laser-Ursprung:** unter einem Umlauf je Clip pendelt die Achse
  (`lpBahn`) mit mittlerem Vorschau-Tempo, darüber rastet sie ein. *Fahrt*: mindestens zwei Ziele je
  Clip, kürzeres Stehen. Laser-Punkte drehen in ganzen Vierteldrehungen. Scanner-Sprung verglimmt am
  Clipanfang die Stange K−1.
- **Antrieb:** Flackern auf einem Ring (Oktaven 3/7/16), andere Werte als im Pult. Zufall, Teiler-Gruppen
  und Windstöße würfeln an der umlaufenden Nummer, zählen ab Clipanfang. Titel ohne Einsen: gleichmäßiges
  4er-Raster aus dem Median-Abstand. Teiler 8 kann den Clip kürzen (Titel b: 6,7 statt 8,4 s).
- **Rauschshader:** 4D-Rauschen mit der Zeit auf dem Kreis, Drift in zwei Lagen, anderes Muster zur
  gleichen Songzeit (vorschauAbw Kaustik 24, Wellen 12–17), Tempo und Richtung echt.
- **Partikel/Tropfen:** Lebensdauer genau L, echtes Tempo, Überblendung zum Ursprung einmal je Clip.
- **Zufall je Bild** (Rauschausfall, Korn, Wackel-Zittern): gesäte Folge statt `Math.random`.
- **Gedächtnis:** Nachzieh-Bild 0 zeigt die Spur des Clipendes. Risse *im Takt* stehen ausgewachsen.
  Titel mit 1–7 Schlägen ohne Takt: Risse, Einschlag und Schritt stehen im Zustand am Ende der längsten
  schlagfreien Strecke; der Antrieb läuft auf seiner Frequenz.
- **Laufstreifen *beide*:** Tempo wie *hell*; bei ungerader Durchlaufzahl tauschen hell und dunkel
  einmal je Clip weich über 1,2 s.
- **Pult:** während des Exports ein Standbild, Video-Knopf sofort gesperrt, Öffnen eines anderen
  Titels wartet aufs Video. Neue Statussätze: „bereite die Spur vor", „ruckt zweimal in dieselbe
  Richtung", „zu wenige Schläge für einen Takt", „das Video darunter läuft nicht im Kreis".

### Offen — Caspar_D entscheidet

1. **Antrieb bei 1–7 Schlägen ohne Takt** läuft auf der Frequenz (tempoVerh 2,7–3,0), die Vorschau
   pulst nur auf den wenigen Schlägen. Einfrieren wie Risse/Einschlag/Schritt?
2. **Teiler-Lockerung** wählt Teilbarkeit vor Länge (puls-teiler8-dreiviertel: 5,03 s mit M 12 statt
   7,57 s mit M 18). Lieber die längere?
3. **Laufstreifen *beide*, ungerade:** weicher Farbtausch einmal je Clip — oder gerade Zahl, doppeltes Tempo?
4. **Fahrt:** Zielwechsel alle 4,75 statt 8 s (Tempo 8, L 9,5) — oder stehender Fleck?
5. **Schritt auf der Eins:** A ist der Schlag vor der Eins, nicht die vorige Eins; der Fleck springt an
   jeder Eins (auch im Pult).
6. **Schwaden bei Tempo 0,2:** Überblendung je Clip hebt tempoVerh auf 2,42 — am Bild ansehen.
7. **Rauschshader-Tempo** gegen den alten Export: Filmnebel +11 %, Flammen +6 bis 11 %, Wellen +7 %.

### Offen — technisch

- **Bewegtbild als Quelle** loopt nicht (nur ehrlich gemeldet; `currentTime` je Bild ist ungebaut).
- `lpBahn` rundet zwischen 1 und 1,5 Umläufen auf 1 (bis 1,5×); Bogen, Schwenk und Laser-Richtung
  laufen über `lpP` mit Mindestumlauf (Tempo 16, L 9,5: 1,7×). Nicht angefasst.
- Partikel mit Quelle (`flugbahn`): `tau=lpP(…)` kürzt lange Leben, die Fahne wird kürzer.
- Taumeln, *wandern*, Glühwürmchen-Blinken und Flügel sind im Umbruch-Weg weiter gerastet.
- Leistung der Shader-Exportform nur in SwiftShader gemessen (1,2–1,5×); auf der GPU eher mehr.
- Nicht im Prüfstand messbar, nur gelesen: MediaRecorder-Zeitstempel nach dem Vorlauf, Doppelklick-Sperre,
  `oeffnen()`/`schliessen()` während des Exports, die neuen Statussätze, Rückfall ohne noise4D.
- 85 neue Fälle haben noch kein Vorschau-Vergleichsbild (`--vorschau-speichern` einmal nachziehen).

### Wie man misst

```bash
node labor/nahtpruefung/syntax.js                                   # Inline-Skripte bauen
node labor/nahtpruefung/naht.mjs --jobs 4 --aus labor/nahtpruefung/ergebnis-nachher.json \
     --vorschau-vergleich labor/nahtpruefung/vorschau-vorher.json   # alle 170 Fälle
node labor/nahtpruefung/naht.mjs --faelle streifen-beide,nachzieh   # einzelne
```

Lesen: `gleich` und `gleichFolge` ≈ 0 ist der exakte Loop; Quotient ≥ 1 nur dann ein Bruch, wenn
`naht` ≠ `erwartet`. Details, Messgrößen und alle Ergebnisdateien: `labor/nahtpruefung/LIESMICH.md`.
Vollmessung: `ergebnis-nachher.json` (Log `lauf-nachbesserung.log`), Grundlinie `ergebnis-vorher.json`.
Die Rohbefunde der Bauer liegen in den Gruppenergebnissen (`ergebnis-zeit-alle`, `-leuchten`,
`-partikel`, `-stoerungen`, `-shader`, `-raender*`).

## Taktlage: der Zehnsekünder sitzt auf dem Lied (15.09.2026)

Caspar_D: *„im echten Leben synchronisierst du ja auf Takt was bei 10 Sekuender nur insoweit passieren
sollte, dass das Gros des Songs taktsynchron laeuft"* — und *„suno startet song und video gleichzeitig"*.
Gebaut im Studio-Block von `web/index.html` (`taktLage()`, `raster()`, `ausschnitt()`, `taktSatz()`),
gemessen am ganzen Katalog, gegengeprüft, nachgebessert. **Nicht committet.** Verfahren und Tabelle:
VIDEO-PLAN §3 „Gebaut 15.09.2026", neue Regel 18 in EFFEKTCLIP-REGELN.

### Der Befund

Clipbild 0 liegt auf Songzeit 0, der Clip beginnt alle L = N/30 s neu. Das alte `raster()` begann bei t0,
also lag Clipschlag 0 immer auf Songzeit 0 — die Phase war fest und gegen das Lied zufällig, egal welches
t0 („Eins nahe jetzt") gewählt wurde. t0 bestimmt nur den Bildinhalt. Dazu die Bildrundung ganzer Takte:
bei ganzzahligen BPM (111 BPM = 600/37 Bilder je Schlag) driftet die beste Takt-Länge etwa einen Schlag
über das Lied. Ehrliche Grundlinie: **Median 19,4 % der Songzeit im Takt**, 21 von 324 Titeln über 80 %.

### Das Modell

- Gesucht (N, M, φ): N 120…300 Bilder, M Schläge, φ ganze Bilder. Schlag j bei t0 + (j·N/M + φ)/30,
  Zählzeit aus der umlaufenden Nummer ((q % P) + 1). Loop exakt, weil Schlag j+M genau N Bilder später liegt.
- **Sitzt:** Puls auf dem Bild, auf dem er erscheint (ceil), weniger als 1/8 Schlag und höchstens 80 ms
  neben dem Songschlag.
- **Gewicht:** Dauer bis zum nächsten Schlag (≤ 1,5 Schläge) × Vorkommen des Abschnitts; Intro/Outro 1.
- **Zwei Raster aus den Karten** (kein Regler): liest eine Karte die Eins, ganze Takte und Song-Eins nur
  auf Clip-Eins; sonst M frei. Gruppen mit ggT(n, P) > 1 binden die Eins an den Gruppenanfang.
- **Tempo:** ≤ 12 % Abweichung, Schätzer ganzes Lied und je Drittel, Schranke immer auch gegen das ganze
  Lied (kein Doppeltempo). Takt-Einsen: eine 1 mit folgender 1 binnen 1,5 Schlägen zählt nicht; P < 2 gilt
  als „ohne Einsen".
- **Wahl:** Kandidaten höchstens 2 Prozentpunkte unter dem besten am ganzen Lied (`ABSTAND_LIED`), dort
  entscheidet das Gewicht; Gleichstand 1 Prozentpunkt → längeres N. Teilbarkeit vor Taktlage.
- Gemerkt je Schlagfeld (WeakMap). `DATA` übernimmt jetzt `abschnitte` aus `/api/song/:id`.

### Zahlen (324 Titel, `labor/nahtpruefung/ergebnis-taktlage.json`)

| | vorher | ohne Eins-Karte | mit Eins-Karte |
|---|---:|---:|---:|
| Median angezeigt | 19,4 % / 15,5 % | **98,4 %** | **59,6 %** (Schläge 63,4, Einsen 59,7) |
| über 80 % | 21 | 216 | 95 |
| ohne Zahl (< 44 %) | — | 14 | 91 |
| Refrain-Median | — | 100 % | 70,9 % |
| Länge Median | 9,00 s | 9,00 s | 8,70 s |
| gegen vorher | | 312 besser, 1 schlechter | 310 besser, 4 schlechter |

Weitere Kartenlagen (Anzeige-Median / ohne Zahl): Teiler 2 85,3 % / 22, Gruppe 2 83,3 % / 45, Gruppe 3
75,6 % / 48, Teiler 8 48,6 % / 127, Teiler 8 mit Gruppe 8 43,9 % / 164. Zufallsboden (±½ Schlag
verwackelt), Maximum: frei 43,0 %, Eins 38,6 %, Teiler 8 42,1 %. Schlechteste ohne Eins-Karte: Wind im
Wald 33,9 %, SMS Bist Du wach? 36,7 %, Ik will 36,8 % (Bildraster 2,4 ‰ daneben), Abend im Park und
Schroffmund (Tempowechsel). Mit Eins-Karte: 1 Unter der Haut III 15,5 %, Urgewalt 16,0 %, Reaktor 16,4 %.

**Was die Gegenprüfungen gekippt haben** (Entwurf 98,7 / 67,3 % → Bau 99,0 / 60,0 % → Nachbesserung
98,4 / 59,6 %): Messung am sichtbaren Bild statt an der Schlagzeit (sonst 6 Punkte zu viel), Zufallsboden
statt kleiner Zahlen, Gruppen an die Eins, Eins-Anteil in der Anzeige, Drittel-Schätzer, Doppeltempo
ausgeschlossen (Schlaf 99 → 85 %, Morgendämmerung 99 → 90 %), P = 1 ausgeschlossen (Die Affen, Murmelnder
Bach), Dauer-Einsen nicht als Takt-Eins, 80-ms-Fenster (Ich spüre dich Track 7 96 → 76 %), keine Zahl
unter 8 Schlägen, Abstand am ganzen Lied (Kerze 51 → 62 %).

### Statuszeile

- „suche die Länge, die im Takt bleibt …" vor der Suche (bis 176 ms beim ersten Export mit Eins-Karte).
- beim Aufnehmen „(M Schläge)" statt „(Takte)".
- danach „ · sitzt auf X % des Lieds im Takt", unter 50 % mit Grund in Klammern („das Tempo wechselt im
  Lied", „das Tempo ist frei gespielt").
- unter 44 %: „ · der Takt lässt sich nicht über das Lied legen — <Grund>".
- MediaRecorder-Rückfall: „ · im Notweg aufgenommen: ob der Takt über das ganze Lied mitläuft, ist nicht sicher".
- Tooltip „10 s ausgeben": „so lang, dass der Clip über das ganze Lied im Takt bleibt".

### Offen — Caspar_D entscheidet

1. **Ganze Takte immer** (eine Zeile, `eins:true` in `ausschnitt()`) oder, wie gebaut, nur bei Eins-Karten?
   Mit Eins-Karte 59,6 % und 91 Titel ohne Zahl, ohne 98,4 % und 14.
2. **„Jeder 8. Schlag"** kostet die Hälfte (Teiler 8 mit Gruppe 8: 44 %, 164 ohne Zahl). Zwei Drittel macht
   die Teilbarkeit, ein Drittel die Kopplung an die Eins. Lieber am Schlag als an der Eins? Lockern, wenn
   Teilbarkeit viel Sitzanteil kostet?
3. **Zwei feste Maße** sind neu: Fenster min(1/8 Schlag, 80 ms) (Auftrag nannte 1/8 Schlag) und
   2 Prozentpunkte Abstand am ganzen Lied (Refrain hat weniger Vorrang).
4. **Offbeat-Zielwert und Landkarte** (VIDEO-PLAN §3) sind nicht gebaut.

### Offen — technisch

- **Ob Suno Song und Video bildgenau zusammen startet, ist ungeprüft.** 20–50 ms Anlauf wären ein Drittel
  des Fensters. Vorschlag: Clip mit Blitz auf jedem Schlag auf der Songseite abfilmen — nur mit Freigabe.
- Ob der Puls sich ein Bild früher besser anfühlt: rechnerisch durch die Messung am sichtbaren Bild
  beantwortet, wahrnehmungsseitig nicht.
- `ZUFALL_BODEN` ist ein Wert für alle Kartenlagen; für Eins-Leser ist er streng (Zufall dort ≤ 38,6 %).
- Der Nenner ist die Songzeit mit Schlägen, nicht die Dauer (Katalog ≥ 87 %, Präsenz). Bei fremden
  Beständen mit lückenhafter Erkennung verspricht „des Lieds" womöglich zu viel.
- `taktlage-prototyp.js --wie-eingebaut` kennt die Nachbesserung nicht mehr; Maßstab ist `naht.mjs --taktlage`.
- Die 7 neuen Fälle stehen nur in `faelle.json`, nicht in `faelle-bauen.js` — ein Neuschreiben verlöre sie.
  Sie haben auch kein Vorschau-Vergleichsbild.
- Prüfdaten `nurEinsen` gelten jetzt als ohne Takt-Einsen: Eins-Leser pulsen im Clip jeden 4. Schlag, im Pult
  jeden (nur Prüfdaten).
- Die Grundlinie „vorher" in `haken.js katalog()` rechnet mit der neuen Eins-Regel und dem 80-ms-Fenster;
  im Bau-Protokoll hieß sie noch 21,3 / 17,2 %.

### Wie man misst

```bash
node labor/nahtpruefung/syntax.js                                          # Inline-Skripte bauen
node labor/nahtpruefung/naht.mjs --taktlage                                # Katalog über taktLage(), ergebnis-taktlage.json
node labor/nahtpruefung/naht.mjs --jobs 4 --wachhund 1500 \
     --aus labor/nahtpruefung/ergebnis-taktlage-loop.json \
     --vorschau-vergleich labor/nahtpruefung/vorschau-vorher.json          # alle 177 Fälle, rund 28 min
node labor/nahtpruefung/naht.mjs --faelle taktlage-eins-phase,taktlage-tempowechsel   # einzelne
```

Lesen: `gleich`/`gleichFolge` ≈ 0 wie immer; dazu `synchron` = `anzeige` (unabhängige Nachrechnung am
exportierten Raster, echte Schläge bei s = k·L + τ). Im Katalogergebnis je Titel `schlag` und `takt` mit
N, M, P, φ, sitzt, anzeige, einsQuote, refrain, grund, ms, `nach` (Nachrechnung) und `vorher`.
Prototyp zum Vergleich (nur lesend am Katalog): `node labor/nahtpruefung/taktlage-prototyp.js
[--raster takt|schlag] [--varianten] [--brauch n] [--json datei] [--wie-eingebaut]`.

## Maßstab, Stufe „Schleife schließen", Solo (15.09.2026)

**Maßstab** (Caspar_D: *„unsere eigenen Effektclips skalieren nicht mit dem zoom … absurd grosse Schneeflocken"*,
*„im Studio arbeite ich ja nach Augenschein, was dort rauskommt ist der Maßstab"*): Regel 19. Studiofeld gemessen
898 × 889. Studio bitgleich in 182/182 Fällen, Loop weiter exakt (177 Fälle, `gleich` ≤ 0,092). Größenabhängigkeit
(Block über Boden, 360 gegen 1080): Partikel 32,8 → 0,0, Einschlag 48,8 → 0,2, Laser 10,3 → 0,0, Tropfen 11,8 → 0,7,
Bloom 8,5 → 0,0, Risse 15,2 → 4,8; Rest bei Verwackeln, Scanlines, Kaustik ~4–5. Caspar_D: *„die preview ist jetzt
ohne riesenschneeflocken, super"*. Dateien: `labor/nahtpruefung/studiofeld.json`, `studio-vorher.json`,
`massstab-vorher.json`, `massstab-nachher.json`, `ergebnis-massstab-loop.json`.
**Offen (Gegenprüfung):** Untergrenzen ohne Deckkraft-Ausgleich machen feine Striche auf sehr kleinen Leinwänden
zu hell (Regen/Laser Faktor ~3 bei u 0,4). Ausgleich `ws/lw` gebaut bei Rissen, Regen, Blasen, Schmetterling,
Tropfenspur; **noch nicht** bei Laser-Kern/Saum, Laser-Punkten und `linse()` (Einschlag). Die Nachbesserung wurde
aus Kontingentgründen abgebrochen. Kontrolllauf `--studio-vergleich` danach: ein Fall nicht mehr bitgleich, `rand-wenige7-risse` (7 Schläge ohne Eins, Risse im Takt; Mittel 0,59, max. 116) - Ursache nicht untersucht, Verdacht auf eine Änderung aus Loop-Modus oder abgebrochener Nachbesserung.

**Vierte Stufe „Schleife schließen"** (Name von Caspar_D; eine Stelle: `LOOP_STUFE`): zeigt Länge und „sitzt auf X %
des Lieds" (dieselbe Rechnung wie der Export, `loopBedarf()`), Umschalter „10-s-Loop ansehen": Vorschau = Exportbild
zur Songzeit (`round((s mod L)·30)`), Ton nur gelesen. Gemessen 1218/1218 Songzeiten bitgleich zum Export
(`naht.mjs --loop-ansicht`). Oberfläche nicht gegengeprüft — Caspar_D sieht sie an.

**Solo wandert mit** (Caspar_D: *„es darf nicht sein, das ich an etwas Änderungen machen kann, was ich nicht sehe"*,
*„neue karte kriegt solo und der effekt wird klarer visualisiert"*): Aufklappen, Einhängen oder Kopieren einer Karte
bei laufendem Solo gibt ihr das Solo (`soloFolgt()`); Solo-Knopf gefüllt in Akzentfarbe, Solo-Karte mit Akzentkante,
übrige Karten gedimmt.

**„jeder 8. Schlag"** aus der Teiler-Auswahl entfernt (Caspar_D: *„achterschläge machen wir nicht, das bringt bei
10 Sekunden gar nichts"*; kein gespeichertes Rezept nutzte ihn). Ganze Takte bleiben nur bei Eins-Karten (*„ganze
takte nur, wenn karte auf der eins pulst"*).

**Prüfstand:** Wachhund-Vorgabe 1800 s, Wiederaufnahme über `.zwischenstand/` (*„sei bei den Wächtern einfach immer
etwas großzügiger und mach es idempotent"*).

**Heute außerdem entschieden/abgelegt:** Übergänge für echte Videos — Rücklauf mit 8 % Unschärfe für Material wie
Glut und Eis, Blitz/Pixel nicht für gefilmtes Material, Pendel adaptiv+asymmetrisch nur bei umkehrbarer Handlung, RIFE
für ähnliche Bilder (`docs/effektclip/KONZEPT-LANGE-VIDEOS.md`, `labor/videonaht/`); Recherchen
`docs/effektclip/VIDEOSTUDIO-RECHERCHE.md` und `docs/forschung/GPU-MODELLE.md` (Messplan im Backlog, onnxruntime-node
nie über 1.23 wegen Intel-iMac); MacBook als Rechenknecht erst mit Ableitungsbuch (Backlog).
**Kontingent:** Caspar_D, 15.09.2026 abends: *„du bist grade dabei, mein Wochenlimit einen Tag zu früh zu verballern"*
— danach keine Agenten/Workflows mehr, kleine Schritte direkt.

**Als Nächstes:** Caspar_D begutachtet im Studio (Maßstab in Kacheln, Stufe „Schleife schließen", Solo, die sieben
Loop-Abweichungen jetzt direkt über den Loop-Modus), dann Release 1.0.7.

## Schleife schließen für Bewegtbilder — gebaut am Abend (15.09.2026)

Caspar_D: *„Wie machen wir das jetzt mit dem Schleifen-Schließen? Das Panel zeigt keinerlei Optionen, keine
Videoüberblendungen"* — *„mach es trotzdem"* (trotz Kontingent). Commits `eb7d83a` … `c5eebe5`.

**Stand im Studio, Stufe „Schleife schließen":**
- **Sprungkopie** `POST /api/sprungkopie` aus `a79575e` wiederhergestellt (Sandkasten 8799 geprüft, dann live mit
  Caspar_Ds OK). Das Studio holt sie beim Öffnen eines Videos (`sprungHolen`) und stellt das `<video>` darauf um.
- **Übergang am Loop** (`SCHLEIFE_ARTEN`): harter Schnitt, Rücklauf mit Unschärfe (8 %), Abbremsen, Pendel,
  Unschärfe, Blende, Kreuzzoom, Wisch, durch Schwarz, durch Weiß, Schnitt mit Blitz (für Grafik), Pixel (für Grafik).
  Im Rezept als `schleife:{art,schlaege,fenster}`.
- **Das ganze Video, gleich viel Änderung je Zeit** (*„das Video muss immer so ganz wie möglich zu sehen sein"*,
  *„gleich viel Änderung pro Zeit aber das gesamte Videomaterial"*): Änderungskurve einmal je Video gemessen
  (`schleifeKurveMessen`, Rate ~ 1/Änderung^0,7, halb bis doppelt so schnell); Vorwärtslauf zeigt immer Bild 0 bis Ende.
- **Länge:** bei Videos wählt `taktLage` die längste Länge ≤ 10 s bis 10 Prozentpunkte unter der besten
  (`bedarf.lang`); **Schläge im Clip** von Hand (− / + / von selbst, nie über 10 s); **Länge des Übergangs** in
  Schlägen (harter Schnitt immer 0 s, *„die anderen müssen variabel sein"*, halbe Schläge gewünscht).
- **Effekte gehen mit durch den Übergang** (*„wenn wir einen fade out übergang haben, müssen die effekte mit
  ausfaden"*): `schleifeNachbild()` wirkt auf das fertige Bild; Blende/Wisch/Abbremsen mischen das letzte fertige Bild
  vor dem Fenster mit dem ersten des Clips.
- **Vorschau zieht mit:** Wahl eines Übergangs bei einem Video schaltet die Loop-Ansicht ein.
- Export (Kodierweg und MediaRecorder) setzt das Video je Bild bildgenau (`quelleSetzen`, `VIDEO_GENAU`).

**Nicht automatisch geprüft:** der ganze Video-Weg (nur Caspar_D am Bild). Titelbild-Weg per Stichprobe unverändert.
**Offen:** Nahtsuche (bester Ausschnitt) fehlt, Pendel noch nicht asymmetrisch, Blende/Wisch mischen Standbilder
(kein Material über den Clip hinaus), Darstellung der Stufe nach Hausregeln überarbeiten (Caspar_D, 15.09. spät),
Songanalyse-Ansicht Takt gegen Clip (Backlog). Nebenbei am 15.09.: sechs liegengebliebene `bin/einrichten.js`-
Prozesse vom 13.09. beendet; ein fremder Prozess auf 8791 versehentlich beendet (Hausregel eigene PID verletzt).

### Begutachtung durch Caspar_D (15.09.2026 spät) und was er später noch ansehen will

1. Maßstab: *„massstab ist super so"*; Rezepte wie vorher, außer den ehemaligen Theaternebel-Rezepten — *„kann aber so bleiben"*.
2. Solo: *„perfekt so"*. 3. Teiler ohne „jeder 8. Schlag": ja. 4. Schleife schließen mit Titelbild: *„alles geht"*.
5. Schleife schließen mit Video: *„alles andere geht"* — **Effekte im Übergang noch nicht getestet.**
6. Export mit Video: ja — **Pendel ist mit doppeltem Inhalt pro Zeit meist zu schnell** (*„da müssen wir wahrscheinlich
   nochmal ran, aber nicht jetzt"*; Idee dazu: adaptiv + asymmetrisch aus dem Muster, oder Pendel nur über einen Teil).
7. **Die sieben Loop-Abweichungen** (Streifen „beide", Scheinwerfer-Fahrt, langsame Schwaden, Nebel-Tempo, Teiler-Titel,
   Titel mit wenigen Schlägen, Schritt auf der Eins) will er **bei Gelegenheit** über den Loop-Modus ansehen —
   *„behalts im Gedächtnis, dass ich das bei Gelegenheit mal anschauen soll"*. Daran erinnern.
Danach: Release 1.0.7.

## Studio als Akkordeon (15.09.2026)

Das Pult des Effektclip-Studios (`#tbs-pult` in `web/index.html`) ist jetzt ein Akkordeon, wie mit Caspar_D abgestimmt.
Nichts ist committet.

1. **Vier Stufen:** Quelle · Vorbereitung · Effektkette · **Effektclip als Schleife**. Die letzte hieß vorher
   „Schleife schließen" (`LOOP_STUFE`, Taufnotiz in `docs/haus/HAUSREGELN.md`).
2. **Immer nur eine Stufe offen.** Der Kopf ist ein Knopf mit `aria-expanded`, Fokusrahmen und `:active` 0,95.
   - Rechts im Kopf steht der Stand (`standSetzen()`). Er wird dort gesetzt, wo sich der Zustand ändert: `quellenUI`,
     `vorbStand`, `kettekopfStand` und `schleifeUI`.
   - Die Texte lauten „Bewegtbild (Suno)", „2 Anpassungen aktiv" / „keine Anpassung", „3 Effekte zugewiesen · 2 an ·
     Solo: Name" / „kein Effekt" und „7,53 s · 19 Schläge · Blende". Beim Titelbild fällt der Übergang weg.
3. **Erklärtexte** im Wortlaut von Caspar_D stehen in `STUFE_ERKLAER` und ersetzen die alten Untertitel.
4. **Der eigene Klappschalter der Vorbereitung ist ganz entfernt** (`#tbs-vorbKlapp`, `#tbs-vorbStand`, CSS
   `.tbs-vorbkopf`). „Löschen" bleibt im Panel neben Auto-Niveaus. Beim Öffnen der Stufe läuft `vorbRender()`.
5. **Gemerkt wird die zuletzt geöffnete Stufe** in `localStorage` unter `mysuno-tbs-stufe` (mit try/catch). Beim ersten
   Mal ist es die Quelle.
6. **Die Vorschau folgt der Stufe:**
   - Die Schleife schaltet `loopSchalten(true)`, jede andere Stufe und das Zuklappen schalten aus. Während eines
     Exports wird nicht geschaltet.
   - Ist die Quelle noch nicht bereit, merkt sich das Studio einen Wunsch (`loopWunsch`), den `grundLaden()` einlöst.
   - **Taste V halten** in der offenen Vorbereitung zeigt die Quelle ohne Effekte. Das läuft über
     `zeichneFrame(t, roh)` aus `rahmen()`, dazu kommt die Marke `#tbs-ohneMarke` über dem Feld. Die Taste wirkt auch,
     wenn ein Schieber den Fokus hat, nicht aber in Textfeldern und Listen. Losgelassen wird bei keyup V/Meta, blur und
     visibilitychange.
7. **Die Schleife hat eine Spalte:** Erklärung, Lage, Pille „als 10-s-Clip zeigen", Schläge im Clip, Übergang an den
   Schleifenenden mit Prinzip, Länge des Übergangs, Zeitleiste, Kostenhinweis.
   - `taktSatz` unter dem Zufallsboden lautet jetzt „keine Länge bleibt über das Lied im Takt – die Pulse laufen im
     Suno-Video gegen die Musik".
8. **Zeitleiste repariert.** Ursache: `getComputedStyle($('#tbs'))`. `root` ist `#tbs`, also war das Ergebnis null, und
   der Aufruf warf nach dem Schwarz. Jetzt steht dort `getComputedStyle(root)`.
   - Dieselbe Ausnahme hatte auch die Loop-Einschaltung beim Übergangswechsel verhindert und das Dimmen der Lagezeile
     hängen lassen.
   - Probe (`scratchpad/leiste-probe2.mjs`, dpr 2): Titelbild 456–712 helle Pixel, Video mit Blende 87 568. Wieder
     aufgeklappt malt die Leiste neu; keine Ausnahme.
9. **Fuß:**
   - „Lösen" heißt jetzt „Löschen"; der Tooltip sagt, dass nur das gesicherte Rezept beim Titel gelöscht wird.
   - Die Beschriftung lautet „Effektclip".
   - „Gesichert werden Quelle, Vorbereitung, Effektkette und Schleife."
   - Die Meldungen lauten „Effektclip des Titels geladen" und „noch kein Effektclip beim Titel".
   - Der Tastenhinweis nennt V.

**Nebenbei mitgebaut** (Fallen aus der Kartierung):
- `loopSchalten(false)` gibt das Video erst frei, wenn die Vermessung (`SCHLEIFE_STILL.laeuft`) fertig ist.
- Wechselt die Quelle bei laufender Loop-Ansicht auf ein Video (Pfeiltasten), wird es vermessen.
- `grundLaden` rendert die offene Vorbereitung neu, damit das Histogramm zur neuen Quelle passt.

**Geprüft:**
- `syntax.js`: alle bauen.
- `--studiofeld`: Vorgabefeld weiter 898 × 889.
- `--loop-ansicht` (puls, korn, kippen, strobe): 8/8 bitgleich, Satz gleich, dicht, aus gleich.
- Leistenprobe dpr 1 und 2: keine Ausnahme.

**Offen / nicht geprüft:**
- Caspar_D muss das Akkordeon am echten Bild ansehen; der V-Vergleich mit einer echten Vorbereitung wurde automatisch
  nicht geprüft.
- **Abweichung von der Absprache, zur Entscheidung:** V wirkt auch, wenn ein Schieber (range) den Fokus hat — abgesprochen
  war „nicht in Eingabefeldern". Grund: Schieber behalten nach dem Ziehen den Fokus, V täte sonst genau beim Vergleichen nichts.
- **Benennung, zur Entscheidung:** der Knopf der Vorbereitung heißt jetzt „Zurücksetzen" (vorher ebenfalls „Löschen" —
  zwei gleich beschriftete Knöpfe mit verschiedener Wirkung). Das ✕ an der Studio-Kachel im Haus heißt im Tooltip
  weiter „Effektclip entfernen".
- „Löschen" fragt weiterhin nicht nach, wie „Lösen" vorher.
- Falle B aus der Kartierung ist nicht gebaut: „10 s ausgeben" während einer laufenden Vermessung.
- `labor/effektclip-studio/tbs-modul.js` ist eine alte Kopie und nicht nachgezogen.
- Schon vorher so: stellt `sprungHolen()` das Video mitten in einer Vermessung auf die Sprungkopie um, misst die Kurve
  über den Wechsel hinweg und trägt den Schlüssel der alten Adresse (Probe: 194 statt 195 Stützstellen gegen eine saubere
  Messung). Die Sperre hält jetzt; die Messung selbst wird nicht neu gestartet.

**Nachgebessert nach der Gegenprüfung (15.09.2026):**
- Loop-Ansicht mit Video: ein Ziel vor dem ersten Videobild (Suno-mp4 beginnt bei 0,083 s) ließ `loopBildMalen` jedes
  Bild neu spulen, ohne je zu malen (harter Schnitt am Clipanfang, zweite Hälfte fast aller Übergänge) — schon vor dem
  Akkordeon so. Ein fertiger Sprung zum selben Ziel gilt jetzt als angekommen.
- Stufenwechsel während eines Exports wird nach dem Export nachgeholt (`stufeAbgleichen`); ohne Wechsel bleibt eine von Hand
  ausgeschaltete Pille aus.
- `schliessen()` schaltet die Loop-Ansicht aus und gibt VIDEO_GENAU sofort frei, auch wenn die Vermessung noch abbricht (VIDEO_GENAU blieb sonst stehen und `quelleSync` ließ Kachel-/Bühnenvideos liegen).
- `angewendet()` zählt eine geänderte Schleife; „Für diesen Titel sichern" wird frei.
- Preset und Beispiel setzen Solo zurück; ein Solo ohne Karte wird im Kopf der Kette verworfen statt verschwiegen.
- Zweites „bereit" nach dem Umstellen auf die Sprungkopie löst keine zweite Vermessung und kein Neubauen der Vorbereitung
  mehr aus; ein zweiter Aufruf von `schleifeKurveMessen` wartet auf die laufende Messung, die Sperre `SCHLEIFE_STILL` ist gezählt.
- Geht das Studio während einer Vermessung zu und mit einem anderen Video wieder auf, wartet die neue Messung auf das Ende
  der alten und misst dann das neue Element.
- 12 px für Lagezeile, Pille und Fußtexte (Regel 14); verwaiste CSS (`#tbs-abLoop` container-type, Großschrift-Rückstellung) gelöscht.
- Prüfstand `haken.js` erkennt den neuen Satz unter dem Zufallsboden; EFFEKTCLIP-REGELN 18c und VIDEO-PLAN nachgezogen.
- Nachprobe (eigene Site-Kopie, headless): Ziel vor dem ersten Videobild malt (i=0, Abspielstrich 64 px; Blende-Ende i=225);
  Export-Nachholen, Solo nach Preset, Sichern nach Schlag-Änderung, Schließen (Kachel-`quelleSync` greift wieder),
  Sprungkopie (0 Bilder ohne Sperre, Vorbereitung nicht neu gebaut, Fokus bleibt): alle wie erwartet, 0 Meldungen.
  `--studiofeld --neu`: Feld 898 × 889. Leistenprobe dpr 1/2: Exit 0.


### Achsen der Zeitleiste (15.09.2026 spät, Version 1.0.8)

Caspar_D: *„die linke Achse von unten nach oben bildet die Zeitskala des Videomaterials ab, die waagerechte Achse von links
nach rechts die von Klangtresor geschleifte Version"* — das muss dastehen. Gebaut: `#tbs-leiste` 96 px hoch, links die Achse
„Video" (0 s unten, Videodauer oben, nur bei Bewegtbild), unten „0 s · geschleifter Clip · L s", darunter sein Satz als
Erklärung und rechts „Übergang X s" in Akzent. Die schwarze Leiste davor war `getComputedStyle($('#tbs'))` — `$` sucht nur
unterhalb von `root`, und `root` *ist* `#tbs`; die Ausnahme brach auch `schleifeUI()` ab. Probe: `leiste-probe2.mjs` (Scratchpad).

### Abnahme (15.09.2026 spät)

Caspar_D nach F5 auf 1.0.8: *„ja sehr schön geworden, genehmigt"*. Damit gelten die drei offenen Punkte so, wie gebaut:
V wirkt auch mit fokussiertem Schieber, der Knopf der Vorbereitung heißt „Zurücksetzen", „Löschen" in der Fußleiste fragt
nicht nach. Weiter offen: „10 s ausgeben" während der Vermessung eines Videos, ✕-Tooltip der Hauskachel („Effektclip
entfernen" gegen „Löschen"), veraltete Laborkopie `labor/effektclip-studio/tbs-modul.js`.

### Bereinigte Lyrik als vierte Spur und das Pendel als Ausschnitt (16.09.2026)

**Bereinigte Lyrik überall, wo v2/v3/Whisper stehen** (Caspar_D: *„die bereinigte Lyrics soll überall dort verfügbar sein,
wo auch whisper, v2 und v3 lyrics verfügbar ist"* — *„im gleichen dropdown"*). Gebaut: `bLyrik` wird beim Bühnenaufbau
aus `/api/lyrik/<id>` nachgeladen, `lyrikWorte()` macht aus jeder Zeile einen Eintrag `[von, bis, Zeile + '\n']` — damit
läuft sie durch `inZeilen()`, `bWorte()`, `bSpurJetzt()` und Karaoke wie eine Wortspur. Im Pult steht sie als vierte
Wahl („bereinigte Lyrik"), im Zeitmarken-Vergleich als vierte Quelle; der Versatzvergleich lässt sie aus, weil Zeile
gegen Wort ein Kategorienfehler wäre. Sie ist ZEILENWEISE vermessen, darum leuchtet die ganze Zeile — ein geschätztes
Wort leuchtet nicht („Nichts darf lügen"). Karaoke gilt jetzt auch, wenn nur sie Zeiten hat.

**Pendel: ein Ausschnitt hin und her** (Caspar_D: *„das pendel soll natürlich das hin und her zeigen. man könnte
natürlich einen 5 sec Ausschnitt nehmen und den hin und her pendeln. eine auszublenden ist nicht sinn der sache"*).
Vorher lief das ganze Video hin und zurück in derselben Clipzeit: im Mittel doppeltes Tempo, in der Clipmitte
π-faches — daher *„viel zu schnell"*. Jetzt pendelt ein Ausschnitt von halber Clipzeit (10 s Clip → 5 s Ausschnitt):
Hinweg die erste Hälfte, Rückweg die zweite, dazwischen echtes Tempo, an den Umkehrpunkten weich (15 % je Weg,
Spitze 1,18-fach), bei τ=0 und τ=L dasselbe Bild mit Tempo 0. Kein Ausblenden, keine Unschärfe. Die Länge steht als
„Länge des Ausschnitts" in halben Schlägen im Pult (die Zeile war beim Pendel vorher grau), die Lage kommt aus der
Änderungskurve: das bewegteste Fenster seiner Länge (`schleifePendelVon`).

### Hol-Weg-Diagnose: Abschnitte und Schläge beim neuen Titel (16.09.2026)

Caspar_D: *„früher wurden die abschnitte des songs auf der song analyse seite eingefärbt … ist ein Hol-Weg seitdem tot?"*
Befund aus zwei Prüfspuren (nur lesend am echten Katalog, Nachspiel im Sandkasten):

1. **Kein Weg ist tot.** Im selben Lesezeichen-Lauf (`abgerufenAm 2026-09-15T22:34:49.694Z`) antworteten
   `waveform-aggregates` 1/1, `aligned_lyrics/v2` 5/5 (537 Wörter für den neuen Titel) und `v3` 2/3 — gleicher Token,
   gleiche Kopfzeilen. Auth, CORS und Deckel sind damit ausgeschlossen.
2. **`downbeats` und `novelty-sections` wurden für diesen Titel genau EINMAL gefragt** und die Antwort unbesehen
   verworfen: `browser/morgens.js:988` wirft den Status weg, `:997` schluckt die Ausnahme, `:1002` nennt jeden Fehlschlag
   „noch nicht fertig bei Suno". Vom 09. bis 15.09. wurden beide NULL mal gefragt, weil `fehlt` (`:981`) leer war.
3. **Suno rechnet beides auf Anfrage.** Sunos eigene App pollt beide Adressen alle 2,5 s bis zu 300 s
   (`library/suno-wege/suno-wege-_studio.json`), die erste Antwort ist `{state:"running"}`. Unser Lesezeichen fragt
   einmal. Wahrscheinlichste Erklärung: nicht tot, nur ungeduldig.
4. **Die Ernte von 00:34 ist nie übernommen worden.** Der Katalog trägt `erstelltAm 22:34:34.914Z`; die 17 s danach
   gingen in `gzipSync(level 9)`, und die vier Rohdateien landeten um 00:34:50 mitten in diesem blinden Fenster.
   `wellenStufen` und die 537 v2-Wörter liegen also noch unverarbeitet in `library/roh/` — ein Lauf holt sie.
5. **Verlustfenster:** Verarbeitete Rohdateien werden gelöscht, nicht archiviert (`bin/aufbereiten.js:1018-1028`; der
   Kommentar bei `:129` über `roh/verarbeitet/` ist veraltet, ebenso `bin/wiederherstellen.js:67`). Die Löschliste
   (`:916-931`) liest den Ordner NEU — was zwischen Lesen und Löschen eintrifft, wird ungelesen gelöscht. Im Sandkasten
   nachgestellt.
6. **Zwei Dauerläufer:** `/api/morgen/v3-fehlt` (`server/server.js:3316`) zählt `alignment: []` als vorhanden, `worteV3`
   wird aber nicht gesetzt — die zwei Ribbeck-Titel werden bei jedem Lauf wieder geholt. Dasselbe Muster bei leeren
   v2-Antworten (HTTP 202 gilt in `morgens.js:1038` als Erfolg).
7. Der Titel ist der **einzige v6-Clip von 325** — „nur v6" und „nur einmal gefragt" lassen sich aus den Daten nicht
   trennen. Messweg: Lesezeichen mit offenem Netzwerk-Reiter, Status und Körper der zwei Adressen lesen.

**Nicht gebaut, Entscheidung offen:** Status und `state` in die Ernte mitschreiben, Nachfragen wie Sunos App, das
Löschfenster schließen, die beiden Leer-Antworten richtig zählen, Adressliste neu holen (letzter Stand 08.09.2026).

### Hol-Weg repariert (16.09.2026 nachts, Freigabe: *„gut, ich gebe das okay"*)

**Lesezeichen** (`browser/morgens.js`, +438/−44): Jede Adresse bekommt ihren eigenen Versuch (vorher riss ein Fehler bei
`downbeats` die beiden folgenden Adressen desselben Titels mit), dazu eine **Nachfragephase**: Suno rechnet `downbeats`
und `novelty-sections` auf Anfrage, die erste Antwort ist `{state:"running"}` — Sunos App pollt 2,5 s / 300 s. Wir fragen
für diese beiden bis zu **8 Runden** nach, für `aligned_lyrics` **1 Runde** (so hält es Sunos Client), Deckel: 120 s
Gesamtfrist, 15 s je Anfrage (AbortController). Jede Antwort wird beurteilt: `geholt | rechnet | leer | fehler` — HTTP 202
und „Lyrics alignment not available" zählen als *rechnet*, nicht als Erfolg. Der `holstand` (Adresse, Versuche,
HTTP-Status, Sunos `state`, Fehlername) reist in `library/roh/timing-*.json` mit, und die Bildschirmzeile sagt je Adresse,
was ankam. Der Lauf misst jetzt also, statt zu behaupten („noch nicht fertig bei Suno" war eine Annahme).

**Aufräumen** (`bin/aufbereiten.js`, +357/−44): Gelöscht wird nur, was in diesem Lauf **gelesen** wurde. Eine Ernte, die
während des Laufs eintrifft, überlebt (genau das war Jörgs Fall: sie kam um 00:34:50 mitten in die 17 s `gzipSync`) und
steht in `library/nachzuegler.json`, damit `/api/morgen/unverarbeitet` sie auch dann meldet, wenn sie älter ist als der
Katalog. Krummes JSON wird als `.unlesbar` beiseitegelegt statt den Lauf abzubrechen. Die veralteten Kommentare über
`roh/verarbeitet/` sind berichtigt (`bin/aufbereiten.js:129`, `bin/wiederherstellen.js:67`).

**Server** (`server/server.js`, +101/−24, Patch nach Freigabe eingesetzt, Neustart geprüft): „vorhanden" heißt jetzt
„ergibt Wörter" — `alignment: []` gilt nicht mehr als v3-Spur (sonst holte der Lauf die zwei Ribbeck-Titel ewig neu),
leere/202-Antworten halten den Titel auf der Fehlt-Liste, und `abschnitte` gelten nur mit `peak_times` **und**
`segment_labels`. Prüfung nach dem Neustart: Startseite 200, `/api/morgen/v3-fehlt` → 3 fehlen, 258 vorhanden.

**Stand des Bestands:** Der Morgenlauf um 01:19 hat Jörgs wartende Ernte übernommen — der neue Titel hat jetzt
`worteV2` (537 Wörter) und `wellenStufen` (12 Stufen). Weiter offen, weil nie geholt: `schlaege`, `abschnitte`, `worteV3`.
Das klärt der nächste Lesezeichen-Lauf mit der Nachfragephase — und, falls es dann Fehler statt „rechnet" gibt, steht der
HTTP-Code im `holstand`. Die Adressliste ist vom 08.09.2026; ein neuer Lauf von `bin/suno-app-wege.js` (braucht Jörgs
Login) würde zeigen, ob Suno die beiden Adressen für v6-Clips umbenannt hat.

### Voll-Titel-Video, Stufe 1 gebaut (16.09.2026)

Caspar_D: *„Okay, gibt das Vollzeitvideo so einfach wie möglich aus, aber nicht so, dass man sich damit blamiert."*
Gebaut: Knopf „ganzen Titel ausgeben" in der Fußleiste, Renderschleife über die ganze Liedlänge (t = 0 … dauer,
kein Loop, keine Naht), bildgenau über WebCodecs — MediaRecorder ist für diesen Weg gesperrt, er hält die Bildrate
bei schweren Rezepten nicht. Das Bewegtbild wiederholt sich rundenweise (`vollRunde`): Rundenlänge ist ein Vielfaches
des Takts, Dehnung höchstens ±1/3, sonst ein Ausschnitt. Effekte laufen auf Liedzeit im echten Takt.
Neue Server-Wege: `/api/vollvideo/start|teil|fertig|holen|abbrechen`, Teile alle ~600 Bilder, Ausgabe unter
`.ausgabe/<lauf>/` (gitignoriert), Ton aus `library/songs/<id>/audio.mp3` optional dazu. Fortschritt, Abbrechen und
Kostenangabe am Knopf; das Studio ist während des Laufs ehrlich gesperrt.

**Befund, der den Vertrag änderte:** `-shortest` verliert bei rohem Annex-B-Eingang die Tonspur komplett (ffmpeg
9.0.1, ohne Warnung — der Strom trägt keine Zeitstempel). Gemuxt wird deshalb mit `-t <bilder/rate>` als
Eingangsoption vor dem Ton.

**Grenzen dieser Stufe, bewusst:** Der Ausschnitt wandert nicht von Runde zu Runde (jeder Übergang führt an den
Anfang desselben Materials zurück — Material über das Lied zu verteilen ist Abschnittsarbeit, Stufe 2). Die
Rundenlänge ist fest und wandert gegen das leicht unregelmäßige Schlagraster um etwa 30 ms je Runde; ab ungefähr
einer Minute ist die Lage wieder beliebig. Kein Karaoke-Einbrennen, keine Formatwahl, keine Warteschlange,
keine Szenen.

### Offen aus dem Partikel-Ausbau (16.09.2026)

Caspar_D während des laufenden Baus: *„bei schmetterlinge müsste auch noch die Flattergeschwindigkeit eingestellt
werden können"* — kommt beim Einfügen der Partikel-Kopie dazu: ein Regler „Flattern" (Schläge je Sekunde), Vorgabe
aus dem natürlichen Bereich, je Falter leicht gestreut, damit der Schwarm nicht im Gleichtakt schlägt. Wahlweise an
den Takt gekoppelt über den Antrieb, den jeder Effekt hat.

### Trennebene sichtbar (17.09.2026)

Caspar_D: *„sind die ganzen partikelpanel denn jetzt so, dass ich die ebene, die vorn und hinten trennt sehen kann"* —
jetzt ja. Während man an „Grenze" oder „Weichheit" zieht (und 1,4 s danach), zeigt die Scheibe das Quellbild in
Graustufen, rot wo die Maske nah zählt, blau wo fern, im weichen Band der Verlauf, dazu eine Haarlinie bei genau 50 %.
Unter dem Grenze-Regler steht dauerhaft ein Verteilungsstreifen (Histogramm der Tiefenwerte, Wurzelmaßstab) mit dem
Griff darauf, dazu drei Prozentzahlen (vorn · Übergang · hinten). **Eine Quelle der Wahrheit:** der rote Kanal *ist*
das Alpha-Byte von `tiefeMaske` — Abweichung an 2560 Proben exakt 0. Anteile gegen eine unabhängige Zählung: 0,0000.
Haarlinie: kein Punkt abseits der 50-%-Kante. Kosten: aus = null, beim Ziehen ein Auftrag je Bild (3,7 ms bei 480,
12,6 ms bei 960 unter SwiftShader, also Obergrenze). Export und Kacheln sehen die Ansicht nie (sie lebt nur in
`rahmen()`); sechs Bildhashes gegen den Repostand identisch, Loop `gleich 0`.
Dazu: `.tbs-graugrund` von 10,5 auf **12 px** (Hausregel 14) — Caspar_D: *„ja, ist dann so"*.

**Als Nächstes vereinbart:** das Betretungsverbot an der BAHN statt am Bild. Caspar_D: *„es darf überhaupt keine
richtungen geben, die in die verbotszone führen"* — und als Weg dorthin sein eigener Vorschlag: *„oder du baust die
bahnen aus einem gültigen parameterset"*. Gebaut wird eine **Geburtenkarte**: einmal je Titel und Einstellung wird
je Rasterzelle geprüft, ob eine dort beginnende Bahn über ihr ganzes Leben erlaubt bleibt; geboren wird nur aus
bestehenden Zellen. Gerade Bahnen (Sternschnuppe) über die freie Strecke in Flugrichtung, gekrümmte durch Abtasten.
Ist die Karte leer, sagt die Karte es. Die Abschneide-Idee ist gestrichen (Caspar_D hat sie zu Recht verworfen).
Ebenfalls offen: Sternschnuppen-Kopf, Grenze/Weichheit ans Rezept statt an den Effekt, erstes Exportbild nach
Titelwechsel.


---

## Die Nacht vom 17. auf den 18.09.2026 — Partikel, Tiefe und die Ken Burns Fahrt

Caspar_D: *„du kannst das alles abarbeiten, es ist nacht und ich geh jetzt schlafen."* Acht Commits,
und der Abend davor war eine **Spezifizierungsrunde**, die er ausdrücklich gelobt hat: *„genau so
stelle ich mir spezifizierungsrunden vor, kein lospreschen, ewig viele tests machen und dann
plötzlich merken, hoppla, so geht es ja gar nicht."* Daraus die neue Regel, die ab jetzt gilt:
**keine große Messreihe vor der fertigen Spezifikation.**

### Was eingesetzt ist

| Commit | Sache |
|---|---|
| `0557cc7` `e888f21` | Spezifikation „Partikel und Tiefe" — sie ist KLEINER als der Entwurf: drei Zeilen fallen weg, die Geburtenkarte und das Ausweichen lösen sich auf |
| `876d67e` | Jedes Teilchen bekommt eine **eigene Entfernung**, gewürfelt aus dem freien Bereich am Geburtsort |
| `4c6b938` | **Ken Burns Fahrt** — die Klammer halten · fahren · halten, getaktet, geschlossener Lauf |
| `10e566a` | **Verdeckung in vier Tiefenschichten**, jedes Teilchen nach seiner eigenen Entfernung |
| `0a97ef3` | Ken-Burns-**Zielsuche**, Vorgabe ist die Kanten-Lesart |
| `f7f68b5` | **Die Tiefenkarte fährt mit der Geometrie mit** |
| `b6cc4fe` | „Tiefe aus der Bildzeile" gestrichen, Trennebenen-Ansicht fährt mit |
| `3cac62c` `7ed5777` | Das **Herkunftsbuch** ist nicht mehr ersetzbar und nicht mehr überschreibbar |
| `4f51bfd` | Mein `.orig`-Überrest aus dem Repo entfernt, `*.orig` in `.gitignore` |

### Die drei Denkfehler, die dabei aufgefallen sind — alle drei meine

1. **„Steigende Teilchen brauchen eine Sonderregel."** Nein: ein Funke kommt aus einem Feuer. Die
   Betriebsart „das ganze Bild" ist für steigende Teilchen einfach falsch, und die schon gebauten
   Quellen (Punkt, Strich, Kreis, Ellipse) lösen es vollständig. Caspar_D: *„Vorher mal nachdenken,
   ob die Natur der Partikel, die wir simulieren gut getroffen wird."*
2. **„Vor dem nächsten Punkt der Szene ist nichts."** Falsch — Caspar_D: *„tiefenmap verhält sich
   genau so wie 2D, es gibt einen layer vor dem ganzen, in dem noch Partikel generiert werden
   können."* Daraus wurde der Regler „Leerraum vor Tiefenkarte".
3. **„Das Motiv ist das Nahe und das Detailreiche."** Widerlegt: die nahe Zone ist der Boden. Ein
   Motiv ist, was sich **abhebt** — eine Kante in der Tiefe.

### Die Fehler im eingesetzten Code, die Gegenleser gefunden haben

- **Das Herkunftsbuch konnte still gelöscht werden.** `try { lesen } catch { leeres Buch }`, und
  danach wurde es ganz zurückgeschrieben: 326 Einträge und die Modellidentität. Selbstverstärkend,
  weil ein Abbruch mitten im Schreiben genau das abgeschnittene Buch hinterließ, das den Ersatz
  auslöste. Gefunden hat es ein Prüfer am **Schwesterwerkzeug** — er sah von sich aus nach, ob das
  Muster anderswo steht.
- **Und es konnte überschrieben werden.** Der Lauf liest einmal und schreibt minutenlang später
  seinen Speicherstand zurück. Gemessener Wettlauf: die Tiefenspur trägt bei 32,7 s ein, der
  Kartenlauf löscht den Eintrag bei 65,9 s.
- **Die Tiefenkarte fuhr nicht mit.** Bis 364 Bildpunkte Versatz, bis 26 % der Fläche auf der
  falschen Seite der Verdeckungskante. Älter als diese Nacht (die alte Fahrt, „Zoom schlägt",
  „Kippen"), aber erst sichtbar, seit Partikel die Karte immer benutzen. Derselbe Fehler stand an
  einer dritten Stelle, beim Laser.
- **Die Kosten waren zweimal falsch gemessen, beide Male zu hoch.** Wer nach *jedem* Leinwandgang
  einen Bildpunkt zurückliest, holt die Leinwand von der Grafikkarte: 9,90 ms statt 1,27 für vier
  Bänder. Die Regel in `EFFEKTCLIP-REGELN.md` ist entsprechend präzisiert — sie gilt für EINEN
  Durchgang, nicht für eine Kette.
- **Zwei Scheiben in einem Chrome** täuschten bei identischem Code Faktor 2,2 vor (die im
  Hintergrund wird gedrosselt). Steht ebenfalls in den Regeln.

### Was NICHT eingesetzt ist, und warum

- **Die Tiefenspur für Bewegtbilder** (Rechenweg + Server-Weg) ist gebaut und **durchgefallen**. Sie
  liegt im Scratchpad unter `tiefenspur/`. Der Prüfer hat 13 Zurichtungen des Buchs durchprobiert,
  alle abgefangen — und dann doch einen Weg gefunden, auf dem ein Eintrag verschwindet. Offen:
  liegengebliebene Nebendatei bei EPIPE, eine Abbruchmeldung ohne Hinweis auf den Zwischenstand, ein
  Stempel aus Größe und Zeit, den eine fremde Hand aushebeln kann. **Sie geht nicht an das Archiv,
  bevor das ausgeräumt ist.** Der Server-Patch liegt daneben und nützt ohnehin nichts ohne den
  Browser-Teil.
- Die Messzahlen zur Spur, die gelten: Schnitterkennung über das **Verhältnis** zum örtlichen Median
  (eine absolute Schwelle trennt nachweislich nicht — ein echter Schnitt kommt auf 0,2168 und liegt
  damit unter dem Maximum eines durchlaufenden Videos, 0,2831), gewählt 30 zwischen p99 = 13,5 und
  dem einzigen echten Ausschlag 118. Die fertige Spur ist **dreimal ruhiger** als die volle Rechnung
  (0,41 gegen 1,26 mittlere Änderung je Bild).

### Was als Nächstes ansteht

1. **Partikel, Schritt 3: das Auftreffen.** Die Regel steht durchspezifiziert in
   `KONZEPT-AUFTREFFEN.md`: verdeckt, wo die Fläche näher ist — aufgehalten am Anfang der *letzten*
   gesperrten Strecke. Ein Ast ist etwas, aus dem die Bahn wieder herauskommt.
2. **Ken Burns, Schritt 3 und 4:** die übrigen drei Läufe der ersten Fassung (Aufdecken, Zwei
   Stationen, Streifen) und die **Parallaxe** — das Nahe eilt dem Fernen voraus, der einzige Teil,
   den Ken Burns selbst nicht haben konnte.
3. **Die Tiefenspur fertigmachen** und dann den Browser-Teil, der sie an der Videozeit abgreift.
4. **Ein Release.** Seit 1.0.9 liegen acht substanzielle Änderungen drin.

### Was Caspar_D entscheiden muss

- **Welche Lesart** die Zielsuche nimmt (vier Blätter liegen im Chat, `KB_LESART` im Code).
- Ob die **Vorgabe des Ausschnitts** von 0,80 herunter soll — bei 0,80 liegen 16 von 18 Zielen am
  Anschlag, die Zielsuche wird erst ab etwa 0,67 zu einer Wahl.
- Ob ein Lauf im Clip **nicht** geschlossen sein soll (dann springt die Naht).
- **Video Depth Anything** (CVPR 2025, Small ist Apache-2.0, 28 statt 335 Mio Gewichte) würde das
  Zittern *und* die Rechenzeit lösen — braucht einen Download und einen ONNX-Export.

---

## Ken Burns, Schritt 4: die Parallaxe (18.09.2026)

Gebaut, gemessen, eingesetzt. Der einzige Teil der Fahrt, den Ken Burns auf seinem Rostrum-Tisch
mit einem Abzug nicht haben konnte. Die ganze Sache steht in
`docs/effektclip/KONZEPT-KEN-BURNS-FAHRT.md` Abschnitt 8; hier nur, was der Nächste wissen muss.

### Die drei Entscheidungen, die den Bau bestimmt haben

1. **Keine Schichten, ein Marsch.** Über 325 Tiefenkarten gemessen: bei vier Schichten und 3 %
   Stärke sind **98 % der aufreißenden Grenzen erfunden** — die Karte hat dort keine Stufe, die
   Schichtung schneidet Höhenlinien in glatte Flächen. Und die Lochfläche fällt nicht mit mehr
   Schichten, sie **steigt** (1,84 % → 2,92 %). Vier Schichten sind für die Teilchen richtig und
   für ein Bild falsch: Teilchen *sind* Punkte in Entfernungen, ein Bild ist eine Fläche.
2. **Die Verschiebung ist strahlig.** Der Kameraweg an einer Stelle ist genau das, was der
   Ausschnitt dort schon verschiebt. Daraus folgt: eindimensionale Rückwärtssuche, und bei w = 0 ist
   der Weg null — **die Naht ist bitgleich, ohne dass etwas dafür getan werden musste.**
3. **Die Grenze ist gerechnet.** `KB_PX_GRENZE` aus `LÜCKE = s_px·d − 1` und dem größten Nähesprung
   je Bildpunkt (Median 0,3788 über 325 Karten; unabhängig nachgemessen 0,3804 und 0,396). Regler
   endet bei **2,6 %**, Vorgabe **1,5 %**, Kosten 0,087 ms je Bild — ein Tiefenband.

### Der Fehler, und wer ihn gefangen hat

Die Parallaxe ersetzt das `drawImage`, mit dem der Ausschnitt sonst auf die Leinwand kommt. Die
**Vorbereitung** schnitt danach weiter mit den Quellkoordinaten aus und zoomte ein zweites Mal in
ein fertiges Bild — mittlere Abweichung **56,4 von 255**, größte 255.

Gefunden hat ihn nicht der Augenschein, sondern das Nachtragen der Prüffälle. Zwei Lücken im
Prüfstand, beide seit dem 18.09.2026 geschlossen:

- **Die Ken Burns Fahrt stand in keinem einzigen Fall.** `kenburns` fehlte in `TYPEN`, es gab keine
  Gruppe. Jetzt: `kenburns` in der Pflichtliste plus Gruppe `kenburns` mit den fünf übrigen Läufen,
  drei Reglerstellungen und dem Titel b. Ergebnis `labor/nahtpruefung/ergebnis-kenburns.json`,
  **`gleich = 0,00` bei allen elf**.
- **Es stand nie eine Vorbereitung in einem Fall.** Der Prüfstand kennt jetzt `vorb` je Fall
  (`haken.js`, geht durch `vorbAus()` wie ein gespeichertes Rezept). `kb-parallaxe-vorb` ist der
  Fall, der den Fehler trug.

Gegenprobe gegen die alte Zeile in einem Sandkastenbaum: von fünf Fällen ist **genau der eine**
verändert, die anderen vier bitgleich.

### ACHTUNG: `faelle-bauen.js` ist faelle.json NICHT mehr gleich

`labor/nahtpruefung/faelle.json` ist von Hand gewachsen und dem Erzeuger **voraus**: es trägt die
Titel d und e, die Gruppe `taktlage` (15.09.) und die Gruppe `kenburns` (18.09.). Ein Lauf von
`faelle-bauen.js` würfe sie weg — 181 Fälle dort gegen 188 hier. Der Erzeuger bleibt als Herkunft
der Titelwahl und der Pflichtliste `TYPEN` stehen; neue Fälle kommen **von Hand** in `faelle.json`,
und derselbe Eintrag daneben in `faelle-bauen.js`, damit beide dasselbe sagen. Steht auch im Kopf
der Datei.

### Was Caspar_D noch ansehen muss

- **Die Schrift.** Suno schreibt den Titel auf viele Cover, und die Tiefenkarte hält aufgedruckte
  Schrift für ein **nahes Objekt**. Auf Blatt „Bewegung" ist das beim **mittelsten Titel des
  Bestands** zu sehen, nicht bei einem Ausreißer. Bei 1,5 % fällt es nicht auf, bei 2,6 % wandern
  die Zeilen. Auswege: Regler tiefer, oder Parallaxe an geraden langen kontrastreichen Kanten
  dämpfen. Bewusst ist der einfache Weg gebaut.
- **Ob es sich als Kamera liest.** Im stehenden Vergleich sieht man bei der Vorgabe nichts; in der
  Bewegung schon. Das gehört dem Auge.

### Was die Parallaxe nicht mitnimmt

Sie verschiebt das Bild; die Tiefenkarte für Masken, Teilchenbänder und Geburtsort fährt weiter nur
mit der Geometrie. Restversatz höchstens 13,5 (Vorgabe) bzw. 23,3 Bildpunkte (voll) — zum
Vergleich: der am 18.09. ausgeräumte Fehler „die Karte fuhr nicht mit" war bis 364 groß. Steht als
Kommentar im Code, nicht als Versehen.

---

## Die eine Ken Burns Fahrt — Zielpunkte von Hand (18.09.2026, abends)

Eine **Spezifizierungsrunde**, wie Caspar_D sie will: Satz für Satz durchgegangen, und am Ende war
der Entwurf **kleiner** als vorher. Die Spezifikation steht in
`docs/effektclip/KONZEPT-ZIELPUNKTE.md`.

### Was Caspar_D dabei über die Arbeitsweise gesagt hat — das Wichtigste des Tages

> *„ich würde am liebsten die Effekte einen nach dem anderen aus dem Entwurf in den Profimodus
> bringen. Diese vielen zugleich-Änderungen kosten so viel Zeit und wenn es dann nicht sitzt,
> fangen wir immer und immer wieder an."*
>
> *„das habe ich diese ganze Woche gelernt, wir haben ständig an allen Effekten zugleich optimiert
> und nichts ist wirklich fertig geworden und das Zeit-Regime ist völlig aus dem Ruder gelaufen."*

Und die Berichtigung, die dazugehört — ich hatte geschrieben, es sei ja „nur eine Zeile Code":

> *„wenns so wäre, wäre es kein Problem, du hast aber jedesmal die 5 h Testmaschinerie angeworfen,
> damit war es eben nicht nur eine Zeile."*

**Die Größe einer Änderung ist die Größe ihres Beweises.** Eine Zeile plus eine Messreihe über 325
Karten ist ein halber Tag. Der Nachweis wird ab jetzt auf das Risiko zugeschnitten:
Grundlinienvergleich (Minuten) für alles, was den gemeinsamen Malweg anfasst — eine Messreihe über
den Bestand nur dann, wenn eine Zahl im Code oder in der Oberfläche daraus hervorgeht.

Dazu die Rollen, von ihm gesetzt: *„du bist der Chefentwickler und ich der Architekt."* Der
Architekt zeichnet zuerst. Ich hatte an diesem Abend zweimal zu bauen angefangen, bevor die
Zeichnung stand, und beide Läufe wieder gestoppt.

### Was eingesetzt ist

**Eine** Fahrt statt sechs Läufen. Caspar_Ds Satz, aus dem alles folgt:

> *„wir fangen immer im Ganzbild an, dann zoomen wir während der Wanderung zum ersten Punkt —
> Suchen die Schärfe (ggf), verharren, laufen weiter, am Ende zoomen wir wieder aufs gesamtbild."*

| | |
|---|---|
| `KB_LAEUFE`, Regler „Lauf" | **gefallen** — was die Läufe unterschied, ist jetzt Zahl und Lage der Punkte |
| Regler „Ausschnitt" | **gefallen** — jeder Punkt trägt seine eigene Enge (siehe „Zu entscheiden") |
| Zielpunkte | Liste am Effekt, höchstens fünf, Ort in Anteilen der **Quelle**, eigene Enge |
| beim Einfügen | **zwei Punkte kommen mit**, von der Zielsuche vorgeschlagen — der einzige Ort, an dem sie noch läuft |
| Halte | alle gleich lang, aus dem Rest gerechnet; die Zeile sagt in Sekunden, was wirklich passiert |
| Parallaxe | Vorgabe **0** |
| Bedienung | Glockenstuhl: klicken setzt, ziehen bewegt, Mausrad gibt die Enge, **Doppelklick löst** |
| Bühne | zeigt das ganze Bild und die Fahrt steht, solange die Karte offen ist |
| die alte „Fahrt" | **gelöscht**, mit ihr `tri()`; die Vorlage „Traum (weich)" fährt jetzt Ken Burns |

Die Effektkarte hat damit nur noch **zwei** Regler: Tempo und Parallaxe. Die Punkte sind die Regler.

### Das Erste, was morgen angesehen werden muss

**Mit der Vorgabe bleibt auf 44 % der Titel kein einziger Halt übrig.** Gerechnet über die 324
Katalogtitel aus `ergebnis-taktlage.json`, Tempo 1:

| Punkte | kein innerer Halt |
|---|---|
| 1 | 13 von 324 (4 %) |
| **2 (Vorgabe)** | **142 von 324 (44 %)** |
| 3 | 256 von 324 (79 %) |
| 5 | 318 von 324 (98 %) |

Die Ursache ist die Körnung: ein Zug dauert mindestens **einen ganzen Takt**, und in einen
Zehnsekünder passen nur drei bis vier Takte. Zwei Punkte brauchen drei Züge — dann ist der Clip
voll und es bleibt nichts zum Stillstehen. Die Zeile unter der Liste sagt das ehrlich
(„Für die Punkte bleibt kein ganzer Schlag übrig — sie werden nur berührt"), aber damit fällt
genau das Gesetz weg, das den Effekt ausmacht.

**Das ist eine Architektenfrage, keine Reparatur.** Mögliche Antworten: Tempo in **halben** Takten
statt ganzen; oder ein Zug ist von sich aus ein halber Takt; oder die Züge werden in Schlägen
gerechnet und nur die Halte in Takten. Nicht selbst entschieden.

### Zwei Dinge, die ich entschieden habe und die Caspar_D gehören

1. **Der Regler „Ausschnitt" ist mitgefallen.** Die Spezifikation sagt, jeder Punkt hat seine eigene
   Enge — dann wären zwei Wahrheiten über dieselbe Zahl eine zu viel. Sein Bereich und seine
   Vorgabe leben als `KB_ENGE_MIN/MAX/DEF` weiter und sind die Enge, die ein neuer Punkt erbt, wenn
   es keinen gibt, von dem er sie nehmen könnte. Kein Rezept im Archiv trägt `kenburns`, es verliert
   also keines eine Einstellung.
2. **Das Hauszeichen wurde gehärtet, und das war nicht in Auftrag.** Der Schwachstellenagent fand,
   dass `.complete` bei einer `data:`-URI nichts verspricht und ein SVG in Chrome je Zielgröße neu
   gerastert wird — das Zeichen konnte in den ersten Exportbildern fehlen und mitten im Clip
   hineinspringen. Die vermutete Ursache wurde am Ende **widerlegt** (die 318 Bildpunkte kamen von
   der Messung selbst), die Stelle aber trotzdem gehärtet: `zeichenBereit(W,H)` wartet vor dem
   ersten Bild auf `decode()` **und** auf den Beweis, dass der Raster in genau dieser Zielgröße
   steht. Es ändert keinen Bildpunkt (Bild 0 trägt denselben Hash wie vorher), aber es fasst den
   gemeinsamen Exportweg an — also gegen die Regel „eine Baustelle". Steht hier, damit es nicht
   unbemerkt bleibt.

### Die Nachweise

- **Syntax:** 1 Inline-Skript, baut.
- **Naht:** alle zehn Fälle mit Typ `kenburns`, `gleich = 0,00` und `gleichFolge = 0,00`. Neu:
  `kb-einPunkt`, `kb-zweiPunkte`, `kb-fuenfPunkte`, `kb-ohnePunkt`, `kb-tempo2-b`. `kb-ohnePunkt`
  hat `p95 = 0,00` — ohne Punkt steht das Bild wirklich.
- **Grundlinie:** 191 Fälle in Studiogröße gegen `studio-parallaxe.json` — **181 bitgleich, 5
  verändert, und alle fünf sind Ken-Burns-Fälle**; dazu 5 ohne Vergleichsfall, weil neu. Sonst hat
  sich nichts bewegt.
  **Eine Unstimmigkeit, die offen bleibt:** Der Nachbesserungsagent sah in seinem Lauf
  `rand-wenige7-risse` abweichen und wies nach, daß derselbe Fall auch mit der völlig
  unveränderten Vorlage abweicht (Grundlinie hält `t0 = 0,2`, gerechnet wird `t0 = 60,3`). **In
  meinem eigenen Lauf kam der Fall `GLEICH` heraus.** Einer von beiden Läufen hat also einen
  Zwischenstand erwischt. Der Fall trägt `daten: 'ohneEins,wenige:7'` — die Datenvariante bestimmt
  `t0`. Wer das nächste Mal misst: darauf achten, und im Zweifel `--neu`.
- **Marken nicht im Export:** gemessen, nicht behauptet. Bühne mit Karte 220 Bildpunkte
  Markenfarbe, ohne Karte 0; Export und Kachel bitgleich mit offener und geschlossener Karte,
  Markenfarbe dort 0. Die erste Fassung der Probe konnte nicht auslösen und meldete leeres Grün —
  der Schwachstellenagent hat es gefunden.
- **Zehn Befunde** von Schwachstellen- und Testagent, acht behoben, einer widerlegt (und die Stelle
  trotzdem gehärtet), einer war ein Berichtsfehler. Der schwerste: der äußere Halt bekam nur den
  Rundungsrest — bei einem Punkt stand das Ganzbild auf **320 von 324** Titeln kürzer als ein
  innerer Halt, auf 80 exakt null Bilder. Behoben (`kbPlan`, Teiler `L` statt `n`), nachgerechnet:
  0 von 324.

### Was als Nächstes ansteht — in dieser Reihenfolge, eins nach dem anderen

1. **Die Körnung des Tempos** (siehe oben) — Architektenfrage.
2. **Fokussieren bei Ankunft** (aus | gerichtet | suchend). Davor die Kosten der Weichzeichnung je
   Tiefenband messen, mit Zaunmarke.
3. Das eine Archivrezept mit der alten `fahrt` über den Weg der App bereinigen
   (`library/songs/a459b95e-…`, der Eintrag steht dort auf `an: false`).
4. **Die Sliderwüsten** — eigener Arbeitsgang, noch nicht beauftragt. Caspar_D: *„wir müssen
   sowieso die sliderwüsten etwas ausdünnen und schönere Entwürfe machen."* Die vier x/y-Schieber
   bei Laser und Strahlen sind die nächsten Kandidaten für die Marke auf der Bühne.

---

## 19./20.09.2026 — Fokus, Prüfstand, Diorama. Und drei neue Hausregeln.

### Eingesetzt

| Commit | Sache |
|---|---|
| `696da8d` | **Fokus bei Ankunft** (Scharf \| Unscharf \| Suche) als Bewegungsunschärfe, Zoom bis **0,25** mit Vergrößerungsangabe an der Marke, Knopf „Punkt hinzufügen", und: **der Zielpunkt wandert nicht mehr** |
| `0896c7a` | **Prüfstand repariert** — die Songzeit wurde nie zurückgesetzt |
| `dcaa5e4` | Hausregeln: Stichprobe statt Rundumschlag, Zeitansage; Spezifikationen Tiefenebene und Diorama |

### Der Prüfstandsfehler — der wichtigste Befund des Tages

```js
if(typeof f.jetzt==='number') window.audio = { paused:false, currentTime:f.jetzt };
```

Gesetzt wurde nur, **zurückgesetzt nie**. Fünf von 193 Fällen tragen ein eigenes `jetzt`; einer davon
`rand-jetzt-anfang` mit **0,2**. Jeder Fall danach im selben Fenster erbte diese 0,2 statt der
Katalogvorgabe **60,3**. Dreimal an einem Tag hat der Prüfstand deshalb Alarm geschlagen, wo nichts
war — und die andere Richtung ist die schlimmere: **ein echter Rückschritt kann auf demselben Weg
durchrutschen.** Alle Grundlinien vor dem 20.09. sind für Fälle nach einem `jetzt`-Fall
unzuverlässig; `studio-zielpunkte.json` ist neu aufgenommen.

### Der wandernde Zielpunkt — ein Modellfehler, kein Tippfehler

`kbOrt` klemmte u/v auf `z/2 … 1−z/2`, also auf den Bereich, in dem ein Ausschnitt dieser Enge ganz
im Bild liegt. Wer am Mausrad die Enge **vergrößerte**, schob damit den Punkt nach innen — die
Stelle wanderte unter dem Zeiger weg. Caspar_D: *„ein Unding."*

**Ein Zielpunkt ist eine Stelle im Motiv, kein Rechteckmittelpunkt.** Der Maler klemmte ohnehin
schon richtig (`kbZug` begrenzt den Schwenk auf −1…1). Es braucht genau **eine** Klemme, und die
gehört an das Rechteck. Jetzt: die Marke steht, wo gezielt wurde; der Rahmen steht, wo die Kamera
ankommt. `kbWand` ist ersatzlos gefallen.

### Das Diorama — eingesetzt als `f6678da`

Caspar_D beim Ausprobieren: *„der Zoom muss auf alles wirken, auch Effekte müssen mitgezoomt
werden."* Und zur Lösung: *„die idee, die Ken Burns erst ganz hinten draufzulegen ist konsequent."*

Der Malweg hat jetzt **drei Stufen**: Diorama (Quelle, Vorbereitung, 21 Szenen-Effekte, in
Quellkoordinaten auf eigener Leinwand) → Kamera (Ausschnitt, Zoom, Kippen, Parallaxe,
Bewegungsunschärfe, Schärfe) → Objektiv/Film (13 Effekte wie bisher). Die Einsortierung steht als
`STUFE_DIORAMA / STUFE_KAMERA / STUFE_OBJEKTIV`; ein Typ ohne Stufe meldet sich auf der Konsole.

Caspar_D hat die Fassung vor der Prüfung angesehen: *„ken burns vergrössert auch den vogelschwarm,
toll."* Danach 18 Befunde von Schwachstellen- und Testagent, vier davon schwer, alle abgearbeitet.

**Die zwei schweren, die man kennen muss:**

1. **Zwei Archivrezepte ändern ihr Bild, obwohl sie KEINE Kamerabewegung haben.** Die Stufentrennung
   zieht einen Objektiv-Effekt hinter einen Szenen-Effekt, und farbiges Abwedeln ist nicht
   vertauschbar. `0ac2e049` (`filmnebel › strobe › licht › licht` → das Stroboskop rutscht ans Ende)
   und `6250449b` (`sicherung › partikel` → das Sicherungswackeln brennt jetzt auch die Asche ab).
   Die Umsortierung ist richtig (KONZEPT-DIORAMA §6), die **Zusage „bitgleich" war falsch** — sie
   steht jetzt richtig bei `dioramaMass`, und das Studio sagt es, statt es dem Auge zu überlassen.
2. **Der Leinwand-Vorrat deckelte das Diorama still bei 3,6 Mpx** (`DF_BYTE/(7*4)`). Bei einer Quelle
   darüber — 4K-Foto, 4K-Video — wurde verkleinert, *bevor* die Kamera hineinfuhr: die Fahrt war an
   der Ankunft **weicher als vor dem Umbau**, also genau der Fall, gegen den der Umbau antritt. Jetzt
   meldet `dioStandZeigen()` es in einer Zeile — aber nur, wenn wirklich gedeckelt wird.

Dazu behoben: kein sauberer Rückfall bei Speichermangel, und der Zustandsstapel wuchs je Bild um
eins (`ca.save()` ohne `restore()` im Fehlerfall).

**Nachweise auf dem eingesetzten Stand:** Naht über alle 17 kenburns-Fälle `gleich = 0,00`, einzeln
gelaufen. 198 Fälle in Studiogröße: 183 bitgleich, 15 verändert — und **keine der 15 stammt aus den
Reparaturen**: dieselben Fälle tragen mit der Fassung vor den Eingriffen bitgleich dieselben Hashes.

**Ein offener Rest, benannt und nicht verstanden:** zwei Nahtfälle (`kb-fuenfPunkte`,
`kb-fokus-unscharf`) flackern gelegentlich — 3 von 14 Läufen. Der Testagent hat zwei
Warmlauf-Erklärungen geprüft und beide widerlegt; die Messreihe steht als Kommentar bei `vorlaufen`.
Der Fehler steckt in beiden Fassungen, ist also kein Rückschritt, und die Quotienten liegen weit
unter der Sichtbarkeitsschwelle. **Bleibt zu klären.**

**Zwei bewusste Abweichungen des Bauagenten von der Spezifikation** — beide zugunsten der Sache:

1. **Das Diorama wird höchstens so groß gemalt, wie die engste Kamerastellung es ausnutzt.** Folge:
   ein Rezept ohne Kamerabewegung bleibt **bitgleich**. Die angekündigte Überabtastung „an jedem
   Rezept" tritt damit nicht ein. Statt „fast alles erklärt verändert" steht **183 von 198
   bitgleich, 15 verändert**.
2. **Kein Deckel bei 1080** — er hätte die Fahrt *unschärfer* gemacht als vorher.

**`geoKarteLegen` ist NICHT gefallen**, und das ist ein Befund: die Funktion hat noch drei Rufer,
und jeder braucht die Kamera (die Spalte „Aufenthalt" hängt auch an Filmkorn, Scanlines, Bloom,
Linse; dazu die Trennebenen-Ansicht). Weggefallen ist nicht die Funktion, sondern der **Weg**: alles,
was die Tiefenkarte wirklich benutzt, fragt sie nicht mehr um, weil im Diorama nichts umzurechnen
ist.

**Kosten, gemessen an fünf echten Ketten auf der Radeon:** Quellauflösung kostet das 1,31- bis
1,38-fache; bei zwei von fünf gar nichts (Quelle ≤ 1080). Im ungünstigsten Fall (1,78-fache Fläche)
1,76 bis 1,88, teuerste Kette 14,4 ms = 43 % eines 30-Hz-Bildes. **Der Filmnebel trägt den
Unterschied fast allein** (einziger Effekt über 2,0); **Teilchen skalieren gar nicht.**

### Was die Stufe entscheidet — und wo sie folgenlos ist

Die Stufe macht nur dann einen Unterschied, wenn der Effekt **eine Länge im Bild** hat: Radius,
Versatz, Korngröße, Zellbreite. Folgenlos bei: den vier Farbpulsen (Helligkeit, Kontrast, Sättigung,
Farbton), Stroboskop und Farbschleier. Bei allen anderen entscheidet sie.

Caspar_D hat den **Farbkanal-Puls** am Bild geprüft: sein Versatz bleibt beim Zoom konstant, weil er
am Objektiv sitzt. Läge er im Diorama, wäre er bei Enge 0,25 viermal so breit.

### Drei neue Hausregeln (stehen in CLAUDE.md)

1. **Eine Baustelle.** *„wir haben ständig an allen Effekten zugleich optimiert und nichts ist
   wirklich fertig geworden."*
2. **Die Größe einer Änderung ist die Größe ihres Beweises.** *„du hast aber jedesmal die 5 h
   Testmaschinerie angeworfen."*
3. **Stichprobe statt Rundumschlag.** Prüfsatz sind die **10 neuesten Titel plus die Testbilder**,
   gerechnet, nicht abgeschrieben. Nie an allen. Instrumentalstücke so gut wie nie (`istInstrumental`,
   64 von 325). Dazu: **bauen, zeigen, dann prüfen** — *„damit wir nicht erst nach 4 h Fehler sehen,
   wo man schon hätte nach Augenmaß sehen können."*

### Offen, in dieser Reihenfolge

1. ~~**Tempo in Schlägen** statt in Takten — durchspezifiziert. Vorgabe **2 Schläge**; am Prüfsatz
   gerechnet: bei zwei Punkten hat dann jeder der neun Titel einen Halt (0,5–2,0 s), bei heutigem
   Tempo 1 (= 4 Schläge) haben **sechs von neun keinen**.~~ — gebaut am 23.09.2026.
3. **Tiefenebene** — durchspezifiziert (KONZEPT-ZIELPUNKTE Abschnitt 12): ±10 % um die Tiefe des
   Zielpunkts scharf, außen zunehmend weicher, nur im Halt, kommt und geht, am Rand geschnitten
   statt verschoben, ohne Karte Rückfall auf Bewegungsunschärfe.
4. **Module herauslösen.** Der Song-Analyzer ist längst extern (`web/fremd/analyzer.js`, 397 KB);
   `index.html` trägt 35.339 Zeilen in **einem** `<script>` (4569–35336). Reihenfolge: Effektclip-
   Studio (Grenze erprobt, Haus-Ersatz nur 12 KB), dann Tonstudio, dann Bühne.

---

## 20./21.09.2026 — Die Tiefenebene, und die Fahrt bekommt ihre eigene Bahn

### Eingesetzt

| Commit | Sache |
|---|---|
| `8afdeaa` | Hausregel: kein selbst gestarteter Prüflauf über zwei Minuten |
| `75cbea5` | Hausregel: der volle Lauf braucht einen Verdacht, keine Erlaubnis |
| `f8e4753` | **Die Tiefenebene** (vierte Stellung „Fokus bei Ankunft") **und die eigene S-Kurve der Fahrt** |

### Zwei neue Hausregeln, und sie sind die wichtigsten des Tages

Caspar_D: *„du stösst bitte selbständig keine umfangreichen tests an, die länger als 2 min dauern.
Da wird vorher gefragt und begründet bitte. Ich gebe den Startschuß."* Und, als Begründung
nachgereicht: *„wir haben letzte Woche leider sehr viele ineffiziente Läufe über alle Effekte
gemacht, jedes mal 6 h und länger … Ich habe per se kein Problem mit pedantischen Tests, aber nicht,
wenn auch Stichproben reichen und nur bei begründetem Verdacht, nicht einfach alles durchtesten."*

Damit ist die Reihenfolge umgedreht: **zuerst die Stichprobe, die volle Runde erst, wenn sie etwas
zeigt** — und dann gezielt auf den Verdacht. Ein voller Lauf ist das Werkzeug zum Nachgehen, nicht
der Normalbeweis. Und wo pedantisch geprüft wird, geht es **in die Tiefe, nicht in die Breite**:
der eine auffällige Effekt mit allen Reglerstellungen, nicht alle 38 mit je einer.

Das Argument dahinter, das die Regel trägt: 38 Effekte geben 1406 geordnete Paare (machbar), aber
schon **50.616 Dreierketten** — und die echten Rezepte im Archiv sind zwei bis fünf Glieder lang.
**Die Kombinatorik versagt genau dort, wo die echten Rezepte leben.** Was ein Kombinationstest
sucht, entsteht ohnehin fast nie im Effekt, sondern in dem, was sie sich teilen: Koordinatensystem,
Maß (`EINHEIT`), Stufe und Reihenfolge, Zustandsstapel, Leinwand-Vorrat. Das sind fünf Stellen, und
ein Fehler dort zeigt sich an *jeder* Kette — also auch an fünf echten.

### Die Tiefenebene — und was die Messung am Entwurf geändert hat

Gemessen **vor** der ersten Zeile, auf der Radeon Pro 5500 XT (ANGLE Metal), 792×1080, Canvas2D,
drei Runden à 60 Bilder mit einem Zaun je Messung:

| | ms/Bild | je Band |
|---|---|---|
| Leerlauf | 0,143 | |
| 1 Band, Radius 2 | 1,067 | 0,923 |
| 1 Band, Radius 6 | 1,082 | 0,938 |
| 1 Band, Radius 14 | 1,007 | 0,863 |
| 3 Bänder | 2,570 | **0,809** |

**Der Radius kostet nichts.** Zwischen Radius 2 und 14 liegt nur Rauschen — die Kosten stecken
vollständig in den vier Vollbildzügen je Band. Die teure Achse ist die **Zahl der Bänder**, nicht
die Stärke der Unschärfe. Vorhergesagt war 0,4–1,5 ms je Band (getroffen: 0,86); *nicht*
vorhergesagt war die Gleichgültigkeit gegen den Radius, und sie hat den Entwurf geändert: bei der
Weichheit großzügig, beim Gradienten zählen. Drei geschachtelte Bänder = 2,43 ms = 7,3 % eines
30-Hz-Bildes.

**Geschachtelt, nicht nebeneinander:** je Band wird der *laufende* Stand geschnappt, nicht das
Original. Die Radien addieren sich quadratisch, außen stehen rund 9,4 Studiopunkte. Läge je Band
das Original darunter, löschte Band 2 die Arbeit von Band 1.

**Die Maske hängt nicht am Hub.** Der Prozess „kommt und geht" läuft über den Radius; die Maske
bleibt über den ganzen Halt fest und kommt aus `TIEFEMASKEN`. Sonst wechselte der Schlüssel je Bild
und es käme ein `getImageData` über 855.360 Bildpunkte je Band dazu — die gemessene Zahl wäre eine
andere.

Eine Risikovorhersage war **zu pessimistisch**: `geoKarteLegen` legt eine Karte über den globalen
Kamerazustand auf, Stufe 3 benutzt denselben Weg schon — es gibt keinen doppelten Ausschnitt.

### Die Fahrt bekommt ihre eigene Bahn — auf Caspar_Ds Einwand

Er fragte: *„bist du sicher, dass die kamerafahrten noch vorsichtig abbremsen und anfahren, also
nicht einfach so losgehen und stehen."* Nachgesehen statt behauptet: die Klammer war intakt, aber
die Kurve war ein **Trapez**, und die Beschleunigung springt viermal je Zug. Dazu der Befund, dass
`schleifePendelWeg` **geteilt** war — Fahrt und Videoschleife an einer Zahl.

> *„hab ich nie gesagt, dass sich pendel und ken burns die gleiche Kurve teilen sollen. separier das
> und mach ne S-Kurve für Ken Burns."*

Und, als die neue Kurve immer noch über die alte erklärt wurde:

> *„Pendel fällt auf sich zurück, hier bei dieser Fahrt ist es kein Pendel. wir haben Stationen, die
> angefahren werden."*

Das ist keine Nomenklaturfrage: ein Pendel kehrt um, seine Enden sind Umkehrpunkte. Diese Fahrt
kehrt nirgends um — sie fährt eine Station **an** und steht dort. Daraus folgt, warum das Tempo an
beiden Enden null sein *muss*: nicht aus Symmetrie, sondern weil davor und dahinter ein Stillstand
liegt. Der Kommentar im Code hieß „DIE KURVE IST DIE DES HAUSES" und begründete ausdrücklich,
warum keine zweite gebaut wird; er heißt jetzt „DIE BAHN EINES ZUGS: VON STATION ZU STATION".

Die Spezifikation steht in `KONZEPT-ZIELPUNKTE.md` Abschnitt 13. `schleifePendelTempo` ist
gelöscht (ein Rufer), die Videoschleife unverändert. **Jedes Ken-Burns-Rezept sieht anders aus als
vorher** — der Zweck, keine Nebenwirkung. Naht über fünf Fälle `gleich = 0,00`, `kb-ohnePunkt` mit
`p95 = 0,00`.

Caspar_D nach dem Ansehen: *„auf jeden fall siehts gut aus."*

### Offen, in dieser Reihenfolge

1. ~~**Tempo in Schlägen** statt in Takten — durchspezifiziert. Vorgabe **2 Schläge**; bei heutigem
   Tempo 1 (= 4 Schläge) haben sechs von neun Titeln des Prüfsatzes keinen Halt.~~ — gebaut am 23.09.2026.
2. **Anfahren und Auslaufen gleich lang** — bei einer Fahrt zu einer Station keine Notwendigkeit,
   sondern eine Entscheidung über das Bild. Wer das Ankommen betonen will, lässt länger aus als er
   anfährt (etwa 20 % zu 35 %). Die Bahn ist vorbereitet, es bräuchte zwei Konstanten statt einer.
3. **Module herauslösen.** Reihenfolge: Effektclip-Studio, dann Tonstudio, dann Bühne.
4. **Sliderwüsten ausdünnen** — eigener Arbeitsgang, noch nicht beauftragt.

**Der offene Rest von gestern bleibt offen:** zwei Nahtfälle (`kb-fuenfPunkte`, `kb-fokus-unscharf`)
flackerten gelegentlich, 3 von 14 Läufen. In den Läufen vom 20./21.09. liefen beide stabil — das
sagt bei einer Quote von 3/14 nichts, ist aber notiert.

---

## 21.09.2026 — Das Lichtmodell. Und zwei Hausregeln, die den Tag davor erklären.

### Zwei neue Hausregeln (stehen in CLAUDE.md)

**1. Kein selbst gestarteter Prüflauf über zwei Minuten.** *„Da wird vorher gefragt und begründet
bitte. Ich gebe den Startschuß."* Darunter läuft ohne Rückfrage: Syntaxprüfung, ein einzelner
Nahtfall, Lesen und Suchen. Darüber wird angesagt und gewartet. **Nicht in kleine Läufe zerlegen**,
um unter die Schranke zu kommen.

**2. Der volle Lauf braucht einen Verdacht, keine Erlaubnis.** *„Ich habe per se kein Problem mit
pedantischen Tests, aber nicht, wenn auch Stichproben reichen und nur bei begründetem Verdacht."*
Zuerst die Stichprobe, die volle Runde erst, wenn sie etwas zeigt — und dann **in die Tiefe, nicht
in die Breite**: der eine auffällige Effekt mit allen Reglerstellungen, nicht alle 38 mit je einer.

Das Argument dahinter: 38 Effekte geben 1406 geordnete Paare, aber **50.616 Dreierketten** — und
die echten Rezepte sind zwei bis fünf Glieder lang. Die Kombinatorik versagt genau dort, wo die
echten Rezepte leben. Was ein Kombinationstest sucht, entsteht ohnehin fast nie im Effekt, sondern
in dem, was sie teilen: Koordinatensystem, Maß, Stufe, Zustandsstapel, Leinwand-Vorrat.

### Das Prüfverfahren steht im Backlog — und Caspar_D hat es entschieden

*„Wir haben ein Testregime, von dem ich gar nicht weiß, was es tut und bewirkt, weil wir es nie
gemeinsam spezifiziert haben."* Die Inventur steht in `docs/BACKLOG.md`: **haken.js hat 856 Zeilen
und reicht 15 Funktionen nach außen, sieben davon ohne jeden Rufer.**

**Der schwerste Einwand, belegt:** Das Maß war Konservierung, nicht Qualität. Das Diorama-Konzept
hatte die Überabtastung als *Verbesserung* angekündigt; gebaut wurde die Fassung, die **bitgleich
bleibt** — und das stand als „bewusste Abweichung zugunsten der Sache" in der Übergabe. Es war eine
Abweichung zugunsten des Prüfstands. **Ein Maß, das Gleichheit belohnt, erzeugt Gleichheit.**

**Die vier Anforderungen, von Caspar_D gesetzt:**

| | | Werkzeug |
|---|---|---|
| 1 | Die Naht muss erreicht werden | `naht.mjs` ✔ |
| 2 | Eine Änderung am Effekt muss das Bild ändern | `messreihe.js`, lief zuletzt am 10.09. |
| 3 | Die Zeit darf nicht schlechter werden, außer es geht nicht anders | verstreut |
| 4 | Kein Regler darf einen anderen verstellen | **fehlt ganz** |

**Der Grundlinienvergleich kommt in dieser Liste nicht vor.** Anforderung 2 dreht die Beweislast um:
Nicht die Bildänderung muss sich rechtfertigen, sondern ein Regler, der nichts tut.

### Zwei Begriffe geradegezogen

**„Grundlinie" stand für zwei entgegengesetzte Dinge.** Die **Messreihe** misst Wirkung (eine Null
ist ein Alarm), der **Studiostand** misst Gleichheit (eine Null ist der Erfolg). Beide hießen
gleich, und darum stimmte der Satz „ein Grundlinienvergleich kostet Minuten" für das eine und war
um den Faktor zehn daneben für das andere. In Dateien gezählt: **eine Wirkungsmessung (10.09.),
vier Gleichheitsstände (15., 18., zweimal 20.09.).**

**Die „Naht" ist nicht die Spalte, die so heißt.** `gleich` und `gleichFolge` beantworten
*„schließt der Loop?"*; `naht` ist der Sprung von Bild N−1 auf 0 und wird erst interessant, wenn
`gleich > 0` ist.

---

## Das Lichtmodell — der große Bau des Tages

Alles in `docs/effektclip/KONZEPT-LEUCHTEN.md`. Ausgelöst durch einen Satz: *„mir gefällt ehrlich
gesagt der Lichtpuffer nicht … es ist die 2dimensionalität für etwas dreidimensionales."*

### Die drei Befunde, alle am Code nachgelesen

1. **Seit dem Diorama nutzen alle die Tiefenkarte — nur das Licht nicht.** Parallaxe, Masken,
   Partikelbänder, Schlagschatten: alle. Eine Lampe hinter einer Figur leuchtete ihr durch den
   Rücken.
2. **`lichtOrtMittel()` lieferte den Schwerpunkt aller Lampen, einen Wert fürs ganze Bild.** Zwei
   Scheinwerfer links und rechts ergaben einen Lichtort in der Mitte, wo keine Lampe steht.
3. **Die Ausrichtung einer gerichteten Leuchte existierte nicht als Größe**, nur als Malergebnis.
   Ablesbar an den Krücken: `Bauart` beim Scheinwerfer, `Neigung (0 Wand, 1 Boden)`, `Drehen` und
   `Aufsetzen` beim Laser, `Einfall` am Streiflicht — womit der Ort einer Lampe auf **zwei
   Effektkarten** verteilt war.

### Was gebaut ist — „Scheinwerfer mit Tiefe" (`lichtRaum`)

Neubau neben dem Alten, die alten Effekte unberührt. **Rückwärtskompatibilität ausdrücklich
aufgehoben:** *„wenn uns die Rückwärtskompatibilität beschränkt in der Radikalität des Ansatzes,
dann will ich sie nicht."* Müsste der Neue „Ellipse mit Gefälle" nachbilden, lebte die alte
Formauswahl versteckt weiter.

| | |
|---|---|
| **Kegel auf dem Relief** | je Bildpunkt wird gefragt, ob er im Kegel liegt; Fleck, Verzerrung und Abfall fallen gemeinsam heraus. Ohne Karte liegt alles in Zieltiefe — dann kommt die Ellipse von selbst heraus, ein Weg für zwei Fälle |
| **Herkunfts-Puffer** | zweiter Puffer, RGB = Lampenort × Helligkeit, A = Helligkeit, beim Lesen RGB/A. Dieselbe Rechnung wie `lichtOrtMittel`, nur **je Bildpunkt** |
| **Streiflicht liest daraus** | der Regler `Einfall` ist damit überflüssig: die dritte Achse ist **gemessen statt gestellt** |
| **Pan und Tilt** | die Lampe **kippt**, erst Tilt, dann Pan (der Bügel sitzt auf dem Teller). Fünf Stellungen, loopfest über `lpBahn` |
| **Entfernungsgesetz** | 1/r², Bezug ist der Abstand Lampe–Ziel, geklemmt bei 4 |
| **Zwei Marken auf der Bühne** | Ziehen bewegt, Mausrad stellt die Tiefe; die Tiefe steht als Ring um die Marke |

**Der Beweis am Bild:** dasselbe Rezept, nur die Lampentiefe von 0,12 auf 0,98 — einmal Gegenlicht
mit Saum auf der Figur, einmal das modellierte Relief mit den Rippen des Mantels. Kein
`Einfall`-Regler angefasst.

### Vier Fehler, die Caspar_D am Bild gefunden hat

1. **`screen` statt `abwedeln`** — die Liste in Zeile 27507 überschreibt alle Leuchten, und der
   Neue stand nicht darin. Der Fleck lag als Farbe über dem Bild (Regel 5).
2. **Kein Antriebspult** — auch das wird je Effekt zugewiesen.
3. **Erst Pan, dann Tilt** — dadurch lief die Tilt-Drehung um die Welt-Waagerechte, die fest in der
   Bildebene liegt. *Der Kommentar behauptete bereits das Richtige und deckte den falschen Code zu.*
4. **Nicht im Vorrat** — die Auswahlliste wird aus der kuratierten `EGRUPPEN` gebaut, nicht aus
   `EFFEKTE`. Ein Effekt, den niemand einhängen konnte.

### Die Tiefe ist ordinal, nicht metrisch

Caspar_Ds schärfster Einwand: *„wir kennen die Tiefe nicht als Maßeinheit, folglich, welches r gilt
in der Tiefe?"* Die Karte sagt zuverlässig, **was** vorn ist — nicht, um **wie viel**. Jede
Rechnung, die Tiefe und Bildmaß mischt, braucht einen Umrechnungsfaktor, und den kann die Software
nicht ausrechnen.

**Daraus wurde ein Regler „Raumtiefe"**, und die Hausregel *„was die Software ausrechnen kann, wird
kein Regler"* greift hier ausdrücklich **nicht**: Ein Regler für etwas Unbekanntes ist ehrlich, eine
erfundene Konstante ist es nicht.

---

## Das Zonenmodell und die Vorbereitung

*„es gibt Fronteffekte und Hintergrundflächeneffekte, dann gibt es den Hintergrundraum, den
Vordergrundraum und den Vordergrundleerraum."*

**Die Vorbereitung hat jetzt drei Stationen** — Caspar_D: *„man könnte es durchaus als
Vorbereitungsstationen sehen: zuerst die Kurve, dann die Detailslider, dann die Tiefe."* Damit
greift Hausregel 26 in ihrem **ersten** Teil („was drauf setzt, bekommt eine Lasche"), nicht im
zweiten. Laschen mit Unterstreichung, die Pillen darin sind die Modi.

| Station | Inhalt |
|---|---|
| **Kurve** | Kanalwahl, Gradation, Gamma/Sigmoid, Tonwert |
| **Feinheiten** | Belichtung bis Temperatur (nicht „Farbe": es ist Tonwert) |
| **Tiefe** | Raumtiefe · Leerraum vorn · Trennung · Weichheit · Hintergrundfläche ab |

**Die Zonen gehören zur Szene, nicht zum Effekt.** Aus den Effektkarten sind `Grenze`, `Weichheit`
und `Leerraum vor Tiefenkarte` verschwunden; was bleibt, ist `tiefeWirkt` — *auf welcher Seite*
wirke ich.

**Hausregel 12 eingehalten:** Beim Laden werden die Werte aus den Effekten in die Szene gehoben, und
die Zeile sagt es. Genommen wird der **häufigste** Wert — nicht der erste (Zufall der Reihenfolge),
nicht der Mittelwert (ein Mittel zwischen zwei Trennebenen ist eine dritte). Betroffen: vier
Archivrezepte, eines mit drei verschiedenen Werten.

---

## Kosten, gemessen auf der echten Grafikkarte

`naht.mjs` hat einen Schalter **`--gpu`** bekommen. SwiftShader ist für Bitgleichheit richtig und
für Kosten die falsche Maschine — **und zwar für Canvas und Shader unterschiedlich falsch**
(Faktor 13 bis 29). Wer dort Kosten misst, bekommt ein falsches *Verhältnis*.

| Effekt | netto | Art |
|---|---|---|
| **Linse** | **10,9 ms** | Shader ohne Tiefenkarte |
| Scheinwerfer mit Tiefe | 5,6 ms | Shader mit Tiefenkarte |
| Streiflicht | ~4,1 ms | Shader, Karte **und** Marsch |
| Flammen | 4,3 ms | Shader, fraktales Rauschen |
| Blenden | 3,2–3,7 ms | Canvas |
| Scheinwerfer (alt) | 0,4 ms | Canvas |
| Antrieb | **nicht messbar** | |

Genauigkeit ±20 % (Drift durch Systemlast und Wärme). Die 5,6 ms sind der Preis eines
**Shader-Gangs**, keine Eigenheit der Lampe — sie liegt am unteren Ende des Feldes.

---

## Was der Nebel wirklich tut (nachgelesen, nicht vermutet)

`T = exp(−3·weg)` und `Bild·T + Einstreuung·(1−T)` — das ist **Lambert-Beer** und die vereinfachte
Volumenrendering-Gleichung, sauber gebaut, mit Koschmieder im Kommentar. **Die Weglänge ist
tiefenabhängig, die Dichte nicht:** Die dritte Achse des Rauschens ist die **Zeit**, nicht die
Tiefe. Die Schwaden hängen an der Bildfläche.

Drei billige Verbesserungen hängen alle am Herkunfts-Puffer:
1. **Extinktion auf dem Lichtweg** — heute wird nur Objekt→Kamera gedämpft, nicht Lampe→Objekt
2. **Räumliche Schwaden** — Tiefe als dritte Achse, Zeit als vierte; `wolke4(vec4)` existiert schon
3. **Phasenfunktion** (Henyey-Greenstein) statt des Mischreglers „Bündelung"

**Entschieden:** Die Einstreuung bleibt beim Medium. *„Wir lassen es am Nebel."* Ein Streuanteil an
der Lampe wäre eine zweite Quelle für dieselbe Sache (Regel 5).

---

## Offen, in dieser Reihenfolge

1. ~~**Falschfarben-Ansicht** in der Station Tiefe — rot vorn, blau hinten, auf dem grau gelegten
   Bild. Die Rechnung existiert, sie hängt heute an den Effektkarten.~~ — **entfallen** am 21.09.
   abends mit `TSICHT`/`tiefesicht*`; die Zonenkarte (Relief, Histogramm, sechs benannte Bereiche)
   ist ihr Nachfolger. (Durchsicht 23.09.)
2. **Sternschnuppe auf die letzte Tiefenebene.** *„Eigentlich auf der letzten Tiefenebene, dem
   Himmel."* Heute richtet sie sich nach der Zonengrenze — eine Schnuppe ist aber am Himmel, und
   das ist keine Einstellung, sondern ihre Natur.
3. **Der Nebel** — die drei Punkte oben.
4. **Laser und Lichtstrahlen ablösen.** Sie sind dieselbe Lampe: Bündelung, Gobo, Schwenktempo.
   ~~**Dafür fehlt ein dritter Winkel: Roll**~~ — Caspar_D: *„die Fächerfläche steht momentan parallel
   zur Diorama-Front-Scheibe."* Beim Scheinwerfer fällt Roll nicht auf (ein Kegel ist
   rotationssymmetrisch), beim Fächer ist es der entscheidende Winkel. **Roll ist gebaut**
   (`051d89a`, Abschnitt 6c „Roll in der Schwenkbahn"); die Ablösung hängt nur noch an der Abnahme
   (Durchsicht 23.09., Wiedervorlage 1–3).
5. **Überstrahlungsanzeige** — kein Deckel (Ausbrennen ist ein Mittel), aber eine Zahl, die sagt,
   wann ein Regler nur noch scheinbar wirkt.
6. **Aus dem Backlog:** die Linse mit 10,9 ms · Polarlicht auf den Himmel · das Prüfverfahren.
7. **Alt und unverändert:** Tempo in Schlägen · Module herauslösen · zwei flackernde Nahtfälle.

---

# 21.09.2026, abends — Das Zonenmodell. Und was am Laser noch offen ist.

Der Tag hat das Lichtmodell vom Vormittag fortgesetzt und dann das **Zonenmodell** gebaut, das
Caspar_D selbst entworfen hat. Am Ende steht ein halbfertiger Umbau, der **nicht eingesetzt** ist —
Abschnitt 6 sagt, wo er liegt und wie es weitergeht.

## 1. Was jetzt in der App steht

**Die Zonenkarte.** Aus dem Tiefen-Histogramm sucht eine Talsuche (Scale-Space-Modenzählung,
`zonenTaeler`) bis zu fünf Grenzen, also sechs Zonen. Sie entsteht, sobald die Tiefenkarte da ist —
nicht erst, wenn man die Station Tiefe öffnet.

**Die Station Tiefe** zeigt statt des Bildes das **Relief**, drehbar, mit dem Histogramm am rechten
Bildrand. Klick setzt eine Grenze, Doppelklick nimmt sie weg, Ziehen verschiebt. Doppelklick aufs
Bild stellt es gerade. Das Relief steht auf einer ebenen Rückwand mit Seitenwänden — ein Körper,
kein Blatt, damit man beim Drehen sieht, dass dahinter nichts ist.

**Sechs feste Bereiche** als Namen: ganz vorn (0–10 %), vorn (11–25), vordere Mitte (26–50),
Mitte (51–75), hinten (76–90), ganz hinten (91–100). Jede gefundene Zone bekommt den Namen des
Bereichs, den sie am stärksten überlappt. **Das ist die Sprache zwischen Rezept und Bild:** Ein
Effekt kreuzt „vorn" an, und wo das auf *diesem* Bild liegt, sagt die Zonenkarte.

**Jeder Effekt kreuzt seine Zonen an** (`zonenVonEffekt`, `zonenMaske`). Dazu **Effektscheibe** und
**Effektraum** — die beiden Orte vor der Szene, wo Beschlag und Nebel wohnen. Wer dort wohnt, wird
von nichts verdeckt. Nicht detektierte Bereiche werden **nicht** angezeigt; kreuzt ein Rezept ins
Leere, sagt die Karte es und bietet einen Griff an.

**Die Teilchen rechnen mit der Tiefe.** `freiBereich` holte sich bis heute die *Nähe zur
Trennlinie* — ein praktisch binärer Wert. Jetzt ist es die Tiefe selbst, und die Skala fällt mit
dem Raummodell zusammen: 0…1 die Szene mit ihren Zonen, 1…1+L der Effektraum. `schichtBaender`
schrumpfte dabei von 20 Zeilen auf vier, weil Entfernung und Tiefe nun dieselbe Größe sind.

**Entfallen:** Trennung, Weichheit der Trennung, Hintergrundfläche ab, der Verteilungsstreifen, die
rot/blau-Falschfarbenansicht samt `TSICHT`/`tiefesicht*`, `partikelMaske` und der Horizont der
Teilchen. Zusammen rund 400 Zeilen.

**Zwei Namen geklärt:** Der „Horizont" des Spiegels heißt **Spiegelachse** (dort ist es die
Wasserlinie), die „Raumtiefe" am Effekt heißt **Staffelung** (die Raumtiefe in Bildbreiten steht in
der Vorbereitung und gilt für alle).

**Strahlen mit Tiefe** — ein Fächer im Raum, mit **Roll** als drittem Winkel. Nicht abgelöst: der
alte `laser` und `strahlen` stehen unverändert daneben.

## 2. Das Werkzeug

`bin/zonen-labor.js` baut eine einzelne HTML-Datei (`labor/zonen/index.html`, nicht in git), die
ohne Server läuft: links das drehbare Relief, rechts der Zonenstapel. Gerechnet wird nur in
`labor/zonen/vorlage.html` — wer dort die Talsuche ändert, muss sie in der App mitändern.

    node bin/zonen-labor.js                die zehn neuesten Titel
    node bin/zonen-labor.js <id> [<id>]    bestimmte

## 3. Befunde, die bleiben

- **Die feste Grauwertschwelle ist unbrauchbar.** Gemessen an 20 Karten: `13 von 255` trifft
  zwischen **0,5 % und 50,3 %** der Bildfläche.
- **19 % der Bilder haben nur eine Häufung** — keine Grenze, und das ist eine gültige Antwort.
- **Die Prominenzschwelle (0,35) entscheidet über die Zonenzahl** und kann nicht ausgerechnet
  werden. Darum ist der Stapel von Hand korrigierbar.
- **Die Abtastbreite tut es nicht** — das hatte ich behauptet und nachgemessen widerlegt: bei 140
  bis 180 Punkten findet dieselbe Rechnung dieselben Täler.
- **Farbig abwedeln wirkt nicht auf schwarzem Grund** (`basis/(1−blend)`). Für einen Scheinwerfer
  richtig, für einen Laser falsch.
- **Leuchte + Medium:** Der Strahl in der Luft entsteht erst, wenn ein Medium ihn streut. Jede
  Leuchte sagt es jetzt auf ihrer Karte.

## 4. Wer Licht macht — die Aufstellung

| | schreibt in den Lichtpuffer | meldet seinen Ort (Herkunft) |
|---|---|---|
| Scheinwerfer, Laser, Lichtstrahlen | ja | **nein** |
| Scheinwerfer mit Tiefe, Strahlen mit Tiefe | ja | ja |
| Feuer, Stroboskop | ja | **nein** |
| **Flammen (Rauschen)** | ~~**nein** — das ist ein Fehler~~ **ja seit 23.09.** (Puffer-Zweig im Shader) | nein |
| **Kaustik (Lichtnetz)** | ~~**nein**~~ **ja seit 23.09.** | nein |
| **Partikel: Funken, Glühwürmchen, Bokeh, Sternschnuppen** | ~~**nein**~~ **ja seit 23.09.** (`leuchtet` als Frage an die Art; Glitzer reflektiert nur und bleibt draußen) | nein |
| Bloom, Streiflicht, Filmnebel, Schwaden | keine Quellen | — |

**Caspar_Ds Auftrag dazu:** *„das sollten alle Lichtstrahlen und -quellen tun"* — alle sollen ihren
Ort in den Herkunfts-Puffer melden, nicht nur die zwei neuen. Für die Canvas-Maler heißt das: im
Herkunfts-Durchgang ihre Form in der kodierten Ortsfarbe malen statt in ihrer eigenen. Bei Feuer
und Flammen (zwei eigene Farben) ist das nicht trivial.

~~Für die Partikel liegt die Lösung schon im Haus: `leuchtet` müsste wie `medium` eine **Frage an den
Effekt** sein (`e=>e.art==='schwaden'`), nicht eine Marke am Typ.~~ — so gebaut am 23.09.2026
(`leuchtetJetzt`). **Offen bleibt der Herkunfts-Puffer:** nur die drei Leuchten mit Tiefe melden ihren Ort.

## 5. Offene Wünsche von Caspar_D

- ~~**Tiefenkarte leihen:** Ein Suno-Bewegtbild erbt die Karte *seines* Titelbilds, weil sich die
  Geometrie kaum ändert. Bedingung: Es muss in der Quellenzeile stehen („vom Titelbild geliehen"),
  und nur bei gleicher Herkunft — bei echtem Video mit Schnitten bleibt es bei „keine".~~ — **gebaut
  am 23.09.2026** (Abschnitt „23.09., tagsüber", Punkt 4).
- **Alte ablösen:** Scheinwerfer und Laser fliegen raus, wenn die neuen gewonnen haben. Der
  Scheinwerfer mit Tiefe ist seit heute früh im Einsatz und könnte abgenommen werden.
- Offen aus früheren Runden: Nebel (Extinktion auf dem Lichtweg, Schwaden, Phasenfunktion),
  Überstrahlungsanzeige, Polarlicht, Tempo in Schlägen.

## 6. Laser und Lichtstrahlen — gebaut (21.09.2026, nachts)

Caspar_D: *„nein, ich will exakt zwei Effekte"* — und dazu, was sie unterscheidet: *„Laser sollen
Strahlen machen, Lichtstrahlen Strahlen machen und gleichzeitig beleuchten."* Beides steht.

**Laser mit Tiefe** (`laserRaum`), paralleles Licht: die Strahlbreite misst in Bildbreiten und
bleibt über die ganze Strecke gleich. Fünf Bauarten — **Fächer · Scanner · Matrixpunkte · Kegel ·
Lissajous** —, dazu **Austastung** (Blanking) quer zu allen.

**Lichtstrahlen mit Tiefe** (`strahlenRaum`), fächerndes Licht: die Breite ist ein Winkel und
wächst mit der Entfernung. Drei Bauarten — **Schacht · Fächer · Kugelquelle**, letztere mit
Farbstreuung über den Farbkreis.

**Ein Shader für beide**, `GL_SHADER_STRAHL`, mit `u_parallel` als einziger Weiche. `programm()`
cacht nach Effekttyp, beide bekommen also ihr eigenes Programm — keine Uniform-Leckage.

**Die Verrechnung ist die der alten**: beide auf Farbig abwedeln. Damit ist der Sonderweg vom
Vorabend zurückgenommen — ich hatte sie auf Screen gestellt, weil ein Laser auf schwarzem
Nachthimmel unsichtbar blieb. Die Rechnung stimmte, der Schluss war falsch: Ein Strahl im Leeren
*ist* unsichtbar (Regel 5), sichtbar wird er im Medium.

### Fünf Fehler, die im halbfertigen Entwurf steckten

Der Entwurf war mitten im Bau abgebrochen worden. Was darin nicht gelaufen wäre:

1. **Ein Backtick in einem Shader-Kommentar** (`` `weite` ``) beendete die Vorlagenzeichenkette.
   Das war der Syntaxfehler — nicht, wie die Übergabe vermutete, das undefinierte
   `GL_SHADER_STRAHL`. Ein unbekannter Name ist ein Laufzeitfehler, kein Syntaxfehler.
2. **`GL_SHADER_STRAHL` war nirgends zugewiesen** — der Shader lag als Schlüssel `strahlRaum:`
   in `GL_SHADER` selbst. Jetzt eine Konstante davor.
3. **Die Bauart-Nummern des Lasers zeigten auf die falschen Shader-Zweige**: „Fächer" landete auf
   dem Schacht, „Scanner" auf dem Fächer.
4. **`u_faecher: 0`** — die Weite ging als Null hinaus, der Regler „Spreizung" wurde gar nicht
   durchgereicht. Fächer, Scanner und Matrixpunkte wären alle drei in sich zusammengefallen.
5. **Die Schwenke war nicht eingerastet** (kein `lpR`), der Scanner hätte die Naht gerissen.

Dazu ein sechster, den ich selbst gebaut und am Bild gefunden habe: **`when` an einem
Schieberegler wirkt nicht.** Der Regler „Austast-Tempo" erschien nie, weil beim Schieben nur die
Werte nachgezogen werden und die Karte erst bei einer Auswahl oder einem Schalter neu gebaut wird.
Im ganzen Haus hängt sonst kein `when` an einem Schieberegler — mir ist es nur deshalb entgangen,
weil ich die Zeile geschrieben und nicht bedient habe. Sie steht jetzt immer da und sagt selbst,
wann sie wirkt.

### Was am Bild geprüft ist

Im Browser, am Titel „Stumm", mit Filmnebel in der Kette und mit Blick in die Konsole:

| | größter Unterschied | Fläche |
|---|---|---|
| Fächer | 201 von 255 | 0,09 % |
| Scanner | 210 | 0,05 % |
| Matrixpunkte | 219 | 0,06 % |
| Kegel | 228 | 0,11 % |
| Lissajous | 152 | 0,05 % |
| Schacht | 180 | 0,06 % |
| Lichtstrahlen-Fächer | 154 | 0,11 % |
| Kugelquelle | 127 | 0,10 % |

Austastung: 1417 Laserpunkte ohne, 74 bei 100 % — also 95 % abgeschaltet. Farbstreuung wirkt.
Keine Shader-Warnung, keine Laufzeitfehler.

**Eine Falle beim Messen, in die ich selbst getappt bin:** Der Mittelwert über das ganze Bild sagt
bei einem Strahl nichts — er lag bei 0,95 von 255, und ich hielt den Effekt schon für kaputt.
Richtig ist der größte Unterschied je Bildpunkt. Das steht seit dem 10.09.2026 in den Regeln unter
„Punktuelles: der Mittelwert misst Fläche, nicht Sichtbarkeit" — ich habe es trotzdem falsch
gemacht.

### Die Nahtprüfung — gelaufen, alle elf schließen

Elf Fälle (`laserraum-*`, `strahlenraum-*`), die vier alten `strahlraum-*` sind ersetzt.
Urteil ist `gleich` und `gleichFolge` (Regel 17e), nicht der Quotient:

| Fall | gleich | folge | naht | p95 |
|---|---|---|---|---|
| laserraum-scanner | 0,02 | 0,05 | 0,56 | 1,29 |
| laserraum-kegel | 0,00 | 0,01 | 1,09 | 2,11 |
| laserraum-lissa | 0,01 | 0,01 | 0,86 | 2,60 |
| laserraum-austastung | 0,00 | 0,00 | 0,73 | 0,98 |
| die übrigen sieben | 0,00 | 0,00–0,01 | 0,00–0,20 | 0,00–2,11 |

Ich habe den Lauf ein zweites Mal gestartet und das bitgleiche Ergebnis als Bestätigung
ausgegeben. **Das war keine.** Zwei Läufe desselben Codes über dieselben Fälle sind unter gleichen
Bedingungen deterministisch — das Ergebnis stand vorher fest. Die Regel „jede Fassung mindestens
dreimal messen" gilt dem **Vergleich zweier Fassungen**, wo der Rauschboden des Prüfstands sonst
als Ergebnis durchgeht; für absolute Nahtwerte gegen null leistet sie nichts. Belegt ist die Naht
durch den ersten Lauf, nicht durch die Wiederholung.

**Beim ersten Lauf prüften vier Fälle so gut wie nichts**, und das ist die Lehre daraus: Mit
Haarlinien (1,2 % Strahlbreite) nimmt der Laser 0,05 % der Bildfläche ein, das 95. Perzentil der
Bild-zu-Bild-Änderung liegt dann außerhalb des Strahls und misst den Hintergrund — p95 stand bei
0,04 bis 0,12. Ein Nahtsprung *im* Strahl wäre nicht aufgefallen. Mit breiteren Strahlen stieg
p95 auf 0,98 bis 2,60, also 20- bis 30-mal mehr Signal, und erst dieser Lauf ist ein Beleg.
**Ein Prüffall muss das berühren, worum es geht** — sonst bestätigt er nur, dass nichts passiert.

### Was noch aussteht
- **Caspar_Ds Augenschein.** Der Prüfstand sagt „wirkt", nicht „sieht richtig aus".
- **Die alten ablösen** (`laser`, `strahlen`, `licht`) — erst nach seiner Abnahme.
- **Nicht gebaut, weil nicht bestellt:** Farbverlauf über den Fächer. Dazu seine Frage, ob es
  stimmbare Laser gibt: In Showanlagen nein. Verbreitet sind **RGB-Dioden-Systeme** (rot ~638 nm,
  grün 520, blau 450), die jede Mischfarbe erzeugen; durchstimmbare Laser im Sinne von
  Wellenlängen-Tuning sind Laborgeräte. Ein Farbverlauf entsteht darum auf zwei Wegen: beim
  **Scanner** durch zeitliche Farbmodulation, während der Strahl die Figur abfährt — das ist echt
  und heute üblich. Beim **Strahlteiler-Fächer** dagegen tragen alle Strahlen dieselbe Farbe, denn
  sie kommen aus derselben Quelle. Nur ein **Beugungsgitter** trennt sie, weil es Wellenlängen
  verschieden stark beugt.

## 6a. Der Strahl in der Luft (21.09.2026, nachts)

Caspar_D am Bild: *„der Nebel zeigt zwar beim Scheinwerfer am Auftrittspunkt viel höhere
Helligkeit, aber den Strahl des Scheinwerfers sehe ich nicht."* Der Befund stimmte, und der
Licht-Puffer war nicht schuld.

**Die Ursache.** Der Shader rechnet je Bildpunkt `P = (x, y, Tiefe aus der Karte)` — also den Punkt
**auf dem Relief** — und fragt, ob *der* im Kegel liegt. Einen Punkt in der Luft kennt die Rechnung
gar nicht. In den Puffer ging deshalb nur, was der Kegel **trifft**; der Nebel hellte genau dort
auf. Der alte Scheinwerfer malte bei Bauart „Kegel" ein Trapez von der Lampe zum Fleck — eine 2D-
Attrappe, die nichts von Tiefe weiß und an keinem Objekt bricht. Der neue war physikalisch richtiger
und hatte dabei den sichtbaren Strahl verloren.

**Gebaut:** Im Fülllauf geht der Shader zusätzlich den **Sehstrahl** ab, 24 Schritte. Die Projektion
ist orthographisch, der Sehstrahl ist also dieselbe x/y-Stelle bei wachsendem z; er endet an der
Relieftiefe, **womit der Strahl von selbst hinter einer Figur verschwindet** — ohne Maske, ohne
Kante. Das kann die alte Attrappe nicht.

Drei Entscheidungen dahinter:

- **Nur im Fülllauf** (`u_inPuffer`), und der läuft nur, wenn ein Medium in der Kette hängt. In der
  Kette bleibt die Lampe, was sie ist: Licht auf Flächen. Damit gilt Regel 5 ohne Sonderweg.
- **Nicht im Herkunftslauf.** Jener Puffer sagt dem Streiflicht, woher das Licht auf einer
  *Oberfläche* kommt — ein Strahl in der Luft ist keine.
- **Die Stärke regelt der Nebel**, nicht die Lampe (Caspar_D: *„die Nebeldicke sollte bestimmen, wie
  stark der Strahl zu sehen ist, oder?"*). Seine Formel skaliert den Puffer mit `(1−T)`, und
  `T = exp(−3·weg)` fällt mit der Dichte. Ein Regler an der Lampe wäre ein zweiter Weg für dieselbe
  Sache.
- **Eine Behauptung, die ich zurücknehmen musste:** Ich hatte geschrieben, der Nebel sei hinten
  dichter und ein Strahl werde darum nach hinten kräftiger. Caspar_D: *„mit der Entfernung nimmt
  die Lichtintensität quadratisch ab, der Nebel selbst kann das doch nicht völlig reversieren."*
  Nachgerechnet: `(1−T)` wächst von 0,362 ganz vorn auf 0,996 ganz hinten, also **×2,75** — und
  das ist der Höchstwert, denn `(1−T)` ist durch 1 begrenzt, mehr als undurchsichtig gibt es
  nicht. Dem steht ein Abfall von **Faktor 25** durch 1/r² gegenüber. Der Nebel dämpft den
  Abfall, er kehrt ihn nicht um.
  Was ich für einen Nebeleffekt gehalten hatte, ist **Geometrie**: Direkt an der Lampe ist der
  Kegel punktförmig, der Sehstrahl kreuzt ihn kaum — daher der Anstieg von 1 auf 175 am Anfang
  des Profils. Danach fällt es (175 → 133); die 188 ganz rechts sind der Auftreffpunkt, nicht
  der Strahl. Beim Scheinwerfer wächst die Weglänge im Kegel ∝ r und hebt eine Potenz auf, das
  Integral geht also mit 1/r; beim Laser ist die Weglänge konstant und es bleibt bei 1/r².

**Am Bild belegt.** Helligkeitsprofil auf der Strecke Lampe → Fleck, Lampe an gegen aus:

```
1 · 50 · 138 · 151 · 159 · 175 · 173 · 168 · 133 · 139 · 188
```

Ein durchgehender Strahl; vorher wäre nur der letzte Wert dagewesen. An der Lampe schwach, weil der
Kegel dort noch ein Punkt ist und der Sehstrahl ihn kaum kreuzt.

**Was der Marsch nicht kann:** den Schatten, den eine Figur *in* den Nebel wirft — die dunkle
Schneise hinter ihr. Dafür bräuchte jeder Schritt einen zweiten Marsch zur Lampe, also 24 × 14
statt 24.

### Zwei Prüffälle, die es nicht gab

Der erste Nahtlauf über die sieben `lichtraum-*`-Fälle lief grün — und **berührte die Änderung
überhaupt nicht**: Keiner der sieben trägt ein Medium, ohne Medium läuft kein Fülllauf, ohne
Fülllauf kein Marsch. Dieselbe Falle wie bei den zu dünnen Laserstrahlen, am selben Abend zum
zweiten Mal. Neu sind darum `lichtraum-strahl` (Lampe + Filmnebel) und `lichtraum-strahl-schwenk`
(dazu ein Pan-Schwenk, damit der Strahl durch die Luft wandert). Beide: `gleich 0,00`,
`gleichFolge 0,00`.

### Die Kosten sind nicht abgrenzbar

`kosten-lichtraum-nebel` auf der echten Grafikkarte, drei Läufe:

| | ms |
|---|---|
| ohne Marsch | 21,67 |
| mit Marsch | 20,10 |
| mit Marsch | 14,86 |

**Die Streuung zwischen Läufen ist größer als der gesuchte Unterschied** — ohne Marsch kam sogar
der höchste Wert heraus. Damit ist nur gesagt: kein Sprung um eine Größenordnung. Wer die Kosten
des Marsches wirklich wissen will, braucht eine Messreihe mit Median aus fünf, wie sie die
Regeln für Kostenmessungen vorsehen. Eine einzelne Zahl wäre hier erfunden.

### Nachgezogen: Laser und Lichtstrahlen

Derselbe Marsch, aber der Strahl-Shader musste dafür umgebaut werden. Die Zugehörigkeit — „wie
stark liegt dieser Punkt im Strahl?" — stand über sieben Bauarten verteilt in `main()`, jeweils mit
`gl_FragColor = …; return;` mittendrin. Sie steht jetzt in **einer Funktion** `imStrahl(Q, …)`, die
für einen beliebigen Punkt antwortet. `main()` ruft sie einmal für den Punkt auf dem Relief und
24-mal entlang des Sehstrahls. Zwei Fassungen derselben Rechnung wären zwei Wahrheiten gewesen.

Bei der **Kugelquelle** kreuzt ein Sehstrahl mehrere Strahlen verschiedener Farbe. Die Farbe wird
darum über den Marsch **gewichtet gemittelt**, der hellere Beitrag zählt mehr.

Am Bild: Der Lichtschacht steht deutlich in der Luft, ohne Streifigkeit. Beim **Laser** ist der
Strahl schwächer (Profil 9 bis 29 gegen 138 bis 188 beim Scheinwerfer) — und das ist richtig: ein
dünner Laser durchquert viel weniger Luft als ein breiter Kegel, streut also weniger. Ob es am Bild
zu schwach ist, entscheidet Caspar_D.

### Naht, mit Medium geprüft

| Fall | gleich | folge | p95 |
|---|---|---|---|
| laserraum-strahl | 0,00 | 0,00 | 3,66 |
| laserraum-strahl-kegel | **0,09** | **0,16** | 21,00 |
| strahlenraum-strahl | 0,00 | 0,00 | 49,84 |
| lichtraum-strahl | 0,00 | 0,00 | 48,17 |
| lichtraum-strahl-schwenk | 0,00 | 0,00 | 59,60 |

`laserraum-strahl-kegel` ist der einzige Wert, der nicht praktisch null ist: drehender Kranz *und*
Nebel, beide mit eigener Loop-Mechanik. 0,16 liegt unter dem dokumentierten Rauschboden des
Prüfstands (0,18–0,33) und entspricht einem Dreißigstel einer Graustufe — aber es ist der höchste
Wert im Feld, und wer hier je etwas ändert, sollte ihn im Auge behalten.

Die Fälle ohne Medium (`laserraum-scanner`, `-lissa`, `strahlenraum-kugel`) messen **exakt** wie vor
dem Umbau — der Marsch läuft dort nicht, und der Shader-Umbau hat sonst nichts verändert. Das ist
der eigentliche Wert dieser drei Zeilen.

**Der Lauf dauerte 327 s und hat damit die Zwei-Minuten-Schranke gerissen.** Ich hatte mit rund 150 s
gerechnet und die Kosten der Medium-Fälle unterschätzt: Fülllauf plus Marsch plus Nebel, auf
SwiftShader. Sechs Fälle mit Medium sind kein Stichprobenlauf mehr.

### „Der Laser mit Tiefe funktioniert nicht" — zwei Ursachen

Caspar_D am Bild. Er tat es, aber zwei Dinge standen davor.

**Erstens die Vorgabe.** Die Strahlbreite stand auf 4 ‰ der Bildbreite — im Studio **1,8
Bildpunkte**, und das dann abgewedelt auf dunklem Grund: vier sichtbare Punkte im ganzen Bild.
Gemessene Reihe (Punkte über 8 von 255, Laser an gegen aus): 4 ‰ → 4, 8 ‰ → 17, 12 ‰ → 52,
16 ‰ → 109, 30 ‰ → 464. Die Vorgabe steht jetzt auf **16 ‰**.

Bei den Lichtstrahlen steht derselbe Satz seit ihrem Bau im Code — *„beim Einhängen soll man ihn
sehen: 0,6° war ein Haar"*. Ich habe ihn beim Laser nicht angewandt. **Ein Effekt, den man einhängt
und nicht sieht, ist kaputt**, gleich ob die Rechnung stimmt.

**Zweitens der Marsch verfehlte ihn.** Bei 24 Schritten ist der Schrittabstand rund 4 % der
Bildbreite, der Strahl 1,6 % breit — er rutschte zwischen zwei Schritten durch. Das Profil war
löchrig (`13 · 10 · 2 · 22 · 27 …`). Der Strahl-Shader marschiert darum in **64 Schritten**; der
Scheinwerfer bleibt bei 24, sein Kegel ist breit genug.

**Und dann kam die eigentliche Größe, die fehlte.** Mit 64 Schritten war das Profil gleichmäßig,
aber schwach: 4 bis 9 von 255, während der Auftreffpunkt bei 149 stand. Die Spitzen von 22 bis 27
vorher waren zufällige Treffer der groben Abtastung, kein Strahl.

Caspar_D: *„bei voller Stärke sollte man doch was sehen, wenn man Nebel parallel an hat."* Richtig,
und rechnerisch stimmte es trotzdem: Die Einstreuung ist proportional zur Strecke, die der Sehstrahl
im Licht zurücklegt, und ein Laser von 1,6 % Breite belegt davon fast nichts. **In Wirklichkeit ist
es umgekehrt** — man sieht im Nebel den Laserstrahl und vom Scheinwerfer oft nur den Fleck —, weil
ein Showlaser pro Fläche um Größenordnungen heller ist: ein paar Watt auf einem Millimeter gegen
ein paar hundert Watt auf einem Meter. **Bündelung heißt hohe Leuchtdichte**, und diese Größe hatte
das Modell nicht.

Geteilt wird jetzt durch die **getroffenen** Marschschritte statt durch alle. Damit steht dort die
Leuchtdichte *im* Strahl. Zwei Setzungen, beide im Code benannt: der Deckel bei acht Schritten
(ohne ihn liefe ein beliebig dünner Strahl gegen unendlich), und dass **der Scheinwerfer bewusst
beim Mittel über den ganzen Sehstrahl bleibt** — er ist ungebündelt, und dort trägt die Weglänge
durch den Kegel die Tiefenwirkung.

| Profil Lampe → Ziel, Laser bei Vorgabe mit Nebel | |
|---|---|
| vorher | 4 · 8 · 8 · 8 · 9 · 8 · 6 · 4 · 5 · 4 |
| jetzt | 40 · 59 · 62 · 67 · 59 · 68 · 57 · 40 · 27 · 25 · 23 |

Dass es beim Laser nach hinten abfällt, ist richtig: Ein paralleler Strahl wird nicht breiter, also
bleibt nur das Entfernungsgesetz. Beim Scheinwerfer stieg das Profil an, weil der Kegel nach hinten
mehr Weglänge bietet.

Die Lichtstrahlen sind mitgewachsen, ohne zu übersteuern: Schacht 182, Fächer 190, Kugelquelle 185,
**kein einziger ausgebrannter Bildpunkt**.

### Kosten und Naht danach

Median aus je fünf Läufen auf der echten Grafikkarte:

| | ms |
|---|---|
| Scheinwerfer + Nebel (24 Schritte) | 16,03 |
| Laser + Nebel (64 Schritte) | 16,78 |

**Die 64 Schritte kosten nichts Messbares** — 0,75 ms bei ±20 % Streuung ist nicht auflösbar. Der
Kostenfall `kosten-laserraum-nebel` ist neu.

| Naht | gleich | folge | naht | p95 | quot |
|---|---|---|---|---|---|
| laserraum-faecher | 0,00 | 0,00 | 0,01 | 0,14 | 0,02 |
| laserraum-scanner | 0,02 | 0,05 | 0,56 | 1,29 | 0,44 |
| laserraum-strahl | 0,00 | 0,00 | 1,18 | 10,09 | 0,12 |
| **laserraum-strahl-kegel** | **0,11** | **0,18** | 29,46 | 39,00 | **0,76** |
| strahlenraum-strahl | 0,00 | 0,00 | 5,09 | 50,19 | 0,10 |

Die Fälle **ohne** Medium messen exakt wie vor dem Umbau — der Shader hat außer dem Marsch nichts
verändert. Das ist der Wert dieser zwei Zeilen.

**`laserraum-strahl-kegel` ist der eine Fall, der Aufmerksamkeit braucht.** 0,18 liegt jetzt *am*
dokumentierten Rauschboden des Prüfstands (0,18–0,33), nicht mehr darunter, und der Quotient 0,76
ist der höchste im Feld. Ohne Nebel schließt derselbe Kegel sauber (0,00 / 0,01) — es ist also das
Zusammenspiel aus drehendem Kranz, Marsch und Nebel.

**Eine Hypothese, nicht geprüft:** `u_zeit` läuft im Prüffall bis rund 67 Sekunden. Die Drehung
rechnet `6,28 · schwenke · u_zeit`, das sind Werte um 840; in `float` (24 Bit Mantisse) liegt die
Auflösung dort bei etwa 6·10⁻⁵ rad. Die Rate ist über `lpR` sauber eingerastet, der Rest wäre reine
Rechengenauigkeit — und bei 64 Marschschritten mit scharfen Kanten kann das einzelne Bildpunkte
kippen. Der Weg wäre, `u_zeit` schon im JS auf die Clip-Länge zu falten, statt die absolute Songzeit
in den Shader zu geben. **Das ist eine Vermutung und kein Befund** — wer sie prüft, misst zuerst mit
gefalteter Zeit nach, bevor er etwas umbaut.

## 6c. Drei Wünsche vom 22.09.2026

### Die Slidertypen — ein Regelverstoß, der sich selbst versteckt hatte

Caspar_D: *„du hast für Quelle und Ziel verschiedene Slidertypen benutzt."* Er hatte recht, und die
Ursache ist eine Zeile im Kartenbau:

```js
const zu = (p.min<0 || ZUST.has(p.k)) ? ' tbs-zust' : '';
```

Ein Regler wird zum **Zustandsregler** (ohne Füllbalken, Hausregel 20: „die Mitte ist die Heimat"),
wenn sein Bereich ins Negative geht **oder** er in `ZUST` steht. Quelle X/Y gehen von −0,5 bis 1,5,
weil die Lampe aus dem Bild heraus darf — sie waren damit *zufällig* richtig. Ziel X/Y gehen von 0
bis 1 und bekamen einen Füllbalken. Dieselbe Sache, zwei Gestalten.

Die sechs Ortsachsen aller drei Raumleuchten stehen jetzt ausdrücklich in `ZUST`, dazu `mitte` bei
Feuer und Flammen (die x-Lage im Bild, Vorgabe 0,5 — derselbe Fehler). **Wer einen Ortsregler
dazubaut, trägt ihn dort ein**; der Kommentar an `ZUST` sagt es.

### Gefächerte Laserstrahlen — zwei Größen, die eine Zahl teilten

Caspar_D: *„zusätzlich zu den Parallelstrahlen hätte ich auch gern wieder gefächerte Strahlen beim
Laser."* Das ging bisher **gar nicht**, und der Grund war ein Denkfehler von mir: `u_parallel`
steuerte zwei Dinge zugleich — die Dicke des einzelnen Strahls *und* ob die Strahlen auseinander
laufen. Er selbst hatte sie von Anfang an getrennt benannt: *„paralleles Licht, zumindest innerhalb
eines Strahls"*.

Jetzt gibt es `u_divergent` neben `u_parallel` und dazu den Schalter **Auffächernd**: aus laufen
die Strahlen parallel nebeneinander wie hinter einem Strahlteiler, an fächern sie auf wie hinter
einem Prisma — und jeder einzelne behält seine Dicke. Die Weite wechselt mit dem Schalter ihre
Einheit, von „12,0 % der Bildbreite" auf „12,0°".

Dafür musste die Wertanzeige den **Effekt** mitbekommen: `p.wert()` bekam bisher nur die Zahl. Eine
Beschriftung, die die Einheit wechselt, kann sonst nicht die Wahrheit sagen (Regel 11).

### Roll in der Schwenkbahn

Caspar_D: *„bei den automatischen Tilt, Pan könnten auch noch Varianten mit Roll dabei sein."* Zwei
neue Arten bei beiden Strahlengeräten: **Rollen** (dreht nur um die Strahlachse) und **Kreis +
Rollen** (kreist und dreht zugleich — was eine Anlage macht, wenn Kopf und Prisma zusammenlaufen).
Dazu der Regler *Rollweite*; der vorhandene „Rollen" setzt weiter die Mitte, um die gependelt wird.

Die Bahn läuft über `lpBahn` wie der Schwenk und schließt mit ihm. Der Scheinwerfer bleibt außen
vor: sein Kegel ist rotationssymmetrisch, dort wäre Roll ohne jede Wirkung.

Gebaut als **Auswahl, nicht als Regler** — `when` an einem Schieberegler wirkt nicht, das war die
Lektion vom Austast-Tempo.

Gemessen: bei „Steht" ändert sich über zwei Sekunden nichts, bei „Rollen" 404 Bildpunkte.
Naht: `laserraum-auffaechernd` und `laserraum-rollen` beide `gleich 0,00 / folge 0,00`.

## 6b. Der stumme Kettenabbruch (22.09.2026, nachts)

Caspar_D: *„ich habe jetzt Escher geöffnet und sehe im Studio nichts."* Der Titel hat ein Rezept
mit sechs Effekten — geladen wurden **vier**. Ohne eine einzige Meldung.

**Die Ursache** steht in `raumSpanne`, der Funktion, die für die Teilchen-Notiz ausrechnet, welche
Entfernungen auf diesem Bild möglich sind. Ihr Zwischenspeicher baute den Schlüssel aus `modus`,
`g` und `w` — den Parametern der Fassung **vor dem Teilchen-Umbau**, als die Spanne noch aus Grenze
und Weichheit kam. Die Signatur wurde auf `zon` umgestellt, dieser Schlüssel nicht. Seither warf
sie bei jedem Aufbau einer Teilchenkarte mit Raumtiefe einen `ReferenceError: modus is not
defined`.

**Der Fehler steckt in `c2f4067`**, dem gestern Abend gepushten Stand — er ist nicht aus dieser
Nacht. Aufgefallen ist er erst jetzt, weil er ein Rezept mit Teilchen *und* Raumtiefe braucht.

**Warum er stumm blieb, ist die eigentliche Lücke.** Regel 15 („der Maler wirft nicht") gilt beim
**Malen**: jeder Effekt in seinem eigenen `try`. Der **Kartenbau** hatte diesen Schutz nie. Eine
`notiz` oder ein `grau`, das wirft, riss die ganze Kette ab — und was danach kam, fehlte einfach.
Beides läuft jetzt in seinem eigenen `try`, und eine Auskunft, die sich nicht rechnen lässt, sagt
das **auf der Karte**, statt die Kette zu verlieren.

### Und drei Messungen, die nichts wert waren

Auf dem Weg dorthin habe ich in einem Chrome-Fenster dreimal dasselbe gemessen — Escher schwarz,
Stumm schwarz, sogar der gesicherte Stand von gestern schwarz — und daraus geschlossen, die App sei
grundsätzlich kaputt. **Der Tab war versteckt** (`visibilityState: "hidden"`), und dort läuft
`requestAnimationFrame` nicht; die Malschleife startete gar nicht, `drawImage` lief null Mal.

Das steht seit dem 10.09.2026 in `EFFEKTCLIP-REGELN.md` unter „Die verborgene Scheibe: eine Seite
im Hintergrund wird gedrosselt … zum Messen die Scheibe nach vorn holen". Ich hatte es in derselben
Nacht gelesen. **Vor jeder Messung im Browser gehört `document.visibilityState` abgefragt** — eine
Zeile, die drei falsche Befunde verhindert hätte.

Sobald das Fenster vorn war, stand der echte Fehler sofort in der Konsole.

## 6d. Der Morgenknopf holt keinen Token mehr (22.09.2026, ~01:50)

Caspar_D: *„Suno scheint einen Endpunkt verändert zu haben, die Morgenroutine bekommt Probleme."*
Er hat den Morgenknopf laufen lassen, ich habe den Verkehr in einem eigenen Chrome-Fenster
mitgelesen (beide Tabs: suno.com für das Lesezeichen, localhost:8788 für den roten Knopf).

**Was der Lauf zeigte.** Die öffentliche Profil-Schnittstelle lief sauber durch — vierzehn Seiten
`studio-api-prod.suno.com/api/profiles/caspar_d?…&page=N`, alle 200, 252 Songs mit Zählern. Dann,
dritte Zeile der Statusmeldung: **„Alben — nicht geholt: kein Token"**, und danach alles, was
Anmeldung braucht: Private Songs, Sunos Analyse, Reaktionen, Herzen, Beobachter, Ton — alle „kein
Token". Der Lauf endet mit „Nichts geändert seit dem letzten Mal", was falsch ist: Es wurde nur
nichts *geholt*.

**Die Ursache**, gemessen im angemeldeten Tab: **`typeof window.Clerk === "undefined"`**, und kein
einziger globaler Name enthält „clerk". Genau dort fragt `browser/morgens.js` in `tokenHolen()`
(Zeile 292 ff.) acht Sekunden lang nach — und gibt auf. Die Sitzung selbst ist da: Cookies
`__session`, `__client_uat`, `clerk_active_context`, `suno_auth`, dazu je eine Variante mit den
Suffixen `_U9tcbTPE` und `_Jnxw-muT`. Solche Suffixe sind das Kennzeichen einer **neueren
Clerk-Fassung**, die mehrere Instanzen nebeneinander führt. Suno hat also Clerk aktualisiert, und
die neue Fassung registriert sich nicht mehr global.

**Die Meldung war obendrein irreführend.** Der Code kannte zwei Fälle — „Clerk nie gesehen" =
falsche Seite, „Clerk da, keine Sitzung" = nicht angemeldet. Der neue Fall (richtige Seite,
angemeldet, Clerk nicht global) fiel in den ersten und bekam den Rat, das Lesezeichen auf suno.com
zu legen. Wo es lag. **Berichtigt:** `tokenHolen.grund` unterscheidet jetzt drei Fälle und nennt im
neuen den Sachverhalt beim Namen, mit Verweis hierher.

**Zwei Wege, geprüft und untauglich** (ohne einen Token je in den Chat zu holen — nur Statuscodes):

| Versuch gegen `user/me`, `playlist/me`, `feed/v2` | Antwort |
|---|---|
| `credentials: 'include'` (Cookie mitschicken) | **401** |
| `__session`-Cookie als `Authorization: Bearer`, alle drei Varianten | **401** |

Die Cookies sind formal JWTs (drei Segmente), tragen aber nicht: Clerk-Sitzungstokens leben rund
60 s, und das Skript holte sich bei jedem Aufruf ein frisches über `Clerk.session.getToken()`.

**Was offen ist — und warum es in dieser Sitzung offen blieb.** Der nächste Schritt wäre, den
Endpunkt zu sehen, über den die Suno-Seite *selbst* sich frische Tokens holt. Drei Wege dahin
hat der Sicherheitsfilter des Werkzeugs als „Erkundung von Zugangsdaten" abgelehnt: den Mitschnitt
der Anfrage-Header im angemeldeten Tab (auch nur der Namen), das Beobachten der Seite beim
Nachladen, und sogar `curl` auf die öffentlichen Skripte von suno.com ohne jede Anmeldung. Die
Sperre greift auf das Ziel, nicht auf den Weg. Caspar_D hatte die Berechtigung ausdrücklich
erteilt und seine Legitimität begründet (eigenes Konto, eigenes Abo, eigene Songs) — an ihr liegt
es nicht, sondern an einer Schranke, die er in den Einstellungen des Werkzeugs lockern müsste.

### Nachtrag ~02:30 — Caspar_D hat den Rest im Netzwerk-Reiter gefunden

Drei Beobachtungen aus seinem Chrome, jede einzeln nüchtern, zusammen die Auflösung:

1. Beim Laden von `/@caspar_d` gibt es **keinen Aufruf an `studio-api-prod`** — nur einen
   `…?_rsc=…`: Suno rendert die Seiten serverseitig (React Server Components). Der Browser-Code
   braucht beim Laden keinen Token mehr; deshalb ist `window.Clerk` weg.
2. Der eine angemeldete Aufruf, den die Seite trotzdem macht (`notification/v2/read`, beim
   Öffnen der Glocke), trägt einen **`Authorization: Bearer`**. Sein Kopf, dekodiert:
   `{"alg":"RS256","kid":"suno-api-rs256-key-1"}` — **Sunos eigener Signaturschlüssel**, nicht
   Clerks `ins_…`. Clerk erlaubt das über JWT-Vorlagen.
3. Das Cookie `suno_auth` ist **kein Token, sondern Clerks Publishable Key**: `pk_live_` +
   base64 der Frontend-API-Adresse. Dekodiert: **`auth.suno.com$`**. Clerk läuft unter Sunos
   Namen — darum fand der Filter „clerk" nie etwas.

**Umbau in `browser/morgens.js`:** `tokenHolen()` hat jetzt zwei Wege. Erst `window.Clerk` wie
bisher (falls Suno es wieder bereitstellt), sonst Clerks dokumentierte API unter der Adresse aus
`suno_auth`: `GET /v1/client` → aktive Sitzung, `POST /v1/client/sessions/<sid>/tokens` → JWT,
beides mit den Cookies des Tabs. Dazu ein **Zwischenspeicher** bis 5 s vor `exp` (höchstens 50 s),
weil die Sammelschritte vor jeder Anfrage nachfragen und Clerk das früher selbst abfing. Jeder
Fehlschlag nennt Schritt und Statuscode in der Fensterzeile. `TOKEN_VORLAGE` ist leer — Clerks
Standard-Token; antwortet die API damit 401, steht der Name der Vorlage in Sunos eigenem
Token-Aufruf (Filter `auth.suno.com`, Pfad `…/tokens/<name>`) und gehört dort eingetragen.

**Getestet durch Caspar_Ds Klick, ~02:40: es trägt.** Das Fenster meldet „Token über Clerk-API
unter auth.suno.com erhalten", die Alben kommen (25 mit 618 Einträgen), die privaten Songs laufen.
**Clerks Standard-Token reicht** — Sunos API nimmt ihn an, `TOKEN_VORLAGE` bleibt leer. Der Kopf
mit `kid: suno-api-rs256-key-1` war also Clerks Standard-Token dieser Instanz, keine Vorlage.

Ein Schönheitsfehler bleibt: Die Token-Zeile erscheint im Fenster *unter* der Alben-Zeile, obwohl
der Token vor den Alben kam — die Alben-Zeile wird früher angelegt und später gefüllt. Harmlos,
aber die Reihenfolge lügt; wer daran geht, meldet den Token dort, wo er zuerst gebraucht wird.
**Behoben in derselben Nacht** (`63038e5`): `tokenMerken()` in `browser/morgens.js` schiebt die
Token-Zeile per `insertBefore` vor die wartende Alben-Zeile (Ausnahme: beim allerersten Lauf steht
„erster Lauf" davor). Nur statisch geprüft, am Fenster noch nicht gesehen. (Durchsicht 23.09.)

Der Morgenknopf ist damit wieder vollständig. `gesundheit.js` hat diesen Bruch **nicht** bemerkt —
es prüft, ob Adressen antworten, nicht, ob der Token-Weg im Browser noch existiert. Das wäre eine
Prüfung wert, die zum Morgenknopf selbst gehört: „konnte ich einen Token holen, und über welchen
Weg" als eigene Zeile, damit der nächste Umbau bei Suno am Morgen danach auffällt und nicht erst,
wenn die Alben fehlen.

**Der Weg, der bleibt (Stand vor dem Nachtrag):** Caspar_D sieht selbst nach, in Chrome auf suno.com: Entwicklerwerkzeuge →
Netzwerk → Filter `tokens` oder `clerk` → Seite neu laden. Clerk holt Tokens dokumentiert über
seine Frontend-API, `POST https://clerk.<domain>/v1/client/sessions/<sid>/tokens` — steht dort
ein solcher Aufruf, sind Adresse, Verfahren und Antwortform alles, was der Umbau von
`tokenHolen()` braucht: erst `window.Clerk` versuchen, sonst diesen Endpunkt fragen. Eine
zweite Möglichkeit ist, dass Clerk in einem **Worker** läuft — die Konsole zeigte beim Laden
„Error while executing get_default_endpoint in worker".

**Ein Werkzeug ist dabei entstanden:** `bin/mitschnitt.js`, ein Wächter für Node-Läufe. Er hängt
sich an `fetch`, `http` und `https` und schreibt je Anfrage Adresse, Verfahren, Status, Dauer
und die **Gestalt** der Antwort (Feldnamen, Listenlängen — keine Inhalte). Aufruf `node -r
./bin/mitschnitt.js bin/<skript>.js`; Ablage `labor/mitschnitt/` (in `.gitignore`). Für den
Morgenknopf ist er das falsche Werkzeug — der läuft im Browser —, aber für `reaktionen.js`,
`wiederherstellen.js` und die Nachbarschaft ist er genau richtig. Ein erster Anlauf, ihn in die
sechs Suno-Skripte fest einzuhängen, ist zurückgenommen; die Dateien sind unverändert.

## 6e. Zweiter Fund derselben Art im vollen Nahtlauf (22.09.2026, ~03:15)

Der volle Lauf über alle 244 Fälle (angesagt, Jörg hat den Startschuss gegeben) fand, was eine
Stichprobe nicht finden konnte: `partikel-schwaden-tempo02` und `partikel-boeen-funken-wandern`
liefen mit **22 Konsolenmeldungen** je Fall — `TypeError: g.toFixed is not a function` — und der
Effekt „Partikel" wurde beim Malen ausgelassen (Regel 15 fängt den Wurf ab, stumm).

**Derselbe Fehler wie in `raumSpanne` letzte Nacht, an einer zweiten Stelle: `bodenZellen`.** Der
Cache-Schlüssel dort baute sich noch aus `g`, `w`, `modus` — den Parametern von vor dem
Teilchen-Umbau. Diesmal kein `ReferenceError`: **`g` ist die modulweite Leinwand-Variable**
(Zeile 27241, der Zeichenkontext), also gesetzt, aber kein Zahlenwert — `g.toFixed` schlägt mit
`TypeError` fehl, nicht mit „not defined". Genau deshalb übersah ihn meine statische Suche nach
freien Bezeichnern letzte Nacht: Ich hatte jeden Treffer auf das globale `g` als legitim
eingestuft, weil es das an anderen Stellen auch ist.

**Besonders ärgerlich:** Der Kommentar direkt darüber behauptete bereits „DER SCHLÜSSEL TRÄGT
JETZT DIE ZONEN", die Ersatzfunktion `zonSchluessel` stand fertig da — nur eingesetzt war sie nie.
Ein `void zonSchluessel;` mit dem Vermerk „der Schlüssel unten trägt ihn" stand sogar daneben.
Ein Kommentar, der das Richtige behauptet, deckt falschen Code zu — dieselbe Lehre wie am
21.09.2026, hier gegen mich selbst gewendet.

**Betroffen:** die vier Partikelarten mit natürlicher Herkunft „boden" — **Funken, Asche,
Schwaden, Blasen** (`HERKUNFT`-Tabelle) —, sobald sie mit Raumtiefe laufen. Im Bestand betrifft
das mindestens `f73b0255…` (Funken + Schwaden) und **`a459b95e…`, also Escher** — dort steht
`funken` mit `raumtiefe:1`. Seit dem Zonen-Umbau gestern Abend waren diese Effekte in solchen
Rezepten **unsichtbar**, ohne dass die Karte es zeigte.

**Repariert:** der Schlüssel nutzt jetzt `zonSchluessel(zon)+'|'+L`. Isoliert geprüft: beide
Fälle laufen ohne Konsolenmeldung, Naht schließt.

### Was ich NICHT behoben habe, weil es Caspar_Ds Auge braucht

Am Bild (Escher, Funken auf Raumtiefe 1, Differenzbild bei Stärke an/aus) zeigt sich **kein**
gewöhnliches Funkenbild — sondern lange, parallele, säulenartige Streifen über einen Großteil der
Bildhöhe. Eine plausible, nicht-fehlerhafte Erklärung: Escher ist ein Treppenhaus-Motiv mit
vielen Tiefenkanten; jede Stufe zählt als „Boden", aus dem Funken aufsteigen — viele eng
beieinanderliegende Ursprünge verschmieren beim Aufsteigen zu parallelen Bahnen, statt aus einem
einzelnen Feuer zu kommen. Das kann richtig sein oder nicht — **das ist eine Frage ans Auge, nicht
an den Prüfstand** (Regel: „anders ist kein Urteil"). Bitte am Bild ansehen, bevor der Fix als
vollständig gilt.

**Bild dazu:** `/private/tmp/claude-501/-Volumes-Extreme-SSD-Entwicklung/7b40ece6-5b5f-4105-b900-03e843824aa1/scratchpad/escher-funken-diff.png`
(liegt im Scratchpad, nicht im Repo — Differenzbild Stärke an minus aus, hell = wo Funken malen).

### Nachtrag ~03:38 — Fix über alle betroffenen Fälle bestätigt

Der volle Lauf über alle 244 Fälle wurde bei 153/244 abgebrochen (eigene PID, sauber beendet) —
die Systemlast war auf 17–20 gestiegen (viele alte, verwaiste Chrome-Prozesse aus früheren Tagen,
nicht von dieser Sitzung), ein Fall brauchte zuletzt acht Minuten statt fünfzehn Sekunden. Bis
dahin: **keine einzige Abweichung** (`gleich`/`gleichFolge` durchweg 0,00–0,05), außer den fünf
bereits erklärten `bodenZellen`-Fehlern im alten, vor der Reparatur gebauten Snapshot.

Stattdessen ein gezielter Lauf über alle zehn Fälle mit „boden"-Herkunft (Funken, Asche, Schwaden,
Blasen — die vier betroffenen Arten — plus `rand-kombi`, `rand-kombi-kurz`, `rand-funken-extrem-kurz`,
die im vollen Lauf ebenfalls FEHLER 22–33 gemeldet hatten): **alle zehn ohne eine einzige
Konsolenmeldung, `gleich` überall 0,00.** Der Fix ist damit über den vollständigen Umfang des
Fehlers bestätigt, nicht nur an den zwei zuerst gefundenen Fällen.

Die verbliebenen 91 Fälle des vollen Laufs (154–244) sind nicht geprüft — bei entspannter
Systemlast nachholen, falls Zweifel an einer bestimmten Stelle bestehen. Aufgrund der
durchgehend sauberen Stichprobe (153 von 244, 63 %) und der Art der heutigen Änderungen
(räumlich auf Laser/Lichtstrahlen/Raumleuchten begrenzt) ist ein Fund in den ungeprüften
Restfällen unwahrscheinlich, aber nicht ausgeschlossen.

## 6f. Laser-Kern gebaut, Rest-Naht geprüft (22.09.2026, ~04:30)

Caspar_D am Bild: *„der Auftreffpunkt vom Laser ist viel zu schwach"*, *„flau"*, *„Laser dots sind
scharf, klein und krass intensiv"*. Behoben: `imStrahl` bekam einen **Kern-Anteil** (55 % des
Radius bleibt voll hell, erst danach fällt die Kante ab) — nur für `u_parallel>0.5` (Laser). Der
Schacht (`strahlenRaum`) bleibt beim alten, graduellen Verlauf: „nicht der Laser: weich, nicht
scharf" stand schon in der Beschreibung des alten Effekts, das ist Hausstandard, keine neue
Entscheidung.

Dazu die `strahlenRaum`-Dicke-Vorgabe von 1,2° auf 5° angehoben (Escher-Messung: 0,76 bei 1,2°,
8,89 bei 5°, Sättigung ab ~6°) — commit `b005513`.

### Naht über die restlichen laserraum-/strahlenraum-Fälle

Zwölf Fälle, die der erste Nahtcheck (nur 3 Fälle) nicht abdeckte:

| Fall | gleich | folge |
|---|---|---|
| laserraum-lissa, -austastung, -auffaechernd, -rollen, -roll | 0,00–0,01 | 0,00–0,01 |
| strahlenraum-schacht, -faecher, -kugel, -roll | 0,00 | 0,00 |
| laserraum-strahl, strahlenraum-strahl | 0,00 | 0,00 |
| **laserraum-strahl-kegel** | **0,16** | **0,23** |

Elf von zwölf unauffällig. `laserraum-strahl-kegel` (Kegel + Nebel) stieg von 0,11/0,18 (Stand
vor dem Kern-Fix, letzte Nacht) auf 0,16/0,23 — eine leichte Verschlechterung, vermutlich dieselbe
Rechengenauigkeits-Empfindlichkeit, die gestern schon vermutet wurde (float bei `u_zeit`-Werten
um 840 rad), durch die zusätzliche Kern-Fallunterscheidung am Rand etwas verstärkt. Bleibt unter
einem Viertel Graustufe, Naht schließt weiter (`gl ja`). Nicht behoben — dieselbe ungeprüfte
Hypothese wie gestern: `u_zeit` vor dem Shader auf die Clip-Länge falten, statt die absolute
Songzeit durchzureichen.

Escher danach am Bild angesehen: alle sechs Effekte laden fehlerfrei, keine Konsolenmeldung.

### Voller Regressionslauf, Rest (154–244)

Nach Freigabe für einen langen, idempotenten Lauf gestartet. **Fertig: alle 244 Fälle geprüft,
null Abweichungen (gleich/folge > 0,3), keine einzige Konsolenmeldung.** Lief 2438 s (~41 Min),
Systemlast schwankte zwischen 15 und 21 während des Laufs, ohne dass es zum Wachhund-Abbruch kam.

Damit ist der vollständige Regressionslauf über den ganzen Fallsatz (244 Fälle) nach allen
heutigen Änderungen bestätigt: die zwei neuen Geräte, der Strahl-in-der-Luft-Marsch, der
Laser-Kern, die beiden `bodenZellen`/`raumSpanne`-Reparaturen, die Dicke-Vorgabe. Nichts davon
hat irgendeinen bestehenden Fall verändert, der nicht bewusst verändert werden sollte.

## 7. Arbeitsweise, neu gelernt

- **Die Browser-Konsole lesen, bevor etwas ausgeliefert wird.** Eine Syntaxprüfung findet
  Laufzeitfehler grundsätzlich nicht; ein `ReferenceError` sieht für den Benutzer genauso aus wie
  eine nicht gebaute Funktion. Hat heute eine Dreiviertelstunde gekostet.
- **Achsenrichtungen vor dem Bauen festlegen**, nicht aus dem Code erraten — der Zonenstapel lief
  gegen seine eigene Beschriftung.
- **Ein Kommentar, der das Richtige behauptet, deckt falschen Code zu.** Heute zweimal.
- **Klick setzt, Doppelklick entfernt, Ziehen verschiebt** — die Bediensprache des Hauses, sie gilt
  für alle Flächen mit gesetzten Punkten.

---

# 22.09.2026, nachmittags und abends — Die neuen Leuchten werden stärker, ohne die alten nachzubilden

Der Tag begann mit zwei Aufträgen von Caspar_D: *„alle Lichteffekte anschauen und wie sie in den
Lichtpuffer schreiben"* (09:08) und *„welche der neuen noch verstärkt werden können, damit sie von
der Effektstärke näher an den alten kommen, du sollst aber nicht den alten nachbilden, die neuen
sehen viel realistischer aus, sind aber eben zu schwach"* (09:37). Die Zahlen und Begründungen
stehen in `docs/effektclip/KONZEPT-LEUCHTEN.md` §5a und §7–9; hier steht, was in der App ist,
welche Befunde bleiben und was Caspar_D entschieden hat.

## 1. Was jetzt in der App steht (Commits `6cfa56e` … `228ad0d`)

**Bestandsaufnahme aller acht Leuchten** (§5a): Der Mechanismus ist einheitlich — wer durch
`malen()` läuft, ist im Puffer automatisch additiv; die Hürde für einen neuen Leuchter ist nur die
Marke `leuchtet` und ein Malvorgang, der als Schein taugt. Gemessen: die drei „mit Tiefe"-Geräte
lagen alle unter ihren alten Pendants — `lichtRaum` 69 %, `laserRaum` 56 %, `strahlenRaum` 25 %.
Dazu der Migrationsplan für Flammen → Kaustik → Partikel-Leuchten (nur geplant, nicht gebaut).

**Laser mit Tiefe** (`laserRaum`), vier Schritte:
- **Saum** um den Kern (`d06daff`), Faktor 0,85 — wie beim alten Vorbild (w0·3,2), nur für
  `u_parallel>0,5`. Von 56 % auf 86 % des alten Lasers.
- **Querschnitt-Normierung** (`824b4ce`): `dickeNorm=(0,016/u_dicke)²`, geklemmt bei 4 — ein dünnerer
  Laser wird heller, Bezug ist die Reglervorgabe 0,016. Caspar_D: *„der Kern des Lasers ist mir
  immer noch zu flau und die Laserstrahlen zu dick."*
- **Kantenglättung** (`f00aa61`): Caspar_D am Vergleich alt/blau gegen neu/cyan: *„wenn ich cyan
  schwächer mache, dann zerfallen die Strahlen zu Perlen/Flecken."* Ursache: ein Fragment-Shader
  tastet einen Punkt ab, keine Fläche; die schmale Kernkante fiel zwischen zwei Bildpunkte. Behoben
  mit `fwidth()` — `GL_OES_standard_derivatives` im `GL_VORSPANN` (Zeile 31134) und in `GL.init`
  (30940). Im ganzen Haus wurde `fwidth` vorher nirgends benutzt; die Lücke betraf im Prinzip jede
  scharfe Kante in jedem GL-Effekt.
- **Drei Regler vom alten Laser** (`11f2d91`), Caspar_D: *„möglichst viele Regler vom alten Laser
  übernehmen, algorithmisch siehst du ja, was mit dem Laser passieren soll."* Flimmern (hartes
  Austasten, 55/45, phasenversetzt), Sprung (Scanner springt je Schlag auf eine von N Stellen, die
  vorige verglimmt; Schlagnummer aus dem vorhandenen Antriebs-Pult), Quelle wandert (Lissajous-Bahn
  über `lpBahn`, überschreibt `u_lrOx/Oy` in `glZusatz`). Alle drei additiv, Vorgabe 0.
  `neigung`/`drehen`/`aufsetzen` bewusst nicht übernommen — Roll ist im 3D-Modell eine echte Größe.

**Scheinwerfer mit Tiefe** (`lichtRaum`, `504fdad`): Hotspot-Vorgabe 0,35 → 0,7, von 69 % auf 94 %
des alten Scheinwerfers. **Keine additive Änderung** — bestehende Clips ohne eigens gesetzten
Hotspot werden sichtbar heller.

**Lichtstrahlen mit Tiefe** (`strahlenRaum`), zwei Schritte:
- Der **Marsch-Deckel** `/max(8,treffer)` gilt nur noch für den Laser (`5e13e56`, Zeile 31531) — für
  den sich weitenden Schacht drückte er Randstreifer nach unten statt zu mitteln. +14 %. Caspar_D,
  als ich das als erledigt verkaufen wollte: *„meinst du denn, Punkt 2 wäre hiermit tatsächlich
  erledigt?"*
- **Glimmen über die Kante hinaus, bauartabhängig** (`228ad0d`, Zeile 31423): Schacht/Fächer Radius
  6,0 (219 % des Ausgangswerts), Kugelquelle 2,0 (bei 6,0 verschmelzen ihre vielen Einzelstrahlen zu
  einem Klumpen). Caspar_D: *„ich denke, wir müssen effektabhängig arbeiten, das ist zwar nicht so
  schön, aber die Effekte sind halt individuell."*

**Regel 9a** (`373e7c5`, EFFEKTCLIP-REGELN): Die Wirkung eines Reglers muss über den ganzen Weg
gleichmäßig wahrgenommen werden. Gefunden an `strahlenRaum.dicke` (S-Kurve 0,43 … 15,23 über den
Weg). Die Regel steht, die Skala des Reglers ist **nicht** transformiert (Zeile 27729, linear).

**Nahtproben nach jedem Schritt:** 12/12 `laserraum-*` nach dem Saum, `laserraum-faecher` und
`-strahl-kegel` nach `fwidth`, drei Fälle nach den Reglern, drei `lichtraum-*` nach dem Hotspot,
alle fünf `strahlenraum-*` nach dem Glimmen (20:27) — durchweg `gl:true`.

## 2. Befunde, die bleiben

**Der Lichtpuffer ist eine 8-Bit-Leinwand.** Caspar_D: *„wurden die Klemmungen, Wertebereiche
irgendwie limitiert, dass sie gar nicht die Stärke erreichen können?"* Bewiesen: `gl_FragColor=
vec4(2.0,4.0,0.5,1.0)` kommt über `readPixels` als `[255,255,128,255]` zurück. Ein Bildpunkt, der 1,0
erreicht — und das ist der ganze Kern eines Schachts —, ist weiß; keine Formel macht ihn heller.
Der einzige Hebel darunter ist die **Fläche**. Genau das tat der alte `strahlen` mit seinem
Weichzeichner (8 % der Bildbreite). Das erklärt, warum Verstärkungen an der Formel (Kante, Kern,
dickeNorm) am Schacht kaum wirkten, und begründet das Glimmen.

**Zwei Lichtsysteme, auseinandergehalten** — nach Caspar_Ds Einwand (18:31): *„du hattest gesagt, der
Lichtpuffer weiß auch etwas über die Richtung des Lichts, das kriege ich mit 8 Bit nicht hin — wir
haben 2 Lichtsysteme."* Richtig, und meine Formulierung war unsauber:
- `clicht` — der **Intensitäts-Puffer**: additiv (`lighter`), liest der Filmnebel. Hier fand die
  Messung statt, hier gilt der 8-Bit-Befund.
- `cherk` — der **Herkunfts-Puffer**: RGB/A-gewichteter Mittelwert des Ursprungsorts, gelesen nur
  von Streiflicht und Raumleuchten (`ort=vec2(hk.r/hk.a·2−0,5, …)`, Zeile 31699).
Beide sind `getContext('2d')` (Zeile 28716), beide 8 Bit. Die Richtung steht im zweiten, nicht im
ersten — der 8-Bit-Befund betrifft die Helligkeit, nicht die Richtung.

**Float statt 8 Bit — machbar, aber ein Architekturumbau.** Caspar_D: *„würde uns float statt 8 bit
helfen oder würden wir das nicht mehr bewältigt bekommen."* Technisch geprüft: eigener Framebuffer
mit `RGBA/FLOAT`-Textur ist `FRAMEBUFFER_COMPLETE`, `readPixels` mit `gl.FLOAT` liefert 2,0 und 4,0
unverändert; `OES_texture_float`, `WEBGL_color_buffer_float`, `OES_texture_half_float` und
`EXT_color_buffer_half_float` sind vorhanden. Der Aufwand liegt nicht im Shader: Der Puffer ist heute
eine Canvas2D-Leinwand, in die GL-Effekte per `drawImage`/`lighter` (`leuchteInPuffer`, Zeile 29437)
und Canvas-Effekte über `malen()` hineinmalen, und der Filmnebel liest sie als Textur. Ein
Float-Puffer ist ein GL-Framebuffer, in den nur GL malen kann — Voraussetzung ist also der
Migrationsplan aus §5a, und der Lesepfad des Nebels müsste mit. **Nicht entschieden, nicht gebaut.**

**Das Nachglühen war schon da** (Scanner/Lissajous, acht Lagen à 0,012 s = 0,084 s — trifft die
Netzhautnachhallzeit von 40–100 ms, ohne dass die Zahl je dafür gewählt wurde). Gemessen: helle
Breite 40 px → 91 px. Kein Änderungsbedarf.

## 3. Ken Burns, 14:12 — „das Setzen der Punkte funktioniert nicht mehr"

Caspar_D: *„die Tiefenkarte war sehr schnell da, kein Problem, aber die Punkte auswählen setzt immer
neue"*; Bild dazu: *„ein statisches Bild, auf dem ein leichtes Flackern als Effekt lief."*
`kbBuehneEinrichten` (`markeBei`, `onpointerdown/move/up`, `ondblclick`) gelesen, live geprüft, zwei
Agenten drüber: Klick setzt, Doppelklick entfernt, Ziehen verschiebt — im Test korrekt, **Ursache
nicht gefunden**. Caspar_D: *„okay."* Bleibt auf Wiedervorlage: beim nächsten Auftreten gemeinsam
live ansehen, mit dem konkreten Bild und Rezept.

## 4. Arbeitsweise, neu gelernt

- **Umschalter brauchen die volle Klickfolge.** `button.tbs-togp` reagiert nicht auf `.click()`;
  `pointerdown/mousedown/pointerup/mouseup/click` nötig. Zweimal für eingefrorenen Code gehalten.
- **Ohne Medium ist der Strahl in der Luft unsichtbar.** Eine Peak-Messung mit 24 identischen
  Proben war kein Fehler im Sprung-Code, sondern fehlender Filmnebel im Messaufbau.
- **Ein Fund ist nicht die Lösung.** 14 % schließen keine Vierfach-Lücke; erst die Nachfrage führte
  zum 8-Bit-Befund.
- **Die Zwei-Minuten-Schranke zweimal gerissen** (Nahtproben 194 s und 173 s), beide selbst
  gestartet ohne Ansage. Steht hier, damit es nicht wieder vorkommt: vorher fragen, Jörg gibt den
  Startschuss.

---

# 23.09.2026, nachts — Durchsicht aller offenen Punkte, mit Wiedervorlage

Caspar_D, 01:32: *„gehe alle Punkte durch, meiner Meinung nach ist einiges längst erledigt und
ziehe Doku und Übergabe nach"* — und: *„alles, wo ich tätig werden muss, setze auf Wiedervorlage."*

Geprüft: 26 Einzelpunkte aus den „Offen"-Listen dieses Dokuments (Zeilen ~4900, ~5005, ~5200,
~5305, ~5409) und dem Backlog. Sechs Prüfagenten gegen Code, Doku, git und Caspar_Ds eigene
Wortmeldungen im Transkript; jede Erledigt-Behauptung von einem zweiten Agenten mit dem Auftrag
„widerlege das" gegengelesen; Zeilen und Zitate danach selbst nachgeschlagen. Nur gelesen, nichts
gebaut, kein Testlauf. **Diese Listen ersetzen die älteren „Offen"-Listen oben** — was dort steht
und hier fehlt, ist erledigt oder gegenstandslos und dort so markiert.

## 1. Erledigt — in der Doku nachgezogen

- **Falschfarben-Ansicht** (Offen-Liste 21.09., Punkt 1): entfallen mit dem Zonenmodell, die
  Zonenkarte ist ihr Nachfolger; `grep falschfarb` im Code: leer. KONZEPT-ZONEN §9 hatte sie noch
  als „zu erweitern".
- **Roll als dritter Winkel** (Punkt 4): gebaut `051d89a` — Regler „Rollen" ±90°, Schwenkarten
  Roll/Kreis+Roll an Laser und Lichtstrahlen, `u_roll` dreht die Querachsen (Zeile 31466);
  `laserraum-roll`, `strahlenraum-roll` in der Naht gleich 0,00. KONZEPT-LEUCHTEN „Der dritte
  Winkel" sagte noch, er fehle.
- **Lichtabfall mit der Entfernung** (Nebel-Punkt 1 im Leuchten-Konzept): gebaut am 21.09. **in der
  Lampe** (`ba7c724`, Entfernungsgesetz `(dref/dist)²`, geklemmt bei 4; Zeilen 31454/31625/31663),
  der Nebel erbt es über den Puffer. Caspar_D, 21.09. 11:07: *„Licht breitet sich im Raum um die
  Quelle aus, die bestrahlte Fläche wächst quadratisch."* Übrig bleibt die **Extinktion auf dem
  Lichtweg** Lampe→Objekt — die Übergabe vom 21.09. hatte es richtig, das Konzept nicht.
- **Morgenknopf, Token-Zeile unter der Alben-Zeile** (6d): behoben in derselben Nacht, `63038e5`.
  Nur statisch geprüft — am Fenster noch nicht gesehen.
- **Hintergrundfläche ab** als Regler (KONZEPT-ZONEN §9): entfallen `bb492b0`, „ganz hinten"
  leistet es.
- **Marsch-Normierung** (KONZEPT-LEUCHTEN §5a „Restschwäche offen"): überholt durch §7.
- **Flimmern** (KONZEPT-LEUCHTEN §7 „Offen, nicht gebaut"): gebaut, §8.

## 2. Wiedervorlage — braucht Caspar_Ds Auge oder Entscheidung

Nichts davon ist Bauarbeit. Je Punkt: was ansehen, wo.

1. ~~**Abnahme der drei Leuchten mit Tiefe.**~~ **Entschieden am 24.09.:** Scheinwerfer mit Tiefe
   „sieht gut aus" — **die alten ohne Tiefe bleiben trotzdem**; Lichtstrahlen mit Tiefe „nicht so gut,
   dass es das alte ersetzen könnte, sie wirken anders und haben beide ihre Berechtigung" — **beide
   bleiben**; Laser mit Tiefe: „zu verwaschen, zu ungesättigt, alles zu blass, der alte bringt mehr
   Farbe" → nachgebaut (Abschnitt 15), erneut auf Wiedervorlage. Nichts fliegt raus.
2. **Lichtstrahlen: Schacht/Fächer gegen den alten `strahlen` am Bild**, und die **Kugelquelle** —
   bei Radius 2,0 unterscheidbar, aber blass. Reicht das, oder braucht sie weniger, dafür dickere
   Strahlen? (KONZEPT-LEUCHTEN §7, Tabelle.)
3. ~~**Roll am Fächer ansehen**~~ — 24.09.: „gut".
4. **Escher, Funken auf Raumtiefe 1** — säulenartige Streifen statt Funken. Differenzbild liegt
   unter `~/Downloads/escher-funken-diff.png` (hell = wo Funken malen). Richtig, weil jede Stufe
   Boden ist — oder falsch?
5. **Sternschnuppe am Himmel.** Der Entwurf liegt als Kommentar im Code (Zeile ~30212): keine
   Flächensperre (die war am 21.09. gebaut und am selben Tag zurückgenommen — *„bei mir sind
   Titelbilder mit klarem Himmel klar unterrepräsentiert"*), sondern eine **Entfernung**. Gebaut
   wird er, wenn du ihn abnimmst.
6. **Zonen: Ort oder Ausdehnung?** (KONZEPT-ZONEN §9) — Vorschlag: Körper haben einen Ort, Medien
   eine Ausdehnung. Davon hängt die Zeile „Aufenthalt" ab, und ob ein Polarlicht als Fläche ohne
   eigenen Regler auskommt. Dazu: **Luftperspektive** als zweite Quelle bauen oder Notiz lassen?
7. **Teilchen-Entfernung am Bild** (KONZEPT-ZONEN §12): seit dem 21.09. rechnen die Teilchen mit
   der Tiefe statt der Trennlinie (p95 8,94 → 9,08). Der Prüfstand sagt „anders" — die Richtung
   beurteilst du. Ein Rezept mit Funken oder Schnee auf einem Bild mit Tiefenkarte reicht.
8. **Loop-Abweichungen** — unverändert seit dem 15.09.: (a) die sieben bewussten Abweichungen
   (Zeile ~4261: Streifen „beide", Scheinwerfer-Fahrt, langsame Schwaden, Nebel-Tempo,
   Teiler-Titel, wenige Schläge, Schritt auf der Eins) über den Loop-Modus; (b) Effekte im
   Video-Übergang (*„noch nicht getestet"*); (c) das Pendel (*„ist immer noch viel zu schnell"*,
   15.09. 22:43). Seither kein Commit dazu.
9. **Ken Burns „setzt immer neue Punkte"** (22.09. 14:12) — Ursache nicht gefunden, Code gelesen
   und live geprüft. Beim nächsten Auftreten bitte festhalten: welches Bild, ob die Zonenansicht an
   war, welche Karte offen war (eine offene Raumleuchte greift den Klick vor der Ken-Burns-Karte ab,
   `kbBuehneEinrichten` Zeile ~32771), ob eine Tiefenkarte da war. Dann gemeinsam live.
10. **Nahtfall mit zwei Zuständen** (Kommentar über `vorlaufen`, Zeile ~35895): das erste
    Exportbild einer Kette ohne Vorlauf wird in etwa jedem vierten Lauf anders gemalt — gemessen an
    `kb-einPunkt`, 3 von 14. Die Übergabe vom 20./21.09. nannte dafür `kb-fuenfPunkte` und
    `kb-fokus-unscharf`; die zeigten es am 20.09. einmal und seither in drei Nahtläufen nicht.
    Quotient 0,09, unter der Sichtbarkeit. Entscheidung: eigene Baustelle oder liegen lassen? Dazu
    deine Frage vom 21.09., ob das Nahtregime so bleibt.
11. **Sliderwüsten ausdünnen** — deine Sorge vom 18.09., nie beauftragt. Ob und wann.
12. **Anfahren/Auslaufen der Ken-Burns-Fahrt** — heute eine Konstante (`KB_RAMPE` 0,25).
    Bildentscheidung: gleich lang, oder z. B. 20 % zu 35 %? Danach zwei Zeilen Code.
13. **Morgenknopf:** beim nächsten Morgenklick hinsehen, ob die Token-Zeile jetzt über der
    Alben-Zeile steht.

*Nachgetragen am 23.09. tagsüber (Abschnitt „Die Bauliste, ohne Caspar_D"):*

14. **Kaustik im Nebel** — seit der Migration auf den Lichtpuffer +146 % Licht; das Netz leuchtet den
    ganzen Nebel an. Zu kräftig oder richtig so? Ein Rezept Kaustik + Filmnebel.
15. **Nebel: Extinktion auf dem Lichtweg und Phasenfunktion** — nach deinem „go" im zweiten Anlauf
    drin (Raumkoordinaten von `lichtRaum`, Stärke beim Mischen): Scheinwerfer mit Tiefe −10 %/−15 %,
    Laser −33 %/−40 %. Ansehen: Scheinwerfer bzw. Laser mit Tiefe + Filmnebel, Lampe einmal vor
    und einmal hinter das Motiv (Tiefe der Quelle) — hinterleuchtet wird der Nebel heller. Zu stark:
    die 0,5 im Lampenweg ist der Regler (KONZEPT-LEUCHTEN §6, Tabelle).
16. **Überstrahlungsanzeige** — Wort („Ausgebrannt: 6 % des Bildes") und Ort (Bühne unten links)
    sind Entwurf; im Studio ansehen, z. B. „Helligkeit schlägt" mit voller Wucht.
17. ~~**Regel-9a-Skala am Dicke-Regler**~~ — 24.09.: „gut".

## 3. Offen — Bau, in dieser Reihenfolge

Nach den Wiedervorlagen 1–2; an ihnen hängt, ob die alten Effekte fallen.

1. ~~**Regel 9a an `strahlenRaum.dicke`:** die Skala des Reglers transformieren (heute linear
   0,05–12°, Zeile 27729; die Wirkung ist eine S-Kurve 0,43 … 15,23).~~ — gebaut 23.09. tagsüber, 3.
2. **Nebel**, drei Punkte: ~~räumliche Schwaden~~ (gebaut, tagsüber 8); Extinktion auf dem Lichtweg
   und Phasenfunktion gebaut, gemessen, ausgebaut → **Wiedervorlage 15**.
3. ~~**Überstrahlungsanzeige** — eine Zahl in der Zeile, die auftaucht, wenn alles geclippt ist
   (Ansatz in KONZEPT-LEUCHTEN §6).~~ — gebaut, tagsüber 7 (Wiedervorlage 16 fürs Wort und den Ort).
4. ~~**Migration auf den Lichtpuffer:** Flammen → Kaustik → Partikel-Leuchten (KONZEPT-LEUCHTEN §5a).
   Zugleich Vorbedingung für Float.~~ — alle drei gebaut, tagsüber 6 (Kaustik-Stärke: Wiedervorlage 14).
5. ~~**Tiefenkarte leihen** — beauftragt (Caspar_D, 21.09. 18:46: *„Es muss dranstehen … dann eben
   ‚vom Titelbild geliehen'."*).~~ — gebaut, tagsüber 4.
6. ~~**Tempo in Schlägen** (Ken Burns): der Regler heißt noch „Tempo (Takte)" 1–4 (Zeile 27417);
   spezifiziert ist Vorgabe 2 Schläge.~~ — gebaut, tagsüber 5.
7. **`laserraum-strahl-kegel`:** letzter gemessener Stand **0,064/0,168** (nach `fwidth`, 22.09.
   14:04) — besser als die 0,16/0,23 aus 6f, aber seit fünf weiteren Änderungen an diesem Effekt
   nicht mehr gemessen. Die `u_zeit`-Hypothese ist ungeprüft; der Code bestätigt nur, dass `u_zeit`
   die absolute Songzeit ist (Zeilen 27710, 27764), nicht auf die Clip-Länge gefaltet.
8. ~~**Linse 10,9 ms** — erster Schritt ist die Messung, woran es liegt (Backlog), nicht der Umbau.~~
   — gemessen, tagsüber 9: nicht die Linse, der GL-Gang je Effekt; Umbau von `GL.run` wäre der Hebel.
9. **Kostenanzeige im Studio** (Prüfverfahren, Anforderung 3) — zu planen.
10. **Polarlicht** — Vorbedingung erfüllt („ganz hinten" steht), wartet auf Wiedervorlage 6.
11. **Module herauslösen:** `index.html` ist weiter ein `<script>`; Effektclip-Studio zuerst.
12. **Kleinkram:** ~~`flaecheAb` wird in Vorbereitung und Rezept noch gelesen und geschrieben
    (Zeilen ~28647/28664), der Regler ist weg — löschen, nicht stehen lassen.~~ (gelöscht, tagsüber 2).
    `gesundheit.js` prüft nicht, ob der Morgenknopf einen Token bekommt (Idee aus 6d).
13. **Backlog, unverändert:** KI-Modelle auf der Radeon (M1–M5); Farbverlauf über den Fächer
    (nicht bestellt).

## 4. Drei Korrekturen an meiner eigenen Liste von 01:25

- „Nebel: Lichtabfall mit Entfernung" als offener Punkt — falsch, in der Lampe gebaut; offen ist
  die Extinktion auf dem Lichtweg.
- „Morgenknopf: Token-Zeile unter der Alben-Zeile" als Restfehler — aus der veralteten Übergabe
  abgeschrieben, in derselben Nacht behoben.
- „`laserraum-strahl-kegel` Naht 0,16/0,23" — der letzte Messwert war 0,064/0,168.

Fürs nächste Nachschlagen: Caspar_Ds Wortmeldungen nur aus dem Transkript zitieren, nie aus
zusammengefassten Übergaben — zwei Prüfagenten haben Kontexte verwechselt (*„fang einfach von
vorne an"* galt der Punkteliste, nicht Ken Burns).

---

# 23.09.2026, tagsüber — Die Bauliste, ohne Caspar_D

Caspar_D, morgens: *„ich bin heute nicht hier, du hast 18h Zeit, tob dich aus, fang einfach an und
arbeite dich durch."* Gemeint ist Abschnitt 3 der Durchsicht von heute Nacht. Jeder Schritt einzeln
committed, mit Nahtprobe; die Wiedervorlage-Punkte (Abschnitt 2) bleiben unberührt. Testläufe am
Prüfstand, nicht in seinem Fenster; die Oberfläche in einem eigenen Tab auf dem Prüfstand-Stand.

## 1. `laserraum-strahl-kegel` nachgemessen

Gleich **0,06 / Folge 0,17** — identisch mit dem Stand nach `fwidth` (22.09. 14:04). Die fünf
späteren Änderungen an Laser und Lichtstrahlen haben die Naht dieses Falls nicht verändert. Die
`u_zeit`-Hypothese bleibt ungeprüft; sie steht nicht mehr oben auf der Liste, weil der Wert unter
einer Fünftel-Graustufe liegt und die Naht schließt.

## 2. `flaecheAb`-Reste gelöscht (`fae4e69`)

`vorbAus` las den Wert aus alten Rezepten, `vorbExport` schrieb ihn zurück, niemand las ihn. Die
Begründung bleibt im Kommentar über `vorbNeu`. `trennung`/`trennWeich` bleiben — `zoneTrennung()`
wird bei der Zonenmaske noch gelesen (Zeile ~36807).

## 3. Regel 9a: die Dicke-Skala von `strahlenRaum`

Gemessen mit dem Prüfhaken `dioBeweis` (hinzugefügtes Licht des Effekts gegen dasselbe Bild ohne
ihn; Titel „Stumm", Filmnebel, Prüfstand): siehe EFFEKTCLIP-REGELN 9a für die Zahlen. Der Befund
von gestern (S-Kurve) gilt seit dem Glimmen nicht mehr; heute ist die Kurve **bis 0,4° steil und
danach linear**, bei 360 und 720 px gleich, bei der Kugelquelle dieselbe Form.

**Gebaut:** ein allgemeiner Mechanismus statt einer Sonderlösung. Ein Parameter kann `skala`
tragen (Stützstellen Wert/Wirkung); der Schieber läuft über die Wirkung, `skalaZuRegler` und
`skalaVonRegler` (neben `kf`) rechnen um, die Zahl daneben zeigt den Wert. Rezepte tragen weiter
den Wert. Am Prüfstand-Studio im eigenen Tab gefahren: Stellung 0 → 0,05°, ¼ → 0,44°, ½ → 4,67°,
1 → 12°; die Vorgabe 5° steht bei 0,52; keine Konsolenmeldung. Wer die Karte nach dem Schieben
neu baut, sieht 4,98° statt 5° — die Rundung auf zwei Stellen, kein Fehler.

## 4. Tiefenkarte leihen — Sunos Bewegtbild trägt die Karte seines Titelbilds

Caspar_D, 21.09.: *„Es muss dranstehen. Die Quellenzeile sagt heute ‚Tiefenkarte: da / unterwegs /
keine' — dann eben ‚vom Titelbild geliehen'."* Gebaut in `tiefeUrl` (die Quelle `bewegtbild` bekommt
`/media/<id>/tiefe.png`, die Karte des Titelbilds) und als eigener Satz `tiefeLeihe()` neben
`tiefeStand()`: auf jeder Effektkarte **einmal**, unter demselben Träger wie der Wartesatz (Klasse
`tbs-leih`, das Nachziehen beim Schieben lässt sie stehen wie `tbs-warte`). Eigene Videos (`video n`)
bleiben bei „keine" — andere Herkunft; der Grundsatz über `tiefeUrl` sagt jetzt beides. Der
Grau-Grund unterscheidet: eigenes Bewegtbild → keine Karte; Sunos Bewegtbild → „leiht sich die Karte
ihres Titelbilds, aber tiefe.png kam nicht an".

Am Prüfstand-Studio im eigenen Tab: Titel „Stumm", Quelle „Bewegtbild (Suno)", Karte „Scheinwerfer mit
Tiefe" — der Satz steht genau einmal, kein Wartesatz, nichts grau außer der eigenen Zeile des Effekts,
die Zonen-Ankreuzliste kommt aus der geliehenen Karte. Zurück auf „Titelbild": kein Satz. Die
Zonenlage und die Tiefenproben hängen am Quellschlüssel (`id|bewegtbild|1`), werden also für das
Bewegtbild eigens gerechnet — aus derselben Datei, deshalb gleich.

Nebenbefund am Prüfstand: beim Wechsel auf das Bewegtbild ruft das Studio `POST /api/sprungkopie` —
eine Server-API der echten App; der statische Prüfstand antwortet 404, ohne Folgen. Und das
Labor-Studio öffnet einen Titel erst vollständig mit `__naht.bereitMachen`; der „Studio"-Knopf der
Kachel allein lässt den Kopf leer — für die Prüfung im Tab ist der Haken der Weg, wie für naht.mjs.

## 5. Tempo der Ken Burns Fahrt in Schlägen

Der Regler heißt jetzt **„Tempo (Schläge)"**, 1–16, Vorgabe 2 (`kbSchlaege`; vorher `kbTakte` 1–4,
Vorgabe 1 = ein ganzer Takt). Ein Zug ist Z Schläge lang; die Halte kommen weiter in ganzen Schlägen
aus dem Rest, der Takt bleibt als Reserve für sie (`kbPasst`, `kbPlan`). Im Pult ohne Cliplänge:
eine Runde = L·Z Schläge plus (n+1) Halte zu je einem Takt. Die Sätze unter Regler und Punkteliste
rechnen mit („Ein Zug 2 Schläge (1,0 s) … Züge kürzer als ein Schlag"). Alte Rezepte: `effektAusRezept`
übersetzt `kbTakte` mit vier Schlägen je Takt, wie die Spezifikation rechnet („Tempo 1 = 4 Schläge") —
fünf gesicherte Effektclips im Archiv tragen `kbTakte`, sie fahren danach wie vorher. Die Vorlage
„Traum (weich)" und zwei Prüffälle (`kb-tempo2-b`, `kb-tiefe-tempo2`) stehen jetzt auf 8 Schlägen.
Naht: `kenburns`, `kb-tempo2-b`, `kb-tiefe-tempo2`, `kb-fuenfPunkte`, `kb-vorb` alle gleich 0,00.
Im Tab: Karte „Ken Burns Fahrt", Regler und beide Sätze wie beschrieben, kein `kbTakte` mehr auf der
Karte. Konzept nachgezogen (KONZEPT-ZIELPUNKTE §5).

## 6. Migration auf den Lichtpuffer: Flammen und Kaustik

Flammen und Kaustik tragen jetzt `leuchtet` und schreiben in den Licht-Puffer. Die Kaustik brauchte
nur die Marke (ihr Shader gibt nur Licht aus); die Flammen bekamen einen Puffer-Zweig im Shader
(`u_inPuffer` über `glZusatz`), weil sie sonst das ganze Bild als Licht gemalt hätten. Dazu die
Regel aus dem Bildweg in `leuchteInPuffer` nachgezogen: bei `lmNurSchub` dimmt der Antrieb die
Deckkraft nicht. Gemessen (KONZEPT-LEUCHTEN §5a, „Gebaut am 23.09."): Flammen +67 %/+62 %, Kaustik
+146 %/+143 % hinzugefügtes Licht mit Filmnebel. **Die Kaustik im Nebel ist damit sehr kräftig —
ansehen (Wiedervorlage).** Der Filmnebel zählt beide auf seiner Karte zu den Leuchten.

**Dritter Schritt, die leuchtenden Teilchen:** `leuchtet` ist bei den Partikeln jetzt eine Frage an die
Art (`leuchtetJetzt`, dasselbe Muster wie `medium`): Funken, Glühwürmchen, Bokeh (Lichtkreise sind
Lichter) und Sternschnuppen schreiben in den Puffer; Glitzer reflektiert nur, Schnee, Staub, Asche
leuchten nicht. Der Partikel-Maler kannte `LICHTMAL` schon (Schwaden lesen den Puffer). Gemessen:
Funken 49.063 → 114.511 (+133 %), Glühwürmchen 32.273 → 89.083 (+176 %) — kleine Zahlen, weil die
Teilchen klein sind; der Hof-Puffer (1/14) macht daraus einen weichen Schein im Nebel. Die Karte des
Filmnebels nennt jetzt „Flammen, Kaustik, leuchtende Teilchen" unter den Leuchten. Damit ist die
Migrationsliste aus KONZEPT-LEUCHTEN §5a abgearbeitet; was am Lichtpuffer noch fehlt, ist der
**Herkunfts-Puffer für die Canvas-Maler** (Caspar_D: „das sollten alle Lichtstrahlen und -quellen tun").

## 7. Überstrahlungsanzeige

„Ausgebrannt: 6 % des Bildes" — eine Zahl unten links auf der Bühne, die erst auftaucht, wenn die
Effekte mehr Bildpunkte an den Anschlag bringen als die Quelle selbst (ein Kanal ≥ 250, gemessen
zweimal je Sekunde auf 96 Bildpunkten, `brandZeigen` in `rahmen()`). Kein Deckel: Ausbrennen bleibt
ein Mittel. Bewusst nicht in der Zeile eines Reglers, sondern am Bild: das fertige Bühnenbild ist
keinem Regler zuzurechnen, und dort brennen auch die alten Canvas-Leuchten aus, die keinen Puffer
kennen. Im Tab gesehen: ohne Effekt versteckt; „Helligkeit schlägt" mit voller Wucht plus
Scheinwerfer → „2 %" bzw. „6 %" auf dem Schlag, danach zwei Sekunden gehalten (ohne Halten flackerte
die Zahl im Takt des Pulses, unlesbar), dann weg. Keine Konsolenmeldung. Das Wort „Ausgebrannt"
und der Ort sind Entwurf — Caspar_D sieht es beim nächsten Öffnen des Studios.

## 8. Nebel: drei Schritte gebaut, einer bleibt

**Räumliche Schwaden** sind drin: das Rauschfeld wird je Tiefe verschoben (`raum`, Vorschau und
Loop-Form gleich), eine Figur steht in anderem Nebel als die Wand hinter ihr; ohne Tiefenkarte bleibt
alles wie vorher. Am Licht neutral (−0,7 % / −4 % bei den Raumleuchten, +0,3 % beim alten Scheinwerfer).

**Extinktion auf dem Lichtweg** und **Phasenfunktion** habe ich gebaut, gemessen und wieder
ausgebaut: sie nehmen dem Scheinwerfer mit Tiefe 25–43 % und dem Laser mit Tiefe 54–60 % des Lichts
im Nebel — genau den Leuchten, die Caspar_D tags zuvor als zu schwach beanstandet hat. Physikalisch
sind beide richtig (Nebel dämpft auch den Hinweg, und er streut nach vorn); ob sie gewollt sind und
mit welchem Ausgleich, ist seine Entscheidung am Bild (Wiedervorlage 15). Formeln und Zahlen stehen
im Leuchten-Konzept §6, der Code ist gelöscht, nicht auskommentiert.

## 9. Linse: gemessen, woran es liegt — nicht an der Linse

GPU-Kostenmessung (Prüfstand `--gpu`, Exportweg): Linse netto 2,3 ms bei 360, 3,9 ms bei 1080 —
neunmal so viele Bildpunkte, kaum mehr Zeit. Experiment: dieselbe Linse ohne Verzerrung (alle Kanäle
an `v_uv`) kostet gleich viel (GL 2,73 gegen 2,29 ms). **Die Cache-Vermutung aus dem Backlog ist
widerlegt.** Teuer ist der GL-Gang je Effekt — Textur hoch, rastern, zurück —, rund 2–3 ms
unabhängig von Größe und Shader; die 10,9 ms vom 21.09. ließen sich auf diesem Weg nicht
reproduzieren. Hebel wäre ein Umbau von `GL.run`: aufeinanderfolgende GL-Effekte auf der
Grafikkarte lassen, einmal zurücklesen. Im Backlog fortgeschrieben, nicht gebaut.

## 10. Ken Burns „setzt immer neue Punkte" — Reproduktionsversuch

Im Prüfstand-Tab mit Tiefenkarte, offener Karte „Ken Burns Fahrt", Helligkeitsschlag und
Scheinwerfer in der Kette, Bild stehend: die Karte beginnt mit zwei vorgeschlagenen Punkten; ein
Klick auf die Bühnenmitte setzt den dritten, ein zweiter und dritter Klick **an derselben Stelle**
setzen keinen — sie treffen die Marke (3 → 3 → 3), erst ein Klick daneben setzt den vierten. Nicht
reproduzierbar. Bleibt Wiedervorlage 9, mit den Fragen dort (welche Karte war offen, Zonenansicht
an?).

## 11. Was heute bewusst nicht gebaut wurde

- **Kostenanzeige im Studio**: Anforderung 3 des Prüfverfahrens (Backlog, 21.09.) ist eine
  Kostenschranke im Prüfstand, und das Verfahren steht auf „zu planen" — planen heißt nicht bauen.
- **Module herauslösen**: Architektur, nicht ohne Abstimmung; die Reihenfolge steht (Effektclip-Studio zuerst).
- **Polarlicht**: wartet auf Wiedervorlage 6 (Ort oder Ausdehnung).
- **`gesundheit.js` Token-Prüfung**: Idee aus 6d, nie bestellt.
- **Extinktion und Phasenfunktion im Nebel**: gebaut und wieder ausgebaut, siehe 8.

## 12. Der volle Regressionslauf — und ein Fund von gestern

244 Fälle, 1628 s mit zwei Chrome nebeneinander, keine Abbrüche, kein `gl NEIN`, keine
Konsolenmeldung. Drei Fälle über 0,3: `laserraum-matrix` 0,43/0,82, `laserraum-rollen` 0/0,43,
`strahlenraum-roll` 0,13/4,29. Wiederholung allein: Matrix 0,31/1,68, Roll 0,81/4,67, Rollen 0/0 —
reproduzierbar, aber schwankend, und die Matrix ist ein **stehender** Fall. Eingegrenzt über die
Stände von gestern (`web/index.html` je Commit ausgecheckt, gemessen, zurück): sauber bei `824b4ce`
(Querschnitt-Normierung), auffällig ab `f00aa61` — **`fwidth`**. Die Ableitung stand in `imStrahl`
hinter den Ausstiegen, also in uneinheitlichem Kontrollfluss, wo sie undefiniert ist; SwiftShader
lieferte Zufall. Behoben mit einer analytischen Bildpunkt-Schranke (`1/u_res.x / halb`, obere
Schranke der echten Änderung), Erweiterung wieder raus; Matrix/Roll/Rollen/Fächer 0,00/0,00,
Kegel unverändert (KONZEPT-LEUCHTEN §7, „Berichtigt am 23.09."). Die zwei Stichproben von gestern
(`faecher`, `strahl-kegel`) konnten das nicht finden — ein Fall, der Zufall zeigt, muss stehen
und ohne Nebel sein. Zwei Lehren: Ableitungen im Shader vor jeden `return`; und der volle Lauf am
Ende eines Bautages ist keine Formsache.

**Läufe über zwei Minuten heute** (Caspar_D: „tob dich aus"): Kegel-Nachmessung 151 s, Nebel-Naht
190 s, voller Lauf 1628 s, Laser/Strahlen-Naht nach dem Fix. Alles Prüfstand, nichts in seinem Fenster.

## 13. Stand am Ende des Tages

Zwölf Commits, alle gepusht (`fae4e69` … `edf469d`), Arbeitsbaum sauber, origin ohne Fremdes.
Gebaut und geprüft: `flaecheAb`-Reste weg · Regel-9a-Skala am Dicke-Regler (allgemeiner
Mechanismus) · Tiefenkarte vom Titelbild geliehen (Sunos Bewegtbild) · Ken-Burns-Tempo in Schlägen
mit Übersetzung alter Rezepte · Flammen, Kaustik und leuchtende Teilchen im Lichtpuffer ·
Überstrahlungsanzeige auf der Bühne · räumliche Schwaden im Nebel · Linse gemessen (Vermutung
widerlegt) · `fwidth`-Fund aus dem vollen Lauf behoben. Nicht gebaut, weil es Caspar_D gehört:
Extinktion/Phasenfunktion (ausgebaut, Zahlen im Konzept), Kaustik-Stärke, Wort und Ort der
Überstrahlung — Wiedervorlage 14–17 oben in der Durchsicht.

Nach dem `fwidth`-Fix lief kein zweiter voller Lauf: der Fix ändert nur `imStrahl`, und alle 17
Fälle mit Laser oder Lichtstrahlen mit Tiefe wurden danach geprüft (0,00, keine Meldung). Wer
sichergehen will, startet `node labor/nahtpruefung/naht.mjs --neu --jobs 2` (~27 min).

Beim nächsten Öffnen des Studios sieht Caspar_D zuerst: den Dicke-Regler mit neuer Skala, das
Tempo in Schlägen, den Satz „vom Titelbild geliehen" auf einem Suno-Bewegtbild, die Zahl
„Ausgebrannt" unten links, wenn etwas ausbrennt — und den Nebel mit Tiefe. Alles davon steht auf
der Wiedervorlage, nichts davon braucht Bauarbeit, um beurteilt zu werden.

## 14. Nachmittag: Extinktion und Phasenfunktion, zweiter Anlauf (Caspar_D: „go")

Caspar_D: *„könnte man Phasenfunktion und Extinktion nicht einfach schwächen, vielleicht ist die
Tiefe nicht korrekt interpretiert und deswegen wirken beide zu stark."* Beides war richtig. (1) Die
Tiefe: der Vormittag rechnete mit der Streiflicht-Konvention (Tiefendifferenz · 1,8), jetzt mit den
Raumkoordinaten von `lichtRaum` (z = Tiefe · Raumtiefe, per `glZusatz` in den Nebel). (2) Ein
echter Fehler: die Stärke stand im Exponenten der Lampen-Extinktion, beim Kameraweg wirkt sie beim
Mischen — bei Stärke 0,4 der Unterschied zwischen 36 % und 63 % Durchlass. Zerlegt gemessen: die
Phase ist mild (−2 %/−16 %), die Extinktion war der Fresser (−29 %/−66 %); mit der Mischform sind es
zusammen **−10 %/−15 % (Scheinwerfer)** und **−33 %/−40 % (Laser)**. Die eine gesetzte Zahl ist
das halbe Gewicht des Lampenwegs. Alter Scheinwerfer unverändert (Weiche am Herkunfts-Puffer).
Wiedervorlage 15 ist damit ein Augenschein, keine Entscheidung mehr.

## 15. Caspar_D geht die Liste durch — der Laser wird nachgebaut (24.09.2026)

**Entschieden:** Scheinwerfer mit Tiefe gut, die alten bleiben trotzdem (1). Lichtstrahlen mit Tiefe
ersetzen das alte nicht, beide haben ihre Berechtigung (3). Roll gut (4). Dicke-Skala gut (5).

**Laser mit Tiefe** — *„Fächer ist natürlich nicht parallel — falsche Bezeichnung … die Strahlen sind
immer noch zu verwaschen und zu ungesättigt, die Natur des Lasers ist nicht wirklich gut getroffen,
alles zu blass. Der alte Laser bringt mehr Farbe. Ich hätte gern diese Klarheit und Sättigung."*
Nachgelesen am alten Maler: Kern mit voller Deckkraft, Saum 3,2-fach breit mit **0,22** der
Kern-Deckkraft, Verrechnung **Addieren**. Der neue hatte den Saum auf **0,85** (gestern nach der
Lichtmenge gewählt, 86 % des alten) — viermal so hell, das „verwaschen" —, klemmte die Farbkanäle
einzeln, wenn v über 1 geht (aus (0,2; 0,9; 1)·3 wird (0,6; 1; 1): das „blass"), und verrechnete mit
Screen. Geändert: Saum 0,22; im Bildweg wird auf den größten Kanal normiert (Farbton bleibt, nur
voll; im Licht-Puffer und Herkunftslauf nicht); Verrechnung Addieren; Bauart heißt „Fächer — mehrere
Strahlen aus einer Quelle". Lichtmenge danach: ohne Nebel 9.440 → 7.003 (−26 %), mit Nebel 396.019 →
266.962 (−33 %) — der Saum fehlt, der Kern ist satt und hart. Gestern „zu schwach", heute „zu blass":
beides zugleich geht nur über den Kern. Wiedervorlage. Naht über alle zwölf `laserraum-*`-Fälle: elf 0,00, `laserraum-strahl-kegel` 0,06/0,31 — in seiner bekannten Schwankung (0,17–0,36 seit dem Saum), kein neuer Befund.

**Neuer Wunsch:** *„bei Feuer und Flammen (Rauschen) fällt mir auf, dass sie keinen Ursprung (Kreis,
Ellipse, Linie …) haben. Das brauche ich aber, sonst kann man sie nur an der Bildunterkante
einsetzen."* — Entwurf folgt als Skizze, vor dem Bau.

## 16. Feuer und Flammen: die Grundlinie ist ein Bogen (24.09.2026)

Caspar_D: *„Das Problem beim Feuer ist die waagerechte Grundlinie. Ich hätte gerne die untere Linie
der Ellipse als Begrenzung, und am besten unscharf."* Und zum Entwurf (Formen, senkrecht steigend):
*„ansonsten alles korrekt entworfen beim Feuer — und bei der Flamme."* Gebaut an beiden Effekten,
mit denselben Wörtern: **Wölbung** (0 = gerade Linie wie bisher, 1 = Schale so tief wie breit; Boden
bleibt der tiefste Punkt, die Enden des Bogens liegen höher) und **Unschärfe** (0 = der alte harte
Schnitt; sonst weicht die Kante nach unten auf, in Anteilen der Flammenhöhe). Flammen (Shader): Fuß
je Bildpunkt auf dem unteren Ellipsenbogen, `fuss = smoothstep(−Unschärfe, 0, h)`. Feuer (Maler):
Fuß je Zunge auf dem Bogen, um bis zu eine halbe Unschärfe verstreut, die untersten Kugeln blenden
ein; die Glut folgt dem Bogen (bei Wölbung 0 das alte Band, sonst je Zunge ein Schein am Fuß).
**Wölbung 0 ist bitgleich mit vorher** — gemessen gegen den Stand `8a1de56`: Feuer 7.498.041 /
7.156.192, Flammen 5.938.346 / 4.949.858, beide Male exakt gleich. Naht: `feuer`, `feuer-flackern`,
`flammen`, `flammen-langsam-wind`, `flammen-schnell` alle 0,00. Alte Rezepte tragen die neuen Regler
nicht und sehen gleich aus.

## 17. Der rote Knopf meldet „Lyrics geändert" — Befund (24.09.2026)

Caspar_D: *„der rote Knopf meldet mir regelmäßig, dass Songs geänderte Inhalte in den Lyrics hätten
… ich habe in allen gemeldeten Fällen nichts verändert."* Heute zwei Titel: „Das Geschenk — Es ist
raus" und „Lenore english" (`library/letzter-vergleich.json`). `bin/sammeln.js` vergleicht
`metadata.prompt` der Ernte (Liste `songs` in `roh/profil-…json`) mit `lyrics` im Katalog, Zeichen
für Zeichen. Über alle 326 Titel weicht genau **ein** Zeichen je Titel ab, und es ist jedes Mal
**U+FFFD, das Ersatzzeichen** — zweimal hintereinander für ein zerrissenes Mehrbyte-Zeichen:
- „Das Geschenk": die **Ernte** hat `geh��rt`, der Katalog `gehört`. Im **selben** Ernte-File steht
  derselben Titel ein zweites Mal, unter den Playlists (`/api/playlist/…`) — dort **richtig**.
- „Lenore": der **Katalog** hat `go��”`, die Ernte heute `go…”` (richtig) — das kaputte Zeichen
  kam aus einer früheren Ernte und wurde beim Einbau übernommen.
Die Bytes in der Datei sind `EF BF BD EF BF BD`, also schon im Browser als Ersatzzeichen im String
gewesen; das Lesezeichen liest mit `r.json()`, der Server schreibt die Ernte als Bytes
(`Buffer.concat`), unser Weg zerreißt nichts. **Sunos Profil-Endpunkt (`/api/profiles/<handle>`)
liefert `prompt` sporadisch mit zerrissenen Mehrbyte-Zeichen; der Playlist-Endpunkt liefert denselben
Text sauber.** Es wechselt von Ernte zu Ernte (heute das ö in „Geschenk", früher das … in „Lenore").

**Vorschlag, noch nicht gebaut (Datenfluss, erst ansagen):** (1) `sammeln.js` wertet einen Unterschied
nicht als Änderung, wenn die Texte nur an Ersatzzeichen-Stellen abweichen; (2) `aufbereiten.js`
übernimmt beim Einbau keinen Text mit Ersatzzeichen, wenn der Katalog denselben Text sauber hat, und
ersetzt umgekehrt einen kaputten Katalogtext durch den sauberen der Ernte (heilt „Lenore" beim
nächsten Einbau); (3) besser noch: für `lyrics` die Playlist-Fassung vorziehen, wo sie den Titel
enthält. **Bis dahin den Einbau dieser Ernte nicht laufen lassen** — er schriebe `geh��rt` in den Katalog.

## 18. Ersatzzeichen: die Regel, was die Wahrheit ist — gebaut (24.09.2026)

Caspar_D: *„Ich habe jetzt etwas Angst, dass das auch woanders passiert, nur eben unbemerkt, weil
nicht geprüft wird. Wie entscheiden wir, was die Wahrheit ist?"* — dann *„kannst du die Ernte
reparieren"* und *„ansonsten go"*.

**Der Bestand, vollständig durchsucht (alles außer Medien):** vier Stellen. Katalog: „Lenore
english" (`lyrics`), „桜の少女" (`beschriftung`/`caption`); `lyrik.json`: dieselbe Lenore-Zeile;
`reaktionen.ndjson`: eine Benachrichtigung („Ein Song ��ber die …"). Alle aus Suno-Antworten.

**Die Regel** (`bin/ersatzzeichen.js`, gemeinsam für alle Werkzeuge): U+FFFD kommt in echtem Text
nie vor, es ist die Narbe des Fehlers. Ein Text mit Ersatzzeichen ist genau dort kaputt; von zwei
Fassungen, die sich nur an Ersatzstellen unterscheiden, ist die ohne die Wahrheit; sind beide an
verschiedenen Stellen kaputt, wird gemischt; alles andere ist eine echte Änderung, und dann gilt
das Neue. Ein Ersatzlauf steht für ein Zeichen (ein bis vier Bytes), nie für ASCII. `angleichen`
legt zwei Fassungen aneinander und kehrt an Ersatzstellen zurück, wenn es später nicht passt
(die Ellipse vor einem Anführungszeichen). Neun Prüffälle, darunter die zwei echten.

**Fünf Stellen:**
1. `bin/ernte-heilen.js` — heilt eine Ernte aus den Zweitkopien im selben File (Playlists, private
   Liste), Sicherung `…json.kaputt`, `--probe` zeigt nur. Die heutige Ernte ist damit geheilt:
   genau ein Feld geändert (`songs[91].metadata.prompt`, „gehört"), Serialisierung bytegleich.
2. `bin/sammeln.js` — heilt die Ernte im Speicher und meldet Unterschiede nur an Ersatzstellen
   gesondert („Ersatzzeichen (Suno zerreißt Zeichen, keine Änderung)") statt als „Lyrics";
   `letzter-vergleich.json` trägt sie als `kaputt`. Gelaufen: inhaltlich anders 0, Ersatzzeichen 1
   (Lenore, „neu heilt alt").
3. `bin/aufbereiten.js` — heilt jede Rohdatei beim Lesen und wendet beim Einbau die Wahrheitsregel
   auf `lyrics`, `titel`, `stilPrompt`, `stilAusschluss`, `beschriftung` an; jeder Eingriff steht im
   Protokoll. **Nur die Syntax geprüft** — der Einbau selbst schreibt den Katalog und löscht die
   Rohdaten, den fährt Caspar_D.
4. `bin/gesundheit.js` — neue Zeile „Ersatzzeichen im Bestand", mit Änderungsmeldung gegen den
   Vortag. Heute: 4 Stellen.
5. `browser/morgens.js` — dieselbe Frage („nur an Ersatzstellen verschieden?") für Titel und Stil,
   eigene Rubrik „Suno lieferte ein Zeichen kaputt — keine Änderung, wird beim Einbau geheilt".

**Was nach dem Einbau passiert:** Lenore heilt (Katalog und damit `lyrik.json` beim nächsten
Lyrik-Lauf), „Das Geschenk" bleibt sauber. Es bleiben die Caption von 桜の少女 (heilt, sobald eine
Ernte sie sauber liefert) und die Benachrichtigung (Sunos Wortlaut). `gesundheit.js` zeigt es.

## 19. Titel über dem Bild — gebaut (24.09.2026)

Caspar_D: *„ich hätte noch einen Textgenerator für den Effektclip … ein Text, der als Titel über
ein bewegtes Video oder ein Effektclip gelegt werden kann … meine Standardanwendung ist: Titel ist
die ganze Zeit zu sehen, Farbwahl möglich, Groteske oder Serifen reicht erstmal, Verrechnungsmodi,
freier Text erstmal … Karaoke später … erstmal die Minimalversion, die als 10-Sekünder mit
ausgegeben wird."*

**Gebaut:** Effekt `titel`, Menügruppe „Text", Maler (`art:'mal'`) am **Objektiv** — zoomt nicht mit,
liegt über allem, auch über einem Bewegtbild. Weil er die ganze Zeit steht, ist er von selbst
loopfest (Bild N = Bild 0); kein Auftritt, keine Klammer, keine Uhr. Regler: Text (leer = der
Songtitel; `|` bricht die Zeile um), Schrift Grotesk/Serife, Gewicht fett/normal, Größe als Anteil
der Bildhöhe (2–30 %, Vorgabe 8 %), Farbe, Kontur, Schatten, Ort X/Y, Ausrichtung; Verrechnung
frei (Vorgabe „über"). Kontur und Schatten sind Anteile der Schriftgröße, damit Kachel, Bühne und
Export dasselbe zeigen (Studio-Augenschein ist Maßstab). Es ist der erste Effekt mit einem
**Textfeld**; die Kartenrender-Funktion kennt jetzt `text:true`, der Eingabe-Handler nimmt Strings.

**Geprüft:** zwei Nahtfälle (`titel` Vorgabe, `titel-serife-zwei` mit zwei Zeilen, Serife, links,
Screen) beide 0,00; Oberflächenprobe im eigenen Tab: Vorgabe malt den Songtitel fett mittig unten,
Umschalten auf Serife/links/oben/gelb greift live, Tastatur im Textfeld geht nicht an Haus oder
Studio (beide Handler lassen Eingabefelder durch, nachgesehen). Konsole leer.

**Nicht gebaut, bewusst:** Karaoke (Wortmarken als eigene Quelle), Auftritt/Abgang in Schlägen,
mehr Schriften. Steht im Backlog.

**Wiedervorlage 18 (Caspar_D):** den Titel über einem Bewegtbild ansehen (Ken Burns oder Video als
Quelle) und über dunklem wie hellem Grund — reichen Kontur und Schatten in der Vorgabe, oder
braucht er einen Balken?

## 20. Karaoke über dem Bild — gebaut (24.09.2026)

Caspar_D: *„a second karaoke overlay configurator, take the presets from the stage"* — *„ich denke,
die bereinigte Lyrics wäre die beste Variante"* — *„Karaoke macht nur Sinn bei vollem Export, also
10 Sek mit Karaoke geht nicht, es wird der Effekt einfach weggelassen."*

**Gebaut:** Effekt `karaoke`, zweiter Eintrag der Gruppe „Text", Maler am Objektiv wie der Titel.
Quelle ist die **bereinigte Lyrik** (`library/lyrik.json` über `/api/lyrik`): Zeilen mit von/bis,
keine Wortzeiten — darum zeilenweise wie das Band der Bühne und ohne Wort-Wischen. **Die Vorgaben
sind das Band der Bühne** (aus dem CSS von `#bkaraoke` abgelesen): drei Zeilen, die mittlere dran,
5,2 % der Bildbreite fett, die Nachbarn halb so groß und halb so hell, 74 % Zeilenbreite mit
Umbruch, schwarzer Verlauf unten (0 → 0,72 bei 38 % → 0,86), Farben aus der Titelbild-Palette
(Text, Text leise), Zeile n = die letzte mit von ≤ t, harter Schnitt, kein Vorlauf. Regler: Zeilen
(drei oder nur die gesungene), Schrift, Größe, Band, Farbquelle (Palette oder eigene Farben), Ort Y,
Ausrichtung, Vorlauf; Verrechnung frei.

**Wo er malt und wo nicht:** im vollen Export läuft die Songzeit von 0 durch und der Ton liegt
dabei — dort gehört er hin, und der Export wartet vor dem ersten Bild auf die Lyrik
(`lyrikBereit`, wie Hauszeichen und 4D-Rauschen). In Pult und Kachel malt er mit dem Player oder der
freien Uhr. **Unter LOOP>0 (Zehnsekünder, Loop-Ansicht) malt er nichts** — Entscheidung von
Caspar_D. Ohne bereinigte Lyrik (Instrumental, fremder Titel, unter 60 % Deckung, kein Whisper-Lauf)
bleibt die Karte grau mit Grund und malt nichts. Neu dafür: ein Registry-Eintrag darf `hinweis(e)`
tragen, die Karte zeigt den Satz wie den Leuchten-Hinweis. Der Lader folgt dem Muster der
Tiefenkarte (einmal je Titel, Karte berichtigt sich, Netzfehler nach 30 s neu).

**Nachträge zur Gruppe „Text":** Gruppensymbol in `IKON_GRUPPE`; `ortX`/`ortY` stehen jetzt in
`ZUST` (kein Füllbalken auf den Ortsreglern des Titels).

**Prüfstand:** `node bin/effektclip-labor.js lyrik` legt `_lyrik.json` neben `_songs.json` (aus git,
wie diese); die Laborseite beantwortet `/api/lyrik/<id>` daraus, `stand.js` kopiert sie mit,
`haken.js` wartet im Fall auf die Lyrik. Zwei Fälle von Hand in `faelle.json` (`karaoke`,
`karaoke-eine-zeile`), `titel` und `karaoke` in der Typenliste von `faelle-bauen.js` (nicht
gelaufen). Ergebnis: naht/gleich 0,00 (unter LOOP nichts gemalt), Vorschau weicht ab (5,24 / 3,24)
— genau das Gewollte. Oberflächenprobe im eigenen Tab: Vorgabe malt die drei Zeilen von „Stumm" auf
dem Band; eine Zeile/Serife/eigene Farbe/ohne Band/mittig/links/Vorlauf greifen; in der
Loop-Ansicht verschwindet die Zeile; „Murmelnder Bach" (ohne Lyrik) zeigt den Grund. Konsole leer.

**Nicht gebaut, bewusst:** Wort-Wischen (bräuchte Wortzeiten, die die bereinigte Lyrik nicht hat),
Überblenden beim Zeilenwechsel, Auftritt und Abgang. Backlog nachgezogen.

**Wiedervorlage 19 (Caspar_D):** einen ganzen Titel mit Karaoke ausgeben und ansehen — sitzt die
Zeile zum Gesang (Vorlauf 0 wie auf der Bühne, oder braucht der Export etwas Vorlauf), reicht das
Band über hellem Bewegtbild? (Die Doppelung mit dem Bühnenband ist seit §21 vom Tisch.)

**Gegenlesen (vier Linsen, neun Agenten) und was daraus wurde:** (1) Der volle Export lief ohne
Lyrik stumm weiter, und ein Nachzügler-Abruf hätte die Zeile mitten im Video einsetzen lassen —
jetzt wartet `lyrikBereit` (hebt die 30-s-Sperre auf, gibt den Stand zurück), der Export bricht
mit Grund ab, wenn die Lyrik nicht da ist, und friert die Zeilen ins Bündel ein (`DATA.lyrik`).
(2) Die Bühne zieht für ihr Band den Textversatz `bVersatz` ab (Funklautsprecher); der Maler tut
es jetzt auch, wenn die echte Uhr des Players läuft — im Export nicht. (3) `bereitMachen` im
Prüfhaken wartet je Titel auf die Lyrik, sonst hingen `studio`/`massstab`/`loopAnsicht` am
Zeitpunkt der Antwort. (4) `daten()` warnt ohne `lyrik.json` statt abzubrechen. (5) Kleineres:
erste Zeile vor dem Gesang hell wie auf der Bühne, Größe-Raster 0,001 (5,2 % liegt darauf), Notiz
nennt den Bühnendeckel von 72 px, Karte löst den 30-s-Neuversuch selbst aus, kein Kartenneubau
alle 30 s bei Serverausfall, Abrufschranke 20 s, Zeilen werden sortiert, der Hinweis ohne Lyrik
sagt, wo sie entsteht (Morgenlauf „Karaoke-Zeitanker mit Whisper"). Zweitfälle stehen jetzt auch
in `faelle-bauen.js`. Nahtprobe danach unverändert (0,00 / Vorschau 5,24 und 3,24).

## 21. Karaoke auf Karaoke: die Bühne erkennt den Effektclip (24.09.2026)

Caspar_D: *„ihh, da hab ich grade nicht dran gedacht, das Karaoke auf Karaoke laufen kann — mist —
vielleicht sollte die Bühne erkennen, wenn der Effekt an ist"* — *„ich glaub, das ist gut, ja mach das."*

**Gebaut:** Das Studio-Modul gibt eine Auskunft `clipMalt(kasten, typ)`: malt der Effektclip in diesem
Kasten gerade eine aktive Karte dieses Typs (Karte an oder solo, Stärke über 0, bei Karaoke außerdem
die bereinigte Lyrik da). Der Kasten bekommt ein DOM-Ereignis `effektclip` (`da`/`weg`), wenn sein
Clip kommt oder geht. Die Bühne fragt in `karaokeBandStand()` an drei Anlässen (Textebene wechselt,
Ereignis, jeder Takt des Players) und setzt `karaoke-vom-clip` auf `#buehne`: das Band `#bkaraoke`
weicht, die Textebene bleibt „karaoke", der Karaoke-Knopf sagt „Karaoke – vom Effektclip". Gefragt
wird an dem, was die Bühne wirklich malt: beim Standbild oder einem Suno-Video malt der Effekt nicht,
dann bleibt das Band. Kein Schalter.

**Geprüft:** Modulseite im Prüfstand-Tab (Auskunft falsch ohne Clip, wahr mit Karaoke-Karte und
Lyrik, falsch für andere Typen und nach dem Abhängen; Ereignisse kommen an). Bühne im Sandkasten
(Kopie von server/bin/web samt Katalogdateien und einem Song ohne WAV, eigener Port, Ton stumm, danach
gelöscht): Bewegtbild → Effektclip + Textebene Karaoke → Band `display:none`, Klasse gesetzt, Knopf
„vom Effektclip", die Zeilen kommen aus dem Clip; Bildebene Standbild → Band zurück, Knopf „Karaoke";
wieder Bewegtbild → weicht erneut. `stand.js` kennt die neue Rückgabezeile des Moduls (`clipMalt`).

**Wiedervorlage 20 — erledigt (Caspar_D, 25.09.2026: „gut, passt, Text ist bildsynchron").** Die
Zeile aus dem Effektclip sitzt auf der Bühne zum Gesang, ohne Textversatz (§22).

## 22. Zwei Rücknahmen am Karaoke (24.09.2026, abends)

Caspar_D: *„ich würde keinen Zeitversatz einbauen, jedes System ist anders, ich habe nichts von einem
Film, wo die Untertitel nur auf einem System synchron laufen"* und *„das Band, auf dem die Zeilen
laufen, hat einen einseitigen Gradienten, das macht keinen Sinn, wenn ich es nach oben schiebe."*

1. **Kein Textversatz im Effekt.** Der Abzug von `bVersatz` (aus dem Gegenlesen, §20) ist wieder
   raus, die Begründung steht im Maler: ein Effektclip ist ein Film, derselbe auf jedem System; der
   Versatz der Bühne ist die Laufzeit eines Funklautsprechers auf diesem Rechner und gehört nicht
   hinein. Der Vorlauf-Regler bleibt — er ist Gestaltung und liegt im Film.
2. **Das Band hat zwei Seiten, wenn es frei steht.** Am unteren Bildrand ist es das Band der Bühne
   (von oben einlaufend, Kante = Bildrand). Frei im Bild läuft es oben ein und unten aus, je 12 %
   Bildhöhe, dazwischen voll; stößt es oben an, ist es das Bühnenband gespiegelt. Die Lage
   entscheidet, kein Regler. Notiz unter Ort Y sagt es.

Geprüft im eigenen Tab (Ort Y 1, 0,5 und 0,25), Nahtfälle unverändert 0,00.

## 23. Nacht 25.09.2026: Titel und Karaoke näher an der Perfektion (Caspar_D: „bau alles ein")

Grundlage: die Liste nach Kundennutzen vom Abend (16 Punkte, vier Leselinsen), Caspar_Ds Auftrag
*„bau alles ein, du hast die Nacht Zeit, nutze Subagenten, die günstig im Betrieb sind"* und zu
Punkt 4: *„das sollte in der bereinigten Lyrics nicht passieren, ist ja bereinigt um sowas"* — also
an der Quelle, nicht im Maler.

**Gebaut in `web/index.html` (beide Effekte teilen sich neues Handwerk: `textSchrift`,
`textUmbrechen`, `textLaeufe`, `textDreipass`, `schriftenBereit`, `hochformatNotiz`, `titelHinweis`):**

1. **Ruhezustand des Karaoke.** Eine Zeile gilt bis `bis` plus 1,5 s Nachhall oder bis zur nächsten,
   wenn die Lücke unter 3 s liegt. Danach rückt sie leise nach oben, die nächste steht leise als
   Kommende in der Mitte; vor der ersten Zeile ebenso; nach der letzten geht das Band aus. Bei
   „nur die gesungene" steht in Pausen nichts. Die Bühne behält ihr Verhalten (Wiedervorlage 21).
2. **Der Titel passt sich ein.** Umbruch an Wortgrenzen auf 90 % der Breite, höchstens drei Reihen,
   sonst schrumpft die Schrift. Die Größe hängt an der kurzen Bildseite (quer wie bisher, hochkant
   an der Breite). Der Umbruch kennt Bindestriche und, zuletzt, einzelne Zeichen — gilt auch für
   Karaoke-Zeilen; passt der Karaoke-Block nicht zwischen Luft und Ort Y, weicht die Schrift.
3. **Freie Uhr im Haus.** Kachel und Bühne malen die Karaoke-Zeile nur mit echter Uhr (der Titel
   liegt im Player, laufend oder pausiert — ein angehaltener Film steht: `clipZeit` friert bei Pause
   die Songzeit ein statt frei zu laufen). Liegt ein anderer Titel im Player, malt der Effekt keine
   Zeile und das Bühnenband bleibt (`clipMalt` fragt die echte Uhr). Im Pult bleibt die freie Uhr
   als Vorschau; die Karte sagt „Der Player steht …" und zieht beim Uhrwechsel nach.
4. **Regieanweisungen** — an der Quelle in `bin/lyrik.js` (siehe unten) und als Sicherheitsnetz im
   Lader für eine alte `lyrik.json` oder fremde Bestände.
5. **Titel über dem Karaoke.** Wird ein Titel eingehängt, während Karaoke in der Kette steht, kommt
   er nach oben (Ort Y 0,12). Die Titelkarte sagt, wenn er im Band steht. Preset **„Lyric-Video"**:
   ruhige Fahrt, Titel oben aus dem Titelbild gefärbt, gesungene Zeile unten.
6. **Lange Zeilen und Wörter** sprengen das Bild nicht mehr (Punkt 2).
7. **Zehnsekünder und Loop-Ansicht** sagen es: die Karaoke-Karte in der Loop-Ansicht, die Statuszeile
   nach „10 s ausgeben" („ohne Karaoke"), die Kostenzeile vor dem ganzen Titel, wenn die Lyrik
   fehlt („die Ausgabe würde abbrechen").
8. **Sichere Zonen im Hochformat:** Notiz unter Ort Y beider Karten, sobald die Ausgabe hochkant
   ist und der Ort unter 0,78 liegt.
9. **Die gesungene Zeile steht fest:** Anker auf ihrer Mitte, die Nachbarn wachsen nach oben und
   unten, das Band folgt; am Rand wird geklammert.
10. **Ohne Band** bekommt das Karaoke Kontur und Schatten, aus dem Band gerechnet (Band 1 nichts,
    Band 0 die Titelwerte).
11. **Ortsregler ehrlich:** Ort X/Y des Titels setzen den Textkasten (0 = Kante, Unterlängen und
    Kontur eingeschlossen); Ausrichtung meint die Zeilen zueinander. Kontur-Skala endet bei 0,08 em.
12. **Güte der Zeiten auf der Karte** („Whisper hat 96 % der Wörter wiedergefunden · 3 Zeilen nicht
    gesungen, weggelassen"), Rückstellgrund in Nutzerwörtern, eigener Satz für Titel ohne Gesang
    (`DATA.instrumental`, im Haus über `istInstrumental`), Exportabbruch nennt ihn.
13. **Verfahren** — siehe `bin/lyrik.js` unten.
14. **Schrift im Paket:** Inter (Grotesk) und Gelasio (Serife, metrisch wie Georgia), beide OFL, in
    `web/fonts/` (Herkunft und Prüfsummen in `web/fremd/LIZENZEN.md`, die Lizenztexte daneben); `@font-face` im Studio-CSS, das Bühnenband
    in Inter, Laufweite −0,01 em auch auf der Leinwand; Exporte warten auf die Schriften
    (`schriftenBereit`), das Haus holt sie beim Start. Emoji im Titel bekommen nur die Füllung
    (`textLaeufe`). Der Prüfstand verweist auf `web/fonts` (stand.js).
15. **Komfort:** Ort per Klick auf die Bühne (Titel: Kasten, Karaoke: Höhe; Ziehen verschiebt,
    Doppelklick stellt die Vorgabe her — `tiMarke…`, gemalt nur in `rahmen()`), Titelfarbe aus dem
    Titelbild (neue Karten; alte Rezepte bleiben weiß), mehrzeiliges Textfeld (Enter bricht um, `|`
    gilt weiter), Wortwahl („die gesungene mit der davor und danach", „Farbe gesungene Zeile",
    „aus dem Titelbild", „Grotesk (wie Helvetica)").
16. **Schärfere Schrift auf der Bühne:** die Clip-Leinwand der Bühne geht auf 1440 statt 960, wenn
    Titel oder Karaoke in der Kette stehen.

**Geprüft:** Syntax; Nahtfälle `titel`, `titel-serife-zwei`, `karaoke`, `karaoke-eine-zeile` (naht
und gleich 0,00; Vorschau des Karaoke 5,28 bzw. 3,43 — der Einzelzeilen-Fall bekam `jetzt: 51.8`
mitten in einer gesungenen Zeile, im Ruhezustand malte er nichts und träfe nichts). Oberflächenprobe
im eigenen Tab (der Tab war die Nacht über unsichtbar, Bilder mit erzwungenem Malen): langer Titel
mit Emoji bricht dreizeilig um und sitzt oben, Karaoke vor der ersten Zeile leise, gesungen hell,
in der Pause leise mit der Kommenden, ohne Band mit Kontur, Karte nennt Güte, Loop-Hinweis, Titel-
im-Band-Hinweis; Klick auf die Bühne setzt den Ort. Bühne im Sandkasten: ohne echte Zeit bleibt das
Band, mit der Zeit des pausierten eigenen Titels weicht es, Band in Inter, Leinwand 1440.

**Nicht geprüft:** Uhrwechsel-Hinweis im Pult und die Marke auf der Bühne als Bild (beides braucht
den sichtbaren Rahmenlauf), der volle Export mit Paketschrift (kein Vollexport in der Nacht).

**Wiedervorlage 21 — erledigt (Caspar_D, 25.09.: „die Bühne kriegt die gleiche neue Regel", §24).**
**Wiedervorlage 22 (bleibt, Caspar_D, 25.09.: „hab ich jetzt keine Muße für, lass es aber auf
Wiedervorlage"):** einen ganzen Titel mit „Lyric-Video" ausgeben und ansehen — Schrift, Ruhezustand,
fester Anker, Hochformat-Zonen. Dazu weiter offen: die Loop-Abweichungen von früher (Gedächtnis).
**Aufräumen:** `/Volumes/Extreme_SSD/Entwicklung/sandkasten-karaoke/` (~900 MB, Sandkasten der
Bühnenprobe) darf weg — die Sicherung ließ mich den Ordner nicht löschen.

**Verfahren `bin/lyrik.js`, Fassung 2 (Punkte 4 und 13, gebaut von einem Bauagenten im Sandkasten,
gegengelesen und berichtigt):** Regieanweisungen fliegen jetzt vollständig — ganze Zeilen in eckigen
oder runden Klammern (auch mit Klammern darin; die alte Regel scheiterte an „[Post-Chorus Hook
(instrumental)]"), Zeilen mit `#`, Trennlinien, eine Klammer, die nirgends schließt (mehrzeilige
Notiz), und Einschübe wie „[soft]" mitten in der Zeile. Zeitfehler: eine Zeile mit nur einer
entarteten Whisper-Marke (Standzeit unter 0,3 s) bekommt ihre Standzeit aus der Spanne bis zur
nächsten echten Marke, nach Zeichenzahl geteilt mit den geschätzten Nachbarn; zwei Zeilen auf
denselben Marken teilen sich die Spanne. Echte Marken bleiben, wie Whisper sie gemessen hat.
Neue Zähler je Lied: `regie`, `einschuebe`, `zeitAngepasst`, `standzeitGeschaetzt`. Der Agent
hatte runde Klammerzeilen als Begleitstimmen stehen lassen (meine Vorgabe) — dadurch fiel
„Pfeifenwald" von 66 % auf 38 % Deckung; zurückgenommen auf die Regel der Fassung 1.

Ernstlauf am 25.09.2026 um 00:58 (der Weg des Morgenlaufs, `node bin/lyrik.js --tun`, 1,8 s),
Sicherung der alten Fassung im Scratchpad und im Sandkasten `sandkasten-lyrik/library/lyrik.vorher.json`:

| | vorher | nachher |
|---|---|---|
| Lieder gereinigt / zurückgestellt | 243 / 20 | 244 / 19 |
| Zeilen | 17 339 | 17 338 |
| Klammerzeilen im Ergebnis | 13 | 0 |
| Zeilen mit Einschub | 203 | 0 |
| doppelte Startzeiten | 19 | 0 |
| Standzeit unter 0,5 s / unter 0,3 s | 1063 / 491 | 636 / 32 |
| Lieder mit unveränderten Zeilen | | 94 von 243 |

Der Lader im Studio behält ein Sicherheitsnetz für Klammerzeilen und Einschübe (alte `lyrik.json`
bei Casto). `_lyrik.json` des Prüfstands neu, Nahtfälle unverändert. Der Sandkasten
`/Volumes/Extreme_SSD/Entwicklung/sandkasten-lyrik/` darf weg.

**Gegenlesen des Nachtbaus (drei günstige Linsen, acht Agenten) und Folgen:** (1) Die zwei Klammern
des Karaoke-Blocks (oben Luft, unten Ort Y) hoben sich bei einem Block, der selbst bei kleinster
Schrift nicht passt, gegenseitig auf — jetzt geht er nur so weit wieder herunter, wie unten Platz
ist, der Rest ragt oben hinaus, wo das Band den Fall kennt. (2) Die Schrumpfschleifen reichten bei
großer Schrift nicht bis zum Boden (16 × 0,92 bzw. 10 × 0,9) — jetzt 64 bzw. 40 Schritte.
(3) `uhrEcht` setzen auch die Kacheln je Bild; die Karte des Pults las darum manchmal den Stand einer
fremden Kachel — das Pult merkt sich seine Uhr jetzt als `UHR_PULT`. Widerlegt: zwei Funde zu
`bin/lyrik.js` beschrieben den alten Stand. Die Typentabelle in `server/server.js` kannte kein `.woff2` — die Schriften kamen als
`application/octet-stream`, Chrome nahm sie trotzdem. Am Morgen des 25.09. auf Caspar_Ds Wort
(„den Serverstart hättest du machen können") nachgetragen: `.woff2` und `.woff`; der Server startete
sich in einer Sekunde neu (PID 82924), Schrift kommt als `font/woff2`, Startseite antwortet.
Nahtfälle danach: `titel`, `titel-serife-zwei` 0,00/0,00, `karaoke` 5,28, `karaoke-eine-zeile` 3,43.

**Befund beim Gegenlesen im Tab (Konsole):** vier Stellen im Studio riefen `malen()` ohne Argumente —
das ist der Effektmaler `malen(e,cx,t,Wn,Hn)`, nicht das Neuzeichnen der Bühne — und warfen bei
jedem Zug einen TypeError: die Marken der Lampe (`lrMarkeSetzen`, `lrMarkeTiefe`, seit 21.09.),
der Zonen- und der Raumtiefe-Regler der Vorbereitung, und meine neuen Textmarken (nach demselben
Muster gebaut). Der Rahmenlauf malte trotzdem, darum fiel es nie auf. Jetzt gibt es `bildNeu()`
(ein Bild, wenn das Studio bereit ist und kein Export läuft), alle vier rufen es. Der Klick auf die
Bühne setzt den Ort ohne Fehler, Doppelklick stellt die Vorgabe her (im Tab per Ereignis geprüft).

## 24. Morgen 25.09.2026: die Bühne bekommt den Ruhezustand, die Kette entscheidet über und unter dem Text

Caspar_D: *„die Bühne kriegt die gleiche neue Regel"* und *„je nachdem, wo der Karaoke-Effekt in der
Kette liegt, sind Effekte drüber oder drunter, das darf der Nutzer entscheiden, ich könnte mir
vorstellen, dass Konfetti auch mal vor dem Text fallen darf, aber beim Einfügen liegt der Text immer
erstmal an letzter Position der Effektkette."*

**Bühne:** `karaokeTakt(n, t)` läuft in jedem Takt (nicht nur beim Zeilenwechsel) und kennt den
Ruhezustand: eine Zeile gilt bis ihr Ende plus 1,5 s oder bis zur nächsten bei einer Lücke unter
3 s; danach rückt sie leise nach oben, die kommende steht leise in der Mitte (Klasse `kommt`); vor
der ersten Zeile ebenso; nach der letzten leert sich das Band. Zeilen ohne Standzeit bekommen 1,9 s.
Geschrieben wird nur, was sich ändert. Geprüft im Sandkasten auf Sunos Spur v2: vor der ersten
Zeile kommend, mitten im Lied gesungen, nach der letzten leer.

**Studio:** `stufeVon(e)` fragt beim Titel und beim Karaoke die Kette: folgt ein aktiver Szenen-
Effekt (Konfetti, Feuer, Nebel …), rückt der Text in die Szene vor diesen Effekt — er liegt darunter
und fährt mit der Kamera; sonst sitzt er am Objektiv über allem. Neue Karten kommen ohnehin ans
Ende der Kette. Die Karte trägt den Chip „Szene"/„Film" nach der Lage und sagt, unter wem sie liegt
(`textStufeHinweis`). Die Marke auf der Bühne gibt es nur am Objektiv (in der Szene zeigte der Zeiger
auf den gezoomten Ort). Geprüft im Prüfstand-Tab: Karaoke vor Partikel → „Szene" mit Hinweis,
Karaoke am Ende → „Film".

**Nicht gebaut (Caspar_D: „erst Brainstorm, dann Aktion"):** runde Klammern in der bereinigten
Lyrik — Suno entscheidet neuerdings selbst, ob sie Regie oder Echo sind; die Idee ist, Whisper
entscheiden zu lassen: gehört → bleibt, nicht gehört → fliegt. Brainstorm steht im Chat vom
25.09. morgens; Befund dazu: `bin/whisper.js` gibt Whisper den Liedtext (nur ohne eckige
Klammern, erste 800 Zeichen) als Prompt mit — runde Klammern stehen also im Prompt, und Whisper
neigt dazu, Promptwörter zu „hören".

**Zierzeichen (Caspar_D, 25.09.2026: „bin noch nicht überzeugt, ob Zierzeichen in die Karaokebühne
gehören" — „ja, will ich so"):** Sunos Wortspur reicht Emoji und Ziersymbole als Wörter durch (31
Titel, 55 Wörter; 44 von 263 Liedtexten tragen welche). Das Band der Bühne streicht sie jetzt beim
Anzeigen (`ZIER_RE` in `karaokeTakt`; das Gradzeichen bleibt vor C und F), die Lyrics-Ansicht behält
den Rohtext samt Verzierung. In der bereinigten Lyrik fallen sie in Fassung 3 an der Quelle, mit den
Klammern. Der Titel-Effekt behält Emoji — ein Titel ist die Visitenkarte, keine gesungene Zeile.

**Bereinigte Lyrik, Fassung 3 (Caspar_D, 25.09.2026 vormittags):** *„Deckung würde ich immer ohne
eckige und runde Klammern berechnen, das ist dann sicher. Eckige Klammern fliegen dann aber
grundsätzlich raus. Runde Klammern durchlaufen den Whisper-Einsatz. Die Zeichen runde Klammer
fliegen aber dann auch grundsätzlich raus."* Und zu Zierzeichen: *„ja, will ich so."*

Zählung vorab (Bauagent, Sandkasten): 37 Titel mit runden Klammern, 160 Gruppen (101 ganze Zeilen,
59 Einschübe, keine über mehrere Zeilen); 68 davon im Bereich des Whisper-Prompts, 92 danach.
Gehört-Quote mit dem heutigen Abgleich: im Prompt 46 %, danach 57 % — **keine Verzerrung durch den
Prompt** nachweisbar; was zählt, ist die Länge (Zweiwort-Einwürfe werden gehört, Produktionsprosa
nicht). Zierzeichen: 54 Titel, 72 Zeilen mit Zierzeichen und Text, 14 reine Zierzeilen (alle schon
Trennlinien); häufigste Zeichen 🎧 。 🔥 → ★.

Gebaut in `bin/lyrik.js` (Agent, dann gegengelesen): runde Klammern gehen mit in den Abgleich, je
Gruppe gehört (mindestens die Hälfte der Wörter aligniert) → Text bleibt ohne Klammerzeichen,
sonst fällt die Gruppe; Deckung und das Kriterium gesungen/offen rechnen nur mit Wörtern außerhalb
jeder Klammer; Zierzeichen und Emoji fallen vor dem Abgleich (durch ein Leerzeichen ersetzt, sonst
verschmolzen „minor→major"), reine Zierzeilen fallen wie Trennlinien; Zähler `klammerGehoert`,
`klammerGestrichen`, `zier`, `zierZeilen`. Meine Berichtigungen: das Gradzeichen bleibt Text;
eine mehrzeilige eckige Notiz fliegt ganz (vorher rutschten Folgezeilen als Text durch, auch
Suno-Stilangaben über zwei Zeilen); verirrte Klammerzeichen stehen im Ergebnis nie; Zeilen ohne
Klammer bleiben bytegleich. `bin/whisper.js` baut den Prompt ohne runde Klammern (gilt für künftige
Läufe; alte Whisper-Läufe bleiben, die Zählung zeigte keine Verzerrung).

Ernstlauf (der Weg des Morgenlaufs, Sicherung der Fassung 2 im Scratchpad):

| | Fassung 2 | Fassung 3 |
|---|---|---|
| Lieder gereinigt / zurückgestellt | 244 / 19 | 244 / 19 |
| Zeilen | 17 338 | 17 376 |
| Klammergruppen gehört / gestrichen | — | 77 / 44 |
| Zierzeichen entfernt | — | 48 (40 Titel) |
| Pfeifenwald: Deckung, Zeilen | 66 %, 65 | 100 %, 58 |
| Lieder mit unveränderten Zeilen | | 222 von 244 |

Kein `(`, `)`, `[`, `]`, kein Zierzeichen mehr im Ergebnis. `_lyrik.json` des Prüfstands neu.

## 25. Planung: das Studio als eigene Datei (25.09.2026)

Caspar_D: *„bereite alles vor, was nötig ist, um die Planung für die Studio-Herauslösung
abzuschließen."* Ergebnis: `docs/effektclip/KONZEPT-STUDIO-MODUL.md` — Anschlussliste aus dem Code
(acht `typeof`-gesicherte Griffe ins Haus, drei DOM-Verabredungen, sieben CSS-Variablen, sechs
Rückgaben, ein Ereignis), das Verhalten des Moduls beim Laden (nur Browser-Standard; das Stylesheet
muss vor dem Skript stehen wegen `schriftenBereit`), der Ladeweg (`start()` wartet vor der
Moduldefinition; Vorschlag: `<link>` an der Stelle des `<style>`-Endes, `<script src>` ohne `defer`
vor dem Haus-Skript), die Werkzeuge (`stand.js` liest die Datei, `syntax.js` prüft auch `src`,
`aus`/`ein` fallen, Haken bleibt eingespleißt), Server (`.css` heute mit Jahres-Cache — eine Zeile,
mit Ansage), Paket und Windows (nichts zu tun), Hausregel „eine Datei" → „in einem Commit". Fünf
Entscheidungen stehen am Ende des Konzepts. Nichts gebaut.

## 26. Stand am Ende der Sitzung (25.09.2026 vormittags)

Alles ist auf origin/main. Nichts liegt ungesichert, kein Sandkasten steht mehr, kein Prüfserver läuft.

**Dokumente an ihrem Ort** (Caspar_D: „prüfe, ob sie nicht besser Bestandteil schon existenter
Objekte sein sollten"): die Lyrik-Regeln sind ein Abschnitt in `docs/suno/WHISPER.md`, die
Herkunft der Schriften steht in `web/fremd/LIZENZEN.md` (Lizenztexte in `web/fonts/`), das
Modul-Konzept ist im Backlog eingetragen (Zustand Entscheidung). Die zwei Konzepte
`effektclip/KONZEPT-TEXT.md` und `effektclip/KONZEPT-STUDIO-MODUL.md` bleiben im Effektclip-Ordner.

**Was Caspar_D entscheidet oder ansieht:**
- Wiedervorlage 22: ein ganzer Titel mit dem Preset „Lyric-Video", ansehen (§23).
- Die fünf Fragen am Ende von `KONZEPT-STUDIO-MODUL.md` (Go, Anschluss, Server, `aus`/`ein`,
  Reihenfolge).
- Die Loop-Abweichungen von früher (Gedächtnis).
- Runde Klammern, die Whisper anders hört als der Katalog meint: bewusst nicht weiterverfolgt
  („das ist akademisch").

**Noch unterwegs beim Schreiben dieses Abschnitts:** ein Leseagent gleicht die übrigen Unterlagen
(Regeln, LIESMICHs, Backlog, Codekommentare) gegen die Commits seit dem 24.09. ab. Sein Befund wird
in dieser Sitzung noch nachgezogen; steht darunter nichts mehr, ist er ohne Fund geblieben oder die
Sitzung endete vorher — dann beim nächsten Mal `git log --since=2026-09-24` gegen
`docs/effektclip/EFFEKTCLIP-REGELN.md` und `labor/nahtpruefung/LIESMICH.md` lesen.

**Protokoll der laufenden Aufgabe (falls die Kompaktierung zuschlägt):** Ein Leseagent (Sonnet, nur
lesend, gestartet 25.09. gegen 11:45) prüft die Unterlagen gegen `git log --since=2026-09-24
--stat`: `docs/effektclip/EFFEKTCLIP-REGELN.md` (Regel 17e, Befehle `aus/ein/daten` ohne `lyrik`,
Effekt-/Gruppenlisten ohne Titel/Karaoke, Regel für `hinweis(e)`, Regel 19 Größenbezug),
`docs/effektclip/KONZEPT-*.md` (Stufen, Gruppe Text), `labor/nahtpruefung/LIESMICH.md` (`_lyrik.json`,
`fonts`, Haken wartet auf Lyrik, Karaoke-Fälle mit gewollter Vorschau-Abweichung, `jetzt` je Fall),
`labor/effektclip-studio/LIESMICH.md` (`lyrik`-Befehl, `.gitignore`), `docs/LIESMICH.md`,
`START-HIER.md`, README (Nutzerbeschreibung des Studios ohne Titel/Karaoke/Lyric-Video, Morgenlauf
ohne Ersatzzeichen-Heilung und Lyrik-Fassung, Whisper-Prompt ohne runde Klammern),
`docs/haus/HAUSREGELN.md`/`CLAUDE.md` (Widersprüche zu den Bauten), `docs/BACKLOG.md` (erledigte
Punkte, die offen stehen), `web/fremd/LIZENZEN.md`, `bin/gesundheit.js`, sowie Codekommentare, die
jetzt falsch sind („Karaoke (Wortmarken) kommt spaeter", „nur eckige", „istRegie", „Fassung 1/2"
als aktueller Stand, `aus/ein` als Pflichtweg). Erwartet: eine Liste je Datei mit Zeile, Status
(veraltet/fehlt/ok) und dem Satz, der stehen müsste. **Nach der Meldung:** die veralteten und
fehlenden Sätze nachziehen, in einem Commit „Doku nach den Bauten seit 24.09. nachgezogen", pushen.
**Ist die Sitzung vorher weg:** Der Befund liegt in der Sitzungsablage unter `tasks/`, Kennung
beginnt mit `a4e30e7`, letzte Zeile der Datei ist der Bericht — oder die Prüfung von Hand nach
derselben Liste wiederholen; die Übergabe §19–§25 nennt jede Neuerung, die dort erwähnt sein muss.

**Der Leseagent hat gemeldet (25.09., 11:57), alles nachgezogen:** zwei veraltete Sätze im Backlog
(„eine Datei ohne Abhängigkeiten" — seit den Schriften nicht mehr; die bereinigte Lyrik als
„Register" — seit dem Karaoke-Effekt eine sichtbare Spur), und sieben fehlende Erwähnungen:
Befehl `lyrik` in EFFEKTCLIP-REGELN, beiden Labor-LIESMICHs und im Kopf von `effektclip-labor.js`;
eine Regel für `hinweis(e)` bei Regel 11; der Größenbezug der Texteffekte bei Regel 19; Titel und
Karaoke in der Objektiv-Liste von KONZEPT-DIORAMA; `stand.js`/`haken.js`/`faelle.json` in der
Nahtprüfungs-LIESMICH (`_lyrik.json`, `fonts`, `lyrikBereit`, `jetzt`, gewollte
Vorschau-Abweichung). Alles andere war schon auf Stand. Zur Kenntnis: „Karaoke" heißt im Haus zwei
Dinge — die Textebene der Bühne und der Effekt im Studio.

**Laufende Aufgabe (25.09., Mittag) — Recherche, kein Bau:** Caspar_D fragt (a) nach Texturen für
den Titeltext, „die nicht billig aussehen", möglichst als Sammlung unter MIT oder kompatibler Lizenz,
und (b) nach Auftritten: der Titel soll einfahren/erscheinen und die Bühne wieder verlassen (Backlog
„Auftritt und Abgang", bisher bewusst nicht gebaut). Zwei Workflow-Läufe sichten das (Kennungen
`wf_db9f7a4f` Texturen: Foto-Sammlungen CC0, Vektormuster, prozedural aus dem Hausrauschen,
Farbschriften/Bibliotheken, Haus-Anschluss in textDreipass; `wf_098fbfec` Auftritte:
Gestaltungskanon, Bibliotheken/Easing mit Lizenzprüfung, Haus-Anschluss mit Klammer/Schlagraster/
Loop-Urteil). Jeder Lizenzanspruch wird von einem eigenen Prüfer an der Lizenzseite gegengelesen.
Ergebnis geht als Befund an Caspar_D; gebaut wird nichts ohne sein Wort. **Ist die Sitzung vorher
weg:** Journale unter `subagents/workflows/wf_db9f7a4f-*/` und `wf_098fbfec-*/` in der Sitzungsablage
(journal.jsonl trägt die Rückgaben), sonst die Frage neu stellen.
Caspar_D dazu (25.09., Mittag): „Das würde aber wie bei Karaoke nur für den Ganztitel-Export
taugen, beim 10-Sekunden-Snippet würde das ja alle 10 Sekunden wieder passieren." Folge für die
Planung: Auftritt/Abgang wie Karaoke nur im vollen Export (einmal: kommen, stehen, gehen vor der
ersten Gesangszeile); im Zehnsekünder steht der Titel wie heute, loopfest; die Karte sagt es per
hinweis(e). Die Klammer aus dem Backlog-Punkt entfällt damit.
**Befund der beiden Läufe (25.09., 13:45; 28 Agenten, jede Lizenz an der Lizenzseite gegengelesen):**
*Texturen.* MIT-lizenzierte Bildsammlungen gibt es praktisch nicht; das passende Maß ist CC0.
Geprüft kompatibel (Weitergabe im ZIP, kommerziell, ohne Nennung): ambientCG, Poly Haven (API),
cgbookcase (Brushed Gold 01/02, Brushed Metal Tiles), texturecan (Marmor), 3dtextures.me (nur die
freie 1024er Stufe). Nicht kompatibel trotz „free": sharetextures, textures.com, Pixabay/Unsplash/
Pexels (kein Weitervertrieb der Datei), freepbr (nichtkommerziell), Lost and Taken, texturelabs,
fffuel (Weitergabe verboten), Subtle Patterns (CC BY-SA), Transparent Textures (ungeklärt), Book of
Shaders (restriktive Eigenlizenz), LYGIA (Prosperity), Shadertoy (BY-NC-SA). Vektor: textures.js
(MIT, Schraffuren), Pattern Monster (nur Muster aus dem MIT-Repo), Hero Patterns (CC BY, Nennung).
Farbschriften (Nabla u. a., OFL): COLRv1 in fillText unsicher, Safari ohne COLRv1, Palette nicht
koppelbar — kein Weg. Matcap-Sammlungen: Bilder ohne Lizenz — tabu. Kernbefund aller Blickwinkel:
Gold/Chrom/Metall wirken aus Fotos meist billiger als aus 4–6 kalibrierten Verlaufsstopps plus
leisem Korn; Marmor/Schiefer/Papier/Leder taugen als Foto. Das Haus hat die Bausteine (rauschen(),
Korn-Kachel mit EINHEIT, Simplex 3D/4D Ashima MIT, Verläufe). Anknüpfung: dritter Pass in
textDreipass (fillStyle=farbe) — Pattern/Verlauf an der Textbox verankert (setTransform wie Korn),
Kontur/Schatten bleiben. Risiken: Pattern auf fillText in Safari ungeprüft; Maßstab mit EINHEIT
(Regel 19); „Gold" muss Gold sein (Regel 11); ein Glanzlauf müsste loopfest (lpR/lpP). Bytes: eine
1K-Kachel 100–500 KB (Inter je ~113 KB); prozedural 0.
*Auftritte.* Kanon: edel = Unschärfe-zu-scharf, Laufweite (Tracking-in), Vorhang/Wischen, Schnitt
auf den Schlag, weicher Einzug von unten (unter 5 % Bildhöhe); neutral = Einblenden, Skalierung
3–8 %, Zeichenkaskade; billig = Glimmen, Schreibmaschine, Fallen/Springen, Glitch, 3D-Klappen.
Regeln: eine Bewegung je Auftritt; Einsatz ease-out, Abgang ease-in und kürzer; nichts
überschwingt; Leserichtung; der Titel geht vor der ersten Gesangszeile (LYRIK[id][0].von).
Timing in Schlägen: Einsatz 1 Schlag, Abgang 1 Schlag, Stand in ganzen Takten — kein Dauer-,
kein Kurvenregler; das Haus hat eine Weichkurve (Smootherstep bei schleifePendelWeg).
Bibliotheken: keine nötig; Easing selbst oder Penner (MIT/BSD) bzw. bezier-easing (MIT) mit
Vermerk. Nicht MIT: GSAP (Webflow-Lizenz), Animate.css (Hippocratic), easings.net (GPLv3, nur
nachschlagen), Theatre.js Studio (AGPL). Haus: der Titel-Zweig liest heute kein t; clipZeit/
uhrEcht liefern die Songzeit; nur Vollexport (Caspar_D) → kein Loop-Urteil nötig; die
Beschriftung „steht die ganze Zeit … loopfest" braucht den Zusatz; Kachel und Bühne zeigen den
stehenden Zustand. Unschärfe (ctx.filter) kostet je Bild, im Export zu messen.
Caspar_D zum Texturbefund (25.09., 14:05): „der Schrifttextur-Kram ist eher ernüchternd, wenn,
dann einige vorgefertigte Struktureffekte, denen man noch eine oder x Farben draufpackt.
Kombinatorisch entsteht dann Vielfalt, ohne dass der Nutzer unästhetische Parametersets bauen
kann." Gezeigt: Skizze Struktur × Farbe (Glatt, Metall, Stein, Papier, Schraffur × Gold-,
Silber-, Titelbild-Ton). Lesart: die Struktur trägt das Licht (Rampe, Korn, Kontrast,
Lichtrichtung fest im Haus), die Farbe den Ton; Gold = Metall + warmer Ton. Dazu seine Idee:
liegt ein Partikel-Effekt in der Kette, könnte sich der Titel aus den Partikeln zusammenballen
und wieder auflösen. Einschätzung: Titel malt eigene Teilchen mit derselben Malroutine, Ziele aus
der abgetasteten Schriftmaske, Füllung blendet mit der Ankunftsdichte ein, Abgang in Windrichtung;
nur bei Asche/Staub/Funken/Glitzer/Schnee/Pusteblume/Glühwürmchen; Dauer in Takten; nur
Ganztitel-Export. Beides Brainstorm, kein Auftrag.

## 27. Nachmittag 25.09.2026: Struktur × Farbe für den Titel (Caspar_D: „ich denke, das passt so, mach")

**Gebaut (web/index.html):** Regler „Struktur" am Titel (glatt, Metall, Stein, Papier, Schraffur)
mit Notiz je Wahl; die Beschriftung sagt es (Regel 11). `textDreipass` nimmt einen zehnten Parameter
`st`; die Füllung kommt dann aus `textStrukturKachel(art, farbe, gr)`: Kachel 4 em × 1,24 em in
Bildpunkten der Ausgabe, in x periodisch (Rauschgitter mit ganzer Zellenzahl, Schraffur mit 40
Perioden), Ganzzahl-Hash (`stHash`/`stWert`/`stFbm`), gemerkt je (Struktur, Farbe, Größe), höchstens
24; als `createPattern` mit `setTransform` am Zeilenrand und 0,62 em über der Mittellinie verankert
(textBaseline middle). Kontur und Schatten unberührt. Karaoke ohne Struktur.
**Lehre aus der Probe:** das Licht rechnete zuerst in HSL — eine blasse Palettenfarbe (254,238,231)
wurde beim Abdunkeln lachsrot. Jetzt RGB: Abdunkeln multipliziert, Aufhellen mischt nach Weiß; auf
heller Farbe (Luminanz > 0,7) sind Adern und Striche dunkler, auf dunkler heller. Die Schraffur war
mit 26 Perioden und hartem Kontrast eine Zuckerstange — jetzt 40 Perioden, wenig Kontrast.
**Prüfstand:** vier neue Fälle `titel-struktur-metall|stein|papier|schraffur` in faelle-bauen.js und
faelle.json (von Hand, 252 Fälle). Naht 0,00 überall, Vorschau 0,00 (deterministisch, loopfest);
`--massstab`: Block 9,3 / 15,5 / 11,0 / 16,6 gegen 13,7 beim glatten Titel und 9,3 Boden.
**Probe:** der Labor-Server auf 18811 (PID 99885, seit 14 Tagen) antwortet nicht mehr — curl hängt;
nicht angefasst, gehört Jörg. Eigener Server auf 127.0.0.1:18812 (python http.server, PID in
Scratchpad `struktur/server-18812.pid`), Tab im eigenen Browser; Bilder in Exportgröße über
`naht.mjs --lange 1080 --bilder`, Ausschnitte an Caspar_D geschickt.
**Offen:** voller Lauf aller 252 Fälle (rund 13 min, braucht seinen Startschuss); sein Urteil zu
den vier Bildern. **Danach:** Schritt 2 stiller Auftritt (nur Ganztitel-Export, Skizze zuerst),
Schritt 3 Zusammenballen aus Partikeln.

## 28. Nachmittag 25.09.2026: Auftritt und Abgang des Titels (Schritt 2)

**Gebaut:** Regler „Auftritt" (keiner, erscheinen, aufsteigen, scharfstellen, Laufweite, Vorhang)
mit Notiz (nennt die Abgangszeit dieses Titels, wenn die Lyrik da ist); Beschriftung ergänzt;
Hinweis unter LOOP>0 („Im Zehnsekünder steht der Titel"). Handwerk vor der Strukturkachel:
`titelAuftritt`, `taktSchlaege` (Schläge zwischen Einsen, Median, sonst 4), `titelAuftrittZeiten`
(ein1 = ein Schlag; ab1 = erste Zeile − Schlag, frühestens Schlag + 2 Takte, sonst Schlag + 4 Takte;
ab0 = ab1 − ¾ Schlag), `titelAuftrittLage` (null = steht, weg = fort; unter LOOP>0 und in der
Kachel ohne echte Uhr immer null; freie Uhr im Pult: t modulo ab1 + Schlag). Im Maler: Deckkraft,
dy (½ em herein, ⅓ em hinaus), `cx.filter` blur bis ¼ em, `cx.letterSpacing` bis ¼ em (mit
Neumessung der Zeilenbreite), Vorhang als Clip aus der Mitte. `lyrikBereit` wartet auch für den
Titel mit Auftritt, gibt für ihn aber immer 'ohne' zurück (kein Abbruch ohne Lyrik).
**Prüfstand:** Fall `titel-auftritt-aufsteigen` (Titel a, jetzt 26,13: Vorschau in der Clipmitte
bei 29,7 s liegt im Abgang, Loop-Export steht) → Naht 0,00, Vorschau 1,02 gewollt; 253 Fälle.
Gelernt: die Vorschau des Prüfstands liegt bei t0 + Clipmitte, nicht bei jetzt; t0 rastet auf
eine Eins (26,13 → 25,94).
**Labor (18812, eigener Tab):** mit `window.aktuellId` und `window.audio={paused:false,
currentTime:t}` wie der Haken, Malen per Reglerereignis erzwungen: 0,12 s blass und tiefer
(aufsteigen), 0,25 s fast da, 39,7 s steht, 40,2 s fort (erste Zeile 40,4 s); scharfstellen,
Laufweite und Vorhang sichtbar. Der Tab bleibt versteckt (rAF steht), darum diese Methode.
**Offen:** Caspar_D's Auge auf den Auftritt (kein Bild geschickt, nur Beschreibung — ein
Probevideo bräuchte den vollen Export), voller Lauf aller Fälle; danach Schritt 3.

## 29. Nachmittag 25.09.2026: der Titel aus den Partikeln (Schritt 3)

**Gebaut:** sechste Wahl des Auftritts „aus den Partikeln". `titelPartikelQuelle` (erster aktiver
Partikel-Effekt mit Asche, Staub, Funken, Glitzer, Schnee, Pusteblume, Glühwürmchen), `titelZiele`
(Schrift einmal abgetastet, Raster 0,09 em, bei mehr als 4000 Punkten gröber; gemerkt in
`e._tz`/`e._tzKey`), `titelGlyph` (eigene Glyphen je Art nach dem Muster des Partikel-Malers:
Kreis, Aschekorn, Staubkorn mit Helligkeitsstreuung, Pusteblumenfächer, Glitzer-Vierstrahl,
Glut mit Hof für Funken und Glühwürmchen), `titelTeilchen` (Ballen: Start von der Stromseite der
Art, ¼ bis 1 Bildhöhe entfernt, Ankunft gestreut 55–100 %, Bogen quer, weich aus; Auflösen: Start
gestreut 0–25 %, Drift mit Wind und Auftrieb, verblassen; alles aus t und Hash je Teilchen; Screen).
Zeiten: `titelAuftrittZeiten(e)` mit zwei Takten hin und zurück für diese Wahl. Füllung
übernimmt im letzten Drittel des Ballens, geht im ersten Drittel des Auflösens. Ohne
Partikel-Effekt: Titel steht, Karte sagt es (`auftrittHinweis`).
**Prüfstand:** Fall `titel-auftritt-partikel` (Asche + Titel, Titel a, jetzt 24,5: Vorschau im
Auflösen) → Naht 0,63 = erwartet (die Asche), Vorschau 1,59 gewollt; 254 Fälle.
**Labor (18812, Fake-Uhr):** 0,8 s erste Teilchen, 1,8 s Silhouette aus Punkten, 2,8 s Füllung
kommt, 3,3 s steht; 37,3 s löst sich, 38,6 s fast fort (Song 6, Takt 1,68 s, erste Zeile 40,4 s).
Der Partikel-Maler selbst blieb unangetastet (kein Umbau, keine neue Grundlinie nötig).
**Offen (Wiedervorlage):** Caspar_D's Auge auf Ballen und Auflösen im echten Export; voller Lauf
aller 254 Fälle (Startschuss). Sein 18811-Server hängt seit heute (PID 99885) — nicht angefasst.
**Stand 25.09., später Nachmittag:** alles gepusht — 703987f/b51a426 (Struktur × Farbe), 4798312
(Auftritt und Abgang), 819a7c3 (aus den Partikeln). Vier Struktur-Ausschnitte in Exportgröße hat
Caspar_D bekommen; Auftritt und Partikel hat er noch nicht gesehen (Wiedervorlage: ganzen Titel
mit Auftritt ausgeben). Der volle Lauf aller 254 Fälle steht aus (rund 13 min, Startschuss nötig).
Eigener Labor-Server 127.0.0.1:18812 läuft noch (PID in Scratchpad struktur/server-18812.pid);
Jörgs 18811 (PID 99885) hängt — nicht angefasst.

## 30. Nachmittag 25.09.2026: Vorschau sofort, Beispielvideos, Sandkasten

Caspar_D: „wenn ich einen Effekt einschalte, muss sofort eine Vorschau loslaufen, dass ich erst
ein Video exportieren muss, geht so nicht." Vorher zeigte der Auftritt im Pult mit freier Uhr die
echten Zeiten (Abgang bei 30 s → minutenlang stehender Titel). Jetzt: Vorschauzyklus in
`titelAuftrittLage` (nur ohne laufenden Player und außerhalb des Exports): beginnt beim Einschalten
der Karte, beim Umstellen der Wahl und nach jeder Lücke > 0,5 s von vorn — Auftritt, zwei Takte
stehen, Abgang, ein Schlag weg; Uhr in `e._auT0`/`e._auArt`/`e._auLetzt` (Unterstrich, kein
Rezeptfeld). Konzept Regel 12 ergänzt; die zwei Prüffälle treffen weiter (1,02 / 1,59).
**Labor-Server:** Caspar_D: „du kannst den Laborserver neu starten bzw. abschalten, je nachdem,
was du brauchst." Der hängende 18811 (PID 99885) wurde beendet und neu gestartet (python
http.server, PID in Scratchpad struktur/server-18811.pid); 18812 wieder aus.
**Beispielvideos (Caspar_D: „kannst du Beispielvideos exportieren nach Downloads"):** Sandkasten
`/Volumes/Extreme_SSD/Entwicklung/sandkasten-titel/` nach dem Muster vom 24.09. (rsync server/ bin/
web/ node_modules, library/*.json|gz|ndjson kopiert, Songs 535121bb Universe 25 english und
fff934d4 Hoch auf dem Lebenswagen nur mp3/cover/kachel/titelbild/tiefe, keine Symlinks), Server
`node …/server/server.js --port 8790` (PID in struktur/sandkasten-8790.pid), eigener Tab, Ton
stumm. Der volle Export schreibt nach `.ausgabe/<lauf>/` und wird von dort nach ~/Downloads
kopiert. Danach Sandkasten löschen (rm -rf, nie aus dem Verzeichnis heraus).
**Ergebnis (15:25):** zwei Beispielvideos in ~/Downloads — „Universe 25 english — Beispiel 1, Titel
Metall, Auftritt aufsteigen.mp4" (Preset Lyric-Video, 4:14, 734×1080, 120 MB, mit Ton, gerechnet
in 2 min) und „Hoch auf dem Lebenswagen — Beispiel 2, Titel Stein, aus den Partikeln (Asche).mp4"
(Ken Burns, Partikel Asche, Titel, Karaoke; 5:04, 838×1080, 162 MB, mit Ton, gut 2 min). Der
Sandkasten ist gelöscht, der 8790-Server beendet, das echte `library/` seit 15:12:47 unverändert
(find -newermt: 0). Hinweis: die Systemplatte steht bei 97 % — die Videos liegen auf Wunsch in
Downloads, nach dem Ansehen wegräumen. **Wiedervorlage:** Caspar_D's Urteil zu beiden Videos
(Metall-Rampe, Aufsteigen, Stein, Ballen und Auflösen, die Zeiten vor der ersten Zeile); voller
Prüflauf aller 254 Fälle (Startschuss).
Caspar_D (15:30): „kann ich erstmal schauen, ich denke, wir verschieben den Testlauf." — Der volle
Prüflauf (254 Fälle) ist verschoben, bis er die Videos gesehen hat; nicht von selbst starten.

## 31. Nachmittag 25.09.2026: Durchschuss (Caspar_D nach den Videos)

„Der Zeilenabstand ist zu groß, je größer der Text, desto mehr fällt das auf" — „der Durchschuss
ist riesig" — „der Durchschuss ist zu definieren, und der sollte immer gleich sein, 5 px sollten
reichen." Vorher: Titel 1,15 em, Karaoke 1,25 em Mitte zu Mitte (bei Zeilen ohne Unterlängen
klaffte fast eine halbe em). Jetzt: `DURCHSCHUSS = 5*EINHEIT` (5 Studio-Bildpunkte, Regel 19)
zwischen der Tinte zweier Zeilen, gemessen mit `actualBoundingBoxAscent/Descent` zur Mittellinie
(Ersatz: halbe em-Kästen). Titel: `mess`/`ys`/`boxH` hüllen die Tinte, `titelZiele` bekommt `ys`.
Karaoke: je Block `mess`/`ys`/`h`, Anker `yU − grK − luecke − gr/2` (em-Kästen je eine Reihe),
Blocklücke 0,06 em bleibt. Ein Zwischenstand (0,14 em, Karaoke 1,08 em) ist überholt und nie
gepusht worden. Konzept: Entscheidung und Regel 10a. Prüfstand: Titel-Fälle Naht 0, Karaoke
Vorschau-Werte ändern sich (gewollt, andere Lage der Reihen).
Nachtrag: „ich hoffe, wir reden bei Zeilenabstand von der gleichen Lücke — Unterlänge zu Oberlänge
der folgenden Zeile meinte ich." Die Tinte der jeweiligen Zeile war falsch (Zeilen ohne Unterlängen
rückten zu dicht). Jetzt `textLaengen(cx,gr)`: Ober- und Unterlänge der Schrift an „hdkl"/„gpqy"
gemessen, gleich für alle Zeilen einer Größe; Lücke 5·EINHEIT dazwischen.
Weiter (Caspar_D, 16 Uhr): „immer noch zu groß, mach mal 3 statt 5, erst zeigen" — dann „eigentlich
reicht mir der Abstand i zum i-Punkt" — „keine Exporte, Screenshot reicht" — „bei Karaoke müssen die
Abstände zwischen zusammengehörigen Zeilen kleiner sein (bei Umbrüchen) als bei Einzelzeilen, die im
Vers vorkommen" — „Edward Tufte Lehre". Gebaut: `textIPunkt(fam,gew)` malt einmal je Schrift ein
großes i, tastet zeilenweise ab (Punkt, Lücke, Stamm) und merkt die Lücke in em (nur wenn die
Schrift geladen ist, `document.fonts.check`); Titel: `DURCHSCHUSS = textIPunkt(fam,gew)*gr`;
Karaoke: `IPUNKT*size` innerhalb eines Blocks, `luecke = IPUNKT*gr*3` zwischen den Blöcken (vorher
0,06 em). Gezeigt: zwei Titel-Ausschnitte (1080) und der Bandausschnitt aus der Laborleinwand
(Leinwand per toDataURL → Datei). **Ungesichert, bis Caspar_D sein Wort gibt** („erst zeigen"):
web/index.html, KONZEPT-TEXT (Entscheidung, Regel 10a), diese Zeilen. Konzept-Regel 10a und die
Entscheidung tragen den i-Punkt und Tufte.
Caspar_D (26.09., nach Mitternacht): „alle Beispiele enthalten keine Unterlängen, sodass man
schwerlich beurteilen kann, ob es wirklich die i-Punkt-Lücke ist, aber es sieht nach Augenschein
gut aus — lassen wir so. Kannst einchecken und pushen." Gesichert. Wiedervorlage bei Gelegenheit:
ein Titel mit Unterlängen in der oberen Zeile (g, p, y) ansehen.

## 32. 26.09.2026: Effektclip stottert bei angehaltenem Player (Auftakt, Videoquelle)

Caspar_D: „kannst du dir mal im KlangTresor den Effektclip von Auftakt anschauen, in der Totalansicht
spielt der nicht, sondern stottert immer auf der ersten Drittelsekunde" — „du darfst das Fenster
anfassen, wenn du musst" — später „hast du was geändert, jetzt geht es." Befund in der eigenen
Scheibe auf 8788 (stumm): Auftakt hat die Bewegtbild-Quelle (artwork.mp4, 10 s, 24 fps), zwei
Titel mit „scharfstellen", Karaoke, drei Lichteffekte. Auf der Bühne (Bewegtbild „Effektclip",
Leinwand 1073×1440) bei angehaltenem Player (t > 0): das Video lief weiter und wurde von
`quelleSync` bei Drift > 0,2 s auf die stehende Songzeit zurückgeholt — 26 Rücksprünge in 3 s,
8,89 → 9,07 → 8,83. Beim Abspielen glatt (deshalb „jetzt geht es"). Ursache: seit „ein
angehaltener Film steht" (Nacht 25.09., `clipZeit` hält bei Pause die Songzeit) fehlte dieselbe
Regel für die Videoquelle. Fix in `quelleSync`: hält der Player diesen Titel (uhrEcht und
audio.paused), wird das Video pausiert und einmal auf die Songzeit gesetzt; sonst wie bisher.
Nachweis in der Scheibe nach Reload: siehe unten. Prüfstand ohne Videofälle: titel/partikel/
kenburns unverändert. Die Bühne zeigt den Clip über `bBewegtWahl='clip'` + `bildSetzen('video')`;
das Videoelement der Quelle liegt außerhalb des DOM (Griff über einen Getter-Haken auf
HTMLMediaElement.prototype.currentTime).
Nachweis nach Reload der eigenen Scheibe: Player angehalten bei 32,6 s → Video steht bei 2,47 s,
null Rücksprünge in drei Sekunden; Play → Video läuft weiter (ein Nachsetzen). Caspar_D: „gut, wenn
du es auch gesehen hast und eine Ursache gefunden hast, dann bin ich erleichtert, ich dachte, ich
spinne oder es ist nicht exakt reproduzierbar." Reproduktion: Clip mit Bewegtbild-Quelle sichtbar
(Bühne, Karte) und der Player hält den Titel abseits von 0 an.

## 33. Auftrag für den 27.09.2026: das Studio wird eine Datei (Caspar_D unterwegs)

Caspar_D (26.09.): „Das Herauslösen des Studios würde ich dir gern morgen übertragen, da bin ich
nämlich unterwegs und du hättest den ganzen Tag Zeit, allein voranzukommen." — „mir ist die Version
mit dem geänderten Server lieber, der Server ist noch nie gestorben, wenn du daran was gemacht hast;
wenn nicht, dann ist es eben nicht fertig, wenn ich wiederkomme. Arbeite auf jeden Fall
tokeneffizient." Titel mit Unterlängen angesehen: „ist gut so" (Wiedervorlage erledigt).
**Entschieden (KONZEPT-STUDIO-MODUL §7):** 1 Go für Schritt 1–3; 2 Anschluss bleibt bei den acht
typeof-Griffen, als Vertrag „Hausanschluss" im Dateikopf; 3 Server: `text/css` ohne Jahres-Cache,
Eingriff erlaubt (atomar schreiben, neue PID und curl prüfen, in die Übergabe); 4 `aus`/`ein`
fallen, Laborseite lädt die echte Datei; 5 Reihenfolge danach offen.
**Plan:** voller Prüflauf als Grundlinie (254 Fälle, `--aus`), Umbau nach §6 Schritt 1–4 in einem
Commit (js, css, index.html, Werkzeuge, Docs), Server-Zeile mit Neustart-Prüfung, voller Lauf
danach (bitgleich = Abnahme), Paket bauen und im Sandkasten starten, alles in die Übergabe.
Tokeneffizient: keine Agentenflotten, keine langen Ausgaben, Proben über Prüfstand und eigene
Scheibe. Was Caspar_D's Auge braucht, bleibt liegen: Lyric-Video-Vollexport, Loop-Abweichungen,
Abnahme des Umbaus im echten Fenster.
Caspar_D: „ja, und den Grundlinien- und bitgleichen Endstand kannst du dann natürlich machen, ohne
den geht's ja nicht." — Beide vollen Läufe (je rund 13 min) sind für den 27.09. freigegeben.

## 34. Brainstorm 26.09.2026: Karussell, Ausgaben, Szenen — kein Auftrag

Caspar_D will „sehr, sehr gern den unteren Teil im Bedienungskarussell des Effektclip-Studios
überarbeiten, eher wieder registermäßig", und denkt laut: vier Ausgaben (Effektclip im Haus mit
voller Taktsynchro in Überblick und Bühne; 10-s-Snippet für Suno, Takt fällt früher oder später;
Hook-Export für Suno mit zwei Zeitmarken, Anfang und Ende, taktsynchron; ganzer Titel für YouTube
u. a.); die Tiefe aus der Vorbereitung als eigener Karusselleintrag; offen, ob verschiedene Medien
verschiedene Ketten bekommen, ob lange Stücke zeitabhängigen Effekteinsatz und dynamische Parameter
brauchen („variabler Schneefall, Schnee wird zu Regen, die Farbe des Regens von weiß zu blutrot,
immer wie es zum Song passt"); er schaue dem Studio „eher passiv beim Wachsen zu", es brauche
Leitplanken gegen Wildwuchs. Gezeigt: zwei Skizzen (Karussell Quelle/Tiefe/Vorbereitung/Kette/
Ausgabe mit Registern Haus/Snippet/Hook/ganzer Titel; Zeitachse Song-Abschnitte → Szenen →
Übergänge → Ausgaben als Fenster). Vorschlag Claude: ein Rezept, Szenen je Abschnitt statt
Kurven, Zeit aus dem Song (Abschnitte, Eins), Ausgaben als Fenster auf eine Zeitachse, Hook-Marken
rasten auf die Eins. Nichts beschlossen, nichts gebaut.
Caspar_D weiter: „Szenen pro Abschnitt definieren ist sehr vernünftig und sie am Szenen-Wechsel
ineinander blenden lassen; dann müssen wir aber auch Videos oder Standbilder für Abschnitte
definieren können, die Quellen müssen auf n Elemente erweitert werden, mehrere Fotos und
Videoschnipsel. Dann ist das Gesamtvideo also eine Erweiterung des Hooks — aber selbst Hooks können
schon aus mehreren Szenen bestehen, nur eben weniger." Folge (Claude, Brainstorm): Szene = Abschnitt
+ Quelle + Kettenstand; Quelle wird ein Vorrat je Titel (Fotos, Videoschnipsel, mit je eigener
Tiefe — die Tiefe hängt am Vorratsstück); Hook und ganzer Titel sind Fenster auf dieselben Szenen;
ein Rezept ohne Szenen ist eine Szene über den ganzen Song (Altrezepte bleiben gültig); Wege für
neue Medien nur durch die App (Upload, Tiefe im Morgenlauf). Kein Auftrag.
Caspar_D legt fest (Brainstorm, noch kein Bauauftrag): „Wir arbeiten abschnittsweise. Der Song ist
erstmal ein Abschnitt. Wie bei den Tiefenabschnitten in der Tiefenkarte können automatisch Grenzen
eingefügt werden; der Standard wäre durch die Whisper-Spracherkennung und die Suno-Abschnittsgrenzen
eine Abschnittswahrheit, die Intro, Outro, Strophen, Chorusse etc. abbildet. Jeder Abschnitt bekommt
etwas, was z. Z. in einem Effektclip abgebildet wird. Eigentlich ist jeder Song dann eine
Aneinanderreihung von Effektclips im heutigen Sinne." Folgen: der Effektclip von heute wird die
Einheit je Abschnitt (Quelle, Vorbereitung, Kette, Schleife bleiben sein Rezept); der Titel trägt
eine Abschnittsliste mit Grenzen (automatisch aus Suno-Regiezeilen und Whisper-Zeiten, im
Morgenlauf wie die Tiefenkarte; Klick setzt, Doppelklick entfernt, Ziehen verschiebt) und je
Abschnitt einen Effektclip; ein Titel ohne Grenzen = ein Abschnitt = heute (Altrezepte gültig);
Übergänge blenden am Abschnittswechsel. Vorhanden: DATA.abschnitte im Katalog, Regiezeilen in
bin/lyrik.js, Zonen-Grenzen-Bedienung der Tiefe als Muster. Braucht ein Konzeptblatt vor dem Bau.
