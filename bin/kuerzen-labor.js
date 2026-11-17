#!/usr/bin/env node
/* KÜRZEN-LABOR — Schnitt setzen, Vorschläge sehen, Naht hören (16.11.2026)
 * =======================================================================
 *
 * WERKSTATT, NICHT BETRIEB (Hausregel 1). Das hier läuft auf einem eigenen
 * Port und fasst Caspar_Ds App nicht an. Es dient dazu, den Entwurf aus
 * docs/KUERZEN.md am echten Song zu prüfen, bevor etwas in den KlangTresor
 * eingebaut wird. Geschrieben wird nichts: library/ wird nur gelesen.
 *
 * DIE EINE BEDINGUNG (Caspar_D, 16.11.2026):
 *   „die eingeblendeten schnitte sind halt vorschläge, und es ist auch völlig
 *    wurscht, ob sie auf Schlagzeiten liegen. das einzige wichtige ist, dass
 *    sie ein vielfaches von Takten auseinanderliegen."
 *
 * Gerechnet wird darum über den GEBROCHENEN SCHLAGINDEX aus Sunos Muster:
 * idx(t) ist der zwischen zwei Schlagzeiten interpolierte Index. Ein
 * Kandidat zu k Takten liegt bei der Zeit, deren Index idx(t) + 4k ist -
 * also genau so weit vom nächsten Schlag entfernt wie der Schnitt selbst.
 * Die Phasenlage wird gespiegelt, nicht gerastet. Das lokale Tempo steckt
 * automatisch drin, weil zwischen echten Schlagzeiten interpoliert wird.
 *
 * WARUM NICHT GERECHNETES TEMPO. Gemessen am 16.11.2026: jedes gleichmäßige
 * Raster liegt gegen Sunos 1007 Schläge bei Snegurotschka kaum über dem
 * Zufallsboden (F-Maß 31,8 % gegen 21,7 %), weil der Song bis etwa 340 s mit
 * rund 152 BPM läuft und danach mit 140,6. Ein Tempo ist die falsche
 * Darstellung. 346 von 347 Songs haben Sunos Muster.
 *
 * DER PEGEL IST HIER RMS-BASIERT, nicht das `l` der Übergabe. Dort ist es
 * das geometrische Mittel über 24 log-Bänder und braucht eine FFT über den
 * ganzen Song. Hier: Pegel je Schlag in dB aus dem Mischsignal, und die
 * Differenz gemittelt über das Fenster -4…+3 Schläge - dieselbe Struktur,
 * billiger gerechnet. Die Schranken (1,5 dB gut, ab 6 dB untauglich) stammen
 * aus Messungen mit dem Bandmaß und gelten hier nur als Anhaltspunkt. Das
 * steht auch in der Oberfläche, damit niemand die Zahlen verwechselt.
 *
 * Aufruf:  node bin/kuerzen-labor.js [port]        (Vorgabe 8899)
 * Dann im Browser die Adresse öffnen, die das Skript nennt.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const os = require('os');
const { execFileSync, spawnSync } = require('child_process');

const WURZEL = path.join(__dirname, '..');
const LIB = path.join(WURZEL, 'library');
const SONGS = path.join(LIB, 'songs');
const SEITE = path.join(WURZEL, 'labor', 'kuerzen', 'index.html');
const PORT = +(process.argv[2] || 8899);
const SR = 11025;

function ffmpeg() {
  const eigen = path.join(WURZEL, 'werkzeug', 'ffmpeg', 'bin', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  return fs.existsSync(eigen) ? eigen : 'ffmpeg';
}
const FFMPEG = ffmpeg();

/* ---------- Katalog und Whisper, nur lesend ---------- */
let KATALOG = null;
function katalog() {
  if (KATALOG) return KATALOG;
  KATALOG = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(LIB, 'katalog.json.gz')))).songs || {};
  return KATALOG;
}
let WHISPER = null;
function whisper(id) {
  if (!WHISPER) {
    WHISPER = {};
    try {
      for (const z of fs.readFileSync(path.join(LIB, 'whisper.ndjson'), 'utf8').split('\n')) {
        if (!z.trim()) continue;
        const d = JSON.parse(z);
        WHISPER[d.id] = d.worte || [];
      }
    } catch (e) {}
  }
  return WHISPER[id] || [];
}

/* ---------- Pegel je Schlag ----------
 * Das Mischsignal wird einmal auf 11025 Hz mono gelegt und je Schlag der
 * RMS in dB genommen. Ein Schlag ist bei 150 BPM 400 ms, also rund 4400
 * Samples - genug für einen stabilen Wert. */
/* Die Proben einmal entpacken und im Zwischenspeicher halten: Pegel je Schlag
   und die Stillesuche brauchen dieselben Zahlen. */
function proben(id) {
  const wav = path.join(SONGS, id, 'audio.wav');
  const quelle = fs.existsSync(wav) ? wav : path.join(SONGS, id, 'audio.mp3');
  const tmp = path.join(os.tmpdir(), `kuerzen-${id}.f32`);
  if (!fs.existsSync(tmp)) {
    execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', quelle, '-ac', '1', '-ar', String(SR),
      '-f', 'f32le', tmp], { stdio: ['ignore', 'ignore', 'pipe'] });
  }
  const b = fs.readFileSync(tmp);
  return new Float32Array(b.buffer, b.byteOffset, b.length / 4);
}

/* ---------- Stille vorn und hinten ----------
 * Caspar_D, 17.11.2026: „erstmal eine automatic, wenn vorn und hinten stille
 * sind" - und: „suno macht eine sigmoidale ausblendkurve".
 *
 * Gemessen wird in 20-ms-Fenstern. Die Schwelle ist NICHT absolut: ein leise
 * gemastertes Lied hätte sonst keinen Anfang. Bezug ist das 90er Perzentil
 * der Fensterpegel (also der laute Normalfall des Liedes), davon 50 dB
 * hinunter, mit einem Boden bei -65 dBFS gegen Rauschen aus dem mp3.
 *
 * Dazu der Anfang der Ausblendung: der letzte Zeitpunkt, an dem das Lied noch
 * nahe seinem Normalpegel war. Das ist eine SCHÄTZUNG und heißt in der
 * Oberfläche so - Sunos Sigmoide hat keinen scharfen Knick, den man messen
 * könnte. Sie sagt, wo ein eigener Schnitt hinten anfangen müsste, wenn man
 * die fremde Ausblendung nicht mitnehmen will. */
const STILLE = {};
function stille(id) {
  if (STILLE[id]) return STILLE[id];
  let x;
  try { x = proben(id); } catch (e) { return null; }
  const F = Math.round(SR * 0.02), N = Math.floor(x.length / F);
  if (N < 10) return null;
  const db = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    let s = 0;
    for (let j = i * F; j < (i + 1) * F; j++) s += x[j] * x[j];
    db[i] = 10 * Math.log10(s / F + 1e-12);
  }
  const sortiert = Array.from(db).sort((a, b) => a - b);
  const bezug = sortiert[Math.floor(N * 0.9)];
  const schwelle = Math.max(bezug - 50, -65);
  /* Stille ist eine STRECKE, kein Fenster: erst 0,3 s durchgehend unter der
     Schwelle gelten als Stille - sonst macht ein einzelnes leises Fenster
     mitten im Lied einen Anfang.
     GEGENGERECHNET gegen ffmpegs silencedetect (Unter der Haut I): das sagt
     Stille ab 327,77 s, diese Rechnung ab 326,42 s. Kein Widerspruch, zwei
     Maße - silencedetect vergleicht EINZELPROBEN mit der Schwelle, hier wird
     über 20 ms gemittelt. Nachgemessen hat die Strecke 326,42 s bis zum Ende
     im Mittel -61,6 dB bei Spitzen von -43,3 dB, also 50 dB unter dem
     Normalpegel des Liedes. Der Mittelwert ist das Maß, das zum Hören passt;
     die Spitzen stehen auf der sicheren Seite zu seinen Gunsten. */
  const MIN = 15;                                     /* 15 Fenster = 0,3 s */
  let a = 0;
  while (a < N && db[a] < schwelle) a++;
  if (a >= N) return null;
  if (a < MIN) a = 0;                                 /* zu kurz: keine Stille */
  let b = N - 1;
  while (b > a && db[b] < schwelle) b--;
  if (N - 1 - b < MIN) b = N - 1;
  const dauer = x.length / SR;
  /* 20 ms Luft nach außen: der erste Einsatz soll nicht angeschnitten werden. */
  const vorn = a ? Math.max(0, (a * 0.02) - 0.02) : 0;
  const hinten = b < N - 1 ? Math.min(dauer, ((b + 1) * 0.02) + 0.02) : dauer;
  let e = b;
  while (e > a && db[e] < bezug - 6) e--;
  const aus = STILLE[id] = {
    vorn: Math.round(vorn * 1000) / 1000,
    hinten: Math.round(hinten * 1000) / 1000,
    ausblende: Math.round(((e + 1) * 0.02) * 1000) / 1000,
    schwelle: Math.round(schwelle * 10) / 10,
    bezug: Math.round(bezug * 10) / 10
  };
  return aus;
}

