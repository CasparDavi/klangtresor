#!/bin/sh
# KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
# Stellt sicher, dass das Archiv-Verzeichnis existiert, holt die
# Klangraum-Modelle nach, wenn sie noch fehlen, und startet dann den
# Server. Modelle fehlen zu lassen ist kein Fehler: ohne Netz oder bei
# einem schon gefuellten Archiv soll die Website trotzdem laufen.
set -e
cd /app
mkdir -p library/roh library/songs library/playlistbilder \
         library/analyse library/modelle library/export geheim

if [ ! -f library/modelle/discogs-effnet-bsdynamic-1.onnx ]; then
  echo "  Hole Klangraum-Modelle nach library/modelle/ …"
  node bin/modelle-holen.js || echo "  Modelle übersprungen — der Server startet trotzdem."
fi

exec "$@"
