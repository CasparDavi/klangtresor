#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Der Sternenhimmel als EINE Datei zum Verschicken (Caspar_D, 21.08.2026:
 * "als Demo an Tarja"): library/export/sternenhimmel.html
 *
 *   node bin/himmel-export.js
 *   node bin/himmel-export.js --relativ Programm/library/songs --ziel /Volumes/Stick/KlangTresor/Sternenhimmel.html
 *   node bin/himmel-export.js --musik Musik --namen namen.json --ziel /Volumes/Stick/KlangTresor/Sternenhimmel.html
 *
 * DREI SPIELARTEN (Caspar_D, 09.09.2026, Archiv-Export auf den Stick):
 *   ohne --relativ   die Demo zum Verschicken: nur oeffentliche Titel,
 *                    Bild und Ton von Sunos CDN, Klick auf einen Stern
 *                    spielt von dort.
 *   mit --relativ P  die Datei liegt NEBEN dem Archiv (auf dem Stick):
 *                    Bild = P/<id>/titelbild.jpg (sonst cover.jpg),
 *                    Ton = P/<id>/audio.mp3 - relative Adressen, die auch
 *                    ueber file:// gehen. Ein Klick spielt lokal, kein
 *                    Netz noetig. Und weil die Titel ohnehin alle auf dem
 *                    Stick liegen, kommen hier auch die privaten mit -
 *                    ein Sternenhimmel des eigenen Bestands, nicht eine
 *                    Demo fuer Fremde. Nur Titel ohne audio.mp3 bleiben
 *                    draussen, sonst zeigte der Stern ins Leere.
 *   mit --musik M    die Stickfassung seit dem Behaelter (09.09.2026):
 *   und --namen J    Ton und Bilder liegen auf dem Stick nicht mehr als
 *                    Dateien im Titelordner, sondern in tar-Stuecken
 *                    (bin/behaelter.js, bestand-001.tar ...), und an die
 *                    kommt eine file://-Seite nicht heran - der Browser
 *                    kann kein tar aufschlagen. Was auf dem Stick als
 *                    echte Datei bleibt, ist Musik/<Titel>.mp3 (fuer
 *                    Fernseher und Autoradio, bin/export.js). Also:
 *                    Ton = M/<Dateiname, URL-kodiert>, wobei J die
 *                    Zuordnung { "<id>": "<Dateiname>.mp3" } ist, die
 *                    export.js beim Schreiben von Musik/ festhaelt
 *                    (Doppelnamen tragen dort " (2)"). Bild = die Kachel
 *                    (songs/<id>/kachel.jpg, sonst titelbild.jpg) als
 *                    data:-URI eingebettet - die Datei braucht nichts
 *                    ausser sich selbst und dem Musik-Ordner. Vor dem
 *                    Einbetten wird die Kachel mit ffmpeg auf 144 x 144
 *                    verkleinert (Caspar_D, 09.09.2026): 324 Kacheln zu
 *                    je ~50 KB waren 21,6 MB HTML fuer Bilder, die die
 *                    Seite hoechstens 72 px gross zeigt (#player 44 px,
 *                    #kartesteckbrief 72 px) - 144 px sind das Doppelte
 *                    fuer Retina, und mit -q:v 4 bleiben ~5-7 KB je Bild,
 *                    rund 2 MB fuer alles. Fehlt ffmpeg oder scheitert
 *                    es, kommt die Originalkachel wie zuvor hinein, mit
 *                    einer Zeile in der Ausgabe. Titelauswahl wie bei
 *                    --relativ, dazu nur Titel, die in J einen Namen haben.
 *                    M ist eine URL relativ zur HTML-Datei (Vorwaerts-
 *                    schraegstriche, kein Schlussstrich), kein Dateipfad.
 *   --ziel <datei>   wohin; Vorgabe library/export/sternenhimmel.html,
 *                    mit --relativ library/export/sternenhimmel-relativ.html,
 *                    mit --musik library/export/sternenhimmel-stick.html.
 *
 * Laeuft ohne KlangTresor-Server: Daten eingebettet (Lage, Gruppen, KI-
 * Etiketten, Hausmesswerte, Suno-Adresse je Song), Cover von Sunos
 * CDN (oeffentlich). Klick auf einen Stern oeffnet den Song auf
 * suno.com. Nur oeffentliche Songs - private bleiben zu Hause.
 *
 * KEINE zweite Kopie des Zeichencodes: die Funktionen (Schwarzkoerper,
 * Moffat, Rauschen, Layout, Himmel, Steckbrief) werden beim Export
 * aus web/index.html herausgeschnitten. Aendert sich der Himmel dort,
 * aendert er sich hier mit. Was der Export braucht, aber die Seite
 * liefert ($, song(), aktuellId ...), stellt ein kleiner Schim.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync, execFileSync } = require('node:child_process');   /* Syntaxprobe unten, Kacheln verkleinern (--musik) */
const WURZEL = path.join(__dirname, '..');
const K = require('./katalog.js');

/* Aufrufoptionen - siehe Kopf. Ein Praefix ohne Wert ist ein Tippfehler,
   kein stiller Rueckfall auf die CDN-Fassung. */
const args = process.argv.slice(2);
const option = (name) => { const i = args.indexOf(name); if (i < 0) return null; const w = args[i + 1]; if (!w || w.startsWith('--')) { console.error('\n  ' + name + ' braucht einen Wert.\n'); process.exit(1); } return w; };
const RELATIV = option('--relativ');                                  /* z.B. Programm/library/songs */
const MUSIK = option('--musik');                                      /* z.B. Musik - der MP3-Ordner auf dem Stick */
const NAMEN_OPT = option('--namen');                                  /* { "<id>": "<Dateiname>.mp3" } */
const ZIEL_OPT = option('--ziel');
const SONGS_ORDNER = path.join(WURZEL, 'library', 'songs');
/* --musik und --namen gehoeren zusammen: ohne die Namen wuesste der Ton
   nicht, wie er heisst; ohne den Ordner nicht, wo er liegt. Und mit
   --relativ zugleich waere nicht gesagt, welche Fassung gemeint ist. */
if (!!MUSIK !== !!NAMEN_OPT) { console.error('\n  --musik und --namen gehoeren zusammen.\n'); process.exit(1); }
if (MUSIK && RELATIV) { console.error('\n  --musik oder --relativ, nicht beides.\n'); process.exit(1); }
const NAMEN = MUSIK ? JSON.parse(fs.readFileSync(path.resolve(NAMEN_OPT), 'utf8')) : {};
const STICK = !!MUSIK;                                                /* Ton aus Musik/, Bilder eingebettet */
const ARCHIV = !!(RELATIV || MUSIK);                                  /* beide Stickfassungen: der eigene Bestand, nicht die Demo */

const html = fs.readFileSync(path.join(WURZEL, 'web', 'index.html'), 'utf8');
const karte = JSON.parse(fs.readFileSync(path.join(WURZEL, 'library', 'karte.json'), 'utf8'));
let analyse = {};
try { analyse = JSON.parse(fs.readFileSync(path.join(WURZEL, 'library', 'analyse-index.json'), 'utf8')).songs || {}; } catch (e) {}
const katalog = K.lesen();
const konfig = (() => { try { return JSON.parse(fs.readFileSync(path.join(WURZEL, 'library', 'konfig.json'), 'utf8')); } catch (e) { return {}; } })();

/* DER NAME DES SCHIFFS (25.08.2026). Hier stand bis dahin ein festes
   SCHIFF_NAME = 'Caspar' in der Vorbelegung unten - aus der Zeit, als die
   Seite ihn ebenfalls als Konstante fuehrte. Seit sie ihn aus dem
   Suno-Profil ableitet, rufen die herausgeschnittenen Funktionen
   schiffName() und matrixKennung(). Im Export gab es beide nicht: das
   Schiff waere beim ersten Zeichnen mit einem ReferenceError
   stehengeblieben, und mit ihm der ganze Himmel.

   Der Export nimmt keinen Katalog mit, der Name wird also eingebrannt -
   nach derselben Regel wie in der Seite: der erste Teil des Alias vor -,
   . oder _, erster Buchstabe gross; die Kennung der Musik-Matrix ist sein
   erster Buchstabe. Fehlt der Alias, bleiben beide leer - der Export
   steigt weiter unten ohnehin aus. */
