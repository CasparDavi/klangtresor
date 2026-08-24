#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Holt die KI-Modelle einmalig nach library/modelle/. Sie liegen NICHT
 * im Paket (library/ ist Archiv, nicht Programm), darum dieser Schritt.
 *
 *   node bin/modelle-holen.js        oder  npm run modelle
 *
 * WAS GEHOLT WIRD und unter welchen Bedingungen es steht - die volle
 * Auskunft samt Nennpflichten in web/fremd/LIZENZEN.md:
 *
 *   htdemucs_6s (246 MB)   Stemtrennung. MIT, Copyright (c) Meta
 *                          Platforms; der ONNX-Export MIT, StemSplit.
 *   Discogs-EffNet (18 MB) Merkmalsextraktor, und drei Koepfe fuer
 *   + drei Koepfe          Musikstil, Instrument und Stimmung. Alle vier
 *                          von der Music Technology Group der Universitat
 *                          Pompeu Fabra, CC BY-NC-ND 4.0 - Namensnennung,
 *                          nicht kommerziell, keine Weitergabe
 *                          veraenderter Fassungen.
 *
 * Zwei Dinge waren hier bis zum 24.08.2026 falsch. Erstens stand als
 * Lizenz "CC BY-NC-SA" - es ist ND: SA erlaubt Bearbeitungen unter
 * gleichen Bedingungen, ND verbietet ihre Weitergabe ganz. Zweitens kam
 * das EffNet von Caspar_Ds eigener GitHub-Seite statt von der UPF; jetzt
 * holt es jeder an der Quelle, und die Nennung geht mit.
 *
 * Vorhandene Dateien werden uebersprungen; eine kaputte (zu kleine) wird
 * neu geholt.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ZIEL = path.join(__dirname, '..', 'library', 'modelle');
const E = 'https://essentia.upf.edu/models';
const DATEIEN = [
  /* Die Stemtrennung. Mit Abstand die groesste Datei - wer nur den
     Klangraum will, kann sie sich sparen; bin/stems.js sagt dann, dass
     sie fehlt. */
  ['htdemucs_6s.onnx',                              'https://huggingface.co/StemSplitio/htdemucs-6s-onnx/resolve/main/htdemucs_6s.onnx', 258000000],
  ['discogs-effnet-bsdynamic-1.onnx',               `${E}/feature-extractors/discogs-effnet/discogs-effnet-bsdynamic-1.onnx`, 18000000],
  ['discogs-effnet-bs64-1.json',                    `${E}/feature-extractors/discogs-effnet/discogs-effnet-bs64-1.json`, 10000],
  ['mtg_jamendo_genre-discogs-effnet-1.onnx',       `${E}/classification-heads/mtg_jamendo_genre/mtg_jamendo_genre-discogs-effnet-1.onnx`, 2700000],
  ['mtg_jamendo_genre-discogs-effnet-1.json',       `${E}/classification-heads/mtg_jamendo_genre/mtg_jamendo_genre-discogs-effnet-1.json`, 3000],
  ['mtg_jamendo_moodtheme-discogs-effnet-1.onnx',   `${E}/classification-heads/mtg_jamendo_moodtheme/mtg_jamendo_moodtheme-discogs-effnet-1.onnx`, 2700000],
  ['mtg_jamendo_moodtheme-discogs-effnet-1.json',   `${E}/classification-heads/mtg_jamendo_moodtheme/mtg_jamendo_moodtheme-discogs-effnet-1.json`, 3000],
  ['mtg_jamendo_instrument-discogs-effnet-1.onnx',  `${E}/classification-heads/mtg_jamendo_instrument/mtg_jamendo_instrument-discogs-effnet-1.onnx`, 2700000],
  ['mtg_jamendo_instrument-discogs-effnet-1.json',  `${E}/classification-heads/mtg_jamendo_instrument/mtg_jamendo_instrument-discogs-effnet-1.json`, 3000],
];

/* Holen mit Rueckfall (22.08.2026, Tarja unter Windows: "fetch failed"):
   1. Nodes fetch (drei Versuche, die Ursache wird genannt - DNS, TLS, Proxy),
   2. curl (liegt Windows 10/11, macOS und Linux bei; kennt Proxy und
      Systemzertifikate), 3. Anleitung zum Holen von Hand. */
const { spawnSync } = require('node:child_process');
const schlaf = (ms) => new Promise(r => setTimeout(r, ms));
async function perFetch(url, mindestens) {
  let letzter = null;
  for (let versuch = 1; versuch <= 3; versuch++) {
    try {
      const r = await fetch(url, { redirect: 'follow' });
      if (!r.ok) { letzter = `HTTP ${r.status}`; break; }
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < mindestens) { letzter = `zu klein (${buf.length} Bytes)`; break; }
      return { buf };
    } catch (e) {
      const c = e.cause || {};
      letzter = [e.message, c.code, c.message].filter(Boolean).join(' / ');
      await schlaf(800 * versuch);
    }
  }
  return { fehler: letzter };
}
function perCurl(url, f, mindestens) {
  const r = spawnSync('curl', ['-L', '--fail', '--silent', '--show-error', '-o', f, url], { encoding: 'utf8' });
  if (r.error) return { fehler: 'kein curl' };
  if (r.status !== 0) return { fehler: (r.stderr || '').trim() || `curl ${r.status}` };
  const n = fs.existsSync(f) ? fs.statSync(f).size : 0;
  if (n < mindestens) { try { fs.rmSync(f); } catch (e) {} return { fehler: `zu klein (${n} Bytes)` }; }
  return { n };
}

(async () => {
  fs.mkdirSync(ZIEL, { recursive: true });
  let geholt = 0; const offen = [];
  for (const [name, url, mindestens] of DATEIEN) {
    const f = path.join(ZIEL, name);
    if (fs.existsSync(f) && fs.statSync(f).size >= mindestens) { console.log(`  vorhanden  ${name}`); continue; }
    process.stdout.write(`  hole       ${name} … `);
    const a = await perFetch(url, mindestens);
    if (a.buf) { fs.writeFileSync(f, a.buf); geholt++; console.log(`${(a.buf.length / 1048576).toFixed(1)} MB`); continue; }
    process.stdout.write(`fetch: ${a.fehler} → curl … `);
    const b = perCurl(url, f, mindestens);
    if (b.n) { geholt++; console.log(`${(b.n / 1048576).toFixed(1)} MB`); continue; }
    console.log(`FEHLER (${b.fehler})`); offen.push([name, url]); process.exitCode = 1;
  }
  const da = DATEIEN.filter(([n, , m]) => fs.existsSync(path.join(ZIEL, n)) && fs.statSync(path.join(ZIEL, n)).size >= m).length;
  console.log(`  Modelle: ${geholt} geholt, ${da} von ${DATEIEN.length} vorhanden → library/modelle/`);
  if (offen.length) {
    console.log(`\n  ${offen.length} Datei(en) kamen nicht an. Von Hand: im Browser öffnen, "Speichern unter" nach\n    ${ZIEL}\n  mit genau diesem Dateinamen:`);
    for (const [n, u] of offen) console.log(`    ${n}\n      ${u}`);
    console.log('  Danach node bin/modelle-holen.js noch einmal - Vorhandenes wird übersprungen.\n  Hinter einem Proxy: HTTPS_PROXY=http://proxy:port setzen (curl liest das), oder die Dateien von Hand holen.');
  }
})().catch(e => { console.error('  Modelle holen brach ab:', e.message, e.cause ? '/ ' + (e.cause.code || e.cause.message) : ''); process.exit(1); });
