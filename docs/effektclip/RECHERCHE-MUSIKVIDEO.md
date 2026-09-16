# Recherche: Gestaltung von Musikvideos (ChatGPT, 16.09.2026)

**Herkunft:** Chat „Musikvideo Gestaltungstipps" von Caspar_D, Modell GPT-5.6 Sol (Stufe „Mittel"), mit Websuche.
Quelle: https://chatgpt.com/c/6aaa4bc2-5c50-83eb-a2fe-4dea6f77b358 — abgeholt am 16.09.2026 aus Jörgs Chrome und
hier wörtlich abgelegt (Formeln lesbar gesetzt, Layout geglättet, Inhalt unverändert).
Der Prompt dazu steht in der Sitzung vom 16.09.2026; er beschreibt unsere Lage: ein Titelbild, ein 5–10-s-Clip,
gelegentlich ein Hook-Video, dazu Schläge, Abschnitte, Liedtext mit Zeitmarken, Lautheitshüllkurve (0,7 s),
Tempo/Tonart/Genre, Farben — alles lokal im Browser, Canvas 2D und WebGL, rund 40 Effekte, ein Dutzend Übergänge,
Ausgabe als 10-s-Loop oder über die ganze Liedlänge, Rechenzeit höchstens ein- bis zweimal die Liedlänge.

**Der zentrale Satz der Antwort:** *„Du solltest keine ‚Audio-Reaktivitätsmaschine', sondern einen automatischen
Editor bauen. Die Musikdaten entscheiden zuerst über Dramaturgie und Ereignishierarchie; erst danach moduliert das
Audiosignal einzelne Effekte."*

**Belegstufen**, die die Antwort selbst unterscheidet: *normativ* (Plattformvorgabe oder Sicherheitsstandard),
*empirisch gestützt* (Untersuchung vorhanden, nicht zwingend allgemeingültig), *Faustregel* (verbreitete Praxis
ohne belastbare Schwelle), *eigene Einschätzung* (Systementscheidung aus unseren Möglichkeiten abgeleitet).

## Übersicht: Technik → Messdaten → Umsetzung → Aufwand → Gewinn

| Technik | Benötigte Messdaten | Umsetzungsskizze | Aufwand | Gewinn |
|---|---|---|---|---|
| Hierarchischer visueller Ablaufplan | Abschnitte, Takte, Lautheit, Stimmung | Je Abschnitt einen visuellen Zustand; Änderungen auf Phrasenebene, Akzente nur selektiv auf Schlägen | mittel | sehr hoch |
| Abgeleitete „Einstellungsbank" aus einem Bild | Titelbild, Farbwerte | Aus demselben Bild Totalen, Ausschnitte, Details, Tiefenvarianten, textfreundliche Fassungen | gering–mittel | sehr hoch |
| Selektiver Beat-Akzent | Schläge, Taktposition, Lautheitsanstieg | Nicht jeder Schlag reagiert: Eins, markante Onsets, ausgewählte Offbeats bekommen verschiedene Impulse | gering | hoch |
| Abschnittsspezifische Effekt-Orchestrierung | Abschnittsgrenzen, Dynamik, Genre | Strophe, Refrain, Bridge benutzen verschiedene Effektfamilien und Aktivitätsbudgets, nicht nur andere Intensitäten | mittel | sehr hoch |
| Bewegungshüllkurven mit Attack/Release | Schläge, Lautheit, optional FFT/Onsets | Messwerte über Schwelle, Normalisierung, asymmetrische Glättung und Sperrzeit in sichtbare Bewegung übersetzen | gering | sehr hoch |
| Lokale Spektralanalyse | Audiodatei | Offline-FFT in wenige musikalisch sinnvolle Bänder; Bass, Mitten, Höhen treiben verschiedene Parameter | gering–mittel | hoch |
| Mikro-Kamerafahrt | Abschnitt, Phrase, Bildkomposition | Zoom/Pan über 4–16 Takte; Zielpunkte wechseln nur an musikalisch plausiblen Grenzen | gering | mittel–hoch |
| 2,5-D-Parallaxe | Tiefenkarte oder 3–6 Ebenen | Vorder-, Mittel-, Hintergrund verschieden bewegen; Kanten maskieren, Verdecktes auffüllen | mittel–hoch | hoch, falls sauber |
| Lokale Lichtwanderung | Bildfarbe, Lautheit, Phrase | Lichtmaske oder gerichteter Gradient wandert langsam; Musik moduliert Stärke, nicht ständig die Position | mittel | mittel–hoch |
| Video-Retiming und Bewegungsabgleich | Schläge, Clipbewegung, Abschnitt | Mikrohandlung auf Phrase oder Taktgruppe legen; Tempo nur ±⅓; Bewegungsmaximum auf musikalischen Akzent | mittel | hoch |
| Loop-Optimierung | BPM, Taktart, Clipbilder | Loop-Punkte nach visueller Ähnlichkeit und Bewegungsrichtung suchen; notfalls regional überblenden statt global | mittel | hoch |
| Liedtext-Renderer | Wort-/Zeilenzeiten, Abschnitte | Text zeilenweise setzen; Wortdaten vor allem für subtile Hervorhebung und Synchronkorrektur | mittel | hoch |
| Formatunabhängiger Szenengraph | Bildsalienz, Textboxen, Zielformat | Inhalt in normalisierten Koordinaten und Constraints; dieselbe Dramaturgie getrennt in 16:9, 1:1, 9:16 rendern | mittel | sehr hoch |
| Photosensibilitäts-Prüfung | gerenderte Bilder | Rolling-Window-Test auf Luminanz- und Rotblitze; auch Loop-Naht und kombinierte Effekte prüfen | mittel | sicherheitskritisch |

