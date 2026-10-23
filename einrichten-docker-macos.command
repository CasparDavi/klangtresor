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
# Das Archiv bleibt trotzdem draußen auf der Platte (./library). Der
# Container lässt sich wegwerfen und neu bauen, ohne dass Musik
# verlorengeht. Die Bauanleitung liegt in docker/.
#
# Windows: einrichten-docker-windows.cmd · Linux: einrichten-docker-linux.sh
# Ohne Docker: einrichten-macos.command

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
set -u

echo ""
say "  KlangTresor einrichten — Docker (macOS)" "  KlangTresor setup — Docker (macOS)" "  Установка KlangTresor — Docker (macOS)"
echo "  =========================="
echo ""

if ! command -v docker >/dev/null 2>&1; then
  # WELCHES Docker - das hängt am Prozessor. Ein Abbild für Apple Silicon
  # läuft nicht auf Intel und umgekehrt; wer das falsche lädt, bekommt
  # eine Fehlermeldung, mit der niemand etwas anfangen kann.
  ARCH=$(uname -m)
  say "  ✗ Docker fehlt." "  ✗ Docker is missing." "  ✗ Docker не установлен."
  echo ""
  if [ "$ARCH" = "arm64" ]; then
    say "    Dieser Mac hat Apple Silicon (M1/M2/M3/M4)." "    This Mac has Apple Silicon (M1/M2/M3/M4)." "    В этом Mac установлен Apple Silicon (M1/M2/M3/M4)."
    say "    Passende Fassung:" "    Matching version:" "    Подходящая версия:"
    echo "      https://desktop.docker.com/mac/main/arm64/Docker.dmg"
  else
    say "    Dieser Mac hat einen Intel-Prozessor." "    This Mac has an Intel processor." "    В этом Mac установлен процессор Intel."
    say "    Passende Fassung:" "    Matching version:" "    Подходящая версия:"
    echo "      https://desktop.docker.com/mac/main/amd64/Docker.dmg"
  fi
  echo ""
  say "    Oder mit Homebrew (holt automatisch die richtige):" "    Or with Homebrew (it fetches the right one automatically):" "    Или через Homebrew (он сам выберет подходящую версию):"
  echo "      brew install --cask docker"
  echo ""
  say "    Nach der Installation: Docker Desktop einmal aus dem" "    After the installation: start Docker Desktop once from the" "    После установки: один раз запустите Docker Desktop из"
  say "    Programme-Ordner starten und die Lizenz bestätigen." "    Applications folder and accept the licence." "    папки «Программы» и подтвердите лицензию."
  say "    Danach diese Datei erneut doppelklicken." "    Then double-click this file again." "    Затем дважды щёлкните этот файл ещё раз."
  echo ""
  read -r -p "$(t "  [Eingabetaste zum Schließen] " "  [Press Enter to close] " "  [Нажмите Enter, чтобы закрыть] ")" _
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  say "  ✗ Docker ist installiert, läuft aber nicht." "  ✗ Docker is installed but not running." "  ✗ Docker установлен, но не запущен."
  echo ""
  say "    Docker Desktop starten (Programme-Ordner oder Spotlight)." "    Start Docker Desktop (Applications folder or Spotlight)." "    Запустите Docker Desktop (папка «Программы» или Spotlight)."
  say "    Oben in der Menüleiste erscheint ein Wal-Symbol: Solange es" "    A whale icon appears in the menu bar at the top: as long as it" "    В строке меню вверху появится значок кита: пока он"
  say "    sich bewegt, fährt Docker noch hoch. Wenn es ruhig steht," "    is moving, Docker is still starting up. When it stands still," "    движется, Docker ещё запускается. Когда он замрёт,"
  say "    diese Datei erneut doppelklicken." "    double-click this file again." "    дважды щёлкните этот файл ещё раз."
  echo ""
  say "    Ich kann versuchen, ihn zu starten — soll ich?" "    I can try to start it — shall I?" "    Я могу попробовать запустить его — запустить?"
  read -r -p "$(t "    [j] starten und warten · sonst abbrechen: " "    [y] start and wait · anything else cancels: " "    [д] запустить и подождать · иначе отмена: ")" a
  if case "${a:-n}" in j|J|y|Y|д|Д) true ;; *) false ;; esac; then
    open -a Docker 2>/dev/null
    say "    Warte auf Docker …" "    Waiting for Docker …" "    Жду Docker …"
    for i in $(seq 1 40); do
      docker info >/dev/null 2>&1 && { say "    ✓ Docker läuft." "    ✓ Docker is running." "    ✓ Docker работает."; break; }
      sleep 5
    done
    docker info >/dev/null 2>&1 || { say "    Docker antwortet nicht. Bitte von Hand starten." "    Docker is not answering. Please start it by hand." "    Docker не отвечает. Запустите его вручную."; read -r -p "$(t "  [Eingabetaste] " "  [Press Enter] " "  [Нажмите Enter] ")" _; exit 1; }
  else
    exit 1
  fi
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

# Liegt das Projekt auf einer exFAT-Platte (externe SSD, USB-Stick), legt
# macOS neben jeder Datei eine "._"-Datei an. Docker stolpert beim Lesen
# darüber ("failed to xattr ... operation not permitted") und bricht ab,
# bevor überhaupt gebaut wird. dot_clean räumt sie weg; auf APFS-Platten
# gibt es sie gar nicht erst, dann tut der Aufruf nichts.
if command -v dot_clean >/dev/null 2>&1; then
  dot_clean -m . 2>/dev/null && say "  ✓ macOS-Beifang (._-Dateien) geräumt" "  ✓ macOS clutter (._ files) cleared away" "  ✓ Служебные файлы macOS (._) удалены"
fi

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
read -r -p "$(t "  [Eingabetaste zum Schließen dieses Fensters] " "  [Press Enter to close this window] " "  [Нажмите Enter, чтобы закрыть это окно] ")" _
