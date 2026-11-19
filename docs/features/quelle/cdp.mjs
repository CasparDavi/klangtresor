// Kleine CDP-Hülle: eigener headless Chrome, Fingergesten, Messungen.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
// Übernommen aus dem KlangTresor (Sicherung 20261027/werkzeuge-scratchpad-2217.tar.gz, testagent4/cdp.mjs) – Caspar_D 12.11.2026:
// „immer auf altbewährtes zurückgreifen“. Angepasst: Profilordner im System-Tmp, Adresse über URL (Probeinstanz der KlangFeder).
import os from 'node:os';
export const DIR = fs.mkdtempSync(os.tmpdir() + '/kf-aufnahme-');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const warte = (ms) => new Promise((r) => setTimeout(r, ms));

export async function starte({ w, h, mobile = true, touch = true, coarse = true, url = process.env.URL || 'http://127.0.0.1:8792/', vorScript = null }) {
  const prof = fs.mkdtempSync(DIR + '/prof-');
  const port = 9850 + Math.floor(Math.random() * 100);
  const c = spawn(CHROME, ['--headless=new', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`,
    '--autoplay-policy=no-user-gesture-required', ...(process.env.SWGL ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--disable-gpu']), `--window-size=${w},${h}`, 'about:blank'], { stdio: 'ignore' });
  console.log('CHROME_PID', c.pid);
  // Chrome endet mit diesem Programm – auch bei Abbruch, Fehler oder Strg+C. Vorher blieb er nach jedem abgebrochenen Lauf
  // unsichtbar liegen: am 18.11.2026 liefen 19 solche Fenster seit bis zu drei Tagen und fragten den Sandkasten weiter ab.
  const chromeWeg = () => { try { process.kill(c.pid); } catch (e) {} };
  process.on('exit', chromeWeg);
  for (const s of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.once(s, () => { chromeWeg(); process.exit(130); });
  let ziel;
  for (let i = 0; i < 60 && !ziel; i++) { await warte(200); try { ziel = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch (e) {} }
  const ws = new WebSocket(ziel.webSocketDebuggerUrl); await new Promise((r) => ws.onopen = r);
  let id = 0; const offen = new Map(); const fehler = []; const navs = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data);
    if (d.id && offen.has(d.id)) { offen.get(d.id)(d); offen.delete(d.id); return; }
    if (d.method === 'Runtime.exceptionThrown') fehler.push('EXC ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).slice(0, 300));
    if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') fehler.push('LOG ' + d.params.entry.text.slice(0, 200) + ' ' + (d.params.entry.url || ''));
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') fehler.push('CON ' + d.params.args.map(a => a.value ?? a.description).join(' ').slice(0, 300));
    if (d.method === 'Page.frameNavigated' && !d.params.frame.parentId) navs.push(d.params.frame.url);
  };
  const sende = (method, params = {}) => new Promise((r) => { const n = ++id; offen.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  if (mobile || touch) await sende('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile });
  if (touch) await sende('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  if (coarse) await sende('Emulation.setEmulatedMedia', { features: [{ name: 'pointer', value: 'coarse' }, { name: 'hover', value: 'none' }] });
  else await sende('Emulation.setEmulatedMedia', { features: [{ name: 'pointer', value: 'fine' }, { name: 'hover', value: 'hover' }] });
  await sende('Runtime.enable'); await sende('Log.enable'); await sende('Page.enable');
  if (vorScript) await sende('Page.addScriptToEvaluateOnNewDocument', { source: vorScript });
  await sende('Page.navigate', { url });
  await warte(5000);
  const ev = async (expr) => { const r = await sende('Runtime.evaluate', { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true, userGesture: true });
    if (r.result?.exceptionDetails) return 'EVALFEHLER ' + (r.result.exceptionDetails.exception?.description || '').slice(0, 200);
    return r.result?.result?.value; };
  await ev(`document.getElementById('eingefroren')?.remove(); try{spracheSetzen('de')}catch(e){}; await new Promise(r=>setTimeout(r,800)); return 1`);
  const T = (type, pts) => sende('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y]) => ({ x, y, radiusX: 8, radiusY: 8, force: 1, id: 1 })) });
  // Finger: Tipp
  const tipp = async (x, y) => { await T('touchStart', [[x, y]]); await warte(60); await T('touchEnd', []); await warte(350); };
  // Finger: Wisch mit Zwischenschritten; mid() optional während des Ziehens (vor Loslassen)
  const wisch = async (x0, y0, x1, y1, { schritte = 12, dauer = 300, mid = null, halten = 0 } = {}) => {
    await T('touchStart', [[x0, y0]]); await warte(30);
    for (let i = 1; i <= schritte; i++) { await T('touchMove', [[x0 + (x1 - x0) * i / schritte, y0 + (y1 - y0) * i / schritte]]); await warte(dauer / schritte); }
    if (halten) await warte(halten);
    let m = null; if (mid) m = await mid();
    await T('touchEnd', []); await warte(400); return m; };
  // Zwei Finger: von (a0,b0) nach (a1,b1), je Finger [x,y]
  const T2 = (type, pts) => sende('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], i) => ({ x, y, radiusX: 8, radiusY: 8, force: 1, id: i + 1 })) });
  const zwei = async (a0, b0, a1, b1, { schritte = 14, dauer = 400 } = {}) => {
    await T2('touchStart', [a0, b0]); await warte(30);
    for (let i = 1; i <= schritte; i++) { const q = i / schritte; await T2('touchMove', [[a0[0] + (a1[0] - a0[0]) * q, a0[1] + (a1[1] - a0[1]) * q], [b0[0] + (b1[0] - b0[0]) * q, b0[1] + (b1[1] - b0[1]) * q]]); await warte(dauer / schritte); }
    await T2('touchEnd', []); await warte(400); };
  const maus = async (x, y) => { for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await sende('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); await warte(350); };
  const bild = async (name) => { const b = await sende('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${DIR}/${name}.png`, Buffer.from(b.result.data, 'base64')); return `${DIR}/${name}.png`; };
  const box = (sel) => ev(`const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; const r=e.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2), l:Math.round(r.left), t:Math.round(r.top), r:Math.round(r.right), b:Math.round(r.bottom), w:Math.round(r.width), h:Math.round(r.height), sichtbar: r.width>0 && getComputedStyle(e).visibility!=='hidden'}`);
  const ende = async () => { ws.close(); try { process.kill(c.pid); } catch (e) {} await warte(500); fs.rmSync(prof, { recursive: true, force: true }); };
  return { sende, ev, tipp, wisch, zwei, maus, bild, box, fehler, navs, ende, pid: c.pid };
}
