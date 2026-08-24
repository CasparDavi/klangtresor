#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Prüft die PowerShell-Skripte, bevor sie jemand bekommt.
 *
 * ---------------------------------------------------------------------
 * WARUM ES DIESES WERKZEUG GIBT
 *
 * Casto bekam am 23.08.2026 ein Einrichtungsskript über Discord und
 * meldete „1000 Fehlermeldungen". Die Datei war syntaktisch fehlerfrei —
 * aber in UTF-8 ohne Byte Order Mark geschrieben, und Windows
 * PowerShell 5.1 liest eine .ps1 ohne BOM als CP1252. Jedes
 * Mehrbyte-Zeichen zerfällt dabei in zwei; aus einem Gedankenstrich „—"
 * (E2 80 94) wird „â€”", und der Parser stolpert über jede Zeile, die
 * eines enthält.
 *
 * Ein `pwsh`-Syntaxcheck allein fängt das NICHT: PowerShell 7 liest
 * UTF-8 auch ohne BOM und meldet nichts. Der Fehler entsteht erst auf
 * dem Rechner des Empfängers, und dort sieht ihn niemand, der ihn
 * beheben könnte.
 *
 * Deshalb zwei Prüfungen nebeneinander:
 *
 *   SYNTAX      der echte PowerShell-Parser über die Datei.
 *   KODIERUNG   BOM da? Reines ASCII? Und die eigentliche Probe:
 *               die Datei einmal als CP1252 lesen und schauen, ob
 *               dabei etwas anderes herauskommt. Kommt etwas anderes
 *               heraus, sieht der Empfänger etwas anderes.
 *
 * Aufruf:  node bin/pruefe-skripte.js
 *          node bin/pruefe-skripte.js einrichten-windows.ps1
 */
'use strict';
const fs   = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const WURZEL = path.join(__dirname, '..');

/* Die CP1252-Tabelle für 0x80–0x9F. Alles andere deckt sich mit
   Latin-1, das JavaScript über den Zeichencode selbst trifft. */
const CP1252_HOCH = {
  0x80:'€', 0x82:'‚', 0x83:'ƒ', 0x84:'„', 0x85:'…',
  0x86:'†', 0x87:'‡', 0x88:'ˆ', 0x89:'‰', 0x8A:'Š',
  0x8B:'‹', 0x8C:'Œ', 0x8E:'Ž', 0x91:'‘', 0x92:'’',
  0x93:'“', 0x94:'”', 0x95:'•', 0x96:'–', 0x97:'—',
  0x98:'˜', 0x99:'™', 0x9A:'š', 0x9B:'›', 0x9C:'œ',
  0x9E:'ž', 0x9F:'Ÿ'
};

/** Liest den Puffer so, wie PowerShell 5.1 ihn ohne BOM lesen würde. */
function alsCp1252(puffer){
  let aus = '';
  for (const b of puffer){
    if (b >= 0x80 && b <= 0x9F) aus += (CP1252_HOCH[b] !== undefined ? CP1252_HOCH[b] : '�');
    else aus += String.fromCharCode(b);
  }
  return aus;
}

/** Der echte PowerShell-Parser. Fehlt pwsh, wird das gesagt statt geraten. */
function syntax(datei){
  const pwsh = ['pwsh', '/usr/local/bin/pwsh', '/opt/homebrew/bin/pwsh']
    .find(p => spawnSync(p, ['-NoProfile', '-Command', '$PSVersionTable.PSVersion.Major'],
                         { encoding: 'utf8' }).status === 0);
  if (!pwsh) return { moeglich: false };
  const skript =
    '$f = ' + JSON.stringify(datei) + '; $e = $null; ' +
    '[void][System.Management.Automation.Language.Parser]::ParseFile($f, [ref]$null, [ref]$e); ' +
    'if ($e) { $e | ForEach-Object { "$($_.Extent.StartLineNumber)|$($_.Message)" } }';
  const r = spawnSync(pwsh, ['-NoProfile', '-Command', skript], { encoding: 'utf8' });
  const zeilen = (r.stdout || '').trim().split('\n').filter(Boolean);
  return { moeglich: true, version: pwsh,
           fehler: zeilen.map(z => { const i = z.indexOf('|');
                                     return { zeile: z.slice(0, i), text: z.slice(i+1) }; }) };
}