const SCHIFF_KOPF = String((konfig && konfig.handle) || '').split(/[-._]/)[0] || '';
const SCHIFF_TEXT = SCHIFF_KOPF ? SCHIFF_KOPF[0].toUpperCase() + SCHIFF_KOPF.slice(1) : '';
const MATRIX_TEXT = (konfig && konfig.handle) ? String(konfig.handle)[0].toUpperCase() : '';

/* Eine Funktion samt Rumpf aus index.html schneiden (Klammern zaehlen). */
function funktion(name) {
  const m = html.match(new RegExp(`\\n(?:async )?function ${name}\\(`));
  if (!m) throw new Error('nicht gefunden: ' + name);
  let i = m.index + 1, tiefe = 0, start = i;
  while (html[i] !== '{') i++;
  for (; i < html.length; i++) { if (html[i] === '{') tiefe++; else if (html[i] === '}' && --tiefe === 0) break; }
  return html.slice(start, i + 1);
}
function konstante(re) { const m = html.match(re); if (!m) throw new Error('nicht gefunden: ' + re); return m[0]; }
/* Eine mehrzeilige Deklaration schneiden - konstante() nimmt nur eine
   Zeile, und WL, STRUDEL und SCHWADEN gehen ueber drei bis zwanzig.
   Geklammert wird gezaehlt, wie bei funktion(); Schluss ist, wenn die
   Klammern wieder aufgehen und die Zeile auf ein Semikolon endet. */
function deklaration(name) {
  const m = html.match(new RegExp('\\n(const|let|var) ' + name + '\\b'));
  if (!m) throw new Error('nicht gefunden: ' + name);
  const start = m.index + 1;
  const zeilen = html.slice(start).split('\n');
  let tiefe = 0, aus = [];
  for (const z of zeilen) {
    for (const c of z) { if ('({['.includes(c)) tiefe++; else if (')}]'.includes(c)) tiefe--; }
    aus.push(z);
    if (tiefe === 0 && z.trimEnd().endsWith(';')) break;
  }
  return aus.join('\n');
}

