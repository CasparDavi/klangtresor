/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   DAS PLAKAT-STUDIO (Mural). Caspar_D, 06.10.2026: „angenommen, jemand möchte seine Songs als Mural
   exportieren … wie könnten wir sie unterstützen"; „am liebsten hätte ich gerne eine Preview mit
   Bedienpanel"; „ich will, dass es absolut toll wird". Entscheidungen in docs/NAECHSTER_CHAT.md §54.
   Stufe 1: Vorschau mit Bedienfeld, vier Vorlagen (Galerie, Papier, Bleiglas, Mosaik) mit Feinheiten,
   Titel auf Rauch- oder Milchglas unten in der Zelle, Kopf und Legende im breiteren unteren Rand
   (Museumsschild), Formate (Liste, Quadrat, frei), Lage, PDF ueber die PDF-Ausgabe des Browsers.
   Das Bild selbst baut das Haus (schaumSvgBauen mit druck): dieselben Zellen, Farben und Bilder wie am
   Schirm, im Plakat als Kacheln mit Luecken. Die Vorschau nimmt die Bilder aus dem Vorrat, das PDF die
   Originale (data-voll). Masse auf der Seite in Millimetern; 3 mm Beschnitt rundum. */
import { blockLage, blockReserve, ECKEN } from './eckblock.js';

const FORMATE = [
  { id: 'A3', name: 'A3', w: 297, h: 420 }, { id: 'A2', name: 'A2', w: 420, h: 594 },
  { id: 'A1', name: 'A1', w: 594, h: 841 }, { id: 'A0', name: 'A0', w: 841, h: 1189 },
  { id: '50x70', name: '50 × 70', w: 500, h: 700 }, { id: '70x100', name: '70 × 100', w: 700, h: 1000 },
  { id: '100x140', name: '100 × 140', w: 1000, h: 1400 },
  { id: 'q50', name: '50 × 50', w: 500, h: 500 }, { id: 'q70', name: '70 × 70', w: 700, h: 700 },
  { id: 'frei', name: 'frei' },
  /* Triptychon (angekreuzt): drei Rahmen nebeneinander, dazwischen eine Wandfuge von 6 % der Rahmenbreite. Der Schaum
     liegt ueber die ganze Breite, die Fugen schneiden durch ihn; das PDF hat drei Seiten, je Rahmen eine. */
  { id: 'tri50', name: '3 × 50 × 70', tri: true, pw: 500, ph: 700 }, { id: 'tri70', name: '3 × 70 × 100', tri: true, pw: 700, ph: 1000 },
  /* Bilder fuer soziale Medien (angekreuzt; „gerade der Groupieschaum als Danke an meine Groupies zum Posten"): kein
     Druck, sondern ein PNG mit 1080 Punkten Breite. Die Masse sind Seiteneinheiten wie beim Druck, nur das Verhaeltnis
     zaehlt; ohne Beschnitt. */
  { id: 'b45', name: 'Bild 4:5', w: 216, h: 270, bild: true }, { id: 'b11', name: 'Bild 1:1', w: 216, h: 216, bild: true },
  { id: 'b916', name: 'Story 9:16', w: 216, h: 384, bild: true },
];
/* Die Vorlagen (Caspar_D hat alle vier angekreuzt). Jede setzt alle Feinheiten; danach ist alles einzeln
   verstellbar. „Bleiglas": breite dunkle Fugen wie Bleiruten, starkes Licht, keine Glasbaender - die Titel
   stehen im Werkverzeichnis. */
const VORLAGEN = [
  { id: 'galerie', name: 'Galerie', zeile: 'schwarzer Grund · Rauchglas · Federstrich',
    e: { grund: '#0c0d10', titel: 'rauch', fugen: 1, wackeln: 0, schatten: 0, vignette: 0, kissen: true, feder: true, federMm: 0.3, rand: 0.07, verzeichnis: false, areale: true, edition: true, zeitleiste: false, schild: false, skizze: false } },
  { id: 'papier', name: 'Papier', zeile: 'warmes Weiß · Milchglas · leiser Schatten',
    e: { grund: '#f3efe6', titel: 'milch', fugen: 1.6, wackeln: 0.12, schatten: 0.35, vignette: 0, kissen: true, feder: true, federMm: 0.25, rand: 0.08, verzeichnis: false, areale: true, edition: true, zeitleiste: true, schild: false, skizze: false } },
  { id: 'bleiglas', name: 'Bleiglas', zeile: 'breite dunkle Fugen · starkes Licht',
    e: { grund: '#08090b', titel: 'ohne', fugen: 2.8, wackeln: 0, schatten: 0, vignette: 0.35, kissen: true, feder: false, federMm: 0.3, rand: 0.05, verzeichnis: true, areale: false, edition: false, zeitleiste: false, schild: false, skizze: false } },
  { id: 'mosaik', name: 'Mosaik', zeile: 'helle Fugen · Kacheln wackeln · Schatten',
    e: { grund: '#ece7dc', titel: 'milch', fugen: 2.2, wackeln: 0.7, schatten: 0.6, vignette: 0.15, kissen: true, feder: false, federMm: 0.3, rand: 0.07, verzeichnis: false, areale: false, edition: false, zeitleiste: true, schild: false, skizze: false } },
];
/* RANDLOS (1.0.57; Caspar_D: „ich hätte gern noch eine Randlose Variante mit einer fehlenden Ecke im gleichen Format wie das
   Biold, wo Titel, Legende, Avatar und Name drin stehen"): der Schaum reicht bis an den Beschnitt, kein Passepartout, kein
   Museumsschild, keine Arealnamen am Rand. Seit 1.0.58 ist die Ecke der Grund der Seite; darin Avatar, Legende und Text, bündig
   zur gewählten Ecke (eckeSetzen; Größe und Form sucht schild.js). */
VORLAGEN.push({ id: 'randlos', name: 'Randlos', zeile: 'Schaum bis zum Rand · Avatar und Titel in der Ecke',
  e: { grund: '#0c0d10', titel: 'rauch', fugen: 1, wackeln: 0, schatten: 0, vignette: 0, kissen: true, feder: false, federMm: 0.3, rand: 0, verzeichnis: false, areale: false, edition: true, zeitleiste: false, schild: true, skizze: false, randVorne: 15, umschlag: 0 } });
/* SKIZZENBUCH (1.0.61; Caspar_D: „ich hab eher an ein neues Layout a la Leonardo da Vinci oder sowas gedacht" – „im Ansatz sieht das
   super aus" – „ja, wir nehmen das bessere modell"): eine Seite aus einem Skizzenbuch - der Schaum als Kreisstudie mit Konstruktion,
   die Kacheln als Federzeichnungen in der Tinte ihres Areals (Haus: skizzeZelle), Titel in Pinyon Script, Randnotizen zu den großen
   Zellen am Kreisrand, die Refrains der drei Titel mit den meisten Herzen (oder der neuesten), die Zeitleiste als Bogen, Kopf in
   Handschrift mit einer Zeile in Spiegelschrift, die Legende als Notiz, ein Wachssiegel mit dem Avatar. Pergament als Grund. */
VORLAGEN.push({ id: 'skizze', name: 'Skizzenbuch', zeile: 'Federzeichnung auf Pergament, à la Leonardo',
  e: { grund: '#eee2c6', titel: 'rauch', fugen: 1, wackeln: 0, schatten: 0, vignette: 0, kissen: false, feder: false, federMm: 0.3, rand: 0, verzeichnis: false, areale: false, edition: true, zeitleiste: true, schild: false, skizze: true, refrains: 'herzen' } });
const BESCHNITT = 3;                                      /* mm rundum, ueber den Rand hinaus gedruckt */
const SPEICHER = 'mysuno-plakat';

let E = (() => { try { return JSON.parse(localStorage.getItem(SPEICHER)) || null; } catch (e) { return null; } })()
  || { vorlage: 'galerie', format: '70x100', freiW: 80, freiH: 120, lage: 'hoch', kopfTitel: '', kopfUnter: '', legende: true, ...VORLAGEN[0].e };
let studio = null, aktuell = null, legeLauf = 0, bauLauf = 0, warten = null;
const merken = () => { try { localStorage.setItem(SPEICHER, JSON.stringify(E)); } catch (e) {} };
const el = (id) => document.getElementById(id);
const esc2 = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Relative Leuchtdichte; daraus die Schriftfarbe auf dem Grund. */
function leuchte(hex){
  const k = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
}
const hellerGrund = () => leuchte(E.grund) > 0.35;
const schrift = () => hellerGrund() ? '#16171a' : '#f1efe9';
const schriftLeise = () => hellerGrund() ? '#5c5f66' : '#a3a9b1';

/* Wie gross das Werkverzeichnis wird: n Eintraege (geschaetzt mit ein paar Arealkoepfen) in Spalten ueber die
   ganze Breite. Die Schrift so gross wie moeglich (bis 0,45 % der kurzen Seite, auf 70 × 100 gut 3 mm), so klein
   wie noetig (bis 1,5 mm, aus der Naehe lesbar), damit der Block hoechstens ein Sechstel der Hoehe nimmt. Eine
   Spalte ist 15 Schriftgroessen breit: Nummer, Titel, Abstand. */
function verzeichnisMass(n, breite, kurz, hoeheMax, koepfe = 6, kleinst = Math.max(1.5, 0.0026 * kurz), strecken = null){
  /* je Areal ein Kopf und ein Rest („und N weitere"), je Spalte eine Zeile Reserve (ein Kopf rueckt nie allein an den Fuss) */
  const zeilenZahl = n + 2 * koepfe, kopf = 2.4;
  /* strecken (Triptychon): die freien Stuecke der Breite als [Anfang, Laenge] - jede Spalte steht ganz auf einer Tafel, keine
     ueber einer Wandfuge (Wiedervorlage §77). xs/bs: Lage und Breite jeder Spalte ab dem linken Rand der Liste. */
  const mass = (L) => {
    const stuecke = strecken || [[0, breite]], xs = [], bs = [];
    for (const [a, len] of stuecke){ const k = Math.floor((len + L) / (15 * L)); for (let i = 0; i < k; i++){ xs.push(a + i * (len + L) / k); bs.push((len + L) / k); } }
    if (!xs.length){ xs.push(0); bs.push(breite + L); }
    const spalten = xs.length, proSpalte = Math.ceil(zeilenZahl / spalten) + 1;
    return { L, spalteB: Math.min(...bs), xs, bs, spalten, proSpalte, hoehe: (proSpalte * 1.38 + kopf) * L }; };
  const gross = 0.0045 * kurz, klein = Math.min(gross, kleinst);
  for (let L = gross; L >= klein; L -= 0.05){ const m = mass(L); if (m.hoehe <= hoeheMax) return m; }
  return mass(klein);
}
/* Seite: Format, Lage, Raender (unten breiter - die optische Mitte, dort steht das Museumsschild). */
function geometrie(n = 0){
  const f = FORMATE.find(x => x.id === E.format) || FORMATE[5];
  let w = f.id === 'frei' ? Math.max(100, Math.min(3000, E.freiW * 10)) : f.w, h = f.id === 'frei' ? Math.max(100, Math.min(3000, E.freiH * 10)) : f.h;
  if ((E.lage === 'quer') !== (w > h) && w !== h) [w, h] = [h, w];
  let kurz = Math.min(w, h), tri = null;
  if (f.tri){ let pw = f.pw, ph = f.ph; if (E.lage === 'quer') [pw, ph] = [ph, pw];
    const fuge = Math.round(0.06 * pw); tri = { pw, ph, fuge }; w = 3 * pw + 2 * fuge; h = ph; kurz = Math.min(pw, ph); }   /* Schrift wie auf einem Rahmen */
  const rand = E.rand * kurz;
  const T = 0.026 * kurz, U = 0.0105 * kurz, L = 0.0098 * kurz;
  /* randlos: die Karte ist die ganze Seite samt Beschnitt. MIT RAND (1.0.60, Caspar_D: „kann man bei randlos doch einen Rand
     einfügen, der aber einen Farbverlauf trägt entsprechend der Areale" – „die breite will ich einstellen können" – „dann kann man
     ihn ggf sogar umschlagen, wenn man das bild irgendwo aufzieht" – „und was mach ich, wenn ich beides will"): zwei Regler, je 0 =
     aus. „Rand vorne" liegt innerhalb des Formats (der Schaum rückt nach innen), „Umschlag" kommt außen dazu (Tiefe des Keilrahmens
     plus Tackerzugabe; das Druckformat wächst, vorne bleibt das gewählte Format). Nicht im Triptychon (jede Tafel bräuchte ihren
     eigenen Rand), Umschlag nicht bei Bildformaten (keine Kante zum Umschlagen). */
  /* Skizzenbuch: der Schaum ist ein Kreis; die Karte ist das Quadrat um ihn. Hochformat: Mitte bei 47 % der Höhe (oben Kopf und
     Refrains, unten Zeitleiste, Legende, Siegel), Radius 37 % der Breite, höchstens 33 % der Höhe; quer: 36 % der Höhe, mittig. */
  if (E.skizze){
    /* Triptychon: das Skizzenbuch ist eine Seite - die Tafel (vorher wurde aus 3 × 50 × 70 eine Seite von 156 cm) */
    if (tri){ w = tri.pw; h = tri.ph; kurz = Math.min(w, h); tri = null; }
    /* Hochformat (h ≥ 1,2 w): oben 144 mm für Kopf und Refrains, unten 184 mm für Zeitleiste, Refrain, Rätsel, Legende und Siegel
       (auf 50 × 70, mit der kurzen Seite skaliert); quer und quadratisch: Kreis mittig (33 % der Höhe), alles Übrige in den Seitenrändern */
    const ff = kurz / 500, hoch = h >= 1.2 * w;
    const RR = hoch ? Math.min(0.372 * w, (h - 328 * ff) / 2) : 0.33 * h, CX = BESCHNITT + w / 2, CY = BESCHNITT + (hoch ? 144 * ff + RR : 0.53 * h);
    return { w, h, PW: w + 2 * BESCHNITT, PH: h + 2 * BESCHNITT, kurz, rand: 0, unten: 0, T, U, L, karte: { x: CX - RR, y: CY - RR, w: 2 * RR, h: 2 * RR },
      kreis: { cx: CX, cy: CY, r: RR, hoch }, skizze: true, schildH: 0, verz: null, zeitH: 0, tri: null, name: f.id === 'frei' ? `${E.freiW}x${E.freiH}` : f.name.replace(/\s/g, '') };
  }
  if (E.schild){
    /* Rand vorne höchstens so breit, dass die Karte 40 % der kurzen Seite behält (freies Format ab 10 cm, Regler bis 6 cm:
       sonst Karte ≤ 0 und ein unbrauchbares Seitenverhältnis - Fallensuche 1.0.60) */
    const randV = tri ? 0 : Math.min(Math.max(0, E.randVorne ?? 15), 0.3 * Math.min(w, h)), umschlag = tri || f.bild ? 0 : Math.max(0, +E.umschlag || 0);
    const PW = w + 2 * umschlag + 2 * BESCHNITT, PH = h + 2 * umschlag + 2 * BESCHNITT, tiefe = BESCHNITT + umschlag + randV;
    /* nur Umschlag: der Schaum reicht 2 mm über die Falz, darunter liegt die Farbe - ein schief aufgezogenes Bild zeigt keinen Streifen */
    const karte = !(randV || umschlag) ? { x: 0, y: 0, w: PW, h: PH } : randV ? { x: tiefe, y: tiefe, w: PW - 2 * tiefe, h: PH - 2 * tiefe }
      : { x: tiefe - 2, y: tiefe - 2, w: PW - 2 * tiefe + 4, h: PH - 2 * tiefe + 4 };
    return { w, h, PW, PH, kurz, rand: 0, unten: 0, T, U, L, karte, vorne: { x: BESCHNITT + umschlag, y: BESCHNITT + umschlag, w, h },
      randKante: randV || umschlag ? { tiefe, randV, umschlag, luecke: randV > 0 } : null,
      schildH: 0, verz: null, zeitH: 0, tri, schild: true, name: (f.id === 'frei' ? `${E.freiW}x${E.freiH}` : f.name.replace(/\s/g, '')) + (umschlag ? `+${umschlag / 10}cm` : '') };
  }
  const schildH = T * 1.25 + U * 1.8 + (E.legende ? L * 0.6 : 0);
  /* So viele Arealkoepfe, wie die Legende des Schaums Zeilen hat - vorher pauschal sechs, das liess unter der Liste Platz frei */
  const listeStrecken = (x0, breite, fug) => fug.length ? freieStrecken(x0, x0 + breite, fug).map(([a, b]) => [a - x0, b - a]) : null;
  const verz = E.verzeichnis && n ? verzeichnisMass(n, w - 2 * rand, kurz, h / 6, legendenEintraege().length || 6, undefined,
    listeStrecken(BESCHNITT + rand, w - 2 * rand, tri ? [1, 2].map(j => { const fx = BESCHNITT + j * tri.pw + (j - 1) * tri.fuge; return [fx, fx + tri.fuge]; }) : [])) : null;
  /* Zeitleiste (nur Klangschaum - Personen haben kein Erscheinungsdatum): ein Band zwischen Karte und Schild */
  const zeitH = E.zeitleiste && raumJetzt !== 'groupies' ? 0.032 * kurz : 0;
  /* der Federstrich rueckt alles darunter um seinen Abstand (0,011 der kurzen Seite) - der Rand muss ihn mitrechnen,
     sonst rutschte der Fuss des Schilds Richtung Beschnitt */
  const feder = E.feder ? 0.011 * kurz : 0;
  const unten = Math.max(rand * 1.55, feder + rand * 0.5 + zeitH + schildH + (verz ? rand * 0.4 + verz.hoehe : 0) + rand * 0.45);
  const karte = { x: BESCHNITT + rand, y: BESCHNITT + rand, w: w - 2 * rand, h: h - rand - unten };
  return { w, h, PW: w + 2 * BESCHNITT, PH: h + 2 * BESCHNITT, kurz, rand, unten, T, U, L, karte, schildH, verz, zeitH, tri, name: f.id === 'frei' ? `${E.freiW}x${E.freiH}` : f.name.replace(/\s/g, '') };
}

/* Was gerade im Schaum steht - derselbe Auftrag im Seitenverhaeltnis der Karte. */
async function auftrag(verh){
  if (raumJetzt === 'groupies'){
    const m = GROUPIE_MASSE.find(x => x.id === groupieMass) || GROUPIE_MASSE[0], gl = groupieGl();
    return { j: await groupieAuftrag(m, verh, gl), art: 'person', m, gl };
  }
  const masse = schaumMasse(), m = masse.find(x => x.id === schaumMass) || masse[0];
  const glieder = schaumGliederungen(), gl = glieder.find(x => x.id === schaumGliederung) || glieder[0];
  return { j: schaumKlangAuftrag(m, gl, schaumZoom, verh), art: 'titel', m, gl };
}
/* Skizzenbuch: der Auftrag mit dem Kreis als Umriss (die Engine legt in jedes gegen den Uhrzeigersinn laufende Polygon) und den
   Startpunkten des Klangraums aus dem Quadrat in die Scheibe gebracht (elliptische Abbildung: die Anordnung bleibt, nichts liegt
   außerhalb des Kreises - ein Startpunkt draußen ließe die Engine alle verwerfen). */
