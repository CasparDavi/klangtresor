#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Holt die KI-Modelle einmalig nach library/modelle/. Sie liegen NICHT
 * im Paket (library/ ist Archiv, nicht Programm), darum dieser Schritt.
 *
 *   node bin/modelle-holen.js        oder  npm run modelle
 *
 * WAS GEHOLT WIRD und unter welchen Bedingungen es steht - die volle
 * Auskunft samt Nennpflichten in web/fremd/LIZENZEN.md:
 *
 *   htdemucs_6s (246 MB)   Stemtrennung. MIT, Copyright (c) Meta
 *                          Platforms; der ONNX-Export MIT, StemSplit.
 *   SCRFD-500M (2,5 MB)    Gesichter in Titelbildern und Avataren
 *                          (bin/gesichter.js). Aus InsightFaces buffalo_sc
 *                          (15 MB Zip, ausgepackt wird nur der Erkenner);
 *                          nur nichtkommerziell.
 *   PP-OCRv3 (2,4 MB)      Schrift in den Titelbildern (bin/gesichter.js).
 *                          Apache 2.0, PaddleOCR / OpenCV-Modellzoo.
 *   Discogs-EffNet (18 MB) Merkmalsextraktor, und drei Koepfe fuer
 *   + drei Koepfe          Musikstil, Instrument und Stimmung. Alle vier
 *                          von der Music Technology Group der Universitat
 *                          Pompeu Fabra, CC BY-NC-ND 4.0 - Namensnennung,
 *                          nicht kommerziell, keine Weitergabe
 *                          veraenderter Fassungen.
 *
 * Zwei Dinge waren hier bis zum 24.08.2026 falsch. Erstens stand als
 * Lizenz "CC BY-NC-SA" - es ist ND: SA erlaubt Bearbeitungen unter
 * gleichen Bedingungen, ND verbietet ihre Weitergabe ganz. Zweitens kam
 * das EffNet von Caspar_Ds eigener GitHub-Seite statt von der UPF; jetzt
 * holt es jeder an der Quelle, und die Nennung geht mit.
 *
 * Vorhandene Dateien werden uebersprungen; eine kaputte (zu kleine) wird
 * neu geholt.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const melden = require('./melden.js');   /* Zahlen fuer die Einrichtungsseite */
const ZIEL = path.join(__dirname, '..', 'library', 'modelle');
/* Fuer den Balken der Einrichtungsseite: welche Datei gerade laeuft,
   wie viel vor ihr schon lag, und wie viel es zusammen wird. */
