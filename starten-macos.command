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
NODE=node
[ -x werkzeug/node/bin/node ] && NODE=werkzeug/node/bin/node
if ! command -v "$NODE" >/dev/null 2>&1; then
  echo; echo "  Node.js ist nicht da. Einmal einrichten-macos.command doppelklicken —"
  echo "  das holt es und richtet alles ein."; echo
  read -r -p "  [Eingabetaste zum Schließen] " _; exit 1
fi
if [ ! -f server/server.js ]; then
  echo; echo "  Hier liegt kein KlangTresor. Diese Datei gehört in den Ordner mit"
  echo "  server/ und web/ darin."; echo
  read -r -p "  [Eingabetaste zum Schließen] " _; exit 1
fi
echo
echo "  Dieses Fenster bleibt offen, solange du hörst."
echo "  Kleinmachen ist in Ordnung — schließen beendet KlangTresor."
echo
# bin/starten.js: Server in der Neustart-Schleife, dann Browser auf — Chrome, wenn da.
exec "$NODE" bin/starten.js
