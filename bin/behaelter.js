/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/**
 * DER BEHÄLTER: viele Dateien als wenige große schreiben.
 *
 * Caspar_D, 09.09.2026: "das ist alles irre langsam ... irgendwas, was
 * diese Mikromengen auf großen Blöcken vermeidet" - "gut, dann arbeiten
 * wir mit Containern (Behältern)". Ein USB-Stick schreibt lange Dateien
 * mit 14 MB/s, aber jede einzelne Datei kostet ihn ein bis zwei Sekunden
 * (exFAT zieht je Datei Verzeichnis, Belegungstabelle und Bitmap nach,
 * lauter kleine verstreute Schreibzugriffe). 4.000 Dateien sind 4.000
 * Strafrunden. Deshalb kommt der Bestand als tar-Stücke auf den Stick:
 *
 *   bestand-001.tar, bestand-002.tar, ...   je höchstens 2 GB (FAT32 kann
 *                                           keine 4 GB), rein sequenziell
 *   bestand-index.ndjson                    das Verzeichnis: je Datei, wo
 *                                           sie liegt (Stück, Versatz, Länge)
 *
 * WARUM TAR: jedes Betriebssystem kann es auspacken, jede Datei trägt
 * ihren Kopf vor den Daten, deshalb ist auch ein halb geschriebenes Stück
 * bis zur letzten fertigen Datei lesbar - der Stick darf raus, sobald der
 * Export "angehalten" sagt. Und anhängen geht: Auffrischen schreibt nur
 * Geändertes hinten dran, Gelöschtes verschwindet aus dem Verzeichnis.
 * Was so zu Ballast wird, räumt verdichten() weg, wenn es zu viel ist.
 *
 * DAS VERZEICHNIS ist ein Zwischenspeicher, kein Original: es wird alle
 * paar Sekunden ganz neu geschrieben (ein Schreibvorgang statt einer je
 * Datei - sonst wäre der Stick wieder bei den Mikromengen). Fehlt am Ende
 * eines Stücks, was das Verzeichnis kennt, liest oeffnen() die tar-Köpfe
 * nach und ergänzt es (wiederherstellen). Reihenfolge = Schreibreihenfolge,
 * und die ist die Stufenreihenfolge des Exports.
 *
 * LESEN: der eingefrorene Server fragt eintrag(rel) und bekommt Stück,
 * Versatz und Länge - ein fs.createReadStream mit start/end, dieselbe
 * Mechanik wie bei einer echten Datei, auch für Byte-Bereiche des Players.
 *
 * Format: ustar (POSIX). Namen über 100 Byte bekommen einen pax-Vorsatz
 * ("x"-Eintrag mit path=), Größen bis 8 GB passen ins Oktalfeld. Kein
 * Besitzer, keine Rechte - ein Stick kennt beides nicht.
 */
'use strict';
const fs   = require('node:fs');
const path = require('node:path');

const BLOCK  = 512;
const KAPPE  = 2 * 1024 * 1024 * 1024 - 64 * 1024 * 1024;   /* 2 GiB minus Luft für Köpfe und Endblöcke */
const STUECK = 4 * 1024 * 1024;                              /* Kopierschritt: 4 MB je Meldung */
const INDEX  = 'bestand-index.ndjson';
const FORMAT = 'klangtresor-behaelter';
const volName = (n) => `bestand-${String(n).padStart(3, '0')}.tar`;
const aufBlock = (n) => Math.ceil(n / BLOCK) * BLOCK;

/* ---------------------------------------------------------------- tar-Köpfe */
function oktal(n, laenge) { return n.toString(8).padStart(laenge - 1, '0') + '\0'; }
/* Nur ASCII in den Namen des Kopfs - was länger oder fremd ist, steht im
   pax-Vorsatz; der Kopfname ist dann nur noch ein Hinweis fürs Auge. */
