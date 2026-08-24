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

// Der eigene handle steht in den Rohdaten. Beim Aufblättern der
// Profilseite rutschen gelegentlich fremde Songs mit hinein -
// aus dem Player oder aus "Gefällt mir"-Bereichen. Die gehören
// nicht ins Archiv.
const eigener = (profilRoh && profilRoh.handle)
  || (K.lesen() && K.lesen().profil && K.lesen().profil.handle) || null;

const eingang = new Map();
let fremde = 0;
for (const c of [...ausProfil, ...ausFeed, ...ausPrivat]) {
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

// --- Playlists --------------------------------------------------
// Aus library/roh/playlists-*.json. Bewusst NICHT aus der Vorfassung
// zusammengesetzt, sondern jedes Mal neu aus den Rohdaten gebaut -
// damit fällt die Zuordnung gar nicht erst unter die Übernahmeregel
// oben. Fehlt die Rohdatei, bleibt der bisherige Stand stehen.
//
// Die Einträge enthalten AUCH Songs, die nicht im Archiv liegen:
// fremde Songs anderer Urheber. Sie bleiben als Eintrag erhalten,
// sonst bekäme die Reihenfolge Löcher und die Playlist wäre eine
// andere als bei Suno. Erkennbar an eigen === false.
const playlistDatei = neuesteRohdatei('playlists');
let playlists = (alt && alt.playlists) || {};

if (playlistDatei) {
  const pRoh = lies(playlistDatei) || {};
  playlists = {};

  for (const p of pRoh.playlists || []) {
    const eintraege = (pRoh.clips?.[p.id] || [])
      .slice()
      .sort((a, b) => (a.relative_index || 0) - (b.relative_index || 0))
      .map(e => {
        const c = e.clip || {};
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

    playlists[p.id] = {
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

  // Rückverweis am Song, damit die Oberfläche nicht suchen muss
  for (const s of Object.values(songs)) s.playlists = [];
  for (const p of Object.values(playlists))
    for (const e of p.eintraege)
      if (e.songId && songs[e.songId] && !songs[e.songId].playlists.includes(p.id))
        songs[e.songId].playlists.push(p.id);

  const alleEintraege = Object.values(playlists).reduce((n, p) => n + p.eintraege.length, 0);
  const fremdEintraege = Object.values(playlists)
    .reduce((n, p) => n + p.eintraege.filter(e => !e.eigen).length, 0);
  console.log(`  Playlists:      ${path.basename(playlistDatei)} `
            + `(${Object.keys(playlists).length} Stück, ${alleEintraege} Einträge, `
            + `davon ${fremdEintraege} fremd)`);
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
const verarbeitet = ['profil','privat','timing','playlists','profilinfo','feed']
  .flatMap(alleRohdateien);

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
console.log(`  Playlists:      ${Object.keys(playlists).length}`
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
