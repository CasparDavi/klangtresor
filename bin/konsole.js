/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   DAS KONSOLENFENSTER UNTER WINDOWS: QUICKEDIT AUS
   bin/konsole.js

   Windows-Konsolen haben „QuickEdit" standardmaessig an: EIN KLICK ins
   Fenster schaltet in den Markierungsmodus, und ab dem naechsten
   Schreibversuch steht der ganze Prozess - ohne Meldung, nur ein Wort
   „Markieren" in der Titelleiste. Es sieht nach Absturz aus und ist
   keiner. Caspar_D, 13.09.2026, dreimal am selben Abend: „bleibt alles
   haengen" - nach dem Ordnerdialog, ohne Ordnerdialog, und am Ende von
   Schritt 9. Jedes Mal stand der naechste Satz an, und das Fenster war
   im Markierungsmodus.

   Der Hinweis „dann Escape druecken" stand seit dem Vormittag am Anfang.
   Ein Hinweis gegen einen Reflex ist kein Schutz. Also wird QuickEdit
   fuer DIESES Fenster abgeschaltet - nicht in den Windows-Einstellungen,
   nur am Konsolenpuffer, den wir gerade benutzen (SetConsoleMode ohne
   ENABLE_QUICK_EDIT_MODE, mit ENABLE_EXTENDED_FLAGS, damit die Aenderung
   gilt). Beim naechsten Fenster ist alles wie vorher.

   Ueber CONIN$ statt ueber das Standard-Eingabehandle: das trifft den
   Konsolenpuffer auch dann, wenn stdin umgeleitet ist. Und als
   Skriptdatei, nicht als -Command: die Anfuehrungszeichen im C#-Teil
   ueberleben die Kommandozeile nicht (dieselbe Lehre wie beim
   Ordnerdialog, bin/ordnerdialog.js).

   Node selbst kann das nicht (kein SetConsoleMode in der Standard-
   bibliothek), PowerShell ist auf jedem Windows da.
   ============================================================= */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function quickEditAus() {
  if (process.platform !== 'win32') return false;
  const datei = path.join(os.tmpdir(), `klangtresor-konsole-${process.pid}.ps1`);
  const skript = [
    "$src = '[DllImport(\"kernel32.dll\", CharSet=CharSet.Unicode, SetLastError=true)] public static extern IntPtr CreateFile(string n, uint a, uint s, IntPtr sec, uint d, uint f, IntPtr t); [DllImport(\"kernel32.dll\")] public static extern bool GetConsoleMode(IntPtr h, out uint m); [DllImport(\"kernel32.dll\")] public static extern bool SetConsoleMode(IntPtr h, uint m); [DllImport(\"kernel32.dll\")] public static extern bool CloseHandle(IntPtr h);'",
    '$k = Add-Type -MemberDefinition $src -Name Konsole -Namespace KlangTresor -PassThru',
    /* GENERIC_READ|GENERIC_WRITE (0xC0000000 - dezimal, weil PowerShell das
       Hex-Literal als negative 32-Bit-Zahl liest), FILE_SHARE_READ|WRITE, OPEN_EXISTING */
    "$h = $k::CreateFile('CONIN$', [uint32]3221225472, [uint32]3, [IntPtr]::Zero, [uint32]3, [uint32]0, [IntPtr]::Zero)",
    'if ($h.ToInt64() -eq -1) { exit 2 }',
    '$m = [uint32]0',
    'if (-not $k::GetConsoleMode($h, [ref]$m)) { exit 3 }',
    /* Bit 0x40 (ENABLE_QUICK_EDIT_MODE) weg: Maske 0xFFFFFFBF = 4294967231;
       Bit 0x80 (ENABLE_EXTENDED_FLAGS) dazu, sonst gilt die Aenderung nicht. */
    '$neu = [uint32](($m -band 4294967231) -bor 128)',
    'if (-not $k::SetConsoleMode($h, $neu)) { exit 4 }',
    '[void]$k::CloseHandle($h)',
    'exit 0',
    '',
  ].join('\r\n');
  try {
    fs.writeFileSync(datei, '\ufeff' + skript, 'utf8');
    /* KEIN windowsHide: das gaebe dem Kind eine eigene, unsichtbare
       Konsole - und CONIN$ traefe die falsche. */
    const e = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', datei], { stdio: 'ignore' });
    return e.status === 0;
  } catch (e) { return false; }
  finally { try { fs.unlinkSync(datei); } catch (e) {} }
}

module.exports = { quickEditAus };
