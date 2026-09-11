#!/bin/sh
# KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
# Startet den Server und zieht ihn wieder hoch, wenn er sich wegen einer
# geaenderten server.js selbst beendet (Exitcode 75). Jeder andere
# Exitcode beendet die Schleife - ein Absturz soll sichtbar bleiben,
# nicht weggebuegelt werden.
cd "$(dirname "$0")/.." || exit 1
while :; do
  node server/server.js
  c=$?
  [ "$c" -eq 75 ] || exit "$c"
  sleep 0.2
done
