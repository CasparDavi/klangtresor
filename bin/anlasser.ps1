# KlangTresor - Copyright (c) 2026 Caspar_D - MIT, siehe LICENSE
# KlangTresor einrichten - Windows. DER ANLASSER.
#
# Doppelklick auf einrichten-windows.cmd - das ist der Weg. Diese Datei
# liegt in bin\, weil sie niemand selbst anklicken soll; die .cmd haelt
# das Fenster offen und umgeht die ExecutionPolicy fuer diesen Aufruf.
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
#   Und PowerShell 5.1 liest eine Datei OHNE Byte Order Mark als CP1252;
#   jedes Sonderzeichen zerfaellt dabei (Casto, 23.08.2026: "1000
#   Fehlermeldungen"). Reines ASCII war darum nur noetig, solange diese
#   Datei kein BOM hatte. Sie hat eines (UTF-8 mit BOM, das muss bleiben):
#   deshalb duerfen hier die russischen Texte stehen. Die anderen Windows-
#   Starter (*.cmd) bleiben reines ASCII - cmd.exe kennt kein BOM.
#   Node liest UTF-8, immer - dort drueben darf es huebsch sein.
#
# DIE SPRACHE (Deutsch, Englisch, Russisch): hier gibt es noch kein Node
# und also auch kein bin/sprache.js. $SPR kommt aus KT_SPRACHE, sonst aus
# der Anzeigesprache von Windows (Get-UICulture) - dieselbe Regel wie in
# bin/sprache.js: ru -> ru, de -> de, alles andere -> en. Die Wahl geht
# als KT_SPRACHE an bin/einrichten.js weiter.
#
# Geprueft mit bin/pruefe-skripte.js.

Set-Location -Path (Split-Path -Parent $PSScriptRoot)   # bin\ -> Projektordner
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$SPR = ("$env:KT_SPRACHE").Trim().ToLower()
if ($SPR -notin 'de', 'en', 'ru') {
  $kultur = ''
  try { $kultur = (Get-UICulture).Name.ToLower() } catch {}
  $SPR = if ($kultur.StartsWith('ru')) { 'ru' } elseif ($kultur.StartsWith('de')) { 'de' } else { 'en' }
}
$env:KT_SPRACHE = $SPR
function L($de, $en, $ru) { switch ($SPR) { 'ru' { $ru } 'en' { $en } default { $de } } }

$O = 'Yellow'      # so nah am KlangTresor-Orange, wie die Konsole kann
$P = 'Magenta'
$M = 'DarkGray'

function Zeile([string]$t, [string]$farbe = 'Gray') { Write-Host "     $t" -ForegroundColor $farbe }

# Nur ein schmaler Kopf. Die Tresortuer zeichnet bin/einrichten.js -
# zweimal hintereinander waere sie albern.
Write-Host ""
Write-Host "     K L A N G T R E S O R" -ForegroundColor $O
Write-Host ("     " + (L 'einrichten' 'set up' 'установка')) -ForegroundColor $M
Write-Host ""

