#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Stem-Trennung: ein Lied in seine Spuren zerlegen - lokal, ohne Python.
 *
 *   node bin/stems.js                   alle Songs ohne Stems
 *   node bin/stems.js <id>              nur diesen
 *   node bin/stems.js --neueste 5       die fuenf juengsten Titel
 *   node bin/stems.js --anzahl 5        fuenf beliebige ohne Stems
 *   node bin/stems.js --neu             auch neu rechnen, was schon da ist
 *   node bin/stems.js --still           ohne Lebenszeichen je Abschnitt
 *   node bin/stems.js --liste <datei>   diese Reihenfolge (eine ID je Zeile),
 *                                       danach alles Uebrige
 *
 * Ergebnis: library/songs/<id>/stems/{drums,bass,other,vocals,guitar,piano}.flac
 *   FLAC, verlustfrei, 44,1 kHz Stereo 16 Bit - dieselbe Aufloesung wie die
 *   Suno-WAVs, nur halb so gross. Rund 250 MB je Lied fuer alle sechs.
 *
 * WARUM OHNE PYTHON (Caspar_D, 23.08.2026: "wenn wir also in unserer Welt
 * bleiben"): Der Analyzer konnte das schon, aber nur ueber einen eigenen
 * Python-Server (~/demucs-env, demucs_watchdog.sh) - eine Abhaengigkeit
 * ausserhalb des Projekts, die kein Tester je einrichtet. Seit dem
 * ONNX-Export von htdemucs (Mixxx, GSoC 2025) geht es mit demselben
 * onnxruntime-node, das der Klangraum ohnehin benutzt. Kein Python, kein
 * Watchdog, keine Fremdadresse.
 *
 * Modell: library/modelle/htdemucs_6s.onnx (246 MB, MIT, von
 * huggingface.co/StemSplitio/htdemucs-6s-onnx). Die Spektralrechnung
 * steckt IM Graphen - hier geht rohes Audio hinein und rohe Spuren
 * kommen heraus. Eingang [1,2,343980] float32, Ausgang [1,6,2,343980].
 *
 * Verfahren wie in der Referenz-Inferenz des Modells:
 *   Abschnitte von 7,8 s (343.980 Abtastwerte bei 44,1 kHz)
 *   Ueberlappung ein Viertel davon, Trapezfenster an den Raendern,
 *   ueberlagern und am Ende durch die Summe der Gewichte teilen.
 * Eine Normierung von aussen braucht es NICHT; sie ist einexportiert.
 *
 * Rechenzeit: gemessen 3,6 s je Abschnitt auf diesem Mac, also gut
 * zweifache Echtzeit - etwa vier Minuten je Lied. Mac bleibt wach
 * (caffeinate wie in klang.js und whisper.js).
 *
 * DIE SUNO-WAVS WERDEN NUR GELESEN. Die Stems sind neue Dateien
 * daneben; nichts am Original wird angefasst.
 */
'use strict';
const fs   = require('node:fs');
const path = require('node:path');
const os   = require('node:os');
const { spawnSync } = require('node:child_process');

const WURZEL  = path.join(__dirname, '..');
const SONGS   = path.join(WURZEL, 'library', 'songs');
const MODELLE = path.join(WURZEL, 'library', 'modelle');
const MODELL  = path.join(MODELLE, 'htdemucs_6s.onnx');
const args    = process.argv.slice(2);

/* Mac wach halten - ein Durchgang ueber viele Lieder laeuft Stunden. */
if (process.platform === 'darwin' && !process.env.STEMS_WACH) {
  const r = spawnSync('caffeinate', ['-i', process.execPath, __filename, ...args],
    { stdio: 'inherit', env: { ...process.env, STEMS_WACH: '1' } });
  process.exit(r.status === null ? 1 : r.status);
}

const ort = require('onnxruntime-node');
const K   = require('./katalog.js');

const still = args.includes('--still');
const neu   = args.includes('--neu');
const zahl  = (schalter) => {
  const i = args.indexOf(schalter);
  return i >= 0 && args[i + 1] ? parseInt(args[i + 1], 10) : null;
};
const neueste = zahl('--neueste');
/* Reihenfolge vorgeben: Wer eine Liste mitgibt, bekommt die zuerst
   gerechnet und den Rest danach. Bei einem Lauf ueber Stunden will man
   die Songs vorn haben, an denen etwas geprueft werden soll. */
const listeArg = (() => { const i = args.indexOf('--liste');
  return i >= 0 && args[i+1] ? args[i+1] : null; })();
const anzahl  = zahl('--anzahl');
const nur     = args.find(a => /^[0-9a-f-]{30,}$/i.test(a)) || null;

/* ---- Modellmasse (aus der Referenz-Inferenz) ------------------------- */
const SR        = 44100;
const N_ABSCHN  = 343980;              // 7,8 s
const UEBERLAPP = N_ABSCHN >> 2;       // ein Viertel
const SCHRITT   = N_ABSCHN - UEBERLAPP;
/* NICHT UMSORTIEREN. Diese Reihenfolge ist die Ausgabereihenfolge von
   htdemucs_6s, nicht unsere. Der Index bindet an den Modellausgang:
   aus[s] ist der s-te Ausgang, SPUREN[s] gibt ihm seinen Namen. Wer die
   Liste umstellt, schreibt das Schlagzeug in vocals.flac.

   Die Reihenfolge, in der die Spuren ANGEZEIGT werden, ist eine andere -
   sie steht in web/fremd/analyzer.js bei STEM_RANG und ordnet nach
   Zuverlässigkeit. Die beiden haben nichts miteinander zu tun. */
const SPUREN    = ['drums', 'bass', 'other', 'vocals', 'guitar', 'piano'];

/* Trapez: an beiden Raendern linear ein- und ausblenden, in der Mitte
   voll. Zwei benachbarte Abschnitte ergaenzen sich damit zu 1, und die
   Naht faellt nicht auf. */
function fenster() {
  const w = new Float32Array(N_ABSCHN).fill(1);
  for (let i = 0; i < UEBERLAPP; i++) {
    const v = i / (UEBERLAPP - 1);
    w[i] = v;
    w[N_ABSCHN - 1 - i] = v;
  }
  return w;
}

/* ---- Audio: ffmpeg liefert 44,1 kHz Stereo als rohe float32 --------- */
function pcmLaden(datei) {
  const ff = spawnSync('ffmpeg', ['-v', 'error', '-i', datei, '-ac', '2',
    '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30, encoding: 'buffer' });
  if (ff.status !== 0) throw new Error('ffmpeg: ' + String(ff.stderr || '').trim().slice(0, 160));
  const roh = new Float32Array(ff.stdout.buffer, ff.stdout.byteOffset, ff.stdout.byteLength >> 2);
  /* ffmpeg gibt verschraenkt (L R L R ...), das Modell will die Kanaele
     getrennt hintereinander. */
  const n = roh.length >> 1;
  const links = new Float32Array(n), rechts = new Float32Array(n);
  for (let i = 0; i < n; i++) { links[i] = roh[i * 2]; rechts[i] = roh[i * 2 + 1]; }
  return { links, rechts, n };
}

/* ---- Eine Spur schreiben -------------------------------------------- */
/* KEINE PIPE (25.08.2026, nach dem dritten Stillstand in drei Naechten).
   Die Rohdaten gingen vorher als `input:` durch pipe:0 an ffmpeg - bei
   fuenf Minuten Musik rund 105 MB. Dreimal blieb der Lauf genau dabei
   stehen:

     24.08.   9d375ce4...    drums, bass, other da    8,5 h still
     25.08.   "Kerze"        drums, bass, other da    1:58 h still
     25.08.   "Erste Liebe"  drums, bass, other da    3:19 h still

   Jedes Mal stand ein ffmpeg bei 0,0 Prozent CPU an pipe:0 und schrieb
   other.flac - die dritte Spur. Kein Fehler im Protokoll, denn spawnSync
   blockiert, statt zu scheitern: der Aufrufer merkt nichts und wartet mit.

   Geprueft und ausgeschlossen (Caspar_D fragte danach): kein Platzmangel -
   973 GB frei, und der exFAT-Verschnitt aus 917 kleinen Dateien betraegt
   2,4 GB. Kein Speichermangel - 64 GB im Rechner, der Lauf hielt 10.

   Die genaue Ursache des Deadlocks kenne ich nicht. Der Weg drumherum ist
   billig: die Rohdaten in eine Datei neben dem Ziel, ffmpeg liest daraus,
   die Datei faellt danach weg. Ein Schreibvorgang je Spur, auf der SSD
   belanglos gegen einen Lauf, der ueber Nacht steht. Und es gibt nichts
   mehr, was klemmen kann. */
function flacSchreiben(links, rechts, n, ziel) {
  const verschraenkt = Buffer.allocUnsafe(n * 2 * 4);
  const sicht = new Float32Array(verschraenkt.buffer, verschraenkt.byteOffset, n * 2);
  for (let i = 0; i < n; i++) { sicht[i * 2] = links[i]; sicht[i * 2 + 1] = rechts[i]; }
  const roh = ziel + '.f32';
  fs.writeFileSync(roh, verschraenkt);
  try {
    const ff = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR),
      '-ac', '2', '-i', roh, '-c:a', 'flac', '-sample_fmt', 's16', ziel],
      { maxBuffer: 1 << 24 });
    if (ff.status !== 0) throw new Error('ffmpeg (schreiben): ' + String(ff.stderr || '').trim().slice(0, 160));
  } finally {
    /* Auch wenn ffmpeg scheitert: die 105 MB bleiben nicht liegen. */
    try { fs.unlinkSync(roh); } catch (e) {}
  }
}

