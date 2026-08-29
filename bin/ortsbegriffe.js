#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   ORTSBEGRIFFE  ·  bin/ortsbegriffe.js

   Fuer eine Stelle im Geschichten-Raum die Woerter finden, die sie
   beschreiben. Caspar_D, 29.08.2026: "Wie kriegen wir jetzt fuer den
   Raum, fuer Koordinaten in demselben heraus, welche Begriffe diese
   Stelle bestmoeglich beschreiben."

   Der Weg, am Eichkasten gemessen (docs/GESCHICHTEN-RAUM-EICHKASTEN.md):

   1. VOKABULAR = die Kondensat-Woerter des eigenen Bestands. Kein
      fremdes Woerterbuch: jedes Wort ist durch mindestens ein Lied
      belegt und kommt aus der Sprache des Autors.
   2. Jedes Wort wird mit DERSELBEN mpnet-ONNX-Strecke eingebettet wie
      die Lieder (bin/texte-einbetten.js) und liegt damit im selben
      768er-Raum. Einmal gerechnet, in library/wortvektoren.json
      abgelegt; neue Woerter werden nachgerechnet, verschwundene
      entfernt.
   3. SOCKEL: Ein Wort beschreibt eine Stelle nur, wenn es ihr deutlich
      naeher ist, als es dem Gesamtbestand im Mittel ist - dieselbe
      Idee wie beim Achsen-Sockel (library/achsen-sockel.json). Ohne
      den Abzug gewinnen die Woerter der Raummitte.
   4. BELEGPFLICHT: Kandidaten sind nur die Woerter der zwanzig
      naechstliegenden Lieder. Subword-Einbettungen klumpen Komposita
      ("Zungenbrecher" stand sonst ueber den Balladen, weil das Wort
      morphologisch in deren Gegend faellt); die Belegpflicht tilgt
      das und macht jeden Begriff zu einem Lied rueckverfolgbar.

   Gemessen am 29.08.2026: Okkultation-Stelle -> "Sonnenfinsternis
   0,42"; Erlkoenig-Stelle -> Kindsverlust, Trauer, Vaterliebe (auch
   aus Nachbarliedern - Feldnachbarschaft statt Worthaeufigkeit, genau
   was der Wortkontrast-Benennung fehlte). Median-Rang der eigenen
   zehn Woerter an der eigenen Stelle: 118 von 1454.

   Aufrufe:
     node bin/ortsbegriffe.js       Wortvektoren anlegen/nachfuehren
   Als Modul:
     wortvektorenAktualisieren()    dito, fuer den Morgenlauf
     namensgeber({ids, geschichten})  -> { ortsname(indices) } oder
                                      null, wenn Kondensate oder
                                      Wortvektoren fehlen (Bestand
                                      ohne Kondensate: der Aufrufer
                                      faellt auf den Wortkontrast
                                      zurueck).
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..');
const LIB = path.join(WURZEL, 'library');
const ZIEL = path.join(LIB, 'wortvektoren.json');
const KOND = path.join(LIB, 'kondensate', 'kondensate.json');
/* Kondensat-Reihe wie in bin/geschichten.js: Fassung 2 zuerst. */
const REIHE = ['opus-f2-gesamt', 'opus', 'opus-gesamt'];

function vokabularLesen() {
  let kond;
  try { kond = JSON.parse(fs.readFileSync(KOND, 'utf8')).lieder; } catch (e) { return null; }
  const anzeige = new Map();               /* klein -> Schreibweise des Autorsbestands */
  const jeLied = new Map();                /* songId -> [klein, ...] */
  for (const [id, eintrag] of Object.entries(kond)) {
    const m = REIHE.find(k => eintrag.modelle && eintrag.modelle[k]);
    if (!m) continue;
    const liste = eintrag.modelle[m];
    jeLied.set(id, liste.map(w => w.toLowerCase()));
    for (const w of liste) { const k = w.toLowerCase(); if (!anzeige.has(k)) anzeige.set(k, w); }
  }
  return anzeige.size ? { anzeige, jeLied } : null;
}

const normiert = arr => {
  const e = Float64Array.from(arr);
  let n = 0; for (const v of e) n += v * v; n = Math.sqrt(n) || 1;
  for (let i = 0; i < e.length; i++) e[i] /= n;
  return e;
};

/* ---- Wortvektoren anlegen / nachfuehren ------------------------------- */
async function wortvektorenAktualisieren() {
  const vok = vokabularLesen();
  if (!vok) { console.log('  Ortsbegriffe: keine Kondensate (library/kondensate/) - nichts zu tun.'); return null; }
  let alt = {};
  try { alt = JSON.parse(fs.readFileSync(ZIEL, 'utf8')).woerter || {}; } catch (e) {}
  const fehlend = [...vok.anzeige.keys()].filter(w => !alt[w]);
  const woerter = {};
  for (const w of vok.anzeige.keys()) if (alt[w]) woerter[w] = alt[w];   /* verschwundene fallen weg */

  if (fehlend.length) {
    /* Fehlt das Modell, bleibt die Datei wie sie ist (Exit 0) - gleiches
       Muster wie bin/geschichten.js: der Wartungslauf soll weiterkommen. */
    const MODELL = path.join(LIB, 'modelle', 'paraphrase-multilingual-mpnet.onnx');
    const TOKEN = path.join(LIB, 'modelle', 'paraphrase-multilingual-mpnet-tokenizer.json');
    if (!fs.existsSync(MODELL) || !fs.existsSync(TOKEN)) {
      console.log(`  Ortsbegriffe: Modell fehlt — ${fehlend.length} Wörter bleiben offen. Holen: node bin/modelle-holen.js`);
      return null;
    }
    const { einbetterLaden } = require('./texte-einbetten.js');
    const e = await einbetterLaden(
      path.join(LIB, 'modelle', 'paraphrase-multilingual-mpnet.onnx'),
      path.join(LIB, 'modelle', 'paraphrase-multilingual-mpnet-tokenizer.json'));
    const t0 = Date.now();
    for (const w of fehlend) {
      const v = normiert(await e.einbetten(vok.anzeige.get(w)));
      woerter[w] = Array.from(v, x => +x.toFixed(5));
    }
    console.log(`  Ortsbegriffe: ${fehlend.length} Woerter eingebettet (${((Date.now() - t0) / 1000).toFixed(1)} s), ${Object.keys(woerter).length} gesamt`);
  } else {
    console.log(`  Ortsbegriffe: Wortvektoren vollstaendig (${Object.keys(woerter).length} Woerter)`);
  }
  fs.writeFileSync(ZIEL, JSON.stringify({
    stand: new Date().toISOString().slice(0, 10),
    modell: 'paraphrase-multilingual-mpnet-base-v2, Einzelwoerter, L2-normiert',
    woerter,
  }));
  return ZIEL;
}

