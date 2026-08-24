/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Rechnet die Analysen aller Songs vor und legt sie ab.
 *
 *   node bin/vorrechnen.js            alle offenen Songs
 *   node bin/vorrechnen.js <id>       nur einen
 *   node bin/vorrechnen.js --neu      auch schon vorhandene neu rechnen
 *
 * WARUM IN NODE UND NICHT IM BROWSER
 * Eine Schleife in der geöffneten Seite bricht bei jedem Neuladen ab und
 * belegt das Archiv, solange sie läuft. Der Rechenkern liegt seit dem
 * 18.08.2026 ausdrücklich als eigene Datei daneben, damit Node dasselbe
 * rechnen kann; das Ablageformat und die Bildmathematik seit dem
 * 19.08.2026 ebenso. Hier wird beides benutzt - es gibt keine zweite
 * Fassung, die auseinanderlaufen könnte.
 *
 * WAS ENTSTEHT, je Song rund 11,7 MB:
 *   library/analyse/<id>.bin            die Meßreihen
 *   library/analyse/<id>.spektro.webp   Spektrogramm
 *   library/analyse/<id>.stereo.webp    Stereo-Spektrogramm
 *
 * Die Bilder sind der größere Teil der Arbeit und werden deshalb hier
 * mitgerechnet (Caspar_D, 19.08.2026). Node malt sie nicht auf einen Canvas
 * - es rechnet die Bildpunkte und schiebt sie als rohe RGBA durch
 * ffmpeg. Der Umweg über PNG entfällt damit ganz.
 *
 * Wiederaufsetzbar: Was vollständig daliegt, wird übersprungen. Ein
 * Abbruch mitten im Song hinterläßt nichts Halbes - geschrieben wird
 * erst, wenn alle drei Teile fertig sind.
 */
const fs   = require('node:fs');
// vm bewusst nicht mehr - siehe kernLaden()
const path = require('node:path');
const { spawnSync, spawn } = require('node:child_process');
const K    = require('./katalog.js');

const WURZEL  = path.join(__dirname, '..');
const ANALYSE = path.join(WURZEL, 'library', 'analyse');
const SONGS   = path.join(WURZEL, 'library', 'songs');
const FREMD   = path.join(WURZEL, 'web', 'fremd');

/* Muß zu PUFFER_MAX und der Panelhöhe im Analyzer passen. Beides steht
   dort als Zahl; hier noch einmal, weil Node den Analyzer nicht lädt.
   Ändert sich eines, ändert sich das Bild - deshalb steht die Prüfung
   unten in der Abnahme. */
const PUFFER_MAX = 16383;   // WebP-Grenze, siehe analyzer.js
const BILD_HOEHE = 180;

/* ------------------------------------------------------------------
   Den Rechenkern und das Ablageformat laden.

   Beide sind für den Browser geschrieben und brauchen nur ein paar
   Attrappen. Dasselbe Verfahren wie in bin/pruefe-lautheit.js.
------------------------------------------------------------------ */
/* NICHT vm.runInContext. Gemessen am 19.08.2026 an einem Song mit
   71 MB WAV: Rechenkern in der vm-Sandbox 224 s, derselbe Code im
   Hauptkontext 25 s - Faktor neun. Die Sandbox hindert V8 daran, die
   Schleifen ueber typisierte Arrays zu optimieren, und die FFT besteht
   aus nichts anderem. Alles andere - Bilder, WebP, Verpacken - war
   zusammen unter einer Sekunde; die Bremse sass allein hier.

   Deshalb: Quelltext in eine Funktion wickeln und mit new Function im
   Hauptkontext ausfuehren. Die Attrappen (postMessage, self) werden
   als Parameter gereicht; der Kern merkt keinen Unterschied. */
function kernLaden(){
  const u = { postMessage(){}, onmessage:null };
  u.self = u;
  const ablage = fs.readFileSync(path.join(FREMD, 'analyse-ablage.js'), 'utf8');
  const kern   = fs.readFileSync(path.join(FREMD, 'analyzer-worker.js'), 'utf8');
  const bauen = new Function('self', 'console', 'process', 'Buffer',
    'var postMessage = function(m){ return self.postMessage(m); };\n' +
    ablage + '\n' + kern +
    '\nreturn { onmessage: onmessage, ablageVerpacken: ablageVerpacken, ablageEntpacken: ablageEntpacken,' +
    ' spektroBildFuellen: spektroBildFuellen, stereoBildFuellen: stereoBildFuellen };');
  /* postMessage muss den Kern erreichen - er ruft es als freie
     Variable. Ueber 'self' mit einem Getter, der auf das Feld zeigt,
     das wir spaeter umhaengen. */
  const teile = bauen.call(u, u, console, process, Buffer);
  return Object.assign(u, teile);
}

