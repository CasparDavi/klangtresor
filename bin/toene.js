#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Was in den Stems steht: Huellkurven, Tonart, Stimmlage.
 *
 *   node bin/toene.js                  alle Songs mit Stems, die noch fehlen
 *   node bin/toene.js <id>             nur diesen (und zeigen)
 *   node bin/toene.js --neu            alles neu rechnen
 *   node bin/toene.js --anzahl 5       nur fuenf (zum Probieren)
 *   node bin/toene.js --still          ohne Lebenszeichen
 *
 * Ergebnis: library/toene.json  { stand, verfahren, songs: { id: {...} } }
 *   huellen   je Stem eine Reihe 0..255, zehn Werte je Sekunde
 *   notenzonen{ raster, schlaege, zonen:[[vonMs,bisMs,teil,...12 Bytes]] }
 *   tonart    { grund, art, klein, gross, woher, einsAnteil }
 *   stimme    { lage, p25, median, n }
 *
 * WARUM DAS HIER GEHT UND FRUEHER NICHT. Drei Sachen greifen ineinander,
 * die einzeln nichts taugen:
 *
 *   DIE STEMS machen das Signal einstimmig genug. Im Vollmix ist jede
 *   Tonhoehenmessung ein Ratespiel; auf dem Bass-Stem ist sie eindeutig.
 *
 *   SUNOS SCHLAEGE sagen, wo eine Note steht. Damit darf das Messfenster
 *   so lang werden wie die Note - und lange Fenster sind der ganze
 *   Unterschied: 400 ms statt 21 ms bedeuten 2,9 Hz statt 46,9 Hz
 *   Aufloesung. Die alte Tonhoehe hatte fuer 321 Songs genau 15
 *   verschiedene Werte, weil sie den nackten FFT-Bin nahm.
 *
 *   YIN IM ZEITBEREICH kennt gar kein Bin-Raster. Gemessen wird nicht
 *   AUF dem Schlag, sondern dazwischen: der Anschlag ist transient und
 *   traegt keine Tonhoehe.
 *
 * Gegenprobe an "Stars of the deep": 100 % der Basstoene liegen in
 * einer einzigen Dur-Leiter (Zufall waere 58 %), die Abweichung vom
 * Halbtonraster betraegt 5 Cent - ein Stimmgeraet arbeitet mit +-5.
 *
 * Braucht die Stems aus bin/stems.js. Ohne sie passiert nichts.
 */
'use strict';
const fs   = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const WURZEL = path.join(__dirname, '..');
const SONGS  = path.join(WURZEL, 'library', 'songs');
const ZIEL   = path.join(WURZEL, 'library', 'toene.json');
/* EINE SAMMELDATEI, wie ueberall im Haus (Caspar_D, 24.08.2026: "gleiches
   system wie bei allen anderen auch, sammeldateien"). Je Song eine Datei
   waeren auf dieser Platte 321 MB statt 20: exFAT hat hier 1 MB
   Blockgroesse, und 65 KB belegen trotzdem ein volles Megabyte.
   Der Browser laedt sie nicht als Ganzes - der Server schneidet den
   einen Song heraus, den er braucht. */
const ZONEN  = path.join(WURZEL, 'library', 'notenzonen.json');
const K      = require('./katalog.js');
const args   = process.argv.slice(2);

const still  = args.includes('--still');
const neu    = args.includes('--neu');
const anzahl = (() => { const i = args.indexOf('--anzahl');
  return i >= 0 && args[i+1] ? parseInt(args[i+1], 10) : null; })();
const nur    = args.find(a => /^[0-9a-f-]{30,}$/i.test(a)) || null;

const STEMS = ['drums','bass','other','vocals','guitar','piano'];
const NOTEN = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','H'];
const HUELL_PRO_S = 10;          // zehn Werte je Sekunde, wie Sunos welle nur feiner
const SR_TON = 22050;            // fuer die Tonhoehe reichlich

/* Je Stem ein eigener Suchbereich. Ein Bass liegt nicht bei 800 Hz, und
   wer das zulaesst, bekommt Oktavfehler geschenkt. */
const BEREICH = { bass:[35,400], vocals:[65,900], guitar:[70,1200],
                  piano:[55,1200], other:[55,1200] };

