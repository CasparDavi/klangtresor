#!/usr/bin/env node
/* Experiment 2: Ereignishaftigkeit ohne Modell — Tempus-, Pronomen- und
   Imperativ-Zählung an bekannten Enden. Dazu: Kondensat-Vokabular je Gruppe. */
'use strict';
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const REPO = '/Volumes/Extreme_SSD/Entwicklung/SunoArchive';
const { ohneRegie } = require(path.join(REPO, 'bin/geschichten.js'));

const katalog = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(REPO, 'library/katalog.json.gz'))));
const kondJson = JSON.parse(fs.readFileSync(path.join(REPO, 'library/kondensate/kondensate.json')));
const gesch = JSON.parse(fs.readFileSync(path.join(REPO, 'library/geschichten.json'))).songs;

const idVonTitel = t => { const s = Object.values(katalog.songs).find(x => x.titel === t && gesch[x.id]); return s ? s.id : null; };
const titelVon = id => (katalog.songs[id] || {}).titel || '(?)';
const plEintraege = plId => [...katalog.playlists[plId].eintraege].sort((a, b) => a.position - b.position)
  .filter(e => e.eigen !== false && gesch[e.songId]);

/* ---- Zähler ---------------------------------------------------------- */
const STARK = /\b(war|waren|kam|kamen|sah|sahen|ging|gingen|stand|standen|sprach|sprachen|rief|riefen|zog|zogen|trat|traten|hielt|hielten|fiel|fielen|lag|lagen|sass|sassen|saß|saßen|schrie|schrien|lief|liefen|ritt|ritten|starb|starben|nahm|nahmen|gab|gaben|fand|fanden|liess|ließ|liessen|ließen|blieb|blieben|schlug|schlugen|trug|trugen|wusste|wußte|wussten|wußten|hatte|hatten|wurde|wurden|sang|sangen|floh|flohen|bat|baten|schwieg|schwiegen|begann|begannen|hob|hoben|griff|griffen|stieg|stiegen|bog|bogen|klang|klangen|schien|schienen)\b/gi;
const SCHWACH_AUSNAHME = new Set(['heute', 'bitte', 'mitte', 'leute', 'seite', 'weite', 'pforte', 'worte', 'karte', 'harte', 'zarte', 'alte', 'kalte', 'tote', 'rote', 'gute', 'bunte', 'letzte', 'erste', 'zweite', 'dritte', 'nächste', 'echte', 'rechte', 'schlechte', 'leichte', 'feuchte', 'dichte', 'geschichte', 'lichte', 'nachte', 'nächte', 'ernte', 'tinte', 'kante', 'tante', 'minute', 'sekunde']);
const PRN3 = /\b(er|ihn|ihm|sie|ihr|ihres|ihrem|ihren|seiner|seinem|seinen)\b/gi;
const PRN12 = /\b(ich|mich|mir|mein|meine|meiner|meinem|meinen|du|dich|dir|dein|deine|deiner|deinem|deinen|wir|uns|unser)\b/gi;
const IMPSTART = /^(komm|halt|steig|lass|laß|bleib|geh|gib|nimm|schau|hör|sag|zeig|küss|fass|spür|atme|tanz|trink|iss|schlaf|wach|folg|lauf|spring|flieh|wart|glaub|vergiss|denk|fühl|sieh|reich|öffne|schliess|schließ)\b/i;

