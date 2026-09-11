# KlangTresor - Copyright (c) 2026 Caspar_D - MIT, siehe LICENSE
# KlangTresor einrichten - Windows (PowerShell).
#
# Doppelklick auf KlangTresor-einrichten.cmd - das ist der Weg. Wer diese
# Datei direkt aufruft, braucht einmalig:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#
# WAS HIER PASSIERT: nachsehen, wo wir stehen - Werkzeuge holen (Node,
# ffmpeg) - Pakete holen - Modelle holen - nach dem Suno-Alias fragen -
# Songs sammeln - Medien laden - starten.
#
# ABBRECHEN IST ERLAUBT, an jeder Stelle. Nichts wird doppelt getan: was
# schon da ist, wird erkannt und uebersprungen. Beim naechsten Start geht
# es dort weiter, wo es aufgehoert hat.
#
# WERKZEUGE WERDEN NICHT INSTALLIERT, sondern in .\werkzeug gelegt. Kein
# Eintrag im PATH, keine Administratorrechte, nichts am System veraendert.
# Wer KlangTresor loescht, ist sie mit los.
#
# REINES ASCII, mit Byte Order Mark. PowerShell 5.1 liest eine Datei ohne
# BOM als CP1252, und dann zerfaellt jedes Sonderzeichen (Casto, 23.08.2026:
# "1000 Fehlermeldungen"). Darum hier keine Umlaute, keine Symbole - die
# Farbe traegt die Form. Geprueft mit bin/pruefe-skripte.js.

Set-Location -Path $PSScriptRoot
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'   # der eigene Balken, nicht der von PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# =====================================================================
# AUSSEHEN
# ---------------------------------------------------------------------
# Write-Host -ForegroundColor, NICHT ANSI-Sequenzen. Eine Konsole ohne
# VT-Unterstuetzung druckt Sequenzen als Buchstabensalat, und genau das
# soll hier weg. Die sechzehn Konsolenfarben gibt es ueberall.
# Haus: Orange fuehrt, Magenta akzentuiert, Grau ist Beiwerk.
# =====================================================================
$FARBE_MARKE = 'Yellow'      # das KlangTresor-Orange, soweit die Konsole es kann
$FARBE_AKZENT = 'Magenta'
$FARBE_MATT  = 'DarkGray'
$FARBE_GUT   = 'Green'
$FARBE_WARN  = 'Yellow'
$FARBE_BOESE = 'Red'

$Global:SCHRITT_JETZT = 0
$Global:SCHRITTE_GESAMT = 7

function Leer { Write-Host "" }
function Matt([string]$t) { Write-Host "     $t" -ForegroundColor $FARBE_MATT }
function Satz([string]$t) { Write-Host "     $t" }

function Marke {
  Leer
  Write-Host "  ###  " -ForegroundColor $FARBE_MARKE -NoNewline
  Write-Host "KlangTresor" -ForegroundColor $FARBE_MARKE -NoNewline
  Write-Host " einrichten" -ForegroundColor White
  Write-Host "  ###  " -ForegroundColor $FARBE_AKZENT -NoNewline
  Write-Host "dein eigenes Archiv, auf deinem Rechner" -ForegroundColor $FARBE_MATT
  Leer
}

function Schritt([string]$t) {
  $Global:SCHRITT_JETZT++
  Leer
  Write-Host "  [$($Global:SCHRITT_JETZT)/$($Global:SCHRITTE_GESAMT)] " -ForegroundColor $FARBE_AKZENT -NoNewline
  Write-Host $t -ForegroundColor White
}

function Gut([string]$t)   { Write-Host "     [ok] " -ForegroundColor $FARBE_GUT -NoNewline;  Write-Host $t }
function Wink([string]$t)  { Write-Host "     [!]  " -ForegroundColor $FARBE_WARN -NoNewline; Write-Host $t }
function Boese([string]$t) { Write-Host "     [x]  " -ForegroundColor $FARBE_BOESE -NoNewline; Write-Host $t }
function Tut([string]$t)   { Write-Host "     ->   " -ForegroundColor $FARBE_MARKE -NoNewline; Write-Host $t }

