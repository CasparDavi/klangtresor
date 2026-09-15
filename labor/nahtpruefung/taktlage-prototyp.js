#!/usr/bin/env node
/* TAKTLAGE-PROTOTYP (15.09.2026) - Laenge und Phase des Zehnsekuenders am ganzen Katalog, BEVOR web/index.html
   angefasst wird. Caspar_D: "im echten Leben synchronisierst du ja auf Takt was bei 10 Sekuender nur insoweit
   passieren sollte, dass das Gros des Songs taktsynchron laeuft" und "suno startet song und video gleichzeitig".
   Clipbild 0 liegt also auf Songzeit 0, der Clip beginnt alle L = N/30 s neu. Gesucht wird (N, M, phiF):
   N Bilder <= 300, M Schlaege im Clip, phiF ganze Bilder Versatz des Clip-Rasters (Clipschlag j bei Bild
   phiF + j*N/M). Gemessen gegen die ECHTEN Schlaege des Katalogs (library/katalog.json.gz, nur gelesen).

   Zwei Raster, weil sie sich im Ergebnis um Welten unterscheiden (siehe Ausgabe):
     'takt'   M ist ein Vielfaches der Schlaege je Takt P: die Eins kehrt im Clip wieder. Ein Songschlag sitzt,
              wenn er naeher als 1/8 Schlag am naechsten Clipschlag liegt UND eine Song-Eins auf eine Clip-Eins faellt.
     'schlag' M beliebig (nur durch brauch teilbar): der Clip kennt keine Eins. Ein Songschlag sitzt, wenn er
              naeher als 1/8 Schlag am naechsten Clipschlag liegt.

   Aufruf:  node labor/nahtpruefung/taktlage-prototyp.js [--raster takt|schlag] [--varianten] [--brauch n] [--json datei] [--wie-eingebaut]
   Schreibt nichts nach library/. --json legt je Titel die Wahl ab, Ziel frei (am besten ins Scratchpad). */
'use strict';
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true); };
const KAT = path.resolve(__dirname, '../../library/katalog.json.gz');
const BILDRATE = 30, MAX_BILDER = 300, MIN_BILDER = 120;
const med = a => { if (!a.length) return 0; const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
const quant = (a, p) => { const b = a.slice().sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(p * b.length))]; };
const ggT = (a, b) => { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) [a, b] = [b, a % b]; return a || 1; };
const kgV = (a, b) => a * b / ggT(a, b);

/* ---- wie das Studio heute: taktLaenge, schlagMedian, proTaktVon ---- */
function taktDaten(S) {
  const einsen = S.filter(s => s[1] === 1).map(s => s[0]);
  const dE = []; for (let i = 1; i < einsen.length; i++) dE.push(einsen[i] - einsen[i - 1]);
  const takt = einsen.length >= 3 ? med(dE) : 0;
  const d = []; for (let i = 1; i < S.length; i++) { const x = S[i][0] - S[i - 1][0]; if (x > 0.05 && x < 2) d.push(x); }
  const schlag = S.length >= 8 ? med(d) : 0;
  return { takt, einsen, schlag, dE };
}
const proTaktVon = (taktLang, schlag) => schlag > 0 ? Math.max(1, Math.min(16, Math.round(taktLang / schlag))) : 4;

/* ---- Gewichte aus den Abschnitten: je Abschnitt die Zahl der Vorkommen seines Buchstabens; erster und letzter
   Abschnitt (Intro/Outro) zaehlen wie ein einmaliger. Ohne Abschnittsdaten alles 1. Der "Refrain" der
   Kennzahl ist der meistwiederholte Buchstabe unter den inneren Abschnitten. ---- */
function abschnitteLesen(ab, art) {
  const ok = ab && Array.isArray(ab.segment_labels) && Array.isArray(ab.peak_times) && ab.segment_labels.length === ab.peak_times.length + 1;
  if (!ok) return { w: () => 1, refr: () => false };
  const lab = ab.segment_labels, pk = ab.peak_times, n = lab.length, zahl = {};
  lab.forEach(l => zahl[l] = (zahl[l] || 0) + 1);
  const wSeg = lab.map((l, k) => (k === 0 || k === n - 1) ? (art === 'rand0' ? 0.25 : 1) : zahl[l]);
  let refrain = null, rz = 0; lab.forEach((l, k) => { if (k > 0 && k < n - 1 && zahl[l] > rz) { rz = zahl[l]; refrain = l; } });
  const seg = t => { let lo = 0, hi = pk.length; while (lo < hi) { const m = (lo + hi) >> 1; if (pk[m] <= t) lo = m + 1; else hi = m; } return lo; };
  return { w: t => art === 'gleich' ? 1 : wSeg[seg(t)], refr: t => { const k = seg(t); return k > 0 && k < n - 1 && lab[k] === refrain; } };
}

