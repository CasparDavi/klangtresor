# Song auf Ziellänge kürzen — die Entscheidungen

Stand 16.11.2026. Entwurf abgestimmt mit Caspar_D, noch nichts gebaut.
Herkunft des Verfahrens: Übergabe der Sitzung „Snegurotschka Mythos",
`/Volumes/Extreme_SSD/Entwicklung/_werkstatt_kuerzen/UEBERGABE.md`.

## Wozu

Caspar_Ds Discord-Stream lässt höchstens 6 Minuten zu. Zwei Suno-Songs wurden von Hand gekürzt
(Snegurotschka 6:46 → 6:00, Kupala-Nacht 6:57 → 6:00). Das soll ein Werkzeug im KlangTresor
werden.

## Die eine Bedingung

Caspar_D, 16.11.2026: *„die eingeblendeten schnitte sind halt vorschläge, und es ist auch völlig
wurscht, ob sie auf Schlagzeiten liegen. das einzige wichtige ist, dass sie ein vielfaches von
Takten auseinanderliegen."*

**Nicht** wo der Schnitt liegt, **nicht** auf welcher Zählzeit, **nicht** wie weit vom Schlag
entfernt. Nur der Abstand zählt.

Gerechnet wird über den **gebrochenen Schlagindex** aus Sunos Schlagmuster: `idx(t)` ist der
zwischen zwei Schlagzeiten interpolierte Index. Die Bedingung lautet

    idx(ende) − idx(anfang) = 4 · k        (k ganz, Takt zu 4 Schlägen)

Der Nutzer setzt den Schnitt frei; die App addiert `4k` und übersetzt zurück in Zeit. Das Ziel
liegt dann genauso weit vom nächsten Schlag entfernt wie der Anfang — die Phasenlage wird
**gespiegelt, nicht gerastet**. Takttreue ist exakt, und das lokale Tempo steckt automatisch
drin, weil zwischen echten Schlagzeiten interpoliert wird.

## Warum das Taktgitter Nebensache ist

Caspar_D, 16.11.2026: *„selbst wenn es drift gibt, wir haben nur sachen rausgeschnitten, die ein
oder zwei takte lang sind, und innerhalb dieser kurzen Stücke wird die drift nicht signifikant
stärker. wenn der erste schnitt eine halbe Zählzeit hinter dem 1. Schlag liegt, liegt sie 2 Takte
weiter maximal 0,5005 Zählzeiten hinter dem 1. Schlag des Zieltaktes, das hört man nicht."*

Gemessen an Kupalas sieben abgenommenen Sprüngen (Versatz zwischen Anfang und Ende der Naht, in
Zählzeiten):

| Sprung | Takte | Versatz |
|---|---|---|
| 32,61 | 1 | −0,09 |
| 81,09 | 2 | −0,08 |
| 162,16 | 2 | +0,11 |
| 235,70 | 2 | +0,03 |
| 337,67 | 1 | −0,01 |
| 386,98 | 2 | −0,08 |
| **20,91** | **3** | **−0,28** |

Sechs liegen unter 0,11 — unhörbar. Der erste liegt bei 0,28, weil er **drei** Takte lang ist und
im einzigen Abschnitt liegt, in dem Kupala mit 142,00 BPM läuft, wo das Werkstatt-Raster 143,58
annimmt. Ein Prozent Tempofehler mal zehn Sekunden Sprungweite ergibt 118 ms.

**Zwei Fehler sind dabei zu trennen:** *Drift* (das Tempo ändert sich im Song) ist über ein bis
zwei Takte bedeutungslos. *Tempofehler* (das angenommene Tempo liegt daneben) wächst linear mit
der Sprungweite. Nur der zweite hat F/G betroffen. **Folgerung: mehrere kurze Sprünge schlagen
einen langen**, auch wenn der lange klanglich besser dasteht — sie sind textschonender und robust
gegen jedes Rastermissverständnis.

## Woher die Schläge kommen

**Sunos eigenes Schlagmuster**, `s.schlaege` im Katalog (geerntet über
`/api/gen/<id>/downbeats`, seit 19.08.2026): je Schlag Zeitpunkt und Zählzeit 1–2–3–4.
**346 von 347 Songs** haben es (16.11.2026).

Gemessen an Snegurotschka, Bassdrum-Ausbeute je Punktmenge:

| | Ausbeute |
|---|---|
| Sunos Taktanfänge (226 Punkte) | **100 %** |
| gerechnetes Raster 75,999 / 0,264 | 67,1 % |
| Werkstatt-Raster 76,0 / 0,270 | 66,9 % |
| Zufallsraster 70,0 / 0,1 | 35,3 % |

Und F-Maß gegen Sunos 1007 Schläge (±70 ms): eigenes Raster 31,8 %, Werkstatt 31,3 %, Zufall
21,7 %. Jedes gleichmäßige Raster liegt also kaum über dem Zufallsboden — **weil ein Tempo die
falsche Darstellung ist.** Snegurotschka läuft bis etwa 340 s mit rund 152 BPM und danach mit
140,6; Kupala zieht von 142,00 auf 144,68 an und bricht zwischen 280 und 320 s auf 136,74 ein.
Sunos Muster nimmt kein Tempo an und hat deshalb kein Driftproblem. Seine Streuung ist gering:
0,4 bis 2,1 ms in den festen Abschnitten.