/* ------------------------------------------------------------------
   Ton nach Abtastwerten.

   ffmpeg liefert rohe 32-Bit-Fließkommazahlen, verschränkt L,R,L,R.
   Die Abtastrate wird NICHT umgerechnet: Der Rechenkern bekommt, was
   in der Datei steht, genau wie im Browser.
------------------------------------------------------------------ */
function tonLesen(datei){
  const kopf = spawnSync('ffprobe', ['-v','error','-select_streams','a:0',
    '-show_entries','stream=sample_rate','-of','csv=p=0', datei], {encoding:'utf8'});
  const sr = parseInt((kopf.stdout||'').trim(), 10);
  if (!sr) throw new Error('Abtastrate nicht lesbar: ' + kopf.stderr);

  const roh = spawnSync('ffmpeg', ['-v','error','-i', datei,
    '-f','f32le','-ac','2','-'], { maxBuffer: 1024*1024*1024 });
  if (roh.status !== 0) throw new Error('ffmpeg: ' + roh.stderr);

  const paare = new Float32Array(roh.stdout.buffer, roh.stdout.byteOffset,
                                 Math.floor(roh.stdout.length/4));
  const n = Math.floor(paare.length/2);
  const left = new Float32Array(n), right = new Float32Array(n);
  for (let i=0;i<n;i++){ left[i]=paare[2*i]; right[i]=paare[2*i+1]; }
  return { left, right, sr };
}

/* ------------------------------------------------------------------
   Bildpunkte -> Datei.

   WEBP WAR DER PLAN UND IST ES GEBLIEBEN - nur nicht über ffmpeg. Das
   Homebrew-ffmpeg 9.0.1 ist ohne `--enable-libwebp` gebaut; es bringt
   den WebP-*Muxer* mit, aber keinen *Encoder*, und der erste Lauf
   schrieb deshalb gar nichts ("Unknown encoder 'libwebp'").

   `cwebp` aus demselben Homebrew (Paket `webp`) kann es und liegt
   ohnehin schon da. Es liest PPM von der Standardeingabe - und einen
   PPM-Kopf schreibt man selbst in drei Zeilen. Damit ist für die
   Bilder GAR KEIN ffmpeg mehr nötig, nur noch für den Ton.

   Fehlt cwebp, geht es über ffmpeg als PNG weiter: größer, aber
   überall vorhanden. Der Analyzer liest beide Endungen.
------------------------------------------------------------------ */
const HAT_CWEBP = spawnSync('cwebp', ['-version']).status === 0;

function alsBild(rgba, breite, hoehe, ohneEndung){
  return HAT_CWEBP ? alsWebp(rgba, breite, hoehe, ohneEndung + '.webp')
                   : alsPng (rgba, breite, hoehe, ohneEndung + '.png');
}

/* PPM P6 traegt drei Bytes je Punkt, kein Alpha. Unseres ist ueberall
   255 - es faellt also nichts weg, nur ein Viertel der Bytes. */
function alsPpm(rgba, breite, hoehe){
  const kopf = Buffer.from(`P6\n${breite} ${hoehe}\n255\n`, 'ascii');
  const rgb = Buffer.allocUnsafe(breite*hoehe*3);
  for (let i=0, j=0; j<rgb.length; i+=4, j+=3){
    rgb[j]=rgba[i]; rgb[j+1]=rgba[i+1]; rgb[j+2]=rgba[i+2];
  }
  return Buffer.concat([kopf, rgb]);
}

function durchRohr(programm, argumente, eingabe){
  return new Promise((fertig, schiefgelaufen) => {
    const kind = spawn(programm, argumente);
    let meldung = '';
    kind.stderr.on('data', d => meldung += d);
    kind.on('close', c => c===0 ? fertig()
      : schiefgelaufen(new Error(programm + ': ' + meldung.slice(0,200))));
    kind.stdin.on('error', () => {});
    kind.stdin.end(eingabe);
  });
}

function alsWebp(rgba, breite, hoehe, ziel){
  return durchRohr('cwebp', ['-quiet','-q','92','-o',ziel,'--','-'],
                   alsPpm(rgba, breite, hoehe));
}

function alsPng(rgba, breite, hoehe, ziel){
  return durchRohr('ffmpeg', ['-v','error','-y',
    '-f','rawvideo','-pix_fmt','rgba','-s',`${breite}x${hoehe}`,'-i','-',
    '-c:v','png', ziel],
    Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength));
}

