#!/usr/bin/env node
/* DIE LÜCKEN DURCH WHISPER JAGEN (16.11.2026)
 * ===========================================
 *
 * Caspar_D: „nein, wir müssen nur die lücken durch whisper jagen."
 *
 * WOZU. Die bereinigte Lyrik (library/lyrik.json) hat für Snegurotschka 77
 * von 100 gesungenen Zeilen. Es fehlen alle 19 russischen und ein paar
 * deutsche, die Whisper überhört hat. Grund: bin/whisper.js entscheidet die
 * Sprache für den GANZEN Song nach Buchstabenmehrheit (298 kyrillische gegen
 * 3442 lateinische ergeben „de"), also hat Whisper `Огонь горит` nie gehört,
 * sondern deutsche Phantasiewörter - an einer Stelle die bekannte
 * Halluzination „Untertitelung im Auftrag des ZDF".
 *
 * WARUM NICHT DEN GANZEN SONG NEU. Zwei volle Läufe je Song (de und ru) sind
 * rund vier Stunden für die vier gemischten Lieder. Die Lücken sind bei
 * Snegurotschka zusammen etwa 100 Sekunden Audio. Es wird also nur gerechnet,
 * was fehlt.
 *
 * ZWEI VORTEILE GEGENÜBER DEM VOLLEN LAUF:
 *   1. Die Sprache wird je Lücke bestimmt, nicht je Song - kyrillische
 *      Zeilen bekommen „-l ru", lateinische „-l de".
 *   2. Der erwartete Text geht als `--prompt` mit. Whisper weiß damit, was
 *      dort stehen soll. Das ist der Hebel, den ein voller Lauf nicht hat.
 *
 * WAS ES NICHT TUT: library/ anfassen. Das Ergebnis geht nach
 * library/lueckentext.json - eine eigene Datei, wie lyrik.json und klang.json
 * auch. whisper.ndjson und der Katalog bleiben unberührt.
 *
 * Aufruf:
 *   node bin/lueckentext.js <id>              rechnet die Lücken eines Songs
 *   node bin/lueckentext.js <id> --probe      zeigt nur, was zu tun wäre
 *   node bin/lueckentext.js <id> --nur 1      nur die erste Lücke (zum Prüfen)
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const os = require('os');
const { spawnSync } = require('child_process');

const WURZEL = path.join(__dirname, '..');
const LIB = path.join(WURZEL, 'library');
const SONGS = path.join(LIB, 'songs');
const ZIEL = path.join(LIB, 'lueckentext.json');
const W = require('./whisper.js');
const WT = require('./whisper-text.js');

const { programm: WHISPER, modell: MODELL } = W.wo();
const ffmpeg = () => {
  const e = path.join(WURZEL, 'werkzeug', 'ffmpeg', 'bin', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  return fs.existsSync(e) ? e : 'ffmpeg';
};

const katalog = () => JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(LIB, 'katalog.json.gz')))).songs || {};
const norm = (t) => String(t).toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();
const istKyrillisch = (t) => (String(t).match(/[Ѐ-ӿ]/g) || []).length > (String(t).match(/[a-zäöüß]/gi) || []).length;

/* ---------- Welche Zeilen fehlen, und wo liegen sie ----------
 * Die Reihenfolge trägt: die bereinigten Zeilen stehen in derselben Folge wie
 * im Liedtext. Was dazwischen nicht wiederzufinden ist, fehlt - und liegt
 * zwischen den Zeiten seiner beiden Nachbarn. */
