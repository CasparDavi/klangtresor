// Russisch: Laute aus Schrift + Betonung, Reimteil und Reimstufen (Jörg, 13.11.2026: eigene Regelmaschine statt fremder Daten).
// Russisch spricht sich bei bekannter Betonung regelhaft; die Regeln folgen der Moskauer Norm, wie sie Lehrbücher und das
// Wiktionary (IPA) schreiben – geprüft gegen die Wiktionary-IPA (pruef/laute-ru-pruefen.mjs):
//   Weichheit   Konsonant vor е ё и ю я ь ist weich (ʲ); ж ш ц immer hart, ч щ й immer weich
//   Jotierung   е ё ю я am Wortanfang, nach Vokal, ь oder ъ = j + Vokal
//   Reduktion   unbetontes о/а nach hartem Konsonanten: vor der Hebung ɐ, sonst ə; nach weichem е/я/а → ɪ, am Wortende я → ə;
//               nach ж ш ц: е → ɨ; у → ʊ; и nach ж ш ц → ɨ
//   Auslaut     stimmhafte Geräuschlaute am Wortende stimmlos (дуб → p, кровь → fʲ)
//   Angleichung in Gruppen richtet sich der Konsonant nach dem folgenden Geräuschlaut (сказка → sk, вокзал → ɡz)
//   Sonderfälle -ого/-его (г → v), что/чтобы (ʂt), тся/ться (t͡sə), stumme Konsonanten (честный, поздно, солнце, чувство, сердце)
// Laute sind IPA-Zeichen, die PanPhon kennt (Merkmalsabstand im Reim-BLAST): ɨ ʂ ʐ ɕː t͡ɕ t͡s ɫ, weich mit ʲ.
import { istVokal } from './russisch.mjs';

const HART_IMMER = new Set(['ж', 'ш', 'ц']), WEICH_IMMER = new Set(['ч', 'щ', 'й']);
const WEICHMACHER = new Set(['е', 'ё', 'и', 'ю', 'я', 'ь']);
const JOT = new Set(['е', 'ё', 'ю', 'я']);
const K = { б: 'b', в: 'v', г: 'ɡ', д: 'd', ж: 'ʐ', з: 'z', к: 'k', л: 'ɫ', м: 'm', н: 'n', п: 'p', р: 'r', с: 's', т: 't', ф: 'f',
  х: 'x', ц: 't͡s', ч: 't͡ɕ', ш: 'ʂ', щ: 'ɕː', й: 'j' };
const STIMMLOS = { b: 'p', v: 'f', ɡ: 'k', d: 't', z: 's', ʐ: 'ʂ', ʑː: 'ɕː', ɣ: 'x' };
const STIMMHAFT = Object.fromEntries(Object.entries(STIMMLOS).map(([a, b]) => [b, a]));
const GERAEUSCH = new Set(['b', 'p', 'v', 'f', 'ɡ', 'k', 'd', 't', 'z', 's', 'ʐ', 'ʂ', 'x', 't͡s', 't͡ɕ', 'ɕː']);
const basis = p => p.replace('ʲ', '');
const weich = p => (p === 'ɫ' ? 'lʲ' : p === 'j' || p.endsWith('ʲ') || p === 't͡ɕ' || p === 'ɕː' ? p : p + 'ʲ');
const NIE_WEICH = new Set(['ʐ', 'ʂ', 't͡s']);

// Schreibung vor den Lautregeln (ganze Wörter und Gruppen); haupt = betonte Silbe (Vokalindex)
const GO_AUSNAHMEN = new Set(['много', 'немного', 'строго', 'убого', 'отлого', 'полого', 'дорого', 'недорого', 'нагого', 'благого', 'изнемого']);
function schreibung(w) {
  let s = w;
  if (/^(что|чтобы|чтоб|ничто|кое-что|что-то|что-нибудь)$/.test(s) || s.startsWith('что-')) s = s.replace('что', 'што');
  if (/^(конечно|скучно|нарочно|скучный|яичница|пустячный|прачечная)$/.test(s)) s = s.replace('чн', 'шн');
  if (/[ео]го$/.test(s) && [...s].filter(istVokal).length >= 2 && !GO_AUSNAHMEN.has(s)) s = s.slice(0, -2) + 'во';
  if (s === 'его') s = 'ево'; if (s === 'сегодня' || s === 'сегодняшний') s = s.replace('сегод', 'севод');
  s = s.replace(/ться$/, 'ца').replace(/тся$/, 'ца');
  s = s.replace(/стн/g, 'сн').replace(/здн/g, 'зн').replace(/лнц/g, 'нц').replace(/^(чу|здра)вств/, '$1ств').replace(/рдц/g, 'рц').replace(/стл/g, 'сл')
    .replace(/[тд]ц/g, 'ц').replace(/[тд]ч/g, 'ч').replace(/[сз]ч/g, 'щ').replace(/[сз]ш/g, 'ш').replace(/[сз]ж/g, 'ж').replace(/нтск/g, 'нск').replace(/стск/g, 'ск');
  return s;
}

