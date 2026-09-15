# Videonaht – Statistik über alle Bewegtbilder im Archiv

Stand 15.09.2026, Rechenfassung 9. Anlass (Caspar_D, 15.09.2026): *„Die Videos hast du alle in der
Hand, du kannst schauen, wie stark Anfang und Ende abweichen und ggf daraus ableiten, ob eine harte
Taktnaht oder echte Effekte eingesetzt werden und Vorschläge machen."* Randbedingung: der Loop ist
höchstens 10 s lang, der Übergang liegt **innerhalb** der 10 s.

Methode: `docs/effektclip/VIDEO-PLAN.md` §2, §6.1, §6.3–6.5, §6.7. Werkzeug, Aufruf und Kennzahlen:
`LIESMICH.md`. Diese Datei ist von Hand geschrieben und wird vom Lauf **nicht** überschrieben; die
maschinellen Tabellen (Histogramme, alle Spalten, Formeln, Schwellen) stehen in `tabellen.md`, alle
Zahlen je Video in `ergebnis.json`, Kontaktbögen in `bilder/`.

**Bestand:** 91 Videos – 85 Suno-Bewegtbilder (`artwork.mp4`), 2 Sprungfassungen
(`artwork.sprung.mp4`), 4 eigene Videos (`eigen.mp4`). Doppelt: Waifu (45077bba = 98f74c73) und die
eigene Braut von Corinth (1d21fa1b = 6869705f) sind bytegleich, die Sprungfassungen messen wie ihre
`artwork.mp4`. Gezählt wird trotzdem jede Datei; verschieden sind 84 Suno- und 3 eigene Videos.

**Lesehilfe Nahtquotient q:** Sprung an der Naht ÷ 95. Perzentil der normalen Bildwechsel. Unter 1
unsichtbar. Ein **ganz gewöhnlicher** Bildwechsel liegt im Median bei 0,5 – dort liegt eine perfekte
Naht, nicht bei 0. Ein q nahe 0 heißt: Schlussbild = Anfangsbild, also ein Doppelbild an der Naht.

---

## 1 · Klassen (§2)

| Klasse | Suno | Sprungfassung | eigene | gesamt |
|---|---:|---:|---:|---:|
| Mikrohandlung | 58 | 2 | 4 | 64 |
| Textur | 18 | 0 | 0 | 18 |
| Kamerafahrt | 7 | 0 | 0 | 7 |
| Standbild-nah | 1 | 0 | 0 | 1 |
| mit Schnitten | 1 | 0 | 0 | 1 |

Zwei Drittel sind Mikrohandlung. Standbild mit Effekten kommt praktisch nicht vor. Die Kamerafahrt
steht nicht in der Tabelle von §2, ist aber eine eigene Lage: die Fahrt kehrt nicht zum Anfang
zurück, Pendel und Abbremsen helfen dort nicht.

## 2 · Ganzes Video geloopt gegen besten Schnitt

| | Suno (85) | Sprungfassung (2) | eigene (4) |
|---|---:|---:|---:|
| q roh, Median | 0,46 | 1,79 | 0,31 |
| q roh unter 1 | 52 | 1 | 4 |
| q bester Schnitt, Median | 0,75 | 1,56 | 0,31 |
| q bester Schnitt unter 1 | 58 | 1 | 4 |
| Schlussbild = Bild 0 | 30 | 1 | 2 |
| bester Schnitt 4–5 s lang | 32 | 1 | 0 |
| bester Schnitt 9–10 s lang | 41 | 1 | 4 |

- **Suno liefert meist fertige Loops.** 52 von 85 lassen sich schon als Ganzes unsichtbar loopen.
- **41 Suno-Videos haben 241 Bilder (10,04 s).** Bei 30 davon wiederholt das Schlussbild Bild 0; der
  gemeinte Loop ist [0, 240) = genau 10 s. Die Nahtsuche wählt ihn, q steigt dabei von etwa 0,2 auf
  etwa 0,8 – das ist der Doppelbild-Ruck, der verschwindet, kein Rückschritt.
- **Wo kein Loop angelegt ist, wählt die Suche kurz:** 32 Suno-Videos landen bei 4–5 s. Bei nicht
  loopfähigem Material ist ein kurzes Stück das kleinere Übel.
- **Die eigenen Videos sind alle als Loop gebaut** (q 0,2–0,57).

## 3 · Übergangsbedarf (§6.7)

