/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* DIE KNOTENSCHNUR (Caspar_D, 12.11.2026: „das ganze werk als Inkaknotenschnur, jedes lied ein angeknoteter Substrang mit
   grössen proportionalen abschnitten in den richtigen farben … die gesamtschnur so lang wie der song“ - „alles auf schwarzem
   Grund und ein Lichtschein läuft beim Abspielen die Schnur herunter“). Skizze abgenommen am 12.11.2026, Entscheidungen:
   A eine eigene Reihe „Schnüre“ im Panel, B echte Abschnittszeiten aus Sunos Wortmarken (sonst Silbenanteil, als Schätzung
   ausgewiesen), C eine Hauptschnur in der Reihenfolge der Entstehung mit stetigem Zoom, D „beides kombiniert“: oben die Likes
   als Zahlknoten wie bei den Inka, darunter ein Knoten an jedem Abschnittswechsel; nur Lieder mit Text.

   Wie die Inka zählen (Leland Locke 1912): Stellen im Zehnersystem, die höchste oben. Zehner und Hunderter sind Gruppen von
   Einzelknoten, die Einer ein Langknoten mit so vielen Windungen (2–9), eine einzelne 1 ein Achterknoten, eine leere Stelle
   ist 0. Die Stellen liegen bei allen Schnüren auf gleicher Höhe - so liest man die Schnüre in Spalten.

   Zoom (Caspar_D, 12.11.2026: „zoom in immer an mouseposition als referenzpunkt“): Die Stelle unter der Maus bleibt stehen,
   waagerecht UND senkrecht. Die Breite wächst mit dem Zoom, die Länge der Lieder mit seiner Wurzel - so werden die Schnüre
   beim Heranfahren länger, ohne im Überblick zu fehlen. Hauptschnur, Monate und Titel bleiben oben stehen; das Kopfstück mit
   den Zahlknoten wird nur verschoben, nicht gedehnt. Ziehen verschiebt in beide Richtungen.

   Licht (Caspar_D, 12.11.2026: „die sind mir momentan zu synthetisch angestrahlt“ - aus vier Vorlagen gewählt: „die
   lichtstimmung in garn streif ist gut“): Streiflicht von links oben. Jede Schnur ist ein runder Faden; über seinen
   Querschnitt wird gerechnet, wie viel Licht trifft (Lambert) und wo ein Glanz sitzt (Blinn), gezeichnet als schmale Bahnen
   nebeneinander entlang der Biegung. Dazu der Drall der Fasern und eine leicht ungleichmäßige Färbung wie bei handgefärbtem
   Garn. Verworfen: weiches Licht, Vitrine mit Rückwand und Schlagschatten, Gegenlicht.

   Glasperlenschnur (Caspar_D, 12.11.2026: „glasperlenschnüre … als alternative“, dann: „nicht lichtbündelnd genug … da muss
   es auch noch reflexe auf den Tisch darauf … verschiedene Durchmesser und die Hüllkurve nachbilden“): dasselbe Werk, aber
   statt gefärbtem Garn Glasperlen auf einem Naturfaden. Der Durchmesser folgt der geglätteten Lautstärke (huelle aus
   bin/knotenschnur.js), die Perlen eines Abschnitts füllen ihn genau. Glas bündelt Licht: ein heller Kern auf der vom Licht
   abgewandten Seite und dahinter, auf dem Tisch, ein farbiger Lichtfleck, wie ihn eine Glasperle in der Sonne wirft.

   Gebrauch (klassisches Skript, legt window.Knotenschnur an; das Haus verdrahtet es in schnurZeichnen):
     Knotenschnur.einrichten(element, haus)    haus: { t, locale(), laufend() → {id, t, spielt}, spielen(id), springen(sek),
                                                tipp(html, ev), tippWeg() }
     Knotenschnur.setzen(lieder, farben)       lieder aus /api/knotenschnur (bin/knotenschnur.js), schon gefiltert
     Knotenschnur.material('garn' | 'glas')    Knotenschnur oder Glasperlenschnur
     Knotenschnur.zeigen() / .ruhen()          Zeichenschleife an / aus
     Knotenschnur.legendeHtml(t, lieder, farben)
   Gemalt wird in zwei Ebenen: die ruhende Szene (Garn, Perlen, Knoten, Beschriftung) nur bei Zoom, Verschieben, Größe,
   Material oder neuen Daten; darüber je Bild nur der Lichtschein. */
