#!/bin/bash
# KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
# KlangTresor einrichten — Linux.
#
#   ./einrichten-linux.sh
#   (Sollte er sich weigern, einmal: chmod +x einrichten-linux.sh)
#
# Was hier passiert: prüfen, was fehlt · Pakete holen · Modelle holen ·
# nach dem Suno-Alias fragen · Songs sammeln · Medien laden · starten.
# Jeder Schritt lässt sich einzeln wiederholen; nichts wird doppelt getan.

cd "$(dirname "$0")" || exit 1
set -u

echo ""
echo "  KlangTresor einrichten — Linux"
echo "  =============================="
echo ""

# Welcher Paketmanager liegt vor? Nur für den Rat, was zu tippen ist.
if   command -v apt    >/dev/null 2>&1; then RAT="sudo apt install -y nodejs npm ffmpeg"
elif command -v dnf    >/dev/null 2>&1; then RAT="sudo dnf install -y nodejs ffmpeg"
elif command -v pacman >/dev/null 2>&1; then RAT="sudo pacman -S nodejs npm ffmpeg"
elif command -v zypper >/dev/null 2>&1; then RAT="sudo zypper install nodejs ffmpeg"
else RAT="dein Paketmanager: nodejs (ab 20) und ffmpeg"
fi

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
# Nachbarordnern. Wer sich vertut, erfaehrt es hier und nicht nach
# zwanzig Minuten Herunterladen.

echo "  Ordner: $(pwd)"
echo ""

if [ ! -f package.json ] || [ ! -d bin ] || [ ! -d server ] || [ ! -d web ]; then
  echo "  Das sieht nicht nach KlangTresor aus — hier fehlen bin/,"
  echo "  server/, web/ oder package.json."
  echo ""
  echo "  Dieses Skript muss in dem Ordner liegen, in dem auch bin/ liegt."
  echo "  Beim Aktualisieren gehört der INHALT des ZIP in den bestehenden"
  echo "  Ordner, nicht der ausgepackte Ordner daneben."
  echo ""
  read -r -p "  [Eingabetaste zum Schliessen] " _
  exit 1
fi

# Woran man ein Archiv erkennt: am KATALOG. Nicht an library/roh/ —
# dieser Ordner ist im gesunden Betrieb LEER, weil aufbereiten.js die
# verarbeiteten Rohdaten wegräumt. Wer nach roh/ fragt, stellt eine
# Frage, die auch bei einem intakten Archiv mit "nein" beantwortet wird.
hier_katalog=0; hier_songs=0
[ -f library/katalog.json.gz ] || [ -f library/katalog.json ] && hier_katalog=1
if [ -d library/songs ]; then
  hier_songs=$(ls -1 library/songs 2>/dev/null | grep -v '^\._' | wc -l | tr -d ' ')
fi

if [ "$hier_katalog" -eq 1 ] || [ "${hier_songs:-0}" -gt 0 ]; then
  # --- Hier liegt ein Archiv: feststellen, nicht fragen ---------------
  n_wav=$(ls library/songs/*/audio.wav 2>/dev/null | wc -l | tr -d ' ')
  n_stems=$(ls -d library/songs/*/stems 2>/dev/null | wc -l | tr -d ' ')
  echo "  Hier liegt ein Archiv: ${hier_songs:-0} Songs, $n_wav davon als WAV,"
  echo "  $n_stems mit Instrumentspuren."
  echo "  Ich aktualisiere es — nichts wird überschrieben, nur ergänzt."
  echo ""
  read -r -p "  Weiter? [J/n]: " weiter
  case "$weiter" in
    n|N) echo "  Abgebrochen — nichts verändert."; exit 0 ;;
  esac
  echo ""
