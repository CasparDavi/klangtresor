#!/usr/bin/env node
/* TAKTGITTER JE SONG - Tempo, Phase, Taktanfang (16.11.2026)
 * ==========================================================
 *
 * Wozu. Fuer das Kuerzen auf eine Ziellaenge muessen Schnitte auf
 * Taktgrenzen liegen - sonst holpert es, auch wenn der Klang passt.
 * Dafuer braucht jeder Song drei Zahlen: wie schnell er laeuft (BPM),
 * wo der erste Schlag liegt (Phase) und welcher der vier Schlaege der
 * Taktanfang ist.
 *
 * Woher. Die Analyse (library/analyse-index.json) hat Lautheit, Dynamik,
 * Stereo und TONART fuer alle Songs - aber kein Tempo. Nachgesehen am
 * 16.11.2026: kein einziges Feld bpm/tempo/beat/takt im ganzen Index.
 * Gerechnet wird darum hier, einmal je Song, aus dem Schlagzeug-Stem.
 *
 * Warum aus drums.flac und nicht aus dem Mix. Im Mix liegen Gesang,
 * Flaechen und Hall ueber den Schlaegen; im Stem steht der Puls allein.
 * 346 der 347 Songs haben Stems (gemessen 16.11.2026) - der eine ohne
 * bekommt kein Gitter und wird als fehlend ausgewiesen, nicht geraten.
 *
 * SUNO TRIFFT DAS BESTELLTE TEMPO NICHT. Kupala-Nacht wurde mit 75 BPM
 * bestellt und kam mit 71,79 (Uebergabe der Sitzung "Snegurotschka
 * Mythos", 16.11.2026). Der Stilprompt ist eine Bestellung, kein
 * Ergebnis - er wird hier nur zum Plausibilisieren danebengelegt,
 * niemals als Wahrheit genommen.
 *
 * WAS DAS SKRIPT NICHT TUT: es faellt kein Urteil ueber Songs, deren
 * Puls es nicht findet. Ein unsicheres Tempo wird MIT seiner Guete
 * geschrieben, damit die Oberflaeche es grau zeigen kann. Erfundene
 * Gewissheit waere schlimmer als eine Luecke.
 *
 * Aufruf:
 *   node bin/takt.js                 alle Songs ohne Eintrag
 *   node bin/takt.js <id> [<id>…]    nur diese (auch neu rechnen)
 *   node bin/takt.js --aus <datei>   anderes Ziel (fuer Proben)
 *   node bin/takt.js --neu           alles neu rechnen
 *
 * Ausgabe: library/takt.json
 *   { stand, songs: { <id>: { bpm, phase, eins, guete, quelle } } }
 *   bpm    Schlaege je Minute, zwei Stellen
 *   phase  Sekunde des ersten Schlags (0 .. 60/bpm)
 *   eins   welcher Schlag ab phase der Taktanfang ist (0..3)
 *   guete  Spitze der Autokorrelation gegen ihren Median (1 = nichts
 *          gefunden, ab etwa 2 brauchbar) - die Zahl, an der die
 *          Oberflaeche entscheidet, ob sie das Gitter anbietet
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execFileSync } = require('child_process');
const os = require('os');

const WURZEL = path.join(__dirname, '..');
const LIB = path.join(WURZEL, 'library');
const SONGS = path.join(LIB, 'songs');
const ZIEL_VORGABE = path.join(LIB, 'takt.json');

const SR = 11025;        /* fuer den Puls reicht das - Schlaege sind tief und breit */
const HOP = 128;         /* 86 Fenster je Sekunde: ein Schlag bei 160 BPM ist 32 Fenster lang */
const BPM_MIN = 60, BPM_MAX = 160, BPM_SCHRITT = 0.01;

/* ---------- ffmpeg finden: derselbe Weg, den die App geht ----------
   Seit dem 17.11.2026 fragt das bin/werkzeug.js - dieselbe Suche stand im Haus viermal, und die
   Fassung im Export kannte `where` nicht und scheiterte auf Windows (Apex). Erst das Mitgelieferte
   unter werkzeug/, dann der Suchpfad; findet sie nichts, bleibt der nackte Name. */
