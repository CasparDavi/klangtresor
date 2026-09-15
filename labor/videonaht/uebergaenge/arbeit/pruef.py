import json, subprocess, sys
P = json.load(open('arbeit/plaene.json'))
OUT = 'pruef'
for p in P:
    k, Lf, h = p['kurz'], p['Lf'], p['h']
    f = f"{k}-uebergaenge.mp4"
    sets = {}
    for nr, per in ((1, 0), (2, 1)):
        s = Lf - h + per * Lf
        sets[f"naht{nr}"] = [s - h - 2, s - h // 2, s - 1, s, s + 1]
        sets[f"naht{nr}b"] = [s + 2, s + 3, s + h // 2, s + h - 1, s + h + 2]
    sets['mitte'] = [Lf // 3 + Lf]
    for name, fr in sets.items():
        sel = '+'.join(f"eq(n\\,{x})" for x in fr)
        sc = 'scale=720:-2' if name == 'mitte' else 'scale=360:-2'
        vf = f"select='{sel}',{sc},tile={len(fr)}x1"
        subprocess.run(['/usr/local/bin/ffmpeg', '-y', '-v', 'error', '-i', f, '-vf', vf, '-frames:v', '1',
                        f"{OUT}/{k}-{name}.png"], check=True)
        print(k, name, fr)
