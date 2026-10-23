# KlangTresor - Copyright (c) 2026 Caspar_D - MIT, siehe LICENSE
# KlangTresor einrichten - mit Docker (Windows).
#
# Doppelklick auf einrichten-docker-windows.cmd - das ist der Weg. Diese
# Datei liegt in bin\, weil sie niemand selbst anklicken soll; die .cmd
# haelt das Fenster offen und umgeht die ExecutionPolicy fuer diesen Aufruf.
#
# Der Unterschied zu bin\anlasser.ps1 (dem ueblichen Weg): Hier wird auf
# DIESEM Rechner nichts installiert - kein Node, kein ffmpeg. Alles liegt im Container.
# Gebraucht wird nur Docker Desktop.
#
# Das Archiv bleibt trotzdem draussen auf der Platte (.\library). Der
# Container laesst sich wegwerfen und neu bauen, ohne dass Musik
# verlorengeht. Die Bauanleitung liegt in docker\.

Set-Location -Path (Split-Path -Parent $PSScriptRoot)   # bin\ -> Projektordner
$ErrorActionPreference = 'Continue'

# SPRACHE (de, en, ru): KT_SPRACHE, sonst die Anzeigesprache von Windows - wie bin\anlasser.ps1.
$SPR = ("$env:KT_SPRACHE").Trim().ToLower()
if ($SPR -notin 'de', 'en', 'ru') {
  $kultur = ''
  try { $kultur = (Get-UICulture).Name.ToLower() } catch {}
  $SPR = if ($kultur.StartsWith('ru')) { 'ru' } elseif ($kultur.StartsWith('de')) { 'de' } else { 'en' }
}
$env:KT_SPRACHE = $SPR
function L($de, $en, $ru) { switch ($SPR) { 'ru' { $ru } 'en' { $en } default { $de } } }
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ALLES WIRD MITGESCHRIEBEN (Caspar_D, 14.09.2026: "das laeuft einfach durch und
# ich kann nicht in cmd scrollen"). Ein Einrichtungsskript, dessen Ausgabe nur im
# Fenster steht, laesst den Nutzer mit leeren Haenden zurueck, sobald der Puffer
# voll ist - und beim Bauen eines Images ist er das nach zwei Minuten.
$Protokoll = Join-Path (Get-Location) 'einrichten-docker.log'
try { Remove-Item $Protokoll -ErrorAction SilentlyContinue } catch {}
function Sag([string]$t = '') {
  Write-Host $t
  try { Add-Content -Path $Protokoll -Value $t -Encoding UTF8 } catch {}
}

# WENN DOCKER NICHT ANTWORTET, SAGT DAS SKRIPT WARUM. Nicht mehr als das:
# Windows braucht fuer Docker Desktop WSL 2, und ob es da ist, laesst sich in
# zwei Zeilen nachsehen. (Die Sonderfaelle virtueller Maschinen bleiben
# draussen - Caspar_D, 14.09.2026: "versuch jetzt nicht die ganzen
# virtualisierungsbesonderheiten abzufedern".)
function Warum-Kein-Docker {
  $z = @{}
  foreach ($f in 'VirtualMachinePlatform', 'Microsoft-Windows-Subsystem-Linux') {
    try { $z[$f] = (Get-WindowsOptionalFeature -Online -FeatureName $f -ErrorAction Stop).State }
    catch { $z[$f] = 'unbekannt' }
  }
  if ($z.VirtualMachinePlatform -ne 'Enabled' -or $z.'Microsoft-Windows-Subsystem-Linux' -ne 'Enabled') {
    Sag ""
    Sag (L "  DOCKER DESKTOP BRAUCHT WSL 2, UND DAS FEHLT HIER:" "  DOCKER DESKTOP NEEDS WSL 2, AND IT IS MISSING HERE:" "  DOCKER DESKTOP ТРЕБУЕТ WSL 2, А ЕГО ЗДЕСЬ НЕТ:")
    Sag ("    VirtualMachinePlatform  : {0}" -f $z.VirtualMachinePlatform)
    Sag ("    Windows-Subsystem Linux : {0}" -f $z.'Microsoft-Windows-Subsystem-Linux')
    Sag ""
    Sag (L "  In einer PowerShell ALS ADMINISTRATOR (Rechtsklick aufs Startmenue" "  In a PowerShell AS ADMINISTRATOR (right-click the Start menu" "  В PowerShell ОТ ИМЕНИ АДМИНИСТРАТОРА (щёлкните правой кнопкой по меню «Пуск»")
    Sag (L "  -> Terminal (Administrator)):" "  -> Terminal (Administrator)):" "  -> Терминал (администратор)):")
    Sag ""
    Sag "      wsl --install"
    Sag ""
    Sag (L "  Danach Windows neu starten." "  Then restart Windows." "  Затем перезагрузите Windows.")
  }
}

Sag ""
Sag (L "  KlangTresor einrichten - Docker (Windows)" "  KlangTresor setup - Docker (Windows)" "  Установка KlangTresor - Docker (Windows)")
Sag "  ===================================="
Sag ""
Sag ((L "  (Alles Weitere steht auch in {0})" "  (Everything else is also in {0})" "  (Всё остальное есть и в {0})") -f $Protokoll)
Sag ""

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Sag (L "  [--] Docker fehlt." "  [--] Docker is missing." "  [--] Docker не установлен.")
  Warum-Kein-Docker
  Sag ""
  # Docker Desktop braucht auf Windows den WSL-2-Unterbau. Fehlt der, bricht
  # die Installation spaeter mit einer Meldung ab, mit der niemand etwas
  # anfangen kann - deshalb hier vorher nachsehen und beides nennen.
  $wsl = Get-Command wsl -ErrorAction SilentlyContinue
  $wslOk = $false
  if ($wsl) { & wsl --status *> $null; $wslOk = ($LASTEXITCODE -eq 0) }

  if (-not $wslOk) {
    Sag (L "    ZUERST der Unterbau: Docker Desktop braucht WSL 2." "    FIRST the foundation: Docker Desktop needs WSL 2." "    СНАЧАЛА основа: Docker Desktop требует WSL 2.")
    Sag (L "    In einer PowerShell ALS ADMINISTRATOR (Rechtsklick auf das" "    In a PowerShell AS ADMINISTRATOR (right-click the" "    В PowerShell ОТ ИМЕНИ АДМИНИСТРАТОРА (щёлкните правой кнопкой по")
    Sag (L "    Startmenue -> Terminal (Administrator)):" "    Start menu -> Terminal (Administrator)):" "    меню «Пуск» -> Терминал (администратор)):")
    Sag ""
    Sag "      wsl --install"
    Sag ""
    Sag (L "    Danach Windows neu starten." "    Then restart Windows." "    Затем перезагрузите Windows.")
    Sag ""
    Sag (L "    Geht das nicht, ist meist die Virtualisierung im BIOS/UEFI" "    If that does not work, virtualisation is usually switched off in the BIOS/UEFI" "    Если это не получается, обычно в BIOS/UEFI отключена виртуализация")
    Sag (L "    abgeschaltet (heisst dort 'Intel VT-x', 'AMD-V' oder 'SVM')." "    (it is called 'Intel VT-x', 'AMD-V' or 'SVM' there)." "    (она называется там 'Intel VT-x', 'AMD-V' или 'SVM').")
    Sag ""
    Sag (L "    DANN erst:" "    ONLY THEN:" "    И ТОЛЬКО ПОТОМ:")
  }
  Sag "      winget install Docker.DockerDesktop"
  Sag ""
  Sag (L "    Oder von Hand:  https://www.docker.com/products/docker-desktop" "    Or by hand:  https://www.docker.com/products/docker-desktop" "    Или вручную:  https://www.docker.com/products/docker-desktop")
  Sag ""
  Sag (L "    Nach der Installation Windows neu starten, Docker Desktop" "    After the installation restart Windows, open Docker Desktop" "    После установки перезагрузите Windows, один раз откройте Docker Desktop,")
  Sag (L "    einmal oeffnen, die Lizenz bestaetigen - und dann diese" "    once, accept the licence - and then run this" "    подтвердите лицензию - а затем снова запустите")
  Sag (L "    Datei erneut ausfuehren." "    file again." "    этот файл.")
  Sag ""
  Read-Host (L "  [Eingabetaste zum Schliessen]" "  [Press Enter to close]" "  [Нажмите Enter, чтобы закрыть]")
  exit 1
}

& docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Sag (L "  [--] Docker ist installiert, laeuft aber nicht." "  [--] Docker is installed but not running." "  [--] Docker установлен, но не запущен.")
  Sag ""
  Sag (L "    Ich kann versuchen, Docker Desktop zu starten - soll ich?" "    I can try to start Docker Desktop - shall I?" "    Я могу попробовать запустить Docker Desktop - запустить?")
  $a = Read-Host (L "    [j] starten und warten - sonst abbrechen" "    [y] start and wait - anything else cancels" "    [д] запустить и подождать - иначе отмена")
  if ($a -match '^[jJyYдД]$') {
    # OHNE ADMINISTRATOR INSTALLIERT DOCKER DESKTOP IN DAS BENUTZERPROFIL
    # (gefunden 14.09.2026: Caspar_Ds Installation lag unter %LOCALAPPDATA%,
    # das Skript haette "nicht gefunden" gesagt, obwohl sie da war).
    $exe = @(
      "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
      "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
      "$env:LOCALAPPDATA\Programs\DockerDesktop\frontend\Docker Desktop.exe",
      "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($exe) { Start-Process $exe } else { Sag (L "    Docker Desktop nicht gefunden - bitte von Hand starten." "    Docker Desktop not found - please start it by hand." "    Docker Desktop не найден - запустите его вручную.") }
    Sag (L "    Warte auf Docker ..." "    Waiting for Docker ..." "    Жду Docker ...")
    for ($i = 0; $i -lt 40; $i++) {
      & docker info *> $null
      if ($LASTEXITCODE -eq 0) { Sag (L "    [ok] Docker laeuft." "    [ok] Docker is running." "    [ok] Docker работает."); break }
      Start-Sleep -Seconds 5
    }
    & docker info *> $null
    if ($LASTEXITCODE -ne 0) {
      Sag (L "    Docker antwortet nicht. Docker Desktop von Hand oeffnen" "    Docker is not answering. Open Docker Desktop by hand" "    Docker не отвечает. Откройте Docker Desktop вручную")
      Sag (L "    und warten, bis das Wal-Symbol unten rechts ruhig steht." "    and wait until the whale icon at the bottom right stands still." "    и дождитесь, пока значок кита внизу справа не замрёт.")
      Sag (L "    Steht dort ein Fehler oder bleibt es bei 'Starting', hilft das hier:" "    If it shows an error or stays at 'Starting', this helps:" "    Если там ошибка или всё остаётся на 'Starting', поможет следующее:")
      Warum-Kein-Docker
      Read-Host (L "  [Eingabetaste]" "  [Press Enter]" "  [Нажмите Enter]")
      exit 1
    }
  } else { exit 1 }
}

