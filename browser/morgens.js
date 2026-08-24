/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ==========================================================================
   Der Morgenknopf  ·  browser/morgens.js

   EINMAL DRÜCKEN, UND DER GANZE BESTAND IST AKTUELL.

   Beim ersten Mal holt er alles, danach nur noch den Unterschied - das
   entscheidet nicht dieses Skript, sondern der Katalog: bin/aufbereiten.js
   vergleicht die Ernte mit dem, was schon dasteht, und die nachfolgenden
   Schritte fassen nur an, was fehlt.

   ---------------------------------------------------------------------
   WARUM DAS HIER LÄUFT UND NICHT IN MYSUNO

   Der Clerk-Token gehört der Herkunft suno.com. Eine Seite auf
   127.0.0.1:8788 kann ihn nicht benutzen: Cookies sind pro Herkunft
   gebunden, und Suno schickt uns keine CORS-Freigabe. Umgekehrt geht es -
   unser eigener Server erlaubt suno.com, ihn zu erreichen.

   Deshalb sitzt der Knopf als Lesezeichen auf einer Suno-Seite. Dasselbe
   steht seit dem 18.08.2026 im WAV-PROTOKOLL, dort noch als Handgriff in
   der Konsole.

   ---------------------------------------------------------------------
   EINRICHTEN

   Neues Lesezeichen anlegen, als Adresse eintragen:

     javascript:(function(){var s=document.createElement('script');
     s.src='http://localhost:8788/browser/morgens.js?'+Date.now();
     document.body.appendChild(s);})()

   Danach: einen Tab auf suno.com öffnen (angemeldet), Lesezeichen
   anklicken. Ein Fenster oben rechts zeigt, was geschieht.

   ---------------------------------------------------------------------
   WAS ER TUT

   ERST SEHEN, DANN ENTSCHEIDEN. Der Knopf holt die Ernte und zeigt ein
   Fenster mit dem, was sich seit dem letzten Mal geändert hat - neue
   Songs, veränderte Zählerstände, geänderte Inhalte, verschwundene
   Songs. Angefasst wird nichts, bis du "Übernehmen" drückst.

   1. Songliste über die Profil-Schnittstelle - mit Plays, Likes und
      Kommentaren. Die braucht keine Anmeldung, wird aber hier mitgeholt,
      damit alles aus einem Guss kommt.
   2. Playlists MIT Anmeldung - die gehen nur hier.
   3. Vergleich gegen den lokalen Katalog, Liste anzeigen.  ← Halt
   4. Auf Knopfdruck: ablegen und den lokalen Lauf anstoßen -
      Katalog, Medien, Analysen.
   5. Für neue Songs die WAV-Erzeugung anstoßen (eigener Knopf, weil es
      das Suno-Konto anfasst).

   Läuft der Server nicht, sagt er es und tut nichts.
   ========================================================================== */
