#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Der Hirschfaktor der Nachbarschaft.
 *
 *   node bin/community-hirsch.js              alle, die noch fehlen
 *   node bin/community-hirsch.js --neu        alle noch einmal
 *   node bin/community-hirsch.js --anzahl 20  höchstens zwanzig
 *   node bin/community-hirsch.js <handle>     nur einen, mit Ausgabe
 *
 * WOZU. Auf der Autorenseite steht ein Hirschfaktor von 22 - aber ist
 * das viel? bin/community-profile.js holt die Summen (Plays, Likes,
 * Follower); für den Hirschfaktor braucht es die einzelnen Songs mit
 * ihren Likes. Erst damit bekommt die eigene Zahl einen Maßstab.
 *
 * DER TRICK, DER ES BEZAHLBAR MACHT. Für einen Hirschfaktor von h
 * braucht man nur die h BESTEN Songs - alles darunter zählt nicht mit.
 * Der Endpunkt nimmt `clips_sort_by=upvote_count`:
 *
 *   GET .../api/profiles/<handle>/?page=N
 *       &playlists_sort_by=upvote_count&clips_sort_by=upvote_count
 *
 * ACHTUNG, die Sortierung ist NICHT global absteigend. Innerhalb einer
 * Seite steht es durcheinander (gemessen an caspar_d: 56, 34, 29, 17, 6,
 * dann wieder 55) - offenbar gruppenweise. Über die SEITEN hinweg fällt
 * das Maximum aber monoton:
 *
 *   Seite 1: Likes 56…6    Seite 3: 17…11
 *   Seite 2: 22…17         Seite 4: 10…8
 *
 * Und das genügt: Sobald das Maximum einer Seite den bisher erreichten
 * Hirschfaktor nicht mehr übersteigt, kann keine weitere Seite ihn
 * heben - um von h auf h+1 zu kommen, bräuchte es h+1 Songs mit
 * mindestens h+1 Likes, und alle folgenden haben höchstens so viele wie
 * das Seitenmaximum. Für caspar_d sind das drei Seiten statt elf.
 *
 * Ohne diesen Abbruch wären es für 175 Leute rund 3900 Seiten und gut
 * anderthalb Stunden. So sind es einige hundert.
 *
 * NETT SEIN, wie in bin/community-profile.js: eine Anfrage zur Zeit,
 * Pause dazwischen, ehrlicher User-Agent, bei 429 oder 503 sofort
 * aufhören, Bekanntes überspringen. Zusätzlich hier eine Obergrenze von
 * zwölf Seiten je Person - wer mehr als 260 Songs mit hohen Likezahlen
 * hat, bekommt eine Untergrenze statt eines genauen Werts. Das steht
 * dann als `genau: false` in der Datei; ein Diagramm darf keine
 * Genauigkeit behaupten, die die Messung nicht hat.
 *
 * Ergebnis: library/community-hirsch.json
 *   { stand, leute: { handle: { h, songs, seiten, genau, stand } } }
 */
'use strict';
const fs   = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..');
const ZIEL   = path.join(WURZEL, 'library', 'community-hirsch.json');
const PROFIL = path.join(WURZEL, 'library', 'community-profile.json');

const args   = process.argv.slice(2);
const MIT_WERT = new Set(['--anzahl', '--pause', '--seiten']);
const neu    = args.includes('--neu');
const nur    = args.find((a, i) => !a.startsWith('--') && !MIT_WERT.has(args[i - 1])) || null;
const anzahl = args.includes('--anzahl') ? Math.max(1, parseInt(args[args.indexOf('--anzahl') + 1], 10) || 1) : Infinity;
const PAUSE  = Math.max(1000, args.includes('--pause')
  ? (parseFloat(args[args.indexOf('--pause') + 1]) || 1.5) * 1000 : 1500);
const MAXSEITEN = args.includes('--seiten') ? Math.max(1, parseInt(args[args.indexOf('--seiten') + 1], 10) || 12) : 12;

const BASIS = 'https://studio-api.prod.suno.com/api/profiles';
const KOPF  = {
  'Accept': 'application/json',
  'User-Agent': 'KlangTresor/1.0 (persoenliches Musikarchiv; github.com/CasparDavi/klangtresor)',
};
const schlafen = (ms) => new Promise(r => setTimeout(r, ms));

/* Der h-Index: die größte Zahl h, für die h Werte mindestens h sind. */
function hIndex(werte) {
  const w = [...werte].sort((a, b) => b - a);
  let h = 0; while (h < w.length && w[h] >= h + 1) h++;
  return h;
}

async function seiteHolen(handle, seite) {
  const url = `${BASIS}/${encodeURIComponent(handle)}/?page=${seite}`
            + '&playlists_sort_by=upvote_count&clips_sort_by=upvote_count';
  const a = await fetch(url, { headers: KOPF });
  if (a.status === 429 || a.status === 503) { const e = new Error('gebremst (' + a.status + ')'); e.bremse = true; throw e; }
  if (a.status === 404) return null;
  if (!a.ok) throw new Error('HTTP ' + a.status);
  const d = await a.json();
  if (d && d.detail) throw new Error(String(d.detail).slice(0, 60));
  return Array.isArray(d.clips) ? d.clips : [];
}