let NUMMER_JETZT = 0, GEHOLT_VORHER = 0, SOLL_GESAMT = 0;
const E = 'https://essentia.upf.edu/models';
const DATEIEN = [
  /* Die Stemtrennung. Mit Abstand die groesste Datei - wer nur den
     Klangraum will, kann sie sich sparen; bin/stems.js sagt dann, dass
     sie fehlt. */
  ['htdemucs_6s.onnx',                              'https://huggingface.co/StemSplitio/htdemucs-6s-onnx/resolve/main/htdemucs_6s.onnx', 258000000],
  ['discogs-effnet-bsdynamic-1.onnx',               `${E}/feature-extractors/discogs-effnet/discogs-effnet-bsdynamic-1.onnx`, 18000000],
  ['discogs-effnet-bs64-1.json',                    `${E}/feature-extractors/discogs-effnet/discogs-effnet-bs64-1.json`, 10000],
  ['mtg_jamendo_genre-discogs-effnet-1.onnx',       `${E}/classification-heads/mtg_jamendo_genre/mtg_jamendo_genre-discogs-effnet-1.onnx`, 2700000],
  ['mtg_jamendo_genre-discogs-effnet-1.json',       `${E}/classification-heads/mtg_jamendo_genre/mtg_jamendo_genre-discogs-effnet-1.json`, 3000],
  ['mtg_jamendo_moodtheme-discogs-effnet-1.onnx',   `${E}/classification-heads/mtg_jamendo_moodtheme/mtg_jamendo_moodtheme-discogs-effnet-1.onnx`, 2700000],
  ['mtg_jamendo_moodtheme-discogs-effnet-1.json',   `${E}/classification-heads/mtg_jamendo_moodtheme/mtg_jamendo_moodtheme-discogs-effnet-1.json`, 3000],
  ['mtg_jamendo_instrument-discogs-effnet-1.onnx',  `${E}/classification-heads/mtg_jamendo_instrument/mtg_jamendo_instrument-discogs-effnet-1.onnx`, 2700000],
  ['mtg_jamendo_instrument-discogs-effnet-1.json',  `${E}/classification-heads/mtg_jamendo_instrument/mtg_jamendo_instrument-discogs-effnet-1.json`, 3000],

  /* Der Geschichten-Raum (bin/geschichten.js): Liedtexte als Vektoren.
     Ein AEHNLICHKEITSmodell, kein Suchmodell - der Unterschied ist in
     bin/texte-einbetten.js begruendet und mit Zahlen belegt. */
  /* Die Tiefenkarte (bin/tiefenkarten.js): aus einem Standbild schaetzen,
     was vorn und was hinten liegt. Depth Anything V2, LARGE in fp16.

     WARUM DAS GROSSE und nicht das kleine (gemessen am 14.09.2026 an
     zwoelf Covern quer durch den Bestand):

       Small  94 MB   294 ms je Cover   Texturen werden ein weicher Brei
       Base  371 MB   880 ms            mehr Struktur
       Large 640 MB  2700 ms            einzelne Steine mit Relief,
                                        Figuren sauber vom Grund getrennt

     Der Gewinn liegt genau dort, wo Dunst und Partikel spaeter hinsehen.
     Caspar_D: "selbst wenn es eine Stunde auf allen dauert, wuerde ich
     das beste Modell nehmen."

     fp16 statt fp32: halber Download (640 MB statt 1,2 GB) bei
     praktisch gleichem Bild - mittlere Abweichung 0,08 von 255, groesste
     Einzelabweichung 3. Auf dieser Intel-CPU rechnet fp16 sogar
     langsamer, weil sie intern ohnehin auf fp32 geht; auf Apple Silicon
     ist es umgekehrt. Der Grund fuer fp16 ist allein die Dateigroesse.

     ZWEI DATEIEN, und die Namen sind nicht frei waehlbar: model_fp16.onnx
     traegt nur den Graphen und nennt die Gewichte darin beim Namen
     model_fp16.onnx_data. Wer eine davon umbenennt, bekommt beim Laden
     "filesystem error: No such file or directory" (14.09.2026 genau so
     passiert). */
  ['depth-anything-v2-large-fp16.onnx',
   'https://huggingface.co/onnx-community/depth-anything-v2-large-ONNX/resolve/main/onnx/model_fp16.onnx', 150000],
  ['model_fp16.onnx_data',
   'https://huggingface.co/onnx-community/depth-anything-v2-large-ONNX/resolve/main/onnx/model_fp16.onnx_data', 600000000],

  /* Gesichter (bin/gesichter.js): SCRFD-500M, gemessen am 07.10.2026 gegen YuNet und UltraFace an 40 Covern
     (Zahlen im Kopf von bin/gesichter.js). Zuerst lief YuNet (MIT); Caspar_D, 07.10.2026: „nimm ruhig SCRFD,
     KlangTresor soll nicht kommerziell bleiben". InsightFace gibt den Erkenner nur im Modellpaket buffalo_sc
     heraus - geholt wird das Zip, ausgepackt nur det_500m.onnx (der vierte Eintrag), das Zip wird nicht behalten. */
  ['scrfd_500m.onnx',
   'https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_sc.zip', 2000000, 'det_500m.onnx'],
  /* Schrift (bin/gesichter.js): damit die Cover so ruecken, dass ihr eigener Titel nicht in der Zelle steht */
  ['text_detection_en_ppocrv3_2023may.onnx',
   'https://github.com/opencv/opencv_zoo/raw/main/models/text_detection_ppocr/text_detection_en_ppocrv3_2023may.onnx', 2000000],
  ['paraphrase-multilingual-mpnet.onnx',
   'https://huggingface.co/Xenova/paraphrase-multilingual-mpnet-base-v2/resolve/main/onnx/model_quantized.onnx', 200000000],
  ['paraphrase-multilingual-mpnet-tokenizer.json',
   'https://huggingface.co/Xenova/paraphrase-multilingual-mpnet-base-v2/resolve/main/tokenizer.json', 10000000],
];

