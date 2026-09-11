# KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
# DER ANLASSER für Mac und Linux.
#
# Kein eigenständiges Programm: einrichten-macos.command und
# einrichten-linux.sh holen diese Datei mit `.` herein. Sie muss also
# nicht ausführbar sein und braucht keine Zeile mit #!.
#
# DIESE DATEI TUT NUR EINES: sie beschafft Node.js. Danach übernimmt
# bin/einrichten.js — und das ist ein richtiges Programm statt eines
# Skripts, mit Farben, Fortschritt und Rückfragen.
#
# WARUM DIE TEILUNG: vorher lag dieselbe Abfolge dreimal da — einmal in
# PowerShell, einmal hier für Linux, einmal für den Mac. Jede Änderung
# musste dreimal gemacht und dreimal geprüft werden, und der Windows-Zweig
# lief dabei regelmäßig auseinander. Jetzt steht die Abfolge einmal, in
# bin/einrichten.js, und die drei Anlasser sind so kurz, dass man sie
# im Ganzen lesen kann.
#
# Der Aufrufer setzt vorher zwei Dinge:
#   KT_SYSTEM   'macos' oder 'linux'   — nur für die Ratschläge
#   KT_ANHALTEN 1, wenn das Fenster am Ende auf eine Taste warten soll
#               (Doppelklick im Finder: sonst ist es weg, bevor man liest)

set -u
KT_SYSTEM="${KT_SYSTEM:-linux}"
KT_ANHALTEN="${KT_ANHALTEN:-0}"

# --- Farben ------------------------------------------------------------
# 256 Farben, nicht 24 Bit: Terminal.app auf dem Mac kann kein Echtfarben.
# Die feinen Hausfarben zeichnet ohnehin erst bin/einrichten.js, dort
# schaltet Node die Farbverarbeitung selbst ein.
if [ -t 1 ] && [ "${TERM:-dumb}" != "dumb" ] && [ -z "${NO_COLOR:-}" ]; then
  O=$'\033[38;5;208m'; P=$'\033[38;5;198m'; M=$'\033[38;5;244m'
  R=$'\033[38;5;203m'; G=$'\033[38;5;114m'; X=$'\033[0m'
else
  O=''; P=''; M=''; R=''; G=''; X=''
fi
zeile() { printf '     %s\n' "$1"; }
warten() { [ "$KT_ANHALTEN" = "1" ] && read -r -p "     [Eingabetaste] " _ ; }

printf '\n     %sK L A N G T R E S O R%s\n' "$O" "$X"
printf '     %seinrichten%s\n\n' "$M" "$X"

# --- Liegen wir richtig? -----------------------------------------------
if [ ! -f bin/einrichten.js ] || [ ! -f package.json ]; then
  zeile "${R}[x]${X}  Das sieht nicht nach KlangTresor aus."
  zeile "${M}Hier fehlt bin/einrichten.js oder package.json.${X}"
  echo ""
  zeile "${M}Diese Datei muss in dem Ordner liegen, in dem auch bin/ liegt.${X}"
  zeile "${M}Beim Aktualisieren gehört der INHALT des Pakets in den bestehenden${X}"
  zeile "${M}Ordner, nicht der ausgepackte Ordner daneben.${X}"
  echo ""
  warten
  exit 1
fi

# --- Node.js ------------------------------------------------------------
# Reihenfolge: was schon im Projektordner liegt, dann was auf dem System
# installiert ist, sonst holen. So gewinnt nie eine zu alte Systemfassung
# über eine frisch geholte. Gebraucht wird Fassung 20 oder neuer.
node_tauglich() {
  v="$("$1" -v 2>/dev/null | tr -d 'v' | cut -d. -f1)"
  case "$v" in ''|*[!0-9]*) return 1 ;; esac
  [ "$v" -ge 20 ]
}

WERKZEUG="$(pwd)/werkzeug"
EIGEN="$WERKZEUG/node/bin/node"
NODE=""

if [ -x "$EIGEN" ] && node_tauglich "$EIGEN"; then
  NODE="$EIGEN"
  zeile "${G}[ok]${X} Node.js $("$EIGEN" -v) liegt im Projektordner."
elif command -v node >/dev/null 2>&1 && node_tauglich node; then
  NODE="$(command -v node)"
  zeile "${G}[ok]${X} Node.js $(node -v) ist auf diesem Rechner installiert."
elif command -v node >/dev/null 2>&1; then
  zeile "${O}[!]${X}  Das installierte Node.js ist zu alt ($(node -v)) — ich hole eine eigene Fassung daneben."
fi

