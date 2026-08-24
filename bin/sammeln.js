/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ============================================================
   KlangTresor · Songs sammeln — ohne Browser, ohne Anmeldung
   ------------------------------------------------------------
   Holt die komplette Songliste eines öffentlichen Suno-Profils
   direkt über die API und legt sie als Rohdatei ab.

   DER PUNKT: Das geht OHNE Token. Der Endpunkt

     GET /api/profiles/<handle>?playlists_sort_by=…&clips_sort_by=…&page=N

   antwortet ohne jede Anmeldung mit vollständigen Clip-Objekten -
   38 Felder, samt Lyrics, audio_url und video_cover_url.

   Damit ist der Umweg über die Browserkonsole für den Hauptteil
   des Sammelns überflüssig geworden. Was WEITERHIN den Browser
   braucht (jeweils HTTP 401 ohne Token):

     - Wort-Zeitmarken   /api/gen/<id>/aligned_lyrics/
     - Playlists         /api/playlist/me
     - WAV-Erzeugung     /api/gen/<id>/convert_wav/

   `page` zählt ab 1, und page=1 ist dasselbe wie ohne Angabe.
   Deshalb wird über die ID dedupliziert und gegen num_total_clips
   geprüft.

   Aufruf:
     node bin/sammeln.js <handle>     z. B. node bin/sammeln.js caspar_d
     node bin/sammeln.js              nimmt den Handle aus dem Katalog
   ============================================================ */

const fs    = require('node:fs');
const path  = require('node:path');
const https = require('node:https');
const K     = require('./katalog.js');

const WURZEL = path.join(__dirname, '..');
const ROH    = path.join(WURZEL, 'library', 'roh');

/* Ohne Browserkennung antwortet Sunos CDN teilweise gar nicht -
   derselbe Fallstrick wie bei den WAV-Dateien. */
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
         + 'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

const schlaf = (ms) => new Promise(r => setTimeout(r, ms));

function holen(url){
  return new Promise((fertig) => {
    https.get(url, { headers: { 'User-Agent': UA } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode !== 200) return fertig({ fehler: res.statusCode, körper: d.slice(0,200) });
        try { fertig({ daten: JSON.parse(d) }); }
        catch(e){ fertig({ fehler: 'kein JSON' }); }
      });
    }).on('error', e => fertig({ fehler: e.message }));
  });
}

/* Juengste Profil-Ernte finden - im aktiven Ordner oder schon
   verarbeitet. Der rote Knopf nutzt sie statt selbst zu holen, wenn
   sie frisch genug ist (--aus-roh): Die Lesezeichen-Ernte ist eine
   OBERMENGE dessen, was hier ohne Token zu holen waere - sie kennt
   auch die privaten Songs. (Caspar_D, 20.08.2026: "der rote Knopf
   sollte auf die Lesezeichenarbeit zurueckgreifen.") */
function juengsteErnte(){
  let beste = null;
  for (const o of [ROH]){                    // nur Unverarbeitetes - Verarbeitetes ist geloescht
    if (!fs.existsSync(o)) continue;
    for (const f of fs.readdirSync(o))
      if (/^profil-.*\.json$/.test(f) && !f.startsWith('._')){
        const voll = path.join(o, f);
        if (!beste || f > path.basename(beste)) beste = voll;
      }
  }
  return beste;
}