function pcm(datei, sr) {
  const ff = spawnSync('ffmpeg', ['-v','error','-i',datei,'-ac','1','-ar',String(sr),
    '-f','f32le','-'], { maxBuffer: 1 << 29, encoding: 'buffer' });
  if (ff.status !== 0) return null;
  return new Float32Array(ff.stdout.buffer, ff.stdout.byteOffset, ff.stdout.byteLength >> 2);
}

/* ---- Huellkurve ------------------------------------------------------ */
/* Effektivwert je Fenster, dann auf 0..255. Der Bezug ist der lauteste
   Wert DIESES Stems, nicht des Mixes: Sonst waere die Klavierspur eines
   Metalstuecks eine flache Linie, und man saehe nicht, wann sie spielt. */
function huelle(datei, sr) {
  const x = pcm(datei, sr); if (!x) return null;
  const breite = Math.round(sr / HUELL_PRO_S);
  const n = Math.floor(x.length / breite);
  const roh = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = i*breite; j < (i+1)*breite; j++) s += x[j]*x[j];
    roh[i] = Math.sqrt(s / breite);
  }
  let max = 0; for (const v of roh) if (v > max) max = v;
  if (max <= 0) return { reihe: Array.from(roh, () => 0), spitze: 0 };
  /* Wurzel-Kennlinie: Leises bleibt sichtbar. Linear waere alles unter
     -20 dB ein Strich auf der Grundlinie. */
  return { reihe: Array.from(roh, v => Math.round(255 * Math.sqrt(v / max))),
           spitze: +max.toFixed(5) };
}

/* ---- Tonhoehe: YIN mit Oktavkorrektur -------------------------------- */
function yin(x, von, len, tauMin, tauMax) {
  if (von + len + tauMax >= x.length) return null;
  const d = new Float32Array(tauMax + 1);
  for (let tau = tauMin; tau <= tauMax; tau++) {
    let s = 0;
    for (let j = 0; j + tau < len; j++) { const v = x[von+j] - x[von+j+tau]; s += v*v; }
    d[tau] = s;
  }
  const dn = new Float32Array(tauMax + 1);
  let lauf = 0;
  for (let tau = tauMin; tau <= tauMax; tau++) { lauf += d[tau];
    dn[tau] = d[tau] * (tau - tauMin + 1) / (lauf || 1e-9); }
  let best = -1;
  for (let tau = tauMin+1; tau < tauMax; tau++)
    if (dn[tau] < 0.15 && dn[tau] <= dn[tau-1] && dn[tau] <= dn[tau+1]) { best = tau; break; }
  if (best < 0) return null;
  /* OKTAVFIX: Fehler gehen immer nach OBEN - YIN greift gern die halbe
     Periode ab. Also nachsehen, ob das doppelte oder vierfache tau auch
     ein Tal ist; ist es fast so gut, war der Grundton dort. Gemessen an
     "Noch lachst Du": ohne den Fix meldete YIN 415 Hz, richtig sind 104. */
  for (const f of [2,3,4]) {
    const t2 = best * f; if (t2 > tauMax) break;
    let tal = -1, bes = Infinity;
    for (let t = Math.max(tauMin, t2-2); t <= Math.min(tauMax, t2+2); t++)
      if (dn[t] < bes) { bes = dn[t]; tal = t; }
    if (tal > 0 && bes < 0.25 && bes < dn[best] * 1.6) best = tal;
  }
  const a = dn[best-1], b = dn[best], c = dn[best+1];
  return SR_TON / (best + (a - c) / (2*(a - 2*b + c) || 1e-9));
}

/* Noten je Schlag. Sunos Zaehlzeiten geben die Fenster vor; gemessen
   wird zwischen den Schlaegen, nicht auf ihnen. */
