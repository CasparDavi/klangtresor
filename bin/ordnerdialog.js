/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   DER ORDNERDIALOG DES SYSTEMS
   bin/ordnerdialog.js

   Caspar_D, 13.09.2026, zweimal: „ich bestehe auf einem Filechooser,
   der einen Ordner auswaehlen kann." Ein DAU scheitert an
   Schraegstrichen, relativen und absoluten Pfaden - also bekommt er den
   Dialog, den er kennt. Jedes System bringt einen mit:

     macOS    osascript, choose folder
     Windows  System.Windows.Forms.FolderBrowserDialog (PowerShell -STA)
     Linux    zenity --file-selection --directory, sonst kdialog

   Gebraucht von bin/einrichten.js (Wohin?) und server/server.js
   (POST /api/ordner/dialog fuer die Seite, nur vom selben Rechner aus -
   ein Dialog auf dem Server-Bildschirm nuetzt dem Handy nichts).

   Gibt den gewaehlten Pfad zurueck, oder null bei Abbruch oder wenn
   kein Dialog aufgehen kann (kein Bildschirm, zenity fehlt).
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function da(befehl) {
  const e = spawnSync(process.platform === 'win32' ? 'where' : 'which', [befehl], { stdio: 'pipe', encoding: 'utf8' });
  return e.status === 0 ? String(e.stdout).split('\n')[0].trim() || null : null;
}

function ordnerWaehlen(vorgabe, titel) {
  titel = titel || 'Ordner wählen';
  try {
    if (process.platform === 'darwin') {
      const s = `try
set d to choose folder with prompt ${JSON.stringify(titel)} default location POSIX file ${JSON.stringify(vorgabe)}
POSIX path of d
end try`;
      const e = spawnSync('osascript', ['-e', s], { encoding: 'utf8' });
      const w = String(e.stdout || '').trim();
      return w || null;
    }
    if (process.platform === 'win32') {
      const ps = [
        'Add-Type -AssemblyName System.Windows.Forms',
        '$d = New-Object System.Windows.Forms.FolderBrowserDialog',
        `$d.Description = ${JSON.stringify(titel)}`,
        `$d.SelectedPath = ${JSON.stringify(vorgabe)}`,
        '$d.ShowNewFolderButton = $true',
        "if ($d.ShowDialog() -eq 'OK') { $d.SelectedPath }",
      ].join('; ');
      const e = spawnSync('powershell', ['-NoProfile', '-STA', '-Command', ps], { encoding: 'utf8' });
      const w = String(e.stdout || '').trim();
      return w || null;
    }
    for (const [bef, args] of [['zenity', ['--file-selection', '--directory', '--title', titel, '--filename', vorgabe + '/']],
                               ['kdialog', ['--getexistingdirectory', vorgabe]]]) {
      if (!da(bef)) continue;
      const e = spawnSync(bef, args, { encoding: 'utf8' });
      const w = String(e.stdout || '').trim();
      if (w) return w;
    }
  } catch (e) {}
  return null;
}

module.exports = { ordnerWaehlen };
