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

# SPRACHE (Deutsch, Englisch, Russisch): das System fragen, nicht die Umgebung -
# ein Doppelklick startet ohne LANG. Die Wahl geht als KT_SPRACHE an Node weiter
# (bin/sprache.js liest sie); t/say geben den Text in dieser Sprache aus.
case "${KT_SPRACHE:-}" in de|en|ru) ;; *)
  _sp=$(defaults read -g AppleLanguages 2>/dev/null | tr -d '(), "' | grep -v '^$' | head -1)
  [ -n "$_sp" ] || _sp=${LC_ALL:-${LC_MESSAGES:-${LANG:-}}}
  case "$_sp" in ru*|RU*) KT_SPRACHE=ru ;; de*|DE*) KT_SPRACHE=de ;; *) KT_SPRACHE=en ;; esac ;;
esac
export KT_SPRACHE

KT_SYSTEM=macos
KT_ANHALTEN=1        # Doppelklick: das Fenster soll nicht wegspringen
. bin/anlasser.sh "$@"
