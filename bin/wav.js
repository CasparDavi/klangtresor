/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ============================================================
   KlangTresor · WAV-Dateien prüfen und holen
   ------------------------------------------------------------
   Suno legt das WAV eines Songs NICHT von sich aus an. Es entsteht
   erst, wenn es einmal über die Website angestoßen wurde
   (··· → Download → WAV Audio). Danach liegt es offen auf dem CDN
   unter cdn1.suno.ai/<id>.wav und lässt sich ohne Anmeldung holen -
   genau wie das MP3.

   Dieses Skript macht die andere Hälfte der Arbeit:
     --pruefen   für jeden Song nachsehen, ob ein WAV existiert
     (ohne)      alle vorhandenen WAVs herunterladen

   Das Anstoßen selbst geht nur über die Website; der auslösende
   Aufruf liegt hinter einem verschleierten Pfad.

   Reihenfolge: älteste zuerst.

   Aufruf:
     node bin/wav.js --pruefen        nur nachsehen, nichts laden
     node bin/wav.js                  vorhandene WAVs holen
     node bin/wav.js --test 5         nur die ersten fünf
   ============================================================ */

const fs   = require('node:fs');
const path = require('node:path');
const https= require('node:https');
const K    = require('./katalog.js');

const WURZEL = path.join(__dirname, '..');
const SONGS  = path.join(WURZEL, 'library', 'songs');
const STAND  = path.join(WURZEL, 'library', 'wav-stand.json');

const args = process.argv.slice(2);
const NUR_PRUEFEN = args.includes('--pruefen');
const TESTZAHL = args.includes('--test')
  ? parseInt(args[args.indexOf('--test') + 1], 10) || 5 : null;

const schlaf = (ms) => new Promise(r => setTimeout(r, ms));
const mb = (b) => (b / 1048576).toFixed(1) + ' MB';

/* Prüfen, ob ein WAV auf dem CDN liegt.

   Ein Bereichsabruf über die ersten Bytes genügt und lädt fast
   nichts. 403 heißt: noch nicht angestoßen. Sehr wichtig: MIT
   Zeitlimit - ein frisch angestoßenes WAV lässt die Verbindung
   offen stehen, solange es noch gerechnet wird. */
function wavDa(id, zeitlimit = 20000){
  return new Promise(fertig => {
    const req = https.get(`https://cdn1.suno.ai/${id}.wav`,
      { headers: { Range: 'bytes=0-1023' } }, res => {
        const groesse = res.headers['content-range']
          ? parseInt(String(res.headers['content-range']).split('/')[1], 10) : null;
        res.destroy();
        fertig({ da: res.statusCode === 206 || res.statusCode === 200,
                 status: res.statusCode, groesse });
      });
    req.on('error', e => fertig({ da:false, status:'Fehler', fehler:e.message }));
    req.setTimeout(zeitlimit, () => { req.destroy();
      fertig({ da:false, status:'wird gerechnet' }); });
  });
}

/** Eine Datei holen, fortsetzbar. */
function ladeDatei(url, ziel){
  return new Promise((fertig) => {
    const teil = ziel + '.teil';
    const schon = fs.existsSync(teil) ? fs.statSync(teil).size : 0;
    const kopf = schon ? { Range: `bytes=${schon}-` } : {};
    const strom = fs.createWriteStream(teil, { flags: schon ? 'a' : 'w' });

    const req = https.get(url, { headers: kopf }, res => {
      if (res.statusCode !== 200 && res.statusCode !== 206){
        res.destroy(); strom.close(); return fertig({ ok:false, status:res.statusCode });
      }
      res.pipe(strom);
      strom.on('finish', () => {
        strom.close(() => {
          fs.renameSync(teil, ziel);
          fertig({ ok:true, bytes: fs.statSync(ziel).size });
        });
      });
    });
    req.on('error', e => { strom.close(); fertig({ ok:false, status:e.message }); });
    req.setTimeout(300000, () => { req.destroy(); strom.close();
      fertig({ ok:false, status:'Zeitüberschreitung' }); });
  });
}

// --- Hauptlauf --------------------------------------------------

(async () => {
  const katalog = K.lesen();
  if (!katalog){ console.error('Kein Katalog.'); process.exit(1); }

  // Älteste zuerst - so wandert die Arbeit von hinten nach vorn
  // durch die Sammlung, und ein Abbruch trifft immer das Neueste.
  let liste = Object.values(katalog.songs)
    .filter(s => !s.fremd)
    .sort((a,b) => (a.erstellt||'').localeCompare(b.erstellt||''));
  if (TESTZAHL) liste = liste.slice(0, TESTZAHL);

  const stand = fs.existsSync(STAND)
    ? JSON.parse(fs.readFileSync(STAND, 'utf8')) : { geprueft:{}, geholt:{} };

  console.log(`${liste.length} Songs, älteste zuerst\n`);

  let da = 0, fehlt = 0, geholt = 0, bytes = 0, uebersprungen = 0;

  for (let i = 0; i < liste.length; i++){
    const s = liste[i];
    const ziel = path.join(SONGS, s.id, 'audio.wav');
    const nr = `[${String(i+1).padStart(String(liste.length).length)}/${liste.length}]`;

    if (fs.existsSync(ziel)){
      uebersprungen++;
      stand.geholt[s.id] = fs.statSync(ziel).size;
      continue;                                  // schon auf der Platte
    }

    const p = await wavDa(s.id);
    stand.geprueft[s.id] = p.status;

    if (!p.da){
      fehlt++;
      console.log(`${nr} –  ${s.erstellt.slice(0,10)}  ${s.titel.slice(0,42)}   (${p.status})`);
      continue;
    }

    da++;
    if (NUR_PRUEFEN){
      console.log(`${nr} ✓  ${s.erstellt.slice(0,10)}  ${s.titel.slice(0,42)}   ${p.groesse?mb(p.groesse):''}`);
      continue;
    }

    fs.mkdirSync(path.dirname(ziel), { recursive: true });
    const e = await ladeDatei(`https://cdn1.suno.ai/${s.id}.wav`, ziel);
    if (e.ok){
      geholt++; bytes += e.bytes;
      stand.geholt[s.id] = e.bytes;
      console.log(`${nr} ⤓  ${s.erstellt.slice(0,10)}  ${s.titel.slice(0,42)}   ${mb(e.bytes)}`);
    } else {
      console.log(`${nr} ✗  ${s.titel.slice(0,42)}   Fehler: ${e.status}`);
    }
    fs.writeFileSync(STAND, JSON.stringify(stand, null, 1));
    await schlaf(400);
  }

  fs.writeFileSync(STAND, JSON.stringify(stand, null, 1));

  console.log('\n--- Ergebnis ---');
  console.log(`schon auf der Platte: ${uebersprungen}`);
  console.log(`WAV vorhanden:        ${da}`);
  console.log(`noch nicht angestoßen:${fehlt}`);
  if (!NUR_PRUEFEN) console.log(`neu geholt:           ${geholt}  (${mb(bytes)})`);
  console.log(`\nStand notiert in library/wav-stand.json`);
})();
