#!/usr/bin/env node
/* Nahtquotient-Pruefstand fuer den Effektclip-Export (VIDEO-PLAN §6.5, §6.8).
 *
 * Caspar_D, 14.09.2026: "es muss halt der effekt wieder zum Ursprung zurueckkehren auf dem letzten
 * frame". Gemessen wird darum je Fall, ob Bild(t0+L) dem Bild(t0) gleicht und wie gross der Sprung
 * vom letzten zum ersten Bild gegen die gewoehnlichen Bildwechsel ist. Gemalt wird ueber den echten
 * Exportweg im Studio (Pruefhaken haken.js), in headless Chrome, ohne Pakete.
 *
 *   node labor/nahtpruefung/naht.mjs [--faelle a,b | --typ laser] [--aus datei.json]
 *        [--vorschau-speichern datei] [--vorschau-vergleich datei] [--lange 360] [--jobs 1]
 *        [--bilder verzeichnis]   (Bild 0, Bild N-1 und Bild N je Fall als PNG, zum Hinsehen)
 *        [--taktlage [datei]]     (Katalogmessung der Taktlage ueber taktLage() im Studio, statt der Faelle)
 *
 * Jeder Lauf nimmt freie Ports, ein eigenes Profil (.profil-<pid>-<job>) und raeumt beides am Ende
 * weg - mehrere Laeufe duerfen nebeneinander stehen. Ports 8788 und 18811 fasst er nie an.
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '../..');
const SITE = path.join(HIER, 'site');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/* ---- Aufruf ---- */
const arg = {}; { const a = process.argv.slice(2); for (let i = 0; i < a.length; i++) { if (!a[i].startsWith('--')) continue; const k = a[i].slice(2); const v = (a[i + 1] && !a[i + 1].startsWith('--')) ? a[++i] : true; arg[k] = v; } }
if (arg.hilfe || arg.help) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]); process.exit(0); }
const LANGE = +arg.lange || 360, JOBS = Math.max(1, +arg.jobs || 1);
const FAELLE_DATEI = path.resolve(arg['faelle-datei'] || path.join(HIER, 'faelle.json'));
const KATALOG = JSON.parse(fs.readFileSync(FAELLE_DATEI, 'utf8'));
let faelle = KATALOG.faelle;
if (typeof arg.faelle === 'string') { const w = arg.faelle.split(','); faelle = faelle.filter(f => w.includes(f.name)); const fehlt = w.filter(n => !faelle.some(f => f.name === n)); if (fehlt.length) { console.error('unbekannte Faelle: ' + fehlt.join(', ')); process.exit(1); } }
if (typeof arg.typ === 'string') faelle = faelle.filter(f => f.typ === arg.typ || f.effekte.some(e => e.typ === arg.typ));
if (!faelle.length) { console.error('keine Faelle ausgewaehlt'); process.exit(1); }
const VERGLEICH = typeof arg['vorschau-vergleich'] === 'string' ? JSON.parse(fs.readFileSync(path.resolve(arg['vorschau-vergleich']), 'utf8')) : null;

/* ---- Stand bauen ---- */
execFileSync(process.execPath, [path.join(HIER, 'stand.js')], { stdio: 'inherit' });

/* ---- statischer Server auf freiem Port ---- */
const TYPEN = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.glsl': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p; try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400); return res.end(); }
  const datei = path.join(SITE, path.normalize(p).replace(/^(\.\.[\/\\])+/, ''));
  if (!datei.startsWith(SITE)) { res.writeHead(403); return res.end(); }
  fs.stat(datei, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('nicht gefunden'); }
    res.writeHead(200, { 'Content-Type': TYPEN[path.extname(datei).toLowerCase()] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': 'no-store' });
    fs.createReadStream(datei).pipe(res);
  });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

