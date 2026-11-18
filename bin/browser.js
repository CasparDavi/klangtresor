/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   DEN BROWSER OEFFNEN - CHROME, WENN ES DA IST, SONST DEN DES SYSTEMS
   bin/browser.js

   Caspar_D, 13.09.2026: „der Link startet den Server und ruft den
   Browser, praeferenziell Chrome, auf mit Fallback auf den
   Systembrowser." Chrome, weil nur dort das Lesezeichen fuer die nur
   dem Nutzer zugaenglichen Daten laeuft. Gebraucht von bin/einrichten.js
   und bin/starten.js - deshalb hier einmal.
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

function da(befehl) {
  const e = spawnSync(process.platform === 'win32' ? 'where' : 'which', [befehl], { stdio: 'pipe', encoding: 'utf8' });
  return e.status === 0 ? String(e.stdout).split('\n')[0].trim() || null : null;
}

function chromeFinden() {
  if (process.platform === 'win32') {
    return ['ProgramFiles', 'ProgramFiles(x86)', 'LOCALAPPDATA']
      .map((v) => process.env[v]).filter(Boolean)
      .map((b) => path.join(b, 'Google', 'Chrome', 'Application', 'chrome.exe'))
      .find((p) => fs.existsSync(p)) || null;
  }
  if (process.platform === 'darwin') return fs.existsSync('/Applications/Google Chrome.app') ? 'Google Chrome' : null;
  return ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'].find((n) => da(n)) || null;
}

/* WIE DAS DING HEISST, DAS WIR GEFUNDEN HABEN (18.11.2026).

   Beim Installationstest in der Ubuntu-VM meldete die Einrichtung „KlangTresor
   geht in Chrome auf", obwohl dort kein Chrome installiert ist. chromeFinden()
   hatte `chromium` aus dem Snap-Paket unter /snap/bin genommen - ein anderes
   Programm, und die Meldung nannte es Chrome.

   Das Verhalten bleibt, wie Caspar_D es will: „natuerlich soll er chrome starten
   wenn er da ist, nur wenn chrome/chromium nicht da sind, soll er den
   Standardbrowser nehmen." Nur der Name wird jetzt mitgegeben, damit die Meldung
   sagen kann, was wirklich aufgeht. */
function nameVon(pfad) {
  if (!pfad) return null;
  const n = String(pfad).toLowerCase();
  return /chromium/.test(n) ? 'Chromium' : 'Chrome';
}

/* Gibt den NAMEN des genommenen Chrome-artigen Browsers zurueck ('Chrome' oder
   'Chromium'), oder null, wenn der Standardbrowser des Systems aufgeht. */
function seiteAufmachen(adresse) {
  const chrome = chromeFinden();
  const w = chrome
    ? (process.platform === 'darwin' ? ['open', ['-a', chrome, adresse]] : [chrome, [adresse]])
    : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', adresse]]
      : process.platform === 'darwin' ? ['open', [adresse]]
        : ['xdg-open', [adresse]];
  try { spawn(w[0], w[1], { stdio: 'ignore', detached: true }).unref(); } catch (e) {}
  return nameVon(chrome);
}

module.exports = { chromeFinden, nameVon, seiteAufmachen, da };