# Jede Frage sagt, was die Vorgabe ist - Eingabetaste genuegt.
function Frage([string]$t, [string]$vorgabe = 'j') {
  $anzeige = if ($vorgabe -eq 'j') { '[J/n]' } else { '[j/N]' }
  Write-Host "     $t $anzeige " -ForegroundColor $FARBE_AKZENT -NoNewline
  $a = (Read-Host)
  if ($a) { $a = $a.Trim() }
  if (-not $a) { return ($vorgabe -eq 'j') }
  return ($a -match '^[jJyY]')
}

function Halt([string]$t) { Leer; Write-Host "     $t" -ForegroundColor $FARBE_MATT; Read-Host "     [Eingabetaste]" | Out-Null }

# Beim Abbruch immer denselben Satz - er nimmt die Angst, etwas kaputt
# gemacht zu haben.
function Wiederkommen {
  Leer
  Write-Host "     Nichts ist verloren. " -ForegroundColor $FARBE_MATT -NoNewline
  Write-Host "Starte dieses Skript einfach noch einmal -" -ForegroundColor $FARBE_MATT
  Matt "es erkennt, was schon da ist, und macht dort weiter."
}

# =====================================================================
# QUELLEN
# ---------------------------------------------------------------------
# Alle Adressen stehen in quellen.txt, damit sie jemand aendern kann,
# wenn ein Anbieter umzieht - ohne im Skript zu suchen.
# =====================================================================
$Global:QUELLEN = @{}
function QuellenLesen {
  $d = Join-Path $PSScriptRoot 'quellen.txt'
  if (-not (Test-Path $d)) { return $false }
  foreach ($z in (Get-Content $d)) {
    $z = $z.Trim()
    if (-not $z -or $z.StartsWith('#')) { continue }
    $i = $z.IndexOf('=')
    if ($i -lt 1) { continue }
    $Global:QUELLEN[$z.Substring(0, $i).Trim()] = $z.Substring($i + 1).Trim()
  }
  return $true
}
function Quelle([string]$name) {
  if ($Global:QUELLEN.ContainsKey($name)) { return $Global:QUELLEN[$name] }
  return $null
}

# =====================================================================
# HOLEN - mit Fortschritt und Stillstandswache
# ---------------------------------------------------------------------
# Begrenzt wird der STILLSTAND, nicht die Gesamtdauer: 250 MB duerfen
# lange dauern, aber zwei Minuten ohne ein einziges Byte heissen, dass
# nichts mehr kommt. Dieselbe Regel wie in bin/modelle-holen.js.
# =====================================================================
function MB([double]$n) { return ('{0:N1} MB' -f ($n / 1MB)) }

