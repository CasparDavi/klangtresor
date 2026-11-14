// PRUEFSTAND FUER DIE TITEL DES PLAKATS (14.11.2026)
//
// Caspar_D, nach dem Blick auf seine Plakate: „die Texte touchieren die Blasenwände, da muß ein Hof drum".
// Der Satz des Plakats war bis dahin nicht messbar: er steht nicht in render.js, sondern in web/index.html
// (kopfUnten, kopfPlan, kantenTitel innerhalb von schaumSvgBauen) und laeuft nur, wenn die App laeuft. Der
// Pruefstand labor/schaum/beschriftung.mjs misst den SCHIRMSATZ - und sieht genau die Stellen nicht, an denen
// das Plakat anders rechnet:
//   · das Plakat verlangt mindestens 7 Schaum-Einheiten Schrift (DIN 1450), der Schirm gibt sich mit 4 zufrieden;
//   · wo der Tintensatz das nicht schafft, faellt das Plakat auf das ALTE Glasband zurueck (kopfPlan), das nur
//     0,15 Geviert zu den Seiten prueft, die Zellwand an drei Hoehen abtastet und bei fester Schrift 7 kuerzt.
// Am Schirmsatz gemessen: mit Mindestschrift 7 setzt der Tintensatz 154 von 346 Zellen statt 255.
//
//   node labor/schaum/plakattitel.mjs [http://127.0.0.1:8788]
//   node labor/schaum/plakattitel.mjs --titel kante      Titel an der Zellkante statt im Glasband
//   node labor/schaum/plakattitel.mjs --mm 0.44          Millimeter je Schaum-Einheit (A3 quer, Vorgabe)
//   node labor/schaum/plakattitel.mjs --svg plakat.svg   das gesetzte Plakat als SVG zum Ansehen
//
// WIE: der Satz wird NICHT nachgebaut. Ein kleiner Server liefert web/ aus und bedient die drei Abrufe, die die
// App zum Zeichnen braucht (/api/karte, /api/index, /api/gesichter) aus dem, was dieser Lauf lesend vom laufenden
// KlangTresor geholt hat - kein library im Spiel, kein Schreibweg, Jörgs Bestand unberuehrt; alles andere bekommt
// 404 und jeder Schreibweg 405. Ein headless Chrome laedt diese Fassung der App und wird ueber das
// DevTools-Protokoll gesteuert: dort wird schaumSvgBauen mit einem druck-Objekt gerufen, wie das Plakat-Studio es
// baut, und am fertigen SVG gemessen. (Mit --virtual-time-budget statt CDP kommt der Lauf nicht durch: die
// Dauerschleife der Oberflaeche laesst die virtuelle Zeit nicht vergehen.)
//
// GEMESSENE STAENDE (900 x 558 Einheiten, Gliederung „Klang", Mass Abrufe, 346 Zellen, A3 quer mit 0,44 mm je
// Einheit; „enge Tinte" = Bildpunkte, die naeher als 0,8 Einheiten an der Wand stehen, aus der Pixelmaske):
//   Glasband („rauch"), 137 Titel, alle im Tintensatz - kein Rueckfall aufs alte Band:
//     1.1.10, Luft 0,12 wie am Schirm        enge Tinte 389 · davon 35 unter 0,2 · kleinster Abstand 0,167 Einheiten
//     Luft 0,18                              enge Tinte 128 · 3 unter 0,2 · 137 Titel
//     Luft 0,24 (eingebaut, SCHAUM_PLAKAT_LUFT)  enge Tinte  93 · 3 unter 0,2 · 137 Titel · nichts gekappt
//     Luft 0,32                              enge Tinte  93 · 3 unter 0,2 · nur noch 135 Titel - zu teuer
//   Kantentitel („kante"), 220 Titel: enge Tinte 1722, davon 373 unter 0,2 - und 1288 Bildpunkte (0,25 % der
//     Tinte) schneidet der Zellrand WEG. Dieser Satz hat gar keinen Hof: er prueft nur, ob der Titel in 90 % der
//     Bahnlaenge steht, und nichts senkrecht zur Bahn. OFFEN, siehe docs/BACKLOG.md.
//
// GEMESSEN WIRD je Titel der kleinste Abstand seiner TINTE zur gezeichneten Zellwand, in Geviert seiner Schrift.
// Die Tinte kommt aus zwei eigenen Messungen: getStartPositionOfChar gibt die Grundlinie, wie der Browser sie
// wirklich gesetzt hat (unabhaengig von dominant-baseline, textPath und Schmalschnitt), und das Canvas gibt in
// der Satzgroesse die Ausdehnung der Glyphen (actualBoundingBox*). getBBox() taugt dafuer NICHT: es liefert die
// Layoutbox mit dem ganzen Em-Kasten, also auch dort Unterlaenge, wo keine steht - die erste Fassung dieser
// Messung meldete deshalb lauter Nullabstaende bei Woertern wie „Monolith".

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..', '..');
const WEB = path.join(WURZEL, 'web');
const TRESOR = process.argv.find(a => a.startsWith('http')) || 'http://127.0.0.1:8788';
const arg = (n, v) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : v; };
const TITEL = arg('--titel', 'rauch');                 /* rauch | milch | kante | ohne */
const MM = parseFloat(arg('--mm', '0.44'));            /* A3 quer, Karte 900 Einheiten breit */
const SVGAUS = arg('--svg', null);
/* --feine-kaesten: die Kaesten der Einzelzeichen bei 64 px messen statt bei der Darstellungsstufe. Im Plakat ist
   die Titelschrift 7 Schaum-Einheiten, gemessen wird bei 0,6 davon, also auf der Stufe 4 px (SCHAUM_TINTE_STUFEN) -
   dort ist ein halber Bildpunkt 0,125 Geviert, also genau so viel, wie die Luft ueberhaupt betraegt. Der Schalter
   patcht die index.html beim Ausliefern; das Repo bleibt unberuehrt. */
