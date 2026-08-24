/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Holt einen frischen Suno-Token — ohne Browser.
 *
 *   node bin/token.js            Token holen und prüfen
 *   const T = require('./token.js'); await T.holen()   aus anderen Skripten
 *
 * ---------------------------------------------------------------------
 * WIE ES GEHT
 *
 * Suno meldet über Clerk an. Der Browser hält dafür ein Cookie namens
 * `__client` auf suno.com; daraus holt sich die Seite bei Bedarf einen
 * kurzlebigen Bearer-Token. Genau das tut dieses Skript auch — dasselbe
 * Verfahren, das die bekannten Open-Source-Wrapper (gcui-art/suno-api
 * u. a.) seit Jahren benutzen:
 *
 *   GET  auth.suno.com/v1/client                   → Session-ID
 *   POST auth.suno.com/v1/client/sessions/<sid>/tokens → frischer JWT
 *
 * Das Cookie ist der Schlüssel. Es liegt in geheim/suno-cookie.txt.
 *
 * ---------------------------------------------------------------------
 * DAS COOKIE EINMALIG HOLEN (Chrome, auf suno.com, angemeldet)
 *
 *   1. ⌘ + Alt + I  →  Reiter "Application"
 *   2. links: Storage → Cookies → https://suno.com
 *   3. Zeile `__client` suchen, Spalte "Value" kopieren
 *      (ein langer Text, beginnt meist mit "eyJ")
 *   4. in geheim/suno-cookie.txt speichern — nur den Wert, eine Zeile
 *
 * Es hält lange, aber nicht ewig. Verfällt es, antwortet Clerk mit 401,
 * dieses Skript sagt es, und du kopierst es neu.
 *
 * ---------------------------------------------------------------------
 * NIEMALS WEITERGEBEN
 *
 * Wer diese Datei hat, ist als Caspar_D angemeldet. geheim/ steht in
 * .gitignore mit eigenem Eintrag, das Weitergabe-ZIP entsteht aus
 * `git archive` und kann sie deshalb nicht enthalten, und bin/paket.js
 * prüft das noch einmal ausdrücklich. Trotzdem: nie kopieren, nie
 * zeigen, nie in einen Chat einfügen.
 */
const fs    = require('node:fs');
const path  = require('node:path');
const https = require('node:https');

const WURZEL  = path.join(__dirname, '..');
const COOKIE  = path.join(WURZEL, 'geheim', 'suno-cookie.txt');
const AUTH    = 'auth.suno.com';
/* Die Clerk-Fassung muß zur Seite passen; die Wrapper lesen sie von
   jsdelivr nach. Hier steht sie fest, weil der Wert selten wechselt —
   antwortet Clerk mit 400, hier zuerst nachsehen. */
const CLERK_API = '2025-11-10';
const CLERK_JS  = '5.43.0';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36';

function cookieLesen() {
  if (!fs.existsSync(COOKIE)) return null;
  const w = fs.readFileSync(COOKIE, 'utf8').trim();
  return w || null;
}

function anfrage(methode, pfad, cookie) {
  return new Promise((fertig) => {
    const req = https.request({ host: AUTH, path: pfad, method: methode,
      headers: { 'User-Agent': UA, Authorization: cookie,
                 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': 0 } },
      (a) => {
        let roh = '';
        a.on('data', s => roh += s);
        a.on('end', () => {
          let daten = null; try { daten = JSON.parse(roh); } catch (e) {}
          fertig({ status: a.statusCode, daten, roh: roh.slice(0, 200) });
        });
      });
    req.on('error', e => fertig({ status: 0, fehler: e.message }));
    req.end();
  });
}

/* Gemerkt wird der Token mit Ablauf; Clerk-JWTs leben rund eine Minute,
   deshalb wird zehn Sekunden vorher erneuert. */
let _token = null, _bis = 0, _sid = null;

async function holen() {
  if (_token && Date.now() < _bis - 10000) return _token;
  const cookie = cookieLesen();
  if (!cookie) throw new Error('Kein Cookie in geheim/suno-cookie.txt — Anleitung im Kopf von bin/token.js');

  const q = `?__clerk_api_version=${CLERK_API}&_clerk_js_version=${CLERK_JS}`;
  if (!_sid) {
    const a = await anfrage('GET', '/v1/client' + q, cookie);
    if (a.status === 401) throw new Error('Cookie abgelaufen — neu aus dem Browser kopieren (bin/token.js)');
    if (a.status !== 200) throw new Error(`Clerk /client: ${a.status} ${a.roh}`);
    _sid = a.daten && a.daten.response && a.daten.response.last_active_session_id;
    if (!_sid) throw new Error('Clerk nennt keine Session — Cookie gültig, aber nicht angemeldet?');
  }
  const b = await anfrage('POST', `/v1/client/sessions/${_sid}/tokens` + q, cookie);
  if (b.status !== 200 || !b.daten || !b.daten.jwt) {
    _sid = null;                                   // beim nächsten Mal neu
    throw new Error(`Clerk /tokens: ${b.status} ${b.roh}`);
  }
  _token = b.daten.jwt;
  /* Ablauf aus dem JWT lesen - exp steht im mittleren Teil. */
  try { const teil = JSON.parse(Buffer.from(_token.split('.')[1], 'base64url').toString());
        _bis = (teil.exp || 0) * 1000; } catch (e) { _bis = Date.now() + 50000; }
  return _token;
}

function vorhanden() { return !!cookieLesen(); }

module.exports = { holen, vorhanden, COOKIE };

if (require.main === module) {
  (async () => {
    try {
      const t = await holen();
      console.log(`\n  Token geholt (${t.length} Zeichen), gültig bis ${new Date(_bis).toLocaleTimeString('de-DE')}.`);
      /* Gegenprobe an einem Weg, der den Token braucht. */
      const a = await new Promise((f) => https.get({ host: 'studio-api-prod.suno.com',
        path: '/api/notification/v2/badge-count', headers: { Authorization: 'Bearer ' + t, 'User-Agent': UA } },
        r => { let s=''; r.on('data', d => s+=d); r.on('end', () => f({ status: r.statusCode, s })); }));
      console.log(`  Probe /api/notification/v2/badge-count: ${a.status} ${a.s.slice(0,60)}\n`);
    } catch (e) { console.error('\n  ' + e.message + '\n'); process.exit(1); }
  })();
}
