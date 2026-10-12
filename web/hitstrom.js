/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   DER HITSTROM - die Hitparade ueber die Zeit als Streamgraph (Caspar_D, 12.10.2026: „im Prophane-Repository
   liegt ein Streamgraph rum, den hätte ich gerne als Darstellung der Hitparade über die Zeit" - „nur die 10 bewegtesten über die
   ganze Zeit, nicht sonstige" - „unter den Hitparaden"). Steht im Profil ueber „Die zehn bewegtesten" und „Die zehn meistgeherzten" (Caspar_D: „über den Hitparaden ist besser"); Name „Hitstrom" von ihm.

   Daten: der Zaehlerverlauf je Titel (Katalog, aufbereiten.js schreibt je Tag einen Stand, nur bei Aenderung). Je Kalenderwoche der
   Zuwachs an Resonanz (Abrufe + 2 x Herzen + 3 x Kommentare, wie „Meiste Bewegung"); EIN Wert je Wochengrenze fuer beide
   Nachbarwochen: der letzte Stand vor dem Montag, null fuer einen Titel, der erst danach erschien, sonst sein erster Stand (Caspar_D:
   „die Werte von Noch lachst Du können nicht stimmen" - erst fiel die Erscheinungswoche weg, dann der Zuwachs zwischen Sonntags- und
   Montagsstand). Die laufende Woche fehlt (sie liefe sonst auf null zu). Gezeigt werden die zwoelf Titel mit dem groessten Zuwachs
   ueber alle vollen Wochen (erst zehn; Caspar_D: „wir können auch ein Dutzend nehmen“ - bei 12 bekommen 11 einen Namen, bei 15 nur 13), jede Woche als 100 % ihrer gemeinsamen Resonanz.

   Form wie der Streamgraph in Prophane (tools/viewer/viewer.html, nach Paver): Reihenfolge von innen nach aussen nach dem Zeitpunkt
   des Gipfels, Grundlinie mit geringstem gewichtetem Wackeln (Byron & Wattenberg 2008), Kanten als monotone kubische Kurven (Fritsch
   & Carlson 1980) - alle mit denselben x der Stuetzpunkte, die Summen sind exakte Bezierkurven und zwei Kanten kreuzen sich nie.
   Dazu (Caspar_D: „ich möchte, dass es ein hauptsächlich horizontal verlaufendes Band gibt, momentan steigt es an") wird von der
   Mittellinie des Stroms ihre Ausgleichsgerade abgezogen.

   Hausregeln der Profildiagramme (docs/haus/HAUSREGELN.md): schwarzer Datenbereich mit runden Ecken, keine Gitterlinien; jede Flaeche
   mit einer 1-px-Topline oben, um ein Viertel aufgehellt. Sechs Farben (Caspar_D: „nimm noch ein gedämpftes Weiß zu den
   Akzentfarben, dann haben wir 3, und dann dunkelst du jede Farbe nochmal ab, dann haben wir 6"): Akzent 1 und 2 des laufenden Titels
   und ein gedaempftes Weiss, dazu dieselben auf 55 % Helligkeit; die obere Haelfte nach Bewegung traegt die hellen, die untere
   die dunklen, Nachbarn nie im selben Ton. In jedem Band ein sanfter senkrechter Verlauf wie im Glockenstuhl, 0,66 oben, 0,22 unten.

   Namen (Caspar_D: „glätte gar nicht, nimm einfach die Mittellinie des Bandes und suche den horizontalsten Abschnitt"; „schreibst du
   die Beschriftung in Toplinefarbe"; „wenn der Text nicht ins Band passt, dann kürze ihn etwas mit …"): auf der Mitte zwischen den
   Raendern, im waagrechtesten Abschnitt, in dem der Name mit 9 bis 15 Punkt und 1,15-facher Dicke (quer zur Linie gemessen, steile
   Stuecke ueber 30 Grad bestraft) Platz hat, dort die groesste Schrift; passt er nirgends, so wenig gekuerzt wie noetig. Bezug wie bei
   den Zellnamen im Klangschaum: der Koerper der Kleinbuchstaben mittig auf der Linie, bei einer Senke (∪) der Pfad auf der Oberkante
   der m-Hoehe. */

const resonanz = (e) => (e.plays || 0) + 2 * (e.likes || 0) + 3 * (e.kommentare || 0);
const tagVon = (d) => Date.parse(d + 'T00:00:00Z') / 864e5;
const kw = (tag) => { const d = new Date(tag * 864e5), dd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 3)), y0 = new Date(Date.UTC(dd.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((dd - y0) / 864e5 - 3 + ((y0.getUTCDay() + 6) % 7)) / 7); };
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Wochenzuwaechse der zehn bewegtesten. songs: [{id, titel, erstellt}], verlauf: {id: [{stand, plays, likes, kommentare}]} */
export function hitstromDaten(songs, verlauf, anzahl = 12){
  const S = songs.filter(s => verlauf[s.id] && verlauf[s.id].length);
  if (!S.length) return null;
  let t0 = Infinity, t1 = -Infinity;
  for (const s of S) for (const e of verlauf[s.id]){ const t = tagVon(e.stand); t0 = Math.min(t0, t); t1 = Math.max(t1, t); }
  const mo = t0 - ((new Date(t0 * 864e5).getUTCDay() + 6) % 7), grenzen = [];
  for (let t = mo; t <= t1; t += 7) grenzen.push(t);                     /* Montage; die letzte Grenze beginnt die laufende Woche */
  const wochen = grenzen.length - 1;                                    /* nur volle Wochen */
  if (wochen < 2) return null;
  const standBei = (v, t) => { let w = null; for (const e of v) if (tagVon(e.stand) < t) w = resonanz(e); return w; };
  const wertAn = (s, t) => { if (s.erstellt && Date.parse(s.erstellt) / 864e5 >= t) return 0;
    const v = verlauf[s.id], w = standBei(v, t); return w != null ? w : resonanz(v[0]); };
  const zeilen = S.map(s => { const an = grenzen.map(t => wertAn(s, t)), v = [];
    for (let j = 0; j < wochen; j++) v.push(Math.max(0, an[j + 1] - an[j]));
    return { id: s.id, titel: s.titel || '—', v, summe: v.reduce((a, b) => a + b, 0) }; });
  const zehn = zeilen.filter(z => z.summe > 0).sort((a, b) => b.summe - a.summe).slice(0, anzahl);
  if (zehn.length < 2) return null;
  return { zehn, wochen: grenzen.slice(0, wochen) };
}

function monotone(xs, ys){
  const N = xs.length, d = [], m = new Array(N);
  for (let q = 0; q < N - 1; q++) d.push((ys[q + 1] - ys[q]) / ((xs[q + 1] - xs[q]) || 1e-9));
  m[0] = d[0]; m[N - 1] = d[N - 2]; for (let q = 1; q < N - 1; q++) m[q] = d[q - 1] * d[q] <= 0 ? 0 : (d[q - 1] + d[q]) / 2;
  for (let q = 0; q < N - 1; q++){ if (d[q] === 0){ m[q] = 0; m[q + 1] = 0; continue; }
    const a = m[q] / d[q], b = m[q + 1] / d[q], s = a * a + b * b; if (s > 9){ const t = 3 / Math.sqrt(s); m[q] = t * a * d[q]; m[q + 1] = t * b * d[q]; } }
  const out = []; for (let q = 0; q < N - 1; q++){ const h = (xs[q + 1] - xs[q]) / 3; out.push([xs[q] + h, ys[q] + m[q] * h, xs[q + 1] - h, ys[q + 1] - m[q + 1] * h, xs[q + 1], ys[q + 1]]); }
  return out;
}

/* Das Bild. daten aus hitstromDaten; breite in Punkten; akzente: zwei CSS-Farben; messen(text, groesse) -> Breite; schrift: font-family.
   DIE FARBEN FOLGEN DEM LAUFENDEN TITEL (Caspar_D, 12.10.2026: „ob der Farblistener auch die Farben des aktuellen Titels auf den
   Streamgraph überträgt" - tat er nicht: die Akzente wurden einmal als Hex gelesen und eingebrannt). Jetzt stehen die Variablen
   --titel-a/-b selbst im Bild, abgedunkelt und aufgehellt per color-mix; uiFaerben() aendert sie bei jedem Titelwechsel, und der
   Browser faerbt den Strom mit wie die Balken der anderen Profildiagramme - ohne neu zu zeichnen. Darum als style, nicht als
   Attribut: Variablen und color-mix gelten nur in CSS-Eigenschaften. */
export function hitstromSvg(daten, { breite = 680, hoehe = 200, links = 0, rechts = null, akzente = ['var(--titel-a,#f97b14)', 'var(--titel-b,#e31c79)'], messen, schrift = 'system-ui, sans-serif', xHoehe = 0.52 } = {}){
  const items = daten.zehn, m = daten.wochen.length, n = items.length;
  const vals = items.map(it => it.v.map((x, j) => { const t = items.reduce((a, q) => a + q.v[j], 0); return t ? 100 * x / t : 0; }));
  /* von innen nach aussen */
  const sums = vals.map(v => v.reduce((a, b) => a + b, 0)), peak = vals.map(v => v.reduce((b, x, j) => x > v[b] ? j : b, 0));
  const nachGipfel = vals.map((_, i) => i).sort((a, b) => peak[a] - peak[b] || sums[b] - sums[a]); let oben = 0, unten = 0; const tops = [], bots = [];
  for (const j of nachGipfel){ if (oben < unten){ oben += sums[j]; tops.push(j); } else { unten += sums[j]; bots.push(j); } }
  const order = bots.reverse().concat(tops);
  /* gewichtetes Wackeln, dann ohne Trend */
  const g = new Float64Array(m); { let y = 0; for (let j = 1; j < m; j++){ let s1 = 0, s2 = 0;
    for (let ii = 0; ii < n; ii++){ const i = order[ii], a = vals[i][j]; let s3 = (a - vals[i][j - 1]) / 2; for (let kk = 0; kk < ii; kk++){ const k = order[kk]; s3 += vals[k][j] - vals[k][j - 1]; } s1 += a; s2 += s3 * a; }
    if (s1) y -= s2 / s1; g[j] = y; } }
  { const c = Array.from({ length: m }, (_, j) => g[j] + vals.reduce((a, v) => a + v[j], 0) / 2), xm = (m - 1) / 2, cm = c.reduce((a, b) => a + b, 0) / m; let sxy = 0, sxx = 0;
    for (let j = 0; j < m; j++){ sxy += (j - xm) * (c[j] - cm); sxx += (j - xm) ** 2; }
    const b = sxx ? sxy / sxx : 0; for (let j = 0; j < m; j++) g[j] -= b * (j - xm); }
  /* Masse (Caspar_D, 12.10.2026: „die Streamenden sollten mit den Bildkanten der Hitparaden fluchten, ggf. die linke und rechte
     Beschriftung der Wochen versetzen"): der Strom und sein schwarzer Grund reichen genau von links bis rechts - die Seite misst dort
     die Aussenkanten der Cover; darunter die Wochen, die erste buendig links, die letzte buendig rechts */
  const X0 = links, X1 = rechts == null ? breite : rechts, TOP = 4, PH = hoehe - 26, f = (v) => v.toFixed(1);
  const px = Array.from({ length: m }, (_, j) => X0 + j / (m - 1) * (X1 - X0));
  let lo = Infinity, hi = -Infinity; for (let j = 0; j < m; j++){ lo = Math.min(lo, g[j]); hi = Math.max(hi, g[j] + vals.reduce((a, v) => a + v[j], 0)); }
  const mitte = (lo + hi) / 2, Y = (v) => TOP + 10 + (PH - 20) / 2 - (v - mitte) / ((hi - lo) * 1.02) * (PH - 20);
  const segG = monotone(px, Array.from(g)), segB = vals.map(v => monotone(px, v)), kanten = [segG.map(c => c.slice())], start = [g[0]];
  order.forEach((i, kk) => { const vor = kanten[kk]; kanten.push(vor.map((c, j) => [c[0], c[1] + segB[i][j][1], c[2], c[3] + segB[i][j][3], c[4], c[5] + segB[i][j][5]])); start.push(start[kk] + vals[i][0]); });
  const yAt = (kk, j, t) => { if (t === 0) return j ? kanten[kk][j - 1][5] : start[kk]; const c = kanten[kk][j], y0 = j ? kanten[kk][j - 1][5] : start[kk], u = 1 - t;
    return u * u * u * y0 + 3 * u * u * t * c[1] + 3 * u * t * t * c[3] + t * t * t * c[5]; };
  /* sechs Farben, nach Rang hell/dunkel, nach Lage im Stapel reihum, nie der Ton des Nachbarn darunter */
  const toene = [akzente[0], '#cfcac2', akzente[1]], dunkel = toene.map(c => `color-mix(in srgb, ${c} 55%, #000)`), farbe = [];
  { let vorher = -1; const reihum = { h: 0, d: 0 };
    order.forEach((i, kk) => { const hell = i < Math.ceil(n / 2), k = hell ? 'h' : 'd'; let t = reihum[k] % 3; if (t === vorher) t = (t + 1) % 3;
      reihum[k] = t + 1; farbe[kk] = (hell ? toene : dunkel)[t]; vorher = t; }); }
  let defs = '', flaechen = '', toplines = '', namen = '';
  const breiteVon = (text, fs) => (messen ? messen(text, fs) : text.length * fs * 0.56) * 1.08;
  order.forEach((i, kk) => {
    const it = items[i], dn = kanten[kk], up = kanten[kk + 1], akzent = farbe[kk], topline = `color-mix(in srgb, ${akzent} 75%, #fff)`;
    const obenD = `M${f(px[0])},${f(Y(start[kk + 1]))}` + up.map(c => `C${f(c[0])},${f(Y(c[1]))} ${f(c[2])},${f(Y(c[3]))} ${f(c[4])},${f(Y(c[5]))}`).join('');
    let d = obenD + `L${f(px[m - 1])},${f(Y(dn[m - 2][5]))}`;
    for (let j = m - 2; j >= 0; j--){ const c = dn[j], y0 = j ? dn[j - 1][5] : start[kk]; d += `C${f(c[2])},${f(Y(c[3]))} ${f(c[0])},${f(Y(c[1]))} ${f(px[j])},${f(Y(y0))}`; }
    d += 'Z';
    defs += `<linearGradient id="hsv${kk}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${akzent};stop-opacity:0.66"/><stop offset="1" style="stop-color:${akzent};stop-opacity:0.22"/></linearGradient>`;
    flaechen += `<path class="hsband" data-id="${esc(it.id)}" d="${d}" fill="url(#hsv${kk})"><title>${esc(it.titel)} · ${it.summe.toLocaleString('de-DE')} Punkte in ${m} Wochen</title></path>`;
    toplines += `<path d="${obenD}" fill="none" style="stroke:${topline}" stroke-width="1" pointer-events="none"/>`;
    /* der Name: Raender je Segment neunmal abgetastet, die Mitte dazwischen ungeglaettet */
    const smp = []; for (let j = 0; j < m - 1; j++) for (let q = 0; q < 9; q++){ const t = q / 9; smp.push({ x: px[j] + (px[j + 1] - px[j]) * t, lo: Y(yAt(kk, j, t)), hi: Y(yAt(kk + 1, j, t)) }); }
    smp.push({ x: px[m - 1], lo: Y(yAt(kk, m - 2, 1)), hi: Y(yAt(kk + 1, m - 2, 1)) });
    const mid = smp.map(q => (q.lo + q.hi) / 2), arc = [0];
    for (let q = 1; q < smp.length; q++) arc.push(arc[q - 1] + Math.hypot(smp[q].x - smp[q - 1].x, mid[q] - mid[q - 1]));
    const tan30 = Math.tan(Math.PI / 6);
    const eff = smp.map((q, j) => { const a = smp[Math.max(0, j - 1)], b = smp[Math.min(smp.length - 1, j + 1)], sl = Math.abs((mid[Math.min(smp.length - 1, j + 1)] - mid[Math.max(0, j - 1)]) / ((b.x - a.x) || 1));
      let t = (q.lo - q.hi) / Math.sqrt(1 + sl * sl); if (sl > tan30) t /= 1 + 3 * (sl - tan30) / tan30; return t; });
    /* WO DER NAME STEHT - eine Bewertung statt einer Rangfolge (Caspar_D, 12.10.2026: „Noch lachst Du und Halt die Klappe, Willem
       stehen immer noch zu weit links - wie finden wir einen Platzierungsalgorithmus, der das gut hinbekommt"). Vorher zaehlte nur
       „moeglichst waagrecht, dann moeglichst gross"; der Name landete am flachen Anfang eines Bandes, auch wenn das Band viel weiter
       reicht. Nach Imhof (1975, Namen an Linien): auf den ruhigen Teil, aber in die Mitte der Ausdehnung des Objekts. Jede Stelle,
       an der der Name passt, bekommt einen Wert aus vier Teilen (je 0 bis 1):
         Groesse  Schrift / groesste, die irgendwo passt                                    Gewicht 1
         Ruhe     1 - mittlere Neigung auf der Namenslaenge / 30 Grad                        Gewicht 1,5
         Mitte    1 - Abstand zum dickengewichteten Schwerpunkt des Bandes / halbe Breite    Gewicht 1,5
         Luft     Mindestdicke / Schrift - 1,15, hoechstens 1                               Gewicht 0,5
       Die Gewichte hat Caspar_D gewaehlt („ganz klar der mittlere") aus drei Fassungen: Mitte stark (3 / Ruhe 1), ausgewogen (diese),
       Ruhe stark (3 / Mitte 0,3, etwa die alte Regel). */
    const schwer = (() => { let a = 0, b = 0; smp.forEach((q, k) => { const t = Math.max(0, q.lo - q.hi); a += q.x * t; b += t; }); return b ? a / b : (X0 + X1) / 2; })();
    const platz = (text) => { const alle = [];
      eff.forEach((e, j) => { if (e < 10) return;
        for (let fs = Math.min(15, Math.floor(e * 0.6)); fs >= 9; fs--){ const w = breiteVon(text, fs);
          let a0 = j, a1 = j; while (a0 > 0 && arc[j] - arc[a0] < w / 2) a0--; while (a1 < arc.length - 1 && arc[a1] - arc[j] < w / 2) a1++;
          if (arc[a1] - arc[a0] < w * 0.98) continue; let mn = Infinity; for (let q = a0; q <= a1; q++) mn = Math.min(mn, eff[q]); if (mn < fs * 1.15) continue;
          let st = 0; for (let q = a0; q < a1; q++) st += Math.abs(Math.atan2(mid[q + 1] - mid[q], (smp[q + 1].x - smp[q].x) || 1e-9)) * (smp[q + 1].x - smp[q].x);
          st /= Math.max(1e-9, smp[a1].x - smp[a0].x);
          alle.push({ fs, a0, a1, st, j, mn });
          break; } });
      if (!alle.length) return null;
      const fsMax = Math.max(...alle.map(c => c.fs)), G = { groesse: 1, ruhe: 1.5, mitte: 1.5, luft: 0.5 };
      for (const c of alle){
        const groesse = c.fs / fsMax, ruhe = 1 - Math.min(1, c.st / (Math.PI / 6));
        const mitte = 1 - Math.min(1, 2 * Math.abs(smp[c.j].x - schwer) / (X1 - X0)), luft = Math.min(1, Math.max(0, c.mn / c.fs - 1.15));
        c.wert = G.groesse * groesse + G.ruhe * ruhe + G.mitte * mitte + G.luft * luft; }
      return alle.reduce((b, c) => c.wert > b.wert ? c : b); };
    /* passt der Name nicht, so wenig gekuerzt wie noetig (mindestens vier Zeichen vor dem …) */
    let text = it.titel, best = platz(text);
    for (let k = text.length - 1; !best && k >= 4; k--){ const kurz = it.titel.slice(0, k).trimEnd() + '…'; best = platz(kurz); if (best) text = kurz; }
    if (!best) return;
    const a0 = Math.max(0, best.a0 - 2), a1 = Math.min(smp.length - 1, best.a1 + 2), fs = best.fs, id = `hsn${kk}`;
    const grund = smp.slice(a0, a1 + 1).map((q, r) => [q.x, mid[a0 + r] + xHoehe * fs / 2]);
    const mi = grund[grund.length >> 1][1], enden = (grund[0][1] + grund[grund.length - 1][1]) / 2, senke = mi > enden + 0.05 * fs;
    const bahn = senke ? grund.map(p => [p[0], p[1] - xHoehe * fs]) : grund;
    defs += `<path id="${id}" d="M${bahn.map(p => f(p[0]) + ',' + f(p[1])).join('L')}" fill="none"/>`;
    namen += `<text style="fill:${topline}" font-size="${fs}" font-family="${esc(schrift)}" pointer-events="none"><textPath href="#${id}" startOffset="50%" text-anchor="middle">`
      + `<tspan${senke ? ` dy="${xHoehe}em"` : ''}>${esc(text)}</tspan></textPath></text>`;
  });
  const achse = daten.wochen.map((t, j) => `<text x="${f(px[j])}" y="${hoehe - 6}" font-size="11" text-anchor="${j === 0 ? 'start' : j === m - 1 ? 'end' : 'middle'}" fill="#9aa0a8" font-family="${esc(schrift)}">KW ${kw(t)}</text>`).join('');
  return `<svg viewBox="0 0 ${breite} ${hoehe}" width="${breite}" height="${hoehe}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hitstrom">`
    + `<defs>${defs}</defs><rect x="${f(X0)}" y="${TOP}" width="${f(X1 - X0)}" height="${PH}" rx="6" fill="#000"/>`
    + flaechen + toplines + namen + achse + '</svg>';
}
