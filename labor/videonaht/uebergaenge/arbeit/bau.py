#!/usr/bin/env python3
# Kachelvideos der Uebergaenge (Laborprobe, nicht Hausbestand).
import json, gzip, math, os, shutil, statistics, subprocess, sys, urllib.parse

ROOT = '/Volumes/Extreme_SSD/Entwicklung/SunoArchive'
LAB = ROOT + '/labor/videonaht'
OUT = LAB + '/uebergaenge'
ARB = OUT + '/arbeit'
FFMPEG = '/usr/local/bin/ffmpeg'
FPS = 30
TW = 240
BAR = 40

VIDEOS = [
    ('dopamier', 'Dopamier mich! v2', 'artwork.mp4', 'abbremsen'),
    ('lenore', 'Lenore', 'artwork.mp4', 'lumawisch'),
    ('erlkoenig', "Erlkönigs Tochter '25 v2 (OLD MASTERS REINTERPRETED)", 'artwork.mp4', 'weiss'),
    ('glut', 'Glut und Eis - Die Braut von Corinth', 'artwork.sprung.mp4', 'abbremsen'),
]

def run(args):
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode:
        print(' '.join(args)); print(r.stderr[-3000:]); sys.exit(1)
    return r.stdout

def komma(x, n=2):
    return f'{x:.{n}f}'.replace('.', ',')

erg = json.load(open(LAB + '/ergebnis.json'))
kat = json.load(gzip.open(ROOT + '/library/katalog.json.gz'))

def takt(id_):
    sc = kat['songs'][id_]['schlaege']
    e = [t for t, z in sc if z == 1]
    return statistics.median([b - a for a, b in zip(e, e[1:])])

LUMA = ("st(0,a0(X*if(PLANE,2,1),Y*if(PLANE,2,1))/255);"
        "st(1,clip(((1-P)*1.25-ld(0))/0.25,0,1));A*(1-ld(1))+B*ld(1)")

# Kreuzzoom (in yuv444p, damit alle Ebenen gleich gross sind). p = 1-P laeuft 0 -> 1.
ZOOM = ("st(0,1-P);st(1,ld(0)*ld(0)*(3-2*ld(0)));"
        "st(2,1+0.6*ld(1));st(3,1.6-0.6*ld(1));"
        "st(4,clip((ld(0)-0.3)/0.4,0,1));st(4,ld(4)*ld(4)*(3-2*ld(4)));"
        "st(5,W/2+(X-W/2)/ld(2));st(6,H/2+(Y-H/2)/ld(2));"
        "st(7,W/2+(X-W/2)/ld(3));st(8,H/2+(Y-H/2)/ld(3));"
        "if(eq(PLANE,0),a0(ld(5),ld(6)),if(eq(PLANE,1),a1(ld(5),ld(6)),a2(ld(5),ld(6))))*(1-ld(4))+"
        "if(eq(PLANE,0),b0(ld(7),ld(8)),if(eq(PLANE,1),b1(ld(7),ld(8)),b2(ld(7),ld(8))))*ld(4)")

def plan(kurz, titel, datei, neunte):
    v = next(x for x in erg['videos'] if x['titel'] == titel and x['datei'] == datei)
    b = v['nahtsuche']['bester']
    i, j = b['i'], b['j']
    src = f"{ROOT}/library/songs/{v['id']}/{datei}"
    q = v['quelle']
    th = round(TW * q['hoehe'] / q['breite'] / 2) * 2
    T = takt(v['id'])
    D = min(1.2, max(0.4, T / 2))
    d = max(2, round(D * FPS / 2) * 2)       # gerade Bildzahl, D/2 ganzzahlig
    h = d // 2
    n24 = v['bilder']
    n30 = math.ceil(n24 * FPS / 24)
    Ki, Kj = math.ceil(i * FPS / 24), math.ceil(j * FPS / 24)
    pad_vor = max(0, h - Ki)
    pad_nach = max(0, Kj + h - n30)
    return dict(kurz=kurz, titel=titel, datei=datei, neunte=neunte, v=v, i=i, j=j, src=src, th=th,
                T=T, D=D, d=d, h=h, n24=n24, Ki=Ki + pad_vor, Kj=Kj + pad_vor, Lf=Kj - Ki,
                pad_vor=pad_vor, pad_nach=pad_nach, quotient=v['quotient_bester_schnitt'])