const PEGEL = {};
function pegelJeSchlag(id, schlaege) {
  if (PEGEL[id]) return PEGEL[id];
  const x = proben(id);
  const out = new Float64Array(schlaege.length);
  for (let i = 0; i < schlaege.length; i++) {
    const t0 = schlaege[i][0];
    const t1 = (i + 1 < schlaege.length ? schlaege[i + 1][0] : t0 + 0.4);
    let s = 0, n = 0;
    for (let j = Math.floor(t0 * SR); j < Math.min(x.length, t1 * SR); j++) { s += x[j] * x[j]; n++; }
    out[i] = 10 * Math.log10(s / (n || 1) + 1e-12);
  }
  PEGEL[id] = out;
  return out;
}

/* ---------- Abschnitte: aus der Primärquelle ----------
 * Caspar_D, 16.11.2026: „keine holketten bauen. immer die Primäre quelle."
 *
 * VERWORFEN: der erste Versuch holte die Lyrics, ließ web/klangfeder-blatt.js
 * daraus eine Abschnittskarte bauen und ordnete die Zeilen dann über
 * Wortähnlichkeit den Whisper-Zeiten zu. Drei Stationen, eine Näherung am
 * Ende - und das Ergebnis war bei Snegurotschka EIN Abschnitt über den
 * ganzen Song. Zu Recht verworfen.
 *
 * Die Primärquelle steht im Katalog: `s.worte` enthält die Abschnittsmarken
 * SELBST, mit Zeit. Das erste Wort eines Abschnitts trägt die Marke vor
 * sich: [1.915, 4.309, "[Intro]\nDämmerung.\n"]. 244 der 347 Songs haben
 * das. Keine Zuordnung, keine Ähnlichkeitsrechnung, kein Alignment.
 *
 * Aus web/klangfeder-blatt.js kommt nur noch, was dort DEFINIERT ist und
 * nirgends sonst: ABS_FARBE und abschnittArt() - die Farbe je Art. Das ist
 * keine Kette, das ist die Hausform an ihrer einzigen Stelle.
 *
 * Fehlen die Marken (Whisper hat sie nicht mitgeschrieben), bleibt Sunos
 * eigene Strukturerkennung als Rückfall: novelty-sections, A und B, mit
 * echten Zeiten. Die Oberfläche bekommt gesagt, welche Quelle es war. */
let BLATT = null;
function blatt() {
  if (BLATT) return BLATT;
  try {
    global.window = global.window || global;
    require(path.join(WURZEL, 'web', 'klangfeder-blatt.js'));
    BLATT = global.KlangfederBlatt || null;
  } catch (e) { BLATT = null; }
  return BLATT;
}

const ABSCHNITTE = {};
/* Die Namen, an denen ein Abschnitt zu erkennen ist - dieselbe Liste wie in
   web/fremd/analyzer.js. Pre-Chorus zählt mit: er ist ein eigener Abschnitt
   (bei Suno grün, nicht orange - hochgestuft wird nur der Refrain selbst). */
const ABSCHNITTSWORT = /\b(intro|vorspiel|verse|vers|strophe|pre-?chorus|chorus|refrain|kehrvers|bridge|br(ue|ü)cke|hook|break|interlude|zwischenspiel|(ue|ü)berleitung|outro|nachspiel|ending|ende|coda)\b/i;

function abschnitteVon(id) {
  if (ABSCHNITTE[id]) return ABSCHNITTE[id];
  const B = blatt();
  const s = katalog()[id];
  const farben = (B && B.ABS_FARBE) || { strophe: '#e31c79', refrain: '#f97b14', bruecke: '#d8d81c', rand: '#16be5c' };
  const art = (B && B.abschnittArt) || (() => 'rand');
  const zeilen = zeilenVon(id);
  const norm = (t) => String(t).toLowerCase().replace(/[^\wäöüß ]/g, '').replace(/\s+/g, ' ').trim();

  /* MARKEN AUS DEN LYRICS, VERORTET ÜBER DIE BEREINIGTE LYRIK.
     Die Zeilen in lyrik.json tragen den VORGEGEBENEN Wortlaut - sie sind
     also Zeile für Zeile dieselben wie im Katalogfeld `lyrics`, nur mit
     Zeiten. Darum genügt ein exakter Textvergleich; geraten wird nichts.
     Sunos eigene Marken in `worte` bleiben ungenutzt: sie hängen an Sunos
     Alignment, und das ist der Grund, warum es Whisper überhaupt gibt. */
  const offen = zeilen.map((z, i) => ({ i, k: z.schluessel, von: z.von }));
  const aus = [], regie = [];
  let zeiger = 0, warte = null, warteRegie = null;
  for (const roh of String((s && s.lyrics) || '').split('\n')) {
    const z = roh.trim();
    if (!z) continue;
    const m = /^\[([^\]]+)\]/.exec(z);
    if (m && !norm(z.replace(/^\[[^\]]*\]/, ''))) {
      /* NICHT JEDE MARKE IST EIN ABSCHNITT (16.11.2026). Suno schreibt in
         dieselben eckigen Klammern auch Regieanweisungen: „[Baritone,
         whispering]", „[Baritone narrator, low, bayan only]". Als Abschnitt
         gezählt zerlegten sie Snegurotschka in 26 Teile, von denen 21 „rand"
         hießen - die Bahn war fast durchgehend grün, obwohl der Song Strophen
         und Refrains hat. Der Analyzer kennt diese Unterscheidung längst
         (analyzer.js, die Wortliste beim Lesen des Karaoketexts); hier stand
         sie noch nicht.

         Eine Marke beginnt einen Abschnitt nur, wenn sie einen Abschnitt NENNT.
         Alles andere gehört zum laufenden und wird übergangen. */
      if (ABSCHNITTSWORT.test(m[1])) warte = m[1].trim();
      else warteRegie = m[1].trim();      /* eine Regieanweisung - sie wird gezeigt, aber teilt nicht */
      continue;
    }
    const k = norm(z);
    if (!k) continue;
    /* nächste passende bereinigte Zeile ab dem Zeiger suchen */
    let tr = -1;
    for (let j = zeiger; j < offen.length && j < zeiger + 12; j++)
      if (offen[j].k === k) { tr = j; break; }
    if (tr < 0) continue;
    zeiger = tr + 1;
    if (warte != null) {
      aus.push({ von: offen[tr].von, bis: s.dauer, art: art(warte), name: warte });
      warte = null;
    }
    /* DIE REGIEANWEISUNGEN BLEIBEN SICHTBAR (Caspar_D, 16.11.2026: „mache die
       beschreibungen der Abschnitte - wir brauchen sie hier wirklich zur
       Orientierung - mehrzeilig"). Sie teilen den Song nicht in Abschnitte, aber
       sie sagen, was an dieser Stelle gesungen wird. Eigene Spur, eigene Zeiten. */
    if (warteRegie != null) {
      regie.push({ von: offen[tr].von, bis: s.dauer, text: warteRegie });
      warteRegie = null;
    }
  }
  for (let i = 0; i + 1 < regie.length; i++) regie[i].bis = regie[i + 1].von;
  if (aus.length) {
    for (let i = 0; i + 1 < aus.length; i++) aus[i].bis = aus[i + 1].von;
    if (aus[0].von > 0.4) aus.unshift({ von: 0, bis: aus[0].von, art: 'rand', name: '' });
    ABSCHNITTE[id] = { abschnitte: aus, regie, farben, quelle: 'marken' };
    return ABSCHNITTE[id];
  }
  ABSCHNITTE[id] = { abschnitte: [], farben, quelle: 'keine' };
  return ABSCHNITTE[id];
}

