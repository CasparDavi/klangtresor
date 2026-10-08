/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   HANDSCHRIFT STATT SATZ (Skizzenbuch, 08.10.2026). Caspar_D: „Alles Geschriebene ist zu sauber, das sieht nicht nach
   handgeschrieben aus, verzerre es manchmal ein bisschen, lass die Linienführung innerhalb enger Grenzen etwas fluktuieren,
   auch die Linienabstände hat Leonardo nachweislich nicht immer genau eingehalten." Und: „Die Kachelbeschriftung ist immer
   einzeilig, obwohl sie manchmal lieber zweizeilig gewesen wäre."
   Darum wird jedes Wort einzeln gesetzt: ein eigenes <text> mit absolutem x (ein <tspan> kann nicht gedreht werden, und
   rotate= dreht jede Glyphe für sich - das zerreißt die Verbindungen der Pinyon Script). Die Zeilenbreite wird vorab aus em()
   und den Wortabständen gerechnet, damit start/middle/end für die ganze Zeile stimmt. Je Wort: Drehung ±1,2°, Grundlinie
   ±3 % der Schrift, Größe ±4 %, Wortabstand −4 bis +15 % auf ein Leerzeichen plus 0,06 em (Pinyon hängt über: der
   Querstrich des t zeigt bis ans nächste l; dazu, was Drehung und Neigung oben aufeinander zuschieben), manchmal (jedes
   dritte Wort) eine leichte Verzerrung (Neigung ±3°, Breite ±4 %). Die Grundlinie einer Zeile wellt sich (zwei langsame Sinus, zusammen höchstens 2,5 % der Schrift) und
   läuft leicht schräg (höchstens 3,5 % an den Enden); die Wörter folgen der Welle zur Hälfte mit ihrer Neigung. Zeilenabstand
   je Zeile ±10 %, der Zeilenanfang ±10 % der Schrift. Tinte: nach dem Eintauchen (alle 2–4 Wörter) satt und eine Spur
   kräftiger (ein feiner Strich um die Glyphen), dann bis zum nächsten Eintauchen verblassend auf 0,82. Selten ein Klecks am
   Wortende (unregelmäßiger Tropfen mit Auslauf), selten ein Wort angefangen, durchgestrichen und neu geschrieben.
   Alles aus `saat` und dem Text (kein Math.random): dieselbe Eingabe gibt dasselbe Bild. Größe, Drehung und Wortabstand
   sind gleichverteilt (dreieckig verteilt waren sie kaum zu sehen - das Meiste blieb nahe der Mitte), Grundlinie, Zeilen-
   abstand und Verzerrung dreieckig. */

export const SEPIA = '#4a3423', SCHRIFT = "'Pinyon Script', cursive";

/* SCHRIFTTAUGLICH (Caspar_D, 08.10.2026: „was passiert bei langen Avatarnamen … gerade Tarja ist ja mit ihrer Deko ein typisches
   Beispiel" – ꧁༺ Tαɾʝα ༻꧂). Pinyon Script kennt nur lateinische Zeichen; alles andere fiele in eine Ersatzschrift (bunte Emoji, Zierrat
   in Systemschrift mitten in der Feder). Darum: NFKC macht aus Zierschriften echte Buchstaben (𝒵𝒶𝒷𝒶𝓋𝒶 → Zabava, 🄿🅄🅁… → PURR…,
   Ｆｕｌｌ → Full), Doppelgänger aus Griechisch/Kyrillisch/Kapitälchen werden ihr lateinisches Vorbild (Tαɾʝα → Tarja) – aber nur,
   wenn das Wort selbst lateinische Schrift trägt (auch Kapitälchen); ein echtes kyrillisches oder griechisches Wort
   bleibt, wie es ist, und fällt unten heraus. Was danach nicht lateinisch ist (Emoji, Ornamente, Schriftzeichen), fällt weg. */
