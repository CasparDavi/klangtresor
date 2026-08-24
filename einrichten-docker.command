#!/bin/bash
# KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
# KlangTresor einrichten — mit Docker (macOS, zum Doppelklicken).
#
# Doppelklick genügt: Der Finder öffnet dafür ein Terminal. Fragt er
# stattdessen, womit die Datei zu öffnen sei, einmal Rechtsklick → Öffnen.
#
# Der Unterschied zu den anderen drei Skripten: Hier wird auf DIESEM
# Rechner nichts installiert — kein Node, kein ffmpeg. Alles liegt im
# Container. Gebraucht wird nur Docker.
#
# Das Archiv bleibt trotzdem draußen auf der Platte (./library), ebenso
# ein etwaiges Cookie (./geheim). Der Container lässt sich wegwerfen und
# neu bauen, ohne dass Musik verlorengeht.
#
# Windows: dafür gibt es einrichten-docker.ps1

cd "$(dirname "$0")" || exit 1
set -u

echo ""
echo "  KlangTresor einrichten — Docker (macOS)"
echo "  =========================="
echo ""

if ! command -v docker >/dev/null 2>&1; then
  # WELCHES Docker - das hängt am Prozessor. Ein Abbild für Apple Silicon
  # läuft nicht auf Intel und umgekehrt; wer das falsche lädt, bekommt
  # eine Fehlermeldung, mit der niemand etwas anfangen kann.
  ARCH=$(uname -m)
  echo "  ✗ Docker fehlt."
  echo ""
  if [ "$ARCH" = "arm64" ]; then
    echo "    Dieser Mac hat Apple Silicon (M1/M2/M3/M4)."
    echo "    Passende Fassung:"
    echo "      https://desktop.docker.com/mac/main/arm64/Docker.dmg"
  else
    echo "    Dieser Mac hat einen Intel-Prozessor."
    echo "    Passende Fassung:"
    echo "      https://desktop.docker.com/mac/main/amd64/Docker.dmg"
  fi
  echo ""
  echo "    Oder mit Homebrew (holt automatisch die richtige):"
  echo "      brew install --cask docker"
  echo ""
  echo "    Nach der Installation: Docker Desktop einmal aus dem"
  echo "    Programme-Ordner starten und die Lizenz bestätigen."
  echo "    Danach diese Datei erneut doppelklicken."
  echo ""
  read -r -p "  [Eingabetaste zum Schließen] " _
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "  ✗ Docker ist installiert, läuft aber nicht."
  echo ""
  echo "    Docker Desktop starten (Programme-Ordner oder Spotlight)."
  echo "    Oben in der Menüleiste erscheint ein Wal-Symbol: Solange es"
  echo "    sich bewegt, fährt Docker noch hoch. Wenn es ruhig steht,"
  echo "    diese Datei erneut doppelklicken."
  echo ""
  echo "    Ich kann versuchen, ihn zu starten — soll ich?"
  read -r -p "    [j] starten und warten · sonst abbrechen: " a
  if [ "${a:-n}" = "j" ] || [ "${a:-n}" = "J" ]; then
    open -a Docker 2>/dev/null
    echo "    Warte auf Docker …"
    for i in $(seq 1 40); do
      docker info >/dev/null 2>&1 && { echo "    ✓ Docker läuft."; break; }
      sleep 5
    done
    docker info >/dev/null 2>&1 || { echo "    Docker antwortet nicht. Bitte von Hand starten."; read -r -p "  [Eingabetaste] " _; exit 1; }
  else
    exit 1
  fi
fi

if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "  ✗ Docker Compose fehlt (gehört bei Docker Desktop dazu)."
  echo "    Linux:  sudo apt install docker-compose-plugin"
  echo ""
  exit 1
fi

echo "  ✓ Docker läuft  ($DC)"

mkdir -p library geheim
echo "  ✓ Ordner library/ und geheim/ liegen bereit"

# Liegt das Projekt auf einer exFAT-Platte (externe SSD, USB-Stick), legt
# macOS neben jeder Datei eine "._"-Datei an. Docker stolpert beim Lesen
# darüber ("failed to xattr ... operation not permitted") und bricht ab,
# bevor überhaupt gebaut wird. dot_clean räumt sie weg; auf APFS-Platten
# gibt es sie gar nicht erst, dann tut der Aufruf nichts.
if command -v dot_clean >/dev/null 2>&1; then
  dot_clean -m . 2>/dev/null && echo "  ✓ macOS-Beifang (._-Dateien) geräumt"
fi

echo ""
echo "  → Kiste bauen und starten. Beim ersten Mal dauert das einige"
echo "    Minuten: Node, ffmpeg und die Pakete kommen hinein."
echo ""
$DC up -d --build || { echo "  Der Start ist gescheitert. Meldungen oben lesen."; exit 1; }

echo ""
echo "  → Warten, bis der Server antwortet …"
for i in $(seq 1 60); do
  if curl -fsS -o /dev/null http://localhost:8788/ 2>/dev/null; then bereit=1; break; fi
  sleep 2
done

IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')

echo ""
if [ "${bereit:-0}" = "1" ]; then
  echo "  Fertig. KlangTresor läuft."
else
  echo "  Der Container läuft, antwortet aber noch nicht."
  echo "  Beim ersten Start holt er die KI-Modelle — das kann dauern."
  echo "  Nachsehen mit:  $DC logs -f"
fi
echo ""
echo "  Adresse:  http://localhost:8788"
[ -n "${IP:-}" ] && echo "  Im WLAN:  http://$IP:8788"
echo ""
echo "  IM BROWSER WEITERMACHEN — ein Terminal brauchst du ab jetzt nicht mehr:"
echo "    1. Oben rechts deinen Suno-Alias eintragen (er wird geprüft)."
echo "    2. Den roten Knopf drücken. Er holt die Songliste, lädt Medien"
echo "       und rechnet die Analysen — alles im Hintergrund."
echo ""
echo "  Der Container startet ab jetzt mit dem Rechner von selbst wieder."
echo "  Anhalten:  $DC down     ·     Protokoll:  $DC logs -f"
echo ""
(command -v open >/dev/null 2>&1 && open http://localhost:8788) \
  || (command -v xdg-open >/dev/null 2>&1 && xdg-open http://localhost:8788 >/dev/null 2>&1) &
read -r -p "  [Eingabetaste zum Schließen dieses Fensters] " _
