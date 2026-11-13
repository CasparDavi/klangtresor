// Russisch: Wortbetonung, Silben, Kleinwörter (Jörg, 12./13.11.2026: Russisch als dritte Textsprache, für Henry und andere).
// Russische Betonung ist frei und beweglich (ру́ки / руки́) und steht nicht im Schriftbild; die Silbenzahl dagegen ist exakt die
// Zahl der Vokalbuchstaben. Quelle der Betonung: daten/ru/betonung-ru.tsv (bin/betonung-ru-bauen.mjs) – alle Formen aus dem
// Wiktionary (en + ru, CC BY-SA 4.0), ~3 Mio. Formen. Die Datei wird nicht als Map geladen, sondern als Puffer mit
// Zeilenanfängen gehalten und binär durchsucht (Byte-Reihenfolge, so gebaut).
// Reihenfolge: eigene Zeichen im Text (Akut, großer Vokal, +) → Wörterbuch → ё für е → Bindestrich-Teile → Endungsmodell.
import fs from 'node:fs';
import { daten, eigeneDaten, korrekturen } from './pfade.mjs';

// Russische Daten sind selbst gebaut (bin/betonung-ru-bauen.mjs) und liegen in den eigenen Daten der KlangFeder
// (<KlangFeder>/daten/ru); die gemeinsame Wörterbuch-Kopie mit dem KlangTresor (daten(), kern/daten.json) hat sie (noch)
// nicht. Erst eigene Daten, dann die gemeinsame Kopie. Fehlen beide, rechnet der Kern mit dem Endungsmodell.
const ruDatei = d => { const a = eigeneDaten(d); if (fs.existsSync(a)) return a; return daten(d); };

export const VOKALE = 'аеёиоуыэюя';
const AKUT = '́', GRAVIS = '̀';
export const istVokal = c => VOKALE.includes(c);
export const vokalzahl = w => [...w.toLowerCase()].filter(istVokal).length;

// ---------- Wörterbuch ----------
let PUFFER = null, ANFANG = null;
function laden() {
  if (PUFFER) return;
  try { PUFFER = fs.readFileSync(ruDatei('ru/betonung-ru.tsv')); } catch { PUFFER = Buffer.alloc(0); }
  const a = []; let i = 0;
  while (i < PUFFER.length) {
    const nl = PUFFER.indexOf(10, i), ende = nl < 0 ? PUFFER.length : nl;
    if (PUFFER[i] !== 35 && ende > i) a.push(i);   // '#' = Kopfzeile
    i = ende + 1;
  }
  ANFANG = Uint32Array.from(a);
}
export function lexikonRuDa() { laden(); return ANFANG.length > 0; }
// Rohzeile zu einer Form (klein, ё ausgeschrieben) oder null
function zeile(form) {
  laden();
  const k = Buffer.from(form);
  let lo = 0, hi = ANFANG.length - 1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1, s = ANFANG[m], tab = PUFFER.indexOf(9, s);
    const c = Buffer.compare(PUFFER.subarray(s, tab), k);
    if (c === 0) { const nl = PUFFER.indexOf(10, tab); return PUFFER.toString('utf8', tab + 1, nl < 0 ? PUFFER.length : nl); }
    if (c < 0) lo = m + 1; else hi = m - 1;
  }
  return null;
}
// Eintrag: { varianten: [{ haupt, neben: [], n }], name }
const KORR = new Map();
let KORR_GELADEN = false;
function korr() {
  if (!KORR_GELADEN) { KORR_GELADEN = true; for (const [w, b] of korrekturen('korrekturen-ru.tsv')) KORR.set(w.toLowerCase(), b); }
  return KORR;
}
const CACHE = new Map();
export function eintragRu(form) {
  if (CACHE.has(form)) return CACHE.get(form);
  const k = korr().get(form);
  const roh = k ? k : zeile(form);
  let e = null;
  if (roh) {
    const [v, flag] = roh.split('\t');
    e = { varianten: v.split(',').map(x => { const [mu, n] = x.split(':'); const [h, ...nb] = mu.split('+').map(Number); return { haupt: h, neben: nb, n: n ? +n : 1 }; }), name: flag === 'N', quelle: k ? 'korrektur' : 'lexikon' };
  }
  if (CACHE.size > 50000) CACHE.clear();
  CACHE.set(form, e);
  return e;
}

