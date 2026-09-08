#!/usr/bin/env node
/* Die Wege der Suno-App (Android) aus ihren dex-Dateien lesen.

   Warum: Die Web-App (suno.com) kennt keinen Weg zu allen Personen, die
   einen Titel geherzt haben - die Handy-App zeigt sie ("Gefaellt mir (12)").
   Also hat die App Wege, die nicht in den Web-Skripten stecken. Statt zu
   raten oder Endpunkte anzuklopfen (schlafende Hunde), lesen wir sie aus
   der App selbst: Retrofit-Schnittstellen tragen Verb und Pfad als
   Annotation, kotlinx.serialization-Klassen ihre Feldnamen im <clinit>
   des $$serializer. Beides steht im dex-Format, das hier ohne fremde
   Werkzeuge gelesen wird. KEIN Netz, KEINE Ausfuehrung von App-Code.

   Aufruf: node bin/suno-app-wege.js <ordner mit classes*.dex> [ausgabe.json]
   Ausgabe: JSON { dienste: { klasse: [ {name, verb, pfad, params, rueckgabe} ] },
                   schemata: { klasse: [ feldnamen in Reihenfolge ] } }
   und auf stdout eine Lesefassung der Dienste.

   Format nach https://source.android.com/docs/core/runtime/dex-format */
'use strict';
const fs = require('fs'), path = require('path');

