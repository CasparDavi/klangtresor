#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Stoerfrequenzen finden (Caspar_D, 23.08.2026: "gezielt eine Stoerfrequenz
 * durch einen Single-Band-Filter ausloeschen - aber automatisch erkannt").
 *
 *   node bin/stoerfrequenz.js               alle Songs ohne Eintrag
 *   node bin/stoerfrequenz.js <id>          nur einen, mit Protokoll
 *   node bin/stoerfrequenz.js --neu         alles neu
 *   node bin/stoerfrequenz.js --anzahl 20   hoechstens 20 Songs
 *
 * Was ein Stoerton ist: eine SCHMALE Spitze im Spektrum, die ueber den
 * ganzen Song STEHT - Brummen, Pfeifen, eine Resonanz. Musik steht
 * nicht: Toene wechseln mit der Harmonie und tragen Obertonreihen.
 *
 * Verfahren: ffmpeg liefert Mono-Float (44,1 kHz). FFT mit 16384 Punkten
 * (2,7 Hz Aufloesung), Hann, Hop 8192. Je Bin: der MEDIAN der dB-Werte
 * ueber alle Fenster (was staendig da ist) und die HERVORHEBUNG gegen die
 * glatte Nachbarschaft (gleitender Median ueber +-1/3 Oktave). Dazu die
 * DAUER: Anteil der Fenster, in denen der Bin seine Nachbarschaft um
 * mehr als 6 dB ueberragt. Kandidat: lokales Maximum, Hervorhebung >= 12
 * dB, Breite < 1/3 Oktave (Halbwertsbreite), Dauer >= 80 %, nicht Glied
 * einer Obertonreihe mit ebenso dauerhaftem Grundton (dann ist es Musik).
 *
 * Ergebnis: library/stoerfrequenzen.json { stand, songs: { id: [ {hz, db,
 * dauer, breiteHz} ] } } - eine Liste je Song, leer = sauber. Das Studio
 * zeigt sie im Glockenstuhl als Vorschlag; gefiltert wird nichts
 * automatisch.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const K = require('./katalog.js');

const WURZEL = path.join(__dirname, '..');
const SONGS = path.join(WURZEL, 'library', 'songs');
const ZIEL = path.join(WURZEL, 'library', 'stoerfrequenzen.json');
const args = process.argv.slice(2);
const nur = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--anzahl');   // Wert hinter --anzahl ist keine Song-ID
const neu = args.includes('--neu');
const anzahl = args.includes('--anzahl') ? +args[args.indexOf('--anzahl') + 1] : Infinity;
const laut = !!nur || args.includes('--laut');

const SR = 44100, N = 16384, HOP = 8192;
const FMIN = 30, FMAX = 16000;

function pcmLaden(mp3) {
  const ff = spawnSync('ffmpeg', ['-v', 'error', '-i', mp3, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  if (ff.status !== 0) throw new Error('ffmpeg: ' + String(ff.stderr || '').trim().slice(0, 120));
  const b = ff.stdout;
  return new Float32Array(b.buffer, b.byteOffset, b.byteLength >> 2);
}

/* Radix-2-FFT, in-place, reell genutzt (im = 0) */
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const a = i + j, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }
}
const hann = Float32Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)));

const DRITTEL = Math.pow(2, 1 / 3);

/* Gleitender Median ueber +-1/3 Oktave (in Bins) - die "glatte Nachbarschaft".
 *
 * MIT EINEM MITGESCHOBENEN HISTOGRAMM (26.08.2026). Vorher wurde je Bin
 * ein Array kopiert und sortiert: bei k = 5000 sind das 2300 Werte, und
 * das fuer jeden der 5900 Bins - zusammen 8 Millionen Werte, jeder als
 * Fliesskommazahl in einem gewoehnlichen Array, jede Fensterlage frisch
 * sortiert. Das war mit Abstand der zweitteuerste Posten des ganzen
 * Detektors (878 ms von 6448 je Song).
 *
 * Zwei Beobachtungen machen es billig:
 *   1. Die Werte sind Stufen von 0 bis 255 - ein Histogramm mit 256
 *      Faechern ist also EXAKT, keine Naeherung. Den Median findet man
 *      darin, indem man aufsummiert, bis die Haelfte ueberschritten ist.
 *   2. lo und hi wachsen beide monoton mit k. Das Fenster wandert also
 *      nur, es springt nie zurueck - man kann die herausfallenden Werte
 *      abziehen und die neuen dazuzaehlen, statt es neu zu fuellen.
 *
 * Gemessen: 878 ms -> 3 ms, und in allen 5934 Bins derselbe Wert wie
 * vorher. Kein Genauigkeitsverlust, weil nichts gerundet wird.
 *
 * Der Median wird auf den STUFEN gebildet, nicht auf den dB-Werten. Das
 * ist dasselbe: zuDb ist streng monoton, und der Median einer monoton
 * abgebildeten Menge ist das Bild ihres Medians. */
