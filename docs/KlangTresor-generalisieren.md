# KlangTresor jenseits von Suno

*Was zu beachten wäre, wenn der Tresor auch Musik aufnähme, die nicht
von Suno stammt.*

Stand 28.08.2026. **Kein Vorhaben, eine Entscheidungsgrundlage.** Alle
Zahlen sind am Bestand gemessen, nicht geschätzt.

Anlaß war Tarjas Vorschlag vom selben Morgen, eigene Songs aufnehmen zu
können — siehe `docs/BACKLOG.md`, „Fremde Songs im Tresor". Caspar_D:
„den Klangtresor für eine ganze lokale Mediensammlung zu öffnen ist
natürlich durchaus reizvoll … aber das wäre ein grösseres Projekt, von
dem ich noch nicht weiß, ob ich es angehen möchte."

---

## Der Befund: die Trennlinie ist halb gezogen

Ohne daß es je Absicht war, liegt schon einiges auf der richtigen Seite.

**13 der Rechenskripte kennen Suno überhaupt nicht** — sie arbeiten am
Ton oder am Bild und wüßten nicht, woher er kommt:

```
farben.js  kacheln.js  vorrechnen.js  stoerfrequenz.js  eq-profil.js
whisper-text.js  whisper-abgleich.js  modelle-holen.js  kerne.js
pruefe-lautheit.js  pruefe-skripte.js  farbvergleich.js  fremdstand.js
```

**Und die selbst gerechneten Daten stehen nicht am Song**, sondern in
eigenen Dateien: `toene.json`, `klang.json`, `analyse-index.json`,
`karte.json`, `notenzonen.json`, `stoerfrequenzen.json`. Ein fremder
Song bekäme dort Einträge wie jeder andere.

Am Song selbst stehen 45 Felder, davon **21 von Suno**. Die übrigen sind
Ablagezustand (`wav`, `zuletztGesehen`) oder eigenes Urteil (`notiz`,
`instrumental`, `farben`).

## Wo es wirklich hängt

In der Oberfläche — `web/index.html`, `analyzer.js`, `server.js` —
kommen die Suno-Felder **629 mal** vor. Die Verteilung ist die
eigentliche Nachricht:

| Stellen | woran | bei fremden Songs |
|---:|---|---|
| 229 | Plays, Likes, Kommentare | **entfällt** — nur ausblenden |
| 122 | Suno-Konto, Handle, Anzeigename | **entfällt** — nur ausblenden |
| 74 | Karaoke-Zeitmarken | ersetzbar (Whisper läuft schon) |
| 39 | Taktbahn, Notenzonen, Signal zwischen Schlägen | **teuer** |
| 35 | Modellabzeichen und -filter | entfällt |
| 33 | Veröffentlichungsstand | entfällt |
| 31 | Strophe/Refrain-Bahn | nur zu raten |
| 26 | Playlists | entfällt oder eigen |
| 20 | Style-Prompt | von Hand |
| 19 | Beschreibung, Remix, Zählerverlauf | von Hand oder entfällt |

**Über die Hälfte muß man nicht nachbauen, sondern nur verbergen.** Das
ist der Unterschied zwischen „629 Stellen umschreiben" und „an rund 150
Stellen etwas ersetzen, an den übrigen einen Zustand kennen".

---

## Die drei Entscheidungen, die früh fallen müssen

### 1. Die Song-ID

`library/songs/<id>/` — der Ordnername **ist** die Suno-UUID. Daran
hängt jeder Medienpfad, jeder Katalogeintrag und jede Nebendatei.

Für fremde Songs braucht es eine eigene Vergabe, die

- nicht mit Suno-UUIDs kollidieren kann,
- **von außen erkennbar** ist (sonst rät jede Funktion),
- stabil bleibt, wenn die Quelldatei umbenannt wird.

Ein Präfix wäre das Naheliegende (`eigen-<hash>`), und der Hash über den
Dateiinhalt statt über den Namen. Diese Entscheidung ändert man
nachträglich nicht mehr — sie steht in jedem Pfad auf der Platte.

### 2. Ein Herkunftsfeld, bevor es 500 Songs sind

Nicht `fremd: true`, sondern `quelle: 'suno' | 'datei'`. Der Unterschied
ist nicht kosmetisch: Ein Wahrheitswert beantwortet eine Frage, ein Feld
mit Wert beantwortet auch die, die noch niemand gestellt hat — Bandcamp,
eigene Aufnahme, CD-Rip.

