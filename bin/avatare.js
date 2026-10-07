#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   DIE AVATARE DER GEMEINSCHAFT HOLEN
   bin/avatare.js

     node bin/avatare.js           was fehlt, wird geholt
     node bin/avatare.js --test 20 nur zwanzig, zum Ansehen

   WOFUER. Caspar_D, 07.10.2026: „auch bei den Groupies wäre eine Gesichtserkennung hilfreich" - und auf die
   Frage, wie: „Server holt und speichert". Bisher kamen die Avatare im Groupieschaum live von Sunos Bildserver.
   Jetzt holt dieser Schritt jeden einmal nach library/avatare/ (Dateiname = SHA-1 der Adresse), bin/gesichter.js
   sucht darin die Gesichter, und Schaum und Plakat nehmen die eigene Kopie - schneller, und auch ohne Netz.

   WOHER DIE ADRESSEN. Aus /api/community des laufenden Servers - dort sammelt er die Leute aus Reaktionen,
   Liker-Listen und Beobachtern; diese Sammlung wird hier nicht ein zweites Mal gebaut. Der Morgenlauf gibt den
   Port mit (KLANGTRESOR_PORT); laeuft kein Server, sagt der Schritt das und tut nichts.

   DAS BUCH. library/avatare.json: je Adresse die Datei, ihre Groesse, wann geholt; was nicht zu bekommen war,
   steht unter `fehlt` mit Grund und wird nach 1, 2, 4 ... hoechstens 30 Tagen wieder versucht (wie beim Ton).
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const melden = require('./melden.js');

const WURZEL = path.join(__dirname, '..');
const ORDNER = path.join(WURZEL, 'library', 'avatare');
const BUCH = path.join(WURZEL, 'library', 'avatare.json');
const PORT = Number(process.env.KLANGTRESOR_PORT) || 8788;
const TEST = (() => { const i = process.argv.indexOf('--test'); return i >= 0 ? Number(process.argv[i + 1]) || 0 : 0; })();
/* Die Art steht in den ersten Bytes - Sunos Bildserver schickt manche webp als „binary/octet-stream". */
const artVon = (b) => b[0] === 0xff && b[1] === 0xd8 ? 'jpg' : b.slice(0, 4).toString('hex') === '89504e47' ? 'png'
  : b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP' ? 'webp' : b.slice(0, 4).toString() === 'GIF8' ? 'gif' : null;
const KANTE = 1024;   /* laengste Seite der Kopie: reicht fuer eine Groupie-Zelle auf dem 70er-Plakat bei 300 dpi */
const TAG = 24 * 3600 * 1000;

function buchLesen() {
  try { const b = JSON.parse(fs.readFileSync(BUCH, 'utf8')); if (b && b.bilder) return { bilder: b.bilder, fehlt: b.fehlt || {} }; } catch (e) {}
  return { bilder: {}, fehlt: {} };
}
function buchSchreiben(b) { const n = `${BUCH}.neu-${process.pid}`; fs.writeFileSync(n, JSON.stringify(b)); fs.renameSync(n, BUCH); }
const wartet = (e, jetzt) => { if (!e) return false; const am = Date.parse(e.am); if (!Number.isFinite(am)) return false;
  return jetzt < am + Math.min(30, 2 ** Math.min(Math.max(1, e.versuche | 0) - 1, 5)) * TAG; };

/* EIN LAUF ZUR ZEIT (wie bin/gesichter.js): Morgenlauf und „Bilder vorbereiten" beim Oeffnen eines Schaums. */
const SPERRE = path.join(WURZEL, 'library', 'avatare.lauf');
function sperren() {
  try { const pid = Number(fs.readFileSync(SPERRE, 'utf8')); if (pid && pid !== process.pid) { try { process.kill(pid, 0); return false; } catch (e) {} } } catch (e) {}
  try { fs.mkdirSync(path.dirname(SPERRE), { recursive: true }); fs.writeFileSync(SPERRE, String(process.pid)); } catch (e) {}
  return true;
}
function entsperren() { try { if (Number(fs.readFileSync(SPERRE, 'utf8')) === process.pid) fs.unlinkSync(SPERRE); } catch (e) {} }

