# History

> **Namenswechsel:** Das Projekt hieß bis zum 24.08.2026 *MySuno*. Es heißt jetzt **KlangTresor** — „Suno" ist seit dem 06.01.2026 eingetragene Marke von Suno Inc., ausdrücklich für Software zum Abspielen und Bearbeiten von Audioinhalten. Wo in Zitaten und in der Chronik noch der alte Name steht, bleibt er stehen.

Chronologie der Sitzung vom 17.08.2026 — Entscheidungen, Irrwege und was
sie gekostet haben. Zweck: nicht dieselben Wege zweimal gehen.

---

## Ausgangslage

Suno begrenzt ab September 2026 auf 60 Downloads pro Monat. Ziel: die
komplette veröffentlichte Historie lokal haben, monatlich erweiterbar,
mit einer Oberfläche im Heimnetz nach Art von Plex.

Vorhanden war `../SunoAnalyzer/` — ein Browser-Werkzeug, das Suno-Metadaten
aus der öffentlichen Songseite parst und die CDN-Adressen kennt. Das war
der Startpunkt und hat die halbe Recherche erspart.

---

## Was gebaut wurde, in Reihenfolge

1. **Zugang erkundet** — Clerk-Token, Endpunkte durchprobiert
2. **248 Songs gesammelt**, Metadaten und Lyrics
3. **Medien geladen** — MP3, Artwork, Lyric-Videos
4. **Katalog auf gepackte Datei umgestellt** (exFAT-Blockproblem)
5. **Server und Oberfläche** — Raster, Player, Detailansicht
6. **Autorendaten** — Profil, Statistiken, Klarname
7. **Video-Artworks nachgeholt** — 83 Stück, anfangs übersehen
8. **Wort-Zeitmarken** — 244 Songs, 98.815 Wörter
9. **Bühne** — Vollbild, mitlaufender Text
10. **Farbextraktion** — mehrere Anläufe, siehe unten
11. **Acht Visualisierungen** mit Web Audio API

---

## Die Irrwege

### is_public bedeutet nicht, was es scheint
Im Arbeitsbereich-Feed waren nur 31 von 1660 Clips als öffentlich
markiert. Daraus wurde geschlossen, die Historie stecke in den privaten
Clips — und über 2200 Clips zurückgesammelt. Tatsächlich lag die Antwort
im Profil-Endpunkt: 248, sauber abgegrenzt.
**Kosten:** rund 20 Minuten Sammellauf.
**Lehre:** Caspar_Ds Zahl (248 auf der Profilseite) war die verlässlichere
Quelle als das Datenfeld.

### video_cover_url übersehen
Beim Eindampfen der Suno-Antwort wurde `video_cover_url` weggeworfen —
das Feld mit Caspar_Ds **eigenen** hochgeladenen Video-Artworks. Aufgefallen
erst durch seine Frage „wo sind meine echten Videoartworks?".
**Kosten:** kompletter neuer Sammellauf über alle 248 Songs, ~35 Minuten.
**Lehre:** Beim Reduzieren von Fremddaten lieber zu viel behalten.

