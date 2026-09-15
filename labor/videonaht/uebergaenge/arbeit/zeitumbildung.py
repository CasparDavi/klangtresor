#!/usr/bin/env python3
# Zeitumbildung fuer "Dopamier mich! v2" (Laborprobe, Anfrage Caspar_D 15.09.2026, nach dem Pendel-Muster).
# Die ganze Handlung (Quellbild 0..240) hin und zurueck, Periode 10 s = 300 Bilder bei 30 fps, 4 Kacheln:
#   1 gleichmaessig (5 s / 5 s)   2 adaptiv (5 s / 5 s)   3 asymmetrisch (6,5 s / 3,5 s)   4 adaptiv + asymmetrisch
#
# Tempo v = Quellbilder je Sekunde / 24 (v = 1: Originaltempo). Jeder Weg der Dauer H hat an beiden Enden
# eine sin²-Rampe der Laenge R: e(t) = sin²(pi t / 2R) bzw. gespiegelt, dazwischen 1. Momentantempo = v(s)·e(t).
# Damit ist die Quellgeschwindigkeit an jeder Wende 0 und ihre Ableitung stetig (keine harte Umkehr).
#
# Adaptiv: c(k) = Bildaenderung Quellbild k -> k+1 (mittlere Grauwertdifferenz der Blockmittel,
# Bloecke ~12x12 Quellpixel), Doppelbilder zusammengelegt, dreieckig ueber +-4 Bilder geglaettet
# (der Codec erzeugt ein 4-Bilder-Muster in c, das sonst als Tempozittern durchschlaegt).
# v(k) = clip(C / (c(k)+eps)^alpha, VMIN, VMAX), C per Bisektion so, dass sum 1/(24 v) = H - R,
# d.h. 0..240 passt genau in den Weg (die Rampen kosten R/2 + R/2 = R Sekunden).
# alpha wird aus den Daten gerechnet (kein Regler): der Streubereich c95/c5 soll gerade den Klemmbereich
# VMAX/VMIN fuellen -> alpha = ln(VMAX/VMIN) / ln(c95/c5), eingegrenzt auf 0,5..0,7.
# alpha = 1 wuerde die Aenderung je Ausgabebild voll angleichen (ruhige Stellen rasen, bewegte kriechen,
# der Rhythmus des Originals verschwindet); alpha = 0 ist gleichmaessig. 0,5..0,7 ist der Kompromiss,
# wie ihn auch die kompressive Wahrnehmung von Bewegungsstaerke nahelegt.
#
# Bildwahl: round(s) aus den 24-fps-Einzelbildern, keine Mittelung (Begruendung in der Rueckgabe:
# hoechstens 3,2 Quellbilder je Ausgabebild, und die Handlung ist ein Morph an Ort und Stelle).
import json, math, os, shutil, subprocess, sys, time, urllib.parse

T0 = time.time()
ROOT = '/Volumes/Extreme_SSD/Entwicklung/SunoArchive'
LAB = ROOT + '/labor/videonaht'
OUT = LAB + '/uebergaenge'
ARB = OUT + '/arbeit'
FFMPEG, FFPROBE = '/usr/local/bin/ffmpeg', '/usr/local/bin/ffprobe'
FPS, TW, BAR = 30, 240, 40
P_BILDER = 300              # Periode 10,00 s
LOOPS = 3
R = 0.5                     # Rampenlaenge je Wende-Seite in s
VMIN, VMAX = 1.0, 4.0       # Klemmung gegen das Original (Mitte des Weges)

erg = json.load(open(LAB + '/ergebnis.json'))
v_ = next(x for x in erg['videos'] if x['titel'] == 'Dopamier mich! v2' and x['datei'] == 'artwork.mp4')
SRC = f"{ROOT}/library/songs/{v_['id']}/artwork.mp4"
N24 = v_['bilder']          # 241
TH = round(TW * v_['quelle']['hoehe'] / v_['quelle']['breite'] / 2) * 2
K = N24 - 1                 # Weg: Quellbild 0 .. 240

def run(args, inp=None):
    r = subprocess.run(args, capture_output=True, input=inp)
    if r.returncode:
        print(' '.join(args)); print(r.stderr[-3000:].decode(errors='replace')); sys.exit(1)
    return r.stdout

def komma(x, n=2):
    return f'{x:.{n}f}'.replace('.', ',')

