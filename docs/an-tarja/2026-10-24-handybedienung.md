# An Tarja: KlangTresor wird handytauglich

*24.10.2026, von Caspar_D (geschrieben mit Claude)*

Hallo Tarja,

KlangTresor bekommt eine eigene Handyansicht. Ziel ist, auf dem Sofa Musik zu hören, im Hoch- wie im Querformat, und das
Handy auf den Fernseher zu spiegeln. Tablets bleiben, wie sie sind.

**Wir haben uns dafür KlangDroid angesehen und übernehmen einiges von dir, danke:**
- den Mini-Player als ganze antippbare Leiste mit der dünnen Fortschrittslinie oben,
- das Bewegtbild in der Kachel des laufenden Titels,
- das abgedunkelte Titelbild als Hintergrund des großen Players,
- den Fortschrittsregler, der erst beim Loslassen springt,
- im Schaum: Suche und Filter weg, Steuerung als waagrecht scrollende Pillen, Beschriftung erst ab einer Mindestgröße.

**Der Plan, in vier Releases:**
1. Grundgerüst: Umgeschaltet wird nach dem sichtbaren Seitenbereich (kürzere Seite unter 520 px, Bedienung mit dem
   Finger), schmale Kopfzeile, Werke/Alben/Räume als Pillen, Filter als Blatt von unten, 3 Spalten hoch und 6 quer.
2. Mini-Player und „Jetzt läuft“: Titelbild groß, Wischen zum Bewegtbild, Lautstärke als Symbol mit senkrechtem Regler.
3. Querformat, Fernseher und Bühne: Vollbild, Karaoke so groß, dass man es vom Sofa aus liest; die Knöpfe blenden sich aus.
4. Räume: Zoom mit zwei Fingern im Schaum (alle Titel bleiben drin, kleine Zellen sind erst nach dem Hineinzoomen
   antippbar) und im Klangraum (der Tipp nimmt den nächsten Stern).

Danach versuchen wir, KlangTresor auch ohne Adresszeile auf den Startbildschirm zu legen.

**Zwei Dinge, die KlangDroid betreffen:**
- An der Schnittstelle, die KlangDroid benutzt (`/api/index`, `/media/<id>/…`), ändern wir dabei nichts. Falls doch
  einmal nötig, sagen wir es vorher hier.
- In KlangDroid liegt eine Kopie von `foamtree.js` mit Stand vom 12.10. Wenn du sie auffrischen willst: Die Quelle bleibt
  `web/klangschaum/foamtree.js` im KlangTresor.

Wenn dir zur Handybedienung etwas auffällt oder du andere Ideen hast, schreib es gern dazu oder sag es mir.

Jörg (Caspar_D)
