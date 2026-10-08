/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   DIE DATEN DES VOLLEN BLATTS (Skizzenbuch, 08.10.2026, Übergabe §89) zur Laufzeit. Im Entwurf kamen sie aus einer einmal aus
   dem Archiv gerechneten Datei; blattDatenHolen() rechnet dasselbe aus den Schnittstellen, Feld für Feld in derselben Form - damit läuft das Blatt mit jedem Archiv, nicht nur mit dem, für das die Datei
   gerechnet wurde (Hausregel: fremde Suno-Bestände laufen ohne Handarbeit durch).
   QUELLEN: katalogInfo (/api/index: profil, spielzeit, zeitraum, eingefroren) und songVonId (die eigenen Titel, schlanke Felder)
   liegen im Browser schon bereit. Nachgeholt werden /api/klang (Genre, Stimmung, Instrumente je Titel), /api/community (wer wie
   viel geschrieben hat) und /api/song/<id> (Liedtext, Hüllkurve, Schläge, Abschnitte, Zählerverlauf). Ein Titel wiegt dort rund
   450 KB, deshalb sparsam: der Steckbrief-Titel und höchstens LIED_GRENZE Titel für die Fragmente, je Titel nur der Auszug gemerkt.
   Die KARTE (/api/karte) taugt hier nicht, obwohl sie dieselben Etiketten nennt: Sie trägt je Titel nur die drei stärksten, schon
   übersetzt (Schlagzeug statt drums) - das Mittel über alle Titel würde schief, und skizze-blatt.js übersetzt selbst (INSTR_DE,
   STIMMUNG_DE). bin/karte.js liest dieselbe library/klang.json, die /api/klang ausliefert; der Export auf den Stick nimmt sie mit.
   zeilen, song und karteDaten braucht es nicht: das Blatt beschreibt das Archiv, nicht den Ausschnitt im Schaum - deshalb läuft
   es im Personenschaum (zeilen sind Personen) genauso.
   GRUNDLAGE aller Künstlerblöcke sind die eigenen veröffentlichten Titel: nicht im Papierkorb, kein fremder, Handle = das des
   Kontos. Das Konto nennt das Profil, sonst die Fußnote des Sticks (eingefroren.handle), sonst das häufigste Handle der Titel.
   Im eingefrorenen Teilarchiv sind das nur die Titel, die mitkamen (der Server listet nur, was Ton hat) - das Blatt zeigt das
   Archiv, das da ist.
   LEER HEISST: Fehlt einem Abschnitt die Quelle, ist er null (profil, steckbrief, stunden, playsKurve) oder eine leere Liste
   (tabula, instrumente, stimmung, titelKurve, wuerdigung, fragmente); im Steckbrief sind unbekannte Zahlen null (bpm, takte) und
   unbekannte Reihen leer (welle, gipfel, refrain, verlauf, genre, stimmung, instrumente). Nichts davon wirft: ein Archiv ohne
   Profil, ohne Klangvermessung, ohne Gemeinschaft, mit weniger als fünf Titeln oder mit Titeln ohne Hüllkurve bekommt ein Blatt
   mit weniger Blöcken. Wird der Lauf abgebrochen (abgebrochen() wahr, etwa weil das Plakat neu gebaut wird), kommt null zurück.
   playsKurve bleibt null: Die Zählerstände je Tag stehen nur im vollen Titel (zaehlerVerlauf), die Summe über alle Titel hieße
   jeden eigenen Titel zu holen (254 × 450 KB bei Caspar_D) - für eine Kurve, die das Blatt nicht zeichnet. Braucht sie ein Block,
   gehört sie als Summe auf den Server, nicht in 254 Abrufe. */

const LIED_GRENZE = 16;          /* so viele Liedtexte holen die Fragmente höchstens */
const FRAGMENTE = 24;            /* so viele Zeilen für die Spiegelschrift - die Füller laufen sie im Kreis ab */
const WELLE_PUNKTE = 360;        /* die Hüllkurve des Steckbriefs: Maximum je Fenster, damit kein Gipfel verloren geht */

