/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ============================================================
   Suno-Archiv · Medien laden
   ------------------------------------------------------------
   Lädt MP3, Artwork und Video zu jedem Song aus library/index.json.

   Die Dateien liegen auf Sunos CDN und brauchen KEINE Anmeldung.
   Deshalb läuft dieses Skript komplett ohne Token und ohne Browser.

   Eigenschaften:
     - fortsetzbar: abgebrochene Downloads laufen beim nächsten
       Start an der Abbruchstelle weiter (per HTTP-Range)
     - inkrementell: fertige Dateien werden übersprungen
     - geduldig: Pausen zwischen den Anfragen, damit wir nicht
       gedrosselt werden

   Aufruf:
     node bin/laden.js               nur veröffentlichte Songs
     node bin/laden.js --alle        alles im Katalog
     node bin/laden.js --mit-lyricvideo  Sunos Lyric-Videos mitladen
     node bin/laden.js --test 5      nur die ersten 5 (zum Ausprobieren)
   ============================================================ */

const fs   = require('node:fs');
const path = require('node:path');
const K    = require('./katalog.js');

const WURZEL = path.join(__dirname, '..');
const SONGS  = path.join(WURZEL, 'library', 'songs');
// Playlist-Cover gehören zu keinem Song und liegen deshalb daneben.
// Eine Datei je Playlist, benannt nach Sunos Playlist-ID.
const PLAYLISTBILDER = path.join(WURZEL, 'library', 'playlistbilder');

// --- Einstellungen ----------------------------------------------

const args      = process.argv.slice(2);
const NUR_OEFF  = !args.includes('--alle');

/* Sunos Lyric-Videos werden standardmäßig NICHT geladen.
   Sie belegten 2,51 GB - mehr als die Hälfte des Archivs - und
   sind seit der Bühne überflüssig: Die kann dasselbe wortgenau
   statt zeilenweise, in den Coverfarben und mit einstellbarem
   Versatz. Die Zeitmarken liegen als Daten vor, nicht nur als
   fertiges Bild.

   Bei Bedarf mit --mit-lyricvideo wieder einschalten; die Dateien
   liegen ohne Anmeldung auf Sunos CDN.

   Die EIGENEN Video-Artworks (artwork.mp4) sind davon nicht
   betroffen und werden immer geladen. */
const MIT_LYRICVIDEO = args.includes('--mit-lyricvideo');
const TESTZAHL  = args.includes('--test')
                ? parseInt(args[args.indexOf('--test') + 1], 10) || 5 : null;

const PAUSE_MS  = 700;      // zwischen zwei Dateien
const VERSUCHE  = 4;        // pro Datei

/* Abgebrochen wird, wenn so lange kein einziges Byte ankommt. Nicht die
   Gesamtdauer wird begrenzt - eine grosze Datei darf an einer langsamen
   Leitung ihre Zeit haben; jedes Stueck setzt die Uhr zurueck.

   ANLASS (27.08.2026): Beim Einrichten auf einem fremden Rechner blieb
   das Modelle-Holen ohne Anzeichen stehen, weil fetch ohne signal
   unbegrenzt wartet, solange die Verbindung steht. Dieselbe Zeile stand
   hier - und hier waere es schlimmer gewesen: 89 Songs am Stueck, und
   der Lauf haette an einer einzigen stummen Verbindung fuer immer
   gestanden. Hier faengt der Abbruch weich: unten wartet der
   Wiederholmechanismus, und die .teil-Datei laesst ihn per Range dort
   weitermachen, wo es aufhoerte. */
const STILLSTAND = 45000;

// --- Hilfsmittel ------------------------------------------------

const schlaf = (ms) => new Promise(r => setTimeout(r, ms));

function mb(bytes) { return (bytes / 1048576).toFixed(1) + ' MB'; }