function kreisAuftrag(j){
  const W = j.W, H = j.H, cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 0.5, n = 180;
  const outline = Array.from({ length: n }, (_, i) => { const a = 2 * Math.PI * i / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
  let seeds = null;
  if (j.seeds){ seeds = {}; for (const [k, p] of Object.entries(j.seeds)){ const u = Math.max(-1, Math.min(1, (p[0] - cx) / (W / 2))), v = Math.max(-1, Math.min(1, (p[1] - cy) / (H / 2)));
    seeds[k] = [cx + 0.94 * r * u * Math.sqrt(1 - v * v / 2), cy + 0.94 * r * v * Math.sqrt(1 - u * u / 2)]; } }
  return { ...j, outline, seeds, lage: j.lage + '|kreis' };
}
/* DIE ECKE (Randlos, 1.0.58). Caspar_D: „die schildecke wird nicht gezeichnet, sie ist der normale Hintergrund; daraus wird oben der
   Avatar in rundem Beschnitt wie in Suno gezeigt; darunter unten- und rechtsbündig Text: <Avatarname>s / Klangschaum / <Datum> /
   nnn Titel / Laufzeit" – „ich nehm die Farblegende mit rein" – „vielleicht definierbar machen in welcher ecke man das gerne hätte"
   – „meinst du nicht, das man die reihenfolge invertieren sollte, wenn die Ecke oben ist, vielleicht nicht exakt invers?".
   Der Block: unten der Avatar innen, dann die Legende, der Text an der Ecke; oben die Gruppen umgedreht, die Zeilen bleiben in
   Lesereihenfolge. Bündig zur Seite der Ecke (links/rechts). Abstand zum Schnitt 4 %, Luft zur Wand 2,5 % der kurzen Seite (im
   Triptychon einer Tafel); Avatar 12 %. */
const eckeJetzt = () => ECKEN.includes(E.ecke) ? E.ecke : 'ur';
/* Gibt es den Avatar? /avatar liefert 404, solange keiner geladen ist. Beim Öffnen des Studios wird eigens nachgesehen (avatarPruefen)
   - das Kopfbild der Seite blendet sich nach einem 404 aus und lädt nie neu, ein später geholter Avatar fehlte sonst bis zum Neuladen. */
let avatarStand = null;
async function avatarPruefen(){ try { const r = await fetch('/avatar', { cache: 'no-store' }); avatarStand = r.ok; } catch (e) { avatarStand = false; } }
function avatarDa(){ if (avatarStand != null) return avatarStand; const i = document.getElementById('ichbild'); return !!i && i.style.display !== 'none' && !(i.complete && !i.naturalWidth); }
/* Die Teile von oben nach unten, in Millimetern der Seite. Die Systemschrift wird klein gesetzt breiter (1.0.57: die Vorschau lief
   im Glasfeld ueber). Fuer die Suche und den Lage-Schluessel wird darum fest bei 6 px gemessen, der breitesten Stufe (darunter
   gleich breit) - vorher bei der Breite der Vorschau, und die hing am Fenster: Oeffnen, Formatwechsel oder Fenstergroesse legten
   den Schaum ungefragt neu (Fallensuche 1.0.58). Das Setzen misst in der echten Vorschaugroesse (pxJeMm). */
function eckTeile(g, pxJeMm = null){
  const T = g.T, U = g.U, L = g.L;
  const breite = (t, fw, fs) => messen(t, fw, Math.min(fs, pxJeMm ? fs * pxJeMm * 25.4 / 96 : 6 * 25.4 / 96)) * fs;
  const zeile = (t, fs, fw, rolle) => ({ typ: 'zeile', t, fs, fw, rolle, w: breite(t, fw, fs), h: fs * 1.32 });
  const text = [];
  if (E.schildName) text.push(zeile(E.schildName, U * 1.25, 500, 'name'));
  if (E.kopfTitel) text.push(zeile(E.kopfTitel, T, 600, 'titel'));
  for (const t of String(E.kopfUnter || '').split('/').map(x => x.trim()).filter(Boolean)) text.push(zeile(t, U, 400, 'unter'));
  /* Edition: nur die Auflage und der Strich zum Signieren - Datum und Name stehen schon darueber */
  if (E.edition){ const t = E.auflage || '1/1', fs = U * 0.85, tw = breite(t, 400, fs), linie = 0.07 * g.kurz;
    text.push({ typ: 'signatur', t, fs, tw, linie, w: tw + fs * 0.8 + linie, h: U * 2.6 }); }
  const leg = E.legende ? legendenEintraege().map(e => ({ typ: 'legende', t: e.name, farbe: e.farbe, fs: L, w: breite(e.name, 400, L) + L * 1.2, h: L * 1.55 })) : [];
  const av = avatarDa() ? [{ typ: 'kreis', d: 0.12 * g.kurz }] : [];
  const gruppen = (eckeJetzt()[0] === 'u' ? [av, leg, text] : [text, leg, av]).filter(x => x.length);
  return gruppen.flatMap((x, i) => i ? [{ typ: 'luecke', h: U * 1.1 }, ...x] : x);
}
/* Fuer den Auftrag (Worker) und fuers Setzen: Block, Rahmen (Schnitt + Abstand) und Luft in Schaum-Einheiten (y nach oben), im
   Triptychon die Grenze der aeusseren Tafel. runden: Breiten fuer die Suche auf 3 % der Breite aufgerundet - sonst legte jeder
   Buchstabe im Titelfeld den Schaum neu; gesetzt wird ungerundet. */
function schildVorgabe(g, W, H, runden = true, pxJeMm = null){
  const kv = g.karte, k = Math.min(kv.w / W, kv.h / H), ox = kv.x + (kv.w - W * k) / 2, oy = kv.y + (kv.h - H * k) / 2;
  /* Abstand von der Vorderseite (bei Umschlag die Falz), mit Rand vorne von dessen Innenkante - Avatar und Text nie auf dem Rand */
  const vo = g.vorne || { x: BESCHNITT, y: BESCHNITT, w: g.w, h: g.h }, randV = g.randKante ? g.randKante.randV : 0;
  const ecke = eckeJetzt(), abstand = (randV ? 0.03 : 0.04) * g.kurz + randV, xu = (x) => (x - ox) / k, yu = (y) => H - (y - oy) / k;
  const rahmen = { x0: xu(vo.x + abstand), x1: xu(vo.x + vo.w - abstand), y0: yu(vo.y + vo.h - abstand), y1: yu(vo.y + abstand) };
  const teile = eckTeile(g, pxJeMm), q = 0.03 * W;
  const block = teile.map(t => t.typ === 'kreis' ? { typ: 'kreis', d: t.d / k } : t.typ === 'luecke' ? { typ: 'luecke', h: t.h / k }
    : { typ: t.typ, w: runden ? Math.ceil(t.w / k / q) * q : t.w / k, h: t.h / k });
  let xMin = 0, xMax = W;
  if (g.tri){ const f = wandFugen(g); if (ecke[1] === 'r') xMin = xu(f[1][1]); else xMax = xu(f[0][0]); }
  const luft = 0.025 * g.kurz / k;
  /* der Rahmen samt Luft muss im Schaum liegen: reicht der Schaum nicht bis an den Schnitt (gerundetes Seitenverhältnis), lag er
     sonst draußen, und die Suche fand nie Platz (3 × 70 × 100 quer, Fallensuche 1.0.58) */
  rahmen.x0 = Math.max(rahmen.x0, luft + 0.5); rahmen.x1 = Math.min(rahmen.x1, W - luft - 0.5);
  rahmen.y0 = Math.max(rahmen.y0, luft + 0.5); rahmen.y1 = Math.min(rahmen.y1, H - luft - 0.5);
  const schluessel = [ecke, block.map(t => t.typ[0] + Math.round(t.d || t.w || 0) + 'x' + Math.round((t.h || 0) * 10)).join(','),
    ['x0', 'x1', 'y0', 'y1'].map(z => Math.round(rahmen[z])).join(','), Math.round(xMin), Math.round(xMax), Math.round(luft * 10)].join(':');
  return { ecke, block, rahmen, luft, xMin, xMax, schluessel, teile, k, ox, oy };
}
/* Setzen: dieselbe Lage, die der Worker geprueft hat (blockLage), auf dem Grund der Seite. Passt der Block nicht mehr (Text nach
   dem Legen verlaengert, grosser Schaum anders gelegt), wird er so weit verkleinert, dass er passt - der naechste Lauf legt neu. */
function eckeSetzen(g, fg, leise){
  const res = aktuell.res, H = res.height, pxJeMm = ((el('ps-blatt') || {}).clientWidth || 800) / g.PW;
  const v = schildVorgabe(g, res.width, H, false, pxJeMm), { k, ox, oy } = v;
  const knoten = (res.nodes || []).find(n => n.depth === 0 && n.name === SCHILD_NAME && n.outline);
  const r = knoten ? blockReserve(knoten.outline, v.block, v.ecke, v.rahmen, v.luft) : 0;
  /* passt der Block nicht (mehr), wird er genau so weit verkleinert, dass er passt; unter 0,3 wird er nicht gesetzt, ein Hinweis
     sagt warum - vorher stand er mit mindestens 0,5 über den Zellen (Fallensuche 1.0.58) */
  if (r < 0.3){ standSetzen('Avatar und Text passen nicht in die Ecke – Titel oder Zeilen kürzen, Legende ausschalten oder eine andere Ecke wählen.'); return ''; }
  const s = Math.min(1, r), rechts = v.ecke[1] === 'r', anker = rechts ? 'end' : 'start';
  const X = (x) => ox + x * k, Y = (y) => oy + (H - y) * k, f2 = (n) => n.toFixed(2), hell = hellerGrund();
  let out = '';
  blockLage(v.block, v.ecke, v.rahmen, s).forEach((t, i) => {
    const q = v.teile[i], fs = (q.fs || 0) * s, x = rechts ? X(t.x1) : X(t.x0), basis = Y(t.y0) - fs * 0.3;
    if (q.typ === 'kreis'){
      const rr = (t.x1 - t.x0) / 2 * k, cx = X((t.x0 + t.x1) / 2), cy = Y((t.y0 + t.y1) / 2);
      /* rund wie bei Suno; auf hellem Grund das Schwarz des Avatars zu Anthrazit aufgehellt, auf dunklem ein duenner heller Ring
         (Caspar_D: „Avatar im dünnem Kreis rundherum auf schwarzem grund" – „auf weissem Grund vieleicht den Avatar nicht
         tiefschwarz sonder Anthrazit") */
      out += `<clipPath id="ps-eckav"><circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(rr)}"/></clipPath>`
        + (hell ? '<filter id="ps-anthrazit" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="linear" slope="0.8" intercept="0.2"/><feFuncG type="linear" slope="0.8" intercept="0.2"/><feFuncB type="linear" slope="0.8" intercept="0.21"/></feComponentTransfer></filter>' : '')
        + `<image href="/avatar" data-voll="/avatar" x="${f2(cx - rr)}" y="${f2(cy - rr)}" width="${f2(2 * rr)}" height="${f2(2 * rr)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#ps-eckav)"${hell ? ' filter="url(#ps-anthrazit)"' : ''}/>`
        + (hell ? '' : `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(rr)}" fill="none" stroke="${fg}" stroke-opacity="0.45" stroke-width="${f2(g.kurz / 1400)}"/>`);
    } else if (q.typ === 'legende'){
      const pu = fs * 0.34, dx = rechts ? x - pu : x + pu, tx = rechts ? x - 2 * pu - fs * 0.45 : x + 2 * pu + fs * 0.45;
      out += `<circle cx="${f2(dx)}" cy="${f2(basis - fs * 0.32)}" r="${f2(pu)}" fill="${q.farbe}"/>`
        + `<text x="${f2(tx)}" y="${f2(basis)}" font-size="${f2(fs)}" fill="${fg}" fill-opacity="0.8" text-anchor="${anker}">${esc2(q.t)}</text>`;
    } else if (q.typ === 'signatur'){
      const tw = q.tw * s, l = q.linie * s, gap = fs * 0.8, l0 = rechts ? x - tw - gap - l : x + tw + gap;
      out += `<text x="${f2(x)}" y="${f2(basis)}" font-size="${f2(fs)}" fill="${leise}" text-anchor="${anker}">${esc2(q.t)}</text>`
        + `<line x1="${f2(l0)}" y1="${f2(basis + fs * 0.15)}" x2="${f2(l0 + l)}" y2="${f2(basis + fs * 0.15)}" stroke="${fg}" stroke-opacity="0.7" stroke-width="${f2(g.kurz / 2800)}"/>`;
    } else if (q.typ === 'zeile'){
      const farbe = q.rolle === 'unter' ? leise : fg, deck = q.rolle === 'name' ? ' fill-opacity="0.85"' : '';
      out += `<text class="ps-ecke" x="${f2(x)}" y="${f2(basis)}" font-size="${f2(fs)}" font-weight="${q.fw}" fill="${farbe}"${deck} text-anchor="${anker}">${esc2(q.t)}</text>`;
    }
  });
  return out;
}
/* DER RAND (1.0.60): Farbe je mm des Umlaufs aus dem Areal, das dort an den Schaum stößt. An der Ecke mit Avatar und Text läuft er
   als Hauch weiter - weiße Kreide/Farbe mit sehr geringer Deckung auf dunklem Grund, ein schwacher dunkler Hauch auf hellem (Caspar_D:
   „sollte man bei der Ecke nicht ein wenig mit weiss einen Rahmen andeuten, sehr geringe Deckung natürlich, sonst wirkt das wie ein
   schwarzes Loch"); die Deckung ist der vierte Wert der Farbe. Gemalt wird in einem Worker (rand-worker.js, Malweisen in rand.js), in der Vorschau
   grob, fürs PDF fein (8 Punkte je mm, rund 200 dpi). Die vier Streifen liegen unter dem Schaum. */
const WEISEN_HELL = [['nass', 'Nass in Nass'], ['flecken', 'Flecken und Blüten'], ['alles', 'Alles zusammen']];
const WEISEN_DUNKEL = [['pastell', 'Pastellkreide'], ['verwischt', 'Kreide verwischt'], ['trocken', 'Gouache, trockener Pinsel']];
const weiseHell = () => WEISEN_HELL.some(w => w[0] === E.weiseHell) ? E.weiseHell : 'nass';
const weiseDunkel = () => WEISEN_DUNKEL.some(w => w[0] === E.weiseDunkel) ? E.weiseDunkel : 'pastell';
const textHash = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++){ h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const farbWert = (() => { let c = null; return (f) => { if (!f) return null; c = c || document.createElement('canvas').getContext('2d');
  c.fillStyle = '#000'; c.fillStyle = f; const v = c.fillStyle; if (v[0] === '#') return [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16));
  const m = v.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : null; }; })();
function imUmriss(p, o){ let c = false; for (let i = 0, j = o.length - 1; i < o.length; j = i++){ const a = o[i], b = o[j];
  if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
/* Die Farbe je Areal so, wie das Plakat es zeichnet (areale aus schaumSvgBauen, in bauen gemerkt): gezoomt die Farbe der Zellen,
   „ohne …" wie seine Zellen - farbeVon allein kannte nur die oberen Gruppen, gezoomt blieb der Rand farblos (Fallensuche 1.0.60) */
let randArealFarben = new Map();
function randFarben(g, res, farbeVon){
  const hauch = hellerGrund() ? [40, 40, 44, 0.1] : [255, 255, 255, 0.12];
  const farbeNach = (name) => farbWert(randArealFarben.get(name) || (farbeVon && farbeVon(name)) || null);
  const kv = g.karte, W = res.width, H = res.height, k = Math.min(kv.w / W, kv.h / H), ox = kv.x + (kv.w - W * k) / 2, oy = kv.y + (kv.h - H * k) / 2;
  const knoten = (res.nodes || []).filter(n => n.depth === 0 && n.outline && n.outline.length > 2).map(n => { const xs = n.outline.map(p => p[0]), ys = n.outline.map(p => p[1]);
    return { o: n.outline, farbe: n.name === SCHILD_NAME ? hauch : farbeNach(n.name), b: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] }; });
  const L = Math.round(2 * (g.PW + g.PH)), farben = new Array(L).fill(null);
  const fx0 = Math.max(kv.x, ox) + 1.5, fx1 = Math.min(kv.x + kv.w, ox + W * k) - 1.5, fy0 = Math.max(kv.y, oy) + 1.5, fy1 = Math.min(kv.y + kv.h, oy + H * k) - 1.5;
  for (let s = 0; s < L; s++){
    let t = s + 0.5, x, y;
    if (t < g.PW){ x = t; y = 0; } else if ((t -= g.PW) < g.PH){ x = g.PW; y = t; } else if ((t -= g.PH) < g.PW){ x = g.PW - t; y = g.PH; } else { t -= g.PW; x = 0; y = g.PH - t; }
    const u = (Math.min(fx1, Math.max(fx0, x)) - ox) / k, v = H - (Math.min(fy1, Math.max(fy0, y)) - oy) / k;   /* die Kante auf den Schaum geklemmt */
    const q = knoten.find(q => u >= q.b[0] && u <= q.b[2] && v >= q.b[1] && v <= q.b[3] && imUmriss([u, v], q.o));
    farben[s] = q ? q.farbe : null;
  }
  return farben;
}
function randAuftrag(g, farbeVon, pxJeMm){
  const rk = g.randKante;
  return { PW: g.PW, PH: g.PH, tiefe: rk.tiefe, luecke: rk.luecke, farben: randFarben(g, aktuell.res, farbeVon), grund: farbWert(E.grund) || [12, 13, 16],
           weise: hellerGrund() ? weiseHell() : weiseDunkel(), saat: textHash(aktuell.j.lage) % 1000003, pxJeMm };
}
/* Zwei Worker: einer für die Vorschau (ein neuer Auftrag beendet den laufenden - nur der neueste zählt), einer fürs PDF und das
   Bild (läuft ungestört zu Ende). Vorher teilten sich beide einen, überholte Vorschauen stauten sich (Fallensuche 1.0.60). */
const randLaeufer = {};
function randRechnen(auftrag, melde, art = 'druck'){
  const l = randLaeufer[art] || (randLaeufer[art] = { worker: null, nr: 0, warte: new Map() });
  if (art === 'vorschau' && l.worker && l.warte.size){ l.worker.terminate(); for (const w of l.warte.values()) w.nein(new Error('überholt')); l.warte.clear(); l.worker = null; }
  if (!l.worker){ const wk = l.worker = new Worker(new URL('./rand-worker.js', import.meta.url), { type: 'module' });
    wk.onmessage = (ev) => { const d = ev.data, w = l.warte.get(d.id); if (!w) return;
      if (d.fortschritt != null && !d.streifen){ if (w.melde) w.melde(d.fortschritt); return; }
      l.warte.delete(d.id); if (d.fehler) w.nein(new Error(d.fehler)); else w.ok(d.streifen.filter(x => x.blob)); };   /* leere Streifen (blob null) fallen weg */
    wk.onerror = (ev) => { for (const w of l.warte.values()) w.nein(new Error(ev.message || 'Rand')); l.warte.clear(); if (l.worker === wk) l.worker = null; }; }
  const id = ++l.nr, wk = l.worker;
  return new Promise((ok, nein) => { l.warte.set(id, { ok, nein, melde }); wk.postMessage({ id, auftrag, teile: ['oben', 'rechts', 'unten', 'links'] }); });
}
const randBilder = (streifen, adressen) => streifen.map((x, i) => `<image class="ps-rand" href="${adressen[i]}" x="${x.x.toFixed(2)}" y="${x.y.toFixed(2)}" width="${x.w.toFixed(2)}" height="${x.h.toFixed(2)}" preserveAspectRatio="none"/>`).join('');
const randVorrat = new Map(), randLaeuft = new Map(); let randAngezeigt = null;
/* Vorschau: grob (bis 3 Punkte je mm), gemerkt nach Auftrag (zuletzt benutzt bleibt, der angezeigte wird nie verdrängt); derselbe
   Auftrag zweimal wartet auf denselben Lauf; erscheint, sobald gemalt, unter dem Schaum */
async function randSetzen(g, la, lauf){
  const blatt = el('ps-blatt'), px = Math.min(3, Math.max(1, (blatt.clientWidth || 800) * (window.devicePixelRatio || 1) / g.PW));
  const a = randAuftrag(g, la && la.farbeVon, Math.round(px * 2) / 2);
  const schl = [a.PW, a.PH, a.tiefe, a.luecke, a.weise, a.grund.join(','), a.saat, a.pxJeMm, textHash(JSON.stringify(a.farben))].join('|');
  let fertig = randVorrat.get(schl);
  if (fertig){ randVorrat.delete(schl); randVorrat.set(schl, fertig); }
  else {
    let p = randLaeuft.get(schl);
    if (!p){ p = randRechnen(a, null, 'vorschau').then(st => ({ st, url: st.map(x => URL.createObjectURL(x.blob)) })); randLaeuft.set(schl, p);
      p.then(() => randLaeuft.delete(schl), () => randLaeuft.delete(schl)); }
    try { fertig = await p; } catch (e){ if (!/überholt/.test(e.message)) console.log('Plakat, Rand:', e); return; }
    if (randVorrat.has(schl)){ fertig.url.forEach(u => URL.revokeObjectURL(u)); fertig = randVorrat.get(schl); }
    else { randVorrat.set(schl, fertig);
      for (const [k0, alt] of randVorrat){ if (randVorrat.size <= 6) break; if (k0 === randAngezeigt || k0 === schl) continue; randVorrat.delete(k0); alt.url.forEach(u => URL.revokeObjectURL(u)); } }
  }
  if (lauf !== bauLauf) return;
  const ziel = blatt.querySelector('svg.ps-seite g.ps-randbild'); if (ziel){ ziel.innerHTML = randBilder(fertig.st, fertig.url); randAngezeigt = schl; }
}
let druckRandAdressen = [];

/* === SKIZZENBUCH: Federzeichnungen, Refrains, Seite ========================================================================= */
const SKIZZE_SEPIA = '#4a3423', SKIZZE_SCHRIFT = "'Pinyon Script', cursive";
/* Maße von Pinyon Script, im Browser gemessen (08.10.2026): x-Höhe 0,334 em, Oberkante „l" 0,779 em, Unterlänge „g" 0,384 em */
const SKIZZE_MASS = { x: 0.334, l: 0.779, unter: 0.384 };
const schriftGeladen = () => (document.fonts && document.fonts.load ? document.fonts.load("20px 'Pinyon Script'").catch(() => null) : Promise.resolve());
/* Die Federzeichnungen (bin/feder.js, auf dem Server): fehlen welche, stößt die Seite den Lauf an und wartet - wie bei den Gesichtern
   wird nichts in minderer Qualität gezeichnet; fehlt das Modell (kein Netz beim ersten Mal), kommen schraffierte Kacheln und ein
   Hinweis. Ergebnis: id -> { url, tinte }. */
let federAnstoss = null;
async function federBereit(zeilen, melde, abgebrochen = () => false){
  const holen = async () => { try { const r = await fetch('/api/feder', { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch (e) { return null; } };
  const karte = (d) => new Map(Object.entries((d && d.bilder) || {}).filter(([, b]) => b && !b.unlesbar).map(([id, b]) => [id, { url: '/media/' + id + '/feder.png?f=' + (Date.parse(b.gerechnet) || 1), tinte: +b.tinte || 0 }]));
  let d = await holen(); if (!d) return { karte: new Map(), hinweis: 'Die Federzeichnungen gibt es erst mit dem neuen Server – bitte KlangTresor neu starten.' };
  /* Maßgeblich ist der Stand des SERVERS (d.offen nach den Regeln von feder.js: fehlend, veraltet, neues Cover, neue Schriftmaske,
     neues Modell; Titel ohne Bild zählen nicht) - die Seite zählte vorher selbst nur fehlende Einträge: Veraltetes blieb für immer,
     Titel ohne Bild stießen bei jedem Neubau einen Lauf an (Fallensuche 1.0.61). Ein vergeblicher Versuch ist nur ein Federlauf, der
     „modelle" meldete - dann nicht erneut, der Morgenlauf holt das Modell. */
  const vergeblich = () => { const v = d.lauf && d.lauf.letzte && d.lauf.letzte.feder; return !!(v && v.fehler === 'modelle') && d.modell === false; };
  /* höchstens ein Anstoß je Stand: ist seit dem letzten Anstoß ein Federlauf zu Ende gegangen und dieselbe Zahl blieb offen (ffmpeg
     fehlt, Platte voll, onnxruntime lädt nicht), nicht bei jeder Reglerbewegung neu anstoßen (zweite Fallensuche 1.0.61) */
  const v0 = d.lauf && d.lauf.letzte && d.lauf.letzte.feder, steckt = federAnstoss && federAnstoss.offen === d.offen && v0 && v0.fertigAm > federAnstoss.zeit;
  let hinweis = steckt ? `${d.offen} Federzeichnungen ließen sich nicht rechnen – ein Neustart von KlangTresor oder der nächste Morgenlauf versucht es wieder.` : '';
  if (d.offen > 0 && !vergeblich() && !steckt){
    federAnstoss = { offen: d.offen, zeit: Date.now() };
    let antwort = null; try { antwort = await fetch('/api/bilder/vorbereiten?art=feder', { method: 'POST' }); } catch (e) {}
    if (antwort && (antwort.status === 405 || antwort.status === 403)) return { karte: karte(d), hinweis: 'Dieses Archiv ist nur zum Ansehen – neue Federzeichnungen entstehen im laufenden KlangTresor; was fehlt, ist schraffiert.' };
    const t0 = Date.now(); let gesehen = false;
    for (;;){
      await new Promise(ok => setTimeout(ok, 2000)); if (abgebrochen()) return { karte: karte(d), hinweis: '' };
      const neu = await holen(); if (!neu){ if (Date.now() - t0 > 30 * 60000) break; continue; }   /* kurzer Aussetzer: den letzten Stand behalten */
      d = neu; const l = d.lauf || {}, federLaeuft = l.laeuft && l.art === 'feder'; if (federLaeuft) gesehen = true;
      if (melde) melde(federLaeuft && l.schritt === 'feder' && l.von ? `Die Cover werden mit der Feder gezeichnet … ${l.n} von ${l.von}` : 'Die Federzeichnungen werden vorbereitet …');
      if (!(d.offen > 0) || (gesehen && !federLaeuft) || (!gesehen && !l.laeuft && Date.now() - t0 > 15000)) break;
      if (Date.now() - t0 > 30 * 60000){ hinweis = `Die Federzeichnungen laufen noch (${l.n || 0} von ${l.von || '?'}) – fehlende sind schraffiert; beim nächsten Öffnen geht es weiter.`; break; }
    }
  }
  if (!hinweis && d.offen > 0) hinweis = d.modell === false ? 'Das Modell für die Federzeichnungen ließ sich nicht laden (kein Netz?) – der nächste Morgenlauf holt es; bis dahin sind die Kacheln schraffiert.'
    : `${d.offen} Federzeichnungen fehlen noch – sie sind schraffiert; beim nächsten Öffnen geht es weiter.`;
  return { karte: karte(d), hinweis };
}
/* Refrain: der erste mit [Chorus], [Refrain] oder [Hook] markierte Abschnitt der Original-Lyrics (Caspar_D: „was der refrain ist,
   kannst du aus der original lyrics ziehen"), Einwürfe in Klammern weg, höchstens vier Zeilen. */
function refrainAus(text){
  const out = []; let drin = false;
  for (const z of String(text || '').split(/\r?\n/)){
    const m = z.match(/^\s*\[([^\]]+)\]\s*$/);
    if (m){ if (drin && out.length) break; drin = /^\s*(chorus|refrain|hook)\b/i.test(m[1]); continue; }   /* nicht [Pre-Chorus], [Post-Chorus] */
    if (drin){ const t = z.replace(/\s*\([^)]*\)\s*/g, ' ').trim(); if (t) out.push(t); }
  }
  return out.slice(0, 4);
}
const refrainVorrat = new Map();
async function refrainsHolen(zeilen, wie){
  if (wie === 'keine') return [];
  const songs = zeilen.map(z => (typeof song === 'function' && song(z.id)) || null).filter(x => x && x.id && !x.fremd);
  songs.sort(wie === 'neueste' ? (a, b) => (Date.parse(b.erstellt) || 0) - (Date.parse(a.erstellt) || 0) : (a, b) => (b.likes || 0) - (a.likes || 0));
  const aus = [];
  for (const so of songs.slice(0, 25)){
    if (!refrainVorrat.has(so.id)){ let r = []; try { const d = await (await fetch('/api/song/' + so.id)).json(); r = refrainAus(d && d.lyrics); } catch (e) {} refrainVorrat.set(so.id, r); }
    const r = refrainVorrat.get(so.id); if (r.length >= 2) aus.push({ titel: ohneKlammernTitel(so.titel || so.anzeigename || ''), herzen: so.likes || 0, datum: so.erstellt, refrain: r });
    if (aus.length === 3) break;
  }
  return aus;
}
const ohneKlammernTitel = (t) => String(t).replace(/\s*[([{][^)\]}]*[)\]}]\s*/g, ' ').trim();
const ZAHLWORT = ['', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
/* Der Grund: Pergament (Wolken, Fasern), zwei Flecken, Stockflecken, eine Faltlinie - und die Konstruktion um den Kreis */
function skizzeGrund(g){
  const f = g.kurz / 500, { cx, cy, r } = g.kreis, P = g.PW, H = g.PH, n2 = (v) => v.toFixed(2), kon = (o) => `stroke="${SKIZZE_SEPIA}" stroke-opacity="${o}" stroke-width="${n2(0.25 * f)}" fill="none"`;
  let s = `<defs><filter id="ps-pergament" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${n2(0.0084 / f * 100)}e-2" numOctaves="4" seed="3"/><feColorMatrix values="0 0 0 0 0.42  0 0 0 0 0.30  0 0 0 0 0.16  0 0 0 0.55 -0.12"/></filter>`
    + `<filter id="ps-faser" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.26 0.07" numOctaves="2" seed="8"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0 0.12  0 0 0 0.12 0"/></filter>`
    + `<filter id="ps-fleck"><feTurbulence type="fractalNoise" baseFrequency="${n2(0.07 / f)}" numOctaves="3" seed="12" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="${n2(10 * f)}"/></filter>`
    + `<radialGradient id="ps-altrand" cx="0.5" cy="0.48" r="0.75"><stop offset="0.62" stop-color="#5a3d1c" stop-opacity="0"/><stop offset="1" stop-color="#5a3d1c" stop-opacity="0.38"/></radialGradient></defs>`;
  s += `<rect width="${n2(P)}" height="${n2(H)}" filter="url(#ps-pergament)"/><rect width="${n2(P)}" height="${n2(H)}" filter="url(#ps-faser)"/>`;
  s += `<g filter="url(#ps-fleck)" fill="none" stroke="#7a5428"><ellipse cx="${n2(P * 0.82)}" cy="${n2(H * 0.17)}" rx="${n2(34 * f)}" ry="${n2(31 * f)}" stroke-width="${n2(2.4 * f)}" stroke-opacity="0.18"/>`
    + `<ellipse cx="${n2(P * 0.82)}" cy="${n2(H * 0.17)}" rx="${n2(33 * f)}" ry="${n2(30 * f)}" fill="#7a5428" fill-opacity="0.05" stroke="none"/><ellipse cx="${n2(P * 0.14)}" cy="${n2(H * 0.87)}" rx="${n2(22 * f)}" ry="${n2(18 * f)}" stroke-width="${n2(1.6 * f)}" stroke-opacity="0.14"/></g>`;
  { let z = 99; const rnd = () => (z = (Math.imul(z, 1103515245) + 12345) >>> 0) / 4294967296;
    for (let i = 0; i < 70; i++){ const ux = rnd(), uy = rnd(), nah = Math.min(ux, 1 - ux, uy, 1 - uy), a = rnd(), b = rnd(); if (a > 0.25 + (0.5 - nah) * 1.5) continue;
      s += `<circle cx="${n2(ux * P)}" cy="${n2(uy * H)}" r="${n2((0.6 + 2.8 * b * b) * f)}" fill="#7a4a1c" fill-opacity="${(0.06 + 0.12 * rnd()).toFixed(2)}"/>`; }
    const fy = H * 0.52; s += `<line x1="0" y1="${n2(fy)}" x2="${n2(P)}" y2="${n2(fy)}" stroke="#5a3d1c" stroke-opacity="0.10" stroke-width="${n2(1.2 * f)}"/><line x1="0" y1="${n2(fy + 1.2 * f)}" x2="${n2(P)}" y2="${n2(fy + 1.2 * f)}" stroke="#fff8e8" stroke-opacity="0.25" stroke-width="${n2(0.8 * f)}"/>`; }
  const q = r + 8 * f;
  s += `<rect x="${n2(cx - q)}" y="${n2(cy - q)}" width="${n2(2 * q)}" height="${n2(2 * q)}" ${kon(0.45)}/><circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(q)}" ${kon(0.45)}/>`
    + `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(r + 14 * f)}" ${kon(0.45)} stroke-dasharray="${n2(2 * f)} ${n2(3 * f)}"/>`
    + `<line x1="${n2(cx - r - 30 * f)}" y1="${n2(cy)}" x2="${n2(cx + r + 30 * f)}" y2="${n2(cy)}" ${kon(0.45)}/><line x1="${n2(cx)}" y1="${n2(cy - r - 30 * f)}" x2="${n2(cx)}" y2="${n2(cy + r + 30 * f)}" ${kon(0.45)}/>`
    + `<line x1="${n2(cx - q)}" y1="${n2(cy - q)}" x2="${n2(cx + q)}" y2="${n2(cy + q)}" ${kon(0.25)}/><line x1="${n2(cx + q)}" y1="${n2(cy - q)}" x2="${n2(cx - q)}" y2="${n2(cy + q)}" ${kon(0.25)}/>`;
  for (let i = 0; i < 24; i++){ const a = 2 * Math.PI * i / 24, r1 = r + (i % 6 === 0 ? 20 : 13) * f;
    s += `<line x1="${n2(cx + q * Math.cos(a))}" y1="${n2(cy + q * Math.sin(a))}" x2="${n2(cx + r1 * Math.cos(a))}" y2="${n2(cy + r1 * Math.sin(a))}" ${kon(0.45)}/>`; }
  /* Buchstaben an den Hauptmarken und den Ecken des Quadrats, wie Leonardo seine Konstruktionen beschriftete */
  const bu = (x, y, t) => `<text x="${n2(x)}" y="${n2(y)}" font-size="${n2(4.6 * f)}" fill="${SKIZZE_SEPIA}" fill-opacity="0.6" text-anchor="middle" font-family="${SKIZZE_SCHRIFT}">${t}</text>`;
  ['a', 'b', 'c', 'd'].forEach((t, i) => { const a = -Math.PI / 2 + i * Math.PI / 2, rr = r + 25 * f; s += bu(cx + rr * Math.cos(a) + 3 * f, cy + rr * Math.sin(a) + 1.6 * f, t); });
  /* die Ecken des Quadrats nur im Hochformat - quer und quadratisch liegen unten Legende und Siegel dort */
  if (g.kreis.hoch) [[-1, -1, 'e'], [1, -1, 'f'], [1, 1, 'g'], [-1, 1, 'h']].forEach(([sx, sy, t]) => { s += bu(cx + sx * (q + 3.5 * f), cy + sy * (q + 3.5 * f) + 1.6 * f, t); });
  return s;
}
/* RANDSTUDIEN (Caspar_D, 08.10.2026 nachts: „du kannst ruhig noch mehr hinzufügen, kannte er schon noten, das wäre noch was, oder
   die Skizze einer e-Gitarre, die natürlich Leonardo damals schon erfunden hatte ;-)" – „oder ein Cello als Tribute to Tarja"):
   Federstudien mit Konstruktion (Achse, Zirkelbögen, Maßlinie), Schraffur auf der Schattenseite und Beschriftung in Spiegelschrift.
   Gezeichnet in eigenen Einheiten (Gitarre 38 × 100, Cello 40 × 110), auf die Lücke skaliert; die Strichstärke bleibt in mm. */
const STUDIE_MASS = { gitarre: { w: 46, h: 114 }, cello: { w: 41, h: 123 } };   /* eigene Einheiten samt Beschriftungen */
function skizzeStudie(art, x, y, hoehe, f){
  const k = hoehe / STUDIE_MASS[art].h, sw = (mm) => (mm * f / k).toFixed(3), n2 = (v) => v.toFixed(2);
  const strich = (mm, o = 0.85) => `fill="none" stroke="${SKIZZE_SEPIA}" stroke-opacity="${o}" stroke-width="${sw(mm)}" stroke-linecap="round" stroke-linejoin="round"`;
  const spiegel = (tx, ty, fs, t, o = 0.7) => `<g transform="translate(${n2(2 * tx)},0) scale(-1,1)"><text x="${n2(tx)}" y="${n2(ty)}" font-size="${n2(fs)}" fill="${SKIZZE_SEPIA}" fill-opacity="${o}" text-anchor="middle" font-family="${SKIZZE_SCHRIFT}">${esc2(t)}</text></g>`;
  const id = 'ps-st-' + art, schraff = (x0, x1, y0, y1, d, wink = 45) => { let l = ''; const L = (x1 - x0) + (y1 - y0);
    for (let t = -L; t < L; t += d) l += `M${n2(x0 + t)},${n2(y1)} L${n2(x0 + t + (y1 - y0) / Math.tan(wink * Math.PI / 180))},${n2(y0)} `; return l; };
  let g = '';
  if (art === 'gitarre'){
    const koerper = 'M16.6,60 C14,58 12,54 10,52 C7,50 5,52 5.5,56 C6,60 4,63 2.5,68 C0,75 0,88 4,94 C8,100 30,100 34,94 C38,88 38,76 35.5,70 C34,66 35,63 34,60 C33.5,57 34,53 32,52.5 C30,52 28,55 26,58 C24,60 22,60 21.4,60 Z';
    g += `<defs><clipPath id="${id}-k"><path d="${koerper}"/></clipPath></defs>`
      + `<line x1="19" y1="-4" x2="19" y2="104" ${strich(0.18, 0.4)} stroke-dasharray="${sw(1.6)} ${sw(1.1)}"/>`
      + `<circle cx="19" cy="83" r="17.5" ${strich(0.18, 0.3)} stroke-dasharray="${sw(0.8)} ${sw(1)}"/><circle cx="19" cy="61" r="14" ${strich(0.18, 0.3)} stroke-dasharray="${sw(0.8)} ${sw(1)}"/>`
      + `<path d="${schraff(22, 40, 50, 100, 1.3)}" ${strich(0.16, 0.55)} clip-path="url(#${id}-k)"/><path d="${schraff(29, 40, 50, 100, 1.5, -45)}" ${strich(0.14, 0.45)} clip-path="url(#${id}-k)"/>`
      + `<path d="${koerper}" ${strich(0.32)}/>`
      + `<path d="M17,14 L21,14 L21.6,64 L16.4,64 Z" ${strich(0.28)}/>`
      + `<path d="M17,14 L16,6 Q16,1 20,1 L23,2 Q26,3 25,6 L22,9 Q21,11 21.5,14" ${strich(0.28)}/>`
      + Array.from({ length: 6 }, (_, i) => `<circle cx="15.1" cy="${n2(2.6 + 1.85 * i)}" r="0.85" ${strich(0.2)}/>`).join('');
    for (let n = 1; n <= 21; n++){ const yy = 14 + 74 * (1 - Math.pow(2, -n / 12)); if (yy > 64) break; const t = (yy - 14) / 50; g += `<line x1="${n2(17 - 0.6 * t)}" y1="${n2(yy)}" x2="${n2(21 + 0.6 * t)}" y2="${n2(yy)}" ${strich(0.14, 0.7)}/>`; }
    for (const yy of [67, 73]) g += `<rect x="15.5" y="${yy}" width="7" height="2" rx="0.8" ${strich(0.22)}/>`;
    g += `<rect x="15.5" y="78" width="7.5" height="2" rx="0.8" transform="rotate(-6 19 79)" ${strich(0.22)}/><rect x="14.5" y="86" width="9" height="3" rx="0.4" ${strich(0.25)}/>`
      + [[27, 82], [29, 86], [30.5, 90]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="1.2" ${strich(0.2)}/>`).join('') + `<ellipse cx="33.5" cy="92.5" rx="1" ry="1.6" ${strich(0.2)}/><line x1="26.5" y1="75" x2="29" y2="77.5" ${strich(0.25)}/>`
      + Array.from({ length: 6 }, (_, i) => `<line x1="${n2(17.6 + 0.56 * i)}" y1="14" x2="${n2(16.2 + 1.15 * i)}" y2="87.5" ${strich(0.1, 0.6)}/>`).join('')
      + `<path d="M41,1 L41,99 M39.8,1 L42.2,1 M39.8,99 L42.2,99" ${strich(0.18, 0.6)}/>` + `<g transform="rotate(90 43.6 50)">${spiegel(43.6, 50, 3.2, 'strumento elettrico')}</g>`
      + spiegel(19, 108, 3.4, 'una chitarra che canta senza aria') + `<text x="19" y="113" font-size="2.6" fill="${SKIZZE_SEPIA}" fill-opacity="0.6" text-anchor="middle" font-family="${SKIZZE_SCHRIFT}">Gitarre ohne Luft, die doch singt</text>`;
  } else if (art === 'cello'){
    const koerper = 'M20,38 C12,38 4,40 3.5,47 C3,53 6,56 9.5,57.5 C8,60 8,64 8.5,66 C9,70 8,72 6.5,73.5 C2,76 0,82 0.5,90 C1,99 9,104 20,104 C31,104 39,99 39.5,90 C40,82 38,76 33.5,73.5 C32,72 31,70 31.5,66 C32,64 32,60 30.5,57.5 C34,56 37,53 36.5,47 C36,40 28,38 20,38 Z';
    g += `<defs><clipPath id="${id}-k"><path d="${koerper}"/></clipPath></defs>`
      + `<line x1="20" y1="-3" x2="20" y2="113" ${strich(0.18, 0.4)} stroke-dasharray="${sw(1.6)} ${sw(1.1)}"/>`
      + `<circle cx="20" cy="47.5" r="16.5" ${strich(0.18, 0.3)} stroke-dasharray="${sw(0.8)} ${sw(1)}"/><circle cx="20" cy="89" r="19.5" ${strich(0.18, 0.3)} stroke-dasharray="${sw(0.8)} ${sw(1)}"/>`
      + `<path d="${schraff(-2, 16, 36, 106, 1.3, -50)}" ${strich(0.16, 0.5)} clip-path="url(#${id}-k)"/><path d="${schraff(-2, 9, 36, 106, 1.5, 40)}" ${strich(0.14, 0.4)} clip-path="url(#${id}-k)"/>`
      + `<path d="${koerper}" ${strich(0.32)}/><path d="M20,39.6 C12.5,39.6 5.2,41.3 4.8,47 C4.5,52 7.3,55 10.6,56.6" ${strich(0.14, 0.6)}/>`
      + `<path d="M18.2,16 L21.8,16 L22.4,40 L17.6,40 Z" ${strich(0.28)}/><path d="M18.4,40 L21.6,40 L22.2,62 L17.8,62 Z" ${strich(0.24)}/>`
      + `<path d="M18.4,16 L18,8.5 M21.6,16 L22,8.5" ${strich(0.26)}/>` + [10.5, 13.5].map(yy => `<path d="M18,${yy} L15.5,${yy - 0.6} M22,${yy + 1} L24.5,${yy + 0.4}" ${strich(0.26)}/><circle cx="15.2" cy="${yy - 0.65}" r="0.7" ${strich(0.2)}/><circle cx="24.8" cy="${yy + 0.35}" r="0.7" ${strich(0.2)}/>`).join('')
      + `<path d="M20,8.5 C23.5,8.5 24.5,5 22.5,3.2 C20.5,1.4 17,2.5 17.2,5 C17.4,7 20,7.4 20.8,5.8 C21.4,4.6 20.2,3.8 19.4,4.6" ${strich(0.26)}/>`
      + [13, 27].map(xx => { const s2 = xx < 20 ? 1 : -1; return `<path d="M${xx},64 C${xx + 2.4 * s2},68 ${xx - 2.4 * s2},76 ${xx},80" ${strich(0.24)}/><circle cx="${xx}" cy="63.6" r="0.7" ${strich(0.18)}/><circle cx="${xx}" cy="80.4" r="0.7" ${strich(0.18)}/>`; }).join('')
      + `<path d="M14,80.5 Q20,77.6 26,80.5 L25.4,81.4 L14.6,81.4 Z" ${strich(0.24)}/><path d="M17.2,85 L22.8,85 L24,98 L16,98 Z" ${strich(0.24)}/><line x1="20" y1="104" x2="20" y2="111" ${strich(0.3)}/>`
      + Array.from({ length: 4 }, (_, i) => `<line x1="${n2(18.9 + 0.75 * i)}" y1="16" x2="${n2(17.9 + 1.4 * i)}" y2="85" ${strich(0.1, 0.6)}/>`).join('')
      /* Caspar_D: „ein Cello und dann als Untertitel auf Latein: gewidmet der Meisterin Tarja" */
      + `<text x="20" y="117.5" font-size="4.4" fill="${SKIZZE_SEPIA}" fill-opacity="0.9" text-anchor="middle" font-family="${SKIZZE_SCHRIFT}">Violoncellum</text>`
      + `<text x="20" y="122" font-size="3" fill="${SKIZZE_SEPIA}" fill-opacity="0.75" text-anchor="middle" font-family="${SKIZZE_SCHRIFT}">magistrae Tarjae dedicatum</text>` + spiegel(9, 26, 2.8, 'quattro corde', 0.6);
  }
  return `<g transform="translate(${n2(x)} ${n2(y)}) scale(${(k).toFixed(4)})">${g}</g>`;
}
/* Leonardos Notenrätsel (Windsor, RL 12697): „amore sol la mi fa remirare" - Noten auf fünf Linien lesen sich als Silben, „nur die
   Liebe lässt mich erinnern". Breite 110, Höhe 26 in eigenen Einheiten; Semibreven als Rauten wie in der Mensuralnotation. */
function skizzeNotenraetsel(x, y, breite, f){
  const k = breite / 110, sw = (mm) => (mm * f / k).toFixed(3), n2 = (v) => v.toFixed(2), st = (mm, o = 0.85) => `stroke="${SKIZZE_SEPIA}" stroke-opacity="${o}" stroke-width="${sw(mm)}"`;
  const tx = (xx, yy, fs, t, o = 0.8) => `<text x="${n2(xx)}" y="${n2(yy)}" font-size="${n2(fs)}" fill="${SKIZZE_SEPIA}" fill-opacity="${o}" text-anchor="middle" font-family="${SKIZZE_SCHRIFT}">${esc2(t)}</text>`;
  let g = '';
  for (let i = 0; i < 5; i++) g += `<line x1="22" y1="${4 + 2 * i}" x2="84" y2="${4 + 2 * i}" ${st(0.18, 0.7)}/>`;
  /* sol la mi fa re mi (G A E F D E), Violinschlüssel durch ein schlichtes G angedeutet: unterste Linie y 12 = E, Schritt 1 */
  const tonY = { sol: 10, la: 9, mi: 12, fa: 11, re: 13 }, silben = ['sol', 'la', 'mi', 'fa', 're', 'mi'];
  g += tx(26, 12, 7.5, '𝄞', 0.85);
  silben.forEach((sb, i) => { const xx = 34 + i * 8.4, yy = tonY[sb];
    g += `<path d="M${n2(xx - 1.3)},${n2(yy)} L${n2(xx)},${n2(yy - 1)} L${n2(xx + 1.3)},${n2(yy)} L${n2(xx)},${n2(yy + 1)} Z" fill="${SKIZZE_SEPIA}" fill-opacity="0.85"/>`
      + (yy >= 13 ? `<line x1="${n2(xx - 2)}" y1="14" x2="${n2(xx + 2)}" y2="14" ${st(0.18)}/>` : '') + tx(xx, 19, 2.6, sb, 0.65); });
  g += tx(10, 11, 4.8, 'amore') + tx(97, 11, 4.8, 'rare') + tx(55, 25, 3, 'amore sol la mi fa remirare – nur die Liebe lässt mich erinnern', 0.6);
  return `<g transform="translate(${n2(x)} ${n2(y)}) scale(${k.toFixed(4)})">${g}</g>`;
}
/* Über dem Schaum: Kopf, Spiegelzeile, Randnotizen, Refrains, Zeitleiste, Legende, Siegel, Edition, Studien, Rätsel, Altersrand.
   Angeordnet über BELEGUNGSKÄSTEN (Fallensuche 1.0.61: im Quer- und Quadratformat lagen Notizen auf Refrains, das Rätsel auf dem
   Siegel, der Kopf in der Konstruktion): Refrains, Legende, Siegel und Rätsel melden ihren Kasten zuerst, die Randnotizen weichen
   ihnen aus, die Studien bekommen nur Lücken, die frei sind. Breiten in Pinyon Script werden gemessen (skizzeBreite, Haus). */
function skizzeSchmuck(g, refrains, legende){
  const f = g.kurz / 500, { cx, cy, r, hoch } = g.kreis, P = g.PW, H = g.PH, B = BESCHNITT, n2 = (v) => v.toFixed(2), res = aktuell.res, zeilen = aktuell.j.zeilen;
  const tinte = (farbe) => typeof skizzeTinte === 'function' ? skizzeTinte(farbe || '#888', skizzePapier()) : SKIZZE_SEPIA;
  const em = (t) => typeof skizzeBreite === 'function' ? skizzeBreite(t) : String(t).length * 0.4;
  const txt = (x, y, fs, t, { anker = 'middle', farbe = SKIZZE_SEPIA, deck = 1, extra = '' } = {}) => `<text x="${n2(x)}" y="${n2(y)}" font-size="${n2(fs)}" fill="${farbe}"${deck < 1 ? ` fill-opacity="${deck}"` : ''} text-anchor="${anker}" font-family="${SKIZZE_SCHRIFT}"${extra}>${esc2(t)}</text>`;
  /* die Seitenränder L0…randL und randR…R0 - Notizen und Studien dürfen in die Konstruktion (Quadrat, Zirkelmarken) hineinragen, nicht in den Kreis */
  const L0 = B + 10 * f, R0 = B + g.w - 10 * f, randL = cx - r - 6 * f, randR = cx + r + 6 * f;
  const kaesten = [];                       /* { x0, x1, y0, y1 } in mm */
  const frei = (k) => !kaesten.some(q => k.x0 < q.x1 && k.x1 > q.x0 && k.y0 < q.y1 && k.y1 > q.y0);
  let s = '';
  // Kopf und Spiegelzeile (Leonardo schrieb in Spiegelschrift)
  const kopfFs = Math.min(24 * f, (g.w - 40 * f) / Math.max(1, em(E.kopfTitel || ''))); s += txt(B + g.w / 2, B + 44 * f, kopfFs, E.kopfTitel || '');
  const unter = String(E.kopfUnter || '').split('/').map(x => x.trim()).filter(Boolean).join(' · ');
  if (unter) s += `<g transform="translate(${n2(2 * (B + g.w / 2))},0) scale(-1,1)">${txt(B + g.w / 2, B + 60 * f, Math.min(7 * f, (g.w - 60 * f) / Math.max(1, em(unter))), unter, { deck: 0.7 })}</g>`;
  kaesten.push({ x0: B, x1: B + g.w, y0: B, y1: B + 66 * f });
  // Refrains: Hochformat oben links, oben rechts, unten in der Mitte; quer/quadratisch alle in den Seitenrändern
  const refrainBlock = (rf, x, y, breite, anker, dreh) => {
    const kopf = `aus „${rf.titel}“` + (E.refrains === 'neueste' ? '' : ` · ${rf.herzen} Herzen`), maxEm = Math.max(em(kopf) * 4.6 / 6.4, ...rf.refrain.map(em));
    const fs = Math.min(6.4 * f, breite / Math.max(1, maxEm)), hoehe = fs * (1.33 + 1.16 * rf.refrain.length) + 2 * f;
    const x0 = anker === 'start' ? x : anker === 'end' ? x - breite : x - breite / 2;
    kaesten.push({ x0, x1: x0 + breite, y0: y - fs, y1: y - fs + hoehe });
    return `<g transform="rotate(${dreh} ${n2(x)} ${n2(y)})">` + txt(x, y, fs * 0.72, kopf, { anker, deck: 0.65 })
      + rf.refrain.map((z, i) => txt(x, y + fs * (1.33 + i * 1.16), fs, z, { anker, deck: 0.85 })).join('') + '</g>';
  };
  const bR = hoch ? Math.min(g.w / 2 - 50 * f, 230 * f) : randL - L0;
  if (refrains[0]) s += refrainBlock(refrains[0], L0 + (hoch ? 24 * f : 0), B + 80 * f, bR, 'start', -3);
  if (refrains[1]) s += refrainBlock(refrains[1], R0 - (hoch ? 24 * f : 0), B + 80 * f, bR, 'end', 3);
  // Siegel unten rechts (mit Bändern und Edition), Legende unten links
  const sx = B + g.w - 72 * f, sy = B + g.h - 100 * f;
  kaesten.push({ x0: sx - 40 * f, x1: sx + 40 * f, y0: sy - 34 * f, y1: B + g.h });
  let legH = 0, legFs = 6 * f, legZ = 0;
  if (E.legende && legende.length){
    legZ = Math.min(legende.length, 14); const platz = (hoch ? Math.min(200 * f, sx - 50 * f - (B + 60 * f)) : randL - L0) - 24 * f;
    const zeilenH = Math.min(11 * f, 190 * f / (legZ + 1.5)), maxEm = Math.max(1, ...legende.slice(0, legZ).map(e => em(e.name)));
    legFs = Math.min(6 * f, zeilenH / 1.25, platz / maxEm); const breite = Math.max(legFs * maxEm, 60 * f);
    legH = (legZ + 1.5) * zeilenH; const lx = hoch ? B + 60 * f : L0, ly = B + g.h - 12 * f - legH + zeilenH;
    kaesten.push({ x0: lx, x1: lx + 24 * f + breite, y0: ly - 1.8 * zeilenH, y1: B + g.h });
    const n = legende.length, wort = n <= 12 ? ZAHLWORT[n] : String(n);
    s += txt(lx, ly - 0.9 * zeilenH, Math.min(7 * f, legFs * 1.15), n === 1 ? 'Die eine Gegend:' : `Die ${wort} Gegenden:`, { anker: 'start' });
    legende.slice(0, legZ).forEach((e, j) => { const y = ly + j * zeilenH, ink = tinte(e.farbe);
      s += `<line x1="${n2(lx)}" y1="${n2(y - legFs * 0.33)}" x2="${n2(lx + 18 * f)}" y2="${n2(y - legFs * 0.33)}" stroke="${ink}" stroke-width="${n2(1.2 * f)}"/>` + txt(lx + 24 * f, y, legFs, e.name, { anker: 'start', farbe: ink }); });
    if (n > legZ) s += txt(lx + 24 * f, ly + legZ * zeilenH, legFs * 0.85, `und ${n - legZ} weitere`, { anker: 'start', deck: 0.7 });
  }
  /* dritter Refrain: Hochformat unter dem Kreis, quer/quadratisch im linken Rand - nur wo frei (er stieß sonst auf eine lange
     Legende); probiert wird von der Wunschlage aus abwechselnd nach oben und unten */
  if (refrains[2]){ const breite = hoch ? Math.min(g.w - 160 * f, 260 * f) : bR, x = hoch ? B + g.w / 2 : L0, anker = hoch ? 'middle' : 'start', y0 = hoch ? cy + r + 70 * f : cy + 0.15 * r;
    for (const d of [0, -10, 10, -20, 20, -30, 30, -45, 45, -60, 60]){ const vorher = kaesten.length, teil = refrainBlock(refrains[2], x, y0 + d * f, breite, anker, -1.5), k = kaesten.pop();
      if (frei(k) && k.y1 < B + g.h - 4 * f){ kaesten.push(k); s += teil; break; } kaesten.length = vorher; } }
  // Notenrätsel: Hochformat unten in der Mitte, quer im rechten Rand über dem Siegel
  { const rb = hoch ? 150 * f : Math.min(150 * f, R0 - randR - 10 * f), rh = 26 * rb / 110, versuche = [];
    if (hoch){ for (let d = 0; d <= 60; d += 6) versuche.push([B + g.w / 2 - rb / 2, cy + r + 104 * f + d * f]); versuche.push([B + 12 * f, cy + r + 104 * f]); }
    else for (let d = 0; d <= 120; d += 8) versuche.push([R0 - rb, sy - 44 * f - rh - d * f]);
    for (const [rx, ry] of versuche){ const k = { x0: rx, x1: rx + rb, y0: ry, y1: ry + rh };
      if (rb > 70 * f && ry + rh < B + g.h - 2 * f && frei(k)){ kaesten.push(k); s += skizzeNotenraetsel(rx, ry, rb, f); break; } } }
  // Arealfarben und Schaum-Einheiten -> Seite
  const kv = g.karte, k = kv.w / res.width, X = (x) => kv.x + x * k, Y = (y) => kv.y + (res.height - y) * k, ebene = aktuell.j.ebenen[0];
  const flaeche = (o) => { let a = 0; for (let i = 0; i < o.length; i++){ const p = o[i], q = o[(i + 1) % o.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a / 2); };
  const mitte = (o) => [o.reduce((a, p) => a + p[0], 0) / o.length, o.reduce((a, p) => a + p[1], 0) / o.length];
  // Randnotizen: die sieben größten Zellen am Kreisrand; Linie radial bis vor den Kreis, dann waagerecht; weichen den Kästen aus
  const blaetter = res.leaves.filter(l => l.outline && l.outline.length > 2 && l.row != null && zeilen[l.row] && zeilen[l.row].id !== SCHILD_ID).map(l => {
    const m = mitte(l.outline), z = zeilen[l.row]; return { l, z, a: flaeche(l.outline), px: X(m[0]), py: Y(m[1]) }; })
    .filter(e => Math.hypot(e.px - cx, e.py - cy) > 0.62 * r).sort((a, b) => b.a - a.a).slice(0, 7);
  const umbruch = (t, n) => { const z = ['']; for (const w of t.split(' ')){ if ((z[z.length - 1] + ' ' + w).trim().length > n && z[z.length - 1]) z.push(w); else z[z.length - 1] = (z[z.length - 1] + ' ' + w).trim(); } return z.slice(0, 2); };
  const notizFs = 5.4 * f, notizB = Math.min(Math.max(randL - L0, 46 * f), cx - r - 2 * f - L0, 60 * f), obenGrenze = B + 70 * f, untenGrenze = B + g.h - 8 * f;
  for (const seite of ['l', 'r']){
    const liste = blaetter.filter(e => (e.px < cx) === (seite === 'l')).map(e => ({ ...e, th: Math.atan2(e.py - cy, e.px - cx) })).sort((a, b) => a.py - b.py);
    for (const e of liste){
      const zl = umbruch(ohneKlammernTitel(e.z.titel || ''), 17), hoeheN = (8 + 6 * zl.length) * f, x0 = seite === 'l' ? L0 : R0 - notizB;
      const ex = cx + (r + 16 * f) * Math.cos(e.th), ey = cy + (r + 16 * f) * Math.sin(e.th), kx = seite === 'l' ? Math.min(ex, randL + 8 * f) : Math.max(ex, randR - 8 * f);
      /* Kasten der Notiz samt Hinweislinie außerhalb des Kreises (der senkrechte und der waagerechte Teil): sonst lief die Linie
         durch einen Refrain oder eine Studie; gesucht wird von der Wunschlage aus abwechselnd nach unten und oben */
      const kastenBei = (ny) => ({ x0: Math.min(x0, kx), x1: Math.max(x0 + notizB, kx), y0: Math.min(ny - 8 * f, ey), y1: Math.max(ny + hoeheN, ey) });
      const wunsch = Math.max(obenGrenze + 8 * f, cy + (r + 16 * f) * Math.sin(e.th)); let ny = null;
      for (let d = 0; d < 400 * f && ny == null; d += 3 * f) for (const c of [wunsch + d, wunsch - d]) if (c - 8 * f >= obenGrenze && c + hoeheN < untenGrenze && frei(kastenBei(c))){ ny = c; break; }
      if (ny == null) continue;                            /* kein Platz mehr: diese Notiz entfällt */
      kaesten.push(kastenBei(ny));
      const areal = e.z[ebene] || e.z.gruppe, ink = tinte(randArealFarben.get(areal)), rand = seite === 'l' ? L0 : R0, anker = seite === 'l' ? 'start' : 'end';
      const fs = Math.min(notizFs, notizB / Math.max(1, ...zl.map(em)));
      s += `<path d="M${n2(e.px)},${n2(e.py)} L${n2(ex)},${n2(ey)} L${n2(kx)},${n2(ny)} L${n2(seite === 'l' ? rand + Math.min(44 * f, notizB) : rand - Math.min(44 * f, notizB))},${n2(ny)}" fill="none" stroke="${SKIZZE_SEPIA}" stroke-opacity="0.55" stroke-width="${n2(0.28 * f)}"/>`
        + `<circle cx="${n2(e.px)}" cy="${n2(e.py)}" r="${n2(0.9 * f)}" fill="${SKIZZE_SEPIA}"/>`
        + zl.map((t, j) => txt(rand, ny - 2 * f + j * 6 * f, fs, t, { anker, farbe: ink })).join('')
        + txt(rand, ny + 4 * f + (zl.length - 1) * 6 * f, Math.min(3.8 * f, notizB / Math.max(1, em(areal || ''))), areal || '', { anker, deck: 0.75 });
    }
  }
  /* Randstudien: Gitarre links, Cello rechts, in die größte freie Lücke ihres Randes, so hoch wie sie erlaubt (höchstens 135 mm auf
     50 × 70); maßgeblich ist die Größe samt Beschriftung (STUDIE_MASS) */
  for (const [art, seite] of [['gitarre', 'l'], ['cello', 'r']]){
    const M = STUDIE_MASS[art], bx0 = seite === 'l' ? L0 : randR, bx1 = seite === 'l' ? randL : R0, breite = bx1 - bx0;
    if (breite < 25 * f) continue;
    const ys = [obenGrenze, ...kaesten.filter(q => q.x0 < bx1 && q.x1 > bx0).flatMap(q => [q.y0, q.y1]), untenGrenze].sort((a, b) => a - b);
    let best = null;
    for (const y0 of ys) for (const y1 of ys){ if (y1 <= y0 + 40 * f) continue; const hh = Math.min(y1 - y0 - 10 * f, 135 * f, breite * 0.92 / M.w * M.h), bw = hh / M.h * M.w;
      const kk = { x0: bx0 + (breite - bw) / 2, x1: bx0 + (breite + bw) / 2, y0: y0 + 5 * f, y1: y0 + 5 * f + hh };
      if (hh >= 45 * f && frei(kk) && (!best || hh > best.hh)) best = { hh, kk }; }
    if (best){ kaesten.push(best.kk); s += skizzeStudie(art, best.kk.x0, best.kk.y0, best.hh, f); }
  }
  // Zeitleiste als Bogen um den Kreis: je Tag ein Strich am Mittel seiner Zeiten (länger bei mehreren Titeln, gedeckelt), Monate/Jahre
  if (E.zeitleiste){
    const T = zeilen.map(z => { const so = typeof song === 'function' ? song(z.id) : null; return so && Date.parse(so.erstellt); }).filter(Boolean).sort((a, b) => a - b);
    if (T.length > 1){
      const t0 = T[0], t1 = T[T.length - 1], a0 = 200 * Math.PI / 180, a1 = 340 * Math.PI / 180, r0 = r + 22 * f;
      const ang = (t) => a0 + (a1 - a0) * Math.max(0, Math.min(1, (t - t0) / (t1 - t0 || 1))), pt = (a, rr) => [cx + rr * Math.cos(a), cy - rr * Math.sin(a)], [bx0, by0] = pt(a0, r0), [bx1, by1] = pt(a1, r0);
      s += `<path d="M${n2(bx0)},${n2(by0)} A${n2(r0)},${n2(r0)} 0 0 0 ${n2(bx1)},${n2(by1)}" fill="none" stroke="${SKIZZE_SEPIA}" stroke-opacity="0.7" stroke-width="${n2(0.35 * f)}"/>`;
      const proTag = new Map(); for (const t of T){ const d = Math.floor(t / 864e5), e = proTag.get(d) || [0, 0]; proTag.set(d, [e[0] + 1, e[1] + t]); }
      for (const [, [n, summe]] of proTag){ const a = ang(summe / n), [x0, y0] = pt(a, r0), [x1, y1] = pt(a, r0 + (2 + Math.min(7, 1.8 * Math.sqrt(n))) * f);
        s += `<line x1="${n2(x0)}" y1="${n2(y0)}" x2="${n2(x1)}" y2="${n2(y1)}" stroke="${SKIZZE_SEPIA}" stroke-opacity="0.75" stroke-width="${n2(0.3 * f)}"/>`; }
      const MON = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
      for (let dt = new Date(new Date(t0).getFullYear(), new Date(t0).getMonth() + 1, 1); dt.getTime() <= t1; dt.setMonth(dt.getMonth() + 1)){
        const a = ang(dt.getTime()), jan = dt.getMonth() === 0, [x0, y0] = pt(a, r0), [x1, y1] = pt(a, r0 - (jan ? 4 : 2.2) * f), [lx, ly] = pt(a, r0 - 6.5 * f);
        s += `<line x1="${n2(x0)}" y1="${n2(y0)}" x2="${n2(x1)}" y2="${n2(y1)}" stroke="${SKIZZE_SEPIA}" stroke-width="${n2(0.3 * f)}"/>`
          + txt(lx, ly, (jan ? 4.4 : 3.2) * f, jan ? String(dt.getFullYear()) : MON[dt.getMonth()], { deck: 0.75, extra: ` transform="rotate(${(270 - a * 180 / Math.PI).toFixed(1)} ${n2(lx)} ${n2(ly)})"` }); }
    }
  }
  // Siegel mit Band: Wachsklecks, flach gedrückt (Caspar_D: „zu viel 3d"), der Avatar als Prägung; darunter die Edition
  if (typeof avatarDa === 'function' && avatarDa()){
    const ax = sx, ay = sy, R = 30 * f, ri = 19.5 * f, bw = 15 * f, bl = 62 * f, bk = 6 * f;
    const band = (dreh) => `<g transform="translate(${n2(ax)} ${n2(ay)}) rotate(${dreh})"><path d="M${n2(-bw / 2)},0 L${n2(bw / 2)},0 L${n2(bw / 2)},${n2(bl)} L0,${n2(bl - bk)} L${n2(-bw / 2)},${n2(bl)} Z" fill="url(#ps-band)"/>`
      + `<path d="M${n2(-bw / 2 + 1.2 * f)},0 L${n2(-bw / 2 + 1.2 * f)},${n2(bl - 1.5 * f)} M${n2(bw / 2 - 1.2 * f)},0 L${n2(bw / 2 - 1.2 * f)},${n2(bl - 1.5 * f)}" stroke="#c9a23e" stroke-opacity="0.7" stroke-width="${n2(0.5 * f)}" fill="none"/></g>`;
    s += `<defs><linearGradient id="ps-band" x1="0" x2="1"><stop offset="0" stop-color="#4d1418"/><stop offset="0.35" stop-color="#7d2026"/><stop offset="0.55" stop-color="#94303a"/><stop offset="1" stop-color="#561619"/></linearGradient>`
      + `<filter id="ps-wachsrand" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="${n2(0.05 / f)}" numOctaves="3" seed="21" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="${n2(9 * f)}"/></filter>`
      + `<radialGradient id="ps-wachs" cx="0.4" cy="0.36" r="0.75"><stop offset="0" stop-color="#b8363a"/><stop offset="0.6" stop-color="#9a2224"/><stop offset="1" stop-color="#6e1416"/></radialGradient>`
      + `<filter id="ps-wulst" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceAlpha" stdDeviation="${n2(2.6 * f)}" result="h"/>`
      + `<feSpecularLighting in="h" surfaceScale="${n2(1.1 * f)}" specularConstant="0.35" specularExponent="14" lighting-color="#ffd9c8" result="glanz"><feDistantLight azimuth="225" elevation="50"/></feSpecularLighting>`
      + `<feComposite in="glanz" in2="SourceAlpha" operator="in" result="g2"/><feComposite in="SourceGraphic" in2="g2" operator="arithmetic" k1="0" k2="1" k3="0.3" k4="0"/></filter>`
      + `<filter id="ps-praegung" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.33 0.33 0.33 0 0" result="hoehe"/>`
      + `<feGaussianBlur in="hoehe" stdDeviation="${n2(0.5 * f)}" result="hw"/><feDiffuseLighting in="hw" surfaceScale="${n2(0.9 * f)}" diffuseConstant="1.05" lighting-color="#ffffff" result="licht"><feDistantLight azimuth="225" elevation="55"/></feDiffuseLighting>`
      + `<feFlood flood-color="#9e2526"/><feComposite in2="licht" operator="arithmetic" k1="1.15" k2="0" k3="0" k4="0"/></filter><clipPath id="ps-siegelinnen"><circle cx="${n2(ax)}" cy="${n2(ay)}" r="${n2(ri)}"/></clipPath></defs>`;
    s += band(24) + band(-24) + `<g filter="url(#ps-wulst)"><circle cx="${n2(ax)}" cy="${n2(ay)}" r="${n2(R)}" fill="url(#ps-wachs)" filter="url(#ps-wachsrand)"/></g>`
      + `<circle cx="${n2(ax)}" cy="${n2(ay)}" r="${n2(ri + 2.4 * f)}" fill="none" stroke="#5a0f11" stroke-opacity="0.45" stroke-width="${n2(1 * f)}"/>`
      + `<image href="/avatar" data-voll="/avatar" x="${n2(ax - ri)}" y="${n2(ay - ri)}" width="${n2(2 * ri)}" height="${n2(2 * ri)}" clip-path="url(#ps-siegelinnen)" filter="url(#ps-praegung)"/>`;
    if (E.edition) s += txt(ax, Math.min(ay + bl + 9 * f, B + g.h - 3 * f), 4.4 * f, editionText(), { deck: 0.8 });
  } else if (E.edition) s += txt(sx, B + g.h - 30 * f, 4.4 * f, editionText(), { deck: 0.8 });
  s += `<rect width="${n2(P)}" height="${n2(H)}" fill="url(#ps-altrand)" pointer-events="none"/>`;
  return s;
}
/* Papier des Skizzenbuchs: der Grund, aber nie dunkel - Feder braucht helles Papier (ein dunkler Farbton machte jede Tinte
   schwarz, das Plakat war leer; Fallensuche 1.0.61) */
const skizzePapier = () => leuchte(E.grund) >= 0.45 ? E.grund : '#eee2c6';

/* Genitiv eines Namens ohne Deppenapostroph (Caspar_D: „uhä, ein Deppenapostroph … natürlich ohne Apostroph"): „Caspar_Ds";
   endet der Name auf s, ß, x, z oder ce, nur der Apostroph („Klaus’") - so die Rechtschreibung. */
const genitiv = (n) => /(s|ß|x|z|ce)$/i.test(n) ? n + '\u2019' : n + 's';
const dauerText = (sek) => { const t = Math.round(sek), h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, x = t % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`; };

function standSetzen(t){ const s = el('ps-stand'); if (s) s.textContent = t || ''; }

/* Neu zeichnen: ist das Seitenverhaeltnis der Karte ein anderes, wird der Schaum neu gelegt (gemerkt wie
   jedes Layout), sonst nur das Bild neu gebaut. */
function zeichnen(sofort, warteMs, nurSetzen){
  clearTimeout(warten);
  warten = setTimeout(async () => {
    const lauf = ++legeLauf;
    /* Das Verzeichnis braucht Platz unter der Karte - dafuer muss die Zahl der Eintraege vor dem Legen bekannt sein */
    let n = aktuell && aktuell.raum === raumJetzt ? aktuell.j.zeilen.length : 0;
    if (!n && E.verzeichnis){ try { n = (await auftrag(1)).j.zeilen.length; } catch (e) { n = 0; } if (lauf !== legeLauf) return; }
    /* Randlos: das Verhältnis auf drei Stellen, sonst reichte der Schaum in breiten Formaten nicht bis in den Beschnitt (3 × 70 × 100
       quer: 28 mm zu kurz an jeder Seite, 100 × 140 quer: 1,4 mm) */
    const stellen = E.schild ? 1000 : 100, g = geometrie(n), verh = Math.round(g.karte.h / g.karte.w * stellen) / stellen;
    /* Randlos: Ecke und Block gehoeren zum Auftrag - aendern sie sich (andere Ecke, laengerer Titel), wird neu gelegt */
    const eckS = E.schild ? schildVorgabe(g, 1000, Math.round(1000 * verh)).schluessel : '';
    /* nurSetzen (während des Tippens): die Ecke wird mit dem jetzigen Schaum gesetzt (eckeSetzen verkleinert, falls nötig); neu gelegt
       wird erst beim Verlassen des Feldes oder mit Enter - vorher startete jede Tipppause einen eigenen Lauf */
    if (!aktuell || aktuell.verh !== verh || aktuell.raum !== raumJetzt || aktuell.schild !== !!E.schild || aktuell.skizze !== !!E.skizze || (aktuell.eckS !== eckS && !nurSetzen)){
      const a = await auftrag(verh);
      if (lauf !== legeLauf) return;
      /* die Vorschlaege fuer Titel, Zeile und Name vor dem Legen: nach ihnen wird die Ecke bemessen */
      if (!E.kopfTitelEigen) E.kopfTitel = kopfTitelVorschlag();
      if (!E.kopfUnterEigen) E.kopfUnter = kopfUnterVorschlag(a);
      if (!E.schildNameEigen) E.schildName = schildNameVorschlag();
      let v = null;
      if (E.schild && typeof schildAuftrag === 'function'){ v = schildVorgabe(g, a.j.W, a.j.H); a.j = schildAuftrag(a.j, v); }
      if (E.skizze) a.j = kreisAuftrag(a.j);
      standSetzen('Der Schaum wird für das Plakat gelegt …');
      let res;
      try { res = await schaumLageHolen(a.j, s => { if (lauf === legeLauf) standSetzen(`Der Schaum wird für das Plakat gelegt … ${s} s`); }, true); }
      catch (e){ if (lauf !== legeLauf) return; standSetzen('Der Schaum ließ sich nicht legen.'); console.log('Plakat:', e); return; }
      if (lauf !== legeLauf) return;
      aktuell = { verh, raum: raumJetzt, schild: !!E.schild, skizze: !!E.skizze, eckS: v ? v.schluessel : '', ecke: v ? v.ecke : null, res, ...a };
      felderSetzen();
    }
    standSetzen('');
    bauen(g);
  }, sofort ? 0 : (warteMs || 120));
}
const profil = () => (typeof katalogInfo !== 'undefined' && katalogInfo && katalogInfo.profil) || {};
function kopfTitelVorschlag(){
  const schaum = raumJetzt === 'groupies' ? 'Groupieschaum' : 'Klangschaum', p = profil();
  if (E.skizze){ const n = p.display_name || p.handle || ''; return n ? genitiv(n) + ' ' + schaum : schaum; }
  return E.schild ? schaum : (p.display_name || p.handle || 'Mein Archiv') + ' · ' + schaum;    /* Randlos: der Name steht in eigener Zeile darueber */
}
function schildNameVorschlag(){ const p = profil(), n = p.display_name || p.handle || ''; return n ? genitiv(n) : ''; }
/* Randlos: „<Datum> / nnn Titel · Laufzeit" - die Laufzeit ist die Summe der Titellaengen (im Haus heisst „Hoerzeit" Plays mal
   Laenge, das Flaechenmass „Hörzeit (Schätzung)"); „/" bricht in der Ecke die Zeile um. */
function kopfUnterVorschlag(a = aktuell){
  if (!a) return '';
  const n = a.j.zeilen.length, monat = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  if (E.schild || E.skizze){
    const datum = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    if (a.art === 'person') return `${datum} / ${n} ${n === 1 ? 'Person' : 'Personen'}`;
    const sek = a.j.zeilen.reduce((t, z) => t + (((typeof song === 'function' && song(z.id)) || {}).dauer || 0), 0);
    return `${datum} / ${n} Titel` + (sek > 0 ? ` · ${dauerText(sek)} Laufzeit` : '');
  }
  return [`${n} ${a.art === 'person' ? (n === 1 ? 'Person' : 'Personen') : 'Titel'}`, 'Fläche nach ' + a.m.name,
          'gegliedert nach ' + a.gl.name.replace(/:.*$/, ''), monat].join(' · ');
}

/* Die Legende des Schaums, wie sie im Panel steht: Farbe und Name je Areal. */
function legendenEintraege(){
  return [...document.querySelectorAll('#schaumlegende .zeile')].map(z => {
    const i = z.querySelector('i'), b = z.querySelector('b');
    return i && b ? { farbe: i.style.background || '#888', name: b.textContent.trim() } : null;
  }).filter(Boolean);
}
/* Breite in em, gemessen in der Druckgroesse mm (die Seite rechnet in Millimetern; 96/25,4 Punkte je mm) - vorher bei 100 px mit
   Zuschlaegen 1,12 und 1,15: die Systemschrift des Mac wird klein gesetzt breiter (bei 1-2 mm Schrift bis 22 %), die Zuschlaege
   reichten fuer das Verzeichnis nicht einmal (Wiedervorlage §77, 07.10.2026). */
const messen = (() => { const c = document.createElement('canvas').getContext('2d');
  return (t, gewicht = 400, mm = null) => { const px = mm ? Math.max(1, mm * 96 / 25.4) : 100; c.font = `${gewicht} ${px.toFixed(2)}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`; return c.measureText(t).width / px; }; })();
/* TRIPTYCHON: die beiden Wandfugen in Millimetern der Seite - dort schneidet das PDF jede Tafel zu, was darauf liegt, fehlt im
   Druck (Wiedervorlage §77: „keine Textsetzung kennt die Wandfugen"). freieStrecken: [a, b] ohne die Fugen. */
function wandFugen(g){
  return g && g.tri ? [1, 2].map(j => { const fx = BESCHNITT + j * g.tri.pw + (j - 1) * g.tri.fuge; return [fx, fx + g.tri.fuge]; }) : [];
}
function freieStrecken(a, b, fugen){
  let teile = [[a, b]];
  for (const [f0, f1] of fugen) teile = teile.flatMap(([u, v]) => f1 <= u || f0 >= v ? [[u, v]] : [[u, Math.min(v, f0)], [Math.max(u, f1), v]].filter(([p, q]) => q > p));
  return teile;
}

async function bauen(g){
  if (!aktuell) return;
  const lauf = ++bauLauf, blatt = el('ps-blatt'); if (!blatt) return;
  const s = schaumFarbeAnteil / 100, kv = g.karte;
  /* Vorschau-Massstab fuer den Bildvorrat: Bildschirmpunkte je Schaum-Einheit */
  const pxBreite = blatt.clientWidth || 800, massstab = (pxBreite * (kv.w / g.PW)) / aktuell.res.width * (window.devicePixelRatio || 1);
  const druck = { titel: E.titel, fugen: E.fugen, wackeln: E.wackeln, schatten: E.schatten, vignette: E.vignette, kissen: E.kissen,
                  deck: (Math.max(0, 2 * s - 1) * 0.65).toFixed(3), ton: Math.min(1, 2 * s).toFixed(3), massstab,
                  verzeichnis: !!g.verz, mmJeEinheit: Math.min(kv.w / aktuell.res.width, kv.h / aktuell.res.height) };
  { const k = druck.mmJeEinheit, ox = kv.x + (kv.w - aktuell.res.width * k) / 2;             /* die Fugen in Schaum-Einheiten */
    druck.waende = wandFugen(g).map(([a, b]) => [(a - ox) / k, (b - ox) / k]); }
  const la = schaumLetzterAuftrag && schaumLetzterAuftrag.art === aktuell.art ? schaumLetzterAuftrag : null;
  if (!la){ standSetzen('Bitte den Schaum einmal anzeigen lassen, dann das Plakat öffnen.'); return; }
  /* Erst die Bilder, dann das Plakat (Caspar_D, 07.10.2026: keine mindere Qualitaet) - meist schon bereit,
     denn der Schaum war vorher zu sehen; sonst „Bilder werden vorbereitet …" wie im Haus (bilderBereit). */
  let skHinweis = '', refrains = [];
  if (E.skizze){
    /* Skizzenbuch: statt der Cover die Federzeichnungen (auf dem Server gerechnet); die Schrift muss vor dem Messen geladen sein */
    const [fb] = await Promise.all([federBereit(aktuell.j.zeilen, t => { if (lauf === bauLauf) standSetzen(t); }, () => lauf !== bauLauf), schriftGeladen()]);
    if (lauf !== bauLauf) return;
    refrains = await refrainsHolen(aktuell.j.zeilen, E.refrains || 'herzen'); if (lauf !== bauLauf) return;
    druck.skizze = { papier: skizzePapier(), feder: fb.karte, mass: SKIZZE_MASS, fsMin: 2.6 * g.kurz / 500, fsMax: 12 * g.kurz / 500, strich: 0.29 * g.kurz / 500, linie: 0.25 * g.kurz / 500 };
    Object.assign(druck, { kissen: false, schatten: 0, vignette: 0, wackeln: 0 });
    skHinweis = fb.hinweis || (skizzePapier() !== E.grund ? 'Feder braucht hellen Grund – das Plakat bleibt auf Pergament.' : '');
  } else {
  const bereit = await bilderBereit(aktuell.art, aktuell.j.zeilen, t => { if (lauf === bauLauf) standSetzen(t); });
  if (lauf !== bauLauf) return;
  if (bereit === 'morgenlauf'){ standSetzen('Schaum kommt mit dem nächsten Morgenlauf.'); return; }
  }
  standSetzen(skHinweis);
  let { svg, verzeichnis, areale } = await schaumSvgBauen(aktuell.res, { zeilen: aktuell.j.zeilen, ebenen: aktuell.j.ebenen, farbeVon: la.farbeVon, gezoomt: la.gezoomt, art: aktuell.art, druck });
  if (lauf !== bauLauf) return;
  if (areale) randArealFarben = new Map(areale.map(a => [a.name, a.farbe]));
  svg = svg.replace('<rect width="100%" height="100%" fill="#121417"/>', '')
           .replace('<svg ', `<svg class="ps-schaum" x="${kv.x.toFixed(2)}" y="${kv.y.toFixed(2)}" width="${kv.w.toFixed(2)}" height="${kv.h.toFixed(2)}" `);
  svg = eigeneIds(svg, 'ps-');
  const fg = schrift(), leise = schriftLeise();
  /* Federstrich: eine Haarlinie einige Millimeter um die Karte, auf dem Passepartout */
  const d = 0.011 * g.kurz;
  const feder = E.feder && !E.schild ? `<rect x="${(kv.x - d).toFixed(2)}" y="${(kv.y - d).toFixed(2)}" width="${(kv.w + 2 * d).toFixed(2)}" height="${(kv.h + 2 * d).toFixed(2)}" fill="none" stroke="${fg}" stroke-opacity="0.75" stroke-width="${E.federMm}"/>` : '';
  /* Museumsschild im unteren Rand: links Titel und Untertitel, rechts die Legende in Spalten */
  const ux = kv.x, zy = kv.y + kv.h + (E.feder ? d : 0) + g.rand * 0.4, uy = kv.y + kv.h + (E.feder ? d : 0) + g.rand * 0.5 + g.zeitH, rechts = kv.x + kv.w;
  let kopf = E.schild || E.skizze ? '' : `<text class="ps-kopf" x="${ux.toFixed(2)}" y="${(uy + g.T).toFixed(2)}" font-size="${g.T.toFixed(2)}" font-weight="600" fill="${fg}">${esc2(E.kopfTitel || '')}</text>`
    + `<text class="ps-kopf" x="${ux.toFixed(2)}" y="${(uy + g.T * 1.25 + g.U * 1.25).toFixed(2)}" font-size="${g.U.toFixed(2)}" fill="${leise}">${esc2(E.kopfUnter || '')}</text>`;
  /* Legende rechts im Schild, in Spalten von oben nach unten. Gesetzt wird in zwei Schritten: erst ins Bild,
     dann die wirkliche Textlaenge gemessen und die Spalten von rechts her ausgerichtet (legendeSetzen) - eine
     Leinwand misst mit einer anderen Schrift als das SVG (gesehen: 22 % zu schmal, die Spalten ueberlappten). */
  let legende = null;
  if (E.legende && !E.schild && !E.skizze){
    const eintraege = legendenEintraege(), L = g.L, q = L * 0.95, zeileH = L * 1.75;
    const hoehe = Math.max(zeileH, g.verz ? g.schildH : g.h + BESCHNITT - g.rand * 0.6 - uy);
    const proSpalte = Math.max(1, Math.floor(hoehe / zeileH));
    legende = { rechts, oben: uy, L, abstand: L * 1.6 };
    eintraege.forEach((e, i) => {
      const c = Math.floor(i / proSpalte), r = i % proSpalte, y = uy + r * zeileH;
      kopf += `<g class="ps-leg" data-s="${c}"><rect x="0" y="${(y + (zeileH - q) / 2 - L * 0.15).toFixed(2)}" width="${q.toFixed(2)}" height="${q.toFixed(2)}" rx="${(q * 0.18).toFixed(2)}" fill="${e.farbe}"/>`
        + `<text x="${(q + L * 0.5).toFixed(2)}" y="${(y + zeileH * 0.5 + L * 0.35).toFixed(2)}" font-size="${L.toFixed(2)}" fill="${fg}">${esc2(e.name)}</text></g>`;
    });
  }
  if (g.zeitH) kopf += zeitleisteSetzen(aktuell.j.zeilen, la.farbeVon, ux, rechts, zy, g.zeitH * 0.8, fg, leise, g.kurz, wandFugen(g));
  /* Edition im unteren Rand: unter dem Inhalt, aber sicher innerhalb des Beschnitts */
  if (E.edition && !E.schild && !E.skizze) kopf += editionSetzen(g, rechts, Math.min(uy + g.schildH + (g.verz ? g.rand * 0.4 + g.verz.hoehe : 0) + g.rand * 0.32, BESCHNITT + g.h - g.rand * 0.22), fg, leise);
  if (E.areale && !E.schild && !E.skizze && areale && areale.length > 1) kopf += arealeSetzen(areale, g, kv, aktuell.res, E.feder ? d : 0);
  if (g.verz && verzeichnis) kopf += verzeichnisSetzen(verzeichnis, g, ux, uy + g.schildH + g.rand * 0.4, fg, leise);
  if (E.schild && aktuell.schild && aktuell.ecke === eckeJetzt()) kopf += eckeSetzen(g, fg, leise);
  if (E.skizze && g.skizze && aktuell.skizze) kopf += skizzeSchmuck(g, refrains, la.gezoomt && areale ? areale.map(a => ({ name: a.name, farbe: a.farbe })) : legendenEintraege());
  /* Triptychon: die Wandfugen in der Vorschau abgedunkelt, mit Schnittlinien - im PDF fallen sie ohnehin weg */
  if (g.tri) for (let j = 1; j < 3; j++){ const fx = BESCHNITT + j * g.tri.pw + (j - 1) * g.tri.fuge;
    kopf += `<rect class="ps-trifuge" x="${fx.toFixed(2)}" y="0" width="${g.tri.fuge.toFixed(2)}" height="${g.PH.toFixed(2)}" fill="#08090b" fill-opacity="0.9"/>`; }
  const seite = `<svg class="ps-seite" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g.PW.toFixed(2)} ${g.PH.toFixed(2)}" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif">`
    + `<rect width="${g.PW.toFixed(2)}" height="${g.PH.toFixed(2)}" fill="${g.skizze ? skizzePapier() : E.grund}"/>` + (g.randKante ? '<g class="ps-randbild"></g>' : '') + (g.skizze && aktuell.skizze ? skizzeGrund(g) : '') + feder + svg + kopf
    + `<rect class="ps-beschnitt" x="${BESCHNITT}" y="${BESCHNITT}" width="${(g.PW - 2 * BESCHNITT).toFixed(2)}" height="${(g.PH - 2 * BESCHNITT).toFixed(2)}" fill="none" stroke="#8a929c" stroke-width="${(g.kurz / 900).toFixed(2)}" stroke-dasharray="${(g.kurz / 120).toFixed(2)} ${(g.kurz / 160).toFixed(2)}"/>`
    + (g.randKante && g.randKante.umschlag ? `<rect class="ps-beschnitt ps-falz" x="${g.vorne.x}" y="${g.vorne.y}" width="${g.w}" height="${g.h}" fill="none" stroke="#c9ced6" stroke-opacity="0.7" stroke-width="${(g.kurz / 1200).toFixed(2)}" stroke-dasharray="${(g.kurz / 300).toFixed(2)} ${(g.kurz / 200).toFixed(2)}"/>` : '') + '</svg>';
  blatt.innerHTML = seite;
  einpassen();
  if (g.randKante) randSetzen(g, la, lauf);
  if (legende) legendeSetzen(blatt.querySelector('svg.ps-seite'), legende);
  /* Rauchglas je Kopf nach Bedarf, wie am Schirm */
  const schaum = blatt.querySelector('svg.ps-schaum');
  if (E.titel === 'rauch' && schaum && typeof schaumRauch === 'function') schaumRauch(schaum);
  if (E.titel === 'kante' && schaum && typeof schaumKantenKontrast === 'function') schaumKantenKontrast(schaum, schaumFarbeAnteil / 100);   /* schwarz oder weiss nach dem Grund */
  const fm = FORMATE.find(x => x.id === E.format) || {};
  el('ps-mass').textContent = g.tri ? `drei Rahmen je ${(g.tri.pw / 10).toLocaleString('de-DE')} × ${(g.tri.ph / 10).toLocaleString('de-DE')} cm, Fuge ${(g.tri.fuge / 10).toLocaleString('de-DE')} cm · 3 mm Beschnitt` : fm.bild ? `1080 × ${Math.round(1080 * g.h / g.w)} Punkte · PNG`
    : g.randKante && g.randKante.umschlag ? `${(g.w / 10).toLocaleString('de-DE')} × ${(g.h / 10).toLocaleString('de-DE')} cm + ${(g.randKante.umschlag / 10).toLocaleString('de-DE')} cm Umschlag = ${((g.w + 2 * g.randKante.umschlag) / 10).toLocaleString('de-DE')} × ${((g.h + 2 * g.randKante.umschlag) / 10).toLocaleString('de-DE')} cm · 3 mm Beschnitt`
    : `${(g.w / 10).toLocaleString('de-DE')} × ${(g.h / 10).toLocaleString('de-DE')} cm · 3 mm Beschnitt`;
}
/* Das Plakat steht im selben Dokument wie der Klangschaum dahinter, und beide tragen dieselben IDs
   (skz0 … Zuschnitt je Zelle, skkissen, hatch). url(#skz0) traefe dann den Zuschnitt der Zelle am
   Schirm - die Bilder sassen in fremden Umrissen, die Glasbaender fehlten. Darum bekommt jede ID
   des Plakats einen eigenen Vorsatz, samt allen Verweisen (url(#…), href="#…"). */
function eigeneIds(svg, vor){
  const ids = new Set([...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  if (!ids.size) return svg;
  const weg = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const muster = new RegExp('(\\sid="|url\\(#|href="#)(' + [...ids].map(weg).join('|') + ')(?=[")])', 'g');
  return svg.replace(muster, (_, a, id) => a + vor + id);
}
/* DAS WERKVERZEICHNIS setzen: ueber die volle Breite in Spalten, von oben nach unten und dann nach rechts; je
   Areal ein Kopf mit Farbquadrat, dann die Nummern (rechtsbuendig, leise) mit den Titeln. Ein Kopf steht nie
   allein am Fuss einer Spalte. Zu lange Titel werden mit … gekuerzt (Leinwandmass mal 1,15 - sie misst etwas zu
   schmal). Reichen die Zeilen mit den echten Arealen nicht, wird die Schrift kleiner, bis der Block passt. */
/* AREALE AM RAND (Caspar_D, 06.10.2026: „Beschriftet wird um das Bild herum in der Farbe des Areals, dort wo der
   Rand dem Areal am nächsten ist"). Je Areal sein Name in seiner Farbe im Passepartout - an der Seite, an der es den
   Kartenrand am laengsten beruehrt, mittig ueber dem laengsten Stueck; oben waagerecht, links und rechts entlang der
   Kante wie auf einer Landkarte (so passen auch lange Namen in einen schmalen Rand). Unten steht das Schild, dort
   nicht. Ein haarfeiner Strich in der Farbe fuehrt zur Kante; beruehrt ein Areal den Rand nicht (oder nur unten),
   fuehrt er bis zu seiner naechsten Stelle. Stehen zwei Namen auf derselben Seite zu dicht, ruecken sie auseinander. */
function arealeSetzen(areale, g, kv, res, feder){
  const k = Math.min(kv.w / res.width, kv.h / res.height), ox = kv.x + (kv.w - res.width * k) / 2, oy = kv.y + (kv.h - res.height * k) / 2;
  const R = { x0: ox, y0: oy, x1: ox + res.width * k, y1: oy + res.height * k };
  const fs = Math.min(g.rand * 0.4, 0.0092 * g.kurz), eps = 0.004 * g.kurz, abstand = feder + fs * 0.6, sw = (g.kurz / 2600).toFixed(2);
  const marken = [];
  for (const a of areale){
    const P = a.pts.map(p => [ox + p[0] * k, oy + p[1] * k]);
    const kontakt = { oben: [], links: [], rechts: [] }, auf = (v, w) => Math.abs(v - w) < eps;
    for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i + 1) % P.length];
      if (auf(p[1], R.y0) && auf(q[1], R.y0)) kontakt.oben.push([Math.min(p[0], q[0]), Math.max(p[0], q[0])]);
      if (auf(p[0], R.x0) && auf(q[0], R.x0)) kontakt.links.push([Math.min(p[1], q[1]), Math.max(p[1], q[1])]);
      if (auf(p[0], R.x1) && auf(q[0], R.x1)) kontakt.rechts.push([Math.min(p[1], q[1]), Math.max(p[1], q[1])]); }
    let seite = null, anker = 0, ziel = null, best = 0;
    for (const sd of ['oben', 'links', 'rechts']){
      const zus = []; for (const v of kontakt[sd].sort((p, q) => p[0] - q[0])){ const z = zus[zus.length - 1]; if (z && v[0] <= z[1] + eps) z[1] = Math.max(z[1], v[1]); else zus.push(v.slice()); }
      for (const v of zus) if (v[1] - v[0] > best){ best = v[1] - v[0]; seite = sd; anker = (v[0] + v[1]) / 2; }
    }
    if (!seite){ let bd = Infinity;
      for (const p of P) for (const [sd, dd] of [['oben', p[1] - R.y0], ['links', p[0] - R.x0], ['rechts', R.x1 - p[0]]]) if (dd < bd){ bd = dd; seite = sd; anker = sd === 'oben' ? p[0] : p[1]; ziel = p; } }
    marken.push({ seite, anker, ziel, text: a.name, lang: (messen(a.name, 600, fs) + 0.02 * a.name.length) * fs, farbe: a.farbe });
  }
  for (const sd of ['oben', 'links', 'rechts']){
    const ms = marken.filter(m => m.seite === sd).sort((p, q) => p.anker - q.anker); if (!ms.length) continue;
    const lo = sd === 'oben' ? R.x0 : R.y0, hi = sd === 'oben' ? R.x1 : R.y1, luft = fs * 1.4;
    ms.forEach(m => { m.pos = Math.min(hi - m.lang / 2, Math.max(lo + m.lang / 2, m.anker)); });
    const fugen = sd === 'oben' ? wandFugen(g) : [];
    if (!fugen.length){
      for (let i = 1; i < ms.length; i++){ const min = ms[i - 1].pos + ms[i - 1].lang / 2 + luft + ms[i].lang / 2; if (ms[i].pos < min) ms[i].pos = min; }
      for (let i = ms.length - 2; i >= 0; i--){ const max = ms[i + 1].pos - ms[i + 1].lang / 2 - luft - ms[i].lang / 2; if (ms[i].pos > max) ms[i].pos = max; }
      continue;
    }
    /* Triptychon (Wiedervorlage §77): von links nach rechts, jeder Name so nah an seinem Anker wie moeglich, nicht ueber dem
       vorigen - laege er auf einer Wandfuge, springt er dahinter. Rueckwaerts dann nur, was ueber den rechten Rand ragt; auch
       das springt vor eine Fuge statt auf sie. (Erster Versuch, „auf die naehere Seite": zwei Namen drängten sich vor dieselbe
       Fuge, stiessen aneinander, und der zweite lag doch darauf.) */
    const aufFuge = (p, m) => fugen.find(([f0, f1]) => p + m.lang / 2 > f0 - luft / 2 && p - m.lang / 2 < f1 + luft / 2);
    let cursor = lo;
    for (const m of ms){
      let p = Math.max(m.anker, cursor + m.lang / 2, lo + m.lang / 2);
      for (let k = 0, f; k < 3 && (f = aufFuge(p, m)); k++) p = f[1] + luft / 2 + m.lang / 2;
      m.pos = p; cursor = p + m.lang / 2 + luft;
    }
    for (let i = ms.length - 1; i >= 0; i--){ const m = ms[i];
      const max = Math.min(hi - m.lang / 2, i < ms.length - 1 ? ms[i + 1].pos - ms[i + 1].lang / 2 - luft - m.lang / 2 : Infinity);
      if (m.pos > max){ let p = max; const f = aufFuge(p, m); if (f) p = f[0] - luft / 2 - m.lang / 2; m.pos = p; } }
  }
  const f2 = (v) => v.toFixed(2), strich = (m, a, b, c, d2) => `<line x1="${f2(a)}" y1="${f2(b)}" x2="${f2(c)}" y2="${f2(d2)}" stroke="${m.farbe}" stroke-width="${sw}" stroke-opacity="0.9"/>`;
  let out = '';
  for (const m of marken){
    const schrift = `font-size="${f2(fs)}" font-weight="600" fill="${m.farbe}" text-anchor="middle" letter-spacing="${f2(fs * 0.02)}"`;
    if (m.seite === 'oben'){
      const ty = R.y0 - abstand;
      out += `<text x="${f2(m.pos)}" y="${f2(ty)}" ${schrift}>${esc2(m.text)}</text>` + strich(m, m.pos, ty + fs * 0.3, m.anker, R.y0);
      if (m.ziel) out += strich(m, m.anker, R.y0, m.ziel[0], m.ziel[1]);
    } else {
      const links = m.seite === 'links', tx = links ? R.x0 - abstand : R.x1 + abstand, kante = links ? R.x0 : R.x1;
      out += `<text transform="translate(${f2(tx)} ${f2(m.pos)}) rotate(${links ? -90 : 90})" ${schrift}>${esc2(m.text)}</text>`
        + strich(m, tx + (links ? 1 : -1) * fs * 0.3, m.pos, kante, m.anker);
      if (m.ziel) out += strich(m, kante, m.anker, m.ziel[0], m.ziel[1]);
    }
  }
  return out;
}
/* ZEITLEISTE (Brainstorm, von Caspar_D angekreuzt): unter der Karte je Titel ein Strich in der Farbe seines Areals,
   an der Stelle seines Erstellungsdatums - man sieht, wann welche Richtung dran war. Darunter die Jahre (bei weniger
   als zwei Jahren die Monate). Titel ohne Datum fehlen hier, nicht in der Karte. */
function zeitleisteSetzen(zeilen, farbeVon, x0, x1, y0, hoehe, fg, leise, kurz, fugen = []){
  const daten = zeilen.map(z => { const so = typeof song === 'function' ? song(z.id) : null, t = so && Date.parse(so.erstellt);
    return t ? { t, farbe: (farbeVon && farbeVon(z.gruppe)) || '#888' } : null; }).filter(Boolean).sort((a, b) => a.t - b.t);
  if (daten.length < 2) return '';
  /* Triptychon: die Zeitachse laeuft ueber die freien Strecken und springt ueber die Fugen - kein Strich, keine Marke faellt
     in einen Schnitt (Wiedervorlage §77) */
  const strecken = freieStrecken(x0, x1, fugen), frei = strecken.reduce((s, [a, b]) => s + b - a, 0);
  const t0 = daten[0].t, t1 = daten[daten.length - 1].t, sp = Math.max(1, t1 - t0);
  const X = (t) => { let rest = (t - t0) / sp * frei; for (const [a, b] of strecken){ if (rest <= b - a) return a + rest; rest -= b - a; } return x1; };
  const strecke = (x) => strecken.find(([a, b]) => x >= a - 1e-6 && x <= b + 1e-6) || [x0, x1];
  const strichH = hoehe * 0.58, sw = Math.max(0.12, Math.min((x1 - x0) / daten.length * 0.7, kurz / 1000)), ls = hoehe * 0.26, f2 = (v) => v.toFixed(2);
  let out = strecken.map(([a, b]) => `<line x1="${f2(a)}" y1="${f2(y0 + strichH)}" x2="${f2(b)}" y2="${f2(y0 + strichH)}" stroke="${leise}" stroke-width="${f2(kurz / 3000)}"/>`).join('');
  for (const d of daten) out += `<line x1="${f2(X(d.t))}" y1="${f2(y0)}" x2="${f2(X(d.t))}" y2="${f2(y0 + strichH)}" stroke="${d.farbe}" stroke-width="${f2(sw)}" stroke-opacity="0.9"/>`;
  /* Marken: Jahresanfaenge, bei kurzer Spanne Monatsanfaenge */
  const a = new Date(t0), monate = (t1 - t0) < 2 * 365.25 * 864e5, marken = [];
  for (let d = new Date(a.getFullYear(), monate ? a.getMonth() + 1 : 0, 1); d.getTime() <= t1; d = new Date(d.getFullYear() + (monate ? 0 : 1), monate ? d.getMonth() + 1 : 0, 1))
    if (d.getTime() > t0) marken.push(d);
  for (const d of marken){ const x = X(d.getTime()), wort = String(monate ? d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }) : d.getFullYear());
    const [sa, sb] = strecke(x), halb = messen(wort, 400, ls) * ls / 2, tx = Math.min(sb - halb, Math.max(sa + halb, x));   /* die Marke bleibt in ihrer Strecke */
    out += `<line x1="${f2(x)}" y1="${f2(y0 + strichH)}" x2="${f2(x)}" y2="${f2(y0 + strichH + ls * 0.5)}" stroke="${leise}" stroke-width="${f2(kurz / 3000)}"/>`
      + `<text x="${f2(tx)}" y="${f2(y0 + strichH + ls * 1.55)}" font-size="${f2(ls)}" fill="${leise}" text-anchor="middle">${wort}</text>`; }
  return out;
}
/* EDITION UND SIGNATUR (angekreuzt): rechts unten klein „Auflage · Datum · Name", davor eine Haarlinie zum
   Signieren von Hand. Der Name kommt aus dem Profil; die Auflage ist ein Feld (Vorgabe 1/1). */
function editionText(){
  const p = profil();
  return [E.auflage || '1/1', new Date().toLocaleDateString('de-DE'), p.display_name || p.handle || ''].filter(Boolean).join(' · ');
}
function editionSetzen(g, rechts, y, fg, leise){
  const text = editionText();
  const fs = Math.min(g.rand * 0.18, 0.0062 * g.kurz), tw = messen(text, 400, fs) * fs, linie = 0.16 * g.w, x1 = rechts - tw - fs * 1.4, f2 = (v) => v.toFixed(2);
  return `<text x="${f2(rechts)}" y="${f2(y)}" font-size="${f2(fs)}" fill="${leise}" text-anchor="end">${esc2(text)}</text>`
    + `<line x1="${f2(x1 - linie)}" y1="${f2(y + fs * 0.15)}" x2="${f2(x1)}" y2="${f2(y + fs * 0.15)}" stroke="${fg}" stroke-opacity="0.7" stroke-width="${f2(g.kurz / 2800)}"/>`;
}
function verzeichnisSetzen(gruppen, g, x0, y0, fg, leise){
  const personen = aktuell && aktuell.art === 'person';
  const n = gruppen.reduce((s, q) => s + q.eintraege.length, 0);
  const zeilen = [];
  for (const q of gruppen){
    zeilen.push({ kopf: q.name, farbe: q.farbe });
    for (const e of q.eintraege) zeilen.push(e);
    if (q.weitere) zeilen.push({ rest: `und ${q.weitere.toLocaleString('de-DE')} weitere` });
  }
  /* mit den echten Arealen in den reservierten Platz, notfalls bis 1 mm Schrift */
  const fug = wandFugen(g), strecken = fug.length ? freieStrecken(x0, x0 + g.w - 2 * g.rand, fug).map(([a, b]) => [a - x0, b - a]) : null;
  const m = verzeichnisMass(n, g.w - 2 * g.rand, g.kurz, g.verz.hoehe * 1.02, gruppen.length, 1, strecken);
  const L = m.L, zh = L * 1.38, nrB = messen('0'.repeat(String(n).length), 400, L) * L;
  const kuerzen = (t, b) => { if (messen(t, 400, L) * L <= b) return t; let k = t.length; while (k > 1 && messen(t.slice(0, k) + '…', 400, L) * L > b) k--; return t.slice(0, k) + '…'; };
  let out = `<text x="${x0.toFixed(2)}" y="${(y0 + L * 1.2).toFixed(2)}" font-size="${(L * 1.1).toFixed(2)}" font-weight="600" letter-spacing="${(L * 0.06).toFixed(2)}" fill="${leise}">`
    + `${personen ? 'VERZEICHNIS DER PERSONEN' : 'WERKVERZEICHNIS'} · ${n.toLocaleString('de-DE')} ${personen ? 'Personen' : 'Titel'}</text>`;
  const oben = y0 + 2.4 * L;
  let s = 0, r = 0;
  zeilen.forEach((z, i) => {
    if (r >= m.proSpalte || (z.kopf !== undefined && r >= m.proSpalte - 1)){ s++; r = 0; }
    const sp = Math.min(s, m.xs.length - 1), x = x0 + m.xs[sp], y = oben + r * zh + L, spB = m.bs[sp], titelB = spB - nrB - 1.6 * L;
    if (z.kopf !== undefined){
      out += `<rect x="${x.toFixed(2)}" y="${(y - L * 0.78).toFixed(2)}" width="${(L * 0.8).toFixed(2)}" height="${(L * 0.8).toFixed(2)}" rx="${(L * 0.15).toFixed(2)}" fill="${z.farbe}"/>`
        + `<text x="${(x + L * 1.2).toFixed(2)}" y="${y.toFixed(2)}" font-size="${L.toFixed(2)}" font-weight="600" fill="${fg}">${esc2(kuerzen(z.kopf, spB - 2.6 * L))}</text>`;
    } else if (z.rest){
      out += `<text x="${(x + nrB + 0.6 * L).toFixed(2)}" y="${y.toFixed(2)}" font-size="${L.toFixed(2)}" font-style="italic" fill="${leise}">${esc2(z.rest)}</text>`;
    } else {
      out += `<text x="${(x + nrB).toFixed(2)}" y="${y.toFixed(2)}" font-size="${L.toFixed(2)}" text-anchor="end" fill="${leise}" style="font-variant-numeric:tabular-nums">${z.nr}</text>`
        + `<text x="${(x + nrB + 0.6 * L).toFixed(2)}" y="${y.toFixed(2)}" font-size="${L.toFixed(2)}" fill="${fg}">${esc2(kuerzen(z.titel, titelB))}</text>`;
    }
    r++;
  });
  return out;
}
function legendeSetzen(svg, { rechts, oben, abstand }){
  const gruppen = [...svg.querySelectorAll('g.ps-leg')], spalten = [];
  for (const g of gruppen){ const s = +g.dataset.s, t = g.querySelector('text'), r = g.querySelector('rect');
    const breite = (+t.getAttribute('x')) + t.getComputedTextLength(); (spalten[s] = spalten[s] || { breite: 0, g: [] }).g.push(g); spalten[s].breite = Math.max(spalten[s].breite, breite); }
  const gesamt = spalten.reduce((a, s) => a + s.breite, 0) + (spalten.length - 1) * abstand;
  /* Platz rechts vom Titel: bei schmalem Rand (Papier) passt nur eine Zeile je Spalte, die Spalten
     stehen nebeneinander und liefen frueher nach links ueber den Titel. Dann wird die Legende um ihre
     rechte obere Ecke verkleinert, bis sie neben den Titel passt. */
  const links = Math.max(0, ...[...svg.querySelectorAll('text.ps-kopf')].map(t => (+t.getAttribute('x')) + t.getComputedTextLength()));
  const frei = rechts - links - abstand * 1.5;
  const f = gesamt > frei && frei > 0 ? Math.max(0.45, frei / gesamt) : 1;
  const um = f < 1 ? `translate(${rechts.toFixed(2)} ${oben.toFixed(2)}) scale(${f.toFixed(3)}) translate(${(-rechts).toFixed(2)} ${(-oben).toFixed(2)}) ` : '';
  let x = rechts - gesamt;
  for (const s of spalten){ for (const g of s.g) g.setAttribute('transform', `${um}translate(${x.toFixed(2)} 0)`); x += s.breite + abstand; }
}
/* Die Seite in die Buehne einpassen (Bildschirmpunkte), die Wand-Vorschau mitfuehren. */
function einpassen(){
  const b = el('ps-buehne'), s = el('ps-blatt') && el('ps-blatt').querySelector('svg.ps-seite'); if (!b || !s) return;
  const g = geometrie(), bw = b.clientWidth - 48, bh = b.clientHeight - 64, k = Math.min(bw / g.PW, bh / g.PH);
  s.style.width = (g.PW * k).toFixed(0) + 'px'; s.style.height = (g.PH * k).toFixed(0) + 'px';
  const wand = el('ps-wand'); if (wand){
    const M = 1750, H = 2600, sk = 120 / H, pw = g.w * sk, ph = g.h * sk, x0 = H * 0.35 * sk, y0 = 120 - 1450 * sk - ph / 2;
    const papier = g.skizze ? skizzePapier() : E.grund;
    const rahmen = g.tri ? [0, 1, 2].map(j => `<rect x="${(x0 + j * (g.tri.pw + g.tri.fuge) * sk).toFixed(1)}" y="${y0.toFixed(1)}" width="${(g.tri.pw * sk).toFixed(1)}" height="${ph.toFixed(1)}" fill="${papier}" stroke="#111" stroke-width="0.6"/>`).join('')
      : `<rect x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${pw.toFixed(1)}" height="${ph.toFixed(1)}" fill="${papier}" stroke="#111" stroke-width="0.6"/>`;
    wand.innerHTML = `<svg viewBox="0 0 ${(Math.max(H * 1.4, H * 0.35 + g.w + 900) * sk).toFixed(1)} 120" width="100%" height="120"><rect width="100%" height="120" fill="#2b2723"/>` + rahmen
      + `<rect x="${(H * 0.35 * sk + pw + 300 * sk).toFixed(1)}" y="${(120 - M * sk).toFixed(1)}" width="${(380 * sk).toFixed(1)}" height="${(M * sk).toFixed(1)}" rx="${(190 * sk).toFixed(1)}" fill="#59616b"/></svg>`;
  }
}

