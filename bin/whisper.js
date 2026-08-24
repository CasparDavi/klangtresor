/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Wort-Zeitmarken mit Whisper - für Songs, denen Sunos Zeitmarken fehlen.
 *
 *   node bin/whisper.js                 alle Songs ohne Zeitmarken, neueste zuerst
 *   node bin/whisper.js --anzahl 5      nur die nächsten fünf
 *   node bin/whisper.js <id>            genau einer (auch wenn er schon Zeitmarken hat)
 *   node bin/whisper.js --still         ohne Lebenszeichen je Segment
 *
 * ---------------------------------------------------------------------
 * WOZU
 *
 * 253 von 321 Songs tragen Sunos eigene Wort-Zeitmarken (aligned
 * lyrics) - die Karaoke-Ansicht lebt davon. 68 haben keine: private
 * Songs, alte, Instrumentals, oder solche, deren Text Suno nie
 * ausgerichtet hat. Für die rechnet Whisper (large-v3) die Zeitmarken
 * nach - und bei Songs ohne Text im Archiv auch den Text selbst.
 *
 * Tarjas Wunsch vom 20.08.2026 ("Zeitverankerung des Textes über
 * Whisper, large-v3 - sie untertitelt ihre Twitch-Streams damit").
 *
 * ---------------------------------------------------------------------
 * WERKZEUG UND TEMPO
 *
 * whisper.cpp, selbst gebaut, rein CPU + Apple Accelerate (der
 * Metal-Pfad stürzt auf Caspar_Ds Intel-Mac ab, deshalb GGML_METAL=OFF):
 * Gemessen am 20.08.2026 (i7-10700K, 16 Threads): 4:02 Musik in 5:49,
 * also ~1,4-fache Echtzeit. Das ist ein Nachtlauf, kein Knopfdruck
 * (Caspar_D: "wenn es für einen Song 10 min dauert, dann ist das so").
 * Darum: neueste Songs zuerst, jeder fertige Song sofort geschrieben,
 * Abbruch jederzeit, Wiederaufnahme überspringt das Fertige.
 *
 * ---------------------------------------------------------------------
 * DER BEKANNTE TEXT
 *
 * Whisper hört - und verhört sich. Hat der Song Lyrics im Archiv,
 * bekommt Whisper sie als Prompt (senkt die Fehlerrate spürbar), und
 * hinterher werden die gehörten Wörter mit den offiziellen verglichen
 * (längste gemeinsame Teilfolge über normalisierte Wörter): Wo sie
 * sich treffen, gewinnt die offizielle Schreibweise; was Whisper
 * zusätzlich hört (Ad-libs, Wiederholungen), bleibt als gehört stehen.
 *
 * ---------------------------------------------------------------------
 * EINE DATEI
 *
 * library/whisper.ndjson - eine Zeile je Song (exFAT: eine Datei = 1 MB).
 * Format je Zeile:
 *   { id, titel, stand, modell, sprache, sekundenGerechnet,
 *     worte: [[start, ende, "Wort "], ...],   // wie Sunos worte
 *     text, instrumental, abgeglichen }
 * aufbereiten.js liest sie und trägt worte/lyrics bei Songs nach, die
 * keine haben - mit Quelle 'whisper', damit die Seite es sagen kann.
 */
const fs   = require('node:fs');
const path = require('node:path');
const os   = require('node:os');
const { spawnSync } = require('node:child_process');
const K    = require('./katalog.js');

const WURZEL  = path.join(__dirname, '..');
const SONGS   = path.join(WURZEL, 'library', 'songs');
const DATEI   = path.join(WURZEL, 'library', 'whisper.ndjson');
/* WO WHISPER LIEGT. Gesucht wird der Reihe nach: die Umgebungsvariable, dann
   Orte IM PROJEKT, dann der Suchpfad und die ueblichen Systemorte - und erst
   zuletzt Caspar_Ds eigener Bauplatz. Vorher stand hier nur sein Mac-Pfad als
   Vorgabe, und auf Tarjas Linux-Rechner fand das Skript darum nie etwas
   (23.08.2026). */
const WO_WERKZEUG = [
  process.env.WHISPER_CLI,
  path.join(WURZEL, 'library', 'modelle', 'whisper-cli'),
  path.join(WURZEL, 'werkzeuge', 'whisper.cpp', 'build', 'bin', 'whisper-cli'),
  /* Eine Ebene UEBER dem Projekt. Wer sich whisper.cpp selbst baut,
     legt es meist daneben statt hinein - es gehoert ja nicht dazu.
     Relativ und nicht absolut: so greift es bei jedem, und niemandes
     Plattenname steht im Quelltext. */
  path.join(WURZEL, '..', 'werkzeuge', 'whisper.cpp', 'build', 'bin', 'whisper-cli'),
  '/usr/local/bin/whisper-cli', '/opt/homebrew/bin/whisper-cli', '/usr/bin/whisper-cli',
];
const WO_MODELL = [
  process.env.WHISPER_MODELL,
  path.join(WURZEL, 'library', 'modelle', 'ggml-large-v3.bin'),
  path.join(WURZEL, 'library', 'modelle', 'ggml-medium.bin'),
  path.join(WURZEL, 'werkzeuge', 'whisper.cpp', 'modelle', 'ggml-large-v3.bin'),
  path.join(WURZEL, '..', 'werkzeuge', 'whisper.cpp', 'modelle', 'ggml-large-v3.bin'),
];
const daIst = (orte) => orte.find(o => o && fs.existsSync(o)) || null;
const imPfad = (name) => { const r = spawnSync('which', [name], { encoding: 'utf8' });
  return r.status === 0 && (r.stdout || '').trim() ? r.stdout.trim() : null; };
const WERKZEUG = daIst(WO_WERKZEUG) || imPfad('whisper-cli') || WO_WERKZEUG[1];
const MODELL   = daIst(WO_MODELL) || WO_MODELL[1];
const THREADS = Math.max(2, os.cpus().length);

const args   = process.argv.slice(2);

/* Der Mac darf beim Rechnen nicht einschlafen (Nacht 20./21.08.2026:
   Whisper stand von 2 bis 9 Uhr, weil der Mac schlief). Der
   Morgenschritt startet uns schon unter caffeinate; der Handstart
   stellt sich hier selbst darunter und reicht alles durch. */
if (process.platform === 'darwin' && !process.env.WHISPER_WACH) {
  const r = spawnSync('caffeinate', ['-i', process.execPath, __filename, ...args],
    { stdio: 'inherit', env: { ...process.env, WHISPER_WACH: '1' } });
  process.exit(r.status === null ? 1 : r.status);
}
const nur    = args.find(a => /^[0-9a-f-]{36}$/.test(a));
const still  = args.includes('--still');
const anzahl = args.includes('--anzahl') ? +args[args.indexOf('--anzahl') + 1] : Infinity;
/* --alle: nicht nur die Songs ohne Sunos Zeitmarken, sondern jeder,
   der noch keine Whisper-Zeile hat - fuer die Spurwahl in der Buehne
   (Caspar_D, 20.08.2026: "whisper fuer die verbleibenden Songs
   nachziehen"). Instrumentals werden NICHT vorab aussortiert: Sunos
   has_vocal-Feld ist unbrauchbar (196 von 321 angeblich ohne Gesang),
   und Whisper markiert Instrumentals ohnehin selbst. */
const alleModus = args.includes('--alle');
/* Ausgeschlossene Playlists: Naturklang-Landschaften ohne Gesang.
   Whisper quaelt sich durch jede (Wiese mit Insekten: 34 min Rechnen
   fuer 45 halluzinierte Woerter) und liefert nichts. Wer einen Song
   daraus doch will: mit seiner ID aufrufen, das schlaegt den Ausschluss.
   (Caspar_D, 20.08.2026: "kannst du diese Playlist excludieren".) */
const OHNE_PLAYLISTS = new Set([
  'c0c1547f-d62e-46ea-9cb2-740a952a6a10',   // Fokus-Wanderung (48 Naturklaenge)
]);

/* Suiten-Instrumentals: Titel, die auf eine roemische Ziffer I-IV
   enden (Unter der Haut I-IV, Velourbogen, Atem der Nacht, Nachglut),
   sind Instrumentalstuecke ohne Gesang (Caspar_D, 20.08.2026: "Alle mit
   I - IV nummerierten sind Instrumentalstuecke, die alle weglassen").
   Auch hier schlaegt der Aufruf mit einer ID den Ausschluss. */
const INSTRUMENTAL_TITEL = /\s(I|II|III|IV)$/;

if (!fs.existsSync(WERKZEUG) || !fs.existsSync(MODELL)) {
  /* Whisper ist optional (Tarjas Paket, 21.08.2026): fehlt es, wird
     der Schritt uebersprungen, nicht die ganze Morgenkette gestoppt.
     Exit 0 mit klarer Meldung; Einrichtung in START-HIER.md. */
  const fehlt = [];
  if (!fs.existsSync(WERKZEUG)) fehlt.push('das Programm whisper-cli');
  if (!fs.existsSync(MODELL))   fehlt.push('das Sprachmodell (ggml-*.bin)');
  console.log(`  Whisper nicht eingerichtet — übersprungen. Es fehlt: ${fehlt.join(' und ')}.

  Gesucht wurde der Reihe nach:
${WO_WERKZEUG.filter(Boolean).map(o => '    ' + o).join('\n')}
  und als Sprachmodell:
${WO_MODELL.filter(Boolean).map(o => '    ' + o).join('\n')}

  Am einfachsten: beides nach library/modelle/ legen (whisper-cli und
  ggml-large-v3.bin) — dann findet es sich von selbst. Oder die Orte angeben:
    WHISPER_CLI=… WHISPER_MODELL=… node bin/whisper.js
  Ausführlich: START-HIER.md („Karaoke-Zeitmarken mit Whisper“) bzw. docs/WHISPER.md`);
  process.exit(0);
}

/* ---- Text-Helfer: Kern in whisper-text.js, geteilt mit dem
   Nachlauf bin/whisper-abgleich.js ---------------------------------- */
const { norm, lyricsWoerter, abgleichen } = require('./whisper-text.js');

/* Whisper-Tokens → Wörter. Ein Token mit führendem Leerzeichen beginnt
   ein neues Wort; Sondertokens ([_BEG_], [_TT_...]) fallen weg. */
function woerterAusSegmenten(segmente) {
  const worte = [];
  /* Zeit eines Tokens: DTW, wenn gerechnet (t_dtw, in 10-ms-Schritten),
     sonst die Segment-Heuristik. DTW nennt den Moment, in dem das
     Token klingt - als Wortanfang der erste, als Ende der letzte. */
  const zeit = (t) => (t.t_dtw >= 0 ? t.t_dtw / 100 : (t.offsets.from || 0) / 1000);
  for (const seg of segmente) {
    let akt = null;
    for (const t of seg.tokens || []) {
      if (/^\[_/.test(t.text)) continue;
      const txt = t.text;
      if (!txt.trim()) continue;
      const s = zeit(t), e = t.t_dtw >= 0 ? t.t_dtw / 100 : (t.offsets.to || 0) / 1000;
      if (txt.startsWith(' ') || !akt) {
        if (akt) { akt.text += ' '; worte.push(akt); }   // Sunos Format: Leerzeichen gehoert zum Wort
        akt = { s, e, text: txt.trim() };
      } else {
        akt.text += txt; akt.e = Math.max(akt.e, e);
      }
    }
    if (akt) { akt.text += '\n'; worte.push(akt); }     // Segmentende = Zeilenende
  }
  /* Ein Wort endet spaetestens, wenn das naechste beginnt. */
  for (let i = 0; i + 1 < worte.length; i++)
    if (worte[i].e > worte[i + 1].s) worte[i].e = worte[i + 1].s;
  /* Stempel-Klumpen: In stillen Passagen halluziniert Whisper ganze
     Zeilen und stempelt sie ALLE auf denselben Zeitpunkt (Okkultation,
     159 "Woerter" um 177,7 s). Mehr als fuenf Woerter auf derselben
     Zeit tragen keine Zeitinformation - der ganze Klumpen fliegt. */
  const aus = [];
  for (let i = 0; i < worte.length; ) {
    let j = i;
    while (j + 1 < worte.length && Math.abs(worte[j + 1].s - worte[i].s) < 0.02) j++;
    if (j - i + 1 <= 5) for (let k = i; k <= j; k++) aus.push(worte[k]);
    i = j + 1;
  }
  return aus.filter(w => norm(w.text));
}

/* ---- Ein Song ------------------------------------------------------- */
function rechnen(s, tmp) {
  const mp3 = path.join(SONGS, s.id, 'audio.mp3');
  if (!fs.existsSync(mp3)) return { fehler: 'keine audio.mp3' };
  const wav = path.join(tmp, s.id + '.wav');
  const ff = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', mp3, '-ac', '1', '-ar', '16000', wav]);
  if (ff.status !== 0) return { fehler: 'ffmpeg: ' + (ff.stderr || '').toString().trim().slice(0, 120) };

  const hatText = !!(s.lyrics && s.lyrics.trim());
  const prompt  = hatText ? s.lyrics.replace(/\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 800) : '';
  /* Sprache: NICHT raten lassen. Bei "Ich dreh mich nicht um!" tippte
     -l auto auf Englisch und Whisper UEBERSETZTE den deutschen Text
     (20.08.2026). Der Grund liegt im Modell selbst: Whisper ist auf
     BEIDES trainiert - transkribieren und ins Englische uebersetzen -,
     und welches von beidem es tut, entscheidet allein das
     Sprach-Token. Steht dort "en", waehrend deutsches Audio kommt,
     liefert es die Uebersetzung und haelt das fuer seine Aufgabe.
     Deshalb geben wir die Sprache vor; ohne Lyrics bleibt auto.

     NUR DER ANFANG ZAEHLT (24.08.2026). Vorher lief die Zaehlung ueber
     das ganze Lyricsfeld - und Caspar_D haengt bei manchen Songs den
     englischen Text unten an ("##### English text at the bottom
     #####"). Dann gab der Anhang den Ausschlag, das Lied bekam "en"
     gesagt und wurde uebersetzt. Betroffen waren fuenf Songs, unter
     ihnen "Der Vulkan und das Maedchen" (95 deutsche gegen 125
     englische Signalwoerter) und "Schlaraffenland v3".
     Der gesungene Text steht oben, die Uebersetzung unten - also
     entscheidet die erste Haelfte. */
  let sprache = 'auto';
  if (hatText) {
    const zeilen = s.lyrics.split('\n').filter(z => z.trim());
    const oben = zeilen.slice(0, Math.max(4, Math.ceil(zeilen.length * 0.5))).join('\n');
    const zaehl = (txt) => {
      const t = ' ' + txt.toLowerCase().replace(/[^a-zäöüß]+/g, ' ') + ' ';
      return {
        de: (t.match(/ (und|nicht|ich|das|der|die|ein|mit|dem|wir|du|mein|kein|noch|wie|sich|auf) /g) || []).length,
        en: (t.match(/ (the|and|you|not|with|this|that|what|your|of|is|are|it|to|in) /g) || []).length
      };
    };
    const o = zaehl(oben);
    /* Ist die obere Haelfte eindeutig, entscheidet sie. Ist sie es
       nicht (zu kurz, zu wenig Signalwoerter), das ganze Feld. */
    const g = (o.de + o.en >= 6) ? o : zaehl(s.lyrics);
    sprache = g.de >= g.en ? 'de' : 'en';
  }
  const aus = path.join(tmp, s.id);
  /* -dtw + -nfa (20.08.2026): Die Standard-Zeitmarken (Segment-
     Heuristik) lagen im Schnitt 0,55 s ZU FRUEH (gemessen gegen Sunos
     v2 an "Okkultation": Median -0,55 s, Anfang bis -1,4 s). Die
     DTW-Token-Zeiten treffen dagegen fast exakt (Daemmerung: v2 1,915,
     DTW 1,92, Heuristik 0,22). DTW verlangt abgeschaltete
     Flash-Attention (-nfa), sonst bleibt t_dtw leer (-1); das kostet
     Tempo, und Genauigkeit schlaegt Tempo im Nachtlauf. */
  /* -mc 0 (kein Text-Kontext aus dem vorigen Fenster): Whisper neigt
     bei Musik zu Schleifen - dieselbe Zeile 67-mal, weil sie sich
     ueber den Kontext selbst bestaetigt. (Ein -nc gibt es in diesem
     Build nicht; der erste Versuch damit liess whisper-cli sofort
     aussteigen, 42 Songs "JSON unlesbar", 20.08.2026.) */
  const argv = ['-m', MODELL, '-f', wav, '-l', sprache, '-t', String(THREADS), '-ojf', '-of', aus, '-np',
                '-dtw', 'large.v3', '-nfa', '-mc', '0'];
  if (prompt) argv.push('--prompt', prompt);

  const t0 = Date.now();
  const w = spawnSync(WERKZEUG, argv, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const sek = (Date.now() - t0) / 1000;
  try { fs.unlinkSync(wav); } catch (e) {}
  if (w.status !== 0) return { fehler: 'whisper: ' + (w.stderr || '').split('\n').filter(Boolean).slice(-2).join(' | ').slice(0, 200) };

  let j; try { j = JSON.parse(fs.readFileSync(aus + '.json', 'utf8')); } catch (e) { return { fehler: 'JSON unlesbar' }; }
  try { fs.unlinkSync(aus + '.json'); } catch (e) {}
  const segmente = j.transcription || [];
  const worte = woerterAusSegmenten(segmente);
  const text  = segmente.map(x => (x.text || '').trim()).filter(Boolean).join('\n');
  const instrumental = worte.length < 5 || /^[♪\s]*$/.test(text);
  /* Schleifen-Verdacht: dieselbe Zeile sehr oft, oder weit mehr
     gehoerte Woerter als der Text hat. So ein Ergebnis wird ehrlich
     markiert und von aufbereiten.js NICHT uebernommen. */
  const zeilenZahl = {};
  for (const z of text.split('\n')) if (z.trim()) zeilenZahl[z] = (zeilenZahl[z] || 0) + 1;
  const maxWdh = Math.max(0, ...Object.values(zeilenZahl));
  const schleife = maxWdh > 8;
  let abgeglichen = 0;
  if (hatText && !instrumental) abgeglichen = abgleichen(worte, lyricsWoerter(s.lyrics));

  return {
    id: s.id, titel: s.titel || '', stand: new Date().toISOString(),
    modell: path.basename(MODELL).replace(/^ggml-|\.bin$/g, ''),
    zeitverfahren: 'dtw',
    schleife,
    sprache: sprache !== 'auto' ? sprache : ((j.result && j.result.language) || null),
    sekundenGerechnet: Math.round(sek), dauer: Math.round(s.dauer || 0),
    worte: worte.map(w => [+w.s.toFixed(3), +w.e.toFixed(3), w.text]),
    text, instrumental, abgeglichen,
  };
}

/* ---- Lauf ----------------------------------------------------------- */
(function () {
  const katalog = K.lesen();
  if (!katalog) { console.error('Kein Katalog - erst node bin/aufbereiten.js'); process.exit(1); }

  const fertig = new Set();
  if (fs.existsSync(DATEI))
    for (const z of fs.readFileSync(DATEI, 'utf8').split('\n'))
      if (z.trim()) { try { fertig.add(JSON.parse(z).id); } catch (e) {} }

  let liste = Object.values(katalog.songs).filter(s => !s.fremd);
  if (nur) liste = liste.filter(s => s.id === nur);
  else {
    liste = liste.filter(s => !(s.playlists || []).some(p => OHNE_PLAYLISTS.has(p)));
    liste = liste.filter(s => !INSTRUMENTAL_TITEL.test(s.titel || ''));
    if (alleModus) liste = liste.filter(s => !fertig.has(s.id));
    else liste = liste.filter(s => !(s.worte && s.worte.length) && !fertig.has(s.id));
  }
  /* Neueste zuerst - "von den neuesten Songs an und immer weiter in
     die Vergangenheit" (Caspar_D, 20.08.2026). */
  liste.sort((a, b) => (b.erstellt || '').localeCompare(a.erstellt || ''));
  liste = liste.slice(0, anzahl);

  console.log(`\n  Whisper ${path.basename(MODELL)} · ${THREADS} Threads · ${liste.length} Songs` +
              (fertig.size ? ` (${fertig.size} schon fertig)` : '') + '\n');
  if (!liste.length) return;

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'whisper-'));
  fs.mkdirSync(path.dirname(DATEI), { recursive: true });
  let n = 0, schief = 0, gesamtSek = 0;
  for (const s of liste) {
    n++;
    const kopf = `  [${n}/${liste.length}] ${(s.titel || s.id).slice(0, 48)}  (${Math.floor((s.dauer||0)/60)}:${String(Math.round((s.dauer||0)%60)).padStart(2,'0')})`;
    if (!still) process.stdout.write(kopf + ' …');
    const r = rechnen(s, tmp);
    if (r.fehler) { schief++; console.log(`\r${kopf}  ✗ ${r.fehler}`); continue; }
    fs.appendFileSync(DATEI, JSON.stringify(r) + '\n');
    gesamtSek += r.sekundenGerechnet;
    console.log(`\r${kopf}  ${r.schleife ? '⚠ Schleife — verworfen,' : '✓'} ${r.instrumental ? 'instrumental' : r.worte.length + ' Wörter' + (r.abgeglichen ? `, ${r.abgeglichen} abgeglichen` : '')}` +
                `  ${r.sekundenGerechnet}s (${(r.sekundenGerechnet / Math.max(1, r.dauer)).toFixed(1)}× Echtzeit)`);
  }
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {}
  console.log(`\n  ${n - schief} Songs fertig${schief ? `, ${schief} übersprungen` : ''}, ${Math.round(gesamtSek / 60)} min gerechnet.`);
  console.log(`  ${path.relative(WURZEL, DATEI)}  (${(fs.statSync(DATEI).size / 1024).toFixed(0)} KB)`);
  console.log(`  Dann: node bin/aufbereiten.js - trägt die Zeitmarken in den Katalog.\n`);
})();
