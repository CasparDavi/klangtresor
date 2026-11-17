#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   SPIEGELN - WAS RSYNC IM EXPORT TAT
   bin/spiegeln.js

   HIER LIEF RSYNC - BIS ZUM 17.11.2026. Es gibt es auf Windows nicht, und
   Apex' Export brach dort ab. Caspar_D hat entschieden: der eigene Kopierer
   ueberall, rsync faellt - nicht zwei Kopierwege fuer dieselbe Aufgabe, von
   denen jeder Fehler zweimal gefunden werden muss.

   Der Kopierer in bin/export.js machte die Stufen 1-4 und 6 schon. Was ihm
   fehlte, steht hier - und zwar in einer eigenen Datei, weil es die
   gefaehrlichste Stelle des ganzen Exports ist: aufraeumen() LOESCHT im Ziel.
   Ein falsches Filtermuster loescht auf dem Stick. Darum ist es hier von Hand
   pruefbar und wird gegen echtes rsync gestellt (bin/spiegeln-pruefen.js),
   Entscheidung fuer Entscheidung.

     1. DURCH DEN BAUM GEHEN. rsync bekam einen Ordner, der Kopierer eine
        Liste. baumGehen() sammelt sie. Verweisen wird gefolgt (rsync -L: ein
        Stick kann keine tragen), Kreise fangen wir ueber den echten Pfad ab.
     2. FILTERMUSTER. musterZuRegex() deckt genau die Formen ab, die der
        Export braucht:
          name, na*e      gilt in jeder Tiefe (rsync: Muster ohne /)
          /name           nur an der Wurzel der Uebertragung
          name/           nur Ordner (und damit auch deren Inhalt)
          --filter 'P m'  schuetzt vor dem Wegraeumen
        Was rsync sonst noch kann (**, [a-z], Merge-Dateien, +-Regeln), kommt
        im Export nicht vor und ist hier auch nicht gebaut - ein Muster, das
        wir nicht brauchen, waere ungeprueft.
     3. WEGRAEUMEN. aufraeumen() ist --delete und --delete-excluded: was zu
        Hause fehlt, geht; was ausgeschlossen ist, auch (eine WAV von einem
        frueheren Export, die Songs, die inzwischen im Behaelter liegen). Was
        nur im Ziel lebt - export-stand.json, die Behaelter - ist durch
        --filter P geschuetzt und bleibt. P gilt vor allem anderen, wie bei
        rsync, wo die Schutzregel vor den Ausschluessen in der Liste steht.
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

/* Ohne Rechte und Besitzer: der Stick ist exFAT oder FAT32 und kennt weder das
   eine noch das andere - rsync -a endete dort mit "chmod failed" und Exit 23.
   Der Beifang, den kein Stick braucht. */
const BEIFANG = ['--exclude', '._*', '--exclude', '.DS_Store', '--exclude', '.git', '--exclude', '.git*', '--exclude', '*.lock', '--exclude', '*.tmp'];

function musterZuRegex(muster) {
  let m = String(muster);
  const nurOrdner = m.endsWith('/');
  if (nurOrdner) m = m.slice(0, -1);
  const verankert = m.startsWith('/');
  if (verankert) m = m.slice(1);
  const teile = Array.from(m, (z) => (z === '*' ? '[^/]*' : z === '?' ? '[^/]' : z.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  return { re: new RegExp('^' + teile.join('') + '$'), nurOrdner, verankert };
}

/* Aus den rsync-Argumenten zwei Fragen: ist es ausgeschlossen, ist es geschuetzt?
   Der Beifang gilt immer, zusatz kommt von der Aufrufstelle. */
function filterBauen(zusatz) {
  const aus = [], schutz = [];
  const lies = (liste) => {
    for (let i = 0; i < liste.length; i++) {
      if (liste[i] === '--exclude') { aus.push(musterZuRegex(liste[++i])); continue; }
      if (liste[i] === '--filter') {
        const m = /^P\s+(.+)$/.exec(String(liste[++i] || ''));
        if (m) schutz.push(musterZuRegex(m[1]));
      }
    }
  };
  lies(BEIFANG); lies(zusatz || []);
  const trifft = (liste, rel, istOrdner) => liste.some((x) =>
    (!x.nurOrdner || istOrdner) && x.re.test(x.verankert ? rel : rel.slice(rel.lastIndexOf('/') + 1)));
  return { ausgeschlossen: (rel, istOrdner) => trifft(aus, rel, istOrdner),
           geschuetzt: (rel, istOrdner) => trifft(schutz, rel, istOrdner) };
}

/* Alle Dateien unter wurzel, die der Filter durchlaesst, mit ihrem Pfad relativ
   zur Wurzel. Ein ausgeschlossener Ordner wird nicht betreten - sein Inhalt ist
   damit auch draussen, wie bei rsync. */
function baumGehen(wurzel, filter) {
  const dateien = []; let bytes = 0;
  const gesehen = new Set();
  const rein = (ordner, rel) => {
    let e = [];
    try { e = fs.readdirSync(ordner, { withFileTypes: true }); } catch (x) { return; }
    for (const x of e) {
      const r = rel ? rel + '/' + x.name : x.name;
      const voll = path.join(ordner, x.name);
      let st = null;
      try { st = fs.statSync(voll); } catch (y) { continue; }   /* folgt Verweisen, wie rsync -L */
      const istOrdner = st.isDirectory();
      if (filter.ausgeschlossen(r, istOrdner)) continue;
      if (istOrdner) {
        let echt = voll; try { echt = fs.realpathSync(voll); } catch (y) {}
        if (gesehen.has(echt)) continue;                        /* ein Verweis im Kreis */
        gesehen.add(echt);
        rein(voll, r);
      } else if (st.isFile()) {
        dateien.push({ rel: r, bytes: st.size, mtime: st.mtime, atime: st.atime });
        bytes += st.size;
      }
    }
  };
  rein(wurzel, '');
  return { dateien, bytes };
}

/* --delete und --delete-excluded, mit --filter P davor. Gibt die relativen Pfade
   zurueck, die weg sind (oder mit trocken: weg WAEREN) - eine Liste, damit sie
   sich gegen rsync halten laesst. Ein geloeschter Ordner nimmt seinen Inhalt mit,
   darum steht nur er in der Liste. */
function aufraeumen(quelle, ziel, filter, { trocken = false } = {}) {
  const weg = [];
  const rein = (ordner, rel) => {
    let e = [];
    try { e = fs.readdirSync(ordner, { withFileTypes: true }); } catch (x) { return; }
    for (const x of e) {
      const r = rel ? rel + '/' + x.name : x.name;
      const voll = path.join(ordner, x.name);
      let st = null;
      try { st = fs.lstatSync(voll); } catch (y) { continue; }
      const istOrdner = st.isDirectory();
      if (filter.geschuetzt(r, istOrdner)) continue;             /* P gilt vor allem anderen */
      if (filter.ausgeschlossen(r, istOrdner) || !fs.existsSync(path.join(quelle, r))) {
        if (!trocken) { try { fs.rmSync(voll, { recursive: true, force: true }); } catch (y) {} }
        weg.push(istOrdner ? r + '/' : r);
        continue;
      }
      if (istOrdner) rein(voll, r);
    }
  };
  rein(ziel, '');
  return weg;
}

module.exports = { BEIFANG, musterZuRegex, filterBauen, baumGehen, aufraeumen };
