#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   GESUNDHEIT  ·  bin/gesundheit.js  ·  läuft als ERSTER Schritt
   der Morgenroutine

   Caspar_D, 29.08.2026: "Es darf nicht passieren, dass unbemerkt
   Links sterben und still Daten deswegen nicht aktualisiert werden."
   Und: "nur Server responses abfragen, ob 404 200 202 oder wie auch
   immer man sowas machen würde."

   Genau das: Jede Adresse, von der die Routine Daten holt, bekommt
   EINEN Request, und gemeldet wird der Statuscode. Keine Anmeldung,
   keine Inhalte, keine Reparaturversuche. Der letzte Befund liegt in
   library/gesundheit.json - ÄNDERUNGEN gegenüber dem Vortag werden
   laut gemeldet, denn ein Link, der schon immer tot war, ist ein
   bekannter Zustand; einer, der heute stirbt, ist eine Nachricht.

   Die Prüf-Adressen kommen aus dem eigenen Katalog (echte, benutzte
   Links) und aus den Skripten selbst:

     suno.com                                    die Ernte (Browser)
     studio-api.prod.suno.com/api/profiles/...   community-profile/-hirsch
     studio-api-prod.suno.com/api/gen/.../comments  reaktionen.js
     cdn2.suno.ai/<bildUrl aus dem Katalog>      wiederherstellen.js (Bilder)
     cdn1.suno.ai/<videoUrl aus dem Katalog>     wiederherstellen.js (Videos)

   GET statt HEAD: Sunos CDN beantwortet HEAD mit 403, GET mit
   Range: bytes=0-0 aber mit 206 (gemessen 29.08.2026). Ein
   HEAD-Prüfer hätte einen lebenden Link für tot erklärt.

   Audio ist keine Netzprüfung mehr: Der Katalog trägt als audioUrl
   inzwischen wörtlich .../api/forbidden - Suno gibt keine
   Audio-Direktlinks mehr heraus (bekannt; bin/wav.js außer Betrieb).
   Das Skript zählt diese Platzhalter und meldet, wenn wieder echte
   Links auftauchen sollten.

   Exit ist immer 0: Die Routine soll weiterlaufen - die lokalen
   Schritte nützen auch ohne Netz. Die Lautstärke ist das Protokoll.
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const WURZEL = path.join(__dirname, '..');
const LIB = path.join(WURZEL, 'library');
const MERKER = path.join(LIB, 'gesundheit.json');

/* Statusnummern in normale Sprache (Caspar_D, 29.08.2026: "übersetze
   die statusnummern in normale Sprache"). Unbekannte Codes bekommen
   die Bedeutung ihrer Hunderter-Klasse. */
const KLARTEXT = {
  200: 'in Ordnung', 202: 'angenommen', 204: 'in Ordnung, ohne Inhalt',
  206: 'Teilstück geliefert — in Ordnung',
  301: 'dauerhaft umgezogen', 302: 'umgeleitet', 304: 'unverändert',
  400: 'Anfrage fehlerhaft', 401: 'Anmeldung nötig', 403: 'Zugriff verweigert',
  404: 'gibt es nicht (mehr)', 405: 'Methode nicht erlaubt', 410: 'dauerhaft weg',
  416: 'angefragter Ausschnitt ungültig', 422: 'Anfrage unverständlich — Pflichtangaben fehlen',
  429: 'gebremst — zu viele Anfragen', 451: 'aus Rechtsgründen gesperrt',
  500: 'Fehler auf Sunos Server', 502: 'Suno-Server nicht erreichbar (Zwischenstation)',
  503: 'Suno-Server überlastet oder in Wartung', 504: 'Suno-Server antwortet nicht rechtzeitig',
};
function klartext(c) {
  if (typeof c !== 'number') return c;                     /* "keine Antwort (…)" bleibt wie er ist */
  const wort = KLARTEXT[c] || { 2: 'in Ordnung', 3: 'umgeleitet', 4: 'abgewiesen', 5: 'Fehler auf Sunos Seite' }[Math.floor(c / 100)] || 'unbekannt';
  return `${c} (${wort})`;
}

/* Range nur fuer die CDNs (spart die Datei); die APIs beantworten einen
   Range-Header mit 422 - gemessen am 29.08.2026, die Profil-API lief
   im selben Moment ohne Range einwandfrei. */
async function code(url, mitRange) {
  try {
    const antwort = await fetch(url, {
      method: 'GET',
      headers: mitRange ? { Range: 'bytes=0-0' } : {},
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    });
    /* Der Body interessiert nicht - Verbindung gleich freigeben. */
    try { antwort.body && antwort.body.cancel && antwort.body.cancel(); } catch (e) {}
    return antwort.status;
  } catch (e) {
    return 'keine Antwort (' + (e.name === 'TimeoutError' ? 'Zeitüberschreitung' : e.message) + ')';
  }
}

