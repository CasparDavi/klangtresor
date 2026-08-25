# Normen der Lautheitsmessung — und was daraus folgt

> **Die Arbeitsliste steht in [WAS-OFFEN-IST.md](WAS-OFFEN-IST.md).**
> Dieses Dokument ist der Bericht dazu — Messungen, Begründungen,
> Herleitung. Was noch zu TUN ist, steht seit dem 25.08.2026 nur noch an
> der einen Stelle, damit es nicht zwei Antworten auf dieselbe Frage
> gibt (Hausregel).

> **Namenswechsel:** Das Projekt hieß bis zum 24.08.2026 *MySuno*. Es heißt jetzt **KlangTresor** — „Suno" ist seit dem 06.01.2026 eingetragene Marke von Suno Inc., ausdrücklich für Software zum Abspielen und Bearbeiten von Audioinhalten. Wo in Zitaten und in der Chronik noch der alte Name steht, bleibt er stehen.

Angelegt am 18.08.2026, nachdem ein Vorschlag von mir gegen die Norm
verstieß und Caspar_D es bemerkt hat. Zweck: die Regeln so festhalten, dass
sie beim nächsten Mal nicht neu erarbeitet werden müssen.

**Quellen.** ITU-R BS.1770-4, EBU R128, EBU Tech 3341 (Kalibrierung),
EBU Tech 3342 (Schwankungsbreite). Nachgelesen zusätzlich im **CB Audio
Analyzer 1.0.0** von CastoByte (`~/Downloads/CB_Audio_Analyzer_Linux_1`,
Python/Qt, 10.753 Zeilen). Dessen Umsetzung ist sauber nach Norm gebaut
und diente hier als Gegenprobe.

**Lizenz beachten:** Sein Code steht unter GPL-3.0-or-later. Verfahren
und Zahlen sind frei — sie stammen aus offenen Normen. **Codeübernahme
würde KlangTresor unter dieselbe Lizenz zwingen**, und KlangTresor soll
weitergegeben werden können. Also nachbauen, nicht kopieren.

---

## Die Kette, mit den genauen Zahlen

| Schritt | Vorschrift |
|---|---|
| **K-Bewertung** | zwei Biquads hintereinander: Hochregal, dann Hochpass; Ergebnis auf ±4 begrenzt |
| **Energie** | Mittel der Quadrate je Kanal, über die Kanäle summiert (L und R mit Gewicht 1,0) |
| **Umrechnung** | `LUFS = −0,691 + 10 · log10(Energie)` |
| **Blöcke** | 400 ms Fenster, **100 ms Schritt** — also 75 % Überlappung |
| **absolutes Tor** | Blöcke über **−70 LUFS** |
| **relatives Tor** | ungetorter Wert **−10 LU**, nach unten auf −70 begrenzt |
| **Kurzzeit** | 3 s Fenster, **1 s Schritt** |
| **Schwankungsbreite** | Tor bei integriert **−20 LU**, dann **95. minus 10. Perzentil** |
| **True Peak** | **vierfach** überabgetastet; ohne Überabtastung nur Abtastspitze, und die liegt zu tief |
| **Clipping** | Abtastwerte mit Betrag **≥ 0,9999** |

**Zwei verschiedene Tore, die man leicht verwechselt** — ich habe es
getan:

- **−10 LU** ist das relative Tor der **integrierten Lautheit**.
- **−20 LU** ist das Tor der **Schwankungsbreite** (Tech 3342).

Sie gehören zu verschiedenen Messgrößen. Wer mit dem einen argumentiert
und das andere meint, begründet seine Zahl mit der falschen Vorschrift.

---

## Die Regel, an der ich mich vergriffen habe

> **Ein Tor wählt aus. Es hebt nichts an.**

Punkte unterhalb der Schwelle werden aus der Statistik **entfernt** —
sie werden nicht auf die Schwelle gelegt. Im CB Audio Analyzer steht an
allen drei Stellen dasselbe Muster, und es ist immer eine Auswahl:

```python
absolute    = block_energies[block_lufs > -70.0]
gated       = block_energies[block_lufs > relative_gate]
gated_short = short_lufs[short_lufs > lra_gate]
```

**Was ich stattdessen gebaut hatte:** einen „Boden", der alle Werte
darunter **auf** den Bodenwert anhebt. Das ist kein Tor, sondern eine
Verformung der Kurve — und ich habe es ausdrücklich mit dem Tor der
Norm begründet. Zweifach daneben: das Verfahren ist ein anderes, und
die zitierte Zahl gehörte zur anderen Messgröße.