async function holen(url) {
  const ab = new AbortController(), uhr = setTimeout(() => ab.abort(), 15000);
  try {
    const r = await fetch(url, { signal: ab.signal });
    if (!r.ok) return { grund: 'HTTP ' + r.status };
    const daten = Buffer.from(await r.arrayBuffer());
    if (daten.length < 200 || daten.length > 20 * 1024 * 1024) return { grund: 'Groesse ' + daten.length };
    const endung = artVon(daten);
    if (!endung) return { grund: 'kein Bild (' + (String(r.headers.get('content-type') || '?').split(';')[0]) + ')' };
    /* Abgelegt wird ein JPEG von hoechstens KANTE Punkten (manche Avatare sind 2 MB gross); kann ffmpeg das Bild
       nicht lesen (etwa ein bewegtes webp), bleibt das Original. */
    const e = spawnSync('ffmpeg', ['-v', 'error', '-i', 'pipe:0', '-frames:v', '1',
      '-vf', `scale=w='min(${KANTE},iw)':h='min(${KANTE},ih)':force_original_aspect_ratio=decrease`,
      '-f', 'image2pipe', '-c:v', 'mjpeg', '-q:v', '3', 'pipe:1'], { input: daten, maxBuffer: 32 << 20 });
    if (e.status === 0 && e.stdout && e.stdout.length > 200) return { daten: e.stdout, endung: 'jpg' };
    return { daten, endung };
  } catch (e) { return { grund: e.name === 'AbortError' ? 'zeit' : 'netz' }; }
  finally { clearTimeout(uhr); }
}

(async () => {
  if (!sperren()) { console.log('Avatare — läuft schon (anderer Lauf), nichts zu tun.\n'); return; }
  process.on('exit', entsperren);
  let leute = null;
  try { leute = (await (await fetch(`http://127.0.0.1:${PORT}/api/community`)).json()).leute; } catch (e) {}
  if (!Array.isArray(leute)) { console.log(`Avatare — der Server antwortet nicht auf Port ${PORT}; nichts geholt.\n`); return; }
  const adressen = [...new Set(leute.map(l => l && l.avatar).filter(u => typeof u === 'string' && /^https?:\/\//.test(u)))];
  const buch = buchLesen(), jetzt = Date.now();
  let offen = adressen.filter(u => { const e = buch.bilder[u]; return !(e && fs.existsSync(path.join(ORDNER, e.datei))) && !wartet(buch.fehlt[u], jetzt); });
  if (TEST) offen = offen.slice(0, TEST);
  console.log(`Avatare — ${offen.length} von ${adressen.length} zu holen\n`);
  fs.mkdirSync(ORDNER, { recursive: true });
  let n = 0, geholt = 0, daneben = 0;
  const eins = async (url) => {
    const r = await holen(url); n++;
    if (r.daten) {
      const datei = crypto.createHash('sha1').update(url).digest('hex') + '.' + r.endung, ziel = path.join(ORDNER, datei);
      fs.writeFileSync(ziel + '.teil', r.daten); fs.renameSync(ziel + '.teil', ziel);
      buch.bilder[url] = { datei, bytes: r.daten.length, geholt: new Date().toISOString() }; delete buch.fehlt[url]; geholt++;
    } else {
      const alt = buch.fehlt[url]; buch.fehlt[url] = { grund: r.grund, am: new Date().toISOString(), versuche: ((alt && alt.versuche) || 0) + 1 }; daneben++;
    }
    if (n % 50 === 0) { buchSchreiben(buch); console.log(`  [${n}/${offen.length}] ${geholt} geholt${daneben ? `, ${daneben} nicht` : ''}`); }
    melden.lauf({ was: 'Avatare werden geholt', n, von: offen.length, nEinheit: 'Avatar' });
  };
  /* vier zugleich - rücksichtsvoll gegen Sunos Bildserver (bei 4500 Leuten einige Minuten) */
  const schlange = offen.slice();
  await Promise.all(Array.from({ length: 4 }, async () => { while (schlange.length) await eins(schlange.shift()); }));
  buchSchreiben(buch);
  melden.ausLauf();
  console.log(`\n  ${geholt} Avatare geholt${daneben ? `, ${daneben} nicht zu bekommen (neuer Versuch später)` : ''} — ${Object.keys(buch.bilder).length} liegen bereit.`);
  console.log(`  Buch: ${path.relative(WURZEL, BUCH)}\n`);
})().catch((e) => { console.error('  FEHLER:', e.message); process.exit(1); });