function luecken(id) {
  const s = katalog()[id];
  const L = JSON.parse(fs.readFileSync(path.join(LIB, 'lyrik.json'), 'utf8'));
  const rein = ((L.lieder || {})[id] || {}).zeilen || [];
  const haben = rein.map(z => norm(z.text));
  const ges = String(s.lyrics || '').split('\n').map(z => z.trim())
    .filter(z => z && !/^\[[^\]]*\]$/.test(z));

  /* JE SPRACHE EINE LÜCKE, NICHT JE MEHRHEIT (16.11.2026). Der erste Versuch
     gab jeder Lücke eine Sprache nach Mehrheit der Zeilen. Lücke 3 bei
     Snegurotschka (149,98–182,64 s) enthält „Согрей меня" UND „Funken
     fliegen! Eisen glüht!" - sie bekam „de", und das Russische wäre wieder
     durchgefallen. Genau der Fehler, den bin/whisper.js für den ganzen Song
     macht. Also wird am Sprachwechsel getrennt, und die Zeiten werden
     anteilig nach Zeilenzahl aufgeteilt. */
  const aus = [];
  let zeiger = 0, offen = [];
  const ablegen = (von, bis) => {
    if (!offen.length) return;
    const bloecke = [];
    for (const z of offen) {
      const sp = istKyrillisch(z) ? 'ru' : 'de';
      const letzt = bloecke[bloecke.length - 1];
      if (letzt && letzt.sprache === sp) letzt.zeilen.push(z);
      else bloecke.push({ sprache: sp, zeilen: [z] });
    }
    const gesamt = offen.length;
    let t = von;
    for (const b of bloecke) {
      const anteil = (bis - von) * (b.zeilen.length / gesamt);
      aus.push({ von: t, bis: t + anteil, zeilen: b.zeilen, sprache: b.sprache });
      t += anteil;
    }
    offen = [];
  };
  for (const z of ges) {
    const k = norm(z);
    if (!k) continue;
    let tr = -1;
    for (let j = zeiger; j < haben.length && j < zeiger + 12; j++) if (haben[j] === k) { tr = j; break; }
    if (tr >= 0) {
      ablegen(zeiger > 0 ? rein[zeiger - 1].bis : 0, rein[tr].von);
      zeiger = tr + 1;
    } else offen.push(z);
  }
  if (rein.length) ablegen(rein[rein.length - 1].bis, s.dauer);
  /* Benachbarte Lücken mit gleicher Sprache zusammenfassen - ein Aufruf
     statt vieler, und Whisper hat mehr Zusammenhang. */
  const dicht = [];
  for (const l of aus) {
    const letzt = dicht[dicht.length - 1];
    if (letzt && letzt.sprache === l.sprache && l.von - letzt.bis < 2.5) {
      letzt.bis = l.bis; letzt.zeilen.push(...l.zeilen);
    } else dicht.push(l);
  }
  return dicht.filter(l => l.bis - l.von > 0.8);
}