// Wort (klein, ё ausgeschrieben, Bindestrich erlaubt) + Hauptton → [{ p, kern?, st }] ; Nebentöne optional
export function lauteRu(wort, haupt, neben = []) {
  const s = schreibung(wort.toLowerCase().replace(/[̀́+]/g, '').replace(/-/g, ''));
  // ё ohne Betonung bleibt o (трёхэтажный)
  const z = [...s], out = [];
  const nVok = z.filter(istVokal).length;
  let v = -1;
  for (let i = 0; i < z.length; i++) {
    const c = z[i];
    if (istVokal(c)) {
      v++;
      const st = v === haupt ? 2 : neben.includes(v) ? 1 : 0;
      const vor = z[i - 1], letzterLaut = out[out.length - 1];
      const nachVokalOderAnfang = i === 0 || istVokal(vor) || vor === 'ь' || vor === 'ъ';
      if (JOT.has(c) && nachVokalOderAnfang) out.push({ p: 'j' });
      else if (c === 'и' && (vor === 'ь')) out.push({ p: 'j' });
      // weich: vorangehender Konsonant (nicht ж ш ц)
      const vorK = out.length && !out[out.length - 1].kern ? out[out.length - 1] : null;
      if (vorK && WEICHMACHER.has(c) && !NIE_WEICH.has(vorK.p)) vorK.p = weich(vorK.p);
      const nachWeich = vorK ? vorK.p.endsWith('ʲ') || vorK.p === 't͡ɕ' || vorK.p === 'ɕː' || vorK.p === 'j' : JOT.has(c) || nachVokalOderAnfang && JOT.has(c);
      const nachHartZisch = vorK && NIE_WEICH.has(vorK.p);
      const jotiert = JOT.has(c) && (nachVokalOderAnfang || nachWeich);
      let q;
      const vortonig = v === haupt - 1, anfang = i === 0, ende = v === nVok - 1 && !z.slice(i + 1).some(x => /[а-яё]/.test(x) && !'ьъ'.includes(x));
      if (st) {
        q = { а: 'a', я: 'a', о: 'o', ё: 'o', у: 'u', ю: 'u', ы: 'ɨ', и: nachHartZisch ? 'ɨ' : 'i', е: nachHartZisch ? 'ɛ' : 'e', э: 'ɛ' }[c];
      } else {
        const weichDavor = nachWeich || jotiert;
        if (c === 'у' || c === 'ю') q = 'ʊ';
        else if (c === 'ы') q = 'ɨ';   // auch -ый (но́вый [ɨj], wie das Wiktionary); der Reim ebnet ɨ nach der Hebung ein (пле́нный / вселе́нной)   // -ый unbetont am Ende: əj (бе́лый, пле́нный – wie das Wiktionary)
        else if (c === 'и') q = nachHartZisch ? 'ɨ' : 'ɪ';
        else if (c === 'э') q = 'ɨ';
        else if (c === 'е' || c === 'ё') q = nachHartZisch ? (ende && vorK.p === 't͡s' ? 'ə' : 'ɨ') : 'ɪ';   // се́рдце, со́лнце: -це am Ende ə; бо́льше ɨ
        else if (c === 'я') q = ende ? 'ə' : 'ɪ';
        else if (c === 'а' || c === 'о') q = weichDavor && c === 'а' && !nachHartZisch ? (ende ? 'ə' : 'ɪ') : (anfang || vortonig) ? 'ɐ' : nachHartZisch && c === 'а' && v > haupt && !ende ? 'ɨ' : 'ə';   // два́дцать t͡sɨtʲ
        if (c === 'а' && nachHartZisch && vortonig) q = 'ɐ';
      }
      out.push({ p: q, kern: true, st });
      continue;
    }
    if (c === 'ь') { const l = out[out.length - 1]; if (l && !l.kern && !NIE_WEICH.has(l.p)) l.p = weich(l.p); continue; }
    if (c === 'ъ') continue;
    const k = K[c]; if (!k) continue;
    let p = WEICH_IMMER.has(c) ? k : k;
    // Doppelkonsonant = einer (Reim braucht die Länge nicht)
    const l = out[out.length - 1];
    if (l && !l.kern && basis(l.p) === p && c !== 'й') continue;
    out.push({ p });
  }
  // Weichheit vor weichem Konsonanten: Zahnlaute (t d s z n) vor weichem Zahnlaut, ч oder щ werden weich (гла́сность sʲtʲ,
  // пу́тник tʲnʲ, зо́нтик nʲtʲ, ко́нчик nʲt͡ɕ) – so schreibt es das Wiktionary; andere Gruppen schwanken in der Norm und bleiben hart
  const ZAHN = new Set(['t', 'd', 's', 'z', 'n']);
  for (let i = out.length - 2; i >= 0; i--) {
    const x = out[i], y = out[i + 1]; if (x.kern || y.kern || !ZAHN.has(x.p)) continue;
    if ((y.p.endsWith('ʲ') && ZAHN.has(basis(y.p))) || y.p === 'lʲ' && x.p !== 'n' && false || y.p === 't͡ɕ' || y.p === 'ɕː') x.p = weich(x.p);
  }
  // Angleichung der Stimmhaftigkeit von rechts nach links; Auslautverhärtung
  for (let i = out.length - 1; i >= 0; i--) {
    const x = out[i]; if (x.kern) continue;
    const b = basis(x.p), weichZ = x.p.endsWith('ʲ') ? 'ʲ' : '';
    const naechster = out[i + 1];
    if (!naechster) { if (STIMMLOS[b]) x.p = STIMMLOS[b] + weichZ; continue; }
    if (naechster.kern) continue;
    const nb = basis(naechster.p);
    if (!GERAEUSCH.has(nb) || nb === 'v') continue;            // vor Sonoranten und в keine Angleichung
    const stimmhaftN = ['b', 'ɡ', 'd', 'z', 'ʐ'].includes(nb);
    if (stimmhaftN && STIMMHAFT[b]) x.p = STIMMHAFT[b] + weichZ;
    else if (!stimmhaftN && STIMMLOS[b]) x.p = STIMMLOS[b] + weichZ;
  }
  return out;
}

