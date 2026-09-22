/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ============================================================
   Mitschnitt · der Wächter über einen Abruf
   ------------------------------------------------------------
   Schreibt jede HTTP-Anfrage eines Laufs mit: Adresse, Verfahren,
   Antwortkennzahl, Größe, Art des Inhalts — und bei JSON die
   OBERSTEN SCHLÜSSEL der Antwort. Damit lässt sich sehen, ob ein
   Endpunkt seine Gestalt geändert hat, ohne den Inhalt zu lesen.

   Entstanden am 22.09.2026, als Caspar_D meldete: „Suno scheint
   einen Endpunkt verändert zu haben, die Morgenroutine bekommt
   Probleme." Die Adressen antworteten alle mit 200 — die Frage
   war also nicht OB, sondern WAS sie antworten.

   Er greift NICHT in den Code ein, den er beobachtet: er wird dem
   Lauf vorangestellt und hängt sich an http, https und fetch.

   Aufruf:
     node -r ./bin/mitschnitt.js bin/<skript>.js [Argumente]

   Schalter über Umgebungsvariablen:
     MITSCHNITT_VOLL=1     auch die Antwortkörper sichern (je Anfrage
                           eine Datei; kann groß werden)
     MITSCHNITT_ORT=<Pfad> anderer Ablageort

   Der Mitschnitt landet unter labor/mitschnitt/ und ist in
   .gitignore: er enthält Suno-Daten und gehört nicht ins Repo.
   ============================================================ */

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');

const WURZEL = path.join(__dirname, '..');

/* DER SCHALTER. Die Suno-Skripte laden diesen Waechter mit einer Zeile ganz oben - aber er
   tut nur etwas, wenn die Marke `labor/mitschnitt/AN` liegt. So kann der Mitschnitt an- und
   ausgeschaltet werden, ohne die Skripte wieder anzufassen, und er laeuft nicht aus
   Versehen bei jedem Morgenlauf mit.
   Gebaut am 22.09.2026, weil der Server jeden Morgenschritt als eigenen Prozess startet:
   ueber NODE_OPTIONS ginge es auch, aber das haette einen Neustart seines Servers verlangt,
   und Port 8788 gehoert Caspar_D. */
if (!fs.existsSync(path.join(WURZEL, 'labor', 'mitschnitt', 'AN'))) return;
const ORT = process.env.MITSCHNITT_ORT || path.join(WURZEL, 'labor', 'mitschnitt');
const VOLL = process.env.MITSCHNITT_VOLL === '1';
fs.mkdirSync(ORT, { recursive: true });

const marke = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const PROTOKOLL = path.join(ORT, marke + '.ndjson');
const KOERPER = path.join(ORT, marke + '-koerper');
if (VOLL) fs.mkdirSync(KOERPER, { recursive: true });

let nr = 0;
const t0 = Date.now();

function schreib(satz) {
  try { fs.appendFileSync(PROTOKOLL, JSON.stringify(satz) + '\n'); } catch (e) { /* ein Waechter darf nie den Lauf anhalten */ }
}

/* DIE GESTALT EINER ANTWORT, NICHT IHR INHALT. Von einem Objekt die obersten Schlüssel,
   von einer Liste ihre Länge und die Schlüssel des ersten Eintrags. Das genügt, um zu
   sehen, dass ein Feld verschwunden oder dazugekommen ist - und es schreibt keine
   Liedtexte, keine Namen und keine Adressen mit. */
function gestalt(text, art) {
  if (!text) return { leer: true };
  if (!/json/i.test(art || '')) return { art: art || 'unbekannt', zeichen: text.length, anfang: text.slice(0, 90) };
  let d;
  try { d = JSON.parse(text); } catch (e) { return { art, kaputtesJSON: true, zeichen: text.length, anfang: text.slice(0, 120) }; }
  const beschreibe = (x, tiefe) => {
    if (x === null) return 'null';
    if (Array.isArray(x)) return tiefe > 1 ? 'Liste[' + x.length + ']'
      : { liste: x.length, erster: x.length ? beschreibe(x[0], tiefe + 1) : null };
    if (typeof x === 'object') {
      const k = Object.keys(x);
      if (tiefe > 1) return 'Objekt{' + k.length + '}';
      const o = {};
      for (const s of k.slice(0, 40)) o[s] = typeof x[s] === 'object' && x[s] !== null
        ? beschreibe(x[s], tiefe + 1) : typeof x[s];
      if (k.length > 40) o['…weitere'] = k.length - 40;
      return o;
    }
    return typeof x;
  };
  return { art, zeichen: text.length, gestalt: beschreibe(d, 0) };
}

