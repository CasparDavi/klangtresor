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
  /* ALLE Titel, die sich ueberhaupt bewegt haben - keine Auswahl mehr (Caspar_D, 13.11.2026: „was mich stoert ist,
     dass nur noch bewegtere Titel reinkommen"). Vorher waren es die zwoelf mit dem groessten Zuwachs; dann waren die
     100 % einer Woche nur die 100 % DIESER ZWOELF, und das schwankte zwischen 23 und 95 % des wirklichen Geschehens.
     Jetzt sind 100 % wirklich 100 %. Je Woche bewegen sich nur 19 bis 43 Titel, ueber alle Wochen 123 - das traegt
     die Form noch; Wattenberg zeigt 7500 Filme im selben Bild. Namen bekommen nur die dicken Baender (siehe unten). */
  const baender = zeilen.filter(z => z.summe > 0).sort((a, b) => b.summe - a.summe);
  if (baender.length < 2) return null;
  return { baender, wochen: grenzen.slice(0, wochen) };
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
  const mw = (text, fs) => messen ? messen(text, fs) : text.length * fs * 0.56;
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
  const belegt = [];
  const schneidet = (k) => belegt.some(b => !(k.x1 < b.x0 || b.x1 < k.x0 || k.y1 < b.y0 || b.y1 < k.y0));
  /* Oberlaengen ueber der m-Linie, x-Hoehe und Unterlaengen darunter - das ist die Luft, die ein Name braucht */
  const O_OBEN = 0.30, O_UNTEN = 0.26;
  for (const e of zuSetzen.sort((a, b) => b.gewicht - a.gewicht)) {
    const { titel, smp, topline } = e, N = smp.length;
    const XS = smp.map(q => q.x), HI = smp.map(q => q.hi), LO = smp.map(q => q.lo);
    /* billige Vorentscheidung: wo das Band nirgends 9 Punkt Schrift traegt, wird gar nicht gerechnet */
    let dickMax = 0; for (let j = 0; j < N; j++) dickMax = Math.max(dickMax, LO[j] - HI[j]);
    if (dickMax < 9 * (O_OBEN + xHoehe + O_UNTEN)) continue;
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
    /* Gemessen wird nur, bis die groesste Schrift satt ist (15 Punkt) - wie viel Luft darueber hinaus da ist,
       aendert keine Entscheidung. Ohne diesen Deckel liefen die Taster in dicken Baendern bis zu 300 Punkte weit. */
    const MAX_O = 15 * O_OBEN + 0.5, MAX_U = 15 * (xHoehe + O_UNTEN) + 0.5;
    const winkel = [], fsLokal = new Float64Array(N);
    for (let j = 0; j < N; j++){ const a = Math.max(0, j - 1), c = Math.min(N - 1, j + 1);
      const w = Math.atan2(ACHSE[c] - ACHSE[a], (XS[c] - XS[a]) || 1); winkel.push(w);
      const nx = -Math.sin(w), ny = Math.cos(w);
      let u = 0, v = 0;
      while (u < MAX_O && drin(XS[j] - nx * (u + 0.5), ACHSE[j] - ny * (u + 0.5))) u += 0.5;
      while (v < MAX_U && drin(XS[j] + nx * (v + 0.5), ACHSE[j] + ny * (v + 0.5))) v += 0.5;
      /* Die groesste Schrift, die AN DIESER STELLE noch Luft und Neigung einhaelt. Damit wird aus drei
         Bedingungen eine einzige Zahl, und die Frage „passt fs auf der ganzen Namenslaenge" ist ein
         Minimum ueber ein Fenster - als Praefixsumme der verbotenen Stellen in einem Schritt zu haben. */
      fsLokal[j] = Math.abs(w) > GRAD66 ? 0 : Math.min(u / O_OBEN, v / (xHoehe + O_UNTEN)); }
    const S = [0]; for (let j = 1; j < N; j++) S.push(S[j - 1] + Math.hypot(XS[j] - XS[j - 1], ACHSE[j] - ACHSE[j - 1]));
    /* 5. Gravitationszentrum: dickengewichtete Mitte, als Bogenlaenge */
    let sa = 0, sb = 0; for (let j = 0; j < N; j++){ const t = LO[j] - HI[j]; sa += S[j] * t; sb += t; }
    const SCHWER = sb ? sa / sb : S[N - 1] / 2;
    const anS = (s) => { s = Math.max(0, Math.min(S[N - 1], s)); let j = 1; while (j < N - 1 && S[j] < s) j++;
      const t = (s - S[j - 1]) / ((S[j] - S[j - 1]) || 1);
      return { x: XS[j - 1] + t * (XS[j] - XS[j - 1]), y: ACHSE[j - 1] + t * (ACHSE[j] - ACHSE[j - 1]), w: winkel[j] }; };
    /* je Schriftgroesse einmal: wie viele verbotene Stellen bis hierher. Haengt nicht vom Text ab, also vor
       den Kuerzungsversuchen gerechnet. */
    const verboten = []; for (let fs = 15; fs >= 9; fs--){ const pre = new Int32Array(N + 1);
      for (let j = 0; j < N; j++) pre[j + 1] = pre[j] + (fsLokal[j] < fs ? 1 : 0); verboten.push(pre); }
    const suche = (text) => {
      for (let fs = 15; fs >= 9; fs--){
        const br = breiteVon(text, fs), pre = verboten[15 - fs];
        let lo = 0, hi = 0, best = null;
        for (let j = 0; j < N; j++){
          const s0 = S[j] - br / 2, s1 = S[j] + br / 2;
          while (lo < N - 1 && S[lo] < s0) lo++;                       /* beide Grenzen wandern mit j nach rechts */
          if (hi < lo) hi = lo;
          while (hi < N - 1 && S[hi + 1] <= s1) hi++;
          if (s0 < 2 || s1 > S[N - 1] - 2) continue;
          if (pre[hi + 1] - pre[lo]) continue;                         /* Luft und Neigung auf der ganzen Laenge */
          /* 4. Randabstand in x, nicht nur entlang der Bogenlaenge - sonst schneidet die Bildkante den Namen ab */
          if (XS[lo] < X0 + RANDLUFT || XS[hi] > X1 - RANDLUFT) continue;
          const dist = Math.abs(S[j] - SCHWER);
          if (!best || dist < best.dist) best = { fs, s: S[j], dist, br }; }
        if (best) return best; }
      return null; };
    /* Passt der Name nicht, so wenig gekuerzt wie noetig (mindestens vier Zeichen vor dem …). Kuerzer ist immer
       leichter unterzubringen, also wird die laengste passende Kuerzung geschachtelt gesucht statt Zeichen fuer
       Zeichen - bei einem langen Titel sind das fuenf Versuche statt dreissig, mit demselben Ergebnis. */
    let text = titel, treffer = suche(text);
    if (!treffer){ let a = 4, b = titel.length - 1, gut = null;
      while (a <= b){ const k = (a + b) >> 1, kurz = titel.slice(0, k).trimEnd() + '…', t = suche(kurz);
        if (t){ gut = { t, kurz }; a = k + 1; } else b = k - 1; }
      if (!gut) continue;
      treffer = gut.t; text = gut.kurz; }
    const { fs, s, br } = treffer, p0 = anS(s - br / 2), p1 = anS(s + br / 2), pm = anS(s);
    const kasten = { x0: Math.min(p0.x, p1.x) - 2, x1: Math.max(p0.x, p1.x) + 2,
      y0: Math.min(p0.y, p1.y, pm.y) - 0.9 * fs, y1: Math.max(p0.y, p1.y, pm.y) + 1.0 * fs };
    if (schneidet(kasten)) continue;
    belegt.push(kasten);
    /* 6. Satz: jeder Buchstabe einzeln, seine m-Linie auf der Tangente an seiner Stelle. Ein <g> je Name, damit
       die Buchstaben zusammengehoeren wie die Flaeche zu ihrem Band - und damit man sie zaehlen kann. */
    const sStart = s - mw(text, fs) / 2;
    let satz = '';
    for (let c = 0; c < text.length; c++){ const ch = text[c]; if (ch === ' ') continue;
      const vor = mw(text.slice(0, c), fs), w = mw(ch, fs), q = anS(sStart + vor + w / 2);
      satz += `<text y="${f(xHoehe * fs)}" transform="translate(${f(q.x)},${f(q.y)}) rotate(${f(q.w * 180 / Math.PI)})"`
        + ` text-anchor="middle">${esc(ch)}</text>`; }
    namen += `<g class="hsname" data-id="${esc(e.id)}" font-size="${fs}" font-family="${esc(schrift)}"`
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