**Der Unterschied ist nicht kosmetisch.** Anheben erzeugt an jeder
Pause ein Plateau, also ein Ereignis, das es nicht gibt; die Kurve
bekommt eine waagerechte Kante, wo Stille war. Auslassen erzeugt eine
Lücke, und eine Lücke ist ehrlich — dieselbe Regel wie „an den Rändern
nichts erfinden": lieber nichts zeigen als etwas behaupten.

**Die normgerechte Entsprechung** eines Bodens ist deshalb: die
betroffenen Zeitpunkte auf NaN setzen und im Bild als Lücke lassen.

### Was in KlangTresor davon betroffen ist

**Nur die Sockelkaskade.** Ihr Boden (fünftes Perzentil der
Momentanlautheit) ist ein Anhebe-Boden, also nach obiger Regel nicht
normgerecht. Er ist ein reines Darstellungsmittel und steht so auch im
Titel der Spur.

**Die gemessenen Normwerte sind unberührt.** Integrierte Lautheit,
Schwankungsbreite, True Peak und Reserve entstehen in
`web/fremd/analyzer-worker.js` nach Vorschrift, aus eigenen Blöcken und
mit beiden Toren. `node bin/pruefe-lautheit.js` prüft das gegen selbst
erzeugte Normsignale — vierzehn Prüfungen, darunter die
Absolutkalibrierung aus Tech 3341 und beide Tore.

**Offen:** ob der Boden der Kaskade auf Auslassen umgestellt wird.
Entschieden ist es nicht.

---

## Schimmer — das Verfahren im Einzelnen

Die frühere Notiz „Nachbarschaftsmedian unter Ausschluss der Spitze"
war zu grob. Im CB Audio Analyzer steht:

| | |
|---|---|
| Nachbarschaft | **13 Bänder** gleitendes Fenster, Ränder mit NaN aufgefüllt |
| Ausschluss | die **mittleren drei** Positionen auf NaN — also Spitze **plus direkte Nachbarn** |
| Bezugswert | `nanmedian` über die verbliebenen zehn |
| Prominenz | Band minus Nachbarschaftsmedian, **zweimal**: momentan und auf dem Langzeitmittel |
| Langzeitmittel | exponentiell, `0,996 · alt + 0,004 · neu` |

Ein Band gilt als verdächtig, wenn **alle vier** Bedingungen gelten:

```
Bandmitte ≥ 450 Hz
Bandpegel > −77 dB
momentane Prominenz > 7,8 dB
mittlere Prominenz  > 5,2 dB
```

Dazu ein **Ausdauerzähler** je Band: steigt mit 1,83 je Sekunde,
solange verdächtig, fällt mit 0,75 (bzw. 0,8 unterhalb 450 Hz),
gedeckelt bei 60. **Alarm ab zwei Sekunden.** Sortiert wird nach
`mittlere Prominenz + Dauer · 0,55`, gezeigt werden die acht stärksten.
Schweregrad `(Prominenz − 5,2)/12 · 0,58 + Dauer/17 · 0,42`, begrenzt
auf zwei Schwellen: ab 0,70 „hart", ab 0,38 „mittel", sonst „leicht".
Liegt das lauteste Band unter −88 dB, gilt Stille und die Liste wird
geleert.

**Warum der Ausschluss der mittleren drei nötig ist:** Eine kräftige
Spitze zieht ihren eigenen Bezugswert mit hoch und verschwindet darin.
Dass nicht nur die Spitze selbst, sondern auch ihre Nachbarn
ausgeschlossen werden, ist der Punkt, den die alte Notiz unterschlug —
eine Resonanz ist selten genau ein Band breit.

**Warum KlangTresor es anders rechnet:** Sein Programm hört live mit und
muss raten, ob eine Spitze bleibt; daher der Ausdauerzähler. KlangTresor hat
die ganze Datei und misst stattdessen den **Anteil der Rahmen**, in
denen das Band heraussticht, plus das **längste zusammenhängende
Zeitfenster**. Gefordert werden 25 % des Songs. Beide Wege lösen
dieselbe Frage — bleibt der Ton stehen? — mit den Mitteln ihrer
jeweiligen Lage.

---

## Was daraus für neue Vorschläge folgt

