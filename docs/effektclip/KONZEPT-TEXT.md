# Konzept: Text über dem Bild — Titel und Karaoke

Stand 25.09.2026. Die Entscheidungen von Caspar_D zu den beiden Texteffekten des Effektclip-Studios,
gesammelt aus den Übergaben §19–§24, damit sie nicht nur im Code stehen. Was hier steht, gilt; wer
etwas anderes baut, ändert erst dieses Blatt.

## 1. Die beiden Effekte

**Titel** (`titel`): ein stehender Text — der Songtitel, ein Name, eine Zeile. Steht die ganze Zeit
und ist darum von selbst loopfest. Freier Text im mehrzeiligen Feld, Enter oder `|` bricht um; leer
heißt der Titel des Songs. Grotesk oder Serife, fett oder normal, Größe als Anteil der kurzen
Bildseite, Farbe aus dem Titelbild oder eigene, Kontur und Schatten, Ort X/Y als Textkasten,
Ausrichtung der Zeilen zueinander, freie Verrechnung. Ein zu breiter Titel bricht um (höchstens drei
Reihen) oder weicht in der Größe. Emoji bekommen nur die Füllung.

**Karaoke** (`karaoke`): die gesungene Zeile aus der **bereinigten Lyrik** (`library/lyrik.json`,
`/api/lyrik`), zeilenweise — die Lyrik hat Zeilen-, keine Wortzeiten. Die Vorgaben sind das Band der
Bühne (`#bkaraoke`): drei Zeilen, die mittlere dran, 5,2 % der Bildbreite fett, Nachbarn halb so groß
und halb so hell, 74 % Zeilenbreite, Band als schwarzer Verlauf, Farben aus der Titelbild-Palette,
Zeilenwechsel als harter Schnitt, kein Vorlauf. Regler: Zeilen (drei oder nur die gesungene),
Schrift, Größe, Band, Farbquelle, Ort Y, Ausrichtung, Vorlauf.

## 2. Entscheidungen (mit Datum)

| Entscheidung | Wortlaut Caspar_D | Datum |
|---|---|---|
| Karaoke nur im vollen Export; im Zehnsekünder und in der Loop-Ansicht wird er **weggelassen** | „Karaoke macht nur Sinn bei vollem Export, also 10 Sek mit Karaoke geht nicht, es wird der Effekt einfach weggelassen" | 24.09. |
| Quelle ist die bereinigte Lyrik, nicht Whisper roh, nicht Suno | „die bereinigte Lyrics wäre die beste Variante" | 24.09. |
| Vorgaben vom Band der Bühne | „take the presets from the stage" | 24.09. |
| **Kein Zeitversatz** je System im Effekt; Vorlauf bleibt als Gestaltung | „jedes System ist anders, ich habe nichts von einem Film, wo die Untertitel nur auf einem System synchron laufen" | 24.09. |
| Das Band hat zwei Seiten, wenn es frei im Bild steht | „einseitiger Gradient macht keinen Sinn, wenn ich es nach oben schiebe" | 24.09. |
| Die Bühne lässt ihr Band weichen, wenn der Effektclip die Zeile malt | „vielleicht sollte die Bühne erkennen, wenn der Effekt an ist" | 24.09. |
| Ruhezustand: wer nicht singt, ist nicht dran — Effekt **und** Bühne | „die Bühne kriegt die gleiche neue Regel" | 25.09. |
| Die Kette entscheidet über und unter dem Text; neue Textkarten kommen ans Ende | „Konfetti darf auch mal vor dem Text fallen, aber beim Einfügen liegt der Text immer erstmal an letzter Position" | 25.09. |
| Zierzeichen und Emoji gehören nicht auf die Karaokebühne (Band und bereinigte Lyrik); der Titel behält Emoji | „bin noch nicht überzeugt, ob Zierzeichen in die Karaokebühne gehören" — „ja, will ich so" | 25.09. |
| Regieanweisungen fliegen an der Quelle, in der Bereinigung, nicht im Maler | „das sollte in der bereinigten Lyrics nicht passieren, ist ja bereinigt um sowas" | 25.09. |
| Titel-Material als **Struktur × Farbe**: wenige feste Strukturen, eine Farbe darüber, keine freien Parameter | „der Schrifttextur-Kram ist eher ernüchternd, wenn, dann einige vorgefertigte Struktureffekte, denen man noch eine oder x Farben draufpackt. Kombinatorisch entsteht dann Vielfalt, ohne dass der Nutzer unästhetische Parametersets bauen kann" — „ich denke, das passt so, mach" | 25.09. |
| **Auftritt und Abgang** des Titels nur im ganzen Titel; im Zehnsekünder steht er | „das würde aber wie bei Karaoke nur für den Ganztitel-Export taugen, beim 10-Sekunden-Snippet würde das ja alle 10 Sekunden wieder passieren" | 25.09. |
| Der Titel darf sich **aus den Partikeln** zusammenballen und wieder auflösen, wenn ein Partikel-Effekt in der Kette liegt | „wenn man Partikel angewendet hat, dann könnte sich der Titel auch daraus zusammenballen und sich wieder auflösen" — „ich denke, das passt so, mach" | 25.09. |