const FEIN = process.argv.includes('--feine-kaesten');
/* --luft X: die Luft um die Tintenkaesten (TINTE_LUFT_BILD in render.js, Vorgabe 0,12 Geviert). Auch render.js
   liefert der kleine Server aus - der Schalter patcht es beim Ausliefern, das Repo bleibt unberuehrt. */
const LUFT = (() => { const i = process.argv.indexOf('--luft'); return i > 0 ? parseFloat(process.argv[i + 1]) : null; })();
/* --ohne-ausweichen: das Bild weicht dem Titel NICHT aus (der Stand bis 1.1.10, zum Vergleichen). Seit heute rechnet
   die Beschriftung VOR der Bildplatzierung und gibt ihre Box an schaumBildPlatz; der Schalter setzt diese Box auf
   null, patcht also genau die eine Zeile in index.html. */
const OHNE = process.argv.includes('--ohne-ausweichen');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BREITE = 900, VERHAELTNIS = 0.62;

if (!fs.existsSync(CHROME)) { console.error('Chrome nicht gefunden: ' + CHROME); process.exit(2); }

const holen = async (p) => { const r = await fetch(TRESOR + p); if (!r.ok) throw new Error(p + ' → HTTP ' + r.status); return r.json(); };
console.log('Hole Karte, Werkverzeichnis und Gesichter von ' + TRESOR + ' …');
const [karte, index, gesichter] = await Promise.all([holen('/api/karte'), holen('/api/index'), holen('/api/gesichter')]);

