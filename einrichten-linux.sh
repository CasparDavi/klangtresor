#!/bin/bash
# KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
# KlangTresor einrichten — Linux.
#
#   ./einrichten-linux.sh
#   (Sollte er sich weigern, einmal: chmod +x einrichten-linux.sh)
#
# Hier steht nur der Weg zum Anlasser. Der beschafft Node.js, und
# danach macht bin/einrichten.js die eigentliche Arbeit — dieselbe
# Abfolge wie unter Windows und auf dem Mac, aus derselben Datei.

cd "$(dirname "$0")" || exit 1
KT_SYSTEM=linux
KT_ANHALTEN=0        # von Hand gestartet: die Ausgabe bleibt ohnehin stehen
. bin/anlasser.sh "$@"