// Häufigkeit (FrequencyWords ru_50k, OpenSubtitles 2018, CC BY-SA 4.0): Rang und Zahl je Form – für е/ё und die Reimsuche
let HF = null;
export function haeufigkeitRu() {
  if (HF) return HF;
  HF = new Map();
  try { fs.readFileSync(ruDatei('ru/haeufigkeit-ru-50k.txt'), 'utf8').split('\n').forEach((z, i) => { const [w, n] = z.split(' '); if (w && !HF.has(w)) HF.set(w, { rang: i + 1, n: +n }); }); } catch {}
  return HF;
}

// ---------- Kleinwörter ----------
// u = immer unbetont (Präpositionen, Konjunktionen, Partikeln – sie lehnen sich an das Nachbarwort an, Proklitika/Enklitika)
// b = betonbar (Pronomen, Hilfsverb быть, Negationswörter, kurze Adverbien – im Vers mal Hebung, mal Senkung)
// Mehrsilbige Funktionswörter (между, через, чтобы, если …) behalten ihre Wortbetonung, aber nur als Nebenton:
// im Vers stehen sie oft in der Senkung (RIFMA markiert „между“, „среди“ meist nicht).
const setze = s => new Set(s.split(/\s+/).filter(Boolean));
const U = setze(`в во на за по под подо над надо от ото до из изо к ко с со у о об обо при про без безо для меж
и а но да или ни не же ж ли ль бы б то ка де мол-де`);
const B = setze(`я ты он она оно мы вы они мой твой свой наш ваш их его её ее ей ему им ими нам вам нас вас мне тебе себе
меня тебя себя мной тобой собой мною тобою собою тот та те то тех тем этот эта это эти что как где там тут так вот кто чей сам
сама само сами весь вся всё все был была было были быть есть нет уж уже ещё еще лишь вдруг чуть здесь
когда тогда куда туда сюда откуда пока ведь даже хоть хотя чтоб чтобы если будто словно точно разве неужели вот-вот`);
const POLY_SCHWACH = setze(`между через перед передо около вокруг среди сквозь вдоль кроме после против ради возле мимо
чтобы если хотя когда тогда пока будто словно точно разве ведь даже или либо также тоже потому поэтому зато однако`);
export function klasseEinsilberRu(wort) {
  const w = wort.toLowerCase().replace(/[̀́+]/g, '');
  return U.has(w) ? 'u' : B.has(w) ? 'b' : 'c';
}
export const funktionswortRu = w => POLY_SCHWACH.has(w);

// ---------- Endungsmodell für Unbekanntes (nur aus dem Wiktionary gelernt, bin/betonung-ru-bauen.mjs) ----------
let ENDUNG = undefined;
function endungsmodell() {
  if (ENDUNG !== undefined) return ENDUNG;
  ENDUNG = null;
  try {
    const m = new Map();
    for (const z of fs.readFileSync(new URL('./betonung-endungen-ru.tsv', import.meta.url), 'utf8').split('\n')) {
      if (!z || z[0] === '#') continue;
      const [e, n, abEnde] = z.split('\t'); m.set(e + '|' + n, +abEnde);
    }
    ENDUNG = m;
  } catch {}
  return ENDUNG;
}
function regelRu(w) {
  const n = vokalzahl(w); if (n <= 1) return n ? 0 : -1;
  const yo = [...w].filter(istVokal).indexOf('ё'); if (yo >= 0) return yo;   // ё ist (fast) immer betont
  const m = endungsmodell();
  if (m) for (let l = Math.min(7, w.length - 1); l >= 2; l--) {
    const e = w.slice(-l), a = m.get(e + '|' + Math.min(n, 6));
    if (a != null && a < n) return n - 1 - a;
  }
  return Math.max(0, n - 2);   // Notregel: vorletzte Silbe
}

