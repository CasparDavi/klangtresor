/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   ZAHLEN STATT SAETZE — DIE MELDEZEILE
   bin/melden.js

   Caspar_D, 13.09.2026: „Es war Sinn der Sache, alles in JS auszugeben
   und nicht einfach Textausgaben umzubiegen. Ich wollte echte
   Fortschrittsbalken pro Schritt. Wieso hast du eine Textbox ins JS
   gebaut, die nur die cmd-Ausgaben zitiert, das ist Kaese so."

   Er hat recht: Eine Oberflaeche, die den Konsolentext spiegelt, ist
   eine haesslichere Konsole. Ein Balken braucht ZAHLEN. Die kennen aber
   nur die Kinderskripte (sammeln, laden, uebernehmen, modelle-holen),
   und sie schreiben sie bisher nur als Prosa.

   Also melden sie sie zusaetzlich maschinenlesbar: eine Zeile, die mit
   @@KT beginnt, dahinter JSON. bin/einrichten.js fischt diese Zeilen aus
   dem Ausgabestrom (sie erscheinen NICHT auf der Konsole) und macht
   daraus den Zustand, aus dem die Seite ihre Balken, Haken und Kacheln
   malt. Die Konsole behaelt daneben ihre Saetze - sie bleibt der
   Rueckfall.

   NUR AUF ANFRAGE. Ohne KT_MELDEN=1 in der Umgebung tut melden() gar
   nichts. Damit aendert sich fuer den Morgenlauf, fuer den Server und
   fuer jeden, der ein Skript von Hand startet, kein einziges Zeichen -
   und ein Fehler hier kann dort nichts kaputt machen.

   Die Formen (mehr gibt es nicht):

     {lauf:{was, n, von, bytes, gesamt, quelle}}   ein Balken; null loescht ihn
     {zeile:{id, text, wert, art}}                 eine Haken-/Teilzeile
     {kachel:{name, wert}}                         eine Ergebniszahl
     {titel:{text, neben}}                         ein Titel, der durchlaeuft

   n/von sind Stueckzahlen (Seite 8 von 13), bytes/gesamt sind Bytes.
   art ist 'laeuft' | 'fertig' | 'offen' | 'wink'.
   ============================================================= */
'use strict';

const AN = process.env.KT_MELDEN === '1';

function melden(was) {
  if (!AN) return;
  try { process.stdout.write('@@KT ' + JSON.stringify(was) + '\n'); } catch (e) {}
}

/* Bequemlichkeiten - dieselbe Zeile, nur kuerzer geschrieben. */
melden.lauf   = (o) => melden({ lauf: o });
melden.ausLauf = () => melden({ lauf: null });
melden.zeile  = (id, text, wert, art) => melden({ zeile: { id, text, wert, art: art || 'fertig' } });
melden.kachel = (name, wert) => melden({ kachel: { name, wert } });
melden.titel  = (text, neben) => melden({ titel: { text, neben } });
melden.an     = AN;

module.exports = melden;