// IPA-Zeichenkette (zum Prüfen gegen das Wiktionary): ˈ vor der betonten Silbe
export function ipaRu(wort, haupt, neben = []) {
  const L = lauteRu(wort, haupt, neben);
  // Silbengrenze für ˈ: vor dem betonten Kern stehen die Konsonanten, die zur Silbe gehören – vereinfacht: alle Konsonanten
  // direkt vor dem Kern bis auf den ersten einer Zweiergruppe nach Vokal
  const teile = L.map(x => x.p);
  const k = L.findIndex(x => x.kern && x.st === 2);
  if (k >= 0) {
    let a = k; while (a > 0 && !L[a - 1].kern) a--;
    const n = k - a; if (n >= 2 && a > 0) a += 1;
    teile.splice(a, 0, 'ˈ');
  }
  return teile.join('');
}

// Reimglieder wie glieder() im Deutschen: [{ v, c, vor, st, voll }] – voll = kein reduzierter Vokal (ə, ɐ, ɪ, ʊ unbetont)
export function gliederRu(wort, haupt, neben = [], klasse = null) {
  const g = []; let vor = [];
  for (const x of lauteRu(wort, haupt, neben)) {
    if (x.kern) { g.push({ v: x.p, c: [], vor, st: x.st, voll: x.st > 0 || !['ə', 'ɐ', 'ɪ', 'ʊ', 'ɨ'].includes(x.p) }); vor = []; }
    else { if (g.length) g[g.length - 1].c.push(x.p); vor.push(x.p); }
  }
  if (g.length === 1 && klasse) { if (klasse === 'u') g[0].st = 0; else if (klasse === 'b') g[0].st = Math.min(g[0].st, 1); }
  return g;
}

