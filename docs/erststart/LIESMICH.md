# Erststart-Heft

Dreizehn Seiten A4, dunkel, in drei Sprachen: der Weg von der heruntergeladenen
Datei bis zum gefüllten Archiv. Entstanden am 19.11.2026, nachdem eine neue
Nutzerin an sechs Meldungen hintereinander gescheitert war, von denen keine die
Wahrheit sagte (der Grund war ein fehlender Ordner `library/`).

| Datei | |
|---|---|
| `KlangTresor-Erststart-de.pdf` | Deutsch |
| `KlangTresor-Erststart-en.pdf` | Englisch |
| `KlangTresor-Erststart-ru.pdf` | Russisch |

Über GitHub Pages erreichbar unter
`https://caspardavi.github.io/klangtresor/erststart/KlangTresor-Erststart-de.pdf`
(entsprechend `-en`, `-ru`).

## Neu bauen

Alles in `quelle/`. **Eine Textquelle:** jeder Satz steht genau einmal in
`texte.js` als `{de, en, ru}` — wer dort ändert, ändert alle drei Hefte.
`heft.html` enthält nur den Seitenplan und das Layout.

```bash
cd docs/erststart/quelle
node druck.mjs de        # auch: en, ru
```

Das Skript prüft die Seite vor dem Druck (`window.BERICHT`) und **verweigert
das PDF**, wenn etwas überläuft, ein Bild fehlt oder eine Seite zu einem Drittel
leer bliebe. Es schneidet nie stillschweigend ab. `--trotzdem` erzwingt den
Druck; das ist zum Nachsehen da, nicht zum Ausliefern.

Die fertigen PDFs gehören danach eine Ebene höher, neben diese Datei.

## Die Bilder

Alle aus einem echten Lauf in einem Sandkasten mit leerem Archiv — nichts ist
gestellt. Bilder mit Oberflächentext liegen je Sprache vor (`-en`, `-ru`);
fehlt eine Fassung, nimmt das Heft die deutsche, und das fällt im Bild sofort
auf. Kontonamen sind weichgezeichnet, damit niemand sie abtippt und sein
Archiv mit fremdem Werk füllt.

## Prüflücken

- Der Kasten, den das Lesezeichen auf `suno.com` aufmacht, fehlt als Bild: dafür
  bräuchte es eine echte Suno-Anmeldung. Schritt 4 trägt stattdessen eine
  Zeichnung der beiden Reiter — als Zeichnung erkennbar.
- Chromes Dreipunkt-Menü malt headless nicht mit; das Bild zeigt den
  Lesezeichen-Manager, der Weg steht in Worten daneben. Die Oberfläche darauf
  ist deutsch, auch im englischen und russischen Heft (die Bildunterschrift
  sagt es).
- Die russischen und englischen Sätze hat Henry noch nicht gegengelesen.