/* ---- Die Songschlaege vorbereiten: Zeit in Bildern, Zeitgewicht (Dauer bis zum naechsten Schlag, hoechstens
   1,5 Median-Schlaege - Pausen zaehlen nicht als Songzeit mit Takt), Abschnittsgewicht, Eins ja/nein. ---- */
function schlaegeVorbereiten(S, schlag, A, einsGewicht) {
  const n = S.length, f = new Float64Array(n), wz = new Float64Array(n), wg = new Float64Array(n), eins = new Uint8Array(n), refr = new Uint8Array(n);
  let spanne = 0;
  for (let i = 0; i < n; i++) {
    const t = S[i][0], d = i + 1 < n ? Math.min(S[i + 1][0] - t, 1.5 * schlag) : schlag;
    f[i] = t * BILDRATE; wz[i] = Math.max(0, d); eins[i] = S[i][1] === 1 ? 1 : 0;
    wg[i] = wz[i] * A.w(t) * (eins[i] ? einsGewicht : 1); refr[i] = A.refr(t) ? 1 : 0; spanne += wz[i];
  }
  return { n, f, wz, wg, eins, refr, spanne };
}

/* ---- Bewertung einer Lage. Clipschlag j bei Bild phiF + j*N/M, periodisch in N. mitEins: eine Song-Eins
   sitzt nur auf einer Clip-Eins (j % P == 0). Liefert gewichteten und ungewichteten Anteil, Refrain-Anteil. ---- */
function bewerten(B, N, M, P, phiF, tol, mitEins, o = {}) {
  const bpf = M / N;
  let sw = 0, gw = 0, sz = 0, gz = 0, sr = 0, gr = 0, se = 0, ge = 0, fehler = 0;
  for (let i = 0; i < B.n; i++) {
    let c = (B.f[i] - phiF) % N; if (c < 0) c += N;
    let j, e;
    if (o.sichtbar) { const nb = N / M, j0 = Math.floor(c * bpf), e0 = Math.abs(Math.ceil(j0 * nb - 1e-9) - c), e1 = Math.abs(Math.ceil((j0 + 1) * nb - 1e-9) - c); j = e1 < e0 ? j0 + 1 : j0; e = Math.min(e0, e1) * bpf; }   /* --wie-eingebaut: gegen das Bild, auf dem der Puls erscheint */
    else { const r = c * bpf; j = Math.round(r); e = Math.abs(r - j); }
    const sitzt = e < tol && (!mitEins || !B.eins[i] || (j % M) % P === 0) ? 1 : 0;   /* j == M ist Clipschlag 0 der naechsten Runde */
    sw += sitzt * B.wg[i]; gw += B.wg[i]; sz += sitzt * B.wz[i]; gz += B.wz[i];
    if (B.refr[i]) { sr += sitzt * B.wz[i]; gr += B.wz[i]; }
    if (B.eins[i]) { se += sitzt * B.wz[i]; ge += B.wz[i]; }
    fehler += e * B.wz[i];
  }
  return { gewichtet: gw ? sw / gw : 0, zeit: gz ? sz / gz : 0, refrain: gr ? sr / gr : null, einsQuote: ge ? se / ge : null, fehler: gz ? fehler / gz : 0 };
}

