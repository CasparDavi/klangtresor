/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   WO DIE KI-MODELLE LIEGEN - EIN ORT, VOM NUTZER WAEHLBAR
   bin/modellordner.js

   Caspar_D, 28.10.2026: „wir fragen den Nutzer, ob er einen Ort für seine KI-Modelle hat, da packen wir alle anderen
   dazu, gibt er nichts an, dann wandert alles unter KlangTresor/modelle" - und: „ggf. nehme ich den ganzen
   Modelle-Ordner und werfe ihn mal irgendwo anders hin und sage dann, wo der Modellordner hingekommen ist."

   Also genau EIN Ordner fuer alle Modelle, Whisper eingeschlossen:
     - steht in library/konfig.json „modellOrdner", gilt der (gesetzt von der Einrichtung oder im Profil → System)
     - sonst <KlangTresor>/modelle/
     - im Docker-Container immer /app/modelle: dort ist der Ordner des Rechners eingebunden (docker/.env,
       KT_MODELLE), ein Pfad des Rechners aus konfig.json gaebe es im Container nicht.

   Bis 28.10.2026 lagen die Modelle in library/modelle/ - mitten im Archiv, das man sichert, obwohl sich jedes Modell
   neu holen laesst. umziehen() verschiebt sie einmal an den neuen Ort (Einrichtung und Update rufen es, sichtbar).
   Kopiert wird nie: Caspar_D, „ich kann nicht einfach mal 30 GB verschenken".

   Kein Symlink: die SSD vieler Nutzer ist exFAT (kennt keine), Windows verlangt dafuer Verwalterrechte, und im
   Container zeigte er ins Leere. Der Eintrag in konfig.json ist der Verweis, den KlangTresor selbst aufloest.
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..');
const KONFIG = path.join(WURZEL, 'library', 'konfig.json');
const VORGABE = path.join(WURZEL, 'modelle');
const ALT = path.join(WURZEL, 'library', 'modelle');
const imContainer = () => process.env.KLANGTRESOR_CONTAINER === '1' || fs.existsSync('/.dockerenv') || fs.existsSync('/run/.containerenv');

const konfig = () => { try { return JSON.parse(fs.readFileSync(KONFIG, 'utf8')) || {}; } catch (e) { return {}; } };

/* Der Ordner der Modelle - absolut. */
function modellOrdner() {
  if (imContainer()) return VORGABE;
  const k = konfig().modellOrdner;
  return k ? path.resolve(WURZEL, k) : VORGABE;
}
/* Eigener Ordner (null = zurueck zur Vorgabe). Es wird nichts verschoben - nur gemerkt, wo die Modelle jetzt liegen. */
function modellOrdnerSetzen(ordner) {
  const k = konfig();
  if (ordner && path.resolve(ordner) !== VORGABE) k.modellOrdner = path.resolve(ordner); else delete k.modellOrdner;
  fs.mkdirSync(path.dirname(KONFIG), { recursive: true });
  fs.writeFileSync(KONFIG + '.neu', JSON.stringify(k, null, 1));
  fs.renameSync(KONFIG + '.neu', KONFIG);
  return modellOrdner();
}
const eigenerOrdner = () => !imContainer() && !!konfig().modellOrdner;

/* Die Modelle aus library/modelle/ an ihren Ort bringen - verschieben, nie kopieren. sag: Ausgabe einer Zeile.
   Liegt am Ziel schon dieselbe Datei, bleibt die alte liegen und wird genannt; geloescht wird hier nichts. */
function umziehen(sag = (t) => console.log(t)) {
  let eintraege = [];
  try { eintraege = fs.readdirSync(ALT).filter(n => !n.startsWith('._') && n !== '.DS_Store'); } catch (e) { return 0; }
  const ziel = modellOrdner();
  if (path.resolve(ziel) === path.resolve(ALT)) return 0;
  fs.mkdirSync(ziel, { recursive: true });
  let n = 0; const geblieben = [];
  for (const name of eintraege) {
    const von = path.join(ALT, name), nach = path.join(ziel, name);
    if (fs.existsSync(nach)) { geblieben.push(name); continue; }
    try { fs.renameSync(von, nach); n++; }
    catch (e) {
      /* Auf eine andere Platte - oder im Container von einem eingebundenen Ordner in den anderen - geht Umbenennen
         nicht (EXDEV). Dann wird kopiert, verglichen und das Alte erst danach geloescht: am Ende liegt jede Datei
         wieder genau einmal da. */
      if (e.code !== 'EXDEV' || !fs.statSync(von).isFile()) { geblieben.push(name + ' (' + e.code + ')'); continue; }
      try {
        fs.copyFileSync(von, nach + '.teil');
        if (fs.statSync(nach + '.teil').size !== fs.statSync(von).size) throw new Error('Groesse');
        fs.renameSync(nach + '.teil', nach); fs.unlinkSync(von); n++;
      } catch (e2) { try { fs.unlinkSync(nach + '.teil'); } catch (e3) {} geblieben.push(name + ' (' + (e2.code || e2.message) + ')'); }
    }
  }
  for (const f of fs.readdirSync(ALT)) if (f.startsWith('._')) { try { fs.unlinkSync(path.join(ALT, f)); } catch (e) {} }
  try { if (!fs.readdirSync(ALT).length) fs.rmdirSync(ALT); } catch (e) {}
  if (n) sag(`  KI-Modelle verschoben: ${n} Datei(en) von library/modelle/ nach ${ziel}`);
  if (geblieben.length) sag(`  In library/modelle/ geblieben (am Ziel schon da oder nicht verschiebbar): ${geblieben.join(', ')}`);
  return n;
}

module.exports = { modellOrdner, modellOrdnerSetzen, eigenerOrdner, umziehen, VORGABE, imContainer };
