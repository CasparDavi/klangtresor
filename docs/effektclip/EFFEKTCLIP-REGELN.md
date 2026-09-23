# Effektclip-Studio: die Regeln

Stand 10.09.2026. Entstanden aus dem großen Tiefen-Check, bei dem 38 Effekte mit allen ihren
Reglern durchgemessen und gegen ihren Code gelesen wurden. Caspar_D am selben Abend: „hast du
eigentlich deine Testergebnisse irgendwo niedergeschrieben, damit wir jederzeit wissen, was wir
nicht mehr machen dürfen."

Das ist diese Datei. Sie sagt, was gilt, wie man es nachprüft und was beim letzten Lauf
herauskam. Wer einen Effekt baut oder ändert, liest sie vorher.

---

## Die Gesetze

**1. Stärke ist immer die Deckkraft.** Wie stark das fertige Ergebnis eines Effekts ins Bild
gemischt wird, zuletzt angewandt, 0 bis 100 Prozent. Nichts anderes.

**2. Kein zweiter Regler darf nur Deckkraft sein.** Findet sich im Maler ein reines Produkt aus
Stärke und einem anderen Regler, ist einer davon zu viel. So sind „Schlag", „Tiefe" und „Dichte"
verschwunden. Alle anderen Regler formen den Effekt: wie groß, wie viele, wie schnell, wie weit,
wie hell.

**3. Was keine Deckkraft hat, bekommt keinen Stärke-Regler.** Geometrie (Fahrt, Zoom, Kippen) und
reine Verzerrer (Wellen, Linse, Bildlauf, Verwackeln, Blöcke) verändern das Bild, sie mischen
nichts hinein. Eine Überblendung zwischen verzerrt und unverzerrt ist kein schwächerer Effekt,
sondern ein Geisterbild. Registry-Merkmal: `ohneStaerke`.

**4. Vollbild-Ergebnisse vertragen nur „Über".** Wer das ganze Bild neu ausgibt (Nachbearbeitung,
Shader, die Grund-Pulse), darf keine Verrechnung anbieten: sie würde das Bild mit sich selbst
verrechnen. Ausnahmen tragen `verrFrei` und sind es, weil sie wirklich nur einen Zuschlag liefern
(Bloom, Kaustik).

**5. Licht ist Beleuchtung, nicht Farbe.** Lichter rechnen mit Farbig abwedeln: sie hellen auf,
was schon da ist. Ein Strahl im Leeren ist unsichtbar — das ist richtig so. Schatten ist das
Spiegelbild und rechnet mit Farbig nachbelichten. Wer schwarz abwedelt, malt nichts (daran starb
das Sicherungswackeln einen halben Tag lang).

**6. Nebel leuchtet nicht selbst, er wird beleuchtet.** Ein Medium liest den Licht-Puffer, in den
alle Leuchten der Kette zusätzlich additiv malen. Darum wird ein Strahl im Nebel sichtbar, gleich an
welcher Stelle der Nebel in der Kette hängt. Wer einen neuen Leuchter baut, setzt `leuchtet` in der
Registry — sonst ist er im Nebel nicht zu sehen.

**6b. Ein Medium dämpft und gibt dazu — es mischt nicht gegen eine Farbe.**

```
Ergebnis = Bild × Durchlass  +  Farbe × (Umgebung + Streulicht × 4) × (1 − Durchlass)
```

Hier stand bis zum 14.09.2026 die Mischform `mische(Bild, Farbe × (Grundlicht × Umgebung + Licht ×
Streuung), Dichte)`. Sie trägt nicht, und das ist gemessen:

- **Der Nebel wurde zu schwarzer Farbe**, sobald man „Ohne Licht" auf 0 stellte — Weiß mal null ist
  schwarz, und die Dichte entschied allein über die Deckung. Gemessen: −48 % Helligkeit, an der
  dunkelsten Stelle −211 Graustufen. Caspar_D: *„warum wird nebel ohne licht immer schwarz obwohl
  ich weiss eingestellt habe"*.
- **Der neutrale Punkt lag nicht bei 1, sondern bei 1,20** — weil die Nebelfarbe mitmultipliziert
  wurde (`#cfd6e0` hat 83,5 % der Leuchtdichte von Weiß). Vier Fünftel des Reglerwegs dunkelten, und
  weil die drei Kanäle verschieden sind, gab es **überhaupt keinen** farbneutralen Wert.
- **Der Strahl musste erst die Dämpfung bezahlen**: auf den Strahlen ohne Nebel 33,1 Graustufen, mit
  Nebel bei „Im Licht" 0 nur 16,9. Erst ab 58 % Reglerweg war er wieder im Plus.