async function hirschVon(handle, laut) {
  const likes = [];
  let seite = 1, seiten = 0, genau = true;
  while (seite <= MAXSEITEN) {
    const clips = await seiteHolen(handle, seite);
    if (clips === null) return null;                       /* Profil weg */
    if (!clips.length) break;                              /* fertig */
    seiten++;
    let maxSeite = 0;
    for (const c of clips) {
      const u = c.upvote_count || 0;
      likes.push(u);
      if (u > maxSeite) maxSeite = u;
    }
    const h = hIndex(likes);
    if (laut) console.log(`    Seite ${seite}: ${clips.length} Clips, Höchstwert ${maxSeite} Likes, h bisher ${h}`);
    /* DIE ABBRUCHBEDINGUNG. Kann eine weitere Seite h noch heben? Nur,
       wenn dort Songs mit mehr als h Likes stehen können - und das
       Maximum fällt über die Seiten monoton. */
    if (maxSeite <= h) break;
    if (clips.length < 15) break;                          /* letzte Seite war dünn */
    seite++;
    await schlafen(PAUSE);
  }
  if (seite > MAXSEITEN) genau = false;
  /* KEIN HIRSCHFAKTOR FUER PLAYS. Er stuende hier fast umsonst da -
     aber er waere systematisch zu niedrig: Der Abbruch richtet sich nach
     den LIKES, und Plays sind eine Groessenordnung haeufiger. An
     caspar_d gemessen: aus zwei Seiten kaeme 41, richtig sind 94. Ein
     Wert, der zu niedrig ist und nicht sagt, wie sehr, gehoert nicht in
     die Datei (Hausregel: nichts darf luegen). Wer ihn will, muss ohne
     Abbruch rechnen - und das sind wieder tausende Anfragen. */
  return { h: hIndex(likes), songs: likes.length, seiten, genau,
           stand: new Date().toISOString() };
}

(async function () {
  let alt = { leute: {} };
  try { alt = JSON.parse(fs.readFileSync(ZIEL, 'utf8')); } catch (e) {}
  const leute = alt.leute || {};

  let liste;
  if (nur) liste = [nur.toLowerCase()];
  else {
    let profile = {};
    try { profile = JSON.parse(fs.readFileSync(PROFIL, 'utf8')).leute || {}; }
    catch (e) { console.log('  Erst bin/community-profile.js laufen lassen.'); return; }
    /* Nur wer eigene Songs hat - Hörer haben keinen Hirschfaktor.
       Die Größten zuerst: Wenn der Lauf abbricht, hat man die
       aussagekräftigsten schon. */
    liste = Object.entries(profile).filter(([, p]) => p.songs > 0)
      .sort((a, b) => b[1].likes - a[1].likes).map(([h]) => h);
    if (!neu) liste = liste.filter(h => !leute[h]);
    liste = liste.slice(0, anzahl);
  }
  if (!liste.length) { console.log('  Hirschfaktoren: nichts zu tun.'); return; }

  const schreiben = () => fs.writeFileSync(ZIEL, JSON.stringify({
    stand: new Date().toISOString(),
    verfahren: 'h-Index ueber die Likes je Song; Abbruch, sobald das Seitenmaximum h nicht mehr uebersteigt',
    leute }, null, 0));

  console.log(`  Hirschfaktoren: ${liste.length} Leute, ${(PAUSE / 1000).toFixed(1)} s Pause`);
  let getan = 0, weg = 0, schief = 0, seitenGesamt = 0;

  for (const h of liste) {
    try {
      const e = await hirschVon(h, !!nur);
      if (e) { leute[h] = e; getan++; seitenGesamt += e.seiten;
        if (nur || getan % 20 === 0)
          console.log(`  ${h.slice(0, 24).padEnd(26)} h ${String(e.h).padStart(3)}`
            + `  aus ${e.songs} Songs, ${e.seiten} Seiten`
            + `${e.genau ? '' : ' — Untergrenze'}`);
      } else weg++;
    } catch (e) {
      if (e.bremse) { console.log(`  ${e.message} - Lauf beendet, ${getan} geschafft.`); break; }
      schief++;
      if (schief >= 10) { console.log('  Zehn Fehler hintereinander - Lauf beendet.'); break; }
    }
    if (getan % 10 === 0) schreiben();
    await schlafen(PAUSE);
  }

  schreiben();
  console.log(`  fertig: ${getan} gerechnet${weg ? ', ' + weg + ' Profile weg' : ''}`
    + `${schief ? ', ' + schief + ' schief' : ''} — ${seitenGesamt} Seiten geholt`
    + ` (ohne Abbruch wären es rund ${Math.round(seitenGesamt * 4)} gewesen)`
    + ` → library/community-hirsch.json`);
})();