/* ---------- Hüllkurve ----------
 * wellenStufen sind Sunos Zoomstufen (waveform-aggregates): je Stufe ein
 * flaches Feld aus Min/Max-Paaren über die ganze Dauer. Für alle 347 Songs
 * vorhanden. Gewählt wird die Stufe, deren Punktzahl zur gewünschten
 * Auflösung passt - mehr Punkte als Pixel wäre Verschwendung, weniger
 * sähe grob aus. */
function huellkurve(id, punkteSoll) {
  const s = katalog()[id];
  const st = s && s.wellenStufen;
  if (!Array.isArray(st) || !st.length) return null;
  /* data ist ein PAAR VON KANÄLEN, nicht ein flaches Feld (16.11.2026):
     data[0] und data[1], je ein Array aus abwechselnd Min und Max. Der erste
     Versuch las data als flaches Feld und bekam null Punkte. */
  let beste = null;
  for (const stufe of st) {
    const dd = stufe && stufe.data;
    const d = Array.isArray(dd) && Array.isArray(dd[0]) ? dd[0] : (Array.isArray(dd) ? dd : null);
    if (!Array.isArray(d) || d.length < 4) continue;
    const n = Math.floor(d.length / 2);
    if (!beste || Math.abs(n - punkteSoll) < Math.abs(beste.n - punkteSoll)) beste = { n, d };
  }
  if (!beste) return null;
  let max = 1;
  for (const v of beste.d) if (Math.abs(v) > max) max = Math.abs(v);
  const paare = [];
  for (let i = 0; i + 1 < beste.d.length; i += 2)
    paare.push([Math.round(beste.d[i] / max * 1000) / 1000, Math.round(beste.d[i + 1] / max * 1000) / 1000]);
  return paare;
}

/* ---------- gebrochener Schlagindex ---------- */
function machIdx(ts) {
  return {
    /* Zeit -> Index */
    von: (t) => {
      let lo = 0, hi = ts.length - 1;
      if (t <= ts[0]) return 0;
      if (t >= ts[hi]) return hi;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ts[m] <= t) lo = m; else hi = m; }
      return lo + (t - ts[lo]) / (ts[lo + 1] - ts[lo]);
    },
    /* Index -> Zeit */
    nach: (i) => {
      if (i <= 0) return ts[0];
      if (i >= ts.length - 1) return ts[ts.length - 1];
      const k = Math.floor(i), f = i - k;
      return ts[k] + f * (ts[k + 1] - ts[k]);
    }
  };
}

/* ---------- Text, der wegfällt ----------
 * ZEILEN HABEN ZEITGRENZEN (Berichtigung 16.11.2026). Der erste Versuch
 * zerlegte den Wortlaut des übersprungenen Bereichs an Zeilenumbrüchen und
 * suchte jede Teilzeile im Gesamttext. Ergebnis: bei Snegurotschka 287,64 -
 * mitten in der Refrainwiederholung „mir ist so warm" - meldete er
 * „einmalige Zeilen", weil der Bereichsrand mitten in eine Zeile fällt und
 * das Fragment („ist so warm") als ganze Zeile nirgends vorkommt. Die
 * Anzeige log also.
 *
 * Jetzt werden die Zeilen EINMAL aus dem Wortstrom gebildet, mit Anfangs-
 * und Endzeit, und der Bereich wird dagegen geprüft. Drei Fälle, und alle
 * drei muss der Nutzer unterscheiden können:
 *   - ganz im Bereich und mehrfach im Song  -> darf weg
 *   - ganz im Bereich und nur hier          -> Textverlust
 *   - ragt über den Rand                    -> der Schnitt geht MITTEN
 *     durch eine Zeile, und das ist schlimmer als ein Zeilenverlust:
 *     man hört ein abgeschnittenes Wort.
 */
/* DIE TEXTQUELLE IST DIE BEREINIGTE LYRIK (16.11.2026).
 * Caspar_D: „sunos text zu musik alignment ist schlecht, deswegen gibt es
 * hier whisper. whisper ist aber im textverständnis nicht gut, darum muß die
 * Lyrics wieder auf die vorgegebene Lyrics aligniert werden — das Ergebnis
 * ist die bereinigte Lyrics."
 *
 * Also: library/lyrik.json, erzeugt von bin/lyrik.js. Dort liegt der
 * VORGEGEBENE Text auf den WHISPER-Zeiten. Beide Rohquellen allein sind
 * falsch: Suno alignt schlecht, Whisper versteht schlecht. Zwei frühere
 * Fassungen dieser Datei haben genau das getan - erst Whispers Rohtext
 * („Sie schmolzt ein", „Wotanotepo", „Untertitelung im Auftrag des ZDF"),
 * dann Sunos Marken. Beide verworfen.
 *
 * Fehlt ein Lied in lyrik.json oder steht es unter `unsicher` (Deckung unter
 * 60 %), bekommt es KEINEN Text - nicht ersatzweise den Rohtext. */
const ZEILEN = {};
let LYRIK = null;
function lyrik() {
  if (LYRIK) return LYRIK;
  try { LYRIK = JSON.parse(fs.readFileSync(path.join(LIB, 'lyrik.json'), 'utf8')); }
  catch (e) { LYRIK = { lieder: {}, unsicher: [] }; }
  return LYRIK;
}
function zeilenVon(id) {
  if (ZEILEN[id]) return ZEILEN[id];
  const L = lyrik();
  const l = (L.lieder || {})[id];
  const unsicher = (L.unsicher || []).some(u => u.id === id);
  if (!l || unsicher || !Array.isArray(l.zeilen)) { ZEILEN[id] = []; return ZEILEN[id]; }
  const gehoert = whisper(id)
    .filter(w => Array.isArray(w) && w.length >= 3)
    .map(w => ({ von: w[0], bis: (w[1] != null ? w[1] : w[0]), txt: String(w[2]).replace(/\s+/g, ' ').trim() }))
    .filter(w => w.txt);
  const zeilen = l.zeilen.map(z => {
    const o = { von: z.von, bis: z.bis, txt: z.text,
      schluessel: String(z.text).toLowerCase().replace(/[^\wäöüß ]/g, '').replace(/\s+/g, ' ').trim() };
    o.worte = worteDerZeile(o, gehoert);
    return o;
  });
  /* WIEDERHOLUNGEN KOMMEN AUS DEM LIEDTEXT, NICHT AUS WHISPER (16.11.2026).
     Die Sitzung „Snegurotschka Mythos" hat ihre Chor-Zonen so bestimmt: aus
     dem Aufbau des Suno-Liedtexts, also direkt wiederholten Zeilen in einem
     Chor-Abschnitt. Whispers Wörter dienten nur als Zeitmarke „hier wird
     gesungen"; was dort stand, war für die Entscheidung gleichgültig.
     Würde man wie vorher nur die BEREINIGTEN Zeilen zählen, fehlten genau die
     19 russischen - und damit die Zonen, aus denen bei Fassung D geschnitten
     wurde. Gezählt wird deshalb über das Katalogfeld `lyrics`. */
  const sLy = String((katalog()[id] || {}).lyrics || '');
  const zaehl = {};
  for (const roh of sLy.split('\n')) {
    const z = roh.trim();
    if (!z || /^\[[^\]]*\]$/.test(z)) continue;
    const k = z.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();
    if (k) zaehl[k] = (zaehl[k] || 0) + 1;
  }
  for (const z of zeilen) z.malImSong = zaehl[z.schluessel] || 1;
  ZEILEN[id] = zeilen;
  return zeilen;
}
/* ---------- Wortzeiten für den bereinigten Text ----------
 * Caspar_D, 16.11.2026: „richte bitte jedes wort richtig aus, nicht nur den
 * Zeilen Anfang."
 *
 * Die bereinigte Lyrik hat den richtigen Wortlaut, aber nur Zeilenzeiten.
 * Whisper hat Wortzeiten, aber den falschen Wortlaut. Zusammengebracht wird
 * beides mit bin/whisper-text.js — derselben Funktion, die auch bin/whisper.js
 * und bin/whisper-abgleich.js benutzen: längste gemeinsame Teilfolge über die
 * normalisierten Wörter. Keine zweite Fassung des Verfahrens.
 *
 * Wörter, die Whisper nicht gehört hat, bekommen keine eigene Zeit, sondern
 * werden zwischen ihren Nachbarn eingehängt. Das wird nicht als Messung
 * ausgegeben: `sicher` sagt, ob die Zeit von Whisper kommt oder geschätzt ist. */