# --- Liegen wir richtig? ---------------------------------------------
if (-not (Test-Path 'bin\einrichten.js') -or -not (Test-Path 'package.json')) {
  Zeile (L "[x]  Das sieht nicht nach KlangTresor aus." "[x]  This does not look like KlangTresor." "[x]  Это не похоже на KlangTresor.") 'Red'
  Zeile (L "Hier fehlt bin\einrichten.js oder package.json." "bin\einrichten.js or package.json is missing here." "Здесь нет bin\einrichten.js или package.json.") $M
  Write-Host ""
  Zeile (L "Diese Datei muss in dem Ordner liegen, in dem auch bin\ liegt." "This file has to sit in the folder that also contains bin\." "Этот файл должен лежать в той же папке, где лежит bin\.") $M
  Zeile (L "Beim Aktualisieren gehoert der INHALT des Pakets in den bestehenden" "When updating, the CONTENTS of the package belong in the existing" "При обновлении СОДЕРЖИМОЕ пакета нужно положить в существующую") $M
  Zeile (L "Ordner, nicht der ausgepackte Ordner daneben." "folder, not the unpacked folder next to it." "папку, а не в распакованную папку рядом с ней.") $M
  Write-Host ""
  Read-Host (L "     [Eingabetaste zum Schliessen]" "     [Press Enter to close]" "     [Нажмите Enter, чтобы закрыть]") | Out-Null
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
  if ($v) { $NODE = $EIGEN; Zeile (L "[ok] Node.js v$v liegt im Projektordner." "[ok] Node.js v$v is in the project folder." "[ok] Node.js v$v лежит в папке проекта.") 'Green' }
}
if (-not $NODE) {
  $sys = Get-Command node -ErrorAction SilentlyContinue
  if ($sys) {
    $v = NodeTauglich $sys.Source
    if ($v) { $NODE = $sys.Source; Zeile (L "[ok] Node.js v$v ist auf diesem Rechner installiert." "[ok] Node.js v$v is installed on this computer." "[ok] Node.js v$v установлен на этом компьютере.") 'Green' }
    else { Zeile (L "[!]  Das installierte Node.js ist zu alt - ich hole eine eigene Fassung daneben." "[!]  The installed Node.js is too old - I will fetch a version of my own alongside." "[!]  Установленный Node.js слишком старый - я загружу рядом собственную версию.") 'Yellow' }
  }
}

