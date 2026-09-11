#!/usr/bin/env node
/* Ausgabebuch der Effektclips.
 *
 * Das Studio bucht jeden ausgegebenen Clip in library/effektclips.json, damit der Medienlauf ihn
 * wiedererkennt, wenn er von Suno zurückkäme, und ihn dann nicht ins Archiv holt. Clips, die vor
 * dem Ausgabebuch entstanden sind, fehlen dort. Dieses Werkzeug trägt sie nach.
 *
 *   node bin/effektclip-buch.js zeigen               was steht im Buch
 *   node bin/effektclip-buch.js nachtragen [Ordner]  Clips im Ordner messen und zuordnen (nur zeigen)
 *   node bin/effektclip-buch.js nachtragen [Ordner] --schreiben   und wirklich eintragen
 *
 * Ohne Ordner: ~/Downloads. Erkannt werden Dateien, die das Studio benannt hat, also
 * "<Titel> — Effektclip.mp4". Der Titel wird gegen den Katalog gehalten; ist er dort mehrdeutig
 * oder unbekannt, wird nichts eingetragen, sondern berichtet. Geraten wird nicht.
 * (Caspar_D, 11.09.2026: "in meinem downloadordner sind einige mp4's von KlangTresor, erkenne die
 * bitte und schließe sie vom download aus.")
 */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const os = require('node:os');

const WURZEL = path.resolve(__dirname, '..');
const BUCH = path.join(WURZEL, 'library', 'effektclips.json');
const SONGS = path.join(WURZEL, 'library', 'songs');
const MUSTER = / — Effektclip\.mp4$/;

/* Dieselbe Säuberung wie beim Ausgeben im Studio - sonst findet der Titel sich selbst nicht wieder. */
const sauber = t => String(t || '').replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 60);

function buchLesen() { try { return JSON.parse(fs.readFileSync(BUCH, 'utf8')) || {}; } catch (e) { return {}; } }
function buchSchreiben(b) {
  fs.mkdirSync(path.dirname(BUCH), { recursive: true });
  const vor = BUCH + '.neu';
  fs.writeFileSync(vor, JSON.stringify(b, null, 1));
  fs.renameSync(vor, BUCH);
}

function katalogSongs() {
  const gz = path.join(WURZEL, 'library', 'katalog.json.gz');
  if (!fs.existsSync(gz)) throw new Error('library/katalog.json.gz fehlt');
  const k = JSON.parse(zlib.gunzipSync(fs.readFileSync(gz)).toString('utf8'));
  const roh = Array.isArray(k) ? k : (k.songs || {});
  return (Array.isArray(roh) ? roh : Object.values(roh)).filter(s => s && s.id);
}

function messen(datei) {
  try {
    const t = require('node:child_process').execFileSync('ffprobe',
      ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
       '-show_entries', 'format=duration', '-of', 'default=nk=1:nw=1', datei],
      { encoding: 'utf8', timeout: 20000 }).trim().split(/\s+/);
    const breite = parseInt(t[0], 10) || 0, hoehe = parseInt(t[1], 10) || 0, dauer = parseFloat(t[2]);
    if (!isFinite(dauer) || dauer <= 0) return null;
    return { dauer, breite, hoehe };
  } catch (e) { return null; }
}

function zeigen() {
  const b = buchLesen(), ids = Object.keys(b);
  if (!ids.length) { console.log('Das Ausgabebuch ist leer.'); return; }
  const songs = new Map(katalogSongs().map(s => [s.id, s.titel]));
  console.log(`${ids.length} Titel im Ausgabebuch (${path.relative(WURZEL, BUCH)}):\n`);
  for (const id of ids) {
    console.log(`  ${songs.get(id) || '(unbekannter Titel)'}  ${id}`);
    for (const e of b[id]) {
      console.log(`     ${(e.sekunden || 0).toFixed(3)} s · ${e.bilder || '?'} Bilder · ${e.breite || '?'}×${e.hoehe || '?'}`
        + (e.sunoUrl ? '  · bei Suno erkannt' : '  · noch nicht bei Suno gesehen'));
    }
  }
}