function kopfName(name) { return name.replace(/[^\x20-\x7e]/g, '_').slice(0, 100); }
function kopf(name, groesse, mtimeS, typ) {
  const b = Buffer.alloc(BLOCK);
  b.write(kopfName(name), 0, 100, 'latin1');
  b.write(oktal(0o644, 8), 100); b.write(oktal(0, 8), 108); b.write(oktal(0, 8), 116);
  b.write(oktal(groesse, 12), 124); b.write(oktal(Math.max(0, Math.floor(mtimeS)), 12), 136);
  b.write('        ', 148);
  b.write(typ, 156);
  b.write('ustar\0', 257); b.write('00', 263);
  b.write('klangtresor', 265); b.write('klangtresor', 297);
  let summe = 0; for (const x of b) summe += x;
  b.write(summe.toString(8).padStart(6, '0') + '\0 ', 148);
  return b;
}
/* Der pax-Vorsatz für Namen über 100 Byte: "LÄNGE path=NAME\n", die Länge
   zählt sich selbst mit. */
function paxVorsatz(name, mtimeS) {
  const rest = ` path=${name}\n`;
  let laenge = Buffer.byteLength(rest) + 1;
  while (String(laenge).length + Buffer.byteLength(rest) > laenge) laenge++;
  const daten = Buffer.from(String(laenge) + rest);
  const k = kopf('PaxHeader/' + name, daten.length, mtimeS, 'x');
  return Buffer.concat([k, daten, Buffer.alloc(aufBlock(daten.length) - daten.length)]);
}
/* Einen Kopf lesen: null, wenn Endblock oder Unsinn. */
function kopfLesen(b) {
  if (b.length < BLOCK || b.every(x => x === 0)) return null;
  const feld = (von, bis) => b.toString('latin1', von, bis).replace(/\0.*$/s, '').trim();
  const magie = b.toString('latin1', 257, 262);
  if (magie !== 'ustar') return null;
  let gemeldet = 0; for (let i = 0; i < BLOCK; i++) gemeldet += (i >= 148 && i < 156) ? 32 : b[i];
  const pruef = parseInt(feld(148, 156), 8);
  if (pruef !== gemeldet) return null;
  return { name: feld(0, 100), groesse: parseInt(feld(124, 136), 8) || 0, mtimeS: parseInt(feld(136, 148), 8) || 0, typ: b.toString('latin1', 156, 157) };
}

/* ---------------------------------------------------------------- Der Behälter */
class Behaelter {
  constructor(ordner) {
    this.ordner = ordner;
    this.eintraege = new Map();    /* rel -> { v, o, l, m } in Schreibreihenfolge */
    this.volumen = 0;              /* Zahl der Stücke */
    this.fd = null; this.fdNr = 0; this.offset = 0;
    this.indexStand = 0;           /* mtime des Verzeichnisses beim Lesen */
    this.zuletztGeschrieben = 0;
    this.schmutzig = false;
  }
  static gibtEs(ordner) {
    try { return fs.existsSync(path.join(ordner, INDEX)) || fs.existsSync(path.join(ordner, volName(1))); } catch (e) { return false; }
  }
  /* Öffnen: Verzeichnis lesen, fehlende Köpfe nachlesen. Zum Schreiben
     (schreibbar=true) wird das letzte Stück zum Anhängen geöffnet. */
  static oeffnen(ordner, schreibbar) {
    const b = new Behaelter(ordner);
    b.schreibbar = !!schreibbar;
    if (schreibbar) fs.mkdirSync(ordner, { recursive: true });
    b.indexLesen();
    b.wiederherstellen();
    return b;
  }
  volPfad(n) { return path.join(this.ordner, volName(n)); }
  indexPfad() { return path.join(this.ordner, INDEX); }

