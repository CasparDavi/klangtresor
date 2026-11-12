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

   Gebrauch (klassisches Skript, legt window.Knotenschnur an; das Haus verdrahtet es in schnurZeichnen):
     Knotenschnur.einrichten(element, haus)    haus: { t, locale(), laufend() → {id, t, spielt}, spielen(id), springen(sek),
                                                tipp(html, ev), tippWeg() }
     Knotenschnur.setzen(lieder, farben)       lieder aus /api/knotenschnur (bin/knotenschnur.js), schon gefiltert
     Knotenschnur.zeigen() / .ruhen()          Zeichenschleife an / aus
     Knotenschnur.legendeHtml(t, lieder, farben)
   Gemalt wird in zwei Ebenen: die ruhende Szene (Garn, Knoten, Beschriftung) nur bei Zoom, Verschieben, Größe oder neuen
   Daten; darüber je Bild nur der Lichtschein. */
(function (wurzel) {
  'use strict';

  const NATUR = '#cdb58c';        /* ungefärbte Baumwolle: Hauptschnur und Kopfstück jeder Schnur */
  const GRAU = '#5d636c';         /* ohne Abschnitt: Vorspiel vor dem ersten Wort, Text ohne Abschnittsmarken */
  const RAND = 30;                /* Luft links und rechts der ersten und letzten Schnur */
  const OBEN = 58;                /* Mitte der Hauptschnur; darüber stehen Jahre und Monate */
  const KOPF = 0.21;              /* Anteil der Höhe für die Zahlknoten */
  const MAX_ABSTAND = 170;        /* engster Zoom: so weit liegen zwei Schnüre auseinander */

  let feld = null, lein = null, ctx = null, szene = null, sctx = null, haus = null;
  let lieder = [], farben = {}, index = new Map();
  let W = 0, H = 0, dpr = 1, zoom = 1, pan = 0, g = null;
  let szeneAlt = true, neuMalen = true, lauf = 0, an = false, letzteId = null, letzteT = -1, druck = null;
  const muster = new Map();

  const klemm = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const farbe = (a) => (a && farben[a]) || GRAU;
  const mmss = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  /* ---------- Geometrie ---------- */
  function vermessen() {
    const n = lieder.length;
    const basis = n > 1 ? (W - 2 * RAND) / (n - 1) : 0;
    const zMax = basis > 0 ? Math.max(1, MAX_ABSTAND / basis) : 1;
    zoom = klemm(zoom, 1, zMax);
    const abstand = basis * zoom, breite = (n - 1) * abstand + 2 * RAND;
    pan = klemm(pan, 0, Math.max(0, breite - W));
    /* Ziffern je Stelle über alle gezeigten Schnüre: danach richtet sich die Höhe der Knotenreihen */
    let mH = 0, mZ = 0, mE = 0, maxD = 1;
    for (const s of lieder) {
      const l = s.likes || 0; mH = Math.max(mH, Math.min(9, Math.floor(l / 100))); mZ = Math.max(mZ, Math.floor(l / 10) % 10); mE = Math.max(mE, l % 10);
      maxD = Math.max(maxD, s.dauer || 0);
    }
    /* Das Kopfstück ist so hoch, wie die Knoten es brauchen, höchstens KOPF der Höhe: im Überblick sind die Knoten klein
       und die Lieder bekommen den Platz, nah heran wachsen die Knoten mit der Schnur. */
    const bedarf = (mH ? mH * 1.7 + 0.9 : 0) + (mZ ? mZ * 1.7 + 0.9 : 0) + (mE > 1 ? mE * 0.52 + 1.3 : mE === 1 ? 2.2 : 0);
    const knMax = bedarf ? (H * KOPF - 14) / bedarf : 99;
    const w = klemm(Math.min(abstand * 0.6, 16, knMax * 1.3), 1.6, 16);    /* Dicke einer Liedschnur */
    const kn = Math.min(w, knMax);                                          /* Knotenmaß */
    const kopfH = Math.round(bedarf * kn + 16);
    const hauptW = klemm(w * 1.45, 5, 22);
    const y0 = OBEN + hauptW / 2 + 9;
    const yH = y0, yZ = yH + (mH ? mH * 1.7 * kn + 0.9 * kn : 0), yE = yZ + (mZ ? mZ * 1.7 * kn + 0.9 * kn : 0);
    const yS = OBEN + hauptW / 2 + kopfH;                                   /* hier beginnt die Zeit */
    const mass = Math.max(0.05, (H - 22 - yS) / maxD);                      /* Pixel je Sekunde */
    g = { abstand, w, kn, hauptW, yH, yZ, yE, yS, mass, breite, unten: OBEN + hauptW / 2 };
  }
  const xVon = (i) => RAND + i * g.abstand - pan;

  /* ---------- das natürliche Schlängeln (Caspar_D, 12.11.2026: „ein bisschen natürlicheres jittering … natürliche Schlängel
     oder Wellenverhalten“) ----------
     Jede Schnur hat ihre eigene ruhige Wellenform, fest aus ihrer Kennung gewürfelt: sie sieht bei jedem Öffnen gleich aus.
     Am Ankerknoten liegt sie still, nach unten wird sie freier. Zwei langsame Wellen und eine leichte Schräge, nur seitlich:
     die Höhe bleibt, also stimmen Zeiten und Knotenreihen weiter. Die Weite wächst mit dem Abstand der Schnüre. */
  const wellen = new Map();
  function wellenform(id) {
    if (wellen.has(id)) return wellen.get(id);
    let h = 2166136261;
    for (const ch of String(id)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    const zufall = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
    const f = { l1: 190 + zufall() * 170, l2: 70 + zufall() * 60, p1: zufall() * 6.2832, p2: zufall() * 6.2832, a2: 0.18 + zufall() * 0.2, schraeg: (zufall() - 0.5) * 0.6 };
    wellen.set(id, f); return f;
  }
  function xAt(i, y) {
    const s = y - g.unten, x = xVon(i);
    if (s <= 0) return x;
    const f = wellenform(lieder[i].id), A = klemm(g.abstand * 0.3, 1.2, 10);
    const huelle = Math.min(1, s / 90) * (0.65 + 0.35 * Math.min(1, s / Math.max(1, H)));
    return x + A * huelle * (Math.sin(s / f.l1 * 6.2832 + f.p1) * (1 - f.a2) + Math.sin(s / f.l2 * 6.2832 + f.p2) * f.a2 + f.schraeg * s / Math.max(1, H));
  }
  /* die Bahn einer Schnur zwischen zwei Höhen, alle 4 px ein Punkt */
  function bahn(i, y1, y2) {
    const p = new Path2D(), n = Math.max(1, Math.ceil((y2 - y1) / 4));
    for (let k = 0; k <= n; k++) { const y = y1 + (y2 - y1) * k / n, x = xAt(i, y); if (k) p.lineTo(x, y); else p.moveTo(x, y); }
    return p;
  }
  /* Ein Stück Garn entlang der Bahn: dunkle Ränder, Farbe, Drall, Glanzlicht links - die Rundung folgt der Biegung */
  function strangKurve(c, i, y1, y2, w, f) {
    if (y2 - y1 < 0.2) return;
    const p = bahn(i, y1, y2);
    c.lineCap = 'butt'; c.lineJoin = 'round';
    if (w < 2.4) { c.strokeStyle = f; c.lineWidth = w; c.stroke(p); return; }
    c.strokeStyle = f; c.lineWidth = w; c.stroke(p);
    c.strokeStyle = 'rgba(0,0,0,.62)'; c.stroke(p);
    c.strokeStyle = f; c.lineWidth = w * 0.68; c.stroke(p);
    if (w >= 3.2) { c.strokeStyle = drall(w); c.lineWidth = w; c.stroke(p); }
    c.save(); c.translate(-w * 0.16, 0); c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = w * 0.24; c.stroke(p); c.restore();
  }
  /* Einen Knoten an die Schnur setzen, gedreht nach ihrer Neigung an dieser Stelle */
  function amFaden(c, i, y, mal) {
    const neig = Math.atan((xAt(i, y + 2) - xAt(i, y - 2)) / 4);
    c.save(); c.translate(xAt(i, y), y); c.rotate(-neig); mal(); c.restore();
  }

  /* ---------- Garn ---------- */
  function drall(w) {
    const s = Math.max(4, Math.round(w * 0.8 * dpr)), k = s + ':' + dpr;
    if (muster.has(k)) return muster.get(k);
    const c = document.createElement('canvas'); c.width = c.height = s;
    const x = c.getContext('2d');
    x.strokeStyle = 'rgba(0,0,0,.34)'; x.lineWidth = s * 0.36;
    for (const d of [-s, 0, s]) { x.beginPath(); x.moveTo(d, s); x.lineTo(d + s, 0); x.stroke(); }
    x.strokeStyle = 'rgba(255,255,255,.09)'; x.lineWidth = s * 0.12;
    for (const d of [-s, 0, s]) { x.beginPath(); x.moveTo(d + s * 0.5, s); x.lineTo(d + s * 1.5, 0); x.stroke(); }
    const p = sctx.createPattern(c, 'repeat');
    p.setTransform && p.setTransform(new DOMMatrix([1 / dpr, 0, 0, 1 / dpr, 0, 0]));
    muster.set(k, p); return p;
  }
  function zylinder(c, x, w) {
    const v = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    v.addColorStop(0, 'rgba(0,0,0,.62)'); v.addColorStop(0.38, 'rgba(255,255,255,.2)');
    v.addColorStop(0.56, 'rgba(255,255,255,0)'); v.addColorStop(1, 'rgba(0,0,0,.68)');
    return v;
  }
  function strang(c, x, y1, y2, w, f, zyl) {
    if (y2 - y1 < 0.2) return;
    c.fillStyle = f; c.fillRect(x - w / 2, y1, w, y2 - y1);
    if (w >= 3.2) { c.fillStyle = drall(w); c.fillRect(x - w / 2, y1, w, y2 - y1); }
    if (w >= 2.4) { c.fillStyle = zyl; c.fillRect(x - w / 2, y1, w, y2 - y1); }
  }
  function ball(c, cx, cy, rx, ry, f) {
    c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 7); c.fillStyle = f; c.fill();
    if (rx < 2) return;
    const r = c.createRadialGradient(cx - rx * 0.35, cy - ry * 0.4, 0, cx, cy, Math.max(rx, ry) * 1.15);
    r.addColorStop(0, 'rgba(255,255,255,.4)'); r.addColorStop(0.45, 'rgba(255,255,255,0)'); r.addColorStop(1, 'rgba(0,0,0,.66)');
    c.fillStyle = r; c.fill();
  }
  /* Ein Strang als Röhre: dunkler Rand, Farbe, Glanzlicht */
  function roehre(c, pfad, w, f) {
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(0,0,0,.75)'; c.lineWidth = w; c.stroke(pfad);
    c.strokeStyle = f; c.lineWidth = w * 0.76; c.stroke(pfad);
    if (w < 2) return;
    c.save(); c.translate(-w * 0.12, -w * 0.12); c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = w * 0.22; c.stroke(pfad); c.restore();
  }
  const kurve = (x1, y1, cx1, cy1, cx2, cy2, x2, y2) => { const p = new Path2D(); p.moveTo(x1, y1); p.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2); return p; };

  /* ---------- die drei Knoten der Inka ---------- */
  /* Einzelknoten (Überhandknoten): ein Wulst, über den eine Schlinge schräg läuft. cy = Mitte. */
  function einzel(c, x, cy, kn, w, f) {
    const rx = Math.max(kn * 0.95, w * 0.62), ry = kn * 0.78;
    if (kn < 2.4) { ball(c, x, cy, rx, ry, f); return; }
    ball(c, x, cy, rx, ry, f);
    roehre(c, kurve(x - rx * 0.9, cy - ry * 0.55, x - rx * 0.2, cy - ry * 0.05, x + rx * 0.2, cy + ry * 0.05, x + rx * 0.9, cy + ry * 0.55), kn * 0.5, f);
  }
  /* Langknoten: so viele Windungen wie die Einerziffer (2–9). y = Oberkante; gibt die Höhe zurück. */
  function langknoten(c, x, y, kn, w, n, f) {
    const b = Math.max(kn * 0.9, w * 0.6), h = n * kn * 0.52 + kn * 0.5;
    c.beginPath(); c.roundRect ? c.roundRect(x - b, y, 2 * b, h, b) : c.rect(x - b, y, 2 * b, h);
    c.fillStyle = f; c.fill();
    if (kn < 2.4) return h;
    c.fillStyle = zylinder(c, x, 2 * b); c.fill();
    for (let i = 0; i < n; i++) {
      const yy = y + kn * 0.42 + i * kn * 0.52, p = new Path2D();
      p.moveTo(x - b * 0.94, yy); p.quadraticCurveTo(x, yy + kn * 0.42, x + b * 0.94, yy + kn * 0.18);
      roehre(c, p, kn * 0.42, f);
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
    const { abstand, w, kn, hauptW, yS, mass } = g;
    const oben = OBEN - hauptW / 2, unten = OBEN + hauptW / 2;
    const i0 = Math.max(0, Math.floor((pan - RAND) / abstand) - 1), i1 = Math.min(lieder.length - 1, Math.ceil((pan + W - RAND) / abstand) + 1);
    const mitAnker = w >= 5;

    /* 1. die Liedschnüre, hinter der Hauptschnur beginnend */
    for (let i = i0; i <= i1; i++) {
      const s = lieder[i], x = xVon(i);
      if (mitAnker) roehre(c, kurve(x - w * 0.5, unten, x - w * 0.5, oben - hauptW * 0.9, x + w * 0.5, oben - hauptW * 0.9, x + w * 0.5, unten), w * 0.62, NATUR);
      strangKurve(c, i, unten - 1, yS, w, NATUR);
      /* die Likes als Zahlknoten, Stelle für Stelle auf gleicher Höhe */
      const L = s.likes || 0, h = Math.min(9, Math.floor(L / 100)), z = Math.floor(L / 10) % 10, e = L % 10;
      for (let q = 0; q < h; q++) amFaden(c, i, g.yH + kn * 0.8 + q * kn * 1.7, () => einzel(c, 0, 0, kn, w, NATUR));
      for (let q = 0; q < z; q++) amFaden(c, i, g.yZ + kn * 0.8 + q * kn * 1.7, () => einzel(c, 0, 0, kn, w, NATUR));
      if (e === 1) amFaden(c, i, g.yE, () => achter(c, 0, 0, kn, w, NATUR)); else if (e > 1) amFaden(c, i, g.yE, () => langknoten(c, 0, 0, kn, w, e, NATUR));
      /* das Lied in seinen Abschnitten */
      const ab = s.abschnitte, ende = yS + s.dauer * mass;
      for (let k = 0; k < ab.length; k++) {
        const a = yS + ab[k][0] * mass, b = k + 1 < ab.length ? yS + ab[k + 1][0] * mass : ende;
        strangKurve(c, i, a, b, w, farbe(ab[k][1]));
      }
      /* ein Knoten an jedem Abschnittswechsel, in der Farbe des neuen Abschnitts */
      if (w >= 2.6) for (let k = 1; k < ab.length; k++) {
        const b = k + 1 < ab.length ? ab[k + 1][0] : s.dauer;
        if (b - ab[k][0] < 0.5) continue;
        const kk = Math.min(kn, w) * 0.66, ff = farbe(ab[k][1]);
        amFaden(c, i, yS + ab[k][0] * mass, () => einzel(c, 0, 0, kk, w * 0.9, ff));
      }
      /* das ausgefranste Ende */
      if (w >= 4) {
        c.strokeStyle = farbe(ab[ab.length - 1][1]); c.lineWidth = Math.max(1, w * 0.12); c.globalAlpha = 0.8;
        const xe = xAt(i, ende), d = xe - xAt(i, ende - 4);
        for (let f = -2; f <= 2; f++) { c.beginPath(); c.moveTo(xe + f * w * 0.16, ende); c.lineTo(xe + f * w * 0.28 + d * w * 0.25, ende + w * 0.9); c.stroke(); }
        c.globalAlpha = 1;
      }
    }
    /* 2. die Hauptschnur */
    c.fillStyle = NATUR; c.fillRect(0, oben, W, hauptW);
    c.fillStyle = drall(hauptW); c.fillRect(0, oben, W, hauptW);
    { const v = c.createLinearGradient(0, oben, 0, unten);
      v.addColorStop(0, 'rgba(0,0,0,.6)'); v.addColorStop(0.38, 'rgba(255,255,255,.24)'); v.addColorStop(0.56, 'rgba(255,255,255,0)'); v.addColorStop(1, 'rgba(0,0,0,.7)');
      c.fillStyle = v; c.fillRect(0, oben, W, hauptW); }
    /* 3. vor der Hauptschnur: die beiden Enden des Ankerknotens, bei dünnen Schnüren ein Punkt */
    for (let i = i0; i <= i1; i++) {
      const x = xVon(i);
      if (mitAnker) {
        roehre(c, kurve(x - w * 0.5, oben - hauptW * 0.3, x - w * 0.5, OBEN, x - w * 0.4, OBEN, x - w * 0.36, unten + hauptW * 0.45), w * 0.62, NATUR);
        roehre(c, kurve(x + w * 0.5, oben - hauptW * 0.3, x + w * 0.5, OBEN, x + w * 0.4, OBEN, x + w * 0.36, unten + hauptW * 0.45), w * 0.62, NATUR);
      } else ball(c, x, OBEN, Math.max(1.2, w * 0.7), Math.max(1.2, w * 0.7), '#e4d4b4');
    }
    /* 4. Jahre und Monate über der Hauptschnur, Titel bei genug Platz */
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
      c.fillStyle = 'rgba(0,0,0,.85)'; c.fillRect(0, oben - 30, b + 4, 24);
      c.fillStyle = '#c9cdd3'; c.fillText(name, 8, oben - 12);
    }
    if (abstand >= 84) {
      c.font = '12.5px ' + schrift; c.fillStyle = '#cfd3d8';
      const rechts = Math.max(w, kn * 1.9) * 0.62 + 6, platz = abstand - rechts - 8;
      for (let i = i0; i <= i1; i++) {
        let tx = lieder[i].titel || '—';
        if (c.measureText(tx).width > platz) { while (tx.length > 1 && c.measureText(tx + '…').width > platz) tx = tx.slice(0, -1); tx += '…'; }
        c.fillText(tx, xVon(i) + rechts, unten + 16);
        c.fillStyle = '#8a9099'; c.font = '12px ' + schrift;
        c.fillText(haus.t('schnur.likes', { n: lieder[i].likes || 0 }), xVon(i) + rechts, unten + 31);
        c.fillStyle = '#cfd3d8'; c.font = '12.5px ' + schrift;
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
      if (szeneAlt) szeneMalen();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(szene, 0, 0);
      if (i !== undefined && g) glut(i, l, jetzt);
      letzteT = l.t || 0;
    }
    lauf = requestAnimationFrame(bild);
  }
  function glut(i, l, jetzt) {
    const s = lieder[i], x0 = xVon(i);
    if (x0 < -60 || x0 > W + 60) return;
    const { w, yS, mass, hauptW } = g;
    const t = klemm(l.t || 0, 0, s.dauer), y = yS + t * mass, x = xAt(i, y);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* das Gespielte bleibt heller, entlang der Biegung */
    ctx.globalCompositeOperation = 'lighter';
    if (y - yS > 0.5) { ctx.lineCap = 'butt'; ctx.strokeStyle = 'rgba(255,236,190,.20)'; ctx.lineWidth = w; ctx.stroke(bahn(i, yS, y)); }
    /* ein Hof um den Ankerknoten: so findet man die Schnur auch im Überblick */
    const ra = Math.max(10, hauptW * 1.3), ha = ctx.createRadialGradient(x0, OBEN, 0, x0, OBEN, ra);
    ha.addColorStop(0, 'rgba(255,214,140,.55)'); ha.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.fillStyle = ha; ctx.fillRect(x0 - ra, OBEN - ra, 2 * ra, 2 * ra);
    /* der Lichtschein */
    const puls = l.spielt ? 1 + 0.07 * Math.sin(jetzt / 300) : 0.8;
    const r = Math.max(34, w * 3.2) * puls, gl = ctx.createRadialGradient(x, y, 0, x, y, r);
    gl.addColorStop(0, 'rgba(255,248,224,1)'); gl.addColorStop(0.22, 'rgba(255,212,128,.72)'); gl.addColorStop(1, 'rgba(255,150,40,0)');
    ctx.fillStyle = gl; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    ctx.globalCompositeOperation = 'source-over';
  }
  /* Ein neues Lied, dessen Schnur gerade außerhalb liegt: dorthin schieben */
  function insBild(i) {
    if (!g) return;
    const x = xVon(i);
    if (x >= 40 && x <= W - 40) return;
    pan = RAND + i * g.abstand - W / 2; szeneAlt = true;
  }

  /* ---------- Maus ---------- */
  function treffer(ev) {
    if (!g || !lieder.length) return null;
    const r = lein.getBoundingClientRect(), mx = ev.clientX - r.left, my = ev.clientY - r.top;
    /* die nächste Schnur in dieser Höhe - sie schlängelt sich, darum auch die Nachbarn fragen */
    const m = Math.round((mx + pan - RAND) / g.abstand);
    let i = -1, best = 1e9;
    for (let k = m - 1; k <= m + 1; k++) if (k >= 0 && k < lieder.length) { const d = Math.abs(xAt(k, my) - mx); if (d < best) { best = d; i = k; } }
    if (i < 0) return null;
    const s = lieder[i];
    if (best > Math.max(g.abstand / 2, 5)) return null;
    if (my < OBEN - g.hauptW || my > g.yS + s.dauer * g.mass + 12) return null;
    const t = my >= g.yS ? klemm((my - g.yS) / g.mass, 0, s.dauer) : null;
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
      ev.preventDefault();
      if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY) && !ev.ctrlKey) { pan += ev.deltaX; }
      else {
        const r = lein.getBoundingClientRect(), mx = ev.clientX - r.left;
        const welt = (mx + pan - RAND) / g.abstand;                         /* diese Schnur bleibt unter der Maus */
        zoom *= Math.exp(-ev.deltaY * (ev.deltaMode === 1 ? 0.05 : 0.0018));
        vermessen();
        pan = RAND + welt * g.abstand - mx;
      }
      szeneAlt = true; haus.tippWeg();
    }, { passive: false });
    lein.addEventListener('pointerdown', (ev) => { druck = { x: ev.clientX, pan, gezogen: false }; lein.setPointerCapture(ev.pointerId); });
    lein.addEventListener('pointermove', (ev) => {
      if (druck) {
        const dx = ev.clientX - druck.x;
        if (Math.abs(dx) > 4) druck.gezogen = true;
        if (druck.gezogen) { pan = druck.pan - dx; szeneAlt = true; haus.tippWeg(); lein.style.cursor = 'grabbing'; return; }
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
    for (const k of [lein, szene]) { k.width = Math.max(1, Math.round(W * dpr)); k.height = Math.max(1, Math.round(H * dpr)); }
    lein.style.width = W + 'px'; lein.style.height = H + 'px';
    muster.clear();
  }
  function starten() { if (!lauf && feld && feld.offsetParent) { an = true; lauf = requestAnimationFrame(bild); } }

  /* ---------- Legende ---------- */
  /* Kleine Knotenbilder für die Legende, gemalt mit denselben Strichen wie die Schnur */
  function knotenBild(art, f) {
    const c = document.createElement('canvas'), s = 2, w = 30, h = 34;
    c.width = w * s; c.height = h * s;
    const x = c.getContext('2d'); x.scale(s, s);
    const altS = sctx; sctx = x;                                            /* drall() legt sein Muster an sctx an */
    const altD = dpr; dpr = s;
    strang(x, 15, 0, h, 7, art === 'wechsel' ? farben.strophe || GRAU : NATUR, zylinder(x, 15, 7));
    if (art === 'wechsel') strang(x, 15, 17, h, 7, farben.refrain || GRAU, zylinder(x, 15, 7));
    if (art === 'einzel') einzel(x, 15, 17, 7, 7, NATUR);
    if (art === 'lang') langknoten(x, 15, 6, 7, 7, 5, NATUR);
    if (art === 'acht') achter(x, 15, 9, 7, 7, NATUR);
    if (art === 'wechsel') einzel(x, 15, 17, 6, 7, farben.refrain || GRAU);
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
    const knoten = [['einzel', 'schnur.leg.einzel'], ['lang', 'schnur.leg.lang'], ['acht', 'schnur.leg.acht'], ['wechsel', 'schnur.leg.wechsel']]
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
      feld.prepend(lein);
      groesse(); verdrahten();
    },
    setzen(liste, f) {
      const alt = lieder.map(s => s.id).join(',');
      lieder = liste || []; farben = f || farben;
      index = new Map(lieder.map((s, i) => [s.id, i]));
      if (lieder.map(s => s.id).join(',') !== alt) { zoom = 1; pan = 0; letzteId = null; }
      szeneAlt = true;
    },
    zeigen() { if (!feld) return; groesse(); szeneAlt = true; starten(); },
    ruhen() { an = false; if (lauf) cancelAnimationFrame(lauf); lauf = 0; },
    legendeHtml,
  };
})(typeof window !== 'undefined' ? window : globalThis);
