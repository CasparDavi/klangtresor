# Die Dokumente, nach Modulen

Stand 11.09.2026. Vorher lagen 62 Dateien flach nebeneinander, sortiert nach nichts. Jetzt hat
jedes Dokument einen festen Platz bei seinem Modul — denn ein Text über den Analyzer bleibt für
immer einer über den Analyzer, während sein *Zustand* sich wöchentlich ändert.

**Die Regel:** Modul ist der Ort, Zustand ist ein Feld. Was offen ist, steht in **einer** Liste
([BACKLOG.md](BACKLOG.md)), und dort trägt jede Zeile ihr Modul und ihren Zustand. Sortieren ist
eine Ansicht, kein Umzug. Genau daran ist die alte `OFFEN.md` gestorben: sie *war* der Ordner
„offen", und als ihre Punkte erledigt waren, hat sie niemand herausgeholt.

## Die vier Zustände

| Zustand | heißt | wer ist am Zug |
|---|---|---|
| **offen** | klar genug zum Bauen, es fehlt nur Zeit | Claude |
| **zu planen** | es fehlt eine Skizze, nicht Zeit | Claude, aber erst mit Bild |
| **Entscheidung** | es fehlt Caspar_Ds Wort | Caspar_D |
| **erledigt** | verlässt die Liste, wird eine Zeile im Moduldokument | niemand |

Die Unterscheidung zwischen den ersten beiden ist nicht kosmetisch. Der „Lauf" im
Effektclip-Studio stand am 11.09.2026 als *offen* in der Liste, wurde wie etwas Baubares
behandelt und ist über sechs Umbauten in einer Nacht auseinandergefallen. Er war *zu planen*.

## Wo was liegt

| Ordner | Inhalt |
|---|---|
| **[analyse/](analyse/)** | Analyzer und Visualizer, Songstruktur, Normen, Tonarten, Liedfamilien, Farben |
| **[ton/](ton/)** | Tonstudio, Equalizer, Einmessen von Raum und Kette |
| **[klangraum/](klangraum/)** | Klangraum und Karte, Geschichten-Raum, Kondensat-Regeln |
| **[suno/](suno/)** | die Wege zu Suno, Audio-Bezug, Datenextraktion, Whisper |
| **[effektclip/](effektclip/)** | das Effektclip-Studio und seine Gesetze |
| **[haus/](haus/)** | Hausregeln, Zusammenarbeit, Geschichte, Morgenlauf, Handarbeit-Prüfung |
| **[handbuch/](handbuch/)** | das Handbuch für Leser, plus Skizzen, Gliederung, Wörterliste |
| **[forschung/](forschung/)** | Fachliteratur, Vergleich mit anderen, Generalisieren über Suno hinaus |
| **[eingang/](eingang/)** | Eingangskorb für Ideen von außen — „offen" ist dort der Normalzustand |
| **[archiv/](archiv/)** | abgeschlossen: Bericht, keine Anleitung mehr |

Im Wurzelverzeichnis bleiben nur zwei: **[BACKLOG.md](BACKLOG.md)**, die eine Liste des Offenen,
und **[NAECHSTER_CHAT.md](NAECHSTER_CHAT.md)**, das Tagebuch und die Übergabe zwischen Sitzungen.

## Was am 11.09.2026 zusammengelegt wurde

| aus | wurde |
|---|---|
| `SUNO-API` + `SUNO-APP-WEGE` + `SUNO-WEGE-KURZLISTE` | [suno/WEGE.md](suno/WEGE.md) — die Kurzliste als Kopf, der Rest als Beleg |
| `LITERATUR` + `LITERATUR-TIEF` | [forschung/LITERATUR.md](forschung/LITERATUR.md) — die tiefe Fassung hatte die erste längst abgelöst |
| `GESCHICHTEN-RAUM-EICHKASTEN` + `-BILANZ` | [klangraum/GESCHICHTEN-RAUM.md](klangraum/GESCHICHTEN-RAUM.md) — derselbe Tag, dasselbe Thema |

Ins Archiv gingen `OFFEN`, `UEBERGABE`, `WAV-PROTOKOLL`, `LEISTEN-UND-TONKETTE`,
`CLUSTERING-RECHERCHE`, `SUNO-ENDPUNKTE-ABGLEICH` und zwei Tagesprotokolle. Gelöscht wurde nichts,
git hält jede Fassung.

## Was hier nicht angefasst wird

`haus/HAUSREGELN.md`, `effektclip/EFFEKTCLIP-REGELN.md`, `analyse/NORMEN.md` und das `handbuch/`
sind Gesetz beziehungsweise fertiger Text für Leser. Der `eingang/` ist ein Korb, kein Plan.