Fehlt das Muster (fremde Songs, eigene vor der Ernte), gibt es kein Kürzen, bis geerntet wurde.
Ein Rückfall-Verfahren ist als Backlog-Auftrag beschrieben und muss ebenfalls eine **Liste**
liefern, keine BPM-Zahl.

## Was ein Kandidat anzeigt

Caspar_D, 16.11.2026: *„der Balken muß mehrere Indikatoren zeigen"* — Lautstärkedifferenz,
Whisper-Inhalt, und ob es eine Textdopplung ist.

1. **Lautstärkedifferenz** in dB, mit Vorzeichen: der mittlere Pegelunterschied der beiden
   Acht-Schlag-Umgebungen (`l` aus der Übergabe). Bis 1,5 dB passt die Naht; darüber gleicht die
   App an und sagt es sichtbar; ab etwa 6 dB wird sie als untauglich ausgewiesen.
   **Nicht** der Pegelunterschied über einen Schlag — der besteht den Prüffall nicht: bei
   Snegurotschkas verworfenem Schnitt bei 312,11 zeigt er +2,7 dB, während das Fenster 9,2 dB
   sieht und Caspar_D ihn als holpernd verworfen hat.
2. **Klangähnlichkeit als Perzentil**, nicht als Rohwert: „besser als 99 % aller Stellen in
   diesem Song" statt „0,85". Bei Kupala liegt der Median aller Sprünge bei 0,42, 99 % bei
   höchstens 0,8. Das bringt den Zufallsboden mit, statt ihn zu verschweigen.
3. **Was der Sprung an Text wegwirft**, im Wortlaut aus Whisper. Eine Zeile, die im Song mehrfach
   vorkommt und deren andere Vorkommen stehenbleiben, darf weg; eine einmalige nicht. Reine
   Textrechnung, kein Gehör nötig.
4. **Lokales Tempo beider Seiten.** Ein Sprung, der über einen Tempowechsel hinweggeht, bringt
   zwei Tempi in Kontakt — das hört man unabhängig von der Klangähnlichkeit. Aus Sunos Muster
   kostet die Prüfung nichts: Median der Schlagabstände vor und nach der Naht.

Ein Kandidat, der klanglich glänzt und Text verschluckt, darf nicht als guter Vorschlag
dastehen. Bei Snegurotschka wären 34,7 s mit einem einzigen Sprung möglich (Wert 0,69, über der
Schwelle) — er würde 50 Whisper-Worte wegwerfen, darunter *„Ihr Haar wird nass"* und *„Ich halte
sie fest sie schmelzt dahin"*, die im Song nur einmal vorkommen.

## Wie bedient wird

**Schnitt setzen → Vorschläge erscheinen.** Caspar_D, 16.11.2026: *„ich müsste einen schnitt
setzen können und dann müssten in taktweisem abstand schnitte auftauchen die passen könnten."*
An jeder Taktgrenze dahinter ein Kandidat mit seinen Indikatoren. Klick setzt, Doppelklick
entfernt, Ziehen verschiebt.

**Die Naht vorhören.** Caspar_D: *„ggf muß ich halt beim schneiden hören können, dann kann man
immer noch korrigieren."* Zwei Takte vor dem Schnitt anfangen, zwei danach aufhören — nur der
Übergang, beliebig oft. Dafür ist die Maschinerie da: das zweite Deck (`audio2`) und die
Blendregler, die beim Anschluss zwischen zwei Songs gefahren werden.

**Zwei Richtungen der Korrektur, und sie sind verschieden:**
- *Die Sprungweite* — welcher Partner. Muss ein ganzes Vielfaches des Takts bleiben.
- *Die Lage der Naht* — wo im Takt geschnitten wird. Frei, und **beide Enden gemeinsam
  verschieben**: dann bleiben Länge und Takttreue, und man sucht nur die Stelle, an der man die
  Naht am wenigsten hört — in eine Pause statt auf einen Anschlag.

Die zweite Richtung kam in keinem der Verfahren vor und ist wahrscheinlich die wirksamste. Bei
Kupalas sieben Nähten liegt die Lage zwischen 7 und 210 ms neben dem Schlag; niemand hat sie
gewählt, sie ist aus dem Raster gefallen.

**Die Ziellänge ist eine Bilanz, kein Schnitt.** Ein Takt ist bei 76 BPM 3,16 s, eine Naht spart
also 3 bis 6 Sekunden. Die 46 Sekunden von Fassung D kamen aus drei Quellen: Intro 7,0 s +
fünf Nähte 28,4 s + Ende 10,7 s. Die Oberfläche zeigt, was noch fehlt und woher es kommen kann.

## Rezept, nicht gerenderte Datei

