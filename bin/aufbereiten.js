/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ============================================================
   Suno-Archiv · Aufbereitung
   ------------------------------------------------------------
   Liest die Rohdaten aus library/roh/ und baut daraus den
   Katalog library/katalog.json.gz - eine einzige gepackte Datei
   mit allen Metadaten, Lyrics, Prompts und dem Zählerverlauf.

   Läuft beliebig oft. Vorhandene Songs werden ergänzt statt
   überschrieben; insbesondere bleibt der Verlauf der Play- und
   Like-Zähler über alle Durchläufe hinweg erhalten.

   Aufruf:  node bin/aufbereiten.js
   ============================================================ */

const fs   = require('node:fs');
const path = require('node:path');
const K    = require('./katalog.js');

const WURZEL = path.join(__dirname, '..');
const ROH    = path.join(WURZEL, 'library', 'roh');
const SONGS  = path.join(WURZEL, 'library', 'songs');
const ALT_INDEX = path.join(WURZEL, 'library', 'index.json');

// --- Hilfsmittel ------------------------------------------------

function alleRohdateien(zweck) {
  if (!fs.existsSync(ROH)) return [];
  return fs.readdirSync(ROH)
    .filter(f => f.startsWith(zweck + '-') && f.endsWith('.json'))
    .filter(f => !f.startsWith('._'))          // AppleDouble-Reste auf exFAT
    .sort()
    .map(f => path.join(ROH, f));
}

function neuesteRohdatei(zweck) {
  const t = alleRohdateien(zweck);
  return t.length ? t[t.length - 1] : null;
}

const lies = (d) => d ? JSON.parse(fs.readFileSync(d, 'utf8')) : null;

function alsListe(d) {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.alle || d.clips || d.songs || d.playlists || [];
}

// --- Einen Clip in unsere eigene, schlanke Form bringen ---------

function normalisieren(c) {
  const m = c.metadata || {};
  return {
    id:            c.id,
    titel:         c.title || '(ohne Titel)',
    erstellt:      c.created_at,
    // Bei manchen Songs meldet Suno keine Modellversion, sondern
    // nur den internen Namen ("chirp"). Der taugt nicht als Badge -
    // er verteilt sich quer über alle Zeiträume und sagt nichts
    // über die Version. Also lassen wir das Feld leer und heben
    // den Rohwert getrennt auf.
    modell:        c.major_model_version || null,
    modellRoh:     c.model_name || null,

    lyrics:        m.prompt || '',
    stilPrompt:    m.tags || c.display_tags || '',
    stilAusschluss:m.negative_tags || '',

    typ:           m.type || null,
    istRemix:      !!m.is_remix,
    coverVon:      m.cover_clip_id || null,
    bearbeitetVon: m.edited_clip_id || null,

    oeffentlich:   !!c.is_public,
    imPapierkorb:  !!c.is_trashed,
    versteckt:     !!c.is_hidden,
    instrumental:  !!m.make_instrumental,
    hatGesang:     m.has_vocal !== false,

    dauer:         m.duration || null,
    handle:        c.handle || null,
    anzeigename:   c.display_name || null,
    albums:        (c.albums || []).map(a => a.name || a).filter(Boolean),

    audioUrl:      c.audio_url || null,
    videoUrl:      c.video_url || null,            // Sunos Lyric-Video
    videoCoverUrl: c.video_cover_url || null,      // dein eigenes Video-Artwork
    hookBildUrl:   c.hook_preview_thumbnail_url || null,
    hatHook:       !!c.has_hook,
    beschriftung:  c.caption || null,
    bildUrl:       c.image_large_url || c.image_url || null,
    link:          'https://suno.com/song/' + c.id,

    plays:         c.play_count    || 0,
    likes:         c.upvote_count  || 0,
    kommentare:    c.comment_count || 0,

    /* Seit dem 03.09.2026 gibt Suno den Ton nur noch nach einem Unlock
       heraus, und der kostet ein Download-Guthaben. `is_download_unlocked`
       sagt, ob dieser Titel schon freigeschaltet ist.

       DREI ZUSTÄNDE, NICHT ZWEI. Fehlt das Feld in den Rohdaten, wissen
       wir es nicht — dann `null` statt `false`. Am 11.09.2026 lag es nur
       bei 73 von 324 Datensätzen überhaupt vor, und ausgerechnet bei den
       drei freigeschalteten fehlte es, weil deren Einträge älter sind als
       der Unlock. Ein `false` dorthin zu schreiben wäre eine Behauptung
       statt einer Messung.

       Gemessen am 11.09.2026 im angemeldeten Browser: das Feld ist
       verlässlich. Drei von Hand geholte Titel `true`, ein nie
       freigeschalteter `false`. Der Irrtum vom 06.09. („steht auch bei
       Liedern auf false, die längst hier liegen") kam daher, daß jene
       Titel aus der Zeit vor der Umstellung stammen. */
    freigeschaltet:   typeof c.is_download_unlocked === 'boolean' ? c.is_download_unlocked : null,
    /* Warum ein Titel gar nicht freigeschaltet werden KANN — im Bestand
       14x 'remix_contest'. Für die lohnt kein Anbieten. */
    freischaltSperre: c.download_disabled_reason || null,
  };
}

// --- Hauptlauf --------------------------------------------------

const heute = new Date().toISOString().slice(0, 10);

const feedDatei   = neuesteRohdatei('feed');
const profilDatei = neuesteRohdatei('profil');
const privatDatei = neuesteRohdatei('privat');

/* Keine Rohdaten mehr im aktiven Ordner? Seit dem 20.08.2026 wandern
   verarbeitete Dateien nach roh/verarbeitet/ - dann traegt der Katalog
   selbst alles, und dieser Lauf pflegt nur nach (Whisper, Zeitproben,
   Kommentarzaehler). Ein leerer Lauf ist also KEIN Fehler mehr; nur
   wer noch gar keinen Katalog hat, braucht erst eine Ernte. */
if (!feedDatei && !profilDatei && !K.lesen()) {
  console.error('Keine Rohdaten in library/roh/ und noch kein Katalog.');
  console.error('Erst im Browser sammeln (siehe README).');
  process.exit(1);
}

console.log('Lese Rohdaten:');
if (profilDatei) console.log('  Profil:        ', path.basename(profilDatei));
if (feedDatei)   console.log('  Arbeitsbereich:', path.basename(feedDatei));
if (privatDatei) console.log('  Unveröffentl.: ', path.basename(privatDatei));

/* ALLE Profil-Ernten liefern Zaehlerstaende fuer den Verlauf - nicht
   nur die neueste. Wer dreimal erntet und einmal uebernimmt, verlor
   frueher die Zwischenstaende (Caspar_D, 20.08.2026: "was passiert mit
   denen"). Jede Datei traegt ihr Datum; die Staende werden unten je
   Song chronologisch in den Verlauf eingewoben. */
const staendeJeSong = new Map();          // id -> [{stand, plays, likes, kommentare}]
for (const f of [...alleRohdateien('profil'), ...alleRohdateien('privat')]) {
  let j; try { j = lies(f); } catch (e) { continue; }
  const datum = ((j && (j.abgerufenAm || j.erzeugtAm)) ||
                 (path.basename(f).match(/(\d{4}-\d{2}-\d{2})/) || [])[1] || '').slice(0, 10);
  if (!datum) continue;
  for (const c of alsListe(j)) {
    if (!c || !c.id) continue;
    if (!staendeJeSong.has(c.id)) staendeJeSong.set(c.id, []);
    staendeJeSong.get(c.id).push({ stand: datum, plays: c.play_count || 0,
      likes: c.upvote_count || 0, kommentare: c.comment_count || 0 });
  }
}

const profilRoh  = lies(profilDatei);
const ausProfil  = alsListe(profilRoh);
const ausFeed    = alsListe(lies(feedDatei));

