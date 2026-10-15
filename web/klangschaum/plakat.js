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
import { blattSchmuck, blattGrund, dAuftrag, anzeigeName } from './skizze-blatt.js';
import { ohneKlammern } from './skizze-hand.js';
import { blattDatenHolen, refrainAus } from './skizze-daten.js';
import { bildnisseBereit } from './skizze-bildnisse.js';
import { TRANSFORMATIONEN } from './bilderschau.js';

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
   super aus" – „ja, wir nehmen das bessere modell"): eine Seite aus einem Skizzenbuch - der Schaum in einem angeschnittenen Kreis,
   die Kacheln als Federzeichnungen in der Tinte ihres Areals (Haus: skizzeZelle), Titel in Pinyon Script; ringsum das volle Blatt
   (skizze-blatt.js: Kopf, Siegel, Tabula, Steckbrief, Instrumentenstudien, Würdigung, Legende, Randnotizen, Refrains, Diagramme,
   Zeitleiste als Bogen). Pergament als Grund. Das Skizzenbuch ist eine Seite: aus einem Triptychon wird seine Tafel (SKIZZE_TAFEL). */
const SKIZZE_TAFEL = { tri50: '50x70', tri70: '70x100' };
VORLAGEN.push({ id: 'skizze', name: 'Skizzenbuch', zeile: 'Federzeichnung auf Pergament, à la Leonardo',
  e: { grund: '#eee2c6', titel: 'rauch', fugen: 1, wackeln: 0, schatten: 0, vignette: 0, kissen: false, feder: false, federMm: 0.3, rand: 0, verzeichnis: false, areale: false, edition: true, zeitleiste: true, schild: false, skizze: true, refrains: 'herzen' } });
const BESCHNITT = 3;                                      /* mm rundum, ueber den Rand hinaus gedruckt */
const SPEICHER = 'mysuno-plakat';
/* DIE BILDERSCHAU ALS DRITTE ART (Caspar_D, 11.10.2026, „Auftrag für Mittwoch", Übergabe §95): neben Titel- und Personenschaum
   wird hier auch die Bilderschau zum Plakat - Vorschau, Formate, Rand, Werkverzeichnis, Nummerierung, Zeitleiste, Edition, PDF und
   Bild vom Studio, neu ist nur die Bildebene (bilderEbene): die Cover-Rechtecke im Originalformat, im Seitenformat neu gehängt mit
   Maß, Transformation, Hängung, Gliederung und Rahmen, wie die Bilderschau am Schirm gerade steht. Titel „Caspar_Ds Bilderschau"
   (erst „Bildertraum" gesagt, dann: „nein, auf dem Plakat auch Bilderschau"). Bildunterschriften erst aus (seit 1.0.80 wählbar, siehe unten); jedes Cover trägt seine
   Nummer aus dem Werkverzeichnis (seit 15.10.2026 jedes, auf das sie passt - bilderEbene). Bis 15.10.2026 gehörte das Verzeichnis
   darum immer dazu; seitdem (Caspar_D: „Mach wie in den Treemaps die Nummer ausblendbar") ist der Schalter frei, eigens gemerkt
   (bildNummern, Vorgabe an - die Vorlagen setzen ihn nicht): aus heißt keine Nummern und keine Liste. Was nur den Schaum betrifft
   (Fugen, Wackeln, Schatten, Vignette, Kissen, Titel in der Zelle), ist grau mit Grund; das Skizzenbuch auch (es zeichnet den Klangschaum
   mit der Feder). Randlos war bis 1.0.79 auch grau (kein Verzeichnis für die Nummern); seit 1.0.80 gibt es es, ohne Nummern (bilderEcke).
   Ebenso seit 1.0.80: Gruppenüberschriften und Bildunterschriften wie am Schirm (E2(a), Vorgabe aus) und ein Abschnitt Bilderschau im
   Studio, der dieselben Einstellungen wie die Ansicht stellt (bilderteilSetzen). Grund schwarz oder weiß wie die Vorlagen, keine
   freie Farbe (Caspar_D: „Hintergrund in weiß oder schwarz, keine Farben, wie bei den anderen Postern auch"). Bis 1.0.73 hatte die
   Bilderschau einen eigenen Not-Export in index.html (bilderPlakat: Format, Lage, Grund im Panel) - er ist mit diesem Weg gelöscht. */
const bilderschau = () => raumJetzt !== 'groupies' && typeof schaumArt !== 'undefined' && schaumArt === 'bilder';
const GRUENDE_DER_VORLAGEN = /^#(0c0d10|08090b|f3efe6|ffffff|ece7dc)$/i;
const grund = () => bilderschau() && !GRUENDE_DER_VORLAGEN.test(E.grund) ? (VORLAGEN.find(v => v.id === E.vorlage) || VORLAGEN[0]).e.grund : E.grund;
const mitVerzeichnis = () => bilderschau() ? E.bildNummern !== false && !E.schild && !E.skizze : !!E.verzeichnis;

let E = (() => { try { return JSON.parse(localStorage.getItem(SPEICHER)) || null; } catch (e) { return null; } })()
  || { vorlage: 'galerie', format: '70x100', freiW: 80, freiH: 120, lage: 'hoch', kopfTitel: '', kopfUnter: '', legende: true, ...VORLAGEN[0].e };
let studio = null, aktuell = null, legeLauf = 0, bauLauf = 0, warten = null;
/* GALERIE NUR FÜR DIE BILDERSCHAU: das Skizzenbuch gibt es dort nicht (Randlos bis 1.0.79 auch nicht), das Studio öffnet sie dann mit Galerie (oeffnen). Bis
   15.10.2026 kam das in den gemeinsamen Speicher, und das Plakat des Klangschaums stand danach auf Galerie statt auf Randlos
   (Fallensuche). leihe hält die überdeckten Werte: gespeichert werden sie statt der Galerie, und beim nächsten Öffnen außerhalb der
   Bilderschau gelten sie wieder. Was man in der Bilderschau selbst einstellt, gehört einem und fällt aus der Leihe (setze). */
let leihe = null;
/* das Studio wartet darauf, dass die Bilderschau am Schirm neu gehängt ist (bilderAmSchirm, Ereignis „bilderschau-gehaengt") */
let wandWartet = false;
const merken = () => { try { localStorage.setItem(SPEICHER, JSON.stringify(leihe ? { ...E, ...leihe } : E)); } catch (e) {} };
const el = (id) => document.getElementById(id);
const esc2 = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Relative Leuchtdichte; daraus die Schriftfarbe auf dem Grund. */
function leuchte(hex){
  const k = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
}
const hellerGrund = () => leuchte(grund()) > 0.35;
const schrift = () => hellerGrund() ? '#16171a' : '#f1efe9';
const schriftLeise = () => hellerGrund() ? '#5c5f66' : '#a3a9b1';

