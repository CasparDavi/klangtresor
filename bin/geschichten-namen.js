#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   NAMEN UND GENRES FÜR DEN GESCHICHTEN-RAUM
   bin/geschichten-namen.js  ·  läuft NACH bin/karte.js

   Zwei Dinge, die beide das Textmodell brauchen und deshalb nicht in
   karte.js passen (das rechnet synchron):

   1. GRUPPENNAMEN aus den Texten, nach Kontrast statt Häufigkeit
   2. GESCHICHTEN-GENRES je Song, über vorgegebene Begriffe

   -------------------------------------------------------------
   WARUM KONTRAST UND NICHT NÄHE

   Caspar_D, 28.08.2026: "die stoppwörter sind schrott, wir müssen
   irgendwas übergeordnetes finden".

   Der naheliegende Weg waere, die Woerter zu nehmen, die dem
   Schwerpunkt der Gruppe am naechsten liegen. Gemessen kam das
   Gegenteil heraus:

     am naechsten:  dabei · kotzt · motzt · vorbei · sagt
     am weitesten:  protein · systemstart · supplements · oxytocin

   Der Schwerpunkt liegt in der MITTE des Raums, und dort wohnen die
   allgemeinen Woerter. Naehe zu ihm misst Durchschnittlichkeit, nicht
   Kennzeichnung. Richtig ist der Abstand zwischen beidem:

     Wert = Naehe zum eigenen Schwerpunkt - Naehe zum Gesamtschwerpunkt

   Das braucht KEINE Stoppwortliste: Fuellwoerter liegen beiden
   Schwerpunkten gleich nah, ihr Kontrast ist null.

   Und der Wert ist nebenbei ein Guetemass. Unter MINDEST_KONTRAST
   bekommt eine Gruppe GAR KEINEN Namen - lieber keinen als einen
   erfundenen.

   -------------------------------------------------------------
   DIE GESCHICHTEN-GENRES

   Caspar_D: "genres, instrumente in Geschichten müssten was völlig
   anderes sein - nämlich Geschichten-Genres."

   Genre, Stimmung und Instrumente beschreiben den KLANG. Im
   Geschichten-Raum stehen sie am falschen Platz. Hier stehen drei
   Achsen, die zum Text gehoeren - und sie sind absichtlich als SAETZE
   formuliert, nicht als Einzelwoerter: "Liebe" allein ist ein
   schwaches Signal, ein ganzer Satz aehnelt dem, was in den Texten
   steht. Das ist bei diesem Verfahren der halbe Erfolg.

   Klassische Gedichtgattungen - Ballade, Sonett, Elegie - fehlen mit
   Absicht: Sie haengen an Versmass, Strophenbau und Reim, und das
   sieht ein Bedeutungsmodell nicht.
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const K = require('./katalog.js');
const { einbetterLaden } = require('./texte-einbetten.js');
const { nurGesungenes } = require('./geschichten.js');

const WURZEL = path.join(__dirname, '..');
const LIB    = path.join(WURZEL, 'library');
const MODELL = path.join(LIB, 'modelle', 'paraphrase-multilingual-mpnet.onnx');
const TOKEN  = path.join(LIB, 'modelle', 'paraphrase-multilingual-mpnet-tokenizer.json');

const MINDEST_KONTRAST = 0.05;   /* darunter hat die Gruppe kein Thema */
const WORTE_JE_NAME    = 3;
const MINDEST_ANTEIL   = 0.2;    /* ein Wort muss in einem Fuenftel der Gruppe stehen */