else
  # --- Hier ist keines. Liegt vielleicht eines nebenan? ---------------
  nachbar=""
  for d in ../*/; do
    [ "$(cd "$d" 2>/dev/null && pwd)" = "$(pwd)" ] && continue
    if [ -f "$d/library/katalog.json.gz" ] || [ -f "$d/library/katalog.json" ]; then
      nachbar="$d"; break
    fi
  done

  if [ -n "$nachbar" ]; then
    n_nachbar=$(ls -1 "$nachbar/library/songs" 2>/dev/null | grep -v '^\._' | wc -l | tr -d ' ')
    echo "  Hier ist kein Archiv — aber nebenan liegt eines:"
    echo "      $(cd "$nachbar" && pwd)"
    echo "      $n_nachbar Songs"
    echo ""
    echo "  Vermutlich ist das der Ordner, der gemeint war. Beim"
    echo "  Aktualisieren gehört der INHALT dieses ZIP dorthin — nicht"
    echo "  der ausgepackte Ordner daneben."
    echo ""
    echo "  Fange ich hier trotzdem neu an, wird alles neu geladen. Und"
    echo "  was dabei zurückkommt, ist weniger als das, was drüben liegt:"
    echo "  MP3, Cover und Artwork ja — die WAV-Originale und die"
    echo "  Instrumentspuren nicht."
    echo ""
    read -r -p "  Trotzdem hier neu anfangen? [j/N]: " trotzdem
    case "$trotzdem" in
      j|J|y|Y) echo "" ;;
      *) echo "  Abgebrochen — nichts verändert."; exit 0 ;;
    esac
  else
    echo "  Hier ist noch kein Archiv. Ich lege eines an."
    echo ""
    read -r -p "  Weiter? [J/n]: " weiter
    case "$weiter" in
      n|N) echo "  Abgebrochen — nichts verändert."; exit 0 ;;
    esac
    echo ""
  fi
fi

# Läuft schon ein Server auf 8788? Dann zeigt der Browser gleich das
# ANDERE Archiv, während dieser hier mit "Adresse belegt" stirbt — und
# es sieht nach Erfolg aus.
if command -v curl >/dev/null 2>&1 && curl -s -o /dev/null --max-time 2 http://localhost:8788/ 2>/dev/null; then
  echo "  Auf Port 8788 antwortet bereits ein KlangTresor."
  echo "  Solange der läuft, kann dieser hier nicht starten — und der"
  echo "  Browser würde den anderen zeigen."
  echo ""
  echo "  Erst dort das Fenster mit Strg-C beenden, dann hier weiter."
  echo ""
  read -r -p "  Trotzdem weitermachen? [j/N]: " trotzdem
  case "$trotzdem" in
    j|J|y|Y) echo "" ;;
    *) echo "  Abgebrochen — nichts verändert."; exit 0 ;;
  esac
fi

fehlt=0

if command -v node >/dev/null 2>&1; then
  v=$(node -v | tr -d 'v' | cut -d. -f1)
  if [ "$v" -ge 20 ] 2>/dev/null; then
    echo "  ✓ Node.js $(node -v)"
  else
    echo "  ✗ Node.js ist zu alt ($(node -v)) — gebraucht wird 20 oder neuer."
    echo "    Die Fassung aus dem Paketmanager ist oft älter; dann hilft"
    echo "    https://nodejs.org oder nvm."
    fehlt=1
  fi
else
  echo "  ✗ Node.js fehlt.   →  $RAT"
  fehlt=1
fi

if command -v ffmpeg >/dev/null 2>&1; then
  echo "  ✓ ffmpeg"
else
  echo "  ✗ ffmpeg fehlt.    →  $RAT"
  fehlt=1
fi

if [ "$fehlt" -eq 1 ]; then
  echo ""
  echo "  Bitte das Fehlende nachholen und dieses Skript erneut starten."
  echo ""
  exit 1
fi

echo ""
echo "  → Pakete holen (npm install) …"
npm install --no-fund --no-audit || { echo "  npm install ist gescheitert."; exit 1; }

echo ""
echo "  → KI-Modelle holen (rund 284 MB: Stemtrennung und Musikstil) …"
echo "    Klappt das nicht, läuft alles andere trotzdem."
node bin/modelle-holen.js || echo "  Modelle übersprungen."

# --- Alias -------------------------------------------------------------
handle=""
if [ -f library/konfig.json ]; then
  handle=$(node -e "try{process.stdout.write(JSON.parse(require('fs').readFileSync('library/konfig.json','utf8')).handle||'')}catch(e){}")
fi

if [ -n "$handle" ]; then
  echo ""
  echo "  Gemerkter Suno-Alias: @$handle"
else
  echo ""
  echo "  Dein Suno-Alias — der Name hinter dem @ auf deiner Profilseite."
  read -r -p "  Alias: " handle
  handle="${handle#@}"
fi

if [ -z "$handle" ]; then
  echo "  Ohne Alias geht es nicht weiter."
  exit 1
fi

echo ""
echo "  → Songliste von @$handle holen …"
node bin/sammeln.js "$handle" || { echo "  Sammeln gescheitert."; exit 1; }

echo ""
echo "  → Medien laden (MP3, Cover, Videos). Das dauert ein paar Minuten;"
echo "    abbrechen und später erneut starten ist jederzeit erlaubt."
node bin/wiederherstellen.js || echo "  Nicht alles geladen — später wiederholen."

IP=$(hostname -I 2>/dev/null | awk '{print $1}')
echo ""
echo "  Fertig. KlangTresor startet jetzt."
echo "  Adresse:  http://localhost:8788"
[ -n "${IP:-}" ] && echo "  Im WLAN:  http://$IP:8788"
echo "  Zum Beenden Strg-C drücken."
echo ""
sleep 1
(command -v xdg-open >/dev/null 2>&1 && sleep 2 && xdg-open http://localhost:8788 >/dev/null 2>&1) &
exec node server/server.js