def normieren(p):
    """Quelle -> 30 fps (Bild k = Quellbild floor(k*24/30)), Kachelgroesse, ggf. Randbild gehalten."""
    p['norm'] = f"{ARB}/{p['kurz']}-norm.nut"
    vf = f"setpts=N/24/TB,fps=30:round=up,scale={TW}:{p['th']}:flags=lanczos,format=yuv420p"
    if p['pad_vor'] or p['pad_nach']:
        vf += f",tpad=start={p['pad_vor']}:stop={p['pad_nach']}:start_mode=clone:stop_mode=clone"
    run([FFMPEG, '-y', '-v', 'error', '-i', p['src'], '-vf', vf, '-an', '-c:v', 'ffv1', p['norm']])

def trim(a, b, lab_in, lab_out):
    return f"[{lab_in}]trim=start_frame={a}:end_frame={b},setpts=N/30/TB[{lab_out}]"

def kachel_graph(p, art):
    Ki, Kj, h, d, Lf = p['Ki'], p['Kj'], p['h'], p['d'], p['Lf']
    if art in ('hart', 'blitz', 'unschaerfe'):
        g = ["[0]split=2[s0][s1]", trim(Ki + h, Kj, 's0', 'a'), trim(Ki, Ki + h, 's1', 'b'),
             "[a][b]concat=n=2:v=1[p0]"]
        seam = Lf - h                      # erstes eingehendes Bild
        if art == 'hart':
            g.append("[p0]null[out]")
        elif art == 'blitz':
            a = f"if(eq(N,{seam}),1,if(eq(N,{seam+1}),0.55,if(eq(N,{seam+2}),0.25,0)))"
            g.append(f"[p0]geq=lum='lum(X,Y)+(255-lum(X,Y))*{a}':cb='128+(cb(X,Y)-128)*(1-{a})':cr='128+(cr(X,Y)-128)*(1-{a})'[out]")
        else:
            cmd = f"{ARB}/{p['kurz']}-unschaerfe.cmd"
            with open(cmd, 'w') as f:
                for u in range(Lf):
                    if seam - h <= u < seam:
                        s = math.sin(math.pi / 2 * (u - (seam - h) + 1) / h) ** 2
                    elif seam <= u < Lf:
                        s = math.sin(math.pi / 2 * (Lf - u) / h) ** 2
                    else:
                        s = 0
                    sig = max(0.01, 22 * s)
                    # sigmaV mitsetzen: gblur uebernimmt sigma nur beim Start in sigmaV,
                    # sonst bleibt die Unschaerfe rein waagerecht (Streifen).
                    f.write(f"{max(0,(u-0.25)/30):.5f} gblur sigma {sig:.3f}, gblur sigmaV {sig:.3f};\n")
            g.append(f"[p0]sendcmd=f='{cmd}',gblur=sigma=0.01:steps=3[out]")
        return ';'.join(g)
    # Zoom: nicht xfade zoomin - das zieht A bis auf den Mittelpunkt zusammen und zeigt
    # ein Drittel des Fensters lang eine einfarbige Flaeche. Stattdessen Kreuzzoom:
    # A vergroessert sich 1 -> 1,6, B kommt mit 1,6 und faellt auf 1, Mischung in der Mitte.
    trans = {'blende': 'fade', 'schwarz': 'fadeblack', 'zoom': 'custom', 'wisch': 'smoothleft',
             'pixel': 'pixelize', 'weiss': 'fadewhite', 'lumawisch': 'custom'}[art]
    extra = f":expr='{LUMA}'" if art == 'lumawisch' else (f":expr='{ZOOM}'" if art == 'zoom' else '')
    vor, nach = (",format=yuv444p", ",format=yuv420p") if art == 'zoom' else ("", "")
    g = ["[0]split=3[s0][s1][s2]", trim(Ki + h, Kj - h, 's0', 'm'), trim(Kj - h, Kj + h, 's1', 'to0'),
         trim(Ki - h, Ki + h, 's2', 'ti0'), f"[to0]null{vor}[to]", f"[ti0]null{vor}[ti]",
         f"[to][ti]xfade=transition={trans}:duration={d/30:.6f}:offset=0{extra}{nach}[t]",
         "[m][t]concat=n=2:v=1[out]"]
    return ';'.join(g)