Stufe nach q des besten Schnitts: < 1 keiner, 1–2 Neutralzustand, > 2 Ereignis. Zusätzlich hebt ein
**Flächentausch** (≥ 50 % der Blöcke springen, mindestens doppelt so viele wie bei normalen Wechseln)
auf Ereignis. „Abbremsen" = Mikrohandlung mit Übergang, bekommt das sin²-Abbremsen aus §6.4.

| Stufe | Suno | Sprungfassung | eigene | gesamt |
|---|---:|---:|---:|---:|
| keiner | 58 | 1 | 4 | **63** |
| Neutralzustand | 9 | 0 | 0 | **9** |
| – davon Abbremsen (Mikrohandlung) | 8 | 0 | 0 | 8 |
| – davon Filmnebel/Unschärfe (Textur) | 1 | 0 | 0 | 1 |
| Ereignis | 18 | 1 | 0 | **19** |
| – davon Abbremsen oder Taktnaht (Mikrohandlung) | 14 | 1 | 0 | 15 |
| – davon Taktnaht mit Blitz / Whip Pan (Kamerafahrt) | 4 | 0 | 0 | 4 |
| **Abbremsen insgesamt** | 22 | 1 | 0 | **23** |

**Nach Prüfung am Bild (vorläufig, Suno):** 56 keiner · mindestens 11 Neutralzustand · 18 Ereignis; Abbremsen
23. Grund: „Das Mädchen im Moor" und „Finst're Nacht" springen sichtbar, obwohl q < 1 (§5); „Schnee"
ist Textur und braucht Blitz statt Abbremsen.

**Die 10-s-Grenze:** Von 28 Videos mit Übergang haben **17 kein Material** über den Schnitt hinaus
(weniger als 0,5 s vor dem Anfang oder nach dem Ende). Dort geht nur ein Neutralzustand oder ein
Blitz, kein mischender Übergang (Überblenden, GL Transitions, Wisch). Bei den übrigen 11 reicht das
Material für Mischen bis 0,75–5,9 s.

---

## 4 · Alle Videos

Sortiert nach q des besten Schnitts. Klasse ist die gemessene; „am Bild" nur, wo jemand den
Kontaktbogen oder Einzelbilder angesehen hat. „Flächentausch" = durch die Flächenregel auf Ereignis
angehoben. Volle id, Hinweise, Landkarte je 1-s-Fenster und Zeitkurven in `ergebnis.json`.

### Suno-Bewegtbilder (artwork.mp4, 85)

