/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ============================================================
   Suno-Archiv · Server
   ------------------------------------------------------------
   Serviert das Archiv als Website im Heimnetz.

   Start:  node server/server.js
   Mac:    http://localhost:8788
   iPhone: http://<IP-des-Macs>:8788

   Ohne Zusatzpakete - nur Node-Bordmittel.
   ============================================================ */

const http = require('node:http');
const fs   = require('node:fs');
const path = require('node:path');
const os   = require('node:os');
const K    = require('../bin/katalog.js');

const PORT   = 8788;
const WURZEL = path.join(__dirname, '..');
const WEB    = path.join(WURZEL, 'web');
const SONGS  = path.join(WURZEL, 'library', 'songs');
const PLAYLISTBILDER = path.join(WURZEL, 'library', 'playlistbilder');
const ANALYSE = path.join(WURZEL, 'library', 'analyse');

/* ------------------------------------------------------------
   Katalog im Speicher halten
   ------------------------------------------------------------
   Der Katalog ist eine gepackte Datei von wenigen hundert KB.
   Ihn einmal zu entpacken und im Speicher zu halten ist deutlich
   schneller, als ihn bei jeder Anfrage von der Platte zu lesen.
   Ändert sich die Datei (nach einem Sync), laden wir neu.
------------------------------------------------------------ */
let katalog = null, stand = 0, schlankeListe = null;
let analyseIndex = null, analyseIndexStand = 0;
function analyseIndexHolen() {
  const f = path.join(WURZEL, 'library', 'analyse-index.json');
  let m = 0;
  try { m = fs.statSync(f).mtimeMs; } catch (e) { return null; }
  if (!analyseIndex || m !== analyseIndexStand) {
    try { analyseIndex = JSON.parse(fs.readFileSync(f, 'utf8')).songs; analyseIndexStand = m; }
    catch (e) { analyseIndex = null; }
  }
  return analyseIndex;
}

function katalogHolen() {
  let m = 0;
  try { m = fs.statSync(K.KATALOG).mtimeMs; } catch (e) { return null; }
  if (!katalog || m !== stand) {
    katalog = K.lesen();
    stand   = m;
    schlankeListe = katalog
      ? Object.values(katalog.songs)
          .map(K.schlank)
          .sort((a, b) => (b.erstellt || '').localeCompare(a.erstellt || ''))
      : null;
    console.log(`  Katalog geladen: ${schlankeListe ? schlankeListe.length : 0} Songs`);
  }
  return katalog;
}

function jsonAntwort(res, daten, status) {
  const text = JSON.stringify(daten);
  res.writeHead(status || 200, {
    'Content-Type':   'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    'Cache-Control':  'no-cache',
  });
  res.end(text);
}

let zonenSpeicher = null;   /* library/notenzonen.json, einmal gelesen */
let whisperSpeicher = null; /* library/whisper.ndjson, einmal geparst */
const TYPEN = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',   '.json':'application/json; charset=utf-8',
  // wav fehlte ebenso: Es ging als application/octet-stream hinaus, und
  // ein Blob mit diesem Typ spielt im <audio> nicht zuverlässig ab -
  // sichtbar geworden beim Analyzer, der den Ton über einen Blob nimmt.
  '.mp3':'audio/mpeg', '.wav':'audio/wav', '.flac':'audio/flac', '.mp4':'video/mp4', '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg', '.png':'image/png', '.txt':'text/plain; charset=utf-8',
  // webp fehlte: Sunos Profilbilder kommen in diesem Format, und ohne
  // Eintrag gingen sie als application/octet-stream hinaus.
  '.webp':'image/webp', '.gif':'image/gif',
};

/**
 * Datei ausliefern - mit Unterstützung für Bereichsanfragen.
 *
 * Das ist der wichtigste Teil für iPhone und iPad: Safari lädt
 * Audio und Video grundsätzlich in Bereichen ("schick mir Byte
 * 500000 bis 600000"). Antwortet der Server darauf nicht mit
 * Status 206, kann man im Song nicht springen - teilweise startet
 * die Wiedergabe gar nicht erst.
 */
function liefere(req, res, datei) {
  let stat;
  try { stat = fs.statSync(datei); } catch (e) {
    res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});
    return res.end('Nicht gefunden');
  }
  if (!stat.isFile()) { res.writeHead(404); return res.end(); }

  const typ    = TYPEN[path.extname(datei).toLowerCase()] || 'application/octet-stream';
  const laenge = stat.size;
  const range  = req.headers.range;

  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m) {
      let von = m[1] ? parseInt(m[1], 10) : 0;
      let bis = m[2] ? parseInt(m[2], 10) : laenge - 1;
      if (bis >= laenge) bis = laenge - 1;

      if (von > bis || von >= laenge) {                 // unsinniger Bereich
        res.writeHead(416, {'Content-Range': `bytes */${laenge}`});
        return res.end();
      }
      res.writeHead(206, {
        'Content-Type':   typ,
        'Content-Range':  `bytes ${von}-${bis}/${laenge}`,
        'Accept-Ranges':  'bytes',
        'Content-Length': bis - von + 1,
        'Cache-Control':  'public, max-age=31536000',
      });
      return fs.createReadStream(datei, { start: von, end: bis }).pipe(res);
    }
  }

  /* Programmdateien dürfen nicht ein Jahr im Cache liegen.

     Bis zum 18.08.2026 galt max-age=31536000 für alles außer HTML. Für
     die Visualizer-Bibliotheken ist das richtig - die ändern sich nie.
     Für web/fremd/analyzer.js, das gerade entsteht, war es eine Falle:
     Man sieht seine eigene Änderung nicht und jagt Fehler, die längst
     behoben sind. Genau das ist passiert.

     Deshalb für .js und .html: no-cache heißt NICHT "nicht speichern",
     sondern "vor der Benutzung nachfragen". Mit Last-Modified antwortet
     der Server dann meist mit 304 und schickt keine Daten - die 1,9 MB
     Butterchurn wandern also weiterhin nur einmal über die Leitung.
     Medien behalten das Jahr; ein audio.wav ändert sich nie unter
     derselben Adresse.

     DIE ANALYSEN NICHT (26.08.2026). Für library/analyse/ galt dieselbe
     Regel — und dort ist sie falsch: Jeder Lauf von bin/vorrechnen.js
     überschreibt .bin und die vier Bilder unter derselben Adresse. Der
     Browser hielt sie ein Jahr fest und zeigte weiter die alten Werte.
     Gefunden, als eine frisch gerechnete Ablage im Browser noch das
     `schimmer`-Feld trug, das im Rechenkern längst gelöscht war; die
     Höhenkanten-Karte blieb leer, weil ihr Feld in der alten Fassung
     nicht existierte. Ohne diese Kur wäre der nächste Neulauf über alle
     321 Songs unsichtbar geblieben.

     Sie bekommen deshalb dieselbe Behandlung wie Programmdateien:
     no-cache heißt NICHT „nicht speichern", sondern „vor der Benutzung
     nachfragen". Mit Last-Modified antwortet der Server meist mit 304
     und schickt keine Daten — die 5 MB je Bild wandern also weiterhin
     nur einmal über die Leitung, aber nach einem Neulauf eben noch
     einmal. */
  const analyse  = datei.startsWith(ANALYSE);
  const programm = typ.startsWith('text/html') || typ.startsWith('text/javascript') || analyse;
  const stempel  = stat.mtime.toUTCString();

  if (programm && req.headers['if-modified-since'] === stempel) {
    res.writeHead(304, { 'Cache-Control': 'no-cache', 'Last-Modified': stempel });
    return res.end();
  }

  res.writeHead(200, {
    'Content-Type':   typ,
    'Content-Length': laenge,
    'Accept-Ranges':  'bytes',
    'Cache-Control':  programm ? 'no-cache' : 'public, max-age=31536000',
    ...(programm ? { 'Last-Modified': stempel } : {}),
  });
  fs.createReadStream(datei).pipe(res);
}

/** Verhindert, dass jemand über ../ aus dem Archiv ausbricht. */
function sicherer(basis, teil) {
  const ziel = path.resolve(basis, teil);
  return ziel.startsWith(path.resolve(basis)) ? ziel : null;
}

/* ------------------------------------------------------------
   Vorgerechnete Analysen
   ------------------------------------------------------------
   Der Analyzer rechnet je Song rund 8,6 s und zeichnet weitere
   8,3 s. Beides ist speicherbar: die Meßreihen als rohe Bytes
   (typisierte Reihen sind nur Sichten auf einen Puffer, das
   Zurückdeuten kostet 0 ms), die beiden Spektrogramme als WebP.
   Zusammen rund 6,6 MB je Song.

   HIER STEHT DER EINZIGE SCHREIBWEG DES SERVERS. Er ist deshalb
   eng geführt:
   - nur PUT, nur unter /analyse/
   - der Name muß eine Song-UUID mit erlaubter Endung sein
   - höchstens 32 MB je Datei
   - geschrieben wird erst in eine Datei mit .teil, dann umbenannt;
     ein abgebrochener Upload hinterläßt so keine halbe Datei, die
     beim nächsten Start als fertig gälte
------------------------------------------------------------ */
/* Beide Bildformate: Der Browser schreibt WebP (canvas.toBlob), Node
   schreibt PNG - das ffmpeg hier hat keinen WebP-Encoder. Vollstaendig
   heisst deshalb: die Reihen plus JE EIN Bild beider Sorten. */
const ANALYSE_ENDUNGEN = ['bin', 'spektro.webp', 'stereo.webp',
                          'spektro.png', 'stereo.png',
                          /* rechter Kanal und Summe, seit 25.08.2026 */
                          'rechts.webp', 'summe.webp',
                          'rechts.png', 'summe.png'];
const ANALYSE_MAX = 32 * 1024 * 1024;

function analyseName(rest) {
  const m = /^([0-9a-f-]{36})\.(bin|(?:spektro|stereo|rechts|summe)\.(?:webp|png))$/.exec(rest);
  return m ? { id: m[1], endung: m[2] } : null;
}

function analyseSchreiben(req, res, rest) {
  const n = analyseName(rest);
  if (!n) { res.writeHead(400); return res.end('Kein gültiger Name'); }
  fs.mkdirSync(ANALYSE, { recursive: true });

  const ziel = path.join(ANALYSE, `${n.id}.${n.endung}`);
  const teil = ziel + '.teil';
  const strom = fs.createWriteStream(teil);
  let menge = 0, abgebrochen = false;

  req.on('data', (stueck) => {
    menge += stueck.length;
    if (menge > ANALYSE_MAX && !abgebrochen) {
      abgebrochen = true;
      strom.destroy(); fs.rmSync(teil, { force: true });
      res.writeHead(413); res.end('Zu groß');
      req.destroy();
    }
  });
  req.pipe(strom);
  strom.on('finish', () => {
    if (abgebrochen) return;
    fs.renameSync(teil, ziel);
    jsonAntwort(res, { gespeichert: rest, bytes: menge });
  });
  strom.on('error', () => {
    if (abgebrochen) return;
    fs.rmSync(teil, { force: true });
    res.writeHead(500); res.end('Schreibfehler');
  });
}