# ---------- Messung c(k) ----------
MW, MH = 60, 104
raw = run([FFMPEG, '-v', 'error', '-i', SRC, '-vf', f'scale={MW}:{MH}:flags=area', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'])
n = MW * MH
g = [raw[i:i + n] for i in range(0, len(raw), n)]
assert len(g) == N24, len(g)
d = [sum(abs(a - b) for a, b in zip(g[k], g[k + 1])) / n for k in range(K)]

def median(xs):
    s = sorted(xs); m = len(s) // 2
    return s[m] if len(s) % 2 else (s[m - 1] + s[m]) / 2

# Doppelbilder (12-in-24): Intervall mit fast keiner Aenderung gegenueber der Umgebung.
# Die Aenderung des Paares gehoert dann je zur Haelfte auf beide Intervalle (Tempo soll nicht springen).
doppel = [k for k in range(K) if d[k] < 0.3 * median(d[max(0, k - 4):k + 5])]
c = d[:]
for k in doppel:
    nb = k + 1 if k + 1 < K else k - 1
    c[k] = c[nb] = (d[k] + d[nb]) / 2
W = 4
cs = []
for k in range(K):
    num = den = 0.0
    for j in range(-W, W + 1):
        if 0 <= k + j < K:
            w = W + 1 - abs(j); num += w * c[k + j]; den += w
    cs.append(num / den)
srt = sorted(cs)
c05, c95 = srt[int(0.05 * (K - 1))], srt[int(0.95 * (K - 1))]
EPS = 0.1 * median(cs)
ALPHA_ROH = math.log(VMAX / VMIN) / math.log((c95 + EPS) / (c05 + EPS))
ALPHA = min(0.7, max(0.5, ALPHA_ROH))
gk = [1 / (x + EPS) ** ALPHA for x in cs]

def tempo_adaptiv(H):
    ziel = H - R
    lo, hi = 1e-6, 1e6
    for _ in range(200):
        C = math.sqrt(lo * hi)
        v = [min(VMAX, max(VMIN, C * x)) for x in gk]
        if sum(1 / (24 * x) for x in v) > ziel: lo = C
        else: hi = C
    v = [min(VMAX, max(VMIN, C * x)) for x in gk]
    return v, C

def tempo_gleich(H):
    return [K / 24 / (H - R)] * K

def envelope_int(t, H):
    """Integral von e ueber [0, t]; e = sin²-Rampe (R), 1, sin²-Rampe (R)."""
    def rampe(x):   # Integral von sin²(pi u / 2R), u in [0, x]
        return x / 2 - R / (2 * math.pi) * math.sin(math.pi * x / R)
    if t <= R: return rampe(t)
    if t <= H - R: return R / 2 + (t - R)
    return (H - R) - rampe(H - t)   # Symmetrie, Gesamtintegral H - R

def weg(v, H, rueck):
    """Quellposition (0..K, in Hinrichtung) nach t Sekunden auf dem Weg."""
    # tau(x) = Sekunden bei Mitteltempo bis Position x (von der Startseite aus gezaehlt)
    iv = v[::-1] if rueck else v
    cum = [0.0]
    for x in iv: cum.append(cum[-1] + 1 / (24 * x))
    def pos(t):
        tau = envelope_int(t, H) * cum[-1] / (H - R)   # Faktor = 1 bis auf Rundung der Bisektion
        j = min(K - 1, max(0, next((i for i in range(K) if cum[i + 1] >= tau), K - 1)))
        x = j + (tau - cum[j]) / (cum[j + 1] - cum[j])
        return K - x if rueck else x
    return pos

KACHELN = [
    ('gleichmäßig', 5.0, 'gleich'),
    ('adaptiv', 5.0, 'adaptiv'),
    ('asymmetrisch', 6.5, 'gleich'),
    ('adaptiv + asymmetrisch', 6.5, 'adaptiv'),
]
P = P_BILDER / FPS
plaene = []
for titel, Hh, art in KACHELN:
    Hr = P - Hh
    if art == 'gleich':
        vh, vr, Ch, Cr = tempo_gleich(Hh), tempo_gleich(Hr), None, None
    else:
        (vh, Ch), (vr, Cr) = tempo_adaptiv(Hh), tempo_adaptiv(Hr)
    ph, pr = weg(vh, Hh, False), weg(vr, Hr, True)
    s = []
    for k in range(P_BILDER):
        t = k / FPS
        s.append(ph(t) if t < Hh else pr(t - Hh))
    idx = [min(K, max(0, round(x))) for x in s]
    spr = max(abs(idx[(k + 1) % P_BILDER] - idx[k]) for k in range(P_BILDER))
    satt = lambda v: (sum(1 for x in v if x >= VMAX - 1e-9), sum(1 for x in v if x <= VMIN + 1e-9))
    if art == 'gleich':
        note = f"hin ×{komma(vh[0], 1)} / zurück ×{komma(vr[0], 1)}"
    elif Hh == Hr:
        note = f"hin/zurück ×{komma(min(vh), 1)}–×{komma(max(vh), 1)} · α {komma(ALPHA)}"
    else:
        note = f"hin ×{komma(min(vh), 1)}–{komma(max(vh), 1)} / zur. ×{komma(min(vr), 1)}–{komma(max(vr), 1)}"
    plaene.append(dict(titel=titel, note=note, H_hin=Hh, H_rueck=Hr, art=art, s=s, idx=idx, sprung_max=spr,
                       v_hin=[min(vh), max(vh)], v_rueck=[min(vr), max(vr)], C_hin=Ch, C_rueck=Cr,
                       satt_hin=satt(vh), satt_rueck=satt(vr),
                       mittel_hin=K / 24 / Hh, mittel_rueck=K / 24 / Hr))
    print(titel, note, 'Bereich', min(idx), max(idx), 'groesster Sprung', spr,
          'Sättigung hin (max,min)', satt(vh), 'zurück', satt(vr), flush=True)

# Aenderung je Ausgabebild (Gleichmaessigkeit), gemessen an c: Summe c ueber ueberstrichene Quellintervalle
def aenderung_je_bild(s):
    out = []
    for k in range(P_BILDER):
        a, b = sorted((s[k], s[(k + 1) % P_BILDER]))
        tot, x = 0.0, a
        while x < b - 1e-12:
            j = min(K - 1, int(x)); e = min(b, j + 1)
            tot += (e - x) * cs[j]; x = e
        out.append(tot)
    return out
for p in plaene:
    a = aenderung_je_bild(p['s'])
    # nur Wegmitten (ohne Rampen) bewerten
    mitte = [a[k] for k in range(P_BILDER) if R + 0.05 < k / FPS < p['H_hin'] - R - 0.05
             or p['H_hin'] + R + 0.05 < k / FPS < P - R - 0.05]
    mu = sum(mitte) / len(mitte)
    cv = math.sqrt(sum((x - mu) ** 2 for x in mitte) / len(mitte)) / mu
    p['aenderung_cv'] = cv
    print(p['titel'], 'Variationskoeffizient der Aenderung je Ausgabebild (Wegmitten):', round(cv, 3))

# ---------- Kacheln (ffv1, eine Periode) ----------
bytes_rgb = TW * TH * 3
q = run([FFMPEG, '-v', 'error', '-i', SRC, '-vf', f'setpts=N/24/TB,scale={TW}:{TH}:flags=lanczos',
         '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'])
assert len(q) == N24 * bytes_rgb
bilder = [q[i * bytes_rgb:(i + 1) * bytes_rgb] for i in range(N24)]
nuts = []
for i, p in enumerate(plaene):
    ziel = f"{ARB}/zeitumbildung-k{i + 1}.nut"
    run([FFMPEG, '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{TW}x{TH}', '-framerate', '30',
         '-i', '-', '-vf', 'format=yuv420p', '-c:v', 'ffv1', ziel], inp=b''.join(bilder[j] for j in p['idx']))
    nuts.append(ziel)
del q, bilder

def chrome_png(html, png, w, h):
    if os.path.exists(png): os.remove(png)
    profil = f"{LAB}/.profil-{os.getpid()}"
    url = 'data:text/html;charset=utf-8,' + urllib.parse.quote(html)
    chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    pr = subprocess.Popen([chrome, '--headless=new', '--disable-gpu', '--hide-scrollbars',
                           '--force-device-scale-factor=1', f'--user-data-dir={profil}',
                           f'--screenshot={png}', f'--window-size={w},{h}', url],
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        pr.wait(timeout=90)
    except subprocess.TimeoutExpired:
        pr.kill(); pr.wait()
    shutil.rmtree(profil, ignore_errors=True)
    if not os.path.exists(png):
        print('PNG fehlt', png); sys.exit(1)
    return png

FARBEN = ['#6cb4ff', '#ffb454', '#7bd88f', '#ff7aa2']
lab_html = ('<html><head><meta charset="utf-8"><style>html,body{margin:0;background:#141414}'
            '.w{display:flex}.c{width:240px;height:40px;box-sizing:border-box;padding:3px 7px;'
            'background:#141414;color:#fff;font-family:Helvetica,Arial,sans-serif;overflow:hidden;white-space:nowrap}'
            'b{display:block;font-size:15px;line-height:18px;font-weight:700}'
            'b s{display:inline-block;width:9px;height:9px;margin-right:6px;border-radius:2px;text-decoration:none}'
            'i{display:block;font-style:normal;font-size:11.5px;line-height:15px;color:#d8d8d8}</style></head>'
            '<body><div class="w">' + ''.join(
                f'<div class="c"><b><s style="background:{FARBEN[i]}"></s>{p["titel"]}</b><i>{p["note"]}</i></div>'
                for i, p in enumerate(plaene)) + '</div></body></html>')
png_lab = chrome_png(lab_html, f"{ARB}/zeitumbildung-beschriftung.png", TW * 4, BAR)

# ---------- Zeitkurven-PNG ----------
GW, GH = 960, 400
L, T, PW, PH = 56, 34, 640, 316       # Hauptfeld Quellbild ueber Ausgabezeit
L2, PW2 = L + PW + 36, 190             # Nebenfeld Bildaenderung c(k), gleiche Hochachse
def yq(x): return T + PH - x / K * PH
def xt(t): return L + t / P * PW
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{GW}" height="{GH}" font-family="Helvetica,Arial,sans-serif">',
       f'<rect width="{GW}" height="{GH}" fill="#141414"/>']
for sek in range(0, 11):
    svg.append(f'<line x1="{xt(sek):.1f}" y1="{T}" x2="{xt(sek):.1f}" y2="{T+PH}" stroke="#2a2a2a"/>')
    svg.append(f'<text x="{xt(sek):.1f}" y="{T+PH+16}" fill="#9a9a9a" font-size="11" text-anchor="middle">{sek}</text>')
for qb in (0, 60, 120, 180, 240):
    svg.append(f'<line x1="{L}" y1="{yq(qb):.1f}" x2="{L+PW}" y2="{yq(qb):.1f}" stroke="#2a2a2a"/>')
    svg.append(f'<line x1="{L2}" y1="{yq(qb):.1f}" x2="{L2+PW2}" y2="{yq(qb):.1f}" stroke="#2a2a2a"/>')
    svg.append(f'<text x="{L-8}" y="{yq(qb)+4:.1f}" fill="#9a9a9a" font-size="11" text-anchor="end">{qb}</text>')
svg.append(f'<text x="{L+PW/2}" y="{GH-8}" fill="#bdbdbd" font-size="12" text-anchor="middle">Ausgabezeit in s (eine Periode = 10,00 s = 300 Bilder)</text>')
svg.append(f'<text x="14" y="{T+PH/2}" fill="#bdbdbd" font-size="12" text-anchor="middle" transform="rotate(-90 14 {T+PH/2})">Quellbild (24 fps)</text>')
svg.append(f'<text x="{L}" y="20" fill="#eeeeee" font-size="14" font-weight="700">Dopamier mich! v2 · Quellbild über Ausgabezeit</text>')
for i, p in enumerate(plaene):
    pts = ' '.join(f'{xt(k / FPS):.1f},{yq(x):.1f}' for k, x in enumerate(p['s'] + [p['s'][0]]))
    svg.append(f'<polyline points="{pts}" fill="none" stroke="{FARBEN[i]}" stroke-width="1.8" stroke-linejoin="round"/>')
cmax = max(max(d), max(cs)) * 1.05
def xc(x): return L2 + x / cmax * PW2
svg.append(f'<polyline points="{" ".join(f"{xc(d[k]):.1f},{yq(k + 0.5):.1f}" for k in range(K))}" fill="none" stroke="#5a5a5a" stroke-width="1"/>')
svg.append(f'<polyline points="{" ".join(f"{xc(cs[k]):.1f},{yq(k + 0.5):.1f}" for k in range(K))}" fill="none" stroke="#e8e8e8" stroke-width="1.6"/>')
svg.append(f'<line x1="{L2}" y1="{T}" x2="{L2}" y2="{T+PH}" stroke="#555"/>')
svg.append(f'<text x="{L2}" y="20" fill="#eeeeee" font-size="12" font-weight="700">Bildänderung c(k)</text>')
svg.append(f'<text x="{L2+PW2/2}" y="{T+PH+16}" fill="#9a9a9a" font-size="11" text-anchor="middle">roh (grau) · geglättet (hell)</text>')
svg.append(f'<text x="{L2+PW2/2}" y="{T+PH+32}" fill="#9a9a9a" font-size="11" text-anchor="middle">α {komma(ALPHA)} · Klemmung ×1–×4 · Wende {komma(R,1)} s</text>')
for i, p in enumerate(plaene):
    yy = T + 14 + i * 16
    svg.append(f'<rect x="{L+8}" y="{yy-9}" width="14" height="4" fill="{FARBEN[i]}"/>')
    svg.append(f'<text x="{L+28}" y="{yy-3}" fill="#dddddd" font-size="11">{i+1} {p["titel"]} · {komma(p["H_hin"],1)} s / {komma(p["H_rueck"],1)} s</text>')
svg.append('</svg>')
png_kurve = chrome_png('<html><head><meta charset="utf-8"><style>html,body{margin:0;background:#141414}</style></head><body>'
                       + ''.join(svg) + '</body></html>', f"{OUT}/dopamier-zeitkurven.png", GW, GH)

# ---------- Kachelvideo ----------
GES = LOOPS * P_BILDER
gr = ["[4]split=4[l0][l1][l2][l3]"]
for k in range(4):
    gr.append(f"[l{k}]crop=240:40:{240*k}:0[c{k}]")
    gr.append(f"[{k}]loop=loop={LOOPS-1}:size={P_BILDER}:start=0,trim=end_frame={GES},setpts=N/30/TB,"
              f"pad=240:{TH+BAR}:0:{BAR}:color=0x141414[v{k}]")
    gr.append(f"[v{k}][c{k}]overlay=0:0[t{k}]")
gr.append("[t0][t1][t2][t3]hstack=inputs=4[out]")
ziel = f"{OUT}/dopamier-zeitumbildung.mp4"
args = [FFMPEG, '-y', '-v', 'error']
for f in nuts: args += ['-i', f]
run(args + ['-i', png_lab, '-filter_complex', ';'.join(gr), '-map', '[out]', '-r', '30', '-c:v', 'libx264',
            '-preset', 'slow', '-crf', '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', ziel])

def probe(f):
    return json.loads(run([FFPROBE, '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries',
                           'stream=width,height,nb_read_frames,duration,r_frame_rate,avg_frame_rate', '-show_entries',
                           'format=duration', '-of', 'json', f]))
pruef = {}
for f in nuts:
    s = probe(f)['streams'][0]
    pruef[os.path.basename(f)] = int(s['nb_read_frames'])
e = probe(ziel)
pruef['ziel'] = dict(e['streams'][0], format_dauer=e['format']['duration'])
# Periodizitaet am fertigen Video: Bild k gegen k+300 (Kodierrauschen), Bild k gegen k+150 (muss verschieden sein)
SW, SH = 96, (TH + BAR) * 96 // 960 // 2 * 2
rv = run([FFMPEG, '-v', 'error', '-i', ziel, '-vf', f'scale={SW*4}:{SH}:flags=area', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'])
m = SW * 4 * SH
fr = [rv[i:i + m] for i in range(0, len(rv), m)]
mad = lambda a, b: sum(abs(x - y) for x, y in zip(a, b)) / len(a)
per = [mad(fr[k], fr[k + P_BILDER]) for k in range(0, len(fr) - P_BILDER, 7)]
halb = [mad(fr[k], fr[k + P_BILDER // 2]) for k in range(0, len(fr) - P_BILDER // 2, 7)]
pruef['periode_mad_max'] = max(per); pruef['halbperiode_mad_mittel'] = sum(halb) / len(halb)
pruef['bilder_video'] = len(fr)
print('PRUEF', json.dumps(pruef, ensure_ascii=False))

json.dump(dict(quelle=SRC, n24=N24, th=TH, R=R, VMIN=VMIN, VMAX=VMAX, EPS=EPS, ALPHA=ALPHA, ALPHA_ROH=ALPHA_ROH,
               c05=c05, c95=c95, doppelbilder=doppel, d_roh=d, c_glatt=cs, pruef=pruef,
               kacheln=[{k: v for k, v in p.items() if k != 's'} for p in plaene],
               rechenzeit_s=time.time() - T0),
          open(f"{ARB}/zeitumbildung.json", 'w'), ensure_ascii=False, indent=1)
for f in nuts: os.remove(f)
os.remove(png_lab)
print('FERTIG', ziel, os.path.getsize(ziel), 'Rechenzeit', round(time.time() - T0, 1), 's')
print('alpha roh', round(ALPHA_ROH, 3), 'alpha', ALPHA, 'eps', round(EPS, 4), 'c05', round(c05, 3), 'c95', round(c95, 3), 'doppel', doppel)