const code = [
  /* Der Rabe (25.08.2026): eigenes Modul, hier ganz eingebettet - das
     Gestalt-Dropdown steht im geschnittenen Panel, und ohne rabeZeichnen
     bliebe die dritte Wahl ein unsichtbarer Flieger. module.exports am
     Ende ist durch den typeof-Guard im Modul selbst abgesichert. */
  fs.readFileSync(path.join(WURZEL, 'web', 'fremd', 'rabe.js'), 'utf8'),
  konstante(/const NEBEL = \[[^\n]*\];/),
  konstante(/const karteFarbe = [^\n]*;/),
  funktion('koronaFarbe'),
  funktion('schwarzkoerper'), funktion('moffat'), funktion('saat'),
  'let karteRauschen = null;', funktion('rauschen'),
  "let karteLage = { W: 0, H: 0, xy: null }; let karteArt = '3d'; let karteZoom = { k: 1, tx: 0, ty: 0 }; const COVER_AB = 2.5; let karteDim = '3d', karteVerf = 'nmds', karteLoecher = false, karteLinien = false, karteNebel = false, karteBahn = true; let schiffPos = null, schiffAnker = null; let karteArten = { Genre: false, Stimmung: false, Instrument: false }; let karteSternbilder = []; const karteSternbildLage = new Map(); let karteRot = [1,0,0,0], karteRotZiel = null, karteRotStart = null, karteRotT0 = 0; const KAMERA = 3.2; const DREH_DAUER = 2600; const karteCover = new Map(); let karteNeuzeichnung = 0; let karteDaten = null;",
  konstante(/const karteXY = [^\n]*;/), 'const COVER_STERNE = 20;', funktion('sichtbareSterne'), konstante(/const coverAn = [^\n]*;/),
  funktion('coverBild'), funktion('karteZoomEinrichten'),
  konstante(/const karteRoh = [^\n]*;/), konstante(/const karteRaum = [^\n]*;/), konstante(/const karteGruppeRaum = [^\n]*;/), konstante(/const karteDrehZentrum = [^\n]*;/),
  konstante(/const qMul = [^\n]*;/), konstante(/const qAchse = [^\n]*;/), funktion('qDreh'), funktion('qSlerp'), funktion('karteNachVorn'), funktion('orbitBasis'), funktion('karteEbeneNachVorn'), funktion('karteAnimieren'),
  'let karteSpot = null;', funktion('karteKennwerte'),
  funktion('karteLayout'), funktion('karteSteckbrief'), funktion('karteHimmel'),
  konstante(/const ORBIT_EXZ = [^\n]*;/), konstante(/\{ let a = 0; for \(let k = 0; k < KEPLER_N[^\n]*\}/), konstante(/const KEPLER_GES = [^\n]*;/), funktion('keplerPhase'),
  "let reise = false; const reiseBesucht = new Set(); let reiseWeg = []; const reiseSpuren = { '2d': [], '3d': [] }; let reiseSpur = reiseSpuren['3d'], reiseSpurArt = '3d'; let schiffLauf = 0; let zufall = false; let karteAnflug = null; let gestalt = 'schiff'; function schiffName(){ return " + JSON.stringify(SCHIFF_TEXT) + "; } function matrixKennung(){ return " + JSON.stringify(MATRIX_TEXT) + "; } let schiffArt = 'orbit'; let schiffLetzteId = null, warpT0 = 0, warpVon = null, warpNach = null; let schiffKamVon = null; let probeflug = false, probeT0 = 0; const PROBE_UMLAUF = 1.0, PROBE_RUNDEN = 3; let kubus = false; const assimiliert = new Set(); let supernovae = []; const ZWILLING = 0.17;",
  funktion('reiseNaechster'), funktion('reiseToggle'), funktion('probeflugToggle'), funktion('probeflugWeiter'), funktion('karteZielId'), 'let karteNachlaufT = 0, karteNachlaufAus = false;', funktion('karteNachlauf'), funktion('karteFlugkamera'), funktion('karteSchiff'), funktion('karteSchiffFrame'), konstante(/const titelStamm = [^\n]*;/), funktion('zwillinge'),
  konstante(/const karteArtAbleiten = [^\n]*;/),
  konstante(/const LADEN_ICON = \{[\s\S]*?\n\};/), "let karteLaden = { einstellungen: false, legende: true, werk: true };", funktion('ladeHtml'), funktion('ladenDran'), funktion('ladenLeiste'), 'let karteDrawerOffen = false;',
  funktion('karteLesarten'), funktion('kartePanelHtml'), funktion('kartePanelDran'),
  /* NACHGETRAGEN AM 25.08.2026. Diese fuenf rief der herausgeschnittene
     Code bereits, ohne dass sie mitkamen - der Export lief durch, aber die
     erzeugte Datei stieg beim ersten Flug mit einem ReferenceError aus
     ("anschlussPlanen is not defined"). Gefunden, indem alle Bezeichner
     der Exportdatei gegen die Deklarationen der Seite geprueft wurden;
     diese Pruefung laeuft jetzt bei jedem Export mit (ganz unten in
     dieser Datei), damit die naechste Luecke nicht erst beim
     Verschicken auffaellt.

     Es sind genau die Sachen, die nach dem letzten Abgleich entstanden
     sind: der Kubus, das Wurmloch, der Blitz der Supernova und die
     Anschlussplanung der Reise. */
  funktion('karteZielDanach'),
  /* Der ANSCHLUSS bleibt draussen. anschlussHolen() fragt /api/song/<id> -
     den Server, den die Exportdatei gerade nicht hat. Ein nahtloser
     Uebergang zwischen zwei Songs ist eine Sache des lokalen Archivs, nicht
     der Demo; hier stuende sonst eine ganze Familie von sieben Funktionen,
     die nur ins Leere greifen. Ein leerer Platzhalter genuegt: reiseToggle()
     ruft sie, und mehr will sie hier nicht koennen. */
  'async function anschlussPlanen(){}',
  /* Das Wurmloch, der Kubus und der Beschuss bringen eigene Konstanten
     und Zustaende mit. Ohne sie stiegen die Zeichenfunktionen genau dann
     aus, wenn sie gebraucht werden - beim Ende einer Reise. */
  konstante(/const sanft = [^\n]*;/), konstante(/const spanne = [^\n]*;/),
  deklaration('WL'), deklaration('STRUDEL'), deklaration('SCHWADEN'),
  konstante(/const SPUR_DECK = [^\n]*;/),
  'let wurmloch = null; let wurmlochSpur = null; let beschuss = [];',
  funktion('strudelOrt'), funktion('nebelMalen'),
  funktion('blitzMalen'), funktion('wuerfelZeichnen'), funktion('wurmlochMalen'),
  'let karteTippUhr = 0;', funktion('karteTipp'), funktion('karteTippWeg'),
  /* NACHGETRAGEN AM 09.09.2026, gefunden von der Selbstpruefung unten beim
     Bau des Archiv-Exports: neun Namen, die seit dem 25.08. in die
     geschnittenen Funktionen gewachsen sind - die Raeume (raumJetzt,
     raumDaten, raumDa, raumK, RAUM_NAME), das beschnittene Titelbild
     (artworkBild), das Symbol-Makro SYM, der Rabe (rabenmagieAnwenden)
     und sunoHandle. Die Demo lief seither ohne Fehlermeldung durch den
     Export und stieg im Browser beim ersten Zeichnen aus.

     Raeume gibt es hier nicht: ein Himmel, ein Datensatz. raumDaten
     bleibt leer und raumK faellt auf karteDaten zurueck (die Funktion
     aus der Seite tut genau das); raumDa = null blendet die Raum-Zeile
     im Panel aus. artworkBild wird nie gebraucht, weil jeder Titel sein
     Bild als s.bild mitbringt - der Platzhalter faengt nur den ||-Zweig.
     SYM zeigt auf Symbole, die die Seite als <svg><symbol> traegt und
     diese Datei nicht; das Stift-Symbol am Schiffsnamen bleibt darum
     leer, der Knopf tut trotzdem. */
  konstante(/const RAUM_NAME = [^\n]*;/),
  konstante(/const SYM = [^\n]*;/),
  "const raumDaten = {}; let raumJetzt = 'klang'; let raumDa = null;",
  funktion('raumK'),
  /* artworkBild wird im Steckbrief und in der Legende gerufen (zwei
     Stellen im geschnittenen Code). Leer zurueckgeben hiess: ein <img>
     ohne Adresse - "dead link auf die Cover" (Caspar_D, 09.09.2026).
     Jeder Titel traegt seine Bildadresse im Stamm (CDN oder relativ). */
  "function artworkBild(id){ const s = song(id); return (s && s.bild) || ''; }",
  'function rabenmagieAnwenden(){}',
  'function sunoHandle(){ return ' + JSON.stringify(String((konfig && konfig.handle) || '')) + '; }',
  /* Dieselbe Runde, zweiter Fund - erst im Browser, nicht in der
     Selbstpruefung: esc (der Schiffsname im Panel) und diaFlaeche (die
     Flaechenfarbe des Panels) werden nur INNERHALB von Vorlagenzeichen-
     ketten gerufen, ${esc(...)}, und die Pruefung strich Vorlagen bis
     dahin komplett - samt Ausdruecken darin. Seit heute behaelt sie die
     ${...}-Teile (unten). SPUR_DECKUNG kommt mit, diaFlaeche liest sie. */
  /* esc kommt NICHT aus der Seite geschnitten: dort steht ein Anfuehrungs-
     zeichen in einem Regex-Muster (/[&<>"]/), und die Pruefung unten, die
     Zeichenketten mit einem Muster streicht, hielt es fuer den Anfang
     einer - danach war fuer sie der halbe Export eine Zeichenkette und
     'function zeichnen' unbekannt. Gleiche Wirkung, als \\x22 geschrieben. */
  'function esc(t){ return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\\x22/g, "&quot;"); }',
  konstante(/const SPUR_DECKUNG = [^\n]*;/), deklaration('diaFlaeche'), deklaration('diaTopline'),
  deklaration('RAUM_WAS'),                     /* Hinweistext der Raum-Pillen; ohne raumDa bleiben sie aus, gelesen wird er trotzdem */
].join('\n\n')
  .replace(/\/media\/\$\{s\.id\}\/cover\.jpg/g, '${s.bild || \'\'}')   // Cover von Sunos CDN
  .replace(/`<button class="pille" id="karteexport"[^`]*`\)/, '``)');             // kein Export-Knopf in der Demo

/* Daten: nur oeffentliche Songs, schlank - in der Demo. Auf dem Stick
   (--relativ) alle eigenen, die eine MP3 mitbringen; siehe Kopf. */
const songs = karte.songs.filter(p => {
  const s = katalog.songs[p.id]; if (!s || s.fremd) return false;
  if (STICK && !NAMEN[p.id]) return false;                      /* ohne Namen in Musik/ keine Tonadresse */
  if (ARCHIV) return fs.existsSync(path.join(SONGS_ORDNER, p.id, 'audio.mp3'));
  return !!s.oeffentlich;
});
/* Bild- und Tonadresse je Titel: relativ zum Praefix, aus Musik/ mit
   eingebettetem Bild, oder Sunos CDN. Das Praefix bleibt, wie es kommt
   (Vorwaertsschraegstriche, kein Schlussstrich) - es ist eine URL, kein
   Dateipfad, auch unter Windows. */
/* Die Kachel verkleinert, als Buffer - siehe Kopf (--musik): 144 x 144,
   -q:v 4 (bei 3 ~6-8 KB, bei 5 ~4.5-6 KB; 4 ist die kleinste Stufe, die
   noch im Zielband von 6-10 KB landet). ffmpeg schreibt als MJPEG nach
   stdout, wie bin/kacheln.js sein Messbild holt. null, wenn ffmpeg fehlt
   oder scheitert - dann nimmt der Rufer die Originaldatei. */
const KACHEL_KANTE = 144, KACHEL_GUETE = 4;
let kachelVerkleinerung = true;                                   /* nach dem ersten Fehlschlag: nicht 324-mal probieren */
const kachelKlein = (datei) => {
  if (!kachelVerkleinerung) return null;
  try {
    return execFileSync('ffmpeg', ['-v', 'error', '-i', datei, '-vf', `scale=${KACHEL_KANTE}:${KACHEL_KANTE}`,
      '-q:v', String(KACHEL_GUETE), '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'mjpeg', 'pipe:1'],
      { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 24 });
  } catch (e) {
    /* Kein ffmpeg (ENOENT) oder ein Bild, das es nicht lesen mag: einmal
       sagen, ab dann Originale - die Seite wird gross, aber sie wird. */
    if (e.code === 'ENOENT') { kachelVerkleinerung = false; console.log('  ffmpeg nicht gefunden - Kacheln werden in Originalgroesse eingebettet.'); }
    else console.log('  Kachel nicht verkleinert (' + path.relative(SONGS_ORDNER, datei) + '): ' + (e.message || e).toString().split('\n')[0] + ' - Original eingebettet.');
    return null;
  }
};
/* Die Kachel als data:-URI - siehe Kopf (--musik). Leer, wenn zu Hause
   weder Kachel noch Titelbild liegt; artworkBild faengt das ab. */
const bildEingebettet = (id) => {
  for (const b of ['kachel.jpg', 'titelbild.jpg']) {
    const f = path.join(SONGS_ORDNER, id, b);
    if (fs.existsSync(f)) return 'data:image/jpeg;base64,' + (kachelKlein(f) || fs.readFileSync(f)).toString('base64');
  }
  return '';
};
/* Der Dateiname in Musik/ als URL: Leerzeichen, Umlaute, Klammern und
   das Prozentzeichen muessen kodiert sein, sonst liest der Browser
   "Kein Shutdown.mp3" als zwei Woerter. Der Schraegstrich bleibt Trenner,
   er kommt aber ohnehin nicht vor - dateiname() in export.js ersetzt ihn. */
const musikAdresse = (name) => MUSIK.replace(/\/+$/, '') + '/' + name.split('/').map(encodeURIComponent).join('/');
const adressen = (s) => {
  if (STICK) return { bild: bildEingebettet(s.id), audio: musikAdresse(NAMEN[s.id]) };
  /* Ohne --relativ: Bilder von Sunos CDN (oeffentlich, antwortet). Die
     Tonadressen des Katalogs sind seit 03.09.2026 Sunos Sperre
     (/api/forbidden, docs/AUDIO-BEZUG.md) - eine Adresse, die nicht
     spielt, bekommt der Player gar nicht erst; der Klick auf einen Stern
     oeffnet dann den Titel bei Suno (s.link). */
  if (!RELATIV) return { bild: s.bildUrl || '', audio: (s.audioUrl && !/\/api\//.test(s.audioUrl)) ? s.audioUrl : '' };
  const p = RELATIV.replace(/\/+$/, '');
  const bildDatei = fs.existsSync(path.join(SONGS_ORDNER, s.id, 'titelbild.jpg')) ? 'titelbild.jpg' : 'cover.jpg';
  return { bild: p + '/' + s.id + '/' + bildDatei, audio: p + '/' + s.id + '/audio.mp3' };
};
const stamm = {};
for (const p of songs) {
  const s = katalog.songs[p.id];
  stamm[p.id] = { id: s.id, titel: s.titel, erstellt: s.erstellt, modell: s.modell, dauer: s.dauer, link: s.link || `https://suno.com/song/${s.id}`,
    plays: s.plays || 0, likes: s.likes || 0, kommentare: s.kommentare || 0, zaehlerVerlauf: (s.zaehlerVerlauf || []).slice(-12).map(e => ({ stand: e.stand, plays: e.plays })),
    ...adressen(s), analyse: analyse[s.id] ? { bpm: analyse[s.id].bpm, tonart: analyse[s.id].tonart, lufs: analyse[s.id].lufs, stimme: analyse[s.id].stimme } : null };
}
const oeff = new Set(songs.map(p => p.id));
const tags = (karte.tags || []).map(t => ({ ...t, sterne: (t.sterne || []).filter(id => oeff.has(id)) }));   // nur oeffentliche Sterne im Sternbild
const daten = { stand: karte.stand, anzahl: songs.length, gruppen: karte.gruppen, stress: karte.stress, stress3d: karte.stress3d, tags, songs };
/* Der Handle steht in library/konfig.json und wird von sammeln.js
   geschrieben. Wer eine Karte hat, hat Songs; wer Songs hat, hat einen
   Handle - der Fall tritt also nicht ein.

   Bis zum 24.08.2026 stand hier trotzdem ein Rueckfall: der Handle des
   Autors. Bei einer beschaedigten Konfiguration haette ein fremder
   Nutzer seinen Sternenhimmel unter einem fremden Namen exportiert und
   es womoeglich nicht gemerkt.

   Ein Rueckfall, der sich selbst etwas ausdenkt, ist kein Rueckfall.
   Fehlt der Handle, ist etwas kaputt - dann sagen wir das. */