### Ein Suchmodell für eine Ähnlichkeitsaufgabe genommen
Der Geschichten-Raum lief zuerst mit **multilingual-e5** — dem
bekanntesten mehrsprachigen Einbetter. Ergebnis: „Autophagie" (über
Zellen) landete neben „Der Blogger" (über Datencenter), weil beide in
Systemvokabular reden. Caspar_Ds Nachfrage („die haben textlich nix
miteinander zu tun") führte zur Messung: Sämtliche Abstände lagen
zwischen **0,9232 und 0,9307** — acht Tausendstel für 257 Lieder. Darin
ist jede Nachbarschaft Zufall.

Der Grund ist die Trainingsaufgabe. **E5, BGE und GTE sind Suchmodelle**
(„finde das Dokument zu dieser Frage"), mit ungleichen Seiten und
Präfixen wie `query:`. Dort zählt nur die Reihenfolge, nicht der
Abstand. **Ähnlichkeitsmodelle** (`paraphrase-*`, LaBSE) sind auf „sind
diese zwei Texte dasselbe in anderen Worten" trainiert — beide Seiten
gleichrangig, kein Präfix.
**Und größer half nicht:** e5-base ordnete *schlechter* als e5-small und
fand nicht einmal die eigene zweite Fassung als nächsten Nachbarn. Auch
die unquantisierte Fassung lag falsch.
**Lehre:** Zwei Modelle können beide „mehrsprachige Textvektoren"
liefern und trotzdem für verschiedene Fragen gebaut sein. Der Unterschied
zeigt sich nicht am Modellsteckbrief, sondern erst, wenn man **die
Spreizung der Abstände** mißt.

### Eine Längengrenze gezogen, wo die Quelle keine hat
Der Filter für Sunos Regieangaben begrenzte auf 60 Zeichen — aus Sorge,
eine offene Klammer könnte den halben Text fressen. Damit blieben **388
der 4274 Klammern stehen**, darunter `[Verse 1 – Clean guitar arpeggios,
mid tempo, intimate bariton vocal]`. Eine Gruppe im Geschichten-Raum hieß
daraufhin „Drums · Outro · Slow".
Caspar_D: „regie steht in suno immer in eckigen klammern" — und damit war
die Regel so einfach, wie sie aussah.
**Lehre:** Eine Grenze zu ziehen, wo die Quelle keine hat, schafft keine
Sicherheit, sondern eine Lücke.

### Lyric-Videos für Standbilder gehalten
Aus Dateigröße und Datenrate wurde geschlossen, die `.mp4` seien Cover
plus Ton. Caspar_Ds Nachfrage führte zur Prüfung mit ffprobe und
Einzelbildern: Es sind vollwertige Lyric-Videos mit mitlaufendem Text.
**Lehre:** Nicht aus Kennzahlen auf Inhalt schließen, wenn man hinsehen
kann.

### Klassenname doppelt vergeben
Die CSS-Klasse `marke` gab es bereits für das Modell-Abzeichen auf den
Kacheln — `position:absolute; right:7px`. Die neue Textmarke im Liedtext
bekam denselben Namen und wurde an den rechten Rand geworfen.

### Kommafehler in der OKLab-Matrix
`0.2428592205` statt `2.4285922050`. Alle OKLab-Ergebnisse waren falsch,
sahen aber plausibel aus — Buntheitswerte bis 0,79, wo 0,32 das Maximum
ist. Fiel erst nach mehreren Bewertungsrunden auf.
**Folge:** `bin/farben.js` prüft die Umrechnung jetzt beim Start gegen
Weiß und Grau und bricht sonst ab.

### Interquartil statt absoluter Grenzen
Caspar_Ds Anweisung war „keine Töne nahe Schwarz und nahe Weiß". Umgesetzt
wurde ein Interquartilbereich — der bei dunklen Covern *selbst* das
Beinahe-Schwarz ist. Bei „Doppio passo" lagen von 59 kräftigen Pixeln
**null** im gefilterten Bereich.
**Lehre:** Relative Maße kehren bei schiefen Verteilungen ihre Bedeutung
um.

### Feste 40 Grad Trennschärfe
Funktionierte für Regenbogen-Cover, versagte bei „Doppio passo", wo 82,6 %
des farbigen Materials in einem 10-Grad-Sektor liegen. Caspar_Ds Einwand.
Ersetzt durch eine aus dem Bild abgeleitete Trennschärfe.

### Farbtonpentagramm
Aus einer Leitfarbe vier weitere im 72°-Abstand. Gebaut, weil 204 von 248
Covern als einfarbig gemessen wurden. Lieferte für ein Rotwein-Cover Grün,
Türkis und Magenta. Caspar_D: „das pentagramm ist falsch als generelle regel".
Ersatzlos entfernt.

### Auswahl nach Fläche statt Buntheit
Bei „Farben v2" — einem Regenbogen-Cover — wurden zweimal Rot und einmal
Blau gefunden, weil Rot die größte Fläche hat. Grün, Gelb und Cyan kamen
nie vor.

### Akzent nur nach Buntheit × Kontrast
Wählte bei „Farben v2" ein Grün mit 9 % Flächenanteil. Caspar_D: „grün ist es
definitiv nicht". Der Flächenanteil kam als dritter Faktor dazu.

### 64×64 abgetastet
Kleine kräftige Details verschwinden beim Verkleinern. Bei „Die
Gedanken ..." überlebte **kein einziges** rotes Pixel der Kameralinsen.
Caspar_Ds Vermutung, bestätigt durch Messung über fünf Auflösungen. Jetzt volle
Auflösung — kostet 280 statt 9 Sekunden für alle 248 Cover, findet dafür
in zwölf zusätzlichen Covern überhaupt Farben.

---

---

## Nachtrag, gleiche Sitzung

Nach der ersten Übergabe kamen noch dazu:

**Volle Auflösung bei der Farbabtastung** (siehe oben) — 18 statt 30
farblose Cover, deutlich kräftigere Paletten.

**Lautstärkeregler** mit quadratischer Kennlinie, Tastatur auf Pfeil
hoch/runter und `m`.

**Textversatz** für die Karaoke-Anzeige. Erwartet hätte man, dass die
Bluetooth-Verzögerung *späteren* Text verlangt — Caspar_D braucht mit AirPods
aber **−200 ms**, also einen Vorlauf. Deshalb steht die Richtung jetzt am
Regler statt in einer Regel.

**Alle Emoji durch monochrome SVG ersetzt.** Emoji bringen eigene Farben
mit und ignorieren die Coverpalette. 759 Symbole, Emoji in Songtiteln
bleiben.

### Der weiße Kasten vor dem Lautstärkeregler
Zwei Fehler übereinander, gemeldet von Caspar_D. Erstens fehlte den erzeugten
`<svg>` die `viewBox` — ohne sie wird nicht skaliert, sondern beschnitten;
bei 15 px blieb die linke obere Ecke des Lautsprechers übrig. In der Bühne
fiel es nicht auf, weil die Symbole dort 19–26 px groß sind. Zweitens
fehlte `background:none` für die Lautstärkegruppe, also stand dort der
helle Standardhintergrund eines `<button>`.
**Folge:** Beides ist jetzt global gelöst — `SYM()` gibt die viewBox immer
mit, und `button{background:none}` steht als Grundregel.
**Lehre:** Caspar_Ds erste Verortung („in der Bühne") war falsch, seine
Korrektur („in der album view") führte direkt zur Ursache. Bei
Fehlermeldungen zuerst klären, WO genau.

**Sunos Lyric-Videos verworfen.** 2,51 GB, 246 Dateien — mehr als die
Hälfte des Archivs. Caspar_Ds Begründung: Seit es die Karaoke-Bühne gibt,
machen sie keinen Sinn mehr. Die Bühne kann dasselbe wortgenau statt
zeilenweise, und die Zeitmarken sind als Daten da, nicht nur als fertiges
Bild. Archiv von 4,71 auf **2,21 GB**. Die Videomarke im Raster zeigt jetzt
nur noch die 83 eigenen Video-Artworks.

### Der Kopfbereich scrollte weg
`position:sticky` war gesetzt, wirkte aber nur bis zur Fensterhöhe: `body`
hatte `height:100%`, und ein sticky-Element klebt nur innerhalb der Box
seines Elternelements. Bei 1336 px Fensterhöhe und 6708 px Seitenlänge
fiel das erst weit unten auf. Gelöst mit `min-height` statt `height`.
**Lehre:** Wenn sticky „manchmal" funktioniert, ist fast immer die Höhe
eines Vorfahren die Ursache.

**Unbunt im Ruhezustand.** Auf Caspar_Ds Wunsch ist die Oberfläche reine
Graustufe, solange kein Song läuft — Farbe kommt erst mit der Musik. Betraf
auch den pulsierenden Rahmen, der ein fest eingebautes Pink hatte.

**Die Oberfläche folgt dem Song.** Die Coverpalette färbt nicht mehr nur
die Bühne, sondern Hintergrund, Flächen, Ränder und Akzente der ganzen
App, mit 0,8 s Blende beim Wechsel.

---

## 17.08.2026 — Erster git-Commit

Das Repo war seit `git init` ohne einen einzigen Commit. Vor dem
Nachholen stand die Frage, **was** hineingehört.

**Entscheidung: nur das Programm, keine Daten.** Ganz `library/` ist
ausgeschlossen — Katalog, Rohdaten, Sicherungen, Medien. Der Commit
umfasst 24 Dateien, 299 KB.

Caspar_Ds Begründung: Er will das Archiv später an andere weitergeben, damit
sie es installieren und benutzen können — seine Songs, Lyrics und
Statistiken sollen dabei nicht mitkommen. Da alles, was einmal committet
ist, dauerhaft in der Historie bleibt, fiel die Entscheidung vor dem
ersten Commit statt später unter Schmerzen.

**Ein eigenes Argument wurde dabei kassiert:** Erst hieß es,
`library/roh/` gehöre ins Repo, weil die Suno-Rohdaten unwiederbringlich
sind. Das ist ein Argument für *Datensicherung* — und ein git-Repo auf
derselben SSD ist keine. Sicherung gehört auf eine zweite Platte; sie
steht jetzt als dringender Punkt im Backlog.

**Was die Daten dadurch verlieren: nichts.** `library/backup/` hält die
letzten zehn Katalogfassungen, und aus `library/roh/` baut
`bin/aufbereiten.js` den Katalog vollständig neu.

Alles bleibt lokal. Kein GitHub, kein Konto, kein `push`. Branch heißt
weiterhin `master`.

**Lehre:** git ist nicht GitHub — ein Commit veröffentlicht nichts. Was
aber committet wird, entscheidet darüber, was später veröffentlicht
*werden könnte*. Deshalb gehört die Frage an den Anfang.

---

## 17.08.2026 — Playlists, private Songs, ID-Referenzierung

Das Archiv wächst von 248 auf **321 Songs**. Ausgelöst durch die Playlists:
Beim Einlesen zeigte sich, dass Caspar_Ds 25 Playlists 599 Einträge haben, von
denen 117 fremden Urhebern gehören und 73 eigene Songs sind, die **nicht**
veröffentlicht wurden. Caspar_Ds Entscheidung: alles Private nachladen, was in
einer Playlist steht, und Nichtveröffentlichtes durchgängig als solches
kennzeichnen.

### Der Lakritz-Fund

Caspar_D meldete, er sehe in einer Playlist ein „Lakritz" als öffentlich, finde
es aber nicht unter den publizierten Songs. Die Messung ergab **drei** Clips
mit „Lakritz" im Titel: einen unveröffentlichten vom 26.03.2026, einen
veröffentlichten vom 28.03.2026 und „Lakritz means LICORICE". Kein Fehler,
sondern eine Titel-Dublette — aber sie legte ein echtes Problem frei.

**Folge:** Titel taugen nicht als Bezug. 15 Titel kommen mehrfach vor und
betreffen 54 Songs. Drei Ereignisbehandlungen in der Oberfläche ermittelten
den Song bis dahin über die **Position** der Karte im Dokument. Das hielt
nur, solange DOM und Liste exakt gleich sortiert sind — und wäre gebrochen,
sobald eine Karte ausgeblendet wird, also spätestens in der Playlist-Ansicht.
Jetzt trägt jede Karte `data-id` mit Sunos Song-ID, und Adressen enthalten
`#song=<id>`.

**Lehre:** Wieder einmal steckte hinter Caspar_Ds Beobachtung ein echter Fehler —
nur nicht der, nach dem gefragt war.

### Ein eigenes Argument, zweimal kassiert

Erst hieß es, `/api/clip/<id>` liefere `video_cover_url` nicht, weil das Feld
bei allen 73 fehlte. Die Gegenprobe an einem Song, der nachweislich eines
hat („Kein Shutdown"), zeigte das Gegenteil: Das Feld ist da, es fehlt nur
bei Songs ohne eigenes Video-Artwork. Beinahe wäre eine falsche Warnung in
die Doku gewandert.

**Lehre:** Ein fehlendes Feld beweist nichts, solange man nicht an einem Fall
geprüft hat, in dem es vorhanden sein müsste.

### Weitere Befunde

**`page` zählt ab 1.** `page=0` und `page=1` liefern bei beiden
Playlist-Endpunkten dieselbe erste Seite. Beim ersten Durchlauf entstanden
dadurch 12 Dubletten.

**Die Playlist-Antworten sind abgespeckt.** Die dort eingebetteten
Clip-Objekte haben weniger Felder als der Einzelabruf — es fehlen
`video_cover_url`, `hook_preview_thumbnail_url`, `caption`, teils
`display_tags`, und die Lyrics. Als Metadatenquelle taugen sie nicht;
deshalb der eigene Sammellauf über `/api/clip/<id>`.

**Sechs Playlist-Einträge liefert Suno gar nicht aus**, obwohl der Zähler sie
mitzählt. Vermutlich gelöschte oder privat gestellte Clips.

---

## 18.08.2026 — SunoAnalyzer, erster Schritt

Der Analyzer ist angebunden, aber nur zur Hälfte des ursprünglichen
Ziels: Er öffnet sich in einem **eigenen Tab**, nicht als drittes Feld
in der Bühne. Der Umbau des Bühnenlayouts ist der größere Brocken und
wurde bewusst abgetrennt, damit der nutzbare Teil sofort steht.

**Die Kopie nach `web/analyzer.html` war keine Bequemlichkeit.** Erst
beim Nachsehen im Server zeigte sich, dass statische Dateien
ausschließlich aus `web/` kommen — und dass `/media/<id>/audio.wav`
für den Analyzer nur bei **gleichem Ursprung** erreichbar ist. Vom
`file://`-Ursprung aus blockt der Browser (CORS), vom iPhone wäre er
gar nicht zu erreichen. Caspar_Ds Entscheidung: Kopie, mit Hinweis auf das
Original in der Doku — wie bei `web/fremd/`.

**Der kleinste Eingriff war der richtige.** Statt einen eigenen
Analysepfad zu schreiben, reicht `analyzeUrl()` den geholten Ton als
`File`-Objekt an das vorhandene `analyzeFile()` weiter. Damit blieben
rund 40 Zeilen Aufräum- und Anzeigelogik ungedoppelt, die sonst bei der
nächsten Änderung auseinandergelaufen wären.

### Zwei Dinge fielen erst beim Hinsehen auf

**`analyzeFile()` benennt den Song in Elemente, die es nicht gibt.**
Es schreibt in `#song-title` und `#song-sub` — beide fehlen in dieser
Fassung des Analyzers, der Aufruf verpufft also. Auf dem Bildschirm
stand eine namenlose Analyse. Gefüllt wird jetzt der Kopfbereich, den
sonst `analyze()` benutzt.

**`.wav` fehlte in der Typtabelle des Servers** und ging als
`application/octet-stream` hinaus — **dieselbe Lücke, die dort schon
einmal `.webp` betraf** und die im Kommentar daneben festgehalten ist.
Über eine direkte Adresse fiel es nie auf, weil der Browser in die
Datei hineinsieht; über einen Blob mit diesem Typ spielt `<audio>`
nicht zuverlässig.

**Lehre:** Eine Lücke, die einmal in einer Tabelle steckte, steckt
wahrscheinlich noch ein zweites Mal darin. Der `.webp`-Kommentar
beschrieb den Fall genau — nachgesehen hat trotzdem niemand.

---

## 18.08.2026 — Der Analyzer wird ein Modus

Der erste Einbau war ein eigener Tab. Caspar_Ds Einspruch noch am selben
Tag: „der analyzer soll nicht mehr wie ein separates Tool aussehen, es
soll einfach ein weiterer Modus sein". Damit war der Tab-Weg hinfällig,
und die Frage nach iframe oder Einbau entschied sich von selbst — an
seiner zweiten Vorgabe: **„die hüllkurve muß synchron zum bühnenplayer
laufen"**.

Ein AudioContext lässt sich nicht über Dokumentgrenzen teilen. Mit
einem iframe hätte die Bühne Position UND Bandwerte 24-mal je Sekunde
hinüberschicken müssen, dazu Maus und Tastatur. Als Modul liest der
Analyzer schlicht dieselbe Zeit. Der Präzedenzfall stand im eigenen
Haus: Butterchurn und audioMotion bekommen ebenfalls keinen eigenen
Zugang zum Ton, sondern den vorhandenen Quellknoten.

**Der Analyzer war für die Synchronität längst gebaut.** 17 Spielköpfe
an einer rAF-Schleife, und das Mitwandern des Ausschnitts beim Zoom
existierte bereits. Zu tun war nicht „Synchronisation bauen", sondern
den Zeitgeber austauschen: zehn Stellen.

### Vier Fehler, die dabei ans Licht kamen

**`songDuration` wurde auf dem Dateiweg nie gesetzt** — das tat nur
`analyze()`, der Weg über die Suno-Songseite. Auf genau dem Weg, den
MySuno benutzt, waren damit alle Spielköpfe und der Zoom tot. Es fiel
nie auf, weil dort nie jemand abgespielt hat.

**Die Handler-Brücke war unvollständig.** Beim Umzug wurden nur
`onclick`, `onchange`, `oninput` und `onload` umgeschrieben —
`onmousedown` und `ontouchstart` nicht, und daran hängt der Sprung.

**Drei Wege nach draußen, nicht einer.** Die beiden
`checkDemucsServer()` abzuschalten genügte nicht: Ein
`detectDemucsURL()` lief beim Aufbau und ein `setTimeout` eine
Sekunde danach. Erst die Liste der tatsächlich gestellten Anfragen
zeigte sie. **Lehre:** „Wir rufen es nicht mehr auf" ist keine Abnahme.

**Der Kopf wurde gefüllt und gleich wieder gelöscht.**
`analyzeFile()` setzt alle Karten auf „—" zurück — und zwar nach dem
Füllen. Reihenfolge schlägt Absicht.

### Zwei verlorene Stunden aus demselben Grund

Erst hielt der Browser das Modul aus dem Cache fest: Der Server lieferte
`.js` mit einem Jahr Haltbarkeit, richtig für Butterchurn, tödlich für
eine Datei in Arbeit. Behoben mit `no-cache` plus `Last-Modified`;
seither antwortet er meist mit 304 und schickt keine Daten.

Der zweite Grund war banaler und kostete mehr: Die Prüfadresse
unterschied sich nur in der **Raute** (`#song=…`). Dabei lädt der
Browser das Dokument gar nicht neu — er springt nur. Die Bühne lief
minutenlang im alten Stand, während der Fehler längst behoben war.
**Lehre:** Wenn eine Änderung „nicht ankommt", zuerst nachsehen, ob die
Seite überhaupt neu geladen wurde.

---

## Muster, die sich durchziehen

**Caspar_Ds Beobachtungen waren durchweg belastbar.** In jedem Fall, in dem er
ein Ergebnis angezweifelt hat — die 16 statt 248 Songs, die fehlenden
Video-Artworks, die vermeintlichen Standbilder, der falsche Rahmen, das
Grün, die zwei Blautöne, die 40 Grad, die Abtastrate — steckte ein echter
Fehler dahinter.

**Messen schlägt vermuten.** Fast jeder Irrweg wurde durch eine kurze
Messung aufgeklärt, nicht durch Nachdenken. Das Diagnosewerkzeug
`bin/farbvergleich.js` ist aus genau diesem Bedarf entstanden und sollte
erhalten bleiben.

**Fehlermeldungen lesen.** Sunos HTTP 422 nennt die fehlenden Parameter
im Klartext. Das hat zweimal aus einer Sackgasse geholfen.

**Absolute vor relativen Schwellen**, wenn die Verteilung schief sein
kann. Zweimal in dieser Sitzung schiefgegangen.

---

## 18.08.2026, abends — Canvas nach SVG, Panel für Panel

Kriterium für die Umstellung: **Wird der Wert zu Geometrie oder zu
Farbe?** Höhe, Breite und Lage ergeben einen Pfad; Farbe je Bildpunkt
ergibt ein Bild. Bilder bleiben Canvas.

Danach vertragen es vier: Wellenform, Piano-Roll, Stereopanorama,
Stimmanalyse. Nicht: Fluktuation (8 × 57.505 Werte als Helligkeit),
die beiden Spektrogramme (Millionen Werte) und das Live-Spektrum (24
Bilder je Sekunde — SVG hieße DOM-Umbau in jedem Bild).

### 1 · Wellenform ✓

Sie ist die sichtbarste Fläche, und an ihr hängt der Spielkopf. Als
Canvas kostete **jeder Zoomschritt einen Durchgang über 14,7 Millionen
Abtastwerte**; als Pfad kostet er ein Attribut, weil
`spurSichtSetzen()` nur die `viewBox` verschiebt.

Gezeichnet wird deshalb einmal über den **ganzen** Song, nicht über den
Ausschnitt — sonst müsste doch wieder gerechnet werden. Aufgelöst auf
`SPUR_W` = 6000 Stützstellen; bei 32-fachem Zoom liegen davon noch 187
im Bild. Je Stützstelle die **Spitze** ihres Abschnitts, nicht ein
Stellvertreter — sonst verschwindet ein Knack von zwanzig
Millisekunden spurlos, derselbe Fehler wie einst bei 64×64 in der
Farbextraktion.

Aus dem `<canvas>` wurde ein `<div>` mit derselben Kennung. Das war
nötig, damit `seekMove()` weiter über `main-waveform-canvas` sein
Rechteck findet — der Klick in die Wellenform spult darüber.

Gemessen: 11.999 Punkte im Pfad, Zoom deckungsgleich mit den übrigen
Spuren (`1713.2 0 187.5`), Spielkopf und Klick unverändert.

### 2 · Piano-Roll ✓

Sie war der einfachste Fall, obwohl sie am kompliziertesten aussieht:
Die Balken entstanden ohnehin schon als **Läufe** — Folgen von Rahmen
mit demselben Halbton, mit Anfang, Ende und mittlerer Stabilität. Ein
Lauf ist ein Rechteck, und Rechtecke sind genau das, wofür ein
Pfadformat da ist. Gemessen an „Noch lachst Du": **366 Läufe**, 39
Rasterlinien.

**Die Stabilität ist jetzt Deckkraft, nicht eine zweite Farbe.** Sie
ist ein Grad, kein Gegensatz: kräftig und lang = getragene Note, blass
und kurz = Ornament.

**Die Notennamen liegen als HTML über dem SVG.** Im gestreckten
`viewBox` würde Text mitgezogen — dieselbe Lösung wie bei den
Bahnnamen der Befundspur. Gezeigt werden nur die C-Marken (C3, C4,
C5), positioniert in Prozent der Höhe, damit sie jede Streckung
mitmachen.

Auch hier wird über den **ganzen** Song gerechnet statt über den
Ausschnitt, sonst könnte der Zoom nicht über die `viewBox` laufen.

**Nebenbei:** Die beiden Auswahlfelder der Linienspuren (Gewichtsprofil
und Fensterlänge) stehen jetzt **unter** dem Diagramm statt in der
Titelzeile. Oben drückten sie den Titel zusammen und standen zwischen
Namen und Messwerten; unten sind sie das, was sie sind — eine
Einstellung zu dem, was darüber zu sehen ist.

### 3 · Stereopanorama ✓

Acht Bänder, jedes mit einer Mittellinie: nach oben die Überzahl des
linken Kanals, nach unten die des rechten. Der Wert wird zu **Höhe und
Richtung** — Geometrie, kein Bild. Gemessen: 16 Pfade (zwei je Band),
acht Mittellinien, acht Bandnamen als HTML darüber.

**Zwei Pfade je Band statt eines mit Beschnitt.** Das Vorzeichen trägt
die Farbe — orange nach oben für links, blau nach unten für rechts —,
und zwei Pfade sind billiger zu lesen als ein Pfad mit zwei
Beschnittmasken.

**Normiert wird je Band auf sein 95. Perzentil.** Der Bass ist fast
immer mono, die Höhen fast immer breit; mit einem gemeinsamen Maßstab
sähe man nur das. Das ist dieselbe Überlegung wie beim eigenen Maßstab
je Band in der Kaskade.

### 4 · Stimmanalyse ✓

Der kleinste der vier Fälle und deshalb der letzte: Fenster über den
Song, je zwei Werte — weiblicher und männlicher Anteil, gespiegelt um
eine Nulllinie. Zwei Rechtecke je Fenster. Gemessen: 334 Fenster, 747
Rechtecke.

**Die Formantaktivität liegt als Untergrund darunter**, ein Rechteck
je Fenster mit der Helligkeit als Wert. Damit sieht man, **worauf**
sich das Urteil stützt — ein Ausschlag ohne Formanten ist keiner.

### Damit sind vier von vier umgestellt

| | Elemente | Zoom |
|---|---|---|
| Wellenform | ein Pfad, 6000 Stützstellen | viewBox |
| Piano-Roll | 366 Rechtecke + 39 Linien | viewBox |
| Stereopanorama | 16 Pfade, 8 Mittellinien | viewBox |
| Stimmanalyse | 747 Rechtecke | viewBox |

Alle vier zeichnen über den **ganzen** Song und überlassen den
Ausschnitt der `viewBox` — kein Neuzeichnen mehr beim Zoomen. Die alten
Zeichenflächen bleiben im Markup, sind ausgeblendet und durch
`sichtbar()` von der Rechnung getrennt.

Canvas bleiben: die beiden Spektrogramme, die Fluktuation (8 × 57.505
Werte als Helligkeit) und das Live-Spektrum (24 Bilder je Sekunde).

### 5 · Die Fenstermitte durch alle Kurven gezogen ✓

Caspar_Ds Frage: „sind inzwischen alle Kurven auf Mitte des sliding window
referenziert?" Nachgesehen — **nein**, nur zwei Sorten waren es:

- die **Glättung** der Linienspuren (`kastenMittel` läuft von `i−halb`
  bis `i+halb`, NaN am Rand)
- die **Lautheitskurven** im Rechenkern (`fensterEnergienMitte`)

Nicht zentriert waren alle Reihen aus **nicht überlappenden Blöcken**.
Dort deckt Index i den Bereich `[i·d, (i+1)·d)` ab — der Wert
beschreibt die Blockmitte, gezeichnet wurde er am Blockanfang:

| Reihe | Block | Versatz |
|---|---|---|
| Signalenergie | 50 ms | 25 ms |
| Crest · Impulsdichte | 500 ms | 250 ms |
| FFT-Kurven | 4096 Werte | ~43 ms |

**Ein zweiter, feinerer Fehler steckte in derselben Zeile:**
`spurPfad` bildete Stützstelle *p* auf `p/(Punkte−1)` ab — erster Punkt
ganz links, letzter ganz rechts. Das ist die richtige Abbildung für
**Abtastwerte**, nicht für Blöcke, und sie streckt die Reihe zusätzlich
um einen Schritt.

Gerechnet wird jetzt aus dem tatsächlich abgedeckten Indexbereich: die
Mitte von `[a,b)`, bei Blockreihen plus ein halber Index. Die
Lautheitsspuren bekommen ausdrücklich `bloecke=false` — sie sind schon
im Kern zentriert, eine zweite halbe Blockbreite wäre ein neuer Fehler.

Dieselbe Korrektur in den vier neuen SVG-Spuren: Wellenform, Chroma und
Stereopanorama bilden auf die Bucketmitte ab. Die Piano-Roll nicht —
ihre Rechtecke sind **Intervalle**, keine Punkte, und liegen damit von
sich aus richtig.

### 6 · Gewichtsprofile als Symbol ✓

Statt der Wörter Rechteck, Dreieck, Kuppel, Glocke steht dort jetzt
**die Form selbst**, gezeichnet aus ihrem eigenen Profil: flach mit
harten Kanten, Zelt, Kosinusbogen, schmale Glocke mit Ausläufern. Ein
`<option>` kann kein SVG tragen, deshalb eine Knopfgruppe; der Name
bleibt im Tooltip.

Das ist die Regel „Formen statt Eigennamen" zu Ende gedacht — das
Symbol **ist** die Form, nicht eine Abstraktion davon.

**Und die Piano-Roll war zu schwach:** Balkenhöhe von 0,7 auf 0,9 der
Halbtonhöhe und mindestens 2,5 Einheiten (bei 38 Halbtönen auf 120 px
waren es sonst zwei Pixel), Deckkraft von 0,55 an statt von 0,30 — der
Unterschied zwischen getragener Note und Ornament soll sichtbar sein,
aber die blasse Hälfte darf nicht verschwinden.

## 19.08.2026 — Der Zoom rechnete alles doppelt

### Der Befund
Gemessen im laufenden Analysemodus: ein Zoomschritt kostete **240 bis
330 ms**, unter Last über eine Sekunde. Beim Abspielen mit Zoom wandert
der Ausschnitt mit, gedrosselt auf zehnmal je Sekunde — bei 240 ms je
Durchlauf ist das keine Drosselung mehr, sondern Dauerlast.

Die Ursache stand als Kommentar direkt daneben. `redrawAllCharts()`
begann mit

```js
spurSichtSetzen();               // nur ein Attribut, kein Neubau
if(window._chartData&&window._chartData.fft) linienSpurenZeichnen();
```

Die erste Zeile sagt, dass der Zoom ein Attribut ist. Die zweite baute
trotzdem alle sechzehn Spuren neu — und mit ihr die Wellenform, Chroma,
Stereo, Stimme und die Funken. Sechs Zeichenfunktionen, deren Ergebnis
danach Pixel für Pixel dasselbe war.

**Warum es dasselbe war:** Die SVG-Spuren zeichnen in feste
`0..SPUR_W`-Koordinaten über die **ganze** Reihe. Den Ausschnitt
schneidet `spurSichtSetzen()` mit der `viewBox` heraus. Genau dafür war
die Umstellung auf SVG gemacht worden — nur hatte der Zoompfad nie
aufgehört, den alten Weg mitzugehen.

### Ein Kommentar, der seit der Umstellung log
In `spurPfad()` stand:

> Der Ausschnitt kommt aus der gemeinsamen Sicht — dieselbe
> viewStart/viewEnd, die auch alle anderen Diagramme benutzen.

Zwei Zeilen darunter: `var n=reihe.length, vonI=0, bisI=n;` — also die
ganze Reihe, kein Ausschnitt. Der Satz stammte aus der Zeit vor der
`viewBox` und war seither falsch. Er ist der Grund, warum die doppelte
Rechnung so lange plausibel aussah: Wer ihn las, musste glauben, der
Pfad hänge am Zoom.

**Lehre:** Ein Kommentar, der eine Abhängigkeit behauptet, ist eine
Behauptung über den Code — und veraltet genauso wie der Code. Beim
Umbau eines Zeichenwegs gehören die Kommentare zum Umbau.

### Die Wache stand nicht an jeder Tür
`linienSpurenZeichnen()` hatte keine `sichtbar()`-Prüfung; sie setzte
`display` sogar aktiv zurück. Die Abklemm-Regel vom Vortag reichte
damit bis zu den sechzehn Spuren und dort nicht weiter.

Die Wache steht jetzt **einmal** am Kopf der Funktion, nicht sechzehnmal
in der Schleife: Ein `offsetParent`-Zugriff erzwingt Stil und Layout,
und zwischen zwei Durchläufen steht ein `innerHTML`. Je Spur zu fragen
hieße, sechzehnmal ein Layout zu erzwingen, das gerade ungültig gemacht
wurde — die Wache wäre teurer als die Arbeit, die sie spart. Ist der
Wirt verdeckt, sind es ohnehin alle sechzehn.

### Gegenprobe
Derselbe Song („Kaputte Systeme"), fünf Läufe je Stufe, Median:

| Zoom | vorher | nachher |
|---|---|---|
| 1× | 331 ms | **219 ms** |
| 4× | 240 ms | **58 ms** |
| 16× | 232 ms | **33 ms** |

Bei 16× das Siebenfache. Bei 1× nur ein Drittel weniger — dort tragen
die beiden Spektrogramme den Rest, und die sind echte Bilddaten.

Abnahme an einem zufällig gewählten Song: alle Spuren gefüllt, keine
leere Fläche, Formenzahl vor und nach dem Zoom gleich (65), `viewBox`
wandert von `0 0 6000 44` auf `186.7 0 375 44`, Profil- und
Fensterwechsel bauen weiterhin neu auf.

### Vorher entfernt, dann geprüft — nicht umgekehrt
Sechs Aufrufe zu streichen heißt nur dann sparen, wenn jede Funktion
einen zweiten Aufrufer hat, der beim **Eintreffen der Daten** greift.
Das wurde vor dem Eingriff nachgezählt, Funktion für Funktion. Ohne
diesen Nachweis wäre es kein Sparen gewesen, sondern ein Verschwinden.

## 19.08.2026 — Der zweite Player, und wie er lebendig wurde

### Was passiert ist
Das Live-Spektrum sollte nach oben wandern. Beim Prüfen war die Fläche
**schwarz** — null von 45.000 Bildpunkten. Ursache: `drawSpectrum()`
wurde nur aus `analyze()` gerufen, dem Weg über die Suno-Songseite.
MySuno geht den Katalogweg. **Dieselbe Lücke zum fünften Mal** — nach
`currentMeta`, `songDuration`, `_audioSamples` und `_katalogDaten`.

Die Reparatur war richtig gedacht und falsch ausgeführt: Ich habe den
Aufruf nach `startWorkerAnalysis()` verschoben, wo beide Wege
durchkommen. Damit wurde ein bis dahin **toter Zweig** lebendig:

```js
window._mediaSource = ktx.createMediaElementSource(player);
window._mediaSource.connect(an);
an.connect(ktx.destination);          // ← eigener Ausgang
```

`player` war `#sa-player`, das versteckte Audioelement aus der Zeit, als
der Analyzer eine eigene Seite war. Ergebnis: **zwei Wiedergaben
nebeneinander**, unabhängig steuerbar. Caspar_D hat es sofort gesehen.

### Die Regel
> **Es darf nur eine Audioquelle geben. Der Player auf der Albumseite
> ist die Quelle, alles, aber auch wirklich alles hängt daran.**
> (Caspar_D, 19.08.2026)

Das galt schon für Butterchurn und audioMotion — sie bekommen
`hörer.quelle` gereicht, weil pro Audioelement nur **ein**
`createMediaElementSource` erlaubt ist. Der Analyzer war die Ausnahme,
und zwar nur deshalb, weil seine Ausnahme nie ausgeführt wurde.

### Was daraus folgte
`#sa-player` ist ersatzlos gestrichen, mit allem, was daran hing: der
eigene Transport, die eigene Lautstärke, vier Ereignisbindungen, drei
`src`-Zuweisungen, `__SA.player`. Die Rückfälle in `ZEIT/LAEUFT/SPRUNG`
zeigten ebenfalls auf ihn — sie liefern jetzt `0`, `false` und nichts.

**Ein Rückfall, der sich selbst eine Tonquelle baut, ist kein
Rückfall.** Er ist ein zweiter Zustand, der irgendwann eintritt und den
niemand geprüft hat. Wer den Analyzer einbettet, muss die Auskünfte
reichen — sonst steht er still. Stillstand ist ein Zustand, den man
sieht; eine zweite Wiedergabe nicht.

Neu dazu: `umschalten` als vierte Auskunft, damit der ▶-Knopf auf der
Wellenform den einen Player schaltet statt einen eigenen.

### Ein Meßfehler auf dem Weg
Zwischendurch schien `messen()` in der Bühne nur Nullen zu liefern —
also hätte auch der Hörer keinen Ton mehr bekommen. Die Gegenprobe mit
einem frisch angehängten Analyser an derselben Quelle ergab 84.742. Der
Graph war nie unterbrochen; die Nullen kamen aus der Art, wie ich
gemessen hatte.

**Lehre:** Eine Messung, die eine zweite Katastrophe behauptet, wird
gegengeprüft, bevor sie gemeldet wird. Sonst repariert man das
Meßgerät.

### Was ich falsch gemacht habe, unabhängig vom Code
Ich habe einen zentralen Weg umgebaut, ohne vorher Bescheid zu sagen.
Der Fehler war nicht, dass die Verschiebung riskant war — er war, dass
Caspar_D es am laufenden System bemerken musste, statt es vorher zu wissen.
**Bei Eingriffen in Tonpfad, Player oder Datenfluss vorher ansagen, was
angefasst wird.**

### Das Live-Spektrum bekommt zwei Kanäle

Links nach oben, rechts nach unten, beide von derselben Mittellinie.
Das **Bevölkerungspyramiden-Prinzip** geht hier von selbst auf: Beide
Hälften wachsen *von* der Achse *weg*, können sich also nie überlagern
und nie als eine Kurve gelesen werden — genau der Fehler, an dem die
gespiegelten Lautheitskurven am 18.08.2026 gescheitert waren.

Farben nach Hausregel: `#f97b14` oben ist links, `#4b93f0` unten ist
rechts — dieselbe Zuordnung wie im Stereopanorama und im
Stereo-Spektrogramm.

**Ein Teiler, zwei Analyser, kein zweiter Ausgang.** Der Graph hängt an
`hörer.quelle`, wie alles andere auch; an `ctx.destination` gehört ein
Analyser nicht.

#### Die Summe darf nicht aus Bytes gemittelt werden
`getByteFrequencyData` liefert eine auf 0..255 gestreckte **Dezibel**-
Skala. Zwei davon zu mitteln wäre der Mittelwert zweier Logarithmen,
also der Logarithmus des geometrischen Mittels — dieselbe Klasse Fehler
wie das Stapeln von Dezibel. Gerechnet wird deshalb über die Amplitude:

```js
var byteZuAmp = b => Math.pow(10, (b/255*dbSpanne + dbMin)/20);
summe = ampZuByte((byteZuAmp(fdL[b]) + byteZuAmp(fdR[b])) / 2);
```

`minDecibels`/`maxDecibels` des Analysers sind die Enden der Strecke —
sie werden gelesen, nicht angenommen.

#### Der Umschalter
Symbole statt Wörter, unter dem Diagramm wie die Profilwahl der Spuren:
Balken auf einer Grundlinie gegen Balken beiderseits einer Mittellinie.
Das ist genau der Unterschied, um den es geht. Er wirkt sofort — die
Zeichenschleife liest den Modus in jedem Bild, es wird nichts neu
aufgebaut.

Die Farbe sagt in beiden Fassungen nur, **wo** man ist, nie zwei Dinge
zugleich: gespiegelt nach oben/unten (Kanal), in der Summe nach
links/rechts (Frequenz, orange bassig bis blau luftig wie beim
Frequenzgewicht). Der Titel nennt jeweils die geltende Lesart.

Gegenprobe an „Erste Liebe": gespiegelt 32.958 orange Punkte
ausschließlich oberhalb, 31.830 blaue ausschließlich unterhalb der
Mittellinie — keine Überlappung. In der Summe läuft die Farbe waagerecht
über die volle Höhe.

#### Weiße Spitzen statt aufgehellter
Der erste Versuch verschob die Grundfarben um 45 % zu Weiß, damit die
Spitze noch als ihr Kanal lesbar bleibt. Zu wenig: Über Orange ist ein
helles Orange kaum zu sehen, und der Saum ist dünn.

**Welcher Kanal es ist, sagt ohnehin die Seite** — oben oder unten. Die
Farbe darf hier also etwas anderes sagen, nämlich „das ist der
Unterschied". Dafür ist Weiß auf beiden Seiten richtig: eine Farbe für
eine Bedeutung, unabhängig davon, wo sie steht.

Der frühere Einwand gegen Weiß („das weiss ist zu weiss") galt zwölf
breiten Chromabändern. Hier sind es Säume von wenigen Bildpunkten —
gemessen 4,7 % der bemalten Fläche.

#### Und ein Fehler in meinem Prüfstand
Caspar_D sah zu und meldete: **das gespielte Lied passt nicht zum gezeigten
Artwork.** Er hatte recht, und es lag nicht am Programm, sondern an mir.
Mein Zufallsschnipsel rief `buehneAuf(id)` — das öffnet die Bühne für
eine ID, **startet aber keinen Song.** Gespielt wurde weiter der
vorherige. Gemessen: `audio.src` trug `7a395c22…`, die Bühne zeigte
`0b1014c4…`.

Der Schnipsel in `NAECHSTER_CHAT.md` ruft jetzt zuerst
`spielenNachId(id)`, und die Gegenprobe steht daneben: `audio.src` muss
dieselbe ID tragen wie `bSong.id`.

**Lehre:** Ein Prüfstand, der einen Zustand herstellt, den es im Betrieb
nicht gibt, prüft nichts — er erzeugt Befunde. Wer eine Ansicht öffnet,
muss auch den Zustand herstellen, für den sie gedacht ist.

### Der Tonhöhenverlauf war nicht zu blass, er war zu schmal

Zweimal war hier nachgebessert worden — Balkenhöhe 0,7 → 0,9, Deckkraft
0,30 → 0,55 — und beide Male half es kaum. Caspar_D am 19.08.2026: „ist
insgesamt zu schwach". Diesmal erst gemessen.

**Der Befund:** 2.580 Läufe, Medianbreite **eine SVG-Einheit**. Der Pfad
läuft über 6.000 Einheiten auf 1.173 px Fläche — eine Einheit sind
0,196 px. **91,5 % aller Balken waren schmaler als ein Bildpunkt.**

Und damit half die Deckkraft nicht: Der Browser wirft einen
Fünftel-Pixel breiten Balken nicht weg, er rechnet ihn anteilig aus — er
kommt mit einem Fünftel seiner Deckkraft an. Wer dann die Deckkraft
verdoppelt, verdoppelt ein Fünftel.

**Das Mindestmaß stand in der falschen Einheit.** `Math.max(1, x2-x1)`
meinte „mindestens ein Pixel" und war „mindestens eine SVG-Einheit" —
hier ein Faktor fünf. Dieselbe Klasse Fehler wie eine Strichstärke ohne
`non-scaling-stroke`, nur andersherum.

Ein festes Mindestmaß in SVG-Einheiten scheidet aus: Bei 32-fachem Zoom
wäre daraus ein Klotz. **Die Lösung gehört in den Bildraum.** Jeder Lauf
ist jetzt eine `<line>` mit

```
stroke-width="3" stroke-linecap="square" vector-effect="non-scaling-stroke"
```

Die Strichstärke — hier die Balkenhöhe — gilt damit in
Bildschirmpunkten, unabhängig vom Zoom. Und `linecap="square"`
verlängert jede Linie um eine halbe Strichstärke an jedem Ende,
**ebenfalls in Bildschirmpunkten**. Ein Lauf von einem Fünftel Pixel
wird zu einem Quadrat von Balkenhöhe — sichtbar, ohne dass die Daten
breiter gemacht wurden, als sie sind.

**Gegenprobe** an „Im Club - Er steht", 11.537 Läufe: Farbfläche von
6.799 auf 107.352 px², Faktor 15,8. Bei 16-fachem Zoom trägt die Kappe
3 px zu 0,63 px Datenbreite bei — sie bleibt eine Zugabe und übernimmt
nie. Bei 1× trägt sie alles, und genau dort war die Spur unsichtbar.

**Regel:** Ein Mindestmaß, das Sichtbarkeit garantieren soll, gehört in
Bildschirmpunkte. In Datenkoordinaten ist es beim einen Zoom zu klein
und beim anderen zu groß.

### Die Spektrogramme: derselbe Fehler auf der anderen Achse

Caspar_D: „das gleiche Kontrastproblem haben wir auch in den
FFT-Spektrogrammen". Es waren zwei Ursachen, und die zweite war die
größere.

#### 1 · Vier Fünftel der Frequenzbänder wurden nie angesehen
Die **waagerechte** Achse nahm längst das Maximum über alle Bilder einer
Spalte — mit der ausdrücklichen Begründung, ein Knack von zwanzig
Millisekunden dürfe nicht in ein übersprungenes Bild fallen. Für die
**senkrechte** galt dasselbe Argument, nur hatte es niemand angewandt:
Je Bildzeile stand ein einziges Band, das nächstgelegene.

Gemessen bei fftSize 1024: von 512 Bändern wurden **103** angesehen,
**409 nie**. Bis zu 19 Bänder fielen auf eine Zeile und wurden durch
eines vertreten. Ein schmaler Pfeifton zwischen zwei Stützstellen war
spurlos weg.

Jetzt deckt jede Zeile einen Bandbereich ab (gerechnet über die
Zeilenkanten, nicht die Mitte, sonst blieben Bänder zwischen zwei Zeilen
übrig) und zeigt dessen Größtwert. **Erst normieren, dann das größte
nehmen** — die Streckung ist je Band eigen, roh zu vergleichen ließe
Bänder mit hohem Grundpegel immer gewinnen.

Im Stereo-Spektrogramm wird über beide Achsen zusammengefasst: gesucht
ist die lauteste Stelle des abgedeckten Rechtecks, ihre Seitenlage wird
gezeigt. Ein Mittelwert über Seitenlagen wäre sinnlos — links und rechts
heben sich darin auf.

#### 2 · Die Tonwerte waren falsch eingeteilt
Die Streckung lief über p5 → p90 → p95. Damit landeten **85 % aller
Werte in der unteren Hälfte** der Skala, dem Graukeil, und nur die
obersten 10 % bekamen überhaupt Farbe. Gemessen: 93,7 % der Bildpunkte
unter mittlerer Helligkeit, das obere Drittel der Tonwerte **leer**
(0,1 %).

Ein Bild, das neun Zehntel seiner Daten in ein Drittel seines
Tonwertumfangs presst, ist nicht dunkel gemeint — es ist schlecht
eingeteilt. Der Mittelpunkt liegt jetzt beim **oberen Quartil**. Die
Enden bleiben: p5 ist das Tor gegen das Grundrauschen, p95 die Klippe —
beide sagen etwas über die Daten, der Mittelpunkt sagt nur etwas über
die Einteilung.

**Gemessen am selben Song:** mittlere Helligkeit 65,7 → 71,5, Anteil
heller Punkte 36,9 % → 41,6 %; in der Tonwertverteilung wächst die
Klasse 96–128 von 30,8 % auf 40,8 %.

### Wo das Signal an die Decke stößt

Caspar_Ds Frage: ob das Spektrogramm auch zeigen kann, wo mit Abschneiden zu
rechnen ist.

**Der naheliegende Gedanke war falsch.** Die FFT-Werte sind Bytes, 255
wäre die Decke — gemessen über 38.962 Bilder mal 512 Bänder ist der
größte vorkommende Wert aber **204**. Der Worker rechnet
`(20*log10(mag)+80)/80`, und ein einzelnes Frequenzband erreicht nie
Vollausschlag; die Energie verteilt sich ja auf alle. Eine Markierung auf
255 wäre nie erschienen.

Abgeschnitten wird nicht im Spektrum, sondern in der **Zeit** — und
dafür liegen die Reihen längst vor, in 100-ms-Schritten auf derselben
Achse: `spitzeVerlauf` und `clipVerlauf`. Oben im Bild steht jetzt ein
drei Punkte hohes Band:

| | |
|---|---|
| **weiß** | tatsächlich abgeschnitten, Abtastwerte am Anschlag |
| **pink** | kein Abschneiden, aber unter 1 dB Luft — beim Kodieren nach MP3 oder AAC kann daraus eines werden |

Steht nirgends weniger als 1 dB Luft an, sagt das die Titelzeile
ausdrücklich. Das ist der häufige Fall: Von den geprüften Songs lag
keiner darüber, True Peak −3,8 bzw. −5,4 dBTP.

Das Band kommt aus der `norm`-Nachricht, das Bild aus der `fft`-
Nachricht. Trifft die Norm später ein, wird einmal neu gezeichnet —
billig, weil `pufferFlaeche` den fertigen Puffer hält. Derselbe Griff
wie bei der Befundspur, die auf die Struktur-Nachricht wartet.

Abgenommen mit untergeschobenen Werten: pink 234–327 px bei erwarteten
235–328, weiß 703–750 bei erwarteten 704–751.

### Das Stereo-Spektrogramm log über die Schieflage

Caspar_D: „ich sehe blau sowieso sehr unterrepräsentiert". Gemessen an
„Königskinder": In den **Daten** stehen links zu rechts wie **1,19 zu
1**, im **Bild** wie **4,09 zu 1**.

**Zwei Ursachen, beide meine.**

#### Sieger nimmt alles
Beim Zusammenfassen über Frequenzbänder hatte ich die Seitenlage der
**lautesten** Stelle des Rechtecks gezeigt. Bei knappem Vorsprung kippte
damit die ganze Zelle, und aus einer leichten Schieflage wurde eine
deutliche.

Jetzt zwei getrennte Fragen mit zwei getrennten Antworten:

| | Frage | Antwort |
|---|---|---|
| **Helligkeit** | ist hier überhaupt etwas? | Größtwert — der kurze Knack überlebt |
| **Farbe** | wo sitzt es? | mit der Amplitude gewichtetes Mittel |

Ein lautes Band bestimmt die Farbe weiterhin, aber es löscht die anderen
nicht mehr aus.

**Gewichtet wird über die Amplitude, nicht über das Byte.** Die Frames
tragen `(20*log10(mag)+80)/80`, also Dezibel; damit zu wiegen wäre
Wiegen mit Logarithmen. Eine Tabelle mit 256 Einträgen kostet nichts und
macht es richtig.

#### Ein anderes Blau
Gezeichnet wurde mit `(255,140,0)` und `(0,80,255)` — nicht die
Hausfarben. Das alte Blau hat eine relative Leuchtdichte von 0,142, das
Suno-Blau `#4b93f0` von 0,286: **doppelt so hell.** Vier Diagramme, die
dasselbe meinen — Stereopanorama, Stereospur, gespiegeltes Live-Spektrum
und dieses hier — tragen jetzt dieselben Farben.

Gegenprobe an denselben Bildpunkten: vorher `4,41,128`, jetzt
`41,75,121` — das Verhältnis 0,31 : 0,61 : 1,0 ist genau `#4b93f0`.

#### Was bleibt
Am selben Song sinkt das Verhältnis der Farbmengen von **5,49 auf
4,38**, bei einem fairen Bezug (amplitudengewichteter Anteil) von
**1,97**. Der Rest ist keine Verzerrung mehr, sondern die Natur einer
vorzeichenbehafteten Anzeige: Innerhalb einer Zelle heben sich links und
rechts auf, und übrig bleibt, wer überwiegt. Eine Zelle mit knappem
Übergewicht wird dunkel gezeichnet, nicht kräftig — wer Bildpunkte
zählt, statt Farbmengen zu wiegen, überschätzt sie trotzdem.

#### Drei falsche Messungen auf dem Weg
Ich habe an diesem einen Diagramm dreimal die falsche Zahl gemessen,
bevor die richtige dastand: erst Bildpunkte gezählt statt Farbmenge
gewogen; dann „kräftige Punkte" auf Farbtreue geprüft und in Wahrheit
die **Achsenbeschriftung** vermessen (11 Notenlinien mal 1173 px sind
20.000 graue Punkte); dann Abweichungen gefunden, die von der
**Glättung beim Skalieren** stammten, nicht von der Farbe.

**Lehre:** Wer ein Bild misst, misst zuerst alles, was darin steht —
Achsen, Raster, Beschriftung, Zwischenwerte der Skalierung. Die Maske
gehört vor die Messung, nicht danach.

### Vorbereitung: der Nachrichtenverarbeiter bekommt einen Namen

Die 246 Zeilen, die die Nachrichten des Rechenkerns auswerten, hingen als
anonyme Funktion am Worker und waren damit nur **einmal** erreichbar:
während gerechnet wurde. Wer den Analysemodus verließ und zurückkam,
mußte alles neu rechnen lassen.

Jetzt heißt sie `nachrichtVerarbeiten(msg, live)`, und die Nachrichten
werden mitgeschnitten. Der Plan: Beim zweiten Aufruf desselben Songs wird
der Mitschnitt durch **dieselbe Funktion gespielt** statt neu gerechnet.
Das ist der entscheidende Punkt — es entsteht kein zweiter Zeichenweg,
der auseinanderlaufen könnte.

Aus dem Umzug ergab sich genau eine Abhängigkeit: Die Funktion benutzte
`sr` aus der umgebenden Funktion. `currentSR` steht im selben Zustand am
Modulrand und wird jetzt gelesen.

### Was Rechnen kostet und was Laden kosten würde

Caspar_Ds Frage: „ist das Laden genauso aufwendig wie das Rechnen?"

Gemessen an „Ulrich & Ännchen", 278 s Spielzeit:

| | |
|---|---|
| **Rechnen** (Worker, alle Phasen) | **8,6 s** |
| **Zeichnen** (davon Spektrogramme 7,3 s) | **8,3 s** |
| Ergebnis im Speicher | 51,1 MB |
| davon rohe FFT-Bilder | **92 %** |
| Serialisieren | 190 ms |
| **Zurückdeuten beim Laden** | **0 ms** |

Das Zurückdeuten kostet nichts, weil typisierte Reihen nur **Sichten**
auf einen Puffer sind: Wer die Bytes hat, hat die Daten. Es wird nichts
geparst, nichts kopiert.

Damit ist die Antwort klar: **Laden ist nicht annähernd so teuer wie
Rechnen** — 51 MB von einer SSD sind rund 0,1 s gegen 8,6 s.

**Aber Laden allein spart nur die Hälfte.** Die andere Hälfte ist das
Zeichnen der beiden Spektrogramme. Auch das läßt sich speichern, denn
das Ergebnis ist ein Bild:

| | roh | PNG | WebP |
|---|---|---|---|
| Spektrogramm 16384×180 | 11,3 MB | 2,81 MB / 7,0 s | **1,02 MB / 0,45 s** |
| Stereo 16384×180 | 11,3 MB | 4,40 MB / 7,0 s | **1,26 MB / 0,51 s** |

Zurückgelesen in 196 bzw. 141 ms. PNG scheidet aus — sieben Sekunden
zum Schreiben.

**Rechnung je Song:** 4,3 MB Reihen (die rohen FFT-Bilder werden nicht
gebraucht, sie dienten nur dem Zeichnen) plus 2,3 MB Bilder = **6,6 MB**.
Für 321 Songs **rund 2 GB** — neben 22 GB Medien nicht der Rede wert.

**Aus 16,9 s würden rund 0,4 s.**

#### Ein Meßfehler, der die Zahl vervierfacht hätte
Meine erste Aufstellung sagte, die Rohbilder seien 46 % der Datenmenge.
Der Filter war `/frames/` — und `stereoFrames` trägt ein **großes F**.
Es sind 92 %. Die falsche Zahl hätte zu einer ganz anderen Entscheidung
geführt: 16 GB statt 2.

## 19.08.2026, nachts — Die Ablage vorgerechneter Analysen

Aus **rund 40 s** (8,6 s rechnen, 8,3 s zeichnen, dazu Dekodieren und
fünf FFT-Runden) werden **2,0 s**. Gemessen an „Mittwochs 20:00 Uhr":
`Aus der Ablage · 2004 ms`.

### Der Aufbau
- **Server:** `PUT /analyse/<uuid>.<bin|spektro.webp|stereo.webp>`,
  `GET` dazu, und `/api/analyse` sagt in **einer** Anfrage, welche Songs
  vollständig vorliegen — nicht 321 Anfragen.
- **Ablage:** `library/analyse/`, je Song **11,7 MB** (9,6 MB Reihen,
  1,0 + 1,1 MB Spektrogramme als WebP). Für 321 Songs rund **3,7 GB**.
- **Format:** `[4 B Kopflänge][Kopf als JSON][Füllbytes bis 8][Reihen]`.
  Der Kopf ist der Mitschnitt der Worker-Nachrichten, in dem jede
  typisierte Reihe durch `{__r: Nummer}` ersetzt ist.

**Abgespielt wird durch dieselbe Funktion, die auch live zeichnet.** Es
gibt keinen zweiten Zeichenweg, der auseinanderlaufen könnte.

### Sechs Fallen, alle im Format
1. **Ausrichtung.** Ein `Float32Array` braucht einen durch 4 teilbaren
   Versatz. Ohne Auffüllen: „start offset should be a multiple of 4".
2. **Fünf Runden.** Der Rechenkern schickt fünf FFT-Durchgänge mit je
   vollem Kurvensatz. Alle aufzuheben ergab 30 MB — der Server sagte
   413. Jetzt je Art nur die letzte.
3. **Bänder sind Arrays von Reihen.** `bandFlux`, `massstab`, `lBands`,
   `rBands` sind je 7–8 typisierte Reihen. JSON macht daraus Objekte mit
   durchnummerierten Schlüsseln: **Kopf 22,5 MB bei 6,5 MB echten Daten.**
4. **NaN und Unendlich überleben JSON nicht** — beide werden `null`.
   Traf `momentanMax`/`kurzMax`; `null.toFixed()` riss den Ladeweg mit,
   und der Song wurde still neu gerechnet.
5. **Zahlen-Arrays mit NaN darin** — dasselbe eine Ebene tiefer. Jetzt
   binär als `Float32Array`, beim Auspacken wieder ein Array.
6. **Weggelassene Objekte sind kein leeres Feld, sondern eine Falle.**
   Kleine verschachtelte Objekte (Tonart, Abschnitte) gehen jetzt mit,
   bis 64 KB.

### Was nicht gespeichert wird
Die rohen FFT-Bilder — 92 % der Datenmenge, und nur zum **Malen**
gebraucht. Gespeichert wird das fertige Bild. Beim Abspielen wird der
Puffer daraus eingesetzt, bevor gezeichnet wird, und die beiden
Zeichenfunktionen nehmen dann den Weg „nur zeigen".

### Eine Spur statt Vermutungen
Beim Bauen habe ich **viermal** geraten, warum nichts geschrieben wird —
jedes Mal falsch. Erst die Meldung mit Größe, dann die Spur
(`window._ablageSpur`), dann der Stapel im Fehlerfall haben es jeweils
in einem Blick gezeigt. Alle drei bleiben drin; sie kosten nichts.

Die vierte Fehlvermutung war die lehrreichste: Ich hielt es für einen
Schreibfehler, dabei war die Analyse nach 26 s schlicht **noch nicht
fertig** — der erste Entwurf schrieb nach einer festen Frist von 1,5 s
nach der Schlussnachricht, während die Spektrogramm-Puffer erst acht
Sekunden später entstehen. Jetzt wird an beiden Enden angeklopft, und
wer zuletzt kommt, findet alles vor.

### Der Anzeigefehler: zweimal derselbe Denkfehler
Beim Abspielen blieben beide Spektrogramme leer. Es waren zwei
Ursachen, und beide hingen daran, dass ich Code auf die **Anwesenheit
der Rohdaten** hatte prüfen lassen, statt auf das, was er wirklich
braucht.

**1 · Der falsche Name.** Ich suchte im Mitschnitt nach einer Nachricht
vom Typ `fft` — sie heißt `fft_partial`, auch die letzte Runde. Damit
blieb die Bildzahl null und die beiden WebP wurden nie geladen. Der
Name stand die ganze Zeit in meiner eigenen Messung („Arten: norm,
scalars, …, **fft_partial**"). Ich hatte ihn gelesen und nicht
verbunden.

**2 · Die Bedingung sprang ab, wenn es etwas zu zeigen gab.**
`if(msg.stereoFrames){ … drawStereoSpectro(…) }` — beim Abspielen gibt
es keine `stereoFrames`, wohl aber das fertige Bild. Die Funktion mit
ihrem Weg „nur zeigen" wurde also genau dann übersprungen, wenn sie
gebraucht wurde.

**Regel daraus:** Eine Bedingung, die den Aufruf einer Zeichenfunktion
schützt, darf nicht am *Rohstoff* hängen, sondern am *Ergebnis*. Ob die
Funktion etwas zu tun hat, weiß sie selbst am besten.

**Gegenprobe:** Spektrogramm 91,8 % bemalt, Stereo 47,5 %, Fluktuation
93,4 %, `Aus der Ablage · 2397 ms`, kein Fehler.

### Die Karten: drei Blöcke statt einer Halde

35 Karten standen in einem Raster — Lautheit neben Plays, True Peak
neben Modell. Das ist nicht unordentlich, sondern **irreführend**: Die
eine Sorte ist aus dem Ton gerechnet und nachprüfbar, die andere aus dem
Katalog abgeschrieben und sagt über den Klang nichts. (Caspar_D: „damit
abgeschriebene Entitäten sich nicht mehr mit Ergebnissen vermischen.")

| Block | Karten |
|---|---|
| **Pegel und Lautheit** — gemessen | 9 |
| **Klang, Tempo und Tonart** — gemessen | 19 |
| **Aus dem Katalog** — abgeschrieben, nicht gemessen | 7 |

#### Drei Anläufe, drei verschiedene Fehler
**1 · Ein Schnitt mitten im Tag.** Ich hatte das Ende des Kartenbereichs
über `s.index('</div>', …)` bestimmt — das erste `</div>` nach
`id="v-symmetry"` schließt aber die *Wertzelle*, nicht die Karte. Der
Rest der Zeile blieb als **sichtbarer Text** im Bild stehen
(`div class="lbl">Energie-Form`), und beim Aufräumen habe ich zwei
schließende Tags zu viel entfernt. Zurück auf den letzten Commit und
zeilengenau neu — Textmanipulation an Markup gehört auf ganze Zeilen.

**2 · `grid-column:1/-1` genügte nicht.** `#sa-karten` ist **ein**
Raster mit auto-fill-Spalten, in das alle Karten fließen
(`.grid{display:contents}` löst die inneren Raster auf). Die drei
Kopfzeilen wurden darin zu drei nebeneinanderstehenden Spaltenköpfen,
und die Karten liefen geschlossen dahinter. Die Reihenfolge im Markup
war richtig — das Raster hielt sich nicht daran. Jetzt trägt **jeder
Block seinen eigenen Behälter** mit derselben Spaltenregel im Innern.

**3 · Der Zusatz klebte am Kopf.** „Pegel und Lautheit**gemessen**" —
der Abstand kam aus `margin-left`, und ein Abstand aus dem Stil ist beim
Kopieren und beim Vorlesen nicht da. Der Gedankenstrich steht jetzt im
**Text**.

**Regel:** Was zwei Dinge trennt, gehört in den Text, nicht in den
Abstand.

### WebP: der Encoder fehlte, das Werkzeug lag daneben

Für die vorgerechneten Spektrogramme sollte WebP her — 1,0 gegen 2,8 MB
beim Spektrogramm, 1,3 gegen 4,4 beim Stereobild. Der Weg dahin war
länger als gedacht, und jeder Schritt hat etwas gelehrt.

#### 1 · ffmpeg kann WebP schreiben, aber nicht erzeugen
Der erste Lauf schrieb **gar nichts** und meldete für jeden Song:

```
Unknown encoder 'libwebp'
```

Das Homebrew-ffmpeg 9.0.1 ist ohne `--enable-libwebp` gebaut. Es bringt
den WebP-**Muxer** mit (`ffmpeg -formats` zeigt `E webp`), aber keinen
WebP-**Encoder** (`ffmpeg -encoders` zeigt ihn nicht). Die beiden sind
verschiedene Dinge, und die Formatliste beantwortet die Frage nicht, die
man stellt.

**Lehre:** Wer prüft, ob ein Werkzeug ein Format schreiben kann, muß die
**Encoder** abfragen, nicht die Formate.

#### 2 · Der Umweg über PNG war die falsche Antwort
Ich bin auf PNG ausgewichen — verlustfrei, überall vorhanden, aber
7,2 statt 2,3 MB je Song und spürbar langsamer beim Packen. Für 321
Songs wären das 5,4 statt 3,7 GB gewesen.

#### 3 · `cwebp` lag die ganze Zeit daneben
`brew list` zeigte `webp 1.4.0` — das Paket war längst installiert,
`/usr/local/bin/cwebp` also da. Es liest **PPM von der
Standardeingabe**, und einen PPM-Kopf schreibt man in drei Zeilen
selbst:

```js
const kopf = Buffer.from(`P6\n${breite} ${hoehe}\n255\n`, 'ascii');
```

Damit braucht die Bildseite **gar kein ffmpeg mehr** — nur noch der Ton.
Ein Prozeß weniger, ein Format weniger, und P6 trägt drei Bytes je Punkt
statt vier: Unser Alphakanal ist überall 255, es fällt also nichts weg.

**Lehre:** Bevor man einem Werkzeug etwas beibringt, nachsehen, was
schon installiert ist. `brew list` hätte die zwei Stunden gespart.

#### 4 · WebP kann nicht breiter als 16383
Dann brach `cwebp` ab:

```
Invalid 16384x180 dimension for PNM
```

`PUFFER_MAX` stand auf 16384 — genau **einen Punkt** über der Grenze des
WebP-Formats. Der Browser hatte das nie gemeldet, weil `canvas.toBlob`
still ein leeres Ergebnis liefert statt zu klagen; erst Node, das die
Datei selbst schreibt, hat es gesagt.

Jetzt 16383. An der Auflösung ändert das nichts: Bei 32-fachem Zoom
liegen immer noch über 500 Punkte im Ausschnitt.

**Lehre:** Eine Zahl, die zufällig eine Zweierpotenz ist, ist deshalb
noch keine erlaubte Größe. Formatgrenzen sind selten rund.

#### Was dabei herauskam

| | PNG | WebP |
|---|---|---|
| Spektrogramm | 2,80 MB | **1,13 MB** |
| Stereo-Spektrogramm | 4,38 MB | **1,21 MB** |
| je Song mit Meßreihen | 14,8 MB | **10,0 MB** |
| 321 Songs | 4,8 GB | **3,2 GB** |

Der Analyzer liest **beide** Endungen — die 161 Songs, die der
PNG-Lauf geschafft hat, bleiben gültig und werden nicht neu gerechnet.
Geladen wird ein WebP-Song in 1,9 s.

Die Rechenzeit ändert sich übrigens **nicht**: 169 s je Song mit WebP
gegen 166 s mit PNG. Der Engpaß ist nicht das Packen des Bildes,
sondern die Analyse und das Ausrechnen der Bildpunkte.

## 19.08.2026 — Warum Node neunmal langsamer war als der Browser

Caspar_D: „warum dauert es eigentlich 3 min pro Song, im Analyser on the
fly war es doch viel schneller?" Browser 17 s, Node 166 s — und ich
hatte angenommen, die Bilder oder das WebP seien es. Gemessen:

| | |
|---|---|
| Ton dekodieren | 0,7 s |
| **Rechenkern** | **223,8 s** |
| Perzentile, beide Bilder, WebP, Verpacken | zusammen 0,9 s |

Alles, was ich verdächtigt hatte, war nichts. Die Bremse saß allein im
Rechenkern — **derselbe Code, der im Browser 8,6 s braucht.** Faktor 26.

**Die Ursache: `vm.runInContext`.** Ich hatte den Kern in einer
Sandbox laufen lassen — nach dem Muster von `bin/pruefe-lautheit.js`,
wo es nicht auffiel, weil dort nur Sekunden gerechnet werden. In der
Sandbox optimiert V8 Schleifen über typisierte Arrays schlecht, und die
FFT besteht aus nichts anderem. Derselbe Kern, mit `new Function` im
Hauptkontext geladen: **25 s.** Neunmal schneller, ohne eine Zeile am
Kern zu ändern.

**Lehre:** Messen, bevor man verdächtigt. Ich hätte das WebP-Packen
„optimiert" und nichts gewonnen. Und: `vm.runInContext` ist für
Abschottung da, nicht für Rechenarbeit.

Dann Caspar_Ds Anschluß: „teilst du das auf mehrere Threads auf?" — ja,
aber **erst nach dem Fix**, sonst parallelisiert man die Bremse. 321
unabhängige Songs: ein Kindprozeß je Kern (höchstens sechs, einer
bleibt für Server und Oberfläche). Je Song 45 s seriell, mit dem
laufenden Morgenlauf daneben; parallel entsprechend weniger Wanduhr.

### Die Tonart: ein Bin-Raster, das immer F# sagte

Beim Bau des Analyse-Index fiel auf: `fft_partial.key` sagte für
**298 von 321 Songs „F# Dur"** und für keinen Moll. Die frühere
Schätzung `scalars.key` streute plausibel (170 Moll, 151 Dur).

**Ursache:** Das Chroma je Frame wird mit fftSize 1024 gerechnet —
**43 Hz je Bin** bei 44,1 kHz. Ein Halbton bei 100 Hz ist 6 Hz breit,
bei 3000 Hz 180 Hz. Welche Halbtöne die Bins treffen, hängt allein von
den 43 Hz ab: Bin 2 → F, Bin 3 → C, Bin 4 → F, Bin 5 → A … Bei jedem
Song dasselbe Muster, F# = 1,00, C# ≈ 0,75, A# ≈ 0,5 — ein Artefakt des
Rasters, kein Ton. Gemessen an drei Songs: identischer Chroma-Umriß.
Die gute Schätzung nimmt 4096 (10,8 Hz je Bin) und ist fein genug.

**Caspar_D:** „den Major-Minor-Test müssen wir natürlich machen und bei der
Vorberechnung der Songs korrigieren."

**Repariert:** Die Tonart ist jetzt `schaetzeTonart(ch, sr)` — eine
eigene Funktion mit 4096er-FFT, die `fft_partial` nur noch weiterreicht.
Das Chroma je Frame bleibt für Chroma-Spur und Piano-Roll; dort zählt
Zeitauflösung, nicht Tonhöhe.

**Geprüft** in `bin/pruefe-lautheit.js` mit Tonleitern aus Sinustönen
— C Dur, A Moll, E Dur, G Moll, F# Dur, D# Moll: sechs von sechs, und
die zweite Wahl jeweils die musikalisch naheliegende (C → G, A Moll →
C Dur). An sechs echten Songs identisch mit der alten guten Schätzung.

**Ein Meßfehler unterwegs:** Mein erster Vergleich an echten Songs
wich überall ab. Ich hatte 44,1 kHz angenommen — die WAVs sind 48. Der
Kern war nie betroffen, er bekommt die Rate vom Aufrufer. Lehre: Eine
Abtastrate nimmt man nicht an, man liest sie.

Die Ablage braucht keinen Neulauf — `scalars.key` war richtig, der
Index liest genau das. Der Analyzer zeigt ab sofort die richtige
Tonart.

---

## 24.08.2026 — Das alte Tonartverfahren ausgebaut

Ausgebaut wurde `schaetzeTonart()` samt allem, was daran hing. Damit
das, was beim Bauen gelernt wurde, nicht mit verschwindet — es ist
teuer bezahlt und würde sonst in ein paar Jahren neu erarbeitet:

### Warum 4096 und nicht 1024

Am 19.08.2026 meldeten **298 von 321 Songs „F# Dur"**. Ursache war das
lineare Bin-Raster der FFT über der logarithmischen Tonleiter: Bei
`fftSize 1024` deckt **ein Bin im Bass elf Halbtöne** ab. Dort wird
nicht gemessen, sondern gerundet. Mit 4096 verschwand die Dominanz.

Dieselbe Falle traf später das Chroma-Bild und Caspar_Ds Beobachtung
„warum ist das F so überrepräsentiert" — behoben, indem bei **jeder
Halbtonfrequenz** einzeln gemessen wird (Goertzel), statt ein Raster
darüberzulegen.

### Warum die Beträge addiert werden, nicht die Signale

Wer zwei Kanäle zusammenfassen will, darf **nicht** `(L+R)/2` rechnen:
Gegenphasige Anteile löschen sich dabei aus, und was hart auf einer
Seite liegt, verschwindet. Addiert werden die **Beträge im Spektrum** —
dort gibt es keine Phase mehr, dort kann sich nichts aufheben.

Gemessen an 14 Songs: Bei **„Die Lilie der Nacht"** liefert der linke
Kanal G Moll, der rechte C Dur. Einkanalmessung ist dort ein Münzwurf.

### Warum das ganze Verfahren trotzdem weg musste

Auch mit 4096 und beiden Kanälen bleibt es eine Krumhansl-Korrelation
über das Chroma des **Vollmix**. `bin/analyse-index.js` hielt fest:

> Trifft an echter Musik **1 von 20** gegen Caspar_Ds eigene Angabe im
> Stil-Prompt. Das Chroma addiert jedes FFT-Fach, davon rund 70 %
> Grundrauschen; das Ergebnis hängt an der Abtastrate der Datei statt
> an der Musik.

Ersetzt durch `bin/toene.js`: Grundton aus dem **Bass auf Sunos Eins**
— er spielt dort fast immer den Grundton —, Tongeschlecht aus der
**gezählten Terz**. Fehlt die Terz (bei Powerchords die Regel), steht
nur der Grundton da.

### Die Lehre aus dem Ausbau selbst

Ein Wächter sollte die alte Tonart „nachziehen" und lief dabei mitten
in der Morgenroutine mit — 43 Ablagen wurden umgeschrieben, bevor
auffiel, dass er eine **unbrauchbare Zahl gegen eine andere
unbrauchbare** tauschte. Zwei Regeln daraus:

1. **Bevor man einen Wert repariert, prüft man, ob ihn jemand liest.**
   Die Antwort stand in derselben Datei, zwei Zeilen über dem Eintrag,
   der am selben Nachmittag nachgeschlagen wurde.
2. **Ein Automatismus, der Daten umschreibt, gehört angekündigt** — und
   nicht nebenbei in einen fremden Ablauf gehängt.