function zerlegen(id, stem, schlaege) {
  const datei = path.join(SONGS, id, 'stems', stem + '.flac');
  if (!fs.existsSync(datei)) return null;
  const x = pcm(datei, SR_TON); if (!x) return null;
  const [fLo, fHi] = BEREICH[stem] || [55,1200];
  const tauMin = Math.floor(SR_TON/fHi), tauMax = Math.ceil(SR_TON/fLo);

  const probe = Math.round(0.05*SR_TON), rms = [];
  for (let i = 0; i+probe < x.length; i += probe) {
    let s = 0; for (let j = 0; j < probe; j++) s += x[i+j]*x[i+j];
    rms.push(Math.sqrt(s/probe));
  }
  const sort = rms.slice().sort((a,b)=>a-b);
  const schwelle = Math.max(sort[Math.floor(sort.length*0.55)] || 0, 2e-4);

  const aus = [];
  for (let i = 0; i+1 < schlaege.length; i++) {
    const t0 = schlaege[i][0], t1 = schlaege[i+1][0], L = t1 - t0;
    if (L <= 0 || L > 2) { aus.push(null); continue; }
    const von = Math.round((t0 + L*0.15) * SR_TON);
    const bis = Math.round((t1 - L*0.10) * SR_TON);
    if (bis - von < tauMax*2) { aus.push(null); continue; }
    let e = 0, len0 = bis - von;
    for (let j = von; j < bis && j < x.length; j++) e += x[j]*x[j];
    if (Math.sqrt(e/len0) < schwelle) { aus.push(null); continue; }

    /* VIERTEL, ACHTEL, SECHZEHNTEL: von fein nach grob probieren. Die
       feinere Teilung wird nur genommen, wenn ihre Teile sich wirklich
       unterscheiden - sonst war es eine Note, nur zweimal gemessen, und
       dann ist das lange Fenster das genauere. */
    const messen = (a, b) => {
      const L2 = b - a; if (L2 < tauMax*2) return null;
      const w = [];
      for (const off of [0, L2 >> 2]) {
        const f = yin(x, a+off, Math.min(L2-off, Math.round(0.20*SR_TON)), tauMin, tauMax);
        if (f && f >= fLo && f <= fHi) w.push(f);
      }
      if (!w.length) return null;
      w.sort((a2,b2)=>a2-b2);
      return w[w.length>>1];
    };
    let gewaehlt = null;
    for (const teilung of [4,2,1]) {
      const breite = (bis - von) / teilung;
      if (breite < tauMax*2.2) continue;
      const teile = [];
      for (let t = 0; t < teilung; t++) {
        const f = messen(Math.round(von + t*breite), Math.round(von + (t+1)*breite));
        if (!f) { teile.length = 0; break; }
        teile.push(69 + 12*Math.log2(f/440));
      }
      if (teile.length !== teilung) continue;
      let verschieden = false;
      for (let t = 1; t < teile.length; t++)
        if (Math.abs(teile[t] - teile[t-1]) > 0.5) verschieden = true;
      if (teilung === 1 || verschieden) { gewaehlt = teile; break; }
    }
    aus.push(gewaehlt);
  }
  return aus;
}

/* ---- Notenzonen: das Chroma je Zone, vorgerechnet -------------------- */
/* WARUM HIER UND NICHT IM BROWSER (Caspar_D, 24.08.2026: "jetzt müssen wir
   wieder alles vorrechnen, weil sonst es zu lange dauert"): Die tonreine
   Messung kostet je Song rund 260 Millionen Operationen; im Hauptthread
   des Browsers steht dafuer die Oberflaeche sekundenlang. Hier laeuft sie
   einmal und liegt danach als Zahlenreihe bereit.

   Gemessen wird mit Goertzel bei JEDER Halbtonfrequenz, nicht mit einer
   FFT, deren lineares Raster auf die Halbtoene gerundet wird: Bei
   fftSize 1024 deckt ein Bin im Bass elf Halbtoene ab - dort wird nicht
   gemessen, sondern geraten. */
const CQ_GUETE = 17, CQ_VON = 36, CQ_BIS = 95;        /* C2 bis H6 */
const BASS_GUETE = 6, BASS_VON = 40, BASS_BIS = 51;   /* E2 bis D#3 */
/* 0,88 statt 0,93 (Caspar_D, 24.08.2026, nach der Messung an 530
   Vergleichen: 0,93 liess bei manchen Stuecken 42 % Sechzehntel
   stehen, 0,88 haelt rund 79 % der Taktschlaege ungeteilt). Je hoeher
   die Schwelle, desto eher gelten zwei Haelften als verschieden und
   desto feiner wird geteilt. */
