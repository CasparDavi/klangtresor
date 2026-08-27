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
 * EIN EIGENER NAME, KEIN ÜBERSCHREIBEN. Die Dateien heißen `eigen.mp4`,
 * `eigen.jpg` und `eigen.mp3` und stehen NEBEN Sunos `artwork.mp4`,
 * `cover.jpg` und `audio.mp3`.
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

/* WO GESUCHT WIRD: in den Hausordnern - und sonst nur dort, wo man es
   ausdrücklich sagt (`--ordner <pfad>`).

   ES GAB EINMAL EINE STEHENDE LISTE in library/konfig.json. Caspar_D
   hat sie am 26.08.2026 gestrichen, mit gutem Grund: "der ordner kommt
   nur in die suche, wenn ich es sage, kein standard, das ist teilweise
   altes zeug, das auch fehlerbehaftet ist." Ein Altbestand, der bei
   jedem Aufruf mitsucht, schleicht sich irgendwann in eine Zuordnung -
   und niemand erinnert sich später, woher die Datei kam. Wer aus einer
   solchen Ablage zuordnen will, nennt sie beim Namen. */
function suchOrte() {
  const orte = [path.join(os.homedir(), 'Downloads'), path.join(os.homedir(), 'Movies'),
                path.join(os.homedir(), 'Desktop'), path.join(os.homedir(), 'Pictures')];
  const extra = process.argv.indexOf('--ordner');
  if (extra >= 0 && process.argv[extra + 1]) orte.push(process.argv[extra + 1]);
  return orte;
}

/* Alle Videos und Bilder in den üblichen Ordnern, mit Zeitstempel. */
function dateienSammeln() {
  const raus = [];
  const orte = suchOrte();
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

/* NAMENSABGLEICH. Er schlägt die Zeitspur um Längen, wo er greift:
   "BrautvonCorinth.mp4" ist eindeutig, "generated-video-43ff7157-…"
   sagt nichts. Verglichen wird kleingeschrieben und ohne alles, was
   kein Buchstabe oder Ziffer ist - so findet "Waifu mit weissem
   Haar.mp4" auch "Waifu mit weißem Haar (ft. Kasane)". */
const kahl = (t) => String(t).toLowerCase()
  .replace(/\.[a-z0-9]+$/, '')
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/[^a-z0-9]/g, '');

/* Sagt der Dateiname überhaupt etwas? Reine Kennungen und die
   Ausgabenamen der Videowerkzeuge nicht. */
const namenlos = (f) => {
  const n = kahl(f);
  return /^[0-9a-f]{20,}/.test(n) || /^fcms/.test(n)
      || /^generatedvideo/.test(n) || /^imaginexvideo/.test(n)
      || /^grokvideo/.test(n) || /^pixverse/.test(n) || /^vid[0-9a-z]{15,}/.test(n);
};

/* WANN PASST EIN TEIL? Nicht "steckt irgendwo drin" - so wurde
   "wachstum_mean_with_reps_directlabels.png" dem Song "Stumm"
   zugeschlagen, weil stumm in wachSTUMM steckt. Aber auch nicht "fängt
   damit an": Daran scheiterte ausgerechnet BrautvonCorinth.mp4, denn
   der Song heißt "DIE Braut von Corinth" - der Artikel steht im Titel
   und nicht im Dateinamen.

   Was zählt, ist das VERHAELTNIS: Der kürzere Name muß mindestens die
   Hälfte des längeren ausmachen. Dann ist "brautvoncorinth" in
   "diebrautvoncorinth" ein Treffer (15 von 18), "stumm" in
   "wachstummeanwithreps..." keiner (5 von 32). */
