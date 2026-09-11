# Tiefenpruefung Handarbeit in library/ — Zusammenfuehrung (08.09.2026)

Hausregel (Caspar_D, 08.09.2026): „hole nie etwas am KlangTresor vorbei, von dem wir wissen, dass der KlangTresor das koennen muss."
Frage je Eintrag: Wer schreibt ihn, laeuft der Schreiber von selbst, und was haette ein fremder Suno-Bestand (Lesezeichen + roter Knopf, keine Terminal-Hand) davon nicht?

63 Eintraege in 6 Gruppen (kern, analyse, raeume, text, gemeinschaft, medien). Nur gelesen, nichts geaendert.
Zeilenangaben beziehen sich auf den Arbeitsstand vom 08.09. abends (server/server.js mit uncommittetem `--alle`/lyrik-Schritt).

## Zaehlung

| Einordnung | Anzahl |
|---|---|
| KEIN SKRIPT | 9 |
| HANDSTART | 4 |
| ALTLAST | 11 |
| NUTZER | 6 |
| AUTO | 32 |
| FREMDQUELLE (ueber Skript, zaehlt als AUTO) | 1 |
| **Summe** | **63** |

Handarbeit im Sinne der Regel = KEIN SKRIPT + HANDSTART = **13**. Dazu 11 Altlasten (Rueckstaende von Handlaeufen, die niemand mehr liest) und 6 AUTO-Eintraege mit einem Hand-Haken (siehe Abschnitt „Haken in AUTO").

## Tabelle

### KEIN SKRIPT (9)

| Eintrag | Schreiber | Weg | Einordnung | Was ein fremder Bestand nicht haette |
|---|---|---|---|---|
| library/kondensate/kondensate.json (+ kondensate.txt, 1127 Zeilen) | Einsammler bin/kondensate-sammeln.js:69 (ZIEL Z.15) / :80 (LESBAR Z.16) — sammelt nur ein, was als JSON von aussen kommt. Den Inhalt (zehn Substantive je Titel) erzeugt kein Skript; bin/kondensat-prompt.js (FASSUNG 2) haelt nur den Auftragstext, niemand ruft ihn | nur von Hand: `node bin/kondensate-sammeln.js <verzeichnis>`; Inhalt von Claude in Sitzungen am 28.08. (docs/LIED-FAMILIEN.md:229-233, docs/KONDENSAT-REGELN.md) | KEIN SKRIPT | Gar keine Kondensate. Damit keine wortvektoren.json (Ortsbegriffe), keine Kondensat-Gruppennamen im Geschichten-Raum, keine Sprachheilung; geschichten.json durchgehend Volltext („ehrlich schwaecher", docs/BACKLOG.md). Im eigenen Bestand fehlen sie schon den 2 Titeln seit 04.09. docs/BACKLOG.md:2105 HANDLUNGSBEDARF; Netz-Modell 07.09. verworfen |
| library/backup/eq-vor-loeschung-2026-08-29.json | keiner — kein Treffer in bin/, server/, browser/, docs/, git log -S | Handkopie (Claude/Terminal) vor Handeingriff in eq.json am 29.08.; niemand liest sie | KEIN SKRIPT | Weder die Loeschung der Gains noch die Sicherung — beides lief am Skriptweg vorbei; nichts fehlt einem fremden Bestand |
| library/backup/vor-instrumental-bereinigung-20260825-181041/ (katalog.json.gz, whisper.ndjson; 51 MB) | keiner — Ordnername in Shell-Form `date +%Y%m%d-%H%M%S`; Herkunft docs/ERFUNDENES.md:31, Commit 884654a (25.08. 18:15) | Handsicherung vor der Bereinigung der Halluzinationen (35 Songs, 64 Instrumentals), die selbst auch von Hand lief; niemand liest den Ordner | KEIN SKRIPT | Weder Bereinigung noch Sicherung — heute sperren whisper.js/aufbereiten.js das Wiederkommen, ein fremder Bestand braeuchte beides nicht |
| library/messungen/einmessung-2026-08-27.json | keiner — „einmessung" kommt in bin/, server/, browser/, web/ nicht vor; nur docs/EINMESSEN.md:729, Commit 2f0e90b. Die in web/index.html:20212 genannte Route PUT /api/messungen/gang existiert nicht (Kommentar seit 4394af7) | Export der Sitzung vom 27.08., von Hand/Claude ins Repo gelegt; kein Programmteil liest sie | KEIN SKRIPT | Eine historische Bezugsmessung (31 Terzbaender + FFT). Fuer einen fremden Bestand bedeutungslos; der Weg ist seit 29.08. durch tontestdurchlaeufe.json (NUTZER) ersetzt |
| library/messungen/2026-08-27-befunde.json | keiner — Selbstauskunft im Dateikopf: „Von Hand aus den Meldungen der Sitzung uebertragen"; Commit 2f0e90b; docs/EINMESSEN.md:730 | von Claude/Hand geschrieben; kein Leser, einziger Verweis docs/BACKLOG.md:1376 | KEIN SKRIPT | Protokoll eines Messabends, kein Bestandsdatum. Genau die „von Hand generierten Daten" der Anfrage — im Repo statt in library/ zu Hause |
| library/kondensate/vorher-vektoren/ (geschichten.json, karte-geschichten.json, karte-lied.json) | keiner — Handkopien (cp) vom 28.08. 20:30 der damaligen Volltext-Staende; grep bin/server/browser leer | nur von Hand; einziger Leser docs/eichkasten/messlauf.js:12 (Handwerkzeug, rein lesend) | KEIN SKRIPT | Referenzstand fuer den Eichkasten (Kondensat gegen Volltext). Kein Betriebsdatum; gehoert zu docs/eichkasten/, nicht in library/ |
| library/modelle/README-htdemucs-6s.md | keiner — steht nicht in DATEIEN von bin/modelle-holen.js:37-52; keine Doku-Referenz | von Hand abgelegte Modellkarte (MIT); kein Leser | KEIN SKRIPT | Nichts, was fehlt. Lizenznennung gehoert laut modelle-holen.js:9 nach web/fremd/LIZENZEN.md |
| library/entwurf/WARUM-HIER.md | keiner — handgeschriebene Werkstattnotiz (Stand 29.08.); nur docs/NAECHSTER_CHAT.md:1425 verweist darauf | Hand; kein Leser | KEIN SKRIPT | Weder die Datei noch den Ordner — es ist Doku, kein Datum |
| library/entwurf/karte-geschichten.json.vor-schritt2 | keiner — eingefrorene Kopie (cp) von library/karte-geschichten.json vom 28.08. 23:29 (damaliger Schreiber bin/karte.js --raum geschichten, ZIEL bin/karte.js:63) | nur von Hand; einziger Leser docs/eichkasten/namen-test.js:8 (Handwerkzeug, docs/eichkasten/LIESMICH.md:16) | KEIN SKRIPT | Vergleichsstueck eines einmaligen Belastungstests; laut WARUM-HIER.md „kann weg, wenn der Vergleich nicht mehr gebraucht wird" |

### HANDSTART (4)

| Eintrag | Schreiber | Weg | Einordnung | Was ein fremder Bestand nicht haette |
|---|---|---|---|---|
| library/songs/<id>/stems/*.flac (1926 = 321 x 6) | bin/stems.js:152 (writeFileSync .f32) + :154-155 (spawnSync ffmpeg → <id>/stems/<spur>.flac), Ordner :271; Modell library/modelle/htdemucs_6s.onnx (von modelle-holen.js:39) | nur von Hand. In KEINEM Morgenschritt, keine Route, kein spawn (bin/wiederherstellen.js:120/137: „steht in KEINEM Schritt hier"). Gelaufen als nohup-Nachtkette 23.-25.08. (library/nachtlauf.log, docs/NAECHSTER_CHAT.md:594-597). ~4 min/Lied, 250 MB/Lied, caffeinate eingebaut (stems.js:39/59) | HANDSTART | Keine Stems — und damit nichts, was darauf aufbaut: keine Huellkurven, Tonart, Stimmlage (web/index.html:16238 zeigt dann nichts). Wurzel der beiden naechsten Zeilen. docs/BACKLOG.md:775 „Nachtknopf mit Zustand im Server statt nohup-Kette" |
| library/toene.json (17,7 MB, 26.08.) | bin/toene.js:563 (ZIEL Z.47), schreiben() alle 20 Lieder und am Ende | nur von Hand: `node bin/toene.js`. Nicht in MORGEN_SCHRITTE, keine Route, kein spawn/execFile (grep leer). Braucht die Stems (README.md:244, docs/handbuch/SKIZZEN.md:436: „Beide Laeufe gehoeren NICHT zum Morgenlauf") | HANDSTART | Keine Tonart, Stimmlage, Instrument-Huellkurven; analyse-index.json bleibt ohne Feld `tonart` (analyse-index.js:117-127 „Index ohne Tonarten"). Als offen bekannt (SKIZZEN.md:436), nicht behoben |
| library/notenzonen.json (14,7 MB, 26.08.) | bin/toene.js:484 zonenSchreiben() (ZONEN Z.54), derselbe Lauf | nur von Hand (siehe toene.json); gelesen ueber /api/notenzonen/<id> server.js:1303-1306 | HANDSTART | Leer; Server antwortet {songs:{}} (docs/OFFEN.md:776) |
| library/fassungen.json (07.09. 23:21) | bin/fassungen.js:454 (ZIEL Z.87) | nur von Hand: `node bin/fassungen.js` (Kopf Z.74-76). Nicht in MORGEN_SCHRITTE, keine Route, kein execFile. 35 Familien — aber NIEMAND liest sie: kein /api/fassungen, kein Vorkommen in web/ (docs/LIED-FAMILIEN.md: „Vorrechner gebaut, Oberflaeche nicht") | HANDSTART | Entsteht gar nicht — und fehlt auch nicht, solange keine Oberflaeche sie liest. Ohne Schaltflaeche ist es eine Altlast im Wartestand |

### ALTLAST (11)

| Eintrag | Schreiber | Weg | Einordnung | Was ein fremder Bestand nicht haette |
|---|---|---|---|---|
| library/neue-songs.json | bin/sammeln.js:326-331 (nur wenn neuIds.length) | Route /api/morgen/sammeln server.js:953/:957 → morgenLosschicken spawn :637. Kein Leser in bin/, server/, web/, browser/ (nur Kommentar server.js:921, docs/UEBERGABE.md:200 fuer den seit 03.09. toten WAV-Handweg); der Morgenlauf haelt neue IDs im Speicher (morgen.neueIds, /api/morgen/neue) | ALTLAST | Er haette sie — nutzlos. Wird geschrieben, nie gelesen |
| library/analyse/<id>.spektro.png + .stereo.png (272 = 136 Titel, alle 19.08., 1,0 GB) | bin/vorrechnen.js:128 alsPng — nur wenn cwebp fehlt (HAT_CWEBP Z.124, Endung Z.263); server.js:223 nimmt PNG per PUT an, Browser schreibt aber WebP | heute schreibt kein Weg PNG (Kopf Z.25: „Der Umweg ueber PNG entfaellt"). Leser nur als Rueckfall, wenn WebP fehlt (analyzer.js:5166, server.js:257, vorrechnen.js:282) — WebP fehlt bei keinem der 136 | ALTLAST | Nichts — ein fremder Bestand mit cwebp erzeugt sie gar nicht. 1,0 GB unbenutzt |
| library/kondensate/arbeit/ (47 JS, ~60 JSON, 11 log, 2 bin) | Claudes Versuchsskripte vom 28.08. (buendel-alle.js, ollama.js:73, gruppenprobe/, vergleich-f1-f2/, vokabular/ersatz|generik|unruhe|entscheidung/) mit absoluten Pfaden; schreiben nur in ihren Ordner (__dirname); .log von Hand umgeleitet | nur von Hand (`node <pfad>`), einmalig 28.08.; kein require, keine Route, keine Doku-Referenz auf die Skriptnamen (auch docs/eichkasten zeigt nicht hierher). Erkenntnisse aufgehoben in docs/KONDENSAT-REGELN.md, GESCHICHTEN-RAUM-EICHKASTEN.md, Sockel-Kommentar geschichten-achsen.js | ALTLAST | Ein Rechenlabor im Datenordner — nie |
| library/entwurf/karte-lied.json | keiner mehr — ehemals bin/karte.js (Lied-Raum); Rechnung geloescht (bin/karte.js:52-56, server.js:1447-1450, Caspar_D 29.08.: „den kombinierten Raum machen wir nicht wieder auf") | — ; kein Leser (grep: nur Kommentare) | ALTLAST | Letztes Exemplar eines gestrichenen Raums |
| library/whisper-lauf.log | keiner — Shell-Umleitung des Handlaufs (docs/WHISPER.md:61: `nohup node bin/whisper.js --still > library/whisper-lauf.log 2>&1 &`; docs/NAECHSTER_CHAT.md:96, 20.08.) | nur von Hand; kein Leser | ALTLAST | Nie — der Morgenlauf protokolliert im Morgenfenster |
| library/whisper-nachlauf.log | keiner — Ad-hoc-Shellschleife 24.08. 14:11-15:23 (fuenf Titel per ID durch whisper.js, davor „Stem-Trennung anhalten" SIGSTOP, danach „geweckt"); Skript nicht aufbewahrt, Text nirgends unter /Volumes/Extreme_SSD/Entwicklung | nur von Hand; kein Leser | ALTLAST | Spur eines Eingriffs, den der KlangTresor selbst nicht kennt (Prozesse anhalten, Titel per ID nachziehen) |
| library/wav-stand.json (18.08.) | bin/wav.js:146/:150 (STAND Z.33) | nur von Hand (`node bin/wav.js`), von nichts gerufen; seit 03.09. ausser Betrieb (bin/gesundheit.js:34). Kein Leser ausser wav.js selbst | ALTLAST | Merker fuer einen Weg, den Suno geschlossen hat |
| library/klang-lauf.log (21.08.) | keiner — --still-Ausgabe von bin/klang.js:302, per Umleitung von Hand | nur von Hand; kein Leser | ALTLAST | Protokoll des ersten Klanglaufs, heute Morgenschritt „Musikstil vermessen" |
| library/messweg-nachzug.log (24.08.) | keiner — eine Zeile „warte auf das Ende des Whisper-Laufs", Text in keinem Skript | Wegwerf-Kette der Claude-Sitzung 24.08.; kein Leser | ALTLAST | Nie |
| library/nachtlauf.log (25.08.; am 08.09. geloescht — Inhalt in einem Satz: nohup-Kette „1/3 Stems trennen" ab 24.08. 09:13 in drei Anlaeufen (12/8/4 von 16 Kernen, Reihenfolge aus einer vorrang.txt im Claude-Scratchpad, 246 Lied-Zeilen a ~2-3 min bei ~2x Echtzeit und 50-125 MB je Lied), Stillstand nach 113 Songs um 16:00, Neustart 25.08. 00:41 fuer die restlichen 133, dazwischen „2/3 Toene vermessen" mit 188 Liedern nach library/toene.json) | keiner im Repo — stdout von bin/stems.js (--liste auf vorrang.txt im Claude-Scratchpad) und bin/toene.js, nohup-Kette (docs/NAECHSTER_CHAT.md:594-597) | nur von Hand (Claude-Kette 24.-25.08.); kein Leser | ALTLAST | Einziger Beleg, wie die 1926 Stems entstanden — eine Handkette ausserhalb des Hauses |
| library/server.log (25.08.) | keiner — Startausgabe von server/server.js per Shell-Umleitung; bin/server-start.sh leitet nichts um | nur von Hand; kein Leser | ALTLAST | 492 Bytes einer Sitzung |

### NUTZER (6) — Bedienung, keine Handarbeit im Sinne der Regel

| Eintrag | Schreiber | Weg | Einordnung | Was ein fremder Bestand nicht haette |
|---|---|---|---|---|
| library/eq.json (158 B) | server/server.js:1669-1682 PUT /api/eq/<id> (writeFileSync :1680) | web/index.html:4316 fetch PUT beim Aendern der EQ-Gains/Kerbe im Tonstudio; Leser index.html:4275/5077, GET /api/eq server.js:1664 | NUTZER | Leer, bis jemand am EQ dreht — gewollt |
| library/instrumental.json (2 B, `{}`) | server/server.js:1733-1745 PUT /api/instrumental/<id> (writeFileSync :1743) | Haken „instrumental" in der Titelkarte web/index.html:15344 → :15516; Leser index.html:15300, bin/toene.js:497; .gitignore:68 | NUTZER | Leer — Uebersteuerung der Automatik durch den Nutzer |
| library/messungen/tontestdurchlaeufe.json (29.08.) | server/server.js:1630-1646 PUT /api/messungen/durchlauf (writeFileSync :1642) | Einmessen-Register im Tonstudio, web/index.html:20255-20260 dokSpeichern(); Leser server.js:1648-1663; .gitignore:15-16 bewusst im Repo | NUTZER | Leer bis zur ersten Einmessung — ein Raum an einem Abend ist nicht reproduzierbar |
| library/notizen.json | server/server.js:1710 in PUT /api/notiz/<id> (:1697-1713) | Notizfeld an der Kachel web/index.html:15407 (sichern :15404); GET /api/notizen server.js:1692-1695, index.html:15288 | NUTZER | Fehlt, Server antwortet {} (server.js:1694). Inhalt heute nur eine Testnotiz |
| library/export/sternenhimmel.html (25.08.) | bin/himmel-export.js:374 (ordner/ziel :371-373) | POST /api/himmel-export server.js:1433-1436 (spawnSync) vom Knopf „Export" web/index.html:7550 → karteExportKlick :7391-7394; GET /export/sternenhimmel.html server.js:1438-1442. Nicht in MORGEN_SCHRITTE | NUTZER | Entsteht nur auf Knopfdruck — Schnappschuss zum Verschicken, altert gegen den Katalog |
| library/songs/<id>/eigen.mp4 (4) | server/server.js:2067-2069 PUT/POST /api/eigen-artwork/<id> (.teil + renameSync); bin/eigen-artwork.js:168 (Befehlszeile, von Hand) | web/index.html:15474 (Hochladen), :15445 (Loeschen); Liste /api/eigen-artwork server.js:1982, UI :10221 | NUTZER | Keine — eigene Videos des Autors, absichtlich anders benannt als artwork.mp4 |

### AUTO (32) + FREMDQUELLE (1)

| Eintrag | Schreiber | Weg | Einordnung | Was ein fremder Bestand nicht haette |
|---|---|---|---|---|
| library/katalog.json.gz | bin/katalog.js:73 schreiben(); Aufrufer bin/aufbereiten.js:691, bin/farben.js:448; Direktschreiber am katalog.js vorbei: server/server.js:1763, :1806 (PUT /api/instrumental/<id>) | MORGEN_SCHRITTE server.js:355 (aufbereiten.js) → spawn :637; server.js:367 (wiederherstellen.js --nur-medien) → spawnSync wiederherstellen.js:101 → farben.js | AUTO | Nichts. Schoenheitsfehler: die Instrumental-Route schreibt ohne Sicherungskopie nach backup/ |
| library/konfig.json | server/server.js:709 (GET /api/konfig, Handle still aus dem Katalog), :723 (PUT, Alias), bin/uebernehmen.js:65 konfigMerken (nur --ordner, :148) | Oberflaeche ruft /api/konfig beim Start; erster Aufruf schreibt sie von selbst | AUTO | Nichts; Handeingriff 26.08. war eine Loeschung, keine Erzeugung |
| library/kontingent.json | server/server.js:812-830 (POST /api/morgen/roh, Block DOWNLOAD-KONTINGENT) | Lesezeichen browser/morgens.js:205 → /api/morgen/roh; Leser server.js:1537 | AUTO | Nichts — ab dem ersten Lesezeichenklick da |
| library/letzter-vergleich.json | bin/sammeln.js:320 | Route /api/morgen/sammeln server.js:953/957 → spawn :637; Leser server.js:1063 ← web/index.html:15958 | AUTO | Nichts |
| library/gesundheit.json | bin/gesundheit.js:144 | MORGEN_SCHRITTE server.js:354 (erster Schritt) → spawn :637; Leser gesundheit.js:114 selbst | AUTO | Nichts |
| library/morgen-dauern.json | server/server.js:511 dauerMerken | server.js:645 nach jedem Schritt in morgenLosschicken; Leser dauernLesen :498 | AUTO | Nichts. Nebenbefund: Ernte-Schritt traegt die Uhrzeit im Schluessel (heute 21 Schluessel), Schaetzung trifft nie; 5 tote Schluessel alter Schrittnamen |
| library/kachel-stand.json | bin/kacheln.js:282 (nur wenn fertig > 0) | server.js:367 → wiederherstellen.js:90/:101 → kacheln.js; Leser server.js:1210 | AUTO | Nichts |
| library/backup/katalog-*.json.gz (10) | bin/katalog.js:46 copyFileSync in schreiben(); Ausduennung BACKUPS_BEHALTEN=10 :48-53 | jeder Katalogschreibvorgang (aufbereiten.js:691, farben.js:448); kein Leser im Code — Absicht: Notfall-Handgriff (docs/handbuch/SKIZZEN.md:580/602) | AUTO | Nichts |
| library/roh/ | server/server.js:798 (profil-), :836 (privat-), :888 (playlists-), :911 (timing-) in POST /api/morgen/roh; bin/sammeln.js:186/:206 im Frisch-Modus; Loeschung aufbereiten.js:762 | Lesezeichen morgens.js:205; roter Knopf Stufe 1 server.js:957 → sammeln.js; Leser aufbereiten.js (:355), server.js:320/980/1017/1042/1863/1896 | AUTO | Nichts. Nebenbefund: server.js:1898, wiederherstellen.js:64-66 verweisen auf roh/verarbeitet/, das seit 20.08. nicht mehr existiert |
| library/analyse/<id>.bin + .spektro/.stereo/.rechts/.summe.webp (323 bin, 1292 webp) | bin/vorrechnen.js:266-271 (cwebp Z.124-128, writeFileSync :271), Arbeiter spawn :339; zweiter Weg server/server.js:212-262 analyseSchreiben (PUT /analyse/<id>.<endung>) ← web/fremd/analyzer.js:5248 | MORGEN_SCHRITTE server.js:368 → vorrechnen.js (Start :636-637); Browser-PUT bei Live-Analyse ohne Ablage (analyzer.js:5225-5252). `--nur-bilder` nur von Hand (analyzer.js:5159), derzeit nicht noetig | AUTO | Nichts — beim ersten roten Knopf da |
| library/analyse-index.json | bin/analyse-index.js:149 (ZIEL Z.26) | MORGEN_SCHRITTE server.js:374 | AUTO | Das Feld `tonart` (kommt aus toene.json, HANDSTART; analyse-index.js:117-127 „Index ohne Tonarten") |
| library/eq-profil.json | bin/eq-profil.js:95 (ZIEL Z.32) | MORGEN_SCHRITTE server.js:377; Leser bin/karte.js:83, /api/eq-profil server.js:1426 | AUTO | Nichts |
| library/stoerfrequenzen.json (07.09. 01:39) | bin/stoerfrequenz.js:315-317 schreiben() (ZIEL Z.41), :353/:363 | MORGEN_SCHRITTE server.js:380; zweiter Weg POST /api/stoerfrequenz/start server.js:1233-1248 (Tonstudio-Knopf) | AUTO | Nichts; Datum = „schreibt nur bei Neuem" |
| library/klang.json | bin/klang.js:311-316 (ZIEL+'.tmp' → renameSync; ZIEL Z.55) | MORGEN_SCHRITTE server.js:419 (klang.js --still) | AUTO | Nichts, sofern library/modelle/ da ist; sonst Exit 0 (klang.js:282), Klangraum leer |
| library/karte.json | bin/karte.js:622 (ZIEL = RAEUME.klang.datei, Z.57-63) | MORGEN_SCHRITTE server.js:428; Leser /api/karte server.js:1451, /api/raeume :1612 | AUTO | Nichts |
| library/karte-geschichten.json | bin/karte.js:622 (RAEUME.geschichten.datei Z.59), danach bin/geschichten-achsen.js:178 (pfad Z.97) ergaenzt s.gesch/g.achsen | MORGEN_SCHRITTE server.js:437 (`karte.js --raum geschichten`) und :438 (geschichten-achsen.js) | AUTO (mit Haken) | **Den Geschichten-Raum ueberhaupt**: karte.js:72-74 rechnet ihn NUR, wenn die Datei schon existiert („wird gepflegt, nicht aufgemacht"); erstes Aufmachen braucht `node bin/karte.js --raum geschichten --neu` von Hand |
| library/geschichten.json | bin/geschichten.js:271 (ZIEL Z.52) | MORGEN_SCHRITTE server.js:435 | AUTO | Das Skript laeuft, aber 257 Lieder sind aus dem Kondensat eingebettet, 2 aus dem Volltext; ein fremder Bestand ist durchgehend Volltext (Modell vorausgesetzt, sonst Exit 0 Z.176-179) |
| library/wortvektoren.json | bin/ortsbegriffe.js:113 (ZIEL Z.54) | MORGEN_SCHRITTE server.js:436; karte.js:522 liest das Modul fuer Gruppennamen | AUTO | Die Datei selbst: Vokabular kommt nur aus kondensate.json (ortsbegriffe.js:55-70); ohne Kondensate return null (Z.84), karte.js faellt auf Wortkontrast zurueck. Folgeschaden von KEIN SKRIPT Kondensate |
| library/achsen-sockel.json | bin/geschichten-achsen.js:146 — nur wenn die Datei NICHT existiert (Z.129-151, „eingefroren") | MORGEN_SCHRITTE server.js:438; einziger Leser geschichten-achsen.js selbst | AUTO | Nichts — aber der Sockel friert beim ersten Lauf ein, bei 5 Liedern ein Sockel aus 5. Der Zeitpunkt ist Zufall |
| library/whisper.ndjson (25.08.) | bin/whisper.js:351 appendFileSync (DATEI Z.62) | MORGEN_SCHRITTE server.js:398 `whisper.js --still --alle` — `--alle` von heute, nicht committet; Handstart moeglich (docs/WHISPER.md:61). Leser aufbereiten.js:326, server.js:1272, lyrik.js:66 | AUTO (unbelegt) | Heutiger Inhalt ist komplett Handlauf 19.-25.08.; eine Zeile handeditiert (Feld `vermerk`, erzeugt kein Skript = Hand-Exklusion eines Endlos-Titels). Datum springt erst beim naechsten roten Knopf |
| library/lyrik.json (07.09. 15:17) | bin/lyrik.js:378 (ZIEL Z.67), nur mit --tun (:297, :363) | MORGEN_SCHRITTE server.js:415 `lyrik.js --tun` — seit heute Abend, nicht committet; Leser server.js:1328 | AUTO (unbelegt) | Der Schritt hat noch nie gelaufen; Inhalt ist Handstart 07.09.; drei Titel ohne Whisper im „unsicher"-Block |
| library/community-profile.json | bin/community-profile.js:169 (ZIEL Z.64; schreiben() :196/:199) | MORGEN_SCHRITTE server.js:466; Panel-Knopf web/index.html:12370 → POST /api/community/start → server.js:1386 spawn; liest reaktionen.ndjson (:65/:107) | AUTO | Nichts; ohne Reaktionen leer, Route liefert {stand:null, leute:{}} (server.js:1354) |
| library/community-hirsch.json | bin/community-hirsch.js:167 (ZIEL Z.72; schreiben() :190/:194) | MORGEN_SCHRITTE server.js:467 (letzter Schritt); Panel server.js:1391; Leser server.js:1416, web/index.html:12541 | AUTO | Nichts |
| library/liker/<song>.json · library/liker-verlauf.ndjson | server/server.js likerAblegen (seit 09.09.2026) | Lesezeichen morgens.js Abschnitt 2e „Wer hat geherzt" → POST /api/morgen/roh → likerAblegen; Leser: /api/kommentare/:id (likerMitZeiten), /api/community, /api/liker/stand | AUTO | Nichts; erster Lauf holt alle Titel mit Herzen, danach nur geänderte Herzzahlen |
| library/suno-wege/*.json | Werkzeuge bin/suno-wege.js, bin/suno-app-wege.js; Proben von Hand (Mitschnitt iPhone 09.09.2026, zwei GET mit Freigabe) | keine Route liest sie — Belege für die Endpunkt-Doku, gitignored | DOKU | Nichts; keine Archivdaten |
| library/reaktionen.ndjson | (1) bin/reaktionen.js:130 createWriteStream flags:'a' (DATEI Z.53); (2) server/server.js:556 reaktionenAnhaengen (:547) | (1) MORGEN_SCHRITTE server.js:359; (2) Lesezeichen morgens.js:1055-1070 → POST /api/morgen/roh (:205) → server.js:749 → :911 | AUTO | Nichts; bin/paket.js:39 schliesst .ndjson aus dem Paket aus (fremde Namen) |
| library/avatar.webp | bin/laden.js:204 → ladeDatei :118/:124; ueberspringt Vorhandenes :85 | server.js:367 → wiederherstellen.js:89/101 → laden.js --alle. URL aus katalog.profil.avatar_image_url ← aufbereiten.js:656-657 ← sammeln.js:194-206 NUR im Frisch-Modus (bei --aus-roh kopf null, sammeln.js:111-138); Frisch nur ueber /api/morgen/sammeln server.js:942-957, wenn Ernte > 120 min alt | AUTO (mit Luecke) | **Den Avatar**, wenn er nur Lesezeichen + roten Knopf nutzt (Ernte < 2 h): das Lesezeichen traegt avatar_image_url in ernte.profil (morgens.js:1134), aber der Server schreibt daraus keine profilinfo-Datei; kein katalog.profil → kein Avatar, bis einmal „Titelliste frisch von Suno holen" lief |
| library/profilbild.webp (26.08.) | bin/laden.js:221 → ladeDatei :118/:124 | wie avatar.webp; URL aus katalog.profil.cover_photo_url ← sammeln.js:202; Leser server.js:1953, web/index.html:13657/13786 | AUTO (Quelle tot) | **Das Profil-Titelbild** — Quelle tot, Profilseite zeigt leeren Grund, und niemand erfaehrt warum. Der eigene Bestand lebt von einer Datei vom 26.08., die kein Lauf erneuern koennte |
| library/playlistbilder/ (25 jpg) | bin/laden.js:241 (Schleife :235-247, mkdir :237) → ladeDatei :118/:124, nur Fehlendes :85 | server.js:367 → wiederherstellen.js:89/101 → laden.js --alle; bildUrl aus aufbereiten.js:522 ← playlists-Rohdatei ← server.js:895 ← morgens.js:600/:682; Leser server.js:1964 | AUTO (nur per Codelesen belegt) | Nichts — aber seit dem Handlauf 17.08. kam kein Album dazu, der Weg ist nie beobachtet worden. Fremde Cover bewusst nicht geladen (laden.js:231-234) |
| library/songs/<id>/audio.mp3 (323) | bin/laden.js:118/:124 (CDN, seit 03.09. .../api/forbidden → 'fehlt'); heute bin/uebernehmen.js:204 copyFileSync aus ~/Downloads (Suno-Signatur im Dateikopf) | server.js:366 (uebernehmen.js --tun), :367 (wiederherstellen.js → laden.js --alle); Route POST /api/downloads server.js:1588-1591 ← web/index.html:11970 | AUTO | Nichts Automatisierbares: MP3 kommt nur ueber „Unlock & Download" bei Suno (kostet Guthaben, bewusst nicht automatisiert); Uebernahme danach automatisch |
| library/songs/<id>/audio.wav (323) | Bestand (321): bin/wav.js:113 + ladeDatei von cdn1.suno.ai — Handlauf 18.08., seit 03.09. ausser Betrieb (gesundheit.js:34); heute bin/uebernehmen.js:204 (NEHMEN '.wav' :75) | uebernehmen.js: server.js:366 + /api/downloads :1588; wav.js: nur von Hand, von nichts gerufen (Hinweis wiederherstellen.js:136) | AUTO (Bestand aus Handlauf) | **Die 321 WAVs aus dem Handlauf** — Suno gibt keine WAV-Links mehr heraus; ein Fremder bekommt WAV nur ueber Unlock je Song |
| library/songs/<id>/cover.jpg (323) | bin/laden.js:172 → ladeDatei :118/:124 | server.js:367 → wiederherstellen.js:89/101; gesundheit.js ueberwacht cdn2.suno.ai | AUTO | Nichts, solange das Bild-CDN offen bleibt |
| library/songs/<id>/kachel.jpg (323) | bin/kacheln.js:227 (execFile ffmpeg, Ziel :246); Stempel :282 | server.js:367 → wiederherstellen.js:90/101 (ohne Schalter = nur fehlende); server.js:1210 | AUTO | Nichts; Neulauf 07.09. war einmalige Reparatur nach Codeaenderung |
| library/songs/<id>/artwork.mp4 (84) | bin/laden.js:176 (nur wenn s.videoCoverUrl) → ladeDatei :118/:124 | server.js:367 → wiederherstellen.js:89/101; gesundheit.js ueberwacht cdn1 | AUTO | Nichts |
| library/modelle/ (6 onnx, 5 json) | bin/modelle-holen.js:160 writeFileSync bzw. perCurl -o :138 (ZIEL Z.33, DATEIEN Z.37-52: htdemucs_6s, Discogs-EffNet + 3 Koepfe, mpnet + Tokenizer) | nicht im Morgenlauf, sondern Einrichtung: einrichten-macos.command:179, einrichten-linux.sh:183, einrichten-windows.ps1:188, docker-entrypoint.sh:14, `npm run modelle` (package.json:15), START-HIER.md:84 | FREMDQUELLE (= AUTO) | Nichts, wenn die Einrichtung durchlaeuft; fehlen sie, ueberspringen klang/geschichten/ortsbegriffe/geschichten-achsen mit Exit 0. Offen: beim Windows-Tester kamen die Modelle nicht an |

## Haken in AUTO (6) — Schreiber laeuft, Inhalt oder Erstlauf haengt trotzdem an der Hand

1. **karte-geschichten.json** — erster Lauf nur mit `--neu` von Hand (karte.js:72-74). Ein fremder Bestand bekommt den Geschichten-Raum nie von selbst.
2. **whisper.ndjson** — ERLEDIGT/belegt (11.09.2026): `whisper.js --still --alle` steht committet im Morgenlauf, die Datei traegt den 08.09. 21:39. Bestand ist Handlauf; `--alle` war am 09.09. noch unbelegt; eine handeditierte Zeile (`vermerk`).
3. **lyrik.json** — ERLEDIGT/belegt (11.09.2026): der Morgenschritt `lyrik.js --tun` steht committet, `library/lyrik.json` traegt den 11.09. 06:33, ist also gelaufen.
4. **avatar.webp** — Lesezeichen-Ernte traegt die URL, der Server verwirft sie; nur der Frisch-Modus (Ernte > 2 h) schreibt katalog.profil.
5. **profilbild.webp** — Quelle tot, keine Meldung.
6. **audio.wav (321 Bestand)** — Handlauf ueber einen CDN-Weg, der nicht mehr existiert.
Dazu wortvektoren.json / geschichten.json / analyse-index.json (`tonart`): technisch AUTO, inhaltlich Folgeschaden von Kondensate (KEIN SKRIPT) bzw. toene.json (HANDSTART).

## Empfehlungen je Handarbeit-Befund

Aufwand: S = unter einer Stunde, M = ein Abend, L = mehrere Abende / Rechenzeit in Stunden. Alles ist Vorschlag zum Abstimmen, nicht zum Bauen (Arbeitsweise: erst Plan, dann bauen).

### KEIN SKRIPT

| Eintrag | Empfehlung | Aufwand |
|---|---|---|
| kondensate/kondensate.json | **Entscheidung noetig, kein Skript baubar ohne Regelbruch**: Die Kondensate brauchen ein Sprachmodell; Hausregel „Keine KI ausser Whisper" und das am 07.09. verworfene Netz-Modell schliessen den Morgenschritt aus. Drei ehrliche Wege: (a) Kondensat-Zweig totlegen — geschichten.js, ortsbegriffe.js, die Gruppennamen in karte.js auf Volltext fuer ALLE zurueck, kondensate/ loeschen, Begruendung in docs; der Raum wird „ehrlich schwaecher", aber gleich fuer jeden Bestand. (b) Kondensat als NUTZER-Eingabe: ein Feld je Titel in der Oberflaeche (wie die Notiz), PUT-Route, kondensate.json wird so zur Bedienung; der Autor kann zehn Woerter selbst schreiben, ein Fremder auch. (c) Ollama als optionaler Einrichtungsschritt wie die Modelle (docs/eichkasten/ollama.js — seit 08.09. dort, vorher library/kondensate/arbeit/ — zeigt, dass es geht; 56 s je Lied auf dem Intel-Mac, 4 h fuer den Bestand) — widerspricht dem Memory „Keine KI ausser Whisper" und braucht Caspar_Ds Wort. Empfehlung: (b) als Grundweg, (a) als Rueckfall fuer Titel ohne Eingabe; damit ist der Raum fuer jeden Bestand gleich gebaut | (a) M, (b) M, (c) L |
| backup/eq-vor-loeschung-2026-08-29.json | loeschen — die Loeschung ist Geschichte, eq.json ist NUTZER-Datum, niemand liest die Kopie | S |
| backup/vor-instrumental-bereinigung-20260825-181041/ | loeschen (51 MB); die Geschichte steht in docs/ERFUNDENES.md und im Commit 884654a. Wenn ein Beleg bleiben soll: nach docs/ als Kurznotiz, nicht als Daten | S |
| messungen/einmessung-2026-08-27.json | nach docs/ verschieben (Messprotokoll, kein Bestandsdatum) oder loeschen; den toten Kommentar PUT /api/messungen/gang in web/index.html:20212 mit entfernen (Totlegen nur mit Loeschen) | S |
| messungen/2026-08-27-befunde.json | wie oben: nach docs/ (BACKLOG.md:1376 verweist darauf) — es ist ein Protokoll | S |
| kondensate/vorher-vektoren/ | nach docs/eichkasten/ verschieben und den Pfad in messlauf.js:12 anpassen — oder mit dem Eichkasten loeschen, wenn die Kondensat-Entscheidung (oben) den Vergleich erledigt | S |
| modelle/README-htdemucs-6s.md | loeschen; Lizenz in web/fremd/LIZENZEN.md pruefen (modelle-holen.js:9) | S |
| entwurf/WARUM-HIER.md | mit dem Ordner entwurf/ loeschen, sobald die beiden Nachbarn weg sind; Inhalt ist in docs/NAECHSTER_CHAT.md aufgehoben | S |
| entwurf/karte-geschichten.json.vor-schritt2 | nach docs/eichkasten/ (Leser namen-test.js:8) oder loeschen — Kein Betriebsdatum | S |

### HANDSTART

| Eintrag | Empfehlung | Aufwand |
|---|---|---|
| songs/<id>/stems/*.flac | **Nachtschritt bauen** (docs/BACKLOG.md:775 „Nachtknopf mit Zustand im Server statt nohup-Kette"): eigener Knopf oder Anhang an den Morgenlauf mit Schluessel 'kaffee' — nur fehlende Titel, caffeinate ist schon in stems.js:59. Rechenzeit ~4 min/Lied, 250 MB/Lied; fuer einen neuen Bestand mit 300 Liedern ~20 h und 75 GB — deshalb Nacht, nicht Morgen, und ein Zustand im Server, damit der Lauf unterbrechbar und wiederaufnehmbar ist. Voraussetzung: htdemucs_6s.onnx aus der Einrichtung | L (Bau M, Lauf L) |
| toene.json | **Morgenschritt bauen**, hinter dem Stems-Schritt (oder direkt in die Nachtkette): `bin/toene.js` rechnet nur Lieder mit Stems, ohne Stems „passiert nichts" (Kopf Z.38) — laeuft also schadlos leer, kann sofort in MORGEN_SCHRITTE vor analyse-index.js (server.js:374), damit `tonart` in den Index kommt | S (Eintrag) |
| notenzonen.json | faellt mit toene.json zusammen — kein eigener Schritt | — |
| fassungen.json | Entweder Oberflaeche bauen und den Schritt hinter karte.js/geschichten.js in MORGEN_SCHRITTE haengen (so steht es im Skriptkopf), oder Skript und Datei loeschen und docs/LIED-FAMILIEN.md als Begruendung stehen lassen. Im Wartestand ist es Altlast | Schritt S, Oberflaeche M |

### Haken in AUTO

| Eintrag | Empfehlung | Aufwand |
|---|---|---|
| karte-geschichten.json (`--neu`) | den Schutz in karte.js:72-74 so umbauen, dass der erste Lauf die Datei anlegt, wenn geschichten.json existiert — die „nicht aufmachen"-Sperre war fuer den Entwurfsordner gedacht, der weg kann | S |
| avatar.webp | im Server (POST /api/morgen/roh) aus ernte.profil eine profilinfo-Rohdatei schreiben, damit aufbereiten.js:657 sie findet — oder aufbereiten.js zusaetzlich ernte.profil lesen lassen | S |
| profilbild.webp | Quelle im Lesezeichen pruefen (cover_photo_url), sonst in der Profilseite sagen, dass es keins gibt (App laeuft ohne Claude: Erklaerung ins UI) | S |
| whisper.ndjson / lyrik.json | ERLEDIGT: beide Daten sind gesprungen, siehe oben. Urspruenglich: nichts bauen, nur belegen: den naechsten roten Knopf abwarten, Datum muss springen; das handeditierte `vermerk` entweder als Feld in whisper.js einfuehren oder die Zeile zuruecksetzen. Committen nicht vergessen (git diff server/server.js) | S |
| audio.wav Bestand | nichts — der Weg ist bei Suno zu; bin/wav.js loeschen oder als „ausser Betrieb" belassen, wav-stand.json weg (siehe Altlast) | S |

### ALTLAST — loeschen (Totlegen nur mit Loeschen)

| Eintrag | Empfehlung |
|---|---|
| neue-songs.json | Schreiber in sammeln.js:326-331 loeschen, Begruendung im Kommentar; Datei weg; docs/UEBERGABE.md:200 anpassen |
| analyse/*.spektro.png + *.stereo.png (1,0 GB) | loeschen; PNG-Rueckfallzweige (vorrechnen.js:128/263, server.js:223/257, analyzer.js:5166) mit — cwebp wird damit Voraussetzung, was die Einrichtung schon sicherstellt |
| kondensate/arbeit/ | loeschen oder nach docs/eichkasten/ (wenn die Messreihen als Beleg gelten sollen); in library/ hat ein Rechenlabor nichts verloren |
| entwurf/karte-lied.json | loeschen (Caspar_D 29.08.) |
| whisper-lauf.log, whisper-nachlauf.log, klang-lauf.log, messweg-nachzug.log, nachtlauf.log, server.log | alle sechs loeschen; die Lehre aus nachtlauf.log (Handkette fuer Stems) steht in docs/NAECHSTER_CHAT.md:594-597 und muendet in den Nachtschritt oben. Vorschlag dazu: .gitignore/paket.js um `library/*.log` ergaenzen, damit Umleitungen nicht wieder im Datenordner landen |
| wav-stand.json | loeschen, zusammen mit der Entscheidung ueber bin/wav.js |

### NUTZER — belassen (6)

eq.json, instrumental.json, messungen/tontestdurchlaeufe.json, notizen.json, export/sternenhimmel.html, songs/<id>/eigen.mp4 — alles Bedienung ueber die Oberflaeche mit belegter Route; nichts davon ist Handarbeit im Sinne der Regel. Einzige Notiz: bin/eigen-artwork.js ist ein zweiter Weg von Hand fuer eigen.mp4 — harmlos, aber ueberfluessig neben der Route.

## Kurzbilanz

- Der automatische Weg (Lesezeichen → Server → 19 Morgenschritte) deckt 33 von 63 Eintraegen belegt ab.
- **Vier Wurzeln** tragen die ganze Handarbeit: (1) Kondensate ohne Skript, (2) Stems nur per nohup-Kette (und daran toene/notenzonen/tonart), (3) der Geschichten-Raum, der sich nicht selbst aufmacht, (4) Profil-Bilder, deren Quelle am Server vorbeigeht. Der Rest sind Protokolle, Sicherungen und Versuchslabore, die im Datenordner liegen statt in docs/ — oder die weg koennen.
- Groesster Brocken nach Zeit: Stems als Nachtschritt (Bau ein Abend, Lauf ~20 h je 300 Lieder). Groesste offene Entscheidung: Kondensate — Nutzereingabe, Totlegen oder Modell.