/* ---- Die drei Achsen ---------------------------------------------- */
const ACHSEN = {
  stoff: {
    'Liebe':        'ein Lied über Liebe, Nähe und Zärtlichkeit zwischen zwei Menschen',
    'Verlust':      'ein Lied über Abschied, Trennung und den Schmerz danach',
    'Sehnsucht':    'ein Lied über Sehnsucht, Warten und das Vermissen',
    'Aufbruch':     'ein Lied über Aufbruch, Neuanfang und Fortgehen',
    'Maschine':     'ein Lied über Technik, Maschinen, Computer und Systeme',
    'Körper':       'ein Lied über den Körper, Biologie, Zellen und Stoffwechsel',
    'Gesellschaft': 'ein Lied über Politik, Macht, Ungerechtigkeit und die Verhältnisse',
    'Natur':        'ein Lied über Landschaft, Wetter, Meer, Wald und Jahreszeiten',
    'Rausch':       'ein Lied über Feiern, Tanzen, Nacht und Rausch',
    'Arbeit':       'ein Lied über Arbeit, Alltag, Geld und Erschöpfung',
    'Tod':          'ein Lied über Sterben, Vergänglichkeit und den Tod',
    'Erinnerung':   'ein Lied über Kindheit, Erinnerung und vergangene Zeiten',
  },
  haltung: {
    'Bekenntnis':    'jemand spricht über sich selbst und die eigenen Gefühle',
    'Anrede':        'jemand spricht ein Du an und wendet sich direkt an eine Person',
    'Anklage':       'jemand klagt an, wirft vor und begehrt auf',
    'Erzählung':     'eine Geschichte wird erzählt, von Personen und was ihnen geschah',
    'Beobachtung':   'jemand beschreibt von außen, was zu sehen ist, ohne Wertung',
    'Beschwörung':   'etwas wird beschworen, wiederholt angerufen, wie ein Ritual',
    'Spott':         'etwas wird verspottet, ironisch überzeichnet, ins Lächerliche gezogen',
  },
  ton: {
    'zärtlich':   'ein zärtlicher, warmer, sanfter Ton',
    'trotzig':    'ein trotziger, kämpferischer, aufbegehrender Ton',
    'düster':     'ein düsterer, schwerer, bedrohlicher Ton',
    'ironisch':   'ein ironischer, spöttischer, augenzwinkernder Ton',
    'nüchtern':   'ein nüchterner, sachlicher, kühler Ton',
    'verspielt':  'ein verspielter, leichter, übermütiger Ton',
    'resigniert': 'ein resignierter, müder, hoffnungsloser Ton',
    'pathetisch': 'ein pathetischer, feierlicher, großer Ton',
  },
};

const cos = (a, b) => { let p = 0; for (let i = 0; i < a.length; i++) p += a[i] * b[i]; return p; };
function mittel(vektoren) {
  const m = new Float64Array(vektoren[0].length);
  for (const v of vektoren) for (let d = 0; d < v.length; d++) m[d] += v[d] / vektoren.length;
  let s = 0; for (const x of m) s += x * x; s = Math.sqrt(s) || 1;
  for (let d = 0; d < m.length; d++) m[d] /= s;
  return m;
}