## Rangfolge nach sichtbarem Gewinn je Aufwand

### 1. Ein hierarchischer Regisseur über den 40 Effekten (eigene Einschätzung, höchste Priorität)

Drei Zeitskalen:
- **Abschnitt:** bestimmt Bildzustand, Grundbewegung, Palette, Clipquelle, Effektfamilie.
- **Phrase (meist 4/8/16 Takte):** erlaubt Perspektivwechsel, größere Kamerafahrt, Übergang, neues Motiv.
- **Schlag/Onset:** liefert nur kurze Akzente innerhalb des Zustands.

Das verhindert den typischen Visualizerfehler, dass alle Parameter auf dasselbe Signal reagieren und deshalb im
Gleichtakt laufen. Je Abschnitt etwa: `visualState`, `sourceVariant`, `cameraPath`, `motionBudget`,
`contrastBudget`, `allowedEffects[]`, `accentDensity`, `transitionIn/Out`, `lyricStyle`. Dazu ein **Salienz-Budget**:
gleichzeitig höchstens ein dominantes Ereignis, ein bis zwei unterstützende Bewegungen, ruhiger Hintergrund.

*Empirisch gestützt:* Eine quantitative Untersuchung professioneller Musikvideos fand eine Kopplung von Schnitten an
Downbeats und funktionale Abschnittsgrenzen, aber keine „jeder Beat = Schnitt"-Regel; Synchronität war genreabhängig,
Antizipation häufig. (Prétet, Richard & Peeters: *Is there a language of music-video clips?*)

### 2. Aus dem Standbild echte virtuelle Einstellungen erzeugen (eigene Einschätzung)

Die wichtigste Ressource ist nicht Effektzahl, sondern **visuelle Distanz**. Etwa sechs stabile Ansichten vorab:
Totale (100 %), mittlere Ansicht (108–115 %), Detail A und B (120–140 %, wenn die Auflösung reicht), räumliche
Variante mit sehr kleiner Parallaxe, ruhige textfreundliche Variante. Ein harter Schnitt dazwischen wirkt wie
Montage, ein zufälliger Zoomimpuls nur wie Software.

**Faustregel:** nicht mehrfach zwischen fast gleichen Skalierungen schneiden — unter etwa 5–8 % sichtbarer
Veränderung entsteht ein unbeabsichtigter Jump Cut. Das quadratische Titelbild als Kompositionsobjekt behandeln,
nicht bildfüllend beschneiden; für 9:16 etwa in einen aus seinen Farben abgeleiteten vertikalen Raum legen.

### 3. Strophe und Refrain durch unterschiedliche Grammatik trennen (eigene Einschätzung)

Nicht im Refrain alle Regler hochdrehen — das ist „mehr vom Gleichen".