/* ------------------------------------------------------------------
   Ein Song.
------------------------------------------------------------------ */
async function einenRechnen(kern, id, titel){
  const wav = path.join(SONGS, id, 'audio.wav');
  const mp3 = path.join(SONGS, id, 'audio.mp3');
  const datei = fs.existsSync(wav) ? wav : mp3;
  if (!fs.existsSync(datei)) throw new Error('kein Ton');

  const { left, right, sr } = tonLesen(datei);

  /* Die Nachrichten einsammeln - je Art nur die letzte, genau wie im
     Browser: Der Kern schickt fünf FFT-Runden mit vollem Kurvensatz,
     und nur die letzte ist gemeint. */
  const nachrichten = [];
  kern.postMessage = (msg) => {
    if (!msg || msg.type === 'progress') return;
    const i = nachrichten.findIndex(m => m.type === msg.type);
    if (i >= 0) nachrichten[i] = msg; else nachrichten.push(msg);
  };
  kern.onmessage({ data: { left, right, sr } });

  const fft = nachrichten.find(m => /^fft/.test(m.type||''));
  if (!fft) throw new Error('keine FFT-Nachricht');

  /* --- Die Meßreihen --- */
  const paket = kern.ablageVerpacken({ id, nachrichten,
                                       sr, dauer: left.length/sr });

  /* --- Die beiden Bilder --- */
  const bins = fft.fftSize/2;
  const bw = Math.min(fft.numFrames, PUFFER_MAX), bh = BILD_HOEHE;
  const logMin = Math.log10(20), logMax = Math.log10(sr/2);

  /* Die Perzentile je Band - im Browser rechnet sie die Zeichenfunktion,
     hier muß es davor geschehen. Dieselbe Einteilung: p5 als Tor gegen
     das Grundrauschen, das obere Quartil als Mitte, p95 als Klippe. */
  const P_MITTE = 0.75;
  const p5 = new Float32Array(bins), pM = new Float32Array(bins), p95 = new Float32Array(bins);
  for (let k=0;k<bins;k++){
    const v = new Float32Array(fft.numFrames);
    for (let f=0;f<fft.numFrames;f++) v[f] = fft.frames[f*bins+k]/255;
    v.sort();
    p5[k]  = v[Math.floor(fft.numFrames*0.05)];
    pM[k]  = v[Math.floor(fft.numFrames*P_MITTE)];
    p95[k] = v[Math.floor(fft.numFrames*0.95)];
  }

  const bildA = new Uint8ClampedArray(bw*bh*4);
  kern.spektroBildFuellen(bildA, bw, bh, { frames:fft.frames, numFrames:fft.numFrames,
    bins, fftSize:fft.fftSize, sr, logMin, logMax, p5, pM, p95 });

  let bildB = null;
  if (fft.stereoFrames){
    const sf = fft.stereoFrames instanceof Int8Array ? fft.stereoFrames
             : new Int8Array(fft.stereoFrames.buffer || fft.stereoFrames);
    /* Die Streckung über alle Bilder - dieselbe wie im Browser. */
    const alle = [];
    for (let i=0;i<sf.length;i++) alle.push(Math.abs(sf[i]));
    alle.sort((a,b)=>a-b);
    const p95s = alle[Math.floor(alle.length*0.95)] || 1;
    bildB = new Uint8ClampedArray(bw*bh*4);
    kern.stereoBildFuellen(bildB, bw, bh, { stereoFrames:sf, monoFrames:fft.frames,
      numFrames:fft.numFrames, bins, fftSize:fft.fftSize, sr, logMin, logMax,
      scale: p95s>0 ? 127/p95s : 1 });
  }

  /* --- Schreiben, erst wenn alles steht --- */
  fs.mkdirSync(ANALYSE, { recursive: true });
  const ziel = e => path.join(ANALYSE, `${id}.${e}`);
  const endung = HAT_CWEBP ? '.webp' : '.png';
  await alsBild(bildA, bw, bh, path.join(ANALYSE, `${id}.spektro`));
  if (bildB) await alsBild(bildB, bw, bh, path.join(ANALYSE, `${id}.stereo`));
  fs.writeFileSync(ziel('bin'), paket);

  return { bytes: paket.length + fs.statSync(ziel('spektro'+endung)).size
                 + (bildB ? fs.statSync(ziel('stereo'+endung)).size : 0) };
}

/** Liegt der Song vollständig da? Eine halbe Analyse ist keine. */
function fertig(id){
  /* Beide Endungen gelten: Der Browser hat frueher WebP geschrieben,
     Node schreibt PNG. Was da ist, ist da. */
  const da = e => fs.existsSync(path.join(ANALYSE, `${id}.${e}`));
  return da('bin') && (da('spektro.webp')||da('spektro.png'))
                   && (da('stereo.webp') ||da('stereo.png'));
}