const ZONE_SCHWELLE = 0.88;
const SR_ZONE = 44100;

function goertzelZ(x, von, N, f, sr) {
  if (!x || N < 16) return 0;
  if (von < 0) von = 0;
  if (von + N > x.length) von = x.length - N;
  if (von < 0) return 0;
  const w = 2*Math.PI*f/sr, cw = 2*Math.cos(w);
  let s1 = 0, s2 = 0, s0;
  for (let i = 0; i < N; i++) {
    const fen = 0.5 - 0.5*Math.cos(2*Math.PI*i/(N-1));
    s0 = x[von+i]*fen + cw*s1 - s2; s2 = s1; s1 = s0;
  }
  return Math.sqrt(Math.max(0, s1*s1 + s2*s2 - cw*s1*s2))/N;
}

/* Beide Kanaele, BETRAEGE addiert - nicht die Signale, sonst loeschen
   sich gegenphasige Anteile aus. */
function chromaVektor(kanaele, sr, t0, t1, guete, von, bis) {
  const mitte = Math.round((t0+t1)/2*sr);
  const v = new Float64Array(12);
  let traf = 0;
  for (let midi = von; midi <= bis; midi++) {
    const f = 440*Math.pow(2, (midi-69)/12);
    const N = Math.round(guete*sr/f);
    if (N < 16) continue;
    let e = 0;
    for (const k of kanaele) if (k) e += goertzelZ(k, mitte-(N>>1), N, f, sr);
    v[((midi%12)+12)%12] += e; traf++;
  }
  return traf ? v : null;
}

