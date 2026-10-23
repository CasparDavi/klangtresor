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

# SPRACHE (Deutsch, Englisch, Russisch) aus LC_ALL, LC_MESSAGES, LANG. Die Wahl geht
# als KT_SPRACHE an Node weiter (bin/sprache.js liest sie); t/say geben den Text
# in dieser Sprache aus.
case "${KT_SPRACHE:-}" in de|en|ru) ;; *)
  _sp=${LC_ALL:-${LC_MESSAGES:-${LANG:-}}}
  case "$_sp" in ru*|RU*) KT_SPRACHE=ru ;; de*|DE*) KT_SPRACHE=de ;; *) KT_SPRACHE=en ;; esac ;;
esac
export KT_SPRACHE

KT_SYSTEM=linux
KT_ANHALTEN=0        # von Hand gestartet: die Ausgabe bleibt ohnehin stehen
. bin/anlasser.sh "$@"