const WT = require('./whisper-text.js');

function worteDerZeile(zeile, gehoert) {
  const soll = String(zeile.txt).split(/\s+/).filter(Boolean);
  const imFenster = gehoert.filter(w => w.von >= zeile.von - 0.25 && w.von <= zeile.bis + 0.25);
  const A = imFenster.map(w => WT.norm(w.txt)), B = soll.map(WT.norm);
  const n = A.length, m = B.length;
  const aus = soll.map(t => ({ txt: t, von: null, bis: null, sicher: false }));
  if (n && m && n * m <= 4e6) {
    /* dieselbe Teilfolgen-Rechnung wie in whisper-text.js, hier aber zum
       Übertragen der ZEIT statt der Schreibweise */
    const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
      L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (A[i] === B[j]) { aus[j].von = imFenster[i].von; aus[j].bis = imFenster[i].bis; aus[j].sicher = true; i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) i++;
      else j++;
    }
  }
  /* Lücken füllen: zwischen den sicheren Ankern gleichmäßig verteilen */
  let k = 0;
  while (k < aus.length) {
    if (aus[k].von != null) { k++; continue; }
    let e = k; while (e < aus.length && aus[e].von == null) e++;
    const vonT = k > 0 ? aus[k - 1].bis : zeile.von;
    const bisT = e < aus.length ? aus[e].von : zeile.bis;
    const schritt = (bisT - vonT) / (e - k);
    for (let q = k; q < e; q++) { aus[q].von = vonT + (q - k) * schritt; aus[q].bis = aus[q].von + schritt * 0.92; }
    k = e;
  }
  return aus;
}

function deckung(id) {
  const l = (lyrik().lieder || {})[id];
  return l ? l.deckung : null;
}

/* ---------- Was im Text FEHLT ----------
 * Caspar_D, 16.11.2026: „jetzt fällt uns auf die füsse, dass wir die
 * russischen textstellen nicht haben" — und: „ich sehe nicht, wo der
 * russische Text ist."
 *
 * Gemessen an Snegurotschka: die Lyrics haben 100 gesungene Zeilen, davon 19
 * kyrillische. Die bereinigte Lyrik hat 77 Zeilen und KEINE kyrillische.
 * Whisper lief mit „-l de" (bin/whisper.js entscheidet nach Mehrheit der
 * Buchstaben, und 298 kyrillische gegen 3442 lateinische ergeben Deutsch),
 * hat die russischen Stellen also nie gehört, sondern deutsche
 * Phantasiewörter. Beim Abgleich trifft nichts, die Zeile fällt heraus.
 *
 * Die Zahl `deckung` in lyrik.json meldet dafür 0,963 - sie zählt
 * offenbar zugeordnete Wörter, nicht den Anteil des Liedtexts. Wer ihr
 * glaubt, hält den Text für vollständig.
 *
 * Darum werden die fehlenden Zeilen hier AUSGEWIESEN, nicht verschwiegen:
 * ihre Lage ergibt sich aus der Reihenfolge - sie liegen zwischen den
 * beiden bereinigten Zeilen, die sie im Liedtext umgeben. Die Zeit ist
 * geschätzt und wird als solche gekennzeichnet. Eine Lücke, die man sieht,
 * ist besser als ein Text, der vollständig aussieht. */
/* WHISPERS PHANTASIEWÖRTER SIND BRAUCHBARE ZEITMARKEN. Hinweis der Sitzung
   „Snegurotschka Mythos", 16.11.2026: auch wo Whisper den Text verfehlt,
   zeigen seine Zeiten richtig, WO gesungen wird. In der Lücke 156–172 s steht
   „Untertitelung im Auftrag des ZDF" - das ist kein Text, sondern das
   bekannte Kennzeichen für „Sprache nicht erkannt"; die Zeitmarken darunter
   stimmen trotzdem. Also werden die fehlenden Zeilen nicht gleichmäßig über
   die Lücke verteilt, sondern an Whispers Pausen aufgehängt. */
const HALLUS = /untertitelung|zdf|untertitel\s+von|amara\.org|vielen dank|субтитры|dimatorzok|редактор субтитров/i;

function luecken(id, texte, von, bis) {
  const w = whisper(id)
    .filter(x => Array.isArray(x) && x.length >= 3 && x[0] >= von && x[0] < bis)
    .map(x => ({ von: x[0], bis: (x[1] != null ? x[1] : x[0]), txt: String(x[2]).trim() }));
  /* Pausen zwischen den gehörten Wörtern: die größten trennen die Zeilen */
  if (w.length >= texte.length) {
    const pausen = [];
    for (let i = 0; i + 1 < w.length; i++) pausen.push({ i, luecke: w[i + 1].von - w[i].bis });
    pausen.sort((a, b) => b.luecke - a.luecke);
    const schnitte = pausen.slice(0, texte.length - 1).map(p => p.i).sort((a, b) => a - b);
    const aus = [];
    let start = 0;
    for (let q = 0; q < texte.length; q++) {
      const ende = q < schnitte.length ? schnitte[q] : w.length - 1;
      const a = w[start] ? w[start].von : von;
      const b = w[ende] ? w[ende].bis : bis;
      const roh = w.slice(start, ende + 1).map(x => x.txt).join(' ');
      aus.push({ von: a, bis: b, txt: texte[q], geschaetzt: true,
        gehoert: HALLUS.test(roh) ? '(Whisper: Halluzination)' : roh.slice(0, 80) });
      start = ende + 1;
    }
    return aus;
  }
  const schritt = (bis - von) / texte.length;
  return texte.map((t, i) => ({ von: von + i * schritt, bis: von + (i + 1) * schritt, txt: t, geschaetzt: true, gehoert: '' }));
}

/* ---------- Der gerechnete Lückentext ----------
 * bin/lueckentext.js schickt die Lücken einzeln durch Whisper, mit der
 * Sprache je Lücke und dem erwarteten Text als Prompt. Was dabei
 * herauskommt, liegt in library/lueckentext.json und wird hier als
 * vollwertige Zeile geführt - mit gemessenen Zeiten statt geschätzter.
 *
 * HALLUZINATIONEN FLIEGEN RAUS. Wo Whisper nichts versteht, erfindet es
 * Untertitel-Credits: auf Deutsch „Untertitelung im Auftrag des ZDF", auf
 * Russisch „Субтитры сделал DimaTorzok". Gemessen am 16.11.2026: drei der
 * neun Snegurotschka-Lücken endeten so. Das ist ein Kennzeichen für
 * „Sprache nicht erkannt", kein Text - und wird als Lücke behandelt. */
let LTEXT = null;
function lueckentext(id) {
  if (!LTEXT) {
    try { LTEXT = JSON.parse(fs.readFileSync(path.join(LIB, 'lueckentext.json'), 'utf8')); }
    catch (e) { LTEXT = { lieder: {} }; }
  }
  return ((LTEXT.lieder || {})[id] || {}).luecken || [];
}

