/* DIE STELLSCHRAUBEN - alles, woran man drehen kann, an einer Stelle.
   Jede Zeile sagt, was sie tut und in welche Richtung. */
module.exports = {

  /* ---- Was der Schlag mit dem Bild macht ---------------------------- */

  zoomTiefe:   0.050,  /* Wie stark das Bild auf einen Schlag anschwillt.
                          0.05 = 5 % groesser im Moment des Schlags.
                          Groesser = deutlicher, ab etwa 0.10 wird es
                          zum Zappeln. 0 schaltet den Zoom ab. */

  abklingen:   7.0,    /* Wie schnell der Schlag wieder abfaellt, in 1/s.
                          7 heisst: nach 0,1 s ist die Haelfte weg, nach
                          0,4 s ist er vorbei. Kleiner = traeger, das
                          Bild "haengt nach". Groesser = knackiger,
                          einzelne Stoesse. */

  vorlauf:     0.020,  /* Wieviel frueher der Zoom anspringt, in
                          Sekunden. Ein Bild bei 25 fps sind 0,04 s -
                          ein kleiner Vorlauf laesst den Schlag auf den
                          Punkt sitzen statt einen Wimpernschlag zu
                          spaet. */

  /* ---- Welche Schlaege ueberhaupt zaehlen --------------------------- */

  nurEins:     false,  /* true = nur die Eins jedes Takts, false = jeder
                          Schlag. Bei schnellen Stuecken ist jeder Schlag
                          Zappeln; die Eins allein wirkt ruhiger und
                          musikalischer. Suno liefert die Zaehlzeit mit. */

  /* ---- Farbe -------------------------------------------------------- */

  farbTiefe:   0.55,   /* Wie stark die Akzentfarbe das Bild einfaerbt.
                          0 = das Cover bleibt, wie es ist. 1 = voll
                          monochrom, das Bild ist nur noch Struktur.
                          0,55 laesst das Motiv erkennbar. */

  wechselTakte: 2,     /* Nach wievielen Takten die Farbe umschlaegt.
                          1 = jeder Takt, 4 = alle vier. Kleiner =
                          hektischer. Auf jeden SCHLAG zu wechseln waere
                          Stroboskop - deshalb zaehlt das hier Takte. */

  blende:      0.35,   /* Wie lange ein Farbwechsel dauert, als Anteil
                          eines Takts. 0 = harter Schnitt auf den Schlag,
                          1 = die Farbe wandert durchgehend. */

  mindestAbstand: 30,  /* Ab welchem Farbtonabstand (Grad) die beiden
                          Akzentfarben als "verschieden genug" gelten.
                          Darunter wird die zweite gedreht - sonst
                          passiert bei der Haelfte der Songs sichtbar
                          nichts. Auf 0 gesetzt heisst: immer die echten
                          Palettenfarben nehmen, auch wenn der Wechsel
                          kaum auffaellt. */

  drehung:     150,    /* Um wieviel Grad die zweite Farbe gedreht wird,
                          wenn die Palette keinen Abstand hergibt.
                          180 = Komplementaerfarbe (haerteste Wirkung),
                          120 = Dreiklang, 150 = dazwischen. */

  /* ---- Das Format --------------------------------------------------- */

  dauer:       10,     /* Sekunden. NICHT hoeher setzen: Suno lehnt
                          laengere Dateien als Cover-Art-Video ab
                          (Caspar_D, 27.08.2026). */
  fps:         25,
  kante:       900,    /* Kantenlaenge des Videos in Pixeln. */
};
