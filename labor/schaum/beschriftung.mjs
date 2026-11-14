// PRUEFSTAND FUER DIE BESCHRIFTUNG DES KLANGSCHAUMS (14.11.2026)
//
// Caspar_D: „bau einen Prüfstand, du hast Zeit". Ohne Kennzahl ist jede Aenderung an placeLabel Geschmackssache;
// mit ihr hat jede eine Zahl — so wie beim Hitstrom, wo die Zahl der gesetzten Namen zweimal vor einer
// Verschlimmbesserung bewahrt hat.
//
//   node labor/schaum/beschriftung.mjs [http://127.0.0.1:8788]
//   node labor/schaum/beschriftung.mjs --bild stand.png     zusaetzlich ein Bild des gelegten Schaums
//   node labor/schaum/beschriftung.mjs --ohne-ausweichen    das Bild weicht dem Zellnamen NICHT aus (zum Vergleichen)
//
// WAS ER MISST, je Lauf ueber Caspar_Ds echten Bestand:
//   Namen          wie viele Zellen ihren Namen tragen (von allen Zellen)
//   Schrift        mittlere Schriftgroesse der gesetzten Namen
//   Lage           Mitte des Namens in der Zelle, 0 = ganz oben, 1 = ganz unten
//                  (Caspar_D: „möglichst weit unten beschriften")
//   Rest           Zellflaeche UNTER dem Namen, als Anteil der Zelle
//                  (Caspar_D: „unter dem text möglichst wenig Zellfläche")
//   Gesicht        Zellen mit Gesicht und Namen, und bei wie vielen davon der Name auf dem Gesicht liegt
//                  (Caspar_D: „Gesichtsüberdeckungsvermeidung sollte aktiv sein ... der Text liegt manchmal drüber")
//
// WIE: nichts ist eingebacken. Karte, Werkverzeichnis und Gesichter kommen zur Laufzeit ueber die API, die
// Schaum-Engine und render.js aus web/klangschaum/, der Tintenapparat aus web/index.html (dort steht er, weil ihn
// auch die Oberflaeche braucht). Daraus baut das Werkzeug eine Seite im Scratchpad und misst sie in einem
// headless Chrome — derselbe Weg, den die App geht, nur ohne App.
//
// GEMESSENE STAENDE (900 x 620 Punkte, Gliederung „Klang", Mass Abrufe, 346 Zellen):
//   1.1.8                                             246 Namen · Lage 0,586 · Rest 21,2 % · 78 von 133 Gesichtern verdeckt
//   + Luft 0,12 statt 0,30                            250 Namen · Lage 0,645 · Rest 14,6 % · 63
//   + Bild weicht dem Namen aus (Gewicht 15)          250 Namen · Lage 0,645 · Rest 14,6 % · 36
//   + Schmalschnitt 85 %                              261 Namen · Lage 0,686 · Rest 10,6 % · 33

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..', '..');
const TRESOR = process.argv.find(a => a.startsWith('http')) || 'http://127.0.0.1:8788';
const BILD = (() => { const i = process.argv.indexOf('--bild'); return i > 0 ? process.argv[i + 1] : null; })();
const AUSWEICHEN = process.argv.includes('--ohne-ausweichen') ? 0 : 15;   /* Gewicht wie in web/index.html */
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BREITE = 900, VERHAELTNIS = 0.62;

if (!fs.existsSync(CHROME)) { console.error('Chrome nicht gefunden: ' + CHROME); process.exit(2); }

/* Der Tintenapparat steht in web/index.html (die Oberflaeche braucht ihn auch) - von dort ausschneiden. */
function tintenapparat() {
  const s = fs.readFileSync(path.join(WURZEL, 'web/index.html'), 'utf8');
  const a = s.indexOf('const schriftMasseMerk');
  const e = s.indexOf('/* Bildschirmpixel je Schaum-Einheit');
  if (a < 0 || e < 0 || e <= a) throw new Error('Tintenapparat in web/index.html nicht gefunden');
  return s.slice(a, e);
}

