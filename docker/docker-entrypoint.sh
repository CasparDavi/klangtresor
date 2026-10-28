#!/bin/sh
# KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
# Stellt sicher, dass das Archiv-Verzeichnis existiert, und startet den Server.
set -e
cd /app
mkdir -p library/roh library/songs library/playlistbilder \
         library/analyse library/modelle library/export

# HIER WURDE BIS 28.10.2026 IM HINTERGRUND NACHGELADEN: die KI-Modelle und - im CUDA-Image - das
# Whisper-Modell (3,1 GB), neben dem schon laufenden Server, sichtbar nur im Container-Protokoll.
# Caspar_D: "ich will, dass nichts im Verborgenen stattfindet". Was fehlt, zeigt jetzt der Tab
# "System" im Profil und holt es dort auf Knopfdruck, mit Balken.

exec "$@"
