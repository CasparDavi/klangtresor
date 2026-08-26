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

# Whisper-Modell nur, wenn das Image whisper-cli mitbringt (Dockerfile.cuda).
# Fehlschlag hält den Server nicht auf; Karaoke-Zeitmarken fehlen dann.
if [ -x /usr/local/bin/whisper-cli ]; then
  WHISPER_DATEI="${WHISPER_MODELL:-/app/library/modelle/ggml-large-v3.bin}"
  WHISPER_MIN=2900000000
  GROESSE=0
  if [ -f "$WHISPER_DATEI" ]; then
    GROESSE=$(stat -c%s "$WHISPER_DATEI" 2>/dev/null || echo 0)
  fi
  if [ "$GROESSE" -lt "$WHISPER_MIN" ]; then
    echo "  Hole Whisper-Modell large-v3 (~3,1 GB) nach library/modelle/ …"
    mkdir -p "$(dirname "$WHISPER_DATEI")"
    if command -v curl >/dev/null 2>&1 \
       && curl -fL --retry 3 --retry-delay 2 -C - -o "$WHISPER_DATEI.teil" \
            https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin \
       && mv "$WHISPER_DATEI.teil" "$WHISPER_DATEI"; then
      echo "  Whisper-Modell bereit."
    else
      echo "  Whisper-Modell übersprungen — Karaoke-Zeitmarken fehlen dann."
      rm -f "$WHISPER_DATEI.teil"
    fi
  fi
fi

exec "$@"
