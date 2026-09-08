# Aufraeumen library/ nach HANDARBEIT-PRUEFUNG.md — Protokoll 08.09.2026

Grundlage: docs/HANDARBEIT-PRUEFUNG.md, Abnahme Caspar_D (Punkt 1 Kondensate vertagt, Punkt 13 fassungen.json bleibt).
Nicht angefasst: browser/morgens.js, bin/aufbereiten.js; server/server.js nur an den PNG-Stellen (siehe unten).

## Geloescht

- library/backup/eq-vor-loeschung-2026-08-29.json (3,1 KB) — Handkopie vor dem Handeingriff in eq.json am 29.08.; kein Schreiber im Code, kein Leser (grep bin/server/web/browser/docs leer). Geloescht.
- library/backup/vor-instrumental-bereinigung-20260825-181041/ (katalog.json.gz + whisper.ndjson, 49,4 MB) — Handsicherung vor der Halluzinations-Bereinigung 25.08.; Geschichte belegt in docs/ERFUNDENES.md:31 und Commit 884654a (beides nachgesehen). Geloescht; ERFUNDENES.md:31 vermerkt jetzt, dass die Sicherung am 08.09. weg ist.
- library/modelle/README-htdemucs-6s.md (8,5 KB) — Modellkarte von Hugging Face, von Hand abgelegt; nicht in DATEIEN von bin/modelle-holen.js, kein Leser. Lizenz vorher geprueft: web/fremd/LIZENZEN.md nennt htdemucs_6s bereits vollstaendig (Meta MIT + StemSplit-ONNX-Export MIT, Link zum HF-Repo). Nichts zu uebertragen. Geloescht.
- library/entwurf/WARUM-HIER.md (1,5 KB) — handgeschriebene Werkstattnotiz 29.08.; kein Leser; Inhalt (Raum offen/zu, Rueckweg) steht in docs/NAECHSTER_CHAT.md:1422ff und docs/GESCHICHTEN-RAUM-BILANZ.md. Geloescht.
- library/entwurf/karte-lied.json (328 KB) — letztes Exemplar des gestrichenen Lied-Raums (Caspar_D 29.08.: „den kombinierten Raum machen wir nicht wieder auf"); Rechnung schon aus karte.js/server.js entfernt, kein Leser. Geloescht.
- library/entwurf/ (Ordner) — nach Verschieben von karte-geschichten.json.vor-schritt2 leer; samt ._-Beifang entfernt.
- library/neue-songs.json (219 B) — Schreiber bin/sammeln.js:323-336 (nur wenn neue IDs), gedacht als Zettel fuer das WAV-Anstossen von Hand; Leser: keiner (grep bin/server/web/browser leer; server.js:921 und docs/UEBERGABE.md:200 nur Erwaehnung). Schreiber gestrichen, Begruendung als Kommentar an der Stelle; UEBERGABE.md:200 berichtigt; Datei geloescht. server.js:921 (Kommentar, Vergangenheitsform „schrieb") NICHT angefasst — server.js nur an den PNG-Stellen freigegeben.
- library/kondensate/arbeit/ (123 Dateien, 90,9 MB — 47 JS, ~60 JSON, 11 log, 2 bin) — Claudes Versuchslabor vom 28.08. Geprueft: kein require, keine Route, kein Verweis auf den Ordnerpfad in bin/server/web/browser/docs; die Namenstreffer (kondensate.js, sockel.js, vektoren.js, vergleich.js) meinen andere Dateien. EINE Ausnahme: HANDARBEIT-PRUEFUNG.md:131 verweist auf ollama.js als Beleg fuer den vertagten Kondensat-Weg (c). Darum ollama.js (4 KB) nach docs/eichkasten/ verschoben (Herkunftskommentar im Kopf, Verweis im Bericht und in LIESMICH.md angepasst), der Rest geloescht.
- library/wav-stand.json (31,8 KB) — Merker von bin/wav.js (STAND, Schreibstellen :146/:150). Geprueft: wav.js liest ihn zwar ein (:104), benutzt die Werte aber nie — uebersprungen wird nach fs.existsSync(audio.wav). Kein anderer Leser. Schreib- und Lesestellen in wav.js gestrichen, Begruendung als Kommentar an der Stelle der Konstante; Datei geloescht. bin/wav.js selbst bleibt (Entscheidung „loeschen oder ausser Betrieb belassen" nicht Teil der Liste).
- sechs Logs, zusammen 62328 Bytes: whisper-lauf.log (34,2 KB, Handlauf whisper.js 20.-21.08.), whisper-nachlauf.log (1,2 KB, Ad-hoc-Schleife 24.08. mit SIGSTOP der Stem-Trennung), klang-lauf.log (721 B, erster Klanglauf 21.08., heute Morgenschritt), messweg-nachzug.log (48 B, eine Zeile), nachtlauf.log (25,6 KB, Stems-Nachtkette 24.-25.08.), server.log (492 B, Startausgabe). Alle Shell-Umleitungen von Hand, kein Leser. Vorher angesehen; nachtlauf.log in einem Satz in HANDARBEIT-PRUEFUNG.md (Zeile ALTLAST/nachtlauf.log) gerettet. Geloescht.
- library/analyse/*.spektro.png + *.stereo.png (272 Dateien, 862.1 MB) — alle vom 19.08., Schreiber war der PNG-Rueckfall in bin/vorrechnen.js (nur wenn cwebp fehlt). VORHER geprueft: jede der 272 PNGs hat ihre .webp daneben (0 fehlen). Geloescht.
  Die Rueckfallzweige im Code (vorrechnen.js alsPng/HAT_CWEBP/fertig(), server.js ANALYSE_ENDUNGEN/analyseName/analyseListe, analyzer.js:5166) sind NICHT gestrichen — siehe „Nicht getan".

## Verschoben

- library/messungen/einmessung-2026-08-27.json (49,6 KB) → docs/messungen/ (git mv, war verfolgt). Kein Leser im Code; nur docs/EINMESSEN.md:729 nennt sie. Dazu den toten Kommentar in web/index.html:20210-20215 berichtigt: PUT /api/messungen/gang gibt es nicht, dokSpeichern() schreibt PUT /api/messungen/durchlauf nach tontestdurchlaeufe.json.
- library/messungen/2026-08-27-befunde.json (3,3 KB) → docs/messungen/ (git mv). Leser: keiner; Verweis docs/BACKLOG.md:1376 auf den neuen Pfad gesetzt; docs/EINMESSEN.md:722ff sagt jetzt, wo die beiden liegen.
- library/kondensate/vorher-vektoren/ (3 Dateien, 2,4 MB: geschichten.json, karte-geschichten.json, karte-lied.json) → docs/eichkasten/vorher-vektoren/. Handkopien vom 28.08.; einziger Leser docs/eichkasten/messlauf.js:12 — Pfad angepasst; Doku-Verweise in docs/eichkasten/LIESMICH.md:13 und docs/GESCHICHTEN-RAUM-EICHKASTEN.md:13/:387 nachgezogen.
- library/entwurf/karte-geschichten.json.vor-schritt2 (318 KB) → docs/eichkasten/. Einziger Leser docs/eichkasten/namen-test.js:8 — liest jetzt aus __dirname; LIESMICH.md:16 angepasst.
- library/kondensate/arbeit/ollama.js (4 KB) → docs/eichkasten/ollama.js (siehe oben bei arbeit/).

## Geaenderte Codestellen (alle .js mit node --check geprueft)

1. bin/sammeln.js:323-330 — Schreiber neue-songs.json gestrichen, Begruendung als Kommentar.
2. bin/wav.js:33 (STAND-Konstante → Kommentar), :104-105 (Lesen), :118/:123/:141 (Merker fuellen), :146/:150 (Schreiben), :157 (Meldung) — gestrichen.
3. docs/eichkasten/messlauf.js:12 — Pfad vorher-vektoren.
4. docs/eichkasten/namen-test.js:8 — Pfad vor-schritt2 (__dirname).
5. docs/eichkasten/ollama.js:1-11 — Herkunftskommentar (verschobene Datei).
6. web/index.html:20210-20215 — toter Kommentar PUT /api/messungen/gang berichtigt.
7. .gitignore:7-12 — Satz zu library/roh/ berichtigt (Durchlauffach, kein Neubau daraus).
Doku: docs/ERFUNDENES.md:31, docs/UEBERGABE.md:200-205, docs/BACKLOG.md:1376, docs/EINMESSEN.md:722-729, docs/GESCHICHTEN-RAUM-EICHKASTEN.md:13/:387, docs/eichkasten/LIESMICH.md:13/:16/+ollama-Zeile, docs/HANDARBEIT-PRUEFUNG.md (nachtlauf-Satz, ollama-Pfad).

## Nicht getan (mit Grund)

- PNG-Rueckfallzweige (bin/vorrechnen.js:121-128/:159-164/:263/:280-283/:300, server/server.js:219-230/:278, web/fremd/analyzer.js:5152-5167) NICHT gestrichen. Der Bericht sagt „cwebp wird damit Voraussetzung, was die Einrichtung schon sicherstellt" — das stimmt nicht: cwebp/webp kommt in keinem einrichten-*.sh/.command/.ps1, nicht im Dockerfile, nicht in START-HIER.md vor (grep leer); die Einrichtung prueft nur ffmpeg/ffprobe. Ohne Rueckfall bricht vorrechnen.js auf jedem frisch eingerichteten Rechner (Windows-Tester, Docker). Entscheidung noetig: cwebp in die Einrichtung (5 Skripte + Dockerfile + vorrechnen.js-Werkzeugpruefung :364) und DANN die Zweige raus — oder Zweige lassen. Die PNG-Dateien selbst sind weg (kein Leser braucht sie, alle 272 haben WebP).
- server/server.js:921 — Kommentar erwaehnt neue-songs.json (Vergangenheitsform, inhaltlich noch richtig); server.js war nur an den PNG-Stellen freigegeben, und die habe ich nicht angefasst.
- bin/karte.js:55/:67/:70/:74 und server/server.js:433 — Kommentare und eine Meldung erwaehnen library/entwurf/ (Ordner jetzt weg). Gehoert zum Bericht-Punkt „Schutz in karte.js:72-74 umbauen" (Haken karte-geschichten.json), nicht zur Liste.
- docs/eichkasten/karte-treue.js:12-14 — probiert library/entwurf/karte-geschichten.json als zweiten Ort (harmloser Rueckfall auf einen Ordner, den es nicht mehr gibt). Nicht angefasst, gehoert mit obigem Punkt zusammen.
- docs/NAECHSTER_CHAT.md:1424-1425, docs/GESCHICHTEN-RAUM-BILANZ.md:4/:141 — datierte Sitzungsprotokolle, die library/entwurf/ nennen; als Geschichte belassen.
- Vorschlag aus dem Bericht „.gitignore/paket.js um library/*.log ergaenzen" — nicht in der Liste, nicht gemacht. (paket.js schliesst library/ ohnehin ganz aus.)
- bin/wav.js als Ganzes (loeschen oder „ausser Betrieb") — nicht Teil der Liste.

## Zahlen

- Geloescht: 1002,9 MB (PNG 862,2 · kondensate/arbeit 90,9 · Instrumental-Backup 49,4 · Rest 0,4) in 272 + 122 + 2 + 9 Dateien = 405 Dateien, 2 Ordner (entwurf/, kondensate/arbeit/) samt ._-Beifang.
- Verschoben: 7 Dateien (2 messungen → docs/messungen/; 3 vorher-vektoren + vor-schritt2 + ollama.js → docs/eichkasten/), 2,7 MB.
- Geaenderte Codestellen: 7 (in 5 .js + index.html + .gitignore), dazu 8 Doku-Dateien.
- Syntax: node --check auf bin/sammeln.js, bin/wav.js, docs/eichkasten/messlauf.js, docs/eichkasten/namen-test.js, docs/eichkasten/ollama.js — alle OK.
