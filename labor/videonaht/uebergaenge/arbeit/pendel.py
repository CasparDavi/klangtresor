#!/usr/bin/env python3
# Pendelprobe fuer "Dopamier mich! v2" (Laborprobe, Anfrage Caspar_D 15.09.2026).
# Kachel 1 Pendel hart, Kachel 2 Pendel weich (Sinus-Quellzeit), Kachel 3 Abbremsen aus bau.py.
import json, math, os, shutil, subprocess, sys, urllib.parse

HIER = os.path.dirname(os.path.abspath(__file__))
quelltext = open(HIER + '/bau.py').read()
quelltext = quelltext[:quelltext.rindex('\nmain()')]   # nur die Funktionen, kein Lauf
ns = {'__file__': HIER + '/bau.py'}
exec(compile(quelltext, 'bau.py', 'exec'), ns)
run, komma, ARB, OUT, LAB, FFMPEG = ns['run'], ns['komma'], ns['ARB'], ns['OUT'], ns['LAB'], ns['FFMPEG']
TW, BAR, FPS = ns['TW'], ns['BAR'], ns['FPS']

# Hinweg [A, B): 5 s mit der groessten Bildaenderung d(A, B-1) (Bildmittel der Bloecke,
# selbst gemessen ueber alle 120-Bilder-Fenster: Maximum bei A = 121, also bis zum Videoende).
A, B = 121, 241
L = B - A                      # 120 Quellbilder = 5 s
P_BILDER = 2 * L * FPS // 24   # Periode 2*(B-A) = 10 s = 300 Ausgabebilder
LOOPS = 3

p = ns['plan']('dopamier', 'Dopamier mich! v2', 'artwork.mp4', 'abbremsen')
ordner = f"{ARB}/{p['kurz']}-bremse"
k3 = f"{ARB}/pendel-k3.nut"
ns['kachel_abbremsen'](p, k3)   # legt auch alle Quellbilder q_%04d.png (24 fps, 240 breit) an
if B > p['n24']:
    print('B hinter Videoende'); sys.exit(1)

def hart(k):
    # Dreieck ueber die Periode: Spitzen A (k=0) und B-1 (k=P/2) je genau einmal.
    u = k / P_BILDER
    tri = 2 * u if u <= 0.5 else 2 - 2 * u
    return round(A + (L - 1) * tri)

def weich(k):
    return round(A + (L - 1) * (1 - math.cos(2 * math.pi * k / P_BILDER)) / 2)

def folge_schreiben(name, fn):
    z = f"{ARB}/pendel-{name}"
    shutil.rmtree(z, ignore_errors=True); os.makedirs(z)
    idx = [fn(k) for k in range(P_BILDER)]
    for k, q in enumerate(idx):
        shutil.copyfile(f"{ordner}/q_{q:04d}.png", f"{z}/o_{k:04d}.png")
    ziel = f"{ARB}/pendel-{name}.nut"
    run([FFMPEG, '-y', '-v', 'error', '-framerate', '30', '-i', f"{z}/o_%04d.png",
         '-vf', 'format=yuv420p', '-c:v', 'ffv1', ziel])
    shutil.rmtree(z, ignore_errors=True)
    return ziel, idx

k1, i1 = folge_schreiben('k1', hart)
k2, i2 = folge_schreiben('k2', weich)

# Umkehrstellen pruefen (zyklisch)
def nachbarn(idx, wert):
    n = len(idx)
    return [(k, idx[(k - 1) % n], idx[k], idx[(k + 1) % n]) for k in range(n) if idx[k] == wert]
print('hart Umkehr A  :', nachbarn(i1, A))
print('hart Umkehr B-1:', nachbarn(i1, B - 1))
print('weich an A  :', len(nachbarn(i2, A)), 'Bilder; an B-1:', len(nachbarn(i2, B - 1)), 'Bilder')
print('weich Bereich', min(i2), max(i2), ' hart Bereich', min(i1), max(i1))
sp1 = max(abs(i1[(k + 1) % P_BILDER] - i1[k]) for k in range(P_BILDER))
sp2 = max(abs(i2[(k + 1) % P_BILDER] - i2[k]) for k in range(P_BILDER))
print('groesster Quellsprung je Ausgabebild: hart', sp1, 'weich', sp2)

