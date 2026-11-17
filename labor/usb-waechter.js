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
     ioreg -p IOUSB -l           USB-Geräte mit Seriennummer und Anschluss
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
  /* MIT ELTERN-PID (17.11.2026): in der Liste standen `(ioreg)` und `(ps)` - die
     eigenen Pruefkinder des Waechters, waehrend sie das IOKit lasen. Ein Waechter
     darf sich nicht selbst melden; das ist Rauschen an genau der Stelle, an der
     der echte Fall auffallen muss. Kinder des eigenen Prozesses fallen heraus. */
  const r = await frage('ps', ['-eo', 'pid,ppid,stat,command'], 4000);
  if (r.haengt) return { haengt: true, liste: [] };
  const liste = [];
  for (const z of r.text.split('\n').slice(1)) {
    const m = /^\s*(\d+)\s+(\d+)\s+(\S+)\s+(.*)$/.exec(z);
    if (!m || !m[3].startsWith('U')) continue;
    if (+m[1] === process.pid || +m[2] === process.pid) continue;
    liste.push({ pid: +m[1], stat: m[3], befehl: m[4].slice(0, 76), kritisch: KRITISCH.test(m[4]) });
  }
  return { haengt: false, liste, kritische: liste.filter((x) => x.kritisch) };
}
/* Angesteckte USB-Geraete - mit Seriennummer UND Anschlussort.

   WARUM NICHT NUR DER NAME (17.11.2026): hier stand nur der Produktname. Im
   Hub von Joerg steckt dauerhaft ein "Intenso Speed Line" (der Stick
   "reconstruct", exFAT, mit einer PyRECONSTRUCT-Umgebung drauf) - und das
   verdaechtige Laufwerk vom 16.11.2026 heisst GENAUSO. Zwei Geraete, eine
   Zeile: nicht auseinanderzuhalten. Die Seriennummer unterscheidet sie, der
   Anschlussort sagt, wo es steckt.

   DEN ORT LIEST DER BAUM, NICHT EIN FELD: `ioreg -p IOUSB` rueckt jede Ebene um
   zwei Zeichen ein. Die oberste Ebene ist der Controller des Mac (XHC1, XHC2,
   AppleUSBVHCIBCE), darunter haengen Hubs und Geraete. Steht zwischen
   Controller und Geraet ein Hub, haengt es am Hub - sonst direkt an einer Buchse
   des Mac. Das `-l` holt dazu die Eigenschaften, die Seriennummer darunter.

   DER ORT SCHUETZT NICHT: der fskit-Dienst sitzt im System, nicht im Kabel. Ein
   Geraet am Hub legt denselben Dienst lahm wie eines an der Buchse. Der Ort ist
   zum Wiederfinden da, nicht zur Beruhigung. */
function ortAus(stapel) {
  const steuer = String(stapel[1] || '?').replace(/@.*$/, '');
  const zwischen = stapel.slice(2, -1).filter(Boolean);
  const hubs = zwischen.filter((x) => /hub/i.test(x)).length;
  return hubs ? `am Hub (${steuer}, ${hubs} Stufe${hubs > 1 ? 'n' : ''})` : `direkt am Mac (${steuer})`;
}
/* Was in der Zeile steht. Die Seriennummer gekuerzt - die letzten acht Zeichen
   reichen zum Unterscheiden und machen die Zeile nicht unlesbar. */
const kennung = (g) => g.name + (g.seriennr ? ' (' + g.seriennr.slice(-8) + ')' : '');
const zeileVon = (g) => kennung(g) + ' — ' + g.ort;

