#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   DAS MEDIUM UNTER EINEM PFAD - AUF ALLEN DREI SYSTEMEN
   bin/medium.js

   Wieviel Platz ist da, welches Dateisystem liegt darunter, und laesst sich
   darauf schreiben? Drei Fragen, die der Export (bin/export.js) und das
   Register „Mobiler KlangTresor" (server/server.js) beide stellten - jeder
   mit eigenem `df` und eigenem `mount`, und beide damit nur auf Mac und
   Linux. Auf Windows gibt es weder das eine noch das andere; Apex' Export
   (17.11.2026) kam dort nicht durch.

   PLATZ OHNE FREMDPROGRAMM. fs.statfsSync() gibt es seit Node 18, und die
   App verlangt ohnehin Node 20. Gegen `df -k` gemessen am 17.11.2026, auf
   drei Orten deckungsgleich bis auf die Bytes, die sich zwischen zwei
   Aufrufen aendern. Genommen wird bavail - das ist, was df als „Avail"
   zeigt, also der Platz fuer uns und nicht der fuer root.

   OB SICH SCHREIBEN LAESST, WIRD PROBIERT, NICHT GELESEN. Vorher wurden die
   Optionen der mount-Zeile nach „read-only" durchsucht. Das beantwortet die
   Frage nur mittelbar: ein NTFS-Stick am Mac mit fremdem Treiber steht als
   beschreibbar in der Zeile und ist es doch nicht immer, und auf Windows
   gibt es die Zeile gar nicht. Eine Datei anzulegen und wieder zu loeschen
   beantwortet genau das, was der Export wissen muss.

   DEN NAMEN DES DATEISYSTEMS kennt nur das System selbst:
     Mac und Linux  mount-Ausgabe (der Einhaengepunkt kommt von df - siehe
                    dateisystem() unten, dort steht die Firmlink-Falle)
     Windows        PowerShell Get-Volume, Rueckfall fsutil
   Gebraucht wird er fuer die Hinweise (FAT32-Grenze, NTFS am Mac) und fuer
   die Tabelle kompatibilitaet() im Server - nicht fuer die Frage, ob der
   Export laufen kann. Die beantwortet beschreibbar().

   Von Hand:  node bin/medium.js <pfad>
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

/* Der naechste Ordner, den es schon gibt - das Ziel selbst gibt es beim ersten
   Export noch nicht. */
function vorhandenerTeil(pfad) {
  let da = path.resolve(pfad);
  while (da !== path.dirname(da) && !fs.existsSync(da)) da = path.dirname(da);
  return da;
}

/* Die Wurzel des Mediums: /Volumes/STICK, /media/x/STICK, K:\ … Faellt auf / bzw.
   den Pfad selbst zurueck. */
function laufwerkWurzel(pfad) {
  const m = String(pfad).match(/^(\/Volumes\/[^/]+|\/media\/[^/]+\/[^/]+|\/media\/[^/]+|\/mnt\/[^/]+|\/run\/media\/[^/]+\/[^/]+|[A-Za-z]:\\?)/);
  return m ? m[1] : (String(pfad).startsWith('/') ? '/' : pfad);
}

/* { gesamt, frei } in Bytes, oder null-Werte, wenn das System schweigt. */
function platz(pfad) {
  try {
    const s = fs.statfsSync(vorhandenerTeil(pfad));
    return { gesamt: Number(s.blocks) * Number(s.bsize) || null, frei: Number(s.bavail) * Number(s.bsize) || null };
  } catch (e) { return { gesamt: null, frei: null }; }
}

/* Laesst sich dort schreiben? { ok, grund }. Die Probe liegt im naechsten
   vorhandenen Ordner und ist sofort wieder weg; der Name traegt die eigene
   Prozessnummer, damit zwei Laeufe sich nicht begegnen. */
function beschreibbar(pfad) {
  const ordner = vorhandenerTeil(pfad);
  const probe = path.join(ordner, '.klangtresor-schreibprobe-' + process.pid);
  try {
    fs.writeFileSync(probe, 'x');
    try { fs.unlinkSync(probe); } catch (e) { /* geschrieben ist geschrieben */ }
    return { ok: true, grund: null };
  } catch (e) { return { ok: false, grund: (e && e.code) || String(e) }; }
}