(async () => {
  for (const [d, was] of [[MODELL, 'Modell'], [TOKEN, 'Tokenizer']])
    if (!fs.existsSync(d)) { console.error(`  ${was} fehlt — erst node bin/modelle-holen.js`); process.exit(1); }
  const gesch = path.join(LIB, 'geschichten.json');
  if (!fs.existsSync(gesch)) { console.error('  library/geschichten.json fehlt — erst node bin/geschichten.js'); process.exit(1); }

  const katalog = K.lesen();
  const texte   = JSON.parse(fs.readFileSync(gesch, 'utf8')).songs;
  const e       = await einbetterLaden(MODELL, TOKEN);

  /* Die Achsenbegriffe einmal einbetten - sie gelten fuer alle Songs. */
  const achsVek = {};
  for (const [achse, begriffe] of Object.entries(ACHSEN)) {
    achsVek[achse] = [];
    for (const [name, satz] of Object.entries(begriffe))
      achsVek[achse].push([name, await e.einbetten(satz)]);
  }
  console.log('  Achsen eingebettet: ' + Object.entries(ACHSEN).map(([a, b]) => `${a} (${Object.keys(b).length})`).join(', '));

  for (const datei of ['karte-geschichten.json', 'karte-lied.json']) {
    const pfad = path.join(LIB, datei);
    if (!fs.existsSync(pfad)) continue;
    const karte = JSON.parse(fs.readFileSync(pfad, 'utf8'));

    /* ---- 1. Geschichten-Genres je Song ---------------------------- */
    for (const s of karte.songs) {
      const t = texte[s.id]; if (!t) continue;
      const v = Float64Array.from(t.emb);
      s.gesch = {};
      for (const [achse, liste] of Object.entries(achsVek))
        s.gesch[achse] = liste.map(([n, w]) => [n, +cos(v, w).toFixed(3)])
                              .sort((a, b) => b[1] - a[1]).slice(0, 3);
    }

    /* ---- 2. Gruppennamen nach Kontrast ---------------------------- */
    const alleV = karte.songs.filter(s => texte[s.id]).map(s => Float64Array.from(texte[s.id].emb));
    const gesamt = mittel(alleV);
    let benannt = 0, namenlos = 0;

    for (const g of karte.gruppen) {
      const mit = karte.songs.filter(s => s.gruppe === g.nr && texte[s.id]);
      if (mit.length < 3) {
        /* Zu klein fuer eine Wortstatistik - aber der Klangname darf
           trotzdem nicht stehenbleiben. */
        const stoff = mittelAchse(mit, 'stoff'), ton = mittelAchse(mit, 'ton');
        g.name = stoff ? stoff + (ton ? ' — ' + ton : '') : 'zu klein für ein Thema';
        g.themen = null; g.achsen = { stoff, haltung: mittelAchse(mit, 'haltung'), ton };
        namenlos++; continue;
      }
      const mitte = mittel(mit.map(s => Float64Array.from(texte[s.id].emb)));

      /* Kandidaten: Woerter aus einem Fuenftel der Gruppe aufwaerts. */
      /* NUR SUBSTANTIVE. Caspar_D, 28.08.2026: "okay, nur Substantive".
         Im Deutschen sind sie am grossen Anfangsbuchstaben zu erkennen -
         das ersetzt jede Stoppwortliste, denn "Schon", "Doch" und
         "Vielleicht" sind keine.

         Der Haken: In Liedtexten faengt fast jede ZEILE gross an. Ein
         Wort zaehlt deshalb nur, wenn es NICHT am Zeilenanfang steht -
         dort ist die Grossschreibung ohne Aussage. Ein Substantiv, das
         nur je einmal am Zeilenanfang vorkommt, geht dabei verloren;
         das ist der Preis, und er ist klein. */
      const zaehl = {};
      for (const s of mit) {
        const l = (katalog.songs[s.id] || {}).lyrics; if (!l) continue;
        const drin = new Set();
        for (const zeile of nurGesungenes(l).split('\n')) {
          const w = zeile.match(/[A-Za-zÄÖÜäöüß]{4,}/g) || [];
          /* Das erste Wort der Zeile ueberspringen. */
          for (let i = 1; i < w.length; i++)
            if (/^[A-ZÄÖÜ]/.test(w[i])) drin.add(w[i]);
        }
        for (const w of drin) zaehl[w] = (zaehl[w] || 0) + 1;
      }
      const schwelle = Math.max(3, Math.ceil(mit.length * MINDEST_ANTEIL));
      const kand = Object.entries(zaehl).filter(([, n]) => n >= schwelle).map(([w]) => w);

      const bewertet = [];
      for (const w of kand) {
        const v = await e.einbetten(w);
        bewertet.push([w, cos(v, mitte) - cos(v, gesamt)]);
      }
      bewertet.sort((a, b) => b[1] - a[1]);
      const beste = bewertet.slice(0, WORTE_JE_NAME);

      if (!beste.length || beste[0][1] < MINDEST_KONTRAST) {
        /* Kein kennzeichnendes Substantiv - dann die Achsen. NIEMALS
           die Klangetiketten: Caspar_D, 28.08.2026: "im Geschichtenraum
           sind immer noch die Mehrzahl der Cluster mit Musikbegriffen
           beschriftet". Genre und Stimmung beschreiben den Ton; in
           diesem Raum haben sie nichts zu suchen. */
        const stoff = mittelAchse(mit, 'stoff'), ton = mittelAchse(mit, 'ton');
        g.name = stoff ? stoff + (ton ? ' — ' + ton : '') : 'ohne erkennbares Thema';
        g.themen = null; g.kontrast = beste.length ? +beste[0][1].toFixed(3) : null;
        namenlos++;
      } else {
        g.themen = beste.map(([w]) => w);
        g.name = g.themen.join(' · ');
        g.kontrast = +beste[0][1].toFixed(3);
        benannt++;
      }
      /* Die Achsen der Gruppe stehen immer dabei - sie sind die
         Einordnung, auch wenn die Woerter schon einen Namen ergeben. */
      g.achsen = { stoff: mittelAchse(mit, 'stoff'), haltung: mittelAchse(mit, 'haltung'), ton: mittelAchse(mit, 'ton') };
    }

    function mittelAchse(mit, achse) {
      const summe = {};
      for (const s of mit) for (const [n, w] of (s.gesch || {})[achse] || []) summe[n] = (summe[n] || 0) + w;
      const best = Object.entries(summe).sort((a, b) => b[1] - a[1])[0];
      return best ? best[0] : null;
    }

    fs.writeFileSync(pfad, JSON.stringify(karte));
    console.log(`  ${datei}: ${benannt} Gruppen benannt, ${namenlos} über die Achsen`);
    for (const g of karte.gruppen.slice(0, 6))
      console.log(`     ${String(g.anzahl).padStart(3)}  ${g.name}`
        + (g.achsen && g.achsen.stoff ? `   [${g.achsen.stoff} · ${g.achsen.haltung} · ${g.achsen.ton}]` : ''));
  }
})();