/* Holen mit Rueckfall (22.08.2026, Tarja unter Windows: "fetch failed"):
   1. Nodes fetch (drei Versuche, die Ursache wird genannt - DNS, TLS, Proxy),
   2. curl (liegt Windows 10/11, macOS und Linux bei; kennt Proxy und
      Systemzertifikate), 3. Anleitung zum Holen von Hand. */
const { spawnSync } = require('node:child_process');
const schlaf = (ms) => new Promise(r => setTimeout(r, ms));

/* Wie lange ohne ein einziges Byte gewartet wird, bevor abgebrochen und
   curl versucht wird.

   ANLASS (27.08.2026): Dr. Fruusch starrte vier Minuten auf die Zeile
   "hole discogs-effnet-bsdynamic-1.onnx …" und hielt das Programm fuer
   abgestuerzt. Es war keiner: fetch ohne signal wartet unbegrenzt,
   solange die Verbindung steht. Die drei Versuche unten liefen nie an,
   denn geworfen wurde nie etwas.

   Begrenzt wird der STILLSTAND, nicht die Gesamtdauer - 246 MB duerfen
   an einer langsamen Leitung ihre Zeit haben. Jedes ankommende Stueck
   setzt die Uhr zurueck. */
const STILLSTAND = 45000;

/* Merkt sich, was gerade laeuft: die Fortschrittszeile ueberschreibt
   sich selbst und muss den Namen jedesmal mitschreiben. */
let NAME_JETZT = '';

function mb(n) { return (n / 1048576).toFixed(1) + ' MB'; }

/* EINE DATEI AUS EINEM ZIP - ohne unzip (fehlt unter Windows), mit Nodes zlib: das Verzeichnis am Ende des
   Zips nennt jeden Eintrag mit Art (0 = gespeichert, 8 = deflate), Groesse und Lage seines Kopfes. */
function ausZip(zip, name) {
  let e = zip.length - 22;
  while (e >= 0 && zip.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < 0) throw new Error('kein Zip');
  let p = zip.readUInt32LE(e + 16);
  for (let i = 0, n = zip.readUInt16LE(e + 10); i < n; i++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) break;
    const art = zip.readUInt16LE(p + 10), groesse = zip.readUInt32LE(p + 20), nl = zip.readUInt16LE(p + 28);
    const el = zip.readUInt16LE(p + 30), kl = zip.readUInt16LE(p + 32), kopf = zip.readUInt32LE(p + 42);
    const eintrag = zip.toString('utf8', p + 46, p + 46 + nl);
    if (eintrag === name || eintrag.endsWith('/' + name)) {
      const ab = kopf + 30 + zip.readUInt16LE(kopf + 26) + zip.readUInt16LE(kopf + 28), roh = zip.subarray(ab, ab + groesse);
      if (art === 0) return Buffer.from(roh);
      if (art === 8) return require('node:zlib').inflateRawSync(roh);
      throw new Error('Zip-Art ' + art);
    }
    p += 46 + nl + el + kl;
  }
  throw new Error(name + ' fehlt im Zip');
}

