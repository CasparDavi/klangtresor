#!/bin/bash
# KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
# KlangTresor starten — Linux. Server hoch, Browser auf, Übersicht zeigen.
#
#   ./starten-linux.sh
#
# Genau das tut die Verknüpfung „KlangTresor" auf dem Schreibtisch; sie
# zeigt hierher. Einrichten muss man damit nicht mehr — dafür:
# einrichten-linux.sh.
#
# Dieses Fenster IST der Server. Kleinmachen ja — schließen beendet ihn.

cd "$(dirname "$0")" || exit 1

# SPRACHE (Deutsch, Englisch, Russisch) aus LC_ALL, LC_MESSAGES, LANG. Die Wahl geht
# als KT_SPRACHE an Node weiter (bin/sprache.js liest sie); t/say geben den Text
# in dieser Sprache aus.
case "${KT_SPRACHE:-}" in de|en|ru) ;; *)
  _sp=${LC_ALL:-${LC_MESSAGES:-${LANG:-}}}
  case "$_sp" in ru*|RU*) KT_SPRACHE=ru ;; de*|DE*) KT_SPRACHE=de ;; *) KT_SPRACHE=en ;; esac ;;
esac
export KT_SPRACHE

t() { case "$KT_SPRACHE" in ru) printf '%s' "$3" ;; en) printf '%s' "$2" ;; *) printf '%s' "$1" ;; esac; }
say() { t "$@"; echo; }
NODE=node
[ -x werkzeug/node/bin/node ] && NODE=werkzeug/node/bin/node
if ! command -v "$NODE" >/dev/null 2>&1; then
  echo; say "  Node.js ist nicht da. Einmal ./einrichten-linux.sh starten —" "  Node.js is not here. Run ./einrichten-linux.sh once —" "  Node.js не найден. Один раз запустите ./einrichten-linux.sh —"
  say "  das holt es und richtet alles ein." "  it fetches it and sets everything up." "  он загрузит Node.js и всё настроит."; echo
  read -r -p "$(t "  [Eingabetaste zum Schließen] " "  [Press Enter to close] " "  [Нажмите Enter, чтобы закрыть] ")" _; exit 1
fi
if [ ! -f server/server.js ]; then
  echo; say "  Hier liegt kein KlangTresor. Diese Datei gehört in den Ordner mit" "  There is no KlangTresor here. This file belongs in the folder with" "  Здесь нет KlangTresor. Этот файл должен лежать в папке,"
  say "  server/ und web/ darin." "  server/ and web/ in it." "  где есть server/ и web/."; echo
  read -r -p "$(t "  [Eingabetaste zum Schließen] " "  [Press Enter to close] " "  [Нажмите Enter, чтобы закрыть] ")" _; exit 1
fi
echo
say "  Dieses Fenster bleibt offen, solange du hörst." "  This window stays open as long as you are listening." "  Это окно остаётся открытым, пока вы слушаете."
say "  Kleinmachen ist in Ordnung — schließen beendet KlangTresor." "  Minimising is fine — closing it ends KlangTresor." "  Сворачивать его можно — закрытие завершит KlangTresor."
echo
# bin/starten.js: Server in der Neustart-Schleife, dann Browser auf — Chrome, wenn da.
exec "$NODE" bin/starten.js
