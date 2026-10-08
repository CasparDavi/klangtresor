/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   BILDNISSE FÜRS SKIZZENBUCH (08.10.2026). Die Würdigung „Ispirazione" zeigt die fünf Menschen mit den längsten Kommentaren in
   runden Medaillons - nicht als Foto, sondern als Federzeichnung wie die Cover daneben. Gezeichnet wird auf dem Server, nur auf
   Abruf und nur für die gebrauchten Avatare (bin/feder.js --avatare; server.js bilderVorbereiten('bildnis')).

     bildnisseBereit(avatarUrls, { melde, abgebrochen })  ->  Map(url -> { feder, bild })
       avatarUrls   die Avatar-Adressen bei Suno, wie sie in den Kommentaren stehen
       feder        Adresse der Federzeichnung (/bildnis/<SHA-1>.png?f=…) oder null
       bild         die eigene Kopie des Avatars (/avatar/<datei>) oder null (keine Kopie im Archiv)
       melde(text)  Stand für die Statuszeile, solange gewartet wird; abgebrochen() beendet das Warten (neuer Bau)

   Ablauf wie federBereit() in plakat.js: maßgeblich ist der Stand des SERVERS (/api/feder, Abschnitt avatare, je Eintrag gilt nach
   den Regeln von feder.js - fehlend, neues Avatar-Bild, neues Modell); fehlt etwas, ein Anstoß, dann Warten mit Zeitwächter. Ist feder
   null, nimmt das Blatt das Foto (bild): bei einem eingefrorenen Archiv (dort wird nichts gerechnet, POST gibt 405), bei einem älteren
   Server ohne Bildnisse, wenn das Modell fehlt, wenn ein Bild nicht zu zeichnen ist, und wenn das Warten länger als GEDULD dauert.
   Höchstens ein Anstoß je Stand: sind seit dem letzten Anstoß dieselben Avatare offen geblieben und ein Bildnislauf zu Ende gegangen
   (ffmpeg fehlt, Platte voll, onnxruntime lädt nicht), wird nicht bei jeder Reglerbewegung neu angestoßen. Fehlt das Modell und hat
   ein Lauf es schon vergeblich zu holen versucht, auch nicht - der Morgenlauf holt es (feder.js --nur-modell). */

/* So heißen die Kopien von bin/avatare.js; dieselbe Form prüfen feder.js (AVATARNAME) und server.js (/avatar/, art=bildnis). */
const AVATARNAME = /^[0-9a-f]{40}\.(jpg|png|webp|gif)$/;
/* Fünf Bildnisse brauchen rund acht Sekunden (gemessen am 08.10.2026: 7,8 s samt Laden des Modells, 1,46 s je Bild). Länger als
   eine Minute wartet das Blatt nicht - dann läuft auf dem Server meist ein anderer Lauf (Cover, Morgenlauf), und die Fotos stehen,
   bis das Blatt das nächste Mal gebaut wird. */
const GEDULD = 60000, TAKT = 1500;
let anstoss = null;

