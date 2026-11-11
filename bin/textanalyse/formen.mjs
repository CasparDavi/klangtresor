// Vers- und Strophenformen benennen – nur beschreiben, nie werten (Jörg, 10.11.2026: „jetzt darfst du die Vers- und
// Strophenformen einbauen“). Grundlage: Kayser, Kleine deutsche Versschule (24. Aufl. 1992), Seiten je Form unten;
// die Regeln sind in eigenen Worten nachgebaut, die Zahlen (Hebungen, Reimfolge) stammen aus dem Buch.
//
// Eingang: die Zeilen aus anzeige() (kern/analyse.mjs) mit silben[].m ('S' Hebung, 'W' Senkung), h, k, reim.
// Ausgang je Verszeile: z.vers = { h, auftakt, fuellung, takt, name } und an der ersten Zeile jeder Strophe
// z.strophe = { text, name, quelle }. Eine Strophe ist ein Block von Verszeilen ohne Leerzeile oder Überschrift dazwischen.
// Benannt wird nur, was die Merkmale aus dem Buch erfüllt; sonst steht eine Beschreibung da (Zeilen, Reim, Hebungen).
// Toleranz: die Hebungserkennung trifft gut vier von fünf Zeilen ganz (docs/PRUEFSTAND.md) – Versmaß-Bedingungen
// gelten daher als erfüllt, wenn drei Viertel der Zeilen passen; Reimfolgen müssen genau stimmen.

const Q = s => `Kayser, Kleine deutsche Versschule, S. ${s}`;
// Englische Strophenformen (Jörg, 10.11.2026: Englisch nachziehen): allgemeines Wissen der englischen Verslehre, die
// Hymnen-Metren nach ihren Hebungszahlen; keine Seitenangabe, weil kein Buch dazu bei uns liegt.
const QEN = 'englische Verslehre (allgemein)';
const MEHRHEIT = 0.75;

// ---- Vers ----
// Füllung: wie viele Senkungen zwischen den Hebungen stehen (Kayser S. 18–35)
export function versmass(z) {
  const m = z.silben.map(s => s.m), S = [];
  m.forEach((x, i) => { if (x === 'S') S.push(i); });
  if (!S.length) return null;
  const luecken = S.slice(1).map((s, k) => s - S[k] - 1);
  const fuellung = !luecken.length ? null : luecken.every(x => x === 1) ? 'eins' : luecken.every(x => x === 2) ? 'zwei'
    : luecken.every(x => x === 1 || x === 2) ? 'einszwei' : 'frei';
  const auftakt = S[0], ausgang = m.length - 1 - S[S.length - 1];
  const takt = fuellung === 'eins' ? (auftakt === 0 ? 'trochäisch' : auftakt === 1 ? 'jambisch' : 'Senkung einsilbig')
    : fuellung === 'zwei' ? (auftakt === 0 ? 'daktylisch' : auftakt === 2 ? 'anapästisch' : 'Senkung zweisilbig')
    : fuellung === 'einszwei' ? 'Senkung ein- oder zweisilbig' : fuellung === 'frei' ? 'freie Füllung' : null;
  const v = { h: S.length, auftakt, ausgang, luecken, fuellung, takt, name: null };
  // Wortgrenze direkt nach Silbe i (Zäsur)
  const wortEnde = i => i + 1 >= z.silben.length || z.silben[i + 1].von > z.silben[i].bis;
  // sechshebiger Jambus mit Einschnitt nach der dritten Hebung (S. 31): Wortende nach der 3. Hebung oder der Senkung danach
  if (v.h === 6 && fuellung === 'eins' && auftakt === 1 && (wortEnde(S[2]) || (S[2] + 1 < m.length && m[S[2] + 1] === 'W' && wortEnde(S[2] + 1) && !wortEnde(S[2]))))
    v.name = 'Alexandriner';
  // sechs Hebungen, ohne Auftakt, Senkungen ein- oder zweisilbig, nach der fünften Hebung zweisilbig (S. 24)
  else if (v.h === 6 && auftakt === 0 && luecken.every(x => x === 1 || x === 2) && luecken[4] === 2) v.name = 'Hexameter';
  // wie der Hexameter, aber ohne Senkung nach der dritten und der sechsten Hebung (S. 26)
  else if (v.h === 6 && auftakt === 0 && luecken[2] === 0 && ausgang === 0 && luecken.every((x, k) => k === 2 || x === 1 || x === 2)) v.name = 'Pentameter';
  // drei oder vier Hebungen, Senkung ein- oder zweisilbig (S. 23)
  else if ((v.h === 3 || v.h === 4) && (fuellung === 'eins' || fuellung === 'zwei' || fuellung === 'einszwei')) v.name = 'Volksliedzeile';
  return v;
}
const VERSNAME = {
  Alexandriner: 'sechshebiger Jambus mit Einschnitt nach der dritten Hebung (Alexandriner)',
  Hexameter: 'sechs Hebungen ohne Auftakt, nach der fünften zwei Senkungen (Hexameter)',
  Pentameter: 'sechs Hebungen, Hebungen 3 und 4 sowie Schluss ohne Senkung dazwischen (Pentameter)',
  Volksliedzeile: 'Volksliedzeile',
};
export function versText(v) {
  if (!v) return '';
  const t = `${v.h}-hebig${v.takt ? ', ' + v.takt : ''}`;
  return v.name ? `${t} – ${VERSNAME[v.name]}` : t;
}

