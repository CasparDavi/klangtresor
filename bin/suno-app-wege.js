#!/usr/bin/env node
/* Die Wege der Suno-App (Android) aus ihren dex-Dateien lesen.

   Warum: Die Web-App (suno.com) kennt keinen Weg zu allen Personen, die
   einen Titel geherzt haben - die Handy-App zeigt sie. Also hat die App
   Wege, die nicht in den Web-Skripten stecken. Statt zu raten oder an
   Endpunkte anzuklopfen (schlafende Hunde), lesen wir sie aus der App
   selbst: Retrofit-Schnittstellen tragen Verb und Pfad als Annotation,
   kotlinx.serialization-Klassen ihre Feldnamen im <clinit> des
   $$serializer. Beides steht im dex-Format, das hier ohne fremde
   Werkzeuge gelesen wird. KEIN Netz, KEINE Ausfuehrung von App-Code.

   Aufruf: node bin/suno-app-wege.js <ordner mit classes*.dex> [ausgabe.json]
   Ausgabe: JSON { dienste: { klasse: { fremd, methoden: [ {name, verb, pfad, params, antwort} ] } },
                   schemata: { klasse: [ feldnamen in Reihenfolge ] },
                   zuordnung: { verben, methodenArten } }
   und auf stdout eine Lesefassung der Dienste.

   Format nach https://source.android.com/docs/core/runtime/dex-format.
   Gegengelesen 08.09.2026 (zwei adversariale Leser, Befunde eingearbeitet):
   alle Klassen, nicht nur com/suno (R8 benennt Schnittstellen um);
   Parameter-Arten aus den Elementen der Annotationsklassen; HEAD-Rueckfall;
   MUTF-8; Vorzeichen in encoded_value; Rueckgabetyp aus der Signature. */
'use strict';
const fs = require('fs'), path = require('path');

/* uleb128 - ohne Bit-Verschiebung ueber 31 Bit hinaus */
function uleb(b, p) { let r = 0, s = 0, x; do { x = b[p++]; r += (x & 0x7f) * 2 ** s; s += 7; } while (x & 0x80); return [r, p]; }

/* MUTF-8: U+0000 als C0 80, Zeichen ausserhalb der BMP als zwei 3-Byte-
   Surrogate. Node's utf8 macht daraus U+FFFD - deshalb von Hand. */
function mutf8(b, p, e) {
  let s = '';
  while (p < e) {
    const x = b[p];
    if (x < 0x80) { s += String.fromCharCode(x); p += 1; }
    else if ((x & 0xe0) === 0xc0) { s += String.fromCharCode(((x & 0x1f) << 6) | (b[p + 1] & 0x3f)); p += 2; }
    else if ((x & 0xf0) === 0xe0) { s += String.fromCharCode(((x & 0x0f) << 12) | ((b[p + 1] & 0x3f) << 6) | (b[p + 2] & 0x3f)); p += 3; }
    else { s += '�'; p += 1; }
  }
  return s;
}

/* Breite jeder Dalvik-Anweisung in 16-Bit-Einheiten, nach Opcode. */
const WIDTH = new Array(256).fill(1);
const set = (von, bis, w) => { for (let o = von; o <= bis; o++) WIDTH[o] = w; };
set(0x02, 0x02, 2); set(0x03, 0x03, 3); set(0x05, 0x05, 2); set(0x06, 0x06, 3); set(0x08, 0x08, 2); set(0x09, 0x09, 3);
set(0x13, 0x13, 2); set(0x14, 0x14, 3); set(0x15, 0x16, 2); set(0x17, 0x17, 3); set(0x18, 0x18, 5); set(0x19, 0x1a, 2);
set(0x1b, 0x1b, 3); set(0x1c, 0x1c, 2); set(0x1f, 0x20, 2); set(0x22, 0x23, 2); set(0x24, 0x26, 3); set(0x29, 0x29, 2);
set(0x2a, 0x2c, 3); set(0x2d, 0x3d, 2); set(0x44, 0x6d, 2); set(0x6e, 0x72, 3); set(0x74, 0x78, 3); set(0x90, 0xaf, 2);
set(0xd0, 0xe2, 2); set(0xfa, 0xfb, 4); set(0xfc, 0xfd, 3); set(0xfe, 0xff, 2);

