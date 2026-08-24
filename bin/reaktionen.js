/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * Sichert die Kommentare zu den eigenen Songs.
 *
 *   node bin/reaktionen.js            alle Songs mit Kommentaren
 *   node bin/reaktionen.js <id>       nur einer
 *   node bin/reaktionen.js --alle     auch Songs ohne gezählte Kommentare
 *
 * ---------------------------------------------------------------------
 * DER ENDPUNKT
 *
 *   GET https://studio-api-prod.suno.com/api/gen/<id>/comments?order=newest
 *
 * Ohne Anmeldung, ohne Token - Kommentare sind öffentlich, so wie sie
 * es auf der Songseite auch sind. Er liefert je Kommentar den Autor mit
 * Anzeigename, Handle und Avatar, den Zeitpunkt, den Volltext und die
 * Zahl der Likes auf den Kommentar.
 *
 * Gefunden am 19.08.2026, nachdem rund zwanzig geratene Adressen mit
 * 404 geantwortet hatten. Das Präfix ist /api/gen/ (nicht /api/clip/
 * oder /api/comment/) - dasselbe wie beim WAV-Anstoß, der seit dem
 * 18.08.2026 in WAV-PROTOKOLL.md steht. Die Antwort lag im Haus.
 *
 * ---------------------------------------------------------------------
 * EINE DATEI, NICHT DREIHUNDERT
 *
 * library/reaktionen.ndjson - eine Zeile je Ereignis, angehängt.
 *
 * Das Archiv liegt auf exFAT, und dort belegt jede Datei mindestens
 * einen Block von 1 MB. Eine Datei je Song wären 321 MB für ein paar
 * hundert Kilobyte Text. Eine Zeile mehr kostet Bytes, eine Datei mehr
 * kostet einen Block. (Caspar_D, 19.08.2026)
 *
 * ANGEHÄNGT, NICHT ÜBERSCHRIEBEN: Wer einen Kommentar löscht, löscht
 * ihn bei Suno. Hier bleibt er stehen - mit dem Datum, an dem wir ihn
 * zuletzt gesehen haben. Ändert sich ein Kommentar, kommt eine neue
 * Zeile dazu; die alte bleibt. Die Datei ist ein Tagebuch, kein
 * Abbild.
 *
 * ---------------------------------------------------------------------
 * FREMDE DATEN
 *
 * Anders als der Rest des Archivs stehen hier Namen und Texte anderer
 * Leute. library/ ist ohnehin nicht in git; wer das Archiv weitergibt,
 * gibt diese Datei nicht mit.
 */
const fs   = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const K    = require('./katalog.js');

const WURZEL = path.join(__dirname, '..');
const DATEI  = path.join(WURZEL, 'library', 'reaktionen.ndjson');
const API    = 'studio-api-prod.suno.com';
const UA     = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';

const schlaf = (ms) => new Promise(r => setTimeout(r, ms));

function holen(pfad) {
  return new Promise((fertig) => {
    https.get({ host: API, path: pfad, headers: { 'User-Agent': UA } }, (a) => {
      let roh = '';
      a.on('data', s => roh += s);
      a.on('end', () => {
        if (a.statusCode !== 200) return fertig({ fehler: a.statusCode });
        try { fertig({ daten: JSON.parse(roh) }); }
        catch (e) { fertig({ fehler: 'unlesbar' }); }
      });
    }).on('error', e => fertig({ fehler: e.message }));
  });
}

/* Was steht schon in der Datei? Erkannt wird ein Kommentar an seiner
   ID ZUSAMMEN MIT Text und Like-Zahl: Ändert sich eines davon, ist es
   ein neuer Stand und bekommt eine eigene Zeile.

   Dazu: Welche Kommentare wurden schon nach Antworten gefragt? Suno
   nennt in der Kommentarliste keine Antwortzahl - man muss je Kommentar
   fragen. 471 Aufrufe sind zwei Minuten; das lohnt nur einmal. Danach
   nur noch fuer neue Kommentare, und fuer alte alle paar Tage. */