Damit kann jede Funktion selbst entscheiden, ob sie zuständig ist,
statt daß 629 Stellen raten. Solange es 321 Songs sind, ist das billig.

### 3. Sunos Schlagzeiten — der teuerste Verlust

Sie stecken in sechs Rechenskripten und 39 Stellen der Oberfläche:
Taktbahn, Notenzonen, „Signal zwischen Taktschlägen", und seit dem
27.08. die bewegten Standbilder.

Eigene Onset-Erkennung ist machbar — `bin/stoerfrequenz.js` zeigt, daß
das Haus so etwas kann —, aber sie ist deutlich ungenauer, besonders bei
weicher Musik ohne scharfen Anschlag. Und sie kennt die **Zählzeit**
nicht: Suno liefert mit, welcher Schlag die Eins des Takts ist. Das ist
nicht abzuleiten, das ist gewußt.

An dieser Stelle wäre ein fremder Song sichtbar zweiter Klasse. Die
Frage ist nicht, ob man das behebt, sondern ob man damit lebt.

---

## Was ohne weiteres weiterliefe

Mehr, als man denkt — und es ist der Teil, in dem die meiste Arbeit
steckt:

- **Der ganze Klangraum.** Discogs-EffNet hört den Ton, nicht die
  Herkunft. Genre, Stimmung, Instrumente, der Sternenhimmel, die Reise
  von Nachbar zu Nachbar.
- **Die komplette Analyse.** Lautheit nach EBU R128, True Peak,
  Dynamik, Stereobild, Phase, die Spektrogramme, die
  Plattform-Vorschläge.
- **Tonart und Stimmlage** aus `toene.js` — die rechnen aus dem Baß und
  der Gesangsspur, nicht aus Sunos Angabe.
- **Das Tonstudio** samt Equalizer, Kompressor, Kerbe, Einmessen.
- **Farben, Kacheln, Störfrequenzen.**
- **Karaoke über Whisper** — läuft heute schon für Songs, denen Suno
  keine Zeitmarken gibt.

## Was ersatzlos wegfiele

Alles, was mit **Publikum** zu tun hat: Plays, Likes, Kommentare, der
Zählerverlauf, die Nachbarschaft, der Hirschfaktor, das
Community-Register. Dazu der rote Knopf und das Lesezeichen — beide
holen bei Suno, für eine lokale Datei gibt es nichts zu holen.

Das ist kein Schaden, sondern eine Feststellung: Ein fremder Song hat
kein Publikum, das KlangTresor kennen könnte.

---

## Der billigste erste Schritt

Nicht planen, sondern **eine einzige fremde MP3** von Hand in einen
Songordner legen, mit einem minimalen Katalogeintrag: `id`, `titel`,
`dauer`, `quelle: 'datei'`. Dann durchlaufen lassen, was ohnehin läuft —
`vorrechnen.js`, `farben.js`, `kacheln.js`, `klang.js`, `toene.js` — und
zusehen, wo es bricht.

Das kostet einen Abend und beantwortet mehr Fragen als jede Planung.
Vor allem beantwortet es die, an die vorher niemand gedacht hat.

Hausregel dabei: **nicht am Produktivbestand.** Eine Kopie des
Katalogs, ein eigener `library`-Zweig.

---

## Die Frage dahinter

Die technischen Hürden sind überschaubar. Schwerer wiegt, was
KlangTresor dann *ist*.

Heute ist er ein Tresor für die eigenen Werke — der Name sagt es, und
die Oberfläche ist darauf gebaut: Sortierung nach Plays, Filter nach
Modell, die Community-Register, der Morgenlauf. Bei einer gemischten
Sammlung zeigten die zunehmend ins Leere: Ein Filter „Modell", der bei
der Hälfte der Songs nichts anbietet, ist schlechter als keiner.

Es gibt zwei ehrliche Antworten darauf:

**Eng bleiben.** Fremde Songs als Gäste behandeln — sie laufen, sie
werden analysiert, aber sie tauchen in den Suno-Registern nicht auf. Der
Tresor bleibt, was er ist, und nimmt nebenbei anderes mit.

**Weit werden.** Die Oberfläche darauf umstellen, daß Herkunft eine
Eigenschaft unter vielen ist. Das ist der größere Umbau, und es ist eine
andere Software.

Der Zwischenweg, den Caspar_D Tarja vorgeschlagen hat — eine Suno-ID
eines privaten Songs angeben zu können —, umgeht die Frage: Er bleibt
ganz im Suno-Konzept und braucht nichts von alledem. Ob das reicht,
weiß nur, wer gefragt hat.
