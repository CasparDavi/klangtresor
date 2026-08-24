# KlangTresor - Copyright (c) 2026 Caspar_D - MIT, siehe LICENSE
# KlangTresor einrichten - Windows (PowerShell).
#
# Rechtsklick auf diese Datei -> "Mit PowerShell ausfuehren".
# Wehrt sich Windows gegen Skripte, hilft einmalig:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#
# Was hier passiert: pruefen, was fehlt - Pakete holen - Modelle holen -
# nach dem Suno-Alias fragen - Songs sammeln - Medien laden - starten.
# Jeder Schritt laesst sich einzeln wiederholen; nichts wird doppelt getan.

Set-Location -Path $PSScriptRoot
$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "  KlangTresor einrichten - Windows"
Write-Host "  ==============================="
Write-Host ""

# --- WO STEHEN WIR? ----------------------------------------------------
#
# Caspar_D, 24.08.2026: "Hier kann wirklich am meisten schief gehen. Zum
# Beispiel bis heute hiess das verzeichnis nicht Klangtresor."
#
# Der Weg beim Aktualisieren ist: ZIP auspacken, den INHALT in den
# bestehenden Ordner kopieren, dort dieses Skript starten. Dabei geht
# zweierlei schief, und beides still:
#
#   Man legt den ausgepackten Ordner NEBEN das Archiv und startet darin.
#   Dann laedt das Skript alles neu - und was dabei zurueckkommt, sind
#   2,7 von 44 GB: MP3, Cover, Artwork. Die WAV-Originale und die
#   Stemspuren holt kein Schritt, und am Ende steht trotzdem "Fertig".
#
#   Oder man loescht den alten Ordner, weil man ihn fuer die alte
#   Fassung haelt. Er IST das Archiv.
#
# Deshalb wird nicht gefragt, sondern nachgesehen - auch in den
# Nachbarordnern.

Write-Host "  Ordner: $(Get-Location)"
Write-Host ""

if (-not (Test-Path 'package.json') -or -not (Test-Path 'bin') -or
    -not (Test-Path 'server') -or -not (Test-Path 'web')) {
  Write-Host "  Das sieht nicht nach KlangTresor aus - hier fehlen bin\,"
  Write-Host "  server\, web\ oder package.json."
  Write-Host ""
  Write-Host "  Dieses Skript muss in dem Ordner liegen, in dem auch bin\ liegt."
  Write-Host "  Beim Aktualisieren gehoert der INHALT des ZIP in den bestehenden"
  Write-Host "  Ordner, nicht der ausgepackte Ordner daneben."
  Write-Host ""
  Read-Host "  [Eingabetaste zum Schliessen]"
  exit 1
}

# Woran man ein Archiv erkennt: am KATALOG. Nicht an library\roh\ -
# dieser Ordner ist im gesunden Betrieb LEER, weil aufbereiten.js die
# verarbeiteten Rohdaten wegraeumt.
$hierKatalog = (Test-Path 'library/katalog.json.gz') -or (Test-Path 'library/katalog.json')
$hierSongs = 0
if (Test-Path 'library/songs') {
  $hierSongs = @(Get-ChildItem 'library/songs' -Directory -ErrorAction SilentlyContinue).Count
}