def kachel_abbremsen(p, name):
    """sin²-Abbremsen auf Standbild j-1, Blende zu Standbild i, Anlauf; Periode Lf Bilder."""
    i, j, d, h, Lf, kurz = p['i'], p['j'], p['d'], p['h'], p['Lf'], p['kurz']
    Bf = round(d / 3 / 2) * 2
    Rf = (d - Bf) // 2
    ordner = f"{ARB}/{kurz}-bremse"
    shutil.rmtree(ordner, ignore_errors=True); os.makedirs(ordner)
    run([FFMPEG, '-y', '-v', 'error', '-i', p['src'], '-vf',
         f"setpts=N/24/TB,scale={TW}:{p['th']}:flags=lanczos", '-start_number', '0', f"{ordner}/q_%04d.png"])
    N = Lf - Bf
    R = Rf / 30
    Tend = (N - 1) / 30
    def g(t):
        if t < R: return math.sin(math.pi / 2 * t / R) ** 2
        if t > Tend - R: return math.sin(math.pi / 2 * (Tend - t) / R) ** 2
        return 1.0
    steps = 4000
    G = [0.0]
    for k in range(steps):
        t = Tend * (k + 0.5) / steps
        G.append(G[-1] + g(t) * Tend / steps)
    S = (j - 1 - i) / 24
    c = S / G[-1]
    folge = []   # je Periodenbild: ('q', index) oder ('b', gewicht)
    for qn in range(N):
        t = qn / 30
        s = c * G[round(t / Tend * steps)] if Tend > 0 else 0
        folge.append(('q', min(j - 1, max(i, i + round(s * 24)))))
    for k in range(Bf):
        folge.append(('b', (k + 1) / (Bf + 1)))
    # drehen: Blendenmitte auf Lf-h legen (wie die Naht der anderen Kacheln)
    start = Lf - h + Bf // 2          # Ausgabeposition des ersten Anlaufbilds
    periode = [None] * Lf
    for k, e in enumerate(folge):
        periode[(start + k) % Lf] = e
    for k in range(Bf):
        w = (k + 1) / (Bf + 1)
        run([FFMPEG, '-y', '-v', 'error', '-i', f"{ordner}/q_{j-1:04d}.png", '-i', f"{ordner}/q_{i:04d}.png",
             '-filter_complex', f"[0][1]blend=all_expr='A*{1-w:.5f}+B*{w:.5f}'", f"{ordner}/b_{k}.png"])
    for u, e in enumerate(periode):
        quelle = f"{ordner}/q_{e[1]:04d}.png" if e[0] == 'q' else f"{ordner}/b_{round(e[1]*(Bf+1))-1}.png"
        shutil.copyfile(quelle, f"{ordner}/o_{u:04d}.png")
    run([FFMPEG, '-y', '-v', 'error', '-framerate', '30', '-i', f"{ordner}/o_%04d.png",
         '-vf', 'format=yuv420p', '-c:v', 'ffv1', name])
    p['bremse'] = dict(c=c, Bf=Bf, Rf=Rf, folge_min=min(e[1] for e in folge if e[0] == 'q'),
                       folge_max=max(e[1] for e in folge if e[0] == 'q'))

