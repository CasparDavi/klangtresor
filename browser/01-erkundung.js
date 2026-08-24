/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ============================================================
   Suno-Archiv · Schritt 1: Erkundung
   ------------------------------------------------------------
   Dieses Skript lädt NICHTS herunter und ändert NICHTS.
   Es schaut nur nach, welcher Suno-Endpunkt antwortet und
   welche Felder ein Song-Datensatz überhaupt enthält.

   Anwendung:
     1. In Chrome suno.com öffnen und eingeloggt sein
     2. Rechtsklick -> "Untersuchen" -> Reiter "Console"
     3. Diese Datei komplett kopieren, in die Console einfügen, Enter
     4. Die Ausgabe hierher zurückkopieren
   ============================================================ */

(async () => {
  const gruen = 'color:#4ade80;font-weight:bold';
  const grau  = 'color:#94a3b8';
  const log = (...a) => console.log('%c[Archiv]', gruen, ...a);

  console.log('%c─── KlangTresor · Erkundung ───', gruen);

  // --- 1. Zugangstoken besorgen -----------------------------
  // Suno benutzt "Clerk" zur Anmeldung. Clerk hängt ein Objekt
  // ans window, über das wir ein frisches Token bekommen.
  // Diese Token leben nur ca. 60 Sekunden - deshalb holen wir
  // es immer direkt vor Gebrauch, statt es irgendwo zu speichern.
  if (!window.Clerk || !window.Clerk.session) {
    log('%cFEHLER: Kein Clerk-Login gefunden.', 'color:#f87171');
    log('Bist du auf suno.com und eingeloggt? Seite neu laden und nochmal.');
    return;
  }

  const token = await window.Clerk.session.getToken();
  const user  = window.Clerk.user || {};
  log('Angemeldet als:', user.username || user.id || '(unbekannt)');
  log('Token erhalten, Länge:', token ? token.length : 0);

  // --- 2. Kandidaten-Endpunkte durchprobieren ---------------
  // Suno ändert seine API gelegentlich. Statt zu raten, welcher
  // Pfad heute gilt, probieren wir mehrere und schauen, was kommt.
  const kandidaten = [
    ['Eigene Songs (feed v2)',  'https://studio-api.prod.suno.com/api/feed/v2?page=0'],
    ['Eigene Songs (feed)',     'https://studio-api.prod.suno.com/api/feed/?page=0'],
    ['Eigenes Profil',          'https://studio-api.prod.suno.com/api/profiles/me'],
    ['Playlists',               'https://studio-api.prod.suno.com/api/playlist/me?page=0'],
    ['Suno-Proxy (feed v2)',    'https://suno.com/api/feed/v2?page=0'],
  ];

  const treffer = [];

  for (const [name, url] of kandidaten) {
    try {
      const t = await window.Clerk.session.getToken();   // immer frisch
      const r = await fetch(url, { headers: { Authorization: 'Bearer ' + t } });
      const typ = (r.headers.get('content-type') || '').includes('json') ? 'JSON' : 'kein JSON';
      console.log(`%c  ${r.ok ? '✓' : '✗'} ${r.status}  ${name}`, r.ok ? gruen : grau, `(${typ})`);
      if (r.ok && typ === 'JSON') {
        const daten = await r.json();
        treffer.push({ name, url, daten });
      }
    } catch (e) {
      console.log(`%c  ✗ Fehler  ${name}`, grau, e.message);
    }
    await new Promise(r => setTimeout(r, 400));          // freundlich bleiben
  }

  if (!treffer.length) {
    log('%cKein Endpunkt hat brauchbar geantwortet.', 'color:#f87171');
    log('Dann gehen wir den anderen Weg - sag Bescheid.');
    return;
  }

  // --- 3. Struktur des ersten Treffers zeigen ---------------
  console.log('%c─── Was zurückkommt ───', gruen);

  for (const t of treffer) {
    // Die Songliste steckt je nach Endpunkt unter clips / songs / direkt im Array
    const liste = Array.isArray(t.daten) ? t.daten
                : t.daten.clips || t.daten.songs || t.daten.playlists || null;

    console.log(`%c${t.name}`, gruen,
                Array.isArray(liste) ? `→ ${liste.length} Einträge auf Seite 0` : '→ kein Array',
                '| Felder oberste Ebene:', Object.keys(t.daten).join(', '));

    if (liste && liste.length) {
      const s = liste[0];
      console.log('   Felder eines Eintrags:');
      console.log('   ' + Object.keys(s).sort().join(', '));
      if (s.metadata) {
        console.log('   Felder in .metadata:');
        console.log('   ' + Object.keys(s.metadata).sort().join(', '));
      }
      console.log('   Beispiel-Eintrag (zum Aufklappen):', s);
    }
  }

  // --- 4. Wie viele Songs sind es insgesamt? ----------------
  // Wir blättern nur durch die Seiten und zählen, laden aber nichts.
  const haupt = treffer.find(t => /feed/i.test(t.name));
  if (haupt) {
    log('Zähle Songs (nur blättern, kein Download) ...');
    let seite = 0, gesamt = 0, oeffentlich = 0;
    const basis = haupt.url.replace(/page=\d+/, 'page=');

    while (seite < 60) {                                  // Sicherheitsgrenze
      const t = await window.Clerk.session.getToken();
      const r = await fetch(basis + seite, { headers: { Authorization: 'Bearer ' + t } });
      if (!r.ok) break;
      const d = await r.json();
      const l = Array.isArray(d) ? d : (d.clips || d.songs || []);
      if (!l.length) break;
      gesamt      += l.length;
      oeffentlich += l.filter(s => s.is_public).length;
      seite++;
      await new Promise(r => setTimeout(r, 500));         // freundlich bleiben
    }
    console.log('%c─── Ergebnis ───', gruen);
    log('Seiten durchgeblättert:', seite);
    log('Songs gesamt:', gesamt);
    log('davon veröffentlicht:', oeffentlich);
  }

  console.log('%c─── Fertig. Nichts heruntergeladen, nichts verändert. ───', gruen);
})();
