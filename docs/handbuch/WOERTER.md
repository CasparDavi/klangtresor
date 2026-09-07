# Die Wortliste des Handbuchs

Verbindlich für alle Kapitel. Wer ein Wort ändert, ändert es hier zuerst.

> Caspar_D, 07.09.2026: „stringent deutsch".

---

## Die Grundregel

**Was auf dem Knopf steht, steht auch im Handbuch.** Ein Handbuch, das
den Bereich anders nennt als die Oberfläche, schickt den Leser auf die
Suche nach etwas, das es nicht gibt. Wo ein Wort in der Oberfläche
schlecht ist, wird die **Oberfläche geändert** — nicht das Handbuch
danebengesetzt.

Zweite Regel: **Ein Ding, ein Wort.** Nicht abwechselnd „Lied", „Song",
„Stück" und „Track", weil es sich sonst wiederholt. Wiederholung ist in
einer Anleitung kein Fehler, sondern die Bedingung dafür, dass man ihr
folgen kann.

---

## Die Bereiche

| im Handbuch | Beschriftung in der App | Anmerkung |
|---|---|---|
| **die Übersicht mit den Werken** | `Werke` | im Fließtext ausgeschrieben; „die Werke-Übersicht" als Kurzform ist erlaubt, „die Werke" allein nicht |
| **die Alben** | `Alben` | Sunos „Playlists" heißen hier Alben. Beim ersten Auftreten einmal erklären, danach nur noch „Album" |
| **der Klangraum** | `Klangraum` | |
| **der Geschichten-Raum** | — | die zweite Sicht desselben Registers |
| **mein Autorenprofil** | `Meine Daten` · `Meine Community` | *offen:* deckt „Autorenprofil" beide Reiter ab, oder nur den ersten? Wenn beide, sollte die App mitziehen |
| **die Bühne** | — | die Karaoke-Ansicht mit mitlaufendem Text |
| **das Karteiblatt** | — | die ganze Ansicht zu einem Titel: Lyrics, Stil-Prompt, Urheber, Nachbarschaft, Community, Entwicklung |
| **die Titel-Messdaten** | — | das Messmodul darin (Wellenform, Spektrogramm, Lautheit). Löst „Analyzer" ab: der Name versprach Interaktivität, dabei schaut man nur. „Analyzer" stand ohnehin nie in der Oberfläche, nur in Kommentaren |
| **das Tonstudio** | `KlangTresor Tonstudio` | |
| **das Einmessen** | `Einmessen` | |
| **der Morgenlauf** | — | die tägliche Auffrischung |

---

## Das wichtigste Wort: der Titel

**Ein Stück Musik heißt „Titel".** Nicht Lied, nicht Song, nicht Track,
nicht Werk, nicht Stück.

Caspar_D hat das am 07.09.2026 durchgespielt: *„eigentlich ist es Werk,
aber das ist zu abgehoben. Track ist das einzige, was Instrumentalstücke
einschließt. Stück ginge noch, klingt aber bemüht."* Entschieden wurde
**Titel** — Branchensprache, deutsch, und es schließt die 64
Instrumentalstücke des Bestands ein, für die „Lied" falsch wäre.

Die Doppeldeutigkeit ist ausdrücklich zugelassen: *„Name des Titels geht,
kein Problem."* Wo der Name gemeint ist, heißt es **„der Name des
Titels"** — nie „der Titel des Titels".

So wird es benutzt:

- „323 Titel", „ein Titel läuft", „der kürzeste Titel im Bestand"
- „der Name des Titels", „die Titelliste"
- **Werk** bleibt für den Bestand als Ganzes: „die Übersicht mit den
  Werken", „dein Werk". Nie für ein einzelnes Stück.
- **Lied** nur dort, wo der Gesang die Sache ist — etwa im Kapitel über
  die Bühne und den mitlaufenden Text.

Und der Kniff, der die Frage kleiner macht, als sie aussieht: **ein
Handbuch braucht das Wort seltener, als man denkt.** Nicht „klick auf
einen Stern, und der Titel wird abgespielt", sondern „klick auf einen
Stern, und du hörst ihn".

---

## Die Dinge