const FFMPEG = require('./werkzeug.js').pfad('ffmpeg');

/* ---------- Rohspur holen ----------
 * Zwei Spuren in EINEM ffmpeg-Lauf: die ganze Trommelspur fuer das
 * Tempo, und ihr Tiefpass fuer die Phase. Der Tiefpass bei 150 Hz laesst
 * die Bassdrum stehen und schneidet Becken weg - die liegen oft VOR dem
 * Schlag (Anspielgeraeusch) und ziehen die Phase nach vorn. */
function spurenHolen(drums, tmp) {
  const voll = path.join(tmp, 'drums.f32');
  const tief = path.join(tmp, 'kick.f32');
  execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', drums,
    '-ac', '1', '-ar', String(SR), '-f', 'f32le', voll,
    '-ac', '1', '-ar', String(SR), '-af', 'lowpass=f=150', '-f', 'f32le', tief],
    { stdio: ['ignore', 'ignore', 'pipe'] });
  return { voll, tief };
}
function lesen(f) {
  const b = fs.readFileSync(f);
  return new Float32Array(b.buffer, b.byteOffset, b.length / 4);
}

/* ---------- Anschlagskurve ----------
 * Je Fenster die Energie in dB, davon nur der ZUWACHS. Ein Schlag ist
 * ein Sprung nach oben; dass es danach laut BLEIBT, sagt nichts ueber
 * den Puls. Negative Aenderungen fallen also weg. */
function anschlaege(x, hop = HOP) {
  const n = Math.floor(x.length / hop);
  const e = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = 0; j < hop; j++) { const v = x[i * hop + j]; s += v * v; }
    e[i] = Math.log(1e-9 + s);
  }
  const o = new Float64Array(n);
  for (let i = 1; i < n; i++) o[i] = Math.max(0, e[i] - e[i - 1]);
  return o;
}

/* ---------- Tempo ----------
 * Autokorrelation der Anschlagskurve: bei welchem Abstand gleicht die
 * Kurve sich selbst am besten? Gemessen wird in der MITTE des Songs
 * (40 bis 80 Prozent) - Intro und Ausklang sind oft frei oder
 * ausgeduennt und verwaessern den Puls.
 *
 * Die GUETE ist die Spitze geteilt durch den Median aller Werte. Bei
 * einem klaren Puls ragt die Spitze heraus; bei einem Stueck ohne
 * Schlagzeug liegt alles gleich hoch und die Guete bleibt bei 1. */
function tempoFinden(o, fps) {
  const n = o.length;
  const a = Math.floor(n * 0.40), b = Math.floor(n * 0.80);
  if (b - a < fps * 10) return null;            /* unter zehn Sekunden Messstrecke: nichts behaupten */
  const werte = [];
  for (let bpm = BPM_MIN; bpm <= BPM_MAX + 1e-9; bpm += BPM_SCHRITT) {
    const L = 60 / bpm * fps;
    let s = 0, c = 0;
    for (let i = a; i < b; i++) {
      const j = i + L, j0 = Math.floor(j), f = j - j0;
      if (j0 + 1 >= n) break;
      s += o[i] * (o[j0] * (1 - f) + o[j0 + 1] * f);
      c++;
    }
    if (c) werte.push([s / c, bpm]);
  }
  if (!werte.length) return null;
  const sortiert = werte.map(w => w[0]).sort((p, q) => p - q);
  const median = sortiert[Math.floor(sortiert.length / 2)] || 1e-12;
  const spitze = werte.reduce((m, w) => (w[0] > m[0] ? w : m), werte[0]);
  return { bpm: spitze[1], guete: spitze[0] / median, median, werte };
}

/* ---------- Tempo nachschaerfen ----------
 * Der Raster von 0,01 BPM ist fuer die Suche richtig (10 000 Schritte)
 * und fuer das ERGEBNIS zu grob: 0,01 BPM sind bei einem siebenminuetigen
 * Stueck rund 58 ms Versatz am Ende (gemessen an Kupala-Nacht,
 * 16.11.2026). Darum wird um die gefundene Spitze noch einmal in
 * 0,001er-Schritten gesucht - diesmal ueber den GANZEN Song, denn
 * jetzt geht es um die Genauigkeit auf die Laenge, nicht ums Finden. */