// ---- Reimfolge einer Gruppe von Zeilen ----
// Gleicher Reimbuchstabe (im selben Abschnitt eindeutig) oder dasselbe Schlusswort (Kehrzeile, rührend) = ein Klang.
// Buchstaben nach erstem Auftreten a, b, c …; Zeilen ohne Partner in der Gruppe = x.
function reimfolge(Z) {
  const grp = Z.map((z, i) => i);
  const finde = i => (grp[i] === i ? i : (grp[i] = finde(grp[i])));
  const wort = z => (z.letztesWort || '').toLowerCase();
  for (let i = 0; i < Z.length; i++) for (let j = 0; j < i; j++)
    if ((Z[i].reim && Z[i].reim === Z[j].reim) || (wort(Z[i]) && wort(Z[i]) === wort(Z[j]))) grp[finde(i)] = finde(j);
  const groesse = {}; Z.forEach((z, i) => { const r = finde(i); groesse[r] = (groesse[r] || 0) + 1; });
  const name = {}; let n = 0;
  return Z.map((z, i) => { const r = finde(i); if (groesse[r] < 2) return 'x'; if (!(r in name)) name[r] = String.fromCharCode(97 + n++); return name[r]; }).join('');
}
const REIMNAME = {
  aa: 'Reimpaar', aabb: 'Paarreim', abab: 'Kreuzreim', abba: 'umarmender Reim', xaxa: 'halber Kreuzreim', aaaa: 'Einreim',
  aaxa: 'Rubai-Reim', aabccb: 'Schweifreim', ababcc: 'Kreuzreim und Reimpaar', aabbcc: 'drei Reimpaare', abcabc: 'verschränkter Reim',
  abababcc: 'dreimal Kreuzreim, dann Reimpaar', abababab: 'viermal Kreuzreim', abbaabba: 'zweimal umarmend', ababcdcd: 'doppelter Kreuzreim',
  aabbccdd: 'vier Reimpaare', aaa: 'Dreireim', axa: 'erste und dritte Zeile reimen', aabab: 'Reim aabab', aabba: 'Reim aabba', abaab: 'Reim abaab',
};
const paarreim = s => s.length >= 4 && s.length % 2 === 0 && /^((.)\2)+$/.test(s) && !/x/.test(s);
const reimText = s => !/[a-w]/.test(s) ? 'ohne Endreim' : REIMNAME[s] || (paarreim(s) ? 'Paarreim' : 'Reim ' + s);