/** Welche Songs sind schon durchgerechnet? Vollständig heißt: alle drei
    Dateien liegen da. Eine halbe Analyse ist keine. */
function analyseListe() {
  let dateien = [];
  try { dateien = fs.readdirSync(ANALYSE); } catch (e) { return []; }
  const teile = new Map();
  for (const d of dateien) {
    const n = analyseName(d);
    if (!n) continue;
    if (!teile.has(n.id)) teile.set(n.id, new Set());
    teile.get(n.id).add(n.endung);
  }
  const hat = (s, art) => s.has(art + '.webp') || s.has(art + '.png');
  return [...teile].filter(([, s]) => s.has('bin') && hat(s,'spektro') && hat(s,'stereo'))
                   .map(([id]) => id);
}

/* ------------------------------------------------------------------
   Zugriff von suno.com erlauben
   ------------------------------------------------------------------
   Der Morgenknopf sitzt als Lesezeichen auf einer suno.com-Seite und
   nicht in KlangTresor. Das ist keine Bequemlichkeit, sondern die einzige
   Möglichkeit: Der Clerk-Token gehört der Herkunft suno.com. Eine Seite
   auf 127.0.0.1 kann ihn nicht benutzen - Cookies sind pro Herkunft
   gebunden, und Suno schickt uns keine CORS-Freigabe. Deshalb steht
   schon im WAV-PROTOKOLL "Chrome auf suno.com öffnen, Konsole".

   Umgekehrt geht es: WIR erlauben suno.com, uns zu erreichen. Nur
   dieser eine Ursprung, und nur die Wege, die der Knopf braucht.
   Der Server hört ohnehin nur im Heimnetz.
------------------------------------------------------------------ */
const MORGEN_HERKUNFT = 'https://suno.com';

/* ZWEI STUFEN, WEIL DAZWISCHEN JEMAND HINSEHEN SOLL.

   Erst SAMMELN: Es holt die Songliste über die Profil-Schnittstelle -
   ohne Anmeldung, deshalb kann der Server das selbst - und vergleicht
   sie mit dem Katalog. Geschrieben wird dabei nur die Rohdatei; der
   Katalog bleibt, wie er war.

   Dann, auf Bestätigung, der REST: Katalog bauen, Medien holen,
   Analysen rechnen. Ab hier ändert sich der Bestand.

   Was nur mit Anmeldung geht - WAV, Wort-Zeitmarken, Playlists - kann
   der Server nicht; das bleibt beim Lesezeichen auf suno.com. */
const MORGEN_SAMMELN = { name: 'Suno abfragen', befehl: ['bin/sammeln.js'] };

/* Wie alt ist die juengste Profil-Ernte des Lesezeichens? Ist sie
   juenger als zwei Stunden, verwertet der rote Knopf SIE, statt Suno
   dasselbe noch einmal zu fragen - die Ernte ist die Obermenge
   (Caspar_D, 20.08.2026). Rueckgabe: { datei, vom, minuten } oder null. */
const ERNTE_FRISCH_MIN = 120;
function juengsteProfilErnte() {
  let beste = null;
  for (const o of [path.join(WURZEL, 'library', 'roh')]) {   // Verarbeitetes ist geloescht

    try {
      for (const f of fs.readdirSync(o))
        if (/^profil-.*\.json$/.test(f) && !f.startsWith('._'))
          if (!beste || f > path.basename(beste.datei)) beste = { datei: path.join(o, f) };
    } catch (e) {}
  }
  if (!beste) return null;
  try {
    const j = JSON.parse(fs.readFileSync(beste.datei, 'utf8'));
    beste.vom = j.geholtAm || j.abgerufenAm || null;
  } catch (e) {}
  if (!beste.vom) beste.vom = new Date(fs.statSync(beste.datei).mtimeMs).toISOString();
  beste.minuten = Math.round((Date.now() - new Date(beste.vom).getTime()) / 60000);
  return beste;
}
/* 'einheiten' sagt, woran der Schritt skaliert: Die Analyse haengt an
   der Zahl der Songs ohne Ablage - heute 89, morgen vielleicht einer.
   Eine Dauer je Schritt zu merken waere da sinnlos; gemerkt wird die
   Dauer JE EINHEIT, und geschaetzt aus der aktuellen Zahl. */
/* Die Namen erscheinen im Morgenfenster - Klartext, kein Jargon
   (Caspar_D, 20.08.2026: "die Statusmeldungen sind zu kryptisch"). */
/* Jeder Schritt traegt einen SCHLUESSEL - die Auswahlliste vor dem
   roten Knopf (Caspar_D, 21.08.2026) kann Schritte abwaehlen; 'katalog'
   ist Pflicht. 'kaffee' haelt den Mac wach (caffeinate -i) - der
   Whisper-Nachtlauf stand von 2 bis 9 Uhr, weil der Mac schlief. */
const MORGEN_SCHRITTE = [
  { schluessel: 'katalog', name: 'Katalog neu bauen — alle Ernten zusammenführen, Zählerverlauf fortschreiben', befehl: ['bin/aufbereiten.js'] },
  /* Direkt hinter den Katalog: reaktionen.js liest die Kommentarzahl
     von dort und fragt nur die Songs ab, die welche haben. Vorher waere
     die Zahl vom Vortag. */
  { schluessel: 'kommentare', name: 'Neue Kommentare von Suno sichern', befehl: ['bin/reaktionen.js'] },
  { schluessel: 'medien', name: 'Fehlende Medien laden (MP3, Cover, Videos)', befehl: ['bin/wiederherstellen.js', '--nur-medien'] },
  { schluessel: 'analyse', name: 'Klanganalyse für neue Songs rechnen', befehl: ['bin/vorrechnen.js'],
    einheiten: () => {
      const k = katalogHolen(); if (!k) return 0;
      const fertig = new Set(analyseListe());
      return Object.values(k.songs || {}).filter(s => !s.fremd && !fertig.has(s.id)).length;
    } },
  { schluessel: 'analyse', name: 'Messwerte in den Suchindex übernehmen', befehl: ['bin/analyse-index.js'] },
  /* Klangprofil + Lautheitshistogramm je Song (fuer Tonstudio-Decke,
     Presets und die Kennlinien-Gebirge) - rechnet nur Fehlendes nach. */
  { schluessel: 'analyse', name: 'Klangprofil und Lautheitshistogramm nachziehen', befehl: ['bin/eq-profil.js'] },
  /* Stehende Toene (Stoerfrequenzen) fuer die Kerbe im Glockenstuhl - nur
     Songs ohne Eintrag, ~5-10 s je Song (bin/stoerfrequenz.js, 23.08.2026). */
  { schluessel: 'analyse', name: 'Störfrequenzen suchen — stehende Töne für die Kerbe', befehl: ['bin/stoerfrequenz.js'],
    einheiten: () => {
      const k = katalogHolen(); if (!k) return 0;
      let fertig = {};
      try { fertig = JSON.parse(fs.readFileSync(path.join(WURZEL, 'library', 'stoerfrequenzen.json'), 'utf8')).songs || {}; } catch (e) {}
      return Object.values(k.songs || {}).filter(s => !s.fremd && !fertig[s.id]
        && fs.existsSync(path.join(WURZEL, 'library', 'songs', s.id, 'audio.mp3'))).length;   /* wie der Detektor selbst */
    } },
  /* Whisper nur fuer neue Songs mit Text (ohne --alle); Instrumentals
     und die Fokus-Wanderung schliesst whisper.js selbst aus. */
  { schluessel: 'whisper', kaffee: true, name: 'Karaoke-Zeitanker mit Whisper für neue Songs', befehl: ['bin/whisper.js', '--still'],
    einheiten: () => {
      const k = katalogHolen(); if (!k) return 0;
      return Object.values(k.songs || {}).filter(s => !s.fremd && s.lyrics && !(s.worte && s.worte.length) && !/\s(I|II|III|IV)$/.test(s.titel || '')).length;
    } },
  /* Musikstil (Discogs-EffNet, lokal per onnxruntime-node): Embedding,
     Stil, Genre, Stimmung, Instrumente je Song - Grundlage der Karte.
     VOR Whisper waere schneller (6 s je Song), aber hinter Whisper ist
     ehrlicher: bricht Whisper ab, fehlt nicht auch noch die Karte. */
  { schluessel: 'musikstil', kaffee: true, name: 'Musikstil vermessen — Klang, Genre, Stimmung', befehl: ['bin/klang.js', '--still'],
    einheiten: () => {
      const k = katalogHolen(); if (!k) return 0;
      let fertig = {};
      try { fertig = JSON.parse(fs.readFileSync(path.join(WURZEL, 'library', 'klang.json'), 'utf8')).songs || {}; } catch (e) {}
      return Object.values(k.songs || {}).filter(s => !s.fremd && !fertig[s.id]).length;
    } },
  /* Die Karte ist in Sekunden gerechnet - immer, wenn der Musikstil
     lief, damit neue Songs ihren Platz am Himmel bekommen. */
  { schluessel: 'musikstil', name: 'Klangraum neu zeichnen', befehl: ['bin/karte.js'] },
];

const morgen = { laeuft:false, schritt:-1, seit:null, zeilen:[], fehler:null, neueIds:[], folge:[],
                 schrittSeit:null };

/* ------------------------------------------------------------
   Selbstkalibrierender Fortschritt
   ------------------------------------------------------------
   Niemand weiss vorab, wie lange 'Medien holen' dauert - das haengt
   davon ab, wie viele Songs neu sind. Aber der letzte Lauf weiss es.
   Je Schritt wird die Dauer gemerkt (library/morgen-dauern.json), und
   der naechste Lauf schaetzt daraus: Anteil des fertigen Schritts an
   der erwarteten Gesamtzeit plus Anteil des laufenden. Beim ersten Mal
   gibt es keine Erfahrung - dann zaehlt jeder Schritt gleich.

   Gemerkt wird ein gleitender Mittelwert (zwei Drittel alt, ein
   Drittel neu), damit ein einzelner Ausreisser - ein Lauf mit
   dreissig neuen Songs - die Schaetzung nicht ein halbes Jahr verzerrt.
------------------------------------------------------------ */
const DAUERN = path.join(WURZEL, 'library', 'morgen-dauern.json');
function dauernLesen() {
  try { return JSON.parse(fs.readFileSync(DAUERN, 'utf8')); } catch (e) { return {}; }
}
function dauerMerken(name, ms, einheiten) {
  const d = dauernLesen();
  /* Bei skalierenden Schritten die Dauer je Einheit merken; null
     Einheiten sagen nichts ueber die Dauer und werden nicht gelernt. */
  if (einheiten !== undefined) {
    if (einheiten <= 0) return;
    const je = ms / einheiten;
    d[name] = d[name] ? Math.round(d[name] * 2/3 + je / 3) : Math.round(je);
  } else {
    d[name] = d[name] ? Math.round(d[name] * 2/3 + ms / 3) : ms;
  }
  try { fs.writeFileSync(DAUERN, JSON.stringify(d, null, 1)); } catch (e) {}
}
/* Anteil 0..1 und erwartete Restzeit in ms, oder null, wenn nichts
   laeuft. Ein laufender Schritt darf nie ueber 95 % seines eigenen
   Anteils hinaus - sonst steht der Balken voll, waehrend noch gerechnet
   wird, und das ist die eine Luege, die ein Fortschrittsbalken nicht
   erzaehlen darf. */
