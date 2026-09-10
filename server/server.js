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
const { Behaelter, INDEX: BEHAELTER_INDEX } = require('../bin/behaelter.js');

/* Argumente (Caspar_D, 09.09.2026): fuer den Archiv-Export auf den
   USB-Stick. Die Startskripte dort rufen
       node Programm/server/server.js --eingefroren --port 8788
   und lesen die Zeile "KlangTresor auf http://localhost:PORT" aus der
   Ausgabe, um den Browser zu oeffnen. Ohne Argumente laeuft alles wie
   bisher - Port 8788, belegt heisst Abbruch mit Hinweis.

   --eingefroren   nur lesen: alles ausser GET/HEAD bekommt 405, keine
                   Selbst-Neustart-Wache, keine Migration beim Start.
                   Auch als Umgebung: KLANGTRESOR_EINGEFROREN=1.
   --port N        Wunschport. Ist er belegt, wird der naechste freie
                   genommen - auf einem fremden Rechner weiss niemand,
                   was dort schon lauscht, und der Stick soll trotzdem
                   aufgehen. */
const ARGUMENTE = process.argv.slice(2);
const EINGEFROREN = ARGUMENTE.includes('--eingefroren') || process.env.KLANGTRESOR_EINGEFROREN === '1';
const PORTWUNSCH = (() => {
  const i = ARGUMENTE.indexOf('--port');
  const n = i >= 0 ? parseInt(ARGUMENTE[i + 1], 10) : NaN;
  return n > 0 && n < 65536 ? n : null;
})();
let PORT = PORTWUNSCH || 8788;
const WURZEL = path.join(__dirname, '..');
const WEB    = path.join(WURZEL, 'web');
const LIB    = path.join(WURZEL, 'library');
const SONGS  = path.join(LIB, 'songs');
const PLAYLISTBILDER = path.join(LIB, 'playlistbilder');
const ANALYSE = path.join(LIB, 'analyse');

/* ------------------------------------------------------------
   Der Behaelter: Ton, Bilder, Analyse-Ablage und Liker-Listen auf dem Stick
   ------------------------------------------------------------
   Auf dem Stick liegen die vielen kleinen Dateien nicht einzeln, sondern
   in wenigen grossen tar-Stuecken (bin/behaelter.js - Caspar_D,
   09.09.2026: "dann arbeiten wir mit Containern"). Der eingefrorene
   Server muss sie dort finden. DIE REGEL: echte Datei zuerst, dann der
   Behaelter, sonst 404 wie bisher. Zu Hause gibt es keinen Behaelter,
   dort bleibt alles beim Alten - Behaelter.gibtEs() sind zwei stat,
   und die fallen nur an, wo eine echte Datei fehlt.

   Der Behaelter wird einmal geoeffnet und im Speicher gehalten; das
   Verzeichnis (bestand-index.ndjson) wird neu gelesen, wenn sich seine
   Aenderungszeit bewegt - ein statSync je Frage, billig. */
let _behaelter = null, _behaelterStand = null;
function behaelterHolen() {
  if (!Behaelter.gibtEs(LIB)) { _behaelter = null; _behaelterStand = null; return null; }
  let m = 0; try { m = fs.statSync(path.join(LIB, BEHAELTER_INDEX)).mtimeMs; } catch (e) { m = 0; }
  if (!_behaelter || m !== _behaelterStand) {
    try { _behaelter = Behaelter.oeffnen(LIB, false); } catch (e) { _behaelter = null; }
    _behaelterStand = m;
  }
  return _behaelter;
}
/* Der Name einer Datei im Behaelter: relativ zu library/, mit
   Vorwaertsschraegstrichen. null, wenn sie nicht unter library/ liegt. */
function behaelterName(datei) {
  const rel = path.relative(LIB, datei);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return rel.split(path.sep).join('/');
}
/* Gibt es die Datei - echt oder im Behaelter? */
function echtOderBehaelter(datei) {
  if (fs.existsSync(datei)) return true;
  const rel = behaelterName(datei), b = rel && behaelterHolen();
  return !!(b && b.hat(rel));
}

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

/* Eingefroren: welche Titel eine MP3 haben - je 30 s neu gezaehlt. */
let _vorhanden = null, _vorhandenZeit = 0;
function eingefrorenVorhanden() {
  if (_vorhanden && Date.now() - _vorhandenZeit < 30000) return _vorhanden;
  const da = new Set();
  /* ... als Datei oder im Behaelter (auf dem Stick liegt der Ton dort) */
  const b = behaelterHolen();
  for (const s of (schlankeListe || [])) { try { if (fs.existsSync(path.join(SONGS, s.id, 'audio.mp3')) || (b && b.hat(`songs/${s.id}/audio.mp3`))) da.add(s.id); } catch (e) {} }
  _vorhanden = da; _vorhandenZeit = Date.now();
  return da;
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
let lyrikSpeicher = null;   /* library/lyrik.json, einmal gelesen */
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
  let stat, imBehaelter = null;   /* imBehaelter: { b, rel }, wenn die Datei nur dort liegt */
  try { stat = fs.statSync(datei); } catch (e) {
    /* Keine echte Datei - dann der Behaelter (Stick). Sein Eintrag traegt
       Laenge und Aenderungszeit; daraus wird ein stat, und alles Weitere
       (Kopfzeilen, Bereiche, Cache-Regeln) laeuft denselben Weg wie bei
       einer echten Datei. */
    const rel = behaelterName(datei), b = rel && behaelterHolen();
    const eintrag = b ? b.eintrag(rel) : null;
    if (!eintrag) {
      res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});
      return res.end('Nicht gefunden');
    }
    imBehaelter = { b, rel };
    stat = { size: eintrag.l, mtime: new Date(eintrag.m || 0), isFile: () => true };
  }
  if (!stat.isFile()) { res.writeHead(404); return res.end(); }
  /* Der Lesestrom: aus der Datei oder aus dem Stueck des Behaelters -
     von/bis sind Byte-Versaetze innerhalb der Datei, inklusive. */
  const strom = (von, bis) => imBehaelter
    ? imBehaelter.b.stream(imBehaelter.rel, von, bis)
    : fs.createReadStream(datei, von != null ? { start: von, end: bis } : undefined);

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
      return strom(von, bis).pipe(res);
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
  /* WANDELBARE DATEIEN muessen revalidiert werden, unwandelbare nicht.
     audio.mp3, cover.jpg und artwork.mp4 kommen von Suno und aendern
     sich nie - die duerfen ein Jahr im Browser liegen. kachel.jpg wird
     dagegen von bin/kacheln.js ERZEUGT und kann neu gerechnet werden.

     Caspar_D, 07.09.2026, nachdem 123 Kacheln neu gerechnet waren und er
     weiter die alten sah: „es sind immer noch ziemlich viele, die sich
     nicht in die Rahmen einfügen". Die Dateien auf der Platte waren
     richtig - der Browser zeigte seinen Vorrat von vor drei Wochen, denn
     bei max-age=31536000 ohne Last-Modified fragt er nie wieder nach. */
  /* eigen*.mp4/jpg/mp3 und das Rezept sind ebenso wandelbar: sie werden ersetzt, geloest und
     unter derselben Nummer neu vergeben (nach Loeschen der hoechsten kehrt sie wieder). */
  const abgeleitet = /(^|\/)(kachel\.jpg|eigen(-\d+)?\.(mp4|jpg|mp3)|eigen-effekt\.json)$/.test(datei);
  const programm = typ.startsWith('text/html') || typ.startsWith('text/javascript') || analyse;
  const wandelbar = programm || abgeleitet;
  const stempel  = stat.mtime.toUTCString();

  if (wandelbar && req.headers['if-modified-since'] === stempel) {
    res.writeHead(304, { 'Cache-Control': 'no-cache', 'Last-Modified': stempel });
    return res.end();
  }

  res.writeHead(200, {
    'Content-Type':   typ,
    'Content-Length': laenge,
    'Accept-Ranges':  'bytes',
    'Cache-Control':  wandelbar ? 'no-cache' : 'public, max-age=31536000',
    ...(wandelbar ? { 'Last-Modified': stempel } : {}),
  });
  strom().pipe(res);
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
  try { dateien = fs.readdirSync(ANALYSE); } catch (e) { dateien = []; }
  /* ... dazu, was im Behaelter liegt (Stick): dort heissen sie analyse/<name> */
  const b = behaelterHolen();
  if (b) for (const rel of b.liste('analyse/')) dateien.push(rel.slice('analyse/'.length));
  if (!dateien.length) return [];
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
   Whisper-Nachtlauf stand von 2 bis 9 Uhr, weil der Mac schlief.

   Dazu seit dem 08.09.2026 eine ID je Schritt. Die Lernkurve
   (morgen-dauern.json) merkte sich die Dauer unter dem NAMEN - und
   jede Umbenennung liess sie vergessen, was sie wusste; der Schluessel
   taugt nicht, weil vier Schritte 'analyse' teilen. Die ID aendert sich
   nicht, der Name darf es.

   Die NAMEN und die Beschreibung ('was') stehen in
   docs/handbuch/MORGENSCHRITTE.json - in Caspar_Ds Redaktion, dort
   redigiert, hier woertlich uebernommen. Die Datei ist die Wahrheit
   fuer den Ton; der Katalog hier traegt dieselben Namen, damit Anzeige
   und Datei uebereinstimmen. Weicht ein Name ab, sagt der Start es. */
const MORGEN_TEXTE = (() => {
  const m = {};
  try {
    for (const e of JSON.parse(fs.readFileSync(path.join(WURZEL, 'docs', 'handbuch', 'MORGENSCHRITTE.json'), 'utf8')))
      m[e.name] = { was: e.was || '', muster: e.kurzergebnis_muster || '' };
  } catch (e) { console.warn('MORGENSCHRITTE.json nicht lesbar: ' + e.message); }
  return m;
})();
/* PFLICHT: bricht der Schritt ab, bricht der Lauf ab - wie die
   Auswahlliste (MORGEN_KREUZE in web/index.html) es traegt: 'katalog'
   ist die Grundlage fuer alles andere. Alle anderen werden bei einem
   Abbruch rot, und der Lauf geht weiter (Caspar_D, 08.09.2026:
   "pflicht-Schritte brechen ab, andere werden rot"). */
const MORGEN_SCHRITTE = [
  /* ZUERST DIE VERBINDUNGEN. Caspar_D, 29.08.2026: "Es darf nicht
     passieren, dass unbemerkt Links sterben und still Daten deswegen
     nicht aktualisiert werden." bin/gesundheit.js fragt jede Adresse,
     von der die Routine holt, nach ihrem Statuscode und meldet
     AENDERUNGEN gegenueber dem letzten Lauf laut. Bricht nie ab -
     die Lautstaerke ist das Protokoll. */
  { id: 'gesundheit', schluessel: 'gesundheit', name: 'Verbindungen prüfen — antworten die Suno-Adressen?', befehl: ['bin/gesundheit.js'] },
  { id: 'katalog', schluessel: 'katalog', pflicht: true, name: 'KlangTresor-Katalog neu bauen — alle Datentransfers zusammenführen, Verlauf von Abrufen, Herzen und Kommentaren fortschreiben', befehl: ['bin/aufbereiten.js'] },
  /* Direkt hinter den Katalog: reaktionen.js liest die Kommentarzahl
     von dort und fragt nur die Songs ab, die welche haben. Vorher waere
     die Zahl vom Vortag. */
  { id: 'kommentare', schluessel: 'kommentare', name: 'Neue Kommentare von Suno sichern', befehl: ['bin/reaktionen.js'] },
  /* Heruntergeladene Audiodateien einsammeln. Seit dem 03.09.2026 gibt
     Suno Audio nur noch ueber "Unlock & Download" heraus - den Klick
     macht der Mensch, das Einsortieren die Ernte. Caspar_D, 07.09.2026:
     "selbst dort schaue ich nicht hin, wenn ich die Ernte mache. Die
     Ernte muss es finden." Steht NACH dem Katalogbau, weil die Zuordnung
     ueber die Signatur den Katalog braucht. */
  { id: 'medien-uebernehmen', schluessel: 'medien', name: 'Heruntergeladene Audiodateien übernehmen', befehl: ['bin/uebernehmen.js', '--tun'] },
  { id: 'medien-laden', schluessel: 'medien', name: 'Medien laden (MP3, Titelbilder, Bewegtbilder)', befehl: ['bin/wiederherstellen.js', '--nur-medien'] },
  { id: 'analyse-rechnen', schluessel: 'analyse', name: 'Klanganalyse für neue Titel rechnen', befehl: ['bin/vorrechnen.js'],
    einheiten: () => {
      const k = katalogHolen(); if (!k) return 0;
      const fertig = new Set(analyseListe());
      return Object.values(k.songs || {}).filter(s => !s.fremd && !fertig.has(s.id)).length;
    } },
  { id: 'analyse-index', schluessel: 'analyse', name: 'Messwerte für Sortieren und Filtern zusammenfassen', befehl: ['bin/analyse-index.js'] },
  /* Klangprofil + Lautheitshistogramm je Song (fuer Tonstudio-Decke,
     Presets und die Kennlinien-Gebirge) - rechnet nur Fehlendes nach. */
  { id: 'analyse-eqprofil', schluessel: 'analyse', name: 'Klangprofil und Lautheitsverteilung nachziehen', befehl: ['bin/eq-profil.js'] },
  /* Stehende Toene (Stoerfrequenzen) fuer die Kerbe im Glockenstuhl - nur
     Songs ohne Eintrag, ~5-10 s je Song (bin/stoerfrequenz.js, 23.08.2026). */
  { id: 'analyse-stoerfrequenz', schluessel: 'analyse', name: 'Störfrequenzen suchen — stehende Töne für den Kerbfilter im Tonstudio', befehl: ['bin/stoerfrequenz.js'],
    einheiten: () => {
      const k = katalogHolen(); if (!k) return 0;
      let fertig = {};
      try { fertig = JSON.parse(fs.readFileSync(path.join(WURZEL, 'library', 'stoerfrequenzen.json'), 'utf8')).songs || {}; } catch (e) {}
      return Object.values(k.songs || {}).filter(s => !s.fremd && !fertig[s.id]
        && fs.existsSync(path.join(WURZEL, 'library', 'songs', s.id, 'audio.mp3'))).length;   /* wie der Detektor selbst */
    } },
  /* Whisper fuer JEDEN neuen Titel mit Text - auch fuer die, die Sunos
     eigene Zeitmarken tragen. Bis zum 08.09.2026 lief hier der enge
     Modus (ohne --alle), der nur Titel ohne Suno-Zeitmarken nahm; die
     261 fertigen Eintraege in whisper.ndjson stammten aus einem Handlauf
     vom 19.-25.08., und drei neue Titel mit Suno-Zeitmarken blieben
     danach ohne Whisper und ohne bereinigte Lyrik. Caspar_D, 08.09.2026:
     "Whisper analysiert alles, ausser Instrumentals, einfach weil Suno
     auch Fehler macht und Whisper die zuverlaessigere Zeitzuordnung
     macht." Instrumentals und die Fokus-Wanderung schliesst whisper.js
     selbst aus; --alle ueberspringt, was in whisper.ndjson schon steht. */
  { id: 'whisper-zeitmarken', schluessel: 'whisper', kaffee: true, name: 'Mitlaufender Text: Wort-Zeitmarken mit Whisper für neue Titel', befehl: ['bin/whisper.js', '--still', '--alle'],
    einheiten: () => {
      const k = katalogHolen(); if (!k) return 0;
      const fertig = new Set();
      try { for (const z of fs.readFileSync(path.join(WURZEL, 'library', 'whisper.ndjson'), 'utf8').split('\n'))
              if (z.trim()) { try { fertig.add(JSON.parse(z).id); } catch (e) {} } } catch (e) {}
      return Object.values(k.songs || {}).filter(s => !s.fremd && s.lyrics && s.lyrics.trim() && !fertig.has(s.id)
        && !/\s(I|II|III|IV)$/.test(s.titel || '')).length;
    } },
  /* Die bereinigte Lyrik direkt hinter Whisper: bin/lyrik.js gleicht den
     Liedtext gegen die Whisper-Marken ab (Needleman-Wunsch) und streicht,
     was nicht gesungen wird. Bis zum 08.09.2026 stand der Schritt in
     keinem Lauf - library/lyrik.json war ein Handstart vom 07.09., und
     jeder Titel seither blieb ohne. Zwei Sekunden fuer den ganzen
     Bestand; rechnet immer alles neu, weil Whisper-Eintraege und Texte
     sich aendern koennen. */
  { id: 'whisper-lyrik', schluessel: 'whisper', name: 'Bereinigte Lyrik — Liedtext gegen die Whisper-Marken abgleichen', befehl: ['bin/lyrik.js', '--tun'] },
  /* Musikstil (Discogs-EffNet, lokal per onnxruntime-node): Embedding,
     Stil, Genre, Stimmung, Instrumente je Song - Grundlage der Karte.
     VOR Whisper waere schneller (6 s je Song), aber hinter Whisper ist
     ehrlicher: bricht Whisper ab, fehlt nicht auch noch die Karte. */
  { id: 'musikstil-vermessen', schluessel: 'musikstil', kaffee: true, name: 'Musikstil vermessen — Klang, Genre, Stimmung', befehl: ['bin/klang.js', '--still'],
    einheiten: () => {
      const k = katalogHolen(); if (!k) return 0;
      let fertig = {};
      try { fertig = JSON.parse(fs.readFileSync(path.join(WURZEL, 'library', 'klang.json'), 'utf8')).songs || {}; } catch (e) {}
      return Object.values(k.songs || {}).filter(s => !s.fremd && !fertig[s.id]).length;
    } },
  /* Die Karte ist in Sekunden gerechnet - immer, wenn der Musikstil
     lief, damit neue Songs ihren Platz am Himmel bekommen. */
  { id: 'musikstil-klangraum', schluessel: 'musikstil', name: 'Klangraum neu zeichnen', befehl: ['bin/karte.js'] },
  /* DER GESCHICHTEN-RAUM, falls er offen ist. Vier Schritte: Vektoren
     fuer neue Texte, Wortvektoren fuer die Ortsbegriffe, die Karte, die
     Text-Achsen. bin/karte.js zeichnet den Raum nur, wenn
     library/karte-geschichten.json da ist - ein beiseitegelegter Raum
     (library/entwurf/) bleibt zu; der Lauf pflegt, was der Autor
     aufgemacht hat, und macht nichts von selbst auf. */
  { id: 'geschichten-textabdruck', schluessel: 'geschichten', name: 'Geschichten-Raum: Textabdruck für neue Titel', befehl: ['bin/geschichten.js'] },
  { id: 'geschichten-wortschatz', schluessel: 'geschichten', name: 'Geschichten-Raum: Wortschatz für die Namen der Gegenden', befehl: ['bin/ortsbegriffe.js'] },
  { id: 'geschichten-zeichnen', schluessel: 'geschichten', name: 'Geschichten-Raum neu zeichnen (nur wenn offen)', befehl: ['bin/karte.js', '--raum', 'geschichten'] },
  { id: 'geschichten-einordnung', schluessel: 'geschichten', name: 'Geschichten-Raum: Einordnung nach Stoff, Haltung und Ton', befehl: ['bin/geschichten-achsen.js'] },
  /* DIE NACHBARSCHAFT GANZ ZUM SCHLUSS (Caspar_D, 26.08.2026). Zwei
     Schritte, gemeinsamer Schluessel - denn hirsch liest die Datei, die
     profile schreibt; einzeln abgewaehlt ergaebe der zweite keinen Sinn.

     WARUM ANS ENDE. Die Frische braeuchte es nicht: reaktionen.js hat
     zwei Schritte vorher schon geliefert, woraus die Handles kommen.
     Aber hier haengt als einziges ein FREMDER Server in der Kette. Am
     Ende blockiert ein Netzhaenger nichts mehr, und wenn Suno gerade
     bremst, ist der Morgen trotzdem gelaufen.

     OHNE --neu, also nur, wer seit gestern dazugekommen ist: an
     normalen Tagen eine Handvoll Profile, deutlich unter einer Minute.
     Das grosse Auffrischen (rund 800 Anfragen) bleibt der Knopf im
     Panel, mit Rueckfrage - "bewusste Entscheidung statt Nebenwirkung",
     HAUSREGELN.md.

     KEIN einheiten() hier: Die Zahl der fehlenden Handles auszurechnen
     hiesse, die beiden Zeilenformen von reaktionen.ndjson ein zweites
     Mal auszuwerten - genau die Doppelung, die am 26.08. den
     Komma-Schluessel-Fehler ergeben hat. Die Dauer schaetzt ohnehin
     morgen-dauern.json aus den letzten Laeufen.

     BEIDE ENDEN IMMER MIT EXIT 0, auch wenn Suno bremst (429/503) oder
     zehn Fehler kamen. Das ist hier Absicht und kein Versehen: Sunos
     Laune darf den Morgen nicht abbrechen - der Rest holt sich beim
     naechsten Lauf. Was tatsaechlich passiert ist, steht in den Zeilen
     im Morgenfenster. */
  { id: 'nachbarn-profile', schluessel: 'nachbarn', name: 'Nachbarschaft: Profile der Neuen holen', befehl: ['bin/community-profile.js'] },
  { id: 'nachbarn-hirsch', schluessel: 'nachbarn', name: 'Nachbarschaft: Hirschfaktoren der Neuen rechnen', befehl: ['bin/community-hirsch.js'] },
];
for (const s of MORGEN_SCHRITTE)
  if (!MORGEN_TEXTE[s.name]) console.warn(`MORGENSCHRITTE.json kennt den Schritt nicht: ${s.name}`);

