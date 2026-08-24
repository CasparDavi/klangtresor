# KlangTresor - Copyright (c) 2026 Caspar_D - MIT, siehe LICENSE
# KlangTresor einrichten - mit Docker (Windows).
#
# Rechtsklick auf diese Datei -> "Mit PowerShell ausfuehren".
# Wehrt sich Windows gegen Skripte, hilft einmalig:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#
# Der Unterschied zu einrichten-windows.ps1: Hier wird auf DIESEM Rechner
# nichts installiert - kein Node, kein ffmpeg. Alles liegt im Container.
# Gebraucht wird nur Docker Desktop.
#
# Das Archiv bleibt trotzdem draussen auf der Platte (.\library), ebenso
# ein etwaiges Cookie (.\geheim). Der Container laesst sich wegwerfen und
# neu bauen, ohne dass Musik verlorengeht.

Set-Location -Path $PSScriptRoot
$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "  KlangTresor einrichten - Docker (Windows)"
Write-Host "  ===================================="
Write-Host ""

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host "  [--] Docker fehlt."
  Write-Host ""
  # Docker Desktop braucht auf Windows den WSL-2-Unterbau. Fehlt der, bricht
  # die Installation spaeter mit einer Meldung ab, mit der niemand etwas
  # anfangen kann - deshalb hier vorher nachsehen und beides nennen.
  $wsl = Get-Command wsl -ErrorAction SilentlyContinue
  $wslOk = $false
  if ($wsl) { & wsl --status *> $null; $wslOk = ($LASTEXITCODE -eq 0) }

  if (-not $wslOk) {
    Write-Host "    ZUERST der Unterbau: Docker Desktop braucht WSL 2."
    Write-Host "    In einer PowerShell ALS ADMINISTRATOR (Rechtsklick auf das"
    Write-Host "    Startmenue -> Terminal (Administrator)):"
    Write-Host ""
    Write-Host "      wsl --install"
    Write-Host ""
    Write-Host "    Danach Windows neu starten."
    Write-Host ""
    Write-Host "    Geht das nicht, ist meist die Virtualisierung im BIOS/UEFI"
    Write-Host "    abgeschaltet (heisst dort 'Intel VT-x', 'AMD-V' oder 'SVM')."
    Write-Host ""
    Write-Host "    DANN erst:"
  }
  Write-Host "      winget install Docker.DockerDesktop"
  Write-Host ""
  Write-Host "    Oder von Hand:  https://www.docker.com/products/docker-desktop"
  Write-Host ""
  Write-Host "    Nach der Installation Windows neu starten, Docker Desktop"
  Write-Host "    einmal oeffnen, die Lizenz bestaetigen - und dann diese"
  Write-Host "    Datei erneut ausfuehren."
  Write-Host ""
  Read-Host "  [Eingabetaste zum Schliessen]"
  exit 1
}

& docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "  [--] Docker ist installiert, laeuft aber nicht."
  Write-Host ""
  Write-Host "    Ich kann versuchen, Docker Desktop zu starten - soll ich?"
  $a = Read-Host "    [j] starten und warten - sonst abbrechen"
  if ($a -eq 'j' -or $a -eq 'J') {
    $exe = @(
      "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
      "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($exe) { Start-Process $exe } else { Write-Host "    Docker Desktop nicht gefunden - bitte von Hand starten." }
    Write-Host "    Warte auf Docker ..."
    for ($i = 0; $i -lt 40; $i++) {
      & docker info *> $null
      if ($LASTEXITCODE -eq 0) { Write-Host "    [ok] Docker laeuft."; break }
      Start-Sleep -Seconds 5
    }
    & docker info *> $null
    if ($LASTEXITCODE -ne 0) {
      Write-Host "    Docker antwortet nicht. Docker Desktop von Hand oeffnen"
      Write-Host "    und warten, bis das Wal-Symbol unten rechts ruhig steht."
      Read-Host "  [Eingabetaste]"
      exit 1
    }
  } else { exit 1 }
}

& docker compose version *> $null
if ($LASTEXITCODE -eq 0) { $DC = @('docker','compose') }
elseif (Get-Command docker-compose -ErrorAction SilentlyContinue) { $DC = @('docker-compose') }
else {
  Write-Host "  [--] Docker Compose fehlt (gehoert bei Docker Desktop dazu)."
  Read-Host "  [Eingabetaste]"
  exit 1
}

Write-Host "  [ok] Docker laeuft"

New-Item -ItemType Directory -Force -Path 'library','geheim' | Out-Null
Write-Host "  [ok] Ordner library\ und geheim\ liegen bereit"

Write-Host ""
Write-Host "  -> Kiste bauen und starten. Beim ersten Mal dauert das einige"
Write-Host "     Minuten: Node, ffmpeg und die Pakete kommen hinein."
Write-Host ""
& $DC[0] $DC[1..($DC.Length-1)] up -d --build
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "  Der Start ist gescheitert. Die Meldungen oben sagen warum."
  Read-Host "  [Eingabetaste]"
  exit 1
}

Write-Host ""
Write-Host "  -> Warten, bis der Server antwortet ..."
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

Write-Host ""
if ($bereit) {
  Write-Host "  Fertig. KlangTresor laeuft."
} else {
  Write-Host "  Der Container laeuft, antwortet aber noch nicht."
  Write-Host "  Beim ersten Start holt er die KI-Modelle - das kann dauern."
  Write-Host "  Nachsehen mit:  docker compose logs -f"
}
Write-Host ""
Write-Host "  Adresse:  http://localhost:8788"
if ($ip) { Write-Host "  Im WLAN:  http://${ip}:8788" }
Write-Host ""
Write-Host "  IM BROWSER WEITERMACHEN - ein Terminal brauchst du ab jetzt nicht mehr:"
Write-Host "    1. Oben rechts deinen Suno-Alias eintragen (er wird geprueft)."
Write-Host "    2. Den roten Knopf druecken. Er holt die Songliste, laedt Medien"
Write-Host "       und rechnet die Analysen - alles im Hintergrund."
Write-Host ""
Write-Host "  Der Container startet ab jetzt mit dem Rechner von selbst wieder."
Write-Host "  Anhalten:  docker compose down     -     Protokoll:  docker compose logs -f"
Write-Host ""
Start-Process "http://localhost:8788"
Read-Host "  [Eingabetaste zum Schliessen dieses Fensters]"