// ---- Strophe ----
const anteil = (Z, f) => Z.filter(f).length / Z.length;
const fuenfJambus = z => z.vers && z.vers.h === 5 && z.vers.fuellung === 'eins' && z.vers.auftakt === 1;
const liedFuellung = z => z.vers && ['eins', 'zwei', 'einszwei'].includes(z.vers.fuellung);
const norm = z => (z.roh || '').toLowerCase().replace(/[^a-zäöüß]+/g, ' ').trim();
const hebungsgang = Z => { const h = Z.map(z => z.h); return Z.length <= 8 ? h.join('-') : `${Math.min(...h)} bis ${Math.max(...h)}`; };
function fuellungText(Z) {
  const n = {}; Z.forEach(z => { const t = z.vers && z.vers.takt; if (t) n[t] = (n[t] || 0) + 1; });
  const [t, c] = Object.entries(n).sort((a, b) => b[1] - a[1])[0] || [];
  return t && c / Z.length >= MEHRHEIT ? t : 'Füllung wechselnd';
}
function beschreibung(Z, s) {
  return `${Z.length} Zeilen · ${reimText(s)} · Hebungen ${hebungsgang(Z)} · ${fuellungText(Z)}`;
}
const form = (name, text, seite) => ({ name, text, quelle: Q(seite) });
const QODE = 'Wagenknecht, Deutsche Metrik, S. 109–112; Burdorf, Einführung in die Gedichtanalyse, S. 109–112';
const ODEN = [['sapphische Odenstrophe', [11, 11, 11, 5]], ['alkäische Odenstrophe', [11, 11, 9, 10]], ['asklepiadeische Odenstrophe', [12, 12, 7, 8]]];