function nachbarschaft(stufen, kMin, kMax, zuDb) {
  const aus = new Float32Array(stufen.length);
  const fach = new Int32Array(256);
  let cl = -1, ch = -1, n = 0;
  for (let k = kMin; k < kMax; k++) {
    const lo = Math.max(kMin, Math.floor(k / DRITTEL)), hi = Math.min(kMax - 1, Math.ceil(k * DRITTEL));
    if (cl < 0) { for (let i = lo; i <= hi; i++) { fach[stufen[i]]++; n++; } cl = lo; ch = hi; }
    else {
      while (ch < hi) { ch++; fach[stufen[ch]]++; n++; }
      while (cl < lo) { fach[stufen[cl]]--; n--; cl++; }
    }
    let summe = 0; const ziel = n >> 1;
    for (let i = 0; i < 256; i++) { summe += fach[i]; if (summe > ziel) { aus[k] = zuDb(i); break; } }
  }
  return aus;
}

function analysieren(pcm) {
  const bins = N / 2, kMin = Math.max(1, Math.floor(FMIN * N / SR)), kMax = Math.min(bins, Math.ceil(FMAX * N / SR));
  const rahmen = Math.floor((pcm.length - N) / HOP) + 1;
  if (rahmen < 8) return { kandidaten: [], rahmen };
  const re = new Float32Array(N), im = new Float32Array(N);
  /* dB je Rahmen und Bin (Uint8: 0..255 ~ -120..0 dB, 0,47 dB je Stufe) - spart Speicher bei langen Songs */
  const alle = new Uint8Array(rahmen * bins);
  for (let r = 0; r < rahmen; r++) {
    const off = r * HOP;
    for (let i = 0; i < N; i++) { re[i] = pcm[off + i] * hann[i]; im[i] = 0; }
    fft(re, im);
    /* Math.sqrt statt Math.hypot (26.08.2026): hypot sichert gegen
       Ueberlauf ab, indem es erst skaliert - eine Vorsicht, die hier
       nichts nuetzt (die Betraege liegen weit im Mittelfeld) und den
       Schritt mehr als verdoppelt. Gemessen 535 -> 247 ms je Song. */
    for (let k = 0; k < bins; k++) { const m = Math.sqrt(re[k] * re[k] + im[k] * im[k]) / (N / 4); const db = m > 1e-6 ? 20 * Math.log10(m) : -120; alle[r * bins + k] = Math.max(0, Math.min(255, Math.round((db + 120) / 120 * 255))); }
  }
  const zuDb = (v) => v / 255 * 120 - 120;
  /* Median je Bin ueber die Zeit - auch hier ueber ein 256er-Histogramm
     statt ueber sort() (26.08.2026, 153 -> 32 ms). Die Werte sind schon
     Stufen, das Histogramm ist also exakt. medU behaelt sie als Stufen,
     denn die Nachbarschaft rechnet gleich darauf weiter. */
  const medU = new Uint8Array(bins), med = new Float32Array(bins);
  const fach = new Int32Array(256);
  for (let k = kMin; k < kMax; k++) {
    fach.fill(0);
    for (let r = 0; r < rahmen; r++) fach[alle[r * bins + k]]++;
    let summe = 0; const ziel = rahmen >> 1;
    for (let i = 0; i < 256; i++) { summe += fach[i]; if (summe > ziel) { medU[k] = i; break; } }
    med[k] = zuDb(medU[k]);
  }
  const glatt = nachbarschaft(medU, kMin, kMax, zuDb);
  /* Kandidaten: lokale Maxima der Hervorhebung */
  const kand = [];
  for (let k = kMin + 2; k < kMax - 2; k++) {
    const herv = med[k] - glatt[k];
    if (herv < 12) continue;
    if (!(med[k] >= med[k - 1] && med[k] >= med[k + 1] && med[k] >= med[k - 2] && med[k] >= med[k + 2])) continue;
    /* Halbwertsbreite: wie weit faellt es um 6 dB ab */
    let lo = k, hi = k; while (lo > kMin && med[lo] > med[k] - 6) lo--; while (hi < kMax - 1 && med[hi] > med[k] - 6) hi++;
    const breiteHz = (hi - lo) * SR / N, fc = k * SR / N;
    if (breiteHz > fc * (Math.pow(2, 1 / 6) - Math.pow(2, -1 / 6))) continue;   // breiter als 1/3 Oktave: kein Ton
    /* Dauer: Anteil der Rahmen, in denen der Bin die Nachbarschaft um > 6 dB ueberragt */
    let da = 0; const nLo = Math.max(kMin, Math.floor(k / DRITTEL)), nHi = Math.min(kMax - 1, Math.ceil(k * DRITTEL));
    for (let r = 0; r < rahmen; r++) { const v = zuDb(alle[r * bins + k]); let s = 0, n2 = 0; for (let j = nLo; j <= nHi; j += Math.max(1, (nHi - nLo) >> 4)) { s += zuDb(alle[r * bins + j]); n2++; } if (v - s / n2 > 6) da++; }
    const dauer = da / rahmen;
    if (dauer < 0.8) continue;
    kand.push({ k, hz: +fc.toFixed(1), db: +herv.toFixed(1), dauer: +dauer.toFixed(2), breiteHz: +breiteHz.toFixed(1), pegel: +med[k].toFixed(1) });
  }
  /* Dicht liegende Linien (innerhalb eines Halbtons) sind EIN Befund - ein
     schmales Band wie das Regenzischen in "Erste Regentropfen" (10,4-10,7 kHz,
     sechs Linien), nicht sechs Stoertoene (Review 23.08.). Die staerkste
     Linie vertritt die Gruppe, 'linien' zaehlt sie, 'vonHz'/'bisHz' spannen. */
  kand.sort((a, b) => a.hz - b.hz);
  const gruppen = [];
  for (const c of kand) { const g = gruppen[gruppen.length - 1];
    if (g && c.hz / g[g.length - 1].hz < Math.pow(2, 1 / 12)) g.push(c); else gruppen.push([c]); }
  kand.length = 0;
  for (const g of gruppen) { const best = g.reduce((m, c) => c.db > m.db ? c : m, g[0]);
    if (g.length > 1) { best.linien = g.length; best.vonHz = g[0].hz; best.bisHz = g[g.length - 1].hz; }
    kand.push(best); }
  /* Musik oder Stoerung? (Probelauf 23.08.: "Atem der Nacht III" hielt
     586,8 + 465,7 Hz = D5 + A#4, eine grosse Terz - ein Ambient-Akkord.)
     Tonname und Cent-Abweichung je Kandidat; Obertonreihen (n x f0) und
     musikalische Intervalle zwischen Kandidaten (Quinte, Quarte, Terzen,
     Oktave) gelten als Musik. Brummen sitzt auf 50/100/150 Hz, ein
     Pfeifen selten sauber auf einer Note - das bleibt Kandidat. */
  const NOTEN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'H'];
  for (const c of kand) { const m = 69 + 12 * Math.log2(c.hz / 440), n2 = Math.round(m); c.note = NOTEN[((n2 % 12) + 12) % 12] + (Math.floor(n2 / 12) - 1); c.cent = Math.round((m - n2) * 100); }
  const INTERVALLE = [2, 1.5, 4 / 3, 1.25, 1.2, 1.6, 5 / 3, 3, 4];
  const musik = new Set();
  for (const a of kand) for (const b of kand) { if (a === b || b.hz <= a.hz) continue; const v = b.hz / a.hz;
    const n2 = Math.round(v); if (n2 >= 2 && Math.abs(v - n2) < 0.03) { musik.add(a); musik.add(b); continue; }
    if (INTERVALLE.some(iv => Math.abs(v / iv - 1) < 0.015)) { musik.add(a); musik.add(b); } }
  const brumm = (hz) => [50, 60].some(g => [1, 2, 3, 4, 5, 6].some(n2 => Math.abs(hz - g * n2) < 2));
  for (const c of kand) c.art = brumm(c.hz) ? 'Brummen' : musik.has(c) ? 'wahrscheinlich Musik' : Math.abs(c.cent) <= 8 ? 'Ton auf Note' : 'Stoerton';
  const kandidaten = kand.sort((a, b) => b.db - a.db).slice(0, 6).map(({ k, ...rest }) => rest);
  return { kandidaten, rahmen, musik: kand.filter(c => musik.has(c)).length };
}

