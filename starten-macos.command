#!/bin/bash
# KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
# KlangTresor starten — macOS. Server hoch, Browser auf, Übersicht zeigen.
#
# Genau das tut die Verknüpfung „KlangTresor" auf dem Schreibtisch; sie
# zeigt hierher. Ist sie weg, tut es diese Datei per Doppelklick.
# Einrichten muss man damit nicht mehr — dafür: einrichten-macos.command.
#
# Dieses Fenster IST der Server. Kleinmachen ja — schließen beendet ihn.

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
  echo; say "  Node.js ist nicht da. Einmal einrichten-macos.command doppelklicken —" "  Node.js is not here. Double-click einrichten-macos.command once —" "  Node.js не найден. Один раз дважды щёлкните einrichten-macos.command —"
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
