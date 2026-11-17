#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   DER USB-WÄCHTER - ANSTECKEN BEOBACHTEN, OHNE MITZUHÄNGEN
   labor/usb-waechter.js   (Werkstatt, nicht Betrieb - liegt nicht im Paket)

   WOFÜR. Am 16.11.2026 stand der Mac neun Stunden: ein Intenso-USB-Laufwerk
   wurde nie gemountet, macOS hing im Leseversuch, und weil exFAT und NTFS über
   EINEN Dienst im Benutzerraum laufen (fskit / UVFSXPCService), hing damit auch
   /Volumes/Extreme_SSD - die SSD, auf der der KlangTresor liegt. Der Server
   stand im Zustand U+, 0 % CPU, keine Antwort auf 8788. Als Jörg das Laufwerk
   herauszog, lief er im selben Moment weiter.

   Dieser Wächter macht aus neun Stunden ein paar Sekunden: er sagt, dass es
   passiert, welches Gerät dazukam, und was zu tun ist (abziehen - nicht killen,
   nicht neu starten; ein Prozess in U stirbt auch durch kill -9 nicht).

   WAS ER NICHT TUT: er verhindert nichts. Hängt fskit, hängt die SSD, und daran
   kann von hier aus niemand etwas ändern. Er ist das Frühwarnsystem, nicht die
   Sicherung.

   DIE REGEL, DIE IHN SELBST HEIL HÄLT: er fasst /Volumes NIE an. Kein ls, kein
   stat, kein df, kein mount - genau daran hängt sich jeder fest, der nachsieht.
   Gefragt werden nur Quellen, die das Dateisystem nicht berühren:

     ps -eo pid,stat,command     Prozesse im Zustand U (die Signatur)
     ioreg -p IOUSB              angesteckte USB-Geräte (7 ms, reines IOKit)
     ioreg -c IOMedia            Datenträger, auch nicht gemountete
     GET localhost:8788          lebt der KlangTresor noch (nur ein Socket)

   Und jede Frage läuft als eigenes Kind mit Zeitgrenze. Kommt eines nicht
   zurück, ist DAS schon der Alarm - der Wächter wartet nicht mit.

   Am 16.11.2026 war der Fehler bei der Suche: nachgesehen wurde in mount, df
   und mit Lesetests. Ein Gerät, das beim Einbinden hängt, steht in keiner
   dieser Listen - es ist unsichtbar, obwohl es die Ursache ist.

   Aufruf:
     node labor/usb-waechter.js              beobachten, Strg-C beendet
     node labor/usb-waechter.js --einmal     einmal nachsehen und sagen, wie es steht
   ============================================================= */
'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const EINMAL = process.argv.includes('--einmal');
const TAKT = 2000;
const PROTOKOLL = process.argv.includes('--still') ? null
  : path.join(require('node:os').tmpdir(), 'usb-waechter-' + new Date().toISOString().slice(0, 10) + '.log');

/* ---------------------------------------------------------------- Ausgabe */
const uhr = () => new Date().toLocaleTimeString('de-DE', { hour12: false });
function sag(text, laut = false) {
  const zeile = '  ' + uhr() + '  ' + text;
  console.log((laut ? '\x07' : '') + zeile);
  if (PROTOKOLL) { try { fs.appendFileSync(PROTOKOLL, zeile + '\n'); } catch (e) {} }
}
function block(zeilen) {
  console.log('\x07');
  console.log('  ' + '═'.repeat(68));
  for (const z of zeilen) console.log('  ' + z);
  console.log('  ' + '═'.repeat(68) + '\n');
  if (PROTOKOLL) { try { fs.appendFileSync(PROTOKOLL, zeilen.map((z) => '  ' + uhr() + '  ' + z).join('\n') + '\n'); } catch (e) {} }
}

/* ---------------------------------------------------------------- Fragen stellen
   Jede als eigenes Kind, mit Zeitgrenze. Antwortet es nicht, gilt das als
   { haengt: true } - und das ist selbst ein Befund, kein Fehler des Wächters. */