class Dex {
  constructor(buf) {
    this.b = buf; const u = o => buf.readUInt32LE(o);
    this.strOff = u(0x3c); this.typeOff = u(0x44); this.protoOff = u(0x4c);
    this.methOff = u(0x5c); this.classN = u(0x60); this.classOff = u(0x64);
    this.strCache = new Map();
  }
  str(i) {
    if (this.strCache.has(i)) return this.strCache.get(i);
    const o = this.b.readUInt32LE(this.strOff + 4 * i); const [, p] = uleb(this.b, o);
    const e = this.b.indexOf(0, p); const s = mutf8(this.b, p, e);
    this.strCache.set(i, s); return s;
  }
  type(i) { return this.str(this.b.readUInt32LE(this.typeOff + 4 * i)); }
  proto(i) {
    const o = this.protoOff + 12 * i; const ret = this.type(this.b.readUInt32LE(o + 4));
    const po = this.b.readUInt32LE(o + 8); const params = [];
    if (po) { const n = this.b.readUInt32LE(po); for (let k = 0; k < n; k++) params.push(this.type(this.b.readUInt16LE(po + 4 + 2 * k))); }
    return { ret, params };
  }
  method(i) {
    const o = this.methOff + 8 * i;
    return { cls: this.type(this.b.readUInt16LE(o)), proto: this.proto(this.b.readUInt16LE(o + 2)), name: this.str(this.b.readUInt32LE(o + 4)) };
  }
  encodedValue(p) {
    const b = this.b; const t = b[p] & 0x1f, a = b[p] >> 5; p++;
    const n = a + 1;
    const le = () => { let v = 0; for (let k = 0; k < n; k++) v += b[p + k] * 2 ** (8 * k); return v; };
    const vorzeichen = () => { let v = le(); if (n < 8 && v >= 2 ** (8 * n - 1)) v -= 2 ** (8 * n); return v; };
    const rechtsGefuellt = breite => { const h = Buffer.alloc(breite); b.copy(h, breite - n, p, p + n); return h; };
    switch (t) {
      case 0x00: return [b.readInt8(p), p + 1];
      case 0x02: case 0x04: case 0x06: return [vorzeichen(), p + n];   /* short, int, long: vorzeichenerweitert */
      case 0x03: return [le(), p + n];                                 /* char */
      case 0x10: return [rechtsGefuellt(4).readFloatLE(0), p + n];     /* float: rechts mit Nullen gefuellt */
      case 0x11: return [rechtsGefuellt(8).readDoubleLE(0), p + n];    /* double */
      case 0x15: case 0x16: case 0x18: case 0x19: case 0x1a: case 0x1b: return [{ ref: t, idx: le() }, p + n];
      case 0x17: return [this.str(le()), p + n];
      case 0x1c: { let [m, q] = uleb(b, p); const arr = []; for (let k = 0; k < m; k++) { const [v, q2] = this.encodedValue(q); arr.push(v); q = q2; } return [arr, q]; }
      case 0x1d: return this.encodedAnnotation(p);
      case 0x1e: return [null, p];
      case 0x1f: return [a !== 0, p];
      default: throw new Error('encoded_value type ' + t);
    }
  }
  encodedAnnotation(p) {
    let [ti, q] = uleb(this.b, p); let n; [n, q] = uleb(this.b, q); const el = {};
    for (let k = 0; k < n; k++) { const [ni, q3] = uleb(this.b, q); const [v, q4] = this.encodedValue(q3); el[this.str(ni)] = v; q = q4; }
    return [{ type: this.type(ti), el }, q];
  }
  annotationSet(off) {
    const out = []; if (!off) return out; const n = this.b.readUInt32LE(off);
    for (let k = 0; k < n; k++) { const ao = this.b.readUInt32LE(off + 4 + 4 * k); out.push(this.encodedAnnotation(ao + 1)[0]); }
    return out;
  }
  *classes() {
    for (let i = 0; i < this.classN; i++) {
      const o = this.classOff + 32 * i;
      yield { name: this.type(this.b.readUInt32LE(o)), annOff: this.b.readUInt32LE(o + 20), dataOff: this.b.readUInt32LE(o + 24) };
    }
  }
  classData(off) {
    const r = { direct: [], virtual: [] }; if (!off) return r; let p = off, sf, inf, dm, vm;
    [sf, p] = uleb(this.b, p); [inf, p] = uleb(this.b, p); [dm, p] = uleb(this.b, p); [vm, p] = uleb(this.b, p);
    for (let k = 0; k < sf + inf; k++) { let d; [d, p] = uleb(this.b, p); [d, p] = uleb(this.b, p); }
    for (const [key, cnt] of [['direct', dm], ['virtual', vm]]) {
      let idx = 0;
      for (let k = 0; k < cnt; k++) { let d, f, c; [d, p] = uleb(this.b, p); [f, p] = uleb(this.b, p); [c, p] = uleb(this.b, p); idx += d; r[key].push({ idx, flags: f, codeOff: c }); }
    }
    return r;
  }
  methodAnnotations(annOff) {
    const r = { methods: new Map(), params: new Map() }; if (!annOff) return r; const b = this.b;
    const fN = b.readUInt32LE(annOff + 4), mN = b.readUInt32LE(annOff + 8), pN = b.readUInt32LE(annOff + 12);
    let p = annOff + 16 + 8 * fN;
    for (let k = 0; k < mN; k++, p += 8) r.methods.set(b.readUInt32LE(p), this.annotationSet(b.readUInt32LE(p + 4)));
    for (let k = 0; k < pN; k++, p += 8) {
      const mi = b.readUInt32LE(p), lo = b.readUInt32LE(p + 4); const n = b.readUInt32LE(lo); const list = [];
      for (let j = 0; j < n; j++) list.push(this.annotationSet(b.readUInt32LE(lo + 4 + 4 * j)));
      r.params.set(mi, list);
    }
    return r;
  }
  /* const-string und instance-of einer Methode, in Reihenfolge des Codes:
     [{art:'str', wert}, {art:'typ', wert}]. Mehr braucht es nicht - die
     Feldnamen eines Serializers sind const-strings, und Retrofits Parser
     prueft Annotationen per instance-of und legt gleich danach das Verb
     als const-string ab (RequestFactory.parseMethodAnnotation). */
  codeEvents(codeOff) {
    const out = []; if (!codeOff) return out; const b = this.b;
    const n = b.readUInt32LE(codeOff + 12); const base = codeOff + 16; let i = 0;
    while (i < n) {
      const op = b[base + 2 * i], u = b.readUInt16LE(base + 2 * i);
      if (op === 0x00 && (u === 0x0100 || u === 0x0200 || u === 0x0300)) {   /* Sprungtabellen / Array-Daten */
        if (u === 0x0100) i += b.readUInt16LE(base + 2 * i + 2) * 2 + 4;
        else if (u === 0x0200) i += b.readUInt16LE(base + 2 * i + 2) * 4 + 2;
        else { const w = b.readUInt16LE(base + 2 * i + 2), sz = b.readUInt32LE(base + 2 * i + 4); i += Math.floor((sz * w + 1) / 2) + 4; }
        continue;
      }
      if (op === 0x1a) out.push({ art: 'str', wert: this.str(b.readUInt16LE(base + 2 * i + 2)) });
      else if (op === 0x1b) out.push({ art: 'str', wert: this.str(b.readUInt32LE(base + 2 * i + 2)) });
      else if (op === 0x20) out.push({ art: 'typ', wert: this.type(b.readUInt16LE(base + 2 * i + 2)) });
      i += WIDTH[op];
    }
    return out;
  }
  constStrings(codeOff) { return this.codeEvents(codeOff).filter(e => e.art === 'str').map(e => e.wert); }
}