function bekanntLesen() {
  const bekannt = new Set(), antwortenGeprueft = new Map();
  const kommentareJeSong = new Map();        // songId -> Set der Kommentar-IDs
  let vollGeprueft = null;                   // letzter kompletter Durchgang
  if (!fs.existsSync(DATEI)) return { bekannt, antwortenGeprueft, kommentareJeSong, vollGeprueft };
  for (const zeile of fs.readFileSync(DATEI, 'utf8').split('\n')) {
    if (!zeile.trim()) continue;
    try { const e = JSON.parse(zeile);
          if (e.art === 'kommentar') { bekannt.add(`${e.id}|${e.text}|${e.likes}`);
            if (!kommentareJeSong.has(e.song)) kommentareJeSong.set(e.song, new Set());
            kommentareJeSong.get(e.song).add(e.id); }
          if (e.art === 'antwort')   bekannt.add(`${e.id}|${e.text}|${e.likes}`);
          if (e.art === 'antworten-geprueft') antwortenGeprueft.set(e.kommentar, e.gesehen);
          if (e.art === 'voll-geprueft') vollGeprueft = e.gesehen;
    } catch (x) {}
  }
  return { bekannt, antwortenGeprueft, kommentareJeSong, vollGeprueft };
}

(async function () {
  const katalog = K.lesen();
  if (!katalog) { console.error('Kein Katalog - erst node bin/aufbereiten.js'); process.exit(1); }

  const args = process.argv.slice(2);
  const nur  = args.find(a => /^[0-9a-f-]{36}$/.test(a));
  const alle = args.includes('--alle');

  let liste = Object.values(katalog.songs).filter(s => !s.fremd);
  const { bekannt, antwortenGeprueft, kommentareJeSong, vollGeprueft } = bekanntLesen();
  const DREI_TAGE_MS = 3 * 86400000;
  let voll = alle || !vollGeprueft || (Date.now() - new Date(vollGeprueft).getTime() > DREI_TAGE_MS);
  if (nur)   { liste = liste.filter(s => s.id === nur); voll = true; }
  /* Songs ohne gezählte Kommentare haben keine - das spart bei 321
     Songs rund 200 Abfragen. Der Zähler kommt aus demselben Lauf, ist
     also frisch. */
  else if (voll) liste = liste.filter(s => (s.kommentare || 0) > 0);
  /* GEZIELT statt alles: Nur Songs, deren Kommentarzaehler mehr sagt,
     als wir gesichert haben. Bei einem gewoehnlichen Morgen sind das
     zwei, drei Songs statt 134 - der volle Durchgang (der auch
     geaenderte Texte und Kommentar-Likes sieht) laeuft alle drei Tage.
     (Caspar_D, 20.08.2026: "es wird zuviel geprueft und nachgezogen.") */
  else liste = liste.filter(s => (s.kommentare || 0) > (kommentareJeSong.get(s.id) || new Set()).size);

  console.log(voll
    ? `\n  Voller Durchgang: ${liste.length} Songs mit Kommentaren (zuletzt ${vollGeprueft ? vollGeprueft.slice(0,10) : 'nie'}), ${bekannt.size} Stände gesichert.\n`
    : `\n  Gezielt: ${liste.length} Songs mit neuen Kommentaren laut Zähler, ${bekannt.size} Stände gesichert. Voller Durchgang alle 3 Tage.\n`);
  if (!liste.length) return;

  fs.mkdirSync(path.dirname(DATEI), { recursive: true });
  const strom = fs.createWriteStream(DATEI, { flags: 'a' });
  const gesehen = new Date().toISOString();
  let neu = 0, gelesen = 0, schief = 0, antworten = 0, gefragt = 0, durch = 0;
  /* Antworten: neue Kommentare sofort, alte hoechstens alle drei Tage.
     Eine Antwort kann auch auf einen alten Kommentar kommen; aber
     taeglich 471 Aufrufe fuer meist nichts waere Unsinn. */
  const DREI_TAGE = 3 * 86400000;
  const antwortenHolen = async (k, s) => {
    const zuletzt = antwortenGeprueft.get(k.id);
    if (zuletzt && Date.now() - new Date(zuletzt).getTime() < DREI_TAGE) return;
    const r = await holen(`/api/comment/${k.id}/replies`);
    gefragt++;
    if (r.fehler) return;
    for (const w of (r.daten && r.daten.replies) || []) {
      const kennung = `${w.id}|${w.content}|${w.num_likes || 0}`;
      if (bekannt.has(kennung)) continue;
      bekannt.add(kennung);
      strom.write(JSON.stringify({
        art:      'antwort',
        gesehen,
        song:     s.id,
        songTitel: s.titel || '',
        kommentar: k.id,                       // worauf geantwortet wurde
        id:       w.id,
        am:       w.created_at,
        von:      w.user_handle || '',
        name:     w.user_display_name || '',
        avatar:   w.user_avatar_url || '',
        text:     w.content || '',
        likes:    w.num_likes || 0,
      }) + '\n');
      antworten++;
    }
    strom.write(JSON.stringify({ art:'antworten-geprueft', gesehen, kommentar:k.id }) + '\n');
    await schlaf(300);
  };

  for (const s of liste) {
    const a = await holen(`/api/gen/${s.id}/comments?order=newest`);
    if (a.fehler) { schief++; console.log(`  ✗ ${(s.titel||'').slice(0,40)} — ${a.fehler}`); continue; }

    const treffer = (a.daten && a.daten.results) || [];
    gelesen += treffer.length;
    let neuHier = 0;
    for (const k of treffer) {
      const kennung = `${k.id}|${k.content}|${k.num_likes || 0}`;
      if (!bekannt.has(kennung)) {
        bekannt.add(kennung);
        strom.write(JSON.stringify({
          art:     'kommentar',
          gesehen,
          song:    s.id,
          songTitel: s.titel || '',
          id:      k.id,
          am:      k.created_at,
          von:     k.user_handle || '',
          name:    k.user_display_name || '',
          avatar:  k.user_avatar_url || '',
          text:    k.content || '',
          likes:   k.num_likes || 0,
        }) + '\n');
        neu++; neuHier++;
      }
      await antwortenHolen(k, s);
    }
    if (neuHier) console.log(`  + ${String(neuHier).padStart(3)}  ${(s.titel||'').slice(0,44)}`);
    /* Lebenszeichen, auch wenn nichts Neues kommt: 134 Songs mit Pausen
       sind zwei Minuten Schweigen, und im Morgenlauf sah das nach
       Stillstand aus (Caspar_D, 19.08.2026: "warum er den Katalog nicht
       beendet"). Alle zwanzig Songs eine Zeile. */
    durch++;
    if (durch % 20 === 0) console.log(`  … ${durch}/${liste.length} geprüft, ${neu} neu`);
    await schlaf(400);                       // Suno nicht drängen
  }

  if (voll && !nur) strom.write(JSON.stringify({ art: 'voll-geprueft', gesehen }) + '\n');
  strom.end();
  console.log(`\n  ${gelesen} Kommentare gelesen, ${neu} neu gesichert` +
              (schief ? `, ${schief} Songs übersprungen` : '') + '.');
  console.log(`  ${gefragt} Kommentare nach Antworten gefragt, ${antworten} Antworten neu gesichert.`);
  console.log(`  ${path.relative(WURZEL, DATEI)}` +
              (fs.existsSync(DATEI) ? `  (${(fs.statSync(DATEI).size/1024).toFixed(0)} KB)` : '') + '\n');
})();
