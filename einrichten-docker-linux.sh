#!/bin/bash
# KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
# KlangTresor einrichten — mit Docker (Linux).
#
#   ./einrichten-docker-linux.sh
#   (Sollte er sich weigern, einmal: chmod +x einrichten-docker-linux.sh)
#
# Der Unterschied zu den anderen drei Skripten: Hier wird auf DIESEM
# Rechner nichts installiert — kein Node, kein ffmpeg. Alles liegt im
# Container. Gebraucht wird nur Docker.
#
# Das Archiv bleibt trotzdem draußen auf der Platte (./library). Der
# Container lässt sich wegwerfen und neu bauen, ohne dass Musik
# verlorengeht. Die Bauanleitung liegt in docker/.
#
# macOS: einrichten-docker-macos.command · Windows: einrichten-docker-windows.cmd
# Ohne Docker: einrichten-linux.sh

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
set -u

echo ""
say "  KlangTresor einrichten — Docker (Linux)" "  KlangTresor setup — Docker (Linux)" "  Установка KlangTresor — Docker (Linux)"
echo "  =========================="
echo ""

if ! command -v docker >/dev/null 2>&1; then
  # WELCHES Docker - auf Linux ist das nicht "Docker Desktop", sondern die
  # Docker ENGINE. Und die Fassung aus dem Distributionspaket (docker.io)
  # ist oft mehrere Jahre alt; das offizielle Paket heisst docker-ce.
  # Darum hier der Weg, den Docker selbst empfiehlt.
  . /etc/os-release 2>/dev/null || true
  say "  ✗ Docker fehlt." "  ✗ Docker is missing." "  ✗ Docker не установлен."
  echo ""
  say "    Auf Linux brauchst du die Docker ENGINE (nicht Docker Desktop)." "    On Linux you need the Docker ENGINE (not Docker Desktop)." "    В Linux нужен Docker ENGINE (а не Docker Desktop)."
  say "    Der von Docker selbst empfohlene Weg, für jede Distribution:" "    The way Docker itself recommends, for every distribution:" "    Способ, рекомендованный самим Docker, для любого дистрибутива:"
  echo ""
  echo "      curl -fsSL https://get.docker.com | sudo sh"
  echo ""
  case "${ID:-}${ID_LIKE:-}" in
    *debian*|*ubuntu*)
      say "    Alternativ aus deiner Distribution (meist ältere Fassung):" "    Alternatively from your distribution (usually an older version):" "    Либо из вашего дистрибутива (обычно более старая версия):"
      echo "      sudo apt install -y docker.io docker-compose-v2" ;;
    *fedora*|*rhel*)
      say "    Alternativ aus deiner Distribution:" "    Alternatively from your distribution:" "    Либо из вашего дистрибутива:"
      echo "      sudo dnf install -y docker docker-compose" ;;
    *arch*)
      say "    Alternativ aus deiner Distribution:" "    Alternatively from your distribution:" "    Либо из вашего дистрибутива:"
      echo "      sudo pacman -S docker docker-compose" ;;
    *suse*)
      say "    Alternativ aus deiner Distribution:" "    Alternatively from your distribution:" "    Либо из вашего дистрибутива:"
      echo "      sudo zypper install docker docker-compose" ;;
  esac
  echo ""
  say "    DANACH ZWEI DINGE, die oft vergessen werden:" "    AFTERWARDS TWO THINGS that are often forgotten:" "    ПОСЛЕ ЭТОГО ДВЕ ВЕЩИ, о которых часто забывают:"
  say "      sudo systemctl enable --now docker     # Dienst starten" "      sudo systemctl enable --now docker     # start the service" "      sudo systemctl enable --now docker     # запустить службу"
  say "      sudo usermod -aG docker \"$USER\"        # dich zur Gruppe hinzufügen" "      sudo usermod -aG docker \"$USER\"        # add yourself to the group" "      sudo usermod -aG docker \"$USER\"        # добавить себя в группу"
  echo ""
  say "    Nach dem usermod einmal ab- und wieder anmelden, sonst braucht" "    After the usermod, log out and in again once, otherwise" "    После usermod один раз выйдите из системы и войдите снова, иначе"
  say "    jeder docker-Befehl weiterhin sudo. Dann dieses Skript erneut." "    every docker command still needs sudo. Then run this script again." "    каждая команда docker по-прежнему потребует sudo. Затем запустите этот скрипт снова."
  echo ""
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  say "  ✗ Docker ist installiert, antwortet aber nicht." "  ✗ Docker is installed but is not answering." "  ✗ Docker установлен, но не отвечает."
  echo ""
  # Zwei ganz verschiedene Ursachen - und die Meldung ist dieselbe.
  if sudo -n docker info >/dev/null 2>&1; then
    say "    Mit sudo geht es, ohne nicht: Dir fehlt die Gruppe." "    It works with sudo but not without: you are missing the group." "    С sudo работает, без него нет: вам не хватает членства в группе."
    echo ""
    echo "      sudo usermod -aG docker \"$USER\""
    echo ""
    say "    Danach ab- und wieder anmelden (oder: newgrp docker)." "    Then log out and in again (or: newgrp docker)." "    Затем выйдите из системы и войдите снова (или: newgrp docker)."
  else
    say "    Vermutlich läuft der Dienst nicht:" "    Probably the service is not running:" "    Вероятно, служба не запущена:"
    echo ""
    echo "      sudo systemctl enable --now docker"
    echo ""
    say "    Nachsehen mit:  systemctl status docker" "    To check:  systemctl status docker" "    Проверить:  systemctl status docker"
  fi
  echo ""
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  say "  ✗ Docker Compose fehlt (gehört bei Docker Desktop dazu)." "  ✗ Docker Compose is missing (it comes with Docker Desktop)." "  ✗ Docker Compose не найден (он входит в состав Docker Desktop)."
  echo "    Linux:  sudo apt install docker-compose-plugin"
  echo ""
  exit 1
