/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Prüft die Lautheitsmessung des Rechenkerns gegen die Norm.
 *
 * Vorbild ist die Selbstprüfung in bin/farben.js: Dort bricht das
 * Programm ab, wenn Weiß in OKLab nicht a=0,b=0 ergibt - weil einmal ein
 * verrutschtes Komma monatelang plausibel aussehende, aber falsche Werte
 * geliefert hat. Bei der Lautheit ist die Gefahr dieselbe: Ein LUFS-Wert
 * sieht immer vernünftig aus, auch wenn Filter, Blöcke oder Tore falsch
 * sind. Erst ein Signal, dessen Ergebnis man vorher weiß, deckt das auf.
 *
 * Geprüft wird gegen ITU-R BS.1770-4 und EBU Tech 3341/3342 - mit
 * Signalen, die wir selbst erzeugen, damit keine fremde Datei nötig ist.
 *
 *   node bin/pruefe-lautheit.js
 */
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const KERN = path.join(__dirname, '..', 'web', 'fremd', 'analyzer-worker.js');

// Den Rechenkern laden. Er ist für den Browser geschrieben, braucht aber
// nur zwei Attrappen: einen Nachrichtenausgang und einen Eingang.
const umgebung = { postMessage(){}, onmessage:null, self:null, console };
umgebung.self = umgebung;
vm.createContext(umgebung);
vm.runInContext(fs.readFileSync(KERN, 'utf8'), umgebung, { filename: 'analyzer-worker.js' });

const { lautheitNachNorm, echteSpitze, kFilterKoeffizienten, biquad } = umgebung;
if (!lautheitNachNorm) { console.error('Rechenkern liefert keine lautheitNachNorm()'); process.exit(1); }

const SR = 48000;
let fehler = 0;

function pruefe(name, ist, soll, toleranz, einheit){
  const ok = Math.abs(ist - soll) <= toleranz;
  if (!ok) fehler++;
  const z = v => (v >= 0 ? '+' : '') + v.toFixed(2);
  console.log(`  ${ok ? '✓' : '✗'} ${name.padEnd(46)} ${z(ist)} ${einheit}` +
              `   (erwartet ${z(soll)} ± ${toleranz})`);
}

/** Sinus mit gegebenem Effektivwert in dBFS. */
function sinus(sekunden, hz, dbfsEffektiv, phase){
  const n = Math.round(SR*sekunden), a = Math.pow(10, dbfsEffektiv/20)*Math.SQRT2;
  const x = new Float32Array(n);
  for (let i=0;i<n;i++) x[i] = a*Math.sin(2*Math.PI*hz*i/SR + (phase||0));
  return x;
}
function stille(sekunden){ return new Float32Array(Math.round(SR*sekunden)); }
function aneinander(...teile){
  const n = teile.reduce((s,t)=>s+t.length,0), x = new Float32Array(n);
  let o=0; for (const t of teile){ x.set(t,o); o+=t.length; }
  return x;
}

console.log('\nK-Bewertung — Verstärkung der beiden Filter\n');

/* Der Frequenzgang wird gemessen, nicht behauptet: Ein Sinus geht hinein,
   der Effektivwert kommt heraus. */
function kVerstaerkung(hz){
  const kf = kFilterKoeffizienten(SR);
  const x = sinus(2, hz, -20);
  const y = biquad(biquad(x, kf[0]), kf[1]);
  const teil = i => i > x.length*0.5;            // Einschwingen überspringen
  let sx=0, sy=0, m=0;
  for (let i=0;i<x.length;i++) if (teil(i)){ sx+=x[i]*x[i]; sy+=y[i]*y[i]; m++; }
  return 10*Math.log10((sy/m)/(sx/m));
}
const k1000 = kVerstaerkung(1000);
pruefe('bei 1 kHz',        k1000,             0.69,  0.15, 'dB');
pruefe('bei 10 kHz',       kVerstaerkung(10000), 4.00,  0.30, 'dB');
/* Nicht 0 dB: Der RLB-Hochpass hat Q≈0,5 und steigt sehr sanft an.
   Rechnerisch |H| = r²/|1-r²+j·r/Q| mit r = 100/38,135 = 2,62 → -1,17 dB.
   Die erste Fassung dieser Prüfung erwartete hier 0 dB - falsch geraten,
   und die Probe hat es gefangen. Genau dafür ist sie da. */
pruefe('bei 100 Hz',       kVerstaerkung(100),  -1.17,  0.15, 'dB');
pruefe('bei 20 Hz (Hochpass greift)', kVerstaerkung(20), -13.0, 1.5, 'dB');

console.log('\nAbsolutwert — Formel gegen Umsetzung\n');

/* Für einen reinen Sinus lässt sich der Sollwert von Hand ausrechnen:
     L = -0,691 + 10·log10(Kanäle) + Pegel + K-Verstärkung
   Weicht die Umsetzung davon ab, stimmt etwas an Blöcken oder Toren. */