(function (wurzel) {
  'use strict';

  const NATUR = '#cdb58c';        /* ungefärbte Baumwolle: Hauptschnur und Kopfstück jeder Schnur */
  const GRAU = '#5d636c';         /* ohne Abschnitt: Vorspiel vor dem ersten Wort, Text ohne Abschnittsmarken */
  const RAND = 30;                /* Luft links und rechts der ersten und letzten Schnur */
  const OBEN = 58;                /* Mitte der Hauptschnur; darüber stehen Jahre und Monate */
  const KOPF = 0.21;              /* höchstens dieser Anteil der Höhe für die Zahlknoten */
  const MAX_ABSTAND = 170;        /* engster Zoom: so weit liegen zwei Schnüre auseinander */

  /* ---------- Licht ---------- */
  const norm = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
  /* richtung: zum Licht hin (x rechts, y unten, z zum Betrachter); grund: Umgebungslicht; streu: Lambert; glanz/haerte:
     Blinn-Glanzlicht; farbe: Lichtfarbe je Kanal (sanft, die Abschnittsfarben tragen Bedeutung); faser: Tiefe der
     Drallrillen; flecken: Ungleichmäßigkeit der Färbung */
  const licht = { richtung: norm(-0.8, -0.3, 0.5), grund: 0.14, streu: 1.0, glanz: 0.32, haerte: 18, farbe: [1.0, 0.98, 0.94], faser: 0.42, flecken: 0.07 };

  let feld = null, lein = null, ctx = null, szene = null, sctx = null, reflexLein = null, haus = null;
  let lieder = [], farben = {}, index = new Map();
  let W = 0, H = 0, dpr = 1, zoom = 1, pan = 0, panY = 0, g = null, material = 'garn';
  let szenePerlen = [], szeneAlt = true, neuMalen = true, lauf = 0, an = false, letzteId = null, letzteT = -1, druck = null, handZeit = 0;
  const muster = new Map(), toene = new Map();

  const klemm = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const farbe = (a) => (a && farben[a]) || GRAU;
  const mmss = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const rgbVon = (hex) => { const h = hex.replace('#', ''); return [0, 2, 4].map(k => parseInt(h.slice(k, k + 2), 16)); };

  /* Helligkeit eines Punkts auf dem Fadenquerschnitt mit der Normalen n (Einheitsvektor) */
  function leuchten(n) {
    const L = licht.richtung, d = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
    const hx = L[0], hy = L[1], hz = L[2] + 1, hl = Math.hypot(hx, hy, hz);
    const s = licht.glanz ? Math.pow(Math.max(0, (n[0] * hx + n[1] * hy + n[2] * hz) / hl), licht.haerte) * licht.glanz : 0;
    return { i: licht.grund + licht.streu * d, s };
  }
  /* Farbe eines Garnstücks bei Helligkeit h und Faktor f (Färbung), gerundet zwischengespeichert */
  function ton(hex, h, f) {
    const k = hex + '|' + Math.round(h.i * f * 50) + '|' + Math.round(h.s * 40);
    let c = toene.get(k); if (c) return c;
    const b = rgbVon(hex), lf = licht.farbe;
    const v = b.map((x, j) => klemm(x * h.i * f * lf[j] + 255 * h.s * lf[j], 0, 255) | 0);
    c = 'rgb(' + v.join(',') + ')'; toene.set(k, c); return c;
  }
  const quer = (w) => w >= 7 ? 7 : w >= 4 ? 5 : w >= 2.4 ? 3 : 1;   /* Bahnen über den Querschnitt */

  /* ---------- Geometrie ---------- */
  function vermessen() {
    const n = lieder.length;
    const basis = n > 1 ? (W - 2 * RAND) / (n - 1) : 0;
    const zMax = basis > 0 ? Math.max(1, MAX_ABSTAND / basis) : 1;
    zoom = klemm(zoom, 1, zMax);
    const abstand = basis * zoom, breite = (n - 1) * abstand + 2 * RAND, zy = Math.sqrt(zoom);
    /* Ziffern je Stelle über alle gezeigten Schnüre: danach richtet sich die Höhe der Knotenreihen */
    let mH = 0, mZ = 0, mE = 0, maxD = 1;
    for (const s of lieder) {
      const l = s.likes || 0; mH = Math.max(mH, Math.min(9, Math.floor(l / 100))); mZ = Math.max(mZ, Math.floor(l / 10) % 10); mE = Math.max(mE, l % 10);
      maxD = Math.max(maxD, s.dauer || 0);
    }
    /* Das Kopfstück ist so hoch, wie die Knoten es brauchen, höchstens KOPF der Höhe */
    const bedarf = (mH ? mH * 1.7 + 0.9 : 0) + (mZ ? mZ * 1.7 + 0.9 : 0) + (mE > 1 ? mE * 0.52 + 1.3 : mE === 1 ? 2.2 : 0);
    const knMax = bedarf ? (H * KOPF - 14) / bedarf : 99;
    const w = klemm(Math.min(abstand * 0.6, 16, knMax * 1.8), 1.6, 16);    /* Dicke einer Liedschnur */
    const kn = Math.min(w, knMax);                                          /* Knotenmaß */
    const kopfH = Math.round(bedarf * kn + 16);
    const hauptW = klemm(w * 1.45, 5, 22);
    const unten = OBEN + hauptW / 2, y0 = unten + 9;
    const yH = y0, yZ = yH + (mH ? mH * 1.7 * kn + 0.9 * kn : 0), yE = yZ + (mZ ? mZ * 1.7 * kn + 0.9 * kn : 0);
    const yS = unten + kopfH;                                                /* hier beginnt die Zeit */
    const mass = Math.max(0.05, (H - 22 - yS) / maxD);                      /* Pixel je Sekunde im Überblick */
    g = { abstand, w, kn, hauptW, unten, yH, yZ, yE, yS, mass, breite, zy, maxD };
    klemmen();
  }
  function klemmen() {
    pan = klemm(pan, 0, Math.max(0, g.breite - W));
    panY = klemm(panY, 0, Math.max(0, g.yS + g.maxD * g.mass * g.zy + 26 - H));
  }
  const xVon = (i) => RAND + i * g.abstand - pan;
  /* Grundlage (Überblick, ungeschoben) → Bild und zurück: das Kopfstück wird nur verschoben, die Zeit auch gedehnt */
  const yBild = (yb) => yb <= g.yS ? yb - panY : g.yS - panY + (yb - g.yS) * g.zy;
  const yGrund = (ys) => { const v = ys + panY; return v <= g.yS ? v : g.yS + (v - g.yS) / g.zy; };
  const yZeit = (t) => yBild(g.yS + t * g.mass);

  /* ---------- das natürliche Schlängeln (Caspar_D, 12.11.2026) ----------
     Jede Schnur hat ihre eigene ruhige Wellenform, fest aus ihrer Kennung gewürfelt. Am Ankerknoten liegt sie still, nach
     unten wird sie freier; nur seitlich, also stimmen Zeiten und Knotenreihen. Gerechnet auf dem Faden selbst (Grundlage),
     so schlängelt er sich beim Zoomen mit. */
  const wellen = new Map();
  function wellenform(id) {
    if (wellen.has(id)) return wellen.get(id);
    let h = 2166136261;
    for (const ch of String(id)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    const zufall = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
    const f = { l1: 190 + zufall() * 170, l2: 70 + zufall() * 60, p1: zufall() * 6.2832, p2: zufall() * 6.2832, a2: 0.18 + zufall() * 0.2,
      schraeg: (zufall() - 0.5) * 0.6, q1: zufall() * 6.2832, q2: zufall() * 6.2832 };
    wellen.set(id, f); return f;
  }
  function xAt(i, y) {
    const s = yGrund(y) - g.unten, x = xVon(i);
    if (s <= 0) return x;
    const f = wellenform(lieder[i].id), A = klemm(g.abstand * 0.3, 1.2, 10);
    const huelle = Math.min(1, s / 90) * (0.65 + 0.35 * Math.min(1, s / Math.max(1, H)));
    return x + A * huelle * (Math.sin(s / f.l1 * 6.2832 + f.p1) * (1 - f.a2) + Math.sin(s / f.l2 * 6.2832 + f.p2) * f.a2 + f.schraeg * s / Math.max(1, H));
  }
  /* Ungleichmäßige Färbung entlang des Fadens: zwei langsame Schwankungen, fest je Schnur */
  function fleck(i, y) {
    if (!licht.flecken) return 1;
    const f = wellenform(lieder[i].id), s = yGrund(y);
    return 1 + licht.flecken * (Math.sin(s / 41 + f.q1) * 0.6 + Math.sin(s / 13.3 + f.q2) * 0.4);
  }
  /* die Bahn einer Schnur zwischen zwei Bildhöhen, alle 4 px ein Punkt */
  function bahn(i, y1, y2) {
    const p = new Path2D(), n = Math.max(1, Math.ceil((y2 - y1) / 4));
    for (let k = 0; k <= n; k++) { const y = y1 + (y2 - y1) * k / n, x = xAt(i, y); if (k) p.lineTo(x, y); else p.moveTo(x, y); }
    return p;
  }

  /* ---------- Garn ---------- */
  function drall(w) {
    const s = Math.max(4, Math.round(w * 0.8 * dpr)), k = s + ':' + dpr + ':' + licht.faser;
    if (muster.has(k)) return muster.get(k);
    const c = document.createElement('canvas'); c.width = c.height = s;
    const x = c.getContext('2d');
    x.strokeStyle = 'rgba(0,0,0,' + licht.faser + ')'; x.lineWidth = s * 0.34;
    for (const d of [-s, 0, s]) { x.beginPath(); x.moveTo(d, s); x.lineTo(d + s, 0); x.stroke(); }
    x.strokeStyle = 'rgba(255,255,255,' + (licht.faser * 0.22).toFixed(3) + ')'; x.lineWidth = s * 0.1;
    for (const d of [-s, 0, s]) { x.beginPath(); x.moveTo(d + s * 0.55, s); x.lineTo(d + s * 1.55, 0); x.stroke(); }
    const p = sctx.createPattern(c, 'repeat');
    p.setTransform && p.setTransform(new DOMMatrix([1 / dpr, 0, 0, 1 / dpr, 0, 0]));
    muster.set(k, p); return p;
  }
  /* Ein Stück Garn auf einem Pfad: K Bahnen über den Querschnitt (Achse nx/ny quer zum Faden), jede in ihrem Licht */
  function garnPfad(c, p, w, f, nx, ny, faktor) {
    const K = quer(w);
    c.lineCap = 'butt'; c.lineJoin = 'round';
    if (K === 1) { c.strokeStyle = ton(f, leuchten([0, 0, 1]), faktor); c.lineWidth = w; c.stroke(p); return; }
    const bw = w / K * 1.3;
    for (let k = 0; k < K; k++) {
      const u = -1 + (2 * k + 1) / K, nz = Math.sqrt(Math.max(0, 1 - u * u));
      c.save(); c.translate(nx * u * w / 2, ny * u * w / 2);
      c.strokeStyle = ton(f, leuchten([nx * u, ny * u, nz]), faktor); c.lineWidth = bw; c.stroke(p);
      c.restore();
    }
    if (w >= 3.2 && licht.faser) { c.strokeStyle = drall(w); c.lineWidth = w; c.stroke(p); }
  }
  /* Ein Stück einer Liedschnur zwischen zwei Bildhöhen; nur was im Bild liegt, in kurzen Stücken für die Färbung */
  function garn(c, i, y1, y2, w, f) {
    y1 = Math.max(y1, g.unten - 2); y2 = Math.min(y2, H + 2);
    if (y2 - y1 < 0.2) return;
    if (w < 4 || !licht.flecken) { garnPfad(c, bahn(i, y1, y2), w, f, 1, 0, fleck(i, (y1 + y2) / 2)); return; }
    const n = Math.max(1, Math.round((y2 - y1) / 14));
    for (let k = 0; k < n; k++) {
      const a = y1 + (y2 - y1) * k / n, b = y1 + (y2 - y1) * (k + 1) / n;
      garnPfad(c, bahn(i, a, b + (k + 1 < n ? 0.6 : 0)), w, f, 1, 0, fleck(i, (a + b) / 2));
    }
  }

  /* ---------- Glasperlen ---------- */
  function hell(hex, a) { const b = rgbVon(hex); return b.map(x => Math.round(x + (255 - x) * a)); }
  function dunkel(hex, a) { const b = rgbVon(hex); return b.map(x => Math.round(x * (1 - a))); }
  const rgba = (v, a) => 'rgba(' + v.join(',') + ',' + a.toFixed(3) + ')';
  /* Eine Perle: dicker Glasrand dunkel und satt, die Mitte durchscheinend (der Faden schimmert durch), ein gebündelter heller
     Kern auf der vom Licht abgewandten Seite, ein hartes Glanzlicht zum Licht hin und ein schwacher Fensterreflex */
  function glasPerle(c, x, y, rx, ry, f) {
    const L = licht.richtung;
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7);
    const k = c.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    k.addColorStop(0, rgba(hell(f, 0.1), 0.4)); k.addColorStop(0.55, rgba(rgbVon(f), 0.66)); k.addColorStop(0.86, rgba(dunkel(f, 0.35), 0.92)); k.addColorStop(1, rgba(dunkel(f, 0.62), 1));
    c.fillStyle = k; c.fill();
    if (rx < 2.5) return;
    /* die Lichtbündelung im Glas */
    const bx = x - L[0] * rx * 0.38, by = y - L[1] * ry * 0.42, br = Math.max(rx, ry) * 0.62;
    const bb = c.createRadialGradient(bx, by, 0, bx, by, br);
    bb.addColorStop(0, 'rgba(255,255,248,.95)'); bb.addColorStop(0.18, rgba(hell(f, 0.72), 0.92)); bb.addColorStop(0.55, rgba(hell(f, 0.35), 0.45)); bb.addColorStop(1, rgba(rgbVon(f), 0));
    c.save(); c.clip(); c.globalCompositeOperation = 'lighter'; c.fillStyle = bb; c.fillRect(x - rx, y - ry, 2 * rx, 2 * ry); c.restore();
    /* Glanzlicht und Fensterreflex */
    const gx = x + L[0] * rx * 0.46, gy = y + L[1] * ry * 0.52;
    c.beginPath(); c.ellipse(gx, gy, rx * 0.17, ry * 0.12, -0.5, 0, 7); c.fillStyle = 'rgba(255,255,255,.95)'; c.fill();
    c.beginPath(); c.ellipse(x, y, rx * 0.68, ry * 0.68, 0, Math.PI * 1.02, Math.PI * 1.42);
    c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = Math.max(0.6, rx * 0.08); c.stroke();
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = Math.max(0.6, rx * 0.06); c.stroke();
  }
  /* Der Lichtfleck, den eine Perle auf den Tisch wirft: hinter ihr, vom Licht weg, länglich, in ihrer Farbe mit hellem Brennpunkt */
  function tischReflex(c, x, y, rx, ry, f) {
    const L = licht.richtung, d = Math.max(rx, ry);
    const fx = x - L[0] * d * 1.55, fy = y - L[1] * d * 1.55, wink = Math.atan2(-L[1], -L[0]);
    c.save(); c.translate(fx, fy); c.rotate(wink);
    const k = c.createRadialGradient(d * 0.25, 0, 0, 0, 0, d * 1.25);
    k.addColorStop(0, 'rgba(255,252,236,.85)'); k.addColorStop(0.15, rgba(hell(f, 0.55), 0.75)); k.addColorStop(0.55, rgba(rgbVon(f), 0.32)); k.addColorStop(1, rgba(rgbVon(f), 0));
    c.scale(1.35, 0.8); c.beginPath(); c.arc(0, 0, d * 1.25, 0, 7); c.fillStyle = k; c.fill();
    c.restore();
  }
  /* Die Perlen eines Abschnitts: Durchmesser nach der Hüllkurve, zusammen genau so lang wie der Abschnitt */
  function perlenLegen(i, t0, t1, w, f, liste) {
    const s = lieder[i], hk = s.huelle || '', proPx = 1 / (g.mass * g.zy);   /* Sekunden je Bildpunkt */
    const laut = (t) => hk.length ? (+hk[Math.min(hk.length - 1, Math.max(0, Math.floor(t)))] || 0) / 9 : 0.6;
    const roh = []; let t = t0, summe = 0;
    while (t < t1 - 1e-6) {
      const h = w * (0.5 + 1.05 * laut(t + w * 0.5 * proPx)), dt = h * proPx;
      roh.push({ t, dt }); summe += dt; t += dt;
    }
    if (!roh.length) return;
    const k = (t1 - t0) / summe; let u = t0;
    for (const p of roh) {
      const dt = p.dt * k, ya = yZeit(u), yb = yZeit(u + dt); u += dt;
      if (yb < g.unten - 30 || ya > H + 30) continue;
      const y = (ya + yb) / 2, ry = (yb - ya) * 0.48;
      liste.push({ i, x: xAt(i, y), y, rx: Math.max(ry * 1.08, 1), ry, f, ta: u - dt, tb: u });
    }
  }

  /* ---------- Knoten ---------- */
  function ball(c, cx, cy, rx, ry, f) {
    c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 7);
    if (rx < 2) { c.fillStyle = ton(f, leuchten([0, 0, 1]), 1); c.fill(); return; }
    const L = licht.richtung, hell = ton(f, leuchten(L), 1), mitte = ton(f, leuchten([0, 0, 1]), 1), dunkel = ton(f, leuchten(norm(-L[0], -L[1], 0.25)), 1);
    const r = c.createRadialGradient(cx + L[0] * rx * 0.45, cy + L[1] * ry * 0.45, 0, cx, cy, Math.max(rx, ry) * 1.1);
    r.addColorStop(0, hell); r.addColorStop(0.5, mitte); r.addColorStop(1, dunkel);
    c.fillStyle = r; c.fill();
    if (licht.faser && rx >= 3) { c.fillStyle = drall(rx); c.globalAlpha = 0.5; c.fill(); c.globalAlpha = 1; }
  }
  /* Ein Strang als Röhre (Schlinge über einem Knoten): dunkler Rand zum Absetzen, dann Garn */
  function roehre(c, k, w, f) {
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = w * 1.12; c.stroke(k.p);
    garnPfad(c, k.p, w, f, k.nx, k.ny, 1);
  }
  const kurve = (x1, y1, cx1, cy1, cx2, cy2, x2, y2) => {
    const p = new Path2D(); p.moveTo(x1, y1); p.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
    const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1;
    return { p, nx: -dy / l, ny: dx / l };
  };
  /* Einzelknoten (Überhandknoten): ein Wulst, über den eine Schlinge schräg läuft. cy = Mitte. */
  function einzel(c, x, cy, kn, w, f) {
    const rx = Math.max(kn * 0.95, w * 0.62), ry = kn * 0.78;
    ball(c, x, cy, rx, ry, f);
    if (kn < 2.4) return;
    roehre(c, kurve(x - rx * 0.9, cy - ry * 0.55, x - rx * 0.2, cy - ry * 0.05, x + rx * 0.2, cy + ry * 0.05, x + rx * 0.9, cy + ry * 0.55), kn * 0.5, f);
  }
  /* Langknoten: so viele Windungen wie die Einerziffer (2–9). y = Oberkante; gibt die Höhe zurück. */
  function langknoten(c, x, y, kn, w, n, f) {
    const b = Math.max(kn * 0.9, w * 0.6), h = n * kn * 0.52 + kn * 0.5;
    const p = new Path2D(); p.moveTo(x, y + b); p.lineTo(x, y + h - b);
    if (kn < 2.4) { c.lineCap = 'round'; c.strokeStyle = ton(f, leuchten([0, 0, 1]), 1); c.lineWidth = 2 * b; c.stroke(p); return h; }
    c.lineCap = 'round'; c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 2 * b + 1; c.stroke(p);
    garnPfad(c, p, 2 * b, f, 1, 0, 1);
    for (let i = 0; i < n; i++) {
      const yy = y + kn * 0.42 + i * kn * 0.52, q = new Path2D();
      q.moveTo(x - b * 0.94, yy); q.quadraticCurveTo(x, yy + kn * 0.42, x + b * 0.94, yy + kn * 0.18);
      roehre(c, { p: q, nx: 0, ny: -1 }, kn * 0.42, f);
    }
    return h;
  }
  /* Achterknoten: die Einer genau 1. y = Oberkante. */
  function achter(c, x, y, kn, w, f) {
    const rx = Math.max(kn * 0.82, w * 0.56);
    ball(c, x, y + kn * 0.45, rx, kn * 0.62, f); ball(c, x, y + kn * 1.25, rx, kn * 0.62, f);
    if (kn < 2.4) return;
    roehre(c, kurve(x + rx * 0.9, y + kn * 0.15, x - rx * 1.1, y + kn * 0.6, x + rx * 1.1, y + kn * 1.1, x - rx * 0.9, y + kn * 1.55), kn * 0.42, f);
  }
  /* Einen Knoten an die Schnur setzen, gedreht nach ihrer Neigung an dieser Stelle */
  function amFaden(c, i, y, mal) {
    if (y < g.unten - 30 || y > H + 30) return;
    const neig = Math.atan((xAt(i, y + 2) - xAt(i, y - 2)) / 4);
    c.save(); c.translate(xAt(i, y), y); c.rotate(-neig); mal(); c.restore();
  }

  /* ---------- die ruhende Szene ---------- */
  function szeneMalen() {
    szeneAlt = false;
    const c = sctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    const schrift = getComputedStyle(feld).fontFamily || 'system-ui, sans-serif';
    if (!lieder.length) {
      c.fillStyle = '#9aa0a8'; c.font = '14px ' + schrift; c.textAlign = 'center';
      c.fillText(haus.t('schnur.leer'), W / 2, H / 2); c.textAlign = 'left';
      return;
    }
    vermessen();
    const { abstand, w, kn, hauptW, unten } = g;
    const oben = OBEN - hauptW / 2;
    const i0 = Math.max(0, Math.floor((pan - RAND) / abstand) - 1), i1 = Math.min(lieder.length - 1, Math.ceil((pan + W - RAND) / abstand) + 1);
    const mitAnker = w >= 5;

    /* 1. hinter der Hauptschnur: die Schlaufen der Ankerknoten */
    if (mitAnker) for (let i = i0; i <= i1; i++) {
      const x = xVon(i);
      roehre(c, kurve(x - w * 0.5, unten, x - w * 0.5, oben - hauptW * 0.9, x + w * 0.5, oben - hauptW * 0.9, x + w * 0.5, unten), w * 0.62, NATUR);
    }
    /* 2. die Liedschnüre, unterhalb der Hauptschnur beschnitten (sie gleiten beim Verschieben darunter) */
    c.save(); c.beginPath(); c.rect(-10, unten - 1, W + 20, H); c.clip();
    const perlenListe = []; szenePerlen = perlenListe;
    for (let i = i0; i <= i1; i++) {
      const s = lieder[i];
      garn(c, i, yBild(unten - 1), yBild(g.yS), w, NATUR);
      /* die Likes als Zahlknoten, Stelle für Stelle auf gleicher Höhe */
      const L = s.likes || 0, h = Math.min(9, Math.floor(L / 100)), z = Math.floor(L / 10) % 10, e = L % 10;
      for (let q = 0; q < h; q++) amFaden(c, i, yBild(g.yH + kn * 0.8 + q * kn * 1.7), () => einzel(c, 0, 0, kn, w, NATUR));
      for (let q = 0; q < z; q++) amFaden(c, i, yBild(g.yZ + kn * 0.8 + q * kn * 1.7), () => einzel(c, 0, 0, kn, w, NATUR));
      if (e === 1) amFaden(c, i, yBild(g.yE), () => achter(c, 0, 0, kn, w, NATUR)); else if (e > 1) amFaden(c, i, yBild(g.yE), () => langknoten(c, 0, 0, kn, w, e, NATUR));
      /* das Lied in seinen Abschnitten */
      const ab = s.abschnitte, ende = yZeit(s.dauer);
      const glas = material === 'glas' && w >= 4;
      if (glas) garn(c, i, yZeit(0), ende, Math.max(1.2, w * 0.2), NATUR);    /* der Faden, auf dem die Perlen sitzen */
      for (let k = 0; k < ab.length; k++) {
        const a = yZeit(ab[k][0]), b = k + 1 < ab.length ? yZeit(ab[k + 1][0]) : ende;
        if (glas) perlenLegen(i, ab[k][0], k + 1 < ab.length ? ab[k + 1][0] : s.dauer, w, farbe(ab[k][1]), perlenListe); else garn(c, i, a, b, w, farbe(ab[k][1]));
      }
      /* ein Knoten an jedem Abschnittswechsel, in der Farbe des neuen Abschnitts */
      if (w >= 2.6 && !glas) for (let k = 1; k < ab.length; k++) {
        const b = k + 1 < ab.length ? ab[k + 1][0] : s.dauer;
        if (b - ab[k][0] < 0.5) continue;
        const kk = Math.min(kn, w) * 0.66, ff = farbe(ab[k][1]);
        amFaden(c, i, yZeit(ab[k][0]), () => einzel(c, 0, 0, kk, w * 0.9, ff));
      }
      /* das ausgefranste Ende */
      if (w >= 4 && ende < H + 20 && !glas) {
        c.strokeStyle = ton(farbe(ab[ab.length - 1][1]), leuchten([0, 0, 1]), 1); c.lineWidth = Math.max(1, w * 0.12); c.globalAlpha = 0.8;
        const xe = xAt(i, ende), d = xe - xAt(i, ende - 4);
        for (let f = -2; f <= 2; f++) { c.beginPath(); c.moveTo(xe + f * w * 0.16, ende); c.lineTo(xe + f * w * 0.28 + d * w * 0.25, ende + w * 0.9); c.stroke(); }
        c.globalAlpha = 1;
      }
    }
    /* Glas: erst die Lichtflecken auf dem Tisch (weich, aufaddiert), dann die Perlen darüber */
    if (perlenListe.length) {
      const rc = reflexLein.getContext('2d');
      rc.setTransform(1, 0, 0, 1, 0, 0); rc.clearRect(0, 0, reflexLein.width, reflexLein.height);
      rc.setTransform(dpr, 0, 0, dpr, 0, 0); rc.globalCompositeOperation = 'lighter';
      for (const p of perlenListe) tischReflex(rc, p.x, p.y, p.rx, p.ry, p.f);
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.filter = 'blur(' + Math.max(1, Math.round(g.w * 0.25 * dpr)) + 'px)'; c.globalCompositeOperation = 'lighter';
      c.drawImage(reflexLein, 0, 0); c.restore();
      for (const p of perlenListe) glasPerle(c, p.x, p.y, p.rx, p.ry, p.f);
    }
    c.restore();
    /* 3. die Hauptschnur */
    { const p = new Path2D(); p.moveTo(-4, OBEN); p.lineTo(W + 4, OBEN); garnPfad(c, p, hauptW, NATUR, 0, 1, 1); }
    /* 4. vor der Hauptschnur: die beiden Enden des Ankerknotens, bei dünnen Schnüren ein Punkt */
    for (let i = i0; i <= i1; i++) {
      const x = xVon(i);
      if (mitAnker) {
        roehre(c, kurve(x - w * 0.5, oben - hauptW * 0.3, x - w * 0.5, OBEN, x - w * 0.4, OBEN, x - w * 0.36, unten + hauptW * 0.45), w * 0.62, NATUR);
        roehre(c, kurve(x + w * 0.5, oben - hauptW * 0.3, x + w * 0.5, OBEN, x + w * 0.4, OBEN, x + w * 0.36, unten + hauptW * 0.45), w * 0.62, NATUR);
      } else ball(c, x, OBEN, Math.max(1.2, w * 0.7), Math.max(1.2, w * 0.7), NATUR);
    }
    /* 5. Jahre und Monate über der Hauptschnur, Titel bei genug Platz */
    c.textBaseline = 'alphabetic';
    let jahr = '', monat = '', letztesX = -1e9;
    const loc = haus.locale();
    for (let i = 0; i < lieder.length; i++) {
      const d = lieder[i].erstellt || '', j = d.slice(0, 4), m = d.slice(0, 7), x = xVon(i);
      if (j !== jahr) {
        jahr = j; monat = m;
        if (x > -60 && x < W + 10) { c.fillStyle = '#8a9099'; c.fillRect(x - 0.5, oben - 22, 1, 14); c.font = '600 13px ' + schrift; c.fillStyle = '#c9cdd3'; c.fillText(j, x + 5, oben - 10); }
        letztesX = x + 44;
      } else if (m !== monat) {
        monat = m;
        if (x - letztesX > 46 && x > -40 && x < W + 10) {
          let name = ''; try { name = new Date(d).toLocaleDateString(loc, { month: 'short' }); } catch (e) { name = m.slice(5); }
          c.fillStyle = '#4c5159'; c.fillRect(x - 0.5, oben - 16, 1, 8); c.font = '12px ' + schrift; c.fillStyle = '#8a9099'; c.fillText(name, x + 4, oben - 10);
          letztesX = x;
        }
      }
    }
    /* Nah heran steht oft keine Marke im Bild: dann Monat und Jahr der ersten sichtbaren Schnur links oben */
    if (zoom > 1.01) {
      const d = lieder[Math.max(0, Math.min(lieder.length - 1, Math.round((pan - RAND) / abstand)))].erstellt;
      let name = ''; try { name = new Date(d).toLocaleDateString(loc, { month: 'long', year: 'numeric' }); } catch (e) {}
      c.font = '600 13px ' + schrift; const b = c.measureText(name).width + 14;
      c.fillStyle = '#000'; c.globalAlpha = 0.85; c.fillRect(0, oben - 30, b + 4, 24); c.globalAlpha = 1;
      c.fillStyle = '#c9cdd3'; c.fillText(name, 8, oben - 12);
    }
    if (abstand >= 84) {
      const rechts = Math.max(w, kn * 1.9) * 0.62 + 6, platz = abstand - rechts - 8;
      for (let i = i0; i <= i1; i++) {
        c.font = '12.5px ' + schrift; c.fillStyle = '#cfd3d8';
        let tx = lieder[i].titel || '—';
        if (c.measureText(tx).width > platz) { while (tx.length > 1 && c.measureText(tx + '…').width > platz) tx = tx.slice(0, -1); tx += '…'; }
        c.fillText(tx, xVon(i) + rechts, unten + 16);
        c.fillStyle = '#8a9099'; c.font = '12px ' + schrift;
        c.fillText(haus.t('schnur.likes', { n: lieder[i].likes || 0 }), xVon(i) + rechts, unten + 31);
      }
    }
  }

  /* ---------- je Bild: der Lichtschein ---------- */
  function bild(jetzt) {
    lauf = 0;
    if (!an || !feld || !feld.offsetParent) { an = false; return; }        /* verborgen: die Schleife ruht */
    const l = haus.laufend() || {};
    const i = l.id != null ? index.get(l.id) : undefined;
    if (l.id !== letzteId) { letzteId = l.id; neuMalen = true; if (i !== undefined) insBild(i); }
    /* gemalt wird nur, wenn sich etwas tut: neue Szene, laufender Ton, ein Sprung in der Pause */
    const bewegt = i !== undefined && (l.spielt || Math.abs((l.t || 0) - letzteT) > 0.01);
    if (szeneAlt || bewegt || neuMalen) {
      neuMalen = false;
      if (i !== undefined && g && !szeneAlt) folgen(i, l);
      if (szeneAlt) szeneMalen();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(szene, 0, 0);
      if (i !== undefined && g) glut(i, l, jetzt);
      letzteT = l.t || 0;
    }
    lauf = requestAnimationFrame(bild);
  }
  /* Nah heran läuft der Lichtschein aus dem Bild: dann rückt die Ansicht nach - nicht, solange die Hand gerade schiebt */
  function folgen(i, l) {
    if (g.zy <= 1.01 || performance.now() - handZeit < 3000) return;
    const y = yZeit(klemm(l.t || 0, 0, lieder[i].dauer));
    if (y > g.unten + 30 && y < H - 40) return;
    panY += y - (g.unten + (H - g.unten) * 0.35); klemmen(); szeneAlt = true;
  }
  function glut(i, l, jetzt) {
    const s = lieder[i], x0 = xVon(i);
    if (x0 < -60 || x0 > W + 60) return;
    const { w, hauptW, unten } = g;
    const t = klemm(l.t || 0, 0, s.dauer), y = yZeit(t), x = xAt(i, y), y0 = Math.max(unten, yZeit(0));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    /* das Gespielte bleibt heller, entlang der Biegung */
    if (y - y0 > 0.5) { ctx.lineCap = 'butt'; ctx.strokeStyle = 'rgba(255,236,190,.20)'; ctx.lineWidth = w; ctx.stroke(bahn(i, y0, Math.min(y, H + 2))); }
    /* ein Hof um den Ankerknoten: so findet man die Schnur auch im Überblick */
    const ra = Math.max(10, hauptW * 1.3), ha = ctx.createRadialGradient(x0, OBEN, 0, x0, OBEN, ra);
    ha.addColorStop(0, 'rgba(255,214,140,.55)'); ha.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.fillStyle = ha; ctx.fillRect(x0 - ra, OBEN - ra, 2 * ra, 2 * ra);
    /* der Lichtschein; bei Glas trägt ihn die Perle, an der er gerade steht */
    const perle = material === 'glas' ? szenePerlen.find(p => p.i === i && t >= p.ta && t < p.tb) : null;
    if (y >= unten - 10 && y <= H + 40) {
      const puls = l.spielt ? 1 + 0.07 * Math.sin(jetzt / 300) : 0.8;
      const r = (perle ? Math.max(20, w * 2) : Math.max(34, w * 3.2)) * puls, gl = ctx.createRadialGradient(x, y, 0, x, y, r);
      gl.addColorStop(0, perle ? 'rgba(255,248,224,.55)' : 'rgba(255,248,224,1)'); gl.addColorStop(0.22, 'rgba(255,212,128,.5)'); gl.addColorStop(1, 'rgba(255,150,40,0)');
      ctx.fillStyle = gl; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    ctx.globalCompositeOperation = 'source-over';
    if (perle) perleImLicht(perle, jetzt, l.spielt);
  }
  /* Die Perle im Abspiellicht (Caspar_D, 13.11.2026: „die glasperle, die das Abspiellicht erhält, muss besonders auffällig
     mit Lichtreflexen sein“): ein großer, heller Fleck auf dem Tisch, die Perle selbst von innen durchleuchtet, ein Stern aus
     Lichtstrahlen am Glanzlicht und ein kleinerer im Brennpunkt - beide drehen sich langsam, solange die Musik läuft. */
  function stern(c, x, y, len, breite, winkel, deckung) {
    c.save(); c.translate(x, y); c.rotate(winkel);
    for (let k = 0; k < 4; k++) {
      const l = k % 2 ? len * 0.62 : len;
      const v = c.createLinearGradient(0, 0, l, 0);
      v.addColorStop(0, 'rgba(255,255,250,' + deckung + ')'); v.addColorStop(1, 'rgba(255,240,210,0)');
      c.fillStyle = v; c.beginPath(); c.moveTo(0, -breite); c.lineTo(l, 0); c.lineTo(0, breite); c.closePath(); c.fill();
      c.rotate(Math.PI / 2);
    }
    c.restore();
  }
  function perleImLicht(p, jetzt, spielt) {
    const L = licht.richtung, d = Math.max(p.rx, p.ry), puls = spielt ? 1 + 0.12 * Math.sin(jetzt / 260) : 0.85;
    ctx.globalCompositeOperation = 'lighter';
    tischReflex(ctx, p.x, p.y, p.rx * 1.9 * puls, p.ry * 1.9 * puls, p.f);
    tischReflex(ctx, p.x, p.y, p.rx * 1.2, p.ry * 1.2, p.f);
    ctx.globalCompositeOperation = 'source-over';
    glasPerle(ctx, p.x, p.y, p.rx * 1.12, p.ry * 1.12, p.f);
    ctx.globalCompositeOperation = 'lighter';
    const innen = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, d * 1.15);
    innen.addColorStop(0, 'rgba(255,250,235,.75)'); innen.addColorStop(0.5, rgba(hell(p.f, 0.5), 0.45)); innen.addColorStop(1, rgba(rgbVon(p.f), 0));
    ctx.fillStyle = innen; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx * 1.12, p.ry * 1.12, 0, 0, 7); ctx.fill();
    const hof = ctx.createRadialGradient(p.x, p.y, d, p.x, p.y, d * 2.6 * puls);
    hof.addColorStop(0, rgba(hell(p.f, 0.4), 0.45)); hof.addColorStop(1, rgba(rgbVon(p.f), 0));
    ctx.fillStyle = hof; ctx.fillRect(p.x - d * 3, p.y - d * 3, d * 6, d * 6);
    const drehen = spielt ? jetzt / 2400 : 0.3;
    stern(ctx, p.x + L[0] * p.rx * 0.5, p.y + L[1] * p.ry * 0.55, d * 4 * puls, Math.max(1, d * 0.12), drehen, 1);
    stern(ctx, p.x - L[0] * p.rx * 0.4, p.y - L[1] * p.ry * 0.45, d * 2.1 * puls, Math.max(0.7, d * 0.08), -drehen * 1.4 + 0.4, 0.8);
    ctx.globalCompositeOperation = 'source-over';
  }
  /* Ein neues Lied, dessen Schnur gerade außerhalb liegt: dorthin schieben */
  function insBild(i) {
    if (!g) return;
    const x = xVon(i);
    if (x >= 40 && x <= W - 40) return;
    pan = RAND + i * g.abstand - W / 2; panY = 0; klemmen(); szeneAlt = true;
  }

  /* ---------- Maus ---------- */
  function treffer(ev) {
    if (!g || !lieder.length) return null;
    const r = lein.getBoundingClientRect(), mx = ev.clientX - r.left, my = ev.clientY - r.top;
    if (my < g.unten) return null;
    /* die nächste Schnur in dieser Höhe - sie schlängelt sich, darum auch die Nachbarn fragen */
    const m = Math.round((mx + pan - RAND) / g.abstand);
    let i = -1, best = 1e9;
    for (let k = m - 1; k <= m + 1; k++) if (k >= 0 && k < lieder.length) { const d = Math.abs(xAt(k, my) - mx); if (d < best) { best = d; i = k; } }
    if (i < 0) return null;
    const s = lieder[i], yb = yGrund(my);
    if (best > Math.max(g.abstand / 2, 5)) return null;
    if (yb > g.yS + s.dauer * g.mass + 12 / g.zy) return null;
    const t = yb >= g.yS ? klemm((yb - g.yS) / g.mass, 0, s.dauer) : null;
    return { i, s, t, mx, my };
  }
  function tippHtml(h) {
    const s = h.s, T = haus.t;
    let datum = ''; try { datum = new Date(s.erstellt).toLocaleDateString(haus.locale(), { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) {}
    let zeile = '';
    if (h.t != null) {
      const ab = s.abschnitte; let k = 0; while (k + 1 < ab.length && ab[k + 1][0] <= h.t) k++;
      zeile = '<small>' + esc(ab[k][2] || T('schnur.ohne_name')) + ' · ' + mmss(h.t) + '</small>';
    }
    const schaetz = s.quelle === 'silben' ? '<small>' + esc(T('schnur.geschaetzt')) + '</small>' : s.quelle === 'ohne' ? '<small>' + esc(T('schnur.ohne_marken')) + '</small>' : '';
    return '<b>' + esc(s.titel || '—') + '</b><small>' + esc(datum) + ' · ' + mmss(s.dauer) + ' · ' + esc(T('schnur.likes', { n: s.likes || 0 })) + '</small>' + zeile + schaetz;
  }
  function verdrahten() {
    lein.addEventListener('wheel', (ev) => {
      if (!g) return;
      ev.preventDefault(); handZeit = performance.now();
      if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY) && !ev.ctrlKey) { pan += ev.deltaX; }
      else {
        /* Die Stelle unter der Maus bleibt stehen, in beiden Richtungen */
        const r = lein.getBoundingClientRect(), mx = ev.clientX - r.left, my = ev.clientY - r.top;
        const welt = (mx + pan - RAND) / g.abstand, yb = yGrund(my);
        zoom *= Math.exp(-ev.deltaY * (ev.deltaMode === 1 ? 0.05 : 0.0018));
        vermessen();
        pan = RAND + welt * g.abstand - mx;
        panY = my < g.unten ? panY : yb <= g.yS ? yb - my : g.yS + (yb - g.yS) * g.zy - my;
      }
      klemmen(); szeneAlt = true; haus.tippWeg();
    }, { passive: false });
    lein.addEventListener('pointerdown', (ev) => { druck = { x: ev.clientX, y: ev.clientY, pan, panY, gezogen: false }; lein.setPointerCapture(ev.pointerId); });
    lein.addEventListener('pointermove', (ev) => {
      if (druck) {
        const dx = ev.clientX - druck.x, dy = ev.clientY - druck.y;
        if (Math.hypot(dx, dy) > 4) druck.gezogen = true;
        if (druck.gezogen) {
          pan = druck.pan - dx; panY = druck.panY - dy; if (g) klemmen();
          szeneAlt = true; handZeit = performance.now(); haus.tippWeg(); lein.style.cursor = 'grabbing'; return;
        }
      }
      const h = treffer(ev);
      lein.style.cursor = h ? 'pointer' : 'grab';
      if (h) haus.tipp(tippHtml(h), ev); else haus.tippWeg();
    });
    lein.addEventListener('pointerup', (ev) => {
      const d = druck; druck = null; lein.style.cursor = 'grab';
      if (!d || d.gezogen) return;
      const h = treffer(ev); if (!h) return;
      const l = haus.laufend() || {};
      if (h.s.id === l.id && h.t != null) haus.springen(h.t); else haus.spielen(h.s.id);
    });
    lein.addEventListener('pointerleave', () => haus.tippWeg());
    new ResizeObserver(() => { groesse(); szeneAlt = true; starten(); }).observe(feld);
  }
  function groesse() {
    W = feld.clientWidth; H = feld.clientHeight; dpr = window.devicePixelRatio || 1;
    for (const k of [lein, szene, reflexLein]) { k.width = Math.max(1, Math.round(W * dpr)); k.height = Math.max(1, Math.round(H * dpr)); }
    lein.style.width = W + 'px'; lein.style.height = H + 'px';
    muster.clear();
  }
  function starten() { if (!lauf && feld && feld.offsetParent) { an = true; lauf = requestAnimationFrame(bild); } }

  /* ---------- Legende ---------- */
  /* Kleine Knotenbilder für die Legende, gemalt mit denselben Strichen und demselben Licht wie die Schnur */
  function knotenBild(art) {
    const c = document.createElement('canvas'), s = 2, w = 30, h = 34;
    c.width = w * s; c.height = h * s;
    const x = c.getContext('2d'); x.scale(s, s);
    const altS = sctx, altD = dpr; sctx = x; dpr = s;                       /* drall() legt sein Muster an sctx an */
    const gerade = (y1, y2, f) => { const p = new Path2D(); p.moveTo(15, y1); p.lineTo(15, y2); garnPfad(x, p, 7, f, 1, 0, 1); };
    gerade(0, h, art === 'wechsel' ? farben.strophe || GRAU : NATUR);
    if (art === 'wechsel') gerade(17, h, farben.refrain || GRAU);
    if (art === 'einzel') einzel(x, 15, 17, 7, 7, NATUR);
    if (art === 'lang') langknoten(x, 15, 6, 7, 7, 5, NATUR);
    if (art === 'acht') achter(x, 15, 9, 7, 7, NATUR);
    if (art === 'wechsel') einzel(x, 15, 17, 6, 7, farben.refrain || GRAU);
    if (art === 'perle') { x.clearRect(0, 0, w, h); const p = new Path2D(); p.moveTo(15, 0); p.lineTo(15, h); garnPfad(x, p, 1.4, NATUR, 1, 0, 1);
      [[5, 3.2], [13, 4.6], [24, 6.4]].forEach(([y, r]) => glasPerle(x, 15, y + (r - 3.2), r * 1.08, r, farben.refrain || GRAU)); }
    sctx = altS; dpr = altD; muster.clear();
    return '<img alt="" src="' + c.toDataURL() + '" width="' + w + '" height="' + h + '">';
  }
  function legendeHtml(T, liste, f) {
    if (f) farben = f;
    const zahl = { zeit: 0, silben: 0, ohne: 0 };
    for (const s of liste || lieder) zahl[s.quelle] = (zahl[s.quelle] || 0) + 1;
    const streifen = (c) => '<i class="ks-streifen" style="background:' + c + '"></i>';
    const abschnitte = [['strophe', 'schnur.leg.strophe'], ['refrain', 'schnur.leg.refrain'], ['bruecke', 'schnur.leg.bruecke'], ['rand', 'schnur.leg.rand']]
      .map(([a, k]) => '<div class="ks-zeile">' + streifen(farbe(a)) + '<span>' + esc(T(k)) + '</span></div>').join('')
      + '<div class="ks-zeile">' + streifen(GRAU) + '<span>' + esc(T('schnur.leg.grau')) + '</span></div>';
    const knoten = [['einzel', 'schnur.leg.einzel'], ['lang', 'schnur.leg.lang'], ['acht', 'schnur.leg.acht'], material === 'glas' ? ['perle', 'schnur.leg.perle'] : ['wechsel', 'schnur.leg.wechsel']]
      .map(([a, k]) => '<div class="ks-knoten">' + knotenBild(a) + '<span>' + esc(T(k)) + '</span></div>').join('');
    return '<div class="ks-legende">'
      + '<div class="ks-kopf">' + esc(T('schnur.leg.abschnitte')) + '</div>' + abschnitte
      + '<div class="ks-kopf">' + esc(T('schnur.leg.knoten')) + '</div>' + knoten
      + '<p class="ks-fuss">' + esc(T('schnur.leg.herkunft', { zeit: zahl.zeit, silben: zahl.silben, ohne: zahl.ohne })) + '</p>'
      + '<p class="ks-fuss">' + esc(T('schnur.leg.bedienung')) + '</p></div>';
  }

  wurzel.Knotenschnur = {
    einrichten(element, h) {
      if (feld === element) return;
      feld = element; haus = h;
      lein = document.createElement('canvas'); lein.className = 'ks-lein'; lein.style.cursor = 'grab'; lein.style.touchAction = 'none';
      szene = document.createElement('canvas'); sctx = szene.getContext('2d'); ctx = lein.getContext('2d');
      reflexLein = document.createElement('canvas');
      feld.prepend(lein);
      groesse(); verdrahten();
    },
    setzen(liste, f) {
      const alt = lieder.map(s => s.id).join(',');
      lieder = liste || []; farben = f || farben;
      index = new Map(lieder.map((s, i) => [s.id, i]));
      if (lieder.map(s => s.id).join(',') !== alt) { zoom = 1; pan = 0; panY = 0; letzteId = null; }
      szeneAlt = true;
    },
    material(name) { if (name === 'garn' || name === 'glas') { material = name; szeneAlt = true; } return material; },
    zeigen() { if (!feld) return; groesse(); szeneAlt = true; starten(); },
    ruhen() { an = false; if (lauf) cancelAnimationFrame(lauf); lauf = 0; },
    legendeHtml,
  };
})(typeof window !== 'undefined' ? window : globalThis);
