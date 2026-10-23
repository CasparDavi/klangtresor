@echo off
rem KlangTresor - Copyright (c) 2026 Caspar_D - MIT, siehe LICENSE
rem
rem DOPPELKLICK-STARTER FUER WINDOWS - nur der Server, ohne Einrichten.
rem
rem ANLASS (27.08.2026): Dr. Fruusch hatte KlangTresor eingerichtet, alles
rem lief, und dann machte er das PowerShell-Fenster zu. Darin lief der
rem Server. Weg war er - und der Lauf, den der rote Knopf gerade
rem angestossen hatte, starb als Kindprozess mit; library/toene.json blieb
rem halb geschrieben zurueck. Zwei Meldungen im Discord, eine Ursache.
rem
rem Es war kein Anfaengerfehler, sondern eine Falle: Nichts an einem
rem Terminalfenster verraet, dass darin etwas laeuft, das offen bleiben
rem muss. Auf dem Mac ist es genauso, man weiss es dort nur irgendwann.
rem
rem Diese Datei sagt es dreifach: im Fenstertitel, wo man ihn beim
rem Wegklicken sieht; in der Zeile ueber der Ausgabe; und noch einmal,
rem wenn der Server tatsaechlich endet.
rem
rem Bis dahin gab es fuer Windows nur einrichten-windows.cmd, und die
rem laeuft erst durch alle Einrichtungsschritte - fuer "nur mal eben
rem starten" der falsche Weg.

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
if "%KT_SPRACHE%"=="de" (title KlangTresor laeuft - dieses Fenster nicht schliessen) else (title KlangTresor is running - do not close this window)

rem ZUERST DAS MITGEBRACHTE NODE. bin\anlasser.ps1 legt es nach
rem werkzeug\node, ohne am System oder am PATH zu drehen - dann findet
rem "where node" es nicht, obwohl es danebensteht (11.09.2026).
set "NODE=node"
if exist "%~dp0werkzeug\node\node.exe" set "NODE=%~dp0werkzeug\node\node.exe"
if exist "%~dp0werkzeug\ffmpeg\bin" set "PATH=%~dp0werkzeug\ffmpeg\bin;%PATH%"

if not "%NODE%"=="node" goto :nodeda
where node >nul 2>nul
if errorlevel 1 (
  echo.
  if "%KT_SPRACHE%"=="de" (
    echo   Node.js ist nicht da - jedenfalls nicht in diesem Fenster.
    echo.
    echo   Von https://nodejs.org die LTS-Fassung holen ^(.msi^) und
    echo   durchklicken; das setzt den Pfad von selbst. Wer winget hat:
    echo     winget install OpenJS.NodeJS.LTS
    echo.
    echo   Frisch installiert und trotzdem diese Meldung? Dann kennt nur
    echo   dieses Fenster den neuen Pfad noch nicht - einmal schliessen
    echo   und neu oeffnen.
  ) else (
    echo   Node.js is not here - at least not in this window.
    echo.
    echo   Get the LTS version from https://nodejs.org - the .msi file - and click
    echo   through the installer; it sets the path by itself. If you have winget:
    echo     winget install OpenJS.NodeJS.LTS
    echo.
    echo   Just installed it and still see this message? Then only this
    echo   window does not know the new path yet - close it once
    echo   and open it again.
  )
  echo.
  pause
  exit /b 1
)

:nodeda

if not exist "server\server.js" (
  echo.
  if "%KT_SPRACHE%"=="de" (
    echo   Hier liegt kein KlangTresor. Diese Datei gehoert in den Ordner
    echo   mit server\ und web\ darin - dorthin, wo das Archiv entpackt
    echo   wurde, nicht daneben.
  ) else (
    echo   There is no KlangTresor here. This file belongs in the folder
    echo   that contains server\ and web\ - where the archive was unpacked,
    echo   not next to it.
  )
  echo.
  pause
  exit /b 1
)

echo.
if "%KT_SPRACHE%"=="de" (
  echo   Dieses Fenster bleibt offen, solange du hoerst.
  echo   Kleinmachen ist in Ordnung - schliessen beendet KlangTresor.
) else (
  echo   This window stays open as long as you are listening.
  echo   Minimising is fine - closing it ends KlangTresor.
)
echo.

rem bin\starten.js: Server in der Neustart-Schleife, dann Browser auf - Chrome, wenn da.
"%NODE%" bin\starten.js

echo.
if "%KT_SPRACHE%"=="de" (
  echo   KlangTresor wurde beendet.
  echo   Zum Weiterhoeren diese Datei einfach wieder doppelklicken.
) else (
  echo   KlangTresor has ended.
  echo   To keep listening, just double-click this file again.
)
echo.
pause
