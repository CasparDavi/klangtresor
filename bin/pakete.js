#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   SIND ALLE PAKETE DA? - UND WENN NICHT, NUR DIE FEHLENDEN HOLEN
   bin/pakete.js

   Gemeldet von Lutz (Discord, 23.10.2026, Windows 11): „umap-js fehlte in
   node_modules - Klangraum und Geschichten-Raum neu zeichnen brachen jeden
   Morgen mit Cannot find module 'umap-js' ab." Das Paket stand im
   package-lock, aber:
     - einrichten.js sah nur nach onnxruntime-node und hielt damit alle
       Pakete fuer da,
     - aktualisieren.js setzt die Pakete nur neu, wenn sich package-lock
       geaendert hat - eine einmal unvollstaendige Installation blieb es
       fuer immer.
   Und: ein volles `npm install` scheiterte bei ihm still am
   Installationsskript von onnxruntime-node und rollte dann ALLES zurueck.
   Darum holt nachholen() nur, was fehlt, in genau der Fassung aus
   package-lock.json - und ohne Installationsskripte, wo keines noetig ist
   (nur onnxruntime-node hat eines).

   Geprueft wird jeder Eintrag aus package-lock.json, der auf diesem System liegen
   muss: liegt sein Ordner mit package.json und der Datei, auf die "main" zeigt, und
   in der Nummer, die das Lock verlangt? (Bis zum 17.11.2026 waren es nur die beiden
   Abhaengigkeiten aus package.json - siehe luecken().)

   Von Hand:  node bin/pakete.js          sagt, was fehlt
              node bin/pakete.js --tun    holt es
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { T } = require('./sprache.js');

const WURZEL = path.resolve(__dirname, '..');
/* NODE IN DEN SUCHPFAD (23.10.2026, im Windows-11-Test gefunden): npm fuehrt Installationsskripte ueber
   cmd.exe aus - bei onnxruntime-node `node ./script/install`. Kommt Node nur aus werkzeug\node und steht nicht
   im PATH, findet cmd.exe kein `node`, das Skript scheitert, und npm rollt ALLE Pakete zurueck (Lutz' fehlendes
   umap-js). Also den Ordner des laufenden Node vorn in den PATH - fuer uns und alle Kinder. */
process.env.PATH = path.dirname(process.execPath) + path.delimiter + (process.env.PATH || '');

function lesen(datei) { try { return JSON.parse(fs.readFileSync(path.join(WURZEL, datei), 'utf8')); } catch (e) { return null; } }

/* ---------------------------------------------------------------- Was liegen muss

   GEPRUEFT WIRD GEGEN package-lock.json, NICHT GEGEN package.json (17.11.2026). Bis dahin sah
   fehlende() nur die beiden Abhaengigkeiten aus package.json - was DARUNTER haengt, kam nie vor.
   Die Folge war ein Loch, das sich selbst zugedeckt hat: nachholen() holte onnxruntime-node und
   liess dessen tar-Zweig liegen, und fehlende() sagte danach "alles da". Auf Caspar_Ds eigenem
   Rechner fehlten so sechs Pakete (tar, minipass, chownr, minizlib, yallist, @isaacs/fs-minipass),
   waehrend der Tab "System" gruen war. Dieselbe Klasse Fehler wie Lutz' umap-js (23.10.2026) -
   nur eine Ebene tiefer, wo niemand hinsah.

   Nicht verlangt wird, was fuer den Betrieb nicht gebraucht wird: Entwicklungspakete (dev),
   optionale, und solche fuer ein anderes System - onnxruntime-node traegt os: win32,darwin,linux,
   und npm schreibt bei Negationen "!win32". */
const hierPassend = (e) => {
  const passt = (feld, wert) => !Array.isArray(feld) || !feld.length
    || feld.some((w) => (String(w).startsWith('!') ? String(w).slice(1) !== wert : String(w) === wert));
  return passt(e.os, process.platform) && passt(e.cpu, process.arch);
};

/* IST DAS PAKET BENUTZBAR, NICHT NUR VORHANDEN? Geprueft wird die Datei, auf die das Paket selbst
   zeigt - so fiel Lutz' halb entpacktes umap-js auf (23.10.2026), bei dem der Ordner da war und die
   Hauptdatei nicht.

   OHNE "main" WIRD NICHT GERATEN (17.11.2026). Vorher fiel die Pruefung auf index.js zurueck, wenn
   kein "main" dastand. Das war zu Zeiten richtig, in denen jedes Paket ein "main" hatte. Heute
   liefern Pakete stattdessen "exports" - is-any-array@3 und die drei ml-array-* tun es -, und das
   Raten erklaerte sieben liegende Pakete fuer fehlend. Gefunden, als die Pruefung vom ganzen Lock
   lief und ploetzlich dreizehn Luecken meldete, wo sechs waren. index.js gilt nur noch, wenn das
   Paket WEDER main NOCH exports nennt - dann ist es die Regel von Node selbst. */