function frage(befehl, args, ms = 4000) {
  return new Promise((fertig) => {
    let aus = '', erledigt = false;
    let k;
    const schluss = (ergebnis) => { if (erledigt) return; erledigt = true; clearTimeout(uhrwerk); fertig(ergebnis); };
    const uhrwerk = setTimeout(() => {
      try { k.kill('SIGKILL'); } catch (e) {}
      schluss({ haengt: true, text: '' });
    }, ms);
    try { k = spawn(befehl, args, { stdio: ['ignore', 'pipe', 'ignore'] }); }
    catch (e) { return schluss({ haengt: false, text: '', fehler: e.message }); }
    k.stdout.setEncoding('utf8');
    k.stdout.on('data', (d) => { aus += d; });
    k.on('error', (e) => schluss({ haengt: false, text: '', fehler: e.message }));
    k.on('close', () => schluss({ haengt: false, text: aus }));
  });
}

/* WER IN U STEHT, IST NICHT GLEICH DIE URSACHE (berichtigt am 17.11.2026, beim
   ersten Lauf). Hier stand: ein Prozess in U = Alarm. Beim ersten Blick war das
   `backupd`, also Time Machine - und genau die stand schon am 16.11.2026 als
   Mitgefangene im Protokoll und hat damals auf die falsche Spur geführt. Ein
   Wächter, der sofort schreit, wird beim echten Fall überhört.

   Darum zwei Klassen:
     KRITISCH     der fskit-Dienst (UVFSXPCService, UserFS), mount/fsck,
                  diskarbitrationd - und der KlangTresor-Server selbst
     BEGLEITER    alles andere (Time Machine, SystemUIServer, Finder …).
                  Sie werden genannt, aber leise.
   Alarm gibt es nur für Kritische - oder wenn der Server nicht mehr antwortet,
   während überhaupt etwas in U steht. */
const KRITISCH = /UVFSXPCService|UserFS|fskitd|\bfskit|mount_|\bfsck|diskarbitrationd|server\/server\.js/i;

/* Prozesse im Zustand U. Der eigene Wächter und seine Kinder können nicht
   darunter sein (sie fassen kein Dateisystem an). */
async function wartende() {
  const r = await frage('ps', ['-eo', 'pid,stat,command'], 4000);
  if (r.haengt) return { haengt: true, liste: [] };
  const liste = [];
  for (const z of r.text.split('\n').slice(1)) {
    const m = /^\s*(\d+)\s+(\S+)\s+(.*)$/.exec(z);
    if (!m || !m[2].startsWith('U')) continue;
    liste.push({ pid: +m[1], stat: m[2], befehl: m[3].slice(0, 76), kritisch: KRITISCH.test(m[3]) });
  }
  return { haengt: false, liste, kritische: liste.filter((x) => x.kritisch) };
}
/* Angesteckte USB-Geräte, nur die Namen. */
async function usbGeraete() {
  const r = await frage('ioreg', ['-p', 'IOUSB', '-w0'], 4000);
  if (r.haengt) return { haengt: true, namen: [] };
  const namen = [];
  for (const z of r.text.split('\n')) {
    const m = /\+-o\s+(.+?)@[0-9a-f]+\s+</.exec(z);
    if (m && m[1] !== 'Root') namen.push(m[1].trim());
  }
  return { haengt: false, namen };
}
/* Datenträger - auch solche, die NICHT gemountet sind. Hier taucht ein
   hängendes Laufwerk auf, während mount und df es nicht kennen. */
async function datentraeger() {
  const r = await frage('ioreg', ['-c', 'IOMedia', '-r', '-w0'], 4000);
  if (r.haengt) return { haengt: true, namen: [] };
  const namen = [];
  for (const z of r.text.split('\n')) {
    const m = /\+-o\s+(.+?)\s+<class IOMedia/.exec(z);
    if (m) namen.push(m[1].replace(/@\w+$/, '').trim());
  }
  return { haengt: false, namen: [...new Set(namen)] };
}
/* Lebt der KlangTresor? Nur ein Socket, kein Dateisystem. */
function server() {
  return new Promise((fertig) => {
    const r = http.get('http://localhost:8788/', { timeout: 2000 }, (a) => { a.resume(); fertig(a.statusCode === 200 ? 'antwortet' : 'HTTP ' + a.statusCode); });
    r.on('timeout', () => { r.destroy(); fertig('ANTWORTET NICHT (Zeitgrenze)'); });
    r.on('error', (e) => fertig(e.code === 'ECONNREFUSED' ? 'läuft nicht' : 'Fehler: ' + e.code));
  });
}