// ---------- Reimteil und Reimstufen ----------
// Reimteil = vom betonten Vokal bis zum Wortende. Nach der Hebung zählen die reduzierten Vokale als ein Laut (по́ле / во́ля:
// lʲɪ / lʲə – in der russischen Verslehre ein genauer Reim). Offene männliche Reime (Ton auf dem letzten Vokal) brauchen
// für „rein“ den gleichen Stützkonsonanten davor (моя́/твоя́, земли́/вдали́); sonst „fast rein“ (я́ / земля́).
const RED = new Set(['ə', 'ɐ', 'ɪ']);
export function reimteilRu(wort, haupt, neben = []) {
  const L = lauteRu(wort, haupt, neben);
  const k = L.findIndex(x => x.kern && x.st === 2);
  if (k < 0) return null;
  const teil = L.slice(k).map((x, i) => (i && x.kern && RED.has(x.p) ? 'ə' : x.p));
  const kerne = L.slice(k).filter(x => x.kern).map((x, i) => (i && RED.has(x.p) ? 'ə' : x.p));
  const kons = L.slice(k + 1).filter(x => !x.kern).map(x => x.p);
  const stuetz = k > 0 && !L[k - 1].kern ? L[k - 1].p : '';
  let e = k + 1; while (e < L.length && !L[e].kern) e++;
  return { voll: teil.join(' '), vokal: L[k].p, silbe: L.slice(k, e).map(x => x.p).join(' '), vokale: kerne.join(' '), koda: kons.join(' '), stuetz, offen: k === L.length - 1,
    silben: kerne.length, wort: L.map(x => x.p).join('') };
}
const ART = p => {
  const b = basis(p);
  return ['m', 'n'].includes(b) ? 'nas' : ['ɫ', 'l', 'r'].includes(b) ? 'liq' : b === 'j' ? 'gl' : ['b', 'p', 'd', 't', 'ɡ', 'k'].includes(b) ? 'pl'
    : ['v', 'f', 'z', 's', 'ʐ', 'ʂ', 'x', 'ɕː'].includes(b) ? 'fr' : 'aff';
};
const ohneStimme = p => { const b = basis(p); return (STIMMLOS[b] || b) + (p.endsWith('ʲ') ? 'ʲ' : ''); };
// Vokale, die im russischen Reim als nah gelten: и/ы (betont), е/э; sonst nichts
const NAH = [['i', 'ɨ'], ['e', 'ɛ']];
// e/ɛ sind Allophone (те́ни / утеше́ний): für den Vergleich gleich; nach der Hebung zählen ɨ und ʊ im „eingeebneten“ Reimteil
// wie ə (огра́ды / отра́да, а́лых / вокза́лов – in RIFMA als Reim belegt): gleich bis auf diese Färbung = fast rein
const eb = x => ({ ...x, voll: x.voll.replace(/ɛ/g, 'e'), vokal: x.vokal.replace('ɛ', 'e'), vokale: x.vokale.replace(/ɛ/g, 'e') });
const eben = x => x.voll.split(' ').map((p, i) => (i && (p === 'ɨ' || p === 'ʊ') ? 'ə' : p)).join(' ');
const ebenV = x => x.vokale.split(' ').map((p, i) => (i && (p === 'ɨ' || p === 'ʊ') ? 'ə' : p)).join(' ');
export function reimStufeRu(a0, b0) {
  if (!a0 || !b0) return null;
  const a = eb(a0), b = eb(b0);
  const nah = NAH.some(([x, y]) => (a.vokal === x && b.vokal === y) || (a.vokal === y && b.vokal === x));
  if (a.voll === b.voll || (nah && a.voll.slice(a.vokal.length) === b.voll.slice(b.vokal.length))) {
    if (a.wort === b.wort) return 'rührend';
    if (nah && a.vokal !== b.vokal) return 'fast rein';
    // offener männlicher Reim (Ton auf dem letzten Vokal): der Stützkonsonant davor gehört zum Reim – gleich = rein (мечта́ /
    // черта́), nur hart gegen weich verschieden = fast rein (мечта́ / дитя́, весна́ / меня́), anderer Konsonant = unrein (я́ / слова́)
    if (a.offen && a.stuetz !== b.stuetz) return basis(a.stuetz) === basis(b.stuetz) && a.stuetz && b.stuetz ? 'fast rein' : 'unrein';
    return 'rein';
  }
  if (a.silben !== b.silben) return null;
  if (eben(a) === eben(b)) return 'fast rein';
  const gleicheVokale = ebenV(a) === ebenV(b);
  // ungenau: gleiche Vokale, Konsonanten nur in Stimme/Weichheit verschieden oder ein j mehr/weniger (ми́лый / си́лы)
  const ka = a.koda.split(' ').filter(Boolean), kb = b.koda.split(' ').filter(Boolean);
  const kurz = x => x.filter(p => p !== 'j').map(p => basis(ohneStimme(p)));
  if (gleicheVokale && kurz(ka).join(' ') === kurz(kb).join(' ')) return 'unrein';
  if (gleicheVokale && ka.length && ka.length === kb.length && ka.every((p, i) => ART(p) === ART(kb[i]))) return 'unrein';
  if (gleicheVokale) return 'Assonanz';
  if (a.koda && a.koda === b.koda) return 'Konsonanz';
  return null;
}