| Ebene | Strophe | Refrain |
|---|---|---|
| Bildausschnitt | enger oder asymmetrisch | weiter, zentraler, frontaler |
| Bewegung | gerichtete langsame Fahrt | größere, aber geordnete Bewegung |
| Rhythmik | Phrase und Zeilentakt | Downbeat plus ausgewählte Binnenakzente |
| Farbe | geringere Sättigung, engeres Spektrum | Palette öffnet sich |
| Clip | Ausschnitte oder Standbild | vollständige Mikrohandlung / Hook |
| Text | ruhiger, zeilenweise | größere typografische Geste |
| Effekte | wenige lokale | ein dominanter zusätzlicher Layer |

Spannungsbogen: Intro Motiv andeuten · Strophe 1 Raum und Blickrichtung etablieren · Refrain 1 Motiv vollständig
zeigen · Strophe 2 Perspektive wechseln · Refrain 2 gleiche Grammatik plus neue Ebene · Bridge deutliche Subtraktion
oder Stillstand · Finale größte Öffnung · Outro zum Ausgangsmotiv zurück.

### 4. Audio-Mapping mit Wahrnehmungsfilter statt Rohwert (Praxiswissen)

Resolume bietet bei audioreaktiven Parametern Verstärkung und Abfallzeit, Notch Frequenzselektion, Schwellen,
Attack, Decay und Glättung. Diese Zwischenschicht trennt Motion Design von amplitudengekoppelter Visualisierung.

Für einen normalisierten Eingang x: Perzentilnormalisierung (etwa P10–P95) statt globalem Min/Max · Deadband
(Werte unter 0,1–0,2 ignorieren) · nichtlineare Kurve `u = clamp((x−θ)/(1−θ), 0, 1)^γ` mit γ≈0,6 für frühe
Sichtbarkeit oder 1,5 für seltene Spitzen · asymmetrische Glättung (kurzer Attack, längeres Release) · Cooldown von
mindestens einem halben bis ganzen Schlag nach starken Ereignissen.

Startwerte (ausdrücklich Faustregeln): harte Beat-Akzente Attack 20–60 ms, Release 150–350 ms · Licht/Sättigung
Attack 80–200 ms, Release 400–1200 ms · Kamera/Parallaxe keine Beat-Hüllkurve, sondern Rampen über 1–8 Takte ·
Abschnittsenergie 2–5 s geglättet.

**Unsere 0,7-s-Lautheit ist für Abschnittsdynamik gut, für Kick, Snare und präzise Onsets zu grob.** Lokal zusätzlich
rechnen: Spectral Flux/Onsets, Bass 40–160 Hz, untere Mitten 160–800 Hz, obere Mitten 0,8–4 kHz, Höhen 4–12 kHz.
Die Grenzen müssen nicht psychoakustisch perfekt sein; wichtig ist, dass nicht fünf Effekte dasselbe Vollbandsignal
bekommen.

*Empirisch gestützt:* Nachvollziehbare Zuordnungen sind höhere Tonhöhe → mehr Helligkeit/Höhe und größere Lautheit →
größere Form bzw. stärkere Sättigung — Tendenzen, keine Verpflichtung.

### 5. Den kurzen Clip als dramaturgisches Kapital behandeln (eigene Einschätzung)

Der Clip darf nicht ab Sekunde null verschlissen werden; sein erstes vollständiges Erscheinen ist ein Ereignis.
Hook-Clip bevorzugt beim Hook/Refrain, anderer Clip erstmals am Ende von Strophe 1 oder im ersten Refrain, davor
höchstens Einzelbilder, kurze Ausschnitte oder eine Detailansicht; später mit verändertem Einstiegspunkt, Crop oder
Bewegungsphase wiederholen.

**Pendeln funktioniert** bei Atem, Stoff, Haar, Licht, Blickbewegung, abstrakten Vorgängen. **Es verrät sich** bei
Schwerkraft, Flüssigkeiten, gerichtetem Rauch, Lippenbewegung und zielgerichteten Handlungen — dort besser Start- und
Endpunkt mit ähnlichem Bewegungszustand suchen oder lokal überblenden.