/* Alle dex-Dateien eines Ordners mit einem Klassenverzeichnis:
   Typdeskriptor -> { dex, klasse }. */
function laden(ordner) {
  const dateien = fs.readdirSync(ordner).filter(x => /^classes\d*\.dex$/.test(x)).sort();
  if (!dateien.length) throw new Error('keine classes*.dex in ' + ordner);
  const dexe = dateien.map(f => new Dex(fs.readFileSync(path.join(ordner, f))));
  const klassen = new Map();
  for (const dex of dexe) for (const c of dex.classes()) klassen.set(c.name, { dex, c });
  return { dexe, klassen };
}
/* Namen der Methoden einer Klasse - bei Annotationsklassen sind die
   virtuellen ihre Elemente (value, encoded, ...). */
function methodenNamen(klassen, typ) {
  const k = klassen.get(typ); if (!k) return null;
  const data = k.dex.classData(k.c.dataOff);
  return { direct: data.direct.map(m => k.dex.method(m.idx).name), virtual: data.virtual.map(m => k.dex.method(m.idx).name) };
}
/* Alle const-strings aller Methoden einer Klasse (fuer Erkennungen wie
   "kotlin.Unit" oder "Response{protocol="). */
function klassenStrings(klassen, typ) {
  const k = klassen.get(typ); if (!k) return [];
  const data = k.dex.classData(k.c.dataOff); const out = [];
  for (const m of [...data.direct, ...data.virtual]) out.push(...k.dex.constStrings(m.codeOff));
  return out;
}