function Hole([string]$url, [string]$ziel, [string]$was) {
  $stillstandMs = 120000
  $umgeleitet = $true
  try { $umgeleitet = [Console]::IsOutputRedirected } catch { }
  try {
    $anfrage = [System.Net.HttpWebRequest]::Create($url)
    $anfrage.UserAgent = 'KlangTresor-Einrichtung'
    $anfrage.Timeout = 30000
    $anfrage.ReadWriteTimeout = $stillstandMs
    $antwort = $anfrage.GetResponse()
    $ganz = $antwort.ContentLength
    $quelle = $antwort.GetResponseStream()
    $datei = [System.IO.File]::Create($ziel)
    $puffer = New-Object byte[] 131072
    $summe = 0L
    $zuletzt = Get-Date
    $begonnen = Get-Date
    while ($true) {
      $n = $quelle.Read($puffer, 0, $puffer.Length)
      if ($n -le 0) { break }
      $datei.Write($puffer, 0, $n)
      $summe += $n
      # Auf einer echten Konsole ueberschreibt sich die Zeile viermal je Sekunde.
      # Laeuft die Ausgabe in eine DATEI, taete sie das nicht - dort haengt jede
      # Zwischenmeldung an die vorige an, und das Protokoll wird unlesbar
      # (gesehen am 11.09.2026: ein Bildschirm voll ffmpeg-Zwischenstaende).
      # Also dort nur alle fuenf Sekunden eine eigene Zeile.
      $takt = if ($umgeleitet) { 5000 } else { 400 }
      if (((Get-Date) - $zuletzt).TotalMilliseconds -ge $takt) {
        $zuletzt = Get-Date
        $sek = [math]::Max(1, ((Get-Date) - $begonnen).TotalSeconds)
        $tempo = $summe / $sek
        $rest = ''
        if ($ganz -gt 0 -and $tempo -gt 0) {
          $s = [int](($ganz - $summe) / $tempo)
          $rest = if ($s -ge 60) { ', noch etwa {0} min' -f [math]::Ceiling($s / 60) } else { ', noch etwa {0} s' -f $s }
        }
        $teil = if ($ganz -gt 0) { ' von {0} ({1} %)' -f (MB $ganz), [int]($summe / $ganz * 100) } else { '' }
        if ($umgeleitet) {
          Write-Host ("     ->   {0} ... {1}{2}{3}" -f $was, (MB $summe), $teil, $rest) -ForegroundColor $FARBE_MARKE
        } else {
          Write-Host ("`r     ->   {0} ... {1}{2}{3}          " -f $was, (MB $summe), $teil, $rest) -NoNewline -ForegroundColor $FARBE_MARKE
        }
      }
    }
    $datei.Close(); $quelle.Close(); $antwort.Close()
    if (-not $umgeleitet) { Write-Host ("`r" + (' ' * 78)) -NoNewline; Write-Host ("`r") -NoNewline }
    Gut "$was geholt ($(MB $summe))"
    return $true
  } catch {
    if ($datei) { try { $datei.Close() } catch {} }
    if (-not $umgeleitet) { Write-Host ("`r" + (' ' * 78)) -NoNewline; Write-Host ("`r") -NoNewline }
    Boese "$was ging nicht: $($_.Exception.Message.Split([char]10)[0])"
    return $false
  }
}

# Ein Fehlschlag ist kein Weltuntergang, solange die Sache verzichtbar
# ist. Dann wird gefragt, statt abzubrechen.
function WieWeiter([string]$was, [string]$folge) {
  Leer
  Wink "$was hat nicht geklappt."
  Matt $folge
  Leer
  Matt "  [w] noch einmal versuchen"
  Matt "  [u] jetzt ueberspringen und ohne weitermachen"
  Matt "  [s] hier Schluss machen - spaeter neu starten"
  Write-Host "     Was tun? [w/u/s] " -ForegroundColor $FARBE_AKZENT -NoNewline
  $a = (Read-Host)
  if ($a) { $a = $a.Trim() }
  if ($a -match '^[wW]') { return 'wieder' }
  if ($a -match '^[sS]') { return 'schluss' }
  return 'ueber'
}

function Entpacke([string]$zip, [string]$ziel) {
  try {
    if (Test-Path $ziel) { Remove-Item $ziel -Recurse -Force -ErrorAction SilentlyContinue }
    Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue
    [System.IO.Compression.ZipFile]::ExtractToDirectory($zip, $ziel)
    return $true
  } catch {
    Boese "Entpacken ging nicht: $($_.Exception.Message.Split([char]10)[0])"
    return $false
  }
}

# =====================================================================
Marke

if (-not (QuellenLesen)) {
  Boese "quellen.txt fehlt - dort stehen die Adressen der Werkzeuge."
  Matt "Die Datei gehoert neben dieses Skript. Aus dem ZIP von GitHub ist sie dabei."
  Halt "Ohne sie geht es nicht weiter."
  exit 1
}

