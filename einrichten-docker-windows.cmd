@echo off
rem KlangTresor - Copyright (c) 2026 Caspar_D - MIT, siehe LICENSE
rem
rem KLANGTRESOR EINRICHTEN - WINDOWS, MIT DOCKER. Doppelklick.
rem
rem Der Weg fuer alle, die sich nichts installieren wollen: Node und
rem ffmpeg liegen im Container, auf diesem Rechner bleibt nichts davon
rem zurueck. Gebraucht wird nur Docker Desktop - fehlt es, sagt das
rem Skript, was zu tun ist (erst WSL 2, dann Docker Desktop).
rem
rem Diese Datei tut nur eines: sie ruft bin\einrichten-docker.ps1 so auf,
rem dass das Fenster offen bleibt und die ExecutionPolicy fuer diesen
rem einen Aufruf nicht im Weg steht. Die .ps1 nicht selbst anklicken -
rem deshalb liegt sie in bin\.
rem
rem Ohne Docker: einrichten-windows.cmd.

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
set "KT_TITEL=KlangTresor einrichten (Docker)"
if not "%KT_SPRACHE%"=="de" set "KT_TITEL=KlangTresor setup (Docker)"
title %KT_TITEL%

cmd.exe /d /k ""%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0bin\einrichten-docker.ps1""