// Unveröffentlichte Songs, die in Caspar_Ds Playlists stehen. Sie kommen
// NICHT von der Profilseite - dort steht nur Veröffentlichtes. Sie sind
// trotzdem kuratiert: Caspar_D hat sie selbst in Playlists einsortiert.
// Erkennbar bleiben sie an oeffentlich === false.
/* ALLE privat-Dateien, nicht nur die neueste - dieselbe Regel wie bei
   den timing-Dateien. Das Lesezeichen schreibt seit dem 19.08.2026 bei
   jedem Lauf eine neue, und die traegt nur, was es diesmal geholt hat.
   Laese man allein die neueste, verdraengte ein kleiner Lauf die grosse
   Sammlung vom 17.08.2026. Spaetere Dateien ueberschreiben fruehere je
   Song - der frischere Zaehler gewinnt. */
const privatJeId = new Map();
for (const f of alleRohdateien('privat'))
  for (const c of alsListe(lies(f))) if (c && c.id) privatJeId.set(c.id, c);
const ausPrivat  = [...privatJeId.values()];

/* DIE VIERTE QUELLE: ALBUMEINTRAEGE (Caspar_D, 08.09.2026: neue Titel kommen
   nur ueber public oder ueber die Playlisten, auch wenn sie unpublished sind.
   Playlist schlaegt alles, dann alle published). Ein eigener Titel, der in
   einem Album liegt, gehoert ins Archiv - auch wenn er privat ist und das
   oeffentliche Profil ihn nie zeigt. Die Albumernte traegt je Eintrag das
   volle Clip-Objekt (suno/DATENEXTRAKTION.md), daraus wird der Titeldatensatz.
   Gelesen wird die juengste Albumdatei VOR dem Titelbau; der Albumblock
   weiter unten liest sie fuer die Zugehoerigkeit noch einmal. Nur
   ergaenzend: was Profil, Arbeitsbereich oder Privat-Ernte schon liefern,
   bleibt (eingang.has). Erster Fall: Bei mir klingelt keiner, privat, im
   Album My Industrial Songs, 08.09.2026 - der Titel, mit dem alles anfing. */
const ausAlben = (() => {
  const f = neuesteRohdatei('playlists'); if (!f) return [];
  const r = lies(f) || {}; const clips = r.clips || {}; const seen = new Set(); const aus = [];
  for (const liste of Object.values(clips)) {
    if (!Array.isArray(liste)) continue;
    for (const e of liste) {
      const c = e && typeof e === 'object' ? e.clip : null;
      if (!c || typeof c !== 'object' || !c.id || seen.has(c.id)) continue;
      seen.add(c.id); aus.push(c);
    }
  }
  return aus;
})();
if (ausAlben.length) console.log(`  Albumeintraege als Titelquelle: ${ausAlben.length} Clips`);

// Der eigene handle steht in den Rohdaten. Beim Aufblättern der
// Profilseite rutschen gelegentlich fremde Songs mit hinein -
// aus dem Player oder aus "Gefällt mir"-Bereichen. Die gehören
// nicht ins Archiv.
/* profilRoh.handle gibt es in einer Ernte des Lesezeichens NICHT - dort
   steht der Handle unter profil.handle (browser/morgens.js, Ernte-Objekt).
   Fehlte der Rueckfall auf den Katalog, waere `eigener` beim allerersten
   Lauf eines fremden Bestands null, und dann gilt weiter unten in den
   Alben JEDER Eintrag als fremd: Ton und Bild kaemen fuer eigene Songs
   vom Suno-CDN statt aus /media/<id>/. Leise falsch, nicht kaputt -
   deshalb hier die dritte Quelle. */
const eigener = (profilRoh && profilRoh.handle)
  || (profilRoh && profilRoh.profil && profilRoh.profil.handle)
  || (K.lesen() && K.lesen().profil && K.lesen().profil.handle) || null;

const eingang = new Map();
let fremde = 0;
for (const c of [...ausProfil, ...ausFeed, ...ausPrivat, ...ausAlben]) {
  if (!c || !c.id) continue;
  if (eigener && c.handle && c.handle !== eigener) { fremde++; continue; }
  if (!eingang.has(c.id)) eingang.set(c.id, c);
}
if (fremde) console.log(`  ${fremde} fremde Songs aussortiert (nicht von ${eigener})`);

const profilIds = new Set([...eingang.keys()].filter(id =>
  ausProfil.some(c => c.id === id)));

// Bisherigen Katalog laden, um Verläufe fortzuschreiben
const alt      = K.lesen();
const altSongs = (alt && alt.songs) || {};

console.log(`\n${eingang.size} Songs in den Rohdaten, ${Object.keys(altSongs).length} bereits im Katalog.\n`);

/* Was das Lesezeichen bei Suno ueber den Freischaltstand erfahren hat.
   Das Feld `is_download_unlocked` kommt in den Rohdaten der Ernte gar
   nicht vor - es steht nur in /api/clip/<id>, und das fragt das
   Lesezeichen gezielt ab. Der Server legt die Antworten in
   library/freischaltstand.json; hier werden sie eingepflegt. */
let freischaltStand = {};
try {
  freischaltStand = JSON.parse(fs.readFileSync(path.join(WURZEL, 'library', 'freischaltstand.json'), 'utf8'));
  const n = Object.values(freischaltStand).filter(Boolean).length;
  if (n) console.log(`${n} Titel sind laut Lesezeichen bei Suno freigeschaltet.`);
} catch (e) {}

const songs = { ...altSongs };
let neu = 0, aktualisiert = 0;

for (const roh of eingang.values()) {
  const s = normalisieren(roh);
  s.veroeffentlicht = profilIds.has(s.id) || s.oeffentlich;

  const vorher  = altSongs[s.id];
  /* Verlauf neu weben: bisherige Eintraege + alle Ernte-Staende +
     der heutige, nach Datum geordnet, je Tag der letzte Stand, und
     ein Eintrag nur, wo sich wirklich etwas aendert. Idempotent -
     derselbe Lauf zweimal ergibt denselben Verlauf. */
  const jeTag = new Map();
  for (const e of (vorher && vorher.zaehlerVerlauf) || []) jeTag.set(e.stand, e);
  for (const e of staendeJeSong.get(s.id) || [])
    jeTag.set(e.stand, { stand: e.stand, plays: e.plays, likes: e.likes, kommentare: e.kommentare });
  jeTag.set(heute, { stand: heute, plays: s.plays, likes: s.likes, kommentare: s.kommentare });
  const verlauf = [];
  for (const tag of [...jeTag.keys()].sort()) {
    const e = jeTag.get(tag), l = verlauf[verlauf.length - 1];
    if (!l || l.plays !== e.plays || l.likes !== e.likes || l.kommentare !== e.kommentare)
      verlauf.push(e);
  }

  s.zaehlerVerlauf = verlauf;
  s.zuletztGesehen = heute;
  s.rohdaten       = roh;

  // Wort-Zeitmarken und Wellenform stammen aus einem eigenen
  // Abruf und stecken nicht in den Songdaten. Ohne dieses
  // Übernehmen wären sie bei jedem Neuaufbereiten weg.
  if (vorher && vorher.worte)  { s.worte = vorher.worte; s.welle = vorher.welle || []; }
  /* worteQuelle/lyricsQuelle MUESSEN mitwandern: Ohne sie verliert
     ein Whisper-Song sein Etikett beim naechsten Lauf, der Import
     erkennt ihn nicht mehr, und der Rueckbau erst recht nicht
     (gefunden 20.08.2026 an "Ich dreh mich nicht um!"). */
  for (const f of ['schlaege','abschnitte','wellenStufen','worteV3','worteV2','worteQuelle','lyricsQuelle','whisperInstrumental'])
    if (vorher && vorher[f] !== undefined) s[f] = vorher[f];
  if (vorher && vorher.farben) { s.farben = vorher.farben; }   // aus bin/farben.js

  /* Der Freischaltstand darf nicht verlorengehen, und er darf sich nicht
     zurückdrehen. Zwei getrennte Gründe:

       1. WISSEN SCHLÄGT NICHTWISSEN. Kommt der neue Datensatz aus einer
          Quelle ohne das Feld (die meisten Rohdaten tragen es nicht),
          bliebe sonst ein bereits bekanntes `true` auf der Strecke.
       2. EIN UNLOCK IST DAUERHAFT. Am 11.09.2026 gemessen: ein
          freigeschalteter Titel läßt sich beliebig oft und in allen drei
          Formaten abrufen, ohne daß der Zähler sich bewegt. Ein `false`
          über ein bekanntes `true` zu schreiben hieße, ein bezahltes
          Guthaben zu vergessen — und den Titel künftig wieder als
          kostenpflichtig anzubieten. */
  if (vorher && typeof vorher.freigeschaltet === 'boolean') {
    if (s.freigeschaltet === null || vorher.freigeschaltet === true) {
      s.freigeschaltet = vorher.freigeschaltet;
    }
  }
  if (s.freischaltSperre === null && vorher && vorher.freischaltSperre) {
    s.freischaltSperre = vorher.freischaltSperre;
  }
  /* Das Lesezeichen hat direkt bei Suno nachgesehen - das schlaegt
     alles, was die Ernte nicht weiss. Ein true bleibt ein true. */
  if (typeof freischaltStand[s.id] === 'boolean' &&
      (s.freigeschaltet === null || freischaltStand[s.id] === true)) {
    s.freigeschaltet = freischaltStand[s.id];
  }

  // Die Playlist-Zugehörigkeit steht in einer eigenen Rohdatei
  // (playlists-*.json) und wird weiter unten neu gesetzt. Fehlt die
  // Datei, bliebe sie ohne dieses Übernehmen bei jedem Lauf weg.
  if (vorher && vorher.playlists) { s.playlists = vorher.playlists; }

  songs[s.id] = s;
  if (vorher) aktualisiert++; else neu++;
}

