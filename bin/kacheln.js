/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ============================================================
   KlangTresor · Kacheln vorrechnen
   ------------------------------------------------------------
   Erzeugt pro Song ein fertiges kachel.jpg im Format 3:4 (hochkant).

   Warum überhaupt:
   Die Artworks haben unterschiedliche Seitenverhältnisse -
   quadratische Cover, hochkant stehende Video-Standbilder, alles
   mögliche. Ein aufgeräumtes Raster braucht aber ein einheitliches
   Format. Statt das bei jedem Bildaufbau im Browser zu lösen
   (zwei Bilder je Kachel, Weichzeichner auf dem Telefon), rechnen
   wir es einmal hier aus - so machen es Plex, Jellyfin und jedes
   Medienarchiv.

   Verfahren:
     Hintergrund = dasselbe Bild formatfüllend, beschnitten,
                   weichgezeichnet und abgedunkelt
     Vordergrund = das vollständige Bild, mittig daraufgelegt

   Nichts vom Motiv geht verloren, und es entsteht keine tote
   Fläche.

   Aufruf:
     node bin/kacheln.js            fehlende erzeugen
     node bin/kacheln.js --neu      alle neu erzeugen
   ============================================================ */

const fs   = require('node:fs');
const path = require('node:path');
const { execFile, execFileSync } = require('node:child_process');
const K    = require('./katalog.js');

const WURZEL = path.join(__dirname, '..');
const SONGS  = path.join(WURZEL, 'library', 'songs');

const BREITE = 600, HOEHE = 800;          // 3:4 hochkant, reicht für Retina
const NEU    = process.argv.includes('--neu');
const PROBE  = process.argv.includes('--probe');   /* nur messen und sagen, nichts schreiben */
const PARALLEL = 4;
/* ---- DAS TITELBILD FUER DIE BUEHNE --------------------------------
   Caspar_D, 09.09.2026, auf der Karaoke-Buehne: "auch dort haben die
   Titelbilder z.T. schwarze Balken, die total besch... aussehen".
   Die Buehne zeigt das Cover in voller Groesse (artworkBild), nicht die
   Kachel - und damit den Rahmen, den die Kachel laengst wegschneidet.
   Deshalb entsteht hier, mit DEMSELBEN Zuschnitt, zusaetzlich ein
   titelbild.jpg in voller Aufloesung: das Cover ohne durchsichtigen
   oder schwarzen Rand. Nur wo es einen Rand gibt; sonst bleibt cover.jpg
   das Titelbild. Welche Titel eines haben, steht in kachel-stand.json
   (titelbild: {id: true|false}) - der Server reicht die Liste im
   Katalogkopf durch, die Oberflaeche nimmt dann titelbild.jpg. */

/* ---- DER DURCHSICHTIGE RAND MUSS WEG ---------------------------------
   Caspar_D, 07.09.2026, an einer Kachel: „zu allen Seiten ist Platz im
   placeholder" - und die Hausregel lautet, mindestens eine Dimension
   muss ganz ausgefuellt sein.

   Die Ursache liegt nicht hier, sondern in der Quelle: Suno liefert
   unter dem Namen cover.jpg zum Teil PNG-Dateien MIT ALPHAKANAL, in
   denen ein hochkantes Motiv quadratisch gerahmt ist - der Rahmen ist
   durchsichtig (Alpha = 0), nicht schwarz. Gemessen am 07.09.2026: von
   323 Covern haben 111 einen Alphakanal, 96 davon einen durchsichtigen
   Rand ueber 2 % - typisch 13 bis 21 Prozent links UND rechts, oben und
   unten nichts.

   Ohne Zutun landete dieser Rahmen in der Kachel: Das Quadrat fuellte
   die Kachelbreite, das MOTIV darin aber nichts, und die Transparenz
   wurde mit der unscharfen Fuellung eingebrannt - daher der farbige
   Rand ringsum.

   Deshalb wird der Rand vorher gemessen und abgeschnitten. Danach gilt
   die Regel wieder fuer das Motiv statt fuer den Rahmen.

   Nichts erfunden, nichts beschnitten, was zum Bild gehoert: Es faellt
   nur weg, was ohnehin durchsichtig ist. */