Write-Host "  Ordner: " -ForegroundColor $FARBE_MATT -NoNewline
Write-Host (Get-Location)
# ---------------------------------------------------------------------
# DAS MUSS VOR ALLEM ANDEREN STEHEN.
# Caspar_D, 11.09.2026: "der Nutzer wird keinen Datenbestand mehr
# runterladen koennen ... dann weiss er ganz klar, ohne Downloadkontingent
# verbrauchen geht es nicht, wenn er nur einen Nopay-Account hat, kommt
# alles nicht infrage."
# Seit dem 03.09.2026 gibt Suno Audio nicht mehr ueber Links heraus, auch
# dem Besitzer nicht. Jeder Titel muss bei Suno von Hand freigeschaltet
# werden, und das kostet ein Guthaben. Wer das erst nach dreissig Minuten
# Einrichten erfaehrt, ist zu Recht veraergert.
# ---------------------------------------------------------------------
Leer
Wink "Bevor du anfaengst - eine Sache, die Zeit spart:"
Matt "Suno gibt seine Audiodateien seit dem 03.09.2026 nicht mehr ueber Links"
Matt "heraus. Jeder Song muss bei Suno einmal von Hand freigeschaltet werden:"
Matt "Drei Punkte, Download, 'Unlock and Download'. Das kostet ein Guthaben"
Matt "aus deinem Download-Kontingent."
Leer
Matt "Ohne bezahlten Plan hast du kein Kontingent. Dann archiviert KlangTresor"
Matt "Titelbilder, Texte, Zahlen und deine ganze Suno-Geschichte - aber keinen"
Matt "Ton. Alles andere funktioniert."
Leer
Matt "Am besten schaltest du jetzt schon ein paar Titel bei Suno frei, dann"
Matt "liegen sie bereit, wenn KlangTresor danach fragt."
Leer
if (-not (Frage "Verstanden, weiter?" 'j')) {
  Matt "Dann bis spaeter. Die Einrichtung laeuft nicht weg."
  Wiederkommen; Halt "Abgebrochen."; exit 0
}

Leer
Matt "Beim ersten Mal dauert das Einrichten zehn bis dreissig Minuten -"
Matt "je nach Leitung werden rund 480 MB geholt. Das Fenster darf die"
Matt "ganze Zeit offen bleiben. Abbrechen ist jederzeit erlaubt."

# =====================================================================
Schritt "Nachsehen, wo wir stehen"

if (-not (Test-Path 'package.json') -or -not (Test-Path 'bin') -or
    -not (Test-Path 'server') -or -not (Test-Path 'web')) {
  Boese "Das sieht nicht nach KlangTresor aus."
  Matt "Hier fehlen bin\, server\, web\ oder package.json."
  Leer
  Matt "Dieses Skript muss in dem Ordner liegen, in dem auch bin\ liegt."
  Matt "Beim Aktualisieren gehoert der INHALT des ZIP in den bestehenden"
  Matt "Ordner, nicht der ausgepackte Ordner daneben."
  Halt "Nichts veraendert."
  exit 1
}

# Woran man ein Archiv erkennt: am KATALOG. Nicht an library\roh\ - der
# ist im gesunden Betrieb leer, weil aufbereiten.js ihn abraeumt.
$hierKatalog = (Test-Path 'library/katalog.json.gz') -or (Test-Path 'library/katalog.json')
$hierSongs = 0
if (Test-Path 'library/songs') {
  $hierSongs = @(Get-ChildItem 'library/songs' -Directory -ErrorAction SilentlyContinue).Count
}

