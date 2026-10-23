@echo off
rem KlangTresor - Copyright (c) 2026 Caspar_D - MIT, siehe LICENSE
rem
rem KLANGTRESOR EINRICHTEN - WINDOWS. Doppelklick, der Rest laeuft.
rem
rem Drei Stufen, jede faengt die naechste auf - Caspar_D, 13.09.2026:
rem "fallbacks, wenn es nicht mit js geht, und dann natuerlich das
rem schicke js":
rem   1. diese Datei        haelt das Fenster offen und erlaubt das Skript
rem                         nur fuer diesen einen Aufruf (nichts wird am
rem                         System verstellt)
rem   2. bin\anlasser.ps1   beschafft Node.js, falls es fehlt - rund 30 MB,
rem                         nur in den Ordner gelegt, nicht installiert
rem   3. bin\einrichten.js  die eigentliche Einrichtung: als Seite im
rem                         Browser - und hier im Fenster als Text, falls
rem                         kein Browser aufgeht
rem
rem Die Geschwister: einrichten-macos.command, einrichten-linux.sh und
rem einrichten-docker-*.* fuer den Weg ohne Installation. Zum spaeteren
rem Starten: starten-windows.cmd (oder die Verknuepfung auf dem Desktop).
rem
rem Beigesteuert von Casto, 24.08.2026 - und er hat damit ein Problem
rem geloest, das wir uebersehen hatten: Ein Rechtsklick auf die .ps1 und
rem "Mit PowerShell ausfuehren" scheitert auf vielen Rechnern an der
rem ExecutionPolicy, und das Fenster schliesst sich sofort wieder - man
rem sieht die Fehlermeldung gar nicht. Wer nicht weiss, wonach er sucht,
rem haelt das Programm fuer kaputt.
rem
rem Diese Datei loest beides:
rem   /k                     haelt das Fenster offen, auch nach Fehlern
rem   -ExecutionPolicy Bypass gilt nur fuer diesen einen Aufruf und
rem                          aendert nichts an den Einstellungen
rem   -NoProfile             ignoriert fremde Profilskripte
rem
rem Die doppelten Anfuehrungszeichen aussen sind kein Versehen: cmd.exe
rem braucht sie, sobald der Pfad Leerzeichen enthaelt - und "Eigene
rem Dateien" oder ein Benutzername mit Leerzeichen sind haeufig.

setlocal
cd /d "%~dp0"
rem SPRACHE: einmal bestimmen und als KT_SPRACHE (de, en oder ru) an Node weiterreichen
rem (bin\sprache.js liest sie). Die Texte in DIESER Datei gibt es nur auf Deutsch
rem und Englisch: cmd.exe kann kyrillische Schrift nicht zuverlaessig zeigen und die
rem Datei muss reines ASCII bleiben - wer Russisch hat, liest hier Englisch, und alles
rem ab Node (die eigentliche Einrichtung) kommt auf Russisch.
if not defined KT_SPRACHE for /f %%i in ('powershell -NoProfile -Command "(Get-UICulture).TwoLetterISOLanguageName"') do set "KT_SPRACHE=%%i"
if /i "%KT_SPRACHE%"=="de" goto :sprache_ok
if /i "%KT_SPRACHE%"=="ru" goto :sprache_ok
set "KT_SPRACHE=en"
:sprache_ok
if "%KT_SPRACHE%"=="de" (title KlangTresor einrichten) else (title KlangTresor setup)

cmd.exe /d /k ""%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0bin\anlasser.ps1""