/* VERKLEINERN IN STUFEN mit hoher Qualität: in einem Schritt (ohne imageSmoothingQuality) zerfallen feine Linien - die
   Federzeichnungen des Skizzenbuchs kamen im Bild-Export als Punktwolken heraus. Halbiert wird, bis höchstens das Doppelte übrig ist. */
function verkleinert(b, w, h){
  let quelle = b, qw = b.width, qh = b.height;
  while (qw > 2 * w && qh > 2 * h){ const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(qw / 2)); c.height = Math.max(1, Math.round(qh / 2));
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(quelle, 0, 0, c.width, c.height); quelle = c; qw = c.width; qh = c.height; }
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(quelle, 0, 0, w, h); return c;
}
/* DRUCKBILDER: jedes Bild nur so gross, wie seine Kachel bei 300 dpi braucht. Mit den Originalen (499 Cover,
   rund 420 MB) hing der Druck; so wird jedes Original einmal verkleinert. Ein Cover fuellt seine Kachel mit
   „slice", seine lange Seite braucht darum ein Drittel mehr als die laengere Kachelseite (3 : 4). Ist ein
   Bild schon klein genug, bleibt seine Adresse; ist es nicht zu laden (fremder Avatar ohne CORS), auch. */
let druckAdressen = [];
async function druckBilder(s, kopie, g){
  druckAdressen.forEach(u => URL.revokeObjectURL(u)); druckAdressen = [];
  const mmProPunkt = g.PW / s.getBoundingClientRect().width, PX_PRO_MM = 300 / 25.4, bedarf = new Map();
  for (const im of s.querySelectorAll('image[data-voll]')){
    const r = im.getBoundingClientRect(), u = im.getAttribute('data-voll');
    bedarf.set(u, Math.max(bedarf.get(u) || 0, Math.ceil(Math.max(r.width, r.height) * mmProPunkt * PX_PRO_MM * 1.34)));
  }
  const liste = [...bedarf], gesamt = liste.length, neu = new Map(); let n = 0;
  const eins = async ([u, lang]) => {
    try {
      const roh = await (await fetch(u, { mode: 'cors', credentials: 'omit' })).blob();
      const b = await createImageBitmap(roh), f = lang / Math.max(b.width, b.height);
      if (f < 1){
        const w = Math.max(1, Math.round(b.width * f)), h = Math.max(1, Math.round(b.height * f));
        const c = verkleinert(b, w, h);
        const blob = await new Promise(ok => roh.type === 'image/jpeg' ? c.toBlob(ok, 'image/jpeg', 0.9) : c.toBlob(ok, 'image/png'));   /* PNG/WebP/GIF: Transparenz behalten */
        if (blob){ const a = URL.createObjectURL(blob); neu.set(u, a); druckAdressen.push(a); }
      }
      if (b.close) b.close();
    } catch (e) {}
    standSetzen(`Bilder für den Druck: ${++n} von ${gesamt}`);
  };
  await Promise.all(Array.from({ length: 3 }, async () => { while (liste.length) await eins(liste.shift()); }));
  /* Das Original bekommt seinen eigenen Platz (data-p, schaumBildPlatz im Haus): in der Vorschau steht die Kachel,
     deren Bildteil genau dort liegt - so zeigt das PDF denselben Ausschnitt wie die Vorschau. */
  kopie.querySelectorAll('image[data-voll]').forEach(im => { const u = im.getAttribute('data-voll'); im.setAttribute('href', neu.get(u) || u);
    const p = (im.getAttribute('data-p') || '').split(','); if (p.length === 4){ im.setAttribute('x', p[0]); im.setAttribute('y', p[1]); im.setAttribute('width', p[2]); im.setAttribute('height', p[3]); } });
}