/* ---- Lauf ---- */
let alt = { stand: null, songs: {} };
try { alt = JSON.parse(fs.readFileSync(ZIEL, 'utf8')); } catch (e) {}
const katalog = K.lesen();
if (!katalog) { console.log('  Stoerfrequenzen: noch kein Katalog - erst sammeln.'); process.exit(0); }
let liste = Object.values(katalog.songs || {}).filter(s => !s.fremd);
if (nur) liste = liste.filter(s => s.id === nur || s.id.startsWith(nur));
else if (!neu) liste = liste.filter(s => !alt.songs[s.id]);
liste.sort((a, b) => String(b.erstellt || '').localeCompare(String(a.erstellt || '')));
liste = liste.filter(s => fs.existsSync(path.join(SONGS, s.id, 'audio.mp3'))).slice(0, anzahl);
if (!liste.length) { console.log('  Stoerfrequenzen: nichts zu tun.'); process.exit(0); }
/* Nur ein Lauf zur Zeit (Schloss mit PID): die Schaltflaeche im Tonstudio und ein Lauf aus
   dem Terminal sollen sich nicht gegenseitig die Datei ueberschreiben (23.08.2026).
   Atomar angelegt ('wx'), ein liegengebliebenes Schloss zaehlt nur, wenn die PID lebt UND
   wirklich ein Detektor ist (ps) - sonst wird es weggeraeumt. Keine SIGINT/SIGTERM-Handler:
   die Schleife ist synchron, Node kaeme erst am Ende dazu; Ctrl-C soll sofort wirken. */
