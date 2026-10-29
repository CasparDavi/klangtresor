#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   WAS DER INSTALLER NICHT MITBRINGEN DARF, HOLT ER HIERMIT
   bin/installieren.js

   Caspar_D, 29.10.2026: „ich rufe eine setup.exe auf und der Rest passiert von alleine" - und: „das
   Scriptgefrickel kann keiner, ich verliere alle Nutzer schon bevor sie angefangen haben".

   Programm, Node, ffmpeg und Pakete liegen im Installer. Die KI-Modelle und Whisper duerfen es nicht: mehrere
   Lizenzen verbieten die Weitergabe oder nennen gar keine (bin/modelle-holen.js, Kopf). Jeder holt sie darum selbst
   an der Quelle - der Installer tut das fuer ihn, in seinem eigenen Fenster, mit Balken.

   Geholt wird nicht hier, sondern von denselben Programmen, die auch der Tab „System" im Profil benutzt
   (bin/modelle-holen.js, bin/whisper-holen.js) - eine Liste, ein Weg. Diese Datei fasst nur ihre Meldezeilen
   (bin/melden.js) zu EINEM Balken ueber alles zusammen und schreibt ihn dorthin, wo der Installer ihn liest.

     node bin/installieren.js                    auf der Konsole (zum Pruefen)
     node bin/installieren.js --stand <datei>    fuer den Installer: der Stand als Textdatei (UTF-16LE ohne BOM,
                                                 so liest NSIS sie mit FileReadUTF16LE), alle halbe Sekunde neu:
                                                   Zeile 1  Promille 0..1000
                                                   Zeile 2  was gerade laeuft
                                                   Zeile 3  wie weit, woher, wie lange noch
                                                   Zeile 4  laeuft | fertig | fehler | halt
                                                   Zeile 5  Schlusssatz (bei fertig und fehler)
                                                 Liegt <datei>.halt daneben, wird abgebrochen. Was halb geholt
                                                 ist, macht der naechste Lauf an derselben Stelle weiter.

   Gemeinsam fuer alle drei Installer (Windows-Setup.exe, macOS-App, Linux-AppImage): der Plan dazu steht in
   docs/INSTALLER.md.
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { T } = require('./sprache.js');

const WURZEL = path.join(__dirname, '..');
const i = process.argv.indexOf('--stand');
const STAND = i >= 0 ? process.argv[i + 1] : null;
const HALT = STAND ? STAND + '.halt' : null;

/* Was schon daliegt, zaehlt nicht zum Balken - sonst stuende er bei einem Update gleich auf 90 % und kroeche. */
const modelle = require('./modelle-holen.js');
const groesse = (f) => { try { return fs.statSync(f).size; } catch (e) { return 0; } };
const modellFehlt = modelle.DATEIEN.filter(([n, , m]) => groesse(path.join(modelle.ZIEL, n)) < m);
const modellBytes = modellFehlt.reduce((s, [, , m]) => s + m, 0);
const whisper = require('./whisper-holen.js');
const WHISPER_MODELL = 3095033483, WHISPER_PROGRAMM = 8000000;   /* ggml-large-v3.bin; das Windows-Paket ~8 MB */
const whisperBytes = (whisper.modellDa() ? 0 : WHISPER_MODELL) + (whisper.programmDa() ? 0 : WHISPER_PROGRAMM);
const GESAMT = modellBytes + whisperBytes;

const mb = (n) => n >= 1073741824 ? (n / 1073741824).toFixed(1).replace('.', ',') + ' GB' : Math.round(n / 1048576) + ' MB';
const dauer = (s) => s >= 5400 ? T('noch etwa {n} Std.', { n: Math.round(s / 3600) }) : s >= 90 ? T('noch etwa {n} Min.', { n: Math.round(s / 60) }) : T('noch knapp eine Minute');

let stand = { promille: 0, oben: T('Es geht los …'), unten: '', zustand: 'laeuft', schluss: '' };
const START = Date.now();

function schreiben() {
  if (!STAND) return;
  const text = [stand.promille, stand.oben, stand.unten, stand.zustand, stand.schluss].join('\r\n') + '\r\n';
  try { fs.writeFileSync(STAND + '.neu', text, 'utf16le'); fs.renameSync(STAND + '.neu', STAND); } catch (e) {}
}
function setzen(o) {
  Object.assign(stand, o);
  if (!STAND && o.oben) console.log('  ' + o.oben + (o.unten ? '  ' + o.unten : ''));
}

/* Der eine Balken: geholt = Bytes seit dem Start, ueber alle Dateien. */
let zuletztGezeigt = 0;
function zeigen(geholt, was, quelle) {
  const sek = (Date.now() - START) / 1000, rate = geholt / Math.max(1, sek);
  stand.promille = GESAMT ? Math.min(999, Math.floor(geholt / GESAMT * 1000)) : 0;
  stand.oben = was || stand.oben;
  stand.unten = [T('{teil} von {ganz}', { teil: mb(geholt), ganz: mb(GESAMT) }), quelle,
    rate > 0 && geholt > 2e6 ? dauer(Math.max(0, GESAMT - geholt) / rate) : ''].filter(Boolean).join('  ·  ');
  if (!STAND && Date.now() - zuletztGezeigt > 3000) { zuletztGezeigt = Date.now(); console.log('  ' + (stand.promille / 10).toFixed(1) + ' %  ' + stand.oben + '  ' + stand.unten); }
}

