#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   EIN AUFTRAG AUS DEM TAB „SYSTEM" - HOLEN ODER UPDATE
   bin/auftrag.js

     node bin/auftrag.js <id> -- <skript> [argumente] [-- <skript> [argumente] …]

   Mehrere Befehle laufen nacheinander („Alles Fehlende holen"); scheitert einer, laufen die anderen trotzdem,
   und der Rueckgabewert ist der erste ungleich 0.

   Caspar_D, 28.10.2026: „ich will Progressbars für alles, was von remote kommt" und „dass nichts im Verborgenen
   stattfindet". Der Tab startet Holen und Update nicht selbst, sondern ueber diesen kleinen Rahmen:

     - er laeuft LOSGELOEST vom Server. Das Update ersetzt server.js, der Server startet dabei neu - haenge der
       Auftrag an ihm, stuerbe er mitten im Einspielen. Seine Ausgabe geht in library/auftrag.log, nicht in eine
       Leitung zum Server, die beim Neustart risse.
     - er schreibt Anfang, Ende und Rueckgabewert nach library/auftrag.json. Daraus und aus den @@KT-Zeilen im
       Protokoll (bin/melden.js) liest der Server den Stand fuer den Balken - auch der neu gestartete.
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const DATEI = path.join(__dirname, '..', 'library', 'auftrag.json');
const lesen = () => { try { return JSON.parse(fs.readFileSync(DATEI, 'utf8')); } catch (e) { return {}; } };
const schreiben = (d) => { fs.writeFileSync(DATEI + '.neu', JSON.stringify(d, null, 1)); fs.renameSync(DATEI + '.neu', DATEI); };

const befehle = [];
for (const a of process.argv.slice(2)) { if (a === '--') befehle.push([]); else if (befehle.length) befehle[befehle.length - 1].push(a); }
if (!befehle.length || befehle.some(b => !b.length)) { console.error('auftrag.js: kein Befehl'); process.exit(2); }

schreiben({ ...lesen(), pid: process.pid, ende: null, code: null });
let code = 0;
for (const befehl of befehle) {
  const r = spawnSync(process.execPath, befehl, { cwd: path.join(__dirname, '..'), stdio: 'inherit',
    env: { ...process.env, KT_MELDEN: '1', KT_AUFTRAG: '1' }, windowsHide: true });
  const c = r.status == null ? 1 : r.status;
  if (c && !code) code = c;
}
schreiben({ ...lesen(), ende: new Date().toISOString(), code });
process.exit(0);
