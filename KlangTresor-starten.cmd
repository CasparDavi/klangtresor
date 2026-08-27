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
rem Bis dahin gab es fuer Windows nur KlangTresor-einrichten.cmd, und die
rem laeuft erst durch alle Einrichtungsschritte - fuer "nur mal eben
rem starten" der falsche Weg.

setlocal
cd /d "%~dp0"
title KlangTresor laeuft - dieses Fenster nicht schliessen

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js ist nicht da - jedenfalls nicht in diesem Fenster.
  echo.
  echo   Von https://nodejs.org die LTS-Fassung holen ^(.msi^) und
  echo   durchklicken; das setzt den Pfad von selbst. Wer winget hat:
  echo     winget install OpenJS.NodeJS.LTS
  echo.
  echo   Frisch installiert und trotzdem diese Meldung? Dann kennt nur
  echo   dieses Fenster den neuen Pfad noch nicht - einmal schliessen
  echo   und neu oeffnen.
  echo.
  pause
  exit /b 1
)

if not exist "server\server.js" (
  echo.
  echo   Hier liegt kein KlangTresor. Diese Datei gehoert in den Ordner
  echo   mit server\ und web\ darin - dorthin, wo das Archiv entpackt
  echo   wurde, nicht daneben.
  echo.
  pause
  exit /b 1
)

echo.
echo   Dieses Fenster bleibt offen, solange du hoerst.
echo   Kleinmachen ist in Ordnung - schliessen beendet KlangTresor.
echo.

node server\server.js

echo.
echo   KlangTresor wurde beendet.
echo   Zum Weiterhoeren diese Datei einfach wieder doppelklicken.
echo.
pause
