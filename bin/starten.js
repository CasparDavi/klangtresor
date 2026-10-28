#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   KLANGTRESOR STARTEN - DER WEG HINTER DER VERKNUEPFUNG
   bin/starten.js

   Caspar_D, 13.09.2026: „um den Server zu starten, soll das Setup einen
   Link auf den Desktop legen, immer ... der Link startet den Server und
   ruft den Browser, praeferenziell Chrome, auf mit Fallback auf den
   Systembrowser, und zeigt die Uebersicht."

   Drei Dinge, in dieser Reihenfolge:
     1. Server starten - in der Schleife aus bin/server-start.sh: endet
        er mit Code 75 (er hat sich selbst neu starten wollen, weil sich
        eine Datei geaendert hat), kommt er sofort wieder
     2. warten, bis er auf 8788 antwortet
     3. Browser auf, Chrome wenn da, sonst der des Systems

   Das Fenster bleibt offen - es IST der Server. Schliessen beendet ihn.
   ============================================================= */
'use strict';
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { seiteAufmachen } = require('./browser.js');
const { T, sprache } = require('./sprache.js');
/* Ein Klick ins Fenster darf den Server nicht anhalten: bin/konsole.js. */
require('./konsole.js').quickEditAus();

const WURZEL = path.resolve(__dirname, '..');
const ADRESSE = 'http://localhost:8788/';
process.chdir(WURZEL);
/* ffmpeg aus dem Werkzeugordner, wie die Starter es tun */
const ff = path.join(WURZEL, 'werkzeug', 'ffmpeg', 'bin');
if (require('node:fs').existsSync(ff)) process.env.PATH = ff + path.delimiter + process.env.PATH;

let geoeffnet = false;
function antwortet(dann) {
  const r = http.get(ADRESSE, (a) => { a.resume(); dann(a.statusCode === 200); });
  r.on('error', () => dann(false));
  r.setTimeout(1500, () => { r.destroy(); dann(false); });
}
function browserSobaldDa(versuch = 0) {
  if (geoeffnet || versuch > 60) return;
  antwortet((ja) => {
    if (ja) { geoeffnet = true; const chrome = seiteAufmachen(ADRESSE + '?sprache=' + sprache());
      console.log('\n' + (chrome ? T('  KlangTresor ist auf {adresse} — Browser geht auf (Chrome).', { adresse: ADRESSE })
        : T('  KlangTresor ist auf {adresse} — Browser geht auf.', { adresse: ADRESSE })) + '\n'); }
    else setTimeout(() => browserSobaldDa(versuch + 1), 500);
  });
}
function server() {
  const k = spawn(process.execPath, [path.join('server', 'server.js')], { cwd: WURZEL, stdio: 'inherit' });
  k.on('close', (code) => {
    if (code === 75) { setTimeout(server, 200); return; }
    process.exit(code == null ? 1 : code);
  });
}
/* FEHLT ETWAS, SAGT DER START ES - HOLEN TUT ER NICHTS (28.10.2026). Der Server selbst braucht keine Pakete und keine
   Modelle; ohne sie werden spaeter einzelne Morgenschritte rot. Der Start nennt es gleich und den Weg: Profil → System,
   dort steht ein Knopf. (1.0.129 holte hier die Pakete still nach - Caspar_D: „wir machen gar nichts hinterher".) */
try {
  require('./system.js').stand({ ohnePlatz: true }).then((s) => {
    const fehlt = [...s.werkzeuge, ...s.modelle].filter(x => !x.da).map(x => x.id);
    if (fehlt.length) console.log('\n' + T('  Es fehlt: {namen}. Holen: Profil → System.', { namen: fehlt.join(', ') }) + '\n');
  }).catch(() => {});
} catch (e) {}
server();
/* --ohne-browser: die Einrichtung startet den Server ueber diesen Starter und hat die Seite schon geoeffnet */
if (!process.argv.includes('--ohne-browser')) browserSobaldDa();