## 3. Die Regeln, die daraus folgen

1. **Stufe nach Lage in der Kette.** Text sitzt am Objektiv (zoomt nicht mit, über allem), solange
   kein Szenen-Effekt nach ihm in der Kette steht. Folgt einer (Partikel, Feuer, Nebel …), rückt
   der Text in die Szene vor diesen Effekt und fährt mit der Kamera; die Karte sagt es
   (`textStufeHinweis`), der Chip zeigt „Szene" oder „Film". Die Marke auf der Bühne gibt es nur am
   Objektiv.
2. **Ruhezustand.** Eine Zeile gilt bis `bis` plus 1,5 s Nachhall oder bis zur nächsten, wenn die
   Lücke unter 3 s liegt. Danach rückt sie leise nach oben, die kommende steht leise in der Mitte;
   vor der ersten Zeile ebenso; nach der letzten geht das Band aus. Zeilen ohne Standzeit bekommen
   1,9 s. Bei „nur die gesungene" steht in Pausen nichts. Gilt im Effekt (`malen`, Zweig `karaoke`)
   und im Band der Bühne (`karaokeTakt`).
3. **Fester Anker.** Die Mitte der gesungenen Zeile steht fest; davor und danach wachsen nach oben
   und unten, das Band folgt; am Rand wird geklammert (erst nach oben, dann nur so weit zurück, wie
   unten Platz ist).
4. **Einpassen statt Abschneiden.** Umbruch an Leerzeichen, dann an Bindestrichen, dann
   zeichenweise (japanisch); passt es dann nicht, weicht die Schrift. Kein Regler.
5. **Ohne Band Kontur und Schatten**, aus dem Band gerechnet (Band 1 nichts, Band 0 die
   Titelwerte).
6. **Echte Uhr im Haus.** Kachel und Bühne malen die Karaoke-Zeile nur, wenn der Titel im Player
   liegt — laufend oder pausiert; ein pausierter Film steht. Liegt ein anderer Titel im Player,
   malt der Effekt keine Zeile und das Bühnenband bleibt. Im Pult läuft die freie Uhr als Vorschau,
   die Karte sagt es.
7. **Der volle Export wartet** auf Schriften (`schriftenBereit`) und Lyrik (`lyrikBereit`), friert
   die Zeilen ins Bündel (`DATA.lyrik`) und bricht ohne Lyrik mit Grund ab statt stumm ohne Zeile zu
   laufen.
8. **Die Karte sagt die Güte der Zeiten** (Deckung, geschätzte und gestrichene Zeilen), den Grund,
   wenn es keine Zeile gibt (Instrumental, zurückgestellt, nie gerechnet, nicht geladen), den Loop-
   Fall und den stehenden Player. Die Kostenzeile warnt vor dem Abbruch.
9. **Schrift.** Inter (Grotesk) und Gelasio (Serife, metrisch wie Georgia), SIL OFL, in `web/fonts`
   — derselbe Film auf Mac, Windows und Bühne; Laufweite −0,01 em wie das Band.
10. **Hochformat.** Reels, TikTok und Shorts verdecken unten rund ein Fünftel; die Karte sagt es,
    sobald die Ausgabe hochkant ist und der Ort dort liegt. Kein Regler.
11. **Struktur × Farbe.** Der Titel kann Metall, Stein, Papier oder Schraffur tragen. Die Struktur
    trägt das Licht (Rampe, Korn, Kontrast, Licht von oben wie der Schlagschatten), die Farbe den
    Ton: Metall mit warmem Ton ist Gold, mit kühlem Silber, mit blasser Palettenfarbe Chrom. Alles
    gerechnet, nichts als Bild im Paket: Ganzzahl-Hash statt Zufall, in em der Schrift, Kachel
    4 em × 1,24 em und in x nahtlos, je Zeile am Zeilenrand verankert — Studio und Export bitgleich,
    360 und 1080 gleich. Das Licht rechnet in RGB (Abdunkeln = Multiplizieren, Aufhellen = Mischen
    nach Weiß), damit Blass blass bleibt; auf heller Farbe sind Adern und Striche dunkler, auf
    dunkler heller. Kein Regler außer der Wahl; die Dosis liegt im Haus.