/* ---- CDP ohne Pakete ---- */
class Cdp {
  constructor(ws) { this.ws = ws; this.n = 0; this.offen = new Map(); this.hoerer = [];
    ws.addEventListener('message', ev => { const m = JSON.parse(ev.data);
      if (m.id && this.offen.has(m.id)) { const { ok, nein } = this.offen.get(m.id); this.offen.delete(m.id); m.error ? nein(new Error(m.error.message + (m.error.data ? ': ' + m.error.data : ''))) : ok(m.result); }
      else if (m.method) for (const h of this.hoerer) h(m); });
    ws.addEventListener('close', () => { for (const { nein } of this.offen.values()) nein(new Error('CDP geschlossen')); this.offen.clear(); }); }
  send(method, params = {}) { const id = ++this.n; return new Promise((ok, nein) => { this.offen.set(id, { ok, nein }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  async ausdruck(expr) { const r = await this.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
    return r.result.value; }
}
const warte = ms => new Promise(r => setTimeout(r, ms));
const kinder = new Set();

async function browserStarten(job) {
  const profil = path.join(HIER, '.profil-' + process.pid + '-' + job);
  fs.rmSync(profil, { recursive: true, force: true }); fs.mkdirSync(profil, { recursive: true });
  const kind = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profil, '--no-first-run', '--no-default-browser-check',
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--mute-audio', '--window-size=1400,1000', '--disable-extensions', '--disable-sync', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = ''; kind.stderr.on('data', d => { stderr = (stderr + d).slice(-4000); });
  const b = { kind, profil, job }; kinder.add(b);
  const portDatei = path.join(profil, 'DevToolsActivePort');
  for (let i = 0; i < 300 && !fs.existsSync(portDatei); i++) { if (kind.exitCode != null) throw new Error('Chrome beendet: ' + stderr); await warte(50); }
  /* Die Portdatei kann schon da, aber noch leer sein; und nicht jeder Start legt eine leere Seite an - dann eine bestellen. */
  let seite = null, dport = '', letzter = '';
  for (let i = 0; i < 150 && !seite; i++) {
    try { dport = fs.readFileSync(portDatei, 'utf8').split('\n')[0].trim();
      if (dport) { const liste = await (await fetch('http://127.0.0.1:' + dport + '/json/list')).json(); seite = liste.find(t => t.type === 'page');
        if (!seite && i > 10) seite = await (await fetch('http://127.0.0.1:' + dport + '/json/new?about:blank', { method: 'PUT' })).json(); } }
    catch (e) { letzter = e.message; }
    if (!seite) await warte(100); }
  if (!seite) throw new Error('keine Seite im Chrome (Port ' + dport + ', ' + letzter + ', ' + stderr.slice(-300) + ')');
  const ws = new WebSocket(seite.webSocketDebuggerUrl); await new Promise((ok, nein) => { ws.onopen = ok; ws.onerror = nein; });
  b.cdp = new Cdp(ws); b.meldungen = [];
  b.cdp.hoerer.push(m => {
    if (m.method === 'Runtime.exceptionThrown') b.meldungen.push('Ausnahme: ' + ((m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description) || m.params.exceptionDetails.text).split('\n')[0]);
    else if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || (m.params.type === 'warning'))) b.meldungen.push(m.params.type + ': ' + m.params.args.map(a => a.value != null ? String(a.value) : (a.description || '')).join(' ').split('\n')[0]);
  });
  await b.cdp.send('Runtime.enable'); await b.cdp.send('Page.enable');
  await b.cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/labor-haus.html' });
  for (let i = 0; i < 200; i++) { try { if (await b.cdp.ausdruck('typeof EffektclipStudio!=="undefined" && !!window.__naht && document.readyState==="complete"')) break; } catch (e) {} await warte(100); }
  return b;
}
async function browserBeenden(b) {
  try { b.cdp && b.cdp.ws.close(); } catch (e) {}
  const lebt = () => b.kind.exitCode == null && b.kind.signalCode == null;
  if (lebt()) { b.kind.kill('SIGTERM'); for (let i = 0; i < 60 && lebt(); i++) await warte(50); if (lebt()) b.kind.kill('SIGKILL'); await warte(200); }
  for (let i = 0; i < 5; i++) { try { fs.rmSync(b.profil, { recursive: true, force: true }); break; } catch (e) { await warte(300); } }
  kinder.delete(b);
}
async function aufraeumen() { for (const b of [...kinder]) await browserBeenden(b); server.closeAllConnections(); server.close(); }
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, async () => { await aufraeumen(); process.exit(130); });

/* ---- --taktlage [datei]: Katalogmessung der Taktlage UEBER DEN EINGEBAUTEN CODE (15.09.2026) ----
   node liest library/katalog.json.gz (nur lesen) und reicht je Titel Schlaege, Abschnitte und Dauer an taktLage()
   im Studio. Zwei Kartenlagen: 'schlag' (keine Karte liest die Eins - freie Schlagzahl) und 'takt' (eine Karte
   liest die Eins - ganze Takte). Je Titel dazu die Nachrechnung am exportierten Raster und die Lage von vorher.
   Ergebnis nach ergebnis-taktlage.json (oder die angegebene Datei). */
if (arg.taktlage) {
  const zlib = await import('node:zlib');
  const kat = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(WURZEL, 'library/katalog.json.gz'))));
  const songs = Object.values(kat.songs).filter(s => Array.isArray(s.schlaege) && s.schlaege.length).map(s => ({ id: s.id, titel: s.titel, dauer: s.dauer || 0, schlaege: s.schlaege, abschnitte: s.abschnitte || null }));
  const varianten = { schlag: { brauch: 1 }, takt: { brauch: 1, eins: true } };
  const b = await browserStarten(0); const aus = []; const start = Date.now();
  try {
    for (let i = 0; i < songs.length; i += 12) {
      const teil = songs.slice(i, i + 12);
      const r = await b.cdp.ausdruck('window.__naht.katalog(' + JSON.stringify(teil.map(({ titel, ...rest }) => rest)) + ',' + JSON.stringify(varianten) + ')');
      r.forEach((x, k) => aus.push(Object.assign({ titel: teil[k].titel, dauer: teil[k].dauer }, x)));
      process.stdout.write('\r' + aus.length + '/' + songs.length);
    }
  } finally { await aufraeumen(); }
  const med = a => { const v = a.filter(x => x != null).sort((x, y) => x - y); return v.length ? v[Math.floor(v.length / 2)] : null; };
  const quant = (a, p) => { const v = a.filter(x => x != null).sort((x, y) => x - y); return v[Math.min(v.length - 1, Math.floor(p * v.length))]; };
  const pc = x => x == null ? '-' : (Math.round(x * 1000) / 10).toFixed(1) + ' %';
  const kennzahlen = {};
  for (const v of Object.keys(varianten)) {
    const mit = aus.filter(x => x[v]), n = mit.map(x => x[v].sitzt), an = mit.map(x => x[v].anzeige), alt = mit.map(x => x[v].vorher.sitzt);
    const abw = mit.map(x => Math.abs(x[v].nach.sitzt - x[v].sitzt)), abwA = mit.map(x => Math.abs(x[v].nach.anzeige - x[v].anzeige));
    const fach = {}; mit.forEach(x => { const k = Math.floor(x[v].N / 30); fach[k] = (fach[k] || 0) + 1; });
    const K = kennzahlen[v] = { titel: mit.length, sitztMedian: med(n), ueber80: n.filter(x => x > 0.8).length, unter50: n.filter(x => x < 0.5).length,
      anzeigeMedian: med(an), anzeigeUeber80: an.filter(x => x > 0.8).length, unterBoden: an.filter(x => x != null && x < 0.44).length,
      einsQuoteMedian: med(mit.map(x => x[v].einsQuote)), refrainMedian: med(mit.map(x => x[v].refrain)),
      quantile: { q10: quant(n, 0.1), q25: quant(n, 0.25), q75: quant(n, 0.75), q90: quant(n, 0.9) }, hundert: n.filter(x => x >= 0.9995).length,
      vorherMedian: med(alt), vorherUeber80: alt.filter(x => x > 0.8).length,
      besser: mit.filter(x => x[v].sitzt > x[v].vorher.sitzt + 0.005).length, schlechter: mit.filter(x => x[v].sitzt < x[v].vorher.sitzt - 0.005).map(x => x.titel + ' ' + pc(x[v].vorher.sitzt) + ' -> ' + pc(x[v].sitzt)),
      Lmedian: med(mit.map(x => x[v].N)) / 30, LVerteilung: fach, msMittel: mit.reduce((s, x) => s + x[v].ms, 0) / mit.length, msMax: Math.max(...mit.map(x => x[v].ms)),
      nachgerechnetMaxAbweichung: Math.max(...abw), nachgerechnetMaxAbweichungAnzeige: Math.max(...abwA), nachgerechnetUeber1Pp: mit.filter(x => Math.abs(x[v].nach.anzeige - x[v].anzeige) > 0.01).map(x => x.titel + ' ' + pc(x[v].anzeige) + ' / ' + pc(x[v].nach.anzeige)),
      schlechteste: mit.slice().sort((a, c) => a[v].anzeige - c[v].anzeige).slice(0, 10).map(x => ({ titel: x.titel, anzeige: x[v].anzeige, sitzt: x[v].sitzt, refrain: x[v].refrain, N: x[v].N, M: x[v].M, P: x[v].P, phiF: x[v].phiF, grund: x[v].grund, satz: x[v].satz })) };
    console.log('\n' + v + ': ' + K.titel + ' Titel, sitzt Median ' + pc(K.sitztMedian) + ', >80 %: ' + K.ueber80 + ', <50 %: ' + K.unter50 + ', 100 %: ' + K.hundert + ', Anzeige Median ' + pc(K.anzeigeMedian) + ' (>80 %: ' + K.anzeigeUeber80 + ', unter Boden: ' + K.unterBoden + '), Eins-Quote ' + pc(K.einsQuoteMedian) + ', Refrain ' + pc(K.refrainMedian));
    console.log('  vorher (Phase 0, gerundete Takte, am sichtbaren Bild) Median ' + pc(K.vorherMedian) + ', >80 %: ' + K.vorherUeber80 + ' | besser ' + K.besser + ', schlechter ' + K.schlechter.length + ' | L-Median ' + K.Lmedian.toFixed(2) + ' s ' + JSON.stringify(fach) + ' | ' + K.msMittel.toFixed(1) + ' ms, max ' + K.msMax.toFixed(0) + ' ms');
    console.log('  nachgerechnet am Exportraster: groesste Abweichung sitzt ' + pc(K.nachgerechnetMaxAbweichung) + ', Anzeige ' + pc(K.nachgerechnetMaxAbweichungAnzeige));
    console.log('  schlechteste: ' + K.schlechteste.map(x => x.titel + ' ' + pc(x.anzeige) + (x.grund ? ' [' + x.grund + ']' : '')).join('; '));
  }
  const datei = path.resolve(typeof arg.taktlage === 'string' ? arg.taktlage : path.join(HIER, 'ergebnis-taktlage.json'));
  fs.writeFileSync(datei, JSON.stringify({ datum: new Date().toISOString(), dauerS: Math.round((Date.now() - start) / 1000), varianten, kennzahlen, titel: aus }, null, 1) + '\n');
  console.log('Ergebnis: ' + path.relative(process.cwd(), datei));
  process.exit(0);
}