(async function(){
  'use strict';

  const DAHEIM = 'http://localhost:8788';
  const API    = 'https://studio-api-prod.suno.com';

  /* ---------------- Anzeige ----------------
     Dieselbe Sprache wie KlangTresor selbst - nicht nachempfunden, sondern
     dieselben Werte aus web/index.html: --bg #0c0c0d, --flaeche
     #161618, --rand #333336, System-Schrift 15/1.5, die Wortmarke als
     Verlauf, Pillen mit 999px. Das Fenster soll aussehen, als haette
     KlangTresor es selbst aufgemacht, nicht wie ein fremdes Skript, das auf
     Suno sitzt. (Caspar_D, 19.08.2026: "so wie MySuno sich praesentiert,
     wenn noch kein Titel ausgewaehlt war.") */
  const schonDa = document.getElementById('mysuno-morgens');
  if (schonDa) schonDa.remove();
  const stil = document.createElement('style');
  stil.textContent = `
    #mysuno-morgens{position:fixed;top:16px;right:16px;z-index:2147483647;
      width:480px;max-height:84vh;display:flex;flex-direction:column;
      background:#0c0c0d;color:#ececed;border:1px solid #333336;border-radius:14px;
      box-shadow:0 24px 80px rgba(0,0,0,.65);overflow:hidden;
      font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
      -webkit-font-smoothing:antialiased}
    #mysuno-morgens *{box-sizing:border-box}
    #mysuno-morgens .mk{display:flex;align-items:center;gap:12px;padding:14px 18px;
      border-bottom:1px solid #333336;background:#161618;flex:0 0 auto}
    #mysuno-morgens .mk h1{margin:0;font-size:19px;font-weight:700;letter-spacing:.5px;
      background:linear-gradient(92deg,#c9c9cd,#8b8b90);-webkit-background-clip:text;
      background-clip:text;color:transparent;white-space:nowrap}
    #mysuno-morgens .mk .unter{font-size:11px;letter-spacing:.1em;text-transform:uppercase;
      color:#8b8b90;margin-left:auto}
    #mysuno-morgens .mk .zu{width:30px;height:30px;border-radius:50%;border:1px solid #333336;
      background:#242427;color:#8b8b90;cursor:pointer;display:grid;place-items:center;
      font-size:16px;line-height:1;flex:0 0 auto}
    #mysuno-morgens .mk .zu:hover{color:#ececed;border-color:#8b8b90}
    #mysuno-morgens .mz-liste{overflow:auto;padding:14px 18px 16px;flex:1 1 auto}
    #mysuno-morgens .z{font-size:13px;color:#8b8b90;padding:2px 0}
    #mysuno-morgens .z.gut{color:#16be5c} #mysuno-morgens .z.schlecht{color:#e31c79}
    #mysuno-morgens .z.warn{color:#f97b14}
    #mysuno-morgens .z.kopf{color:#ececed;font-weight:600;margin-top:12px;padding-bottom:4px;
      border-bottom:1px solid #333336;font-size:11px;letter-spacing:.08em;text-transform:uppercase}
    #mysuno-morgens .z.kopf:first-child{margin-top:0}
    #mysuno-morgens .eintrag{display:grid;grid-template-columns:40px 1fr;gap:0 12px;
      align-items:center;padding:6px;border-radius:8px;margin:0 -6px}
    #mysuno-morgens .eintrag:hover{background:#161618}
    #mysuno-morgens .eintrag img{width:40px;height:40px;object-fit:cover;border-radius:6px;
      background:#242427;display:block}
    #mysuno-morgens .eintrag .t{font-size:13px;color:#ececed;white-space:nowrap;
      overflow:hidden;text-overflow:ellipsis}
    #mysuno-morgens .eintrag .w{font-size:11.5px;color:#8b8b90;margin-top:1px}
    #mysuno-morgens .eintrag .n{font:600 11px ui-monospace,Menlo,monospace;margin-top:2px;
      display:flex;gap:10px;flex-wrap:wrap}
    #mysuno-morgens .plus{color:#16be5c}#mysuno-morgens .minus{color:#e31c79}
    #mysuno-morgens .komm{color:#f97b14}
    #mysuno-morgens .leiste{display:flex;gap:10px;padding:12px 18px 16px;
      border-top:1px solid #333336;background:#161618;flex:0 0 auto}
    #mysuno-morgens .leiste button{flex:1;padding:9px 14px;border-radius:999px;cursor:pointer;
      font:600 13px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
      border:1px solid #333336;background:#242427;color:#ececed}
    #mysuno-morgens .leiste button.ja{border-color:#16be5c;background:#16be5c1f;color:#16be5c}
    #mysuno-morgens .leiste button.wav{border-color:#f97b14;background:#f97b141f;color:#f97b14}
    #mysuno-morgens .leiste button:hover{filter:brightness(1.15)}
    #mysuno-morgens pre{margin:8px 0 0;white-space:pre-wrap;color:#8b8b90;
      font:12px/1.55 ui-monospace,Menlo,monospace}
    #mysuno-morgens .neu{font-size:14px;color:#ececed;margin:4px 0 2px}
    #mysuno-morgens .neu b{color:#16be5c;font-size:22px;font-weight:700;margin-right:6px}
  `;
  document.head.appendChild(stil);

  const kasten = document.createElement('div');
  kasten.id = 'mysuno-morgens';
  kasten.innerHTML =
    '<div class="mk"><h1>KlangTresor</h1><span class="unter">Morgenroutine</span>' +
    '<button class="zu" title="Schließen">×</button></div>' +
    '<div class="mz-liste" id="mysuno-zeilen"></div>';
  document.body.appendChild(kasten);
  kasten.querySelector('.zu').onclick = () => kasten.remove();
  const zeilenfeld = kasten.querySelector('#mysuno-zeilen');

  function sagen(text, farbe){
    const z = document.createElement('div');
    z.className = 'z' + (farbe === '#16be5c' ? ' gut' : farbe === '#e31c79' ? ' schlecht'
                 : farbe === '#f97b14' ? ' warn' : '');
    if (farbe && !/#16be5c|#e31c79|#f97b14|#8a8a90|#b0b0b6|#4b93f0/.test(farbe)) z.style.color = farbe;
    z.textContent = text;
    zeilenfeld.appendChild(z);
    zeilenfeld.scrollTop = zeilenfeld.scrollHeight;
    return z;
  }
  const gut = t => sagen(t, '#16be5c');
  const schlecht = t => sagen(t, '#e31c79');

  /* ---------------- Die Ernte ueberlebt den Tab ----------------
     Zweimal am 19.08.2026 war der Server genau dann nicht da, als das
     Lesezeichen sichern wollte - und zehn Minuten Ernte waren weg,
     weil sie nur im Speicher des Fensters lag. (Caspar_D: "kannst du das
     im local storage ablegen".)

     localStorage ist zu klein (rund 5 MB, die Ernte hat 25). IndexedDB
     gehoert derselben Herkunft, ist vom selben Skript aus erreichbar
     und gross genug. Die Ernte wird SOFORT nach dem Holen dort
     abgelegt; an den Server geht sie danach - jetzt, oder beim
     naechsten Klick, wenn er gerade nicht da war. Ist sie angekommen,
     wird sie im Browser geloescht. Eine Extension braucht es dafuer
     nicht. */
  const DB_NAME = 'mysuno-morgens', DB_STORE = 'ernte';
  function dbAuf(){
    return new Promise((ok, nein) => {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(DB_STORE);
      r.onsuccess = () => ok(r.result);
      r.onerror = () => nein(r.error);
    });
  }
  async function ernteMerken(daten){
    const db = await dbAuf();
    await new Promise((ok, nein) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put(daten, 'letzte');
      tx.oncomplete = ok; tx.onerror = () => nein(tx.error);
    });
    db.close();
  }
  async function ernteLesen(){
    const db = await dbAuf();
    const d = await new Promise((ok) => {
      const r = db.transaction(DB_STORE).objectStore(DB_STORE).get('letzte');
      r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null);
    });
    db.close(); return d;
  }
  async function ernteVergessen(){
    const db = await dbAuf();
    await new Promise((ok) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).delete('letzte');
      tx.oncomplete = ok; tx.onerror = ok;
    });
    db.close();
  }
  /* IN STUECKEN, NICHT IN EINEM. Die Ernte war am 19.08.2026 109 MB -
     die Wellenstufen allein 107, rund 0,4 MB je Song - und der Server
     kappt bei 64. Der Browser sah nur "Failed to fetch", der Server
     schrieb nichts ins Protokoll. Jetzt gehen erst die Songlisten
     (klein), dann die Timing-Daten in Paketen zu zwanzig Songs; jedes
     Paket eine eigene timing-Datei, und aufbereiten.js liest ohnehin
     alle. Faellt eines durch, sagt es der Fehler mit der Nummer. */
  async function einPost(daten){
    const a = await fetch(DAHEIM + '/api/morgen/roh', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(daten),
    });
    if (!a.ok){
      const t = await a.text(); let m = t;
      try { const j = JSON.parse(t); m = j.meldung || j.fehler || t; } catch (e) {}
      throw new Error(m);                        /* z. B. der Alias-Waechter (409) im Klartext */
    }
    return a.json();
  }
  async function anServer(daten, melde){
    const { timing, ...kopf } = daten;
    const erg = await einPost({ ...kopf, timing: {} });
    const ids = Object.keys(timing || {});
    const JE = 20;
    for (let i = 0; i < ids.length; i += JE){
      const teil = {};
      for (const id of ids.slice(i, i + JE)) teil[id] = timing[id];
      if (melde) melde(`Sichern … Paket ${Math.floor(i/JE)+1}/${Math.ceil(ids.length/JE)}`);
      try { await einPost({ erzeugtAm: kopf.erzeugtAm, quelle: kopf.quelle, songs: [],
                            profil: kopf.profil, timing: teil }); }
      catch (e){ throw new Error(`Paket ${Math.floor(i/JE)+1}: ${e.message}`); }
    }
    return erg;
  }

  /* ---------------- Server erreichbar? ---------------- */
  let handle = null;
  try {
    const a = await fetch(DAHEIM + '/api/index');
    if (!a.ok) throw new Error(a.status);
    const d = await a.json();
    handle = d.profil && d.profil.handle;
    gut(`Server da — ${d.anzahl} Songs im Katalog, @${handle}`);
  } catch (e) {
    schlecht('Der Server läuft nicht. Erst starten:');
    schlecht('  ./bin/server-start.sh');
    return;
  }
  /* LEERES SYSTEM: kein Katalog, kein Handle. Der erste Tag. Statt
     die Arbeit zurueckzuschieben ("erst sammeln.js laufen lassen"),
     fragt das Lesezeichen Suno selbst - man ist ja angemeldet, und
     /api/user/me sagt, wer. Danach laeuft alles wie sonst, nur dass
     "neu" diesmal alle Songs sind. (Caspar_D, 19.08.2026: "wenn er auf ein
     leeres System stoesst, wonach fragt er dann noch?") */
  /* DEN TOKEN HOLEN - MIT GEDULD. Vorher fragte jede Stelle einzeln
     `window.Clerk && window.Clerk.session` ab und gab sofort auf. Auf einer
     frisch geladenen Suno-Seite ist die Anmeldebibliothek aber erst nach ein
     paar Sekunden da: Wer das Lesezeichen zu frueh klickt, bekommt "nicht
     angemeldet", obwohl er angemeldet IST (Tarja, 23.08.2026: "diese kein
     Token Meldung - ich bin angemeldet"). Darum bis zu acht Sekunden warten
     und erst dann aufgeben. */
  async function tokenHolen(maxMs){
    const bis = Date.now() + (maxMs || 8000);
    let gesehen = false;
    while (Date.now() < bis){
      if (window.Clerk){
        gesehen = true;
        if (window.Clerk.session){
          try { const t = await window.Clerk.session.getToken(); if (t) return t; } catch (e) {}
        }
      }
      await new Promise(r => setTimeout(r, 300));
    }
    tokenHolen.grund = !gesehen
      ? 'Diese Seite kennt keine Suno-Anmeldung. Das Lesezeichen gehört auf einen Tab von suno.com — nicht auf den KlangTresor und nicht auf eine leere Seite.'
      : 'Suno ist geladen, aber es ist keine Sitzung angemeldet. Melde dich in DIESEM Tab bei suno.com an, warte bis die Seite fertig ist, und klicke das Lesezeichen erneut.';
    return null;
  }

  let erstesMal = false;
  if (!handle){
    erstesMal = true;
    sagen('Das Archiv ist noch leer — erster Lauf.', '#f97b14');
    try {
      const t = await tokenHolen();
      if (!t) throw new Error(tokenHolen.grund || 'nicht angemeldet');
      const me = await (await fetch(`${API}/api/user/me`, { headers:{ Authorization:'Bearer '+t } })).json();
      handle = me.handle || (me.profile && me.profile.handle) || null;
      if (!handle) throw new Error('Suno nennt keinen Handle');
      gut(`Angemeldet als @${handle} — das Archiv wird dafür angelegt.`);
    } catch (e){
      schlecht('Das Archiv ist leer und der Suno-Zugang fehlt. ' + e.message);
      return;
    }
  }

  /* Liegt vom letzten Mal noch eine Ernte im Browser, die nie ankam?
     Dann erst die - sie ist fertig, sie muss nur noch hinueber. */
  try {
    const rest = await ernteLesen();
    if (rest && rest.songs){
      const z = sagen(`Ernte vom ${(rest.erzeugtAm||'').slice(0,16).replace('T',' ')} lag noch im Browser — sichere …`, '#f97b14');
      try { const d = await anServer(rest, t => z.textContent = t); await ernteVergessen();
            z.textContent = `Ernte vom letzten Mal nachgereicht — ${d.abgelegt}`; z.style.color = '#16be5c'; }
      catch (e){ z.textContent = 'Alte Ernte konnte nicht gesichert werden: ' + e.message; }
    }
  } catch (e) {}

  /* ---------------- 0a · Liegt noch etwas vom letzten Mal? ----------------
     Rohdaten, die juenger sind als der Katalog, wurden geholt, aber nie
     uebernommen - etwa weil das Fenster nach dem Holen zugemacht wurde.
     Das sagt das Fenster als erstes und bietet an, sie jetzt zu
     uebernehmen; wer lieber erst neu holt, kann das trotzdem. (Caspar_D,
     19.08.2026: "dann muss der naechste Start aber sagen, dass er Daten
     vom letzten Mal gefunden hat, die noch nicht importiert wurden.") */
  try {
    const u = await (await fetch(DAHEIM + '/api/morgen/unverarbeitet')).json();
    if (u && u.anzahl){
      /* Seit dem 20.08.2026 ist das kein Alarm mehr: Der rote Knopf
         verwertet liegengebliebene Ernten selbst (--aus-roh, alle
         Zaehlerstaende fliessen in den Verlauf). Eine graue Zeile
         genuegt - keine Frage, kein Orange, kein Anhalten. */
      sagen(`Auf dem Server warten noch ${u.anzahl} Ernte-Datei(en) auf den roten Knopf — der übernimmt sie beim nächsten Druck.`, '#8a8a90');
    }
  } catch (e) {}

  /* ---------------- 0 · Erst fragen ----------------
     Bevor irgendetwas bei Suno angefragt wird, sagt das Fenster, was
     es holen WUERDE, und wartet. (Caspar_D, 19.08.2026: "ich moechte, dass
     der Bookmark fragt, was er besorgen soll, bevor ueberhaupt etwas
     passiert.") Die Haekchen merken sich ihren Stand im Browser -
     wer morgens immer dasselbe will, klickt nur noch Los.

     Die Songliste ist Pflicht: Ohne sie gibt es keinen Vergleich und
     keine IDs fuer den Rest. Alles andere ist abwaehlbar. */
  const AUSWAHL = [
    { k:'privat',  name:'Private Songs',                 was:'Plays und Likes der Unveroeffentlichten - die stehen nicht im oeffentlichen Profil', an:true },
    { k:'timing',  name:'Sunos eigene Analyse', was:'Tempo, Struktur und Huellkurve, wie Suno sie rechnet - die Referenz fuer unseren Analyzer; nur fuer Songs, denen sie fehlt, ~2 s je Song', an:true },
    { k:'benach',  name:'Wer hat reagiert',             was:'Likes, Kommentare, Follows - wer wann; die letzten vier Wochen', an:true },
    { k:'playl',   name:'Playlists',                     was:'eigene Playlists mit Eintraegen', an:true },
    /* Einmaliger Vergleich, standardmaessig AUS: Sunos Zeitmarken gibt
       es in zwei Fassungen (aligned_lyrics v2 und v3). Wir speichern
       v2; ob v3 genauer ist, steht im Backlog. Diese Probe holt BEIDE
       fuer die Songs in VERGLEICHS_IDS und legt sie als eigene
       Rohdatei ab - bin/zeitmarken-vergleich.js wertet aus. */
    { k:'zeitprobe', name:'Zeitmarken nachladen (v2 + v3)', was:'Wort-Zeitmarken fuer Karaoke: v2 fuer Songs, die noch keine haben, v3 fuer alle; was Suno erst rechnen muss, kommt beim naechsten Lauf', an:false },
  ];
  const gemerkt = (() => { try { return JSON.parse(localStorage.getItem('mysuno-morgens-auswahl')||'{}'); } catch(e){ return {}; } })();
  for (const a of AUSWAHL) if (gemerkt[a.k] !== undefined) a.an = !!gemerkt[a.k];

  const wahl = await new Promise((fertig) => {
    const box = document.createElement('div');
    box.style.cssText = 'padding:2px 0 6px';
    box.innerHTML = '<div class="z kopf">' + (erstesMal ? 'Erster Lauf — was soll das Archiv bekommen?' : 'Was soll geholt werden?') + '</div>' +
      '<label class="wz"><input type="checkbox" checked disabled> <b>Songliste</b>' +
      '<span class="wzw">alle oeffentlichen Songs mit Plays, Likes, Kommentarzahl - immer, sonst gibt es keinen Vergleich</span></label>' +
      AUSWAHL.map(a => `<label class="wz"><input type="checkbox" data-k="${a.k}" ${a.an?'checked':''}> <b>${a.name}</b>` +
                       `<span class="wzw">${a.was}</span></label>`).join('');
    zeilenfeld.appendChild(box);
    const st = document.createElement('style');
    st.textContent = `#mysuno-morgens .wz{display:block;padding:7px 0;border-bottom:1px solid #ffffff0c;cursor:pointer;color:#ececed;font-size:13px}
      #mysuno-morgens .wz:last-child{border-bottom:0}
      #mysuno-morgens .wz input{margin:0 8px 0 0;accent-color:#e31c79;vertical-align:-1px}
      #mysuno-morgens .wz b{font-weight:600}
      #mysuno-morgens .wzw{display:block;margin-left:22px;font-size:11.5px;color:#8b8b90}`;
    document.head.appendChild(st);
    const leiste = document.createElement('div'); leiste.className = 'leiste';
    const los = document.createElement('button'); los.className = 'ja'; los.textContent = 'Los';
    const nein = document.createElement('button'); nein.textContent = 'Abbrechen';
    leiste.append(los, nein); kasten.appendChild(leiste);
    nein.onclick = () => { kasten.remove(); fertig(null); };
    los.onclick = () => {
      const w = {};
      box.querySelectorAll('input[data-k]').forEach(i => w[i.dataset.k] = i.checked);
      try { localStorage.setItem('mysuno-morgens-auswahl', JSON.stringify(w)); } catch(e){}
      leiste.remove(); box.remove(); fertig(w);
    };
  });
  if (!wahl) return;                       // Abbrechen: nichts ist passiert

  /* ---------------- 1 · Die Songliste ----------------
     Dieselbe Schnittstelle wie bin/sammeln.js, nur von hier aus. Sie
     trägt Plays, Likes und Kommentare - genau die Zahlen, die sich
     täglich ändern und deshalb bei jedem Lauf neu geholt gehören. */
  const zeile1 = sagen('Hole deine öffentliche Songliste von Suno (Titel und Zähler) …');
  const songs = new Map();
  let kopf = null, gesamt = null;
  const basis = `${API}/api/profiles/${encodeURIComponent(handle)}`
              + '?playlists_sort_by=upvote_count&clips_sort_by=created_at';
  for (let seite = 1; seite <= 60; seite++){
    let d;
    try {
      const a = await fetch(basis + '&page=' + seite, { credentials:'include' });
      if (!a.ok){ if (seite === 1){ schlecht('Profil nicht erreichbar: ' + a.status); return; } break; }
      d = await a.json();
    } catch (e){ break; }
    if (!kopf) kopf = d;
    gesamt = d.num_total_clips ?? gesamt;
    const teil = d.clips || [];
    if (!teil.length) break;
    for (const c of teil) songs.set(c.id, c);
    zeile1.textContent = `Songliste … ${songs.size}${gesamt?'/'+gesamt:''}`;
    await new Promise(r => setTimeout(r, 250));   // Suno nicht drängen
  }
  zeile1.textContent = `Songliste von Suno geholt — ${songs.size} Songs mit aktuellen Zählern`;
  zeile1.style.color = '#16be5c';

  /* ---------------- 2 · Was nur mit Anmeldung geht ----------------
     Wort-Zeitmarken und Playlists antworten ohne Token mit 401. Genau
     dafür sitzt der Knopf hier. Schlägt es fehl, ist der Rest trotzdem
     gültig - dann fehlt eben das Karaoke für die neuen Songs. */
  const zeile2 = sagen('Hole deine Playlists (Reihenfolge und Einträge) …');
  let playlists = [];
  if (!wahl.playl){ zeile2.textContent = 'Playlists — übersprungen'; }
  else try {
    const a = await fetch(`${API}/api/profiles/${encodeURIComponent(handle)}/playlists?page=1`,
                          { credentials:'include' });
    if (a.ok){ const d = await a.json(); playlists = d.playlists || d || []; }
  } catch (e) {}
  zeile2.textContent = `Playlists geholt — ${playlists.length}, mit allen Einträgen`;
  zeile2.style.color = playlists.length ? '#16be5c' : '#8a8a90';

  /* ---------------- 2b · Was nur mit Token geht ----------------
     Drei Auskuenfte aus der Adressliste der Web-App
     (docs/suno-api-wege.txt), alle mit 401 ohne Anmeldung:

       downbeats            Sunos Schlagerkennung, Zeitstempel je Schlag
       novelty-sections     Sunos Strukturerkennung - wird auf Anfrage
                            gerechnet, antwortet erst 'running', dann
                            'complete'; fehlt es, kommt es beim naechsten
                            Lauf
       waveform-aggregates  die Huellkurve in Zoomstufen

     Geholt wird nur, was im Katalog fehlt - die Merker hatSchlaege,
     hatAbschnitte, hatWellenStufen sagen es. Beim ersten Mal sind das
     alle, danach nur die neuen. Der Token kommt von Clerk; das ist der
     Grund, warum dieser Knopf auf suno.com lebt. */
  const daheim = await (await fetch(DAHEIM + '/api/index')).json();

  /* ---------------- 2a · Die PRIVATEN Songs ----------------
     Die Profil-Schnittstelle liefert nur Oeffentliches. Die privaten
     Songs stehen aber im Katalog - sie kamen einmal ueber die
     Playlists herein - und ihre Zaehler bewegen sich genauso: Wer
     einen Link bekommt, hoert und likt. Hier werden sie einzeln ueber
     /api/clip/<id> nachgeholt, mit Token; derselbe Weg, ueber den sie
     am 17.08.2026 zum ersten Mal geholt wurden. Danach stehen sie in
     'songs' wie die oeffentlichen, und Vergleich, Ablage und
     Ergaenzung behandeln sie gleich. */
  /* GETRENNT ABLEGEN, WIE DAS HAUS ES TUT. wiederherstellen.js baut
     aus library/roh/ auf, nach Rohdatenarten: profil-, privat-,
     playlists-, timing-. Jede Art eine Datei mit eigenem Zweck. Die
     Privaten gehoeren in 'privat-', nicht in 'profil-' - sonst steht in
     einer Datei namens Profil etwas, das nicht aus dem Profil kommt,
     und der Neuaufbau findet die Privaten nicht. (Caspar_D, 19.08.2026:
     "sollten wir die Daten nicht lieber so holen, wie wir das mit dem
     Wiederherstellen-Skript gemacht haben.") */
  const privatSongs = new Map();
  const zeileP = sagen('Hole die Zähler deiner privaten Songs (stehen in keinem öffentlichen Profil) …');
  let privatGeholt = 0;
  if (!wahl.privat){ zeileP.textContent = 'Private Songs — übersprungen'; }
  else try {
    const t0 = await tokenHolen();
    if (t0){
      const H0 = { Authorization: 'Bearer ' + t0 };
      const priv = (daheim.songs||[]).filter(a => !a.oeffentlich && !a.fremd && !songs.has(a.id));
      for (const a of priv){
        try {
          const r = await fetch(`${API}/api/clip/${a.id}`, { headers: H0 });
          if (r.ok){ const c = await r.json(); if (c && c.id){ privatSongs.set(c.id, c); privatGeholt++; } }
        } catch (x) {}
        zeileP.textContent = `Private Songs … ${privatGeholt}/${priv.length}`;
        await new Promise(r => setTimeout(r, 250));
      }
      zeileP.textContent = `Private Songs — ${privatGeholt} mit frischen Zählern`;
      zeileP.style.color = '#16be5c';
    } else { zeileP.textContent = 'Private Songs — kein Token'; zeileP.style.color = '#8a8a90'; }
  } catch (x) { zeileP.textContent = 'Private Songs — ' + x.message; zeileP.style.color = '#e31c79'; }

  const zeileT = sagen('Hole Sunos eigene Analyse (Tempo, Struktur, Hüllkurve) — nur für Songs, denen sie fehlt …');
  const timing = {};
  let tokenDa = true;
  /* Der Block laeuft auch fuer die Zeitmarken-Probe allein - der
     Token-Griff ist derselbe; was die Haken sagen, entscheidet drin. */
  if (!wahl.timing && !wahl.zeitprobe){ zeileT.textContent = 'Sunos eigene Analyse — übersprungen'; }
  else try {
    tokenDa = false;
    const t = await tokenHolen();
    if (t){
      tokenDa = true;
      const H = { Authorization: 'Bearer ' + t };
      if (!wahl.timing) zeileT.textContent = 'Sunos eigene Analyse — übersprungen';
      else {
      /* Was schon in den ROHDATEN liegt, zaehlt als vorhanden - auch
         wenn der Katalog es noch nicht weiss. Sonst holt ein zweiter
         Lauf vor dem Uebernehmen alles noch einmal. */
      let roh = { schlaege:[], abschnitte:[], wellenStufen:[] };
      try { roh = await (await fetch(DAHEIM + '/api/morgen/timing-vorhanden')).json(); } catch (x) {}
      const rS = new Set(roh.schlaege), rA = new Set(roh.abschnitte), rW = new Set(roh.wellenStufen);
      const fehlt = (daheim.songs||[]).filter(a => (songs.has(a.id) || privatSongs.has(a.id)) &&
        (!(a.hatSchlaege || rS.has(a.id)) || !(a.hatAbschnitte || rA.has(a.id)) || !(a.hatWellenStufen || rW.has(a.id))));
      let n = 0;
      for (const a of fehlt){
        const e = {};
        const hol = async (weg) => {
          const r = await fetch(`${API}/api/gen/${a.id}/${weg}`, { headers: H });
          return r.ok ? r.json() : null;
        };
        try {
          if (!(a.hatSchlaege || rS.has(a.id))){ const d = await hol('downbeats');
            if (d && d.state === 'complete' && Array.isArray(d.downbeats)) e.schlaege = d.downbeats; }
          if (!(a.hatAbschnitte || rA.has(a.id))){ const d = await hol('novelty-sections');
            if (d && d.state === 'complete') e.abschnitte = d; }
          if (!(a.hatWellenStufen || rW.has(a.id))){ const d = await hol('waveform-aggregates');
            if (d && Array.isArray(d.waveform_aggregates)) e.wellenStufen = d.waveform_aggregates; }
        } catch (x) {}
        if (Object.keys(e).length){ timing[a.id] = e; n++; }
        zeileT.textContent = `Sunos eigene Analyse … ${n}/${fehlt.length}`;
        await new Promise(r => setTimeout(r, 300));
      }
      zeileT.textContent = `Sunos eigene Analyse — ${n} Songs ergänzt`
        + (fehlt.length - n ? ` (${fehlt.length - n} noch nicht fertig bei Suno)` : '');
      zeileT.style.color = '#16be5c';
      }

    /* ---------------- 2b2 · API-Probe, einmalig ----------------
     Drei nie geprobte Wege aus SUNO-API.md (Caspar_D, 20.08.2026: "gut,
     mach das"). Ohne Token alle 401 - hier einmal MIT Token, je ein
     GET auf einen eigenen Song, nur Status und Kopf der Antwort.
     Ergebnis erscheint als Zeilen; gemerkt im Browser, laeuft also
     genau einmal. Keine set_/delete-Wege - nur Lesen. */
  try {
    if (!localStorage.getItem('mysuno-api-probe-2026-08')){
      const t3 = await tokenHolen();
      const probeId = (daheim.songs || []).find(s => s.oeffentlich !== false)?.id;
      if (t3 && probeId){
        const zp = sagen('API-Probe (einmalig): drei ungeprüfte Wege …', '#8a8a90');
        const H3 = { Authorization: 'Bearer ' + t3 };
        for (const w of [`gen/${probeId}/wav_file/`, `download/clip/${probeId}`, `clips/get_songs_by_ids?ids=${probeId}`]){
          try {
            const r = await fetch(`${API}/api/${w}`, { headers: H3 });
            let kopf = '';
            try { const ct = r.headers.get('content-type') || '';
                  kopf = ct.includes('json') ? JSON.stringify(await r.json()).slice(0, 120) : ct; } catch (x) {}
            sagen(`  /api/${w.split('?')[0]} → ${r.status}  ${kopf}`, '#8a8a90');
          } catch (x) { sagen(`  /api/${w.split('?')[0]} → Fehler ${x.message}`, '#8a8a90'); }
          await new Promise(r => setTimeout(r, 400));
        }
        localStorage.setItem('mysuno-api-probe-2026-08', '1');
        zp.textContent = 'API-Probe (einmalig) — Ergebnis unten, bitte Caspar_D zeigen:';
      }
    }
  } catch (x) {}

  /* ---------------- 2c · Suno v3 nachladen ----------------
       Die neuere Fassung der Wort-Zeitmarken, fuer jeden Song, dem sie
       noch fehlt. Suno rechnet v3 erst auf Anfrage und antwortet bis
       dahin {state:'running'} - der ERSTE Lauf stoesst also vor allem
       an, ein SPAETERER sammelt ein. Deshalb: je Song EIN Versuch,
       running zaehlt nicht als vorhanden, der naechste Lauf holt es.
       Ablage als __zeitprobe im timing-Objekt (Server: v3-fehlt,
       /api/zeitprobe; Buehnen-Spurwahl liest daraus). */
    if (wahl.zeitprobe){
      const z2 = sagen('Hole Wort-Zeitmarken von Suno (fürs Karaoke) …');
      const probe = {};
      let fertigZahl = 0, laeuft = 0;
      /* Beide Fassungen, jeweils nur was fehlt. v2 zuerst - sie ist
         die, die das Karaoke sofort nutzt. */
      for (const fassung of ['v2','v3']){
        let fehlt = [];
        try { fehlt = (await (await fetch(DAHEIM + `/api/morgen/${fassung}-fehlt`)).json()).fehlt || []; } catch (x) {}
        let n = 0;
        for (const id of fehlt){
          n++;
          try {
            const r = await fetch(`${API}/api/gen/${id}/aligned_lyrics/${fassung}/`, { headers: H });
            const d = r.ok ? await r.json() : { fehler: r.status };
            if (d && d.state === 'running') laeuft++;
            else if (d && !d.fehler) { (probe[id] = probe[id] || {})[fassung] = d; fertigZahl++; }
          } catch (x) {}
          if (n % 10 === 0) z2.textContent = `Wort-Zeitmarken ${fassung} … ${n}/${fehlt.length} (${fertigZahl} fertig, ${laeuft} rechnet Suno noch)`;
          await new Promise(r => setTimeout(r, 250));
        }
      }
      if (Object.keys(probe).length) timing.__zeitprobe = probe;
      z2.textContent = `Wort-Zeitmarken — ${fertigZahl} geholt` + (laeuft ? `, ${laeuft} rechnet Suno noch (der nächste Lauf sammelt sie ein)` : '');
      z2.style.color = '#16be5c';
    }
    }
  } catch (x) {}
  /* Sagen, was zu tun ist - "kein Token" allein hat Tarja nur ratlos gemacht
     (23.08.2026), zumal sie angemeldet WAR: die Anmeldebibliothek war nur
     noch nicht geladen. */
  if (!tokenDa){ zeileT.textContent = 'Sunos eigene Analyse — übersprungen: ' + (tokenHolen.grund
                   || 'die Suno-Anmeldung war nicht erreichbar. Seite neu laden, kurz warten, Lesezeichen noch einmal klicken.');
                 zeileT.style.color = '#8a8a90'; }

  /* ---------------- 2d · Der Benachrichtigungsstrom ----------------
     GET /api/notification/v2 - wer wann was getan hat: clip_like,
     clip_comment, comment_like, comment_reply, follow, dazu hook_like
     und playlist_like. Je Eintrag die Profile der Beteiligten und der
     Zeitpunkt. DAS ist die Like-Liste, die die App zeigt; die Web-API
     hat keinen anderen Weg dafuer (SUNO-API.md).

     Zurueckgeblaettert wird mit before_datetime_utc - nicht 'before',
     das liefert stumm dieselbe Seite noch einmal. Suno haelt rund vier
     Wochen (gemessen 249 Eintraege bis 24.07.); was aelter ist, ist
     weg. Deshalb bei jedem Lauf ALLES holen, was da ist - der Server
     haengt nur an, was er noch nicht kennt.

     NUR LESEN. /read und /clear-badge werden nie aufgerufen; das
     Lesen selbst markiert nichts (badge-count ist ein eigener Weg). */
  const zeileN = sagen('Lese Sunos Benachrichtigungen: wer geliked, kommentiert, gefolgt ist (die letzten 4 Wochen) …');
  const benachrichtigungen = [];
  if (!wahl.benach){ zeileN.textContent = 'Wer hat reagiert — übersprungen'; }
  else try {
    const tn = await tokenHolen();
    if (tn){
      const Hn = { Authorization: 'Bearer ' + tn };
      const gesehen = new Set();
      let vor = null;
      for (let i = 0; i < 80; i++){
        const u = `${API}/api/notification/v2` + (vor ? '?before_datetime_utc=' + encodeURIComponent(vor) : '');
        const r = await fetch(u, { headers: Hn });
        if (!r.ok) break;
        const d = await r.json();
        const n = (d.notifications || []).filter(x => x && x.id && !gesehen.has(x.id));
        if (!n.length) break;
        for (const x of n){ gesehen.add(x.id); benachrichtigungen.push(x); }
        zeileN.textContent = `Wer hat reagiert … ${benachrichtigungen.length}`;
        if (!d.next_before_datetime_utc) break;
        vor = d.next_before_datetime_utc;
        await new Promise(r => setTimeout(r, 250));
      }
      zeileN.textContent = `Wer hat reagiert — ${benachrichtigungen.length}`;
      zeileN.style.color = '#16be5c';
    } else { zeileN.textContent = 'Wer hat reagiert — kein Token'; zeileN.style.color = '#8a8a90'; }
  } catch (x){ zeileN.textContent = 'Wer hat reagiert — ' + x.message; zeileN.style.color = '#e31c79'; }

  /* ---------------- 2c · SOFORT ablegen ----------------
     Die Ernte ist zehn Minuten Arbeit und lag bisher nur im Speicher
     dieses Fensters, bis jemand "Übernehmen" drückte. Einmal war der
     Server genau dann nicht da - Neustart waehrend des Laufs -, und
     alles war weg. Jetzt wird die Rohdatei SOFORT geschrieben. Der
     Katalog aendert sich dadurch noch nicht; das tut erst der Lauf. */
  const ernte = {
    erzeugtAm: new Date().toISOString(),
    quelle: 'morgens.js',
    timing,
    profil: kopf ? { handle, display_name: kopf.display_name,
                     avatar_image_url: kopf.avatar_image_url, num_total_clips: gesamt }
                 : { handle },
    songs: [...songs.values()],
    privat: [...privatSongs.values()],
    playlists,
    benachrichtigungen,
  };
  const zeileA = sagen('Übertrage die Ernte ans Archiv (erst in den Browser-Speicher, dann in Paketen an den Server) …');
  /* Zuerst in den Browser - das kann nicht fehlschlagen, weil kein
     Server dafuer noetig ist. Dann hinueber. */
  try { await ernteMerken(ernte); } catch (e) {}
  let abgelegt = null;
  try {
    abgelegt = await anServer(ernte, t => zeileA.textContent = t);
    await ernteVergessen();
    zeileA.textContent = `Gesichert — ${abgelegt.abgelegt}`;
    zeileA.style.color = '#16be5c';
  } catch (e){
    zeileA.textContent = 'Server nicht erreichbar — die Ernte liegt im Browser und wird '
      + 'beim nächsten Klick nachgereicht. (' + e.message + ')';
    zeileA.style.color = '#f97b14';
    return;
  }

  /* ---------------- 3 · Vergleichen ----------------
     Gegen den lokalen Katalog, hier im Browser. Der Server müsste dafür
     nichts können, was er nicht schon kann - /api/index trägt alle
     Felder, auf die es ankommt. */
  const alt = new Map((daheim.songs||[]).map(s => [s.id, s]));

  const neu = [], geaendert = [], zaehler = [], weg = [];
  for (const c of [...songs.values(), ...privatSongs.values()]){
    const a = alt.get(c.id);
    if (!a){ neu.push(c); continue; }
    /* Inhalt gegen Zählerstand trennen: Ein neuer Titel bedeutet, dass
       Medien nachgeladen werden müssen; drei Plays mehr bedeuten nur
       eine neue Zahl. Wer beides in einen Topf wirft, sieht jeden
       Morgen "321 Songs geändert". */
    const inhalt = [];
    if ((c.title||'') !== (a.titel||'')) inhalt.push('Titel');
    if ((c.image_large_url||c.image_url||'') !== (a.bildUrl||'')) inhalt.push('Cover');
    /* Dieselbe Regel wie im Katalog: tags ODER display_tags. Sonst
       melden Studio-Exporte jeden Morgen einen Stilverlust, den es
       nicht gibt. */
    if ((c.metadata?.tags || c.display_tags || '') !== (a.stilPrompt||'')) inhalt.push('Stil');
    if ((c.video_cover_url||null) !== (a.videoCoverUrl||null)) inhalt.push('Video-Artwork');
    if (!!c.is_public !== !!a.oeffentlich) inhalt.push(c.is_public ? 'jetzt öffentlich' : 'jetzt privat');
    if (inhalt.length){ geaendert.push({ c, a, was: inhalt }); continue; }

    const dp = (c.play_count||0) - (a.plays||0);
    const dl = (c.upvote_count||0) - (a.likes||0);
    const dk = (c.comment_count||0) - (a.kommentare||0);   // nicht num_comments
    if (dp || dl || dk) zaehler.push({ c, a, dp, dl, dk });
  }
  /* NUR ÖFFENTLICHE KÖNNEN AUS DEM ÖFFENTLICHEN PROFIL VERSCHWINDEN.

     Die Profil-Schnittstelle liefert, was jeder sehen kann. Der Katalog
     trägt auch die privaten Songs - die stehen dort selbstverständlich
     nicht drin. Ohne diese Bedingung meldete das Fenster "73 nicht mehr
     im Profil", und 73 ist genau die Zahl der privaten Songs. (Caspar_D,
     19.08.2026: "sie sind nicht im öffentlichen Profil, das ist ein
     Unterschied.") */
  for (const [id, a] of alt)
    if (!songs.has(id) && !a.fremd && a.oeffentlich) weg.push(a);

  /* ---------------- Die Liste ---------------- */
  sagen('');
  const kopfzeile = (t) => { const z = sagen(t); z.className = 'z kopf'; return z; };
  const zahl = (n) => (n>0?'+':'') + n;

  if (!neu.length && !geaendert.length && !zaehler.length && !weg.length){
    gut('Nichts geändert seit dem letzten Mal.');
  }
  /* Dieselbe Liste wie im roten Knopf: Kachel aus dem Archiv, Titel,
     Befund darunter. Hoechstens zwoelf je Abschnitt. Neue Songs als
     Zahl - ihre Kachel gibt es erst nach dem Laden. */
  const HOECHSTENS = 12;
  const rest = (n) => { if (n > 0) sagen(`… und ${n} weitere`); };
  const eintrag = (id, titel, was, zahlen) => {
    const e = document.createElement('div'); e.className = 'eintrag';
    const bild = document.createElement('img');
    bild.src = DAHEIM + '/media/' + id + '/kachel.jpg';
    bild.onerror = () => { bild.src = DAHEIM + '/media/' + id + '/cover.jpg';
                           bild.onerror = () => { bild.style.visibility = 'hidden'; }; };
    const r = document.createElement('div');
    const t = document.createElement('div'); t.className = 't'; t.textContent = titel; r.appendChild(t);
    if (was){ const w = document.createElement('div'); w.className = 'w'; w.textContent = was; r.appendChild(w); }
    if (zahlen && zahlen.length){ const n = document.createElement('div'); n.className = 'n';
      for (const [txt, kl] of zahlen){ const sp = document.createElement('span'); sp.className = kl; sp.textContent = txt; n.appendChild(sp); }
      r.appendChild(n); }
    e.append(bild, r); zeilenfeld.appendChild(e);
  };

  if (neu.length){
    kopfzeile('Neu');
    const z = document.createElement('div'); z.className = 'neu';
    z.innerHTML = `<b>${neu.length}</b>${neu.length === 1 ? 'neuer Song' : 'neue Songs'}` +
      ` <span style="color:#8b8b90">— Artwork gibt es erst nach dem Laden</span>`;
    zeilenfeld.appendChild(z);
  }
  if (geaendert.length){
    kopfzeile('Inhaltlich geändert — wird nachgeladen');
    for (const g of geaendert.slice(0, HOECHSTENS)) eintrag(g.a.id, g.a.titel, g.was.join(' · '), null);
    rest(geaendert.length - HOECHSTENS);
  }
  if (zaehler.length){
    kopfzeile('Neue Zahlen');
    zaehler.sort((x,y) => (Math.abs(y.dp)+Math.abs(y.dl)*3+Math.abs(y.dk)*20) - (Math.abs(x.dp)+Math.abs(x.dl)*3+Math.abs(x.dk)*20));
    for (const z of zaehler.slice(0, HOECHSTENS)){
      const teile = [];
      if (z.dk) teile.push([`${zahl(z.dk)} ${Math.abs(z.dk)===1?'Kommentar':'Kommentare'}`, 'komm']);
      if (z.dl) teile.push([`${zahl(z.dl)} Likes`, z.dl>0?'plus':'minus']);
      if (z.dp) teile.push([`${zahl(z.dp)} Plays`, z.dp>0?'plus':'minus']);
      eintrag(z.a.id, z.a.titel, null, teile);
    }
    rest(zaehler.length - HOECHSTENS);
  }
  if (weg.length){
    kopfzeile('Nicht mehr im öffentlichen Profil');
    for (const a of weg.slice(0, HOECHSTENS)) eintrag(a.id, a.titel, 'war öffentlich — bleibt im Archiv', null);
    rest(weg.length - HOECHSTENS);
  }

  /* ---------------- 4 · Erst auf Knopfdruck ---------------- */
  const leiste = document.createElement('div');
  leiste.className = 'leiste';
  const knopf = (text, klasse) => {
    const k = document.createElement('button');
    k.textContent = text; if (klasse) k.className = klasse;
    leiste.appendChild(k); return k;
  };
  /* KEIN Uebernehmen-Knopf mehr: Das Lesezeichen ERNTET, der rote
     Knopf in KlangTresor VERARBEITET - eine Arbeitsteilung, ein Ort je
     Aufgabe. Der Doppelweg hier hat am 20.08.2026 einen Lauf
     gestartet, den Caspar_D nie angestossen hatte ("ich habe den roten
     Knopf noch nicht gedrueckt"). */
  const neinKnopf = knopf('Schließen');

  /* Der Ende-Indikator (Caspar_D, 20.08.2026): unuebersehbar sagen, dass
     dieses Fenster FERTIG ist und wo es weitergeht. Eigener Kasten
     statt einer weiteren Zeile im Protokoll - das Protokoll erzaehlt,
     der Kasten schliesst ab. */
  const ende = document.createElement('div');
  ende.style.cssText = 'margin-top:12px;padding:12px 14px;border:1px solid #16be5c;border-radius:10px;'
    + 'background:rgba(22,190,92,.08);color:#e8e8ea;font-size:13.5px;line-height:1.55';
  ende.innerHTML = '<b style="color:#16be5c">✓ Fertig.</b> Daten, für die ein Suno-Login '
    + 'erforderlich ist, wurden jetzt erfasst.<br>Drücke den <b>roten Update-Knopf</b> in '
    + 'KlangTresor (oben rechts neben dem Avatar), um sie in deine Datensammlung zu integrieren.';
  kasten.appendChild(ende);
  kasten.appendChild(leiste);                 // Schliessen unter dem Kasten

  neinKnopf.onclick = () => { kasten.remove(); };
})();