12. **Auftritt und Abgang.** Der Titel kann kommen und gehen — nur im ganzen Titel (LOOP 0), in
    Kachel und Bühne nur mit echter Uhr; sonst steht er wie immer, loopfest von selbst. Die Zeiten
    kommen aus der Musik: herein über einen Schlag ab Songanfang, stehen, fort über drei Viertel
    Schlag, so dass der Abgang einen Schlag vor der ersten Zeile der bereinigten Lyrik endet,
    frühestens zwei Takte nach dem Auftritt; setzt der Gesang früher ein, bleibt er vier Takte über
    dem Gesang; ohne Lyrik geht er nach vier Takten. Eine Bewegung je Auftritt (erscheinen,
    aufsteigen, scharfstellen, Laufweite, Vorhang), Einsatz weich aus, Abgang weich ein und kürzer,
    nichts überschwingt — Regler nur für die Wahl. Im Pult mit freier Uhr wiederholt sich Kommen,
    Stehen, Gehen mit einem Schlag Abwesenheit, damit der Gestalter es sieht. Der volle Export
    wartet für ihn mit auf die Lyrik, bricht ohne sie aber nicht ab.
13. **Aus den Partikeln.** Die sechste Wahl des Auftritts: der Titel ballt sich über zwei Takte
    aus Teilchen zusammen und löst sich über zwei Takte in Windrichtung auf. Der Titel malt eigene
    Teilchen — Art, Farbe (`partikelSatz`), Größe, Wind und Schwere vom ersten aktiven
    Partikel-Effekt der Kette, ohne Griff in dessen Zustand und unabhängig von dessen Lage in der
    Kette. Nur Arten, die sich zu Schrift ballen: Asche, Staub, Funken, Glitzer, Schnee, Pusteblume,
    Glühwürmchen; fehlt der Effekt, steht der Titel und die Karte sagt es. Die Schrift wird einmal
    abgetastet (Raster 0,09 em, höchstens 4000 Punkte); jedes Teilchen kommt zu seiner Zeit von der
    Seite, aus der der Strom der Art käme, mit Bogen quer; die Füllung übernimmt im letzten Drittel
    und geht beim Auflösen im ersten. Fest, weil sonst billig: gleichförmige Teilchen, gleichzeitige
    Ankunft, ein Text, der hart aufspringt.

## 4. Gemeinsames Handwerk im Code

`textSchrift`, `textUmbrechen`, `textLaeufe` (Emoji-Läufe), `textDreipass` (Schatten, Kontur,
Füllung; die Füllung wahlweise aus `textStrukturKachel` mit `stHash`/`stWert`/`stFbm` und
`farbeRGB`), `schriftenBereit`, `hochformatNotiz`, `titelHinweis`, `textStufeHinweis`; der Lader
`lyrikVon`/`lyrikStand`/`lyrikHinweis`/`lyrikGemeldet`/`lyrikBereit` nach dem Muster der Tiefenkarte;
der Auftritt `titelAuftritt`/`taktSchlaege`/`titelAuftrittZeiten`/`titelAuftrittLage`/`auftrittNotiz`/
`auftrittHinweis`, die Teilchen `titelPartikelQuelle`/`titelZiele`/`titelGlyph`/`titelTeilchen`; die Marke `tiKarteEffekt`/`tiMarkeSetzen`/`tiMarkenMalen`; die Auskunft `clipMalt` und das Ereignis
`effektclip` für die Bühne. Registry-Einträge dürfen `hinweis(e)` tragen (grau mit Grund auf der
Karte). Der Prüfstand bekommt die Lyrik der Prüftitel als `_lyrik.json` (`node
bin/effektclip-labor.js lyrik`) und die Schriften per Verweis.

## 5. Bewusst nicht gebaut

Wort-Wischen (bräuchte Wortzeiten in der bereinigten Lyrik), Überblenden beim Zeilenwechsel,
weitere Schriften, ein Balken hinter dem Titel; Auftritt und Abgang (Regel 12) und das
Zusammenballen aus Partikeln (Regel 13) sind seit dem 25.09. gebaut. Siehe Backlog „Titel über dem
Bild".

## 6. Wiedervorlage

Einen ganzen Titel mit dem Preset „Lyric-Video" ausgeben und ansehen: Schrift, Ruhezustand, fester
Anker, Hochformat-Zonen, Sitz der Zeile zum Gesang über die ganze Länge (Übergabe §23,
Wiedervorlage 22).