function nachtragen(ordner, schreiben) {
  if (!fs.existsSync(ordner)) throw new Error('Ordner gibt es nicht: ' + ordner);
  const dateien = fs.readdirSync(ordner).filter(n => MUSTER.test(n)).sort();
  if (!dateien.length) { console.log('Keine Clips nach dem Muster "<Titel> — Effektclip.mp4" in ' + ordner); return; }

  const songs = katalogSongs();
  /* Ein Titel kann mehrfach vorkommen. Dann wird nichts eingetragen - lieber eine Datei zu viel im
     Archiv als ein falsch zugeordneter Eintrag, der später echtes Material verwirft. */
  const nachTitel = new Map();
  for (const s of songs) {
    const k = sauber(s.titel);
    if (!nachTitel.has(k)) nachTitel.set(k, []);
    nachTitel.get(k).push(s);
  }

  const buch = buchLesen();
  let getragen = 0;
  const offen = [];
  console.log(`${dateien.length} Clip${dateien.length === 1 ? '' : 's'} in ${ordner}\n`);

  for (const name of dateien) {
    const datei = path.join(ordner, name);
    const titel = name.replace(MUSTER, '');
    const treffer = nachTitel.get(sauber(titel)) || [];
    const m = messen(datei);
    const groesse = fs.statSync(datei).size;
    const kopf = `  ${titel}`;

    if (!m) { console.log(`${kopf}\n     ✗ lässt sich nicht messen, ffprobe sagt nichts`); continue; }
    const masse = `${m.dauer.toFixed(3)} s · ${m.breite}×${m.hoehe} · ${(groesse / 1048576).toFixed(1)} MB`;
    if (!treffer.length) { console.log(`${kopf}\n     ${masse}\n     ✗ kein Titel im Katalog — nichts eingetragen`); continue; }
    if (treffer.length > 1) {
      console.log(`${kopf}\n     ${masse}\n     ✗ ${treffer.length} Titel heißen so — nichts eingetragen, das müsste von Hand`);
      continue;
    }
    const s = treffer[0];
    const rezept = path.join(SONGS, s.id, 'eigen-effekt.json');
    const hatRezept = (() => { try { return fs.statSync(rezept).size > 0; } catch (e) { return false; } })();
    const bilder = Math.round(m.dauer * 30);

    const liste = Array.isArray(buch[s.id]) ? buch[s.id] : [];
    const schon = liste.some(e => Math.abs((e.sekunden || 0) - m.dauer) <= 0.02
      && (!e.breite || e.breite === m.breite));
    console.log(`${kopf}\n     ${masse}\n     → ${s.id}`
      + (schon ? '\n     steht schon im Buch' : '')
      + (hatRezept ? '' : '\n     ⚠ beim Titel liegt KEINE gesicherte Effektkette — ohne die wird der Clip trotzdem archiviert'));
    if (!hatRezept) offen.push(titel);
    if (schon) continue;

    liste.push({ zeit: new Date(fs.statSync(datei).mtime).toISOString(), sekunden: +m.dauer.toFixed(4),
      bilder, breite: m.breite, hoehe: m.hoehe, bytes: groesse, nachgetragen: name });
    buch[s.id] = liste.slice(-9);
    getragen++;
  }

  console.log('');
  if (!schreiben) {
    console.log(`Das war nur die Vorschau. ${getragen} ${getragen === 1 ? 'Eintrag' : 'Einträge'} würde${getragen === 1 ? '' : 'n'} geschrieben.`);
    console.log('Zum Eintragen dasselbe noch einmal mit --schreiben.');
  } else if (getragen) {
    buchSchreiben(buch);
    console.log(`${getragen} ${getragen === 1 ? 'Eintrag' : 'Einträge'} ins Ausgabebuch geschrieben: ${path.relative(WURZEL, BUCH)}`);
  } else {
    console.log('Nichts Neues einzutragen.');
  }
  if (offen.length) {
    console.log('\nOhne gesicherte Effektkette bleiben: ' + offen.join(', '));
    console.log('Der Medienlauf archiviert diese Clips trotzdem, denn ohne Kette lassen sie sich nicht neu malen.');
    console.log('Im Studio einmal „Für diesen Titel sichern" drücken, dann bleiben sie draußen.');
  }
}

/* ---- Daumen hoch oder runter -------------------------------------------------------------
   Der Medienlauf urteilt seit dem 11.09.2026 nicht mehr selbst (siehe bin/laden.js). Er merkt nur
   vor, welche Titel ploetzlich ein Video-Artwork tragen, obwohl bei uns ein Export im Buch steht.
   Hier sieht Jörg die Zahlen nebeneinander und entscheidet je Titel. Sein Satz dazu: "Ich werde ja
   nie in einer Nacht mehr als 5 neue Videos zuweisen. Das ist wirklich eher ein kleines Problem."
   Entschiedenes bleibt entschieden: ein Ja hinterlaesst artwork.mp4.eigen.json, ein Nein
   artwork.mp4.fremd.json. Danach wird nicht mehr gefragt. */
const HINWEIS = 'Eigener Effektclip, bei Suno hochgeladen. Nicht archiviert, weil er sich aus '
  + 'eigen-effekt.json jederzeit neu malen laesst. Zum Zurueckholen: diese Datei loeschen und den '
  + 'Eintrag in library/effektclips.json entfernen, dann holt ihn der naechste Medienlauf.';

