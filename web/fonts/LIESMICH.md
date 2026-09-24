# Schriften im Haus

Diese vier Dateien sorgen dafuer, dass der Effektclip-Export auf dem Mac, unter
Windows und auf der Buehne dieselbe Schrift malt. Ohne sie faellt Windows von
"Helvetica Neue" auf Arial zurueck und "Georgia" fehlt dort ganz - beides
veraendert Zeilenlaenge und Laufweite im gemalten Bild. Inter ersetzt die
Grotesk (Helvetica Neue/San Francisco), Gelasio die Serife (Georgia) - beide
metrisch bzw. optisch nah genug, dass der gemalte Text auf allen drei
Plattformen gleich umbricht.

## Herkunftstabelle

| Datei | Schrift/Schnitt | Quelle | Version | Lizenz | Groesse (Byte) | SHA-256 |
|---|---|---|---|---|---|---|
| `inter-400.woff2` | Inter Regular (400) | github.com/rsms/inter, Release v4.1, Datei `web/Inter-Regular.woff2` aus `Inter-4.1.zip` | 4.1 | SIL Open Font License 1.1 | 111268 | `e06f6b1bc553aaea4e4668023ed0ab0a147129c3107f511bc7d03d361b0ae085` |
| `inter-700.woff2` | Inter Bold (700) | github.com/rsms/inter, Release v4.1, Datei `web/Inter-Bold.woff2` aus `Inter-4.1.zip` | 4.1 | SIL Open Font License 1.1 | 114840 | `fa888127b6da015b65569f0351f3b5c391ad928904951f1c20e9f8462a8d95ea` |
| `gelasio-400.woff2` | Gelasio Regular (400) | Google Fonts css2-API, `https://fonts.googleapis.com/css2?family=Gelasio:wght@400`, Latin-Subset von `fonts.gstatic.com/s/gelasio/v14/...` | v14 (Google-Fonts-Versionsstand) | SIL Open Font License 1.1 | 19536 | `68e2b704c5624ba84e70d826e33c5fc08d75eb452f834d869abdecc39f3b26ac` |
| `gelasio-700.woff2` | Gelasio Bold (700) | Google Fonts css2-API, `https://fonts.googleapis.com/css2?family=Gelasio:wght@700`, Latin-Subset von `fonts.gstatic.com/s/gelasio/v14/...` | v14 (Google-Fonts-Versionsstand) | SIL Open Font License 1.1 | 19844 | `dff91a5084db8f15e401e902acdac8768f5ae1746205c5319ad2cf3655517170` |

Dazu die Original-Lizenztexte:

| Datei | Gehoert zu | Groesse (Byte) | SHA-256 |
|---|---|---|---|
| `LIZENZ-inter.txt` | Inter (aus `LICENSE.txt` im Release-Zip) | 4380 | `262481e844521b326f5ecd053e59b98c8b2da78c8ee1bdbb6e8174305e54935a` |
| `LIZENZ-gelasio.txt` | Gelasio (aus `github.com/google/fonts`, Pfad `ofl/gelasio/OFL.txt`) | 4387 | `b393cb01867c919b44381512120dc3e4c954c7b47e2035c405f3a324799a4d29` |

Gesamtgroesse der vier Font-Dateien: 265488 Byte (~259 KB), Budget war 500 KB.

## Auswahl und Begruendung

- **Grotesk (statt Helvetica Neue/Arial):** "Inter" - erste Wahl aus der
  Aufgabe, kommt Helvetica/San Francisco in Formgebung und Laufweite nahe,
  OFL-lizenziert, offizielle Releases liefern fertige statische woff2-Schnitte
  unter `web/`. Kein Umweg ueber Roboto oder Source Sans 3 noetig.
- **Serife (statt Georgia):** "Gelasio" statt "Source Serif 4" - Gelasio wurde
  von Google/Sorkin Type gezielt als metrisch Georgia-kompatibler Ersatz
  gebaut (gleiche Zeilenlaengen, gleicher Umbruch), OFL-lizenziert, ueber die
  Google-Fonts-css2-API als statisches woff2 verfuegbar. Das trifft die
  Aufgabe genauer als Source Serif 4 (optisch aehnlich, aber nicht metrisch
  gleich).

## Technische Pruefung

- `file *.woff2` meldet fuer alle vier Dateien "Web Open Font Format
  (Version 2)".
- `fontTools.ttLib.TTFont` bestaetigt je Datei Familienname und Schnitt
  (Inter Regular/Bold, Gelasio Regular/Bold), keine `fvar`-Tabelle (also
  statische Schnitte, keine Variable Fonts), und dass Umlaute (ä ö ü Ä Ö Ü),
  ß sowie die Satzzeichen „ " – — … im cmap enthalten sind.

## Was nicht ging / offen

- Nichts. Beide Schriften waren in erster Wahl (Inter, Gelasio) verfuegbar,
  ein Rueckgriff auf Roboto/Source Sans 3 oder Source Serif 4 war nicht
  noetig.
- Die Google-Fonts-Versionskennung fuer Gelasio ist nur als Pfadsegment
  `v14` aus der gstatic-URL ablesbar; ein Datumsstempel oder eine
  SemVer-Versionsnummer wird von der css2-API nicht mitgeliefert.