if ($hierKatalog -or $hierSongs -gt 0) {
  $nWav = @(Get-ChildItem 'library/songs/*/audio.wav' -ErrorAction SilentlyContinue).Count
  $nStems = @(Get-ChildItem 'library/songs/*/stems' -Directory -ErrorAction SilentlyContinue).Count
  Gut "Hier liegt ein Archiv: $hierSongs Songs, $nWav davon als WAV, $nStems mit Instrumentspuren."
  Matt "Es wird ergaenzt, nichts ueberschrieben."
  Leer
  if (-not (Frage "Weiter?" 'j')) { Wiederkommen; Halt "Abgebrochen."; exit 0 }
} else {
  # Caspar_D, 24.08.2026: "Hier kann wirklich am meisten schief gehen."
  # Wer den ausgepackten Ordner NEBEN das Archiv legt und dort startet,
  # laedt alles neu - und zurueck kommen 2,7 von 44 GB. Darum wird nicht
  # gefragt, sondern nachgesehen, auch nebenan.
  $nachbar = $null
  foreach ($d in Get-ChildItem '..' -Directory -ErrorAction SilentlyContinue) {
    if ($d.FullName -eq (Get-Location).Path) { continue }
    if ((Test-Path (Join-Path $d.FullName 'library/katalog.json.gz')) -or
        (Test-Path (Join-Path $d.FullName 'library/katalog.json'))) { $nachbar = $d; break }
  }
  if ($nachbar) {
    $nNachbar = @(Get-ChildItem (Join-Path $nachbar.FullName 'library/songs') -Directory -ErrorAction SilentlyContinue).Count
    Wink "Hier ist kein Archiv - aber nebenan liegt eines:"
    Satz "    $($nachbar.FullName)   ($nNachbar Songs)"
    Leer
    Matt "Vermutlich ist das der Ordner, der gemeint war. Beim Aktualisieren"
    Matt "gehoert der INHALT dieses ZIP dorthin, nicht der Ordner daneben."
    Matt "Faengst du hier neu an, wird alles neu geladen - und zurueck kommen"
    Matt "MP3, Cover und Artwork, aber keine WAV und keine Instrumentspuren."
    Leer
    if (-not (Frage "Trotzdem hier neu anfangen?" 'n')) { Wiederkommen; Halt "Abgebrochen."; exit 0 }
  } else {
    Gut "Hier ist noch kein Archiv. Ich lege eines an."
    Leer
    if (-not (Frage "Weiter?" 'j')) { Wiederkommen; Halt "Abgebrochen."; exit 0 }
  }
}

# Laeuft schon ein Server auf 8788? Dann zeigt der Browser gleich das
# ANDERE Archiv, waehrend dieser mit "Adresse belegt" stirbt - und es
# sieht nach Erfolg aus.
try {
  $null = Invoke-WebRequest -Uri 'http://localhost:8788/' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
  Leer
  Wink "Auf Port 8788 antwortet bereits ein KlangTresor."
  Matt "Solange der laeuft, kann dieser hier nicht starten - und der Browser"
  Matt "wuerde den anderen zeigen. Erst dort mit Strg-C beenden."
  Leer
  if (-not (Frage "Trotzdem weitermachen?" 'n')) { Wiederkommen; Halt "Abgebrochen."; exit 0 }
} catch { }

# =====================================================================
Schritt "Werkzeuge bereitstellen (Node.js, ffmpeg)"

$WERKZEUG = Join-Path (Get-Location) 'werkzeug'
$NODE_ORT = Join-Path $WERKZEUG 'node'
$FF_ORT   = Join-Path $WERKZEUG 'ffmpeg'
New-Item -ItemType Directory -Path $WERKZEUG -Force | Out-Null

# --- Node.js ---------------------------------------------------------
# Reihenfolge: was schon im Projektordner liegt, dann was auf dem System
# installiert ist, sonst holen. So gewinnt nie eine zu alte Systemfassung
# ueber eine frisch geholte.
function NodeTauglich([string]$exe) {
  try {
    $v = (& $exe -v 2>$null) -replace 'v', ''
    if (-not $v) { return $null }
    if ([int]($v -split '\.')[0] -ge 20) { return $v }
    return $null
  } catch { return $null }
}