/* ---------------------------------------------------------------- Lauf */
const fehlt = (a, b) => a.filter((x) => !b.includes(x));
let vorherUSB = null, vorherTraeger = null, warU = false, warServer = null;
let vorherU = 0, vorherBegleiter = 0;

async function nachsehen(erster) {
  const [p, u, t, s] = await Promise.all([wartende(), usbGeraete(), datentraeger(), server()]);

  if (p.haengt || u.haengt || t.haengt) {
    block(['DIE AUSKUNFT SELBST KOMMT NICHT ZURÜCK.',
           'Das ist schon der Befund: etwas klemmt so tief, dass sogar ps oder',
           'ioreg stehenbleiben.',
           '',
           '→ Das USB-Laufwerk ABZIEHEN. Nicht killen, nicht neu starten.']);
    return;
  }

  if (erster) {
    sag('Wächter läuft. Er fasst /Volumes nicht an — daran hängt sich jeder fest, der nachsieht.');
    sag('USB angesteckt:  ' + (u.namen.length ? u.namen.join(', ') : '—'));
    sag('Datenträger:     ' + (t.namen.length ? t.namen.join(', ') : '—'));
    sag('KlangTresor:     ' + s);
    sag('Prozesse in U:   ' + (!p.liste.length ? 'keine (gesund)'
      : p.kritische.length ? p.kritische.length + ' KRITISCH — siehe unten'
      : p.liste.length + ' (nur Begleiter: ' + p.liste.map((x) => x.befehl.split('/').pop().split(' ')[0]).join(', ') + ') — das ist normal'));
    if (PROTOKOLL) sag('Protokoll:       ' + PROTOKOLL);
    console.log('');
  } else {
    for (const n of fehlt(u.namen, vorherUSB)) sag('USB ANGESTECKT:  ' + n, true);
    for (const n of fehlt(vorherUSB, u.namen)) sag('USB abgezogen:   ' + n);
    for (const n of fehlt(t.namen, vorherTraeger)) sag('Datenträger da:  ' + n, true);
    for (const n of fehlt(vorherTraeger, t.namen)) sag('Datenträger weg: ' + n);
    if (s !== warServer) sag('KlangTresor:     ' + s, s !== 'antwortet' && s !== 'läuft nicht');
  }

  /* Alarm nur fuer Kritische; Begleiter werden leise genannt, wenn sie sich aendern. */
  if (!erster && p.liste.length !== vorherU) {
    const b = p.liste.filter((x) => !x.kritisch);
    if (b.length !== vorherBegleiter) sag('in U (Begleiter, keine Ursache): ' + (b.length ? b.map((x) => x.befehl.split('/').pop().split(' ')[0]).join(', ') : 'keine'));
  }
  const istU = p.kritische.length > 0;
  if (istU && !warU) {
    const fskit = p.kritische.filter((x) => /UVFSXPCService|fskit|UserFS/i.test(x.befehl));
    block([
      'ES KLEMMT. ' + p.kritische.length + ' kritische(r) Prozess(e) im Zustand U'
        + (p.liste.length > p.kritische.length ? ', dazu ' + (p.liste.length - p.kritische.length) + ' Begleiter' : '') + '.',
      '',
      ...p.kritische.slice(0, 8).map((x) => '  ' + String(x.pid).padStart(6) + '  ' + x.stat.padEnd(5) + x.befehl),
      ...(p.kritische.length > 8 ? ['  … und ' + (p.kritische.length - 8) + ' weitere'] : []),
      '',
      fskit.length
        ? 'UVFSXPCService ist dabei → genau der Fall vom 16.11.2026: ein Gerät hängt'
        : 'UVFSXPCService ist NICHT dabei → vielleicht etwas anderes; trotzdem erst das',
      fskit.length
        ? 'im fskit-Dienst, und damit hängen ALLE exFAT/NTFS-Volumes — auch die SSD.'
        : 'Laufwerk abziehen, das ist der billigste Versuch.',
      '',
      '→ DAS USB-LAUFWERK ABZIEHEN. Sofort.',
      '   Nicht kill -9 (ein Prozess in U stirbt daran nicht), nicht neu starten.',
      '   Sobald das Gerät weg ist, laufen alle von selbst weiter.',
    ]);
  } else if (!istU && warU) {
    sag('Wieder frei — kein kritischer Prozess mehr in U.', true);
  } else if (!istU && s !== 'antwortet' && s !== 'läuft nicht' && p.liste.length) {
    sag('Der Server antwortet nicht, und ' + p.liste.length + ' Prozess(e) stehen in U — nachsehen lohnt.', true);
  }

  vorherUSB = u.namen; vorherTraeger = t.namen; warU = istU; warServer = s;
  vorherU = p.liste.length; vorherBegleiter = p.liste.filter((x) => !x.kritisch).length;
}