const handle = konfig.handle || '';
if (!handle) {
  console.error('\n  Kein Suno-Alias in library/konfig.json.');
  console.error('  Der Sternenhimmel traegt den Namen des Urhebers - ohne ihn');
  console.error('  waere der Export anonym und der Verweis auf die Songs tot.');
  console.error('  Erst  node bin/sammeln.js <alias>,  dann erneut versuchen.\n');
  process.exit(1);
}

/* DER EINGEBETTETE SUNO-SPIELER (Caspar_D, 09.09.2026): in der DEMO klappt
   beim Klick auf einen Stern Sunos eigener Spieler unten rechts auf und
   streamt den Titel - "wenn jeder Song auf Suno geht, ist der Reiz kaputt".
   Von Sunos Spieler bleibt nur die Bedienleiste stehen: der Mischmodus
   'screen' macht seinen schwarzen Grund durchsichtig (die Kurve
   brightness/contrast zieht das Blau erst nach Schwarz), und clip-path
   schneidet Sunos Titelbild (links) und Titel (oben) weg - beide setzen
   wir selbst, mit unserem Titelbild in Farbe direkt aus Sunos Bildadresse.
   Das Suno-Logo unten rechts bleibt sichtbar (Caspar_D: die Corporate
   Identity nicht untergraben). Die Zahlen sind an Caspar_Ds Regler-Bausatz
   eingestellt. Nur in der Demo; die Stickfassungen spielen lokal ueber die
   untere Leiste. */
const demoStil = ARCHIV ? '' : `<style>
/* DIE DEMO (Caspar_D, 09.09.2026): der Sternenhimmel bildfuellend; das
   ganze KlangTresor-Panel bleibt wie es ist ("perfekt designt"), aber es
   SCHWEBT als durchscheinendes Overlay oben rechts ueber den Sternen -
   kein Drawer, der alles zudeckt. Kopf, Fusstext und die untere Leiste
   fallen weg (keine Erklaerungen). Sunos eigener Spieler liegt oben LINKS
   als kleines 16:9-Feld, unangetastet. */
header,#kartefuss,#player{display:none}
body{padding:0}
#karte{grid-template-columns:1fr;gap:0;padding:0;height:100vh}
#kartefeld{height:100vh;border:0;border-radius:0}
/* Das Panel als schwebendes Overlay, nicht als Spalte */
#karterechts{position:fixed;top:14px;right:14px;z-index:35;width:min(330px,34vw);
  max-height:calc(100vh - 28px);overflow:auto;height:auto;padding:0;gap:10px}
/* durchscheinend: die Sterne glimmen hinter dem Panel durch */
#kartelegende .drawer{background:rgba(14,14,18,.5);backdrop-filter:blur(5px);border-color:#ffffff20}
#kartelegende .drawerkopf{background:rgba(255,255,255,.05)}
#karte.leiste #kartelegende{background:rgba(14,14,18,.5);backdrop-filter:blur(5px)}
/* Der Spieler oben links */
#sunobox{position:fixed;left:14px;top:14px;z-index:40;border-radius:8px;overflow:hidden;background:#000;box-shadow:0 8px 30px #000a}
#sunobox[hidden]{display:none}
#sunobox iframe{position:absolute;left:0;top:0;width:480px;height:270px;border:0;transform-origin:0 0}
#sunobox .zu{position:absolute;right:5px;top:5px;z-index:3;width:20px;height:20px;border-radius:50%;
  border:1px solid #ffffff22;background:#000a;color:#ddd;cursor:pointer;font-size:12px;line-height:18px;text-align:center;padding:0}
</style>`;
const demoMarkup = ARCHIV ? '' : '<div id="sunobox" hidden><button id="sunozu" class="zu" title="schließen">×</button>'
  + '<iframe id="sunoif" title="Suno-Spieler" allow="autoplay; encrypted-media"></iframe></div>';

