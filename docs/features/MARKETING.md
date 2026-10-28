# KlangTresor – Marketingmaterial

Stand 28.10.2026. Was es gibt, wie es entsteht, was beim Ändern zu beachten ist und welche Software dafür nötig ist.
Gestaltungsregeln im Einzelnen: [STIL.md](STIL.md).

## 1. Was es gibt

| Erzeugnis | Datei | Wo es zu sehen ist |
|---|---|---|
| **Feature-Seite** (Apple-Keynote-Stil, Kacheln, Details hinter „+“) | `index.html` | https://caspardavi.github.io/klangtresor/features/ |
| **Inhalt** – alle Texte und Bildlisten, EN/DE/RU | `inhalt.js` | wird von Seite **und** Broschüre geladen |
| **Feature-Broschüre**, 24 Seiten A4 | `broschuere.html` | als PDF, unten |
| Broschüre als PDF, Bildschirmfassung (≈ 8 MB) | `KlangTresor-Broschuere-{en,de,ru}.pdf` | verlinkt oben auf der Feature-Seite |
| Broschüre, Druckereifassung (≈ 63 MB, Szenen hochgerechnet) | nur lokal | `~/Downloads/KlangTresor-Broschuere/` |
| README-Titelband (Kopf der Feature-Seite als Bild) | `img/readme-{en,de,ru}.jpg` | Projektseite auf GitHub |
| Vorschaubild für Discord & Co. (1280 × 640) | `~/Downloads/KlangTresor-social-preview.jpg` | von Hand hochladen: Repo → Settings → Social preview |
| Sonderausgabe (Schalter `?tarja`, eigene Akzentfarbe) | Bilder nur lokal, von git ignoriert | nicht öffentlich |

**Eine Textquelle.** Jeder Text steht genau einmal in `inhalt.js`. Wer ihn dort ändert, ändert Seite und Broschüre.
`broschuere.html` enthält nur den Seitenplan (`PLAN`), wenige Rahmenwörter (`RAHMEN`: S., Inhalt, Abb.) und das Layout.

## 2. Aufbau der Broschüre

- **Satzspiegel:** feste Seitenkästen 210 × 297 mm auf Schwarz (keine `@page`-Ränder – Chrome malt sie weiß),
  12 Spalten, Text auf zwei Dritteln, Bilder über die volle Breite.
- **Titel und Kapitelauftakte** im Magazinstil (warme Raumszene randlos, ins Schwarz auslaufend),
  **Innenseiten** im Schweizer Raster (Kachelnummer 05.1 links, Text rechts, Grafik mit Haarlinie, Details immer gedruckt).
- **Seitenzahl durch 4 teilbar** (Klammerheftung). Das Skript verweigert das PDF, wenn etwas überläuft, eine Kachel fehlt
  oder die Seitenzahl nicht passt – es schneidet nie etwas ab.
- **Einheitliche Abstände** (gemessen auf jeder Seite): Bild → Text 3 mm, Text → Bild 9 mm, Text → Text 6 mm.
- **Schriftfarben gedämpft (Stufe D):** Überschrift `#a8a59f`, Text `#8b8984`, Einzelheiten `#75736f` – die Bilder sind die Hauptsache.
  Akzent Orange `#ff8a2a`. Nicht für Beamer gedacht.
- **Effektclip** als Filmstreifen: 15 Standbilder (3 × 5) aus `img/okkult-clip.mp4`.

## 3. Arbeitsabläufe

**Text ändern**
1. In `inhalt.js` ändern (alle drei Sprachen).
2. Seite: fertig. Broschüre: PDFs neu erzeugen (unten).

**PDFs erzeugen** (aus `docs/features/`):

```bash
node werkzeug/broschuere-pdf.mjs de,en,ru
```

- `--druck` – Druckereifassung mit den hochgerechneten Szenen aus `img/druck/` (nur lokal).
- `--tarja` – Sonderausgabe.
- `--nur-pruefen` – nur Entwurf und Prüfbericht (Füllgrad je Seite, Überlauf), `--abstaende` – Abstandsbericht.
- Ergebnis im Scratchpad-Ordner `broschuere-fertig/`; die Bildschirmfassung ist `…-klein.pdf` (Ghostscript `/printer`).
  Zum Veröffentlichen nach `docs/features/KlangTresor-Broschuere-<lang>.pdf` kopieren.

