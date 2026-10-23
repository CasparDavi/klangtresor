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
# SPRACHE: kommt normalerweise schon vom Aufrufer (einrichten-*.command/.sh) als KT_SPRACHE;
# sonst hier bestimmen. t gibt den Text in dieser Sprache aus (de, en, ru).
case "${KT_SPRACHE:-}" in de|en|ru) ;; *)
  _sp=$(defaults read -g AppleLanguages 2>/dev/null | tr -d '(), "' | grep -v '^$' | head -1)
  [ -n "$_sp" ] || _sp=${LC_ALL:-${LC_MESSAGES:-${LANG:-}}}
  case "$_sp" in ru*|RU*) KT_SPRACHE=ru ;; de*|DE*) KT_SPRACHE=de ;; *) KT_SPRACHE=en ;; esac ;;
esac
export KT_SPRACHE
t() { case "$KT_SPRACHE" in ru) printf '%s' "$3" ;; en) printf '%s' "$2" ;; *) printf '%s' "$1" ;; esac; }
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
warten() { [ "$KT_ANHALTEN" = "1" ] && read -r -p "$(t "     [Eingabetaste] " "     [Press Enter] " "     [Нажмите Enter] ")" _ ; }

printf '\n     %sK L A N G T R E S O R%s\n' "$O" "$X"
printf '     %s%s%s\n\n' "$M" "$(t einrichten 'set up' установка)" "$X"

# --- Liegen wir richtig? -----------------------------------------------
if [ ! -f bin/einrichten.js ] || [ ! -f package.json ]; then
  zeile "${R}[x]${X}  $(t "Das sieht nicht nach KlangTresor aus." "This does not look like KlangTresor." "Это не похоже на KlangTresor.")"
  zeile "${M}$(t "Hier fehlt bin/einrichten.js oder package.json." "bin/einrichten.js or package.json is missing here." "Здесь нет bin/einrichten.js или package.json.")${X}"
  echo ""
  zeile "${M}$(t "Diese Datei muss in dem Ordner liegen, in dem auch bin/ liegt." "This file has to sit in the folder that also contains bin/." "Этот файл должен лежать в той же папке, где лежит bin/.")${X}"
  zeile "${M}$(t "Beim Aktualisieren gehört der INHALT des Pakets in den bestehenden" "When updating, the CONTENTS of the package belong in the existing" "При обновлении СОДЕРЖИМОЕ пакета нужно положить в существующую")${X}"
  zeile "${M}$(t "Ordner, nicht der ausgepackte Ordner daneben." "folder, not the unpacked folder next to it." "папку, а не в распакованную папку рядом с ней.")${X}"
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
  zeile "${G}[ok]${X} Node.js $("$EIGEN" -v) $(t "liegt im Projektordner." "is in the project folder." "лежит в папке проекта.")"
elif command -v node >/dev/null 2>&1 && node_tauglich node; then
  NODE="$(command -v node)"
  zeile "${G}[ok]${X} Node.js $(node -v) $(t "ist auf diesem Rechner installiert." "is installed on this computer." "установлен на этом компьютере.")"
elif command -v node >/dev/null 2>&1; then
  zeile "${O}[!]${X}  $(t "Das installierte Node.js ist zu alt" "The installed Node.js is too old" "Установленный Node.js слишком старый") ($(node -v)) — $(t "ich hole eine eigene Fassung daneben." "I will fetch a version of my own alongside." "я загружу рядом собственную версию.")"
fi