/* uleb128 - ohne Bit-Verschiebung ueber 31 Bit hinaus */
function uleb(b, p) { let r = 0, s = 0, x; do { x = b[p++]; r += (x & 0x7f) * 2 ** s; s += 7; } while (x & 0x80); return [r, p]; }

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
    const e = this.b.indexOf(0, p); const s = this.b.toString('utf8', p, e);
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
    const le = n => { let v = 0; for (let k = 0; k < n; k++) v += b[p + k] * 2 ** (8 * k); return v; };
    switch (t) {
      case 0x00: return [b.readInt8(p), p + 1];
      case 0x02: case 0x03: case 0x04: case 0x06: case 0x10: case 0x11: return [le(a + 1), p + a + 1];
      case 0x15: case 0x16: case 0x18: case 0x19: case 0x1a: case 0x1b: return [{ ref: t, idx: le(a + 1) }, p + a + 1];
      case 0x17: return [this.str(le(a + 1)), p + a + 1];
      case 0x1c: { let [n, q] = uleb(b, p); const arr = []; for (let k = 0; k < n; k++) { const [v, q2] = this.encodedValue(q); arr.push(v); q = q2; } return [arr, q]; }
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

/* Retrofits Annotationsklassen heissen nach R8 anders (Lji5; statt
   Lretrofit2/http/GET;). Die Zuordnung steht aber im Code von Retrofit
   selbst: parseMethodAnnotation prueft "annotation instanceof DELETE" und
   ruft dann parseHttpMethodAndPath("DELETE", ...) auf - je Verb ein
   instance-of, gefolgt vom Verb als const-string. Bei den Parametern
   (parseParameterAnnotation) folgt auf jedes instance-of eine Fehlermeldung,
   die die Annotation nennt ("@Path parameters may not be used with @Url"). */
const VERBEN = ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT', 'OPTIONS'];
function retrofitZuordnung(dexe) {
  const verben = new Map(), paramArten = new Map();
  for (const dex of dexe) {
    for (const c of dex.classes()) {
      if (c.name.startsWith('Lcom/suno/')) continue;
      const data = dex.classData(c.dataOff);
      for (const m of [...data.direct, ...data.virtual]) {
        if (!m.codeOff) continue;
        const ev = dex.codeEvents(m.codeOff);
        const strs = ev.filter(e => e.art === 'str').map(e => e.wert);
        if (VERBEN.every(v => strs.includes(v))) {
          for (let i = 0; i < ev.length; i++)
            if (ev[i].art === 'typ' && ev[i + 1] && ev[i + 1].art === 'str' && VERBEN.includes(ev[i + 1].wert))
              verben.set(ev[i].wert, ev[i + 1].wert);
        }
        if (strs.some(s => /^@Body parameters cannot be used/.test(s))) {
          let offen = null;
          for (const e of ev) {
            if (e.art === 'typ') { offen = e.wert; continue; }
            const w = e.wert.match(/@([A-Z][A-Za-z]+)/);
            if (offen && w) { if (!paramArten.has(offen)) paramArten.set(offen, w[1]); offen = null; }
          }
        }
      }
    }
  }
  return { verben, paramArten };
}

function lesen(ordner) {
  const dienste = {}, schemata = {};
  const dateien = fs.readdirSync(ordner).filter(x => /^classes\d*\.dex$/.test(x)).sort();
  if (!dateien.length) throw new Error('keine classes*.dex in ' + ordner);
  const dexe = dateien.map(f => new Dex(fs.readFileSync(path.join(ordner, f))));
  const { verben, paramArten } = retrofitZuordnung(dexe);
  const verbTypen = new Set(verben.keys());
  for (const dex of dexe) {
    for (const c of dex.classes()) {
      if (!c.name.startsWith('Lcom/suno/')) continue;
      const kurz = c.name.slice(1, -1).replace(/\//g, '.');
      const ann = dex.methodAnnotations(c.annOff);
      if (ann.methods.size) {
        const data = dex.classData(c.dataOff); const methoden = [];
        for (const m of [...data.direct, ...data.virtual]) {
          const anns = ann.methods.get(m.idx) || [];
          /* Die HTTP-Annotation: ein Typ aus der Verb-Zuordnung mit value = Pfad;
             oder @HTTP mit method/path (hat drei Elemente). */
          const http = anns.find(a => verbTypen.has(a.type) || ('method' in a.el && 'path' in a.el));
          if (!http) continue;
          const mi = dex.method(m.idx);
          const verb = verben.get(http.type) || http.el.method || '?';
          const pfad = http.el.value != null ? http.el.value : http.el.path;
          const params = (ann.params.get(m.idx) || []).map((s, k) => {
            const p = s.find(a => !a.type.startsWith('Ldalvik/') && !a.type.startsWith('Lkotlin/')); if (!p) return null;
            /* Mit Wert: steht {wert} im Pfad, ist es @Path, sonst @Query (Header
               kommen in dieser App nicht als Parameter vor). Ohne Wert: @Body,
               es sei denn Retrofits Parser sagt @Url/@Tag/@Part. */
            const art = p.el.value == null ? (paramArten.get(p.type) || 'Body')
                      : (pfad.includes('{' + p.el.value + '}') ? 'Path' : 'Query');
            return { art, name: p.el.value, typ: mi.proto.params[k] };
          }).filter(Boolean);
          const kopf = anns.find(a => Array.isArray(a.el.value) && a.el.value.every(v => typeof v === 'string' && v.includes(':')));
          /* Signature-Annotation: der Rueckgabetyp hinter Either<CallError, X> */
          const sig = anns.find(a => a.type === 'Ldalvik/annotation/Signature;');
          const antwort = sig ? (sig.el.value.join('').match(/CallError;(L[^<;]+;)/) || [])[1] : null;
          methoden.push({ name: mi.name, verb, pfad, params, kopfzeilen: kopf ? kopf.el.value : undefined,
                          antwort: antwort ? antwort.slice(1, -1).replace(/\//g, '.') : mi.proto.ret });
        }
        if (methoden.length) dienste[kurz] = methoden;
      }
      if (/\$\$serializer;$/.test(c.name)) {
        const data = dex.classData(c.dataOff);
        const clinit = data.direct.find(m => dex.method(m.idx).name === '<clinit>');
        if (clinit) schemata[kurz.replace(/\$\$serializer$/, '')] = dex.constStrings(clinit.codeOff);
      }
    }
  }
  return { dienste, schemata, zuordnung: { verben: Object.fromEntries(verben), paramArten: Object.fromEntries(paramArten) } };
}

if (require.main === module) {
  const ordner = process.argv[2], ausgabe = process.argv[3];
  if (!ordner) { console.error('Aufruf: node bin/suno-app-wege.js <ordner mit classes*.dex> [ausgabe.json]'); process.exit(2); }
  const r = lesen(ordner);
  if (ausgabe) fs.writeFileSync(ausgabe, JSON.stringify(r, null, 1));
  let n = 0;
  for (const [k, ms] of Object.entries(r.dienste).sort()) {
    console.log('\n' + k.replace(/^com\.suno\.android\./, ''));
    for (const m of ms) {
      n++;
      const p = m.params.map(x => `${x.art}${x.name ? '(' + x.name + ')' : ''}`).join(', ');
      console.log(`  ${m.verb.padEnd(6)} ${m.pfad}${p ? '   [' + p + ']' : ''}   -> ${m.name}${m.antwort && !/^(java|kotlin)/.test(m.antwort) ? '  => ' + m.antwort.replace(/^com\.suno\.android\.common_networking\.remote\./, '') : ''}`);
    }
  }
  console.log(`\nZuordnung Verben: ${JSON.stringify(r.zuordnung.verben)}`);
  console.log(`Zuordnung Parameter: ${JSON.stringify(r.zuordnung.paramArten)}`);
  console.log(`${Object.keys(r.dienste).length} Dienste, ${n} Wege, ${Object.keys(r.schemata).length} Schemata`);
}
module.exports = { lesen, Dex };
