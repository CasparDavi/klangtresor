# Konzept: längere Videos und die Stufe „Effektclip als Schleife" (bis 15.09.2026 „Schleife schließen")

Stand 15.09.2026. Entscheidungen von Caspar_D im Gespräch, gesammelt, **bevor** gebaut wird. Anlass
ist die Lehre vom 11.09.2026: Der „Lauf" (Zeit beugen, Pendel, Stottern) wuchs an einem Abend über sechs
Umbauten und wurde am Morgen wieder ausgebaut — *„wir brauchen ein Konzept, so vibe mässig wird das
nix"*. Seine sechs offenen Fragen (NAECHSTER_CHAT, „Der Lauf ist wieder ausgebaut") sind hier die
Tagesordnung. Hintergrund: `VIDEO-PLAN.md` §2, §5–§7, `VIDEOSTUDIO-RECHERCHE.md`,
`labor/videonaht/statistik.md`.

## Das Studio hat vier Stufen

Quelle → Vorbereitung → Effekte → **Schleife schließen** (Caspar_D: *„dann muss es noch den
Videoloop-Verbinden Part geben am Ende"*; Name: *„Schleife schließen"*). Die vierte Stufe trägt die
Taktlage („sitzt auf X % des Lieds"), die 10-s-Loop-Ansicht und später Nahtsuche und Übergänge.
Zukunftsvision: *„dann ist es nicht mehr weit, verschiedene Videos zusammenzusetzen"*.

Seit dem Akkordeon (15.09.2026, Abschnitt unten) heißt die vierte Stufe **„Effektclip als Schleife"**; im Code steht
der Name nur in `LOOP_STUFE`. Die Taufnotiz steht in `docs/haus/HAUSREGELN.md`. Ältere Abschnitte hier behalten den
alten Namen, weil sie datiert sind.

## Die sechs Fragen vom 11.09. — beantwortet am 15.09.2026

| # | Frage | Antwort Caspar_D | Folge |
|---|---|---|---|
| 1 | **Was ist die Einheit?** | *„der Takt, auf Takte oder Vielfache davon legt man Videosnippets, die ggf. adaptiv gekürzt, verlängert oder gecroppt werden"* | Die Zeitleiste ist in **Takten** geteilt. Ein Snippet belegt ganze Takte; passt es nicht, wird es **adaptiv** angepasst (Zeitumbildung nach Bildänderung, siehe unten) oder beschnitten — nicht die Musik. |
| 2 | **Was darf springen?** | *„springen darf es nur, wenn der Musikstil das hergibt"* | Harte Schnitte, Stottern und Rückwärtssprünge sind eine **Stilfrage**, keine Grundeinstellung. Offen: woran der Stil erkannt wird (Genre aus dem Katalog, Tempo, Dichte) — bis dahin von Hand. |
| 3 | **Was schließt einen Teil ab?** | *„ja genau"* (Loop: die Naht; langes Video: der Übergang an der Abschnittsgrenze) | Loop und Abschnittswechsel sind derselbe Mechanismus (§6: der Loop ist der Spezialfall mit einer Naht). |
| 4 | **Folgen die Effekte der gebogenen Zeit?** | *„wahrscheinlich nicht"* | Wird ein Video rückwärts, im Pendel oder adaptiv gedehnt abgespielt, laufen die Effekte weiter auf **Liedzeit**. Nur das Bewegtbild bekommt die gebogene Zeit. (Am 11.09. folgte beides — das ist damit umgekehrt.) |
| 5 | **Wo hört es auf?** | *„es darf durchaus eines [ein Schnittprogramm] werden, es muss nur bedienbar sein"* | Keine künstliche Grenze. Maßstab ist Bedienbarkeit, nicht Funktionsumfang. |
| 6 | **Sichern** | *„verstehe ich nicht, alles natürlich, oder liegt hier ein Missverständnis vor"* | Missverständnis geklärt: Am 11.09. landete die gebaute Folge **nie im Rezept** und ging beim Neuladen verloren — daher die Frage. Antwort: **alles** gehört ins Rezept (Zeitleiste, Snippets, Übergänge, Zeitumbildung). |

## Bewegtbild: Pendel, Rücklauf, Übergänge — was die Muster gezeigt haben

Muster in `labor/videonaht/uebergaenge/` (Werkzeuge in `arbeit/`), am 15.09.2026 angesehen:

- **Pendel:** Caspar_D bevorzugt **adaptiv + asymmetrisch** (Hinweg nach Bildänderung beschleunigt,
  Rückweg schneller). Technischer Vermerk des Prüfers: in dieser Fassung stößt der Rückweg an den ×4-Deckel
  und der Hinweg stockt kurz bei ×1,1 — beim Einbau Rückweg länger oder Deckel ×5, untere Klemme ×1,25.
- **Pendel-Regel** (ersetzt „Pendel nie bei Mikrohandlung", §2): *„falls man automatisch bestimmen kann,
  was Mikrohandlung und was echtes lebendes Foto ist, dann nur bei lebendem Foto ohne kausale Effekte"*.
  Pendel also nur, wo die Handlung umkehrbar ist (Verwandlung, Atmen, Licht) — nicht bei Fallen, Gehen,
  Zerbrechen. Die automatische Erkennung ist offen.
- **Rücklauf als Übergang:** Für Glut und Eis wirkt **schneller Rücklauf mit massiver Unschärfe (8 % der
  Bildbreite)** am besten — besser als Blende und besser als der Rückmorph über optischen Fluss.
  **Entschieden 15.09.2026** nach dem RIFE-Vergleich (`glut-rife.mp4`, Werkzeug `arbeit/rife-schleife.mjs`):
  *„gut, wir bleiben bei 8% Unschärfe und Rücklauf"*. RIFE (v4, 960 px, mit Randeinblendung, weil es die
  Endbilder nicht trifft) ist schärfer als der eigene Rückmorph, zeigt bei einem Posenwechsel in der
  Fenstermitte aber ~0,4 s Doppelbelichtung (Geisterbild-Anteil ~21 % in allen Varianten: Modelle v4/v4.6,
  360/960 px, UHD, Stützbilder, TTA). RIFE bleibt Werkzeug für **ähnliche** Anfangs- und Endbilder
  (kleine Bewegung, Zeitlupe, adaptives Pendel), nicht für Posenwechsel.
- **Blitz und Pixel** sind keine Vorgabe für gefilmtes Material (§6.7, Geschmacksurteil).

## Technik, die schon da war

- **Sprungkopie vom 11.09.2026** (Caspar_D: *„Sprungkopie vom Freitag würde ich vorschlagen, trotzdem der
  Code weg ist, müsste er im GitHub noch irgendwo restaurierbar sein"*): Server-Endpunkt `POST
  /api/sprungkopie` baut eine Arbeitskopie aus lauter Schlüsselbildern — 14,9 statt 124,6 ms je Sprung.
  Code in `git show a79575e` (server) und `da7310c` (Lauf im Studio), ausgebaut in `ee1fe0b`. Für
  bildgenaues Lesen, Pendel und Rücklauf wird er **wiederhergestellt**, statt eine Bibliothek zu holen
  (Mediabunny/mp4box.js aus der Recherche entfallen vorerst).
- Erprobt und wiederverwendbar aus dem Lauf: `t → f(t)` einmal oben in `zeichneFrame`, Pendel als Kosinus,
  weiche Tempoformen `1+(s−1)·sin²(πx)`, Rasterkanten im Index runden, Export auf Vielfache der Periode.

## Noch offen

1. Woran der **Musikstil** erkannt wird, der Sprünge erlaubt (Frage 2).
2. Automatische Trennung **lebendes Foto / Mikrohandlung** (Pendel-Regel).
3. Das **Datenmodell** der Zeitleiste im Rezept (Takte, Snippets mit Quelle/Ausschnitt/Zeitumbildung/Crop,
   Übergänge an Grenzen) — als Skizze vorlegen, bevor gebaut wird.

## Darstellung der Stufe „Schleife schließen" nach den Hausregeln (Vorschlag 15.09.2026, gebaut am selben Abend)

Caspar_D: *„schau mal die Hausregeln an, wie man die Schleife-Schließen Erstellung besser darstellt"*. Heute: eine
Zeile Lage, Dropdown, zwei −/+-Zähler, An/Aus-Knopf. Vorschlag aus `docs/haus/HAUSREGELN.md`:

1. **Eine Zeitleiste des Clips statt Zahlen** (Regel 1 „Punkte = Einstellung, Kurve = Ergebnis", „Alle Zeitspuren auf
   denselben Kanten", „Takt und Taktschlag sind zwei Dinge"): ein Balken über L Sekunden mit Schlagstrichen (Takt
   kräftig, Schlag fein), dem Vorwärtsteil und dem **Übergangsfenster als gedämpfte Fläche mit voller Kontur**; die
   **Kurve „Videobild über Clipzeit"** zeigt die adaptive Geschwindigkeit und den Rücklauf; in der Loop-Ansicht wandert
   ein Abspielstrich mit. Die Fensterkante lässt sich **ziehen** und rastet auf halbe Schläge — ersetzt den −/+-Zähler.
2. **Nichts darf lügen** (Regel 3): Was nicht gilt, wird grau statt versteckt — Übergangslänge beim harten Schnitt
   („0 s"), die ganze Auswahl beim Titelbild mit Grund.
3. **Pille statt An/Aus-Knopf** für „10-s-Loop ansehen" (Regel 18: an = 2 px Akzentrahmen, ID-scoped `.an`-Regel).
4. **Echtes Dropdown mit Gruppen** (Regel 19): *Bewegung* (Rücklauf, Pendel, Abbremsen) · *Neutralzustand*
   (Unschärfe, Blende, Kreuzzoom, Wisch, Schwarz, Weiß) · *für Grafik* (Blitz, Pixel); Tooltips erklären das Prinzip
   (Regel 22).
5. **Zweispaltig** (Regel 24): links Bedienung (Übergang, Schläge im Clip „von selbst"), rechts die Zeitleiste mit
   „sitzt auf X % des Lieds" darunter.
6. **Was es kostet, steht am Knopf**: Sprungkopie und Änderungskurve („misst das Video einmal, einige Sekunden") und die
   längere Ausgabezeit mit Video an „10 s ausgeben".
**Gebaut** (Caspar_D: *„jetzt hausregeln anschauen und die Schleife-Schließen Bedienelemente entsprechend anordnen"*):
Punkte 2–6 und die Zeitleiste aus Punkt 1 (`leisteMalen()` im Studio): schwarzer Datenbereich, Schlagstriche, Kurve
„Videobild über Clipzeit" als Fläche 0,3 mit aufgehellter Kontur, Übergang als Akzentfläche 0,45 mit Kontur, Abspielstrich
in der Loop-Ansicht. „von selbst" ist bei Länge und Schlagzahl eine Pille (Zustand). Die Wahl des Übergangs behält jetzt
Schlagzahl und Länge (vorher setzte sie beides zurück). **Nicht gebaut:** Fensterkante ziehen (die −/+-Zähler bleiben)
und kräftige Taktstriche — welcher Clipschlag die Eins ist, steht in der Taktlage nicht fest, also wird nichts behauptet.

## Das Pult als Akkordeon (15.09.2026)

Caspar_D hat die Darstellung aller vier Stufen neu entschieden. Die zweispaltige Schleifen-Stufe von oben ist damit
abgelöst.

- **Vier Stufen, immer nur eine offen:** Quelle · Vorbereitung · Effektkette · Effektclip als Schleife. Der Kopf ist
  eine einzige klickbare Zeile (Knopf mit `aria-expanded`, sichtbarer Tastaturfokus, `:active` 0,95). Klick auf einen
  zugeklappten Kopf öffnet diese Stufe und schließt die anderen; Klick auf den offenen Kopf schließt sie.
- **Der Kopf nennt den Stand** (Regel 3 und 10: auch Zugeklapptes wirkt):
  - Quelle: der Name der Quelle wie unter dem Vorschaubild.
  - Vorbereitung: „n Anpassungen aktiv" oder „keine Anpassung".
  - Effektkette: „n Effekte zugewiesen", dazu „· m an", wenn welche aus sind, und „· Solo: Name".
  - Schleife: Länge · Schläge, beim Video dazu der Übergang.
- **Oben in jeder offenen Stufe steht ein Erklärtext** im Wortlaut von Caspar_D (`STUFE_ERKLAER`). Er ersetzt die
  alten Untertitel.
- **Die Vorschau folgt der Stufe:**
  - Öffnet sich die Schleife, geht die 10-s-Ansicht an; jede andere Stufe schaltet sie aus. Während eines Exports
    wird nicht umgeschaltet. Die Pille „als 10-s-Clip zeigen" bleibt in der Stufe.
  - In der Vorbereitung zeigt **V halten** die Quelle ohne Effekte (nur die Vorbereitung wirkt). Das läuft über den
    Parameter `roh` von `zeichneFrame`, nie über `STAPEL`, sodass Export und Rezept es nicht sehen.
- **Die Schleife hat jetzt eine Spalte, in dieser Reihenfolge:** Erklärung, Lage, Pille, Schläge im Clip, Übergang an
  den Schleifenenden mit Prinzip, Länge des Übergangs, Zeitleiste.
- **Gemerkt wird die zuletzt geöffnete Stufe** (`mysuno-tbs-stufe`); beim ersten Mal ist es die Quelle.
- **Der eigene Klappschalter der Vorbereitung ist entfallen.** Ihr „Zurücksetzen" (vorher „Löschen", zur Unterscheidung vom „Löschen" des Effektclips im Fuß) liegt im Panel neben Auto-Niveaus.
- **Die Zeitleiste war nur ein schwarzer Streifen.** `leisteMalen()` las die Farben aus `$('#tbs')`, aber `root` ist
  selbst `#tbs`, also war das Ergebnis null. `getComputedStyle` warf deshalb gleich nach dem Schwarz. Jetzt liest sie
  aus `root` und malt neu, wenn die Stufe aufgeht.

## Stufe 1: der ganze Titel als Video (Entscheidungen Caspar_D, 16.09.2026, noch nicht gebaut)

Caspar_D: *„ich möchte beim video export nicht nur die 10sekunden version sondern auch die volle version mit
clipanpassung und ggf übergängen"* — als kleinste Ausbaustufe eines Plans, dessen letzte Stufe ein frei
komponiertes Voll-Titel-Video ist (Intervalle mit Mustern, Ereignisse an Grenzen; siehe unten „Stufe 2 und 3").

**Der Befund, der die Stufe klein macht:** Das lange Video ist nicht der große Bruder des 10-Sekünders, sondern
der von Kachel und Bühne — die malen das Rezept längst über die ganze Liedlänge, im echten Takt, auf Spielzeit.
Es fehlt das Mitschreiben. Und die schwerste Eigenschaft des 10-Sekünders fällt weg: **es gibt keine Naht**.

| Frage | Entscheidung |
|---|---|
| Wohin geht das Video? | *„das Video soll in alles möglichen gehen dürfen"* — Format frei, Vorgabe „wie die Quelle" |
| Ton | *„Ton optional dazu oder nicht, suno braucht ihn nicht"* |
| Karaoke | *„karaoke mit einbrennen oder nicht ist auch noch eine Option"* — Spurwahl wie auf der Bühne (v2/v3/Whisper/bereinigte Lyrik) |
| Dauer der Ausgabe | *„genauso lange wie der Song, ggf auch 2x so lange, dann aber im Queue"* |
| Abschnittsraster | *„da sunos abschnittsgrenzen meist nicht stimmen, lieber aus der Lyrics und Whisper und ggf Suno zusammen abgeleitet"* |
| Hook-Videos | *„sind ein Sonderfall, weil die auch nur einen Abschnitt des Songs abdecken können"* → Quelle mit eigenem Zeitfenster; außerhalb übernimmt die zweite Quelle |
| Hauszeichen | *„dezentes Hauszeichen"* |
| Bewegtbild auf Abschnittslänge | *„dehnen oder schrumpfen (nie mehr als 1/3) oder mehrmals loopen, ggf mitten drinnen auch adaptiv Geschwindigkeit ändern"* |
| Verlangsamung im Intro | *„du kannst die verlangsamung gleich mitdenken"* |

**Die Anpassungsregel, wie ich sie verstehe** (Abschnitt der Länge S, Bewegtbild der Länge D):
1. Durchläufe `n = max(1, round(S/D))`, je Durchgang also `S/n`.
2. Der Dehnfaktor `f = (S/n)/D` muss in **[2/3, 4/3]** liegen — höchstens ein Drittel gedehnt oder geschrumpft,
   also Tempo zwischen 0,75× und 1,5×. Passt er nicht, wird `n` angepasst, bis er passt.
3. Innerhalb eines Durchgangs darf die Geschwindigkeit **adaptiv** schwanken (Änderungskurve, „gleich viel
   Änderung je Zeit") — aber nur innerhalb derselben Schranke.
4. Bleibt `S < 2/3 · D` (Abschnitt kürzer als das geschrumpfte Bewegtbild), wird ein Ausschnitt genommen, nicht
   schneller gespult.
5. An jeder Wiederholungsnaht liegt ein Übergang aus der Schleifen-Stufe (harter Schnitt, Rücklauf, Pendel …).

**Verlangsamung und Drosseln** (Intro, ruhige Passagen): Die Videogeschwindigkeit bleibt an die Schranke aus (2)
gebunden; die **Stärke der Effekte** hat keine Schranke und darf in ruhigen Abschnitten weit herunter. Woran „ruhig"
erkannt wird, ist offen — Kandidaten: Abschnittsmarke aus dem Liedtext, Lautheit aus der Klanganalyse, Dichte der
Whisper-Wörter.

**Offen (wird gerade gemessen, 16.09.2026):** Tragfähigkeit des Abschnittsrasters über alle 325 Titel, Millisekunden
je Bild und der Weg zum Verpacken (Browser gegen ffmpeg), Warteschlange im Server statt im Tab, Karaoke-Einbrennen
als Zeichnung auf die Leinwand statt DOM/CSS, Formatmatrix je Quellenform.
