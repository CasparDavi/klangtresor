# Konzept: das Effektclip-Studio als eigene Datei

Stand 25.09.2026. Vorbereitung der Planung auf Caspar_Ds Wort: *„bereite alles vor, was nötig
ist, um die Planung für die Studio-Herauslösung abzuschließen."* Gelesen aus dem Code, nicht aus dem
Labor: eine Anschlussliste per Skript über `web/index.html`, dazu Werkzeuge, Paket, Server, Ladeweg.
Es ist noch nichts gebaut.

## 1. Was heute ist

| | Zeilen in `web/index.html` | Umfang |
|---|---|---|
| Studio-CSS zwischen `/* >>> Effektclip-Studio (tbs.css) */` und `<<<` | 3085–3415 | 329 Zeilen, am Ende des zweiten `<style>` |
| Studio-JS als `var EffektclipStudio = (() => { … })();` | 27288–38714 | 11 425 Zeilen, rund 1 MB |
| Haus-JS (der Rest des einen Inline-`<script>`) | 4629–38715 | 22 658 Zeilen |
| Analyzer, das Vorbild | `<script defer src="/fremd/analyzer.js?v=2">` (4619) | 407 KB, eigene Datei |

Die Laborseite `labor/effektclip-studio/labor-haus.html` lebt das Zielmuster schon: `<link
rel="stylesheet" href="tbs.css">` im Kopf, ihr Haus-Ersatz als Skripte davor, `<script
src="tbs-modul.js">` als letztes Element ohne `defer`. Ihre Kopie des Moduls ist allerdings alt
(Stand 11.09., 1 408 Zeilen, ohne `clipMalt`).

## 2. Der Anschluss, aus dem Code gerechnet

Skript `anschluss.js` (Scratchpad; Deklarationen des Hauses gegen Vorkommen im Modul, Kommentare
und Strings abgezogen, gleichnamige Modul-Lokale aussortiert):

**Das Modul greift nach genau acht Dingen des Hauses — alle schon heute mit `typeof` abgesichert:**

| Bezeichner | Wofür | Stelle im Modul |
|---|---|---|
| `audio` | die echte Uhr (`zeit()`, `clipZeit`, `clipMalt`) | 35900 ff. |
| `aktuellId` | liegt dieser Titel im Player | 35900 ff. |
| `katalogInfo` | randlose Titelbilder, Warten beim Öffnen | 32754, 37172 |
| `_eigenArt`, `_titelbildMenge`, `kachelZusatz` | Bildwahl der Quelle (`artworkBild`-Logik) | 32749–32755 |
| `spielenNachId` | Knopf „Titel abspielen" | 37093 |
| `istInstrumental` | kein Gesang, keine Karaoke-Zeile | 38632 |

Dazu drei Verabredungen im DOM (`kastenVon` sucht `.bild` im Kasten, auf der Bühne `.bart` mit
`img.motiv`), sieben CSS-Variablen der Palette (`--bg --rand --schwach --flaeche2 --text --flaeche
--akzent`), die Wege `/api/...` und `/media/...` (alle Adressen wurzelbezogen, keine relative) und
die Schriften `web/fonts`. Das Modul hat ein eigenes `$` (auf `root` beschränkt), eigenes
`BILDRATE`, eigenes `zeit` — neun Namen schatten Hausnamen, alle absichtlich.

**Das Haus ruft am Modul nur die Rückgabe** `{ oeffnen, schliessen, clipAn, clipAus, clipNeu,
clipMalt }` — über die Wächter `function clipAn(k,id){ if(typeof EffektclipStudio==='object'…) }`
(11144) und in `capAuf` fünfmal **ohne** Wächter (17599–17642, nur per Klick erreichbar). Dazu hört
die Bühne das Ereignis `effektclip` am Kasten, das Haus schreibt und liest `eigen-effekt.json`
(Rezeptformat Fassung 7) und der Server baut Zehnsekünder und Vollvideo.

Das ist die ganze Grenze. Sie ist klein, weil sie seit dem Labor (Haus-Ersatz 12 KB) täglich
geprüft wird.

## 3. Was das Modul beim Laden tut