// ---------- Zeichen des Schreibers ----------
// Wer die Betonung selbst setzt, hat recht: Akut (за́мок), großer Vokal in einem sonst klein geschriebenen Wort (замОк – so
// schreiben viele für Suno), Plus vor dem Vokal (зам+ок – Schreibweise der Sprachausgabe). → Vokalindex oder null
export function eigeneBetonung(roh) {
  const z = [...roh.normalize('NFC').replace(/ѐ/g, 'е' + GRAVIS).replace(/ѝ/g, 'и' + GRAVIS)];
  let v = -1, akut = -1, plus = -1, gross = [];
  for (let i = 0; i < z.length; i++) {
    const c = z[i], k = c.toLowerCase();
    if (istVokal(k)) { v++; if (c !== k && i > 0) gross.push(v); if (z[i - 1] === '+') plus = v; }
    else if (c === AKUT && v >= 0) akut = v;
  }
  if (akut >= 0) return akut;
  if (plus >= 0) return plus;
  // großer Vokal nur, wenn das Wort sonst klein ist (nicht ВСЁ ГРОМКО, nicht am Wortanfang)
  const buchst = z.filter(c => /\p{L}/u.test(c)), grossBuchst = buchst.filter((c, i) => i > 0 && c !== c.toLowerCase());
  if (gross.length === 1 && grossBuchst.length === 1) return gross[0];
  return null;
}
// Text-Wort → Schlüssel: klein, ohne Zeichen, ohne +
export const schluesselRu = roh => roh.normalize('NFC').replace(/ѐ/g, 'е').replace(/ѝ/g, 'и').toLowerCase().replace(/[̀́+]/g, '').replace(/[^а-яё-]/g, '');

// е → ё: Texte schreiben ё oft als е (звезды = звезды́ oder звёзды). Steht kein ё im Wort, zählen die Formen mit ё (höchstens
// 3 е) als weitere Varianten mit – Liste [{ form, haupt, neben, n }] nach Belegen, oder null
function nachschlagen(w) {
  const v = [];
  const e0 = eintragRu(w); let quelle = e0 ? e0.quelle : null;
  if (e0) for (const x of e0.varianten) v.push({ form: w, ...x });
  const st = [...w].map((c, i) => (c === 'е' ? i : -1)).filter(i => i >= 0);
  if (st.length && st.length <= 3 && !(e0 && e0.quelle === 'korrektur')) for (let mask = 1; mask < 1 << st.length; mask++) {
    const z = [...w]; st.forEach((p, j) => { if (mask & (1 << j)) z[p] = 'ё'; });
    const f = z.join(''), e = eintragRu(f); if (!e) continue;
    quelle = quelle || e.quelle;
    for (const x of e.varianten) v.push({ form: f, ...x });
  }
  // Das Wiktionary führt е-Schreibungen (идет, шел) als eigene Formen; trägt eine ё-Form den Ton auf eben diesem ё, ist die
  // е-Form nur die vereinfachte Schreibung: dann gilt die ё-Form (идёт, шёл)
  // Ob es so ist, sagt die Häufigkeitsliste: Untertitel schreiben ё mal, mal nicht – ist die ё-Schreibung dort belegt (≥ 1/5 der
  // е-Schreibung), gilt sie; fehlt sie, obwohl die е-Form oft vorkommt (вселенной 4332×, вселённой 0×), ist die е-Form ein
  // eigenes Wort (вселе́нной ≠ вселённой) und bleibt vorn.
  const yoTon = x => [...x.form].filter(istVokal)[x.haupt] === 'ё';
  const H = haeufigkeitRu(), nE = (H.get(w) || {}).n || 0;
  const yoGilt = f => { const nY = (H.get(f) || {}).n || 0; return nY >= 0.2 * nE || nE < 50; };
  const aus = v.filter(x => x.form !== w || !v.some(y => y.form !== w && y.haupt === x.haupt && yoTon(y) && yoGilt(y.form)));
  return aus.length ? { varianten: aus.sort((x, y) => y.n - x.n), quelle } : null;
}