/* ---- Ein Lied -------------------------------------------------------- */
async function trennen(sitzung, quelle, zielOrdner, name) {
  const { links, rechts, n } = pcmLaden(quelle);
  const w = fenster();
  const abschnitte = Math.max(1, Math.ceil(n / SCHRITT));

  /* Ergebnis und Gewichtssumme ueber die ganze Laenge. Sechs Spuren mal
     zwei Kanaele - bei sieben Minuten sind das gut 800 MB, deshalb
     Float32Array und nicht mehr. */
  const aus = Array.from({ length: SPUREN.length }, () => ({
    l: new Float32Array(n), r: new Float32Array(n) }));
  const gewicht = new Float32Array(n);

  const puffer = new Float32Array(2 * N_ABSCHN);
  const t0 = Date.now();
  for (let i = 0; i < abschnitte; i++) {
    const von = i * SCHRITT, bis = Math.min(von + N_ABSCHN, n), len = bis - von;
    puffer.fill(0);
    puffer.set(links.subarray(von, bis), 0);
    puffer.set(rechts.subarray(von, bis), N_ABSCHN);

    const r = await sitzung.run({ mix: new ort.Tensor('float32', puffer, [1, 2, N_ABSCHN]) });
    const d = r[sitzung.outputNames[0]].data;

    for (let s = 0; s < SPUREN.length; s++) {
      const bl = (s * 2) * N_ABSCHN, br = (s * 2 + 1) * N_ABSCHN;
      const zl = aus[s].l, zr = aus[s].r;
      for (let k = 0; k < len; k++) { zl[von + k] += d[bl + k] * w[k]; zr[von + k] += d[br + k] * w[k]; }
    }
    for (let k = 0; k < len; k++) gewicht[von + k] += w[k];

    if (!still) {
      const p = ((i + 1) / abschnitte * 100).toFixed(0);
      process.stdout.write('\r    ' + name.slice(0, 30).padEnd(32) + (i + 1) + '/' + abschnitte
        + ' Abschnitte (' + p + ' %)   ');
    }
  }
  if (!still) process.stdout.write('\r' + ' '.repeat(78) + '\r');

  /* Durch die Gewichtssumme teilen - erst dadurch wird aus dem
     Ueberlagern ein sauberer Uebergang. */
  for (let s = 0; s < SPUREN.length; s++) {
    const zl = aus[s].l, zr = aus[s].r;
    for (let k = 0; k < n; k++) { const g = gewicht[k] || 1e-8; zl[k] /= g; zr[k] /= g; }
  }

  fs.mkdirSync(zielOrdner, { recursive: true });
  for (let s = 0; s < SPUREN.length; s++) {
    flacSchreiben(aus[s].l, aus[s].r, n, path.join(zielOrdner, SPUREN[s] + '.flac'));
  }
  return { sekunden: n / SR, dauer: (Date.now() - t0) / 1000, abschnitte };
}