export function strophenform(Z) {
  const n = Z.length, s = reimfolge(Z), h = Z.map(z => z.h);
  const besch = beschreibung(Z, s);
  // acht Zeilen, Reim abaaabab, Zeile 1 kehrt als 4 und 7 wieder, Zeile 2 als 8 (S. 53)
  if (n === 8 && /^abaaabab$/.test(s) && norm(Z[0]) === norm(Z[3]) && norm(Z[0]) === norm(Z[6]) && norm(Z[1]) === norm(Z[7]))
    return form('Triolett', `Triolett – acht Zeilen, zwei Reime, die erste Zeile kehrt als vierte und siebte wieder, die zweite als achte`, '53');
  // acht fünfhebige Jamben, Reim abababcc (S. 46)
  if (n === 8 && s === 'abababcc' && anteil(Z, fuenfJambus) >= MEHRHEIT)
    return form('Stanze', `Stanze – acht fünfhebige Jamben, dreimal Kreuzreim, dann ein Reimpaar`, '46');
  // wie die Stanze, aber viermal das Reimpaar a b (S. 48)
  if (n === 8 && s === 'abababab' && anteil(Z, fuenfJambus) >= MEHRHEIT)
    return form('Siziliane', `Siziliane – acht fünfhebige Jamben, viermal Kreuzreim auf nur zwei Klänge`, '48');
  // neun Zeilen ababbcbc c, die neunte eine Hebung länger (S. 48)
  if (n === 9 && s === 'ababbcbcc' && h[8] === Math.max(...h.slice(0, 8)) + 1)
    return form('Spenser-Stanze', `neun Zeilen, Reim ababbcbc c, die letzte eine Hebung länger (Spenser-Stanze)`, '48 f.');
  // Englische Strophen: nur, wenn die Zeilen überwiegend englisch sind (deutsche Formen wie Volksliedstrophe, Knittelvers
  // passen dann nicht)
  const englisch = anteil(Z, z => z.sprache === 'en') >= MEHRHEIT, hg = h.join('');
  if (englisch) {
    const en = (name, text) => ({ name, text, quelle: QEN });
    if (n === 5 && s === 'aabba' && Math.max(Z[2].n, Z[3].n) < Math.min(Z[0].n, Z[1].n, Z[4].n))   // dritte und vierte kürzer (Silben – robuster als Hebungen)
      return en('Limerick', 'Limerick – fünf Zeilen, Reim aabba, die dritte und vierte kürzer');
    // fünfhebig genügt: die englische Hebungserkennung trifft die Füllung seltener als die Zahl der Hebungen (docs/PRUEFSTAND.md)
    const fuenf = z => z.h === 5;
    if (n === 7 && s === 'ababbcc' && anteil(Z, fuenf) >= MEHRHEIT)
      return en('Rhyme Royal', 'Rhyme Royal – sieben fünfhebige Jamben, Reim ababbcc');
    if (n === 4 && (s === 'abab' || s === 'xaxa') && hg === '4343')
      return en('Common Metre', 'Balladenstrophe (Common Metre) – vier Zeilen mit 4-3-4-3 Hebungen, Kreuzreim oder nur Zeile 2 und 4');
    if (n === 4 && (s === 'abab' || s === 'xaxa') && hg === '3343')
      return en('Short Metre', 'Short Metre – vier Zeilen mit 3-3-4-3 Hebungen');
    if (n === 4 && (s === 'abab' || s === 'aabb' || s === 'xaxa') && hg === '4444' && anteil(Z, z => z.vers && z.vers.fuellung === 'eins') >= MEHRHEIT)
      return en('Long Metre', 'Long Metre – vier jambische Vierheber, Kreuz- oder Paarreim');
    if (n >= 2 && n % 2 === 0 && /^((.)\2)+$/.test(s) && !/x/.test(s) && anteil(Z, fuenf) >= MEHRHEIT)
      return en('Heroic Couplets', `${n} Zeilen fünfhebiger Jambus in Reimpaaren (Heroic Couplets)`);
  }
  // Chevy-Chase-Strophe: Hebungen 4-3-4-3, Senkungen ein- oder zweisilbig, alle Zeilen enden betont (S. 41)
  if (n === 4 && s === 'abab' && h.join('') === '4343' && Z.every(z => z.k === 'm') && anteil(Z, liedFuellung) >= MEHRHEIT)
    return form('Chevy-Chase-Strophe', `vier Zeilen mit 4-3-4-3 Hebungen, alle betont endend, Kreuzreim (Chevy-Chase-Strophe)`, '41');
  // Volksliedstrophe: vier Volksliedzeilen im Kreuzreim (S. 40)
  if (!englisch && n === 4 && s === 'abab' && anteil(Z, z => z.vers && z.vers.name === 'Volksliedzeile') >= MEHRHEIT)
    return form('Volksliedstrophe', `Volksliedstrophe – vier Zeilen mit drei oder vier Hebungen, Kreuzreim · Hebungen ${hebungsgang(Z)}`, '40');
  // Ritornell: drei Zeilen, erste und dritte reimen, die erste kürzer (S. 43)
  if (n === 3 && s === 'axa' && h[0] < h[1] && h[0] < h[2])
    return form('Ritornell', `Ritornell – drei Zeilen, die erste kurz, erste und dritte reimen`, '43');
  // Odenstrophen: vier Zeilen ohne Reim mit fester Silbenzahl (Wagenknecht, Glossar; Burdorf S. 109–112):
  // sapphisch 11-11-11-5, alkäisch 11-11-9-10, asklepiadeisch (dritte Form) 12-12-7-8. Silbenzahl ist robuster als die
  // Lage der Hebungen (antike Verse verlangen Doppelsenkung und Hebungsprall, die unsere Hebungssuche meidet).
  if (n === 4 && !/[a-w]/.test(s)) for (const [name, soll] of ODEN) {
    const d = Z.map((z, i) => Math.abs(z.n - soll[i]));
    if (d.every(x => x <= 1) && d.filter(x => x === 0).length >= 3)
      return { name, text: `${name} – vier Zeilen ohne Reim mit ${soll.join('-')} Silben`, quelle: QODE };
  }
  // Distichon: Hexameter und Pentameter (S. 49)
  if (n === 2 && Z[0].vers && Z[0].vers.name === 'Hexameter' && Z[1].vers && Z[1].vers.name === 'Pentameter')
    return form('Distichon', `Distichon – ein Hexameter und ein Pentameter`, '49');
  // zwei Vierzeiler (S. 46: volkstümliche Achtzeiler sind meist zwei zusammengesetzte Vierzeiler)
  if (n === 8) {
    const a = strophenform(Z.slice(0, 4)), b = strophenform(Z.slice(4));
    if (a.name && a.name === b.name) return form(a.name, `zwei Vierzeiler, je ${a.text.replace(/ · Hebungen.*$/, '')} · Hebungen ${hebungsgang(Z)}`, a.quelle.replace(/^.*S\. /, ''));
  }
  // Knittelverse: vierhebig, paarweise gereimt, Füllung frei; Hans Sachs zählte 8 oder 9 Silben (S. 22)
  if (!englisch && n >= 2 && /^((.)\2)+$/.test(s) && !/x/.test(s) && anteil(Z, z => z.h === 4) >= MEHRHEIT && !Z.every(z => z.vers && z.vers.fuellung === 'eins')) {
    const streng = Z.every(z => z.n === (z.k === 'm' ? 8 : 9));
    return form('Knittelvers', `${n} Zeilen Knittelvers – vierhebig, Paarreim, ${streng ? 'acht oder neun Silben (strenger Knittel)' : 'freie Füllung'}`, '22');
  }
  // Alexandriner in der Mehrzahl (S. 31)
  if (n >= 2 && anteil(Z, z => z.vers && z.vers.name === 'Alexandriner') >= MEHRHEIT)
    return form('Alexandriner', `${n} Zeilen sechshebiger Jambus mit Einschnitt nach der dritten Hebung (Alexandriner) · ${reimText(s)}`, '31');
  // Blankvers: fünfhebige Jamben ohne Reim (S. 28 f.)
  if (n >= 3 && !/[a-w]/.test(s) && anteil(Z, fuenfJambus) >= MEHRHEIT)
    return form('Blankvers', `${n} Zeilen fünfhebiger Jambus ohne Reim (Blankvers)`, '28 f.');
  // freie Rhythmen: ohne Reim, Zahl der Hebungen frei, Füllung frei (S. 22)
  if (n >= 3 && !/[a-w]/.test(s) && new Set(h).size >= 3 && anteil(Z, z => z.vers && z.vers.fuellung === 'frei') >= 0.5)
    return form('freie Rhythmen', `${n} Zeilen ohne Reim, Hebungszahl und Füllung frei (freie Rhythmen)`, '22');
  return { name: null, text: besch, quelle: null };
}