(async () => {
  const katalog = K.lesen();
  const ausRoh = process.argv.includes('--aus-roh');
  /* WOHER DER HANDLE KOMMT, in dieser Reihenfolge:
       1. das Argument
       2. der schon vorhandene Katalog
       3. library/konfig.json - dort trägt ihn die Oberfläche ein
     Punkt 3 fehlte bis zum 23.08.2026, und daran scheiterte der ERSTE Lauf
     über den roten Knopf: Der Server ruft dieses Skript ohne Argument auf,
     und ein leeres Archiv hat noch keinen Katalog. Wer KlangTresor im Container
     betreibt oder es per Einrichtungsskript aufsetzt, soll ohne Terminal
     auskommen - dafür muss der in der Oberfläche gesetzte Alias hier
     ankommen. */
  let ausKonfig = null;
  try { ausKonfig = JSON.parse(fs.readFileSync(path.join(WURZEL, 'library', 'konfig.json'), 'utf8')).handle || null; }
  catch (e) {}
  const handle = process.argv.slice(2).find(a => !a.startsWith('--'))
    || (katalog && katalog.profil && katalog.profil.handle)
    || ausKonfig;

  if (!handle && !ausRoh){
    console.error('Kein Handle. Entweder beim Aufruf mitgeben:  node bin/sammeln.js <dein-handle>');
    console.error('oder im KlangTresor oben rechts den Alias eintragen (er wird geprüft und gemerkt).');
    console.error('(Der Handle steht auf deiner Profilseite hinter dem @.)');
    process.exit(1);
  }

  const basis = `https://studio-api-prod.suno.com/api/profiles/${encodeURIComponent(handle)}`
              + `?playlists_sort_by=upvote_count&clips_sort_by=created_at`;

  const songs = new Map();
  let kopf = null, gesamt = null;
  let ernteVom = null;

  if (ausRoh){
    const f = juengsteErnte();
    if (!f){ console.error('Keine Ernte gefunden - ohne --aus-roh laufen lassen.'); process.exit(1); }
    let j; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.error('Ernte unlesbar: ' + f); process.exit(1); }
    ernteVom = j.geholtAm || j.abgerufenAm || null;
    for (const c of (j.alle || j.clips || j.songs || [])) if (c && c.id) songs.set(c.id, c);
    console.log('Verwerte deine Lesezeichen-Ernte statt Suno neu zu fragen.');
    console.log(`  ${path.basename(f)}${ernteVom ? '  (geholt ' + ernteVom.slice(0,16).replace('T',' ') + ')' : ''}`);
    console.log(`  ${songs.size} öffentliche Songs. (Die privaten stecken in der privat-Ernte`);
    console.log('   daneben und fließen beim Übernehmen mit ein.)\n');
  }
  else {
  console.log(`Sammle Songs von @${handle} — ohne Anmeldung, direkt über die API.\n`);

  for (let seite = 1; seite <= 60; seite++){
    const a = await holen(basis + '&page=' + seite);
    if (a.fehler){
      if (seite === 1){
        console.error(`Fehler ${a.fehler}: ${a.körper || ''}`);
        console.error('Gibt es das Profil? Ist es öffentlich?');
        process.exit(1);
      }
      break;
    }
    if (!kopf) kopf = a.daten;
    gesamt = a.daten.num_total_clips ?? gesamt;

    const clips = a.daten.clips || [];
    if (!clips.length) break;

    const vorher = songs.size;
    for (const c of clips) if (c && c.id) songs.set(c.id, c);
    const dazu = songs.size - vorher;
    const doppelt = clips.length - dazu;

    /* HIER STAND "neu", UND DAS WAR EIN ANDERES NEU.

       Gezählt wird, was auf DIESER Seite stand und nicht schon auf einer
       früheren - eine Dublettenprüfung innerhalb des Laufs. Mit dem
       Katalog hat es nichts zu tun. Solange Suno saubere Seiten
       liefert, ist es deshalb immer die volle Seitenlänge.

       Danach stand in der Zusammenfassung "NEU: 0" - dasselbe Wort für
       "noch nicht im Archiv". Wer beides liest, hält eines für falsch.
       (Caspar_D, 19.08.2026: "in Wirklichkeit hat die Zusammenfassung
       recht.")

       Gezeigt wird die Zahl jetzt nur noch, wenn sie etwas sagt: wenn
       Suno wirklich Doppelte schickt. Gebraucht wird sie weiter - sie
       ist die Abbruchbedingung der Schleife. */
    console.log(`  Seite ${String(seite).padStart(2)}: ${String(clips.length).padStart(3)} Songs`
              + (doppelt ? `, ${doppelt} doppelt` : '')
              + `  —  ${songs.size}${gesamt ? '/' + gesamt : ''}`);

    // page=1 ist dasselbe wie ohne Angabe; bringt eine Seite nichts
    // Neues und sind wir jenseits der ersten, ist das Ende erreicht.
    if (!dazu && seite > 1) break;
    if (gesamt && songs.size >= gesamt) break;
    await schlaf(700);                      // Drosselung achten
  }
  }                                          // Ende Frisch-Zweig

  const liste = [...songs.values()];
  if (!liste.length){ console.error('\nNichts gefunden.'); process.exit(1); }

  fs.mkdirSync(ROH, { recursive: true });
  const stempel = new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);

  const ziel = path.join(ROH, `profil-${stempel}.json`);

  // Dasselbe Format, das auch das Browserskript erzeugt: `alle` als
  // Liste plus `handle`, damit bin/aufbereiten.js Fremdes aussortieren
  // kann. Im aus-roh-Modus liegt alles laengst als Datei da.
  if (!ausRoh) fs.writeFileSync(ziel, JSON.stringify({
    alle: liste, handle,
    geholtAm: new Date().toISOString(),
    quelle: 'api/profiles/<handle> ohne Anmeldung',
  }));

  // Die Profilangaben gleich mit - sie stecken im selben Kopf.
  if (kopf){
    const info = {
      display_name: kopf.display_name, handle: kopf.handle,
      profile_description: kopf.profile_description,
      avatar_image_url: kopf.avatar_image_url,
      stats: kopf.stats, num_total_clips: kopf.num_total_clips,
      abgerufenAm: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(ROH, `profilinfo-${stempel}.json`), JSON.stringify(info));
  }

  /* --- Was ist neu, was hat sich geändert? --------------------
     Der Katalog ist die Vergleichsgrundlage. Verglichen werden nur
     Felder, die sich sinnvoll ändern können - Zähler getrennt von
     Inhalten, denn Plays ändern sich ständig und bedeuten nichts
     für die Dateien auf der Platte. */
  const altSongs = (katalog && katalog.songs) || {};
  const neuIds = [], geaendert = [], nurZaehler = [];

  for (const c of liste){
    const a = altSongs[c.id];
    if (!a){ neuIds.push(c); continue; }

    const inhalt = [];
    if ((c.title||'') !== (a.titel||'')) inhalt.push('Titel');
    if ((c.metadata?.prompt||'') !== (a.lyrics||'')) inhalt.push('Lyrics');
    /* DIESELBE REGEL WIE IM KATALOG, sonst meldet der Vergleich etwas,
       das nie uebernommen wird.

       aufbereiten.js nimmt `m.tags || c.display_tags`. Songs vom Typ
       'studio_export' oder 'concat_infilling' fuehren KEIN tags-Feld -
       der Stil gehoerte zur urspruenglichen Erzeugung, nicht zum
       Export -, tragen ihn aber weiterhin in display_tags. Wer nur
       tags vergleicht, sieht dort einen Verlust, wo keiner ist, und
       meldet ihn jeden Morgen aufs Neue. (Gefunden am 19.08.2026 an
       "ICE - InterCity Express" und "Schneesee".)

       Es ist ausdruecklich KEIN Copyright-Filter von Suno: "Kraftwerk"
       steht weiterhin im Stil von elf anderen Songs, "Rammstein" in
       vierundzwanzig. */
    const stilJetzt = (c.metadata?.tags || c.display_tags || '');
    if (stilJetzt !== (a.stilPrompt||'')) inhalt.push('Stil');
    if (!!c.is_public !== !!a.oeffentlich) inhalt.push('Sichtbarkeit');
    if ((c.image_large_url||c.image_url||'') !== (a.bildUrl||'')) inhalt.push('Cover');
    if ((c.video_cover_url||null) !== (a.videoCoverUrl||null)) inhalt.push('Video-Artwork');

    if (inhalt.length){ geaendert.push({ c, was: inhalt }); continue; }

    /* KOMMENTARE FEHLTEN HIER. Verglichen wurden nur Plays und Likes;
       ein Song, der über Nacht einen Kommentar bekam und sonst nichts,
       tauchte im Vergleich überhaupt nicht auf. (Caspar_D, 19.08.2026:
       "auch die Likes und Kommentare für meinen letzten Song sind nicht
       im Diff zu sehen.") */
    const dp = (c.play_count||0)   - (a.plays||0);
    const dl = (c.upvote_count||0) - (a.likes||0);
    /* comment_count, nicht num_comments. Der falsche Name las immer 0
       und meldete damit fuer JEDEN Song, der Kommentare hat, einen
       Verlust - 131 Songs mit "-12 Kommentare", wo sich nichts geaendert
       hatte. Der richtige Name stand die ganze Zeit in der Rohdatei. */
    const dk = (c.comment_count||0) - (a.kommentare||0);
    if (dp || dl || dk) nurZaehler.push({ c, a, dp, dl, dk });
  }

  console.log(`\n${liste.length} Songs${gesamt ? ' von ' + gesamt : ''} ${ausRoh ? 'aus der Ernte übernommen' : 'gesammelt'}.`);
  if (!ausRoh) console.log(`  ${path.relative(WURZEL, ziel)}  (${(fs.statSync(ziel).size/1048576).toFixed(1)} MB)`);

  console.log('\n--- Vergleich mit dem Katalog ---');
  console.log(`  bereits bekannt:  ${liste.length - neuIds.length}`);
  console.log(`  NEU:              ${neuIds.length}`);
  console.log(`  inhaltlich anders:${String(geaendert.length).padStart(3)}`);
  console.log(`  nur Zähler:       ${nurZaehler.length}`);

  for (const s of neuIds.slice(0,15))
    console.log(`    + ${(s.created_at||'').slice(0,10)}  ${(s.title||'').slice(0,44)}`);
  if (neuIds.length > 15) console.log(`    … und ${neuIds.length-15} weitere`);
  for (const g of geaendert.slice(0,15))
    console.log(`    ~ ${(g.c.title||'').slice(0,36)}  (${g.was.join(', ')})`);

  /* DIE ZÄHLERSTÄNDE AUFFÜHREN, NICHT NUR ZÄHLEN.

     Bisher stand hier eine Zahl und sonst nichts - man erfuhr, DASS
     sich sieben Songs bewegt haben, aber nicht welche. Genau das will
     man morgens wissen: wo etwas passiert ist.

     Sortiert nach Bewegung, Kommentare fünffach gewichtet: Ein
     Kommentar ist ein Mensch, der etwas geschrieben hat; hundert Plays
     sind eine Zahl. */
  const bewegung = z => Math.abs(z.dp) + Math.abs(z.dl)*3 + Math.abs(z.dk)*20;
  const sortiert = nurZaehler.slice().sort((x,y) => bewegung(y) - bewegung(x));
  const zahl = n => (n > 0 ? '+' : '') + n;
  for (const z of sortiert.slice(0,15)){
    const teile = [];
    if (z.dp) teile.push(`${zahl(z.dp)} Plays`);
    if (z.dl) teile.push(`${zahl(z.dl)} Likes`);
    if (z.dk) teile.push(`${zahl(z.dk)} Kommentare`);
    console.log(`    · ${(z.c.title||'').slice(0,36).padEnd(36)}  ${teile.join(', ')}`);
  }
  if (sortiert.length > 15) console.log(`    … und ${sortiert.length-15} weitere`);

  /* ------------------------------------------------------------------
     DEN VERGLEICH ALS DATEN, NICHT NUR ALS TEXT.

     Der Morgenknopf zeigt ihn als Liste mit Artwork. Er koennte die
     Zeilen oben auseinandernehmen - und braeche, sobald jemand eine
     Formulierung aendert. Ein Protokoll ist fuer Menschen, eine Datei
     fuer Programme; wer das eine als das andere benutzt, baut sich eine
     Falle.

     Die Datei traegt nur, was die Anzeige braucht: ID (fuer Kachel und
     Sprung), Titel, und was sich geaendert hat. Sie wird bei jedem Lauf
     ueberschrieben - sie ist ein Zwischenstand, kein Archiv.
  ------------------------------------------------------------------ */
  const vergleich = {
    geholtAm: new Date().toISOString(),
    quelle: ausRoh ? 'ernte' : 'frisch',
    ernteVom: ernteVom || undefined,
    gesamt:   liste.length,
    neu:      neuIds.length,
    geaendert: geaendert.map(g => ({ id: g.c.id, titel: g.c.title || '', was: g.was })),
    zaehler:   sortiert.map(z => ({ id: z.c.id, titel: z.c.title || '',
                                    dp: z.dp, dl: z.dl, dk: z.dk })),
  };
  fs.writeFileSync(path.join(WURZEL, 'library', 'letzter-vergleich.json'),
                   JSON.stringify(vergleich, null, 1));

  /* Die neuen IDs getrennt ablegen. Nur für sie muss ein WAV
     angestoßen werden - alle anderen liegen längst auf der Platte. */
  if (neuIds.length){
    const wavDatei = path.join(WURZEL, 'library', 'neue-songs.json');
    fs.writeFileSync(wavDatei, JSON.stringify({
      erzeugtAm: new Date().toISOString(),
      ids: neuIds.map(s => s.id),
      titel: neuIds.map(s => s.title),
    }, null, 1));
    console.log(`\n  Die ${neuIds.length} neuen IDs stehen in library/neue-songs.json`);
    console.log('  — nur für diese muss ein WAV angestoßen werden (WAV-PROTOKOLL.md).');
  } else {
    console.log('\n  Keine neuen Songs — es ist nichts anzustoßen.');
  }
  console.log('');
  console.log('\nWeiter mit:  node bin/wiederherstellen.js');
  if (gesamt && liste.length < gesamt)
    console.log(`\nHinweis: ${gesamt - liste.length} Songs fehlen — nochmal laufen lassen.`);
})();
