# Bewegtes Artwork aus dem Standbild — Entwurf

**Stand 28.08.2026. Nichts davon läuft im KlangTresor** — es ist eine
Werkbank, mit der die Sache ausprobiert wurde. Die Begründung, warum es
so aussieht, wie es aussieht, steht in `docs/BACKLOG.md` unter
„Bewegte Standbilder".

## Was hier liegt

| | |
|---|---|
| `regler.js` | Die Stellschrauben, jede mit Wirkung und Richtung |
| `rendern.js` | Der Renderer — Katalog rein, MP4 raus, über ffmpeg |
| `werkstatt.html` | Der Werkzeugkasten zum Drehen, live im Browser |

## Wie man es benutzt

Der Renderer nimmt Titel, Startzeit und die Art:

```bash
node -e "require('./docs/entwuerfe/bewegtbild/rendern.js').bauen('Waldesrauschen', 60, 'g')"
```

`f` ist das schlagende Rescale, `g` der Farbwechsel. Gedreht wird in
`regler.js`.

Die Werkstatt braucht keinen Server — Datei im Browser öffnen. Drei
Cover sind eingebettet, damit sie ohne KlangTresor läuft.

## Woher die Bewegung kommt

Nichts wird im Bild gesucht. Alles steht im Katalog, für **alle 321
Songs**:

- `schlaege` — Sunos Schlagzeiten als `[zeit, zählzeit]`; die Eins des
  Takts ist Zählzeit 1. Sie waren die ganze Zeit da; `bin/katalog.js`
  nimmt sie beim Verschlanken heraus, `lesen()` liefert sie mit.
- `farben.akzent` / `farben.akzent2` — die Palette aus dem Cover
- das Cover selbst

**Die Instrumentspuren werden nicht gebraucht.** Der erste Anlauf am
26.08. rechnete die Hüllkurven aus den Stems; Sunos Schlagzeiten sind
genauer, liegen für jeden Song vor und kosten keine 85 MB je Stück.

## Was noch offen ist

Steht im Backlog. Das Wichtigste: Dunkle Cover nehmen kaum Farbe an,
weil die Tönung mit der Bildhelligkeit multipliziert wird.