/* ---- EIGENE EFFEKTCLIPS NICHT ZURUECKHOLEN ----------------------------------------------------
   Caspar_D, 11.09.2026: "jetzt kann ich mit KlangTresor Videos machen und sie auf suno hochladen,
   dummerweise erkennt KlangTresor beim Verbinden mit Suno seine eigenen Videos als neu und will sie
   gleich ins Archiv werfen." Ein Clip, den das Studio erzeugt hat, ist kein Suno-Material: er steht
   als Rezept beim Titel und laesst sich jederzeit neu malen. Was wir jederzeit neu erzeugen koennen,
   archivieren wir nicht (Caspar_Ds Entscheidung, 11.09.2026).

   Erkannt wird er ueber das Ausgabebuch `library/effektclips.json`, das der Server beim Ausgeben
   schreibt: je Titel Laenge, Bildzahl und Groesse. Die Laenge ist das starke Merkmal - unsere Clips
   sind ganze Takte GENAU DIESES Liedes, auf ein Bild gerundet, also krumme Werte wie 9,767 s.
   Geraten wird nicht: die geaenderte Datei wird einmal geholt, gemessen und dann verworfen oder
   behalten. Die Adresse des erkannten Videos merkt sich das Buch, damit beim naechsten Lauf gar
   nicht erst geladen wird. */
const AUSGABEBUCH = path.join(WURZEL, 'library', 'effektclips.json');
function ausgabebuch(){ try { return JSON.parse(fs.readFileSync(AUSGABEBUCH, 'utf8')) || {}; } catch (e) { return {}; } }
function ausgabebuchSchreiben(b){ try { fs.writeFileSync(AUSGABEBUCH, JSON.stringify(b, null, 1)); } catch (e) {} }
/* Laenge in Sekunden, oder null. Ohne ffprobe faellt die Erkennung aus - dann wird archiviert wie bisher. */
function videoLaenge(datei){
  try {
    const t = require('node:child_process').execFileSync('ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nk=1:nw=1', datei],
      { encoding: 'utf8', timeout: 20000 }).trim();
    const z = parseFloat(t); return isFinite(z) && z > 0 ? z : null;
  } catch (e) { return null; }
}
/* Ist dieses Video-Artwork unser eigener Clip? Antwort: 'eigen' | 'fremd' | 'unklar' */
/* Schon einmal als eigener Clip erkannt? Dann gar nicht erst holen. */
function schonErkannt(songId, url){
  const e = ausgabebuch()[songId];
  return Array.isArray(e) && e.some(x => x.sunoUrl && x.sunoUrl === url);
}
function eigenerClip(songId, url, datei){
  const buch = ausgabebuch(), eintraege = buch[songId];
  if (!Array.isArray(eintraege) || !eintraege.length) return 'fremd';
  if (eintraege.some(e => e.sunoUrl && e.sunoUrl === url)) return 'eigen';
  const dauer = videoLaenge(datei);
  if (dauer == null) return 'unklar';
  const treffer = eintraege.find(e => Math.abs((e.sekunden || 0) - dauer) <= 0.05);
  if (!treffer) return 'fremd';
  treffer.sunoUrl = url; treffer.erkannt = new Date().toISOString();
  ausgabebuchSchreiben(buch);
  return 'eigen';
}

/**
 * Lädt eine URL nach `ziel`. Bricht der Download ab, bleibt eine
 * .teil-Datei liegen; beim nächsten Lauf wird ab dort fortgesetzt.
 * Gibt zurück: 'geladen' | 'vorhanden' | 'fehlt' | 'fehler'
 */
async function ladeDatei(url, ziel) {
  if (!url) return 'fehlt';
  if (fs.existsSync(ziel) && fs.statSync(ziel).size > 0) return 'vorhanden';

  const teil = ziel + '.teil';

  for (let versuch = 1; versuch <= VERSUCHE; versuch++) {
    /* Vor dem try, nicht darin: catch und finally lesen beides. */
    let wacht = null, still = false;
    try {
      const schonDa = fs.existsSync(teil) ? fs.statSync(teil).size : 0;
      const kopf = schonDa > 0 ? { Range: `bytes=${schonDa}-` } : {};

      const steuer = new AbortController();
      let stand = Date.now();
      wacht = setInterval(() => {
        if (Date.now() - stand > STILLSTAND) { still = true; steuer.abort(); }
      }, 1000);

      const r = await fetch(url, { headers: kopf, signal: steuer.signal });

      // 416 = "Range nicht erfüllbar" -> Datei ist schon vollständig
      if (r.status === 416 && schonDa > 0) {
        fs.renameSync(teil, ziel);
        return 'geladen';
      }
      if (r.status === 403 || r.status === 404) return 'fehlt';
      if (r.status === 429) {                       // gedrosselt
        await schlaf(8000 * versuch);
        continue;
      }
      if (!r.ok && r.status !== 206) throw new Error('HTTP ' + r.status);

      // Bei 200 statt 206 fängt der Server von vorn an -> neu schreiben
      const anhaengen = r.status === 206 && schonDa > 0;
      const strom = fs.createWriteStream(teil, { flags: anhaengen ? 'a' : 'w' });

      for await (const stueck of r.body) { strom.write(stueck); stand = Date.now(); }
      await new Promise(res => strom.end(res));

      if (fs.statSync(teil).size === 0) throw new Error('leere Datei');
      fs.renameSync(teil, ziel);
      return 'geladen';

    } catch (e) {
      const grund = still ? `${STILLSTAND / 1000} s ohne Daten` : e.message;
      if (versuch === VERSUCHE) {
        console.log(`      ✗ ${path.basename(ziel)}: ${grund}`);
        return 'fehler';
      }
      await schlaf(2000 * versuch);
    } finally {
      if (wacht) clearInterval(wacht);
    }
  }
  return 'fehler';
}