/* Retrofits Annotationsklassen heissen nach R8 anders (Lji5; statt
   Lretrofit2/http/GET;). Die Zuordnung steht im Code von Retrofit selbst,
   RequestFactory.Builder (nach R8 eine Methode, in der alles inliniert
   ist): parseMethodAnnotation prueft "annotation instanceof DELETE" und
   ruft parseHttpMethodAndPath("DELETE") - je Verb ein instance-of, gefolgt
   vom Verb als const-string. R8 zieht eine Konstante ("HEAD") vor die
   Kette; das uebrige Verb bekommt den uebrigen Typ INNERHALB der
   Verb-Kette. Nach dem letzten Verb folgen die instance-of-Pruefungen in
   Retrofits Quellreihenfolge, die R8 nicht umsortiert (if/else-if-Kette):
   HTTP, Headers, Multipart, FormUrlEncoded (parseMethodAnnotation), dann
   Url, Path, Query, QueryName, QueryMap, Header, HeaderMap, Field,
   FieldMap, Part, PartMap, Body, Tag (parseParameterAnnotation);
   java/*-Typen dazwischen sind Typpruefungen der Parameter, keine
   Annotationen. Die Methode ist die mit den meisten Typ-Verb-Paaren -
   andere Klassen (HTTP-Aufzaehlungen) tragen dieselben sieben Woerter,
   aber ohne instance-of davor. Belegt 08.09.2026 durch zwei unabhaengige
   Disassemblies (Gegenleser) fuer alle 17 Namen. */
const VERBEN = ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT', 'OPTIONS'];
const KETTE = ['HTTP', 'Headers', 'Multipart', 'FormUrlEncoded',
               'Url', 'Path', 'Query', 'QueryName', 'QueryMap', 'Header', 'HeaderMap', 'Field', 'FieldMap', 'Part', 'PartMap', 'Body', 'Tag'];