function fortschritt() {
  if (!morgen.laeuft || !morgen.folge || morgen.schritt < 0) return null;
  const d = dauernLesen();
  const erwartet = morgen.folge.map((s, i) => {
    if (!d[s.name]) return 0;
    if (!s.einheiten) return d[s.name];
    const n = (morgen.einheiten && morgen.einheiten[i] !== undefined) ? morgen.einheiten[i] : 1;
    return d[s.name] * Math.max(1, n);
  });
  const kennt = erwartet.some(x => x > 0);
  const gewichte = kennt ? erwartet.map(x => x || Math.max(...erwartet) / 4) : erwartet.map(() => 1);
  const gesamt = gewichte.reduce((a, b) => a + b, 0);
  let fertig = 0;
  for (let i = 0; i < morgen.schritt; i++) fertig += gewichte[i];
  const laufend = gewichte[morgen.schritt];
  const vergangen = morgen.schrittSeit ? Date.now() - morgen.schrittSeit : 0;
  const anteilLaufend = laufend > 0 ? Math.min(0.95, vergangen / laufend) : 0;
  const anteil = (fertig + laufend * anteilLaufend) / gesamt;
  const rest = kennt ? Math.max(0, gesamt - fertig - Math.min(vergangen, laufend * 0.95)) : null;
  return { anteil, rest, kalibriert: kennt };
}

/* Benachrichtigungen in library/reaktionen.ndjson schreiben. Je Eintrag
   eine Zeile mit art = notification_type (clip_like, clip_comment,
   comment_like, comment_reply, follow, …), den beteiligten Profilen und
   dem Zeitpunkt. Bekannt ist ein Eintrag an seiner Suno-ID; die Datei
   wird einmal gelesen, um sie zu kennen. Bei 226 KB ist das billig;
   waechst sie auf Megabyte, ist ein Index faellig. */
const REAKTIONEN = path.join(WURZEL, 'library', 'reaktionen.ndjson');
function reaktionenAnhaengen(liste, gesehen) {
  const bekannt = new Set();
  if (fs.existsSync(REAKTIONEN)) {
    for (const z of fs.readFileSync(REAKTIONEN, 'utf8').split('\n')) {
      if (!z.trim()) continue;
      try { const e = JSON.parse(z); if (e.sunoId) bekannt.add(e.sunoId); } catch (x) {}
    }
  }
  let neu = 0;
  const strom = fs.createWriteStream(REAKTIONEN, { flags: 'a' });
  for (const n of liste) {
    if (!n || !n.id || bekannt.has(n.id)) continue;
    bekannt.add(n.id);
    strom.write(JSON.stringify({
      art:      n.notification_type || 'unbekannt',
      gesehen,
      sunoId:   n.id,
      am:       n.updated_at,
      song:     n.content_id || null,
      songTitel: n.content_title || '',
      von:      (n.user_profiles || []).map(p => p.handle).filter(Boolean),
      namen:    (n.user_profiles || []).map(p => p.display_name).filter(Boolean),
      anzahl:   n.total_users || (n.user_profiles || []).length || 1,
      text:     n.content_message || '',
      gelesen:  !!n.is_read,
    }) + '\n');
    neu++;
  }
  strom.end();
  return neu;
}

function morgenStand() {
  return {
    laeuft:  morgen.laeuft,
    schritt: morgen.schritt,
    name:    morgen.schritt >= 0 ? ((morgen.folge||[])[morgen.schritt]||{}).name : null,
    von:     (morgen.folge||[]).length,
    seit:    morgen.seit,
    fehler:  morgen.fehler,
    quelle:  morgen.quelle || null,
    fortschritt: fortschritt(),
    /* Beim Sammeln die ganze Ausgabe - sie IST der Vergleich, den der
       Knopf zeigen soll. Beim langen Lauf nur der Schwanz. */
    zeilen:  morgen.laeuft || morgen.folge === undefined
               ? morgen.zeilen.slice(-14) : morgen.zeilen.slice(-60),
  };
}

function morgenLosschicken(schritte) {
  morgen.laeuft = true; morgen.schritt = -1; morgen.seit = Date.now();
  morgen.zeilen = []; morgen.fehler = null; morgen.folge = schritte; morgen.einheiten = [];

  const weiter = (i) => {
    if (i >= schritte.length) {
      morgen.laeuft = false; morgen.schritt = -1;
      morgen.zeilen.push('— durch —');
      return;
    }
    morgen.schritt = i;
    morgen.schrittSeit = Date.now();
    const s = schritte[i];
    morgen.einheiten = morgen.einheiten || [];
    morgen.einheiten[i] = s.einheiten ? s.einheiten() : undefined;
    morgen.zeilen.push(`▸ ${s.name}`);
    /* Laeuft dasselbe Werkzeug schon von Hand (z. B. whisper.js --alle
       im Terminal), kein zweites daneben starten - der Mac hat nur
       einen Prozessor, und zwei Whisper schreiben dieselben Dateien. */
    if (s.befehl[0] === 'bin/whisper.js') {
      try {
        const ps = require('node:child_process').execSync('pgrep -f "[b]in/whisper.js"', { encoding: 'utf8' }).trim();
        if (ps) {
          morgen.zeilen.push('  Whisper läuft bereits (von Hand gestartet) — übersprungen, der nächste Morgen holt es nach.');
          return weiter(i + 1);
        }
      } catch (e) { /* pgrep ohne Treffer = Exit 1 = frei */ }
    }
    /* caffeinate gibt es nur auf dem Mac; auf Linux laeuft der Schritt
       direkt (Tarjas Maschine, 21.08.2026). */
    const kind = s.kaffee && process.platform === 'darwin'
      ? require('node:child_process').spawn('caffeinate', ['-i', process.execPath, ...s.befehl], { cwd: WURZEL })
      : require('node:child_process').spawn(process.execPath, s.befehl, { cwd: WURZEL });
    const sammeln = (d) => {
      for (const z of String(d).split('\n')) if (z.trim()) morgen.zeilen.push(z.trimEnd());
      if (morgen.zeilen.length > 400) morgen.zeilen = morgen.zeilen.slice(-200);
    };
    kind.stdout.on('data', sammeln);
    kind.stderr.on('data', sammeln);
    kind.on('close', (c) => {
      dauerMerken(s.name, Date.now() - morgen.schrittSeit, morgen.einheiten[i]);
      if (c !== 0) {
        morgen.fehler = `${s.name} brach ab (${c})`;
        morgen.laeuft = false; morgen.schritt = -1;
        return;
      }
      weiter(i + 1);
    });
  };
  weiter(0);
}