async function usbGeraete() {
  const r = await frage('ioreg', ['-p', 'IOUSB', '-l', '-w0'], 6000);
  if (r.haengt) return { haengt: true, liste: [], zeilen: [] };
  const liste = [], stapel = [];
  let jetzt = null;
  for (const z of r.text.split('\n')) {
    const k = z.indexOf('+-o ');
    if (k >= 0) {
      const m = /\+-o\s+(.+?)(?:@[0-9a-fA-F]+)?\s+<class\s+([^,]+),/.exec(z);
      if (!m) { jetzt = null; continue; }
      const tiefe = Math.floor(k / 2);
      stapel.length = tiefe;
      stapel[tiefe] = m[1].trim();
      jetzt = null;
      if (m[2].trim() === 'IOUSBHostDevice') {
        jetzt = { name: m[1].trim(), seriennr: '', ort: ortAus(stapel) };
        liste.push(jetzt);
      }
      continue;
    }
    if (jetzt && !jetzt.seriennr) {
      const s = /"USB Serial Number"\s*=\s*"(.*)"/.exec(z);
      if (s) jetzt.seriennr = s[1].trim();
    }
  }
  return { haengt: false, liste, zeilen: liste.map(zeileVon) };
}
/* Datenträger - auch solche, die NICHT gemountet sind. Hier taucht ein
   hängendes Laufwerk auf, während mount und df es nicht kennen. */
async function datentraeger() {
  const r = await frage('ioreg', ['-c', 'IOMedia', '-r', '-w0'], 4000);
  if (r.haengt) return { haengt: true, namen: [] };
  const namen = [];
  for (const z of r.text.split('\n')) {
    /* Das Komma ist Absicht: `<class IOMedia,` ist der Datentraeger, `<class
       IOMediaBSDClient,` nur sein Zugriffsobjekt - ohne das Komma stand es als
       eigener "Datentraeger" in der Liste (17.11.2026 gesehen). */
    const m = /\+-o\s+(.+?)\s+<class IOMedia,/.exec(z);
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
let letzterBegleiterSatz = null, begleiterTakte = 0, gemeldeteBegleiter = null;

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
    sag('USB angesteckt:  ' + u.zeilen.length + ' Gerät(e)');
    for (const z of u.zeilen) sag('                 ' + z);
    sag('Datenträger:     ' + (t.namen.length ? t.namen.join(', ') : '—'));
    sag('KlangTresor:     ' + s);
    sag('Prozesse in U:   ' + (!p.liste.length ? 'keine (gesund)'
      : p.kritische.length ? p.kritische.length + ' KRITISCH — siehe unten'
      : p.liste.length + ' (nur Begleiter: ' + p.liste.map((x) => x.befehl.split('/').pop().split(' ')[0]).join(', ') + ') — das ist normal'));
    if (PROTOKOLL) sag('Protokoll:       ' + PROTOKOLL);
    console.log('');
  } else {
    for (const n of fehlt(u.zeilen, vorherUSB)) sag('USB ANGESTECKT:  ' + n, true);
    for (const n of fehlt(vorherUSB, u.zeilen)) sag('USB abgezogen:   ' + n);
    for (const n of fehlt(t.namen, vorherTraeger)) sag('Datenträger da:  ' + n, true);
    for (const n of fehlt(vorherTraeger, t.namen)) sag('Datenträger weg: ' + n);
    if (s !== warServer) sag('KlangTresor:     ' + s, s !== 'antwortet' && s !== 'läuft nicht');
  }

  /* Alarm nur fuer Kritische. Begleiter werden leise genannt - aber ERST, WENN SIE
     STEHENBLEIBEN (17.11.2026): launchd und backupd blinken im Normalbetrieb
     dauernd kurz in U, und der Waechter schrieb darueber alle zwei Sekunden eine
     Zeile. Beim echten Fall waere der Alarm darin untergegangen. Gemeldet wird
     nur, was DREI Takte (sechs Sekunden) unveraendert steht - dann ist es kein
     Blinken mehr. */
  if (!erster) {
    const b = p.liste.filter((x) => !x.kritisch).map((x) => x.befehl.split('/').pop().split(' ')[0]).sort().join(', ');
    if (b === letzterBegleiterSatz) begleiterTakte++;
    else { letzterBegleiterSatz = b; begleiterTakte = 1; }
    if (begleiterTakte === 3 && b !== gemeldeteBegleiter) {
      gemeldeteBegleiter = b;
      sag('in U, seit 6 s unveraendert (Begleiter, keine Ursache): ' + (b || 'keine'));
    }
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

  vorherUSB = u.zeilen; vorherTraeger = t.namen; warU = istU; warServer = s;
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