if ($hierKatalog -or $hierSongs -gt 0) {
  $nWav = @(Get-ChildItem 'library/songs/*/audio.wav' -ErrorAction SilentlyContinue).Count
  $nStems = @(Get-ChildItem 'library/songs/*/stems' -Directory -ErrorAction SilentlyContinue).Count
  Write-Host "  Hier liegt ein Archiv: $hierSongs Songs, $nWav davon als WAV,"
  Write-Host "  $nStems mit Instrumentspuren."
  Write-Host "  Ich aktualisiere es - nichts wird ueberschrieben, nur ergaenzt."
  Write-Host ""
  $weiter = Read-Host "  Weiter? [J/n]"
  if ($weiter -match '^[nN]') { Write-Host "  Abgebrochen - nichts veraendert."; Read-Host "  [Eingabetaste]"; exit 0 }
  Write-Host ""
} else {
  # Liegt vielleicht nebenan eines?
  $nachbar = $null
  foreach ($d in Get-ChildItem '..' -Directory -ErrorAction SilentlyContinue) {
    if ($d.FullName -eq (Get-Location).Path) { continue }
    if ((Test-Path (Join-Path $d.FullName 'library/katalog.json.gz')) -or
        (Test-Path (Join-Path $d.FullName 'library/katalog.json'))) { $nachbar = $d; break }
  }

  if ($nachbar) {
    $nNachbar = @(Get-ChildItem (Join-Path $nachbar.FullName 'library/songs') -Directory -ErrorAction SilentlyContinue).Count
    Write-Host "  Hier ist kein Archiv - aber nebenan liegt eines:"
    Write-Host "      $($nachbar.FullName)"
    Write-Host "      $nNachbar Songs"
    Write-Host ""
    Write-Host "  Vermutlich ist das der Ordner, der gemeint war. Beim"
    Write-Host "  Aktualisieren gehoert der INHALT dieses ZIP dorthin - nicht"
    Write-Host "  der ausgepackte Ordner daneben."
    Write-Host ""
    Write-Host "  Fange ich hier trotzdem neu an, wird alles neu geladen. Und"
    Write-Host "  was dabei zurueckkommt, ist weniger als das, was drueben liegt:"
    Write-Host "  MP3, Cover und Artwork ja - die WAV-Originale und die"
    Write-Host "  Instrumentspuren nicht."
    Write-Host ""
    $trotzdem = Read-Host "  Trotzdem hier neu anfangen? [j/N]"
    if ($trotzdem -notmatch '^[jJyY]') { Write-Host "  Abgebrochen - nichts veraendert."; Read-Host "  [Eingabetaste]"; exit 0 }
    Write-Host ""
  } else {
    Write-Host "  Hier ist noch kein Archiv. Ich lege eines an."
    Write-Host ""
    $weiter = Read-Host "  Weiter? [J/n]"
    if ($weiter -match '^[nN]') { Write-Host "  Abgebrochen - nichts veraendert."; Read-Host "  [Eingabetaste]"; exit 0 }
    Write-Host ""
  }
}

# Laeuft schon ein Server auf 8788? Dann zeigt der Browser gleich das
# ANDERE Archiv, waehrend dieser hier mit "Adresse belegt" stirbt - und
# es sieht nach Erfolg aus.
try {
  $probe = Invoke-WebRequest -Uri 'http://localhost:8788/' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
  Write-Host "  Auf Port 8788 antwortet bereits ein KlangTresor."
  Write-Host "  Solange der laeuft, kann dieser hier nicht starten - und der"
  Write-Host "  Browser wuerde den anderen zeigen."
  Write-Host ""
  Write-Host "  Erst dort das Fenster mit Strg-C beenden, dann hier weiter."
  Write-Host ""
  $trotzdem = Read-Host "  Trotzdem weitermachen? [j/N]"
  if ($trotzdem -notmatch '^[jJyY]') { Write-Host "  Abgebrochen - nichts veraendert."; Read-Host "  [Eingabetaste]"; exit 0 }
  Write-Host ""
} catch { }

$fehlt = $false

$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
  $v = (& node -v) -replace 'v',''
  $gross = [int]($v -split '\.')[0]
  if ($gross -ge 20) {
    Write-Host "  [ok] Node.js v$v"
  } else {
    Write-Host "  [--] Node.js ist zu alt (v$v) - gebraucht wird 20 oder neuer."
    Write-Host "       Neu holen von https://nodejs.org - die LTS-Fassung, .msi"
    $fehlt = $true
  }
} else {
  Write-Host "  [--] Node.js fehlt."
  Write-Host "       Von https://nodejs.org die LTS-Fassung holen (.msi) und"
  Write-Host "       durchklicken. Das setzt den Pfad von selbst."
  Write-Host "       Wer winget hat, kann auch:  winget install OpenJS.NodeJS.LTS"
  $fehlt = $true
}