// --- Hauptlauf --------------------------------------------------

(async () => {
  const katalog = K.lesen();
  if (!katalog) {
    console.error('Kein Katalog gefunden - erst "node bin/aufbereiten.js" laufen lassen.');
    process.exit(1);
  }

  let liste = Object.values(katalog.songs)
    .sort((a, b) => (b.erstellt || '').localeCompare(a.erstellt || ''));

  if (NUR_OEFF)  liste = liste.filter(s => s.veroeffentlicht);
  if (TESTZAHL)  liste = liste.slice(0, TESTZAHL);

  console.log(`${liste.length} Songs zu prüfen`);
  console.log(NUR_OEFF ? '(nur veröffentlichte)' : '(alle)');
  console.log('Ein Zeichen je Datei (Cover, MP3, Artwork):  G = geladen,  V = war schon da,  · = nichts zu holen,  E = eigener Effektclip, nicht archiviert,  ! = Fehler');
  if (MIT_LYRICVIDEO) console.log("(mit Sunos Lyric-Videos)");
  console.log('');

  const zaehler = { geladen: 0, vorhanden: 0, fehlt: 0, fehler: 0, eigen: 0 };
  let bytes = 0;
  const start = Date.now();

  for (let i = 0; i < liste.length; i++) {
    const s = liste[i];
    const ordner = path.join(SONGS, s.id);
    fs.mkdirSync(ordner, { recursive: true });

    const aufgaben = [
      ['cover.jpg',  s.bildUrl],
      ['audio.mp3',  s.audioUrl],
    ];
    /* Eigenes Video-Artwork - gibt es nur bei einem Teil der Songs. Ist es ein Clip aus unserem
       eigenen Studio, wird es gar nicht erst geholt (siehe oben). */
    if (s.videoCoverUrl && !schonErkannt(s.id, s.videoCoverUrl)) aufgaben.push(['artwork.mp4', s.videoCoverUrl]);
    else if (s.videoCoverUrl) zaehler.eigen++;
    // Sunos Lyric-Video nur auf ausdrücklichen Wunsch
    if (MIT_LYRICVIDEO) aufgaben.push(['video.mp4', s.videoUrl]);

    const ergebnisse = [];
    for (const [name, url] of aufgaben) {
      const ziel = path.join(ordner, name);
      const e = await ladeDatei(url, ziel);
      zaehler[e]++;
      /* Ein Zeichen je Datei. "fehlt" und "fehler" fingen beide mit F an -
         das eine ist harmlos, das andere nicht, und in der Zeile sahen sie
         gleich aus (Caspar_D, 23.08.2026). */
      ergebnisse.push({ geladen: 'G', vorhanden: 'V', fehlt: '·', fehler: '!' }[e] || '?');
      /* Frisch geholtes Video-Artwork nachmessen: ist es unser eigener Clip, kommt es wieder weg. */
      if (e === 'geladen' && name === 'artwork.mp4' && fs.existsSync(ziel)) {
        const urteil = eigenerClip(s.id, s.videoCoverUrl, ziel);
        if (urteil === 'eigen') {
          fs.unlinkSync(ziel); zaehler.geladen--; zaehler.eigen++;
          ergebnisse[ergebnisse.length - 1] = 'E';
          await schlaf(PAUSE_MS); continue;
        }
      }
      if (e === 'geladen' && fs.existsSync(ziel)) bytes += fs.statSync(ziel).size;
      if (e === 'geladen') await schlaf(PAUSE_MS);
    }

    const nr = String(i + 1).padStart(String(liste.length).length);
    console.log(`[${nr}/${liste.length}] ${ergebnisse.join('')} ${s.titel.slice(0, 55)}`);
  }

  // --- Profilbild -------------------------------------------------
  // Es gehört dem jeweiligen Konto, nicht dem Programm. Deshalb wird
  // es geladen statt mitgeliefert - so zeigt jedes Archiv das Bild
  // seines eigenen Urhebers.
  const avatarUrl = katalog.profil && katalog.profil.avatar_image_url;
  if (avatarUrl){
    const endung = (avatarUrl.match(/\.(webp|jpe?g|png|gif)(\?|$)/i) || [,'webp'])[1].toLowerCase();
    const ziel = path.join(WURZEL, 'library', 'avatar.' + endung);
    const e = await ladeDatei(avatarUrl, ziel);
    zaehler[e]++;
    if (e === 'geladen' && fs.existsSync(ziel)){
      bytes += fs.statSync(ziel).size;
      console.log(`\nProfilbild: library/avatar.${endung}`);
    }
  }

  // --- Profil-Titelbild -------------------------------------------
  // Dasselbe wie beim Avatar: Es gehört dem Konto, nicht dem Programm,
  // und wird deshalb geholt statt mitgeliefert. Es trägt den Kopf der
  // Profilseite (Caspar_D, 26.08.2026: „schau dir meine Profilseite auf
  // Suno an, da gibt es ein Hintergrundbild").
  const titelUrl = katalog.profil && katalog.profil.cover_photo_url;
  if (titelUrl){
    const endung = (titelUrl.match(/\.(webp|jpe?g|png|gif)(\?|$)/i) || [,'webp'])[1].toLowerCase();
    const ziel = path.join(WURZEL, 'library', 'profilbild.' + endung);
    const e = await ladeDatei(titelUrl, ziel);
    zaehler[e]++;
    if (e === 'geladen' && fs.existsSync(ziel)){
      bytes += fs.statSync(ziel).size;
      console.log(`Profil-Titelbild: library/profilbild.${endung}`);
    }
  }

  // --- Playlist-Cover ---------------------------------------------
  // Caspar_Ds eigene Playlists sollen auch dann noch aussehen wie seine,
  // wenn Suno abgeschaltet ist. Die Cover FREMDER Songs innerhalb der
  // Playlists werden bewusst NICHT geladen - die kommen live vom CDN,
  // zusammen mit deren Ton.
  const playlists = Object.values(katalog.playlists || {});
  if (playlists.length) {
    fs.mkdirSync(PLAYLISTBILDER, { recursive: true });
    console.log(`\n${playlists.length} Playlist-Cover`);
    for (const p of playlists) {
      if (!p.bildUrl) { zaehler.fehlt++; continue; }
      const ziel = path.join(PLAYLISTBILDER, p.id + '.jpg');
      const e = await ladeDatei(p.bildUrl, ziel);
      zaehler[e]++;
      if (e === 'geladen' && fs.existsSync(ziel)) {
        bytes += fs.statSync(ziel).size;
        await schlaf(PAUSE_MS);
      }
    }
    // Das "._" muss ausgefiltert werden: macOS legt auf exFAT zu jeder
    // Datei eine AppleDouble-Begleitdatei an, die ebenfalls auf .jpg
    // endet. Ohne den Filter zählt man doppelt.
    const echte = fs.readdirSync(PLAYLISTBILDER)
      .filter(f => f.endsWith('.jpg') && !f.startsWith('._'));
    console.log(`  ${echte.length} Cover vorhanden`);
  }

  const dauer = Math.round((Date.now() - start) / 1000);
  console.log('\n--- fertig ---');
  console.log(`neu geladen:   ${zaehler.geladen}  (${mb(bytes)})`);
  console.log(`schon da:      ${zaehler.vorhanden}`);
  if (zaehler.eigen) console.log(`eigene Clips:  ${zaehler.eigen} — auf Suno hochgeladen, nicht archiviert (Rezept und Quelle liegen beim Titel)`);
  console.log(`nicht vorhanden:${zaehler.fehlt}   (z.B. Songs ohne Video)`);
  console.log(`Fehler:        ${zaehler.fehler}`);
  console.log(`Dauer:         ${Math.floor(dauer/60)} min ${dauer%60} s`);
  if (zaehler.fehler) console.log('\nBei Fehlern einfach nochmal starten - es wird fortgesetzt.');
})();