Die neue Form hat die Mängel nicht kleiner gemacht, sondern **unkonstruierbar**. Weißer Nebel ist auf
flächigem Grund exakt neutral (`Bild×T + Bild×(1−T) = Bild`, bei jeder Dichte — gemessen: 0,1 bis
0,8 % Änderung über den ganzen Stärkeweg). Und der Faktor 4 gegen den Mindestanteil 0,25 ergibt 1:
**was die Dämpfung dem Strahl nimmt, gibt die Einstreuung mindestens zurück.** Gemessen: 33,1 → 73,0
bei der Vorgabe, 96,4 bei voller Dichte, und bei keiner Reglerstellung unter 33,1.

Dunkler Nebel entsteht nicht über eine Helligkeit, sondern über das **Material**: die Farbe ist das
Fluid. Weiß ist Wassernebel (Streu-Albedo 0,9999999 — er kann physikalisch nicht abdunkeln), dunkel
ist Rauch und schluckt ehrlich. Godot nennt das „Albedo auf Schwarz", Houdini hat eine eigene
„Absorption Color". In rund 25 geprüften Systemen (Unreal, Unity, Godot, Blender, Fusion, Nuke,
Houdini, OpenGL/Direct3D, pbrt) gibt es **keinen einzigen Helligkeitsregler für Nebel** — wie hell
eine Lampe im Nebel brennt, steht überall an der Lampe.

**6a. Ein Medium rechnet gegen seine Umgebung, nicht gegen eine feste Zahl.** „Umgebung" ist die grob
verwaschene Helligkeit des Bildes an dieser Stelle. Ein fester Grauwert zog helle Stellen herunter
und dunkle herauf, und beides zusammen fraß Kontrast und Farbe: bei gleicher Dichte gingen 32 %
Kontrast und 46 % Buntheit verloren, mit der Umgebung nur 14 % und 28 %. Wer eine Schicht über das
ganze Bild legt, fragt zuerst, wogegen sie rechnet. **Der Abtastradius gehört auf das
Seitenverhältnis umgerechnet** — sonst ist die Abtastscheibe bei einem hochkanten Bild eine Ellipse
(bei 900×1200 mit Achsverhältnis 1,33).

**6c. Wenige Regler, die etwas entscheiden, statt vieler, die dasselbe tun.** Lage, Dicke und
Schichtkante waren drei Regler und sind eine Entscheidung: schwerer Nebel liegt tiefer, flacher und
hat eine schärfere Oberkante. Körnung und Turbulenz sind zwei Namen für eine Zahl. Wind, Wabern und
Auftrieb folgen aus dem Luftzug. Der Filmnebel hat fünf Regler plus Stärke, der Theaternebel hatte
fünfzehn — zum Vergleich: Blender Volume Scatter 3, Unity 4, DIN SPEC 15800 für Nebelgeräte 4,
Fusion Fog 5, Godot 10. Ein echter Hazer (Look Solutions Unique 2.1) hat zwei: Pumpe und Lüfter.

**6d. Ein Regler, der einen Zustand umschaltet, darf nicht heimlich andere mitschreiben.** Der
Sortenwechsel des Theaternebels setzte acht weitere Regler neu — aber nur, solange keiner davon
angefasst war (`Object.keys(alt).every(...)`). Dieselbe Handlung hatte damit zwei Ausgänge, und das
ist die Wurzel dessen, was Caspar_D am 14.09.2026 so beschrieb: *„ich habe irgendwie einen
Glücksspieleindruck und kein deterministisches Agieren."* Der Schwesterfall bei den Partikeln
(`artFarben`) macht es richtig: je Schlüssel geprüft, je Schlüssel gesetzt.

**7. Selbstleuchter sind keine Beleuchtung.** Feuer, Flammen und Partikel leuchten selbst und
behalten ihre eigene Verrechnung. Sie werden nicht auf Abwedeln umgestellt.

**8. Die Kette gilt in ihrer Reihenfolge.** Was oben steht, wirkt zuerst. Das gilt seit dem
10.09.2026 auch für Nachbearbeitung und Shader; vorher sanken sie stillschweigend ans Ende und
die Oberfläche versprach etwas, das nicht stimmte.

**9. Jeder Regler muss messbar wirken, über seinen ganzen Weg.** Ein Bereichsende ohne Wirkung ist
ein Fehler, kein Spielraum. Beispiele aus dem Tiefen-Check: die Nebeldichte war oberhalb von 0,7
tot, die Stärke oberhalb von 100 Prozent bei sieben Typen, die Antriebstiefe beim Stroboskop auf
ihrer ganzen Länge.