**Bild austauschen**
1. Neues Bild in `img/` unter demselben Namen, in Anzeigebreite (w12 ≈ 2360 px, w8 ≈ 1560, w6/w5/w4 ≈ 1180).
2. In `inhalt.js` den Bildstand `BV` hochzählen, sonst zeigen Browser das alte Bild.
3. Bilder mit Oberflächentext gibt es je Sprache (`-de`, `-en`, teils `-ru`); fehlt `-ru`, nimmt Russisch Englisch.

**Neue App-Aufnahmen** – immer im **Sandkasten** (`_sandkasten-features`, Port 8803, Kopien von `server/`, `bin/`, `web/`),
nie am echten Archiv und nie im App-Fenster auf 8788. Aufnahmeskripte: `werkzeug/aufnahme/` (z. B. `druck.mjs` Plakat-PDF,
`morgen2.mjs` Morgenlauf, `ueber.mjs` Übersicht, `hit.mjs` Hitparade, `hoerer2.mjs` Gemeinschaft), gestartet über
`werkzeug/aufnahme/folge.mjs <breite> <höhe> <handy 0/1> <skript>` mit `SPR=de|en|ru`.

**Bildschirm in eine Szene setzen** – nie das fertige Bild hochrechnen oder verzerren lassen, sondern:
1. Ecken der Bildfläche **messen oder von Caspar_D setzen lassen** (`werkzeug/ecken/*.html` im Sandkasten unter
   `/features/ecken/`, Lupe gegenüber dem Knoten, Zeile kopieren).
2. App-Aufnahme erst mit Lanczos auf Zielgröße, dann perspektivisch einsetzen (`werkzeug/einsetzen/setzen.mjs`, `setzen-tv.mjs`).
3. Papier im Zimmerlicht tönen (`ton.mjs`, `licht.mjs`), Pergament mit Kerzenlicht (`kerze.mjs`) – Werte in STIL.md.

**Druckauflösung** – Szenen sind nur 1536 px breit (≈ 130 dpi randlos). Für die Druckerei:
1. Die **leere** Szene (ohne Bildschirm) mit Real-ESRGAN viermal hochrechnen.
2. Die App-Aufnahmen in vierfacher Größe neu einsetzen (`werkzeug/druck/`, Anleitung in `werkzeug/druck/LIESMICH.md`).
3. Eintrag in `DRUCKBILD` in `broschuere.html` (Webbild → Druckbild).

**Veröffentlichen** – GitHub Pages aus `main`, Ordner `/docs` (mit `docs/.nojekyll`). Nur Fertiges, als **ein** Commit nach
`main`; die Zwischenstände des Arbeitszweigs `features-dokument` nicht mergen (sie enthalten verworfene Fassungen).
Nach dem Push etwa eine Minute warten, dann die Live-Seite prüfen (alle Bilder laden, Sprachen schalten, PDFs erreichbar).

## 4. Was bedacht werden muss

- **Nur echte App-Inhalte.** Keine erfundenen Bildschirme, keine Beta-Funktionen, nichts Selbstverständliches.
  KI-Szenen (Sofa, Tanz, Auto, Laptop) sind Bühne; was auf ihren Bildschirmen steht, ist immer eine echte Aufnahme.
  KI-Schrift auf Displays (falsche Interpunktion, Kritzelzeilen) wird abgedeckt.
- **Song-Cover bleiben echt** – sie sind Caspar_Ds Titelbilder, auch in Sonderausgaben.
- **Private Cover auf Plakaten** sind freigegeben.
- **Personen** in Szenen nur mit Einverständnis; die Sonderausgabe bleibt lokal, bis die Person der Veröffentlichung zugestimmt hat.
- **Hell auf dunkel.** Keine großen hellen Flächen (Augen von Caspar_D). Papierbilder im warmen Zimmerlicht, nie weiß.
- **Russisch:** gendergerecht neutral ansprechen, kyrillisch. Sprachfehler der App (z. B. Beugung im Plakat-Untertitel)
  in der App beheben (Release), nicht im Bild retuschieren.