/* Der Vorrat gilt für einen Katalogstand: Kommt ein neuer Morgenlauf, beginnt er von vorn */
let vorrat = { stand: undefined, lieder: new Map(), klang: undefined, gemeinde: undefined };
const vorratFuer = (stand) => (vorrat.stand === stand ? vorrat : (vorrat = { stand, lieder: new Map(), klang: undefined, gemeinde: undefined }));

/* null = gibt es nicht (404), undefined = gerade nicht erreichbar (Netz, 5xx, kaputt) - nur „gibt es nicht" wird für den Katalogstand
   gemerkt, sonst fehlten Würdigung und Etiketten bis zum nächsten Katalog (Fallensuche 1.0.62) */
async function jsonHolen(adresse){
  try { const r = await fetch(adresse, { cache: 'no-store' }); if (r.status === 404) return null; if (!r.ok) return undefined; return await r.json(); } catch (e) { return undefined; }
}
const zahl = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const liste = (v) => (Array.isArray(v) ? v : []);
/* Etiketten aus der Klangvermessung: [[name, anteil], …] - was nicht so aussieht, fällt heraus */
const paare = (v) => liste(v).filter(e => Array.isArray(e) && typeof e[0] === 'string' && Number.isFinite(e[1]));
/* Ein Abschnitt, der an unerwarteten Daten scheitert, fehlt - das Blatt bleibt stehen, die Konsole sagt, welcher */
function sicher(name, bauen, leer){
  try { return bauen(); } catch (e) { console.warn(`Skizzenbuch-Daten: ${name} übersprungen`, e); return leer; }
}
/* Gesät statt zufällig: dasselbe Archiv gibt dieselben Fragmente (der Zahlengenerator des Entwurfs, Saat 7) */
function saat(z){ return () => (z = (Math.imul(z, 1103515245) + 12345) >>> 0) / 4294967296; }

/* Refrain: der erste mit [Chorus], [Refrain] oder [Hook] markierte Abschnitt der Original-Lyrics (Caspar_D: „was der refrain ist,
   kannst du aus der original lyrics ziehen"), Einwürfe in Klammern weg, höchstens vier Zeilen. plakat.js (refrainsHolen) nimmt
   diese Fassung. */
export function refrainAus(text){
  const out = []; let drin = false;
  for (const z of String(text || '').split(/\r?\n/)){
    const m = z.match(/^\s*\[([^\]]+)\]\s*$/);
    if (m){ if (drin && out.length) break; drin = /^\s*(chorus|refrain|hook)\b/i.test(m[1]); continue; }   /* nicht [Pre-Chorus], [Post-Chorus] */
    if (drin){ const t = z.replace(/\s*\([^)]*\)\s*/g, ' ').trim(); if (t) out.push(t); }
  }
  return out.slice(0, 4);
}
/* Zeilen, die als Fragment taugen: mindestens drei Wörter, kürzer als 44 Zeichen, keine [Abschnitts]-Marke (auch nicht mitten in
   der Zeile), Einwürfe weg */
const fragmentZeilen = (text) => [...new Set(String(text || '').split(/\r?\n/).map(x => x.replace(/\s*\([^)]*\)\s*/g, ' ').trim())
  .filter(x => x && !/[[\]]/.test(x) && x.split(/\s+/).length >= 3 && x.length < 44))];

