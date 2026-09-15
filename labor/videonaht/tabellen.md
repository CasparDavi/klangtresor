# Videonaht - Tabellen über alle Bewegtbilder (maschinell)

Erzeugt 2026-09-15 07:17 von `labor/videonaht/videonaht.mjs`. 91 Videos. Methode: VIDEO-PLAN §2, §6.1, §6.3–6.5, §6.7. Formeln und Schwellen am Ende; alle Zahlen in `ergebnis.json`, Kontaktbögen in `bilder/`.

## Klassen

| Klasse | Suno-Bewegtbild (artwork.mp4) | Suno, Sprungfassung (artwork.sprung.mp4) | eigene Videos (eigen.mp4) | gesamt |
|---|---:|---:|---:|---:|
| Standbild-nah | 1 | 0 | 0 | 1 |
| Textur | 18 | 0 | 0 | 18 |
| Mikrohandlung | 58 | 2 | 4 | 64 |
| Kamerafahrt | 7 | 0 | 0 | 7 |
| mit Schnitten | 1 | 0 | 0 | 1 |

## Nahtquotient: ganzes Video geloopt gegen besten Schnitt

**Suno-Bewegtbild (artwork.mp4)** (85)

| Quotient | roh | bester Schnitt |
|---|---:|---:|
| 0 … 0,5 | 43 ███████████████████████████████████████████ | 34 ██████████████████████████████████ |
| 0,5 … 1 | 9 █████████ | 24 ████████████████████████ |
| 1 … 1,5 | 6 ██████ | 11 ███████████ |
| 1,5 … 2 | 5 █████ | 3 ███ |
| 2 … 3 | 9 █████████ | 5 █████ |
| 3 … 5 | 7 ███████ | 4 ████ |
| 5 … 10 | 3 ███ | 4 ████ |
| 10 … ∞ | 3 ███ | 0  |

Median roh 0,46, Median bester Schnitt 0,75; unter 1: roh 52, bester Schnitt 58.


Schlussbild wiederholt Bild 0 (Loop ist [0, N−1)): 30. Erwartungswert: Median des Quotienten eines gewöhnlichen Bildwechsels 0,5 - eine perfekte Naht liegt dort, nicht bei 0.
Länger als 10 s (ganzes Video als Loop nicht erlaubt): 41. Bester Schnitt sichtbarer als das rohe Video: 26, davon 23 zu lang. Kleinster tatsächlicher Sprung unter 1: 60.

**Suno, Sprungfassung (artwork.sprung.mp4)** (2)

| Quotient | roh | bester Schnitt |
|---|---:|---:|
| 0 … 0,5 | 1 █ | 0  |
| 0,5 … 1 | 0  | 1 █ |
| 1 … 1,5 | 0  | 0  |
| 1,5 … 2 | 0  | 0  |
| 2 … 3 | 0  | 1 █ |
| 3 … 5 | 1 █ | 0  |
| 5 … 10 | 0  | 0  |
| 10 … ∞ | 0  | 0  |

Median roh 1,79, Median bester Schnitt 1,56; unter 1: roh 1, bester Schnitt 1.


Schlussbild wiederholt Bild 0 (Loop ist [0, N−1)): 1. Erwartungswert: Median des Quotienten eines gewöhnlichen Bildwechsels 0,58 - eine perfekte Naht liegt dort, nicht bei 0.
Länger als 10 s (ganzes Video als Loop nicht erlaubt): 2. Bester Schnitt sichtbarer als das rohe Video: 1, davon 1 zu lang. Kleinster tatsächlicher Sprung unter 1: 1.

**eigene Videos (eigen.mp4)** (4)

| Quotient | roh | bester Schnitt |
|---|---:|---:|
| 0 … 0,5 | 4 ████ | 3 ███ |
| 0,5 … 1 | 0  | 1 █ |
| 1 … 1,5 | 0  | 0  |
| 1,5 … 2 | 0  | 0  |
| 2 … 3 | 0  | 0  |
| 3 … 5 | 0  | 0  |
| 5 … 10 | 0  | 0  |
| 10 … ∞ | 0  | 0  |

Median roh 0,31, Median bester Schnitt 0,31; unter 1: roh 4, bester Schnitt 4.


Schlussbild wiederholt Bild 0 (Loop ist [0, N−1)): 2. Erwartungswert: Median des Quotienten eines gewöhnlichen Bildwechsels 0,39 - eine perfekte Naht liegt dort, nicht bei 0.
Länger als 10 s (ganzes Video als Loop nicht erlaubt): 2. Bester Schnitt sichtbarer als das rohe Video: 1, davon 1 zu lang. Kleinster tatsächlicher Sprung unter 1: 4.

## Welcher Übergang (§6.7: < 1 keiner, 1–2 Neutralzustand, > 2 Ereignis; Flächentausch ≥ 50 % hebt auf Ereignis)

Durch Flächentausch angehoben: Das Bild - Ich komme, Waifu mit weißem Haar (ft. Kasane), Ich, Thiel, Waifu with White Hair (ft. Kasane), Auf ganzer Linie ... (ft @tarja_ravenveil).

| Stufe | Suno-Bewegtbild (artwork.mp4) | Suno, Sprungfassung (artwork.sprung.mp4) | eigene Videos (eigen.mp4) | gesamt |
|---|---:|---:|---:|---:|
| keiner | 58 | 1 | 4 | 63 |
| Neutralzustand | 9 | 0 | 0 | 9 |
| Ereignis | 18 | 1 | 0 | 19 |

Stufe je Klasse (alle Gruppen):

| Klasse | keiner | Neutralzustand | Ereignis |
|---|---:|---:|---:|
| Standbild-nah | 1 | 0 | 0 |
| Textur | 17 | 1 | 0 |
| Mikrohandlung | 41 | 8 | 15 |
| Kamerafahrt | 3 | 0 | 4 |
| mit Schnitten | 1 | 0 | 0 |