function pruefe(datei){
  const roh = fs.readFileSync(datei);
  const hatBom = roh.length >= 3 && roh[0] === 0xEF && roh[1] === 0xBB && roh[2] === 0xBF;
  const rumpf  = hatBom ? roh.subarray(3) : roh;

  /* Nicht-ASCII-Bytes mit Zeilennummer. */
  const stellen = [];
  let zeile = 1;
  for (let i = 0; i < rumpf.length; i++){
    if (rumpf[i] === 0x0A){ zeile++; continue; }
    if (rumpf[i] > 0x7E){ if (stellen.length < 8) stellen.push(zeile); }
  }

  /* Die eigentliche Probe: sähe der Empfänger dasselbe? */
  const alsUtf8 = rumpf.toString('utf8');
  const alsAlt  = alsCp1252(rumpf);
  const gleich  = alsUtf8 === alsAlt;
  let ersteAbweichung = null;
  if (!gleich){
    const n = Math.min(alsUtf8.length, alsAlt.length);
    for (let i = 0; i < n; i++){
      if (alsUtf8[i] !== alsAlt[i]){
        ersteAbweichung = { zeile: alsUtf8.slice(0, i).split('\n').length,
                            hier: alsUtf8.slice(i, i + 14),
                            dort: alsAlt.slice(i, i + 14) };
        break;
      }
    }
  }
  return { datei, hatBom, nichtAscii: stellen, gleich, ersteAbweichung,
           bytes: roh.length, syn: syntax(datei) };
}

/* ---- .cmd und .bat: andere Regeln als .ps1 --------------------------
   Caspar_D, 24.08.2026: "achte bitte auch darauf, dass die codierung
   correct ist und windows nicht irgendwelche escape sequenzen aus den
   zeichen baut."

   Fuer Stapeldateien gilt fast das Gegenteil von PowerShell:

   BOM ist SCHAEDLICH. cmd.exe liest die drei Bytes als Zeichen und
   versucht, sie auszufuehren - die erste Zeile geht dann verloren, und
   bei "@echo off" heisst das: der ganze Ablauf wird mitgeschrieben.

   CRLF ist PFLICHT. Bei blossem LF haengt an jeder Zeile ein
   unsichtbares Zeichen; Pfade und Sprungmarken stimmen dann nicht mehr.

   PROZENTZEICHEN sind Variablen. Ein einzelnes % - auch in einem
   Kommentar - frisst cmd.exe oder verschluckt das folgende Zeichen.
   Wer eines schreiben will, schreibt %%.

   ZIRKUMFLEX ist das Fluchtzeichen. Am Zeilenende bindet es die
   naechste Zeile an; mitten im Text macht es das folgende Zeichen
   literal und verschwindet dabei selbst. */