/* Ein Kind starten, seine Meldezeilen lesen, auf sein Ende warten. Die Prosa der Kinder geht ins Protokoll. */
let kindJetzt = null;
function kind(skript, args, umrechnen) {
  return new Promise((fertig) => {
    const k = spawn(process.execPath, [path.join(__dirname, skript), ...args],
      { cwd: WURZEL, env: { ...process.env, KT_MELDEN: '1' }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    kindJetzt = k;
    let rest = '', protokoll = '';
    k.stdout.on('data', (d) => {
      rest += d.toString('utf8');
      let z;
      while ((z = rest.indexOf('\n')) >= 0) {
        const zeile = rest.slice(0, z).replace(/\r$/, ''); rest = rest.slice(z + 1);
        if (zeile.startsWith('@@KT ')) { try { const m = JSON.parse(zeile.slice(5)); if (m.lauf) umrechnen(m.lauf); } catch (e) {} }
        else { protokoll += zeile + '\n'; if (!STAND) console.log(zeile); }
      }
    });
    k.stderr.on('data', (d) => { protokoll += d.toString('utf8'); if (!STAND) process.stderr.write(d); });
    k.on('close', (code) => { kindJetzt = null; fertig({ code, protokoll }); });
    k.on('error', (e) => { kindJetzt = null; fertig({ code: 1, protokoll: e.message }); });
  });
}

/* Halt vom Installer (Abbrechen): Kind beenden, Stand sagen, raus. */
const wache = setInterval(() => {
  schreiben();
  if (HALT && fs.existsSync(HALT)) {
    clearInterval(wache);
    if (kindJetzt) try { kindJetzt.kill(); } catch (e) {}
    setzen({ zustand: 'halt', oben: T('Abgebrochen.'), unten: T('Was schon da ist, bleibt; beim nächsten Mal geht es an derselben Stelle weiter.') });
    schreiben();
    try { fs.unlinkSync(HALT); } catch (e) {}
    process.exit(3);
  }
}, 500);

(async () => {
  /* Modelle aus dem alten Ort (library/modelle, bis 1.0.131) an ihren Platz - verschoben, nicht kopiert */
  try { require('./modellordner.js').umziehen(() => {}); } catch (e) {}

  if (!GESAMT) {
    setzen({ promille: 1000, oben: T('Alles schon da.'), unten: T('KI-Modelle und Whisper liegen vollständig vor — nichts zu holen.'), zustand: 'fertig' });
    schreiben(); clearInterval(wache); return;
  }
  setzen({ oben: T('KI-Modelle und Whisper werden geholt'), unten: T('{ganz} insgesamt', { ganz: mb(GESAMT) }) });

  const fehlt = [];
  if (modellFehlt.length) {
    /* modelle-holen.js meldet in bytes alles, was bisher daliegt - auch das, was vor dem Start schon lag */
    const vorher = modelle.DATEIEN.reduce((s, [n, , m]) => { const g = groesse(path.join(modelle.ZIEL, n)); return s + (g >= m ? g : 0); }, 0);
    const r = await kind('modelle-holen.js', [], (l) => { if (typeof l.bytes === 'number') zeigen(Math.max(0, l.bytes - vorher), l.was, l.quelle); });
    if (r.code !== 0) {
      /* „  hole       name … FEHLER (grund)" - der Name steht vor dem „…" */
      const namen = r.protokoll.split('\n').filter((z) => z.includes(T('FEHLER'))).map((z) => (z.split(' … ')[0].trim().split(/\s+/).pop()));
      fehlt.push(...(namen.length ? namen : [T('KI-Modelle')]));
    }
  }
  if (whisperBytes) {
    /* whisper-holen.js meldet je Datei (Programm, dann Modell) bytes innerhalb dieser Datei */
    let basis = modellBytes, letzte = { was: '', bytes: 0 };
    const r = await kind('whisper-holen.js', ['--still'], (l) => {
      if (typeof l.bytes !== 'number') { stand.oben = l.was || stand.oben; return; }
      if (l.was !== letzte.was) { basis += letzte.bytes; letzte = { was: l.was, bytes: 0 }; }
      letzte.bytes = l.bytes;
      zeigen(basis + l.bytes, l.was, l.quelle);
    });
    if (r.code !== 0) fehlt.push('Whisper');
  }

  if (fehlt.length) {
    setzen({ zustand: 'fehler', oben: T('Nicht alles kam an.'),
      unten: T('Es fehlt: {liste}', { liste: fehlt.join(', ') }),
      schluss: T('KlangTresor läuft trotzdem. Was fehlt, holst du später in KlangTresor unter Profil → System — mit einem Klick, mit Balken. Oder hier gleich noch einmal versuchen.') });
    process.exitCode = 1;
  } else {
    setzen({ promille: 1000, zustand: 'fertig', oben: T('Alles da.'), unten: T('{ganz} geholt', { ganz: mb(GESAMT) }) });
  }
  schreiben(); clearInterval(wache);
})().catch((e) => {
  setzen({ zustand: 'fehler', oben: T('Holen brach ab.'), unten: String(e.message).slice(0, 200),
    schluss: T('KlangTresor läuft trotzdem. Was fehlt, holst du später in KlangTresor unter Profil → System — mit einem Klick, mit Balken. Oder hier gleich noch einmal versuchen.') });
  schreiben(); clearInterval(wache); process.exitCode = 1;
});