Wenn gelegentlich mehr Material beschafft wird, bringen **drei kurze, klar verschiedene Clips** mehr als ein langer:
ruhige Totale, Detail mit gerichteter Bewegung, neutrale atmosphärische Textur.

## Die Einzelfragen

### Schnitt auf Musik

Schnittfrequenz hängt ab von Abschnitt, Arrangementdichte, Energieänderung, Materialneuheit und BPM — **BPM ist der
schwächste dieser Faktoren.** Bei 180 BPM auf jeden Schlag zu schneiden ist meist hektischer, als ein dichter
90-BPM-Halftime-Track verlangt.

Faustregeln: Abschnittswechsel fast immer Kandidat für deutlichen visuellen Wechsel · Phrasenende nach 4/8/16 Takten
für Perspektive, Bewegungsrichtung oder Layerwechsel · Eins für harte Zustandswechsel · Zwei/Vier oder Snare für
kleine Akzente · Offbeat nur bei hörbar synkopiertem Material · Vorwegnahme um ⅛ bis ½ Schlag macht einen Übergang
energetischer · Nachlauf sinnvoll bei Hallfahnen und Ausklang.

**Harter Schnitt** ist besser bei neuem Abschnitt oder klarem Schlag, bei deutlich verschiedenen Ansichten, bei
trockener/perkussiver Musik, und wenn ein Übergang die Energie verwässern würde. **Übergang** ist besser, wenn ein
Zustand in den anderen fließt, wenn Akkord/Stimme/Fläche über die Grenze gehalten wird, wenn fast gleiches Material
sonst nur springen würde, und wenn Zeit, Erinnerung, Traum oder Transformation gemeint ist.

Für uns gilt: Schnitt heißt überwiegend Wechsel zwischen **abgeleiteten Bildzuständen**, nicht zwischen realen
Kamerapositionen — der übliche Rat „schneide zwischen guten Takes" ist bei unserem Material ungültig.

### Dramaturgie und ruhige Passagen

Spannung entsteht aus **Reserve**, nicht aus Dauerbetrieb: Wer im ersten Refrain alle Effektfamilien zeigt, hat fürs
Finale nur noch Übersteuerung. Bloßes Verlangsamen ist nicht automatisch richtig — Intro: geringe Informationsdichte,
Motiv teilweise zeigen, Bewegung darf normal langsam sein · Bridge: eher Effekte und Kontrast abziehen, während eine
vorhandene Bewegung weiterläuft · Break: ein fast statisches Bild über 1–2 Takte kann stärker sein als extreme
Zeitlupe · Outro: Parameter kontrolliert zum Ausgangszustand zurückführen oder die Bewegung aus dem Bild hinauslaufen
lassen.

**„Lebensbeweis" in ruhigen Passagen:** minimale Lichtwanderung, Filmkorn, lokale Partikel oder 1–2 % räumliche
Drift. Völliger Stillstand wirkt nur absichtlich, wenn davor deutlich Bewegung war.

### Bewegung aus Standbildern

| Verfahren | professionell, wenn … | Bildschirmschoner, wenn … |
|---|---|---|
| Push-in/Pan | motiviert auf Gesicht, Objekt oder Text geführt | ohne Ziel hin- und hergeschoben |
| Parallaxe | Tiefe, Kanten und Verdeckungen plausibel | Konturen reißen auseinander, alles wird „Gummi" |
| Lichtwanderung | Oberflächenform und Lichtquelle passen zusammen | ein globaler Gradient läuft über alles |
| Partikel | perspektivisch, farblich, räumlich integriert | gleichmäßig über dem Bild schwebend |
| Texturfluss | an Rauch, Wasser, Stoff, Wolken gebunden | Haut, Gebäude und Schrift fließen gleichermaßen |
| Displacement | lokal und materialbezogen | das ganze Bild wabert rhythmisch |
| Filmkorn | stationär und subtil | die Lautheit pumpt die Korngröße sichtbar auf |

Faustregel Kamerabewegung: Zoom etwa 1,00 → 1,05 bis 1,10 über 8–16 Takte, Translation 2–6 % der Bilddimension,
Parallaxe meist kleiner als die primäre Fahrt.

### Übergänge in Schlägen

`t = n_Schläge · 60 / BPM` — bei 120 BPM dauert ein Schlag 0,5 s.