const liste = Object.values(songs)
  .sort((a, b) => (b.erstellt || '').localeCompare(a.erstellt || ''));

// --- Wort-Zeitmarken einpflegen ---------------------------------
// Suno liefert unter /api/gen/<id>/aligned_lyrics/ für jedes Wort
// Anfang und Ende in Sekunden. Damit läuft der Text in der
// Bühnenansicht wortgenau mit. Vorhandene Zeitmarken bleiben
// erhalten, wenn bei einem Lauf keine neuen dabei sind.
// ALLE timing-Dateien werden gelesen, nicht nur die neueste: Ein
// Nachzügler-Abruf für wenige Songs würde sonst die große Sammlung
// verdrängen. Spätere Dateien überschreiben frühere je Song.
for (const timingDatei of alleRohdateien('timing')) {
  const timing = lies(timingDatei) || {};
  let mit = 0, mitSuno = 0;
  const timingSongs = timing.songs || timing;
  /* Die Zeitproben des Lesezeichens (Suno v3) reisen unter dem
     Schluessel __zeitprobe mit - in den Katalog als worteV3, dann
     bietet die Buehne die Spur an, auch wenn die Rohdatei spaeter
     im verarbeitet-Ordner liegt. */
  let mitV3 = 0, mitV2nach = 0;
  if (timingSongs.__zeitprobe)
    for (const [id, o] of Object.entries(timingSongs.__zeitprobe)) {
      if (!songs[id] || !o) continue;
      if (o.v3) { const w = K.v3ZuWorten(o.v3); if (w && w.length) { songs[id].worteV3 = w; mitV3++; } }
      /* Nachgeladene v2 ERSETZT NICHTS (Caspar_D, 20.08.2026: "v2 darf
         Whisper nicht ersetzen - Whisper kennt die Zeitpunkte genau,
         da schlampt Suno"). Sie fuellt nur Songs ganz ohne Marken;
         hat der Song schon Whisper, wird sie eine ZUSAETZLICHE Spur
         (worteV2) fuer die Wahl im Buehnenpult. */
      if (o.v2 && !o.v2.fehler) {
        const roh = Array.isArray(o.v2) ? o.v2 : o.v2.aligned_words;
        if (Array.isArray(roh) && roh.length) {
          const w = roh.map(x => [x.start_s ?? x.start, x.end_s ?? x.end, x.word ?? '']);
          const sg = songs[id];
          if (!(sg.worte && sg.worte.length)) { sg.worte = w; sg.welle = sg.welle || []; sg.worteQuelle = 'suno'; mitV2nach++; }
          else if (sg.worteQuelle === 'whisper') { sg.worteV2 = w; mitV2nach++; }
        }
      }
    }
  for (const [id, t] of Object.entries(timingSongs)) {
    if (id === '__zeitprobe') continue;
    if (!songs[id] || !t) continue;
    if (Array.isArray(t.worte) && t.worte.length) {
      songs[id].worte = t.worte;
      songs[id].welle = t.welle || [];
      songs[id].worteQuelle = 'suno';        // Herkunft ausdruecklich - nie wieder raten
      mit++;
    }
    if (t.schlaege || t.abschnitte || t.wellenStufen) mitSuno++;
    /* Drei weitere Auskuenfte von Suno, seit dem 19.08.2026 - alle aus
       derselben Adressliste der Web-App (docs/suno-api-wege.txt), alle
       nur mit Anmeldung, also ueber das Lesezeichen:

         schlaege     /api/gen/<id>/downbeats          Sunos Schlagerkennung
         abschnitte   /api/gen/<id>/novelty-sections   Sunos Strukturerkennung
         wellenStufen /api/gen/<id>/waveform-aggregates  Huellkurve in Zoomstufen

       Sie liegen in derselben timing-Datei wie die Zeitmarken, weil sie
       auf dieselbe Weise entstehen und denselben Weg gehen. Jedes Feld
       wird fuer sich uebernommen - ein Lauf kann eines haben und das
       andere nicht. */
    if (Array.isArray(t.schlaege) && t.schlaege.length)   songs[id].schlaege     = t.schlaege;
    if (t.v3) { const w = K.v3ZuWorten(t.v3); if (w && w.length) songs[id].worteV3 = w; }
    if (t.abschnitte && typeof t.abschnitte === 'object')  songs[id].abschnitte   = t.abschnitte;
    if (Array.isArray(t.wellenStufen) && t.wellenStufen.length) songs[id].wellenStufen = t.wellenStufen;
  }
  /* Zwei Sorten in derselben Dateiart: Wort-Zeitmarken (Karaoke) und
     Sunos Analyse (Schlaege, Abschnitte, Huellkurve). Die Pakete vom
     Lesezeichen tragen nur letztere - '0 Songs' waere irrefuehrend. */
  console.log(`  Zeitmarken:     ${path.basename(timingDatei)} (${mit} Karaoke, ${mitSuno} Suno-Analyse`
            + (mitV3 || mitV2nach ? `, ${mitV3} v3-Spuren, ${mitV2nach} v2 nachgeladen` : '') + ')');
}