function tempoSchaerfen(o, fps, bpm, median) {
  const n = o.length;
  const a = Math.floor(n * 0.08), b = Math.floor(n * 0.92);
  let beste = bpm, bestS = -1;
  for (let v = bpm - 0.05; v <= bpm + 0.05 + 1e-9; v += 0.001) {
    const L = 60 / v * fps;
    let s = 0, c = 0;
    for (let i = a; i < b; i++) {
      const j = i + L, j0 = Math.floor(j), f = j - j0;
      if (j0 + 1 >= n) break;
      s += o[i] * (o[j0] * (1 - f) + o[j0 + 1] * f);
      c++;
    }
    if (c && s / c > bestS) { bestS = s / c; beste = v; }
  }
  return { bpm: Math.round(beste * 1000) / 1000, guete: bestS / (median || 1e-12) };
}

/* ---------- Oktavfrage: die Halbierung ist draußen ----------
 * Zuerst stand hier eine Regel, die das halbe Tempo nahm, wenn es
 * fast so gut abschnitt (Faktor 0,85) - "Musik zählt nach unten".
 * Gegen Sunos acht exakte Studio-Werte geprüft, hat sie in VIER von
 * acht Fällen halbiert, und in allen vier war Sunos Zählung die
 * doppelte: 140, 120, 129, 125.
 *
 * Caspar_D, 16.11.2026: "es ist nur schneller gezählt, wo ist das
 * Problem". Richtig - die Schlagpositionen sind dieselben, bei 70 BPM
 * liegt jeder zweite Schlag von 140. Falsch wird nichts. Es kostet
 * aber AUFLÖSUNG: ein Takt wäre 3,4 s statt 1,7 s, und geschnitten
 * werden könnte nur an jeder zweiten möglichen Taktgrenze. Bei einer
 * Ziellänge, die auf Sekunden ankommt, ist das die halbe Wahl.
 * Dazu rutscht die Eins: der ausgewiesene Taktanfang wäre bei Sunos
 * Zählung erst jeder zweite.
 *
 * Darum gelöscht: das schnellere Zählen ist das nützlichere. Wer die
 * Regel wiederhaben will, muss erst zeigen, wofür ein gröberes Gitter
 * besser wäre. */

/* ---------- Phase ----------
 * Wo liegt der erste Schlag? Die Bassdrum-Energie wird auf allen
 * moeglichen Rastern aufsummiert; das Raster mit der meisten Energie
 * gewinnt. Gemessen in 2-ms-Schritten ueber den ganzen Song. */
function phaseFinden(kick, bpm, von, bis) {
  const B = 60 / bpm;
  const dauer = kick.length / SR;
  const a = von == null ? 0 : von, b = bis == null ? dauer : Math.min(bis, dauer);
  const fenster = Math.round(0.03 * SR);        /* 30 ms Anschlag */
  let beste = 0, bestS = -1;
  for (let ph = 0; ph < B; ph += 0.002) {
    let s = 0;
    for (let k = Math.ceil((a - ph) / B); ph + k * B + 0.03 < b; k++) {
      const i0 = Math.floor((ph + k * B) * SR);
      if (i0 < 0) continue;
      for (let i = i0; i < i0 + fenster; i++) s += kick[i] * kick[i];
    }
    if (s > bestS) { bestS = s; beste = ph; }
  }
  return beste;
}