const DOPPEL = Object.fromEntries([...'αa βb γy δd εe ζz ηn θo ιi κk μu νv οo ρp σo ςs τt υu χx ωw ΑA ΒB ΕE ΖZ ΗH ΙI ΚK ΜM ΝN ΟO ΡP ΤT ΥY ΧX'
  + ' ɾr ʝj ɑa ɛe ɪi ʀr ɢg ʜh ʟl ɴn ᴀa ʙb ᴄc ᴅd ᴇe ғf ꜰf ᴊj ᴋk ᴍm ᴏo ᴘp ǫq ꞯq ꜱs ᴛt ᴜu ᴠv ᴡw ʏy ᴢz ℓl ¢c ∂d ƒf'
  + ' аa вb еe кk мm нh оo рp сc тt уy хx ѕs іi јj ԁd ӏl АA ВB ЕE КK МM НH ОO РP СC ТT ХX ҮY'].join('').split(' ').filter(Boolean).map(p => [p[0], p[1]]));
const LATEIN = /[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/;   /* samt Latin Extended Additional (Vietnamesisch u. a.) - Pinyon hat sie */
/* was Pinyon schreiben kann: lateinische Schrift samt Akzenten und Latin Extended Additional, Ziffern, übliche Satzzeichen, Anführungen, ′ ″ ‹ › ™ */
/* was Pinyon wirklich schreiben kann: die 756 Zeichen aus ihrer cmap (web/fonts/pinyon-script-400.ttf, 63 Bereiche) - vorher eine
   geschätzte Liste, die Vorhandenes strich und Fehlendes durchließ (Fallensuche 1.0.62); neu auslesen, wenn die Schrift wechselt */
const ERLAUBT = /[\u0020-\u007E\u00A0-\u00AC\u00AE-\u0148\u014A-\u017F\u0181\u0189-\u018A\u018E-\u018F\u0192\u0198-\u0199\u01A0-\u01A1\u01AF-\u01B0\u01B3-\u01B6\u01C4-\u01E3\u01E6-\u01EB\u01F1-\u01F5\u01F8-\u021B\u021E-\u021F\u0226-\u0233\u0237\u0245\u0253\u0256-\u0257\u0259\u028C\u02C6-\u02C7\u02D8-\u02DD\u0300-\u0304\u0306-\u030C\u030F\u0311-\u0312\u031B\u0323-\u0328\u032D-\u032E\u0330-\u0331\u1E00-\u1E37\u1E3A-\u1E95\u1E97\u1E9E\u1EA0-\u1EF9\u2000-\u200B\u200D\u2011\u2013-\u2014\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2026\u202F\u2032-\u2033\u2039-\u203A\u2044\u205F\u2074\u20AC\u2116\u2122\u212E\u2153-\u2154\u2212\u2260\u25CC\uA78B-\uA78C\uFB01-\uFB02]/;
/* KLAMMERZUSÄTZE WEG – wörtlich die Regel des Hauses (ohneKlammern in web/index.html): auch verschachtelt, eine offene Klammer am Ende,
   ein Strich oder Satzzeichen am Ende; bleibt nichts übrig („(Untitled)"), bleibt der Titel ganz */
export function ohneKlammern(t){
  let s = String(t || ''), v;
  do { v = s; s = s.replace(/\s*[([][^()[\]]*[)\]]/g, ''); } while (s !== v);
  s = s.replace(/\s*[([][^)\]]*$/, '').replace(/\s+/g, ' ').replace(/\s*[-–—:;,]\s*$/, '').trim();
  return s || String(t || '').trim();
}
export function schriftTauglich(text){
  /* NFKC nur für Zeichen, die Pinyon nicht hat - sonst zerlegte es auch Vorhandenes („½" → „1⁄2" → „12"; Fallensuche 1.0.62) */
  const s = Array.from(String(text ?? '').normalize('NFC').replace(/[\u2010\u2011]/g, '-').replace(/[\u2012\u2015]/g, '\u2013')).map(c => ERLAUBT.test(c) ? c : c.normalize('NFKC')).join('');
  const woerter = s.split(/(\s+)/).map(w => {
    if (/^\s+$/.test(w)) return ' ';
    const zeichen = Array.from(w), buchst = zeichen.filter(c => /\p{L}/u.test(c));
    /* übersetzt wird nur ein Wort, das selbst lateinische Schrift trägt (das T in Tαɾʝα, Kapitälchen wie ᴍᴏᴍᴏ) und sonst nur Doppelgänger
       hat - ein echtes kyrillisches oder griechisches Wort („ветра") bliebe sonst lateinisches Kauderwelsch („betpa"; Probe 1.0.62) */
    const nurDoppel = buchst.length && buchst.some(c => /\p{Script=Latin}/u.test(c)) && buchst.every(c => LATEIN.test(c) || DOPPEL[c]);
    return zeichen.map(c => (nurDoppel && DOPPEL[c]) || c).join('');
  });
  /* erlaubt: lateinische Schrift samt Akzenten, Ziffern, übliche Satzzeichen und Anführungen; der Rest fällt weg */
  return Array.from(woerter.join('')).filter(c => ERLAUBT.test(c)).join('').replace(/\s+/g, ' ').trim();
}
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n3 = (v) => String(+v.toFixed(3));
const GRAD = Math.PI / 180;

// FNV-1a über Saat und Text, dann mulberry32: deterministisch, je Text eine eigene Folge (sonst wackelten alle Titel gleich)
const streuwert = (s) => { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
function zufall(saat) {
  let a = saat >>> 0;
  const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { r, u: () => r() + r() - 1, gl: () => 2 * r() - 1 };   // r: [0,1), u: dreieckig in (-1,1), gl: gleichverteilt (-1,1)
}

/* UMBRUCHREGELN, wörtlich aus render.js (umbruchErlaubt): eine zweite oder dritte Zeile ist nie nur „…"/„...", nie nur ein
   Buchstabe, nie nur eine Zahl (auch „v2", „'25") und beginnt nie mit einem Strich. streng: auch eine Zeile aus mehreren
   solchen Stücken ist verboten („'25 v2" - die Hausregel prüft die Zeile als Ganzes und lässt sie durch). */
const NUR_PUNKTE = /^(\.{2,}|…)$/, NUR_BUCHSTABE = /^\p{L}$/u, NUR_ZAHL = /^['’]?v?\d+([.,]\d+)?$/i, STRICH_VORN = /^[-–—]/;
const allein = (t) => NUR_PUNKTE.test(t) || NUR_BUCHSTABE.test(t) || NUR_ZAHL.test(t);
export function umbruchErlaubt(lines, streng = false) {
  return lines.every((t, j) => j === 0 || !(allein(t) || STRICH_VORN.test(t) || (streng && t.split(' ').filter(Boolean).every(allein))));
}

/* ZWEI ZEILEN FÜR DIE KACHEL: alle Aufteilungen an Wortgrenzen in eine oder zwei Zeilen, die die Hausregeln erlauben (Namen
   bis 14 Zeichen nie zweizeilig - wie alleUmbrueche in render.js), sortiert nach der breitesten Zeile (em, ohne em nach
   Zeichen), bei Gleichstand weniger Zeilen zuerst. Die einzeilige Fassung ist immer dabei - sie ist die breiteste. */
export function zweiZeilen(titel, em, { streng = false } = {}) {
  const w = String(titel || '').split(' ').filter(Boolean), ganz = w.join(' '), out = [[ganz]];
  if (ganz.length > 14) for (let c = 1; c < w.length; c++) out.push([w.slice(0, c).join(' '), w.slice(c).join(' ')]);
  const mass = (t) => em ? em(t) : t.length, breit = (z) => Math.max(...z.map(mass));
  return out.filter(z => umbruchErlaubt(z, streng)).sort((a, b) => breit(a) - breit(b) || a.length - b.length);
}

/* Umbruch auf eine Breite (in em): gierig, danach die Hausregeln - eine Zeile, die mit einem Strich beginnt, gibt ihn an die
   vorige ab („dich – / Track 1"); eine Zeile, die nur „…", ein Buchstabe oder eine Zahl ist, holt das letzte Wort der vorigen
   (oder hängt sich an, wenn die vorige nur ein Wort hat). */
function umbrechen(woerter, breiteEm, em, luft) {
  const z = [];
  for (const w of woerter) {
    const l = z[z.length - 1];
    if (l && em(l.join(' ')) + luft + em(w) <= breiteEm) l.push(w); else z.push([w]);
  }
  for (let n = 0, geaendert = true; geaendert && n < 20; n++) {
    geaendert = false;
    for (let j = 1; j < z.length; j++) {
      const t = z[j].join(' ');
      if (STRICH_VORN.test(t)) { z[j - 1].push(z[j].shift()); if (!z[j].length) z.splice(j, 1); geaendert = true; break; }
      if (allein(t)) { if (z[j - 1].length > 1) z[j].unshift(z[j - 1].pop()); else { z[j - 1].push(...z[j]); z.splice(j, 1); } geaendert = true; break; }
    }
  }
  return z;
}

/* Klecks: ein unregelmäßiger Fleck (elf Punkte, Halbmesser ±30 %), zu einer Seite in einen Auslauf gezogen, geglättet als
   geschlossene Catmull-Rom-Kurve. Er liegt AUF dem letzten Zug des Worts und ist
   innen heller als am Rand (eingetrocknete Tinte sammelt sich am Rand) - erster Versuch: klein, satt und hinter dem Wort,
   da las er sich als Punkt oder Komma („zieht. leise", „die. Glocken"); ein Spritzer hinter der Spitze landete im
   Wortzwischenraum und las sich als Doppelpunkt („Wind: sich") - er entfällt; auf der Grundlinie am Wortende blieb er ein
   Punkt („Wind."), darum sitzt er gut eine Viertel-Schrift vor dem Wortende im letzten Buchstaben auf halber x-Höhe (bei
   einem schmalen t lag er sonst im Zwischenraum: „ist·geduldig") und läuft nach links ins Wort aus. */
function klecksPfad(cx, cy, rho, Z) {
  const n = 11, th = (0.6 + 0.8 * Z.r()) * Math.PI,   /* der Auslauf zeigt zurück ins Wort (nach links), nie in den Zwischenraum */ aus = 0.8 + 0.7 * Z.r(), p = [];
  for (let k = 0; k < n; k++) {
    const a = (k + 0.3 * Z.gl()) / n * 2 * Math.PI, d = Math.atan2(Math.sin(a - th), Math.cos(a - th));
    const rr = rho * (1 + 0.3 * Z.gl()) * (1 + aus * Math.exp(-((d / 0.3) ** 2)));
    p.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  let d = `M${n3(p[0][0])},${n3(p[0][1])}`;
  for (let k = 0; k < n; k++) {
    const a = p[(k + n - 1) % n], b = p[k], c = p[(k + 1) % n], e = p[(k + 2) % n];
    d += `C${n3(b[0] + (c[0] - a[0]) / 6)},${n3(b[1] + (c[1] - a[1]) / 6)} ${n3(c[0] - (e[0] - b[0]) / 6)},${n3(c[1] - (e[1] - b[1]) / 6)} ${n3(c[0])},${n3(c[1])}`;
  }
  d += 'Z';
  return d;
}

/* handschrift(text, x, y, fs, …) -> { svg, hoehe, zeilen, breite }
   text: eine Zeichenkette (\n trennt Absätze; mit `breite` wird auf diese Breite umbrochen) oder eine Liste fertiger Zeilen
   (etwa aus zweiZeilen). y ist die Grundlinie der ersten Zeile. em(t): Breite in em in Pinyon Script, von außen gemessen.
   breite (in den Einheiten von x/fs): bei einer Zeichenkette Umbruchbreite, immer zugleich Schranke - eine Zeile, die die
   Wackel und die weiteren Wortabstände (etwa 2-3 % gegenüber em(text)) breiter machen, wird als Ganzes etwas kleiner.
   hoehe: letzte minus erste Grundlinie plus ein Zeilenschritt - der Platz, den der Block in Zeilen belegt. zeilen: je Zeile
   { text, x0, x1, y } (y = mittlere Grundlinie). spiegel: jede Zeile um ihre Mitte gespiegelt - der Kasten bleibt, die
   Wackel bleiben, und die zuerst geschriebenen (sattesten) Wörter stehen rechts, wie bei Leonardo. */
export function handschrift(text, x, y, fs, { anker = 'start', farbe = SEPIA, deck = 1, saat = 1, breite = null, zeilenabstand = 1.25, spiegel = false, em, klecks = 0.04, durchstreichen = 0 } = {}) {
  const mass = em || ((t) => String(t).length * 0.4);
  const luft = (mass(' ') > 0 ? mass(' ') : 0.25) + 0.06;   // Pinyon-Wörter hängen über (der Querstrich des t reicht bis ans l): etwas mehr als das Leerzeichen
  const roh = Array.isArray(text) ? text.map(String) : String(text ?? '').split('\n');
  const Z = zufall(streuwert(String(saat) + '\u0001' + roh.join('\n')));
  const zeilenWoerter = [];
  for (const absatz of roh) {
    const w = absatz.split(/\s+/).filter(Boolean);
    if (!w.length) { zeilenWoerter.push([]); continue; }
    if (breite && !Array.isArray(text)) zeilenWoerter.push(...umbrechen(w, 0.97 * breite / fs, mass, luft)); else zeilenWoerter.push(w);
  }
  // Eintauchen: alle 2-4 Wörter (in Schreibrichtung über alle Zeilen); dazwischen verblasst die Tinte nach Zeichen
  let bisTauchen = 0, zyklus = [], zyklen = [];
  const alle = zeilenWoerter.flat();
  for (const w of alle) { if (!bisTauchen) { if (zyklus.length) zyklen.push(zyklus); zyklus = []; bisTauchen = 2 + Math.floor(Z.r() * 3); } zyklus.push(w); bisTauchen--; }
  if (zyklus.length) zyklen.push(zyklus);
  const tinte = [];
  for (const zk of zyklen) {
    const satt = 0.97 + 0.03 * Z.r(), n = zk.reduce((s, w) => s + w.length, 0); let vor = 0;
    for (const w of zk) { tinte.push({ deck: satt - (satt - 0.82) * (vor + 0.5 * w.length) / n, frisch: vor === 0 }); vor += w.length; }
  }
  let wi = 0, svg = '', yz = y, maxB = 0;
  const zeilen = [], schritt = fs * zeilenabstand;
  zeilenWoerter.forEach((woerter, zi) => {
    if (zi > 0) yz += schritt * (1 + 0.1 * Z.u());
    if (!woerter.length) return;
    // Stücke der Zeile in Schreibrichtung: je Wort vielleicht ein angefangenes, durchgestrichenes davor
    const stuecke = [];
    for (const w of woerter) {
      const t = tinte[wi++], buchst = Array.from(w);
      if (durchstreichen > 0 && buchst.length >= 3 && Z.r() < durchstreichen) {
        const teil = buchst.slice(0, Math.max(2, Math.round(buchst.length * (0.45 + 0.35 * Z.r())))).join('');
        stuecke.push({ t: teil, tinte: t, gestrichen: true });
      }
      stuecke.push({ t: w, tinte: t });
    }
    for (const s of stuecke) {
      s.sk = 1 + 0.04 * Z.gl(); s.rot = 1.2 * Z.gl(); s.dy = 0.03 * Z.u(); s.sp = (g => g < 0 ? 1 + 0.04 * g : 1 + 0.15 * g)(Z.gl());
      const verzerrt = Z.r() < 0.33; s.skew = verzerrt ? 3 * Z.u() : 0; s.sx = verzerrt ? 1 + 0.04 * Z.u() : 1;
      s.klecks = !s.gestrichen && klecks > 0 && Z.r() < klecks;
      s.w = mass(s.t) * fs * s.sk * s.sx;
    }
    /* Abstand nach jedem Stück: Leerzeichen mal Wackel, dazu was Drehung und Neigung oben (Oberlänge 0,779 em) aufeinander
       zuschieben - ein nach rechts gekipptes Wort neben einem nach links geneigten stieß sonst an („zieht|leise") */
    stuecke.forEach((s, j) => { const n = stuecke[j + 1]; if (!n) { s.abst = 0; return; }
      const zu = 0.779 * (Math.sin(s.rot * GRAD) - Math.sin(n.rot * GRAD) + Math.tan(n.skew * GRAD) - Math.tan(s.skew * GRAD));
      s.abst = fs * (luft * s.sp + Math.max(0, zu) * (s.sk + n.sk) / 2); });
    let W = stuecke.reduce((a, s) => a + s.w + s.abst, 0);
    /* der Zeilenanfang wackelt um ±10 % der Schrift - mit Schranke nur halb so viel und nach innen; machten die Wackel die Zeile
       breiter als erlaubt, wird die ganze Zeile etwas kleiner */
    let ruck = 0.1 * fs * Z.u() * (breite ? 0.5 : 1);
    if (breite) ruck = anker === 'start' ? Math.abs(ruck) : anker === 'end' ? -Math.abs(ruck) : ruck;
    const erlaubt = breite ? breite - Math.abs(ruck) * (anker === 'middle' ? 2 : 1) : Infinity;
    const k = W > erlaubt ? erlaubt / W : 1;
    W *= k;
    const l1 = fs * (10 + 6 * Z.r()), l2 = fs * (4 + 3 * Z.r()), p1 = Z.r() * 2 * Math.PI, p2 = Z.r() * 2 * Math.PI, A = 0.025 * fs;
    const neig = Math.min(Math.tan(0.4 * GRAD), 0.035 * fs / Math.max(W / 2, 1e-9)) * Z.gl();
    const welle = (u) => A * (0.7 * Math.sin(2 * Math.PI * u / l1 + p1) + 0.3 * Math.sin(2 * Math.PI * u / l2 + p2)) + neig * (u - W / 2);
    const steig = (u) => A * (0.7 * 2 * Math.PI / l1 * Math.cos(2 * Math.PI * u / l1 + p1) + 0.3 * 2 * Math.PI / l2 * Math.cos(2 * Math.PI * u / l2 + p2)) + neig;
    const x0 = (anker === 'middle' ? x - W / 2 : anker === 'end' ? x - W : x) + ruck;
    let u = 0, teil = '';
    for (const [j, s] of stuecke.entries()) {
      const w = s.w * k, cx = x0 + u + w / 2, um = u + w / 2, yb = yz + welle(um) + s.dy * fs, f = fs * s.sk * k;
      const winkel = s.rot + 0.5 * Math.atan(steig(um)) / GRAD, op = deck * s.tinte.deck;
      const xt = cx - w / s.sx / 2;   // ohne Breitenzug beginnt das Wort hier; scale(sx) um cx zieht es auf w
      const tf = s.skew || s.sx !== 1
        ? `translate(${n3(cx)} ${n3(yb)}) rotate(${n3(winkel)}) skewX(${n3(s.skew)}) scale(${n3(s.sx)} 1) translate(${n3(-cx)} ${n3(-yb)})`
        : `rotate(${n3(winkel)} ${n3(cx)} ${n3(yb)})`;
      const strich = s.tinte.frisch ? ` stroke-width="${n3(0.007 * f)}"` : '';
      teil += `<text x="${n3(xt)}" y="${n3(yb)}" font-size="${n3(f)}" opacity="${n3(op)}"${strich} transform="${tf}">${esc(s.t)}</text>`;
      if (s.gestrichen) {
        // ein schneller Zug ohne Absetzen: hin (leicht steigend), scharf umkehren, schräg zurück und über den ersten hinweg
        const a = x0 + u - 0.05 * f, b = x0 + u + w + 0.07 * f, ym = yb - 0.19 * f, q = 0.03 * f * Z.u();
        teil += `<path d="M${n3(a)},${n3(ym + 0.03 * f)}Q${n3((a + b) / 2)},${n3(ym - 0.03 * f + q)} ${n3(b)},${n3(ym - 0.05 * f)}`
          + `L${n3(b - 0.1 * f)},${n3(ym + 0.06 * f)}Q${n3((a + b) / 2)},${n3(ym - 0.01 * f - q)} ${n3(a + 0.12 * f)},${n3(ym - 0.07 * f)}"`
          + ` fill="none" stroke-width="${n3(0.045 * f)}" stroke-linecap="round" stroke-linejoin="round" opacity="${n3(op)}"/>`;
      }
      if (s.klecks) {
        const rho = f * (0.07 + 0.035 * Z.r()), kx = x0 + u + w - Math.min(0.26 * f, 0.4 * w) + 0.05 * f * Z.r(), ky = yb - 0.12 * f - 0.08 * f * Z.r();
        teil += `<path d="${klecksPfad(kx, ky, rho, Z)}" fill-opacity="${n3(deck * 0.6)}" stroke-opacity="${n3(deck * 0.9)}" stroke-width="${n3(0.014 * f)}"/>`;
      }
      u += w + s.abst * k;
    }
    const mx = x0 + W / 2;
    svg += spiegel ? `<g transform="matrix(-1 0 0 1 ${n3(2 * mx)} 0)">${teil}</g>` : teil;
    zeilen.push({ text: woerter.join(' '), x0, x1: x0 + W, y: yz });
    maxB = Math.max(maxB, W);
  });
  return {
    svg: `<g class="hand" fill="${farbe}" stroke="${farbe}" stroke-width="0" stroke-linejoin="round" font-family="${SCHRIFT.replace(/"/g, '&quot;')}" text-anchor="start">${svg}</g>`,
    hoehe: yz - y + schritt, zeilen, breite: maxB,
  };
}