// --- Whisper ---------------------------------------------------
// library/whisper.ndjson (bin/whisper.js): Wort-Zeitmarken, die Whisper
// large-v3 gerechnet hat - NUR fuer Songs, die keine von Suno haben.
// Sunos Ausrichtung kennt den Text und ist besser; Whisper hoert nur.
// Hat ein Song gar keinen Text im Archiv, wird auch der gehoerte Text
// als Lyrics eingetragen. Beides mit Quelle 'whisper', damit die Seite
// sagen kann, was gehoert und was von Suno ist. Letzte Zeile je Song
// gewinnt (die Datei wird angehaengt).
{
  const whisperDatei = path.join(WURZEL, 'library', 'whisper.ndjson');
  if (fs.existsSync(whisperDatei)) {
    let mitWorten = 0, mitText = 0, instrumental = 0;
    const jeSong = new Map();
    for (const z of fs.readFileSync(whisperDatei, 'utf8').split('\n'))
      if (z.trim()) { try { const e = JSON.parse(z); jeSong.set(e.id, e); } catch (x) {} }
    /* Rueckbau: Traegt ein Song Whisper-Woerter, aber whisper.ndjson
       kennt ihn nicht mehr (Zeile geloescht - etwa die 42 Naturklaenge
       der Fokus-Wanderung, 20.08.2026), fliegen sie auch aus dem
       Katalog. Die Datei ist die Quelle, der Katalog ihr Abbild. */
    for (const s of Object.values(songs)) {
      if (s.worteQuelle === 'whisper' && !jeSong.has(s.id)) {
        delete s.worte; delete s.welle; delete s.worteQuelle;
      }
      if (s.lyricsQuelle === 'whisper' && !jeSong.has(s.id)) {
        delete s.lyrics; delete s.lyricsQuelle;
      }
      if (s.whisperInstrumental && !jeSong.has(s.id)) delete s.whisperInstrumental;
    }
    for (const [id, e] of jeSong) {
      const s = songs[id]; if (!s) continue;
      /* Etikett heilen: Sind die Katalog-Woerter Wort fuer Wort die
         aus whisper.ndjson, stammt der Bestand von Whisper - auch
         wenn das Herkunftsfeld unterwegs verloren ging (Fehler vom
         20.08.2026, seither wandert es mit). */
      if (!s.worteQuelle && s.worte && s.worte.length === (e.worte || []).length
          && JSON.stringify(s.worte) === JSON.stringify(e.worte)) s.worteQuelle = 'whisper';
      if (e.schleife) continue;                          // Whisper hat sich verhaspelt - nicht uebernehmen
      if (e.instrumental) { instrumental++; if (!s.worte || !s.worte.length) s.whisperInstrumental = true; continue; }
      /* ZWEITE SPERRE, am Katalog statt am Erkenner (Caspar_D,
         25.08.2026). Whispers eigene Instrumental-Erkennung prueft auf
         ZU WENIG Text (worte.length < 5); eine Halluzination hat aber zu
         viel - "Thank you. Thank you." ueber Regen, singhalesische
         Wortketten ueber Wind. Deshalb hier die Gegenprobe an Sunos
         eigenem Text: Wo der fehlt, ist das Stueck instrumental, und
         dann wird nichts uebernommen. So kamen 35 Stuecke zu
         halluzinierten Zeitmarken (docs/analyse/ERFUNDENES.md). */
      if (!((s.lyrics && s.lyrics.trim()) || (s.text && s.text.trim()))) {
        instrumental++; s.instrumental = true; s.whisperInstrumental = true; continue;
      }
      if (!(s.worte && s.worte.length) || s.worteQuelle === 'whisper') {
        s.worte = e.worte; s.worteQuelle = 'whisper'; mitWorten++;
      }
      if (!(s.lyrics && s.lyrics.trim()) || s.lyricsQuelle === 'whisper') {
        s.lyrics = e.text; s.lyricsQuelle = 'whisper'; mitText++;
      }
    }
    console.log(`  Whisper:        ${jeSong.size} Songs gerechnet — ${mitWorten} davon füllen fehlende Zeitmarken im Katalog, ${mitText} fehlende Texte, ${instrumental} instrumental; der Rest ist zweite Spur für die Bühne`);
  }
}

// --- Alben (Playlists) ------------------------------------------
// Aus library/roh/playlists-*.json. Bewusst NICHT aus der Vorfassung
// zusammengesetzt, sondern jedes Mal neu aus den Rohdaten gebaut -
// damit fällt die Zuordnung gar nicht erst unter die Übernahmeregel
// oben. Fehlt die Rohdatei, bleibt der bisherige Stand stehen.
//
// Die Einträge enthalten AUCH Songs, die nicht im Archiv liegen:
// fremde Songs anderer Urheber. Sie bleiben als Eintrag erhalten,
// sonst bekäme die Reihenfolge Löcher und die Playlist wäre eine
// andere als bei Suno. Erkennbar an eigen === false.
//
// DER RIEGEL, 08.09.2026. Bis dahin genügte die blosse EXISTENZ einer
// Rohdatei, um `playlists` auf {} zu setzen - vor jeder Prüfung des
// Inhalts. Trug die Datei den falschen Schlüssel oder war sie leer,
// lief die Schleife null Mal, der Katalog bekam ein leeres Objekt, und
// 25 Alben mit 599 Einträgen waren weg. Ohne eine einzige
// Fehlermeldung, und die Rohdatei löschte sich am Ende des Laufs auch
// noch selbst (der Löschblock ganz unten kennt die Art 'playlists').
// Seitdem gilt ein Riegel gegen stillen Verlust - und seit dem
// 08.09.2026 abends hängt er an EINER Frage: Ist die Ernte vollständig?
// DIE SPIEGELREGEL (Caspar_D, 08.09.2026, wörtlich): "die Suno-Alben
// folgen genau dem, was Suno im Datenbestand hat." Eine Ernte, die sich
// als vollständig ausweist (alle Köpfe geblättert, das Ende gesehen,
// jeder Inhalt geholt - browser/morgens.js setzt die Flagge nur dann),
// IST Sunos Stand: ein Album, das kleiner wurde, wird kleiner
// geschrieben, ein leeres leer, ein fehlendes entfernt. Eine Ernte, die
// das nicht von sich sagt, darf nichts verkleinern und nichts entfernen
// - jedes Album, das kleiner würde oder fehlt, behält seinen alten
// Stand, und der Lauf sagt es. Verglichen wird immer relativ, altes
// Album gegen neues Album - nie gegen eine feste Zahl, denn ein fremder
// Bestand hat andere Größen.
//
// DIE KANDIDATENREGEL (Caspar_D, 08.09.2026 abends, wörtlich):
// "Löschungen in Alben nach zwei übereinstimmenden Läufen, die
// mindestens 2 h auseinander liegen." WARUM der Zusatz zur Spiegelregel:
// Die Flagge `vollstaendig` aus browser/morgens.js wurde am selben Tag
// viermal gegengelesen, und jede Runde fand eine neue Antwortform, mit
// der Suno per HTTP 200 lügen kann - eine Kopfzahl 0 neben leerem Inhalt,
// eine Zahl als Zeichenkette, Leerraum, false, [], -1 als Anzahl, eine
// verlorene zweite Seite beim einzigen mehrseitigen Album. Die
// Einzelfixes konvergieren nicht: Suno hat mehr Formen als wir Riegel.
// Deshalb gilt Sunos Stand für ERGÄNZUNGEN sofort (neues Album,
// gewachsenes Album, neue Einträge - da kann eine Lüge nichts
// wegnehmen), für WEGNAHMEN aber erst nach Bestätigung: Ein Album, das
// fehlt oder kleiner kommt, wird als Kandidat vermerkt
// (katalog.albenKandidaten) und erst dann gelöscht bzw. verkleinert,
// wenn eine SPÄTERE vollständige Ernte, mindestens 2 h danach, DENSELBEN
// Stand zeigt. Zeigt sie den alten Stand, war es ein Wackler und der
// Kandidat fällt; zeigt sie einen dritten Stand, fängt die Uhr von vorn
// an. Unvollständige Ernten zählen nie, weder als erste noch als zweite.
// Die 2 h messen sich an abgerufenAm der Rohdateien - nicht an der
// Katalogzeit (die ist immer "jetzt") und nicht an Date.now() (sonst
// zählt eine falsche Uhr, wenn ein Lauf Tage später nachgeholt wird).
// Ein wirklich leeres Album ist ein "kleiner" mit leerer Id-Menge und
// braucht dieselbe Bestätigung - gewollt, denn genau so sah jede der
// vier Lügen aus. Die Kandidaten überleben Neubauten des Katalogs, die
// Oberfläche zeigt sie (noch) nicht, das Protokoll unten nennt sie.
/* EINE Aufnahme des Ordners, für Auswahl UND Löschliste. Bis zum
   08.09.2026 abends wurde die Löschliste ganz unten NEU aus dem Ordner
   gelesen - eine playlists-Datei, die zwischen Auswahl und Löschen
   ankam (das Lesezeichen läuft nebenher), wäre ungelesen gelöscht
   worden. Gelöscht wird nur, was HIER gesehen wurde. */