$NODE_EXE = $null
$eigen = Join-Path $NODE_ORT 'node.exe'
if (Test-Path $eigen) {
  $v = NodeTauglich $eigen
  if ($v) { $NODE_EXE = $eigen; Gut "Node.js v$v liegt schon im Projektordner." }
}
if (-not $NODE_EXE) {
  $sys = Get-Command node -ErrorAction SilentlyContinue
  if ($sys) {
    $v = NodeTauglich $sys.Source
    if ($v) { $NODE_EXE = $sys.Source; Gut "Node.js v$v ist auf diesem Rechner installiert." }
    else { Wink "Das installierte Node.js ist zu alt - ich hole eine eigene Fassung daneben." }
  }
}
while (-not $NODE_EXE) {
  $arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'node-windows-arm64' } else { 'node-windows-x64' }
  $url = Quelle $arch
  if (-not $url) { Boese "In quellen.txt fehlt die Zeile '$arch'."; Halt "Ohne Node.js geht es nicht."; exit 1 }
  Tut "Node.js holen - rund 30 MB. Es wird NICHT installiert, nur hierher gelegt."
  $zip = Join-Path $WERKZEUG 'node.zip'
  if (Hole $url $zip 'Node.js') {
    $roh = Join-Path $WERKZEUG '_node_roh'
    if (Entpacke $zip $roh) {
      $drin = Get-ChildItem $roh -Directory | Select-Object -First 1
      if (Test-Path $NODE_ORT) { Remove-Item $NODE_ORT -Recurse -Force -ErrorAction SilentlyContinue }
      Move-Item $drin.FullName $NODE_ORT
      Remove-Item $roh -Recurse -Force -ErrorAction SilentlyContinue
      Remove-Item $zip -Force -ErrorAction SilentlyContinue
      $v = NodeTauglich $eigen
      if ($v) { $NODE_EXE = $eigen; Gut "Node.js v$v liegt jetzt in werkzeug\node." }
    }
  }
  if (-not $NODE_EXE) {
    # Node ist NICHT verzichtbar - darum nur wiederholen oder aufhoeren.
    Leer
    Wink "Ohne Node.js laeuft KlangTresor nicht - ueberspringen geht hier nicht."
    Matt "Von Hand geht es auch: $(Quelle 'nodejs-startseite') - die LTS-Fassung."
    Leer
    if (-not (Frage "Noch einmal versuchen?" 'j')) { Wiederkommen; Halt "Abgebrochen."; exit 1 }
  }
}
$env:PATH = (Split-Path $NODE_EXE) + ';' + $env:PATH

# --- ffmpeg ----------------------------------------------------------
# Verzichtbar: ohne ffmpeg laeuft alles ausser Klangmessung und Video.
$FF_EXE = $null
$eigenFf = Join-Path $FF_ORT 'bin\ffmpeg.exe'
if (Test-Path $eigenFf) { $FF_EXE = $eigenFf; Gut "ffmpeg liegt schon im Projektordner." }
if (-not $FF_EXE) {
  $sysFf = Get-Command ffmpeg -ErrorAction SilentlyContinue
  if ($sysFf) { $FF_EXE = $sysFf.Source; Gut "ffmpeg ist auf diesem Rechner installiert." }
}
while (-not $FF_EXE) {
  $url = Quelle 'ffmpeg-windows'
  if (-not $url) { Wink "In quellen.txt fehlt die Zeile 'ffmpeg-windows' - ich mache ohne weiter."; break }
  Tut "ffmpeg holen - rund 100 MB, das dauert je nach Leitung ein paar Minuten."
  $zip = Join-Path $WERKZEUG 'ffmpeg.zip'
  $gut = Hole $url $zip 'ffmpeg'
  if ($gut) {
    $roh = Join-Path $WERKZEUG '_ff_roh'
    if (Entpacke $zip $roh) {
      $drin = Get-ChildItem $roh -Directory | Select-Object -First 1
      if (Test-Path $FF_ORT) { Remove-Item $FF_ORT -Recurse -Force -ErrorAction SilentlyContinue }
      Move-Item $drin.FullName $FF_ORT
      Remove-Item $roh -Recurse -Force -ErrorAction SilentlyContinue
      Remove-Item $zip -Force -ErrorAction SilentlyContinue
      if (Test-Path $eigenFf) { $FF_EXE = $eigenFf; Gut "ffmpeg liegt jetzt in werkzeug\ffmpeg." }
    }
  }
  if (-not $FF_EXE) {
    $w = WieWeiter 'ffmpeg holen' 'Ohne ffmpeg laeuft alles - nur Klangmessung und Videoschnitt fehlen.'
    if ($w -eq 'ueber') { Wink "Weiter ohne ffmpeg. Spaeter noch einmal starten holt es nach."; break }
    if ($w -eq 'schluss') { Wiederkommen; Halt "Abgebrochen."; exit 0 }
  }
}
if ($FF_EXE) { $env:PATH = (Split-Path $FF_EXE) + ';' + $env:PATH }