/* ---- Das neue Modell ---- */
function optimieren(s, o) {
  const S = s.schlaege || [], T = taktDaten(S);
  if (!(T.schlag > 0)) return { art: 'ohne Schlaege' };
  const einsDa = T.takt > 0.05, P = einsDa ? proTaktVon(T.takt, T.schlag) : 4;
  const beat = einsDa ? T.takt / P : T.schlag;            /* nur Schaetzer fuer M; entschieden wird an den echten Schlaegen */
  const mitEins = einsDa && o.raster === 'takt';
  const B = schlaegeVorbereiten(S, T.schlag, abschnitteLesen(s.abschnitte, o.gewichte), o.einsGewicht);
  const brauch = o.brauch || 1;
  for (let d = brauch; d >= 1; d--) {                     /* Lockerung wie heute: 8, 4, 2, 1 */
    if (brauch % d) continue;
    const einheit = mitEins ? kgV(P, d) : d, alle = [];
    /* --wie-eingebaut: Tempo-Schaetzer auch je Drittel (Gegenpruefung 15.09.2026) */
    const schaetzer = [beat]; if (o.drittel && s.dauer > 0) for (let k = 0; k < 3; k++) { const d = []; for (let i = 1; i < S.length; i++) { const t = S[i][0]; if (t < k * s.dauer / 3 || t >= (k + 1) * s.dauer / 3) continue; const x = t - S[i - 1][0]; if (x > 0.05 && x < 2) d.push(x); } if (d.length >= 8) schaetzer.push(med(d)); }
    for (let N = o.minBilder; N <= MAX_BILDER; N++) { const L = N / BILDRATE, Ms = new Set();
      for (const b of schaetzer) { const M = einheit * Math.round(L / (einheit * b)); if (M < Math.max(einheit, 2) || Math.abs(L / M / b - 1) > 0.12) continue; Ms.add(M); }
      for (const M of Ms) {
      const Fq = mitEins ? N * P / M : N / M;             /* Phase ueber einen Takt (mit Eins) bzw. einen Schlag */
      let best = null;
      for (let phiF = 0; phiF < Math.ceil(Fq - 1e-9); phiF++) {
        const b = bewerten(B, N, M, P, phiF, o.tol, mitEins, o);
        if (!best || b.gewichtet > best.gewichtet + 1e-12 || (Math.abs(b.gewichtet - best.gewichtet) <= 1e-12 && b.fehler < best.fehler)) best = Object.assign(b, { phiF });
      }
      if (best) alle.push(Object.assign(best, { N, M, P, d }));
    } }
    if (!alle.length) continue;
    const spitze = Math.max(...alle.map(a => a.gewichtet));
    /* Gleichstand: was hoechstens eps unter der Spitze liegt, gilt als gleich gut - dann die laengste Laenge */
    const knapp0 = alle.reduce((a, b) => b.gewichtet > a.gewichtet ? b : a), wahl = alle.filter(a => a.gewichtet >= spitze - o.eps && (!o.gleichstandZeit || a.zeit >= knapp0.zeit - o.eps)).sort((a, b) => b.N - a.N || b.gewichtet - a.gewichtet)[0];
    const knapp = alle.reduce((a, b) => b.gewichtet > a.gewichtet ? b : a);
    return Object.assign({ art: einsDa ? 'Takt' : 'ohne Einsen', spitze, spitzeN: knapp.N, kandidaten: alle.length, mitEins,
      taktgenau: bewerten(B, wahl.N, wahl.M, P, wahl.phiF, o.tol, einsDa, o).zeit, spanne: B.spanne }, wahl);
  }
  return { art: 'kein Raster' };
}

/* ---- Die ehrliche Grundlinie: heutiges ausschnitt() (brauch 1, jetzt = Songmitte). Clipschlag j liegt im Export bei
   Bild j*N/M - t0 ist die INHALTSZEIT, nicht die Lage im Clip -, also phiF = 0 auf Songzeit 0, fuer jedes t0. ---- */