(async function(){
  for (const werkzeug of ['ffmpeg','ffprobe']){
    if (spawnSync(werkzeug, ['-version']).status !== 0){
      console.error(`\n  ${werkzeug} fehlt. Auf dem Mac:  brew install ffmpeg\n`);
      process.exit(1);
    }
  }

  const katalog = K.lesen();
  if (!katalog){ console.error('Kein Katalog - erst node bin/aufbereiten.js'); process.exit(1); }

  const args = process.argv.slice(2);
  const neu  = args.includes('--neu');
  const nur  = args.find(a => /^[0-9a-f-]{36}$/.test(a));

  let liste = Object.values(katalog.songs).filter(s => !s.fremd);
  if (nur) liste = liste.filter(s => s.id === nur);
  const offen = neu ? liste : liste.filter(s => !fertig(s.id));

  if (!args.includes('--still'))
    console.log(`\n  ${liste.length - offen.length} liegen vor, ${offen.length} offen.\n`);

  if (!offen.length) return;

  /* PARALLEL UEBER DIE SONGS. 321 unabhaengige Arbeiten; jeder Kern
     der Maschine nimmt sich den naechsten. Nicht mehr als Kerne minus
     eins, damit der Server und die Oberflaeche atmen koennen. (Caspar_D,
     19.08.2026: "das kann man doch super parallelisieren.") Ein
     Arbeiter = ein Kindprozess mit diesem Skript und einer ID; so
     bleibt der Speicher je Song getrennt und ein Absturz reisst nicht
     alle mit. */
  const os = require('node:os');
  const PARALLEL = Math.max(1, Math.min(6, os.cpus().length - 1));
  if (!nur && offen.length > 1 && !args.includes('--seriell')) {
    console.log(`  ${PARALLEL} Arbeiter parallel.\n`);
    const warteschlange = offen.slice();
    const beginn = Date.now();
    let getan = 0, schief = 0, laufend = 0;
    await new Promise((fertigAlle) => {
      const naechster = () => {
        if (!warteschlange.length) { if (!laufend) fertigAlle(); return; }
        const s = warteschlange.shift(); laufend++;
        const t0 = Date.now();
        const kind = require('node:child_process').spawn(process.execPath,
          [__filename, s.id, '--still'], { cwd: WURZEL, stdio: ['ignore','pipe','pipe'] });
        let aus = '';
        kind.stdout.on('data', d => aus += d); kind.stderr.on('data', d => aus += d);
        kind.on('close', (c) => {
          laufend--;
          if (c === 0) getan++; else schief++;
          /* Wanduhr je FERTIGEM Song, und die ist durch die Parallelitaet
             schon geteilt - wer hier noch einmal teilt, zeigt 932 min
             fuer acht. Rest = offene Songs mal Wanduhr je Song. */
          const proSongWanduhr = (Date.now()-beginn)/Math.max(1,getan+schief)/1000;
          const rest = Math.round((warteschlange.length + laufend) * proSongWanduhr / 60);
          console.log(`  ${String(getan+schief).padStart(3)}/${offen.length}  ` +
            `${((Date.now()-t0)/1000).toFixed(0).padStart(3)} s  ` +
            `${(s.titel||s.id).slice(0,44).padEnd(44)}  ${c===0?'':'✗ '}noch rund ${rest} min`);
          if (c !== 0 && aus.trim()) console.log('      ' + aus.trim().split('\n').pop().slice(0,90));
          naechster();
        });
      };
      for (let i = 0; i < PARALLEL; i++) naechster();
    });
    console.log(`\n  Fertig: ${getan} gerechnet, ${schief} übersprungen.\n`);
    return;
  }

  const kern = kernLaden();
  const beginn = Date.now();
  let getan = 0, bytes = 0, schief = 0;
  const still = args.includes('--still');

  for (const s of offen){
    const t0 = Date.now();
    try {
      const e = await einenRechnen(kern, s.id, s.titel);
      bytes += e.bytes; getan++;
      const proSong = (Date.now()-beginn)/getan/1000;
      const rest = Math.round((offen.length-getan)*proSong/60);
      if (!still) console.log(`  ${String(getan).padStart(3)}/${offen.length}  ` +
        `${((Date.now()-t0)/1000).toFixed(0).padStart(3)} s  ` +
        `${(s.titel||s.id).slice(0,44).padEnd(44)}  noch rund ${rest} min`);
    } catch (e){
      schief++;
      console.log(`  ---/${offen.length}  übersprungen: ${(s.titel||s.id).slice(0,40)} — ${e.message}`);
    }
  }

  if (!still) console.log(`\n  Fertig: ${getan} gerechnet, ${schief} übersprungen, ` +
              `${(bytes/1073741824).toFixed(2)} GB.\n`);
  if (schief && nur) process.exit(1);
})();