Lf3 = p['Lf']
P = P_BILDER / FPS
P3 = Lf3 / FPS
t_ = lambda s: f"{A/24:.2f}".replace('.', ',') + '–' + f"{B/24:.2f}".replace('.', ',') + ' s'
labels = [
    ('Pendel hart', f"Periode {komma(P)} s · Quelle {t_(0)}"),
    ('Pendel weich', f"Periode {komma(P)} s · Sinus, Enden auf 0"),
    ('Abbremsen', f"Periode {komma(P3)} s · nicht synchron"),
]

def beschriftung():
    html = ('<html><head><meta charset="utf-8"><style>html,body{margin:0;background:#111}'
            '.w{display:flex}.c{width:240px;height:40px;box-sizing:border-box;padding:3px 7px;'
            'background:#141414;color:#fff;font-family:Helvetica,Arial,sans-serif;overflow:hidden;white-space:nowrap}'
            'b{display:block;font-size:15px;line-height:18px;font-weight:700}'
            'i{display:block;font-style:normal;font-size:11.5px;line-height:15px;color:#d8d8d8}</style></head>'
            '<body><div class="w">' + ''.join(f'<div class="c"><b>{a}</b><i>{b}</i></div>' for a, b in labels)
            + '</div></body></html>')
    png = f"{ARB}/pendel-beschriftung.png"
    if os.path.exists(png): os.remove(png)
    profil = f"{LAB}/.profil-{os.getpid()}"
    url = 'data:text/html;charset=utf-8,' + urllib.parse.quote(html)
    chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    pr = subprocess.Popen([chrome, '--headless=new', '--disable-gpu', '--hide-scrollbars',
                           '--force-device-scale-factor=1', f'--user-data-dir={profil}',
                           f'--screenshot={png}', f'--window-size={240*3},40', url],
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        pr.wait(timeout=90)
    except subprocess.TimeoutExpired:
        pr.kill(); pr.wait()
    shutil.rmtree(profil, ignore_errors=True)
    if not os.path.exists(png):
        print('Beschriftung fehlt'); sys.exit(1)
    return png

png = beschriftung()
GES = LOOPS * P_BILDER
th = p['th']
g = ["[3]split=3[l0][l1][l2]"]
for k, lf in enumerate((P_BILDER, P_BILDER, Lf3)):
    n = math.ceil(GES / lf)
    g.append(f"[l{k}]crop=240:40:{240*k}:0[c{k}]")
    g.append(f"[{k}]loop=loop={n-1}:size={lf}:start=0,trim=end_frame={GES},setpts=N/30/TB,"
             f"pad=240:{th+BAR}:0:{BAR}:color=0x141414[v{k}]")
    g.append(f"[v{k}][c{k}]overlay=0:0[t{k}]")
g.append("[t0][t1][t2]hstack=inputs=3[out]")
ziel = f"{OUT}/dopamier-pendel.mp4"
run([FFMPEG, '-y', '-v', 'error', '-i', k1, '-i', k2, '-i', k3, '-i', png, '-filter_complex', ';'.join(g),
     '-map', '[out]', '-r', '30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-pix_fmt', 'yuv420p',
     '-movflags', '+faststart', ziel])

def probe(f):
    return json.loads(run(['/usr/local/bin/ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0',
                           '-show_entries', 'stream=width,height,nb_read_frames,duration,r_frame_rate,pix_fmt,codec_name',
                           '-show_entries', 'format=duration', '-of', 'json', f]))
for f in (k1, k2, k3):
    s = probe(f)['streams'][0]
    print(os.path.basename(f), 'bilder', s['nb_read_frames'], '=', int(s['nb_read_frames']) / 30, 's')
e = probe(ziel)
print('ZIEL', ziel, e['streams'][0], e['format'], os.path.getsize(ziel))
json.dump(dict(A=A, B=B, P_bilder=P_BILDER, Lf3=Lf3, bremse=p['bremse'], i_hart=i1, i_weich=i2, labels=labels),
          open(f"{ARB}/pendel.json", 'w'), ensure_ascii=False, indent=1)
shutil.rmtree(ordner, ignore_errors=True)