| Übergang | typische Länge | passt zu |
|---|---|---|
| harter Schnitt | 0 Schläge | klare Eins, Drop, Industrial, Rock |
| kurzer Blitz | 1/16–1/8 Schlag | einzelner starker Akzent; Sicherheitsprüfung nötig |
| Pixel/Glitch | 1/8–½ Schlag | elektronisch, Industrial; sparsam |
| Wisch/Bewegungsunschärfe | ¼–1 Schlag | gerichtete Bewegung, Tempo |
| Kreuzzoom | ½–1 Schlag | deutlicher Abschnittssprung |
| durch Schwarz | ½–2 Schläge | Break, Ende, düstere Genres |
| durch Weiß | ¼–1 Schlag | Explosion, Überbelichtung; sicherheitskritisch |
| normale Blende | 1–4 Schläge | Ballade, Ambient, gehaltene Klänge |
| sehr langsame Transformation | 4–8 Schläge | Intro, Bridge, Outro |

Bei knappem Material sollte der **harte Schnitt Standard** sein und der Übergang eine semantische Funktion haben.
Beginnt jeder Abschnitt mit einem anderen auffälligen Übergang, wird der Übergang selbst zum Inhalt.

### Liedtext und Karaoke

*Normativ/Praxisstandard:* Netflix begrenzt Untertitel typischerweise auf 42 Zeichen je Zeile und nennt für
Erwachsene bis zu 17 Zeichen je Sekunde (Netflix Timed Text Style Guide) — kein Musikvideo-Gesetz, aber eine
brauchbare obere Lesbarkeitsgrenze.

Höchstens zwei Zeilen · an syntaktischen Einheiten brechen, nicht nach Zeichenzahl · neue Zeile etwa 80–150 ms vor
dem ersten gesungenen Wort vollständig sichtbar · nicht jedes Wort einzeln ein- und ausblenden · hervorgehobenes Wort
farblich oder im Gewicht ändern, nicht zusätzlich skalieren, glühen und springen · letzte Zeile 200–500 ms nach dem
Gesang stehen lassen · mindestens etwa 1 s Sichtbarkeit für sehr kurze Blöcke.

*Eigene Einschätzung:* Für Musikvideos ist **eine ganze Zeile mit ruhigem Fortschrittsindikator** meist hochwertiger
als Silben-Karaoke; wortweises Hüpfen zieht die Aufmerksamkeit ganz vom Artwork ab. Für bewegte Gründe:
halbtransparente lokale Dunkelplatte, Outline oder Schatten mit konstantem Kontrast — nicht die Schrift je Bild
komplementär umfärben, das flimmert typografisch.

### Plattformen und Mehrformatstrategie (Stand September 2026)

| Plattform | offiziell belegbar | sinnvolle Ausgabe |
|---|---|---|
| YouTube regulär | Standard 16:9, Player passt anderes an; 1080p SDR 8 Mbit/s bei 24–30 fps, 12 Mbit/s bei 48–60 fps; H.264, AAC/Opus, 48 kHz | 1920×1080, 30 fps, H.264 High, 8–12 Mbit/s |
| YouTube Shorts | quadratisch oder vertikal, bis 3 Minuten | 1080×1920; längere Lieder als normales Video |
| Instagram Reels | 1,91:1 bis 9:16, mindestens 30 fps und 720 px | 1080×1920, 30 fps |
| TikTok organisch | in der App bis 10 min, hochgeladen bis 60 min | 1080×1920, 30 fps |
| TikTok In-Feed Ads | 9:16 empfohlen, mindestens 540×960, mindestens 516 kbit/s, ≤ 500 MB | technisches Minimum, keine Qualitätszielmarke |

Es gibt **keinen dauerhaft universellen pixelgenauen Sicherheitsbereich**: Bedienelemente hängen von Plattform,
Gerät, Beschreibungslänge und Anzeigenformat ab; TikTok und Meta bieten eigene Vorlagen und Vorschauen.
Konservative Mehrplattform-Zone für 1080×1920: links/rechts mindestens 8 % frei, oben 15 %, unten 30–35 %, wichtige
Liedzeilen im Bereich 40–65 % der Bildhöhe.