  indexLesen() {
    this.eintraege = new Map(); this.volumen = 0;
    let text = ''; try { text = fs.readFileSync(this.indexPfad(), 'utf8'); this.indexStand = fs.statSync(this.indexPfad()).mtimeMs; } catch (e) { text = ''; }
    for (const zeile of text.split('\n')) {
      if (!zeile.trim()) continue;
      let z; try { z = JSON.parse(zeile); } catch (e) { continue; }   /* eine halbe letzte Zeile ist kein Fehler */
      if (z.format === FORMAT) { this.volumen = z.volumen || 0; continue; }
      if (!z.p) continue;
      if (z.weg) { this.eintraege.delete(z.p); continue; }
      this.eintraege.delete(z.p);
      this.eintraege.set(z.p, { v: z.v, o: z.o, l: z.l, m: z.m });
    }
    /* Stücke, die da sind, aber im Verzeichnis fehlen (Verzeichnis zu alt) */
    for (let n = this.volumen + 1; fs.existsSync(this.volPfad(n)); n++) this.volumen = n;
  }
  /* Was hinter dem letzten bekannten Eintrag eines Stücks noch liegt,
     wird aus den Köpfen ergänzt. */
  wiederherstellen() {
    for (let n = 1; n <= this.volumen; n++) {
      let groesse = 0; try { groesse = fs.statSync(this.volPfad(n)).size; } catch (e) { continue; }
      let bekannt = 0;
      for (const e of this.eintraege.values()) if (e.v === n) bekannt = Math.max(bekannt, e.o + aufBlock(e.l));
      if (bekannt + 2 * BLOCK >= groesse) continue;
      const fd = fs.openSync(this.volPfad(n), 'r');
      try {
        let pos = bekannt, paxName = null, ergaenzt = 0;
        const b = Buffer.alloc(BLOCK);
        while (pos + BLOCK <= groesse) {
          if (fs.readSync(fd, b, 0, BLOCK, pos) < BLOCK) break;
          const k = kopfLesen(b); if (!k) break;
          const datenAb = pos + BLOCK;
          if (datenAb + k.groesse > groesse) break;                 /* halbe Datei am Ende: gehört nicht dazu */
          if (k.typ === 'x') {
            const d = Buffer.alloc(k.groesse); fs.readSync(fd, d, 0, k.groesse, datenAb);
            const m = d.toString('utf8').match(/^\d+ path=(.*)\n/s); paxName = m ? m[1] : null;
          } else {
            const name = paxName || k.name; paxName = null;
            this.eintraege.delete(name);
            this.eintraege.set(name, { v: n, o: datenAb, l: k.groesse, m: k.mtimeS * 1000 });
            ergaenzt++;
          }
          pos = datenAb + aufBlock(k.groesse);
        }
        if (ergaenzt) this.schmutzig = true;
      } finally { fs.closeSync(fd); }
    }
    /* Nur zum Schreiben geöffnet wird das Verzeichnis ergänzt - ein Leser
       (der eingefrorene Server, womöglich auf einem schreibgeschützten
       Stick) behält das Wiederhergestellte im Speicher. */
    if (this.schmutzig && this.schreibbar) { try { this.indexSchreiben(true); } catch (e) { /* schreibgeschützt: bleibt im Speicher */ } }
  }
  indexSchreiben(erzwingen) {
    const jetzt = Date.now();
    if (!erzwingen && jetzt - this.zuletztGeschrieben < 5000) return;
    this.zuletztGeschrieben = jetzt;
    const zeilen = [JSON.stringify({ format: FORMAT, fassung: 1, volumen: this.volumen, stand: new Date().toISOString() })];
    for (const [p, e] of this.eintraege) zeilen.push(JSON.stringify({ p, v: e.v, o: e.o, l: e.l, m: e.m }));
    const tmp = this.indexPfad() + '.tmp';
    fs.writeFileSync(tmp, zeilen.join('\n') + '\n');
    fs.renameSync(tmp, this.indexPfad());
    this.schmutzig = false;
  }

