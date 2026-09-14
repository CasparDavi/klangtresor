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
    Sag "  DOCKER DESKTOP BRAUCHT WSL 2, UND DAS FEHLT HIER:"
    Sag ("    VirtualMachinePlatform  : {0}" -f $z.VirtualMachinePlatform)
    Sag ("    Windows-Subsystem Linux : {0}" -f $z.'Microsoft-Windows-Subsystem-Linux')
    Sag ""
    Sag "  In einer PowerShell ALS ADMINISTRATOR (Rechtsklick aufs Startmenue"
    Sag "  -> Terminal (Administrator)):"
    Sag ""
    Sag "      wsl --install"
    Sag ""
    Sag "  Danach Windows neu starten."
  }
}

Sag ""
Sag "  KlangTresor einrichten - Docker (Windows)"
Sag "  ===================================="
Sag ""
Sag ("  (Alles Weitere steht auch in {0})" -f $Protokoll)
Sag ""

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Sag "  [--] Docker fehlt."
  Warum-Kein-Docker
  Sag ""
  # Docker Desktop braucht auf Windows den WSL-2-Unterbau. Fehlt der, bricht
  # die Installation spaeter mit einer Meldung ab, mit der niemand etwas
  # anfangen kann - deshalb hier vorher nachsehen und beides nennen.
  $wsl = Get-Command wsl -ErrorAction SilentlyContinue
  $wslOk = $false
  if ($wsl) { & wsl --status *> $null; $wslOk = ($LASTEXITCODE -eq 0) }

  if (-not $wslOk) {
    Sag "    ZUERST der Unterbau: Docker Desktop braucht WSL 2."
    Sag "    In einer PowerShell ALS ADMINISTRATOR (Rechtsklick auf das"
    Sag "    Startmenue -> Terminal (Administrator)):"
    Sag ""
    Sag "      wsl --install"
    Sag ""
    Sag "    Danach Windows neu starten."
    Sag ""
    Sag "    Geht das nicht, ist meist die Virtualisierung im BIOS/UEFI"
    Sag "    abgeschaltet (heisst dort 'Intel VT-x', 'AMD-V' oder 'SVM')."
    Sag ""
    Sag "    DANN erst:"
  }
  Sag "      winget install Docker.DockerDesktop"
  Sag ""
  Sag "    Oder von Hand:  https://www.docker.com/products/docker-desktop"
  Sag ""
  Sag "    Nach der Installation Windows neu starten, Docker Desktop"
  Sag "    einmal oeffnen, die Lizenz bestaetigen - und dann diese"
  Sag "    Datei erneut ausfuehren."
  Sag ""
  Read-Host "  [Eingabetaste zum Schliessen]"
  exit 1
}

& docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Sag "  [--] Docker ist installiert, laeuft aber nicht."
  Sag ""
  Sag "    Ich kann versuchen, Docker Desktop zu starten - soll ich?"
  $a = Read-Host "    [j] starten und warten - sonst abbrechen"
  if ($a -eq 'j' -or $a -eq 'J') {
    # OHNE ADMINISTRATOR INSTALLIERT DOCKER DESKTOP IN DAS BENUTZERPROFIL
    # (gefunden 14.09.2026: Caspar_Ds Installation lag unter %LOCALAPPDATA%,
    # das Skript haette "nicht gefunden" gesagt, obwohl sie da war).
    $exe = @(
      "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
      "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
      "$env:LOCALAPPDATA\Programs\DockerDesktop\frontend\Docker Desktop.exe",
      "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($exe) { Start-Process $exe } else { Sag "    Docker Desktop nicht gefunden - bitte von Hand starten." }
    Sag "    Warte auf Docker ..."
    for ($i = 0; $i -lt 40; $i++) {
      & docker info *> $null
      if ($LASTEXITCODE -eq 0) { Sag "    [ok] Docker laeuft."; break }
      Start-Sleep -Seconds 5
    }
    & docker info *> $null
    if ($LASTEXITCODE -ne 0) {
      Sag "    Docker antwortet nicht. Docker Desktop von Hand oeffnen"
      Sag "    und warten, bis das Wal-Symbol unten rechts ruhig steht."
      Sag "    Steht dort ein Fehler oder bleibt es bei 'Starting', hilft das hier:"
      Warum-Kein-Docker
      Read-Host "  [Eingabetaste]"
      exit 1
    }
  } else { exit 1 }
}

& docker compose version *> $null
if ($LASTEXITCODE -eq 0) { $DCEXE = 'docker'; $DCARG = @('compose') }
elseif (Get-Command docker-compose -ErrorAction SilentlyContinue) { $DCEXE = 'docker-compose'; $DCARG = @() }
else {
  Sag "  [--] Docker Compose fehlt (gehoert bei Docker Desktop dazu)."
  Read-Host "  [Eingabetaste]"
  exit 1
}

Sag "  [ok] Docker laeuft"

New-Item -ItemType Directory -Force -Path 'library' | Out-Null
Sag "  [ok] Ordner library\ liegt bereit"

Sag ""
Sag "  -> Kiste bauen und starten. Beim ersten Mal dauert das einige"
Sag "     Minuten: Node, ffmpeg und die Pakete kommen hinein."
Sag ""
# Die Bauanleitung liegt in docker\, der Kontext ist der Projektordner.
& $DCEXE @DCARG -f docker\docker-compose.yml up -d --build
if ($LASTEXITCODE -ne 0) {
  Sag ""
  Sag "  Der Start ist gescheitert. Die Meldungen oben sagen warum."
  Read-Host "  [Eingabetaste]"
  exit 1
}

Sag ""
Sag "  -> Warten, bis der Server antwortet ..."
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
  Sag "  Fertig. KlangTresor laeuft."
} else {
  Sag "  Der Container laeuft, antwortet aber noch nicht."
  Sag "  Beim ersten Start holt er die KI-Modelle - das kann dauern."
  Sag "  Nachsehen mit:  docker compose -f docker\docker-compose.yml logs -f"
}
Sag ""
Sag "  Adresse:  http://localhost:8788"
if ($ip) { Sag "  Im WLAN:  http://${ip}:8788" }
Sag ""
Sag "  IM BROWSER WEITERMACHEN - ein Terminal brauchst du ab jetzt nicht mehr:"
Sag "    1. Oben rechts deinen Suno-Alias eintragen (er wird geprueft)."
Sag "    2. Den roten Knopf druecken. Er holt die Songliste, laedt Medien"
Sag "       und rechnet die Analysen - alles im Hintergrund."
Sag ""
Sag "  Der Container startet ab jetzt mit dem Rechner von selbst wieder."
Sag "  Anhalten:   docker compose -f docker\docker-compose.yml down"
Sag "  Protokoll:  docker compose -f docker\docker-compose.yml logs -f"
Sag ""
Start-Process "http://localhost:8788"
Read-Host "  [Eingabetaste zum Schliessen dieses Fensters]"
