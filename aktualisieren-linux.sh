#!/bin/bash
# KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
# Neue Fassung einspielen — Linux.
#
#   ./aktualisieren-linux.sh
#
# Holt den aktuellen Stand von GitHub (Git-Klon: origin/main, sonst das
# Release-Zip) und spielt ihn ein. library/ bleibt. Bei Docker wird das
# Image neu gebaut. Die eigentliche Arbeit steht in bin/aktualisieren.js.

cd "$(dirname "$0")" || exit 1
NODE=node
[ -x werkzeug/node/bin/node ] && NODE=werkzeug/node/bin/node
if ! command -v "$NODE" >/dev/null 2>&1; then
  echo
  echo "  Node.js ist nicht da. Einmal ./einrichten-linux.sh — das holt es."
  echo
  echo "  Nur Docker, ohne Node: im Ordner"
  echo "    git pull --rebase origin main"
  echo "    (oder das neue KlangTresor.zip ueber die Dateien legen)"
  echo "    und ./einrichten-docker-linux.sh noch einmal."
  echo
  exit 1
fi
if [ ! -f bin/aktualisieren.js ]; then
  echo
  echo "  Hier liegt kein KlangTresor. Diese Datei gehoert in den Ordner"
  echo "  mit bin/ und server/ darin."
  echo
  exit 1
fi
exec "$NODE" bin/aktualisieren.js "$@"