- **Ghostscript-Falle:** Beim Rastern mit `gs` fehlen manchmal Buchstaben (das „m“ in Menlo) – nur ein Anzeigefehler.
  Glyphen mit `pdftoppm` oder Apples `sips` prüfen.
- **Schriften** werden von Chrome als Type 3 eingebettet. Apple Vorschau zeigt sie richtig; eine Druckerei kann eine andere
  Einbettung verlangen.
- **Sonderzeichen** (z. B. ༺ ༻) kommen per Schrift-Ersatz (macOS: Kailasa). Auf anderen Systemen vor dem Druck prüfen.
- **Konsole** zeigt die echte Startmeldung des Servers; die Zeile „KlangTresor auf http://localhost:8788“ ist in allen Sprachen deutsch.
- **README:** GitHub erlaubt nur Bilder, keine eigenen Farben oder Schriften; bei hellem GitHub-Thema stehen die dunklen Bilder auf Weiß.
- **Discord** zeigt Seiten nur als Link-Vorschau (Open-Graph-Zeilen im Seitenkopf – noch nicht eingebaut). Nur verlinken, was schon online ist.

## 5. Externe Software

| Programm | Wofür | Hier verwendet |
|---|---|---|
| Node.js | alle Skripte (Aufnahme, Einsetzen, PDF) | 23.3 |
| Google Chrome | headless Rendern und Drucken über CDP (`werkzeug/cdp.mjs`, immer `--mute-audio`) | `/Applications/Google Chrome.app` |
| ffmpeg | Zuschnitt, Skalierung (Lanczos), Standbilder aus dem Clip | 9.0 |
| cwebp (libwebp) | WebP für die Seite (ffmpeg hier ohne libwebp) | 1.4 |
| Ghostscript | Bildschirmfassung der PDFs verkleinern (`/printer`) | 10.04 |
| poppler (`pdftoppm`, `pdfseparate`, `pdfimages`, `pdffonts`) | Seiten rastern, Bildauflösung im PDF prüfen | 24.11 |
| macOS `sips` | Prüfen mit Apples PDF-Engine, Plakat-PDF rastern | macOS |
| Real-ESRGAN (ncnn-vulkan, Modell `realesrgan-x4plus`) | Szenen viermal hochrechnen, läuft über Vulkan auf der Radeon | `/Volumes/Extreme_SSD/Entwicklung/_werkzeug/realesrgan` (Release v0.2.5.0) |
| Python 3 | kleine Textersetzungen | macOS |
| git, GitHub CLI `gh` | Commit, Pages, Repo-Einstellungen, Releases | |
| Schriften | Helvetica Neue (Broschüre), SF/Menlo (Seite, Konsole), Kailasa (Ornamente) | macOS |

Der Sandkasten-Server ist KlangTresors eigener `server.js` – keine weitere Software.

## 6. Wo die lokalen Teile liegen

- `docs/features/werkzeug/` – alle Skripte und Eckenseiten (von git ignoriert). Die Aufnahmeskripte importieren `../cdp.mjs`;
  ihr Bildordner (`DIR` in `cdp.mjs`) zeigt auf ein Scratchpad und ist vor Gebrauch anzupassen.
- `docs/features/img/druck/` – Druckbilder (ignoriert).
- `_archiv-feature-dokument/` – verworfene erste PDF-Fassung und nicht mehr benutzte Bilder.
- Zweig `features-dokument-archiv` (lokal) – ganze Arbeitsgeschichte.
- Sicherung: `KlangTresor-Sicherung/<datum>/feature-broschuere-lokal-*.tar.gz` auf SSD und NAS, mit Prüfsumme.

## 7. Offen

- Russische Bilder fehlen für Bühne, Tonstudio-Grafiken, Messdaten, Sternhimmel, Vorlagen (Russisch zeigt Englisch).
- Open-Graph-Vorschau für Discord; Vorschaubild auf GitHub von Hand hochladen.
- README zeigt vier Bilder (Geräte, Bühne, Sternhimmel, Glockenstuhl) – bei neuen Aufnahmen mitpflegen.
- App: Hitparade beschriftet die Wochen auch russisch mit „KW“; ffmpeg verlangt auf Mac/Linux noch einen Handgriff.
- Broschüre: Seiten 12, 14, 15, 19 sind nur zu rund zwei Dritteln gefüllt.