/* Ein Schritt, wie das Morgenfenster ihn zeigt: ein Abschnitt mit
   Zustand, Kurzergebnis und den eigenen Zeilen (Caspar_D, 08.09.2026,
   Mockup abgenommen). 'zeilen' sind die Zeilen NUR dieses Schritts,
   je Schritt gekappt - vorher lag alles in einem Topf, und das Fenster
   zeigte die letzten vierzehn Zeilen von was auch immer. */
function morgenAbschnitt(s, status) {
  const t = MORGEN_TEXTE[s.name] || {};
  return { id: s.id, schluessel: s.schluessel, name: s.name, was: t.was || '',
           pflicht: !!s.pflicht, status: status || 'wartet', code: null,
           seit: null, dauerMs: null, geschaetztMs: null, kurz: '', zeilen: [] };
}

const morgen = { laeuft:false, schritt:-1, seit:null, zeilen:[], fehler:null, neueIds:[], folge:[],
                 schrittSeit:null, schritte:[], art:null, datensaetze:null };

/* Fuers Einmessen (29.08.2026): das Standard-Ausgabegeraet wird per
   system_profiler ermittelt (traege, darum 10 s Cache), und die
   WARNTON-Lautstaerke laesst sich fuer die Dauer einer Messung auf
   null stellen (Caspar_D: "kannst du fuer den Testlauf saemtliche
   Systemmessages, die Geraeusche machen, ausschalten?"). Der alte
   Wert wird hier gemerkt und beim Zurueckstellen wiederhergestellt. */
let ausgabeGeraetCache = { t: 0, wert: null };
let warntonMerker = null;

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
/* Die beiden Schritte des roten Knopfs vor dem eigentlichen Lauf
   (bin/sammeln.js) tragen ihre ID hier, nicht im Katalog oben. */
const SAMMELN_ID = { ernte: 'sammeln-ernte', frisch: 'sammeln-frisch' };
/* MIGRATION (08.09.2026). Bis dahin lernte die Kurve nach dem NAMEN
   des Schritts. Jede Umbenennung hinterliess einen verwaisten Eintrag,
   und die Lesezeichen-Verwertung trug die Uhrzeit im Namen - 21
   Eintraege 'Lesezeichen-Ernte von HH:MM Uhr', keiner je wieder
   getroffen. Hier werden die alten Namen einmal auf die IDs umgeschrieben
   (Werte bleiben), die Uhrzeit-Eintraege zu einem gemittelt. Fuenf
   Namen von vor dem 20.08. ('Suno abfragen', 'Katalog bauen', ...)
   hatten schon damals juengere Nachfolger und fallen weg. Laeuft bei
   jedem Start, tut aber nur beim ersten Mal etwas. */
const DAUERN_ALTE_NAMEN = {
  'Verbindungen prüfen — antworten die Suno-Adressen?': 'gesundheit',
  'Katalog neu bauen — alle Ernten zusammenführen, Zählerverlauf fortschreiben': 'katalog',
  'Neue Kommentare von Suno sichern': 'kommentare',
  'Heruntergeladene Audiodateien übernehmen': 'medien-uebernehmen',
  'Fehlende Medien laden (MP3, Cover, Videos)': 'medien-laden',
  'Klanganalyse für neue Titel rechnen': 'analyse-rechnen',
  'Messwerte in den Suchindex übernehmen': 'analyse-index',
  'Klangprofil und Lautheitshistogramm nachziehen': 'analyse-eqprofil',
  'Störfrequenzen suchen — stehende Töne für die Kerbe': 'analyse-stoerfrequenz',
  'Karaoke-Zeitanker mit Whisper für neue Titel': 'whisper-zeitmarken',
  'Bereinigte Lyrik — Liedtext gegen die Whisper-Marken abgleichen': 'whisper-lyrik',
  'Musikstil vermessen — Klang, Genre, Stimmung': 'musikstil-vermessen',
  'Klangraum neu zeichnen': 'musikstil-klangraum',
  'Geschichten-Raum: Text-Vektoren für neue Titel': 'geschichten-textabdruck',
  'Geschichten-Raum: Wortvektoren für die Ortsbegriffe': 'geschichten-wortschatz',
  'Geschichten-Raum neu zeichnen (nur wenn offen)': 'geschichten-zeichnen',
  'Geschichten-Raum: Text-Achsen (Stoff, Haltung, Ton)': 'geschichten-einordnung',
  'Nachbarschaft: Profile der Neuen holen': 'nachbarn-profile',
  'Nachbarschaft: Hirschfaktoren der Neuen rechnen': 'nachbarn-hirsch',
  'Titelliste frisch von Suno holen (öffentliches Profil)': SAMMELN_ID.frisch,
};
function dauernMigrieren() {
  const alt = dauernLesen();
  const ids = new Set([...MORGEN_SCHRITTE.map(s => s.id), ...Object.values(SAMMELN_ID)]);
  const neu = {}, ernte = [], weg = [];
  let umgeschrieben = 0;
  for (const [k, v] of Object.entries(alt)) {
    if (ids.has(k)) { neu[k] = v; continue; }
    if (/^Lesezeichen-Ernte von \d\d:\d\d Uhr verwerten/.test(k)) { ernte.push(v); continue; }
    const id = DAUERN_ALTE_NAMEN[k];
    if (id) { if (neu[id] === undefined) neu[id] = v; umgeschrieben++; }
    else weg.push(k);
  }
  if (ernte.length && neu[SAMMELN_ID.ernte] === undefined)
    neu[SAMMELN_ID.ernte] = Math.round(ernte.reduce((a, b) => a + b, 0) / ernte.length);
  if (!umgeschrieben && !ernte.length && !weg.length) return;
  try { fs.writeFileSync(DAUERN, JSON.stringify(neu, null, 1)); } catch (e) { return; }
  console.log(`morgen-dauern.json migriert: ${umgeschrieben} Namen auf IDs, ${ernte.length} Lesezeichen-Eintraege gemittelt`
    + (weg.length ? `, verworfen: ${weg.join(', ')}` : ''));
}
/* Eingefroren wird nichts umgeschrieben - der Stick darf schreibgeschuetzt
   sein, und die Lernkurve der Morgenroutine braucht dort niemand. */
if (!EINGEFROREN) dauernMigrieren();
function dauerMerken(id, ms, einheiten) {
  const d = dauernLesen();
  /* Bei skalierenden Schritten die Dauer je Einheit merken; null
     Einheiten sagen nichts ueber die Dauer und werden nicht gelernt. */
  if (einheiten !== undefined) {
    if (einheiten <= 0) return;
    const je = ms / einheiten;
    d[id] = d[id] ? Math.round(d[id] * 2/3 + je / 3) : Math.round(je);
  } else {
    d[id] = d[id] ? Math.round(d[id] * 2/3 + ms / 3) : ms;
  }
  try { fs.writeFileSync(DAUERN, JSON.stringify(d, null, 1)); } catch (e) {}
}
/* Was der Schritt voraussichtlich dauert - aus der Lernkurve mal der
   Zahl der Einheiten, wenn er skaliert. null, wenn die Kurve ihn noch
   nicht kennt. Das Fenster zeigt es mit einer Tilde bei wartenden
   Schritten. */
function dauerSchaetzen(d, s, einheiten) {
  if (!d[s.id]) return null;
  if (!s.einheiten) return d[s.id];
  return d[s.id] * Math.max(1, einheiten !== undefined ? einheiten : 1);
}
/* Anteil 0..1 und erwartete Restzeit in ms, oder null, wenn nichts
   laeuft. Ein laufender Schritt darf nie ueber 95 % seines eigenen
   Anteils hinaus - sonst steht der Balken voll, waehrend noch gerechnet
   wird, und das ist die eine Luege, die ein Fortschrittsbalken nicht
   erzaehlen darf. */