const seite = `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<title>Klangraum — ${handle} auf Suno</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{--bg:#0c0c0d;--flaeche:#161618;--flaeche2:#242427;--rand:#333336;--text:#ececed;--schwach:#8b8b90;--akzent:#c9c9cd}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font:14px/1.45 -apple-system,"Helvetica Neue",Inter,system-ui,sans-serif;min-height:100vh}
header{padding:18px 24px 6px;display:flex;align-items:baseline;gap:14px}
header h1{font-size:18px;font-weight:700;letter-spacing:.02em}
header small{color:var(--schwach);font-size:12px}
#karte{display:grid;grid-template-columns:minmax(0,2fr) minmax(280px,1fr);gap:28px;padding:12px 24px 32px;align-items:stretch}
#kartefeld{position:relative;background:#000;border:1px solid #2a2a2e;border-radius:6px;height:calc(100vh - 214px);min-height:360px;overflow:hidden}
#karteschiffhinten,#karteglut,#karteschiff,#kartesvg{position:absolute;inset:0;width:100%;height:100%;display:block}
#karteschiffhinten{pointer-events:none}
#karteschiff{pointer-events:none}
#player{position:fixed;left:0;right:0;bottom:0;height:64px;background:#131315;border-top:1px solid var(--rand);display:flex;align-items:center;gap:14px;padding:0 20px;z-index:20}
#player img{width:44px;height:44px;border-radius:6px;object-fit:cover;background:var(--flaeche)}
#ptext{min-width:180px}#ptext b{display:block;font-size:13px}#ptext small{color:var(--schwach);font-size:11px}
#pknopf{width:36px;height:36px;border-radius:50%;border:1px solid var(--rand);background:none;color:var(--text);cursor:pointer;font-size:14px}
#pfort{flex:1;accent-color:var(--akzent)}
#player .pille{font-size:11px;padding:4px 12px;border-radius:999px;border:1px solid var(--rand);background:none;color:var(--schwach);cursor:pointer}
#player .pille.an{border:2px solid var(--akzent);color:var(--text)}
body{padding-bottom:64px}
#kartesvg .stern{cursor:pointer}\n#kartefeld{cursor:grab}
#kartesvg .stern.nachbar{stroke:#fff;stroke-width:1.5;stroke-opacity:.7}
#karterechts{display:flex;flex-direction:column;gap:16px;min-height:0;height:min(calc(100vh - 214px),100%);overflow:auto}
#kartelegende h3{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--schwach);font-weight:600;margin:4px 0 10px}
#kartelegende .gruppe{display:flex;gap:10px;align-items:flex-start;padding:7px 8px;border-radius:8px}
#kartelegende .gruppe .farbe,#kartelegende .kartelesart .farbe{flex:0 0 auto;width:14px;height:14px;border-radius:50%;margin-top:2px;border:1.5px solid #000}
#kartelegende .gruppe b,#kartelegende .kartelesart b{display:block;font-size:13px;font-weight:600;color:var(--text)}
#kartelegende .gruppe small,#kartelegende .kartelesart small{display:block;font-size:11px;color:var(--schwach);line-height:1.45}
#kartelegende .kartelesart{display:flex;gap:10px;align-items:flex-start;padding:7px 8px;margin-top:2px}
#kartelegende .kartelesart{padding:5px 8px}
#kartelegende .drawer{margin:0 0 10px;border:1px solid var(--rand);border-radius:10px;overflow:hidden}
#kartelegende .drawerkopf{width:100%;display:flex;align-items:center;gap:9px;padding:8px 12px;background:var(--flaeche);border:none;color:var(--text);cursor:pointer;text-align:left;font:inherit}
#kartelegende .dicon{display:inline-flex;color:var(--schwach);flex:0 0 auto}
#kartelegende .drawer.offen .dicon{color:var(--text)}
#kartelegende .dinnen{min-height:0}
#kartelegende .drawer[data-lade="legende"] .dinnen{padding:8px 4px 4px}
#kartelegende .drawer[data-lade="werk"] .dinnen{padding:8px 12px 12px}
#kartelegende .drawer[data-lade="werk"] #kartesteckbrief{border-top:none;padding-top:0;margin-top:0}
#karterechts > #kartesteckbrief{display:none}   /* geparkt (ausserhalb der Lade): unsichtbar */
#karte.leiste{grid-template-columns:minmax(0,1fr) 48px}
/* Eine senkrechte Pille mit den drei Symbolen = der zusammengefasste Status (Caspar_D, 22.08.) */
#karte.leiste #kartelegende{display:inline-flex;flex-direction:column;align-items:center;gap:0;padding:6px 0;border:1px solid var(--rand);border-radius:999px;background:var(--flaeche);width:40px;margin-left:auto}
#karte.leiste .drawer{border:none;margin:0;border-radius:0;background:none;width:40px;overflow:visible}
#karte.leiste .drawerkopf{padding:8px 0;justify-content:center;gap:0;background:none}
#karte.leiste .drawerkopf:hover .dicon{color:#fff}
#karte.leiste .drawerinhalt{display:none}
#karte.leiste .drawerkopf .dtitel,#karte.leiste .drawerkopf .dkurz,#karte.leiste .drawerkopf .pfeil{display:none}
#karte.leiste .dicon{color:var(--text)}
#kartelegende .drawerkopf .pfeil{display:inline-block;transition:transform .2s;color:var(--schwach);font-size:14px}
#kartelegende .drawer.offen .drawerkopf .pfeil{transform:rotate(90deg)}
#kartelegende .drawerkopf .dtitel{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--schwach);font-weight:600}
#kartelegende .drawerkopf .dkurz{font-size:11px;color:var(--schwach);margin-left:auto;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:55%}
#kartelegende .drawerinhalt{max-height:0;overflow:hidden;transition:max-height .28s ease}   /* zu: nichts lugt hervor */
#kartelegende .drawer.offen .drawerinhalt{max-height:3000px}
#kartelegende .drawerinhalt > .dinnen{min-height:0}
#kartelegende .panel{display:flex;flex-direction:column;gap:7px;padding:10px 12px 12px}
#kartelegende .pzeile{display:flex;gap:10px;align-items:center}
#kartelegende .ptitel{flex:0 0 118px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--schwach)}
#kartelegende .ptitel b{color:var(--text);text-transform:none;letter-spacing:0;font-size:12px}
#kartelegende .pinhalt{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
#kartelegende .phinweis{font-size:11px;color:var(--schwach)}
#kartelegende #schiffart{font-size:11px;padding:3px 8px;border-radius:999px;border:1px solid var(--rand);background:var(--flaeche);color:var(--text)}
#kartelegende .pille{font-size:11px;padding:3px 10px;border-radius:999px;border:1px solid var(--rand);background:none;color:var(--schwach);cursor:pointer}
#kartelegende .pille.an{border:2px solid var(--akzent);color:var(--text)}
#kartelegende .pille[disabled]{opacity:.4;cursor:default}
#kartelegende .artpille.an{border-color:var(--af);color:var(--af)}
#kartelegende .schalter{display:inline-flex;border:1px solid var(--rand);border-radius:999px;overflow:hidden}
#kartelegende .schalter .pille{border:none;border-radius:0;padding:3px 9px}
#kartelegende .schalter .pille.an{border:none;background:var(--akzent);color:#000}
#kartelegende .legende2{display:flex;flex-direction:column;gap:10px}
#kartelegende .lblock h4{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--schwach);font-weight:600;margin:0 0 4px 8px}
#kartelegende .lgrid{display:grid;grid-template-columns:1fr 1fr;gap:0 14px;align-items:start}
#kartesteckbrief{border-top:1px solid var(--rand);padding-top:14px}
#kartesteckbrief[hidden]{display:none}
#kartesteckbrief .kopf{display:flex;gap:12px;align-items:flex-start}
#kartesteckbrief img{width:72px;height:72px;border-radius:6px;object-fit:cover;flex:0 0 auto;background:var(--flaeche)}
#kartesteckbrief b{display:block;font-size:14px;font-weight:600;line-height:1.3}
#kartesteckbrief .meta{font-size:11px;color:var(--schwach);line-height:1.5;margin-top:2px}
#kartesteckbrief .zeile{font-size:12px;line-height:1.5;margin-top:6px}
#kartesteckbrief .zeile span{color:var(--schwach)}
#kartesteckbrief .zeile i,#kartesteckbrief ol li i{font-style:normal;color:var(--schwach);font-size:10.5px;margin-left:6px}
#kartesteckbrief .saeulen{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:10px}
#kartesteckbrief .spalte{display:grid;grid-template-columns:minmax(0,auto) minmax(40px,1fr);column-gap:6px;row-gap:3px;align-items:center;align-content:start}
#kartesteckbrief .spalte h5{grid-column:1/-1;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--schwach);font-weight:600;margin:0 0 2px}
#kartesteckbrief .begriff{font-size:11px;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#kartesteckbrief .balken{position:relative;height:10px;background:#1c1c1f;border-radius:2px}
#kartesteckbrief .balken i{display:block;height:100%;background:var(--akzent);border-radius:2px;opacity:.7}
#kartesteckbrief .balken em{position:absolute;right:3px;top:-1px;font-style:normal;font-size:9.5px;color:var(--schwach);white-space:nowrap;text-shadow:0 0 3px #000,0 0 3px #000}
#kartesteckbrief h4{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--schwach);font-weight:600;margin:12px 0 4px}
#kartesteckbrief ol{list-style:none;font-size:12px;line-height:1.6}
#kartesteckbrief a.suno{display:inline-block;margin-top:10px;font-size:12px;color:var(--text);border:1px solid var(--rand);border-radius:999px;padding:4px 12px;text-decoration:none}
#kartesteckbrief a.suno:hover{border-color:var(--text)}
#kartefuss{grid-column:1/-1;font-size:12px;color:var(--schwach);line-height:1.5}
#kartefuss a{color:var(--schwach)}
#kartetipp{position:fixed;pointer-events:none;background:var(--flaeche2);color:var(--text);font-size:12px;padding:6px 9px;border-radius:6px;border:1px solid var(--rand);z-index:50;white-space:nowrap}
#kartetipp small{display:block;color:var(--schwach);font-size:11px}
@media (max-width:900px){#karte{grid-template-columns:1fr}#kartefeld{height:70vh}#karterechts{height:auto}}
</style>${demoStil}</head>
<body>
<header><h1>Klangraum</h1><small>${daten.anzahl} Titel von <a style="color:inherit" href="https://suno.com/@${handle}">@${handle}</a>${ARCHIV ? ' — aus dem Archiv auf diesem Datenträger' : ' auf Suno'}, nach Klang geordnet — Klick auf einen Stern spielt ihn</small></header>
<div id="karte">
  <div id="kartefeld"><canvas id="karteschiffhinten"></canvas><canvas id="karteglut"></canvas><canvas id="karteschiff"></canvas><svg id="kartesvg"></svg></div>
  <div id="karterechts"><div id="kartelegende"></div><div id="kartesteckbrief" hidden></div></div>
  <div id="kartefuss"></div>
</div>
<div id="player">
  <img id="pbild" alt="">
  <div id="ptext"><b id="ptitel">Einen Stern anklicken</b><small id="pzeit"></small></div>
  <button id="pknopf" title="Abspielen / Pause">▶</button>
  <input id="pfort" type="range" min="0" max="1000" value="0">
  <button id="preise" class="pille" title="Klangreise: am Songende fliegt das Sound-Schiff zum nächsten noch nicht besuchten Klangnachbarn">Reise</button>
  <audio id="audio" preload="none"></audio>
</div>
${demoMarkup}
<script>
const DATEN = ${JSON.stringify(daten)};
const STAMM = ${JSON.stringify(stamm)};
const $ = (id) => document.getElementById(id);
const karteZeichnen = () => zeichnen();   // karteAnimieren ruft so
/* Demo: Sunos Spieler in die Ecke, siehe demoStil oben. */
const EINBETTEN = ${!ARCHIV};
const SUNO_NAT = { w: 480, h: 270 };   /* Naturgroesse des Spielers, 16:9 */
function sunoGroesse(){
  const b = $('sunobox'); if (!b) return;
  const pw = Math.round(window.innerWidth / 5);   /* ein Fuenftel der Bildschirmbreite (Caspar_D 09.09.2026) */
  const s = pw / SUNO_NAT.w;
  b.style.width = pw + 'px'; b.style.height = Math.round(SUNO_NAT.h * s) + 'px';
  const f = $('sunoif'); if (f) f.style.transform = 'scale(' + s + ')';
}
window.addEventListener('resize', sunoGroesse);
let sunoLetzte = 0;
function sunoEinbetten(s){
  const b = $('sunobox'); if (!b) return;
  /* Suno drosselt, wie oft man in kurzer Zeit einen Stream startet - zu
     schnelles Nachladen fuehrt zur Weiterleitungsschleife ueber
     auth.suno.com (Caspar_D, 09.09.2026). Deshalb: denselben, schon
     offenen Titel nicht neu laden, und zwei Ladevorgaenge mindestens drei
     Sekunden auseinander (die Flugreise haelt das ohnehin ein). */
  if (s.id === aktuellId && !b.hidden) return;
  const jetzt = Date.now();
  if (jetzt - sunoLetzte < 3000){ clearTimeout(reiseUhr); reiseUhr = setTimeout(() => sunoEinbetten(s), 3000 - (jetzt - sunoLetzte)); return; }
  sunoLetzte = jetzt;
  /* Sunos eigener Spieler, unveraendert - wir fassen ihn nicht an, nur
     die Groesse des Rahmens skaliert ihn (sunoGroesse). Autoplay: das
     iframe traegt allow="autoplay" (demoMarkup); zusammen mit dem Klick
     auf den Stern (die Nutzergeste, die der Browser fuer Ton mit Klang
     verlangt) startet Sunos Player von selbst. Der ?autoplay=1-Parameter
     traegt das iframe (demoMarkup); ?autoplay=1 kommt mit, damit der
     Titel von selbst spielt. Die Weiterleitungsschleife ueber
     auth.suno.com kam von zu schnellem Nachladen, nicht vom Parameter -
     dagegen steht der Nachlade-Schutz oben (Caspar_D, 09.09.2026). */
  $('sunoif').src = 'https://suno.com/embed/' + s.id + '?autoplay=1';
  aktuellId = s.id; b.hidden = false; sunoGroesse(); zeichnen();
  /* DIE FLUGREISE (Caspar_D, 09.09.2026): im Original fliegt das Schiff am
     Songende zum naechsten Klangnachbarn - ausgeloest vom Ton (audio.onended).
     Sunos Player im iframe gibt uns das Songende nicht (fremder Ursprung),
     also stellen wir eine Uhr auf die bekannte Spieldauer des Titels und
     rufen dann vor(1) - dasselbe, was der Ton getan haette. Zwei Sekunden
     Zugabe fuer das Laden. Wer von Hand einen Stern anklickt, stellt die
     Uhr neu (sunoEinbetten laeuft dann erneut). */
  clearTimeout(reiseUhr);
  if (reise && s.dauer > 0) reiseUhr = setTimeout(reiseWeiter, (s.dauer + 2) * 1000);
}
let reiseUhr = null;
/* Der naechste Stern der Flugreise (Caspar_D, 09.09.2026: "immer denselben
   Song spielen ist doof"): zuerst der naechste noch nicht besuchte
   Klangnachbar; ist keiner mehr frei, irgendein noch nicht gespielter
   Titel; sind alle durch, faengt die Runde von vorn an. Nie der, der
   gerade laeuft. */
function reiseWeiter(){
  let ziel = null;
  try { ziel = reiseNaechster(); } catch (e) {}
  if (!ziel){
    let offen = sichtbar.filter(x => !reiseBesucht.has(x.id));
    if (!offen.length){ reiseBesucht.clear(); if (aktuellId) reiseBesucht.add(aktuellId); offen = sichtbar.filter(x => x.id !== aktuellId); }
    if (offen.length) ziel = offen[Math.floor(Math.random() * offen.length)].id;
  }
  if (!ziel || ziel === aktuellId) return;
  reiseBesucht.add(ziel); reiseWeg.push(ziel);
  const p = DATEN.songs.find(x => x.id === ziel);
  if (p && karteDim === '3d' && schiffArt === 'direkt') karteNachVorn(karteRaum(p));
  spielenNachId(ziel);
}
if (EINBETTEN){ const z = $('sunozu'); if (z) z.onclick = () => { $('sunobox').hidden = true; $('sunoif').src = 'about:blank'; clearTimeout(reiseUhr); }; }
/* Kleiner Player: spielt die MP3 direkt von Sunos CDN (oeffentlich). */
const audio = $('audio');
const sichtbar = DATEN.songs.map(p => STAMM[p.id]).filter(Boolean);
const posVon = (id) => sichtbar.findIndex(s => s.id === id);
function spielenNachId(id){
  const s = song(id); if (!s) return;
  if (EINBETTEN){ sunoEinbetten(s); return; }   /* Demo: Sunos Spieler in die Ecke, streamt */
  if (!s.audio){ if (s.link) window.open(s.link, '_blank'); return; }   /* Rueckfall: zu Suno */
  aktuellId = id; audio.src = s.audio; audio.play().catch(() => {});
  $('pbild').src = s.bild || ''; $('ptitel').textContent = s.titel; $('pknopf').textContent = '❚❚';
  zeichnen();
}
function vor(richtung){
  if (reise && richtung > 0){
    const ziel = reiseNaechster();
    if (ziel){ reiseBesucht.add(ziel); reiseWeg.push(ziel); if (karteDim === '3d' && schiffArt === 'direkt'){ const p = DATEN.songs.find(x => x.id === ziel); if (p) karteNachVorn(karteRaum(p)); } spielenNachId(ziel); return; }
  }
  const j = posVon(aktuellId); if (sichtbar.length) spielenNachId(sichtbar[(j + richtung + sichtbar.length) % sichtbar.length].id);
}
audio.onended = () => vor(1);
audio.ontimeupdate = () => { if (audio.duration){ $('pfort').value = Math.round(1000 * audio.currentTime / audio.duration); const f = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0'); $('pzeit').textContent = f(audio.currentTime) + ' / ' + f(audio.duration); } };
$('pfort').oninput = (e) => { if (audio.duration) audio.currentTime = audio.duration * e.target.value / 1000; };
$('pknopf').onclick = () => { if (!audio.src) return; if (audio.paused){ audio.play(); $('pknopf').textContent = '❚❚'; } else { audio.pause(); $('pknopf').textContent = '▶'; } };
$('preise').onclick = () => { reiseToggle(); };
const song = (id) => STAMM[id] || null;
let aktuellId = null, karteGruppeAn = null, register = 'karte';

${code}

function zeichnen(){
  const d = DATEN, svg = $('kartesvg'), leg = $('kartelegende');
  const L = karteLayout(d);
  karteHimmel(d);
  if (!schiffLauf) schiffLauf = requestAnimationFrame(karteSchiff);
  svg.setAttribute('viewBox', \`0 0 \${L.W} \${L.H}\`);
  const rk = Math.sqrt(karteZoom.k);
  svg.innerHTML = d.songs.map((p, i) => { const [x, y] = karteXY(L, i); return \`<circle class="stern" data-id="\${p.id}" cx="\${x.toFixed(1)}" cy="\${y.toFixed(1)}" r="\${((6 + 8 * p.dichte) * rk).toFixed(1)}" fill="transparent"/>\`; }).join('');
  karteZoomEinrichten($('kartefeld'), svg, zeichnen);
  const gruppenHtml = '<div class="legende2"><div class="lblock"><h4>Stilgruppen</h4><div class="lgrid">' + d.gruppen.map(g => {
    const e = g.erdung || {};
    const erd = [e.bpm && \`\${e.bpm} BPM\`, e.lufs != null && \`\${String(e.lufs).replace('.', ',')} LUFS\`, e.mollAnteil != null && \`\${Math.round(e.mollAnteil * 100)} % Moll\`].filter(Boolean).join(' · ');
    return \`<div class="gruppe"><span class="farbe" style="background:\${karteFarbe(g.nr)}"></span><span><b>\${g.name}</b><small>\${g.anzahl} Songs\${erd ? ' — ' + erd : ''}</small></span></div>\`;
  }).join('') + '</div></div>' + karteLesarten() + '</div>';
  const panelSig = JSON.stringify([karteDim, karteVerf, schiffArt, reise, probeflug, kubus, karteArten, karteNebel, karteBahn, karteLoecher, karteLinien, karteLaden, karteGruppeAn, aktuellId, reiseWeg.length, reiseWeg[0]]);
  if (leg.dataset.sig !== panelSig){
    leg.dataset.sig = panelSig;
    { const sb0 = $('kartesteckbrief'); if (sb0 && sb0.parentElement !== $('karterechts')) $('karterechts').appendChild(sb0); }
    leg.innerHTML = kartePanelHtml() + ladeHtml('legende', 'Legende', \`\${d.anzahl} Songs · \${d.gruppen.length} Stilgruppen\`, gruppenHtml) +
      ladeHtml('werk', 'Werk', aktuellId && song(aktuellId) ? song(aktuellId).titel : '', '<div id="kartesteckbriefhalter"></div>');
    const sb = $('kartesteckbrief'), halter = leg.querySelector('#kartesteckbriefhalter'); if (sb && halter){ halter.appendChild(sb); sb.hidden = false; }
    kartePanelDran(leg);
  }
  $('preise').classList.toggle('an', reise);
  karteTippWeg();
  $('kartefeld').onmouseleave = karteTippWeg;
  $('kartefuss').innerHTML = \`Klangraum: die geclusterten Suno-Tracks als Sterne. Jeder Stern stellt einen Track dar. Nähe von Punkten bedeutet ähnlicher Klang: Die Karte wurde per nicht-metrischer multidimensionaler Skalierung (NMDS, Kruskal-Stress \${String(d.stress ?? '?').replace('.', ',')}) aus den Klang-Embeddings des KI-Modells Discogs-EffNet (Essentia, MTG Barcelona) gerechnet, lokal. Die Gruppen wurden im vollen Klangraum gebildet — nicht auf der Karte, die wegen der Flachheit des Bildschirms nur eine fehlerbehaftete Projektion darstellt. Gruppennamen wurden aus den häufigsten Genres und Stimmungen (MTG-Jamendo) abgeleitet, Messwerte aus der eigenen Analyse. Erzeugt mit KlangTresor, Stand \${new Date(d.stand).toLocaleDateString('de-DE')}.\`;
  /* Ohne Maus auf der Karte: der zuletzt geoeffnete Song (es gibt hier
     keinen Player - der Klick fuehrt zu Suno). */
  const zeige = (id) => { const s = song(id), p = s && d.songs.find(x => x.id === id); if (s && p) { karteSteckbrief(s, p); $('kartesteckbrief').insertAdjacentHTML('beforeend', \`<a class="suno" href="\${s.link}" target="_blank" rel="noopener">Auf Suno anhören →</a>\`); } };
  const zuletzt = () => { if (aktuellId) zeige(aktuellId); };
  zuletzt();
  svg.onmouseleave = zuletzt;
  svg.querySelectorAll('.stern').forEach(c => {
    c.onclick = () => { if (Date.now() - ($('kartefeld').geschleppt || 0) < 150) return; const s = song(c.dataset.id); if (s) { const p = d.songs.find(x => x.id === s.id); if (p && p.xyz && karteDim === '3d' && schiffArt === 'direkt') karteNachVorn(karteRaum(p)); if (reise) { reiseBesucht.add(s.id); reiseWeg.push(s.id); } spielenNachId(s.id); } };
    c.onmouseenter = (ev) => {
      const s = song(c.dataset.id); if (!s) return;
      const p = d.songs.find(x => x.id === c.dataset.id) || {};
      karteSpot = { id: p.id, nachbarn: (p.nachbarn || []).slice(0, 6) };
      zeige(s.id);
      karteTipp(\`\${s.titel}<small>\${p.stil ? p.stil.replace('---', ' · ') : ''}\${p.stimmung ? ' — ' + p.stimmung : ''}</small>\`, ev, [karteFarbe(p.gruppe), koronaFarbe(p.gruppe)]);
    };
    c.onmousemove = (ev) => karteTipp(null, ev);
    c.onmouseleave = () => { karteTippWeg(); karteSpot = null; };
  });
}
karteDaten = DATEN;
/* Im Demo-Himmel ist die Flugreise immer an: ein Klick auf einen Stern
   beginnt sie, danach traegt die Spieldauer weiter (siehe sunoEinbetten).
   Das Reise-Knoepfchen ist hier ausgeblendet - der Zustand steht fest. */
if (EINBETTEN) sunoGroesse();
zeichnen();
window.addEventListener('resize', zeichnen);
</script>
</body></html>
`;

