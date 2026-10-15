#!/bin/bash
# KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
# Update einspielen — Linux.
#
#   ./aktualisieren-linux.sh
#
# Holt den aktuellen Stand von GitHub (Git-Klon: origin/main, sonst das
# Release-Zip) und spielt ihn ein. library/ bleibt. Bei Docker wird das
# Image neu gebaut. Die eigentliche Arbeit steht in bin/aktualisieren.js -
# oder, bei Versionen bis 1.0.72, die es noch nicht haben, in der Kopie
# aktualisieren.js aus KlangTresor-Update.zip hier im Hauptordner.

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
# Erst bin/aktualisieren.js (ab 1.0.73 da), sonst die Kopie aus KlangTresor-Update.zip
# hier daneben - die raeumt sich nach dem ersten Lauf ohne Fehler selbst weg.
SKRIPT=bin/aktualisieren.js
[ -f "$SKRIPT" ] || SKRIPT=aktualisieren.js
if [ ! -f "$SKRIPT" ]; then
  echo
  if [ -f server/server.js ]; then
    echo "  aktualisieren.js fehlt. Sie liegt im selben Zip wie diese Datei"
    echo "  (KlangTresor-Update.zip) - kopiere sie mit hierher."
  else
    echo "  Hier liegt kein KlangTresor. Diese Datei gehoert in den Ordner"
    echo "  mit library/ und server/ darin."
  fi
  echo
  exit 1
fi
exec "$NODE" "$SKRIPT" "$@"