for (const pegel of [-23, -33]){
  const s = sinus(20, 1000, pegel);
  const r = lautheitNachNorm(s, s, SR);
  const soll = -0.691 + 10*Math.log10(2) + pegel + k1000;
  pruefe(`Stereo-Sinus ${pegel} dBFS`, r.integriert, soll, 0.1, 'LUFS');
}

/* EBU Tech 3341, Fall 1 und 2 - die eigentliche Normprobe.

   Achtung, hier steckt eine Falle: Der Pegel im Testsignal ist der
   SCHEITELWERT, nicht der Effektivwert. Ein Sinus mit Scheitel -23 dBFS
   hat einen Effektivwert von -26,02 dBFS; zusammen mit der Kanalsummierung
   (+3,01), der Konstanten (-0,691) und der K-Bewertung bei 1 kHz (+0,69)
   ergibt das genau -23,0 LUFS. Wer den Pegel als Effektivwert liest,
   landet bei -20 und hält die eigene Umsetzung für kaputt. */
function sinusScheitel(sekunden, hz, dbfsScheitel){
  const n = Math.round(SR*sekunden), a = Math.pow(10, dbfsScheitel/20);
  const x = new Float32Array(n);
  for (let i=0;i<n;i++) x[i] = a*Math.sin(2*Math.PI*hz*i/SR);
  return x;
}
console.log('\nEBU Tech 3341 — Absolutkalibrierung\n');
for (const p of [-23, -33]){
  const s = sinusScheitel(20, 1000, p);
  pruefe('Fall: Sinus 1 kHz, Scheitel ' + p + ' dBFS',
         lautheitNachNorm(s, s, SR).integriert, p, 0.1, 'LUFS');
}

console.log('\nTore — die eigentliche Kunst\n');

/* Absolutes Tor: Stille darf den Wert NICHT nach unten ziehen. */
{
  const laut = sinus(20, 1000, -23);
  const s = aneinander(stille(10), laut, stille(10));
  const r = lautheitNachNorm(s, s, SR);
  const soll = lautheitNachNorm(laut, laut, SR).integriert;
  pruefe('Stille ringsum ändert nichts', r.integriert, soll, 0.1, 'LUFS');
}

/* Relatives Tor: Ein zehn LU leiserer Teil muss ausgeschlossen werden.
   Ohne das zweite Tor läge das Ergebnis deutlich tiefer. */
{
  const laut = sinus(20, 1000, -23), leise = sinus(20, 1000, -43);
  const s = aneinander(laut, leise);
  const r = lautheitNachNorm(s, s, SR);
  const nurLaut = lautheitNachNorm(laut, laut, SR).integriert;
  pruefe('leiser Teil (-20 LU) wird ausgeschlossen', r.integriert, nurLaut, 0.2, 'LUFS');
  const ohneTor = 10*Math.log10((Math.pow(10,(nurLaut+0.691)/10)+Math.pow(10,(nurLaut-20+0.691)/10))/2)-0.691;
  console.log(`     ohne das relative Tor käme ${ohneTor.toFixed(2)} LUFS heraus`);
}

console.log('\nSchwankungsbreite (EBU Tech 3342)\n');

/* Wechsel zwischen zwei Pegeln mit zehn LU Abstand ergibt LRA ≈ 10 LU. */
{
  const teile = [];
  for (let i=0;i<10;i++) teile.push(sinus(5, 1000, -20), sinus(5, 1000, -30));
  const s = aneinander(...teile);
  const r = lautheitNachNorm(s, s, SR);
  pruefe('Wechsel -20/-30 dBFS', r.schwankung, 10.0, 1.0, 'LU');
}
{
  const s = sinus(30, 1000, -23);
  const r = lautheitNachNorm(s, s, SR);
  pruefe('gleichbleibender Pegel', r.schwankung, 0.0, 0.3, 'LU');
}

console.log('\nSpitzenwert zwischen den Abtastwerten (BS.1770 Anhang 2)\n');

/* Der klassische Fall: ein Sinus bei einem Viertel der Abtastrate, so
   gelegt, dass keine Probe den Scheitel trifft. Der Abtastwert liegt
   3 dB zu tief - genau das soll die Überabtastung aufdecken. */
{
  const n = SR, x = new Float32Array(n);
  for (let i=0;i<n;i++) x[i] = Math.sin(2*Math.PI*(SR/4)*i/SR + Math.PI/4);
  const r = echteSpitze([x, x], SR);
  pruefe('Abtastspitze (liegt zu tief)', 20*Math.log10(r.abtast), -3.01, 0.1, 'dBFS');
  pruefe('echte Spitze findet den Scheitel', 20*Math.log10(r.echt), 0.0, 0.4, 'dBTP');
}

console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen.\n` : '\nAlle Prüfungen bestanden.\n');
process.exit(fehler ? 1 : 0);