// ---- Gedichtformen über mehrere Strophen ----
// Sonett: 14 Zeilen, zwei Vierzeiler und zwei Dreizeiler; Vierzeiler umarmend oder kreuzend (auch mit eigenen Reimen),
// in den Dreizeilern hat jede Zeile einen Partner; englische Abwandlung: drei Vierzeiler und ein Reimpaar (S. 62)
function sonett(B) {
  const alle = B.flat(); if (alle.length !== 14) return null;
  const groessen = B.map(b => b.length).join('-');
  if (!['14', '4-4-3-3', '8-6', '4-4-6', '8-3-3', '4-4-4-2', '12-2'].includes(groessen)) return null;
  const s = reimfolge(alle), q1 = reimfolge(alle.slice(0, 4)), q2 = reimfolge(alle.slice(4, 8));
  const quartett = q => q === 'abba' || q === 'abab';
  const rest = reimfolge(alle.slice(8));
  // in den Dreizeilern darf die Reimerkennung bis zu zwei Partner verfehlen (alte Schreibung: wiederfind't); die Gliederung
  // 4-4-3-3 oder zwei saubere Vierzeiler tragen die Form
  if (quartett(q1) && quartett(q2) && (rest.match(/x/g) || []).length <= 2 && /([a-w]).*\1/.test(rest) && groessen !== '4-4-4-2' && groessen !== '12-2')
    return form('Sonett', `Sonett – 14 Zeilen: zwei Vierzeiler (${s.slice(0, 4)} ${s.slice(4, 8)}), zwei Dreizeiler (${s.slice(8, 11)} ${s.slice(11)})`, '62');
  if (quartett(q1) && quartett(q2) && quartett(reimfolge(alle.slice(8, 12))) && reimfolge(alle.slice(12)) === 'aa')
    return form('Sonett', `Sonett in englischer Form – drei Vierzeiler und ein Reimpaar (${s.slice(0, 4)} ${s.slice(4, 8)} ${s.slice(8, 12)} ${s.slice(12)})`, '62');
  return null;
}
// Terzinen: Dreizeiler aba bcb cdc …, der mittlere Reim kehrt in der nächsten Strophe außen wieder (S. 42)
function terzinen(B) {
  if (B.length < 2 || B.slice(0, -1).some(b => b.length !== 3)) return null;
  const s = reimfolge(B.flat()), k = [];
  for (let i = 0; i + 3 <= s.length; i += 3) k.push(s.slice(i, i + 3));
  for (let i = 0; i < k.length; i++) { if (k[i][0] !== k[i][2] || k[i][0] === 'x') return null; if (i && k[i][0] !== k[i - 1][1]) return null; }
  return form('Terzine', `Terzinen – Dreizeiler, deren Mittelreim in der nächsten Strophe außen wiederkehrt (${k.join(' ')})`, '42');
}
// Ghasel: 3 bis 10 Verspaare, das erste reimt, danach alle geraden Zeilen auf denselben Klang, ungerade ohne Reim (S. 56)
function ghasel(B) {
  const alle = B.flat(), n = alle.length; if (n < 6 || n > 20 || n % 2) return null;
  const s = reimfolge(alle);
  if (s[0] !== 'a' || s[1] !== 'a') return null;
  for (let i = 2; i < n; i++) if (i % 2 ? s[i] !== 'a' : s[i] !== 'x') return null;
  return form('Ghasel', `Ghasel – ${n / 2} Verspaare, alle geraden Zeilen auf einen Klang, die ungeraden ohne Reim`, '56');
}