function morgenKopf(req, res) {
  const h = req.headers.origin;
  if (h !== MORGEN_HERKUNFT) return false;
  res.setHeader('Access-Control-Allow-Origin', MORGEN_HERKUNFT);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  return true;
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = decodeURIComponent(u.pathname);

  const vonSuno = morgenKopf(req, res);
  if (req.method === 'OPTIONS') { res.writeHead(vonSuno ? 204 : 403); return res.end(); }

  /* ----------------------------------------------------------------
     Der Morgenlauf
     ----------------------------------------------------------------
     Drei Wege, mehr braucht der Knopf nicht:

     POST /api/morgen/roh      die Ernte von suno.com ablegen
     POST /api/morgen/start    die lokalen Schritte anstossen
     GET  /api/morgen/stand    wie weit ist es

     Die lokalen Schritte laufen NACHEINANDER und als eigene Prozesse.
     Nacheinander, weil wiederherstellen.js den Katalog braucht, den
     sammeln.js erst schreibt; als eigene Prozesse, weil ein Absturz
     dann den Server nicht mitnimmt.
  ---------------------------------------------------------------- */
  /* Der Suno-Alias der Sammlung (Caspar_D, 21.08.2026): bisher kam der
     Handle implizit aus der Ernte - jetzt steht er in library/konfig.json
     (eine Datei, exFAT). Leer = noch nicht eingerichtet; dann schlaegt
     der Katalog vor. */
    /* Die Version steht in package.json und NUR dort - eine zweite
     Stelle im HTML wuerde beim naechsten Mal auseinanderlaufen. */
  const paketVersion = () => {
    try { return JSON.parse(fs.readFileSync(path.join(WURZEL, 'package.json'), 'utf8')).version || null; }
    catch (e) { return null; }
  };
  const KONFIG = path.join(WURZEL, 'library', 'konfig.json');
  const konfigLesen = () => { try { return JSON.parse(fs.readFileSync(KONFIG, 'utf8')); } catch (e) { return {}; } };
  if (p === '/api/konfig' && req.method === 'GET') {
    const k = konfigLesen();
    const kat = katalogHolen();
    const vorschlag = (kat && kat.profil && kat.profil.handle) || null;
    /* Gibt es schon einen Katalog, steht der Nutzer fest - dann wird
       nicht gefragt, sondern still uebernommen (Caspar_D, 21.08.2026:
       „nur beim ersten Mal, wenn noch kein Nutzer angemeldet ist"). */
    if (!k.handle && vorschlag) {
      fs.writeFileSync(KONFIG, JSON.stringify({ ...k, handle: vorschlag, seit: new Date().toISOString(), herkunft: 'katalog' }, null, 1));
      return jsonAntwort(res, { handle: vorschlag, vorschlag, seit: null });
    }
    return jsonAntwort(res, { handle: k.handle || null, vorschlag, seit: k.seit || null });
  }
  if (p === '/api/konfig' && req.method === 'PUT') {
    let roh = '';
    req.on('data', s => { roh += s; });
    return req.on('end', () => {
      try {
        const d = JSON.parse(roh);
        const handle = String(d.handle || '').trim().replace(/^@/, '');
        if (!/^[A-Za-z0-9_.-]{2,40}$/.test(handle)) return jsonAntwort(res, { fehler: 'kein gueltiger Suno-Alias' }, 400);
        const alt = konfigLesen();
        fs.writeFileSync(KONFIG, JSON.stringify({ ...alt, handle, seit: alt.handle === handle ? (alt.seit || new Date().toISOString()) : new Date().toISOString() }, null, 1));
        jsonAntwort(res, { ok: true, handle });
      } catch (e) { jsonAntwort(res, { fehler: e.message }, 400); }
    });
  }
  /* Oeffentliche Profilpruefung - dieselbe Abfrage wie bin/sammeln.js,
     ohne Anmeldung: Anzeigename, Avatar, Songzahl zur Bestaetigung
     („Das bist du?"). */
  if (p === '/api/profil-pruefen') {
    const handle = String(u.searchParams.get('handle') || '').trim().replace(/^@/, '');
    if (!handle) return jsonAntwort(res, { fehler: 'handle fehlt' }, 400);
    const https = require('node:https');
    return https.get(`https://studio-api-prod.suno.com/api/profiles/${encodeURIComponent(handle)}?playlists_sort_by=upvote_count&clips_sort_by=created_at&page=1`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (KlangTresor)' } }, (a) => {
        let t = ''; a.on('data', c => t += c);
        a.on('end', () => {
          try {
            if (a.statusCode !== 200) return jsonAntwort(res, { ok: false, status: a.statusCode });
            const j = JSON.parse(t);
            jsonAntwort(res, { ok: true, handle: j.handle || handle, name: j.display_name || null,
              avatar: j.avatar_image_url || null, songs: j.num_total_clips ?? null,
              follower: j.stats && j.stats.followers_count != null ? j.stats.followers_count : null });
          } catch (e) { jsonAntwort(res, { ok: false, fehler: e.message }); }
        });
      }).on('error', (e) => jsonAntwort(res, { ok: false, fehler: e.message }));
  }
  if (p === '/api/morgen/roh' && req.method === 'POST') {
    let roh = '';
    req.on('data', s => { roh += s; if (roh.length > 64*1024*1024) req.destroy(); });
    return req.on('end', () => {
      try {
        const daten = JSON.parse(roh);
        if (!daten || !Array.isArray(daten.songs)) throw new Error('keine Songliste');
        /* Der Waechter (Caspar_D, 21.08.2026): aufbereiten sortiert fremde
           SONGS aus, aber nicht fremde NUTZER. Traegt die Ernte einen
           anderen Handle als die Sammlung, wird sie NICHT angenommen. */
        const konf = konfigLesen();
        if (konf.handle && daten.handle && String(daten.handle).toLowerCase() !== String(konf.handle).toLowerCase()) {
          return jsonAntwort(res, { fehler: 'fremder-nutzer',
            meldung: `Diese Ernte stammt von @${daten.handle}, die Sammlung gehört @${konf.handle}. Nicht eingewoben — im KlangTresor den Alias wechseln oder in Suno mit dem richtigen Konto anmelden.`,
            ernte: daten.handle, sammlung: konf.handle }, 409);
        }
        /* Ein reines Timing-Paket (songs leer) schreibt KEINE profil-Datei -
           die wuerde beim Neuaufbau als leere Songliste gelesen. */
        const nurTiming = daten.songs.length === 0 && daten.timing && Object.keys(daten.timing).length;
        const ordner = path.join(WURZEL, 'library', 'roh');
        fs.mkdirSync(ordner, { recursive: true });
        const stempel = new Date().toISOString().replace(/[:.]/g,'-').slice(0,23);   // mit ms, je Paket eindeutig
        const ziel = path.join(ordner, `profil-${stempel}.json`);
        if (!nurTiming) fs.writeFileSync(ziel, JSON.stringify(daten));

        /* Schlaege, Abschnitte und Wellenstufen kommen als eigene
           timing-Datei - dasselbe Muster wie die Wort-Zeitmarken, und
           aufbereiten.js liest ALLE timing-Dateien. Nur anlegen, wenn
           etwas drin ist; eine leere Datei kostet auf exFAT einen
           Megabyte fuer nichts. */
        /* Die Privaten als eigene Rohdatenart, wie sie wiederherstellen.js
           erwartet. Dasselbe Format wie die Datei vom 17.08.2026:
           {alle:[...], abgerufenAm, quelle}. */
        if (Array.isArray(daten.privat) && daten.privat.length) {
          fs.writeFileSync(path.join(ordner, `privat-${stempel}.json`),
            JSON.stringify({ alle: daten.privat, abgerufenAm: daten.erzeugtAm,
                             quelle: 'api/clip/<id> — unveroeffentlichte Songs, ueber das Lesezeichen' }));
        }
        /* Benachrichtigungen an reaktionen.ndjson anhaengen - dieselbe
           Datei wie die Kommentare, dasselbe Prinzip: eine Zeile je
           Ereignis, nie ueberschrieben, nur was neu ist. Erkannt an der
           Suno-ID des Eintrags. So waechst die Like-Historie ab heute,
           auch wenn Suno seinen Strom nach vier Wochen vergisst. */
        if (Array.isArray(daten.benachrichtigungen) && daten.benachrichtigungen.length) {
          const neu = reaktionenAnhaengen(daten.benachrichtigungen, daten.erzeugtAm);
          morgen.zeilen.push(`Benachrichtigungen: ${neu} neu gesichert`);
        }
        if (daten.timing && Object.keys(daten.timing).length) {
          fs.writeFileSync(path.join(ordner, `timing-${stempel}.json`),
                           JSON.stringify({ abgerufenAm: daten.erzeugtAm, songs: daten.timing }));
        }

        /* WELCHE SIND NEU? Jetzt bestimmen, nicht später: Gleich wird
           der Katalog neu gebaut, und dann sieht niemand mehr, was
           vorher fehlte. sammeln.js schrieb dafür library/neue-songs.json
           - der Morgenlauf geht ohne sammeln.js, also entsteht die
           Liste hier. Sie wird für das WAV-Anstoßen gebraucht. */
        if (!nurTiming) {
          const vorher = katalogHolen();
          const bekannt = vorher ? new Set(Object.keys(vorher.songs || {})) : new Set();
          morgen.neueIds = daten.songs.map(c => c.id).filter(id => !bekannt.has(id));
        }

        jsonAntwort(res, { abgelegt: nurTiming ? `timing-${stempel}.json` : path.basename(ziel),
                           songs: daten.songs.length, neu: (morgen.neueIds||[]).length });
      } catch (e) { res.writeHead(400); res.end(String(e.message)); }
    });
  }

  /* Stufe 1: fragen, vergleichen, NICHTS ändern. */
  if (p === '/api/morgen/sammeln' && req.method === 'POST') {
    if (morgen.laeuft) return jsonAntwort(res, morgenStand());
    /* Frische Ernte da und kein ausdrueckliches ?frisch=1: verwerten
       statt holen. Die Herkunft steht im Stand, das Fenster sagt sie. */
    const ernte = u.searchParams.get('frisch') ? null : juengsteProfilErnte();
    if (ernte && ernte.minuten <= ERNTE_FRISCH_MIN) {
      morgen.quelle = { art: 'ernte', vom: ernte.vom, minuten: ernte.minuten };
      /* Der Schrittname sagt die Herkunft gleich selbst (Caspar_D,
         20.08.2026: "gut, anpassen") - nicht erst die Liste danach. */
      const wann = new Date(ernte.vom).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      morgenLosschicken([{ name: `Lesezeichen-Ernte von ${wann} Uhr verwerten (kein neuer Suno-Abruf)`,
                           befehl: ['bin/sammeln.js', '--aus-roh'] }]);
    } else {
      morgen.quelle = { art: 'frisch', letzteErnte: ernte ? ernte.vom : null };
      morgenLosschicken([{ name: 'Songliste frisch von Suno holen (öffentliches Profil)',
                           befehl: ['bin/sammeln.js'] }]);
    }
    return jsonAntwort(res, morgenStand());
  }

  /* Stufe 2: übernehmen. */
  if (p === '/api/morgen/start' && req.method === 'POST') {
    if (morgen.laeuft) return jsonAntwort(res, morgenStand());
    let roh = '';
    req.on('data', c => { roh += c; });
    return req.on('end', () => {
      let aus = [];
      try { aus = (JSON.parse(roh || '{}').aus || []).filter(k => k !== 'katalog'); } catch (e) {}
      const schritte = MORGEN_SCHRITTE.filter(s => !aus.includes(s.schluessel));
      morgenLosschicken(schritte);
      if (aus.length) morgen.zeilen.unshift('abgewählt: ' + aus.join(', '));
      jsonAntwort(res, morgenStand());
    });
  }
  /* Wie frisch ist die juengste Lesezeichen-Ernte? Fuer den Kopf der
     Gruppe „mit Login" in der Auswahlliste. */
  if (p === '/api/morgen/ernte-stand') {
    try {
      const ordner = path.join(WURZEL, 'library', 'roh');
      const ernten = fs.readdirSync(ordner).filter(f => /^profil-.*\.json$/.test(f)).sort();
      if (!ernten.length) return jsonAntwort(res, { vorhanden: false });
      const mt = fs.statSync(path.join(ordner, ernten[ernten.length - 1])).mtimeMs;
      return jsonAntwort(res, { vorhanden: true, minuten: Math.round((Date.now() - mt) / 60000), datei: ernten[ernten.length - 1] });
    } catch (e) { return jsonAntwort(res, { vorhanden: false }); }
  }

  if (p === '/api/morgen/stand') return jsonAntwort(res, morgenStand());

  /* Das Cookie entgegennehmen - nur von suno.com, nur per POST, und
     ohne es je zu protokollieren. Es wandert direkt nach
     geheim/suno-cookie.txt. So muss es niemand aus den Entwicklertools
     abschreiben, und es erscheint in keinem Chat. */
  if (p === '/api/geheim/cookie' && req.method === 'POST') {
    if (!vonSuno) { res.writeHead(403); return res.end(); }
    let roh = '';
    req.on('data', s => { roh += s; if (roh.length > 16384) req.destroy(); });
    return req.on('end', () => {
      const w = roh.trim();
      if (!/^[A-Za-z0-9._\-]{50,4000}$/.test(w)) { res.writeHead(400); return res.end('kein Cookie'); }
      const ordner = path.join(WURZEL, 'geheim');
      fs.mkdirSync(ordner, { recursive: true, mode: 0o700 });
      fs.writeFileSync(path.join(ordner, 'suno-cookie.txt'), w + '\n', { mode: 0o600 });
      jsonAntwort(res, { gespeichert: true, laenge: w.length });
    });
  }

  if (p === '/api/morgen/neue') return jsonAntwort(res, { ids: morgen.neueIds || [] });

  /* Liegen Rohdaten, die juenger sind als der Katalog? Dann wurde nach
     dem letzten 'Uebernehmen' noch geholt, aber nicht eingepflegt. Das
     Lesezeichen fragt das als allererstes und bietet an, erst das zu
     uebernehmen - sonst holt man munter weiter und wundert sich, warum
     der Analyzer nichts davon sieht. Gezaehlt wird nach Art, die
     Zeiten aus den Dateinamen. */
  if (p === '/api/morgen/unverarbeitet') {
    const ordner = path.join(WURZEL, 'library', 'roh');
    let katalogStand = 0;
    try { katalogStand = fs.statSync(K.KATALOG).mtimeMs; } catch (e) {}
    let dateien = [];
    try { dateien = fs.readdirSync(ordner).filter(f => /\.json$/.test(f) && !f.startsWith('._')); } catch (e) {}
    const arten = {};
    let juengste = null, aelteste = null;
    for (const f of dateien) {
      const m = fs.statSync(path.join(ordner, f)).mtimeMs;
      if (m <= katalogStand) continue;
      const art = (f.match(/^([a-z]+)-/) || [,'sonst'])[1];
      arten[art] = (arten[art] || 0) + 1;
      if (!juengste || m > juengste) juengste = m;
      if (!aelteste || m < aelteste) aelteste = m;
    }
    return jsonAntwort(res, { katalogStand, arten, anzahl: Object.values(arten).reduce((a,b)=>a+b,0),
                              aelteste, juengste });
  }

  /* Welche Songs haben schon Schlaege/Abschnitte/Wellenstufen - laut
     ROHDATEN, nicht laut Katalog. Der Katalog weiss es erst nach dem
     Neubau; bis dahin hielte das Lesezeichen alles fuer fehlend und
     holte 108 MB ein zweites Mal. Gelesen werden nur die Schluessel
     der timing-Dateien, nicht ihr Inhalt. */
  if (p === '/api/morgen/timing-vorhanden') {
    const ordner = path.join(WURZEL, 'library', 'roh');
    const hat = { schlaege: new Set(), abschnitte: new Set(), wellenStufen: new Set() };
    let dateien = [];
    try { dateien = fs.readdirSync(ordner).filter(f => /^timing-.*\.json$/.test(f)); } catch (e) {}
    for (const f of dateien) {
      try {
        const d = JSON.parse(fs.readFileSync(path.join(ordner, f), 'utf8'));
        for (const [id, t] of Object.entries(d.songs || d)) {
          if (!t || typeof t !== 'object') continue;
          if (Array.isArray(t.schlaege) && t.schlaege.length) hat.schlaege.add(id);
          if (t.abschnitte && t.abschnitte.state === 'complete') hat.abschnitte.add(id);
          if (Array.isArray(t.wellenStufen) && t.wellenStufen.length) hat.wellenStufen.add(id);
        }
      } catch (e) {}
    }
    return jsonAntwort(res, { schlaege: [...hat.schlaege], abschnitte: [...hat.abschnitte],
                              wellenStufen: [...hat.wellenStufen] });
  }

  /* Der letzte Vergleich als Daten - sammeln.js legt ihn ab. */
  if (p === '/api/morgen/vergleich') {
    const f = path.join(WURZEL, 'library', 'letzter-vergleich.json');
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    return jsonAntwort(res, JSON.parse(fs.readFileSync(f, 'utf8')));
  }

  /* Die Kommentare eines Songs - aus reaktionen.ndjson, zur Anzeige.
     Kommentare mit ihren Antworten darunter, je Kommentar der juengste
     Stand (die Datei traegt bei Aenderung eine neue Zeile; gezeigt wird
     die letzte). Geloeschte bleiben - mit dem Datum, an dem wir sie
     zuletzt sahen. Die Datei wird je Aufruf gelesen; bei 800 Zeilen
     sind das Millisekunden. Waechst sie auf Zehntausende, gehoert ein
     Index her. */
  if (p.startsWith('/api/kommentare/')) {
    const id = p.slice('/api/kommentare/'.length);
    if (!/^[0-9a-f-]{36}$/.test(id)) { res.writeHead(400); return res.end(); }
    const kommentare = new Map(), antworten = new Map();
    const reaktionen = [], kommentarLikes = [];
    if (fs.existsSync(REAKTIONEN)) {
      for (const z of fs.readFileSync(REAKTIONEN, 'utf8').split('\n')) {
        if (!z.trim()) continue;
        let e; try { e = JSON.parse(z); } catch (x) { continue; }
        if (e.song !== id) continue;
        if (e.art === 'kommentar') kommentare.set(e.id, e);          // juengster Stand gewinnt
        else if (e.art === 'antwort') antworten.set(e.id, e);
        else if (e.art === 'clip_like') reaktionen.push(e);
        else if (e.art === 'comment_like') kommentarLikes.push(e);
      }
    }
    const liste = [...kommentare.values()].sort((a, b) => (b.am || '').localeCompare(a.am || ''));
    /* Wer hat einen Kommentar geliked? Der Strom nennt den Kommentar
       nicht per ID, sondern mit den ersten Zeichen seines Textes
       ('Wunderschoen geworden...'). Zugeordnet wird ueber diesen Anfang
       - bei eigenen Kommentaren UND Antworten, denn geliked wird beides. */
    const anfang = t => (t || '').replace(/\.\.\.$/, '').trim().slice(0, 18).toLowerCase();
    const alleTexte = [...kommentare.values(), ...antworten.values()];
    for (const kl of kommentarLikes) {
      const a = anfang(kl.text);
      if (!a) continue;
      const ziel = alleTexte.find(k => anfang(k.text).startsWith(a) || a.startsWith(anfang(k.text)));
      if (!ziel) continue;
      (ziel.geliktVon = ziel.geliktVon || []).push({ von: (kl.von||[])[0], name: (kl.namen||[])[0], am: kl.am });
    }
    for (const k of liste) {
      k.antworten = [...antworten.values()].filter(w => w.kommentar === k.id)
                      .sort((a, b) => (a.am || '').localeCompare(b.am || ''));
    }
    /* Dazu der Zaehlerverlauf aus dem Katalog - aufbereiten.js schreibt
       je Tag einen Stand, nur bei Aenderung. */
    const kat = katalogHolen();
    const song = kat && kat.songs && kat.songs[id];
    return jsonAntwort(res, { song: id, kommentare: liste, anzahl: liste.length,
      antworten: antworten.size,
      likes: reaktionen.filter(e => e.art === 'clip_like')
               .sort((a, b) => (b.am || '').localeCompare(a.am || '')),
      verlauf: (song && song.zaehlerVerlauf) || [],
      /* 'gesehen' der juengsten Zeile je Art: Alles, was nach dem letzten
         Oeffnen des Fensters dazukam, gilt als ungelesen. Was zuletzt
         geoeffnet wurde, merkt sich der Browser; der Server sagt nur,
         wann jede Reaktion bei uns ankam. */
    });
  }

  /* ----------------------------------------------------------------
     Die Community ueber ALLE Songs: wer hat wo reagiert, wer folgt.
     Eine Antwort fuer das ganze Archiv - die Datei ist klein genug,
     um je Aufruf gelesen zu werden.
  ---------------------------------------------------------------- */
  if (p === '/api/community') {
    const leute = new Map();          // handle -> { name, avatar, kommentare:[], likes:[], antworten:[] }
    const follower = [];
    /* Reaktionen auf EIGENE Kommentare unter FREMDEN Songs - Likes und
       Antworten dort. Suno schickt sie als Benachrichtigung, sie sind
       seine Aktivitaet, aber sie gehoeren nicht ins Song-Fenster und
       nicht in die Spur einer Person durch SEIN Archiv. (Caspar_D,
       20.08.2026: "wie kommt dieser fremde Kommentar hierher".)
       Eigener Block im Profil. */
    const k = katalogHolen();
    const eigene = new Set(Object.keys((k && k.songs) || {}));
    const auswaerts = [];
    const wer = (h, name, avatar) => {
      if (!h) return null;
      if (!leute.has(h)) leute.set(h, { handle: h, name: name || h, avatar: avatar || '',
                                        kommentare: [], antworten: [], likes: [], zuletzt: '' });
      const l = leute.get(h);
      if (name && !l.name) l.name = name;
      if (avatar && !l.avatar) l.avatar = avatar;
      return l;
    };
    const gesehenKomm = new Set();
    if (fs.existsSync(REAKTIONEN)) {
      for (const z of fs.readFileSync(REAKTIONEN, 'utf8').split('\n')) {
        if (!z.trim()) continue;
        let e; try { e = JSON.parse(z); } catch (x) { continue; }
        if (e.art === 'kommentar' || e.art === 'antwort') {
          if (gesehenKomm.has(e.id)) continue;        // juengster Stand zaehlt einmal
          gesehenKomm.add(e.id);
          const l = wer(e.von, e.name, e.avatar);
          if (!l) continue;
          (e.art === 'kommentar' ? l.kommentare : l.antworten)
            .push({ song: e.song, songTitel: e.songTitel, am: e.am, text: e.text, likes: e.likes });
          if (e.am > l.zuletzt) l.zuletzt = e.am;
        } else if (e.art === 'clip_like') {
          (e.von || []).forEach((h, i) => {
            const l = wer(h, (e.namen || [])[i]);
            if (!l) return;
            l.likes.push({ song: e.song, songTitel: e.songTitel, am: e.am });
            if (e.am > l.zuletzt) l.zuletzt = e.am;
          });
        } else if (e.art === 'follow') {
          (e.von || []).forEach((h, i) => follower.push({ handle: h, name: (e.namen || [])[i] || h, am: e.am }));
        } else if ((e.art === 'comment_like' || e.art === 'comment_reply') && e.song && !eigene.has(e.song)) {
          auswaerts.push({ art: e.art, songTitel: e.songTitel, song: e.song, text: e.text, am: e.am,
                           von: (e.von || [])[0], name: (e.namen || [])[0] });
        }
      }
    }
    const liste = [...leute.values()].map(l => ({
      ...l, gewicht: l.kommentare.length * 3 + l.antworten.length + l.likes.length,
    })).sort((a, b) => b.gewicht - a.gewicht);
    return jsonAntwort(res, { leute: liste, follower:
      follower.sort((a, b) => (b.am || '').localeCompare(a.am || '')),
      auswaerts: auswaerts.sort((a, b) => (b.am || '').localeCompare(a.am || '')) });
  }

  // Welche Analysen liegen fertig vor?
  if (p === '/api/analyse') {
    return jsonAntwort(res, { fertig: analyseListe() });
  }

  if (p.startsWith('/analyse/')) {
    const rest = p.slice('/analyse/'.length);
    if (req.method === 'PUT') return analyseSchreiben(req, res, rest);
    const n = analyseName(rest);
    if (!n) { res.writeHead(400); return res.end(); }
    const ziel = path.join(ANALYSE, `${n.id}.${n.endung}`);
    if (!fs.existsSync(ziel)) { res.writeHead(404); return res.end(); }
    return liefere(req, res, ziel);
  }

  // Katalog - nur die schlanken Felder fürs Raster
  if (p === '/api/index') {
    const k = katalogHolen();
    if (!k) { res.writeHead(503); return res.end('Kein Katalog'); }
    return jsonAntwort(res, {
      version:    paketVersion(),
      erstelltAm: k.erstelltAm,
      anzahl:     schlankeListe.length,
      spielzeit:  k.spielzeit || null,
      zeitraum:   k.zeitraum  || null,
      profil:     k.profil    || null,
      songs:      schlankeListe,
      /* Die Analyse-Skalare je Song, aus bin/analyse-index.js. 77 KB fuer
         321 Songs. Damit sortiert die Albumseite nach BPM, Lautheit,
         Dynamik, Tonart - ohne die 3 GB Ablage anzufassen. */
      analyse:    analyseIndexHolen(),
      // Playlists ungekürzt: Sie tragen die Reihenfolge und die
      // Einträge fremder Songs, die es im Songteil gar nicht gibt.
      playlists:  k.playlists ? Object.values(k.playlists) : [],
    });
  }

  /* EQ-Profile (bin/eq-profil.js): 8-Band-Klangprofil je Song plus
     Sammlungsmittel - die Datengrundlage der Tonstudioseite. */
  /* Scan starten (23.08.): erst der laufende Song, dann alle ohne Eintrag - ein Lauf zur Zeit */
  if (p === '/api/stoerfrequenz/start' && req.method === 'POST') {
    let roh = ''; req.on('data', c => { roh += c; if (roh.length > 4096) req.destroy(); });
    req.on('end', () => {
      let d = null; try { d = JSON.parse(roh); } catch (e) {}
      const id = d && /^[0-9a-f-]{36}$/.test(d.id) ? d.id : null;
      if (global.stoerLauf) return jsonAntwort(res, { ok: true, laeuft: true });
      const cp = require('node:child_process');
      const start = (args) => { const k = cp.spawn(process.execPath, ['bin/stoerfrequenz.js', ...args], { cwd: WURZEL, stdio: 'ignore' });
        k.on('error', () => { global.stoerLauf = false; }); return k; };
      global.stoerLauf = true;
      const k1 = id ? start([id]) : null;
      const weiter = () => { const k2 = start([]); k2.on('close', () => { global.stoerLauf = false; }); };
      if (k1) k1.on('close', weiter); else weiter();
      jsonAntwort(res, { ok: true, laeuft: true });
    });
    return;
  }
  /* Stoerfrequenzen je Song (bin/stoerfrequenz.js) - Vorschlaege fuer die Kerbe */
  if (p === '/api/stoerfrequenzen') {
    const f = path.join(WURZEL, 'library', 'stoerfrequenzen.json');
    if (!fs.existsSync(f)) return jsonAntwort(res, { stand: null, songs: {} });
    return liefere(req, res, f);
  }
  /* Was in den Stems steht: Huellkurven je Spur, Tonart, Stimmlage.
     Kommt aus bin/toene.js und braucht die Stems aus bin/stems.js. */
  /* Was Whisper gehoert hat - der Volltext EINES Songs.
     Bis heute war dieses Feld toter Bestand: die Datei traegt fuer 256
     Songs rund 440.000 Zeichen gehoerten Text, herausgereicht wurde
     davon nie etwas (nur die Zeitmarken, weiter unten in /api/zeitprobe).
     Tarja wollte ihn sehen - sie untertitelt ihre Streams mit demselben
     Modell, und auf ihren Wunsch hin ist Whisper hier ueberhaupt
     eingezogen (docs/WHISPER.md).

     Wie die Notenzonen: Sammeldatei einmal lesen, nach Zeitstempel
     halten, songweise ausliefern. Die 2,2 MB sollen nicht bei jedem
     Songwechsel durch den Parser. */
  if (p.startsWith('/api/whisper/')) {
    const id = p.slice('/api/whisper/'.length);
    if (!/^[0-9a-f-]{36}$/i.test(id)) { res.writeHead(400); return res.end(); }
    const f = path.join(WURZEL, 'library', 'whisper.ndjson');
    if (!fs.existsSync(f)) return jsonAntwort(res, null);
    try {
      const stand = fs.statSync(f).mtimeMs;
      if (!whisperSpeicher || whisperSpeicher.stand !== stand) {
        const nach = {};
        for (const z of fs.readFileSync(f, 'utf8').split('\n')) {
          if (!z.trim()) continue;
          try { const e = JSON.parse(z); if (e.id) nach[e.id] = e; } catch (x) {}
        }
        whisperSpeicher = { stand, daten: nach };
      }
      const e = whisperSpeicher.daten[id];
      if (!e) return jsonAntwort(res, null);
      /* Ohne die Wortliste - die ist gross und hat mit dem Text nichts
         zu tun; wer Zeitmarken braucht, nimmt /api/zeitprobe. */
      return jsonAntwort(res, {
        text: e.text || '', sprache: e.sprache || null, modell: e.modell || null,
        stand: e.stand || null, dauer: e.dauer || null,
        worte: Array.isArray(e.worte) ? e.worte.length : 0,
        abgeglichen: e.abgeglichen || 0,
        schleife: !!e.schleife, instrumental: !!e.instrumental });
    } catch (e) { return jsonAntwort(res, null); }
  }

  /* Die Notenzonen EINES Songs, herausgeschnitten aus der Sammeldatei.
     Sammeldatei, weil exFAT hier 1 MB Blockgroesse hat und 321 kleine
     Dateien 321 MB belegen wuerden. Songweise ausgeliefert, weil der
     Browser sonst 20 MB laedt, um 65 KB zu benutzen.
     Die Datei wird einmal gelesen und gehalten; ihr Zeitstempel sagt,
     wann neu gelesen werden muss. */
  if (p.startsWith('/api/notenzonen/')) {
    const id = p.slice('/api/notenzonen/'.length);
    if (!/^[0-9a-f-]{30,}$/i.test(id)) { res.writeHead(400); return res.end(); }
    const f = path.join(WURZEL, 'library', 'notenzonen.json');
    if (!fs.existsSync(f)) return jsonAntwort(res, null);
    try {
      const stand = fs.statSync(f).mtimeMs;
      if (!zonenSpeicher || zonenSpeicher.stand !== stand)
        zonenSpeicher = { stand, daten: JSON.parse(fs.readFileSync(f, 'utf8')).songs || {} };
      return jsonAntwort(res, zonenSpeicher.daten[id] || null);
    } catch (e) { return jsonAntwort(res, null); }
  }
  /* Die oeffentlichen Profilzahlen der Leute, die hier vorkommen -
     geholt von bin/community-profile.js. Dient dem Einordnen der eigenen
     Zahlen; ohne Vergleich sagt ein Hirschfaktor von 22 nichts.
     (Caspar_D, 26.08.2026: "wo stehen meine follower, liker".) */
  if (p === '/api/community-profile') {
    const f = path.join(WURZEL, 'library', 'community-profile.json');
    if (!fs.existsSync(f)) return jsonAntwort(res, { stand: null, leute: {} });
    return liefere(req, res, f);
  }
  /* NACHBARSCHAFT AUFFRISCHEN (Caspar_D, 26.08.2026: "Zahlen updaten
     sollte man mit einem Knopf aus dem Community panel machen können,
     das Ding läuft aber im Hintergrund").

     Zwei Laeufe hintereinander: erst die Profilzahlen, dann die
     Hirschfaktoren - der zweite liest die Liste des ersten. Sie laufen
     losgeloest weiter, auch wenn die Seite zugemacht wird; der Stand
     steht in /api/community-stand.

     ohneNeu (Vorgabe): nur, was fehlt - neue Leute, die seit dem letzten
     Mal kommentiert oder gefolgt haben. Das sind Sekunden.
     Mit "alles": auch die vorhandenen Zahlen auffrischen. Das kostete
     beim ersten Mal 22 Minuten und rund 800 Anfragen an Sunos Server -
     deshalb nicht die Vorgabe. */
  if (p === '/api/community/start' && req.method === 'POST') {
    let roh = ''; req.on('data', c => { roh += c; if (roh.length > 4096) req.destroy(); });
    req.on('end', () => {
      let d = null; try { d = JSON.parse(roh); } catch (e) {}
      const alles = !!(d && d.alles);
      if (global.communityLauf) return jsonAntwort(res, { ok: true, laeuft: true });
      const cp = require('node:child_process');
      const zusatz = alles ? ['--neu'] : [];
      global.communityLauf = { seit: Date.now(), schritt: 'Profile', alles };
      const k1 = cp.spawn(process.execPath, ['bin/community-profile.js', ...zusatz], { cwd: WURZEL, stdio: 'ignore' });
      k1.on('error', () => { global.communityLauf = null; });
      k1.on('close', () => {
        if (!global.communityLauf) return;
        global.communityLauf.schritt = 'Hirschfaktoren';
        const k2 = cp.spawn(process.execPath, ['bin/community-hirsch.js', ...zusatz], { cwd: WURZEL, stdio: 'ignore' });
        k2.on('error', () => { global.communityLauf = null; });
        k2.on('close', () => { global.communityLauf = null; });
      });
      jsonAntwort(res, { ok: true, laeuft: true });
    });
    return;
  }
  /* Laeuft gerade einer, und wie weit ist er? Die Zahlen kommen aus den
     Dateien selbst - so stimmt der Fortschritt auch, wenn der Lauf von
     der Kommandozeile gestartet wurde. */
  if (p === '/api/community-stand') {
    const zaehle = (name) => { try {
      return Object.keys(JSON.parse(fs.readFileSync(path.join(WURZEL, 'library', name), 'utf8')).leute || {}).length;
    } catch (e) { return 0; } };
    const l = global.communityLauf;
    return jsonAntwort(res, {
      laeuft: !!l, schritt: l ? l.schritt : null, alles: l ? !!l.alles : false,
      seit: l ? l.seit : null,
      profile: zaehle('community-profile.json'), hirsch: zaehle('community-hirsch.json'),
    });
  }

  /* Die Hirschfaktoren der Nachbarn (bin/community-hirsch.js). Erst
     damit bekommt die eigene Zahl einen Massstab. */
  if (p === '/api/community-hirsch') {
    const f = path.join(WURZEL, 'library', 'community-hirsch.json');
    if (!fs.existsSync(f)) return jsonAntwort(res, { stand: null, leute: {} });
    return liefere(req, res, f);
  }
  if (p === '/api/toene') {
    const f = path.join(WURZEL, 'library', 'toene.json');
    if (!fs.existsSync(f)) return jsonAntwort(res, { stand: null, songs: {} });
    return liefere(req, res, f);
  }
  if (p === '/api/eq-profil') {
    const f = path.join(WURZEL, 'library', 'eq-profil.json');
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    return liefere(req, res, f);
  }
  /* Sternenhimmel als eine Datei zum Verschicken (bin/himmel-export.js):
     POST erzeugt ihn frisch, GET liefert ihn aus. */
  if (p === '/api/himmel-export' && req.method === 'POST') {
    const r = require('node:child_process').spawnSync(process.execPath, ['bin/himmel-export.js'], { cwd: WURZEL, encoding: 'utf8' });
    if (r.status !== 0) return jsonAntwort(res, { ok: false, meldung: (r.stderr || r.stdout || '').trim().slice(-300) }, 500);
    return jsonAntwort(res, { ok: true, meldung: (r.stdout || '').trim(), url: '/export/sternenhimmel.html' });
  }
  if (p === '/export/sternenhimmel.html') {
    const f = path.join(WURZEL, 'library', 'export', 'sternenhimmel.html');
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    return liefere(req, res, f);
  }
  /* Musik-Karte (bin/karte.js) und Musikstil je Song (bin/klang.js). */
  if (p === '/api/karte' || p === '/api/klang') {
    const f = path.join(WURZEL, 'library', p === '/api/karte' ? 'karte.json' : 'klang.json');
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    return liefere(req, res, f);
  }
  /* Gemerkte EQ-Einstellungen je Song. EINE Datei fuer alle Songs
     (exFAT: jede Datei kostet einen Block - Caspar_D, 20.08.2026: "nie
     fuer jeden Song eine Mikrodatei"). Und BEWUSST NICHT in den
     erzeugten Analysedaten (analyse-index, eq-profil, Ablage): die
     werden von den Rechenlaeufen neu geschrieben und wuerden die
     Einstellungen ueberschreiben. Gemessenes gehoert der Maschine,
     Eingestelltes gehoert Caspar_D - getrennte Dateien, beide einzeln. */
  if (p === '/api/eq' && req.method === 'GET') {
    const f = path.join(WURZEL, 'library', 'eq.json');
    try { return jsonAntwort(res, JSON.parse(fs.readFileSync(f, 'utf8'))); }
    catch (e) { return jsonAntwort(res, {}); }
  }
  if (p.startsWith('/api/eq/') && req.method === 'PUT') {
    const id = p.slice('/api/eq/'.length);
    if (!/^[0-9a-f-]{36}$/.test(id)) { res.writeHead(400); return res.end(); }
    let roh = '';
    req.on('data', c => { roh += c; if (roh.length > 8192) req.destroy(); });
    req.on('end', () => {
      const f = path.join(WURZEL, 'library', 'eq.json');
      let alle = {}; try { alle = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) {}
      let d = null; try { d = JSON.parse(roh); } catch (e) {}
      /* Kerbe je Song (23.08.2026): { hz, db, q } - mitgemerkt, wenn gesetzt */
      const kerbe = d && d.kerbe && +d.kerbe.hz > 0 ? { hz: +(+d.kerbe.hz).toFixed(1), db: +(+d.kerbe.db).toFixed(1), q: +(+d.kerbe.q).toFixed(1) } : null;
      if (d && ((Array.isArray(d.gains) && d.gains.some(g => g)) || kerbe)) alle[id] = { gains: (d.gains || []).slice(0, 8).map(g => +(+g).toFixed(1)), ...(kerbe ? { kerbe } : {}) };
      else delete alle[id];
      fs.writeFileSync(f, JSON.stringify(alle, null, 1));
      jsonAntwort(res, { ok: true });
    });
    return;
  }

  /* Eigene Notizen je Song - das Werkstattbuch (Caspar_D, 20.08.2026:
     "ich denke, das traegt"). EINE Datei, nie Teil der Suno-Daten,
     nie im ZIP fuer Dritte (paket.js prueft library/ ohnehin).
     GET liefert alle; PUT /api/notiz/<id> setzt eine (leer = weg). */
  if (p === '/api/notizen') {
    const f = path.join(WURZEL, 'library', 'notizen.json');
    try { return jsonAntwort(res, JSON.parse(fs.readFileSync(f, 'utf8'))); }
    catch (e) { return jsonAntwort(res, {}); }
  }
  if (p.startsWith('/api/notiz/') && req.method === 'PUT') {
    const id = p.slice('/api/notiz/'.length);
    if (!/^[0-9a-f-]{36}$/.test(id)) { res.writeHead(400); return res.end(); }
    let roh = '';
    req.on('data', c => { roh += c; if (roh.length > 65536) req.destroy(); });
    req.on('end', () => {
      const f = path.join(WURZEL, 'library', 'notizen.json');
      let alle = {}; try { alle = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) {}
      let text = ''; try { text = String(JSON.parse(roh).text || ''); } catch (e) {}
      if (text.trim()) alle[id] = { text, stand: new Date().toISOString() };
      else delete alle[id];
      fs.writeFileSync(f, JSON.stringify(alle, null, 1));
      jsonAntwort(res, { ok: true, anzahl: Object.keys(alle).length });
    });
    return;
  }

  /* INSTRUMENTAL VON HAND (Caspar_D, 25.08.2026: "es sollte in
     KlangTresor moeglich sein, Songs einen Instrumental Tag zu
     verpassen. Dann weiss Klangtresor sofort, hier keine
     Stimm-Analysen machen").

     Eine eigene Datei, wie die Notizen - Caspar_Ds Urteil gehoert nicht
     in Sunos Daten. Drei Zustaende, nicht zwei: fehlt der Eintrag, gilt
     die Automatik (kein Liedtext = instrumental); 'true' und 'false'
     uebersteuern sie in beide Richtungen. Ein Stueck mit gesprochenem
     Text kann instrumental gemeint sein, ein Naturklang mit Refrain
     nicht.

     PUT mit {wert:true|false|null} - null loescht den Eintrag und gibt
     die Entscheidung an die Automatik zurueck. */
  if (p === '/api/instrumental') {
    const f = path.join(WURZEL, 'library', 'instrumental.json');
    try { return jsonAntwort(res, JSON.parse(fs.readFileSync(f, 'utf8'))); }
    catch (e) { return jsonAntwort(res, {}); }
  }
  if (p.startsWith('/api/instrumental/') && req.method === 'PUT') {
    const id = p.slice('/api/instrumental/'.length);
    if (!/^[0-9a-f-]{36}$/.test(id)) { res.writeHead(400); return res.end(); }
    let roh = '';
    req.on('data', c => { roh += c; if (roh.length > 4096) req.destroy(); });
    req.on('end', () => {
      const f = path.join(WURZEL, 'library', 'instrumental.json');
      let alle = {}; try { alle = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) {}
      let wert = null; try { wert = JSON.parse(roh).wert; } catch (e) {}
      if (wert === true || wert === false) alle[id] = { wert, stand: new Date().toISOString() };
      else delete alle[id];
      fs.writeFileSync(f, JSON.stringify(alle, null, 1));
      /* AUFRAEUMEN, wenn instrumental gesetzt wird (Caspar_D: "es sollte
         dann auch zur Folge haben, dass alles geloescht wird, was mit
         vocals zu tun hat, falls doch schon Analysen gelaufen sind").
         Was geloescht wird, meldet die Antwort - der Nutzer soll sehen,
         was sein Haken bewirkt hat. */
      const weg = [];
      /* ZURUECKNEHMEN MUSS AUFRAEUMEN (25.08.2026, beim Testen gefunden:
         ein Haken wurde gesetzt und wieder geloescht - das Flag im
         Katalog blieb stehen, und der Song galt weiter als instrumental,
         obwohl die Handmarkierung fort war). Wer den Haken loest, will
         den Zustand von vorher zurueck. Was geloescht wurde, kommt damit
         nicht wieder - dafuer gibt es die Neurechnung. */
      if (wert !== true) {
        try {
          const zlib = require('node:zlib');
          const kf = path.join(WURZEL, 'library', 'katalog.json.gz');
          const kd = JSON.parse(zlib.gunzipSync(fs.readFileSync(kf)));
          const s = kd.songs && kd.songs[id];
          if (s && s.instrumental) {
            delete s.instrumental;
            if ((s.lyrics && s.lyrics.trim()) || (s.text && s.text.trim())) s.hatGesang = true;
            fs.writeFileSync(kf, zlib.gzipSync(Buffer.from(JSON.stringify(kd))));
            weg.push('Instrumental-Vermerk zurückgenommen');
          }
        } catch (e) { console.error('Katalog nicht zurückgesetzt:', e.message); }
      }
      if (wert === true) {
        // 1. Stimmlage aus toene.json
        const tf = path.join(WURZEL, 'library', 'toene.json');
        try {
          const t = JSON.parse(fs.readFileSync(tf, 'utf8'));
          if (t.songs && t.songs[id] && t.songs[id].stimme) {
            delete t.songs[id].stimme;
            fs.writeFileSync(tf, JSON.stringify(t, null, 0));
            weg.push('Stimmlage');
          }
        } catch (e) {}
        // 2. Whisper-Eintrag aus whisper.ndjson
        const wf = path.join(WURZEL, 'library', 'whisper.ndjson');
        try {
          const zeilen = fs.readFileSync(wf, 'utf8').split('\n');
          const behalten = zeilen.filter(z => {
            if (!z.trim()) return false;
            try { return JSON.parse(z).id !== id; } catch (e) { return true; }
          });
          if (behalten.length < zeilen.filter(z => z.trim()).length) {
            fs.writeFileSync(wf, behalten.join('\n') + '\n');
            weg.push('Whisper-Transkript');
          }
        } catch (e) {}
        // 3. Was im Katalog aus einer Analyse stammt - NICHT Sunos eigene
        //    Angaben. Ein instrumentales Stueck darf einen Lyrics-Prompt
        //    haben (Regieanweisungen, [Intro - instrumental]); der ist
        //    Quelldatum, kein Messergebnis. Gemessen ist, was Whisper
        //    beigesteuert hat.
        try {
          const zlib = require('node:zlib');
          const kf = path.join(WURZEL, 'library', 'katalog.json.gz');
          const kd = JSON.parse(zlib.gunzipSync(fs.readFileSync(kf)));
          const s = kd.songs && kd.songs[id];
          if (s) {
            let geaendert = false;
            if (s.worte && s.worteQuelle === 'whisper') {
              delete s.worte; delete s.worteQuelle; geaendert = true; weg.push('Wort-Zeitmarken (Whisper)');
            }
            if (s.lyrics && s.lyricsQuelle === 'whisper') {
              delete s.lyrics; delete s.lyricsQuelle; geaendert = true; weg.push('Liedtext (Whisper)');
            }
            if (s.hatGesang !== false) { s.hatGesang = false; geaendert = true; }
            if (!s.instrumental) { s.instrumental = true; geaendert = true; }
            if (geaendert) fs.writeFileSync(kf, zlib.gzipSync(Buffer.from(JSON.stringify(kd))));
          }
        } catch (e) { console.error('Katalog nicht aufgeräumt:', e.message); }
      }
      jsonAntwort(res, { ok: true, wert, geloescht: weg, anzahl: Object.keys(alle).length });
    });
    return;
  }

  /* Lyrics aller Songs, klein und flach, fuer die Suche im Suchfeld:
     { id: "text in kleinbuchstaben ohne [anweisungen]" }. Wird erst
     geladen, wenn jemand Freitext tippt, und dann im Browser behalten.
     ~300 KB fuer 257 Texte - ein Abruf, keine Suchanfrage je Tastendruck. */
  if (p === '/api/lyrics-index') {
    const k = katalogHolen();
    if (!k) { res.writeHead(503); return res.end('Kein Katalog'); }
    const aus = {};
    for (const s of Object.values(k.songs))
      if (s.lyrics && s.lyrics.trim())
        aus[s.id] = s.lyrics.replace(/\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').toLowerCase().trim();
    return jsonAntwort(res, aus);
  }

  /* Welchen Songs fehlt die v3-Spur noch? Fuer die v3-Ernte des
     Lesezeichens: Es fragt hier, holt nur das Fehlende und stoesst
     bei Suno an, was noch nicht gerechnet ist. */
  /* Welchen Songs fehlen Suno-v2-Zeitmarken? (worte fehlt oder kommt
     von Whisper.) Fuer die Nachlade-Option des Lesezeichens - Caspar_Ds
     Frage vom 20.08.2026: rechnet Suno auch v2 erst auf Anfrage?
     Instrumentals ohne Lyrics bleiben draussen - ohne Text gibt es
     nichts auszurichten. */
  if (p === '/api/morgen/v2-fehlt') {
    const k = katalogHolen();
    if (!k) { res.writeHead(503); return res.end('Kein Katalog'); }
    const fehlt = Object.values(k.songs)
      .filter(s => !s.fremd && s.lyrics && s.lyrics.trim()
                && (!(s.worte && s.worte.length) || s.worteQuelle === 'whisper'))
      .map(s => s.id);
    return jsonAntwort(res, { fehlt });
  }

  if (p === '/api/morgen/v3-fehlt') {
    const k = katalogHolen();
    if (!k) { res.writeHead(503); return res.end('Kein Katalog'); }
    /* Vorhanden = im Katalog (worteV3) ODER als noch unverarbeitete
       Rohdatei im aktiven Ordner. */
    const hat = new Set(Object.values(k.songs).filter(s => s.worteV3 && s.worteV3.length).map(s => s.id));
    /* Ohne Lyrics keine Ausrichtung - die Naturklaenge bleiben draussen. */
    try {
      const ordner = path.join(WURZEL, 'library', 'roh');
      for (const f of fs.readdirSync(ordner).filter(f => /^timing-.*\.json$/.test(f))) {
        let j; try { j = JSON.parse(fs.readFileSync(path.join(ordner, f), 'utf8')); } catch (e) { continue; }
        const probe = (j.songs && j.songs.__zeitprobe) || (j.timing && j.timing.__zeitprobe);
        if (probe) for (const [id, o] of Object.entries(probe))
          if (o && o.v3 && (Array.isArray(o.v3.alignment) || Array.isArray(o.v3.aligned_words))) hat.add(id);
      }
    } catch (e) {}
    const fehlt = Object.values(k.songs)
      .filter(s => !s.fremd && s.lyrics && s.lyrics.trim() && !hat.has(s.id)).map(s => s.id);
    return jsonAntwort(res, { fehlt, vorhanden: hat.size });
  }

  /* Zeitmarken-Vergleich (20.08.2026): drei Quellen fuer EINEN Song -
     v2 aus dem Katalog (worte), v3 aus der Zeitprobe des Lesezeichens
     (__zeitprobe in einer timing-Rohdatei), Whisper aus whisper.ndjson.
     Fuer das Drei-Zeilen-Karaoke der Albumseite (#vergleich=<id>). */
  if (p.startsWith('/api/zeitprobe/')) {
    const id = p.slice('/api/zeitprobe/'.length);
    if (!/^[0-9a-f-]{36}$/.test(id)) { res.writeHead(400); return res.end(); }
    const k = katalogHolen();
    const song = k && k.songs[id];
    const aus = { titel: song ? song.titel : '',
                  /* v2: entweder die Hauptspur (wenn nicht Whisper),
                     oder die nachgeladene Nebenspur worteV2 - Whisper
                     bleibt Hauptspur, wo es sie gibt (Caspar_Ds Regel). */
                  v2: (song && (song.worteQuelle !== 'whisper' ? song.worte : song.worteV2)) || null,
                  v3: (song && song.worteV3) || null, whisper: null };
    /* v3 vorrangig aus dem Katalog (aufbereiten.js importiert die
       Zeitproben als worteV3). Nur wenn dort nichts steht, die
       Rohdateien absuchen - auch die schon verarbeiteten; die
       Umrechnung der Silbenstuecke liegt in katalog.js. */
    if (!aus.v3) try {
      const wurzelRoh = path.join(WURZEL, 'library', 'roh');
      const dateien = [];
      for (const o of [wurzelRoh, path.join(wurzelRoh, 'verarbeitet')])
        if (fs.existsSync(o)) for (const f of fs.readdirSync(o))
          if (/^timing-.*\.json$/.test(f)) dateien.push(path.join(o, f));
      dateien.sort((x, y) => path.basename(y).localeCompare(path.basename(x)));
      for (const f of dateien) {
        let j; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { continue; }
        const probe = (j.songs && j.songs.__zeitprobe) || (j.timing && j.timing.__zeitprobe) || j.__zeitprobe;
        if (probe && probe[id]) {
          const roh = probe[id];
          const zuWorten = (d) => Array.isArray(d)
            ? d.map(w => [w.start_s ?? w.start, w.end_s ?? w.end, (w.word ?? w.text ?? '')])
            : K.v3ZuWorten(d);
          if (roh.v3 && roh.v3.state === 'running') aus.v3lauft = true;   // Suno rechnet noch
          if (roh.v3 && !roh.v3.fehler) aus.v3 = zuWorten(roh.v3);
          if (roh.v2 && !roh.v2.fehler && !aus.v2) aus.v2 = zuWorten(roh.v2);
          break;
        }
      }
    } catch (e) {}
    /* Whisper: letzte Zeile fuer die ID gewinnt */
    try {
      const wd = path.join(WURZEL, 'library', 'whisper.ndjson');
      if (fs.existsSync(wd))
        for (const z of fs.readFileSync(wd, 'utf8').split('\n'))
          if (z.trim()) { try { const e = JSON.parse(z); if (e.id === id) aus.whisper = e.worte; } catch (x) {} }
    } catch (e) {}
    return jsonAntwort(res, aus);
  }

  // Einzelner Song mit allem: Lyrics, Prompts, Zählerverlauf
  if (p.startsWith('/api/song/')) {
    const id = p.slice('/api/song/'.length);
    if (!/^[0-9a-f-]{36}$/.test(id)) { res.writeHead(400); return res.end(); }
    const k = katalogHolen();
    const s = k && k.songs[id];
    if (!s) { res.writeHead(404); return res.end('Unbekannter Song'); }
    return jsonAntwort(res, s);
  }

  /* Profilbild. Es gehört dem Konto, nicht dem Programm, und liegt
     deshalb in library/ statt in web/. Die Endung steht nicht fest -
     Suno liefert webp, jpg oder png -, also wird gesucht. Fehlt es
     (etwa vor dem ersten Ladelauf), gibt es 404 und die Oberfläche
     blendet das Bild aus. */
  if (p === '/avatar') {
    const ordner = path.join(WURZEL, 'library');
    for (const e of ['webp','jpg','jpeg','png','gif']) {
      const f = path.join(ordner, 'avatar.' + e);
      if (fs.existsSync(f)) return liefere(req, res, f);
    }
    res.writeHead(404); return res.end();
  }

  /* Das Titelbild des Profils, nach demselben Muster wie /avatar: in
     library/, Endung gesucht, 404 wenn es fehlt (Caspar_D, 26.08.2026). */
  if (p === '/profilbild') {
    const ordner = path.join(WURZEL, 'library');
    for (const e of ['webp','jpg','jpeg','png','gif']) {
      const f = path.join(ordner, 'profilbild.' + e);
      if (fs.existsSync(f)) return liefere(req, res, f);
    }
    res.writeHead(404); return res.end();
  }

  // Playlist-Cover. Eigener Pfad, weil sie zu keinem Song gehören.
  if (p.startsWith('/playlistbild/')) {
    const ziel = sicherer(PLAYLISTBILDER, p.slice('/playlistbild/'.length));
    if (!ziel) { res.writeHead(403); return res.end(); }
    return liefere(req, res, ziel);
  }

  // Mediendateien
  if (p.startsWith('/media/')) {
    const ziel = sicherer(SONGS, p.slice('/media/'.length));
    if (!ziel) { res.writeHead(403); return res.end(); }
    return liefere(req, res, ziel);
  }

  /* Der Morgenknopf. Er liegt in browser/, nicht in web/ - er gehört
     nicht zur Oberfläche, sondern wird von einer fremden Seite geladen.
     Deshalb ein eigener Weg statt eines Wegs unter web/. */
  if (p.startsWith('/browser/')) {
    const ziel = sicherer(path.join(WURZEL, 'browser'), p.slice('/browser/'.length));
    if (!ziel) { res.writeHead(403); return res.end(); }
    return liefere(req, res, ziel);
  }

  // Oberfläche
  const datei = p === '/' ? 'index.html' : p.replace(/^\//, '');
  const ziel  = sicherer(WEB, datei);
  if (!ziel) { res.writeHead(403); return res.end(); }
  liefere(req, res, ziel);
});

