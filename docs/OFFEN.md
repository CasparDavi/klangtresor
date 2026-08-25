# Offen

> **Namenswechsel:** Das Projekt hieß bis zum 24.08.2026 *MySuno*. Es heißt jetzt **KlangTresor** — „Suno" ist seit dem 06.01.2026 eingetragene Marke von Suno Inc., ausdrücklich für Software zum Abspielen und Bearbeiten von Audioinhalten. Wo in Zitaten und in der Chronik noch der alte Name steht, bleibt er stehen.

Stand 24.08.2026. Aufgeschrieben, weil Caspar_D Aufträge mehrfach geben
musste — teils weil ich sie übersehen habe, teils weil ich behauptet
habe, sie seien erledigt, ohne sie im Bild zu prüfen.

Reihenfolge: erst was falsch ist, dann was fehlt, dann was besprochen,
aber nie entschieden wurde.

---

## 1. Falsch oder unvollständig

### 1.1 Frequenzbandbeschriftung — ERLEDIGT 24.08.

Der Grund war ärgerlich: Sie stand im **Rückfallzweig**, der nur läuft,
wenn gar keine Banddaten vorliegen — und der endet mit `return`, bevor
der eigentliche Zeichenweg beginnt. Deshalb fand ein grep sie, das Auge
aber nie. Zusätzlich hätte sie am falschen Band gestanden, weil die
Daten invertiert laufen (`drawRow = nBands-1-b`).

Im Bild nachgemessen: alle acht Bänder beschriftet, Bass unten, Höhen
oben, 10,5 px statt 8 (unter der Lesegrenze), rund 8:1 Kontrast.

<details><summary>ursprünglicher Befund</summary>
**Mehrfach angefordert.** Die acht Bandnamen (20–40 Hz bis 2500–20 kHz)
sollen im Bild stehen.

Im Code sind sie da: seit dem Umbau bei 0,62 Deckung, zuletzt gezeichnet
und mit dunklem Grund darunter (`analyzer.js`, Suche nach `bandNames[bl]`).
Caspar_D sieht sie trotzdem nicht.

Ich habe die Änderung **nie im Bild geprüft** — der Browser hing am
Trennlauf, und ich habe es dabei belassen.
</details>

### 1.2 Titel der Notenzonen — ERLEDIGT 24.08.

Steht jetzt an beiden Stellen (vorgerechnet und live) in Caspar_Ds
Wortlaut; der Ablage-Fassung fehlte „bei den Halbtonfrequenzen
gemessen" bisher ganz. Zwei Entscheidungen dazu: **Taktschläge** statt
„Takte", weil das die gezählte Größe ist — und Zonenzahl wie
Herkunftsangabe bleiben draußen, damit der Titel ein Satz bleibt.

<details><summary>ursprünglicher Befund</summary>
**Gewünscht:**

```
Tonverteilung je Notenzone · bei den Halbtonfrequenzen gemessen ·
Raster aus dem Bass · Takte mit Vierteln xx % · mit Achteln xx % ·
mit Sechzehnteln xx %
```

**Aktuell:** `Tonverteilung je Notenzone aus dem Bass — 1025 Zonen ·
vorgerechnet · 65 % der Taktschläge aus Vierteln, 12 % aus Achteln,
23 % aus Sechzehnteln`

Drei Abweichungen: „aus dem Bass" gehört nicht in den Namen, sondern als
eigenes Glied dahinter; „bei den Halbtonfrequenzen gemessen" fehlt in der
vorgerechneten Fassung; und die Anteile heißen „Takte mit Vierteln", nicht
„der Taktschläge aus Vierteln".

Ich hatte „Spezifikation weiter nach vorne ziehen" als „in den Namen
ziehen" missverstanden.
</details>

### 1.3 exFAT verschwendet bei den Notenzonen das Sechzehnfache — ERLEDIGT 24.08.

Die Notenzonen liegen jetzt in **einer** Sammeldatei
`library/notenzonen.json`, wie klang.json und toene.json auch. Der Server
schneidet den einen Song heraus, den der Browser braucht, und hält die
Datei nach Zeitstempel im Speicher. 20 MB statt 321.

