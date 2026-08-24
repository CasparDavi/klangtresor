@echo off
rem KlangTresor - Copyright (c) 2026 Caspar_D - MIT, siehe LICENSE
rem
rem DOPPELKLICK-STARTER FUER WINDOWS.
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
title KlangTresor einrichten

cmd.exe /d /k ""%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0einrichten-windows.ps1""
