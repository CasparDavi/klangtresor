/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ==========================================================================
   SunoAnalyzer als Modul  ·  web/fremd/analyzer.js

   Herkunft: ein frueheres eigenes Projekt, SunoAnalyzer/suno_analyzer.html
   (CB/Caspar_D, Fassung 4.4). Erzeugt am 18.08.2026 aus der damaligen
   Kopie web/analyzer.html - ab hier wird diese Datei von Hand gepflegt.

   Was beim Umzug geschah, und nur das:

   1. CSS eingehegt. Jede Regel bekam '.sunoanalyzer' vorangestellt. Ohne
      das hätten 'body', '*', 'button' und 'canvas' die gesamte Bühne
      umgefärbt - derselbe Fall wie einst die doppelt vergebene Klasse
      'marke'.
   2. Markup und CSS liegen als Zeichenketten hier drin und werden beim
      Aufbau eingesetzt. Der Worker steckte schon vorher als Zeichenkette
      im Skript, er zieht also ohne Zutun mit um.
   3. Das gesamte Skript liegt in starten() statt im globalen Raum. Es
      teilt sich sonst den Namensraum mit index.html - dort gibt es
      bereits 'song', 'player' und 'audio'.
   4. Weil die Inline-Handler des Markups globale Namen brauchen, gibt es
      die Brücke '__SA'. Sie schrumpft auf null, sobald Kopfbereich,
      Kommentar-Generator und eigener Player entfallen (Aufgabe 1).
   5. requestAnimationFrame ist innerhalb von starten() überschattet.
      Dadurch lassen sich ALLE Zeichenschleifen des Analyzers anhalten,
      ohne eine einzige seiner Zeilen anzufassen - siehe abraeumen().

   Noch nicht geschehen (Aufgaben 1 bis 6 im Backlog): Aufräumen,
   Zeitgeber statt eigenem Player, lokale Daten, Layout, Stilllegung
   von Stems und Instrumenterkennung.
   ========================================================================== */

(function(){
  'use strict';

  const KLASSE = 'sunoanalyzer';
  const CSS    = `
/* ---------------------------------------------------------------------
   Eingebetteter Betrieb: Was in der Bühne nichts zu suchen hat.

   Stillgelegt, nicht gelöscht - das Markup bleibt stehen, damit keine
   Funktion ins Leere greift, und das Wiedereinschalten ist eine Zeile.
   Beschlossen am 18.08.2026: Stem-Trennung und Instrumenterkennung sind
   in der Bühne nicht sinnvoll.
   --------------------------------------------------------------------- */
.sunoanalyzer.eingebettet #sa-transport,
.sunoanalyzer.eingebettet #pp-btn,
.sunoanalyzer.eingebettet #meta,
/* Die eigene Überschrift samt Fassungsnummer: In der Bühne ist der
   Analyzer kein Programm mehr, sondern ein Modus. */
.sunoanalyzer.eingebettet h1{display:none!important}
/* Der Analyzer sitzt in der Bühne auf deren Grund, nicht auf eigenem. */
.sunoanalyzer.eingebettet{padding:0;max-width:none;background:transparent}

/* Die Karten füllen die Zeilen selbst auf, statt in Vierergruppen zu
   stehen: EIN Raster, in das alle 28 Karten fließen. Möglich wird das
   durch display:contents an den alten Vierergruppen - ihre Kinder
   rutschen damit in das Raster der Eltern, ohne dass am Markup der
   Gruppen etwas zu ändern wäre. */
/* ---------------------------------------------------------------------
   Tabelle statt Kacheln, nach Edward Tufte.

   Die Kachel war ein Kasten um eine Zahl - Rahmen, Fläche, Rundung und
   Mittelsatz kosteten Platz und trugen nichts bei. Stattdessen: Zeilen
   mit einer Haarlinie, linksbündige Benennung, rechtsbündige Zahl in
   Tabellenziffern, und rechts daneben eine wortgroße Grafik.

   Tuftes Begriff dafür ist die Sparkline: "a small intense simple
   wordlike graphic". Sie hat keine Achsen und keine Beschriftung - die
   Zahl daneben ist die Beschriftung.
   --------------------------------------------------------------------- */
.sunoanalyzer #sa-karten{display:grid;gap:0 26px;margin:8px 0 14px;
  grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}
.sunoanalyzer #sa-karten .grid{display:contents}
.sunoanalyzer #sa-karten .card{display:grid;align-items:center;gap:0 8px;
  grid-template-columns:minmax(0,1fr) auto 78px 40px;
  background:none;border-radius:0;padding:2px 0;text-align:left;
  border-bottom:1px solid rgba(255,255,255,.06)}
.sunoanalyzer #sa-karten .card .lbl{order:1;font-size:11px;color:#8a8a8a;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* DIE FRAGE VORNE, DER FACHBEGRIFF KLEIN DAHINTER (Caspar_D, 25.08.2026:
   "ich bin kein Toningenieur, ich kann mit der Terminologie wenig
   anfangen"). Die Karte soll eine Frage beantworten, nicht einen
   Messwert etikettieren. Der Fachbegriff bleibt lesbar stehen - so
   lernt man die Zuordnung nebenbei, statt sie zu brauchen. */
.sunoanalyzer #sa-karten .card .lbl i{font-style:normal;opacity:.55;
  font-size:10px;margin-left:4px}
.sunoanalyzer #sa-karten .card .val{order:2;font-size:13px;margin:0;
  text-align:right;font-variant-numeric:tabular-nums;color:#e6e6e6}
.sunoanalyzer #sa-karten .card .funke,
.sunoanalyzer #sa-karten .card .gauge{order:3;width:78px;height:16px;margin:0}

/* Höchst- und Tiefstwert der Reihe, gestapelt. Tufte setzt sie an die
   Sparkline, weil eine Linie ohne Maßstab sonst nur Form zeigt und
   keine Größe. */
/* Halb so groß wie die Zahl daneben (13px), max über min. */
.sunoanalyzer #sa-karten .card .spanne{order:4;font-size:6.5px;line-height:1.35;
  text-align:right;font-variant-numeric:tabular-nums;color:#6d6d6d;white-space:nowrap}
.sunoanalyzer #sa-karten .card .spanne i{font-style:normal;display:block}

/* Die Zahl trägt die Farbe der Linie, die sie meint. Blau = Mittelwert.
   Ohne Farbe: Die Zahl ist KEIN Mittel der gezeigten Reihe - siehe
   docs/VISUALIZER.md. */
.sunoanalyzer #sa-karten .card.ist-mittel .val{color:#4b93f0}

/* Die Bereichsmarke wird zur Haarlinie: eine Linie, eine Marke, sonst
   nichts. Sie steht dort, wo es keine Zeitreihe gibt, aber einen
   bekannten Wertebereich. */
.sunoanalyzer #sa-karten .card .gauge{position:relative}
.sunoanalyzer #sa-karten .card .gauge .gauge-track{top:50%;height:1px;
  background:rgba(255,255,255,.18)!important;border-radius:0}
.sunoanalyzer #sa-karten .card .gauge .gauge-marker{top:2px;height:12px;width:1px;
  background:var(--bakzent,#4b93f0)}
/* Die Messbalken müssen die volle Kartenbreite behalten.

   Sie sind Blockelemente, deren Inhalt (Spur und Marke) absolut
   positioniert ist - in einer mittig ausgerichteten Flexspalte
   schrumpfen sie damit auf NULL und verschwinden spurlos. Genau das
   ist beim Umbau auf das Kartenraster passiert. */
.sunoanalyzer #sa-karten .card>*{max-width:100%}
.sunoanalyzer #sa-karten .card .gauge{width:100%;align-self:stretch;flex:0 0 auto;
  margin-bottom:0}

/* ---------------------------------------------------------------------
   Befunde: kein Messwert, sondern Ort, Schweregrad und Vorschlag.

   Deshalb weder Karte noch Diagramm - eine Karte trägt eine Zahl über
   den ganzen Song, ein Diagramm einen Verlauf zum Ablesen. Ein Befund
   sagt: hier ist etwas, dort, und das könntest du tun. Anklickbar,
   damit man es hört statt es zu glauben.
   --------------------------------------------------------------------- */
.sunoanalyzer #sa-befunde{margin:10px 0 6px}
.sunoanalyzer #sa-befunde .bf-kopf{display:flex;align-items:center;gap:10px;
  font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8a8a8a;
  /* Vor der Ueberschrift mehr Platz als dahinter. */
  margin:12px 0 5px}
.sunoanalyzer #sa-befunde select{font-size:11px;padding:2px 6px;background:#141414;
  color:#bbb;border:1px solid #2a2a2a;border-radius:4px}
.sunoanalyzer .bf{display:flex;align-items:baseline;gap:10px;font-size:12px;
  padding:3px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.sunoanalyzer .bf .ampel{width:7px;height:7px;border-radius:50%;flex:0 0 auto;
  transform:translateY(-1px)}
.sunoanalyzer .bf .wo{font-variant-numeric:tabular-nums;color:#4b93f0;cursor:pointer;
  flex:0 0 auto}
.sunoanalyzer .bf .wo:hover{text-decoration:underline}
.sunoanalyzer .bf .was{flex:0 1 auto;min-width:0;color:#ccc}
.sunoanalyzer .bf .tipp{color:#7d7d7d;font-size:11px;margin-right:auto}
.sunoanalyzer .bf.gut{color:#8a8a8a}
/* Schimmerfunde als Tabelle: die wiederkehrenden Worte stehen im Kopf,
   die Zeilen tragen Zahlen. Rechtsbündig und in Tabellenziffern, damit
   die Größenordnungen untereinander stehen. */
.sunoanalyzer .bf-tab{display:grid;justify-content:start;
  grid-template-columns:auto auto auto auto auto auto;gap:0 14px;font-size:12px;
  margin:4px 0 6px}
.sunoanalyzer .bf-tab .kopf{font-size:10px;color:#6f6f6f;letter-spacing:.06em;
  text-transform:uppercase;padding-bottom:2px}
.sunoanalyzer .bf-tab .zahl{font-variant-numeric:tabular-nums;text-align:right;color:#ccc}
.sunoanalyzer .bf-tab .rat{color:#7d7d7d;font-size:11px}
.sunoanalyzer .bf-ueber{font-size:11.5px;color:#8a8a8a;margin:16px 0 5px;max-width:78ch;line-height:1.45}
.sunoanalyzer .bf-ueber b{color:#bbb;font-weight:500}
.sunoanalyzer .bf-tab .ampel{width:7px;height:7px;border-radius:50%;
  outline:1px solid rgba(0,0,0,.6)}
.sunoanalyzer .bf-tab .wo{font-variant-numeric:tabular-nums;color:#4b93f0;cursor:pointer}
.sunoanalyzer .bf-tab .wo:hover{text-decoration:underline}
/* Auch die Ampelpunkte sind helle Flächen auf dunklem Grund. */
.sunoanalyzer .bf .ampel{outline:1px solid rgba(0,0,0,.6)}
.sunoanalyzer #sa-befunde .bf-leise{text-transform:none;letter-spacing:0;color:#6a6a6a}
.sunoanalyzer .bf-plattform{font-size:11.5px;color:#8a8a8a;margin:0 0 8px}
.sunoanalyzer .bf-plattform b{color:#bbb;font-weight:500}

/* Registerlaschen fuer die Plattformen. Erst wenn sie nicht mehr
   nebeneinander passen, tritt das Klappfeld an ihre Stelle - der
   Wechsel geschieht in registerAnpassen() nach gemessener Breite,
   nicht nach geratener Fensterbreite. */
/* Gebaut wie die Reiter der Albumansicht (.register/.reg in
   index.html): 14 px halbfett, 7/14 Polsterung, 4 px Abstand, der
   aktive hell mit Akzentlinie darunter, die Gruppe auf einer
   Haarlinie. Nur die Farben sind die des Analyzers - er bringt seine
   eigene Palette mit und kennt die CSS-Variablen der Bühne nicht.
   (Caspar_D: "mach sie bitte wie im album view.") */
.sunoanalyzer .bf-register{display:flex;gap:4px;margin:0 0 8px;
  align-items:center;border-bottom:1px solid rgba(255,255,255,.12)}
.sunoanalyzer .bf-register button{background:none;border:none;
  border-bottom:2px solid transparent;padding:7px 14px;margin-bottom:-1px;
  cursor:pointer;color:#8a8a8a;font-size:14px;font-weight:600;white-space:nowrap;
  /* border-radius:0 ist Pflicht, nicht Kosmetik: Der Analyzer hat eine
     globale Knopfregel mit 8 px Radius, und die rundet auch den 2 px
     starken Unterstrich an beiden Enden. Fünf Laschen nebeneinander
     ergaben damit eine Reihe kleiner Bögen - "eine Art geschweifte
     Klammer" (Caspar_D). Die Reiter der Albumansicht haben keinen Radius,
     weil dort die Hausregel button{border:none} greift und die
     Rundung nur an .knopf und select hängt. */
  border-radius:0}
.sunoanalyzer .bf-register button:hover{color:#e8e8e8}
.sunoanalyzer .bf-register button.an{color:#e8e8e8;border-bottom-color:#4b93f0}
.sunoanalyzer .bf-klapp{display:none;margin:0 0 8px}

/* Gegenueberstellung: was die Plattform verlangt, was der Song hat. */
/* Zwei Spalten, wenn der Platz reicht.

   Sechs Zeilen untereinander lassen rechts eine leere Haelfte stehen.
   Der Behaelter ist deshalb ein umbrechendes Flex: Zwei Raster zu je
   drei Zeilen stehen nebeneinander, solange sie hineinpassen, und
   rutschen sonst von selbst untereinander. Entschieden wird das vom
   Umbruch, nicht von einer geratenen Fensterbreite - dieselbe
   Ueberlegung wie bei den Registerlaschen, nur dass es hier ohne
   Messung geht. (Caspar_D: "ggf bei 6 nach 3 einen spaltenumbruch")

   Die Kopfzeile steht in BEIDEN Rastern. Das ist keine ueberfluessige
   Wiederholung: Eine Spalte ohne Kopf waere nicht lesbar, und die
   Alternative - ein einziges Raster mit acht Spalten - koennte nicht
   umbrechen. */
.sunoanalyzer .bf-paare{display:flex;flex-wrap:wrap;gap:0 34px;margin:0 0 10px}
/* DIE GRUPPEN TEILEN SICH DIE BREITE (Caspar_D, 25.08.2026: "dort rechts
   so ein grosser Schwarzraum"). Vorher waren beide Spaltengruppen so
   schmal wie ihr Inhalt und klebten links - die rechte Haelfte des
   Panels blieb leer. Jetzt wachsen sie in den Platz hinein; flex-basis
   bleibt auto, damit die zweite Gruppe bei schmalem Fenster weiterhin
   unter die erste rutscht statt sich zu quetschen. */
.sunoanalyzer .bf-paare > *{flex:1 1 auto}

/* Alle Spalten auto und justify-content:start - die Tabelle ist damit
   nur so breit wie ihr Inhalt, und der freie Platz bleibt rechts als
   Block stehen statt sich zwischen Bezeichnung und Wert zu schieben.
   (Caspar_D: "bitte negativ space vermeiden, es sind riesige abstaende
   zwischen Parameter bezeichnung und wert.")

   Moeglich wurde das erst dadurch, dass das Verhalten der Plattform aus
   den Zeilen heraus nach oben gewandert ist - es ist eine Eigenschaft
   der Plattform, nicht der Zeile, und war der lange Text, der die
   Spalte breit gezogen hat. */
/* REGISTERHALTIGKEIT: feste Zeilenhoehe, kein Zeilenabstand.

   Ohne sie richtet sich jede Zeile nach ihrem Inhalt - eine Zelle, die
   umbricht, macht ihre Zeile hoeher, und ab da stehen die beiden
   Spalten versetzt zueinander. Bei zwei Tabellen nebeneinander faellt
   das sofort auf. (Caspar_D: "du kannst die zweite spalte nicht mit einem
   anderen zeilenabstand fahren wie die erste.")

   Dieselbe Schrittweite fuer BEIDE Tabellen, damit auch Vergleich und
   Schimmerfunde untereinander im Register stehen. Umbrechen darf
   deshalb nichts - lange Zellen werden abgeschnitten. */
.sunoanalyzer .bf-vergleich,.sunoanalyzer .bf-tab{grid-auto-rows:20px;
  align-items:baseline}
.sunoanalyzer .bf-vergleich > *,.sunoanalyzer .bf-tab > *{
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sunoanalyzer .bf-vergleich{display:grid;justify-content:start;
  /* Die letzte Spalte (das Urteil) nimmt den Rest der Gruppe - Name und
     Zahlen bleiben kompakt beieinander, und der freie Raum gehoert dem
     Text, der ihn brauchen kann. */
  grid-template-columns:auto auto auto 1fr;gap:0 14px;
  font-size:12px}
.sunoanalyzer .bf-vergleich .gr{color:#8a8a8a}
.sunoanalyzer .bf-vergleich .soll{color:#8a8a8a;font-variant-numeric:tabular-nums;text-align:right}
.sunoanalyzer .bf-vergleich .ist{font-variant-numeric:tabular-nums;color:#eee;text-align:right}
.sunoanalyzer .bf-vergleich .kopf{font-size:10px;color:#6f6f6f;letter-spacing:.06em;
  text-transform:uppercase;padding-bottom:2px}
.sunoanalyzer .bf-vergleich .urteil{font-size:11px;white-space:nowrap}

/* Die Befundspur: eine Zeitachse, darauf Strecken statt Punkte.

   Ein Befund hat fast immer eine Ausdehnung - eine Strecke, auf der
   alle zwei Sekunden eine Ueberschreitung sitzt, ist etwas anderes als
   zwei Ausreisser am Anfang und am Ende.

   Sie liegt in einem .chart-outer wie jede andere Spur. Der erste
   Anlauf war HTML mit Prozentwerten und einer 110-px-Spalte fuer die
   Namen - beides falsch: Die Spalte verschob die Zeitachse gegen alle
   anderen Diagramme, und Prozentwerte koennen den viewBox-Zoom nicht
   mitmachen. (Caspar_D: "dein plot ist nicht mit der zeitleiste
   aligniert, das geht so nicht.")

   Die Namen liegen deshalb als HTML-Schicht UEBER dem SVG, nicht
   darin: In einem viewBox mit preserveAspectRatio="none" wuerde Text
   mitgestreckt. Sie zoomen nicht mit - sie beschriften die Bahn, nicht
   die Zeit. */
/* Die Bahnen sind schwarz, das Panel darunter 0,9 deckend. Damit
   heben sich die farbigen Marken vom Grund ab, ohne dass jede von
   ihnen eine eigene Kontur braucht - die Kontur wuerde als Schatten
   gelesen. (Caspar_D: "die gelben und rosa bloecke werden durch eine
   schwarze Linie begrenzt oder einen Schatten ... der Balken, wo sie
   drin liegen, muss schwarz sein und das Panel 0.9 Opazitaet haben.") */
.sunoanalyzer #sa-spur-aussen{background:rgba(0,0,0,.9)}
/* Die Befundspur steckt in #sa-befunde, das bereits 12 px Polster
   traegt. Ohne diese Zeile kaeme es doppelt, und die Spur waere 24 px
   schmaler als alle anderen - der Spielkopf liefe im falschen Raster. */
.sunoanalyzer #spur-befund{padding-left:0;padding-right:0}
.sunoanalyzer #sa-spur-namen{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.sunoanalyzer #sa-stereo-namen{position:absolute;inset:0;pointer-events:none}
.sunoanalyzer #sa-stereo-namen span{position:absolute;left:4px;font-size:8px;color:#9a9a9a;
  text-shadow:0 0 3px #000,0 0 3px #000}
/* Senkrecht mittig in ihrer Bahn - ueber align-items, nicht ueber
   line-height. Die Zeilenbox einer Schrift ist nicht so hoch wie ihre
   Schriftgroesse und haengt von Ober- und Unterlaengen ab; mit
   line-height gesetzt sass die Beschriftung bis zu 4 px daneben. */
.sunoanalyzer #sa-spur-namen span{position:absolute;left:5px;font-size:10px;
  color:#9a9a9a;text-shadow:0 0 4px #000,0 0 4px #000;
  display:flex;align-items:center}
/* Linksbuendig mit Auslassungspunkten, nicht mittig: Mittig
   abgeschnitten zeigt ein schmaler Block seine Wortmitte - aus "Verse 2"
   wird "erse", aus "Interlude" wird "terlu". Vom Anfang her gekuerzt
   bleibt es lesbar. */
.sunoanalyzer #sa-spur-namen span.abs{left:auto;justify-content:flex-start;
  text-transform:uppercase;letter-spacing:.04em;font-weight:700;
  font-size:9.5px;text-shadow:none;overflow:hidden;white-space:nowrap;padding:0 3px;
  box-sizing:border-box;text-overflow:ellipsis;display:flex;align-items:center}
/* Die Überschrift über jeder Bahn (Caspar_D, 23.08.2026). */
.sunoanalyzer #sa-spur-namen span.kopf{left:0;right:auto;color:#9a9aa2;
  font-size:10px;letter-spacing:.06em;text-transform:uppercase;font-weight:700;
  display:flex;align-items:center;text-shadow:none;white-space:nowrap}


/* Massstabsreihe und Sockelkaskade abgeklemmt (Caspar_D, 18.08.2026:
   "hat uns nicht weitergebracht"). Beide bleiben im Markup und im
   Quelltext - die Zerlegung ist die Grundlage des gestapelten
   Diagramms darunter, das weiterlaeuft. Gerechnet wird jede nur noch,
   wenn ihre Flaeche sichtbar ist. */
.sunoanalyzer #sa-linien .sa-spur{margin-bottom:8px}

/* ---------------------------------------------------------------------
   Spuren nach Art der Sequenzprofile aus Sequenzstatistik.html.

   Gezeichnet wird als SVG in einem festen Koordinatensystem von 1000
   Einheiten Breite, gestreckt per CSS. Dadurch ist die Spur in jeder
   Fensterbreite scharf, ohne neu gezeichnet zu werden - anders als die
   Canvas-Diagramme, die bei jeder Größenänderung neu berechnet werden
   müssen und mit devicePixelRatio hantieren.

   Flach (44 px statt 70-360), damit viele Spuren nebeneinander auf einen
   Schirm passen. Das ist der eigentliche Sinn: Zusammenhänge sieht man
   nur, wenn die Spuren gleichzeitig sichtbar sind.
   --------------------------------------------------------------------- */
.sunoanalyzer .sa-spur .spur-flaeche{width:100%;height:44px;display:block}
.sunoanalyzer .sa-spur .spur-flaeche svg{width:100%;height:100%;display:block}
.sunoanalyzer #main-waveform-canvas svg{width:100%;height:100%;display:block}
.sunoanalyzer .sa-spur .slbl{display:flex;gap:10px;align-items:baseline}
/* Unter dem Diagramm, rechtsbuendig - die Einstellung folgt dem Bild,
   sie geht ihm nicht voraus. */
/* Ueber die volle Breite - und damit von selbst in eine eigene Zeile.

   #sa-karten ist EIN Raster mit auto-fill-Spalten, in das alle Karten
   fliessen (.grid{display:contents} loest die inneren Raster auf).
   Eine Kopfzeile ohne grid-column waere darin eine gewoehnliche Zelle:
   Die drei Ueberschriften standen nebeneinander wie drei Spaltenkoepfe,
   und die Karten liefen darunter durch. (Caspar_D: "nicht in Spalten
   sondern untereinander.")

   1/-1 heisst: von der ersten bis zur letzten Spaltenlinie. Das
   erzwingt den Umbruch, ohne die Spaltenzahl zu kennen - die haengt an
   der Fensterbreite. */
/* JEDER BLOCK EIN EIGENES RASTER.

   grid-column:1/-1 allein genuegte nicht: #sa-karten ist ein Raster mit
   auto-fill-Spalten, in das ALLE Karten fliessen, und die automatische
   Platzierung ordnete die drei Kopfzeilen untereinander an den Anfang,
   waehrend die Karten geschlossen dahinter liefen. Die Reihenfolge im
   Markup war richtig, das Raster hielt sich nicht daran.

   Ein eigener Behaelter je Block loest das, ohne die Spaltenzahl zu
   kennen: Der Block spannt die volle Breite und traegt DIESELBE
   Spaltenregel im Innern. Die inneren .grid bleiben aufgeloest
   (display:contents), es kommt also keine zweite Ebene hinzu. */
.sunoanalyzer #sa-karten .kartenblock{grid-column:1/-1;display:grid;gap:0 26px;
  grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}
.sunoanalyzer .karten-kopf{grid-column:1/-1;font-size:11px;letter-spacing:.08em;text-transform:uppercase;
  color:#8a8a90;margin:34px 0 6px;padding-bottom:4px;
  /* 34 zu 6. Der Abstand DAVOR traegt die Aussage: Eine Ueberschrift
     mit wenig Luft davor liest sich als Fussnote zur Tabelle darueber
     statt als Anfang der naechsten. */
  border-bottom:1px solid rgba(255,255,255,.08)}
/* NICHT :first-child - jeder Kopf ist erstes Kind SEINES Blocks.

   Die Regel sollte nur den allerersten Kopf entlasten und setzte
   stattdessen alle drei auf null: Der Abstand von 34 px, der die ganze
   Aussage traegt, war unsichtbar wirksam gleich null. Gemessen 0 statt
   34, waehrend im Stil 34 stand.

   Jetzt greift sie nur im ersten Block. */
.sunoanalyzer .kartenblock:first-of-type .karten-kopf{margin-top:10px}
/* Der Gedankenstrich steht im Text, nicht im Stil. Ohne ihn las sich
   die Kopfzeile als ein Wort - "Pegel und Lautheitgemessen" -, denn
   ein Abstand aus margin ist beim Kopieren und beim Vorlesen nicht da.
   (Caspar_D, 19.08.2026) */
/* Kein Zusatz hinter der Ueberschrift. Die drei Namen sagen selbst,
   worum es geht - "Aus dem Katalog" braucht kein "abgeschrieben"
   dahinter. (Caspar_D, 19.08.2026) */
.sunoanalyzer .spur-wahl{display:flex;gap:6px;justify-content:flex-end;margin-top:5px}
.sunoanalyzer .spur-wahl select{font-size:10.5px;padding:1px 5px}
/* Die Profilknoepfe: nur die Form, kein Wort. Der aktive traegt die
   Akzentfarbe, die uebrigen sind gedaempft. */
.sunoanalyzer .spur-profil{display:inline-flex;gap:1px;align-items:center}
.sunoanalyzer .spur-profil button{background:none;border:none;border-radius:0;padding:2px 4px;
  cursor:pointer;color:#6a6a6a;line-height:0;display:flex}
.sunoanalyzer .spur-profil button:hover{color:#b0b0b6}
.sunoanalyzer .spur-profil button.an{color:#4b93f0}
/* Die Kurvenformwahl liegt ueber dem Bild, unten rechts in der ersten
   Bahn - dort ist bei jeder Huellkurve am wenigsten los. Die Zeichen
   sind Mathematik, keine Symbole, deshalb etwas Luft und tabulare
   Ziffernbreite. */
.sunoanalyzer #sa-kurvenwahl{position:absolute;right:14px;z-index:3;display:flex;gap:2px}
.sunoanalyzer #sa-kurvenwahl button{font-size:12px;line-height:1;padding:2px 5px;
  background:rgba(10,10,10,.62);border-radius:3px}

/* Die Zeitangabe reitet auf dem Spielkopf der Wellenform. */
.sunoanalyzer #sa-zeitmarke{position:absolute;top:2px;transform:translateX(-50%);
  pointer-events:none;font-size:10px;font-variant-numeric:tabular-nums;
  background:rgba(0,0,0,.72);color:#fff;padding:1px 5px;border-radius:3px;
  white-space:nowrap;left:0}

.sunoanalyzer *{box-sizing:border-box;margin:0;padding:0}
.sunoanalyzer{font-family:system-ui,sans-serif;background:#111;color:#eee;padding:1.5rem;max-width:860px}
.sunoanalyzer h1{font-size:15px;font-weight:500;color:#888;margin-bottom:1rem}
.sunoanalyzer .section{background:#1a1a1a;border-radius:8px;padding:12px;margin-bottom:10px}

/* Eingebettet KEIN eigenes Grau: Die Bühne hat ein weich gezeichnetes
   Hintergrundbild aus dem Cover, und ein grauer Kasten davor sieht aus
   wie ein Fremdkörper. Stattdessen schwarz mit zehn Prozent DURCHSICHT (also 90 % Deckkraft) -
   das dunkelt das Bild kräftig ab, lässt aber eine Ahnung davon stehen. */
.sunoanalyzer.eingebettet .section{background:rgba(0,0,0,.90)}
/* DER BEFUNDBLOCK UND DIE KARTEN BRAUCHEN DENSELBEN GRUND.

   Nur .section trug ihn. Befunde, Vergleich, Schimmertabelle und der
   Kartenbereich standen durchsichtig auf dem weich gezeichneten Cover -
   bei einem dunklen Bild faellt das nicht auf, bei einem hellen ist die
   Tabelle nicht mehr zu lesen (Caspar_D, 19.08.2026). Dieselben 90 %
   Deckkraft wie ueberall, dieselbe Rundung und Polsterung: Es soll
   nicht wie ein zweites Bauteil aussehen, sondern wie die anderen. */
.sunoanalyzer.eingebettet #sa-befunde,
.sunoanalyzer.eingebettet #sa-karten{background:rgba(0,0,0,.90);
  border-radius:8px;padding:12px;margin-bottom:10px}
.sunoanalyzer.eingebettet .card{background:none}
/* Die Diagrammflächen selbst schwarz: Der Rahmen darf durchscheinen
   und das Coverbild abdunkeln, die Zeichenfläche nicht - dort braucht
   die Kurve einen ruhigen, gleichmäßigen Grund, sonst liest man das
   Bild dahinter mit. */
.sunoanalyzer.eingebettet .chart-pending{background:#000}
.sunoanalyzer.eingebettet canvas{background:#000!important}
.sunoanalyzer.eingebettet .sa-spur .spur-flaeche{background:#000;border-radius:4px}
/* TUFTE: VOR EINER UEBERSCHRIFT MEHR PLATZ ALS DAHINTER.

   Eine Ueberschrift gehoert zu dem, was FOLGT, nicht zu dem, was
   davor stand. Steht sie in der Mitte, liest sie sich als Ende des
   vorigen Blocks. Der Abstand darueber muss deshalb deutlich groesser
   sein als der darunter - hier 14 zu 5. (Caspar_D, 19.08.2026)

   Vorher stand hier nur margin-bottom, also gar kein Abstand nach
   oben: Jede Diagrammbeschriftung klebte am Diagramm darueber. */
.sunoanalyzer .slbl{font-size:11px;color:#9a9aa2;margin:14px 0 5px;
  display:flex;justify-content:space-between}
.sunoanalyzer .section:first-child .slbl{margin-top:0}
/* DIE SECHS STEMS ALS EIN BLOCK (Caspar_D, 24.08.2026: "dichter zusammen
   als ein Block"). Sie zeigen dasselbe Stueck aus sechs Blickwinkeln;
   der uebliche Abstand zwischen Diagrammen wuerde daraus sechs
   Einzelaussagen machen. Nur ueber der ersten bleibt Luft. */
.sunoanalyzer .sa-spur[id^="spur-stem-"]{margin:0;position:relative}
.sunoanalyzer .sa-spur[id^="spur-stem-"] .chart-outer{margin:0}
/* Der Name liegt IN der Spur, nicht darueber. Sonst braucht die
   Beschriftung mehr Platz als die Daten - gemessen 42 px Ueberschrift
   auf 40 px Kurve, macht bei sechs Spuren 505 px statt 264. Wie in der
   Befundspur, wo die Bahnennamen auch im Bild stehen. */
/* DER SOLOKREIS vor jedem Spurnamen. Leer heisst: alles klingt. Ein
   Blob darin heisst: nur diese Spur. Dieselbe Form wie im Equalizer,
   damit man sie nicht neu lernen muss - dort steht sie fuer dasselbe.
   Die .slbl ist fuer Klicks durchlaessig, der Kreis darf sie fangen. */
/* Die Pille sitzt in der Kopfzeile und schaltet die sechs Tonspuren
   zu. Aus ist der Normalfall: Bilder ja, Ton nein. */
.sunoanalyzer .stem-pille{display:inline-block;margin-left:10px;padding:1px 8px;
  border:1px solid #4b93f0;border-radius:9px;font-size:9.5px;font-weight:600;
  letter-spacing:.04em;text-transform:uppercase;color:#4b93f0;cursor:pointer;
  pointer-events:auto;vertical-align:1px;opacity:.75;transition:opacity .12s}
.sunoanalyzer .stem-pille:hover{opacity:1}
.sunoanalyzer .stem-pille.an{background:#4b93f0;color:#0a0a0a;opacity:1}
.sunoanalyzer .stemsolo{display:inline-block;width:11px;height:11px;border-radius:50%;
  border:1.5px solid currentColor;position:relative;margin-right:6px;vertical-align:-1px;
  cursor:pointer;pointer-events:auto;opacity:.75;transition:opacity .12s}
.sunoanalyzer .stemsolo:hover{opacity:1}
.sunoanalyzer .stemsolo.an{opacity:1}
.sunoanalyzer .stemsolo.an::after{content:'';position:absolute;inset:2px;border-radius:50%;
  background:currentColor}
.sunoanalyzer .sa-spur[id^="spur-stem-"] .slbl{
  position:absolute;left:7px;top:3px;z-index:2;margin:0;pointer-events:none;
  text-shadow:0 1px 3px #000,0 0 6px #000}
.sunoanalyzer #spur-stem-kopf{margin:0 0 3px}
/* Ueber die ganze Breite (Caspar_D, 24.08.2026). Die uebliche Regel - 60
   bis 80 Zeichen je Zeile - gilt fuer Fliesstext, den man absatzweise
   liest. Das hier sind zwei Zeilen Bildunterschrift, und jede
   Begrenzung setzt eine Kante, die die Seite sonst nirgends hat. */
/* DIE ERKLAERUNG STEHT UNTER DER ABBILDUNG (Caspar_D, 24.08.2026: "dann
   gibt es keine Lücken bei unvollständigen Zeilen"). Eine Ueberschrift
   muss knapp sein, eine Erklaerung darf ausfuehrlich sein; beides in
   eine Zeile zu zwingen, riss Luecken, sobald der Text kuerzer war als
   die Breite. Farbe wie .erkl - lesbar, aber nachrangig gegenueber dem
   Bild darueber. */
.sunoanalyzer .chart-text{font-size:11px;color:#8a8a8a;line-height:1.5;margin:4px 0 0}
/* Der Hinweis ueber den Karten liegt in deren Raster - ohne diese Zeile
   wird er selbst zur Zelle und bricht nach einem Viertel der Breite um. */
/* Der Kartenhinweis gehoert AUF das Panel, nicht darunter (Caspar_D,
   24.08.2026: "die bild/kartenblock unterschrift liegt nicht auf dem
   gleichen panel, das panel muss groesser, damit das da mit
   raufpasst"). Er steht jetzt im Raster und spannt die volle Breite;
   das Panel waechst dadurch von selbst mit, ohne feste Hoehe. Das
   seitliche Polster bringt das Panel mit - eigenes waere doppelt. */
.sunoanalyzer #sa-karten #karten-text{grid-column:1/-1;margin-top:12px}
/* Der Einzelspuren-Text liegt seit dem 25.08.2026 IM Panel - das
   seitliche Polster kommt von der Sektion, ein eigenes waere doppelt. */
.sunoanalyzer .chart-text b{color:#b0b0b6;font-weight:600}
.sunoanalyzer #stem-hinweis{font-size:11px;color:#8a8a8a;line-height:1.5;margin:4px 0 0}
.sunoanalyzer #stem-hinweis b{color:#b0b0b6;font-weight:600}
/* EINE FORM FUER ALLE UEBERSCHRIFTEN (Caspar_D, 23.08.2026: "gib jedem
   chart und jedem panel vereinheitlichte Ueberschriften, die
   Ueberschrift in Kapitalen und die Erklaerung nochmal mit Gross- und
   Kleinschreibung").

   Der NAME steht in Versalien und traegt weiter die Farbe seiner Kurve;
   die ERKLAERUNG folgt in gewoehnlicher Schreibung und zurueckgenommen.
   So liest man beim Ueberfliegen nur die Namen und findet die Lane, die
   man sucht - dieselbe Ordnung, die die Bahnen der Befundspur mit
   span.kopf schon haben.

   Versalien per text-transform, nicht im Text selbst: Umlaute bleiben
   heil, und wer nach "Stereopanorama" sucht, findet es auch. */
.sunoanalyzer .slbl .nam{text-transform:uppercase;letter-spacing:.06em;
  font-weight:700;font-size:10px;color:#b0b0b6}
.sunoanalyzer .slbl .erkl{font-weight:400;color:#8a8a8a}
.sunoanalyzer input[type=text]{width:100%;padding:7px 10px;font-family:monospace;font-size:11px;border:1px solid #333;border-radius:8px;background:#0a0a0a;color:#eee;margin-bottom:6px}
.sunoanalyzer label{font-size:11px;color:#555;display:block;margin-bottom:3px}
.sunoanalyzer button{padding:7px 16px;font-size:13px;border:1px solid #444;border-radius:8px;background:transparent;color:#eee;cursor:pointer}
.sunoanalyzer button:hover{background:#222}
.sunoanalyzer button.p{background:#09356d;color:#4b93f0;border-color:transparent}
.sunoanalyzer .grid{display:grid;gap:5px;margin:6px 0}
.sunoanalyzer .g4{grid-template-columns:repeat(4,1fr)}
.sunoanalyzer .g2{grid-template-columns:repeat(2,1fr)}
.sunoanalyzer .card{background:#0f0f0f;border-radius:6px;padding:6px 8px;text-align:center}
.sunoanalyzer .card .val{font-size:16px;font-weight:500;color:#4b93f0;margin:2px 0}
.sunoanalyzer .card .lbl{font-size:10px;color:#555}
.sunoanalyzer .gauge{position:relative;height:6px;border-radius:3px;margin-top:4px;margin-bottom:6px;overflow:visible}
.sunoanalyzer .gauge-track{position:absolute;left:0;right:0;top:0;height:100%;border-radius:3px}
.sunoanalyzer .gauge-marker{position:absolute;top:-3px;width:2px;height:12px;border-radius:1px;background:#fff;transform:translateX(-50%);transition:left 0.4s}
.sunoanalyzer canvas{width:100%;border-radius:4px;display:block}
.sunoanalyzer #artwork{width:25%;max-width:200px;min-width:80px;border-radius:10px;object-fit:cover;display:none;flex-shrink:0;height:auto}
.sunoanalyzer #meta{margin-bottom:10px;overflow:hidden}
.sunoanalyzer #meta h2{font-size:15px;font-weight:500;margin-bottom:3px}
.sunoanalyzer #meta-sub{font-size:12px;color:#666;margin-bottom:4px}
.sunoanalyzer .tag{display:inline-block;background:#073d1e;color:#3a7;border-radius:4px;padding:2px 8px;font-size:11px;margin:2px 2px 2px 0}
.sunoanalyzer .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}
.sunoanalyzer audio{width:100%;border-radius:8px;margin:8px 0;accent-color:#4b93f0}
.sunoanalyzer .chart-outer{position:relative}
.sunoanalyzer .playhead{position:absolute;top:0;bottom:0;width:1px;background:rgba(255,255,255,0.55);pointer-events:none;display:none}
.sunoanalyzer .chart-pending{display:flex;align-items:center;justify-content:center;font-size:11px;color:#444;border-radius:4px;background:#0a0a0a;position:relative;overflow:hidden}
.sunoanalyzer .chart-pending::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.03) 50%,transparent 100%);animation:skeleton-pulse 1.8s ease-in-out infinite;transform:translateX(-100%);pointer-events:none}
@keyframes skeleton-pulse{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
.sunoanalyzer .chart-ready::after{display:none}
.sunoanalyzer .section-status{font-size:9px;color:#444;margin-left:8px;vertical-align:middle}
.sunoanalyzer #tt{position:fixed;background:#1e1e1e;border:0.5px solid #444;border-radius:6px;padding:6px 10px;font-size:12px;color:#eee;pointer-events:none;opacity:0;max-width:280px;line-height:1.5;z-index:9999;transition:opacity 0.1s;width:auto;height:auto}
`;
  const MARKUP = `<h1>Suno Audio Analyzer <span style="font-size:10px;color:#444;font-weight:400">v5 · offline</span></h1>
<div id="tt"></div>

<!-- Hier stand der Kopfbereich: ein Eingabefeld fuer eine Suno-Adresse,
     die Wahl zwischen MP3 und WAV, ein Knopf "Analysieren", einer fuer
     eine lokale Datei, ein Fortschrittsbalken. Er gehoerte zum
     eigenstaendigen Analyzer, der sich seinen Ton selbst holte.

     Seit dem Einbetten in die Buehne war er ausgeblendet (siehe die
     CSS-Regel .sunoanalyzer.eingebettet #sa-kopf), am 25.08.2026 ist er
     entfernt worden - mit ihm analyze(), downloadAudio(), runStems()
     und der Kommentar-Generator exportForLLM(), zusammen rund 250
     Zeilen (Caspar_D: "auch die analyzer zeile mit dem voreingestellten
     song gibt es nicht mehr").

     Was BLEIBT und bleiben muss: analyzeFile(). Der Buehnenweg laeuft
     durch sie - er baut aus der Adresse /media/<id>/audio.wav ein
     File-Objekt und reicht es hinein, damit Aufraeumen, Anzeige und die
     drei Analyseschritte nicht verdoppelt werden. -->

<div id="meta" style="display:none;margin-bottom:10px">
  <div style="display:flex;gap:14px;align-items:stretch">
    <!-- Left column: artwork + density spectrum -->
    <div id="meta-left" style="display:flex;flex-direction:column;gap:4px;flex-shrink:0;width:25%;max-width:200px;min-width:80px">
      <img id="artwork" src="" alt="" style="width:100%;height:auto;border-radius:10px;object-fit:cover;display:none">
      <canvas id="density-canvas" style="width:100%;aspect-ratio:1;border-radius:6px;background:#080808;display:none"></canvas>
    </div>
    <!-- Right column: fixed height = artwork + density canvas, scrollable -->
    <div style="flex:1;min-width:0;overflow-y:auto;max-height:var(--meta-left-h,400px)">
      <h2 id="title">—</h2>
      <div id="meta-sub"></div>
      <div id="tags" style="margin-top:4px"></div>
      <div id="lyrics-wrap" style="display:none;margin-top:8px">
        <div style="font-size:11px;color:#555;margin-bottom:4px;cursor:pointer;user-select:none" onclick="var b=document.getElementById('lyrics-body');b.style.display=b.style.display==='none'?'block':'none';this.textContent=b.style.display==='none'?'▸ Lyrics / Prompt anzeigen':'▾ Lyrics / Prompt'">▾ Lyrics / Prompt</div>
        <pre id="lyrics-body" style="font-size:11px;color:#888;line-height:1.7;white-space:pre-wrap;background:#0a0a0a;border-radius:6px;padding:10px;overflow-y:auto;margin:0"></pre>
      </div>
    </div>
  </div>
</div>

<!-- Hier stand der Kommentar-Generator (#export-section): 29 Zeilen
     Markup samt einer Persona-Textarea mit persoenlichem Klartext, die
     seit dem Ausbau von exportForLLM() am 25.08.2026 nichts mehr las.
     In einem oeffentlichen Repo hat so ein Text ohne Funktion nichts
     verloren (Review, bestaetigt). -->

<!-- HIER STAND EIN ZWEITES <audio>.

     Der Analyzer brachte aus seiner Zeit als eigene Seite ein eigenes
     Audioelement mit, samt eigenem Transport und eigener Lautstaerke.
     Eingebettet ist das nicht nur ueberfluessig, es ist schaedlich: Am
     19.08.2026 wanderte drawSpectrum() an die Stelle, an der BEIDE
     Analysewege durchkommen - und damit wurde ein bis dahin toter
     Zweig lebendig, der aus diesem Element eine zweite Tonquelle baute
     und an die Lautsprecher haengte. Zwei Wiedergaben nebeneinander,
     unabhaengig steuerbar.

     HAUSREGEL (19.08.2026): "Es darf nur eine Audioquelle geben.
     Der Player auf der Albumseite ist die Quelle, alles, aber auch
     wirklich alles haengt daran."

     Der Analyzer bekommt von dort: die Zeit (zeit), den Laufzustand
     (laeuft), den Ruecksprung (sprung), das Umschalten (umschalten)
     und den Quellknoten (quelle). Er baut sich nichts davon selbst. -->
<div class="row" id="sa-zoom" style="margin-bottom:10px">
  <span style="font-size:12px;color:#555">Zoom</span>
  <input type="range" id="zoom-slider" min="0" max="5" step="0.1" value="0" style="flex:1;accent-color:var(--bakzent,var(--akzent,#4b93f0))">
  <span id="zoom-label" style="font-size:12px;color:var(--bakzent,var(--akzent,#4b93f0));min-width:32px">1×</span>
  <button onclick="__SA.resetZoom()" style="padding:4px 10px;font-size:11px">Reset</button>
</div>

<div id="sa-befunde">
  <div class="bf-kopf">
    <span>Datenbasierte Vorschläge zur Verbesserung</span>
    <span class="bf-leise">plattformabhängig</span>
  </div>
  <!-- Registerlaschen; wird der Platz zu klein, tritt das Klappfeld
       daneben an ihre Stelle (siehe registerAnpassen). -->
  <div class="bf-register" id="sa-register"></div>
  <select id="sa-ziel" class="bf-klapp" title="Plattform"></select>
  <div class="bf-plattform" id="sa-plattform"></div>
  <div id="sa-vergleich"></div>
  <!-- Gleiche Bauart wie die uebrigen Spuren: volle Breite, viewBox-Zoom,
       Spielkopf. Nur so steht die Zeitachse ueber allen Diagrammen an
       derselben Stelle. -->
  <!-- Derselbe .section-Rahmen wie bei allen Spuren. Ohne ihn fehlt die
       Polsterung, und die Zeitachse stand 12 px versetzt zu den
       uebrigen Diagrammen. -->
  <div class="section sa-spur" id="spur-befund" style="display:none">
    <div class="chart-outer" id="sa-spur-aussen" style="height:0">
      <div id="befundspur-canvas" class="spur-flaeche"></div>
      <div class="playhead" id="ph-befundspur"></div>
      <div id="sa-spur-namen"></div>
      <!-- Die Kurvenform sitzt AN der Huellkurve, nicht am Fuss der
           Sektion (Caspar_D, 25.08.2026: "die schaltflaechen muessen
           direkt unter der Huellkurve sein, nicht unter den
           Blockdiagrammen"). Alle Bahnen stecken in EINEM SVG - die
           Leiste wird deshalb ueber das Bild gelegt und beim Zeichnen
           auf die Unterkante der ersten Bahn gesetzt. -->
      <div class="spur-wahl" id="sa-kurvenwahl"></div>
    </div>
  </div>
  <div id="sa-urteil"></div>
  <div class="chart-text">Oben werden die Abschnitte aus dem Lyricsprompt gezeigt, darunter die Hüllkurve des Songs (Lautheit), die Schläge (BPM) und die Blockdiagramme mit geprüften Befunden zu Abschnitten, in denen sich die Stereosignale auslöschen können und in denen der Pegel über dem Standard liegt. Sie dient der Orientierung vor dem detaillierten Blick auf die Einzelmessungen — der Spielkopf (senkrechte weiße Linie) läuft zugleich durch alle Bahnen, die den Track über den Zeitverlauf beschreiben, sodass jede Beobachtung sofort einer Stelle im Stück zugeordnet werden kann.</div>
</div>

<div id="sa-karten">
<!-- ==================================================================
     DREI BLOECKE STATT EINER HALDE

     Bis zum 19.08.2026 standen 35 Karten in einem Raster: Lautheit
     neben Plays, True Peak neben Modell. Das ist nicht unordentlich,
     sondern irrefuehrend - die eine Sorte ist aus dem Ton gerechnet und
     nachpruefbar, die andere aus dem Katalog abgeschrieben und sagt
     ueber den Klang nichts. (Caspar_D: "damit abgeschriebene Entitaeten
     sich nicht mehr mit Ergebnissen vermischen.")

     Die Kopfzeilen laufen ueber die volle Breite, jede mit ihrer
     Tabelle darunter - kein Rahmen, keine Spalten. Wer sucht, liest
     weiterhin alles in einem Zug von oben nach unten.
     ================================================================== -->
<div class="kartenblock">
<div class="karten-kopf">Pegel und Lautheit</div>
<div class="grid g4">
  <div class="card"><div class="val" id="v-lufs">—</div><div class="lbl">Wie laut insgesamt? <i>LUFS</i></div></div>
  <div class="card"><div class="val" id="v-lra">—</div><div class="lbl">Atmet der Song? <i>Schwankung LU</i></div></div>
  <div class="card"><div class="val" id="v-tp">—</div><div class="lbl">Wie nah an der Decke? <i>True Peak dBTP</i></div></div>
  <div class="card"><div class="val" id="v-plr">—</div><div class="lbl">Wie viel Luft zur Spitze? <i>Reserve PLR</i></div></div>
  <div class="card"><div class="val" id="v-psr">—</div><div class="lbl">Luft an der lautesten Stelle <i>Reserve PSR</i></div></div>
  <div class="card"><div class="val" id="v-check">—</div><div class="lbl">Technisch sauber? <i>Anschläge · Gleichspannung · Phase</i></div></div>
  <div class="card"><div class="val" id="v-clip">—</div><div class="lbl">Werte am Anschlag <i>Clipping</i></div></div>
  <div class="card"><div class="val" id="v-dc">—</div><div class="lbl">Sitzt die Welle mittig? <i>Gleichspannung</i></div></div>
  <div class="card"><div class="val" id="v-korr">—</div><div class="lbl">Stereo verträglich? <i>Phasenkorrelation</i></div></div>
  <div class="card"><div class="val" id="v-ende">—</div><div class="lbl">Endet er weich? <i>Ende</i></div></div>
  <div class="card"><div class="val" id="v-grenz">—</div><div class="lbl">Bis wohin reichen die Höhen? <i>Tiefpasskante</i></div></div>
</div>
</div>
<div class="kartenblock">
<div class="karten-kopf">Klang und Form</div>
<div class="grid g4">
  <div class="card"><div class="val" id="v-dur">—</div><div class="lbl">Dauer</div></div>
  <div class="card"><div class="val" id="v-loud">—</div><div class="lbl">Wie kräftig im Schnitt? <i>dB</i></div><div class="gauge" id="g-loud"><div class="gauge-track"></div><div class="gauge-marker" id="gm-loud"></div></div></div>
  <div class="card"><div class="val" id="v-dyn">—</div><div class="lbl">Laut-leise-Abstand <i>Dynamik dB</i></div><div class="gauge" id="g-dyn"><div class="gauge-track"></div><div class="gauge-marker" id="gm-dyn"></div></div></div>
</div>
<div class="grid g4">
  <div class="card"><div class="val" id="v-stereo">—</div><div class="lbl">Wie breit ist das Stereo? <i>Breite</i></div><div class="gauge" id="g-stereo"><div class="gauge-track"></div><div class="gauge-marker" id="gm-stereo"></div></div></div>
</div>
<div class="grid g4">
  <div class="card"><div class="val" id="v-key">—</div><div class="lbl">Welche Tonart?</div></div>
</div>
<div class="grid g4">
  <div class="card"><div class="val" id="v-entropy">—</div><div class="lbl">Dicht oder aufgeräumt? <i>Spektr. Entropie</i></div><div class="gauge" id="g-entropy"><div class="gauge-track"></div><div class="gauge-marker" id="gm-entropy"></div></div></div>
</div>
<div class="grid g4">
  <div class="card"><div class="val" id="v-symmetry">—</div><div class="lbl">Wohin entwickelt er sich? <i>Energie-Form</i></div></div>
  <div class="card"><div class="val" id="v-vocal" style="font-size:13px">—</div><div class="lbl">Welche Stimmlage? <i>Stimme</i></div></div>
</div>
</div>
<div class="kartenblock">
<div class="karten-kopf">Aus dem Katalog</div>
<div class="grid g4">
  <div class="card"><div class="val" id="v-plays">—</div><div class="lbl">Plays</div></div>
  <div class="card"><div class="val" id="v-likes">—</div><div class="lbl">Likes</div></div>
  <div class="card"><div class="val" id="v-comments">—</div><div class="lbl">Kommentare</div></div>
  <div class="card"><div class="val" id="v-ratio">—</div><div class="lbl">Plays / Like</div></div>
  <div class="card"><div class="val" id="v-age">—</div><div class="lbl">Alter</div></div>
  <div class="card"><div class="val" id="v-ppd">—</div><div class="lbl">Plays / Tag</div></div>
  <div class="card"><div class="val" id="v-model">—</div><div class="lbl">Modell</div></div>
</div>
</div>

<div class="chart-text" id="karten-text">Wichtige globale Parameter, die den Track klassifizieren helfen.</div>
</div>

<div id="custom-player" style="user-select:none">
  <!-- Zeit und Lautstaerke standen hier und steuerten das eigene
       Audioelement. Beides gibt es im Pult der Buehne, und zwar fuer
       die EINE Quelle. Uebrig bleibt die Wellenform darunter - sie ist
       Anzeige, nicht Wiedergabe. -->
  <!-- Waveform canvas with floating play button -->
  <!-- margin:0 12px richtet die Wellenform auf dieselbe Zeitachse wie
       alle Spuren aus: Die liegen in .section mit 12 px Polsterung,
       dieser Kasten hat keinen solchen Rahmen. Gemessen stand er bei
       x 29 mit 496 px Breite gegen 41/472 bei allen anderen. -->
  <div class="chart-outer" style="height:48px;cursor:pointer;background:#0a0a0a;border-radius:4px;margin:0 12px"
    onmousedown="__SA.seekStart(event)" ontouchstart="__SA.seekStart(event)">
    <div id="main-waveform-canvas" style="height:48px;background:#0a0a0a;border-radius:4px"></div>
    <div id="prog-head" style="position:absolute;top:0;bottom:0;width:1px;background:rgba(255,255,255,0.55);pointer-events:none;left:0%"></div>
    <!-- Läuft mit dem Spielkopf mit und sagt, wo man ist. -->
    <div id="sa-zeitmarke">0:00</div>
    <!-- Floating play button left -->
    <button id="pp-btn" onclick="event.stopPropagation();__SA.togglePlay()"
      style="position:absolute;left:0;top:0;height:100%;width:44px;
      border:none;border-right:1px solid #4b93f044;background:#4b93f022;
      color:#4b93f0;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center">▶</button>
    <!-- Hidden prog-bar/fill for compat -->
    <div id="prog-bar" style="position:absolute;inset:0;pointer-events:none;opacity:0">
      <div id="prog-fill" style="height:100%;background:#4b93f0;width:0%"></div>
    </div>
  </div>
</div>
<!-- DIE EINZIGE ANZEIGE, DIE JETZT ZEIGT.

     Sie stand bis zum 19.08.2026 ganz unten, hinter zwei
     Spektrogrammen von je 407 px - also rund 3.500 px unterhalb des
     Spielkopfs. Alle anderen Diagramme zeigen den ganzen Song und sind
     ueberall gleich brauchbar; dieses eine zeigt den Augenblick und ist
     nur dort brauchbar, wo man gleichzeitig hoert. Deshalb steht es
     jetzt unmittelbar unter der Wellenform: Ueberblick und Augenblick
     nebeneinander, beide ohne Scrollen. -->
<div class="section" id="spur-spektrum">
  <div class="slbl"><span id="sa-spektrum-titel"><span class="nam">Frequenzspektrum</span> — <span class="erkl">live</span></span></div>
  <!-- WELCHES SIGNAL (Caspar_D, 26.08.2026: "wie wärs mit Registern,
       Rohsignal, Endsignal" - benannt als "Codiertes Signal /
       Ausgabe-Signal"). Als Registerzeile im Hausschnitt: dieselben
       Unterstrich-Reiter wie beim Spektrogramm darunter ("die register
       bitte, wie unten bei fft, gleiches design").

       Versteckt, solange die Buehne keinen zweiten Abgriff
       hereinreicht - ein Umschalter mit nur einer Stellung ist keiner. -->
  <div class="bf-register" id="sa-signal-wahl" data-wert="codiert" style="display:none">
    <button type="button" data-s="codiert" class="an" title="Das Stück, wie es in der Datei steht — vor allem, was KlangTresor damit tut">Codiertes Signal</button>
    <button type="button" data-s="ausgabe" title="Nach Equalizer, Kompressor, Breite, Hall und Echo">Ausgabe-Signal</button>
    <button type="button" data-s="beide" title="Beides übereinander — was sich deckt, trägt die Hausfarbe des Kanals">Überlagert</button>
  </div>
  <div class="chart-outer"><canvas id="freq-canvas" style="height:150px;background:#0a0a0a"></canvas></div>
  <!-- Der Text wird mit dem Modus umgeschrieben, siehe
       spektrumTexteSetzen() - die Kanalfarben gelten nur in der
       gespiegelten Ansicht. -->
  <div class="chart-text" id="sa-spektrum-text"></div>
  <!-- Der Umschalter steht UNTER dem Diagramm, wie die Profilwahl der
       Spuren. Symbole statt Woerter: die eine Form zeigt Balken auf
       einer Grundlinie, die andere Balken beiderseits einer Mittellinie
       - das ist genau der Unterschied, um den es geht. -->
  <div class="spur-wahl">
    <span class="spur-profil" id="sa-spektrum-wahl" data-wert="gespiegelt">
      <button data-m="gespiegelt" class="an" title="Links oben, rechts unten — an einer gemeinsamen Achse gespiegelt"><svg viewBox="0 0 14 11" width="14" height="11"><path d="M0 5.5H14M2.5 5.5V2.5M2.5 5.5V8.5M6 5.5V1.5M6 5.5V9.5M9.5 5.5V3.2M9.5 5.5V7.8M12.5 5.5V4.3M12.5 5.5V6.7" fill="none" stroke="currentColor" stroke-width="1.2" vector-effect="non-scaling-stroke"/></svg></button>
      <button data-m="summe" title="Beide Kanäle zusammen"><svg viewBox="0 0 14 11" width="14" height="11"><path d="M0 10H14M2 10V6.5M5 10V3M8 10V1.5M11 10V5M13.5 10V7.5" fill="none" stroke="currentColor" stroke-width="1.2" vector-effect="non-scaling-stroke"/></svg></button>
    </span>
  </div>
</div>
<!-- DIE SECHS STEMS (Caspar_D, 24.08.2026: "6 Huellkurven"). Getrennt von
     bin/stems.js, vermessen von bin/toene.js.
     Die Farben sind die der abgeschalteten Bahnen - sie waren frei
     geworden. Orange und Blau bleiben ausgespart, die stehen im Haus
     fuer tief/hoch und links/rechts. -->
<!-- EIN PANEL statt sieben Sektionen (Caspar_D, 25.08.2026: "die
     Einzelspuren inklusive Legenden auf ein Panel legen") - dieselbe
     Bauweise wie bei den Lautheitsverlaeufen: aussen die Sektion mit
     Kopf und EINER Bildunterschrift, innen die Spuren als schlichte
     Bloecke. spurSichtSetzen() greift ueber die IDs und die svg-Elemente,
     nicht ueber die Sektionsklasse - die viewBox laeuft also unveraendert
     mit. Der Hinweistext lag vorher AUSSERHALB jeder Sektion und musste
     sein Seitenpolster selbst mitbringen; im Panel entfaellt das. -->
<div class="section" id="spur-stems" style="display:none">
<div class="slbl" id="spur-stem-kopf"><span class="spur-titel"></span></div>
<div class="sa-spur" id="spur-stem-drums" style="display:none">
  <div class="slbl"><span class="spur-titel"></span></div>
  <div class="chart-outer" style="height:44px"><div id="stemdrumsspur-canvas" class="spur-flaeche" style="height:44px"></div>
    <div class="playhead" id="ph-stemdrumsspur"></div></div>
</div>
<div class="sa-spur" id="spur-stem-bass" style="display:none">
  <div class="slbl"><span class="spur-titel"></span></div>
  <div class="chart-outer" style="height:44px"><div id="stembassspur-canvas" class="spur-flaeche" style="height:44px"></div>
    <div class="playhead" id="ph-stembassspur"></div></div>
</div>
<div class="sa-spur" id="spur-stem-vocals" style="display:none">
  <div class="slbl"><span class="spur-titel"></span></div>
  <div class="chart-outer" style="height:44px"><div id="stemvocalsspur-canvas" class="spur-flaeche" style="height:44px"></div>
    <div class="playhead" id="ph-stemvocalsspur"></div></div>
</div>
<div class="sa-spur" id="spur-stem-guitar" style="display:none">
  <div class="slbl"><span class="spur-titel"></span></div>
  <div class="chart-outer" style="height:44px"><div id="stemguitarspur-canvas" class="spur-flaeche" style="height:44px"></div>
    <div class="playhead" id="ph-stemguitarspur"></div></div>
</div>
<div class="sa-spur" id="spur-stem-piano" style="display:none">
  <div class="slbl"><span class="spur-titel"></span></div>
  <div class="chart-outer" style="height:44px"><div id="stempianospur-canvas" class="spur-flaeche" style="height:44px"></div>
    <div class="playhead" id="ph-stempianospur"></div></div>
</div>
<div class="sa-spur" id="spur-stem-other" style="display:none">
  <div class="slbl"><span class="spur-titel"></span></div>
  <div class="chart-outer" style="height:44px"><div id="stemotherspur-canvas" class="spur-flaeche" style="height:44px"></div>
    <div class="playhead" id="ph-stemotherspur"></div></div>
</div>
  <!-- WAS MAN HIER HOERT UND WAS NICHT (Caspar_D, 24.08.2026). Die
       Trennung ist gut genug zum Messen und nicht gut genug zum
       Produzieren - das gehoert dazugesagt, sonst haelt sie jemand fuer
       Studiospuren. Die Zahlen dahinter sind gemessen: unterhalb 300 Hz
       liegt die Korrelation zwischen Stimme und Schlagzeug bei 0,006,
       oberhalb 8 kHz bei 0,164. -->
  <div id="stem-hinweis" class="chart-text">Getrennt mit <b>htdemucs_6s</b>, dem besten frei verfügbaren Modell
    für sechs Spuren — von echten Studiospuren aber weit entfernt: Zischlaute wandern hörbar
    ins Schlagzeug, Gitarre und Klavier sind die schwächsten Spuren. Für die Detektion von Tonart und
    Stimmlage ist die Qualität ausreichend, weil beide unterhalb 900 Hz gemessen werden. Für das
    Nachhören der Solospuren muss oben die <b>Kanal-Inspektion</b> eingeschaltet werden — erst dann
    werden die sechs Tonspuren geladen und die Kreise erscheinen. Sie laufen dann stumm mit, damit das
    Umschalten lückenlos ist; das kostet allerdings dauerhaft Rechenzeit, weshalb sie im Normalbetrieb
    ausgeschaltet bleiben. Die Hüllkurven sind davon unabhängig und immer zu sehen.</div>
</div>





<div id="sa-linien"></div>

<!-- EIN PANEL FUER DIE DREI LAUTHEITSVERLAEUFE (Caspar_D, 25.08.2026:
     "fasse bitte im analyzer Fenster folgende 3 charts in einem Panel
     zusammen und gib ihm nur eine Bildunterschrift").

     Die drei gehoeren zusammen: dieselbe Groesse in zwei Fenstern und
     ihre Differenz. Als drei Abschnitte mit drei Unterschriften stand
     dreimal fast dasselbe da, und der Zusammenhang - die dritte Kurve
     IST die Differenz der beiden darueber - musste aus den Texten
     erschlossen werden. Jede Kurve behaelt ihren eigenen Titel mit
     Fenstergroesse und Wertebereich; nur der erklaerende Text ist
     einer geworden und sagt jetzt, was die drei miteinander zu tun
     haben.

     Die inneren IDs bleiben, wie sie waren: spurMalen() und
     abweichungSpurZeichnen() sprechen sie an, ebenso die Playheads
     und die Sichtbarkeitsschleife. -->
<div class="section" id="spur-lautheit">
  <div class="slbl"><span><span class="nam">Lautheitsverläufe</span> — <span class="erkl">derselbe Song in zwei Zeitfenstern und ihre Differenz</span></span></div>
  <div class="sa-spur" id="spur-momentan">
    <div class="slbl"><span class="spur-titel"></span></div>
    <div class="chart-outer" style="height:44px"><div id="momentanspur-canvas" class="spur-flaeche"></div><div class="playhead" id="ph-momentanspur"></div></div>
  </div>
  <div class="sa-spur" id="spur-kurz">
    <div class="slbl"><span class="spur-titel"></span></div>
    <div class="chart-outer" style="height:44px"><div id="kurzspur-canvas" class="spur-flaeche"></div><div class="playhead" id="ph-kurzspur"></div></div>
  </div>
  <div class="sa-spur" id="spur-abweichung">
    <div class="slbl"><span class="spur-titel"></span></div>
    <div class="chart-outer" style="height:56px"><div id="abweichungspur-canvas" class="spur-flaeche" style="height:56px"></div><div class="playhead" id="ph-abweichungspur"></div></div>
  </div>
  <div class="chart-text">Dieselbe Größe nach EBU R 128, dreimal betrachtet. <b>Oben</b> ein Fenster von 400 Millisekunden: es folgt dem Stück beinahe augenblicklich und so schnell wie das Gehör, macht also einzelne Einsätze und Pausen sichtbar; die durchgezogene Linie markiert die integrierte Lautheit des ganzen Stücks. <b>In der Mitte</b> dasselbe über drei Sekunden — Einzelereignisse sind weggeglättet, und es zeigt sich, wie laut ein Abschnitt empfunden wird. An dieser Größe orientieren sich die Zielwerte der Streamingdienste, die als gestrichelte Linie eingezeichnet sind. <b>Unten</b> die Differenz der beiden: Wo der Augenblick über seiner Umgebung liegt, ragt die Fläche nach oben, wo er darunter bleibt, nach unten. Damit wird sichtbar, was in den Kurven darüber nur im Vergleich zu erkennen wäre — Akzente und Einbrüche.</div>
</div>


<!-- STEHT HINTER DER ABWEICHUNG, NICHT VOR DEN KURVEN (Caspar_D,
     24.08.2026: "die gestapelten zeitintervalle gehoeren doch rein
     logisch unter das Abweichungsdiagramm, oder?").
     Er hat recht: Dieses Bild fasst zusammen, was Signalenergie,
     Crest, Momentan- und Kurzzeitlautheit einzeln zeigen - es stand
     vor dem, was es zusammenfasst. Jetzt schliesst es die Reihe der
     Verlaeufe ab und leitet zum Histogramm ueber, das dieselben Daten
     noch einmal als Verteilung zeigt. -->
<div class="section sa-spur" id="spur-stapel">
  <div class="slbl"><span class="spur-titel"></span></div>
  <div class="chart-outer" style="height:120px"><div id="stapelspur-canvas" class="spur-flaeche" style="height:120px"></div><div class="playhead" id="ph-stapelspur"></div></div>
  <div class="chart-text">Der Song wird in Ereignis-Bänder unterschiedlicher Dauer zerlegt und je Zeitpunkt auf hundert Prozent normiert. Gezeigt wird, ob <span style="color:#d8d81c">kurze</span> oder <span style="color:#687d98">lange</span> Ereignisse den Augenblick im Track dominieren: unten die langsamen Bewegungen, oben die kurzen Spitzen. Gerechnet wird in Energie und nicht in Dezibel, weil nur dort die Summe der Teile das Ganze ergibt.</div>
</div>

<div class="section"><div class="slbl"><span><span class="nam">Lautheitshistogramm</span> — <span class="erkl">wie laut ist wieviel Prozent des Liedes (1-dB-Fächer, ohne Stille)</span></span></div>
  <div class="chart-outer"><canvas id="lufshist-canvas" style="height:90px;background:#0a0a0a" class="chart-pending">berechne…</canvas></div>
  <div class="chart-text">Lautheitsverteilung des Tracks in Fächern von einem Dezibel und ohne die Stille. Ein schmaler, hoher Berg steht für einen durchgehend gleich lauten Track, eine breite Verteilung für ein dynamisches Stück. Die Form verrät die Mastering-Entscheidung deutlicher als jeder Einzelwert.</div>
</div>
<div class="section sa-spur" id="spur-stereo">
  <div class="slbl"><span class="spur-titel"></span></div>
  <div class="chart-outer" style="height:192px"><div id="stereospur-canvas" class="spur-flaeche" style="height:192px"></div><div class="playhead" id="ph-stereospur"></div><div id="sa-stereo-namen"></div></div>
  <div class="chart-text">Die Verteilung der Frequenzbänder über das Stereobild — oben die Höhen und unten der Bass. Was nach oben ragt, liegt <span style="color:#f97b14">links</span>, was nach unten ragt, <span style="color:#4b93f0">rechts</span>; jedes Band ist auf sein eigenes 95. Perzentil normiert. Ein Bass, der nicht in der Mitte sitzt, fällt hier sofort auf.</div>
</div>

<!-- DIE KORRELATIONSSPUR (25.08.2026, Review Block 6). korrVerlauf wird
     seit jeher im Worker gerechnet (400-ms-Fenster, NaN fuer stille) und
     lag in jeder Ablage - sichtbar war davon nur die Befundbahn fuer
     Strecken unter -0,10. Der VERLAUF ist aber die Auskunft: wie eng ein
     Modell mischt, ob die Breite ueber Strophen und Refrains atmet, ob
     v4.5 breiter generiert als v2. Rechenkosten null, die Daten sind da. -->
<div class="section sa-spur" id="spur-korr" style="display:none">
  <div class="slbl"><span class="spur-titel"></span></div>
  <div class="chart-outer" style="height:56px"><div id="korrspur-canvas" class="spur-flaeche" style="height:56px"></div><div class="playhead" id="ph-korrspur"></div></div>
  <div class="chart-text">Wie ähnlich linker und rechter Kanal klingen, über die Zeit: <b>+1</b> heißt beide spielen dasselbe (schmal, aber mono-fest), <b>0</b> heißt völlig unabhängig (breit), und <b>unter null</b> heißt gegenphasig — beim Zusammenrechnen auf Mono löscht sich dort etwas aus. Die gestrichelte Linie markiert die Schwelle, ab der die Befundbahn oben eine Auslöschung meldet.</div>
</div>

<div class="section"><div class="slbl"><span><span class="nam">Klangveränderung (Spektrale Fluktuation)</span> — <span class="erkl">Helligkeit = Änderungsrate pro Frequenzband · Bass unten · Höhen oben</span></span></div>
  <div class="chart-outer"><canvas id="flux-canvas" style="height:160px;background:#0a0a0a" class="chart-pending">berechne…</canvas><div class="playhead" id="ph-flux"></div></div>
  <div class="chart-text">Momentane Änderung des Spektrums, aufgelöst nach Frequenzbändern. Helle Stellen bedeuten Bewegung, dunkle Stillstand: Ein liegender Akkord erscheint dunkel, ein Trommelwirbel hell. Die Abbildung zeigt also nicht, was lange klingt oder still ist, sondern in welchem Frequenzband sich etwas stark ändert. Die acht Bänder sind am linken Rand beschriftet und reichen von 20–40 Hz ganz unten bis 2500–20000 Hz ganz oben; jedes ist auf sein eigenes 95. Perzentil normiert, sodass auch leise Bänder ihre Bewegung zeigen.</div>
</div>


<!-- ZWEI BILDER, EIN ABSCHNITT (Caspar_D, 25.08.2026: "wir bauen beide
     Bilder in ein 2-Registerlaschen-System, lassen aber die
     Zwischenschlagversion oben stehen"). Sie zeigen dieselben zwoelf
     Tonklassen, nur anders gemessen - nebeneinander sind sie der Beleg
     dafuer, dass Noten nur zwischen den Schlaegen messbar sind.
     Die x-tel-Leiste steht UNTER dem Bild, nicht darueber: So bleibt die
     Oberkante beider Laschen auf derselben Hoehe und beim Umschalten
     huepft nichts (Caspar_D: "damit es kein Huepfen beim Hin- und
     Herschalten der Register gibt"). -->
<div class="section sa-spur" id="spur-noten">
  <div class="slbl"><span class="spur-titel"></span></div>
  <div class="bf-register" id="noten-register">
    <button type="button" data-lasche="takt" class="an">Signal zwischen Taktschlägen</button>
    <button type="button" data-lasche="alles">Gesamtes Signal</button>
  </div>

  <div id="spur-chroma-takt">
    <div class="chart-outer" style="height:160px"><div id="chromataktspur-canvas" class="spur-flaeche" style="height:160px"></div>
      <div class="playhead" id="ph-chromataktspur"></div></div>
    <!-- DIE TEILUNG ALS EIGENE BAHN (Caspar_D, 24.08.2026). Sie beantwortet
         eine andere Frage als das Bild darüber: nicht WAS klingt, sondern
         WIE FEIN dort gemessen werden musste - und damit, wo sich im Stück
         viel bewegt. -->
    <!-- 4 px Luft zur Piano-Roll (Caspar_D, 25.08.2026: "mit etwas Abstand
         zur Piano-Roll") - die Bahn beantwortet eine andere Frage und soll
         nicht wie deren unterste Zeile lesen. Sie stand bis zum 25.08.2026
         ÜBER dem Bild; seit die beiden Fassungen sich eine Lasche teilen,
         steht sie darunter, damit die Oberkante beider Bilder auf gleicher
         Höhe bleibt und beim Umschalten nichts hüpft. -->
    <div class="chart-outer" style="height:11px;margin-top:4px"><div id="taktrasterspur-canvas" class="spur-flaeche" style="height:11px"></div></div>
    <div class="chart-text">Nicht je Rechenfenster gemittelt, sondern je Notenzone
    zwischen zwei Schlägen — der Anschlag am Zonenanfang bleibt ausgespart, weil dort der Ton noch
    nicht steht. Wo sich der Toninhalt innerhalb einer Zone ändert, wird sie halbiert und nötigenfalls
    geviertelt; bleibt er gleich, bleibt das lange Fenster, und das ist zugleich das genauere. Die
    Prozentangaben im Titel beziehen sich auf Taktschläge, nicht auf Zonen — ein geviertelter Schlag
    ergibt vier Zonen und ein ganzer eine, was die feine Teilung sonst um den Faktor vier
    überzeichnet.
    Statt tausender verschmierter Spalten steht so je Note ein Block. Vor allem aber wird hier nicht
    ein lineares Rechenraster auf die Halbtöne gerundet, sondern direkt bei jeder Halbtonfrequenz
    gemessen — mit einer Fensterlänge, die sich nach der Frequenz richtet: tiefe Töne über rund
    260 Millisekunden, hohe über acht. Gemessen wird in beiden Kanälen, und addiert werden die Beträge — nicht die Signale, denn gegenphasige Anteile würden sich beim Mischen auslöschen. Im Bass ist das der ganze Unterschied, denn dort deckt ein
    Rechenfenster der alten Auflösung elf Halbtöne auf einmal ab.</div>
  </div>

  <div id="spur-chroma" style="display:none">
    <div class="chart-outer" style="height:160px"><div id="chromaspur-canvas" class="spur-flaeche" style="height:160px"></div><div class="playhead" id="ph-chromaspur"></div></div>
    <div class="chart-text">Die Signale aller Oktaven sind auf die zwölf Halbtöne konsolidiert, die Oktav-Lage geht dabei verloren. Man sieht, welche Töne über die Zeit klingen und wie stark. Die Zeilen tragen die Farben der Klaviatur, damit sich die Halbtöne zwischen ihren Nachbarn einordnen lassen; normiert wird auf das 95. Perzentil, sodass ein einzelner Ausreißer das Bild nicht verschiebt. <b>Und genau daran sieht man, warum oben anders gemessen wird:</b>
      Das lineare Rechenraster teilt die zwölf Tonklassen ungleich auf — bei 48 kHz fallen auf F# und A#
      je neun Rechenfächer, auf C und D nur je vier. Diese Reihen sammeln deshalb dauernd Energie ein,
      ob dort ein Ton steht oder nicht: Sie sind die hellsten und zugleich die ruhigsten des Bildes und
      unterscheiden gar nichts mehr. In jedem Song sind es mindestens zwei solcher Reihen, und welche es
      trifft, hängt allein an der Abtastrate — bei 44,1 kHz nicht F#, sondern F und A. Die Messung
      zwischen den Schlägen hat das nicht: Dort lebt jede der zwölf Reihen, in allen 321 Stücken des
      Archivs ohne Ausnahme.</div>
  </div>
</div>
<!-- ZWEI SPEKTROGRAMME, EIN ABSCHNITT (Caspar_D, 25.08.2026: "wir packen
     erstmal das, was wir haben, in ein Registerpanel"). Gewuenscht waren
     vier Laschen - L, R, L+R und die Seitenlage -, aber R und L+R gibt es
     im Rechenkern nicht: magR wird gerechnet und weggeworfen, und die
     Rahmen sind nach dem Zeichnen nicht mehr greifbar (Befund 12 in
     docs/ANALYZER-REVIEW.md). Bis das behoben ist, sind es die zwei
     vorhandenen Bilder.

     BEIDE BILDER LIEGEN UEBEREINANDER, die zugeklappte Lasche wird mit
     visibility ausgeblendet, NICHT mit display:none. Der Grund ist
     handfest: Die Zeichenfunktionen setzen c.width=c.offsetWidth, und bei
     display:none ist die null - der Canvas bliebe leer, und nachzeichnen
     kann man nicht, weil die Rahmen dann schon weg sind. Mit visibility
     behaelt er seine Breite, zeichnet beim Empfang mit, und der Lesekopf
     rechnet ebenfalls weiter richtig (er nimmt dieselbe offsetWidth).
     Nebenbei kann so nichts huepfen: Beide Bilder haben dieselbe Hoehe
     und stehen an derselben Stelle. -->
<div class="section" id="spur-spektro">
  <div class="slbl"><span class="spur-titel"><span class="nam">Spektrogramm</span> — <span class="erkl">lokal Z-normiert · dunkel=Stille · hell=Signal</span></span></div>
  <div class="bf-register" id="spektro-register">
    <button type="button" data-spektro="l" class="an">FFT(L)</button>
    <button type="button" data-spektro="r">FFT(R)</button>
    <button type="button" data-spektro="summe">|L|+|R|</button>
    <button type="button" data-spektro="pan">(|L|−|R|)/(|L|+|R|)</button>
  </div>
  <div style="position:relative;height:180px">
    <div class="chart-outer" id="spektro-feld-l" style="position:absolute;left:0;right:0;top:0;margin:0"><canvas id="spectro-canvas" style="height:180px;background:#0a0a0a" class="chart-pending">berechne…</canvas><div class="playhead" id="ph-spectro"></div></div>
    <div class="chart-outer" id="spektro-feld-r" style="position:absolute;left:0;right:0;top:0;margin:0;visibility:hidden"><canvas id="rechtsspectro-canvas" style="height:180px;background:#0a0a0a"></canvas><div class="playhead" id="ph-rechtsspectro"></div></div>
    <div class="chart-outer" id="spektro-feld-summe" style="position:absolute;left:0;right:0;top:0;margin:0;visibility:hidden"><canvas id="summespectro-canvas" style="height:180px;background:#0a0a0a"></canvas><div class="playhead" id="ph-summespectro"></div></div>
    <div class="chart-outer" id="spektro-feld-pan" style="position:absolute;left:0;right:0;top:0;margin:0;visibility:hidden"><canvas id="stereospectro-canvas" style="height:180px;background:#0a0a0a" class="chart-pending">berechne…</canvas><div class="playhead" id="ph-stereospectro"></div></div>
  </div>
  <div id="spektro-text-l"><div class="chart-text">Die Frequenzen über die Zeit: waagerecht die Zeit, senkrecht die Frequenz, die Farbrampe (<span style="color:#78787d">schwarz</span> – <span style="color:#9a9aa2">grau</span> – <span style="color:#e6e6e6">weiß</span> – <span style="color:#f9531c">orangerot</span>) codiert die Signalstärke. Normiert wird lokal, damit auch leise Passagen ihre Struktur zeigen — die Helligkeit ist deshalb kein absolutes Maß und zwischen zwei Songs nicht vergleichbar. Ein Band am oberen Rand markiert Stellen, an denen das Signal abgeschnitten ist. Die elf waagerechten Linien bilden ein Notensystem: unten die fünf Linien des Bassschlüssels (G2 bis A3), oben die des Violinschlüssels (E4 bis F5) und dazwischen, dünner gezeichnet, die Hilfslinie C4 für das eingestrichene C. An ihnen lässt sich ablesen, in welcher Lage ein Klang liegt.</div></div>
  <div id="spektro-text-r" style="display:none"><div class="chart-text">Dasselbe Bild für den <b>rechten</b> Kanal. Nebeneinander gelesen zeigen die beiden, wie die Mischung aufgeteilt ist: Was nur in einem der Bilder steht, liegt hart auf einer Seite; was in beiden gleich aussieht, steht in der Mitte. Jedes Band ist auf sein <i>eigenes</i> Rauschen gestreckt — auch hier, mit den Perzentilen des rechten Kanals, denn die des linken würden das Bild systematisch zu hell oder zu dunkel zeichnen, je nachdem wohin gemischt wurde.</div></div>
  <div id="spektro-text-summe" style="display:none"><div class="chart-text">Beide Kanäle zusammen — und zwar die <b>Beträge</b> addiert, nicht die Signale. Der Unterschied ist wesentlich: Zwei gegenphasige Anteile löschen sich beim Mischen aus und wären in einem echten L+R verschwunden, obwohl beide Lautsprecher sie spielen. Hier bleiben sie stehen. Deshalb heißt die Lasche |L|+|R| und nicht FFT(L+R). Dies ist das Bild, das dem am nächsten kommt, was insgesamt klingt.</div></div>
  <div id="spektro-text-pan" style="display:none"><div class="chart-text">Dasselbe Bild, doch die Farbe trägt hier die Stereolage statt der Stärke: <span style="color:#f97b14">Orange</span> steht für links, <span style="color:#4b93f0">Blau</span> für rechts, <span style="color:#9a9aa2">Grau</span> für die Mitte. So wird erkennbar, welche Frequenzbereiche breit gemischt sind und welche in der Mitte zusammenlaufen. Das Notensystem der elf Linien ist dasselbe wie im Spektrogramm darüber.</div></div>
</div>
`;

  let kern = null;      // die Innenwelt des Analyzers, nach dem Aufbau
  let flaecheJetzt = null;

  /* Der Stil wird einmal je Seite eingesetzt. */
  function stilEinsetzen(){
    if (document.getElementById('sunoanalyzer-stil')) return;
    const s = document.createElement('style');
    s.id = 'sunoanalyzer-stil';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* TOTGELEGT — Prüfung vom 23.08.2026, Belege in docs/ANALYZER-REVIEW.md
     ------------------------------------------------------------------------
     Sechs Prüfer haben jede Messgröße gegen Referenzen nachgerechnet (Sunos
     Schlagzeiten, ffmpeg/EBU R128, ein Feinspektrum mit 2,7 Hz, Kunstsignale
     mit bekannter Antwort). Die hier genannten Karten messen nachweislich
     etwas anderes, als ihr Name sagt. Sie werden weiter GERECHNET und liegen
     weiter in der Ablage — gelöscht ist nichts (Caspar_D: "alles tot legen, was
     nicht funktioniert, aber nicht löschen"). Sie werden nur nicht mehr
     gezeigt, denn eine Zahl, die immer 100 % anzeigt oder eine Tonart rät,
     ist schlimmer als keine (Hausregel: nichts darf lügen).

     Wer eine zurückholen will, nimmt ihren Namen aus dieser Liste heraus.
     (Die Datei stammt ursprünglich aus ../SunoAnalyzer/. Das dortige
     Original ist seit Mai 2025 eingefroren und hat eigenen Code — hier
     gepflegte Änderungen gehören NICHT mehr dorthin zurück.) */
  /* HIER STAND SA_TOT: zehn Karten, die verborgen wurden, weil ihre
     Zahlen nachweislich falsch sind. Am 25.08.2026 sind sie samt
     Rechnung geloescht (Caspar_D: "wir legen nichts mehr tot ohne den
     Code mitzuloeschen"). Gerechnet wurden sie bis dahin weiter - in
     jedem Rahmen, bei fuenf Minuten Musik ueber 55.000 mal - obwohl
     ihr letzter Leser, die Instrument-Erkennung, schon weg war.

     Was an ihnen falsch war, Zeile fuer Zeile:

    bpm: Autokorrelationsgipfel ohne Prüfung auf halbes/doppeltes Tempo; 33 % auf falscher metrischer Ebene. Ersatz: Sunos Schlagzeiten (taktBpm im Katalog).
    centroid: Stammt aus einem einzigen 43-ms-Fenster bei 30 % der Spieldauer.
    rolloff: Summiert Amplituden statt Leistung; unter dem gemeldeten Wert liegen 94-99 % der Energie.
    attack: Bleibt bei 297 von 321 Songs leer; die gefüllten Werte gehen bis 19 Sekunden.
    chord-rate: Zählt Rahmenflimmern und hängt an der Schrittweite der FFT-Runde.
    note-stab: Wird durch den längsten Lauf DESSELBEN Songs geteilt und ist deshalb zwischen Songs nicht vergleichbar.
    inharm: Das Suchfenster ist immer genau ein Bin breit - die Größe kann nicht messen, was sie heißt.
    harmdense: Antwortet umgekehrt: weißes Rauschen 15,8, reiner Sinus 5,0.
    tilt: Stellt 10 Baß-Bins gegen 469 Höhen-Bins; rosa Rauschen gilt als höhenlastig.
    texture: Steht bei 286 von 321 Songs auf 100 %, weil die Akkordrate die Formel sprengt.

     Belege und Messreihen stehen in docs/ANALYZER-REVIEW.md.
     v-entropy war NICHT dabei und bleibt. */
  /* Die totgelegten Bildabschnitte wurden hier einmal nach ihrer
     Beschriftung ausgeblendet. Sie sind inzwischen ganz entfernt
     (Caspar_D, 23.08.2026: "entferne alle canvas und kurven, die wir nicht
     mehr sehen"), deshalb ist von der Liste nichts uebrig - nur die
     Karten unten werden weiter verborgen statt geloescht. */

  /* Die "Stehenden Toene" (Schimmer) standen hier: eine Bahn in der
     Befundspur, eine Tabelle darunter und das Feld dazu. Am 23.08.2026
     wurden sie ausgeblendet, am 25.08.2026 samt Rechnung geloescht
     (Befunde 14-17). Sie fanden Musik statt Stoerung - 137 von 137
     Befunden bis 6 kHz lagen auf einer Note, und die gemeldeten dB
     waren ein Rechenartefakt. Ersatz ist bin/stoerfrequenz.js mit
     2,7 Hz Aufloesung; seine Funde stehen im Glockenstuhl des
     Tonstudios. Die Begruendung im Einzelnen steht an der Stelle, wo
     schimmerFinden() im Rechenkern stand. */

  /* Karten ohne Wert ausblenden. Nach der Stilllegung blieben einzelne
     Karten leer zurück ("Dauer —"), und eine Karte, die nichts sagt, ist
     Lärm. Läuft nach jeder Analyse. */
  /* Die Nachrichten des Kerns treffen nacheinander ein; wer sofort aufräumt,
     blendet Karten aus, die bloß noch nicht gefüllt sind. Deshalb mehrfach
     nachsehen und wieder einblenden, sobald ein Wert eintrifft. */
  let leerLauf = null;
  function leereKartenNachlauf(){
    clearTimeout(leerLauf);
    let n = 0;
    const runde = () => { leereKartenAus(flaecheJetzt);
      /* Auch die Abschnitte noch einmal: Die Verlaufsbilder entstehen erst
         nach der Analyse und trugen ihre Stilllegung sonst nicht mit
         (23.08.2026 im Durchsehen gefunden). */
      if (++n < 6) leerLauf = setTimeout(runde, 800); };
    leerLauf = setTimeout(runde, 800);
  }

  function leereKartenAus(flaeche){
    if (!flaeche) return;
    for (const karte of flaeche.querySelectorAll('.card')){
      const v = karte.querySelector('.val'); if (!v) continue;
      const t = (v.textContent || '').trim();
      const leer = t === '' || t === '—' || t === '–' || t === '-';
      if (leer && !karte.dataset.warLeer){ karte.dataset.warLeer = '1'; karte.style.display = 'none'; }
      else if (!leer && karte.dataset.warLeer){ delete karte.dataset.warLeer; karte.style.display = ''; }
    }
  }


  function aufbauen(flaeche, opt){
    if (kern) abraeumen();
    stilEinsetzen();
    flaeche.classList.add(KLASSE);
    /* Eingebettet heißt: in der Bühne. Dann fallen Ladebereich,
       Kommentar-Generator, eigener Transport, Stems und
       Instrumenterkennung weg - siehe den CSS-Block oben. */
    if (opt && opt.eingebettet) flaeche.classList.add('eingebettet');
    flaeche.innerHTML = MARKUP;
    kartenSortieren(flaeche);   // erst jetzt gibt es Karten
    flaecheJetzt = flaeche;
    kern = starten(flaeche, opt || {});
    return kern;
  }

  /* ------------------------------------------------------------------
     Die Reihenfolge der Karten.

     Im Original standen sie in sieben festen Vierergruppen, entstanden
     nach Bauzeitpunkt: Zähler, dann Rhythmus, dann Klangfarbe, dann
     Harmonik - durcheinander. Seit sie in EIN auffüllendes Raster
     fließen, ist die Reihenfolge frei, und dann sollte sie einer Frage
     folgen: erst WAS für ein Stück ist das, dann WIE klingt es, zuletzt
     wie ist es angekommen.

     Gesetzt wird nur 'order' an den Rasterkindern - am Markup ändert
     sich nichts, und wer eine Karte sucht, findet sie im Quelltext
     weiterhin dort, wo sie immer war.
     ------------------------------------------------------------------ */
  const KARTEN_REIHENFOLGE = [
    // Pegel nach Norm - die geprüften Zahlen zuerst
    'v-lufs', 'v-lra', 'v-tp', 'v-plr', 'v-psr', 'v-check',
    // Fehlersuche
    'v-clip', 'v-dc', 'v-korr', 'v-ende', 'v-grenz',
    // Zeit und Form
    'v-dur', 'v-symmetry',
    // Pegel und Dynamik
    'v-loud', 'v-dyn', // Harmonik
    'v-key', // Klangfarbe
    'v-entropy',
    // Raum und Stimme
    'v-stereo', 'v-vocal', // Zuletzt: was nicht aus dem Ton stammt
    'v-model', 'v-plays', 'v-likes', 'v-comments', 'v-ratio', 'v-age', 'v-ppd',
  ];

  function kartenSortieren(flaeche){
    KARTEN_REIHENFOLGE.forEach((id, i) => {
      const wert = flaeche.querySelector('#' + id);
      const karte = wert && wert.closest('.card');
      if (karte) karte.style.order = i + 1;
    });
  }

  function abraeumen(){
    if (!kern) return;
    try { kern.anhalten(); } catch(e){ console.warn('Analyzer: Abräumen', e); }
    if (flaecheJetzt){ flaecheJetzt.innerHTML = ''; flaecheJetzt.classList.remove(KLASSE); }
    clearTimeout(leerLauf);   // der Nachlauf hat nichts mehr zu putzen
    kern = null; flaecheJetzt = null;
    delete window.__SA;
  }

  window.SunoAnalyzer = {
    aufbauen,
    abraeumen,
    /* Die Quellknoten für die Live-Anzeigen, aus dem Graphen des
       Aufrufers. Ohne sie bleiben Dichte-Spektrum und Live-Spektrum
       leer; alles andere rechnet der Analyzer aus der Datei.

       ZWEI KNOTEN seit dem 26.08.2026: `knoten` ist das codierte
       Signal, `ende` das Ausgabe-Signal. Der dritte Parameter ist
       freiwillig - fehlt er, gibt es nur den einen Abgriff und der
       Umschalter erscheint gar nicht erst. */
    quelle(knoten, ctx, ende){
      if (!kern) throw new Error('SunoAnalyzer: erst aufbauen()');
      return kern.quelle(knoten, ctx, ende);
    },
    /* Ein Song aus dem Katalog. Erwartet die Felder von /api/song/<id>,
       dazu 'tonUrl' und 'bild' - welche Tonspur und welches Bild, weiß
       der Aufrufer, nicht der Analyzer. */
    song(daten){
      if (!kern) throw new Error('SunoAnalyzer: erst aufbauen()');
      return kern.song(daten);
    },
    /* Pille und Solokreise neu zeichnen, wenn die Buehne den Zustand
       der Kanal-Inspektion umgeschaltet hat. */
    stemsZeichnen(t){ if (kern && kern.stemsZeichnen) kern.stemsZeichnen(t); },
    /* Für Fremdes ohne Katalogeintrag: nur eine Adresse. */
    analysiere(adresse, titel, bild){
      if (!kern) throw new Error('SunoAnalyzer: erst aufbauen()');
      return kern.analyzeUrl(adresse, titel, bild);
    },
    get bereit(){ return !!kern; },
  };

  /* ======================================================================
     Ab hier das Originalskript, unverändert. Es liegt in einer Funktion,
     damit seine rund 300 Namen nicht in den globalen Raum geraten.
     ====================================================================== */
  function starten(WURZEL, OPT){

    /* Alles im Analyzer sucht mit document.getElementById. Das geht auch
       eingebettet gut, solange die Kennungen einmalig sind - sie sind es,
       weil KlangTresor keine davon benutzt. */

    /* Überschattet die globale Fassung: Jede Zeichenschleife des
       Analyzers läuft hierüber und lässt sich damit gemeinsam anhalten.
       Das Original ruft schlicht requestAnimationFrame(...) auf und merkt
       von der Umleitung nichts. */
    let laeuft = true;
    const bilder = new Set();
    function requestAnimationFrame(fn){
      if (!laeuft) return 0;
      const id = window.requestAnimationFrame(fn);
      bilder.add(id);
      return id;
    }
    function cancelAnimationFrame(id){
      window.cancelAnimationFrame(id);
      bilder.delete(id);
    }

    /* ---------------------------------------------------------------
       Der Zeitgeber.

       Der Analyzer ist Anzeige, kein Player. Wo er früher seine eigene
       Wiedergabe befragte, fragt er jetzt nach außen - in der Bühne ist
       das deren <audio>, sonst sein eigenes Element.

       Drei Auskünfte genügen, und die Rückfälle halten die Wirtsseite
       am Leben, solange die Bühne den Analyzer noch nicht führt:
       --------------------------------------------------------------- */
    /* Ohne Wirt keine Zeit. Die Rueckfaelle liefen frueher auf das
       eigene Audioelement; das gibt es nicht mehr. Wer den Analyzer
       einbettet, MUSS die vier Auskuenfte reichen - sonst steht er
       still, statt sich heimlich eine zweite Quelle zu bauen. */
    const ZEIT       = OPT.zeit       || function(){ return 0; };
    const LAEUFT     = OPT.laeuft     || function(){ return false; };
    const SPRUNG     = OPT.sprung     || function(){};
    const UMSCHALTEN = OPT.umschalten || function(){};


    /* Der Mitschnitt des laufenden Analysestands. Siehe
       nachrichtVerarbeiten(). */
    var _aufnahme = { id:null, nachrichten:null, fertig:false };
    /* Welcher Song gerade gerechnet wird - song() setzt es, damit der
       Mitschnitt weiss, wozu er gehoert. */
    var _laufendeId = null;

    var audioCtx=null, songDuration=0;

    var phIds=['befundspur','chromaspur','chromataktspur','stereospur','korrspur','momentanspur','kurzspur','abweichungspur','stapelspur','stemdrumsspur','stembassspur','stemotherspur','stemvocalsspur','stemguitarspur','stempianospur','flux','spectro','stereospectro','rechtsspectro','summespectro'];

    /* Der Knopf auf der Wellenform schaltet den Player der Buehne -
       er hat keinen eigenen mehr zu schalten. */
    function togglePlay(){ UMSCHALTEN(); }
    function updatePlayerUI(){
      var pct=songDuration>0?ZEIT()/songDuration:0;
      var view=getView?getView():{start:0,end:1};
      var viewPct=view.end>view.start?(pct-view.start)/(view.end-view.start):pct;
      viewPct=Math.max(0,Math.min(1,viewPct));
      document.getElementById('prog-fill').style.width=(pct*100)+'%';
      document.getElementById('prog-head').style.left=(viewPct*100)+'%';
      /* Die Zeitangabe läuft mit. Sie sitzt auf dem Spielkopf, damit man
         beim Lesen der Wellenform nicht zwischen zwei Stellen hin- und
         herschauen muss. */
      var zm=document.getElementById('sa-zeitmarke');
      if(zm){ zm.style.left=(viewPct*100)+'%'; zm.textContent=fmt(ZEIT()); }
      var pp=document.getElementById('pp-btn');
      if(pp){ var z=LAEUFT()?'⏸':'▶'; if(pp.textContent!==z) pp.textContent=z; }
    }
    /* Die rafProgress-Schleife stand hier als eigene RAF-Kette - sie
       trieb dieselbe Abspielanzeige wie updatePlayheads. Seit dem
       25.08.2026 (Review) ruft updatePlayheads updatePlayerUI() mit:
       eine Uhr statt zwei. Die Bedingung "nur wenn nicht pausiert"
       bleibt entfallen - bei fremdem Zeitgeber aendert sich die Stelle
       auch im Stillstand, wenn in der Buehne gesprungen wird. */
    var _seeking=false;
    function seekStart(e){
      _seeking=true;seekMove(e);
      function onMove(ev){if(_seeking)seekMove(ev);}
      function onUp(){_seeking=false;
        document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);
        document.removeEventListener('touchmove',onMove);document.removeEventListener('touchend',onUp);}
      document.addEventListener('mousemove',onMove);document.addEventListener('mouseup',onUp);
      document.addEventListener('touchmove',onMove,{passive:false});document.addEventListener('touchend',onUp);
    }
    function seekMove(e){
      if(!songDuration)return;
      e.preventDefault&&e.preventDefault();
      // Use main waveform canvas as reference (prog-bar is hidden)
      var bar=document.getElementById('main-waveform-canvas')||document.getElementById('prog-bar');
      var rect=bar.getBoundingClientRect();
      var clientX=e.touches?e.touches[0].clientX:e.clientX;
      var pct=Math.max(0,Math.min(1,(clientX-rect.left)/rect.width));
      /* Die Breite des Abspielknopfs wird gemessen, nicht angenommen:
         Eingebettet ist er ausgeblendet und damit 0 breit. Fest 44 hätte
         den Sprung um gut fünf Sekunden verschoben. */
      var ppb=document.getElementById('pp-btn');
      var btnW=(ppb&&ppb.offsetWidth)||0;
      var adjustedPct=Math.max(0,Math.min(1,(clientX-rect.left-btnW)/(rect.width-btnW)));
      SPRUNG(adjustedPct*songDuration);
      updatePlayerUI();
    }
    /* Die Anzeige haengt an der fremden Uhr statt an eigenen
       Ereignissen. Die Schleife dafuer gibt es schon: updatePlayheads,
       weiter unten. Eine zweite waere derselbe Fehler wie ein zweiter
       Player, nur billiger. */

    /* Statuszeile und Fortschrittsbalken des Standalone sind mitsamt
       ihrem Rueckweg aufgegeben (Caspar_D, 25.08.2026): setStatus und
       setProgress geloescht, ihre CSS-Regeln auch. Was fertig ist,
       zeigen die Karten selbst - chart-pending faellt, wenn ein Bild
       bereitsteht. */
    /* Math.floor, nicht Math.round: Bei 59,6 s ergab round "0:60"
       (Review, 25.08.2026). zeitTxt unten ist derselbe Formatierer. */
    function fmt(s){var m=Math.floor(s/60),ss=Math.floor(s%60);return m+':'+(ss<10?'0':'')+ss;}

    // zoom state
    var zoomLevel=1; // 1x to 16x
    var viewStart=0; // fraction 0..1
    var viewEnd=1;   // fraction 0..1

    function getView(){return {start:viewStart,end:viewEnd,dur:(viewEnd-viewStart)*songDuration};}

    function updateZoom(){
      var sliderVal=parseFloat(document.getElementById('zoom-slider').value);
      zoomLevel=Math.pow(2,sliderVal); // 1x..32x
      document.getElementById('zoom-label').textContent=zoomLevel.toFixed(1).replace('.0','')+'×';
      centerViewOnPlayhead();
      redrawAllCharts();
    }

    function centerViewOnPlayhead(){
      if(!songDuration)return;
      var winSize=1/zoomLevel;
      var center=ZEIT()/songDuration;
      viewStart=Math.max(0,center-winSize/2);
      viewEnd=viewStart+winSize;
      if(viewEnd>1){viewEnd=1;viewStart=Math.max(0,1-winSize);}
    }

    function resetZoom(){
      document.getElementById('zoom-slider').value=0;
      zoomLevel=1;viewStart=0;viewEnd=1;
      document.getElementById('zoom-label').textContent='1×';
      redrawAllCharts();
    }

    document.getElementById('zoom-slider').oninput=updateZoom;


    /* ------------------------------------------------------------------
       Sparklines für die Karten.

       Gezeichnet wird der Verlauf über den ganzen Song, wortgroß: keine
       Achsen, keine Gitter, keine Beschriftung. Der Wert daneben sagt,
       wo man steht; die Linie sagt, wo er herkommt.

       Die Reihen liegen bereits vor - sie speisen die großen Diagramme
       weiter unten. Hier werden sie nur auf 78 Punkte eingedampft.
       ------------------------------------------------------------------ */
    /* Nur bei diesen sechs ist die angezeigte Zahl tatsächlich das
       arithmetische Mittel der gezeigten Reihe - der Worker bildet es
       über alle Bilder mit Signal ("mean scalars").

       Bei den übrigen ist sie etwas anderes, und das ist Absicht:
         Lautheit  = RMS über den GANZEN Song in dB, nicht das Mittel
                     der dB-Kurve. Beides unterscheidet sich, weil laute
                     Stellen den Effektivwert dominieren.
         Dynamik   = Spitze minus Effektivwert des ganzen Songs.
         BPM       = eine Schätzung aus Autokorrelation und Abständen,
                     kein Mittel der BPM-Kurve.
         Noten-Stabilität = eigener Anteilswert.
       Deshalb bekommen nur die sechs die blaue Farbe des Mittelwerts.
       Ein Median wurde nirgends gebildet - er entsteht erst hier. */
    const MITTELWERT_KARTEN = ['v-entropy'];

    const FUNKEN = {
      'v-lufs':     d => d.momentan,
      'v-lra':      d => d.kurz,
      'v-loud':     d => d.lufs,
      'v-dyn':      d => d.crest,
      'v-entropy':  d => d.fft && d.fft.entropy,
    };

    /* ------------------------------------------------------------------
       Die Befunde.

       Das Urteil zum Zielpegel stammt der Idee nach aus dem CB Audio
       Analyzer: Nicht nur "zu leise", sondern der Abgleich mit der
       Spitzenreserve. Ein Song kann zu leise sein UND keine Luft haben,
       ihn lauter zu machen - das ist die eine Diagnose, die man selbst
       nicht stellt, weil man auf die Lautheit schaut und die Spitze
       vergisst.
       ------------------------------------------------------------------ */
    /* Plattformen. Zwei Zahlen sind Vorschrift, die dritte ist das
       Verhalten - und die entscheidet ueber das Urteil:

         'leiser'  hebt leise Titel NICHT an. Zu laut ist dann harmlos
                   (es wird zurueckgedreht), zu leise bleibt leise.
         'beides'  hebt auch an, mit Begrenzer. Dann ist zu leise
                   gefaehrlich, weil beim Anheben die Spitzen leiden.
         'nein'    regelt gar nicht - der Pegel bleibt, wie er ist.

       GEPRUEFT am 18.08.2026 durch Netzrecherche (Quellen in
       docs/NORMEN.md). Vorher standen hier ungepruefte Zahlen aus
       allgemeinem Wissen; die Recherche hat sie bestaetigt und eine
       Luecke aufgedeckt - Apple Music liegt bei -16 LUFS und fehlte.
       Anbieter aendern solche Werte, also gehoert das Datum dazu. */
    var ZIELE={
      streaming:{name:'Streaming', lufs:-14, tp:-1.0, regelt:'beides',
                 merkmal:'Sammelwert: Spotify, YouTube, TIDAL, Amazon, SoundCloud.'},
      spotify:  {name:'Spotify',   lufs:-14, tp:-1.0, regelt:'beides',
                 merkmal:'Hebt leise Titel an und laesst dabei 1 dB Reserve.'},
      apple:    {name:'Apple Music', lufs:-16, tp:-1.0, regelt:'beides',
                 merkmal:'Der Ausreisser: -16 statt -14, geregelt ueber Sound Check.'},
      youtube:  {name:'YouTube',   lufs:-14, tp:-1.0, regelt:'leiser',
                 merkmal:'Dreht nur zurueck, hebt nie an.'},
      club:     {name:'Club',      lufs:-9,  tp:-0.5, regelt:'nein',
                 merkmal:'Keine Regelung, dafuer Reserve fuers Pult.'},
      broadcast:{name:'Rundfunk',  lufs:-23, tp:-1.0, regelt:'nein', toleranz:0.5,
                 merkmal:'R128: -23 LUFS mit +-0,5 LU Toleranz.'},
    };
    /* Ampel aus der Segmentpalette (Caspar_D, 18.08.2026: "kannst du die
       Farbstimmung des Editors an den Segmentfarben orientieren").
       Gruen und Gelb kommen unveraendert daher; fuer den Fehlerfall
       nehme ich das Magenta - es ist der einzige Ton der Palette, der
       alarmiert, und es ist vom Orange der Refrains unterscheidbar. */
    var AMPEL=['#16be5c','#d8d81c','#e31c79'];
    var ZIEL_AKTIV='streaming';

    function zeitTxt(s){ return fmt(s); }   /* eine Uhr, ein Format (25.08.2026) */

    /* Registerlaschen bauen und, wenn sie nicht mehr nebeneinander
       passen, gegen das Klappfeld tauschen. Gemessen wird die
       tatsaechliche Breite, nicht die des Fensters - im Analysemodus
       haengt die Spaltenbreite an mehreren Dingen. */
    function registerBauen(){
      var reg=document.getElementById('sa-register');
      var sel=document.getElementById('sa-ziel');
      if(!reg||!sel) return;
      if(!reg.children.length){
        Object.keys(ZIELE).forEach(function(k){
          var z=ZIELE[k];
          var b=document.createElement('button');
          b.textContent=z.name; b.dataset.ziel=k;
          b.title=z.merkmal+'  Ziel '+z.lufs+' LUFS, Spitze '+z.tp.toFixed(1)+' dBTP';
          b.onclick=function(){ ZIEL_AKTIV=k; if(window._normwerte){ befundeZeigen(window._normwerte); lautheitSpurenZeichnen(); } };
          reg.appendChild(b);
        });
        sel.innerHTML=Object.keys(ZIELE).map(function(k){
          return '<option value="'+k+'">'+ZIELE[k].name+' · '+ZIELE[k].lufs+' LUFS</option>'; }).join('');
        sel.onchange=function(){ ZIEL_AKTIV=sel.value;
          if(window._normwerte){ befundeZeigen(window._normwerte); lautheitSpurenZeichnen(); } };
        if(window.ResizeObserver){
          new ResizeObserver(registerAnpassen).observe(document.getElementById('sa-befunde'));
        }
      }
      [].forEach.call(reg.children, function(b){ b.classList.toggle('an', b.dataset.ziel===ZIEL_AKTIV); });
      sel.value=ZIEL_AKTIV;
      registerAnpassen();
    }

    function registerAnpassen(){
      var reg=document.getElementById('sa-register'), sel=document.getElementById('sa-ziel');
      if(!reg||!sel) return;
      reg.style.display='flex'; sel.style.display='none';
      // scrollWidth > clientWidth heisst: die Laschen passen nicht mehr.
      if(reg.scrollWidth>reg.clientWidth+1){ reg.style.display='none'; sel.style.display='block'; }
    }

    /* Aus einem Verlauf Strecken machen.

       indizes sind die auffaelligen Fenster. Was naeher als luecke
       beieinander liegt, gehoert zur selben Strecke - sonst zerfaellt
       eine Passage mit einer Ueberschreitung alle zwei Sekunden in
       lauter Einzelmeldungen, und genau ihre Dichte ist die Auskunft. */
    function strecken(indizes, schritt, luecke){
      var aus=[], akt=null;
      for(var i=0;i<indizes.length;i++){
        var t=indizes[i]*schritt;
        if(akt&&t-akt.bis<=luecke){ akt.bis=t+schritt; akt.anzahl++; }
        else { if(akt) aus.push(akt); akt={von:t, bis:t+schritt, anzahl:1}; }
      }
      if(akt) aus.push(akt);
      return aus;
    }

    /* Die Befundspur: Zeitachse, darauf die Strecken.

       Untergrund sind die Strukturabschnitte - sie geben dem Blick den
       Ort ("im zweiten Refrain"), ohne selbst ein Befund zu sein.

       Gezeichnet wird in dasselbe Koordinatensystem wie alle Spuren
       (0..SPUR_W), damit spurSichtSetzen() den Zoom mit einem
       Attribut erledigen kann. */
    /* AUFBAU EINER BAHN (Caspar_D, 23.08.2026):
         BF_KOPF     Überschrift ("Track-Struktur", "Teilweise Stereo…")
         BF_KUERZEL  nur in der Abschnittsbahn: die Kürzel in Abschnittsfarbe
         1 px        die Topline in voller Farbe
         Rest        Hüllkurve bzw. Blöcke
       Kopf und Kürzel sind HTML über dem SVG - im gestreckten viewBox würde
       Text verzerrt. Im SVG bleibt ihr Platz frei. */
    var BF_BAHN=17, BF_LUECKE=3, BF_KOPF=14, BF_KUERZEL=12;
    var TAKT_EINS='#e31c79';         /* die Eins des Takts - das Haus-Rot */
    var TAKT_REST='#ffffff';         /* die Zählzeiten 2-3-4 */
    var BF_ABSCHNITT=Math.round(BF_BAHN*5/3*5/3*2);  /* zweimal um zwei Drittel, dann verdoppelt (Caspar_D, 23.08.2026) */
    /* Auch eine Bahn mit blosser Huellkurve braucht die volle Hoehe -
       sonst waere sie ein Strich (25.08.2026). */
    /* Nur Abschnitte und Huellkurve fuellen eine hohe Bahn. Sunos
       Wechsel tun es NICHT (Caspar_D, 25.08.2026: "die suno wechsel
       sollen die kleinen ticks bleiben, wir wissen nichts ueber sie,
       ausser dass sie da sind") - eine hohe Bahn wuerde Gewicht
       versprechen, das die Daten nicht haben. */
    var bahnInhalt=function(bahn){ return bahn && (bahn.abschnitte || bahn.welle) ? BF_KUERZEL+BF_ABSCHNITT : BF_BAHN; };
    var bahnHoehe=function(bahn){ return BF_KOPF+bahnInhalt(bahn); };

    /* Abschnitte aus dem KARAOKETEXT, nicht aus der Strukturerkennung.

       Die farbigen Bloecke der Strukturerkennung sind ein Ergebnis des
       Analyzers - geraten, und niemand weiss, wie gut. (Caspar_D: "es ist
       nichtmal klar, ob die 100prozentig stimmen, deswegen wuerde ich
       sie dort nicht abbilden.") Die Abschnittsmarken im Text stammen
       dagegen vom Urheber.

       Sie stehen als eigene "Woerter" im Zeitmarkenstrom - eine Zeile
       wie [Chorus] hat dort Anfang und Ende wie jedes andere Wort.
       Damit ist der Anfang eines Abschnitts direkt ablesbar; sein Ende
       ist der Anfang des naechsten. */
    function abschnitteAusText(worte, dauer){
      if(!worte||!worte.length) return [];
      var marken=[];
      for(var i=0;i<worte.length;i++){
        var w=worte[i];
        /* Das Format ist ein Array [Anfang, Ende, Text], kein Objekt -
           und die Abschnittsmarke steht IM Text, nicht als eigenes
           Wort: [4.628, 12.686, "[Intro]\nAn "]. Gesucht wird deshalb
           die Klammer irgendwo im Text, nicht ein Wort, das nur aus
           ihr besteht. */
        var von = Array.isArray(w) ? w[0] : (w.start!==undefined?w.start:w.start_s);
        var txt = String(Array.isArray(w) ? w[2] : (w.text||w.word||''));
        var m = txt.match(/\[([^\]]+)\]/);
        /* ABSCHNITTE OHNE KLAMMERN (Caspar_D, 25.08.2026: "wieso betrifft
           es nur den einen track").

           Nicht jeder Liedtext schreibt [Verse 1]. "Moissanit" gliedert
           auf Deutsch und ohne Klammern - "Strophe 1", "Strophe 2" -,
           und weil nur nach der Klammer gesucht wurde, fand sich keine
           einzige Marke. Ohne Marken legt die Bahn sich nicht an, und
           mit ihr fehlte die ganze Huellkurve: 40 von 321 Songs standen
           ohne, Moissanit als einziger davon mit einer Gliederung, die
           bloss anders geschrieben ist.

           Verlangt wird, dass der Eintrag NUR aus dem Namen besteht
           (plus Nummer) - so kann ein "Refrain" im Fliesstext keine
           falsche Marke setzen. Die Nummer steht bei wortweisen
           Zeitmarken oft im naechsten Eintrag ("Strophe" + " 1\nMein"),
           deshalb wird dort nachgesehen.

           art und kuerzel weiter unten kennen die deutschen Namen
           laengst - nur das Finden kannte sie nicht. */
        var zeit = von;
        if(!m){
          /* Der Name steht am ZEILENANFANG und am Eintragsende - bei
             wortweisen Zeitmarken haengt das Satzende des vorigen
             Abschnitts noch davor: ".\n\nStrophe". Deshalb (^|\n) statt
             nur ^, und kein Wegnormalisieren der Zeilenumbrueche: sie
             sind gerade das Kennzeichen. */
          var dm = txt.match(/(?:^|\n)[ \t]*(Strophe|Refrain|Kehrvers|Vers|Verse|Chorus|Bridge|Bruecke|Brücke|Intro|Vorspiel|Outro|Nachspiel|Hook|Break|Zwischenspiel|Überleitung|Ueberleitung)[ \t]*(\d*)[ \t]*$/i);
          if(dm){
            var nr = dm[2];
            if(!nr && i+1<worte.length){
              var nx = String(Array.isArray(worte[i+1]) ? worte[i+1][2]
                            : (worte[i+1].text||worte[i+1].word||''));
              var nm = nx.match(/^\s*(\d+)/);
              if(nm) nr = nm[1];
            }
            m = [null, dm[1] + (nr ? ' ' + nr : '')];
            /* Steht noch Text VOR dem Namen, gehoert der zum vorigen
               Abschnitt - dann beginnt der neue erst am Eintragsende. */
            if(!/^[ \t]*(Strophe|Refrain|Kehrvers|Vers|Verse|Chorus|Bridge|Bruecke|Brücke|Intro|Vorspiel|Outro|Nachspiel|Hook|Break|Zwischenspiel|Überleitung|Ueberleitung)/i.test(txt)){
              var bis0 = Array.isArray(w) ? w[1] : (w.ende!==undefined?w.ende:w.end_s);
              if(isFinite(bis0)) zeit = bis0;
            }
          }
        }
        if(m && isFinite(zeit)) marken.push({ von:zeit, name:m[1].trim() });
      }
      if(!marken.length) return [];

      /* Das Ende des letzten Abschnitts ist das Ende des letzten
         WORTES, nicht das Ende der Datei. Danach kommt oft noch
         Musik. */
      var letztes=worte[worte.length-1];
      var textEnde=Array.isArray(letztes) ? letztes[1]
                 : (letztes.ende!==undefined?letztes.ende:letztes.end_s);
      if(!isFinite(textEnde)) textEnde=dauer;

      for(var k=0;k<marken.length;k++)
        marken[k].bis = k+1<marken.length ? marken[k+1].von : Math.min(textEnde,dauer);

      /* Was zu KEINEM Abschnitt gehoert, bekommt einen eigenen blauen
         Block statt einem Nachbarn zugeschlagen zu werden (Caspar_D,
         18.08.2026: "highlighte sowas mit blauem abschnitt pre intro
         und post end, man muss die ganze laenge sehen").

         Vorn: Die Marke [Intro] steht beim ersten gesungenen Wort -
         davor liegt Musik, gemessen 4,63 s bei "Noch lachst Du".
         Hinten: Nach dem letzten Wort laeuft das Stueck weiter.

         Ein erster Anlauf zog den ersten Abschnitt einfach auf null.
         Das ist bequemer, behauptet aber, die Vormusik sei Teil des
         Intros - und verschweigt, dass dort gar keine Marke steht. */
      var VOR_MIN=0.4;
      if(marken[0].von>VOR_MIN)
        marken.unshift({von:0, bis:marken[0].von, name:'Pre-Intro', aussen:true});
      var letzteBis=marken[marken.length-1].bis;
      if(dauer-letzteBis>VOR_MIN)
        marken.push({von:letzteBis, bis:dauer, name:'Post-End', aussen:true});
      /* Benachbarte Abschnitte GLEICHER Farbe bekommen abwechselnd
         eine etwas hellere Fassung - so wie Suno es macht (Caspar_D,
         18.08.2026). Ohne das verschmelzen zwei Strophen oder zwei
         gruene Abschnitte hintereinander zu einem Block, und die
         Grenze zwischen ihnen ist verloren.

         Es ist derselbe Gedanke wie der Spalt zwischen den Bloecken,
         nur fuer den Fall, dass Spalt allein nicht genuegt: Bei
         gleicher Farbe sieht man ihn kaum. */
      var vorher=null, hell=false;
      marken.forEach(function(m){
        var n2=m.name.toLowerCase();
        if(m.aussen){ m.hell=false; vorher='aussen'; return; }
        var art = /pre[\s-]?chorus|pre[\s-]?refrain/.test(n2) ? 'rand'
                : /chorus|refrain|hook/.test(n2) ? 'refrain'
                : /verse|strophe/.test(n2)       ? 'strophe'
                : /bridge|break/.test(n2)        ? 'bruecke' : 'rand';
        hell = (art===vorher) ? !hell : false;
        m.hell = hell;
        vorher = art;
      });

      return marken.map(function(m){
        if(m.aussen){ m.art='aussen'; m.kurz=(m.name==='Pre-Intro'?'Pre':'Post'); return m; }
        var n=m.name.toLowerCase();
        /* Reihenfolge zaehlt: Pre-Chorus muss VOR dem Refrain geprueft
           werden, sonst faengt ihn dessen Muster ab. */
        m.art = /pre[\s-]?chorus|pre[\s-]?refrain/.test(n) ? 'rand'
              : /chorus|refrain|hook/.test(n) ? 'refrain'
              : /verse|strophe/.test(n)       ? 'strophe'
              : /bridge|break/.test(n)        ? 'bruecke' : 'rand';
        m.kurz = kuerzel(m.name);
        return m; });
    }

    /* Kuerzel statt Namen (Caspar_D, 18.08.2026):

         I  Intro      V  Verse / Strophe    Bk Break
         B  Bridge     C  Chorus / Refrain   E  Ende
         H  Hook

       Der Grund ist Platz: Ausgeschrieben passt ein Name nur in breite
       Bloecke, und schmale blieben stumm. Eine Nummer wird mitgenommen,
       wo es eine gibt - aus "Verse 2" wird V2. Der volle Name bleibt im
       Tooltip.

       Unbekanntes wird auf zwei Buchstaben gekuerzt statt auf einen:
       "Interlude" waere sonst ein zweites I neben dem Intro. */
    function kuerzel(name){
      var n=String(name).toLowerCase();
      var nr=(String(name).match(/\d+/)||[''])[0];
      if(/intro/.test(n))                 return 'I';
      if(/break/.test(n))                 return 'Bk';
      if(/bridge/.test(n))                return 'B';
      if(/hook/.test(n))                  return 'H';   // vor dem Refrain
      if(/verse|strophe/.test(n))         return 'V'+nr;
      if(/chorus|refrain/.test(n))        return 'C'+nr;
      if(/outro|ende\b|^end/.test(n))     return 'E';
      return String(name).replace(/[^A-Za-zÄÖÜäöü]/g,'').slice(0,2)
             .replace(/^./,function(c){return c.toUpperCase();});
    }

    /* Die Farben des Suno-Editors, abgelesen aus einem Bildschirmfoto
       (Caspar_D, 18.08.2026): Refrain orange, Strophe magenta, Bridge
       gelb, alles uebrige gruen. Sie sind nirgends dokumentiert und im
       Stylesheet nicht als benannte Regel zu finden - der Editor setzt
       sie im Skript, und er ist Pro.

       Dass sie nicht die Ampelfarben sind, ist hier ein Gluecksfall:
       Die bedeuten Schweregrad, und ein Refrain ist kein Befund.

       PRE-CHORUS ist bei Suno GRUEN, nicht orange - hochgestuft wird
       nur der Refrain selbst, seine Vorbereitung zaehlt zum Rest. */
    var ABSCHNITT_FARBE={ strophe:'#e31c79', refrain:'#f97b14', bruecke:'#d8d81c', rand:'#16be5c',
                          aussen:'#4b93f0' };   // Blau: gehoert zu keinem Abschnitt

    /* Etwas heller, fuer den Wechsel zwischen gleichfarbigen Nachbarn.
       Gemischt wird mit Weiss, nicht die Deckkraft veraendert: Eine
       geringere Deckkraft liesse den schwarzen Grund durchscheinen und
       machte den Block stumpf statt hell. */
    /* Auf Schwarz zumischen - fuer die abgedunkelten Abschnittsflaechen. */
    function dunkler(hex, anteil){
      var h=(hex||'#888').replace('#','');
      if(h.length===3) h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      var r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16);
      var f=function(v){ return Math.round(v*anteil).toString(16).padStart(2,'0'); };
      return '#'+f(r)+f(g)+f(b);
    }
    function heller(hex, anteil){
      var r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
      var m=function(v){ return Math.round(v+(255-v)*anteil); };
      return '#'+[m(r),m(g),m(b)].map(function(v){ return v.toString(16).padStart(2,'0'); }).join('');
    }

    /* DIE TAKTBAHN, zoomabhängig (Caspar_D, 23.08.2026: "die verschwimmen alle
       ineinander ... bitte zoomabhängig so darstellen, dass möglichst immer
       Lücken zu sehen sind").

       Gerechnet wird in BILDPUNKTEN auf dem Schirm, nicht in viewBox-
       Einheiten - nur die zählen fürs Auge. Die Stufen, von weit nach nah:

         zu eng      nur jede 2., 4., 8. ... Eins - so viele, wie Platz haben
         etwas Luft  alle Einsen, als Strich
         mehr Luft   auch die Zählzeiten 2-3-4, als Strich
         viel Luft   Quadrate, die mit dem Zoom breiter werden - bis zur
                     halben Bahnhöhe, dann nicht mehr

       Gezeichnet als echte Rechtecke: Weil die Bahn beim Zoomen ohnehin neu
       entsteht, lässt sich die waagerechte Streckung hier ausrechnen (einPx),
       und damit sitzt auf jeder Marke oben ein heller Punkt in ihrer Breite -
       die Topline gehört zur Marke, nicht zur Bahn. */
    /* DIE HÖHEN KOMMEN AUS DER SCHRIFT (Caspar_D, 24.08.2026: "was wäre am
       besten buchstabenhöhen / also wie ein j von ganz unten bis ganz
       oben und wie ein n ohne ober und unterlänge").
       Die Eins bekommt die Höhe eines j - Oberlänge bis Unterlänge -,
       die Zählzeiten 2-3-4 die eines n, also die reine x-Höhe. Damit
       steht die Bahn im selben Mass wie die Schrift daneben, statt in
       geratenen Bildpunkten.
       Gemessen im Canvas mit derselben Schrift, nicht geschaetzt: die
       Metriken einer Schrift stehen in keiner CSS-Eigenschaft, die man
       auslesen koennte. Einmal je Schriftgroesse, dann gemerkt. */
    var _buchHoehen={};
    function buchstabenHoehen(){
      var lbl=document.querySelector('#banalyse .slbl .nam');
      var st=lbl?getComputedStyle(lbl):null;
      var gs=st?parseFloat(st.fontSize):10;
      var fam=st?st.fontFamily:'system-ui', gew=st?st.fontWeight:'700';
      var schluessel=gew+' '+gs+' '+fam;
      if(_buchHoehen[schluessel]) return _buchHoehen[schluessel];
      var hoehe=function(zeichen){
        try{
          var F=8, c=document.createElement('canvas');
          c.width=200; c.height=400;
          var x=c.getContext('2d',{willReadFrequently:true});
          x.fillStyle='#000'; x.fillRect(0,0,200,400);
          x.fillStyle='#fff';
          x.font=gew+' '+(gs*F)+'px '+fam;
          x.textBaseline='alphabetic';
          x.fillText(zeichen,20,300);
          var d=x.getImageData(0,0,200,400).data, oben=-1, unten=-1;
          for(var yy=0;yy<400;yy++){
            var hat=false;
            for(var px=0;px<200;px++) if(d[(yy*200+px)*4]>100){ hat=true; break; }
            if(hat){ if(oben<0) oben=yy; unten=yy; }
          }
          return oben<0 ? 0 : (unten-oben)/F;
        }catch(e){ return 0; }
      };
      var w={ j: Math.round(hoehe('j')) || 9, n: Math.round(hoehe('n')) || 5 };
      _buchHoehen[schluessel]=w;
      return w;
    }

    function taktZeichnen(bahn, dauer, y, BH){
      var schl=bahn.schlaege;
      if(!schl||!schl.length||!dauer) return '';
      var wirt=document.getElementById('befundspur-canvas');
      var breitePx=(wirt&&wirt.clientWidth)||900;
      var sicht=Math.max(0.0001, viewEnd-viewStart);
      var einPx=sicht*SPUR_W/breitePx;              /* ein Bildpunkt in viewBox-Einheiten */
      /* Wie viel Platz hat ein Schlag auf dem Schirm? */
      var abst=[]; for(var i=1;i<schl.length;i++) abst.push(schl[i][0]-schl[i-1][0]);
      abst.sort(function(a,b){return a-b;});
      var schlagS=abst[abst.length>>1]||0.5;
      var pxProSchlag=(schlagS/dauer)*SPUR_W/einPx;
      var pxProTakt=pxProSchlag*4;

      var mitRest=pxProSchlag>=7;                   /* erst ab hier haben 2-3-4 Platz */
      var jedeNte=1;
      if(!mitRest) while(pxProTakt*jedeNte<7 && jedeNte<64) jedeNte*=2;
      /* HÖHE UND BREITE SIND ZWEI DINGE (Caspar_D, 24.08.2026: "bei
         überblick dürfen sich die Quadrate nie berühren, dann lieber
         schmaler zeichnen und daraus hochkant-Rechtecke machen").

         Vorher hing beides am selben Wert: wurde es eng, schrumpfte die
         Marke in BEIDE Richtungen und verschwand, und kurz davor
         stießen die Quadrate aneinander, weil 42 % Breite bei
         gerundeten Bildpunkten keine Lücke mehr übrig lassen.

         Jetzt trägt die Höhe die Sichtbarkeit und die Breite die
         Trennung: Die Breite lässt IMMER mindestens einen Bildpunkt
         Luft - notfalls wird die Marke schmaler als hoch, und aus dem
         Quadrat wird ein Hochkant-Rechteck. */
      var platz=mitRest?pxProSchlag:pxProTakt*jedeNte;
      /* FESTE HÖHEN, und zwar Buchstabenhöhen (Caspar_D, 24.08.2026:
         "nein, wir brauchen fixe höhen" und "wie ein j ... und wie ein
         n"). Sie werden nicht mehr aus dem Platz gerechnet - beim
         Zoomen soll die Bahn ruhig bleiben und nicht atmen.
         Zoomabhängig ist allein die BREITE, und die nur, um die Lücken
         zu sichern. */
      var bh=buchstabenHoehen();
      var hoch=Math.min(bh.j, Math.round(BH*0.72));      /* die Eins: wie ein j */
      var hochKlein=Math.min(bh.n, Math.round(BH*0.5));  /* 2-3-4: wie ein n */

      /* ALLE Marken zeichnen, nicht nur die gerade sichtbaren: Verschoben
         wird über das viewBox-Attribut, und dabei wird NICHT neu gezeichnet -
         wer nur den Ausschnitt malt, läuft beim Scrollen aus seinen Marken
         heraus (Caspar_D, 23.08.2026: "beim Zoom in sind irgendwann keine Beats
         mehr in der Lane zu sehen"). Wie viele es sind, entscheidet ohnehin
         die Stufe: je enger, desto weniger. */
      /* Erst sammeln, dann zeichnen. Die Breite darf nicht am
         MEDIAN-Abstand haengen: Sunos Schlaege sind nicht gleichmaessig,
         und an den engeren Stellen stiessen die Marken deshalb doch
         aneinander (gemessen: vier Beruehrungen bei einer engsten
         Luecke von -3,5 px). Jede Marke bekommt ihre Breite aus dem
         Abstand zu ihren TATSAECHLICHEN Nachbarn. */
      var marken=[];
      for(var k=0;k<schl.length;k++){
        var istEins=(schl[k][1]===1);
        if(!istEins&&!mitRest) continue;
        if(istEins&&jedeNte>1){ if(Math.round(schl[k][0]/(schlagS*4))%jedeNte) continue; }
        marken.push({zt:schl[k][0], eins:istEins});
        if(marken.length>4000) break;               /* Notbremse fuer lange Stuecke */
      }

      var mitte=y+BH/2, t=[];
      for(var mi=0;mi<marken.length;mi++){
        var m=marken[mi], eins=m.eins;
        var zt=m.zt;
        var xb=(zt/dauer)*SPUR_W;
        /* Abstand zu beiden Nachbarn, in Bildpunkten - der engere zaehlt. */
        var davor = mi>0 ? ((zt-marken[mi-1].zt)/dauer)*SPUR_W/einPx : 1e9;
        var danach = mi+1<marken.length ? ((marken[mi+1].zt-zt)/dauer)*SPUR_W/einPx : 1e9;
        var frei = Math.min(davor, danach);
        var h=eins?hoch:hochKlein;
        /* Nie breiter als hoch (dann waere es ein liegendes Rechteck),
           und immer so schmal, dass ein Bildpunkt Luft bleibt. */
        var b=Math.max(1, Math.min(h, Math.floor(frei)-1));
        var bx=b*einPx;
        var oben=mitte-h/2;
        /* Dieselbe Hausform wie überall: die Fläche halb deckend, darauf die
           Kante in VOLLER Farbe - und zwar in der Farbe der Marke selbst, nicht
           in Weiß (Caspar_D, 23.08.2026: "bei Rot muss die Topline rot sein"). */
        var farbe=eins?TAKT_EINS:TAKT_REST;
        t.push('<rect x="'+(xb-bx/2).toFixed(1)+'" y="'+oben.toFixed(1)+'" width="'+bx.toFixed(1)
          +'" height="'+h+'" fill="'+farbe+'" opacity="0.5"/>');
        if(h>2) t.push(spurTopline(farbe, oben.toFixed(1), bx.toFixed(1), (xb-bx/2).toFixed(1)));
      }
      return t.join('');
    }

    /* DIE ABSCHNITTSKÜRZEL AUF DIE SICHT UMRECHNEN (Caspar_D, 23.08.2026: "die
       Abschnittsüberschriften der Hüllkurve zoomen nicht mit und laufen nicht
       mit"). Sie sind HTML über dem SVG - im gestreckten viewBox würde Text
       verzerrt -, und beim Bauen stehen sie in Prozent der GESAMTdauer. Das
       SVG schneidet seinen Ausschnitt aber mit einem Attribut heraus; die
       Beschriftung muss dieselbe Rechnung nachvollziehen.

       Läuft bei jeder Sichtänderung, auch beim bloßen Verschieben - es ist
       nur eine Handvoll Spans und kostet nichts. Was aus dem Bild fällt,
       wird ausgeblendet, sonst klebten die Namen am Rand. */
    var _namenDauer=0;
    function namenAusrichten(){
      var wirt=document.getElementById('sa-spur-namen');
      if(!wirt||!_namenDauer) return;
      var sicht=Math.max(1e-6, viewEnd-viewStart);
      wirt.querySelectorAll('.abs[data-von]').forEach(function(el){
        var von=+el.dataset.von, bis=+el.dataset.bis;
        var l=((von/_namenDauer)-viewStart)/sicht*100;
        var r=((bis/_namenDauer)-viewStart)/sicht*100;
        var br=r-l;
        /* Angeschnitten am linken Rand: Der Name soll trotzdem lesbar
           bleiben, solange noch ein Stück des Abschnitts zu sehen ist. */
        if(l<0 && r>0){ br=r; l=0; }
        if(r<=0 || l>=100 || br<0.6){ el.style.display='none'; return; }
        el.style.display='';
        el.style.left=l.toFixed(3)+'%';
        el.style.width=Math.min(br,100-l).toFixed(3)+'%';
      });
    }

    function befundspurZeichnen(bahnen, dauer){
      var host=document.getElementById('befundspur-canvas');
      var aussen=document.getElementById('sa-spur-aussen');
      var namen=document.getElementById('sa-spur-namen');
      if(!host||!aussen) return;
      var rahmen=document.getElementById('spur-befund');
      if(!bahnen.length||!dauer){ host.innerHTML=''; if(namen)namen.innerHTML='';
        if(rahmen) rahmen.style.display='none'; aussen.style.height='0'; return; }

      var H=(bahnen.length-1)*BF_LUECKE;
      bahnen.forEach(function(b){ H+=bahnHoehe(b); });
      if(rahmen) rahmen.style.display='';
      aussen.style.height=H+'px';
      /* .spur-flaeche steht im Stylesheet fest auf 44 px. Ohne diese
         Zeile wird das SVG darauf gestreckt, waehrend die
         HTML-Beschriftung dem Behaelter folgt - gemessen 23,7 px
         Bahnabstand gegen angeschriebene 20. */
      host.style.height=H+'px';

      var x=function(t){ return (t/dauer)*SPUR_W; };

      var teile=['<svg viewBox="'+(viewStart*SPUR_W).toFixed(1)+' 0 '
        +((viewEnd-viewStart)*SPUR_W).toFixed(1)+' '+H+'" preserveAspectRatio="none" data-h="'+H+'">'];

      _letzteBahnen=bahnen; _letzteDauer=dauer;   /* fuer das Neuzeichnen beim Zoom */
      kurvenwahlSetzen(bahnen);
      var yLauf=0;
      bahnen.forEach(function(bahn, r){
        var yKopf=yLauf, BH=bahnInhalt(bahn), y=yKopf+BF_KOPF;
        bahn._yKopf=yKopf; bahn._y=y; bahn._h=BH;          /* für die HTML-Beschriftung */
        yLauf+=BF_KOPF+BH+BF_LUECKE;
        teile.push('<rect x="0" y="'+y+'" width="'+SPUR_W+'" height="'+BH+'" fill="#000"/>');
        /* Die Abschnittsbahn traegt Bloecke statt Marken.

           ABGERUNDETE ECKEN mit schmalem Spalt dazwischen (Caspar_D: "man
           koennte auch die ecken etwas abrunden, dann sieht man die
           grenzen klarer"). Zuvor lagen die Bloecke Kante an Kante und
           ueberlappten um zwei Einheiten, damit an der Stossstelle
           keine Naht blieb - dann war aber auch die Grenze selbst
           nicht mehr zu sehen. Ein ausdruecklicher Spalt loest beides:
           Die Grenze ist sichtbar, und eine Naht kann gar nicht
           entstehen, weil sich nichts beruehrt. */
        /* NEUE AUFTEILUNG (Caspar_D, 23.08.2026): Die Farbe wandert nach oben in
           eine Leuchtlinie, die Flaeche darunter wird massiv abgedunkelt, und
           die Huellkurve bekommt die Farbe, die vorher die Flaeche hatte. So
           traegt der Abschnitt seine Kennung weiter, ohne dass die Kurve gegen
           einen bunten Grund anlaufen muss.

           Der Schein entsteht aus gestapelten FLAECHEN, nicht aus Filtern oder
           Strichen: Das viewBox ist in der Breite gestreckt, ein Strich oder
           ein Weichzeichner wuerde mitgezogen. */
        /* DIE TAKTBAHN: zwei Pfade statt tausend Elementen - einer für die
           Einsen (volle Höhe, voller Ton), einer für die Zählzeiten 2-3-4
           (halbe Höhe, gedämpft). Beide mit non-scaling-stroke, damit die
           Striche einen Bildpunkt dünn bleiben, auch wenn hineingezoomt wird;
           dann treten die einzelnen Schläge hervor, weit draußen bleibt das
           Bild ein Kamm aus Einsen. */
        /* QUADRATE statt Striche (Caspar_D, 23.08.2026): die Eins ein dickes
           rotes, die Zählzeiten 2-3-4 kleine weiße, alle auf der Mittellinie
           der Bahn, darüber die Topline.

           Ein <rect> wäre im gestreckten viewBox zum Rechteck gezerrt. Der
           Griff ist derselbe wie bei den Lolli-Köpfen der Befundmarken: eine
           Strecke der LÄNGE NULL mit eckiger Kappe und non-scaling-stroke -
           daraus wird ein Quadrat, dessen Kantenlänge die Strichstärke ist,
           unabhängig von jedem Zoom. */
        if(bahn.schlaege) teile.push(taktZeichnen(bahn, dauer, y, BH));
        /* Die Kürzelzeile bleibt frei (HTML), darunter die Topline, darunter
           die abgedunkelte Fläche mit der Hüllkurve. */
        var yLinie=y+BF_KUERZEL, yFlaeche=yLinie+1, hFlaeche=BH-BF_KUERZEL-1;

        /* SUNOS WECHSEL als Striche UNTER der Huellkurve. Unten, weil
           oben die Kuerzelzeile der Textabschnitte steht - so kommen
           sich die zwei Quellen nicht ins Gehege, und wo es beide gibt,
           liest man sie uebereinander wie zwei Zeilen einer Partitur.

           non-scaling-stroke: Die Striche bleiben einen Bildpunkt
           breit, egal wie weit gezoomt ist - dieselbe Regel wie bei
           allen Konturen im Haus. Unbunt (TASTE_HELL), weil sie keine
           Bedeutung tragen, nur einen Ort: Jede Kennfarbe waere hier
           eine Behauptung ueber den Inhalt.

           Der Tooltip nennt Sunos Buchstaben - er sagt nicht, WAS der
           Abschnitt ist, aber welchem anderen er gleicht. */
        if(bahn.wechsel && bahn.wechsel.length){
          var yTickU=y+BH, yTickO=Math.max(y+2, yTickU-6);
          bahn.wechsel.forEach(function(t9, i9){
            if(!isFinite(t9) || t9<0 || t9>dauer) return;
            var xw=x(t9);
            teile.push('<line x1="'+xw.toFixed(1)+'" y1="'+yTickO+'" x2="'+xw.toFixed(1)+'" y2="'+yTickU
              +'" stroke="'+TASTE_HELL+'" stroke-width="1" opacity="0.85" vector-effect="non-scaling-stroke"/>');
            /* Trefferflaeche zum Springen und Nachlesen - dieselbe
               Bauart wie bei den Textabschnitten. */
            var lab=bahn.wechselNamen||[];
            var vor=lab[i9], nach=lab[i9+1];
            var wie=(vor&&nach) ? ' · '+vor+' → '+nach : '';
            teile.push('<rect x="'+(xw-14).toFixed(1)+'" y="'+yTickO+'" width="28" height="6" fill="transparent" '
              +'data-t="'+t9.toFixed(2)+'" class="bf-tref"><title>Suno-Wechsel · '+zeitTxt(t9)+wie+'</title></rect>');
          });
        }
        /* KEIN HINTERGRUND MEHR und keine eigene Topline (Caspar_D, 23.08.2026:
           "der Hintergrund der Hüllkurve kommt weg, inklusive seiner Topline;
           die obere Hüllkurvenbegrenzung wird zur Topline"). Die Kurve trägt
           sich selbst: ihre Oberkante IST die Linie. Geblieben sind nur
           unsichtbare Trefferflächen für Klick und Tooltip. */
        if(bahn.abschnitte) bahn.abschnitte.forEach(function(a2){
          var xa=x(a2.von), br=Math.max(0.5,x(a2.bis)-x(a2.von)-3);
          teile.push('<rect x="'+xa.toFixed(1)+'" y="'+yLinie+'" width="'+br.toFixed(1)+'" height="'+(hFlaeche+1)
            +'" fill="transparent" '
            +'data-t="'+Math.max(0,a2.von).toFixed(2)+'" '
            +'class="bf-tref"><title>'+a2.name+' — '+zeitTxt(a2.von)+'–'+zeitTxt(a2.bis)+'</title></rect>');
        });

        /* Sunos eigene Huellkurve ueber die Abschnitte gelegt, um die
           Mitte gespiegelt. Sie liegt seit jeher im Katalog (welle,
           rund 1700 Werte, 0 bis 0,46) und wurde nirgends benutzt.

           SCHWARZ, nicht grau (Caspar_D): Grau legt eine fremde Farbe
           ueber die Abschnitte und nimmt ihnen die Kennung. Schwarz mit
           Teildeckung dunkelt statt zu ueberdecken - jeder Abschnitt
           behaelt seinen Ton, die Kurve erscheint als dunklere Fassung
           desselben. Die Beschriftung liegt darueber, sie ist HTML.

           Kein Strich, nur Flaeche: Ein Strich wuerde im gestreckten
           viewBox mitgezogen, eine Flaeche nicht. */
        if(bahn.welle&&bahn.welle.length){
          var wl=bahn.welle, mx=0;
          for(var i2=0;i2<wl.length;i2++) if(wl[i2]>mx) mx=wl[i2];
          if(mx>0){
            /* UEBER DIE ZEIT abbilden, nicht ueber den Anteil am Array.

               Sunos Huellkurve deckt die KATALOGDAUER ab, nicht die
               Dauer der Datei, die hier analysiert wird. Verteilt man
               sie stumpf ueber die volle Breite, ist sie gestreckt,
               sobald die beiden auseinanderliegen - und dann faengt sie
               nicht dort an, wo die Befunde darunter liegen. (Genau das
               war an einem Song zu sehen: Datei 399,9 s.)

               Reicht sie nicht bis zum Ende, endet sie eben frueher.
               Das ist ehrlicher als sie zu dehnen. */
            var wDauer=bahn.welleDauer||dauer;
            /* Die Kurve sitzt in der Fläche unter der Topline. */
            var mitte=yFlaeche+hFlaeche/2, halb=(hFlaeche-2)/2, d1='', d2='';
            var wx=function(i){ return (i/(wl.length-1))*wDauer/dauer*SPUR_W; };
            for(var i3=0;i3<wl.length;i3++){
              var px2=wx(i3), v2=wl[i3]/mx;
              d1+=(i3?'L':'M')+px2.toFixed(1)+' '+(mitte-v2*halb).toFixed(2)+' ';
            }
            for(var i4=wl.length-1;i4>=0;i4--){
              var px3=wx(i4), v3=wl[i4]/mx;
              d2+='L'+px3.toFixed(1)+' '+(mitte+v3*halb).toFixed(2)+' ';
            }
            /* DIE HUELLKURVE (Caspar_D, 23.08.2026): Ober- und Unterkante als
               harte Linien in voller Abschnittsfarbe, die Fläche dazwischen
               gleichmäßig zu zwei Dritteln deckend. Ein senkrechter Verlauf
               war der erste Versuch und ist wieder raus ("konstant 66 %
               Opazität, kein Gradient") - die Kontur trägt die Form, die
               Füllung nur den Ton.

               Der waagerechte Verlauf bleibt: Er trägt die ABSCHNITTSFARBEN
               über die Länge des Songs. Die Konturen sind Striche mit
               non-scaling-stroke, damit sie einen Bildpunkt dünn bleiben,
               auch wenn die Sicht gestreckt ist. */
            var fuell='#e8e8ec';
            if(bahn.abschnitte&&bahn.abschnitte.length){
              var gid='wellefarbe'+r, stopps='';
              bahn.abschnitte.forEach(function(a3){
                var c=(a3.hell ? heller(ABSCHNITT_FARBE[a3.art]||ABSCHNITT_FARBE.rand, 0.22)
                               : (ABSCHNITT_FARBE[a3.art]||ABSCHNITT_FARBE.rand));
                var p1=Math.max(0,Math.min(1,a3.von/dauer)), p2=Math.max(0,Math.min(1,a3.bis/dauer));
                stopps+='<stop offset="'+(p1*100).toFixed(2)+'%" stop-color="'+c+'"/>'
                      +'<stop offset="'+(p2*100).toFixed(2)+'%" stop-color="'+c+'"/>';
              });
              teile.push('<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="1" y2="0">'+stopps+'</linearGradient></defs>');
              fuell='url(#'+gid+')';
            }
            teile.push('<path d="'+d1+d2+'Z" fill="'+fuell+'" opacity="0.5"/>');
            /* NUR die Oberkante, und die ist jetzt die Topline: voller Ton,
               ein Bildpunkt dünn. Die Unterkante bleibt ohne Linie. */
            teile.push('<path d="'+d1+'" fill="none" stroke="'+fuell+'" stroke-width="1" vector-effect="non-scaling-stroke"/>');
            /* DIE MITTELLINIE GEGEN DIE TAEUSCHUNG (Caspar_D, 25.08.2026:
               "es ist die topline, die eine optische Taeuschung macht,
               vielleicht eine schwarze Haarlinie auf der vertikalen
               Mitte drueberzeichnen").

               Er hat den Grund gefunden, nachdem die Messung ihn
               ausgeschlossen hatte: Die Kurve IST punktgenau
               gespiegelt - nachgerechnet, Abweichung 0,000 - aber nur
               die Oberkante traegt eine Kontur. Ein Rand oben und
               keiner unten laesst die obere Haelfte schwerer wirken,
               und das Auge liest Asymmetrie, wo keine ist.

               Eine Kontur auch unten waere die naheliegende Antwort und
               die falsche: Sie zoege eine zweite Linie durch jede
               Spitze und liesse den Block zuwachsen - genau der Grund,
               aus dem die Unterkante am 23.08. ohne blieb.

               Die Haarlinie auf der Mitte tut das Gegenteil: Sie gibt
               dem Auge die Achse, an der es spiegelt. Schwarz und VOLL
               deckend (Caspar_D, 25.08.2026: "volle Deckung und nur 1px
               breit") - eine halbdurchsichtige Linie mischt sich mit der
               Farbe darunter und wird zum Schleier statt zum Schnitt.

               shape-rendering="crispEdges" schaltet die Kantenglaettung
               ab: Die Mitte liegt oft auf einer halben Bildpunktlage,
               und geglaettet verteilt der Browser den einen Punkt auf
               zwei halbe - die Linie waere doppelt so breit und halb so
               kraeftig. Zusammen mit non-scaling-stroke bleibt sie in
               jeder Zoomstufe genau ein Bildpunkt. */
            teile.push('<line x1="0" y1="'+mitte+'" x2="'+SPUR_W+'" y2="'+mitte+'" stroke="#000"'
              + ' stroke-width="1" shape-rendering="crispEdges" vector-effect="non-scaling-stroke"/>');
          }
        }

        /* KEINE HUELLKURVE IM KATALOG? Dann eine graue Flaeche auf
           Schwarz (Caspar_D, 25.08.2026: "bei dem Naturding war keine
           Bahn da, trotz Ticks" - "mach sie grau auf schwarz, wenn
           nichts da ist").

           68 Songs haben keine welle, fast alle Naturklaenge und
           Ambient-Stuecke ohne Liedtext. Ihre Bahn stand bis eben leer
           da: ein paar Striche unten, sonst nichts - das liest sich wie
           ein Fehler, nicht wie eine Aussage. Die graue Flaeche sagt
           "hier laeuft der Song", die Ticks sagen, wo er sich wendet.

           Hausform wie ueberall: Topline in vollem Ton, ein Bildpunkt
           dick, darunter die Flaeche mit Teildeckung. Unbunt, weil hier
           nichts zu kennzeichnen ist - eine Kennfarbe waere eine
           Behauptung. */
        if(!(bahn.welle&&bahn.welle.length) && (bahn.wechsel||bahn.abschnitte)){
          /* Ohne Abschnitte gibt es keine Kuerzelzeile - dann faengt die
             Flaeche gleich unter dem Kopf an und fuellt die schmale Bahn
             ganz aus. */
          var yG = bahn.abschnitte ? yFlaeche : y+1;
          var hG = bahn.abschnitte ? hFlaeche : BH-1;
          teile.push('<rect x="0" y="'+yG+'" width="'+SPUR_W+'" height="'+hG
            +'" fill="'+TASTE_DUNKEL+'" opacity="0.30"/>');
          teile.push(spurTopline(TASTE_HELL, yG));
        }

        bahn.strecken.forEach(function(f){
          var x1=x(f.von), x2=x(f.bis), farbe=AMPEL[f.stufe];
          var t=Math.max(0,f.von-1).toFixed(2);
          /* Schmaler als vier Einheiten heisst: kein Balken, sondern ein
             Lolli. Sein Kopf ist eine Strecke der Laenge null mit runder
             Kappe und non-scaling-stroke - dadurch bleibt er rund und
             gleich gross, egal wie stark die Sicht gestreckt ist. Ein
             <circle> waere zu einer Ellipse gezerrt. */
          /* KEINE Kontur an den Marken.

             Erst hatten sie eine dunkle - gedacht als Abgrenzung gegen
             das Ausbluehen. Auf schwarzer Bahn liest sie sich aber als
             Schatten und legt einen Rahmen um jeden Block. Der Kontrast
             kommt jetzt vom Grund: Bahn schwarz, Panel 0,9 deckend. */
          if(x2-x1<4){
            var xm=x1.toFixed(1);
            teile.push('<path d="M'+xm+' '+(y+7)+'L'+xm+' '+(y+BF_BAHN-1)+'" stroke="'+farbe
              +'" stroke-width="1" opacity="0.55" vector-effect="non-scaling-stroke" '
              +'data-t="'+t+'" class="bf-tref"><title>'+f.titel+'</title></path>');
            teile.push('<path d="M'+xm+' '+(y+5)+'L'+xm+' '+(y+5)+'" stroke="'+farbe
              +'" stroke-width="6" stroke-linecap="round" vector-effect="non-scaling-stroke" '
              +'data-t="'+t+'" class="bf-tref"><title>'+f.titel+'</title></path>');
          } else {
            /* Der Block: halb deckend, darüber seine eigene Topline in voller
               Stärke - keine Linie darunter (Caspar_D, 23.08.2026). */
            teile.push('<rect x="'+x1.toFixed(1)+'" y="'+(y+1)+'" width="'+(x2-x1).toFixed(1)
              +'" height="'+(BF_BAHN-2)+'" fill="'+farbe+'" opacity="0.5" '
              +'data-t="'+t+'" class="bf-tref"><title>'+f.titel+'</title></rect>');
            teile.push(spurTopline(farbe, y, (x2-x1).toFixed(1), x1.toFixed(1)));
          }
        });
      });
      teile.push('</svg>');
      host.innerHTML=teile.join('');

      /* DER LESEKOPF SETZT AUS, WO KEINE DATEN STEHEN (Caspar_D,
         25.08.2026: "im Panel Lautheitsverläufe läuft der Lesekopf schön
         einzeln über jedes Einzeldiagramm, im Panel Datenbasierte
         Vorschläge mäht ein einziger Lesekopf auch über
         Teilüberschriften - nur die Visualisierungen von Daten sollen
         betroffen sein").

         Dort ist es einfach: jedes Diagramm hat seinen eigenen Kopf.
         Hier stecken alle Bahnen in EINEM SVG, also gibt es auch nur
         einen Kopf, und der lief ueber die volle Hoehe - quer durch die
         14 px Teilueberschrift jeder Bahn und die 3 px Luft dazwischen.

         Statt ihn in Stuecke zu zerlegen (dann muesste updatePlayheads
         viele Elemente schieben statt einem) bekommt das eine Element
         einen Verlauf mit harten Kanten: sichtbar genau ueber _y bis
         _y+_h jeder Bahn, durchsichtig ueber Kopf und Luecke. Die Lagen
         stehen ohnehin schon fest, sie wurden eben beim Zeichnen
         gesetzt. */
      var ph=document.getElementById('ph-befundspur');
      if(ph){
        var FARBE='rgba(255,255,255,0.55)', halte=[];
        bahnen.forEach(function(b){
          if(!(b._h>0)) return;
          var o=b._y, u=b._y+b._h;
          halte.push('transparent '+o+'px', FARBE+' '+o+'px',
                     FARBE+' '+u+'px',     'transparent '+u+'px');
        });
        /* Ohne Bahn mit Inhalt bleibt der durchgehende Strich aus dem
           Stylesheet - besser ein Kopf zuviel als gar keiner. */
        ph.style.background = halte.length
          ? 'linear-gradient(to bottom,'+halte.join(',')+')' : '';
      }

      /* Namen als HTML darueber - im SVG wuerden sie mitgestreckt. */
      /* In ANTEILEN, nicht in Pixeln.

         Das SVG wird senkrecht auf die Elementhoehe gestreckt, und die
         muss nicht der gezeichneten Hoehe entsprechen - gemessen lagen
         die Bahnen 23,7 px auseinander, waehrend feste 20 px
         angeschrieben waren, und die Beschriftung wanderte von Bahn zu
         Bahn weiter nach oben. Mit Prozentwerten macht sie jede
         Streckung mit. */
      if(namen) namen.innerHTML=bahnen.map(function(bahn,r){
        var oben=bahn._yKopf/H*100, hoch=BF_KOPF/H*100;
        /* JEDE Bahn trägt ihre Überschrift darüber - auch die Struktur
           (Caspar_D, 23.08.2026: "Die abschnittweise Hüllkurve braucht eine
           Überschrift - Track-Struktur ... dann Unterüberschrift ... und
           jedes folgende Blockdiagramm genauso"). Vorher stand der Name
           links NEBEN der Bahn und fehlte der Abschnittsbahn ganz. */
        var stueck='<span class="kopf" style="top:'+oben.toFixed(3)+'%;height:'+hoch.toFixed(3)
          +'%">'+bahn.name+'</span>';
        /* Die Abschnittsnamen stehen IM Block, ebenfalls als HTML - im
           gestreckten SVG wuerde Text verzerrt. Zu schmale Bloecke
           bekommen keinen Namen, nur den Tooltip. */
        /* Die Kürzel stehen jetzt als eigene ZEILE über der Topline und in
           der FARBE ihres Abschnitts - vorher lagen sie weiß im Block und
           mussten sich gegen die Füllung behaupten (Caspar_D, 23.08.2026). */
        if(bahn.abschnitte){
          var kOben=(bahn._y)/H*100, kHoch=BF_KUERZEL/H*100;
          stueck+=bahn.abschnitte.map(function(a2){
            var l=a2.von/dauer*100, br=(a2.bis-a2.von)/dauer*100;
            if(br<1.5) return '';
            var c=(a2.hell ? heller(ABSCHNITT_FARBE[a2.art]||ABSCHNITT_FARBE.rand, 0.22)
                           : (ABSCHNITT_FARBE[a2.art]||ABSCHNITT_FARBE.rand));
            /* Ausgeschrieben, wo er passt - sonst das Kürzel (Caspar_D,
               23.08.2026: "die Abschnittsnamen können wir ausschreiben,
               zumindest wenn sie passen, ansonsten Verse .."). Was passt,
               entscheidet erst die Messung nach dem Setzen (siehe unten);
               reicht auch das Kürzel nicht, kürzt der Browser mit
               Auslassungspunkten. */
            /* Die ZEITEN mitgeben: Die Kürzel müssen beim Zoomen und
               Verschieben mitwandern, und das rechnet namenAusrichten()
               später aus der jeweiligen Sicht (23.08.2026). */
            return '<span class="abs" data-kurz="'+a2.kurz+'" data-von="'+a2.von+'" data-bis="'+a2.bis+'"'
              +' style="top:'+kOben.toFixed(3)+'%;height:'+kHoch.toFixed(3)
              +'%;left:'+l.toFixed(3)+'%;width:'+br.toFixed(3)+'%;color:'+c+'" title="'+a2.name+'">'
              +a2.name+'</span>'; }).join('');
        }
        return stueck; }).join('');

      _namenDauer=dauer;
      namenAusrichten();
      /* Jetzt erst messen: Ein Name, der breiter ist als sein Block, fällt
         auf sein Kürzel zurück. Vorher ging das nicht - die Breite steht
         erst fest, wenn das Element im Baum hängt. */
      if(namen) requestAnimationFrame(function(){
        namen.querySelectorAll('.abs[data-kurz]').forEach(function(el){
          if(el.scrollWidth > el.clientWidth + 1) el.textContent = el.dataset.kurz;
        });
      });

      host.querySelectorAll('.bf-tref').forEach(function(el){
        el.style.cursor='pointer';
        el.onclick=function(){ SPRUNG(parseFloat(el.dataset.t)); };
      });
    }

    /* HAUSREGEL: mehrspaltig, wenn der Platz reicht.

       Eine Tabelle mit vielen kurzen Zeilen laesst rechts eine leere
       Haelfte stehen. Deshalb werden die Zeilen geteilt und die Stuecke
       als eigene Raster nebeneinander gesetzt, in einen umbrechenden
       Behaelter. Passen sie nicht nebeneinander, rutschen sie von
       selbst untereinander - entschieden vom Umbruch, nicht von einer
       geratenen Fensterbreite und ohne Messung.

       Geteilt wird ab TEILEN_AB Zeilen.

       STAND 19.08.2026: VIER, nicht sechs. Die Schwelle lag bei sechs,
       und damit stand die Schimmertabelle mit ihren vier Funden
       einspaltig da, waehrend rechts die halbe Breite leer blieb -
       genau das, wogegen die Regel gemacht war. (Caspar_D: "die Tabelle
       steht wieder in 4 Zeilen in einer Spalte, wir hatten doch gesagt,
       dass die immer geteilt und 2spaltig dargestellt werden soll.")

       Tiefer als vier nicht: Bei drei Zeilen traegt eine Spalte nur
       noch eine einzige, und das liest sich nicht mehr als Tabelle.
       Passen die beiden Stuecke nicht nebeneinander, rutschen sie vom
       Umbruch von selbst untereinander - die Schwelle entscheidet nur,
       ob geteilt WIRD, nicht ob es passt.

       Die Kopfzeile steht in JEDER Spalte. Das ist keine ueberfluessige
       Wiederholung, sondern die Bedingung dafuer, dass die zweite
       Spalte ueberhaupt lesbar ist - anders als ein Wort, das in jeder
       ZEILE steht und in den Kopf gehoert. */
    var TEILEN_AB=4;

    /* Der vierte Parameter erzwingt eine Gruppenzahl. Der Plattform-
       Vergleich laeuft seit dem 25.08.2026 DREIGETEILT zu je zwei Zeilen
       (Caspar_D: "dreiteile die tabelle zu a 2 Zeilen") - so füllt er
       die Breite mit Inhalt statt mit gestreckten Spalten. Die
       Schimmerfunde behalten die alte Zweiteilungs-Regel. */
    function tabelleMehrspaltig(klasse, kopf, zeilen, wunsch){
      var spalten=wunsch || (zeilen.length>=TEILEN_AB ? 2 : 1);
      var proSpalte=Math.ceil(zeilen.length/spalten), aus='';
      for(var i=0;i<spalten;i++){
        var stueck=zeilen.slice(i*proSpalte,(i+1)*proSpalte);
        if(!stueck.length) continue;
        aus+='<div class="'+klasse+'">'+kopf+stueck.join('')+'</div>';
      }
      return '<div class="bf-paare">'+aus+'</div>';
    }

    function befundeZeigen(msg){
      registerBauen();
      var ziel=ZIELE[ZIEL_AKTIV]||ZIELE.streaming;
      /* Die Dauer NICHT aus _chartData.dur holen: Die wird erst mit der
         Hüllkurven-Nachricht gesetzt, und die Normnachricht ist früher
         da - dann stand hier null und die Befundspur blieb leer,
         obwohl Funde vorlagen. Die Reihen tragen die Dauer selbst. */
      var dauer=(msg.spitzeVerlauf&&msg.spitzeVerlauf.length*(msg.spitzeSchritt||0.1))
             || (window._chartData&&window._chartData.dur) || 0;

      var soll=ziel.lufs-msg.lufs;                 // so viel fehlt an Lautheit
      var luft=ziel.tp-msg.truePeak;               // so viel Luft bis zur Spitze

      /* ---- Gegenueberstellung: verlangt gegen gemessen -------------- */
      var tol=ziel.toleranz||0.5;
      /* Kopfzeile, sonst stehen zwei nackte Zahlen nebeneinander und
         niemand weiss, welche das Ziel ist und welche der Messwert.
         (Caspar_D: "es ist nicht klar, was die zielgroesse ist und was im
         song gemessen wurde.") Dieselbe Regel wie bei den
         Schimmerfunden: was fuer alle Zeilen gilt, steht im Kopf. */
      var KOPF='<span class="kopf"></span>'
        +'<span class="kopf" style="text-align:right">Ziel</span>'
        +'<span class="kopf" style="text-align:right">dieser Song</span>'
        +'<span class="kopf"></span>';
      var zeilenV=[];
      var v=function(gr, soll, ist, stufe, urteil){
        zeilenV.push('<span class="gr">'+gr+'</span><span class="soll">'+soll+'</span>'
          +'<span class="ist">'+ist+'</span>'
          +'<span class="urteil" style="color:'+AMPEL[stufe]+'">'+urteil+'</span>'); };

      /* Was die Plattform tut, steht einmal oben - nicht in jeder
         Zeile. Es ist ihre Eigenschaft, nicht die des Parameters. */
      var verhalten = ziel.regelt==='leiser' ? 'dreht nur zurück, hebt nie an'
                    : ziel.regelt==='beides' ? 'regelt in beide Richtungen, hebt mit Begrenzer an'
                    : 'regelt nicht';
      document.getElementById('sa-plattform').innerHTML=
        '<b>'+ziel.name+'</b> — '+verhalten+' · '+ziel.merkmal;

      var lautStufe = Math.abs(soll)<=tol ? 0
                    : (soll<0 ? (ziel.regelt==='nein'?2:1) : (ziel.regelt==='beides'?2:1));
      var lautUrteil = Math.abs(soll)<=tol ? 'passt'
                     : (soll<0 ? (-soll).toFixed(1)+' LU zu laut' : soll.toFixed(1)+' LU zu leise');
      v('Lautheit', ziel.lufs+' LUFS', msg.lufs.toFixed(1), lautStufe, lautUrteil);

      v('Spitze', '≤ '+ziel.tp.toFixed(1)+' dBTP',
        msg.truePeak.toFixed(1), msg.truePeak>ziel.tp?2:0,
        msg.truePeak>ziel.tp? Math.abs(luft).toFixed(1)+' dB darüber' : luft.toFixed(1)+' dB Luft');

      /* Die Normalisierung der Dienste ist STATISCH: ein Verstaerkungswert
         je Song, aus der integrierten Lautheit. Die Schwankung ist
         verstaerkungsinvariant - sie ueberlebt das Regeln immer. Der
         fruehere Text 'ueberlebt die Regelung nicht' war fachlich falsch
         (25.08.2026, Review). Einziger echter Sonderfall: Plattformen,
         die anheben ('beides'), schicken zu leise Songs durch einen
         Begrenzer - der greift in die Spitzen. */
      v('Schwankung', '—', msg.lra.toFixed(1)+' LU', 0,
        (ziel.regelt==='beides' && soll>tol)
          ? 'beim Anheben greift der Begrenzer in die Spitzen'
          : 'bleibt erhalten');

      /* 'Uebersteuert' erst bei LAEUFEN am Anschlag (>=3 in Folge, im
         Worker gezaehlt). Einzelne Werte an der Decke sind heisses, aber
         sauberes Mastern - vorher machte schon ein Wert die Ampel rot.
         Alte Ablagen kennen clipLauf nicht (undefined): dann gilt das
         alte, strenge Urteil weiter, statt faelschlich zu entwarnen. */
      if(msg.clip>0 && msg.clipLauf===0)
        v('Vollausschläge','keine', msg.clip.toLocaleString('de-DE')+' einzeln', 1,
          'am Anschlag, aber nie in Folge');
      else if(msg.clip>0)
        v('Vollausschläge','keine', msg.clip.toLocaleString('de-DE'), 2,
          'übersteuert'+(msg.clipLauf>0?' ('+msg.clipLauf+' Läufe)':''));
      else v('Vollausschläge','keine','0',0,'');

      v('Phase','positiv', msg.negPhase.toFixed(0)+'% negativ', msg.negPhase>5?1:0,
        msg.negPhase>5?'löscht sich stellenweise':'');

      /* Neue Kante, wenn gerechnet; alte Ablagen liefern nur grenzHz. */
      var obereK=isFinite(msg.kanteHz)?msg.kanteHz:msg.grenzHz;
      if(isFinite(obereK)) v('obere Grenze','—', (obereK/1000).toFixed(1)+' kHz', 0, '');
      document.getElementById('sa-vergleich').innerHTML=
        tabelleMehrspaltig('bf-vergleich', KOPF, zeilenV, 3);

      /* ---- Strecken je Plattform ----------------------------------- */
      var bahnen=[];

      if(msg.spitzeVerlauf&&msg.spitzeVerlauf.length){
        var idx=[], sv=msg.spitzeVerlauf, sch=msg.spitzeSchritt||0.1;
        for(var i=0;i<sv.length;i++) if(sv[i]>ziel.tp) idx.push(i);
        /* Kein Mindestmass mehr: Auch ein einzelner Ausreisser wird
           gezeigt, nur eben als Lolli. Vorher fielen Einzelfunde
           stillschweigend heraus - und ein einzelner Vollausschlag ist
           genau die Stelle, die man hoeren will. */
        var st=strecken(idx, sch, 3).map(function(x){
            x.stufe=2;
            if(x.anzahl>1){
              var takt=(x.bis-x.von)/x.anzahl;
              x.titel=zeitTxt(x.von)+'–'+zeitTxt(x.bis)+': '+x.anzahl+' Überschreitungen, '
                     +'etwa alle '+takt.toFixed(1)+' s';
            } else {
              x.titel=zeitTxt(x.von)+': einzelne Überschreitung über '+ziel.tp.toFixed(1)+' dBTP';
            }
            return x; });
        if(st.length) bahnen.push({name:'Spitzen über dem Ziel — über '+ziel.tp.toFixed(1)+' dBTP', strecken:st});
      }

      if(msg.clipVerlauf&&msg.clip>0){
        var idx2=[], cv=msg.clipVerlauf, sch2=msg.clipSchritt||0.1;
        for(var i=0;i<cv.length;i++) if(cv[i]>0) idx2.push(i);
        var st2=strecken(idx2, sch2, 2).map(function(x){
          x.stufe=2;
          x.titel=(x.anzahl>1 ? zeitTxt(x.von)+'–'+zeitTxt(x.bis)+': Vollausschläge in '+x.anzahl+' Fenstern'
                              : zeitTxt(x.von)+': Vollausschlag');
          return x; });
        if(st2.length) bahnen.push({name:'Vollausschläge — digitale Übersteuerung', strecken:st2});
      }

      if(msg.korrVerlauf&&msg.korrVerlauf.length){
        var idx3=[], kv=msg.korrVerlauf, sch3=msg.korrSchritt||0.4;
        for(var i=0;i<kv.length;i++) if(isFinite(kv[i])&&kv[i]<-0.10) idx3.push(i);
        var st3=strecken(idx3, sch3, 2).map(function(x){ x.stufe=1;
            x.titel=(x.anzahl>1 ? zeitTxt(x.von)+'–'+zeitTxt(x.bis) : zeitTxt(x.von))
                   +': negative Korrelation, in Mono löscht sich etwas aus';
            return x; });
        if(st3.length) bahnen.push({name:'Teilweise Stereoauslöschung — Phase negativ', strecken:st3});
      }

      
      /* Die Abschnittsbahn steht OBEN: Sie ist der Bezugsrahmen, in
         dem die Befunde darunter gelesen werden. */
      /* Die Worte kommen aus _katalogDaten. Bis zum 25.08.2026 stand hier
         ein Rueckfall auf currentMeta - das war der vierte Fund derselben
         Luecke: currentMeta wurde NUR im Suno-Weg gesetzt (analyze), und
         den gibt es nicht mehr. Der Rueckfall lief also ohnehin ins
         Leere; jetzt ist er fort. */
      /* LAUTHEIT ÜBER DEM ZIEL: Wo die Kurzzeitlautheit (3 s) über dem Ziel
         der gewählten Plattform liegt, traegt den Ueberschuss, um den der
         GANZE Song beim Abspielen abgesenkt wird - die Plattform regelt
         statisch, nicht je Stelle. Der fruehere Bahnname 'wird beim
         Abspielen heruntergeregelt' behauptete eine dynamische Regelung,
         die es nicht gibt (berichtigt 25.08.2026, Review). Eine
         Fundstelle wie jede andere (23.08.2026). */
      if(window._chartData&&window._chartData.kurz&&ziel&&isFinite(ziel.lufs)){
        var kz=window._chartData.kurz, kSchritt=(dauer/kz.length), kIdx=[];
        for(var i5=0;i5<kz.length;i5++) if(isFinite(kz[i5])&&kz[i5]>ziel.lufs+0.5) kIdx.push(i5);
        var st5=strecken(kIdx, kSchritt, 5).map(function(x){
          x.stufe=1;
          x.titel=zeitTxt(x.von)+'–'+zeitTxt(x.bis)+': lauter als das Ziel von '
                 +ziel.lufs+' LUFS ('+ziel.name+')';
          return x; });
        if(st5.length) bahnen.push({name:'Lauter als das Ziel — hier sitzt der Pegelüberschuss', strecken:st5});
      }

      /* STEHENDE TÖNE aus dem geprüften Detektor (bin/stoerfrequenz.js), von
         KlangTresor mitgereicht. Er nennt keine Zeitabschnitte, sondern den Anteil
         am Song - also läuft der Block über die ganze Länge, und der Anteil
         steht im Tooltip. Ehrlicher als eine erfundene Stelle. */
      var stT=(_katalogDaten&&_katalogDaten.stehendeToene)||null;
      if(stT&&stT.length){
        var st6=stT.map(function(c){
          var stoer=(c.art==='Stoerton'||c.art==='Brummen');
          return { von:0, bis:dauer, stufe:stoer?2:0,
                   titel:(c.hz>=1000?(c.hz/1000).toFixed(2).replace('.',',')+' kHz':Math.round(c.hz)+' Hz')
                        +' · '+(c.art||'Ton').replace('Stoerton','Störton')
                        +' · '+c.db+' dB über der Nachbarschaft · in '+Math.round(c.dauer*100)+' % des Songs'
                        +(c.note?' · '+c.note+(c.cent>=0?'+':'')+c.cent+' Cent':'') }; });
        bahnen.push({name:'Stehende Töne — aus dem Glockenstuhl (2,7 Hz Auflösung)', strecken:st6});
      }

      var quelleWorte=(_katalogDaten&&_katalogDaten.worte)||null;
      var abs=abschnitteAusText(quelleWorte, dauer);
      /* DER TAKT, wie Suno ihn selbst erkannt hat: [Sekunde, Zählzeit 1..4].
         Kein geschätzter Verlauf, sondern das gemessene Raster - deshalb steht
         diese Bahn da, wo früher "Tempo über Zeit" stand (23.08.2026). */
      var schl=(_katalogDaten&&_katalogDaten.schlaege)||null;
      if(schl&&schl.length>8){
        var abst=[]; for(var i7=1;i7<schl.length;i7++) abst.push(schl[i7][0]-schl[i7-1][0]);
        var srt=abst.slice().sort(function(a,b){return a-b;});
        var med=srt[srt.length>>1];
        bahnen.unshift({name:'Takt — Sunos Schlagraster'+(med>0?' · '+Math.round(60/med)+' BPM':''),
                        strecken:[], schlaege:schl});
      }
      /* DIE HUELLKURVE HAENGT NICHT AN DER GLIEDERUNG (Caspar_D,
         25.08.2026: "das darf nicht sein, dass die weg ist").

         Bis heute wurde die Bahn nur angelegt, wenn Abschnitte gefunden
         waren - und weil Sunos Huellkurve in derselben Bahn liegt, fiel
         sie mit ihnen weg. Betroffen waren 40 von 321 Songs, die
         meisten davon mit Whisper-Zeitmarken: Whisper hoert den Gesang
         und kennt keine Abschnittsmarken.

         Die Huellkurve ist aber fuer sich schon eine Aussage - wo laut,
         wo leise, wo Pausen. Sie steht jetzt auch allein, dann unter
         ihrem eigenen Namen: "Track-Struktur" verspricht eine
         Gliederung, die es ohne Abschnitte nicht gibt. */
      var welleRoh=(_katalogDaten&&_katalogDaten.welle)||null;
      /* SUNOS EIGENE WECHSEL (Caspar_D, 25.08.2026: "wir schreiben ticks
         ueber oder unter die huellkurve fuer jeden wechsel, weil wir ja
         keine Namen haben. Suno-Wechsel oder so aehnlich kann die
         heissen").

         Suno erkennt die Abschnittsgrenzen AKUSTISCH und unabhaengig vom
         Text - /api/gen/<id>/novelty-sections, im Katalog als
         'abschnitte'. Die Daten liegen fuer alle 321 Songs im Archiv und
         wurden bis heute nirgends gelesen.

         Benannt sind sie nicht: segment_labels sagt nur A, B, C - welche
         Teile einander AEHNELN, nicht was sie sind. Deshalb Striche und
         keine Namen; erfundene Namen waeren schlechter als keine.

         Gegenprobe an "Moissanit": Sechs von zehn Textabschnitten liegen
         innerhalb von zwei Sekunden an einem Suno-Wechsel. Wo der Text
         "Strophe 2 - Strophe 3" sagt, hoert Suno keinen: Es klingt
         gleich. Umgekehrt findet Suno drei Wechsel, die kein Wort nennt.
         Beide Quellen messen also Verschiedenes - deshalb stehen sie
         nebeneinander und nicht anstelle voneinander. */
      var sunoAbs=(_katalogDaten&&_katalogDaten.abschnitte)||null;
      var wechsel=(sunoAbs && sunoAbs.state==='complete' && Array.isArray(sunoAbs.peak_times))
                  ? sunoAbs.peak_times : null;
      /* DIE HUELLKURVE RECHNEN WIR SELBST (Caspar_D, 25.08.2026: "und ne
         huellkurve muss es ja geben, das kann jeder Player, wo kommt die
         denn her").

         Stimmt - und unsere ist die bessere. Sunos welle liegt im
         Katalog mit rund 5 Werten je Sekunde und fehlt bei 68 Songs;
         _chartData.energy kommt aus dem eigenen Rechenkern, hat 20
         Werte je Sekunde und gibt es fuer JEDEN Song.

         IMMER DIE EIGENE (Caspar_D, 25.08.2026: "warum nehmen wir die
         nicht immer und legen nur sunos abschnitte und farbgebung
         drueber"). Zuerst hatte Sunos Kurve den Vortritt, weil sie die
         KATALOGDAUER abdeckt - aber genau das spricht dagegen: Die
         Abschnitte stammen aus den Wort-Zeitmarken der Aufnahme, und
         alle Bahnen darunter liegen auf der Dauer der analysierten
         Datei. Die eigene Kurve teilt diese Zeitachse; Sunos musste
         gegen sie gestreckt werden. Eine Quelle fuer alle 321 Songs,
         viermal feiner, und keine zwei Zeitachsen mehr im selben Bild.

         Von Suno bleiben die Abschnitte und ihre Farbgebung - die
         liegen ohnehin im Text, nicht in der Kurve.

         Die Energie kommt SPAETER als diese Bahn: norm baut die
         Befundspur, envelope liefert sie erst danach. Deshalb traegt
         huellkurveNachtragen() sie nach, sobald sie da ist. Sunos welle
         bleibt nur noch Rueckfall, falls gar keine Energie kommt. */
      var eigeneRoh = (window._chartData && window._chartData.energy) || null;
      var eigene = kurveFormen(eigeneRoh);
      var welleJetzt = (eigene && eigene.length) ? eigene : ((welleRoh && welleRoh.length) ? welleRoh : null);
      bahnen.unshift({name: abs.length ? 'Track-Struktur' : 'Hüllkurve',
          strecken:[], abschnitte: abs.length?abs:null,
          welle: welleJetzt,
          welleRoh: (eigene && eigene.length) ? eigeneRoh : welleRoh,
          welleEigen: !!(eigene && eigene.length),
          welleDauer: (eigene && eigene.length)
                      ? ((window._chartData&&window._chartData.dur)||dauer)
                      : ((_katalogDaten&&_katalogDaten.dauer)||null),
          wechsel: wechsel,
          wechselNamen: (sunoAbs && sunoAbs.segment_labels) || null});

      befundspurZeichnen(bahnen, dauer);

      /* ---- Die bisherigen Textbefunde ------------------------------ */
      var stufe, text, tipp;
      if(soll>0.5&&luft<soll){
        stufe=2;
        text='Zu leise für '+ziel.name+' um '+soll.toFixed(1)+' LU — aber nur '
             +luft.toFixed(1)+' dB Luft bis zur Spitze.';
        tipp='Lauter geht nur mit Begrenzer, nicht mit dem Regler.';
      } else if(Math.abs(soll)<=0.5&&msg.truePeak<=ziel.tp+0.1){
        stufe=0; text='Passt für '+ziel.name+'.'; tipp='';
      } else if(soll<-0.5){
        stufe=1; text='Um '+(-soll).toFixed(1)+' LU lauter als '+ziel.name+' — wird beim Abspielen leiser geregelt.';
        /* Statische Absenkung erhaelt die Dynamik vollstaendig - der
           fruehere Tipp behauptete das Gegenteil (25.08.2026, Review). */
        tipp='Kein Fehler: der ganze Song wird um diesen Betrag abgesenkt, die Dynamik bleibt dabei erhalten.';
      } else {
        stufe=1; text='Um '+soll.toFixed(1)+' LU leiser als '+ziel.name+'.';
        tipp='Anheben möglich, '+luft.toFixed(1)+' dB Luft vorhanden.';
      }
      var zeilen=['<div class="bf'+(stufe?'':' gut')+'">'
        +'<span class="ampel" style="background:'+AMPEL[stufe]+'"></span>'
        +'<span class="wo">Pegel</span><span class="was">'+text+'</span>'
        +'<span class="tipp">'+tipp+'</span></div>'];
      document.getElementById('sa-urteil').innerHTML=zeilen.join('');

      
      document.querySelectorAll('#sa-befunde .wo[data-t]').forEach(function(el){
        el.onclick=function(){ SPRUNG(parseFloat(el.dataset.t)); };
      });
    }

    /* ------------------------------------------------------------------
       Eine Spur zeichnen.

       Übernommen aus den Sequenzprofilen:
         - festes viewBox-Koordinatensystem, per CSS gestreckt
         - vector-effect="non-scaling-stroke", sonst würde die Linie mit
           gestreckt und wäre in breiten Fenstern fett
         - Fläche mit Deckkraft 0,15 UND Linie mit 1,4 - die Fläche gibt
           Gewicht, die Linie die Genauigkeit
         - Schwellen als gestrichelte Linie IM Bild, nicht daneben
         - Beschriftung in der Farbe der Spur, keine Legendenkiste
       ------------------------------------------------------------------ */
    /* Die Spur wird EINMAL über den ganzen Song gezeichnet, in 6000
       logischen Einheiten. Zoomen und Schieben ändern danach nur noch
       die viewBox - ein Attribut, kein neuer Pfad.

       Das ist der eigentliche Gewinn der SVG-Bauart, und ich hatte ihn
       zuerst verschenkt: Beim Abspielen mit Zoom läuft
       redrawAllCharts() in JEDEM Einzelbild, und dort ein SVG aus
       tausend Punkten neu zusammenzusetzen legt den Hauptfaden lahm -
       die Maus reagiert dann nicht mehr. Jetzt kostet ein Bild eine
       Zuweisung.

       6000 Einheiten, weil bei 32-fachem Zoom noch 187 Punkte im
       Ausschnitt liegen sollen. */
    var SPUR_W=6000;

    /* ===================================================================
       DIE FORMENSPRACHE ALLER VERLAUFSBILDER - EINE STELLE (23.08.2026)

       Caspar_D: "da waren noch mehr Domain-Plots, die solltest du analog
       bauen" und "wir machen sie jetzt zentral richtig". Vorher zeichnete
       jede Spur für sich, mit eigenen Deckungen und Strichstärken; eine
       Änderung am Aussehen musste an vier Stellen nachgezogen werden.

       Der Bauplan einer Spur, von oben:
         1 px   TOPLINE in voller Farbe, hart - als Fläche, nicht als
                Strich: Das viewBox ist in der Breite gestreckt, in der
                Höhe nicht, also ist height="1" genau ein Bildpunkt.
         Fläche unter der Kurve, gleichmäßig SPUR_DECKUNG deckend.
         KONTUR entlang der Kurve, volle Farbe, ein Bildpunkt dünn
                (non-scaling-stroke, sonst würde sie mitgestreckt).

       GELTUNGSBEREICH: bis zum Frequenzspektrum, also Track-Struktur und
       Befundbahnen. Was danach kommt (die neun Verlaufsspuren, die
       Lautheitsspuren, Chroma, Stereopanorama), bleibt bewusst im alten
       Stand - Caspar_D, 23.08.2026: "danach war alles von der Designsprache
       in Ordnung".

       Wer das Aussehen ändern will, ändert es HIER - einmal. */
    var SPUR_DECKUNG=0.66;      /* Füllung unter der Kurve */
    var SPUR_KONTUR=1;          /* Strichstärke der Kurve in Bildpunkten */

    /* Die Topline einer Bahn oder eines Blocks. y ist ihr oberer Rand;
       x und breite grenzen sie ein (ohne beides: volle Spurbreite).
       deckung nur, wo sie gedimmt liegen muss (Chroma-Zellen). */
    function spurTopline(farbe, y, breite, x, deckung){
      return '<rect x="'+(x||0)+'" y="'+(y||0)+'" width="'+(breite||SPUR_W)
        +'" height="1" fill="'+farbe+'"'+(deckung?' opacity="'+deckung+'"':'')+'/>';
    }
    /* Fläche + Kontur eines Kurvenzugs in der Hausfarbe. */
    function spurZug(pfade, farbe, opt){
      opt=opt||{};
      var t='';
      if(pfade.flaeche) t+='<path d="'+pfade.flaeche+'" fill="'+(opt.fuell||farbe)+'" opacity="'
        +(opt.deckung!=null?opt.deckung:SPUR_DECKUNG)+'"'+(opt.clip?' clip-path="'+opt.clip+'"':'')+'/>';
      if(pfade.linie) t+='<path d="'+pfade.linie+'" fill="none" stroke="'+(opt.strich||farbe)
        +'" stroke-width="'+SPUR_KONTUR+'" vector-effect="non-scaling-stroke"'
        +(opt.clip?' clip-path="'+opt.clip+'"':'')+'/>';
      return t;
    }
    /* Ein ganzes Spurbild: Rahmen, Topline, Inhalt. */
    function spurBild(H, farbe, inhalt, opt){
      opt=opt||{};
      return '<svg viewBox="0 0 '+SPUR_W+' '+H+'" preserveAspectRatio="none" data-h="'+H+'">'
        + (opt.vor||'')
        + (opt.ohneTopline ? '' : spurTopline(farbe, 0))
        + inhalt
        + (opt.nach||'')
        + '</svg>';
    }

    /* Tastenfarben der Klaviatur, von Chroma-Spur und Waermekarte
       gemeinsam benutzt. 1 = weisse Taste. C Cis D Dis E F Fis G Gis A
       Ais H. */
    var WEISSE_TASTE=[1,0,1,0,1,1,0,1,0,1,0,1];
    /* Hellgrau und Mittelgrau, nicht Weiss und Grau (Caspar_D: "das weiss
       ist zu weiss"). Zwoelf Baender in reinem Weiss auf Schwarz sind
       zwoelf Scheinwerfer; die Klaviatur soll den Ort geben, nicht
       blenden. Der Abstand zwischen den beiden bleibt gross genug, um
       Halbtoene auf einen Blick zu trennen. */
    var TASTE_HELL='#b0b0b6', TASTE_DUNKEL='#6c6c72';

    /* EINE FARBE ALS TEXT LESBAR MACHEN, ohne sie zu verlieren.
       Beschriftungen tragen die Farbe ihres Gegenstands - das ordnet zu,
       aber ein dunkles Bandblau (#0b2d59) kommt als Text auf 2,4:1 und
       ist damit nicht mehr zu lesen (gemessen 24.08.2026). Hier wird
       nur so weit gegen Weiss aufgehellt, bis 4,5:1 erreicht sind: Der
       Farbton bleibt, die Zuordnung bleibt, der Text wird lesbar.
       Die FLAECHEN behalten ihre Farbe unveraendert - dort steht nichts
       zu lesen. */
    function leuchtkraft(c){
      var f = c.map(function(v){ v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); });
      return 0.2126*f[0] + 0.7152*f[1] + 0.0722*f[2];
    }
    function lesbar(farbe, ziel){
      ziel = ziel || 4.5;
      var m = /^#([0-9a-f]{6})$/i.exec(String(farbe));
      if (!m) return farbe;
      var c = [parseInt(m[1].slice(0,2),16), parseInt(m[1].slice(2,4),16), parseInt(m[1].slice(4,6),16)];
      var lg = leuchtkraft([10,10,10]);
      for (var t = 0; t <= 1.0001; t += 0.04) {
        var v = c.map(function(x){ return Math.round(x + (255-x)*t); });
        if ((leuchtkraft(v) + 0.05) / (lg + 0.05) >= ziel)
          return '#' + v.map(function(x){ return ('0'+x.toString(16)).slice(-2); }).join('');
      }
      return '#ffffff';
    }

    function spurPfad(reihe, dur, hoch, H, pad, lo, hi, bloecke, vonNull){
      /* IMMER die ganze Reihe, nie ein Ausschnitt.

         Der Satz, der hier stand - der Ausschnitt komme aus viewStart/
         viewEnd wie bei allen anderen Diagrammen - stammt aus der Zeit
         vor der viewBox und war seitdem falsch. Genau umgekehrt: Der
         Pfad laeuft ueber 0..SPUR_W durch alle Punkte, und den
         Ausschnitt schneidet spurSichtSetzen() spaeter mit einem
         Attribut heraus. Deshalb muss beim Zoomen nichts neu gerechnet
         werden - siehe redrawAllCharts(). */
      var n=reihe.length, vonI=0, bisI=n;
      if(bisI-vonI<2) return null;
      var rng=(hi-lo)||1;
      var y=function(v){
        var q=(Math.max(lo,Math.min(hi,v))-lo)/rng;
        return hoch ? H-pad-q*(H-2*pad) : pad+q*(H-2*pad);
      };
      /* DIE FLAECHE HAENGT AN DER ACHSE, NICHT AM BODEN.

         Bei einer zweiseitigen Groesse - Frequenzgewicht, Stereolage -
         liegt die Achse in der MITTE, und die Fuellung gehoert zwischen
         Kurve und Achse. Sie lief bis zum 19.08.2026 vom unteren Rand
         hoch: Unterhalb der Mitte war damit alles ausgefuellt, auch wo
         die Kurve gar nicht war, und das Bild log ueber das Vorzeichen.
         (Caspar_D: "die Fuellung geht nicht von unten aus sondern von der
         x-Achse und die ist hier in der Mitte.") */
      var grund = vonNull ? y(0) : (hoch?H-pad:pad);
      /* DER BEZUG IST DIE MITTE DES ABGEDECKTEN BEREICHS.

         Vorher lief die Abbildung ueber p/(Punkte-1): erster Punkt ganz
         links, letzter ganz rechts. Das ist die richtige Abbildung fuer
         ABTASTWERTE - fuer BLOECKE nicht. Eine Blockreihe deckt mit
         Index i den Bereich [i*d, (i+1)*d) ab; der Wert beschreibt also
         die Blockmitte, gezeichnet wurde er am Blockanfang.

         Betroffen waren alle Reihen aus nicht ueberlappenden Bloecken:
         Signalenergie 50 ms (25 ms Versatz), Crest und Impulsdichte
         500 ms (250 ms), die FFT-Kurven mit 4096 Werten (rund 43 ms).
         Dieselbe Klasse Fehler wie die Kurzzeitlautheit, die 1,5 s zu
         spaet stand - nur kleiner und ueber mehr Kurven verteilt.

         Gerechnet wird jetzt aus dem tatsaechlich abgedeckten
         Indexbereich: Mitte von [a,b), bei Bloecken plus ein halber
         Index. Das behebt nebenbei die Streckung durch (Punkte-1). */
      var dP='', dA='M0 '+grund+' ';
      var punkte=Math.min(SPUR_W, bisI-vonI);
      var halb=(bloecke===false)?0:0.5;
      for(var p=0;p<punkte;p++){
        var a=vonI+Math.floor(p*(bisI-vonI)/punkte), b=vonI+Math.floor((p+1)*(bisI-vonI)/punkte);
        var s=0,z=0;
        for(var i=a;i<Math.max(a+1,b);i++){ var v=reihe[i]; if(isFinite(v)){s+=v;z++;} }
        if(!z) continue;
        var mitteIdx=(a+Math.max(a+1,b))/2 - 0.5 + halb;
        var px=(mitteIdx/n*SPUR_W).toFixed(1), py=y(s/z).toFixed(1);
        dP+=(dP?'L':'M')+px+' '+py+' ';
        dA+='L'+px+' '+py+' ';
      }
      dA+='L'+SPUR_W+' '+grund+' Z';
      return {linie:dP, flaeche:dA, y:y};
    }

    /* Nur die Sicht verschieben. Läuft je Einzelbild und muss deshalb
       so billig wie möglich sein. */
    var _letzteBahnen=null, _letzteDauer=0, _letzteSicht=-1;

    /* Die Wahlleiste erscheint nur, wenn es eine Kurve zu formen gibt -
       ohne Huellkurve waere sie ein Schalter ohne Wirkung. */
    function kurvenwahlSetzen(bahnen){
      var w=document.getElementById('sa-kurvenwahl');
      if(!w) return;
      var b=bahnen && bahnen.length ? bahnen[0] : null;
      var hat=!!(b && b.welleRoh && b.welleRoh.length);
      w.style.display = hat ? '' : 'none';
      if(!hat){ w.innerHTML=''; return; }
      /* Unterkante der ersten Bahn, minus Knopfhoehe: die Leiste sitzt
         im unteren Rand der Huellkurve, nicht unter dem ganzen Stapel. */
      w.style.top = Math.max(0, bahnHoehe(b) - 20) + 'px';
      if(w._gebaut) return;
      w.innerHTML=kurvenKnoepfe();
      w.addEventListener('click', function(e){
        var k=e.target.closest('#sa-kurvenform button'); if(!k) return;
        _kurvenForm=k.dataset.k;
        [].forEach.call(k.parentElement.children, function(x){ x.classList.toggle('an', x===k); });
        /* Neu formen aus den Rohwerten - kein Rechengang im Kern, nur
           eine andere Abbildung derselben Zahlen. */
        if(_letzteBahnen && _letzteBahnen[0] && _letzteBahnen[0].welleRoh){
          _letzteBahnen[0].welle=kurveFormen(_letzteBahnen[0].welleRoh);
          befundspurZeichnen(_letzteBahnen, _letzteDauer);
        }
      });
      w._gebaut=true;
    }

    /* LEISTUNG IST KEINE WELLENFORM (Caspar_D, 25.08.2026: "die sieht
       feiner aus, die andere hatte ne wurzelfunktion, oder").

       Richtig gesehen. Der Rechenkern legt in energy die mittlere
       QUADRIERTE Amplitude ab - energy[i] = Summe(ch*ch)/Fenster, also
       Leistung. Wer die ungewandelt zeichnet, bekommt eine Kurve, die
       Leises nach unten druckt und nur die Spitzen zeigt: viele duenne
       Nadeln statt einer Huellkurve.

       Die Wurzel macht daraus den Effektivwert - eine Amplitude, und
       genau das zeigt eine Wellenform. Nachgemessen an "De
       Machandelbohm", Werte als Anteil vom Maximum:

         roh (Leistung)   Median 0,178   Viertel 0,049 / 0,307
         mit Wurzel       Median 0,422   Viertel 0,220 / 0,554
         Sunos welle      Median 0,532   Viertel 0,289 / 0,711

       Mit Wurzel liegen wir bei Sunos Verteilung; der kleine Rest
       spricht dafuer, dass Suno je Fenster den Spitzenwert nimmt und
       nicht den Effektivwert - eine Frage des Geschmacks, keine der
       Richtigkeit.
       DREI FORMEN ZUR WAHL (Caspar_D, 25.08.2026: "bei quadrieren kann
       man die spitzen sehr schoen rausarbeiten, beim Wurzeln das Volumen
       und bei x=x die echten Werte"). Genau so stehen sie in den
       Knoepfen - Symbole, keine Woerter, wie bei den Fensterprofilen
       der Signalenergie (Hausbeschluss 18.08.2026: "nur die Form, kein
       Wort"). */
    /* Mathematische Zeichen, nicht Kurvenbildchen (Caspar_D,
       25.08.2026: "mir waeren mathematisch Zeichen lieber - xhoch2; x;
       Wurzelx"). Bei den Fensterprofilen sagt die Form alles, hier sagt
       es die Rechnung kuerzer. Reihenfolge wie angesagt: von der
       spitzesten Abbildung zur vollsten. */
    var KURVE_HOCH={ quadrat:2, echt:1, wurzel:0.5 };
    var KURVE_ZEICHEN={ quadrat:'x²', echt:'x', wurzel:'√x' };
    var KURVE_NAME={ quadrat:'x² — arbeitet die Spitzen heraus',
                     echt:'x — die echten Werte',
                     wurzel:'√x — zeigt das Volumen' };
    var _kurvenForm='wurzel';    /* ueberlebt den Neuaufbau des Markups */

    function kurveFormen(e, form){
      if(!e || !e.length) return null;
      var h=KURVE_HOCH[form||_kurvenForm]; if(!h) h=0.5;
      var a=new Float32Array(e.length);
      if(h===1){ for(var j=0;j<e.length;j++) a[j]=e[j]>0?e[j]:0; return a; }
      if(h===0.5){ for(var k=0;k<e.length;k++){ var w=e[k]; a[k]=w>0?Math.sqrt(w):0; } return a; }
      for(var i=0;i<e.length;i++){ var v=e[i]; a[i]=v>0?v*v:0; }
      return a;
    }

    function kurvenKnoepfe(){
      return '<span class="spur-profil" id="sa-kurvenform">'
        + Object.keys(KURVE_ZEICHEN).map(function(k){
            return '<button data-k="'+k+'" class="'+(k===_kurvenForm?'an':'')+'" title="'+KURVE_NAME[k]+'">'
              + KURVE_ZEICHEN[k] + '</button>';
          }).join('')
        + '</span>';
    }

    /* DIE EIGENE HUELLKURVE NACHTRAGEN.

       Die Befundspur entsteht im norm-Handler; die Energiekurve kommt
       erst mit envelope, also danach. Statt die ganze Bahn zu
       verschieben - sie haengt an einem Dutzend Befunde, die alle bei
       norm feststehen - wird die Kurve nachgereicht und einmal neu
       gezeichnet. Wer hinschaut, sieht die Bahn zuerst ohne und einen
       Wimpernschlag spaeter mit Kurve.

       Nur wenn sie fehlt: Sunos welle behaelt den Vortritt (sie deckt
       die Katalogdauer ab und passt damit zu den Abschnitten). */
    function huellkurveNachtragen(){
      if(!_letzteBahnen || !_letzteBahnen.length) return;
      var b=_letzteBahnen[0];                       /* die Strukturbahn steht vorn (unshift) */
      if(!b || b.welleEigen) return;                /* die eigene liegt schon drin */
      var roh=window._chartData && window._chartData.energy;
      var e=kurveFormen(roh);
      if(!e || !e.length) return;
      b.welle=e; b.welleRoh=roh; b.welleEigen=true;
      b.welleDauer=(window._chartData&&window._chartData.dur)||_letzteDauer;
      befundspurZeichnen(_letzteBahnen, _letzteDauer);
    }
    function spurSichtSetzen(){
      var x=(viewStart*SPUR_W).toFixed(1), w=((viewEnd-viewStart)*SPUR_W).toFixed(1);
      /* Die TAKTBAHN hängt an der Sicht: Sie entscheidet nach dem Platz auf
         dem Schirm, ob Striche oder Quadrate und welche Zählzeiten überhaupt
         gezeigt werden. Alle anderen Spuren brauchen das nicht - sie tragen
         ihren ganzen Verlauf und werden nur beschnitten. Deshalb wird hier
         nur neu gezeichnet, wenn sich die SICHTBREITE geändert hat, nicht
         beim bloßen Verschieben. */
      if(_letzteBahnen){
        var sichtJetzt=+(viewEnd-viewStart).toFixed(4);
        if(sichtJetzt!==_letzteSicht){
          _letzteSicht=sichtJetzt;
          befundspurZeichnen(_letzteBahnen, _letzteDauer);
        }
        /* IMMER zum Schluss ausrichten, auch nach dem Neuzeichnen: Beim
           Zurückzoomen baut befundspurZeichnen die Namen frisch in Prozent
           der GESAMTdauer, und die Ausrichtung darin lief noch mit der alten
           Sicht - die Hälfte der Kürzel behielt dann Werte vom vorherigen
           Stand und blieb unsichtbar (23.08.2026 beim Nachmessen gefunden). */
        namenAusrichten();
      }
      ['momentanspur','kurzspur','abweichungspur','korrspur','stapelspur','befundspur','chromaspur','stereospur','chromataktspur','taktrasterspur','main-waveform','stemdrumsspur','stembassspur','stemotherspur','stemvocalsspur','stemguitarspur','stempianospur'].concat(SPUREN.map(function(s){return s.id+'spur';})).forEach(function(id){
        var svg=document.querySelector('#'+id+'-canvas svg');
        if(!svg) return;
        /* Die Befundspur ist unterschiedlich hoch - so viele Bahnen, wie
           es Befundarten gibt. Sie trägt ihre Höhe deshalb selbst. */
        /* EINE Quelle je Hoehe (Review, 25.08.2026): Wer sein data-h
           mitbringt, wird daran gemessen; die Liste darunter ist nur noch
           der Rueckfall fuer die Zeichner, die es (noch) nicht tun. */
        var hoehe=+svg.dataset.h
                || (id==='befundspur' ? BF_BAHN
                : id==='taktrasterspur' ? 11
                : id==='chromaspur' || id==='chromataktspur' ? 160
                : id==='stereospur' ? 192
                : id==='main-waveform' ? 48
                : id==='abweichungspur' ? 56
                : id==='korrspur' ? 56
                : /^stem/.test(id) ? 44
                : id==='stapelspur' ? 120 : 44);
        svg.setAttribute('viewBox', x+' 0 '+w+' '+hoehe);
      });
    }

    /* ------------------------------------------------------------------
       Eine Lautheitsspur.

       Bis zum 18.08.2026 waren es zwei Kurven in einem Band, gespiegelt.
       Caspar_Ds Einwand: Er hatte die Spiegelung nicht einmal bemerkt - und
       wenn schon spiegeln, dann nach dem **Bevölkerungspyramiden-
       prinzip**: Das Minimum liegt an der Mittelachse, die Maxima gehen
       nach außen, und die Kurven dürfen sich NIE schneiden. Meine hingen
       an den Außenkanten und wuchsen nach innen - genau verkehrt, sie
       konnten sich überlagern und wurden als eine Kurve gelesen.

       Jetzt zwei eigene Spuren, jede über ihren vollen Wertebereich
       gestreckt. Die Streckung wäre für sich genommen irreführend -
       zwei Songs sähen gleich lebendig aus, obwohl der eine über 3 dB
       schwankt und der andere über 30. Deshalb stehen Kleinst- und
       Größtwert IM Titel. Echtes Minimum, nicht das zweite Perzentil:
       Ausreißer abzuschneiden hieße, eine Stille zu verstecken.
       ------------------------------------------------------------------ */
    function lautheitSpurenZeichnen(){
      var d=window._chartData||{}, m=window._normwerte;
      if(!d.momentan||!d.kurz||!m) return;
      var ziel=(ZIELE[(document.getElementById('sa-ziel')||{}).value]||ZIELE.streaming);

      spurMalen('momentanspur','spur-momentan', d.momentan, '#4b93f0',
                'Momentanlautheit', '400 ms', null, m);
      /* Nur hier die Ziellinie: Der Vergleich mit dem Zielpegel ist eine
         Aussage über die empfundene Lautheit, und die trägt das
         Kurzzeitfenster. Der Bereich wird dafür so weit aufgezogen, dass
         die Linie nicht aus dem Bild fällt - sonst verschwände sie
         still, sobald der Song weit vom Ziel weg liegt. */
      spurMalen('kurzspur','spur-kurz', d.kurz, '#f18bbb',
                'Kurzzeitlautheit', '3 s', ziel, m);
      abweichungSpurZeichnen(d, m);
      kaskadeSpurenZeichnen(m);
      linienSpurenZeichnen();
      spurSichtSetzen();
    }

    /* ------------------------------------------------------------------
       Momentanlautheit minus Kurzzeitlautheit.

       Caspar_Ds Vorschlag, und er ist mehr als eine Sichthilfe: Das ist das
       zeitliche Gegenstück zum Schimmer-Verfahren. Dort heißt der Befund
       "Wert minus Umfeld" über die Frequenzachse, hier "dieser
       Augenblick minus seine Umgebung" über die Zeit. Die langsame
       Grundbewegung fällt heraus, die Spitzen bleiben stehen.

       Zu lesen ist sie so:
         hohe positive Spitzen  - Anschläge, die aus dem Umfeld ragen
         dauerhaft nahe null    - platt komprimiert, kein Atem
         tiefe Einbrüche        - Pausen, Lücken, Aussetzer

       Eine Falle steckte darin, und sie ist inzwischen an der Wurzel
       behoben: Die beiden Kurven lagen NICHT auf derselben Zeitachse,
       weil der Bezugspunkt eines Fensters sein Anfang war. Ein
       3-Sekunden-Fenster liegt damit 1,5 s hinter dem, was es beschreibt.

       Ich hatte das zuerst hier ausgeglichen, mit einer Indexverschiebung.
       Das war Flickwerk. Caspar_Ds Einwand traf den Kern: **Der Bezug ist die
       Fenstermitte, nicht die erste Position.** Seit der Rechenkern seine
       Anzeigekurven so bildet, bedeutet Index i in beiden Kurven dieselbe
       Zeit, und hier bleibt eine gewöhnliche Subtraktion übrig.

       Nebenwirkung, die genauso wichtig ist: Auch der Spielkopf steht
       jetzt richtig. Vorher stieg die Kurzzeitkurve anderthalb Sekunden
       nach dem, was man hörte.
       ------------------------------------------------------------------ */
    /* ------------------------------------------------------------------
       Maßstabsreihe als Ridge-Plot.

       Dieselbe Lautheit durch sieben Fensterlängen, gestapelt und
       überlappend - die Bauart, die in der Sequenzanalyse den
       Mehrfenster-Scan zeigt. Kurze Fenster unten (fein), lange oben
       (grob), alle auf DERSELBEN Dezibelskala; sonst lügt der Stapel.

       Gezeichnet wird von hinten nach vorn, damit die feineren Kurven
       die gröberen verdecken - das ist der Sinn der Überlappung.
       ------------------------------------------------------------------ */

    /* ==================================================================
       Sockelkaskade: Paraboloide zunehmender Krümmung.

       Caspar_Ds Verfahren aus der Mikroskopie: Erst eine kaum gekrümmte
       Parabel von unten unter die Kurve schieben - sie kann nur der
       langsamsten Grundbewegung folgen. Was sie berührt, ist der erste
       Sockel; was übrig bleibt, bekommt die nächste, stärker gekrümmte
       Parabel. Und so fort, bis nur noch die Spitzen stehen.

       Gegenüber einem Mittelfenster hat das einen entscheidenden
       Vorteil: Der Mittelwert wird von der Spitze SELBST angehoben, die
       Parabel nicht - sie berührt von unten. Deshalb erscheinen Spitzen
       beim Mittelfenster zu niedrig, mit künstlichen Senken daneben.

       Und gegenüber der Maßstabsreihe: Dort steckt in jeder Zeile alles,
       was in den feineren auch schon steht. Hier ist die Zerlegung
       disjunkt - jede Zeile zeigt nur, was auf IHRER Größenordnung neu
       ist. Die Summe aller Zeilen ergibt exakt das Ausgangssignal;
       nichts geht verloren, nichts wird erfunden. Genau deshalb ist das
       gestapelte Flächendiagramm darunter zulässig.

       Kleinstes Paraboloid 100 ms: Bei vier Schlägen je Sekunde liegen
       250 ms dazwischen, es passt also bequem hinein.
       ================================================================== */
    var KASKADE_MS=[3200,1600,800,400,200,100];

    /* Untere Parabelhülle - min über j von f[j] + a·(i−j)².
       Das Verfahren aus der Distanztransformation: ein Stapel von
       Schnittpunkten, ein Durchgang, O(n). Naiv wäre es Radius × Punkte. */
    function untereHuelle(f, a){
      var n=f.length, v=new Int32Array(n), z=new Float64Array(n+1), aus=new Float32Array(n);
      var k=0; v[0]=0; z[0]=-1e300; z[1]=1e300;
      for(var q=1;q<n;q++){
        var s;
        while(true){
          s=((f[q]+a*q*q)-(f[v[k]]+a*v[k]*v[k]))/(2*a*q-2*a*v[k]);
          if(s<=z[k]&&k>0){ k--; } else break;
        }
        k++; v[k]=q; z[k]=s; z[k+1]=1e300;
      }
      k=0;
      for(var q2=0;q2<n;q2++){
        while(z[k+1]<q2) k++;
        var dq=q2-v[k];
        aus[q2]=a*dq*dq+f[v[k]];
      }
      return aus;
    }

    /* Öffnung: Erosion, dann Dilatation. Die Dilatation ist die Erosion
       des negierten Signals, negiert. */
    function oeffnung(f, a){
      var e=untereHuelle(f, a);
      var neg=new Float32Array(e.length);
      for(var i=0;i<e.length;i++) neg[i]=-e[i];
      var d=untereHuelle(neg, a);
      var aus=new Float32Array(e.length);
      for(var i=0;i<e.length;i++) aus[i]=-d[i];
      return aus;
    }

    /* Boden: So hoch, dass 95 % der Zeitpunkte noch Signal darüber
       haben - also das fünfte Perzentil der Momentanlautheit.

       Grund - die Erosion nimmt das Minimum über die Elementbreite und
       zieht damit jeden schmalen Einbruch über +-r breit. Um jede Pause
       herum lag der Sockel dadurch künstlich tief, und was übrig blieb,
       wurde dort groß: die Schatten der Lücken, keine Ereignisse.
       (Caspar_D: "die Flanken von Einbrüchen werden künstlich hochgezogen,
       echte Spitzen seh ich kaum.")

       Mit Boden wird eine Pause zu einer flachen Ebene statt zu einem
       Loch - die Erosion hat dort nichts mehr zu verschmieren. Dasselbe
       Argument wie beim relativen Tor der Norm bei -10 LU: Was weit
       genug unter dem Ganzen liegt, sagt über die Lautheit nichts mehr.

       In Dezibel ist der Maßstab schief: Eine Pause liegt 25 dB tief,
       ein Anschlag ragt 3 dB heraus. Ohne Boden bestimmen also die
       Löcher das Bild und nicht die Ereignisse.

       WARUM AUS DER VERTEILUNG UND NICHT AUS DER NORM (Caspar_D, 18.08.2026:
       "schieb den boden so hoch, dass 95 % der Zeitpunkte noch Signal
       darüber haben"): Der erste Anlauf nahm die integrierte Lautheit
       minus 20 LU. Gemessen hob der an 0,2 % der Punkte etwas an, war
       also wirkungslos - die Momentanlautheit faellt in diesem Archiv
       gar nicht so tief. Ein fester Abstand unterstellt eine Dynamik,
       die das Material nicht hat; das Perzentil misst sie.

       Anheben allein macht den Sockel uebrigens NICHT klein. Gemessen
       an "Noch lachst Du" faellt sein Anteil an der Spanne von 97 % bei
       -32,8 nur auf 89 % bei -18,7 und auf 78 % selbst beim 25.
       Perzentil. Die grobe Parabel folgt dem getragenen Pegel, und der
       ist ueber jedem Boden fast die ganze Hoehe.

       NEBENWIRKUNG, die eine Verbesserung ist: Die Kruemmung haengt an
       der Spanne (a = Spanne / r²). Die war vorher Maximum minus
       Minimum, also von einem einzigen tiefsten Einbruch bestimmt -
       24,5 LU bei einem Stueck, das sich zwischen -18,7 und -8,3
       abspielt. Jetzt sind es 10,4 LU. Die Parabeln richten sich damit
       nach dem Arbeitsbereich des Stuecks statt nach seinem tiefsten
       Ausreisser. */
    var KASKADE_BODEN_ANTEIL=0.05;

    /* Name der Größenordnung. Benannt wird die SPANNE, die ein Band
       abdeckt, nicht eine einzelne Fensterlänge - denn seit der
       Umstellung auf Differenzen trägt jedes Band genau das, was
       zwischen zwei Krümmungen neu hinzukommt. */
    function kaskadeName(ms){ return ms>=1000 ? (ms/1000).toFixed(1).replace('.',',')+' s' : ms+' ms'; }

    function kaskadeRechnen(reihe, schrittMs){
      var n=reihe.length;
      var roh=new Float32Array(n), lo=Infinity, hi=-Infinity;

      /* Boden aus der Verteilung: sortieren, das Perzentil ablesen. Ein
         Durchgang mehr ueber die Reihe, bei 16.683 Punkten je Song
         nicht der Rede wert. */
      var sortiert=[];
      for(var i=0;i<n;i++){ var w=reihe[i]; if(isFinite(w)&&w>-99) sortiert.push(w); }
      if(!sortiert.length) return null;
      sortiert.sort(function(a,b){ return a-b; });
      var boden=sortiert[Math.floor(KASKADE_BODEN_ANTEIL*(sortiert.length-1))];
      var gehoben=0, gueltig=0;
      for(var i=0;i<n;i++){
        var v=isFinite(reihe[i])?reihe[i]:-100;
        if(v>-99){ gueltig++;
          if(v<boden){ v=boden; gehoben++; }
          if(v<lo)lo=v; if(v>hi)hi=v; }
        roh[i]=v;
      }
      if(!isFinite(lo)) return null;
      var sig=new Float32Array(n);
      for(var i=0;i<n;i++) sig[i]=Math.max(0, roh[i]-lo);   // auf null legen
      var spanne=(hi-lo)||1;

      /* ALLE Parabeln unter das Originalsignal, nicht unter die Reste.

         Vorher bekam jede Stufe den Rest der vorigen - deshalb steckte
         im gröbsten Band fast das ganze Signal, und die feineren gingen
         daneben unter. Jetzt wird jede Krümmung einzeln unter dieselbe
         Kurve gelegt und erst danach werden Nachbarn voneinander
         abgezogen.

         Das geht auf, weil die Öffnungen ineinander geschachtelt sind:
         Eine engere Parabel kommt überall mindestens so hoch wie eine
         flachere, also ist jede Differenz nicht negativ. Und die Summe
         fällt teleskopisch wieder auf das Signal zusammen -

           Signal = Ö(3,2 s) + [Ö(1,6 s) - Ö(3,2 s)] + ... + [Signal - Ö(100 ms)]

         Damit bleibt die Summeneigenschaft erhalten, auf der das
         gestapelte Diagramm darunter beruht, und jedes Band trägt genau
         das, was auf SEINER Größenordnung neu hinzukommt. Erst jetzt
         stimmt auch die Abgrenzung zur Maßstabsreihe darüber, in der
         jede Zeile alles Feinere mitenthält. */
      var oeff=[];
      for(var s=0;s<KASKADE_MS.length;s++){
        var rPunkte=Math.max(2, Math.round(KASKADE_MS[s]/schrittMs));
        /* Krümmung so, dass die Parabel über r Punkte um die volle
           Spanne steigt - damit ist der Parameter maßstabsunabhängig. */
        var a=spanne/(rPunkte*rPunkte);
        oeff.push(oeffnung(sig, a));
      }

      var baender=[], namen=[];
      baender.push(oeff[0]);
      namen.push('über '+kaskadeName(KASKADE_MS[0]));
      for(var s=1;s<oeff.length;s++){
        var band=new Float32Array(n);
        /* Math.max(0, ...) ist nur Rundungsschutz: Rechnerisch kann die
           Differenz nicht negativ werden. */
        for(var i=0;i<n;i++) band[i]=Math.max(0, oeff[s][i]-oeff[s-1][i]);
        baender.push(band);
        namen.push(kaskadeName(KASKADE_MS[s-1])+'–'+kaskadeName(KASKADE_MS[s]));
      }
      var spitzen=new Float32Array(n), letzte=oeff[oeff.length-1];
      for(var i=0;i<n;i++) spitzen[i]=Math.max(0, sig[i]-letzte[i]);
      baender.push(spitzen);
      namen.push('unter '+kaskadeName(KASKADE_MS[KASKADE_MS.length-1]));

      /* Am Rand hat die Parabel keine Daten jenseits der Kurve, also
         stützt sie sich auf nichts - dort entstehen Artefakte, die wie
         Ereignisse aussehen. Ein Radius der GRÖBSTEN Stufe vorn und
         hinten wird deshalb nicht gezeigt.

         Warum der gröbste für alle: Die Bänder werden unten addiert,
         und eine Summe ist nur dort gültig, wo jeder Summand gültig ist.
         Dieselbe Regel wie bei den Fenstern - lieber nichts zeigen als
         etwas erfinden. */
      var randPunkte=Math.max(2, Math.round(KASKADE_MS[0]/schrittMs));
      for(var b=0;b<baender.length;b++)
        for(var i=0;i<n;i++)
          if(i<randPunkte||i>=n-randPunkte) baender[b][i]=NaN;

      return {baender:baender, namen:namen, spanne:spanne, rand:randPunkte,
              boden:boden, gehoben:gehoben, gueltig:gueltig};
    }

    /* Gleitender Mittelwert ueber +-r Punkte, ueber die kumulierte
       Summe - zwei Subtraktionen je Punkt statt r Additionen.

       An den Raendern wird NICHTS erfunden: Wo das volle Fenster nicht
       hineinpasst, steht NaN. Ein abgeschnittenes Fenster misst weniger
       Zeit und liefert einen anderen Ortswert; dieselbe Regel wie bei
       den Lautheitsfenstern. */
    function gleitMittel(f, r){
      var n=f.length, ks=new Float64Array(n+1), gz=new Int32Array(n+1);
      for(var i=0;i<n;i++){
        var v=isFinite(f[i])?f[i]:0, g=isFinite(f[i])?1:0;
        ks[i+1]=ks[i]+v; gz[i+1]=gz[i]+g;
      }
      var aus=new Float32Array(n);
      for(var i2=0;i2<n;i2++){
        var a=i2-r, b=i2+r+1;
        if(a<0||b>n){ aus[i2]=NaN; continue; }
        var z=gz[b]-gz[a];
        aus[i2]= z===(b-a) ? (ks[b]-ks[a])/z : NaN;   // Luecke im Fenster -> kein Wert
      }
      return aus;
    }

    /* Wie weit steht ein Punkt ueber seiner UMGEBUNG - in Streuungen.

       Caspar_D, 18.08.2026: "es ist auch egal, ob sie verschieden hoch
       sind, es geht darum, ob sie von der umgebung verschieden sind."

       Vorher wurde jedes Band auf seinen Groesstwert normiert. Das
       macht Baender vergleichbar, misst aber weiter die HOEHE: Ein
       tragendes Band ist dann ueberall halbhoch, ein leises ueberall
       niedrig, und beide sagen nichts darueber, ob an DIESER Stelle
       etwas passiert.

       Jetzt: Ortswert und Streuung gleitend, und gezeigt wird
       (Wert - Ortswert) / Streuung. Eine kleine Spitze in einem leisen
       Band zaehlt damit genauso wie eine grosse in einem tragenden -
       beide stechen gleich weit aus ihrer Umgebung heraus.

       Das Fenster nimmt jedes Band aus seiner EIGENEN Groessenordnung
       (FAKTOR mal die groebere Grenze des Bandes). Ein festes Fenster
       fuer alle wuerde die Eigenbewegung der langsamen Baender als
       Abweichung zaehlen.

       Die Streuung bekommt einen Boden von 2 % des Bandgroesstwerts:
       In einer stillen Passage ist sie fast null, und ohne Boden waere
       dort jedes Rauschkorn eine Spitze. */
    var UMGEBUNG_FAKTOR=4;
    var UMGEBUNG_SCHWELLE=2;     // darunter wird gar nicht gezeichnet
    var UMGEBUNG_MAX=6;          // Streuungen, ab denen es voll ausschlaegt

    /* WARUM EINE SCHWELLE - dem ersten Horizontband fehlte der Grund.

       Es zeichnete von null aufwaerts, und irgendeine Abweichung hat
       fast jeder Zeitpunkt: Gemessen an "Noch lachst Du" erreichen
       45,9 % der Zeitpunkte eine Streuung, 28,2 % zwei, 14,6 % drei.
       Die unterste Schicht deckte damit den ganzen Streifen - und wo
       alles Figur ist, ist nichts Figur. (Caspar_D: "ueberzeugt mich
       nicht, was soll man da sehen koennen.")

       Mit Schwelle 2 bleiben rund drei Viertel des Streifens leer, und
       die Ausbrueche stehen darin. Der Grund ist damit wieder Grund. */

    function abstandZurUmgebung(band, rPunkte, bandMax){
      var n=band.length;
      var ort=gleitMittel(band, rPunkte);
      var roh=new Float32Array(n);
      for(var i=0;i<n;i++) roh[i]= (isFinite(band[i])&&isFinite(ort[i])) ? Math.abs(band[i]-ort[i]) : NaN;
      var streu=gleitMittel(roh, rPunkte);
      var boden=0.02*(bandMax||1);
      var aus=new Float32Array(n);
      for(var i2=0;i2<n;i2++){
        if(!isFinite(band[i2])||!isFinite(ort[i2])||!isFinite(streu[i2])){ aus[i2]=NaN; continue; }
        var s2=Math.max(streu[i2], boden);
        aus[i2]=Math.max(0, (band[i2]-ort[i2])/s2);
      }
      return aus;
    }

    /* Chroma als SVG-Spur statt als Pixelbild.

       Die Waermekarte war eine Zeichenflaeche in Anzeigebreite: auf
       einem Schirm doppelter Punktdichte weichgezeichnet, beim Zoomen
       neu zu rechnen, und beim Aendern der Fensterbreite unscharf, bis
       jemand neu zeichnet. (Caspar_D: "diese verwaschenen pixelbased
       panels sehen nicht schoen aus.")

       Als Pfad in 0..SPUR_W ist sie scharf in jeder Breite, und der
       Zoom kostet ein Attribut - dieselbe Bauart wie alle Spuren.

       Zwoelf Baender, jedes um seine Mittellinie gespiegelt: Die
       Breite traegt die Intensitaet, die Farbe die Taste. */
    /* Piano-Roll als SVG.

       Die Balken entstehen ohnehin schon als Laeufe - Folgen von
       Rahmen mit demselben Halbton, mit Anfang, Ende und mittlerer
       Stabilitaet. Ein Lauf ist damit ein Rechteck, und Rechtecke sind
       genau das, wofuer ein Pfadformat da ist.

       Gerechnet wird ueber den GANZEN Song, nicht ueber den
       Ausschnitt: Nur dann kann der Zoom ueber die viewBox laufen.

       Die Notennamen liegen als HTML darueber - im gestreckten viewBox
       wuerde Text mitgezogen. Dieselbe Loesung wie bei den Bahnnamen
       der Befundspur. */
    /* Stereopanorama als SVG.

       Acht Baender, je eines fuer einen Frequenzbereich, jedes mit
       einer Mittellinie: nach oben die Ueberzahl des linken Kanals,
       nach unten die des rechten. Der Wert wird also zu Hoehe und
       Richtung - Geometrie, kein Bild.

       Je Band ZWEI Pfade statt eines mit Beschnitt: Das Vorzeichen
       traegt die Farbe, und zwei Pfade sind billiger zu lesen als ein
       Pfad mit zwei Beschnittmasken.

       Die Bandnamen liegen als HTML darueber, wie bei der Piano-Roll.

       Normiert wird je Band auf sein 95. Perzentil: Der Bass ist fast
       immer mono, die Hoehen fast immer breit - mit einem gemeinsamen
       Massstab saehe man nur das. */
    /* Stimmanalyse als SVG.

       Wenige Fenster ueber den Song, je eines mit zwei Werten:
       weiblicher und maennlicher Anteil, gespiegelt um eine Nulllinie.
       Das sind zwei Rechtecke je Fenster - der kleinste der vier
       Faelle, und deshalb der letzte.

       Der Hintergrund traegt die Formantaktivitaet: hell heisst
       Gesang erkannt, dunkel keiner. Sie liegt als eigenes Rechteck je
       Fenster darunter, damit man sieht, WORAUF sich das Urteil
       stuetzt - ein Ausschlag ohne Formanten ist keiner. */

    function stereoSpurZeichnen(lBands, rBands, dur){
      var host=document.getElementById('stereospur-canvas');
      var namen=document.getElementById('sa-stereo-namen');
      if(!host||!lBands||!lBands.length) return;
      if(!sichtbar('stereospur-canvas')) return;

      var baender=lBands.length, n=lBands[0].length, H=192;
      var bandH=H/baender, maxH=bandH*0.44;
      var BANDNAMEN=['20-60','60-150','150-400','400-1k','1-2,5k','2,5-6k','6-12k','12-20k'];

      var punkte=Math.min(SPUR_W, n);
      var teile=['<svg viewBox="'+(viewStart*SPUR_W).toFixed(1)+' 0 '
        +((viewEnd-viewStart)*SPUR_W).toFixed(1)+' '+H+'" preserveAspectRatio="none" data-h="'+H+'">'];
      var marken=[];

      for(var b=0;b<baender;b++){
        var zeile=baender-1-b;                 // tiefstes Band unten
        var oben=zeile*bandH, mitte=oben+bandH/2;
        if(zeile%2===0)
          teile.push('<rect x="0" y="'+oben.toFixed(1)+'" width="'+SPUR_W+'" height="'
            +bandH.toFixed(1)+'" fill="#ffffff" opacity="0.018"/>');
        teile.push('<line x1="0" y1="'+mitte.toFixed(1)+'" x2="'+SPUR_W+'" y2="'+mitte.toFixed(1)
          +'" stroke="#ffffff" stroke-width="1" opacity="0.12" vector-effect="non-scaling-stroke"/>');
        marken.push({y:mitte, text:BANDNAMEN[b]||('Band '+(b+1))});

        /* Bezug: 95. Perzentil der Seitigkeit dieses Bandes. */
        var werte=[];
        for(var i=0;i<n;i++){ var l=lBands[b][i], r=rBands[b][i], su=l+r;
          if(su>0) werte.push(Math.abs(l-r)/su); }
        werte.sort(function(x,y){return x-y;});
        var p95=werte.length? (werte[Math.floor(werte.length*0.95)]||0.01) : 0.01;
        if(p95<0.01) p95=0.01;

        var dL='', dR='';
        for(var p=0;p<punkte;p++){
          var von=Math.floor(p*n/punkte), bis=Math.max(von+1,Math.floor((p+1)*n/punkte));
          var sl=0, sr=0, z=0;
          for(var q=von;q<bis&&q<n;q++){ sl+=lBands[b][q]; sr+=rBands[b][q]; z++; }
          if(!z) continue;
          var ges=sl+sr;
          var x=ges>1e-9 ? (sl-sr)/ges : 0;
          var h=Math.min(1,Math.abs(x)/p95)*maxH;
          var px=((p+0.5)/punkte*SPUR_W).toFixed(1);
          if(x>=0){ dL+='M'+px+' '+mitte.toFixed(1)+'L'+px+' '+(mitte-h).toFixed(1)+' '; }
          else    { dR+='M'+px+' '+mitte.toFixed(1)+'L'+px+' '+(mitte+h).toFixed(1)+' '; }
        }
        if(dL) teile.push('<path d="'+dL+'" stroke="#f97b14" stroke-width="1" opacity="0.75" vector-effect="non-scaling-stroke"/>');
        if(dR) teile.push('<path d="'+dR+'" stroke="#4b93f0" stroke-width="1" opacity="0.75" vector-effect="non-scaling-stroke"/>');
      }
      teile.push('</svg>');
      host.innerHTML=teile.join('');

      if(namen) namen.innerHTML=marken.map(function(m){
        return '<span style="top:'+((m.y-bandH/2+3)/H*100).toFixed(2)+'%">'+m.text+'</span>'; }).join('');

      var titel=document.querySelector('#spur-stereo .spur-titel');
      if(titel) titel.innerHTML='<span class="nam" style="color:#f97b14">Stereopanorama</span> — '
        +'<span style="color:#f97b14">▲ links</span> · <span style="color:#4b93f0">▼ rechts</span> · '
        +'<span style="opacity:.82">unten Bass, oben Höhen · je Band auf sein 95. Perzentil normiert</span>';
    }


    /* ==================================================================
       CHROMA JE NOTENZONE statt je Rechenfenster — DIE BEGRUENDUNG.

       Der Code dazu stand bis zum 25.08.2026 hier: 275 Zeilen
       chromaTaktZeichnen mit eigenem Goertzel, dazu ein Lader fuer den
       Bass-Stem. Er war seit dem 25.08. abgeklemmt und ist jetzt weg
       (Caspar_D: "wir legen nichts mehr tot ohne den Code
       mitzuloeschen, das macht nur Probleme"). Gerechnet wird in
       bin/toene.js, gezeigt wird das Ergebnis in chromaZonenZeichnen.

       WARUM es diese zweite Messung ueberhaupt gibt: Das Bild aus dem
       ganzen Signal zeichnet eine Spalte je FFT-Fenster - bei sechs
       Minuten rund 3500. Weil jede Note ueber viele Fenster laeuft UND
       die Uebergaenge mit hineingeraten, verschmiert alles (Caspar_D,
       24.08.2026: "sonst ist das ein einziger Matsch").

       Statt dessen gibt Sunos Takt die Fenster vor. Gemessen wird
       ZWISCHEN den Schlaegen, nicht auf ihnen: Der Anschlag ist
       transient und traegt keinen stabilen Toninhalt.

       ADAPTIV, weil Noten nicht nur auf Vierteln wechseln: Erst das
       ganze Viertel, dann halbiert, dann geviertelt. Die feinere
       Teilung wird nur genommen, wenn sich der Toninhalt zwischen den
       Teilen wirklich unterscheidet - gemessen als Winkel zwischen den
       beiden Zwoelfervektoren. Bleibt er gleich, war es eine Note, und
       dann ist das lange Fenster das genauere.

       Der Bass-Stem gab dabei die Zonengrenzen vor: Akkordwechsel
       traegt der Bass, nicht die Melodie. bin/toene.js haelt es genauso
       (alle 321 Songs tragen raster:"bass").
       ================================================================== */


    /* Erst alles holen, dann zeichnen. Beide Quellen sind traege - die
       Abtastwerte muessen dekodiert werden, der Bass-Stem geladen -, und
       ohne sie faellt die Messung stillschweigend auf das alte Verfahren
       zurueck. Wer das nicht abwartet, misst schlechter als noetig und
       merkt es nur am Kleingedruckten. */
    var _chromaTaktLauf=0;
    /* VORGERECHNET, WENN ES DAS GIBT (Caspar_D, 24.08.2026: "jetzt müssen
       wir wieder alles vorrechnen, weil sonst es zu lange dauert").
       bin/toene.js legt die Zonen je Song ab; dann sind es 65 KB laden
       statt 260 Millionen Operationen im Hauptthread. Fehlen sie - etwa
       weil die Stems noch nicht durch sind -, rechnet der Browser weiter
       selbst, nur eben langsam. */
    async function chromaZonenHolen(id){
      if(!id) return null;
      try{
        var a=await fetch('/api/notenzonen/'+id, {cache:'no-store'});
        if(!a.ok) return null;
        var j=await a.json();
        return (j && j.zonen && j.zonen.length) ? j : null;
      }catch(e){ return null; }
    }

    /* DIE ZWEI LASCHEN (Caspar_D, 25.08.2026). Beide Bilder zeigen
       dieselben zwoelf Tonklassen; oben liegt die Messung zwischen den
       Schlaegen, dahinter die ueber das ganze Signal.

       Zwei Dinge muessen beim Umschalten stimmen:

       1. GEZEICHNET WIRD ERST BEIM AUFSCHLAGEN. sichtbar() prueft
          offsetParent, und der ist bei display:none null - eine
          verborgene Lasche zeichnet nicht. Also holt der Wechsel das
          Zeichnen nach. Die Daten liegen dafuer bereit: die Zonen in
          _letzteZonen, das Chroma in window._chartData.

       2. DER LESEKOPF (Caspar_D: "wichtig ist, dass der Lesekopf
          richtig arbeitet"). updatePlayheads setzt ihn auf
          pct*offsetWidth - und offsetWidth ist null, solange die Lasche
          verborgen ist. Die RAF-Schleife zoege das binnen eines Bildes
          nach, aber ein sichtbarer Sprung von links waere trotzdem da.
          Deshalb wird er hier sofort gesetzt, mit derselben Rechnung
          wie in der Schleife. */
    var _letzteZonen=null, _lascheOffen='takt', _lascheGezeichnet={takt:false, alles:false};

    /* EIN Name fuer beide Bilder (Caspar_D, 25.08.2026: "die Ueberschrift
       ist Chroma, einmal ohne und einmal mit Beruecksichtigung der
       Zwischen-Schlag-Bereiche"); sie heissen "Signal zwischen
       Taktschlaegen" und "Gesamtes Signal". Die Laschen sagen, welche Fassung
       offen ist; der Titel traegt nur noch die Erklaerung dazu. Beide
       Zeichenfunktionen legen ihre hier ab, statt selbst in den Titel zu
       schreiben - das Titelfeld liegt jetzt ueber den Laschen und gehoert
       keiner der beiden allein. */
    var _notenErkl={takt:'', alles:''};
    function notenTitelSetzen(){
      var titel=document.querySelector('#spur-noten .spur-titel');
      if(!titel) return;
      titel.innerHTML='<span class="nam" style="color:'+TASTE_HELL+'">Chroma</span> — '
        + (_notenErkl[_lascheOffen]||'');
    }

    function notenKopfSetzen(){
      if(!songDuration) return;
      var pos=ZEIT()/songDuration;
      var pct=viewEnd>viewStart?(pos-viewStart)/(viewEnd-viewStart):pos;
      pct=Math.max(0,Math.min(1,pct));
      ['chromataktspur','chromaspur'].forEach(function(id){
        var ph=document.getElementById('ph-'+id), c=document.getElementById(id+'-canvas');
        if(ph&&c&&c.offsetWidth) ph.style.left=Math.round(pct*c.offsetWidth)+'px';
      });
    }

    function notenLascheWaehlen(welche){
      _lascheOffen=welche;
      var takt=document.getElementById('spur-chroma-takt');
      var alles=document.getElementById('spur-chroma');
      if(takt)  takt.style.display  = welche==='takt'  ? '' : 'none';
      if(alles) alles.style.display = welche==='alles' ? '' : 'none';
      var reg=document.getElementById('noten-register');
      if(reg) Array.prototype.forEach.call(reg.querySelectorAll('button'), function(b){
        b.classList.toggle('an', b.getAttribute('data-lasche')===welche); });
      /* Nachzeichnen, falls diese Lasche noch nie offen war. */
      var d=window._chartData&&window._chartData.fft;
      if(welche==='takt' && !_lascheGezeichnet.takt && _letzteZonen && d){
        chromaZonenZeichnen(_letzteZonen, d.dur); _lascheGezeichnet.takt=true;
      }
      if(welche==='alles' && !_lascheGezeichnet.alles && d && d.chroma){
        chromaSpurZeichnen(d.chroma, d.dur); _lascheGezeichnet.alles=true;
      }
      notenTitelSetzen();
      notenKopfSetzen();
    }

    document.addEventListener('click', function(e){
      var b=e.target.closest && e.target.closest('#noten-register button');
      if(b) notenLascheWaehlen(b.getAttribute('data-lasche'));
    });

    /* DIE LASCHEN DER SPEKTROGRAMME (Caspar_D, 25.08.2026). Anders als
       beim Chroma wird hier beim Umschalten NICHT nachgezeichnet: Beide
       Bilder stehen schon, weil beide Canvas beim Empfang ihre volle
       Breite haben (siehe der Kommentar am Abschnitt). Es wechselt nur,
       welches man sieht - und damit auch der Lesekopf, denn der laeuft
       ohnehin fuer beide weiter.

       Die Laschen tragen Caspar_Ds Schreibweise: FFT(L) fuer das linke
       Bild - es ist wirklich nur der linke Kanal, "mono" im alten
       Kommentar war falsch (Befund 34) - und die Formel fuer die
       Seitenlage, die keine Differenz ist, sondern ein Anteil: Sie sagt,
       WIE WEIT links oder rechts ein Frequenzfach sitzt, unabhaengig
       davon, wie laut es ist. */
    /* Die vier Laschen und was hinter jeder steckt: das Bildfeld, der
       Erklaertext, der Puffer aus der Ablage und der Canvas. */
    var SPEKTRO_LASCHEN=[
      {schl:'l',     feld:'spektro-feld-l',     text:'spektro-text-l',     puffer:'spectro',       canvas:'spectro-canvas'},
      {schl:'r',     feld:'spektro-feld-r',     text:'spektro-text-r',     puffer:'rechtsspectro', canvas:'rechtsspectro-canvas'},
      {schl:'summe', feld:'spektro-feld-summe', text:'spektro-text-summe', puffer:'summespectro',  canvas:'summespectro-canvas'},
      {schl:'pan',   feld:'spektro-feld-pan',   text:'spektro-text-pan',   puffer:'stereospectro', canvas:'stereospectro-canvas'}
    ];
    var _spektroOffen='l';

    /* Ein Kanalbild aus seinem Puffer zeichnen. Dieselbe Rechnung wie im
       ohneRoh-Zweig von _drawSpectrogramFromFrames, nur fuer die beiden
       Bilder, die es nur als Ablage gibt: Der Browser rechnet sie nicht
       selbst, sie entstehen in bin/vorrechnen.js. */
    function kanalBildZeigen(l){
      var p=(window._pufferFlaechen||{})[l.puffer];
      var c=document.getElementById(l.canvas);
      if(!p||!c||!c.offsetWidth) return false;
      c.width=c.offsetWidth; c.height=c.offsetHeight||180;
      var ctx=c.getContext('2d');
      pufferZeigen(ctx, p, viewStart, viewEnd, c.width, c.height);
      var sr2=(window._chartData&&window._chartData.fft&&window._chartData.fft.sr)||currentSR||48000;
      spektroAchsenZeichnen(ctx,c.width,c.height,sr2,Math.log10(20),Math.log10(sr2/2));
      var d=(window._chartData&&window._chartData.fft)||{};
      if(d.dur) drawTimeAxis(ctx,c.width,c.height,d.dur);
      return true;
    }

    /* Welche Laschen ueberhaupt zu sehen sind: die beiden alten immer,
       die beiden neuen nur, wenn ihr Bild vorliegt. */
    function spektroLaschenPruefen(){
      var reg=document.getElementById('spektro-register');
      if(!reg) return;
      var pf=window._pufferFlaechen||{};
      var weg=false;
      SPEKTRO_LASCHEN.forEach(function(l){
        var da = (l.schl==='l'||l.schl==='pan') ? true : !!pf[l.puffer];
        var b=reg.querySelector('[data-spektro="'+l.schl+'"]');
        if(b) b.style.display = da ? '' : 'none';
        if(!da && _spektroOffen===l.schl) weg=true;
      });
      if(weg) spektroLascheWaehlen('l');
    }

    function spektroLascheWaehlen(welche){
      _spektroOffen=welche;
      SPEKTRO_LASCHEN.forEach(function(l){
        var f=document.getElementById(l.feld), x=document.getElementById(l.text);
        if(f) f.style.visibility = (l.schl===welche?'visible':'hidden');
        if(x) x.style.display    = (l.schl===welche?'':'none');
      });
      var reg=document.getElementById('spektro-register');
      if(reg) Array.prototype.forEach.call(reg.querySelectorAll('button'), function(b){
        b.classList.toggle('an', b.getAttribute('data-spektro')===welche); });
      /* Die zwei Ablagebilder zeichnen erst beim Aufschlagen - anders als
         die beiden alten, die beim Empfang der Rohdaten entstehen. */
      var l=SPEKTRO_LASCHEN.find(function(z){ return z.schl===welche; });
      if(l && (welche==='r'||welche==='summe')) kanalBildZeigen(l);
      spektroTitelSetzen();
    }
    document.addEventListener('click', function(e){
      var b=e.target.closest && e.target.closest('#spektro-register button');
      if(b) spektroLascheWaehlen(b.getAttribute('data-spektro'));
    });

    async function chromaTaktBereitZeichnen(chromaFlat, dur, schlaege, tonUrl, id){
      var lauf=++_chromaTaktLauf;
      /* Neuer Song: beide Laschen gelten als ungezeichnet, sonst zeigt
         die zugeklappte noch das Bild des vorigen Stuecks. Die offene
         Lasche bleibt, wie der Benutzer sie gelassen hat. */
      _letzteZonen=null; _lascheGezeichnet.takt=false; _lascheGezeichnet.alles=false;
      /* Erst nachsehen, ob es fertig vorliegt. */
      var fertig=await chromaZonenHolen(id);
      if(lauf!==_chromaTaktLauf) return;
      if(fertig){ chromaZonenZeichnen(fertig, dur); return; }
      /* OHNE ZONEN NICHT ANZEIGEN (Caspar_D, 25.08.2026: "wenn die
         Spuren noch nicht gerechnet sind, das Panel und alle
         abhaengigen nicht anzeigen"). Bis dahin lief hier eine
         Selbstrechnung als Ersatz: die volle WAV nachladen, den
         Bass-Stem holen, Goertzel je Schlag - sekundenlang auf dem
         Hauptfaden, und heraus kam die schlechtere Messung ohne
         Stem-Raster. Jetzt ist das Bild schlicht nicht da, bis
         bin/toene.js den Song vermessen hat - wie beim
         Einzelspuren-Panel. Die Selbstrechnung stand danach noch einen
         Tag lang abgeklemmt da und ist am 25.08.2026 geloescht worden
         (Caspar_D: "wir legen nichts mehr tot ohne den Code
         mitzuloeschen"). */
      var rahmen=document.getElementById('spur-chroma-takt');
      if(rahmen) rahmen.style.display='none';
    }

    /* Zeichnen aus den vorgerechneten Zonen. Dieselbe Form wie die
       Selbstrechnung darunter - nur dass hier nichts mehr gemessen wird. */
    function chromaZonenZeichnen(nz, dur){
      var host=document.getElementById('chromataktspur-canvas');
      var rahmen=document.getElementById('spur-chroma-takt');
      if(!host||!rahmen||!dur) return;
      /* Merken, damit die Lasche beim Aufschlagen nachzeichnen kann,
         ohne die Zonen noch einmal vom Server zu holen. */
      _letzteZonen=nz; _lascheGezeichnet.takt=true;
      rahmen.style.display = _lascheOffen==='takt' ? '' : 'none';
      var H=160, zeilenH=H/12;
      var t=['<svg viewBox="'+(viewStart*SPUR_W).toFixed(1)+' 0 '
        +((viewEnd-viewStart)*SPUR_W).toFixed(1)+' '+H+'" preserveAspectRatio="none" data-h="'+H+'">'];
      for(var w=0;w<12;w++){
        if(!WEISSE_TASTE[w]) continue;
        t.push('<rect x="0" y="'+(H-(w+1)*zeilenH).toFixed(1)+'" width="'+SPUR_W
          +'" height="'+zeilenH.toFixed(1)+'" fill="#ffffff" opacity="0.035"/>');
      }
      var rt=['<svg viewBox="'+(viewStart*SPUR_W).toFixed(1)+' 0 '
        +((viewEnd-viewStart)*SPUR_W).toFixed(1)+' 11" preserveAspectRatio="none" data-h="11">'];
      var TEIL_FARBE={1:'#4b93f0',2:'#45e989',4:'#f9531c'};
      for(var i=0;i<nz.zonen.length;i++){
        var z=nz.zonen[i];
        var xa=(z[0]/1000/dur*SPUR_W), xb=(z[1]/1000/dur*SPUR_W);
        if(xb<=xa) continue;
        for(var n=0;n<12;n++){
          var v=z[3+n]/255;
          if(v<0.06) continue;
          var cy=H-(n+0.5)*zeilenH, hw=v*zeilenH*0.85*0.5;
          var farbe=WEISSE_TASTE[n]?TASTE_HELL:TASTE_DUNKEL;
          t.push('<rect x="'+xa.toFixed(1)+'" y="'+(cy-hw).toFixed(2)+'" width="'+(xb-xa).toFixed(1)
            +'" height="'+(hw*2).toFixed(2)+'" fill="'+farbe+'" opacity="0.45"/>');
          t.push(spurTopline(farbe, (cy-hw).toFixed(2), (xb-xa).toFixed(1), xa.toFixed(1), 0.85));
        }
        rt.push('<rect x="'+xa.toFixed(1)+'" y="2" width="'+(xb-xa).toFixed(1)
          +'" height="7" fill="'+TEIL_FARBE[z[2]]+'" opacity="0.55"/>');
        rt.push(spurTopline(TEIL_FARBE[z[2]], 2, (xb-xa).toFixed(1), xa.toFixed(1), 0.9));
      }
      t.push('</svg>'); rt.push('</svg>');
      host.innerHTML=t.join('');
      var rhost=document.getElementById('taktrasterspur-canvas');
      if(rhost) rhost.innerHTML=rt.join('');

      var zs=nz.schlaege||{}, su=(zs[1]||0)+(zs[2]||0)+(zs[4]||0)||1;
      /* Der Wortlaut ist Caspar_Ds, Glied fuer Glied (24.08.2026):
         womit gemessen wurde, woher das Raster kommt, wie sich die
         Schlaege teilen. Der NAME hiess bis zum 25.08.2026
         "Tonverteilung je Notenzone" und ist seither "Chroma" fuer
         beide Laschen - welche Fassung man sieht, sagt die Lasche.
         "Taktschlaege", nicht "Takte": gezaehlt wird, was wirklich
         gemessen wurde - ein 4/4-Takt hat vier Schlaege, die einzeln
         geteilt sein koennen (bei "Okkultation" 570 Schlaege in rund
         142 Takten). Zonenzahl und Herkunftsangabe bleiben draussen,
         der Titel soll ein Satz bleiben (beides Caspar_Ds Entscheidung). */
      _notenErkl.takt=
          '<span class="erkl">bei den Halbtonfrequenzen gemessen · Raster '
        + (nz.raster==='bass' ? 'aus dem Bass' : 'aus dem Mix') + ' · '
        + '<span style="color:#4b93f0">Taktschläge mit Vierteln ' + Math.round(100*(zs[1]||0)/su) + ' %</span> · '
        + '<span style="color:#45e989">mit Achteln ' + Math.round(100*(zs[2]||0)/su) + ' %</span> · '
        + '<span style="color:#f9531c">mit Sechzehnteln ' + Math.round(100*(zs[4]||0)/su) + ' %</span></span>';
      notenTitelSetzen();
    }


    function chromaSpurZeichnen(chromaFlat, dur){
      var host=document.getElementById('chromaspur-canvas');
      var rahmen=document.getElementById('spur-chroma');
      if(!host||!chromaFlat||!chromaFlat.length) return;
      if(!sichtbar('chromaspur-canvas')){ return; }

      var rahmenAnz=chromaFlat.length/12;
      var H=160, zeilenH=H/12, maxBreite=zeilenH*0.85;

      /* Bezug ist das 95. Perzentil ueber ALLE Toene und Zeitpunkte -
         ein einzelner Ausreisser soll nicht alles kleinrechnen. Einmal
         je Datenstand gerechnet, nicht je FFT-Runde: die Endrunde hat
         ~675.000 Werte, und die Kopie samt Sort lief vorher fuenfmal
         (Review, 25.08.2026). */
      if(!window._chromaP95||window._chromaP95.stand!==chromaFlat.length){
        var alle=[];
        for(var i=0;i<chromaFlat.length;i++) if(isFinite(chromaFlat[i])) alle.push(chromaFlat[i]);
        alle.sort(function(a,b){return a-b;});
        window._chromaP95={stand:chromaFlat.length, wert:alle[Math.floor(alle.length*0.95)]||1};
      }
      var p95=window._chromaP95.wert;

      var punkte=Math.min(SPUR_W, Math.max(2, Math.round(rahmenAnz)));
      var teile=['<svg viewBox="'+(viewStart*SPUR_W).toFixed(1)+' 0 '
        +((viewEnd-viewStart)*SPUR_W).toFixed(1)+' '+H+'" preserveAspectRatio="none" data-h="'+H+'">'];

      /* Untergrund wie eine Klaviatur, sehr zurueckhaltend. */
      for(var t=0;t<12;t++){
        if(!WEISSE_TASTE[t]) continue;
        teile.push('<rect x="0" y="'+(H-(t+1)*zeilenH).toFixed(1)+'" width="'+SPUR_W
          +'" height="'+zeilenH.toFixed(1)+'" fill="#ffffff" opacity="0.035"/>');
      }

      for(var n=0;n<12;n++){
        var cy=H-(n+0.5)*zeilenH, oben='', unten='';
        for(var p=0;p<punkte;p++){
          var a=Math.floor(p*rahmenAnz/punkte), b=Math.max(a+1,Math.floor((p+1)*rahmenAnz/punkte));
          var su=0,z=0;
          for(var f=a;f<b&&f<rahmenAnz;f++){ var v=chromaFlat[f*12+n]; if(isFinite(v)){ su+=v; z++; } }
          var w=z? Math.pow(Math.min(1,(su/z)/p95),0.5) : 0;
          var hw=w*maxBreite*0.5;
          var px=((p+0.5)/punkte*SPUR_W).toFixed(1);
          oben+=(p?'L':'M')+px+' '+(cy-hw).toFixed(2)+' ';
          unten='L'+px+' '+(cy+hw).toFixed(2)+' '+unten;
        }
        /* FLAECHE ZURUECKGENOMMEN, TOPLINE OBEN. Die Flaeche lag hier in
           voller Tastenfarbe, ohne jede Kontur; damit gibt es nichts, was
           den Verlauf als Linie lesbar macht.

           NUR OBEN, anders als bei der Wellenform (Caspar_D, 23.08.2026:
           "ich wollte aber nur ein topline und nicht auf beiden seiten").
           Die Wellenform steht allein und darf sich einfassen; hier
           liegen zwoelf Zeilen dicht uebereinander, und eine Kontur
           ringsum verdoppelt jede Linie, bis die Zeilen ineinander
           laufen. Die obere Kante allein gibt jeder Zeile ihren Rand. */
        var farbe=WEISSE_TASTE[n]?TASTE_HELL:TASTE_DUNKEL;
        teile.push('<path d="'+oben+unten+'Z" fill="'+farbe+'" opacity="0.45"/>'
          +'<path d="'+oben+'" fill="none" stroke="'+farbe+'" stroke-width="'+SPUR_KONTUR+'"'
          +' opacity="0.85" vector-effect="non-scaling-stroke"/>');
      }
      teile.push('</svg>');
      host.innerHTML=teile.join('');

      _lascheGezeichnet.alles=true;
      _notenErkl.alles='<span class="erkl">über das ganze Signal gemittelt · '
        +'<span style="opacity:.88">Oktaven addiert, Breite = Intensität</span> · '
        +'<span style="opacity:.82">Tastenfarben: <span style="color:'+TASTE_HELL+'">weiß</span> '
        +'und <span style="color:'+lesbar(TASTE_DUNKEL, 6.6)  /* Reserve fuer die 0,82 Deckkraft des umgebenden Spans */+'">schwarz</span> wie auf der Klaviatur</span></span>';
      notenTitelSetzen();
    }

    function kaskadeSpurenZeichnen(m){
      var d=window._chartData||{};
      var reihe=d.momentan;
      var kS=document.getElementById('spur-stapel');
      if(!reihe||!reihe.length){ if(kS)kS.style.display='none'; return; }
      if(kS)kS.style.display='';

      /* Getrennt abgeklemmt, nicht pauschal.

         Die Sockelkaskade ist ausgeblendet (Caspar_D, 18.08.2026: "hat uns
         nicht weitergebracht"), das gestapelte Diagramm darunter nicht.
         Beide entstehen hier - aber aus ZWEI Zerlegungen: die Kaskade
         aus der Dezibelkurve, der Stapel aus der Energie. Wird nur eine
         gebraucht, wird auch nur eine gerechnet; jede kostet sechs
         Oeffnungen ueber 16.000 Punkte. */
      var zeigeStapel =sichtbar('stapelspur-canvas');
      if(!zeigeStapel) return;

      /* Wie _chartData und _normwerte: nachrechenbar von aussen. Die
         Zerlegung ist der Teil, den man dem Bild am wenigsten ansieht -
         ob ein Band traegt oder leer ist, will man messen koennen. */


      if(!zeigeStapel) return;

      /* ---- Gestapelte Flächen: IN ENERGIE, nicht in Dezibel ----------

         Loudness ist logarithmisch. LUFS ist der Logarithmus eines
         Leistungsverhaeltnisses, und eine Summe von Logarithmen ist der
         Logarithmus eines PRODUKTS. Wer Dezibelwerte stapelt und daraus
         Prozentanteile rechnet, nennt "20 % der Summe" den Anteil an
         gar nichts. (Caspar_D, 18.08.2026: "ist loudness logarithmisch und
         stapeln wir hier sachen, die wir gar nicht stapeln duerfen?" -
         ja und ja.)

         Deshalb laeuft die Kaskade fuer diesen Streifen ein ZWEITES Mal,
         auf 10^(LUFS/10). Dort ist eine Summe eine Summe, und die
         Anteile sind echte Energieanteile.

         Dieselbe Trennung wie bei den Farben, wo OKLab L zum Auswaehlen
         dient und die relative Luminanz fuer den Kontrast: zwei Masse
         fuer zwei Aufgaben.

           Horizontband  Dezibel   - eine Differenz ist ein Verhaeltnis,
                                     und das Ohr hoert logarithmisch
           Dieser Streifen Energie - nur dort darf addiert werden

         Erwartbare Folge: In Energie dominieren die lauten Stellen viel
         staerker, weil zehn Dezibel das Zehnfache sind. Das Bild wird
         also ungleichmaessiger als die Dezibelfassung - aber es stimmt. */
      var energie=new Float32Array(reihe.length);
      for(var i=0;i<reihe.length;i++)
        energie[i]= (isFinite(reihe[i])&&reihe[i]>-99) ? Math.pow(10, reihe[i]/10) : NaN;
      var ergE=kaskadeRechnen(energie, 20);
      if(!ergE) return;
      window._kaskadeEnergie=ergE;
      /* Namen und Bandzahl aus DIESER Zerlegung - die der Kaskade gibt
         es nicht mehr, wenn sie abgeklemmt ist. */
      var BE=ergE.baender, N=ergE.namen, zeilen=BE.length;

      var H2=120, pad2=4;
      var n2=BE[0].length, punkte=Math.min(SPUR_W,n2);
      /* Helligkeitsreihe statt Farbtonreihe: je socklicher, desto dunkler
         (Caspar_D, 18.08.2026).

         Das ist auch der richtige Kanal. Die Bandgroesse ist eine
         GEORDNETE Groesse - grob, weniger grob, fein -, und geordnete
         Groessen gehoeren auf Helligkeit, nicht auf Farbton. Die alte
         Reihe lief von Blau ueber Violett nach Orange und behauptete
         damit Unterschiede in der Art, wo es Unterschiede im Grad gibt;
         welches der beiden Violett das groebere war, konnte man ihr
         nicht ansehen.

         Gebaut aus der Suno-Palette, sieben Stufen, dunkel unten:
         Blau, Gruen, Gelb, monoton heller werdend. Sie erfuellt damit
         "je socklicher, desto dunkler" und wechselt zusaetzlich den
         Farbton, sodass benachbarte Baender unterscheidbar bleiben -
         eine reine Helligkeitsreihe in einem Ton kann das nicht.

         Vorher stand hier Viridis. Es tat dasselbe, gehoerte aber
         nicht zur Palette; und eine automatische Angleichung nach
         Farbton macht aus einer geordneten Rampe ein Durcheinander,
         weil sie jede Stuetzstelle einzeln auf den naechsten
         Palettenton wirft. Geordnete Reihen muessen von Hand geordnet
         bleiben. */
      var summe=new Float64Array(punkte),
          farben=['#0b2d59','#134a94','#1164cf','#12a04d','#45e989','#d8d81c','#f4f4a8'];
      var t2=['<svg viewBox="0 0 '+SPUR_W+' '+H2+'" preserveAspectRatio="none">'];
      var gesamtMax=0;
      var werte=[];
      for(var k=0;k<zeilen;k++){
        var w2=new Float64Array(punkte);
        for(var p=0;p<punkte;p++){
          var a2=Math.floor(p*n2/punkte), b2=Math.max(a2+1,Math.floor((p+1)*n2/punkte));
          var s=0,z2=0; for(var q=a2;q<b2&&q<n2;q++) if(isFinite(BE[k][q])){ s+=BE[k][q]; z2++; }
          w2[p]=z2?s/z2:NaN;
        }
        werte.push(w2);
      }
      for(var p=0;p<punkte;p++){ var s=0,ok=true;
        for(var k=0;k<zeilen;k++){ if(!isFinite(werte[k][p])) ok=false; else s+=werte[k][p]; }
        if(ok&&s>gesamtMax) gesamtMax=s; }
      if(gesamtMax<=0) gesamtMax=1;
      /* ---- Stapeln: grobe Wellenlängen als Sockel ---------------------

         Zwei Fehler steckten hier drin:

         Erstens war die Reihenfolge verkehrt - die feinen Bänder lagen
         unten. Die Basis muss das gröbste Band sein, denn darauf sitzt
         alles andere; die Spitzen gehören obenauf.

         Zweitens deckte jeder Pfad den vorigen zu. Ein gestapeltes
         Flächendiagramm wird von OBEN nach unten gezeichnet: erst die
         volle Summe in der Farbe des obersten Bandes, dann die um ein
         Band kleinere Summe darüber, und so fort. Was zwischen zwei
         Summen stehen bleibt, ist das jeweilige Band. Andersherum sieht
         man nur die zuletzt gezeichnete Farbe - genau das war zu sehen. */
      /* JE ZEITPUNKT AUF 100 % NORMIERT.

         Vorher stand hier die absolute Hoehe, und das Sockelband nahm
         gemessen 89 % der Flaeche ein - die feineren Baender waren ein
         Saum am oberen Rand. Normiert zeigt das Diagramm stattdessen,
         WORAUS der Song gerade besteht: Der Streifen ist immer voll,
         und die Anteile verschieben sich.

         Die Zahlen unten stammen aus der Dezibelfassung; in Energie
         faellt der Sockel anders aus, das Argument bleibt dasselbe.

         OHNE DAS SOCKELBAND, wie im Horizontband. Erst wurde es
         mitgezaehlt, mit dem Argument, ein Anteil sei nur ein Anteil,
         wenn das Ganze mitzaehlt. Gemessen taugt das nicht: Der Sockel
         nimmt im Mittel 81,4 % ein (5. Perzentil 25,6, 95. Perzentil
         99,6) - fuer alle uebrigen bleiben im Mittel 18,6 %, und darin
         sind die feinen Baender ein Saum von 0,5 %, 0,2 %, 0,0 %.

         Ohne ihn zeigt das Diagramm die Aufteilung UNTER den
         Groessenordnungen, die ueberhaupt Ereignisse tragen. Wie laut
         das Stueck insgesamt ist, steht in den Spuren darueber. */
      var erstes=1;                        // Band 0 ist der Sockel
      var summen=[];                       // summen[k] = Bänder erstes..k
      for(var k=0;k<zeilen;k++){
        var s2=new Float64Array(punkte);
        for(var p=0;p<punkte;p++){
          if(k<erstes){ s2[p]=0; continue; }
          var v=werte[k][p];
          s2[p]=(k>erstes?summen[k-1][p]:0)+(isFinite(v)?v:NaN);
        }
        summen.push(s2);
      }
      var gesamt=summen[zeilen-1];
      for(var k=erstes;k<zeilen;k++)
        for(var p=0;p<punkte;p++)
          /* WO NICHTS KLINGT, IST KEIN ANTEIL BESTIMMBAR - das ist etwas
             anderes als "Anteil null". Mit NaN uebersprang der Pfad diese
             Punkte, und weil Intro und Ausklang still sind, begann die
             Flaeche erst bei x=72: ein Rand, den keine andere Spur hat.
             Die Zeitachse muss aber durchlaufen, sonst steht die Breite
             fuer eine andere Dauer als nebenan.
             Also beides: die Baender auf null, UND die Stelle grau
             hinterlegt (Caspar_D, 24.08.2026: "fülle den nicht bestimmbaren
             Anteil mit grau, so dass man sieht, dass da NaN ist").
             Verschwiegen wird nichts, kaschiert auch nicht. */
          summen[k][p]= (isFinite(gesamt[p])&&gesamt[p]>0) ? summen[k][p]/gesamt[p] : 0;
      gesamtMax=1;
      /* Zusammenhaengende stille Strecken als ein Feld, nicht als
         einzelne Striche - sonst steht dort ein Kamm. */
      var stumm=[], lauf=null;
      for(var p2=0;p2<punkte;p2++){
        var leer = !(isFinite(gesamt[p2]) && gesamt[p2] > 0);
        if(leer && lauf===null) lauf=p2;
        else if(!leer && lauf!==null){ stumm.push([lauf,p2-1]); lauf=null; }
      }
      if(lauf!==null) stumm.push([lauf,punkte-1]);
      for(var si=0;si<stumm.length;si++){
        var xa=(Math.max(0,stumm[si][0]-0.5)/(punkte-1||1)*SPUR_W).toFixed(1);
        var xb=(Math.min(punkte-1,stumm[si][1]+0.5)/(punkte-1||1)*SPUR_W).toFixed(1);
        t2.push('<rect x="'+xa+'" y="'+pad2+'" width="'+(xb-xa).toFixed(1)
          +'" height="'+(H2-2*pad2)+'" fill="#9a9aa2" opacity="0.13"/>');
      }
      for(var k=zeilen-1;k>=erstes;k--){   // von oben nach unten zeichnen
        var d2='', erstesX=null, letztesX2=null;
        for(var p=0;p<punkte;p++){
          if(!isFinite(summen[k][p])) continue;
          var px=(p/(punkte-1||1)*SPUR_W).toFixed(1);
          if(erstesX===null){ d2='M'+px+' '+(H2-pad2)+' '; erstesX=px; }
          d2+='L'+px+' '+(H2-pad2-summen[k][p]/gesamtMax*(H2-2*pad2)).toFixed(1)+' ';
          letztesX2=px;
        }
        if(erstesX===null) continue;
        d2+='L'+letztesX2+' '+(H2-pad2)+' Z';
        t2.push('<path d="'+d2+'" fill="'+farben[k%farben.length]+'" opacity="0.9"/>');
      }
      t2.push('</svg>');
      document.getElementById('stapelspur-canvas').innerHTML=t2.join('');
      var ts=document.querySelector('#spur-stapel .spur-titel');
      if(ts) ts.innerHTML='<span class="nam" style="color:#4b93f0">Gestapelte zeitintervallsortierte Anteile</span> — <span class="erkl">dieselben Bänder addiert</span> · '
        +N.slice(erstes).map(function(x,i){return '<span style="color:'+lesbar(farben[(i+erstes)%farben.length])+'">'+x+'</span>';}).join(' · ')
        +' · <span style="opacity:.82"><b>in Energie</b> gerechnet, nicht in Dezibel — nur dort ist eine Summe eine Summe · '
        +'je Zeitpunkt auf 100 % normiert — woraus der Song gerade besteht, '
        +'nicht wie laut er ist · ohne das Sockelband '+N[0]+' (im Mittel 81 % und keine Ereignisse) · '
        +'unten die längste Wellenlänge, Spitzen obenauf · '
        +'<span style="color:#9a9aa2">grau</span> = still, kein Anteil bestimmbar</span>';
    }

    function abweichungSpurZeichnen(d, m){
      var host=document.getElementById('abweichungspur-canvas');
      if(!host||!d.momentan||!d.kurz) return;
      var n=Math.min(d.momentan.length, d.kurz.length), diff=new Float32Array(n);
      var gueltig=[];
      for(var i=0;i<n;i++){
        /* isFinite prüfen, nicht nur den Pegel: Ein NaN aus den
           Randfenstern besteht den Vergleich "< -90" klaglos und
           verdirbt danach die ganze Spanne. */
        if(!isFinite(d.momentan[i])||!isFinite(d.kurz[i])||d.momentan[i]<-90||d.kurz[i]<-90){ diff[i]=NaN; continue; }
        diff[i]=d.momentan[i]-d.kurz[i];
        gueltig.push(diff[i]);
      }
      if(!gueltig.length) return;
      gueltig.sort(function(a,b){return a-b;});
      var lo=gueltig[0], hi=gueltig[gueltig.length-1];
      var betrag=Math.max(Math.abs(lo),Math.abs(hi));  // symmetrisch um null
      if(betrag<1) betrag=1;

      var H=56, pad=3, mitte=H/2;
      var y=function(v){ return mitte - Math.max(-betrag,Math.min(betrag,v))/betrag*(mitte-pad); };
      var punkte=Math.min(SPUR_W, n);
      var dP='', dA='M0 '+mitte+' ';
      for(var p2=0;p2<punkte;p2++){
        var a=Math.floor(p2*n/punkte), b=Math.max(a+1,Math.floor((p2+1)*n/punkte));
        var s=0,z=0;
        for(var k=a;k<b&&k<n;k++) if(isFinite(diff[k])){ s+=diff[k]; z++; }
        if(!z) continue;
        var px=(p2/(punkte-1||1)*SPUR_W).toFixed(1), py=y(s/z).toFixed(1);
        dP+=(dP?'L':'M')+px+' '+py+' ';
        dA+='L'+px+' '+py+' ';
      }
      dA+='L'+SPUR_W+' '+mitte+' Z';

      /* Vorzeichen als Farbe, mit Beschnittpfaden - die Bauart aus den
         Sequenzprofilen. Über der Mittellinie warm, darunter kühl; die
         Null ist die Aussage, nicht ein Wert unter vielen. */
      var OBEN='#fa9440', UNTEN='#4b93f0';
      host.innerHTML=
        '<svg viewBox="0 0 '+SPUR_W+' '+H+'" preserveAspectRatio="none">'
        + '<defs><clipPath id="sa-clipO"><rect x="0" y="0" width="'+SPUR_W+'" height="'+mitte+'"/></clipPath>'
        + '<clipPath id="sa-clipU"><rect x="0" y="'+mitte+'" width="'+SPUR_W+'" height="'+mitte+'"/></clipPath></defs>'
        + '<path d="'+dA+'" fill="'+OBEN+'" opacity="0.18" clip-path="url(#sa-clipO)"/>'
        + '<path d="'+dA+'" fill="'+UNTEN+'" opacity="0.16" clip-path="url(#sa-clipU)"/>'
        + '<line x1="0" y1="'+mitte+'" x2="'+SPUR_W+'" y2="'+mitte+'" stroke="rgba(255,255,255,.28)"'
        +   ' stroke-width="0.7" vector-effect="non-scaling-stroke"/>'
        + '<path d="'+dP+'" fill="none" stroke="'+OBEN+'" stroke-width="1.3" vector-effect="non-scaling-stroke" clip-path="url(#sa-clipO)"/>'
        + '<path d="'+dP+'" fill="none" stroke="'+UNTEN+'" stroke-width="1.3" vector-effect="non-scaling-stroke" clip-path="url(#sa-clipU)"/>'
        + '</svg>';

      var titel=document.querySelector('#spur-abweichung .spur-titel');
      if(titel) titel.innerHTML=
          '<span class="nam">Abweichung</span> — <span class="erkl">Augenblick gegen Umgebung</span> · '
        + '<span style="color:'+OBEN+'">oben: ragt heraus</span> · '
        + '<span style="color:'+UNTEN+'">unten: fällt ab</span> · '
        + '<span style="opacity:.9">' + lo.toFixed(1) + ' bis +' + hi.toFixed(1) + ' LU</span>';
    }

    /* DIE KORRELATIONSSPUR (25.08.2026, Review Block 6). Dieselbe Bauart
       wie die Abweichung darueber - bipolar um eine Mittellinie, das
       Vorzeichen als Farbe -, aber mit FESTER Skala -1..+1: Die
       Korrelation ist eine absolute Groesse, ein Song mit engem Mono-Mix
       soll auch eng aussehen und nicht auf die volle Hoehe gestreckt
       werden. Oben (gleichphasig) das Haus-Gruen, unten (gegenphasig)
       das Warnrot; die gestrichelte Linie bei -0,1 ist die Schwelle, ab
       der die Befundbahn eine Ausloeschung meldet - Schwellen stehen IM
       Bild, nicht daneben (Hausform). */
    function korrSpurZeichnen(msg){
      var rahmen=document.getElementById('spur-korr');
      var host=document.getElementById('korrspur-canvas');
      if(!rahmen||!host) return;
      var kv=msg&&msg.korrVerlauf;
      if(!kv||!kv.length){ rahmen.style.display='none'; return; }
      rahmen.style.display='';

      var n=kv.length, H=56, pad=3, mitte=H/2;
      var y=function(v){ return mitte - Math.max(-1,Math.min(1,v))*(mitte-pad); };
      var punkte=Math.min(SPUR_W, n);
      var dP='', dA='M0 '+mitte+' ';
      for(var p2=0;p2<punkte;p2++){
        var a=Math.floor(p2*n/punkte), b=Math.max(a+1,Math.floor((p2+1)*n/punkte));
        var s=0,z=0;
        for(var k=a;k<b&&k<n;k++) if(isFinite(kv[k])){ s+=kv[k]; z++; }
        if(!z) continue;
        var px=(p2/(punkte-1||1)*SPUR_W).toFixed(1), py=y(s/z).toFixed(1);
        dP+=(dP?'L':'M')+px+' '+py+' ';
        dA+='L'+px+' '+py+' ';
      }
      dA+='L'+SPUR_W+' '+mitte+' Z';

      var OBEN='#16be5c', UNTEN='#e31c79', ySchwelle=y(-0.1).toFixed(1);
      host.innerHTML=
        '<svg viewBox="0 0 '+SPUR_W+' '+H+'" preserveAspectRatio="none" data-h="'+H+'">'
        + '<defs><clipPath id="sa-clipKO"><rect x="0" y="0" width="'+SPUR_W+'" height="'+mitte+'"/></clipPath>'
        + '<clipPath id="sa-clipKU"><rect x="0" y="'+mitte+'" width="'+SPUR_W+'" height="'+mitte+'"/></clipPath></defs>'
        + '<path d="'+dA+'" fill="'+OBEN+'" opacity="0.15" clip-path="url(#sa-clipKO)"/>'
        + '<path d="'+dA+'" fill="'+UNTEN+'" opacity="0.20" clip-path="url(#sa-clipKU)"/>'
        + '<line x1="0" y1="'+mitte+'" x2="'+SPUR_W+'" y2="'+mitte+'" stroke="rgba(255,255,255,.28)"'
        +   ' stroke-width="0.7" vector-effect="non-scaling-stroke"/>'
        + '<line x1="0" y1="'+ySchwelle+'" x2="'+SPUR_W+'" y2="'+ySchwelle+'" stroke="'+UNTEN+'"'
        +   ' stroke-width="0.7" stroke-dasharray="6 5" opacity="0.55" vector-effect="non-scaling-stroke"/>'
        + '<path d="'+dP+'" fill="none" stroke="'+OBEN+'" stroke-width="1.3" vector-effect="non-scaling-stroke" clip-path="url(#sa-clipKO)"/>'
        + '<path d="'+dP+'" fill="none" stroke="'+UNTEN+'" stroke-width="1.3" vector-effect="non-scaling-stroke" clip-path="url(#sa-clipKU)"/>'
        + '</svg>';

      var titel=document.querySelector('#spur-korr .spur-titel');
      if(titel) titel.innerHTML=
          '<span class="nam">Verträgt er Mono?</span> — <span class="erkl">Stereo-Korrelation über die Zeit</span> · '
        + '<span style="color:'+OBEN+'">+1 gleich</span> · '
        + '<span style="color:'+UNTEN+'">−1 gegenphasig</span>'
        + (isFinite(msg.korr) ? ' · <span style="opacity:.9">Mittel '+msg.korr.toFixed(2)+'</span>' : '')
        + (isFinite(msg.negPhase) && msg.negPhase>=0.5
            ? ' · <span style="color:'+UNTEN+'">'+msg.negPhase.toFixed(0)+' % unter −0,1</span>' : '');
    }

    /* ==================================================================
       Gleitendes Fenster mit Gewichtsprofil, über Kastenkaskade.

       Ein gewichtetes Fenster direkt zu falten kostet Länge×Punkte -
       bei 16.000 Punkten und 400-ms-Fenster rund 300 Millionen
       Multiplikationen. Der Ausweg ist alt und hübsch: Kastenfilter
       hintereinandergeschaltet.

         1 Kasten  = Rechteck
         2 Kästen  = Dreieck (exakt)
         3 Kästen  = Kuppel (praktisch nicht von der Kosinuskuppel
                     zu unterscheiden)
         4-5       = Glocke

       Jeder Durchgang kostet über die kumulierte Summe zwei
       Subtraktionen je Punkt. Und weil jeder Durchgang durch seine
       eigene Länge teilt, bleibt ein konstantes Signal konstant -
       die Gewichtssumme ist damit von selbst gleich der Fensterlänge,
       ohne dass man sie eigens herstellen muss.

       ZENTRIERT: Der Wert an der Stelle i beschreibt das Fenster UM i
       herum. Eine halbe Fensterlänge an den Rändern liefert nichts,
       statt einen zu niedrigen Wert aus einem abgeschnittenen Fenster
       zu erfinden.

       Wirksame Länge (über wie viele Punkte tatsächlich gemittelt wird):
         Rechteck N · Dreieck ¾N · Kuppel ⅔N
       Sie steht im Titel, nicht die nominelle - sonst verstellt ein
       Profilwechsel unbemerkt die Zeitkonstante mit.
       ================================================================== */
    /* Fuenf Gewichtsprofile. Vier entstehen ueber Kastenkaskaden - ein
       Kasten ergibt das Rechteck, zwei das Dreieck, drei die Kuppel,
       fuenf die Glocke. Die SPITZE nicht: Sie ist ein Laplace-Profil,
       also beidseitig exponentiell abklingend, und das kommt aus keiner
       Zahl von Kaesten heraus - eine Kastenkaskade strebt zur Glocke.

       Gerechnet wird sie mit einem einpoligen Filter vorwaerts und
       rueckwaerts. Zweimal exponentiell, einmal in jede Richtung,
       ergibt genau die zweiseitige Exponentialfunktion; und weil beide
       Laeufe symmetrisch sind, bleibt der Bezug die Fenstermitte.

       wirksam: N_eff = (Summe w)^2 / Summe w^2. Fuer das Laplace-Profil
       mit Abklingfaktor a ist das (1+a)/(1-a) - bei der unten gewaehlten
       Wahl rund 0,45 der nominellen Laenge. */
    var PROFILE={rechteck:{kaesten:1, wirksam:1.00, name:'Rechteck'},
                 dreieck: {kaesten:2, wirksam:0.75, name:'Dreieck'},
                 kuppel:  {kaesten:3, wirksam:0.67, name:'Kuppel'},
                 glocke:  {kaesten:5, wirksam:0.55, name:'Glocke'},
                 spitze:  {laplace:true, wirksam:0.45, name:'Spitze (Laplace)'}};

    /* Beidseitig exponentiell: vorwaerts, dann rueckwaerts. Ungueltige
       Werte reissen die Kette nicht ab, sie werden uebersprungen -
       gefuellt wird nichts. */
    function laplaceGlatt(reihe, breite){
      var n=reihe.length;
      if(breite<2) return reihe;
      /* a so, dass die wirksame Laenge (1+a)/(1-a) der gewuenschten
         Breite entspricht. */
      var a=(breite-1)/(breite+1);
      if(a<0) a=0; if(a>0.999) a=0.999;
      var vor=new Float32Array(n), zur=new Float32Array(n);
      var w=NaN;
      for(var i=0;i<n;i++){ var v=reihe[i];
        if(!isFinite(v)){ vor[i]=NaN; continue; }
        w = isFinite(w) ? a*w+(1-a)*v : v; vor[i]=w; }
      w=NaN;
      for(var i2=n-1;i2>=0;i2--){ var v2=vor[i2];
        if(!isFinite(v2)){ zur[i2]=NaN; continue; }
        w = isFinite(w) ? a*w+(1-a)*v2 : v2; zur[i2]=w; }
      /* Rand: wo das halbe Fenster nicht hineinpasst, nichts erfinden -
         dieselbe Regel wie beim Kastenmittel. */
      var halb=breite>>1;
      for(var i3=0;i3<n;i3++) if(i3<halb||i3>=n-halb) zur[i3]=NaN;
      return zur;
    }

    function kastenMittel(reihe, breite){
      var n=reihe.length, halb=breite>>1;
      var s=new Float64Array(n+1), gueltig=new Uint8Array(n);
      for(var i=0;i<n;i++){ var v=reihe[i]; var ok=isFinite(v);
        gueltig[i]=ok?1:0; s[i+1]=s[i]+(ok?v:0); }
      var z=new Float64Array(n+1);
      for(var i=0;i<n;i++) z[i+1]=z[i]+gueltig[i];
      var aus=new Float32Array(n);
      for(var i=0;i<n;i++){
        var a=i-halb, b=i+halb+1;
        if(a<0||b>n){ aus[i]=NaN; continue; }      // Rand: nichts erfinden
        var anz=z[b]-z[a];
        aus[i]=anz>0 ? (s[b]-s[a])/anz : NaN;
      }
      return aus;
    }

    function glaetten(reihe, breite, profil){
      var p=PROFILE[profil]||PROFILE.kuppel;
      if(breite<2) return reihe;
      if(p.laplace) return laplaceGlatt(reihe, breite);
      /* Bei mehreren Kästen wird jeder schmaler, damit die Gesamtbreite
         ungefähr die gewünschte bleibt. */
      var einzeln=Math.max(1, Math.round(breite/Math.sqrt(p.kaesten)));
      var r=reihe;
      for(var k=0;k<p.kaesten;k++) r=kastenMittel(r, einzeln);
      return r;
    }

    /* ------------------------------------------------------------------
       Eine Linienspur. Ersetzt die Canvas-Diagramme für alles, was sich
       als Linie beschreiben lässt.
       ------------------------------------------------------------------ */
    /* TOTGELEGT ÜBER DIE ZEIT (Caspar_D, 23.08.2026: "leg den Bullshit über die
       Zeit tot"). Dieselben Rechnungen, die als Karte falsch waren, sind es
       als Verlauf auch - vier davon sind die Zeitform totgelegter Karten.
       Dazu die Impulsdichte, die mit einer ABSOLUTEN Schwelle zählt und damit
       Pegel misst statt Anschläge, und das Tempo, das den schlechtesten der
       drei Schätzer zeigt. Belege in docs/ANALYZER-REVIEW.md.
       Es bleiben Signalenergie und Dynamikumfang: einfache, nachvollziehbare
       Größen, die den geprüften Lautheitsteil ergänzen. */
    /* Was unter den beiden Spuren steht. Sie entstehen dynamisch, also
       reist der Text hier mit. */
    var SPUR_TEXT={
      energie:'Der Energieverlauf über die Zeit, im Standard geglättet mit einer Kuppel von rund '
        +'268 Millisekunden Wirkbreite. Gezeigt wird der Spannungsbogen eines Stücks — wo es '
        +'aufbaut, wo es steht, wo es abfällt. Einzelne Anschläge verschwinden dabei in der '
        +'Glättung; wer sie sucht, findet sie in der Klangveränderung weiter unten.',
      crest:'Das Verhältnis von Spitzenwert zu Effektivwert, ungeglättet und mit einem Punkt je '
        +'halbe Sekunde. Hohe Werte bedeuten lebendige Anschläge mit Luft dazwischen, niedrige '
        +'einen dichten, stark komprimierten Klang. Werte um drei zeigen kräftige Kompression an, '
        +'Werte über zehn einen weitgehend unbearbeiteten Klang.'
    };
    var SPUREN=[
      {id:'energie',  quelle:function(d){return d.energy;},   farbe:'#f97b14', name:'Signalenergie', einheit:'', db:false},
      {id:'crest',    quelle:function(d){return d.crest;},    farbe:'#16be5c', name:'Dynamikumfang (Crest)', einheit:''},
    ];

    /* Die Gewichtsprofile als SYMBOL, nicht als Wort.

       Ein <option> kann kein SVG tragen, deshalb eine Knopfgruppe. Der
       Gewinn ist derselbe wie bei der Regel "Formen statt Eigennamen":
       Das Symbol IST die Form - jede Kurve ist aus ihrem eigenen
       Profil gezeichnet, nicht aus einer Abstraktion davon. Wer den
       Namen braucht, findet ihn im Tooltip.

       Rechteck flach mit harten Kanten · Dreieck als Zelt · Kuppel als
       Kosinusbogen, der am Rand auf null geht · Glocke schmaler mit
       Auslaeufern, die nie ganz null werden. */
    var PROFIL_FORM={
      rechteck:'M1 9 V2 H13 V9',
      dreieck: 'M1 9 L7 2 L13 9',
      /* Halbkreis, nicht Kosinusbogen: ein Bogen mit Radius 6 von
         (1,9) nach (13,9). */
      kuppel:  'M1 9 A6 6 0 0 1 13 9',
      glocke:  'M1 9 C5.5 9 5.5 2 7 2 C8.5 2 8.5 9 13 9',
      /* Laplace: spitzer Scheitel, Flanken exponentiell auslaufend -
         also konkav, nicht konvex wie bei der Glocke. */
      spitze:  'M1 8.7 C4.5 8.4 6 7 7 2 C8 7 9.5 8.4 13 8.7'
    };
    var PROFIL_NAME={ rechteck:'Rechteck', dreieck:'Dreieck (Zelt)',
                      kuppel:'Kuppel (Halbkreis)', glocke:'Glocke',
                      spitze:'Spitze (Laplace)' };

    function profilKnoepfe(id){
      return '<span class="spur-profil" data-fuer="'+id+'" data-wert="kuppel">'
        + Object.keys(PROFIL_FORM).map(function(k){
            return '<button data-p="'+k+'" class="'+(k==='kuppel'?'an':'')+'" title="'+PROFIL_NAME[k]+'">'
              + '<svg viewBox="0 0 14 11" width="14" height="11">'
              + '<path d="'+PROFIL_FORM[k]+'" fill="none" stroke="currentColor" stroke-width="1.2"'
              + ' stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg></button>';
          }).join('')
        + '</span>';
    }

    function linienSpurenAufbauen(){
      var wirt=document.getElementById('sa-linien');
      if(!wirt||wirt._gebaut) return;
      wirt.innerHTML=SPUREN.map(function(s){
        /* Die beiden Auswahlfelder stehen UNTER dem Diagramm, nicht in
           der Titelzeile (Caspar_D, 18.08.2026). Oben drueckten sie den
           Titel zusammen und standen zwischen Namen und Messwerten;
           unten sind sie das, was sie sind - eine Einstellung zu dem,
           was darueber zu sehen ist. */
        return '<div class="section sa-spur" id="spur-'+s.id+'">'
          + '<div class="slbl"><span class="spur-titel"></span></div>'
          + '<div class="chart-outer" style="height:44px"><div id="'+s.id+'spur-canvas" class="spur-flaeche"></div>'
          + '<div class="playhead" id="ph-'+s.id+'spur"></div></div>'
          + (SPUR_TEXT[s.id] ? '<div class="chart-text">'+SPUR_TEXT[s.id]+'</div>' : '')
          + '<div class="spur-wahl">'
          + profilKnoepfe(s.id)
          + '<select class="spur-fenster" data-fuer="'+s.id+'" title="Fensterlänge in Millisekunden">'
          + '<option value="0">ohne</option><option value="50">50 ms</option>'
          + '<option value="100">100 ms</option><option value="200">200 ms</option>'
          + '<option value="400" selected>400 ms</option><option value="1000">1 s</option>'
          + '<option value="3000">3 s</option></select>'
          + '</div></div>';
      }).join('');
      wirt.addEventListener('change', function(e){
        if(e.target.classList.contains('spur-fenster')) linienSpurenZeichnen();
      });
      wirt.addEventListener('click', function(e){
        var k=e.target.closest('.spur-profil button'); if(!k) return;
        var gruppe=k.parentElement;
        gruppe.dataset.wert=k.dataset.p;
        [].forEach.call(gruppe.children, function(b){ b.classList.toggle('an', b===k); });
        linienSpurenZeichnen();
      });
      wirt._gebaut=true;
      SPUREN.forEach(function(s){ if(phIds.indexOf(s.id+'spur')<0) phIds.push(s.id+'spur'); });
    }

    function linienSpurenZeichnen(){
      linienSpurenAufbauen();

      /* Was niemand sieht, wird nicht gerechnet.

         Die Wache steht EINMAL hier und nicht sechzehnmal in der
         Schleife. Ein offsetParent-Zugriff zwingt den Browser, Stil und
         Layout auszurechnen; zwischen zwei Durchlaeufen steht aber ein
         innerHTML. Je Spur zu fragen hiesse also, sechzehnmal ein
         Layout zu erzwingen, das gerade erst ungueltig gemacht wurde -
         die Wache waere teurer als die Arbeit, die sie spart.

         Ist der Wirt verdeckt, sind es alle sechzehn: sie liegen
         darin. Damit fallen die Spuren unter dieselbe Regel wie die
         abgeklemmten Canvas-Diagramme (Caspar_D, 18.08.2026: "nicht
         wegwerfen, nur verschwinden lassen oder abklemmen, damit es
         keine Rechenzeit verschwendet"). Beim Zurueckschalten in den
         Analysemodus wird ohnehin neu gerechnet - es gibt noch keinen
         Zwischenspeicher je Song -, die Spuren kommen also mit den
         Daten von selbst wieder. */
      if(!sichtbar('sa-linien')) return;

      var d=window._chartData||{};
      SPUREN.forEach(function(s){
        var reihe; try{ reihe=s.quelle(d); }catch(e){ return; }
        var abschnitt=document.getElementById('spur-'+s.id);
        if(!abschnitt) return;
        if(!reihe||!reihe.length){ abschnitt.style.display='none'; return; }
        abschnitt.style.display='';

        var pw=abschnitt.querySelector('.spur-profil');
        var profil=(pw&&pw.dataset.wert)||'kuppel';
        var wunschMs=parseInt((abschnitt.querySelector('.spur-fenster')||{}).value||'400',10);

        /* Jede Kurve hat ihre eigene Schrittweite - die Impulsdichte
           liefert zwei Werte je Sekunde, die Klangfarbe fünfzig. Eine
           Angabe in Punkten wäre für jede Kurve etwas anderes; deshalb
           wird aus der gewünschten Zeit die Punktzahl gerechnet. */
        var dauer=(d.dur||(d.fft&&d.fft.dur)||0);
        var schrittMs=dauer>0 ? dauer*1000/reihe.length : 0;
        var breite=(wunschMs>0&&schrittMs>0) ? Math.round(wunschMs/schrittMs) : 0;
        var geglaettet=breite>1 ? glaetten(reihe, breite, profil) : reihe;

        /* WAS NICHT WIRKT, WIRD NICHT ANGEBOTEN (Caspar_D, 25.08.2026:
           "Dynamikumfang - wenn ich hier die Knoepfe durchprobiere oder
           die Windowsgroesse aendere passiert gar nichts").

           Er hatte recht, und es war kein Fehler, sondern eine Grenze:
           Ein Glaettungsfenster, das kuerzer ist als der Abstand zweier
           Datenpunkte, enthaelt genau einen Punkt - es kann nichts
           mitteln. Beim Dynamikumfang liegen die Punkte 501 ms
           auseinander, also blieben 50 bis 400 ms wirkungslos, waehrend
           die Oberflaeche sie weiter anbot. Bei der Signalenergie (50 ms
           je Punkt) faellt das nie auf.

           Jetzt sperrt die Liste, was rechnerisch nichts tut, und die
           Profilknoepfe dimmen mit, solange gar nicht geglaettet wird -
           sie waehlen dann die Form von nichts. */
        var fensterWahl=abschnitt.querySelector('.spur-fenster');
        if(fensterWahl && schrittMs>0){
          [].forEach.call(fensterWahl.options, function(o){
            var ms=parseInt(o.value,10);
            o.disabled = ms>0 && Math.round(ms/schrittMs)<2;
          });
        }
        if(pw) pw.style.opacity = breite>1 ? '' : '0.35';

        var lo=Infinity, hi=-Infinity;
        for(var i=0;i<geglaettet.length;i++){ var v=geglaettet[i];
          if(isFinite(v)){ if(v<lo)lo=v; if(v>hi)hi=v; } }
        if(!isFinite(lo)) return;
        if(hi-lo<1e-9) hi=lo+1;

        var H=44, pad=3;
        var host=document.getElementById(s.id+'spur-canvas');
        if(!host) return;
        var p=spurPfad(geglaettet, 0, true, H, pad, lo, hi, undefined);
        if(!p) return;

        /* ABSICHTLICH IM ALTEN STAND: Die neue Formensprache gilt bis zum
           Frequenzspektrum (Track-Struktur und Befundbahnen). Was danach
           kommt, war Caspar_D so recht (23.08.2026: "danach war alles von der
           Designsprache in Ordnung"). */
        /* Der bipolar-Zweig stand hier - unerreichbar, seit keine der
           Sequenzspuren mehr bipolar definiert ist, und zugleich ein
           Duplikat der Bauart von abweichungSpurZeichnen und
           korrSpurZeichnen. Wer je wieder eine zweiseitige Sequenzspur
           braucht, nimmt die als Vorlage (Review, 25.08.2026). */
        var svg='<svg viewBox="0 0 '+SPUR_W+' '+H+'" preserveAspectRatio="none">'
          + '<path d="'+p.flaeche+'" fill="'+s.farbe+'" opacity="0.15"/>'
          + '<path d="'+p.linie+'" fill="none" stroke="'+s.farbe+'" stroke-width="1.3" vector-effect="non-scaling-stroke"/>'
          + '</svg>';
        host.innerHTML=svg;

        var pr=PROFILE[profil]||PROFILE.kuppel;
        var titel=abschnitt.querySelector('.spur-titel');
        var zahl=function(v){var b=Math.abs(v);return b>=1000?Math.round(v).toLocaleString('de-DE'):b>=10?v.toFixed(0):b>=1?v.toFixed(1):v.toFixed(2);};
        if(titel) titel.innerHTML=
            '<span class="nam" style="color:'+s.farbe+'">'+s.name+'</span>'
          + ' — <span class="erkl">'+zahl(lo)+' bis '+zahl(hi)+s.einheit+'</span>'
          + (breite>1
              ? ' · <span style="opacity:.82">'+pr.name+', wirksam '
                + (function(ms){ return kaskadeName(Math.round(ms)); })(breite*schrittMs*pr.wirksam)
                + '</span>'
              : ' · <span style="opacity:.78">ohne Glättung, '
                + kaskadeName(Math.round(schrittMs))
                + ' je Punkt</span>');
      });
      spurSichtSetzen();
    }

    function spurMalen(id, abschnitt, reihe, farbe, name, fenster, ziel, m){
      var host=document.getElementById(id+'-canvas');
      if(!host) return;
      var H=44, pad=3;

      var lo=Infinity, hi=-Infinity;
      for(var i=0;i<reihe.length;i++){ var v=reihe[i];
        if(isFinite(v)&&v>-99){ if(v<lo)lo=v; if(v>hi)hi=v; } }
      if(!isFinite(lo)) return;
      if(ziel){ if(ziel.lufs<lo) lo=ziel.lufs; if(ziel.lufs>hi) hi=ziel.lufs; }
      if(hi-lo<1) hi=lo+1;

      /* false: Momentan- und Kurzzeitlautheit sind bereits im
         Rechenkern auf die Fenstermitte bezogen (fensterEnergienMitte)
         und liegen als Punktreihe im 20-ms-Raster vor - hier darf keine
         zweite halbe Blockbreite dazukommen. */
      var p=spurPfad(reihe, m.dur, true, H, pad, lo, hi, false);
      if(!p) return;

      var teile=['<svg viewBox="0 0 '+SPUR_W+' '+H+'" preserveAspectRatio="none">'];
      teile.push('<path d="'+p.flaeche+'" fill="'+farbe+'" opacity="0.15"/>');
      if(ziel){
        var yz=p.y(ziel.lufs).toFixed(1);
        teile.push('<line x1="0" y1="'+yz+'" x2="'+SPUR_W+'" y2="'+yz+'" stroke="#d8d81c"'
          +' stroke-width="0.8" stroke-dasharray="5 3" opacity="0.7" vector-effect="non-scaling-stroke"/>');
      }
      var yi=p.y(m.lufs).toFixed(1);
      teile.push('<line x1="0" y1="'+yi+'" x2="'+SPUR_W+'" y2="'+yi+'" stroke="'+farbe+'"'
        +' stroke-width="0.7" opacity="0.45" vector-effect="non-scaling-stroke"/>');
      teile.push('<path d="'+p.linie+'" fill="none" stroke="'+farbe+'" stroke-width="1.4" vector-effect="non-scaling-stroke"/>');
      teile.push('</svg>');
      host.innerHTML=teile.join('');

      var titel=document.querySelector('#'+abschnitt+' .spur-titel');
      if(titel) titel.innerHTML=
          '<span class="nam" style="color:'+farbe+'">'+name+'</span>'
        + ' — <span class="erkl">' + fenster + ' · ' + lo.toFixed(1) + ' bis ' + hi.toFixed(1) + ' LUFS</span>'
        + ' · <span style="color:'+farbe+';opacity:.8">durchgezogen: integriert ' + m.lufs.toFixed(1) + '</span>'
        + (ziel ? ' · <span style="color:#d8d81c">gestrichelt: Ziel ' + ziel.lufs + ' (' + ziel.name + ')</span>' : '');
    }

    function funkenZeichnen(){
      var daten = window._chartData || {};
      Object.keys(FUNKEN).forEach(function(id){
        var wert = document.getElementById(id);
        var karte = wert && wert.closest('.card');
        if (!karte) return;
        /* 7 der 12 Funken-Karten sind totgelegt (SA_TOT) - fuer eine
           unsichtbare Karte die volle Reihe zu sortieren ist Verschwendung
           (Review, 25.08.2026). Beim Zurueckholen aus SA_TOT faellt das
           Attribut, und der Funke kommt von selbst wieder. */
        if (karte.dataset.totgelegt) return;
        var reihe;
        try { reihe = FUNKEN[id](daten); } catch(e){ return; }
        if (!reihe || !reihe.length) return;

        var c = karte.querySelector('canvas.funke');
        if (!c){
          c = document.createElement('canvas');
          c.className = 'funke';
          /* Sie ersetzt die Bereichsmarke: Eine Zeitreihe sagt mehr als
             die Lage in einem gedachten Bereich. */
          var alt = karte.querySelector('.gauge');
          if (alt) alt.remove();
          karte.appendChild(c);
        }

        var dpr = devicePixelRatio || 1, w = 78, h = 16;
        c.width = w*dpr; c.height = h*dpr;
        var ctx = c.getContext('2d');
        ctx.setTransform(dpr,0,0,dpr,0,0);
        ctx.clearRect(0,0,w,h);

        /* Eindampfen auf Bildpunkte. Ein Wert je Punkt genügt - bei 834
           Werten auf 78 Punkten sieht man ohnehin nur den Verlauf. */
        var n = reihe.length, min = Infinity, max = -Infinity, pkt = [];
        for (var x = 0; x < w; x++){
          var a = Math.floor(x*n/w), b = Math.max(a+1, Math.floor((x+1)*n/w));
          var s = 0, z = 0;
          for (var i = a; i < b && i < n; i++){
            var v = reihe[i];
            if (isFinite(v)){ s += v; z++; }
          }
          var m = z ? s/z : NaN;
          pkt.push(m);
          if (isFinite(m)){ if (m < min) min = m; if (m > max) max = m; }
        }
        if (!isFinite(min) || max === min) return;

        /* Kennzahlen aus der GANZEN Reihe, nicht aus den 78 Punkten -
           sonst mittelt man bereits Gemitteltes. */
        var gueltig = [];
        for (var q = 0; q < n; q++) if (isFinite(reihe[q])) gueltig.push(reihe[q]);
        gueltig.sort(function(a,b){ return a-b; });
        var vMin = gueltig[0], vMax = gueltig[gueltig.length-1];
        var summe = 0; for (var q2 = 0; q2 < gueltig.length; q2++) summe += gueltig[q2];
        var vMittel = summe / gueltig.length;
        var mitte = gueltig.length >> 1;
        var vMedian = gueltig.length % 2 ? gueltig[mitte] : (gueltig[mitte-1]+gueltig[mitte])/2;

        var yVon = function(v){ return h - 1.5 - (v-min)/(max-min)*(h-3); };

        /* Erst die beiden Bezugslinien, dann die Reihe darüber. */
        ctx.strokeStyle = 'rgba(75,147,240,.5)';     // Mittelwert, Suno-Blau
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, Math.round(yVon(vMittel))+0.5);
        ctx.lineTo(w, Math.round(yVon(vMittel))+0.5); ctx.stroke();

        ctx.strokeStyle = 'rgba(216,216,28,.55)';    // Median, Suno-Gelb
        ctx.setLineDash([2,2]);
        ctx.beginPath(); ctx.moveTo(0, Math.round(yVon(vMedian))+0.5);
        ctx.lineTo(w, Math.round(yVon(vMedian))+0.5); ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = 'rgba(255,255,255,.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        var offen = true;
        for (var x2 = 0; x2 < pkt.length; x2++){
          if (!isFinite(pkt[x2])){ offen = true; continue; }
          var y = h - 1.5 - (pkt[x2]-min)/(max-min)*(h-3);
          if (offen){ ctx.moveTo(x2+0.5, y); offen = false; }
          else ctx.lineTo(x2+0.5, y);
        }
        ctx.stroke();

        /* Die Punkte, an denen die Reihe ihre Ränder erreicht. */
        var punkt = function(v, farbe){
          var i2 = 0; for (var q3 = 0; q3 < pkt.length; q3++)
            if (isFinite(pkt[q3]) && Math.abs(pkt[q3]-v) < Math.abs(pkt[i2]-v)) i2 = q3;
          ctx.fillStyle = farbe;
          ctx.beginPath(); ctx.arc(i2+0.5, yVon(pkt[i2]), 1.6, 0, 6.284); ctx.fill();
        };
        punkt(vMax, 'rgba(249,123,20,.95)');    // orange
        punkt(vMin, 'rgba(75,147,240,.95)');    // blau

        var zahl = function(v){
          var b = Math.abs(v);
          return b >= 1000 ? Math.round(v).toLocaleString('de-DE')
               : b >= 10   ? v.toFixed(0)
               : b >= 1    ? v.toFixed(1) : v.toFixed(2);
        };
        var sp = karte.querySelector('.spanne');
        if (!sp){ sp = document.createElement('div'); sp.className = 'spanne'; karte.appendChild(sp); }
        /* Groesstwert orange, Kleinstwert blau - dieselbe Paarung wie
           ueberall im Analyzer (heiss oben, kalt unten). Vorher war der
           Groesstwert rostrot und der Kleinstwert farblos. */
        sp.innerHTML = '<i style="color:#f97b14">' + zahl(vMax) + '</i>'
                     + '<i style="color:#4b93f0">' + zahl(vMin) + '</i>';

        karte.title = 'Reihe über den ganzen Song\n'
          + 'Mittelwert (blaue Linie): ' + zahl(vMittel) + '\n'
          + 'Median (gelb, gestrichelt): ' + zahl(vMedian) + '\n'
          + 'höchster Wert: ' + zahl(vMax) + '\ntiefster Wert: ' + zahl(vMin);
        if (MITTELWERT_KARTEN.indexOf(id) >= 0) karte.classList.add('ist-mittel');
        karte.dataset.funke = '1';
      });
    }

    /* Die Wellenform als SVG-Pfad, nicht als Zeichenflaeche.

       Sie ist die sichtbarste Flaeche des Analysemodus, und an ihr
       haengt der Spielkopf. Als Canvas kostete jeder Zoomschritt einen
       Durchgang ueber 14,7 Millionen Abtastwerte; als Pfad kostet er
       ein Attribut, weil spurSichtSetzen() nur die viewBox verschiebt.

       Gezeichnet wird deshalb einmal ueber den GANZEN Song, nicht ueber
       den sichtbaren Ausschnitt - sonst muesste doch wieder neu
       gerechnet werden.

       Aufgeloest wird auf SPUR_W Stuetzstellen: Bei 32-fachem Zoom
       liegen davon noch 187 im Bild, und mehr als ein Wert je Bildpunkt
       ist ohnehin nicht zu sehen. Je Stuetzstelle die Spitze ihres
       Abschnitts, nicht ein Stellvertreter - sonst verschwindet ein
       Knack von zwanzig Millisekunden spurlos. */
    function drawMainWaveform(){
      var host=document.getElementById('main-waveform-canvas');
      if(!host||!window._audioSamples)return;
      var daten=window._audioSamples, H=48, mitte=H/2;
      var punkte=Math.min(SPUR_W, daten.length);
      if(punkte<2) return;

      var oben='', unten='';
      for(var p=0;p<punkte;p++){
        var von=Math.floor(p*daten.length/punkte), bis=Math.floor((p+1)*daten.length/punkte);
        if(bis<=von) bis=von+1;
        var mx=0;
        for(var j=von;j<bis&&j<daten.length;j++){ var a2=daten[j]; if(a2<0)a2=-a2; if(a2>mx) mx=a2; }
        var px=((p+0.5)/punkte*SPUR_W).toFixed(1), hw=mx*mitte*0.9;
        oben+=(p?'L':'M')+px+' '+(mitte-hw).toFixed(2)+' ';
        unten='L'+px+' '+(mitte+hw).toFixed(2)+' '+unten;
      }
      host.innerHTML='<svg viewBox="'+(viewStart*SPUR_W).toFixed(1)+' 0 '
        +((viewEnd-viewStart)*SPUR_W).toFixed(1)+' '+H+'" preserveAspectRatio="none" data-h="'+H+'">'
        +'<path d="'+oben+unten+'Z" fill="#4b93f0" opacity="0.6"/>'
        /* DIE KONTUR RINGSUM, NICHT NUR OBEN.

           Hier lag die Linie allein auf der oberen Kontur. Die
           Wellenform ist aber gespiegelt - oben und unten sind derselbe
           Wert. Ein hellerer Deckel behauptet einen Unterschied, den es
           nicht gibt. (Caspar_D, 19.08.2026: "warum hat die ein helleres
           topping".)

           Die Umrandung bleibt, sie gehoert zur Regel fuer helle
           Elemente auf dunklem Grund - aber ringsum. */
        +'<path d="'+oben+unten+'Z" fill="none" stroke="#4b93f0" stroke-width="1" opacity="0.85"'
        +' vector-effect="non-scaling-stroke"/>'
        +'<line x1="0" y1="'+mitte+'" x2="'+SPUR_W+'" y2="'+mitte+'" stroke="#4b93f0"'
        +' stroke-width="0.5" opacity="0.3" vector-effect="non-scaling-stroke"/>'
        +'</svg>';
    }





    // ===== CUMULATIVE FREQUENCY DENSITY SPECTRUM =====
    var DENSITY_BINS=30;
    var DENSITY_BUCKETS=200;  // amplitude resolution
    var _densityHist=null;    // [bins][buckets] — counts
    var _densityAnalyser=null;
    var _densityMaxCount=0;

    /* Der Quellknoten für die Live-Anzeigen.

       Eingebettet kommt er von außen: Die Bühne hat ihren Audiographen
       längst gebaut, und ein zweiter createMediaElementSource ist pro
       Audioelement nicht erlaubt. Genau so bekommen auch Butterchurn
       und audioMotion ihren Ton. Ein AudioContext lässt sich dabei
       nicht mischen - der Analyser MUSS an dem Kontext hängen, aus dem
       die Quelle stammt. */
    var _fremdeQuelle = null, _fremderCtx = null;
    var _fremdesEnde  = null;
    var _signalModus  = 'codiert';    /* 'codiert' | 'ausgabe' - welcher Abgriff gilt */
    /* ZWEI ABGRIFFE (Caspar_D, 26.08.2026: "wie wärs mit Registern,
       Rohsignal, Endsignal").

       `knoten` ist die Summe der Decks vor jeder Bearbeitung - das
       CODIERTE SIGNAL, also das Stueck, wie es in der Datei steht
       (Caspar_D, 26.08.2026: "Codiertes Signal / Ausgabe-Signal" -
       "roh" waere falsch gewesen, decodiert ist es ja bereits).
       `ende` ist der Punkt unmittelbar vor dem Lautsprecher: das
       AUSGABE-SIGNAL, nach Equalizer, Kompressor, Stereobreite, Hall
       und Echo.

       NICHTS WIRD VERRECHNET. Wenn das Endsignal leiser ist, sieht man
       das; wenn der Kompressor anhebt und dabei Rauschen mit
       hochkommt, sieht man auch das. Der Lautstaerkeregler steckt in
       beiden gleichermassen und faellt im Vergleich heraus. */
    function quelleSetzen(knoten, ctx, ende){
      _fremdeQuelle = knoten || null;
      _fremdesEnde  = ende || null;
      _fremderCtx   = ctx || null;
      initDensitySpectrum();
      /* Falls das Live-Spektrum schon laeuft: umhaengen. In der Buehne
         kommt quelle() vor der Datei, dann greift der Weg in
         drawSpectrum. Kommt es einmal andersherum, faellt es hier auf -
         und nicht erst dadurch, dass die Flaeche schwarz bleibt. */
      if(window._analyser && _fremdeQuelle){
        if(window._liveQuelle){try{ window._liveQuelle.disconnect(window._analyser); }catch(e){}}
        try{ _fremdeQuelle.connect(window._analyser); window._liveQuelle=_fremdeQuelle; }catch(e){}
      }
    }

    function initDensitySpectrum(){
      var ktx = _fremderCtx || audioCtx;
      var qle = _fremdeQuelle;   // eine Quelle, die der Buehne
      if(!ktx||!qle)return;
      // Always reset histogram for new song
      _densityHist=[];
      for(var i=0;i<DENSITY_BINS;i++)
        _densityHist.push(new Uint32Array(DENSITY_BUCKETS));
      _densityMaxCount=0;
      if(_densityAnalyser)return; // analyser node reused
      _densityAnalyser=ktx.createAnalyser();
      _densityAnalyser.fftSize=512;
      _densityAnalyser.smoothingTimeConstant=0;
      try{qle.connect(_densityAnalyser);}catch(e){}
      // Init histogram
      _densityHist=[];
      for(var i=0;i<DENSITY_BINS;i++)
        _densityHist.push(new Uint32Array(DENSITY_BUCKETS));
      _densityMaxCount=0;
      var c=document.getElementById('density-canvas');
      if(c){
        c.style.display='block';
        // Update right column max-height
        setTimeout(function(){
          var ml=document.getElementById('meta-left');
          if(ml){
            var h=ml.offsetHeight;
            var meta=document.getElementById('meta');
            if(meta)meta.style.setProperty('--meta-left-h',h+'px');
          }
        },100);
      }
      densityLoop();
    }

    function densityLoop(){
      requestAnimationFrame(densityLoop);
      /* Eingebettet liegt #density-canvas in #meta und ist doppelt
         unsichtbar (CSS !important, OPT.kopf:false) - vorher rechnete
         und malte die Schleife trotzdem in jedem Bild (Review,
         25.08.2026). Hausregel: abklemmen, damit es keine Rechenzeit
         kostet. */
      if(!sichtbar('density-canvas'))return;
      if(!_densityAnalyser||!LAEUFT())return;
      var raw=new Uint8Array(_densityAnalyser.frequencyBinCount);
      _densityAnalyser.getByteFrequencyData(raw);
      // Map FFT bins to DENSITY_BINS (log-ish grouping)
      var fftBins=raw.length;
      for(var b=0;b<DENSITY_BINS;b++){
        var lo=Math.floor(Math.pow(b/DENSITY_BINS,1.5)*fftBins);
        var hi=Math.floor(Math.pow((b+1)/DENSITY_BINS,1.5)*fftBins);
        if(hi<=lo)hi=lo+1;
        var peak=0;
        for(var k=lo;k<hi&&k<fftBins;k++) peak=Math.max(peak,raw[k]);
        var bucket=Math.floor(peak/256*DENSITY_BUCKETS);
        if(bucket>=DENSITY_BUCKETS)bucket=DENSITY_BUCKETS-1;
        _densityHist[b][bucket]++;
        if(_densityHist[b][bucket]>_densityMaxCount)
          _densityMaxCount=_densityHist[b][bucket];
      }
      drawDensitySpectrum();
    }

    function densityPercentile(hist,pct){
      // Find amplitude bucket corresponding to percentile
      var total=0;
      for(var i=0;i<hist.length;i++)total+=hist[i];
      if(!total)return 0;
      var target=total*pct;
      var cum=0;
      for(var i=0;i<hist.length;i++){
        cum+=hist[i];
        if(cum>=target)return i;
      }
      return hist.length-1;
    }

    function densityMode(hist){
      var max=0,idx=0;
      for(var i=0;i<hist.length;i++) if(hist[i]>max){max=hist[i];idx=i;}
      return idx;
    }

    function drawDensitySpectrum(){
      var c=document.getElementById('density-canvas');
      if(!c||!_densityHist)return;
      var dpr=devicePixelRatio||1;
      var size=c.clientWidth||150;
      if(c.width!==size*dpr){c.width=size*dpr;c.height=size*dpr;}
      var ctx=c.getContext('2d');
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.fillStyle='#080808';
      ctx.fillRect(0,0,size,size);
      if(!_densityMaxCount)return;

      var binW=size/DENSITY_BINS;

      for(var b=0;b<DENSITY_BINS;b++){
        var hist=_densityHist[b];
        var p5=densityPercentile(hist,0.05);
        var p50=densityPercentile(hist,0.50);
        var p95=densityPercentile(hist,0.95);
        var mode=densityMode(hist);
        var binMax=0;
        for(var i=0;i<DENSITY_BUCKETS;i++) binMax=Math.max(binMax,hist[i]);

        var x=b*binW;

        // Draw each bucket as a pixel row
        for(var a=0;a<DENSITY_BUCKETS;a++){
          var count=hist[a];
          if(!count)continue;
          var relFreq=count/binMax; // 0..1, mode=1
          var y=size-(a+1)/DENSITY_BUCKETS*size;
          var h=size/DENSITY_BUCKETS+0.5;

          var r,g,bl,alpha;
          if(a===mode){
            // Modal value — full white
            r=255;g=255;bl=255;alpha=1.0;
          } else if(a===p50){
            // Median — white, slightly smaller
            r=220;g=220;bl=220;alpha=0.9;
          } else if(a>=p5&&a<=p95){
            // IQR — gradient blue→white→orange
            var t=(a-p5)/(p95-p5); // 0=p5(blue), 0.5=median(white), 1=p95(orange)
            if(t<0.5){
              // blue to white
              var tt=t*2;
              r=Math.round(50+tt*205);
              g=Math.round(100+tt*155);
              bl=Math.round(255-tt*55);
            } else {
              // white to orange
              var tt=(t-0.5)*2;
              r=255;
              g=Math.round(255-tt*155);
              bl=Math.round(200-tt*200);
            }
            alpha=0.3+relFreq*0.65;
          } else if(a<p5){
            // Below p5 — blue, fading
            var dist=(p5-a)/Math.max(1,p5);
            r=30;g=80;bl=220;
            alpha=(1-dist)*relFreq*0.5;
          } else {
            // Above p95 — orange, fading
            var dist=(a-p95)/Math.max(1,DENSITY_BUCKETS-p95);
            r=255;g=120;bl=20;
            alpha=(1-dist)*relFreq*0.5;
          }

          ctx.fillStyle='rgba('+r+','+g+','+bl+','+alpha.toFixed(3)+')';
          ctx.fillRect(x, y, binW+0.3, h);
        }
      }
    }

    // ===== END DENSITY SPECTRUM =====

    /* HIER STANDEN detectInstruments UND renderInstruments, 172 Zeilen.
       Geloescht am 25.08.2026 (Caspar_D: "die Instrumenterkennungs-
       heuristik war scheisse und deswegen haben wir sie auch totgelegt
       und zum Loeschen vorgesehen"). BACKLOG 1.5 hatte sie stillgelegt,
       damals noch nach der alten Regel "abklemmen, nicht loeschen".

       WARUM SIE NICHT TAUGTE: Sie bewertete neun Instrumente mit
       Punktregeln ueber genau die Groessen, deren Karten wegen
       erwiesener Fehler verborgen sind (SA_TOT) - Centroid aus einem
       einzigen 43-ms-Fenster, Rolloff ueber Amplituden statt Leistung,
       Attack bei 297 von 321 Songs leer, Akkordrate als Rahmenflimmern,
       Inharmonizitaet mit einem Suchfenster von genau einem Bin,
       harmonische Dichte, die bei Rauschen 15,8 und bei einem reinen
       Sinus 5,0 meldet. Zwei Beispiele stehen in ANALYZER-REVIEW.md
       ausdruecklich: "if(inharmMed>0.03&&inharmMed<0.12) guitarScore+=2"
       entscheidet ueber Gitarre gegen Klavier gegen Synthesizer,
       obwohl die Groesse nur die Tonhoehenlage kennt; die harmonische
       Dichte verdreht die Entscheidung zwischen Schlagzeug, Orgel und
       Sinusflaechen. Aus falschen Zahlen kann keine Punktregel etwas
       Richtiges machen.

       Wer Instrumente wissen will, hat seit dem 24.08.2026 die
       Stem-Zerlegung: sechs getrennte Spuren mit gemessenen Anteilen
       statt geratener Punkte. */

    function redrawAllCharts(){
      /* NUR DIE SICHT, NICHT DER INHALT.

         Alle drei Aufrufer dieser Funktion sind Sichtwechsel: der
         Zoomregler, das Zuruecksetzen und das Mitwandern beim Abspielen.
         Die SVG-Spuren zeichnen aber in feste 0..SPUR_W-Koordinaten;
         ihren Ausschnitt setzt spurSichtSetzen() mit einem einzigen
         Attribut. Sie hier neu zu bauen hiess: sechzehn Reihen glaetten,
         sechzehn innerHTML schreiben, sechzehnmal Layout - fuer ein
         Bild, das danach genauso aussieht wie vorher.

         Gemessen an "Okkultation": 270-450 ms je Zoomschritt, unter Last
         ueber eine Sekunde. Beim Abspielen mit Zoom laeuft das zehnmal
         je Sekunde. Die Drosselung von gestern rettet nichts, wenn ein
         Durchlauf laenger dauert als der Abstand zum naechsten.

         Neu gebaut wird eine Spur dort, wo sich ihr INHALT aendert: wenn
         Daten aus dem Worker eintreffen, und wenn Profil oder
         Fensterlaenge umgestellt werden. Beides ist unten belegt - jede
         der sechs hier entfernten Zeichenfunktionen hat einen zweiten,
         datengetriebenen Aufrufer. Ohne den waere das Entfernen ein
         Verschwinden, kein Sparen. */
      spurSichtSetzen();
      if(!window._chartData)return;
      var d=window._chartData;
      if(d.energy){
        drawLufsHist(d.lufs);
      }
      if(d.fft){
        drawSpectrogramFromFrames(d.fft.frames,d.fft.numFrames,d.fft.fftSize,d.fft.sr,d.fft.dur);
        if(d.fft.stereoFrames){
          var sf=d.fft.stereoFrames instanceof Int8Array?d.fft.stereoFrames:new Int8Array(d.fft.stereoFrames.buffer||d.fft.stereoFrames);
          drawStereoSpectro(sf,d.fft.frames,d.fft.numFrames,d.fft.fftSize,d.fft.sr,d.fft.dur);
        }
        drawFluxFromFrames(d.fft.flux,d.fft.bandFlux,d.fft.dur);
      }
      /* Wellenform, Chroma, Stereo, Stimme und die Funken stehen nicht
         mehr hier - siehe die Begruendung am Kopf der Funktion. Die
         Funken sind ueberhaupt nie zoomabhaengig gewesen: sie zeigen
         immer den ganzen Song. */
    }

    // store all chart data for redraw
    window._chartData={};

    // playhead RAF — when zoomed, keep playhead at center and scroll view
    var lastPlayPos=-1, letzterSchub=0;
    ;
    function updatePlayheads(){
      requestAnimationFrame(updatePlayheads);
      if(!songDuration)return;
      updatePlayerUI();   /* uebernommen aus der frueheren rafProgress-Schleife */
      var pos=ZEIT()/songDuration;

      // auto-scroll when playing and zoomed
      /* Beim Abspielen mit Zoom wandert der Ausschnitt mit. Das rief
         bisher redrawAllCharts() in JEDEM Einzelbild auf - und das
         zeichnet siebzehn Flächen neu, darunter zwei Spektrogramme mit
         dreitausend Bildern. Gemessen: 215 ms Verzögerung im Median,
         348 ms schlimmstenfalls. So lange reagiert die Maus nicht.

         Jetzt höchstens zehnmal je Sekunde. Der Spielkopf selbst läuft
         weiter in voller Bildrate - er ist ein eigenes Element und
         kostet nichts. Sichtbar ist der Unterschied kaum, spürbar
         sofort. */
      if(zoomLevel>1&&LAEUFT()&&Math.abs(pos-lastPlayPos)>0.0001){
        var jetzt=performance.now();
        if(jetzt-letzterSchub>100){
          letzterSchub=jetzt;
          lastPlayPos=pos;
          centerViewOnPlayhead();
          redrawAllCharts();
        }
      }

      // playhead position within view
      var pct=viewEnd>viewStart?(pos-viewStart)/(viewEnd-viewStart):pos;
      pct=Math.max(0,Math.min(1,pct));

      phIds.forEach(function(id){
        var ph=document.getElementById('ph-'+id);
        var cid=id==='bpm'?'bpmcurve-canvas':id+'-canvas';
        var c=document.getElementById(cid);
        if(!c||!ph)return;
        ph.style.display='block';
        ph.style.left=Math.round(pct*c.offsetWidth)+'px';
      });
    }
    updatePlayheads();

    /* Hier stand fetchMeta() - 57 Zeilen, die die suno.com-Songseite
       herunterluden und mit regulaeren Ausdruecken durchsuchten. Der
       einzige Rufer war analyze(); seit dessen Ausbau am 25.08.2026 war
       die Funktion tot, und mit ihr faellt die letzte tote Fremdadresse
       dieses Weges (Review, bestaetigt). */

    /* ------------------------------------------------------------------
       ZUSATZ FÜR MYSUNO (nicht im Original, siehe docs/VISUALIZER.md)

       Zweiter Einstieg neben analyzeFile(): Der Ton wird
       über eine fertige Adresse geholt, etwa /media/<id>/audio.wav aus
       dem lokalen Archiv.

       Der Umweg über ein File-Objekt ist Absicht - so läuft analyzeFile()
       unverändert weiter, und damit auch dessen vollständiges Aufräumen,
       die Anzeige und der Aufruf der drei Analyseschritte. Ein eigener
       Pfad hätte all das verdoppelt.
       ------------------------------------------------------------------ */
    /* Liegt zu dieser ID eine vollstaendige Analyse? Der Server sagt
       es in einem Zug fuer alle - eine Anfrage statt 321. */
    var _ablageListe = null;
    async function ablageListeHolen(){
      if(_ablageListe) return _ablageListe;
      try{
        var r=await fetch('/api/analyse');
        _ablageListe = r.ok ? new Set((await r.json()).fertig) : new Set();
      }catch(e){ _ablageListe = new Set(); }
      return _ablageListe;
    }

    /* ==================================================================
       ABTASTWERTE NACHLADEN, WENN AUS DER ABLAGE GESPIELT WURDE.

       Die Ablage spielt die abgelegten Worker-Nachrichten ab und
       dekodiert das Audio gar nicht - das ist ja ihr Sinn (0,4 s statt
       16,9). Damit fehlen aber window._audioSamples, und das
       Notenzonen-Chroma faellt auf die alten Rechenfenster zurueck.
       Weil fast jeder Song abgelegt ist, kaeme die genaue Messung so
       nie zum Zug.

       Deshalb: erst das schnelle Bild aus der Ablage, dann im
       Hintergrund die Samples holen und die eine Bahn neu zeichnen, die
       sie braucht. Wer nur hinschaut, merkt nichts; wer genau hinsieht,
       bekommt die tonreine Messung nachgereicht. */
    async function abtastwerteNachladen(tonUrl){
      if(!tonUrl) return;
      /* WESSEN ABTASTWERTE LIEGEN DA? (Caspar_D, 25.08.2026: "das darf
         nicht sein, dass die weg ist")

         Hier stand bis heute nur die Frage, OB Werte vorliegen - nicht,
         zu welchem Song sie gehoeren. Beim Songwechsel in der offenen
         Buehne blieben die alten liegen, die Wache kehrte um, und
         drawMainWaveform() wurde nie erreicht: Der Analyzer baut sein
         Markup bei jedem Aufbau neu, die Wellenformflaeche war also
         frisch und leer und blieb es. Sichtbar wurde es an Moissanit
         (4:14), in dessen Anzeige 4:37 Abtastwerte des Vorgaengers
         lagen. Nur der erste Song nach dem Seitenladen hatte deshalb
         eine Gesamthuellkurve.

         Jetzt traegt der Vorrat den Namen seines Songs. Gehoert er zum
         laufenden, wird nicht neu geladen - aber gezeichnet, denn die
         Flaeche kann trotzdem neu und leer sein. */
      if(window._audioSamples && window._audioSamples.length
         && window._audioSamplesFuer === _laufendeId){
        if(typeof drawMainWaveform==='function') drawMainWaveform();
        return;
      }
      try{
        var ab=await (await fetch(tonUrl)).arrayBuffer();
        var ctx2=new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,1,44100);
        var dec=await ctx2.decodeAudioData(ab);
        window._audioSamples=new Float32Array(dec.getChannelData(0));
        window._audioSamplesFuer=_laufendeId;
        window._audioSR=dec.sampleRate;
        try{ ctx2.close(); }catch(e){}
        var d=window._chartData;
        if(d && d.fft && d.fft.chroma){
          var fertig=await chromaZonenHolen(_laufendeId);
          if(fertig){ chromaZonenZeichnen(fertig, d.fft.dur); }
          else {
            /* Dieselbe Ansage wie in chromaTaktBereitZeichnen (25.08.2026):
               ohne Zonen kein Notlauf und kein Bild. */
            var rz=document.getElementById('spur-chroma-takt');
            if(rz) rz.style.display='none';
          }
        }
        if(typeof drawMainWaveform==='function') drawMainWaveform();
      }catch(e){ console.warn('Abtastwerte nicht nachladbar:', e.message); }
    }

    async function ablageSpielenOderRechnen(d){
      var id=d.id;
      if(id){
        var liste=await ablageListeHolen();
        if(liste.has(id)){
          try{
            var ok=await ablageSpielen(id, d);
            if(ok){ abtastwerteNachladen(d.tonUrl); return; }
          }catch(e){
            /* Mit Stapel, nicht nur mit Text: Beim Bauen habe ich
               dreimal geraten, welches Feld null ist. Der Stapel sagt
               es in einer Zeile. */
            console.warn('Ablage nicht lesbar, wird gerechnet:', e.message,
              (e.stack||'').split('\n').slice(0,3).join(' | '));
            window._ablageFehler=e.stack;
          }
        }
      }
      return analyzeUrl(d.tonUrl, d.titel, null);
    }

    /* Einen abgelegten Lauf abspielen. Es ist DERSELBE Weg wie beim
       Rechnen - nachrichtVerarbeiten() bekommt dieselben Nachrichten,
       nur aus einer Datei statt aus dem Worker. */
    async function ablageSpielen(id, d){
      var t0=performance.now();
      var r=await fetch('/analyse/'+id+'.bin');
      if(!r.ok) return false;
      var kopf=ablageEntpacken(await r.arrayBuffer());
      if(!kopf) return false;

      /* Die beiden Spektrogramme kommen als Bild und werden als fertiger
         Puffer eingesetzt, BEVOR gezeichnet wird. Der Stand muss der
         Bildzahl entsprechen, sonst baut pufferFlaeche() neu - und ohne
         die Rohbilder kaeme dabei nichts heraus. */
      /* Die Nachricht heisst 'fft_partial', nicht 'fft' - auch die
         letzte Runde traegt diesen Namen und unterscheidet sich nur
         durch isFinal. Ich hatte auf 'fft' geprueft; damit blieb
         bildzahl null, die beiden Bilder wurden nie geladen, und die
         Spektrogramme blieben leer, waehrend alles andere stand. Der
         Name stand die ganze Zeit in meiner eigenen Messung
         ("Arten: norm, scalars, ..., fft_partial") - ich habe ihn
         gelesen und nicht verbunden. */
      var bildzahl=null;
      for(var i=0;i<kopf.nachrichten.length;i++)
        if(/^fft/.test(kopf.nachrichten[i].type||'')) bildzahl=kopf.nachrichten[i].numFrames;
      if(bildzahl!=null){
        /* Zwei Endungen, eine Bedeutung. Der Browser schreibt WebP
           (canvas.toBlob kann das), Node schreibt PNG - das ffmpeg auf
           diesem Rechner hat keinen WebP-Encoder. Welches Format
           dasteht, ist dem Bild egal; createImageBitmap liest beide. */
        /* Die letzten beiden kamen am 25.08.2026 dazu (vier Register).
           Wer vorher gerechnet wurde, hat sie noch nicht - deshalb sind
           sie NICHT Bedingung: fehlen sie, wird ihre Lasche schlicht
           nicht gezeigt. node bin/vorrechnen.js --nur-bilder holt sie
           nach. */
        var paare=[['spectro','spektro',true],['stereospectro','stereo',true],
                   ['rechtsspectro','rechts',false],['summespectro','summe',false]];
        for(var j=0;j<paare.length;j++){
          var b=null;
          for(var e=0;e<2;e++){
            var versuch=await fetch('/analyse/'+id+'.'+paare[j][1]+(e?'.png':'.webp'));
            if(versuch.ok){ b=versuch; break; }
          }
          if(!b){ if(paare[j][2]) return false; else continue; }
          await pufferAusBild(paare[j][0], await b.blob(), Math.min(bildzahl, PUFFER_MAX));
        }
      }

      /* DER KOPF KOMMT NICHT AUS DER ABLAGE, SONDERN AUS DEM KATALOG.

         kopfFuellen() steht in analyzeFile() - und den ueberspringt
         dieser Weg gerade. Ohne den Aufruf blieben Plays, Likes,
         Kommentare, Alter und Modell leer, waehrend alle gemessenen
         Werte dastanden: Der Song sah aus, als haette er keine
         Katalogdaten. (Caspar_D, 19.08.2026.)

         Gespeichert werden diese Felder ausdruecklich NICHT - sie
         aendern sich mit jedem Sammellauf, die Messung nicht. Sie
         gehoeren beim Anzeigen frisch aus dem Katalog geholt. */
      /* Jetzt stehen die Puffer - erst hier weiss man, welche der vier
         Laschen ueberhaupt ein Bild hat. */
      spektroLaschenPruefen();

      if(_katalogDaten) kopfFuellen(_katalogDaten);

      /* Denselben Zustand herstellen, den startWorkerAnalysis setzt. */
      songDuration=kopf.dauer; currentSR=kopf.sr;
      _aufnahme={ id:id, nachrichten:kopf.nachrichten, fertig:true,
                  sr:kopf.sr, dauer:kopf.dauer, ausAblage:true };
      drawSpectrum({sampleRate:kopf.sr}, 'freq-canvas');

      for(var n=0;n<kopf.nachrichten.length;n++)
        nachrichtVerarbeiten(kopf.nachrichten[n], false);

      return true;
    }

    /* Nach getaner Rechnung ablegen. Laeuft im Hintergrund; schlaegt es
       fehl, ist nichts verloren - beim naechsten Mal wird eben wieder
       gerechnet. */
    /* WANN IST ES SO WEIT?

       Der erste Versuch schrieb 1,5 s nach der Schlussnachricht. Das
       ging schief, und zwar lautlos: Die Schlussnachricht kommt aus dem
       Rechenkern, die Spektrogramm-Puffer entstehen aber erst beim
       ZEICHNEN der FFT-Nachricht - und das dauert acht Sekunden. Wer
       eine feste Frist setzt, rät.

       Deshalb wird an beiden Enden angeklopft: nach der Schlussnachricht
       und nach dem Zeichnen der Spektrogramme. Wer zuletzt kommt, findet
       alles vor; der andere geht leer wieder. Ein Merker verhindert,
       dass zweimal geschrieben wird. */
    var _ablageLaeuft=false;
    /* Eine Spur, kein Rateraum. Beim Bauen habe ich dreimal vermutet,
       warum nichts geschrieben wird - jede Vermutung war falsch. Die
       Spur steht dauerhaft drin: Sie kostet nichts und beantwortet die
       Frage in einem Blick. */
    function spur(was){ (window._ablageSpur=window._ablageSpur||[]).push(was); }

    function ablageVielleichtSchreiben(){
      var auf=_aufnahme, pf=window._pufferFlaechen;
      if(_ablageLaeuft) return spur('laeuft schon');
      if(!auf) return spur('keine Aufnahme');
      if(!auf.fertig) return spur('noch nicht fertig');
      if(!auf.id) return spur('ohne ID');
      if(auf.ausAblage) return spur('kam aus der Ablage');
      if(auf.abgelegt) return spur('schon abgelegt');
      if(!pf || !pf.spectro || !pf.stereospectro) return spur('Puffer fehlen');
      _ablageLaeuft=true;
      spur('los');
      ablageSchreiben().then(function(){ _ablageLaeuft=false; spur('durch'); },
                            function(e){ _ablageLaeuft=false; spur('Absturz: '+e.message); });
    }

    async function ablageSchreiben(){
      var auf=_aufnahme;
      if(!auf||!auf.fertig||!auf.id||auf.ausAblage) return;
      var pf=window._pufferFlaechen;
      if(!pf||!pf.spectro||!pf.stereospectro) return;
      try{
        var hoch=async function(endung, blob){
          spur('sende '+endung+' '+Math.round(blob.size/1024)+' KB');
          var r=await fetch('/analyse/'+auf.id+'.'+endung, {method:'PUT', body:blob});
          spur(endung+' -> '+r.status);
          if(!r.ok) throw new Error(endung+': '+r.status);
        };
        var paket=ablageVerpacken(auf);
        /* Die Groesse gehoert in die Meldung, nicht in die Vermutung.
           Zweimal habe ich hier geraten, warum der Server 413 sagt. */
        window._ablageGroesse={ bin:paket.size, arten:auf.nachrichten.map(function(m){return m.type;}) };
        await hoch('bin', paket);
        var alsWebp=function(canvas){ return new Promise(function(f){
          canvas.toBlob(f,'image/webp',0.92); }); };
        await hoch('spektro.webp', await alsWebp(pf.spectro.stufen[0]));
        await hoch('stereo.webp',  await alsWebp(pf.stereospectro.stufen[0]));
        if(_ablageListe) _ablageListe.add(auf.id);
        auf.abgelegt=true;
      }catch(e){ console.warn('Ablage nicht geschrieben:', e.message,
        window._ablageGroesse ? Math.round(window._ablageGroesse.bin/1048576)+' MB, Arten: '
          +window._ablageGroesse.arten.join(',') : ''); }
    }

    async function analyzeUrl(src, titel, bild){
      /* Benennen, bevor gerechnet wird. Ohne das stünde hier eine
         namenlose Analyse - analyzeFile() schreibt zwar einen Namen, aber
         in Elemente (#song-title, #song-sub), die es in dieser Fassung
         gar nicht gibt. Gefüllt wird stattdessen die Titelzeile
         (#title, #meta, #meta-sub), die den Ausbau vom 25.08.2026
         überlebt hat. Die übrigen Felder bleiben leer statt falsch. */
      if(titel){
        var mEl = document.getElementById('meta');
        var tEl = document.getElementById('title');
        var sEl = document.getElementById('meta-sub');
        if(mEl) mEl.style.display = 'block';
        if(tEl) tEl.textContent = titel;
        if(sEl) sEl.textContent = 'aus dem lokalen Archiv';
      }
      if(bild){
        var aEl = document.getElementById('artwork');
        if(aEl){
          aEl.src = bild; aEl.style.display = 'block';
          aEl.onload = function(){
            var ml = document.getElementById('meta-left');
            if(ml) document.getElementById('meta').style.setProperty('--meta-left-h', ml.offsetHeight + 'px');
          };
        }
      }
      try{
        var resp = await fetch(src);
        if(!resp.ok){ console.warn('Audio nicht erreichbar (' + resp.status + ')'); return; }
        var blob = await resp.blob();
        var name = titel || decodeURIComponent(src.split('/').pop());
        /* Der Typ muss stimmen: Ein Blob mit application/octet-stream
           spielt im <audio> nicht zuverlässig. Deshalb wird er notfalls
           aus der Endung abgeleitet statt vom Server übernommen. */
        var typ = blob.type;
        if(!typ || typ === 'application/octet-stream')
          typ = /\.wav(\?|$)/i.test(src) ? 'audio/wav' : 'audio/mpeg';
        var file = new File([blob], name, {type: typ});
        await analyzeFile({files:[file]});
      }catch(e){ console.error(e); }
    }

    async function analyzeFile(input){
      if(!input.files||!input.files[0])return;
      var file=input.files[0];
      /* Fuer die Hoehenkante: aus einem MP3 gemessen ist sie die
         Encoderkante, nicht die des Modells. Der Ablageweg setzt das
         Feld auf null - die Ablage traegt ihre Quelle (noch) nicht. */

      // aufraeumen vor jeder neuen Analyse
      if(window._activeWorker){window._activeWorker.terminate();window._activeWorker=null;}
      window._chartData={};
      window._attackComputed=false;
      songDuration=0;zoomLevel=1;viewStart=0;viewEnd=1;window._spectroPerc=null;window._stereoP95=null;
      _densityHist=null;_densityMaxCount=0;_densityAnalyser=null;
      document.getElementById('zoom-slider').value=0;
      document.getElementById('zoom-label').textContent='1×';
      liveSpektrumLoesen();

      // reset cards
      ['v-plays','v-likes','v-comments','v-ratio','v-age','v-ppd','v-model',
       'v-dur','v-loud','v-dyn','v-key','v-stereo',
       'v-entropy','v-symmetry','v-vocal'].forEach(function(id){
        var el=document.getElementById(id);if(el)el.textContent='—';
      });
      document.getElementById('tags').innerHTML='';
      document.querySelectorAll('canvas.chart-ready').forEach(function(c){
        c.classList.remove('chart-ready');c.classList.add('chart-pending');
        var ctx=c.getContext('2d');if(ctx)ctx.clearRect(0,0,c.width,c.height);
      });


      /* Ab hier ist zurückgesetzt - jetzt darf der Kopf gefüllt werden. */
      if(_katalogDaten) kopfFuellen(_katalogDaten);

      try{
        var arrayBuf=await file.arrayBuffer();
        if(!audioCtx||audioCtx.state==='closed')audioCtx=new(window.AudioContext||window.webkitAudioContext)();
        if(audioCtx.state==='suspended')await audioCtx.resume();
        var buf=await audioCtx.decodeAudioData(arrayBuf.slice(0));
        document.getElementById('v-dur').textContent=fmt(buf.duration);
        startWorkerAnalysis(buf);
        /* Ausgebaut (Caspar_D, 25.08.2026): Instrumenterkennung
           (Essentia) und Stem-Trennung (Demucs) sind geloescht -
           stillgelegt waren sie seit dem 18.08., jetzt ist der Code weg.
           Damit ist der Analyzer endgueltig netzfrei: keine einzige
           Fremdadresse mehr. Die Einzelspuren im Befund kommen aus dem
           Trennlauf (bin/stems.js), nicht von hier. */
      }catch(e){
        console.error(e);
      }
    }


    function startWorkerAnalysis(buf){
      /* Dauer und Abtastrate hier setzen, nicht beim Aufrufer.

         Im Original tat das nur der Suno-Weg (analyze(), am 25.08.2026
         ausgebaut). analyzeFile() setzte allein die ANZEIGE der
         Dauer, nicht songDuration selbst. Auf diesem Weg, und das ist
         genau der von KlangTresor, blieben damit alle 17 Spielköpfe und der
         Zoom tot: Beide brechen bei songDuration === 0 sofort ab.
         Aufgefallen erst, als der Spielkopf an einer fremden Uhr
         hängen sollte - abgespielt hatte auf diesem Weg nie jemand. */
      songDuration=buf.duration;
      currentSR=buf.sampleRate;
      _aufnahme={ id:_laufendeId, nachrichten:[], fertig:false,
                  sr:buf.sampleRate, dauer:buf.duration };
      /* Und dieselbe Lücke ein zweites Mal: Die Abtastwerte für die
         Wellenform setzte ebenfalls nur der Suno-Weg. Auf dem Dateiweg
         brach drawMainWaveform() deshalb sofort ab und die Wellenform
         blieb leer - genau die Anzeige, an der der Spielkopf hängt. */
      window._audioSamples=new Float32Array(buf.getChannelData(0));
      window._audioSamplesFuer=_laufendeId;
      window._audioSR=buf.sampleRate;
      drawMainWaveform();

      /* Und dieselbe Luecke ein DRITTES Mal, gefunden am 19.08.2026:
         Das Live-Spektrum richtete allein der Suno-Weg ein. Auf dem
         Katalogweg wurde drawSpectrum() nie gerufen, die Flaeche blieb
         in ihrer Voreinstellung von 300x150 stehen und war schwarz.

         Es ist jedes Mal dieselbe Ursache: Der Suno-Weg war der erste,
         und wer dort etwas einbaut, sieht den Dateiweg nicht. Deshalb
         steht es jetzt hier - an der Stelle, an der BEIDE Wege
         durchkommen. Wer kuenftig etwas ergaenzt, das den dekodierten
         Puffer braucht, setzt es hierher - in startWorkerAnalysis(). */
      drawSpectrum(buf,'freq-canvas');

      var ch0=buf.getChannelData(0);
      var ch1=buf.numberOfChannels>1?buf.getChannelData(1):ch0;
      var sr=buf.sampleRate;

      // copy to transferable
      var left=new Float32Array(ch0);
      var right=new Float32Array(ch1);

      /* Der Rechenkern liegt seit dem 18.08.2026 als eigene Datei daneben,
         damit Node dasselbe rechnen kann wie der Browser. Der Ort ist
         überschreibbar, falls das Modul einmal woanders eingebunden wird. */
      var worker=new Worker(OPT.workerUrl || '/fremd/analyzer-worker.js');
      window._activeWorker=worker;

      worker.onmessage=function(e){ nachrichtVerarbeiten(e.data, true); };
      worker.postMessage({left:left,right:right,sr:sr},[left.buffer,right.buffer]);
    }

    /* ==================================================================
    /* Format UND Bildmathematik liegen als eigene Datei daneben:
       web/fremd/analyse-ablage.js. Node braucht beides fuer dieselben
       Dateien (bin/vorrechnen.js). Zwei Fassungen desselben Verfahrens
       waeren derselbe Fehler, den der Rechenkern schon einmal hatte.

       Von dort: ablageVerpacken, ablageEntpacken, baenderJeZeile,
       spektroBildFuellen, stereoBildFuellen, AMP. */
    /* Ein Puffer aus einem geladenen Bild - statt ihn zu rechnen.
       pufferFlaeche() gibt einen vorhandenen Eintrag zurueck, wenn
       Schluessel, Masse UND Stand stimmen. Wer hier einsetzt, bevor
       gezeichnet wird, spart den ganzen Aufbau. */
    async function pufferAusBild(schluessel, blob, stand){
      var bild=await createImageBitmap(blob);
      var buf=document.createElement('canvas');
      buf.width=bild.width; buf.height=bild.height;
      buf.getContext('2d').drawImage(bild,0,0);
      var stufen=[buf], breite=bild.width;
      while(breite>512){
        breite=Math.floor(breite/2);
        var klein=document.createElement('canvas');
        klein.width=breite; klein.height=bild.height;
        var kctx=klein.getContext('2d');
        kctx.imageSmoothingEnabled=true;
        kctx.drawImage(stufen[stufen.length-1],0,0,breite,bild.height);
        stufen.push(klein);
      }
      var alle=window._pufferFlaechen=window._pufferFlaechen||{};
      alle[schluessel]={stufen:stufen, spalten:bild.width, hoehe:bild.height, stand:stand};
    }

    /* ------------------------------------------------------------------
       EINE NACHRICHT DES RECHENKERNS VERARBEITEN.

       Stand bis zum 19.08.2026 als anonyme Funktion am Worker und war
       damit nur EINMAL erreichbar: waehrend gerechnet wurde. Wer den
       Analysemodus verliess und zurueckkam, musste den ganzen Song neu
       rechnen lassen - gemessen zwanzig bis fuenfundzwanzig Sekunden
       fuer etwas, das schon dagewesen war.

       Jetzt hat sie einen Namen, und die Nachrichten werden mitgeschnitten.
       Beim zweiten Aufruf desselben Songs wird der Mitschnitt durch
       dieselbe Funktion GESPIELT statt neu gerechnet. Das ist der
       entscheidende Punkt: Es gibt keinen zweiten Zeichenweg, der
       auseinanderlaufen koennte - es ist derselbe, nur mit
       aufgezeichneten Nachrichten.

       'live' unterscheidet die beiden Faelle: Nur was vom Worker kommt,
       wird aufgezeichnet. Ohne das schriebe sich der Mitschnitt beim
       Abspielen selbst noch einmal.
       ------------------------------------------------------------------ */
    function nachrichtVerarbeiten(msg, live){
      if(live && _aufnahme.nachrichten){
        /* JE ART NUR DIE LETZTE.

           Der Rechenkern schickt in Runden - fuenf FFT-Durchgaenge mit
           wachsender Aufloesung, jeder mit einem vollstaendigen Satz
           Kurven. Wer alle aufhebt, hebt dieselbe Kurve fuenfmal auf;
           der erste Versuch scheiterte am Server mit 413.

           Fuers Abspielen ist nur die letzte gemeint: Jede Runde
           ueberschreibt die vorige, und die Zeichenfunktionen sind je
           Art wiederholbar. 'progress' wird gar nicht aufgehoben - es
           sagt nur, wie weit es ist. */
        if(msg.type!=='progress'){
          var vorher=-1;
          for(var ai=0;ai<_aufnahme.nachrichten.length;ai++)
            if(_aufnahme.nachrichten[ai].type===msg.type) vorher=ai;
          if(vorher>=0) _aufnahme.nachrichten[vorher]=msg;
          else _aufnahme.nachrichten.push(msg);
        }
      }
      var sr=currentSR;
        switch(msg.type){
          case 'progress':
            (window._phasen=window._phasen||[]).push([msg.label, Date.now()]);
            // dim completed sections, highlight active
            var pct=msg.pct;
            document.querySelectorAll('.slbl').forEach(function(el){
              var sp=el.querySelector('.section-status');
              if(!sp){sp=document.createElement('span');sp.className='section-status';el.appendChild(sp);}
              // mark sections as done based on progress thresholds
              var done=false;
              var txt=el.textContent;
              if(txt.indexOf('Struktur')>=0)done=pct>60;
              else if(txt.indexOf('Lautheit')>=0||txt.indexOf('Energie')>=0||txt.indexOf('Dynamik')>=0||txt.indexOf('Impuls')>=0)done=pct>45;
              else if(txt.indexOf('Tempo')>=0)done=pct>52;
              else if(txt.indexOf('Stereo')>=0&&txt.indexOf('Spektro')<0)done=pct>57;
              else done=pct>=100;
              sp.textContent=done?'✓':'';
              sp.style.color=done?'#14b055':'#444';
            });
            break;
          case 'scalars':
            document.getElementById('v-loud').textContent=msg.loudness.toFixed(1);
            document.getElementById('v-dyn').textContent=msg.dynamic.toFixed(1);
            document.getElementById('v-stereo').textContent=(msg.stereoWidth*100).toFixed(0)+'%';
            updateGauge('loud',msg.loudness);
            updateGauge('dyn',msg.dynamic);
            updateGauge('stereo',msg.stereoWidth*100);
            break;
          case 'norm': {
            var setzN=function(id,txt){var el=document.getElementById(id);if(el)el.textContent=txt;};
            setzN('v-lufs', msg.lufs.toFixed(1));
            setzN('v-lra',  msg.lra.toFixed(1));
            setzN('v-tp',   (msg.truePeak>0?'+':'')+msg.truePeak.toFixed(1));
            setzN('v-plr',  (msg.truePeak-msg.lufs).toFixed(1));
            /* PSR (AES TD1004): True Peak minus Maximum der KURZZEIT-
               Lautheit - die Luft am lautesten Moment, nicht am
               Durchschnitt. Unterscheidet "insgesamt leise, aber
               totkomprimierte Refrains" von "wirklich dynamisch". Alte
               Ablagen tragen kurzMax als NaN (die geheilte Falle im
               Worker) - dann wird das Maximum hier NaN-sicher aus der
               Kurve geholt, die in jeder Ablage liegt: die Karte
               funktioniert damit sofort fuer den ganzen Bestand. */
            (function(){
              var kMax=msg.kurzMax;
              if(!isFinite(kMax)&&msg.kurz&&msg.kurz.length){
                kMax=-100;
                for(var i=0;i<msg.kurz.length;i++)
                  if(isFinite(msg.kurz[i])&&msg.kurz[i]>kMax) kMax=msg.kurz[i];
              }
              setzN('v-psr', isFinite(kMax)&&kMax>-100 ? (msg.truePeak-kMax).toFixed(1) : '—');
            })();
            setzN('v-clip', msg.clip ? msg.clip.toLocaleString('de-DE') : '0');
            setzN('v-dc',   msg.dc<0.0002 ? '0' : (msg.dc*100).toFixed(2)+'%');
            setzN('v-korr', msg.korr.toFixed(2)+(msg.negPhase>1?' ('+msg.negPhase.toFixed(0)+'% neg)':''));
            setzN('v-ende', msg.endeDb>-12 ? 'abrupt' : 'klingt aus');
            /* DER GESUNDHEITSCHECK (Caspar_D, 25.08.2026: "alles gruen =
               ein Haekchen, nur Auffaelliges wird gross"). Drei rein
               technische Pruefungen - Anschlaege, Gleichspannung,
               Phasenausloeschung - sagen im Normalfall alle dasselbe:
               nichts los. Drei Zeilen "nichts los" sind Laerm. Deshalb
               buendelt eine Karte das Ergebnis, und die Einzelkarten
               erscheinen nur, wenn ihre Pruefung anschlaegt.

               "Ende abrupt" gehoert absichtlich NICHT dazu: Suno schneidet
               oft hart ab, das ist eine musikalische Auskunft und kein
               technischer Fehler - die Karte bleibt eigenstaendig.

               Alte Ablagen kennen clipLauf nicht (undefined): dann zaehlt
               wie frueher jeder Einzelwert als Verdacht - streng statt
               faelschlich entwarnend. */
            (function(){
              var clipSchlecht = msg.clipLauf!==undefined ? msg.clipLauf>0 : msg.clip>0;
              var dcSchlecht   = msg.dc>=0.005;
              var korrSchlecht = msg.negPhase>5;
              var zeig=function(id,an){var el=document.getElementById(id);
                var ka=el&&(el.closest('.card')||el.parentElement);
                if(ka) ka.style.display=an?'':'none';};
              zeig('v-clip', clipSchlecht);
              zeig('v-dc',   dcSchlecht);
              zeig('v-korr', korrSchlecht);
              var punkte=[];
              if(clipSchlecht) punkte.push('übersteuert');
              if(dcSchlecht)   punkte.push('Welle sitzt schief');
              if(korrSchlecht) punkte.push('Stereo löscht sich stellenweise');
              var ck=document.getElementById('v-check');
              if(ck){
                ck.textContent = punkte.length ? '⚠' : '✓';
                ck.style.color = punkte.length ? AMPEL[clipSchlecht?2:1] : AMPEL[0];
                var kl=ck.parentElement.querySelector('.lbl');
                if(kl) kl.innerHTML = punkte.length
                  ? punkte.join(' · ')
                  : 'Technisch sauber? <i>Anschläge · Gleichspannung · Phase</i>';
              }
            })();
            window._chartData.momentan=msg.momentan;
            window._chartData.kurz=msg.kurz;
            /* DIE HOEHENKANTE (25.08.2026): Frequenz plus Charakter.
               "scharf" ab 20 dB/kHz heisst Schnitt (Codec oder Modell),
               "weich" heisst natuerliches Auslaufen. Aus einem MP3
               gemessen traegt der Wert die Encoderkante des MP3s, nicht
               die des Modells - das steht dann dabei. Alte Ablagen ohne
               kanteHz lassen die Karte leer; leereKartenAus verbirgt
               sie dann (nicht gerechnet = nicht da). */
            /* Der MP3-Vermerk stand hier bis zum 26.08.2026 und war tot:
               Er prüfte window._quellname auf die Endung .mp3, aber der
               Bühnenweg setzt dort den SONGTITEL ein, nie einen
               Dateinamen (Zeile 5226). Ein Dateifeld zum Hineinziehen
               gibt es seit dem Ausbau der Standalone-Reste nicht mehr
               (Caspar_D, 26.08.2026: „man kann keine Datei mehr in den
               Analyzer ziehen"), und gemessen wird ohnehin nur noch aus
               der WAV. Woraus eine Ablage stammt, steht seit dem
               26.08. in ihrem Kopf: das Feld `quelle`. */
            if(isFinite(msg.kanteHz)){
              setzN('v-grenz', (msg.kanteHz/1000).toFixed(1)+' kHz · '
                +(msg.kanteSteil>=20?'scharf':'weich'));
            } else setzN('v-grenz','—');
            window._normwerte=msg;
            befundeZeigen(msg);
            korrSpurZeichnen(msg);
            leereKartenNachlauf();             /* Karten ohne Wert verschwinden - erst, wenn alles da ist */
            lautheitSpurenZeichnen();
            funkenZeichnen();
            /* Das Warnband ueber dem Spektrogramm kommt aus DIESER
               Nachricht. Trifft sie nach der FFT ein, ist das Bild
               schon gemalt und wuesste nichts davon - also einmal neu.
               Billig: pufferFlaeche haelt den fertigen Puffer, neu
               gezeichnet wird nur der Ausschnitt und die Beschriftung.
               (Derselbe Griff wie bei der Befundspur, die auf die
               Struktur-Nachricht wartet.) */
            if(window._chartData&&window._chartData.fft){
              var fd=window._chartData.fft;
              drawSpectrogramFromFrames(fd.frames,fd.numFrames,fd.fftSize,fd.sr,fd.dur);
            }
            linienSpurenZeichnen();
            break;
          }
          case 'structure':
            /* Die Abschnitte sind der Untergrund der Befundspur - und
               diese Nachricht kommt NACH der Normnachricht. Ohne das
               Neuzeichnen bliebe der Untergrund leer, bis irgendetwas
               anderes die Befunde neu aufbaut (etwa ein Laschenklick).
               Derselbe Fallstrick wie bei der Dauer: Was die Befunde
               brauchen, trifft in mehreren Nachrichten nacheinander
               ein. */
            /* window._struktur stand hier - gesetzt, aber nirgends im
               Projekt gelesen (25.08.2026, Review). Der Neuaufruf darunter
               ist das Wirksame. */
            if(window._normwerte) befundeZeigen(window._normwerte);
            break;
          case 'envelope':
            window._chartData.energy=msg.energy;window._chartData.lufs=msg.lufs;
            window._chartData.crest=msg.crest;window._chartData.onsets=msg.onsets;
            window._chartData.dur=msg.dur;window._chartData.sr=sr;
            /* Die Dauer-Karte wurde nur im Frischanalyse-Weg gefüllt
               (aus buf.duration) - beim Abspielen aus der Ablage blieb
               sie auf "—" stehen, obwohl die Zahl in der Nachricht
               steht (25.08.2026). */
            if(isFinite(msg.dur)){ var dEl=document.getElementById('v-dur');
              if(dEl && (!dEl.textContent || dEl.textContent==='—')) dEl.textContent=fmt(msg.dur); }
            huellkurveNachtragen();   /* die Bahn stand schon, bevor die Energie kam */
            drawLufsHist(msg.lufs);   /* drawEnvelope war nur noch diese eine Zeile (Rest 25.08. ausgebaut) */
            /* Die Reihen sind erst HIER da. Beim Zeichnen der großen
               Diagramme war _chartData noch leer - deshalb blieben die
               Sparklines beim ersten Versuch aus. */
            funkenZeichnen();
            linienSpurenZeichnen();
            // compute attack time immediately when energy arrives
            if(!window._attackComputed&&msg.energy&&msg.energy.length>10){
              var eArr=Array.from(msg.energy);
              var pk=0;for(var i=0;i<eArr.length;i++){if(eArr[i]>pk)pk=eArr[i];}
              if(pk>0){
                var sf=0;for(var i=0;i<eArr.length;i++){if(eArr[i]>pk*0.01){sf=i;break;}}
                var t10=-1,t90=-1;
                for(var i=sf;i<Math.min(sf+400,eArr.length);i++){
                  if(t10<0&&eArr[i]>=pk*0.1)t10=i;
                  if(t10>=0&&t90<0&&eArr[i]>=pk*0.9){t90=i;break;}
                }
                if(t10>=0&&t90>t10){
                  var ams=Math.round((t90-t10)*50);
                  window._attackComputed=true;
                }
              }
            }
            break;
          /* 'bpm_curve' gibt es nicht mehr - die eigene Temposchaetzung
             ist am 25.08.2026 ausgebaut. Sie nahm den hoechsten
             Autokorrelationsgipfel ohne Pruefung auf halbes oder
             doppeltes Tempo; das Tempo kommt aus Sunos Schlagraster.
             Alte Ablagen tragen die Nachricht noch und laufen jetzt
             durch den default-Zweig. */
          /* 'vocal_analysis' gibt es nicht mehr - die alte Stimmerkennung
             ist am 25.08.2026 aus dem Rechenkern ausgebaut worden. Sie
             mass den Mix statt der Stimme; der Ersatz steht in
             bin/toene.js (YIN auf dem getrennten vocals-Stem). Alte
             Ablagen tragen die Nachricht noch - sie laeuft jetzt
             durch den default-Zweig und wird ignoriert. */
          case 'stereo_curve':
            window._chartData.lBands=msg.lBands;
            window._chartData.rBands=msg.rBands;
            window._chartData.energyP95=msg.energyP95;
            window._chartData.dur=msg.dur;
            stereoSpurZeichnen(msg.lBands,msg.rBands,msg.dur);break;
          case 'fft_partial':
            /* NICHT die Tonart aus fft_partial auf die Karte schreiben.
               Sie stand hier und ueberschrieb die richtige aus 'scalars'
               - und in 298 von 321 abgelegten Songs traegt fft_partial
               noch das alte 'F# Dur' (Bin-Raster-Artefakt, repariert am
               19.08.2026). Die eine Stelle, die die Karte schreibt, ist
               der scalars-Zweig. Der Kern reicht die Tonart in
               fft_partial zwar inzwischen richtig weiter, aber eine
               zweite Schreibstelle ist eine zweite Fehlerquelle. */
            // vocal card updated by drawVocalCurve via classifyVoice
            window._chartData.fft={frames:msg.frames,stereoFrames:msg.stereoFrames,numFrames:msg.numFrames,fftSize:msg.fftSize,sr:sr,dur:msg.dur,flux:msg.flux,bandFlux:msg.bandFlux,chroma:msg.chroma,entropy:msg.entropy};
            funkenZeichnen();
            linienSpurenZeichnen();
            /* Der fruehere sechste Parameter (numFramesFull) war ein
               liegengebliebener Fixversuch fuers selbe Problem - die
               Funktion hat ihn nie gelesen. Die Spaltenzahl bestimmt
               sie jetzt selbst aus dem Array. */
            drawSpectrogramFromFrames(msg.frames,msg.numFrames,msg.fftSize,sr,msg.dur);
            /* Auch OHNE Rohdaten aufrufen: Beim Abspielen aus der
               Ablage gibt es keine stereoFrames, wohl aber das fertige
               Bild - und die Zeichenfunktion nimmt dann den Weg "nur
               zeigen". Die alte Bedingung sprang genau dann ab, wenn
               es etwas zu zeigen gab; das Hauptspektrogramm stand
               deshalb, das Stereobild blieb schwarz. */
            var sf=null;
            if(msg.stereoFrames)
              sf=msg.stereoFrames instanceof Int8Array?msg.stereoFrames:new Int8Array(msg.stereoFrames.buffer||msg.stereoFrames);
            drawStereoSpectro(sf,msg.frames,msg.numFrames,msg.fftSize,sr,msg.dur);
            drawFluxFromFrames(msg.flux,msg.bandFlux,msg.dur);
            chromaSpurZeichnen(msg.chroma,msg.dur);
            chromaTaktBereitZeichnen(msg.chroma, msg.dur,
              (_katalogDaten&&_katalogDaten.schlaege)||null,
              (_katalogDaten&&_katalogDaten.tonUrl)||null, _laufendeId);
            if(msg.noteStab){
              // only average non-zero values (zero = no pitch detected)
              var stabArr=Array.from(msg.noteStab).filter(function(v){return v>0;});
              if(stabArr.length>0){
                var meanStab=stabArr.reduce(function(a,b){return a+b;},0)/stabArr.length;
                var stabPct=Math.round(meanStab*100);
              }
            }
            // update scalar cards from FFT
            if(msg.scalars){
              var sc=msg.scalars;
              if(sc.entropy!==undefined){var ev=sc.entropy*100;document.getElementById('v-entropy').textContent=ev.toFixed(0)+'%';updateGauge('entropy',ev);}
              // texture index
              var harm=window._chartData.fft&&window._chartData.fft.harm?Array.from(window._chartData.fft.harm):[];
              var meanHarm=harm.length?harm.reduce(function(a,b){return a+b;},0)/harm.length:0.5;
              var texture=Math.round((sc.entropy*0.4+(1-meanHarm)*0.4+sc.chordRate/2*0.2)*100);
              texture=Math.min(100,texture);
              // energy symmetry from lufs
              var lufsArr=window._chartData.lufs?Array.from(window._chartData.lufs):[];
              if(lufsArr.length>6){
                var third=Math.floor(lufsArr.length/3);
                var a1=lufsArr.slice(0,third).reduce(function(a,b){return a+b;},0)/third;
                var a2=lufsArr.slice(third,2*third).reduce(function(a,b){return a+b;},0)/third;
                var a3=lufsArr.slice(2*third).reduce(function(a,b){return a+b;},0)/third;
                var sym='arch';
                if(a3>a1+1)sym='crescendo ↑';
                else if(a1>a3+1)sym='decrescendo ↓';
                else if(a2>a1+0.5&&a2>a3+0.5)sym='arch ∧';
                else sym='gleichmäßig ─';
                document.getElementById('v-symmetry').textContent=sym;
              }
              /* Die Attack-Rechnung stand hier ein zweites Mal, fast
                 wortgleich - die eine lebende Fassung sitzt im
                 envelope-Zweig (25.08.2026, Review). */
            }
            if(msg.isFinal){
              if(live){ _aufnahme.fertig=true; ablageVielleichtSchreiben(); }}
            break;
        }
    }

    // --- DRAWING FUNCTIONS ---

    /* ==================================================================
       Pufferflächen mit Auflösungsstufen.

       Alle Pixelflächen des Analyzers hatten dasselbe Leiden: Bei jeder
       Sichtänderung wurden sämtliche Bildpunkte neu gerechnet, obwohl
       sich nur der Ausschnitt geändert hatte. Beim Abspielen mit Zoom
       geschah das laufend - gemessen 215 ms Verzögerung im Hauptfaden.

       Hier steckt die Kur, einmal für alle:

         1. Die Fläche wird EINMAL über den ganzen Song gezeichnet, so
            breit wie es Datenspalten gibt. Mehr Auflösung hat die
            Rechnung nicht; alles darüber wäre erfundene Genauigkeit.
         2. Daraus entstehen Stufen, jede halb so breit wie die vorige.
            Eine Stufe kostet ein drawImage - das macht die Grafikkarte.
         3. Gezeichnet wird aus der kleinsten Stufe, die für den
            Ausschnitt noch genug Punkte hat.

       Warum nicht einfach der volle Puffer? Weil ihn bei jeder Ansicht
       auf Anzeigebreite herunterzurechnen TEURER ist als neu zu rechnen -
       gemessen 110 gegen 55 ms. Das war mein erster Versuch, und er war
       schlechter als der Zustand vorher.

       Dasselbe Prinzip wie die Kachelstufen einer Landkarte, wie die
       viewBox der SVG-Spuren, und wie es für die Analysedatenbank
       beschlossen ist.
       ================================================================== */
    /* Mehr als so viele Spalten lohnen nicht: Der Schirm hat rund 1200
       Punkte, bei 16-fachem Zoom sind 19.000 Spalten also die Grenze des
       Sichtbaren. Ungedeckelt wären es bei fünf Minuten über 57.000 -
       ein Puffer von 83 MB, dessen Aufbau eine halbe Sekunde kostet. */
    /* 16383, nicht 16384: Das ist die groesste Kantenlaenge, die das
       WebP-Format zulaesst. Bei 16384 bricht cwebp mit "Invalid
       16384x180 dimension" ab - gefunden, als bin/vorrechnen.js die
       Bilder zum ersten Mal selbst schrieb. Ein Bildpunkt weniger
       aendert nichts an der Aufloesung; bei 32-fachem Zoom liegen
       immer noch ueber 500 Punkte im Ausschnitt. */
    var PUFFER_MAX=16383;

    function pufferFlaeche(schluessel, spalten, hoehe, fuellen, stand){
      spalten=Math.min(spalten, PUFFER_MAX);
      var alle=window._pufferFlaechen=window._pufferFlaechen||{};
      var p=alle[schluessel];
      /* 'stand' sagt, aus welchem Datenstand der Puffer stammt. Fehlte
         er, entstand bei jeder FFT-Runde ein neuer Puffer unter neuem
         Namen - gemessen fünf Puffer derselben Fläche mit zusammen
         116 MB, und keiner wurde je freigegeben. */
      if(p&&p.spalten===spalten&&p.hoehe===hoehe&&p.stand===stand) return p;

      var buf=document.createElement('canvas');
      buf.width=spalten; buf.height=hoehe;
      var bctx=buf.getContext('2d');
      var img=bctx.createImageData(spalten,hoehe);
      fuellen(img.data, spalten, hoehe);
      bctx.putImageData(img,0,0);

      var stufen=[buf], breite=spalten;
      while(breite>512){
        breite=Math.floor(breite/2);
        var klein=document.createElement('canvas');
        klein.width=breite; klein.height=hoehe;
        var kctx=klein.getContext('2d');
        kctx.imageSmoothingEnabled=true;          // beim Verkleinern mitteln
        kctx.drawImage(stufen[stufen.length-1],0,0,breite,hoehe);
        stufen.push(klein);
      }
      p=alle[schluessel]={stufen:stufen, spalten:spalten, hoehe:hoehe, stand:stand};
      return p;
    }

    function pufferZeigen(ctx, p, vs, ve, W, H){
      var noetig=W/Math.max(1e-6,(ve-vs));
      var stufe=p.stufen[p.stufen.length-1];
      for(var si=p.stufen.length-1;si>=0;si--){
        stufe=p.stufen[si];
        if(stufe.width>=noetig) break;
      }
      ctx.imageSmoothingEnabled=(stufe.width>W);
      ctx.drawImage(stufe, vs*stufe.width, 0, Math.max(1,(ve-vs)*stufe.width), stufe.height, 0, 0, W, H);
    }

    function drawTimeAxis(ctx,w,h,dur,xOffset){
      var xOff=xOffset||0;
      var vs=viewStart,ve=viewEnd;
      var visibleDur=(ve-vs)*dur;
      var tStart=vs*dur,tEnd=ve*dur;
      ctx.font='10px system-ui';
      var step=Math.ceil(visibleDur/8);
      if(step<1)step=1;
      for(var t=Math.floor(tStart/step)*step;t<=tEnd;t+=step){
        var x=Math.round((t/dur-vs)/(ve-vs)*w)+xOff;
        if(x<xOff||x>w+xOff)continue;
        ctx.fillStyle='rgba(255,255,255,0.04)';ctx.fillRect(x,0,1,h);
        ctx.fillStyle='#555';ctx.fillText(fmt(t),x+2,h-3);
      }
    }
    function drawCurve(){var _t=performance.now();var _r=_drawCurve.apply(null,arguments);(window._zeit=window._zeit||{})["drawCurve"]=((window._zeit&&window._zeit["drawCurve"])||0)+(performance.now()-_t);return _r;}
    function _drawCurve(id,data,color,h,dur,gridCb,fixedMin,fixedMax){
      if(!sichtbar(id)) return;
      var c=document.getElementById(id);c.width=c.offsetWidth||820;c.height=h;
      var ctx=c.getContext('2d');ctx.fillStyle='#0a0a0a';ctx.fillRect(0,0,c.width,c.height);
      var arr=Array.from(data);
      var vs=viewStart,ve=viewEnd;
      var i0=Math.floor(vs*arr.length),i1=Math.ceil(ve*arr.length);
      var slice=arr.slice(i0,i1);
      if(!slice.length)return;
      var mn=fixedMin!==undefined?fixedMin:Math.min.apply(null,slice);
      var mx=fixedMax!==undefined?fixedMax:Math.max.apply(null,slice);
      var range=mx-mn||1;
      if(gridCb)gridCb(ctx,c.width,c.height,mn,mx);
      ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.beginPath();
      for(var i=0;i<slice.length;i++){
        var x=i/slice.length*c.width,y=c.height-(slice[i]-mn)/range*c.height*0.88-c.height*0.06;
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.stroke();
      markReady(id);
      drawTimeAxis(ctx,c.width,c.height,dur);
    }


    function drawCurveWithMask(id,data,color,h,dur,energyMaskArr,gridCb,fixedMin,fixedMax){
      if(!sichtbar(id)) return;
      var c=document.getElementById(id);c.width=c.offsetWidth||820;c.height=h;
      var ctx=c.getContext('2d');ctx.fillStyle='#0a0a0a';ctx.fillRect(0,0,c.width,c.height);
      var arr=Array.from(data);
      var vs=viewStart,ve=viewEnd;
      var i0=Math.floor(vs*arr.length),i1=Math.ceil(ve*arr.length);
      var slice=arr.slice(i0,i1);
      if(!slice.length)return;
      // energy mask: compute threshold from global energy
      var energyMask=null;
      if(energyMaskArr){
        var es=Array.from(energyMaskArr).slice().sort(function(a,b){return a-b;});
        var p5e=es[Math.floor(es.length*0.05)]*3;
        // resample energy mask to same length as slice
        var eArr=Array.from(energyMaskArr);
        energyMask=slice.map(function(_,i){
          var ei=Math.floor((i0+i)/arr.length*eArr.length);
          return eArr[Math.min(ei,eArr.length-1)]<p5e;
        });
      }
      // zoom-adaptive smoothing
      var visibleDur=(ve-vs)*dur;
      var smWin=visibleDur>30?20:visibleDur>10?8:2;
      var smSlice=slice.map(function(_,i){var s=0,cnt=0;for(var j=Math.max(0,i-smWin);j<=Math.min(slice.length-1,i+smWin);j++){s+=slice[j];cnt++;}return s/cnt;});
      var mn=fixedMin!==undefined?fixedMin:Math.min.apply(null,smSlice);
      var mx2=fixedMax!==undefined?fixedMax:Math.max.apply(null,smSlice);
      var range=mx2-mn||1;
      if(gridCb)gridCb(ctx,c.width,h,mn,mx2);
      ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.beginPath();
      var penDown=false;
      for(var i=0;i<smSlice.length;i++){
        if(energyMask&&energyMask[i]){penDown=false;continue;}
        var x=i/smSlice.length*c.width,y=h-(smSlice[i]-mn)/range*h*0.88-4;
        if(!penDown){ctx.moveTo(x,y);penDown=true;}else ctx.lineTo(x,y);
      }
      ctx.stroke();
      markReady(id);
      drawTimeAxis(ctx,c.width,h,dur);
    }
    /* Lautheitshistogramm (Caspar_D, 21.08.2026): die Verteilung der
       RMS-Lautheit - wie laut ist wieviel Prozent des Liedes. Keine
       Zeitachse, darum kein Playhead. */
    function drawLufsHist(lufs){
      var c=document.getElementById('lufshist-canvas'); if(!c||!lufs||!lufs.length) return;
      c.classList.remove('chart-pending'); c.textContent='';
      var dpr=window.devicePixelRatio||1, w=c.clientWidth||600, h=c.clientHeight||90;
      c.width=w*dpr; c.height=h*dpr;
      var ctx=c.getContext('2d'); ctx.scale(dpr,dpr); ctx.clearRect(0,0,w,h);
      /* Ein Dezibel je Fach statt zwei (Caspar_D, 24.08.2026) - die Form
         der Verteilung ist die Aussage, und mit halber Fachbreite
         zeichnet sie sich doppelt so genau. */
      var bins=new Array(60).fill(0), n=0;
      for(var i=0;i<lufs.length;i++){ var v=lufs[i];
        if(!isFinite(v)||v<=-60) continue;
        var k=Math.max(0,Math.min(59,Math.floor(v+60))); bins[k]++; n++; }
      if(!n) return;
      var mx=Math.max.apply(null,bins);
      var L=8,R=8,U=16,O=14, pb=w-L-R, ph=h-O-U;
      /* Balken in der Hausform (Caspar_D, 23.08.2026): halb deckende Fläche,
         darüber die Topline in voller Stärke - dieselbe Sprache wie die
         Blockdiagramme der Befundspur und die Säulen des Spektrums. */
      for(var k=0;k<60;k++){ if(!bins[k])continue;
        var x0=L+k/60*pb, bw=Math.max(1,pb/60-0.5), hh=bins[k]/mx*ph;
        ctx.fillStyle='rgba(56,232,129,0.5)';
        ctx.fillRect(x0,O+ph-hh,bw,hh);
        ctx.fillStyle='#38e881';
        ctx.fillRect(x0,O+ph-hh,bw,1);
      }
      /* Senkrechte Skala in Prozent der Spieldauer. Der hoechste Balken
         gibt den Bezug; die Linien liegen bei Vierteln davon. */
      var maxProz = mx / n * 100;
      ctx.textAlign='left'; ctx.font='9px system-ui';
      for(var q=1;q<=4;q++){
        var yq = O + ph - q/4*ph;
        ctx.fillStyle='rgba(255,255,255,0.07)';
        ctx.fillRect(L, Math.round(yq), pb, 1);
        ctx.fillStyle='rgba(255,255,255,0.42)';
        ctx.fillText((maxProz*q/4).toFixed(1)+' %', L+2, yq-2);
      }
      ctx.font='10px system-ui'; ctx.fillStyle='#8a8a8a'; ctx.textAlign='center';
      [-60,-50,-40,-30,-20,-10,0].forEach(function(db){
        ctx.fillText(db+(db===0?' dB':''), L+(db+60)/60*pb, h-3); });
      var spitze=bins.indexOf(mx);
      ctx.textAlign='left'; ctx.fillStyle='#9a9a9a';
      ctx.fillText('häufigste Lautheit: '+(-60+spitze)+' bis '+(-59+spitze)+' dB — '+Math.round(mx/n*100)+' % des Liedes', L, 10);
    }






    function drawFluxFromFrames(){var _t=performance.now();var _r=_drawFluxFromFrames.apply(null,arguments);(window._zeit=window._zeit||{})["drawFluxFromFrames"]=((window._zeit["drawFluxFromFrames"]||0)+(performance.now()-_t));return _r;}
    function _drawFluxFromFrames(flux,bandFlux,dur){
      storeChartData('flux-canvas',flux);
      var c=document.getElementById('flux-canvas');
      var nBands=8;
      c.width=c.offsetWidth||820;c.height=nBands*20;
      var ctx=c.getContext('2d');ctx.fillStyle='#0a0a0a';ctx.fillRect(0,0,c.width,c.height);
      var vs=viewStart,ve=viewEnd;

      // if no bandFlux yet, fall back to single global curve
      if(!bandFlux||!bandFlux.length){
        var arr=Array.from(flux);
        var i0=Math.floor(vs*arr.length),i1=Math.ceil(ve*arr.length);
        var sl=arr.slice(i0,i1);if(!sl.length)return;
        var mx=Math.max.apply(null,sl)||1;
        ctx.fillStyle='rgba(75,147,240,0.5)';
        for(var i=0;i<sl.length;i++){
          var x=i/sl.length*c.width,h=sl[i]/mx*c.height;
          ctx.fillRect(x,c.height-h,Math.max(1,c.width/sl.length),h);
        }
        /* Bewusst OHNE Bandnamen: dieser Zweig zeichnet eine Summenkurve,
           es gibt keine Baender zu beschriften. Hier stand bis zum
           25.08.2026 eine verwaiste Kopie der Beschriftungsschleife, die
           bandH und bandNames benutzte - beide werden erst NACH dem
           return dieses Zweigs deklariert und waren hier per Hoisting
           undefined: der Zweig waere beim ersten Lauf geworfen. Die
           lebende Beschriftung steht unten im Bandzweig, samt der
           Geschichte dieses Fundes. */
      markReady('flux-canvas');drawTimeAxis(ctx,c.width,c.height,dur);return;
      }

      var bandNames=['20–40Hz','40–80Hz','80–160Hz','160–315Hz','315–630Hz','630–1250Hz','1250–2500Hz','2500–20kHz'];
      var bandH=c.height/nBands;
      var nFrames=bandFlux[0].length;

      /* DIE PUFFERFLAECHEN-KUR, zuletzt auch hier (25.08.2026, Review).
         Vorher malte jeder Sichtwechsel bis ~450.000 fillRects auf 800
         Bildpunkte - rund siebzigfache Ueberzeichnung, bei der der
         LETZTE Frame gewann - und sortierte die Normierung je Sicht neu.
         Jetzt: P95 einmal ueber ALLE Frames (am Datenstand gecacht), das
         Bild einmal in den Puffer, jeder Sichtwechsel ein drawImage aus
         der passenden Mip-Stufe. Die Buendelung je Pufferspalte nimmt
         das MAXIMUM der Frames - Ereignisse duerfen nicht wegmitteln.
         Topline und Grundlinie liegen IM Puffer: die Stufen skalieren
         nur die Breite, nicht die Hoehe, ein 1-px-Strich bleibt also in
         jeder Stufe 1 px scharf, und horizontal wird seine Helligkeit
         gemittelt - genau "dem Datenverlauf folgend" (Beschluss
         23.08.2026). Das Suno-Blau und seine Daempfung auf 78 % sind der
         Beschluss vom 24.08. ("in keiner Reihe des Hauses" war das
         Tuerkis davor). */
      if(!window._fluxP95||window._fluxP95.stand!==nFrames){
        var w95=new Float32Array(nBands);
        for(var b=0;b<nBands;b++){
          var vals=[];
          for(var i=0;i<nFrames;i++) if(bandFlux[b][i]>0) vals.push(bandFlux[b][i]);
          if(!vals.length){ w95[b]=1; continue; }
          vals.sort(function(x,y){return x-y;});
          w95[b]=vals[Math.floor(vals.length*0.95)]||1;
        }
        window._fluxP95={stand:nFrames, werte:w95};
      }
      var bandP95=window._fluxP95.werte;

      var pF=pufferFlaeche('flux', nFrames, c.height, function(data,bw,bh){
        var bandHp=bh/nBands, schritt=nFrames/bw;
        for(var b=0;b<nBands;b++){
          var drawRow=nBands-1-b;               /* Band 0 = Bass = unten */
          var yTop=Math.round(drawRow*bandHp);
          var hinterA=0;                        /* kein grauer Wechselgrund mehr - Schwarz ist die Null (25.08.2026) */
          for(var x=0;x<bw;x++){
            var a0=Math.floor(x*schritt), a1=Math.max(a0+1,Math.floor((x+1)*schritt));
            var maxv=0;
            for(var fi=a0;fi<a1&&fi<nFrames;fi++){ var wv=bandFlux[b][fi]; if(wv>maxv) maxv=wv; }
            var v=Math.min(1,maxv/bandP95[b]);
            var vLog=v<0.02?0:Math.log(v*9+1)/Math.log(10);
            var alpha=Math.min(1,vLog*1.2);
            /* VON SCHWARZ NACH BLAU (Caspar_D, 25.08.2026: "das blau bleibt
               so, das grau wird schwarz"). Der 40er-Sockel machte das
               untere Ende graublau; jetzt laeuft er proportional mit -
               am oberen Ende (vLog=1) exakt dieselbe Farbe wie vorher
               (220*0,78), am unteren Schwarz. */
            var bl=220*vLog*0.78;
            var zr=Math.round(bl*0.294), zg=Math.round(bl*0.576), zb=Math.round(bl*0.941);
            var zA=Math.round(alpha*0.85*255);
            for(var y=yTop;y<yTop+bandHp&&y<bh;y++){
              var idx=(y*bw+x)*4, zeileImBand=y-yTop;
              if(zeileImBand===2){
                /* Topline: volles Blau, Staerke folgt den Daten; 0.13 als
                   Grundlinie, damit die Zeile auch ohne Bewegung steht. */
                data[idx]=90; data[idx+1]=180; data[idx+2]=255;
                data[idx+3]=Math.round(Math.max(0.13,Math.min(1,vLog*1.35))*255);
              } else if(zeileImBand>=3&&vLog>0){
                data[idx]=zr; data[idx+1]=zg; data[idx+2]=zb; data[idx+3]=zA;
              } else if(hinterA&&zeileImBand>=3){
                data[idx]=255; data[idx+1]=255; data[idx+2]=255; data[idx+3]=hinterA;
              } else {
                data[idx+3]=0;
              }
            }
          }
        }
      }, (_laufendeId||'')+':'+nFrames);
      pufferZeigen(ctx, pF, vs, ve, c.width, c.height);

      /* DIE BANDNAMEN. Caspar_D hat sie mehrfach angefordert, und sie
         standen auch im Code - nur im falschen Ast: im Rueckfallzweig
         weiter oben, der laeuft, wenn gar KEINE Banddaten vorliegen
         und es folglich auch keine Baender zu beschriften gibt. Der
         Zweig endet mit return, bevor dieser Weg hier beginnt. Deshalb
         war im Bild nie etwas zu sehen, obwohl ein grep sie fand.

         Dort stand ausserdem bandNames[bl] bei bl*bandH - die Daten
         laufen aber invertiert (drawRow = nBands-1-b, Bass unten).
         Die Namen haetten also am falschen Band gestanden.

         Zuletzt gezeichnet, damit die Datenspalten sie nicht
         ueberschreiben, auf schmalem dunklem Grund, damit sie auch
         ueber hellen Stellen tragen. 10,5 px ist die Hausgroesse fuer
         Nebenwerte; die 8 px von vorher lagen unter der Lesegrenze. */
      ctx.font='10.5px system-ui,-apple-system,sans-serif';
      ctx.textBaseline='alphabetic';
      for(var b=0;b<nBands;b++){
        var zeile=nBands-1-b;                 /* Band 0 = Bass = unten */
        var yb=zeile*bandH;
        var name=bandNames[b];
        var breite=ctx.measureText(name).width;
        ctx.fillStyle='rgba(8,8,10,0.78)';
        ctx.fillRect(0,yb+3,breite+10,bandH-4);
        /* rgb(176) gegen den Grund: rund 8:1, deutlich ueber der
           Schwelle von 4,5:1 fuer Schrift unter 18,66 px. */
        ctx.fillStyle='rgb(176,176,182)';
        ctx.fillText(name,5,yb+bandH-5);
      }

      markReady('flux-canvas');
      drawTimeAxis(ctx,c.width,c.height,dur);
    }




    function detectChord(chroma){
      // 24 templates: 12 major + 12 minor
      // Major template: root=1, major3rd=0.5, perfect5th=0.8
      // Minor template: root=1, minor3rd=0.5, perfect5th=0.8
      var notes=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
      var best=-1,bestChord='';
      for(var root=0;root<12;root++){
        // major: intervals 0,4,7
        var maj=chroma[root]*1.0+chroma[(root+4)%12]*0.8+chroma[(root+7)%12]*0.9;
        if(maj>best){best=maj;bestChord=notes[root];}
        // minor: intervals 0,3,7
        var min=chroma[root]*1.0+chroma[(root+3)%12]*0.8+chroma[(root+7)%12]*0.9;
        if(min>best){best=min;bestChord=notes[root]+'m';}
      }
      return bestChord;
    }

    /* ------------------------------------------------------------------
       Frequenzachse und Notensystem der beiden Spektrogramme.

       Stand bis zum 19.08.2026 ZWEIMAL im Quelltext, Wort fuer Wort
       gleich, einmal je Spektrogramm. Beim Halbieren der Hoehe waere
       jede Aenderung an zwei Stellen faellig gewesen - der klassische
       Weg, wie zwei Diagramme auseinanderlaufen.

       DIE ELF LINIEN SIND KEINE BELIEBIGE AUSWAHL. G2 B2 D3 F3 A3 sind
       die fuenf Linien des Bassschluessels, E4 G4 B4 D5 F5 die des
       Violinschluessels, und C4 dazwischen ist die HILFSLINIE fuer das
       eingestrichene C. Zusammen sind sie ein Notensystem - deshalb
       heisst das mittlere Feld im Original auch "helper" und wird
       duenner gezeichnet. Wer die Liste kuerzt, zerstoert das Bild.
       ------------------------------------------------------------------ */
    var NOTEN_SYSTEM=[
      {midi:43,label:'G2'},{midi:47,label:'B2'},{midi:50,label:'D3'},
      {midi:53,label:'F3'},{midi:57,label:'A3'},
      {midi:60,label:'C4',hilfslinie:true},
      {midi:64,label:'E4'},{midi:67,label:'G4'},{midi:71,label:'B4'},
      {midi:74,label:'D5'},{midi:77,label:'F5'}
    ];
    /* Schrifthoehe plus Luft. Naeher aneinander ueberlappen die Kaesten. */
    var NOTEN_MIN_ABSTAND=12;

    function spektroAchsenZeichnen(ctx,W,H,sr,logMin,logMax){
      ctx.font='10px system-ui';
      [100,500,1000,2000,5000,10000].forEach(function(f){
        if(f>sr/2)return;
        var normY=(Math.log10(f)-logMin)/(logMax-logMin),y=Math.round((1-normY)*H);
        ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fillRect(0,y,W,1);
        ctx.fillStyle='rgba(255,255,255,0.5)';ctx.fillText(f>=1000?(f/1000)+'k':f+'Hz',W-28,y-2);
      });

      /* Erst alle Lagen rechnen, dann entscheiden, welche BESCHRIFTUNG
         Platz hat. Die Linien werden immer alle gezogen - sie sind das
         Notensystem und sollen dicht liegen. Nur die Kaestchen mit dem
         Tonnamen brauchen Hoehe.

         Bei 360 px lagen G2..F5 auf 101 px, also 9 px auseinander -
         schon damals eng. Halbiert waeren es 4,6 px und elf Kaesten
         uebereinander. */
      var lagen=NOTEN_SYSTEM.map(function(nl){
        var freq=440*Math.pow(2,(nl.midi-69)/12);
        if(freq<20||freq>sr/2) return null;
        var normY=(Math.log10(freq)-logMin)/(logMax-logMin);
        var y=Math.round((1-normY)*H);
        return (y<0||y>H) ? null : {nl:nl,y:y};
      });

      /* Vom eingestrichenen C aus nach beiden Seiten auswaehlen, nicht
         von oben nach unten. C4 ist der Ton, an dem man die Leiter
         abzaehlt; faellt ausgerechnet er weg, nuetzt der Rest wenig. */
      var bezug=0;
      NOTEN_SYSTEM.forEach(function(nl,i){ if(nl.hilfslinie) bezug=i; });
      var beschriftet=new Set(), letzte=null;
      if(lagen[bezug]){ beschriftet.add(bezug); letzte=lagen[bezug].y; }
      for(var j=bezug+1;j<lagen.length;j++){
        if(!lagen[j]) continue;
        if(letzte===null||Math.abs(lagen[j].y-letzte)>=NOTEN_MIN_ABSTAND){ beschriftet.add(j); letzte=lagen[j].y; }
      }
      letzte = lagen[bezug] ? lagen[bezug].y : null;
      for(var k=bezug-1;k>=0;k--){
        if(!lagen[k]) continue;
        if(letzte===null||Math.abs(lagen[k].y-letzte)>=NOTEN_MIN_ABSTAND){ beschriftet.add(k); letzte=lagen[k].y; }
      }

      lagen.forEach(function(l,i){
        if(!l) return;
        var hilf=l.nl.hilfslinie, y=l.y;
        ctx.strokeStyle='rgba(255,255,255,'+(hilf?0.25:0.5)+')';
        ctx.lineWidth=hilf?0.5:1;
        ctx.beginPath();ctx.moveTo(30,y);ctx.lineTo(W,y);ctx.stroke();
        if(!beschriftet.has(i)) return;
        ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(0,y-9,28,11);
        ctx.fillStyle='rgba(255,255,255,'+(hilf?0.5:0.9)+')';
        ctx.font=(hilf?'9':'bold 10')+'px system-ui';ctx.fillText(l.nl.label,2,y);
      });
    }

    function drawSpectrogramFromFrames(){var _t=performance.now();var _r=_drawSpectrogramFromFrames.apply(null,arguments);(window._zeit=window._zeit||{})["drawSpectrogramFromFrames"]=((window._zeit&&window._zeit["drawSpectrogramFromFrames"])||0)+(performance.now()-_t);return _r;}
    /* ------------------------------------------------------------------
       WELCHE FREQUENZBAENDER LIEGEN IN EINER BILDZEILE?

       Bis zum 19.08.2026 stand hier ein einziges Band je Zeile - das
       naechstgelegene. Gemessen an einem Song mit fftSize 1024: von 512
       Baendern wurden 103 angesehen, **409 nie**. Bis zu 19 Baender
       fielen auf eine Zeile und wurden durch eines vertreten.

       Das ist derselbe Fehler, den die WAAGERECHTE Achse schon nicht
       mehr macht: Dort steht seit langem das Maximum ueber alle Bilder
       einer Spalte, mit der Begruendung, ein Knack von zwanzig
       Millisekunden duerfe nicht in ein uebersprungenes Bild fallen.
       Fuer die Senkrechte galt das Argument genauso - nur hatte es
       niemand angewandt. Ein schmaler Pfeifton zwischen zwei
       Stuetzstellen war spurlos weg.

       Es ist auch derselbe Fehler wie beim Tonhoehenverlauf am selben
       Tag und bei der Farbextraktion (FARBHANDLING.md): Wer verkleinert,
       muss ZUSAMMENFASSEN, nicht AUSWAEHLEN. Ein Stellvertreter
       verschweigt seine Nachbarn.

       Zurueckgegeben werden zwei Reihen: das erste und das letzte Band
       je Zeile. Gerechnet wird ueber die Zeilenkanten (row +/- 0,5),
       nicht ueber die Zeilenmitte - sonst blieben zwischen zwei Zeilen
       wieder Baender uebrig, die zu keiner gehoeren.
       ------------------------------------------------------------------ */
    /* ------------------------------------------------------------------
       WO STOESST DAS SIGNAL AN DIE DECKE?

       Caspar_Ds Frage am 19.08.2026: ob das Spektrogramm auch zeigen kann,
       wo ein Signal ans Maximum stoesst und man mit Abschneiden rechnen
       muss.

       DER ERSTE GEDANKE WAR FALSCH. Nahe liegt, die FFT-Werte selbst zu
       pruefen: Sie sind Bytes, 255 waere die Decke. Gemessen an "Ich
       erwarte dich - Track 1" ueber 38.962 Bilder mal 512 Baender ist
       der GROESSTE vorkommende Wert 204. Der Worker rechnet
       (20*log10(mag)+80)/80, und ein einzelnes Frequenzband erreicht
       nie Vollausschlag - die Energie verteilt sich ja auf alle. Eine
       Markierung auf 255 waere nie erschienen.

       Abgeschnitten wird nicht im Spektrum, sondern in der ZEIT. Und
       dafuer liegen die Reihen laengst da, in 100-ms-Schritten auf
       derselben Achse: spitzeVerlauf (True Peak je Fenster) und
       clipVerlauf (Zahl der Abtastwerte am Anschlag).

       Zwei Zustaende, zwei Aussagen:
       WEISS  - es wurde tatsaechlich abgeschnitten, Abtastwerte liegen
                am Anschlag.
       PINK   - kein Abschneiden, aber weniger als 1 dB Luft. Beim
                Kodieren in MP3 oder AAC kann daraus eines werden, denn
                der True Peak liegt zwischen den Abtastwerten.

       Das Band steht OBEN und ist drei Bildpunkte hoch. Oben, weil dort
       nichts anderes steht; drei Punkte, weil es eine Warnung ist und
       kein Diagramm - es sagt WANN, den Wert sagt die Spitzenkurve.
       ------------------------------------------------------------------ */
    var SPITZE_LUFT_DB=-1.0;

    function spitzenBandZeichnen(ctx,W,H,vs,ve){
      var m=window._normwerte;
      if(!m||!m.spitzeVerlauf||!m.spitzeVerlauf.length) return false;
      var sp=m.spitzeVerlauf, cl=m.clipVerlauf, n=sp.length, sicht=(ve-vs)||1;
      var gab=false;
      for(var i=0;i<n;i++){
        var voll=!!(cl&&cl[i]>0);
        var eng=sp[i]>=SPITZE_LUFT_DB;
        if(!voll&&!eng) continue;
        var t0=i/n, t1=(i+1)/n;
        if(t1<vs||t0>ve) continue;
        gab=true;
        var x0=(t0-vs)/sicht*W, x1=(t1-vs)/sicht*W;
        ctx.fillStyle=voll?'#ffffff':'#e31c79';
        ctx.fillRect(Math.floor(x0),0,Math.max(1,Math.ceil(x1-x0)),3);
      }
      return gab;
    }

    /* Seit dem 25.08.2026 teilen sich zwei Bilder diesen Abschnitt, und
       der Titel gehoert beiden. Ohne Argument gerufen behaelt er, was er
       ueber die Uebersteuerungsspitzen weiss, und wechselt nur den Text
       zur offenen Lasche. "linker Kanal" steht jetzt dabei: Das Bild war
       nie eine Monosumme, auch wenn der Kommentar im Rechenkern das
       behauptet (Befund 34). */
    var _spektroSpitzen=false;
    function spektroTitelSetzen(gabSpitzen){
      if(gabSpitzen!==undefined) _spektroSpitzen=gabSpitzen;
      var c=document.getElementById('spectro-canvas');
      var t=c&&c.closest('.section')&&c.closest('.section').querySelector('.slbl');
      if(!t) return;
      if(_spektroOffen==='r'){
        t.innerHTML='<span><span class="nam">Spektrogramm</span> — <span class="erkl">rechter Kanal · lokal Z-normiert · dunkel=Stille · hell=Signal</span></span>';
        return;
      }
      if(_spektroOffen==='summe'){
        t.innerHTML='<span><span class="nam">Spektrogramm</span> — <span class="erkl">beide Kanäle, Beträge addiert · lokal Z-normiert · dunkel=Stille · hell=Signal</span></span>';
        return;
      }
      if(_spektroOffen==='pan'){
        t.innerHTML='<span><span class="nam">Spektrogramm</span> — <span class="erkl">'
          + 'Seitenlage je Frequenzfach · <span style="color:#f97b14">orange = links</span> · '
          + '<span style="color:#4b93f0">blau = rechts</span> · '
          + '<span style="color:#9a9aa2">grau = zentral</span></span></span>';
        return;
      }
      t.innerHTML='<span><span class="nam">Spektrogramm</span> — <span class="erkl">linker Kanal · lokal Z-normiert · '
        + 'dunkel=Stille · hell=Signal</span>'
        + (_spektroSpitzen
            ? ' · <span style="opacity:.82">Band oben: '
              + '<span style="color:#ffffff">weiß = abgeschnitten</span>, '
              + '<span style="color:#e31c79">pink = unter 1 dB Luft</span></span>'
            : ' · <span style="opacity:.78">nirgends unter 1 dB Luft</span>')+'</span>';
    }


    function _drawSpectrogramFromFrames(frames,numFrames,fftSize,sr,dur){
      var bins=fftSize/2;
      /* Die Hoehe steht im Markup, nicht hier. Sie stand vorher an
         beiden Stellen - und wer eine davon aendert, bekommt ein Bild,
         das in einen Kasten anderer Groesse gerechnet wird. */
      var c=document.getElementById('spectro-canvas');
      c.width=c.offsetWidth||820;c.height=c.offsetHeight||180;
      var ctx=c.getContext('2d');
      var logMin=Math.log10(20),logMax=Math.log10(sr/2);
      var vs=viewStart,ve=viewEnd;
      var f0=Math.floor(vs*numFrames),f1=Math.ceil(ve*numFrames);
      var visFrames=Math.max(1,f1-f0);
      var W=c.width,H=c.height;
      var imgData=ctx.createImageData(W,H),data=imgData.data;

      /* ------------------------------------------------------------------
         DIE TONWERTE WAREN FALSCH VERTEILT.

         Die Streckung lief ueber p5 -> p90 -> p95. Damit landeten
         **85 % aller Werte in der unteren Haelfte** der Skala, dem
         Graukeil, und nur die obersten 10 % bekamen ueberhaupt Farbe.
         Gemessen an "Ich erwarte dich - Track 1": 93,7 % der Bildpunkte
         unter mittlerer Helligkeit, das obere Drittel der Tonwerte
         **leer** (0,1 %).

         Ein Bild, das neun Zehntel seiner Daten in ein Drittel seines
         Tonwertumfangs presst, ist nicht dunkel gemeint - es ist
         schlecht eingeteilt. Der Mittelpunkt liegt jetzt beim
         **oberen Quartil**: Drei Viertel der Werte verteilen sich ueber
         den Graukeil, das letzte Viertel ueber den farbigen Teil.

         Die Enden bleiben, wo sie waren. p5 unten ist das Tor gegen das
         Grundrauschen, p95 oben die Klippe - beide sagen etwas ueber
         die Daten, der Mittelpunkt sagt nur etwas ueber die Einteilung.
         ------------------------------------------------------------------ */
      var P_MITTE=0.75;
      /* AUS DER ABLAGE KOMMEN KEINE ROHBILDER.

         Sie sind 92 % der Datenmenge und werden nur gebraucht, um
         dieses Bild zu MALEN - gespeichert wird das fertige Bild. Beim
         Abspielen ist der Puffer deshalb schon eingesetzt, und alles,
         was aus frames rechnet, ist gegenstandslos: die Perzentile
         ebenso wie das Fuellen. Achsen, Warnband und Titel laufen
         weiter, denn die haengen nicht an den Rohdaten. */
      var ohneRoh = !frames;
      /* DIE EHRLICHE SPALTENZAHL (25.08.2026, Review). In den
         Vorschaurunden schickt der Worker heruntergerechnete Frames
         (previewStep, hoechstens ~2000 Spalten), meldet numFrames aber
         als VOLLE Zahl. Perzentile und Bildaufbau lasen damit weit
         hinter dem Array-Ende (TypedArray liefert undefined -> NaN):
         die Vorschaubilder waren Muell, und die Perzentilrechnung lief
         ueber die volle Breite statt ueber die gelieferte. Ab hier gilt
         darum, was wirklich im Array liegt. Nebenwirkung erwuenscht:
         die Vorschaurunden rechnen jetzt ueber ~2000 statt ~56000
         Spalten. */
      if(!ohneRoh) numFrames = Math.floor(frames.length/bins) || numFrames;
      if(ohneRoh){
        /* Nur zeigen. Der Puffer steht schon (aus dem gespeicherten
           Bild), alles Weitere haengt an den Rohdaten und ist beim
           Abspielen gegenstandslos. Achsen, Warnband und Titel gehoeren
           NICHT dazu - sie kommen aus den Messreihen. */
        var pA=(window._pufferFlaechen||{}).spectro;
        if(pA){
          pufferZeigen(ctx, pA, vs, ve, W, H);
          spektroAchsenZeichnen(ctx,W,H,sr,logMin,logMax);
          spektroTitelSetzen(spitzenBandZeichnen(ctx,W,H,vs,ve));
          markReady('spectro-canvas');
          drawTimeAxis(ctx,W,H,dur);
        }
        return;
      }
      // per-frequency percentile scaling — compute once over ALL frames, cache
      if(!ohneRoh && (!window._spectroPerc||window._spectroPerc.bins!==bins
         ||window._spectroPerc.numFrames!==numFrames||window._spectroPerc.mitte!==P_MITTE)){
        /* HISTOGRAMM STATT 512 SORTIERUNGEN (25.08.2026, Review). Die
           Frames sind Bytes 0..255: je Bin einmal durchzaehlen und die
           drei Perzentile aus den kumulierten Faechern ablesen - exakt
           dasselbe Ergebnis wie sorted[floor(n*q)], nur ohne Kopie und
           ohne Sort. Zusammen mit der ehrlichen Spaltenzahl oben faellt
           die Endrunden-Blockade von grob 1-3 s auf Millisekunden. */
        var p5arr=new Float32Array(bins),pMarr=new Float32Array(bins),p95arr=new Float32Array(bins);
        var perzByte=function(hh,nn,q){
          var zielB=Math.floor(nn*q)+1, cb=0;
          for(var bB=0;bB<256;bB++){ cb+=hh[bB]; if(cb>=zielB) return bB/255; }
          return 1;
        };
        for(var k=0;k<bins;k++){
          var hh=new Uint32Array(256);
          for(var fi2=0;fi2<numFrames;fi2++) hh[frames[fi2*bins+k]]++;
          p5arr[k]=perzByte(hh,numFrames,0.05);
          pMarr[k]=perzByte(hh,numFrames,P_MITTE);
          p95arr[k]=perzByte(hh,numFrames,0.95);
        }
        window._spectroPerc={p5:p5arr,pM:pMarr,p95:p95arr,bins:bins,numFrames:numFrames,mitte:P_MITTE};
      }
      var _sp=window._spectroPerc||{};
      var p5arr=_sp.p5,pMarr=_sp.pM,p95arr=_sp.p95;

      /* Dieselbe Kur wie bei allen Pixelflächen: einmal über den ganzen
         Song zeichnen, danach nur den Ausschnitt kopieren. Der erste
         Anlauf hatte hier eigenen Code und einen Zwischenspeicher, der
         still bei jedem Aufruf verfiel - gemessen 632 ms je Sichtwechsel.
         Über den gemeinsamen Helfer sind es Millisekunden. */
      var p=pufferFlaeche('spectro', numFrames, H, function(data,bw,bh){
        spektroBildFuellen(data,bw,bh,{frames:frames,numFrames:numFrames,bins:bins,
          fftSize:fftSize,sr:sr,logMin:logMin,logMax:logMax,
          p5:p5arr,pM:pMarr,p95:p95arr});
      }, numFrames);
      pufferZeigen(ctx, p, vs, ve, W, H);

      spektroAchsenZeichnen(ctx,W,H,sr,logMin,logMax);
      var gabSpitzen=spitzenBandZeichnen(ctx,W,H,vs,ve);
      spektroTitelSetzen(gabSpitzen);
      markReady('spectro-canvas');
      ablageVielleichtSchreiben();
      drawTimeAxis(ctx,W,H,dur);
    }
    function drawStereoSpectro(){var _t=performance.now();var _r=_drawStereoSpectro.apply(null,arguments);(window._zeit=window._zeit||{})["drawStereoSpectro"]=((window._zeit&&window._zeit["drawStereoSpectro"])||0)+(performance.now()-_t);return _r;}
    function _drawStereoSpectro(stereoFrames,monoFrames,numFrames,fftSize,sr,dur){
      var bins=fftSize/2;
      var c=document.getElementById('stereospectro-canvas');
      if(!c)return;
      c.width=c.offsetWidth||820;c.height=c.offsetHeight||180;
      var ctx=c.getContext('2d');
      var logMin=Math.log10(20),logMax=Math.log10(sr/2);
      var vs=viewStart,ve=viewEnd;
      var f0=Math.floor(vs*numFrames),f1=Math.ceil(ve*numFrames);
      var visFrames=Math.max(1,f1-f0);
      var W=c.width,H=c.height;

      var ohneRoh = !stereoFrames || !monoFrames;
      if(ohneRoh){
        var pB=(window._pufferFlaechen||{}).stereospectro;
        if(pB){
          pufferZeigen(ctx, pB, vs, ve, W, H);
          spektroAchsenZeichnen(ctx,W,H,sr,logMin,logMax);
          markReady('stereospectro-canvas');
          drawTimeAxis(ctx,W,H,dur);
        }
        return;
      }
      /* Kontraststreckung - einmal ueber ALLE Frames, im Zwischenspeicher.
         HISTOGRAMM STATT SORT (25.08.2026, Review): Hier liefen vorher
         ~29 Millionen Werte durch push() in ein ungetyptes Array
         (>230 MB Boxen) und dann durch sort() - die messbare Blockade
         am Analyse-Ende. stereoFrames ist Int8, |Wert| ist eine ganze
         Zahl 0..127: 128 Zaehlfaecher, einmal durchzaehlen, kumulieren,
         ablesen. EXAKT dasselbe Perzentil, Sekunden statt Minuten der
         Muellabfuhr. */
      if(!ohneRoh && (!window._stereoP95||window._stereoP95.numFrames!==numFrames)){
        var hst=new Uint32Array(128), nWerte=numFrames*bins;
        for(var fi=0;fi<nWerte;fi++) hst[Math.abs(stereoFrames[fi])]++;
        var zielN=Math.floor(nWerte*0.95)+1, cum=0, p95v=127;
        for(var hw=0;hw<128;hw++){ cum+=hst[hw]; if(cum>=zielN){ p95v=hw; break; } }
        window._stereoP95={val:p95v||1,numFrames:numFrames};
      }
      var scale=(window._stereoP95&&window._stereoP95.val>0)?127/window._stereoP95.val:1;

      /* Byte -> Amplitude, einmal fuer alle 256 moeglichen Werte.

         Die Frames tragen (20*log10(mag)+80)/80 als Byte, also DEZIBEL.
         Damit zu gewichten hiesse, mit Logarithmen zu wiegen - dieselbe
         Klasse Fehler wie das Stapeln von Dezibel. Eine Tabelle mit 256
         Eintraegen kostet nichts und macht es richtig. */
      if(!window._ampTabelle){
        var at=new Float32Array(256);
        for(var bI=0;bI<256;bI++) at[bI]=Math.pow(10,((bI/255*80)-80)/20);
        window._ampTabelle=at;
      }
      var AMP=window._ampTabelle;

      var p=pufferFlaeche('stereospectro', numFrames, H, function(data,bw,bh){
        stereoBildFuellen(data,bw,bh,{stereoFrames:stereoFrames,monoFrames:monoFrames,
          numFrames:numFrames,bins:bins,fftSize:fftSize,sr:sr,
          logMin:logMin,logMax:logMax,scale:scale});
      }, numFrames);
      pufferZeigen(ctx, p, vs, ve, W, H);

      spektroAchsenZeichnen(ctx,W,H,sr,logMin,logMax);
      markReady('stereospectro-canvas');
      ablageVielleichtSchreiben();
      drawTimeAxis(ctx,W,H,dur);
    }

    /* ------------------------------------------------------------------
       Das Live-Spektrum haengt am Graphen des Aufrufers.

       Bis zum 19.08.2026 hing es an window._mediaSource - einem
       MediaElementSource ueber 'player', dem eigenen, versteckten
       Audioelement des Analyzers. Das spielt im eingebetteten Zustand
       nie: Ton macht die Buehne. Die Flaeche blieb deshalb SCHWARZ,
       gemessen null von 45.000 Bildpunkten. Aufgefallen ist es erst, als
       sie nach oben wanderte - ganz unten hinter zwei Spektrogrammen
       hatte sie nie jemand angesehen.

       Der richtige Knoten wird laengst gereicht: Die Buehne baut EINEN
       createMediaElementSource (mehr als einer je Audioelement ist
       verboten) und gibt ihn als 'hoerer.quelle' an alle weiter -
       Butterchurn, audioMotion und ueber quelle() auch hierher. Genau
       den benutzt initDensitySpectrum() schon; nur dieses eine
       Diagramm ging noch seinen eigenen Weg.

       Am fremden Graphen NICHT an ctx.destination haengen: Die Buehne
       hat ihre Verbindung dorthin bereits, eine zweite verdoppelte das
       Signal. Ein Analyser misst im Vorbeigehen, er muss nichts
       weiterreichen.
       ------------------------------------------------------------------ */
    /* Orange nach Blau, linear in RGB. Beide Enden sind die
       Hausfarben (#f97b14 / #4b93f0); dazwischen laeuft es ueber ein
       stumpfes Grau, was hier richtig ist - die Mitte des Spektrums
       soll keine dritte Bedeutung bekommen. */
    function SUNO_VERLAUF(t){
      t=Math.max(0,Math.min(1,t));
      var r=Math.round(0xf9+(0x4b-0xf9)*t),
          g=Math.round(0x7b+(0x93-0x7b)*t),
          b=Math.round(0x14+(0xf0-0x14)*t);
      return 'rgb('+r+','+g+','+b+')';
    }

    /* Den Live-Analyser sauber vom Graphen nehmen.

       disconnect() loest nur die AUSGEHENDEN Verbindungen eines
       Knotens. Die eingehende - Quelle -> Analyser - kann nur die
       QUELLE loesen. Ohne das haengt nach zehn Songwechseln ein
       zehnter Analyser mit 4096 Punkten am Graphen der Buehne: Hoerbar
       ist davon nichts, denn keiner reicht etwas weiter. Er rechnet
       nur. */
    function liveSpektrumLoesen(){
      if(window._animFrame){cancelAnimationFrame(window._animFrame);window._animFrame=null;}
      var g=window._liveGraph;
      if(!g) return;
      /* Von hinten nach vorne loesen. disconnect() nimmt nur die
         AUSGEHENDEN Verbindungen; die eingehende Quelle -> Teiler kann
         nur die Quelle selbst loesen. */
      [g.l,g.r,g.teiler].forEach(function(k){ if(k){try{k.disconnect();}catch(e){}} });
      if(g.quelle&&g.teiler){ try{g.quelle.disconnect(g.teiler);}catch(e){} }
      window._liveGraph=null;
      window._analyser=null;   // Altlast: einzelne Stellen fragen noch danach
      window._liveQuelle=null;
    }

    /* ------------------------------------------------------------------
       Das Live-Spektrum, zwei Fassungen.

       GESPIEGELT (Voreinstellung): der linke Kanal nach oben, der
       rechte nach unten, beide von derselben Mittellinie aus. Das ist
       das Bevoelkerungspyramiden-Prinzip, das hier von selbst aufgeht:
       Beide Haelften wachsen VON der Achse WEG, sie koennen sich also
       nie ueberlagern und nie als eine Kurve gelesen werden. Orange
       oben ist links, blau unten ist rechts - dieselbe Zuordnung wie im
       Stereopanorama und im Stereo-Spektrogramm.

       SUMME: beide Kanaele zusammen, Farbe laeuft dann ueber die
       Frequenz - orange bassig, blau luftig, wie beim Frequenzgewicht.
       In der einen Fassung steht die Farbe fuer die Lage nach oben, in
       der anderen fuer die Lage nach rechts; sie sagt in beiden nur,
       wo man ist, und nie zwei Dinge zugleich.

       DIE SUMME WIRD IN AMPLITUDE GERECHNET, NICHT IN BYTES.
       getByteFrequencyData liefert eine auf 0..255 gestreckte
       DEZIBEL-Skala. Zwei davon zu mitteln waere der Mittelwert zweier
       Logarithmen, also der Logarithmus des geometrischen Mittels -
       dieselbe Klasse Fehler wie das Stapeln von Dezibel, an dem wir
       uns am 18.08.2026 die Finger verbrannt haben. Also zurueck auf
       Amplitude, mitteln, wieder hinauf.
       ------------------------------------------------------------------ */
    var _spektrumModus='gespiegelt';
    /* WEISS, nicht aufgehellt (Caspar_D, 19.08.2026). Der erste Versuch
       nahm die Grundfarben um 45 % zu Weiss verschoben, damit die
       Spitze noch als ihr Kanal lesbar bleibt. Zu wenig: Ueber Orange
       ist ein helles Orange kaum zu sehen, und der Saum ist duenn.

       Welcher Kanal es ist, sagt ohnehin schon die Seite - oben oder
       unten. Die Farbe darf hier also etwas anderes sagen, naemlich
       'das ist der Unterschied'. Und dafuer ist Weiss auf beiden Seiten
       richtig: EINE Farbe fuer EINE Bedeutung, unabhaengig davon, wo
       sie steht.

       Der frueher Einwand gegen Weiss galt zwoelf breiten Chromabaendern
       ("das weiss ist zu weiss"). Hier sind es Saeume von wenigen
       Bildpunkten - gemessen 2,6 % der bemalten Flaeche. */
    var SPITZE_FARBE='#ffffff';

    function drawSpectrum(buf,id){
      var c=document.getElementById(id);
      c.width=c.offsetWidth||820;c.height=c.offsetHeight||150;
      var ctx=c.getContext('2d');ctx.fillStyle='#0a0a0a';ctx.fillRect(0,0,c.width,c.height);
      var sr=buf.sampleRate;
      liveSpektrumLoesen();
      /* OHNE fremden Knoten KEIN Live-Spektrum. Hier stand ein zweiter
         Weg, der sich aus dem eigenen Audioelement eine Quelle baute
         und sie an ctx.destination haengte - der Ursprung der zweiten
         Wiedergabe vom 19.08.2026. Er ist ersatzlos weg: Eine leere
         Flaeche ist ein Zustand, eine zweite Tonquelle ist ein Fehler. */
      if(!_fremdeQuelle||!_fremderCtx){
        ctx.fillStyle='#555';ctx.font='11px system-ui';
        ctx.fillText('Live-Spektrum: keine Tonquelle angeschlossen',10,20);
        return;
      }

      /* Ein Teiler, zwei Analyser - und KEIN zweiter Ausgang. Ein
         Analyser misst im Vorbeigehen; an ctx.destination gehoert er
         nicht, die Buehne hat ihre Verbindung dorthin bereits. */
      var ktx=_fremderCtx;
      var teiler=ktx.createChannelSplitter(2);
      var mk=function(){ var a=ktx.createAnalyser();
        a.fftSize=4096;a.smoothingTimeConstant=0.8;return a; };
      /* DIE PALETTE DES OVERLAYS (Caspar_D, 26.08.2026).
         Nicht additiv gemischt, sondern nach Absorptionsfarben - wie
         Malfarben: "linker Kanal ist orange, orange mischt in der Kunst
         aus rot und gelb, also Rohsignal in Gelb, Overlap genau unser
         Orange, Endsignal Rot." Beim rechten Kanal ebenso, nur dass
         unser Blau im Farbton fast reines Blau ist (256° gegen 267°) -
         mit Gruen kaeme die Mischung bei Tuerkis heraus und traefe den
         Akzent nicht. Deshalb Blaugruen.

         DIE DECKUNG IST SCHWARZ (Caspar_D, 26.08.2026: "lass uns den
         overlap schwarz machen"). Erst trug sie die Hausfarbe und war
         die hellste der drei - das zeigte vor allem den Normalfall,
         also das, was gleich geblieben ist. Schwarz dreht die Aussage
         um: Was sich deckt, sinkt als dunkle Silhouette in den Grund,
         und es leuchtet nur noch, WO SICH ETWAS GEAENDERT HAT. Das Bild
         zeigt damit die Bearbeitung selbst statt des Materials.

         Reines Schwarz, nicht die Grundfarbe (#0a0a0a): So bleibt die
         Silhouette als Andeutung erkennbar - man sieht, worauf sich die
         Unterschiede beziehen, ohne dass es um Aufmerksamkeit
         konkurriert. */
      var UEBER = {
        links:  { codiert:'#f9b414', deckung:'#000000', ausgabe:'#f9143c',
                  linie:'#f97b14', asym:'#f9ccb2' },
        rechts: { codiert:'#14b4a0', deckung:'#000000', ausgabe:'#2a4bf0',
                  linie:'#4b93f0', asym:'#aec7e7' },
      };
      var aL=mk(), aR=mk();
      try{
        _fremdeQuelle.connect(teiler);
        teiler.connect(aL,0);
        teiler.connect(aR,1);
      }catch(e){}
      /* DAS ZWEITE PAAR am Ende der Kette. Beide haengen dauerhaft -
         umgeschaltet wird nur, welches gelesen wird. Ein Analyser ist
         eine Sackgasse: Er hoert zu, ohne etwas zu veraendern, und
         kostet nichts, solange niemand ihn ausliest. */
      var eL=null, eR=null, eTeiler=null;
      if(_fremdesEnde){
        try{
          eTeiler=ktx.createChannelSplitter(2);
          eL=mk(); eR=mk();
          _fremdesEnde.connect(eTeiler);
          eTeiler.connect(eL,0);
          eTeiler.connect(eR,1);
        }catch(e){ eL=eR=null; }
      }
      /* Der Umschalter erscheint erst jetzt - vorher weiss niemand, ob
         es ueberhaupt zwei Abgriffe gibt. */
      var sw=document.getElementById('sa-signal-wahl');
      if(sw) sw.style.display = (eL&&eR) ? 'flex' : 'none';
      if(!(eL&&eR)) _signalModus='codiert';
      window._liveGraph={teiler:teiler,l:aL,r:aR,quelle:_fremdeQuelle};
      window._analyser=aL; window._liveQuelle=_fremdeQuelle;

      /* Die Umrechnung Byte <-> Amplitude. minDecibels/maxDecibels sind
         die Enden der Strecke, auf die der Analyser seine Dezibel
         legt. */
      var dbMin=aL.minDecibels, dbSpanne=aL.maxDecibels-aL.minDecibels;
      var byteZuAmp=function(b){ return Math.pow(10,(b/255*dbSpanne+dbMin)/20); };
      var ampZuByte=function(a){
        if(a<=0) return 0;
        var db=20*Math.log10(a);
        return Math.max(0,Math.min(255,(db-dbMin)/dbSpanne*255));
      };

      var binCount=aL.frequencyBinCount,logMin=Math.log10(20),logMax=Math.log10(sr/2);
      var fdL=new Uint8Array(binCount), fdR=new Uint8Array(binCount);
      /* Im Overlay werden beide Signale zugleich gebraucht. */
      var fcL=new Uint8Array(binCount), fcR=new Uint8Array(binCount);

      function raster(){
        ctx.font='10px system-ui';
        [50,100,200,500,1000,2000,5000,10000,20000].forEach(function(f){
          if(f>sr/2)return;
          var x=Math.round((Math.log10(f)-logMin)/(logMax-logMin)*c.width);
          ctx.fillStyle='rgba(255,255,255,0.05)';ctx.fillRect(x,0,1,c.height);
          ctx.fillStyle='#555';ctx.fillText(f>=1000?(f/1000)+'k':f+'',x+2,c.height-3);
        });
      }

      var _spektrumLetzte=-1;
      function draw(){
        window._animFrame=requestAnimationFrame(draw);
        /* Bei Pause liefert der Analyser eingefrorene Daten - trotzdem
           wurde 60-mal je Sekunde die volle Flaeche neu gemalt (Review,
           25.08.2026). Einmal nach dem Anhalten oder Springen zeichnen
           genuegt. */
        var _z=ZEIT();
        if(!LAEUFT() && _z===_spektrumLetzte) return;
        _spektrumLetzte=_z;
        /* Welcher Abgriff gilt gerade? Fehlt das Endpaar (aeltere
           Buehne, die den Knoten nicht hereinreicht), bleibt es beim
           Rohsignal - dann ist der Umschalter gar nicht erst da. */
        var beides = (_signalModus==='beide' && eL && eR);
        var qL = (_signalModus==='ausgabe' && eL) ? eL : aL;
        var qR = (_signalModus==='ausgabe' && eR) ? eR : aR;
        qL.getByteFrequencyData(fdL); qR.getByteFrequencyData(fdR);
        /* Im Overlay traegt fd* das CODIERTE und fc* das AUSGABE-Signal
           - so bleibt der Rest des Zeichencodes unberuehrt, der ohnehin
           mit fd* rechnet. */
        if(beides){ eL.getByteFrequencyData(fcL); eR.getByteFrequencyData(fcR); }
        ctx.fillStyle='#0a0a0a';ctx.fillRect(0,0,c.width,c.height);

        if(_spektrumModus==='gespiegelt'){
          /* LUFT OBEN UND UNTEN (Caspar_D, 26.08.2026: "gib dem spektrum
             mehr Luft zum Atmen oben und unten, ca 10 px"). Vorher
             reichten die Spitzen bis einen Bildpunkt an die Kante - ein
             lauter Bass sah aus, als waere er abgeschnitten, und man
             konnte nicht sehen, ob er es war. */
          var LUFT=10;
          var mitte=Math.round(c.height/2), halb=mitte-LUFT;
          for(var x=0;x<c.width;x++){
            var freq=Math.pow(10,logMin+(logMax-logMin)*x/c.width);
            var bin=Math.min(Math.round(freq/(sr/2)*binCount),binCount-1);
            var hL=Math.round(fdL[bin]/255*halb), hR=Math.round(fdR[bin]/255*halb);
            /* DIE HELLEN SPITZEN SIND DIE STEREOINFORMATION.

               Was beide Kanaele gemeinsam haben, ist min(L,R) - das
               waere bei einer Subtraktion weg. Uebrig bliebe genau der
               Ueberstand des lauteren Kanals, |L-R|. Er steht deshalb
               hell auf dem gemeinsamen Sockel: Der Sockel ist Mono, die
               Spitze ist der Unterschied.

               Bei Caspar_Ds Mischungen ist der Sockel fast alles und die
               Spitze ein Saum - das ist keine Schwaeche der Anzeige,
               sondern der Befund. Die Anzeige streckt ihn nicht. */
            /* DIESELBE FORMENSPRACHE WIE DIE SPUREN DARÜBER (Caspar_D,
               23.08.2026): Der Sockel steht halb deckend, seine Kanten als
               harte Linien in voller Farbe - oben im linken Spektrum, unten
               im rechten. Die weißen Spitzen ebenso: halb deckend mit
               eigener Kante. */
            /* ---- UEBERLAGERT: codiert gegen Ausgabe -----------------
               Statt Mono-Sockel und Stereo-Spitze steht hier je Kanal,
               was sich deckt und was uebersteht. Die Deckung traegt die
               Hausfarbe, der Ueberstand sagt, WELCHES Signal weiter
               reicht: Gelb bzw. Blaugruen, wenn das codierte hoeher
               steht (KlangTresor nimmt dort weg), Rot bzw. Blau, wenn
               das Ausgabesignal hoeher steht (es hebt dort an).

               Dieselbe Formensprache wie sonst: Flaeche halb deckend,
               Kante in voller Staerke. */
            if(beides){
              var aH=Math.round(fcL[bin]/255*halb), aHr=Math.round(fcR[bin]/255*halb);
              var dL=Math.min(hL,aH), dR=Math.min(hR,aHr);
              var oL=UEBER.links, oR=UEBER.rechts;
              /* Die Deckung voll deckend, nicht halb: Sie soll den Grund
                 wirklich verdraengen, sonst schimmert das Raster durch
                 und macht aus der Silhouette ein Gitter. */
              ctx.globalAlpha=1;
              ctx.fillStyle=oL.deckung; ctx.fillRect(x,mitte-dL,1,dL);
              ctx.fillStyle=oR.deckung; ctx.fillRect(x,mitte,1,dR);
              ctx.globalAlpha=0.5;
              if(hL>dL){ ctx.fillStyle=oL.codiert; ctx.fillRect(x,mitte-hL,1,hL-dL); }
              if(aH>dL){ ctx.fillStyle=oL.ausgabe; ctx.fillRect(x,mitte-aH,1,aH-dL); }
              if(hR>dR){ ctx.fillStyle=oR.codiert; ctx.fillRect(x,mitte+dR,1,hR-dR); }
              if(aHr>dR){ ctx.fillStyle=oR.ausgabe; ctx.fillRect(x,mitte+dR,1,aHr-dR); }
              ctx.globalAlpha=1;
              /* DIE TOPLINE GEHOERT DEM EINGANG (Caspar_D, 26.08.2026:
                 "nur das eingangsignal bekommt eine topline, dann sieht
                 man immer gleich, ob ich drunter oder drüber bin").

                 Sie steht immer auf der Hoehe des CODIERTEN Signals,
                 gleichgueltig ob die Ausgabe darueber oder darunter
                 liegt - dadurch ist sie eine feste Bezugslinie und kein
                 Umriss. Was oberhalb leuchtet, wurde angehoben; was
                 unterhalb fehlt, wurde weggenommen.

                 Sie traegt die Hausfarbe des Kanals. Die ist frei
                 geworden, seit die Deckung schwarz ist - und sie ist
                 genau die Farbe, die man mit "dieser Kanal" verbindet. */
              if(hL>0){ ctx.fillStyle=oL.linie; ctx.fillRect(x,mitte-hL,1,1); }
              if(hR>0){ ctx.fillStyle=oR.linie; ctx.fillRect(x,mitte+hR-1,1,1); }
              /* Keine Kante auf der Deckung: Sie ist schwarz, eine
                 schwarze Linie auf Schwarz waere nichts. Die Grenze
                 zeichnet der Ueberstand selbst, indem er dort beginnt. */
              continue;
            }
            var gemein=Math.min(hL,hR);
            ctx.globalAlpha=0.5;
            ctx.fillStyle='#f97b14';ctx.fillRect(x,mitte-gemein,1,gemein);
            ctx.fillStyle='#4b93f0';ctx.fillRect(x,mitte,1,gemein);
            ctx.fillStyle=SPITZE_FARBE;
            if(hL>gemein) ctx.fillRect(x,mitte-hL,1,hL-gemein);
            if(hR>gemein) ctx.fillRect(x,mitte+gemein,1,hR-gemein);
            ctx.globalAlpha=1;
            /* Die Kanten in voller Stärke: je ein Bildpunkt. */
            if(hL>0){ ctx.fillStyle=(hL>gemein?SPITZE_FARBE:'#f97b14');
                      ctx.fillRect(x,mitte-hL,1,1); }
            if(hR>0){ ctx.fillStyle=(hR>gemein?SPITZE_FARBE:'#4b93f0');
                      ctx.fillRect(x,mitte+hR-1,1,1); }
            /* Wo die weiße Spitze auf dem Sockel aufsitzt, trägt auch der
               Sockel seine Kante - sonst verschwimmen beide ineinander. */
            if(hL>gemein&&gemein>0){ ctx.fillStyle='#f97b14'; ctx.fillRect(x,mitte-gemein,1,1); }
            if(hR>gemein&&gemein>0){ ctx.fillStyle='#4b93f0'; ctx.fillRect(x,mitte+gemein-1,1,1); }
          }
          raster();
          ctx.fillStyle='rgba(255,255,255,0.25)';ctx.fillRect(0,mitte,c.width,1);
        } else {
          for(var x2=0;x2<c.width;x2++){
            var f2=Math.pow(10,logMin+(logMax-logMin)*x2/c.width);
            var b2=Math.min(Math.round(f2/(sr/2)*binCount),binCount-1);
            var summe=ampZuByte((byteZuAmp(fdL[b2])+byteZuAmp(fdR[b2]))/2);
            /* Dieselbe Luft wie im gespiegelten Bild: zehn Punkte oben,
               zehn unten. Der Faktor 0,95 von frueher ist darin
               aufgegangen. */
            var h2=summe/255*(c.height-20);
            ctx.fillStyle=SUNO_VERLAUF(x2/c.width);
            ctx.fillRect(x2,c.height-10-h2,1,h2);
          }
          raster();
        }
      }
      spektrumTexteSetzen();
      draw();
    }

    /* Titel UND Bildunterschrift haengen am Modus (Caspar_D,
       25.08.2026: "bei kanalunabhaengigem display steht immer noch
       links orange rechts blau unter dem bild - das ist so falsch").

       Der Titel schaltete schon um, die Unterschrift stand fest im
       Markup und erklaerte weiter die Spiegelung - auch dann, wenn
       beide Kanaele zusammengefasst sind und es gar keine Seiten mehr
       gibt. Jetzt schreiben beide dasselbe Bild. */
    function spektrumTexteSetzen(){
      var u=document.getElementById('sa-spektrum-text');
      /* Im Overlay bedeuten die Farben etwas anderes als sonst - dann
         muss auch etwas anderes darunter stehen. */
      if(u && _signalModus==='beide'){
        u.innerHTML =
          'Beide Signale übereinander — und zwar so, daß nur der <b>Unterschied</b> leuchtet. '
        + 'Was sich deckt, bleibt schwarz: Es ist als Silhouette zu erkennen, aber es ist auch '
        + 'das, was KlangTresor nicht verändert hat. Farbe hat nur, wo sich etwas ändert. '
        + '<span style="color:#f9b414">Gelb</span> und '
        + '<span style="color:#14b4a0">blaugrün</span> heißt: das <b>codierte</b> Signal steht '
        + 'höher, dort wird weggenommen. <span style="color:#f9143c">Rot</span> und '
        + '<span style="color:#5a72f5">blau</span> heißt: das <b>Ausgabe-Signal</b> steht höher, '
        + 'dort wird angehoben. Die <span style="color:#f97b14">durchgehende Linie</span> steht '
        + 'immer auf der Höhe des <b>Eingangs</b> — an ihr liest man sofort ab, ob die Ausgabe '
        + 'darüber oder darunter liegt. Oben der linke Kanal, unten der rechte.';
        return;
      }
      if(u) u.innerHTML =
        'Momentane Verteilung der hörbaren Frequenzen im Track. Waagerecht sind die '
        + 'Frequenzen von tief nach hoch sortiert, senkrecht wird die Stärke abgebildet. '
        + (_spektrumModus==='gespiegelt'
            ? 'Durch die Spiegelung von <span style="color:#f97b14">linkem Kanal</span> und '
              + '<span style="color:#4b93f0">rechtem Kanal</span> können Unterschiede als '
              + '<span style="color:#ffffff">Asymmetrie</span> sofort erkannt werden.'
            : 'Beide Kanäle sind zu einer Kurve zusammengefasst — Seitenunterschiede sind '
              + 'in dieser Ansicht also nicht zu sehen. Die Farbe trägt hier die Tonhöhe: '
              + '<span style="color:#f97b14">orange</span> tief, '
              + '<span style="color:#4b93f0">blau</span> hoch.');
      var t=document.getElementById('sa-spektrum-titel');
      if(!t) return;
      t.innerHTML = _spektrumModus==='gespiegelt'
        ? '<span class="nam">Frequenzspektrum</span> — <span class="erkl">live</span> · <span style="color:#f97b14">▲ links</span> · '
          + '<span style="color:#4b93f0">▼ rechts</span> · '
          + '<span style="opacity:.82">gemeinsamer Sockel farbig, '
          + '<span style="color:'+SPITZE_FARBE+'">weiße Spitzen</span> = Unterschied der Kanäle</span>'
        : '<span class="nam">Frequenzspektrum</span> — <span class="erkl">live</span> · <span style="opacity:.9">beide Kanäle zusammen</span> · '
          + '<span style="opacity:.82">'
          + '<span style="color:#f97b14">orange</span> tief · '
          + '<span style="color:#4b93f0">blau</span> hoch</span>';
    }

    /* Der Umschalter. Er wirkt sofort - die Zeichenschleife liest
       _spektrumModus in jedem Bild, es muss nichts neu aufgebaut
       werden. */
    /* Der Signalumschalter. Wie der daneben: Die Zeichenschleife liest
       den Modus in jedem Bild, es muss nichts neu aufgebaut werden. */
    document.addEventListener('click', function(e){
      var k=e.target.closest && e.target.closest('#sa-signal-wahl button');
      if(!k) return;
      var g=k.parentElement;
      g.dataset.wert=k.dataset.s;
      [].forEach.call(g.children, function(b){ b.classList.toggle('an', b===k); });
      _signalModus=k.dataset.s;
      spektrumTexteSetzen();
    });
    document.addEventListener('click', function(e){
      var k=e.target.closest && e.target.closest('#sa-spektrum-wahl button');
      if(!k) return;
      var g=k.parentElement;
      g.dataset.wert=k.dataset.m;
      [].forEach.call(g.children, function(b){ b.classList.toggle('an', b===k); });
      _spektrumModus=k.dataset.m;
      spektrumTexteSetzen();
    });
    // ---- GAUGE SYSTEM ----
    // min/max = absolute range
    // nLo/nHi = normal range (gray)
    // p5/p95 = extreme percentiles (saturated color)
    // loLabels/hiLabels = [slightly outside, clearly outside, extreme]
    var gauges={
      'bpm':{
        min:40,max:220,nLo:75,nHi:145,p5:55,p95:175,
        loLabels:['eher langsam','sehr langsam','extrem langsam'],
        hiLabels:['eher schnell','sehr schnell','extrem schnell'],
        unit:'BPM'
      },
      'loud':{
        min:-28,max:-4,nLo:-18,nHi:-10,p5:-26,p95:-6,
        loLabels:['eher leise','sehr leise','extrem leise / dynamisch'],
        hiLabels:['eher laut','sehr laut','extrem laut / komprimiert'],
        unit:'dB'
      },
      'dyn':{
        min:2,max:25,nLo:6,nHi:16,p5:3,p95:22,
        loLabels:['leicht komprimiert','stark komprimiert','totgepresst'],
        hiLabels:['leicht dynamisch','sehr dynamisch','extrem dynamisch'],
        unit:'dB'
      },
      'centroid':{
        min:300,max:8000,nLo:1000,nHi:4500,p5:400,p95:7000,
        loLabels:['eher warm','sehr warm / dunkel','extrem dunkel / dumpf'],
        hiLabels:['eher hell','sehr hell / scharf','extrem schrill'],
        unit:'Hz'
      },
      'rolloff':{
        min:1000,max:20000,nLo:4000,nHi:14000,p5:1500,p95:18000,
        loLabels:['eher geschlossen','sehr geschlossen','extrem bassig / stumpf'],
        hiLabels:['eher offen / luftig','sehr offen','extrem hell / überpräsent'],
        unit:'Hz'
      },
      'stereo':{
        min:0,max:100,nLo:15,nHi:70,p5:3,p95:90,
        loLabels:['leicht mono-nah','fast mono','komplett mono'],
        hiLabels:['eher breit','sehr breit','extrem breit / phasig'],
        unit:'%'
      },
      'chord-rate':{
        min:0,max:2,nLo:0.1,nHi:0.8,p5:0.02,p95:1.5,
        loLabels:['harmonisch statisch','sehr statisch / Drone','kein Akkordwechsel'],
        hiLabels:['harmonisch aktiv','sehr aktiv','extrem schnelle Harmonik'],
        unit:'/s'
      },
      'entropy':{
        min:0,max:100,nLo:30,nHi:75,p5:10,p95:90,
        loLabels:['eher tonal / klar','sehr tonal / wenig Obertöne','fast reiner Sinuston'],
        hiLabels:['eher dicht / noisig','sehr dicht / Wall of Sound','weißes Rauschen'],
        unit:'%'
      },
      'texture':{
        min:0,max:100,nLo:20,nHi:70,p5:5,p95:88,
        loLabels:['eher klar / strukturiert','sehr klar / minimalistisch','extrem simpel'],
        hiLabels:['eher dicht / komplex','sehr komplex / chaotisch','extrem dicht'],
        unit:'%'
      },
      'inharm':{
        min:0,max:100,nLo:5,nHi:40,p5:1,p95:70,
        loLabels:['sehr rein / harmonisch','extrem rein / synthetisch','perfekte Sinuswellen'],
        hiLabels:['eher unrein / verstimmt','stark verstimmt / FM-artig','extrem inharmonisch'],
        unit:''
      },
      'attack':{
        min:0,max:500,nLo:20,nHi:200,p5:5,p95:400,
        loLabels:['eher perkussiv','sehr perkussiv','extrem hart / klick-artig'],
        hiLabels:['eher weich','sehr weich / pad-artig','extrem langsamer Fade-in'],
        unit:'ms'
      },
      'note-stab':{
        min:0,max:100,nLo:30,nHi:80,p5:10,p95:95,
        loLabels:['eher unruhig / ornamental','sehr unruhig / viele Glissandi','extrem flatternd'],
        hiLabels:['eher stabil / gehalten','sehr stabil / lange Noten','extrem statisch / Drone'],
        unit:'%'
      },
      'tilt':{
        min:-100,max:100,nLo:-30,nHi:30,p5:-70,p95:70,
        loLabels:['eher hell / luftig','sehr hell / treblelastig','extrem schrill / basstarm'],
        hiLabels:['eher warm / bassig','sehr bassig','extrem bass-dominant / dumpf'],
        unit:''
      },
      'harmdense':{
        min:0,max:16,nLo:2,nHi:10,p5:0,p95:14,
        loLabels:['wenig Obertöne / sinusartig','kaum harmonisch','reiner Sinus'],
        hiLabels:['reichhaltige Obertöne','sehr reich / Orgel-artig','extrem dicht / Orgel/Synthesizer'],
        unit:''
      }
    };

    function gaugeGradient(g){
      var lo=(g.nLo-g.min)/(g.max-g.min);
      var hi=(g.nHi-g.min)/(g.max-g.min);
      var p5=(g.p5-g.min)/(g.max-g.min);
      var p95=(g.p95-g.min)/(g.max-g.min);
      // saturated blue at p5, fade to gray at nLo, gray through normal, fade to orange at nHi, saturated orange at p95
      return 'linear-gradient(to right,'+
        '#0e53ac 0%,'+
        '#0e53ac '+(p5*100).toFixed(1)+'%,'+
        '#136cdf '+(lo*100).toFixed(1)+'%,'+
        '#3a3a3a '+(lo*100+0.5).toFixed(1)+'%,'+
        '#3a3a3a '+(hi*100-0.5).toFixed(1)+'%,'+
        '#cb5e05 '+(hi*100).toFixed(1)+'%,'+
        '#da6506 '+(p95*100).toFixed(1)+'%,'+
        '#da6506 100%)';
    }

    function getGaugeLabel(g,value){
      var lo=g.nLo,hi=g.nHi,p5=g.p5,p95=g.p95;
      if(value>=lo&&value<=hi)return {text:'im Normalbereich',color:'#888'};
      if(value<lo){
        var depth=value<p5?2:value<(lo+p5)/2?1:0;
        return {text:g.loLabels[depth],color:depth===2?'#0e53ac':depth===1?'#136cdf':'#3988ef'};
      }else{
        var depth=value>p95?2:value>(hi+p95)/2?1:0;
        return {text:g.hiLabels[depth],color:depth===2?'#da6506':depth===1?'#cb5e05':'#f97407'};
      }
    }

    function updateGauge(id,value){
      var g=gauges[id];if(!g)return;
      var track=document.querySelector('#g-'+id+' .gauge-track');
      var marker=document.getElementById('gm-'+id);
      if(!track||!marker)return;
      track.style.background=gaugeGradient(g);
      var pct=Math.max(0,Math.min(1,(value-g.min)/(g.max-g.min)));
      marker.style.left=(pct*100).toFixed(1)+'%';
      gauges[id]._lastVal=value;
    }

    function gaugeZoneText(id){
      var g=gauges[id];if(!g||g._lastVal===undefined)return '';
      var label=getGaugeLabel(g,g._lastVal);
      return '<br><span style="font-size:11px;color:'+label.color+'">'+label.text+'</span>'+
        '<br><span style="font-size:10px;color:#555">'+
        '<span style="color:#136cdf">◀</span> blau = '+g.loLabels[0]+' &nbsp;'+
        '<span style="color:#888">▬</span> grau = normal &nbsp;'+
        '<span style="color:#cb5e05">▶</span> orange = '+g.hiLabels[0]+'</span>';
    }
    var tt=document.getElementById('tt');
    var ttData={}; // stores arrays per chart id for hover lookup

    function showTT(html,x,y){
      tt.innerHTML=html;
      tt.style.opacity='1';
      var vw=window.innerWidth,tw=tt.offsetWidth||200;
      tt.style.left=Math.min(x+14,vw-tw-10)+'px';
      tt.style.top=(y+14)+'px';
    }
    function hideTT(){tt.style.opacity='0';}

    // card tooltips
    var cardTips={
      'v-plays':'Anzahl der Wiedergaben insgesamt auf Suno.',
      'v-likes':'Anzahl der Likes (Upvotes).',
      'v-comments':'Anzahl der Kommentare.',
      'v-ratio':'Plays pro Like — niedriger Wert = hohe Engagement-Rate.',
      'v-age':'Alter des Songs seit Veröffentlichung.',
      'v-ppd':'Durchschnittliche Plays pro Tag seit Veröffentlichung.',
      'v-model':'Suno-Modellversion mit der der Song generiert wurde.',
      'v-dur':'Gesamtdauer des Songs.',
      'v-loud':'RMS-Lautheit in dB. Streaming-Standard ca. -14 dB. Normalbereich -18 bis -10 dB.',
      'v-dyn':'Dynamikumfang: Peak-dB minus RMS-dB. Normalbereich 6–16 dB.',
      'v-key':'Grundton aus dem Bass auf Sunos Eins - dort spielt er fast immer den Grundton des Akkords. Das Tongeschlecht aus der gezählten Terz in den melodischen Spuren; fehlt sie (bei Powerchords die Regel), steht nur der Grundton da.',
      'v-grenz':'Bis wohin die Höhen reichen, und WIE sie enden. Die Frequenz ist die Stelle, ab der der Pegel dauerhaft rund 30 dB unter der 1–8-kHz-Referenz bleibt. Der Zusatz sagt, ob dort geschnitten wurde: \u00bbscharf\u00ab ab 20 dB/kHz Flanke ist ein Schnitt \u2013 ein Codec oder das Modell selbst; \u00bbweich\u00ab ist natürliches Auslaufen. Gemessen am 26.08.2026 an fünf Suno-WAVs: der Abfall von 17 auf 21 kHz betrug 8,5 bis 19,6 dB, also durchweg WEICH. Sunos WAVs tragen keine Codec-Kante; ein 192-kbps-MP3 macht dort über 40 dB auf einem einzigen Kilohertz. Aus einem MP3 gemessen tr\u00fcge der Wert dessen Encoderkante statt der des Modells \u2013 deshalb wird seit dem 26.08.2026 nur noch aus der WAV gerechnet.',
      'v-stereo':'Stereobreite als L–R-Differenz. Normalbereich 15–70%.',
      'v-entropy':'Spektrale Entropie: wie gleichmäßig ist Energie über alle Frequenzen verteilt. Niedrig = tonal/klar, hoch = noisig/dicht.',
      'v-symmetry':'Energie-Form des Songs aus drittel-Segmenten der LUFS-Kurve. Crescendo ↑ / Decrescendo ↓ / Arch ∧ / Gleichmäßig ─.',
    };
    var gaugeIds={'v-loud':'loud','v-dyn':'dyn','v-stereo':'stereo','v-entropy':'entropy',};

    Object.keys(cardTips).forEach(function(id){
      var el=document.getElementById(id);
      if(!el)return;
      var card=el.closest('.card');
      if(!card)return;
      card.style.cursor='help';
      card.addEventListener('mouseenter',function(e){
        var gid=gaugeIds[id];
        showTT(cardTips[id]+(gid?gaugeZoneText(gid):''),e.clientX,e.clientY);
      });
      card.addEventListener('mousemove',function(e){
        var gid=gaugeIds[id];
        showTT(cardTips[id]+(gid?gaugeZoneText(gid):''),e.clientX,e.clientY);
      });
      card.addEventListener('mouseleave',hideTT);
    });

    // chart tooltips: description + value at cursor position
    var chartTips={
      'flux-canvas':{
        desc:'<b>Klangveränderung (Spektrale Fluktuation) — 8-Band Heatmap</b><br>X: Zeit · 8 Zeilen = 8 Frequenzbänder (Bass unten, Höhen oben)<br>Helligkeit = wie stark sich dieses Frequenzband von Frame zu Frame verändert. Logarithmisch normiert per Band.<br><br>Heller Blitz im Bass-Band = Kick Drum. Heller Blitz in Höhen = Hi-Hat. Breiter Blitz über viele Bänder = Synthesizer-Attack. Alles dunkel = Pad/Drone ohne Änderung. Mitten flackern = Melodie mit schnellen Noten.',
        valFn:null
      },

      'spectro-canvas':{
        desc:'<b>Spektrogramm (Zeit × Frequenz)</b><br>X: Zeit · Y: Frequenz log. (20Hz–22kHz) mit Notenlinien<br>Schwarz = kein Signal. Weiß = bis P90 (90. Perzentil der lokalen Amplitude). <span style="color:#f97306">Orange</span> = über P90 — die lautesten Anteile.<br><br>Horizontal helle Linien = gehaltene Töne. Vertikale Striche = Transienten/Drums. Orange Bereiche = dominante Frequenzen. Lokal Z-normiert pro Frequenzbin.',
        valFn:function(pct,yPct,sr){
          var logMin=Math.log10(20),logMax=Math.log10((sr||44100)/2);
          var freq=Math.pow(10,logMin+(logMax-logMin)*(1-yPct));
          return freq>=1000?(freq/1000).toFixed(1)+' kHz':Math.round(freq)+' Hz';
        }
      },
      'stereospectro-canvas':{
        desc:'<b>Stereo-Spektrogramm — Panning pro Frequenz</b><br>X: Zeit · Y: Frequenz · Farbe: Panning-Richtung<br><span style="color:#ff6600">■ Orange</span> = linker Kanal dominant. <span style="color:#1472eb">■ Blau</span> = rechter Kanal dominant. Grau = zentriert. Helligkeit = Amplitude.<br><br>Bass fast immer grau = gutes Mastering. Höhen oft orange/blau = Reverb gepannt. Komplett einfarbige Frequenz = hard-panned Instrument.',
        valFn:function(pct,yPct,sr){
          var logMin=Math.log10(20),logMax=Math.log10((sr||44100)/2);
          var freq=Math.pow(10,logMin+(logMax-logMin)*(1-yPct));
          return freq>=1000?(freq/1000).toFixed(1)+' kHz':Math.round(freq)+' Hz';
        }
      },
      'freq-canvas':{
        desc:'<b>Frequenzspektrum — live</b><br>X: Frequenz (logarithmisch, 20Hz–20kHz) · Y: Amplitude · 60fps<br>Zeigt den momentanen Frequenzinhalt während der Wiedergabe. Bass links, Mitten Mitte, Höhen rechts.<br><br>Peaks = dominante Frequenzen. Gleichmäßige Füllung = dichte Textur. Für Echtzeit-Monitoring.',
        valFn:function(pct,yPct,sr){
          var logMin=Math.log10(20),logMax=Math.log10((sr||44100)/2);
          var freq=Math.pow(10,logMin+(logMax-logMin)*pct);
          return freq>=1000?(freq/1000).toFixed(1)+' kHz':Math.round(freq)+' Hz';
        }
      }
    };
    var currentSR=44100;
    Object.keys(chartTips).forEach(function(id){
      var c=document.getElementById(id);
      if(!c)return;
      var tip=chartTips[id];
      c.style.cursor='crosshair';
      c.addEventListener('mousemove',function(e){
        var rect=c.getBoundingClientRect();
        var pct=(e.clientX-rect.left)/rect.width;
        var yPct=(e.clientY-rect.top)/rect.height;
        var t=fmt(pct*songDuration);
        var html='<span style="color:#888;font-size:11px">'+t+'</span><br>'+tip.desc;
        if(tip.valFn){
          var val=tip.valFn(pct,yPct,currentSR);
          if(val)html='<span style="color:#888;font-size:11px">'+t+'</span> <span style="color:#4b93f0;font-weight:500">'+val+'</span><br>'+tip.desc;
        }
        showTT(html,e.clientX,e.clientY);
      });
      c.addEventListener('mouseleave',hideTT);
    });

    // struct bar tooltip

    // store data arrays for chart value lookups
    function storeChartData(id,arr){ttData[id]=Array.from(arr);}

    // Unified Y-axis labels — innen links, einheitliches Styling
    // values: array of {v, label} where v is the data value, label is display string
    function drawYAxis(ctx,h,values,fixedMin,fixedMax){
      ctx.font='8px system-ui';
      values.forEach(function(item){
        var y=h-(item.v-fixedMin)/(fixedMax-fixedMin)*h*0.88-4;
        if(y<4||y>h-2)return;
        ctx.fillStyle='rgba(255,255,255,0.06)';
        ctx.fillRect(0,Math.round(y),ctx.canvas?ctx.canvas.width:820,1);
        ctx.fillStyle='rgba(255,255,255,0.35)';
        ctx.fillText(item.label,3,Math.round(y)-2);
      });
    }

    /* Nicht zeichnen, was niemand sieht.

       Neun der alten Canvas-Kurven sind im eingebetteten Zustand
       ausgeblendet, weil die SVG-Spuren sie ersetzt haben. Gezeichnet
       wurden sie trotzdem - bei jedem Aufbau UND bei jedem Zoomschritt,
       denn redrawAllCharts() fragt nicht, ob etwas sichtbar ist.

       offsetParent ist null, sobald das Element selbst oder ein
       Vorfahr display:none traegt. Damit greift die Wache allgemein:
       Was ausgeblendet ist, kostet nichts mehr - ohne dass an neun
       Stellen einzeln entschieden werden muss. (Caspar_D, 18.08.2026:
       "nicht wegwerfen, nur verschwinden lassen oder abklemmen, damit
       es keine Rechenzeit verschwendet.") */
    function sichtbar(id){
      var el=document.getElementById(id);
      return !!(el && el.offsetParent !== null);
    }

    // mark canvas as done — removes skeleton pulse
    function markReady(id){
      var c=document.getElementById(id);
      if(c){c.classList.remove('chart-pending');c.classList.add('chart-ready');}
    }


    /* ---------------------------------------------------------------
       Der Kopfbereich aus Katalogdaten.

       Der Analyzer holte diese Angaben einst von der suno.com-Songseite
       (fetchMeta, am 25.08.2026 entfernt). Heute ist der Katalogweg der
       einzige: /api/song/<id> hat alles - vollstaendiger, schneller und
       ohne Netz.
       --------------------------------------------------------------- */
    var _katalogDaten = null;

    /* TONART UND STIMMLAGE aus bin/toene.js, gemessen auf den getrennten
       Stems. Beide Karten waren totgelegt, weil die alten Werte im
       Vollmix entstanden und nicht trugen.

       WAS NICHT SICHER IST, WIRD NICHT BEHAUPTET (Hausregel): Fehlt die
       Terz - bei Powerchords die Regel -, steht nur der Grundton da,
       kein "Dur" und kein "Moll". Und liegt die Stimme im Bereich, in
       dem Tenor und Alt sich wirklich ueberlappen, steht ein
       Fragezeichen statt einer Muenze, die geworfen wurde. */
    function toeneZeigen(t){
      var kEl = document.getElementById('v-key');
      var vEl = document.getElementById('v-vocal');
      if (kEl){
        kEl.textContent = (t && t.tonart && t.tonart.name) ? t.tonart.name : '—';
        kEl.style.color = (t && t.tonart && !t.tonart.art) ? '#9a9aa2' : '';
      }
      stemSpurenZeichnen(t);
      if (vEl){
        var lage = (t && t.stimme && t.stimme.lage) || '—';
        vEl.textContent = lage;
        /* Dieselben Farben wie im Stereobild: orange fuer die eine
           Seite, blau fuer die andere, grau fuer "weiss ich nicht". */
        /* 'instrumental' ist kein Meswert, sondern ein Urteil - es
           bekommt deshalb die unbunte Farbe, nicht die einer Seite
           (Caspar_D, 25.08.2026). */
        vEl.style.color = lage === 'weiblich' ? '#f97b14'
                        : lage === 'männlich' ? '#4b93f0' : '#9a9aa2';
        vEl.title = lage === 'instrumental'
          ? 'Ohne Gesang — hier wird keine Stimme gemessen'
          : (t && t.stimme && t.stimme.n) ? t.stimme.n + ' gemessene Tonhöhen' : '';
      }
    }

    /* WELCHE SPUR IST WIE VERLAESSLICH - die Farben dazu:

       (Caspar_D, 24.08.2026: "warme farben sind die auffaelligsten farben,
       nahe rot fuehrt, mit gelb am ende, dann kommen die kalten, blau am
       start, gruene am ende, dann kommen unbunte farben, grau am ende.")

       Die sicherste Spur bekommt die auffaelligste Farbe, die
       unsicherste die zurueckhaltendste. Wer auf die Analyse schaut,
       sieht am Farbton, wie sehr er der Spur trauen kann, ohne eine
       Legende zu lesen.

         warm   Rot . Orange . Gelb
         kalt   Blau . Gruen
         unbunt Grau

       Nachgemessen im OKLab-Raum: das engste Paar der sechs liegt bei
       0,152 - ueber der Schwelle von 0,10, ab der zwei Farben
       nebeneinander noch zu unterscheiden sind.

       Der Block stand frueher bei der Demucs-Sektion und waere am
       25.08.2026 fast mit ihr gefallen - er gehoert aber den
       Einzelspuren hier, deshalb steht er jetzt bei ihnen. */
    var STEM_RANG = [
      { id:'drums',  farbe:'#e31c79', name:'Schlagzeug' },  /* Rot    */
      { id:'bass',   farbe:'#fba04f', name:'Bass'       },  /* Orange */
      { id:'vocals', farbe:'#d8d81c', name:'Gesang'     },  /* Gelb   */
      { id:'guitar', farbe:'#4b93f0', name:'Gitarre'    },  /* Blau   */
      { id:'piano',  farbe:'#16be5c', name:'Klavier'    },  /* Gruen  */
      { id:'other',  farbe:'#b0b0b6', name:'Rest'       }   /* Grau   */
    ];
    var STEM_FARBE = {}, STEM_NAME = {};
    STEM_RANG.forEach(function(s){
      STEM_FARBE[s.id] = s.farbe; STEM_NAME[s.id] = s.name;
    });

    /* DIE SECHS STEMS als Huellkurven. Gezeichnet wird ueber die GANZE
       Laenge (0..SPUR_W); den Ausschnitt schneidet spurSichtSetzen()
       spaeter mit der viewBox heraus - deshalb muss beim Zoomen nichts
       neu gerechnet werden. Hausform wie ueberall: halb deckende Flaeche
       auf der Grundlinie, darauf die Kontur in voller Staerke. */
    function stemSpurenZeichnen(t){
      var H = 44, pad = 2, gezeigt = 0;
      for (var stem in STEM_FARBE){
        var rahmen = document.getElementById('spur-stem-' + stem);
        var host   = document.getElementById('stem' + stem + 'spur-canvas');
        if (!rahmen || !host) continue;
        var reihe = t && t.huellen && t.huellen[stem];
        if (!reihe || reihe.length < 2){ rahmen.style.display = 'none'; continue; }
        rahmen.style.display = '';
        gezeigt++;

        var farbe = STEM_FARBE[stem], n = reihe.length;
        var mitte = H / 2, oben = '', unten = '';
        for (var i = 0; i < n; i++){
          var x  = (i / (n - 1) * SPUR_W).toFixed(1);
          var hw = (reihe[i] / 255) * (mitte - pad);
          oben  += (i ? 'L' : 'M') + x + ' ' + (mitte - hw).toFixed(2) + ' ';
          unten  = 'L' + x + ' ' + (mitte + hw).toFixed(2) + ' ' + unten;
        }
        /* Flaeche gespiegelt, Kontur NUR OBEN (Caspar_D, 24.08.2026: "die
           helle topline nur oben, wie ganz oben in der Huellkurve").
           Dieselbe Entscheidung wie beim Chroma: Die Wellenform ganz oben
           faehrt ihre Kontur ringsum, weil sie allein steht - hier liegen
           sechs Spuren dicht uebereinander, und eine Kontur ringsum
           verdoppelt jede Linie, bis der Block zuwaechst. */
        host.innerHTML = spurBild(H, farbe,
          spurZug({ flaeche: oben + unten + 'Z', linie: oben }, farbe, { deckung: 0.45 }),
          { ohneTopline: true });

        /* Wieviel vom Stueck traegt diese Spur ueberhaupt? Ein Klavier,
           das nur im Refrain spielt, sieht man sonst erst beim Suchen. */
        var laut = 0;
        for (var k = 0; k < n; k++) if (reihe[k] > 38) laut++;   // 38/255 = -17 dB
        var titel = rahmen.querySelector('.spur-titel');
        if (titel){
          var inspAn = !!(window.stemInspektionStand && window.stemInspektionStand());
          titel.innerHTML =
              (inspAn ? '<span class="stemsolo" data-stem="' + stem + '" style="color:' + farbe + '"'
                + ' title="' + STEM_NAME[stem] + ' allein hören — nochmal klicken beendet es"></span>' : '')
            + '<span class="nam" style="color:' + farbe + '">' + STEM_NAME[stem] + '</span>'
            + ' — <span class="erkl">klingt in ' + Math.round(100*laut/n) + ' % des Stücks</span>';
          var kreis = titel.querySelector('.stemsolo');
          if (kreis){
            /* Der Titel wird bei jedem Aufbau neu gesetzt - der Blob
               muss sich also selbst wiederherstellen. */
            if (window.stemSoloName && window.stemSoloName() === stem) kreis.classList.add('an');
            kreis.onclick = (function(nm){ return function(e){
              e.stopPropagation();
              var f = (OPT && OPT.stemSolo) || window.stemSolo;
              if (f) f(nm);
            }; })(stem);
          }
        }
      }
      /* Das PANEL steht nur da, wenn auch Spuren da sind - eine
         Ueberschrift ohne Inhalt ist Laerm. Seit dem 25.08.2026 schaltet
         das die ganze Sektion, nicht mehr nur die Kopfzeile: Kopf,
         Spuren und Bildunterschrift liegen jetzt zusammen darin. */
      var panel = document.getElementById('spur-stems');
      if (panel) panel.style.display = gezeigt ? '' : 'none';
      var kopf = document.getElementById('spur-stem-kopf');
      if (kopf){
        var kt = kopf.querySelector('.spur-titel');
        if (kt && gezeigt){
          var an = !!(window.stemInspektionStand && window.stemInspektionStand());
          kt.innerHTML =
              '<span class="nam">Einzelspuren</span> — <span class="erkl">der Mix in '
            + gezeigt + ' Spuren zerlegt · Hüllkurve je Spur</span>'
            /* DIE PILLE (Caspar_D, 24.08.2026: "die 6 stems scheinen das
               System auf Trab zu halten"). Sechs FLAC-Stroeme mitlaufen
               zu lassen kostet dauerhaft Rechenzeit - auch wenn niemand
               hineinhoert. Deshalb werden sie erst geladen, wenn hier
               eingeschaltet wird; solange bleiben die Huellkurven zu
               sehen und der Ton kommt allein aus dem Mix. */
            + '<span class="stem-pille' + (an ? ' an' : '') + '" id="stem-pille"'
            + ' title="Lädt die sechs Spuren und macht die Solokreise anklickbar">'
            + 'Kanal-Inspektion</span>';
          var pille = kt.querySelector('#stem-pille');
          if (pille) pille.onclick = function(e){
            e.stopPropagation();
            if (window.stemInspektion) window.stemInspektion();
          };
        }
      }
    }

    function kopfFuellen(d){
      const setz = (id, wert) => { const el = document.getElementById(id); if (el) el.textContent = wert; };

      /* Die Karten werden immer gefüllt - sie sind Analyse. Titel,
         Bild und Prompts zeigt eingebettet die Bühne selbst, in ihrem
         eigenen Satz; dann bleibt der Kopf des Analyzers aus. */
      if (OPT.kopf !== false) document.getElementById('meta').style.display = 'block';
      setz('title', d.titel || '—');
      setz('meta-sub', [d.anzeigename, (d.erstellt||'').slice(0,10).split('-').reverse().join('.')]
                        .filter(Boolean).join(' · '));
      setz('v-model', d.modell || '—');
      toeneZeigen(d.toene);

      if (d.bild){
        const img = document.getElementById('artwork');
        img.src = d.bild; img.style.display = 'block';
        img.onload = function(){
          const ml = document.getElementById('meta-left');
          if (ml) document.getElementById('meta').style.setProperty('--meta-left-h', ml.offsetHeight + 'px');
        };
      }

      /* Der Stilprompt ist ein Satz, keine Liste - er wird an den Kommas
         geteilt, weil der Analyzer ihn als Marken zeigt. Der
         Ausschlussprompt kommt mit, sichtbar abgesetzt: Er sagt, was
         NICHT drin sein soll, und das ist beim Hören dieselbe Auskunft
         wert wie das Gewünschte. */
      const marken = [];
      for (const s of String(d.stilPrompt||'').split(',')) if (s.trim()) marken.push({t:s.trim(), aus:false});
      for (const s of String(d.stilAusschluss||'').split(',')) if (s.trim()) marken.push({t:s.trim(), aus:true});
      const tg = document.getElementById('tags');
      if (tg) tg.innerHTML = marken.map(m =>
        '<span class="tag"' + (m.aus ? ' style="opacity:.55;text-decoration:line-through" title="ausgeschlossener Stil"' : '') +
        '>' + m.t.replace(/[<&]/g, c => c === '<' ? '&lt;' : '&amp;') + '</span>').join('');

      if (d.plays != null){
        setz('v-plays', Number(d.plays).toLocaleString('de-DE'));
        setz('v-likes', d.likes != null ? Number(d.likes).toLocaleString('de-DE') : '—');
        setz('v-comments', d.kommentare != null ? Number(d.kommentare).toLocaleString('de-DE') : '—');
        setz('v-ratio', d.likes > 0 ? Math.round(d.plays / d.likes) : '—');
      }
      if (d.erstellt){
        const tage = Math.floor((Date.now() - new Date(d.erstellt)) / 86400000);
        setz('v-age', tage > 365 ? Math.floor(tage/365) + 'J ' + (tage%365) + 'd' : tage + 'd');
        if (d.plays != null && tage > 0) setz('v-ppd', Math.round(d.plays / tage).toLocaleString('de-DE'));
      }
      if (d.lyrics){
        const lw = document.getElementById('lyrics-wrap'), lb = document.getElementById('lyrics-body');
        if (lw && lb){ lw.style.display = 'block'; lb.textContent = d.lyrics; }
      }
    }

    /* Brücke für die Inline-Handler des Markups. Sie ist seit dem
       Stilllegen fast leer - übrig sind nur die Handler der Teile, die
       auch eingebettet sichtbar bleiben. Die übrigen Einträge stehen
       weiter drin, weil das ausgeblendete Markup sie noch nennt. */
    window.__SA = {
      /* 'player' gab das eigene Audioelement heraus. Es gibt keines
         mehr - wer den Ton steuern will, steuert den der Buehne. */
      seekStart: typeof seekStart === 'function' ? seekStart : function(){},
      analyzeFile: typeof analyzeFile === 'function' ? analyzeFile : function(){},
      togglePlay: typeof togglePlay === 'function' ? togglePlay : function(){},
      resetZoom: typeof resetZoom === 'function' ? resetZoom : function(){},
    };

    return {
      quelle: quelleSetzen,
      /* Nur eine Adresse, ohne Katalogeintrag - der Merker muss weg,
         sonst trüge der neue Song den Kopf des vorigen. */
      analyzeUrl(src, titel, bild){ _katalogDaten = null; return analyzeUrl(src, titel, bild); },
      /* Ein Song aus dem Katalog.

         Gefüllt wird NICHT hier, sondern unten in analyzeFile() - dort
         werden zuerst alle Karten auf "—" zurückgesetzt, und ein vorher
         gefüllter Kopf wäre still wieder leer gewesen. Genau das ist
         beim ersten Versuch passiert. */
      song(d){
        _katalogDaten = d;
        _laufendeId = d.id || null;
        /* ERST IN DIE ABLAGE SCHAUEN. Liegt der Song dort, wird der
           Mitschnitt abgespielt - 0,4 s statt 16,9. Fehlt er oder ist
           er von einem anderen Stand, wird gerechnet UND danach
           abgelegt. */
        return ablageSpielenOderRechnen(d);
      },
      /* Die Beschriftungen des Stemblocks neu setzen - dort haengen die
         Pille und die Solokreise, und beide haengen an einem Zustand,
         den die Buehne kennt, nicht der Analyzer. */
      stemsZeichnen(t){ stemSpurenZeichnen(t); },
      anhalten(){
        laeuft = false;
        for (const id of bilder) window.cancelAnimationFrame(id);
        bilder.clear();
        if (window._activeWorker){ window._activeWorker.terminate(); window._activeWorker = null; }
        /* Den Analyser vom fremden Graphen lösen. Bliebe er hängen,
           sammelten sich bei jedem Moduswechsel weitere an - und alle
           zögen weiter Rechenzeit am Ton der Bühne. */
        if (_densityAnalyser){ try{ _densityAnalyser.disconnect(); }catch(e){} _densityAnalyser = null; }
        window._spektroPuffer=null;
        window._pufferFlaechen=null;
      },
    };
  }
})();