const schlaf = (ms) => new Promise(ok => setTimeout(ok, ms));
const zeichnungVon = (datei) => '/bildnis/' + datei.replace(/\.[a-z]+$/, '.png');
async function json(adresse) { try { const r = await fetch(adresse, { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch (e) { return null; } }

/* Adresse bei Suno -> eigene Datei. Die Seite hält die Zuordnung in schaumAvatare (web/index.html, gefüllt von schaumGesichterLaden
   aus /api/gesichter); ein Modul sieht das let des klassischen Skripts nur über seinen Namen, darum typeof. Fehlt eine Adresse (die Seite
   lud die Zuordnung vor dem letzten Holen der Avatare), wird /api/gesichter selbst gefragt. */
async function avatarDateien(urls) {
  const seite = () => (typeof schaumAvatare !== 'undefined' && schaumAvatare) || {};
  let karte = seite();
  if (urls.some(u => !karte[u]) && typeof schaumGesichterLaden === 'function') { try { await schaumGesichterLaden(); } catch (e) {} karte = seite(); }
  if (urls.some(u => !karte[u])) { const d = await json('/api/gesichter'); if (d && d.avatare) karte = Object.assign({}, karte, d.avatare); }
  return karte;
}

export async function bildnisseBereit(avatarUrls, { melde = null, abgebrochen = () => false } = {}) {
  const urls = [...new Set((avatarUrls || []).filter(u => typeof u === 'string' && u))];
  if (!urls.length) return new Map();
  const karte = await avatarDateien(urls), datei = new Map();
  for (const u of urls) if (AVATARNAME.test(karte[u] || '')) datei.set(u, karte[u]);
  const fehlt = new Set();           /* vom Server nicht angenommen: die Kopie liegt nicht (mehr) im Archiv */
  const sage = (t) => { if (melde) melde(t); };
  const gilt = (d, f) => !!(d && d.avatare && d.avatare[f] && d.avatare[f].gilt);
  const ergebnis = (d) => new Map(urls.map(u => {
    const f = datei.get(u), e = f && gilt(d, f) ? d.avatare[f] : null;
    return [u, { feder: e && !e.unlesbar ? zeichnungVon(f) + '?f=' + (Date.parse(e.gerechnet) || 1) : null, bild: f && !fehlt.has(f) ? '/avatar/' + f : null }];
  }));

  let d = await json('/api/feder');
  if (!d || !d.avatare) return ergebnis(null);       /* älterer Server: kein art=bildnis - er nähme es als Cover-Lauf */
  const offen = [...new Set(datei.values())].filter(f => !gilt(d, f));
  if (!offen.length || abgebrochen()) return ergebnis(d);

  const letzte = (d.lauf && d.lauf.letzte) || {};
  if (d.modell === false && ['bildnis', 'feder'].some(a => letzte[a] && letzte[a].fehler === 'modelle')) {
    sage('Das Modell für die Federzeichnungen ließ sich nicht laden – die Bildnisse zeigen vorerst die Fotos.');
    return ergebnis(d);
  }
  const schluessel = offen.slice().sort().join(',');
  /* schon einmal bis zur GEDULD gewartet und der Server rechnet (oder wartet) noch: nicht wieder eine Minute hängen - gleich die Fotos
     (vorher hing jeder Neubau 62 s, solange ein Cover-Federlauf den Bildnislauf warten ließ; Fallensuche 1.0.62) */
  if (anstoss && anstoss.schluessel === schluessel && anstoss.abgelaufen && d.lauf && d.lauf.laeuft) {
    sage('Die Bildnisse werden noch gezeichnet – vorerst die Fotos; beim nächsten Öffnen sind sie da.');
    return ergebnis(d);
  }
  if (anstoss && anstoss.schluessel === schluessel && letzte.bildnis && letzte.bildnis.fertigAm > anstoss.zeit) {
    sage('Die Bildnisse ließen sich nicht zeichnen – vorerst die Fotos; ein Neustart von KlangTresor versucht es wieder.');
    return ergebnis(d);
  }
  anstoss = { schluessel, zeit: Date.now() };
  let antwort = null;
  try { antwort = await fetch('/api/bilder/vorbereiten?art=bildnis&avatare=' + encodeURIComponent(offen.join(',')), { method: 'POST' }); } catch (e) {}
  if (!antwort || !antwort.ok) {
    if (antwort && (antwort.status === 405 || antwort.status === 403)) sage('Dieses Archiv ist nur zum Ansehen – die Bildnisse entstehen im laufenden KlangTresor, hier stehen die Fotos.');
    return ergebnis(d);
  }
  let warten = offen;
  try { const a = await antwort.json(); if (Array.isArray(a.angenommen)) { warten = offen.filter(f => a.angenommen.includes(f)); offen.forEach(f => { if (!a.angenommen.includes(f)) fehlt.add(f); }); } } catch (e) {}

  /* Warten wie federBereit: bis alles gilt, oder der gesehene Bildnislauf endete (ein nachgereichter schließt im selben Augenblick an),
     oder nach 15 s noch gar kein Lauf begann, oder GEDULD um ist. Ein Aussetzer beim Fragen behält den letzten Stand. */
  const t0 = Date.now(); let gesehen = false;
  if (warten.length) sage('Die Bildnisse werden vorbereitet …');
  while (warten.some(f => !gilt(d, f))) {
    await schlaf(TAKT); if (abgebrochen()) return ergebnis(d);
    const neu = await json('/api/feder'); if (neu && neu.avatare) d = neu;
    const l = d.lauf || {}, laeuft = !!(l.laeuft && l.art === 'bildnis'); if (laeuft && l.schritt !== 'wartet') gesehen = true;   /* gesehen = er rechnet wirklich */
    if (laeuft && l.von) sage(`Die Bildnisse werden mit der Feder gezeichnet … ${l.n || 0} von ${l.von}`);
    if ((gesehen && !laeuft) || (!gesehen && !l.laeuft && Date.now() - t0 > 15000)) break;
    /* der Bildnislauf wartet hinter einem anderen Lauf (Cover, Gesichter): nach 15 s mit den Fotos weiter, statt bis GEDULD */
    const hinten = !gesehen && l.laeuft && (l.art !== 'bildnis' || l.schritt === 'wartet') && Date.now() - t0 > 15000;
    if (hinten || Date.now() - t0 > GEDULD) { anstoss.abgelaufen = true; sage('Die Bildnisse brauchen länger – vorerst die Fotos; beim nächsten Öffnen sind sie da.'); return ergebnis(d); }
  }
  const rest = warten.filter(f => !gilt(d, f)).length;
  /* fertig: die eigene Fortschrittszeile wegnehmen - „1 von 2" bliebe sonst stehen, obwohl alles da ist */
  sage(!rest ? '' : rest === 1 ? 'Ein Bildnis ließ sich nicht zeichnen – dort steht das Foto.' : `${rest} Bildnisse ließen sich nicht zeichnen – dort stehen die Fotos.`);
  return ergebnis(d);
}