// Varianten eines Wortes → Stufen. Eine Variante (oder eine klar häufigste, ≥ 3:1): Hauptton 2, Nebenton 1, Rest 0.
// Echte Homographen (за́мок/замо́к, ру́ки/руки́): beide Kandidaten 1 – das Versmaß entscheidet (kern/metrik.mjs), die
// Varianten gehen mit (für den Reim: welche Form, welcher Vokal).
// Gelernt aus Gedichten (kern/betonung-vers-ru.json, bin/betonung-lernen-ru.mjs): wie oft welche Lesart im Vers auf der Hebung
// stand. Mit ≥ VERS.min Belegen und einer Lesart ≥ VERS.anteil gilt sie als eindeutig – auch gegen die Zahl der
// Wörterbucheinträge (слёзы statt слезы́: das Wörterbuch hat mehr Einträge für слезы́, Gedichte sagen слёзы).
export const MEHRDEUTIG = { verhaeltnis: 3 };
export const VERS = { min: 3, anteil: 0.75, minEin: 20 };
let VERSDATEN;
export function versDatenRu() {
  if (VERSDATEN === undefined) { try { VERSDATEN = JSON.parse(fs.readFileSync(new URL('./betonung-vers-ru.json', import.meta.url), 'utf8')); } catch { VERSDATEN = null; } }
  return VERSDATEN;
}
function versLesart(w) {
  const d = versDatenRu(); const x = d && d.var[w]; if (!x) return null;
  const e = x.split(',').map(y => y.split(':').map(Number)), s = e.reduce((a, b) => a + b[1], 0);
  return s >= VERS.min ? { haupt: e[0][0], anteil: e[0][1] / s, alle: e.map(y => y[0]) } : null;
}
export function alleVariantenRu(w) { const t = nachschlagen(w); return t ? t.varianten : null; }
function stufenAus(t, n, w) {
  let v = t.varianten.filter(x => x.haupt < n);
  if (!v.length) return null;
  const st = new Array(n).fill(0);
  const vl = v.length > 1 ? versLesart(w) : null;
  if (vl && vl.anteil >= VERS.anteil && v.some(x => x.haupt === vl.haupt)) v = [v.find(x => x.haupt === vl.haupt)];
  else if (vl) v = [...v].sort((a, b) => vl.alle.indexOf(a.haupt) - vl.alle.indexOf(b.haupt)).map(x => ({ ...x, n: 1 }));   // Gedichte uneins: beide bleiben
  const klar = v.length === 1 || v[0].n >= MEHRDEUTIG.verhaeltnis * v[1].n;
  if (klar) { for (const x of v[0].neben) if (x < n) st[x] = 1; st[v[0].haupt] = 2; return { st, varianten: null, form: v[0].form }; }
  const kand = []; const gesehen = new Set();
  for (const x of v) if (x.n * MEHRDEUTIG.verhaeltnis > v[0].n && !gesehen.has(x.haupt)) { gesehen.add(x.haupt); kand.push({ haupt: x.haupt, form: x.form }); }
  if (kand.length === 1) { st[kand[0].haupt] = 2; return { st, varianten: null, form: kand[0].form }; }
  for (const k of kand) st[k.haupt] = 1;
  return { st, varianten: kand, form: kand[0].form };
}