function offeneFaelle() {
  const buch = buchLesen(), raus = [];
  for (const id of Object.keys(buch)) {
    const ordner = path.join(SONGS, id), datei = path.join(ordner, 'artwork.mp4');
    if (!fs.existsSync(datei)) continue;
    if (fs.existsSync(datei + '.eigen.json') || fs.existsSync(datei + '.fremd.json')) continue;
    raus.push({ id, ordner, datei, eintraege: buch[id] });
  }
  return raus;
}

/* Antwortet auch auf eine durchgereichte Zeile (echo j | ...), damit der Ja-Weg pruefbar ist,
   ohne dass jemand tippen muss. Endet die Eingabe ohne Antwort, gilt das als "weiter". */
function frage(text) {
  return new Promise(r => {
    const rl = require('node:readline').createInterface({ input: process.stdin, output: process.stdout });
    let fertig = false;
    const gib = a => { if (fertig) return; fertig = true; rl.close(); r(String(a || '').trim().toLowerCase()); };
    rl.on('close', () => gib(''));
    rl.question(text, gib);
  });
}

async function pruefen() {
  const faelle = offeneFaelle();
  if (!faelle.length) { console.log('Nichts zu entscheiden — kein unbeurteiltes Video-Artwork bei einem Titel aus dem Buch.'); return; }
  const titelVon = new Map(katalogSongs().map(s => [s.id, { titel: s.titel, url: s.videoCoverUrl }]));
  console.log(`${faelle.length} Titel mit Video-Artwork, fuer die ein Export im Buch steht:\n`);

  const buch = buchLesen();
  let ja = 0, nein = 0;
  for (const f of faelle) {
    const k = titelVon.get(f.id) || {};
    const m = messen(f.datei), groesse = fs.statSync(f.datei).size;
    console.log('  ' + (k.titel || f.id));
    console.log(`     von Suno:   ${m ? m.dauer.toFixed(4) + ' s · ' + m.breite + '×' + m.hoehe : '(nicht messbar)'} · ${(groesse / 1048576).toFixed(1)} MB`);
    for (const e of (f.eintraege || [])) {
      const dB = m ? Math.round((m.dauer - (e.sekunden || 0)) * 30) : null;
      const gleich = m && e.breite && (e.breite !== m.breite || e.hoehe !== m.hoehe);
      console.log(`     unser Export vom ${String(e.zeit).slice(0, 16).replace('T', ' ')}: `
        + `${(e.sekunden || 0).toFixed(4)} s · ${e.breite || '?'}×${e.hoehe || '?'}`
        + (dB === null ? '' : `   → ${dB >= 0 ? '+' : ''}${dB} Bild${Math.abs(dB) === 1 ? '' : 'er'}`)
        + (gleich ? '   ⚠ andere Bildgroesse' : ''));
    }
    const a = await frage('     Unser Clip? [j] ja, rauswerfen  ·  [n] nein, behalten  ·  [w] weiter, spaeter  ›  ');
    console.log('');
    if (a === 'j' || a === 'ja') {
      fs.writeFileSync(f.datei + '.eigen.json', JSON.stringify({
        hinweis: HINWEIS, url: k.url || null, entschieden: new Date().toISOString(),
        entschiedenVon: 'von Hand', gemessen: m, bytes: groesse }, null, 1));
      fs.unlinkSync(f.datei);
      const liste = Array.isArray(buch[f.id]) ? buch[f.id] : [];
      const treffer = m ? liste.find(e => Math.abs((e.sekunden || 0) - m.dauer) < 1) : null;
      if (treffer) { treffer.sunoUrl = k.url || null; treffer.erkannt = new Date().toISOString();
        treffer.gemessen = { dauer: +m.dauer.toFixed(3), breite: m.breite, hoehe: m.hoehe }; }
      ja++;
    } else if (a === 'n' || a === 'nein') {
      fs.writeFileSync(f.datei + '.fremd.json', JSON.stringify({
        hinweis: 'Kein eigener Effektclip — von Hand behalten. Diese Datei loeschen, wenn die Frage neu gestellt werden soll.',
        url: k.url || null, entschieden: new Date().toISOString() }, null, 1));
      nein++;
    }
  }
  if (ja) buchSchreiben(buch);
  console.log(`${ja} rausgeworfen, ${nein} behalten.`
    + (faelle.length - ja - nein ? `  ${faelle.length - ja - nein} bleiben offen.` : ''));
}

const was = process.argv[2];
const rest = process.argv.slice(3).filter(a => a !== '--schreiben');
try {
  if (was === 'zeigen') zeigen();
  else if (was === 'pruefen') { pruefen(); }
  else if (was === 'nachtragen') nachtragen(rest[0] || path.join(os.homedir(), 'Downloads'), process.argv.includes('--schreiben'));
  else { console.log('Aufruf: node bin/effektclip-buch.js zeigen | pruefen | nachtragen [Ordner] [--schreiben]'); process.exit(1); }
} catch (e) { console.error('Abbruch: ' + e.message); process.exit(1); }
