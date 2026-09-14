#!/bin/sh
# KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
# Stellt sicher, dass das Archiv-Verzeichnis existiert, holt die
# Klangraum-Modelle nach, wenn sie noch fehlen, und startet dann den
# Server. Modelle fehlen zu lassen ist kein Fehler: ohne Netz oder bei
# einem schon gefuellten Archiv soll die Website trotzdem laufen.
set -e
cd /app
mkdir -p library/roh library/songs library/playlistbilder \
         library/analyse library/modelle library/export

# WAS NACHGELADEN WIRD, LAEUFT NEBEN DEM SERVER - NICHT DAVOR.
# Bis zum 14.09.2026 stand das hier oberhalb von exec: der Server startete erst,
# wenn rund 1 GB Modelle heruntergeladen waren, und die Seite antwortete solange
# gar nicht. Tarja sass zwei Minuten vor einer stummen Adresse und hielt es fuer
# kaputt. Der Kommentar oben behauptete schon damals das Richtige ("die Website
# soll trotzdem laufen") - er galt nur fuer den FEHLSCHLAG, nicht fuers Warten.
# Jetzt gilt er fuer beides.
nachladen() {
  if [ ! -f library/modelle/discogs-effnet-bsdynamic-1.onnx ]; then
    echo "  Hole Klangraum-Modelle nach library/modelle/ … (der Server läuft derweil schon)"
    node bin/modelle-holen.js \
      && echo "  Klangraum-Modelle bereit." \
      || echo "  Modelle übersprungen — alles andere läuft, nur der Klangraum bleibt leer."
  fi

  # Whisper-Modell nur, wenn das Image whisper-cli mitbringt (Dockerfile.cuda).
  # Fehlschlag haelt nichts auf; Karaoke-Zeitmarken fehlen dann.
  if [ -x /usr/local/bin/whisper-cli ]; then
    WHISPER_DATEI="${WHISPER_MODELL:-/app/library/modelle/ggml-large-v3.bin}"
    WHISPER_MIN=2900000000
    GROESSE=0
    if [ -f "$WHISPER_DATEI" ]; then
      GROESSE=$(stat -c%s "$WHISPER_DATEI" 2>/dev/null || echo 0)
    fi
    if [ "$GROESSE" -lt "$WHISPER_MIN" ]; then
      echo "  Hole Whisper-Modell large-v3 (~3,1 GB) nach library/modelle/ … (im Hintergrund)"
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
}

# Im Hintergrund, damit exec sofort kommt. init:true in der compose-Datei setzt
# tini als PID 1 - das raeumt den Nachlader auf, wenn der Container endet.
nachladen &

exec "$@"
