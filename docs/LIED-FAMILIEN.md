# Die Lied-Familien

**Stand: 07.09.2026, abends. Vorrechner gebaut, Oberfläche nicht.
Ein Netz-Modell für Kondensate ist recherchiert und verworfen.**

Welche Lieder sind dasselbe Lied in anderer Fassung? Übersetzung,
Neuaufnahme, v2, ClubMix, Cover. Der Katalog weiß es nicht: Sunos
Herkunftsfelder sind für diesen Bestand tot — 35 `upsample_clip_id`,
davon **null** im Archiv auflösbar; 98 `concat_history`, null auflösbar.

---

## 1. Wie die Idee ihren Zuschnitt bekam

Sie stand zuerst als Clou Nummer 5 in `docs/CLOUS.md`, mit einer
Chroma-Messung über 52.003 Paare und einer empfohlenen Schwelle. Drei
Einwürfe von Caspar_D haben daraus etwas anderes gemacht:

> „haben wir die Doppelsterne nicht schon im Klangraum — das deckt zwar
> nur eines ab, aber es ist ein Anfang"

Ja. `web/index.html:9904` zeichnet „Zwillinge" als gemeinsame längliche
Hülle, Klangabstand unter 0,17. Im ganzen Bestand ergibt das **acht**
Paare.

> „für den Geschichten-Raum hatten wir schon alle möglichen Liedfassungen
> zusammengeholt"

Auch das. `library/geschichten.json` hält je Lied einen
sprachübergreifenden Bedeutungsvektor, und `docs/eichkasten/` hält ein
Referenzset aus handgepflegten Playlists. Damit lagen **drei** gerechnete
Räume herum, und keiner war je nach Fassungen gefragt worden.

> „ich will eigentlich nicht den Klassifikator spielen, das System soll
> das können"

Das verwirft den Bau, den ich vorgeschlagen hatte — eine nach Abstand
geordnete Liste zum Abhaken. Gesucht war ein Kriterium ohne Schwelle und
ohne Pflege.

---

## 2. Das Verfahren

**Zwei Lieder gehören zusammen, wenn jedes das andere unter seinen zwei
ähnlichsten Partnern führt und mindestens zwei von drei Räumen das
unabhängig sagen.** Familien sind die Zusammenhangskomponenten dieser
Kanten.

| Raum | misst | Quelle |
|---|---|---|
| Text | Bedeutung des gesungenen Textes, sprachübergreifend | `library/geschichten.json`, 768 Dim. |
| Klang | Klangfarbe und Machart | `library/karte.json`, 1280 Dim., √(1−cos) |
| Harmonie | Akkordfolge | `library/analyse/<id>.bin`, Chroma, 30-s-Fenster |

Gerechnet von `bin/fassungen.js`, Ergebnis `library/fassungen.json`.

**Keine Schwelle.** Gegenseitige Nachbarschaft ist rein ordinal und
passt sich der örtlichen Dichte von selbst an. Was gesetzt ist, sind zwei
Aussagen über Lied-Familien, keine Stellschrauben: *eine Familie kann
mehr als zwei Mitglieder haben* (zwei Partner statt einer) und *ein Raum
darf ausfallen* (zwei Stimmen von drei).

**Warum zwei Partner und nicht einer.** Am 06.09.2026 kam „Glut und Eis —
Die Braut von Corinth" dazu und ergänzte die deutsche und die englische
Fassung von 2025. Mit nur dem besten Partner fällt es durch: die beiden
alten sind sich gegenseitig die nächsten (Harmonie 0,847), der Dritte
bleibt draußen. Ehrlich bleibt: bei einer **vierten** Fassung müsste die
Zahl mitwachsen. Sie steht im Skriptkopf und nicht in einem Regler.

**Nur Lieder mit Text.** Die 64 Instrumentals haben keinen
Geschichten-Vektor. Vor allem aber würden die Naturklang-Stücke Familien
bilden, die keine sind: *Waldesrauschen* und *Waldesrauschen* sind zwei
Aufnahmen desselben Motivs, nicht zwei Fassungen eines Liedes. Genau
daran ist die erste Messung dieses Tages gescheitert — sie fand 111
„belegte Paare", von denen die Hälfte gleichnamige Instrumentals waren.