<details><summary>ursprünglicher Befund</summary>
Die Platte hat **1 MB Blockgröße**. Jede Notenzonendatei ist 65 KB und
belegt trotzdem 1 MB. Bei 321 Songs: **321 MB statt 20**.

Die Auslagerung in Einzeldateien war richtig gedacht (20 MB in
`toene.json` will niemand beim Seitenaufbau laden), aber auf diesem
Dateisystem falsch umgesetzt. Möglichkeiten:

- eine Sammeldatei `library/notenzonen.json`, die der Browser **nach**
  dem ersten Bild nachlädt statt beim Aufbau
- die Zonen als kompaktes Binärformat in **eine** Datei mit Index
- Bytes statt JSON-Zahlen (spart etwa zwei Drittel), ändert aber nichts
  am Blockproblem

Betrifft nur die Notenzonen. `toene.json`, `klang.json` und die
Analyse-Ablage sind Sammeldateien und damit unauffällig.
</details>

### 1.4 Takt-/Schlagspur — ERLEDIGT 24.08.

Höhe und Breite sind jetzt zwei Dinge: Die Höhen sind **fest und
kommen aus der Schrift** — die Eins so hoch wie ein *j* (Oberlänge bis
Unterlänge), die Zählzeiten wie ein *n* (x-Höhe), im Canvas an
derselben Schrift gemessen. Zoomabhängig ist allein die Breite, und
die lässt immer einen Bildpunkt Luft; wo es eng wird, entstehen
Hochkant-Rechtecke.

Dabei kam ein zweiter Fehler heraus: Die Breite hing am **Median**-
Abstand, aber Sunos Schläge sind ungleichmäßig — an engeren Stellen
stießen die Marken trotzdem aneinander (vier Berührungen, engste Lücke
−3,5 px). Jede Marke misst jetzt den Abstand zu beiden Nachbarn.

Nachgemessen: herausgezoomt 109 Marken, engste Lücke 1,49 px, null
Berührungen; hineingezoomt 429 Marken, 44,4 px, null.

<details><summary>ursprünglicher Auftrag</summary>
**Mehrfach angefordert.** In der Übersicht — also herausgezoomt — dürfen
die Marken der Beat-Spur **nie aneinanderstoßen**. Wo der Platz nicht
reicht, sollen sie **schmaler** werden und zu **Hochkant-Rechtecken**
werden, statt zu einem durchgehenden Band zu verschmelzen.

Die Formsprache bleibt: dickes rotes Quadrat für die Eins, kleine weiße
für die übrigen Schläge, vertikal zentriert, Topline oben drauf.
Zoomabhängig zeichnen, sodass immer Lücken bleiben.

Betrifft die Beat-Spur in der Befundspur und die neue Teilungsbahn über
der Tonverteilung, die dieselbe Regel braucht.
</details>

---

## 2. Angeboten, nie beantwortet

Diese Punkte hatte ich vorgeschlagen; eine Entscheidung steht aus.

### 2.1 Hüllkurven der Stems: Kennlinie
Die sechs Kurven laufen über weite Strecken am Anschlag, weil ich eine
Wurzelkennlinie benutze, damit Leises sichtbar bleibt. Eine dB-Skala mit
Boden bei etwa −40 dB zeigte Binnendynamik statt nur „spielt / spielt
nicht".

### 2.2 Einkanalmessung im Worker — ERLEDIGT 24.08.

Tonart, Schwerpunkt und Rolloff rechnen jetzt aus **beiden** Kanälen,
Beträge im Spektrum addiert (nicht die Signale — eine Mono-Summe
löscht Gegenphasiges aus). Gemessen: die Tonart ändert sich bei rund
7 % der Songs, „Die Lilie der Nacht" lieferte links G Moll und rechts
C Dur.

