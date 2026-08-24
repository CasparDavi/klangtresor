# Morgenroutine II — Plan vom 21.08.2026 (Bauauftrag für den nächsten Chat)

Caspar_Ds Bild, am Morgen des 21.08. im Gespräch entwickelt („ja, das ist
mein Bild"). NOCH NICHTS GEBAUT. Kontext: Tonstudio ist fertig (siehe
TONSTUDIO.md, HAUSREGELN.md); das nächste Projekt ist das musikalische
Clustering — und es soll in die Morgenroutine.

## 1. Die Auswahlliste vor dem roten Knopf

Vor dem Start zeigt der rote Knopf eine Liste mit Kreuzen (Hausstil:
Pillen, keine Checkboxen!), normalerweise alles an; Abwahlen werden
gemerkt. Jeder Punkt mit Klartext-Untertitel. DREI GRUPPEN nach
Zugang — sie machen die Arbeitsteilung Lesezeichen/Server sichtbar:

**A. Mit Login — nur über die Lesezeichen-Ernte** (der Server hat kein
Token und darf keins haben; diese Kreuze heißen „verwerte die Ernte").
Kopfzeile: Ernte-Status im Klartext („Ernte von 08:41, 34 Min alt" /
„keine frische Ernte — in Suno das Lesezeichen drücken").
- Profil- und Privatdaten einweben (Follower, private Songs, Zähler)
- Suno-Zeitanker v2/v3 einweben/nachfordern
- WAV-Originale (falls der Download Login braucht — IM CODE PRÜFEN)

**B. Öffentlich von Suno — kann der Server selbst** (Netz, kein Token;
das bekommt auch ein Fremdnutzer ohne Lesezeichen):
- Öffentliche Zähler aktualisieren
- Kommentare sichern (reaktionen.js — Zugangsart PRÜFEN)
- MP3, Cover, Videos laden (eigenes Kreuz: kostet Netz und Platz)

**C. Lokal — nur der Mac** (läuft offline, nachts, ohne Suno):
- Songs analysieren (BPM, Tonart, Lautheit, Bandprofil, Histogramm,
  Suchindex) = vorrechnen + analyse-index + eq-profil
- Karaoke-Zeitanker mit Whisper (nur neue Songs mit Text; Instrumentals
  und Fokus-Wanderung bleiben draußen; danach Lyrics-Abgleich; ~3 min/Song)
- Musikstil vermessen (NEU, s. 3.)
- Musik-Karte erstellen (NEU, s. 3.)
- Archiv-Export aktualisieren (USB/TV; standardmäßig AUS)

Abhängigkeiten sichtbar machen: abgewähltes „Medien laden" graut
„Musikstil/Whisper" für neue Songs aus (mit Satz warum); Karte braucht
Musikstil + Analyse. Vor dem Bau: im Code verifizieren, welcher
Skriptschritt welchen Zugang wirklich braucht — die Liste muss stimmen.

## 2. Der Suno-Alias (Caspar_Ds Ergänzung)

Heute gibt es KEINEN eingestellten Alias: der Handle kommt implizit aus
der Profil-Ernte / profil.handle; sammeln.js bekommt ihn als Argument.
Plan:
- `library/konfig.json` mit dem Handle (eine Datei, exFAT). Öffentliche
  Schritte ziehen daraus.
- Im Kopf des Dialogs: „Sammlung von @caspar_d · ändern". Beim
  allerersten Start die Einrichtungsfrage „Wie heißt du bei Suno?" mit
  Prüfung gegen die öffentliche Profil-API (Avatar, Anzeigename,
  Songzahl zur Bestätigung).
- Der Wächter: trägt die Lesezeichen-Ernte einen anderen Handle als die
  Einstellung → NICHT einweben, sondern fragen („Ernte von @x, Sammlung
  von @caspar_d — verwerfen oder Alias wechseln?"). aufbereiten sortiert
  fremde SONGS aus, aber nicht fremde NUTZER — das ist die Lücke.
Dialogkopf also: Alias · Ernte-Status · Datum, darunter drei Gruppen.

## 3. Musikstil und Karte — IM HAUS, mit Node

Entscheidung des Morgens: KEIN Python, kein Torch, kein Browser-Tab.
Der alte SunoAnalyzer (Entwicklung/SunoAnalyzer/suno_analyzer.html)
fuhr Essentias Discogs-EffNet bereits als ONNX mit onnxruntime-web:
`discogs-effnet-bsdynamic-1.onnx` + `mtg_jamendo_instrument-discogs-
effnet-1.onnx`, Modelle auf caspardavi.github.io/suno-analyzer/models/,
Mel-Pipeline 128 Bänder, Patches [1,128,96] (75 % Überlappung), Ausgabe
1280-dim-Embedding (zweiter Output). Das portieren wir:
- `bin/klang.js` mit **onnxruntime-node** (Intel-macOS-Wheels
  vorhanden), Audio direkt aus den WAVs (kein MP3-Decoder nötig), Mel
  1:1 aus dem Analyzer-JS, Strategie 3 Fenster bei 10/45/80 % der
  Länge, je Song gemitteltes Embedding + Top-Tags der Jamendo-Köpfe
  (Genre, Mood/Theme, Instrumente — Instrumente laut Caspar_D mitnehmen?
  OFFEN, er hatte sie in der Bühne stillgelegt).
- Modelle lokal nach `web/fremd/modelle/` bzw. `bin/modelle/` (Essentia-
  Zoo, CC BY-NC-SA — privat ok): EffNet + Genre- + Mood/Theme- (+
  Instrument-)Kopf als ONNX.
- Ergebnis: `library/klang.json` (eine Datei; je Song Embedding gerundet
  ~9 KB, Tags, Stand; ~3 MB gesamt). Rechnet nur Fehlendes nach.
- Karte: `bin/karte.js` — umap-js (zwei Läufe: 5D zum Clustern, 2D zur
  Karte), HDBSCAN-JS oder agglomerativ als Gegenprobe, Noise dem
  nächsten Zentroid; Namen aus den Jamendo-Köpfen (Genre und Mood
  getrennt); Ausgabe `library/karte.json` (songs: id, x, y auf 0–1,
  cluster, label, tags, conf; clusters: label, farbe).
- Anzeige: Klangkarte als eigene Ansicht nach HAUSREGELN (Punkte mit
  Halo, Cluster-Inseln, Legende zeigt statt beschreibt); Stilgruppen-
  Preset im EQ aus den Cluster-Mitteln der 8-Band-Profile (Backlog
  seit 20.08. eingelöst).
- CLAP bleibt optionaler Bonus für freie Textfragen (Recherche in
  CLUSTERING-RECHERCHE.md; Plan A/torch wäre über ~/demucs-env/torch
  2.2.2 belegt lauffähig, wird aber nicht gebraucht).

## 4. Lehren des Morgens

- **Der Mac schläft nachts** — Whisper stand von 2 bis 9 Uhr bei Song
  149/253. Jeder Nachtlauf braucht `caffeinate -i` (in die Whisper-
  Kette und die Morgenroutine-Langläufer einbauen). Whisper lief am
  21.08. morgens weiter; Rest ~105 Songs ≈ 5 h; Ergebnisse webt der
  nächste aufbereiten-Lauf ein.
- Datumsfehler korrigiert: die EQ/Blaster/Kompressor-Runde war der
  20.08., die Nacht danach der 21.08. (Doku + Kommentare am 21.08.
  vormittags bereinigt).
- ~/demucs-env hat torch 2.2.2 (Python 3.9) lauffähig — Bernstein,
  nicht anfassen.

## 5. Reihenfolge für den Bau

1. ERLEDIGT 21.08.: Zugangsarten verifiziert — Kommentare, Zähler,
   MP3/Cover/Video UND WAV sind öffentlich (WAV liegt offen auf dem
   CDN, sobald es in Suno einmal als Download erzeugt wurde);
   Zeitanker v2/v3 brauchen das Bearer-Token → Gruppe A.
2. ERLEDIGT 21.08. (Server + Dialog): library/konfig.json via
   GET/PUT /api/konfig; /api/profil-pruefen (öffentlich: Name, Avatar,
   Songs, Follower); Alias-Zeile im Morgen-Dialog mit Einrichtungsfrage
   („Das bin ich") und „ändern"; Ernte-Wächter im /api/morgen/roh
   (409 + Klartext, das Lesezeichen zeigt die Meldung). Der Alias ist
   bewusst noch NICHT gesetzt — Caspar_D drückt „Das bin ich" selbst; ab
   dann greift der Wächter.
3. ERLEDIGT 21.08.: Auswahldialog. Drei Spalten im Morgen-Dialog
   (#morgenauswahl, MORGEN_KREUZE in index.html): Mit Login (nur
   Status der Lesezeichen-Ernte + Pflichtposten „einweben"; Zeitanker
   im Gruppentext), Öffentlich (Kommentare, Medien), Lokal (Katalog =
   Pflicht, Analyse, Whisper, eine gedimmte „Bald:“-Zeile). Runde
   Pillen mit Haken; Abwahlen in localStorage 'mysuno-morgen-aus';
   POST /api/morgen/start {aus:[…]}; Server loggt „abgewählt: …“.
   Whisper ist jetzt ein Morgenschritt (bin/whisper.js --still, unter
   caffeinate -i) und wird übersprungen, wenn schon ein whisper.js
   läuft (pgrep mit [b]-Trick gegen Selbsttreffer). Bei „Nichts
   geändert“ heißt der Knopf „Trotzdem nachziehen“ — die lokalen
   Schritte haben ja trotzdem Arbeit. /api/morgen/ernte-stand liefert
   Alter der letzten Ernte in Minuten.
4. caffeinate in Whisper-Kette/Langläufer (der Morgenschritt hat es
   schon; der Handstart `node bin/whisper.js --alle` noch nicht).
5. ERLEDIGT 21.08.: bin/klang.js. onnxruntime-node als einzige
   Abhängigkeit (package.json; node_modules auf 70 MB gestutzt:
   fremde Plattform-Binaries, tar & Co. raus — exFAT-1-MB-Cluster
   machen aus npm-Kleinstdateien sonst 1,4 GB). Modelle in
   library/modelle/ (EffNet 18 MB + drei Jamendo-Köpfe + JSON-
   Klassenlisten von essentia.upf.edu). WICHTIG: Vorverarbeitung aus
   dem Essentia-C++-Quellcode abgelesen — 96 Mel-Bänder (Slaney,
   unit_tri) × 128 Frames, log10(1+10000x); der alte SunoAnalyzer
   hatte 128×96 (Achsen vertauscht) und HTK-Mel — seine Werte waren
   nicht vergleichbar, ein Gegenmessen gegen ihn wäre sinnlos
   gewesen. Bonus: das EffNet liefert selbst 400 Discogs-Stile.
   Probe „Labskaus-Klaus" (Prompt: Maritime NDH, Akkordeon/Fiddle)
   → Gothic/Folk Metal, Volksmusik, energisch/fröhlich. 6–10 s je
   Song; Lauf neueste zuerst (Caspar_D). Morgenschritt 'musikstil'.
6. IN ARBEIT 21.08.: bin/karte.js (agglomerativ/Kosinus + Silhouette,
   UMAP gesät, Gruppennamen, Erdung, 8 Nachbarn + Dichte je Song) und
   Register „Karte" als STERNENHIMMEL (Caspar_Ds Bild): Helligkeit/Größe
   = Nachbardichte, additive Gauß-Glut im Canvas ('lighter'), Hover
   zeigt Nachbarn, Klick spielt. Offen: Clustering-Verfahren (Caspar_D
   will es als Omics-Analyst selbst mitentscheiden — erstmal
   Standard), UMAP-Parameter (Inseln vs. Kontinuum), Palette,
   Stilgruppen-Preset im EQ, Morgenschritt 'karte'.