**Nicht ein fertiges Video für alles bauen**, sondern: einen gemeinsamen musikalischen Ablaufplan, einen Szenengraphen
mit Ankern (`subject`, `title`, `lyrics`, `background`), je Format eigene Kamera-, Crop- und Textregeln, getrennte
Renderdurchläufe. Die Dramaturgie wird einmal gebaut, drei Kompositionen werden gerendert.

### Zehn-Sekunden-Loops

*Empirisch gestützt:* Forschung zu „Video Textures" sucht Übergänge nach räumlich-zeitlicher Ähnlichkeit (Schödl et
al.); neuere Verfahren kombinieren das mit räumlicher Überblendung (*Fast Computation of Seamless Video Loops*).

Ein guter Loop hat ähnlichen Bildzustand an Anfang und Ende, gleiche Bewegungsrichtung und Geschwindigkeit, keine
Handlung, deren Ursache oder Ergebnis zurückspringt, keine plötzlich wieder auftauchenden Partikel, gleiche
Beleuchtungsphase, und periodische oder deterministische Effektzustände.

Gut loopbar: Atmen, Schweben, Pendeln, Lichtpulse, Wasser/Feuer/Rauch mit lokalem Übergang, Partikelfelder mit
Wrap-around, langsame zyklische Shader, abstrakte Texturen. Schlecht: Gehen, Greifen, Fallen, Lippenbewegung,
gerichtete Kamerafahrt ohne Rückkehr, irreversible Zerstörung, klar verfolgbare Einzelpartikel.

**Zur Länge:** 2, 4 oder 8 vollständige Takte sind besser als exakt 10,000 Sekunden. Bei 120 BPM und 4/4 sind vier
Takte 8 s und fünf Takte genau 10 s — fünf Takte wirken aber oft formal schief. Stehen zehn Sekunden technisch fest,
können interne Effekte in 1-, 2- oder 4-Takt-Zyklen laufen, während nur die äußere Hülle nach zehn Sekunden schließt.
Immer mindestens drei Wiederholungen prüfen; WCAG weist darauf hin, kurze Inhalte im geloopten Zustand auf Blitze zu
prüfen.

### Sicherheit: konkrete Grenzen

*Normativ:* Nach WCAG 2.2 darf Inhalt entweder nicht mehr als **drei allgemeine bzw. rote Blitze in einem beliebigen
Einsekundenfenster** enthalten oder muss unter der definierten Flächen- und Kontrastschwelle bleiben. Ein allgemeiner
Blitz ist vereinfacht eine Hin-und-zurück-Änderung der relativen Luminanz von mindestens **0,10**, wenn der dunklere
Zustand unter 0,80 liegt. Die Kleinflächenausnahme bezieht sich auf höchstens **0,006 Steradiant** bzw. 25 % eines
zentralen 10°-Gesichtsfeldes — **nicht** pauschal 25 % der Videofläche. Gesättigtes Rot wird strenger behandelt.
(WCAG 2.3.1, ITU-R BT.1702-3)

Konservativ für unseren Renderer: nie mehr als zwei deutlich wahrnehmbare Vollbildblitze je Sekunde · keine
wiederholten gesättigt roten Hell-dunkel-Wechsel · Blitzfläche klein halten · Blitze nicht aus mehreren Effekt-Layern
addieren lassen · Rolling Window statt fester Sekundenblöcke · Loop-Übergang mitprüfen · die **fertige Ausgabe**
prüfen, nicht nur einzelne Effekte. Ein Flash-Analyzer führt Bilder in lineares RGB, rechnet relative Luminanz,
untersucht Kacheln und zählt gleichzeitig wechselnde Flächen zusammen.

Für Bewegungsübelkeit gibt es keine vergleichbar belastbare Grenze; W3C nennt besonders Parallaxenbewegung als
möglichen Auslöser. Konservativ: keine dauernde Vollbild-Oszillation · keine schnelle Umkehr der virtuellen Kamera ·
langsame Bewegungen über mindestens 250 ms ein- und auslaufen lassen · Bildrotation vermeiden oder klein halten ·
einen **„Reduced Motion"-Render** anbieten (kein Parallax, kein Kreuzzoom, keine Vollbildpulse, nur Blenden und
lokale Bewegung).

### Was von professionellen Werkzeugen übernommen werden kann