---

## 3. Was dabei herauskommt

**43 Kanten, 35 Familien, 77 Lieder.** 28 Zweier-, 7 Dreierfamilien.
Rechenzeit 151 s auf zwölf Kernen, davon fast alles der Harmonie-Teil.

Gegen die Prüfliste des Eichkastens (35 belegte Paare) sind 25 belegt.
Von den 18 übrigen sind an den Titeln 13 zweifelsfrei echt — *Lichtpunkte
~ Points of Light*, *Reactor ~ Reaktor*, *Herr von Ribbeck ~ Sir
Ribbeck*, *Escher ~ Escher – English version*, *Universe 25 english ~
Universe 25*, *Tiefengestirne ~ Stars of the deep* und weitere. Fraglich
bleiben fünf, meist Serienmitglieder (*Ich atme dich – Track 2 ~ Ich
berühre dich – Track 4*) oder Stilnachbarn (*Pasta al Limone ~ Doppio
passo*).

**Rund 88 % Reinheit.** Im Nullmodell — gewürfelte Zuordnung bei
erhaltener Verteilungsform, 20 Ziehungen — trifft dasselbe Kriterium
**0,05 ± 0,22** Paare.

Caspar_D dazu: *„mein Eichkasten war nur das Werkzeug zu überprüfen, wie
gut das System das hinkriegt."* Genau so hat er sich verhalten — die
Prüfliste war der Engpass, nicht das Verfahren.

**Zum Vergleich, alle auf demselben Kandidatenraum:**

| Quelle | findet | gezogen | Reinheit |
|---|---|---|---|
| Doppelstern im Klangraum (Schwelle 0,17) | 3 von 35 | 8 | 38 % |
| Geschichten allein, ab Kosinus 0,95 | 11 von 35 | 13 | 85 % |
| Chroma allein, 30 s ab 0,82 | 10 von 35 | 20 | 50 % |
| **drei Räume, zwei Stimmen** | **25 von 35** | **43** | **≈ 88 %** |

Die Räume ergänzen einander, statt sich zu doppeln: 10 Paare findet nur
der Text, 5 nur die Harmonie, 5 beide.

---

## 4. Zwei Testfälle, die der Autor selbst gestellt hat

**„Glut und Eis — Die Braut von Corinth" (06.09.2026).** Ein Cover der
deutschen Fassung. Der Textraum fand es zunächst nicht (0,664 gegen die
deutsche Fassung), Klang (0,712) und Harmonie (0,702) schon.

Meine erste Deutung — „Neuvertonung, anderer Text" — war falsch, und
zwar zweifach. Caspar_D: *„der neue Text ist inhaltlich schon nah am
alten, nur wörtlich eben nicht, die Textübereinstimmungslinie müsste da
sein, aber weniger präsent."* Und: *„es ist in keinem Lied Befreiung, die
Braut von Corinth ist in allen Fällen Scheiterhaufen"* — ich hatte
„Zünd' sie selbst das Feuer an … Wir sind entfacht" als gutes Ende
gelesen, dabei ist es Goethes Ende.

Woran der niedrige Textwert wirklich lag, steht in Abschnitt 5.

**„Still you laugh" (04.09.2026).** Zeilengetreue Übersetzung von „Noch
lachst Du". Wird gefunden, zwei von drei Räumen einig.

---

## 5. Der Fund, der über das Verfahren hinausreicht

`bin/geschichten.js` bettet normalerweise die **zehn kondensierten
Substantive** ein (`quelle: 'kondensat'`); wo kein Kondensat vorliegt,
nimmt es den **Volltext**. Ein frisches Lied ist also Volltext, bis
jemand das Kondensat erzeugt. Beide Sorten liegen dann im selben Raum —
und sind nicht vergleichbar. Gemessen über 259 Lieder (257 Kondensat,
2 Volltext):

| | n | Median | p99 | max |
|---|---|---|---|---|
| Kondensat × Kondensat | 32.896 | 0,514 | 0,826 | 1,000 |
| **gemischt** | 514 | **0,370** | 0,637 | **0,703** |

