# Konzept: längere Videos und die Stufe „Schleife schließen"

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