function aehnlichZ(a, b) {
  let z = 0, na = 0, nb = 0;
  for (let i = 0; i < 12; i++) { z += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return z/(Math.sqrt(na*nb) || 1e-9);
}

function pcmStereo(datei, sr) {
  const ff = spawnSync('ffmpeg', ['-v','error','-i',datei,'-ac','2','-ar',String(sr),
    '-f','f32le','-'], { maxBuffer: 1 << 30, encoding: 'buffer' });
  if (ff.status !== 0) return null;
  const roh = new Float32Array(ff.stdout.buffer, ff.stdout.byteOffset, ff.stdout.byteLength >> 2);
  const n = roh.length >> 1;
  const l = new Float32Array(n), r = new Float32Array(n);
  for (let i = 0; i < n; i++) { l[i] = roh[i*2]; r[i] = roh[i*2+1]; }
  return [l, r];
}

function notenzonen(id, schlaege) {
  if (!schlaege || schlaege.length < 8) return null;
  const wav = path.join(SONGS, id, 'audio.wav');
  const bassDatei = path.join(SONGS, id, 'stems', 'bass.flac');
  if (!fs.existsSync(wav)) return null;
  const mix = pcmStereo(wav, SR_ZONE);
  if (!mix) return null;
  const bass = fs.existsSync(bassDatei) ? pcmStereo(bassDatei, SR_ZONE) : null;

  const zonen = [], teilZaehl = { 1:0, 2:0, 4:0 };
  for (let i = 0; i+1 < schlaege.length; i++) {
    const t0 = schlaege[i][0], t1 = schlaege[i+1][0], L = t1 - t0;
    if (!(L > 0) || L > 2) continue;
    const von = t0 + L*0.15, bis = t1 - L*0.08;
    if (bis <= von) continue;

    /* HIERARCHISCH: erst die Haelften, dann - nur wenn noetig - innerhalb
       der Haelften. Von fein nach grob gewann die feinste Stufe fast
       immer, weil dort ein abweichendes Paar von dreien genuegte. */
    const quelle = bass || mix;
    const g = bass ? BASS_GUETE : CQ_GUETE;
    const vv = bass ? BASS_VON : CQ_VON, bb = bass ? BASS_BIS : CQ_BIS;
    const teile = (n) => {
      const br = (bis-von)/n, aus = [];
      for (let k = 0; k < n; k++) {
        const m = chromaVektor(quelle, SR_ZONE, von+k*br, von+(k+1)*br, g, vv, bb);
        if (!m) return null; aus.push(m);
      }
      return aus;
    };
    let teilung = 1;
    const h = teile(2);
    if (h && aehnlichZ(h[1], h[0]) < ZONE_SCHWELLE) {
      teilung = 2;
      const v4 = teile(4);
      if (v4 && (aehnlichZ(v4[1],v4[0]) < ZONE_SCHWELLE
              || aehnlichZ(v4[3],v4[2]) < ZONE_SCHWELLE)) teilung = 4;
    }
    teilZaehl[teilung]++;

    const brf = (bis-von)/teilung;
    for (let t = 0; t < teilung; t++) {
      const v = chromaVektor(mix, SR_ZONE, von+t*brf, von+(t+1)*brf, CQ_GUETE, CQ_VON, CQ_BIS);
      if (!v) continue;
      zonen.push({ a: von+t*brf, b: von+(t+1)*brf, teil: teilung, v });
    }
  }
  if (!zonen.length) return null;

  const alle = [];
  for (const z of zonen) for (let n = 0; n < 12; n++) alle.push(z.v[n]);
  alle.sort((a,b) => a-b);
  const p95 = alle[Math.floor(alle.length*0.95)] || 1;

  return {
    raster: bass ? 'bass' : 'mix',
    schlaege: teilZaehl,
    /* Kompakt: Anfang und Ende in Millisekunden, Teilung, dann zwoelf Bytes. */
    zonen: zonen.map(z => [Math.round(z.a*1000), Math.round(z.b*1000), z.teil].concat(
      Array.from(z.v, x => Math.round(255*Math.min(1, Math.sqrt(x/p95)))))),
  };
}

/* ---- Tonart: Grundton aus dem Bass, Geschlecht aus der Terz ---------- */
const DUR  = [6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88];
const MOLL = [6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
function korr(a, b) {
  const n = a.length, ma = a.reduce((x,y)=>x+y,0)/n, mb = b.reduce((x,y)=>x+y,0)/n;
  let z=0, na=0, nb=0;
  for (let i=0;i<n;i++){ const da=a[i]-ma, db=b[i]-mb; z+=da*db; na+=da*da; nb+=db*db; }
  return z / (Math.sqrt(na*nb) || 1e-9);
}

function tonart(noten, schlaege) {
  const melodisch = new Array(12).fill(0);
  const bassEins  = new Array(12).fill(0);
  const alle      = new Array(12).fill(0);
  let anzahlToene = 0;
  for (const stem of ['bass','guitar','piano','vocals']) {
    const r = noten[stem]; if (!r) continue;
    for (let i = 0; i < r.length; i++) {
      if (!r[i]) continue;
      for (const midi of r[i]) {
        const pc = ((Math.round(midi) % 12) + 12) % 12;
        anzahlToene++;
        /* Der Bass zaehlt fuer den Tonvorrat weniger - er spielt
           Grundtoene, keine Leiter. Fuer den GRUNDTON zaehlt er allein. */
        alle[pc] += stem === 'bass' ? 0.5 : 1;
        if (stem === 'bass') { if ((schlaege[i]||[])[1] === 1) bassEins[pc]++; }
        else melodisch[pc]++;
      }
    }
  }
  if (anzahlToene < 30) return null;

  const einsSum = bassEins.reduce((a,b)=>a+b,0);
  let g, woher;
  if (einsSum >= 12) { g = bassEins.indexOf(Math.max(...bassEins)); woher = 'bass'; }
  else {
    let best = -2;
    for (let t = 0; t < 12; t++) for (const p of [DUR, MOLL]) {
      const r = korr(alle, p.map((_,i)=>p[(i-t+12)%12]));
      if (r > best) { best = r; g = t; }
    }
    woher = 'leiter';
  }

  /* Die Terz entscheidet, sonst nichts: Dur und Moll teilen sechs von
     sieben Toenen. Drei Halbtoene ueber dem Grundton heisst Moll, vier
     heisst Dur - gezaehlt nur in den melodischen Stems.
     UND WENN KEINE TERZ DA IST, wird auch keine behauptet. Powerchords
     (Grundton plus Quinte) sind hier die Regel, und dort IST das
     Geschlecht offen. Angezeigt wird dann nur der Grundton. */
  const melSum = melodisch.reduce((a,b)=>a+b,0) || 1;
  const klein = melodisch[(g+3)%12] / melSum;
  const gross = melodisch[(g+4)%12] / melSum;
  const art = (klein + gross < 0.06) ? null : (klein > gross ? 'Moll' : 'Dur');

  return { grund: NOTEN[g], art,
           name: NOTEN[g] + (art ? ' ' + art : ''),
           klein: +klein.toFixed(3), gross: +gross.toFixed(3),
           woher, einsAnteil: einsSum ? +(bassEins[g]/einsSum).toFixed(2) : 0,
           toene: anzahlToene };
}

/* ---- Stimmlage ------------------------------------------------------- */
/* Aus dem vocals-Stem, nicht aus dem Mix. Das alte Verfahren fragte im
   Vollmix "hat dieses Fenster Mitten?" und hielt Regen fuer eine
   Frauenstimme. Hier ist der Gesang getrennt, und wo nichts gesungen
   wird, wird nichts gemessen.
   Genommen wird das untere Viertel, nicht der Median: Was an
   Oktavfehlern uebrig bleibt, geht nach oben.
 *
 * EIGENE MESSUNG, NICHT DIE NOTENZERLEGUNG (gefunden 24.08.2026): Die
 * Zerlegung verlangt je Schlagzone EINEN stabilen Ton - richtig fuer
 * Noten, aber eine gepresste Stimme liefert den selten. "Noch lachst Du"
 * kam so auf fuenf Werte und musste mit "?" antworten, obwohl der
 * Grundton bei 104 Hz klar messbar ist. Fuer eine Verteilung zaehlt
 * nicht die Sauberkeit der einzelnen Note, sondern die Menge: kurze
 * Fenster, dichter Vorschub, und alles behalten, was YIN hergibt. */
function stimmMessung(id, schlaege) {
  const datei = path.join(SONGS, id, 'stems', 'vocals.flac');
  if (!fs.existsSync(datei)) return [];
  const x = pcm(datei, SR_TON); if (!x) return [];
  const [fLo, fHi] = BEREICH.vocals;
  const tauMin = Math.floor(SR_TON/fHi), tauMax = Math.ceil(SR_TON/fLo);
  const FEN = Math.round(0.060*SR_TON), HOP = Math.round(0.020*SR_TON);

  const rms = [];
  for (let i = 0; i+FEN < x.length; i += HOP) {
    let s2 = 0; for (let j = 0; j < FEN; j++) s2 += x[i+j]*x[i+j];
    rms.push(Math.sqrt(s2/FEN));
  }
  const sort = rms.slice().sort((a,b)=>a-b);
  const schwelle = Math.max(sort[Math.floor(sort.length*0.60)] || 0, 1e-4);

  const f = [];
  for (let i = 0; i+1 < schlaege.length; i++) {
    const t0 = schlaege[i][0], t1 = schlaege[i+1][0], L = t1 - t0;
    if (L <= 0 || L > 2) continue;
    for (let t = t0 + L*0.15; t < t1 - L*0.10; t += HOP/SR_TON) {
      const i2 = Math.round(t*SR_TON);
      if (rms[Math.floor(i2/HOP)] < schwelle) continue;
      const hz = yin(x, i2, FEN, tauMin, tauMax);
      if (hz && hz >= fLo && hz <= fHi) f.push(69 + 12*Math.log2(hz/440));
    }
  }
  return f;
}

function stimme(id, schlaege) {
  const f = stimmMessung(id, schlaege);
  if (f.length < 20) return { lage: '?', grund: 'zu wenig Gesang', n: f.length };
  f.sort((a,b)=>a-b);
  const q = p => f[Math.floor(f.length*p)];
  const p25 = q(0.25), median = q(0.5);
  const hz = m => 440 * Math.pow(2, (m-69)/12);
  /* Die Grenze liegt bei rund 200 Hz. Zwischen 180 und 210 ueberlappen
     sich Tenor und Alt wirklich - dort wird nicht geraten. */
  const p25hz = hz(p25);
  let lage;
  if (p25hz < 180) lage = 'männlich';
  else if (p25hz > 210) lage = 'weiblich';
  else lage = '?';
  return { lage, p25: +p25hz.toFixed(0), median: +hz(median).toFixed(0), n: f.length };
}

/* Die Sammeldatei fortschreiben. Gelesen wird sie einmal und im
   Speicher gehalten; geschrieben nach jedem Song, damit ein Abbruch
   nicht alles verliert. */
let _zonenAlle = null;
function zonenAblegen(id, nz) {
  if (!_zonenAlle) {
    try { _zonenAlle = JSON.parse(fs.readFileSync(ZONEN, 'utf8')).songs || {}; }
    catch (e) { _zonenAlle = {}; }
  }
  _zonenAlle[id] = nz;
  fs.writeFileSync(ZONEN, JSON.stringify({
    stand: new Date().toISOString(),
    verfahren: 'Goertzel je Halbtonfrequenz, beide Kanaele, Raster aus dem Bass',
    songs: _zonenAlle }));
}

/* ---- Ein Lied -------------------------------------------------------- */
function vermessen(s) {
  const ordner = path.join(SONGS, s.id, 'stems');
  const huellen = {};
  for (const stem of STEMS) {
    const h = huelle(path.join(ordner, stem + '.flac'), 8000);
    if (h) huellen[stem] = h.reihe;
  }
  const noten = {};
  for (const stem of ['bass','guitar','piano','vocals'])
    noten[stem] = zerlegen(s.id, stem, s.schlaege || []);
  /* Die Notenzonen wandern in eine eigene Datei - sie sind mit 64 KB je
     Song das Zwanzigfache von allem anderen zusammen, und der Browser
     braucht immer nur die eines Songs. In toene.json bleibt der Vermerk,
     dass es sie gibt. */
  const nz = notenzonen(s.id, s.schlaege || []);
  if (nz) zonenAblegen(s.id, nz);
  return {
    huellen, proSekunde: HUELL_PRO_S,
    hatNotenzonen: !!nz,
    zonenRaster: nz ? nz.raster : null,
    zonenSchlaege: nz ? nz.schlaege : null,
    tonart: tonart(noten, s.schlaege || []),
    stimme: stimme(s.id, s.schlaege || []),
    stand: new Date().toISOString(),
  };
}

/* ---- Lauf ------------------------------------------------------------ */
(() => {
  const katalog = K.lesen();
  if (!katalog) { console.log('  Töne: noch kein Katalog.'); return; }
  let alt = { songs: {} };
  try { alt = JSON.parse(fs.readFileSync(ZIEL, 'utf8')); } catch (e) {}
  const ergebnis = alt.songs || {};

  let liste = Object.values(katalog.songs || {})
    .filter(s => fs.existsSync(path.join(SONGS, s.id, 'stems', 'piano.flac')));
  if (nur) liste = liste.filter(s => s.id === nur);
  else if (!neu) liste = liste.filter(s => !ergebnis[s.id]);
  if (anzahl) liste = liste.slice(0, anzahl);

  if (!liste.length) { console.log('  Töne: nichts zu tun (Stems fehlen oder alles gerechnet).'); return; }
  console.log('  Töne: ' + liste.length + ' Lied(er)');

  let i = 0;
  for (const s of liste) {
    i++;
    const t0 = Date.now();
    try {
      const e = vermessen(s);
      ergebnis[s.id] = e;
      if (!still) {
        const t = e.tonart, v = e.stimme;
        console.log('  [' + i + '/' + liste.length + '] ' + (s.titel||s.id).slice(0,30).padEnd(32)
          + (t ? t.name : '—').padEnd(10)
          + (v ? v.lage : '—').padEnd(11)
          + ((Date.now()-t0)/1000).toFixed(0) + ' s');
      }
    } catch (err) {
      console.log('  [' + i + '] ' + (s.titel||s.id).slice(0,30) + '  gescheitert: '
        + String(err.message).slice(0,60));
    }
    fs.writeFileSync(ZIEL, JSON.stringify({
      stand: new Date().toISOString(),
      verfahren: 'Huellkurven aus den Stems · Tonart: Grundton aus dem Bass auf der Eins, '
               + 'Geschlecht aus der Terz · Stimmlage: YIN auf dem vocals-Stem, unteres Viertel',
      songs: ergebnis }, null, 0));
  }
  console.log('  → ' + ZIEL);
})();