function heute(s, o) {
  const S = s.schlaege || [], T = taktDaten(S); if (!(T.schlag > 0)) return { art: 'ohne Schlaege' };
  const runden = x => Math.max(2, Math.round(x * BILDRATE)) / BILDRATE;
  let takt = T.takt; const einsDa = takt > 0.05; if (!einsDa) takt = 4 * T.schlag;
  const z = Math.max(1, Math.floor(10 / takt)), L = runden(Math.min(10, z * takt)), tl = L / z, P = proTaktVon(tl, T.schlag), M = P * z, N = Math.round(L * BILDRATE);
  const B = schlaegeVorbereiten(S, T.schlag, abschnitteLesen(s.abschnitte, o.gewichte), o.einsGewicht);
  const t0 = einsDa ? T.einsen.filter(e => e <= s.dauer / 2).pop() : null;   /* Stellvertreter fuer "jetzt"; aendert die Lage im Clip nicht */
  const b = bewerten(B, N, M, P, 0, o.tol, einsDa && o.raster === 'takt');
  const schlaggenau = bewerten(B, N, M, P, 0, o.tol, false).zeit;
  /* die Rechnung vom Vormittag (nur Driftanteil, ohne Phase), zur Kontrolle der 35 % */
  let alt = null; if (einsDa) { const Lroh = Math.floor(10 / T.takt) * T.takt, drift = Math.abs(runden(Lroh) - Lroh), bt = T.takt / proTaktVon(T.takt, T.schlag), R = Math.floor(s.dauer / L) + 1;
    let ok = 0; for (let k = 0; k < R; k++) if (k * drift / bt < 1 / 8) ok++; alt = ok / R; }
  return Object.assign(b, { N, M, P, t0, schlaggenau, alt });
}

/* ---- Befund je Titel fuer die Schlechtesten ---- */
function diagnose(s, r) {
  const S = s.schlaege, T = taktDaten(S), grund = [];
  if (T.dE.length) { const inn = T.dE.filter(x => Math.abs(x / T.takt - 1) <= 0.02).length / T.dE.length; if (inn < 0.7) grund.push('Takte nur ' + Math.round(inn * 100) + ' % im Tempo'); }
  const d = []; for (let i = 1; i < S.length; i++) d.push(S[i][0] - S[i - 1][0]);
  const m = med(d), ab = d.filter(x => Math.abs(x / m - 1) > 0.05).length / d.length; if (ab > 0.2) grund.push(Math.round(ab * 100) + ' % Schlagabstaende >5 % daneben (Rubato/Erkennung)');
  const dr = [0, 1, 2].map(k => med(d.filter((x, i) => S[i][0] >= k * s.dauer / 3 && S[i][0] < (k + 1) * s.dauer / 3)));
  const sp = Math.max(...dr) / Math.min(...dr.filter(x => x > 0)); if (sp > 1.03) grund.push('Tempowechsel, je Drittel ' + dr.map(x => Math.round(60 / x)).join('/') + ' BPM');
  const mx = Math.max(...S.map(b => b[1])); if (r.P && mx !== r.P) grund.push('Zaehlung bis ' + mx + ', Takt aus Einsen ' + r.P);
  if (m < 0.33) grund.push('Schlag ' + Math.round(60 / m) + ' BPM (Doppeltempo?)'); if (m > 0.9) grund.push('Schlag ' + Math.round(60 / m) + ' BPM (Halbtempo?)');
  if (r.N) { const beat = T.takt > 0.05 ? T.takt / r.P : T.schlag, p = r.N / BILDRATE / r.M, rel = Math.abs(p / beat - 1), drift = rel * s.dauer / beat;
    if (drift > 0.3) grund.push('Bildraster: ' + r.M + ' Schlaege in ' + r.N + ' Bildern liegen ' + (rel * 1000).toFixed(1) + ' Promille neben dem Schlag, ' + drift.toFixed(1) + ' Schlaege Drift ueber das Lied'); }
  return grund.join('; ') || 'ohne auffaelligen Grund';
}

function lauf(songs, o) {
  const aus = []; let ms = 0, msMax = 0;
  for (const s of songs) { const t = process.hrtime.bigint(), neu = optimieren(s, o), dt = Number(process.hrtime.bigint() - t) / 1e6; ms += dt; msMax = Math.max(msMax, dt); aus.push({ s, neu, alt: heute(s, o) }); }
  return { aus, msJeTitel: ms / songs.length, msMax };
}
const pc = x => x == null ? '    -' : (Math.round(x * 1000) / 10).toFixed(1).padStart(5) + ' %';
function kennzahlen(r) {
  const mit = r.aus.filter(x => x.neu.N), n = mit.map(x => x.neu.zeit), a = mit.map(x => x.alt.zeit);
  return { titel: mit.length, neuMedian: med(n), neuUeber80: n.filter(x => x > 0.8).length, neuUnter50: n.filter(x => x < 0.5).length,
    neuRefrain: med(mit.map(x => x.neu.refrain).filter(x => x != null)), neuTakt: med(mit.map(x => x.neu.taktgenau)),
    altMedian: med(a), altUeber80: a.filter(x => x > 0.8).length, altRefrain: med(mit.map(x => x.alt.refrain).filter(x => x != null)),
    altDriftMedian: med(mit.map(x => x.alt.alt).filter(x => x != null)), altDriftUeber80: mit.filter(x => x.alt.alt > 0.8).length,
    Lmedian: med(mit.map(x => x.neu.N)) / BILDRATE, ms: r.msJeTitel, msMax: r.msMax };
}