function hatHauptdatei(ordner, p) {
  if (p.main) {
    const h = path.join(ordner, p.main);
    return fs.existsSync(h) || fs.existsSync(h + '.js') || fs.existsSync(path.join(h, 'index.js'));
  }
  if (p.exports) return true;          /* die Wege stehen im Paket; sie alle aufzuloesen waere eine zweite Node-Laufzeit */
  return fs.existsSync(path.join(ordner, 'index.js'));
}

/* EINE QUELLE FUER BEIDE FRAGEN. Vorher pruefte fehlende() die direkten Pakete und abweichungen()
   das ganze Lock - zwei Apparate fuer dieselbe Frage, und sie widersprachen sich. Jetzt zaehlt
   luecken() einmal auf, mit Ort und Grund:
     'fehlt'   - nicht da, oder ohne die Datei, auf die "main" zeigt
     'fassung' - da, aber eine andere Nummer als das Lock verlangt */
function luecken() {
  const lock = lesen('package-lock.json');
  if (!lock || !lock.packages)
    return [{ ort: 'package-lock.json', name: 'package-lock.json', grund: 'fehlt', soll: null, ist: null, skript: false }];
  const aus = [];
  for (const [ort, e] of Object.entries(lock.packages)) {
    if (!ort.startsWith('node_modules/') || e.dev || e.optional || !hierPassend(e)) continue;
    /* Der Paketname steht hinter dem LETZTEN node_modules/ - bei ml-array-max/node_modules/is-any-array
       ist das Paket is-any-array, der Ort aber ein anderer. */
    const name = ort.slice(ort.lastIndexOf('node_modules/') + 'node_modules/'.length);
    const ordner = path.join(WURZEL, ort);
    const traeger = { ort, name, soll: e.version || null, skript: !!e.hasInstallScript };
    let p = null;
    try { p = JSON.parse(fs.readFileSync(path.join(ordner, 'package.json'), 'utf8')); } catch (x) {}
    if (!p) { aus.push({ ...traeger, grund: 'fehlt', ist: null }); continue; }
    if (!hatHauptdatei(ordner, p)) { aus.push({ ...traeger, grund: 'fehlt', ist: p.version || null }); continue; }
    if (e.version && p.version !== e.version) aus.push({ ...traeger, grund: 'fassung', ist: p.version || null });
  }
  return aus;
}

/* Die Namen der Pakete, die fehlen oder unvollstaendig sind - fuer die Stellen, die nur
   "fehlt etwas?" fragen (bin/system.js, bin/starten.js, bin/einrichten.js, bin/karte.js). */
function fehlende() { return luecken().filter((l) => l.grund === 'fehlt').map((l) => l.name); }

/* npm neben dem laufenden Node - wie npmAufruf in einrichten.js und aktualisieren.js:
   kommt Node aus werkzeug/, steht npm nicht im PATH. */