Ein Volltext-Lied kann die Werte der Kondensat-Paare nicht einmal
erreichen — sein Maximum liegt unter deren p99. Auf der gemischten Skala
gelesen steht *Glut und Eis ~ Die Braut von Corinth* mit 0,664 beim
**98,8. Perzentil**. Die Linie war da, nur ihr Rohwert sah aus wie
Mittelmaß.

Schlimmer: die beiden Volltext-Lieder fanden **einander** als stärksten
Textpartner (0,738) — nicht weil sie verwandt wären, sondern weil sie
dieselbe Textsorte sind. Das Zwei-Stimmen-Kriterium hat den Fehlfund
abgefangen; allein hätte der Textraum ihn durchgelassen.

**Die Antwort im Vorrechner:** Es werden nur Paare **gleicher Textsorte**
verglichen, und der Mischbestand wird gemeldet. Geprüft wird auf
Gleichheit, nicht auf `'kondensat'` — ein fremder Bestand hat gar keine
Kondensate, ist durchgehend Volltext, und damit eine einheitliche Skala,
auf der alles vergleichbar ist. **Der Mischfall ist der Sonderfall, und
er entsteht in einem gepflegten Archiv bei jedem neuen Lied.**

---

## 6. Die Darstellung: eine Tafel, kein Netz

Caspar_D brachte STRING-DB ins Spiel — die Protein-Datenbank, in der
Kanten nach Evidenztyp gefärbt sind und mehrere Belege mehrere parallele
Linien ergeben. Am 07.09.2026 in Chrome nachgesehen (der interne Browser
kommt durch Cloudflare nicht durch): Die Kanten sind **gebündelte
Parallelen**, nicht überlagert; zwischen TP53 und MDM2 laufen drei Linien
nebeneinander, zwischen ATM und CDKN1A nur eine. Ein Vier-Knoten-Netz
sieht dabei sehr gut aus. Die Farbordnung trennt *belegt* von
*hergeleitet*. Ein Mangel zum Mitnehmen: Co-Expression ist **schwarz**
und auf dunklem Grund praktisch unsichtbar.

**Trotzdem: Liste.** 28 der 35 Familien sind eine einzige Linie zwischen
zwei Punkten, der mittlere Knotengrad ist 1,1. Ein Bild aus 28 Hanteln
und 7 Dreiecken zeigt nichts, was eine Zeile nicht zeigt. Caspar_Ds
eigener Verdacht — *„vielleicht mache ich aus dem tollen Feature eine
poplige Variante der Mainview"* — hat sich als richtig erwiesen, nur
andersherum: die Liste ist nicht die Notlösung, sie ist die Form.

Von STRING bleibt alles außer dem Kräftelayout: eine feste Farbe je Raum,
die Trennung von *woher* und *wie stark*, eine großzügige Fangfläche, und
der Klick, der aufschlüsselt.

**Die drei Zustände einer Rinne** — der Kern des Entwurfs. Von 26
fehlenden Farben liegen 5 über dem 99. Perzentil und 10 im Graubereich;
eine leere Rinne darf also nicht „unterschiedlich" heißen:

1. Raum stimmt mit → Balken, Topline, Zahl in Raumfarbe
2. fehlt, Rohwert unter p95 → leere Rinne, blasse Zahl, dahinter **„fern"**
3. fehlt, Rohwert ab p95 → leere Rinne, graue Zahl, **„nah, aber verdrängt"**

**Die Farben**, gegen den Datenbereich gerechnet und im Bestand auf
Kollisionen geprüft:

| Raum | Wert | Kontrast |
|---|---|---|
| Text | `#9d7bff` | 6,1 : 1 |
| Klang | `#34c9b5` | 9,3 : 1 |
| Harmonie | `#e8b23a` | 10,0 : 1 |

Die Lage ist redundant zur Farbe (Text oben, Harmonie unten). Normiert
wird je Raum in der eigenen Spanne, mit der Ansage in der Legende:
*Längen vergleichen nur innerhalb einer Zeile.* Drei verschiedene Maße
bekommen keine gemeinsame Achse.

**Umfang:** rund 110 Zeilen — Route, Ladevorgang, Vergleicher in der
Sortiertabelle, Pille, Tafel.