const LUECKEN = {};
function fehlendeZeilen(id) {
  if (LUECKEN[id]) return LUECKEN[id];
  const s = katalog()[id];
  const zeilen = zeilenVon(id);
  const norm = (t) => String(t).toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();
  const ges = String((s && s.lyrics) || '').split('\n')
    .map(z => z.trim()).filter(z => z && !/^\[[^\]]*\]$/.test(z));
  const haben = zeilen.map(z => norm(z.txt));
  const aus = [];
  let zeiger = 0;
  let offen = [];
  for (const z of ges) {
    const k = norm(z);
    if (!k) continue;
    let tr = -1;
    for (let j = zeiger; j < haben.length && j < zeiger + 12; j++) if (haben[j] === k) { tr = j; break; }
    if (tr >= 0) {
      if (offen.length) {
        const von = zeiger > 0 ? zeilen[zeiger - 1].bis : 0;
        const bis = zeilen[tr].von;
        aus.push(...luecken(id, offen, von, bis));
        offen = [];
      }
      zeiger = tr + 1;
    } else offen.push(z);
  }
  if (offen.length && zeilen.length)
    aus.push(...luecken(id, offen, zeilen[zeilen.length - 1].bis, s.dauer));
  /* Was bin/lueckentext.js gelöst hat, ist keine Lücke mehr. Zugeordnet wird
     über die Zeile selbst, nicht über die Zeit - die geschätzte Lage kann um
     Sekunden danebenliegen, der Wortlaut nicht. */
  const gerechnet = new Map();
  for (const l of lueckentext(id)) {
    const roh = (l.worte || []).map(w => w[2]).join(' ');
    if (HALLUS.test(roh) || !l.worte || !l.worte.length) continue;
    if (!l.treffer || l.treffer < Math.max(2, (l.gesucht || 0) * 0.3)) continue;
    for (const z of (l.zeilen || [])) gerechnet.set(norm2(z), l);
  }
  /* Die Zeilen einer Lücke über die gehörten Worte verteilen, nicht alle auf
     denselben Bereich setzen: dieselbe Teilfolgen-Zuordnung wie bei den
     Zeilen aus lyrik.json. Sonst läge „Вот оно, тепло" sechs Sekunden breit
     über vier Zeilen. */
  const schonVerteilt = new Set();
  for (const f of aus) {
    const l = gerechnet.get(norm2(f.txt));
    if (!l || schonVerteilt.has(l)) { if (l) { /* später zugewiesen */ } else continue; }
    if (!schonVerteilt.has(l)) {
      schonVerteilt.add(l);
      const gehoert = l.worte.map(w => ({ von: w[0], bis: w[1], txt: w[2] }));
      let rest = gehoert.slice();
      for (const zt of l.zeilen) {
        const ziel = aus.find(a => norm2(a.txt) === norm2(zt) && !a.geloest);
        if (!ziel) continue;
        const soll = zt.split(/\s+/).filter(Boolean).length;
        const anteil = rest.splice(0, Math.max(1, Math.min(rest.length, soll)));
        /* WHISPER HÖRT WIEDERHOLUNGEN OFT NUR EINMAL (16.11.2026): bei
           „Огонь горит" stehen vier Zeilen im Text, gehört wurden zwei.
           Die übrigen bekommen keine leeren Zeiten (87,57–87,57 wäre ein
           Strich ohne Breite), sondern den Rest der Lücke anteilig - und
           bleiben als geschätzt gekennzeichnet. */
        if (!anteil.length) {
          const offenZ = l.zeilen.filter(q => { const z2 = aus.find(a => norm2(a.txt) === norm2(q)); return z2 && !z2.geloest; });
          const letztBis = gehoert.length ? gehoert[gehoert.length - 1].bis : l.von;
          const schritt = Math.max(0.6, (l.bis - letztBis) / Math.max(1, offenZ.length));
          const idx = offenZ.findIndex(q => norm2(q) === norm2(zt));
          ziel.geloest = true; ziel.sprache = l.sprache; ziel.nurGeschaetzt = true;
          ziel.von = letztBis + Math.max(0, idx) * schritt;
          ziel.bis = ziel.von + schritt;
          ziel.worte = null;
          continue;
        }
        ziel.geloest = true;
        ziel.sprache = l.sprache;
        ziel.von = anteil[0].von;
        ziel.bis = anteil[anteil.length - 1].bis;
        ziel.worte = worteDerZeile({ txt: ziel.txt, von: ziel.von, bis: ziel.bis }, anteil)
          .map(w => [Math.round(w.von*1000)/1000, Math.round(w.bis*1000)/1000, w.txt, w.sicher ? 1 : 0]);
      }
    }
  }
  LUECKEN[id] = aus;
  return aus;
}
const norm2 = (t) => String(t).toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();

/* DIE NAHT IST GLATT, WENN VOR BEIDEN PUNKTEN DASSELBE STEHT.
 * Berichtigung 16.11.2026, zweiter Versuch. Der erste meldete bei
 * Snegurotschka 287,64 „schneidet Zeile an" - und zwar für JEDEN Kandidaten,
 * weil die Whisper-Zeile dort 5,7 s lang ist und jeder Schnitt mitten
 * hineinfällt. Genau dieser Schnitt ist aber Caspar_Ds Favorit.
 *
 * Nachgesehen: 287,64 liegt bei 62 % der Zeile „Ich zitter, ich zitter, mir
 * ist so warm, mir ist so warm", das Ziel 293,96 bei 59 % der Zeile „Ich
 * teile mich, ich teile mich, mir ist so warm, mir ist so warm." Beide
 * Punkte sitzen mitten in „mir ist so warm". Caspar_D, 16.11.2026: „wir
 * haben einfach die erste Hälfte des ersten mit der zweiten Hälfte der
 * zweiten zusammengeklebt."
 *
 * Also zählt nicht die Zeilengrenze, sondern der WORTLAUT an der Naht: steht
 * vor dem Schnitt dasselbe wie vor dem Zielpunkt, läuft der Text weiter.
 * Dasselbe Prinzip wie beim Klang - es kommt auf die Ähnlichkeit der beiden
 * Stellen an, nicht auf ihre absolute Lage. */
function worteVor(id, t, n) {
  /* Worte aus der BEREINIGTEN Lyrik, nicht aus Whispers Rohtext: die Naht
     wird am vorgegebenen Wortlaut geprüft, nicht an dem, was Whisper
     gehört zu haben glaubt. */
  const w = [];
  for (const z of zeilenVon(id)) {
    if (z.bis <= t) { for (const s of z.schluessel.split(' ')) if (s) w.push(s); }
    else if (z.von < t) {
      /* Zeile läuft über den Punkt: anteilig so viele Worte, wie bis dahin
         gesungen sind. Grob, aber ehrlich - Wortzeiten hat die bereinigte
         Lyrik nicht, nur Zeilenzeiten. */
      const teil = (t - z.von) / Math.max(0.001, z.bis - z.von);
      const ws = z.schluessel.split(' ').filter(Boolean);
      for (const s of ws.slice(0, Math.max(0, Math.round(ws.length * teil)))) w.push(s);
    }
  }
  return w.slice(-n);
}