Caspar_D, 16.11.2026: *„am besten wäre, sich nur die Schnittpositionen zu merken und den song on
the fly zu rendern für einen export bspw. Alles andere wird on the fly beim abspielen gemacht."*

Gespeichert wird ein Rezept am Titel, wie beim Effektclip-Studio. Beim Abspielen macht die App
beides selbst, und **beides steht schon im Haus**:
- *Sprünge*: zweites Deck auf die Zielposition, an der Schlaggrenze überblenden — derselbe
  Vorgang wie der Anschluss zwischen zwei Songs (seit 23.08.2026).
- *Tempo*: `audio.playbackRate` mit `preservesPitch = true`, mit weicher Rampe über acht Takte.
  Der Anschluss zieht damit heute schon das Tempo des laufenden Songs an das des nächsten an.
  `web/index.html:5104` nennt den Grund, warum es am `<audio>`-Element hängt und nicht an
  Web Audio: *„tonhoehenfestes Tempo (preservesPitch) nur das <audio>-Element kann, kein
  AudioBufferSource"*.

Zu rechnen ist beim Abspielen also fast nichts. Gerechnet wird beim Entwerfen.

**Offen:** ob zwei gleichzeitig laufende `<audio>` über AirPlay sauber durchkommen. Nicht
gemessen. Falls nicht, bleibt dort der harte Schnitt oder die exportierte Fassung.

## Überblenden und Pegel

Ein Stoßschnitt ist erlaubt — Caspar_D: *„es kann auch durchaus ein stoßschnitt sein, dann
brauchts aber wirklich eine Lautstärkeangleichung, dass es nicht schockt."*

Beim Überlappen addieren sich die Pegel; die Blende muss die Energie konstant halten (`qsin`),
nicht linear mischen. Bei 120 ms hört man das kaum, über zwei Takte sehr.

Die Angleichung rechnet aus dem **Fenstermittel mit Vorzeichen**, nicht aus einem Einzelschlag.
Grund: bei Snegurotschkas Schnitt 312,11 zeigt der Einzelschlag +2,7 dB (nach leiser), das
Fenster −2,6 dB (nach lauter) — eine Rampe nach dem Einzelschlag würde in die falsche Richtung
regeln.

**Zwei Sorten schlechter Nähte, nur eine ist angleichbar** (Unterscheidung erst ab 1,5 dB, darunter
ist das Vorzeichen Rauschen):
- *Pegelversatz*: Betrag und Vorzeichenmittel ähnlich groß (Snegurotschka 308,95: 9,1 und −9,1).
  Eine Rampe über einen Takt nach der Naht gleicht an.
- *Musterbruch*: Betrag viel größer als das Vorzeichenmittel (312,11: 9,2 gegen −2,6). Das Fenster
  kippt mitten durch (`−13 −11 −16 −7 +6 +2 +2 +17`), laute und leise Takte liegen gegeneinander
  verschoben. **Keine Rampe reparieren das.**

Ab etwa 6 dB wird als untauglich ausgewiesen, nicht geglättet. Und nichts wird gesperrt, ohne
einen Ausweg zu nennen.

**Prüflücke:** die 1,5-dB-Schranke ist an den Rändern belegt (unter 1 dB gut, über 9 dB
holpernd), in der Mitte nicht. Der einzige Fall zwischen 1,5 und 6 dB ist Snegurotschkas Schnitt
bei 100,53 (3,9 dB, Wert 0,52), und er steckt in den verworfenen Fassungen A, B und C, die
Caspar_D nur als Ganzes verworfen hat. Ob er für sich allein holpert, ist unbekannt. Ein
Hörbeleg wäre: 100,53 einzeln bauen, einmal roh und einmal mit Rampe.

## Was fehlt und entschieden ist

- **Rubber Band** wird vom Export gebraucht oder von niemandem — beim Abspielen kann der Browser
  die tonhöhenfeste Streckung selbst. Ob der Export es nutzt, ist offen; Caspar_D, 16.11.2026:
  *„aber das können wir immer noch entscheiden"*. Falls ja, kommt es wie ffmpeg per
  `quellen.txt` (GPL, wird geholt, nicht mitgeliefert): Windows- und macOS-Binaries 1,7 bzw.
  1,4 MB, Linux nur Quelltext oder `rubberband-cli` aus dem Paketverwalter.
- **Der Ort**: das Medien-Fenster am Titel, als weitere Tonfassung neben `eigen.mp3`. Nicht das
  Effektclip-Studio — das baut ein Rezept auf vorhandenem Ton, das Kürzen verändert den Ton
  selbst. Bedienung als eigenes Studio-Fenster nach dem Muster von `tbs-modul.js`.
- **Die Zeitachse**: eine gekürzte Fassung verschiebt alles, was an Zeiten hängt. Die Schnittliste
  ist aber eine Abbildung alt → neu, also lassen sich Whisper-Wortzeiten mitschneiden — die Bühne
  läuft dann auch auf der kurzen Fassung mit. Für einen Stream ist genau das nötig.
- **Das Original wird nie angefasst.** Die kurze Fassung legt sich daneben, der Nutzer wählt die
  Quelle wie bisher.