fi

say "  ✓ Docker läuft  ($DC)" "  ✓ Docker is running  ($DC)" "  ✓ Docker работает  ($DC)"

mkdir -p library
say "  ✓ Ordner library/ liegt bereit" "  ✓ The folder library/ is ready" "  ✓ Папка library/ готова"

echo ""
say "  → Kiste bauen und starten. Beim ersten Mal dauert das einige" "  → Building and starting the box. The first time this takes a few" "  → Собираю и запускаю контейнер. В первый раз это займёт несколько"
say "    Minuten: Node, ffmpeg und die Pakete kommen hinein." "    minutes: Node, ffmpeg and the packages go into it." "    минут: в него устанавливаются Node, ffmpeg и пакеты."
echo ""
$DC -f docker/docker-compose.yml up -d --build || { say "  Der Start ist gescheitert. Meldungen oben lesen." "  The start failed. Read the messages above." "  Запуск не удался. Прочитайте сообщения выше."; exit 1; }

echo ""
say "  → Warten, bis der Server antwortet …" "  → Waiting for the server to answer …" "  → Жду, пока сервер ответит …"
for i in $(seq 1 60); do
  if curl -fsS -o /dev/null http://localhost:8788/ 2>/dev/null; then bereit=1; break; fi
  sleep 2
done

IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')

echo ""
if [ "${bereit:-0}" = "1" ]; then
  say "  Fertig. KlangTresor läuft." "  Done. KlangTresor is running." "  Готово. KlangTresor работает."
else
  say "  Der Container läuft, antwortet aber noch nicht." "  The container is running but is not answering yet." "  Контейнер работает, но пока не отвечает."
  say "  Beim ersten Start holt er die KI-Modelle — das kann dauern." "  On the first start it fetches the AI models — that can take a while." "  При первом запуске он загружает модели ИИ — это может занять время."
  say "  Nachsehen mit:  $DC -f docker/docker-compose.yml logs -f" "  To check:  $DC -f docker/docker-compose.yml logs -f" "  Посмотреть:  $DC -f docker/docker-compose.yml logs -f"
fi
echo ""
say "  Adresse:  http://localhost:8788" "  Address:  http://localhost:8788" "  Адрес:    http://localhost:8788"
[ -n "${IP:-}" ] && say "  Im WLAN:  http://$IP:8788" "  On Wi-Fi: http://$IP:8788" "  По Wi-Fi: http://$IP:8788"
echo ""
say "  IM BROWSER WEITERMACHEN — ein Terminal brauchst du ab jetzt nicht mehr:" "  CARRY ON IN THE BROWSER — you do not need a terminal from now on:" "  ПРОДОЛЖАЙТЕ В БРАУЗЕРЕ — терминал вам больше не понадобится:"
say "    1. Oben rechts deinen Suno-Alias eintragen (er wird geprüft)." "    1. Enter your Suno alias at the top right (it is checked)." "    1. Введите свой псевдоним Suno вверху справа (он проверяется)."
say "    2. Den roten Knopf drücken. Er holt die Songliste, lädt Medien" "    2. Press the red button. It fetches the song list, downloads media" "    2. Нажмите красную кнопку. Она загрузит список треков, медиафайлы"
say "       und rechnet die Analysen — alles im Hintergrund." "       and computes the analyses — all in the background." "       и выполнит анализ — всё в фоновом режиме."
echo ""
say "  Der Container startet ab jetzt mit dem Rechner von selbst wieder." "  From now on the container starts again by itself with the computer." "  Отныне контейнер сам запускается вместе с компьютером."
say "  Anhalten:   $DC -f docker/docker-compose.yml down" "  Stop:       $DC -f docker/docker-compose.yml down" "  Остановка:  $DC -f docker/docker-compose.yml down"
say "  Protokoll:  $DC -f docker/docker-compose.yml logs -f" "  Log:        $DC -f docker/docker-compose.yml logs -f" "  Журнал:     $DC -f docker/docker-compose.yml logs -f"
echo ""
(command -v open >/dev/null 2>&1 && open http://localhost:8788) \
  || (command -v xdg-open >/dev/null 2>&1 && xdg-open http://localhost:8788 >/dev/null 2>&1) &