function textPreis(id, a, b) {
  const zeilen = zeilenVon(id);
  const ganz = zeilen.filter(z => z.von >= a && z.bis <= b);
  const einmalig = ganz.filter(z => z.malImSong <= 1);
  /* Naht: wie viele der letzten Worte stimmen überein, von hinten gezählt.
     EIN STARRER VERGLEICH IST ZU STRENG (16.11.2026): vor Caspar_Ds Sprung
     bei 287,64 steht „zitter mir ist", vor dem Ziel „mich mir ist" - zwei von
     drei Worten gleich. Ein Alles-oder-nichts-Vergleich verwirft damit genau
     den Sprung, den er abgenommen hat. Darum die Zahl statt des Urteils, und
     ab zwei gleichen Worten gilt die Naht als glatt. */
  const vA = worteVor(id, a, 4), vB = worteVor(id, b, 4);
  let gleich = 0;
  while (gleich < Math.min(vA.length, vB.length)
         && vA[vA.length - 1 - gleich] === vB[vB.length - 1 - gleich]) gleich++;
  const glatt = gleich >= 2;
  /* Liegt an einem der Punkte überhaupt Gesang? Wenn beide in einer Pause
     sitzen, ist die Naht textlich unkritisch. */
  const inZeile = (t) => zeilen.some(z => z.von <= t && z.bis >= t);
  const stille = !inZeile(a) && !inZeile(b);
  /* WAS WEGFÄLLT, IST MEHR ALS GANZE ZEILEN (16.11.2026). Bei Caspar_Ds
     Sprung 287,64 → 293,96 fällt „Ich teile mich, ich teile mich" weg - das
     ist der Anfang einer Zeile, keine ganze. Ein Zähler, der nur ganze Zeilen
     sieht, meldete dort „nichts". Darum zusätzlich die Worte im Bereich. */
  const worteDrin = [];
  for (const z of zeilenVon(id)) {
    if (z.bis <= a || z.von >= b) continue;
    for (const w of z.txt.split(/\s+/)) if (w) worteDrin.push(w);
  }
  return {
    zeilen: ganz.length,
    worte: worteDrin.length,
    wortlautRoh: worteDrin.join(' ').slice(0, 300),
    einmalig: einmalig.length,
    dopplung: ganz.length > 0 && einmalig.length === 0,
    glatt: !!glatt || stille,
    gleich,
    stille,
    nahtA: vA.join(' '),
    nahtB: vB.join(' '),
    wortlaut: ganz.map(z => z.txt).join(' · ').slice(0, 400)
  };
}

/* ---------- Kandidaten zu einem Schnitt ---------- */
function kandidaten(id, t, maxTakte) {
  const s = katalog()[id];
  const sl = s && s.schlaege;
  if (!sl || sl.length < 16) return { fehler: 'Kein Schlagmuster von Suno für diesen Song.' };
  const ts = sl.map(x => x[0]);
  const idx = machIdx(ts);
  const pegel = pegelJeSchlag(id, sl);
  const i0 = idx.von(t);

  const fenster = (a, b) => {   /* Pegeldifferenz über -4…+3 Schläge, wie in der Übergabe */
    let abs = 0, sig = 0, n = 0;
    for (let w = -4; w < 4; w++) {
      const ia = Math.round(a) + w, ib = Math.round(b) + w;
      if (ia < 0 || ib < 0 || ia >= pegel.length || ib >= pegel.length) continue;
      const d = pegel[ia] - pegel[ib];
      abs += Math.abs(d); sig += d; n++;
    }
    return n ? { abs: abs / n, sig: sig / n } : null;
  };

  const aus = [];
  for (let k = 1; k <= maxTakte; k++) {
    const i1 = i0 + 4 * k;
    if (i1 >= sl.length - 5) break;
    const u = idx.nach(i1);
    const p = fenster(i0, i1);
    const tx = textPreis(id, t, u);
    /* lokales Tempo beider Seiten: Median der Schlagabstände über 8 Schläge */
    const tempo = (i) => {
      const sp = [];
      for (let j = Math.max(0, Math.round(i) - 4); j < Math.min(ts.length - 1, Math.round(i) + 4); j++) sp.push(ts[j + 1] - ts[j]);
      if (!sp.length) return null;
      sp.sort((x, y) => x - y);
      return 60 / sp[sp.length >> 1];
    };
    aus.push({
      takte: k,
      ziel: Math.round(u * 1000) / 1000,
      spart: Math.round((u - t) * 1000) / 1000,
      /* Beweis, dass die Bedingung erfüllt ist - wird in der Oberfläche gezeigt */
      schlaege: Math.round((idx.von(u) - i0) * 100) / 100,
      pegel: p ? Math.round(p.abs * 10) / 10 : null,
      pegelVz: p ? Math.round(p.sig * 10) / 10 : null,
      text: tx,
      tempoVor: tempo(i0) ? Math.round(tempo(i0) * 10) / 10 : null,
      tempoNach: tempo(i1) ? Math.round(tempo(i1) * 10) / 10 : null
    });
  }
  return { schnitt: t, index: Math.round(i0 * 100) / 100, kandidaten: aus };
}

/* ---------- Naht zum Hören bauen ----------
 * Zwei Takte vor dem Schnitt bis zwei Takte nach dem Zielpunkt, mit
 * acrossfade über 120 ms, mittig auf der Naht. Als MP3, damit es im
 * Browser sofort spielt. */
function nahtBauen(id, t, u) {
  const s = katalog()[id];
  const ts = (s.schlaege || []).map(x => x[0]);
  const idx = machIdx(ts);
  const vor = Math.max(0, idx.nach(Math.max(0, idx.von(t) - 8)));
  const nach = idx.nach(Math.min(ts.length - 1, idx.von(u) + 8));
  const wav = path.join(SONGS, id, 'audio.wav');
  const quelle = fs.existsSync(wav) ? wav : path.join(SONGS, id, 'audio.mp3');
  const aus = path.join(os.tmpdir(), `naht-${id}-${t.toFixed(3)}-${u.toFixed(3)}.mp3`);
  if (fs.existsSync(aus)) return aus;
  const F = 0.12;
  const r = spawnSync(FFMPEG, ['-v', 'error', '-y',
    '-ss', String(vor), '-to', String(t + F / 2), '-i', quelle,
    '-ss', String(u - F / 2), '-to', String(nach), '-i', quelle,
    '-filter_complex', `[0:a][1:a]acrossfade=d=${F}:c1=qsin:c2=qsin[a]`,
    '-map', '[a]', '-q:a', '4', aus], { stdio: ['ignore', 'ignore', 'pipe'] });
  if (r.status !== 0) throw new Error((r.stderr || '').toString().slice(0, 300));
  return aus;
}

/* ---------- Original zum Vergleich ---------- */
function originalBauen(id, t, u) {
  const s = katalog()[id];
  const ts = (s.schlaege || []).map(x => x[0]);
  const idx = machIdx(ts);
  const vor = Math.max(0, idx.nach(Math.max(0, idx.von(t) - 8)));
  const nach = idx.nach(Math.min(ts.length - 1, idx.von(u) + 8));
  const wav = path.join(SONGS, id, 'audio.wav');
  const quelle = fs.existsSync(wav) ? wav : path.join(SONGS, id, 'audio.mp3');
  const aus = path.join(os.tmpdir(), `orig-${id}-${t.toFixed(3)}-${u.toFixed(3)}.mp3`);
  if (fs.existsSync(aus)) return aus;
  const r = spawnSync(FFMPEG, ['-v', 'error', '-y', '-ss', String(vor), '-to', String(nach),
    '-i', quelle, '-q:a', '4', aus], { stdio: ['ignore', 'ignore', 'pipe'] });
  if (r.status !== 0) throw new Error((r.stderr || '').toString().slice(0, 300));
  return aus;
}

/* ---------- Server ---------- */
function json(res, o, code = 200) {
  const b = Buffer.from(JSON.stringify(o));
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': b.length });
  res.end(b);
}
function datei(res, p, typ) {
  const st = fs.statSync(p);
  res.writeHead(200, { 'Content-Type': typ, 'Content-Length': st.size, 'Cache-Control': 'no-store' });
  fs.createReadStream(p).pipe(res);
}