| Titel | id | Klasse | q roh → Schnitt | Schnitt | Vorschlag | am Bild |
|---|---|---|---|---|---|---|
| ICE - InterCity Express (ft. @tarja_ravenveil) | 4bb33d10 | Mikrohandlung | 0,02 → 0,01 | 0,5–9,54 s | kein Übergang |  |
| Aktion erforderlich v2 | de0b49b1 | Textur | 1,36 → 0,02 | 0,54–5,5 s | kein Übergang | passt (genau eine Periode) |
| Lass uns sanft erwachen | aa46008e | Textur | 0,04 → 0,04 | 0,33–9,58 s | kein Übergang |  |
| Wasser | f1661195 | Textur | 0,83 → 0,05 | 0,79–9,17 s | kein Übergang | passt |
| Wenn das Licht geht | 47f16f23 | Mikrohandlung | 0,1 → 0,09 | 2,38–7,54 s | kein Übergang |  |
| Morgen | 36a12fe4 | Mikrohandlung | 0,11 → 0,11 | 0,08–10,04 s | kein Übergang |  |
| Seit übervorgestern | 54b6d019 | Kamerafahrt | 0,13 → 0,13 | 0–10 s | kein Übergang |  |
| Zug um Zug - Kein Remis | e5899f42 | Mikrohandlung | 0,14 → 0,13 | 0,13–10,04 s | kein Übergang |  |
| Taten statt Worte! (ft. @vlekz) | 4743c6a5 | Mikrohandlung | 0,12 → 0,14 | 0–9,71 s | kein Übergang |  |
| Remix Mich (ft. ACTPA) | bf17cc9a | Mikrohandlung | 0,14 → 0,16 | 0,13–10,04 s | kein Übergang |  |
| 手と木 | 6b56c892 | Textur | 0,17 → 0,17 | 0–10 s | kein Übergang |  |
| Wächterin des Echten | cb5f7e56 | Mikrohandlung | 0,14 → 0,17 | 0,08–10,04 s | kein Übergang |  |
| Time Out | 8aa274a3 | Mikrohandlung | 0,17 → 0,17 | 0–9,96 s | kein Übergang |  |
| Autophagie v2 | edf59287 | Textur | 0,18 → 0,18 | 0–5,04 s | kein Übergang |  |
| Stille Nacht | a93bedc1 | Mikrohandlung | 0,19 → 0,19 | 0–10 s | kein Übergang |  |
| Lichtpunkte | 49158083 | Mikrohandlung | 0,18 → 0,21 | 0–9,92 s | kein Übergang |  |
| Hände und Holz | 89385361 | Textur | 0,15 → 0,23 | 0–10 s | kein Übergang |  |
| Glanz | f5e93fa2 | Mikrohandlung | 0,31 → 0,25 | 2,75–7,17 s | kein Übergang |  |
| Steig ein! | d2a6bce4 | Mikrohandlung | 0,22 → 0,25 | 0,08–10,04 s | kein Übergang |  |
| Ätherophon | 7c174d27 | Mikrohandlung | 0,11 → 0,26 | 0–10 s | kein Übergang |  |
| Abend im Park - Blicke | 0ca1c4cc | Mikrohandlung | 0,16 → 0,28 | 0–10 s | kein Übergang |  |
| Mahlgrad | 6d933ed4 | Mikrohandlung | 0,38 → 0,28 | 0,67–10,04 s | kein Übergang |  |
| Abend im Park - Du da drüben | fc823a10 | Mikrohandlung | 0,13 → 0,29 | 0–10 s | kein Übergang |  |
| Komm noch näher | e44e15b7 | Mikrohandlung | 0,03 → 0,33 | 0–10 s | kein Übergang |  |
| Halt mich fest | 430cc3af | Mikrohandlung | 0,14 → 0,33 | 0–10 s | kein Übergang |  |
| Vanille-Eis | 19f20a0f | Mikrohandlung | 0,17 → 0,36 | 0–10 s | kein Übergang |  |
| Tag X | a3e94300 | Mikrohandlung | 0,35 → 0,36 | 0,13–10,04 s | kein Übergang |  |
| Monolith | 6cc648b0 | Mikrohandlung | 0,16 → 0,41 | 0–10 s | kein Übergang |  |
| Zug um Zug - Die ewige Partie | 5078257f | Mikrohandlung | 0,41 → 0,41 | 0,08–10,04 s | kein Übergang |  |
| Noch lachst Du | 2ca4204b | Textur | 0,41 → 0,42 | 0,07–9,03 s | kein Übergang |  |
| Sync - Bio Anthem (ft. @auralillusion) | 602781a8 | Textur | 0,37 → 0,43 | 2,88–7,17 s | kein Übergang |  |
| Immersion vollendet - Waveform Anthem (ft. @auralillusion) | 8ee4c324 | Mikrohandlung | 0,34 → 0,43 | 0,08–8,04 s | kein Übergang |  |
| Urgewalt (ft. @robertodiorci66; @psyresinc) | b33067aa | Mikrohandlung | 0,99 → 0,47 | 0,13–4,88 s | kein Übergang |  |
| Moissanit | e85548dc | Mikrohandlung | 0,36 → 0,49 | 2,5–7,13 s | kein Übergang |  |
| Farben v2 | 4bcefa30 | Mikrohandlung | 0,46 → 0,54 | 0–10 s | kein Übergang |  |
| Spiralen (ft. SamAI) | 2c0fff06 | Textur | 0,3 → 0,57 | 0–10 s | kein Übergang |  |
| Das Bild - Erwartung | 4e14226b | Textur | 0,96 → 0,61 | 1,33–5,63 s | kein Übergang |  |
| Haxe | 322041de | Mikrohandlung | 0,31 → 0,66 | 0–10 s | kein Übergang |  |
| Enzian | 7a395c22 | Mikrohandlung | 0,35 → 0,69 | 0–10 s | kein Übergang |  |
| Der Tod und das Mädchen - Das letzte Mal (ft. Merlynn) | f975bd47 | Mikrohandlung | 0,7 → 0,7 | 0–9,42 s | kein Übergang |  |
| Der Vulkan und das Mädchen (ft. thebugman) | 79ed8b1b | Textur | 0,37 → 0,71 | 0–10 s | kein Übergang |  |
| Ab jetzt! | 11aa4651 | Mikrohandlung | 0,86 → 0,73 | 0,21–10,04 s | kein Übergang |  |
| Kerze | 91e5814b | Textur | 1,54 → 0,75 | 1,92–6,04 s | kein Übergang | passt |
| Frühling in den Straßen | 2d01fdb5 | Textur | 0,25 → 0,77 | 0–10 s | kein Übergang |  |
| Finst're Nacht im gleißend' Licht (ft. B's 🔥Ξdu Ғueㄥ🔥) | 215adf57 | Mikrohandlung | 1,55 → 0,78 | 0,88–4,92 s | kein Übergang | falsch: Auto ploppt auf |
| Checkout um Zwölf | 02c2e6ca | Mikrohandlung | 0,21 → 0,79 | 0–10 s | kein Übergang |  |
| Erweckt v2 | 187fe209 | Kamerafahrt | 0,14 → 0,79 | 0–10 s | kein Übergang |  |
| Staub | cd7aead2 | Textur | 0,82 → 0,79 | 0–4,13 s | kein Übergang |  |
| Kein Shutdown | e369f0e9 | Mikrohandlung | 0,23 → 0,8 | 0–10 s | kein Übergang |  |
| Mutterns Hände | 80d81627 | Mikrohandlung | 0,84 → 0,8 | 0–4,96 s | kein Übergang |  |
| Gleich | 977f33d0 | Mikrohandlung | 0,76 → 0,82 | 0–10 s | kein Übergang |  |
| Das Mädchen im Moor [STTZ Projekt Poesie] | 352cf0a5 | Kamerafahrt | 1,74 → 0,83 | 4,58–8,58 s | kein Übergang | falsch: Mädchen dreht sich sichtbar um; eher Mikrohandlung |
| Koffein v2 | dd18e25d | Textur | 0,21 → 0,83 | 0–10 s | kein Übergang |  |
| O-Zwei | 74116303 | Standbild-nah | 3,1 → 0,85 | 1,58–5,58 s | kein Übergang | passt |
| Electric rain im Stahlhimmel (ft. robertodiorci66) | 1b1c3612 | mit Schnitten | 1,46 → 0,89 | 0,75–4,75 s | kein Übergang | passt (Schnitt liegt außerhalb) |
| Unerreicht | 2583b425 | Mikrohandlung | 0,86 → 0,89 | 0–10 s | kein Übergang |  |
| Sakura Mädchen | ad4e073f | Textur | 0,1 → 0,99 | 0–10 s | kein Übergang | passt (Grenzfall Figur/Textur) |
| 桜の少女 | 8739a9f1 | Textur | 0,16 → 1 | 0–10 s | kein Übergang |  |
| Neustart | 26439d1a | Mikrohandlung | 1,36 → 1,12 | 0,38–6 s | Neutralzustand: Abbremsen, dazwischen Unschärfe/Schwarz; kein Material zum Mischen |  |
| Doppio passo | d070bdfd | Mikrohandlung | 1,51 → 1,16 | 0–5,13 s | Neutralzustand: Abbremsen, dazwischen Unschärfe/Schwarz; kein Material zum Mischen | passt (Untergrenze) |
| Fieberwahn | 0c6c8e06 | Mikrohandlung | 1,08 → 1,3 | 0,17–6,04 s | Neutralzustand: Abbremsen, dazwischen Unschärfe/Schwarz; kein Material zum Mischen |  |
| Pfeifenwald | 4330f509 | Mikrohandlung | 1,15 → 1,33 | 0,13–10,04 s | Neutralzustand: Abbremsen, dazwischen Unschärfe/Schwarz; kein Material zum Mischen |  |
| Auf ganzer Linie ... (ft @tarja_ravenveil) | f84227b3 | Mikrohandlung | 1,36 → 1,36 | 0–6,04 s | Ereignis: Abbremsen + Blende, oder Taktnaht mit Blitz (Flächentausch); kein Material zum Mischen | Ereignis bestätigt; eher Kamerafahrt |
| Dogma v2 | 3445566f | Mikrohandlung | 2,55 → 1,36 | 0–4 s | Neutralzustand: Abbremsen, dazwischen Unschärfe/Schwarz; kein Material zum Mischen |  |
| Loreley v2 | 6d8c63f8 | Mikrohandlung | 3,24 → 1,37 | 2–6 s | Neutralzustand: Abbremsen, dazwischen Unschärfe/Schwarz; mischen bis 4 s |  |
| Lenore | b1ff440c | Textur | 2,24 → 1,37 | 4,96–8,96 s | Neutralzustand: Filmnebel oder Unschärfe; mischen bis 2 s | eigentlich Figuren (Galopp); Vorschlag passt |
| Tomatensalat (ft. @gerdenwald) | e5ba2525 | Mikrohandlung | 2,45 → 1,38 | 1,38–5,38 s | Neutralzustand: Abbremsen, dazwischen Unschärfe/Schwarz; mischen bis 1,33 s |  |
| Waifu mit weißem Haar (ft. Kasane) | 45077bba | Mikrohandlung | 2,91 → 1,39 | 5,04–10,04 s | Ereignis: Abbremsen + Blende, oder Taktnaht mit Blitz (Flächentausch); kein Material zum Mischen | Ereignis bestätigt |
| Waifu with White Hair (ft. Kasane) | 98f74c73 | Mikrohandlung | 2,91 → 1,39 | 5,04–10,04 s | Ereignis: Abbremsen + Blende, oder Taktnaht mit Blitz (Flächentausch); kein Material zum Mischen | wie 45077bba (gleiche Datei) |
| Das Bild - Ich komme | 1f1aaa90 | Kamerafahrt | 2,01 → 1,65 | 0,04–4,29 s | Ereignis: Taktnaht mit Blitz oder Whip Pan (Flächentausch); kein Material zum Mischen | Ereignis bestätigt |
| Ich, Thiel | 64fb13c7 | Kamerafahrt | 1,97 → 1,7 | 2,04–6,04 s | Ereignis: Taktnaht mit Blitz oder Whip Pan (Flächentausch); kein Material zum Mischen | Ereignis bestätigt (ganz anderes Bild) |
| Die Braut von Corinth | 1d21fa1b | Mikrohandlung | 2,27 → 1,94 | 1,04–9,96 s | Neutralzustand: Abbremsen, dazwischen Unschärfe/Schwarz; kein Material zum Mischen | passt |
| Labskaus-Klaus | e613cf6d | Mikrohandlung | 2,38 → 2,17 | 0–4 s | Ereignis: Abbremsen + Blende, oder Taktnaht mit Blitz; kein Material zum Mischen |  |
| Urgewalt - Singularität (ft. @robertodiorci66) | f29e4468 | Mikrohandlung | 3,48 → 2,31 | 0,38–4,38 s | Ereignis: Abbremsen + Blende, oder Taktnaht mit Blitz; mischen bis 0,75 s |  |
| Glut und Eis - Die Braut von Corinth | 89ef9f63 | Mikrohandlung | 3,34 → 2,32 | 4,46–8,96 s | Ereignis: Abbremsen + Blende, oder Taktnaht mit Blitz; mischen bis 2,17 s |  |
| Testosteron v3 | c38956b9 | Mikrohandlung | 2,88 → 2,38 | 0–4,04 s | Ereignis: Abbremsen + Blende, oder Taktnaht mit Blitz; kein Material zum Mischen |  |
| Wirt v2 | 39801fd7 | Mikrohandlung | 4,56 → 2,42 | 3,7–7,73 s | Ereignis: Abbremsen + Blende, oder Taktnaht mit Blitz; mischen bis 4,71 s |  |
| Schlaraffenland v3 | 1f5c63a2 | Mikrohandlung | 8,06 → 3,03 | 0,79–4,79 s | Ereignis: Abbremsen + Blende, oder Taktnaht mit Blitz; mischen bis 1,58 s |  |
| Erlkönigs Tochter '25 v2 (OLD MASTERS REINTERPRETED) | 73bf9ab3 | Kamerafahrt | 4,12 → 3,38 | 0–4 s | Ereignis: Taktnaht mit Blitz oder Whip Pan; kein Material zum Mischen | passt |
| Schnee | 215b1cf3 | Mikrohandlung | 4,01 → 3,73 | 0,58–4,63 s | Ereignis: Abbremsen + Blende, oder Taktnaht mit Blitz; mischen bis 1,17 s | eigentlich Textur (Schneefall): Blitz oder Überblenden statt Abbremsen |
| Dopamier mich! v2 | c734cf5d | Mikrohandlung | 11,87 → 4,66 | 2,96–6,96 s | Ereignis: Abbremsen + Blende, oder Taktnaht mit Blitz; mischen bis 5,92 s | passt |
| Stumm | f49c1907 | Mikrohandlung | 10,22 → 5,08 | 3,17–7,17 s | Ereignis: Abbremsen + Blende, oder Taktnaht mit Blitz; mischen bis 1,75 s | plausibel |
| Ich dreh mich nicht um! (ft. Ṧҝℴᶉ∀Ҝ٥ℨ₳) | d0a89c65 | Kamerafahrt | 6,83 → 6,09 | 0–4 s | Ereignis: Taktnaht mit Blitz oder Whip Pan; kein Material zum Mischen | passt |
| Kuss | 75bd95c3 | Mikrohandlung | 9,72 → 6,19 | 1,96–5,96 s | Ereignis: Abbremsen + Blende, oder Taktnaht mit Blitz; kein Material zum Mischen | passt |
| Roggen-Muhme | 773af97d | Mikrohandlung | 14,3 → 9,59 | 0–4,79 s | Ereignis: Abbremsen + Blende, oder Taktnaht mit Blitz; kein Material zum Mischen | passt |

### Sprungfassungen (artwork.sprung.mp4, 2)

| Titel | id | Klasse | q roh → Schnitt | Schnitt | Vorschlag | am Bild |
|---|---|---|---|---|---|---|
| Kein Shutdown | e369f0e9 | Mikrohandlung | 0,23 → 0,79 | 0–10 s | kein Übergang |  |
| Glut und Eis - Die Braut von Corinth | 89ef9f63 | Mikrohandlung | 3,34 → 2,32 | 4,46–8,96 s | Ereignis: Abbremsen + Blende, oder Taktnaht mit Blitz; mischen bis 2,17 s |  |

### eigene Videos (eigen.mp4, 4)

| Titel | id | Klasse | q roh → Schnitt | Schnitt | Vorschlag | am Bild |
|---|---|---|---|---|---|---|
| Seife | baff0ad0 | Mikrohandlung | 0,2 → 0,2 | 0,08–10,04 s | kein Übergang | passt |
| Die Braut von Corinth | 1d21fa1b | Mikrohandlung | 0,31 → 0,31 | 0,08–10 s | kein Übergang | passt |
| The Corinthian Bride | 6869705f | Mikrohandlung | 0,31 → 0,31 | 0,08–10 s | kein Übergang |  |
| Tiefengestirne v2 | aafc2e0c | Mikrohandlung | 0,32 → 0,57 | 0–10 s | kein Übergang | passt |

---

## 5 · Was die Prüfung am Bild korrigiert hat

25 Videos wurden am Kontaktbogen angesehen, bei fünf zusätzlich Einzelbilder an der Naht gezogen
(`bilder/pruef-*.png`). 17 Vorschläge passten, 8 nicht.

**Geändert (Rechenfassung 8 → 9): der Flächentausch.** Das Block-Maximum sättigt bei viel Bewegung
(p95 50–100 von 255). Dann bleibt q klein, auch wenn an der Naht ein ganz anderes Bild kommt. „Ich,
Thiel" (q 1,70, 93 % der Blöcke), „Auf ganzer Linie" (1,36, 64 %), „Das Bild – Ich komme" (1,65,
65 %) und „Waifu" ×2 (1,39, 69 %) liefen als Neutralzustand, zeigen aber einen Bildwechsel. Neue
Regel: ≥ 50 % der Blöcke springen und das mindestens doppelt so oft wie bei normalen Wechseln → Ereignis.
Alle schon vorher als Ereignis erkannten Flächensprünge liegen bei 52–96 %, perfekte Nähte bei 0–10 %.
30 % wäre zu scharf gewesen („Lenore" und „Electric rain", je 33 %, sind Lichtwechsel bzw.
Galopp-Versatz, kein neues Bild). Ergebnis: 5 Videos angehoben.