**Zwei Entscheidungen stehen aus:** Die drei Kennfarben sind eine
Ausnahme von der Zwei-Akzent-Regel und müssen ausdrücklich erteilt
werden. Und der Klangraum-Zwilling (`web/index.html:9911`) beantwortet
dieselbe Frage mit einer festen Schwelle — zwei Antworten auf eine Frage
gehen nicht, er stützt sich künftig auf diese Daten oder wird abgeräumt.

---

## 7. Der Kondensat-Erzeuger — recherchiert und verworfen

Die Lücke ist echt: **es gibt kein Skript, das Kondensate erzeugt.**
`bin/kondensat-prompt.js` hält den Auftragstext bereit, aber niemand ruft
ihn auf; `bin/kondensate-sammeln.js` sammelt nur ein, was von außen
kommt; im Morgenlauf steht kein Schritt dafür. Die 257 vorhandenen
Kondensate stammen aus Claude-Läufen früherer Sitzungen.

Am 07.09.2026 habe ich zwei fehlende Kondensate selbst geschrieben.
Caspar_Ds Rüge: *„du kannst nicht einfach das Kondensat ändern, manno —
wir arbeiten toolgetreu ohne manuelle Eingriffe. Merk dir endlich mal,
dass der KlangTresor ohne manuelle Eingriffe mit fremden Datenbeständen
aus Suno klarkommen muss."* Der Eintrag ist zurückgenommen; das Archiv
steht wieder bei 257 Liedern, Stand 28.08.

Das Tückische daran: es war derselbe Weg wie bei den anderen 257. Falsch
war nicht das Verfahren, sondern dass es **an einer Person hängt** — und
dass niemand die Lücke bemerkt, solange jemand einspringt.

**Die Recherche nach einem Netz-Modell ist abgeschlossen und das Ergebnis
verworfen.** Caspar_D: *„ich will mich eigentlich nicht abhängig machen.
Wir lassen das."* Festgehalten, damit es niemand ein zweites Mal
recherchiert:

- **Groq** wäre der einzige Gratis-Dienst, dessen Vertrag ohne
  Unterschied zwischen Gratis- und Bezahlstufe sagt: *„Groq is not
  permitted to use Inputs or Outputs for training or fine-tuning"*
  (Services Agreement, 22.06.2026). Rechner in den USA, Dienste erklärt
  als „not for consumer use", Deutschfähigkeit ungeprüft.
- **Gemini** fällt nicht am Kontingent, sondern an einem Satz für Dritte:
  *„You may use only Paid Services when making API Clients available to
  users in the European Economic Area."*
- **Mistral** trainiert in der Gratisstufe per Voreinstellung; abschalten
  muss jeder Nutzer von Hand.
- **OpenRouter :free** reicht die Trainingsfrage an den jeweiligen
  Anbieter durch — man wüsste hinterher nicht, welche Lieder betroffen
  waren. 50 Anfragen am Tag, Erstlauf sechs Tage.
- **Cloudflare Workers AI** wäre rechnerisch am besten (833 Lieder am Tag
  gegen 161 bei Groq), die Datenbedingungen sind **ungeprüft**.

**Ein methodischer Fund, der bleibt.** Beim Vergleich der vorhandenen
Modelle über den Eichkasten:

| Kriterium | opus | haiku |
|---|---|---|
| Abstand zum Untergrund | 2,19 Streuungen | **2,43** |
| Gegenüber-Paare mit identischer Liste | **0 von 8** | 2 von 8 |

Auf der Leiter allein sieht das kleinere Modell **besser** aus. Wer nur
diese Zahl misst, wählt das schlechtere. Die Ausschlussbedingung ist
nicht die Leiter, sondern *null Paare mit identischer Liste*.

**Der offene Weg statt des Netzes:** KlangTresor auf Apple Silicon. Auf
dem Intel-Mac ist Ollama unbrauchbar (qwen3:8b 56 s je Lied, qwen3:14b
82 s, deepseek-r1 in 51 Minuten nichts), aber das ist eine
Hardware-Grenze, keine Verfahrensgrenze. Auf einem M3 wäre die
14b-Klasse vermutlich tragfähig — zu messen, nicht zu raten. Damit fiele
die Abhängigkeit von einem fremden Dienst ganz weg.