const holen = async (pfad) => {
  const r = await fetch(TRESOR + pfad);
  if (!r.ok) throw new Error(pfad + ' → HTTP ' + r.status);
  return r.json();
};

console.log('Hole Karte, Werkverzeichnis und Gesichter von ' + TRESOR + ' …');
const [karte, index, gesichter] = await Promise.all([holen('/api/karte'), holen('/api/index'), holen('/api/gesichter')]);

const arbeit = fs.mkdtempSync(path.join(os.tmpdir(), 'schaum-pruefstand-'));
for (const d of fs.readdirSync(path.join(WURZEL, 'web/klangschaum')))
  if (d.endsWith('.js')) fs.copyFileSync(path.join(WURZEL, 'web/klangschaum', d), path.join(arbeit, d));
fs.writeFileSync(path.join(arbeit, 'karte.json'), JSON.stringify(karte));
fs.writeFileSync(path.join(arbeit, 'index.json'), JSON.stringify(index));
fs.writeFileSync(path.join(arbeit, 'gesichter.json'), JSON.stringify(gesichter));

fs.writeFileSync(path.join(arbeit, 'pruefstand.html'), seite(tintenapparat(), AUSWEICHEN));

const bildArgs = BILD ? ['--window-size=1250,860', '--screenshot=' + path.join(arbeit, 'bild.png')] : [];
const roh = execFileSync(CHROME, ['--headless', '--disable-gpu', '--mute-audio', '--no-first-run',
  '--allow-file-access-from-files', '--user-data-dir=' + path.join(arbeit, 'profil'),
  ...bildArgs, '--virtual-time-budget=400000', '--dump-dom', 'file://' + path.join(arbeit, 'pruefstand.html')],
  { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });

const m = roh.match(/<pre id="zahlen">([\s\S]*?)<\/pre>/);
if (!m) { console.error('Der Prüfstand hat nichts gemeldet. Arbeitsordner: ' + arbeit); process.exit(1); }
const z = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
if (z.fehler) { console.error('FEHLER im Prüfstand: ' + z.fehler); process.exit(1); }

const p = (x, n = 0) => String(typeof x === 'number' ? x.toFixed(n) : x);
console.log('');
console.log('  ' + BREITE + ' × ' + Math.round(BREITE * VERHAELTNIS) + ' Punkte · Gliederung „Klang" · Maß Abrufe'
  + (AUSWEICHEN ? '' : '  ·  OHNE Ausweichen vor dem Namen'));
console.log('');
console.log('  Zellen                    ' + z.zellen);
console.log('  davon beschriftet         ' + z.namen + '   (' + p(100 * z.namen / z.zellen, 1) + ' %)');
console.log('  Schrift im Mittel         ' + p(z.schrift, 2) + ' px');
console.log('  Zeilen je Name            ' + Object.entries(z.zeilig).map(([k, v]) => k + ': ' + v).join(' · '));
console.log('  davon am Satzzeichen      ' + z.fuge + ' von ' + z.mehrzeilig + ' mehrzeiligen');
console.log('');
console.log('  Lage in der Zelle         ' + p(z.lage, 3) + '   (0 = oben, 1 = unten)');
console.log('    tief (über 0,7)         ' + z.tief);
console.log('    oben (unter 0,5)        ' + z.oben);
console.log('  Zellfläche unter dem Text ' + p(100 * z.rest, 1) + ' %');
console.log('    mehr als 25 %           ' + z.viel + ' Namen');
console.log('');
console.log('  Zellen mit Gesicht        ' + z.mitGesicht);
console.log('    Name auf dem Gesicht    ' + z.drueber + '   (' + p(100 * z.drueber / Math.max(1, z.mitGesicht), 0) + ' %, im Mittel '
  + p(100 * z.ueMittel, 0) + ' % der Gesichtsfläche)');
console.log('');

if (BILD) { fs.copyFileSync(path.join(arbeit, 'bild.png'), BILD); console.log('  Bild: ' + BILD); }
fs.rmSync(arbeit, { recursive: true, force: true });

