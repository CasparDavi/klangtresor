#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   LIEDTEXTE VERMESSEN: SILBEN, HEBUNGEN, REIME, STECKBRIEF
   bin/textanalyse.js

   Herkunft: Die Rechnung ist in der KlangFeder entstanden (Entwicklung/KlangFeder, Liedtext-Werkstatt neben dem
   KlangTresor) und liegt unveraendert in bin/textanalyse/ - KERN_VERSION in bin/textanalyse/version.mjs nennt den
   Stand. Caspar_D, 08.11.2026: „wenn keine KI nötig ist oder nur lokal laufende kleine Modelle, dann ist
   KlangTresor der richtige Ort." Keine KI: Lautschrift aus zwei Woerterbuechern (ipa-dict Deutsch, CMUdict
   Englisch, beide in modelle/textanalyse/, geholt von der Einrichtung oder Profil → System), dazu Regeln.
   Gemessen gegen Haiders Golddaten (Gedichte): Deutsch 95,6 % der Silben / 82,8 % der Zeilen richtig, Englisch
   90,6 / 67,5 (Messreihe in KlangFeder/docs/PRUEFSTAND.md). Fuer Liedtexte gibt es noch keine Pruefmenge.
   Wer die Rechnung aendert, aendert sie in der KlangFeder und holt sie hierher - eine Rechnung, nicht zwei.

   WARUM EIN EIGENER PROZESS: Die Woerterbuecher belegen geladen gut 340 MB und brauchen gut eine Sekunde
   (gemessen 08.11.2026). Im server.js laegen sie meist ungenutzt; darum rechnet dieser Prozess - im Morgenlauf
   fuer den ganzen Bestand und auf Abruf (--dienst) fuer den Server, der ihn bei Bedarf startet. Nach zehn
   Minuten ohne Anfrage endet er von selbst.

   Ergebnis: library/textanalyse.json.gz, eine Datei (exFAT belegt je Datei ein ganzes Megabyte):
     { kern, stand, songs: { <id>: { hash, sprache, zeilen, steckbrief } } }
   Neu gerechnet wird ein Song nur, wenn sich sein Liedtext (hash) oder die KERN_VERSION geaendert hat.
   Analysiert werden die eingereichten Lyrics (Caspar_D, 08.11.2026: 2a), nicht der bereinigte Text.
   Texte in fremder Schrift (kyrillisch, japanisch …) stehen mit sprache 'fremd' und ohne Zeilen drin.

     node bin/textanalyse.js            den Bestand nachrechnen (Morgenlauf)
     node bin/textanalyse.js --dienst   Anfragen des Servers ueber IPC beantworten
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');

const WURZEL = path.join(__dirname, '..');
const DATEI = path.join(WURZEL, 'library', 'textanalyse.json.gz');
const DATEN = path.join(require('./modellordner.js').modellOrdner(), 'textanalyse');
const LEERLAUF = 10 * 60 * 1000;