& docker compose version *> $null
if ($LASTEXITCODE -eq 0) { $DCEXE = 'docker'; $DCARG = @('compose') }
elseif (Get-Command docker-compose -ErrorAction SilentlyContinue) { $DCEXE = 'docker-compose'; $DCARG = @() }
else {
  Sag (L "  [--] Docker Compose fehlt (gehoert bei Docker Desktop dazu)." "  [--] Docker Compose is missing (it comes with Docker Desktop)." "  [--] Docker Compose не найден (он входит в состав Docker Desktop).")
  Read-Host (L "  [Eingabetaste]" "  [Press Enter]" "  [Нажмите Enter]")
  exit 1
}

Sag (L "  [ok] Docker laeuft" "  [ok] Docker is running" "  [ok] Docker работает")

New-Item -ItemType Directory -Force -Path 'library' | Out-Null
Sag (L "  [ok] Ordner library\ liegt bereit" "  [ok] The folder library\ is ready" "  [ok] Папка library\ готова")

Sag ""
Sag (L "  -> Kiste bauen und starten. Beim ersten Mal dauert das einige" "  -> Building and starting the box. The first time this takes a few" "  -> Собираю и запускаю контейнер. В первый раз это займёт несколько")
Sag (L "     Minuten: Node, ffmpeg und die Pakete kommen hinein." "     minutes: Node, ffmpeg and the packages go into it." "     минут: в него устанавливаются Node, ffmpeg и пакеты.")
Sag ""
# Die Bauanleitung liegt in docker\, der Kontext ist der Projektordner.
& $DCEXE @DCARG -f docker\docker-compose.yml up -d --build
if ($LASTEXITCODE -ne 0) {
  Sag ""
  Sag (L "  Der Start ist gescheitert. Die Meldungen oben sagen warum." "  The start failed. The messages above say why." "  Запуск не удался. Причина указана в сообщениях выше.")
  Read-Host (L "  [Eingabetaste]" "  [Press Enter]" "  [Нажмите Enter]")
  exit 1
}

