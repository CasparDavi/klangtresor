/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Was ist auf GitHub angekommen, das nicht von hier stammt?
 *   node bin/fremdstand.js
 *
 * Caspar_D, 26.08.2026: „Ich will immer eine detaillierte Liste haben,
 * was an neuen Commits, die nicht von uns kamen, reingekommen ist und
 * was sie bewirken werden."
 *
 * WAS ES PRUEFT, in dieser Reihenfolge:
 *   1. Wer hat committet und wann
 *   2. Welche Dateien - und vor allem: welche gab es SCHON
 *   3. Wurde etwas ENTFERNT? Das ist die gefaehrlichste Art Aenderung,
 *      denn sie faellt beim Lesen der neuen Zeilen nicht auf
 *   4. Werden fremde Adressen aufgerufen (Netz, Pakete)
 *   5. Werden Dateien ausserhalb des Programms angefasst - library/,
 *      geheim/, .gitignore, Schluessel
 *
 * Es urteilt NICHT. Es legt vor, was da ist; die Bewertung bleibt beim
 * Lesen. Ein Werkzeug, das „unbedenklich" sagt, wird geglaubt.
 */
'use strict';
const { execSync } = require('node:child_process');
const WURZEL = require('node:path').join(__dirname, '..');
const git = (b) => execSync('git ' + b, { cwd: WURZEL, encoding: 'utf8' }).trim();
/* Fuer Fragen, deren Antwort auch „nein" sein darf: git schreibt dann
   nach stderr, und das gehoert nicht in einen Bericht. */
const gibts = (b) => { try {
  execSync('git ' + b, { cwd: WURZEL, stdio: ['ignore','ignore','ignore'] }); return true;
} catch (e) { return false; } };

/* Wessen Commits gelten als „eigen"? Alles andere wird vorgelegt. */
const EIGEN = [/caspardav/i, /joergbernhardt/i, /noreply@anthropic/i];

try { git('fetch origin --quiet'); } catch (e) {
  console.error('  Kein Zugriff auf origin: ' + e.message.split('\n')[0]); process.exit(1);
}

const basis = git('merge-base HEAD origin/main');
const neu = git(`log ${basis}..origin/main --format=%H`).split('\n').filter(Boolean);

if (!neu.length) { console.log('\n  Nichts Neues auf origin/main.\n'); process.exit(0); }

console.log(`\n  ${neu.length} neue${neu.length === 1 ? 'r' : ''} Commit${neu.length === 1 ? '' : 's'} auf origin/main\n`);

