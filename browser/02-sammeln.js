/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ============================================================
   Suno-Archiv · Sammeln  (Vorlage)
   ------------------------------------------------------------
   NICHT diese Datei benutzen, sondern die daraus erzeugte:

       node bin/sammelskript.js

   Das schreibt browser/02-sammeln-aktuell.js mit der Liste der
   bereits archivierten Songs darin. Nur so werden im Monat
   ausschließlich die neuen Songs geholt.

   Ablauf danach:
     1. Chrome:  https://suno.com/@DEIN-HANDLE?page=songs
     2. Rechtsklick -> Untersuchen -> Console
     3. browser/02-sammeln-aktuell.js einfügen, Enter
     4. Warten. Am Ende lädt die Datei suno-archiv-metadaten.json
     5. Auf dem Mac:
          mv ~/Downloads/suno-archiv-metadaten.json \
             library/roh/profil-$(date +%Y-%m-%d-%H-%M-%S).json
          node bin/aufbereiten.js
          node bin/laden.js
   ============================================================ */

(async () => {
  const G = 'color:#4ade80;font-weight:bold', R = 'color:#f87171';
  const log = (...a) => console.log('%c[Archiv]', G, ...a);
  const schlaf = ms => new Promise(r => setTimeout(r, ms));

  // Wird von bin/sammelskript.js gefüllt:
  const BEKANNT = new Set([/*BEKANNTE_IDS*/]);

  if (!window.Clerk?.session) { console.log('%cNicht eingeloggt.', R); return; }
  if (!location.pathname.startsWith('/@')) {
    console.log('%cBitte erst auf deine Profilseite gehen.', R); return;
  }
  log(`${BEKANNT.size} Songs sind bereits im Archiv.`);

  // --- 1. Profilseite aufblättern ------------------------------
  // Die Seite lädt beim Scrollen nach. Wir beobachten das Dokument
  // laufend, damit keine ID verloren geht, falls ältere Kacheln
  // wieder entfernt werden.
  const ids = new Set();
  const ernten = () => {
    document.querySelectorAll('a[href*="/song/"]').forEach(a => {
      const m = (a.getAttribute('href') || '').match(/\/song\/([0-9a-f-]{36})/);
      if (m) ids.add(m[1]);
    });
    return ids.size;
  };
  new MutationObserver(ernten).observe(document.body, { childList:true, subtree:true });

  log('Blättere die Profilseite auf ...');
  let ruhe = 0, vorher = 0;
  for (let i = 0; i < 300 && ruhe < 5; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    document.querySelectorAll('div').forEach(e => {
      if (e.scrollHeight > e.clientHeight + 200) e.scrollTop = e.scrollHeight;
    });
    await schlaf(1300);
    const jetzt = ernten();
    ruhe = (jetzt === vorher) ? ruhe + 1 : 0;
    if (jetzt !== vorher) log(`  ${jetzt} Songs sichtbar`);
    vorher = jetzt;
  }
  log(`Profil vollständig: ${ids.size} Songs.`);

  // --- 2. Nur die neuen im Detail holen ------------------------
  const neu = [...ids].filter(id => !BEKANNT.has(id));
  log(`Davon neu: ${neu.length}`);
  if (!neu.length) { log('Nichts zu tun. Fertig.'); return; }
  log(`Geschätzte Dauer: ~${Math.ceil(neu.length * 8 / 60)} Minuten (Suno drosselt).`);

  const daten = [], fehler = [];
  for (let i = 0; i < neu.length; i++) {
    const id = neu[i];
    let versuch = 0, ok = false;
    while (versuch < 5 && !ok) {
      try {
        const t = await window.Clerk.session.getToken();   // lebt nur ~60 s
        const r = await fetch('https://studio-api.prod.suno.com/api/clip/' + id,
                              { headers: { Authorization: 'Bearer ' + t } });
        if (r.status === 429) { versuch++; await schlaf(5000 * versuch); continue; }
        if (!r.ok) { fehler.push({ id, status: r.status }); ok = true; break; }
        daten.push(await r.json()); ok = true;
      } catch (e) { versuch++; await schlaf(3000); }
    }
    if (!ok) fehler.push({ id, status: 'aufgegeben' });
    if ((i + 1) % 10 === 0 || i === neu.length - 1) log(`  ${i + 1}/${neu.length}`);
    await schlaf(900);
  }

  // --- 2b. Fremde Songs aussortieren ---------------------------
  // Beim Aufblättern rutschen manchmal Songs anderer Leute mit
  // hinein - aus dem Player unten oder aus "Gefällt mir".
  // Erkennbar am handle.
  const eigener = location.pathname.slice(2).split('?')[0];
  const fremd = daten.filter(c => c.handle && c.handle !== eigener);
  if (fremd.length) {
    log(`${fremd.length} fremde Songs aussortiert:`,
        fremd.map(c => `${c.handle}: ${c.title}`).join(' · '));
  }
  const eigene = daten.filter(c => !c.handle || c.handle === eigener);

  // --- 3. Auf das Nötige eindampfen ----------------------------
  // Suno liefert viel Ballast (Anzeigelogik, Knopf-Zustände).
  // Wir behalten nur, was ins Archiv gehört - das drückt 1 MB
  // statt 10 MB durch den Download.
  const schlank = eigene.map(c => ({
    id:c.id, title:c.title, created_at:c.created_at,
    major_model_version:c.major_model_version, model_name:c.model_name,
    is_public:c.is_public, is_trashed:c.is_trashed, is_hidden:c.is_hidden,
    play_count:c.play_count, upvote_count:c.upvote_count, comment_count:c.comment_count,
    audio_url:c.audio_url,
    video_url:c.video_url,               // Sunos Lyric-Video
    video_cover_url:c.video_cover_url,   // eigenes hochgeladenes Video-Artwork
    hook_preview_thumbnail_url:c.hook_preview_thumbnail_url,
    has_hook:c.has_hook, caption:c.caption,
    image_url:c.image_url, image_large_url:c.image_large_url,
    media_urls:c.media_urls,
    display_name:c.display_name, handle:c.handle, display_tags:c.display_tags,
    albums:c.albums, project:c.project,
    metadata: c.metadata ? {
      prompt:c.metadata.prompt, tags:c.metadata.tags, negative_tags:c.metadata.negative_tags,
      duration:c.metadata.duration, type:c.metadata.type, task:c.metadata.task,
      is_remix:c.metadata.is_remix, cover_clip_id:c.metadata.cover_clip_id,
      edited_clip_id:c.metadata.edited_clip_id, has_vocal:c.metadata.has_vocal,
      make_instrumental:c.metadata.make_instrumental, has_stem:c.metadata.has_stem
    } : null
  }));

  // --- 4. Als Datei ausgeben -----------------------------------
  // Der direkte Weg an einen lokalen Server ist von suno.com aus
  // gesperrt (Chrome blockiert öffentlich -> privat), deshalb
  // dieser Umweg über den Download-Ordner.
  const inhalt = JSON.stringify({
    alle: schlank,
    handle: location.pathname.slice(2).split('?')[0],
    gesamtAufProfil: ids.size,
  });

  const url = URL.createObjectURL(new Blob([inhalt], { type:'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'suno-archiv-metadaten.json';
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 5000);

  if (fehler.length) console.log('%cFehlgeschlagen:', R, fehler);
  log(`${schlank.length} Songs heruntergeladen (${(inhalt.length/1048576).toFixed(2)} MB).`);
  console.log('%c─── Weiter auf dem Mac: ───', G);
  console.log('mv ~/Downloads/suno-archiv-metadaten.json library/roh/profil-$(date +%Y-%m-%d-%H-%M-%S).json');
  console.log('node bin/aufbereiten.js && node bin/laden.js');
})();