Sag ""
Sag (L "  -> Warten, bis der Server antwortet ..." "  -> Waiting for the server to answer ..." "  -> Жду, пока сервер ответит ...")
$bereit = $false
for ($i = 0; $i -lt 60; $i++) {
  try {
    $a = Invoke-WebRequest -Uri 'http://localhost:8788/' -UseBasicParsing -TimeoutSec 3
    if ($a.StatusCode -lt 500) { $bereit = $true; break }
  } catch {}
  Start-Sleep -Seconds 2
}

$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
       Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
       Select-Object -First 1).IPAddress

Sag ""
if ($bereit) {
  Sag (L "  Fertig. KlangTresor laeuft." "  Done. KlangTresor is running." "  Готово. KlangTresor работает.")
} else {
  Sag (L "  Der Container laeuft, antwortet aber noch nicht." "  The container is running but is not answering yet." "  Контейнер работает, но пока не отвечает.")
  Sag (L "  Beim ersten Start holt er die KI-Modelle - das kann dauern." "  On the first start it fetches the AI models - that can take a while." "  При первом запуске он загружает модели ИИ - это может занять время.")
  Sag (L "  Nachsehen mit:  docker compose -f docker\docker-compose.yml logs -f" "  To check:  docker compose -f docker\docker-compose.yml logs -f" "  Посмотреть:  docker compose -f docker\docker-compose.yml logs -f")
}
Sag ""
Sag (L "  Adresse:  http://localhost:8788" "  Address:  http://localhost:8788" "  Адрес:    http://localhost:8788")
if ($ip) { Sag (L "  Im WLAN:  http://${ip}:8788" "  On Wi-Fi: http://${ip}:8788" "  По Wi-Fi: http://${ip}:8788") }
Sag ""
Sag (L "  IM BROWSER WEITERMACHEN - ein Terminal brauchst du ab jetzt nicht mehr:" "  CARRY ON IN THE BROWSER - you do not need a terminal from now on:" "  ПРОДОЛЖАЙТЕ В БРАУЗЕРЕ - терминал вам больше не понадобится:")
Sag (L "    1. Oben rechts deinen Suno-Alias eintragen (er wird geprueft)." "    1. Enter your Suno alias at the top right (it is checked)." "    1. Введите свой псевдоним Suno вверху справа (он проверяется).")
Sag (L "    2. Den roten Knopf druecken. Er holt die Songliste, laedt Medien" "    2. Press the red button. It fetches the song list, downloads media" "    2. Нажмите красную кнопку. Она загрузит список треков, медиафайлы")
Sag (L "       und rechnet die Analysen - alles im Hintergrund." "       and computes the analyses - all in the background." "       и выполнит анализ - всё в фоновом режиме.")
Sag ""
Sag (L "  Der Container startet ab jetzt mit dem Rechner von selbst wieder." "  From now on the container starts again by itself with the computer." "  Отныне контейнер сам запускается вместе с компьютером.")
Sag (L "  Anhalten:   docker compose -f docker\docker-compose.yml down" "  Stop:       docker compose -f docker\docker-compose.yml down" "  Остановка:  docker compose -f docker\docker-compose.yml down")
Sag (L "  Protokoll:  docker compose -f docker\docker-compose.yml logs -f" "  Log:        docker compose -f docker\docker-compose.yml logs -f" "  Журнал:     docker compose -f docker\docker-compose.yml logs -f")
Sag ""
Start-Process "http://localhost:8788"
Read-Host (L "  [Eingabetaste zum Schliessen dieses Fensters]" "  [Press Enter to close this window]" "  [Нажмите Enter, чтобы закрыть это окно]")