if (Get-Command ffmpeg -ErrorAction SilentlyContinue) {
  Write-Host "  [ok] ffmpeg"
} else {
  Write-Host "  [--] ffmpeg fehlt."
  Write-Host ""
  Write-Host "       Mit winget geht es am schnellsten:"
  Write-Host "         winget install Gyan.FFmpeg"
  Write-Host ""
  Write-Host "       Kennt dein Windows kein winget - das ist haeufig, der"
  Write-Host "       App Installer fehlt dann -, dann von Hand:"
  Write-Host "         1. https://www.gyan.dev/ffmpeg/builds/ oeffnen"
  Write-Host "         2. 'ffmpeg-release-essentials.zip' laden"
  Write-Host "         3. entpacken, z.B. nach C:\ffmpeg"
  Write-Host "         4. den Ordner C:\ffmpeg\bin in den PATH eintragen:"
  Write-Host "            Windows-Taste, 'Umgebungsvariablen' tippen,"
  Write-Host "            'Umgebungsvariablen fuer dieses Konto bearbeiten',"
  Write-Host "            bei 'Path' auf Bearbeiten, Neu, Ordner eintragen."
  Write-Host ""
  Write-Host "       Danach dieses Fenster SCHLIESSEN und neu oeffnen - sonst"
  Write-Host "       kennt Windows den neuen Pfad noch nicht."
  $fehlt = $true
}

if ($fehlt) {
  Write-Host ""
  Write-Host "  Bitte das Fehlende nachholen und dieses Skript erneut starten."
  Write-Host ""
  Read-Host "  [Eingabetaste zum Schliessen]"
  exit 1
}

Write-Host ""
Write-Host "  -> Pakete holen (npm install) ..."
& npm install --no-fund --no-audit
if ($LASTEXITCODE -ne 0) { Read-Host "  npm install ist gescheitert. [Eingabetaste]"; exit 1 }

Write-Host ""
Write-Host "  -> KI-Modelle holen (rund 284 MB: Stemtrennung und Musikstil) ..."
Write-Host "     Klappt das nicht, laeuft alles andere trotzdem."
& node bin/modelle-holen.js

# --- Alias -------------------------------------------------------------
$handle = ''
if (Test-Path 'library/konfig.json') {
  try { $handle = (Get-Content 'library/konfig.json' -Raw | ConvertFrom-Json).handle } catch {}
}

if ($handle) {
  Write-Host ""
  Write-Host "  Gemerkter Suno-Alias: @$handle"
} else {
  Write-Host ""
  Write-Host "  Dein Suno-Alias - der Name hinter dem @ auf deiner Profilseite."
  $handle = (Read-Host "  Alias").TrimStart('@')
}

if (-not $handle) { Read-Host "  Ohne Alias geht es nicht weiter. [Eingabetaste]"; exit 1 }

Write-Host ""
Write-Host "  -> Songliste von @$handle holen ..."
& node bin/sammeln.js $handle
if ($LASTEXITCODE -ne 0) { Read-Host "  Sammeln gescheitert. [Eingabetaste]"; exit 1 }

Write-Host ""
Write-Host "  -> Medien laden (MP3, Cover, Videos). Das dauert ein paar Minuten;"
Write-Host "     abbrechen und spaeter erneut starten ist jederzeit erlaubt."
& node bin/wiederherstellen.js

$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
       Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
       Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "  Fertig. KlangTresor startet jetzt."
Write-Host "  Adresse:  http://localhost:8788"
if ($ip) { Write-Host "  Im WLAN:  http://${ip}:8788" }
Write-Host "  Zum Beenden Strg-C druecken."
Write-Host ""
Start-Sleep -Seconds 2
Start-Process "http://localhost:8788"
& node server/server.js
