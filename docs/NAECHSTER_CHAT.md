# Für den nächsten Chat — Stand 27.08.2026

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

ZUERST LESEN: docs/OFFEN.md (was falsch ist und was entschieden werden
muss), dann docs/HAUSREGELN.md, dann docs/TONSTUDIO.md — und fürs
Einmessen docs/EINMESSEN.md.

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
`bin/token.js`, `geheim/` (in .gitignore) und `bin/paket.js` bleiben
liegen. Caspar_D: „ich hab keinen Bock mehr, wir nehmen das Lesezeichen."

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
die Person zeigt „folgt dir seit". Eine Liste *aller* Follower fehlt
noch — gehört ins Profil-Fenster (`profilAuf()`), nicht ins Song-Fenster.

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

**6 · Suchfeld: Lyrics.** Der Platzhalter versprach sie von Anfang an,
durchsucht werden nur Titel und Stil. Die Lyrics stehen nicht in der
schlanken Liste — entweder `/api/index` um ein `lyricsKurz` erweitern
oder die Suche serverseitig machen.

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
Platte. `bin/token.js`, `geheim/` und `bin/paket.js` bleiben liegen,
falls Clerk das Cookie eines Tages hergibt.

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

**Offen vor dem Push:** die **LICENSE-Datei**. Sie muß zur Zusage im
README passen — „offen zum Ansehen, Verwendung nur mit Zustimmung" ist
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
  [SUNO-API.md](SUNO-API.md).
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
- **Hub-Vergleich**: [VERGLEICH-HUB.md](VERGLEICH-HUB.md), Funktion für
  Funktion mit „haben wir / besser / verworfen". Ergebnis: Tempo und
  Tonart sind dort schwächer als hier, die echte Lücke ist **Harmonie**.
- **61 veraltete Stimmlagen** korrigiert.
- **Zusammenarbeit**: Tarja (`myinqi`) schreibt mit,
  [ZUSAMMENARBEIT.md](ZUSAMMENARBEIT.md) samt `bin/fremdstand.js`.

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
  daraus wurde der ganze Abend. Siehe [EINMESSEN.md](EINMESSEN.md).
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
  [WAV-PROTOKOLL.md](../WAV-PROTOKOLL.md).
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
**der Rohtext fehlt noch**, weil die App nichts auf der Platte ablegt
und von Hand herübergereicht werden muss.

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

**Noch nicht gelaufen.** Der erste echte Lauf steht aus: Caspar_D klickt,
Claude schaut in `library/roh/playlists-*.json` und ins Protokoll. Die
Zeile im Lesezeichen muss „Alben — 25 mit N Einträgen" sagen, grün.

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
   Bau 4.
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
7. Zwei Alt-Wege löschen: `bin/token.js` + `geheim/` +
   `POST /api/geheim/cookie` (Prüfung: null Aufrufer), Docker/Einrichtung
   nachziehen.
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
   lokales Mistral (Ollama, CPU) nur beim Schreiben. Die Hausregel „keine
   KI außer Whisper" gilt dem Betrieb; ein Gegenleser beim Schreiben ist
   kein Betrieb. Vor dem Einsatz Caspar_Ds Wort dazu einholen. Zweiter
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
- Offen: Register zeigt `behaelter` noch nicht; Balken 2 („schon drauf /
  kommt noch") über Nachmessen des Ziels — mit wenigen großen Dateien
  jetzt billig; Kachelgröße (50 KB) für den Sternenhimmel.

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
  Register zeigt `behaelter` (Stücke, Ballast) noch nicht; Kachelgröße
  für den Sternenhimmel (21,6 MB HTML); Windows-Start bei Casto.

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