function retrofitZuordnung(dexe) {
  let beste = null, bestePaare = 0;
  for (const dex of dexe) {
    for (const c of dex.classes()) {
      const data = dex.classData(c.dataOff);
      for (const m of [...data.direct, ...data.virtual]) {
        if (!m.codeOff) continue;
        const ev = dex.codeEvents(m.codeOff);
        const strs = ev.filter(e => e.art === 'str').map(e => e.wert);
        if (!VERBEN.every(v => strs.includes(v))) continue;
        let paare = 0;
        for (let i = 1; i < ev.length; i++) if (ev[i - 1].art === 'typ' && ev[i].art === 'str' && VERBEN.includes(ev[i].wert)) paare++;
        if (paare > bestePaare) { bestePaare = paare; beste = ev; }
      }
    }
  }
  const verben = new Map(), arten = new Map();
  if (!beste || bestePaare < 4) return { verben, arten, paare: bestePaare };
  let letztesVerb = -1;
  for (let i = 0; i < beste.length; i++) if (beste[i].art === 'str' && VERBEN.includes(beste[i].wert)) letztesVerb = i;
  const uebrigeVerben = [], uebrigeTypen = []; let offen = null;
  for (let i = 0; i <= letztesVerb; i++) {
    const e = beste[i];
    if (e.art === 'typ') { if (offen) uebrigeTypen.push(offen); offen = e.wert; continue; }
    if (!VERBEN.includes(e.wert)) continue;
    if (offen) { verben.set(offen, e.wert); offen = null; } else uebrigeVerben.push(e.wert);
  }
  if (offen) uebrigeTypen.push(offen);
  if (uebrigeVerben.length === 1 && uebrigeTypen.length === 1) verben.set(uebrigeTypen[0], uebrigeVerben[0]);
  const danach = beste.slice(letztesVerb + 1).filter(e => e.art === 'typ' && !e.wert.startsWith('Ljava/')).map(e => e.wert);
  KETTE.forEach((name, i) => { if (danach[i] && !arten.has(danach[i])) arten.set(danach[i], name); });
  return { verben, arten, paare: bestePaare };
}

/* Gegenprobe zur Kette: die Art eines Parameters aus den ELEMENTEN
   seiner Annotationsklasse (Retrofit 2.x): Path/Query/Field {value,
   encoded}; Header {value, allowUnsafeNonAsciiValues}; HeaderMap
   {allowUnsafeNonAsciiValues}; QueryMap/FieldMap {encoded}; Part {value,
   encoding}; PartMap {encoding}; Body/Url/Tag ohne Elemente. Path gegen
   Query entscheidet der Pfad, Field gegen Query die Methode
   (@FormUrlEncoded), Url gegen Body das Fehlen des Pfads. Widerspricht
   die Kette den Elementen, steht beides in der Ausgabe ("Path?Query"). */
function paramArt(elemente, wert, pfad, formular) {
  const hat = x => elemente.includes(x);
  if (hat('value') && hat('encoded')) return pfad != null && wert != null && pfad.includes('{' + wert + '}') ? 'Path' : (formular ? 'Field' : 'Query');
  if (hat('value') && hat('allowUnsafeNonAsciiValues')) return 'Header';
  if (hat('allowUnsafeNonAsciiValues')) return 'HeaderMap';
  if (hat('encoded')) return formular ? 'FieldMap' : 'QueryMap';
  if (hat('value') && hat('encoding')) return 'Part';
  if (hat('encoding')) return 'PartMap';
  if (!elemente.length) return pfad == null ? 'Url' : 'Body';
  return '?' + elemente.join('/');
}

/* Einen Typ aus einer Signature lesen: Lcom/x/Y; oder Lcom/x/Y<+Lz;>; ,
   Arrays, Primitive, Wildcards. Liefert lesbaren Text und Endposition. */