/* ---- ein Job: seine Faelle, nach Titel gruppiert ---- */
async function job(nr, liste, ergebnisse, fortschritt) {
  const b = await browserStarten(nr);
  try {
    const typen = await b.cdp.ausdruck('window.__naht.typen().map(t=>t.typ)');
    if (nr === 0) { const fehlt = typen.filter(t => !KATALOG.faelle.some(f => f.effekte.length === 1 && f.effekte[0].typ === t)); if (fehlt.length) console.warn('WARNUNG: Typen ohne Vorgabefall in faelle.json: ' + fehlt.join(', ')); }
    let offenerTitel = null, lage = null;
    for (const { f, i } of liste) {
      const t = KATALOG.titel[f.titel]; if (!t) throw new Error('Fall ' + f.name + ': unbekannter Titel ' + f.titel);
      if (offenerTitel !== t.id) {
        b.meldungen.length = 0;
        await b.cdp.ausdruck('EffektclipStudio.oeffnen(' + JSON.stringify(t.id) + ', ()=>{}), true');
        lage = await b.cdp.ausdruck('window.__naht.bereitMachen(' + JSON.stringify(t.id) + ',' + JSON.stringify(KATALOG.jetzt) + ')');
        offenerTitel = t.id;
        if (b.meldungen.length) lage.meldungenBeimOeffnen = b.meldungen.splice(0);
      }
      b.meldungen.length = 0;
      const o = { lange: LANGE, vorschauSpeichern: !!arg['vorschau-speichern'], bilder: typeof arg.bilder === 'string' };
      if (VERGLEICH) { const v = (VERGLEICH.faelle || []).find(x => x.name === f.name); if (v && v.vorschau) o.vorschauVergleich = v.vorschau; }
      let r;
      try { r = await b.cdp.ausdruck('window.__naht.fall(' + JSON.stringify(f) + ',' + JSON.stringify(o) + ')'); }
      catch (e) { r = { abbruch: e.message }; }
      await warte(30);
      if (r && r.bilder) { const dir = path.resolve(arg.bilder); fs.mkdirSync(dir, { recursive: true });
        for (const [k, url] of Object.entries(r.bilder)) fs.writeFileSync(path.join(dir, f.name + '-' + k + '.png'), Buffer.from(url.split(',')[1], 'base64'));
        delete r.bilder; }
      ergebnisse[i] = Object.assign({ name: f.name, typ: f.typ, gruppe: f.gruppe, titel: f.titel, daten: f.daten || 'normal', bemerkung: f.bemerkung || '' }, r, { lage: { gl: lage.gl, noise: lage.noise, tiefe: lage.tiefe }, fehler: b.meldungen.splice(0) });
      if (VERGLEICH && r.vorschauRegression == null && !r.abbruch) ergebnisse[i].vorschauRegression = 'kein Vergleichsbild';
      fortschritt(ergebnisse[i]);
    }
  } finally { await browserBeenden(b); }
}