**9a. Und die Wirkung muss über den ganzen Weg gleichmäßig wahrgenommen werden.** Caspar_D,
22.09.2026: „Slider müssen im gesamten abgedeckten Wertebereich sichtbare Effekte erzielen. Ggf.
muss die Sliderstellung transformiert werden, falls der Wertebereich logarithmisch oder anders
nicht linear ist." Ein Regler, der über die erste Hälfte seines Wegs kaum etwas tut und in der
zweiten Hälfte alles auf einmal, hat zwar an jeder Stelle eine Wirkung (Regel 9 wäre erfüllt) —
aber die Bedienung fühlt sich falsch an, weil die Hand mit der Stellung eine gleichmäßige
Veränderung erwartet. Gefunden am 22.09.2026 bei `strahlenRaum.dicke`: 0,05° → 0,43 · 1,2° → 0,85
· 2° → 1,86 · 3° → 3,87 · 5° → 8,89 · 8° → 12,06 · 12° → 15,23 (gemessene mittlere Bildänderung) —
das ist eine S-Kurve, kein linearer Verlauf. Die Ursache liegt meist darin, dass die WIRKUNG
quadratisch oder anders nichtlinear mit dem WERT skaliert (hier vermutlich: Fläche wächst mit dem
Quadrat der Winkelbreite, bis eine Sättigung durch die Bildgröße einsetzt). Die Abhilfe ist dann,
nicht den Wertebereich zu kürzen, sondern die Skala des Reglers selbst zu transformieren, sodass
gleiche Schieberegler-Schritte gleiche wahrgenommene Wirkungs-Schritte ergeben.

**Gebaut am 23.09.2026, als allgemeiner Mechanismus:** Ein Parameter kann eine `skala` tragen —
Stützstellen `[Wert, gemessene Wirkung]`, monoton steigend. Der Schieber läuft dann über die
**Wirkung** (0 … 1), `skalaZuRegler`/`skalaVonRegler` rechnen um, die Zahl rechts daneben zeigt
weiter den Wert, und das Rezept trägt weiter den Wert, nie die Stellung — alte Rezepte bleiben
unverändert lesbar. Erster Träger ist `strahlenRaum.dicke`. Neu gemessen am Prüfstand (Titel
„Stumm", Schacht mit 35 Strahlen und Filmnebel, hinzugefügtes Licht je Bildpunkt, bei 360 und
720 px lange Seite gleich): 0,05° → 12,5 · 0,1° → 20,0 · 0,2° → 24,9 · 0,4° → 26,0 · 1° → 28,2 ·
2° → 31,5 · 4° → 38,5 · 8° → 53,1 · 12° → 69,4. Seit dem Glimmen (§7 im Leuchten-Konzept) ist es
keine S-Kurve mehr, sondern **steil bis 0,4°, danach linear** — die ersten 3 % des linearen
Reglerwegs machten ein Viertel der ganzen Wirkung. Mit der Skala liegt 0,44° jetzt bei einem
Viertel des Wegs, 4,7° in der Mitte, 12° am Anschlag. Die Kugelquelle hat dieselbe Form (2,4 /
12,5 / 105 bei 0,05 / 0,4 / 12°), nur oben steiler; sie teilt die Skala des Schachts.

**10. Ein ausgeblendeter Regler ist nicht abgeschaltet.** `when` versteckt nur die Zeile, der Wert
bleibt stehen und wird weitergereicht. Wer eine Auswahl „keine" anbietet, muss den Wert selbst auf
null zwingen. Der Nebel zog sonst bei „Absaugung: keine" trotzdem zur Bildmitte.

**10a. Ein Wort steht für eine Sache.** „Versatz" heißt auf drei Karten ein Abstand im Bild; im Antrieb
hieß es eine Verschiebung in der Zeit. Der heißt jetzt **Zeitversatz**, und auf einer Karte, die beides
hat, liest sich das Paar von selbst. Fachjargon wie „Phase" wäre richtig gewesen und trotzdem falsch:
im Studio soll niemand etwas nachschlagen müssen.

**11. Die Beschriftung ist ein Versprechen.** Sagt der Regler „Breite in Grad", ist es der ganze
Winkel und nicht der halbe. Sagt die Beschreibung „nur auf der Eins", darf der Code nicht jeden
Schlag nehmen. Sagt sie „lodert höher", muss es höher werden und nicht zwischendurch niedriger.

**12. Alte Ablagen werden übersetzt, nie stillschweigend anders gelesen.** Jede Bedeutungsänderung
bekommt eine Übersetzung in `effektAusRezept`. Ablagen tragen `fassung`; ältere gelten als alt und
werden gefaltet. Schlüssel, die es nicht mehr gibt, werden beim Laden entfernt, damit sie nicht
beim nächsten Sichern wieder mitgehen.