/* ================== DAS REZEPT ==================
 * Caspar_D, 16.11.2026: „am besten wäre, sich nur die Schnittpositionen zu
 * merken und den song on the fly zu rendern für einen export. Alles andere
 * wird on the fly beim abspielen gemacht."
 *
 * Darum gibt es genau EINE Wahrheit je Lied, und sie ist winzig: wo
 * geschnitten wird, wie lang die Naht blendet, was vorn und hinten wegfällt,
 * wie schnell gespielt wird. Abspielen und Export lesen dasselbe - sonst
 * klingt der Export anders als die Probe.
 *
 * WO. Eine SAMMELDATEI neben dem Labor, nicht je Lied eine: die Arbeitsplatte
 * hat 1 MB Blockgröße, und 300 Rezepte à 300 Byte wären 300 MB statt 0,1.
 * Nicht in library/ - das ist der Bestand, und dieses Werkzeug ist Werkstatt
 * (Caspar_D, 16.11.2026: Ablage „c", erst laborintern, der Weg in die App
 * kommt, wenn das Werkzeug steht).
 *
 * WAS NICHT DRINSTEHT. Felder für noch nicht gebaute Dinge legt diese Fassung
 * nicht an. Ein Rezept nennt, was es kann; was fehlt, bekommt beim Lesen
 * seinen Standardwert. So wächst die Datei mit dem Werkzeug, ohne dass ein
 * Feld etwas verspricht, das nichts tut. */
const REZEPTE = path.join(WURZEL, 'labor', 'kuerzen', 'rezepte.json');

const STANDARD = { zuschnitt: null, schnitte: [], blende: 0.12,
                   rampe: { ein: 0, aus: 0 }, tempo: 1, ziel: null };

/* Die Rampenform ist keine Einstellung, sondern eine Nachbildung: Suno blendet
   sigmoidal aus (Caspar_D, 17.11.2026). Wer am Ende selbst schneidet, soll
   dieselbe Kurve hören wie bei einem Lied, das von sich aus endet. In ffmpeg
   heißt sie `losi` (logistic sigmoid), in der Oberfläche wird sie gerechnet. */
const RAMPENKURVE = 'losi';

function rezepteLesen() {
  try { return JSON.parse(fs.readFileSync(REZEPTE, 'utf8')); }
  catch (e) { return { stand: null, lieder: {} }; }
}

function rezeptVon(id) {
  const r = (rezepteLesen().lieder || {})[id] || {};
  return { ...STANDARD, ...r, rampe: { ...STANDARD.rampe, ...(r.rampe || {}) } };
}

/* Geschrieben wird über eine Nebendatei und dann umbenannt: ein Abbruch
   mitten im Schreiben soll nicht die Rezepte aller Lieder zerstören. */
function rezeptSchreiben(id, rezept) {
  const alles = rezepteLesen();
  alles.lieder = alles.lieder || {};
  const z = rezept && rezept.zuschnitt;
  const leer = !rezept || (!(rezept.schnitte || []).length && !(z && (z.vorn || z.hinten != null))
    && (rezept.tempo || 1) === 1 && !rezept.ziel
    && !(rezept.rampe && (rezept.rampe.ein || rezept.rampe.aus)));
  if (leer) delete alles.lieder[id];          /* nichts eingestellt: kein Eintrag */
  else alles.lieder[id] = { ...rezept, stand: new Date().toISOString() };
  alles.stand = new Date().toISOString();
  fs.mkdirSync(path.dirname(REZEPTE), { recursive: true });
  const neben = REZEPTE + '.neu';
  fs.writeFileSync(neben, JSON.stringify(alles, null, 1));
  fs.renameSync(neben, REZEPTE);
  return alles.lieder[id] || null;
}

/* ---------- DIE FASSUNG BAUEN ----------
 * Ein einziger ffmpeg-Lauf aus dem Rezept, nicht eine Kette von Dateien:
 * atrim schneidet die Stücke, acrossfade näht sie zusammen, atempo macht das
 * Tempo, afade die Rampen. Nur so bleibt die Rechnung an EINER Stelle.
 *
 * Die Reihenfolge ist nicht beliebig. atempo kommt VOR den Rampen, weil die
 * Rampenlängen in Sekunden der fertigen Fassung gemeint sind - stünden sie
 * davor, wäre eine Rampe von 3 s bei 92 % plötzlich 3,26 s lang.
 *
 * acrossfade legt die Stücke ÜBEREINANDER: das Ergebnis ist je Naht um deren
 * Dauer kürzer als die Summe der Stücke. Dieselbe Rechnung macht die Bilanz
 * in der Oberfläche (endlaenge()), damit die angezeigte Länge die gebaute ist. */
const EXPORTE = path.join(WURZEL, 'labor', 'kuerzen', 'export');

function stuecke(id) {
  const rez = rezeptVon(id);
  const s = katalog()[id];
  if (!s) throw new Error('unbekanntes Lied');
  const dauer = s.dauer;
  const a0 = (rez.zuschnitt && rez.zuschnitt.vorn) || 0;
  const a1 = (rez.zuschnitt && rez.zuschnitt.hinten != null) ? rez.zuschnitt.hinten : dauer;
  const schnitte = (rez.schnitte || [])
    .filter(r => r.bis > a0 && r.von < a1)
    .map(r => ({ von: Math.max(a0, r.von), bis: Math.min(a1, r.bis) }))
    .sort((p, q) => p.von - q.von);
  const seg = [];
  let t = a0;
  for (const r of schnitte) {
    if (r.von > t + 0.01) seg.push([t, r.von]);
    t = Math.max(t, r.bis);
  }
  if (a1 > t + 0.01) seg.push([t, a1]);
  /* Je Naht: nie länger als das kürzere der beiden Stücke, und nie länger als
     das, was dazwischen weggeschnitten wurde - sonst griffe die Blende über
     den Schnitt hinaus in Material, das gar nicht mehr da ist. */
  const blenden = [];
  for (let i = 0; i + 1 < seg.length; i++) {
    const weg = seg[i + 1][0] - seg[i][1];
    blenden.push(Math.max(0.02, Math.min(STANDARD.blende,
      seg[i][1] - seg[i][0], seg[i + 1][1] - seg[i + 1][0], weg)));
  }
  return { rez, seg, blenden, a0, a1, dauer };
}