/* ---------- Eine Lücke rechnen ---------- */
function eineLuecke(id, l, tmp, nr) {
  const quelle = ['audio.wav', 'audio.mp3'].map(n => path.join(SONGS, id, n)).find(p => fs.existsSync(p));
  const wav = path.join(tmp, `l${nr}.wav`);
  /* etwas Vorlauf, damit Whisper nicht mitten im Wort anfängt */
  const von = Math.max(0, l.von - 0.4), bis = l.bis + 0.4;
  spawnSync(ffmpeg(), ['-v', 'error', '-y', '-ss', String(von), '-to', String(bis),
    '-i', quelle, '-ac', '1', '-ar', '16000', wav], { stdio: ['ignore', 'ignore', 'pipe'] });

  const aus = path.join(tmp, `l${nr}`);
  /* DER ERWARTETE TEXT ALS PROMPT. whisper.cpp nimmt ihn als Anfangskontext -
     es weiß dadurch, welche Wörter zu erwarten sind. Genau das kann ein
     Lauf über den ganzen Song nicht. */
  const prompt = l.zeilen.join(' ').slice(0, 900);
  const argv = ['-m', MODELL, '-f', wav, '-l', l.sprache, '-t', '8', '-ojf', '-of', aus, '-np',
                '-dtw', 'large.v3', '-nfa', '-mc', '0', '--prompt', prompt];
  const r = spawnSync(WHISPER, argv, { stdio: ['ignore', 'ignore', 'pipe'] });
  if (r.status !== 0) return { fehler: (r.stderr || '').toString().slice(0, 200) };

  let j; try { j = JSON.parse(fs.readFileSync(aus + '.json', 'utf8')); } catch (e) { return { fehler: 'keine Ausgabe' }; }
  /* TOKENS SIND KEINE WÖRTER (16.11.2026). whisper.cpp gibt Teilstücke aus:
     „О", „г", „онь" statt „Огонь" - der erste Versuch nahm jedes Token für
     ein Wort und fand deshalb nur 4 von 20 Wörtern wieder, obwohl der Text
     richtig gehört war. Ein neues Wort beginnt, wo das Token mit einem
     Leerzeichen anfängt; Satzzeichen hängen an ihrem Wort. Deshalb darf hier
     NICHT getrimmt werden, bevor die Grenze erkannt ist. */
  const worte = [];
  for (const seg of (j.transcription || []))
    for (const t of (seg.tokens || [])) {
      const roh = String(t.text || '');
      if (!roh.trim() || /^\[|^</.test(roh.trim())) continue;
      const o = t.offsets || {};
      const a = von + (o.from || 0) / 1000, b = von + (o.to || 0) / 1000;
      const neuesWort = /^\s/.test(roh) || !worte.length;
      if (neuesWort) worte.push({ von: a, bis: b, txt: roh.trim() });
      else { const w = worte[worte.length - 1]; w.txt += roh.trim(); w.bis = b; }
    }
  /* alleinstehende Satzzeichen ans Wort davor */
  for (let i = worte.length - 1; i > 0; i--)
    if (/^[.,!?;:…»«"'\-–—]+$/.test(worte[i].txt)) {
      worte[i - 1].txt += worte[i].txt; worte[i - 1].bis = worte[i].bis; worte.splice(i, 1);
    }
  /* Schreibweise gegen die erwarteten Zeilen ziehen - dieselbe Funktion wie
     im Haus, kein zweites Verfahren. */
  const offiziell = WT.lyricsWoerter(l.zeilen.join('\n'));
  const treffer = WT.abgleichen(worte.map(w => ({ get text(){ return w.txt; }, set text(v){ w.txt = v; } })), offiziell);
  return { worte, treffer, gesucht: offiziell.length };
}

function main() {
  const id = process.argv[2];
  const probe = process.argv.includes('--probe');
  const nurIdx = process.argv.indexOf('--nur');
  const nur = nurIdx > 0 ? +process.argv[nurIdx + 1] : 0;
  if (!id) { console.error('Song-Id fehlt.'); process.exit(1); }
  if (!WHISPER || !MODELL) { console.error('whisper-cli oder Modell fehlt.'); process.exit(1); }

  const k = katalog()[id];
  if (!k) { console.error('Unbekannter Song.'); process.exit(1); }
  let L = luecken(id);
  console.log(`${k.titel}\n${L.length} Lücken, zusammen ${L.reduce((s, l) => s + (l.bis - l.von), 0).toFixed(1)} s Audio:\n`);
  for (const [i, l] of L.entries())
    console.log(`  ${String(i + 1).padStart(2)}. ${l.von.toFixed(2)}–${l.bis.toFixed(2)} s  [${l.sprache}]  ${(l.bis-l.von).toFixed(1)} s  ${l.zeilen.length} Zeilen: ${l.zeilen[0].slice(0, 44)}`);
  if (probe) return;
  if (nur) L = L.slice(0, nur);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'luecke-'));
  const stand = fs.existsSync(ZIEL) ? JSON.parse(fs.readFileSync(ZIEL, 'utf8')) : { stand: null, lieder: {} };
  const ergebnis = [];
  const t0 = Date.now();
  for (const [i, l] of L.entries()) {
    const s0 = Date.now();
    const r = eineLuecke(id, l, tmp, i);
    const dauer = ((Date.now() - s0) / 1000).toFixed(0);
    if (r.fehler) { console.log(`\n  ${i + 1}. FEHLER: ${r.fehler}`); continue; }
    console.log(`\n  ${i + 1}. ${l.von.toFixed(2)}–${l.bis.toFixed(2)} s [${l.sprache}], ${dauer} s gerechnet, `
      + `${r.treffer}/${r.gesucht} Wörter wiedergefunden`);
    console.log(`     erwartet: ${l.zeilen.join(' / ').slice(0, 96)}`);
    console.log(`     gehört:   ${r.worte.map(w => w.txt).join(' ').slice(0, 96)}`);
    ergebnis.push({ von: l.von, bis: l.bis, sprache: l.sprache, zeilen: l.zeilen,
      treffer: r.treffer, gesucht: r.gesucht,
      worte: r.worte.map(w => [Math.round(w.von * 1000) / 1000, Math.round(w.bis * 1000) / 1000, w.txt]) });
  }
  stand.lieder[id] = { stand: new Date().toISOString(), luecken: ergebnis };
  stand.stand = new Date().toISOString();
  if (!probe) fs.writeFileSync(ZIEL, JSON.stringify(stand, null, 1));
  try { for (const f of fs.readdirSync(tmp)) fs.unlinkSync(path.join(tmp, f)); fs.rmdirSync(tmp); } catch (e) {}
  console.log(`\n${ergebnis.length} Lücken gerechnet in ${Math.round((Date.now() - t0) / 1000)} s  →  ${ZIEL}`);
}

main();
