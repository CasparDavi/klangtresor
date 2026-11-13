#!/bin/bash
# KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
# =============================================================
# DIE SYMBOLE AUS DER SVG BAUEN
# labor/symbole/symbole-bauen.sh - Werkstatt, nicht Betrieb. Braucht Chrome und ImageMagick, beides steckt NICHT im
# ausgelieferten Paket; ein Nutzer geht diesen Weg nie. Gerufen wird es von Hand, wenn sich web/symbol/klangtresor.svg
# aendert - sonst laufen SVG und PNG/ICO/ICNS auseinander (so geschehen bis 13.11.2026: der Tab-Favicon war laengst
# orange, die Schreibtischdateien noch die dunkle Fassung vom September).
#
# ImageMagick rendert die SVG NICHT selbst: sein eingebauter Leser verschluckt Konturen ohne Fuellung, und genau daraus
# bestehen beide Zeichen. Darum macht Chrome das Bild (durchsichtiger Grund ueber --default-background-color=00000000)
# und ImageMagick nur noch das Verkleinern und Buendeln.
# =============================================================
set -euo pipefail
WURZEL="$(cd "$(dirname "$0")/../.." && pwd)"
QUELLE="$WURZEL/web/symbol/klangtresor.svg"
ZIEL="$WURZEL/web/symbol"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Chrome fehlt: $CHROME"; exit 1; }
command -v magick >/dev/null || { echo "ImageMagick fehlt. Einmal: brew install imagemagick"; exit 1; }

T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
printf '<html><head><style>html,body{margin:0;background:transparent}svg{display:block;width:1024px;height:1024px}</style></head><body>%s</body></html>' "$(cat "$QUELLE")" > "$T/gross.html"
# --mute-audio: der Testbrowser bleibt stumm (Hausregel)
"$CHROME" --headless --disable-gpu --mute-audio --window-size=1024,1024 --default-background-color=00000000 \
  --screenshot="$T/1024.png" --virtual-time-budget=1500 "file://$T/gross.html" >/dev/null 2>&1

for s in 16 32 48 64 128 256 512 1024; do magick "$T/1024.png" -resize ${s}x${s} -strip "$T/$s.png"; done
magick "$T/1024.png" -strip "$ZIEL/klangtresor-1024.png"
cp "$T/256.png"  "$ZIEL/klangtresor-256.png"
# .ico fuer Windows: die Groessen, die der Explorer in Liste, Kacheln und Verknuepfung zeigt
magick "$T/16.png" "$T/32.png" "$T/48.png" "$T/64.png" "$T/128.png" "$T/256.png" "$ZIEL/klangtresor.ico"
# .icns fuer macOS: iconutil will je Groesse das einfache und das doppelte Bild
IS="$T/klangtresor.iconset"; mkdir "$IS"
for s in 16 32 128 256 512; do cp "$T/$s.png" "$IS/icon_${s}x${s}.png"; cp "$T/$((s*2)).png" "$IS/icon_${s}x${s}@2x.png"; done
iconutil -c icns "$IS" -o "$ZIEL/klangtresor.icns"

# Das Bild links im Windows-Installer (164 x 314, ohne Alphakanal - darum dunkler Grund statt durchsichtig)
printf '<html><head><style>html,body{margin:0;width:164px;height:314px;background:#0c0c0d;overflow:hidden}.mitte{display:flex;flex-direction:column;align-items:center;padding-top:66px}svg{display:block;width:96px;height:96px}p{margin:26px 0 0;font:500 15px/1 "Helvetica Neue",Helvetica,Arial,sans-serif;color:#ff6a00;letter-spacing:.2px}</style></head><body><div class="mitte">%s<p>KlangTresor</p></div></body></html>' "$(cat "$QUELLE")" > "$T/seite.html"
"$CHROME" --headless --disable-gpu --mute-audio --window-size=164,314 --screenshot="$T/seite.png" \
  --virtual-time-budget=1500 "file://$T/seite.html" >/dev/null 2>&1
magick "$T/seite.png" -resize 164x314! BMP3:"$WURZEL/bin/setup/seite.bmp"

echo "gebaut: klangtresor-1024.png, -256.png, .ico, .icns, bin/setup/seite.bmp"
