#!/bin/bash
# KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
# Update einspielen — macOS. Doppelklick oeffnet ein Terminal.
#
# Holt den aktuellen Stand von GitHub (Git-Klon: origin/main, sonst das
# Release-Zip) und spielt ihn ein. library/ bleibt. Bei Docker wird das
# Image neu gebaut. Die eigentliche Arbeit steht in bin/aktualisieren.js.

cd "$(dirname "$0")" || exit 1
NODE=node
[ -x werkzeug/node/bin/node ] && NODE=werkzeug/node/bin/node
if ! command -v "$NODE" >/dev/null 2>&1; then
  echo
  echo "  Node.js ist nicht da. Einmal einrichten-macos.command doppelklicken —"
  echo "  das holt es."
  echo
  echo "  Nur Docker, ohne Node: im Ordner git pull (oder das neue Zip ueber"
  echo "  die Dateien) und einrichten-docker-macos.command noch einmal."
  echo
  read -r -p "  [Eingabetaste zum Schliessen] " _
  exit 1
fi
if [ ! -f bin/aktualisieren.js ]; then
  echo
  echo "  Hier liegt kein KlangTresor. Diese Datei gehoert in den Ordner"
  echo "  mit bin/ und server/ darin."
  echo
  read -r -p "  [Eingabetaste zum Schliessen] " _
  exit 1
fi
# In EINEM Block: die Shell liest ihn ganz, bevor Node startet. Das Update ersetzt diese Datei
# waehrend sie laeuft - danach darf die Shell nichts mehr aus ihr nachlesen muessen.
{ "$NODE" bin/aktualisieren.js "$@"; echo; read -r -p "  [Eingabetaste zum Schliessen] " _; exit; }