function fassungBauen(id) {
  const { rez, seg, blenden } = stuecke(id);
  if (!seg.length) throw new Error('nichts übrig');
  const wav = path.join(SONGS, id, 'audio.wav');
  const quelle = fs.existsSync(wav) ? wav : path.join(SONGS, id, 'audio.mp3');
  if (!fs.existsSync(quelle)) throw new Error('kein Ton');
  const tempo = rez.tempo || 1;
  const laenge = (seg.reduce((s, g) => s + (g[1] - g[0]), 0)
                  - blenden.reduce((s, d) => s + d, 0)) / tempo;

  const f = [];
  seg.forEach((g, i) => f.push(`[0:a]atrim=start=${g[0].toFixed(4)}:end=${g[1].toFixed(4)},asetpts=N/SR/TB[s${i}]`));
  let letzte = 's0';
  blenden.forEach((d, i) => {
    f.push(`[${letzte}][s${i + 1}]acrossfade=d=${d.toFixed(4)}:c1=qsin:c2=qsin[x${i}]`);
    letzte = 'x' + i;
  });
  const nach = [];
  if (Math.abs(tempo - 1) > 1e-6) nach.push(`atempo=${tempo.toFixed(4)}`);
  const ein = (rez.rampe && rez.rampe.ein) || 0;
  const aus = (rez.rampe && rez.rampe.aus) || 0;
  if (ein > 0.01) nach.push(`afade=t=in:st=0:d=${ein.toFixed(3)}:curve=${RAMPENKURVE}`);
  if (aus > 0.01) nach.push(`afade=t=out:st=${Math.max(0, laenge - aus).toFixed(3)}:d=${aus.toFixed(3)}:curve=${RAMPENKURVE}`);
  if (nach.length) { f.push(`[${letzte}]${nach.join(',')}[aus]`); letzte = 'aus'; }

  fs.mkdirSync(EXPORTE, { recursive: true });
  const ziel = path.join(EXPORTE, id + '.mp3');
  const r = spawnSync(FFMPEG, ['-v', 'error', '-y', '-i', quelle,
    '-filter_complex', f.join(';'), '-map', `[${letzte}]`,
    '-c:a', 'libmp3lame', '-q:a', '2', ziel], { stdio: ['ignore', 'ignore', 'pipe'] });
  if (r.status !== 0) throw new Error((r.stderr || '').toString().slice(0, 400));
  /* Nachgemessen statt behauptet: was ffmpeg wirklich geschrieben hat. */
  let echt = null;
  try {
    const p2 = spawnSync(FFMPEG.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1'),
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', ziel],
      { stdio: ['ignore', 'pipe', 'pipe'] });
    if (p2.status === 0) echt = Math.round(parseFloat(String(p2.stdout)) * 1000) / 1000;
  } catch (e) {}
  return { weg: ziel, stuecke: seg.length, blenden: blenden.length,
           gerechnet: Math.round(laenge * 1000) / 1000, gemessen: echt,
           groesse: fs.statSync(ziel).size, stand: new Date().toISOString() };
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname;
  try {
    if (p === '/' || p === '/index.html') return datei(res, SEITE, 'text/html; charset=utf-8');

    if (p === '/api/rezept' && req.method === 'PUT') {
      let roh = '';
      req.on('data', (d) => { roh += d; if (roh.length > 200000) req.destroy(); });
      req.on('end', () => {
        try {
          const b = JSON.parse(roh);
          if (!b || !b.id) throw new Error('kein Lied angegeben');
          const r = rezeptSchreiben(b.id, b.rezept || {});
          json(res, { ok: true, rezept: r, stand: (r && r.stand) || null });
        } catch (e) { json(res, { fehler: String(e.message || e) }, 400); }
      });
      return;
    }
    if (p === '/api/rezept') {
      const id = u.searchParams.get('id');
      if (!id) return json(res, { fehler: 'kein Lied angegeben' }, 400);
      return json(res, { id, rezept: rezeptVon(id) });
    }

    if (p === '/api/songs') {
      /* nur Songs mit Schlagmuster - ohne geht es nicht, und das wird gesagt */
      const k = katalog();
      /* Wer ein Rezept hat, soll es an der Liste sehen - sonst sucht man ein
         halb gekürztes Lied unter dreihundert wieder. */
      const rez = (rezepteLesen().lieder) || {};
      const liste = Object.entries(k)
        .filter(([, s]) => s.schlaege && s.schlaege.length > 16 && !s.instrumental)
        .map(([id, s]) => {
          const r = rez[id];
          const weg = r ? (r.schnitte || []).reduce((n, x) => n + (x.bis - x.von), 0) : 0;
          return { id, titel: s.titel, dauer: Math.round(s.dauer), schlaege: s.schlaege.length,
                   rezept: r ? { weg: Math.round(weg * 10) / 10, stand: r.stand } : null };
        })
        .sort((a, b) => a.titel.localeCompare(b.titel, 'de'));
      const ohne = Object.values(k).filter(s => !s.schlaege || s.schlaege.length <= 16).length;
      return json(res, { songs: liste, ohneMuster: ohne });
    }

    if (p === '/api/song') {
      const id = u.searchParams.get('id');
      const s = katalog()[id];
      if (!s) return json(res, { fehler: 'unbekannt' }, 404);
      const sl = s.schlaege || [];
      /* Abschnitte aus Sunos Strukturerkennung: peak_times sind die
         Wechselpunkte, segment_labels sagt je Abschnitt A oder B. Daraus
         Flächen mit Anfang und Ende, damit die Oberfläche sie einfärben
         kann - der Song soll seine Form zeigen, nicht nur seine Länge. */
      const ab = s.abschnitte || {};
      const pt = Array.isArray(ab.peak_times) ? ab.peak_times.filter(x => x > 0.5) : [];
      const lab = Array.isArray(ab.segment_labels) ? ab.segment_labels : [];
      const grenzen = [0, ...pt, s.dauer];
      const abschnitte = [];
      for (let i = 0; i + 1 < grenzen.length; i++)
        abschnitte.push({ von: grenzen[i], bis: grenzen[i + 1], art: lab[i] || '?' });
      return json(res, {
        id, titel: s.titel, dauer: s.dauer,
        schlaege: sl.map(x => [Math.round(x[0] * 1000) / 1000, x[1]]),
        abschnitte: abschnitteVon(id).abschnitte,
        regie: abschnitteVon(id).regie || [],
        farben: abschnitteVon(id).farben,
        abschnittQuelle: abschnitteVon(id).quelle,
        huelle: huellkurve(id, 2000),
        stille: stille(id),
        zeilen: zeilenVon(id).map(z => ({ von: z.von, bis: z.bis, txt: z.txt, mal: z.malImSong,
          sprache: /[\u0400-\u04FF]/.test(z.txt) ? 'ru' : 'de',
          worte: (z.worte || []).map(w => [Math.round(w.von*1000)/1000, Math.round(w.bis*1000)/1000, w.txt, w.sicher ? 1 : 0]) })),
        deckung: deckung(id),
        fehlend: fehlendeZeilen(id)
      });
    }

    if (p === '/api/fassung' && req.method === 'POST') {
      const id = u.searchParams.get('id');
      try { return json(res, fassungBauen(id)); }
      catch (e) { return json(res, { fehler: String(e.message || e) }, 500); }
    }

    if (p === '/api/fassung') {
      const id = u.searchParams.get('id');
      const f = path.join(EXPORTE, id + '.mp3');
      if (!fs.existsSync(f)) { res.writeHead(404); return res.end('nicht gebaut'); }
      const st = fs.statSync(f);
      const r = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
      if (r) {
        const von = r[1] ? +r[1] : 0, bis = r[2] ? +r[2] : st.size - 1;
        res.writeHead(206, { 'Content-Type': 'audio/mpeg', 'Accept-Ranges': 'bytes',
          'Content-Range': `bytes ${von}-${bis}/${st.size}`, 'Content-Length': bis - von + 1 });
        return fs.createReadStream(f, { start: von, end: bis }).pipe(res);
      }
      res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Accept-Ranges': 'bytes', 'Content-Length': st.size });
      return fs.createReadStream(f).pipe(res);
    }

    if (p === '/api/kandidaten') {
      const id = u.searchParams.get('id');
      const t = +u.searchParams.get('t');
      const max = Math.min(16, +(u.searchParams.get('max') || 12));
      return json(res, kandidaten(id, t, max));
    }

    /* ---------- Der ganze Song, zum Mitlaufen ----------
     * Caspar_D, 16.11.2026: „es muss ein playhead mitlaufen, sonst sehe ich
     * nicht, wo wir sind."
     * Mit Range-Unterstützung, sonst kann der Browser nicht springen: ohne
     * sie lädt er die Datei einmal von vorn und jeder Sprung wartet. */
    if (p === '/api/audio') {
      const id = u.searchParams.get('id');
      const f = ['audio.mp3', 'audio.wav'].map(n => path.join(SONGS, id, n)).find(x => fs.existsSync(x));
      if (!f) { res.writeHead(404); return res.end('kein Ton'); }
      const typ = f.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg';
      const st = fs.statSync(f);
      const r = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
      if (r) {
        const von = r[1] ? +r[1] : 0;
        const bis = r[2] ? +r[2] : st.size - 1;
        res.writeHead(206, { 'Content-Type': typ, 'Accept-Ranges': 'bytes',
          'Content-Range': `bytes ${von}-${bis}/${st.size}`, 'Content-Length': bis - von + 1 });
        return fs.createReadStream(f, { start: von, end: bis }).pipe(res);
      }
      res.writeHead(200, { 'Content-Type': typ, 'Accept-Ranges': 'bytes', 'Content-Length': st.size });
      return fs.createReadStream(f).pipe(res);
    }

    if (p === '/api/naht' || p === '/api/original') {
      const id = u.searchParams.get('id');
      const t = +u.searchParams.get('t'), z = +u.searchParams.get('u');
      const f = (p === '/api/naht' ? nahtBauen : originalBauen)(id, t, z);
      return datei(res, f, 'audio/mpeg');
    }

    res.writeHead(404); res.end('nichts hier');
  } catch (e) {
    json(res, { fehler: (e && e.message) || String(e) }, 500);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Kürzen-Labor:  http://127.0.0.1:${PORT}/`);
  console.log(`  (Werkstatt, nicht Betrieb. library/ wird nur gelesen.)\n`);
});