def beschriftungen(plaene):
    zeilen = []
    for p in plaene:
        sp = []
        for titel, note in p['labels']:
            sp.append(f'<div class="c"><b>{titel}</b><i>{note}</i></div>')
        zeilen.append('<div class="col">' + ''.join(sp) + '</div>')
    html = ('<html><head><meta charset="utf-8"><style>html,body{margin:0;background:#111}'
            '.w{display:flex}.col{width:240px}.c{width:240px;height:40px;box-sizing:border-box;padding:3px 7px;'
            'background:#141414;color:#fff;font-family:Helvetica,Arial,sans-serif;overflow:hidden;white-space:nowrap}'
            'b{display:block;font-size:15px;line-height:18px;font-weight:700}'
            'i{display:block;font-style:normal;font-size:11.5px;line-height:15px;color:#d8d8d8}</style></head>'
            '<body><div class="w">' + ''.join(zeilen) + '</div></body></html>')
    png = f"{ARB}/beschriftung.png"
    profil = f"{LAB}/.profil-{os.getpid()}"
    url = 'data:text/html;charset=utf-8,' + urllib.parse.quote(html)
    chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    pr = subprocess.Popen([chrome, '--headless=new', '--disable-gpu', '--hide-scrollbars',
                           '--force-device-scale-factor=1', f'--user-data-dir={profil}',
                           f'--screenshot={png}', f'--window-size={240*len(plaene)},{40*9}', url],
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        pr.wait(timeout=90)
    except subprocess.TimeoutExpired:
        pr.kill(); pr.wait()
    shutil.rmtree(profil, ignore_errors=True)
    if not os.path.exists(png):
        print('Beschriftung fehlt'); sys.exit(1)
    return png

def main():
    nur = sys.argv[1:]
    plaene = [plan(*x) for x in VIDEOS]
    ARTEN = ['hart', 'blitz', 'blende', 'schwarz', 'unschaerfe', 'zoom', 'wisch', 'pixel']
    for p in plaene:
        D = p['d'] / 30
        vor = ' · Vorlauf Standbild' if p['pad_vor'] else ''
        Dt = f"½ Takt = {komma(D)} s"
        p['labels'] = [
            ('harter Schnitt', f"kein Übergang · Q {komma(p['quotient'],1)}"),
            ('Schnitt + Blitz', '3 Bilder weiß, abklingend'),
            ('Blende', Dt + vor),
            ('durch Schwarz', Dt + vor),
            ('Unschärfe', Dt + ' · Tausch in der Mitte'),
            ('Kreuzzoom', Dt + vor),
            ('Wisch', Dt + vor),
            ('Pixel', Dt + vor),
        ]
        if p['neunte'] == 'abbremsen':
            Bf = round(p['d'] / 3 / 2) * 2
            p['labels'].append(('Abbremsen', 'sin² auf 0 · Blende {} s'.format(komma(Bf / 30))))
        elif p['neunte'] == 'lumawisch':
            p['labels'].append(('Luma-Wisch', 'Dunkles zuerst · ' + komma(D) + ' s' + vor))
        else:
            p['labels'].append(('Weiß', Dt + vor))
        p['arten'] = ARTEN + [p['neunte']]
    for p in plaene:
        if nur and p['kurz'] not in nur: continue
        print(p['kurz'], 'i', p['i'], 'j', p['j'], 'takt', round(p['T'], 3), 'd', p['d'], 'Lf', p['Lf'],
              'Ki', p['Ki'], 'Kj', p['Kj'], 'pad', p['pad_vor'], p['pad_nach'], 'th', p['th'], flush=True)
        normieren(p)
        for k, art in enumerate(p['arten']):
            name = f"{ARB}/{p['kurz']}-k{k+1}.nut"
            if art == 'abbremsen':
                kachel_abbremsen(p, name)
                b = p['bremse']
                p['labels'][8] = ('Abbremsen', f"sin² auf 0 · Mitte ×{komma(b['c'])}")
            else:
                # Ein Filterfaden: xfade custom rechnet in Scheiben parallel, die st()/ld()-Speicher
                # des Ausdrucks teilen sich aber alle Faeden - sonst Rauschen (Kreuzzoom, Luma-Wisch).
                run([FFMPEG, '-y', '-v', 'error', '-filter_complex_threads', '1', '-i', p['norm'],
                     '-filter_complex', kachel_graph(p, art),
                     '-map', '[out]', '-c:v', 'ffv1', name])
            nb = run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries',
                      'stream=nb_read_frames', '-of', 'csv=p=0', name]).strip()
            print('  kachel', k + 1, art, 'bilder', nb, flush=True)
            if int(nb) != p['Lf']:
                print('  FALSCHE PERIODE', nb, p['Lf']); sys.exit(1)
    png = beschriftungen(plaene)
    for col, p in enumerate(plaene):
        if nur and p['kurz'] not in nur: continue
        n = max(3, 30 * FPS // p['Lf'])
        args = [FFMPEG, '-y', '-v', 'error']
        for k in range(9):
            args += ['-i', f"{ARB}/{p['kurz']}-k{k+1}.nut"]
        args += ['-i', png]
        g = [f"[9]split=9" + ''.join(f"[l{k}]" for k in range(9))]
        for k in range(9):
            g.append(f"[l{k}]crop=240:40:{240*col}:{40*k}[c{k}]")
            g.append(f"[{k}]loop=loop={n-1}:size={p['Lf']}:start=0,setpts=N/30/TB,"
                     f"pad=240:{p['th']+BAR}:0:{BAR}:color=0x141414[v{k}]")
            g.append(f"[v{k}][c{k}]overlay=0:0[t{k}]")
        H = p['th'] + BAR
        lay = '|'.join(f"{240*(k%3)}_{H*(k//3)}" for k in range(9))
        g.append(''.join(f"[t{k}]" for k in range(9)) + f"xstack=inputs=9:layout={lay}[out]")
        ziel = f"{OUT}/{p['kurz']}-uebergaenge.mp4"
        run(args + ['-filter_complex', ';'.join(g), '-map', '[out]', '-r', '30', '-c:v', 'libx264',
                    '-preset', 'slow', '-crf', '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', ziel])
        info = run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries',
                    'stream=width,height,nb_read_frames,duration', '-of', 'json', ziel])
        p['n'] = n
        print('FERTIG', ziel, n, 'Perioden', json.loads(info)['streams'][0], os.path.getsize(ziel), flush=True)
    json.dump([{k: p[k] for k in p if k not in ('v',)} for p in plaene], open(f"{ARB}/plaene.json", 'w'),
              ensure_ascii=False, indent=1, default=str)

main()