// Zeilen (anzeige) → z.vers je Verszeile, z.strophe an der ersten Zeile jeder Strophe. roh: Rohzeilen (für Kehrzeilen).
export function formen(zeilen, roh) {
  zeilen.forEach((z, i) => { if (z.typ === 'zeile') { z.vers = versmass(z); z.roh = roh[i]; } });
  // Strophen: Blöcke von Verszeilen; Gedichtformen innerhalb eines Abschnitts (Überschrift trennt)
  const abschnitte = [[]]; let block = null;
  zeilen.forEach((z, i) => {
    if (z.typ === 'zeile') { if (!block) { block = []; abschnitte.at(-1).push(block); } block.push(i); return; }
    block = null;
    if (z.typ === 'abschnitt') abschnitte.push([]);
  });
  for (const B of abschnitte) {
    if (!B.length) continue;
    const ZB = B.map(b => b.map(i => zeilen[i]));
    const ganz = sonett(ZB) || terzinen(ZB) || ghasel(ZB);
    B.forEach((b, k) => {
      const z = zeilen[b[0]];
      if (ganz) { z.strophe = k === 0 ? ganz : { name: ganz.name, text: `${ganz.name} · ${k + 1}. Teil`, quelle: ganz.quelle, teil: true }; return; }
      z.strophe = strophenform(ZB[k]);
    });
    // Kurzform für die Marke neben der Überschrift: Name und Hebungsgang, sonst Zeilen, Reim, Hebungen
    B.forEach((b, k) => {
      const st = zeilen[b[0]].strophe, Z = ZB[k];
      st.kurz = st.teil ? st.text : st.name ? `${st.name} · Hebungen ${hebungsgang(Z)}` : `${Z.length} Zeilen · ${reimText(reimfolge(Z))} · Hebungen ${hebungsgang(Z)}`;
    });
  }
  zeilen.forEach(z => { delete z.roh; if (z.vers) delete z.vers.luecken; });
}

