/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   DER HITSTROM - die Hitparade ueber die Zeit als Streamgraph (Caspar_D, 12.10.2026: „im Prophane-Repository
   liegt ein Streamgraph rum, den hätte ich gerne als Darstellung der Hitparade über die Zeit" - „nur die 10 bewegtesten über die
   ganze Zeit, nicht sonstige" - „unter den Hitparaden"). Steht im Profil ueber „Die zehn bewegtesten" und „Die zehn meistgeherzten" (Caspar_D: „über den Hitparaden ist besser"); Name „Hitstrom" von ihm.

   Daten: der Zaehlerverlauf je Titel (Katalog, aufbereiten.js schreibt je Tag einen Stand, nur bei Aenderung). Je Kalenderwoche der
   Zuwachs an Resonanz (Abrufe + 2 x Herzen + 3 x Kommentare, wie „Meiste Bewegung"); EIN Wert je Wochengrenze fuer beide
   Nachbarwochen: der letzte Stand vor dem Montag, null fuer einen Titel, der erst danach erschien, sonst sein erster Stand (Caspar_D:
   „die Werte von Noch lachst Du können nicht stimmen" - erst fiel die Erscheinungswoche weg, dann der Zuwachs zwischen Sonntags- und
   Montagsstand). Die laufende Woche fehlt (sie liefe sonst auf null zu). Gezeigt wird JEDER Titel, der sich bewegt hat (erst zehn, dann
   zwoelf; Caspar_D, 13.11.2026: „was mich stört ist, dass nur noch bewegtere Titel reinkommen“), jede Woche als 100 % ihrer
   gemeinsamen Resonanz - so sind die 100 % wirklich 100 %.

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

   Namen - Fassung vom 13.11.2026, von Caspar_D am Bild abgenommen („so ists gut"), nachdem die vorige schief lief
   („deine Pfadkonstruktion ist fehlerhaft"). Sechs Stuecke, in dieser Reihenfolge:
     1. MITTELACHSE, nicht die vertikale Mitte. (hi+lo)/2 liegt bei schiefen Baendern bis zu 24 Punkte neben der
        Achse - gemessen an „Lagerfeuer" 24,5, „1 Unter der Haut I" 23,7, „Komm noch näher" 14,0. Genommen wird je
        Stuetzpunkt y = (hi·c1 + lo·c2)/(c1+c2) mit c = 1/√(1+m²) je Kante: die geschlossene Loesung der lokal
        linearisierten Aufgabe „gleicher SENKRECHTER Abstand zu beiden Raendern". Ihr Restfehler kommt aus der
        Kantenkruemmung und betraegt 0,07 Schriftgroessen im Mittel (0,75 schlimmstenfalls) gegen die exakt
        gerechnete Achse mit 0,04 (0,33) - die ist 115-mal so teuer (243 ms gegen 2,1 ms ueber 26 Baender) und
        setzt genau einen Namen mehr. Zwei Korrekturrunden mit Strahlwerfern waren langsamer UND schlechter
        (13,7 ms, 1,12) und sind verworfen.
     2. 40-mal GEGLAETTET (Caspar_D: „40 x geglättet ist gut"), Nachbarmittel 1:2:1. Kostet 0,37 bis 0,46 Punkte
        Abstand zur echten Achse und aendert die Luft zu den Raendern praktisch nicht.
     3. LUFT QUER ZUR ACHSE, getrennt nach oben und unten (Caspar_D: „die senkrechte zum mittelpfad misst die höhe
        nach oben und unten"). Vorher wurde senkrecht gemessen und mit einem Faktor fuer die Neigung verrechnet;
        das war zu streng. Verlangt werden 0,30 Schriftgroessen nach oben (Oberlaengen) und 0,78 nach unten
        (x-Hoehe plus Unterlaengen) - damit faellt die alte Pauschale „1,6-fache Dicke" weg, die Namen extrem
        kuerzte („warum kürzt du so extrem ab, das ist doch noch ewig platz").
     4. Dazu hoechstens 66 GRAD Neigung an jeder Stelle des Namens (Caspar_D) und Randabstand in x, nicht nur
        entlang der Bogenlaenge - sonst schneidet die Bildkante den Namen ab.
     5. GESETZT wird am GRAVITATIONSZENTRUM des Bandes (dickengewichtete Mitte als Bogenlaenge, Caspar_D): von
        allen Stellen, an denen die groesste noch moegliche Schrift passt, die naechste daran. Die alte Bewertung
        aus vier Teilen (Groesse, Ruhe, Mitte, Luft nach Imhof 1975) ist damit aufgeloest - Ruhe und Luft sind
        jetzt harte Bedingungen, Mitte ist das Ziel, Groesse die aeussere Schleife.
     6. SATZ buchstabenweise, jeder mit seiner m-LINIE (Oberkante der Mittelhoehe) auf der Tangente an seiner
        Stelle (Caspar_D: „ich meinte zwar die oberkante der mittelhöhe, als die m-Linie"). Auf der geglaetteten
        Achse tut ein textPath dasselbe bis auf 0,05 Punkte; der Gewinn liegt in der Achse, nicht im Satz. Hier
        steht trotzdem der Satz, weil er den Bezug ohne den Senken-Behelf (∪) der vorigen Fassung trifft.
   Farbe weiter die Topline des eigenen Bandes (Caspar_D: „schreibst du die Beschriftung in Toplinefarbe"); passt
   der Name nirgends, so wenig gekuerzt wie noetig („dann kürze ihn etwas mit …"). */

const resonanz = (e) => (e.plays || 0) + 2 * (e.likes || 0) + 3 * (e.kommentare || 0);
const tagVon = (d) => Date.parse(d + 'T00:00:00Z') / 864e5;
const kw = (tag) => { const d = new Date(tag * 864e5), dd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 3)), y0 = new Date(Date.UTC(dd.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((dd - y0) / 864e5 - 3 + ((y0.getUTCDay() + 6) % 7)) / 7); };
/* Eigene IDs je Diagramm. Die Verlaeufe und Namenspfade hiessen fest hsv0, hsn0 ... - liegen zwei Hitstroeme auf
   einer Seite, gibt es jede ID doppelt, und der Browser loest url(#hsv0) auf das ERSTE im Dokument auf: das zweite
   Diagramm borgt sich die Farben des ersten (am 13.11.2026 in einem Vergleichsbild gesehen, 191 IDs, 123 verschiedene). */
let lauf = 0;
/* Nach oben geklemmt: je Woche hoechstens so viele Baender (Caspar_D, 14.11.2026) */
const JE_WOCHE = 50;
/* Die kleinste Schrift, die noch gesetzt wird. Bis 1.1.7 waren es 9 Punkt - eine Zahl aus der Zeit, als der
   Schriftpfad versetzt lag und die Pauschale „1,6-fache Dicke" galt; darunter passte ohnehin nichts. Caspar_D hat
   am 14.11.2026 beide Fassungen am Bild verglichen (900 x 342: 9 Punkt 16 Namen, 7 Punkt 21) und 7 gewaehlt. */
const FS_MIN = 7, FS_MAX = 15;
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Wochenzuwaechse je Titel. songs: [{id, titel, erstellt}], verlauf: {id: [{stand, plays, likes, kommentare}]} */
export function hitstromDaten(songs, verlauf){
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
  /* JE WOCHE DIE 50 STAERKSTEN, darueber hinaus keine Auswahl. Erst waren es die zwoelf mit dem groessten Zuwachs
     ueber die ganze Zeit; dann waren die 100 % einer Woche nur die 100 % DIESER ZWOELF, und das schwankte zwischen
     23 und 95 % des wirklichen Geschehens (Caspar_D, 13.11.2026: „was mich stoert ist, dass nur noch bewegtere Titel
     reinkommen"). Dann alle bewegten - bei Caspar_D 123, je Woche 19 bis 43, die Top 50 sind dort in JEDER Woche
     100,0 %. Fuer groessere Bestaende braucht es eine Klemme (Caspar_D, 14.11.2026: „Tarja macht aber viel mehr
     lieder, das wird irgendwann zu eng. nimm die Top 50 pro Woche"). Gezaehlt wird JE WOCHE, nicht ueber die ganze
     Zeit: ein Titel, der in einer einzigen Woche vorn lag, ist drin - mit seiner ganzen Reihe, sonst risse das Band.
     Was dabei wegfaellt, steht in „weggelassen" und gehoert in den Hinweis unter der Ueberschrift; Wattenberg zeigt
     7500 Filme im selben Bild, aber nicht mit Namen. Namen bekommen nur die dicken Baender (siehe unten). */
  const bewegt = zeilen.filter(z => z.summe > 0);
  const drin = new Set();
  for (let j = 0; j < wochen; j++){
    const idx = bewegt.map((_, i) => i).filter(i => bewegt[i].v[j] > 0).sort((a, b) => bewegt[b].v[j] - bewegt[a].v[j]);
    for (const i of idx.slice(0, JE_WOCHE)) drin.add(i); }
  const baender = [...drin].map(i => bewegt[i]).sort((a, b) => b.summe - a.summe);
  if (baender.length < 2) return null;
  /* der groesste Anteil, der in einer Woche fehlt - damit der Hinweis nicht schaetzen muss */
  let fehltMax = 0;
  for (let j = 0; j < wochen; j++){ const ganz = bewegt.reduce((a, z) => a + z.v[j], 0);
    if (ganz) fehltMax = Math.max(fehltMax, 1 - baender.reduce((a, z) => a + z.v[j], 0) / ganz); }
  return { baender, wochen: grenzen.slice(0, wochen), jeWoche: JE_WOCHE, weggelassen: bewegt.length - baender.length, fehltMax };
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
export function hitstromSvg(daten, { breite = 680, hoehe = 200, links = 0, rechts = null, akzente = ['var(--titel-a,#f97b14)', 'var(--titel-b,#e31c79)'], messen, tinte = null, schrift = 'system-ui, sans-serif', xHoehe = 0.52 } = {}){
  const items = daten.baender, m = daten.wochen.length, n = items.length, UID = 'hs' + (++lauf) + '_';
  const vals = items.map(it => it.v.map((x, j) => { const t = items.reduce((a, q) => a + q.v[j], 0); return t ? 100 * x / t : 0; }));
  /* von innen nach aussen */
  /* VON INNEN NACH AUSSEN NACH DEM EINSATZ, die ZULETZT begonnenen innen (Caspar_D, 13.11.2026: „das linke Anfangen
     eines Liedes sollte immer nah der vertikalen Mitte sein, das Auslaufen nach aussen von der Mitte weg").
     Vorher entschied der Gipfel. Die Lage im Stapel steht fuer alle Wochen fest - ein Band kann nicht wandern;
     nach aussen gedrueckt wird es nur dadurch, dass die Baender UNTER ihm spaeter anschwellen. Darum muessen die
     spaeter begonnenen nach innen. Byron & Wattenberg ordnen umgekehrt (frueheste innen); dann bleiben die alten in
     der Mitte liegen und die neuen erscheinen am Rand - drei Fassungen nebeneinander gezeigt, diese gewaehlt. */
  const sums = vals.map(v => v.reduce((a, b) => a + b, 0));
  const einsatz = vals.map(v => { const k = v.findIndex(x => x > 0); return k < 0 ? v.length : k; });
  const nachGipfel = vals.map((_, i) => i).sort((a, b) => einsatz[b] - einsatz[a] || sums[b] - sums[a]); let oben = 0, unten = 0; const tops = [], bots = [];
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
  const zuSetzen = [], RANDLUFT = 7, GLATT = 40, GRAD66 = 66 * Math.PI / 180;
  /* SCHMAL GESETZT (Caspar_D, 14.11.2026 am Ausschnitt: „übrigens sieht die gestauchte Version in dem Ausschnitt
     besser aus"). Die Namen laufen auf 85 % der Breite bei voller Hoehe - ein Schmalschnitt, wie ihn die
     Kartografie fuer Namen an Linien seit jeher nimmt. Er spart Strecke, ohne an Lesehoehe zu verlieren: der
     Engpass der Baender ist die Dicke, und die bleibt unberuehrt. Fest, kein Regler - die Schrift der Oberflaeche
     hat keinen eigenen Schmalschnitt, und 85 % ist die Grenze, unter der man die Stauchung zu sehen beginnt. */
  const STAUCH = 0.85;
  const mw = (text, fs) => (messen ? messen(text, fs) : text.length * fs * 0.56) * STAUCH;
  const breiteVon = (text, fs) => mw(text, fs) * 1.04;          /* beim Suchen etwas Luft, beim Setzen das reine Mass */
  /* Nachbarmittel 1:2:1, n-mal angewandt; die Enden bleiben liegen */
  const glatt = (v, n) => { let o = v.slice(); for (let k = 0; k < n; k++){ const p = o.slice();
    for (let q = 1; q < p.length - 1; q++) o[q] = (p[q - 1] + 2 * p[q] + p[q + 1]) / 4; } return o; };
  order.forEach((i, kk) => {
    const it = items[i], dn = kanten[kk], up = kanten[kk + 1], akzent = farbe[kk], topline = `color-mix(in srgb, ${akzent} 75%, #fff)`;
    const obenD = `M${f(px[0])},${f(Y(start[kk + 1]))}` + up.map(c => `C${f(c[0])},${f(Y(c[1]))} ${f(c[2])},${f(Y(c[3]))} ${f(c[4])},${f(Y(c[5]))}`).join('');
    let d = obenD + `L${f(px[m - 1])},${f(Y(dn[m - 2][5]))}`;
    for (let j = m - 2; j >= 0; j--){ const c = dn[j], y0 = j ? dn[j - 1][5] : start[kk]; d += `C${f(c[2])},${f(Y(c[3]))} ${f(c[0])},${f(Y(c[1]))} ${f(px[j])},${f(Y(y0))}`; }
    d += 'Z';
    defs += `<linearGradient id="${UID}v${kk}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${akzent};stop-opacity:0.66"/><stop offset="1" style="stop-color:${akzent};stop-opacity:0.22"/></linearGradient>`;
    flaechen += `<path class="hsband" data-id="${esc(it.id)}" d="${d}" fill="url(#${UID}v${kk})"><title>${esc(it.titel)} · ${it.summe.toLocaleString('de-DE')} Punkte in ${m} Wochen</title></path>`;
    toplines += `<path d="${obenD}" fill="none" style="stroke:${topline}" stroke-width="1" pointer-events="none"/>`;
    /* Die beiden Raender als Stuetzpunkte, etwa alle zwei Punkte. Im Pruefstand wurde das Band dafuer mit
       isPointInFill abgetastet; hier liegen die Kanten als Bezierkurven vor und werden gerechnet - dieselbe
       Geometrie, ohne Tastlauf. Der Abstand ist ueberall gleich, darauf verlaesst sich drin() weiter unten. */
    const pro = Math.max(9, Math.ceil((px[1] - px[0]) / 2)), smp = [];
    for (let j = 0; j < m - 1; j++) for (let q = 0; q < pro; q++){ const t = q / pro; smp.push({ x: px[j] + (px[j + 1] - px[j]) * t, lo: Y(yAt(kk, j, t)), hi: Y(yAt(kk + 1, j, t)) }); }
    smp.push({ x: px[m - 1], lo: Y(yAt(kk, m - 2, 1)), hi: Y(yAt(kk + 1, m - 2, 1)) });
    zuSetzen.push({ kk, id: it.id, titel: it.titel, smp, topline, gewicht: it.summe });
  });
  /* ERST SAMMELN, DANN SETZEN - das dickste Band zuerst, wer mit einem schon gesetzten Namen kollidiert, bleibt
     stumm. Vorher setzte jedes Band seinen Namen sofort in Stapelreihenfolge, ohne von den anderen zu wissen; bei
     zwoelf Baendern fiel das kaum auf, bei hundert standen Namen uebereinander (Caspar_D, 13.11.2026). Dass dabei
     Namen wegfallen, ist der Preis: aus 20 gesetzten wurden 12 - aber keiner davon liegt mehr falsch. */
  /* WAS EINEN NAMEN BLOCKIERT, SIND BUCHSTABEN - NICHT SEIN RECHTECK (Caspar_D, 14.11.2026: „da sind wirklich
     streifen, wo ich mich frage, warum steht da kein text drin, unsere Regeln versagen bei sichtbar breiten
     Streifen"). Vorher stand je Name EIN achsparalleles Rechteck in der Liste. Laeuft ein Name schraeg - erlaubt
     sind bis zu 66 Grad -, ist dieses Rechteck fast so hoch wie breit und deckt zwei bis drei Nachbarbaender zu,
     in denen gar kein Buchstabe steht. Gemessen am 14.11.2026 kostete das fuenf Namen in Baendern, die 17 bis 53
     Punkte dick waren - „Okkultation" und „Kein Wetter" bei 52,8 Punkten, einem Sechstel der Bildhoehe.
     Jetzt steht je BUCHSTABE sein eigenes, mitgedrehtes Rechteck in der Liste. */
  /* WAS DER NAME WO BRAUCHT - AUS DER TINTE, NICHT PAUSCHAL (Caspar_D, 14.11.2026: „dann optimiere jetzt nochmal
     auf Tinte"). Bis 1.1.8 verlangte jeder Name ueber seine ganze Laenge 0,30 Schriftgroessen nach oben und 0,78
     nach unten - die Pauschale fuer Oberlaenge, x-Hoehe und Unterlaenge. „Noch lachst Du" hat aber nirgends eine
     Unterlaenge und braucht real 0,82 statt 1,08; „Jugendschwarm" hat sein einziges g an zweiter Stelle.
     tinte.runs(text, fs) ist der Apparat der Zellnamen im Klangschaum (index.html, schaumNamenTinte; Caspar_D,
     07.10.2026: „Bereiche ohne Ober oder Unterlängen sind verschenkter Platz"): je Zeile die Tintenkaesten ihrer
     Buchstaben in em, benachbarte gleicher Hoehe zusammengefasst, [x0, x1, ueber, unter] ab Grundlinie. Hier
     gerechnet ab der m-LINIE, auf der der Name sitzt: oben = ueber - x-Hoehe, unten = x-Hoehe + unter.
     Lange Kaesten werden in Stuecke von hoechstens 1,5 Schriftgroessen geteilt, damit sie der Kruemmung folgen.
     Ohne Tinte (kein messen, fremder Aufrufer) gilt weiter die Pauschale - dann ist das Ergebnis das von 1.1.8. */
  /* ZWEIZEILIG, WENN ES DIE BANDHOEHE HERGIBT (Caspar_D, 14.11.2026: „vielleicht auch zweizeilig beschriften, wenn
     es die Bandhöhe hergibt bei gleichzeitig langen Titeln"). Je Schriftgroesse wird erst einzeilig geprueft, dann
     zweizeilig - so gewinnt immer die groesste Schrift, und zwei Zeilen kommen genau dann, wenn sie mehr Groesse
     erlauben als eine. Geteilt wird an der Wortgrenze, die beide Zeilen am gleichmaessigsten macht.
     Der Zeilenabstand ist die Studio-Definition: Oberlaenge + Unterlaenge + i-Luecke, aus derselben Messung wie
     Tinte und Hof. Die Zeilen sitzen symmetrisch um die Mittelachse, jede mit ihrer eigenen m-Linie auf ihrer
     eigenen Tangente. */
  /* DER HOF UM DIE TINTE (Caspar_D, 14.11.2026: „definiere einen Hof um die Tinte - normalerweisse der i zu
     i-Punkt abstand" - „bei einigen Bändern stößt die Tinte an den Rand, was unschön aussieht"). Dasselbe Mass
     wie in der Wortwolke der KlangFeder (wortwolke.js, iPunkt(); Caspar_D, 12.11.2026: „lieber den i/i-punkt
     abstand als maß für die hofbreite"): der Abstand vom i-Stamm zum i-Punkt, als Anteil der Schriftgroesse,
     gemessen vom selben Apparat, der auch die Tinte misst. Die Wortwolke nimmt das Groessere aus diesem Abstand
     und der kleinsten inneren Luecke des Worts („außen nie enger als innen") - die braeuchte eine Pixelmaske je
     Wort, und bei 7 bis 15 Punkt ueber 123 Baender waere das Rasterung ohne Gewinn: bei diesen Groessen ist der
     i-Abstand praktisch immer das Groessere. Der Hof gilt nach aussen zum Bandrand UND zwischen zwei Namen. */
  const HOF = tinte && tinte.hof > 0.005 && tinte.hof < 0.3 ? tinte.hof : 0.07;
  const LEAD = tinte && tinte.o > 0 ? tinte.o + tinte.u + HOF : O_OBEN + xHoehe + O_UNTEN + HOF;
  const teilen = (text, fs) => { const re = /\s+/g, schnitte = []; let mm;
    while ((mm = re.exec(text))) schnitte.push([mm.index, mm.index + mm[0].length]);
    if (!schnitte.length) return null;
    let best = null;
    for (const [e, a] of schnitte){ const t1 = text.slice(0, e), t2 = text.slice(a);
      /* AM SATZZEICHEN LIEBER ALS MITTEN IN DER PHRASE (Caspar_D, 14.11.2026: „Halt die Klappe - umbruch -
         Willem"). Der Umbruch nach Komma, Gedankenstrich oder Doppelpunkt liest sich als Pause, der mitten im
         Satz als Stolpern. Darum zaehlt der Laengenunterschied dort nur halb; gleich lange Zeilen bleiben das
         Ziel, geben aber nach, wenn eine Fuge da ist. */
      const fuge = /[,;:.!?)\]–—-]$/.test(t1.trim());
      const d = Math.abs(mw(t1, fs) - mw(t2, fs)) * (fuge ? 0.5 : 1);
      if (!best || d < best.d) best = { d, zeilen: [t1.replace(/\s+$/, ''), t2] }; }
    return best.zeilen; };
  /* DIE TINTE MITTIG ZUR ACHSE, NICHT DIE m-LINIE (Caspar_D, 14.11.2026: „oft ist oben mehr Platz zu den rändern
     als unten, wenn man die tinte mißt, irgendwas drängt den text zum unteren RAnd ... sehr gut ist das bei
     Präsenz - Presencia zu sehen"). Die m-Linie ist der BEZUGSPUNKT, auf dem die Schrift der Tangente folgt - aber
     die Tinte reicht von dort nur 0,20 Schriftgroessen nach oben (Oberlaengen) und 0,73 nach unten (x-Hoehe plus
     Unterlaengen). Sitzt die m-Linie auf der Achse, haengt der Name also deutlich unter der Mitte des Bandes.
     Darum wird der ganze Name um (unten - oben) / 2 angehoben: dann liegt die Mitte seiner TINTE auf der Achse.
     Einheitlich je Name, aus dem groessten Ober- und Unterwert seiner Zeilen - ein Versatz je Buchstabe liesse
     die Schrift tanzen. */
  const anhub = (zeilen, fs) => { let o = 0, u = 0;
    for (const z of zeilen){ let r = null; if (tinte){ try { r = tinte.runs(z, fs); } catch (e) { r = null; } }
      if (r && r.runs && r.runs.length){ for (const [, , ueber, unter] of r.runs){
        o = Math.max(o, Math.max(0, ueber - xHoehe) * fs); u = Math.max(u, (xHoehe + Math.max(0, unter)) * fs); } }
      else { o = Math.max(o, O_OBEN * fs); u = Math.max(u, (xHoehe + O_UNTEN) * fs); } }
    return (u - o) / 2; };
  /* Teile EINER Zeile, Lage relativ zur Mitte des Namens; v = Versatz der Zeile quer zur Achse (unten positiv) */
  const teileVon = (text, fs, v, raus) => {
    const br = mw(text, fs), h = HOF * fs, mitte = br / 2;
    const grenzen = (ueber, unter) => ({ oben: Math.max(0, Math.max(0, ueber - xHoehe) * fs + h - v),
                                         unten: Math.max(0, (xHoehe + Math.max(0, unter)) * fs + h + v) });
    let r = null; if (tinte) { try { r = tinte.runs(text, fs); } catch (e) { r = null; } }
    if (!r || !r.runs || !r.runs.length || !r.w){ const g = grenzen(O_OBEN + xHoehe, O_UNTEN);
      raus.push({ a: -mitte, b: mitte, oben: g.oben, unten: g.unten, v, text }); return br; }
    const k = br / (r.w * fs);                             /* die Tinte misst in Stufen - auf unsere Breite ziehen */
    for (const [x0, x1, ueber, unter] of r.runs){
      const A = x0 * fs * k - mitte, B = x1 * fs * k - mitte, g = grenzen(ueber, unter);
      const n = Math.max(1, Math.ceil((B - A) / (1.5 * fs)));
      for (let q = 0; q < n; q++) raus.push({ a: A + (B - A) * q / n, b: A + (B - A) * (q + 1) / n, oben: g.oben, unten: g.unten, v, text }); }
    return br;
  };
  const bedarf = (zeilen, fs) => { const teile = []; let br = 0;
    const v0 = zeilen.length > 1 ? LEAD * fs / 2 : 0, ideal = anhub(zeilen, fs);
    zeilen.forEach((z, i) => { br = Math.max(br, teileVon(z, fs, zeilen.length > 1 ? (i ? v0 : -v0) : 0, teile)); });
    return { br, teile, zeilen, ideal }; };
  const belegt = [], LUFT = HOF;
  const schneidet = (ks) => ks.some(k => belegt.some(b => !(k.x1 < b.x0 || b.x1 < k.x0 || k.y1 < b.y0 || b.y1 < k.y0)));
  /* Oberlaengen ueber der m-Linie, x-Hoehe und Unterlaengen darunter - das ist die Luft, die ein Name braucht */
  const O_OBEN = 0.30, O_UNTEN = 0.26;
  for (const e of zuSetzen.sort((a, b) => b.gewicht - a.gewicht)) {
    const { titel, smp, topline } = e, N = smp.length;
    const XS = smp.map(q => q.x), HI = smp.map(q => q.hi), LO = smp.map(q => q.lo);
    /* billige Vorentscheidung: wo das Band nirgends 9 Punkt Schrift traegt, wird gar nicht gerechnet */
    let dickMax = 0; for (let j = 0; j < N; j++) dickMax = Math.max(dickMax, LO[j] - HI[j]);
    if (dickMax < FS_MIN * (O_OBEN + xHoehe + O_UNTEN)) continue;
    /* 1. Mittelachse, geschlossene Formel; 2. vierzigmal geglaettet */
    const abl = (v) => v.map((_, j) => { const a = Math.max(0, j - 1), b = Math.min(N - 1, j + 1); return (v[b] - v[a]) / ((XS[b] - XS[a]) || 1); });
    const mh = abl(HI), ml = abl(LO);
    const ACHSE = glatt(XS.map((_, j) => { const c1 = 1 / Math.sqrt(1 + mh[j] * mh[j]), c2 = 1 / Math.sqrt(1 + ml[j] * ml[j]);
      return (HI[j] * c1 + LO[j] * c2) / (c1 + c2); }), GLATT);
    /* 3. Luft quer zur Achse, getrennt nach oben und unten. drin(): das Band ist in x monoton, also liegt ein Punkt
       darin, wenn er zwischen den beiden Raendern an seiner x-Stelle liegt - die Stuetzpunkte stehen gleich weit. */
    const h = XS[1] - XS[0];
    const drin = (x, y) => { const u = (x - XS[0]) / h; if (u < 0 || u > N - 1) return false;
      const j = Math.min(N - 2, Math.floor(u)), t = u - j;
      return y >= HI[j] + (HI[j + 1] - HI[j]) * t && y <= LO[j] + (LO[j + 1] - LO[j]) * t; };
    /* Gemessen wird nur, bis die groesste Schrift satt ist - wie viel Luft darueber hinaus da ist, aendert keine
       Entscheidung. Ohne diesen Deckel liefen die Taster in dicken Baendern bis zu 300 Punkte weit.
       ZWEIZEILIG GEHOERT IN DEN DECKEL: dort sitzt die obere Zeile um einen halben Zeilenabstand hoeher und die
       untere ebenso tiefer. Ohne diesen Zuschlag war der Deckel oben 5,0 Punkte, die zweizeilige Forderung aber
       5,35 - der ganze Zweig konnte nie greifen, auch nicht mit Vorrang (gefunden am 14.11.2026). */
    const MAX_O = FS_MAX * (O_OBEN + LEAD / 2) + 0.5, MAX_U = FS_MAX * (xHoehe + O_UNTEN + LEAD / 2) + 0.5;
    const auf = new Float64Array(N), ab = new Float64Array(N), winkel = [], fsLokal = new Float64Array(N);
    for (let j = 0; j < N; j++){ const a = Math.max(0, j - 1), c = Math.min(N - 1, j + 1);
      const w = Math.atan2(ACHSE[c] - ACHSE[a], (XS[c] - XS[a]) || 1); winkel.push(w);
      const nx = -Math.sin(w), ny = Math.cos(w);
      let u = 0, v = 0;
      while (u < MAX_O && drin(XS[j] - nx * (u + 0.5), ACHSE[j] - ny * (u + 0.5))) u += 0.5;
      while (v < MAX_U && drin(XS[j] + nx * (v + 0.5), ACHSE[j] + ny * (v + 0.5))) v += 0.5;
      auf[j] = u; ab[j] = v;
      /* GROBFILTER: die groesste Schrift, die hier selbst bei der SCHWAECHSTEN Forderung noch passt - ein Name
         ganz ohne Ober- und Unterlaengen („nose") braucht nach oben nichts und nach unten nur die x-Hoehe. Was
         daran scheitert, scheitert sicher; was durchkommt, wird mit der echten Tinte nachgeprueft. So bleibt die
         Fensterfrage eine Praefixsumme (eine Zahl je Stuetzpunkt), und die teure Rechnung trifft nur Kandidaten. */
      fsLokal[j] = Math.abs(w) > GRAD66 ? 0 : v / xHoehe; }
    const S = [0]; for (let j = 1; j < N; j++) S.push(S[j - 1] + Math.hypot(XS[j] - XS[j - 1], ACHSE[j] - ACHSE[j - 1]));
    /* 5. DER GROESSTE KREIS, DER IN DAS BAND PASST - seine Mitte ist die Mitte der Schrift (Caspar_D, 14.11.2026:
       „ich würde die Schrift gern dort setzen, wo der grösste Kreis in den streifen passt / die mitte des grössten
       kreises ist die horizontale mitte der schrift"). Vorher war es das dickengewichtete Gravitationszentrum des
       Bandes - das zieht zur Mitte der AUSDEHNUNG, auch wenn das Band dort duenn ist und die dicke Stelle am Rand
       liegt. Der Kreis zieht dorthin, wo wirklich Platz ist.
       Sein Mittelpunkt liegt auf der Mittelachse, denn die ist ja gerade die Linie gleichen Abstands zu beiden
       Raendern; sein Radius ist der halbe SENKRECHTE Abstand der Raender, also die halbe senkrechte Dicke - die
       vertikale Dicke mal dem Kosinus der Neigung. Kein zusaetzlicher Tastlauf noetig. */
    let kreisS = S[N - 1] / 2, kreisR = -1;
    for (let j = 0; j < N; j++){ const r = (LO[j] - HI[j]) * Math.cos(winkel[j]) / 2;
      if (r > kreisR){ kreisR = r; kreisS = S[j]; } }
    const ZIEL = kreisS;
    const anS = (s) => { s = Math.max(0, Math.min(S[N - 1], s)); let j = 1; while (j < N - 1 && S[j] < s) j++;
      const t = (s - S[j - 1]) / ((S[j] - S[j - 1]) || 1);
      return { x: XS[j - 1] + t * (XS[j] - XS[j - 1]), y: ACHSE[j - 1] + t * (ACHSE[j] - ACHSE[j - 1]), w: winkel[j] }; };
    /* JEDE ZEILE AUF IHRER EIGENEN PARALLELKURVE. Eine um v quer versetzte Zeile laeuft nicht auf der Achse,
       sondern auf der Kurve im Abstand v - und die ist auf der konvexen Seite LAENGER. Wer die Buchstaben auf der
       Achse abmisst und dann quer verschiebt, zieht sie dort auseinander: „Willem" stand als „Will e m" da
       (Caspar_D am Bild, 14.11.2026), und zwar nur in der unteren Zeile. Darum bekommt jede Zeile ihre eigene
       Punktfolge samt eigener Bogenlaenge; v = 0 liefert die Achse selbst. */
    const parallel = (v) => { if (!v) return { PX: XS, PY: ACHSE, PS: S };
      const PX = new Float64Array(N), PY = new Float64Array(N), PS = new Float64Array(N);
      for (let j = 0; j < N; j++){ const nx = -Math.sin(winkel[j]), ny = Math.cos(winkel[j]);
        PX[j] = XS[j] + nx * v; PY[j] = ACHSE[j] + ny * v;
        if (j) PS[j] = PS[j - 1] + Math.hypot(PX[j] - PX[j - 1], PY[j] - PY[j - 1]); }
      return { PX, PY, PS }; };
    const anP = (k, s) => { const { PX, PY, PS } = k; s = Math.max(0, Math.min(PS[N - 1], s));
      let j = 1; while (j < N - 1 && PS[j] < s) j++;
      const t = (s - PS[j - 1]) / ((PS[j] - PS[j - 1]) || 1);
      return { x: PX[j - 1] + t * (PX[j] - PX[j - 1]), y: PY[j - 1] + t * (PY[j] - PY[j - 1]), w: winkel[j] }; };
    /* je Schriftgroesse einmal: wie viele verbotene Stellen bis hierher. Haengt nicht vom Text ab, also vor
       den Kuerzungsversuchen gerechnet. */
    const verboten = []; for (let fs = FS_MAX; fs >= FS_MIN; fs--){ const pre = new Int32Array(N + 1);
      for (let j = 0; j < N; j++) pre[j + 1] = pre[j] + (fsLokal[j] < fs ? 1 : 0); verboten.push(pre); }
    /* Nicht EINE Stelle, sondern eine Rangfolge: je Schriftgroesse von gross nach klein die Stellen, geordnet
       nach Naehe zum Gravitationszentrum. Wer an der besten Stelle mit einem schon gesetzten Namen kollidiert,
       rueckt weiter - erst zur naechsten Stelle, dann eine Nummer kleiner. Vorher gab es nur den einen Versuch,
       und ein 20 Punkte dickes Band blieb stumm, weil seine beste Stelle besetzt war. Geschoben wird VOM KREIS AUS
       (Caspar_D, 14.11.2026: „wenn das nicht passt, von dortaus schieben"), in Schritten von etwa einem Siebtel der
       Namenslaenge - fein genug, um an einem Nachbarn vorbeizukommen, ohne hunderte fast gleicher Stellen zu
       pruefen. Mehr als AUSWEICHE Stellen werden nie geprueft; das reicht fuer gut zwei Namenslaengen nach jeder
       Seite, danach ist eine Nummer kleiner die bessere Antwort als ein Name am falschen Ende des Bandes. */
    const AUSWEICHE = 32, SCHRITT = 0.15, FEIN_MAX = 200;
    const idxAb = (s) => { let a = 0, b = N - 1; while (a < b){ const h = (a + b) >> 1; if (S[h] < s) a = h + 1; else b = h; } return a; };
    /* die echte Probe: jedes Tintenstueck an seiner Stelle gegen die dort gemessene Luft */
    /* Liefert die KLEINSTE RESERVE auf der ganzen Namenslaenge - wie viel Luft ueber das Geforderte hinaus noch
       da ist, in Punkten. Negativ heisst: passt nicht. Damit ist „passt es" und „wie gut sitzt es" dieselbe
       Messung (Caspar_D, 14.11.2026: „ist die Ästhetik besser - hat der Text rundherum mehr Luft zu den Grenzen
       des Bandes"). */
    /* DER ANHUB KOMMT AUS DER GEMESSENEN LUFT, nicht aus einer festen Regel. Angehoben werden DARF der Name
       hoechstens so weit, wie oben Platz ist (hub <= auf - oben), und angehoben werden MUSS er so weit, wie unten
       Platz fehlt (hub >= unten - ab). Daraus ein Spielraum; gewaehlt wird daraus der Wert, der die Tinte mittig
       setzt, soweit der Spielraum reicht. So bekommt Caspar_Ds Beobachtung („irgendwas drängt den text zum
       unteren Rand") ihre Antwort, ohne Symmetrie zu erzwingen, wo das Band selbst schief ist - ein fester Anhub
       kostete zwei Namen.
       Geprueft werden auch die beiden Nachbarn ausserhalb jedes Stuecks: die Luft ist nur alle zwei Punkte
       gemessen, und liegt die Kante dazwischen naeher, sah die Pruefung sie nicht („das K touchiert unten die
       Bandgrenze", 1,00 Punkt Abstand bei 1,19 gefordert). */
    const reserve = (mitte, teile, ideal) => {
      let hubMin = -Infinity, hubMax = Infinity, steil = false;
      const nimm = (j, st) => { if (j < 0 || j >= N) return true;
        if (Math.abs(winkel[j]) > GRAD66){ steil = true; return false; }
        hubMax = Math.min(hubMax, auf[j] - st.oben);
        hubMin = Math.max(hubMin, st.unten - ab[j]);
        return hubMin <= hubMax; };
      for (const st of teile){ const a = idxAb(mitte + st.a), e = mitte + st.b;
        if (!nimm(a - 1, st)) return null;
        let j = a;
        for (; j < N && S[j] <= e; j++) if (!nimm(j, st)) return null;
        if (!nimm(j, st)) return null; }
      if (steil || !(hubMin <= hubMax)) return null;
      const hub = Math.max(hubMin, Math.min(hubMax, ideal || 0));
      /* die kleinste Luft, die nach dem Anhub noch bleibt */
      return { hub, wert: Math.min(hubMax - hub, hub - hubMin) }; };
    /* JEDE SATZART GETRENNT ZU ENDE RECHNEN. Vorher brach die Schleife ab, sobald eine Variante passte: ging
       einzeilig bei 12 Punkt, wurden 11, 10, 9 nie geprueft - und zweizeilig braucht nun einmal die knapp
       doppelte Dicke, also eine kleinere Schrift. „Halt die Klappe, Willem" lief darum einzeilig quer durch das
       halbe Band, obwohl zwei Zeilen kompakt in der dicken Stelle gestanden haetten (Caspar_D, 14.11.2026:
       „Halt die Klappe - umbruch - Willem wäre ein Kandidat, der von Zweizeiligkeit profitieren würde / es wäre
       überall mehr Luft"). Jetzt bekommt jede Satzart ihre eigene groesste Schrift, und erst dann wird gewaehlt. */
    const sucheArt = (zeilenFn) => {
      for (let fs = FS_MAX; fs >= FS_MIN; fs--){
        const zeilen = zeilenFn(fs); if (!zeilen) return [];
        {
          const { br, teile, ideal } = bedarf(zeilen, fs), pre = verboten[FS_MAX - fs], gut = [];
          let lo = 0, hi = 0;
          for (let j = 0; j < N; j++){
            const s0 = S[j] - br / 2, s1 = S[j] + br / 2;
            while (lo < N - 1 && S[lo] < s0) lo++;                     /* beide Grenzen wandern mit j nach rechts */
            if (hi < lo) hi = lo;
            while (hi < N - 1 && S[hi + 1] <= s1) hi++;
            if (s0 < 2 || s1 > S[N - 1] - 2) continue;
            if (pre[hi + 1] - pre[lo]) continue;                       /* Grobfilter: Neigung und die blosse x-Hoehe */
            /* 4. Randabstand in x, nicht nur entlang der Bogenlaenge - sonst schneidet die Bildkante den Namen ab */
            if (XS[lo] < X0 + RANDLUFT || XS[hi] > X1 - RANDLUFT) continue;
            gut.push({ fs, s: S[j], dist: Math.abs(S[j] - ZIEL), br, teile, zeilen }); }
          if (!gut.length) continue;
          gut.sort((a, b) => a.dist - b.dist);
          const liste = [], genommen = []; let geprueft = 0;
          for (const c of gut){ if (genommen.some(g => Math.abs(g - c.s) < c.br * SCHRITT)) continue;
            if (++geprueft > FEIN_MAX) break;
            const r = reserve(c.s, teile, ideal); if (!r) continue;
            c.reserve = r.wert; c.hub = r.hub; genommen.push(c.s); liste.push(c); if (liste.length >= AUSWEICHE) break; }
          if (liste.length) return liste; } }
      return []; };
    /* DIE WAHL ZWISCHEN EIN- UND ZWEIZEILIG: erst die groessere Schrift, bei Gleichstand die groessere Luft
       (Caspar_D, 14.11.2026: „die Regel die es auslöst ist nicht nur, passt mehr Text sondern auch, ist die
       Ästhetik besser - hat der Text rundherum mehr Luft zu den Grenzen des Bandes"). „Halt die Klappe, Willem"
       steht damit zweizeilig bei 15 Punkt statt einzeilig bei 12. Die Luft zaehlt als zweites, nicht als erstes:
       eine kleinere Schrift hat immer mehr Reserve, und nach Luft allein wuerde alles auf 7 Punkt schrumpfen. */
    const suche = (text) => {
      const zwei = sucheArt((fs) => teilen(text, fs)), ein = sucheArt(() => [text]);
      if (!zwei.length) return ein;
      if (!ein.length) return zwei;
      /* BEI GLEICHER SCHRIFTGROESSE GEWINNT DER UMBRUCH (Caspar_D, 14.11.2026: „Halt die Klappe, Willem war
         schöner mit Umbruch / er kommt in der vollen Länge den Rändern zu nah / das betrifft auch andere, zB
         Ein bisschen doch"). Vorher entschied bei Gleichstand die groesste Mindestluft - die hat aber immer die
         einzeilige Fassung, weil zwei Zeilen die knapp doppelte Dicke brauchen. Dass ein langer Name unterwegs
         an mehreren Stellen eng wird, sagt diese eine Zahl nicht; der kompakte Block in der dicken Stelle ist
         ruhiger. Einzeilig gewinnt nur noch, wenn es dadurch GROESSER wird. */
      return zwei[0].fs >= ein[0].fs ? zwei : ein; };
    /* Passt der Name nicht, wird gekuerzt - aber NUR AN WORTGRENZEN und nur, solange etwas uebrig bleibt, das
       den Titel noch kennzeichnet (Caspar_D, 14.11.2026: „kürzen auf einen Artikel bringt nix" - aus „Der Vulkan
       und das Mädchen" war „Der…" geworden). Verlangt wird ein Wort mit mindestens vier Buchstaben; bleibt keines,
       schweigt das Band lieber. Satzzeichen am Schnitt fallen weg, sonst stuende da „Rusalka /…".
       Kuerzer ist immer leichter unterzubringen, also wird die laengste passende Kuerzung geschachtelt gesucht. */
    let text = titel, stellen = suche(text);
    if (!stellen.length){
      const kand = []; const re = /\s+/g; let mm;
      while ((mm = re.exec(titel))){ const k = titel.slice(0, mm.index).replace(/[\s,;:.·/|–—-]+$/, '');
        if (/[^\s]{4,}/.test(k)) kand.push(k + '…'); }
      let a = 0, b = kand.length - 1, gut = null;
      while (a <= b){ const q = (a + b) >> 1, t = suche(kand[q]);
        if (t.length){ gut = { t, kurz: kand[q] }; a = q + 1; } else b = q - 1; }
      if (!gut) continue;
      stellen = gut.t; text = gut.kurz; }
    /* 6. Satz: jeder Buchstabe einzeln, seine m-Linie auf der Tangente an seiner Stelle. Erst gerechnet, dann
       auf Kollision geprueft, dann ausgegeben. Ein <g> je Name, damit die Buchstaben zusammengehoeren wie die
       Flaeche zu ihrem Band - und damit man sie zaehlen kann. */
    let stuecke = null, kaesten = null, fs = 0, zeilenZahl = 1;
    for (const stelle of stellen){
      fs = stelle.fs; const st = [], v0 = stelle.zeilen.length > 1 ? LEAD * fs / 2 : 0;
      /* je Zeile ihre eigene m-Linie auf ihrer eigenen Tangente, um v quer zur Achse versetzt */
      stelle.zeilen.forEach((z, zi) => { const v = (stelle.zeilen.length > 1 ? (zi ? v0 : -v0) : 0) - (stelle.hub || 0);   /* Anhub aus der Luft */
        const kv = parallel(v), j0 = (() => { let j = 1; while (j < N - 1 && S[j] < stelle.s) j++; return j; })();
        const sStart = kv.PS[j0] - mw(z, fs) / 2;
        /* DIE BREITE EINES BUCHSTABENS IST DIE DIFFERENZ DER PRAEFIXE, nicht seine Einzelbreite: einzeln gemessen
           fehlt die Unterschneidung, und die Summe passt dann nicht zu den Positionen - „Willem" stand als
           „Wil l e m" da (Caspar_D am Bild, 14.11.2026). */
        let vor = 0;
        for (let c = 0; c < z.length; c++){ const ch = z[c], nach = mw(z.slice(0, c + 1), fs), bw = nach - vor;
          if (ch !== ' '){ const q = anP(kv, sStart + vor + bw / 2);
            st.push({ ch, q }); }
          vor = nach; } });
      if (!st.length) break;
      /* WAS DER NAME DEN NACHBARN WEGNIMMT, IST SEINE TINTE - nicht sein Satzspiegel. Je Tintenstueck sein
         mitgedrehtes Rechteck, davon die achsparallele Huelle. Zwei Namen ohne Ober- und Unterlaengen duerfen
         damit dichter uebereinander stehen als zwei mit. */
      const hub = stelle.hub || 0;
      const ks = stelle.teile.map(t => { const q = anS(stelle.s + (t.a + t.b) / 2), cs = Math.cos(q.w), sn = Math.sin(q.w);
        const hw = (t.b - t.a) / 2 + LUFT * fs;
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (const a of [-hw, hw]) for (const b of [-(t.oben - hub + LUFT * fs), t.unten + hub + LUFT * fs]){
          const X = q.x + a * cs - b * sn, Y = q.y + a * sn + b * cs;
          x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); }
        return { x0, x1, y0, y1 }; });
      if (schneidet(ks)) continue;
      stuecke = st; kaesten = ks; zeilenZahl = stelle.zeilen.length; break; }
    if (!stuecke) continue;
    for (const k of kaesten) belegt.push(k);
    let satz = '';
    for (const t of stuecke)
      satz += `<text y="${f(xHoehe * fs)}" transform="translate(${f(t.q.x)},${f(t.q.y)}) rotate(${f(t.q.w * 180 / Math.PI)}) scale(${STAUCH},1)"`
        + ` text-anchor="middle">${esc(t.ch)}</text>`;
    namen += `<g class="hsname" data-id="${esc(e.id)}" data-zeilen="${zeilenZahl}" font-size="${fs}" font-family="${esc(schrift)}"`
      + ` style="fill:${topline}" pointer-events="none">${satz}</g>`;
  }
  /* Wochen: stossen zwei Beschriftungen aneinander (schmaler Bildschirm), stehen nur die erste und die letzte - die Achse ist
     linear, die Wochen dazwischen liest man ab (Caspar_D, 13.11.2026: „es reicht auch die erste und letzte"). */
  const kwText = daten.wochen.map(t => 'KW ' + kw(t)), kwBreite = (s) => messen ? messen(s, 11) : s.length * 6.2;
  const kwSpanne = (j) => { const b = kwBreite(kwText[j]); return j === 0 ? [px[j], px[j] + b] : j === m - 1 ? [px[j] - b, px[j]] : [px[j] - b / 2, px[j] + b / 2]; };
  let eng = false; for (let j = 1; j < m; j++) if (kwSpanne(j)[0] - kwSpanne(j - 1)[1] < 6) { eng = true; break; }
  const achse = daten.wochen.map((t, j) => eng && j > 0 && j < m - 1 ? '' : `<text x="${f(px[j])}" y="${hoehe - 6}" font-size="11" text-anchor="${j === 0 ? 'start' : j === m - 1 ? 'end' : 'middle'}" fill="#9aa0a8" font-family="${esc(schrift)}">KW ${kw(t)}</text>`).join('');
  return `<svg viewBox="0 0 ${breite} ${hoehe}" width="${breite}" height="${hoehe}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hitstrom">`
    + `<defs>${defs}</defs><rect x="${f(X0)}" y="${TOP}" width="${f(X1 - X0)}" height="${PH}" rx="6" fill="#000"/>`
    + flaechen + toplines + namen + achse + '</svg>';
}