/* Der Auszug eines vollen Titels - nur, was das Blatt braucht; der Rest (Wortzeiten, Rohdaten) fällt gleich wieder weg */
function liedAuszug(d){
  const w = liste(d && d.welle).map(x => Number(x) || 0);
  /* je Fenster das Maximum, und jedes Fenster sieht mindestens einen Punkt (kurze Titel haben weniger als WELLE_PUNKTE - leere Fenster
     ergaben 0, die Hüllkurve zerfiel in einen Kamm) */
  const n = w.length, welle = n ? Array.from({ length: WELLE_PUNKTE }, (_, i) => {
    const a = Math.min(n - 1, Math.floor(i * n / WELLE_PUNKTE)), b = Math.max(a + 1, Math.floor((i + 1) * n / WELLE_PUNKTE));
    let m = 0; for (let j = a; j < b && j < n; j++) m = Math.max(m, w[j]);
    return +m.toFixed(3); }) : [];
  /* Tempo: Median der Schlagabstände wie im Katalog (bin/katalog.js takt), hier gerundet; Takte = Schläge mit der Eins */
  const schl = liste(d && d.schlaege).filter(x => Array.isArray(x) && Number.isFinite(x[0]));
  const iv = schl.slice(1).map((x, i) => x[0] - schl[i][0]).sort((a, b) => a - b), med = iv[iv.length >> 1];
  const bpm = iv.length && med > 0 ? Math.round(60 / med) : null;
  return { lyrics: typeof (d && d.lyrics) === 'string' ? d.lyrics : '', welle, bpm, takte: schl.length ? schl.filter(x => x[1] === 1).length : null,
           gipfel: liste(d && d.abschnitte && d.abschnitte.peak_times).filter(Number.isFinite),
           verlauf: liste(d && d.zaehlerVerlauf).filter(z => z && z.stand).map(z => [z.stand, zahl(z.plays), zahl(z.likes)]) };
}
async function liedHolen(v, id){
  if (!v.lieder.has(id)){ const d = await jsonHolen('/api/song/' + encodeURIComponent(id)); if (d === undefined) return null; v.lieder.set(id, d ? sicher('Titel ' + id, () => liedAuszug(d), null) : null); }
  return v.lieder.get(id);
}
/* Vier zugleich: der Server antwortet aus dem Speicher, mehr bringt nichts außer Gedränge */
async function jeVier(ids, je){
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(4, ids.length) }, async () => { while (i < ids.length) await je(ids[i++]); }));
}
function kontoHandle(profil, eingefroren, alle){
  const h = (profil && profil.handle) || (eingefroren && eingefroren.handle);
  if (h) return String(h).toLowerCase();
  const n = new Map(); for (const s of alle){ const x = String((s && s.handle) || '').toLowerCase(); if (x) n.set(x, (n.get(x) || 0) + 1); }
  let best = null, bn = 0; for (const [x, c] of n) if (c > bn){ best = x; bn = c; }
  return best;
}
const ortsMonat = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Die Daten des vollen Blatts. songVonId: Map der eigenen Titel (schlanke Felder), katalogInfo: Kopf aus /api/index,
    melde(text): Zwischenstand für die Statuszeile, abgebrochen(): wahr, wenn der Lauf nicht mehr gebraucht wird.
    Gibt { profil, tabula, steckbrief, instrumente, stimmung, stunden, titelKurve, playsKurve, wuerdigung, fragmente } oder,
    bei Abbruch, null. */