const MESSRASTER = 120;      /* fuer den Rand genau genug, und schnell */
const MINDEST_RAND = 0.02;   /* darunter lohnt der zweite Lauf nicht */

function pixelFormat(datei) {
  try {
    return execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=pix_fmt', '-of', 'csv=p=0', datei],
      { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch (e) { return ''; }
}

/* Das Messbild holen: entweder den Alphakanal (durchsichtiger Rahmen)
   oder die Helligkeit (schwarze Balken). Beides kommt vor - Suno rahmt
   hochkante Motive mal mit Transparenz, mal mit echtem Schwarz.
   (Caspar_D, 07.09.2026: „kannst du das auch für schwarze Balken
   durchziehen") */
function messbild(datei, alpha) {
  try {
    return execFileSync('ffmpeg', ['-v', 'error', '-i', datei, '-vf',
      (alpha ? 'alphaextract,' : '') + `scale=${MESSRASTER}:${MESSRASTER}`,
      '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
      { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 24 });
  } catch (e) { return null; }
}

/* Liefert den Zuschnitt als ffmpeg-crop-Ausdruck, oder null, wenn nichts
   abzuschneiden ist.

   Beim Alphakanal ist die Sache eindeutig: durchsichtig ist durchsichtig.
   Bei schwarzen Balken nicht - ein naechtliches Motiv hat auch dunkle
   Raender, und die gehoeren zum Bild. Deshalb wird dort strenger
   geprueft (siehe SCHWARZ_* unten): Der Balken muss richtig schwarz
   sein, und was uebrig bleibt, muss deutlich heller sein. Im Zweifel
   wird NICHT geschnitten - ein zu grosser Rand ist ein Schoenheitsfehler,
   ein abgeschnittenes Motiv ein Verlust. */
/* Woran man einen Balken erkennt (Caspar_D, 07.09.2026): „balken sind
   immer homogen schwarz und es gibt eine Grenze zum Bild, die grade
   ist, ausser dort, wo das bild auch schwarz ist."

   Das ist das tragfaehige Merkmal, und es ist besser als alles, was ich
   vorher probiert hatte. Helligkeit allein taugt nicht - eine
   naechtliche Barszene ist auch dunkel. Entscheidend ist die
   STRUKTURLOSIGKEIT: Ein Balken hat in seiner ganzen Laenge denselben
   Wert, ein Nachthimmel hat Verlauf, Sterne, Wolken. Also wird je
   Spalte und Zeile gemessen, wie stark die Werte streuen. */
const BALKEN_HELL   = 24;   /* so dunkel muss ein Balken im Mittel sein */
const BALKEN_STREU  = 7;    /* und so wenig darf er in sich streuen */
const SCHWARZ_MAX   = 0.45; /* mehr als 45 % je Seite wird nie geschnitten */

function pixelFormat(datei) {
  try {
    return execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=pix_fmt', '-of', 'csv=p=0', datei],
      { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch (e) { return ''; }
}

/* Das Messbild: entweder der Alphakanal (durchsichtiger Rahmen) oder die
   Helligkeit (schwarze Balken). Suno rahmt hochkante Motive mal so, mal
   so. */
function messbild(datei, alpha) {
  try {
    return execFileSync('ffmpeg', ['-v', 'error', '-i', datei, '-vf',
      (alpha ? 'alphaextract,' : '') + `scale=${MESSRASTER}:${MESSRASTER}`,
      '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
      { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 24 });
  } catch (e) { return null; }
}

/* Liefert den Zuschnitt als ffmpeg-crop-Ausdruck, oder null.

   Beim Alphakanal ist die Sache eindeutig: durchsichtig ist durchsichtig,
   da genuegt „irgendwo deckend".

   Bei schwarzen Balken zaehlt die Homogenitaet: Eine Randspalte gehoert
   zum Balken, wenn sie dunkel UND strukturlos ist. Sobald Struktur
   auftaucht, ist die gerade Grenze erreicht und es wird nicht weiter
   geschnitten - auch wenn es dahinter wieder dunkel wird. */
function zuschnitt(datei) {
  const hatAlpha = /rgba|argb|abgr|bgra|ya8|ya16/.test(pixelFormat(datei));
  const roh = messbild(datei, hatAlpha);
  const N = MESSRASTER;
  if (!roh || roh.length < N * N) return null;

  /* Mittel und Streuung einer Spalte bzw. Zeile - daran entscheidet sich
     alles. */
  const kennwerte = (hole) => {
    let summe = 0, quadrate = 0;
    for (let i = 0; i < N; i++) { const v = hole(i); summe += v; quadrate += v * v; }
    const m = summe / N;
    return { mittel: m, streu: Math.sqrt(Math.max(0, quadrate / N - m * m)) };
  };
  const spalte = (x) => kennwerte((y) => roh[y * N + x]);
  const zeile  = (y) => kennwerte((x) => roh[y * N + x]);

  let l, r, o, u;
  if (hatAlpha) {
    const traegt = (x, y) => roh[y * N + x] > 40;
    const spVoll = (x) => { for (let y = 0; y < N; y++) if (traegt(x, y)) return true; return false; };
    const zeVoll = (y) => { for (let x = 0; x < N; x++) if (traegt(x, y)) return true; return false; };
    l = 0; r = N - 1; o = 0; u = N - 1;
    while (l < N && !spVoll(l)) l++;
    while (r > l && !spVoll(r)) r--;
    while (o < N && !zeVoll(o)) o++;
    while (u > o && !zeVoll(u)) u--;
  } else {
    const istBalken = (k) => k.mittel < BALKEN_HELL && k.streu < BALKEN_STREU;
    l = 0; r = N - 1; o = 0; u = N - 1;
    while (l < N && istBalken(spalte(l))) l++;
    while (r > l && istBalken(spalte(r))) r--;
    while (o < N && istBalken(zeile(o))) o++;
    while (u > o && istBalken(zeile(u))) u--;
  }
  if (l >= r || o >= u) return null;                       /* ganz leer - Finger weg */

  /* PAARIGKEIT, als zweite Bedingung neben der Homogenitaet. Ein
     Letterbox-Balken sitzt auf BEIDEN Seiten, weil ein Bild mittig in
     einen Rahmen gelegt wurde. Ein dunkler Bildinhalt sitzt einseitig.

     Homogenitaet allein reicht naemlich nicht: „Noch lachst Du" hat
     oben einen strukturlosen Nachthimmel (7,5 %, unten nichts), „Der
     Schimmelreiter" unten einen dunklen Rand (4,2 %, oben nichts) -
     beide waeren faelschlich beschnitten worden. „Ich atme dich"
     dagegen hat links 20 und rechts 18 Prozent: ein echter Rahmen. */
  if (!hatAlpha) {
    const paarig = (a, b) => Math.min(a, b) >= MINDEST_RAND && Math.max(a, b) <= Math.min(a, b) * 2.5;
    if (!paarig(l / N, (N - 1 - r) / N)) { l = 0; r = N - 1; }
    if (!paarig(o / N, (N - 1 - u) / N)) { o = 0; u = N - 1; }
    if (l === 0 && r === N - 1 && o === 0 && u === N - 1) return null;
  }

  const anteile = [l / N, (N - 1 - r) / N, o / N, (N - 1 - u) / N];
  if (Math.max(...anteile) < MINDEST_RAND) return null;
  if (!hatAlpha && Math.max(...anteile) > SCHWARZ_MAX) return null;

  /* Anteile, nicht Pixel: die Quellgroesse ist von Song zu Song anders.
     Eine Rasterbreite Zugabe, damit die Messungenauigkeit nicht ins
     Motiv schneidet. */
  const zu = 1 / N;
  const x0 = Math.max(0, l / N - zu), y0 = Math.max(0, o / N - zu);
  const x1 = Math.min(1, (r + 1) / N + zu), y1 = Math.min(1, (u + 1) / N + zu);
  return `crop=iw*${(x1 - x0).toFixed(4)}:ih*${(y1 - y0).toFixed(4)}:iw*${x0.toFixed(4)}:ih*${y0.toFixed(4)}`;
}

/* Der Filter bekommt den Zuschnitt VOR die Verzweigung - beide Zweige,
   Hintergrund wie Motiv, arbeiten dann auf dem beschnittenen Bild. Ohne
   das haette der unscharfe Hintergrund den durchsichtigen Rahmen weiter
   mitgeschleppt. */
function filterBauen(schnitt) {
  const quelle = schnitt ? `[0:v]${schnitt},split[roh1][roh2];` : '';
  const a = schnitt ? '[roh1]' : '[0:v]';
  const b = schnitt ? '[roh2]' : '[0:v]';
  return quelle +
    `${a}scale=${BREITE}:${HOEHE}:force_original_aspect_ratio=increase,` +
    `crop=${BREITE}:${HOEHE},boxblur=28:4,eq=brightness=-0.10:saturation=1.35[hg];` +
    `${b}scale=${BREITE}:${HOEHE}:force_original_aspect_ratio=decrease[vg];` +
    `[hg][vg]overlay=(W-w)/2:(H-h)/2`;
}

function rechne(quelle, ziel, titelbild) {
  return new Promise((fertig) => {
    let schnitt = null;
    try { schnitt = zuschnitt(quelle); } catch (e) {}
    const ergebnis = { ok: true, beschnitten: !!schnitt, schnitt };
    const danach = () => {
      /* Das Titelbild: derselbe Zuschnitt, volle Aufloesung, beste Guete. */
      if (!titelbild || !schnitt) return fertig(ergebnis);
      execFile('ffmpeg', ['-v', 'error', '-y', '-i', quelle, '-vf', schnitt, '-frames:v', '1', '-q:v', '2', titelbild],
        (fehler) => { if (fehler) { ergebnis.ok = false; ergebnis.beschnitten = false; } fertig(ergebnis); });
    };
    if (!ziel) return danach();
    execFile('ffmpeg', [
      '-v', 'error', '-y',
      '-i', quelle,
      '-filter_complex', filterBauen(schnitt),
      '-frames:v', '1', '-q:v', '4',
      ziel,
    ], (fehler) => { if (fehler) ergebnis.ok = false; danach(); });
  });
}
const STAND_DATEI = path.join(WURZEL, 'library', 'kachel-stand.json');
function standLesen() { try { return JSON.parse(fs.readFileSync(STAND_DATEI, 'utf8')); } catch (e) { return {}; } }

(async () => {
  const katalog = K.lesen();
  if (!katalog) { console.error('Kein Katalog - erst bin/aufbereiten.js.'); process.exit(1); }

  const songs = Object.values(katalog.songs);
  const stand = standLesen();
  const titelbildStand = (!NEU && stand.titelbild && typeof stand.titelbild === 'object') ? { ...stand.titelbild } : {};
  const offen = [];

  for (const s of songs) {
    const quelle = path.join(SONGS, s.id, 'cover.jpg');
    const ziel   = path.join(SONGS, s.id, 'kachel.jpg');
    const titelbild = path.join(SONGS, s.id, 'titelbild.jpg');
    if (!fs.existsSync(quelle)) continue;
    const kachelFehlt = NEU || !fs.existsSync(ziel) || fs.statSync(ziel).size === 0;
    /* Titelbild: einmal je Titel entschieden (Eintrag im Stand); danach
       nur neu bei --neu oder wenn die Datei trotz Entscheidung fehlt. */
    const titelbildOffen = NEU || !(s.id in titelbildStand) || (titelbildStand[s.id] && !fs.existsSync(titelbild));
    if (!kachelFehlt && !titelbildOffen) continue;
    offen.push({ id: s.id, titel: s.titel, quelle, ziel: kachelFehlt ? ziel : null, titelbild: PROBE ? null : titelbild, titelbildOffen });
  }

  console.log(`${songs.length} Songs, ${offen.filter(a => a.ziel).length} Kacheln zu rechnen, `
            + `${offen.filter(a => a.titelbildOffen).length} Titelbilder zu pruefen${PROBE ? ' (nur Probe, nichts wird geschrieben)' : ''}\n`);
  if (!offen.length) { console.log('Nichts zu tun.'); return; }

  let fertig = 0, misslungen = 0, bytes = 0, titelbilder = 0, raender = 0;
  const start = Date.now();

  // In kleinen Gruppen, damit alle Kerne arbeiten, ohne den Mac
  // lahmzulegen.
  for (let i = 0; i < offen.length; i += PARALLEL) {
    const gruppe = offen.slice(i, i + PARALLEL);
    const ergebnis = await Promise.all(gruppe.map(a => rechne(a.quelle, PROBE ? null : a.ziel, a.titelbild)));
    ergebnis.forEach((e, j) => {
      const a = gruppe[j];
      if (a.ziel && !PROBE) {
        if (e.ok && fs.existsSync(a.ziel)) { fertig++; bytes += fs.statSync(a.ziel).size; }
        else { misslungen++; console.log(`  ✗ ${a.titel}`); }
      }
      if (a.titelbildOffen) {
        if (e.schnitt) raender++;
        if (PROBE) { if (e.schnitt) console.log(`  Rand: ${a.titel}  (${e.schnitt})`); }
        else { titelbildStand[a.id] = !!(e.beschnitten && fs.existsSync(a.titelbild)); if (titelbildStand[a.id]) titelbilder++; }
      }
    });
    process.stdout.write(`\r  ${Math.min(i + PARALLEL, offen.length)}/${offen.length}`);
  }
  if (PROBE) { console.log(`\n\nProbe: ${offen.length} geprueft, ${raender} mit Rand - nichts geschrieben.`); return; }

  /* STEMPEL FUER DEN BROWSER. Kacheln sind abgeleitete Dateien und
     aendern sich, wenn dieses Skript laeuft - der Browser darf das nicht
     verpassen. Der Server schickt zwar seit dem 07.09.2026 Last-Modified
     mit, aber ein Eintrag, der einmal mit "ein Jahr gueltig" im Vorrat
     liegt, wird gar nicht erst erfragt: Der neue Header erreicht ihn nie.
     Deshalb bekommt jede Kachel-Adresse diesen Stempel angehaengt - wenn
     er sich aendert, ist es fuer den Browser eine neue Adresse und er
     holt sie. Ohne Handarbeit, ohne geleerten Vorrat.
     (Caspar_D, 07.09.2026: "also bei deinem internen browser
     funktioniert es erstmal nicht") */
  try {
    fs.writeFileSync(STAND_DATEI,
      JSON.stringify({ stand: (fertig || titelbilder) ? Date.now() : (stand.stand || Date.now()), gerechnet: fertig,
        titelbild: titelbildStand,
        wozu: 'Haengt als ?k= an jeder Kachel- und Titelbild-Adresse. Aendert sich, sobald Kacheln oder Titelbilder neu gerechnet wurden - so holt der Browser sie, ohne dass jemand seinen Vorrat leeren muss. titelbild: je Titel, ob ein beschnittenes titelbild.jpg neben cover.jpg liegt.' }, null, 1));
  } catch (e) {}
  if (titelbilder) console.log(`\n\nTitelbilder ohne Rand: ${titelbilder} neu (gesamt ${Object.values(titelbildStand).filter(Boolean).length})`);

  const dauer = Math.round((Date.now() - start) / 1000);
  console.log(`\n\nfertig:     ${fertig}`);
  if (misslungen) console.log(`misslungen: ${misslungen}`);
  console.log(`Größe:      ${(bytes/1048576).toFixed(1)} MB `
            + `(Schnitt ${Math.round(bytes/Math.max(fertig,1)/1024)} KB)`);
  console.log(`Dauer:      ${dauer} s`);
  console.log(`\nHinweis: Auf dieser exFAT-Platte belegt jede Kachel einen`);
  console.log(`ganzen 1-MB-Block, also rund ${fertig} MB statt ${(bytes/1048576).toFixed(0)} MB.`);
})();
