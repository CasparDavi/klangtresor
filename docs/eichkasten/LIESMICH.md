# Der Eichkasten — die Messskripte

Die Werkzeuge zur Messung vom 28./29.08.2026; alle Befunde und
Deutungen in `docs/GESCHICHTEN-RAUM-EICHKASTEN.md`. Die Idee: Caspar_Ds
Playlists sind handgepflegte, bekannte Wahrheit — an ihnen wird jede
Änderung an Modell, Kondensat-Prompt oder Karte gemessen, BEVOR man ihr
traut. Alles rein lesend, jedes Skript läuft für sich:

    node docs/eichkasten/messlauf.js

| Skript | misst |
|---|---|
| `messlauf.js` | Die Leiter (Fassungen, Gegenüber, Übersetzungen, Ahnheim, Serien, Untergrund) in drei Räumen: Kondensat, Volltext (`docs/eichkasten/vorher-vektoren/`, seit 08.09. hier statt unter `library/kondensate/`), Klang. Dazu Vier-Felder-Kompaktheit je Playlist, Japanisch-Heilung (Partner-Ränge), Zeitpfeil, Kollision Gute Laune ↔ Lea. Schreibt `messlauf-ergebnis.json` hierher. |
| `achsen.js` | Die modellfreien Achsen-Zähler (Präteritum, Erzähl-Anteil, Imperative) an den bekannten Enden, plus das geteilte Kondensat-Vokabular je Gruppe. |
| `karte-treue.js` | Was die Projektionen (NMDS/UMAP, 2D/3D) von der 768d-Wahrheit bewahren: Gruppen-Kompaktheit je Projektion, Nachbarschaftstreue, Deckung der gespeicherten Nachbarliste. |
| `namen-test.js` | Die gerechneten Gruppen des Stands vom 28.08. abends (`docs/eichkasten/karte-geschichten.json.vor-schritt2`, seit 08.09. hier statt in `library/entwurf/`), benannt per Ortsbegriffen — der Belastungstest, der den generischen Namensweg freigab. |
| `ollama.js` | Kein Messwerkzeug, ein Beleg: das Versuchsskript vom 28.08., das Liedtexte per Ollama kondensierte (aus `library/kondensate/arbeit/`, dort am 08.09. gelöscht). Aufgehoben für die vertagte Kondensat-Entscheidung (HANDARBEIT-PRUEFUNG.md, Weg c). Läuft nicht mehr — seine Bündel-Eingaben sind weg. |

Feste Saaten überall — gleicher Bestand, gleiche Zahlen. Referenzwerte
vom 29.08.2026 (257 Lieder): Volltext-Untergrund 0,658 · Kondensat-
Untergrund 0,508 · Gegenüber (Volltext) 0,863 · Ahnheim-Formzwillinge
im Klang 0,471. Weichen künftige Läufe deutlich ab, hat sich etwas
verändert — erst verstehen, dann weiterbauen.

Perspektive (Backlog, „Geschichten-Raum: nächste Schritte"): eine
Bordmittel-Fassung als `bin/eichkasten.js` im Wartungslauf, die auf
jedem Bestand läuft (v2-Familien, Titel-Übersetzungspaare), nicht nur
auf diesem.