**13. Nichts speichern, was nicht gelesen wird.** Was `effekteJSON` schreibt, muss ein Maler auch
brauchen. Tote Schlüssel in der Ablage sind Fallen für den Übernächsten.

**14. Ein Filter gehört nicht in eine Schleife.** `ctx.filter` wirkt je Zeichenzug, nicht je Fläche:
jeder einzelne Zug bekommt einen eigenen Weichzeichnungs-Durchgang. Die Scheinwerferblende malte so
bis zu 6889 einzeln weichgezeichnete Kreise je Bild und brauchte für ein einziges Bild 465
Millisekunden, im Kegel drei Sekunden. Regel: unscharf wird einmal am Ende über die fertige Fläche
gezeichnet. Und was sich wiederholt, wird einmal in eine Kachel gemalt und als Muster gefüllt.

**15. Der Maler wirft nicht.** Jeder Effekt läuft in seinem eigenen try. Ein fehlender Parameter
darf nicht den ganzen Bildaufbau anhalten; darum legt `effektAusRezept` gespeicherte Werte über die
Vorgaben des Typs und nicht umgekehrt.

**16. Ein Sichtfeld hat keinen Rand, den man sehen kann.** Wer einräumt, wo ein Effekt wirken darf,
räumt damit auch ein, wo er aufhört — und genau dort entsteht der Fehler. Der Videoplan (§9a.2) sagt
es als Unterschied zweier Bilder: „Funken nur über dem Feuer" gegen „Funken in einem sichtbaren
Kasten". Dasselbe steht in §9d.2 unter dem, was sich nicht messen lässt: harte Kanten, wo Licht weich
sein müsste. Die Regel zieht daraus die Konsequenz für jede räumliche Begrenzung — Sichtfeld,
Quellfläche, Zone, Maske:

- **Der Übergang ist Teil der Form, nicht ihre Verzierung.** Eine Begrenzung ohne Gefälle ist kein
  Grenzfall der Einstellung, sondern eine Form, die es nicht geben darf. Der Regler für den Rand
  fängt deshalb nicht bei null an.
- **Die Kante folgt der Größe.** Das Gefälle ist ein Anteil der Ausdehnung, kein fester Abstand in
  Bildpunkten — sonst ist derselbe Wert beim kleinen Fleck ein Nebel und beim großen eine Kante.
- **Was hart begrenzt aussieht, ist entweder eine Bildkante oder ein Fehler.** Die Bildkante darf
  hart sein, sie ist die Grenze des Mediums. Alles, was innerhalb des Bildes aufhört, hört weich auf.

Die Regel ist die räumliche Schwester von **Regel 5**: dort hellt Licht auf, was da ist, statt Farbe
zu malen; hier hört ein Effekt aus, statt abgeschnitten zu werden. Beide Male ist der Fehler, dass
man dem Bild ansieht, wo die Software zu Ende denkt.

**17. Im Export kehrt jeder Effekt nach L zum Ursprung zurück.** Caspar_D: *„es muss halt der
effekt wieder zum Ursprung zurückkehren auf dem letzten frame"*. Bild(t0+L) muss Bild(t0) sein, bei
jeder Reglerstellung — nicht nur bei der Vorgabe. Am 14.09.2026 brachen 41 von 85 Messfällen,
darunter zehn schon mit Vorgaben. Daraus fünf Unterregeln für jeden neuen Effekt (VIDEO-PLAN §6.8):

- **17a. Keine rohe Zeit.** Wer `t` in einen Sinus, eine Drehung oder eine Verschiebung steckt,
  nimmt `lpR` (Umläufe je s), `lpP` (Periode), `lpW` (Kreisfrequenz) oder `lpV` (Geschwindigkeit über eine Umbruchweite).
  Unter `LOOP=0` geben sie den Wert unverändert zurück, die Vorschau bleibt also bitgleich. Achsen
  unter einem Umlauf je Clip pendeln über `lpBahn` statt auf einen ganzen Umlauf zu rasen. Ein Faktor
  wie `ph*1.3` ist verboten — daran brachen Scheinwerfer und Laser in der Vorgabe.
- **17b. Keine Zufallsnummer an absoluter Zeit oder absolutem Index.** `hs(i)` am Feldindex,
  `floor(t/p)` oder `Math.random` je Bild würfeln bei t0+L neu. Gewürfelt wird an der umlaufenden
  Nummer: je Schlag `lpSchlag(S,i)` (das Feld `S[i][2]`), je Fenster `lpFenster(t,p)`, je Bild
  `lpZufall(lpBildNr(t)…)`. Die Vorschau darf weiter frei würfeln.