const katalog = JSON.parse(zlib.gunzipSync(fs.readFileSync(KAT)));
const songs = Object.values(katalog.songs).filter(s => Array.isArray(s.schlaege) && s.schlaege.length);
const WIE = !!arg('--wie-eingebaut');   /* die drei belegten Korrekturen der Gegenpruefung, wie in web/index.html taktLage() */
const GRUND = { sichtbar: WIE, drittel: WIE, gleichstandZeit: WIE, raster: arg('--raster', 'takt'), tol: 1 / 8, einsGewicht: 1, eps: 0.01, gewichte: 'abschnitte', minBilder: MIN_BILDER, brauch: Number(arg('--brauch', 1)) || 1 };

console.log('Katalog: ' + Object.keys(katalog.songs).length + ' Titel, ' + songs.length + ' mit Schlaegen');
const haupt = lauf(songs, GRUND), K = kennzahlen(haupt), mit = haupt.aus.filter(x => x.neu.N);
console.log('\nWAHL: Raster ' + GRUND.raster + ', Toleranz 1/8 Schlag, Gleichstand 1 Prozentpunkt -> laengere Laenge, Abschnittsgewichte, N ' + MIN_BILDER + '..' + MAX_BILDER + ', brauch ' + GRUND.brauch);
console.log('  Rechenzeit je Titel ' + K.ms.toFixed(1) + ' ms, laengster ' + K.msMax.toFixed(0) + ' ms (Node, voller Suchraum, ohne Katalogladen)');
console.log('  Rechnung vom Vormittag (nur Drift, ohne Phase): Median ' + pc(K.altDriftMedian) + ', ueber 80 %: ' + K.altDriftUeber80);
console.log('  EHRLICHE Grundlinie heute (Phase 0 auf Songzeit 0): Median ' + pc(K.altMedian) + ', ueber 80 %: ' + K.altUeber80 + ', Refrain-Median ' + pc(K.altRefrain) + ', nur schlaggenau ' + pc(med(mit.map(x => x.alt.schlaggenau))));
console.log('  NEU: Median ' + pc(K.neuMedian) + ', ueber 80 %: ' + K.neuUeber80 + ', unter 50 %: ' + K.neuUnter50 + ', Refrain-Median ' + pc(K.neuRefrain) + ', taktgenau (Eins auf Eins, wo es Einsen gibt) ' + pc(K.neuTakt));
const zn = mit.map(x => x.neu.zeit);
console.log('  NEU Quantile: 10 % ' + pc(quant(zn, 0.1)) + ' · 25 % ' + pc(quant(zn, 0.25)) + ' · 75 % ' + pc(quant(zn, 0.75)) + ' · 90 % ' + pc(quant(zn, 0.9)));
const besser = mit.filter(x => x.neu.zeit > x.alt.zeit + 0.005), schlechter = mit.filter(x => x.neu.zeit < x.alt.zeit - 0.005);
console.log('  je Titel gegen heute: besser ' + besser.length + ', schlechter ' + schlechter.length + (schlechter.length ? ' (' + schlechter.map(x => x.s.titel + ' ' + pc(x.alt.zeit).trim() + ' -> ' + pc(x.neu.zeit).trim() + ', Refrain ' + pc(x.alt.refrain).trim() + ' -> ' + pc(x.neu.refrain).trim()).join('; ') + ')' : '') + ', gleich ' + (mit.length - besser.length - schlechter.length));
const arten = {}; haupt.aus.forEach(x => arten[x.neu.art] = (arten[x.neu.art] || 0) + 1); console.log('  Arten/Rueckfaelle: ' + JSON.stringify(arten));
const fach = {}; mit.forEach(x => { const k = Math.floor(x.neu.N / 30); fach[k] = (fach[k] || 0) + 1; });
console.log('  L-Verteilung (volle Sekunden): ' + Object.keys(fach).sort((a, b) => a - b).map(k => k + ' s: ' + fach[k]).join(' · ') + '; Median ' + K.Lmedian.toFixed(2) + ' s (heute ' + (med(mit.map(x => x.alt.N)) / 30).toFixed(2) + ' s)');
console.log('  Gleichstand hat verlaengert: ' + mit.filter(x => x.neu.N !== x.neu.spitzeN).length + ' Titel, im Median um ' + (med(mit.filter(x => x.neu.N !== x.neu.spitzeN).map(x => x.neu.N - x.neu.spitzeN)) || 0) + ' Bilder');
console.log('  Schlaege im Clip: ' + JSON.stringify(mit.reduce((h, x) => { h[x.neu.M] = (h[x.neu.M] || 0) + 1; return h; }, {})));
{ const ohnePh = mit.map(x => { const S = x.s.schlaege, T = taktDaten(S), B = schlaegeVorbereiten(S, T.schlag, abschnitteLesen(x.s.abschnitte, 'abschnitte'), 1); return bewerten(B, x.neu.N, x.neu.M, x.neu.P, 0, GRUND.tol, x.neu.mitEins).zeit; });
  console.log('  Zerlegung: neue Laenge mit Phase 0 ' + pc(med(ohnePh)) + ' - der Gewinn kommt aus Laenge UND Phase zusammen'); }
{ const sp = mit.map(x => x.neu.spanne / x.s.dauer); console.log('  Songzeit mit Schlaegen / Songdauer: Median ' + pc(med(sp)) + ' (Nenner der Anzeige: Songzeit mit Schlaegen)'); }