**Vorher schon geschärft (Fassung 6–8), ebenfalls am Bild:** Kerzenflackern zählte als 37 Schnitte
und 12-fps-Material mit Doppelbildern als 19 – dagegen Flächenkriterium (30 %) und Überspringen der
Doppelbilder. Die Stationarität rechnet auf dem Bildmittel, weil das Block-Maximum eine
hereinlaufende Figur flach machte. Blitze, die in 2–4 Bildern zurückkehren, zählen getrennt. Danach
bleibt ein einziger harter Schnitt im Bestand („Electric rain", 0,63 s) und er liegt außerhalb des
gewählten Clips.

**Verworfen:** ein Quotient über das Bildmittel. Er trennt die Flächentausch-Fälle, schlägt aber bei
nachweislich guten Nähten an (Sakura 1,17, Tomatensalat 5,86, Enzian 2,55), weil p95 dort unter 1 liegt.

**Offen, nicht geändert:**

- **Örtliche Sprünge in bewegten Videos.** „Das Mädchen im Moor" (q 0,83, Figur dreht sich sichtbar
  um, 19 % der Fläche) und „Finst're Nacht" (q 0,78, ein Auto ploppt auf) gelten als unsichtbar.
  Abhilfe wäre ein je Block normierter Quotient (Sprung eines Blocks ÷ p95 der Wechsel *dieses*
  Blocks, Maximum über die Blöcke). Das ändert die Definition in §6.5 und braucht Jörgs Wort.