# Liegt Node schon im Zwischenlager dieses Rechners? Dann kopieren statt
# holen - derselbe Gedanke wie bei ffmpeg und den Modellen in
# bin/einrichten.js: einmal geholt ist einmal geholt.
$LAGER = Join-Path $env:LOCALAPPDATA 'KlangTresor'
if (-not $NODE -and (Test-Path (Join-Path $LAGER 'node\node.exe'))) {
  $v = NodeTauglich (Join-Path $LAGER 'node\node.exe')
  if ($v) {
    Zeile (L "[->] Node.js liegt schon auf diesem Rechner - ich kopiere es her." "[->] Node.js is already on this computer - I will copy it over." "[->] Node.js уже есть на этом компьютере - я скопирую его сюда.") $O
    New-Item -ItemType Directory -Path $WERKZEUG -Force | Out-Null
    if (Test-Path $EIGEN) { Remove-Item (Join-Path $WERKZEUG 'node') -Recurse -Force -ErrorAction SilentlyContinue }
    Copy-Item (Join-Path $LAGER 'node') (Join-Path $WERKZEUG 'node') -Recurse -Force -ErrorAction SilentlyContinue
    $v2 = NodeTauglich $EIGEN
    if ($v2) { $NODE = $EIGEN; Zeile (L "[ok] Node.js v$v2 aus dem Zwischenlager." "[ok] Node.js v$v2 from the local cache." "[ok] Node.js v$v2 из локального хранилища.") 'Green' }
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
    Zeile (L "[x]  In quellen.txt fehlt die Zeile '$schluessel'." "[x]  The line '$schluessel' is missing in quellen.txt." "[x]  В quellen.txt нет строки '$schluessel'.") 'Red'
    Zeile (L "Ohne Node.js geht es nicht. Von Hand: https://nodejs.org (LTS)." "It does not work without Node.js. By hand: https://nodejs.org (LTS)." "Без Node.js не обойтись. Вручную: https://nodejs.org (LTS).") $M
    Write-Host ""
    Read-Host (L "     [Eingabetaste]" "     [Press Enter]" "     [Нажмите Enter]") | Out-Null
    exit 1
  }

  Write-Host "     ->   " -ForegroundColor $O -NoNewline
  Write-Host (L "Node.js holen - rund 30 MB. Es wird NICHT installiert, nur hierher gelegt." "Fetching Node.js - about 30 MB. It is NOT installed, only placed here." "Загрузка Node.js - около 30 МБ. Он НЕ устанавливается, а только кладётся сюда.")
  Zeile (L "Kein Eintrag im System, keine Administratorrechte." "No entry in the system, no administrator rights." "Никаких записей в системе, права администратора не нужны.") $M
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
        $teil = if ($ganz -gt 0) { (L ' von {0:N1} MB ({1} %)' ' of {0:N1} MB ({1} %)' ' из {0:N1} МБ ({1} %)') -f ($ganz / 1MB), [int]($summe / $ganz * 100) } else { '' }
        Write-Host (("`r     ->   " + (L 'Node.js ... {0:N1} MB{1}' 'Node.js ... {0:N1} MB{1}' 'Node.js ... {0:N1} МБ{1}') + "          ") -f ($summe / 1MB), $teil) -NoNewline -ForegroundColor $O
      }
    }
    $datei.Close(); $quelle.Close(); $antwort.Close()
    Write-Host ("`r" + (' ' * 78) + "`r") -NoNewline
    $gut = $true
  } catch {
    if ($datei) { try { $datei.Close() } catch {} }
    Write-Host ("`r" + (' ' * 78) + "`r") -NoNewline
    $fehl = $_.Exception.Message.Split([char]10)[0]
    Zeile (L "[x]  Node.js holen ging nicht: $fehl" "[x]  Fetching Node.js failed: $fehl" "[x]  Не удалось загрузить Node.js: $fehl") 'Red'
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
      if ($v) {
        $NODE = $EIGEN; Zeile (L "[ok] Node.js v$v liegt jetzt in werkzeug\node." "[ok] Node.js v$v is now in werkzeug\node." "[ok] Node.js v$v теперь лежит в werkzeug\node.") 'Green'
        # fuer das naechste Mal aufheben
        New-Item -ItemType Directory -Path $LAGER -Force | Out-Null
        Remove-Item (Join-Path $LAGER 'node') -Recurse -Force -ErrorAction SilentlyContinue
        Copy-Item (Join-Path $WERKZEUG 'node') (Join-Path $LAGER 'node') -Recurse -Force -ErrorAction SilentlyContinue
      }
    } catch {
      $fehl = $_.Exception.Message.Split([char]10)[0]
      Zeile (L "[x]  Auspacken ging nicht: $fehl" "[x]  Unpacking failed: $fehl" "[x]  Не удалось распаковать: $fehl") 'Red'
    }
  }

  if (-not $NODE) {
    Write-Host ""
    Zeile (L "Ohne Node.js geht es nicht weiter - ueberspringen kann man das nicht." "Without Node.js it cannot go on - this step cannot be skipped." "Без Node.js дальше никак - этот шаг пропустить нельзя.") $M
    Zeile (L "Von Hand geht es auch: https://nodejs.org, die LTS-Fassung." "By hand works too: https://nodejs.org, the LTS version." "Можно и вручную: https://nodejs.org, версия LTS.") $M
    Write-Host ""
    Write-Host (L "     Noch einmal versuchen? [J/n] " "     Try again? [Y/n] " "     Попробовать ещё раз? [Д/n] ") -ForegroundColor $P -NoNewline
    $a = Read-Host
    if ($a) { $a = $a.Trim() }
    # j/J (Deutsch), y/Y (Englisch), д/Д (Russisch) heissen ja; leer auch
    if ($a -and $a -notmatch '^[jJyYдД]') {
      Zeile (L "Nichts ist verloren. Starte diese Datei einfach noch einmal." "Nothing is lost. Just start this file again." "Ничего не потеряно. Просто запустите этот файл ещё раз.") $M
      Write-Host ""
      Read-Host (L "     [Eingabetaste]" "     [Press Enter]" "     [Нажмите Enter]") | Out-Null
      exit 1
    }
  }
}

# --- Ab hier uebernimmt das Programm ----------------------------------
Write-Host ""
& $NODE 'bin\einrichten.js' @args
exit $LASTEXITCODE
