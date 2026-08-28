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

/* Wie gut muss das beste Wort sein, damit die Gruppe danach heisst?
   Frueher stand hier eine feste Zahl (0,05 Kontrast). Die war heimlich
   eine GROESSENSCHWELLE, keine Gueteschwelle: gemessen am Bestand
   korreliert der Kontrastwert mit r = -0,93 gegen die logarithmierte
   Gruppengroesse, weil der Schwerpunkt einer grossen Gruppe zwangslaeufig
   nahe der Gesamtmitte liegt. Die Folge war genau verkehrt herum - eine
   Gruppe mit 11 Liedern bekam einen Namen (z = 0,43, das schlechteste
   Wort im ganzen Bestand), die mit 144 Liedern nicht (z = 2,42, das
   drittbeste). 187 von 257 Liedern verloren so ihren Wortnamen.

   Gemessen wird deshalb, wie weit das beste Wort aus dem Feld ALLER
   Kandidatenwoerter aller Gruppen herausragt - in Streuungen, also
   groessenunabhaengig. Wie weit das sein muss, steht auch nicht hier:
   es wird je Lauf gegen Zufallsgruppen gemessen, siehe unten. */
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

  /* DIE KONDENSATE, wenn es sie gibt: zehn Substantive je Lied, von
     einem Sprachmodell aus dem Text destilliert (bin/kondensat-prompt.js,
     Regeln in docs/KONDENSAT-REGELN.md). Sie sind als Kandidaten fuer
     Gruppennamen ungleich besser als Rohtextwoerter - dort steht kein
     Fuellwort und keine Reimfloskel mehr drin. Gemessen an einer Probe
     ergeben sie ausserdem ausgewogenere Gruppen (groesste Gruppe 33 %
     statt 60 %), und genau daran hing die Benennung: der Schwerpunkt
     einer 144-Lieder-Gruppe IST die Gesamtmitte, ihr Kontrast wird
     negativ, und kein Schwellenwert rettet das.
     Fehlen sie, laeuft alles wie zuvor ueber den Rohtext. */
  let kondensate = null;
  const kondPfad = path.join(LIB, 'kondensate', 'kondensate.json');
  if (fs.existsSync(kondPfad)) {
    const A = JSON.parse(fs.readFileSync(kondPfad, 'utf8'));
    /* Die juengste vollstaendige Fassung gewinnt: erst opus-f2-gesamt,
       dann opus. */
    const reihe = ['opus-f2-gesamt', 'opus', 'opus-gesamt'];
    kondensate = {};
    for (const [id, e] of Object.entries(A.lieder || {})) {
      const m = reihe.find(k => e.modelle && e.modelle[k]);
      if (m) kondensate[id] = e.modelle[m];
    }
    const n = Object.keys(kondensate).length;
    console.log(`  Kondensate: ${n} Lieder mit zehn Substantiven`);
    if (!n) kondensate = null;
  }
  const kondensatVon = (id) => (kondensate && kondensate[id]) || null;
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
    /* DER SOCKEL. Manche Kategoriensaetze liegen einfach naeher an
       Liedtexten als andere - das sagt ueber das einzelne Lied nichts,
       entscheidet aber jeden Groesstvergleich. Ohne Abzug bekamen 227
       von 257 Liedern (88 %) die Haltung "Anklage", zwei der sieben
       Kategorien wurden nie gewaehlt, und in karte-geschichten.json
       stand bei ALLEN zwoelf Gruppen haltung: "Anklage" - die Achse trug
       buchstaeblich null Information. Mit Abzug: Beschwoerung 56,
       Spott 49, Bekenntnis 44, Anrede 30, Erzaehlung 30, Beobachtung 27,
       Anklage 21, keine Kategorie leer.

       Caspar_D hat beide Spalten an zwanzig Liedern verglichen, die er
       kennt (28.08.2026): "schwierig zu beurteilen, auch die zweite
       spalte liegt oft daneben, aber sie ist besser."

       UND ER WIRD EINGEFROREN. Der Sockel mittelt ueber die Lieder des
       Bestands und wandert deshalb mit ihm - gemessen um bis zu 30
       Milli-Kosinus von 100 auf 257 Lieder, das Sechsfache dessen, was
       die Zuordnung trennt. Dadurch wechselten Lieder ihr Etikett,
       obwohl sich an ihnen nichts geaendert hatte. Einmal berechnet und
       abgelegt bleibt er stehen: die Bewegung ist dann exakt null, die
       Guete praktisch gleich (benannt 88 % gegen 87 %).

       Wer ihn neu bilden will, loescht library/achsen-sockel.json. Das
       benennt dann moeglicherweise alte Lieder um - deshalb steht das
       Datum mit drin. */
    const sockelPfad = path.join(LIB, 'achsen-sockel.json');
    let sockel = null;
    if (fs.existsSync(sockelPfad)) {
      const d = JSON.parse(fs.readFileSync(sockelPfad, 'utf8'));
      sockel = d.sockel;
      console.log(`  Sockel vom ${d.stand} (${d.lieder} Lieder), eingefroren`);
    } else {
      sockel = {};
      const mitText = karte.songs.filter(s => texte[s.id]);
      for (const [achse, liste] of Object.entries(achsVek)) {
        sockel[achse] = {};
        for (const [n, w] of liste) {
          let su = 0;
          for (const s of mitText) su += cos(Float64Array.from(texte[s.id].emb), w);
          sockel[achse][n] = +(su / (mitText.length || 1)).toFixed(5);
        }
      }
      fs.writeFileSync(sockelPfad, JSON.stringify(
        { stand: new Date().toISOString().slice(0, 10), lieder: mitText.length,
          wozu: 'Grundniveau je Kategorie. Eingefroren, damit alte Lieder ihr Etikett behalten, wenn neue dazukommen.',
          sockel }, null, 1));
      console.log(`  Sockel neu gebildet aus ${mitText.length} Liedern -> library/achsen-sockel.json`);
    }

    for (const s of karte.songs) {
      const t = texte[s.id]; if (!t) continue;
      const v = Float64Array.from(t.emb);
      s.gesch = {};
      for (const [achse, liste] of Object.entries(achsVek))
        s.gesch[achse] = liste.map(([n, w]) => [n, +(cos(v, w) - ((sockel[achse] || {})[n] || 0)).toFixed(3)])
                              .sort((a, b) => b[1] - a[1]).slice(0, 3);
    }

    /* ---- 2. Gruppennamen nach Kontrast ---------------------------- */
    const alleV = karte.songs.filter(s => texte[s.id]).map(s => Float64Array.from(texte[s.id].emb));
    const gesamt = mittel(alleV);
    let benannt = 0, namenlos = 0;
    const alleWerte = [];   /* alle Kandidatenwerte aller Gruppen, fuer den z-Wert unten */
    const wortVek = new Map();   /* Wort -> Vektor, einmal einbetten reicht */

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
        const drin = kondensatVon(s.id);
        if (drin) { for (const w of drin) zaehl[w] = (zaehl[w] || 0) + 1; continue; }
        /* Kein Kondensat - dann wie frueher aus dem Rohtext. Deutsche
           Substantive sind am grossen Anfangsbuchstaben zu erkennen; das
           erste Wort der Zeile zaehlt nicht, weil dort jedes Wort gross
           anfaengt. */
        const l = (katalog.songs[s.id] || {}).lyrics; if (!l) continue;
        const roh = new Set();
        for (const zeile of nurGesungenes(l).split('\n')) {
          const w = zeile.match(/[A-Za-zÄÖÜäöüß]{4,}/g) || [];
          for (let i = 1; i < w.length; i++)
            if (/^[A-ZÄÖÜ]/.test(w[i])) roh.add(w[i]);
        }
        for (const w of roh) zaehl[w] = (zaehl[w] || 0) + 1;
      }
      /* Aus dem Kondensat kommen je Lied nur zehn Woerter statt hunderter
         Rohtextwoerter - ein Wort in einem Fuenftel der Gruppe ist dort
         viel mehr wert. Deshalb reicht ein Zehntel, mindestens aber drei
         Lieder. */
      const ausKondensat = mit.some(s => kondensatVon(s.id));
      const anteil = ausKondensat ? MINDEST_ANTEIL / 2 : MINDEST_ANTEIL;
      const schwelle = Math.max(3, Math.ceil(mit.length * anteil));
      const kand = Object.entries(zaehl).filter(([, n]) => n >= schwelle).map(([w]) => w);

      const bewertet = [];
      for (const w of kand) {
        let v = wortVek.get(w);
        if (!v) { v = await e.einbetten(w); wortVek.set(w, v); }
        bewertet.push([w, cos(v, mitte) - cos(v, gesamt)]);
      }
      bewertet.sort((a, b) => b[1] - a[1]);
      /* Noch nicht entscheiden: ob ein Wert gut ist, zeigt sich erst im
         Vergleich mit den Kandidaten ALLER Gruppen. Der kommt unten. */
      g._kandidaten = bewertet;
      for (const [, wert] of bewertet) alleWerte.push(wert);

      /* Die Achsen der Gruppe stehen immer dabei - sie sind die
         Einordnung, auch wenn die Woerter schon einen Namen ergeben. */
      g.achsen = { stoff: mittelAchse(mit, 'stoff'), haltung: mittelAchse(mit, 'haltung'), ton: mittelAchse(mit, 'ton') };
      g._mit = mit;
    }

    /* ---- Jetzt erst benennen ---------------------------------------
       Der Bezugsvorrat ist das Feld ALLER Kandidatenwoerter aller
       Gruppen - nicht nur der eigenen. Sonst misst jede Gruppe an sich
       selbst, und die Schwelle waere wieder groessenabhaengig.

       Wie hoch muss der z-Wert sein? Auch das wird GEMESSEN: fuer jede
       Gruppe wird eine gleich grosse ZUFALLSGRUPPE gezogen, ihre Mitte
       gebildet und der Kontrast derselben Kandidatenwoerter dagegen
       gerechnet. Was dabei herauskommt, ist der Wert, den ein Wort ohne
       jeden Zusammenhang erreicht. Die Schwelle ist das 99-%-Quantil
       dieser Verteilung - in z umgerechnet, damit sie mit dem echten
       Wert vergleichbar bleibt. Feste Saat, damit die Namen bei gleichem
       Bestand gleich bleiben. */
    const mAlle = alleWerte.reduce((a, b) => a + b, 0) / (alleWerte.length || 1);
    const sAlle = Math.sqrt(alleWerte.reduce((a, b) => a + (b - mAlle) ** 2, 0) / (alleWerte.length || 1)) || 1e-9;

    let saat = 20260828;
    const wuerfel = () => ((saat = (saat * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const zufall = [];
    for (let r = 0; r < 60; r++) {
      for (const g of karte.gruppen) {
        if (!g._kandidaten || !g._kandidaten.length || !g._mit) continue;
        const zieh = [];
        for (let i = 0; i < g._mit.length; i++) zieh.push(alleV[Math.floor(wuerfel() * alleV.length)]);
        const zufallsMitte = mittel(zieh);
        for (const [w] of g._kandidaten.slice(0, WORTE_JE_NAME)) {
          const v = wortVek.get(w);
          if (v) zufall.push(cos(v, zufallsMitte) - cos(v, gesamt));
        }
      }
    }
    zufall.sort((a, b) => a - b);
    const bodenWert = zufall.length ? zufall[Math.floor(zufall.length * 0.99)] : 0;
    const MINDEST_Z = (bodenWert - mAlle) / sAlle;
    console.log(`     Schwelle: Kontrast ${bodenWert.toFixed(3)} (z = ${MINDEST_Z.toFixed(2)}) `
      + `= 99-%-Quantil gegen gleich grosse Zufallsgruppen`);

    for (const g of karte.gruppen) {
      const bewertet = g._kandidaten, mit = g._mit;
      delete g._kandidaten; delete g._mit;
      if (!bewertet) continue;                     /* zu kleine Gruppen, schon oben benannt */
      const beste = bewertet.slice(0, WORTE_JE_NAME);
      const z = beste.length ? (beste[0][1] - mAlle) / sAlle : -Infinity;

      if (z < MINDEST_Z) {
        /* Kein kennzeichnendes Substantiv - dann die Achsen. NIEMALS
           die Klangetiketten: Caspar_D, 28.08.2026: "im Geschichtenraum
           sind immer noch die Mehrzahl der Cluster mit Musikbegriffen
           beschriftet". Genre und Stimmung beschreiben den Ton; in
           diesem Raum haben sie nichts zu suchen. */
        const stoff = mittelAchse(mit, 'stoff'), ton = mittelAchse(mit, 'ton');
        g.name = stoff ? stoff + (ton ? ' — ' + ton : '') : 'ohne erkennbares Thema';
        g.themen = null;
        g.kontrast = beste.length ? +beste[0][1].toFixed(3) : null;
        g.guete = beste.length ? +z.toFixed(2) : null;
        namenlos++;
      } else {
        g.themen = beste.map(([w]) => w);
        g.name = g.themen.join(' · ');
        g.kontrast = +beste[0][1].toFixed(3);
        g.guete = +z.toFixed(2);
        benannt++;
      }
    }

    function mittelAchse(mit, achse) {
      const summe = {};
      for (const s of mit) for (const [n, w] of (s.gesch || {})[achse] || []) summe[n] = (summe[n] || 0) + w;
      const best = Object.entries(summe).sort((a, b) => b[1] - a[1])[0];
      return best ? best[0] : null;
    }

    /* ---- Doppelte Namen aufloesen ----------------------------------
       Zwei Gruppen, die beide "Liebe — zärtlich" heissen, sind in der
       Legende nicht auseinanderzuhalten. Wo der Achsenname doppelt
       vorkommt, kommt die HALTUNG dazu - sie unterscheidet die beiden
       Gruppen ja gerade (die eine spricht ein Du an, die andere
       beschwoert). Hilft auch das nicht, entscheidet die Groesse. */
    const wieOft = {};
    for (const g of karte.gruppen) wieOft[g.name] = (wieOft[g.name] || 0) + 1;
    for (const g of karte.gruppen) {
      if (wieOft[g.name] < 2 || g.themen) continue;      /* Wortnamen sind schon eindeutig */
      const h = g.achsen && g.achsen.haltung;
      if (h && !g.name.includes(h)) g.name += ' · ' + h;
    }
    const nochmal = {};
    for (const g of karte.gruppen) nochmal[g.name] = (nochmal[g.name] || 0) + 1;
    for (const g of karte.gruppen) {
      if (nochmal[g.name] < 2) continue;
      const n = karte.songs.filter(s => s.gruppe === g.nr).length;
      g.name += ` (${n})`;
    }

    fs.writeFileSync(pfad, JSON.stringify(karte));
    console.log(`  ${datei}: ${benannt} Gruppen benannt, ${namenlos} über die Achsen`);
    for (const g of karte.gruppen.slice(0, 6))
      console.log(`     ${String(g.anzahl).padStart(3)}  ${g.name}`
        + (g.achsen && g.achsen.stoff ? `   [${g.achsen.stoff} · ${g.achsen.haltung} · ${g.achsen.ton}]` : ''));
  }
})();