Nur Browser-Standard, kein Haus: ein leeres SVG an `document.body` (Kurvenraum, 29166),
`localStorage['mysuno-tbs-ablage']` lesen (35653) und einen `storage`-Horcher setzen (35656), ein
`MessageChannel` (36640), zuletzt `schriftenBereit()` (38711) — das ruft `document.fonts.load` für
Inter und Gelasio, deren `@font-face` in tbs.css steht. **Folge für die Reihenfolge:** das
Stylesheet muss vor dem Modulskript stehen, sonst läuft das Vorladen leer.

## 4. Der Ladeweg, wie er heute ist und wie er bleibt

`start()` (4740) wird bei 27284 gerufen, **vor** der Moduldefinition, und wartet bei seinem ersten
`await` — die Definition läuft synchron durch, bevor `zeichnen()`/`markieren()` die erste Kachel
anhängen. Der `typeof`-Wächter ist genau für dieses Muster da. Kacheln bekommen ihren Clip nie beim
ersten Rasteraufbau, sondern über `markieren()` (die laufende Kachel) und beim Überfahren mit der
Maus; fehlt das Modul im Augenblick, bleibt die Kachel bis zum nächsten Zustandswechsel ohne Clip,
ohne Meldung. Der Analyzer hat denselben Stil: Wächter `window.SunoAnalyzer`, Knöpfe grau, kein
Ereignis „da".

**Vorschlag:** `<link rel="stylesheet" href="/tbs.css">` genau dort, wo heute der `<style>` endet
(3416, gleiche Kaskadenlage), und `<script src="/tbs-modul.js">` **ohne** `defer` unmittelbar vor
dem Haus-`<script>` (4629). Dann ist das Modul definiert, bevor eine Zeile Haus läuft — die
Reihenfolge ist sogar strenger als heute, und nichts am Haus muss auf ein „da" warten. Das CSS
gewinnt seine einzige Überschneidung (`.bild canvas.tbs-clip` 3255 gegen `.bart canvas` 1307) durch
Spezifität, nicht durch Reihenfolge. Die fünf ungeschützten Aufrufe in `capAuf` bekommen den
Wächter, damit ein fehlendes Modul (404, Netz) dort nicht wirft.

## 5. Was an Werkzeugen und Regeln mitzieht

| Stelle | Heute | Datei-Fassung |
|---|---|---|
| `labor/nahtpruefung/stand.js` | schneidet beide Blöcke per Marker aus `index.html`, setzt `haken.js` vor die Rückgabezeile | liest `web/tbs-modul.js` und `web/tbs.css` direkt; der Haken bleibt eingespleißt (er braucht 27 Innereien des Moduls, 409 Griffe — als eigene Datei sähe er nichts) |
| `labor/nahtpruefung/syntax.js` | prüft nur Inline-Skripte (`<script` ohne `src`) | prüft zusätzlich jede `<script src>`-Datei unter `web/` |
| `labor/nahtpruefung/naht.mjs` | hasht `site/tbs-modul.js`/`tbs.css` in den Laufschlüssel | unverändert |
| `bin/effektclip-labor.js aus / ein` | schneidet den Block heraus und spleißt ihn zurück | **fällt** (Grund bleibt als Kommentar); `daten`, `lyrik` bleiben |
| `labor/effektclip-studio/` | Kopie des Blocks, „zwei Wahrheiten gibt es nicht" | lädt die echte Datei (Verweis auf `web/`), keine Kopie mehr; LIESMICH nachziehen |
| `bin/paket.js` | `git archive HEAD` | nimmt neue Dateien unter `web/` von selbst mit, sobald eingecheckt |
| `server/server.js` | `.js` No-Cache mit 304, `.css` **ein Jahr Cache** (Zeile 280: `programm` kennt `text/css` nicht) | `text/css` zu `programm` (eine Zeile, Eingriff mit Ansage — der Server startet sich neu); sonst holt sich der Browser ein altes Stylesheet zu neuem Skript |
| `?v=`-Marke | beim Analyzer von Hand hochgezählt, seit der No-Cache-Regel für `.js` redundant | für `tbs-modul.js` nicht nötig, wenn `.css` dieselbe Regel bekommt |
| `CLAUDE.md` „Die Datei, mit der Jörg arbeitet" | eine Datei, in einem Zug | zwei Dateien plus `index.html`, **in einem Commit** — ein Skript ohne sein CSS ist die halbe Fassung |
| Docs (`EFFEKTCLIP-REGELN.md` 262–268, `labor/nahtpruefung/LIESMICH.md` 171) | nennen `aus`/`ein` und „aus `index.html`" | nachziehen |
| Windows (Casto) | `einrichten.js` prüft nur den Ordner `web/` | nichts zu tun |
| exFAT | 1 MB je Datei | zwei Dateien, 2 MB — ohne Belang |