- **17c. Zustand nur mit Vorlaufrunde.** Wer aus dem letzten Bild rechnet (Spur, Nachhall), muss
  abklingen und bekommt vor dem ersten gezählten Bild einen ungezählten Vorlauf (`vorlaufen()`), bis
  der Rest unter einer halben Graustufe liegt. Seine Spur hängt an der Ergebnisfläche, nie am
  Effektobjekt, das Pult und Export teilen. Was nur wächst, steht im Export ausgewachsen — es wird
  nie am Clipende wieder kleiner.
- **17d. Drift nur periodisch.** Gerichtete Bewegung ohne Rückkehr (Fallen, Steigen, Luftzug) läuft
  im Export entweder in ganzen Umläufen, als Lebensdauer genau L (Partikel, Überblendung zum
  Ursprung) oder in zwei um L/2 versetzten Lagen (Rauschshader). Rauschen wabert über `noise4D` mit
  der Zeit auf dem Kreis. Verfälscht das Einrasten das Tempo sichtbar (über 15 %), ist Einrasten der
  falsche Weg. Schlaggebundene Teiler meldet der Effekt über `loopGruppe(e)`/`loopKick(e)`, damit
  `ausschnitt()` die Taktzahl passend wählt; was sich gar nicht schließen lässt, meldet `loopNein(e)`.