while [ -z "$NODE" ]; do
  # Die Adresse steht in quellen.txt, damit sie jemand ändern kann, wenn
  # nodejs.org umzieht — ohne in diesem Skript zu suchen.
  case "$(uname -m)" in
    arm64|aarch64) BOGEN="arm64" ;;
    x86_64|amd64)  BOGEN="x64" ;;
    *)             BOGEN="$(uname -m)" ;;
  esac
  SCHLUESSEL="node-${KT_SYSTEM}-${BOGEN}"
  URL=""
  if [ -f quellen.txt ]; then
    URL="$(sed 's/#.*//' quellen.txt | awk -v s="$SCHLUESSEL" \
      '{ i = index($0, "="); if (i < 2) next
         k = substr($0, 1, i - 1); w = substr($0, i + 1)
         gsub(/^[ \t]+|[ \t]+$/, "", k); gsub(/^[ \t]+|[ \t]+$/, "", w)
         if (k == s) print w }' | tail -n1)"
  fi
  if [ -z "$URL" ]; then
    zeile "${R}[x]${X}  In quellen.txt fehlt die Zeile '$SCHLUESSEL'."
    if [ "$KT_SYSTEM" = "macos" ]; then
      zeile "${M}Von Hand: https://nodejs.org (LTS) — oder: brew install node${X}"
    else
      zeile "${M}Von Hand: https://nodejs.org (LTS) — oder über den Paketmanager.${X}"
    fi
    echo ""
    warten
    exit 1
  fi

  printf '     %s->  %s Node.js holen — rund 30 MB. Es wird NICHT installiert, nur hierher gelegt.\n' "$O" "$X"
  zeile "${M}Kein Eintrag im System, keine Verwalterrechte.${X}"
  echo ""

  mkdir -p "$WERKZEUG"
  TAR="$WERKZEUG/node.tar.gz"
  rm -f "$TAR"
  GUT=0
  if command -v curl >/dev/null 2>&1; then
    if [ -t 1 ]; then ZEIG="--progress-bar"; else ZEIG="-sS"; fi
    # --speed-time begrenzt den STILLSTAND, nicht die Dauer: wer eine
    # langsame Leitung hat, soll nicht nach zwei Minuten abbrechen.
    curl -fL $ZEIG -A 'KlangTresor-Anlasser' --connect-timeout 30 \
      --speed-limit 1024 --speed-time 120 -o "$TAR" "$URL" && GUT=1
  elif command -v wget >/dev/null 2>&1; then
    wget -q --show-progress -U 'KlangTresor-Anlasser' -T 30 -O "$TAR" "$URL" && GUT=1
  else
    zeile "${R}[x]${X}  Weder curl noch wget ist da — ohne eines von beiden kann ich nichts holen."
  fi

  if [ "$GUT" = "1" ]; then
    ROH="$WERKZEUG/_node_roh"
    rm -rf "$ROH"; mkdir -p "$ROH"
    if tar -xzf "$TAR" -C "$ROH" 2>/dev/null; then
      DRIN="$(find "$ROH" -mindepth 1 -maxdepth 1 -type d | head -n1)"
      if [ -n "$DRIN" ]; then
        rm -rf "$WERKZEUG/node"
        mv "$DRIN" "$WERKZEUG/node"
      fi
      rm -rf "$ROH"; rm -f "$TAR"
      if [ -x "$EIGEN" ] && node_tauglich "$EIGEN"; then
        NODE="$EIGEN"
        zeile "${G}[ok]${X} Node.js $("$EIGEN" -v) liegt jetzt in werkzeug/node."
      fi
    else
      zeile "${R}[x]${X}  Auspacken ging nicht."
    fi
  fi

  if [ -z "$NODE" ]; then
    echo ""
    zeile "${M}Ohne Node.js geht es nicht weiter — überspringen kann man das nicht.${X}"
    if [ "$KT_SYSTEM" = "macos" ]; then
      zeile "${M}Von Hand geht es auch: brew install node, oder https://nodejs.org (LTS).${X}"
    else
      zeile "${M}Von Hand geht es auch: über den Paketmanager, oder https://nodejs.org (LTS).${X}"
    fi
    echo ""
    printf '     %sNoch einmal versuchen? [J/n] %s' "$P" "$X"
    read -r a
    case "$a" in
      [nN]*)
        zeile "${M}Nichts ist verloren. Starte diese Datei einfach noch einmal.${X}"
        echo ""
        warten
        exit 1 ;;
    esac
  fi
done

# --- Ab hier übernimmt das Programm ------------------------------------
echo ""
"$NODE" bin/einrichten.js
KT_ENDE=$?
[ "$KT_ENDE" -ne 0 ] && warten
exit $KT_ENDE
