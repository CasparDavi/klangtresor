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

const FORMATE = [
  { id: 'A3', name: 'A3', w: 297, h: 420 }, { id: 'A2', name: 'A2', w: 420, h: 594 },
  { id: 'A1', name: 'A1', w: 594, h: 841 }, { id: 'A0', name: 'A0', w: 841, h: 1189 },
  { id: '50x70', name: '50 × 70', w: 500, h: 700 }, { id: '70x100', name: '70 × 100', w: 700, h: 1000 },
  { id: '100x140', name: '100 × 140', w: 1000, h: 1400 },
  { id: 'q50', name: '50 × 50', w: 500, h: 500 }, { id: 'q70', name: '70 × 70', w: 700, h: 700 },
  { id: 'frei', name: 'frei' },
];
/* Die Vorlagen (Caspar_D hat alle vier angekreuzt). Jede setzt alle Feinheiten; danach ist alles einzeln
   verstellbar. „Bleiglas": breite dunkle Fugen wie Bleiruten, starkes Licht, keine Glasbaender - die Titel
   stehen im Werkverzeichnis. */
const VORLAGEN = [
  { id: 'galerie', name: 'Galerie', zeile: 'schwarzer Grund · Rauchglas · Federstrich',
    e: { grund: '#0c0d10', titel: 'rauch', fugen: 1, wackeln: 0, schatten: 0, vignette: 0, kissen: true, feder: true, federMm: 0.3, rand: 0.07, verzeichnis: false, areale: true, edition: true, zeitleiste: false } },
  { id: 'papier', name: 'Papier', zeile: 'warmes Weiß · Milchglas · leiser Schatten',
    e: { grund: '#f3efe6', titel: 'milch', fugen: 1.6, wackeln: 0.12, schatten: 0.35, vignette: 0, kissen: true, feder: true, federMm: 0.25, rand: 0.08, verzeichnis: false, areale: true, edition: true, zeitleiste: true } },
  { id: 'bleiglas', name: 'Bleiglas', zeile: 'breite dunkle Fugen · starkes Licht',
    e: { grund: '#08090b', titel: 'ohne', fugen: 2.8, wackeln: 0, schatten: 0, vignette: 0.35, kissen: true, feder: false, federMm: 0.3, rand: 0.05, verzeichnis: true, areale: false, edition: false, zeitleiste: false } },
  { id: 'mosaik', name: 'Mosaik', zeile: 'helle Fugen · Kacheln wackeln · Schatten',
    e: { grund: '#ece7dc', titel: 'milch', fugen: 2.2, wackeln: 0.7, schatten: 0.6, vignette: 0.15, kissen: true, feder: false, federMm: 0.3, rand: 0.07, verzeichnis: false, areale: false, edition: false, zeitleiste: true } },
];
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
function verzeichnisMass(n, breite, kurz, hoeheMax, koepfe = 6, kleinst = Math.max(1.5, 0.0026 * kurz)){
  /* je Areal ein Kopf und ein Rest („und N weitere"), je Spalte eine Zeile Reserve (ein Kopf rueckt nie allein an den Fuss) */
  const zeilenZahl = n + 2 * koepfe, kopf = 2.4;
  const mass = (L) => { const spalteB = 15 * L, spalten = Math.max(1, Math.floor((breite + L) / spalteB)), proSpalte = Math.ceil(zeilenZahl / spalten) + 1;
    return { L, spalteB: (breite + L) / spalten, spalten, proSpalte, hoehe: (proSpalte * 1.38 + kopf) * L }; };
  const gross = 0.0045 * kurz, klein = Math.min(gross, kleinst);
  for (let L = gross; L >= klein; L -= 0.05){ const m = mass(L); if (m.hoehe <= hoeheMax) return m; }
  return mass(klein);
}
/* Seite: Format, Lage, Raender (unten breiter - die optische Mitte, dort steht das Museumsschild). */
function geometrie(n = 0){
  const f = FORMATE.find(x => x.id === E.format) || FORMATE[5];
  let w = f.id === 'frei' ? Math.max(100, Math.min(3000, E.freiW * 10)) : f.w, h = f.id === 'frei' ? Math.max(100, Math.min(3000, E.freiH * 10)) : f.h;
  if ((E.lage === 'quer') !== (w > h) && w !== h) [w, h] = [h, w];
  const kurz = Math.min(w, h), rand = E.rand * kurz;
  const T = 0.026 * kurz, U = 0.0105 * kurz, L = 0.0098 * kurz;
  const schildH = T * 1.25 + U * 1.8 + (E.legende ? L * 0.6 : 0);
  /* So viele Arealkoepfe, wie die Legende des Schaums Zeilen hat - vorher pauschal sechs, das liess unter der Liste Platz frei */
  const verz = E.verzeichnis && n ? verzeichnisMass(n, w - 2 * rand, kurz, h / 6, legendenEintraege().length || 6) : null;
  /* Zeitleiste (nur Klangschaum - Personen haben kein Erscheinungsdatum): ein Band zwischen Karte und Schild */
  const zeitH = E.zeitleiste && raumJetzt !== 'groupies' ? 0.032 * kurz : 0;
  /* der Federstrich rueckt alles darunter um seinen Abstand (0,011 der kurzen Seite) - der Rand muss ihn mitrechnen,
     sonst rutschte der Fuss des Schilds Richtung Beschnitt */
  const feder = E.feder ? 0.011 * kurz : 0;
  const unten = Math.max(rand * 1.55, feder + rand * 0.5 + zeitH + schildH + (verz ? rand * 0.4 + verz.hoehe : 0) + rand * 0.45);
  const karte = { x: BESCHNITT + rand, y: BESCHNITT + rand, w: w - 2 * rand, h: h - rand - unten };
  return { w, h, PW: w + 2 * BESCHNITT, PH: h + 2 * BESCHNITT, kurz, rand, unten, T, U, L, karte, schildH, verz, zeitH, name: f.id === 'frei' ? `${E.freiW}x${E.freiH}` : f.name.replace(/\s/g, '') };
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

function standSetzen(t){ const s = el('ps-stand'); if (s) s.textContent = t || ''; }

/* Neu zeichnen: ist das Seitenverhaeltnis der Karte ein anderes, wird der Schaum neu gelegt (gemerkt wie
   jedes Layout), sonst nur das Bild neu gebaut. */
function zeichnen(sofort){
  clearTimeout(warten);
  warten = setTimeout(async () => {
    const lauf = ++legeLauf;
    /* Das Verzeichnis braucht Platz unter der Karte - dafuer muss die Zahl der Eintraege vor dem Legen bekannt sein */
    let n = aktuell && aktuell.raum === raumJetzt ? aktuell.j.zeilen.length : 0;
    if (!n && E.verzeichnis){ try { n = (await auftrag(1)).j.zeilen.length; } catch (e) { n = 0; } if (lauf !== legeLauf) return; }
    const g = geometrie(n), verh = Math.round(g.karte.h / g.karte.w * 100) / 100;
    if (!aktuell || aktuell.verh !== verh || aktuell.raum !== raumJetzt){
      const a = await auftrag(verh);
      if (lauf !== legeLauf) return;
      standSetzen('Der Schaum wird für das Plakat gelegt …');
      let res;
      try { res = await schaumLageHolen(a.j, s => { if (lauf === legeLauf) standSetzen(`Der Schaum wird für das Plakat gelegt … ${s} s`); }); }
      catch (e){ standSetzen('Der Schaum ließ sich nicht legen.'); console.log('Plakat:', e); return; }
      if (lauf !== legeLauf) return;
      aktuell = { verh, raum: raumJetzt, res, ...a };
      if (!E.kopfTitelEigen) E.kopfTitel = kopfTitelVorschlag();
      if (!E.kopfUnterEigen) E.kopfUnter = kopfUnterVorschlag();
      felderSetzen();
    }
    standSetzen('');
    bauen(g);
  }, sofort ? 0 : 120);
}
function kopfTitelVorschlag(){
  const p = (typeof katalogInfo !== 'undefined' && katalogInfo && katalogInfo.profil) || {};
  return (p.display_name || p.handle || 'Mein Archiv') + ' · ' + (raumJetzt === 'groupies' ? 'Groupieschaum' : 'Klangschaum');
}
function kopfUnterVorschlag(){
  if (!aktuell) return '';
  const n = aktuell.j.zeilen.length, monat = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  return [`${n} ${aktuell.art === 'person' ? (n === 1 ? 'Person' : 'Personen') : (n === 1 ? 'Titel' : 'Titel')}`, 'Fläche nach ' + aktuell.m.name,
          'gegliedert nach ' + aktuell.gl.name.replace(/:.*$/, ''), monat].join(' · ');
}

/* Die Legende des Schaums, wie sie im Panel steht: Farbe und Name je Areal. */
function legendenEintraege(){
  return [...document.querySelectorAll('#schaumlegende .zeile')].map(z => {
    const i = z.querySelector('i'), b = z.querySelector('b');
    return i && b ? { farbe: i.style.background || '#888', name: b.textContent.trim() } : null;
  }).filter(Boolean);
}
const messen = (() => { const c = document.createElement('canvas').getContext('2d'); return (t, gewicht = 400) => { c.font = `${gewicht} 100px system-ui, sans-serif`; return c.measureText(t).width / 100; }; })();

async function bauen(g){
  if (!aktuell) return;
  const lauf = ++bauLauf, blatt = el('ps-blatt'); if (!blatt) return;
  const s = schaumFarbeAnteil / 100, kv = g.karte;
  /* Vorschau-Massstab fuer den Bildvorrat: Bildschirmpunkte je Schaum-Einheit */
  const pxBreite = blatt.clientWidth || 800, massstab = (pxBreite * (kv.w / g.PW)) / aktuell.res.width * (window.devicePixelRatio || 1);
  const druck = { titel: E.titel, fugen: E.fugen, wackeln: E.wackeln, schatten: E.schatten, vignette: E.vignette, kissen: E.kissen,
                  deck: (Math.max(0, 2 * s - 1) * 0.65).toFixed(3), ton: Math.min(1, 2 * s).toFixed(3), massstab,
                  verzeichnis: !!g.verz, mmJeEinheit: Math.min(kv.w / aktuell.res.width, kv.h / aktuell.res.height) };
  const la = schaumLetzterAuftrag && schaumLetzterAuftrag.art === aktuell.art ? schaumLetzterAuftrag : null;
  if (!la){ standSetzen('Bitte den Schaum einmal anzeigen lassen, dann das Plakat öffnen.'); return; }
  let { svg, verzeichnis, areale } = await schaumSvgBauen(aktuell.res, { zeilen: aktuell.j.zeilen, ebenen: aktuell.j.ebenen, farbeVon: la.farbeVon, gezoomt: la.gezoomt, art: aktuell.art, druck });
  if (lauf !== bauLauf) return;
  svg = svg.replace('<rect width="100%" height="100%" fill="#121417"/>', '')
           .replace('<svg ', `<svg class="ps-schaum" x="${kv.x.toFixed(2)}" y="${kv.y.toFixed(2)}" width="${kv.w.toFixed(2)}" height="${kv.h.toFixed(2)}" `);
  svg = eigeneIds(svg, 'ps-');
  const fg = schrift(), leise = schriftLeise();
  /* Federstrich: eine Haarlinie einige Millimeter um die Karte, auf dem Passepartout */
  const d = 0.011 * g.kurz;
  const feder = E.feder ? `<rect x="${(kv.x - d).toFixed(2)}" y="${(kv.y - d).toFixed(2)}" width="${(kv.w + 2 * d).toFixed(2)}" height="${(kv.h + 2 * d).toFixed(2)}" fill="none" stroke="${fg}" stroke-opacity="0.75" stroke-width="${E.federMm}"/>` : '';
  /* Museumsschild im unteren Rand: links Titel und Untertitel, rechts die Legende in Spalten */
  const ux = kv.x, zy = kv.y + kv.h + (E.feder ? d : 0) + g.rand * 0.4, uy = kv.y + kv.h + (E.feder ? d : 0) + g.rand * 0.5 + g.zeitH, rechts = kv.x + kv.w;
  let kopf = `<text class="ps-kopf" x="${ux.toFixed(2)}" y="${(uy + g.T).toFixed(2)}" font-size="${g.T.toFixed(2)}" font-weight="600" fill="${fg}">${esc2(E.kopfTitel || '')}</text>`
    + `<text class="ps-kopf" x="${ux.toFixed(2)}" y="${(uy + g.T * 1.25 + g.U * 1.25).toFixed(2)}" font-size="${g.U.toFixed(2)}" fill="${leise}">${esc2(E.kopfUnter || '')}</text>`;
  /* Legende rechts im Schild, in Spalten von oben nach unten. Gesetzt wird in zwei Schritten: erst ins Bild,
     dann die wirkliche Textlaenge gemessen und die Spalten von rechts her ausgerichtet (legendeSetzen) - eine
     Leinwand misst mit einer anderen Schrift als das SVG (gesehen: 22 % zu schmal, die Spalten ueberlappten). */
  let legende = null;
  if (E.legende){
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
  if (g.zeitH) kopf += zeitleisteSetzen(aktuell.j.zeilen, la.farbeVon, ux, rechts, zy, g.zeitH * 0.8, fg, leise, g.kurz);
  /* Edition im unteren Rand: unter dem Inhalt, aber sicher innerhalb des Beschnitts */
  if (E.edition) kopf += editionSetzen(g, rechts, Math.min(uy + g.schildH + (g.verz ? g.rand * 0.4 + g.verz.hoehe : 0) + g.rand * 0.32, BESCHNITT + g.h - g.rand * 0.22), fg, leise);
  if (E.areale && areale && areale.length > 1) kopf += arealeSetzen(areale, g, kv, aktuell.res, E.feder ? d : 0);
  if (g.verz && verzeichnis) kopf += verzeichnisSetzen(verzeichnis, g, ux, uy + g.schildH + g.rand * 0.4, fg, leise);
  const seite = `<svg class="ps-seite" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g.PW.toFixed(2)} ${g.PH.toFixed(2)}" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif">`
    + `<rect width="${g.PW.toFixed(2)}" height="${g.PH.toFixed(2)}" fill="${E.grund}"/>` + feder + svg + kopf
    + `<rect class="ps-beschnitt" x="${BESCHNITT}" y="${BESCHNITT}" width="${g.w}" height="${g.h}" fill="none" stroke="#8a929c" stroke-width="${(g.kurz / 900).toFixed(2)}" stroke-dasharray="${(g.kurz / 120).toFixed(2)} ${(g.kurz / 160).toFixed(2)}"/></svg>`;
  blatt.innerHTML = seite;
  einpassen();
  if (legende) legendeSetzen(blatt.querySelector('svg.ps-seite'), legende);
  /* Rauchglas je Kopf nach Bedarf, wie am Schirm */
  const schaum = blatt.querySelector('svg.ps-schaum');
  if (E.titel === 'rauch' && schaum && typeof schaumRauch === 'function') schaumRauch(schaum);
  el('ps-mass').textContent = `${(g.w / 10).toLocaleString('de-DE')} × ${(g.h / 10).toLocaleString('de-DE')} cm · 3 mm Beschnitt`;
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
    marken.push({ seite, anker, ziel, text: a.name, lang: messen(a.name, 600) * fs * 1.12, farbe: a.farbe });
  }
  for (const sd of ['oben', 'links', 'rechts']){
    const ms = marken.filter(m => m.seite === sd).sort((p, q) => p.anker - q.anker); if (!ms.length) continue;
    const lo = sd === 'oben' ? R.x0 : R.y0, hi = sd === 'oben' ? R.x1 : R.y1, luft = fs * 1.4;
    ms.forEach(m => { m.pos = Math.min(hi - m.lang / 2, Math.max(lo + m.lang / 2, m.anker)); });
    for (let i = 1; i < ms.length; i++){ const min = ms[i - 1].pos + ms[i - 1].lang / 2 + luft + ms[i].lang / 2; if (ms[i].pos < min) ms[i].pos = min; }
    for (let i = ms.length - 2; i >= 0; i--){ const max = ms[i + 1].pos - ms[i + 1].lang / 2 - luft - ms[i].lang / 2; if (ms[i].pos > max) ms[i].pos = max; }
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
function zeitleisteSetzen(zeilen, farbeVon, x0, x1, y0, hoehe, fg, leise, kurz){
  const daten = zeilen.map(z => { const so = typeof song === 'function' ? song(z.id) : null, t = so && Date.parse(so.erstellt);
    return t ? { t, farbe: (farbeVon && farbeVon(z.gruppe)) || '#888' } : null; }).filter(Boolean).sort((a, b) => a.t - b.t);
  if (daten.length < 2) return '';
  const t0 = daten[0].t, t1 = daten[daten.length - 1].t, sp = Math.max(1, t1 - t0), X = (t) => x0 + (t - t0) / sp * (x1 - x0);
  const strichH = hoehe * 0.58, sw = Math.max(0.12, Math.min((x1 - x0) / daten.length * 0.7, kurz / 1000)), ls = hoehe * 0.26, f2 = (v) => v.toFixed(2);
  let out = `<line x1="${f2(x0)}" y1="${f2(y0 + strichH)}" x2="${f2(x1)}" y2="${f2(y0 + strichH)}" stroke="${leise}" stroke-width="${f2(kurz / 3000)}"/>`;
  for (const d of daten) out += `<line x1="${f2(X(d.t))}" y1="${f2(y0)}" x2="${f2(X(d.t))}" y2="${f2(y0 + strichH)}" stroke="${d.farbe}" stroke-width="${f2(sw)}" stroke-opacity="0.9"/>`;
  /* Marken: Jahresanfaenge, bei kurzer Spanne Monatsanfaenge */
  const a = new Date(t0), monate = (t1 - t0) < 2 * 365.25 * 864e5, marken = [];
  for (let d = new Date(a.getFullYear(), monate ? a.getMonth() + 1 : 0, 1); d.getTime() <= t1; d = new Date(d.getFullYear() + (monate ? 0 : 1), monate ? d.getMonth() + 1 : 0, 1))
    if (d.getTime() > t0) marken.push(d);
  for (const d of marken){ const x = X(d.getTime());
    out += `<line x1="${f2(x)}" y1="${f2(y0 + strichH)}" x2="${f2(x)}" y2="${f2(y0 + strichH + ls * 0.5)}" stroke="${leise}" stroke-width="${f2(kurz / 3000)}"/>`
      + `<text x="${f2(x)}" y="${f2(y0 + strichH + ls * 1.55)}" font-size="${f2(ls)}" fill="${leise}" text-anchor="middle">${monate ? d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }) : d.getFullYear()}</text>`; }
  return out;
}
/* EDITION UND SIGNATUR (angekreuzt): rechts unten klein „Auflage · Datum · Name", davor eine Haarlinie zum
   Signieren von Hand. Der Name kommt aus dem Profil; die Auflage ist ein Feld (Vorgabe 1/1). */
function editionSetzen(g, rechts, y, fg, leise){
  const p = (typeof katalogInfo !== 'undefined' && katalogInfo && katalogInfo.profil) || {};
  const text = [E.auflage || '1/1', new Date().toLocaleDateString('de-DE'), p.display_name || p.handle || ''].filter(Boolean).join(' · ');
  const fs = Math.min(g.rand * 0.18, 0.0062 * g.kurz), tw = messen(text) * fs * 1.12, linie = 0.16 * g.w, x1 = rechts - tw - fs * 1.4, f2 = (v) => v.toFixed(2);
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
  const m = verzeichnisMass(n, g.w - 2 * g.rand, g.kurz, g.verz.hoehe * 1.02, gruppen.length, 1);
  const L = m.L, zh = L * 1.38, nrB = String(n).length * 0.62 * L, titelB = m.spalteB - nrB - 1.6 * L;
  const kuerzen = (t, b) => { if (messen(t) * 1.15 * L <= b) return t; let k = t.length; while (k > 1 && messen(t.slice(0, k) + '…') * 1.15 * L > b) k--; return t.slice(0, k) + '…'; };
  let out = `<text x="${x0.toFixed(2)}" y="${(y0 + L * 1.2).toFixed(2)}" font-size="${(L * 1.1).toFixed(2)}" font-weight="600" letter-spacing="${(L * 0.06).toFixed(2)}" fill="${leise}">`
    + `${personen ? 'VERZEICHNIS DER PERSONEN' : 'WERKVERZEICHNIS'} · ${n.toLocaleString('de-DE')} ${personen ? 'Personen' : 'Titel'}</text>`;
  const oben = y0 + 2.4 * L;
  let s = 0, r = 0;
  zeilen.forEach((z, i) => {
    if (r >= m.proSpalte || (z.kopf !== undefined && r >= m.proSpalte - 1)){ s++; r = 0; }
    const x = x0 + s * m.spalteB, y = oben + r * zh + L;
    if (z.kopf !== undefined){
      out += `<rect x="${x.toFixed(2)}" y="${(y - L * 0.78).toFixed(2)}" width="${(L * 0.8).toFixed(2)}" height="${(L * 0.8).toFixed(2)}" rx="${(L * 0.15).toFixed(2)}" fill="${z.farbe}"/>`
        + `<text x="${(x + L * 1.2).toFixed(2)}" y="${y.toFixed(2)}" font-size="${L.toFixed(2)}" font-weight="600" fill="${fg}">${esc2(kuerzen(z.kopf, m.spalteB - 2.6 * L))}</text>`;
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
    const M = 1750, H = 2600, sk = 120 / H, pw = g.w * sk, ph = g.h * sk;
    wand.innerHTML = `<svg viewBox="0 0 ${(H * 1.4 * sk).toFixed(1)} 120" width="100%" height="120"><rect width="100%" height="120" fill="#2b2723"/>`
      + `<rect x="${(H * 0.35 * sk).toFixed(1)}" y="${(120 - 1450 * sk - ph / 2).toFixed(1)}" width="${pw.toFixed(1)}" height="${ph.toFixed(1)}" fill="${E.grund}" stroke="#111" stroke-width="0.6"/>`
      + `<rect x="${(H * 0.35 * sk + pw + 300 * sk).toFixed(1)}" y="${(120 - M * sk).toFixed(1)}" width="${(380 * sk).toFixed(1)}" height="${(M * sk).toFixed(1)}" rx="${(190 * sk).toFixed(1)}" fill="#59616b"/></svg>`;
  }
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
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(b, 0, 0, w, h);
        const blob = await new Promise(ok => roh.type === 'image/png' ? c.toBlob(ok, 'image/png') : c.toBlob(ok, 'image/jpeg', 0.9));
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

/* PDF: dieselbe Seite, die Bilder auf 300 dpi ihrer Kachel gerechnet (druckBilder), in einem unsichtbaren
   Rahmen, dann das Druckfenster. Ohne Beschnitt-Hilfslinie. */
async function pdf(){
  const blatt = el('ps-blatt'), s = blatt && blatt.querySelector('svg.ps-seite'); if (!s) return;
  const g = geometrie(), kopie = s.cloneNode(true);
  kopie.querySelectorAll('.ps-beschnitt').forEach(n => n.remove());
  standSetzen('Die Bilder werden für den Druck gerechnet …');
  await druckBilder(s, kopie, g);
  kopie.removeAttribute('style');
  const name = (raumJetzt === 'groupies' ? 'Groupieschaum' : 'Klangschaum') + '-' + g.name;
  const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${esc2(name)}</title><style>@page{size:${g.PW.toFixed(2)}mm ${g.PH.toFixed(2)}mm;margin:0}`
    + `html,body{margin:0;padding:0;background:${E.grund};-webkit-print-color-adjust:exact;print-color-adjust:exact}`
    + `svg.ps-seite{display:block;width:${g.PW.toFixed(2)}mm;height:${g.PH.toFixed(2)}mm}</style></head><body>${kopie.outerHTML}</body></html>`;
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
    ['ps-farbe', E.grund], ['ps-kopftitel', E.kopfTitel], ['ps-kopfunter', E.kopfUnter]]){ const f = el(id); if (f && document.activeElement !== f) f.value = v; }
  el('ps-verz').checked = !!E.verzeichnis;
  el('ps-zeit').checked = !!E.zeitleiste; el('ps-zeit').disabled = raumJetzt === 'groupies'; el('ps-zeit-grund').hidden = raumJetzt !== 'groupies';
  el('ps-edition').checked = !!E.edition; { const a = el('ps-auflage'); if (document.activeElement !== a) a.value = E.auflage || ''; }
  el('ps-areale').checked = !!E.areale;
  el('ps-kissen').checked = !!E.kissen; el('ps-feder').checked = !!E.feder; el('ps-legende').checked = !!E.legende;
  el('ps-hinweis').hidden = raumJetzt !== 'groupies';
}
const grundArt = () => E.grund.toLowerCase() === '#0c0d10' || E.grund.toLowerCase() === '#08090b' ? 'schwarz' : E.grund.toLowerCase() === '#f3efe6' || E.grund.toLowerCase() === '#ffffff' || E.grund.toLowerCase() === '#ece7dc' ? 'weiss' : 'farbe';
function setze(teil, neuLegen){ Object.assign(E, teil); merken(); felderSetzen(); if (neuLegen) aktuell = aktuell && { ...aktuell }; zeichnen(); }

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
#ps-pdf{background:#e3b43c;color:#111}#ps-zu{background:var(--flaeche2,#1d2127);color:inherit;border:1px solid var(--rand,#2a3038)!important}
.ps-leise{color:#9aa3ad;font-size:12px;margin:6px 0 0}
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
  <h3>Format</h3><div class="ps-pillen">${FORMATE.map(f => `<button type="button" data-format="${f.id}">${f.name}</button>`).join('')}</div>
  <div id="ps-frei" hidden>Breite <input class="ps-eingabe" id="ps-freiw" type="number" min="10" max="300"> cm · Höhe <input class="ps-eingabe" id="ps-freih" type="number" min="10" max="300"> cm</div>
  <div class="ps-pillen" style="margin-top:7px"><button type="button" data-lage="hoch">Hoch</button><button type="button" data-lage="quer">Quer</button></div>
  <p class="ps-leise" id="ps-mass"></p>
  <h3>Grund</h3><div class="ps-pillen"><button type="button" data-grund="schwarz">Schwarz</button><button type="button" data-grund="weiss">Weiß</button><button type="button" data-grund="farbe">Farbe <input type="color" id="ps-farbe" style="width:22px;height:16px;border:0;padding:0;background:none;vertical-align:middle"></button></div>
  <h3>Titel in der Zelle</h3><div class="ps-pillen"><button type="button" data-titel="rauch">Rauchglas</button><button type="button" data-titel="milch">Milchglas</button><button type="button" data-titel="kante">an der Kante</button><button type="button" data-titel="ohne">ohne</button></div>
  <label class="ps-zeile">Verzeichnis<input type="checkbox" id="ps-verz"><span></span></label>
  <label class="ps-zeile">Areale am Rand<input type="checkbox" id="ps-areale"><span></span></label>
  <p class="ps-leise" style="margin-top:0">Jede Zelle bekommt eine Nummer, unten steht die Liste aller Titel – so findet man auch den kleinsten.</p>
  <details class="ps-fein" open><summary>Feinheiten</summary>
    ${regler('ps-rand', 'Rand', 2, 15, 1)}${regler('ps-fugen', 'Fugen', 3, 40, 1)}${regler('ps-wackeln', 'Wackeln', 0, 100, 1)}${regler('ps-schatten', 'Schatten', 0, 100, 1)}${regler('ps-vignette', 'Vignette', 0, 100, 1)}
    <label class="ps-zeile">Kissen<input type="checkbox" id="ps-kissen"><span></span></label>
    <label class="ps-zeile">Federstrich<input type="checkbox" id="ps-feder"><span></span></label>
    ${regler('ps-federmm', 'Strichstärke', 0.1, 1, 0.05)}
  </details>
  <h3>Schild</h3>
  <input class="ps-eingabe" id="ps-kopftitel" placeholder="Titel">
  <input class="ps-eingabe" id="ps-kopfunter" placeholder="Untertitel">
  <label class="ps-zeile">Legende<input type="checkbox" id="ps-legende"><span></span></label>
  <label class="ps-zeile">Zeitleiste<input type="checkbox" id="ps-zeit"><span></span></label>
  <p class="ps-leise" id="ps-zeit-grund" style="margin-top:0" hidden>Im Groupieschaum gibt es kein Datum je Person – die Zeitleiste gilt für den Klangschaum.</p>
  <label class="ps-zeile">Edition und Signatur<input type="checkbox" id="ps-edition"><span></span></label>
  <input class="ps-eingabe" id="ps-auflage" placeholder="Auflage, z. B. 1/1 oder 3/10">
  <h3>An der Wand</h3><div id="ps-wand"></div><p class="ps-leise">Mensch 1,75 m zum Vergleich.</p>
  <p class="ps-leise" id="ps-hinweis" hidden>Nur für den privaten Gebrauch. Vervielfältigung und Weitergabe an Dritte sind nicht erlaubt – die Avatare gehören ihren Leuten.</p>
  <div class="ps-knoepfe"><button type="button" id="ps-pdf">Als PDF sichern …</button><button type="button" id="ps-zu">Schließen</button></div>
  <p class="ps-leise">Das Druckfenster öffnet sich; dort „Als PDF sichern“ wählen. Format und Ränder setzt das Plakat selbst.</p>
</aside>`;
  document.body.appendChild(studio);
  /* Bedienung */
  studio.querySelectorAll('[data-vorlage]').forEach(b => b.onclick = () => { const v = VORLAGEN.find(x => x.id === b.dataset.vorlage); setze({ vorlage: v.id, ...v.e }); });
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
  el('ps-kissen').onchange = (ev) => setze({ kissen: ev.target.checked });
  el('ps-verz').onchange = (ev) => setze({ verzeichnis: ev.target.checked });
  el('ps-zeit').onchange = (ev) => setze({ zeitleiste: ev.target.checked });
  el('ps-edition').onchange = (ev) => setze({ edition: ev.target.checked });
  el('ps-auflage').oninput = (ev) => setze({ auflage: ev.target.value });
  el('ps-areale').onchange = (ev) => setze({ areale: ev.target.checked });
  el('ps-feder').onchange = (ev) => setze({ feder: ev.target.checked });
  el('ps-legende').onchange = (ev) => setze({ legende: ev.target.checked });
  el('ps-kopftitel').oninput = (ev) => setze({ kopfTitel: ev.target.value, kopfTitelEigen: !!ev.target.value });
  el('ps-kopfunter').oninput = (ev) => setze({ kopfUnter: ev.target.value, kopfUnterEigen: !!ev.target.value });
  el('ps-pdf').onclick = () => pdf();
  el('ps-zu').onclick = schliessen;
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && studio && !studio.hidden) schliessen(); });
  window.addEventListener('resize', () => { if (studio && !studio.hidden) einpassen(); });
}
function schliessen(){ if (studio) studio.hidden = true; document.documentElement.style.overflow = ''; }

export function oeffnen(){
  if (!studio) aufbauen();
  studio.hidden = false; document.documentElement.style.overflow = 'hidden';
  if (aktuell && aktuell.raum !== raumJetzt) aktuell = null;
  felderSetzen();
  for (const id of ['ps-rand', 'ps-fugen', 'ps-wackeln', 'ps-schatten', 'ps-vignette', 'ps-federmm']){ const r = el(id); el(id + '-w').textContent = r.value; }
  zeichnen(true);
}