  /* ---- Lesen */
  hat(rel) { return this.eintraege.has(rel); }
  eintrag(rel) { return this.eintraege.get(rel) || null; }
  liste(praefix) { const aus = []; for (const p of this.eintraege.keys()) if (!praefix || p.startsWith(praefix)) aus.push(p); return aus; }
  /* Gleich im Sinne von rsync -t: Größe gleich, Zeit bis auf zwei Sekunden. */
  gleich(rel, stat) { const e = this.eintraege.get(rel); return !!e && e.l === stat.size && Math.abs(e.m - stat.mtimeMs) <= 2000; }
  stream(rel, von, bis) {
    const e = this.eintraege.get(rel); if (!e) return null;
    const a = e.o + (von || 0), z = e.o + (bis != null ? bis : e.l - 1);
    return fs.createReadStream(this.volPfad(e.v), { start: a, end: z });
  }
  lesen(rel) {
    const e = this.eintraege.get(rel); if (!e) return null;
    const fd = fs.openSync(this.volPfad(e.v), 'r');
    try { const b = Buffer.alloc(e.l); let n = 0; while (n < e.l) { const r = fs.readSync(fd, b, n, e.l - n, e.o + n); if (r <= 0) break; n += r; } return b; }
    finally { fs.closeSync(fd); }
  }
  /* Was die Stücke belegen, was davon lebt, was Ballast ist. */
  masse() {
    let stuecke = 0;
    for (let n = 1; n <= this.volumen; n++) { try { stuecke += fs.statSync(this.volPfad(n)).size; } catch (e) {} }
    let lebt = 0; for (const e of this.eintraege.values()) lebt += BLOCK + aufBlock(e.l);
    return { stuecke, lebt, ballast: Math.max(0, stuecke - lebt), volumen: this.volumen, dateien: this.eintraege.size };
  }