for (const h of neu) {
  const [kurz, autor, mail, datum, betreff] =
    git(`show -s --format=%h%x1f%an%x1f%ae%x1f%ad%x1f%s --date=format:%d.%m.%Y\\ %H:%M ${h}`).split('\x1f');
  const fremd = !EIGEN.some(r => r.test(mail) || r.test(autor));

  console.log(`  ${'─'.repeat(66)}`);
  console.log(`  ${kurz}  ${autor} <${mail}>`);
  console.log(`  ${datum}${fremd ? '   ◆ FREMD' : ''}`);
  console.log(`  „${betreff}"\n`);

  /* Ein Merge-Commit hat gegen seinen ersten Elternteil keinen Diff -
     alles steckt im Zweig, der hereinkam. Dann gegen den ZWEITEN
     Elternteil vergleichen, sonst meldet der Bericht +0 -0 und sieht
     harmlos aus, wo hundert Zeilen dazukamen. */
  const eltern = git(`show -s --format=%P ${h}`).split(' ').filter(Boolean);
  const merge = eltern.length > 1;
  const gegen = merge ? eltern[0] : `${h}~1`;
  if (merge) console.log(`    (Merge von ${eltern[1].slice(0,7)} — verglichen gegen ${gegen.slice(0,7)})\n`);

  const stat = git(`diff --stat ${gegen} ${h}`).split('\n').filter(z => z.includes('|'));
  if (!stat.length) { console.log('    (keine Dateiänderungen)\n'); continue; }

  for (const zeile of stat) {
    const datei = zeile.split('|')[0].trim();
    const bestand = gibts(`cat-file -e ${gegen}:"${datei}"`);
    let weg = 0, dazu = 0;
    try {
      const d = git(`diff ${gegen} ${h} -- "${datei}"`).split('\n');
      weg  = d.filter(z => /^-[^-]/.test(z)).length;
      dazu = d.filter(z => /^\+[^+]/.test(z)).length;
    } catch (e) {}
    const art = bestand ? (weg ? 'GEÄNDERT' : 'ergänzt ') : 'neu     ';
    console.log(`    ${art}  +${String(dazu).padEnd(4)} -${String(weg).padEnd(4)}  ${datei}`);
  }

  /* Was beim Lesen der neuen Zeilen NICHT auffällt: Entferntes. */
  const entfernt = git(`diff ${gegen} ${h}`).split('\n').filter(z => /^-[^-]/.test(z));
  if (entfernt.length) {
    console.log(`\n    ⚠ ${entfernt.length} Zeile${entfernt.length === 1 ? '' : 'n'} ENTFERNT:`);
    entfernt.slice(0, 8).forEach(z => console.log('      ' + z.slice(0, 88)));
    if (entfernt.length > 8) console.log(`      … und ${entfernt.length - 8} weitere`);
  }

  /* Fremde Adressen im Zugewinn. */
  const zugewinn = git(`diff ${gegen} ${h}`).split('\n').filter(z => /^\+[^+]/.test(z)).join('\n');
  const adressen = [...new Set(zugewinn.match(/https?:\/\/[a-zA-Z0-9.\/_-]+/g) || [])];
  if (adressen.length) {
    console.log('\n    Ruft aus dem Netz:');
    adressen.forEach(a => console.log('      ' + a));
  }

  /* LIZENZEN (Caspar_D, 26.08.2026: „Pruefe bitte auch unbedingt, dass
     Ein- und Umbauten lizenzkonform sind, nicht dass ploetzlich in
     unserem Repo Dinge liegen, die unsere Lizenz verletzen").

     KlangTresor steht unter MIT. Verträglich sind MIT, BSD, ISC,
     Apache-2.0 und Public Domain. NICHT verträglich sind GPL, AGPL und
     LGPL: Wer solchen Code einbaut, muss das ganze Werk unter dieselbe
     Lizenz stellen. Ein NACHBAU nach fremdem Vorbild ist erlaubt und
     im Haus schon einmal so gemacht worden (CB Audio Analyzer, GPL -
     nachgebaut, nicht uebernommen; siehe web/fremd/LIZENZEN.md).

     Gemeldet wird jede neue Abhaengigkeit, jedes fremde Repositorium
     und jedes Docker-Grundbild. Die Lizenz selbst kann dieses Werkzeug
     nicht nachschlagen - es sagt nur, WO nachzusehen ist. */
  const paketNeu = stat.some(z => /package(-lock)?\.json/.test(z));
  const quellen = [
    ...(zugewinn.match(/(?:FROM|--from=)\s*([a-z0-9][a-z0-9._\/-]*:[a-z0-9._-]+)/gi) || []),
    ...(zugewinn.match(/git clone[^\n]*?(https?:\/\/[^\s'"]+)/gi) || []),
  ];
  if (paketNeu || quellen.length) {
    console.log('\n    ⚠ LIZENZ PRÜFEN — fremder Code kommt herein:');
    if (paketNeu) console.log('      package.json geändert → neue Abhängigkeiten?');
    [...new Set(quellen)].forEach(q => console.log('      ' + q.replace(/\s+/g, ' ')));
    console.log('      MIT/BSD/ISC/Apache-2.0 sind verträglich, GPL/AGPL/LGPL NICHT.');
    console.log('      Eintragen in web/fremd/LIZENZEN.md, wenn es bleibt.');
  }

  /* Anfassen, was nicht Programm ist. */
  const heikel = stat.map(z => z.split('|')[0].trim())
    .filter(d => /^(library|geheim)\//.test(d) || /\.(env|pem|key)$/.test(d) || d === '.gitignore');
  if (heikel.length) {
    console.log('\n    ⚠ Berührt nicht-Programm-Dateien:');
    heikel.forEach(d => console.log('      ' + d));
  }
  console.log('');
}

console.log(`  ${'─'.repeat(66)}`);
console.log('  Prüfen, bevor du ziehst:  git diff HEAD..origin/main');
console.log('  Übernehmen:               git pull --rebase origin main\n');