/* Wie gross das Werkverzeichnis wird: n Eintraege (geschaetzt mit ein paar Arealkoepfen) in Spalten ueber die
   ganze Breite. Die Schrift so gross wie moeglich (bis 0,45 % der kurzen Seite, auf 70 × 100 gut 3 mm), so klein
   wie noetig (bis 1,5 mm, aus der Naehe lesbar; ab 577 mm kurzer Seite bis 0,26 % davon), damit der Block hoechstens
   ein Sechstel der Hoehe nimmt - reicht auch die kleinste nicht, wird er hoeher. Unter 333 mm kurzer Seite ist schon
   die groesste Schrift kleiner als 1,5 mm und die einzige (A3: 1,34 mm; beim Setzen notfalls bis 1 mm, verzeichnisSetzen).
   Eine Spalte ist 15 Schriftgroessen breit: Nummer, Titel, Abstand. */
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
  if (E.skizze){
    /* Triptychon: das Skizzenbuch ist eine Seite - die Tafel (vorher wurde aus 3 × 50 × 70 eine Seite von 156 cm) */
    if (tri){ w = tri.pw; h = tri.ph; kurz = Math.min(w, h); tri = null; }
    /* ANGESCHNITTENER KREIS MIT SPALTE (Entwurf 08.10.2026, Übergabe §88): Randlinie 5 % der kurzen Seite; hoch und quadratisch links
       angeschnitten (Spalte ⅕ bzw. ¼ der Breite, oben/unten Streifen nur im Hochformat), quer unten angeschnitten (Spalte ⅕ rechts) */
    const m = 0.05 * kurz, ix = BESCHNITT + m, iy = BESCHNITT + m, iw = w - 2 * m, ih = h - 2 * m, hoch = h >= 0.95 * w, quadr = hoch && h < 1.2 * w;
    let RR, CX, CY, karte;
    if (hoch){ const sp = (quadr ? 0.25 : 0.2) * iw; RR = Math.min(quadr ? ih / 2 : ih / 2 - 0.09 * ih, (iw - sp) / 1.5); CX = ix + RR / 2; CY = iy + ih / 2; karte = { x: ix, y: CY - RR, w: 1.5 * RR, h: 2 * RR }; }
    else { const sp = 0.2 * iw; RR = Math.min((iw - sp) / 2, 0.88 * ih / 1.5); CX = ix + RR; CY = iy + ih - RR / 2; karte = { x: CX - RR, y: CY - RR, w: 2 * RR, h: 1.5 * RR }; }
    return { w, h, PW: w + 2 * BESCHNITT, PH: h + 2 * BESCHNITT, kurz, rand: 0, unten: 0, T, U, L, karte,
      kreis: { cx: CX, cy: CY, r: RR, quadr, schnitt: hoch ? 'links' : 'unten' }, skizze: true, schildH: 0, verz: null, zeitH: 0, tri: null, name: f.id === 'frei' ? `${E.freiW}x${E.freiH}` : f.name.replace(/\s/g, '') };
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
  const verz = mitVerzeichnis() && n ? verzeichnisMass(n, w - 2 * rand, kurz, h / 6, legendenEintraege(true).length || 6, undefined,
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
/* WIE VIELE KACHELN EIN FORMAT TRÄGT (Caspar_D, 08.10.2026: „wir begrenzen alles auf die 700 … beim Posterexport … Sonst machen die
   Bilder keinen Sinn mehr" – „ja, mach es überall" – „die 700 Titel mit den höchsten Zahlen, egal welche, je nachdem, was angezeigt
   wird … die 700 mit den meisten Herzen, mit der höchsten Resonanz, mit den meisten Plays"). Je Format so viele, dass eine Kachel im
   Mittel etwa 2 cm groß bleibt (Fläche des Schaums / 4 cm²), höchstens 700, mindestens 12; genommen werden die mit den höchsten Werten
   des gezeigten Maßes, bei Gleichstand der neuere Titel bzw. die zuletzt aktive Person. Die Startpunkte werden für die Auswahl neu
   gerechnet, der Lage-Schlüssel trägt die Zahl. Was das ganze Archiv beschreibt (Tabula, Steckbrief, Würdigung, Wachstum), bleibt
   beim ganzen Archiv. Fläche: der angeschnittene Kreis ist πr² minus das abgeschnittene Segment (Sehne bei r/2) = 2,5274 r².
   Im Groupieschaum wirkt vor dieser Grenze der Regler am Schirm („zeigt N von M", index.html groupieAuswahl, 15.10.2026): das Studio
   nimmt, was gezeigt ist, und die Unterzeile nennt die Zahl ohne beide Grenzen.
   AUSNAHME BILDERSCHAU (Caspar_D, 15.10.2026: „dann kann man selbst entscheiden, wie (un)übersichtlich es wird"): ihr Plakat hängt alle
   Titel, die die Ansicht zeigt - keine Grenze nach dem Format (zeichnen), nur die 700 gelten (begrenzen). „Mach es überall" vom 08.10.
   ist damit für die Bilderschau zurückgenommen; Klang- und Groupieschaum behalten die Grenze nach dem Format. Wie viele Cover dabei
   zu klein für ihre Nummer werden, steht im Studio unter dem Format (bilderEbene, bauen). */
const KACHEL_MM2 = 400, KACHELN_HOECHSTENS = 700, KACHELN_MINDESTENS = 12;
function kachelZahl(g){
  const flaeche = g.skizze && g.kreis ? 2.5274 * g.kreis.r * g.kreis.r : g.karte.w * g.karte.h;
  return Math.max(KACHELN_MINDESTENS, Math.min(KACHELN_HOECHSTENS, Math.floor(flaeche / KACHEL_MM2)));
}
function begrenzen(a, n){
  const z = a.j.zeilen; if (z.length <= n) return a;
  const zeit = (r) => a.art === 'person' ? (r.letzte || 0) : (Date.parse(((typeof song === 'function' && song(r.id)) || {}).erstellt) || 0);   /* zuletzt aktiv bzw. neuer */
  const bleiben = new Set(z.slice().sort((p, q) => (+q.w || 0) - (+p.w || 0) || zeit(q) - zeit(p)).slice(0, n).map(r => r.id));
  const zeilen = z.filter(r => bleiben.has(r.id)), { W, H, ebenen } = a.j;
  /* Bilderschau: dieselbe Auswahl in den Gruppen; die Startpunkte rechnet das Hängen (bilderLageHolen) */
  if (a.art === 'bild'){ const gruppen = a.j.gruppen.map(g => ({ ...g, bilder: g.bilder.filter(b => bleiben.has(b.id)) })).filter(g => g.bilder.length);
    return { ...a, j: { ...a.j, zeilen, gruppen, lage: a.j.lage + '|staerkste' + n + ':' + idsPruefsumme(zeilen), gesamt: z.length } }; }
  const seeds = a.art === 'person' ? (typeof groupieSaat === 'function' ? groupieSaat(zeilen, W, H, a.gl) : null) : (typeof schaumSaat === 'function' ? schaumSaat(zeilen, ebenen, W, H) : null);
  /* die Auswahl selbst im Lage-Schlüssel (Prüfsumme der IDs): bei Gleichstand kann sie sich ändern, ohne dass sich Werte ändern - eine
     gemerkte Lage gehörte sonst zu anderen Zeilen (Fallensuche 1.0.62) */
  return { ...a, j: { ...a.j, zeilen, seeds: seeds || a.j.seeds, lage: a.j.lage + '|staerkste' + n + ':' + idsPruefsumme(zeilen), gesamt: z.length } };
}
const idsPruefsumme = (zeilen) => { let h = 5381; for (const r of zeilen) for (const c of String(r.id)) h = (Math.imul(h, 33) + c.charCodeAt(0)) >>> 0; return h.toString(36); };
/* Was die Bilderschau am Schirm gerade zeigt (bilderGezeigt in index.html, die Daten der zuletzt gehängten Wand) - und ob es noch
   zu den Einstellungen passt: hängt sie nach einem Wechsel noch neu, zeigte das Plakat sonst die alte Wand unter dem neuen Namen. */
function bilderAmSchirm(){
  const bg = typeof bilderGezeigt !== 'undefined' ? bilderGezeigt : null, d = bg && bg.r && bg.r.daten;
  if (!d || !d.wahl) return { fehlt: 'Bitte die Bilderschau einmal anzeigen lassen, dann das Plakat öffnen.' };
  const w = d.wahl, jetzt = { mass: schaumMass, trafo: bilderWahl.trafo, gliederung: schaumGliederung, zoom: schaumZoom || '', haengung: bilderWahl.haengung,
    rahmen: !!bilderWahl.rahmen, kopf: !!bilderWahl.kopf, unter: !!bilderWahl.unter, verf: typeof karteVerf !== 'undefined' ? karteVerf : '', filter: typeof titelFilterSchluessel === 'function' ? titelFilterSchluessel() : '' };
  /* hängt sie noch neu, wartet das Studio auf das Ereignis „bilderschau-gehaengt" (index.html bilderEinsetzen) und zeichnet dann von selbst
     neu (wandWartet) - bis 1.0.79 stand hier „das Plakat bitte gleich noch einmal öffnen", und die Meldung blieb stehen */
  if (Object.keys(jetzt).some(k => String(w[k]) !== String(jetzt[k]))) return { fehlt: 'Die Bilderschau wird am Schirm neu gehängt – das Plakat folgt gleich.', neu: true };
  return { bg, d };
}
const bilderStempel = new WeakMap();
function bilderStand(){
  const { d, fehlt } = bilderAmSchirm(); if (fehlt) return 'fehlt';
  if (!bilderStempel.has(d)) bilderStempel.set(d, JSON.stringify(d.wahl) + ':' + d.zeilen.length + ':' + idsPruefsumme(d.zeilen.map(z => ({ id: z.id + '=' + z.w }))));
  return bilderStempel.get(d);
}
async function auftrag(verh){
  /* Bilderschau: die Wand im Verhältnis der Karte, 1400 Punkte an der langen Seite (in der Größenordnung des Schirms, für den Rahmen,
     Luft und Wandrand der Hängung bemessen sind). Gruppenüberschriften und Bildunterschriften wie am Schirm (d.opt.kopf, d.opt.schild;
     Caspar_D, 15.10.2026, E2(a): „wählbar, Vorgabe wie am Schirm (aus)") - bis 1.0.79 hier immer 0 */
  if (bilderschau()){
    const { bg, d, fehlt, neu } = bilderAmSchirm(); if (fehlt){ const e = new Error(fehlt); e.neu = !!neu; throw e; }
    const masse = schaumMasse(), m = masse.find(x => x.id === d.wahl.mass) || masse[0];
    const glieder = schaumGliederungen(), gl = glieder.find(x => x.id === d.wahl.gliederung) || glieder[0];
    const t = TRANSFORMATIONEN.find(x => x.id === d.wahl.trafo) || TRANSFORMATIONEN[1];
    const W = verh >= 1 ? Math.round(1400 / verh) : 1400, H = verh >= 1 ? 1400 : Math.round(1400 * verh);
    /* ebenen wie im Auftrag des Klangschaums (gezoomt die Genres, sonst die Gruppen) - Caspar_D, 11.10.2026: „der Posterexport muß
       schon wie beim Schaum funktionieren". arealeDer erkennt den Zoom daran und filtert die Legende dann nicht. Ohne ebenen hielt sie
       gezoomt die Genres (z.gruppe) für die Areale und warf die Zoomgruppe hinaus: auf dem Plakat standen nur graue Kästchen (Grau heißt
       im Haus unsicher), während Rahmen und Verzeichnisköpfe die Farbe der Zoomgruppe trugen (Fallensuche 15.10.2026). Hängen und
       Begrenzen der Bilderschau lesen ebenen nicht; ungezoomt bleibt die Legende, wie sie war. */
    return { j: { zeilen: d.zeilen, gruppen: d.gruppen, opt: { ...d.opt }, kopfBreite: d.kopfBreite, W, H, lage: 'bild|' + bilderStand() + '|' + verh,
                  ebenen: d.wahl.zoom ? ['genre'] : ['gruppe'] },
             art: 'bild', m, gl, t, farbe: bg.farbe, gezoomt: !!d.wahl.zoom };
  }
  if (raumJetzt === 'groupies'){
    const m = GROUPIE_MASSE.find(x => x.id === groupieMass) || GROUPIE_MASSE[0], gl = groupieGl();
    return { j: await groupieAuftrag(m, verh, gl), art: 'person', m, gl };
  }
  const masse = schaumMasse(), m = masse.find(x => x.id === schaumMass) || masse[0];
  const glieder = schaumGliederungen(), gl = glieder.find(x => x.id === schaumGliederung) || glieder[0];
  return { j: schaumKlangAuftrag(m, gl, schaumZoom, verh), art: 'titel', m, gl };
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
   im Glasfeld ueber). Gemessen wird wie gesetzt (messen: bei der Zahl der Schriftgroesse in mm), fuer die Suche, den
   Lage-Schluessel und das Setzen gleich - nie bei der Breite der Vorschau, die hing am Fenster: Oeffnen, Formatwechsel oder
   Fenstergroesse legten den Schaum ungefragt neu (Fallensuche 1.0.58). Bis 15.10.2026 fest bei 6 px, der breitesten Stufe: auf
   A3 fast gleich (Titel 2 % zu breit), auf grossen Formaten ein zu breiter Block (70 × 100: Titel 12 %). Das gilt bei voller
   Groesse: verkleinert eckeSetzen den Block (s < 1, der Text wurde nach dem Legen laenger, etwa beim Tippen im Titelfeld), setzt es
   die Schrift bei fs·s, und die laeuft breiter als bei fs gemessen (70 × 100 quer, s = 0,32: Titel 13 % = 17 mm in den Schaum,
   Name 4 %, Zeilen 2 %; vorher ebenso). Beim Verlassen des Feldes legt zeichnen neu, dann ist s = 1 und die Ecke auf 0,1 % genau. */
function eckTeile(g){
  const T = g.T, U = g.U, L = g.L;
  const breite = (t, fw, fs) => messen(t, fw, fs) * fs;
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
function schildVorgabe(g, W, H, runden = true){
  const kv = g.karte, k = Math.min(kv.w / W, kv.h / H), ox = kv.x + (kv.w - W * k) / 2, oy = kv.y + (kv.h - H * k) / 2;
  /* Abstand von der Vorderseite (bei Umschlag die Falz), mit Rand vorne von dessen Innenkante - Avatar und Text nie auf dem Rand */
  const vo = g.vorne || { x: BESCHNITT, y: BESCHNITT, w: g.w, h: g.h }, randV = g.randKante ? g.randKante.randV : 0;
  const ecke = eckeJetzt(), abstand = (randV ? 0.03 : 0.04) * g.kurz + randV, xu = (x) => (x - ox) / k, yu = (y) => H - (y - oy) / k;
  const rahmen = { x0: xu(vo.x + abstand), x1: xu(vo.x + vo.w - abstand), y0: yu(vo.y + vo.h - abstand), y1: yu(vo.y + abstand) };
  const teile = eckTeile(g), q = 0.03 * W;
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
  const res = aktuell.res, H = res.height;
  const v = schildVorgabe(g, res.width, H, false), { k, ox, oy } = v;
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
  return { PW: g.PW, PH: g.PH, tiefe: rk.tiefe, luecke: rk.luecke, farben: randFarben(g, aktuell.res, farbeVon), grund: farbWert(grund()) || [12, 13, 16],
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
/* Refrain (refrainAus, skizze-daten.js): der erste [Chorus]/[Refrain]/[Hook]-Abschnitt der Original-Lyrics, höchstens vier Zeilen */
const refrainVorrat = new Map();
async function refrainsHolen(zeilen, wie){
  if (wie === 'keine') return [];
  const songs = zeilen.map(z => (typeof song === 'function' && song(z.id)) || null).filter(x => x && x.id && !x.fremd);
  songs.sort(wie === 'neueste' ? (a, b) => (Date.parse(b.erstellt) || 0) - (Date.parse(a.erstellt) || 0) : (a, b) => (b.likes || 0) - (a.likes || 0));
  const aus = [];
  for (const so of songs.slice(0, 25)){
    /* gemerkt wird nur ein Ergebnis oder „gibt es nicht" - ein Aussetzer löschte sonst die Refrains für die ganze Sitzung */
    if (!refrainVorrat.has(so.id)){ let r = null; try { const a = await fetch('/api/song/' + so.id, { cache: 'no-store' }); if (a.status === 404 || a.status === 400) r = []; else if (a.ok){ const d = await a.json(); r = refrainAus(d && d.lyrics); } } catch (e) {} if (r) refrainVorrat.set(so.id, r); }
    const r = refrainVorrat.get(so.id) || []; if (r.length >= 2) aus.push({ titel: ohneKlammernTitel(so.titel || so.anzeigename || ''), herzen: so.likes || 0, datum: so.erstellt, refrain: r });
    if (aus.length === 3) break;
  }
  return aus;
}
const ohneKlammernTitel = ohneKlammern;   /* wie im Haus (skizze-hand.js): auch verschachtelt, „(Untitled)" bleibt ganz */
/* Das volle Blatt (skizze-blatt.js): Daten des Archivs (skizze-daten.js, je Bau neu - warm 6 ms) und die Bildnisse der Würdigung als
   Federzeichnung (skizze-bildnisse.js: url -> { feder, bild }) */
let blattDaten = null, blattBildnisse = new Map();
const blattKontext = (g, mehr = {}) => ({ g, E, papier: skizzePapier(), kreide: skizzeKreide(), SEP: SKIZZE_SEPIA, SCHRIFT: SKIZZE_SCHRIFT, B: BESCHNITT, daten: blattDaten,
  em: (t) => typeof skizzeBreite === 'function' ? skizzeBreite(t) : String(t).length * 0.4,
  tinte: (farbe) => typeof skizzeTinte === 'function' ? skizzeTinte(farbe || '#888', skizzePapier()) : SKIZZE_SEPIA, ...mehr });
/* Der Grund: Pergament (Wolken, Fasern), zwei Flecken, Stockflecken, eine Faltlinie; Randlinie, Zirkel und Palimpsest zeichnet blattGrund */
function skizzeGrund(g){
  const f = g.kurz / 500, P = g.PW, H = g.PH, n2 = (v) => v.toFixed(2);
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
  return s + blattGrund(blattKontext(g));
}
/* Papier des Skizzenbuchs: der Grund, aber nie dunkel - Feder braucht helles Papier (ein dunkler Farbton machte jede Tinte
   schwarz, das Plakat war leer; Fallensuche 1.0.61) */
const skizzePapier = () => leuchte(E.grund) >= 0.45 && /^#[0-9a-f]{6}$/i.test(E.grund) ? E.grund : '#eee2c6';
/* Der Kreis wie mit Kreide aufgehellt - als Ganzes, nicht je Cluster (Caspar_D, 08.10.2026: „den ganzen kreis weiss aufhellen, nicht
   clusterweise"): das Papier halb zum Weiß; darauf malen die Kacheln ihr Weiß (Tünche unter dem Schaum: blattGrund) */
const skizzeKreide = () => '#' + [1, 3, 5].map(j => { const v = parseInt(skizzePapier().slice(j, j + 2), 16); return Math.round(v + (255 - v) * 0.5).toString(16).padStart(2, '0'); }).join('');

/* Genitiv eines Namens ohne Deppenapostroph (Caspar_D: „uhä, ein Deppenapostroph … natürlich ohne Apostroph"): „Caspar_Ds";
   endet der Name auf s, ß, x, z oder ce, nur der Apostroph („Klaus’") - so die Rechtschreibung. */
const genitiv = (n) => /(s|ß|x|z|ce)$/i.test(n) ? n + '\u2019' : n + 's';
const artName = () => raumJetzt === 'groupies' ? 'Groupieschaum' : bilderschau() ? 'Bilderschau' : 'Klangschaum';   /* Dateiname */
const dauerText = (sek) => { const t = Math.round(sek), h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, x = t % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`; };

function standSetzen(t){ const s = el('ps-stand'); if (s) s.textContent = t || ''; }

/* Neu zeichnen: ist das Seitenverhaeltnis der Karte ein anderes, wird der Schaum neu gelegt (gemerkt wie
   jedes Layout), sonst nur das Bild neu gebaut. */
function zeichnen(sofort, warteMs, nurSetzen){
  clearTimeout(warten);
  warten = setTimeout(async () => {
    const lauf = ++legeLauf;
    /* Lässt der Filter oben keinen Titel übrig, sagt das Studio es mit demselben Satz wie die Ansicht - statt eines leeren Blatts */
    if (raumJetzt !== 'groupies' && typeof titelAuswahl === 'function'){ const au = titelAuswahl();
      if (!au.n){ ++bauLauf; aktuell = null; el('ps-blatt').innerHTML = ''; standSetzen(titelLeerSatz(au)); return; } }
    /* Das Verzeichnis braucht Platz unter der Karte - dafuer muss die Zahl der Eintraege vor dem Legen bekannt sein */
    /* was das Haus zeigt (Maß, Gliederung, Zoom): ändert es sich, ist der Plakatschaum ein anderer - auch die Auswahl der stärksten
       (vorher blieb nach einem Maßwechsel im Haus die alte Auswahl samt Unterzeile stehen; Fallensuche 1.0.62) */
    let hausS = '';
    /* im Groupieschaum dazu der Regler „zeigt N von M" (groupieAuswahl): er ändert die Zeilen, ohne dass sich Maß oder Gliederung ändern */
    const zeigtS = raumJetzt === 'groupies' && typeof groupieZeigt !== 'undefined' ? '|zeigt' + groupieZeigt : '';
    /* Klangschaum und Bilderschau folgen dem Filter oben (index.html titelImFilter, 1.0.80): ein anderer Filter ist ein anderes Haus */
    try { hausS = (raumJetzt === 'groupies' ? [groupieMass, groupieGl().id].join('|') : [schaumMass, schaumGliederung, JSON.stringify(schaumZoom ?? null), typeof karteVerf !== 'undefined' ? karteVerf : '',
      typeof titelFilterSchluessel === 'function' ? titelFilterSchluessel() : ''].join('|')) + zeigtS
      + (bilderschau() ? '|bilder|' + bilderStand() : ''); } catch (e) {}   /* Bilderschau: Transformation, Hängung, Rahmen und die gezeigte Auswahl */
    const gleichesHaus = !!aktuell && aktuell.raum === raumJetzt && aktuell.hausS === hausS;
    /* Gesamtzahl der Zeilen (ohne die Ecke von Randlos) - das Verzeichnis braucht sie vor dem Legen */
    let T = gleichesHaus ? (aktuell.j.gesamt || aktuell.j.zeilen.filter(z => z.id !== SCHILD_ID).length) : 0;
    const alleGezeigten = bilderschau();                /* Bilderschau: alle, die die Ansicht zeigt, höchstens 700 (Ausnahme bei kachelZahl) */
    if (!T && (mitVerzeichnis() || alleGezeigten)){ try { T = (await auftrag(1)).j.zeilen.length; } catch (e) { T = 0; } if (lauf !== legeLauf) return; }
    /* MIT VERZEICHNIS hängt die Kachelzahl an der Höhe des Verzeichnisses und diese an der Kachelzahl. Gesucht ist die GRÖSSTE Zahl n,
       deren Karte (mit einem Verzeichnis für n Einträge) mindestens n Kacheln trägt: f(n) = min(T, kachelZahl(geometrie(n))) fällt mit n,
       also gibt es genau eine Grenze - per Halbierung (vorher pendelte das Plakat bei jeder Reglerbewegung; der erste Ersatz, eine
       Fixpunkt-Iteration, nahm bei einem Zyklus den Startwert: 64 statt 189 Kacheln; Fallensuchen 1.0.62). Nicht in der Bilderschau: dort
       zählt die Ansicht, das Verzeichnis nimmt sich seinen Platz. */
    let n = alleGezeigten ? Math.min(T, KACHELN_HOECHSTENS) : T;
    if (mitVerzeichnis() && T && !alleGezeigten){ const f = (k) => Math.min(T, kachelZahl(geometrie(k))); let lo = 0, hi = T;
      while (lo < hi){ const mid = Math.ceil((lo + hi) / 2); if (f(mid) >= mid) lo = mid; else hi = mid - 1; }
      n = Math.max(1, lo); }
    /* Randlos: das Verhältnis auf drei Stellen, sonst reichte der Schaum in breiten Formaten nicht bis in den Beschnitt (3 × 70 × 100
       quer: 28 mm zu kurz an jeder Seite, 100 × 140 quer: 1,4 mm) */
    const stellen = E.schild ? 1000 : 100, g = geometrie(n), verh = Math.round(g.karte.h / g.karte.w * stellen) / stellen, kachelN = (mitVerzeichnis() || alleGezeigten) && T ? n : kachelZahl(g);
    /* Randlos: Ecke und Block gehoeren zum Auftrag - aendern sie sich (andere Ecke, laengerer Titel), wird neu gelegt */
    const eckS = E.schild ? schildVorgabe(g, 1000, Math.round(1000 * verh)).schluessel : '';
    /* Bilderschau im Triptychon: die Wandfugen sind gesperrte Wand (kein Cover über einem Schnitt) - ändern sie sich, wird neu gehängt */
    const fugS = bilderschau() ? JSON.stringify(wandFugen(g).map(f => f.map(x => Math.round(x)))) : '';
    /* nurSetzen (während des Tippens): die Ecke wird mit dem jetzigen Schaum gesetzt (eckeSetzen verkleinert, falls nötig); neu gelegt
       wird erst beim Verlassen des Feldes oder mit Enter - vorher startete jede Tipppause einen eigenen Lauf */
    if (!aktuell || !gleichesHaus || aktuell.verh !== verh || aktuell.kachelN !== kachelN || aktuell.raum !== raumJetzt || aktuell.schild !== !!E.schild || aktuell.skizze !== !!E.skizze || (aktuell.eckS !== eckS && !nurSetzen) || (aktuell.fugS || '') !== fugS){
      /* der laufende Bau gehört zum alten Schaum: ungültig machen, sonst setzte er seine Seite in den Rahmen des neuen Formats
         (Fallensuche 1.0.62 - das lange Skizzenbuch-Bauen machte das Fenster groß) */
      ++bauLauf;
      let a;
      try { a = begrenzen(await auftrag(verh), kachelN); }
      catch (e){ if (!bilderschau()) throw e;                         /* Bilderschau nicht (oder noch nicht neu) gehängt: sagen, nichts Altes stehen lassen */
        if (lauf !== legeLauf) return; aktuell = null; standSetzen(e.message);
        /* hängt sie am Schirm neu (eine Wahl im Studio oder in der Ansicht), bleibt das alte Blatt bis dahin stehen */
        if (e.neu) wandWartet = true; else el('ps-blatt').innerHTML = '';
        if (!E.kopfTitelEigen) E.kopfTitel = kopfTitelVorschlag(); if (!E.kopfUnterEigen) E.kopfUnter = ''; felderSetzen(); return; }
      if (lauf !== legeLauf) return;
      legendeAreale = arealeDer(a.j);   /* die Ecke von Randlos bemisst ihre Legende danach (schildVorgabe → eckTeile) */
      /* die Vorschlaege fuer Titel, Zeile und Name vor dem Legen: nach ihnen wird die Ecke bemessen */
      if (!E.kopfTitelEigen) E.kopfTitel = kopfTitelVorschlag();
      if (!E.kopfUnterEigen) E.kopfUnter = kopfUnterVorschlag(a);
      if (!E.schildNameEigen) E.schildName = schildNameVorschlag();
      let v = null, ecke = null;
      /* Randlos: der Schaum bekommt die Ecke als eigene Zelle (schildAuftrag), die Bilderschau als gesperrte Wand (bilderEcke) */
      if (E.schild && a.art === 'bild'){ v = schildVorgabe(g, a.j.W, a.j.H); ecke = bilderEcke(v, a.j.W, a.j.H); a.j = { ...a.j, lage: a.j.lage + '|ecke:' + v.schluessel }; }
      else if (E.schild && typeof schildAuftrag === 'function'){ v = schildVorgabe(g, a.j.W, a.j.H); a.j = schildAuftrag(a.j, v); }
      if (E.skizze) a.j = dAuftrag(a.j, g.kreis.schnitt);
      let res;
      if (a.art === 'bild'){
        standSetzen('Die Galerie wird fürs Plakat aufgehängt …');                 /* Caspar_Ds Wortlaut für die Bilderschau, 11.10.2026 */
        try { res = await bilderLageHolen(a.j, bilderSperren(g, a.j.W, a.j.H).concat(ecke ? [ecke.sperre] : [])); }
        catch (e){ if (lauf !== legeLauf) return; standSetzen('Die Bilder passen nicht auf das Plakat.'); console.log('Plakat, Bilderschau:', e); return; }
        /* die Areale als Knoten wie beim Schaum (y nach oben), davor die Ecke als Schild-Knoten: eckeSetzen prüft daran den Block, der Rand
           nimmt daraus seine Farben (randFarben) - gemerkte Hängungen bleiben unverändert */
        res = { ...res, nodes: (ecke ? [{ depth: 0, name: SCHILD_NAME, outline: ecke.umriss }] : [])
          .concat((res.areale || []).map(ar => ({ depth: 0, name: ar.name, outline: ar.poly.map(q => [q[0], res.H - q[1]]) }))) };
      } else {
        standSetzen('Der Schaum wird für das Plakat gelegt …');
        try { res = await schaumLageHolen(a.j, s => { if (lauf === legeLauf) standSetzen(`Der Schaum wird für das Plakat gelegt … ${s} s`); }, true); }
        catch (e){ if (lauf !== legeLauf) return; standSetzen('Der Schaum ließ sich nicht legen.'); console.log('Plakat:', e); return; }
      }
      if (lauf !== legeLauf) return;
      aktuell = { verh, kachelN, hausS, raum: raumJetzt, schild: !!E.schild, skizze: !!E.skizze, eckS: v ? v.schluessel : '', ecke: v ? v.ecke : null, fugS, res, ...a };
      felderSetzen();
    }
    standSetzen('');
    bauen(g);
  }, sofort ? 0 : (warteMs || 120));
}
/* Die Art des Plakats, wie die Ansicht heißt (Studio-Kopf „Plakat · <Art>", Titelvorschlag; Randlos der Bilderschau: „Bilderschau") */
const plakatArt = () => raumJetzt === 'groupies' ? 'Groupieschaum' : bilderschau() ? 'Bilderschau' : 'Klangschaum';
const profil = () => (typeof katalogInfo !== 'undefined' && katalogInfo && katalogInfo.profil) || {};
function kopfTitelVorschlag(){
  const schaum = plakatArt(), p = profil();
  /* Skizzenbuch: erst den Namen schrifttauglich machen (Zierrat weg, sonst Handle), dann das Genitiv-s - vorher „Tarja s Klangschaum" */
  if (E.skizze){ const n = anzeigeName({ name: p.display_name, handle: p.handle }); return n ? genitiv(n) + ' ' + schaum : schaum; }
  /* Bilderschau: „<Name im Genitiv> Bilderschau" (Caspar_D, 11.10.2026: „Caspar_Ds Bilderschau") */
  if (bilderschau() && !E.schild){ const n = p.display_name || p.handle || ''; return n ? genitiv(n) + ' Bilderschau' : 'Bilderschau'; }
  return E.schild ? schaum : (p.display_name || p.handle || 'Mein Archiv') + ' · ' + schaum;    /* Randlos: der Name steht in eigener Zeile darueber */
}
function schildNameVorschlag(){ const p = profil(), n = p.display_name || p.handle || ''; return n ? genitiv(n) : ''; }
/* Randlos: „<Datum> / nnn Titel · Laufzeit" - die Laufzeit ist die Summe der Titellaengen (im Haus heisst „Hoerzeit" Plays mal
   Laenge, das Flaechenmass „Hörzeit (Schätzung)"); „/" bricht in der Ecke die Zeile um. */
const titelAuswahlJetzt = (a) => a && a.art !== 'person' && typeof titelAuswahl === 'function' ? titelAuswahl() : null;
const titelZusatz = (a) => { const au = titelAuswahlJetzt(a); return au ? au.zusatz : ''; };
const titelZahl = (n, a) => { const au = titelAuswahlJetzt(a); return au && !a.gezoomt && !(a.j.ebenen && a.j.ebenen[0] === 'genre') && n === au.n ? au.text : `${n} Titel` + (au ? au.zusatz : ''); };
function kopfUnterVorschlag(a = aktuell){
  if (!a) return '';
  const zl = a.j.zeilen.filter(z => z.id !== SCHILD_ID), n = zl.length, monat = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }), person = a.art === 'person';   /* ohne die Ecke von Randlos */
  /* begrenzt (kachelZahl, im Groupieschaum auch schon am Schirm vom Regler „zeigt N von M"): „die 360 stärksten nach Herzen von 1.523
     Titeln" - genannt wird die Zahl ohne beide Grenzen */
  const ganz = Math.max(a.j.gesamt || 0, a.j.ohneRegler || 0);
  const menge = ganz > n ? `die ${n} stärksten nach ${a.m.name} von ${ganz.toLocaleString('de-DE')} ${person ? 'Personen' : 'Titeln'}` : '';
  if (E.schild || E.skizze){
    const datum = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    if (person) return `${datum} / ${menge || `${n} ${n === 1 ? 'Person' : 'Personen'}`}`;
    const sek = zl.reduce((t, z) => t + (((typeof song === 'function' && song(z.id)) || {}).dauer || 0), 0);
    return `${datum} / ${menge ? menge + titelZusatz(a) : titelZahl(n, a)}` + (sek > 0 ? ` · ${dauerText(sek)} Laufzeit` : '');
  }
  /* Bilderschau: die Transformation gehört zur Fläche, in der Schreibweise des Panels („Fläche ∝ √Abrufe"). Titel: die Auswahl des
     Filters oben wie in der Legende („257 von 330 Titeln · gefiltert: Öffentlich"), solange das Plakat genau sie zeigt; sonst die Zahl
     auf dem Plakat mit dem Filterteil */
  return [menge ? menge + titelZusatz(a) : person ? `${n} ${n === 1 ? 'Person' : 'Personen'}` : titelZahl(n, a), a.art === 'bild' && a.t ? a.t.kurz.replace('Wert', a.m.name) : 'Fläche nach ' + a.m.name,
          'gegliedert nach ' + a.gl.name.replace(/:.*$/, ''), monat].join(' · ');
}

/* Die Legende des Schaums, wie sie im Panel steht: Farbe und Name je Areal. */
/* nach der Begrenzung nur die Gegenden, die noch Kacheln haben (Fallensuche 1.0.62) - gesetzt beim Legen, null = alle */
let legendeAreale = null;
const arealeDer = (j) => { const eb = j.ebenen && j.ebenen[0]; if (eb === 'genre') return null;   /* gezoomt: nicht filtern (Zoomgruppe, „ohne Angabe") */
  return new Set(j.zeilen.filter(z => z.id !== SCHILD_ID).map(z => (eb && z[eb]) || z.gruppe)); };
function legendenEintraege(alle = false){   /* alle: ungefiltert - für die Bemessung des Verzeichnisses, die nicht am vorigen Lauf hängen darf */
  return [...document.querySelectorAll('#schaumlegende .zeile')].map(z => {
    const i = z.querySelector('i'), b = z.querySelector('b');
    return i && b ? { farbe: i.style.background || '#888', name: b.textContent.trim() } : null;
  }).filter(Boolean).filter((e, _, liste) => alle || !legendeAreale || legendeAreale.has(e.name) || !liste.some(x => legendeAreale.has(x.name)));   /* passt kein Name, bleibt alles */
}
/* Breite in em, gemessen bei der Schriftgroesse, mit der das SVG setzt: der Zahl in font-size, in den Einheiten seiner viewBox
   (Seite: mm; Bildebene der Bilderschau: Wandpunkte) als px - nicht die Groesse im Druck. Die Systemschrift des Mac wird klein
   gesetzt breiter (bis 6 px gleich breit, darueber enger); bis 1.0.73 wurde bei mm·96/25,4 px gemessen (davor bei 100 px mit
   Zuschlaegen 1,12 und 1,15, Wiedervorlage §77), und das Verzeichnis lief in die naechste Spalte, Arealnamen stiessen aneinander
   (Caspar_D, 15.10.2026: „Das Textbreitenproblem lösen"). Gemessen auf 70 × 100 quer gegen getComputedTextLength: vorher
   Arealnamen 15 %, Verzeichnis 7 % (bis 8,7 %), Edition 12 % zu schmal; nachher in der Vorschau meist -0,2 bis +0,2 % (ein Titel
   mit zwei Leerzeichen 3 % zu breit - das SVG fasst sie zusammen, gekuerzt wird dort etwas zu frueh). Das ist eine Messung, keine
   Zusage: die Vorschau setzt Chrome bei ihrer Groesse am Bildschirm, und liegt dieselbe Bildschirmgroesse schon im Schriftcache der
   Seite, nimmt es deren Breiten (Probe: font-size 3 bei Massstab 4 nach HTML-Text bei 12 px 7,7 % schmaler als gemessen, font-size
   12 bei Massstab 0,25 nach 3 px 8,4 % breiter). In der App ueber fuenf Fenstergroessen (1280 × 800 bis 3000 × 1800, Klangschaum
   und Bilderschau): -0,2 bis +0,2 %, einmal ein Verzeichnistitel 2,6 % schmaler. Gedruckt gilt die Groesse in mm, ohne Fenster
   (PDF gegen SVG -0,04 Schriftgroessen, Gegenpruefung 15.10.2026). text-rendering="geometricPrecision" macht die Vorschau vom
   Fenster unabhaengig (ueber dieselben fuenf Fenster gleich), misst dann aber bis 0,4 % zu schmal (Verzeichnis A3); es bleibt weg,
   bis Caspar_D ueber diese Abweichung vom Plan entscheidet. */
const messen = (() => { const c = document.createElement('canvas').getContext('2d');
  return (t, gewicht = 400, groesse = null) => { const px = groesse ? Math.max(1, groesse) : 100; c.font = `${gewicht} ${px.toFixed(2)}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`; return c.measureText(t).width / px; }; })();
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

/* === BILDERSCHAU: Hängen, Messen, Bildebene ================================================================================= */
/* Gehängt wird wie am Schirm (bilderschau.js, im Worker bilderschau-worker.js), nur auf der Wand des Plakats. Ein neuer Auftrag
   beendet den laufenden - nur der neueste zählt; fertige Hängungen bleiben für die Sitzung gemerkt (zurück zum vorigen Format hängt
   nicht neu). */
const bilderLagen = new Map(); let bilderHaengt = null;
function bilderLageHolen(j, sperren){
  const W = j.W, H = j.H, saat = typeof schaumSaat === 'function' ? schaumSaat(j.zeilen, ['gruppe'], W, H) : null, seeds = {};
  for (const g of j.gruppen) if (saat && saat[g.name]) seeds[g.name] = saat[g.name];   /* Startpunkte der Areale: ihre Sterne im Klangraum */
  const opt = { ...j.opt, sperren }, schl = [j.lage, W, H, JSON.stringify(opt)].join('|');
  if (bilderLagen.has(schl)) return bilderLagen.get(schl);
  if (bilderHaengt) bilderHaengt.abbrechen();
  const p = new Promise((ok, nein) => {
    const w = new Worker(new URL('./bilderschau-worker.js', import.meta.url), { type: 'module' });
    const ende = (fehler) => { w.terminate(); if (bilderHaengt && bilderHaengt.w === w) bilderHaengt = null; if (fehler){ bilderLagen.delete(schl); nein(fehler); } };
    bilderHaengt = { w, abbrechen: () => ende(new Error('überholt')) };
    w.onmessage = (ev) => { const r = ev.data && ev.data.res;
      if (!r){ ende(new Error((ev.data && ev.data.fehler) || 'Die Bilder passen nicht auf die Wand.')); return; }
      ende(null); r.width = r.W; r.height = r.H; ok(r); };
    w.onerror = (ev) => ende(new Error(ev.message || 'Worker'));
    w.postMessage({ gruppen: j.gruppen, W, H, seeds: Object.keys(seeds).length === j.gruppen.length ? seeds : null, opt, kopfBreite: j.kopfBreite });
  });
  bilderLagen.set(schl, p);
  return p;
}
/* Triptychon: die Wandfugen als gesperrte Wand in Wandpunkten - ein Cover über einer Fuge würde beim Zuschnitt der Rahmen zerschnitten */
function bilderSperren(g, W, H){
  const f = wandFugen(g); if (!f.length) return [];
  const kv = g.karte, k = Math.min(kv.w / W, kv.h / H), ox = kv.x + (kv.w - W * k) / 2;
  return f.map(([a, b]) => ({ x: +((a - ox) / k).toFixed(2), y: -10, w: +((b - a) / k).toFixed(2), h: H + 20 }));
}
/* RANDLOS IN DER BILDERSCHAU (Caspar_D, 15.10.2026, 2a: „freigeben; dort sind die Nummern automatisch aus … Ecke mit Avatar, Titel,
   Legende wie im Klangschaum-Randlos"). Der Block der Ecke (schildVorgabe, Breiten gerundet) samt Luft wird gesperrte Wand bis an die
   Kanten der Ecke - dort hängt kein Cover. umriss: dasselbe Rechteck in Schaum-Einheiten (y nach oben) für blockReserve beim Setzen,
   eine Wandpunkt-Luft größer, damit der ungerundete Block sicher hineinpasst. Nummern gibt es dabei keine (mitVerzeichnis). */
function bilderEcke(v, W, H){
  const t = blockLage(v.block, v.ecke, v.rahmen, 1).filter(q => q.typ !== 'luecke' && q.w > 0 && q.h > 0), d = v.luft + 1;
  let x0 = Math.min(...t.map(q => q.x0)) - d, x1 = Math.max(...t.map(q => q.x1)) + d, y0 = Math.min(...t.map(q => q.y0)) - d, y1 = Math.max(...t.map(q => q.y1)) + d;
  if (v.ecke[1] === 'r') x1 = W + 10; else x0 = -10;
  if (v.ecke[0] === 'u') y0 = -10; else y1 = H + 10;
  return { umriss: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], sperre: { x: +x0.toFixed(2), y: +(H - y1).toFixed(2), w: +(x1 - x0).toFixed(2), h: +(y1 - y0).toFixed(2) } };
}
/* DIE NUMMER AUF DEM COVER (Caspar_D, 11.10.2026: „KEINE Bildunterschriften … die Nummer klein auf jedem Cover in Kontrastfarbe
   (schwarz/weiß), in der Ecke, wo sie am besten lesbar ist"; 15.10.2026: „mach einen Rauchglas Badge unter die Nummer"). Die Ziffern
   stehen auf einem Schild aus Rauchglas, wie die Titel in den Zellen des Schaum-Plakats (Vorlage-Wert titel 'rauch'): darunter das
   Cover weichgezeichnet (Gauß wie SCHAUM_GLAS im Haus, mit einem Viertel Geviert der Ziffern statt mit 3 Punkten -
   die Wand des Plakats hat 1400 Punkte an der langen Seite, 3 Punkte wären auf 70 × 100 dreimal so weich wie auf A3), darüber Schwarz
   nur so dicht, wie die Ziffer es braucht. Die Form ist das Nummernschild der Zellen (nummerSchild im Haus): Ziffern plus 0,7 Geviert
   breit, 1,3 Geviert hoch, Ecken zu 0,3 der Höhe gerundet, Schrift halbfett. Welche Farbe die Ziffern haben und wie dunkel das Glas
   ist, sagt nummerFarbe. Bis 15.10.2026 standen sie #f4f4f2 auf Glas nach schaumRauch (Leuchtdichte darunter höchstens 0,15, die
   Abdunklung mal SCHAUM_RAUCH_STAERKE, höchstens 0,85; gegen die hellsten 10 % unter dem Schild statt 20 %) - gemessen am gemalten
   Grund unter den Ziffern (A3 hoch, Galerie, hellste 10 %): 5,7 bis 19 : 1, Median 14,7, 317 von 330 über 7 : 1.
   Gemessen wird im Messbild: das Original, aus dem auch das Druckbild entsteht, in Stufen (verkleinert) auf 192 Punkte gebracht - die
   Druckbilder (300 dpi) zu messen hieße, jedes Cover bei jeder Vorschau neu zu rechnen; je Bildpunkt die relative Leuchtdichte als
   Wurzel in einem Byte (dunkle Töne fein aufgelöst); einmal je Sitzung und Adresse. */
const MESS_PX = 192, messVorrat = new Map();
const LIN = Array.from({ length: 256 }, (_, i) => { const c = i / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
function messbild(u){
  if (!messVorrat.has(u)) messVorrat.set(u, (async () => {
    try {
      const roh = await (await fetch(u)).blob(), b = await createImageBitmap(roh), f = Math.min(1, MESS_PX / Math.max(b.width, b.height));
      const w = Math.max(1, Math.round(b.width * f)), h = Math.max(1, Math.round(b.height * f)), c = verkleinert(b, w, h); if (b.close) b.close();
      const px = c.getContext('2d').getImageData(0, 0, w, h).data, q = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) q[i] = Math.round(255 * Math.sqrt(0.2126 * LIN[px[4 * i]] + 0.7152 * LIN[px[4 * i + 1]] + 0.0722 * LIN[px[4 * i + 2]]));
      return { w, h, q };
    } catch (e) { messVorrat.delete(u); return null; }   /* nicht zu laden: beim nächsten Bau noch einmal */
  })());
  return messVorrat.get(u);
}
/* Leuchtdichte der hellsten 10 % in einem Feld des Messbilds (Anteile des Bildes 0..1) */
function feldHell(m, x0, x1, y0, y1){
  const X0 = Math.max(0, Math.min(m.w - 1, Math.floor(x0 * m.w))), X1 = Math.max(X0 + 1, Math.min(m.w, Math.ceil(x1 * m.w)));
  const Y0 = Math.max(0, Math.min(m.h - 1, Math.floor(y0 * m.h))), Y1 = Math.max(Y0 + 1, Math.min(m.h, Math.ceil(y1 * m.h)));
  const anz = new Uint32Array(256); let n = 0;
  for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++){ anz[m.q[y * m.w + x]]++; n++; }
  let s = 0; for (let v = 0; v < 256; v++){ s += anz[v]; if (s >= 0.9 * n) return (v / 255) ** 2; }
  return 1;
}
/* Das Maß, nach dem die Lage bei Gleichstand gewählt wird (nummerPlatz): der Kontrast einer hellen Ziffer #f4f4f2 über dem Feld mit der
   Leuchtdichte y, durch Rauchglas nach schaumRauch (Deckkraft a, Abdunkeln um 1 - a senkt die Leuchtdichte etwa um (1 - a) hoch 2,2).
   Bis 15.10.2026 waren das Farbe und Glas jeder Nummer; seit nummerFarbe ist es nur noch das Maß der Lage - so stehen die Nummern auf
   Covern ohne Schrift, wo sie standen (bei gleicher Größe nachgemessen: A3 hoch Galerie und Papier, 70 × 100 quer, keine anders). */
const lageKontrast = (y) => { const s = y <= 0.15 ? 1 : Math.pow(0.15 / y, 1 / 2.2), a = Math.min(0.85, SCHAUM_RAUCH_STAERKE * (1 - s));
  return (leuchte('#f4f4f2') + 0.05) / (y * Math.pow(1 - a, 2.2) + 0.05); };
/* DIE FARBE DER NUMMER (Caspar_D, 15.10.2026: „manchmal erscheinen die Nummern zu dominant, du machst einen minimal contrast aber
   deckelst du auch bei einem maximalcontrast – wie wärs, wenn wir die coverakzentfarbe für die Nummern nehmen, wenn gedeckelt werden
   muß, die ist ja schon berechnet"). Die Ziffern stehen in der Akzentfarbe ihres Covers (farben.akzent - dieselbe, mit der uiFaerben die
   Oberfläche färbt, wenn der Titel läuft); ein Cover ohne Palette (dort färbt uiFaerben grau) nimmt die Farbe seines Areals, die seines
   Rahmens ungedämpft - Grau heißt unsicher. Ihr Kontrast gegen den Grund unter den Ziffern (grundUnter: Cover weichgezeichnet wie das
   Glas, mal Glas) liegt im Band 4,5 … NR_KONTRAST_MAX : 1, in einer von zwei Richtungen: heller als der Grund oder dunkler. Die
   Untergrenze gilt gegen den ungünstigsten Teil des Grunds - für eine helle Ziffer die hellsten 10 %, für eine dunkle die dunkelsten
   10 % -, denn dort muss sie noch lesbar sein. Die Obergrenze gilt gegen das Mittel des Grunds: wie kräftig eine Ziffer wirkt, sieht man
   über ihrer ganzen Fläche, nicht nur am hellsten Fleck; gegen die hellsten 10 % geprüft standen helle Ziffern über dunklen Teilen
   kräftiger als 7 : 1 da (bis 15.10.2026, Gegenprüfung zu c5066cc: gemalt gegen das Mittel bis 10 : 1, 56 von 262 über 7). Farbton heißt
   OKLCH: die Helligkeit L wandert, der Ton H bleibt, die Buntheit C auch, soweit der Bildschirm sie in dieser Helligkeit darstellen kann
   (sonst weniger, wie ausOklch in bin/farben.js - okZuHex schnitte die Kanäle ab, das verschöbe den Ton); L bleibt so nah am Akzent, wie
   das Band es erlaubt. Hell wird höchstens bis L 0,92, so weit hellt auch bin/farben.js einen Akzent gegen seinen Grund auf; dunkel ohne
   Grenze, nahe L 0 ist die Ziffer fast schwarz. Bis 15.10.2026 stand die Ziffer immer heller als ihr Grund, und auf hellen Covern kam
   darum immer Glas darunter; vereinbart war „zu stark → abdunkeln, je nach Grund" (Caspar_D: „gut, gefällt mir das Plakat, du darfst die
   letzten Polierungen noch machen"). Jetzt: je Cover die Richtung, die das Band ohne Glas erreicht, bei beiden die mit dem kleineren
   Schritt vom Akzent (dann hell). Erreicht keine das Band, kommt Glas unter eine helle Ziffer (unter eine dunkle nähme es den Kontrast),
   so wenig wie möglich (Caspar_D: „glasempfehlung a – machen wir so"; kein Mindestschild - ohne Bedarf kein Schwarz, das Schild ist dann
   nur weichgezeichnet): so viel, dass die Ziffer bei L 0,92 gegen die hellsten 10 % die Untergrenze erreicht, und so viel, dass hellste
   10 % und Mittel nicht weiter auseinander liegen als die Grenzen (MAX / MIN) - Glas rückt beide zusammen; sonst läge die Farbe, die die
   Untergrenze hält, über der Obergrenze. Weiß braucht es nie: bei L 0,92 hat jede Farbe mindestens die Leuchtdichte 0,757 (nachgerechnet
   über alle Töne und Buntheiten bis 0,4). NR_KONTRAST_MAX 7 : 1 ist der Startwert - Caspar_D beurteilt am Bild. Gezielt wird mit Abstand
   zu den Grenzen, weil die Rechnung im Messbild den gemalten Grund nicht genau trifft (gemalt unter der Tinte: Bildschirmfoto mit den
   Originalen wie im PDF, Ziffern an und aus, Galerie A3 hoch, Papier A3 hoch, Galerie 70 × 100 quer). Gemalt zu gerechnet, bei NR_SICHER
   1,02 auf allen Seiten: gegen das Mittel Median 1,00 bis 1,01, 95 % höchstens 1,08 - Obergrenze 7 durch NR_SICHER; gegen die hellsten
   10 % (helle Ziffern) Median 1,01, 5 % unter 0,97 bis 0,98 - Untergrenze mal NR_SICHER_HELL 1,03; gegen die dunkelsten 10 % (dunkle
   Ziffern) Median 0,98 bis 0,99, 5 % unter 0,90 bis 0,95 - mal NR_SICHER_DUNKEL 1,08. Damit lagen gemalt gegen den ungünstigsten Teil 11,
   12 und 11 Ziffern unter 4,5 (vorher 14, 15, 13), gegen das Mittel 17, 25 und 23 über 7 (vorher 56, 59, 52). */
const NR_KONTRAST_MIN = 4.5, NR_KONTRAST_MAX = 7, NR_HELL_MAX = 0.92, NR_SICHER = 1.02, NR_SICHER_HELL = 1.03, NR_SICHER_DUNKEL = 1.08;
/* OKLCH in linearem RGB (die Umkehrung von okFarbe im Haus); imTon nimmt die Buntheit in Schritten von 0,004 zurück, bis die Farbe darstellbar ist */
function okLinear(L, C, H){
  const h = H * Math.PI / 180, a = C * Math.cos(h), b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
}
function imTon(L, C, H){
  for (let c = C; ; c = Math.max(0, c - 0.004)){ const v = okLinear(L, c, H);
    if (c === 0 || v.every(x => x >= -1e-6 && x <= 1 + 1e-6))
      return '#' + v.map(x => { x = Math.max(0, Math.min(1, x)); return Math.round(255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055)).toString(16).padStart(2, '0'); }).join(''); }
}
/* Farbe der Ziffern und Deckkraft a des Glases über dem Grund g (Leuchtdichten: hell und dunkel die hellsten und dunkelsten 10 %, mittel
   das Mittel); k ist der Kontrast gegen den ungünstigsten Teil, km der gegen das Mittel, hell die Richtung (Ziffer heller als der Grund) */
function nummerFarbe(basis, g){
  const o = okFarbe(basis), bei = (L) => imTon(L, o.C, o.H), MIN = NR_KONTRAST_MIN * NR_SICHER_HELL, MIND = NR_KONTRAST_MIN * NR_SICHER_DUNKEL, MAX = NR_KONTRAST_MAX / NR_SICHER;
  const KH = (f, y, a = 0) => (leuchte(f) + 0.05) / (y * Math.pow(1 - a, 2.2) + 0.05), KD = (f, y) => (y + 0.05) / (leuchte(f) + 0.05);
  /* die Grenze zwischen lo und hi, an der ja(L) umschlägt (ja gilt bei lo, nicht bei hi) */
  const grenze = (lo, hi, ja) => { for (let i = 0; i < 24; i++){ const L = (lo + hi) / 2; if (ja(L)) lo = L; else hi = L; } return lo; };
  const wahl = [];
  /* hell, über Glas der Deckkraft a (der Grund mal (1 - a) hoch 2,2): L von unten (die dunkelste Farbe, die gegen die hellsten 10 % MIN
     erreicht) bis oben (die hellste, die gegen das Mittel MAX hält), höchstens bis L1; so nah am Akzent wie möglich. Liegt oben unter
     unten, gilt unten - die Untergrenze geht vor */
  const L1 = Math.max(o.L, NR_HELL_MAX), hell = bei(L1);
  const setze = (a) => { const KA = (f, y) => KH(f, y, a);
    const unten = KA(bei(0), g.hell) >= MIN ? 0 : L1 - grenze(0, L1, (d) => KA(bei(L1 - d), g.hell) >= MIN);
    const oben = KA(bei(0), g.mittel) > MAX ? 0 : grenze(0, L1, (L) => KA(bei(L), g.mittel) <= MAX);
    const f = bei(Math.max(unten, Math.min(o.L, oben)));
    return { farbe: f, a, k: KA(f, g.hell), km: KA(f, g.mittel), hell: true }; };
  const ohne = setze(0);
  if (ohne.k >= MIN && ohne.km <= MAX + 1e-9) wahl.push(ohne);
  else {
    /* Glas, so wenig wie möglich: s = (1 - a) hoch 2,2 so klein, dass L1 gegen die hellsten 10 % MIN erreicht und das Band zwischen
       hellsten 10 % und Mittel nicht weiter ist als MAX / MIN ((hell · s + 0,05) / (mittel · s + 0,05) - Glas rückt beide zusammen);
       a aufgerundet, gesetzt wird es auf drei Stellen */
    const r = MAX / MIN, sMin = Math.min(1, ((leuchte(hell) + 0.05) / MIN - 0.05) / g.hell, g.hell > r * g.mittel ? 0.05 * (r - 1) / (g.hell - r * g.mittel) : 1);
    wahl.push(sMin >= 1 ? ohne : setze(Math.ceil((1 - Math.pow(sMin, 1 / 2.2)) * 1000) / 1000));
  }
  /* dunkel: L von unten (die dunkelste Farbe, die gegen das Mittel MAX hält) bis oben (die hellste, die gegen die dunkelsten 10 % MIND
     erreicht); ohne Glas - Schwarz darunter nähme der dunklen Ziffer den Kontrast */
  if (KD(bei(0), g.dunkel) >= MIND){
    const oben = grenze(0, 1, (L) => KD(bei(L), g.dunkel) >= MIND);
    const unten = KD(bei(0), g.mittel) <= MAX ? 0 : 1 - grenze(0, 1, (d) => KD(bei(1 - d), g.mittel) <= MAX);
    const f = bei(Math.min(oben, Math.max(unten, o.L)));
    wahl.push({ farbe: f, a: 0, k: KD(f, g.dunkel), km: KD(f, g.mittel), hell: false });
  }
  /* zuerst die Richtung im Band, dann die mit dem wenigsten Glas, dann die mit dem kleinsten Schritt vom Akzent (L), dann hell */
  const schritt = (w) => Math.abs(okFarbe(w.farbe).L - o.L);
  const imBand = (w) => w.k >= (w.hell ? MIN : MIND) - 1e-9 && w.km <= MAX + 1e-9;
  wahl.sort((p, q) => imBand(q) - imBand(p) || p.a - q.a || schritt(p) - schritt(q) || q.hell - p.hell);
  return wahl[0];
}
/* Leuchtdichte des Grunds unter den Ziffern, wie Chrome das Schild malt: das Cover weichgezeichnet (Gauß mit sx, sy in Anteilen; drei
   Kastenfilter), dabei nimmt der Filter das Cover rund um das Schild mit - er schneidet erst das Ergebnis aufs Schild zu, edgeMode ändert
   daran nichts (Probe 15.10.2026) -, und jenseits der Kante des Covers ist nichts: dort wird das Glas durchsichtig, und darunter liegt das
   scharfe Cover. Gerechnet in den Werten des Messbilds (Wurzel der Leuchtdichte, nahe an sRGB, wie das Glas mit
   color-interpolation-filters="sRGB"); davon im Feld T der Ziffern (ihre Breite, Grundlinie bis Ziffernhöhe) die hellsten und die
   dunkelsten 10 % und das Mittel der Leuchtdichte. Wie gut das trifft, steht bei NR_SICHER; nur das Schild mit fortgesetzten Rändern zu
   rechnen traf kaum schlechter. */
function grundUnter(m, R, T, sx, sy){
  const radius = (s) => Math.max(0, Math.round((Math.sqrt(4 * s * s + 1) - 1) / 2));   /* drei Kästen der Breite 2r + 1 ≈ Gauß mit s */
  const rx = radius(sx * m.w), ry = radius(sy * m.h);
  /* das Schild samt 3 r ringsum (so weit reichen die drei Kästen), am Cover abgeschnitten */
  const X0 = Math.max(0, Math.floor(R[0] * m.w) - 3 * rx), X1 = Math.min(m.w, Math.max(X0 + 1, Math.ceil(R[2] * m.w) + 3 * rx));
  const Y0 = Math.max(0, Math.floor(R[1] * m.h) - 3 * ry), Y1 = Math.min(m.h, Math.max(Y0 + 1, Math.ceil(R[3] * m.h) + 3 * ry));
  const w = X1 - X0, h = Y1 - Y0, v = new Float32Array(w * h), d = new Float32Array(w * h).fill(1), t = new Float32Array(Math.max(w, h));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) v[y * w + x] = m.q[(Y0 + y) * m.w + X0 + x];
  /* ein Kasten über n Werte im Abstand schritt, für zeilen Zeilen ab z · zs; außerhalb zählt 0 (jenseits des Covers durchsichtig) */
  const kasten = (a, r, n, schritt, zeilen, zs) => { if (!r) return; for (let z = 0; z < zeilen; z++){ const o = z * zs;
    for (let i = 0; i < n; i++){ let s = 0; for (let j = Math.max(0, i - r); j <= Math.min(n - 1, i + r); j++) s += a[o + j * schritt]; t[i] = s / (2 * r + 1); }
    for (let i = 0; i < n; i++) a[o + i * schritt] = t[i]; } };
  const glas = v.slice();
  for (const a of [glas, d]) for (let p = 0; p < 3; p++){ kasten(a, rx, w, 1, h, w); kasten(a, ry, h, w, w, 1); }
  const tx0 = Math.max(0, Math.floor(T[0] * m.w) - X0), tx1 = Math.min(w, Math.max(tx0 + 1, Math.ceil(T[2] * m.w) - X0));
  const ty0 = Math.max(0, Math.floor(T[1] * m.h) - Y0), ty1 = Math.min(h, Math.max(ty0 + 1, Math.ceil(T[3] * m.h) - Y0));
  const werte = []; for (let y = ty0; y < ty1; y++) for (let x = tx0; x < tx1; x++){ const i = y * w + x; werte.push(glas[i] + (1 - d[i]) * v[i]); }
  werte.sort((p, q) => p - q);
  const L = (v) => (v / 255) ** 2;
  return { hell: L(werte[Math.min(werte.length - 1, Math.floor(0.9 * werte.length))]), dunkel: L(werte[Math.floor(0.1 * werte.length)]),
    mittel: werte.reduce((s, v) => s + L(v), 0) / werte.length };
}
/* Höhe der Ziffern in em (Oberkante über der Grundlinie), aus der Schrift gemessen */
let ziffernHoch = null;
const ziffernHoehe = () => ziffernHoch || (ziffernHoch = (() => { const c = document.createElement('canvas').getContext('2d');
  c.font = '600 100px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'; const a = c.measureText('0123456789').actualBoundingBoxAscent / 100;
  return a > 0.4 && a < 1 ? a : 0.72; })());
/* MINDESTGRÖSSE NACH DIN 1450 (Caspar_D, 15.10.2026: „und 1 mm kleine Nummern kann keiner lesen, 2.5 mm ist das kleinste" - „wir nehmen
   die offizielle Standardgrenze für Gedrucktes"). DIN 1450:2013 (Schriften - Leserlichkeit), Textart Konsultationstext (Nummern,
   Verzeichnis), Leseabstand 40 cm, gute Beleuchtung, Visus 0,7: die x-Höhe sieht man unter mindestens 10′, x = 2 · 400 mm · tan(5′) =
   1,16 mm (DIN_X; Rechenweg wie leserlich.info/schriftgroessenrechner). DIN misst die x-Höhe, nicht die Schriftgröße: die Schwelle der
   Schriftgröße ist DIN_X durch das x-Höhen-Verhältnis der Schrift, wie sie gesetzt wird (xHoehe: „x" bei 100 px, actualBoundingBoxAscent,
   gemessen wie messen() misst) - gleiches Maß beidseits. leserlich.info rechnet mit 0,47 und kommt auf 7 pt; system-ui misst auf dem Mac
   0,508 (normal) und 0,518 (halbfett), die Schwelle liegt dort bei 2,29 mm = 6,5 pt bzw. 2,25 mm = 6,4 pt. Liefert die Leinwand nichts
   Brauchbares, gilt 0,47. Ersetzt die 1,0 mm, die bis 15.10.2026 galten. */
const DIN_X = 2 * 400 * Math.tan(5 / 60 * Math.PI / 180), xVorrat = new Map();
const xHoehe = (gewicht) => { if (!xVorrat.has(gewicht)){ const c = document.createElement('canvas').getContext('2d');
  c.font = `${gewicht} 100px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`; const a = c.measureText('x').actualBoundingBoxAscent / 100;
  xVorrat.set(gewicht, a > 0.3 && a < 0.8 ? a : 0.47); } return xVorrat.get(gewicht); };
/* WO DIE NUMMER STEHT (Caspar_D, 15.10.2026: Die Nummer meidet die Coverschrift; „Gesichter sollten die Nummern auch meiden"; „kannst du
   die nummer noch so weit wie möglich weg vom Text positionieren bitte"). Eine Lage ist frei, wenn ihr Schild samt einem Viertel Geviert
   Luft keine Schriftbox und kein Gesicht aus dem Gesichterbuch berührt (schaumFokus: alle Boxen, ohne die 35-%-Regel und ab der Schwelle
   des Erkenners); das Schild hält ein Viertel Geviert Abstand von den Kanten des Covers. Größe der Ziffern von der Schwelle (nrSchwelle)
   bis 3,5 mm, sonst 8,5 % der kurzen Coverseite, höchstens so groß, dass das Schild samt Luft ins Cover passt (nummerStart). Je Größe,
   von der größten an in Schritten von 10 % bis zur Schwelle, zuerst die vier Ecken, dann die Kanten (je Kante 41 Lagen, gleich
   verteilt); die erste Größe mit einer freien Lage gilt - eine Lage an der Kante in voller Größe geht also vor einer kleineren Nummer in
   der Ecke. Unter den freien Lagen gewinnt die mit dem größten Abstand zur Coverschrift (Rand des Schilds bis zum Rand der nächsten
   Schriftbox, in mm); was bis ein Viertel Geviert näher liegt, gilt als gleich weit, dort entscheidet der Kontrast (lageKontrast; dann
   die erste von ur, ul, or, ol bzw. entlang der Kante). Nach der Lesbarkeit wählt die Lage nicht mehr, die Farbe passt sich an
   (nummerFarbe). Ein Cover ohne erkannte Schrift wählt wie bisher: in den Ecken nach dem Kontrast, an der Kante die Lage mit dem
   kürzesten Weg von einer Ecke (bis ein Viertel Geviert weiter gleich nah, dann der Kontrast). Ist bei keiner Größe eine Lage frei, steht
   sie bei der Schwelle an der Kante dort, wo das Schild Schrift und Gesichter am wenigsten überdeckt ('min'). Bis 15.10.2026 entschied
   in den Ecken immer der Kontrast, und an die Kante kam die Nummer erst, wenn auch bei der Schwelle keine Ecke frei war; bei gleicher
   Größe (beide mit der Schwelle nach DIN 1450) standen die Nummern auf Covern mit Schrift im Mittel 4,89 mm von ihr, jetzt 5,73 mm (A3
   hoch, Galerie, 237 Nummern, eine davon näher als vorher; 70 × 100 quer 15,41 und 19,06 mm, keine näher). Die Untergrenze 1,5 mm der
   Startgröße (die kleinste Schrift des Verzeichnisses ab 333 mm kurzer Seite) ist gelöscht: die Schwelle liegt darüber (im Druck auf
   dem Mac 2,25 mm, unter 1,5 mm erst bei einer x-Höhe über 0,77 der Schriftgröße; Bildformate 2,4 Seiteneinheiten). Jede Stufe legt
   das Schild samt Luft ganz ins Cover. NUR WAS PASST (Caspar_D, 15.10.2026: „warum zeigen wir was, was eigentlich nicht geht … Zeige
   nur die Nummer, wenn sie [hinein]passt oder lasse sie ganz weg und schreibe sie ins Werkverzeichnis als extra Abschnitt …, deren Zellen/Rechtecke zu klein für eine Darstellung sind"): passt sie bei der Schwelle nicht, bekommt das Cover keine Nummer und
   kein Schild, sein Titel steht im Verzeichnis unter „Zu klein für eine Nummer" (bilderEbene). Bis dahin hielt eine Mindestgröße von
   0,8 mm die Nummer auch auf zu kleinen Covern, das Schild ragte dann über den Rand (330 Titel: frei 10 × 10 cm 132 Schilder, die
   Ziffern bei 87; 10 × 15 cm 55; Bild 1:1 41). Die Bildformate sind fürs Lesen am Bildschirm, dort gilt die Lesegrenze des Hauses
   (Hausregel 14: 12 px; das PNG ist 1080 Punkte breit, eine Seiteneinheit sind 1080 / Breite Punkte - bildSichern); bis dahin 1,0
   Seiteneinheiten, 5 Punkte bei 1:1 und 4 bei 4:5 quer. Ohne Eintrag im Buch weicht nichts aus (Hinweis im Studio). An jeder Nummer:
   data-ecke (die Ecke, 'kante' oder 'min'), data-stufe (ecke: Ecke in voller Größe, kleiner: Ecke kleiner, kante, min), data-feld (das
   Schild in Anteilen des Covers: x0,y0,x1,y1), data-k (Kontrast gegen den ungünstigsten Teil des Grunds, wie gesetzt), data-km (gegen
   sein Mittel), data-a (Deckkraft des Glases), data-ton (akzent oder areal: woher die Farbe kommt). Bis 15.10.2026 hatte jede Ecke einen zweiten, tieferen Abstand (anderthalb Geviert), wenn keine
   4,5 : 1 erreichte - die Ziffern standen sonst auf dem eigenen Rahmen mancher Cover (Holzschnitte). Das Glas deckt diese Linie ab;
   der zweite Abstand ist gelöscht. */
const schneidet = (a, b, mx = 0, my = 0) => Math.min(a[2] + mx, b[2]) > Math.max(a[0] - mx, b[0]) && Math.min(a[3] + my, b[3]) > Math.max(a[1] - my, b[1]);
const ueberdeckt = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
/* Schwelle einer Nummer in Seiteneinheiten (mm): im Druck DIN 1450 für die Schrift im Gewicht gewicht (halbfett wie die Nummern auf
   Covern und Schildern; die Titel der Zellen und das Verzeichnis stehen normal), bei den Bildformaten 12 Punkte des PNG (Hausregel 14) */
const nrSchwelle = (g, gewicht = 600) => (FORMATE.find(x => x.id === E.format) || {}).bild ? 12 * g.w / 1080 : DIN_X / xHoehe(gewicht);
/* Startgröße der Nummer t auf einem Cover bw × bh (mm), höchstens so groß, dass das Schild samt einem Viertel Geviert Luft hineinpasst
   (Ziffern plus 1,2 Geviert breit, 1,8 Geviert hoch); null, wenn es selbst bei der Schwelle nicht passt */
function nummerStart(t, bw, bh, schwelle){
  const em = messen('0'.repeat(t.length), 600, 2);   /* Nullen bei 2 px: eine Obergrenze für jede Nummer (B1, 15.10.2026) */
  const fs0 = Math.min(Math.max(schwelle, Math.min(3.5, 0.085 * Math.min(bw, bh))), bw / (em + 1.2), bh / 1.8);
  return fs0 >= schwelle - 1e-9 ? fs0 : null;
}
/* Lage, Größe, Farbe und Glas der Nummer t auf einem Cover bw × bh (mm); k: mm je Wandpunkt, m: Messbild, schrift und gesichter: Boxen
   in Anteilen des Covers, basis: die Farbe vor dem Anpassen */
function nummerPlatz(t, bw, bh, k, m, schrift, gesichter, schwelle, basis){
  const fs0 = nummerStart(t, bw, bh, schwelle), sperre = schrift.concat(gesichter), hoch = ziffernHoehe();
  const groessen = []; for (let f = fs0; f > schwelle + 1e-9; f *= 0.9) groessen.push(f); groessen.push(Math.min(fs0, schwelle));
  /* das Schild bei Schriftgröße f, in Anteilen des Covers; die Ziffern bei f/k gemessen wie gesetzt (Wandpunkte) */
  const schild = (f) => { const tw = messen('0'.repeat(t.length), 600, f / k) * f, luft = 0.25 * f;
    return { f, fw: (tw + 0.7 * f) / bw, fh: 1.3 * f / bh, gx: luft / bw, gy: luft / bh }; };
  const frei = (R, S) => !sperre.some(b => schneidet(R, b, S.gx, S.gy));
  const kontrast = (R) => lageKontrast(m ? feldHell(m, R[0], R[2], R[1], R[3]) : leuchte(grund()));   /* Bild nicht zu laden: es fehlt auch im Plakat */
  const abstand = (R) => Math.min(...schrift.map(b => Math.hypot(Math.max(0, b[0] - R[2], R[0] - b[2]) * bw, Math.max(0, b[1] - R[3], R[1] - b[3]) * bh)));
  /* die beste der Lagen (R; d: Weg von der Ecke): mit Schrift die weiteste von ihr, ohne die nächste an einer Ecke - bis ein Viertel
     Geviert schlechter gilt als gleich, dort der Kontrast */
  const waehle = (lagen, f) => { const wert = lagen.map(schrift.length ? (l) => abstand(l.R) : (l) => -l.d), gut = Math.max(...wert) - 0.25 * f - 1e-9;
    let beste = null, bk = -Infinity; lagen.forEach((l, i) => { if (wert[i] < gut) return; const kk = kontrast(l.R); if (kk > bk){ bk = kk; beste = l; } }); return beste; };
  /* die Lagen entlang der vier Kanten (Ecken eingeschlossen) */
  const kanten = (S) => { const N = 40, lagen = [];
    for (let j = 0; j <= N; j++){
      const x0 = S.gx + (1 - S.fw - 2 * S.gx) * j / N, y0 = S.gy + (1 - S.fh - 2 * S.gy) * j / N;
      const dx = Math.min(x0 - S.gx, 1 - S.gx - S.fw - x0) * bw, dy = Math.min(y0 - S.gy, 1 - S.gy - S.fh - y0) * bh;   /* Weg von der Ecke in mm */
      for (const y of [S.gy, 1 - S.gy - S.fh]) lagen.push({ R: [x0, y, x0 + S.fw, y + S.fh], d: dx });
      for (const x of [S.gx, 1 - S.gx - S.fw]) lagen.push({ R: [x, y0, x + S.fw, y0 + S.fh], d: dy });
    }
    return lagen; };
  /* Farbe und Glas zuletzt, über dem Grund unter den Ziffern (ihre Breite, Grundlinie bis Ziffernhöhe, mittig im Schild) */
  const fertig = (R, f, ecke, stufe) => { const tw = messen(t, 600, f / k) * f / bw, th = hoch * f / bh, cx = (R[0] + R[2]) / 2, cy = (R[1] + R[3]) / 2;
    const y = m ? 0 : leuchte(grund()), g = m ? grundUnter(m, R, [cx - tw / 2, cy - th / 2, cx + tw / 2, cy + th / 2], 0.25 * f / bw, 0.25 * f / bh) : { hell: y, dunkel: y, mittel: y };
    return { R, f, ecke, stufe, ...nummerFarbe(basis, g) }; };
  for (const [i, f] of groessen.entries()){ const S = schild(f);
    const ecken = ECKEN.map(e => { const x0 = e[1] === 'r' ? 1 - S.gx - S.fw : S.gx, y0 = e[0] === 'u' ? 1 - S.gy - S.fh : S.gy;
      return { R: [x0, y0, x0 + S.fw, y0 + S.fh], d: 0, ecke: e }; }).filter(l => frei(l.R, S));
    if (ecken.length){ const l = waehle(ecken, f); return fertig(l.R, f, l.ecke, i ? 'kleiner' : 'ecke'); }
    const kante = kanten(S).filter(l => frei(l.R, S));
    if (kante.length){ const l = waehle(kante, f); return fertig(l.R, f, 'kante', 'kante'); }
  }
  const f = groessen[groessen.length - 1]; let beste = null;
  for (const l of kanten(schild(f))){ const u = sperre.reduce((s, b) => s + ueberdeckt(l.R, b), 0), kk = kontrast(l.R);
    if (!beste || u < beste.u - 1e-12 || (Math.abs(u - beste.u) <= 1e-12 && kk > beste.kk)) beste = { u, kk, R: l.R }; }
  return fertig(beste.R, f, 'min', 'min');
}
/* DIE BILDEBENE: Rahmen (die Farbe des Areals zu 38 % in den Grund gemischt, wie am Schirm gedämpft), das Cover im Originalformat -
   in der Vorschau aus dem Bildvorrat, fürs PDF das Original (data-voll; druckBilder rechnet es auf 300 dpi seiner Größe) - und die
   Nummer auf ihrem Glas (nummerPlatz). Nummeriert wird wie im Werkverzeichnis des Schaums: Areal für Areal in der Reihenfolge der
   Legende, darin in Lesereihenfolge (Zeilen von 0,7 mittleren Bildkanten Höhe, in der Zeile von links nach rechts) - aber nur die Cover,
   auf die ihre Nummer bei der Schwelle passt (nummerStart, mit den Ziffern, die sie dort bekäme): die Nummern am Bild laufen lückenlos
   1 … N. Die übrigen stehen ohne Nummer am Ende des Verzeichnisses, Areal für Areal (zuKlein, verzeichnisSetzen), und gemessen wird nur,
   was eine Nummer trägt. NUMMERN AUSBLENDBAR WIE IN DEN TREEMAPS (Caspar_D, 15.10.2026: „Mach wie in den Treemaps die Nummer
   ausblendbar"): ohne Verzeichnis keine Nummern und keine Liste (mitVerzeichnis). Seit das Plakat der Bilderschau alle gezeigten Titel
   hängt (kachelZahl, 15.10.2026), sind auf kleinen Formaten viele Cover zu klein für ihre Nummer; wie viele, wie viele Nummern an der
   Kante stehen oder keine freie Stelle fanden und wie viele Cover das Buch noch nicht kennt, sagt nrStand (im Studio unter dem Format). */
async function bilderEbene(g, kv, lauf){
  const res = aktuell.res, W = res.width, H = res.height, k = Math.min(kv.w / W, kv.h / H);     /* mm je Wandpunkt */
  const zeile = new Map(aktuell.j.zeilen.map(z => [z.id, z])), farbeAmSchirm = aktuell.farbe || (() => null), farbe = (n) => farbeAmSchirm(n) || '#8a8d94';
  const mitNummern = !!g.verz, schwelle = nrSchwelle(g);
  /* Nummern: Areal für Areal (Reihenfolge der Legende), darin Zeile für Zeile - wer bei der Schwelle nicht passt, kommt nach zuKlein */
  const verzeichnis = [], nummer = new Map(); let nr = 0;
  if (mitNummern){
    const seiten = res.bilder.map(b => Math.sqrt(b.w * b.h)).sort((a, b) => a - b), band = 0.7 * (seiten[seiten.length >> 1] || 1);
    const leg = legendenEintraege(true).map(e => e.name), summe = new Map();
    for (const b of res.bilder) summe.set(b.gruppe, (summe.get(b.gruppe) || 0) + (+(zeile.get(b.id) || {}).w || 0));
    const rang = (a) => { const i = leg.indexOf(a); return i < 0 ? leg.length : i; };
    for (const a of [...summe.keys()].sort((p, q) => rang(p) - rang(q) || summe.get(q) - summe.get(p))){
      const liste = res.bilder.filter(b => b.gruppe === a).sort((p, q) => Math.floor((p.y + p.h / 2) / band) - Math.floor((q.y + q.h / 2) / band) || (p.x + p.w / 2) - (q.x + q.w / 2));
      const q = { name: a, farbe: farbe(a), weitere: 0, eintraege: [], zuKlein: [] };
      for (const b of liste){ const titel = String((zeile.get(b.id) || {}).titel || '').trim();
        if (nummerStart(String(nr + 1), b.w * k, b.h * k, schwelle) == null){ q.zuKlein.push(titel); continue; }
        nummer.set(b.id, ++nr); q.eintraege.push({ nr, titel }); }
      verzeichnis.push(q);
    }
  }
  const ids = [...nummer.keys()], mess = new Map(), offen = ids.slice(); let n = 0;
  if (ids.length && typeof schaumGesichterLaden === 'function') await schaumGesichterLaden();   /* Schrift und Gesichter (ohne Buch: {}) */
  await Promise.all(Array.from({ length: 4 }, async () => { while (offen.length){ const id = offen.shift(); mess.set(id, await messbild(artworkBild(id)));
    if (lauf === bauLauf && (++n % 20 === 0 || n === ids.length)) standSetzen(`Die Ecken der Cover werden vermessen … ${n} von ${ids.length}`); } }));
  if (lauf !== bauLauf) return null;
  const gr = farbWert(grund()) || [12, 13, 16];
  const misch = (f) => '#' + (farbWert(f) || [138, 141, 148]).map((v, i) => Math.round(v * 0.38 + gr[i] * 0.62).toString(16).padStart(2, '0')).join('');
  const pxJeMm = ((el('ps-blatt') || {}).clientWidth || 800) / g.PW * (window.devicePixelRatio || 1), hoch = ziffernHoehe(), f2 = (v) => v.toFixed(2);
  let out = '';
  /* Bis 15.10.2026 zählte nrStand auch die Nummern unter 1,5 mm (die kleinste Schrift des Verzeichnisses ab 333 mm kurzer Seite); seit
     der Schwelle nach DIN 1450 (auf dem Mac 2,25 mm, siehe nummerStart) gibt es keine mehr - gelöscht. */
  const nrStand = mitNummern ? { von: ids.length, kante: 0, min: 0, ohneBuch: 0 } : null;
  /* die Farbe vor dem Anpassen (nummerFarbe): der Akzent des Covers, wenn es eine Palette hat (wie uiFaerben: farben.toene), sonst die
     Farbe seines Areals - als #rrggbb */
  const alsHex = (f) => { const v = farbWert(f); return v ? '#' + v.map(x => x.toString(16).padStart(2, '0')).join('') : null; };
  const basisVon = (b) => { const s = typeof song === 'function' ? song(b.id) : null, fa = s && s.farben;
    return fa && fa.toene && fa.toene.length && okFarbe(fa.akzent) ? { farbe: fa.akzent, ton: 'akzent' } : { farbe: alsHex(farbe(b.gruppe)) || '#8a8d94', ton: 'areal' }; };
  for (const [i, b] of res.bilder.entries()){
    const r = b.rahmen || 0, u = artworkBild(b.id), href = esc2(schaumBildHref(u, schaumStufe(Math.max(b.w, b.h) * k * pxJeMm)));
    if (r > 0) out += `<rect x="${f2(b.x - r)}" y="${f2(b.y - r)}" width="${f2(b.w + 2 * r)}" height="${f2(b.h + 2 * r)}" fill="${misch(farbe(b.gruppe))}"/>`;
    out += `<image href="${href}" data-voll="${esc2(u)}" data-id="${esc2(b.id)}" x="${f2(b.x)}" y="${f2(b.y)}" width="${f2(b.w)}" height="${f2(b.h)}" preserveAspectRatio="none"/>`;
    if (!nummer.has(b.id)) continue;
    const fo = typeof schaumFokus === 'function' ? schaumFokus(b.id) : null; if (!fo) nrStand.ohneBuch++;
    const t = String(nummer.get(b.id)), ba = basisVon(b), p = nummerPlatz(t, b.w * k, b.h * k, k, mess.get(b.id), fo ? fo.schrift || [] : [], fo ? fo.gesichter || [] : [], schwelle, ba.farbe);
    if (p.ecke === 'kante') nrStand.kante++; if (p.ecke === 'min') nrStand.min++;
    /* das Schild in Wandpunkten; darunter das Cover weichgezeichnet (Filter nur über dem Schild), darauf Schwarz in der Deckkraft a - nur, wo es gebraucht wird */
    const sx = b.x + p.R[0] * b.w, sy = b.y + p.R[1] * b.h, sw = (p.R[2] - p.R[0]) * b.w, sh = (p.R[3] - p.R[1]) * b.h, form = `x="${f2(sx)}" y="${f2(sy)}" width="${f2(sw)}" height="${f2(sh)}"`;
    out += `<clipPath id="ps-nrs${i}"><rect ${form} rx="${f2(0.3 * sh)}"/></clipPath>`
      + `<filter id="ps-nrg${i}" filterUnits="userSpaceOnUse" ${form} color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${(0.25 * p.f / k).toFixed(3)}" edgeMode="duplicate"/></filter>`
      + `<image href="${href}" data-voll="${esc2(u)}" x="${f2(b.x)}" y="${f2(b.y)}" width="${f2(b.w)}" height="${f2(b.h)}" preserveAspectRatio="none" filter="url(#ps-nrg${i})" clip-path="url(#ps-nrs${i})"/>`
      + (p.a > 0 ? `<rect class="ps-rauch" ${form} rx="${f2(0.3 * sh)}" fill="#000" opacity="${p.a.toFixed(3)}"/>` : '')
      + `<text class="ps-nr" x="${f2(sx + sw / 2)}" y="${f2(sy + sh / 2 + hoch * p.f / 2 / k)}" font-size="${(Math.ceil(p.f / k * 1000 - 1e-6) / 1000).toFixed(3)}" font-weight="600" fill="${p.farbe}" text-anchor="middle"`
      + ` data-id="${esc2(b.id)}" data-ecke="${p.ecke}" data-stufe="${p.stufe}" data-feld="${p.R.map(v => v.toFixed(4)).join(',')}" data-k="${p.k.toFixed(2)}" data-km="${p.km.toFixed(2)}" data-a="${p.a.toFixed(3)}" data-ton="${ba.ton}"`
      + ` style="font-variant-numeric:tabular-nums">${t}</text>`;
  }
  /* ÜBERSCHRIFTEN UND BILDUNTERSCHRIFTEN (E2(a), Caspar_D 15.10.2026: wählbar, Vorgabe wie am Schirm - aus; die Nummern bleiben). Die
     Hängung hat beides schon freigehalten (bilderschau.js: Gruppenschilder als gesperrte Wand, je Bild b.schild unter dem Rahmen, nur bei
     Bildern ab schildMin breit); gesetzt wird wie am Schirm (.bwkopf 12,5 / 11, .bwschild 10,5 Punkte), in Wandpunkten, also mit dem
     Plakat skaliert. Der Name in der Farbe seines Areals, dahinter leise die Zahl; der Titel auf die Breite seines Bildes gekürzt
     (gemessen wie gesetzt, messen). */
  const leiseF = schriftLeise(), kuerzen = (t, fs, breite) => { if (messen(t, 400, fs) * fs <= breite) return t;
    let a = 0, b = t.length; while (a < b){ const m = (a + b + 1) >> 1; if (messen(t.slice(0, m).trimEnd() + '…', 400, fs) * fs <= breite) a = m; else b = m - 1; }
    return a ? t.slice(0, a).trimEnd() + '…' : ''; };
  for (const a of res.schilder || []){ const n = res.bilder.filter(b => b.gruppe === a.name).length;
    out += `<text class="ps-bwkopf" x="${f2(a.x)}" y="${f2(a.y + 13)}" font-size="12.5" font-weight="600" fill="${farbe(a.name)}">${esc2(a.name)}`
      + `<tspan font-size="11" font-weight="400" fill="${leiseF}"> ${n} Titel</tspan></text>`; }
  for (const b of res.bilder){ if (!(b.schild > 0)) continue;
    const fs = 10.5 * b.schild / 15, t = kuerzen(String((zeile.get(b.id) || {}).titel || '').trim(), fs, b.w); if (!t) continue;
    out += `<text class="ps-bwschild" x="${f2(b.x)}" y="${f2(b.y + b.h + (b.rahmen || 0) + 2 + fs)}" font-size="${fs.toFixed(2)}" fill="${leiseF}">${esc2(t)}</text>`; }
  standSetzen('');
  return { svg: `<svg class="ps-schaum" x="${f2(kv.x)}" y="${f2(kv.y)}" width="${f2(kv.w)}" height="${f2(kv.h)}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${out}</svg>`,
           verzeichnis: g.verz ? verzeichnis : null, areale: (res.areale || []).map(a => ({ name: a.name, farbe: farbe(a.name), pts: a.poly })), nrStand };
}
async function bauen(g){
  if (!aktuell) return;
  const lauf = ++bauLauf, blatt = el('ps-blatt'); if (!blatt) return;
  legendeAreale = arealeDer(aktuell.j);
  const s = schaumFarbeAnteil / 100, kv = g.karte;
  /* Vorschau-Massstab fuer den Bildvorrat: Bildschirmpunkte je Schaum-Einheit */
  const pxBreite = blatt.clientWidth || 800, massstab = (pxBreite * (kv.w / g.PW)) / aktuell.res.width * (window.devicePixelRatio || 1);
  const druck = { titel: E.titel, fugen: E.fugen, wackeln: E.wackeln, schatten: E.schatten, vignette: E.vignette, kissen: E.kissen,
                  deck: (Math.max(0, 2 * s - 1) * 0.65).toFixed(3), ton: Math.min(1, 2 * s).toFixed(3), massstab,
                  verzeichnis: !!g.verz, mmJeEinheit: Math.min(kv.w / aktuell.res.width, kv.h / aktuell.res.height), nrSchwelle: nrSchwelle(g),
                  nrSchwelleTitel: nrSchwelle(g, 400) };
  { const k = druck.mmJeEinheit, ox = kv.x + (kv.w - aktuell.res.width * k) / 2;             /* die Fugen in Schaum-Einheiten */
    druck.waende = wandFugen(g).map(([a, b]) => [(a - ox) / k, (b - ox) / k]); }
  /* Bilderschau: Farben und Zoom von der Wand am Schirm (der Klangschaum-Auftrag gehört zum Schaum) */
  const la = aktuell.art === 'bild' ? { farbeVon: aktuell.farbe, gezoomt: aktuell.gezoomt }
    : schaumLetzterAuftrag && schaumLetzterAuftrag.art === aktuell.art ? schaumLetzterAuftrag : null;
  if (!la){ standSetzen('Bitte den Schaum einmal anzeigen lassen, dann das Plakat öffnen.'); return; }
  /* Erst die Bilder, dann das Plakat (Caspar_D, 07.10.2026: keine mindere Qualitaet) - meist schon bereit,
     denn der Schaum war vorher zu sehen; sonst „Bilder werden vorbereitet …" wie im Haus (bilderBereit). */
  let skHinweis = '', refrains = [], svg, verzeichnis, areale, nrStand = null;
  if (aktuell.art === 'bild'){
    const ebene = await bilderEbene(g, kv, lauf); if (!ebene || lauf !== bauLauf) return;
    ({ svg, verzeichnis, areale, nrStand } = ebene);
  } else {
  if (E.skizze){
    /* Skizzenbuch: statt der Cover die Federzeichnungen (auf dem Server gerechnet); die Schrift muss vor dem Messen geladen sein */
    const [fb] = await Promise.all([federBereit(aktuell.j.zeilen, t => { if (lauf === bauLauf) standSetzen(t); }, () => lauf !== bauLauf), schriftGeladen()]);
    if (lauf !== bauLauf) return;
    refrains = await refrainsHolen(aktuell.j.zeilen, E.refrains || 'herzen'); if (lauf !== bauLauf) return;
    const melde = t => { if (lauf === bauLauf) standSetzen(t); }, abgebrochen = () => lauf !== bauLauf;
    /* erst holen, dann prüfen, dann übernehmen: ein abgebrochener Lauf darf die Daten des neuen nicht überschreiben (Fallensuche 1.0.62) */
    const daten = await blattDatenHolen({ songVonId: typeof songVonId !== 'undefined' ? songVonId : null, katalogInfo: typeof katalogInfo !== 'undefined' ? katalogInfo : null, melde, abgebrochen });
    if (lauf !== bauLauf) return;
    /* erst nach den Covern: ein laufender Federlauf hielte den Bildnislauf sonst bis zum Zeitwächter auf; sein letzter Hinweis (Fotos
       statt Federn, und warum) bleibt stehen */
    const avatare = ((daten && daten.wuerdigung) || []).map(p => p.avatar).filter(Boolean);
    let bnHinweis = '';
    const bn = avatare.length ? await bildnisseBereit(avatare, { melde: t => { bnHinweis = t; melde(t); }, abgebrochen }) : new Map();
    if (lauf !== bauLauf) return;
    blattDaten = daten; blattBildnisse = bn;
    druck.skizze = { papier: skizzeKreide(), tintePapier: skizzePapier(), feder: fb.karte, mass: SKIZZE_MASS, fsMin: 2.6 * g.kurz / 500, fsMax: 12 * g.kurz / 500, strich: 0.29 * g.kurz / 500, linie: 0.25 * g.kurz / 500 };
    Object.assign(druck, { kissen: false, schatten: 0, vignette: 0, wackeln: 0 });
    skHinweis = [fb.hinweis || (skizzePapier() !== E.grund ? 'Feder braucht hellen Grund – das Plakat bleibt auf Pergament.' : ''), bnHinweis].filter(Boolean).join(' · ');
  } else {
  const bereit = await bilderBereit(aktuell.art, aktuell.j.zeilen, t => { if (lauf === bauLauf) standSetzen(t); });
  if (lauf !== bauLauf) return;
  if (bereit === 'morgenlauf'){ standSetzen('Schaum kommt mit dem nächsten Morgenlauf.'); return; }
  }
  standSetzen(skHinweis);
  ({ svg, verzeichnis, areale } = await schaumSvgBauen(aktuell.res, { zeilen: aktuell.j.zeilen, ebenen: aktuell.j.ebenen, farbeVon: la.farbeVon, gezoomt: la.gezoomt, art: aktuell.art, druck }));
  if (lauf !== bauLauf) return;
  if (areale) randArealFarben = new Map(areale.map(a => [a.name, a.farbe]));
  svg = svg.replace('<rect width="100%" height="100%" fill="#121417"/>', '')
           .replace('<svg ', `<svg class="ps-schaum" x="${kv.x.toFixed(2)}" y="${kv.y.toFixed(2)}" width="${kv.w.toFixed(2)}" height="${kv.h.toFixed(2)}" `);
  svg = eigeneIds(svg, 'ps-');
  }
  const fg = schrift(), leise = schriftLeise();
  /* Federstrich: eine Haarlinie einige Millimeter um die Karte, auf dem Passepartout */
  const d = 0.011 * g.kurz;
  const feder = E.feder && !E.schild ? `<rect x="${(kv.x - d).toFixed(2)}" y="${(kv.y - d).toFixed(2)}" width="${(kv.w + 2 * d).toFixed(2)}" height="${(kv.h + 2 * d).toFixed(2)}" fill="none" stroke="${fg}" stroke-opacity="0.75" stroke-width="${E.federMm}"/>` : '';
  /* Museumsschild im unteren Rand: links Titel und Untertitel, rechts die Legende in Spalten */
  const ux = kv.x, zy = kv.y + kv.h + (E.feder ? d : 0) + g.rand * 0.4, uy = kv.y + kv.h + (E.feder ? d : 0) + g.rand * 0.5 + g.zeitH, rechts = kv.x + kv.w;
  let kopf = E.schild || E.skizze ? '' : `<text class="ps-kopf" x="${ux.toFixed(2)}" y="${(uy + g.T).toFixed(2)}" font-size="${g.T.toFixed(2)}" font-weight="600" fill="${fg}">${esc2(E.kopfTitel || '')}</text>`
    + `<text class="ps-kopf" x="${ux.toFixed(2)}" y="${(uy + g.T * 1.25 + g.U * 1.25).toFixed(2)}" font-size="${g.U.toFixed(2)}" fill="${leise}">${esc2(E.kopfUnter || '')}</text>`;
  /* Legende rechts im Schild, in Spalten von oben nach unten. Gesetzt wird in zwei Schritten: erst ins Bild,
     dann die wirkliche Textlaenge gemessen und die Spalten von rechts her ausgerichtet (legendeSetzen) - damals
     mass die Leinwand bei 100 px, und die Systemschrift laeuft klein gesetzt breiter (gesehen: 22 % zu schmal, die
     Spalten ueberlappten; die Schrift ist dieselbe). Seit messen bei der gesetzten Groesse misst, waere es fast
     gleich; das Nachmessen bleibt, weil die Vorschau davon abweichen kann (siehe messen). */
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
  let verzL = null;
  if (g.verz && verzeichnis){ const v = verzeichnisSetzen(verzeichnis, g, ux, uy + g.schildH + g.rand * 0.4, fg, leise); kopf += v.svg; verzL = v.L; }
  if (E.schild && aktuell.schild && aktuell.ecke === eckeJetzt()) kopf += eckeSetzen(g, fg, leise);
  if (E.skizze && g.skizze && aktuell.skizze){
    const leg = la.gezoomt && areale ? areale.map(a => ({ name: a.name, farbe: a.farbe })) : legendenEintraege();
    const eb = aktuell.j.ebenen[0], zahl = new Map(); for (const z of aktuell.j.zeilen){ const a = z[eb] || z.gruppe; zahl.set(a, (zahl.get(a) || 0) + 1); }
    const ctx = blattKontext(g, { legende: leg, refrains, feder: druck.skizze.feder, res: aktuell.res, zeilen: aktuell.j.zeilen, ebene: eb, arealFarbe: (a) => randArealFarben.get(a),
      avatar: avatarDa(), edition: E.edition ? editionText() : '', song: typeof song === 'function' ? song : null, bildnisse: blattBildnisse,
      arealZahlen: leg.map(e => ({ ...e, n: zahl.get(e.name) || 0 })).filter(e => e.n) });
    kopf += blattSchmuck(ctx) + `<rect width="${g.PW.toFixed(2)}" height="${g.PH.toFixed(2)}" fill="url(#ps-altrand)" pointer-events="none"/>`;
    /* für Formatproben von außen (headless, alle Formate durchgehen): wie voll das beschreibbare Blatt ist (Anteil belegter Rasterzellen) -
       am Vorschau-Element, nicht im Bild */
    blatt.dataset.belegung = ctx.voll.toFixed(3);
  }
  /* Triptychon: die Wandfugen in der Vorschau abgedunkelt, mit Schnittlinien - im PDF fallen sie ohnehin weg */
  if (g.tri) for (let j = 1; j < 3; j++){ const fx = BESCHNITT + j * g.tri.pw + (j - 1) * g.tri.fuge;
    kopf += `<rect class="ps-trifuge" x="${fx.toFixed(2)}" y="0" width="${g.tri.fuge.toFixed(2)}" height="${g.PH.toFixed(2)}" fill="#08090b" fill-opacity="0.9"/>`; }
  const seite = `<svg class="ps-seite" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g.PW.toFixed(2)} ${g.PH.toFixed(2)}" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif">`
    + `<rect width="${g.PW.toFixed(2)}" height="${g.PH.toFixed(2)}" fill="${g.skizze ? skizzePapier() : grund()}"/>` + (g.randKante ? '<g class="ps-randbild"></g>' : '') + (g.skizze && aktuell.skizze ? skizzeGrund(g) : '') + feder + svg + kopf
    + `<rect class="ps-beschnitt" x="${BESCHNITT}" y="${BESCHNITT}" width="${(g.PW - 2 * BESCHNITT).toFixed(2)}" height="${(g.PH - 2 * BESCHNITT).toFixed(2)}" fill="none" stroke="#8a929c" stroke-width="${(g.kurz / 900).toFixed(2)}" stroke-dasharray="${(g.kurz / 120).toFixed(2)} ${(g.kurz / 160).toFixed(2)}"/>`
    + (g.randKante && g.randKante.umschlag ? `<rect class="ps-beschnitt ps-falz" x="${g.vorne.x}" y="${g.vorne.y}" width="${g.w}" height="${g.h}" fill="none" stroke="#c9ced6" stroke-opacity="0.7" stroke-width="${(g.kurz / 1200).toFixed(2)}" stroke-dasharray="${(g.kurz / 300).toFixed(2)} ${(g.kurz / 200).toFixed(2)}"/>` : '') + '</svg>';
  blatt.innerHTML = seite;
  seitenGeometrie.set(blatt.querySelector('svg.ps-seite'), { g, rand: g.randKante && la ? randAuftrag(g, la.farbeVon, 1) : null });
  einpassen();
  if (g.randKante) randSetzen(g, la, lauf);
  if (legende) legendeSetzen(blatt.querySelector('svg.ps-seite'), legende);
  /* Rauchglas je Kopf nach Bedarf, wie am Schirm */
  const schaum = blatt.querySelector('svg.ps-schaum');
  if (aktuell.art !== 'bild' && E.titel === 'rauch' && schaum && typeof schaumRauch === 'function') schaumRauch(schaum);
  if (aktuell.art !== 'bild' && E.titel === 'kante' && schaum && typeof schaumKantenKontrast === 'function') schaumKantenKontrast(schaum, schaumFarbeAnteil / 100);   /* schwarz oder weiss nach dem Grund */
  const fm = FORMATE.find(x => x.id === E.format) || {};
  el('ps-mass').textContent = g.tri ? `drei Rahmen je ${(g.tri.pw / 10).toLocaleString('de-DE')} × ${(g.tri.ph / 10).toLocaleString('de-DE')} cm, Fuge ${(g.tri.fuge / 10).toLocaleString('de-DE')} cm · 3 mm Beschnitt` : fm.bild ? `1080 × ${Math.round(1080 * g.h / g.w)} Punkte · PNG`
    : g.randKante && g.randKante.umschlag ? `${(g.w / 10).toLocaleString('de-DE')} × ${(g.h / 10).toLocaleString('de-DE')} cm + ${(g.randKante.umschlag / 10).toLocaleString('de-DE')} cm Umschlag = ${((g.w + 2 * g.randKante.umschlag) / 10).toLocaleString('de-DE')} × ${((g.h + 2 * g.randKante.umschlag) / 10).toLocaleString('de-DE')} cm · 3 mm Beschnitt`
    : `${(g.w / 10).toLocaleString('de-DE')} × ${(g.h / 10).toLocaleString('de-DE')} cm · 3 mm Beschnitt`;
  /* WAS BEI DIESER EINSTELLUNG NICHT GEHT (Caspar_D, 15.10.2026: „warum zeigen wir was, was eigentlich nicht geht, wenigstens eine
     Warnung vor Dingen die sinnfrei sind, wäre schön"): eine Zeile unter dem Format, gesperrt wird nichts. Sie nennt, wie viele Cover
     bzw. Zellen zu klein für ihre Nummer sind (sie stehen am Ende des Verzeichnisses), und ob das Verzeichnis selbst unter der Schwelle
     steht - im Druck der nach DIN 1450 für seine Schrift (normal gesetzt; nrSchwelle, DIN_X). Caspar_D, 15.10.2026, zum Werkverzeichnis
     („a, genau"): nur warnen, nicht vergrößern, etwa „Werkverzeichnis unter DIN 1450 (3,8 pt statt 7 pt)". Beide Zahlen sind Schriftgrößen
     in Punkt (72 je Zoll) der Schrift, wie sie gesetzt ist - gleiches Maß beidseits: die 7 pt aus leserlich.info gelten für eine x-Höhe
     von 0,47 der Schriftgröße, system-ui hat auf dem Mac 0,508, die Schwelle steht dort bei 6,5 pt (2,29 mm). Auf eine Stelle, die Schrift
     gerundet, die Schwelle aufgerundet; träfen sie sich, die Schrift abgerundet - so steht nie „6,5 pt statt 6,5 pt". Bei den
     Bildformaten bleibt es bei 12 Bildpunkten („nicht lesbar (Schrift … Bildpunkte)", abgerundet - gerundet stünde bei 11,996
     „12 Bildpunkte"). Danach, nur in der Bilderschau, wie die Nummern stehen: an der Kante, ohne freie Stelle, und wie viele Cover das
     Gesichterbuch noch nicht kennt (bilderEbene, nummerPlatz). Bleibt stehen wie das Maß, standSetzen leert es nicht. Einen Lauf des
     Buchs stößt das Studio nicht an. Bis 15.10.2026
     zählte die Zeile auch Schilder, die über ihr Cover ragten - entschieden am 15.10.2026: der Satz entfällt, keines ragt mehr hinaus -,
     und Nummern unter 1,5 mm: seit der Schwelle nach DIN 1450 gibt es keine mehr (nrStand). Bei K = 1 in der Einzahl (stand: „1 Zellen …
     sie stehen", Gegenprüfung). */
  { const h = el('ps-nrklein'), st = nrStand, pt = fm.bild ? 1080 / g.w : 0, sinnfrei = [], teile = [];
    const K = (verzeichnis || []).reduce((n, q) => n + (q.zuKlein || []).length, 0), personen = aktuell.art === 'person';
    if (g.verz && K) sinnfrei.push(aktuell.art === 'bild' ? (K === 1 ? '1 Cover zu klein für seine Nummer – es steht am Ende des Verzeichnisses' : `${K} Cover zu klein für ihre Nummer – sie stehen am Ende des Verzeichnisses`)
      : K === 1 ? '1 Zelle zu klein für ihre Nummer – sie steht am Ende des Verzeichnisses' : `${K} Zellen zu klein für ihre Nummer – sie stehen am Ende des Verzeichnisses`);
    const verzName = personen ? 'Verzeichnis der Personen' : 'Werkverzeichnis', verzMin = nrSchwelle(g, 400);
    const zehntelPt = (mm) => mm * 72 / 25.4 * 10, soll = Math.ceil(zehntelPt(verzMin) - 1e-6), ist = (z) => Math.round(z) < soll ? Math.round(z) : Math.floor(z + 1e-6);
    const punkt = (z) => (z / 10).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' pt';
    if (verzL != null && verzL < verzMin - 1e-9) sinnfrei.push(pt ? `${verzName} nicht lesbar (Schrift ${(Math.floor(verzL * pt * 100 + 1e-6) / 100).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Bildpunkte)`
      : `${verzName} unter DIN 1450 (${punkt(ist(zehntelPt(verzL)))} statt ${punkt(soll)})`);
    if (st && st.kante) teile.push(`${st.kante} an der Kante, weil keine Ecke frei war`);
    if (st && st.min) teile.push(`${st.min} ohne freie Stelle – sie decken Schrift oder Gesicht so wenig wie möglich`);
    const text = [sinnfrei.length ? sinnfrei.join('; ') + '.' : '', teile.length ? `Nummern auf den Covern: ${teile.join('; ')}.` : '',
      st && st.ohneBuch ? `${st.ohneBuch} Cover sind noch nicht auf Schrift und Gesichter untersucht – ihre Nummern weichen dort nicht aus.` : ''].filter(Boolean).join(' ');
    h.hidden = !text; h.textContent = text; }
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
   allein am Fuss einer Spalte. Zu lange Titel werden mit … gekuerzt, gemessen wie gesetzt (messen; die Koepfe in ihrem
   Gewicht 600 - bis 15.10.2026 mit 400 gemessen, rund 4 % zu schmal). Reichen die Zeilen mit den echten Arealen nicht, wird die
   Schrift kleiner, bis der Block passt. ZU KLEIN FÜR EINE NUMMER (Caspar_D, 15.10.2026, Variante a: „… oder lasse sie ganz weg und
   schreibe sie ins Werkverzeichnis als extra Abschnitt"): die Titel, deren Cover bzw. Zelle bei der Schwelle keine Nummer trägt
   (zuKlein je Areal), stehen am Ende in einem eigenen Abschnitt „Zu klein für eine Nummer (K)", Areal für Areal mit denselben Köpfen,
   ohne Nummer, bündig mit den Titeln darüber. Jeder Titel steht genau einmal; die Kopfzeile zählt alle. Ein Areal ohne Nummer fehlt oben.
   Die Überschrift bricht in zwei Zeilen um, wenn sie breiter ist als eine Spalte (sie ist gut 16 Geviert breit, eine Spalte mindestens
   15 samt einem Geviert Abstand); bemessen wird mit zwei Zeilen für sie. Sie steht nie ohne Kopf und ersten Titel am Fuß einer Spalte. Gibt die Schrift zurück (L, Hinweis). */
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
  return [E.auflage || '1/1', new Date().toLocaleDateString('de-DE'), E.skizze ? anzeigeName({ name: p.display_name, handle: p.handle }) : (p.display_name || p.handle || '')].filter(Boolean).join(' · ');
}
function editionSetzen(g, rechts, y, fg, leise){
  const text = editionText();
  const fs = Math.min(g.rand * 0.18, 0.0062 * g.kurz), tw = messen(text, 400, fs) * fs, linie = 0.16 * g.w, x1 = rechts - tw - fs * 1.4, f2 = (v) => v.toFixed(2);
  return `<text x="${f2(rechts)}" y="${f2(y)}" font-size="${f2(fs)}" fill="${leise}" text-anchor="end">${esc2(text)}</text>`
    + `<line x1="${f2(x1 - linie)}" y1="${f2(y + fs * 0.15)}" x2="${f2(x1)}" y2="${f2(y + fs * 0.15)}" stroke="${fg}" stroke-opacity="0.7" stroke-width="${f2(g.kurz / 2800)}"/>`;
}
function verzeichnisSetzen(gruppen, g, x0, y0, fg, leise){
  const personen = aktuell && aktuell.art === 'person';
  const nNr = gruppen.reduce((s, q) => s + q.eintraege.length, 0), zk = gruppen.filter(q => q.zuKlein && q.zuKlein.length), K = zk.reduce((s, q) => s + q.zuKlein.length, 0);
  const n = nNr + K, zeilen = [];
  for (const q of gruppen){
    if (!q.eintraege.length && !q.weitere) continue;                 /* alle Titel des Areals zu klein: es steht nur unten */
    zeilen.push({ kopf: q.name, farbe: q.farbe });
    for (const e of q.eintraege) zeilen.push(e);
    if (q.weitere) zeilen.push({ rest: `und ${q.weitere.toLocaleString('de-DE')} weitere` });
  }
  const abschnitt = `Zu klein für eine Nummer (${K.toLocaleString('de-DE')})`;
  if (K){ zeilen.push({ abschnitt });
    for (const q of zk){ zeilen.push({ kopf: q.name, farbe: q.farbe }); for (const t of q.zuKlein) zeilen.push({ ohneNr: t }); } }
  const koepfe = zeilen.filter(z => z.kopf !== undefined).length;
  /* mit den echten Arealen in den reservierten Platz, notfalls bis 1 mm Schrift */
  const fug = wandFugen(g), strecken = fug.length ? freieStrecken(x0, x0 + g.w - 2 * g.rand, fug).map(([a, b]) => [a - x0, b - a]) : null;
  const m = verzeichnisMass(n + (K ? 2 : 0), g.w - 2 * g.rand, g.kurz, g.verz.hoehe * 1.02, koepfe, 1, strecken);
  const L = m.L, zh = L * 1.38, nrB = messen('0'.repeat(String(Math.max(1, nNr)).length), 400, L) * L;
  const kuerzen = (t, b, fw = 400) => { if (messen(t, fw, L) * L <= b) return t; let k = t.length; while (k > 1 && messen(t.slice(0, k) + '…', fw, L) * L > b) k--; return t.slice(0, k) + '…'; };
  /* die Überschrift des Abschnitts: passt sie nicht in die schmalste Spalte, zwei Zeilen, so gleich lang wie möglich (an Wortgrenzen) */
  if (K){ const w = abschnitt.split(' '), breite = (t) => messen(t, 600, L) * L; let teile = [abschnitt];
    if (breite(abschnitt) > Math.min(...m.bs) - L){ let best = null;
      for (let j = 1; j < w.length; j++){ const t = [w.slice(0, j).join(' '), w.slice(j).join(' ')], b = Math.max(...t.map(breite)); if (!best || b < best.b) best = { b, t }; }
      teile = best.t; }
    const i = zeilen.findIndex(z => z.abschnitt !== undefined); zeilen.splice(i, 1, ...teile.map((t, j) => ({ abschnitt: t, erst: j === 0, n: teile.length }))); }
  let out = `<text x="${x0.toFixed(2)}" y="${(y0 + L * 1.2).toFixed(2)}" font-size="${(L * 1.1).toFixed(2)}" font-weight="600" letter-spacing="${(L * 0.06).toFixed(2)}" fill="${leise}">`
    + `${personen ? 'VERZEICHNIS DER PERSONEN' : 'WERKVERZEICHNIS'} · ${n.toLocaleString('de-DE')} ${personen ? 'Personen' : 'Titel'}</text>`;
  const oben = y0 + 2.4 * L;
  let s = 0, r = 0;
  zeilen.forEach((z) => {
    /* ein Kopf nie allein am Fuß, die Überschrift des Abschnitts nie ohne Kopf und ersten Titel */
    if (r >= m.proSpalte || (z.kopf !== undefined && r >= m.proSpalte - 1) || (z.erst && r >= m.proSpalte - z.n - 1)){ s++; r = 0; }
    const sp = Math.min(s, m.xs.length - 1), x = x0 + m.xs[sp], y = oben + r * zh + L, spB = m.bs[sp], titelB = spB - nrB - 1.6 * L;
    if (z.abschnitt !== undefined){
      out += `<text class="ps-zk-kopf" x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-size="${L.toFixed(2)}" font-weight="600" fill="${leise}">${esc2(z.abschnitt)}</text>`;
    } else if (z.kopf !== undefined){
      out += `<rect x="${x.toFixed(2)}" y="${(y - L * 0.78).toFixed(2)}" width="${(L * 0.8).toFixed(2)}" height="${(L * 0.8).toFixed(2)}" rx="${(L * 0.15).toFixed(2)}" fill="${z.farbe}"/>`
        + `<text x="${(x + L * 1.2).toFixed(2)}" y="${y.toFixed(2)}" font-size="${L.toFixed(2)}" font-weight="600" fill="${fg}">${esc2(kuerzen(z.kopf, spB - 2.6 * L, 600))}</text>`;
    } else if (z.rest){
      out += `<text x="${(x + nrB + 0.6 * L).toFixed(2)}" y="${y.toFixed(2)}" font-size="${L.toFixed(2)}" font-style="italic" fill="${leise}">${esc2(z.rest)}</text>`;
    } else if (z.ohneNr !== undefined){
      out += `<text class="ps-zk" x="${(x + nrB + 0.6 * L).toFixed(2)}" y="${y.toFixed(2)}" font-size="${L.toFixed(2)}" fill="${fg}">${esc2(kuerzen(z.ohneNr, titelB))}</text>`;
    } else {
      out += `<text x="${(x + nrB).toFixed(2)}" y="${y.toFixed(2)}" font-size="${L.toFixed(2)}" text-anchor="end" fill="${leise}" style="font-variant-numeric:tabular-nums">${z.nr}</text>`
        + `<text x="${(x + nrB + 0.6 * L).toFixed(2)}" y="${y.toFixed(2)}" font-size="${L.toFixed(2)}" fill="${fg}">${esc2(kuerzen(z.titel, titelB))}</text>`;
    }
    r++;
  });
  return { svg: out, L };
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
    const papier = g.skizze ? skizzePapier() : grund();
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
   Bild schon klein genug, bleibt seine Adresse; ist es nicht zu laden (fremder Avatar ohne CORS), auch.
   Ein Cover der Bilderschau (preserveAspectRatio „none": das ganze Bild im eigenen Format) braucht genau seine Größe. */
let druckAdressen = [];
async function druckBilder(s, kopie, g){
  druckAdressen.forEach(u => URL.revokeObjectURL(u)); druckAdressen = [];
  const mmProPunkt = g.PW / s.getBoundingClientRect().width, PX_PRO_MM = 300 / 25.4, bedarf = new Map();
  for (const im of s.querySelectorAll('image[data-voll]')){
    const r = im.getBoundingClientRect(), u = im.getAttribute('data-voll');
    const fuellt = im.getAttribute('preserveAspectRatio') === 'none' ? 1 : 1.34;
    bedarf.set(u, Math.max(bedarf.get(u) || 0, Math.ceil(Math.max(r.width, r.height) * mmProPunkt * PX_PRO_MM * fuellt)));
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
/* Geometrie und Randauftrag, mit denen eine Seite gebaut wurde: der Export nimmt sie von der Seite, nicht aus den Reglern - ändert man
   während des Exports etwas, rechnete er sonst die alte Seite mit der neuen Geometrie und malte den Rand in Farben der neuen Vorlage
   (Fallensuche 1.0.62). randFuer: der festgehaltene Auftrag in der verlangten Auflösung. */
const seitenGeometrie = new WeakMap();
const randFuer = (eintrag, g, px) => eintrag && eintrag.rand ? { ...eintrag.rand, pxJeMm: px } : randAuftrag(g, schaumLetzterAuftrag.farbeVon, px);
async function bildSichern(){
  const blatt = el('ps-blatt'), s = blatt && blatt.querySelector('svg.ps-seite'); if (!s) return;
  const sg = seitenGeometrie.get(s), g = (sg && sg.g) || geometrie(aktuell ? aktuell.j.zeilen.length : 0), B = 1080, H = Math.round(B * g.h / g.w), k = B / g.w;
  const kopie = s.cloneNode(true);
  /* die Lagen der Bilder vor dem ersten Warten messen: ersetzt bauen die Seite inzwischen, wären sie 0 (alle Bilder auf 32 px) */
  const ohneRand = (i) => !i.classList.contains('ps-rand'), lagenVorher = [...s.querySelectorAll('image')].filter(ohneRand).map(i => i.getBoundingClientRect()), seiteVorher = s.getBoundingClientRect();
  kopie.querySelectorAll('.ps-beschnitt').forEach(n => n.remove());
  kopie.setAttribute('viewBox', `${BESCHNITT} ${BESCHNITT} ${g.w} ${g.h}`); kopie.setAttribute('width', B); kopie.setAttribute('height', H); kopie.removeAttribute('style');
  /* der Rand fürs Bild eigens gemalt, in der Auflösung des Bildes (vorher die grobe Vorschau, hochgezogen - Fallensuche 1.0.60) */
  const randZiel = kopie.querySelector('g.ps-randbild');
  if (randZiel && g.randKante && aktuell && schaumLetzterAuftrag){
    standSetzen('Der Rand wird gemalt …');
    try { const st = await randRechnen(randFuer(sg, g, Math.min(10, Math.ceil(k * 1.5 * 2) / 2)));
      const daten = await Promise.all(st.map(x => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => ok(null); r.readAsDataURL(x.blob); })));
      randZiel.innerHTML = randBilder(st, daten); } catch (e){ console.log('Plakat, Rand:', e); }
  }
  const bilder = [...kopie.querySelectorAll('image')].filter(i => !i.classList.contains('ps-rand')), seite = seiteVorher, proPunkt = B / seite.width * (g.PW / g.w);
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
    const r = lagenVorher[i] || null, px = Math.min(1024, Math.max(32, Math.ceil(r ? Math.max(r.width, r.height) * proPunkt * 1.5 : 256)));
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
    a.download = artName() + '-' + g.name.replace(/[^\w-]+/g, '') + '.png';
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
  const sg = seitenGeometrie.get(s), g = (sg && sg.g) || geometrie(), kopie = s.cloneNode(true);
  kopie.querySelectorAll('.ps-beschnitt').forEach(n => n.remove());
  /* für den Zuschnitt des Triptychons: Lagen vor dem Warten messen (siehe bildSichern) */
  const sr = s.getBoundingClientRect(), proEinheit = sr.width / g.PW, lagen = [...s.querySelectorAll('image')].map(i => i.getBoundingClientRect());
  /* erst messen (druckBilder liest die Lage der Bilder in der angezeigten Seite), dann warten: ändert man während des Randmalens
     etwas im Panel, ersetzt bauen die Seite - vorher kamen dann die vollen Originale ins PDF (Fallensuche 1.0.60) */
  standSetzen('Die Bilder werden für den Druck gerechnet …');
  await druckBilder(s, kopie, g);
  /* der Rand fürs PDF fein gemalt (8 Punkte je mm) - die Vorschau trägt nur die grobe Fassung */
  const randZiel = kopie.querySelector('g.ps-randbild');
  if (randZiel && g.randKante && aktuell && schaumLetzterAuftrag){
    standSetzen('Der Rand wird für den Druck gemalt …');
    try { const st = await randRechnen(randFuer(sg, g, 8), f => standSetzen(`Der Rand wird für den Druck gemalt … ${Math.round(f * 100)} %`));
      druckRandAdressen.forEach(u => URL.revokeObjectURL(u)); druckRandAdressen = st.map(x => URL.createObjectURL(x.blob));
      randZiel.innerHTML = randBilder(st, druckRandAdressen); }
    catch (e){ console.log('Plakat, Rand:', e); standSetzen('Der Rand ließ sich nicht fein malen – im PDF steht die Vorschau-Fassung.'); await new Promise(ok => setTimeout(ok, 2500)); }
  }
  kopie.removeAttribute('style');
  kopie.querySelectorAll('.ps-trifuge').forEach(n => n.remove());
  const name = artName() + '-' + g.name;
  /* Triptychon: dieselbe Seite dreimal, jede auf ihren Rahmen samt Beschnitt zugeschnitten (viewBox), je eine PDF-Seite */
  const SW = g.tri ? g.tri.pw + 2 * BESCHNITT : g.PW, SH = g.PH;
  /* je Seite nur die Bilder, die in ihren Rahmen reichen - sonst traegt jede Seite alle (103 MB statt rund 40) */
  const seiten = !g.tri ? kopie.outerHTML : [0, 1, 2].map(j => { const k = kopie.cloneNode(true);
    const a = sr.left + j * (g.tri.pw + g.tri.fuge) * proEinheit, b = a + SW * proEinheit;
    [...k.querySelectorAll('image')].forEach((im, i) => { const r = lagen[i]; if (r && (r.right < a || r.left > b)) im.remove(); });
    k.setAttribute('viewBox', `${(j * (g.tri.pw + g.tri.fuge)).toFixed(2)} 0 ${SW.toFixed(2)} ${SH.toFixed(2)}`); return k.outerHTML; }).join('');
  const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${esc2(name)}</title><style>@font-face{font-family:'Pinyon Script';src:url('${location.origin}/fonts/pinyon-script-400.ttf') format('truetype')}@page{size:${SW.toFixed(2)}mm ${SH.toFixed(2)}mm;margin:0}`
    + `html,body{margin:0;padding:0;background:${E.skizze ? skizzePapier() : grund()};-webkit-print-color-adjust:exact;print-color-adjust:exact}`
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
  /* Kopf „Plakat · <Art>" und darunter, was aus der Ansicht kommt: ihre Wahlen (schaumKurzTeile, index.html) und - Klangschaum und
     Bilderschau - die Auswahl des Filters oben („257 von 330 Titeln · gefiltert: Öffentlich") */
  el('ps-kopf').textContent = 'Plakat · ' + plakatArt();
  { const teile = (typeof schaumKurzTeile !== 'undefined' ? schaumKurzTeile : []).filter(Boolean);
    const titel = raumJetzt !== 'groupies' && typeof titelAuswahl === 'function' ? titelAuswahl() : null;
    const zeile = titel ? [...teile.filter(t => !/^[\d.]+ von [\d.]+$/.test(t)), schaumZoom ? '„' + schaumZoom + '“' : null, titel.text] : teile;
    el('ps-ausansicht').textContent = 'Aus der Ansicht: ' + zeile.filter(Boolean).join(' · '); }
  bilderteilSetzen();
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
  an('ps-verz', mitVerzeichnis()); an('ps-zeit', E.zeitleiste); an('ps-edition', E.edition); an('ps-areale', E.areale);
  an('ps-kissen', E.kissen); an('ps-feder', E.feder); an('ps-legende', E.legende);
  el('ps-zeit-grund').hidden = raumJetzt !== 'groupies';
  { const a = el('ps-auflage'); if (document.activeElement !== a) a.value = E.auflage || ''; }
  el('ps-hinweis').hidden = raumJetzt !== 'groupies';
  /* „jede" nur, wo sie hineinpasst (15.10.2026, nummerStart, nummerSchild): die übrigen stehen ohne Nummer am Ende der Liste */
  el('ps-verz-text').textContent = bilderschau() ? 'Jedes Cover, auf das sie passt, bekommt eine Nummer, unten steht die Liste aller Titel. Aus: keine Nummern, keine Liste.'
    : 'Jede Zelle, in die sie passt, bekommt eine Nummer, unten steht die Liste aller Titel – so findet man auch den kleinsten.';
  /* WAS NICHT GILT, WIRD GRAU MIT GRUND (Hausregel 4; Caspar_D, 07.10.2026: „mach alle sachen, die nicht ins rahmenlose design
     passen ausgegraut"): bei Randlos alles, was am Rand haengt; sonst Ecke und Name, die es nur bei Randlos gibt. */
  const grau = (knoten, aus, grund) => { if (!knoten) return; knoten.classList.toggle('ps-grau', aus); knoten.title = aus ? grund : '';
    (knoten.matches('input,button,select') ? [knoten] : knoten.querySelectorAll('input,button,select')).forEach(f => { f.disabled = aus; }); };
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
    /* die Vorlagen, die es hier nicht gibt: das Skizzenbuch im Groupieschaum und in der Bilderschau. Randlos gibt es in der Bilderschau seit
       1.0.80 (Caspar_D, 15.10.2026, 2a: „freigeben; dort sind die Nummern automatisch aus") - ohne Verzeichnis, Ecke wie im Klangschaum */
    studio.querySelectorAll('[data-vorlage]').forEach(vb => { const v = vb.dataset.vorlage;
      const warum = v === 'skizze' && raumJetzt === 'groupies' ? 'Das Skizzenbuch zeichnet die Cover deiner Titel – im Groupieschaum gibt es sie nicht.'
        : v === 'skizze' && bilderschau() ? 'Das Skizzenbuch zeichnet den Klangschaum mit der Feder – die Bilderschau hängt die Cover selbst.' : '';
      vb.disabled = !!warum; vb.classList.toggle('ps-grau', !!warum); vb.title = warum; });
    studio.querySelectorAll('[data-format]').forEach(b => { const f = FORMATE.find(x => x.id === b.dataset.format) || {}, aus = sk && !!f.tri; b.disabled = aus; b.classList.toggle('ps-grau', aus); b.title = aus ? 'Das Skizzenbuch ist eine Seite.' : ''; }); }
  /* BILDERSCHAU: was nur den Schaum betrifft, grau mit Grund (Hausregel 4) - nach dem Skizzenbuch-Block, der die Feinheiten freigibt */
  if (bilderschau()){
    const ohne = 'Gilt nicht in der Bilderschau – die Cover hängen so, wie sie am Schirm hängen.';
    for (const id of ['ps-fugen', 'ps-wackeln', 'ps-schatten', 'ps-vignette', 'ps-kissen']) grau(zeile(id), true, ohne);
    grau(el('ps-titelwahl'), true, 'In der Bilderschau stehen die Titel nicht in Zellen – Bildunterschriften wählt der Abschnitt Bilderschau, die Nummern das Verzeichnis.');
    const fb = studio.querySelector('[data-grund="farbe"]'); grau(fb, true, 'In der Bilderschau schwarz oder weiß wie die Vorlagen – keine freie Farbe.'); el('ps-farbe').disabled = true;
  } else { grau(el('ps-titelwahl'), false, ''); const fb = studio.querySelector('[data-grund="farbe"]'); grau(fb, false, ''); el('ps-farbe').disabled = false; }
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
/* Der Abschnitt Bilderschau: die Wahlen mit den Werten der Ansicht; in Klangschaum und Groupieschaum grau mit Grund (Hausregel 4) */
function bilderteilSetzen(){
  const T = TRANSFORMATIONEN, masse = schaumMasse(), glieder = schaumGliederungen();
  wahlSetzen(el('ps-bmass'), 'ps-bmass', masse.map(x => ({ id: x.id, name: x.name, title: x.was })), schaumMass, { titel: 'Wonach sich die Fläche jedes Bildes richtet' });
  wahlSetzen(el('ps-btrafo'), 'ps-btrafo', T.map(x => ({ id: x.id, name: x.name, title: x.kurz })), bilderWahl.trafo, { titel: 'Wie aus dem Wert die Fläche des Bildes wird' });
  wahlSetzen(el('ps-bgliederung'), 'ps-bgliederung', glieder.map(x => ({ id: x.id, name: x.name })), schaumGliederung, { titel: 'Wonach die Bilder in Areale geteilt werden' });
  wahlSetzen(el('ps-bhaengung'), 'ps-bhaengung', BILDER_HAENGUNGEN, bilderWahl.haengung, { titel: 'Wie die Bilder in ihren Arealen hängen' });
  for (const [id, k] of [['ps-brahmen', 'rahmen'], ['ps-bkopf', 'kopf'], ['ps-bunter', 'unter']]){ const b = el(id); b.classList.toggle('an', !!bilderWahl[k]); b.setAttribute('aria-pressed', bilderWahl[k] ? 'true' : 'false'); }
  const aus = !bilderschau(), t = el('ps-bilderteil');
  t.classList.toggle('ps-grau', aus); t.title = aus ? 'Nur in der Bilderschau.' : '';
  t.querySelectorAll('input,button,select').forEach(f => { f.disabled = aus; });
  el('ps-bilder-text').textContent = aus ? 'Nur in der Bilderschau.' : 'Dieselben Einstellungen wie in der Ansicht: was hier gewählt wird, gilt auch dort.';
}
const grundArt = () => { const gr = grund().toLowerCase(); return gr === '#0c0d10' || gr === '#08090b' ? 'schwarz' : gr === '#f3efe6' || gr === '#ffffff' || gr === '#ece7dc' ? 'weiss' : 'farbe'; };
function setze(teil, neuLegen, warteMs, nurSetzen){ Object.assign(E, teil);
  if (leihe){ for (const k of Object.keys(teil)) delete leihe[k]; if (!Object.keys(leihe).length) leihe = null; }
  merken(); felderSetzen(); if (neuLegen) aktuell = aktuell && { ...aktuell }; zeichnen(false, warteMs, nurSetzen); }

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
#ps-frei{display:flex;gap:8px;align-items:center;margin-top:6px;font-size:13px}#ps-frei[hidden]{display:none}#ps-frei input{width:70px}
.ps-knoepfe{display:flex;gap:8px;margin-top:18px}
.ps-knoepfe button{border:0;border-radius:9px;padding:8px 14px;font:inherit;font-weight:600;cursor:pointer}
#ps-pdf,#ps-png{background:#e3b43c;color:#111}#ps-zu{background:var(--flaeche2,#1d2127);color:inherit;border:1px solid var(--rand,#2a3038)!important}
.ps-leise{color:#9aa3ad;font-size:12px;margin:6px 0 0}
.ps-pillen button.ps-schalt:not(.an){color:#9aa3ad}
.ps-grau{opacity:.4}
@font-face{font-family:'Pinyon Script';font-style:normal;font-weight:400;font-display:block;src:url('/fonts/pinyon-script-400.ttf') format('truetype')}.ps-grau input,.ps-grau button{cursor:not-allowed}
#ps-wand{margin-top:8px;border-radius:7px;overflow:hidden}
details.ps-fein summary{cursor:pointer;color:#cfd4da;margin:14px 0 4px}
#ps-ausansicht{margin:-6px 0 4px}
.ps-wzeile{display:grid;grid-template-columns:110px minmax(0,1fr);align-items:center;gap:8px;margin:5px 0;font-size:13px}
#ps-panel .wahl .pille{border:1px solid var(--rand,#2a3038);background:var(--flaeche2,#1d2127);color:inherit;border-radius:999px;padding:3px 10px;cursor:pointer;font:inherit;font-size:12.5px}
#ps-panel .wahl .pille.an{border-color:#e3b43c;box-shadow:inset 0 0 0 1px #e3b43c}
#ps-panel .wahl .pille:active{transform:scale(.95)}
#ps-panel .wahl select{font:inherit;font-size:12.5px;max-width:100%;min-width:0;padding:3px 8px;border-radius:999px;border:1px solid #e3b43c;background:var(--flaeche2,#1d2127);color:inherit}
`;
  document.head.appendChild(css);
  studio = document.createElement('div'); studio.id = 'plakatstudio';
  const regler = (id, name, min, max, schritt) => `<label class="ps-zeile">${name}<input type="range" id="${id}" min="${min}" max="${max}" step="${schritt}"><span class="wert" id="${id}-w"></span></label>`;
  studio.innerHTML = `<div id="ps-buehne"><div id="ps-blatt"></div><div id="ps-stand"></div></div>
<aside id="ps-panel">
  <h2 id="ps-kopf">Plakat</h2>
  <p class="ps-leise" id="ps-ausansicht"></p>
  <h3>Vorlage</h3><div class="ps-vorlagen">${VORLAGEN.map(v => `<button type="button" data-vorlage="${v.id}"><b>${v.name}</b><small>${v.zeile}</small></button>`).join('')}</div>
  <p class="ps-leise" id="ps-randlos-grund" hidden>Ohne Rand gibt es kein Passepartout: Rand, Federstrich, Verzeichnis, Areale am Rand und Zeitleiste sind ausgegraut.</p>
  <h3>Bilderschau</h3>
  <div id="ps-bilderteil">
    <div class="ps-wzeile"><span>Fläche nach</span><span id="ps-bmass"></span></div>
    <div class="ps-wzeile"><span>Skalen&shy;transformation</span><span id="ps-btrafo"></span></div>
    <div class="ps-wzeile"><span>Gegliedert nach</span><span id="ps-bgliederung"></span></div>
    <div class="ps-wzeile"><span>Hängung</span><span id="ps-bhaengung"></span></div>
    <div class="ps-pillen" style="margin-top:7px"><button type="button" class="ps-schalt" id="ps-brahmen">Rahmen</button><button type="button" class="ps-schalt" id="ps-bkopf">Überschriften der Gruppen</button><button type="button" class="ps-schalt" id="ps-bunter">Bildunterschriften</button></div>
    <p class="ps-leise" id="ps-bilder-text">Dieselben Einstellungen wie in der Ansicht: was hier gewählt wird, gilt auch dort.</p>
  </div>
  <h3>Format</h3><div class="ps-pillen">${FORMATE.map(f => `<button type="button" data-format="${f.id}">${f.name}</button>`).join('')}</div>
  <div id="ps-frei" hidden>Breite <input class="ps-eingabe" id="ps-freiw" type="number" min="10" max="300"> cm · Höhe <input class="ps-eingabe" id="ps-freih" type="number" min="10" max="300"> cm</div>
  <div class="ps-pillen" style="margin-top:7px"><button type="button" data-lage="hoch">Hoch</button><button type="button" data-lage="quer">Quer</button></div>
  <p class="ps-leise" id="ps-mass"></p>
  <p class="ps-leise" id="ps-nrklein" hidden></p>
  <h3>Grund</h3><div class="ps-pillen"><button type="button" data-grund="schwarz">Schwarz</button><button type="button" data-grund="weiss">Weiß</button><button type="button" data-grund="farbe">Farbe <input type="color" id="ps-farbe" style="width:22px;height:16px;border:0;padding:0;background:none;vertical-align:middle"></button></div>
  <h3>Titel in der Zelle</h3><div class="ps-pillen" id="ps-titelwahl"><button type="button" data-titel="rauch">Rauchglas</button><button type="button" data-titel="milch">Milchglas</button><button type="button" data-titel="kante">an der Kante</button><button type="button" data-titel="ohne">ohne</button></div>
  <div class="ps-pillen" style="margin-top:9px"><button type="button" class="ps-schalt" id="ps-verz">Verzeichnis</button><button type="button" class="ps-schalt" id="ps-areale">Areale am Rand</button></div>
  <p class="ps-leise" id="ps-verz-text" style="margin-top:0">Jede Zelle, in die sie passt, bekommt eine Nummer, unten steht die Liste aller Titel – so findet man auch den kleinsten.</p>
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
    const tafel = v.e.skizze && SKIZZE_TAFEL[E.format] ? { format: SKIZZE_TAFEL[E.format] } : {};
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
  for (const [id, schl] of [['ps-kissen', 'kissen'], ['ps-zeit', 'zeitleiste'], ['ps-edition', 'edition'], ['ps-areale', 'areale'], ['ps-feder', 'feder'], ['ps-legende', 'legende']])
    el(id).onclick = () => setze({ [schl]: !E[schl] });
  /* Verzeichnis: in der Bilderschau ein eigener Schalter (bildNummern, Vorgabe an), sonst der der Vorlagen */
  el('ps-verz').onclick = () => setze(bilderschau() ? { bildNummern: E.bildNummern === false } : { verzeichnis: !E.verzeichnis });
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
  /* DER ABSCHNITT BILDERSCHAU (B5 mit E1(a), Caspar_D 15.10.2026: Studio und Ansicht teilen die Einstellungen): die Wahlen rufen die
     Setter der Ansicht (index.html), die hängt am Schirm neu und meldet „bilderschau-gehaengt" - dann zeichnet das Studio neu. Die Wahlen
     sind Pille oder Dropdown nach Hausregel 19 (wahlHtml/wahlSetzen aus index.html, gemessen an der Breite des Studios). */
  const ansicht = (f) => (v) => { if (!bilderschau()) return; f(v); felderSetzen(); zeichnen(true); };
  wahlTun['ps-bmass'] = ansicht(v => schaumMassWaehlen(v));
  wahlTun['ps-btrafo'] = ansicht(v => bilderschauWahl('trafo', v));
  wahlTun['ps-bgliederung'] = ansicht(v => schaumGliederungWaehlen(v));
  wahlTun['ps-bhaengung'] = ansicht(v => bilderschauWahl('haengung', v));
  for (const [id, k] of [['ps-brahmen', 'rahmen'], ['ps-bkopf', 'kopf'], ['ps-bunter', 'unter']]) el(id).onclick = () => ansicht(() => bilderschauWahl(k, !bilderWahl[k]))();
  document.addEventListener('bilderschau-gehaengt', () => { if (!wandWartet || !studio || studio.hidden || !bilderschau()) return;
    wandWartet = false; felderSetzen(); zeichnen(true); });
  el('ps-pdf').onclick = () => pdf();
  el('ps-png').onclick = () => bildSichern();
  el('ps-zu').onclick = schliessen;
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && studio && !studio.hidden) schliessen(); });
  window.addEventListener('resize', () => { if (studio && !studio.hidden) einpassen(); });
}
function schliessen(){ if (studio) studio.hidden = true; document.documentElement.style.overflow = ''; }

export function oeffnen(){
  if (!studio) aufbauen();
  /* außerhalb der Bilderschau gilt wieder, was die Galerie dort nur überdeckt hat (leihe) - beim Skizzenbuch mit den Grenzen, die sonst
     der Klick auf die Vorlage und die gesperrten Knöpfe ziehen: eine Seite (aus einem Triptychon der Bilderschau wird seine Tafel) auf
     hellem Grund (ein dunkler aus der Bilderschau wird wieder Pergament). Bis 15.10.2026 kamen beide mit, Triptychon und Schwarz standen
     dann gewählt und zugleich gesperrt, der Dateiname hieß „3×50×70" für eine Tafel (Gegenprüfung). */
  if (leihe && !bilderschau()){ Object.assign(E, leihe); leihe = null;
    if (E.skizze){ E.format = SKIZZE_TAFEL[E.format] || E.format; E.grund = skizzePapier(); }
    merken(); }
  /* Das Skizzenbuch zeichnet die Cover deiner Titel - im Groupieschaum gibt es sie nicht: dort mit Galerie öffnen (vorher blieb die
     gemerkte Vorlage stehen, und das Plakat wartete auf Federzeichnungen von Personen; Fallensuche 1.0.61) */
  if (E.skizze && raumJetzt === 'groupies'){ Object.assign(E, { vorlage: 'galerie' }, VORLAGEN[0].e); merken(); }
  /* Bilderschau: das Skizzenbuch gibt es hier nicht (siehe oben) - dann mit Galerie öffnen, nur für die Bilderschau (leihe). Randlos
     bleibt seit 1.0.80 Randlos. */
  if (bilderschau() && E.skizze){ const galerie = { vorlage: 'galerie', ...VORLAGEN[0].e };
    if (!leihe) leihe = Object.fromEntries(Object.keys(galerie).map(k => [k, E[k]]));
    Object.assign(E, galerie); }
  studio.hidden = false; document.documentElement.style.overflow = 'hidden';
  if (aktuell && (aktuell.raum !== raumJetzt || (aktuell.art === 'bild') !== bilderschau())) aktuell = null;   /* auch Klangschaum ↔ Bilderschau */
  felderSetzen();
  for (const id of ['ps-rand', 'ps-fugen', 'ps-wackeln', 'ps-schatten', 'ps-vignette', 'ps-federmm']){ const r = el(id); el(id + '-w').textContent = r.value; }
  avatarPruefen().then(() => zeichnen(true));
}