function zaehle(text) {
  const worte = (text.match(/[\wäöüß']+/gi) || []);
  const nWorte = worte.length || 1;
  const stark = (text.match(STARK) || []).length;
  let schwach = 0;
  for (const w of worte) {
    const k = w.toLowerCase();
    if (/^[a-zäöüß]+(te|ten)$/.test(k) && k.length > 4 && !SCHWACH_AUSNAHME.has(k)
      && !/(^|[^a-z])(die|der|das|eine?r?)$/.test('') /* Substantiv-Filter geht ohne Kontext nicht — Ausnahmenliste muss reichen */)
      schwach++;
  }
  const p3 = (text.match(PRN3) || []).length, p12 = (text.match(PRN12) || []).length;
  const zeilen = text.split('\n').map(z => z.trim()).filter(Boolean);
  let imp = 0;
  for (const z of zeilen) if (IMPSTART.test(z) || /!\s*$/.test(z)) imp++;
  return {
    praetProz: +(100 * (stark + schwach) / nWorte).toFixed(2),
    erzaehlAnteil: +(p3 / ((p3 + p12) || 1)).toFixed(3),
    impProz: +(100 * imp / (zeilen.length || 1)).toFixed(1),
    nWorte,
  };
}
const deutschGenug = text => {
  const de = (text.match(/\b(und|der|die|das|ich|nicht|ist|mit|du|ein)\b/gi) || []).length;
  const en = (text.match(/\b(the|and|you|that|with|for|this|not|was|is)\b/gi) || []).length;
  return de >= en * 2;
};

/* ---- Prüfmengen ------------------------------------------------------ */
const PL = {
  lea: '041a95dd-8e82-4430-9f2f-0effcae363ac', atme: '6c2d7753-bb4a-4891-846a-dd7f5114770f',
  guteLaune: '7324b0d6-820e-467d-a7c0-9267794cd25b', balladen: 'dd857498-6133-4266-b355-969d5276bd5c',
  bioGefahr: '7de2239d-3c52-4981-bae7-709a6c65049e', essen: '11045396-717e-4339-8118-689925987526',
};
const mengen = {
  balladen: plEintraege(PL.balladen).map(e => e.songId),
  lea: plEintraege(PL.lea).map(e => e.songId),
  atme: plEintraege(PL.atme).map(e => e.songId),
  guteLaune: plEintraege(PL.guteLaune).map(e => e.songId),
  bioGefahr: plEintraege(PL.bioGefahr).map(e => e.songId),
  essen: plEintraege(PL.essen).map(e => e.songId),
  betrachtungen: ['Okkultation', 'Gleich', 'Stumm'].map(idVonTitel).filter(Boolean),
  achsenHoch: ['Erlkönig', 'Belsazar', 'Ulrich & Ännchen'].map(idVonTitel).filter(Boolean),
};

console.log('== ACHSEN-ZÄHLUNG (nur hinreichend deutsche Texte) ==');
console.log('Gruppe            n    Prät./100W   Erzähl-Anteil (3.P.)   Imperativ-Zeilen %');
const einzel = {};
for (const [name, ids] of Object.entries(mengen)) {
  const werte = [];
  for (const id of ids) {
    const s = katalog.songs[id];
    if (!s || !s.lyrics) continue;
    const text = ohneRegie(s.lyrics);
    if (text.length < 100 || !deutschGenug(text)) continue;
    const z = zaehle(text);
    werte.push(z);
    einzel[titelVon(id)] = z;
  }
  if (!werte.length) { console.log(`  ${name}: keine deutschen Texte`); continue; }
  const m = f => (werte.reduce((a, b) => a + b[f], 0) / werte.length);
  console.log(`  ${name.padEnd(15)} ${String(werte.length).padStart(2)}      ${m('praetProz').toFixed(2).padStart(5)}          ${m('erzaehlAnteil').toFixed(3)}                  ${m('impProz').toFixed(1)}`);
}
console.log('\n-- Einzelwerte der bekannten Enden --');
for (const t of ['Erlkönig', 'Belsazar', 'Ulrich & Ännchen', 'Okkultation', 'Gleich', 'Stumm'])
  if (einzel[t]) console.log(`  ${t.padEnd(18)} Prät ${String(einzel[t].praetProz).padStart(5)}  Erzähl ${einzel[t].erzaehlAnteil}  Imp ${einzel[t].impProz}%  (${einzel[t].nWorte} W)`);

/* ---- Kondensat-Vokabular: was hält Gruppen zusammen? ----------------- */
console.log('\n== KONDENSAT-VOKABULAR (Wörter, die in >1 Lied der Gruppe stehen) ==');
const reihe = ['opus-f2-gesamt', 'opus', 'opus-gesamt'];
const kondVon = id => { const e = kondJson.lieder[id]; if (!e) return null; const m = reihe.find(k => e.modelle[k]); return m ? e.modelle[m] : null; };
for (const [name, ids] of Object.entries({ balladen: mengen.balladen, bioGefahr: mengen.bioGefahr, essen: mengen.essen, guteLaune: mengen.guteLaune })) {
  const zaehler = new Map();
  let nMit = 0;
  for (const id of ids) {
    const k = kondVon(id); if (!k) continue; nMit++;
    for (const w of new Set(k.map(x => x.toLowerCase()))) zaehler.set(w, (zaehler.get(w) || 0) + 1);
  }
  const mehrfach = [...zaehler.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
  console.log(`  ${name} (${nMit} Lieder): ` + (mehrfach.length
    ? mehrfach.slice(0, 12).map(([w, n]) => `${w}×${n}`).join(', ')
    : '— kein Wort in mehr als einem Lied —'));
}