const playlistDateienGesehen = alleRohdateien('playlists');
const playlistDatei = playlistDateienGesehen.length
  ? playlistDateienGesehen[playlistDateienGesehen.length - 1] : null;
/* Gelesen wird EINE Datei, die jüngste. Die älteren bleiben liegen und
   kommen beim nächsten Lauf an die Reihe (dann sind sie die jüngsten) -
   bis zum 08.09.2026 abends wurden sie hier mitgezählt und unten
   ungelesen gelöscht: zwei Klicks hintereinander, der zweite halb, und
   die gute Ernte des ersten war weg, ohne je gelesen worden zu sein. */
if (playlistDateienGesehen.length > 1)
  console.log(`  Alben:          ${playlistDateienGesehen.length - 1} ältere Albumernte(n) übersprungen, `
            + `bleiben für den nächsten Lauf liegen`);
const albenVorher   = (alt && alt.playlists) || {};
let   playlists     = albenVorher;
let   albenRohBehalten = false;      // unbrauchbare Rohdatei nicht löschen
/* WANN die Alben zuletzt wirklich von Suno geholt wurden - nicht wann
   der Katalog zuletzt gebaut wurde. Kommt aus abgerufenAm der Rohdatei
   und wird im Katalog fortgeschrieben (katalog.albenStand), damit die
   Meldung unten nicht bei jedem Bau "heute" sagt. */
let   albenStand    = (alt && alt.albenStand) || null;
/* Die Löschkandidaten (Kandidatenregel, siehe oben): je Album-Id
   { zustand: 'fehlt', seit } oder { zustand: 'kleiner', seit, eintraege }
   - `seit` ist das abgerufenAm der Ernte, die den Zustand zuerst zeigte,
   `eintraege` die sortierte Menge der Song-Ids, die diese Ernte noch
   lieferte. Sie kommen aus dem alten Katalog und werden unverändert
   fortgeschrieben, solange keine vollständige Ernte etwas anderes sagt -
   ein Neubau ohne Rohdatei, eine unvollständige oder überholte Ernte
   lässt sie stehen. Ein verwaister Kandidat (sein Album ist gar nicht
   mehr im Katalog) wird beim Schreiben unten fallengelassen. */
const albenKandidatenVorher = (alt && alt.albenKandidaten && typeof alt.albenKandidaten === 'object'
                               && !Array.isArray(alt.albenKandidaten)) ? alt.albenKandidaten : {};
let   albenKandidaten = { ...albenKandidatenVorher };
const BESTAETIGUNG_MS = 2 * 60 * 60 * 1000;   // Caspar_D: "mindestens 2 h auseinander"
const stundenText = (ms) => (ms / 3600000).toFixed(1).replace('.', ',') + ' h';
const seitText = (iso) => {
  const t = Date.parse(iso);
  return Number.isFinite(t)
    ? new Date(t).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : String(iso);
};
/* Die Id-Menge eines Albums: nur brauchbare Einträge (mit songId),
   sortiert und ohne Doppelte - so vergleicht sich "derselbe Stand"
   unabhängig von der Reihenfolge, in der Suno geliefert hat. */
const albenIdMenge = (p) => Array.from(new Set((Array.isArray(p && p.eintraege) ? p.eintraege : [])
  .map(e => e && e.songId).filter(Boolean))).sort();
const gleicheMenge = (a, b) => Array.isArray(a) && Array.isArray(b)
  && a.length === b.length && a.every((x, i) => x === b[i]);

const albenEintragZahl = (p) => (Array.isArray(p && p.eintraege) ? p.eintraege.length : 0);
const albenSumme = (o) => Object.values(o || {}).reduce((n, p) => n + albenEintragZahl(p), 0);
/* FUER DEN VERGLEICH zaehlt nur, was BRAUCHBAR ist: ein Eintrag ohne
   songId ist keiner. Legt ein Ernter die Clips nackt ab statt im
   Umschlag {clip, relative_index, created_at}, hat das Album weiterhin
   die richtige ANZAHL Eintraege - aber jeder einzelne traegt songId
   null, titel '(ohne Titel)' und gilt als fremd, und kein einziger
   Rueckverweis entsteht. Nach der blossen Laenge gemessen saehe das
   aus wie 'gleich gross geblieben' und liefe glatt durch. */
const albenBrauchbar = (p) => (Array.isArray(p && p.eintraege)
  ? p.eintraege.filter(e => e && e.songId).length : 0);

if (!playlistDatei) {
  /* Vorher schwieg dieser Fall. Das Lesezeichen holte drei Wochen lang
     null Alben, hier fiel deshalb nie eine Rohdatei an, der alte Stand
     wurde stillschweigend fortgeschrieben - und die Schlusszeile meldete
     ihn, als wäre er frisch. */
  /* alt.erstelltAm wäre der letzte KATALOGBAU - der ist immer "heute",
     und die Meldung, die das Schweigen brechen soll, sagte damit nie
     etwas. Der Zeitpunkt der letzten ALBUMERNTE steht in albenStand;
     fehlt er, ist die Ernte älter als dieses Feld (08.09.2026). */
  const stand = albenStand ? 'letzte Albumernte vom ' + String(albenStand).slice(0, 10)
                           : 'Zeitpunkt der letzten Albumernte unbekannt';
  console.log(`  Alben:          keine Rohdatei — Stand unverändert, ${stand} `
            + `(${Object.keys(albenVorher).length} Alben, ${albenSumme(albenVorher)} Einträge)`);
}

