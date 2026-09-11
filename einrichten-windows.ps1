# KlangTresor - Copyright (c) 2026 Caspar_D - MIT, siehe LICENSE
# KlangTresor einrichten - Windows. DER ANLASSER.
#
# Doppelklick auf KlangTresor-einrichten.cmd - das ist der Weg.
#
# DIESE DATEI TUT NUR EINES: sie beschafft Node.js. Danach uebernimmt
# bin/einrichten.js, und das ist ein richtiges Programm statt eines
# Skripts - mit Farben, Umlauten, Fortschritt und Rueckfragen.
#
# WARUM DIE TEILUNG (Caspar_D, 11.09.2026: "am schoensten waere
# natuerlich, du downloadest nur node.js zuerst und machst dann ein
# schickes installations-js"):
#
#   Vorher lag dieselbe Abfolge dreimal da - hier in PowerShell, einmal
#   in Bash fuer Linux, einmal fuer den Mac. Jede Aenderung musste
#   dreimal gemacht und dreimal geprueft werden.
#
#   Und PowerShell 5.1 liest eine Datei ohne Byte Order Mark als CP1252;
#   jedes Sonderzeichen zerfaellt dabei (Casto, 23.08.2026: "1000
#   Fehlermeldungen"). Deshalb steht hier REINES ASCII, ohne Umlaute.
#   Node liest UTF-8, immer - dort drueben darf es huebsch sein.
#
# Geprueft mit bin/pruefe-skripte.js.

Set-Location -Path $PSScriptRoot
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$O = 'Yellow'      # so nah am KlangTresor-Orange, wie die Konsole kann
$P = 'Magenta'
$M = 'DarkGray'

function Zeile([string]$t, [string]$farbe = 'Gray') { Write-Host "     $t" -ForegroundColor $farbe }

# Nur ein schmaler Kopf. Die Tresortuer zeichnet bin/einrichten.js -
# zweimal hintereinander waere sie albern.
Write-Host ""
Write-Host "     K L A N G T R E S O R" -ForegroundColor $O
Write-Host "     einrichten" -ForegroundColor $M
Write-Host ""

# --- Liegen wir richtig? ---------------------------------------------
if (-not (Test-Path 'bin\einrichten.js') -or -not (Test-Path 'package.json')) {
  Zeile "[x]  Das sieht nicht nach KlangTresor aus." 'Red'
  Zeile "Hier fehlt bin\einrichten.js oder package.json." $M
  Write-Host ""
  Zeile "Diese Datei muss in dem Ordner liegen, in dem auch bin\ liegt." $M
  Zeile "Beim Aktualisieren gehoert der INHALT des Pakets in den bestehenden" $M
  Zeile "Ordner, nicht der ausgepackte Ordner daneben." $M
  Write-Host ""
  Read-Host "     [Eingabetaste zum Schliessen]" | Out-Null
  exit 1
}

# --- Node.js ----------------------------------------------------------
# Reihenfolge: was schon im Projektordner liegt, dann was auf dem System
# installiert ist, sonst holen. So gewinnt nie eine zu alte Systemfassung
# ueber eine frisch geholte. Gebraucht wird Fassung 20 oder neuer.
function NodeTauglich([string]$exe) {
  try {
    $v = (& $exe -v 2>$null) -replace 'v', ''
    if (-not $v) { return $null }
    if ([int]($v -split '\.')[0] -ge 20) { return $v }
    return $null
  } catch { return $null }
}

$WERKZEUG = Join-Path (Get-Location) 'werkzeug'
$EIGEN = Join-Path $WERKZEUG 'node\node.exe'
$NODE = $null

if (Test-Path $EIGEN) {
  $v = NodeTauglich $EIGEN
  if ($v) { $NODE = $EIGEN; Zeile "[ok] Node.js v$v liegt im Projektordner." 'Green' }
}
if (-not $NODE) {
  $sys = Get-Command node -ErrorAction SilentlyContinue
  if ($sys) {
    $v = NodeTauglich $sys.Source
    if ($v) { $NODE = $sys.Source; Zeile "[ok] Node.js v$v ist auf diesem Rechner installiert." 'Green' }
    else { Zeile "[!]  Das installierte Node.js ist zu alt - ich hole eine eigene Fassung daneben." 'Yellow' }
  }
}

