#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   HERUNTERGELADENE AUDIODATEIEN INS ARCHIV ÜBERNEHMEN
   bin/uebernehmen.js

   Seit dem 03.09.2026 gibt Suno Audio nicht mehr über Links heraus
   (`audio_url` steht auf `…/api/forbidden`, auch für den Besitzer). Die
   Datei kommt nur noch über *Drei Punkte → Download → Unlock &
   Download*, und das kostet ein Download-Guthaben.

   DEN KLICK MACHT DER MENSCH. KlangTresor löst bei Suno nichts aus, was
   Geld kostet — dieselbe Arbeitsteilung wie beim Entfolgen
   (browser/03-folgen-pruefen.js: „Entfolgt wird nichts — das bleibt
   Handarbeit und ist gut so"). Caspar_D, 06.09.2026: „Bisher haben wir
   immer so agiert, dass KlangTresor nichts in Suno auslöst, was Credits
   oder Geld kostet."

   Dieses Skript macht alles DANACH: Es findet die Dateien im
   Download-Ordner, ordnet sie zu und legt sie an ihren Platz.

   -------------------------------------------------------------
   DIE ZUORDNUNG GEHT ÜBER DIE SIGNATUR, NICHT ÜBER DEN DATEINAMEN

   Suno schreibt in jede Datei einen Kommentar in den Kopf:

       made with suno; created=2026-09-06T22:44:…Z; id=89ef9f63-c885-…

   Dort steht die Clip-UUID, und die ist eindeutig. Der Dateiname
   dagegen ist der Titel — der kann Sonderzeichen tragen, doppelt
   vorkommen (zwei „Lakritz"), umbenannt werden oder beim zweiten
   Download ein „ (1)" bekommen. Deshalb zählt allein die Signatur.

   Wer keine hat, wird nicht übernommen: Eine Datei ohne
   Suno-Signatur ist entweder von woanders oder ein Mitschnitt, und
   beides gehört nicht ungeprüft ins Archiv.

   -------------------------------------------------------------
   Aufruf:
     node bin/uebernehmen.js               zeigt nur, was es täte
     node bin/uebernehmen.js --tun         kopiert wirklich
     node bin/uebernehmen.js --ordner <p>  zusätzlich dort suchen
     node bin/uebernehmen.js --ersetzen    vorhandene überschreiben
     node bin/uebernehmen.js --raeumen     übernommene Dateien danach
                                           in den Papierkorb legen

   Ohne --tun passiert nichts. Das ist Absicht: Ein Blick auf die
   Zuordnung, bevor kopiert wird, kostet zwei Sekunden.
   ============================================================= */
'use strict';
const fs   = require('node:fs');
const path = require('node:path');
const os   = require('node:os');

const WURZEL = path.join(__dirname, '..');
const SONGS  = path.join(WURZEL, 'library', 'songs');
const KONFIG = path.join(WURZEL, 'library', 'konfig.json');

/* Wo Sunos Downloads landen. Vorgabe ist ~/Downloads; wer sie woanders
   hinlegt, sagt es EINMAL mit --ordner, und es wird gemerkt. Kein
   Regler in der Oberflaeche: die Software kennt den Ort danach.
   (Caspar_D, 07.09.2026: "Die Ernte muss es finden oder nach dem Ordner
   fragen, wo die Downloads von Suno landen.") */
const konfigLesen  = () => { try { return JSON.parse(fs.readFileSync(KONFIG, 'utf8')); } catch (e) { return {}; } };
const konfigMerken = (o) => { try { fs.writeFileSync(KONFIG, JSON.stringify({ ...konfigLesen(), ...o }, null, 1)); } catch (e) {} };
const args   = process.argv.slice(2);
const TUN       = args.includes('--tun');
const ERSETZEN  = args.includes('--ersetzen');
const RAEUMEN   = args.includes('--raeumen');
const EXTRA     = args.includes('--ordner') ? args[args.indexOf('--ordner') + 1] : null;

/* Welche Endungen ins Archiv gehören. M4A bleibt draußen: Es ist bei
   Suno Opus im MP4-Container und damit weder Master noch das Format,
   auf dem die Analyse läuft — der Bestand führt mp3 und wav. */
const NEHMEN = { '.wav': 'audio.wav', '.mp3': 'audio.mp3' };
const KENNT  = ['.wav', '.mp3', '.m4a'];

/* Die Signatur steht im Kopf der Datei: bei WAV im INFO/ICMT-Block
   direkt hinter RIFF, bei MP3 im ID3-Kopf. 64 KB reichen für beides
   reichlich; die ganze Datei zu lesen wäre bei 66-MB-WAVs Verschwendung. */
function signatur(datei) {
  let fd;
  try {
    fd = fs.openSync(datei, 'r');
    const puffer = Buffer.alloc(64 * 1024);
    const gelesen = fs.readSync(fd, puffer, 0, puffer.length, 0);
    const kopf = puffer.slice(0, gelesen).toString('latin1');
    const m = kopf.match(/made with suno;[^\0]*?id=([0-9a-f-]{36})/i)
           || kopf.match(/id=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    return m ? m[1].toLowerCase() : null;
  } catch (e) { return null; }
  finally { if (fd !== undefined) try { fs.closeSync(fd); } catch (e) {} }
}

function suchen(ordner, tiefe = 2) {
  const gefunden = [];
  const gehe = (o, t) => {
    let eintraege;
    try { eintraege = fs.readdirSync(o, { withFileTypes: true }); } catch (e) { return; }
    for (const e of eintraege) {
      if (e.name.startsWith('.')) continue;              /* auch ._-Beifang auf exFAT */
      const p = path.join(o, e.name);
      if (e.isDirectory()) { if (t > 0) gehe(p, t - 1); continue; }
      if (KENNT.includes(path.extname(e.name).toLowerCase())) gefunden.push(p);
    }
  };
  gehe(ordner, tiefe);
  return gefunden;
}

const gross = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB';

/* Wenn Lieder ohne Datei dastehen und im Download-Ordner nichts liegt,
   ist die wahrscheinlichste Ursache: Suno legt woanders ab. Dann fragt
   das Skript danach - laut genug, dass es im Protokoll der Morgenroutine
   auffaellt, statt still nichts zu tun. */
function fragenWennEtwasFehlt(bekannt, orte) {
  const fehlen = [];
  for (const [id, so] of Object.entries(bekannt)) {
    if (so.fremd || so.imPapierkorb) continue;
    const d = path.join(SONGS, id);
    if (!fs.existsSync(path.join(d, 'audio.mp3')) || !fs.existsSync(path.join(d, 'audio.wav')))
      fehlen.push(so.titel || id.slice(0, 8));
  }
  if (!fehlen.length) return;
  console.log('');
  console.log(`  ${fehlen.length} Lied${fehlen.length === 1 ? '' : 'er'} ohne vollständige Audiodatei:`);
  for (const t of fehlen.slice(0, 6)) console.log(`     ${t}`);
  if (fehlen.length > 6) console.log(`     … und ${fehlen.length - 6} weitere`);
  console.log('');
  console.log('  Gesucht wurde in: ' + orte.join(', '));
  console.log('  Landen Sunos Downloads woanders? Dann EINMAL sagen, es wird gemerkt:');
  console.log('     node bin/uebernehmen.js --ordner /pfad/zum/ordner --tun');
  console.log('');
}

(function haupt() {
  let katalog = { songs: {} };
  try { katalog = require('./katalog.js').lesen() || katalog; } catch (e) {}
  const bekannt = katalog.songs || {};

  const konf = konfigLesen();
  const orte = [path.join(os.homedir(), 'Downloads')];
  if (konf.downloadOrdner && !orte.includes(konf.downloadOrdner)) orte.push(konf.downloadOrdner);
  if (EXTRA) {
    const p = path.resolve(EXTRA);
    if (!orte.includes(p)) orte.push(p);
    if (konf.downloadOrdner !== p) { konfigMerken({ downloadOrdner: p }); console.log(`  Ordner gemerkt: ${p}`); }
  }
  const dateien = [];
  for (const o of orte) dateien.push(...suchen(o));

  if (!dateien.length) {
    console.log(`  Keine Audiodateien in ${orte.join(', ')}.`);
    fragenWennEtwasFehlt(bekannt, orte);
    return;
  }

  const fertig = [], fremd = [], ohneSig = [], schonDa = [], falschesFormat = [];
  for (const d of dateien) {
    const endung = path.extname(d).toLowerCase();
    const id = signatur(d);
    if (!id) { ohneSig.push(d); continue; }
    if (!bekannt[id]) { fremd.push([d, id]); continue; }
    if (!NEHMEN[endung]) { falschesFormat.push([d, id]); continue; }
    const ziel = path.join(SONGS, id, NEHMEN[endung]);
    if (fs.existsSync(ziel) && !ERSETZEN) { schonDa.push([d, id]); continue; }
    fertig.push({ quelle: d, ziel, id, titel: bekannt[id].titel || id.slice(0, 8),
                  bytes: fs.statSync(d).size });
  }

  /* Erst zeigen, dann handeln. */
  if (fertig.length) {
    console.log(`\n  ${TUN ? 'Übernehme' : 'Zu übernehmen'} — ${fertig.length} Datei${fertig.length === 1 ? '' : 'en'}:\n`);
    for (const f of fertig)
      console.log(`    ${path.basename(f.ziel).padEnd(10)} ${gross(f.bytes).padStart(8)}   ${f.titel}`);
  }
  if (schonDa.length)  console.log(`\n  Schon im Archiv (${schonDa.length}) — mit --ersetzen überschreiben.`);
  if (falschesFormat.length) console.log(`  Übergangen, Format wird nicht geführt (${falschesFormat.length}): `
    + falschesFormat.map(([d]) => path.extname(d)).filter((v, i, a) => a.indexOf(v) === i).join(', '));
  if (fremd.length) {
    console.log(`\n  Nicht im Katalog (${fremd.length}) — erst die Ernte laufen lassen:`);
    for (const [d, id] of fremd.slice(0, 8)) console.log(`    ${id.slice(0, 8)}  ${path.basename(d)}`);
  }
  if (ohneSig.length) {
    console.log(`\n  Ohne Suno-Signatur, deshalb nicht angefasst (${ohneSig.length}):`);
    for (const d of ohneSig.slice(0, 8)) console.log(`    ${path.basename(d)}`);
  }

  if (!fertig.length) {
    console.log('\n  Nichts zu übernehmen.');
    fragenWennEtwasFehlt(bekannt, orte);
    return;
  }
  if (!TUN) {
    console.log(`\n  Trockenlauf. Mit --tun wirklich kopieren.\n`);
    return;
  }

  let kopiert = 0, bytes = 0;
  for (const f of fertig) {
    try {
      fs.mkdirSync(path.dirname(f.ziel), { recursive: true });
      fs.copyFileSync(f.quelle, f.ziel);
      /* Nachprüfen: gleiche Größe, gleiche Signatur. Auf exFAT ist ein
         halb geschriebener Kopiervorgang kein Hirngespinst. */
      const okGroesse = fs.statSync(f.ziel).size === f.bytes;
      const okSig     = signatur(f.ziel) === f.id;
      if (!okGroesse || !okSig) { console.log(`    FEHLER bei ${f.titel} — Kopie stimmt nicht, gelöscht.`); fs.unlinkSync(f.ziel); continue; }
      kopiert++; bytes += f.bytes;
      if (RAEUMEN) {
        const eimer = path.join(os.homedir(), '.Trash', path.basename(f.quelle));
        try { fs.renameSync(f.quelle, eimer); } catch (e) { /* anderes Dateisystem: liegen lassen */ }
      }
    } catch (e) { console.log(`    FEHLER bei ${f.titel}: ${e.message}`); }
  }
  console.log(`\n  ${kopiert} Datei${kopiert === 1 ? '' : 'en'} übernommen (${gross(bytes)}).`);
  if (RAEUMEN) console.log('  Die Originale liegen im Papierkorb.');
  console.log('  Danach sinnvoll: node bin/vorrechnen.js (Wellenform, Analyse).\n');
})();