/* ALS BILD SICHERN (PNG, 1080 Punkte breit). Ein SVG, das als Bild gemalt wird, darf nichts nachladen - darum wird
   jedes Cover auf die Groesse gerechnet, die es im Bild hat (mal 1,5), und als data:-Adresse eingebettet; dann malt
   der Browser die Seite auf eine Leinwand. Ohne Beschnitt: der Ausschnitt ist genau das Format. Filter (Glas, Kissen)
   und weiche Mischung malt der Browser mit. */
async function bildSichern(){
  const blatt = el('ps-blatt'), s = blatt && blatt.querySelector('svg.ps-seite'); if (!s) return;
  const g = geometrie(aktuell ? aktuell.j.zeilen.length : 0), B = 1080, H = Math.round(B * g.h / g.w), k = B / g.w;
  const kopie = s.cloneNode(true);
  kopie.querySelectorAll('.ps-beschnitt').forEach(n => n.remove());
  kopie.setAttribute('viewBox', `${BESCHNITT} ${BESCHNITT} ${g.w} ${g.h}`); kopie.setAttribute('width', B); kopie.setAttribute('height', H); kopie.removeAttribute('style');
  /* der Rand fürs Bild eigens gemalt, in der Auflösung des Bildes (vorher die grobe Vorschau, hochgezogen - Fallensuche 1.0.60) */
  const randZiel = kopie.querySelector('g.ps-randbild');
  if (randZiel && g.randKante && aktuell && schaumLetzterAuftrag){
    standSetzen('Der Rand wird gemalt …');
    try { const st = await randRechnen(randAuftrag(g, schaumLetzterAuftrag.farbeVon, Math.min(10, Math.ceil(k * 1.5 * 2) / 2)));
      const daten = await Promise.all(st.map(x => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => ok(null); r.readAsDataURL(x.blob); })));
      randZiel.innerHTML = randBilder(st, daten); } catch (e){ console.log('Plakat, Rand:', e); }
  }
  const bilder = [...kopie.querySelectorAll('image')].filter(i => !i.classList.contains('ps-rand')), echt = [...s.querySelectorAll('image')].filter(i => !i.classList.contains('ps-rand')), seite = s.getBoundingClientRect(), proPunkt = B / seite.width * (g.PW / g.w);
  let n = 0; const cache = new Map();
  const daten = async (u, px) => {
    const schl = u + '|' + px; if (cache.has(schl)) return cache.get(schl);
    let aus = null;
    try { const roh = await (await fetch(u)).blob(), b = await createImageBitmap(roh), f = Math.min(1, px / Math.max(b.width, b.height));
      const c = verkleinert(b, Math.max(1, Math.round(b.width * f)), Math.max(1, Math.round(b.height * f))); if (b.close) b.close();
      aus = roh.type === 'image/jpeg' ? c.toDataURL('image/jpeg', 0.86) : c.toDataURL('image/png'); } catch (e) {}   /* Transparenz (Avatar) behalten */
    cache.set(schl, aus); return aus;
  };
  for (let i = 0; i < bilder.length; i++){
    standSetzen(`Das Bild wird gerechnet … ${++n} von ${bilder.length}`);
    const r = echt[i] ? echt[i].getBoundingClientRect() : null, px = Math.min(1024, Math.max(32, Math.ceil(r ? Math.max(r.width, r.height) * proPunkt * 1.5 : 256)));
    const u = bilder[i].getAttribute('href'), d = u ? await daten(u, Math.ceil(px / 32) * 32) : null;
    if (d) bilder[i].setAttribute('href', d); else bilder[i].remove();
  }
  standSetzen('Das Bild wird gemalt …');
  if (kopie.querySelector('[font-family*="Pinyon"]')){
    try { const b = await (await fetch('/fonts/pinyon-script-400.ttf')).blob(), d = await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); });
      const st = document.createElementNS('http://www.w3.org/2000/svg', 'style'); st.textContent = `@font-face{font-family:'Pinyon Script';src:url(${d}) format('truetype')}`; kopie.insertBefore(st, kopie.firstChild); } catch (e) {}
  }
  const text = new XMLSerializer().serializeToString(kopie), url = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));
  try {
    const img = new Image(); await new Promise((ok, nein) => { img.onload = ok; img.onerror = nein; img.src = url; });
    const c = document.createElement('canvas'); c.width = B; c.height = H; c.getContext('2d').drawImage(img, 0, 0, B, H);
    const png = await new Promise(ok => c.toBlob(ok, 'image/png'));
    const a = document.createElement('a'); a.href = URL.createObjectURL(png);
    a.download = (raumJetzt === 'groupies' ? 'Groupieschaum' : 'Klangschaum') + '-' + g.name.replace(/[^\w-]+/g, '') + '.png';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 20000);
    standSetzen(`Gesichert: ${a.download} (${(png.size / 1048576).toFixed(1)} MB)`);
  } catch (e) { standSetzen('Das Bild ließ sich nicht malen.'); console.log('Plakat:', e); }
  finally { URL.revokeObjectURL(url); }
}