// Wort → { stufen, quelle, einsilberKlasse, varianten? } wie wortBetonung (deutsch) / wortBetonungEn
export function wortBetonungRu(roh) {
  const w = schluesselRu(roh);
  const n = vokalzahl(w);
  if (!n) return { stufen: [], quelle: 'leer', einsilberKlasse: 'u' };   // в, с, к – ohne Vokal keine Silbe
  const kl = klasseEinsilberRu(w);
  const eigen = eigeneBetonung(roh);
  if (eigen != null && eigen < n) {
    const st = new Array(n).fill(0); st[eigen] = 2;
    const out = { stufen: st, quelle: 'eigen' }; if (n === 1) out.einsilberKlasse = 'c';
    return out;
  }
  if (n === 1) {
    const out = { stufen: [kl === 'c' ? 2 : 0], quelle: kl === 'c' ? 'lexikon' : 'kleinwort', einsilberKlasse: kl };
    const d = versDatenRu(), e = d && d.ein[w]; if (e && e[1] >= VERS.minEin) out.vers = [e[0]];   // Anteil Hebung im Vers
    if (w.includes('е') && kl === 'c') { const t = nachschlagen(w); if (t && t.varianten[0].form !== w) out.form = t.varianten[0].form; }   // шел → шёл
    return out;
  }
  const t = nachschlagen(w);
  if (t) {
    const s = stufenAus(t, n, w);
    if (s) {
      let st = s.st;
      if (POLY_SCHWACH.has(w)) st = st.map(x => Math.min(x, 1));   // alles unbetont (Silben 95,4 / Zeilen 82,1 % dev) war schlechter als Nebenton (95,5 / 82,7 %)
      const out = { stufen: st, quelle: t.quelle === 'korrektur' ? 'korrektur' : POLY_SCHWACH.has(w) ? 'kleinwort' : 'lexikon', form: s.form };
      if (s.varianten) out.varianten = s.varianten;
      return out;
    }
  }
  // Bindestrich: кто-нибудь, все-таки, дай-ка, из-за – Teile einzeln, Partikeln unbetont, erstes betontes Teil trägt
  if (w.includes('-')) {
    const teile = w.split('-').filter(Boolean); let st = [];
    for (const p of teile) {
      const b = wortBetonungRu(p);
      if (b.stufen.length === 1 && (b.einsilberKlasse === 'u' || /^(то|либо|нибудь|ка|таки|де|с)$/.test(p))) st.push(0);
      else st.push(...(teile.length > 1 && st.includes(2) ? b.stufen.map(x => (x === 2 ? 1 : x)) : b.stufen));
    }
    if (st.length === n) { if (!st.includes(2) && st.includes(1)) st[st.indexOf(1)] = 2; return { stufen: st, quelle: 'kompositum' }; }
  }
  const h = regelRu(w), st = new Array(n).fill(0); st[h] = 2;
  return { stufen: st, quelle: 'regel' };
}

// ---------- Silben in der Schrift ----------
// Silbe = ein Vokalbuchstabe. Grenze zwischen zwei Vokalen: ein Konsonant geht zur nächsten Silbe (ма-ма), von mehreren bleibt
// der erste bei der vorigen (сер-дце → сер-дце, мас-ло); й, ь, ъ bleiben immer bei der vorigen (бой-кий, боль-шой, подъ-езд).
// Satz- und Zeichen (Akut, +) zählen zum Buchstaben davor. Liefert genau n Stücke, die zusammen das Rohwort ergeben.
export function silbenRu(roh) {
  const z = [...roh], vok = [];
  z.forEach((c, i) => { if (istVokal(c.toLowerCase())) vok.push(i); });
  if (vok.length <= 1) return [roh];
  const grenzen = [];
  for (let k = 1; k < vok.length; k++) {
    const a = vok[k - 1], b = vok[k];
    const zw = []; for (let i = a + 1; i < b; i++) if (/\p{L}/u.test(z[i])) zw.push(i);
    let g;
    if (!zw.length) { g = a + 1; while (g < b && /[\u0300\u0301]/.test(z[g])) g++; }   // Akzent bleibt beim Vokal, „+“ geht zum nächsten
    else {
      let bleib = zw.length >= 2 ? 1 : 0;
      while (bleib < zw.length && /[йьъЙЬЪ]/.test(z[zw[bleib]])) bleib++;
      g = bleib >= zw.length ? zw[zw.length - 1] + 1 : zw[bleib];
      while (g < b && !/\p{L}/u.test(z[g]) && z[g] !== '+') g++;
    }
    grenzen.push(g);
  }
  const teile = []; let s = 0;
  for (const g of grenzen) { teile.push(z.slice(s, g).join('')); s = g; }
  teile.push(z.slice(s).join(''));
  return teile;
}

// Betonte Form für Anzeige und Lautregeln: Akut hinter den Hauptton-Vokal (ё bleibt ohne Akut)
export function betonteFormRu(w, haupt) {
  let v = -1;
  return [...w].map(c => (istVokal(c) && ++v === haupt && c !== 'ё' ? c + AKUT : c)).join('');
}
