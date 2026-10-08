/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   DAS VOLLE BLATT (Skizzenbuch, Entwurf 08.10.2026, Übergabe §88). Caspar_D: „verschenke keinen Platz" – Leonardos Bögen waren
   „voll, teilweise übervoll"; der Kreis ist angeschnitten (¼ des Durchmessers über die Randlinie, was draußen liegt, taucht nirgends
   auf) und das Wow-Element; daneben eine Spalte für Studien. Inhalt: „Daten als Inhalt, Leonardo als Form".
   Angeordnet über ein RASTER (Zellen von 3 mm auf 50 × 70): der Kreis mit seinem Ring belegt zuerst, dann melden sich die Blöcke
   nach Rang; jeder sucht die freie Stelle, die seinem Wunschort am nächsten liegt (Summentabelle, jede Probe O(1)), und wird
   schrittweise kleiner, wenn er nirgends passt. Zuletzt füllen Spiegelschrift und Coverfetzen die größten Lücken.
   DREI ANORDNUNGEN nach der Form des Blatts (die Maße skalieren mit der kurzen Seite, es zählt nur das Seitenverhältnis):
   hoch (links angeschnitten, Streifen oben und unten, Spalte ⅕) - quer (unten angeschnitten, Spalte rechts, nur ein Streifen oben)
   - quadratisch (links angeschnitten, Spalte ¼, keine Streifen). Jeder Block hat je Anordnung seinen Wunschort und, wo nötig,
   seinen Bereich; die Kernblöcke (Kopf, Siegel, Tabula, Steckbrief, Instrumentenpaar, Würdigung, Legende) dürfen weiter
   schrumpfen als die übrigen, die in engen Formaten wegfallen. Jeder gesetzte Block trägt data-block="<name>". */
import { handschrift, zweiZeilen, schriftTauglich, ohneKlammern, umbruchErlaubt } from './skizze-hand.js';
import { studie, lupe, STUDIE_MASS, DETAILS } from './skizze-studien.js';
import { siegel as siegelLack } from './skizze-siegel.js';

const n2 = (v) => (+v).toFixed(2);
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/* Römische Zahlen als Federstriche (Caspar_D, 08.10.2026: „Das I als römische Zahl funktioniert nicht – gibt es einen anderen senkrechten
   Strich?" – in Pinyon Script ist das große I ein geschwungenes J, die Pipe ist dort ein Schrägstrich; „wir brauchen ja nur X I V … ggf
   wirklich römische Zahlen selbstgezeichnet simulieren"). Wie mit der Breitfeder: Grundstriche kräftig (I, die linke Schräge von V, der
   Abstrich von X), Haarstriche und Serifen fein; leicht geneigt wie die Schrift (10°). Rechtsbündig an x, Grundlinie y, Höhe h. */