export async function blattDatenHolen({ songVonId, katalogInfo, melde = () => {}, abgebrochen = () => false } = {}){
  const kat = katalogInfo || {}, p = kat.profil || null, ef = kat.eingefroren || null;
  const v = vorratFuer(kat.erstelltAm || null);
  const alle = songVonId instanceof Map ? [...songVonId.values()] : [];
  const handle = kontoHandle(p, ef, alle);
  const zeit = (s) => Date.parse(s && s.erstellt);
  /* Grundordnung nach Entstehung (bei Gleichstand nach id), damit jeder Gleichstand unten immer gleich ausgeht */
  const eigen = alle.filter(s => s && s.id && !s.fremd && s.veroeffentlicht && !s.imPapierkorb && (!handle || String(s.handle || '').toLowerCase() === handle))
    .sort((a, b) => (zeit(a) || 0) - (zeit(b) || 0) || String(a.id).localeCompare(String(b.id)));
  const n0 = (s, f) => Number(s[f]) || 0;

  const profil = sicher('Profil', () => {
    const st = (p && p.stats) || {}, name = (p && (p.display_name || p.handle)) || (ef && (ef.anzeigename || ef.handle)) || handle;
    if (!name) return null;
    /* Herzen und Abrufe nennt das Profil; ohne Profil (Stick ohne Kopf) die Summe über die eigenen Titel */
    const summe = (f) => eigen.reduce((a, s) => a + n0(s, f), 0);
    return { name, handle: (p && p.handle) || (ef && ef.handle) || handle || null, beschreibung: (p && p.profile_description) || '',
             herzen: zahl(st.upvote_count__sum) ?? summe('likes'), plays: zahl(st.play_count__sum) ?? summe('plays'),
             folger: zahl(st.followers_count), folgt: zahl(st.following_count), titel: eigen.length,
             spielzeit: zahl(kat.spielzeit), zeitraum: kat.zeitraum || null };
  }, null);

  /* Tabula: die fünf meistgehörten - bei Gleichstand die mit mehr Herzen */
  const tabula = sicher('Tabula', () => [...eigen].sort((a, b) => n0(b, 'plays') - n0(a, 'plays') || n0(b, 'likes') - n0(a, 'likes')).slice(0, 5)
    .map(s => ({ id: s.id, titel: s.titel || '', plays: n0(s, 'plays'), likes: n0(s, 'likes'), erstellt: s.erstellt || null })), []);

  /* Wann und wie oft: Stunden und Monate in Ortszeit - so, wie man die eigenen Abende erinnert (der Entwurf nahm den Monat aus
     der UTC-Zeit; bei Caspar_D ergibt beides dieselbe Kurve, an einer Monatsgrenze kurz vor Mitternacht nicht) */
  const stunden = sicher('Stunden', () => {
    const z = eigen.map(zeit).filter(Number.isFinite); if (!z.length) return null;
    const h = Array(24).fill(0); for (const t of z) h[new Date(t).getHours()]++; return h;
  }, null);
  const titelKurve = sicher('Titelkurve', () => {
    const m = new Map(); for (const t of eigen.map(zeit).filter(Number.isFinite)){ const k = ortsMonat(new Date(t)); m.set(k, (m.get(k) || 0) + 1); }
    /* jeder Monat vom ersten bis zum letzten, auch ohne Titel (laufende Summe) - sonst stimmte „N Titel in K Monaten" nicht und die
       Zeitachse lief gestaucht */
    const k = [...m.keys()].sort(); if (!k.length) return [];
    let [y, mo] = k[0].split('-').map(Number); const [ye, me] = k[k.length - 1].split('-').map(Number), aus = []; let sum = 0;
    while (y < ye || (y === ye && mo <= me)){ const key = `${y}-${String(mo).padStart(2, '0')}`; sum += m.get(key) || 0; aus.push([key, sum]); if (++mo > 12){ mo = 1; y++; } }
    return aus;
  }, []);
  if (abgebrochen()) return null;

  /* Steckbrief: der Titel mit dem größten Widerhall = Herzen + Kommentare, bei Gleichstand der meistgehörte */
  const best = [...eigen].sort((a, b) => (n0(b, 'likes') + n0(b, 'kommentare')) - (n0(a, 'likes') + n0(a, 'kommentare')) || n0(b, 'plays') - n0(a, 'plays'))[0];
  /* Drei Quellen zugleich, jede einmal je Katalogstand: die Klangvermessung (fehlt sie - 404, fremdes Archiv vor dem ersten
     Morgenlauf -, bleiben die Etiketten leer), die Gemeinschaft und der volle Steckbrief-Titel */
  melde('Das Blatt liest Klangvermessung und Gemeinschaft …');
  await Promise.all([
    eigen.length && v.klang === undefined && jsonHolen('/api/klang').then(k => { if (k !== undefined) v.klang = (k && k.songs) || null; }),
    v.gemeinde === undefined && jsonHolen('/api/community').then(g => { if (g !== undefined) v.gemeinde = g; }),
    best && liedHolen(v, best.id)]);
  if (abgebrochen()) return null;
  const klangVon = (id) => (v.klang && v.klang[id]) || null;
  /* Gemittelt über die vermessenen eigenen Titel; 'voice' ist kein Instrument, das man zeichnen könnte */
  const mittel = (feld) => {
    const m = new Map(); let n = 0;
    for (const s of eigen){ const k = klangVon(s.id); if (!k) continue; n++; for (const [x, w] of paare(k[feld])) m.set(x, (m.get(x) || 0) + w); }
    return n ? [...m].sort((a, b) => b[1] - a[1]).map(([x, w]) => [x, +(w / n).toFixed(3)]) : [];
  };
  const instrumente = sicher('Instrumente', () => mittel('instrumente').filter(x => x[0] !== 'voice').slice(0, 8), []);
  const stimmung = sicher('Stimmung', () => mittel('stimmung').slice(0, 8), []);
  const steckbrief = best ? sicher('Steckbrief', () => {
    const a = v.lieder.get(best.id) || liedAuszug(null), kb = klangVon(best.id) || {};
    return { id: best.id, titel: best.titel || '', erstellt: best.erstellt || null, dauer: zahl(best.dauer), plays: n0(best, 'plays'), likes: n0(best, 'likes'),
             kommentare: n0(best, 'kommentare'), modell: best.modell || null, bpm: a.bpm, takte: a.takte, gipfel: a.gipfel, welle: a.welle,
             refrain: refrainAus(a.lyrics), genre: paare(kb.genre).slice(0, 3), stimmung: paare(kb.stimmung).slice(0, 3),
             instrumente: paare(kb.instrumente).filter(x => x[0] !== 'voice').slice(0, 4), verlauf: a.verlauf };
  }, null) : null;

  /* Würdigung: die fünf mit den meisten Kommentarzeichen (Kommentare und Antworten, gezählt wie groupiePerson in index.html),
     das Konto selbst ausgenommen; avatar ist die Adresse aus /api/community (die lokale Kopie nennt schaumAvatarAdresse) */
  const wuerdigung = sicher('Würdigung', () => liste(v.gemeinde && v.gemeinde.leute)
    .filter(l => l && l.handle && String(l.handle).toLowerCase() !== handle)
    .map(l => ({ l, zeichen: [...liste(l.kommentare), ...liste(l.antworten)].reduce((s, e) => s + [...String((e && e.text) || '')].length, 0) }))
    .filter(x => x.zeichen > 0)
    .sort((a, b) => b.zeichen - a.zeichen || liste(b.l.kommentare).length - liste(a.l.kommentare).length || String(a.l.handle).localeCompare(String(b.l.handle)))
    .slice(0, 5)
    .map(({ l, zeichen }) => ({ handle: l.handle, name: l.name || l.handle, zeichen, kommentare: liste(l.kommentare).length, avatar: l.avatar || null })), []);

  /* Fragmente für die Spiegelschrift: aus den Liedtexten mehrerer Titel (gesät gemischt, nur Titel mit Text), je Titel erst eine
     Zeile, dann eine zweite, bis FRAGMENTE beisammen sind */
  const rnd = saat(7), kandidaten = eigen.filter(s => s.hatLyrics !== false).map(s => s.id);
  for (let i = kandidaten.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [kandidaten[i], kandidaten[j]] = [kandidaten[j], kandidaten[i]]; }
  const ids = kandidaten.slice(0, LIED_GRENZE);
  let geholt = 0;
  await jeVier(ids, async (id) => {
    if (abgebrochen()) return;
    await liedHolen(v, id);
    melde(`Das Blatt sammelt Liedzeilen (${++geholt} von ${ids.length}) …`);
  });
  if (abgebrochen()) return null;
  const fragmente = sicher('Fragmente', () => {
    const vorr = ids.map(id => fragmentZeilen(v.lieder.get(id) && v.lieder.get(id).lyrics)).filter(z => z.length), aus = [], da = new Set();
    for (let runde = 0; runde < 2 && aus.length < FRAGMENTE; runde++)
      for (const zl of vorr){
        const frei = zl.filter(z => !da.has(z)); if (!frei.length) continue;
        const z = frei[Math.floor(rnd() * frei.length)]; da.add(z); aus.push(z);
        if (aus.length >= FRAGMENTE) break;
      }
    return aus;
  }, []);
  return { profil, tabula, steckbrief, instrumente, stimmung, stunden, titelKurve, playsKurve: null, wuerdigung, fragmente };
}