## 6. Der Bau, in Schritten, jeder mit seiner Probe

1. **Block wird Datei.** `web/tbs-modul.js` = Inhalt zwischen den JS-Marken, unverändert;
   `web/tbs.css` = Inhalt zwischen den CSS-Marken; `index.html` verliert beide Blöcke und bekommt
   `<link>` und `<script>` an den Stellen aus Abschnitt 4. Probe: Syntax beider Dateien,
   Prüfstand-Stichprobe (die 4 Textfälle, 10 Effektfälle quer, Studio-Grundlinie), im eigenen Tab
   Studio öffnen, Kachel mit Clip, Bühne mit Clip, Zehnsekünder; der volle Export ist Caspar_Ds
   Probe. Vom Nutzer aus ist nichts anders, F5 genügt.
2. **Werkzeuge nachziehen** (Tabelle oben) im selben Commit, `aus`/`ein` gelöscht mit Grund,
   `labor/effektclip-studio` auf die echte Datei umgestellt.
3. **Server: `text/css` No-Cache** — mit Ansage, eine Zeile.
4. **Der Anschluss als Vertrag.** Am Kopf von `tbs-modul.js` steht die Liste aus Abschnitt 2 als
   Kommentar „Hausanschluss": was das Modul vom Haus liest, was es zurückgibt, welches Ereignis es
   sendet. Ob die acht Griffe zusätzlich durch ein übergebenes Objekt
   (`EffektclipStudio.anschliessen({audio, aktuellId: () => …, …})`) ersetzt werden, ist die
   Architekturfrage — siehe 7.
5. **Paket.** `node bin/paket.js`, das Zip in einem Sandkasten entpacken und starten (die
   Hausregel: läuft es bei jemandem, der nur das Zip entpackt hat).

Aufwand: Schritt 1 bis 3 ein halber Tag mit Proben; Schritt 4 als Objekt ein weiterer halber Tag
(acht Stellen im Modul, der Haus-Ersatz des Labors, die Prüfhaken-Attrappe).

## 7. Was Caspar_D entscheidet

1. **Go für Schritt 1 bis 3** — das Studio wird eine Datei, das Haus bleibt, wie es ist.
2. **Der Anschluss:** so lassen (acht `typeof`-Wächter, dokumentiert als Vertrag) oder als
   übergebenes Objekt bauen. Empfehlung: erst dokumentieren, das Objekt kommt, wenn das zweite
   Modul (Tonstudio) denselben Anschluss braucht — dann zahlt es sich aus, vorher ist es Zierde.
3. **Der Server-Eingriff** (`text/css` ohne Jahres-Cache): mit Ansage, wann.
4. **`aus`/`ein` fallen** — oder sollen sie als Weg für Bauaufträge auf der Kopie bleiben? Mit
   einer eigenen Datei ist die Kopie einfach `cp web/tbs-modul.js …`; die Werkzeuge wären doppelt.
5. **Reihenfolge danach:** Tonstudio, dann Bühne (steht so seit dem 20.09.). Beide haben heute
   keine Marken; die Grenze wird beim Ziehen gefunden, und die Bühne ist mit Player, Textebene,
   Visualizer und Analyzer verflochten — dort zuletzt.

## 8. Was nicht dazugehört

Kein Bundler, kein `type="module"`, kein `import`/`export`: das Modul ist klassisches Skript ohne
`currentScript`, `require` oder relative Adressen (Befund Ladeweg). Die Regex-Falle in Zeile 31276
(ein Regex-Literal mit ungleichen Klammern) heißt: Werkzeuge, die Klammern zählen statt JS zu
parsen, stolpern dort — `stand.js` und `syntax.js` parsen mit `new Function`, das bleibt so.