/* ---- fetch (der Weg, den die neueren Skripte gehen) ---------------------------------- */
if (typeof globalThis.fetch === 'function') {
  const alt = globalThis.fetch;
  globalThis.fetch = async function (eingabe, opt) {
    const n = ++nr;
    const url = typeof eingabe === 'string' ? eingabe : (eingabe && eingabe.url) || String(eingabe);
    const verfahren = (opt && opt.method) || (eingabe && eingabe.method) || 'GET';
    const start = Date.now();
    try {
      const antwort = await alt.apply(this, arguments);
      /* Den Körper NUR über einen Klon lesen - der Aufrufer bekommt seinen unberührt. */
      let g = null;
      try {
        const klon = antwort.clone();
        const text = await klon.text();
        g = gestalt(text, antwort.headers.get('content-type'));
        if (VOLL) fs.writeFileSync(path.join(KOERPER, String(n).padStart(4, '0') + '.txt'), text);
      } catch (e) { g = { koerperNichtLesbar: String(e && e.message || e) }; }
      schreib({ n, ms: Date.now() - start, seit: Date.now() - t0, weg: 'fetch', verfahren, url,
                status: antwort.status, ok: antwort.ok, antwort: g });
      return antwort;
    } catch (e) {
      schreib({ n, ms: Date.now() - start, seit: Date.now() - t0, weg: 'fetch', verfahren, url,
                fehler: String(e && e.message || e) });
      throw e;
    }
  };
}

/* ---- http/https.request (der Weg der älteren Skripte) -------------------------------- */
function haenge(modul, name) {
  const alt = modul.request;
  modul.request = function (...a) {
    const n = ++nr;
    const start = Date.now();
    let url = '';
    try {
      if (typeof a[0] === 'string') url = a[0];
      else if (a[0] instanceof URL) url = a[0].href;
      else if (a[0] && typeof a[0] === 'object') url = name + '://' + (a[0].hostname || a[0].host || '') + (a[0].path || '');
    } catch (e) { url = '?'; }
    const anfrage = alt.apply(this, a);
    anfrage.on('response', res => {
      const stuecke = []; let zeichen = 0;
      res.on('data', c => { zeichen += c.length; if (stuecke.length < 400) stuecke.push(c); });
      res.on('end', () => {
        const text = Buffer.concat(stuecke).toString('utf8');
        if (VOLL) { try { fs.writeFileSync(path.join(KOERPER, String(n).padStart(4, '0') + '.txt'), text); } catch (e) {} }
        schreib({ n, ms: Date.now() - start, seit: Date.now() - t0, weg: name, verfahren: (a[0] && a[0].method) || 'GET',
                  url, status: res.statusCode, zeichenGesamt: zeichen,
                  antwort: gestalt(text, res.headers && res.headers['content-type']) });
      });
    });
    anfrage.on('error', e => schreib({ n, ms: Date.now() - start, seit: Date.now() - t0, weg: name, url,
                                       fehler: String(e && e.message || e) }));
    return anfrage;
  };
}
haenge(http, 'http');
haenge(https, 'https');

/* ---- Abschluss ----------------------------------------------------------------------- */
process.on('exit', code => {
  schreib({ ende: true, anfragen: nr, dauerMs: Date.now() - t0, code });
  try {
    process.stderr.write('\n  Mitschnitt: ' + nr + ' Anfragen → ' + path.relative(WURZEL, PROTOKOLL) + '\n');
    if (VOLL) process.stderr.write('  Antwortkörper: ' + path.relative(WURZEL, KOERPER) + '\n');
  } catch (e) {}
});

process.stderr.write('  Mitschnitt läuft → ' + path.relative(WURZEL, PROTOKOLL) + (VOLL ? ' (mit Antwortkörpern)' : '') + '\n');
