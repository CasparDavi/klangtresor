#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Die öffentlichen Profilzahlen der Leute, die hier vorkommen.
 *
 *   node bin/community-profile.js              alle, die noch fehlen
 *   node bin/community-profile.js --neu        alle noch einmal
 *   node bin/community-profile.js --anzahl 20  höchstens zwanzig
 *   node bin/community-profile.js <handle>     nur einen, mit Ausgabe
 *
 * WOZU (Caspar_D, 26.08.2026: "wo stehen meine follower, liker,
 * interessante Fragen"). Der Hirschfaktor auf der Autorenseite sagt 22 -
 * aber ist das viel? Ohne Vergleich weiß man es nicht. Wer hier
 * kommentiert, likt oder folgt, hat selbst ein öffentliches Profil mit
 * Songzahl, Plays, Likes und Followern. Damit läßt sich die eigene Zahl
 * einordnen, statt sie allein stehen zu lassen.
 *
 * WOHER. Suno gibt Profile ohne Anmeldung heraus:
 *
 *   GET https://studio-api.prod.suno.com/api/profiles/<handle>/
 *       ?page=1&playlists_sort_by=upvote_count&clips_sort_by=created_at
 *
 * Beide sort_by-Angaben sind PFLICHT - ohne sie antwortet der Dienst mit
 * 422 und einer leeren Hülle, in der jede Zahl null ist. Das sieht wie
 * ein stiller Nutzer aus und ist ein Fehler; genau darauf bin ich beim
 * ersten Versuch hereingefallen.
 *
 * Kein Cookie, kein Token - also auch kein Risiko für die eigene
 * Anmeldung, und es kostet keine Credits (die kostet nur das Erzeugen).
 *
 * NETT SEIN (Caspar_D: "ja, aber sei nett"). Es ist Sunos Server, nicht
 * unserer. Deshalb:
 *
 *   - EINE Anfrage zur Zeit, nie parallel. Der Lauf dauert dadurch
 *     Minuten statt Sekunden, und das ist in Ordnung.
 *   - PAUSE dazwischen (Vorgabe 1,5 s), also höchstens 40 Anfragen je
 *     Minute.
 *   - EHRLICHER User-Agent mit Zweck und Projektadresse. Wer sich als
 *     Browser ausgibt, verbirgt, wer da anfragt.
 *   - BEI 429 ODER 503 SOFORT AUFHÖREN, nicht wiederholen. Wenn der
 *     Dienst bremst, ist das eine Bitte, keine Verhandlung. Das bisher
 *     Geholte wird gesichert, der Rest holt sich beim nächsten Lauf.
 *   - NUR EINMAL HOLEN: Wer schon in der Datei steht, wird
 *     übersprungen. Ein zweiter Lauf kostet also nichts.
 *   - NUR DIE ERSTE SEITE. Für den Hirschfaktor eines fremden Profils
 *     bräuchte es alle Songs, bei 250 Stücken also elf Seiten je
 *     Person - für 180 Leute wären das zweitausend Anfragen. Das wäre
 *     nicht mehr nett. Die Zusammenfassung in `stats` reicht für die
 *     Einordnung.
 *
 * WAS GESPEICHERT WIRD: nur die öffentlichen Zahlen und der Anzeigename,
 * keine Songlisten, keine Texte, keine Kommentare. Es sind fremde Daten,
 * und sie bleiben - wie alles hier - lokal.
 *
 * Ergebnis: library/community-profile.json
 *   { stand, leute: { handle: { name, songs, plays, likes, follower,
 *                              folgt, playlists, personas, stand } } }
 */
'use strict';
const fs   = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..');
const ZIEL   = path.join(WURZEL, 'library', 'community-profile.json');
const REAKT  = path.join(WURZEL, 'library', 'reaktionen.ndjson');

const args   = process.argv.slice(2);
const MIT_WERT = new Set(['--anzahl', '--pause']);
const neu    = args.includes('--neu');
const nur    = args.find((a, i) => !a.startsWith('--') && !MIT_WERT.has(args[i - 1])) || null;
const anzahl = args.includes('--anzahl') ? Math.max(1, parseInt(args[args.indexOf('--anzahl') + 1], 10) || 1) : Infinity;
/* Die Pause ist einstellbar, aber nicht nach unten: unter einer Sekunde
   ist es kein Höflichkeitsabstand mehr. */
const PAUSE  = Math.max(1000, args.includes('--pause')
  ? (parseFloat(args[args.indexOf('--pause') + 1]) || 1.5) * 1000 : 1500);

const BASIS = 'https://studio-api.prod.suno.com/api/profiles';
const KOPF  = {
  'Accept': 'application/json',
  /* Wer da anfragt und warum - nachlesbar, nicht getarnt. */
  'User-Agent': 'KlangTresor/1.0 (persoenliches Musikarchiv; github.com/CasparDavi/klangtresor)',
};

const schlafen = (ms) => new Promise(r => setTimeout(r, ms));

/* Der eigene Handle - er steht in den Reaktionen mit drin, weil man auf
   Kommentare unter den eigenen Songs antwortet. Ihn als Nachbarn zu
   holen hiesse, sich selbst mit sich zu vergleichen (26.08.2026). */
function eigenerHandle() {
  try {
    const K = require('./katalog.js');
    const k = K.lesen();
    return String((k && k.profil && k.profil.handle) || '').toLowerCase();
  } catch (e) { return ''; }
}

/* Alle Handles, die hier überhaupt vorkommen: wer kommentiert oder
   geliked hat, und wer folgt. Aus derselben Quelle wie /api/community. */
function handlesSammeln() {
  const raus = new Map();
  const ich = eigenerHandle();
  const merke = (h, name) => { if (!h) return;
    const k = String(h).toLowerCase();
    if (k === ich) return;                       /* nicht sich selbst */
    if (!raus.has(k) || (name && !raus.get(k))) raus.set(k, name || raus.get(k) || ''); };
  let zeilen = [];
  try { zeilen = fs.readFileSync(REAKT, 'utf8').split('\n'); } catch (e) { return raus; }
  for (const z of zeilen) {
    if (!z.trim()) continue;
    let e; try { e = JSON.parse(z); } catch (err) { continue; }
    merke(e.von, e.name);
    if (Array.isArray(e.likes)) for (const l of e.likes) merke(l.von || l.handle, l.name);
  }
  return raus;
}

async function profilHolen(handle) {
  const url = `${BASIS}/${encodeURIComponent(handle)}/`
            + '?page=1&playlists_sort_by=upvote_count&clips_sort_by=created_at';
  const a = await fetch(url, { headers: KOPF });
  if (a.status === 429 || a.status === 503) { const e = new Error('gebremst (' + a.status + ')'); e.bremse = true; throw e; }
  if (a.status === 404) return null;                       /* Profil gibt es nicht mehr */
  if (!a.ok) throw new Error('HTTP ' + a.status);
  const d = await a.json();
  if (d && d.detail) throw new Error(String(d.detail).slice(0, 80));
  const s = (d && d.stats) || {};
  return {
    name:      d.display_name || handle,
    songs:     d.num_total_clips || 0,
    plays:     s.play_count__sum || 0,
    likes:     s.upvote_count__sum || 0,
    follower:  s.followers_count || 0,
    folgt:     s.following_count || 0,
    playlists: Array.isArray(d.playlists) ? d.playlists.length : 0,
    personas:  Array.isArray(d.personas) ? d.personas.length : 0,
    stand:     new Date().toISOString(),
  };
}

(async function () {
  let alt = { leute: {} };
  try { alt = JSON.parse(fs.readFileSync(ZIEL, 'utf8')); } catch (e) {}
  const leute = alt.leute || {};

  let liste;
  if (nur) liste = [[nur.toLowerCase(), '']];
  else {
    liste = [...handlesSammeln()];
    if (!neu) liste = liste.filter(([h]) => !leute[h]);
    liste = liste.slice(0, anzahl);
  }
  if (!liste.length) { console.log('  Community-Profile: nichts zu tun.'); return; }

  const schreiben = () => fs.writeFileSync(ZIEL, JSON.stringify({
    stand: new Date().toISOString(),
    quelle: 'studio-api.prod.suno.com/api/profiles - oeffentlich, ohne Anmeldung',
    leute }, null, 0));

  console.log(`  Community-Profile: ${liste.length} Leute, ${(PAUSE / 1000).toFixed(1)} s Pause`
    + `  (rund ${Math.ceil(liste.length * PAUSE / 60000)} min)`);
  let geholt = 0, weg = 0, schief = 0;

  for (const [h] of liste) {
    try {
      const p = await profilHolen(h);
      if (p) { leute[h] = p; geholt++;
        if (nur || geholt % 25 === 0)
          console.log(`  ${h.slice(0, 24).padEnd(26)} Songs ${String(p.songs).padStart(4)}`
            + `  Plays ${String(p.plays).padStart(7)}  Likes ${String(p.likes).padStart(6)}`
            + `  Follower ${String(p.follower).padStart(5)}  folgt ${String(p.folgt).padStart(4)}`);
      } else { weg++; }
    } catch (e) {
      if (e.bremse) {
        /* Der Dienst bittet um Ruhe. Das Geholte sichern und gehen -
           der Rest kommt beim nächsten Lauf, es eilt ja nichts. */
        console.log(`  ${e.message} - Lauf beendet, ${geholt} geholt. Der Rest folgt beim nächsten Mal.`);
        break;
      }
      schief++;
      if (schief >= 10) { console.log('  Zehn Fehler hintereinander - Lauf beendet.'); break; }
    }
    if (geholt % 20 === 0) schreiben();
    await schlafen(PAUSE);
  }

  schreiben();
  console.log(`  fertig: ${geholt} geholt${weg ? ', ' + weg + ' Profile gibt es nicht mehr' : ''}`
    + `${schief ? ', ' + schief + ' schief' : ''} - insgesamt ${Object.keys(leute).length} → library/community-profile.json`);
})();