/* ---------- Das Raster auf die echten Schläge legen ----------
 * WARUM DIE AUTOKORRELATION NICHT REICHT (gemessen 16.11.2026). Sie
 * findet, bei welchem Abstand die Anschlagskurve sich selbst gleicht -
 * nicht, wo die Schläge liegen. Für Kupala-Nacht gab sie 71,777 BPM,
 * die Übergabe hatte 71,79. Gegen Caspar_Ds abgenommene Schnitte
 * geprüft, wanderte die Abweichung systematisch: -50, -47, -43, -29,
 * -8, +5, +14 ms über den Song. 0,013 BPM sind über 386 s eben 64 ms.
 * Für Schnitte auf Taktgrenzen ist das zu viel.
 *
 * EINZELNE SCHLÄGE ANZUPEILEN WAR DER FALSCHE WEG (verworfen am
 * 16.11.2026). Der erste Versuch suchte zu jedem erwarteten Schlag den
 * stärksten Anschlag in ±0,25 Schlag und legte eine Gerade durch die
 * Punkte. Ergebnis: 117 bis 137 ms Restmaß bei JEDEM Song, auch bei
 * denen mit klarem Puls. Das ist kein Musikbefund, das ist die Breite
 * des Suchfensters: ±197 ms gleichverteilt ergeben 2*197/sqrt(12) =
 * 114 ms. Wo kein eindeutiger Anschlag liegt, fällt die Wahl zufällig,
 * und 500 zufällige Punkte tragen keine Gerade.
 *
 * STATTDESSEN: KEINE EINZELENTSCHEIDUNGEN. Gesucht wird das gleich-
 * mäßige Raster, das insgesamt am meisten Bassdrum-Energie einfängt -
 * Tempo und Phase zusammen, in einem Durchgang. Jedes Raster bekommt
 * eine Summe; die größte gewinnt. Kein Schlag muss einzeln erkannt
 * werden, fehlende Schläge tragen einfach nichts bei.
 *
 * Dafür wird die Bassdrum-Energie auf Millisekunden eingedickt und
 * daraus die Summe über ein 30-ms-Fenster vorberechnet. Ein Raster zu
 * bewerten kostet dann nur noch einen Zugriff je Schlag, und die Suche
 * über 51 Tempi x 400 Phasen bleibt unter einer Sekunde.
 *
 * DIE GÜTE IST DAS VERHÄLTNIS zur mittleren Rasterausbeute: wie stark
 * ragt das beste Raster aus allen heraus. Bei einem klaren Puls ist es
 * ein Vielfaches, bei einem Stück ohne Schlagzeug liegt es bei 1. */
const MS = 1000;                 /* Auflösung der Hüllkurve: eine Millisekunde */
const ANSCHLAG_MS = 30;          /* so breit ist ein Bassdrum-Anschlag */

function huellkurveMs(kick) {
  const n = Math.floor(kick.length / SR * MS);
  const pro = SR / MS;                                  /* Samples je Millisekunde */
  const h = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    const a = Math.floor(i * pro), b = Math.floor((i + 1) * pro);
    for (let j = a; j < b; j++) s += kick[j] * kick[j];
    h[i] = s;
  }
  /* Laufende Summe über das Anschlagsfenster - danach ist f[i] die
     Energie von i bis i+30 ms, in einem Zugriff. */
  const f = new Float64Array(n);
  let lauf = 0;
  for (let i = 0; i < n; i++) {
    lauf += h[i];
    if (i >= ANSCHLAG_MS) lauf -= h[i - ANSCHLAG_MS];
    const k = i - ANSCHLAG_MS + 1;
    if (k >= 0) f[k] = lauf;
  }
  return f;
}