**Erstens:** Bevor eine Norm als Begründung herhält, nachsehen, welche
Messgröße sie betrifft und ob sie auswählt oder verändert.

**Zweitens:** Was aus der Lautheitskurve gerechnet wird, darf nicht als
Lautheit beschriftet werden, wenn unterwegs die K-Bewertung fehlt. Die
Energiereihe im Rechenkern (50 ms) ist das rohe Quadratmittel **eines
Kanals ohne K-Bewertung** — brauchbar für Rhythmus und Hüllkurve, aber
keine Lautheit und nicht in LU zu beschriften.

**Drittens:** Darstellungsmittel dürfen von der Norm abweichen, solange
sie es sagen. Der Boden der Kaskade steht im Titel der Spur; die
Messwerte daneben bleiben normgerecht. Was nicht geht, ist die Norm für
etwas zu zitieren, das sie nicht sagt.

---

## Zielpegel der Plattformen — geprüft am 18.08.2026

**Weniger negativ heißt lauter.** LUFS ist auf Vollaussteuerung
bezogen: 0 wäre die Grenze, −14 liegt vierzehn darunter. Ein Titel mit
**−11,8 LUFS ist damit 2,2 LU LAUTER** als ein Ziel von −14, nicht
leiser.

Nachweisbar an der eigenen Normprobe, ohne fremde Quelle:

```
Stereo-Sinus −23 dBFS  →  −19,98 LUFS
Stereo-Sinus −33 dBFS  →  −29,98 LUFS
```

Zehn Dezibel leiser ergibt zehn LUFS negativer.

**Die Verwechslung, die naheliegt:** „negativ, also ist noch Luft" gilt
für eine *andere* Größe. Die Luft bis zum Übersteuern ist der **True
Peak**, und der wird getrennt gemessen. Ein Titel kann gleichzeitig zu
laut für die Plattform (−11,8 gegen −14) und ohne Reserve sein
(−0,1 dBTP gegen −1,0) — genau dafür stehen zwei Zeilen in der
Gegenüberstellung.

| Plattform | Ziel | Spitze | Verhalten |
|---|---|---|---|
| Spotify | −14 LUFS | −1,0 dBTP | hebt leise Titel an, lässt dabei 1 dB Reserve |
| YouTube | −14 | −1,0 | **dreht nur zurück, hebt nie an** |
| TIDAL · Amazon · SoundCloud | −14 | −1,0 | wie Spotify |
| **Apple Music** | **−16** | −1,0 | der Ausreißer, geregelt über Sound Check |
| Club | −9 | −0,5 | keine Regelung |
| Rundfunk (R128) | −23 ± 0,5 | −1,0 | keine Regelung |

**Warum −1,0 dBTP:** Sowohl Spotifys Ogg-Vorbis- als auch Apples
AAC-Kodierer erzeugen Zwischenwertspitzen über 0 dBFS. Die Reserve gibt
ihnen Platz. Eine Datei, die auf Abtastwerten 0 dBFS zeigt, kann nach
dem Kodieren übersteuern.

**Was „zu laut" praktisch bedeutet:** Bei einer Plattform, die
zurückdreht, ist es kein Fehler — der Titel wird um den Unterschied
leiser abgespielt. Verloren ist nur die Dynamik, die man vorher mit dem
Begrenzer eingetauscht hat: Die Lautheit wird beim Abspielen wieder
weggenommen, die weggedrückten Spitzen kommen nicht zurück. Gefährlich
ist der umgekehrte Fall bei Spotify: Ein zu leiser Titel wird
**angehoben**, und dann zählt die Spitzenreserve.

**Vorher standen hier ungeprüfte Zahlen.** Die Recherche hat sie
bestätigt und eine Lücke aufgedeckt: Apple Music mit −16 LUFS fehlte in
der Tabelle. Anbieter ändern solche Werte — deshalb steht das
Prüfdatum dabei.

Quellen: [LUFS targets per platform 2026](https://www.forasoft.com/learn/audio-for-video/articles-audio/lufs-targets-per-platform-2026) ·
[Loudness normalization on Spotify](https://support.spotify.com/us/artists/article/loudness-normalization/) ·
[Spotify Disabled Their Limiter](https://www.meterplugs.com/blog/2021/07/15/spotify-disables-their-limiter.html) ·
[Mixing and Mastering for Streaming in 2026](https://mixinggpt.com/blog/mixing-mastering-streaming-loudness-2026)
