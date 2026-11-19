# Smart-TV-Umsetzung

Stand 19.11.2026. Ausgangsfrage von Caspar_D: *„Welche Webbrowser benutzen denn moderne SmartTVs
und was für Optimierungen lohnen sich, um diese zu unterstützen?"*

Dieses Blatt ist eine Zeichnung, kein Bauauftrag. Gebaut wird nichts, bevor die Richtung steht.

---

## 1. Was in den Geräten steckt

**Prüflücke, gleich vorweg:** eine belastbare, aktuelle Übersicht gibt es nicht. Samsung und LG
veröffentlichen die Chromium-Fassung ihrer Fernseher nicht systematisch. Die Zahlen unten stammen aus
Fremdquellen (Signage-Anbieter, Geräte-Kennungslisten, eine Entwicklerfibel) und widersprechen sich
teils für dasselbe Modelljahr. Belastbar ist nur die Struktur.

Und die lautet: **es ist überall Chromium.** Kein WebKit, kein Gecko, keine zweite Engine-Familie.
Das Problem heißt nicht „ein anderer Browser", es heißt **Alter** — und bei Samsung und LG wird die
Engine beim Bau festgelegt und mit Firmware-Aktualisierungen *nicht* angehoben. Ein Fernseher von
2022 bleibt bei Chromium 94, auch 2026.

| Plattform | Engine | Fassung (ungefähr, nach Modelljahr) |
|---|---|---|
| Samsung Tizen | Samsung Browser auf Chromium | 2022 ≈ 94 · 2023 ≈ 108 · 2024 ≈ 118 · 2025 ≈ 120 |
| LG webOS | eigener Browser auf Blink | webOS 22 ≈ 87 · 23 ≈ 94 · 24 ≈ 119 |
| Android TV / Google TV (Sony, Philips, TCL) | Chrome bzw. WebView, über den Play Store aktualisierbar | aktuell — aber oft ist gar kein Browser vorinstalliert |
| Fire TV | Amazon Silk, Chromium | wird laufend aktualisiert |
| Hisense VIDAA, Vewd (ehemals Opera TV) | Chromium | je Gerät verschieden |
| Roku, Vizio SmartCast | — | **kein Webbrowser**, fallen heraus |

Quellen (alle Fremdquellen, Stand 19.11.2026):
- https://support.embedsignage.com/en/articles/9626818-what-chromium-webkit-version-does-my-device-run
- https://floatleftinteractive.com/guides/samsung-tizen-tv-development-new-features-and-best-practices/
- https://gist.github.com/ravshansbox/ab55ded7e275db7341c24b3994c2b344
- https://deviceatlas.com/blog/list-smart-tv-user-agent-strings
- https://docs.wallboard.us/docs/players/supported-browsers/

---

## 2. Was der KlangTresor heute verlangt

Gemessen am 19.11.2026 über `web/index.html` und die sechs Skripte daneben (`hitstrom.js`,
`knotenschnur.js`, `klangfeder-blatt.js`, `tbs-modul.js`, `qr.js`, `klang-woerter.js`). Die unterste
Engine ergibt sich aus dem anspruchsvollsten Mittel, nicht aus dem häufigsten.

| Mittel | Stellen | braucht Chromium |
|---|---|---|
| `color-mix()` | 63 | **111** (2023) |
| `dvh` | 4 | 108 |
| `:has()` | 5 | 105 |
| `gap` im Flexbox | 243 | 84 |
| `:is()` | 72 | 88 |
| `clamp()` | 26 | 79 |
| `aspect-ratio` | 18 | 88 |
| `backdrop-filter` | 10 | 76 |
| `?.` und `??` | 21 | 80 |

Nicht benutzt und damit kein Thema: `container-type`, `oklch`, `svh`, `subgrid`, `text-wrap`,
`structuredClone`, `Object.hasOwn`, `toSorted`, logische Zuweisungen.

**Die Schwelle liegt bei Chromium 111.** Übersetzt: auf den Samsung-Modellen von 2024 und 2025, auf
webOS 24, auf Android TV und auf Fire TV läuft der KlangTresor jetzt schon. Auf den 2022er- und
2023er-Geräten nicht.

Und er scheitert **still**: ein unbekanntes `color-mix()` macht die ganze Deklaration ungültig, dann
fallen 63 Hintergründe, Ränder und Schatten weg, ohne eine Meldung. `dvh` läßt Höhen zusammenfallen.
Unterhalb von Chromium 80 ist `?.` dagegen ein *Syntaxfehler* — das Skript lädt nicht, die Seite
bleibt weiß.