  /* ---- Schreiben */
  /* Das aktuelle Stück zum Anhängen öffnen: die zwei Endblöcke, die
     schliessen() geschrieben hat, werden abgeschnitten. */
  volOeffnen(n) {
    if (this.fd !== null && this.fdNr === n) return;
    this.volSchliessen();
    const p = this.volPfad(n);
    let groesse = 0; try { groesse = fs.statSync(p).size; } catch (e) {}
    if (groesse >= 2 * BLOCK) {
      const fd = fs.openSync(p, 'r'); const b = Buffer.alloc(2 * BLOCK);
      fs.readSync(fd, b, 0, 2 * BLOCK, groesse - 2 * BLOCK); fs.closeSync(fd);
      if (b.every(x => x === 0)) { fs.truncateSync(p, groesse - 2 * BLOCK); groesse -= 2 * BLOCK; }
    }
    this.fd = fs.openSync(p, groesse ? 'r+' : 'w'); this.fdNr = n; this.offset = groesse;
    if (n > this.volumen) this.volumen = n;
  }
  volSchliessen() {
    if (this.fd === null) return;
    /* Zwei Nullblöcke: so erkennt jedes tar das Ende. */
    fs.writeSync(this.fd, Buffer.alloc(2 * BLOCK), 0, 2 * BLOCK, this.offset);
    fs.closeSync(this.fd); this.fd = null;
  }
  /* Eine Datei anhängen. melde(bytesBisher) nach jedem Stück von 4 MB.
     Rückgabe: der Eintrag. */
  schreiben(rel, quelle, stat, melde) {
    if (!this.schreibbar) throw new Error('Behälter ist nur zum Lesen geöffnet');
    const name = rel.split(path.sep).join('/');
    const mtimeS = stat.mtimeMs / 1000;
    const vorsatz = Buffer.byteLength(name) > 100 ? paxVorsatz(name, mtimeS) : null;
    const brauchen = (vorsatz ? vorsatz.length : 0) + BLOCK + aufBlock(stat.size);
    /* Ins nächste Stück, wenn es nicht mehr passt - außer das Stück ist
       noch leer (eine Datei über 2 GB bekommt ihr eigenes). */
    let n = Math.max(1, this.volumen);
    if (this.fd === null || this.fdNr !== n) this.volOeffnen(n);
    if (this.offset > 0 && this.offset + brauchen > KAPPE) { this.volSchliessen(); n++; this.volOeffnen(n); }
    let pos = this.offset;
    if (vorsatz) { fs.writeSync(this.fd, vorsatz, 0, vorsatz.length, pos); pos += vorsatz.length; }
    const k = kopf(name, stat.size, mtimeS, '0');
    fs.writeSync(this.fd, k, 0, BLOCK, pos); pos += BLOCK;
    const datenAb = pos;
    const q = fs.openSync(quelle, 'r');
    try {
      const puffer = Buffer.allocUnsafe(STUECK); let summe = 0, gelesen;
      while ((gelesen = fs.readSync(q, puffer, 0, STUECK, null)) > 0) {
        fs.writeSync(this.fd, puffer, 0, gelesen, pos); pos += gelesen; summe += gelesen;
        if (melde) melde(summe);
      }
      if (summe !== stat.size) {
        /* Die Datei hat sich unter der Hand geändert: der Kopf sagt eine
           andere Länge. Auffüllen bzw. abschneiden, damit das tar stimmt,
           und den Eintrag mit der Kopflänge führen. */
        if (summe < stat.size) { const rest = Buffer.alloc(stat.size - summe); fs.writeSync(this.fd, rest, 0, rest.length, pos); pos += rest.length; }
        else pos = datenAb + stat.size;
      }
    } finally { fs.closeSync(q); }
    const fuellung = aufBlock(stat.size) - stat.size;
    if (fuellung) { fs.writeSync(this.fd, Buffer.alloc(fuellung), 0, fuellung, pos); pos += fuellung; }
    this.offset = pos;
    const e = { v: n, o: datenAb, l: stat.size, m: stat.mtimeMs };
    this.eintraege.delete(name); this.eintraege.set(name, e);
    this.schmutzig = true; this.indexSchreiben(false);
    return e;
  }
  loeschen(rel) {
    const name = rel.split(path.sep).join('/');
    if (!this.eintraege.delete(name)) return false;
    this.schmutzig = true; this.indexSchreiben(false); return true;
  }
  /* Verdichten: alle lebenden Einträge in ihrer Reihenfolge in neue Stücke
     umschreiben, dann tauschen. Bricht abbrechen() ab (z. B. Anhalten),
     bleibt alles beim Alten. melde(bytes) läuft über die lebenden Bytes. */
  verdichten(melde, abbrechen) {
    const neu = new Behaelter(this.ordner); neu.schreibbar = true; neu.NEU = true;
    const neuName = (n) => path.join(this.ordner, `bestand-neu-${String(n).padStart(3, '0')}.tar`);
    neu.volPfad = neuName; neu.indexPfad = () => path.join(this.ordner, INDEX + '.neu');
    let bytes = 0, fertig = false;
    try {
      for (const [p, e] of this.eintraege) {
        if (abbrechen && abbrechen()) break;
        /* Aus dem alten Stück lesen, ins neue schreiben - über eine
           Zwischendatei im Speicher wäre es einfacher, aber 5 MB je Titel
           mal 324 ist kein Speicher, der 4-MB-Puffer reicht. */
        const tmp = path.join(this.ordner, '.verdichten.tmp');
        const w = fs.openSync(tmp, 'w'); const r = fs.openSync(this.volPfad(e.v), 'r');
        try { const puffer = Buffer.allocUnsafe(STUECK); let n = 0; while (n < e.l) { const g = fs.readSync(r, puffer, 0, Math.min(STUECK, e.l - n), e.o + n); if (g <= 0) break; fs.writeSync(w, puffer, 0, g); n += g; } }
        finally { fs.closeSync(r); fs.closeSync(w); }
        neu.schreiben(p, tmp, { size: e.l, mtimeMs: e.m }, (s) => { if (melde) melde(bytes + s); });
        bytes += e.l;
        try { fs.unlinkSync(tmp); } catch (x) {}
      }
      fertig = !(abbrechen && abbrechen());
    } finally {
      neu.volSchliessen();
    }
    if (!fertig) { for (let n = 1; n <= neu.volumen; n++) { try { fs.unlinkSync(neuName(n)); } catch (x) {} } try { fs.unlinkSync(neu.indexPfad()); } catch (x) {} return false; }
    this.volSchliessen();
    for (let n = 1; n <= this.volumen; n++) { try { fs.unlinkSync(this.volPfad(n)); } catch (x) {} }
    for (let n = 1; n <= neu.volumen; n++) fs.renameSync(neuName(n), this.volPfad(n));
    try { fs.unlinkSync(neu.indexPfad()); } catch (x) {}
    this.eintraege = neu.eintraege; this.volumen = neu.volumen;
    this.fd = null; this.offset = 0;
    this.indexSchreiben(true);
    return true;
  }
  schliessen() { this.volSchliessen(); if (this.schreibbar) this.indexSchreiben(true); }
}

module.exports = { Behaelter, INDEX, volName, KAPPE };
