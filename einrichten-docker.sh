#!/bin/bash
# KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
# KlangTresor einrichten — mit Docker (Linux).
#
#   ./einrichten-docker.sh
#   (Sollte er sich weigern, einmal: chmod +x einrichten-docker.sh)
#
# Der Unterschied zu den anderen drei Skripten: Hier wird auf DIESEM
# Rechner nichts installiert — kein Node, kein ffmpeg. Alles liegt im
# Container. Gebraucht wird nur Docker.
#
# Das Archiv bleibt trotzdem draußen auf der Platte (./library), ebenso
# ein etwaiges Cookie (./geheim). Der Container lässt sich wegwerfen und
# neu bauen, ohne dass Musik verlorengeht.
#
# macOS: einrichten-docker.command doppelklicken · Windows: einrichten-docker.ps1

cd "$(dirname "$0")" || exit 1
set -u

echo ""
echo "  KlangTresor einrichten — Docker (Linux)"
echo "  =========================="
echo ""

if ! command -v docker >/dev/null 2>&1; then
  # WELCHES Docker - auf Linux ist das nicht "Docker Desktop", sondern die
  # Docker ENGINE. Und die Fassung aus dem Distributionspaket (docker.io)
  # ist oft mehrere Jahre alt; das offizielle Paket heisst docker-ce.
  # Darum hier der Weg, den Docker selbst empfiehlt.
  . /etc/os-release 2>/dev/null || true
  echo "  ✗ Docker fehlt."
  echo ""
  echo "    Auf Linux brauchst du die Docker ENGINE (nicht Docker Desktop)."
  echo "    Der von Docker selbst empfohlene Weg, für jede Distribution:"
  echo ""
  echo "      curl -fsSL https://get.docker.com | sudo sh"
  echo ""
  case "${ID:-}${ID_LIKE:-}" in
    *debian*|*ubuntu*)
      echo "    Alternativ aus deiner Distribution (meist ältere Fassung):"
      echo "      sudo apt install -y docker.io docker-compose-v2" ;;
    *fedora*|*rhel*)
      echo "    Alternativ aus deiner Distribution:"
      echo "      sudo dnf install -y docker docker-compose" ;;
    *arch*)
      echo "    Alternativ aus deiner Distribution:"
      echo "      sudo pacman -S docker docker-compose" ;;
    *suse*)
      echo "    Alternativ aus deiner Distribution:"
      echo "      sudo zypper install docker docker-compose" ;;
  esac
  echo ""
  echo "    DANACH ZWEI DINGE, die oft vergessen werden:"
  echo "      sudo systemctl enable --now docker     # Dienst starten"
  echo "      sudo usermod -aG docker \"$USER\"        # dich zur Gruppe hinzufügen"
  echo ""
  echo "    Nach dem usermod einmal ab- und wieder anmelden, sonst braucht"
  echo "    jeder docker-Befehl weiterhin sudo. Dann dieses Skript erneut."
  echo ""
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "  ✗ Docker ist installiert, antwortet aber nicht."
  echo ""
  # Zwei ganz verschiedene Ursachen - und die Meldung ist dieselbe.
  if sudo -n docker info >/dev/null 2>&1; then
    echo "    Mit sudo geht es, ohne nicht: Dir fehlt die Gruppe."
    echo ""
    echo "      sudo usermod -aG docker \"$USER\""
    echo ""
    echo "    Danach ab- und wieder anmelden (oder: newgrp docker)."
  else
    echo "    Vermutlich läuft der Dienst nicht:"
    echo ""
    echo "      sudo systemctl enable --now docker"
    echo ""
    echo "    Nachsehen mit:  systemctl status docker"
  fi
  echo ""
  exit 1
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
