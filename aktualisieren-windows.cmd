@echo off
rem KlangTresor - Copyright (c) 2026 Caspar_D - MIT, siehe LICENSE
rem
rem Update einspielen - Windows. Doppelklick, Fenster bleibt.
rem
rem Holt den aktuellen Stand von GitHub (Git-Klon: origin/main, sonst
rem das Release-Zip) und spielt ihn ein. library/ bleibt. Bei Docker
rem wird das Image neu gebaut. Die Arbeit steht in bin\aktualisieren.js -
rem oder, bei Versionen bis 1.0.72, die es noch nicht haben, in der Kopie
rem aktualisieren.js aus KlangTresor-Update.zip hier im Hauptordner.

setlocal
rem Runde Klammern in Texten innerhalb von if-Bloecken muessen mit dem Zirkumflex geschuetzt
rem werden - eine nackte schliessende Klammer beendet den Block vorzeitig. Gefunden bei der
rem Uebernahme, 15.10.2026. Darum stehen hier keine Klammern in Texten.
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
  echo   Nur Docker, ohne Node: im Ordner git pull --rebase origin main,
  echo   oder das neue KlangTresor.zip ueber die Dateien legen,
  echo   und einrichten-docker-windows.cmd noch einmal.
  echo.
  pause
  exit /b 1
)

:nodeda

rem Erst bin\aktualisieren.js (ab 1.0.73 da), sonst die Kopie aus KlangTresor-Update.zip
rem hier daneben - die raeumt sich nach dem ersten Lauf ohne Fehler selbst weg.
rem Mit Sprungmarken statt if-Bloecken: so braucht kein Text eine geschuetzte Klammer.
set "SKRIPT=bin\aktualisieren.js"
if not exist "%SKRIPT%" set "SKRIPT=aktualisieren.js"
if exist "%SKRIPT%" goto :skriptda
echo.
if exist "server\server.js" goto :jsfehlt
echo   Hier liegt kein KlangTresor. Diese Datei gehoert in den Ordner
echo   mit library\ und server\ darin.
goto :halt
:jsfehlt
echo   aktualisieren.js fehlt. Sie liegt im selben Zip wie diese Datei,
echo   KlangTresor-Update.zip - kopiere sie mit hierher.
:halt
echo.
pause
exit /b 1

:skriptda
rem In EINER Zeile: cmd liest eine Batchdatei waehrend des Laufs Zeile fuer Zeile nach - und das
rem Update ersetzt diese Datei, waehrend sie laeuft. Eine Zeile wird ganz gelesen, bevor sie startet.
"%NODE%" "%SKRIPT%" %* & echo. & pause & exit /b