Dazu ein **Wächter über den Messweg**: Jede Ablage trägt einen zweiten
Stempel neben dem Format, und `vorrechnen.js` zieht nach, wo er
zurückliegt — bei jedem Empfänger von selbst. Nur die Tonart; der
Centroid-Median verschiebt sich lediglich um 1,3 %, dafür lohnen zwei
Stunden Neurechnung nicht.

<details><summary>ursprünglicher Befund</summary>
Tonart, Centroid und Rolloff rechnen weiter aus `getChannelData(0)`.
Die Prüfung hatte das schon vermerkt: Kanäle tauschen ändert die
gemeldete Tonart. Für das neue Chroma ist es behoben, für den Rest nicht.
Caspar_Ds Wort dazu: „1 Kanalmessungen in einem Stereobild sind Mist."
</details>

### 2.3 Sunos eigene Stems zum Vergleich
Suno trennt selbst in bis zu zwölf Spuren — darunter Streicher, Bläser,
Holzbläser, Keys, Percussion, die htdemucs_6s nicht kennt. Ein Vergleich
an einem Song würde zeigen, ob unsere lokale Trennung mithält. Kostet
Credits, deshalb nur auf Ansage.

### 2.4 Taktarten — GEMESSEN 24.08., Caspar_D: liegenlassen

Der Verdacht „Suno zählt dort Achtel statt Viertel" war **falsch**.
Gemessen ist der Takt überall vier Schläge lang — es *sind* Viertel;
Suno setzt die Zählzeit nur nicht zurück, sie läuft weiter hoch.
237 von 321 Songs sind sauber im Vierertakt.

Ein echter Ausreißer bleibt: **„Murmelnder Bach"** meldet Zählzeiten
bis 13 bei einer Taktlänge von 0,45 s und einem Schlagabstand von
0,454 s — ein Schlag pro Takt. Das ist kaputt, nicht ungewöhnlich.

<details><summary>ursprünglicher Verdacht</summary>
22 Songs melden Zählzeiten bis 8 — vermutlich zählt Suno dort Achtel
statt Viertel. Weitere 22 melden Zählzeiten bis 21.
</details>

### 2.5 Piano-Stem auf Verdacht prüfen — erhärtet, n = 4
Bei Okkultation klingt die Klavierspur in 95 % des Stücks. Das kann
stimmen — oder die schwächste Spur von htdemucs_6s fängt Restenergie ein.

**Zwischenstand 24.08.2026 abends** (vier Songs haben Hüllkurven):

| Song | Klavierspur | im Prompt |
|---|---|---|
| Okkultation | 95 % | nicht erwähnt |
| **Kein Shutdown** | **99 %** | **ausgeschlossen — „no piano"** |
| Die Gedanken … | 13 % | nicht erwähnt |
| Noch lachst Du | 23 % | nicht erwähnt |

Zwei Dinge daraus:

- **Der stärkste Beleg** ist „Kein Shutdown". Der Prompt sagt wörtlich
  *no piano* — und die Spur läuft in 99 % des Stücks. Ein Instrument,
  das nicht gewollt war, klingt durchgehend. Das ist kein Klavier.
- **Der Verdacht in seiner ersten Fassung stimmt aber nicht.** Die Spur
  ist nicht immer hoch, sie ist **gespalten**: zweimal um 95 %, zweimal
  unter 25 %. Eine Spur, die nur Restenergie aufsammelt, wäre immer
  voll. Es sieht eher so aus, als kippe sie bei manchen Songs — und
  fange dann alles auf. Passend dazu: bei „Kein Shutdown" klingt der
  **Rest** nur in 26 %, bei „Die Gedanken …" dagegen in 47 %.