function pruefeStapel(datei){
  const roh = fs.readFileSync(datei);
  const bom = roh[0] === 0xEF && roh[1] === 0xBB && roh[2] === 0xBF;
  const kern = bom ? roh.subarray(3) : roh;
  const text = kern.toString('latin1');

  const zeilen = text.split(/\r\n|\n/);
  const crlf = (text.match(/\r\n/g) || []).length;
  const lfAllein = (text.match(/(?<!\r)\n/g) || []).length;

  const nichtAscii = [];
  for (let i = 0; i < kern.length; i++) if (kern[i] > 127){
    const zeile = kern.subarray(0, i).toString('latin1').split('\n').length;
    if (!nichtAscii.includes(zeile)) nichtAscii.push(zeile);
  }

  /* Jedes % muss zu einer Variablen gehoeren: %NAME%, %~x0, %0..%9
     oder ein verdoppeltes %%. */
  const prozent = [];
  zeilen.forEach((z, i) => {
    const rest = z.replace(/%%|%~[a-zA-Z$:]*[0-9]|%[A-Za-z_][A-Za-z0-9_()#$'+,.?@\[\]`{}~-]*%|%[0-9*]/g, '');
    if (rest.includes('%')) prozent.push(i + 1);
  });
  /* ^ am Zeilenende ist gewollt (Fortsetzung), mittendrin selten. */
  const zirkum = [];
  zeilen.forEach((z, i) => { if (/\^(?!$)/.test(z)) zirkum.push(i + 1); });

  return { datei, bom, crlf, lfAllein, nichtAscii, prozent, zirkum, bytes: roh.length };
}

/* ---- Lauf ---------------------------------------------------------- */
const argv = process.argv.slice(2).filter(a => !a.startsWith('--'));
/* Die ._-Dateien sind kein Skript, sondern der Beifang, den macOS auf
   exFAT neben jede Datei legt. */
let dateien = argv.length ? argv
  : fs.readdirSync(WURZEL).filter(f => /\.(ps1|cmd|bat)$/i.test(f) && !f.startsWith('._')).sort();
if (!dateien.length){ console.log('\n  Kein Windows-Skript gefunden.\n'); process.exit(0); }

console.log('');
let schlecht = 0, wacklig = 0;
for (const d of dateien){
  const pfad = path.isAbsolute(d) ? d : path.join(WURZEL, d);
  if (!fs.existsSync(pfad)){ console.log(`  ✗ ${d}: gibt es nicht`); schlecht++; continue; }
  /* Stapeldateien haben eigene Regeln - eigene Pruefung. */
  if (/\.(cmd|bat)$/i.test(pfad)){
    const b = pruefeStapel(pfad);
    const kaputt = b.bom || b.lfAllein > 0 || b.prozent.length > 0;
    const wack   = !kaputt && (b.nichtAscii.length > 0 || b.zirkum.length > 0);
    console.log(`  ${kaputt ? '✗' : wack ? '~' : '✓'} ${path.basename(pfad)}   ${b.bytes} Bytes   (Stapeldatei)`);
    console.log(`      BOM:           ${b.bom ? 'JA — cmd.exe fuehrt die drei Bytes aus, die erste Zeile geht verloren' : 'nein (richtig so)'}`);
    console.log(`      Zeilenenden:   ${b.lfAllein ? b.lfAllein + '× einzelnes LF — cmd.exe braucht CRLF' : b.crlf + '× CRLF (richtig so)'}`);
    console.log(`      reines ASCII:  ${b.nichtAscii.length ? 'nein, ab Zeile ' + b.nichtAscii.slice(0,4).join(', ') : 'ja'}`);
    console.log(`      Prozentzeichen:${b.prozent.length ? ' EINZELNES % in Zeile ' + b.prozent.join(', ') + ' — cmd.exe frisst es; %% schreiben' : ' alle gehoeren zu Variablen'}`);
    console.log(`      Zirkumflex:    ${b.zirkum.length ? 'mitten im Text, Zeile ' + b.zirkum.join(', ') + ' — macht das naechste Zeichen literal' : 'keiner ausser am Zeilenende'}`);
    if (kaputt){ schlecht++; console.log('      → laeuft unter Windows nicht wie gedacht.'); }
    else if (wack){ wacklig++; console.log('      → laeuft, aber Sonderzeichen sind hier unnoetiges Risiko.'); }
    console.log('');
    continue;
  }

  const e = pruefe(pfad);
  const synOk = !e.syn.moeglich || !e.syn.fehler.length;
  /* Drei Stufen, nicht zwei: Ohne BOM UND mit Mehrbyte-Zeichen kommt
     die Datei nachweislich falsch an. Mit BOM liest PowerShell 5.1
     richtig - aber ein BOM überlebt nicht jeden Weg durch ein
     Chat-Programm, und dann ist derselbe Schaden da. Reines ASCII
     braucht kein BOM und hält jeden Weg aus. */
  const kaputt      = !synOk || (!e.hatBom && !e.gleich);
  const zerbrechlich = !kaputt && !e.gleich;
  const heil = !kaputt && !zerbrechlich;
  console.log(`  ${heil ? '✓' : kaputt ? '✗' : '~'} ${path.basename(e.datei)}   ${e.bytes} Bytes`);

  console.log(`      Syntax:        ${!e.syn.moeglich ? 'nicht geprüft — pwsh fehlt'
    : e.syn.fehler.length ? e.syn.fehler.length + ' Fehler' : 'fehlerfrei'}`);
  for (const f of (e.syn.fehler || []).slice(0, 4))
    console.log(`          Zeile ${f.zeile}: ${f.text.slice(0, 78)}`);

  console.log(`      BOM:           ${e.hatBom ? 'ja'
    : 'FEHLT — PowerShell 5.1 liest die Datei dann als CP1252'}`);
  console.log(`      reines ASCII:  ${e.nichtAscii.length
    ? 'nein, ab Zeile ' + e.nichtAscii.join(', ') : 'ja'}`);
  console.log(`      CP1252-Probe:  ${e.gleich ? 'unauffällig — der Empfänger sieht dasselbe'
    : 'ANDERS ab Zeile ' + e.ersteAbweichung.zeile}`);
  if (e.ersteAbweichung){
    console.log(`          hier steht:  ${JSON.stringify(e.ersteAbweichung.hier)}`);
    console.log(`          dort steht:  ${JSON.stringify(e.ersteAbweichung.dort)}`);
  }
  if (kaputt){ schlecht++;
    console.log('      → kommt beim Empfänger ANDERS an.'); }
  else if (zerbrechlich){ wacklig++;
    console.log('      → kommt an, solange das BOM den Weg übersteht.'
              + ' Über Chat-Programme ist das nicht sicher.'); }
  console.log('');
}
if (schlecht || wacklig){
  if (schlecht) console.log(`  ${schlecht} Skript(e) kommen beim Empfänger anders an.`);
  if (wacklig)  console.log(`  ${wacklig} Skript(e) hängen am BOM — reines ASCII wäre sicherer.`);
  console.log('  Abhilfe: nur ASCII schreiben (— wird zu -, „" zu ") und ein BOM voranstellen.\n');
  process.exit(schlecht ? 1 : 0);
}
console.log(`  Alle ${dateien.length} Windows-Skripte kommen so an, wie sie hier stehen.\n`);