function fortschritt() {
  if (!morgen.laeuft || !morgen.folge || morgen.schritt < 0) return null;
  const d = dauernLesen();
  const erwartet = morgen.folge.map((s, i) =>
    dauerSchaetzen(d, s, morgen.einheiten && morgen.einheiten[i]) || 0);
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
   dem Zeitpunkt. Bekannt ist ein Eintrag an seiner Suno-ID - aber Suno
   schreibt Eintraege FORT: Herzen, die kurz nacheinander auf denselben
   Titel kommen, sind EIN Buendel mit einer ID, und mit jedem weiteren
   Herzen bekommt es eine neue Zeit, eine groessere Gesamtzahl
   (total_users) und andere drei Namen (user_profiles - mehr als drei
   gibt Suno nie her). Gemessen 08.09.2026 an "Glut und Eis": 8 Herzen
   in der Datei, 12 im Katalog; die ID war bekannt, das Wachstum kam nie
   an. Deshalb: Ein gewachsener Eintrag bekommt eine neue Zeile
   (nachtrag: true, vorher: alte Zahl), und reaktionenLesen() laesst je
   ID die juengste gewinnen. Die Datei wird je Aufruf einmal gelesen; bei
   226 KB ist das billig, waechst sie auf Megabyte, ist ein Index faellig. */
const REAKTIONEN = path.join(WURZEL, 'library', 'reaktionen.ndjson');
/* Alle Zeilen der Datei. Stromzeilen (mit sunoId) je ID nur im juengsten
   Stand, an der Stelle der ersten; Kommentarzeilen von bin/reaktionen.js
   (ohne sunoId) unveraendert, sie haben ihre eigene Regel (id, juengste
   gewinnt beim Leser).

   ZWEI QUELLEN IM STROM. Bis 08.09.2026 kam er aus notification/v2 (Web:
   Herzen auf denselben Titel als EIN Buendel, hoechstens drei Namen),
   seither aus notification/v3 (App: je Person eine Zeile, quelle 'v3').
   Beide reichen vier Wochen zurueck - dieselben Herzen staenden also
   doppelt da, als Buendel aus v2 und als Einzelzeilen aus v3. Regel: ab
   der aeltesten v3-Zeile gilt nur v3; was aelter ist, bleibt aus v2.
   `alle` = ungefiltert, fuer den Schreiber (er muss auch die v2-IDs
   kennen). */
function reaktionenLesen(alle) {
  const zeilen = [], stelle = new Map();
  if (!fs.existsSync(REAKTIONEN)) return zeilen;
  for (const z of fs.readFileSync(REAKTIONEN, 'utf8').split('\n')) {
    if (!z.trim()) continue;
    let e; try { e = JSON.parse(z); } catch (x) { continue; }
    if (!e.sunoId) { zeilen.push(e); continue; }
    if (stelle.has(e.sunoId)) zeilen[stelle.get(e.sunoId)] = e;
    else { stelle.set(e.sunoId, zeilen.length); zeilen.push(e); }
  }
  if (alle) return zeilen;
  let v3Ab = null;
  for (const e of zeilen) if (e.quelle === 'v3' && e.am && (!v3Ab || e.am < v3Ab)) v3Ab = e.am;
  if (!v3Ab) return zeilen;
  return zeilen.filter(e => !(e.sunoId && e.quelle !== 'v3' && e.am && e.am >= v3Ab));
}

/* WER HAT GEHERZT - die vollstaendige Liste je eigenem Titel, ueber den
   Weg der iOS-App (GET /api/gen/<id>/likers/, docs/SUNO-APP-WEGE.md).
   Ablage: library/liker/<song>.json = der juengste Stand (wer, in Sunos
   Reihenfolge, neueste zuerst) mit dem, was an Zeit zu haben ist: der
   letzte einer Seite traegt die Herz-Zeit exakt (sie IST der naechste
   Cursor), alle anderen das Fenster zwischen den Cursors der Seite. Wer
   spaeter dazukommt, bekommt das Fenster zwischen zwei Laeufen; die
   Aenderungen stehen in library/liker-verlauf.ndjson (dazu / weg). Die
   Zeit aus den Benachrichtigungen (einzelne Zeile) legt der Leser
   darueber. Understatement: das Lesezeichen fragt Suno nur, wo sich die
   Herzzahl gegen /api/liker/stand geaendert hat. */
const LIKER = path.join(WURZEL, 'library', 'liker');
const LIKER_VERLAUF = path.join(WURZEL, 'library', 'liker-verlauf.ndjson');
function likerLesen(id) {
  try { return JSON.parse(fs.readFileSync(path.join(LIKER, id + '.json'), 'utf8')); } catch (e) {}
  /* keine Datei - dann der Behaelter (Stick) */
  try { const b = behaelterHolen(), t = b && b.lesen('liker/' + id + '.json'); return t ? JSON.parse(t.toString('utf8')) : null; } catch (e) { return null; }
}
/* Alle Liker-Listen: aus library/liker/, und wenn der Ordner fehlt oder
   leer ist, aus dem Behaelter (Stick). Je Liste: lesen() -> Inhalt oder
   null, stand() -> Aenderungszeit in ms. Die drei Stellen, die vorher
   selbst ueber den Ordner liefen (Stand, Gemeinschaft, /api/stand),
   gehen seit dem Behaelter alle hier durch. */
function likerAlle() {
  const aus = [];
  try { for (const f of fs.readdirSync(LIKER)) { if (!f.endsWith('.json') || f.startsWith('._')) continue;
    const voll = path.join(LIKER, f);
    aus.push({ lesen: () => { try { return JSON.parse(fs.readFileSync(voll, 'utf8')); } catch (e) { return null; } },
               stand: () => { try { return fs.statSync(voll).mtimeMs; } catch (e) { return 0; } } }); } } catch (e) {}
  if (!aus.length) { const b = behaelterHolen(); if (b) for (const rel of b.liste('liker/')) { if (!rel.endsWith('.json')) continue;
    const e = b.eintrag(rel);
    aus.push({ lesen: () => { try { return JSON.parse(b.lesen(rel).toString('utf8')); } catch (x) { return null; } },
               stand: () => e.m || 0 }); } }
  return aus;
}
function cursorZeit(c) { try { return JSON.parse(Buffer.from(String(c), 'base64').toString('utf8')).updated_at || null; } catch (e) { return null; } }
function likerAblegen(liker, gesehen) {
  fs.mkdirSync(LIKER, { recursive: true });
  const strom = fs.createWriteStream(LIKER_VERLAUF, { flags: 'a' });
  let titel = 0, dazu = 0, weg = 0;
  for (const [id, l] of Object.entries(liker)) {
    if (!/^[0-9a-f-]{36}$/.test(id) || !l || !Array.isArray(l.seiten) || !l.seiten.length) continue;
    const alt = likerLesen(id);
    const personen = []; let anzahlSuno = null;
    l.seiten.forEach((s, si) => {
      const ab = cursorZeit(s.next_cursor), bis = cursorZeit(s.cursor);
      if (s.num_total_likes != null) anzahlSuno = s.num_total_likes;
      const liste = Array.isArray(s.likers) ? s.likers : [];
      liste.forEach((p, pi) => {
        if (!p || !p.handle || personen.some(x => x.handle === p.handle)) return;
        const letzter = pi === liste.length - 1 && !!s.next_cursor;
        personen.push({ handle: p.handle, name: p.display_name || p.handle, avatar: p.avatar_image_url || null,
                        uid: p.external_user_id || null, folgtMir: !!p.is_following_viewer, folgeIch: !!p.is_following,
                        verifiziert: !!p.is_verified, am: letzter ? ab : null, zeitAb: ab, zeitBis: bis, seite: si + 1 });
      });
    });
    const neu = { song: id, abgerufenAm: gesehen, anzahlKatalog: l.anzahl || null, anzahlSuno, likers: personen };
    if (alt && Array.isArray(alt.likers)) {
      const altMap = new Map(alt.likers.map(p => [p.handle, p]));
      for (const p of neu.likers) {
        const a = altMap.get(p.handle);
        if (a) { if (!p.am && a.am) p.am = a.am; if (a.zwischen) p.zwischen = a.zwischen; }
        else { p.zwischen = [alt.abgerufenAm, gesehen]; dazu++;
               strom.write(JSON.stringify({ art: 'dazu', song: id, handle: p.handle, name: p.name, zwischen: p.zwischen }) + '\n'); }
      }
      const neuMenge = new Set(neu.likers.map(p => p.handle));
      for (const a of alt.likers) if (!neuMenge.has(a.handle)) { weg++;
        strom.write(JSON.stringify({ art: 'weg', song: id, handle: a.handle, name: a.name, zwischen: [alt.abgerufenAm, gesehen] }) + '\n'); }
    } else strom.write(JSON.stringify({ art: 'stand', song: id, anzahl: personen.length, abgerufenAm: gesehen }) + '\n');
    fs.writeFileSync(path.join(LIKER, id + '.json'), JSON.stringify(neu));
    titel++;
  }
  strom.end();
  return { titel, dazu, weg };
}
/* Was der Server hat: Song -> Sunos Herzzahl beim letzten Stand. Das
   Lesezeichen fragt Suno nur, wo upvote_count davon abweicht. */
function likerStand() {
  const s = {};
  for (const l of likerAlle()) { const d = l.lesen();
    if (d && d.song) s[d.song] = d.anzahlSuno != null ? d.anzahlSuno : (d.likers || []).length; }
  return s;
}
/* Der Stand eines Titels fuer die Anzeige, mit den Zeiten aus den
   Benachrichtigungen. Einzelne Zeile: exakte Zeit. Buendel: Suno nennt
   nur bis zu drei der Personen, aber die Zeit des Buendels gilt fuer
   alle darin (sie ist das juengste Herz, die anderen kamen kurz davor).
   Wer die Ungenannten sind, sagt die Liste selbst: sie ist nach Herz-
   Zeit sortiert, ein Buendel ist darin ein zusammenhaengender Block -
   die Ungenannten sind die Nachbarn der Genannten ohne eigene Zeit
   (Caspar_D, 09.09.2026: "alle im Buendel liefern den Zeitpunkt des
   Buendels mit"). Quelle 'buendel' heisst: bis zu dieser Zeit. */
function likerMitZeiten(id, herzZeilen) {
  const d = likerLesen(id); if (!d) return null;
  const zeit = new Map(), buendel = [];
  for (const e of herzZeilen) {
    if (!e.am) continue;
    const von = e.von || [], anzahl = Math.max(e.anzahl || 1, von.length);
    if (anzahl === 1 && von.length === 1) { const h = von[0]; if (!zeit.has(h) || e.am > zeit.get(h)) zeit.set(h, e.am); }
    else if (anzahl > 1) buendel.push({ am: e.am, von, anzahl });
  }
  const bsF = beobachterLesen(), folgen = new Set(bsF ? bsF.follower.map(p => p.handle) : []);
  const likers = (d.likers || []).map(p => ({ ...(zeit.has(p.handle) ? { ...p, am: zeit.get(p.handle), quelle: 'benachrichtigung' } : { ...p }),
                                              folgtMir: folgen.has(p.handle) }));
  const frei = p => !p.am && !p.zeitAb && !p.zeitBis;
  for (const b of buendel.sort((x, y) => (y.am || '').localeCompare(x.am || ''))) {
    const pos = []; likers.forEach((p, i) => { if (b.von.includes(p.handle)) pos.push(i); });
    for (const i of pos) if (!likers[i].am || likers[i].quelle === 'buendel') { likers[i].am = b.am; likers[i].quelle = 'buendel'; }
    if (!pos.length) continue;
    let lo = Math.min(...pos), hi = Math.max(...pos), rest = b.anzahl - pos.length;
    /* Ungenannte dazwischen zuerst, dann nach aussen - nur wer noch keine Zeit hat */
    for (let i = lo + 1; i < hi && rest > 0; i++) if (frei(likers[i])) { likers[i].am = b.am; likers[i].quelle = 'buendel'; rest--; }
    while (rest > 0) {
      if (lo > 0 && frei(likers[lo - 1])) { lo--; likers[lo].am = b.am; likers[lo].quelle = 'buendel'; rest--; }
      else if (hi < likers.length - 1 && frei(likers[hi + 1])) { hi++; likers[hi].am = b.am; likers[hi].quelle = 'buendel'; rest--; }
      else break;
    }
  }
  return { abgerufenAm: d.abgerufenAm, anzahlSuno: d.anzahlSuno, likers };
}

/* BEOBACHTER - wer folgt, wem wird gefolgt, vollstaendig (Lesezeichen
   2f, Web-Wege followers/following). Ablage library/beobachter.json =
   der juengste Stand beider Richtungen; Aenderungen (dazu/weg je
   Richtung) in library/beobachter-verlauf.ndjson mit dem Fenster
   zwischen zwei Laeufen. "weg" wird nur gewertet, wenn die Ernte
   vollstaendig war - eine abgebrochene Liste ist kein Beweis fuer einen
   Weggang (dieselbe Vorsicht wie bei den Alben). */
const BEOBACHTER = path.join(WURZEL, 'library', 'beobachter.json');
const BEOBACHTER_VERLAUF = path.join(WURZEL, 'library', 'beobachter-verlauf.ndjson');
function beobachterLesen() { try { return JSON.parse(fs.readFileSync(BEOBACHTER, 'utf8')); } catch (e) { return null; } }
function beobachterAblegen(b, gesehen) {
  const norm = p => ({ handle: p.handle, name: p.display_name || p.handle, avatar: p.avatar_image_url || null,
                       uid: p.external_user_id || null, folgeIch: !!p.is_following, folgtMir: !!p.is_following_viewer, verifiziert: !!p.is_verified });
  const neu = { abgerufenAm: gesehen, vollstaendig: !!b.vollstaendig, lautSuno: b.lautSuno || {},
                follower: (b.follower || []).filter(p => p && p.handle).map(norm),
                following: (b.following || []).filter(p => p && p.handle).map(norm) };
  const alt = beobachterLesen();
  const strom = fs.createWriteStream(BEOBACHTER_VERLAUF, { flags: 'a' });
  const zaehl = { dazu: 0, weg: 0 };
  for (const richtung of ['follower', 'following']) {
    const altListe = alt && Array.isArray(alt[richtung]) ? alt[richtung] : null;
    if (!altListe) { strom.write(JSON.stringify({ art: 'stand', richtung, anzahl: neu[richtung].length, abgerufenAm: gesehen }) + '\n'); continue; }
    const altMenge = new Set(altListe.map(p => p.handle)), neuMenge = new Set(neu[richtung].map(p => p.handle));
    for (const p of neu[richtung]) if (!altMenge.has(p.handle)) { zaehl.dazu++; p.seit = [alt.abgerufenAm, gesehen];
      strom.write(JSON.stringify({ art: 'dazu', richtung, handle: p.handle, name: p.name, zwischen: [alt.abgerufenAm, gesehen] }) + '\n'); }
    else { const a = altListe.find(x => x.handle === p.handle); if (a && a.seit) p.seit = a.seit; }
    if (neu.vollstaendig) for (const a of altListe) if (!neuMenge.has(a.handle)) { zaehl.weg++;
      strom.write(JSON.stringify({ art: 'weg', richtung, handle: a.handle, name: a.name, zwischen: [alt.abgerufenAm, gesehen] }) + '\n'); }
  }
  strom.end();
  if (!neu.vollstaendig && alt) {
    /* Unvollstaendig: den alten Stand nicht durch einen kleineren ersetzen - nur Neue dazunehmen. */
    for (const richtung of ['follower', 'following']) {
      const neuMenge = new Set(neu[richtung].map(p => p.handle));
      for (const a of alt[richtung] || []) if (!neuMenge.has(a.handle)) neu[richtung].push(a);
    }
  }
  fs.writeFileSync(BEOBACHTER, JSON.stringify(neu));
  return { follower: neu.follower.length, following: neu.following.length, ...zaehl, vollstaendig: neu.vollstaendig };
}

/* Eine Benachrichtigung in die Zeilenform bringen.
   v2 (Web): user_profiles (hoechstens drei), total_users, content_id,
   content_title, content_message.
   v3 (App, docs/SUNO-APP-WEGE.md): fertige Zeile - avatars[], text[] als
   Segmente {text, bold, action}, action fuer das Ziel. Das Handle steht
   sicher in action.url als suno://suno.com/@handle, der Titel in
   suno://suno.com/song/<id>. Der Anzeigename ist das fette Segment MIT
   Aktion, der Titel das fette Segment OHNE. Der Satz dazwischen ist in
   der Sprache des Kontos ("Mir hat dein Lied gefallen") - an ihm haengt
   nichts; nur der Kommentar-Anfang hinter dem Doppelpunkt wird gebraucht,
   damit /api/kommentare ein Kommentar-Herz seinem Kommentar zuordnen kann
   (wie content_message bei v2). Nennt der Satz "+ N andere", zaehlen
   die mit: v3 nennt bis zu drei Personen, bei mehr steht die Zahl im
   fetten Segment ("Black Frequency + 7 andere", 09.09.2026). */
function benachrichtigungNormieren(n, gesehen) {
  const istV3 = Array.isArray(n.text) || Array.isArray(n.avatars);
  if (!istV3) {
    const von = (n.user_profiles || []).map(p => p.handle).filter(Boolean);
    /* content_ancillary_id: bei comment_like, comment_reply, clip_comment die
       ID des Kommentars (Mitschnitt iPhone 09.09.2026) - damit ordnet
       /api/kommentare ein Kommentar-Herz seinem Kommentar sicher zu, statt
       ueber die ersten 18 Zeichen des Textes. */
    return { art: n.notification_type || 'unbekannt', gesehen, sunoId: n.id, am: n.updated_at,
             song: n.content_id || null, songTitel: n.content_title || '', von,
             namen: (n.user_profiles || []).map(p => p.display_name).filter(Boolean),
             anzahl: n.total_users || von.length || 1, text: n.content_message || '', gelesen: !!n.is_read,
             kommentarId: n.content_ancillary_id || undefined };
  }
  const handleAus = a => { const m = a && typeof a.url === 'string' && a.url.match(/suno:\/\/suno\.com\/@([^/?#]+)/); return m ? m[1] : null; };
  const von = [], namen = [];
  for (const t of n.text || []) { const h = handleAus(t.action); if (h && !von.includes(h)) { von.push(h); namen.push(t.text || h); } }
  for (const a of n.avatars || []) { const h = handleAus(a.action); if (h && !von.includes(h)) { von.push(h); namen.push(h); } }
  const segmente = n.text || [];
  const titel = segmente.filter(t => t.bold && !t.action).map(t => t.text).pop() || '';
  const rest  = segmente.filter(t => !t.bold).map(t => t.text || '').join('');
  /* v3 kuerzt grosse Buendel wie v2: drei Avatare, und im fetten
     Segment "Black Frequency + 7 andere" (gemessen 09.09.2026, 8er-Buendel
     von "Glut und Eis"). Die Zahl steckt im FETTEN Segment, deshalb ueber
     alle Segmente suchen; Woerter je Kontosprache. */
  const satz = segmente.map(t => t.text || '').join('');
  const weitere = satz.match(/\+?\s*(\d+)\s+(andere|anderen|weitere|others|other|autres|otros|altri|outros)/i);
  const dp = rest.indexOf(':');
  const zielUrl = n.action && typeof n.action.url === 'string' ? n.action.url : '';
  const songM = zielUrl.match(/suno:\/\/suno\.com\/song\/([0-9a-f-]{36})/);
  const kommM = zielUrl.match(/[?&]comment_id=([0-9a-f-]{36})/);       /* v3: Kommentar-ID in der Ziel-URL */
  /* Die Zahl: v3 nennt im Text EINE Person "+ 7 andere" (= 8), zeigt aber
     drei Avatare - die drei stecken in den acht. Also: genannte Personen
     im Text plus "andere", mindestens aber so viele, wie Handles da sind.
     Falsch war von.length + 7 = 10 (Lauf 09.09.2026 01:18, 14 Zeilen
     nachgetragen und danach berichtigt). */
  const genannt = segmente.filter(t => t.bold && t.action).length;
  const zeile = { art: n.notification_type || 'unbekannt', gesehen, sunoId: n.id, am: n.updated_at,
                  song: songM ? songM[1] : null, songTitel: titel, von, namen,
                  anzahl: Math.max(von.length, genannt + (weitere ? +weitere[1] : 0)),
                  text: dp >= 0 ? rest.slice(dp + 1).trim() : '', gelesen: !!n.is_read, quelle: 'v3',
                  kommentarId: kommM ? kommM[1] : undefined };
  if (!songM && zielUrl) zeile.ziel = zielUrl.replace(/\?.*$/, '');
  return zeile;
}
function reaktionenAnhaengen(liste, gesehen) {
  const bekannt = new Map();
  for (const e of reaktionenLesen(true)) if (e.sunoId) bekannt.set(e.sunoId, e);
  let neu = 0, nachgetragen = 0;
  const strom = fs.createWriteStream(REAKTIONEN, { flags: 'a' });
  const menge = v => [...v].sort().join(',');
  for (const n of liste) {
    if (!n || !n.id) continue;
    const zeile = benachrichtigungNormieren(n, gesehen);
    const alt   = bekannt.get(n.id);
    /* Gewachsen: mehr Personen, juengere Zeit oder andere Namen. Die
       Reihenfolge der Namen zaehlt nicht - sonst schriebe jeder Lauf,
       in dem Suno sie anders sortiert, eine Zeile. */
    const gewachsen = alt && (zeile.anzahl > (alt.anzahl || 0) || (zeile.am || '') > (alt.am || '')
                              || menge(zeile.von) !== menge(alt.von || []));
    if (alt && !gewachsen) continue;
    if (alt) { zeile.nachtrag = true; zeile.vorher = alt.anzahl || 0; nachgetragen++; } else neu++;
    bekannt.set(n.id, zeile);
    strom.write(JSON.stringify(zeile) + '\n');
  }
  strom.end();
  return { neu, nachgetragen };
}

/* Die Abschnitte fuer das Fenster. Solange nie ein Lauf gestartet
   wurde, alle Schritte des Katalogs als 'wartet' - das Fenster zeigt
   dann, was der Morgen tun WUERDE. Laeuft oder lief etwas, der Stand
   dieses Laufs. Wartende Schritte tragen die Schaetzung aus der
   Lernkurve; fertige ihre gemessene Dauer. */
function morgenAbschnitte() {
  const d = dauernLesen();
  if (!morgen.schritte.length) return MORGEN_SCHRITTE.map(s => {
    const a = morgenAbschnitt(s); a.geschaetztMs = dauerSchaetzen(d, s); return a; });
  return morgen.schritte;
}
function unverarbeitetZaehlen() {
  const ordner = path.join(WURZEL, 'library', 'roh');
  let katalogStand = 0;
  try { katalogStand = fs.statSync(K.KATALOG).mtimeMs; } catch (e) {}
  let dateien = [];
  try { dateien = fs.readdirSync(ordner).filter(f => /\.json$/.test(f) && !f.startsWith('._')); } catch (e) {}
  const arten = {}, stempel = new Set();
  let juengste = null, aelteste = null;
  for (const f of dateien) {
    const m = fs.statSync(path.join(ordner, f)).mtimeMs;
    if (m <= katalogStand) continue;
    const art = (f.match(/^([a-z]+)-/) || [,'sonst'])[1];
    arten[art] = (arten[art] || 0) + 1;
    /* Ein Datensatz = profil + privat + timing mit demselben Stempel
       (Caspar_D, 08.09.2026: "Zwei Datensaetze warteten" - nicht sechs
       Dateien). */
    stempel.add(f.replace(/^[a-z]+-/, '').replace(/\.json$/, ''));
    if (!juengste || m > juengste) juengste = m;
    if (!aelteste || m < aelteste) aelteste = m;
  }
  return { katalogStand, arten, anzahl: Object.values(arten).reduce((a,b)=>a+b,0),
           datensaetze: stempel.size, aelteste, juengste };
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
    art:     morgen.art,
    datensaetze: morgen.datensaetze,
    fortschritt: fortschritt(),
    schritte: morgenAbschnitte(),
    /* Beim Sammeln die ganze Ausgabe - sie IST der Vergleich, den der
       Knopf zeigen soll. Beim langen Lauf nur der Schwanz. */
    zeilen:  morgen.laeuft || morgen.folge === undefined
               ? morgen.zeilen.slice(-14) : morgen.zeilen.slice(-60),
  };
}

/* 'alle' ist der ganze Katalog, 'schritte' das, was davon laeuft:
   Abgewaehlte Schritte stehen im Fenster als 'abgewaehlt', damit alle
   Abschnitte sichtbar bleiben und niemand raetselt, wo Whisper hin ist. */
function morgenLosschicken(schritte, art, alle) {
  morgen.laeuft = true; morgen.schritt = -1; morgen.seit = Date.now();
  morgen.zeilen = []; morgen.fehler = null; morgen.folge = schritte; morgen.einheiten = [];
  morgen.art = art || 'lauf'; morgen.datensaetze = null;
  const d = dauernLesen();
  const laufend = new Set(schritte);
  morgen.schritte = (alle || schritte).map(s => {
    const a = morgenAbschnitt(s, laufend.has(s) ? 'wartet' : 'abgewaehlt');
    a.geschaetztMs = dauerSchaetzen(d, s, s.einheiten ? s.einheiten() : undefined);
    return a;
  });
  const abschnittVon = (s) => morgen.schritte.find(a => a.id === s.id);

  const weiter = (i) => {
    if (i >= schritte.length) {
      morgen.laeuft = false; morgen.schritt = -1;
      morgen.zeilen.push('— durch —');
      return;
    }
    morgen.schritt = i;
    morgen.schrittSeit = Date.now();
    const s = schritte[i];
    const ab = abschnittVon(s);
    morgen.einheiten = morgen.einheiten || [];
    morgen.einheiten[i] = s.einheiten ? s.einheiten() : undefined;
    ab.status = 'laeuft'; ab.seit = morgen.schrittSeit;
    ab.geschaetztMs = dauerSchaetzen(d, s, morgen.einheiten[i]);
    /* Ein Schritt ist fertig oder uebersprungen: Zustand, Dauer, Kurz-
       ergebnis in den Abschnitt; die Zeile danach ins alte Protokoll. */
    const abschliessen = (status, code, kurz) => {
      ab.status = status; ab.code = code;
      ab.dauerMs = Date.now() - morgen.schrittSeit;
      if (kurz) ab.kurz = kurz;
    };
    morgen.zeilen.push(`▸ ${s.name}`);
    /* Laeuft dasselbe Werkzeug schon von Hand (z. B. whisper.js --alle
       im Terminal), kein zweites daneben starten - der Mac hat nur
       einen Prozessor, und zwei Whisper schreiben dieselben Dateien. */
    if (s.befehl[0] === 'bin/whisper.js') {
      try {
        const ps = require('node:child_process').execSync('pgrep -f "[b]in/whisper.js"', { encoding: 'utf8' }).trim();
        if (ps) {
          const h = 'Whisper läuft bereits (von Hand gestartet) — übersprungen, der nächste Morgen holt es nach.';
          morgen.zeilen.push('  ' + h); ab.zeilen.push(h);
          abschliessen('fertig', null, h);
          return weiter(i + 1);
        }
      } catch (e) { /* pgrep ohne Treffer = Exit 1 = frei */ }
    }
    /* Dasselbe fuer die Nachbarschaft, nur billiger zu pruefen: Wer den
       Knopf im Panel gedrueckt hat, laeuft als abgekoppeltes Kind und
       steht in global.communityLauf. Zwei Laeufe nebeneinander wuerden
       denselben fremden Server gleichzeitig fragen - genau das, was die
       Regel "eine Anfrage zur Zeit" verbietet. */
    if (s.befehl[0].startsWith('bin/community-') && global.communityLauf) {
      const h = 'Die Nachbarschaft wird gerade aus dem Panel geholt — übersprungen.';
      morgen.zeilen.push('  ' + h); ab.zeilen.push(h);
      abschliessen('fertig', null, h);
      return weiter(i + 1);
    }
    /* caffeinate gibt es nur auf dem Mac; auf Linux laeuft der Schritt
       direkt (Tarjas Maschine, 21.08.2026). */
    const kind = s.kaffee && process.platform === 'darwin'
      ? require('node:child_process').spawn('caffeinate', ['-i', process.execPath, ...s.befehl], { cwd: WURZEL })
      : require('node:child_process').spawn(process.execPath, s.befehl, { cwd: WURZEL });
    /* Zeilen in den Abschnitt (je Schritt gekappt) UND ins flache
       Protokoll (fuer /api/morgen/stand.zeilen, wie bisher). Das
       Kurzergebnis ist die letzte nichtleere stdout-Zeile - stderr
       nicht, dort stehen Warnungen, nicht das Ergebnis. */
    const sammeln = (istStdout) => (d) => {
      for (const z of String(d).split('\n')) if (z.trim()) {
        morgen.zeilen.push(z.trimEnd());
        ab.zeilen.push(z.trimEnd());
        if (istStdout) ab.kurz = z.trim();
      }
      if (morgen.zeilen.length > 400) morgen.zeilen = morgen.zeilen.slice(-200);
      if (ab.zeilen.length > 400) ab.zeilen = ab.zeilen.slice(-400);
    };
    kind.stdout.on('data', sammeln(true));
    kind.stderr.on('data', sammeln(false));
    kind.on('close', (c) => {
      dauerMerken(s.id, Date.now() - morgen.schrittSeit, morgen.einheiten[i]);
      if (c !== 0) {
        abschliessen('fehler', c, ab.kurz || `Abbruch mit Code ${c}`);
        /* Pflicht bricht den Lauf ab wie bisher; alles andere wird rot
           und der Morgen geht weiter (Caspar_D, 08.09.2026). */
        if (s.pflicht) {
          morgen.fehler = `${s.name} brach ab (${c})`;
          morgen.laeuft = false; morgen.schritt = -1;
          return;
        }
        return weiter(i + 1);
      }
      abschliessen('fertig', 0, s.id === 'gesundheit' ? gesundheitKurz() || ab.kurz : ab.kurz);
      weiter(i + 1);
    });
  };
  weiter(0);
}

/* Das Kurzergebnis des Verbindungsschritts: die Liste je Adresse mit
   Haken oder Kreuz, wie das kurzergebnis_muster in MORGENSCHRITTE.json
   sie beschreibt. bin/gesundheit.js gibt seine Zeilen mit den
   technischen Namen aus (Profil-API, Bild-CDN); hier kommen die Worte
   des Fensters aus library/gesundheit.json, das der Schritt gerade
   geschrieben hat. Audio ist Beobachtung, kein Befund (gesperrt seit
   dem 03.09.2026). null, wenn die Datei fehlt - dann bleibt die letzte
   stdout-Zeile. */
function gesundheitKurz() {
  let g;
  try { g = JSON.parse(fs.readFileSync(path.join(WURZEL, 'library', 'gesundheit.json'), 'utf8')); } catch (e) { return null; }
  const b = g && g.befunde; if (!b) return null;
  const WORTE = {
    'Suno-Seite (Ernte)':        'Suno-Seite',
    'Profil-API (Nachbarschaft)': 'dein Autorenprofil',
    'Kommentar-API (Reaktionen)': 'Kommentare zu einem Titel',
    'Bild-CDN (Medien)':         'Speicher für Titelbilder',
    'Video-CDN (Medien)':        'Speicher für Bewegtbilder',
  };
  const klartext = (c) => c === 200 ? 'antwortet' : c === 206 ? 'antwortet' : c === 403 ? 'gesperrt (403)'
    : c === 404 ? 'nicht gefunden (404)' : c === 429 ? 'Suno bremst (429)' : c === 0 || c === undefined ? 'keine Antwort'
    : `antwortet mit ${c}`;
  const zeilen = []; let gut = 0, gesamt = 0;
  for (const [k, wort] of Object.entries(WORTE)) {
    if (b[k] === undefined) continue;
    gesamt++;
    const ok = b[k] === 200 || b[k] === 206;
    if (ok) gut++;
    zeilen.push(ok ? `✓ ${wort}` : `✗ ${wort} — ${klartext(b[k])}`);
  }
  /* Die Audio-Adresse ist seit 03.09.2026 gesperrt (403) - das ist
     bekannt und steht in docs/BACKLOG.md; jeden Morgen daran zu erinnern
     hilft niemandem (Caspar_D, 08.09.2026: "das muss nicht mehr explizit
     erwaehnt werden"). Gemeldet wird nur die Nachricht: wenn sie wieder
     antwortet. */
  if (b['Audio-CDN (außer Betrieb)'] !== undefined) {
    const c = b['Audio-CDN (außer Betrieb)'];
    if (c === 200 || c === 206) zeilen.push('✓ Audio-Adresse — antwortet wieder');
  }
  if (!zeilen.length) return null;
  zeilen.push(`${gut} von ${gesamt} Adressen antworten wie erwartet`);
  return zeilen.join('\n');
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
  /* Eingefroren (Caspar_D, 09.09.2026): das Archiv auf dem Stick ist
     eine Kopie, nichts darf dort holen oder speichern. Eine Sperre fuer
     alle Wege statt einer Ausnahme je Route - so kann keine spaeter
     hinzugekommene Route die Regel vergessen. */
  if (EINGEFROREN && req.method !== 'GET' && req.method !== 'HEAD')
    return jsonAntwort(res, { fehler: 'Archiv eingefroren' }, 405);

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
    if (!k.handle && vorschlag && !EINGEFROREN) {
      fs.writeFileSync(KONFIG, JSON.stringify({ ...k, handle: vorschlag, seit: new Date().toISOString(), herkunft: 'katalog' }, null, 1));
      return jsonAntwort(res, { handle: vorschlag, vorschlag, seit: null });
    }
    return jsonAntwort(res, { handle: k.handle || null, vorschlag, seit: k.seit || null, exportZiel: k.exportZiel || null });
  }
  /* Das Exportziel (Caspar_D, 09.09.2026): der Ordner auf dem Stick, in
     den bin/export.js kopiert. Eigener Weg (POST) neben dem PUT fuer
     den Handle, damit die Handle-Pruefung nicht angefasst wird; alle
     anderen Felder bleiben stehen. Leer = Ziel vergessen. */
  if (p === '/api/konfig' && req.method === 'POST') {
    let roh = ''; req.on('data', c => { roh += c; if (roh.length > 4096) req.destroy(); });
    return req.on('end', () => {
      try {
        const d = JSON.parse(roh);
        if (!('exportZiel' in d)) return jsonAntwort(res, { fehler: 'exportZiel fehlt' }, 400);
        const ziel = String(d.exportZiel || '').trim();
        if (ziel && !path.isAbsolute(ziel)) return jsonAntwort(res, { fehler: 'exportZiel muss ein absoluter Pfad sein' }, 400);
        const alt = konfigLesen();
        if (ziel) alt.exportZiel = ziel; else delete alt.exportZiel;
        fs.writeFileSync(KONFIG, JSON.stringify(alt, null, 1));
        jsonAntwort(res, { ok: true, exportZiel: ziel || null });
      } catch (e) { jsonAntwort(res, { fehler: e.message }, 400); }
    });
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
  /* ---- EFFEKTCLIP: Video auf die genaue Bildzahl schneiden ------------------------------------
     Der Browser nimmt den Clip selbst auf, verliert dabei aber am Ende ein bis zwei Bilder - der
     Kodierer ist damit noch nicht fertig, wenn die Aufnahme endet. Fuer einen nahtlosen Loop muss
     genau [0, L) drinstehen: das Bild bei L ist dasselbe wie das erste und faellt weg (Caspar_D,
     10.09.2026: "aber es muss doch das letzte bild fehlen, damit das erste = das letzte ist").
     Darum schneidet ffmpeg hier auf `bilder` Bilder bei fester Bildrate. Der Koerper ist das
     aufgenommene MP4, die Antwort das geschnittene. Nichts wird abgelegt. */
  if (p === '/api/effektclip-schnitt' && req.method === 'POST') {
    const bilder = Math.max(2, Math.min(3000, parseInt(u.searchParams.get('bilder'), 10) || 0));
    const rate = Math.max(1, Math.min(120, parseInt(u.searchParams.get('rate'), 10) || 30));
    if (!bilder) { jsonAntwort(res, { fehler: 'bilder fehlt' }, 400); return; }
    const stuecke = []; let gross = 0;
    req.on('data', c => { gross += c.length; if (gross > 256*1024*1024) { req.destroy(); return; } stuecke.push(c); });
    return req.on('end', () => {
      const fsx = require('node:fs'), pfad = require('node:path'), os = require('node:os');
      const ordner = fsx.mkdtempSync(pfad.join(os.tmpdir(), 'effektclip-'));
      const ein = pfad.join(ordner, 'roh.mp4'), aus = pfad.join(ordner, 'clip.mp4');
      try {
        fsx.writeFileSync(ein, Buffer.concat(stuecke));
        require('node:child_process').execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', ein,
          /* Geschnitten wird nach ZEIT, nicht nach Bildnummer, und ohne Neuabtasten. Die Aufnahme
             verliert unterwegs gelegentlich ein Bild; nach Bildnummer geschnitten laege die Naht dann
             daneben. Die Zeitstempel der Aufnahme stimmen aber, weil jedes Bild zu seiner Sollzeit
             abgeschickt wurde - nach Zeit geschnitten steht also genau [0, L) in der Datei. */
          '-t', ((bilder - 0.5) / rate).toFixed(4), '-fps_mode', 'passthrough', '-an',   /* ein halbes Bild vor der Naht: das Bild bei L gehoert schon zum naechsten Durchlauf */
          '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart', aus], { timeout: 120000 });
        const daten = fsx.readFileSync(aus);
        /* Ausgabebuch: was wir erzeugt haben, damit der Medienlauf es spaeter wiedererkennt, wenn es
           von Suno zurueckkaeme. Was wir jederzeit neu malen koennen, wandert nicht ins Archiv
           (Caspar_D, 11.09.2026). Ohne Titel-Kennung wird nichts gebucht - dann kann auch nichts
           faelschlich unterdrueckt werden. */
        const id = String(u.searchParams.get('id') || '').trim();
        if (id) {
          const buch = pfad.join(WURZEL, 'library', 'effektclips.json');
          let b = {}; try { b = JSON.parse(fsx.readFileSync(buch, 'utf8')) || {}; } catch (e) {}
          if (!Array.isArray(b[id])) b[id] = [];
          b[id] = b[id].filter(x => Math.abs((x.sekunden || 0) - bilder / rate) > 0.001).slice(-9);
          b[id].push({ zeit: new Date().toISOString(), sekunden: +(bilder / rate).toFixed(4), bilder, bytes: daten.length });
          try { fsx.writeFileSync(buch, JSON.stringify(b, null, 1)); } catch (e) {}
        }
        res.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': daten.length, 'Cache-Control': 'no-store' });
        res.end(daten);
      } catch (e) {
        jsonAntwort(res, { fehler: 'ffmpeg: ' + String(e.message).slice(0, 200) }, 500);
      } finally { try { fsx.rmSync(ordner, { recursive: true, force: true }); } catch (e) {} }
    });
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
        /* WO DER HANDLE STEHT. Bis zum 08.09.2026 abends prüfte diese
           Zeile `daten.handle` - ein Feld, das morgens.js nie schreibt.
           Der Handle steht in daten.profil.handle. Die Bedingung war
           damit immer falsch, jede Ernte kam durch, und seit die
           Alben mitfahren, hätte eine Ernte aus einem fremden Konto
           die playlists-Datei geschrieben und aufbereiten.js alle
           eigenen Alben gelöscht - keine ihrer Ids stünde in der
           fremden Ernte. Zwei Namen werden gehalten: der Handle, für
           den die Ernte gesammelt wurde (profil.handle), und das
           Konto, das im Suno-Tab angemeldet war (angemeldetAls, aus
           /api/user/me - denn /api/playlist/me antwortet für DIESES
           Konto, egal welcher Handle in der Ernte steht). Weicht einer
           von beiden ab, wird nichts geschrieben. */
        const hErnte = daten.handle || (daten.profil && daten.profil.handle) || null;
        const hKonto = daten.angemeldetAls || null;
        const gleich = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
        /* WEM DIE SAMMLUNG GEHÖRT: konfig.json, sonst der Katalog. Bis
           zum 08.09.2026 abends hing der Wächter allein an konf.handle -
           fehlte die Datei (frisch kopierter Bestand, exFAT-Reste,
           konfigLesen() gibt dann {} zurück), war er AUS, und jede Ernte
           kam durch. Der Katalog kennt den Handle genauso (/api/konfig
           schlägt ihn von dort vor); er ist der Rückfall. Fehlt beides,
           ist das der erste Tag eines leeren Systems. */
        const kat = katalogHolen();
        const sammlung = konf.handle || (kat && kat.profil && kat.profil.handle) || null;
        const fremd  = sammlung ? [hErnte, hKonto].find(h => h && !gleich(h, sammlung)) : null;
        if (fremd) {
          return jsonAntwort(res, { fehler: 'fremder-nutzer',
            meldung: `Diese Ernte stammt von @${fremd}, die Sammlung gehört @${sammlung}. Nicht eingewoben — im KlangTresor den Alias wechseln oder in Suno mit dem richtigen Konto anmelden.`,
            ernte: fremd, sammlung }, 409);
        }
        /* Ein reines Timing-Paket (songs leer) schreibt KEINE profil-Datei -
           die wuerde beim Neuaufbau als leere Songliste gelesen. */
        const nurTiming = daten.songs.length === 0 && daten.timing && Object.keys(daten.timing).length;
        const ordner = path.join(WURZEL, 'library', 'roh');
        fs.mkdirSync(ordner, { recursive: true });
        const stempel = new Date().toISOString().replace(/[:.]/g,'-').slice(0,23);   // mit ms, je Paket eindeutig
        const ziel = path.join(ordner, `profil-${stempel}.json`);
        if (!nurTiming) fs.writeFileSync(ziel, JSON.stringify(daten));

        /* ---- DAS DOWNLOAD-KONTINGENT ---------------------------------
           Seit dem 03.09.2026 deckelt Suno die Downloads. Das Lesezeichen
           bringt den Stand aus /api/billing/info/ mit, weil es den Token
           ohnehin hat - so braucht KlangTresor selbst nie einen. Hier
           wird er herausgeloest und eigens abgelegt, damit die Anzeige
           ihn findet, ohne die ganze Ernte lesen zu muessen.

           Der Verlauf steht daneben: erst daran sieht man, WANN etwas
           verbraucht wurde. Er wird bei 400 Eintraegen vorn beschnitten -
           das reicht fuer Jahre und haelt die Datei klein (exFAT: ein
           Megabyte je Block). */
        if (daten.kontingent && daten.kontingent.grenze != null) {
          const kPfad = path.join(WURZEL, 'library', 'kontingent.json');
          let k = { stand: null, verlauf: [] };
          try { k = JSON.parse(fs.readFileSync(kPfad, 'utf8')); } catch (e) {}
          if (!Array.isArray(k.verlauf)) k.verlauf = [];
          const neuStand = daten.kontingent;
          const letzter = k.verlauf[k.verlauf.length - 1];
          /* Nur eintragen, wenn sich etwas geaendert hat - sonst waechst
             der Verlauf bei jedem Lesezeichenklick um eine gleiche Zeile. */
          if (!letzter || letzter.verbraucht !== neuStand.verbraucht
              || letzter.lebenslang !== neuStand.lebenslang
              || letzter.grenze !== neuStand.grenze) {
            k.verlauf.push({ am: neuStand.gelesenAm, verbraucht: neuStand.verbraucht,
                             grenze: neuStand.grenze, lebenslang: neuStand.lebenslang });
            if (k.verlauf.length > 400) k.verlauf = k.verlauf.slice(-400);
          }
          k.stand = neuStand;
          try { fs.writeFileSync(kPfad, JSON.stringify(k, null, 1)); } catch (e) {}
        }

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
        /* ---- DIE ALBEN --------------------------------------------
           Eigene Rohdatenart playlists-<stempel>.json, nach demselben
           Muster wie die Privaten daneben - nur mit dem Umschlag, den
           bin/aufbereiten.js beim Lesen der playlists-Rohdatei erwartet
           ("const koepfe = ... pRoh.playlists", "const rohClips = ...
           pRoh.clips"): playlists (die Koepfe) und clips (je Album-id
           die Eintraege). Bis zum 08.09.2026 hat
           NIEMAND diese Datei geschrieben; die Alben fuhren in der Ernte
           mit, landeten in profil-<stempel>.json und wurden dort nie als
           Alben gelesen. Deshalb schrieb der Katalog seinen Albumbestand
           vom 17.08.2026 bei jedem Lauf unveraendert ab.

           NUR WENN BEIDES BRAUCHBAR IST. aufbereiten.js baut die Alben
           bei jedem Lauf NEU aus dieser Datei - findet es sie, wirft es
           den bisherigen Stand weg. Eine Datei ohne clips oder mit
           leerem clips waere damit ein Loeschbefehl fuer saemtliche
           Eintraege im Katalog. Lieber keine Datei als eine leere:
           fehlt eines von beidem, entsteht hier nichts, aufbereiten
           findet keine Rohdatei und laesst den Stand stehen. Die
           Antwort unten nennt die Zahlen, damit ein zweiter Ausfall
           nicht wieder aussieht wie Erfolg. */
        const alben       = daten.playlists;
        const albenKoepfe = (alben && Array.isArray(alben.playlists)) ? alben.playlists : [];
        const albenClips  = (alben && alben.clips && typeof alben.clips === 'object'
                             && !Array.isArray(alben.clips)) ? alben.clips : {};
        const albenEintraege = Object.values(albenClips)
          .reduce((n, l) => n + (Array.isArray(l) ? l.length : 0), 0);
        /* NUR MIT BESTÄTIGTEM KONTO. hErnte (profil.handle) stammt aus
           dem eigenen Katalog (/api/index) und ist damit nie fremd - der
           einzige Name, der sagt, WESSEN Alben /api/playlist/me geliefert
           hat, ist angemeldetAls aus /api/user/me. Fehlt er, hat der
           Wächter oben nichts geprüft; die Albumdaten könnten aus jedem
           Konto stammen. Ein Wächter muss bei Störung SCHLIESSEN, nicht
           öffnen: Ohne bestätigtes Konto entsteht keine playlists-Datei,
           denn aufbereiten.js hielte aus ihr die eigenen Alben für
           gelöscht. Dasselbe, wenn die Sammlung selbst keinen Handle hat
           (erster Tag): dann gibt es nichts, wogegen das Konto zu halten
           wäre. Die Songliste fährt trotzdem ein - sie ist ungefährlich,
           aufbereiten.js sortiert fremde Songs selbst aus. Warum keine
           Datei entstand, sagt die Antwort (albenGrund), damit das
           Lesezeichen es in die Zeile schreibt statt Erfolg zu zeigen.
           Bis zum 08.09.2026 abends wurde hKonto null einfach
           übersprungen - die Datei entstand dann ungeprüft. */
        const albenDa = albenKoepfe.length > 0 && albenEintraege > 0;
        const albenGrund = !albenDa ? null
          : !hKonto   ? 'Konto nicht bestätigt (die Ernte nennt kein angemeldetAls aus /api/user/me) — keine Albumdatei angelegt'
          : !sammlung ? 'die Sammlung hat noch keinen Handle (weder konfig.json noch Katalog) — keine Albumdatei angelegt'
          : null;
        let albumDatei = null;
        if (albenDa && !albenGrund) {
          albumDatei = `playlists-${stempel}.json`;
          fs.writeFileSync(path.join(ordner, albumDatei),
            JSON.stringify({ playlists: albenKoepfe, clips: albenClips,
                             /* Sagt aufbereiten.js, ob diese Ernte die ganze
                                Wahrheit ist: nur dann darf ein Album, das hier
                                fehlt, als in Suno geloescht gelten. Fehlt das
                                Feld (aeltere Ernte), gilt das Vorsichtige. */
                             vollstaendig: alben.vollstaendig === true,
                             /* Server-Uhr, nicht Browser-Uhr: an abgerufenAm misst
                                aufbereiten.js die 2 h der Kandidatenregel. Die
                                Uhr eines zweiten Rechners im Heimnetz darf sie
                                nicht verschieben (Gegenleser, 08.09.2026). */
                             abgerufenAm: new Date().toISOString(),
                             quelle: 'api/playlist/me + api/playlist/<id> — Alben mit Eintraegen, ueber das Lesezeichen' }));
        }
        /* Benachrichtigungen an reaktionen.ndjson anhaengen - dieselbe
           Datei wie die Kommentare, dasselbe Prinzip: eine Zeile je
           Ereignis, nie ueberschrieben, nur was neu ist. Erkannt an der
           Suno-ID des Eintrags. So waechst die Like-Historie ab heute,
           auch wenn Suno seinen Strom nach vier Wochen vergisst. */
        if (Array.isArray(daten.benachrichtigungen) && daten.benachrichtigungen.length) {
          const r = reaktionenAnhaengen(daten.benachrichtigungen, daten.erzeugtAm);
          morgen.zeilen.push(`Benachrichtigungen: ${r.neu} neu gesichert`
                             + (r.nachgetragen ? `, ${r.nachgetragen} Bündel gewachsen` : ''));
          /* Die Rohform des letzten Laufs aufheben - nicht in roh/ (das
             ist der Weg in den Katalog), sondern als Probe fuer die
             Endpunkt-Doku: was v3 bei grossen Buendeln wirklich liefert
             (docs/SUNO-APP-WEGE.md), sieht man nur an der Rohform. Eine
             Datei, jeder Lauf ueberschreibt sie. */
          try {
            const probe = path.join(WURZEL, 'library', 'suno-wege');
            fs.mkdirSync(probe, { recursive: true });
            fs.writeFileSync(path.join(probe, 'benachrichtigungen-letzter-lauf.json'),
                             JSON.stringify({ erzeugtAm: daten.erzeugtAm, anzahl: daten.benachrichtigungen.length,
                                              benachrichtigungen: daten.benachrichtigungen }));
          } catch (e) { console.log('Benachrichtigungen-Probe nicht geschrieben:', e.message); }
        }
        /* Beobachter: sofort ablegen. */
        if (daten.beobachter && typeof daten.beobachter === 'object'
            && ((daten.beobachter.follower || []).length || (daten.beobachter.following || []).length)) {
          const r = beobachterAblegen(daten.beobachter, daten.erzeugtAm);
          morgen.zeilen.push(`Beobachter: ${r.follower} folgen, ${r.following} gefolgt`
                             + (r.dazu || r.weg ? ` — ${r.dazu} dazu, ${r.weg} weg` : '') + (r.vollstaendig ? '' : ' (unvollständig)'));
        }
        /* Wer hat geherzt: sofort ablegen, wie die Benachrichtigungen. */
        if (daten.liker && typeof daten.liker === 'object' && Object.keys(daten.liker).length) {
          const r = likerAblegen(daten.liker, daten.erzeugtAm);
          morgen.zeilen.push(`Wer hat geherzt: ${r.titel} Titel` + (r.dazu || r.weg ? ` — ${r.dazu} dazu, ${r.weg} weg` : ''));
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
                           songs: daten.songs.length, neu: (morgen.neueIds||[]).length,
                           /* Ohne diese beiden Zahlen sieht eine Ernte ganz ohne
                              Alben genauso aus wie eine gelungene - siehe oben. */
                           alben: albumDatei ? albenKoepfe.length : 0,
                           albumEintraege: albumDatei ? albenEintraege : 0,
                           albumDatei, albenGrund });
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
      /* 'Datentransfer', nicht 'Ernte' - WOERTER.md, Caspar_D 08.09.2026.
         Die Uhrzeit steht im Namen, die Lernkurve lernt unter der ID. */
      morgenLosschicken([{ id: SAMMELN_ID.ernte, schluessel: 'sammeln',
                           name: `Lesezeichen-Datentransfer von ${wann} Uhr verwerten (kein neuer Suno-Abruf)`,
                           befehl: ['bin/sammeln.js', '--aus-roh'] }], 'sammeln');
    } else {
      morgen.quelle = { art: 'frisch', letzteErnte: ernte ? ernte.vom : null };
      morgenLosschicken([{ id: SAMMELN_ID.frisch, schluessel: 'sammeln',
                           name: 'Titelliste frisch von Suno holen (öffentliches Profil)',
                           befehl: ['bin/sammeln.js'] }], 'sammeln');
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
      /* Wie viele Datensaetze der Katalogbau gleich verarbeitet - das
         Fenster sagt es hinterher ("zwei warteten, beide beruecksichtigt");
         gezaehlt wird VOR dem Start, danach sind die Dateien weg. */
      const wartend = unverarbeitetZaehlen().datensaetze;
      morgenLosschicken(schritte, 'lauf', MORGEN_SCHRITTE);
      morgen.datensaetze = wartend;
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
  if (p === '/api/morgen/unverarbeitet') return jsonAntwort(res, unverarbeitetZaehlen());

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
  if (p === '/api/liker/stand') return jsonAntwort(res, likerStand());

  if (p.startsWith('/api/kommentare/')) {
    const id = p.slice('/api/kommentare/'.length);
    if (!/^[0-9a-f-]{36}$/.test(id)) { res.writeHead(400); return res.end(); }
    const kommentare = new Map(), antworten = new Map();
    const reaktionen = [], kommentarLikes = [];
    for (const e of reaktionenLesen()) {                             // Stromzeilen je Suno-ID im juengsten Stand
      if (e.song !== id) continue;
      if (e.art === 'kommentar') kommentare.set(e.id, e);          // juengster Stand gewinnt
      else if (e.art === 'antwort') antworten.set(e.id, e);
      else if (e.art === 'clip_like') reaktionen.push(e);
      else if (e.art === 'comment_like') kommentarLikes.push(e);
    }
    const liste = [...kommentare.values()].sort((a, b) => (b.am || '').localeCompare(a.am || ''));
    /* Wer hat einen Kommentar geliked? Der Strom nennt den Kommentar
       nicht per ID, sondern mit den ersten Zeichen seines Textes
       ('Wunderschoen geworden...'). Zugeordnet wird ueber diesen Anfang
       - bei eigenen Kommentaren UND Antworten, denn geliked wird beides. */
    const anfang = t => (t || '').replace(/\.\.\.$/, '').trim().slice(0, 18).toLowerCase();
    const alleTexte = [...kommentare.values(), ...antworten.values()];
    for (const kl of kommentarLikes) {
      /* Seit 09.09.2026 traegt die Zeile die Kommentar-ID (v2:
         content_ancillary_id, v3: comment_id in der Ziel-URL) - dann ist
         die Zuordnung sicher. Aeltere Zeilen: ueber den Textanfang. */
      let ziel = kl.kommentarId ? alleTexte.find(k => k.id === kl.kommentarId) : null;
      const a = anfang(kl.text);
      if (!ziel && !a) continue;
      if (!ziel) ziel = alleTexte.find(k => anfang(k.text).startsWith(a) || a.startsWith(anfang(k.text)));
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
      liker: likerMitZeiten(id, reaktionen.filter(e => e.art === 'clip_like')),
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
    const gesehenKomm = new Set(), herzJeSong = new Map();
    /* Eine Regel fuer alles: der eigene Handle zaehlt nirgends als
       Herz (Gegenleser 09.09.2026 - vorher nur bei den Listen gefiltert).
       Beobachter-Stand vorab, damit folgtMir aus der Beobachterliste
       kommt: der Liker-Weg liefert is_following_viewer immer false. */
    const eigenerHandle = String((k && k.profil && k.profil.handle) || (k && k.handle) || '').toLowerCase();
    const bs = beobachterLesen();
    const folgen = new Set(bs ? bs.follower.map(p => p.handle) : []);
    /* Ein Mensch herzt einen Titel EINMAL. Der Strom nennt dieselbe
       Person fuer denselben Titel aber zweimal, wenn Suno sie erst einzeln
       und spaeter im Buendel meldet (Gegenleser: 2 Faelle). Schluessel
       handle|song; die Einzelzeile (genaue Zeit) schlaegt das Buendel. */
    const bekanntesHerz = new Map();          // handle|song -> Herz-Eintrag
    {
      for (const e of reaktionenLesen()) {                           // Stromzeilen je Suno-ID im juengsten Stand
        if (e.art === 'kommentar' || e.art === 'antwort') {
          if (gesehenKomm.has(e.id)) continue;        // juengster Stand zaehlt einmal
          gesehenKomm.add(e.id);
          const l = wer(e.von, e.name, e.avatar);
          if (!l) continue;
          (e.art === 'kommentar' ? l.kommentare : l.antworten)
            .push({ song: e.song, songTitel: e.songTitel, am: e.am, text: e.text, likes: e.likes });
          if (e.am > l.zuletzt) l.zuletzt = e.am;
        } else if (e.art === 'clip_like') {
          if (e.song) { if (!herzJeSong.has(e.song)) herzJeSong.set(e.song, []); herzJeSong.get(e.song).push(e); }
          const einzeln = (e.von || []).length === 1 && (e.anzahl || 1) === 1;
          (e.von || []).forEach((h, i) => {
            if (!h || h.toLowerCase() === eigenerHandle) return;
            const key = h + '|' + e.song, alt = bekanntesHerz.get(key);
            if (alt) { if (einzeln && alt.quelle === 'buendel') { alt.am = e.am; alt.quelle = 'benachrichtigung'; } return; }
            const l = wer(h, (e.namen || [])[i]);
            if (!l) return;
            const herz = { song: e.song, songTitel: e.songTitel, am: e.am, quelle: einzeln ? 'benachrichtigung' : 'buendel' };
            l.likes.push(herz); bekanntesHerz.set(key, herz);
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
    /* DIE HERZEN AUS DEN LIKER-LISTEN (seit 09.09.2026, library/liker):
       vollstaendig ueber alle Zeiten und alle eigenen Titel - der Strom
       kennt nur vier Wochen und von jedem Buendel drei Namen. Der Strom
       bleibt fuer Kommentare, Antworten, Beobachter und fuer die Zeiten;
       ein Herz, das er schon kennt (Handle + Titel), wird nicht doppelt
       gezaehlt. Das eigene Herz zaehlt nicht mit. Die Zeit einer Zeile
       aus der Liste ist, wo Suno sie hergibt, die Herz-Zeit (Seitenende),
       sonst leer - der Strom liefert sie fuer die juengeren nach. */
    let ausListen = 0, likerStand = null;
    try {
      for (const l of likerAlle()) {
        let d = l.lesen();
        if (!d || !d.song) continue;
        /* Dieselben Zeiten wie im Song-Fenster: Strom (einzeln) und Buendel */
        const mz = likerMitZeiten(d.song, herzJeSong.get(d.song) || []);
        if (mz && mz.likers) d = { ...d, likers: mz.likers };
        const s = k && k.songs && k.songs[d.song];
        if (d.abgerufenAm && (!likerStand || d.abgerufenAm > likerStand)) likerStand = d.abgerufenAm;
        for (const p of d.likers || []) {
          if (!p.handle || p.handle.toLowerCase() === eigenerHandle) continue;
          if (bekanntesHerz.has(p.handle + '|' + d.song)) continue;
          const l = wer(p.handle, p.name, p.avatar); if (!l) continue;
          /* Zeit: exakt (Benachrichtigung, Seitenende), sonst das Fenster
             aus den Cursors der Suno-Seite - die Oberflaeche zaehlt ein
             Herz in einem Zeitraum, wenn sein Fenster ganz darin liegt. */
          const herz = { song: d.song, songTitel: (s && s.titel) || '', am: p.am || null, quelle: p.quelle || 'liste', liste: true,
                         zeitAb: p.zeitAb || null, zeitBis: p.zeitBis || null };
          l.likes.push(herz); bekanntesHerz.set(p.handle + '|' + d.song, herz);
          if (p.am && p.am > l.zuletzt) l.zuletzt = p.am;
          ausListen++;
        }
      }
    } catch (e) {}
    for (const l of leute.values()) l.folgtMir = folgen.has(l.handle);
    const liste = [...leute.values()].map(l => ({
      ...l, gewicht: l.kommentare.length * 3 + l.antworten.length + l.likes.length,
    })).sort((a, b) => b.gewicht - a.gewicht);
    /* Der vollstaendige Beobachterstand (Lesezeichen 2f), dazu die
       Antworten, die nur aus zwei Listen entstehen: wer folgt nicht
       zurueck, wer herzt ohne zu folgen, wer folgt und hat nie geherzt. */
    let beobachterStand = null;
    if (bs) {
      const gefolgt = new Set(bs.following.map(p => p.handle));
      const herzer = new Set([...leute.values()].filter(l => l.likes.length).map(l => l.handle));
      const neuSeit = bs.follower.filter(p => p.seit && p.seit[1] === bs.abgerufenAm);
      beobachterStand = { abgerufenAm: bs.abgerufenAm, vollstaendig: bs.vollstaendig,
        follower: bs.follower.length, following: bs.following.length,
        lautSuno: bs.lautSuno || {},
        neu: neuSeit.map(p => ({ handle: p.handle, name: p.name, seit: p.seit })),
        nichtZurueck: bs.following.filter(p => !folgen.has(p.handle)).map(p => ({ handle: p.handle, name: p.name })),
        herzenOhneFolgen: [...herzer].filter(h => !folgen.has(h)).length,
        folgenOhneHerz: bs.follower.filter(p => !herzer.has(p.handle)).length,
        followerListe: bs.follower.map(p => ({ handle: p.handle, name: p.name, folgeIch: p.folgeIch, seit: p.seit || null })) };
    }
    return jsonAntwort(res, { leute: liste, herzenAusListen: ausListen, likerStand, beobachterStand, follower:
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
    if (!echtOderBehaelter(ziel)) { res.writeHead(404); return res.end(); }
    return liefere(req, res, ziel);
  }

  // Katalog - nur die schlanken Felder fürs Raster
  /* DER DATENSTAND IN ZWEI ZAHLEN - fuer die Seite, die alle 60 s
     nachsieht, ob sich etwas geaendert hat (Caspar_D, 09.09.2026: "sorge
     dafuer, dass KlangTresor das immer schoen aktuell haelt"). katalog =
     Aenderungszeit von katalog.json.gz; gemeinschaft = das Juengste von
     allem, was das Profil ohne Katalogbau aendert: Strom, Liker-Listen,
     Beobachter, Nachbarschaftsprofile und -hirschfaktoren. Nur
     statSync, keine Datei wird gelesen. */
  if (p === '/api/stand') {
    const mt = f => { try { return Math.round(fs.statSync(f).mtimeMs); } catch (e) { return 0; } };
    let likerMax = 0;
    for (const l of likerAlle()) likerMax = Math.max(likerMax, Math.round(l.stand()));
    const gemeinschaft = Math.max(mt(REAKTIONEN), mt(BEOBACHTER), likerMax,
                                  mt(path.join(WURZEL, 'library', 'community-profile.json')),
                                  mt(path.join(WURZEL, 'library', 'community-hirsch.json')));
    return jsonAntwort(res, { katalog: mt(K.KATALOG), gemeinschaft, laeuft: !!(morgen && morgen.laeuft) });
  }

  if (p === '/api/index') {
    const k = katalogHolen();
    if (!k) { res.writeHead(503); return res.end('Kein Katalog'); }
    /* Der Kachelstempel reist im Katalogkopf mit: Die Oberflaeche haengt
       ihn an jede Kachel-Adresse, damit neu gerechnete Kacheln auch
       ankommen. Siehe bin/kacheln.js - dort wird er gesetzt. */
    let kachelStand = 0, titelbild = [];
    try {
      const ks = JSON.parse(fs.readFileSync(path.join(WURZEL, 'library', 'kachel-stand.json'), 'utf8'));
      kachelStand = ks.stand || 0;
      /* Titel mit beschnittenem Titelbild (bin/kacheln.js): die Buehne
         nimmt dann titelbild.jpg statt cover.jpg. */
      titelbild = Object.keys(ks.titelbild || {}).filter(id => ks.titelbild[id]);
    } catch (e) {}
    /* Eingefroren: wann der Stick gefuellt wurde, steht in
       library/export-stand.json (schreibt bin/export.js). Die Oberflaeche
       zeigt daraus "Archiv vom ..." und blendet alles Holende aus. */
    let eingefroren = null, liste = schlankeListe;
    if (EINGEFROREN) {
      eingefroren = { seit: null, dateien: null, bytes: null, teilkopie: false, stufe: null, handle: null, anzeigename: null };
      try {
        const es = JSON.parse(fs.readFileSync(path.join(WURZEL, 'library', 'export-stand.json'), 'utf8'));
        eingefroren = { seit: es.exportiertAm || null, dateien: es.dateien ?? null, bytes: es.bytes ?? null,
                        teilkopie: !!es.teilkopie, stufe: es.stufe || null, handle: es.handle || null, anzeigename: es.anzeigename || null };
      } catch (e) {}
      /* NUR, WAS DA IST (Caspar_D, 09.09.2026: "nicht vorhandene Titel nicht
         anzeigen"). Der Export schreibt in Stufen, neueste Titel zuerst -
         ein angehaltener Stick hat 187 von 324 MP3s, und die App soll
         nicht 137 tote Titel anbieten. Also je Titel: liegt audio.mp3 da?
         324 stat auf dem Stick, deshalb 30 s gemerkt. */
      const da = eingefrorenVorhanden();
      liste = schlankeListe.filter(s => da.has(s.id));
      eingefroren.titel = liste.length;
      eingefroren.titelKatalog = schlankeListe.length;
    }
    return jsonAntwort(res, {
      version:    paketVersion(),
      eingefroren,
      kachelStand,
      titelbild,
      erstelltAm: k.erstelltAm,
      anzahl:     liste.length,
      spielzeit:  k.spielzeit || null,
      zeitraum:   k.zeitraum  || null,
      profil:     k.profil    || null,
      songs:      liste,
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
  /* DIE BEREINIGTE LYRIK EINES SONGS (bin/lyrik.js, 07.09.2026).
     Sammeldatei wie bei den Notenzonen - 239 einzelne Dateien waeren auf
     exFAT 239 MB, die Datei selbst ist 1 MB. Songweise ausgeliefert,
     weil der Browser sonst alles laedt, um einen Text zu zeigen.

     Sunos Daten bleiben unberuehrt (Caspar_D: "nichts, was von suno
     kommt sollte veraendert werden") - `lyrics` und `worte` im Katalog
     ruehrt niemand an, das hier ist eine zweite Auskunft daneben.
     Songs, die das Verfahren zurueckgestellt hat, antworten mit null;
     die Lasche erscheint dann gar nicht erst. */
  if (p.startsWith('/api/lyrik/')) {
    const id = p.slice('/api/lyrik/'.length);
    if (!/^[0-9a-f-]{30,}$/i.test(id)) { res.writeHead(400); return res.end(); }
    const f = path.join(WURZEL, 'library', 'lyrik.json');
    if (!fs.existsSync(f)) return jsonAntwort(res, null);
    try {
      const stand = fs.statSync(f).mtimeMs;
      if (!lyrikSpeicher || lyrikSpeicher.stand !== stand) {
        const d = JSON.parse(fs.readFileSync(f, 'utf8'));
        lyrikSpeicher = { stand, daten: d.lieder || {}, verfahren: d.verfahren || '',
                          unsicher: new Map((d.unsicher || []).map(u => [u.id, u])) };
      }
      const e = lyrikSpeicher.daten[id];
      if (!e) {
        const u = lyrikSpeicher.unsicher.get(id);
        /* Warum nichts da ist, ist eine Auskunft wert - sonst sieht es
           aus, als haette niemand gerechnet. */
        return jsonAntwort(res, u ? { zurueckgestellt: true, grund: u.grund } : null);
      }
      return jsonAntwort(res, Object.assign({ verfahren: lyrikSpeicher.verfahren }, e));
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
      /* Und die Gegenrichtung: Laeuft die Morgenroutine und hat ihren
         Nachbarschaftsschritt noch vor sich, wuerde der Knopf einen
         zweiten Frager auf denselben Server schicken. */
      if (morgen.laeuft && (morgen.folge || []).some((s, i) =>
          i >= morgen.schritt && String(s.befehl && s.befehl[0]).startsWith('bin/community-')))
        return jsonAntwort(res, { ok: false, grund: 'Die Morgenroutine holt die Nachbarschaft gleich selbst.' });
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
  /* Zwei Fassungen (Caspar_D, 09.09.2026): {relativ:true} baut die fuer
     den Stick - Bild und Ton zeigen auf ../songs/<id>/..., ein Klick auf
     einen Stern spielt lokal statt suno.com zu oeffnen. Sie liegt als
     sternenhimmel-relativ.html daneben, damit die verschickbare Fassung
     nicht ueberschrieben wird. */
  if (p === '/api/himmel-export' && req.method === 'POST') {
    let roh = ''; req.on('data', c => { roh += c; if (roh.length > 4096) req.destroy(); });
    req.on('end', () => {
      let d = null; try { d = JSON.parse(roh); } catch (e) {}
      const relativ = !!(d && d.relativ);
      const name = relativ ? 'sternenhimmel-relativ.html' : 'sternenhimmel.html';
      const args = ['bin/himmel-export.js', '--ziel', path.join('library', 'export', name)];
      if (relativ) args.push('--relativ', '/media');
      const r = require('node:child_process').spawnSync(process.execPath, args, { cwd: WURZEL, encoding: 'utf8' });
      if (r.status !== 0) return jsonAntwort(res, { ok: false, meldung: (r.stderr || r.stdout || '').trim().slice(-300) }, 500);
      jsonAntwort(res, { ok: true, meldung: (r.stdout || '').trim(), url: '/export/' + name });
    });
    return;
  }
  if (p === '/export/sternenhimmel.html' || p === '/export/sternenhimmel-relativ.html') {
    const f = path.join(WURZEL, 'library', 'export', p.slice('/export/'.length));
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    return liefere(req, res, f);
  }

  /* ----------------------------------------------------------------
     Der Archiv-Export (Caspar_D, 09.09.2026): eine eingefrorene Kopie
     fuer den USB-Stick, gebaut von bin/export.js.

     POST /api/export/start  {stems, ziel?}   den Lauf anstossen
     GET  /api/export/stand                   wie weit ist es

     Muster wie /api/community/start: ein Kindprozess, losgeloest von
     der Seite, ein Lauf zur Zeit (global.exportLauf). Den Fortschritt
     schreibt das Skript selbst nach library/export-lauf.json - so
     stimmt er auch, wenn der Lauf von der Kommandozeile kam.
  ---------------------------------------------------------------- */
  /* Die Wurzel des Laufwerks zu einem Pfad: auf dem Mac /Volumes/<Name>,
   auf Linux /media/<user>/<Name> oder /mnt/<Name>, auf Windows der
   Buchstabe; sonst der Pfad selbst. */
function prozessLebt(pid) { try { process.kill(Number(pid), 0); return true; } catch (e) { return e && e.code === 'EPERM'; } }
function laufwerkWurzel(pfad) {
  const m = String(pfad).match(/^(\/Volumes\/[^/]+|\/media\/[^/]+\/[^/]+|\/media\/[^/]+|\/mnt\/[^/]+|\/run\/media\/[^/]+\/[^/]+|[A-Za-z]:\\?)/);
  return m ? m[1] : (String(pfad).startsWith('/') ? '/' : pfad);
}
function dfInfo(o) {
  try {
    const r = require('node:child_process').spawnSync('df', ['-k', o], { encoding: 'utf8' });
    const z = (r.stdout || '').trim().split('\n').pop().trim().split(/\s+/);
    return { gesamt: parseInt(z[1], 10) * 1024 || null, frei: parseInt(z[3], 10) * 1024 || null };
  } catch (e) { return { gesamt: null, frei: null }; }
}
function dateisystemVon(o) {
  try {
    const r = require('node:child_process').spawnSync('mount', [], { encoding: 'utf8' });
    const z = (r.stdout || '').split('\n').find(l => l.includes(' on ' + o + ' ('));
    return z ? ((z.match(/\(([a-z0-9_]+)/i) || [])[1] || '').toLowerCase() : '';
  } catch (e) { return ''; }
}
/* Was ein Dateisystem auf den drei Systemen kann - fuer den Stick, der
   "irgendwo reinstecken" soll (Caspar_D, 09.09.2026). */
function kompatibilitaet(fsys) {
  switch (fsys) {
    case 'exfat':  return { mac: true, windows: true, linux: true, grenze4GB: false, hinweis: 'exFAT: läuft auf Mac, Windows und Linux, keine Dateigrößengrenze — die richtige Wahl für den Stick.' };
    case 'msdos': case 'fat32': case 'vfat': return { mac: true, windows: true, linux: true, grenze4GB: true, hinweis: 'FAT32: läuft überall, aber keine Datei über 4 GB — reicht für MP3 und Bilder, nicht für Stems.' };
    case 'ntfs':   return { mac: 'nur lesen', windows: true, linux: true, grenze4GB: false, hinweis: 'NTFS: der Mac liest es, schreibt aber nicht — der Export kann von hier aus nicht laufen.' };
    case 'apfs':   return { mac: true, windows: false, linux: false, grenze4GB: false, hinweis: 'APFS: nur der Mac liest es — ein Windows-Rechner sieht den Stick gar nicht.' };
    case 'hfs': case 'hfs+': return { mac: true, windows: false, linux: 'nur lesen', grenze4GB: false, hinweis: 'HFS+: nur der Mac liest es richtig.' };
    case 'smbfs': case 'nfs': case 'afpfs': case 'webdav': return { mac: true, windows: true, linux: true, grenze4GB: false, hinweis: 'Netzfreigabe: das Archiv liegt dann im Netz, nicht auf einem Stick — starten kann es nur, wer die Freigabe eingehängt hat.' };
    default:       return { mac: null, windows: null, linux: null, grenze4GB: false, hinweis: fsys ? `Dateisystem ${fsys}: nicht eingeschätzt.` : 'Dateisystem unbekannt.' };
  }
}
function mediumInfo(ziel, letzter) {
  const wurzel = laufwerkWurzel(ziel);
  const fsys = dateisystemVon(wurzel);
  const g = dfInfo(wurzel);
  const belegt = (g.gesamt != null && g.frei != null) ? g.gesamt - g.frei : null;
  return { pfad: wurzel, name: wurzel === '/' ? 'Systemplatte' : (path.basename(wurzel) || wurzel), dateisystem: fsys, gesamt: g.gesamt, frei: g.frei, belegt,
           archivBytes: (letzter && letzter.bytes) || 0, kompatibel: kompatibilitaet(fsys) };
}
/* DAS ZIEL NACHMESSEN (Caspar_D, 09.09.2026: Balken 2 soll "schon drauf"
   und "kommt noch" trennen). Seit den Behaeltern liegt ein KlangTresor
   auf dem Stick in rund 550 Dateien, das laesst sich in Sekunden
   nachmessen: die Behaelter ueber ihr Verzeichnis (je Eintrag der Teil:
   MP3, Bilder, Analyse, Stems, Herzen-Listen), Programm/, node/, Kern und
   Sternenhimmel als "programm", Musik/ als "musik". Asynchron, damit die
   Musik nicht stockt, und 20 s gemerkt - waehrend eines Laufs fragt die
   Oberflaeche alle 2 s. Ergebnis: { bytes, teile: {mp3, bilder, analyse,
   programm, musik, stems}, behaelter: masse() | null, gemessenAm }. */
let _zielMerk = new Map();
function zielMessen(ziel) {
  const m = _zielMerk.get(ziel);
  if (m && Date.now() - m.zeit < 20000) return m.lauf;
  const lauf = zielMessenJetzt(ziel).catch(() => null);
  _zielMerk.set(ziel, { zeit: Date.now(), lauf });
  return lauf;
}
async function zielMessenJetzt(ziel) {
  const fsp = fs.promises;
  const teile = { mp3: 0, bilder: 0, analyse: 0, programm: 0, musik: 0, stems: 0 };
  let bytes = 0, behaelter = null;
  const summe = async (ordner, schluessel, ohne) => {
    let e = []; try { e = await fsp.readdir(ordner, { withFileTypes: true }); } catch (x) { return; }
    for (const d of e) {
      if (d.name.startsWith('.') || (ohne && ohne(d.name))) continue;
      const voll = path.join(ordner, d.name);
      if (d.isDirectory()) await summe(voll, schluessel, ohne);
      else if (d.isFile()) { let s = 0; try { s = (await fsp.stat(voll)).size; } catch (x) {} teile[schluessel] += s; bytes += s; }
    }
  };
  const PL = path.join(ziel, 'Programm', 'library');
  /* Die Behaelter ueber ihr Verzeichnis, nicht ueber die Stuecke. */
  try {
    if (Behaelter.gibtEs(PL)) {
      const b = Behaelter.oeffnen(PL, false);
      for (const rel of b.liste()) {
        const e = b.eintrag(rel); if (!e) continue;
        const k = rel.startsWith('analyse/') ? 'analyse' : rel.startsWith('liker/') ? 'programm'
              : rel.includes('/stems/') ? 'stems' : rel.endsWith('/audio.mp3') ? 'mp3' : rel.startsWith('songs/') ? 'bilder' : 'programm';
        teile[k] += e.l;
      }
      behaelter = b.masse(); bytes += behaelter.stuecke;
    }
  } catch (x) {}
  /* Kern und Programm: alles unter Programm/ ausser den Stuecken und dem Altbestand */
  await summe(path.join(ziel, 'Programm'), 'programm', (n) => /^bestand-.*\.tar$/.test(n) || n === 'bestand-index.ndjson' || n === 'songs' || n === 'analyse' || n === 'liker');
  await summe(path.join(ziel, 'node'), 'programm');
  await summe(path.join(ziel, 'Musik'), 'musik');
  for (const f of ['Sternenhimmel.html', 'LIES-MICH.md', 'START-Mac.command', 'START-Windows.cmd', 'START-Linux.sh']) {
    try { const s = (await fsp.stat(path.join(ziel, f))).size; teile.programm += s; bytes += s; } catch (x) {}
  }
  return { bytes, teile, behaelter, gemessenAm: new Date().toISOString() };
}
/* Der Bedarf nach Teilen, gezaehlt im Haus. Rund 6.000 stat auf der
   exFAT-SSD dauern zehn Sekunden - deshalb ASYNCHRON (fs.promises), damit
   der Server waehrenddessen Musik ausliefert statt zu stehen; ein
   laufendes Zaehlen wird geteilt (_bedarfLauf), das Ergebnis zehn Minuten
   gemerkt. Dieselben Ausschluesse wie bin/export.js. */
let _bedarfMerk = null, _bedarfLauf = null;
function exportBedarf() {
  if (_bedarfMerk && Date.now() - _bedarfMerk.zeit < 600000) return Promise.resolve(_bedarfMerk.wert);
  if (_bedarfLauf) return _bedarfLauf;
  _bedarfLauf = exportBedarfZaehlen().then(wert => { _bedarfMerk = { zeit: Date.now(), wert }; _bedarfLauf = null; return wert; },
                                           e => { _bedarfLauf = null; return null; });
  return _bedarfLauf;
}
async function exportBedarfZaehlen() {
  const fsp = fs.promises;
  const teile = { mp3: 0, bilder: 0, analyse: 0, texte: 0, programm: 0, node: 0, musik: 0, stems: 0 };
  const zahl  = { mp3: 0, bilder: 0, analyse: 0, texte: 0, programm: 0, node: 0, musik: 0, stems: 0 };
  const lauf = async (ordner, fn) => {
    let e = []; try { e = await fsp.readdir(ordner, { withFileTypes: true }); } catch (x) { return; }
    const unter = [];
    for (const d of e) {
      if (d.name.startsWith('.')) continue;                       /* auch ._-Beifang */
      const voll = path.join(ordner, d.name);
      if (d.isDirectory()) { if (fn(voll, d.name, true) !== false) unter.push(voll); }
      else if (d.isFile()) { let s = 0; try { s = (await fsp.stat(voll)).size; } catch (x) {} fn(voll, d.name, false, s); }
    }
    for (const u of unter) await lauf(u, fn);
  };
  const AUS = new Set(['roh', 'backup', 'node-portabel', 'suno-wege', 'modelle']);
  await lauf(LIB, (voll, name, istOrdner, groesse) => {
    const rel = path.relative(LIB, voll);
    if (istOrdner) { if (rel.split(path.sep).length === 1 && AUS.has(name)) return false; if (rel === path.join('kondensate', 'arbeit')) return false; return true; }
    if (name === 'export-lauf.json') return;
    const inStems = rel.includes(path.sep + 'stems' + path.sep);
    if (inStems) { teile.stems += groesse; zahl.stems++; return; }
    if (name === 'audio.wav') return;
    if (name === 'audio.mp3') { teile.mp3 += groesse; zahl.mp3++; teile.musik += groesse; zahl.musik++; return; }
    if (/^(cover|kachel|titelbild|eigen)\.(jpe?g|png|webp)$/.test(name) || /\.mp4$/.test(name)) { teile.bilder += groesse; zahl.bilder++; return; }
    if (rel.startsWith('analyse' + path.sep)) { teile.analyse += groesse; zahl.analyse++; return; }
    teile.texte += groesse; zahl.texte++;
  });
  for (const o of ['web', 'server', 'bin', 'browser', 'docs']) await lauf(path.join(WURZEL, o), (voll, name, istOrdner, groesse) => { if (!istOrdner) { teile.programm += groesse; zahl.programm++; } });
  for (const f of ['package.json', 'LICENSE', 'README.md']) { try { teile.programm += (await fsp.stat(path.join(WURZEL, f))).size; zahl.programm++; } catch (e) {} }
  await lauf(path.join(LIB, 'node-portabel'), (voll, name, istOrdner, groesse) => { if (!istOrdner && !/\.(zip|gz)$/.test(name)) { teile.node += groesse; zahl.node++; } });
  const NAMEN = { mp3: 'MP3', bilder: 'Titelbilder und Bewegtbilder', analyse: 'Analyse', texte: 'Texte und Katalog', programm: 'Programm', node: 'Node', musik: 'Musik-Ordner', stems: 'Stems' };
  const liste = Object.keys(NAMEN).map(k => ({ schluessel: k, name: NAMEN[k], bytes: teile[k], dateien: zahl[k], optional: k === 'stems' }));
  const gesamt = liste.filter(x => !x.optional).reduce((a, x) => a + x.bytes, 0);
  return { teile: liste, gesamt, gesamtMitStems: gesamt + teile.stems, gezaehltAm: new Date().toISOString() };
}

const EXPORT_LAUF = path.join(WURZEL, 'library', 'export-lauf.json');
  if (p === '/api/export/start' && req.method === 'POST') {
    let roh = ''; req.on('data', c => { roh += c; if (roh.length > 4096) req.destroy(); });
    req.on('end', () => {
      let d = null; try { d = JSON.parse(roh); } catch (e) {}
      if (global.exportLauf) return jsonAntwort(res, { ok: true, laeuft: true });
      const stems = !!(d && d.stems);
      const gewuenscht = String((d && d.ziel) || '').trim();
      if (gewuenscht && !path.isAbsolute(gewuenscht))
        return jsonAntwort(res, { ok: false, grund: 'Das Ziel muss ein absoluter Pfad sein.' });
      const konf = konfigLesen();
      /* Ein genanntes Ziel wird gemerkt - beim naechsten Mal reicht der Knopf. */
      if (gewuenscht && gewuenscht !== konf.exportZiel) {
        try { fs.writeFileSync(KONFIG, JSON.stringify({ ...konf, exportZiel: gewuenscht }, null, 1)); } catch (e) {}
      }
      const ziel = gewuenscht || konf.exportZiel || '';
      if (!ziel) return jsonAntwort(res, { ok: false, grund: 'Kein Exportziel - erst einen Ordner auf dem Stick angeben.' });
      if (!fs.existsSync(path.dirname(ziel)))
        return jsonAntwort(res, { ok: false, grund: `Der Stick ist nicht eingehaengt (${path.dirname(ziel)} fehlt).` });
      const cp = require('node:child_process');
      const args = ['bin/export.js', '--ziel', ziel];
      if (stems) args.push('--stems');
      const k = cp.spawn(process.execPath, args, { cwd: WURZEL, stdio: 'ignore' });
      global.exportLauf = { seit: Date.now(), pid: k.pid, ziel, stems };
      k.on('error', () => { global.exportLauf = null; });
      k.on('close', () => { global.exportLauf = null; });
      jsonAntwort(res, { ok: true, laeuft: true });
    });
    return;
  }
  /* DER ORDNERWAEHLER (Caspar_D, 09.09.2026: "die Pfadangabe fuer den
     Stick ist ein NoGo, wir brauchen hier einen Filebrowser"). Ein
     Browser darf dem Server keinen Pfad von der Platte nennen - also
     zeigt der Server, was er sieht: ohne pfad die eingehaengten
     Laufwerke (macOS /Volumes, Linux /media und /mnt, Windows die
     Laufwerksbuchstaben) mit freiem Platz und Dateisystem; mit pfad die
     Unterordner. Versteckte Ordner und ._-Beifang bleiben draussen.
     Nur Lesen, nur Verzeichnisse. */
  if (p === '/api/export/bedarf') { exportBedarf().then(b => jsonAntwort(res, b)); return; }
  /* ANHALTEN (Caspar_D, 09.09.2026: "ich will los ... reicht nicht auch eine
     Viertelstunde"): SIGTERM an den Export - der beendet die laufende
     Datei, schreibt den Stand und geht; der Stick ist bis dahin
     vorzeigbar. Der Prozess gehoert uns (bin/export.js, von hier
     gestartet oder von Hand), sonst nichts. */
  if (p === '/api/export/stop' && req.method === 'POST') {
    let pid = global.exportLauf && global.exportLauf.pid;
    if (!pid) { try { const l = JSON.parse(fs.readFileSync(EXPORT_LAUF, 'utf8')); if (l.laeuft) pid = l.pid; } catch (e) {} }
    if (!pid || !prozessLebt(pid)) return jsonAntwort(res, { ok: false, grund: 'Es läuft kein Export.' });
    try { process.kill(Number(pid), 'SIGTERM'); } catch (e) { return jsonAntwort(res, { ok: false, grund: e.message }); }
    return jsonAntwort(res, { ok: true });
  }

  if (p === '/api/ordner') {
    const pfad = String(u.searchParams.get('pfad') || '');
    const frei = (o) => { try {
      const r = require('node:child_process').spawnSync('df', ['-k', o], { encoding: 'utf8' });
      /* Spalten von VORN lesen: Geraet, 1024-Bloecke, Belegt, Frei - die
         Mount-Pfade hinten tragen Leerzeichen ("Macintosh HD - Data"). */
      const z = (r.stdout || '').trim().split('\n').pop().trim().split(/\s+/);
      return { gesamt: parseInt(z[1], 10) * 1024 || null, frei: parseInt(z[3], 10) * 1024 || null };
    } catch (e) { return { gesamt: null, frei: null }; } };
    const dateisystem = (o) => { try {
      const r = require('node:child_process').spawnSync('mount', [], { encoding: 'utf8' });
      const z = (r.stdout || '').split('\n').find(l => l.includes(' on ' + o + ' ('));
      return z ? (z.match(/\(([a-z0-9_]+)/i) || [])[1] || '' : '';
    } catch (e) { return ''; } };
    if (!pfad) {
      const laufwerke = [];
      const wurzeln = process.platform === 'win32'
        ? 'CDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(b => b + ':\\').filter(w => fs.existsSync(w))
        : ['/Volumes', '/media/' + (process.env.USER || ''), '/media', '/mnt', '/run/media/' + (process.env.USER || '')]
            .filter(w => fs.existsSync(w));
      for (const w of wurzeln) {
        if (process.platform === 'win32') { laufwerke.push({ name: w, pfad: w, ...frei(w), dateisystem: '' }); continue; }
        let eintraege = []; try { eintraege = fs.readdirSync(w, { withFileTypes: true }); } catch (e) {}
        for (const e of eintraege) {
          if (!e.isDirectory() && !e.isSymbolicLink()) continue;
          if (e.name.startsWith('.')) continue;
          const voll = path.join(w, e.name);
          const fsys = dateisystem(voll);
          laufwerke.push({ name: e.name, pfad: voll, ...frei(voll), dateisystem: fsys,
            system: /^Macintosh HD/.test(e.name) || /Time Machine/i.test(e.name) || /^com\.apple\./.test(e.name),
            netz: /^(smbfs|nfs|afpfs|webdav)$/i.test(fsys) });
        }
      }
      return jsonAntwort(res, { laufwerke });
    }
    if (!path.isAbsolute(pfad)) return jsonAntwort(res, { fehler: 'Pfad muss absolut sein' }, 400);
    let st; try { st = fs.statSync(pfad); } catch (e) { return jsonAntwort(res, { fehler: 'gibt es nicht' }, 404); }
    if (!st.isDirectory()) return jsonAntwort(res, { fehler: 'kein Ordner' }, 400);
    let eintraege = []; try { eintraege = fs.readdirSync(pfad, { withFileTypes: true }); } catch (e) { return jsonAntwort(res, { fehler: 'nicht lesbar' }, 403); }
    const ordner = eintraege.filter(e => e.isDirectory() && !e.name.startsWith('.') && !e.name.startsWith('._'))
      .map(e => ({ name: e.name, pfad: path.join(pfad, e.name) })).sort((a, b) => a.name.localeCompare(b.name, 'de'));
    const eltern = path.dirname(pfad);
    const istWurzel = /^\/Volumes\/[^/]+$/.test(pfad) || /^\/(media|mnt)\/[^/]+$/.test(pfad) || /^[A-Z]:\\?$/.test(pfad) || eltern === pfad;
    const hatArchiv = fs.existsSync(path.join(pfad, 'Programm', 'library', 'export-stand.json'));
    return jsonAntwort(res, { pfad, eltern: istWurzel ? null : eltern, ordner, ...frei(pfad), hatArchiv });
  }

  if (p === '/api/export/stand') {
    const konf = konfigLesen();
    const ziel = konf.exportZiel || null;
    const leer = { laeuft: false, seit: null, schritt: null, zeilen: [], fertig: false, fehler: null, ergebnis: null };
    let lauf = { ...leer };
    try { lauf = { ...lauf, ...JSON.parse(fs.readFileSync(EXPORT_LAUF, 'utf8')) }; } catch (e) {}
    /* Ein abgeschlossener Lauf gehoert zu SEINEM Ziel. Zeigt das Register
       ein anderes Ziel, hat er dort nichts zu suchen (Caspar_D, 09.09.2026:
       "eine fertig-Meldung, obwohl ich noch nie was exportiert habe" - das
       war der Probelauf auf die SSD). Laufende Laeufe bleiben sichtbar. */
    const laufZiel = lauf.ziel || null;
    if (!lauf.laeuft && laufZiel && laufZiel !== ziel) lauf = { ...leer };
    /* Ein Lauf, dessen Prozess nicht mehr lebt, laeuft nicht (09.09.2026:
       Server-Neustart und Ruhemodus waehrend eines Stick-Exports - die
       Mitschrift sagte "laeuft", der Prozess war weg). Einmal in die
       Datei zurueckgeschrieben, dann steht es fest. */
    if (lauf.laeuft && lauf.pid && !prozessLebt(lauf.pid)) {
      lauf = { ...lauf, laeuft: false, fertig: false, schritt: 'abgebrochen', fortschritt: null,
               fehler: lauf.fehler || 'Der Export wurde unterbrochen (Prozess beendet) - erneut starten setzt fort, es wird nur aufgefrischt, was fehlt.' };
      try { fs.writeFileSync(EXPORT_LAUF, JSON.stringify(lauf, null, 1)); } catch (e) {}
    }
    /* "Eingehaengt" heisst: der Ordner UEBER dem Ziel ist da - der Stick
       selbst also, auch wenn noch nie exportiert wurde. */
    const zielEingehaengt = !!ziel && fs.existsSync(path.dirname(ziel));
    let letzter = null;
    if (zielEingehaengt) {
      try { letzter = JSON.parse(fs.readFileSync(path.join(ziel, 'Programm', 'library', 'export-stand.json'), 'utf8')); } catch (e) {}
    }
    /* DAS MEDIUM UND DER BEDARF (Caspar_D, 09.09.2026: "ein Balkendiagramm,
       was auf dem Medium drauf ist, wieviel Platz der KlangTresor
       benoetigt und welche Dateien wie viel, und wieviel noch da ist").
       Medium: Laufwerkswurzel des Ziels, Dateisystem, Groessen, und ob
       Mac, Windows und Linux es lesen. Bedarf: der Datenbestand nach
       Teilen gezaehlt - einmal je zehn Minuten, die Zahlen aendern sich
       nicht schneller. */
    const medium = zielEingehaengt ? mediumInfo(ziel, letzter) : null;
    Promise.all([exportBedarf(), zielEingehaengt && fs.existsSync(ziel) ? zielMessen(ziel) : Promise.resolve(null)]).then(([bedarf, archiv]) => {
      if (medium && archiv) { medium.archiv = archiv; medium.archivBytes = archiv.bytes; }
      jsonAntwort(res, { ...lauf, laufZiel, prozess: !!global.exportLauf, ziel, zielEingehaengt, letzter, medium, bedarf });
    });
    return;
  }
  /* Musik-Karte (bin/karte.js) und Musikstil je Song (bin/klang.js).

     ZWEI RAEUME: ?raum=klang|geschichten. Ohne Angabe kommt der
     Klang-Raum - so bleiben alte Lesezeichen und der Sternenhimmel-
     Export gueltig. Der Lied-Raum (verkettete Vektoren) ist gestrichen:
     Caspar_D, 29.08.2026, "den kombinierten Raum machen wir nicht
     wieder auf". */
  if (p === '/api/karte' || p === '/api/klang') {
    const RAUMDATEI = { klang: 'karte.json', geschichten: 'karte-geschichten.json' };
    const raum = (u.searchParams.get('raum') || 'klang');
    const name = p === '/api/klang' ? 'klang.json' : (RAUMDATEI[raum] || RAUMDATEI.klang);
    const f = path.join(WURZEL, 'library', name);
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    return liefere(req, res, f);
  }
  /* Welche Raeume sind gerechnet? Die Oberflaeche zeigt nur an, was da
     ist - ein Register, das ins Leere fuehrt, ist schlimmer als keins. */
  /* Systemlautstaerke fuers Einmessen (Caspar_D, 29.08.2026: "kannst du
     die systemlautstaerke abfragen vorher?"). Nur LESEN - gesetzt wird
     nichts, das bleibt beim Nutzer. Nur auf macOS; anderswo ehrlich
     {verfuegbar:false}, und die Oberflaeche bittet um Handpruefung. */
  if (p === '/api/system/lautstaerke') {
    if (process.platform !== 'darwin') return jsonAntwort(res, { verfuegbar: false });
    return require('node:child_process').execFile('osascript', ['-e', 'get volume settings'],
      { timeout: 3000 }, (err, out) => {
        const m = err ? null : /output volume:(\d+).*output muted:(\w+)/.exec(out || '');
        if (!m) return jsonAntwort(res, { verfuegbar: false });
        jsonAntwort(res, { verfuegbar: true, prozent: +m[1], stumm: m[2] === 'true' });
      });
  }

  /* Das Standard-Ausgabegeraet - wichtig fuers Einmessen, denn die
     Befunde sind geraetespezifisch (der Kompressor wohnt im HomePod,
     nicht im iMac). */
  if (p === '/api/system/ausgabegeraet') {
    if (process.platform !== 'darwin') return jsonAntwort(res, { verfuegbar: false });
    if (Date.now() - ausgabeGeraetCache.t < 10000 && ausgabeGeraetCache.wert)
      return jsonAntwort(res, ausgabeGeraetCache.wert);
    return require('node:child_process').execFile('system_profiler', ['SPAudioDataType', '-json'],
      { timeout: 8000, maxBuffer: 4 * 1024 * 1024 }, (err, out) => {
        let w = { verfuegbar: false };
        try {
          const j = JSON.parse(out);
          const geraete = (j.SPAudioDataType || []).flatMap(x => x._items || []);
          const std = geraete.find(g => g.coreaudio_default_audio_output_device === 'spaudio_yes');
          if (std) w = { verfuegbar: true, name: std._name };
        } catch (e) {}
        ausgabeGeraetCache = { t: Date.now(), wert: w };
        jsonAntwort(res, w);
      });
  }

  /* Warntoene stumm fuer die Dauer einer Messung. POST {"an":true}
     merkt den aktuellen Pegel und stellt auf 0; {"an":false} stellt
     den gemerkten Pegel wieder her. Nur die Warntoene - die
     Ausgabelautstaerke bleibt unberuehrt. */
  if (p === '/api/system/stille' && req.method === 'POST') {
    if (process.platform !== 'darwin') return jsonAntwort(res, { verfuegbar: false });
    let roh = '';
    req.on('data', s => { roh += s; if (roh.length > 256) req.destroy(); });
    return req.on('end', () => {
      let an = false; try { an = !!JSON.parse(roh || '{}').an; } catch (e) {}
      const { execFile } = require('node:child_process');
      if (an) {
        execFile('osascript', ['-e', 'alert volume of (get volume settings)'], { timeout: 3000 }, (err, out) => {
          const alt = err ? null : parseInt(out, 10);
          if (Number.isFinite(alt)) warntonMerker = alt;
          execFile('osascript', ['-e', 'set volume alert volume 0'], { timeout: 3000 }, () => {
            jsonAntwort(res, { an: true, vorher: warntonMerker });
          });
        });
      } else {
        const zurueck = Number.isFinite(warntonMerker) ? warntonMerker : 50;
        execFile('osascript', ['-e', 'set volume alert volume ' + zurueck], { timeout: 3000 }, () => {
          jsonAntwort(res, { an: false, wieder: zurueck });
        });
        warntonMerker = null;
      }
    });
  }

  /* ---- DOWNLOAD-KONTINGENT UND WAS LOKAL FEHLT ----------------------
     Seit dem 03.09.2026 deckelt Suno die Downloads. Diese Auskunft
     beantwortet beides in einem Zug: wieviel Kontingent noch da ist, und
     welche Lieder ueberhaupt eine Datei braeuchten.

     KlangTresor loest KEINEN Download aus - es zeigt nur den Stand und
     verlinkt auf die Suno-Seite, wo der Mensch selbst klickt. Dieselbe
     Arbeitsteilung wie beim Entfolgen (browser/03-folgen-pruefen.js:
     "Entfolgt wird nichts - das bleibt Handarbeit und ist gut so").
     Caspar_D, 06.09.2026: "Bisher haben wir immer so agiert, dass
     KlangTresor nichts in Suno ausloest, was Credits oder Geld kostet." */
  if (p === '/api/kontingent') {
    let k = null;
    try { k = JSON.parse(fs.readFileSync(path.join(WURZEL, 'library', 'kontingent.json'), 'utf8')); } catch (e) {}
    const stand = k && k.stand;

    /* Der naechste Stichtag ergibt sich aus dem Anker: der Zaehler
       springt monatlich am selben Kalendertag um. Faellt der Tag im
       Zielmonat aus (31. im Februar), nimmt er den letzten des Monats. */
    let stichtag = null;
    if (stand && stand.anker) {
      const a = new Date(stand.anker), heute = new Date();
      const tag = a.getUTCDate();
      let j = heute.getUTCFullYear(), m = heute.getUTCMonth();
      const imMonat = (jj, mm) => Math.min(tag, new Date(Date.UTC(jj, mm + 1, 0)).getUTCDate());
      if (heute.getUTCDate() >= imMonat(j, m)) { m++; if (m > 11) { m = 0; j++; } }
      stichtag = new Date(Date.UTC(j, m, imMonat(j, m))).toISOString().slice(0, 10);
    }

    /* Was lokal fehlt. Der Katalog kennt alle Lieder, der Ordner sagt,
       welche eine Datei haben. Fremde Songs zaehlen nicht - fuer die
       gibt es bei Suno nichts herunterzuladen, was uns gehoert. */
    const fehlen = [];
    try {
      const kat = require('../bin/katalog.js').lesen();
      const SONGS = path.join(WURZEL, 'library', 'songs');
      for (const [id, so] of Object.entries((kat && kat.songs) || {})) {
        if (so.fremd || so.imPapierkorb) continue;
        const d = path.join(SONGS, id);
        const mp3 = fs.existsSync(path.join(d, 'audio.mp3'));
        const wav = fs.existsSync(path.join(d, 'audio.wav'));
        if (mp3 && wav) continue;
        fehlen.push({ id, titel: so.titel || null, erstellt: so.erstellt || null,
                      mp3, wav, link: 'https://suno.com/song/' + id });
      }
      fehlen.sort((a, b) => String(b.erstellt || '').localeCompare(String(a.erstellt || '')));
    } catch (e) {}

    return jsonAntwort(res, { stand, stichtag, fehlen,
      verlauf: (k && k.verlauf) ? k.verlauf.slice(-30) : [] });
  }

  /* ---- WAS IM DOWNLOAD-ORDNER LIEGT ---------------------------------
     Caspar_D, 07.09.2026: "KlangTresor muss wissen, wo es schauen muss,
     und das ist nicht sehr komfortabel." Also schaut es von selbst nach -
     aber nur, wenn jemand die Seite oeffnet, nicht als Hintergrundwache.

     GET  sagt, was gefunden wurde (nichts wird angefasst)
     POST uebernimmt es (bin/uebernehmen.js --tun)

     Zugeordnet wird ueber die Suno-Signatur im Dateikopf, nie ueber den
     Dateinamen - Titel koennen doppelt vorkommen, umbenannt werden oder
     ein " (1)" bekommen. */
  if (p === '/api/downloads') {
    const { execFile } = require('node:child_process');
    const skript = path.join(WURZEL, 'bin', 'uebernehmen.js');
    const argumente = req.method === 'POST' ? [skript, '--tun'] : [skript];
    return execFile(process.execPath, argumente, { cwd: WURZEL, timeout: 300000 },
      (fehler, aus, err) => {
        const text = String(aus || '') + String(err || '');
        /* Die Zeilen der Uebersicht herausloesen, damit die Oberflaeche
           nicht den ganzen Text anzeigen muss. */
        const bereit = [...text.matchAll(/^\s{4}(audio\.\w+)\s+([\d.,]+ [KM]B)\s+(.+)$/gm)]
          .map(m => ({ datei: m[1], groesse: m[2], titel: m[3].trim() }));
        const uebernommen = (text.match(/(\d+) Datei\w* uebernommen|(\d+) Datei\w* übernommen/) || [])[0] || null;
        jsonAntwort(res, {
          gefunden: bereit.length, bereit,
          uebernommen: req.method === 'POST' ? (uebernommen || '0') : null,
          ohneSignatur: (text.match(/Ohne Suno-Signatur[^(]*\((\d+)\)/) || [])[1] || 0,
          nichtImKatalog: (text.match(/Nicht im Katalog \((\d+)\)/) || [])[1] || 0,
          fehler: fehler ? String(fehler.message).slice(0, 200) : null,
          ausgabe: text.slice(-1500),
        });
      });
  }

  if (p === '/api/raeume') {
    const da = {};
    for (const [r, n] of Object.entries({ klang: 'karte.json', geschichten: 'karte-geschichten.json' }))
      da[r] = fs.existsSync(path.join(WURZEL, 'library', n));
    return jsonAntwort(res, da);
  }
  /* Gemerkte EQ-Einstellungen je Song. EINE Datei fuer alle Songs
     (exFAT: jede Datei kostet einen Block - Caspar_D, 20.08.2026: "nie
     fuer jeden Song eine Mikrodatei"). Und BEWUSST NICHT in den
     erzeugten Analysedaten (analyse-index, eq-profil, Ablage): die
     werden von den Rechenlaeufen neu geschrieben und wuerden die
     Einstellungen ueberschreiben. Gemessenes gehoert der Maschine,
     Eingestelltes gehoert Caspar_D - getrennte Dateien, beide einzeln. */
  /* DER MESSGANG-ZWISCHENSPEICHER (Caspar_D, 29.08.2026: "es wäre gut,
     wenn alle daten irgendwo zwischengespeichert würden, dann könnte
     die Zusammenfassung damit spielen"). EINE Sammeldatei je Gang
     (exFAT: 1-MB-Bloecke, keine Kleindateien), benannt nach dem
     Startzeitpunkt; jeder Schritt ueberschreibt sie mit dem
     gewachsenen Stand. Die Daten sind nicht reproduzierbar - ein Raum
     an einem Abend laesst sich nicht nachstellen. */
  const DURCHLAEUFE_DATEI = path.join(WURZEL, 'library', 'messungen', 'tontestdurchlaeufe.json');
  if (p === '/api/messungen/durchlauf' && req.method === 'PUT') {
    let roh = '';
    req.on('data', c => { roh += c; if (roh.length > 16 * 1024 * 1024) req.destroy(); });
    req.on('end', () => {
      try {
        const d = JSON.parse(roh);
        const stempel = String(d.begonnen || '').slice(0, 19);
        if (!/^\d{4}-\d{2}-\d{2}T/.test(stempel)) { res.writeHead(400); return res.end(); }
        fs.mkdirSync(path.dirname(DURCHLAEUFE_DATEI), { recursive: true });
        let alle = {}; try { alle = JSON.parse(fs.readFileSync(DURCHLAEUFE_DATEI, 'utf8')); } catch (e) {}
        alle[stempel] = d.daten || d;
        fs.writeFileSync(DURCHLAEUFE_DATEI, JSON.stringify(alle));
        jsonAntwort(res, { ok: true, durchlauf: stempel, anzahl: Object.keys(alle).length });
      } catch (e) { jsonAntwort(res, { ok: false, fehler: e.message }, 400); }
    });
    return;
  }
  if (p === '/api/messungen/durchlauf' && req.method === 'GET') {
    try {
      const alle = JSON.parse(fs.readFileSync(DURCHLAEUFE_DATEI, 'utf8'));
      const namen = Object.keys(alle).sort();
      if (!namen.length) return jsonAntwort(res, { ok: false, fehler: 'noch kein Durchlauf gespeichert' }, 404);
      const name = namen[namen.length - 1];
      return jsonAntwort(res, { ok: true, name, durchlauf: alle[name] });
    } catch (e) { return jsonAntwort(res, { ok: false, fehler: 'noch kein Durchlauf gespeichert' }, 404); }
  }
  if (p === '/api/messungen/durchlaeufe' && req.method === 'GET') {
    try {
      const alle = JSON.parse(fs.readFileSync(DURCHLAEUFE_DATEI, 'utf8'));
      return jsonAntwort(res, { ok: true, durchlaeufe: Object.keys(alle).sort() });
    } catch (e) { return jsonAntwort(res, { ok: true, durchlaeufe: [] }); }
  }
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
  /* EIGENE ARTWORKS (Caspar_D, 26.08.2026: "Artwork zuordnen, die Suno
     wegen puritanischer Engstirnigkeit abgelehnt hat").

     Welche Songs ein selbst zugeordnetes Bild oder Video haben, weiss
     nur die Platte. Die Oberflaeche holt die Liste einmal, statt fuer
     321 Kacheln je eine Datei zu erfragen und 300 Fehlschlaege zu
     ernten.

     eigen.mp4 und eigen.jpg heissen absichtlich anders als Sunos
     artwork.mp4 und cover.jpg: So faellt kein Medienlauf darueber her,
     man sieht jederzeit, was von wem stammt, und Loeschen macht es
     rueckgaengig. */
  /* MEHRERE EIGENE VIDEOS UND BILDER (Caspar_D, 11.09.2026: "erstmal kann nur ein
     handmade Video gespeichert werden, Tarja 'missbraucht' das gerade fuer
     Hook-Videos aus Suno"). Nr. 1 bleibt eigen.mp4/eigen.jpg, danach eigen-2.mp4,
     eigen-3.mp4 ... Vergeben wird immer hoechste + 1; die hoechste Nummer ist damit
     das juengste - die Vorgabe fuers Zeigen. (Loest man die hoechste, kehrt ihre
     Nummer beim naechsten Upload wieder; liefere() gibt eigen* darum nie lange
     in den Browser-Vorrat.) */
  const eigenName = (ext, nr) => (nr > 1 ? 'eigen-' + nr + '.' + ext : 'eigen.' + ext);
  const eigenNummern = (ordner) => {
    const aus = { mp4: [], jpg: [] };
    let namen = []; try { namen = fs.readdirSync(ordner); } catch (e) {}
    for (const n of namen) {
      const mm = /^eigen(?:-(\d+))?\.(mp4|jpg)$/.exec(n); if (!mm) continue;
      try { if (fs.statSync(path.join(ordner, n)).size <= 0) continue; } catch (e) { continue; }
      aus[mm[2]].push(mm[1] ? parseInt(mm[1], 10) : 1);
    }
    aus.mp4.sort((a, b) => a - b); aus.jpg.sort((a, b) => a - b);
    return aus;
  };
  if (p === '/api/eigen-artwork') {
    const raus = {};
    try {
      for (const d of fs.readdirSync(SONGS)) {
        const o = path.join(SONGS, d);
        let st; try { st = fs.statSync(o); } catch (e) { continue; }
        if (!st.isDirectory()) continue;
        const hat = {};
        /* Ton kommt dazu (Tarja über Caspar_D, 27.08.2026: "auch mp3's
           hochladen können, die das vorhandene nicht ersetzen aber
           überstimmen" - "wie bei den artwork und videos"). Dasselbe
           Muster: eigen.mp3 steht neben Sunos audio.mp3 und audio.wav. */
        /* Das vierte Eigene ist kein Medium, sondern ein Rezept: eigen-effekt.json
           traegt den Effektclip aus dem Effektclip-Studio (Caspar_D,
           09.09.2026: "ein preset an den Titel gebunden" - die App malt es live). */
        for (const [feld, datei] of [['ton', 'eigen.mp3'], ['effekt', 'eigen-effekt.json']]) {
          try { if (fs.statSync(path.join(o, datei)).size > 0) hat[feld] = true; } catch (e) {}
        }
        /* video/bild bleiben als Ja/Nein (Altbestand der Oberflaeche), dazu die Nummern. */
        const nn = eigenNummern(o);
        if (nn.mp4.length) { hat.video = true; hat.videos = nn.mp4; }
        if (nn.jpg.length) { hat.bild = true; hat.bilder = nn.jpg; }
        if (Object.keys(hat).length) raus[d] = hat;
      }
    } catch (e) {}
    /* ... und was davon im Behaelter liegt (Stick): songs/<id>/eigen.* */
    const b = behaelterHolen();
    if (b) for (const rel of b.liste('songs/')) {
      const m = /^songs\/([^/]+)\/eigen(?:-(\d+))?(?:-effekt)?\.(mp4|jpg|mp3|json)$/.exec(rel); if (!m) continue;
      const e = b.eintrag(rel); if (!e || !e.l) continue;
      const feld = { mp4: 'video', jpg: 'bild', mp3: 'ton', json: 'effekt' }[m[3]];
      const h = (raus[m[1]] = raus[m[1]] || {}); h[feld] = true;
      if (m[3] === 'mp4' || m[3] === 'jpg') {
        const liste = m[3] === 'mp4' ? 'videos' : 'bilder', nr = m[2] ? parseInt(m[2], 10) : 1;
        h[liste] = (h[liste] || []); if (!h[liste].includes(nr)) h[liste].push(nr); h[liste].sort((x, y) => x - y);
      }
    }
    return jsonAntwort(res, { songs: raus, anzahl: Object.keys(raus).length });
  }

  /* EIGENES ARTWORK ABLEGEN UND WIEDER LOESEN (Caspar_D, 26.08.2026:
     "wir haben schon ein abzeichen, um text hinzuzufügen, dort könnte
     man in diesem context auch einen videoupload einbauen").

     KEIN MULTIPART. Die Datei kommt roh im Rumpf, die Art steht im
     Content-Type. Ein Zerleger fuer multipart/form-data waere hundert
     Zeilen Zustandsmaschine fuer genau eine Datei je Anfrage - der
     Browser kann eine Datei auch einfach als Rumpf schicken.

     DER DECKEL ist eine Notbremse gegen den Fehlgriff, nicht gegen
     Angreifer: Wer versehentlich einen Film statt eines Artworks
     zieht, soll nicht die Platte fuellen. Groesse steht im
     Content-Length, wird aber trotzdem beim Lesen mitgezaehlt - die
     Angabe im Kopf ist eine Behauptung, kein Beleg. */
  if (p.startsWith('/api/eigen-artwork/')) {
    const id = decodeURIComponent(p.slice('/api/eigen-artwork/'.length));
    const ordner = sicherer(SONGS, id);
    if (!ordner || !/^[A-Za-z0-9._-]+$/.test(id))
      return jsonAntwort(res, { ok: false, grund: 'Ungültige Kennung.' }, 400);

    if (req.method === 'DELETE') {
      /* ?was=bild oder ?was=video entfernt nur das eine; ohne Angabe
         beides. Titelbild und Video sind getrennte Entscheidungen -
         wer das Video wegnimmt, will nicht auch sein Titelbild los. */
      const was = (u.searchParams.get('was') || '').toLowerCase();
      const nr = Math.max(1, parseInt(u.searchParams.get('nr') || '1', 10) || 1);   /* ?nr=2 nimmt eigen-2.mp4 */
      const nn = eigenNummern(ordner);
      const namen = was === 'bild' ? [eigenName('jpg', nr)]
                  : was === 'video' ? [eigenName('mp4', nr)]
                  : was === 'ton' ? ['eigen.mp3']
                  : was === 'effekt' ? ['eigen-effekt.json']
                  : [...nn.mp4.map(n => eigenName('mp4', n)), ...nn.jpg.map(n => eigenName('jpg', n)), 'eigen.mp3', 'eigen-effekt.json'];
      let weg = 0;
      for (const n of namen) {
        const f = path.join(ordner, n);
        try { if (fs.existsSync(f)) { fs.unlinkSync(f); weg++; } } catch (e) {}
      }
      return jsonAntwort(res, { ok: true, entfernt: weg });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const typ = String(req.headers['content-type'] || '').split(';')[0].toLowerCase();
      /* Die Art steht im Content-Type. Bei Ton ist der Behälter
         vielfältiger als bei Bild und Video: Ein MP3 kommt je nach
         Browser als audio/mpeg, audio/mp3 oder audio/mpeg3 an, und wer
         ein WAV zieht, meint dasselbe - eine eigene Fassung. Alles
         landet unter eigen.mp3; der Name sagt "eigener Ton", nicht
         "MPEG Layer III". */
      /* Video und Bild: ohne ?nr kommt die Datei als NEUE Nummer dazu (hoechste + 1),
         mit ?nr=N ersetzt sie genau diese. Ton und Rezept gibt es je einmal. */
      const ext = /^video\//.test(typ) ? 'mp4' : /^image\//.test(typ) ? 'jpg' : null;
      const wunsch = parseInt(u.searchParams.get('nr') || '', 10);
      /* Die NUMMER wird erst vergeben, wenn der Rumpf ganz da ist - sonst rechnen zwei
         gleichzeitige Uploads beide "hoechste + 1" und der zweite ueberschreibt den ersten. */
      const nameFuer = () => {
        if (!ext) return /^audio\//.test(typ) ? 'eigen.mp3' : /^application\/json/.test(typ) ? 'eigen-effekt.json' : null;
        const nn = eigenNummern(ordner)[ext];
        return eigenName(ext, wunsch > 0 ? wunsch : (nn.length ? nn[nn.length - 1] + 1 : 1));
      };
      if (!nameFuer()) return jsonAntwort(res, { ok: false, grund: 'Nur Video, Bild, Ton oder Effekt-Rezept.' }, 415);
      const DECKEL = 300 * 1024 * 1024;
      const stuecke = []; let gross = 0, abgebrochen = false;
      req.on('data', (c) => {
        gross += c.length;
        if (gross > DECKEL) { abgebrochen = true; req.destroy(); return; }
        stuecke.push(c);
      });
      req.on('end', () => {
        if (abgebrochen) return;
        try {
          fs.mkdirSync(ordner, { recursive: true });
          /* Erst daneben schreiben, dann umbenennen: Bricht die
             Uebertragung ab, bleibt die alte Datei stehen statt einer
             halben neuen. */
          const name = nameFuer();
          const nrM = /^eigen(?:-(\d+))?\.(mp4|jpg)$/.exec(name);
          const nr = nrM ? (nrM[1] ? parseInt(nrM[1], 10) : 1) : undefined;
          const vorlaeufig = path.join(ordner, name + '.' + process.pid + '-' + Date.now() + '.teil');
          fs.writeFileSync(vorlaeufig, Buffer.concat(stuecke));
          fs.renameSync(vorlaeufig, path.join(ordner, name));
          jsonAntwort(res, { ok: true, datei: name, bytes: gross, nr });
        } catch (e) { jsonAntwort(res, { ok: false, grund: String(e.message || e) }, 500); }
      });
      req.on('error', () => {});
      return;
    }
  }

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
const BEOBACHTET = [__filename, path.join(__dirname, '..', 'bin', 'katalog.js'),
                    path.join(__dirname, '..', 'bin', 'behaelter.js')];   /* seit 09.09.2026 mit geladen */
const standVon = (f) => { try { return fs.statSync(f).mtimeMs; } catch (e) { return 0; } };
let eigeneStand = BEOBACHTET.map(standVon).join('|');
/* Eingefroren gibt es keine Wache: Auf dem Stick steht keine Schleife
   dahinter, die den Server wieder hochzieht - Exit 75 waere dort
   schlicht das Ende. */
if (!EINGEFROREN) setInterval(() => {
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
  /* Mit --port (Stick) wird weitergesucht: dort ist "ein anderer
     KlangTresor" keine Verwechslungsgefahr, sondern der Normalfall,
     wenn der Stick am Rechner der Werkstatt steckt. Hoechstens 50
     Versuche, danach der alte Abbruch. */
  if (e.code === 'EADDRINUSE' && PORTWUNSCH && PORT < PORTWUNSCH + 50) {
    PORT++;
    return server.listen(PORT, '0.0.0.0');
  }
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

server.on('listening', () => {
  console.log('\n  KlangTresor läuft\n');
  /* Diese Zeile lesen die Startskripte auf dem Stick - Wortlaut ist
     Schnittstelle, nicht Schmuck. */
  console.log(`  KlangTresor auf http://localhost:${PORT}`);
  if (EINGEFROREN) console.log('  Eingefroren: nur lesen, nichts wird geholt oder gespeichert.');
  /* Hier stand "Auf diesem Mac" - was auf einem Windows-Rechner schlicht
     falsch ist und beim Einrichten sofort auffaellt (27.08.2026). Das
     Haus ist am Mac gewachsen, aber es laeuft nicht nur dort. */
  const hier = process.platform === 'darwin' ? 'Auf diesem Mac'
             : process.platform === 'win32'  ? 'Auf diesem PC'
             : 'Auf diesem Rechner';
  console.log(`  ${hier}:  http://localhost:${PORT}`);

  // Alle Netzwerkadressen zeigen - ein Rechner hängt oft in mehreren Netzen
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
server.listen(PORT, '0.0.0.0');