# Damit KlangTresor-starten.cmd und der Morgenlauf dieselben Werkzeuge
# finden, ohne dass jemand am PATH dreht.
$merk = @()
$merk += '# Von einrichten-windows.ps1 geschrieben. Hier stehen die Werkzeuge,'
$merk += '# die KlangTresor benutzt. Loeschen ist harmlos - dann wird neu gesucht.'
$merk += "node=$NODE_EXE"
if ($FF_EXE) { $merk += "ffmpeg=$FF_EXE" }
Set-Content -Path (Join-Path $WERKZEUG 'werkzeug.txt') -Value $merk -Encoding ASCII

# =====================================================================
Schritt "Pakete holen (npm install)"
Matt "Das dauert ein bis fuenf Minuten und ist zwischendurch still."
$npm = Join-Path (Split-Path $NODE_EXE) 'npm.cmd'
if (-not (Test-Path $npm)) { $npm = 'npm' }
& $npm install --no-fund --no-audit
if ($LASTEXITCODE -ne 0) {
  $w = WieWeiter 'npm install' 'Ohne die Pakete startet der Server nicht.'
  if ($w -ne 'ueber') { Wiederkommen; Halt "Abgebrochen."; exit 1 }
} else { Gut "Pakete sind da." }

# =====================================================================
Schritt "KI-Modelle holen (rund 284 MB)"
Matt "Stemtrennung und Musikstil. Klappt das nicht, laeuft alles andere trotzdem."
& $NODE_EXE bin/modelle-holen.js
if ($LASTEXITCODE -ne 0) {
  $w = WieWeiter 'Modelle holen' 'Ohne sie fehlen Stemtrennung und Musikstil - sonst nichts.'
  if ($w -eq 'schluss') { Wiederkommen; Halt "Abgebrochen."; exit 0 }
  if ($w -eq 'wieder') { & $NODE_EXE bin/modelle-holen.js }
} else { Gut "Modelle sind da." }

# =====================================================================
Schritt "Dein Suno-Alias"
$handle = ''
if (Test-Path 'library/konfig.json') {
  try { $handle = (Get-Content 'library/konfig.json' -Raw | ConvertFrom-Json).handle } catch {}
}
if ($handle) {
  Gut "Gemerkt: @$handle"
} else {
  Matt "Der Name hinter dem @ auf deiner Suno-Profilseite."
  Write-Host "     Alias: " -ForegroundColor $FARBE_AKZENT -NoNewline
  $handle = (Read-Host).TrimStart('@')
}
if (-not $handle) { Boese "Ohne Alias geht es nicht weiter."; Wiederkommen; Halt "Abgebrochen."; exit 1 }

# =====================================================================
Schritt "Songliste von @$handle holen"
& $NODE_EXE bin/sammeln.js $handle
if ($LASTEXITCODE -ne 0) {
  $w = WieWeiter 'Songliste holen' 'Ohne sie gibt es nichts zu archivieren.'
  if ($w -ne 'ueber') { Wiederkommen; Halt "Abgebrochen."; exit 1 }
} else { Gut "Songliste steht." }

# =====================================================================
Schritt "Medien laden (MP3, Cover, Bewegtbilder)"
Matt "Das dauert am laengsten. Abbrechen und spaeter erneut starten ist erlaubt -"
Matt "was schon da ist, wird nicht noch einmal geholt."
& $NODE_EXE bin/wiederherstellen.js

# =====================================================================
Leer
Write-Host "  ###  " -ForegroundColor $FARBE_MARKE -NoNewline
Write-Host "Fertig. KlangTresor startet." -ForegroundColor White
Leer
$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
       Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
       Select-Object -First 1).IPAddress
Write-Host "     Adresse:  " -ForegroundColor $FARBE_MATT -NoNewline
Write-Host "http://localhost:8788" -ForegroundColor $FARBE_MARKE
if ($ip) {
  Write-Host "     Im WLAN:  " -ForegroundColor $FARBE_MATT -NoNewline
  Write-Host "http://${ip}:8788" -ForegroundColor $FARBE_MARKE
}
Matt "Zum Beenden Strg-C druecken. Spaeter genuegt KlangTresor-starten.cmd."
Leer
Start-Sleep -Seconds 2
Start-Process "http://localhost:8788"
& $NODE_EXE server/server.js