const ergebnisse = new Array(faelle.length);
const liste = faelle.map((f, i) => ({ f, i }));
const verteilt = Array.from({ length: Math.min(JOBS, liste.length) }, () => []);
/* nach Titel sortiert verteilen: jeder Job oeffnet einen Titel moeglichst selten */
liste.slice().sort((x, y) => (x.f.titel > y.f.titel) - (x.f.titel < y.f.titel) || x.i - y.i).forEach((x, k) => verteilt[k % verteilt.length].push(x));
for (const v of verteilt) v.sort((x, y) => (x.f.titel > y.f.titel) - (x.f.titel < y.f.titel) || x.i - y.i);
const zahl = n => n == null ? '   -  ' : (typeof n === 'number' ? n.toFixed(2).padStart(6) : String(n).padStart(6));
let fertig = 0, zuletzt = Date.now(); const start = Date.now();
/* Wachhund: haengt ein Chrome (etwa ein Shader, der nicht zurueckkommt), wird nach drei Minuten ohne Fortschritt
   abgebrochen und aufgeraeumt - ein stehender Lauf wuerde sonst Profil und Prozess liegen lassen. */
const WACHHUND_MS = (Number(arg.wachhund) || 180) * 1000;   /* --wachhund <s>: schwere Kombinationen (Nebel, Teilchen, Nachzieh) brauchen je Fall laenger als drei Minuten */
const wachhund = setInterval(async () => { if (Date.now() - zuletzt > WACHHUND_MS) { console.error('Abbruch: ' + (WACHHUND_MS/1000) + ' s ohne Fortschritt'); await aufraeumen(); process.exit(2); } }, 5000);
const zeile = r => r.name.padEnd(30) + (r.abbruch ? ' ABBRUCH ' + r.abbruch : zahl(r.gleich) + zahl(r.gleichFolge) + zahl(r.naht) + zahl(r.erwartet) + zahl(r.p95) + zahl(r.quotient) + '  gl ' + (r.gl == null ? '-' : r.gl ? 'ja' : 'NEIN') + '  vorschau ' + zahl(r.vorschauAbw) + (r.vorschauRegression != null ? '  regr ' + zahl(r.vorschauRegression) : '') + (r.tempoVerh != null ? '  tempo ' + zahl(r.tempoVerh) : '') + (r.msVorschau != null ? '  ms ' + r.msVorschau + '/' + r.msExport + (r.msGLVorschau != null ? ' gl ' + r.msGLVorschau + '/' + r.msGLExport : '') : '') + (r.kontrastExport ? '  muster ' + r.kontrastExport.muster.join('-') + ' (' + r.kontrastVorschau.muster.join('-') + ')' : '') + '  L ' + r.L + ' M ' + r.M + (r.fehler && r.fehler.length ? '  FEHLER ' + r.fehler.length : ''));
console.log('Faelle: ' + faelle.length + ', Jobs: ' + verteilt.length + ', lange Seite ' + LANGE + ' px, Server 127.0.0.1:' + PORT);
console.log('name'.padEnd(30) + ' gleich folge  naht  erw.   p95  quot');
let fehlschlag = null;
try { await Promise.all(verteilt.map((v, nr) => job(nr, v, ergebnisse, r => { fertig++; zuletzt = Date.now(); console.log(zeile(r) + '  [' + fertig + '/' + faelle.length + ']'); }))); }
catch (e) { fehlschlag = e; }
clearInterval(wachhund);
await aufraeumen();
if (fehlschlag) { console.error('Abbruch: ' + (fehlschlag.stack || fehlschlag.message)); process.exit(1); }