const ziel = ZIEL_OPT ? path.resolve(ZIEL_OPT)
                      : path.join(WURZEL, 'library', 'export', STICK ? 'sternenhimmel-stick.html' : RELATIV ? 'sternenhimmel-relativ.html' : 'sternenhimmel.html');
fs.mkdirSync(path.dirname(ziel), { recursive: true });
fs.writeFileSync(ziel, seite);

/* ------------------------------------------------------------------
   SELBSTPRUEFUNG: greift der Ausschnitt ins Leere?

   Der Export schneidet Funktionen aus der Seite heraus. Waechst dort eine
   neue Abhaengigkeit, kommt sie nicht von selbst mit - und der Export
   laeuft trotzdem sauber durch. Der Schaden zeigt sich erst beim
   Empfaenger, als ReferenceError beim ersten Zeichnen, und dort sieht ihn
   niemand, der ihn beheben koennte. Genau so war es am 25.08.2026: fuenf
   Funktionen und eine Variable fehlten, seit Kubus, Wurmloch und
   Anschlussplanung dazugekommen waren. Aufgefallen ist es nur, weil die
   Datei zufaellig einmal im Browser geoeffnet wurde.

   Geprueft wird, was die Seite auf OBERSTER Ebene deklariert - also ohne
   Einrueckung. Alles Eingerueckte ist lokal und gehoert einer Funktion;
   naehme man es mit, meldete die Pruefung jede Schleifenvariable.
   ------------------------------------------------------------------ */
{
  const ohneBeiwerk = (t) => t
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
    /* Vorlagen: der Text faellt weg, die ${...}-Ausdruecke bleiben - dort
       stehen Aufrufe wie ${esc(schiffName())}, die sonst unsichtbar waeren
       (09.09.2026, esc und diaFlaeche fehlten im Export, ohne dass die
       Pruefung anschlug). */
    .replace(/`(?:\\.|[^`\\])*`/g, (m) => (m.match(/\$\{[^}]*\}/g) || [])
      /* ... und von den Ausdruecken nur die Namen: eine Zeichenkette darin
         (${x ? 'an' : ''}) liesse sonst die Anfuehrungszeichen-Striche
         unten aus dem Tritt kommen - dann verschwand der halbe Export aus
         der Pruefung, und mit ihm 'function zeichnen'. */
      .map(x => (x.replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, ' ').match(/[A-Za-z_$][\w$]*/g) || []).join(' ')).join(' '))
    .replace(/"(?:\\.|[^"\\])*"/g, ' ')
    .replace(/'(?:\\.|[^'\\])*'/g, ' ');

  const global = new Set();
  for (const zeile of html.split('\n')) {
    if (/^\s/.test(zeile)) continue;                    /* eingerueckt = lokal */
    const m = zeile.match(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/)
           || zeile.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/);
    if (m) global.add(m[1]);
  }

  /* Die zwei Datenzeilen (DATEN, STAMM) kommen vor der Pruefung heraus:
     sie sind JSON, kein Code, und mit --musik stehen darin Megabytes Base64 -
     und Base64 enthaelt "//". Die Kommentarstreichung oben nahm das fuer
     einen Zeilenkommentar, kappte die Zeile mitten in einer Zeichenkette,
     und von da an war fuer die Pruefung der halbe Export eine Zeichenkette:
     "$, zeichnen" galten als unbekannt (09.09.2026, Stickfassung). */
  const skriptText = seite.slice(seite.indexOf('<script'), seite.lastIndexOf('</script>'))
    .replace(/^const DATEN = .*$/m, 'const DATEN = 0;').replace(/^const STAMM = .*$/m, 'const STAMM = 0;');
  const drin = ohneBeiwerk(skriptText);
  const erklaert = new Set();
  for (const r of [/\bfunction\s+([A-Za-z_$][\w$]*)/g,
                   /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g,
                   /[,(]\s*([A-Za-z_$][\w$]*)\s*=(?!=)/g,     /* zweiter Name einer Mehrfachdeklaration */
                   /\bcatch\s*\(\s*([A-Za-z_$][\w$]*)/g,
                   /\bfor\s*\(\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g])
    for (const x of drin.matchAll(r)) erklaert.add(x[1]);
  /* Und die Parameter: sie binden den Namen ebenso. Ohne sie meldete die
     Pruefung 'zeit', das in karteSchiff als zweiter Name einer
     const-Zeile steht und nirgends fehlt. */
  for (const x of drin.matchAll(/(?:function\s*[A-Za-z_$\w]*\s*|\b)\(([^()]{0,200}?)\)\s*(?:=>|\{)/g))
    for (const t of x[1].split(',')) {
      const nm = t.trim().replace(/[=:][\s\S]*$/, '').replace(/^\.\.\./, '');
      if (/^[A-Za-z_$][\w$]*$/.test(nm)) erklaert.add(nm);
    }

  const fehlt = [];
  for (const name of global) {
    if (erklaert.has(name)) continue;
    if (new RegExp('(?:^|[^\\w$.])' + name + '(?![\\w$])').test(drin)) fehlt.push(name);
  }
  /* Und die Gegenrichtung - Doppeldeklarationen. Dafuer braucht es keine
     Heuristik: der Parser weiss es genau. Eine eigene Zaehlung waere hier
     sogar falsch, denn dieselbe const in zwei Funktionsruempfen ist voellig
     erlaubt; nur auf derselben Ebene ist sie ein Fehler.

     Der Anlass: 'register' steckte im Export als dritter Name in
     "let aktuellId = null, karteGruppeAn = null, register = 'karte';" und
     fiel beim Nachtragen durch. Die Folge war ein SyntaxError, und der legt
     die GANZE Datei still - kein Himmel, kein Panel, eine Zeile Konsole. */
  {
    const os = require('node:os');
    const probe = path.join(os.tmpdir(), 'himmel-probe-' + process.pid + '.js');
    const skript = seite.slice(seite.indexOf('>', seite.indexOf('<script')) + 1,
                               seite.lastIndexOf('</script>'));
    fs.writeFileSync(probe, skript);
    const pruef = spawnSync(process.execPath, ['--check', probe], { encoding: 'utf8' });
    fs.unlinkSync(probe);
    if (pruef.status !== 0) {
      console.error('\n  ACHTUNG: die Exportdatei ist syntaktisch kaputt.');
      console.error('  ' + String(pruef.stderr || '').split('\n').filter(Boolean).slice(0, 4).join('\n  '));
      console.error('');
      process.exitCode = 1;
    }
  }
  if (fehlt.length) {
    console.error('\n  ACHTUNG: der Ausschnitt greift ins Leere.');
    console.error('  Diese Namen benutzt die Exportdatei, ohne sie zu kennen:');
    console.error('    ' + fehlt.sort().join(', '));
    console.error('  Entweder oben in die Liste aufnehmen oder einen Platzhalter setzen');
    console.error('  (wie bei anschlussPlanen, das ohne Server nichts holen kann).\n');
    process.exitCode = 1;
  }
}

const wie = STICK ? 'Titel, Ton aus ' + MUSIK + '/, Kacheln eingebettet' : RELATIV ? 'Titel, Bild und Ton relativ zu ' + RELATIV : 'öffentliche Titel';
console.log(`  Sternenhimmel exportiert: ${songs.length} ${wie} → ${ZIEL_OPT ? ziel : path.relative(WURZEL, ziel)} (${(fs.statSync(ziel).size / 1024).toFixed(0)} KB)`);
