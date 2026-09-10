# Prüfstand: Effektclip-Studio

Ein Haus-Nachbau ohne Haus. Er lädt das Studio als eigene Datei, stellt einen Player, zwölf
Kacheln und einen Fetch-Ersatz im Speicher, und protokolliert jeden Zugriff. Damit lässt sich das
Studio messen, ohne den echten Server anzufassen und ohne an Produktivdaten zu arbeiten.

## Loslegen

```bash
node bin/effektclip-labor.js aus     # das Studio aus web/index.html in diesen Ordner holen
node bin/effektclip-labor.js daten   # Prüfdaten und Verweise anlegen
cd labor/effektclip-studio && python3 -m http.server 18811
```

Dann `http://127.0.0.1:18811/labor-haus.html`. Zurück ins Haus:

```bash
node bin/effektclip-labor.js ein     # spleißt zurück und prüft vorher die Syntax der ganzen Seite
```

**Die Quelle ist `web/index.html`, nicht dieser Ordner.** `tbs-modul.js` und `tbs.css` liegen hier
nur als Arbeitsstand und werden aus dem Haus geholt. Wer hier ändert, muss `ein` laufen lassen,
sonst ist die Änderung beim nächsten `aus` weg. Zwei Wahrheiten gibt es nicht.

## Was hier liegt

| Datei | |
|---|---|
| `labor-haus.html` | der Prüfstand selbst, versioniert |
| `labor-eigen.json` | Startlage: welche Titel randlose Titelbilder oder eigene Dateien haben |
| `messreihe.js` | die Messreihe zum Einwerfen in die Konsole, rund vier Minuten |
| `messreihe-2026-09-10.json` | die Grundlinie zum Vergleichen |
| `blendentest.html` | Einzeltest zur Blenden-Rechenzeit, ohne Studio und ohne Maler |
| `tbs-modul.js`, `tbs.css` | Arbeitsstand, abgeleitet, nicht versioniert |
| `_songs.json` | schmaler Auszug aus dem Katalog, Archivdaten, nicht versioniert |
| `media`, `testbild`, `fremd` | Verweise ins Archiv und in die Seite, nicht versioniert |

Die vier letzten Zeilen legt `daten` jederzeit neu an. `fremd` ist Pflicht: ohne den Verweis findet
der WebGL-Nebel sein Rauschen nicht und das Studio fällt still auf den Leinwand-Nebel zurück.

## Beim Messen

Die Regeln, die Grenzen des Verfahrens und die Grundlinie stehen in `docs/EFFEKTCLIP-REGELN.md`.
Kurz: eine stehende Uhr sieht keine Ereignisse, der Mittelwert misst Fläche und nicht Sichtbarkeit,
und ein Regler, der eine andere Karte in der Kette braucht, misst allein null.

Der Prüfstand hält seine Effektketten im `localStorage` des Browsers, nicht auf der Platte. Ein
Neuladen verliert also nichts, ein anderer Browser sieht aber nichts davon.
