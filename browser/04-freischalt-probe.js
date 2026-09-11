/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ============================================================
   Schritt 4: Freischalt-Probe
   ------------------------------------------------------------
   EINE Frage, und an ihr hängt viel:

       Kostet der Abruf eines Songs, der schon freigeschaltet ist,
       ein zweites Download-Guthaben?

   docs/suno/AUDIO-BEZUG.md (Nachtrag 07.09.) schließt: nein — „das
   Guthaben kostet den SONG, nicht die Datei"; ein Unlock schaltet M4A,
   MP3 und WAV zusammen frei. Das ist ein Schluss aus dem, was der
   Download-Dialog anzeigt. Gemessen wurde es nie.

   Stimmt der Schluss, dann kann die Morgenroutine jeden freigeschalteten
   Titel selbst holen — im Original, ohne Download-Ordner, ohne
   Umbenennen, ohne Handarbeit. Stimmt er nicht, lassen wir es.

   ------------------------------------------------------------
   WARUM DAS HIER LÄUFT UND NICHT ALS NODE-SKRIPT

   Der Clerk-Token gehört der Herkunft suno.com, lebt rund eine Minute
   und läßt sich weder speichern noch weiterreichen. Es gab einmal den
   Versuch, dem Server über ein __client-Cookie einen eigenen Zugang zu
   geben; der ist am 19.08.2026 aufgegeben und am 11.09.2026 gelöscht
   worden (docs/suno/WEGE.md, „Aufgegeben: Server-Login"). Der Token
   kommt aus einer aktiven Sitzung — also von hier.

   ------------------------------------------------------------
   GEMESSEN WIRD GENAU DIES

     1. Guthaben vorher        GET /api/billing/info/
     2. Freigeschaltet?        GET /api/clip/<id>
     3. Download anfordern     GET /api/download/clip/<id>?format=…
     4. Guthaben nachher       GET /api/billing/info/

   Die Differenz zwischen 1 und 4 ist die Antwort. Mehr nicht — die
   Datei selbst wird NICHT geholt.

   Schritt 3 ist der einzige, der etwas kosten kann. Davor steht ein
   Rückfragefenster, in dem Song, Freischaltstand und Zählerstand
   dastehen. Drücken muß ein Mensch.

   Caspar_D, 11.09.2026: „Ich habe in meinem Plan noch 57 downloads frei.
   wenn du 10 davon verballerst, ist das kein Problem." Diese Probe
   braucht im günstigen Fall null und im ungünstigen eines.

   ------------------------------------------------------------
   ANWENDUNG

     1. In Chrome suno.com öffnen, angemeldet sein
     2. Rechtsklick → Untersuchen → Reiter Console
     3. Diese Datei ganz hineinkopieren, Enter
     4. Die Ausgabe hierher zurückkopieren

   Oder als Lesezeichen, wie der Morgenknopf:
     javascript:(function(){var s=document.createElement('script');
     s.src='http://localhost:8788/browser/04-freischalt-probe.js?'+Date.now();
     document.body.appendChild(s);})();
   ============================================================ */

(async () => {
  const API    = 'https://studio-api-prod.suno.com';
  const DAHEIM = 'http://localhost:8788';

  const gruen = 'color:#4ade80;font-weight:bold';
  const grau  = 'color:#94a3b8';
  const rot   = 'color:#f87171;font-weight:bold';
  const gelb  = 'color:#fbbf24;font-weight:bold';
  const log = (...a) => console.log('%c[Probe]', gruen, ...a);
  const hin = (...a) => console.log('%c[Probe]', grau, ...a);

  console.log('%c─── KlangTresor · Freischalt-Probe ───', gruen);

  /* --- Token. Nie ausgeben, nie weiterreichen. ------------------- */
  if (!window.Clerk || !window.Clerk.session) {
    console.log('%cKein Clerk-Login gefunden.', rot);
    hin('Bist du auf suno.com und angemeldet? Seite neu laden, dann noch einmal.');
    return;
  }
  const kopf = async () => ({
    Authorization: 'Bearer ' + (await window.Clerk.session.getToken()),
    Accept: 'application/json',
  });
  log('Angemeldet als', (window.Clerk.user || {}).username || '(unbekannt)');

  /* Hausregel: eine Anfrage zur Zeit, mit Pause. Nie im Rudel. */
  const ruhe = (ms) => new Promise((r) => setTimeout(r, ms));
  async function frag(weg) {
    await ruhe(1200);
    const r = await fetch(API + weg, { headers: await kopf() });
    let d = null; try { d = await r.json(); } catch (e) {}
    return { status: r.status, d };
  }

  const stand = (b) => {
    const u = (b && b.download_usage) || {};
    return {
      benutzt: u.current_period_downloads_used,
      grenze:  u.current_period_downloads_limit,
      erbe:    u.additional_download_remaining,
    };
  };
  const zeig = (s, wann) => {
    const frei = (s.grenze ?? 0) - (s.benutzt ?? 0);
    log(`${wann}:  ${s.benutzt} von ${s.grenze} verbraucht → ${frei} frei` +
        `   ·   Erbstücke: ${s.erbe}`);
  };

  /* --- 1. Guthaben vorher ---------------------------------------- */
  const b1 = await frag('/api/billing/info/');
  if (b1.status !== 200) { console.log('%cbilling/info: ' + b1.status, rot); return; }
  const vorher = stand(b1.d);
  zeig(vorher, 'Guthaben vorher');

  /* --- Welcher Song? --------------------------------------------- */
  /* Der Katalog liegt daheim. Von dort die jüngsten Titel holen, damit
     man nicht mit UUIDs hantieren muß. Klappt das nicht (Server aus),
     tut es auch eine von Hand eingetippte id. */
  let vorschlag = '';
  let namen = {};
  try {
    const k = await (await fetch(DAHEIM + '/api/index')).json();
    const liste = (Array.isArray(k.songs) ? k.songs : Object.values(k.songs || {}))
      .filter((s) => s && s.id)
      .sort((a, b) => String(b.erstellt || '').localeCompare(String(a.erstellt || '')));
    hin('Die zehn jüngsten Titel im Archiv:');
    for (const s of liste.slice(0, 10)) {
      namen[s.id] = s.titel;
      console.log('   %c' + String(s.erstellt).slice(0, 10) + '  ' + s.id + '  ' + s.titel, grau);
    }
    vorschlag = (liste[0] || {}).id || '';
  } catch (e) {
    hin('KlangTresor daheim antwortet nicht — dann bitte die id von Hand.');
  }

  const id = (window.prompt(
    'Welchen Song prüfen?\n\n' +
    'Am besten einen, den du SCHON freigeschaltet hast — dann sollte der\n' +
    'Abruf nichts kosten, und genau das wird hier gemessen.',
    vorschlag) || '').trim();
  if (!id) { hin('Abgebrochen. Nichts geschehen.'); return; }

  /* --- 2. Freigeschaltet? ---------------------------------------- */
  const c = await frag('/api/clip/' + id);
  if (c.status !== 200) { console.log('%cclip/<id>: ' + c.status, rot); return; }
  const titel = (c.d && c.d.title) || namen[id] || '(ohne Titel)';
  const frei  = c.d && c.d.is_download_unlocked;
  const grund = c.d && c.d.download_disabled_reason;
  log('Song:', titel);
  hin('  is_download_unlocked =', JSON.stringify(frei));
  if (grund) hin('  download_disabled_reason =', JSON.stringify(grund));

  if (frei === true)  console.log('%cDieser Song ist freigeschaltet — ein Abruf sollte nichts kosten.', gruen);
  else if (frei === false) console.log('%cDieser Song ist NICHT freigeschaltet — ein Abruf kostet ein Guthaben.', gelb);
  else console.log('%cSuno nennt den Freischaltstand nicht (Feld fehlt).', gelb);

  /* --- 3. Das Rückfragefenster ------------------------------------ */
  const format = 'mp3';
  const los = window.confirm(
    'Jetzt wird bei Suno ein Download angefordert.\n\n' +
    'Song:        ' + titel + '\n' +
    'Format:      ' + format + '\n' +
    'freigeschaltet: ' + JSON.stringify(frei) + '\n\n' +
    'Zähler jetzt: ' + vorher.benutzt + ' von ' + vorher.grenze +
    '  ·  Erbstücke: ' + vorher.erbe + '\n\n' +
    (frei === true
      ? 'Erwartung: der Zähler bleibt stehen.'
      : 'ACHTUNG: hier ist ein Guthaben zu erwarten.') + '\n\n' +
    'Die Datei wird NICHT geladen — nur die Adresse angefordert.\n\n' +
    'Fortfahren?');
  if (!los) { hin('Abgebrochen. Es ist nichts geschehen.'); return; }

  let adresse = null;
  for (let runde = 1; runde <= 10 && !adresse; runde++) {
    const a = await frag(`/api/download/clip/${id}?format=${format}`);
    if (a.status !== 200) { console.log('%cdownload/clip: ' + a.status, rot); break; }
    if (a.d && a.d.download_url) { adresse = a.d.download_url; break; }
    hin(`  Runde ${runde}: status=${JSON.stringify(a.d && a.d.status)} — warte 3 s`);
    await ruhe(3000);
  }
  if (adresse) {
    log('Adresse bekommen, Wirt:', new URL(adresse).host);
    hin('  (nicht geladen — die Adresse ist kurzlebig und wird hier nicht gemerkt)');
  } else {
    console.log('%cKeine Adresse bekommen.', gelb);
  }

  /* --- 4. Guthaben nachher ---------------------------------------- */
  const b2 = await frag('/api/billing/info/');
  if (b2.status !== 200) { console.log('%cbilling/info: ' + b2.status, rot); return; }
  const nachher = stand(b2.d);
  zeig(nachher, 'Guthaben nachher');

  const dPeriode = (nachher.benutzt ?? 0) - (vorher.benutzt ?? 0);
  const dErbe    = (vorher.erbe ?? 0) - (nachher.erbe ?? 0);

  console.log('%c─── Befund ───', gruen);
  if (dPeriode === 0 && dErbe === 0) {
    console.log('%cDer Zähler hat sich NICHT bewegt.', gruen);
    hin('Ein zweiter Abruf eines freigeschalteten Songs ist frei.');
    hin('Damit kann die Morgenroutine sie selbst holen — im Original.');
  } else {
    console.log('%cDer Zähler ist gesprungen: Periode +' + dPeriode + ', Erbstücke −' + dErbe, rot);
    hin('Also kostet jeder Abruf. Der Weg bleibt Handarbeit.');
  }
  hin('Diese Ausgabe bitte zurückkopieren.');
})();