// ---- Katalog für die Oberfläche: je Form eine Skizze ----
// bild: je Zeile „Muster|Reim“ – S Hebung, W Senkung, / Einschnitt (Zäsur); Reim a, b … (x = ohne Reim, Großbuchstabe =
// die Zeile kehrt wörtlich wieder); '' = Strophenpause. Die Skizzen zeigen die Grundform, nicht jede erlaubte Abweichung.
const J5w = 'WSWSWSWSWSW', J5m = 'WSWSWSWSWS';
export const FORMKATALOG = [
  { ebene: 'Versfuß', name: 'Jambus', text: 'Senkung, Hebung – der Vers steigt an', quelle: Q(26), bild: ['WSWSWSWS|x'] },
  { ebene: 'Versfuß', name: 'Trochäus', text: 'Hebung, Senkung – der Vers fällt', quelle: Q(26), bild: ['SWSWSWSW|x'] },
  { ebene: 'Versfuß', name: 'Daktylus', text: 'Hebung und zwei Senkungen', quelle: Q(26), bild: ['SWWSWWSWWSWW|x'] },
  { ebene: 'Versfuß', name: 'Anapäst', text: 'zwei Senkungen, dann die Hebung', quelle: Q(26), bild: ['WWSWWSWWSWWS|x'] },
  { ebene: 'Versform', name: 'Volksliedvers', text: 'drei oder vier Hebungen, dazwischen ein oder zwei Senkungen', quelle: Q(23), bild: ['WSWWSWSWWS|x'] },
  { ebene: 'Versform', name: 'Knittelvers', text: 'vier Hebungen, Senkungen frei (auch keine oder drei), paarweise gereimt', quelle: Q(22), bild: ['WSWWWSSWS|a', 'WWSWSWWSWS|a'] },
  { ebene: 'Versform', name: 'Blankvers', text: 'fünf Hebungen, jambisch, ohne Reim', quelle: Q('28 f.'), bild: [J5w + '|x', J5m + '|x'] },
  { ebene: 'Versform', name: 'Alexandriner', text: 'sechs Hebungen, jambisch, Einschnitt nach der dritten Hebung', quelle: Q(31), bild: ['WSWSWS/WSWSWSW|a', 'WSWSWS/WSWSWSW|a'] },
  { ebene: 'Versform', name: 'Hexameter', text: 'sechs Hebungen ohne Auftakt, Senkungen ein- oder zweisilbig, nach der fünften Hebung zwei', quelle: Q(24), bild: ['SWWSWWSWWSWWSWWSW|x'] },
  { ebene: 'Versform', name: 'Pentameter', text: 'sechs Hebungen, nach der dritten und am Schluss ohne Senkung', quelle: Q(26), bild: ['SWWSWWS/SWWSWWS|x'] },
  { ebene: 'Versform', name: 'freie Rhythmen', text: 'ohne Reim, Zahl der Hebungen und Senkungen frei', quelle: Q(22), bild: ['WSWWSWS|x', 'SWWWSWSWWSWWS|x', 'WSWSWWS|x'] },
  { ebene: 'Strophenform', name: 'Volksliedstrophe', text: 'vier Volksliedverse im Kreuzreim, meist abwechselnd unbetont und betont endend', quelle: Q(40), bild: ['WSWSWSW|a', 'WSWSWS|b', 'WSWWSWSW|a', 'WSWSWWS|b'] },
  { ebene: 'Strophenform', name: 'Chevy-Chase-Strophe', text: 'vier Zeilen mit 4-3-4-3 Hebungen, alle betont endend, Kreuzreim', quelle: Q(41), bild: ['WSWSWWSWS|a', 'WSWSWS|b', 'WSWWSWSWS|a', 'WSWSWWS|b'] },
  { ebene: 'Strophenform', name: 'Schweifreimstrophe', text: 'sechs Zeilen, zwei Reimpaare, die je eine Zeile umschließen: aabccb', quelle: Q(90), bild: ['WSWSWSWS|a', 'WSWSWSWS|a', 'WSWSWSW|b', 'WSWSWSWS|c', 'WSWSWSWS|c', 'WSWSWSW|b'] },
  { ebene: 'Strophenform', name: 'Ritornell', text: 'drei Zeilen, die erste kurz, erste und dritte reimen', quelle: Q(43), bild: ['SWWSW|a', J5w + '|x', J5w + '|a'] },
  { ebene: 'Strophenform', name: 'Terzine', text: 'Dreizeiler aba bcb cdc …, der mittlere Reim kehrt in der nächsten Strophe außen wieder', quelle: Q(42), bild: [J5w + '|a', J5w + '|b', J5w + '|a', '', J5w + '|b', J5w + '|c', J5w + '|b', '', J5w + '|c', J5w + '|d', J5w + '|c'] },
  { ebene: 'Strophenform', name: 'Stanze', text: 'acht fünfhebige Jamben, dreimal Kreuzreim, dann ein Reimpaar', quelle: Q(46), bild: [J5w + '|a', J5m + '|b', J5w + '|a', J5m + '|b', J5w + '|a', J5m + '|b', J5w + '|c', J5w + '|c'] },
  { ebene: 'Strophenform', name: 'Siziliane', text: 'acht fünfhebige Jamben, viermal Kreuzreim auf nur zwei Klänge', quelle: Q(48), bild: [J5w + '|a', J5m + '|b', J5w + '|a', J5m + '|b', J5w + '|a', J5m + '|b', J5w + '|a', J5m + '|b'] },
  { ebene: 'Strophenform', name: 'Spenser-Stanze', text: 'neun Zeilen ababbcbc c, die letzte eine Hebung länger', quelle: Q('48 f.'), bild: [J5m + '|a', J5m + '|b', J5m + '|a', J5m + '|b', J5m + '|b', J5m + '|c', J5m + '|b', J5m + '|c', J5m + 'WS|c'] },
  { ebene: 'Strophenform', name: 'Sonett', text: '14 Zeilen: zwei Vierzeiler und zwei Dreizeiler, meist fünfhebig jambisch', quelle: Q(62), bild: [J5w + '|a', J5m + '|b', J5m + '|b', J5w + '|a', '', J5w + '|a', J5m + '|b', J5m + '|b', J5w + '|a', '', J5w + '|c', J5m + '|d', J5w + '|c', '', J5m + '|d', J5w + '|c', J5m + '|d'] },
  { ebene: 'Strophenform', name: 'Triolett', text: 'acht Zeilen auf zwei Reime; die erste kehrt als vierte und siebte wieder, die zweite als achte', quelle: Q(53), bild: ['WSWSWSWS|A', 'WSWSWSWSW|B', 'WSWSWSWS|a', 'WSWSWSWS|A', 'WSWSWSWS|a', 'WSWSWSWSW|b', 'WSWSWSWS|A', 'WSWSWSWSW|B'] },
  { ebene: 'Strophenform', name: 'Ghasel', text: 'Verspaare; nach dem ersten Reimpaar reimen alle geraden Zeilen auf denselben Klang, die ungeraden nicht', quelle: Q(56), bild: [J5m + '|a', J5m + '|a', J5w + '|x', J5m + '|a', J5w + '|x', J5m + '|a'] },
  { ebene: 'Strophenform', name: 'Distichon', text: 'ein Hexameter und ein Pentameter', quelle: Q(49), bild: ['SWWSWWSWWSWWSWWSW|x', 'SWWSWWS/SWWSWWS|x'] },
  { ebene: 'Strophenform', name: 'sapphische Odenstrophe', text: 'drei elfsilbige Verse und ein kurzer Schlussvers, ohne Reim', quelle: QODE, bild: ['SWSWSWWSWSW|x', 'SWSWSWWSWSW|x', 'SWSWSWWSWSW|x', 'SWWSW|x'] },
  { ebene: 'Strophenform', name: 'alkäische Odenstrophe', text: 'zwei Elfsilbler, ein jambischer Neunsilbler, ein fallender Zehnsilbler, ohne Reim', quelle: QODE, bild: ['WSWSWSWWSWS|x', 'WSWSWSWWSWS|x', 'WSWSWSWSW|x', 'SWWSWWSWSW|x'] },
  { ebene: 'Strophenform', name: 'asklepiadeische Odenstrophe', text: 'zwei Zwölfsilbler mit zwei Hebungen nebeneinander in der Mitte, dann sieben und acht Silben, ohne Reim', quelle: QODE, bild: ['SWSWWS/SWWSWS|x', 'SWSWWS/SWWSWS|x', 'SWSWWSW|x', 'SWSWWSWS|x'] },
  { ebene: 'Strophenform', name: 'Common Metre', text: 'englische Balladenstrophe: vier Zeilen mit 4-3-4-3 Hebungen, Kreuzreim oder nur Zeile 2 und 4', quelle: QEN, bild: ['WSWSWSWS|x', 'WSWSWS|a', 'WSWSWSWS|x', 'WSWSWS|a'] },
  { ebene: 'Strophenform', name: 'Short Metre', text: 'vier Zeilen mit 3-3-4-3 Hebungen', quelle: QEN, bild: ['WSWSWS|x', 'WSWSWS|a', 'WSWSWSWS|x', 'WSWSWS|a'] },
  { ebene: 'Strophenform', name: 'Long Metre', text: 'vier jambische Vierheber, Kreuz- oder Paarreim', quelle: QEN, bild: ['WSWSWSWS|a', 'WSWSWSWS|b', 'WSWSWSWS|a', 'WSWSWSWS|b'] },
  { ebene: 'Strophenform', name: 'Heroic Couplets', text: 'fünfhebige Jamben in Reimpaaren', quelle: QEN, bild: [J5m + '|a', J5m + '|a'] },
  { ebene: 'Strophenform', name: 'Rhyme Royal', text: 'sieben fünfhebige Jamben, Reim ababbcc', quelle: QEN, bild: [J5m + '|a', J5m + '|b', J5m + '|a', J5m + '|b', J5m + '|b', J5m + '|c', J5m + '|c'] },
  { ebene: 'Strophenform', name: 'Limerick', text: 'fünf Zeilen, Reim aabba, die dritte und vierte kürzer', quelle: QEN, bild: ['WSWWSWWS|a', 'WSWWSWWS|a', 'WSWWS|b', 'WSWWS|b', 'WSWWSWWS|a'] },
];
