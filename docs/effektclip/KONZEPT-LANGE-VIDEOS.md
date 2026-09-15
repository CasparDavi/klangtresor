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
