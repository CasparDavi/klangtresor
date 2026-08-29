#!/usr/bin/env node
/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   DIE TEXT-ACHSEN DES GESCHICHTEN-RAUMS
   bin/geschichten-achsen.js  ·  läuft NACH bin/karte.js --raum geschichten
   (bis 29.08.2026: bin/geschichten-namen.js)

   Schreibt je Song die drei Text-Achsen in library/karte-geschichten.json:

     stoff    wovon das Lied handelt (Liebe, Maschine, Tod, ...)
     haltung  wie gesprochen wird (Bekenntnis, Anrede, Erzählung, ...)
     ton      in welchem Ton (zärtlich, trotzig, ironisch, ...)

   Zero-Shot: die Kategorien sind als ganze SÄTZE eingebettet, nicht als
   Einzelwörter - "Liebe" allein ist ein schwaches Signal, ein Satz
   ähnelt dem, was in den Texten steht. Je Song gilt Nähe minus Sockel.

   Genre, Stimmung und Instrumente beschreiben den KLANG; im
   Geschichten-Raum stehen stattdessen diese Achsen (Caspar_D,
   28.08.2026: "genres, instrumente in Geschichten müssten was völlig
   anderes sein - nämlich Geschichten-Genres").

   Klassische Gedichtgattungen - Ballade, Sonett, Elegie - fehlen mit
   Absicht: Sie hängen an Versmaß, Strophenbau und Reim, und das sieht
   ein Bedeutungsmodell nicht.

   -------------------------------------------------------------
   DER NAMENSTEIL IST GELÖSCHT.

   Bis zum 29.08.2026 vergab dieses Skript auch die Gruppennamen, über
   den Wort-Kontrast gegen den Gesamtschwerpunkt. Die Namen entstehen
   seitdem direkt in bin/karte.js über die ORTSBEGRIFFE
   (bin/ortsbegriffe.js): dieselbe Sockel-Idee, aber mit Belegpflicht
   und Zufalls-Schwelle - gemessen in docs/GESCHICHTEN-RAUM-EICHKASTEN.md
   ("Opfermut · Urgewalt" statt "Gesellschaft — pathetisch"). Zwei
   Namensgeber, die einander überschreiben, wären eine Falle; darum ist
   der alte Weg nicht abgeschaltet, sondern weg. Der Lied-Raum ist
   ebenfalls gestrichen (Caspar_D, 29.08.2026: "den kombinierten Raum
   machen wir nicht wieder auf").
   ============================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { einbetterLaden } = require('./texte-einbetten.js');

const WURZEL = path.join(__dirname, '..');
const LIB    = path.join(WURZEL, 'library');
const MODELL = path.join(LIB, 'modelle', 'paraphrase-multilingual-mpnet.onnx');
const TOKEN  = path.join(LIB, 'modelle', 'paraphrase-multilingual-mpnet-tokenizer.json');

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

(async () => {
  /* Fehlende Voraussetzung = Schritt ueberspringen (Exit 0), damit der
     Wartungslauf weiterkommt - gleiches Muster wie bin/geschichten.js. */
  for (const [d, was] of [[MODELL, 'Modell'], [TOKEN, 'Tokenizer']])
    if (!fs.existsSync(d)) { console.log(`  Achsen: ${was} fehlt — Schritt übersprungen. Holen: node bin/modelle-holen.js`); process.exit(0); }
  const gesch = path.join(LIB, 'geschichten.json');
  if (!fs.existsSync(gesch)) { console.error('  library/geschichten.json fehlt — erst node bin/geschichten.js'); process.exit(1); }
  const pfad = path.join(LIB, 'karte-geschichten.json');
  if (!fs.existsSync(pfad)) { console.log('  Achsen: library/karte-geschichten.json fehlt (Raum beiseitegelegt?) — nichts zu tun.'); process.exit(0); }

  const texte = JSON.parse(fs.readFileSync(gesch, 'utf8')).songs;
  const e = await einbetterLaden(MODELL, TOKEN);

  /* Die Achsenbegriffe einmal einbetten - sie gelten für alle Songs. */
  const achsVek = {};
  for (const [achse, begriffe] of Object.entries(ACHSEN)) {
    achsVek[achse] = [];
    for (const [name, satz] of Object.entries(begriffe))
      achsVek[achse].push([name, await e.einbetten(satz)]);
  }
  console.log('  Achsen eingebettet: ' + Object.entries(ACHSEN).map(([a, b]) => `${a} (${Object.keys(b).length})`).join(', '));

  const karte = JSON.parse(fs.readFileSync(pfad, 'utf8'));

  /* DER SOCKEL. Manche Kategoriensätze liegen einfach näher an
     Liedtexten als andere - das sagt über das einzelne Lied nichts,
     entscheidet aber jeden Größtvergleich. Ohne Abzug bekamen 227 von
     257 Liedern (88 %) die Haltung "Anklage", zwei der sieben
     Kategorien wurden nie gewählt - die Achse trug null Information.
     Mit Abzug: alle Kategorien belegt.

     UND ER WIRD EINGEFROREN. Der Sockel mittelt über die Lieder des
     Bestands und wandert deshalb mit ihm - gemessen um bis zu 30
     Milli-Kosinus von 100 auf 257 Lieder, das Sechsfache dessen, was
     die Zuordnung trennt. Dadurch wechselten Lieder ihr Etikett,
     obwohl sich an ihnen nichts geändert hatte. Einmal berechnet und
     abgelegt bleibt er stehen. Wer ihn neu bilden will, löscht
     library/achsen-sockel.json - das benennt dann möglicherweise alte
     Lieder um; deshalb steht das Datum mit drin. */
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

  /* Achsen je Song ... */
  let dran = 0;
  for (const s of karte.songs) {
    const t = texte[s.id]; if (!t) continue;
    const v = Float64Array.from(t.emb);
    s.gesch = {};
    for (const [achse, liste] of Object.entries(achsVek))
      s.gesch[achse] = liste.map(([n, w]) => [n, +(cos(v, w) - ((sockel[achse] || {})[n] || 0)).toFixed(3)])
                            .sort((a, b) => b[1] - a[1]).slice(0, 3);
    dran++;
  }

  /* ... und je Gruppe die häufigste Kategorie als Einordnung. Der NAME
     der Gruppe bleibt unangetastet - er kommt aus bin/karte.js. */
  const mittelAchse = (mit, achse) => {
    const summe = {};
    for (const s of mit) for (const [n, w] of (s.gesch || {})[achse] || []) summe[n] = (summe[n] || 0) + w;
    const best = Object.entries(summe).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : null;
  };
  for (const g of karte.gruppen) {
    const mit = karte.songs.filter(s => s.gruppe === g.nr && texte[s.id]);
    g.achsen = { stoff: mittelAchse(mit, 'stoff'), haltung: mittelAchse(mit, 'haltung'), ton: mittelAchse(mit, 'ton') };
  }

  fs.writeFileSync(pfad, JSON.stringify(karte));
  console.log(`  karte-geschichten.json: Achsen für ${dran} Songs, Einordnung für ${karte.gruppen.length} Gruppen`);
  for (const g of karte.gruppen.slice(0, 6))
    console.log(`     ${String(g.anzahl).padStart(3)}  ${g.name}`
      + (g.achsen && g.achsen.stoff ? `   [${g.achsen.stoff} · ${g.achsen.haltung} · ${g.achsen.ton}]` : ''));
})();
