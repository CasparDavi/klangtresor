#!/bin/bash
# KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
# KlangTresor einrichten — macOS.
#
# Doppelklick genügt: Der Finder öffnet dafür ein Terminal. Sollte er
# stattdessen fragen, womit die Datei geöffnet werden soll, einmal
# Rechtsklick → Öffnen wählen.
#
# Hier steht nur der Weg zum Anlasser. Der beschafft Node.js, und
# danach macht bin/einrichten.js die eigentliche Arbeit — dieselbe
# Abfolge wie unter Windows und Linux, aus derselben Datei.

cd "$(dirname "$0")" || exit 1
KT_SYSTEM=macos
KT_ANHALTEN=1        # Doppelklick: das Fenster soll nicht wegspringen
. bin/anlasser.sh