| System | relevantes Konzept | lokal nachbaubar? |
|---|---|---|
| After Effects | Ebenen, Precomps, Keyframes, Expressions, Audioamplitude als Steuerspur | ja: Szenengraph, Effektgraph, abgeleitete Kontrollspuren |
| Resolume | Clips/Layers/Groups, BPM-Sync, Phasenbezug, FFT-Gain und Falloff | fast vollständig |
| Notch | Nodegraph, getrennte Frequenzregionen, Modifier, Schwellen, Attack/Decay/Smoothing | sehr gut in WebGL |
| DaVinci/Fusion | Timeline plus Node-Compositing, Masken, Spline-Kurven, Retiming, Optical Flow | weitgehend; hochwertige Masken bleiben arbeitsintensiv |
| VJ-Praxis | Szenen vorbereiten, wenige Parameter live variieren, Spannungsreserve | vollständig |
| Generative Live-Visuals | deterministische Zufallswerte, rückgekoppelte Texturen, Parameter-Modulation | vollständig in Shadern |

**Was uns gegenüber professionellen Musikvideos fehlt:** echte Gegenperspektiven, menschliche Performance, räumliche
Kontinuität zwischen Einstellungen, erzählerische Reaktionen und Blickachsen, natürlich wechselnde Bewegungsqualitäten.
Das ersetzt kein Shader. Deshalb sollte das System eher **hochwertige bewegte Coverkunst mit editorischer Dramaturgie**
erzeugen als einen Musikvideodreh simulieren.

## Fünf Messungen, um die eigenen Regeln zu prüfen

1. **Zeitversatz-Präferenz:** dasselbe Video mit Wechseln bei −½, −¼, 0 und +¼ Schlag blind vergleichen lassen, nach
   Genre und Ereignistyp auswerten.
2. **Aktivitätsbudget:** je Bild optischen Fluss, Luminanzänderung, Schnitt und Effektzahl zusammenfassen und prüfen,
   ab welcher Aktivität Zuschauer „lebendig", „hektisch" oder „billiger Visualizer" sagen.
3. **Abschnittserkennbarkeit:** Testpersonen ohne Ton markieren lassen, wo sie Refrain, Bridge und Finale vermuten;
   gegen die musikalischen Abschnittsgrenzen vergleichen.
4. **Loop-Naht-Erkennung:** drei Wiederholungen zeigen und fragen, ob und wann ein Neustart erkannt wurde; zusätzlich
   End-/Start-SSIM, optischen Fluss und Helligkeitsdifferenz messen.
5. **Textleistung:** nicht Gefallen abfragen, sondern korrekt erinnerte Wörter/Zeilen, subjektive Anstrengung und
   Blickabwendung zwischen Vollzeile, Wort-Highlighting und Karaoke-Modus vergleichen.

**Empfohlener nächster Entwicklungsschritt (ChatGPT):** erst einen hierarchischen VisualScore mit Salienz-Budget,
Zuständen und wenigen geglätteten Kontrollspuren bauen; die vorhandenen 40 Effekte danach als Darsteller dieses Plans
behandeln.

## Wie das zu unseren eigenen Messungen passt (Anmerkung, 16.09.2026)

- **Abschnitte:** Unsere Messung am Bestand deckt sich mit der Empfehlung, den Abschnitt zur obersten Zeitskala zu
  machen — sie zeigt aber auch, dass Sunos Grenzen nur 52 % unserer Textgrenzen bestätigen (Zufallsboden 23 %) und
  dass das Taktraster bei 136 von 325 Titeln wackelt. Der Ablaufplan muss also mit unsicheren Grenzen umgehen können.
- **Lautheit:** Deckt sich mit unserem Befund, dass die 0,7-s-Hüllkurve ruhige Passagen gut markiert
  (189 von 325 Titeln haben eine Strecke ab 5 s unter −6 dB), Abschnittsgrenzen aber nicht findet (0,82 dB Sprung
  gegen 0,31 dB Zufallsboden).
- **Rechenzeit:** Der empfohlene Mehrformat-Ansatz („einmal planen, dreimal rendern") ist bezahlbar: gemessen
  0,1× bis 1,14× Liedlänge je Durchlauf über WebCodecs.