while (-not $NODE) {
  # Die Adresse steht in quellen.txt, damit sie jemand aendern kann, wenn
  # nodejs.org umzieht - ohne in diesem Skript zu suchen.
  $url = $null
  $schluessel = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'node-windows-arm64' } else { 'node-windows-x64' }
  if (Test-Path 'quellen.txt') {
    foreach ($z in (Get-Content 'quellen.txt')) {
      $z = $z.Trim()
      if (-not $z -or $z.StartsWith('#')) { continue }
      $i = $z.IndexOf('=')
      if ($i -lt 1) { continue }
      if ($z.Substring(0, $i).Trim() -eq $schluessel) { $url = $z.Substring($i + 1).Trim() }
    }
  }
  if (-not $url) {
    Zeile "[x]  In quellen.txt fehlt die Zeile '$schluessel'." 'Red'
    Zeile "Ohne Node.js geht es nicht. Von Hand: https://nodejs.org (LTS)." $M
    Write-Host ""
    Read-Host "     [Eingabetaste]" | Out-Null
    exit 1
  }

  Write-Host "     ->   " -ForegroundColor $O -NoNewline
  Write-Host "Node.js holen - rund 30 MB. Es wird NICHT installiert, nur hierher gelegt."
  Zeile "Kein Eintrag im System, keine Administratorrechte." $M
  Write-Host ""

  New-Item -ItemType Directory -Path $WERKZEUG -Force | Out-Null
  $zip = Join-Path $WERKZEUG 'node.zip'
  $gut = $false
  $datei = $null
  try {
    $a = [System.Net.HttpWebRequest]::Create($url)
    $a.UserAgent = 'KlangTresor-Anlasser'
    $a.Timeout = 30000
    $a.ReadWriteTimeout = 120000        # begrenzt wird der STILLSTAND, nicht die Dauer
    $antwort = $a.GetResponse()
    $ganz = $antwort.ContentLength
    $quelle = $antwort.GetResponseStream()
    $datei = [System.IO.File]::Create($zip)
    $puffer = New-Object byte[] 131072
    $summe = 0L
    $gemalt = Get-Date
    while ($true) {
      $n = $quelle.Read($puffer, 0, $puffer.Length)
      if ($n -le 0) { break }
      $datei.Write($puffer, 0, $n)
      $summe += $n
      if (((Get-Date) - $gemalt).TotalMilliseconds -ge 400) {
        $gemalt = Get-Date
        $teil = if ($ganz -gt 0) { ' von {0:N1} MB ({1} %)' -f ($ganz / 1MB), [int]($summe / $ganz * 100) } else { '' }
        Write-Host ("`r     ->   Node.js ... {0:N1} MB{1}          " -f ($summe / 1MB), $teil) -NoNewline -ForegroundColor $O
      }
    }
    $datei.Close(); $quelle.Close(); $antwort.Close()
    Write-Host ("`r" + (' ' * 78) + "`r") -NoNewline
    $gut = $true
  } catch {
    if ($datei) { try { $datei.Close() } catch {} }
    Write-Host ("`r" + (' ' * 78) + "`r") -NoNewline
    Zeile "[x]  Node.js holen ging nicht: $($_.Exception.Message.Split([char]10)[0])" 'Red'
  }

  if ($gut) {
    try {
      $roh = Join-Path $WERKZEUG '_node_roh'
      if (Test-Path $roh) { Remove-Item $roh -Recurse -Force }
      Expand-Archive -LiteralPath $zip -DestinationPath $roh -Force
      $drin = Get-ChildItem $roh -Directory | Select-Object -First 1
      $ziel = Join-Path $WERKZEUG 'node'
      if (Test-Path $ziel) { Remove-Item $ziel -Recurse -Force }
      Move-Item $drin.FullName $ziel
      Remove-Item $roh -Recurse -Force -ErrorAction SilentlyContinue
      Remove-Item $zip -Force -ErrorAction SilentlyContinue
      $v = NodeTauglich $EIGEN
      if ($v) { $NODE = $EIGEN; Zeile "[ok] Node.js v$v liegt jetzt in werkzeug\node." 'Green' }
    } catch {
      Zeile "[x]  Auspacken ging nicht: $($_.Exception.Message.Split([char]10)[0])" 'Red'
    }
  }

  if (-not $NODE) {
    Write-Host ""
    Zeile "Ohne Node.js geht es nicht weiter - ueberspringen kann man das nicht." $M
    Zeile "Von Hand geht es auch: https://nodejs.org, die LTS-Fassung." $M
    Write-Host ""
    Write-Host "     Noch einmal versuchen? [J/n] " -ForegroundColor $P -NoNewline
    $a = Read-Host
    if ($a) { $a = $a.Trim() }
    if ($a -and $a -notmatch '^[jJyY]') {
      Zeile "Nichts ist verloren. Starte diese Datei einfach noch einmal." $M
      Write-Host ""
      Read-Host "     [Eingabetaste]" | Out-Null
      exit 1
    }
  }
}

# --- Ab hier uebernimmt das Programm ----------------------------------
Write-Host ""
& $NODE 'bin\einrichten.js' @args
exit $LASTEXITCODE