**So wird es entschieden, sobald die Nachtkette durch ist.** Der
Rechenweg, damit niemand ihn neu erfinden muß: Anteil je Spur ist der
Anteil der Hüllenwerte über **38 von 255** (das sind −17 dB, dieselbe
Schwelle wie in der Anzeige, `analyzer.js` bei „klingt in … % des
Stücks"). Die Hüllen stehen in `library/toene.json` unter
`songs[id].huellen`.

Ein Fallstrick beim Prüfen des Prompts: **„no piano" ist kein
Klavierwunsch.** Wer nur auf `/piano/` prüft, zählt genau den Song
falsch, der den Verdacht trägt. Verneinungen (`no|without|kein|ohne`
vor dem Instrument) und das eigene Feld `stilAusschluss` gehören dazu.

Die Frage an den Bestand lautet dann: Wie viele Songs haben eine
Klavierspur über 80 %, obwohl der Prompt Klavier ausschließt oder nicht
erwähnt? Sind es viele, mißt die Spur nicht Klavier.

### 2.6 Akkordfolge aus den Notenzonen
Steht je Zone ein stabiler Tonvorrat, ist der Dreiklang ableitbar und die
Zone könnte ihren Namen tragen. Aus der Tonverteilung würde eine
Akkordfolge.

### 2.7 Schwelle der Zonenteilung — ERLEDIGT 24.08.

Auf **0,88** gesetzt (Caspar_Ds Entscheidung), an beiden Stellen —
`bin/toene.js` fürs Vorgerechnete und `analyzer.js` fürs Live-Bild.

<details><summary>ursprünglicher Stand</summary>
Steht auf 0,93. Gemessen an 530 Vergleichen: 0,88 ergäbe rund 79 %
ungeteilte Schläge, 0,82 rund 91 %.
</details>

### 2.8 PowerShell-Prüfung festhalten
Der CP1252-Fehler bei TrYa wäre durch einen Prüfschritt vor dem Versand
aufgefallen. Vorgeschlagen: Vermerk in den Hausregeln und ein
`bin/pruefe-skripte.js`, das reines ASCII, BOM und einen
CP1252-Parserlauf prüft. Ein `pwsh`-Syntaxcheck allein genügt **nicht** —
PowerShell 7 liest UTF-8 auch ohne BOM und meldet nichts.

---

### 2.9 Der Rest des eigenständigen Analyzers — ~210 Zeilen toter Code

Caspar_D, 24.08.2026: „auch die analyzer zeile mit dem voreingestellten
song gibt es nicht mehr, zumindest nicht aus klangtresor heraus
abrufbar."

Stimmt, und es ist mehr als die eine Zeile. Der Analyzer wird nur noch
mit `eingebettet: true` aufgebaut ([index.html:11324](../web/index.html))
— das ist der **einzige** Aufbau im ganzen Projekt. Damit ist alles tot,
was am ausgeblendeten Kopfbereich hängt:

| | Zeilen | hängt an |
|---|---|---|
| `analyze()` | 134 | Knopf in `#sa-kopf` — ausgeblendet |
| `runStems()` | 42 | Knopf in `#stems-section` — ausgeblendet |
| `downloadAudio()` | 15 | zwei Knöpfe, beide unsichtbar |
| `#sa-kopf` samt `url-input` | ~20 | — |

Das ist der Rest des **eigenständigen** Analyzers: Er holte sich Audio
selbst von Suno, analysierte es selbst und trennte Stems über einen
Python-Server außerhalb des Projekts. Alles davon macht heute die Bühne.

**Erledigt ist nur der Push-relevante Teil:** Im Eingabefeld stand eine
eigene Song-ID als Vorbelegung; sie ist am 24.08.2026 durch einen
Platzhalter ersetzt worden.

**Vorsicht beim Ausbau — zwei bekannte Fallen:**

1. `analyze()` baut Zustand auf (`_chartData`, `songDuration`,
   `_audioSamples`). Vor dem Entfernen prüfen, ob davon etwas auf dem
   Bühnenweg gebraucht wird. Genau diese Lücke hat schon viermal
   zugeschlagen — zuletzt bei `currentMeta`, das nur im Suno-Weg gesetzt
   wurde (siehe docs/NAECHSTER_CHAT.md, „Der vierte Fund derselben
   Lücke").
2. Sieben weitere Fundstellen von `analyze()` sind **Kommentare**, die
   den Bauzustand erklären („Dritter Einstieg neben analyze() und
   analyzeFile()"). Die zeigen nach dem Ausbau ins Leere und gehören
   mitgeschrieben — nach der Regel „Wer ersetzt, räumt ab".

**Erledigt am 25.08.2026.** Ausgebaut sind 267 Zeilen: `analyze()` (134),
`exportForLLM()` (64), `runStems()` (42), `downloadAudio()` (15),
`currentMeta` samt Rückfall, `#sa-kopf` (22 Zeilen Markup) und drei tote
Knöpfe. Die Datei ist von 8118 auf 7856 Zeilen geschrumpft.

Beide Fallen waren echt und sind abgeräumt:

- Zu Falle 1: `_chartData`, `_audioSamples` und `songDuration` setzt auf
  dem Bühnenweg `startWorkerAnalysis()` — dort steht seit dem 19.08.2026
  der Kommentar, der genau davor warnt. `analyzeFile()` bleibt deshalb
  stehen; sie ist der Bühnenweg ([index.html:11391](../web/index.html)).
  `currentMeta` war wieder nur Rückfall hinter `_katalogDaten`.
- Zu Falle 2: Die sieben Kommentare sind mitgeschrieben, nicht gelöscht —
  die Lehre („dieselbe Lücke ein drittes Mal") gilt weiter, nur heißt der
  Verursacher jetzt „der Suno-Weg" statt `analyze()`. Auch die tote
  CSS-Regel für `#sa-kopf` ist raus.

Beim Test fiel ein **älterer** Fehler auf, der nichts mit dem Ausbau zu
tun hatte: `totLegen()` fehlte der Null-Schutz, den sein Nachbar
`leereKartenAus()` hat. Schließt man die Bühne, während der Nachlauf noch
tickt (sechs Runden à 800 ms), greift er auf die abgeräumte Fläche zu und
wirft. Jetzt prüft er auf `null`, und `abraeumen()` bestellt den Nachlauf ab.

Geprüft im Browser an *Monolith*: 22 Karten sichtbar, 19 Leinwände
gezeichnet, alle sechs Stems geladen, Tonart E und Stimme männlich aus
`toene.json` angekommen, Pillen in der neuen Rangfolge und in den Farben
aus `STEM_RANG`. Keine Konsolenfehler — auch nicht beim Abräumen.

### 2.10 Der Trennlauf hängt reproduzierbar nach der dritten Spur

Zweimal in zwei Nächten, und beide Male an derselben Stelle:

| | 24.08. | 25.08. |
|---|---|---|
| stehengeblieben nach | 113 Songs | 9 Songs |
| betroffener Song | `9d375ce4…` | `91e5814b…` („Kerze") |
| vorhandene Spuren | `drums`, `bass`, `other` | `drums`, `bass`, `other` |
| fehlende Spuren | `vocals`, `guitar`, `piano` | `vocals`, `guitar`, `piano` |
| Zustand | `SN`, 0,0 % CPU, 10,4 GB | `SN`, 0,0 % CPU, ~9 GB |
| Stillstand | 8½ Stunden | 50 Minuten bis zum Fund |

Die Ausgabereihenfolge in [bin/stems.js:95](../bin/stems.js) ist
`['drums', 'bass', 'other', 'vocals', 'guitar', 'piano']` — es bricht also
**exakt nach dem dritten Eintrag** ab. Zweimal derselbe Punkt ist kein
Zufall.

**Was gesichert ist:** Am 25.08. um 03:03 stand ein `ffmpeg` seit 1 h 58 min
bei 0,0 % CPU und wartete auf `pipe:0`. Kein Trenner lief mehr. Im
Protokoll steht keine Fehlermeldung — `spawnSync` blockiert, statt zu
scheitern, deshalb merkt `stems.js` nichts und wartet mit.

**Verdacht, nicht bewiesen:** `flacSchreiben()` schiebt die Rohdaten per
`spawnSync` mit `input:` durch eine Pipe in ffmpeg — bei fünf Minuten
Musik rund 105 MB (`n × 2 Kanäle × 4 Byte`). Klemmt dieser Transfer, warten
beide Seiten unbegrenzt aufeinander.

**Naheliegende Härtung:** Die Rohdaten in eine temporäre Datei schreiben
und ffmpeg daraus lesen lassen, statt durch eine Pipe. Dann gibt es nichts,
was klemmen kann. Kostet einen Schreibvorgang je Spur — auf der SSD
belanglos gegen einen Lauf, der über Nacht steht.

**Bis dahin:** Nach `pgrep -fl stems.js` den Status prüfen (`SN` bei 0,0 %
über Stunden heißt hängend), jeden `stems/`-Ordner auf sechs `.flac`
prüfen und halbfertige verwerfen — `stems.js` erkennt Fertiges nur an
`piano.flac`, ein Ordner mit drei Spuren fällt sonst durch.

## 3. Bewusst liegengelassen

- **Zwei Panels** im Analyzer sind versteckt, aber nicht entfernt: die
  beiden Instrument-Erkennungen. Sie erscheinen situativ, deshalb nicht
  angetastet. Kommentar-Generator, Stem-Trennung und Standalone-Kopf sind
  am 25.08.2026 ganz ausgebaut (siehe 2.9).
- **Zwei der drei Instrument-Erkennungen** laden Modelle von
  `caspardavi.github.io` — die letzte Fremdadresse im Analyzer. Läge nahe,
  sie mit zu entfernen.

---

## 4. Läuft gerade

- **Trennlauf** über die restlichen Songs (Stand 129 von 321),
  abgekoppelt von der Sitzung, gedrosselt auf vier Kerne.
- Danach automatisch **`bin/toene.js` über alles** — dabei entstehen auch
  die Notenzonen für alle Songs (rund fünf Stunden).
- Danach **`library/nachtbericht.txt`** mit den Trefferquoten für Tonart
  und Stimmlage, der Gegenprobe an den textlosen Stücken und der Liste
  der Fälle, in denen Messung und Prompt auseinandergehen.

Wird 1.3 vor dem `toene.js`-Durchlauf entschieden, entstehen die
Notenzonen gleich im richtigen Format — sonst sind es 321 MB, die später
umgeschrieben werden müssen.

---

## 5. Öffentliches GitHub — Caspar_Ds Bedingungen (24.08.2026)

Angekündigt für den Zeitpunkt nach dem Tonart-Ausbau. Zwei Bedingungen
stehen fest, beide wörtlich:

### 5.1 „Version X by Caspar_D" muss unter MySuno stehen

Eine Versionsangabe mit Urheberschaft in der Oberfläche selbst — nicht
nur in einer README, die niemand aufschlägt.

### 5.2 Caspar_D behält das letzte Wort

> „Ferner will ich die Oberhoheit behalten und selbst bestimmen, was
> geändert wird und was nicht, also die Bedingung, dass ich das letzte
> Wort habe und mir niemand das Projekt aus der Hand nehmen kann."

**Was das sichert:** Das Repo gehört ihm; Fremde können nur Vorschläge
einreichen, über die er entscheidet. Das Urheberrecht bleibt bei ihm,
unabhängig von jeder Lizenz.

**Was sich nicht verhindern lässt:** Ein öffentliches Repo kann jeder
forken. Steuerbar ist nur, was jemand mit der Kopie **darf** — und das
regelt die Lizenz.

**ENTSCHIEDEN am 24.08.2026: MIT.** Caspar_D: „okay, dann MIT."

Die frühere Empfehlung an dieser Stelle lautete „keine freie Lizenz,
alle Rechte vorbehalten". Sie ist überholt. Was dagegen sprach:

1. **Das letzte Wort kommt gar nicht aus der Lizenz.** Es folgt daraus,
   wem das Repositorium gehört. Kein Lizenztext der Welt regelt, wer
   einen Pull Request zusammenführt — das tut der, der Schreibrechte
   hat. Bedingung 5.2 ist also unabhängig von jeder Lizenzwahl erfüllt.
2. **„Keine Lizenz" erfüllt Bedingung 5.1 nicht, sondern hebt sie auf.**
   Wer keine Erlaubnis erteilt, kann keine Bedingung daran knüpfen. Die
   Namensnennung ist nur durchsetzbar, wenn es überhaupt eine Erlaubnis
   gibt, an die man sie hängen kann. Eine Nicht-Lizenz belohnt das
   Löschen des Namens.
3. **Gegen AGPL sprach die Durchsetzbarkeit.** Die AGPL könnte die
   Nennung härter erzwingen (Abschnitt 7b), aber jeder Weg dorthin —
   Abmahnung wie DMCA-Meldung — verlangt Klarnamen und Anschrift im
   Klartext. Ein Pseudonym hält das nicht aus. Eine Lizenz, die man nie
   in die Hand nimmt, ist ein Schwert an der Wand.
4. **Die KI-Frage entschärft MIT von selbst.** Rein maschinell erzeugter
   Code ist gemeinfrei (AG München 02/2026, OLG Düsseldorf 04/2026).
   Bei Copyleft schwächen solche Anteile die Konstruktion; bei MIT ist
   es einerlei, weil dort nichts fortgeschrieben werden muß.

Angelegt am 24.08.2026: `LICENSE` (MIT, Copyright (c) 2026 Caspar_D),
`web/fremd/LIZENZEN.md` (alle fremden Bausteine und Modelle),
`web/fremd/BUTTERCHURN-LICENSE.txt`. Der README-Abschnitt „Rechte und
Mitarbeit" ist entsprechend neu, dazu ein Abschnitt „Wie das hier
entstanden ist" über die KI-Beteiligung.

### 5.3 Vor dem ersten Push zu prüfen — die HISTORIE, nicht nur der Stand

Was einmal committet wurde, bleibt in git, auch wenn es später gelöscht
wurde. Durchzusehen sind alle Commits auf:

- `geheim/` (steht in `.gitignore`, aber: war es das immer?)
- Tokens und Cookies aus der Clerk-Zeit, `bin/token.js`, `bin/paket.js`
- die `__clerk_handshake`-URL, die laut HISTORY einmal in ein
  Werkzeugprotokoll geraten ist
- Caspar_Ds E-Mail-Adresse und andere persönliche Angaben

### 5.4 Zu entscheiden: was überhaupt mitsoll

Der Code klar. Aber `library/` sind 22 GB seiner Musik, und `docs/` ist
voll mit seinen Zitaten und Arbeitsnotizen — beides eine eigene
Entscheidung.

### 5.5 audioMotion — ERLEDIGT 24.08.2026

**Caspar_D: „spektrum visualisierer fliegen wieder raus aus den
visualizations, kein Problem, erstmal merken, noch nichts machen."**

Der Anlass: `web/fremd/audioMotion-analyzer.js` (Fassung 4.5.4,
Henrique Avila Vianna) steht unter **AGPL-3.0-or-later**. Sie ist von
git erfasst, wird in index.html:2528 geladen und in :11403 konstruiert.
Beim Push auf ein öffentliches Repositorium ist das Verbreitung — und
AGPL § 5 Buchstabe c sagt dazu wörtlich:

> This License gives no permission to license the work in any other way.

Damit ist die Zusage im README („Verwendung nur mit Zustimmung des
Urhebers") mit dieser Datei im Repo nicht haltbar, und MIT oder Apache
wären ebenso ausgeschlossen. Entweder das ganze Projekt geht unter
AGPL, oder die Datei fliegt. Caspar_D hat sich für das Werfen
entschieden — **damit ist die Lizenzwahl wieder frei.**

**Was es kostet:** fünf Darstellungsarten (Balken, Balken fein,
LED-Balken, Gespiegelt, Linienzug) aus `AUDIOMOTION_ARTEN`. Es bleiben
die sieben eigenen Visualisierungen und die 333 Butterchurn-Presets.

**Was zu tun ist, wenn es soweit ist:**

1. `web/fremd/audioMotion-analyzer.js` löschen (93 KB)
2. `AUDIOMOTION_ARTEN` und den Block in `modiVerfuegbar()` entfernen
   (index.html um :8904 und :8925)
3. `audioMotionAufbauen()` und den Konstruktoraufruf (:11403)
4. Die Skriptzeile :2528 und die Zeile im Herkunftskommentar :2509
5. Gespeicherte Auswahl `audiomotion:<Art>` abfangen — wer diese
   Darstellungsart zuletzt an hatte, darf nicht auf einer leeren Bühne
   landen. Rückfall auf eine eigene.
6. README: „dazu Butterchurn (310 MilkDrop-Presets) und audioMotion"
   anpassen
7. docs/VISUALIZER.md durchsehen

**Was dabei gleich miterledigt gehört** (aus derselben Prüfung):

- **Butterchurn-Lizenzvermerke fehlen.** Alle vier Minified-Builds
  (~1,9 MB) tragen keinen Lizenzkopf, und es gibt keine LICENSE-Datei.
  Upstream ist MIT, und MIT verlangt genau eines: dass der
  Urhebervermerk mitgeführt wird. Das ist derzeit verletzt. Abhilfe:
  eine Datei `web/fremd/LIZENZEN.md` mit den Originalvermerken von
  jberg/butterchurn und jberg/butterchurn-presets.
- **Kein einziges Copyright in den eigenen 82 Dateien.** Solange dort
  nichts steht, kann ein Fork auch nichts erhalten.

**Entwarnung aus derselben Prüfung, damit sie nicht wieder aufkommt:**
Der CB-Audio-Analyzer-Verdacht ist ausgeräumt. Der Worker sagt es
selbst („nachgebaut, nicht übernommen", analyzer-worker.js:468), und es
findet sich kein einziger Python-Rest im getrackten Code — CB ist
PySide6/numpy/scipy, KlangTresor ist JavaScript. Wörtliches Kopieren ist
zwischen beiden gar nicht möglich. Einziger Restpunkt: die Schwellwerte
(450 Hz, 7,8 dB, −77 dB) sind identisch übernommen. Reine Zahlen sind
keine Codeübernahme, aber es ist die Stelle, die ein Dritter ansähe.

Die npm-Pakete sind durchweg permissiv (MIT, BlueOak, ISC), kein
Copyleft. Die Modelle liegen nicht im Repo.

**Vollzogen am 24.08.2026** (Commit „MySuno heisst jetzt KlangTresor,
audioMotion ausgebaut"). Ausgebaut wurden Ladezeile, `AUDIOMOTION_ARTEN`,
der Eintrag in `modiVerfuegbar()`, `audioMotionAufbauen()`, der Zweig in
der Weiche und die Datei selbst.

Der gefährliche Teil war nicht der Ausbau, sondern der halbe:
`new AudioMotionAnalyzer(...)` ist ein blanker Bezeichner ohne
`window.`-Prüfung und ohne `try/catch`. Nur die Datei zu löschen hätte
einen ReferenceError geworfen, der aus `darstellungAufbauen()`
herausfliegt — und in `buehneOeffnen()` steht der Aufruf **vor**
`classList.add('auf')`. Die Bühne hätte sich nicht mehr geöffnet.

Wer zuletzt eine audioMotion-Art eingestellt hatte, wird beim nächsten
Start einmalig auf **Spektrum** umgeschrieben (dieselbe Balken­darstellung,
nur radial). Der vorhandene Rückfallpfad hätte dafür nicht gegriffen —
er sitzt innerhalb des Zweigs, der wegfiel.

Miterledigt: `web/fremd/BUTTERCHURN-LICENSE.txt` und
`web/fremd/LIZENZEN.md` angelegt, Copyright-Vermerk in 50 eigenen
Dateien.

**In der git-Historie liegt die Datei weiter** — in zwei Commits
(0769902 baute sie ein, 4df4d84 entfernte sie), dazwischen als Blob in
jedem. Das ist beim ersten Push zu entscheiden.