**≤ 10 s:** von 28 Videos mit Übergang haben 17 kein Material über den Schnitt hinaus (mischende Übergänge dort unmöglich, nur Neutralzustand oder Blitz); Median des möglichen D der übrigen 2 s.

## Länge des besten Schnitts

| Länge | Suno-Bewegtbild (artwork.mp4) | Suno, Sprungfassung (artwork.sprung.mp4) | eigene Videos (eigen.mp4) |
|---|---:|---:|---:|
| 4–5 s | 32 | 1 | 0 |
| 5–6 s | 7 | 0 | 0 |
| 6–7 s | 1 | 0 | 0 |
| 7–8 s | 1 | 0 | 0 |
| 8–9 s | 3 | 0 | 0 |
| 9–10 s | 41 | 1 | 4 |

## Alle Videos

| Titel | Datei | Klasse | Bilder | fps | q roh | q Schnitt | Schnitt | q kleinster Sprung | q normaler Wechsel | Schlussbild = Bild 0 | S | Median c | Schnitte | Stufe |
|---|---|---|---:|---:|---:|---:|---|---:|---:|---|---:|---:|---:|---|
| Seife | [eigen.mp4](bilder/baff0ad0-1c38-4bbd-9c48-4fae0978beeb-eigen.png) | Mikrohandlung | 241 | 24 | 0,2 | 0,2 | 0,08–10,04 s | 0,19 | 0,4 | ja | 2,01 | 10,64 | 0 | keiner |
| Die Braut von Corinth | [eigen.mp4](bilder/1d21fa1b-4a77-43de-8362-70c5273f6340-eigen.png) | Mikrohandlung | 240 | 24 | 0,31 | 0,31 | 0,08–10 s | 0,03 | 0,38 |  | 1,92 | 13,58 | 0 | keiner |
| The Corinthian Bride | [eigen.mp4](bilder/6869705f-0721-4d86-8917-903d711b8321-eigen.png) | Mikrohandlung | 240 | 24 | 0,31 | 0,31 | 0,08–10 s | 0,03 | 0,38 |  | 1,92 | 13,58 | 0 | keiner |
| Tiefengestirne v2 | [eigen.mp4](bilder/aafc2e0c-4a63-4046-8434-dc95159f4eb3-eigen.png) | Mikrohandlung | 241 | 24 | 0,32 | 0,57 | 0–10 s | 0,32 | 0,71 | ja | 1,73 | 19,37 | 0 | keiner |
| ICE - InterCity Express (ft. @tarja_ravenveil) | [artwork.mp4](bilder/4bb33d10-2d56-4c03-a9b2-4d9c31581873-artwork.png) | Mikrohandlung | 235 | 24 | 0,02 | 0,01 | 0,5–9,54 s | 0,01 | 0,66 | ja | 1,5 | 107,18 | 0 | keiner |
| Aktion erforderlich v2 | [artwork.mp4](bilder/de0b49b1-69fa-435e-89fa-90821efa3e4e-artwork.png) | Textur | 192 | 24 | 1,36 | 0,02 | 0,54–5,5 s | 0,02 | 0,23 |  | 1,41 | 0,52 | 0 | keiner |
| Lass uns sanft erwachen | [artwork.mp4](bilder/aa46008e-c624-4eb1-9c54-7e833f4bbf73-artwork.png) | Textur | 230 | 24 | 0,04 | 0,04 | 0,33–9,58 s | 0,04 | 0,48 | ja | 1,33 | 18,88 | 0 | keiner |
| Wasser | [artwork.mp4](bilder/f1661195-3b15-4ebd-90d6-0722154124a8-artwork.png) | Textur | 240 | 24 | 0,83 | 0,05 | 0,79–9,17 s | 0,05 | 0,69 |  | 1,06 | 24,61 | 0 | keiner |
| Wenn das Licht geht | [artwork.mp4](bilder/47f16f23-0ea8-4709-8e51-6e1a5174adc2-artwork.png) | Mikrohandlung | 236 | 24 | 0,1 | 0,09 | 2,38–7,54 s | 0,08 | 0,42 | ja | 1,98 | 13,63 | 0 | keiner |
| Morgen | [artwork.mp4](bilder/36a12fe4-27ff-4ecc-843d-a6fa9804ac2c-artwork.png) | Mikrohandlung | 241 | 24 | 0,11 | 0,11 | 0,08–10,04 s | 0,11 | 0,43 | ja | 1,89 | 30,9 | 0 | keiner |
| Seit übervorgestern | [artwork.mp4](bilder/54b6d019-2e6b-40e7-973e-c8cef5e1e36d-artwork.png) | Kamerafahrt | 240 | 24 | 0,13 | 0,13 | 0–10 s | 0,13 | 0,53 | ja | 1,39 | 30,41 | 0 | keiner |
| Zug um Zug - Kein Remis | [artwork.mp4](bilder/e5899f42-c200-4cf8-a5d8-1c3fc33f6f2e-artwork.png) | Mikrohandlung | 241 | 24 | 0,14 | 0,13 | 0,13–10,04 s | 0,13 | 0,63 | ja | 1,51 | 27,24 | 0 | keiner |
| Taten statt Worte! (ft. @vlekz) | [artwork.mp4](bilder/4743c6a5-9f80-442b-8d64-59ecfb99136b-artwork.png) | Mikrohandlung | 236 | 24 | 0,12 | 0,14 | 0–9,71 s | 0,1 | 0,47 | ja | 2,96 | 6 | 0 | keiner |
| Remix Mich (ft. ACTPA) | [artwork.mp4](bilder/bf17cc9a-2516-4adf-b0bb-f58b26439c70-artwork.png) | Mikrohandlung | 241 | 24 | 0,14 | 0,16 | 0,13–10,04 s | 0,13 | 0,39 | ja | 1,55 | 27,44 | 0 | keiner |
| 手と木 | [artwork.mp4](bilder/6b56c892-2a6f-437c-9cf1-c1d1b572610f-artwork.png) | Textur | 241 | 24 | 0,17 | 0,17 | 0–10 s | 0,17 | 0,59 | ja | 1,11 | 31,91 | 0 | keiner |
| Wächterin des Echten | [artwork.mp4](bilder/cb5f7e56-9188-4f4d-8749-c4d5217d88c3-artwork.png) | Mikrohandlung | 241 | 24 | 0,14 | 0,17 | 0,08–10,04 s | 0,13 | 0,14 |  | 2 | 9,4 | 0 | keiner |
| Time Out | [artwork.mp4](bilder/8aa274a3-c7f0-4236-a1da-230b4802cc44-artwork.png) | Mikrohandlung | 239 | 24 | 0,17 | 0,17 | 0–9,96 s | 0,13 | 0,47 | ja | 1,86 | 26,44 | 0 | keiner |
| Autophagie v2 | [artwork.mp4](bilder/edf59287-7cac-4801-9256-065c6f36afc5-artwork.png) | Textur | 121 | 24 | 0,18 | 0,18 | 0–5,04 s | 0,18 | 0,52 | ja | 1,17 | 35,6 | 0 | keiner |
| Stille Nacht | [artwork.mp4](bilder/a93bedc1-9ff3-440b-8bbc-7e95e0be88fb-artwork.png) | Mikrohandlung | 240 | 24 | 0,19 | 0,19 | 0–10 s | 0,14 | 0,48 | ja | 1,69 | 6,16 | 0 | keiner |
| Lichtpunkte | [artwork.mp4](bilder/49158083-68a9-47b1-8d64-b520365812f2-artwork.png) | Mikrohandlung | 240 | 24 | 0,18 | 0,21 | 0–9,92 s | 0,08 | 0,39 | ja | 1,83 | 7,74 | 0 | keiner |
| Hände und Holz | [artwork.mp4](bilder/89385361-cef7-4951-9ac5-71c8bdb1bd7c-artwork.png) | Textur | 241 | 24 | 0,15 | 0,23 | 0–10 s | 0,16 | 0,69 | ja | 1,02 | 44,99 | 0 | keiner |
| Glanz | [artwork.mp4](bilder/f5e93fa2-2b01-424a-a001-6603e08a9f1f-artwork.png) | Mikrohandlung | 238 | 24 | 0,31 | 0,25 | 2,75–7,17 s | 0,04 | 0,43 |  | 1,53 | 21,71 | 0 | keiner |
| Steig ein! | [artwork.mp4](bilder/d2a6bce4-d306-4931-9656-6517c774cce8-artwork.png) | Mikrohandlung | 241 | 24 | 0,22 | 0,25 | 0,08–10,04 s | 0,21 | 0,47 | ja | 1,58 | 19,28 | 0 | keiner |
| Ätherophon | [artwork.mp4](bilder/7c174d27-bc42-4f96-8b1d-dbc7664c7419-artwork.png) | Mikrohandlung | 241 | 24 | 0,11 | 0,26 | 0–10 s | 0,16 | 0,24 | ja | 2,65 | 19,39 | 0 | keiner |
| Abend im Park - Blicke | [artwork.mp4](bilder/0ca1c4cc-2a36-4988-b3d8-b3e3823ef3d1-artwork.png) | Mikrohandlung | 241 | 24 | 0,16 | 0,28 | 0–10 s | 0,16 | 0,36 | ja | 2,52 | 14,19 | 0 | keiner |
| Mahlgrad | [artwork.mp4](bilder/6d933ed4-d19e-481b-8003-d42c67982ffe-artwork.png) | Mikrohandlung | 241 | 24 | 0,38 | 0,28 | 0,67–10,04 s | 0,28 | 0,26 |  | 7,55 | 3,48 | 0 | keiner |
| Abend im Park - Du da drüben | [artwork.mp4](bilder/fc823a10-df87-4249-aba1-736e32954bdc-artwork.png) | Mikrohandlung | 241 | 24 | 0,13 | 0,29 | 0–10 s | 0,13 | 0,26 | ja | 2,15 | 14,09 | 0 | keiner |
| Komm noch näher | [artwork.mp4](bilder/e44e15b7-1a7e-41e3-8d09-5d1d5d5e6c5f-artwork.png) | Mikrohandlung | 241 | 24 | 0,03 | 0,33 | 0–10 s | 0,02 | 0,46 | ja | 1,54 | 45,9 | 0 | keiner |
| Halt mich fest | [artwork.mp4](bilder/430cc3af-fda3-4e73-8c90-dcc2212e0287-artwork.png) | Mikrohandlung | 241 | 24 | 0,14 | 0,33 | 0–10 s | 0,22 | 0,5 | ja | 1,53 | 26,17 | 0 | keiner |
| Vanille-Eis | [artwork.mp4](bilder/19f20a0f-31ec-4864-a991-c9cdc1e853c4-artwork.png) | Mikrohandlung | 241 | 24 | 0,17 | 0,36 | 0–10 s | 0,2 | 0,4 | ja | 2,1 | 17,56 | 0 | keiner |
| Tag X | [artwork.mp4](bilder/a3e94300-5d52-4f4f-9918-ad72dde07a7c-artwork.png) | Mikrohandlung | 241 | 24 | 0,35 | 0,36 | 0,13–10,04 s | 0,34 | 0,54 |  | 2,38 | 17,73 | 0 | keiner |
| Monolith | [artwork.mp4](bilder/6cc648b0-d487-40c1-8704-07df4e9ed2cf-artwork.png) | Mikrohandlung | 241 | 24 | 0,16 | 0,41 | 0–10 s | 0,26 | 0,55 | ja | 1,61 | 34,87 | 0 | keiner |
| Zug um Zug - Die ewige Partie | [artwork.mp4](bilder/5078257f-87e3-461c-ba62-9032c40e3cd0-artwork.png) | Mikrohandlung | 241 | 24 | 0,41 | 0,41 | 0,08–10,04 s | 0,41 | 0,34 |  | 1,79 | 5,98 | 0 | keiner |
| Noch lachst Du | [artwork.mp4](bilder/2ca4204b-441f-4053-b900-9fa4f55b2e96-artwork.png) | Textur | 271 | 30 | 0,41 | 0,42 | 0,07–9,03 s | 0,21 | 0,34 |  | 1,18 | 5,77 | 0 | keiner |
| Sync - Bio Anthem (ft. @auralillusion) | [artwork.mp4](bilder/602781a8-161a-4123-aee3-2f9f35fd70d8-artwork.png) | Textur | 246 | 24 | 0,37 | 0,43 | 2,88–7,17 s | 0,32 | 0,49 |  | 1,32 | 12,23 | 0 | keiner |
| Immersion vollendet - Waveform Anthem (ft. @auralillusion) | [artwork.mp4](bilder/8ee4c324-7741-4147-b4ec-3378f6116cd3-artwork.png) | Mikrohandlung | 195 | 24 | 0,34 | 0,43 | 0,08–8,04 s | 0,06 | 0,66 |  | 2,33 | 74,97 | 0 | keiner |
| Urgewalt (ft. @robertodiorci66; @psyresinc) | [artwork.mp4](bilder/b33067aa-d47b-4056-b603-268768370b6e-artwork.png) | Mikrohandlung | 145 | 24 | 0,99 | 0,47 | 0,13–4,88 s | 0,41 | 0,47 |  | 1,9 | 6,49 | 0 | keiner |
| Moissanit | [artwork.mp4](bilder/e85548dc-6156-48f6-baea-4b6c23350087-artwork.png) | Mikrohandlung | 236 | 24 | 0,36 | 0,49 | 2,5–7,13 s | 0,06 | 0,44 |  | 1,8 | 20,12 | 0 | keiner |
| Farben v2 | [artwork.mp4](bilder/4bcefa30-d22d-408f-9c69-aa1c03982de3-artwork.png) | Mikrohandlung | 241 | 24 | 0,46 | 0,54 | 0–10 s | 0,54 | 0,72 |  | 1,76 | 14,93 | 0 | keiner |
| Spiralen (ft. SamAI) | [artwork.mp4](bilder/2c0fff06-98e7-45b8-8a39-0209748de607-artwork.png) | Textur | 241 | 24 | 0,3 | 0,57 | 0–10 s | 0,4 | 0,62 | ja | 1,32 | 26,46 | 0 | keiner |
| Das Bild - Erwartung | [artwork.mp4](bilder/4e14226b-0a37-4770-b20c-166b6909abb5-artwork.png) | Textur | 145 | 24 | 0,96 | 0,61 | 1,33–5,63 s | 0,33 | 0,24 |  | 1,44 | 3,46 | 0 | keiner |
| Haxe | [artwork.mp4](bilder/322041de-0c8f-4d45-a655-5de6ceebc90d-artwork.png) | Mikrohandlung | 241 | 24 | 0,31 | 0,66 | 0–10 s | 0,56 | 0,64 | ja | 2,44 | 20,09 | 0 | keiner |
| Enzian | [artwork.mp4](bilder/7a395c22-1801-4894-b51a-0ee10c56d2ec-artwork.png) | Mikrohandlung | 241 | 24 | 0,35 | 0,69 | 0–10 s | 0,52 | 0,6 |  | 2,98 | 9,38 | 0 | keiner |
| Der Tod und das Mädchen - Das letzte Mal (ft. Merlynn) | [artwork.mp4](bilder/f975bd47-1319-485f-9f7a-6c399ad8c5de-artwork.png) | Mikrohandlung | 226 | 24 | 0,7 | 0,7 | 0–9,42 s | 0,61 | 0,55 |  | 2,42 | 4,5 | 0 | keiner |
| Der Vulkan und das Mädchen (ft. thebugman) | [artwork.mp4](bilder/79ed8b1b-c7d3-4c82-a78e-42bc69db3122-artwork.png) | Textur | 241 | 24 | 0,37 | 0,71 | 0–10 s | 0,55 | 0,71 |  | 1,42 | 20,52 | 0 | keiner |
| Ab jetzt! | [artwork.mp4](bilder/11aa4651-18dc-462c-b93f-d618fba9331c-artwork.png) | Mikrohandlung | 241 | 24 | 0,86 | 0,73 | 0,21–10,04 s | 0,61 | 0,16 |  | 3,3 | 1,07 | 0 | keiner |
| Kerze | [artwork.mp4](bilder/91e5814b-da40-418d-b425-55b2fe38d89b-artwork.png) | Textur | 145 | 24 | 1,54 | 0,75 | 1,92–6,04 s | 0,38 | 0,04 |  | 1,15 | 1,35 | 0 | keiner |
| Frühling in den Straßen | [artwork.mp4](bilder/2d01fdb5-d7fc-424c-ab74-7aabca5e1f6c-artwork.png) | Textur | 241 | 24 | 0,25 | 0,77 | 0–10 s | 0,34 | 0,63 | ja | 1,13 | 25,95 | 0 | keiner |
| Finst're Nacht im gleißend' Licht (ft. B's 🔥Ξdu Ғueㄥ🔥) | [artwork.mp4](bilder/215adf57-8a3a-470c-8353-3ddc1d349067-artwork.png) | Mikrohandlung | 239 | 24 | 1,55 | 0,78 | 0,88–4,92 s | 0,77 | 0,64 |  | 1,65 | 52 | 0 | keiner |
| Checkout um Zwölf | [artwork.mp4](bilder/02c2e6ca-6550-4b91-82c8-bb4946f4bb83-artwork.png) | Mikrohandlung | 241 | 24 | 0,21 | 0,79 | 0–10 s | 0,25 | 0,68 | ja | 1,51 | 24,74 | 0 | keiner |
| Erweckt v2 | [artwork.mp4](bilder/187fe209-c435-4f2b-87de-d9bc0a77c261-artwork.png) | Kamerafahrt | 241 | 24 | 0,14 | 0,79 | 0–10 s | 0,14 | 0,35 | ja | 1,53 | 32,44 | 0 | keiner |
| Staub | [artwork.mp4](bilder/cd7aead2-49db-4553-a6da-aa6586d60d8a-artwork.png) | Textur | 145 | 24 | 0,82 | 0,79 | 0–4,13 s | 0,54 | 0,52 |  | 1,02 | 19,09 | 0 | keiner |
| Kein Shutdown | [artwork.mp4](bilder/e369f0e9-6a29-4b54-ba49-1aac2040b1fa-artwork.png) | Mikrohandlung | 241 | 24 | 0,23 | 0,8 | 0–10 s | 0,46 | 0,7 | ja | 1,59 | 24,18 | 0 | keiner |
| Mutterns Hände | [artwork.mp4](bilder/80d81627-1a16-4c3c-8428-492e7a70d032-artwork.png) | Mikrohandlung | 121 | 24 | 0,84 | 0,8 | 0–4,96 s | 0,71 | 0,45 |  | 1,78 | 5,23 | 0 | keiner |
| Gleich | [artwork.mp4](bilder/977f33d0-1b15-4f1b-9d9b-394948f929b0-artwork.png) | Mikrohandlung | 241 | 24 | 0,76 | 0,82 | 0–10 s | 0,82 | 0,74 |  | 1,66 | 10,87 | 0 | keiner |
| Das Mädchen im Moor [STTZ Projekt Poesie] | [artwork.mp4](bilder/352cf0a5-4f80-482d-9896-c2f3a43e171b-artwork.png) | Kamerafahrt | 238 | 24 | 1,74 | 0,83 | 4,58–8,58 s | 0,82 | 0,53 |  | 1,35 | 31,47 | 0 | keiner |
| Koffein v2 | [artwork.mp4](bilder/dd18e25d-a595-4f54-989b-a414f6d97e03-artwork.png) | Textur | 241 | 24 | 0,21 | 0,83 | 0–10 s | 0,21 | 0,55 | ja | 1,43 | 25,97 | 0 | keiner |
| O-Zwei | [artwork.mp4](bilder/74116303-ff34-4265-afe7-bba7fc724c41-artwork.png) | Standbild-nah | 145 | 24 | 3,1 | 0,85 | 1,58–5,58 s | 0,76 | 0,81 |  | 1,29 | 2,24 | 0 | keiner |
| Electric rain im Stahlhimmel (ft. robertodiorci66) | [artwork.mp4](bilder/1b1c3612-c90e-4461-a783-2ec7a7ea9fcf-artwork.png) | mit Schnitten | 145 | 24 | 1,46 | 0,89 | 0,75–4,75 s | 0,88 | 0,27 |  | 1,69 | 18,87 | 1 | keiner |
| Unerreicht | [artwork.mp4](bilder/2583b425-7f69-475b-a19b-3266e8869d65-artwork.png) | Mikrohandlung | 241 | 24 | 0,86 | 0,89 | 0–10 s | 0,86 | 0,66 |  | 2,58 | 7,67 | 0 | keiner |
| Sakura Mädchen | [artwork.mp4](bilder/ad4e073f-50f9-411f-8818-9b54c703340e-artwork.png) | Textur | 241 | 24 | 0,1 | 0,99 | 0–10 s | 0,1 | 0,52 | ja | 1,35 | 29,82 | 0 | keiner |
| 桜の少女 | [artwork.mp4](bilder/8739a9f1-adfe-4f68-b7ed-41557fd6877d-artwork.png) | Textur | 241 | 24 | 0,16 | 1 | 0–10 s | 0,16 | 0,24 |  | 1,18 | 14,22 | 0 | keiner |
| Neustart | [artwork.mp4](bilder/26439d1a-d1ee-49ce-af2e-d13b7f54ee6b-artwork.png) | Mikrohandlung | 144 | 24 | 1,36 | 1,12 | 0,38–6 s | 1,03 | 0,57 |  | 1,85 | 26,43 | 0 | Neutralzustand |
| Doppio passo | [artwork.mp4](bilder/d070bdfd-714a-472e-82ee-d925035eaf36-artwork.png) | Mikrohandlung | 145 | 24 | 1,51 | 1,16 | 0–5,13 s | 0,88 | 0,61 |  | 1,7 | 31,84 | 0 | Neutralzustand |
| Fieberwahn | [artwork.mp4](bilder/0c6c8e06-e324-42ba-8e5d-cfdbf77a76ff-artwork.png) | Mikrohandlung | 145 | 24 | 1,08 | 1,3 | 0,17–6,04 s | 0,97 | 0,54 |  | 2,14 | 4,68 | 0 | Neutralzustand |
| Pfeifenwald | [artwork.mp4](bilder/4330f509-c8f6-4c5b-9b70-6f3453de6f2b-artwork.png) | Mikrohandlung | 241 | 24 | 1,15 | 1,33 | 0,13–10,04 s | 1,08 | 0,59 |  | 2,82 | 4,99 | 0 | Neutralzustand |
| Auf ganzer Linie ... (ft @tarja_ravenveil) | [artwork.mp4](bilder/f84227b3-ca9b-4a1e-8a93-ef1b67822bbf-artwork.png) | Mikrohandlung | 145 | 24 | 1,36 | 1,36 | 0–6,04 s | 1,35 | 0,61 |  | 1,83 | 30,38 | 0 | Ereignis |
| Dogma v2 | [artwork.mp4](bilder/3445566f-38fc-49a7-9790-7e1676c36814-artwork.png) | Mikrohandlung | 240 | 24 | 2,55 | 1,36 | 0–4 s | 1,36 | 0,59 |  | 1,56 | 22,25 | 0 | Neutralzustand |
| Loreley v2 | [artwork.mp4](bilder/6d8c63f8-4f17-4e55-8a74-edf0b6a93627-artwork.png) | Mikrohandlung | 239 | 24 | 3,24 | 1,37 | 2–6 s | 1,37 | 0,34 |  | 2,3 | 2,64 | 0 | Neutralzustand |
| Lenore | [artwork.mp4](bilder/b1ff440c-1695-4b31-96ee-f99fe07a976d-artwork.png) | Textur | 239 | 24 | 2,24 | 1,37 | 4,96–8,96 s | 1,37 | 0,77 |  | 1,21 | 10,64 | 0 | Neutralzustand |
| Tomatensalat (ft. @gerdenwald) | [artwork.mp4](bilder/e5ba2525-3275-4801-b701-85a00fb60fa1-artwork.png) | Mikrohandlung | 145 | 24 | 2,45 | 1,38 | 1,38–5,38 s | 1,38 | 0,77 |  | 2,27 | 7,47 | 0 | Neutralzustand |
| Waifu mit weißem Haar (ft. Kasane) | [artwork.mp4](bilder/45077bba-d3ff-48ef-a71a-97594745e509-artwork.png) | Mikrohandlung | 241 | 24 | 2,91 | 1,39 | 5,04–10,04 s | 1,38 | 0,59 |  | 1,61 | 32,28 | 0 | Ereignis |
| Waifu with White Hair (ft. Kasane) | [artwork.mp4](bilder/98f74c73-3f62-483d-b536-77afc5a69aa0-artwork.png) | Mikrohandlung | 241 | 24 | 2,91 | 1,39 | 5,04–10,04 s | 1,38 | 0,59 |  | 1,61 | 32,28 | 0 | Ereignis |
| Das Bild - Ich komme | [artwork.mp4](bilder/1f1aaa90-5439-4d3a-904b-6d5bebd3d3f3-artwork.png) | Kamerafahrt | 145 | 24 | 2,01 | 1,65 | 0,04–4,29 s | 1,64 | 0,47 |  | 1,62 | 36,56 | 0 | Ereignis |
| Ich, Thiel | [artwork.mp4](bilder/64fb13c7-e57c-431f-b770-4ce0d879c5b8-artwork.png) | Kamerafahrt | 145 | 24 | 1,97 | 1,7 | 2,04–6,04 s | 1,7 | 0,36 |  | 3,3 | 36,07 | 0 | Ereignis |
| Die Braut von Corinth | [artwork.mp4](bilder/1d21fa1b-4a77-43de-8362-70c5273f6340-artwork.png) | Mikrohandlung | 239 | 24 | 2,27 | 1,94 | 1,04–9,96 s | 1,77 | 0,21 |  | 2,74 | 2,54 | 0 | Neutralzustand |
| Labskaus-Klaus | [artwork.mp4](bilder/e613cf6d-1eb3-4389-8542-7a4cffdfe57f-artwork.png) | Mikrohandlung | 145 | 24 | 2,38 | 2,17 | 0–4 s | 2,17 | 0,25 |  | 4,73 | 15,14 | 0 | Ereignis |
| Urgewalt - Singularität (ft. @robertodiorci66) | [artwork.mp4](bilder/f29e4468-19d7-456b-b149-3cad9a404301-artwork.png) | Mikrohandlung | 145 | 24 | 3,48 | 2,31 | 0,38–4,38 s | 2,31 | 0,56 |  | 1,84 | 18,34 | 0 | Ereignis |
| Glut und Eis - Die Braut von Corinth | [artwork.mp4](bilder/89ef9f63-c885-4fe5-b082-8e2bf9513c4d-artwork.png) | Mikrohandlung | 241 | 24 | 3,34 | 2,32 | 4,46–8,96 s | 2,3 | 0,47 |  | 2,28 | 18,79 | 0 | Ereignis |
| Testosteron v3 | [artwork.mp4](bilder/c38956b9-294f-453d-ae63-358f049330ac-artwork.png) | Mikrohandlung | 241 | 24 | 2,88 | 2,38 | 0–4,04 s | 2,07 | 0,61 |  | 2,67 | 39,5 | 0 | Ereignis |
| Wirt v2 | [artwork.mp4](bilder/39801fd7-5e56-40d2-831a-d3a722c31437-artwork.png) | Mikrohandlung | 240 | 23,8 | 4,56 | 2,42 | 3,7–7,73 s | 2,41 | 0,28 |  | 2,9 | 5,88 | 0 | Ereignis |
| Schlaraffenland v3 | [artwork.mp4](bilder/1f5c63a2-0d2c-4cc5-ae29-606e0e822692-artwork.png) | Mikrohandlung | 241 | 24 | 8,06 | 3,03 | 0,79–4,79 s | 2,88 | 0,46 |  | 8,29 | 10,21 | 0 | Ereignis |
| Erlkönigs Tochter '25 v2 (OLD MASTERS REINTERPRETED) | [artwork.mp4](bilder/73bf9ab3-9a9e-49c8-a604-b713db4c8813-artwork.png) | Kamerafahrt | 145 | 24 | 4,12 | 3,38 | 0–4 s | 3,38 | 0,47 |  | 2,07 | 18,07 | 0 | Ereignis |
| Schnee | [artwork.mp4](bilder/215b1cf3-ecb6-4187-b362-00c02ab4162c-artwork.png) | Mikrohandlung | 145 | 24 | 4,01 | 3,73 | 0,58–4,63 s | 3,68 | 0,26 |  | 1,78 | 5,03 | 0 | Ereignis |
| Dopamier mich! v2 | [artwork.mp4](bilder/c734cf5d-e8d0-4989-b5e4-e97bb12493fe-artwork.png) | Mikrohandlung | 241 | 24 | 11,87 | 4,66 | 2,96–6,96 s | 4,62 | 0,63 |  | 3,03 | 7,22 | 0 | Ereignis |
| Stumm | [artwork.mp4](bilder/f49c1907-b260-43c4-b4d0-67d74aa00ccb-artwork.png) | Mikrohandlung | 193 | 24 | 10,22 | 5,08 | 3,17–7,17 s | 5,04 | 0,39 |  | 2,89 | 3,93 | 0 | Ereignis |
| Ich dreh mich nicht um! (ft. Ṧҝℴᶉ∀Ҝ٥ℨ₳) | [artwork.mp4](bilder/d0a89c65-2eaa-4032-aeaf-c4bb2714ef2d-artwork.png) | Kamerafahrt | 145 | 24 | 6,83 | 6,09 | 0–4 s | 6,09 | 0,71 |  | 4,37 | 20,23 | 0 | Ereignis |
| Kuss | [artwork.mp4](bilder/75bd95c3-326f-418b-a60e-b53524739580-artwork.png) | Mikrohandlung | 145 | 24 | 9,72 | 6,19 | 1,96–5,96 s | 6,12 | 0,45 |  | 2,56 | 3,36 | 0 | Ereignis |
| Roggen-Muhme | [artwork.mp4](bilder/773af97d-3865-4094-8269-e3668ab7b9d1-artwork.png) | Mikrohandlung | 145 | 24 | 14,3 | 9,59 | 0–4,79 s | 8,93 | 0,55 |  | 3,39 | 1,58 | 0 | Ereignis |
| Kein Shutdown | [artwork.sprung.mp4](bilder/e369f0e9-6a29-4b54-ba49-1aac2040b1fa-artwork.sprung.png) | Mikrohandlung | 241 | 24 | 0,23 | 0,79 | 0–10 s | 0,44 | 0,69 | ja | 1,6 | 24,14 | 0 | keiner |
| Glut und Eis - Die Braut von Corinth | [artwork.sprung.mp4](bilder/89ef9f63-c885-4fe5-b082-8e2bf9513c4d-artwork.sprung.png) | Mikrohandlung | 241 | 24 | 3,34 | 2,32 | 4,46–8,96 s | 2,3 | 0,46 |  | 2,3 | 18,68 | 0 | Ereignis |

## Kennzahlen

d(a,b): Bilder auf Rechengroesse (lange Seite 256, Seitenverhaeltnis erhalten, ffmpeg scale flags=area), rgb24. Bild in etwa 16x16 px grosse Bloecke geteilt (Anzahl = round(Kante/16), Grenzen gleichmaessig). Je Block m = Summe |R_a-R_b|+|G_a-G_b|+|B_a-B_b| / (3 * Pixel im Block); d = Maximum ueber alle Bloecke (0..255). Wie VIDEO-PLAN §6.5 und labor/nahtpruefung: das Maximum misst Sichtbarkeit, das Bildmittel nur Flaeche.

Bildwechsel c_i = d(i,i+1), i = 0..N-2. p95 = 95. Perzentil der c_i (linear interpoliert); median = Median der c_i = Bewegungsenergie.

naht_roh = d(N-1, 0) (Sprung beim Loopen des ganzen Videos). quotient_roh = naht_roh / max(p95, 0.5). Unter 1 unsichtbar (§6.5). Erwartungswert daneben: quotient_normaler_wechsel = median_ohne_doppelbilder / max(p95, 0.5) - so gross ist der Quotient eines ganz gewoehnlichen Bildwechsels; eine perfekte Naht liegt dort, nicht bei 0. Ein Quotient weit darunter (naht_roh < 0,5 * Median, schlussbild_wiederholt_anfang) ist ein Doppelbild an der Naht: das Schlussbild ist das Anfangsbild, Loopen aller N Bilder ruckt um ein Standbild, der eigentliche Loop ist [0, N-1).

Nahtsuche (§6.1, Video Textures): Clip [i, j), Laenge L = j-i Bilder mit ceil(4 fps) <= L <= min(floor(10 fps), N). Kosten dd(i,j) = (1*d(i-1,j-1) + 2*d(i,j) + 1*d(i+1,j+1)) / Gewichtssumme der gueltigen Terme (Indizes in 0..N-1) - Bild i soll dem natuerlichen Nachfolger j von j-1 gleichen, und die Nachbarn mit, damit die Bewegungsrichtung zaehlt. Hat (i=0, j=N) keinen gueltigen Term, zaehlt d(N-1,0). Minimum von dd, bei Gleichstand die laengere Laenge. quotient_bester_schnitt = d(j-1, i) / max(p95, 0.5) - der Sprung, den man beim Abspielen des Clips sieht. landkarte: dasselbe Minimum je 1-s-Fenster der Clip-Laenge (4-5 ... 9-10 s, 10,0 s zaehlt ins letzte).

Zeitkurve D(tau) = Median ueber i von d(i, i+tau), tau = 1,2,4,8,15,30,60,120 Bilder (tau < N) - zeitkurve. Dieselbe Kurve mit dem Bildmittel statt dem Block-Maximum (Mittel ueber alle Bloecke) - zeitkurve_mittel. Stationaritaet S = max_{tau>=15} D_mittel(tau) / max(D_mittel(15), 0.5). Textur saettigt frueh und bleibt flach (S nahe 1), Mikrohandlung und Fahrt steigen weiter. Warum das Bildmittel: das Block-Maximum saettigt, sobald irgendein Block ganz wechselt (Median D(15) liegt bei 60-140 von 255), und macht dann auch eine hereinlaufende Figur flach - fuer Sichtbarkeit richtig, fuer Stationaritaet blind. Warum die Spitze statt D(120): eine Bewegung, die bei tau = 120 zurueckkehrt (periodisch: D(tau_max) < 0,7 * Spitze), ginge sonst als Textur durch.

Harte Schnitte: c_i > max(20, 5 * median_ohne_doppelbilder) UND c_i > 2,5 * max(naechster echter Wechsel links, rechts) UND >= 30 % der Bloecke weichen um mehr als 20 ab (anteil_bloecke). Ein Schnitt ist ein vereinzelter Ausreisser ueber die Flaeche; schnelle Bewegung ist ueber mehrere Wechsel gross (Nachbarkriterium), oertliches Flackern (Kerzenflamme) trifft wenige Bloecke (Flaechenkriterium). Echte Wechsel = c >= 0,5: Doppelbilder (12 fps in 24 fps verpackt) werden uebersprungen, sonst waere jeder echte Wechsel zwischen zwei Doppelbildern ein Ausreisser. Die 20 (von 255) verhindert, dass bei fast stehenden Bildern ein Kodier-Schluesselbild zaehlt. Kehrt das Bild innerhalb von 2-4 Bildern zurueck (min d(i,i+k), d(i-1,i+k) < 0,5 * c), ist es ein Blitz (blitze), kein Schnitt.

Globale Bewegung: 8 gleichverteilte Bildpaare (a, a+15), Grauwert, jedes 2. Pixel, Rand 12 px ausgespart. Bester ganzzahliger Versatz dx,dy in +-12 px (2er-Raster, dann +-1 verfeinert), danach Massstab 0,96/0,98/1,02/1,04 um die Mitte mit Versatz +-2. gewinn = 1 - Fehler_ausgerichtet/Fehler_unverschoben. verschiebung_px_s = Median |(dx,dy)| * fps/15 (Rechengroesse), verschiebung_prozent_s = das in % der langen Seite; zoom_prozent_s = Median (Massstab-1)*100*fps/15; richtungstreue = |mittlerer Vektor| / mittlerer Betrag.

gleichbilder = Anzahl c_i < 0,5 (doppelte Bilder). anteil_bloecke (je Schnitt der Nahtsuche) = Anteil der Bloecke mit m > 20 im Sprung d(j-1,i); bildwechsel.anteil_p95 = 95. Perzentil desselben Anteils ueber die Bildwechsel c_i.

## Schwellen

Klasse, in dieser Reihenfolge:

1. "mit Schnitten": mindestens ein harter Schnitt (Kriterium oben) im Video.

2. "Standbild-nah": median c < 3 UND fuer jedes tau D(tau) < 8 (Block-Maximum). Kodierrauschen allein liefert im Block-Maximum etwa 1-2; bleibt auch ueber 5 s jeder Block im Median unter 8/255, bewegt sich nichts sichtbar.

3. "Kamerafahrt": gewinn_median >= 0.08 UND ((verschiebung >= 1.5 %/s der langen Seite UND richtungstreue >= 0.6) ODER (|zoom| >= 3 %/s UND >= 75 % der Paare zoomen gleichsinnig)). Ruhende Bilder haben gewinn exakt 0 (bester Versatz 0); Textur mit lokaler Bewegung findet Versaetze, aber ohne Richtungstreue; 1,5 %/s heisst ueber 10 s 15 % der Bildkante, 3 %/s Zoom ist die kleinste Stufe (Massstab 1,02 je 15 Bilder bei 24 fps) - die Fahrt kann dann nicht zum Anfang zurueck.

4. "Textur": S < 1.5 - das Bildmittel waechst nach 15 Bildern (0,6 s) um weniger als die Haelfte: stationaerer Prozess. Die Verteilung von S ist stetig (1,0 ... 8,3, Median etwa 1,8); 1,5 trennt am Kontaktbogen geprueft Dampf, Schnee, Glut (1,0-1,45) von hereinlaufenden Figuren und Gesichtsbewegung (ab etwa 1,6). Grenzfaelle 1,4-1,6 sind unsicher.

5. "Mikrohandlung": sonst - der Abstand waechst mit tau weiter, das Video entwickelt sich (Handlung, Veraenderung).

Vorschlag (§6.7): quotient_bester_schnitt < 1 keiner; 1..2 Neutralzustand; > 2 Ereignis. Flaechentausch hebt auf Ereignis: springen an der Naht >= 50 % der Bloecke um mehr als 20 UND ist das >= 2 x der Anteil beim 95. Perzentil der normalen Bildwechsel (bildwechsel.anteil_p95), ist die Naht ein Schnitt auf ein anderes Bild, auch wenn der Quotient klein bleibt - das Block-Maximum saettigt bei viel Bewegung (p95 50-100), am Kontaktbogen gesehen bei "Ich, Thiel", "Auf ganzer Linie", "Das Bild - Ich komme", "Waifu" (q 1,36-1,70, jeweils ein ganz anderes Bild). Mikrohandlung bekommt §6.4 (sin²-Abbremsen, Blende zwischen Standbildern, nie Pendel). <=10 s-Regel: ein mischender Uebergang der Laenge D braucht D/2 Material vor i und D/2 nach j; misch_d_max_s = 2*min(i, N-j)/fps. Neutralzustaende und Blitz brauchen nichts.