/* ------------------------------------------------------------
   Kein Neustart mehr von Hand
   ------------------------------------------------------------
   Aendert sich diese Datei, beendet sich der Server SELBST - aber nur,
   wenn gerade nichts laeuft. Der Morgenlauf darf nicht mitten in
   'Medien holen' sterben, und ein Lesezeichen, das gerade sichert,
   darf nicht ins Leere laufen (Caspar_D, 19.08.2026: "dann laeuft das
   Lesezeichen doch wieder ins Leere").

   Beenden reicht, weil das Startskript (bin/server-start.sh) in einer
   Schleife steht und ihn sofort wieder hochzieht. Zwischen Ende und
   Neustart liegen rund 200 ms; eine Anfrage, die genau dann kommt,
   scheitert. Das ist der Preis - verglichen mit einem Neustart von
   Hand zu beliebiger Zeit ein kleiner.
------------------------------------------------------------ */
/* Beobachtet werden server.js UND die Module, die er mit require()
   laedt (katalog.js) - die stecken nach dem Start genauso fest im
   Speicher. Fehlte bis 20.08.2026: Eine Aenderung in katalog.js griff
   erst nach einem Neustart von Hand. */
const BEOBACHTET = [__filename, path.join(__dirname, '..', 'bin', 'katalog.js')];
const standVon = (f) => { try { return fs.statSync(f).mtimeMs; } catch (e) { return 0; } };
let eigeneStand = BEOBACHTET.map(standVon).join('|');
setInterval(() => {
  const m = BEOBACHTET.map(standVon).join('|');
  if (m === eigeneStand) return;
  if (morgen.laeuft) { return; }             // nicht mitten im Lauf
  console.log('\n  server.js oder ein Modul hat sich geaendert - starte neu.\n');
  server.close(() => process.exit(75));      // 75 = bitte neu starten
  setTimeout(() => process.exit(75), 2000);  // haengende Verbindungen nicht abwarten
}, 2000);

