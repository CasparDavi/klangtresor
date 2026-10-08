#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   FEDERZEICHNUNGEN DER TITELBILDER
   bin/feder.js

     node bin/feder.js                      was fehlt, wird gezeichnet
     node bin/feder.js --neu                alles noch einmal
     node bin/feder.js --nur 0ac2e049,baff0ad0   nur diese Titel (Anfang der Kennung genuegt, Komma trennt)
     node bin/feder.js --nur-modell         nur das Modell bereithalten (Morgenlauf), nichts zeichnen

   WOFUER. Die Plakatvorlage „Skizzenbuch" (web/klangschaum/plakat.js) legt den Schaum als Studie auf eine
   Skizzenbuchseite; jede Zelle zeigt ihr Cover nicht als Foto, sondern als Federzeichnung in der Tinte ihres
   Areals. Entworfen am 07.10.2026 in der Werkstatt (_werkstatt_bilder/feder/, nicht im Paket), dort neben
   klassischen Kantenfiltern (xdog.mjs, linien.mjs) erprobt; genommen wurde das Modell unten.

   WELCHES MODELL. „Informative Drawings" (Caroline Chan, Fredo Durand, Phillip Isola: Learning to generate
   line drawings that convey geometry and semantics, CVPR 2022), ONNX-Export von Joseph Rocca
   (huggingface.co/rocca/informative-drawings-line-art-onnx), 17 MB. Der Code steht unter MIT
   (github.com/carolineec/informative-drawings); fuer die Gewichte ist keine Lizenz ausdruecklich genannt,
   die Trainingsdaten sind teils nicht kommerziell. Darum liegt es nicht im Paket, sondern wird geholt wie die
   uebrigen Modelle - KlangTresor bleibt nicht kommerziell (Caspar_D, 07.10.2026: „KlangTresor soll nicht
   kommerziell bleiben"). Auskunft: web/fremd/LIZENZEN.md.
   Eingabe input float32 [1,3,H,W], RGB 0..1, Kanal zuerst; Ausgabe output [1,1,H,W], 0..1, 1 = Papier.
   Gerechnet wird bei 768 px Breite - der Breite, an der die Nachbearbeitung unten abgenommen wurde (Strichstaerke
   und Unschaerfemaske haengen an ihr). Das Netz allein braucht fuer 768×768 rund 1,5 s auf dem Intel-iMac mit
   acht Faeden (08.10.2026).

   DAS NETZ WILL HOEHEN IN VIERERSCHRITTEN. Gemessen am 08.10.2026: 768×770 kommt als 768×772 zurueck,
   768×1366 als 768×1368, 768×1022 als 768×1024 (die Breite 768 ist schon ein Vielfaches von 4). Damit
   Bildpunkt auf Bildpunkt passt, wird unten mit der letzten Zeile auf ein Vielfaches von 4 aufgefuellt und
   das Ergebnis wieder auf die eigene Hoehe beschnitten. Die Hoehe selbst ist gerade (Seitenverhaeltnis gehalten).

   NACHBEARBEITUNG - vom Bauherrn abgenommen (07.10.2026, Werkstatt ki-alle.mjs), hier Zeile fuer Zeile
   dieselbe Rechnung. Das Netz zieht zarte graue Linien; die Werkstatt hat sie „knackiger" gemacht:
     1. Unschaerfemaske   v' = clamp(v + 1,2 · (v − Mittel3×3(v)))   (am Rand nur die vorhandenen Nachbarn)
     2. harte Tonkurve    smoothstep(0,62 … 0,95): unter 0,62 volle Tinte, ueber 0,95 Papier
     3. 8 Bit Graustufe   0 = Tinte, 255 = Papier
   Wer daran dreht, erhoeht FASSUNG unten - dann wird alles neu gezeichnet.

   SCHRIFT AUSSPAREN. Der Titel steht im Plakat schon in Schreibschrift unter der Zeichnung; der Covertitel
   als Federstrich daneben waere doppelt (dieselbe Ueberlegung wie bei der Schriftsuche in bin/gesichter.js).
   bin/gesichter.js hat die Schrift im selben Bild gesucht (gesichter.json, bilder[schluessel].t: Kaesten
   [x0,y0,x1,y1] in Bildanteilen). Dort wird Papier
   gesetzt: der Kasten um 1,2 % der Breite erweitert voll weiss, dann ueber weitere 1,2 % linear auslaufend
   - wie in der Werkstatt (maske.mjs / ki-alle.mjs). Nur, wenn das Gesichterbuch DIESES Bild in DIESER
   Fassung gemessen hat (art und Dateistempel gleich); sonst ohne Maske. Welche Messung benutzt wurde, steht
   als maske im Eintrag: rechnet gesichter.js neu (neues Bild, neuer Erkenner), wird auch hier neu gezeichnet -
   sonst bliebe eine Zeichnung, die vor dem Texterkenner entstand, fuer immer mit Schrift stehen.

   WELCHES BILD - das, was die Seite zeigt (artworkBild in web/index.html): ein selbst abgelegtes eigen.jpg
   zuerst, dann titelbild.jpg (das Cover ohne Rand), wenn bin/kacheln.js es in library/kachel-stand.json
   fuehrt (die Liste reist im Katalogkopf zur Seite; fehlt die Datei kachel-stand.json, entscheidet wie in
   bin/gesichter.js allein, ob titelbild.jpg da ist), sonst cover.jpg. Gezeichnet wird je eigenem Titel
   des Katalogs (nicht fremd), der ein Bild hat.

   MODELL HOLEN - drei Wege, und keinen muss der Nutzer kennen (Caspar_D, 07.10.2026: „auch das Modelle
   holen muß der Nutzer nicht wissen"; 08.10.2026: „über die morgenroutine werden nicht vorhandene modelle
   geholt oder wenn sie gebraucht werden", „und wenn klangtresor das erste mal geladen wird, wird jedes
   Modell mitinstalliert"):
     Ersteinrichtung  bin/einrichten.js ruft bin/modelle-holen.js ohne --nur - der Eintrag dort reicht.
     Morgenlauf       bin/wiederherstellen.js ruft  feder.js --nur-modell  (holt nur, wenn es fehlt;
                      gezeichnet wird im Morgenlauf nichts - das kostet Minuten und braucht nur, wer ein
                      Skizzenbuch oeffnet).
     Bei Bedarf       das Skizzenbuch fragt /api/feder; fehlt etwas, startet server.js bilderVorbereiten('feder'):
                      erst gesichter.js (die Schriftkaesten), dann dieses Skript, das das Modell selbst nachholt.
   Scheitert das Holen (kein Netz), wird NICHTS gezeichnet, stand().modell bleibt false, und die Seite sagt es,
   statt mindere Qualitaet zu zeigen (Caspar_D, 07.10.2026: „es wird gar nichts gerechnet, wenn die Modelle
   fehlen, sonst würden wir mindere Qualität liefern").

   DAS BUCH. library/feder.json traegt den AUSWEIS (Modell mit Pruefsumme, Breite, Nachbearbeitung, Fassung) und
   je Titel die Quelle (titelbild | cover | eigen), ihren Zeitstempel (quellStand = mtimeMs), Breite, Hoehe, den
   Tintenanteil (Anteil der Bildpunkte unter 128 - das Werkstattplakat leonardo.mjs fuellte Zellen unter 1,2 %
   mit Schraffur statt mit einer fast leeren Zeichnung) und
   wann gerechnet wurde. Die Zeichnung selbst liegt als library/songs/<id>/feder.png (PNG, 8 Bit Grau).
   Idempotent: uebersprungen wird, was mit gleichem Ausweis, gleicher Quelle, gleichem quellStand und gleicher
   Maske schon da ist. Zwischenstand alle 20 Bilder, damit ein Abbruch das Fertige behaelt.
   ============================================================= */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const melden = require('./melden.js');

const WURZEL = path.join(__dirname, '..');
const LIB = path.join(WURZEL, 'library');
const SONGS = path.join(LIB, 'songs');
const MODELLNAME = 'informative-drawings.onnx';
const MODELL = path.join(LIB, 'modelle', MODELLNAME);
const BUCH = path.join(LIB, 'feder.json');
const GESICHTER = path.join(LIB, 'gesichter.json');
const KACHELSTAND = path.join(LIB, 'kachel-stand.json');
const KATALOG = path.join(LIB, 'katalog.json.gz');
const ZEICHNUNG = 'feder.png';
const BREITE = 768;                  /* Rechenbreite, siehe Kopf */
const SCHAERFE = 1.2;                /* Unschaerfemaske: v + 1,2 · (v − Mittel3×3) */
const TINTE_BIS = 0.62, PAPIER_AB = 0.95;   /* Tonkurve smoothstep(0,62 … 0,95) */
const RAND = 0.012;                  /* weicher Rand der Schriftaussparung, Anteil der Breite */
const FASSUNG = 1;                   /* erhoehen, wenn sich an der Rechnung etwas aendert */
const NACHBEARBEITUNG = 'unscharf1.2+smoothstep(0.62,0.95)';
/* Faeden: hoechstens acht und hoechstens die halbe Maschine - wer wartet, sieht „Bilder werden vorbereitet",
   aber nebenher soll der Rechner frei bleiben. */
const FAEDEN = Math.max(1, Math.min(8, Math.floor((os.cpus().length || 2) / 2)));
/* Ab welcher Groesse die Datei als vollstaendig gilt - dieselbe Zahl, nach der bin/modelle-holen.js entscheidet,
   ob es neu holen muss (ein abgerissener Download ist zu klein). */
const MINDESTENS = (() => { try { const e = require('./modelle-holen.js').DATEIEN.find(d => d[0] === MODELLNAME); return e ? e[2] : 1; } catch (e) { return 1; } })();

const NEU = process.argv.includes('--neu');
const NUR_MODELL = process.argv.includes('--nur-modell');
const NUR = (() => { const i = process.argv.indexOf('--nur'); return i >= 0 ? String(process.argv[i + 1] || '').split(',').map(s => s.trim()).filter(Boolean) : []; })();

/* Das Modell gilt nur mit der bekannten Prüfsumme: ein im letzten Prozent abgerissener curl-Download ist groß genug, aber
   unbrauchbar - dann brach jeder Lauf beim Laden ab, ohne Hinweis und ohne neues Holen (Fallensuche 1.0.61). Eine falsche Datei
   wird beiseitegelegt (.kaputt), der nächste Versuch holt neu. */
const MODELL_SHA = '1fef40b8f7126d827e30fbebccf95ae9b0b391795df926bf9366a821bad4f498';
/* beiseite nur im Lauf selbst (unter der Sperre, nach dem Holen): der Server fragt stand() alle zwei Sekunden, während curl das Modell
   vielleicht noch schreibt - eine halbe Datei darf er nicht wegbenennen (zweite Fallensuche 1.0.61) */
const modellDa = (beiseite = false) => { try { if (fs.statSync(MODELL).size < MINDESTENS) return false; } catch (e) { return false; }
  if (modellSha() === MODELL_SHA) return true;
  if (beiseite) try { fs.renameSync(MODELL, MODELL + '.kaputt'); } catch (e) {} return false; };
/* Die Pruefsumme gehoert in den Ausweis: ein anderes Modell unter demselben Namen zeichnet anders. 17 MB lesen
   kostet rund 50 ms - gemerkt je Dateistempel, damit /api/feder nicht bei jeder Frage neu rechnet. */
let shaMerk = null;
function modellSha() {
  let st; try { st = fs.statSync(MODELL); } catch (e) { return null; }
  const s = st.size + ':' + st.mtimeMs;
  if (!shaMerk || shaMerk.stempel !== s) shaMerk = { stempel: s, sha: crypto.createHash('sha256').update(fs.readFileSync(MODELL)).digest('hex') };
  return shaMerk.sha;
}
function ausweis() {
  const sha = modellSha();
  return sha ? { modell: 'informative-drawings', sha256: sha, breite: BREITE, nachbearbeitung: NACHBEARBEITUNG, fassung: FASSUNG } : null;
}
const AUSWEISIDENT = (a) => JSON.stringify([a && a.modell, a && a.sha256, a && a.breite, a && a.nachbearbeitung, a && a.fassung]);
/* Derselbe Stempel wie in bin/gesichter.js (Groesse:mtime) - daran erkennt die Maske, ob das Gesichterbuch
   dieses Bild in dieser Fassung gemessen hat. */
const stempel = (p) => { try { const s = fs.statSync(p); return s.size + ':' + Math.round(s.mtimeMs); } catch (e) { return null; } };

/* DIE EIGENEN TITEL AUS DEM KATALOG. Der Katalog ist 50 MB gepackt, das Auspacken kostet eine Sekunde - darum
   gemerkt je Dateistempel; der Server reicht seinen ohnehin geladenen Katalog herein (stand(katalog)). Ohne
   Katalog: die Ordner unter library/songs, wie bin/gesichter.js. */
let katalogMerk = null;
function eigeneTitel(katalog) {
  if (katalog && katalog.songs) return Object.values(katalog.songs).filter(s => s && s.id && !s.fremd).map(s => s.id);
  let m = 0; try { m = fs.statSync(KATALOG).mtimeMs; } catch (e) {}
  if (m && (!katalogMerk || katalogMerk.m !== m)) {
    try { const k = require('./katalog.js').lesen(); katalogMerk = { m, ids: Object.values((k && k.songs) || {}).filter(s => s && s.id && !s.fremd).map(s => s.id) }; }
    catch (e) { katalogMerk = null; }
  }
  if (m && katalogMerk) return katalogMerk.ids;
  try { return fs.readdirSync(SONGS).filter(d => !d.startsWith('.')); } catch (e) { return []; }
}
function titelbildListe() {
  try { const ks = JSON.parse(fs.readFileSync(KACHELSTAND, 'utf8')); return ks && ks.titelbild && typeof ks.titelbild === 'object' ? ks.titelbild : null; }
  catch (e) { return null; }
}
/* Welches Bild das Plakat zeigt - siehe Kopf. gesichterSchluessel: unter welchem Schluessel bin/gesichter.js
   dasselbe Bild durchsucht hat (eigene Standbilder als <id>/eigen.jpg). */
function bildVon(id, liste) {
  const ordner = path.join(SONGS, id), groesse = (f) => { try { return fs.statSync(f).size; } catch (e) { return 0; } };
  const e = path.join(ordner, 'eigen.jpg'), t = path.join(ordner, 'titelbild.jpg'), c = path.join(ordner, 'cover.jpg');
  let b = null;
  if (groesse(e) > 0) b = { quelle: 'eigen', datei: e, gesichterSchluessel: id + '/eigen.jpg' };
  else if ((liste ? liste[id] : true) && groesse(t) > 0) b = { quelle: 'titelbild', datei: t, gesichterSchluessel: id };
  else if (groesse(c) > 0) b = { quelle: 'cover', datei: c, gesichterSchluessel: id };
  if (!b) return null;
  try { b.quellStand = fs.statSync(b.datei).mtimeMs; } catch (e) { return null; }
  b.id = id; b.ziel = path.join(ordner, ZEICHNUNG);
  return b;
}
function alleBilder(katalog) {
  const liste = titelbildListe();
  return eigeneTitel(katalog).map(id => bildVon(id, liste)).filter(Boolean);
}

function gesichterLesen() { try { const b = JSON.parse(fs.readFileSync(GESICHTER, 'utf8')); return (b && b.bilder) || {}; } catch (e) { return {}; } }
/* Die Schriftkaesten fuer dieses Bild - nur, wenn das Gesichterbuch genau dieses Bild gemessen hat. maske ist
   die Kennung dieser Messung (ihr Zeitpunkt), null ohne Messung. */
function schriftVon(b, gesichter) {
  const e = gesichter[b.gesichterSchluessel];
  if (!e || e.art !== b.quelle || e.quelle !== stempel(b.datei) || !Array.isArray(e.t)) return { t: [], maske: null, format: 0 };
  return { t: e.t, maske: e.gerechnet || 'ohne Zeit', format: e.w > 0 && e.h > 0 ? e.h / e.w : 0 };
}

function buchLesen() {
  try { const b = JSON.parse(fs.readFileSync(BUCH, 'utf8')); if (b && b.bilder) return b; } catch (e) {}
  return { ausweis: null, bilder: {} };
}
/* Ein Eintrag gilt, wenn Quelle, ihr Stempel und die Maske stimmen und die Zeichnung daliegt. Unlesbares
   gilt auch (ohne Zeichnung) - sonst bliebe der Titel fuer immer offen und das Skizzenbuch wartete ewig; wird
   die Datei ersetzt, aendert sich der Stempel, und es wird neu versucht. */
function gueltig(e, b, maske) {
  if (!e || e.quelle !== b.quelle || e.quellStand !== b.quellStand) return false;
  if (e.unlesbar) return true;
  return (e.maske || null) === maske && fs.existsSync(b.ziel);
}

/* WAS NOCH FEHLT - fuer den Server (/api/feder), nach denselben Regeln wie der Lauf. Ohne Modell zaehlt alles
   als offen: dann ist nichts gueltig gezeichnet, und die Seite zeigt den Hinweis statt halber Bilder. */
function stand(katalog) {
  const bilder = alleBilder(katalog), modell = modellDa();
  if (!modell) return { modell: false, offen: bilder.length, gesamt: bilder.length };
  const buch = buchLesen(), gleich = AUSWEISIDENT(buch.ausweis) === AUSWEISIDENT(ausweis()), gesichter = gesichterLesen();
  const offen = gleich ? bilder.filter(b => !gueltig(buch.bilder[b.id], b, schriftVon(b, gesichter).maske)).length : bilder.length;
  return { modell: true, offen, gesamt: bilder.length };
}

/* EIN LAUF ZUR ZEIT: „Bilder vorbereiten" (server.js) und ein Lauf von Hand duerfen nicht gleichzeitig ins
   selbe Buch schreiben. Die Sperre traegt die PID; lebt der Prozess nicht mehr, gilt sie nicht. */
const SPERRE = path.join(LIB, 'feder.lauf');
/* Eine Sperre, die 15 Minuten nicht aufgefrischt wurde, ist verwaist - auch wenn ihre PID inzwischen einem anderen Prozess gehört
   (nach hartem Abbruch, Stromausfall); dieselbe Grenze wie in server.js sperreLebt. Aufgefrischt wird je Bild und um das Holen. */
const SPERRE_ALTER = 15 * 60000;
const auffrischen = () => { try { fs.utimesSync(SPERRE, new Date(), new Date()); } catch (e) {} };
function sperren() {
  try { const pid = Number(fs.readFileSync(SPERRE, 'utf8')), alt = Date.now() - fs.statSync(SPERRE).mtimeMs > SPERRE_ALTER;
    if (pid && pid !== process.pid && !alt) { try { process.kill(pid, 0); return false; } catch (e) {} } } catch (e) {}
  try { fs.writeFileSync(SPERRE, String(process.pid)); } catch (e) {}
  return true;
}
function entsperren() { try { if (Number(fs.readFileSync(SPERRE, 'utf8')) === process.pid) fs.unlinkSync(SPERRE); } catch (e) {} }
module.exports = { stand, SPERRE, MODELLNAME };

/* Umbenennen mit Wiederholung: unter Windows scheitert es mit EPERM/EACCES/EBUSY, solange das Ziel offen ist (der Server liefert
   feder.png aus, liest feder.json) oder ein Virenscanner die neue Datei hält - wie in server.js zehnmal je 200 ms */
function umbenennen(von, nach) {
  for (let i = 0; ; i++) {
    try { fs.renameSync(von, nach); return true; }
    catch (e) { if (process.platform !== 'win32' || !/EPERM|EACCES|EBUSY/.test(e.code || '') || i >= 9) { try { fs.unlinkSync(von); } catch (x) {} throw e; }
      const t = Date.now() + 200; while (Date.now() < t) {} }
  }
}
function buchSchreiben(buch) {
  const neben = `${BUCH}.${process.pid}.teil`;
  fs.writeFileSync(neben, JSON.stringify(buch));
  umbenennen(neben, BUCH);
}

/* Fehlt das Modell, still nachholen - genau diesen einen Eintrag, nie die 1,2 GB der uebrigen. Die Ausgabe von
   modelle-holen.js geht durch (die @@KT-Zeilen tragen nEinheit 'Datei' und bleiben im Fortschritt der Seite
   unsichtbar, server.js bilderVorbereiten). Ein Fehlschlag haelt nichts auf: der Rueckgabewert bleibt 0, damit
   der Morgenlauf (bin/wiederherstellen.js bricht bei jedem anderen ab) weitergeht. */
function modellHolen() {
  if (modellDa(true)) return true;
  console.log(`Feder — hole das fehlende Modell: ${MODELLNAME}`);
  auffrischen();
  spawnSync(process.execPath, [path.join(__dirname, 'modelle-holen.js'), '--nur', MODELLNAME], { stdio: 'inherit' });
  auffrischen();
  return modellDa(true);
}

/* Bild holen und Zeichnung schreiben - beides ueber ffmpeg, das ohnehin im Haus ist, wie bin/tiefenkarten.js.
   Kein zweites Bildpaket. */
/* WERKZEUGFEHLER sind keine Bildfehler: fehlt ffmpeg (ENOENT), stirbt das Kind an einem Signal (Strg+C trifft die ganze
   Prozessgruppe) oder ist die Platte voll, wird der Titel NICHT als unlesbar gemerkt - sonst bliebe er für immer schraffiert
   (Fallensuche 1.0.61). Dann bricht der Lauf ab; der nächste versucht es wieder. */
class Werkzeugfehler extends Error {}
const UNTERBROCHEN = new Set(['SIGINT', 'SIGTERM', 'SIGKILL', 'SIGHUP']), WIN_ABBRUCH = 3221225786;   /* 0xC000013A: Strg+C unter Windows */
const werkzeug = (e, was) => { if (e.error || UNTERBROCHEN.has(e.signal) || e.status === WIN_ABBRUCH)
  throw new Werkzeugfehler(`${was}: ${e.error ? e.error.code || e.error.message : e.signal ? 'Signal ' + e.signal : 'abgebrochen'}`); };
/* Gelesen wird mit scale=768:-2: ffmpeg dreht Bilder beim Dekodieren nach ihrer EXIF-Ausrichtung, die rohen Maße von ffprobe
   tun das nicht - ein hochkant fotografiertes eigenes Bild kam verzerrt heraus. Die Höhe ergibt sich aus dem Ergebnis. */
function bildRoh(datei, w) {
  const e = spawnSync('ffmpeg', ['-v', 'error', '-i', datei,
    '-vf', `scale=${w}:-2:flags=bicubic`, '-frames:v', '1', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'],
    { maxBuffer: 1 << 28 });
  werkzeug(e, 'ffmpeg');
  const n = e.stdout ? e.stdout.length : 0, h = n / (w * 3);
  return n && Number.isInteger(h) && h >= 2 ? { rgb: e.stdout, h } : null;
}
function grauSchreiben(grau, w, h, ziel) {
  /* erst neben das Ziel, dann umbenennen: ein Abbruch hinterlaesst nie eine halbe feder.png */
  const neben = `${ziel}.${process.pid}.teil`;   /* auf .teil: der Export (bin/export.js) übergeht halbe Dateien */
  const e = spawnSync('ffmpeg', ['-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', `${w}x${h}`, '-i', '-',
    '-frames:v', '1', '-pix_fmt', 'gray', '-f', 'image2', '-c:v', 'png', '-y', neben], { input: grau });
  if (e.error || e.signal || e.status !== 0) { try { fs.unlinkSync(neben); } catch (x) {} throw new Werkzeugfehler('ffmpeg (Schreiben): ' + (e.error ? e.error.code : e.signal || String(e.stderr || '').trim().slice(0, 120))); }
  umbenennen(neben, ziel);
  return true;
}

/* EINE ZEICHNUNG. Rueckgabe { grau, w, h, tinte } oder null (Bild unlesbar). */
async function zeichnen(ort, sitzung, datei, kaesten, schriftFormat = 0) {
  /* ein zweiter Versuch, bevor ein Bild als unlesbar gilt: ffmpeg fängt Strg+C selbst ab und endet dann manchmal ohne Signal und
     ohne Ausgabe - ein einzelner Fehlschlag sagt nichts über das Bild */
  const w = BREITE, r = bildRoh(datei, w) || bildRoh(datei, w); if (!r) return null;
  const { rgb, h } = r;
  /* die Schriftkästen stammen aus gesichter.json, gemessen am Seitenverhältnis dort; weicht das gedrehte Bild ab (EXIF-Ausrichtung,
     die gesichter.js noch nicht kennt), passt keine Maske - dann lieber ohne als an falscher Stelle */
  if (schriftFormat && Math.abs(Math.log((h / w) / schriftFormat)) > 0.03) kaesten = [];
  /* Auf ein Vielfaches von 4 auffuellen (siehe Kopf), mit der letzten Bildzeile */
  const hn = Math.ceil(h / 4) * 4, n = w * h, nn = w * hn, x = new Float32Array(3 * nn);
  for (let p = 0; p < nn; p++) { const q = p < n ? p : (h - 1) * w + (p % w); for (let c = 0; c < 3; c++) x[c * nn + p] = rgb[q * 3 + c] / 255; }
  const aus = (await sitzung.run({ input: new ort.Tensor('float32', x, [1, 3, hn, w]) })).output;
  if (aus.dims[3] !== w || aus.dims[2] < h) throw new Error(`Netz gab ${aus.dims.join('×')} statt 1×1×${hn}×${w}`);
  const y = aus.data;                /* die ersten h Zeilen sind das Bild, der Rest ist Auffuellung */
  /* 1. Unschaerfemaske gegen das 3×3-Mittel (am Rand nur die vorhandenen Nachbarn) */
  const mittel = new Float32Array(n);
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    let a = 0, c = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const X = xx + dx, Y = yy + dy; if (X >= 0 && Y >= 0 && X < w && Y < h) { a += y[Y * w + X]; c++; }
    }
    mittel[yy * w + xx] = a / c;
  }
  /* 2. harte Tonkurve, 3. 8 Bit (0 = Tinte, 255 = Papier) */
  const glatt = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const grau = Buffer.alloc(n);
  for (let p = 0; p < n; p++) { const v = Math.max(0, Math.min(1, y[p] + SCHAERFE * (y[p] - mittel[p]))); grau[p] = Math.round(255 * glatt(TINTE_BIS, PAPIER_AB, v)); }
  /* Schrift aussparen: der Kasten um rr erweitert voll Papier, dann ueber rr linear zurueck zur Zeichnung */
  const rr = Math.max(2, Math.round(RAND * w));
  for (const [a, b, c, d] of kaesten) {
    const x0 = Math.floor(a * w) - rr, x1 = Math.ceil(c * w) + rr, y0 = Math.floor(b * h) - rr, y1 = Math.ceil(d * h) + rr;
    for (let yy = Math.max(0, y0 - rr); yy < Math.min(h, y1 + rr); yy++) for (let xx = Math.max(0, x0 - rr); xx < Math.min(w, x1 + rr); xx++) {
      const dx = Math.max(x0 - xx, xx - x1, 0), dy = Math.max(y0 - yy, yy - y1, 0), dd = Math.hypot(dx, dy), k = dd <= 0 ? 1 : Math.max(0, 1 - dd / rr);
      const q = yy * w + xx; grau[q] = Math.round(grau[q] + (255 - grau[q]) * k);
    }
  }
  let t = 0; for (let p = 0; p < n; p++) if (grau[p] < 128) t++;
  return { grau, w, h, tinte: +(t / n).toFixed(4) };
}

if (require.main === module) (async () => {
  /* Morgenlauf: nur bereithalten. Kein Zeichnen, keine Sperre, nie ein Rueckgabewert ungleich 0. */
  if (NUR_MODELL) {
    if (modellHolen()) console.log(`Feder — Modell ist da (${MODELLNAME}).`);
    else console.log(`Feder — Modell nicht zu holen (${MODELLNAME}); das Skizzenbuch versucht es beim Öffnen wieder.`);
    return;
  }
  if (!sperren()) { console.log('Feder — läuft schon (anderer Lauf), nichts zu tun.\n'); return; }
  process.on('exit', entsperren);
  /* Abgebrochen (Server beendet, Strg+C): Buch schreiben und die Sperre freigeben. Ohne diese Zeilen stirbt Node
     bei einem Signal, ohne 'exit' auszuloesen - die Sperre hielte eine tote PID (sperreLebt erkennt das, aber der
     Rest bleibt liegen), und was seit dem letzten Zwischenstand gezeichnet wurde, stuende nicht im Buch und wuerde
     beim naechsten Mal noch einmal gezeichnet (gesehen am 08.10.2026: 45 Zeichnungen, 35 Eintraege). */
  let imBuch = null;
  for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => {
    if (imBuch) try { buchSchreiben(imBuch); } catch (e) {}
    process.exit(sig === 'SIGINT' ? 130 : 143);
  });
  if (!modellHolen()) {
    console.log(`Feder — das Modell fehlt: ${path.relative(WURZEL, MODELL)}`);
    console.log('  Gezeichnet wird nichts (keine mindere Qualität). Nachholen mit:  node bin/modelle-holen.js --nur ' + MODELLNAME + '\n');
    return;
  }
  const aw = ausweis(), buch = buchLesen();
  if (AUSWEISIDENT(buch.ausweis) !== AUSWEISIDENT(aw) && Object.keys(buch.bilder).length) {
    console.log('  Modell oder Nachbearbeitung haben gewechselt — alle Bilder werden neu gezeichnet.');
    buch.bilder = {};
  }
  buch.ausweis = aw;
  const gesichter = gesichterLesen();
  /* Reste eines hart abgebrochenen Laufs (*.teil) wegräumen - wir halten die Sperre, kein anderer schreibt gerade */
  for (const b of alleBilder()) { try { for (const n of fs.readdirSync(path.dirname(b.ziel))) if (/^feder\.png\.\d+\.teil$/.test(n)) fs.unlinkSync(path.join(path.dirname(b.ziel), n)); } catch (e) {} }
  try { for (const n of fs.readdirSync(LIB)) if (/^feder\.json\.\d+\.teil$/.test(n)) fs.unlinkSync(path.join(LIB, n)); } catch (e) {}
  imBuch = buch;                     /* ab hier schreibt ein Abbruch das Buch noch (siehe oben) */

  let alle = alleBilder();
  if (NUR.length) alle = alle.filter(b => NUR.some(n => b.id.startsWith(n)));
  /* --nur waehlt aus, erzwingt aber nichts: auch eine Stichprobe ueberspringt, was schon gilt (--neu erzwingt) */
  const offen = alle.filter(b => NEU || !gueltig(buch.bilder[b.id], b, schriftVon(b, gesichter).maske));
  console.log(`Feder — ${offen.length} von ${alle.length} Bildern zu zeichnen (${FAEDEN} Fäden)\n`);
  if (!offen.length) return;
  melden.lauf({ was: 'Federzeichnungen werden gerechnet', n: 0, von: offen.length, nEinheit: 'Bild' });
  /* das Netz erst laden, wenn es etwas zu tun gibt - „Bilder vorbereiten" fragt oft, wenn alles fertig ist */
  const ort = require('onnxruntime-node');
  const sitzung = await ort.InferenceSession.create(MODELL, { intraOpNumThreads: FAEDEN, logSeverityLevel: 3 });

  let n = 0, fehler = 0, mitSchrift = 0; const t0 = Date.now(), tinten = [];
  for (const b of offen) {
    n++;
    const schrift = schriftVon(b, gesichter);
    let z = null;
    try { z = await zeichnen(ort, sitzung, b.datei, schrift.t, schrift.format); if (z) grauSchreiben(z.grau, z.w, z.h, b.ziel); }
    catch (e) {
      /* Werkzeug unterbrochen oder fehlt, Platte voll: nicht das Bild - nichts merken, Lauf beenden (Buch schreiben, Sperre frei).
         Alles andere (das Netz verschluckt sich an einem riesigen Bild, falsche Maße) liegt am Bild: als unlesbar merken und weiter -
         sonst brach jeder Lauf am selben Titel ab und die folgenden kamen nie dran (zweite Fallensuche 1.0.61). */
      if (e instanceof Werkzeugfehler || /ENOSPC|EIO|EROFS/.test(e.code || e.message || '')){
        console.log(`  [${n}/${offen.length}] ${b.id.slice(0, 8)}  ${e.message} — Lauf abgebrochen, der nächste versucht es wieder.`);
        buchSchreiben(buch); melden.ausLauf(); return; }
      console.log(`  [${n}/${offen.length}] ${b.id.slice(0, 8)}  ${e.message}`); z = null;
    }
    auffrischen();                   /* Lebenszeichen der Sperre (server.js sperreLebt, sperren oben) */
    if (!z) {
      fehler++;
      buch.bilder[b.id] = { quelle: b.quelle, quellStand: b.quellStand, unlesbar: true, gerechnet: new Date().toISOString() };
      console.log(`  [${n}/${offen.length}] ${b.id.slice(0, 8)}  ${path.basename(b.datei)} nicht lesbar oder nicht zu schreiben`);
    } else {
      if (schrift.t.length) mitSchrift++;
      tinten.push(z.tinte);
      buch.bilder[b.id] = { quelle: b.quelle, quellStand: b.quellStand, w: z.w, h: z.h, tinte: z.tinte,
                            maske: schrift.maske, kaesten: schrift.t.length, gerechnet: new Date().toISOString() };
    }
    if (n % 20 === 0 || n === offen.length) {
      console.log(`  [${n}/${offen.length}] ${b.id.slice(0, 8)}  Tinte ${z ? String((z.tinte * 100).toFixed(1)).replace('.', ',') + ' %' : '—'}`);
      buchSchreiben(buch);
    }
    melden.lauf({ was: 'Federzeichnungen werden gerechnet', n, von: offen.length, nEinheit: 'Bild', jetzt: b.id.slice(0, 8) });
  }
  buchSchreiben(buch);
  melden.ausLauf();
  const ms = Math.round((Date.now() - t0) / offen.length);
  const mitte = tinten.length ? tinten.slice().sort((a, b) => a - b)[tinten.length >> 1] : 0;
  console.log(`\n  ${n - fehler} Zeichnungen${fehler ? `, ${fehler} nicht lesbar` : ''}, ${mitSchrift} mit ausgesparter Schrift, Tinte im Median ${String((mitte * 100).toFixed(1)).replace('.', ',')} % — ${ms} ms je Bild.`);
  console.log(`  Buch: ${path.relative(WURZEL, BUCH)}\n`);
})().catch((e) => { console.error('  FEHLER:', e.message); entsperren(); process.exit(1); });