/* PDF: dieselbe Seite, die Bilder auf 300 dpi ihrer Kachel gerechnet (druckBilder), in einem unsichtbaren
   Rahmen, dann das Druckfenster. Ohne Beschnitt-Hilfslinie. */
async function pdf(){
  const blatt = el('ps-blatt'), s = blatt && blatt.querySelector('svg.ps-seite'); if (!s) return;
  const knopf = el('ps-pdf'); if (knopf.disabled) return; knopf.disabled = true;
  try {
  const g = geometrie(), kopie = s.cloneNode(true);
  kopie.querySelectorAll('.ps-beschnitt').forEach(n => n.remove());
  /* erst messen (druckBilder liest die Lage der Bilder in der angezeigten Seite), dann warten: ändert man während des Randmalens
     etwas im Panel, ersetzt bauen die Seite - vorher kamen dann die vollen Originale ins PDF (Fallensuche 1.0.60) */
  standSetzen('Die Bilder werden für den Druck gerechnet …');
  await druckBilder(s, kopie, g);
  /* der Rand fürs PDF fein gemalt (8 Punkte je mm) - die Vorschau trägt nur die grobe Fassung */
  const randZiel = kopie.querySelector('g.ps-randbild');
  if (randZiel && g.randKante && aktuell && schaumLetzterAuftrag){
    standSetzen('Der Rand wird für den Druck gemalt …');
    try { const st = await randRechnen(randAuftrag(g, schaumLetzterAuftrag.farbeVon, 8), f => standSetzen(`Der Rand wird für den Druck gemalt … ${Math.round(f * 100)} %`));
      druckRandAdressen.forEach(u => URL.revokeObjectURL(u)); druckRandAdressen = st.map(x => URL.createObjectURL(x.blob));
      randZiel.innerHTML = randBilder(st, druckRandAdressen); }
    catch (e){ console.log('Plakat, Rand:', e); standSetzen('Der Rand ließ sich nicht fein malen – im PDF steht die Vorschau-Fassung.'); await new Promise(ok => setTimeout(ok, 2500)); }
  }
  kopie.removeAttribute('style');
  kopie.querySelectorAll('.ps-trifuge').forEach(n => n.remove());
  const name = (raumJetzt === 'groupies' ? 'Groupieschaum' : 'Klangschaum') + '-' + g.name;
  /* Triptychon: dieselbe Seite dreimal, jede auf ihren Rahmen samt Beschnitt zugeschnitten (viewBox), je eine PDF-Seite */
  const SW = g.tri ? g.tri.pw + 2 * BESCHNITT : g.PW, SH = g.PH;
  /* je Seite nur die Bilder, die in ihren Rahmen reichen - sonst traegt jede Seite alle (103 MB statt rund 40) */
  const sr = s.getBoundingClientRect(), proEinheit = sr.width / g.PW, lagen = [...s.querySelectorAll('image')].map(i => i.getBoundingClientRect());
  const seiten = !g.tri ? kopie.outerHTML : [0, 1, 2].map(j => { const k = kopie.cloneNode(true);
    const a = sr.left + j * (g.tri.pw + g.tri.fuge) * proEinheit, b = a + SW * proEinheit;
    [...k.querySelectorAll('image')].forEach((im, i) => { const r = lagen[i]; if (r && (r.right < a || r.left > b)) im.remove(); });
    k.setAttribute('viewBox', `${(j * (g.tri.pw + g.tri.fuge)).toFixed(2)} 0 ${SW.toFixed(2)} ${SH.toFixed(2)}`); return k.outerHTML; }).join('');
  const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${esc2(name)}</title><style>@font-face{font-family:'Pinyon Script';src:url('${location.origin}/fonts/pinyon-script-400.ttf') format('truetype')}@page{size:${SW.toFixed(2)}mm ${SH.toFixed(2)}mm;margin:0}`
    + `html,body{margin:0;padding:0;background:${E.skizze ? skizzePapier() : E.grund};-webkit-print-color-adjust:exact;print-color-adjust:exact}`
    + `svg.ps-seite{display:block;width:${SW.toFixed(2)}mm;height:${SH.toFixed(2)}mm;break-after:page;page-break-after:always}svg.ps-seite:last-child{break-after:auto;page-break-after:auto}</style></head><body>${seiten}</body></html>`;
  let rahmen = el('ps-druckrahmen');
  if (rahmen) rahmen.remove();
  rahmen = document.createElement('iframe'); rahmen.id = 'ps-druckrahmen';
  rahmen.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;height:800px;border:0;visibility:hidden';
  document.body.appendChild(rahmen);
  await new Promise(ok => { rahmen.onload = ok; rahmen.srcdoc = doc; });
  const w = rahmen.contentWindow, bilder = [...new Set([...rahmen.contentDocument.querySelectorAll('image')].map(n => n.getAttribute('href')).filter(Boolean))];
  let fertig = 0;
  await Promise.race([
    Promise.all(bilder.map(u => new Promise(ok => { const i = new w.Image(); i.onload = i.onerror = () => { fertig++; standSetzen(`Druckbilder geladen: ${fertig} von ${bilder.length}`); ok(); }; i.src = u; }))),
    new Promise(ok => setTimeout(ok, 90000)),
  ]);
  standSetzen('Im Druckfenster „Als PDF sichern“ wählen.');
  w.focus(); w.print();
  } finally { knopf.disabled = false; }
}

function felderSetzen(){
  if (!studio) return;
  studio.querySelectorAll('[data-vorlage]').forEach(b => b.classList.toggle('an', b.dataset.vorlage === E.vorlage));
  studio.querySelectorAll('[data-format]').forEach(b => b.classList.toggle('an', b.dataset.format === E.format));
  studio.querySelectorAll('[data-lage]').forEach(b => b.classList.toggle('an', b.dataset.lage === E.lage));
  studio.querySelectorAll('[data-titel]').forEach(b => b.classList.toggle('an', b.dataset.titel === E.titel));
  studio.querySelectorAll('[data-grund]').forEach(b => b.classList.toggle('an', b.dataset.grund === grundArt()));
  el('ps-frei').hidden = E.format !== 'frei';
  for (const [id, v] of [['ps-freiw', E.freiW], ['ps-freih', E.freiH], ['ps-rand', Math.round(E.rand * 100)], ['ps-fugen', Math.round(E.fugen * 10)],
    ['ps-wackeln', Math.round(E.wackeln * 100)], ['ps-schatten', Math.round(E.schatten * 100)], ['ps-vignette', Math.round(E.vignette * 100)], ['ps-federmm', E.federMm],
    ['ps-farbe', E.grund], ['ps-kopftitel', E.kopfTitel], ['ps-kopfunter', E.kopfUnter], ['ps-schildname', E.schildName || '']]){ const f = el(id); if (f && document.activeElement !== f) f.value = v; }
  { const bild = !!(FORMATE.find(x => x.id === E.format) || {}).bild; el('ps-pdf').hidden = bild; el('ps-png').hidden = !bild; }
  const an = (id, v) => { const b = el(id); b.classList.toggle('an', !!v); b.setAttribute('aria-pressed', v ? 'true' : 'false'); };
  an('ps-verz', E.verzeichnis); an('ps-zeit', E.zeitleiste); an('ps-edition', E.edition); an('ps-areale', E.areale);
  an('ps-kissen', E.kissen); an('ps-feder', E.feder); an('ps-legende', E.legende);
  el('ps-zeit-grund').hidden = raumJetzt !== 'groupies';
  { const a = el('ps-auflage'); if (document.activeElement !== a) a.value = E.auflage || ''; }
  el('ps-hinweis').hidden = raumJetzt !== 'groupies';
  /* WAS NICHT GILT, WIRD GRAU MIT GRUND (Hausregel 4; Caspar_D, 07.10.2026: „mach alle sachen, die nicht ins rahmenlose design
     passen ausgegraut"): bei Randlos alles, was am Rand haengt; sonst Ecke und Name, die es nur bei Randlos gibt. */
  const grau = (knoten, aus, grund) => { if (!knoten) return; knoten.classList.toggle('ps-grau', aus); knoten.title = aus ? grund : '';
    (knoten.matches('input,button') ? [knoten] : knoten.querySelectorAll('input,button')).forEach(f => { f.disabled = aus; }); };
  const zeile = (id) => { const f = el(id); return f && (f.closest('label') || f); };
  const ohneRand = 'Gilt nicht bei Randlos – ohne Rand gibt es kein Passepartout.';
  for (const id of ['ps-rand', 'ps-feder', 'ps-federmm', 'ps-verz', 'ps-areale']) grau(zeile(id), !!E.schild, ohneRand);
  grau(el('ps-verz-text'), !!E.schild, ohneRand);
  grau(zeile('ps-zeit'), !!E.schild || raumJetzt === 'groupies', E.schild ? ohneRand : 'Im Groupieschaum gibt es kein Datum je Person.');
  el('ps-randlos-grund').hidden = !E.schild;
  studio.querySelectorAll('[data-ecke]').forEach(b => b.classList.toggle('an', b.dataset.ecke === eckeJetzt()));
  grau(el('ps-ecken'), !E.schild, 'Nur bei Randlos: dort stehen Avatar und Titel in einer Ecke.');
  grau(el('ps-schildname'), !E.schild, 'Nur bei Randlos: der Name steht in der Ecke über dem Titel.');
  el('ps-kopfunter').placeholder = E.schild ? 'Zeilen – „/“ bricht um' : E.skizze ? 'Zeile in Spiegelschrift' : 'Untertitel';
  /* Skizzenbuch: was es dort nicht gibt, grau mit Grund; die Vorlage selbst im Groupieschaum (es zeichnet die Cover deiner Titel) */
  { const sk = !!E.skizze, ohne = 'Gilt nicht im Skizzenbuch – dort ist alles Feder auf Pergament.';
    if (sk){ for (const id of ['ps-rand', 'ps-feder', 'ps-federmm', 'ps-verz', 'ps-areale', 'ps-fugen', 'ps-wackeln', 'ps-schatten', 'ps-vignette', 'ps-kissen']) grau(zeile(id), true, ohne);
      grau(el('ps-verz-text'), true, ohne); grau(zeile('ps-zeit'), raumJetzt === 'groupies', 'Im Groupieschaum gibt es kein Datum je Person.');
      const sw = studio.querySelector('[data-grund="schwarz"]'); if (sw){ sw.disabled = true; sw.classList.add('ps-grau'); sw.title = 'Feder braucht hellen Grund.'; } }
    else { for (const id of ['ps-fugen', 'ps-wackeln', 'ps-schatten', 'ps-vignette', 'ps-kissen']) grau(zeile(id), false, '');
      const sw = studio.querySelector('[data-grund="schwarz"]'); if (sw){ sw.disabled = false; sw.classList.remove('ps-grau'); sw.title = ''; } }
    grau(el('ps-skizzeteil'), !sk, 'Nur im Skizzenbuch.');
    studio.querySelectorAll('[data-refrains]').forEach(b => b.classList.toggle('an', b.dataset.refrains === (E.refrains || 'herzen')));
    const vb = studio.querySelector('[data-vorlage="skizze"]'); if (vb){ const gr = raumJetzt === 'groupies'; vb.disabled = gr; vb.classList.toggle('ps-grau', gr); vb.title = gr ? 'Das Skizzenbuch zeichnet die Cover deiner Titel – im Groupieschaum gibt es sie nicht.' : ''; }
    studio.querySelectorAll('[data-format]').forEach(b => { const f = FORMATE.find(x => x.id === b.dataset.format) || {}, aus = sk && !!f.tri; b.disabled = aus; b.classList.toggle('ps-grau', aus); b.title = aus ? 'Das Skizzenbuch ist eine Seite.' : ''; }); }
  { const v = E.randVorne ?? 15, u = +E.umschlag || 0, a = el('ps-randvorne'), b = el('ps-umschlag');
    if (document.activeElement !== a) a.value = v; if (document.activeElement !== b) b.value = u;
    el('ps-randvorne-w').textContent = (v / 10).toLocaleString('de-DE'); el('ps-umschlag-w').textContent = (u / 10).toLocaleString('de-DE'); }
  studio.querySelectorAll('[data-weise-hell]').forEach(b => b.classList.toggle('an', b.dataset.weiseHell === weiseHell()));
  studio.querySelectorAll('[data-weise-dunkel]').forEach(b => b.classList.toggle('an', b.dataset.weiseDunkel === weiseDunkel()));
  { const fm = FORMATE.find(x => x.id === E.format) || {}, grund = !E.schild ? 'Nur bei Randlos.' : fm.tri ? 'Im Triptychon noch nicht – jede Tafel bräuchte ihren eigenen Rand.' : '';
    grau(el('ps-randteil'), !!grund, grund);
    if (!grund){ grau(zeile('ps-umschlag'), !!fm.bild, 'Nur für den Druck – ein Bild hat keine Kante zum Umschlagen.');
      grau(el('ps-weisen-hell'), !hellerGrund(), 'Aquarell braucht hellen Grund.'); grau(el('ps-weisen-dunkel'), hellerGrund(), 'Kreide und Gouache sind für dunklen Grund.'); } }
}
const grundArt = () => E.grund.toLowerCase() === '#0c0d10' || E.grund.toLowerCase() === '#08090b' ? 'schwarz' : E.grund.toLowerCase() === '#f3efe6' || E.grund.toLowerCase() === '#ffffff' || E.grund.toLowerCase() === '#ece7dc' ? 'weiss' : 'farbe';
function setze(teil, neuLegen, warteMs, nurSetzen){ Object.assign(E, teil); merken(); felderSetzen(); if (neuLegen) aktuell = aktuell && { ...aktuell }; zeichnen(false, warteMs, nurSetzen); }

function aufbauen(){
  const css = document.createElement('style'); css.id = 'ps-stil';
  css.textContent = `
#plakatstudio{position:fixed;inset:0;z-index:9000;display:grid;grid-template-columns:1fr 360px;background:rgba(8,9,11,.96);color:var(--text,#e8e6e1);font:14px/1.45 system-ui,-apple-system,Segoe UI,sans-serif}
#plakatstudio[hidden]{display:none}
#ps-buehne{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
#ps-blatt svg.ps-seite{display:block;box-shadow:0 18px 60px rgba(0,0,0,.55)}
#ps-stand{position:absolute;left:24px;bottom:16px;color:#a3a9b1;font-size:13px}
#ps-panel{background:var(--flaeche,#15181d);border-left:1px solid var(--rand,#2a3038);padding:16px 18px;overflow:auto}
#ps-panel h2{font-size:17px;margin:0 0 12px;font-weight:600}
#ps-panel h3{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#9aa3ad;margin:16px 0 7px;font-weight:600}
.ps-vorlagen{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.ps-vorlagen button{text-align:left;border:1px solid var(--rand,#2a3038);background:var(--flaeche2,#1d2127);color:inherit;border-radius:9px;padding:8px 9px;cursor:pointer;font:inherit}
.ps-vorlagen button b{display:block;font-size:13.5px}.ps-vorlagen button small{color:#9aa3ad;font-size:11.5px}
.ps-vorlagen button.an,.ps-pillen button.an{border-color:#e3b43c;box-shadow:inset 0 0 0 1px #e3b43c}
.ps-pillen{display:flex;flex-wrap:wrap;gap:5px}
.ps-pillen button{border:1px solid var(--rand,#2a3038);background:var(--flaeche2,#1d2127);color:inherit;border-radius:999px;padding:3px 10px;cursor:pointer;font:inherit;font-size:12.5px}
.ps-zeile{display:grid;grid-template-columns:110px 1fr 38px;align-items:center;gap:8px;margin:6px 0;font-size:13px}
.ps-zeile input[type=range]{width:100%}
.ps-zeile span.wert{color:#9aa3ad;text-align:right;font-variant-numeric:tabular-nums}
.ps-eingabe{width:100%;box-sizing:border-box;border:1px solid var(--rand,#2a3038);background:var(--flaeche2,#1d2127);color:inherit;border-radius:7px;padding:5px 8px;font:inherit;font-size:13px;margin:3px 0}
#ps-frei{display:flex;gap:8px;align-items:center;margin-top:6px;font-size:13px}#ps-frei input{width:70px}
.ps-knoepfe{display:flex;gap:8px;margin-top:18px}
.ps-knoepfe button{border:0;border-radius:9px;padding:8px 14px;font:inherit;font-weight:600;cursor:pointer}
#ps-pdf,#ps-png{background:#e3b43c;color:#111}#ps-zu{background:var(--flaeche2,#1d2127);color:inherit;border:1px solid var(--rand,#2a3038)!important}
.ps-leise{color:#9aa3ad;font-size:12px;margin:6px 0 0}
.ps-pillen button.ps-schalt:not(.an){color:#9aa3ad}
.ps-grau{opacity:.4}
@font-face{font-family:'Pinyon Script';font-style:normal;font-weight:400;font-display:block;src:url('/fonts/pinyon-script-400.ttf') format('truetype')}.ps-grau input,.ps-grau button{cursor:not-allowed}
#ps-wand{margin-top:8px;border-radius:7px;overflow:hidden}
details.ps-fein summary{cursor:pointer;color:#cfd4da;margin:14px 0 4px}
`;
  document.head.appendChild(css);
  studio = document.createElement('div'); studio.id = 'plakatstudio';
  const regler = (id, name, min, max, schritt) => `<label class="ps-zeile">${name}<input type="range" id="${id}" min="${min}" max="${max}" step="${schritt}"><span class="wert" id="${id}-w"></span></label>`;
  studio.innerHTML = `<div id="ps-buehne"><div id="ps-blatt"></div><div id="ps-stand"></div></div>
<aside id="ps-panel">
  <h2>Plakat</h2>
  <h3>Vorlage</h3><div class="ps-vorlagen">${VORLAGEN.map(v => `<button type="button" data-vorlage="${v.id}"><b>${v.name}</b><small>${v.zeile}</small></button>`).join('')}</div>
  <p class="ps-leise" id="ps-randlos-grund" hidden>Ohne Rand gibt es kein Passepartout: Rand, Federstrich, Verzeichnis, Areale am Rand und Zeitleiste sind ausgegraut.</p>
  <h3>Format</h3><div class="ps-pillen">${FORMATE.map(f => `<button type="button" data-format="${f.id}">${f.name}</button>`).join('')}</div>
  <div id="ps-frei" hidden>Breite <input class="ps-eingabe" id="ps-freiw" type="number" min="10" max="300"> cm · Höhe <input class="ps-eingabe" id="ps-freih" type="number" min="10" max="300"> cm</div>
  <div class="ps-pillen" style="margin-top:7px"><button type="button" data-lage="hoch">Hoch</button><button type="button" data-lage="quer">Quer</button></div>
  <p class="ps-leise" id="ps-mass"></p>
  <h3>Grund</h3><div class="ps-pillen"><button type="button" data-grund="schwarz">Schwarz</button><button type="button" data-grund="weiss">Weiß</button><button type="button" data-grund="farbe">Farbe <input type="color" id="ps-farbe" style="width:22px;height:16px;border:0;padding:0;background:none;vertical-align:middle"></button></div>
  <h3>Titel in der Zelle</h3><div class="ps-pillen"><button type="button" data-titel="rauch">Rauchglas</button><button type="button" data-titel="milch">Milchglas</button><button type="button" data-titel="kante">an der Kante</button><button type="button" data-titel="ohne">ohne</button></div>
  <div class="ps-pillen" style="margin-top:9px"><button type="button" class="ps-schalt" id="ps-verz">Verzeichnis</button><button type="button" class="ps-schalt" id="ps-areale">Areale am Rand</button></div>
  <p class="ps-leise" id="ps-verz-text" style="margin-top:0">Jede Zelle bekommt eine Nummer, unten steht die Liste aller Titel – so findet man auch den kleinsten.</p>
  <details class="ps-fein" open><summary>Feinheiten</summary>
    ${regler('ps-rand', 'Rand', 2, 15, 1)}${regler('ps-fugen', 'Fugen', 3, 40, 1)}${regler('ps-wackeln', 'Wackeln', 0, 100, 1)}${regler('ps-schatten', 'Schatten', 0, 100, 1)}${regler('ps-vignette', 'Vignette', 0, 100, 1)}
    <div class="ps-pillen" style="margin:6px 0"><button type="button" class="ps-schalt" id="ps-kissen">Kissen</button><button type="button" class="ps-schalt" id="ps-feder">Federstrich</button></div>
    ${regler('ps-federmm', 'Strichstärke', 0.1, 1, 0.05)}
  </details>
  <h3>Skizzenbuch</h3>
  <div id="ps-skizzeteil"><div class="ps-pillen" id="ps-refrains">${[['herzen', 'Refrains: meiste Herzen'], ['neueste', 'neueste'], ['keine', 'keine']].map(([w, n]) => `<button type="button" data-refrains="${w}">${n}</button>`).join('')}</div>
    <p class="ps-leise">Die Refrains stehen als Randnotizen; genommen wird der erste markierte Refrain der Lyrics.</p></div>
  <h3>Rand</h3>
  <div id="ps-randteil">
    ${regler('ps-randvorne', 'Rand vorne (cm)', 0, 60, 5)}${regler('ps-umschlag', 'Umschlag (cm)', 0, 100, 5)}
    <div class="ps-pillen" id="ps-weisen-hell" style="margin:6px 0 4px">${WEISEN_HELL.map(([w, n]) => `<button type="button" data-weise-hell="${w}">${n}</button>`).join('')}</div>
    <div class="ps-pillen" id="ps-weisen-dunkel" style="margin:0 0 4px">${WEISEN_DUNKEL.map(([w, n]) => `<button type="button" data-weise-dunkel="${w}">${n}</button>`).join('')}</div>
    <p class="ps-leise" style="margin-top:2px">Der Rand nimmt die Farben der Areale an der Kante auf. Umschlag: Tiefe des Keilrahmens plus etwas zum Festtackern – das Druckformat wächst um ihn, vorne bleibt das gewählte Format.</p>
  </div>
  <h3>Schild</h3>
  <div class="ps-pillen" id="ps-ecken" style="margin-bottom:5px">${[['ol', '↖ oben links'], ['or', '↗ oben rechts'], ['ul', '↙ unten links'], ['ur', '↘ unten rechts']].map(([e, n]) => `<button type="button" data-ecke="${e}">${n}</button>`).join('')}</div>
  <input class="ps-eingabe" id="ps-schildname" placeholder="Name">
  <input class="ps-eingabe" id="ps-kopftitel" placeholder="Titel">
  <input class="ps-eingabe" id="ps-kopfunter" placeholder="Untertitel">
  <div class="ps-pillen" style="margin:2px 0 4px"><button type="button" id="ps-vorschlag">Vorschlag wiederherstellen</button></div>
  <div class="ps-pillen" style="margin:6px 0 3px"><button type="button" class="ps-schalt" id="ps-legende">Legende</button><button type="button" class="ps-schalt" id="ps-zeit">Zeitleiste</button><button type="button" class="ps-schalt" id="ps-edition">Edition und Signatur</button></div>
  <p class="ps-leise" id="ps-zeit-grund" style="margin-top:0" hidden>Im Groupieschaum gibt es kein Datum je Person – die Zeitleiste gilt für den Klangschaum.</p>
  <input class="ps-eingabe" id="ps-auflage" placeholder="Auflage, z. B. 1/1 oder 3/10">
  <h3>An der Wand</h3><div id="ps-wand"></div><p class="ps-leise">Mensch 1,75 m zum Vergleich.</p>
  <p class="ps-leise" id="ps-hinweis" hidden>Nur für den privaten Gebrauch. Vervielfältigung und Weitergabe an Dritte sind nicht erlaubt – die Avatare gehören ihren Leuten.</p>
  <div class="ps-knoepfe"><button type="button" id="ps-pdf">Als PDF sichern …</button><button type="button" id="ps-png" hidden>Als Bild sichern</button><button type="button" id="ps-zu">Schließen</button></div>
  <p class="ps-leise">Das Druckfenster öffnet sich; dort „Als PDF sichern“ wählen. Format und Ränder setzt das Plakat selbst.</p>
</aside>`;
  document.body.appendChild(studio);
  /* Bedienung */
  studio.querySelectorAll('[data-vorlage]').forEach(b => b.onclick = () => { const v = VORLAGEN.find(x => x.id === b.dataset.vorlage);
    /* das Skizzenbuch ist eine Seite: aus einem Triptychon wird seine Tafel (Knopf, Dateiname und Maß stimmen dann von selbst) */
    const tafel = v.e.skizze && E.format === 'tri50' ? { format: '50x70' } : v.e.skizze && E.format === 'tri70' ? { format: '70x100' } : {};
    setze({ vorlage: v.id, ...v.e, ...tafel }); });
  studio.querySelectorAll('[data-format]').forEach(b => b.onclick = () => setze({ format: b.dataset.format }));
  studio.querySelectorAll('[data-lage]').forEach(b => b.onclick = () => setze({ lage: b.dataset.lage }));
  studio.querySelectorAll('[data-titel]').forEach(b => b.onclick = () => setze({ titel: b.dataset.titel }));
  studio.querySelectorAll('[data-grund]').forEach(b => b.onclick = (ev) => { if (ev.target.id === 'ps-farbe') return;
    const g = b.dataset.grund; setze({ grund: g === 'schwarz' ? '#0c0d10' : g === 'weiss' ? '#f3efe6' : (el('ps-farbe').value || '#24324a') }); });
  el('ps-farbe').oninput = (ev) => setze({ grund: ev.target.value });
  const zahl = (id, schluessel, f) => { const r = el(id); r.oninput = () => { el(id + '-w').textContent = r.value; setze({ [schluessel]: f(+r.value) }); }; };
  zahl('ps-rand', 'rand', v => v / 100); zahl('ps-fugen', 'fugen', v => v / 10); zahl('ps-wackeln', 'wackeln', v => v / 100);
  zahl('ps-schatten', 'schatten', v => v / 100); zahl('ps-vignette', 'vignette', v => v / 100); zahl('ps-federmm', 'federMm', v => v);
  el('ps-freiw').onchange = () => setze({ freiW: Math.max(10, Math.min(300, +el('ps-freiw').value || 80)) });
  el('ps-freih').onchange = () => setze({ freiH: Math.max(10, Math.min(300, +el('ps-freih').value || 120)) });
  /* Schalter als Pillen (Hausregel 18: „Pillen statt Checkboxen" - bis 1.0.58 standen hier sieben Checkboxen) */
  for (const [id, schl] of [['ps-kissen', 'kissen'], ['ps-verz', 'verzeichnis'], ['ps-zeit', 'zeitleiste'], ['ps-edition', 'edition'], ['ps-areale', 'areale'], ['ps-feder', 'feder'], ['ps-legende', 'legende']])
    el(id).onclick = () => setze({ [schl]: !E[schl] });
  el('ps-auflage').oninput = (ev) => setze({ auflage: ev.target.value }, false, undefined, true); el('ps-auflage').onchange = () => zeichnen();
  /* Ein Feld, das man angefasst hat, gehört einem - auch leer (vorher hieß leer „Vorschlag", und der stand nach einer Sekunde wieder
     auf dem Plakat). Bei Randlos bemisst der Text die Ecke: beim Tippen nur setzen, neu legen beim Verlassen des Feldes oder Enter. */
  const feld = (id, schluessel) => { const f = el(id);
    f.oninput = () => setze({ [schluessel]: f.value, [schluessel + 'Eigen']: true }, false, undefined, true);
    f.onchange = () => zeichnen(); };
  feld('ps-kopftitel', 'kopfTitel'); feld('ps-kopfunter', 'kopfUnter'); feld('ps-schildname', 'schildName');
  el('ps-vorschlag').onclick = () => { setze({ kopfTitelEigen: false, kopfUnterEigen: false, schildNameEigen: false, kopfTitel: kopfTitelVorschlag(),
    kopfUnter: aktuell ? kopfUnterVorschlag(aktuell) : '', schildName: schildNameVorschlag() }); };
  studio.querySelectorAll('[data-ecke]').forEach(b => b.onclick = () => setze({ ecke: b.dataset.ecke }));
  studio.querySelectorAll('[data-refrains]').forEach(b => b.onclick = () => setze({ refrains: b.dataset.refrains }));
  /* Rand: Zahl beim Ziehen, neu gelegt beim Loslassen (der Schaum rückt nach innen) */
  const cm = (id, schl) => { const r = el(id); r.oninput = () => { el(id + '-w').textContent = (r.value / 10).toLocaleString('de-DE'); }; r.onchange = () => setze({ [schl]: +r.value }); };
  cm('ps-randvorne', 'randVorne'); cm('ps-umschlag', 'umschlag');
  studio.querySelectorAll('[data-weise-hell]').forEach(b => b.onclick = () => setze({ weiseHell: b.dataset.weiseHell }));
  studio.querySelectorAll('[data-weise-dunkel]').forEach(b => b.onclick = () => setze({ weiseDunkel: b.dataset.weiseDunkel }));
  el('ps-pdf').onclick = () => pdf();
  el('ps-png').onclick = () => bildSichern();
  el('ps-zu').onclick = schliessen;
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && studio && !studio.hidden) schliessen(); });
  window.addEventListener('resize', () => { if (studio && !studio.hidden) einpassen(); });
}
function schliessen(){ if (studio) studio.hidden = true; document.documentElement.style.overflow = ''; }

export function oeffnen(){
  if (!studio) aufbauen();
  /* Das Skizzenbuch zeichnet die Cover deiner Titel - im Groupieschaum gibt es sie nicht: dort mit Galerie öffnen (vorher blieb die
     gemerkte Vorlage stehen, und das Plakat wartete auf Federzeichnungen von Personen; Fallensuche 1.0.61) */
  if (E.skizze && raumJetzt === 'groupies'){ Object.assign(E, { vorlage: 'galerie' }, VORLAGEN[0].e); merken(); }
  studio.hidden = false; document.documentElement.style.overflow = 'hidden';
  if (aktuell && aktuell.raum !== raumJetzt) aktuell = null;
  felderSetzen();
  for (const id of ['ps-rand', 'ps-fugen', 'ps-wackeln', 'ps-schatten', 'ps-vignette', 'ps-federmm']){ const r = el(id); el(id + '-w').textContent = r.value; }
  avatarPruefen().then(() => zeichnen(true));
}
