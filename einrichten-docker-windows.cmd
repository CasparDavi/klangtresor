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
title KlangTresor einrichten (Docker)

cmd.exe /d /k ""%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0bin\einrichten-docker.ps1""