- **17e. Geprüft wird vor dem Einbau.** Neuer Effekt oder neuer Regler: Fall in
  `labor/nahtpruefung/faelle-bauen.js` anlegen, `node labor/nahtpruefung/naht.mjs --faelle …` laufen
  lassen, dazu `--vorschau-vergleich labor/nahtpruefung/vorschau-vorher.json`. Urteil ist `gleich` und
  `gleichFolge` ≈ 0, nicht der Quotient allein (siehe „Wie geprüft wird").

**18. Der Zehnsekünder sitzt auf Songzeit 0.** Caspar_D: *„suno startet song und video gleichzeitig"*.
Clipbild 0 liegt auf der Songseite auf Songzeit 0, und der Clip beginnt alle N/30 s neu. Wo der Schlag im
Clip liegt, entscheidet darum nicht t0 — t0 bestimmt nur, was die Effekte zeigen —, sondern die Lage φ
des Rasters. Bis zum 15.09.2026 lag sie fest bei 0 und damit zufällig gegen das Lied: im Median saßen
19 % der Songzeit im Takt, heute 98 % (VIDEO-PLAN §3 „Gebaut 15.09.2026"). Daraus vier Unterregeln:

- **18a. Nur der kodierende Weg ist taktsicher.** Suno behält Bildzahl und Bildrate, wenn sauber kodiert
  wurde; der MediaRecorder-Weg kam 32 ms länger zurück und driftet über das Lied. Wer über den Notweg
  ausgibt, bekommt keine Zahl, sondern den Hinweis, dass der Takt nicht sicher mitläuft.
- **18b. Gemessen wird am Bild, auf dem der Puls erscheint.** Nicht an der rechnerischen Schlagzeit:
  der Puls kommt 0 bis 1 Bild spät, und die Zahl stand dadurch im Median 6 Prozentpunkte zu hoch.
  Fenster 1/8 Schlag, höchstens 80 ms — sonst heißt „sitzt" bei langsamen Liedern etwas Weicheres.
- **18c. Keine Zahl unter ihrem Zufallsboden.** Auf verwackelten Schlägen findet dieselbe Suche bis
  43 %. Darunter sagt die Statuszeile „keine Länge bleibt über das Lied im Takt – die Pulse laufen im
  Suno-Video gegen die Musik", nicht „30 %" (Wortlaut seit 15.09.2026, Caspar_D; vorher „der Takt lässt sich nicht über das Lied legen").
  Wer die Suche ändert (neue Kartenlage, neues Fenster), misst den Boden neu (`ZUFALL_BODEN`).
- **18d. Ein Clipschlag bleibt ein Songschlag.** Halb- und Doppeltempo sind keine Lösung, auch wenn sie
  mehr Schläge treffen: ein Puls ohne Songschlag kostet in der Zielfunktion nichts, auf dem Bild aber
  alles. Die Tempo-Schranke gilt darum immer gegen das ganze Lied. Und eine Karte, die die Eins liest,
  bekommt ganze Takte — sonst zählt die Zählzeit im Clip anders als im Pult.

**19. Größen sind relativ zur Bildfläche, das Studio in Vorgabegröße ist der Maßstab.** Caspar_D, 15.09.2026:
*„im Studio arbeite ich ja nach Augenschein, was dort rauskommt ist der Maßstab, den wir am Ende brauchen"*.
Jede absolute Größe (Radius, Strichbreite, Blur, Taumelweite, Korn, Raster) wird mit der Einheit
`EINHEIT = Bildbreite der Leinwand / Breite desselben Bildes im Studiofeld 898 × 889` gerechnet
(`einheitVon()`, gesetzt in `zeichneFrame()`). Im Studio in Vorgabegröße ist sie genau 1 — dort bitgleich.
Untergrenzen erst **nach** dem Umrechnen, und wo eine Untergrenze greift, trägt die Deckkraft den Rest
(`ws/lw`), sonst werden feine Striche auf kleinen Leinwänden zu hell. Geprüft wird mit
`naht.mjs --studio-vergleich studio-vorher.json` (bitgleich) und `--massstab` (360 gegen 1080 px).

---

## Wie geprüft wird

Zwei Wege, und beide sind nötig.

**Die Messreihe.** `labor/effektclip-studio/messreihe.js` hängt jeden Effekt einzeln ein, schaltet
ihn an und aus, fährt jeden Regler von Minimum auf Maximum, schaltet jede Auswahl und jeden Schalter
durch und misst jedes Mal die mittlere Abweichung je Bildpunkt. Uhr steht fest auf einem Schlag,
Quelle ist das Testporträt in Farbe. Vier Minuten. Eine Null ist ein Verdacht, kein Urteil.

**Das Gegenlesen.** Register gegen Maler, Zeile für Zeile: wird der Parameter überhaupt gelesen,
tut er, was seine Beschriftung sagt, gibt es tote Zweige, gibt es zwei Regler für eine Zahl. Dazu
je Befund ein Skeptiker, der ihn zu widerlegen versucht. Von 66 Befunden hielten 61, von 21 beim
Nachbau des Nebels hielten 3.

Der Weg ins Haus und zurück läuft über `bin/effektclip-labor.js`:

```bash
node bin/effektclip-labor.js aus     # Block aus web/index.html holen
node bin/effektclip-labor.js ein     # zurück spleißen, mit Syntaxprüfung
node bin/effektclip-labor.js daten   # Prüfdaten und Verweise anlegen
```

---

## Was der Mittelwert nicht sieht

Vier Fallen, in die der Autor dieser Zeilen an einem Abend alle vier getappt ist.

- **Ereignisse.** Sicherungswackeln und Glitch-Blöcke feuern selten und kurz. Bei stehender Uhr
  messen sie null, im Zeitlauf über acht Sekunden 43 beziehungsweise 2,5. Ereignis-Effekte brauchen
  einen Zeitlauf, keinen Einzelblick.
- **Punktuelles.** Tropfen, Einschläge und Risse bedecken wenig Fläche. Ihr Mittelwert liegt unter
  eins, ihr stärkster Bildpunkt bei 126 bis 197. Der Mittelwert misst Fläche, nicht Sichtbarkeit.
- **Abhängiges.** Der Nebelregler „Im Licht" misst allein null, weil ohne Leuchte in der Kette kein
  Licht aufzunehmen ist. Mit einem Scheinwerfer misst derselbe Regler 21 bis 143. Das ist der
  Beweis für das Medium, nicht sein Fehler.
- **Das falsche Feld.** Wer „das hellste Bildviertel" misst, misst beim Testbild die Kugel und
  nicht den Strahl. Immer gegen den Bereich messen, um den es geht.
- **Rechenzeit ohne Rücklesen.** `performance.now()` um Zeichenbefehle misst nur, wie schnell man
  Befehle abschickt, nicht wie lange sie brauchen. Die Blende sah so nach 5,8 ms aus und brauchte in
  Wahrheit 465. Nach jedem Durchgang einen Bildpunkt zurücklesen, dann stimmt die Zahl.
  `labor/effektclip-studio/blendentest.html` macht das vor, ohne Studio und ohne laufenden Maler.

  **Aber Vorsicht — diese Regel gilt für EINEN Durchgang, nicht für eine Kette von Leinwandgängen**
  (Nachtrag 18.09.2026, teuer gelernt). Wer nach *jedem* Gang zurückliest, löst genau das aus, was
  Chrome mit „Canvas2D: Multiple readback operations … willReadFrequently" beantwortet: die Leinwand
  wandert **von der Grafikkarte auf den Rechner**. Danach misst man einen anderen Maler als den, der
  im Betrieb läuft. Bei den Tiefenschichten der Partikel wurden so **9,90 ms** für vier Bänder
  gemessen, wo es auf Jörgs Radeon (ANGLE Metal, Radeon Pro 5500 XT) in Wahrheit **1,27 ms** sind —
  Faktor 7,8, und je Band Faktor 19. Eine Änderung wäre an einer erfundenen Grenze gescheitert.

  **Der Weg für eine Kette:** Bilder *verbrauchen* statt zurückzulesen — die Leinwand bleibt auf der
  GPU, kein Bild darf verworfen werden, und gemessen wird über viele Bilder. Und immer **beides**
  nebeneinander nennen, mit der Grafikkennung dazu; gehen die Zahlen um eine Größenordnung
  auseinander, ist das der Hinweis, dass man den Malweg verlassen hat.
- **`seeked` ist nicht „Bild ist da".** Beim Messen, wie teuer ein Sprung im Video ist, sah ein
  normal kodierter Clip mit 5,4 ms genauso schnell aus wie eine Fassung aus lauter Schlüsselbildern.
  Das war falsch: das Ereignis `seeked` feuert, bevor das Bild wirklich steht, und das anschließende
  `drawImage` malt noch das alte. Erst als der Prüfstand je Sprung einen **Fingerabdruck des Bildes**
  nahm und nachwies, dass wirklich 40 verschiedene Bilder ankamen, standen die echten Zahlen da:
  **124,6 ms gegen 14,9 ms**, also achtmal so teuer. Wer Video misst, muss beweisen, dass das
  gemessene Bild auch das angeforderte ist (11.09.2026).
- **Die verborgene Scheibe.** Eine Seite im Hintergrund wird gedrosselt, `setTimeout` läuft dann nur
  noch einmal je Sekunde und `requestVideoFrameCallback` gar nicht. Messungen laufen scheinbar ewig.
  Zum Messen die Scheibe nach vorn holen — die eigene, nie Jörgs.
- **Der Horcher nach der Quelle.** `v.src = …` vor `addEventListener('canplaythrough', …)` hängt
  beim zweiten Laden für immer, weil das Ereignis aus dem Vorrat schon gefeuert hat. Erst horchen,
  dann laden, und `readyState` zusätzlich abfragen.

- **Der Prüfstand hat einen eigenen Rauschboden.** `labor/nahtpruefung/naht.mjs` liefert **zwischen**
  Läufen nicht immer dasselbe Bild, obwohl es **innerhalb** eines Laufs voll deterministisch ist
  (11 Läufe, 396 Fallmessungen, kein einziger nicht-deterministischer Fall). Gemessen am 17.09.2026,
  gleicher Code gegen gleichen Code: **je Lauf kann ein beliebiger Titel in eine zweite, ebenso
  stabile Variante fallen** — und dann Rezept *und* Kontrollfall zugleich, also auch dort, wo gar kein
  Effekt läuft. Abweichung 0,18 bis 0,33 im Mittel, 1,7 bis 7,7 von 255 im Größten.
  Zwei Irrtümer, die ich selbst zuerst hatte: Es ist **nicht** auf den kalten Erstlauf beschränkt, und
  es trifft **nicht** bestimmte Titel (die Vermutung „nur die mit breiterem als hohem Titelbild" hat
  die größere Messreihe widerlegt). Wer eine Änderung gegen einen einzelnen Vorlauf misst, hält diesen
  Boden für sein Ergebnis. **Jede Fassung mindestens dreimal messen, und einen Fall nur dann
  „abweichend" nennen, wenn er in allen Paarungen abweicht.**

- **Restfarbe in der verbotenen Zone — zwei Ursachen, und die kleinere hatte ich zuerst genannt.**
  Am 16.09.2026 standen bei den Lichtkreisen noch **2,13 %** der gemalten Fläche in der verbotenen
  Zone. Ich hatte das dem groben Raster zugeschrieben. Nachgerechnet am 17.09.2026 ist die Hauptursache
  eine andere: **der geprüfte Körper ist kleiner als der gemalte.** `zSperre` fragt einen Ring vom
  Radius `sz·ZKOERPER` ab, bei Bokeh also `sz·2,2` — gemalt wird aber `sz·2,2·rel` mit `rel` bis 2,65,
  also bis `sz·5,83`. Dasselbe gilt für Konfetti (Diagonale bis `sz·1,4` gegen `ZKOERPER` 1,2),
  Glitzer (Arme bis `sz·3,7` gegen 2,2) und den Schmetterling, dessen Knick sogar **hinter** der
  Zonenprüfung sitzt und den gemalten Ort um bis zu `sz·2,4` verschiebt. Das ist ein Fehler und wird
  behoben, keine Grenze.
  Die **Rastergrenze ist echt, aber die kleinere**: Der Maler fragt die Tiefe auf dem 160-Punkt-Raster
  von `tiefeProben` (eine Zelle ist bei 898 px Studiobreite rund 5,6 px breit) und entscheidet sie als
  Ganzes. Läuft die Trennkante schräg durch eine Zelle, fällt sie für die ganze Zelle auf eine Seite.
  Enger geht es nicht, ohne je Teilchen ins Bild zu lesen — und genau das darf der Maler nicht.
  Bei den Lichtkreisen ist der Überstand übrigens teilweise **richtig**: eine Unschärfe läuft über
  Kanten hinaus, das ist ihr Wesen. Der Ringtest selbst wirkt: ohne ihn standen bei 120 Vögeln noch
  62 Bildpunkte Farbe in der verbotenen Zone, mit ihm null.

Und eine Falle im Aufbau: fehlt dem Prüfstand der Verweis auf `web/fremd`, findet der Shader sein
Rauschen nicht, das Studio fällt still auf den Leinwand-Nebel zurück, und man misst tagelang den
falschen Maler. `bin/effektclip-labor.js daten` legt den Verweis darum immer mit an.

---

## Grundlinie

Der volle Satz Zahlen liegt in `labor/effektclip-studio/messreihe-2026-09-10.json` und ist zum
Vergleichen da: fällt ein Wert bei einem späteren Lauf auf null, ist unterwegs etwas kaputtgegangen.
Die Eckwerte:

| Effekt | an/aus | stärkster Regler | Anmerkung |
|---|---|---|---|
| Zoom schlägt | 44,2 | Wucht 54,0 | |
| Fahrt | 51,2 | Ausschnitt 59,8 | |
| Bildlauf | 76,2 | Tempo 77,5 | der wuchtigste Effekt im Vorrat |
| Linse | 45,8 | Wölbung 88,2 | |
| Stroboskop | 44,9 | Stärke 148,9 | Stärke misst über 100, weil sie hell und dunkel spannt |
| Farbschleier | 31,3 | Stärke 78,4 | |
| Kippen schlägt | 32,9 | Neigung 46,6 | |
| Verwackeln | 26,9 | Amplitude 38,4 | |
| Beschlag | 19,8 | Stärke 33,0 | |
| Wellen | 19,0 | Amplitude 34,5 | |
| Spiegelung | 18,3 | Horizont 41,8 | |
| Sättigung schlägt | 16,4 | Sättigung 38,4 | |
| Scanlines | 16,3 | Linien 23,0 | |
| Kaustik | 16,0 | Schärfe 24,2 | |
| Helligkeit schlägt | 13,6 | Wucht 27,0 | |
| Farbkanal-Puls | 13,5 | Versatz 30,0 | |
| Theaternebel | 12,4 | Grundlicht 44,8 | im Strahl 88,5 — siehe Regel 6 |
| Flammen | 12,2 | Höhe 20,9 | |
| Kontrast schlägt | 11,7 | Tonwert 45,1 | |
| Nachzieheffekt | 11,6 | Stärke 22,8 | |
| Laufstreifen | 10,4 | Breite 34,0 | |
| Farbton schlägt | 9,1 | Winkel-Mitte 25,0 | |
| Schatten | 8,7 | Größe 61,9 | |
| Feuer | 7,8 | Dichte 19,8 | |
| Schärfe schlägt | 7,7 | Weichheit 10,4 | |
| Scheinwerfer | 7,7 | Größe 54,2 | |
| Lichtstrahlen | 6,6 | Breite 20,8 | |
| Filmkorn | 3,1 | Stärke 5,9 | leise, das ist der Zweck |
| Partikel | 1,6 | Größe 10,3 | punktuell |
| Laserstrahl | 1,3 | Strahlen 4,8 | punktuell, im Nebel 88,5 |
| Risse | 1,0 | Breite 1,9 | punktuell, höchster Punkt 140 |
| Rauschausfall | 0,8 | Körnung 3,5 | |
| Tropfen | 0,4 | Größe 2,4 | punktuell, höchster Punkt 197 |
| Einschlag | 0,1 | Größe 1,2 | punktuell, höchster Punkt 126 |
| Sicherungswackeln | 0 | im Zeitlauf 43,5 | Ereignis |
| Glitch-Blöcke | 0 | im Zeitlauf 2,5 | Ereignis |

---

## Was daraus schon geändert wurde

Die vollständige Liste der 20 behobenen Fehler und der 13 Nachbesserungen steht in
`docs/NAECHSTER_CHAT.md` unter „Tiefen-Check aller Effekte" und „Korrigiert und konsolidiert".
Die Stärke-Regel steht zusätzlich im Kopf des Moduls, in `docs/handbuch/WOERTER.md` unter
„die Stärke" und als Hinweistext an jedem Stärke-Regler.