/* ---- Lauf ------------------------------------------------------------ */
(async () => {
  if (!fs.existsSync(MODELL)) {
    console.log('  Stems: das Modell fehlt — library/modelle/htdemucs_6s.onnx.');
    console.log('  Holen mit:  node bin/modelle-holen.js');
    return;
  }
  const katalog = K.lesen();
  if (!katalog) { console.log('  Stems: noch kein Katalog — erst sammeln.'); return; }

  let liste = Object.values(katalog.songs || {})
    .filter(s => fs.existsSync(path.join(SONGS, s.id, 'audio.wav')));

  if (nur) liste = liste.filter(s => s.id === nur);
  if (neueste) {
    liste.sort((a, b) => String(b.erstellt || '').localeCompare(String(a.erstellt || '')));
    liste = liste.slice(0, neueste);
  }
  if (!neu && !nur) liste = liste.filter(s =>
    !fs.existsSync(path.join(SONGS, s.id, 'stems', 'piano.flac')));
  if (listeArg) {
    const rang = new Map();
    fs.readFileSync(listeArg, 'utf8').split('\n').map(z => z.trim())
      .filter(Boolean).forEach((id, i) => rang.set(id, i));
    liste.sort((a, b) => (rang.has(a.id) ? rang.get(a.id) : 1e9)
                       - (rang.has(b.id) ? rang.get(b.id) : 1e9));
    console.log('  Reihenfolge aus ' + listeArg + ': ' + rang.size + ' Songs zuerst');
  }
  if (anzahl) liste = liste.slice(0, anzahl);

  if (!liste.length) { console.log('  Stems: nichts zu tun.'); return; }
  console.log('  Stems: ' + liste.length + ' Lied(er) · Modell htdemucs_6s · '
    + (+process.env.STEMS_KERNE || Math.max(2, Math.floor(os.cpus().length / 2)))
    + ' von ' + os.cpus().length + ' Kernen');

  /* NICHT ALLE KERNE. Mit os.cpus().length zog der Lauf 1105 % CPU, und
     der Rechner war waehrenddessen nicht mehr zu bedienen - der Browser
     blieb beim Abspielen der Stems stehen (24.08.2026). Ein Durchgang
     ueber 300 Lieder laeuft Stunden; er darf dabei nicht die Maschine
     belegen. Vier Kerne bleiben frei. */
  /* NUR DIE HAELFTE DER KERNE, und interOp ausdruecklich auf 1.
     Mit intraOpNumThreads allein zog der Lauf weiter 1150 % - ONNX
     verteilt auch ueber die Operator-Ebene. Ein Durchgang laeuft
     Stunden und darf die Maschine nicht belegen; wer daneben am
     Analyzer arbeitet, hat sonst einen stehenden Browser
     (Caspar_D, 24.08.2026). Die Umgebungsvariable STEMS_KERNE hebt es auf. */
  const kerne = +process.env.STEMS_KERNE || Math.max(2, Math.floor(os.cpus().length / 2));
  const sitzung = await ort.InferenceSession.create(MODELL, {
    executionProviders: ['cpu'], graphOptimizationLevel: 'all',
    intraOpNumThreads: kerne, interOpNumThreads: 1 });

  let i = 0;
  for (const s of liste) {
    i++;
    const ordner = path.join(SONGS, s.id, 'stems');
    const kopf = '  [' + i + '/' + liste.length + '] ' + (s.titel || s.id).slice(0, 34);
    try {
      const e = await trennen(sitzung, path.join(SONGS, s.id, 'audio.wav'), ordner,
                              (s.titel || s.id));
      const gross = fs.readdirSync(ordner).reduce((a, f) =>
        a + fs.statSync(path.join(ordner, f)).size, 0);
      console.log(kopf.padEnd(44) + (e.dauer / 60).toFixed(1) + ' min für '
        + (e.sekunden / 60).toFixed(1) + ' min Musik ('
        + (e.sekunden / e.dauer).toFixed(1) + '× Echtzeit) · '
        + (gross / 1048576).toFixed(0) + ' MB');
    } catch (err) {
      console.log(kopf.padEnd(44) + 'gescheitert: ' + String(err.message).slice(0, 70));
    }
  }
})();
