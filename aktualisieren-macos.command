#!/bin/bash
# KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
# Update einspielen — macOS. Doppelklick oeffnet ein Terminal.
#
# Holt den aktuellen Stand von GitHub (Git-Klon: origin/main, sonst das
# Release-Zip) und spielt ihn ein. library/ bleibt. Bei Docker wird das
# Image neu gebaut. Die eigentliche Arbeit steht in bin/aktualisieren.js -
# oder, bei Versionen bis 1.0.72, die es noch nicht haben, in der Kopie
# aktualisieren.js aus KlangTresor-Update.zip hier im Hauptordner.

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

t() { case "$KT_SPRACHE" in ru) printf '%s' "$3" ;; en) printf '%s' "$2" ;; *) printf '%s' "$1" ;; esac; }
say() { t "$@"; echo; }
NODE=node
[ -x werkzeug/node/bin/node ] && NODE=werkzeug/node/bin/node
if ! command -v "$NODE" >/dev/null 2>&1; then
  echo
  say "  Node.js ist nicht da. Einmal einrichten-macos.command doppelklicken —" "  Node.js is not here. Double-click einrichten-macos.command once —" "  Node.js не найден. Один раз дважды щёлкните einrichten-macos.command —"
  say "  das holt es." "  it fetches it." "  он его загрузит."
  echo
  say "  Nur Docker, ohne Node: im Ordner git pull (oder das neue Zip ueber" "  Docker only, without Node: in the folder run git pull (or lay the new zip over" "  Только Docker, без Node: в папке выполните git pull (или распакуйте новый zip поверх"
  say "  die Dateien) und einrichten-docker-macos.command noch einmal." "  the files) and run einrichten-docker-macos.command again." "  файлов) и снова запустите einrichten-docker-macos.command."
  echo
  read -r -p "$(t "  [Eingabetaste zum Schliessen] " "  [Press Enter to close] " "  [Нажмите Enter, чтобы закрыть] ")" _
  exit 1
fi
# Erst bin/aktualisieren.js (ab 1.0.73 da), sonst die Kopie aus KlangTresor-Update.zip
# hier daneben - die raeumt sich nach dem ersten Lauf ohne Fehler selbst weg.
SKRIPT=bin/aktualisieren.js
[ -f "$SKRIPT" ] || SKRIPT=aktualisieren.js
if [ ! -f "$SKRIPT" ]; then
  echo
  if [ -f server/server.js ]; then
    say "  aktualisieren.js fehlt. Sie liegt im selben Zip wie diese Datei" "  aktualisieren.js is missing. It is in the same zip as this file" "  Файл aktualisieren.js отсутствует. Он лежит в том же zip-архиве, что и этот файл"
    say "  (KlangTresor-Update.zip) - kopiere sie mit hierher." "  (KlangTresor-Update.zip) - copy it here as well." "  (KlangTresor-Update.zip) – скопируйте его сюда тоже."
  else
    say "  Hier liegt kein KlangTresor. Diese Datei gehoert in den Ordner" "  There is no KlangTresor here. This file belongs in the folder" "  Здесь нет KlangTresor. Этот файл должен лежать в папке,"
    say "  mit library/ und server/ darin." "  with library/ and server/ in it." "  где есть library/ и server/."
  fi
  echo
  read -r -p "$(t "  [Eingabetaste zum Schliessen] " "  [Press Enter to close] " "  [Нажмите Enter, чтобы закрыть] ")" _
  exit 1
fi
# In EINEM Block: die Shell liest ihn ganz, bevor Node startet. Das Update ersetzt diese Datei
# waehrend sie laeuft - danach darf die Shell nichts mehr aus ihr nachlesen muessen.
{ "$NODE" "$SKRIPT" "$@"; echo; read -r -p "$(t "  [Eingabetaste zum Schliessen] " "  [Press Enter to close] " "  [Нажмите Enter, чтобы закрыть] ")" _; exit; }
