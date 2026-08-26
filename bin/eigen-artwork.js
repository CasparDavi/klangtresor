#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Eigenes Artwork einem Song zuordnen.
 *
 *   node bin/eigen-artwork.js <song> <datei>    zuordnen
 *   node bin/eigen-artwork.js --liste           was ist zugeordnet
 *   node bin/eigen-artwork.js --loesen <song>   wieder entfernen
 *   node bin/eigen-artwork.js --nahe <song>     Dateien nach Zeit vorschlagen
 *
 * <song> ist eine Song-ID oder ein Stück des Titels ("seife").
 *
 * WOZU (Caspar_D, 26.08.2026: "Artwork zuordnen, die Suno wegen
 * puritanischer Engstirnigkeit abgelehnt hat, wie bspw meine Videos für
 * den Song Seife oder die Braut von Corinth"). Das Video zu "Seife" lag
 * drei Wochen bei Suno und wurde dann kommentarlos entfernt. Ein
 * lokales Archiv heißt auch: Was zu einem Stück gehört, entscheidet
 * der, dem es gehört.
 *
 * EIN EIGENER NAME, KEIN ÜBERSCHREIBEN. Die Dateien heißen `eigen.mp4`
 * und `eigen.jpg` und stehen NEBEN Sunos `artwork.mp4` und `cover.jpg`.
 * Damit:
 *
 *   - fällt kein Medienlauf darüber her. `bin/laden.js` kennt nur seine
 *     eigenen Namen und lädt nur, was fehlt.
 *   - sieht man jederzeit, was von wem stammt.
 *   - stellt Löschen Sunos Fassung wieder her. Ersetzt wird nichts,
 *     nur vorgezogen.
 *
 * KOPIERT, NICHT VERWIESEN. Ein Archiv, das auf ~/Downloads zeigt, ist
 * kaputt, sobald dort aufgeräumt wird. Der Platz ist der Preis dafür,
 * daß der Bestand vollständig bleibt.
 *
 * DIE ZEITSPUR (--nahe). Die Dateinamen der Videogeneratoren sagen
 * nichts ("generated-video-43ff7157-…"), aber ihr Erstellzeitpunkt
 * schon: Wer ein Video zu einem Stück macht, macht es meist in
 * denselben Stunden. Das ist ein VORSCHLAG, keine Zuordnung - bei
 * "Seife" lagen zwei Dateien zwölf Minuten vor dem Song, und nur eine
 * davon war die richtige. Entschieden wird von Hand.
 */
'use strict';
const fs   = require('node:fs');
const path = require('node:path');
const os   = require('node:os');

const WURZEL = path.join(__dirname, '..');
const SONGS  = path.join(WURZEL, 'library', 'songs');

/* Was der Browser ohne Umweg abspielt. .mov wird zwar oft klaglos
   angezeigt (H.264 im Quicktime-Behälter), aber eben nur oft - deshalb
   wird darauf hingewiesen statt es zu verschweigen. */
const VIDEO = new Set(['.mp4', '.m4v', '.webm']);
const BILD  = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function songeFinden(wort) {
  const K = require('./katalog.js');
  const k = K.lesen();
  const alle = Object.values((k && k.songs) || {}).filter((s) => !s.fremd);
  if (!wort) return alle;
  const w = String(wort).toLowerCase();
  const genau = alle.filter((s) => s.id === wort);
  if (genau.length) return genau;
  return alle.filter((s) => String(s.titel || '').toLowerCase().includes(w));
}

function einer(wort) {
  const treffer = songeFinden(wort);
  if (!treffer.length) { console.log(`  Kein Song für „${wort}".`); return null; }
  if (treffer.length > 1) {
    console.log(`  „${wort}" paßt auf ${treffer.length} Songs — bitte genauer oder die ID nehmen:`);
    for (const s of treffer.slice(0, 12)) console.log(`    ${s.id}  ${s.titel}`);
    return null;
  }
  return treffer[0];
}

/* Alle Videos und Bilder in den üblichen Ordnern, mit Zeitstempel. */
function dateienSammeln() {
  const raus = [];
  const orte = [path.join(os.homedir(), 'Downloads'), path.join(os.homedir(), 'Movies'),
                path.join(os.homedir(), 'Desktop'), path.join(os.homedir(), 'Pictures')];
  for (const d of orte) {
    let e = []; try { e = fs.readdirSync(d); } catch (err) { continue; }
    for (const f of e) {
      const en = path.extname(f).toLowerCase();
      if (!VIDEO.has(en) && !BILD.has(en) && en !== '.mov') continue;
      const p = path.join(d, f);
      let st; try { st = fs.statSync(p); } catch (err) { continue; }
      if (!st.isFile()) continue;
      raus.push({ pfad: p, name: f, zeit: st.birthtimeMs || st.mtimeMs, mb: st.size / 1048576 });
    }
  }
  return raus;
}

function zuordnen(wort, datei) {
  const s = einer(wort); if (!s) return;
  if (!fs.existsSync(datei)) { console.log(`  Datei nicht gefunden: ${datei}`); return; }
  const en = path.extname(datei).toLowerCase();
  let name;
  if (VIDEO.has(en)) name = 'eigen.mp4';
  else if (BILD.has(en)) name = 'eigen.jpg';
  else if (en === '.mov') {
    name = 'eigen.mp4';
    console.log('  Hinweis: .mov — die meisten stecken H.264 im Quicktime-Behälter und laufen,');
    console.log('           manche nicht. Wenn das Bild schwarz bleibt, liegt es daran.');
  } else { console.log(`  Womit soll ich ${en} anfangen? Video oder Bild, sonst nichts.`); return; }

  const ordner = path.join(SONGS, s.id);
  fs.mkdirSync(ordner, { recursive: true });
  const ziel = path.join(ordner, name);
  const gab = fs.existsSync(ziel);
  fs.copyFileSync(datei, ziel);
  const mb = fs.statSync(ziel).size / 1048576;
  console.log(`  ${gab ? 'ersetzt' : 'zugeordnet'}: ${s.titel}`);
  console.log(`    ${path.basename(datei)}  →  library/songs/${s.id}/${name}   (${mb.toFixed(1)} MB)`);
  if (name === 'eigen.mp4' && fs.existsSync(path.join(ordner, 'artwork.mp4')))
    console.log('    Sunos artwork.mp4 bleibt liegen — das eigene wird nur vorgezogen.');
}

function loesen(wort) {
  const s = einer(wort); if (!s) return;
  let weg = 0;
  for (const n of ['eigen.mp4', 'eigen.jpg']) {
    const p = path.join(SONGS, s.id, n);
    if (fs.existsSync(p)) { fs.unlinkSync(p); weg++; console.log(`  entfernt: ${n}`); }
  }
  console.log(weg ? `  ${s.titel} zeigt wieder Sunos Fassung.` : `  ${s.titel} hatte gar kein eigenes.`);
}

function liste() {
  const K = require('./katalog.js');
  const k = K.lesen();
  const titel = {};
  for (const s of Object.values((k && k.songs) || {})) titel[s.id] = s.titel;
  let n = 0;
  for (const d of fs.readdirSync(SONGS)) {
    const teile = [];
    for (const [was, datei] of [['Video', 'eigen.mp4'], ['Bild', 'eigen.jpg']]) {
      try { const st = fs.statSync(path.join(SONGS, d, datei));
        if (st.size > 0) teile.push(`${was} ${(st.size / 1048576).toFixed(1)} MB`); } catch (e) {}
    }
    if (teile.length) { n++; console.log(`  ${String(titel[d] || d).slice(0, 40).padEnd(42)} ${teile.join(' · ')}`); }
  }
  console.log(n ? `\n  ${n} Song${n === 1 ? '' : 's'} mit eigenem Artwork.` : '  Noch nichts zugeordnet.');
}

function nahe(wort) {
  const s = einer(wort); if (!s) return;
  if (!s.erstellt) { console.log('  Für diesen Song ist kein Zeitpunkt bekannt.'); return; }
  const t = new Date(s.erstellt).getTime();
  const treffer = dateienSammeln()
    .map((d) => ({ ...d, h: (d.zeit - t) / 3600000 }))
    .filter((d) => Math.abs(d.h) < 72)
    .sort((a, b) => Math.abs(a.h) - Math.abs(b.h))
    .slice(0, 10);
  console.log(`  ${s.titel} — erstellt ${s.erstellt.slice(0, 16).replace('T', ' ')}`);
  if (!treffer.length) { console.log('  Nichts innerhalb von drei Tagen.'); return; }
  for (const d of treffer)
    console.log(`   ${(d.h >= 0 ? '+' : '')}${d.h.toFixed(1).padStart(6)} h  ${d.mb.toFixed(1).padStart(5)} MB  ${d.pfad}`);
  console.log('\n  Vorschlag nach Zeitnähe, keine Zuordnung — die trifft nur, wer die Videos kennt.');
}

const args = process.argv.slice(2);
if (args.includes('--liste')) liste();
else if (args.includes('--loesen')) loesen(args[args.indexOf('--loesen') + 1]);
else if (args.includes('--nahe')) nahe(args[args.indexOf('--nahe') + 1]);
else if (args.length >= 2) zuordnen(args[0], args[1]);
else {
  console.log('  node bin/eigen-artwork.js <song> <datei>    zuordnen');
  console.log('  node bin/eigen-artwork.js --liste           was ist zugeordnet');
  console.log('  node bin/eigen-artwork.js --loesen <song>   wieder entfernen');
  console.log('  node bin/eigen-artwork.js --nahe <song>     Dateien nach Zeit vorschlagen');
}