if (playlistDatei) {
  let pRoh = null;
  try { pRoh = lies(playlistDatei); } catch (e) { pRoh = null; }
  const koepfe = (pRoh && Array.isArray(pRoh.playlists)) ? pRoh.playlists : [];
  const rohClips = (pRoh && pRoh.clips && typeof pRoh.clips === 'object'
                    && !Array.isArray(pRoh.clips)) ? pRoh.clips : {};
  /* Nur eine Ernte, die sich selbst als vollständig ausweist, ist Sunos
     Stand (Spiegelregel, siehe oben): nur sie darf ein Album kleiner
     schreiben oder ein fehlendes entfernen - und seit dem 08.09.2026
     abends auch das nur als zweite von zwei übereinstimmenden Ernten,
     mindestens 2 h auseinander (Kandidatenregel, siehe oben). Fehlt das
     Feld (alte oder wiederhergestellte Rohdatei), gilt das Vorsichtige:
     nichts schrumpft, nichts verschwindet, kein Kandidat rührt sich. */
  const vollstaendig = !!(pRoh && pRoh.vollstaendig === true);
  /* ÜBERHOLT? Weil ältere Ernten liegenbleiben (siehe die Auswahl oben),
     kann hier eine Datei ankommen, die ÄLTER ist als der Albumstand im
     Katalog - die jüngere wurde im Lauf davor schon übernommen. Sunos
     Stand von damals über den von heute zu schreiben, wäre kein Spiegel,
     sondern ein Rückschritt. So eine Datei wird gelesen, als überholt
     erkannt und wie gelesen behandelt (unten gelöscht) - übernommen wird
     aus ihr nichts. */
  const ueberholt = !!(pRoh && pRoh.abgerufenAm && albenStand
                       && String(pRoh.abgerufenAm) < String(albenStand));

  const frisch = {};
  for (const p of koepfe) {
    if (!p || !p.id) continue;
    /* Härten gegen krumme Einträge: ein Objekt statt einer Liste warf
       bei .slice() einen TypeError, ein null-Eintrag bei e.clip - und
       ein einziger solcher Eintrag liess den ganzen Lauf abstürzen.
       Was keine Liste ist, zählt als leer (der Riegel unten behält
       dann den alten Stand); was kein Objekt ist, fällt heraus. */
    const rohListe = Array.isArray(rohClips[p.id]) ? rohClips[p.id] : [];
    const eintraege = rohListe
      .filter(e => e && typeof e === 'object')
      .sort((a, b) => (a.relative_index || 0) - (b.relative_index || 0))
      .map(e => {
        const c = (e.clip && typeof e.clip === 'object') ? e.clip : {};
        const eigen = c.handle === eigener;
        return {
          songId:       c.id || null,
          position:     e.relative_index ?? null,
          hinzugefuegt: e.created_at || null,
          titel:        c.title || '(ohne Titel)',
          handle:       c.handle || null,
          anzeigename:  c.display_name || null,
          eigen,
          oeffentlich:  c.is_public !== false,
          // Nur für FREMDE Einträge: Sie liegen nicht im Archiv und
          // werden direkt von Sunos CDN geholt - Ton wie Bild. Das
          // CDN antwortet ohne Anmeldung und mit
          // "access-control-allow-origin: *", weshalb der Ton auch
          // für die Web-Audio-Analyse lesbar bleibt (crossOrigin).
          // Bei eigenen Songs wäre das doppelt gemoppelt, die liegen
          // unter /media/<id>/.
          audioUrl:     eigen ? null : (c.audio_url || null),
          bildUrl:      eigen ? null : (c.image_large_url || c.image_url || null),
        };
      });

    frisch[p.id] = {
      id:            p.id,
      name:          p.name || '(ohne Namen)',
      beschreibung:  p.description || '',
      bildUrl:       p.image_url || null,
      oeffentlich:   !!p.is_public,
      herkunft:      'suno',            // später auch 'lokal' - siehe BACKLOG
      anzahlLautSuno: p.num_total_results ?? null,
      dauer:         p.total_duration ?? null,
      plays:         p.play_count ?? 0,
      likes:         p.upvote_count ?? 0,
      eintraege,
    };
  }

  /* Lauter Alben ohne einen einzigen brauchbaren Eintrag: der
     Kopf-ohne-Inhalt-Fall (die Köpfe von Suno tragen playlist_clips als
     leeres Array). Diese Sperre hängt AUSDRÜCKLICH NICHT an
     vollstaendig: Eine Ernte, in der kein einziges Album einen Eintrag
     hat, ist nach aller Erfahrung eine halbe Ernte, keine Sammlung
     lauter leerer Alben - und eine halbe Ernte mit richtiger Flagge
     löschte sonst alles. Ein EINZELNES leeres Album in einer
     vollständigen Ernte geht davon unberührt durch - und wird in der
     Schleife unten zum Löschkandidaten "kleiner" mit leerer Id-Menge
     (Kandidatenregel): geleert wird es erst, wenn eine zweite
     vollständige Ernte 2 h später dasselbe sagt. */
  const nurLeere = Object.keys(frisch).length
                && !Object.values(frisch).some(p => albenBrauchbar(p));

  if (ueberholt) {
    console.log(`  Alben:          ${path.basename(playlistDatei)} ist vom `
              + `${String(pRoh.abgerufenAm).slice(0, 16).replace('T', ' ')}, der Katalog hat schon den Stand vom `
              + `${String(albenStand).slice(0, 16).replace('T', ' ')} — überholt, nicht übernommen `
              + `(${Object.keys(albenVorher).length} Alben, ${albenSumme(albenVorher)} Einträge bleiben)`);
    playlists = albenVorher;
  } else if (!Object.keys(frisch).length || nurLeere) {
    /* Kein einziges Album, oder lauter Alben ohne einen einzigen
       Eintrag - der Kopf-ohne-Inhalt-Fall (die Köpfe von Suno tragen
       playlist_clips als leeres Array). Beides würde den Bestand
       löschen. Also: Stand behalten, laut sagen, und die Rohdatei NICHT
       wegräumen - sonst wäre nach genau einem Lauf weder der Katalog-
       stand noch die einzige Kopie der Albumdaten da. */
    console.log(`  Alben:          ${path.basename(playlistDatei)} enthält `
              + `${Object.keys(frisch).length} Alben und ${albenSumme(frisch)} Einträge `
              + `(davon ${Object.values(frisch).reduce((n, p) => n + albenBrauchbar(p), 0)} brauchbar) — `
              + `NICHT übernommen, Stand unverändert `
              + `(${Object.keys(albenVorher).length} Alben, ${albenSumme(albenVorher)} Einträge). `
              + `Die Rohdatei wird nach dem Lauf in .abgelehnt umbenannt.`);
    albenRohBehalten = true;
    playlists = albenVorher;
  } else {
    playlists = { ...albenVorher };
    albenStand = (pRoh && pRoh.abgerufenAm)
      || (path.basename(playlistDatei).match(/(\d{4}-\d{2}-\d{2})/) || [])[1] || albenStand;
    const geschrumpft = [], verkleinert = [], neueAlben = [], entfallen = [], behaltenWeilFehlend = [];
    const kandidatNeu = [], kandidatWartet = [], kandidatVerworfen = [];

    /* Die Uhr der Kandidatenregel: abgerufenAm DIESER Ernte, als Zeit.
       Fehlt es oder ist es kein Datum, kann diese Ernte weder einen
       Kandidaten setzen noch bestätigen - sie zählt für Wegnahmen wie
       eine unvollständige. (Der Server schreibt das Feld immer; nur
       eine von Hand hergestellte Rohdatei kommt ohne.) */
    const abgerufen = (pRoh && pRoh.abgerufenAm && Number.isFinite(Date.parse(pRoh.abgerufenAm)))
      ? String(pRoh.abgerufenAm) : null;
    const darfWegnehmen = vollstaendig && abgerufen != null;
    if (vollstaendig && abgerufen == null)
      console.log(`  Alben:          ${path.basename(playlistDatei)} nennt kein brauchbares abgerufenAm — `
                + `zählt für Löschungen wie eine unvollständige Ernte`);
    /* Wie lange der Kandidat schon steht, gemessen an den Rohdaten-Uhren;
       null, wenn sein `seit` unlesbar ist (dann wird er neu gesetzt). */
    const alterMs = (k) => {
      const t = Date.parse(k && k.seit);
      return Number.isFinite(t) ? Date.parse(abgerufen) - t : null;
    };

    for (const [id, p] of Object.entries(frisch)) {
      const a = albenVorher[id];
      if (!a) { playlists[id] = p; neueAlben.push(p.name); continue; }
      /* WEGNAHME heisst: ein bisheriger Eintrag fehlt in der Ernte - nicht:
         es sind weniger. Der Gegenleser der Kandidatenregel (08.09.2026,
         spaet) hat es nachgespielt: gleich viele, aber ANDERE Eintraege
         (ein Eintrag doppelt, ein fremder dazwischen, die Seite eines
         anderen Albums) gingen als Ergaenzung sofort durch und warfen die
         alten weg. Deshalb vergleicht die Entscheidung die Id-Mengen:
         Ist die alte Menge Teil der neuen, ist es eine Ergaenzung; sonst
         eine Wegnahme, und die braucht die Bestaetigung. */
      const altMenge = albenIdMenge(a), neuMenge = new Set(albenIdMenge(p));
      if (!altMenge.every(x => neuMenge.has(x))) {
        if (!darfWegnehmen) {
          /* Unvollständige Ernte und weniger als vorher: irgendwo ist
             etwas verlorengegangen - eine Seite, ein Token, eine
             Antwort. Der alte Stand bleibt, der Kandidat (falls einer
             steht) bleibt unberührt, und es steht hier im Klartext. */
          geschrumpft.push(`${a.name} ${albenBrauchbar(p)}<${albenBrauchbar(a)}`);
          continue;
        }
        /* Kandidatenregel (siehe oben): die Ernte ist ganz und sagt
           "kleiner" - das kann Sunos Wahrheit sein oder die fünfte Form
           der Lüge. Übernommen wird erst, wenn eine spätere vollständige
           Ernte, mindestens 2 h danach, DIESELBE Id-Menge liefert. */
        const menge = albenIdMenge(p);
        const k = albenKandidaten[id];
        const alter = k && k.zustand === 'kleiner' && gleicheMenge(k.eintraege, menge) ? alterMs(k) : null;
        if (alter != null && alter >= BESTAETIGUNG_MS) {
          verkleinert.push(`${a.name}: bestätigt nach ${stundenText(alter)} — übernommen `
                         + `(${albenBrauchbar(a)}→${albenBrauchbar(p)} Einträge)`);
          delete albenKandidaten[id];
          playlists[id] = p;
          continue;
        }
        if (alter != null) {
          kandidatWartet.push(`${a.name} (kleiner, ${albenBrauchbar(a)}→${albenBrauchbar(p)}, `
                            + `noch ${stundenText(BESTAETIGUNG_MS - alter)})`);
        } else {
          /* Kein Kandidat, ein anderer Zustand oder eine andere Id-Menge
             (ein dritter Stand): Uhr von vorn. */
          kandidatNeu.push(`${a.name} (kleiner, ${albenBrauchbar(a)}→${albenBrauchbar(p)}`
                         + `${k ? ', Kandidat neu gesetzt' : ''})`);
          albenKandidaten[id] = { zustand: 'kleiner', seit: abgerufen, eintraege: menge };
        }
        continue;                                   // alter Stand bleibt
      }
      /* Gleich groß oder gewachsen: Sunos Stand gilt sofort (Ergänzungen
         brauchen keine Bestätigung). Stand dazu ein Kandidat, war der
         ein Wackler. */
      if (albenKandidaten[id]) {
        kandidatVerworfen.push(`${a.name} (war ${albenKandidaten[id].zustand}, ist wieder da)`);
        delete albenKandidaten[id];
      }
      playlists[id] = p;
    }

    for (const id of Object.keys(albenVorher)) {
      if (frisch[id]) continue;
      const name = albenVorher[id].name;
      if (!darfWegnehmen) { behaltenWeilFehlend.push(name); continue; }
      /* Kandidatenregel für ein fehlendes Album: erst vermerken, beim
         zweiten Mal (>= 2 h später, wieder vollständig, wieder fehlt)
         entfernen. */
      const k = albenKandidaten[id];
      const alter = k && k.zustand === 'fehlt' ? alterMs(k) : null;
      if (alter != null && alter >= BESTAETIGUNG_MS) {
        entfallen.push(`${name}: bei Suno nicht mehr vorhanden, bestätigt nach ${stundenText(alter)} — entfernt`);
        delete albenKandidaten[id];
        delete playlists[id];
      } else if (alter != null) {
        kandidatWartet.push(`${name} (fehlt, noch ${stundenText(BESTAETIGUNG_MS - alter)})`);
      } else {
        kandidatNeu.push(`${name} (fehlt${k ? ', Kandidat neu gesetzt' : ''})`);
        albenKandidaten[id] = { zustand: 'fehlt', seit: abgerufen };
      }
    }

    // Rückverweis am Song, damit die Oberfläche nicht suchen muss
    for (const s of Object.values(songs)) s.playlists = [];
    for (const p of Object.values(playlists))
      for (const e of p.eintraege || [])
        if (e.songId && songs[e.songId] && !songs[e.songId].playlists.includes(p.id))
          songs[e.songId].playlists.push(p.id);

    const fremdEintraege = Object.values(playlists)
      .reduce((n, p) => n + (p.eintraege || []).filter(e => !e.eigen).length, 0);
    console.log(`  Alben:          ${path.basename(playlistDatei)} `
              + `(${Object.keys(playlists).length} Stück, ${albenSumme(playlists)} Einträge, `
              + `davon ${fremdEintraege} fremd)`);
    if (neueAlben.length)
      console.log(`                  neu: ${neueAlben.join(', ')}`);
    if (verkleinert.length)
      console.log(`                  bei Suno kleiner geworden: ${verkleinert.join('; ')}`);
    if (geschrumpft.length)
      console.log(`                  RIEGEL — kam kleiner herein als im Katalog, Ernte unvollständig, alter Stand behalten: `
                + geschrumpft.join('; '));
    if (behaltenWeilFehlend.length)
      console.log(`                  in dieser Ernte nicht enthalten, Ernte unvollständig, alter Stand behalten: `
                + behaltenWeilFehlend.join(', '));
    if (entfallen.length)
      console.log(`                  ${entfallen.join('; ')}`);
    if (kandidatNeu.length)
      console.log(`                  Löschkandidat vermerkt, alter Stand bleibt bis zur Bestätigung (zweite vollständige Ernte, mindestens 2 h später): `
                + kandidatNeu.join('; '));
    if (kandidatWartet.length)
      console.log(`                  Löschkandidat bestätigt sich, aber zu früh — alter Stand bleibt: `
                + kandidatWartet.join('; '));
    if (kandidatVerworfen.length)
      console.log(`                  Kandidat verworfen, war ein Wackler: ${kandidatVerworfen.join('; ')}`);
    /* Kopfzahl gegen Geliefertes: Suno liefert bei Caspar_D sechs
       Eintraege dauerhaft nicht aus (kein Sammelfehler). Bisher wurde
       anzahlLautSuno abgelegt und nirgends geprueft - eine verlorene
       Seite sah genauso aus wie diese bekannte Luecke. */
    const luecken = Object.values(playlists)
      .filter(p => p.anzahlLautSuno != null && albenEintragZahl(p) < p.anzahlLautSuno)
      .map(p => `${p.name} ${albenEintragZahl(p)}/${p.anzahlLautSuno}`);
    if (luecken.length)
      console.log(`                  weniger Einträge als Suno im Kopf nennt: ${luecken.join(', ')}`);
  }
}

