/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   ES FEHLT ETWAS, DAS DIE EINRICHTUNG HOLT - LAUT MELDEN, ROT ENDEN
   bin/fehlt.js

   Caspar_D, 28.10.2026: „Alles was nötig ist, wird im Setup gemacht. Wir machen gar nichts hinterher, das ist
   Kraut-und-Rüben-Code. Und ich will, dass nichts im Verborgenen stattfindet."

   Bis dahin holten einzelne Programme fehlende Modelle und Pakete still selbst nach (gesichter.js, feder.js,
   karte.js, der Morgenschritt „Whisper bereitstellen"), oder sie sagten „übersprungen" und endeten grün - der
   Morgenlauf sah gut aus, obwohl die Einrichtung unvollständig war. Jetzt gibt es genau eine Stelle, die
   installiert: die Einrichtung - und danach, auf Knopfdruck und mit Balken, der Tab „System" im Profil
   (bin/system.js). Alle anderen melden hier, was fehlt, nennen den Weg dorthin und enden mit Code 3: im
   Morgenfenster wird der Schritt rot, der Lauf geht weiter.
   ============================================================= */
'use strict';
const { T } = require('./sprache.js');

const CODE = 3;

/* was: wofür (z. B. „Instrumentspuren"); dinge: Liste der fehlenden Dateien oder Pakete */
function fehlt(was, dinge) {
  console.log('  ' + T('{was}: es fehlt {liste}.', { was, liste: [].concat(dinge).join(', ') }));
  console.log('  ' + T('Holen: Profil → System. Dort steht, was fehlt, und ein Knopf holt es.'));
  process.exit(CODE);
}

module.exports = { fehlt, CODE };