function rasterSuchen(kick, bpm) {
  const f = huellkurveMs(kick);
  const n = f.length;
  if (n < 20000) return null;                           /* unter 20 s: nichts behaupten */
  const bewerten = (v, phMs) => {
    const Bms = 60 / v * MS;
    let s = 0, c = 0;
    for (let t = phMs; t < n; t += Bms) { s += f[Math.round(t)]; c++; }
    return c ? s / c : 0;                               /* Mittel, damit Tempi vergleichbar sind */
  };
  /* ZWEI DURCHGÄNGE, UND DAS FENSTER MUSS WEIT SEIN (16.11.2026).
     Der erste Versuch suchte nur ±0,05 BPM um die Autokorrelation.
     Gegen Sunos acht exakte Studio-Werte geprüft, lag das Ergebnis
     systematisch 0,07 bis 0,54 Prozent zu niedrig - bei 98 BPM sind
     das 0,44 BPM, also zehnmal mehr, als das Fenster überhaupt
     zuließ. Die Korrektur konnte gar nicht hinkommen.
     Jetzt: grob über ±1,2 BPM, dann fein um den Treffer. */
  let best = { s: -1, bpm, phase: 0 };
  const alle = [];
  const durchgang = (von, bis, schritt, phSchritt) => {
    for (let v = von; v <= bis + 1e-9; v += schritt) {
      const Bms = 60 / v * MS;
      for (let ph = 0; ph < Bms; ph += phSchritt) {
        const s = bewerten(v, ph);
        alle.push(s);
        if (s > best.s) best = { s, bpm: v, phase: ph / MS };
      }
    }
  };
  durchgang(bpm - 1.2, bpm + 1.2, 0.02, 4);
  const grob = best.bpm;
  durchgang(grob - 0.03, grob + 0.03, 0.002, 1);

  /* DIE KORREKTUR BRAUCHT EINEN SIGNIFIKANZTEST (16.11.2026).
     Bei dichter Bassdrum sammelt ein leicht verstimmtes Raster beim
     Wandern durch die Achtel mehr Treffer als ein starres auf den
     Vierteln. Gemessen an Snegurotschka: 76,085 BPM fängt 8 Prozent
     mehr Energie als 76,0 - und verfehlt Caspar_Ds abgenommene
     Schnitte um bis zu 203 ms, wo 76,0 sie auf 7 ms trifft.
     Echte Korrekturen sehen anders aus: bei Tag X gewinnt die
     Rastersuche das Dreifache (33,6 gegen 100 Prozent), bei Pasta al
     Limone das Vierfache. Darum gilt die Korrektur nur ab Faktor 1,5;
     darunter bleibt das Tempo der Autokorrelation stehen und nur die
     Phase wird übernommen. */
  let bestePhaseFuer = (v) => {
    const Bms = 60 / v * MS;
    let bs = -1, bp = 0;
    for (let ph = 0; ph < Bms; ph += 1) { const s = bewerten(v, ph); if (s > bs) { bs = s; bp = ph; } }
    return { s: bs, phase: bp / MS };
  };
  const anker = bestePhaseFuer(bpm);
  if (anker.s > 0 && best.s < anker.s * 1.5) best = { s: anker.s, bpm, phase: anker.phase, treu: true };
  if (best.s <= 0) return null;
  const sortiert = alle.sort((a, b) => a - b);
  const median = sortiert[Math.floor(sortiert.length / 2)] || 1e-12;
  /* Liegt zwischen den Schlägen auch Energie? Dann zählt der Song
     schneller, als die Autokorrelation gefunden hat. */
  const Bms = 60 / best.bpm * MS, phMs = best.phase * MS;
  let haupt = 0, hc = 0, zw = 0, zc = 0;
  for (let t = phMs; t < n; t += Bms) { haupt += f[Math.round(t)] || 0; hc++; }
  for (let t = phMs + Bms / 2; t < n; t += Bms) { zw += f[Math.round(t)] || 0; zc++; }
  const verhaeltnis = (hc && zc && haupt) ? (zw / zc) / (haupt / hc) : null;
  return {
    zwischen: verhaeltnis == null ? null : Math.round(verhaeltnis * 100) / 100,
    bpm: Math.round(best.bpm * 1000) / 1000,
    phase: Math.round(best.phase * 1000) / 1000,
    schaerfe: Math.round((best.s / median) * 100) / 100,
    treu: !!best.treu            /* true = das Tempo der Autokorrelation blieb stehen */
  };
}