const arbeit = fs.mkdtempSync(path.join(os.tmpdir(), 'plakattitel-'));
const TYPEN = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
const api = { '/api/karte': karte, '/api/index': index, '/api/gesichter': gesichter };
const server = http.createServer((q, a) => {
  const u = decodeURIComponent((q.url || '/').split('?')[0]);
  if (q.method !== 'GET' && q.method !== 'HEAD') { a.writeHead(405).end(); return; }
  if (api[u]) { a.writeHead(200, { 'Content-Type': TYPEN['.json'] }).end(JSON.stringify(api[u])); return; }
  const f = path.join(WEB, u === '/' ? 'index.html' : u.replace(/^\/+/, ''));
  if (!f.startsWith(WEB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { a.writeHead(404).end(); return; }
  if (LUFT > 0 && f.endsWith('render.js')) {
    const alt = 'const TINTE_LUFT_BILD = 0.12;';
    const t = fs.readFileSync(f, 'utf8');
    if (!t.includes(alt)) { console.error('--luft: TINTE_LUFT_BILD in render.js ist nicht mehr 0.12'); process.exit(1); }
    a.writeHead(200, { 'Content-Type': TYPEN['.js'] }).end(t.replace(alt, 'const TINTE_LUFT_BILD = ' + LUFT + ';'));
    return;
  }
  if ((FEIN || OHNE) && f.endsWith('index.html')) {
    let t = fs.readFileSync(f, 'utf8');
    if (FEIN) { const alt = 'const zs = teile(t).map(c => zeichen(c, b, kursiv))';
      if (!t.includes(alt)) { console.error('--feine-kaesten: die Stelle in schaumNamenTinte ist nicht mehr da'); process.exit(1); }
      t = t.replace(alt, 'const zs = teile(t).map(c => zeichen(c, 64, kursiv))'); }
    if (OHNE) { const alt = 'const titelBox = plan ?';
      if (!t.includes(alt)) { console.error('--ohne-ausweichen: die Stelle in schaumSvgBauen ist nicht mehr da'); process.exit(1); }
      t = t.replace(alt, 'const titelBox = false ?'); }
    a.writeHead(200, { 'Content-Type': TYPEN['.html'] }).end(t);
    return;
  }
  a.writeHead(200, { 'Content-Type': TYPEN[path.extname(f).toLowerCase()] || 'application/octet-stream' }).end(fs.readFileSync(f));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

/* ---- headless Chrome am DevTools-Protokoll ---- */
const profil = path.join(arbeit, 'profil');
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--mute-audio', '--no-first-run', '--no-default-browser-check',
  '--disable-background-timer-throttling', '--remote-debugging-port=0', '--user-data-dir=' + profil,
  '--window-size=1500,950', `http://127.0.0.1:${PORT}/`], { stdio: ['ignore', 'ignore', 'pipe'] });
let chromeFehler = '';
chrome.stderr.on('data', d => { chromeFehler += d; });

const schlaf = (ms) => new Promise(r => setTimeout(r, ms));
const aufgeben = (t) => { try { chrome.kill('SIGKILL'); } catch (e) {} server.close(); console.error(t); process.exit(1); };

let wsUrl = null;
for (let i = 0; i < 100 && !wsUrl; i++) {
  await schlaf(100);
  const p = path.join(profil, 'DevToolsActivePort');
  if (!fs.existsSync(p)) continue;
  const z = fs.readFileSync(p, 'utf8').split('\n');
  if (z.length < 2) continue;
  try { const liste = await (await fetch('http://127.0.0.1:' + z[0].trim() + '/json/list')).json();
    const seite = liste.find(x => x.type === 'page'); if (seite) wsUrl = seite.webSocketDebuggerUrl; } catch (e) {}
}
if (!wsUrl) aufgeben('Chrome hat kein DevTools-Fenster gemeldet.\n' + chromeFehler.slice(0, 600));

const ws = new WebSocket(wsUrl);
await new Promise((ok, weg) => { ws.onopen = ok; ws.onerror = () => weg(new Error('WebSocket')); });
let nr = 0; const offen = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && offen.has(m.id)) { offen.get(m.id)(m); offen.delete(m.id); } };
const senden = (method, params = {}) => new Promise(ok => { const id = ++nr; offen.set(id, ok); ws.send(JSON.stringify({ id, method, params })); });
const rechne = async (ausdruck, warten = true) => {
  const a = await senden('Runtime.evaluate', { expression: ausdruck, awaitPromise: warten, returnByValue: true, timeout: 300000 });
  const r = a.result || {};
  if (r.exceptionDetails) throw new Error('in der Seite: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result?.value;
};

/* warten, bis die App ihre Funktionen bereitgestellt hat */
let bereit = false;
for (let i = 0; i < 150 && !bereit; i++) {
  await schlaf(200);
  try { bereit = await rechne(`typeof schaumSvgBauen === 'function' && typeof schaumGesichterUebernehmen === 'function'`, false); } catch (e) {}
}
if (!bereit) aufgeben('Die App hat schaumSvgBauen nicht bereitgestellt (30 s gewartet).');

let z;
try { z = await rechne(messcode()); }
catch (e) { aufgeben('FEHLER im Prüfstand: ' + e.message); }
try { chrome.kill('SIGKILL'); } catch (e) {}
server.close();
if (z && z.fehler) { console.error('FEHLER im Prüfstand: ' + z.fehler); process.exit(1); }

const p = (x, n = 0) => String(typeof x === 'number' ? x.toFixed(n) : x);
const block = (name, o) => {
  if (!o || !o.n) { console.log('  ' + name.padEnd(26) + '—'); return; }
  console.log('  ' + name.padEnd(26) + o.n + ' Titel · Hof Mittel ' + p(o.mittel, 3) + ' · Median ' + p(o.median, 3)
    + ' · engster ' + p(o.min, 3));
  console.log('      unter 0,12 / 0,06 / 0,02  ' + o.u12 + ' / ' + o.u06 + ' / ' + o.u02
    + '   (' + p(100 * o.u12 / o.n, 0) + ' % unter 0,12)');
  if (o.engste.length) console.log('      engste: ' + o.engste.map(e => '„' + e[0] + '" ' + p(e[1], 3)).join(' · '));
};
console.log('');
console.log('  Plakat ' + BREITE + ' × ' + Math.round(BREITE * VERHAELTNIS) + ' Einheiten · ' + MM + ' mm je Einheit (A3 quer)'
  + ' · Titel „' + TITEL + '"' + (FEIN ? '  ·  feine Kästen (64 px)' : '') + (LUFT > 0 ? '  ·  Luft ' + LUFT : '') + (OHNE ? '  ·  OHNE Ausweichen vor dem Titel' : ''));
console.log('');
console.log('  Zellen                    ' + z.zellen);
console.log('  Titel gesetzt             ' + z.titel + '   (Tintensatz ' + z.imBand + ' · altes Band ' + z.imAlt + ' · Kante ' + z.anKante + ')');
console.log('  ohne Titel                ' + (z.zellen - z.titel) + '   (darunter alle unter 34 × 34 Einheiten)');
console.log('');
block('Tintensatz (kopfUnten)', z.neu);
block('Altes Glasband (kopfPlan)', z.alt);
block('Kantentitel', z.kante);
console.log('');
if (z.gesicht && z.gesicht.n) {
  console.log('  Zellen mit Bild und Gesicht  ' + z.gesicht.n);
  console.log('    Gesicht unter dem Band     ' + z.gesicht.imBand + '   (' + p(100 * z.gesicht.imBand / z.gesicht.n, 0)
    + ' %, im Mittel ' + p(100 * z.gesicht.mittel, 0) + ' % der Gesichtsfläche)');
  console.log('');
}
if (z.pixel && !z.pixel.fehler) {
  console.log('  Pixelmaske (' + 3 + '-fach gerastert, ohne Metrikmodell)');
  console.log('    Tintenpunkte              ' + z.pixel.mit + '   (ohne Beschnitt waeren es ' + z.pixel.ohne + ')');
  console.log('    von der Zelle gekappt     ' + z.pixel.gekappt + '   (' + p(100 * z.pixel.anteil, 2) + ' % der Tinte)');
  console.log('    Abstand zur Wand          kleinster ' + p(z.pixel.min, 3) + ' Einheiten = ' + p(z.pixel.min * MM, 3)
    + ' mm · im Mittel ' + p(z.pixel.mittel, 2) + ' Einheiten');
  console.log('    Tinte nach Abstand        0: ' + z.pixel.histo[0] + ' · bis 0,2: ' + z.pixel.histo[1]
    + ' · bis 0,4: ' + z.pixel.histo[2] + ' · bis 0,8: ' + z.pixel.histo[3] + ' · bis 1,6: ' + z.pixel.histo[4]
    + ' · darüber: ' + z.pixel.histo[5] + ' Bildpunkte');
} else if (z.pixel) console.log('  Pixelmaske: ' + z.pixel.fehler);
console.log('');
console.log('  Ein Geviert ist ' + p(MM, 2) + ' mm je Einheit Schrift; 0,12 Geviert bei Schrift 7 sind '
  + p(0.12 * 7 * MM, 2) + ' mm.');
console.log('');
if (SVGAUS && z.svg) { fs.writeFileSync(SVGAUS, z.svg); console.log('  SVG: ' + SVGAUS + '  (' + (z.svg.length / 1024 | 0) + ' KB)'); }
fs.rmSync(arbeit, { recursive: true, force: true });

/* ------------------------------------------------------------------ */
function messcode() {
  return `(async () => { try {
  const { grossLegen } = await import('/klangschaum/grossschaum.js');
  const R = await import('/klangschaum/render.js');
  const [karte, index, ges] = await Promise.all([
    fetch('/api/karte').then(r => r.json()), fetch('/api/index').then(r => r.json()), fetch('/api/gesichter').then(r => r.json())]);
  schaumGesichterUebernehmen(ges);

  const liste = Array.isArray(index) ? index : (index.songs || index.titel || index.eintraege || []);
  const lage = new Map((karte.songs || []).map(q => [q.id, q]));
  const gname = new Map((karte.gruppen || []).map(g => [g.nr, g.name]));
  const zeilen = [];
  for (const s of liste) {
    if (s.fremd) continue;
    const w = s.plays || s.abrufe || 0; if (!(w > 0)) continue;
    const q = lage.get(s.id);
    zeilen.push({ gruppe: q && q.gruppe != null ? (gname.get(q.gruppe) || ('Gruppe ' + q.gruppe)) : 'ohne Stil',
                  genre: (q && q.genre) || '', titel: s.titel || '—', id: s.id, w: String(w) });
  }
  const W = ${BREITE}, H = Math.round(${BREITE} * ${VERHAELTNIS});
  const res = await grossLegen(zeilen, { levels: ['gruppe', 'genre', 'row'], weight: 'w', leafName: 'titel' },
                               { width: W, height: H, method: 'foam', minArea: 0, minShare: 0 }, {});

  /* das druck-Objekt wie das Plakat-Studio es baut (plakat.js, Vorlage „Galerie" auf A3) */
  const druck = { titel: '${TITEL}', fugen: 1, wackeln: 0, schatten: 0, vignette: 0, kissen: true,
                  deck: '0.000', ton: '0.600', massstab: 2, verzeichnis: false,
                  mmJeEinheit: ${MM}, nrSchwelle: 2.25, nrSchwelleTitel: 1.8, waende: [] };
  const gebaut = await schaumSvgBauen(res, { zeilen, ebenen: ['gruppe', 'genre'], farbeVon: () => null,
                                             gezoomt: false, art: 'song', druck });
  /* zum Messen muss das SVG im Dokument liegen (Layout), sichtbar muss es nicht sein */
  let d = document.getElementById('laborfeld');
  if (!d) { d = document.createElement('div'); d.id = 'laborfeld';
    d.style.cssText = 'position:absolute;left:-20000px;top:0;width:1360px'; document.body.appendChild(d); }
  d.innerHTML = gebaut.svg;

  const FAM = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const lwT = document.createElement('canvas').getContext('2d');
  const tinteUm = (text, fs, kursiv, fett) => { lwT.font = (kursiv ? 'italic ' : '') + (fett || 400) + ' ' + fs.toFixed(2) + 'px ' + FAM;
    const q = lwT.measureText(text);
    return { l: q.actualBoundingBoxLeft, r: q.actualBoundingBoxRight, a: q.actualBoundingBoxAscent, d: q.actualBoundingBoxDescent }; };
  const flaeche = (pts) => { let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]); return Math.abs(a / 2); };
  const drin = (pts, q) => { let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j];
      if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < (b[0] - a[0]) * (q[1] - a[1]) / ((b[1] - a[1]) || 1e-9) + a[0]) c = !c; }
    return c; };
  const wandAbstand = (b, pts) => {
    const segAb = (q, a, c) => { const vx = c[0] - a[0], vy = c[1] - a[1], l2 = vx * vx + vy * vy || 1e-9;
      const t2 = Math.max(0, Math.min(1, ((q[0] - a[0]) * vx + (q[1] - a[1]) * vy) / l2));
      return Math.hypot(q[0] - (a[0] + t2 * vx), q[1] - (a[1] + t2 * vy)); };
    const ecken = [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]];
    let d2 = Infinity;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      for (const e of ecken) d2 = Math.min(d2, segAb(e, pts[j], pts[i]));
      const q = pts[i];
      d2 = Math.min(d2, Math.hypot(Math.max(b[0] - q[0], 0, q[0] - b[2]), Math.max(b[1] - q[1], 0, q[1] - b[3])));
    }
    return d2;
  };

  /* Die Zellen in Bildkoordinaten. Gemessen wird gegen den GEZEICHNETEN Umriss: das Plakat rueckt die Kacheln um
     die Fugen ein (renderSVG gutters, insetOutline) - der rohe outline waere die falsche Wand. */
  const STRICHE = [3.2, 2.0, 1.2, 0.7, 0.35];
  const zellen = res.leaves.map((k, i) => {
    if (!k.outline) return null;
    const o = k.tags ? R.insetOutline(k.outline, k.tags, STRICHE) : k.outline;
    const pts = o.map(q => [q[0], H - q[1]]);
    let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
    for (const q of pts) { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); }
    return { k, i, pts, x0, x1, y0, y1, A: flaeche(pts) }; });
  /* Die Zelle wird NICHT geometrisch gesucht, sondern am Clip-Pfad abgelesen: jeder Titel traegt (selbst oder an
     seinem <g>) clip-path="url(#skzN)", und N ist der Index in res.leaves. Geometrisch getroffen hiesse raten -
     bei konkaven Zellen und mehrzeiligen Bloecken kann die Mitte des Satzes in der Nachbarzelle liegen, und dann
     waere die gemessene Wand die falsche. Der Pfad, gegen den der Satz geprueft hat, ist derselbe, den
     insetOutline hier liefert (renderSVG zeichnet die Kacheln mit genau diesen Fugen). */
  const zellVon = (t) => {
    for (let el = t; el; el = el.parentElement) {
      const c = (el.getAttribute && el.getAttribute('clip-path')) || '';
      const m2 = c.match(/skz(\\d+)/); if (m2) return zellen[+m2[1]] || null;
    }
    return null;
  };

  const mw = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  const topf = () => ({ d: [], engste: [] });
  const neu = topf(), alt = topf(), kante = topf();
  let imBand = 0, imAlt = 0, anKante = 0, ohneZelle = 0;

  for (const t of [...d.querySelectorAll('svg text')]) {
    const kl = t.getAttribute('class') || '';
    if (kl !== 'kopf' && kl !== 'kante') continue;
    const fs = parseFloat(t.getAttribute('font-size')) || 0; if (!(fs > 0)) continue;
    const sp = [...t.querySelectorAll('tspan')];
    const mitPfad = !!t.querySelector('textPath');
    const S = parseFloat(((t.getAttribute('transform') || '').match(/scale\\(([\\d.]+)/) || [0, '1'])[1]) || 1;
    const st = getComputedStyle(t), kursiv = st.fontStyle === 'italic', fett = parseInt(t.getAttribute('font-weight') || st.fontWeight) || 400;
    const topfVon = mitPfad ? kante : (sp.length ? neu : alt);
    if (mitPfad) anKante++; else if (sp.length) imBand++; else imAlt++;
    const text = t.textContent || '';
    const stuecke = [];
    if (mitPfad) {                                   /* auf der Bahn: Zeichen fuer Zeichen */
      for (let i = 0; i < text.length; i++) {
        if (!text[i].trim()) continue;
        let a0; try { a0 = t.getStartPositionOfChar(i); } catch (e) { continue; }
        const q = tinteUm(text[i], fs, kursiv, fett);
        stuecke.push([a0.x - q.l, a0.y - q.a, a0.x + q.r, a0.y + q.d]);
      }
    } else {
      const teile = sp.length ? sp.map(x => x.textContent || '') : [text];
      let i0 = 0;
      for (const zl of teile) {
        let a0 = null; try { a0 = t.getStartPositionOfChar(i0); } catch (e) { a0 = null; }
        i0 += zl.length;
        if (!a0 || !zl.trim()) continue;
        const q = tinteUm(zl, fs, kursiv, fett);
        stuecke.push([(a0.x - q.l) * S, a0.y - q.a, (a0.x + q.r) * S, a0.y + q.d]);
      }
    }
    if (!stuecke.length) continue;
    const z2 = zellVon(t);
    if (!z2) { ohneZelle++; continue; }
    let dd = Infinity, wo = '';
    for (const b of stuecke) {
      const e = wandAbstand(b, z2.pts);
      if (e < dd) { dd = e;
        /* wo es eng wird: an welcher Seite des Tintenkastens die Wand liegt - fuer die Fehlersuche */
        const mi = [[b[0] - z2.x0, 'links'], [z2.x1 - b[2], 'rechts'], [b[1] - z2.y0, 'oben'], [z2.y1 - b[3], 'unten']]
          .sort((p, q) => p[0] - q[0])[0];
        wo = mi[1]; }
    }
    dd /= fs;
    topfVon.d.push(dd);
    if (dd < 0.12) topfVon.engste.push([text.slice(0, 20) + ' [' + wo + ' ' + fs.toFixed(1) + ']', +dd.toFixed(3)]);
  }

  /* GEGENPROBE MIT DER PIXELMASKE. Die Rechnung oben steht gegen die Rechnung des Satzes, und beide koennen irren
     (die erste Fassung tat es). Hier wird das fertige Plakat gerastert und gezaehlt, ohne jedes Metrikmodell:
       · Tinte, die der Zellrand WEGSCHNEIDET - jeder Titel haengt an clip-path="url(#skzN)", also kappt die Zelle,
         was ueber sie hinausragt. Was gekappt wird, hat Caspar_D auf dem Plakat gesehen.
       · der kleinste Abstand eines Tintenpunktes zum Rand seiner Zelle, in Bildpunkten der Rasterung.
     Gerastert wird mit RASTER-fachem Mass; ein Bildpunkt ist dann 1/RASTER Einheit. */
  /* DAS GESICHT UNTER DEM GLASBAND. Das Band deckt den unteren Bildstreifen ab (Deckung 0,62) - liegt das Gesicht
     dort, liegt es hinter Milchglas. Seit heute rechnet die Beschriftung vor der Bildplatzierung, und das Bild weicht
     dem Band aus (schaumBildPlatz, Gewicht 15). Gemessen wird am fertigen SVG: die Lage des Originals steht als
     data-p am <image>, die Gesichter kommen aus denselben Daten wie im Betrieb, das Band ist das rect davor. */
  const GES = ges.bilder || {}, SCHW = ges.schwelle || 0.5;
  const fokusVon = (e) => { if (!e || !(e.w > 0) || !(e.h > 0)) return null;
    const fl = (x) => (x[2] - x[0]) * (x[3] - x[1]), g = (e.g || []).filter(x => x[4] >= SCHW);
    if (!g.length) return null;
    const gross = Math.max(...g.map(fl)), wichtig = g.filter(x => fl(x) >= 0.25 * gross);
    const f = [Math.min(...wichtig.map(x => x[0])), Math.min(...wichtig.map(x => x[1])),
               Math.max(...wichtig.map(x => x[2])), Math.max(...wichtig.map(x => x[3]))];
    return f; };
  let mitGesicht = 0, imBandGesicht = 0; const ueAnteile = [];
  for (const im of [...d.querySelectorAll('svg image[data-p]')]) {
    const i = +im.getAttribute('data-i'); const z3 = zellen[i]; if (!z3 || z3.k.row == null) continue;
    const id = (zeilen[z3.k.row] || {}).id; if (!id) continue;
    const f = fokusVon(GES[id]); if (!f) continue;
    const pp = (im.getAttribute('data-p') || '').split(',').map(Number); if (pp.length !== 4) continue;
    /* das Band: das rect mit der Glasklasse in derselben Zelle */
    const band = im.closest('g') && im.closest('g').querySelector('rect.rauch, rect.milch');
    if (!band) continue;
    mitGesicht++;
    const bb = [+band.getAttribute('x'), +band.getAttribute('y'),
                +band.getAttribute('x') + +band.getAttribute('width'), +band.getAttribute('y') + +band.getAttribute('height')];
    const g2 = [pp[0] + f[0] * pp[2], pp[1] + f[1] * pp[3], pp[0] + f[2] * pp[2], pp[1] + f[3] * pp[3]];
    const ue = Math.max(0, Math.min(g2[2], bb[2]) - Math.max(g2[0], bb[0])) * Math.max(0, Math.min(g2[3], bb[3]) - Math.max(g2[1], bb[1]));
    const gf = Math.max(1e-9, (g2[2] - g2[0]) * (g2[3] - g2[1]));
    if (ue > 0.02 * gf) { imBandGesicht++; ueAnteile.push(ue / gf); }
  }

  const RASTER = 6;
  const malen = async (svgText) => {
    const bild = new Image();
    const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
    await new Promise((ok, weg) => { bild.onload = ok; bild.onerror = () => weg(new Error('SVG nicht rasterbar')); bild.src = url; });
    const c = document.createElement('canvas'); c.width = W * RASTER; c.height = H * RASTER;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(bild, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    return g.getImageData(0, 0, c.width, c.height).data;
  };
  /* Nur die Titel, auf durchsichtigem Grund: Bilder und Glasbaender weg, die Zellpfade unsichtbar (aber die in
     clipPath bleiben - sie sind die Wand). Einmal MIT Clip, einmal ohne: die Differenz ist das Gekappte. */
  const nurTitel = (mitClip) => {
    const p2 = new DOMParser().parseFromString(gebaut.svg, 'image/svg+xml');
    const wurzel = p2.documentElement;
    for (const el of [...wurzel.querySelectorAll('image, rect, filter')]) el.remove();
    for (const el of [...wurzel.querySelectorAll('path')])
      if (!el.closest('clipPath')) { el.setAttribute('fill', 'none'); el.setAttribute('stroke', 'none'); }
    for (const el of [...wurzel.querySelectorAll('text')]) { el.setAttribute('fill', '#fff'); el.setAttribute('fill-opacity', '1'); }
    if (!mitClip) for (const el of [...wurzel.querySelectorAll('[clip-path]')]) el.removeAttribute('clip-path');
    return new XMLSerializer().serializeToString(wurzel);
  };
  /* Nur die Zellflaechen, weiss: so entsteht die Maske der Waende. Was nicht Zelle ist, ist Fuge oder Grund. */
  const nurZellen = () => {
    const p2 = new DOMParser().parseFromString(gebaut.svg, 'image/svg+xml');
    const wurzel = p2.documentElement;
    for (const el of [...wurzel.querySelectorAll('image, text, filter')]) el.remove();
    for (const el of [...wurzel.querySelectorAll('rect')]) if (!el.closest('clipPath')) el.remove();
    for (const el of [...wurzel.querySelectorAll('path')]) if (!el.closest('clipPath')) {
      el.setAttribute('fill', '#fff'); el.setAttribute('fill-opacity', '1'); el.setAttribute('stroke', 'none'); }
    return new XMLSerializer().serializeToString(wurzel);
  };
  let pixel = null;
  try {
    const mit = await malen(nurTitel(true)), ohne = await malen(nurTitel(false)), zel = await malen(nurZellen());
    const BR = W * RASTER, HO = H * RASTER, N = BR * HO;
    let nMit = 0, nOhne = 0;
    for (let q = 0; q < N; q++) { if (mit[q * 4 + 3] > 40) nMit++; if (ohne[q * 4 + 3] > 40) nOhne++; }
    /* ABSTAND ZUR WAND, metrikfrei: Chamfer-Distanz (3-4-Naeherung, geteilt durch 3) von allem, was NICHT Zelle
       ist. Fuer jeden Tintenpunkt steht dann da, wie weit die naechste Wand weg ist - in Bildpunkten, also in
       1/RASTER Schaum-Einheiten. Gemessen wird der kleinste Abstand ueber alle Tintenpunkte eines Titels; weil
       die Maske die Titel nicht auseinanderhaelt, wird hier ueber ALLE Titel zusammen verteilt gezaehlt. */
    const dist = new Uint16Array(N); const GROSS = 60000;
    for (let q = 0; q < N; q++) dist[q] = zel[q * 4 + 3] > 40 ? GROSS : 0;
    for (let y = 0; y < HO; y++) for (let x = 0; x < BR; x++) { const q = y * BR + x; if (!dist[q]) continue;
      let v = dist[q];
      if (x > 0) v = Math.min(v, dist[q - 1] + 3);
      if (y > 0) { v = Math.min(v, dist[q - BR] + 3);
        if (x > 0) v = Math.min(v, dist[q - BR - 1] + 4);
        if (x < BR - 1) v = Math.min(v, dist[q - BR + 1] + 4); }
      dist[q] = v; }
    for (let y = HO - 1; y >= 0; y--) for (let x = BR - 1; x >= 0; x--) { const q = y * BR + x; if (!dist[q]) continue;
      let v = dist[q];
      if (x < BR - 1) v = Math.min(v, dist[q + 1] + 3);
      if (y < HO - 1) { v = Math.min(v, dist[q + BR] + 3);
        if (x < BR - 1) v = Math.min(v, dist[q + BR + 1] + 4);
        if (x > 0) v = Math.min(v, dist[q + BR - 1] + 4); }
      dist[q] = v; }
    let min = Infinity, summe = 0, n = 0; const histo = [0, 0, 0, 0, 0, 0];
    for (let q = 0; q < N; q++) { if (!(mit[q * 4 + 3] > 40)) continue;
      const e = dist[q] / 3 / RASTER;            /* in Schaum-Einheiten */
      min = Math.min(min, e); summe += e; n++;
      const k = e <= 0 ? 0 : e < 0.2 ? 1 : e < 0.4 ? 2 : e < 0.8 ? 3 : e < 1.6 ? 4 : 5;
      histo[k]++; }
    pixel = { mit: nMit, ohne: nOhne, gekappt: nOhne - nMit, anteil: nOhne ? (nOhne - nMit) / nOhne : 0,
              raster: RASTER, min: n ? min : 0, mittel: n ? summe / n : 0, histo, punkte: n };
  } catch (e) { pixel = { fehler: String(e.message || e) }; }

  const fertig = (o) => ({ n: o.d.length, mittel: mw(o.d), min: o.d.length ? Math.min(...o.d) : 0,
    median: o.d.length ? [...o.d].sort((a, b) => a - b)[o.d.length >> 1] : 0,
    u12: o.d.filter(x => x < 0.12).length, u06: o.d.filter(x => x < 0.06).length, u02: o.d.filter(x => x < 0.02).length,
    engste: o.engste.sort((a, b) => a[1] - b[1]).slice(0, 8) });
  return { zellen: res.leaves.length, titel: imBand + imAlt + anKante, imBand, imAlt, anKante, ohneZelle,
           gesicht: { n: mitGesicht, imBand: imBandGesicht, mittel: mw(ueAnteile) },
           neu: fertig(neu), alt: fertig(alt), kante: fertig(kante), pixel, svg: ${SVGAUS ? 'gebaut.svg' : 'null'} };
} catch (e) { return { fehler: String((e && e.stack) || e) }; } })()`;
}