Und die Zahl, die das entspannt: **die Lied-Familien brauchen das
Kondensat nicht.** Gemessen am selben Referenzset, Rang des echten
Partners:

| | mittlerer Rang | auf Platz 1 | unter den zwei ähnlichsten |
|---|---|---|---|
| Kondensat | 2,67 | 71 % | **89 %** |
| Volltext | 9,76 | 56 % | 73 % |

Ohne Kondensat geht rund ein Sechstel der Textstimmen verloren; Klang und
Harmonie fangen einen Teil auf. Für die **Karte** ist das Kondensat
unverzichtbar (dort geht es ums Auseinanderlegen von 259 Liedern), für
die **Familien** nicht (dort geht es ums Wiederfinden eines Partners).
Das steht auch schon in `docs/KONDENSAT-REGELN.md`: *„Für das bloße
Wiederfinden eines Partners reicht auch ein kleines Modell."*

---

## 8. Der Stand

**Gebaut:** `bin/fassungen.js` (Vorrechner, 43 Kanten, 151 s auf zwölf
Kernen), `library/fassungen.json` (16,4 kB, 35 Familien).

**Nicht gebaut:** alles an der Oberfläche. Keine Route, keine Pille,
keine Tafel, kein Detailfenster.

**Offen:**

1. Ob die Tafel gebaut wird (rund 110 Zeilen) — Entscheidung Caspar_D.
2. Die Ausnahme von der Zwei-Akzent-Regel für die drei Kennfarben.
3. Der Klangraum-Zwilling: umstellen oder abräumen.
4. Kein Morgenschritt für `bin/fassungen.js`.
5. Der Vorrechner rechnet immer alles neu. Bei drei neuen Liedern wären
   drei Zeilen gegen 259 Spalten nötig statt 259 gegen 259 — eine spätere
   Verbesserung, keine Bedingung.
6. Fünf der 43 Kanten sind vermutlich keine Fassungen. Ob sich Serien
   (*Ich atme dich – Track 2/4*) durch eine Regel ausschließen lassen,
   ist ungeprüft.
7. Instrumentals bleiben draußen. Ob es für sie ein eigenes Kriterium
   gäbe, ist offen.

---

## 9. Quellen und Werkzeuge

- **STRING-DB** v12.0 (string-db.org), Netz und Legende am 07.09.2026 in
  Chrome angesehen. Farbordnung: Datenbank Cyan, experimentell Magenta,
  Gennachbarschaft Grün, Genfusion Rot, Co-Occurrence Blau, Textmining
  Gelbgrün, Co-Expression Schwarz, Homologie Hellviolett.
- **`docs/eichkasten/`** — Referenzset aus handgepflegten Playlists,
  `messlauf.js` und `messlauf-ergebnis.json`. Die Paarmengen:
  Übersetzungen (16), Fassungen (19), Gegenüber (19),
  Ahnheim-Formzwillinge (7), Serien.
- **`docs/GESCHICHTEN-RAUM-BILANZ.md`** — Modellwahl: Suchmodelle (e5,
  BGE, GTE) drängen alle Werte in acht Tausendstel zusammen,
  Ähnlichkeitsmodelle (`paraphrase-multilingual-mpnet`) spreizen zehnmal
  weiter. *„Es ist die Familie, nicht die Größe."*
- **`docs/KONDENSAT-REGELN.md`** — Begründung jeder Regel des Prompts,
  Modellvergleich, die Wiederfinden-Aussage.
- **`docs/CLOUS.md`** Abschnitt 5 — die Vorgeschichte als Chroma-Messung.
- Arbeitsskripte der Sitzung im Arbeitsverzeichnis
  (`scratchpad/quellen/`): `drei.js` (erster, an der verseuchten
  Grundwahrheit gescheiterter Lauf), `drei2.js` (mit Eichkasten-Zuschnitt),
  `selbst.js` (die schwellenfreien Kriterien), `corinth.js` (der
  Testfall), `gruppen.js` (Zusammenhangskomponenten).
