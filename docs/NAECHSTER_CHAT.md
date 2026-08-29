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