console.log('\nSCHLECHTESTE 10:');
mit.slice().sort((a, b) => a.neu.zeit - b.neu.zeit).slice(0, 10).forEach(x => console.log('  ' + pc(x.neu.zeit) + ' (heute ' + pc(x.alt.zeit) + ', Refrain ' + pc(x.neu.refrain) + ')  ' + x.s.titel.slice(0, 28).padEnd(28) + ' N ' + x.neu.N + ' M ' + x.neu.M + ' P ' + x.neu.P + ' phiF ' + x.neu.phiF + ' - ' + diagnose(x.s, x.neu)));

if (arg('--json')) fs.writeFileSync(arg('--json'), JSON.stringify(haupt.aus.map(x => ({ id: x.s.id, titel: x.s.titel, neu: x.neu, heute: x.alt })), null, 1));

if (arg('--varianten')) {
  console.log('\nVARIANTEN (je eine Stellschraube gegen die Wahl; "heute" rechnet mit derselben Toleranz):');
  const V = [['Wahl', {}], ['Raster', { raster: GRUND.raster === 'takt' ? 'schlag' : 'takt' }],
    ['Eins x2', { einsGewicht: 2 }], ['Toleranz 1/16', { tol: 1 / 16 }], ['Toleranz 1/6', { tol: 1 / 6 }],
    ['Gleichstand 0', { eps: 0 }], ['Gleichstand 2 Pp', { eps: 0.02 }], ['Gleichstand 5 Pp', { eps: 0.05 }],
    ['ohne Abschnittsgewichte', { gewichte: 'gleich' }], ['Intro/Outro 1/4', { gewichte: 'rand0' }],
    ['N ab 60 (2 s)', { minBilder: 60 }], ['N ab 180 (6 s)', { minBilder: 180 }],
    ['brauch 2', { brauch: 2 }], ['brauch 3', { brauch: 3 }], ['brauch 8', { brauch: 8 }]];
  for (const [name, d] of V) { const o = Object.assign({}, GRUND, d), k = kennzahlen(lauf(songs, o));
    console.log('  ' + (name === 'Raster' ? 'Raster ' + o.raster : name).padEnd(24) + ' neu ' + pc(k.neuMedian) + '  >80 %: ' + String(k.neuUeber80).padStart(3) + '  <50 %: ' + String(k.neuUnter50).padStart(3) + '  Refrain ' + pc(k.neuRefrain) + '  taktgenau ' + pc(k.neuTakt) + '  | heute ' + pc(k.altMedian) + ' >80 %: ' + String(k.altUeber80).padStart(3) + '  | L-Median ' + k.Lmedian.toFixed(2) + ' s  ' + k.ms.toFixed(0) + ' ms'); }
}