/* ---------- Drift: der Umweg, der verworfen wurde ----------
 * Phase und Tempo gelten nur GEMEINSAM: 0,01 BPM summieren sich bei
 * Kupala-Nacht über 400 s zu 58 ms. Die Oberfläche muss also wissen,
 * ob ein Tempo den ganzen Song trägt. Zwei Wege wurden gebaut und
 * beide verworfen, am 16.11.2026:
 *
 * ERSTENS die lokale Phase in drei Abschnitten, verglichen. Ergebnis
 * 212 ms bei Snegurotschka, 370 ms bei Kupala - bei einem Schlag von
 * 790 ms wäre das Gitter damit unbrauchbar, und die Übergabe hat an
 * beiden Songs gar keine Drift gefunden. Der Grund: die lokale Phase
 * ist selbst unsicher. Ihre Güte lag im ersten Abschnitt bei 2,67, in
 * den anderen bei 1,83 und 1,91 - dort spielt die Bassdrum so dicht,
 * dass fast jedes Raster gleich gut passt. Gemessen wurde Rauschen.
 *
 * ZWEITENS das Tempo je Songhälfte, verglichen. Ergebnis 2984 ms bei
 * Snegurotschka: die zweite Hälfte gab 74,9 statt 76,0 BPM. Nachge-
 * messen lag dort 74,9 bei Güte 1,86 und 76,0 bei 1,81 - drei Prozent
 * auseinander, also wieder ein Nebenmaximum in einer flachen Kurve.
 * Caspar_Ds Fassung D schneidet mit 76,0 noch bei 318 s sauber.
 *
 * Beide Funktionen sind GELÖSCHT, nicht abgeklemmt. Das Restmaß der
 * Rasteranpassung (passung, in ms) sagt dasselbe ehrlicher: ein
 * falsches Tempo lässt die Anschläge wandern, und genau das misst es.
 * Diese Begründung bleibt stehen, damit niemand den Umweg über
 * Hälften oder lokale Phasen ein zweites Mal baut. */

/* ---------- Taktanfang ----------
 * Von vier Schlaegen traegt einer das Gewicht. Die Bassdrum-Energie
 * wird je Schlagnummer mod 4 aufsummiert; die schwerste ist die Eins.
 * Gezaehlt wird nur in der Mitte des Songs, aus demselben Grund wie
 * beim Tempo. */
function einsFinden(kick, bpm, phase) {
  const B = 60 / bpm;
  const dauer = kick.length / SR;
  const von = dauer * 0.40, bis = dauer * 0.80;
  const fenster = Math.round(0.03 * SR);
  const acc = [0, 0, 0, 0];
  let k = 0;
  for (let t = phase; t + 0.03 < dauer; t += B, k++) {
    if (t < von || t > bis) continue;
    const i0 = Math.floor(t * SR);
    let s = 0;
    for (let i = i0; i < i0 + fenster; i++) s += kick[i] * kick[i];
    acc[k % 4] += s;
  }
  const max = Math.max(...acc);
  const eins = acc.indexOf(max);
  const mittel = acc.reduce((a, b) => a + b, 0) / 4 || 1e-12;
  return { eins, kontrast: max / mittel };
}

/* ---------- Bestellung aus dem Stilprompt ----------
 * Nur zum Danebenlegen. Suno haelt sich nicht daran (Kupala: 75
 * bestellt, 71,79 geliefert), also entscheidet die Zahl NICHTS - sie
 * geht in den Eintrag, damit ein Mensch sehen kann, wie weit das
 * Ergebnis von der Bestellung abweicht. */
function bestelltesTempo(s) {
  const txt = [s && s.stilPrompt, s && s.style, s && s.tags].filter(Boolean).join(' ');
  const m = /(\d{2,3})\s*(?:bpm|BPM)/.exec(txt);
  if (!m) return null;
  const v = +m[1];
  return (v >= 40 && v <= 240) ? v : null;
}

/* ---------- Katalog (nur lesend) ---------- */
function katalogLesen() {
  const gz = path.join(LIB, 'katalog.json.gz');
  try { return JSON.parse(zlib.gunzipSync(fs.readFileSync(gz))).songs || {}; }
  catch (e) { return {}; }
}

