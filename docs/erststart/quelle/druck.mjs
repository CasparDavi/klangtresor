/* KlangTresor — Erststart-Heft: HTML → PDF.
   Nach docs/features/LEITFADEN.md, Teil B:
     B2  @page{margin:0} — Chrome malt @page-Raender immer weiss
     B5  die Seite prueft sich selbst (window.BERICHT); bei Fehlern KEIN PDF.
         Nie stillschweigend abschneiden.
     B9  pruefen mit pdftoppm (poppler), nicht mit Ghostscript.

   Aufruf: node druck.mjs <sprache> [--trotzdem]
*/
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const SPR = (process.argv[2] || 'de').replace(/^--.*/, '') || 'de';
const TROTZDEM = process.argv.includes('--trotzdem');
const HIER = path.dirname(new URL(import.meta.url).pathname);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ZIEL = path.join(HIER, `KlangTresor-Erststart-${SPR}.pdf`);

/* Ein winziger Server statt file:// — so laden Skript und Bilder ohne
   Sonderrechte, und die Pfade sind dieselben wie spaeter im Netz. */
const TYP = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
              '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp' };
const srv = http.createServer((q, a) => {
  const f = path.join(HIER, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, '') || 'heft.html');
  /* Erst lesen, DANN den Kopf schreiben: sonst ist er bei einer fehlenden
     Datei schon raus, und writeHead(404) wirft ERR_HTTP_HEADERS_SENT. */
  let inhalt = null;
  try { inhalt = fs.readFileSync(f); } catch (e) { a.writeHead(404); return a.end('nicht da'); }
  a.writeHead(200, { 'Content-Type': TYP[path.extname(f)] || 'application/octet-stream' });
  a.end(inhalt);
});
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const PORT = srv.address().port;

const profil = fs.mkdtempSync('/tmp/kt-druck-');
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run',
  '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + profil, 'about:blank']);
let wsUrl = null;
chrome.stderr.on('data', d => { const m = String(d).match(/ws:\/\/[^\s]+/); if (m && !wsUrl) wsUrl = m[0]; });
for (let i = 0; i < 100 && !wsUrl; i++) await new Promise(r => setTimeout(r, 100));
const hafen = new URL(wsUrl).port;
const liste = await (await fetch(`http://127.0.0.1:${hafen}/json/list`)).json();
const ws = new WebSocket(liste.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(ok => { ws.onopen = ok; });
let nr = 0; const offen = new Map(); const ausnahmen = [];
ws.onmessage = e => { const m = JSON.parse(e.data);
  if (m.id && offen.has(m.id)) { offen.get(m.id)(m.result ?? m.error); offen.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown')
    ausnahmen.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || '').slice(0, 200)); };
const ruf = (m, p = {}) => new Promise(ok => { const id = ++nr; offen.set(id, ok); ws.send(JSON.stringify({ id, method: m, params: p })); });
const ev = async c => { const r = await ruf('Runtime.evaluate', { expression: c, returnByValue: true, awaitPromise: true }); return r && r.result ? r.result.value : null; };
await ruf('Page.enable'); await ruf('Runtime.enable');

await ruf('Page.navigate', { url: `http://127.0.0.1:${PORT}/heft.html?spr=${SPR}` });
let bericht = null;
for (let i = 0; i < 80; i++) {
  bericht = await ev('window.BERICHT || null');
  if (bericht) break;
  await new Promise(r => setTimeout(r, 250));
}

const ende = (code) => { ws.close(); chrome.kill(); srv.close();
  try { fs.rmSync(profil, { recursive: true, force: true, maxRetries: 3 }); } catch (e) {}
  process.exit(code); };

if (ausnahmen.length) { console.error('Ausnahmen in der Seite:\n  ' + ausnahmen.join('\n  ')); if (!TROTZDEM) ende(1); }
if (!bericht) { console.error('Die Seite hat keinen Bericht abgelegt (window.BERICHT).'); ende(1); }

console.log('Seiten:', bericht.seiten.length);
for (const s of bericht.seiten) console.log(`  ${String(s.nr).padStart(2)}  leer unten: ${String(s.leer).padStart(3)} %`);
if (bericht.warnung.length) console.log('Warnungen:\n  ' + bericht.warnung.join('\n  '));
if (bericht.fehler.length) {
  console.error('FEHLER:\n  ' + bericht.fehler.join('\n  '));
  if (!TROTZDEM) { console.error('Kein PDF. (--trotzdem erzwingt es)'); ende(1); }
}

const pdf = await ruf('Page.printToPDF', {
  printBackground: true, preferCSSPageSize: true,
  marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
  displayHeaderFooter: false });
if (!pdf || !pdf.data) { console.error('Chrome hat kein PDF geliefert.'); ende(1); }
fs.writeFileSync(ZIEL, Buffer.from(pdf.data, 'base64'));
const kb = Math.round(fs.statSync(ZIEL).size / 1024);
console.log(`\n${path.basename(ZIEL)} — ${kb} KB`);

/* Gegenprobe mit poppler: wie viele Seiten stehen wirklich drin? */
const r = spawnSync('/usr/local/bin/pdfinfo', [ZIEL], { encoding: 'utf8' });
const m = /Pages:\s+(\d+)/.exec(r.stdout || '');
if (m) {
  console.log('im PDF:', m[1], 'Seiten');
  if (Number(m[1]) !== bericht.seiten.length)
    console.error(`ACHTUNG: die Seite plant ${bericht.seiten.length}, das PDF hat ${m[1]}.`);
}
ende(0);