let stand = ''; try { stand = execFileSync('git', ['-C', WURZEL, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch (e) {}
let verschmutzt = false; try { verschmutzt = !!execFileSync('git', ['-C', WURZEL, 'status', '--porcelain', 'web/index.html'], { encoding: 'utf8' }).trim(); } catch (e) {}
const kopf = { stand, indexGeaendert: verschmutzt, datum: new Date().toISOString(), lange: LANGE, dauerS: Math.round((Date.now() - start) / 1000), titel: KATALOG.titel, jetzt: KATALOG.jetzt };
if (typeof arg.aus === 'string') {
  const ohneBilder = ergebnisse.map(r => { const { vorschau, ...rest } = r; return rest; });
  fs.writeFileSync(path.resolve(arg.aus), JSON.stringify(Object.assign({}, kopf, { faelle: ohneBilder }), null, 1) + '\n');
  console.log('Ergebnis: ' + arg.aus);
}
if (typeof arg['vorschau-speichern'] === 'string') {
  fs.writeFileSync(path.resolve(arg['vorschau-speichern']), JSON.stringify(Object.assign({}, kopf, { faelle: ergebnisse.map(r => ({ name: r.name, vorschau: r.vorschau || null })) })) + '\n');
  console.log('Vorschaubilder: ' + arg['vorschau-speichern']);
}
console.log('fertig in ' + kopf.dauerS + ' s');
process.exit(0);   /* offene Sockets des Chrome halten die Schleife sonst noch Minuten am Leben */
