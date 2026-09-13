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

   Zwei Arten, ihn zu rufen - dieselbe Anleitung, zweimal ausgefuehrt:

     ordnerWaehlen(vorgabe, titel)          wartet, haelt das Programm an
                                             (server/server.js, im
                                             Anfragebetrieb unschaedlich)
     ordnerWaehlenNebenher(vorgabe, titel)  Promise; das Programm laeuft
                                             weiter, damit die Einrichtungs-
                                             seite waehrenddessen antwortet

   Beide geben { pfad, ging, grund } zurueck: pfad ist der gewaehlte
   Ordner oder null; ging sagt, ob ueberhaupt ein Fenster aufgehen
   konnte - false heisst: kein Bildschirm, zenity fehlt, PowerShell hat
   sich verschluckt. Der Aufrufer weiss dann, dass er tippen lassen
   muss statt „abgebrochen" zu sagen.

   WARUM WINDOWS EINE SKRIPTDATEI BEKOMMT, KEINE KOMMANDOZEILE
   (Caspar_D, 13.09.2026: „bei der Frage nach dem Ordner bleibt das js
   haengen, ich haette erwartet, dass ein FileChooser aufgeht"):

     1. JSON.stringify ist kein PowerShell-Maskierer. Ein „ oder ein
        Backslash im Titel oder Pfad zerriss die Zeile - und bei
        -Command sah niemand die Fehlermeldung.
     2. Ein Dialog aus einem Prozess, der nicht im Vordergrund ist,
        geht HINTER dem Browser auf; Windows laesst ihn nicht nach
        vorn. Der Mensch sieht nichts und wartet. Deshalb ein
        unsichtbares TopMost-Fenster als Besitzer: dessen Dialog
        liegt oben.
     3. Die Ausgabe kam in der OEM-Codeseite an; aus „Jörg" wurde
        Salat, und der Ordner existierte „nicht". Jetzt UTF-8, mit
        Byte Order Mark in der Datei (PowerShell 5.1 liest ohne BOM
        CP1252 - Castos „1000 Fehlermeldungen").
   ============================================================= */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

function da(befehl) {
  const e = spawnSync(process.platform === 'win32' ? 'where' : 'which', [befehl], { stdio: 'pipe', encoding: 'utf8' });
  return e.status === 0 ? String(e.stdout).split('\n')[0].trim() || null : null;
}

/* PowerShell-Zeichenkette in einfachen Anfuehrungszeichen: nur das
   Apostroph selbst muss verdoppelt werden, sonst gilt alles woertlich. */
const ps1 = (s) => "'" + String(s).replace(/'/g, "''") + "'";

/* Die Anleitung je System: welcher Befehl, welche Argumente, was danach
   wegzuraeumen ist. Gemeinsam fuer beide Aufrufarten. */
function anleitung(vorgabe, titel) {
  titel = String(titel || 'Ordner wählen');
  vorgabe = String(vorgabe || os.homedir());
  if (process.platform === 'darwin') {
    /* „activate" zuerst: ohne das erscheint das Fenster von osascript
       hinter dem Terminal. Danach der Dialog, dann der POSIX-Pfad.
       AppleScript maskiert wie JSON (\" und \\), deshalb passt stringify. */
    return { befehl: 'osascript', args: ['-e', 'activate',
      '-e', `set d to choose folder with prompt ${JSON.stringify(titel)} default location POSIX file ${JSON.stringify(vorgabe)}`,
      '-e', 'POSIX path of d'] };
  }
  if (process.platform === 'win32') {
    const datei = path.join(os.tmpdir(), `klangtresor-ordner-${process.pid}-${Date.now()}.ps1`);
    const skript = [
      '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
      'Add-Type -AssemblyName System.Windows.Forms',
      /* Der unsichtbare Besitzer, damit der Dialog VOR dem Browser liegt. */
      '$f = New-Object System.Windows.Forms.Form',
      '$f.TopMost = $true',
      '$f.ShowInTaskbar = $false',
      '$f.Opacity = 0',
      '$f.Width = 1; $f.Height = 1',
      "$f.StartPosition = 'CenterScreen'",
      '$d = New-Object System.Windows.Forms.FolderBrowserDialog',
      `$d.Description = ${ps1(titel)}`,
      "$d.RootFolder = 'MyComputer'",
      `$d.SelectedPath = ${ps1(vorgabe)}`,
      '$d.ShowNewFolderButton = $true',
      /* KT_ORDNERPROBE: nur pruefen, ob das Skript laeuft - kein Fenster.
         Fuer Probelaeufe ohne Bildschirm (Parallels, Sitzung 0). */
      'if ($env:KT_ORDNERPROBE) { Write-Output $d.SelectedPath; exit 0 }',
      '$f.Show(); $f.Activate()',
      "if ($d.ShowDialog($f) -eq 'OK') { Write-Output $d.SelectedPath }",
      '$f.Close()',
      '',
    ].join('\r\n');
    fs.writeFileSync(datei, '\ufeff' + skript, 'utf8');
    return { befehl: 'powershell', args: ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-STA', '-File', datei],
      aufraeumen: () => { try { fs.unlinkSync(datei); } catch (e) {} } };
  }
  if (da('zenity')) return { befehl: 'zenity', args: ['--file-selection', '--directory', '--title', titel, '--filename', vorgabe.replace(/\/?$/, '/')] };
  if (da('kdialog')) return { befehl: 'kdialog', args: ['--getexistingdirectory', vorgabe] };
  return null;
}

/* Aus dem, was der Kindprozess hinterlaesst, das Ergebnis lesen. Abbruch
   ist kein Fehler: der Mensch hat „Abbrechen" gedrueckt, ging = true.
   Nur wenn der Befehl selbst fehlte oder abstuerzte, ist ging = false. */
function deuten(fehler, status, stdout, stderr) {
  if (fehler) return { pfad: null, ging: false, grund: fehler.code === 'ENOENT' ? 'Befehl nicht da' : String(fehler.message || fehler) };
  const pfad = String(stdout || '').trim().split(/\r?\n/).filter(Boolean).pop() || null;
  if (pfad) return { pfad, ging: true, grund: null };
  const s = String(stderr || '').trim();
  /* zenity 1 = Abbrechen, osascript -128 = Abbrechen (leer, ohne stderr) */
  if (status === 0 || status === 1 || !s) return { pfad: null, ging: true, grund: null };
  return { pfad: null, ging: false, grund: s.split('\n')[0].slice(0, 160) };
}

function ordnerWaehlen(vorgabe, titel) {
  const a = anleitung(vorgabe, titel);
  if (!a) return { pfad: null, ging: false, grund: 'kein Dialogprogramm (zenity oder kdialog) da' };
  try {
    const e = spawnSync(a.befehl, a.args, { encoding: 'utf8', windowsHide: true });
    return deuten(e.error, e.status, e.stdout, e.stderr);
  } finally { if (a.aufraeumen) a.aufraeumen(); }
}

function ordnerWaehlenNebenher(vorgabe, titel) {
  return new Promise((fertig) => {
    const a = anleitung(vorgabe, titel);
    if (!a) return fertig({ pfad: null, ging: false, grund: 'kein Dialogprogramm (zenity oder kdialog) da' });
    let out = '', err = '';
    let k;
    try { k = spawn(a.befehl, a.args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }); }
    catch (e) { if (a.aufraeumen) a.aufraeumen(); return fertig(deuten(e)); }
    k.stdout.setEncoding('utf8'); k.stderr.setEncoding('utf8');
    k.stdout.on('data', (c) => { out += c; });
    k.stderr.on('data', (c) => { err += c; });
    k.on('error', (e) => { if (a.aufraeumen) a.aufraeumen(); fertig(deuten(e)); });
    k.on('close', (status) => { if (a.aufraeumen) a.aufraeumen(); fertig(deuten(null, status, out, err)); });
  });
}

module.exports = { ordnerWaehlen, ordnerWaehlenNebenher };