async function perFetch(url, mindestens) {
  let letzter = null;
  for (let versuch = 1; versuch <= 3; versuch++) {
    const steuer = new AbortController();
    let stand = Date.now(), still = false;
    const wacht = setInterval(() => {
      if (Date.now() - stand > STILLSTAND) { still = true; steuer.abort(); }
    }, 1000);
    try {
      const r = await fetch(url, { redirect: 'follow', signal: steuer.signal });
      if (!r.ok) { letzter = `HTTP ${r.status}`; break; }

      /* Stueckweise statt arrayBuffer(): nur so laesst sich beim Warten
         zusehen, und nur so weiss die Wache oben, dass etwas ankommt. */
      const ganz = Number(r.headers.get('content-length')) || 0;
      const teile = []; let n = 0, letzteMeldung = 0;
      for await (const stueck of r.body) {
        teile.push(stueck); n += stueck.length; stand = Date.now();
        if (Date.now() - letzteMeldung > 250) {
          letzteMeldung = Date.now();
          /* Nur im Terminal fortschreiben - in eine Datei umgeleitet
             wuerde jedes \r zu einer weiteren Zeile Muell. */
          if (process.stdout.isTTY) {
            const wieweit = ganz ? ` von ${mb(ganz)} (${Math.round(n / ganz * 100)} %)` : '';
            process.stdout.write(`\r  hole       ${NAME_JETZT} … ${mb(n)}${wieweit}   `);
          }
          /* Die Seite bekommt die Zahlen immer: diese Datei und die
             Summe ueber alle. GEHOLT_VORHER ist, was vor dieser Datei
             schon lag - sonst spraenge der Gesamtbalken zurueck. */
          melden.lauf({ was: NAME_JETZT + ' wird geladen', n: NUMMER_JETZT, von: DATEIEN.length,
            nEinheit: 'Datei', quelle: 'von huggingface.co',
            bytes: GEHOLT_VORHER + n, gesamt: SOLL_GESAMT, jetzt: mb(n) + (ganz ? ' von ' + mb(ganz) : '') });
        }
      }
      const buf = Buffer.concat(teile);
      if (buf.length < mindestens) { letzter = `zu klein (${buf.length} Bytes)`; break; }
      return { buf };
    } catch (e) {
      const c = e.cause || {};
      letzter = still
        ? `${STILLSTAND / 1000} s lang kein Byte angekommen`
        : [e.message, c.code, c.message].filter(Boolean).join(' / ');
      if (still) break;   /* Hier hilft kein Wiederholen, nur ein anderer Weg. */
      await schlaf(800 * versuch);
    } finally {
      clearInterval(wacht);
    }
  }
  return { fehler: letzter };
}

function perCurl(url, f, mindestens) {
  /* Dieselbe Frist fuer curl: bricht ab, wenn STILLSTAND lang weniger
     als 1 kB/s ankommt. Ohne das haengt auch der Notweg unbegrenzt. */
  const r = spawnSync('curl', ['-L', '--fail', '--silent', '--show-error',
    '--speed-time', String(STILLSTAND / 1000), '--speed-limit', '1024',
    '--connect-timeout', '20', '-o', f, url], { encoding: 'utf8' });
  /* Bruchstueck wegraeumen, ehe irgendetwas zurueckgegeben wird: curl
     schreibt mit -o auch dann in die Datei, wenn es hinterher aufgibt.
     Die Groessenpruefung weiter unten kam dafuer zu spaet - sie steht
     hinter dem Statusabbruch und lief bei einem Fehler nie an. Gefunden
     am 27.08.2026 an einem stumm gestellten Testserver: zurueck blieben
     1024 Bytes, die aussahen wie ein Modell. */
  const weg = () => { try { if (fs.existsSync(f)) fs.rmSync(f); } catch (e) {} };
  if (r.error) { weg(); return { fehler: 'kein curl' }; }
  if (r.status !== 0) { weg(); return { fehler: (r.stderr || '').trim() || `curl ${r.status}` }; }
  const n = fs.existsSync(f) ? fs.statSync(f).size : 0;
  if (n < mindestens) { weg(); return { fehler: `zu klein (${n} Bytes)` }; }
  return { n };
}

