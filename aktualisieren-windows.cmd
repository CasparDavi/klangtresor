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
if "%KT_SPRACHE%"=="de" (title KlangTresor aktualisieren) else (title KlangTresor update)

set "NODE=node"
if exist "%~dp0werkzeug\node\node.exe" set "NODE=%~dp0werkzeug\node\node.exe"

if not "%NODE%"=="node" goto :nodeda
where node >nul 2>nul
if errorlevel 1 (
  echo.
  if "%KT_SPRACHE%"=="de" (
    echo   Node.js ist nicht da. Einmal einrichten-windows.cmd - das holt es.
    echo.
    echo   Nur Docker, ohne Node: im Ordner git pull --rebase origin main,
    echo   oder das neue KlangTresor.zip ueber die Dateien legen,
    echo   und einrichten-docker-windows.cmd noch einmal.
  ) else (
    echo   Node.js is not here. Run einrichten-windows.cmd once - it fetches it.
    echo.
    echo   Docker only, without Node: in the folder run git pull --rebase origin main,
    echo   or lay the new KlangTresor.zip over the files,
    echo   and run einrichten-docker-windows.cmd again.
  )
  echo.
  pause
  exit /b 1
)

:nodeda

rem Erst bin\aktualisieren.js (ab 1.0.73 da), sonst die Kopie aus KlangTresor-Update.zip
rem hier daneben - die raeumt sich nach dem ersten Lauf ohne Fehler selbst weg.
rem Die Meldungen stehen in if-Bloecken (deutsch/englisch); darin steht keine runde Klammer im Text.
set "SKRIPT=bin\aktualisieren.js"
if not exist "%SKRIPT%" set "SKRIPT=aktualisieren.js"
if exist "%SKRIPT%" goto :skriptda
echo.
if exist "server\server.js" goto :jsfehlt
if "%KT_SPRACHE%"=="de" (
  echo   Hier liegt kein KlangTresor. Diese Datei gehoert in den Ordner
  echo   mit library\ und server\ darin.
) else (
  echo   There is no KlangTresor here. This file belongs in the folder
  echo   that contains library\ and server\.
)
goto :halt
:jsfehlt
if "%KT_SPRACHE%"=="de" (
  echo   aktualisieren.js fehlt. Sie liegt im selben Zip wie diese Datei,
  echo   KlangTresor-Update.zip - kopiere sie mit hierher.
) else (
  echo   aktualisieren.js is missing. It is in the same zip as this file,
  echo   KlangTresor-Update.zip - copy it here as well.
)
:halt
echo.
pause
exit /b 1

:skriptda
rem In EINER Zeile: cmd liest eine Batchdatei waehrend des Laufs Zeile fuer Zeile nach - und das
rem Update ersetzt diese Datei, waehrend sie laeuft. Eine Zeile wird ganz gelesen, bevor sie startet.
"%NODE%" "%SKRIPT%" %* & echo. & pause & exit /b