/* ---- Namensgeber fuer Gruppen ----------------------------------------- */
function namensgeber({ ids, geschichten }) {
  const vok = vokabularLesen();
  let datei;
  try { datei = JSON.parse(fs.readFileSync(ZIEL, 'utf8')).woerter; } catch (e) { datei = null; }
  if (!vok || !datei) return null;

  const wortVek = new Map();
  for (const [w, v] of Object.entries(datei)) wortVek.set(w, Float64Array.from(v));
  /* Nur Lieder mit Vektor UND Kondensat tragen Kandidaten. */
  const liedVek = ids.map(id => geschichten[id] ? normiert(geschichten[id].emb) : null);
  const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };

  const sockel = new Map();
  let nV = 0;
  for (const v of liedVek) if (v) nV++;
  for (const [w, wv] of wortVek) {
    let s = 0;
    for (const v of liedVek) if (v) s += dot(wv, v);
    sockel.set(w, s / (nV || 1));
  }

  function schwerpunkt(indices) {
    const s = new Float64Array(768);
    let n = 0;
    for (const i of indices) { const v = liedVek[i]; if (!v) continue; n++; for (let a = 0; a < 768; a++) s[a] += v[a]; }
    return n ? normiert(s) : null;
  }
  function begriffe(v, k = 3, naheLieder = 20) {
    const nah = [];
    for (let i = 0; i < liedVek.length; i++) if (liedVek[i]) nah.push([dot(liedVek[i], v), i]);
    nah.sort((a, b) => b[0] - a[0]);
    const kandidaten = new Set();
    for (const [, i] of nah.slice(0, naheLieder))
      for (const w of (vok.jeLied.get(ids[i]) || [])) if (wortVek.has(w)) kandidaten.add(w);
    return [...kandidaten].map(w => [dot(wortVek.get(w), v) - sockel.get(w), w])
      .sort((a, b) => b[0] - a[0]).slice(0, k);
  }

  /* DER WAECHTER: Was eine ZUFAELLIGE Gruppe gleicher Groesse an ihrem
     Schwerpunkt erreicht, bedeutet nichts. Gemessen wird das Quantil
     dieser Zufallswerte (feste Saat - gleiche Karte bei gleichem
     Bestand); Begriffe darunter werden verworfen. Bleibt keiner, heisst
     die Gruppe ehrlich "(gemischte Gegend)" - der Name zeigt dann die
     kranke Gruppe an, statt sie zu kaschieren. Dieselbe Logik wie die
     eta^2-Schwelle der Klassifikatoren: gerechnet, kein Regler. */
  let saat = 20260829;
  const wuerfel = () => ((saat = (saat * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const alleIdx = ids.map((_, i) => i).filter(i => liedVek[i]);
  const schwellenCache = new Map();
  function zufallsSchwelle(groesse, runden = 30) {
    const g = Math.max(2, Math.min(groesse, alleIdx.length));
    if (schwellenCache.has(g)) return schwellenCache.get(g);
    const beste = [];
    for (let r = 0; r < runden; r++) {
      const topf = [...alleIdx];
      for (let i = topf.length - 1; i > 0; i--) { const j = Math.floor(wuerfel() * (i + 1)); [topf[i], topf[j]] = [topf[j], topf[i]]; }
      const v = schwerpunkt(topf.slice(0, g));
      const b = v ? begriffe(v, 1) : [];
      beste.push(b.length ? b[0][0] : 0);
    }
    beste.sort((a, b) => a - b);
    const s = beste[Math.floor(beste.length * 0.9)];
    schwellenCache.set(g, s);
    return s;
  }

  return {
    ortsname(indices, k = 3) {
      const v = schwerpunkt(indices);
      if (!v) return null;
      const schwelle = zufallsSchwelle(indices.length);
      const gut = begriffe(v, k).filter(([wert]) => wert >= schwelle);
      if (!gut.length) return { name: '(gemischte Gegend)', woerter: [], schwelle: +schwelle.toFixed(3) };
      return {
        name: gut.map(([, w]) => vok.anzeige.get(w)).join(' · '),
        woerter: gut.map(([, w]) => vok.anzeige.get(w)),
        schwelle: +schwelle.toFixed(3),
      };
    },
  };
}

module.exports = { wortvektorenAktualisieren, namensgeber };

if (require.main === module) {
  wortvektorenAktualisieren().catch(e => { console.error(e); process.exit(1); });
}