/* ---------------------------------------------------------------- Prüffall
   Ein Wächter, der nicht mehr bei jedem U schreit, muss belegen, dass er beim
   echten Fall noch schreit. Geprüft wird die Stelle, die darüber entscheidet:
   KRITISCH gegen echte Befehlszeilen - die vom 16.11.2026 und die Begleiter,
   die damals in die Irre führten. */
if (process.argv.includes('--prueffall')) {
  const faelle = [
    ['/System/Library/Frameworks/FSKit.framework/Versions/A/XPCServices/UVFSXPCService.xpc/Contents/MacOS/UVFSXPCService', true,  'der Fall vom 16.11.2026'],
    ['/usr/libexec/fskitd',                                             true,  'der fskit-Dienst selbst'],
    ['/sbin/mount_exfat /dev/disk4s1 /Volumes/INTENSO',                  true,  'ein hängender Einbindeversuch'],
    ['/usr/sbin/diskarbitrationd',                                      true,  'der Einbinde-Dienst'],
    ['node server/server.js',                                           true,  'der KlangTresor selbst'],
    ['/System/Library/CoreServices/TimeMachine/backupd',                false, 'Time Machine — Mitgefangene, keine Ursache'],
    ['/System/Library/CoreServices/SystemUIServer.app/Contents/MacOS/SystemUIServer', false, 'Mitgefangener'],
    ['/System/Library/CoreServices/Finder.app/Contents/MacOS/Finder',   false, 'Mitgefangener'],
    ['node labor/usb-waechter.js',                                      false, 'der Wächter selbst'],
  ];
  let schlecht = 0;
  console.log('');
  for (const [zeile, soll, warum] of faelle) {
    const ist = KRITISCH.test(zeile);
    if (ist !== soll) schlecht++;
    console.log('  ' + (ist === soll ? '✓' : '✗') + ' ' + (ist ? 'ALARM ' : 'leise ') + ' '
      + zeile.split('/').pop().slice(0, 30).padEnd(32) + warum);
  }
  console.log('');
  console.log(schlecht ? '  ' + schlecht + ' Fall/Fälle falsch eingeordnet — NICHT BESTANDEN.\n'
                       : '  Alle ' + faelle.length + ' Fälle richtig eingeordnet — bestanden.\n');
  process.exit(schlecht ? 1 : 0);
}

(async () => {
  await nachsehen(true);
  if (EINMAL) return;
  const schlag = setInterval(() => { nachsehen(false).catch((e) => sag('Wächter-Fehler: ' + e.message)); }, TAKT);
  process.on('SIGINT', () => {
    clearInterval(schlag);
    console.log('\n  Wächter beendet.' + (PROTOKOLL ? ' Protokoll: ' + PROTOKOLL : '') + '\n');
    process.exit(0);
  });
})();