function typLesen(s, i) {
  if (s[i] === '+' || s[i] === '-') i++;
  if (s[i] === '*') return { text: '*', ende: i + 1 };
  if (s[i] === '[') { const t = typLesen(s, i + 1); return { text: t.text + '[]', ende: t.ende }; }
  if (s[i] !== 'L') return { text: s[i], ende: i + 1 };
  let j = i + 1; while (j < s.length && s[j] !== ';' && s[j] !== '<') j++;
  const name = s.slice(i + 1, j).replace(/\//g, '.');
  if (s[j] === '<') {
    j++; const args = [];
    while (j < s.length && s[j] !== '>') { const t = typLesen(s, j); args.push(t.text); j = t.ende; }
    j++; if (s[j] === ';') j++;
    return { text: name + '<' + args.join(', ') + '>', ende: j };
  }
  return { text: name, ende: j + 1 };
}

function lesen(ordner) {
  const { dexe, klassen } = laden(ordner);
  const { verben, arten } = retrofitZuordnung(dexe);
  const verbTypen = new Set(verben.keys());
  const artTyp = name => [...arten].find(([, n]) => n === name)?.[0];
  const elementeCache = new Map();
  const elemente = typ => { if (!elementeCache.has(typ)) { const m = methodenNamen(klassen, typ); elementeCache.set(typ, m ? m.virtual : []); } return elementeCache.get(typ); };
  /* Umbenannte Hilfstypen in Antworten lesbar machen. */
  const typNamen = new Map();
  const typName = t => {
    if (typNamen.has(t)) return typNamen.get(t);
    let n = t.replace(/^com\.suno\.android\.common_networking\.remote\./, '');
    if (!/[./]/.test(t)) {                         /* kurz und umbenannt: nachsehen, was es ist */
      const desc = 'L' + t + ';'; const s = klassenStrings(klassen, desc); const m = methodenNamen(klassen, desc);
      if (s.includes('kotlin.Unit')) n = 'Unit';
      else if (s.some(x => x.startsWith('Response{protocol='))) n = 'Response';
      else if (m && m.virtual.length === 1 && m.virtual[0] === 'collect') n = 'Flow';
    }
    typNamen.set(t, n); return n;
  };
  const lesbar = text => text.replace(/[A-Za-z0-9_.$]+/g, w => typName(w)).replace(/java\.util\.List/g, 'List').replace(/java\.lang\./g, '');

  const dienste = {}, schemata = {};
  for (const dex of dexe) {
    for (const c of dex.classes()) {
      const ann = dex.methodAnnotations(c.annOff);
      const kurz = c.name.slice(1, -1).replace(/\//g, '.');
      if (ann.methods.size) {
        const data = dex.classData(c.dataOff); const methoden = [];
        for (const m of [...data.direct, ...data.virtual]) {
          const anns = ann.methods.get(m.idx) || [];
          const http = anns.find(a => verbTypen.has(a.type) || arten.get(a.type) === 'HTTP' || ('method' in a.el && 'path' in a.el));
          if (!http) continue;
          const mi = dex.method(m.idx);
          const verb = verben.get(http.type) || http.el.method || '?';
          const pfad = http.el.value != null ? http.el.value : (http.el.path != null ? http.el.path : null);
          const kodierung = anns.map(a => arten.get(a.type)).filter(x => x === 'Multipart' || x === 'FormUrlEncoded');
          const formular = kodierung.includes('FormUrlEncoded');
          const params = (ann.params.get(m.idx) || []).map((s, k) => {
            const p = s.find(a => !a.type.startsWith('Ldalvik/') && !a.type.startsWith('Lkotlin/')); if (!p) return null;
            /* Die Kette sagt, welche Annotation es ist; die Elemente der
               Annotationsklasse muessen dazu passen (Path/Query/Field:
               value+encoded usw.) - sonst steht der Widerspruch dran. */
            const lautKette = arten.get(p.type), el = elemente(p.type);
            const passt = { Url: '', Body: '', Tag: '', Path: 'value,encoded', Query: 'value,encoded', QueryName: 'value,encoded', Field: 'value,encoded',
                            QueryMap: 'encoded', FieldMap: 'encoded', Header: 'value,allowUnsafeNonAsciiValues', HeaderMap: 'allowUnsafeNonAsciiValues',
                            Part: 'value,encoding', PartMap: 'encoding' };
            const elSig = ['value', 'encoded', 'allowUnsafeNonAsciiValues', 'encoding'].filter(x => el.includes(x)).join(',');
            const art = !lautKette ? paramArt(el, p.el.value, pfad, formular)
                      : (passt[lautKette] === elSig ? lautKette : lautKette + '?' + paramArt(el, p.el.value, pfad, formular));
            return { art, name: p.el.value, typ: lesbar(typLesen(mi.proto.params[k], 0).text) };
          }).filter(Boolean);
          const kopf = anns.find(a => arten.get(a.type) === 'Headers');
          /* Antwort: bei suspend-Funktionen steckt sie in der Continuation
             (Either<CallError, X>), sonst ist es der Rueckgabetyp. */
          const sig = anns.find(a => a.type === 'Ldalvik/annotation/Signature;');
          let antwort;
          if (sig) {
            const s = sig.el.value.join('');
            const ce = s.indexOf('CallError;');
            antwort = ce >= 0 ? typLesen(s, ce + 'CallError;'.length).text : typLesen(s, s.indexOf(')') + 1).text;
          } else antwort = typLesen(mi.proto.ret, 0).text;
          methoden.push({ name: mi.name, verb, pfad, params, kodierung: kodierung.length ? kodierung : undefined,
                          kopfzeilen: kopf ? kopf.el.value : undefined, antwort: lesbar(antwort) });
        }
        if (methoden.length) dienste[kurz] = { fremd: !c.name.startsWith('Lcom/suno/'), methoden };
      }
      if (/\$\$serializer;$/.test(c.name)) {
        const data = dex.classData(c.dataOff);
        const clinit = data.direct.find(m => dex.method(m.idx).name === '<clinit>');
        if (clinit) schemata[kurz.replace(/\$\$serializer$/, '')] = dex.constStrings(clinit.codeOff);
      }
    }
  }
  return { dienste, schemata, zuordnung: { verben: Object.fromEntries(verben), arten: Object.fromEntries(arten) } };
}

if (require.main === module) {
  const ordner = process.argv[2], ausgabe = process.argv[3];
  if (!ordner) { console.error('Aufruf: node bin/suno-app-wege.js <ordner mit classes*.dex> [ausgabe.json]'); process.exit(2); }
  const r = lesen(ordner);
  if (ausgabe) fs.writeFileSync(ausgabe, JSON.stringify(r, null, 1));
  let n = 0, nSuno = 0, dSuno = 0;
  const drucken = (k, d) => {
    console.log('\n' + k.replace(/^com\.suno\.android\./, '') + (d.fremd ? '   (fremd: nicht com.suno)' : ''));
    for (const m of d.methoden) {
      n++; if (!d.fremd) nSuno++;
      const p = m.params.map(x => `${x.art}${x.name ? '(' + x.name + ')' : ''}${x.art === 'Body' || x.art === 'Url' ? ':' + x.typ : ''}`).join(', ');
      const pfad = m.pfad != null ? m.pfad : '(@Url)';
      console.log(`  ${m.verb.padEnd(6)} ${pfad}${p ? '   [' + p + ']' : ''}${m.kodierung ? '   {' + m.kodierung.join(',') + '}' : ''}   -> ${m.name}  => ${m.antwort}`);
    }
  };
  const eintraege = Object.entries(r.dienste).sort();
  for (const [k, d] of eintraege) if (!d.fremd) { dSuno++; drucken(k, d); }
  for (const [k, d] of eintraege) if (d.fremd) drucken(k, d);
  const sSuno = Object.keys(r.schemata).filter(k => k.startsWith('com.suno.')).length;
  console.log(`\nZuordnung Verben: ${JSON.stringify(r.zuordnung.verben)}`);
  console.log(`Zuordnung Annotationen: ${JSON.stringify(r.zuordnung.arten)}`);
  console.log(`${eintraege.length} Dienste (${dSuno} com.suno), ${n} Wege (${nSuno} com.suno), ${Object.keys(r.schemata).length} Schemata (${sSuno} com.suno)`);
}
module.exports = { lesen, Dex };