/* --- WAV-Originale vermerken ---------------------------------
   Sie stammen NICHT aus den Rohdaten, sondern liegen als Datei
   daneben - deshalb wird bei jedem Lauf im Dateisystem nachgesehen
   statt aus der Vorfassung übernommen. Das ist verlässlich und kann
   nicht still verlorengehen.

   Am Song steht die Größe in Bytes; 0 bzw. fehlend heißt: kein WAV. */
let mitWav = 0, wavBytes = 0;
for (const s of Object.values(songs)) {
  const f = path.join(SONGS, s.id, 'audio.wav');
  if (fs.existsSync(f)) { s.wav = fs.statSync(f).size; mitWav++; wavBytes += s.wav; }
  else delete s.wav;
}
if (mitWav) console.log(`  WAV-Originale:  ${mitWav} Songs `
  + `(${(wavBytes/1073741824).toFixed(1)} GB)`);

// Angaben zur Person - Autorenname, Profiltext, Suno-Zahlen.
// Bleibt erhalten, auch wenn bei einem Lauf keine neue Fassung
// vorliegt.
const profilInfoDatei = neuesteRohdatei('profilinfo');
const profil = lies(profilInfoDatei) || (alt && alt.profil) || null;
if (profilInfoDatei) console.log('  Profilangaben: ', path.basename(profilInfoDatei));

