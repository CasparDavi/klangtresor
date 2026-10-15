@echo off
rem KlangTresor - Copyright (c) 2026 Caspar_D - MIT, siehe LICENSE
rem
rem Neue Fassung einspielen - Windows. Doppelklick, Fenster bleibt.
rem
rem Holt den aktuellen Stand von GitHub (Git-Klon: origin/main, sonst
rem das Release-Zip) und spielt ihn ein. library/ bleibt. Bei Docker
rem wird das Image neu gebaut. Die Arbeit steht in bin\aktualisieren.js.

setlocal
rem Runde Klammern in Texten innerhalb von if-Bloecken stehen als ^( und ^) - eine nackte
rem schliessende Klammer beendet den Block vorzeitig. Gefunden bei der Uebernahme, 15.10.2026.
cd /d "%~dp0"
title KlangTresor aktualisieren

set "NODE=node"
if exist "%~dp0werkzeug\node\node.exe" set "NODE=%~dp0werkzeug\node\node.exe"

if not "%NODE%"=="node" goto :nodeda
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js ist nicht da. Einmal einrichten-windows.cmd - das holt es.
  echo.
  echo   Nur Docker, ohne Node: im Ordner git pull --rebase origin main
  echo   ^(oder das neue KlangTresor.zip ueber die Dateien legen^)
  echo   und einrichten-docker-windows.cmd noch einmal.
  echo.
  pause
  exit /b 1
)

:nodeda

if not exist "bin\aktualisieren.js" (
  echo.
  echo   Hier liegt kein KlangTresor. Diese Datei gehoert in den Ordner
  echo   mit bin\ und server\ darin.
  echo.
  pause
  exit /b 1
)

rem In EINER Zeile: cmd liest eine Batchdatei waehrend des Laufs Zeile fuer Zeile nach - und das
rem Update ersetzt diese Datei, waehrend sie laeuft. Eine Zeile wird ganz gelesen, bevor sie startet.
"%NODE%" bin\aktualisieren.js %* & echo. & pause & exit /b