# Liegt Node schon im Zwischenlager dieses Rechners? Dann kopieren statt
# holen - derselbe Gedanke wie bei ffmpeg und den Modellen in
# bin/einrichten.js: einmal geholt ist einmal geholt.
LAGER="${XDG_CACHE_HOME:-$HOME/.cache}/klangtresor"
[ "$(uname)" = "Darwin" ] && LAGER="$HOME/Library/Caches/KlangTresor"
if [ -z "$NODE" ] && [ -x "$LAGER/node/bin/node" ] && node_tauglich "$LAGER/node/bin/node"; then
  zeile "${O}->${X}   $(t "Node.js liegt schon auf diesem Rechner — ich kopiere es her." "Node.js is already on this computer — I will copy it over." "Node.js уже есть на этом компьютере — я скопирую его сюда.")"
  mkdir -p "$WERKZEUG"
  rm -rf "$WERKZEUG/node"
  cp -R "$LAGER/node" "$WERKZEUG/node" 2>/dev/null
  if [ -x "$EIGEN" ] && node_tauglich "$EIGEN"; then
    NODE="$EIGEN"
    zeile "${G}[ok]${X} Node.js $("$EIGEN" -v) $(t "aus dem Zwischenlager." "from the local cache." "из локального хранилища.")"
  fi
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
    zeile "${R}[x]${X}  $(t "In quellen.txt fehlt die Zeile" "The line is missing in quellen.txt:" "В quellen.txt нет строки:") '$SCHLUESSEL'."
    if [ "$KT_SYSTEM" = "macos" ]; then
      zeile "${M}$(t "Von Hand: https://nodejs.org (LTS) — oder: brew install node" "By hand: https://nodejs.org (LTS) — or: brew install node" "Вручную: https://nodejs.org (LTS) — или: brew install node")${X}"
    else
      zeile "${M}$(t "Von Hand: https://nodejs.org (LTS) — oder über den Paketmanager." "By hand: https://nodejs.org (LTS) — or via the package manager." "Вручную: https://nodejs.org (LTS) — или через менеджер пакетов.")${X}"
    fi
    echo ""
    warten
    exit 1
  fi

  printf '     %s->  %s %s\n' "$O" "$X" "$(t 'Node.js holen — rund 30 MB. Es wird NICHT installiert, nur hierher gelegt.' 'Fetching Node.js — about 30 MB. It is NOT installed, only placed here.' 'Загрузка Node.js — около 30 МБ. Он НЕ устанавливается, а только кладётся сюда.')"
  zeile "${M}$(t "Kein Eintrag im System, keine Verwalterrechte." "No entry in the system, no administrator rights." "Никаких записей в системе, права администратора не нужны.")${X}"
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
    zeile "${R}[x]${X}  $(t "Weder curl noch wget ist da — ohne eines von beiden kann ich nichts holen." "Neither curl nor wget is here — without one of them I cannot fetch anything." "Нет ни curl, ни wget — без одного из них я ничего не могу загрузить.")"
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
        zeile "${G}[ok]${X} Node.js $("$EIGEN" -v) $(t "liegt jetzt in werkzeug/node." "is now in werkzeug/node." "теперь лежит в werkzeug/node.")"
        # fuer das naechste Mal aufheben
        mkdir -p "$LAGER" && rm -rf "$LAGER/node" && cp -R "$WERKZEUG/node" "$LAGER/node" 2>/dev/null
      fi
    else
      zeile "${R}[x]${X}  $(t "Auspacken ging nicht." "Unpacking failed." "Не удалось распаковать.")"
    fi
  fi

  if [ -z "$NODE" ]; then
    echo ""
    zeile "${M}$(t "Ohne Node.js geht es nicht weiter — überspringen kann man das nicht." "Without Node.js it cannot go on — this step cannot be skipped." "Без Node.js дальше никак — этот шаг пропустить нельзя.")${X}"
    if [ "$KT_SYSTEM" = "macos" ]; then
      zeile "${M}$(t "Von Hand geht es auch: brew install node, oder https://nodejs.org (LTS)." "By hand works too: brew install node, or https://nodejs.org (LTS)." "Можно и вручную: brew install node или https://nodejs.org (LTS).")${X}"
    else
      zeile "${M}$(t "Von Hand geht es auch: über den Paketmanager, oder https://nodejs.org (LTS)." "By hand works too: via the package manager, or https://nodejs.org (LTS)." "Можно и вручную: через менеджер пакетов или https://nodejs.org (LTS).")${X}"
    fi
    echo ""
    printf '     %s%s%s' "$P" "$(t 'Noch einmal versuchen? [J/n] ' 'Try again? [Y/n] ' 'Попробовать ещё раз? [Д/n] ')" "$X"
    read -r a
    case "$a" in
      [nN]*|[нН]*)
        zeile "${M}$(t "Nichts ist verloren. Starte diese Datei einfach noch einmal." "Nothing is lost. Just start this file again." "Ничего не потеряно. Просто запустите этот файл ещё раз.")${X}"
        echo ""
        warten
        exit 1 ;;
    esac
  fi
done

# --- Ab hier übernimmt das Programm ------------------------------------
# Argumente werden durchgereicht ("$@"), damit --ohne-start und --probe N
# auch über den Doppelklick-Weg ankommen. Beim Doppelklick sind es keine.
echo ""
"$NODE" bin/einrichten.js "$@"
KT_ENDE=$?
[ "$KT_ENDE" -ne 0 ] && warten
exit $KT_ENDE