/* ------------------------------------------------------------------ */
function seite(apparat, ausweichen) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#0c0c0d;color:#9aa0a8;font:12px system-ui,sans-serif}
#w svg{display:block;width:1200px;height:auto}
pre{margin:8px 14px;font:11px ui-monospace,monospace;color:#777}
</style></head><body><div id="w"></div><pre id="zahlen">{}</pre>
<script>
${apparat}
</script>
<script type="module">
import { grossLegen } from './grossschaum.js';
import * as R from './render.js';
const melde = (o) => { document.getElementById('zahlen').textContent = JSON.stringify(o); };
try {
  const [karte, index, ges] = await Promise.all([
    fetch('./karte.json').then(r => r.json()),
    fetch('./index.json').then(r => r.json()),
    fetch('./gesichter.json').then(r => r.json()),
  ]);
  const liste = Array.isArray(index) ? index : (index.songs || index.titel || index.eintraege || []);
  const lage = new Map((karte.songs || []).map(p => [p.id, p]));
  const gname = new Map((karte.gruppen || []).map(g => [g.nr, g.name]));
  /* Gliederung „Klang" (Stilgruppe / Genre), Maß Abrufe - wie die Oberfläche sie als Erstes zeigt */
  const zeilen = [];
  for (const s of liste) {
    if (s.fremd) continue;
    const w = s.plays || s.abrufe || 0; if (!(w > 0)) continue;
    const p = lage.get(s.id);
    zeilen.push({ gruppe: p && p.gruppe != null ? (gname.get(p.gruppe) || ('Gruppe ' + p.gruppe)) : 'ohne Stil',
                  genre: (p && p.genre) || '', titel: s.titel || '—', id: s.id, w: String(w) });
  }
  const W = ${BREITE}, H = Math.round(${BREITE} * ${VERHAELTNIS});
  const res = await grossLegen(zeilen, { levels: ['gruppe', 'genre', 'row'], weight: 'w', leafName: 'titel' },
                               { width: W, height: H, method: 'foam', minArea: 0, minShare: 0 }, {});

  /* ab hier wie web/index.html (schaumZeichnen) */
  const FAM = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const pxJeE = 0.6;                                   /* schaumPxJeEinheit deckelt dort auf 0,6 */
  const lw = document.createElement('canvas').getContext('2d');
  const textBreite = (t, fs, g = 400) => { const px = Math.max(1, fs * pxJeE); lw.font = g + ' ' + px.toFixed(2) + 'px ' + FAM; return lw.measureText(t).width / px; };
  const ohneKlammern = (t) => { let s = String(t || ''), v;
    do { v = s; s = s.replace(/\\s*[([][^()[\\]]*[)\\]]/g, ''); } while (s !== v);
    s = s.replace(/\\s*[([][^)\\]]*$/, '').replace(/\\s+/g, ' ').replace(/\\s*[-\\u2013\\u2014:;,]\\s*$/, '').trim();
    return s || String(t || '').trim(); };
  const kurzZahl = new Map();
  for (const k of res.leaves) { const kz = ohneKlammern(k.name); kurzZahl.set(kz, (kurzZahl.get(kz) || 0) + 1); }
  const zellName = (k) => { const kz = ohneKlammern(k.name); return kurzZahl.get(kz) > 1 ? k.name : kz; };
  const tinte = schaumNamenTinte(pxJeE, FAM);

  const namensBox = new Map();
  const svg = R.renderSVG(res, { pad: 0, cushion: 0, gutters: [3.2, 2.0, 1.2, 0.7, 0.35],
    labelLevel: 2, labelSizes: [4, 22], labelLeading: schaumZeilenabstand(FAM) || 1.1,
    labelDrop: 0.12, labelInk: tinte, labelUnten: () => true, labelName: zellName,
    labelBox: (k, b) => namensBox.set(k, [b[0], H - b[3], b[2], H - b[1]]),
    measureText: textBreite, colourOf: () => '#2a2a2e' });
  document.getElementById('w').innerHTML = svg;

  /* ---- messen ---- */
  const flaeche = (pts) => { let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]); return Math.abs(a / 2); };
  const unterhalb = (pts, yy) => { const out = [];
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const A = pts[j], B = pts[i];
      const dA = A[1] >= yy, dB = B[1] >= yy;
      if (dA) out.push(A);
      if (dA !== dB) { const t = (yy - A[1]) / ((B[1] - A[1]) || 1e-9); out.push([A[0] + t * (B[0] - A[0]), yy]); } }
    return out.length >= 3 ? flaeche(out) : 0; };
  const drin = (pts, p) => { let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j];
      if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / ((b[1] - a[1]) || 1e-9) + a[0]) c = !c; }
    return c; };
  const zellen = res.leaves.filter(k => k.outline).map(k => {
    const pts = k.outline.map(p => [p[0], H - p[1]]);
    let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
    for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); }
    return { k, pts, x0, x1, y0, y1, A: flaeche(pts) }; });

  /* dieselbe Bildplatzierung wie die Oberfläche (schaumBildPlatz), damit die Gesichter dort landen, wo sie
     wirklich landen - samt dem Ausweichen vor dem Zellnamen (Gewicht 15) */
  const GES = ges.bilder || {}, SCHW = ges.schwelle || 0.5;
  const fokusVon = (e) => { if (!e || !(e.w > 0) || !(e.h > 0)) return null;
    const fl = (x) => (x[2] - x[0]) * (x[3] - x[1]), g = (e.g || []).filter(x => x[4] >= SCHW);
    if (!g.length) return null;
    const gross = Math.max(...g.map(fl)), wichtig = g.filter(x => fl(x) >= 0.25 * gross);
    const f = [Math.min(...wichtig.map(x => x[0])), Math.min(...wichtig.map(x => x[1])),
               Math.max(...wichtig.map(x => x[2])), Math.max(...wichtig.map(x => x[3]))];
    f.haupt = g.find(x => fl(x) === gross).slice(0, 4); return f; };
  const bildPlatz = (x, y, w, h, a, fokus, texte = [], nameBox = null) => {
    const W0 = Math.max(w, h * a), vx0 = x + 0.06 * w, vx1 = x + 0.94 * w, vy0 = y + 0.06 * h, vy1 = y + 0.94 * h;
    const sicht = Math.max(1e-9, (vx1 - vx0) * (vy1 - vy0)), gr = Math.max(w, h);
    const schnitt = (b) => Math.max(0, Math.min(b[2], vx1) - Math.max(b[0], vx0)) * Math.max(0, Math.min(b[3], vy1) - Math.max(b[1], vy0));
    const f = fokus ? (((fokus[2] - fokus[0]) * W0 > w || (fokus[3] - fokus[1]) * W0 / a > h) && fokus.haupt ? fokus.haupt : fokus) : null;
    let best = null;
    for (const zz of [1, 1.12, 1.25, 1.4]) {
      const WW = W0 * zz, HH = WW / a, xs = [], ys = [], zw = (X0, lo, hi) => Math.min(hi, Math.max(lo, X0));
      for (let k = 0; k <= 8; k++) { xs.push(x + w - WW + (WW - w) * k / 8); ys.push(y + h - HH + (HH - h) * k / 8); }
      if (f) { xs.push(zw(x + w / 2 - (f[0] + f[2]) / 2 * WW, x + w - WW, x)); ys.push(zw(y + h / 2 - (f[1] + f[3]) / 2 * HH, y + h - HH, y)); }
      for (const X of xs) for (const Y of ys) {
        const ab = (b) => [X + b[0] * WW, Y + b[1] * HH, X + b[2] * WW, Y + b[3] * HH];
        let kosten = 1.2 * (zz - 1);
        if (f) { const g = ab(f), fg = Math.max(1e-9, (g[2] - g[0]) * (g[3] - g[1]));
          kosten += 50 * (1 - schnitt(g) / fg) + 0.4 * Math.hypot((g[0] + g[2]) / 2 - (x + w / 2), (g[1] + g[3]) / 2 - (y + h / 2)) / gr; }
        else kosten += 0.4 * Math.hypot(X + WW / 2 - (x + w / 2), Y + HH / 2 - (y + h / 2)) / gr;
        if (texte.length) { let t = 0; for (const b of texte) t += schnitt(ab(b)); kosten += 6 * t / sicht; }
        if (f && nameBox) { const g2 = ab(f), fg2 = Math.max(1e-9, (g2[2] - g2[0]) * (g2[3] - g2[1]));
          const ue = Math.max(0, Math.min(g2[2], nameBox[2]) - Math.max(g2[0], nameBox[0]))
                   * Math.max(0, Math.min(g2[3], nameBox[3]) - Math.max(g2[1], nameBox[1]));
          kosten += ${ausweichen} * ue / fg2; }
        if (!best || kosten < best.k - 1e-9) best = { k: kosten, x: X, y: Y, w: WW, h: HH };
      } }
    return { x: best.x, y: best.y, w: best.w, h: best.h }; };

  /* getBBox() misst VOR der eigenen transform - der Schmalschnitt steckt dort nicht drin */
  const BOX = (t) => { const b = t.getBBox(), mm = (t.getAttribute('transform') || '').match(/scale\\(([\\d.]+)/);
    const S2 = mm ? parseFloat(mm[1]) : 1;
    return { x: b.x * S2, y: b.y, width: b.width * S2, height: b.height }; };

  const texte = [...document.querySelectorAll('#w svg text')];
  const mw = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  const lagen = [], rest = [], groessen = [], zeilig = {}, anteile = [];
  let mehrzeilig = 0, fuge = 0, mitGesicht = 0, drueber = 0;
  for (const t of texte) {
    const sp = [...t.querySelectorAll('tspan')], n = Math.max(1, sp.length);
    zeilig[n] = (zeilig[n] || 0) + 1;
    if (n > 1) { mehrzeilig++; if (sp.slice(0, -1).every(x => /[,;:.!?\\u2013\\u2014-]$/.test(x.textContent.trim()))) fuge++; }
    groessen.push(parseFloat(t.getAttribute('font-size')) || 0);
    const bb = BOX(t), mx = bb.x + bb.width / 2, my = bb.y + bb.height / 2;
    const z = zellen.find(c => my >= c.y0 && my <= c.y1 && drin(c.pts, [mx, my]));
    if (!z) continue;
    lagen.push((my - z.y0) / ((z.y1 - z.y0) || 1));
    rest.push(unterhalb(z.pts, bb.y + bb.height) / (z.A || 1));
    if (z.k.row == null) continue;
    const id = zeilen[z.k.row] && zeilen[z.k.row].id; if (!id) continue;
    const e = GES[id]; if (!e || !(e.w > 0)) continue;
    const f = fokusVon(e); if (!f) continue;
    mitGesicht++;
    const nb = [bb.x, bb.y, bb.x + bb.width, bb.y + bb.height];
    const pb = bildPlatz(z.x0, z.y0, z.x1 - z.x0, z.y1 - z.y0, e.w / e.h, f, (e.t || []), nb);
    const g = [pb.x + f[0] * pb.w, pb.y + f[1] * pb.h, pb.x + f[2] * pb.w, pb.y + f[3] * pb.h];
    const ue = Math.max(0, Math.min(g[2], nb[2]) - Math.max(g[0], nb[0])) * Math.max(0, Math.min(g[3], nb[3]) - Math.max(g[1], nb[1]));
    const gf = Math.max(1e-9, (g[2] - g[0]) * (g[3] - g[1]));
    if (ue > 0.02 * gf) { drueber++; anteile.push(ue / gf); }
  }
  melde({ zellen: res.leaves.length, namen: texte.length, schrift: mw(groessen), zeilig, mehrzeilig, fuge,
          lage: mw(lagen), tief: lagen.filter(x => x > 0.7).length, oben: lagen.filter(x => x < 0.5).length,
          rest: mw(rest), viel: rest.filter(x => x > 0.25).length,
          mitGesicht, drueber, ueMittel: mw(anteile) });
} catch (e) { melde({ fehler: String((e && e.stack) || e) }); }
</script></body></html>`;
}