/* Ist der Port belegt, stirbt der Server sonst mit einem Stacktrace -
   und das Einrichtungsskript hat den Browser da schon geoeffnet. Der
   zeigt dann den ANDEREN KlangTresor, der auf dem Port lauscht, und es
   sieht nach vollem Erfolg aus. Wer das glaubt, haelt den falschen
   Ordner fuer den aktiven und raeumt bei Gelegenheit den richtigen weg.
   (Gefunden beim Durchspielen der Update-Wege, 24.08.2026.) */
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n  Auf Port ${PORT} laeuft bereits ein KlangTresor.\n`);
    console.error('  Zwei koennen sich denselben Port nicht teilen. Entweder das');
    console.error('  andere Fenster mit Strg-C beenden - oder pruefen, ob dort');
    console.error('  schon das Archiv laeuft, das gemeint war:');
    console.error(`      http://localhost:${PORT}\n`);
    process.exit(1);
  }
  console.error('\n  Server-Fehler:', e.message, '\n');
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n  KlangTresor läuft\n');
  console.log(`  Auf diesem Mac:  http://localhost:${PORT}`);

  // Alle Netzwerkadressen zeigen - der Mac hängt oft in mehreren Netzen
  for (const [name, liste] of Object.entries(os.networkInterfaces())) {
    for (const n of liste || []) {
      if (n.family === 'IPv4' && !n.internal) {
        console.log(`  Im Heimnetz (${name}):  http://${n.address}:${PORT}`);
      }
    }
  }

  const k = katalogHolen();
  if (k) console.log(`\n  ${schlankeListe.length} Songs im Katalog.`);
  else   console.log('\n  Achtung: Katalog fehlt - erst "node bin/aufbereiten.js" laufen lassen.');
  console.log('\n  Beenden mit Strg+C\n');
});