function npmAufruf() {
  const nd = path.dirname(process.execPath);
  for (const k of [path.join(nd, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
                   path.join(nd, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js')]) {
    if (fs.existsSync(k)) return { befehl: process.execPath, vorn: ['--no-warnings', k], schale: false };
  }
  return { befehl: process.platform === 'win32' ? 'npm.cmd' : 'npm', vorn: [], schale: process.platform === 'win32' };
}

/* Holt die Pakete in der Fassung aus package-lock.json - die fehlenden und die, die in einer
   anderen Nummer daliegen. Gibt zurueck, was danach NOCH offen ist, als lesbare Zeilen
   (leer = alles gut). sag: Ausgabe. */
function nachholen(sag = (t) => console.log(t)) {
  const offen = luecken();
  if (!offen.length) return [];
  const npm = npmAufruf();
  const melden = require('./melden.js');
  /* FLACH ODER VERSCHACHTELT (17.11.2026). `npm install <name>@<nr>` legt ein Paket immer nach
     node_modules/<name> - nie nach node_modules/a/node_modules/<name>. Eine verschachtelte Luecke
     (im Lock etwa ml-array-max/node_modules/is-any-array) ist damit nicht zu fuellen; dort muss npm
     den Baum selbst legen. Das macht `npm install` ohne Namen, und zwar OHNE node_modules
     wegzuwerfen - anders als npm ci, das bei einem Netzfehler mitten im Lauf eine Installation ohne
     jedes Paket hinterlaesst. Darum: erst die flachen einzeln (billig, kein fremdes Skript), und nur
     wenn danach eine verschachtelte Luecke bleibt, der ganze Lauf. */
  const flach = offen.filter((l) => !l.ort.slice('node_modules/'.length).includes('node_modules/'));
  const fassung = (l) => (l.soll ? `${l.name}@${l.soll}` : l.name);
  /* JE PAKET EIN AUFRUF, MIT BALKEN (28.10.2026, Tab „System": „Progressbars für alles, was von remote kommt").
     npm selbst meldet keine Zahlen; je Paket ein Schritt gibt dem Balken „3 von 5" und den Namen dazu. */
  const alle = flach.length; let nr = 0;
  const lauf = (teile, extra) => {
    for (const l of teile) {
      nr++;
      melden.lauf({ was: 'Programmbausteine werden geholt', n: nr - 1, von: alle, nEinheit: 'Paket', quelle: 'registry.npmjs.org', jetzt: l.name });
      sag(`  Paket nachholen: ${fassung(l)}${l.grund === 'fassung' ? ` (liegt: ${l.ist})` : ''} …`);
      spawnSync(npm.befehl, npm.vorn.concat(['install', '--no-save', '--no-fund', '--no-audit', ...extra, fassung(l)]),
        { cwd: WURZEL, stdio: 'inherit', shell: npm.schale });
    }
  };
  /* Erst die ohne Skript - die koennen nicht an einem fremden Skript scheitern. */
  lauf(flach.filter((l) => !l.skript), ['--ignore-scripts']);
  lauf(flach.filter((l) => l.skript), []);
  melden.ausLauf();
  /* NACHSEHEN, NICHT GLAUBEN - UND DANN DEN GANZEN BAUM (17.11.2026). Zwei Gruende, warum nach den
     Einzelaufrufen noch etwas offen sein kann:
       · eine verschachtelte Luecke war nie einzeln zu fuellen (siehe oben),
       · ein Einzelaufruf kann einen vorherigen zurueckdrehen: npm richtet dabei den uebrigen Baum
         nach package.json aus. Im Prueffall vom 17.11.2026 stand `ms` danach wieder auf der alten
         Nummer, und die Fertigstellung meldete trotzdem Erfolg - weil hier fehlende() zurueckgegeben
         wurde, das falsche Fassungen gar nicht kennt.
     Deshalb: am Ende zaehlen, und wenn etwas bleibt, legt npm den Baum einmal ganz. Das wirft
     node_modules nicht weg (anders als npm ci) und bringt package.json und das Lock zusammen. */
  if (luecken().length) {
    sag('  ' + T('Es bleibt etwas offen — npm legt den Baum einmal ganz …'));
    melden.lauf({ was: 'Programmbausteine werden geholt', quelle: 'registry.npmjs.org', jetzt: 'npm install' });
    /* DER MASSSTAB DARF SICH NICHT SELBST NACHGEBEN (17.11.2026). `npm install` ohne Namen schreibt
       package-lock.json um, wenn package.json etwas anderes verlangt - gemessen im Prueffall B. Dann
       bestuende die Pruefung hinterher IMMER, weil die Forderung gesenkt wurde statt die Pakete
       gesetzt. Das Lock gehoert dem Release, nicht der Reparatur: es wird vorher gemerkt und
       zurueckgelegt. Bleibt danach eine Luecke, wird sie gemeldet - das ist die Wahrheit, nicht ein
       Grund, den Massstab zu aendern. (Die Einzelaufrufe oben tragen --no-save und lassen das Lock
       ohnehin in Ruhe; nachgemessen am selben Tag.) */
    const lockDatei = path.join(WURZEL, 'package-lock.json');
    let vorher = null;
    try { vorher = fs.readFileSync(lockDatei); } catch (e) {}
    spawnSync(npm.befehl, npm.vorn.concat(['install', '--no-fund', '--no-audit']),
      { cwd: WURZEL, stdio: 'inherit', shell: npm.schale });
    if (vorher) {
      let nachher = null;
      try { nachher = fs.readFileSync(lockDatei); } catch (e) {}
      if (nachher && !vorher.equals(nachher)) {
        try { fs.writeFileSync(lockDatei, vorher); sag('  ' + T('package-lock.json wieder auf den Stand des Release gelegt — npm hatte sie umgeschrieben.')); }
        catch (e) {}
      }
    }
    melden.ausLauf();
  }
  /* Die ganze Wahrheit, nicht nur das Fehlende: eine falsche Fassung ist genauso eine Luecke.
     Als lesbare Zeilen, damit die Aufrufer sie unveraendert in ihre Meldungen setzen koennen. */
  return abweichungen();
}

/* brauche(name) holte fuer karte.js ein fehlendes Paket still nach - bis 28.10.2026; seither sagt es bin/fehlt.js. */
/* Liegt GENAU das, was package-lock.json verlangt - jedes Paket, auch die mitgezogenen, in seiner Fassung? Gibt die
   Abweichungen als lesbare Zeilen zurueck (leer = alles stimmt). Fuer die Einrichtung: liegt node_modules schon fertig
   da (die Setup.exe bringt es mit), braucht sie npm nicht - weder Netz noch Wartezeit. Seit dem 17.11.2026 ist das
   dieselbe Zaehlung wie fehlende(), nur anders beschriftet: luecken() ist die Quelle, hier wird sie nur in Worte
   gefasst. */
function abweichungen() {
  return luecken().map((l) => (l.grund === 'fassung' ? `${l.name} ${l.ist} statt ${l.soll}` : l.name));
}

/* ---------------------------------------------------------------- Ein Update zu Ende bringen

   Gerufen vom Start (bin/starten.js), bevor der Server kommt. Passt die Installation zum Lock,
   kostet das 18 ms und tut nichts. Passt sie nicht, ist ein Update halb eingespielt worden - dann
   wird es fertiggestellt. Warum das keine Ruecknahme der Regel „wir machen gar nichts hinterher"
   ist, steht in bin/starten.js an der Rufstelle.

   Gibt zurueck, was geschehen ist: { noetig, offen, rest } - noetig false heisst: alles war gut. */
function fertigstellen(sag = (t) => console.log(t)) {
  const offen = luecken();
  if (!offen.length) return { noetig: false, offen: [], rest: [] };
  const fehlt = offen.filter((l) => l.grund === 'fehlt').length;
  const schief = offen.length - fehlt;
  /* Nur nennen, was zutrifft: „0 fehlen" ist ein Fuellwort, und ein Baustein ist einer, keine
     „1 Programmbausteine" (Pruefstand 17.11.2026). */
  const teile = [];
  if (fehlt) teile.push(fehlt === 1 ? T('einer fehlt') : T('{n} fehlen', { n: fehlt }));
  if (schief) teile.push(schief === 1 ? T('einer in einer anderen Fassung') : T('{n} in einer anderen Fassung', { n: schief }));
  sag('\n' + (offen.length === 1
      ? T('  Das Update ist noch nicht fertig: ein Programmbaustein passt nicht zu dieser Fassung.')
      : T('  Das Update ist noch nicht fertig: {n} Programmbausteine passen nicht zu dieser Fassung.', { n: offen.length }))
    + (offen.length > 1 && teile.length ? ' (' + teile.join(', ') + ')' : ''));   /* bei einer Luecke sagt die Klammer dasselbe zweimal */
  sag('  ' + T('Das wird jetzt zu Ende gebracht — einmalig, danach startet es wie immer.') + '\n');
  const rest = nachholen(sag);
  sag(rest.length
    ? '\n' + T('  Es fehlen noch: {namen}. Ausweg: Profil → System, dort steht ein Knopf.', { namen: rest.join(', ') }) + '\n'
    : '\n' + T('  Fertig — die Programmbausteine passen jetzt zur Fassung.') + '\n');
  return { noetig: true, offen, rest };
}

module.exports = { fehlende, nachholen, abweichungen, luecken, fertigstellen };

if (require.main === module) {
  const offen = luecken();
  if (!offen.length) { console.log('  Alle Pakete liegen da, in der Fassung aus package-lock.json.'); process.exit(0); }
  const fehlt = offen.filter((l) => l.grund === 'fehlt');
  const schief = offen.filter((l) => l.grund === 'fassung');
  if (fehlt.length) console.log('  Es fehlen: ' + fehlt.map((l) => l.ort.slice(13)).join(', '));
  if (schief.length) console.log('  Falsche Fassung: ' + schief.map((l) => `${l.ort.slice(13)} ${l.ist} statt ${l.soll}`).join(', '));
  if (!process.argv.includes('--tun')) { console.log('  Holen: node bin/pakete.js --tun'); process.exit(1); }
  const rest = nachholen();
  if (rest.length) { console.log('  Noch immer fehlen: ' + rest.join(', ') + '. Oft blockiert ein Firmennetz oder Virenschutz registry.npmjs.org.'); process.exit(1); }
  console.log('  Alle Pakete sind jetzt da.');
}