(async () => {
  let katalog = null;
  try { katalog = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(LIB, 'katalog.json.gz')))); } catch (e) {}
  const eigene = katalog ? Object.values(katalog.songs).filter(s => !s.fremd) : [];
  const handle = (katalog && katalog.profil && katalog.profil.handle) || 'caspar_d';
  const mitBild = eigene.find(s => s.bildUrl && s.bildUrl.startsWith('http'));
  const mitVideo = eigene.find(s => s.videoUrl && s.videoUrl.startsWith('http'));
  const irgendeine = eigene.find(s => s.id);

  const alteAudio = eigene.find(s => (s.audioUrl || '').startsWith('http') && !(s.audioUrl || '').includes('/api/forbidden'));
  const PRUEFUNGEN = [
    { was: 'Suno-Seite (Ernte)', url: 'https://suno.com', gut: [200] },
    /* Exakt die URL-Form von bin/community-profile.js - ohne die
       Pflicht-Query antwortet die API 422 (gemessen 29.08.2026). */
    { was: 'Profil-API (Nachbarschaft)', url: `https://studio-api.prod.suno.com/api/profiles/${encodeURIComponent(handle)}/?page=1&playlists_sort_by=upvote_count&clips_sort_by=created_at`, gut: [200] },
    irgendeine && { was: 'Kommentar-API (Reaktionen)', url: `https://studio-api-prod.suno.com/api/gen/${irgendeine.id}/comments?order=newest`, gut: [200] },
    mitBild && { was: 'Bild-CDN (Medien)', url: mitBild.bildUrl, gut: [200, 206], range: true },
    mitVideo && { was: 'Video-CDN (Medien)', url: mitVideo.videoUrl, gut: [200, 206], range: true },
    /* Beobachtung, kein Alarm: Audio ist bekannt gesperrt (403 auch auf
       alte Links). Die Zeile ist der Wachposten fuer den Tag, an dem
       Suno wieder aufmacht - dann meldet der Aenderungs-Vergleich es. */
    alteAudio && { was: 'Audio-CDN (außer Betrieb)', url: alteAudio.audioUrl, gut: [200, 206], range: true, beobachten: true },
  ].filter(Boolean);

  let alt = {};
  try { alt = JSON.parse(fs.readFileSync(MERKER, 'utf8')).befunde || {}; } catch (e) {}
  const befunde = {};
  let veraendert = 0, kaputt = 0;

  for (const p of PRUEFUNGEN) {
    const c = await code(p.url, !!p.range);
    befunde[p.was] = c;
    const ok = p.gut.includes(c);
    const vorher = alt[p.was];
    let zeile = `  ${p.beobachten ? '·' : ok ? '✓' : '✗'} ${p.was.padEnd(28)} → ${klartext(c)}`;
    if (p.beobachten && ok) zeile += '   WIEDER OFFEN?';
    if (vorher !== undefined && vorher !== c) {
      zeile += `   ÄNDERUNG: bisher ${klartext(vorher)}`;
      veraendert++;
    }
    if (!ok && !p.beobachten) kaputt++;
    console.log(zeile);
  }

  /* Audio: kein Netz-Test, sondern der Katalog-Befund. */
  if (eigene.length) {
    const verboten = eigene.filter(s => (s.audioUrl || '').includes('/api/forbidden')).length;
    const echte = eigene.filter(s => (s.audioUrl || '').startsWith('http') && !(s.audioUrl || '').includes('/api/forbidden')).length;
    befunde['Audio-Links im Katalog'] = `${verboten} forbidden, ${echte} echte`;
    const vorher = alt['Audio-Links im Katalog'];
    let zeile = `  · Audio-Links im Katalog       → ${verboten} von ${eigene.length} "forbidden"-Platzhalter, ${echte} alte Link-Einträge (CDN sperrt beide)`;
    if (vorher !== undefined && vorher !== befunde['Audio-Links im Katalog']) { zeile += '   ÄNDERUNG: bisher ' + vorher; veraendert++; }
    console.log(zeile);
  }

  fs.writeFileSync(MERKER, JSON.stringify({
    stand: new Date().toISOString(),
    wozu: 'Letzter Verbindungs-Befund der Morgenroutine. Änderungen meldet bin/gesundheit.js laut.',
    befunde,
  }, null, 1));

  if (kaputt) console.log(`  → ${kaputt} Adresse(n) antworten nicht wie erwartet - die zugehörigen Schritte werden still leer ausgehen!`);
  else console.log('  → alle Verbindungen antworten wie erwartet' + (veraendert ? ` (${veraendert} Änderung(en), siehe oben)` : '.'));
})().catch(e => { console.error('  Gesundheit: ' + e.message); process.exit(0); });