function passtTeilweise(a, b) {
  if (!a || !b || a.length < 4 || b.length < 5) return false;
  const [kurz, lang] = a.length <= b.length ? [a, b] : [b, a];
  if (!lang.includes(kurz)) return false;
  return kurz.length >= lang.length * 0.5;
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
  const sn = kahl(s.titel);
  const alle = dateienSammeln();

  /* Erst die Namen - wo einer paßt, braucht es die Uhr nicht. */
  const ausName = alle.filter((d) => !namenlos(d.name)).filter((d) => {
    const n = kahl(d.name);
    /* Bleibt vom Namen nichts übrig, gibt es nichts zu vergleichen -
       "本物の番人.jpeg" wird zur leeren Zeichenkette, und die steckt in
       jedem Titel. Ohne diese Schranke paßt sie auf alles. */
    if (n.length < 4) return false;
    return n === sn || passtTeilweise(n, sn);
  });
  console.log(`  ${s.titel} — erstellt ${s.erstellt.slice(0, 16).replace('T', ' ')}`);
  if (ausName.length) {
    console.log('\n  Nach dem NAMEN:');
    for (const d of ausName.sort((a, b) => b.mb - a.mb))
      console.log(`   ${d.mb.toFixed(1).padStart(6)} MB  ${d.pfad}`);
  }

  const ausZeit = alle
    .map((d) => ({ ...d, h: (d.zeit - t) / 3600000 }))
    .filter((d) => Math.abs(d.h) < 72)
    .filter((d) => !ausName.some((x) => x.pfad === d.pfad))
    .sort((a, b) => Math.abs(a.h) - Math.abs(b.h))
    .slice(0, 8);
  if (ausZeit.length) {
    console.log('\n  Nach der ZEIT:');
    for (const d of ausZeit)
      console.log(`   ${(d.h >= 0 ? '+' : '')}${d.h.toFixed(1).padStart(6)} h  ${d.mb.toFixed(1).padStart(5)} MB  ${d.pfad}`);
  }
  if (!ausName.length && !ausZeit.length) { console.log('  Nichts gefunden.'); return; }
  console.log('\n  Vorschlag, keine Zuordnung — die trifft nur, wer die Videos kennt.');
}

/* Was ließe sich allein über die Namen zuordnen? Einmal über alle
   Songs, damit man den ganzen Stapel auf einen Blick hat. */
function vorschlaege() {
  const K = require('./katalog.js');
  const k = K.lesen();
  const songs = Object.values((k && k.songs) || {}).filter((s) => !s.fremd)
    .map((s) => ({ ...s, n: kahl(s.titel) }));
  const dateien = dateienSammeln().filter((d) => !namenlos(d.name));
  let n = 0;
  for (const d of dateien.sort((a, b) => a.name.localeCompare(b.name))) {
    const kn = kahl(d.name);
    if (kn.length < 4) continue;             /* siehe --nahe: leerer Name paßt sonst überall */
    const genau = songs.filter((s) => s.n === kn);
    const teil  = songs.filter((s) => passtTeilweise(kn, s.n));
    const t = genau.length ? genau : teil;
    if (!t.length) continue;
    n++;
    const schon = t.some((s) => fs.existsSync(path.join(SONGS, s.id, 'eigen.mp4')));
    console.log(`  ${genau.length ? '=' : '~'}${schon ? ' ✓' : '  '} ${d.name.slice(0, 40).padEnd(42)}`
      + t.map((s) => s.titel).join(' / ').slice(0, 42));
  }
  console.log(`\n  ${n} Dateien, deren Name auf einen Song paßt.  = genau, ~ teilweise, ✓ schon zugeordnet.`);
  console.log(`  Aus ${dateien.length} Dateien mit sprechendem Namen; Kennungen wie`);
  console.log('  „generated-video-43ff7157-…" bleiben außen vor — die findet nur --nahe.');
}

const args = process.argv.slice(2);
if (args.includes('--vorschlaege')) vorschlaege();
else if (args.includes('--liste')) liste();
else if (args.includes('--loesen')) loesen(args[args.indexOf('--loesen') + 1]);
else if (args.includes('--nahe')) nahe(args[args.indexOf('--nahe') + 1]);
else if (args.length >= 2) zuordnen(args[0], args[1]);
else {
  console.log('  node bin/eigen-artwork.js <song> <datei>    zuordnen');
  console.log('  node bin/eigen-artwork.js --liste           was ist zugeordnet');
  console.log('  node bin/eigen-artwork.js --loesen <song>   wieder entfernen');
  console.log('  node bin/eigen-artwork.js --nahe <song>     Dateien nach Name und Zeit vorschlagen');
  console.log('  node bin/eigen-artwork.js --vorschlaege     alle Namenstreffer auf einmal');
  console.log('');
  console.log('  --ordner <pfad>   zusätzlich dort suchen (sonst nur Downloads,');
  console.log('                    Movies, Desktop, Pictures)');
}