const SCHLOSS = path.join(WURZEL, 'library', 'stoerfrequenz.lock');
const schlossLebt = (pid) => { try { process.kill(pid, 0); } catch (e) { return false; }
  const ps = spawnSync('ps', ['-o', 'command=', '-p', String(pid)], { encoding: 'utf8' });
  return ps.status !== 0 || /stoerfrequenz/.test(ps.stdout || ''); };
for (let versuch = 0; versuch < 2; versuch++) {
  try { fs.writeFileSync(SCHLOSS, String(process.pid), { flag: 'wx' }); break; }
  catch (e) {
    let pid = 0;
    for (let lesen = 0; lesen < 5 && !pid; lesen++) {       /* frisch angelegt, aber noch leer? kurz warten */
      try { pid = +fs.readFileSync(SCHLOSS, 'utf8'); } catch (e2) {}
      if (!pid) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
    if (pid && pid !== process.pid && schlossLebt(pid)) { console.log(`  Stoerfrequenzen: laeuft schon (PID ${pid}) - nichts gestartet.`); process.exit(0); }
    try { fs.unlinkSync(SCHLOSS); } catch (e2) {}
  }
}
process.on('exit', () => { try { if (+fs.readFileSync(SCHLOSS, 'utf8') === process.pid) fs.unlinkSync(SCHLOSS); } catch (e) {} });
/* Schreiben = frisch lesen und die eigenen Ergebnisse darueberlegen - nie den Stand anderer verlieren. */
const schreiben = () => { let j = { songs: {} }; try { j = JSON.parse(fs.readFileSync(ZIEL, 'utf8')); } catch (e) {}
  j.songs = Object.assign(j.songs || {}, alt.songs); j.stand = new Date().toISOString(); j.version = alt.version; j.fft = alt.fft; j.sr = alt.sr;
  fs.writeFileSync(ZIEL, JSON.stringify(j)); };
console.log(`  Stoerfrequenzen: ${liste.length} Songs (FFT ${N}, ${(SR / N).toFixed(1)} Hz Aufloesung)`);
const t0 = Date.now(); let n = 0, mit = 0;
for (const s of liste) {
  try {
    const pcm = pcmLaden(path.join(SONGS, s.id, 'audio.mp3'));
    const erg = analysieren(pcm);
    alt.songs[s.id] = erg.kandidaten;
    n++; if (erg.kandidaten.length) mit++;
    if (laut || erg.kandidaten.length) console.log(`  ${erg.kandidaten.length ? 'TREFFER ' : '        '}${(s.titel || s.id).slice(0, 40).padEnd(40)} ${erg.kandidaten.map(c => `${c.hz} Hz ${c.note}${c.cent >= 0 ? '+' : ''}${c.cent}c +${c.db} dB ${Math.round(c.dauer * 100)} % [${c.art}]`).join(' | ') || 'sauber'}${laut ? `  [${erg.rahmen} Fenster, ${erg.musik} als Musik verworfen]` : ''}`);
    if (n % 10 === 0) schreiben();
  } catch (e) { console.log(`  Fehler ${s.id.slice(0, 8)}: ${e.message}`); }
}
schreiben();
console.log(`  fertig: ${n} Songs in ${((Date.now() - t0) / 1000).toFixed(0)} s, ${mit} mit Kandidaten -> library/stoerfrequenzen.json`);