- **Klassen-Einzelfälle:** „Schnee" (S 1,78) ist Schneefall, also Textur; wenige große Flocken
  dekorrelieren langsam. „Lenore" (S 1,21) und „Sakura Mädchen" (S 1,35) sind Figuren, die auf der
  Stelle bleiben, und gelten als Textur. Ihr Vorschlag bleibt vertretbar. „Auf ganzer Linie" und
  „Das Mädchen im Moor" sind eher Kamerafahrt bzw. Mikrohandlung als gemessen.
- **Halbbild-Doppel** (12 fps in 24 fps, schwach umkodiert, Wechsel um 1 statt unter 0,5): Kerze,
  桜の少女, Lenore, Schnee, Braut (Suno). Die Doppelbild-Grenze 0,5 erfasst sie nicht; der Erwartungswert
  „normaler Wechsel" fällt dort zu klein aus. Falsche Schnitte hat das nicht erzeugt.

## 6 · Grenzen der Methode

1. **Der Quotient misst Sichtbarkeit relativ zur Eigenbewegung.** In ruhigen Videos macht schon
   Glimmen einen großen Quotienten (O-Zwei: roh 3,1 bei p95 2,8), in wilden Videos versteckt die
   Sättigung echte Sprünge (Moor, Finst're Nacht). Die Flächenregel fängt nur den Bildtausch, nicht
   den örtlichen Sprung.
2. **Textur gegen Mikrohandlung ist die unsicherste Trennung.** S ist stetig verteilt (1,0–8,3),
   die Schwelle 1,5 ist an wenigen Kontaktbögen geprüft. Grenzfälle 1,4–1,6 (Koffein v2 1,43, Zug um
   Zug 1,51) muss jemand am bewegten Bild ansehen. S misst Stationarität, nicht Inhalt: Galopp auf der
   Stelle ist stationär, aber Figur.
3. **Kamerafahrt-Erkennung ist grob.** Der Gewinn durchs Ausrichten bleibt im Bestand klein (höchstens
   0,26), die Zoomstufe ist 3,2 %/s. Drei der sieben Fahrten loopen trotzdem unsichtbar.
4. **Kontaktbögen zeigen keine Bewegung.** Die Prüfung am Bild hat Standbilder verglichen; ob ein
   Sprung beim Abspielen stört, hängt auch von Bewegungsrichtung und Tempo ab. Das Urteil am fertigen
   Bild nach der Effektkette (§6.5, zweite Messregel) fehlt ganz.
5. **Die Nahtsuche minimiert den geglätteten Abstand dd, nicht den Sprung selbst.** Beides steht in
   `ergebnis.json` (`kleinster_sprung`). Der kleinste Sprung landet oft auf dem Doppelbild – darum ist
   er nicht die Wahl.
6. **Viele Doppelbilder verzerren p95 nach unten.** Bei fast halb Doppelbildern (Aktion erforderlich
   v2: 91 von 191 Wechseln, Lenore: 100) ist das 95. Perzentil über alle Wechsel eigentlich das
   90. der echten; der Quotient fällt dort eher zu hoch aus. „12 fps in 24 fps" ist bei Suno verbreitet.
7. **Musik fehlt.** Die Stufe sagt, *welche Art* Übergang; wohin er fällt (Eins, Snare, halber Takt)
   und wie lang er wird, kommt aus §6.6 und ist hier nicht gemessen.