/* ---------- ein Song ---------- */
function einSong(id, katalog, tmp) {
  const drums = path.join(SONGS, id, 'stems', 'drums.flac');
  if (!fs.existsSync(drums)) return { fehlt: 'stems' };

  const { voll, tief } = spurenHolen(drums, tmp);
  const o = anschlaege(lesen(voll));
  const t = tempoFinden(o, SR / HOP);
  if (!t) { for (const f of [voll, tief]) try { fs.unlinkSync(f); } catch (e) {} return { fehlt: 'zu kurz' }; }

  const kick = lesen(tief);
  const fein = tempoSchaerfen(o, SR / HOP, t.bpm, t.median);
  let bpm = fein.bpm;
  let phase = Math.round(phaseFinden(kick, bpm) * 1000) / 1000;
  /* Zweite Stufe: das Raster auf die echten Anschläge legen. Gelingt
     das nicht (zu wenige deutliche Schläge), bleibt die Autokorrelation
     stehen - mit passung = null, damit niemand eine Genauigkeit
     annimmt, die nicht gemessen ist. */
  const fit = rasterSuchen(kick, bpm);
  if (fit) { bpm = fit.bpm; phase = fit.phase; }
  const e = einsFinden(kick, bpm, phase);

  for (const f of [voll, tief]) try { fs.unlinkSync(f); } catch (e2) {}

  const eintrag = {
    bpm, phase, eins: e.eins,
    guete: Math.round(Math.max(t.guete, fein.guete) * 100) / 100,
    kontrast: Math.round(e.kontrast * 100) / 100,
    quelle: 'drums.flac'
  };
  eintrag.schaerfe = fit ? fit.schaerfe : null;   /* wie stark das beste Raster aus allen herausragt (1 = gar nicht) */
  if (fit) {
    eintrag.zwischen = fit.zwischen;              /* Energie zwischen den Schlägen, Anteil der Schlagenergie */
    if (fit.treu) eintrag.treu = true;            /* Rastersuche durfte das Tempo nicht korrigieren */
  }
  const best = bestelltesTempo(katalog[id]);
  if (best) eintrag.bestellt = best;
  return eintrag;
}

/* ---------- Lauf ---------- */
function main() {
  const argv = process.argv.slice(2);
  let ziel = ZIEL_VORGABE, neu = false;
  const ids = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--aus') { ziel = argv[++i]; continue; }
    if (argv[i] === '--neu') { neu = true; continue; }
    ids.push(argv[i]);
  }

  let stand = { stand: null, songs: {} };
  try { stand = JSON.parse(fs.readFileSync(ziel, 'utf8')); } catch (e) {}
  if (!stand.songs) stand.songs = {};

  const katalog = katalogLesen();
  let liste = ids.length ? ids
    : fs.readdirSync(SONGS).filter(d => fs.statSync(path.join(SONGS, d)).isDirectory());
  /* IDEMPOTENT: ein abgebrochener Lauf nimmt beim Neustart das Fertige
     mit. Ohne --neu und ohne ausdrueckliche ids wird nur gerechnet, was
     fehlt. */
  if (!ids.length && !neu) liste = liste.filter(id => !stand.songs[id]);

  if (!liste.length) { console.log('Nichts zu tun - alle Songs haben ein Gitter.'); return; }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'takt-'));
  let fertig = 0, ohne = 0;
  const t0 = Date.now();
  for (const id of liste) {
    let r;
    try { r = einSong(id, katalog, tmp); }
    catch (e) { r = { fehlt: 'Fehler: ' + (e.message || e).toString().slice(0, 80) }; }
    stand.songs[id] = r;
    if (r.fehlt) { ohne++; } else { fertig++; }
    const titel = ((katalog[id] && katalog[id].titel) || id).slice(0, 38);
    console.log(r.fehlt
      ? `  —    ${titel}  (${r.fehlt})`
      : `  ${r.bpm.toFixed(3).padStart(7)} BPM  Phase ${r.phase.toFixed(3)}  Eins ${r.eins}  Güte ${r.guete.toFixed(1)}`
        + `  Schärfe ${r.schaerfe == null ? '  —' : r.schaerfe.toFixed(1).padStart(5)}`
        + `  Zwischen ${r.zwischen == null ? ' —' : r.zwischen.toFixed(2)}`
        + `${r.bestellt ? `  bestellt ${r.bestellt}` : ''}  ${titel}`);
    /* Nach jedem Song schreiben: ein Abbruch kostet hoechstens den
       laufenden Song, nicht die ganze Stunde. */
    stand.stand = new Date().toISOString();
    fs.writeFileSync(ziel, JSON.stringify(stand, null, 1));
  }
  try { fs.rmdirSync(tmp); } catch (e) {}
  const s = Math.round((Date.now() - t0) / 1000);
  console.log(`\n${fertig} mit Gitter, ${ohne} ohne, ${s} s  →  ${ziel}`);
}

main();