function roemisch(n){ const T = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let z = ''; for (const [w, t] of T) while (n >= w){ z += t; n -= w; } return z; }
function roemischStriche(n, x, y, h, farbe, deck = 0.88){
  const z = roemisch(n), b = { I: 0.16 * h, V: 0.6 * h, X: 0.62 * h }, luft = 0.14 * h, sl = Math.tan(10 * Math.PI / 180);
  const P = (px, py) => `${n2(px + (y - py) * sl)},${n2(py)}`;
  let breite = 0; for (const c of z) breite += b[c] + luft; breite -= luft;
  let cx = x - breite - h * sl * 0.5, dick = '', fein = '';
  const serif = (mx, my) => `M${P(mx - 0.1 * h, my)} L${P(mx + 0.1 * h, my)} `;
  for (const c of z){
    if (c === 'I'){ const m = cx + b.I / 2; dick += `M${P(m + 0.01 * h, y - h)} Q${P(m - 0.03 * h, y - h / 2)} ${P(m, y)} `; fein += serif(m, y - h) + serif(m, y); }
    else if (c === 'V'){ dick += `M${P(cx + 0.02 * h, y - h)} Q${P(cx + 0.2 * h, y - 0.45 * h)} ${P(cx + b.V / 2, y)} `; fein += `M${P(cx + b.V / 2, y)} Q${P(cx + b.V * 0.66, y - 0.5 * h)} ${P(cx + b.V, y - h)} ` + serif(cx + 0.02 * h, y - h) + serif(cx + b.V, y - h); }
    else if (c === 'X'){ dick += `M${P(cx + 0.02 * h, y - h)} Q${P(cx + b.X * 0.52, y - 0.52 * h)} ${P(cx + b.X, y)} `; fein += `M${P(cx + b.X - 0.02 * h, y - h)} Q${P(cx + b.X * 0.46, y - 0.46 * h)} ${P(cx, y)} ` + serif(cx + 0.02 * h, y - h) + serif(cx + b.X - 0.02 * h, y - h) + serif(cx, y) + serif(cx + b.X, y); }
    cx += b[c] + luft;
  }
  const st = (d, w) => `<path d="${d}" fill="none" stroke="${farbe}" stroke-opacity="${deck}" stroke-width="${n2(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return st(dick, 0.12 * h) + st(fein, 0.05 * h);
}
const STIMMUNG_DE = { energetic: 'energiegeladen', love: 'Liebe', melodic: 'melodisch', epic: 'episch', happy: 'fröhlich', dark: 'dunkel', heavy: 'schwer',
  romantic: 'romantisch', sad: 'traurig', calm: 'ruhig', emotional: 'gefühlvoll', relaxing: 'entspannt', uplifting: 'erhebend', dramatic: 'dramatisch', inspiring: 'beflügelnd' };
const INSTR_DE = { guitar: 'Gitarre', drums: 'Schlagwerk', synthesizer: 'Synthesizer', bass: 'Bass', electricguitar: 'E-Gitarre', piano: 'Klavier',
  acousticguitar: 'Akustikgitarre', keyboard: 'Tasten', strings: 'Streicher', violin: 'Geige', cello: 'Cello' };
/* STUDIEN NACH DATEN (Übergabe §89): welche Zeichnung aus skizze-studien.js zu welchem Instrument aus klang.json gehört. Die hohen
   (Hals oder Flügel) können mit dem Cello das Paar in der Spalte bilden, die breiten bekommen eine Lupe, wo Platz ist. */
const STUDIE_VON = { guitar: 'gitarre', electricguitar: 'gitarre', acousticguitar: 'gitarre', bass: 'bass', piano: 'klavier',
  keyboard: 'synthesizer', synthesizer: 'synthesizer', drums: 'drums', strings: 'cello', violin: 'cello', cello: 'cello' };
const HOCH = ['gitarre', 'bass', 'klavier'];
/* Hals der stehenden Instrumente in ihren Einheiten (skizze-studien.js): Achse, Oberkante des Kopfes, halbe Halsbreite am Korpus */
const HALS = { gitarre: { achse: 19, kopf: 1, halb: 2.6 }, bass: { achse: 20, kopf: 0.6, halb: 3.3 } };
/* Klammerzusätze weg - bleibt nichts übrig („(Untitled)"), bleibt der Titel ganz (wie ohneKlammern im Haus) */
const ohneKl = ohneKlammern;   /* wie im Haus: auch verschachtelt, „(Untitled)" bleibt ganz */
/* Ein Titel, wie das Blatt ihn schreibt: Klammern weg, schrifttauglich; ein ganz nicht-lateinischer Titel wird leer ('') - die Blöcke
   setzen dann einen Ersatz statt leerer Anführungszeichen (Fallensuche 1.0.62) */
const titelText = (t) => { const r = schriftTauglich(ohneKl(t)) || schriftTauglich(String(t || '').replace(/[()[\]{}]/g, ' '));
  return /\p{L}/u.test(String(t || '')) && !/\p{L}/u.test(r) ? '' : r; };   /* hatte der Titel Buchstaben und blieb keiner, ist er unlesbar („!", „…") */
const anzahl = (n, eins, viele) => `${n} ${n === 1 ? eins : viele}`;
/* Anzeigename einer Person für Pinyon Script: der Name ohne Zierrat (schriftTauglich: ꧁༺ Tαɾʝα ༻꧂ → Tarja, Emoji weg); bleibt davon kein
   Wort aus zwei Buchstaben (ein kyrillischer oder chinesischer Name), der Handle in Wörtern („tarja_ravenveil" → „Tarja Ravenveil").
   Namen nur aus Großbuchstaben (PURRGATORY) werden gemischt - in Schreibschrift sind Versalien kaum lesbar. */
export const anzeigeName = (p) => {
  let n = schriftTauglich(p && p.name);
  if (!/\p{L}{2}/u.test(n)) n = String((p && p.handle) || '').split(/[_.-]/).filter(Boolean).map(x => x[0].toUpperCase() + x.slice(1)).join(' ');
  /* ganz in Versalien: Wörter ab drei Buchstaben mischen („THE ROCK" → „The Rock"), sonst ab vier (DJ, AI, MC bleiben); ein Satzzeichen
     am Wortanfang bleibt vorn, der erste Buchstabe groß */
  const gross = (w) => !/\p{Ll}/u.test(w.replace(/ß/g, '')) && /\p{Lu}/u.test(w);   /* ß zählt nicht gegen Versalien („GROßE"); İ wird i */
  const allesGross = gross(n);
  return n.split(' ').map(w => w.length > (allesGross ? 2 : 3) && gross(w) ? w.replace(/^(\P{L}*\p{L})(.*)$/u, (_, a, b) => a + b.toLowerCase().replace(/i\u0307/g, 'i')) : w).join(' ');
};
/* WIDMUNG DES CELLOS an Platz 1 der Würdigung (Caspar_D, 08.10.2026: „Widmung geschlechtsneutral und adaptiert an platz eins
   kommentator"; vorher fest „magistrae Tarjae dedicatum"). artifex ist im Lateinischen beiderlei Geschlechts – „artifici": dem Meister
   wie der Meisterin. Der Vorname im Dativ nach seiner Endung (‑a → ‑ae wie Tarja → Tarjae, ‑us → ‑o), sonst unverändert: die
   Deklination folgt der Form des Wortes, nicht dem Geschlecht. Ohne Würdigung bleibt die Zeile leer (nur „Violoncellum"). */
const TITELWORT = /^(dj|mc|the|dr|mr|mrs|ms|sir|lady|le|la|el|der|die|das)$/i;
function widmungFuer(p){
  if (!p) return '';
  /* Wortgrenzen auch an _ und . (Handles als Name: „tarja_ravenveil" → Tarja), führende Titel und Artikel überspringen (DJ, The, Dr …) */
  const w = anzeigeName(p).split(/[\s_.]+/).map(x => x.replace(/[^\p{L}'’-]/gu, '').replace(/^[-'’]+|[-'’]+$/g, '')).filter(Boolean);
  let v = w.find((x, i) => !TITELWORT.test(x) || i === w.length - 1) || '';
  if (!v) return '';
  if (v === v.toLowerCase()) v = v[0].toUpperCase() + v.slice(1);
  const gross = v.length > 1 && v === v.toUpperCase();
  /* -us nur bei lateinisch gebauten Namen (Marcus → Marco), nicht Klaus, Zeus, Gus */
  const dativ = /a$/i.test(v) ? v + (gross ? 'E' : 'e') : v.length >= 4 && /(?<![aeo])us$/i.test(v) ? v.slice(0, -2) + (gross ? 'O' : 'o') : v;
  return `artifici ${dativ} dedicatum`;
}
/* AUSGEWOGEN UMBRECHEN: in so wenige Zeilen wie nötig (höchstens drei), die Wörter so verteilt, dass die längste Zeile möglichst kurz
   ist - kein „mich" allein in der letzten Zeile wie beim gierigen Umbruch (Grenzfall-Probe 1.0.62) */
function ausgewogen(text, breiteEm, em){
  const w = String(text).split(' ').filter(Boolean), z = (a, b) => w.slice(a, b).join(' ');
  if (em(w.join(' ')) <= breiteEm || w.length < 2) return [w.join(' ')];
  let best = null;
  for (let i = 1; i < w.length; i++){ const l = [z(0, i), z(i)], m = Math.max(...l.map(em)); if (!best || m < best.m) best = { l, m }; }
  if (best.m <= breiteEm || w.length < 3) return best.l;
  for (let i = 1; i < w.length - 1; i++) for (let j = i + 1; j < w.length; j++){ const l = [z(0, i), z(i, j), z(j)], m = Math.max(...l.map(em)); if (m < best.m) best = { l, m }; }
  return best.l;
}
const tausend = (n) => Math.round(n).toLocaleString('de-DE');
const mmss = (s) => { const t = Math.round(s); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };   /* erst runden, dann teilen - sonst „5:60" */
/* Zahlwörter für Überschriften, die zählen („die fünf meistgehörten"): kleine Bestände haben weniger als fünf */
const ZW = ['', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
const zahlwort = (n) => n <= 12 ? ZW[n] : String(n);
const STUFEN = [1, 0.92, 0.84, 0.76, 0.68, 0.6];
const KERN = [1, 0.92, 0.84, 0.76, 0.68, 0.6, 0.53, 0.47];   /* Kernblöcke schrumpfen weiter, bevor sie wegfallen */

/* DAS RASTER: b[j*nx+i] = 1 belegt; suchen(w, h, wo) gibt die freie Stelle, deren Mitte dem Wunschort am nächsten liegt */
function raster(P, H, c){
  const nx = Math.ceil(P / c), ny = Math.ceil(H / c), b = new Uint8Array(nx * ny), sat = new Int32Array((nx + 1) * (ny + 1));
  let schmutz = true;
  const bauen = () => { for (let j = 0; j < ny; j++){ let zs = 0; for (let i = 0; i < nx; i++){ zs += b[j * nx + i]; sat[(j + 1) * (nx + 1) + i + 1] = sat[j * (nx + 1) + i + 1] + zs; } } schmutz = false; };
  const summe = (i0, j0, i1, j1) => sat[j1 * (nx + 1) + i1] - sat[j0 * (nx + 1) + i1] - sat[j1 * (nx + 1) + i0] + sat[j0 * (nx + 1) + i0];
  const ci = (x) => Math.max(0, Math.min(nx, Math.round(x / c))), cj = (y) => Math.max(0, Math.min(ny, Math.round(y / c)));
  return {
    c,
    belegen(x0, y0, x1, y1){ for (let j = cj(y0); j < cj(y1); j++) for (let i = ci(x0); i < ci(x1); i++) b[j * nx + i] = 1; schmutz = true; },
    jeZelle(test){ for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (test((i + 0.5) * c, (j + 0.5) * c)) b[j * nx + i] = 1; schmutz = true; },
    suchen(w, h, { ax, ay, x0 = 0, y0 = 0, x1 = P, y1 = H, weit = Infinity }){
      if (schmutz) bauen();
      const wi = Math.ceil(w / c), hj = Math.ceil(h / c); let best = null, bd = weit * weit;
      for (let j = Math.ceil(y0 / c); j + hj <= Math.floor(y1 / c); j++) for (let i = Math.ceil(x0 / c); i + wi <= Math.floor(x1 / c); i++){
        const d = ((i + wi / 2) * c - ax) ** 2 + ((j + hj / 2) * c - ay) ** 2;
        if (d < bd && summe(i, j, i + wi, j + hj) === 0){ bd = d; best = { x: i * c, y: j * c, w: wi * c, h: hj * c }; } }
      return best;
    },
    /* größtes freies Rechteck (Histogramm je Zeile), nur innerhalb x0…x1, y0…y1 */
    luecke(x0, y0, x1, y1){
      if (schmutz) bauen();
      const i0 = Math.ceil(x0 / c), i1 = Math.floor(x1 / c), j0 = Math.ceil(y0 / c), j1 = Math.floor(y1 / c), hh = new Int32Array(nx);
      let best = null, ba = 0;
      for (let j = j0; j < j1; j++){
        for (let i = i0; i < i1; i++) hh[i] = b[j * nx + i] ? 0 : hh[i] + 1;
        const st = [];
        for (let i = i0; i <= i1; i++){ const hi = i < i1 ? hh[i] : 0; let start = i;
          while (st.length && st[st.length - 1][1] >= hi){ const [s, sh] = st.pop(); const a = sh * (i - s); if (a > ba && sh > 0){ ba = a; best = { x: s * c, y: (j + 1 - sh) * c, w: (i - s) * c, h: sh * c }; } start = s; }
          st.push([start, hi]); } }
      return best;
    },
    anteil(x0, y0, x1, y1){ let n = 0, z = 0; for (let j = cj(y0); j < cj(y1); j++) for (let i = ci(x0); i < ci(x1); i++){ z++; n += b[j * nx + i]; } return z ? n / z : 0; },
  };
}

/* Leonardos Notenrätsel (Windsor, RL 12697): „amore sol la mi fa remirare" - Noten auf fünf Linien lesen sich als Silben, „nur die
   Liebe lässt mich erinnern". Breite 110, Höhe 26 in eigenen Einheiten; Semibreven als Rauten wie in der Mensuralnotation. */
function notenraetsel(breite, f, SEP, SCHRIFT){
  const k = breite / 110, sw = (mm) => (mm * f / k).toFixed(3), st = (mm, o = 0.85) => `stroke="${SEP}" stroke-opacity="${o}" stroke-width="${sw(mm)}"`;
  const tx = (xx, yy, fs, t, o = 0.8) => `<text x="${n2(xx)}" y="${n2(yy)}" font-size="${n2(fs)}" fill="${SEP}" fill-opacity="${o}" text-anchor="middle" font-family="${SCHRIFT}">${esc(t)}</text>`;
  let g = '';
  for (let i = 0; i < 5; i++) g += `<line x1="22" y1="${4 + 2 * i}" x2="84" y2="${4 + 2 * i}" ${st(0.18, 0.7)}/>`;
  /* sol la mi fa re mi (G A E F D E), Violinschlüssel durch ein schlichtes G angedeutet: unterste Linie y 12 = E, Schritt 1 */
  const tonY = { sol: 10, la: 9, mi: 12, fa: 11, re: 13 }, silben = ['sol', 'la', 'mi', 'fa', 're', 'mi'];
  g += tx(26, 12, 7.5, '𝄞', 0.85);
  silben.forEach((sb, i) => { const xx = 34 + i * 8.4, yy = tonY[sb];
    g += `<path d="M${n2(xx - 1.3)},${n2(yy)} L${n2(xx)},${n2(yy - 1)} L${n2(xx + 1.3)},${n2(yy)} L${n2(xx)},${n2(yy + 1)} Z" fill="${SEP}" fill-opacity="0.85"/>`
      + (yy >= 13 ? `<line x1="${n2(xx - 2)}" y1="14" x2="${n2(xx + 2)}" y2="14" ${st(0.18)}/>` : '') + tx(xx, 19, 2.6, sb, 0.65); });
  g += tx(10, 11, 4.8, 'amore') + tx(97, 11, 4.8, 'rare') + tx(55, 25, 3, 'amore sol la mi fa remirare – nur die Liebe lässt mich erinnern', 0.6);
  return `<g transform="scale(${k.toFixed(4)})">${g}</g>`;
}

export function blattSchmuck(ctx){
  const { g, E, papier, SEP, SCHRIFT, tinte, legende, refrains, daten, feder, res, zeilen, ebene, arealFarbe, B } = ctx;
  /* alles, was Pinyon schreibt, vorher schrifttauglich (Emoji, Zierrat fallen weg) - Messen und Schreiben am selben Text */
  const rein = schriftTauglich, em = (t) => ctx.em(rein(t));
  const f = g.kurz / 500, { cx, cy, r, schnitt, quadr } = g.kreis, P = g.PW, H = g.PH, kv = g.karte, links = schnitt === 'links';
  const art = !links ? 'quer' : quadr ? 'quadrat' : 'hoch';
  const innen = { x0: B + 9 * f, y0: B + 9 * f, x1: B + g.w - 9 * f, y1: B + g.h - 9 * f };   /* der Seitenrand darf beschrieben werden, nicht der Beschnitt */
  const ih = innen.y1 - innen.y0, ganz = { ...innen };
  const R = raster(P, H, 3 * f);
  let saat = 1;
  const hand = (t, x, y, fs, o = {}) => handschrift(Array.isArray(t) ? t.map(rein) : rein(t), x, y, fs, { em, farbe: o.farbe || SEP, saat: saat++, klecks: 0.03, ...o });
  const txt = (x, y, fs, t, { anker = 'start', farbe = SEP, deck = 1, extra = '' } = {}) => `<text x="${n2(x)}" y="${n2(y)}" font-size="${n2(fs)}" fill="${farbe}"${deck < 1 ? ` fill-opacity="${deck}"` : ''} text-anchor="${anker}" font-family="${SCHRIFT}"${extra}>${esc(rein(t))}</text>`;
  const strich = (mm, o = 0.85) => `fill="none" stroke="${SEP}" stroke-opacity="${o}" stroke-width="${n2(mm * f)}" stroke-linecap="round" stroke-linejoin="round"`;
  /* Tinte für Bilder außerhalb des Kreises (Cover im Steckbrief, Fetzen, Bildnisse): weiß wird Blattpapier, dunkel wird Sepia */
  const pap = [1, 3, 5].map(j => parseInt(papier.slice(j, j + 2), 16) / 255), sep = [1, 3, 5].map(j => parseInt(SEP.slice(j, j + 2), 16) / 255);
  const tab = (c) => [0, 0.04, 0.22, 0.62, 1].map(u => (sep[c] + (pap[c] - sep[c]) * u).toFixed(3)).join(' ');
  const tabK = (c) => [0, 0.01, 0.08, 0.38, 1].map(u => (sep[c] + (pap[c] - sep[c]) * u).toFixed(3)).join(' ');
  const hellPap = '#' + pap.map(v => Math.round(255 * (v + (1 - v) * 0.45)).toString(16).padStart(2, '0')).join('');
  /* Fotos ohne Federzeichnung (Bildnis noch nicht gerechnet, eingefrorenes Archiv): sanft getönt statt mit dem steilen Tintenknick */
  const lin = (c) => `${sep[c].toFixed(3)} ${pap[c].toFixed(3)}`;
  let defs = `<filter id="ps-bt-foto" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="table" tableValues="${lin(0)}"/><feFuncG type="table" tableValues="${lin(1)}"/><feFuncB type="table" tableValues="${lin(2)}"/></feComponentTransfer></filter>`
    + `<pattern id="ps-bt-schraff" width="${n2(1.6 * f)}" height="${n2(1.6 * f)}" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><line x1="0" y1="0" x2="0" y2="${n2(1.6 * f)}" stroke="${SEP}" stroke-opacity="0.35" stroke-width="${n2(0.18 * f)}"/></pattern>`
    /* Bildnisse „ein wenig kräftiger" (Caspar_D, 08.10.2026): eine steilere Tintenkurve - Mitteltöne und Kantensaum werden Tinte; anders als
       feMorphology (wirkte am Schirm nicht, im PDF zu stark; Fallensuche 1.0.62) in jeder Auflösung gleich */
    + `<filter id="ps-bt-bildnis" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="table" tableValues="${tabK(0)}"/><feFuncG type="table" tableValues="${tabK(1)}"/><feFuncB type="table" tableValues="${tabK(2)}"/></feComponentTransfer></filter>`
    + `<filter id="ps-bt" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="table" tableValues="${tab(0)}"/><feFuncG type="table" tableValues="${tab(1)}"/><feFuncB type="table" tableValues="${tab(2)}"/></feComponentTransfer></filter>`
    /* eingeriebene Kreide (Caspar_D, 08.10.2026: „bau es gleich ein" – weicher Auslauf statt Kante): Umriss leicht verschoben, breit
       weichgezeichnet, dann mit Kreidekorn ausgedünnt - je weiter außen, desto mehr Korn */
    + `<filter id="ps-kreide" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="${n2(0.05 / f)}" numOctaves="3" seed="5" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="${n2(7 * f)}" result="v"/><feGaussianBlur in="v" stdDeviation="${n2(3 * f)}" result="w"/>`
      + `<feTurbulence type="fractalNoise" baseFrequency="${n2(0.8 / f)}" numOctaves="2" seed="11" result="k"/><feColorMatrix in="k" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 2.2 -0.55" result="korn"/>`
      + `<feComposite in="w" in2="korn" operator="arithmetic" k1="0.55" k2="0.62" k3="0" k4="0"/></filter>`;
  let s = '';

  /* 1. Der Kreis samt Ring (Zeitleiste, Zirkelmarken) belegt zuerst; jenseits der Schnittlinie liegt nur Rand */
  const ring = (E.zeitleiste ? 27 : 12) * f, schnittX = kv.x, schnittY = kv.y + kv.h;
  /* belegt ist, was gezeichnet wird: der Kreis samt Zirkellinie (r + 4) bis r + 6, die Zeitleiste nur auf ihrem Bogen (bis r + 27) */
  /* quer endet der Bogen 10° unter der Waagerechten (vorher 20°): darunter steht in der Spalte das Siegel neben dem Paar, und der Ring
     nahm ihm dort ein Viertel seiner Breite */
  const zlA0 = (links ? 105 : 190) * Math.PI / 180, zlA1 = (links ? -105 : -10) * Math.PI / 180;
  const aufBogen = (x, y) => { let a = Math.atan2(-(y - cy), x - cx); if (!links && a < -Math.PI / 2) a += 2 * Math.PI; return a <= zlA0 + 0.03 && a >= zlA1 - 0.03; };
  R.jeZelle((x, y) => { if (links ? x < schnittX - 2 * f : y > schnittY + 2 * f) return false; const d = Math.hypot(x - cx, y - cy);
    return d < r + 6 * f || (E.zeitleiste && d < r + ring && aufBogen(x, y)); });
  R.jeZelle((x, y) => x < innen.x0 || x > innen.x1 || y < innen.y0 || y > innen.y1);
  /* Zeitleiste auf dem sichtbaren Bogen: je Tag ein Strich (länger bei mehreren Titeln, gedeckelt), Monate und Jahre als Marken;
     die Zeit läuft im Uhrzeigersinn (hoch: von oben über rechts nach unten, quer: von links über oben nach rechts) */
  if (E.zeitleiste && ctx.song){
    const T = zeilen.map(z => { const so = ctx.song(z.id); return so && Date.parse(so.erstellt); }).filter(Boolean).sort((a, b) => a - b);
    if (T.length > 1){
      const t0 = T[0], t1 = T[T.length - 1], a0 = zlA0, a1 = zlA1, r0 = r + 16 * f;
      const ang = (t) => a0 + (a1 - a0) * Math.max(0, Math.min(1, (t - t0) / (t1 - t0 || 1))), pt = (a, rr) => [cx + rr * Math.cos(a), cy - rr * Math.sin(a)], [bx0, by0] = pt(a0, r0), [bx1, by1] = pt(a1, r0);
      s += `<path d="M${n2(bx0)},${n2(by0)} A${n2(r0)},${n2(r0)} 0 ${Math.abs(a1 - a0) > Math.PI ? 1 : 0} 1 ${n2(bx1)},${n2(by1)}" ${strich(0.35, 0.7)}/>`;
      const proTag = new Map(); for (const t of T){ const d = Math.floor(t / 864e5), e = proTag.get(d) || [0, 0]; proTag.set(d, [e[0] + 1, e[1] + t]); }
      for (const [, [n, summe]] of proTag){ const a = ang(summe / n), [x0, y0] = pt(a, r0), [x1, y1] = pt(a, r0 + (2 + Math.min(7, 1.8 * Math.sqrt(n))) * f);
        s += `<line x1="${n2(x0)}" y1="${n2(y0)}" x2="${n2(x1)}" y2="${n2(y1)}" ${strich(0.3, 0.75)}/>`; }
      /* Caspar_D, 08.10.2026: „die monate auf latein ausschreiben und grösser" */
      const MON = ['Ianuarius', 'Februarius', 'Martius', 'Aprilis', 'Maius', 'Iunius', 'Iulius', 'Augustus', 'September', 'October', 'November', 'December'];
      for (let dt = new Date(new Date(t0).getFullYear(), new Date(t0).getMonth() + 1, 1); dt.getTime() <= t1; dt.setMonth(dt.getMonth() + 1)){
        const a = ang(dt.getTime()), jan = dt.getMonth() === 0, [x0, y0] = pt(a, r0), [x1, y1] = pt(a, r0 - (jan ? 4 : 2.2) * f), [lx, ly] = pt(a, r0 - 7 * f);
        s += `<line x1="${n2(x0)}" y1="${n2(y0)}" x2="${n2(x1)}" y2="${n2(y1)}" ${strich(0.3, 0.9)}/>`
          + txt(lx, ly, (jan ? 5.6 : 4.4) * f, jan ? String(dt.getFullYear()) : MON[dt.getMonth()], { anker: 'middle', deck: 0.8, extra: ` transform="rotate(${(90 - a * 180 / Math.PI).toFixed(1)} ${n2(lx)} ${n2(ly)})"` }); }
    }
  }

  /* SETZEN: blk = { name, w, h, svg, luft } oder eine Liste von Fassungen - je Stufe wird jede Fassung probiert, die erste, die
     irgendwo im Bereich frei liegt, gewinnt; wo(b, k) gibt Wunschort und Bereich (Mitte des Blocks bei der Stufe k). nah (mm auf
     50 × 70): erst die großen Stufen (bis ¾) nur so nah am Wunschort - der Kopf gehört in die Ecke, auch etwas kleiner, statt groß
     in die Mitte; erst wenn er dort nicht einmal mit ¾ (nahBis) passt, gilt das ganze Blatt */
  const lege = (blk, wo, stufen = STUFEN, nah = 0, nahBis = 0.75) => {
    const fassungen = (Array.isArray(blk) ? blk : [blk]).filter(Boolean), gaenge = nah ? [[nah * f, stufen.filter(k => k >= nahBis)], [Infinity, stufen]] : [[Infinity, stufen]];
    for (const [grenze, st] of gaenge) for (const k of st) for (const b of fassungen){
      const luft = (b.luft == null ? 2 : b.luft) * f, w = { ...(typeof wo === 'function' ? wo(b, k) : wo) };
      if (grenze < Infinity) w.weit = Math.min(w.weit == null ? Infinity : w.weit, grenze);
      const p = R.suchen(b.w * k + 2 * luft, b.h * k + 2 * luft, w);
      if (!p) continue;
      R.belegen(p.x, p.y, p.x + p.w, p.y + p.h);
      const x = p.x + luft + (p.w - 2 * luft - b.w * k) / 2, y = p.y + luft + (p.h - 2 * luft - b.h * k) / 2;
      s += `<g data-block="${b.name}" transform="translate(${n2(x)} ${n2(y)}) scale(${k.toFixed(3)})">${b.svg}</g>`;
      return { x, y, w: b.w * k, h: b.h * k, k };
    }
    return null;
  };
  /* Wunschorte: die Ecken des Beschreibbaren und die Spalte neben dem Kreis. Hochformat und Quadrat: Spalte rechts vom Bogen; quer:
     rechts neben der D-Form über die ganze Höhe, oben ein Streifen über dem Bogen */
  const spalte = links ? { x0: cx + r - 26 * f, y0: innen.y0, x1: innen.x1, y1: innen.y1 } : { x0: kv.x + kv.w - 20 * f, y0: innen.y0, x1: innen.x1, y1: innen.y1 };
  const spMitte = (spalte.x0 + spalte.x1) / 2;
  const ecke = (wo, dx = 0, dy = 0, bereich = ganz) => (b, k) => ({ ...bereich,
    ax: (wo[0] === 'l' ? innen.x0 + b.w * k / 2 : innen.x1 - b.w * k / 2) + dx * f, ay: (wo[1] === 'o' ? innen.y0 + b.h * k / 2 : innen.y1 - b.h * k / 2) + dy * f });
  const bei = (ax, ay, bereich = ganz) => () => ({ ...bereich, ax, ay });
  /* Streifen oben und unten (nur hoch): sind sie hoch genug (Story 9:16), dürfen die Blöcke darin wachsen */
  const streifen = art === 'hoch' ? Math.min(kv.y - innen.y0, innen.y1 - kv.y - kv.h) : 0, weit = streifen > 140 * f;
  const gross = (st) => weit ? [1.3, 1.2, 1.1, ...st] : st;

  /* 2. Kopf mit Spiegelzeile: von den vier ausgewogensten Teilungen (zweiZeilen) die mit der größten Schrift, höchstens 26 (weit 34) mm */
  { const titel = E.kopfTitel || '', maxB = art === 'hoch' ? 0.66 * g.w : art === 'quadrat' ? innen.x1 - (cx + r) + 30 * f : 0.5 * g.w;
    const fsMax = (weit ? 34 : 26) * f;
    const varianten = zweiZeilen(titel, em).slice(0, 4).map(z => ({ z, fs: Math.min(fsMax, maxB / Math.max(...z.map(em))) })).sort((a, b) => b.fs - a.fs);
    const v = varianten[0] || { z: [titel], fs: 20 * f }, fs = v.fs;
    const k1 = hand(v.z, 0, fs * 0.82, fs, { zeilenabstand: 1.12, klecks: 0.08 });
    const unter = String(E.kopfUnter || '').split('/').map(x => x.trim()).filter(Boolean).join(' · ');
    const fsu = Math.min(6.4 * f, Math.max(k1.breite, 80 * f) / Math.max(1, em(unter)));
    const k2 = unter ? hand(unter, 0, k1.hoehe + fsu * 1.1, fsu, { spiegel: true, deck: 0.7, breite: Math.max(k1.breite, 80 * f) }) : { svg: '', hoehe: 0, breite: 0 };
    const kb = { name: 'kopf', w: Math.max(k1.breite, k2.breite) + 2 * f, h: k1.hoehe + k2.hoehe + 3 * f, svg: k1.svg + k2.svg, luft: 2 };
    lege(kb, ecke(art === 'quadrat' ? 'ro' : 'lo'), KERN, 40);
  }

  /* 3. Siegel unten rechts: Siegellack mit Bändern, der Avatar als Prägung (skizze-siegel.js; Caspar_D: „das sieht mir noch zu sehr
     nach Knete aus"), darunter die Edition. Ohne Profilbild ein glattes Prägefeld mit Perlkreis. */
  const siegel = () => {
    const w = 84 * f, ax = w / 2, ay = 34 * f, sg = siegelLack({ cx: ax, cy: ay, f, mitAvatar: !!ctx.avatar, idVor: 'ps-sg' }), unten = sg.kasten.y1;
    const h = unten + (ctx.edition ? 12 * f : 2 * f);
    defs += sg.defs;
    let sv = sg.svg;
    if (ctx.edition) sv += txt(ax, unten + 8 * f, Math.min(4.4 * f, 0.96 * w / Math.max(1, em(ctx.edition))), ctx.edition, { anker: 'middle', deck: 0.8 });   /* lange Namen: kleiner, nie über den Block */
    /* quer unten links in der Spalte, dicht am Bogen (die Zeitleiste endet vor dem Schnitt), neben dem Paar - dort lieber kleiner
       als oben im Streifen; im Quadrat höchstens 0,85 (die Spalte ist kurz) */
    lege({ name: 'siegel', w, h, svg: sv, luft: 1 }, art === 'quer' ? (b, k) => ({ ...ganz, ax: spalte.x0 + 26 * f + b.w * k / 2, ay: innen.y1 - b.h * k / 2 }) : ecke('ru'),
      art === 'quadrat' ? [0.85, 0.7, 0.6, 0.52] : [1, 0.85, 0.7, 0.6, 0.52], 30, art === 'quer' ? 0.5 : 0.75);
  };

  /* 4. Steckbrief des Titels mit dem größten Widerhall, auf einem mit Kreide aufgehellten Fleck. Quer: im Zwickel über dem Bogen
     rechts, halb in der Spalte (dort ist er ganz, bevor Tabula und Paar die Spalte nehmen) */
  const steckbrief = () => {
    if (!(daten && daten.steckbrief)) return;
    const S = daten.steckbrief, w = 168 * f, h = 104 * f, wl = 112 * f, wh = 22 * f, wy = 40 * f;
    let sv = `<path d="M${n2(2 * f)},${n2(6 * f)} L${n2(w * 0.4)},${n2(1 * f)} L${n2(w - 4 * f)},${n2(4 * f)} L${n2(w - 1 * f)},${n2(h * 0.5)} L${n2(w - 6 * f)},${n2(h - 2 * f)} L${n2(w * 0.55)},${n2(h)} L${n2(3 * f)},${n2(h - 5 * f)} L0,${n2(h * 0.45)} Z" fill="${hellPap}" fill-opacity="0.85" filter="url(#ps-kreide)"/>`;
    /* Titel bis 4 mm vor das Cover (tB); ist er einzeilig kleiner als 9 mm, zweizeilig (Unterkante über der Hüllkurve); der Zusatz steht
       daneben, wenn er passt, sonst als erste Kennzahl-Zeile (vorher lief ein langer Titel über das Cover und im Querformat vom Blatt) */
    const roh = titelText(S.titel), anf = (z) => z.map((l, i) => (i ? '' : '„') + l + (i === z.length - 1 ? '“' : ''));
    const tt = roh ? anf([roh])[0] : '', tB = w - 2 * 20 * f - 16 * f, zusatz = 'der Titel mit dem größten Widerhall';
    let fsT = Math.min(15 * f, 0.97 * tB / Math.max(1, em(tt))), tz = [tt];
    if (roh && fsT < 9 * f){ const z2r = zweiZeilen(roh, em).find(z => z.length === 2), z2 = z2r && anf(z2r); if (z2){ const f2 = Math.min(9 * f, 0.97 * tB / Math.max(...z2.map(em))); if (f2 > fsT){ tz = z2; fsT = f2; } } }
    const kt = roh ? hand(tz, 6 * f, tz.length > 1 ? 6 * f + fsT * 0.8 : 17 * f, fsT, { klecks: 0.1, zeilenabstand: 1.05, breite: tB }) : { svg: '', breite: 0 };
    const zusatzDaneben = !!roh && tz.length === 1 && 8 * f + kt.breite + 4.6 * f * em(zusatz) <= 6 * f + tB;
    sv += kt.svg + (zusatzDaneben ? hand(zusatz, 8 * f + kt.breite, 15 * f, 4.6 * f, { deck: 0.75, klecks: 0 }).svg : '');
    /* Hüllkurve: gespiegelt um die Mittellinie, innen senkrecht schraffiert; darüber die Gipfel, darunter Takte und Minuten */
    const Wv = S.welle && S.welle.length > 1 ? S.welle : null, dauer = S.dauer > 0 ? S.dauer : 0;
    if (Wv){ const mxw = Math.max(...Wv, 0.01), xs = (i) => 6 * f + wl * i / (Wv.length - 1), amp = (v) => wh / 2 * v / mxw;
      const ob = Wv.map((v, i) => `${n2(xs(i))},${n2(wy - amp(v))}`), un = Wv.map((v, i) => `${n2(xs(i))},${n2(wy + amp(v))}`).reverse();
      defs += `<clipPath id="ps-welle"><path d="M${ob.join(' L')} L${un.join(' L')} Z"/></clipPath>`;
      let schraff = ''; for (let x = 6 * f; x < 6 * f + wl; x += 0.9 * f) schraff += `M${n2(x)},${n2(wy - wh / 2)} L${n2(x + 0.5 * f)},${n2(wy + wh / 2)} `;
      sv += `<path d="${schraff}" ${strich(0.16, 0.6)} clip-path="url(#ps-welle)"/><path d="M${ob.join(' L')}" ${strich(0.3)}/><path d="M${un.join(' L')}" ${strich(0.3)}/>`
        + `<line x1="${n2(6 * f)}" y1="${n2(wy)}" x2="${n2(6 * f + wl)}" y2="${n2(wy)}" ${strich(0.18, 0.5)} stroke-dasharray="${n2(1.4 * f)} ${n2(1 * f)}"/>`; }
    const tx = (t) => 6 * f + wl * t / (dauer || 1);
    const ty = wy + wh / 2 + 4 * f;
    if (dauer){
      for (const t of (Wv ? S.gipfel || [] : []).filter(t => t >= 0 && t <= dauer).slice(0, 24)) sv += `<path d="M${n2(tx(t))},${n2(wy - wh / 2 - 1.5 * f)} l${n2(-0.9 * f)},${n2(-1.8 * f)} l${n2(1.8 * f)},0 Z" fill="${SEP}" fill-opacity="0.7"/>`;
      const takt = S.takte > 0 ? dauer / S.takte : 0;
      sv += `<line x1="${n2(6 * f)}" y1="${n2(ty)}" x2="${n2(6 * f + wl)}" y2="${n2(ty)}" ${strich(0.22, 0.7)}/>`;
      if (takt) for (let q = 0; q <= S.takte; q += 4) sv += `<line x1="${n2(tx(q * takt))}" y1="${n2(ty)}" x2="${n2(tx(q * takt))}" y2="${n2(ty + (q % 16 === 0 ? 2.2 : 1.1) * f)}" ${strich(0.16, 0.7)}/>`;
      for (let m = 0; m * 60 <= dauer; m++) sv += txt(tx(m * 60), ty + 6 * f, 3.2 * f, `${m}:00`, { anker: 'middle', deck: 0.7 });
      /* das Gipfelzeichen als Pfad vor „die Gipfel" (Pinyon hat ▾ nicht - schriftTauglich strich es) */
      const gipfelDa = !!(Wv && (S.gipfel || []).length), legende = [takt ? 'je Strich vier Takte' : '', gipfelDa ? 'die Gipfel' : ''].filter(Boolean).join(' · ');
      if (legende){ sv += txt(6 * f + wl, ty + 10.5 * f, 3 * f, legende, { anker: 'end', deck: 0.6 });
        if (gipfelDa){ const xg = 6 * f + wl - em('die Gipfel') * 3 * f - 1.4 * f; sv += `<path d="M${n2(xg - 0.9 * f)},${n2(ty + 8.4 * f)} l${n2(1.8 * f)},0 l${n2(-0.9 * f)},${n2(1.8 * f)} Z" fill="${SEP}" fill-opacity="0.6"/>`; } } }
    /* Kennzahlen und Refrain */
    const d = new Date(S.erstellt), datum = d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    const zeilenK = [zusatzDaneben ? '' : zusatz, `${anzahl(S.likes || 0, 'Herz', 'Herzen')} · ${anzahl(S.kommentare || 0, 'Stimme', 'Stimmen')} · ${S.plays === 1 ? 'einmal' : tausend(S.plays || 0) + ' mal'} gehört`,
      [dauer ? `${mmss(dauer)} lang` : '', S.bpm ? `${S.bpm} Schläge je Minute` : '', S.takte ? `${S.takte} Takte` : ''].filter(Boolean).join(' · '),
      isNaN(d) ? '' : `geschrieben am ${datum}`, (S.genre || []).map(x => x[0]).join(' · '), (S.instrumente || []).map(x => INSTR_DE[x[0]] || x[0]).join(' · ')].filter(Boolean);
    sv += hand(zeilenK, 6 * f, ty + 18 * f, 4.6 * f, { zeilenabstand: 1.3, klecks: 0 }).svg;
    if (E.refrains !== 'keine' && S.refrain && S.refrain.length){ const fr = Math.min(4.8 * f, 46 * f / Math.max(1, ...S.refrain.map(em)));
      sv += txt(w - 6 * f, 62 * f, 3.4 * f, 'der Refrain', { anker: 'end', deck: 0.65 }) + hand(S.refrain, w - 52 * f, 68 * f, fr, { zeilenabstand: 1.25, deck: 0.9 }).svg; }
    /* das Cover als Federzeichnung, rund gefasst */
    const cr = 20 * f, ccx = w - 6 * f - cr, ccy = 7 * f + cr;
    defs += `<clipPath id="ps-stcover"><circle cx="${n2(ccx)}" cy="${n2(ccy)}" r="${n2(cr)}"/></clipPath>`;
    const fu = feder && feder.get(S.id);
    sv += (fu ? `<image href="${esc(fu.url)}" data-voll="${esc(fu.url)}" x="${n2(ccx - cr)}" y="${n2(ccy - cr)}" width="${n2(2 * cr)}" height="${n2(2 * cr)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#ps-stcover)" filter="url(#ps-bt)"/>`
      : `<circle cx="${n2(ccx)}" cy="${n2(ccy)}" r="${n2(cr)}" fill="url(#ps-bt-schraff)"/>`)   /* noch keine Federzeichnung: schraffiert wie die Kacheln */
      + `<circle cx="${n2(ccx)}" cy="${n2(ccy)}" r="${n2(cr)}" ${strich(0.35)}/><circle cx="${n2(ccx)}" cy="${n2(ccy)}" r="${n2(cr + 1.6 * f)}" ${strich(0.18, 0.5)} stroke-dasharray="${n2(1 * f)} ${n2(1.2 * f)}"/>`;
    lege({ name: 'steckbrief', w, h, svg: sv, luft: 2 }, art === 'hoch' ? ecke('lu', 20, -10) : art === 'quer' ? ecke('ro') : ecke('ru', -90, 0), KERN);
  };

  /* 5. Tabula: die fünf meistgehörten Titel, römisch gezählt, mit Maßstrich nach den Hörzahlen */
  const tabula = () => {
    if (!(daten && daten.tabula && daten.tabula.length)) return;
    const T = daten.tabula, w = 112 * f, fs = 6.6 * f, zh = 11.5 * f, mx = Math.max(1, ...T.map(t => t.plays || 0));   /* lauter 0 Abrufe: leere Maßstriche statt NaN */
    const k1 = hand(T.length === 1 ? 'Tabula · der meistgehörte Titel' : `Tabula · die ${zahlwort(T.length)} meistgehörten`, 0, fs * 1.2, fs * 1.05);
    let sv = k1.svg;
    T.forEach((t, j) => { const y = k1.hoehe + 3 * f + j * zh + fs, tt = titelText(t.titel) || '(ohne lesbaren Titel)', fsT = Math.min(fs, 64 * f / Math.max(1, em(tt)));
      sv += roemischStriche(j + 1, 7 * f, y, fs * 0.62, SEP) + hand(tt, 9 * f, y, fsT, { klecks: 0 }).svg
        + txt(w, y, fs * 0.8, tausend(t.plays), { anker: 'end', deck: 0.8 })
        + `<path d="M${n2(9 * f)},${n2(y + 2.6 * f)} l${n2((w - 9 * f) * t.plays / mx)},${n2(-0.4 * f)}" ${strich(0.5, 0.55)}/>`
        + Array.from({ length: Math.round(12 * t.plays / mx) }, (_, q) => `<path d="M${n2(9 * f + q * (w - 9 * f) / 12)},${n2(y + 1.6 * f)} l${n2(1.6 * f)},${n2(2 * f)}" ${strich(0.25, 0.5)}/>`).join(''); });
    sv += txt(w, k1.hoehe + 3 * f + T.length * zh + 1.5 * f, 3.4 * f, 'mal gehört', { anker: 'end', deck: 0.6 });
    lege({ name: 'tabula', w, h: k1.hoehe + 6 * f + T.length * zh, svg: sv }, art === 'hoch' ? ecke('ro') : art === 'quer' ? bei(spMitte, innen.y0 + 150 * f, spalte) : ecke('ro', 0, 75), gross(KERN));
  };

  /* 6. Das Instrumentenpaar in der Spalte (Caspar_D, 08.10.2026: „die beiden instrumente so anordnen, das die resonanzkörper einmal
     oben und einmal unten sind und die Stiele nebeneinander"): das erste hohe Instrument aus den Daten steht, das Cello hängt kopfüber
     daneben (Widmung, aufrecht darüber); die Hälse laufen im Abstand von vier Einheiten nebeneinander. Der Flügel hat keinen Hals:
     das Cello hängt über ihm. Ohne hohes Instrument steht das Cello allein. Einheiten wie die Studien (STUDIE_MASS). */
  const arten = [...new Set(((daten && daten.instrumente) || []).map(x => STUDIE_VON[x[0]]).filter(Boolean))];
  const stehend = arten.find(a => HOCH.includes(a));
  const widmung = ctx.widmung != null ? ctx.widmung : widmungFuer(daten && daten.wuerdigung && daten.wuerdigung[0]);
  const paar = () => {
    const C = STUDIE_MASS.cello, kopfH = 10;                       /* Kopfzeilen der Widmung über dem hängenden Cello */
    let U, bau;
    if (!stehend){
      U = { w: C.w, h: C.h }; bau = (k) => studie('cello', 0, 0, C.h * k, f, { esc, widmung, widmungFs: Math.min(3, 0.96 * C.w / Math.max(1, em(widmung))) });
    } else {
      /* das Cello kopfüber: (u, v) -> (cx0 - u, cy0 - v); sein Korpus endet bei v = 38, die Achsenlinie reicht bis v = 113 */
      const S = STUDIE_MASS[stehend], hl = HALS[stehend], cy0 = kopfH + 113;
      let sx, sy, cx0;
      if (hl){ sx = 0; cx0 = hl.achse + hl.halb + 4 + 2.2 + 20; sy = cy0 - 38 + 3 - hl.kopf; }
      else { cx0 = Math.max(S.w, C.w) / 2 + 20; sx = (Math.max(S.w, C.w) - S.w) / 2; sy = cy0 + 3 + 2; }
      U = { w: Math.max(sx + S.w, cx0) + 1, h: sy + S.h };
      bau = (k) => studie(stehend, sx * k, sy * k, S.h * k, f, { esc })
        + `<g transform="translate(${n2(cx0 * k)} ${n2(cy0 * k)}) rotate(180)">${studie('cello', 0, 0, C.h * k, f, { esc, widmung: false })}</g>`
        + txt((cx0 - 20) * k, 4.6 * k, 4.4 * k, 'Violoncellum', { anker: 'middle', deck: 0.9 }) + txt((cx0 - 20) * k, 9 * k, Math.min(3, 0.96 * 2 * Math.min(cx0 - 20, U.w - (cx0 - 20)) / Math.max(1, em(widmung))) * k, widmung, { anker: 'middle', deck: 0.75 });   /* lange Namen: kleiner, nie über das Paar */
    }
    /* so hoch, wie die Spalte es erlaubt: hoch ⅝ der Höhe; quer ⅗ (die Spalte trägt darüber Steckbrief und Tabula, links unten das
       Siegel - das Paar steht rechts am Rand); im Quadrat die Hälfte (die Spalte ist dort kurz, Tabula und Würdigung brauchen sie auch) */
    const hh = Math.min(390 * f, ({ hoch: 0.62, quer: 0.6, quadrat: 0.5 })[art] * ih, (spalte.x1 - spalte.x0 - 26 * f) * 0.98 * U.h / U.w), k = hh / U.h;
    const blk = { name: 'studienpaar', w: U.w * k, h: hh, svg: bau(k) };
    lege(blk, art === 'quer' ? ecke('ru', 0, 0, spalte) : art === 'quadrat' ? bei(spalte.x0, (innen.y0 + innen.y1) / 2, spalte) : bei(spMitte, (innen.y0 + innen.y1) / 2 + 20 * f, spalte), [1, 0.92, 0.84, 0.76, 0.68, 0.6, 0.5, 0.42]);
  };
  /* die übrigen Instrumente der Daten (ohne die des Paars) mit einer Lupe auf ihr schönstes Detail; Breite samt Lupe und Titel */
  const weitere = arten.filter(a => a !== stehend && a !== 'cello');
  const studieMitLupe = (a) => {
    const M = STUDIE_MASS[a], hh = (({ drums: 64, synthesizer: 38, bass: 100, klavier: 88, gitarre: 96 })[a] || 90) * f, ww = hh / M.h * M.w, dt = DETAILS[a] && DETAILS[a][0], rr = Math.min(0.42 * hh, 20 * f);
    let sv = studie(a, 0, 0, hh, f, { esc }), w = ww, h = hh;
    if (dt){ const lx = ww + 5 * f + rr, ly = Math.min(hh / 2, hh - rr); sv += lupe(a, { x: lx, y: ly, r: rr }, dt, { x: 0, y: 0, hoehe: hh }, f, { esc }); w = lx + rr + 2 * f; h = Math.max(hh, ly + rr + 11 * f); }
    lege({ name: 'studie-' + a, w, h, svg: sv }, bei((innen.x0 + innen.x1) / 2, (innen.y0 + innen.y1) / 2), gross([1.15, 1, 0.9, 0.8, 0.7, 0.6, 0.52]));
  };

  /* 7. Würdigung: die fünf, die die längsten Kommentare hinterließen - Bildnisse als Federzeichnung im Medaillon */
  const wuerdigung = () => {
    if (!(daten && daten.wuerdigung && daten.wuerdigung.length)) return;
    const Wg = daten.wuerdigung, wer = Wg.length === 1 ? 'wer mir die längsten Worte schrieb' : `die ${zahlwort(Wg.length)} mit den längsten Worten an mich`, rr = 13 * f, sp = 30 * f, kopfFs = 5.4 * f, zh = 2 * rr + 12 * f;
    const name = anzeigeName;
    /* LANGE NAMEN zweizeilig statt winzig (Caspar_D: „was passiert bei langen Avatarnamen"): passt der Name einzeilig nur unter 3,4 mm,
       wird er geteilt - an Leerzeichen (zweiZeilen), sonst an Binnen-Großbuchstaben, Ziffern oder nach Bindestrichen („AdrenalineFueled /
       Faders", „Minimalistic- / AI-Sounds") -, wenn
       die Schrift so um mindestens 15 % wächst */
    const nameSatz = (nm) => {
      const b = sp - 2 * f, f1 = Math.min(4.2 * f, b / Math.max(1, em(nm)));
      if (f1 >= 3.4 * f) return { z: [nm], fs: f1 };
      let teile = zweiZeilen(nm, em).filter(z => z.length === 2);
      if (!teile.length){ const stellen = [...nm.matchAll(/(?<=[a-zäöüß])(?=[A-ZÄÖÜ0-9])|(?<=[A-Za-z])(?=\d)|(?<=-)(?=\S)/g)].map(m => m.index); teile = stellen.map(i => [nm.slice(0, i), nm.slice(i)]).filter(z => umbruchErlaubt(z, true)); }   /* auch nach Bindestrich: „Minimalistic- / AI-Sounds" */
      const best = teile.map(z => ({ z, fs: Math.min(4.2 * f, b / Math.max(...z.map(em))) })).sort((a, c) => c.fs - a.fs)[0];
      return best && best.fs > f1 * 1.15 ? best : { z: [nm], fs: f1 };
    };
    const saetze = Wg.map(p => nameSatz(name(p))), mehr = Math.max(0, ...saetze.map(n => (n.z.length - 1) * n.fs * 1.05)), zh2 = zh + mehr;
    /* drei Fassungen: alle in einer Reihe, drei über zwei, oder eine Säule (neben dem Paar in der kurzen Spalte des Quadrats) */
    const fassung = (proReihe, nr) => {
      const w = sp * proReihe, reihen = Math.ceil(Wg.length / proReihe);
      const k1 = proReihe > 1 ? hand(`Ispirazione · ${wer}`, 0, kopfFs, kopfFs, { breite: w })
        : (() => { const a = hand('Ispirazione', w / 2, kopfFs, kopfFs, { anker: 'middle', breite: w }), b = hand(ausgewogen(wer, 0.97 * w / (3.4 * f), em), w / 2, a.hoehe + 3.4 * f, 3.4 * f, { anker: 'middle', breite: w, deck: 0.8, klecks: 0 });
          return { svg: a.svg + b.svg, hoehe: a.hoehe + b.hoehe }; })();
      let sv = k1.svg; const y0 = k1.hoehe + 2 * f;
      Wg.forEach((p, j) => { const zeile = Math.floor(j / proReihe), n = Math.min(proReihe, Wg.length - zeile * proReihe), i = j - zeile * proReihe;
        const mx = sp * (i + (proReihe - n) / 2) + sp / 2, my = y0 + rr + zeile * zh2, id = `ps-wg${nr}-${j}`, nm = name(p), ns = saetze[j], unterName = (ns.z.length - 1) * ns.fs * 1.05;
        defs += `<clipPath id="${id}"><circle cx="${n2(mx)}" cy="${n2(my)}" r="${n2(rr)}"/></clipPath>`;
        const bn = ctx.bildnisse && p.avatar ? ctx.bildnisse.get(p.avatar) : null, href = bn && (bn.feder || bn.bild);
        sv += (href ? `<image href="${esc(href)}" data-voll="${esc(href)}" x="${n2(mx - rr)}" y="${n2(my - rr)}" width="${n2(2 * rr)}" height="${n2(2 * rr)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})" filter="url(#${bn.feder ? 'ps-bt-bildnis' : 'ps-bt-foto'})"/>`
          : `<circle cx="${n2(mx)}" cy="${n2(my)}" r="${n2(rr)}" fill="url(#ps-bt-schraff)"/>` + txt(mx, my + rr * 0.35, rr, ((nm.match(/[\p{L}\d]/u) || ['?'])[0]).toUpperCase(), { anker: 'middle', deck: 0.75 }))
          + `<circle cx="${n2(mx)}" cy="${n2(my)}" r="${n2(rr)}" ${strich(0.3)}/>` + hand(ns.z, mx, my + rr + 5.4 * f, ns.fs, { anker: 'middle', klecks: 0, zeilenabstand: 1.05 }).svg
          + txt(mx, my + rr + 9.6 * f + unterName, 3 * f, `${tausend(p.zeichen)} Zeichen`, { anker: 'middle', deck: 0.7 }); });
      /* der Hinweis in einer Zeile, in der Säule umbrochen */
      const hinweis = 'Bildnisse nur für den privaten Gebrauch – mit Dank an ihre Urheber', yh = y0 + (reihen - 1) * zh2 + 2 * rr + 15 * f + mehr;
      const kh = hand(hinweis, w / 2, yh, 2.6 * f, { anker: 'middle', breite: w, deck: 0.55, klecks: 0, zeilenabstand: 1.2 });
      sv += kh.svg;
      return { name: 'wuerdigung', w, h: yh + kh.hoehe, svg: sv };
    };
    const fassungen = [fassung(Wg.length, 0), fassung(3, 1), fassung(1, 2)];
    lege(fassungen, art === 'hoch' ? ecke('lo', 70, 40) : art === 'quer' ? bei(kv.x + kv.w * 0.62, innen.y0 + 20 * f) : bei(innen.x1, (innen.y0 + innen.y1) / 2, spalte), gross(KERN))
      || (art === 'quadrat' && lege(fassungen, bei(innen.x1, (innen.y0 + innen.y1) / 2), KERN));
  };

  /* 8. Legende: „Die vier Gegenden" mit Tintenstrich je Areal */
  const legendeSetzen = () => {
    if (!(E.legende && legende.length)) return;
    const n = legende.length, z = Math.min(n, 14), fs = 5.6 * f, zh = 7.6 * f, maxEm = Math.max(1, ...legende.slice(0, z).map(e => em(e.name)));
    const k1 = hand(n === 1 ? 'Die eine Gegend:' : `Die ${zahlwort(n)} Gegenden:`, 0, fs * 1.1, fs * 1.2);
    let sv = k1.svg;
    legende.slice(0, z).forEach((e, j) => { const y = k1.hoehe + 2 * f + j * zh + fs * 0.8, ink = tinte(e.farbe);
      sv += `<path d="M0,${n2(y - fs * 0.3)} q${n2(9 * f)},${n2(-0.8 * f)} ${n2(18 * f)},0" stroke="${ink}" stroke-width="${n2(1.2 * f)}" fill="none" stroke-linecap="round"/>`
        + hand(e.name, 23 * f, y, fs, { farbe: ink, klecks: 0 }).svg; });
    if (n > z) sv += txt(23 * f, k1.hoehe + 2 * f + z * zh + fs * 0.8, fs * 0.85, `und ${n - z} weitere`, { deck: 0.7 });
    lege({ name: 'legende', w: Math.max(k1.breite, 23 * f + maxEm * fs * 1.08), h: k1.hoehe + 4 * f + (z + (n > z ? 1 : 0)) * zh, svg: sv },
      art === 'hoch' ? bei(innen.x0 + 50 * f, innen.y1 - 30 * f) : art === 'quer' ? bei(kv.x + kv.w * 0.32, innen.y0 + 25 * f) : ecke('ro', -150, 0), gross(KERN));
  };

  /* 9. Randnotizen: die größten Zellen am Bogen, die Notiz so nah wie möglich, die Linie radial aus dem Kreis und dann waagerecht */
  const notizen = () => {
    const kk = kv.w / res.width, X = (x) => kv.x + x * kk, Y = (y) => kv.y + (res.height - y) * kk;
    const flaeche = (o) => { let a = 0; for (let i = 0; i < o.length; i++){ const p = o[i], q = o[(i + 1) % o.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a / 2); };
    const mitte = (o) => [o.reduce((a, p) => a + p[0], 0) / o.length, o.reduce((a, p) => a + p[1], 0) / o.length];
    const blaetter = res.leaves.filter(l => l.outline && l.outline.length > 2 && l.row != null && zeilen[l.row]).map(l => {
      const m = mitte(l.outline); return { z: zeilen[l.row], a: flaeche(l.outline), px: X(m[0]), py: Y(m[1]) }; })
      .filter(e => Math.hypot(e.px - cx, e.py - cy) > 0.6 * r).sort((a, b) => b.a - a.a).slice(0, 6);
    for (const e of blaetter){
      const th = Math.atan2(e.py - cy, e.px - cx), ex = cx + (r + 6 * f) * Math.cos(th), ey = cy + (r + 6 * f) * Math.sin(th);
      if (links ? ex < schnittX + 4 * f : ey > schnittY - 4 * f) continue;
      const areal = e.z[ebene] || e.z.gruppe || '', ink = tinte(arealFarbe(areal)), fs = 5.2 * f;
      const nt = titelText(e.z.titel || ''); if (!nt) continue;
      const zl = zweiZeilen(nt, em).find(z => Math.max(...z.map(em)) * fs < 52 * f) || [nt];
      const t1 = hand(zl, 0, fs * 0.9, fs, { farbe: ink, zeilenabstand: 1.1 }), fs2 = Math.min(3.8 * f, 52 * f / Math.max(1, em(areal)));
      const nb = { name: 'notiz', w: Math.max(t1.breite, em(areal) * fs2) + 2 * f, h: t1.hoehe + fs2 * 1.4, luft: 1.5 };
      nb.svg = t1.svg + txt(0, t1.hoehe + fs2 * 0.6, fs2, areal, { deck: 0.75 });
      const ax = cx + (r + ring + nb.w / 2 + 4 * f) * Math.cos(th), ay = cy + (r + ring + nb.h / 2 + 2 * f) * Math.sin(th);
      const p = lege(nb, { ax, ay, ...ganz, weit: 70 * f }, [1, 0.9]);
      if (!p) continue;
      const nx = p.x + p.w / 2 < ex ? p.x + p.w + 1 * f : p.x - 1 * f, ny = p.y + Math.min(p.h, 6 * f);
      s += `<path d="M${n2(e.px)},${n2(e.py)} L${n2(ex)},${n2(ey)} L${n2(nx)},${n2(ny)}" ${strich(0.28, 0.55)}/><circle cx="${n2(e.px)}" cy="${n2(e.py)}" r="${n2(0.9 * f)}" fill="${SEP}"/>`;
    }
  };

  /* 10. Refrains der drei mit den meisten Herzen bzw. der drei neuesten (Wahl „Refrains"), ohne den Titel des Steckbriefs */
  const refrainsSetzen = () => {
    for (const rf of (refrains || []).filter(x => !(daten && daten.steckbrief && x.titel === ohneKl(daten.steckbrief.titel)))){
      const fs = 5.6 * f, kopf = (titelText(rf.titel) ? `aus „${titelText(rf.titel)}“` : 'aus einem Lied') + (E.refrains === 'neueste' ? '' : ` · ${anzahl(rf.herzen, 'Herz', 'Herzen')}`), wmax = 92 * f, fsz = Math.min(fs, wmax / Math.max(1, ...rf.refrain.map(em)));
      const k1 = hand(kopf, 0, fs * 0.8, fs * 0.7, { deck: 0.65, klecks: 0 }), k2 = hand(rf.refrain, 0, k1.hoehe + fsz, fsz, { deck: 0.88, zeilenabstand: 1.18 });
      lege({ name: 'refrain', w: Math.max(k1.breite, k2.breite) + 2 * f, h: k1.hoehe + k2.hoehe + 2 * f, svg: k1.svg + k2.svg }, bei((innen.x0 + innen.x1) / 2, innen.y0 + 60 * f), gross([1, 0.88, 0.76]));
    }
  };

  /* 11. Diagramme wie in Leonardos Heften: Wachstum, Windrose der Stimmungen, Zifferblatt der Stunden, Getriebe der Gegenden */
  const diagramme = () => {
    if (!daten) return;
    const kopfD = (t, w) => hand(t, 0, 5 * f, 4.6 * f, { breite: w, klecks: 0 }), D = [1.3, 1.2, 1.1, 1, 0.9, 0.8, 0.7];
    if (daten.titelKurve && daten.titelKurve.length > 2){
      const K = daten.titelKurve, w = 84 * f, h = 54 * f, x0 = 8 * f, y0 = 12 * f, x1 = w - 4 * f, y1 = h - 8 * f, mx = K[K.length - 1][1];
      const px = (i) => x0 + (x1 - x0) * i / (K.length - 1), py = (v) => y1 - (y1 - y0) * v / mx, k1 = kopfD(`Crescita · ${mx} Titel in ${K.length} Monaten`, w);
      let sv = k1.svg + `<path d="M${n2(x0)},${n2(y0 - 2 * f)} L${n2(x0)},${n2(y1)} L${n2(x1 + 2 * f)},${n2(y1)}" ${strich(0.3)}/>`;
      const pf = K.map((k, i) => `${n2(px(i))},${n2(py(k[1]))}`);
      defs += `<clipPath id="ps-crescita"><path d="M${n2(x0)},${n2(y1)} L${pf.join(' L')} L${n2(x1)},${n2(y1)} Z"/></clipPath>`;
      let sch = ''; for (let x = x0; x < x1 + 30 * f; x += 1.4 * f) sch += `M${n2(x)},${n2(y1)} L${n2(x - 30 * f)},${n2(y0)} `;
      sv += `<path d="${sch}" ${strich(0.14, 0.45)} clip-path="url(#ps-crescita)"/><path d="M${pf.join(' L')}" ${strich(0.4)}/>` + K.map((k, i) => `<circle cx="${n2(px(i))}" cy="${n2(py(k[1]))}" r="${n2(0.6 * f)}" fill="${SEP}"/>`).join('');
      K.forEach((k, i) => { if (k[0].endsWith('-01') || i === 0) sv += txt(px(i), y1 + 4.6 * f, 3.2 * f, k[0].slice(0, 4), { anker: 'middle', deck: 0.75 }); });
      sv += txt(x1, py(mx) - 2 * f, 3.4 * f, String(mx), { anker: 'end', deck: 0.8 });
      lege({ name: 'crescita', w, h, svg: sv }, bei(innen.x0 + 40 * f, (innen.y0 + innen.y1) / 2), D);
    }
    if (daten.stimmung && daten.stimmung.length > 3){
      const St = daten.stimmung, w = 70 * f, h = 72 * f, mcx = w / 2, mcy = 40 * f, rr = 20 * f, mx = St[0][1], k1 = kopfD('Rosa dei venti · die Stimmungen', w);
      let sv = k1.svg + `<circle cx="${n2(mcx)}" cy="${n2(mcy)}" r="${n2(rr)}" ${strich(0.2, 0.5)} stroke-dasharray="${n2(1 * f)} ${n2(1 * f)}"/><circle cx="${n2(mcx)}" cy="${n2(mcy)}" r="${n2(rr / 2)}" ${strich(0.16, 0.4)}/>`;
      const pts = St.map(([n, v], i) => { const a = -Math.PI / 2 + 2 * Math.PI * i / St.length, l = rr * v / mx;
        sv += `<line x1="${n2(mcx)}" y1="${n2(mcy)}" x2="${n2(mcx + rr * 1.06 * Math.cos(a))}" y2="${n2(mcy + rr * 1.06 * Math.sin(a))}" ${strich(0.16, 0.5)}/>`
          + txt(mcx + (rr + 4 * f) * Math.cos(a), mcy + (rr + 4 * f) * Math.sin(a) + 1.2 * f, 3.4 * f, STIMMUNG_DE[n] || n, { anker: Math.abs(Math.cos(a)) < 0.3 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end', deck: 0.8 });
        return [mcx + l * Math.cos(a), mcy + l * Math.sin(a)]; });
      /* die Spitzen als Strahlen eines Sterns (je zwei Flanken zur halben Breite), wie eine Kompassrose */
      let stern = ''; pts.forEach(([x, y], i) => { const a = -Math.PI / 2 + 2 * Math.PI * (i + 0.5) / St.length, q = rr * 0.16;
        const [nx2, ny2] = pts[(i + 1) % pts.length]; stern += `M${n2(x)},${n2(y)} L${n2(mcx + q * Math.cos(a))},${n2(mcy + q * Math.sin(a))} L${n2(nx2)},${n2(ny2)} `; });
      sv += `<path d="${stern}" ${strich(0.32)}/>` + pts.map(([x, y]) => `<line x1="${n2(mcx)}" y1="${n2(mcy)}" x2="${n2(x)}" y2="${n2(y)}" ${strich(0.3, 0.8)}/>`).join('');
      lege({ name: 'rose', w, h, svg: sv }, bei(innen.x1 - w / 2, innen.y0 + 120 * f), D);
    }
    if (daten.stunden){
      const Su = daten.stunden, w = 62 * f, h = 72 * f, mcx = w / 2, mcy = 40 * f, r0 = 9 * f, r1 = 23 * f, mx = Math.max(...Su), k1 = kopfD('Le ore · wann die Lieder entstehen', w);
      let sv = k1.svg + `<circle cx="${n2(mcx)}" cy="${n2(mcy)}" r="${n2(r0)}" ${strich(0.25)}/><circle cx="${n2(mcx)}" cy="${n2(mcy)}" r="${n2(r1)}" ${strich(0.18, 0.45)}/>`;
      Su.forEach((v, hh) => { const a0 = -Math.PI / 2 + 2 * Math.PI * hh / 24, a1 = a0 + 2 * Math.PI / 24 * 0.8, l = r0 + (r1 - r0) * v / mx;
        sv += `<path d="M${n2(mcx + r0 * Math.cos(a0))},${n2(mcy + r0 * Math.sin(a0))} L${n2(mcx + l * Math.cos(a0))},${n2(mcy + l * Math.sin(a0))} A${n2(l)},${n2(l)} 0 0 1 ${n2(mcx + l * Math.cos(a1))},${n2(mcy + l * Math.sin(a1))} L${n2(mcx + r0 * Math.cos(a1))},${n2(mcy + r0 * Math.sin(a1))}" ${strich(0.24, 0.85)}/>`;
        if (hh % 6 === 0) sv += txt(mcx + (r1 + 3.6 * f) * Math.cos(a0), mcy + (r1 + 3.6 * f) * Math.sin(a0) + 1.2 * f, 3.4 * f, String(hh), { anker: 'middle', deck: 0.8 }); });
      const spitze = Su.indexOf(mx); sv += txt(mcx, mcy + 1.4 * f, 3.2 * f, `${spitze} Uhr`, { anker: 'middle', deck: 0.8 });
      lege({ name: 'ore', w, h, svg: sv }, bei(innen.x0 + w / 2, innen.y0 + 130 * f), D);
    }
    if (ctx.arealZahlen && ctx.arealZahlen.length > 1){
      /* Getriebe: je Gegend ein Zahnrad, Zähne nach der Zahl ihrer Titel, die Räder greifen ineinander (Abstand = Summe der Radien) */
      const A = ctx.arealZahlen.slice(0, 6), mxn = Math.max(...A.map(a => a.n)), rad = A.map(a => (5 + 9 * Math.sqrt(a.n / mxn)) * f);
      const pos = []; let x = rad[0] + 2 * f, y = 0, dir = 1;
      A.forEach((a, i) => { if (i){ const d = rad[i - 1] + rad[i] + 0.6 * f, ang = dir * 0.42; x += d * Math.cos(ang); y += d * Math.sin(ang); dir = -dir; } pos.push([x, y]); });
      const minY = Math.min(...pos.map((p, i) => p[1] - rad[i])), maxY = Math.max(...pos.map((p, i) => p[1] + rad[i])), w = Math.max(...pos.map((p, i) => p[0] + rad[i])) + 4 * f;
      const k1 = kopfD('Ingranaggi · die Gegenden greifen ineinander', Math.max(w, 70 * f)), oy = k1.hoehe + 3 * f - minY;
      let sv = k1.svg;
      A.forEach((a, i) => { const [gx, gy0] = pos[i], gy = gy0 + oy, rr = rad[i], z = Math.max(8, Math.round(6 + 20 * a.n / mxn)), ink = tinte(a.farbe), ri = rr - 1.6 * f;
        let d = ''; for (let q = 0; q < z; q++){ const a0 = 2 * Math.PI * q / z + (i % 2 ? Math.PI / z : 0), da = 2 * Math.PI / z;
          const pp = [[ri, a0], [rr, a0 + da * 0.15], [rr, a0 + da * 0.45], [ri, a0 + da * 0.6]].map(([l, w2]) => `${n2(gx + l * Math.cos(w2))},${n2(gy + l * Math.sin(w2))}`);
          d += (q ? 'L' : 'M') + pp.join(' L') + ' '; }
        sv += `<path d="${d}Z" fill="none" stroke="${ink}" stroke-width="${n2(0.32 * f)}" stroke-linejoin="round"/><circle cx="${n2(gx)}" cy="${n2(gy)}" r="${n2(ri * 0.55)}" fill="none" stroke="${ink}" stroke-width="${n2(0.2 * f)}"/>`
          + `<circle cx="${n2(gx)}" cy="${n2(gy)}" r="${n2(1 * f)}" fill="${ink}"/>`
          + txt(gx, gy + rr + 4 * f, Math.min(3.4 * f, 2.6 * rr / Math.max(1, em(a.name))), a.name, { anker: 'middle', farbe: ink, deck: 0.9 })
          + txt(gx, gy - ri * 0.55 - 1 * f, 2.6 * f, String(a.n), { anker: 'middle', deck: 0.7 }); });
      lege({ name: 'getriebe', w: Math.max(w, 70 * f), h: oy + maxY + 6 * f, svg: sv }, bei(innen.x1 - 50 * f, innen.y1 - 150 * f), D);
    }
  };

  /* REIHENFOLGE = RANG (nach dem Kopf). Hochformat: Siegel, Tabula, Steckbrief, Paar, Würdigung (50 × 70 trägt so seit dem Entwurf);
     quer: der Steckbrief nimmt zuerst den Zwickel über dem Bogen, darunter die Tabula, dann das Paar rechts am Rand und das Siegel
     links daneben, Legende und Würdigung in den Streifen oben; im Quadrat Siegel, Tabula unter dem Kopf, dazwischen in der Spalte das
     Paar, der Steckbrief im Zwickel neben dem Siegel (vor der Würdigung: ohne Klangdaten oder mit nur zwei Kommentierenden nahm sie ihm
     sonst den Zwickel - Fallensuche 1.0.62), die Würdigung als Säule neben dem Paar oder wo sonst Platz ist */
  if (art === 'hoch'){ siegel(); tabula(); steckbrief(); paar(); wuerdigung(); notizen(); legendeSetzen(); }
  else if (art === 'quer'){ steckbrief(); tabula(); paar(); siegel(); legendeSetzen(); wuerdigung(); notizen(); }
  else { siegel(); tabula(); paar(); steckbrief(); wuerdigung(); legendeSetzen(); notizen(); }
  refrainsSetzen();
  if (weitere[0]) studieMitLupe(weitere[0]);
  diagramme();
  for (const a of weitere.slice(1)) studieMitLupe(a);
  /* 12. Leonardos Notenrätsel */
  { const rb = 110 * f; lege({ name: 'raetsel', w: rb, h: 26 * rb / 110, svg: notenraetsel(rb, f, SEP, SCHRIFT) }, bei((innen.x0 + innen.x1) / 2, innen.y1 - 40 * f), [1, 0.85, 0.7]); }

  /* 13. „Dal KlangTresor di Caspar_D" in Spiegelschrift - gut sichtbar, ein Mal */
  const profilName = daten && daten.profil ? anzeigeName(daten.profil) : '';
  if (profilName){ const t = `Dal KlangTresor di ${profilName}`, fs = 7 * f, k = hand(t, 0, fs, fs, { spiegel: true, deck: 0.85 });
    lege({ name: 'dal', w: k.breite + 2 * f, h: k.hoehe + 2 * f, svg: k.svg }, bei(innen.x0 + 80 * f, innen.y1 - 12 * f), [1, 0.85, 0.7]); }

  /* 14. Füllen: größte Lücke zuerst - Coverfetzen (Federzeichnungen der meistgehörten) in große, Spiegelschrift in die übrigen */
  const fetzenIds = [...new Set([...(daten && daten.tabula || []).map(t => t.id), ...zeilen.slice().sort((a, b) => (b.wert || 0) - (a.wert || 0)).map(z => z.id)])].filter(id => feder && feder.get(id)).slice(0, 8);
  const frag = (daten && daten.fragmente) || [], prof = daten && daten.profil;
  /* die Profilbeschreibung (manche schreiben dort sehr lang - Caspar_D: „Manche haben auch einen elend langen Suno-Text"): nur die
     ersten Sätze bis etwa 220 Zeichen, der Füller kürzt ohnehin auf seine Lücke */
  const beschreibung = (() => { const t = rein(prof && prof.beschreibung); if (t.length <= 220) return t; const m = t.slice(0, 221).match(/^.*[.!?…](?=\s)/); return m && m[0].length > 60 ? m[0] : t.slice(0, 220).replace(/\s+\S*$/, '') + ' …'; })();
  const spiegelTexte = [...(prof ? [[`${prof.titel} ${prof.titel === 1 ? 'canzone' : 'canzoni'}`, `${tausend(prof.plays)} ${prof.plays === 1 ? 'ascolto' : 'ascolti'}`, `${tausend(prof.herzen)} ${prof.herzen === 1 ? 'cuore' : 'cuori'}`, prof.folger ? (prof.folger === 1 ? '1 amico che ascolta' : `${prof.folger} amici che ascoltano`) : ''].filter(Boolean).join(' · '), beschreibung].filter(Boolean) : []), ...frag];
  let fi = 0, ti = 0, rnd = 13; const zz = () => (rnd = (Math.imul(rnd, 1103515245) + 12345) >>> 0) / 4294967296;
  for (let runde = 0, klein = 0; runde < 160 && klein < 6; runde++){
    const L = R.luecke(innen.x0 - 6 * f, innen.y0 - 4 * f, innen.x1 + 6 * f, innen.y1 + 4 * f);
    if (!L) break;
    /* zu schmal oder zu klein: abhaken und weiter (vorher brach ein 3 mm breiter Streifen am Rand das Füllen ab) */
    if (Math.max(L.w, L.h) < 16 * f || Math.min(L.w, L.h) < 6.5 * f){ R.belegen(L.x, L.y, L.x + L.w, L.y + L.h); if (L.w * L.h < 220 * f * f) klein++; continue; }
    klein = 0;
    const luft = 1.5 * f, x = L.x + luft, y = L.y + luft, w = Math.min(L.w - 2 * luft, 120 * f), h = Math.min(L.h - 2 * luft, 90 * f);
    const hochSchmal = h > 2.2 * w && w < 22 * f && h >= 60 * f;
    /* Luft lassen: kleine Lücken bleiben frei - Leonardo schrieb Absätze, keine Schnipsel */
    if (!hochSchmal && (w < 34 * f || h < 11 * f) && !(w >= 32 * f && h >= 32 * f)){ R.belegen(L.x, L.y, L.x + L.w, L.y + L.h); if (L.w * L.h < 600 * f * f) klein++; continue; }
    if (fi < fetzenIds.length && w >= 32 * f && h >= 32 * f && (zz() < 0.5 || w < 40 * f)){
      const gr = Math.min(w, h, 56 * f), id = fetzenIds[fi++], fx = x + (w - gr) / 2, fy = y + (h - gr) / 2, cid = 'ps-fetzen' + fi;
      /* gerissener Rand: ein Vieleck mit gezackten Kanten */
      const ecken = [[0.06, 0.02], [0.94, 0.08], [0.98, 0.9], [0.1, 0.97]].map(([u, v]) => [u + 0.08 * (zz() - 0.5), v + 0.08 * (zz() - 0.5)]);
      let d = ''; ecken.forEach((p, i) => { const q = ecken[(i + 1) % 4]; for (let t = 0; t < 1; t += 0.08){ const u = p[0] + (q[0] - p[0]) * t, v = p[1] + (q[1] - p[1]) * t;
        d += (d ? 'L' : 'M') + n2(fx + gr * (u + 0.018 * (zz() - 0.5))) + ',' + n2(fy + gr * (v + 0.018 * (zz() - 0.5))) + ' '; } });
      defs += `<clipPath id="${cid}"><path d="${d}Z"/></clipPath>`;
      s += `<g data-block="fetzen" transform="rotate(${((zz() - 0.5) * 14).toFixed(1)} ${n2(fx + gr / 2)} ${n2(fy + gr / 2)})" opacity="0.72"><image href="${esc(feder.get(id).url)}" data-voll="${esc(feder.get(id).url)}" x="${n2(fx)}" y="${n2(fy)}" width="${n2(gr)}" height="${n2(gr)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${cid})" filter="url(#ps-bt)"/>`
        + `<path d="${d}Z" ${strich(0.2, 0.5)}/></g>`;
      R.belegen(fx - luft, fy - luft, fx + gr + luft, fy + gr + luft);
    } else if (spiegelTexte.length){
      const t = spiegelTexte[ti++ % spiegelTexte.length];
      if (hochSchmal){
        /* hoch und schmal (der Seitenrand): eine Zeile die Kante entlang, von unten nach oben */
        /* nur eine Zeile (mit breite bricht handschrift um, die zweite Zeile lag gedreht neben der Lücke); gezeichnet wird, was gemessen ist */
        const fs = Math.min(6 * f, w * 0.62), k0 = hand(t, 0, 0, fs, { spiegel: true, deck: 0.6, breite: h, klecks: 0 });
        const k = k0.zeilen.length > 1 ? hand([k0.zeilen[0].text], 0, 0, fs, { spiegel: true, deck: 0.6, breite: h, klecks: 0 }) : k0, lang = Math.min(k.breite, h);
        const bx = x + w / 2 + fs * 0.3, by = y + h / 2 + lang / 2;
        s += `<g data-block="randzeile" transform="translate(${n2(bx)} ${n2(by)}) rotate(-90)">${k.svg}</g>`;
        R.belegen(L.x, by - lang - luft, L.x + L.w, by + luft);
      } else {
        /* ein Absatz, der die Lücke füllt: so viele Bruchstücke aneinander, bis die Zeilen reichen */
        const fs = Math.max(3.6 * f, Math.min(5.6 * f, h / 3.4)), zeilenN = Math.max(1, Math.floor((h - fs * 0.4) / (fs * 1.3))), noetig = zeilenN * w / (fs * 0.4);
        let absatz = t; while (absatz.length < noetig && spiegelTexte.length > 1) absatz += '   ' + spiegelTexte[ti++ % spiegelTexte.length];
        let k = hand(absatz, x, y + fs, fs, { spiegel: true, breite: w, deck: 0.62, zeilenabstand: 1.3, klecks: 0.02 });
        /* zu lang: die Wörter am Ende weg, bis die Zeilen passen */
        for (let n = 0; n < 12 && k.zeilen.length > zeilenN; n++){ const wz = absatz.split(' '); absatz = wz.slice(0, Math.max(3, Math.floor(wz.length * zeilenN / k.zeilen.length) - 1)).join(' ');
          k = hand(absatz, x, y + fs, fs, { spiegel: true, breite: w, deck: 0.62, zeilenabstand: 1.3, klecks: 0.02 }); }
        if (k.hoehe > h * 1.15){ R.belegen(L.x, L.y, L.x + L.w, L.y + L.h); continue; }
        s += `<g data-block="absatz">${k.svg}</g>`; R.belegen(L.x, L.y, L.x + Math.min(L.w, k.breite + 2 * luft), L.y + Math.min(L.h, k.hoehe + luft + fs * 0.3));
      }
    } else break;
  }
  ctx.voll = R.anteil(innen.x0, innen.y0, innen.x1, innen.y1);
  return `<defs>${defs}</defs>` + s;
}

/* DER GRUND für das volle Blatt: Randlinie an der Schnittseite, Zirkelkonstruktion nur diesseits des Schnitts (was jenseits liegt,
   taucht nirgends auf), und ein PALIMPSEST: von der Rückseite scheint ältere Schrift durch - Leonardos Spiegelschrift, durchs Papier
   gesehen, liest sich richtig herum. */
export function blattGrund(ctx){
  const { g, SEP, SCHRIFT, daten, B } = ctx, f = g.kurz / 500, { cx, cy, r, schnitt } = g.kreis, kv = g.karte, links = schnitt === 'links';
  const kon = (o) => `stroke="${SEP}" stroke-opacity="${o}" stroke-width="${n2(0.25 * f)}" fill="none"`;
  let s = `<defs><clipPath id="ps-diesseits"><rect x="${n2(links ? kv.x : 0)}" y="0" width="${n2(links ? g.PW - kv.x : g.PW)}" height="${n2(links ? g.PH : kv.y + kv.h)}"/></clipPath>`
    + `<filter id="ps-durch" x="0" y="0" width="100%" height="100%"><feGaussianBlur stdDeviation="${n2(0.45 * f)}"/></filter><clipPath id="ps-blattflaeche"><rect width="${n2(g.PW)}" height="${n2(g.PH)}"/></clipPath></defs>`;
  /* Palimpsest: Zeilen über das ganze Blatt, sehr blass, leicht schräg, unscharf - auf die Blattfläche beschnitten */
  const frag = ((daten && daten.fragmente) || []).map(schriftTauglich).filter(Boolean);
  if (frag.length){ let t = ''; const fs = 9 * f, zh = 15 * f; let k = 0;
    for (let y = B + 30 * f; y < g.PH - 20 * f; y += zh * (1 + 0.25 * Math.sin(y))) { const zeile = [frag[k++ % frag.length], frag[k++ % frag.length]].join('   ');
      t += `<text x="${n2(B + 14 * f + 18 * f * Math.sin(y * 0.7))}" y="${n2(y)}" font-size="${n2(fs)}" transform="rotate(-2.2 ${n2(g.PW / 2)} ${n2(y)})">${esc(zeile)}</text>`; }
    s += `<g class="ps-palimpsest" clip-path="url(#ps-blattflaeche)"><g fill="${SEP}" fill-opacity="0.06" font-family="${SCHRIFT}" filter="url(#ps-durch)">${t}</g></g>`; }
  /* Kreidetünche unter dem ganzen Kreis (Caspar_D: „den ganzen kreis weiss aufhellen, nicht clusterweise"), eingerieben wie die Kreide
     auf dem Pergament (Bimsstein, dann Kreide oder Kalk): bis zum Rand des Schaums geschlossen, dann ein weicher Auslauf über 10 mm,
     nach außen mit zunehmendem Korn („und sollte man die Fleckbegrenzung dann eher unscharf machen" – ja: eingeriebene Kreide hat
     keine Kante); an der Schnittlinie glatt abgeschnitten. Die Kacheln malen ihr Weiß in derselben Farbe (druck.skizze.papier). */
  if (ctx.kreide){
    const ra = r + 10 * f;
    s += `<defs><radialGradient id="ps-kreideauslauf" gradientUnits="userSpaceOnUse" cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(ra)}"><stop offset="${(r / ra).toFixed(4)}" stop-color="#fff"/><stop offset="${((r + 4 * f) / ra).toFixed(4)}" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`
      + `<filter id="ps-kreidekorn" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${n2(0.8 / f)}" numOctaves="2" seed="9" result="k"/><feColorMatrix in="k" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 2.4 -0.6" result="korn"/><feComposite in="SourceGraphic" in2="korn" operator="arithmetic" k1="0.6" k2="0.55" k3="0" k4="0"/></filter>`
      + `<mask id="ps-kreidemaske" maskUnits="userSpaceOnUse" x="0" y="0" width="${n2(g.PW)}" height="${n2(g.PH)}"><circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(ra)}" fill="url(#ps-kreideauslauf)" filter="url(#ps-kreidekorn)"/><circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(r + 0.5 * f)}" fill="#fff"/></mask></defs>`
      + `<g clip-path="url(#ps-diesseits)"><rect width="${n2(g.PW)}" height="${n2(g.PH)}" fill="${ctx.kreide}" fill-opacity="0.94" mask="url(#ps-kreidemaske)"/></g>`;
  }
  /* Randlinie an der Schnittseite (über die ganze Höhe bzw. Breite), doppelt wie eine gezogene Heftlinie */
  s += links ? `<line x1="${n2(kv.x)}" y1="${n2(B + 6 * f)}" x2="${n2(kv.x)}" y2="${n2(g.PH - B - 6 * f)}" ${kon(0.55)}/><line x1="${n2(kv.x - 1.6 * f)}" y1="${n2(B + 6 * f)}" x2="${n2(kv.x - 1.6 * f)}" y2="${n2(g.PH - B - 6 * f)}" ${kon(0.3)}/>`
    : `<line x1="${n2(B + 6 * f)}" y1="${n2(kv.y + kv.h)}" x2="${n2(g.PW - B - 6 * f)}" y2="${n2(kv.y + kv.h)}" ${kon(0.55)}/><line x1="${n2(B + 6 * f)}" y1="${n2(kv.y + kv.h + 1.6 * f)}" x2="${n2(g.PW - B - 6 * f)}" y2="${n2(kv.y + kv.h + 1.6 * f)}" ${kon(0.3)}/>`;
  /* Konstruktion: ein Zirkelkreis (r + 4), Achsen, 24 Marken - abgeschnitten an der Randlinie */
  let k = `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(r + 4 * f)}" ${kon(0.45)}/>`
    + `<line x1="${n2(cx - r - 24 * f)}" y1="${n2(cy)}" x2="${n2(cx + r + 24 * f)}" y2="${n2(cy)}" ${kon(0.4)}/><line x1="${n2(cx)}" y1="${n2(cy - r - 24 * f)}" x2="${n2(cx)}" y2="${n2(cy + r + 24 * f)}" ${kon(0.4)}/>`;
  for (let i = 0; i < 24; i++){ const a = 2 * Math.PI * i / 24, r0 = r + 4 * f, r1 = r + (i % 6 === 0 ? 8.5 : 6.5) * f;
    k += `<line x1="${n2(cx + r0 * Math.cos(a))}" y1="${n2(cy + r0 * Math.sin(a))}" x2="${n2(cx + r1 * Math.cos(a))}" y2="${n2(cy + r1 * Math.sin(a))}" ${kon(0.45)}/>`; }
  s += `<g clip-path="url(#ps-diesseits)">${k}</g>`;
  return s;
}

/* DER AUFTRAG für den angeschnittenen Kreis (Schaum-Einheiten, y nach oben, Umriss gegen den Uhrzeigersinn). links: Schnitt bei x = 0,
   Mitte bei R/2, Bogen −120°…120°; unten: Schnitt bei y = 0, Mitte bei R/2, Bogen −30°…210°. Die Saaten werden in die D-Form
   gestaucht (Reihenfolge bleibt), nicht in einen Kreis gelegt und gespiegelt. */
export function dAuftrag(j, schnitt){
  const W = j.W, H = j.H, n = 180, e = 0.3;
  let R, cx, cy, a0, a1;
  if (schnitt === 'links'){ R = Math.min(H / 2, (W - 2 * e) / 1.5) - e; cx = e + R / 2; cy = H / 2; a0 = -120; a1 = 120; }
  else { R = Math.min(W / 2, (H - 2 * e) / 1.5) - e; cx = W / 2; cy = e + R / 2; a0 = -30; a1 = 210; }
  const outline = Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
  let seeds = null;
  if (j.seeds){ seeds = {};
    for (const [k, p] of Object.entries(j.seeds)){ const u = Math.max(0, Math.min(1, p[0] / W)), v = Math.max(0, Math.min(1, p[1] / H));
      if (schnitt === 'links'){ const y = cy + 0.94 * R * (2 * v - 1), xr = cx + Math.sqrt(Math.max(0, R * R - (y - cy) ** 2)); seeds[k] = [e + (xr - e) * (0.03 + 0.94 * u), y]; }
      else { const x = cx + 0.94 * R * (2 * u - 1), yt = cy + Math.sqrt(Math.max(0, R * R - (x - cx) ** 2)); seeds[k] = [x, e + (yt - e) * (0.03 + 0.94 * v)]; } } }
  return { ...j, outline, seeds, lage: j.lage + '|d' + schnitt };
}
