import json, subprocess, sys
P = json.load(open('arbeit/plaene.json'))
nur = sys.argv[1:]
def frames(f, vf, w, hgt):
    raw = subprocess.run(['/usr/local/bin/ffmpeg','-v','error','-i',f,'-vf',vf,'-f','rawvideo','-pix_fmt','gray','-'],capture_output=True,check=True).stdout
    n = w*hgt
    return [raw[k:k+n] for k in range(0, len(raw), n)]
def mad(a,b): return sum(abs(x-y) for x,y in zip(a,b))/len(a)
for p in P:
    if nur and p['kurz'] not in nur: continue
    f = f"{p['kurz']}-uebergaenge.mp4"; Lf=p['Lf']; h=p['h']; H=p['th']+40
    W, HH = 72, (3*H)//10//2*2
    fr = frames(f, f"scale={W}:{HH}", W, HH)
    per = [mad(fr[k], fr[k+Lf]) for k in range(len(fr)-Lf)]
    print(p['kurz'], 'Bilder', len(fr), 'Periodenabweichung max', round(max(per),2), 'mittel', round(sum(per)/len(per),2))
    # je Kachel: Sprung zwischen Nachbarbildern um die Naht
    th = p['th']
    for t in range(9):
        x, y = 240*(t%3), H*(t//3)+40
        tf = frames(f, f"crop=240:{th}:{x}:{y},scale=48:-2", 48, (th*48//240)//2*2 if False else None) if False else None
    s = Lf - h
    for t in range(9):
        x, y = 240*(t%3), H*(t//3)+40
        hh = round(th*48/240/2)*2
        tf = frames(f, f"trim=end_frame={2*Lf},crop=240:{th}:{x}:{y},scale=48:{hh}", 48, hh)
        d = [mad(tf[k], tf[k+1]) for k in range(Lf, 2*Lf-1)]
        # Diff von Bild k nach k+1, Ausgabe fuer k = s-h-4 .. s+h+3 (zweite Periode)
        seg = ' '.join(f"{d[k]:.0f}" for k in range(s-h-4, min(Lf-1, s+h+4)))
        big = max(range(len(d)), key=lambda k: d[k])
        print(f"  {p['arten'][t]:11s} groesster Sprung bei Periodenbild {big}->{big+1} ({d[big]:.1f}); um Naht {s}: {seg}")
