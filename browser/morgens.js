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
  /* WAS DER SERVER AN ALBEN ANGENOMMEN HAT - als Satz und Farbe für die
     Ablagezeile. Der Server nennt, was er angenommen hat, nicht, was
     abgeschickt wurde: `alben`/`albumEintraege` sind die Zahlen der
     playlists-Datei, `albenGrund` sagt, warum KEINE entstand (Konto
     nicht bestätigt, Sammlung ohne Handle). Fehlen die Zahlen ganz,
     antwortet ein alter Serverstand. Bis zum 08.09.2026 abends wurden
     beide Zahlen weggeworfen; und der Nachreich-Pfad (Ernte aus dem
     Browser-Speicher) zeigte auch danach nur d.abgelegt - eine
     nachgereichte Ernte ohne Albumdatei sah aus wie Erfolg. Deshalb
     EIN Satzbauer für beide Stellen. `mitAlben`: ob die Ernte Alben
     tragen sollte - sonst ist "keine Albumdatei" kein Befund. */
  function ablageSatz(d, mitAlben){
    let text = `${d.abgelegt}`, farbe = '#16be5c';
    if (mitAlben){
      const albenZahl = d.alben, eintragZahl = d.albumEintraege;
      if (d.albenGrund){
        text += ` — Alben: ${d.albenGrund}; der Albumstand im Katalog bleibt alt`;
        farbe = '#e31c79';
      } else if (eintragZahl == null){
        text += ' — Alben: der Server nennt keine Zahlen (alter Serverstand?), keine Albumdatei entstanden';
        farbe = '#f97b14';
      } else if (!eintragZahl){
        text += ` — Alben: ${albenZahl || 0} Köpfe, 0 Einträge, keine Albumdatei entstanden; der Albumstand im Katalog bleibt alt`;
        farbe = '#f97b14';
      } else {
        text += ` — Alben: ${albenZahl} mit ${eintragZahl} Einträgen abgelegt`;
      }
    }
    return { text, farbe };
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
            /* Dieselbe Auskunft wie am Ende eines frischen Laufs (ablageSatz):
               ob die Alben angekommen sind, entscheidet sich auch hier. */
            const trugAlben = !!(rest.playlists && Array.isArray(rest.playlists.playlists) && rest.playlists.playlists.length);
            const a = ablageSatz(d, trugAlben);
            z.textContent = `Ernte vom letzten Mal nachgereicht — ${a.text}`; z.style.color = a.farbe; }
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
      /* Datensaetze, nicht Dateien (WOERTER.md, Caspar_D 08.09.2026): ein
         Datensatz = profil + privat + timing mit demselben Stempel. */
      const n = u.datensaetze || u.anzahl;
      sagen(`Auf dem Server ${n === 1 ? 'wartet noch ein Datensatz' : `warten noch ${n} Datensätze`} auf den roten Knopf — der übernimmt sie beim nächsten Druck.`, '#8a8a90');
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
    { k:'playl',   name:'Alben',                        was:'eigene Alben - Suno nennt sie Playlists - mit allen Eintraegen, auch den privaten', an:true },
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
  /* DIE EINE PAUSE FÜR ALLE SUNO-ANFRAGEN. Hausregel: mindestens 250 ms
     zwischen ALLEN Anfragen an Suno - auch über Blockgrenzen hinweg,
     denn Suno sieht keine Blöcke, nur Anfragen. setTimeout(250) liefert
     gemessen 249 ms, weil der Timer aufrundet, nicht abwartet; deshalb
     260. Vorher hatte jeder Block seinen eigenen Timer, und an den
     Nahtstellen (Songliste → /api/user/me, Albumblock → erster
     /api/clip) fehlte die Pause ganz. */
  const pause = () => new Promise(r => setTimeout(r, 260));
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
    await pause();                                // Suno nicht drängen
  }
  zeile1.textContent = `Songliste von Suno geholt — ${songs.size} Songs mit aktuellen Zählern`;
  zeile1.style.color = '#16be5c';

  /* ---------------- 2 · Was nur mit Anmeldung geht ----------------
     Wort-Zeitmarken und Alben antworten ohne Token mit 401. Genau
     dafür sitzt der Knopf hier. Schlägt es fehl, ist der Rest trotzdem
     gültig - dann fehlt eben das Karaoke für die neuen Songs.

     DER ALBUMWEG, neu gebaut am 08.09.2026. Vorher stand hier ein
     einziger Aufruf auf /api/profiles/<handle>/playlists?page=1, OHNE
     Token - obwohl der Kommentar zwei Zeilen darüber selbst sagt, dass
     es ohne Token 401 gibt. Dieser Weg steht in KEINER Unterlage;
     docs/suno-api-wege.txt hält 273 Wege aus Sunos eigenem Quelltext,
     ein Profil-Unterpfad /playlists ist nicht dabei. Er war geraten.
     Suno gab "playlists": [] zurück, `if (a.ok)` ohne else und ein
     leerer catch warfen den Statuscode weg, und die Zeile färbte sich
     bei null Alben nur grau - optisch dasselbe wie "übersprungen".
     Drei Wochen lang schrieb der Katalog deshalb den Albumbestand vom
     17.08.2026 unverändert ab, ohne dass irgendetwas krachte.

     Jetzt der dokumentierte, ZWEISTUFIGE Weg (docs/DATENEXTRAKTION.md:26-30):
       Köpfe   GET /api/playlist/me?page=N       mit Bearer, 12 je Seite
       Inhalt  GET /api/playlist/<id>?page=N     mit Bearer, 50 je Seite
     'me' und nicht '<handle>': der Profil-Weg zeigt nur die öffentlich
     sichtbaren Alben, /api/playlist/me liefert auch die privaten.
     Zwei Stufen, weil die Köpfe `playlist_clips` als LEERES Array
     tragen (DATENEXTRAKTION.md:86) - wer den Kopf für die ganze
     Wahrheit hält, baut Alben mit je null Einträgen.

     page ZÄHLT AB 1. page=0 und page=1 liefern dieselbe Seite
     (DATENEXTRAKTION.md:81-84), deshalb wird über die id entdoppelt,
     genauso wie die Songliste oben mit songs.set(c.id, c). Eine Seite,
     die nichts NEUES bringt, beendet die Schleife. num_total_results
     wird zum Vergleich gemeldet, aber nie als Abbruchbedingung
     verdrahtet - ein fremder Bestand hat andere Größen.

     JEDER FEHLSCHLAG NENNT SEINEN STATUSCODE. 401 (Token abgelaufen),
     404 (Weg geschlossen) und "wirklich leer" sahen vorher alle gleich
     aus; genau daran ist der Ausfall vorbeigelaufen. */
  const zeile2 = sagen('Hole deine Alben (Köpfe und Einträge) …');
  /* Wer im Suno-Tab angemeldet war - laut /api/user/me, geholt im
     Albumblock. Fährt in der Ernte mit, damit der Server eine Ernte
     aus einem fremden Konto abweisen kann (409), statt sie einzuweben. */
  let angemeldetAls = null;
  /* Die Ernte trägt genau den Umschlag, den bin/aufbereiten.js beim
     Lesen der playlists-Rohdatei erwartet (dort: "const koepfe = ...
     pRoh.playlists", "const rohClips = ... pRoh.clips"): Köpfe als
     Liste, Einträge als Objekt mit der Album-id als Schlüssel, jeder
     Eintrag im Umschlag {clip, relative_index, created_at}.
     Ein Album, dessen Inhalt nicht geholt werden konnte, kommt gar
     nicht erst in die Ernte - weder Kopf noch Einträge. Ein Album,
     das bei Suno WIRKLICH leer ist, kommt dagegen MIT leerer Liste
     hinein: das ist Sunos Wahrheit, und der Riegel in aufbereiten.js
     behält den alten Stand, wenn es im Katalog noch Einträge hatte. */
  let albenKoepfe = [];
  const albenEintraege = {};
  /* Nur wenn ALLE Köpfe geblättert und ALLE Inhalte geholt wurden, ist
     diese Ernte die ganze Wahrheit. Nur dann darf aufbereiten.js ein
     Album, das hier fehlt, als in Suno gelöscht ansehen und wegwerfen.
     "Alle Köpfe" heisst ZWEIERLEI, und beides muss stimmen:
       (a) die Kopfliste ist so lang, wie Suno selbst sagt
           (num_total_results) - wenn Suno die Zahl nennt;
       (b) die letzte gelesene Kopfseite war LEER, das echte Ende.
     Bis zum 08.09.2026 abends zählte hier nur, ob die INHALTE kamen.
     Antwortete Kopfseite 2 mit 200 und einer leeren oder wiederholten
     Liste, brach die Schleife bei 12 von 25 Köpfen ab, die Flagge stand
     auf wahr, die Zeile wurde grün - und aufbereiten.js hätte die 13
     fehlenden Alben als "in Suno gelöscht" entfernt. */
  let albenVollstaendig = false;
  if (!wahl.playl){ zeile2.textContent = 'Alben — übersprungen'; zeile2.style.color = '#8a8a90'; }
  else {
    try {
      let tA = await tokenHolen();
      /* Ohne Token gar nicht erst losfahren. tokenHolen.grund traegt
         einen fertigen Klartextsatz (etwa "Das Lesezeichen gehoert auf
         einen Tab von suno.com"); der gehoert in die Zeile, sonst steht
         da nur "kein Token" und niemand weiss, was zu tun ist. */
      if (!tA){ throw new Error('kein Token — '
        + (tokenHolen.grund || 'Suno meldet in diesem Tab keine Anmeldung.')); }
      /* DER TOKEN LEBT RUND 60 SEKUNDEN (docs/DATENEXTRAKTION.md:15-17),
         alle Sammelskripte holen ihn vor jeder Anfrage neu. Dieser Lauf
         macht bei 25 Alben gut 30 Anfragen mit je 250 ms Pause plus
         Netz - das liegt über der Lebensdauer. Deshalb vor JEDER Anfrage
         frisch bei Clerk fragen; Clerk gibt einen noch gültigen Token
         sofort zurück und erneuert nur, wenn er abläuft. Kommt einmal
         keiner (kurzes Wackeln), fährt der letzte gute weiter. */
      const kopfMitToken = async () => {
        const t = await tokenHolen(3000);
        if (t) tA = t;
        return { Authorization: 'Bearer ' + tA };
      };
      /* WER IST HIER ANGEMELDET? Die Songliste oben kommt vom Profil
         der Sammlung, aber /api/playlist/me antwortet für das Konto,
         dessen Token im Tab liegt. Ist das ein anderes als die
         Sammlung, wären es fremde Alben unter dem richtigen Handle -
         und aufbereiten.js hielte die eigenen für gelöscht. Deshalb
         hier einmal /api/user/me fragen (derselbe Weg wie beim ersten
         Lauf, oben) und den Namen in die Ernte schreiben: der Server
         hält ihn gegen konfig.json und weist Fremdes mit 409 ab.

         DER WÄCHTER SCHLIESST BEI STÖRUNG, ER ÖFFNET NICHT. Bis zum
         08.09.2026 abends wurde hier jeder Fehler stumm gefangen -
         HTTP 500, ein Netzfehler, eine 200er-Antwort ohne handle-Feld -
         und `angemeldet` blieb null. Null hiess dann "nicht zu
         erfahren", die Alben des Tabs wurden trotzdem geholt, die Ernte
         fuhr mit vollstaendig=true und ohne angemeldetAls zum Server,
         und der Server konnte nur noch profil.handle prüfen - der aus
         dem EIGENEN Katalog stammt und nie fremd ist. War im Tab ein
         anderes Konto angemeldet, wären dessen Alben als die eigenen
         eingewoben und alle eigenen als "in Suno gelöscht" entfernt
         worden. Ein Wächter, der bei Störung durchwinkt, ist keiner:
         gerade wenn die Frage nicht beantwortet wird, darf die Antwort
         nicht "ja" lauten. Deshalb jetzt: ohne bestätigtes Konto läuft
         der Albumblock NICHT, mit Grund in der Zeile; der Rest der
         Ernte (Songliste, Private, Analyse) läuft weiter. */
      await pause();                       // die Songliste oben bricht an drei Stellen ohne Pause ab
      let angemeldet = null, meGrund = null;
      try {
        const rMe = await fetch(`${API}/api/user/me`, { headers: await kopfMitToken() });
        if (!rMe.ok) meGrund = `HTTP ${rMe.status}`;
        else {
          const me = await rMe.json();
          angemeldet = (me && (me.handle || (me.profile && me.profile.handle))) || null;
          if (!angemeldet) meGrund = `Antwort ohne handle (Felder: ${Object.keys(me||{}).join(', ') || 'keine'})`;
        }
      } catch (x) { meGrund = x.message || 'Netzfehler'; }
      if (!angemeldet){
        const u = new Error(`Alben — Konto nicht bestätigt (/api/user/me: ${meGrund}), übersprungen`);
        u.uebersprungen = true;            // die Zeile bekommt den Satz unverändert, siehe catch
        throw u;
      }
      angemeldetAls = angemeldet;
      if (String(angemeldet).toLowerCase() !== String(handle).toLowerCase())
        throw new Error(`in diesem Tab ist @${angemeldet} angemeldet, die Sammlung gehört @${handle} — `
                      + `fremde Alben werden nicht geholt`);
      await pause();                       // auch zwischen dieser Frage und der ersten Kopfseite

      /* Sunos Gesamtzahlen kommen als Zahl, koennten aber auch als
         Zeichenkette kommen ("2", "0") - und "2" > 0 ist in JavaScript
         wahr, "0" > 0 falsch, "2" < 3 wahr; ein Vergleich mit !== oder
         Math.max dagegen kippt. Deshalb EINE Stelle, die aus allem, was
         Suno nennt, eine Zahl macht oder null: fehlt, leer oder kein
         Zahlwert heisst "nicht genannt".
         STRENG seit dem 08.09.2026 abends (Gegenleser, Runde 4): Number()
         macht aus '  ', false und [] eine 0 - und eine 0 galt unten als
         Sunos AUSDRUECKLICHES "leer", das Album kam leer in die Ernte,
         die Flagge blieb gruen. Auch -1 rutschte durch (weder > 0 noch
         null). Als Nennung zaehlt deshalb nur, was auch eine Anzahl sein
         kann: eine endliche Zahl >= 0 oder eine Zeichenkette, die nach
         trim() nur aus Ziffern besteht. Alles andere ist "nicht genannt"
         - das schaerft die Warnungen; endgueltig harmlos macht solche
         Antworten die Bestaetigungsregel in bin/aufbereiten.js. */
      const zahl = (v) => {
        if (typeof v === 'number') return (Number.isFinite(v) && v >= 0) ? v : null;
        if (typeof v === 'string' && /^\d+$/.test(v.trim())) return Number(v.trim());
        return null;
      };

      /* --- Stufe 1: die Köpfe --- */
      const koepfe = new Map();
      let lautSuno = null;
      let kopfEndeGesehen = false;        // erst eine LEERE Seite beweist das Ende
      /* Notbremse wie bei der Songliste oben (deren 60-Seiten-Schleife):
         eine generische Obergrenze, keine Zahl aus irgendeinem Bestand. */
      for (let seite = 1; seite <= 200; seite++){
        if (seite > 1) await pause();    // vor jeder Folgeanfrage, auch vor der letzten
        const a = await fetch(`${API}/api/playlist/me?page=${seite}`, { headers: await kopfMitToken() });
        if (!a.ok){
          /* Hinter der letzten Seite könnte Suno statt einer leeren
             Liste auch einen Fehlercode geben - das ist nicht belegt.
             Sind bis hierher so viele Köpfe da, wie Suno selbst nennt,
             gilt das nicht als Fehlschlag, aber auch NICHT als
             bewiesenes Ende: die Alben kommen in die Ernte, nur
             gelöscht wird aus ihr nichts. */
          if (seite > 1 && lautSuno != null && koepfe.size >= lautSuno) break;
          throw new Error(`Albumliste Seite ${seite} — HTTP ${a.status}`);
        }
        const d = await a.json();
        const teil = Array.isArray(d) ? d
                   : (d && Array.isArray(d.playlists)) ? d.playlists : null;
        /* KEIN `d.playlists || d`: Kommt eine Antwort ohne den Schlüssel,
           war das vorher ein OBJEKT in playlists, dessen .length undefined
           ist - die Zeile meldete "geholt — undefined" und färbte grau. */
        if (!teil) throw new Error(`Albumliste Seite ${seite} — Antwort ohne Liste `
                                 + `(Felder: ${Object.keys(d||{}).join(', ') || 'keine'})`);
        { const n = zahl(d && d.num_total_results); if (n != null) lautSuno = n; }
        let neuHier = 0;
        for (const p of teil) if (p && p.id && !koepfe.has(p.id)){ koepfe.set(p.id, p); neuHier++; }
        zeile2.textContent = `Alben … ${koepfe.size}${lautSuno != null ? '/' + lautSuno : ''}`;
        if (!teil.length){ kopfEndeGesehen = true; break; }   // leer: das echte Ende
        /* Gefüllt, aber nichts Neues: die Doppelseite page=0/1 oder eine
           Wiederholung. Weiterblättern bringt nichts - aber ein Ende ist
           das NICHT, deshalb bleibt kopfEndeGesehen falsch. */
        if (!neuHier) break;
      }
      const alleKoepfe = [...koepfe.values()];
      if (!alleKoepfe.length) throw new Error('Suno nennt kein einziges Album');
      const kopfLuecke = lautSuno != null && alleKoepfe.length < lautSuno;
      /* Die andere Richtung ist genauso ein Widerspruch: Suno nennt
         WENIGER Alben, als es gerade geliefert hat. Bis zum 08.09.2026
         abends galt das als harmlos ("Suno nennt 0 Alben" in der Zeile,
         Flagge wahr) - nachgespielt: Liste nennt 0 bei 12 gelieferten
         Koepfen, Seite 2 leer, und aufbereiten.js entfernte die 13 Alben,
         die in dieser Ernte fehlten. Eine Zahl, die dem Gelieferten
         widerspricht, taugt nicht als Zeuge fuer "alles da"; aus so einer
         Ernte wird nichts geloescht. */
      const kopfWiderspruch = lautSuno != null && lautSuno < alleKoepfe.length;

      /* --- Stufe 2: je Album die Einträge --- */
      let eintraegeGesamt = 0, ohneClipGesamt = 0, bisherGeholt = 0;
      const luecken = [], ausgefallen = [];
      /* Je Album ein Befund, die Entscheidung "in die Ernte / Luecke /
         Ausfall" faellt ERST NACH allen Alben: Ob ein Album nach einer
         VOLLEN Seite abgebrochen hat, laesst sich nur gegen die
         Seitengroesse dieses Laufs sagen - und die kennt man erst, wenn
         alle geblaettert sind (unten, "SEITENGROESSE"). */
      const befunde = [];
      for (const p of alleKoepfe){
        await pause();                     // auch zwischen Stufe 1 und dem ersten Album
        try {
          const eintraege = new Map();
          /* Roh gelieferte Einträge, auch die OHNE brauchbaren clip:
             Suno liefert gelöschte und private Songs genau so aus
             (docs/DATENEXTRAKTION.md, "Sechs Einträge liefert die API
             nicht aus"). Ob eine Seite etwas Neues brachte, entscheidet
             sich an DIESEN, nicht an den brauchbaren - sonst beendet
             eine Seite voller Leerhüllen das Blättern mitten im Album. */
          const rohGesehen = new Set();
          /* DIE KOPFZAHL IST DIE MASSGEBLICHE. Bis zum 08.09.2026 abends
             ueberschrieb die Zahl aus der Inhaltsantwort die Kopfzahl -
             und eine Inhaltsantwort, die 200 mit leerer Liste UND
             num_total_results 0 gab, senkte damit das Soll auf 0: der
             Widerspruchsriegel unten (0 > 0) griff nicht, das Album stand
             mit null Eintraegen in der Ernte, die Flagge blieb wahr, und
             aufbereiten.js leerte es im Katalog (nachgespielt: 50
             Eintraege wurden 48; bei 24 solchen Alben 2). Die Zahl aus
             dem Inhalt darf das Soll nur ERHOEHEN, nie senken: Wer
             sagt "ich habe 2", dem glaubt man nicht, wenn er gleich
             darauf "0" sagt und nichts liefert. */
          const kopfN = zahl(p.num_total_results);
          let sollLautSuno = kopfN, ohneClip = 0;
          /* Fuer die Seitengroesse (unten): wie viele Seiten brachten
             etwas Neues, wie gross war die letzte davon, wie gross die
             groesste. Gezaehlt wird, was Suno GELIEFERT hat (teil.length),
             nicht, was brauchbar war. */
          let seitenMitNeuem = 0, letzteSeite = 0, groessteSeite = 0;
          for (let seite = 1; seite <= 200; seite++){
            if (seite > 1) await pause();
            const a = await fetch(`${API}/api/playlist/${encodeURIComponent(p.id)}?page=${seite}`,
                                  { headers: await kopfMitToken() });
            if (!a.ok) throw new Error(`Seite ${seite} — HTTP ${a.status}`);
            const d = await a.json();
            const teil = (d && Array.isArray(d.playlist_clips)) ? d.playlist_clips
                       : Array.isArray(d) ? d : null;
            if (!teil) throw new Error(`Seite ${seite} — Antwort ohne playlist_clips `
                                     + `(Felder: ${Object.keys(d||{}).join(', ') || 'keine'})`);
            { const inhaltN = zahl(d && d.num_total_results);
              if (inhaltN != null) sollLautSuno = Math.max(sollLautSuno ?? 0, inhaltN); }
            let neuRoh = 0;
            for (const e of teil){
              const c = e && e.clip;
              /* Entdoppeln über clip-id UND Position: Die Doppelseite
                 page=0/page=1 liefert denselben Eintrag mit derselben
                 Position und fällt heraus; ein Song, den man zweimal in
                 dasselbe Album gelegt hat, steht auf zwei Positionen und
                 bleibt beides Mal erhalten. Ohne clip zählt die Position
                 allein - für die Abbruchfrage reicht das. */
              const schluessel = ((c && c.id) || '?') + '·' + ((e && e.relative_index) ?? '');
              if (rohGesehen.has(schluessel)) continue;
              rohGesehen.add(schluessel); neuRoh++;
              if (!c || !c.id){ ohneClip++; continue; }
              eintraege.set(schluessel, e);     // der volle Umschlag, roh wie er kam
            }
            zeile2.textContent = `Alben … ${alleKoepfe.length}, `
              + `${bisherGeholt + eintraege.size} Einträge`;
            if (!teil.length || !neuRoh) break;
            seitenMitNeuem++; letzteSeite = teil.length;
            groessteSeite = Math.max(groessteSeite, teil.length);
          }
          /* KOPF UND INHALT WIDERSPRECHEN SICH: Der Kopf nennt N > 0
             Einträge, der Inhalt antwortet 200 mit einer LEEREN Liste.
             Das ist kein leeres Album, das ist eine Antwort, die nicht
             stimmt (vorübergehend, Suno liefert die Seite mal leer).
             Bliebe sie stehen, stünde das Album mit null Einträgen in
             der Ernte, die Flagge unten wüsste nichts davon (sie kennt
             nur `ausgefallen`, nicht `luecken`), und aufbereiten.js
             leerte das Album im Katalog mit der Spiegelregel - nach-
             gespielt: 25 Alben, 50 Einträge wurden 48. Deshalb gilt
             "0 von N > 0" als AUSFALL, genau wie ein HTTP-Fehler: das
             Album fehlt in der Ernte, die Ernte gilt als unvollständig,
             der Riegel greift. Gezählt wird das ROH Gelieferte: Kommen
             nur Leerhüllen ohne clip, hat Suno geantwortet - das ist
             eine Lücke (unten), kein Ausfall. Und Caspar_Ds sechs
             dauerhaft fehlende Einträge liefern N-6 von N, nicht 0 von
             N - auch die bleiben eine Lücke. Ein Kopf mit N = 0 und
             leerem Inhalt ist wirklich leer und bleibt stehen.
             sollLautSuno ist hier das Groessere aus Kopf- und
             Inhaltszahl (siehe oben) - eine Inhaltszahl 0 kann den
             Riegel nicht mehr aushebeln. */
          if (sollLautSuno > 0 && !rohGesehen.size)
            throw new Error(`leer geliefert, Suno nennt ${sollLautSuno} Einträge`);
          /* NICHTS GELIEFERT UND NIRGENDS EINE ZAHL: Weder der Kopf noch
             der Inhalt nennen num_total_results, die Liste ist leer. Das
             KANN ein leeres Album sein - oder dieselbe vorübergehend
             leere Antwort wie oben, nur ohne den Zeugen, der sie
             ueberfuehrt. Bis zum 08.09.2026 abends blieb so ein Album
             mit null Eintraegen in der Ernte (0 > null ist falsch), die
             Flagge wahr, und aufbereiten.js leerte es im Katalog. Ohne
             Zahl ist "leer" kein Beweis; im Zweifel Ausfall: das Album
             fehlt in der Ernte, der Katalogstand bleibt, die Zeile
             nennt es. Nennt Suno irgendwo ausdruecklich 0, bleibt das
             Album leer stehen - das ist Sunos Wort. */
          if (sollLautSuno == null && !rohGesehen.size)
            throw new Error('leer geliefert, und weder Kopf noch Inhalt nennen eine Gesamtzahl');
          befunde.push({ p, eintraege: [...eintraege.values()], roh: rohGesehen.size,
                         soll: sollLautSuno, ohneClip, seitenMitNeuem, letzteSeite, groessteSeite });
          bisherGeholt += eintraege.size;
        } catch (x){
          /* Ein Album, dessen Inhalt nicht kam, wird WEGGELASSEN - Kopf
             wie Einträge. Ein Kopf ohne Inhalt hieße in aufbereiten.js
             "dieses Album hat null Einträge", und der Riegel dort müsste
             es erst wieder zurückholen. Fehlt es ganz, bleibt schlicht
             der Katalogstand stehen. Der Lauf geht weiter: ein einzelnes
             kaputtes Album darf nicht alle anderen verhindern. */
          ausgefallen.push(`${p.name || p.id}: ${x.message}`);
        }
      }

      /* SEITENGROESSE: ABBRUCH NACH VOLLER SEITE IST EIN AUSFALL, KEINE
         LUECKE. Ein Album, das weniger liefert, als Suno nennt, kann
         zweierlei sein: Caspar_Ds sechs dauerhaft fehlende Eintraege
         (Suno liefert sie nie, mehrfaches Abrufen aendert nichts) - oder
         eine Seite, die diesmal vorübergehend leer kam. Bis zum
         08.09.2026 abends sahen beide gleich aus: Kopf N=101, Seite 1
         und 2 voll, Seite 3 leer, ergab "40/101, Luecke", Flagge wahr,
         und aufbereiten.js schrieb das Album per Spiegelregel auf 40
         herunter. Das Merkmal, das beide trennt: Ein natuerliches Ende
         kommt nach einer NICHT vollen Seite (die letzte ist kuerzer).
         Bricht das Blaettern nach einer VOLLEN Seite ab und liegt das
         Gelieferte unter N, fehlt eine Seite - das ist ein Ausfall.
         "Voll" wird NICHT verdrahtet, sondern aus diesem Lauf gelesen:
         die groesste gelieferte Seite ueber alle Alben - und nur, wenn
         mindestens ein Album mehr als eine Seite brauchte, sonst ist
         "voll" gar nicht definiert (lauter kleine Alben in einem Bestand:
         die groesste Seite ist dann irgendein ganzes Album). Nur EINE
         Seite geliefert, die so gross ist wie die groesste des Laufs,
         und weniger als N: ambivalent (Seite 1 von 3, deren Seite 2
         leer kam?) - im Zweifel Ausfall. Caspar_Ds echte Faelle
         (AHNHEIM 25/26, Nice Songs 42/43, Vor langer Zeit 32/35, alle
         eine Seite bei 50 je Seite, "voll" durch My Industrial Songs
         101 = 3 Seiten definiert) sind alle kuerzer als 50 und bleiben
         Luecke. Ein ausgefallenes Album fehlt in der Ernte wie bei
         einem HTTP-Fehler: der Katalogstand bleibt, die Flagge faellt. */
      const seitenGroesse = befunde.reduce((m, b) => Math.max(m, b.groessteSeite), 0);
      const vollBekannt   = befunde.some(b => b.seitenMitNeuem > 1);
      for (const b of befunde){
        const name = b.p.name || b.p.id;
        if (b.soll != null && b.roh < b.soll && vollBekannt && b.letzteSeite === seitenGroesse){
          ausgefallen.push(`${name}: Blättern brach nach einer vollen Seite (${b.letzteSeite}) `
                         + `bei ${b.roh} von ${b.soll} ab`);
          continue;
        }
        albenEintraege[b.p.id] = b.eintraege;
        eintraegeGesamt += b.eintraege.length;
        ohneClipGesamt  += b.ohneClip;
        /* Kopfzahl gegen Geliefertes halten. Bei Caspar_D liefert Suno
           sechs Einträge dauerhaft nicht aus (DATENEXTRAKTION.md, "kein
           Sammelfehler, mehrfaches Abrufen ändert nichts") - das ist
           kein Grund, den Lauf abzubrechen, aber es gehört gesagt,
           sonst sieht eine verlorene Seite genauso aus. */
        if (b.soll != null && b.eintraege.length < b.soll)
          luecken.push(`${name} ${b.eintraege.length}/${b.soll}`
                     + (b.ohneClip ? ` (${b.ohneClip} ohne clip)` : ''));
      }

      /* Nur Alben, deren Inhalt geholt wurde - eine leere Liste ist
         geholter Inhalt (siehe oben), ein fehlender Schlüssel nicht. */
      albenKoepfe = alleKoepfe.filter(p => Array.isArray(albenEintraege[p.id]));
      /* OHNE SUNOS GESAMTZAHL NIE VOLLSTÄNDIG: Nennt /api/playlist/me
         kein num_total_results, bleibt lautSuno null, und kopfLuecke
         kann gar nicht wahr werden - sie vergleicht gegen nichts. Dann
         reicht eine vorübergehend leere Seite 2 nach zwölf Köpfen, und
         die Ernte sähe vollständig aus; aufbereiten.js löschte die
         dreizehn übrigen Alben. Ohne Vergleichszahl ist "leer" kein
         Beweis, nur ein Ende ohne Zeugen. Die Ernte kommt trotzdem an
         (Alben werden ergänzt und aktualisiert), gelöscht wird aus ihr
         nichts. */
      albenVollstaendig = lautSuno != null && !ausgefallen.length && !kopfLuecke && !kopfWiderspruch
                       && kopfEndeGesehen;

      /* Die Groesse gehoert in die Zeile: Die Alben fahren im ersten Post
         mit, und der Server kappt bei 64 MB mit req.destroy() - der
         Browser saehe dann nur "Failed to fetch". Wer die Zahl wachsen
         sieht, erkennt das kommen. */
      const mb = JSON.stringify({ playlists: albenKoepfe, clips: albenEintraege }).length / 1048576;
      const groesse = mb >= 1 ? mb.toFixed(1) + ' MB' : Math.round(mb * 1024) + ' KB';
      let text = `Alben — ${albenKoepfe.length} mit ${eintraegeGesamt} Einträgen (${groesse})`;
      if (kopfLuecke) text += `; KOPFLISTE UNVOLLSTÄNDIG: ${alleKoepfe.length} von ${lautSuno} laut Suno`;
      else if (lautSuno == null) text += '; Suno nennt keine Gesamtzahl';
      else if (kopfWiderspruch) text += `; WIDERSPRUCH: Suno nennt ${lautSuno} Alben, geliefert ${alleKoepfe.length}`;
      if (!kopfEndeGesehen && !kopfLuecke) text += '; Ende der Albumliste nicht bestätigt';
      if (luecken.length)     text += `; unvollständig: ${luecken.join(', ')}`;
      if (ohneClipGesamt)     text += `; ${ohneClipGesamt} Einträge ohne clip (gelöscht/privat bei Suno)`;
      if (ausgefallen.length) text += `; NICHT geholt: ${ausgefallen.join(' · ')}`;
      if (!albenVollstaendig) text += ' — aus dieser Ernte wird im Katalog nichts gelöscht';
      zeile2.textContent = text;
      /* NULL ALBEN BEI ANGEHAKTEM KASTEN IST EIN FEHLER, kein Zustand.
         Dasselbe gilt für Alben ohne einen einzigen Eintrag - das ist
         der Kopf-ohne-Inhalt-Fall, der im Katalog 599 Einträge löschen
         würde, wenn der Riegel in aufbereiten.js ihn nicht abfinge.
         Und dasselbe gilt für eine Kopfliste, die kürzer ist, als Suno
         sagt: aus so einer Ernte würde gelöscht, wäre die Flagge oben
         nicht - deshalb Pink, nicht Orange. Orange ist alles, was
         unvollständig, aber ungefährlich ist. */
      zeile2.style.color = (!albenKoepfe.length || !eintraegeGesamt || kopfLuecke) ? '#e31c79'
                         : (ausgefallen.length || luecken.length || !kopfEndeGesehen || lautSuno == null
                            || kopfWiderspruch) ? '#f97b14'
                         : '#16be5c';
    } catch (x){
      /* Nichts halb Geholtes in die Ernte: Ein Fehlschlag auf der
         Kopfliste heißt, dass niemand weiß, wie viele Alben es gibt. */
      albenKoepfe = []; albenVollstaendig = false;
      for (const k of Object.keys(albenEintraege)) delete albenEintraege[k];
      zeile2.textContent = x.uebersprungen ? x.message : 'Alben — nicht geholt: ' + x.message;
      zeile2.style.color = '#e31c79';
    }
  }

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
      /* Die letzte Suno-Anfrage war die letzte Albumseite - ohne diese
         Pause folgte der erste /api/clip unmittelbar darauf. */
      if (priv.length) await pause();
      for (const a of priv){
        try {
          const r = await fetch(`${API}/api/clip/${a.id}`, { headers: H0 });
          if (r.ok){ const c = await r.json(); if (c && c.id){ privatSongs.set(c.id, c); privatGeholt++; } }
        } catch (x) {}
        zeileP.textContent = `Private Songs … ${privatGeholt}/${priv.length}`;
        await pause();
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

    /* Hier stand bis zum 08.09.2026 die „API-Probe, einmalig": drei GETs mit
       Token auf einen eigenen Song (gen/<id>/wav_file/, download/clip/<id>,
       clips/get_songs_by_ids), am 20.08. auf Caspar_Ds Wort gebaut, Ergebnis
       in docs/SUNO-API.md. Gestrichen, weil download/clip seit dem 03.09. auf
       das Download-Kontingent zaehlt und niemand weiss, ob der Aufruf ohne
       format ein Guthaben kostet - in einem frischen Browser (Tarja, neues
       Profil) waere die Probe wieder gelaufen. Die Hausregel: nichts
       ausloesen, was Credits oder Kontingent kosten kann. */

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
          await pause();
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
     GET /api/notification/v3 - wer wann was getan hat: clip_like,
     clip_comment, comment_like, comment_reply, follow, playlist_like.
     v3 ist der Weg der Handy-App (aus ihrem Code gelesen, docs/
     SUNO-APP-WEGE.md; einmal geprueft 08.09.2026 mit Freigabe): jede
     Zeile kommt fertig - avatars[], text[] als Segmente mit bold und
     action, dazu action fuer das Ziel. JE PERSON EINE ZEILE, Buendel
     mit allen Beteiligten. Bis 08.09.2026 lief hier v2, das Herzen auf
     denselben Titel zu EINEM Eintrag mit hoechstens drei user_profiles
     kuerzte - deshalb fehlten Namen und Zeiten. Der Server normiert
     beide Formen auf dieselbe Zeile (benachrichtigungNormieren).

     Zurueckgeblaettert wird mit before_datetime_utc - nicht 'before',
     das liefert stumm dieselbe Seite noch einmal. Suno haelt rund vier
     Wochen (gemessen 249 Eintraege bis 24.07.); was aelter ist, ist
     weg. Deshalb bei jedem Lauf ALLES holen, was da ist - der Server
     haengt nur an, was er noch nicht kennt. 25 je Seite.

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
        const u = `${API}/api/notification/v3?include_hooks=false` + (vor ? '&before_datetime_utc=' + encodeURIComponent(vor) : '');
        const r = await fetch(u, { headers: Hn });
        if (!r.ok) break;
        const d = await r.json();
        const n = (d.notifications || []).filter(x => x && x.id && !gesehen.has(x.id));
        if (!n.length) break;
        for (const x of n){ gesehen.add(x.id); benachrichtigungen.push(x); }
        zeileN.textContent = `Wer hat reagiert … ${benachrichtigungen.length}`;
        if (!d.next_before_datetime_utc) break;
        vor = d.next_before_datetime_utc;
        await pause();
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
  /* ---- DOWNLOAD-KONTINGENT ------------------------------------------
     Seit dem 03.09.2026 deckelt Suno die Downloads. Der Stand steht in
     /api/billing/info/ unter download_usage. Das Lesezeichen hat den
     Token ohnehin in der Hand, also bringt es ihn gleich mit - so
     braucht KlangTresor selbst NIE einen Token, es liest nur, was die
     Ernte mitgebracht hat.

     Caspar_D, 06.09.2026: "immer, wenn du die user Seite oeffnest,
     ueberpruefst du, wieviele Downloads noch fuer diesen Monat uebrig
     sind und zeigst es an."

     NUR LESEN. Das Lesezeichen loest keinen Download aus - das bleibt
     Handarbeit, genau wie das Entfolgen in 03-folgen-pruefen.js
     ("Entfolgt wird nichts - das bleibt Handarbeit und ist gut so").
     Ein Download kostet Geld und ist nicht ruecknehmbar; ein Fehler in
     einer Schleife waere hier nicht aergerlich, sondern teuer. */
  let kontingent = null;
  try {
    const tk = await tokenHolen(4000);
    if (tk){
      const b = await (await fetch(`${API}/api/billing/info/`,
        { headers: { Authorization: 'Bearer ' + tk } })).json();
      const d = b.download_usage || {};
      kontingent = {
        gelesenAm:    new Date().toISOString(),
        verbraucht:   d.current_period_downloads_used,
        grenze:       d.current_period_downloads_limit,
        /* LEBENSLANG: Freigaben aus der Testphase. Sie erneuern sich NIE
           (Caspar_D: "die 7 sind die lifetime free downloads fuer den
           trial user"). Getrennt fuehren, niemals zu 'grenze'
           dazuzaehlen - sonst verschwinden sie unbemerkt. */
        lebenslang:   d.additional_download_remaining,
        zugekauft:    d.current_period_download_top_ups_purchased,
        zukaufGrenze: d.current_period_download_top_up_purchase_limit,
        anker:        b.subscription_anchor || null,
        plan:         (b.plan && b.plan.plan_key) || null,
      };
      sagen(`Download-Kontingent: ${kontingent.verbraucht} von ${kontingent.grenze} verbraucht`
        + (kontingent.lebenslang ? `, dazu ${kontingent.lebenslang} lebenslange` : '') + '.');
    }
  } catch (e) { /* Kontingent ist Beiwerk - die Ernte scheitert daran nicht */ }

  const ernte = {
    erzeugtAm: new Date().toISOString(),
    quelle: 'morgens.js',
    timing,
    kontingent,
    profil: kopf ? { handle, display_name: kopf.display_name,
                     avatar_image_url: kopf.avatar_image_url, num_total_clips: gesamt }
                 : { handle },
    songs: [...songs.values()],
    privat: [...privatSongs.values()],
    /* DER ALBUMUMSCHLAG, genau wie bin/aufbereiten.js ihn beim Lesen der
       playlists-Rohdatei erwartet ("const koepfe = ... pRoh.playlists",
       "const rohClips = ... pRoh.clips"): Koepfe als Liste, Eintraege als
       Objekt mit der Album-id als Schluessel. Vorher stand hier eine nackte Liste von Koepfen - und
       der Server hat sie nie irgendwohin geschrieben, wo aufbereiten sie
       gefunden haette. Das Feld heisst weiter 'playlists', weil Katalog,
       Oberflaeche und Rohdatenart es so nennen.
       Die Alben fahren im ERSTEN Post mit (anServer spaltet nur timing
       ab). Gemessen an Caspar_Ds Bestand: 599 Eintraege mit vollen
       clip-Objekten waren am 17.08.2026 3,8 MB, rund 6 KB je Eintrag -
       die Kappe im Server liegt bei 64 MB, das reicht fuer rund 10.000
       Eintraege. Die Zeile oben nennt die tatsaechliche Groesse. */
    playlists: { playlists: albenKoepfe, clips: albenEintraege,
                 vollstaendig: albenVollstaendig },
    /* Wer im Suno-Tab angemeldet war (siehe Albumblock). null, wenn es
       nicht zu erfahren war - dann prueft der Server nur profil.handle. */
    angemeldetAls,
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
    /* Was der Server an Alben angenommen hat, sagt ablageSatz (oben,
       bei anServer) - dieselbe Zeile wie beim Nachreichen. */
    const a = ablageSatz(abgelegt, !!wahl.playl);
    zeileA.textContent = `Gesichert — ${a.text}`;
    zeileA.style.color = a.farbe;
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