### Zwei Meßfehler, die dabei unterlaufen sind

Beide Male meldete die Zählung glatte Nullen, und beide Male war die Null falsch:

1. `index.html` enthält Bytes, die grep als binär einstuft — dann unterdrückt `-o` jede Ausgabe.
   `-a` setzen.
2. Die Shell ist zsh, und zsh trennt eine unquotierte Variable **nicht** in Wörter. `grep "$m" $f`
   mit `f="a.js b.js"` übergibt einen einzigen Dateinamen. Array benutzen: `f=(a.js b.js)` und
   `"${f[@]}"`.

---

## 3. Die Sache, die größer ist als die Engine

**Der Fernseher hat keinen Zeiger.** Bedient wird mit einem Steuerkreuz, und der TV-Browser schiebt
den Fokus nur zwischen Elementen weiter, die von sich aus fokussierbar sind.

Im Haus stehen **0 `tabindex`**, zwei `:focus-visible`-Regeln und insgesamt vierzehn
`:focus`-Regeln auf zwei Megabyte Oberfläche. Der größte Teil der Bedienung hängt an
`<div onclick=…>`, und da kommt ein Steuerkreuz nicht hin.

Dazu die Schriftgrade: 11 px kommt 62-mal vor, 12 px 105-mal, dazu 9 px, 9,5 px, 10 px, 10,5 px.
Auf einem 55-Zoll-Gerät aus drei Metern Entfernung entspricht 12 px etwa 4 px am Schreibtisch.

Dazu die Breiten: die Weichen gehen von 900 px abwärts (`max-width` 900, 860, 820, 640, 520). Ein
Fernseher meldet in der Regel 1920 × 1080 CSS-Pixel und bekommt damit das volle
Schreibtisch-Layout — geometrisch richtig, typografisch unlesbar. Ältere Geräte beschneiden zudem
rund 5 % jeder Kante (Overscan), die Ränder der Oberfläche liegen dann außerhalb des Bildes.

Das ist kein Regler und kein Nachmittag, das ist ein Durchgang durch jedes anklickbare Element.

---

## 4. Die drei Wege

### a) Rückfall-Deklarationen — ein halber Tag

Vor jedes `color-mix()`, jedes `dvh` und jedes `:has()` kommt die einfache Fassung derselben
Eigenschaft. Die Kaskade erledigt den Rest von selbst: die alte Engine behält den Rückfall, die neue
nimmt das Moderne.

```css
background: #1a1a1a;                                   /* Rückfall */
background: color-mix(in srgb, var(--bg) 86%, transparent);
```

Kein JavaScript, kein Bauschritt, im normalen Browser ändert sich nichts. Senkt die Schwelle von 111
auf etwa 94 und holt damit Samsung ab 2022 und webOS ab 23 herein.

Nachweisbar an einem alten Chromium-Build im Container, nicht nur durch Lesen.

Die 21 Stellen mit `?.` und `??` bleiben: sie betreffen nur Geräte vor 2021, deren Browser ohnehin
mühsam sind. Der Ausfall dort ist allerdings der härteste von allen (weiße Seite), das gehört
gewußt, wenn jemand mit einem 2020er-Gerät auftaucht.

### b) Der Fernseher als Anzeige, bedient vom Telefon — ein bis zwei Tage

Das Plakat formatfüllend auf dem Schirm, ohne jede Bedienung, und das Handy bleibt die
Fernbedienung. Der mobile Teil läuft, der QR-Code ist da (`web/qr.js`), die Plakatansicht ist da.

Das ist, was im Wohnzimmer tatsächlich passiert, und es umgeht beide großen Probleme: keine
Steuerkreuz-Navigation nötig, und das Plakat hat von Natur aus wenige große Elemente statt
11-px-Tabellen.

### c) Volle Bedienbarkeit per Steuerkreuz — mehrere Tage

Fokussierbarkeit und ein sichtbarer Fokusrahmen für jedes Bedienelement, Pfeiltasten-Behandlung, ein
Fernsehmodus mit globalem Vergrößerungsfaktor, Overscan-Rand. Eine eigene Baustelle.

---

## 5. Empfehlung

**a** sofort mitnehmen, weil es ohnehin richtig ist und nichts kostet. **b** als das behandeln, was
„Smart-TV-Unterstützung" beim KlangTresor eigentlich heißt. **c** erst bauen, wenn vom Sofa aus
wirklich *geblättert* werden soll und nicht nur *zugesehen*.

Offen und von Caspar_D zu entscheiden: ob **b** oder **c** gilt. Danach richtet sich alles andere.