/* Welche Dateien dieser Lauf gelesen hat. Sie werden weiter unten
   GELOESCHT, erst nach erfolgreichem Schreiben des Katalogs.

   Der Kommentar hier sagte bis zum 25.08.2026 etwas anderes: sie
   wanderten nach roh/verarbeitet/ und blieben als Tagebuch erhalten.
   Das war einmal so und ist seit dem 20.08.2026 nicht mehr wahr
   (Caspar_D: "wozu das mitfuehren und Speicherplatz vergeuden"). Der
   Code darunter loescht, der Kommentar behauptete das Gegenteil - und
   aus dieser Behauptung ist eine falsche Sicherungsanweisung in README
   und START-HIER gewachsen: "Nur library/roh/ sichern". Wer dem folgte,
   sicherte einen fast leeren Ordner und haette den Katalog verloren.

   Unersetzlich ist library/katalog.json.gz. */
const verarbeitet = [
  ...['profil','privat','timing','profilinfo','feed'].flatMap(alleRohdateien),
  /* playlists: NUR die tatsaechlich GELESENE Datei (playlistDatei), nicht
     alle gesehenen. Bis zum 08.09.2026 abends stand hier die ganze
     Aufnahme von oben - gelesen wurde aber nur die juengste, und die
     aelteren gingen ungelesen mit in den Papierkorb. Sie bleiben jetzt
     liegen, der naechste Lauf nimmt sie sich vor (oder erkennt sie als
     ueberholt). Und die gelesene Datei, aus der oben nichts Brauchbares
     zu holen war, wird NICHT geloescht - sonst waere nach genau einem
     Lauf weder der Albumstand im Katalog noch die einzige Kopie der
     Albumdaten da. Sie wird stattdessen unten in .abgelehnt umbenannt
     (albenAbgelehnt): so bleibt sie erhalten, zaehlt aber weder hier
     noch in /api/morgen/unverarbeitet je wieder als "wartet auf den
     roten Knopf". */
  ...(playlistDatei && !albenRohBehalten ? [playlistDatei] : []),
];
const albenAbgelehnt = (albenRohBehalten && playlistDatei) ? playlistDatei : null;

/* Verwaiste Kandidaten fallen lassen (ihr Album ist nicht mehr im
   Katalog - nach einer bestätigten Löschung ist der Kandidat ohnehin
   weg, das hier ist der Gürtel zum Hosenträger). Und die wartenden
   nennen, bei JEDEM Lauf, auch ohne Rohdatei: sie sind sonst unsichtbar,
   bis die Oberfläche sie einmal zeigt. */
for (const id of Object.keys(albenKandidaten))
  if (!playlists[id]) delete albenKandidaten[id];
{
  const wartend = Object.entries(albenKandidaten)
    .map(([id, k]) => `${playlists[id].name} (${k.zustand} seit ${seitText(k.seit)})`);
  if (wartend.length)
    console.log(`  Alben:          ${wartend.length} Löschkandidat${wartend.length === 1 ? '' : 'en'} `
              + `warte${wartend.length === 1 ? 't' : 'n'} auf Bestätigung: ${wartend.join(', ')}`);
}

const bericht = K.schreiben({
  erstelltAm:      new Date().toISOString(),
  anzahl:          liste.length,
  veroeffentlicht: liste.filter(s => s.veroeffentlicht).length,
  spielzeit:       liste.reduce((s, x) => s + (x.dauer || 0), 0),
  zeitraum: {
    von: liste[liste.length - 1]?.erstellt || null,
    bis: liste[0]?.erstellt || null,
  },
  profil,
  playlists,
  albenStand,
  albenKandidaten,
  songs,
});

// --- Alte Einzeldateien aufräumen -------------------------------
// Sie stammen aus der ersten Fassung und verschwenden auf exFAT
// je ein volles Megabyte. Ihr Inhalt steckt jetzt im Katalog.
let entfernt = 0, freigeworden = 0;
if (fs.existsSync(SONGS)) {
  for (const d of fs.readdirSync(SONGS)) {
    for (const name of ['meta.json', 'lyrics.txt']) {
      const f = path.join(SONGS, d, name);
      if (fs.existsSync(f)) {
        freigeworden += 1048576;                          // ein Block je Datei
        fs.unlinkSync(f);
        entfernt++;
      }
    }
  }
}
if (fs.existsSync(ALT_INDEX)) { fs.unlinkSync(ALT_INDEX); entfernt++; }

// --- Bericht ----------------------------------------------------

const summe = (f) => liste.reduce((s, x) => s + (f(x) || 0), 0);

console.log(`neu angelegt:  ${neu}`);
console.log(`aktualisiert:  ${aktualisiert}`);
console.log(`\nKatalog: ${bericht.datei}`);
console.log(`  ${(bericht.bytes/1024).toFixed(0)} KB gepackt `
          + `(aus ${(bericht.ungepackt/1048576).toFixed(1)} MB, `
          + `Faktor ${(bericht.ungepackt/bericht.bytes).toFixed(1)})`);
console.log(`  Songs:          ${liste.length}`);
console.log(`  veröffentlicht: ${liste.filter(s => s.veroeffentlicht).length}`);
console.log(`  privat:         ${liste.filter(s => !s.oeffentlich).length}`);
console.log(`  Alben:          ${Object.keys(playlists).length}`
          + ` mit ${albenSumme(playlists)} Einträgen`
          + ` (${Object.values(playlists).filter(p => !p.oeffentlich).length} privat)`);
console.log(`  mit Lyrics:     ${liste.filter(s => s.lyrics && s.lyrics.trim()).length}`);
console.log(`  mit Video:      ${liste.filter(s => s.videoUrl).length}`);
console.log(`  Remixes:        ${liste.filter(s => s.istRemix).length}`);
console.log(`  Spielzeit:      ${(summe(s => s.dauer)/3600).toFixed(1)} Stunden`);
console.log(`  Zeitraum:       ${liste[liste.length-1]?.erstellt?.slice(0,10)}`
          + ` bis ${liste[0]?.erstellt?.slice(0,10)}`);

if (entfernt) {
  console.log(`\nAufgeräumt: ${entfernt} alte Einzeldateien entfernt`);
  console.log(`  (belegten auf dieser exFAT-Platte rund ${(freigeworden/1073741824).toFixed(2)} GB)`);
}

// --- Verarbeitete Rohdateien loeschen ---------------------------
// Der Katalog ist geschrieben und traegt alles: je Song das rohe
// Clip-Objekt (rohdaten), die Zeitmarken, den eingewobenen
// Zaehlerverlauf; dazu seine eigene Backup-Kopie. Die Rohdateien
// noch aufzuheben waere doppelte Buchfuehrung auf einer exFAT-Platte
// (Caspar_D, 20.08.2026: "wozu das mitfuehren und Speicherplatz
// vergeuden"). roh/ enthaelt damit immer genau das Unverarbeitete.
if (verarbeitet.length) {
  let geloescht = 0, bytes = 0;
  for (const f of verarbeitet) {
    try { bytes += fs.statSync(f).size; fs.unlinkSync(f); geloescht++; }
    catch (e) { /* schon weg - egal */ }
  }
  console.log(`\nAufgeräumt: ${geloescht} verarbeitete Rohdateien gelöscht (${(bytes/1048576).toFixed(0)} MB — alles steckt im Katalog)`);
}
/* Die abgelehnte playlists-Rohdatei (siehe oben) bekommt die Endung
   .abgelehnt: Inhalt bleibt, aber weder alleRohdateien() noch der
   Zaehler im Server sehen sie noch - beide fragen nach .json. */
if (albenAbgelehnt) {
  try { fs.renameSync(albenAbgelehnt, albenAbgelehnt + '.abgelehnt');
        console.log(`  ${path.basename(albenAbgelehnt)} → .abgelehnt (unbrauchbar, aber aufgehoben)`); }
  catch (e) { console.log(`  ${path.basename(albenAbgelehnt)} konnte nicht umbenannt werden: ${e.message}`); }
}