(async () => {
  fs.mkdirSync(ZIEL, { recursive: true });
  let geholt = 0; const offen = [];
  SOLL_GESAMT = DATEIEN.reduce((s, [, , m]) => s + m, 0);
  for (const [name, url, mindestens, zipEintrag] of DATEIEN) {
    NUMMER_JETZT++;
    const f = path.join(ZIEL, name);
    if (fs.existsSync(f) && fs.statSync(f).size >= mindestens) { console.log(`  vorhanden  ${name}`); GEHOLT_VORHER += fs.statSync(f).size; continue; }
    melden.lauf({ was: name + ' wird geladen', n: NUMMER_JETZT, von: DATEIEN.length,
      nEinheit: 'Datei', quelle: 'von huggingface.co', bytes: GEHOLT_VORHER, gesamt: SOLL_GESAMT });
    NAME_JETZT = name;
    process.stdout.write(`  hole       ${name} … `);
    const a = await perFetch(url, mindestens);
    /* Die Fortschrittszeile hat sich selbst ueberschrieben; erst
       loeschen, sonst klebt das Ergebnis hinter halben Prozentzahlen. */
    if (process.stdout.isTTY) process.stdout.write(`\r${' '.repeat(78)}\r  hole       ${name} … `);
    /* Aus einem Zip: das Paket landet erst neben dem Ziel, dann wird der eine Eintrag ausgepackt */
    const auspacken = (zip) => { try { const d = ausZip(zip, zipEintrag); if (d.length < mindestens) return 'zu klein ausgepackt';
      fs.writeFileSync(f + '.teil', d); fs.renameSync(f + '.teil', f); return null; } catch (e) { return e.message; } };
    if (a.buf) {
      const schief = zipEintrag ? auspacken(a.buf) : (fs.writeFileSync(f, a.buf), null);
      if (!schief) { geholt++; GEHOLT_VORHER += a.buf.length; console.log(mb(a.buf.length)); continue; }
      a.fehler = schief;
    }
    process.stdout.write(`fetch: ${a.fehler} → curl … `);
    const zf = zipEintrag ? f + '.zip' : f;
    const b = perCurl(url, zf, mindestens);
    if (b.n && zipEintrag) { b.fehler = auspacken(fs.readFileSync(zf)); try { fs.rmSync(zf); } catch (e) {} if (b.fehler) b.n = 0; }
    if (b.n) { geholt++; GEHOLT_VORHER += b.n; console.log(mb(b.n)); continue; }
    console.log(`FEHLER (${b.fehler})`); offen.push([name, url]); process.exitCode = 1;
  }
  const da = DATEIEN.filter(([n, , m]) => fs.existsSync(path.join(ZIEL, n)) && fs.statSync(path.join(ZIEL, n)).size >= m).length;
  melden.ausLauf();
  melden.zeile('modelle', 'KI-Modelle', `${da} von ${DATEIEN.length} sind da`, da === DATEIEN.length ? 'fertig' : 'wink');
  console.log(`  Modelle: ${geholt} geholt, ${da} von ${DATEIEN.length} vorhanden → library/modelle/`);
  if (offen.length) {
    console.log(`\n  ${offen.length} Datei(en) kamen nicht an. Von Hand: im Browser öffnen, "Speichern unter" nach\n    ${ZIEL}\n  mit genau diesem Dateinamen:`);
    for (const [n, u] of offen) { const z = (DATEIEN.find(d => d[0] === n) || [])[3];
      console.log(`    ${n}\n      ${u}` + (z ? `\n      (ein Zip: daraus ${z} auspacken und als ${n} ablegen)` : '')); }
    console.log('  Danach node bin/modelle-holen.js noch einmal - Vorhandenes wird übersprungen.\n  Hinter einem Proxy: HTTPS_PROXY=http://proxy:port setzen (curl liest das), oder die Dateien von Hand holen.');
  }
})().catch(e => { console.error('  Modelle holen brach ab:', e.message, e.cause ? '/ ' + (e.cause.code || e.cause.message) : ''); process.exit(1); });
