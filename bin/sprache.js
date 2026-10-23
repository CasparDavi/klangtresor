/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   DIE SPRACHE DER KONSOLENPROGRAMME - EINRICHTUNG, AKTUALISIEREN, STARTEN
   bin/sprache.js

   Caspar_D, 23.10.2026: „kann man das im System erkennen, ob es russisch,
   deutsch und wenn das nicht, dann der englisch Fallback". Ja - aber das
   System selbst fragen, nicht Node: Node raet aus LANG, und das ist leer,
   wenn man per Doppelklick startet (auf Caspar_Ds Mac: System de-DE,
   Node en-US).

     Windows  (Get-UICulture).Name   die ANZEIGEsprache, nicht das
                                     Regionsformat
     macOS    defaults read -g AppleLanguages   die erste bevorzugte
     Linux    LC_ALL, LC_MESSAGES, LANG

   ru* -> ru, de* -> de, alles andere -> en. KT_SPRACHE in der Umgebung
   schlaegt alles (so reicht die Einrichtung ihre Wahl an die Kinder
   weiter, und der Umschalter auf der Einrichtungsseite setzt sie).

   DIE TEXTE: der deutsche Satz steht im Code und ist der Schluessel -
   wie sag() im Effektclip-Studio. Uebersetzungen liegen in bin/texte/*.json
   als { "<deutscher Satz>": { "en": "…", "ru": "…" } }. Platzhalter {name}
   werden mit vars gefuellt. Fehlt eine Uebersetzung, kommt Englisch, fehlt
   auch das, der deutsche Satz - nie ein Schluessel.

     const { T } = require('./sprache.js');
     matt(T('Hier sind nur {mb} frei.', { mb: MB(platz) }));
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SPRACHEN = ['de', 'en', 'ru'];
const zuSprache = (s) => { s = String(s || '').toLowerCase(); return s.startsWith('ru') ? 'ru' : s.startsWith('de') ? 'de' : 'en'; };

/* Was das System sagt, roh (z. B. „ru-RU", „de_DE.UTF-8") - oder null. */
function systemSprache() {
  try {
    if (process.platform === 'win32') {
      const r = spawnSync('powershell', ['-NoProfile', '-Command', '(Get-UICulture).Name'], { encoding: 'utf8', timeout: 8000 });
      const s = String(r.stdout || '').trim();
      if (s) return s;
    } else if (process.platform === 'darwin') {
      const r = spawnSync('defaults', ['read', '-g', 'AppleLanguages'], { encoding: 'utf8', timeout: 5000 });
      const m = /"?([A-Za-z]{2}[-_A-Za-z]*)"?/.exec(String(r.stdout || '').replace(/[()\s]/g, ''));
      if (m) return m[1];
    }
  } catch (e) {}
  return process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || null;
}

let gewaehlt = null;
function sprache() {
  if (gewaehlt) return gewaehlt;
  const e = process.env.KT_SPRACHE;
  gewaehlt = SPRACHEN.includes(e) ? e : zuSprache(systemSprache());
  process.env.KT_SPRACHE = gewaehlt;          /* die Kinder erben sie */
  return gewaehlt;
}
function spracheSetzen(s) {
  if (!SPRACHEN.includes(s)) return;
  gewaehlt = s; process.env.KT_SPRACHE = s;
}

let TEXTE = null;
function texte() {
  if (TEXTE) return TEXTE;
  TEXTE = {};
  const ordner = path.join(__dirname, 'texte');
  try {
    for (const f of fs.readdirSync(ordner)) {
      if (!f.endsWith('.json') || f.startsWith('.')) continue;
      try { Object.assign(TEXTE, JSON.parse(fs.readFileSync(path.join(ordner, f), 'utf8'))); } catch (e) {}
    }
  } catch (e) {}
  return TEXTE;
}

function fuellen(satz, vars) {
  if (!vars) return satz;
  return satz.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ''));
}

/* WAS SCHON DASTEHT, WECHSELT MIT (23.10.2026, Probe der Einrichtungsseite): ein Sprachwechsel mitten in
   der Einrichtung liess Schrittliste, offene Frage und Erklaerung in der alten Sprache stehen - ein Gemisch.
   T() merkt sich darum, aus welchem deutschen Satz jeder ausgegebene Text entstand, und neuUebersetzen()
   tauscht in einem Zustandsobjekt jeden so entstandenen Text gegen die neue Sprache. Zusammengesetztes
   (T(...) + ' (Chrome)') erkennt es nicht - das bleibt bis zur naechsten Meldung stehen. */
const HERKUNFT = new Map();   /* ausgegebener Text -> { de, vars } */

/* Der Satz in der gewaehlten Sprache. de: der deutsche Satz mit {platzhaltern}. */
function T(de, vars) {
  const s = sprache();
  const e = s === 'de' ? null : texte()[de];
  const aus = fuellen((e && (e[s] || e.en)) || de, vars);
  if (HERKUNFT.size > 20000) HERKUNFT.clear();
  HERKUNFT.set(aus, { de, vars });
  return aus;
}

/* Eingesetzte Werte, die selbst aus T() stammen („liegt {grund}" mit grund = T('in einem Temp-Ordner')), mit. */
function neuWerte(vars) {
  if (!vars) return vars;
  const n = {};
  for (const [k, x] of Object.entries(vars)) { const h = typeof x === 'string' && HERKUNFT.get(x); n[k] = h ? T(h.de, neuWerte(h.vars)) : x; }
  return n;
}
/* Alle Zeichenketten in obj (tief), die T() erzeugt hat, in der jetzigen Sprache neu setzen. */
function neuUebersetzen(obj, tiefe = 0) {
  if (!obj || typeof obj !== 'object' || tiefe > 8) return obj;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'string') { const h = HERKUNFT.get(v); if (h) obj[k] = T(h.de, neuWerte(h.vars)); }
    else if (v && typeof v === 'object') neuUebersetzen(v, tiefe + 1);
  }
  return obj;
}

module.exports = { T, sprache, spracheSetzen, neuUebersetzen, systemSprache, zuSprache, SPRACHEN };

if (require.main === module) console.log(`  System: ${systemSprache()} -> ${sprache()}`);