/* Die Version, ohne den Kern zu laden - der Server braucht sie, um gespeicherte Ergebnisse zu pruefen. */
function kernVersion() {
  try { return (fs.readFileSync(path.join(__dirname, 'textanalyse', 'version.mjs'), 'utf8').match(/KERN_VERSION\s*=\s*'([^']+)'/) || [])[1] || null; }
  catch (e) { return null; }
}
/* Fehlt ein Woerterbuch oder liegt eine andere Fassung da (andere Groesse als im Datenausweis daten.json)?
   Die Pruefsumme rechnet bin/modelle-holen.js beim Holen; hier genuegt die Groesse, das kostet nichts. */
const AUSWEIS = JSON.parse(fs.readFileSync(path.join(__dirname, 'textanalyse', 'daten.json'), 'utf8')).dateien;
const WOERTERBUECHER = AUSWEIS.map(d => d.pfad);
const fehlend = () => AUSWEIS.filter(d => { try { return fs.statSync(path.join(DATEN, d.pfad)).size !== d.groesse; } catch (e) { return true; } }).map(d => d.pfad);
const hash = (text) => crypto.createHash('sha1').update(String(text || ''), 'utf8').digest('hex').slice(0, 16);

let kern = null;
async function kernLaden() {
  if (kern) return kern;
  const url = (f) => pathToFileURL(path.join(__dirname, 'textanalyse', f)).href;
  (await import(url('pfade.mjs'))).setzeDaten(DATEN);
  const [a, s, sp, v] = await Promise.all(['analyse.mjs', 'steckbrief.mjs', 'sprache.mjs', 'version.mjs'].map(f => import(url(f))));
  kern = { anzeige: a.anzeige, steckbriefText: s.steckbriefText, steckbriefSet: s.steckbriefSet, spracheText: sp.spracheText, version: v.KERN_VERSION };
  return kern;
}

/* Ein Text → was gespeichert und gezeigt wird. */
function rechnen(k, text) {
  const sprache = k.spracheText(text).gesamt;
  if (sprache === 'fremd') return { sprache, zeilen: [], steckbrief: null };
  return { sprache, zeilen: k.anzeige(text), steckbrief: k.steckbriefText(text) };
}

function lesen() {
  try { return JSON.parse(zlib.gunzipSync(fs.readFileSync(DATEI)).toString('utf8')); } catch (e) { return null; }
}
function schreiben(daten) {
  const teil = DATEI + '.teil';
  fs.writeFileSync(teil, zlib.gzipSync(Buffer.from(JSON.stringify(daten), 'utf8'), { level: 9 }));
  fs.renameSync(teil, DATEI);
}

/* Der Server fragt hier an. Ein Kindprozess fuer alle Anfragen; er startet beim ersten Bedarf und endet nach
   LEERLAUF von selbst. Antwort: Promise mit dem Ergebnis, oder Fehler mit Grund (z. B. Woerterbuecher fehlen). */
let kind = null, nummer = 0;
function anfrage(auftrag) {
  if (fehlend().length) return Promise.reject(Object.assign(new Error('Wörterbücher fehlen'), { fehlen: fehlend() }));
  /* Neue Rechnung eingespielt (Update), der Helfer laeuft aber noch mit der alten im Speicher: dann neu starten,
     sonst rechnete er bis zu zehn Minuten lang nach dem alten Stand (08.11.2026, Kern .5 → .6). Jeder Helfer fuehrt
     seine eigenen offenen Anfragen - endet der alte, trifft das nur seine. */
  if (kind && kind.kern !== kernVersion()) { try { kind.kill(); } catch (e) {} kind = null; }
  if (!kind) {
    const k = require('node:child_process').fork(__filename, ['--dienst'], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'], windowsHide: true });
    k.kern = kernVersion(); k.offen = new Map();
    k.on('message', (m) => { const o = k.offen.get(m.nr); if (!o) return; k.offen.delete(m.nr);
      if (m.fehler) o.nein(new Error(m.fehler)); else o.ja(m.ergebnis); });
    k.on('exit', () => { if (kind === k) kind = null; for (const o of k.offen.values()) o.nein(new Error('Textanalyse beendet')); k.offen.clear(); });
    kind = k;
  }
  const k = kind;
  return new Promise((ja, nein) => { const nr = ++nummer; k.offen.set(nr, { ja, nein }); k.send({ nr, ...auftrag }); });
}

async function dienst() {
  let uhr = null;
  const wecken = () => { clearTimeout(uhr); uhr = setTimeout(() => process.exit(0), LEERLAUF); };
  wecken();
  process.on('disconnect', () => process.exit(0));
  process.on('message', async (m) => {
    wecken();
    try {
      const k = await kernLaden();
      let ergebnis;
      if (m.art === 'text') ergebnis = { kern: k.version, ...rechnen(k, m.text) };
      else if (m.art === 'set') ergebnis = { kern: k.version, steckbrief: k.steckbriefSet(m.texte, m.titel || 'Set') };
      else throw new Error('unbekannte Anfrage');
      process.send({ nr: m.nr, ergebnis });
    } catch (e) { process.send({ nr: m.nr, fehler: (e && e.message) || String(e) }); }
  });
}

async function bestand() {
  const { T } = require('./sprache.js');
  const fehlen = fehlend();
  if (fehlen.length) require('./fehlt.js').fehlt(T('Liedtext-Analyse'), fehlen.map(f => 'textanalyse/' + f));
  const katalog = require('./katalog.js').lesen();
  if (!katalog) { console.error('  ' + T('Kein Katalog.')); process.exit(1); }
  const k = await kernLaden();
  const alt = lesen();
  const altSongs = alt && alt.kern === k.version ? alt.songs || {} : {};
  const songs = {};
  let neu = 0, gleich = 0, fremd = 0;
  for (const s of Object.values(katalog.songs)) {
    if (!s.lyrics || !s.lyrics.trim()) continue;
    const h = hash(s.lyrics);
    if (altSongs[s.id] && altSongs[s.id].hash === h) { songs[s.id] = altSongs[s.id]; gleich++; continue; }
    songs[s.id] = { hash: h, ...rechnen(k, s.lyrics) };
    if (songs[s.id].sprache === 'fremd') fremd++;
    neu++;
  }
  const weg = Object.keys(alt && alt.songs || {}).filter(id => !songs[id]).length;
  if (neu || weg || !alt || alt.kern !== k.version) schreiben({ kern: k.version, stand: new Date().toISOString(), songs });
  console.log('  ' + T('Liedtexte: {neu} neu gerechnet, {gleich} unverändert, {weg} entfallen (Rechnung {kern})',
    { neu, gleich, weg, kern: k.version }) + (fremd ? ' · ' + T('{n} in fremder Schrift', { n: fremd }) : ''));
}

if (require.main !== module) {
  module.exports = { anfrage, lesen, hash, kernVersion, fehlend, DATEI, DATEN, WOERTERBUECHER };
} else if (process.argv.includes('--dienst')) {
  dienst();
} else {
  bestand().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
}