| statt | im Handbuch | warum |
|---|---|---|
| Player, Player-Leiste | **die Abspiel-Leiste** | Caspar_D, 07.09.2026 |
| Visualizer | **der Visualisierer** | Caspar_D, 07.09.2026 |
| Track, Song, Lied, Stück | **der Titel** | siehe oben. „Song" nur, wo von Sunos Oberfläche die Rede ist |
| Playlist | **das Album** | „Playlist" nur im Zusammenhang mit Suno |
| Stems | **die Instrumentspuren** | Fachwort einmal in Klammern beim ersten Auftreten |
| Preset | **die Vorlage** | man nimmt eine Vorlage und passt sie an — „Standardeinstellung" wäre lang und falsch, das Ding ist kein Standard. „Klangvorbild" bleibt für den Referenztitel |
| Panel | **das Feld** oder **das Fenster** | je nachdem, was es ist — nie beide für dasselbe |
| Tab | **die Registerlasche** | so heißt es im Quelltext schon |
| Slider | **der Regler** | so heißt es in der App schon |
| Screenshot | **die Abbildung** | in Bildunterschriften; „Bildschirmfoto", wo es um das Aufnehmen geht |
| Layout | **der Aufbau** | |
| Cache | **der Zwischenspeicher** | |
| Feature | **die Funktion** | meist besser ganz umschreiben |
| Update | **die Auffrischung** | bei Daten; **die neue Fassung** bei Software |
| Import | **das Einlesen** | |
| Export | **die Ausgabe** | „exportieren" bleibt als Tätigkeit erlaubt |

---

## Was bleibt

Fachbegriffe der Tontechnik sind im Deutschen etabliert und werden nicht
eingedeutscht — eine erfundene Übersetzung wäre schwerer verständlich als
das Fachwort:

**Equalizer · Kompressor · Limiter · Chroma · Spektrogramm · Stereo ·
Peak · Loudness** (in Zusammensetzungen wie *Loudness-Kurve*) **· Filter**
(deutsches Fachwort in der Audiotechnik)

Ebenso Eigennamen: **Suno · Whisper · Butterchurn · MilkDrop · EBU R128**

---

## Was nie im Handbuch steht

Entwicklersprache. Sie darf in `docs/` stehen, aber nicht im Handbuch:

Repo · Commit · Frontend · Backend · Endpunkt · API · JSON · Ablage ·
Vorrechner · Morgen-Schritt (im Handbuch: „der Morgenlauf holt …")

Wo eine technische Sache erklärt werden muss, wird sie benannt, ohne den
Fachausdruck zu benutzen: nicht „der Endpunkt `/api/karte` liefert", sondern
„KlangTresor holt die Karte aus der eigenen Ablage".

---

## Drei Stellen, an denen die App nachziehen müsste

Gefunden am 07.09.2026 beim Durchsuchen des sichtbaren Textes. Mehr sind
es nicht — die Oberfläche ist bereits durchgehend deutsch:

1. **„Preset"** in der Erklärung zum Klangvorbild (`web/index.html`,
   Tonstudio) → „Vorlage"
2. **„Filter"** und **„Filter zurücksetzen"** als Beschriftung → bleibt.
   Filter ist im Deutschen ein gebräuchliches Wort, und „Sieb" wäre
   albern. Hier gilt die Ausnahme.

---

## Anrede und Ton

- **Du**, durchgehend. Kein „man", wo „du" gemeint ist.
- **Zahlen mit Dezimalkomma**, deutsche Anführungszeichen „so".
- **Neue Rechtschreibung** — „muss", „dass", „Messdaten". Der Bestand
  mischt heute (App: 87× „muss" gegen 26× „muß"; Doku: 136× „dass" gegen
  38× „daß"), das Handbuch tut es nicht. Grund ist nicht das Prinzip,
  sondern dass die neue Schreibung ohnehin überwiegt und ein fremder
  Leser über die Mischung stolpert.
- Keine Ausrufezeichen. Keine Beteuerungen („ganz einfach", „im Nu").
- Was nicht geht, steht genauso da wie das, was geht. Ein Handbuch, das
  nur Erfolge kennt, lässt den Leser bei der ersten Hürde allein.