/* ---------------------------------------------------------------- Dateisystem */
/* Mac und Linux: die mount-Ausgabe. Auf dem Mac steht dort
   "/dev/disk2s1 on /Volumes/INTENSO (exfat, local, nodev, ...)", unter Linux
   "/dev/sdb1 on /media/x/STICK type vfat (rw,...)".

   DEN EINHAENGEPUNKT NENNT df, NICHT DIE LAENGSTE PASSENDE ZEILE: auf dem Mac
   liegt /Users ueber einen Firmlink auf /System/Volumes/Data, und die
   Praefixsuche faende das versiegelte "/" (apfs, read-only) - ein Export auf
   den Schreibtisch braeche grundlos ab (09.09.2026, beim Pruefen gesehen).
   Die Praefixsuche bleibt als Rueckfall, wenn df schweigt. */
function unixDateisystem(pfad) {
  const da = vorhandenerTeil(pfad);
  let punktDf = null;
  { const df = (spawnSync('df', ['-P', da], { encoding: 'utf8' }).stdout || '').trim().split('\n').pop() || '';
    const m = df.match(/^(.*?)\s+\d+\s+\d+\s+\d+\s+\d+%\s+(.+?)\s*$/); if (m) punktDf = m[2]; }
  const aus = (spawnSync('mount', [], { encoding: 'utf8' }).stdout || '');
  let bester = null;
  for (const z of aus.split('\n')) {
    const m = z.match(/^(.+?) on (.+?)(?: type (\S+))? \(([^)]*)\)\s*$/);
    if (!m) continue;
    const punkt = m[2];
    if (punktDf ? punkt !== punktDf : (da !== punkt && !da.startsWith(punkt.endsWith('/') ? punkt : punkt + '/'))) continue;
    if (bester && bester.pfad.length >= punkt.length) continue;
    const optionen = m[4].split(',').map((o) => o.trim().toLowerCase());
    bester = { geraet: m[1], pfad: punkt, dateisystem: (m[3] || optionen[0] || '').toLowerCase() };
  }
  return bester;
}

/* Windows: Get-Volume kennt das Dateisystem zum Laufwerksbuchstaben und braucht
   keine Verwaltungsrechte. Rueckfall fsutil, falls PowerShell gesperrt ist.
   Beide nennen „exFAT", „NTFS", „FAT32" - kleingeschrieben heisst das exfat,
   ntfs, fat32, und genau so steht es in kompatibilitaet() im Server. */
function windowsDateisystem(pfad) {
  const b = String(laufwerkWurzel(pfad)).match(/^([A-Za-z]):/);
  if (!b) return null;
  const buchstabe = b[1].toUpperCase();
  let name = '';
  { const r = spawnSync('powershell', ['-NoProfile', '-Command', `(Get-Volume -DriveLetter ${buchstabe}).FileSystem`], { encoding: 'utf8' });
    if (r.status === 0) name = String(r.stdout || '').trim().toLowerCase(); }
  if (!name) {
    const f = spawnSync('fsutil', ['fsinfo', 'volumeinfo', buchstabe + ':\\'], { encoding: 'utf8' });
    const m = /File System Name\s*:\s*(\S+)/i.exec(String(f.stdout || ''));
    if (m) name = m[1].toLowerCase();
  }
  return name ? { geraet: buchstabe + ':', pfad: buchstabe + ':\\', dateisystem: name } : null;
}

/* { geraet, pfad, dateisystem } oder null, wenn sich nichts sagen laesst.
   nurLesen steht NICHT hier - das sagt beschreibbar(). */
function dateisystem(pfad) {
  try { return process.platform === 'win32' ? windowsDateisystem(pfad) : unixDateisystem(pfad); }
  catch (e) { return null; }
}

module.exports = { platz, beschreibbar, dateisystem, laufwerkWurzel, vorhandenerTeil };

if (require.main === module) {
  const ziel = process.argv[2] || process.cwd();
  const w = laufwerkWurzel(ziel);
  const p = platz(ziel);
  const f = dateisystem(ziel);
  const b = beschreibbar(ziel);
  const gb = (x) => (x == null ? '?' : (x / 1073741824).toFixed(2) + ' GB');
  console.log('  Pfad          ' + ziel);
  console.log('  Medium        ' + w);
  console.log('  Dateisystem   ' + (f ? `${f.dateisystem} (eingehängt auf ${f.pfad}, ${f.geraet})` : '— nicht ermittelt'));
  console.log('  Platz         ' + gb(p.frei) + ' frei von ' + gb(p.gesamt));
  console.log('  Schreiben     ' + (b.ok ? 'geht' : 'geht nicht (' + b.grund + ')'));
}
