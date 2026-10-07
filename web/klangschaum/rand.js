/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   DER GEMALTE RAND (Plakat „Randlos", 07.10.2026). Der Schaum füllt die Seite, ringsum liegt ein gemalter Rand. Jede Stelle des
   Rands trägt die Farbe des Areals, das dort an die Kante des Schaums stößt; wo zwei Areale aneinanderstoßen, laufen die Farben
   ineinander (Aquarell: nass in nass gemischt; Kreide: Striche beider Farben über eine lange Strecke durcheinander, nicht
   gemittelt); wo kein Areal angrenzt (die Ecke mit Avatar und Text), läuft der Rand in den Grund aus. Die Farbe geht über die
   äußere Kante der Seite hinaus und endet zum Schaum hin unruhig mit einem schmalen Streifen Grund (1 … 3,5 mm); ohne Lücke
   (luecke false, „nur Umschlag") malt sie bis tiefe + 2 mm, dort liegt später der Schaum darüber.
   Vorlage sind die Skizzen, die Caspar_D ausgewählt hat: rand2/aquarell.html („Nass in Nass", „Flecken und Blüten", „Alles
   zusammen, locker") auf Papier und rand2/dunkel.html („Pastellkreide", „Kreide, verwischt", „Gouache, trockener Pinsel") auf
   dunklem Grund. Sie rechnen in einem geraden Streifen (x entlang der Kante, y Tiefe von der Schnittkante, 28 mm breit); hier
   läuft derselbe Satz um die ganze Seite, mit denselben Formeln und Schwellen, wo es ging.
   RECHNUNG: jeder Pixel analytisch aus Seitenkoordinaten (mm). Die nächste Seitenkante liefert die Umlaufkoordinate s (im
   Uhrzeigersinn ab oben links, wie `farben`) und die Tiefe v (mm von der Kante, nach innen positiv). An den Seitenecken (Pixel
   nahe zwei Kanten) werden beide Kanten gerechnet und über eine unruhige Gehrung von gut 4 mm überblendet. Darum passen die vier
   Streifen ohne Naht aneinander, gleich in welcher Reihenfolge sie entstehen; alle Streifen liegen auf einem gemeinsamen
   Pixelraster ab der Seitenecke oben links. Papierkorn und Kreidezahn liegen in absoluten Seiten-mm (das Papier ist eins),
   Strichlagen, Borsten und Bahnen entlang der jeweiligen Kante (in s, v). Größen von Bahnenden, Blüten, Flecken, Strichen und
   Spritzern wachsen mit der Randtiefe (Faktor tiefe/28, auf 0,5 … 2 geklemmt); der Streifen Grund zum Schaum bleibt 1 … 3,5 mm.
   Ein Eintrag in `farben` ist [r,g,b] oder [r,g,b,a]; a ∈ (0,1] ist die Pigmentmenge (an der Ecke mit Avatar und Text ein Hauch
   statt Leere), null heißt gar keine Farbe (siehe vorbereitung).
   Kein Math.random, keine Uhr: gleiche Eingabe → bitgleiches Bild. Was nicht von der Auflösung abhängt (Bahnen, Blüten, Flecken,
   Spritzer, Tabellen), wird einmal je Auftrag vorbereitet und für die vier Streifen wiederverwendet.
   Versuche in der Werkstatt (Intel-iMac, node 23): 70 × 100 cm, tiefe 25, alle vier Streifen zusammen bei 8 px/mm 2,5 … 6,9 s
   (verwischt am längsten), bei 2 px/mm 0,2 … 1,1 s; auf 50 × 70 sind die aus Streifen zusammengesetzte Seite und dasselbe Stück
   in einem Zug gerechnet bitgleich (Prüfstand rand-pruef/pruef.mjs). */

export const WEISEN = { hell: ['nass', 'flecken', 'alles'], dunkel: ['pastell', 'verwischt', 'trocken'] };

// --- Rauschen wie in den Skizzen: Wertrauschen, glatt interpoliert, Oktaven mit Faktor 2,03 -----------------------------------
function hash(i, j, s) { let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(s, 982451653); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function rausch(x, y, s) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s, o) { let v = 0, a = 0.5, f = 1, n = 0; for (let k = 0; k < o; k++) { v += a * rausch(x * f, y * f, s + k * 31); n += a; a *= 0.5; f *= 2.03; } return v / n; }
const glatt = (a, b, x) => { const t = (x - a) / (b - a); return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); };
// Gauß-Kante: Anteil einer gerade begrenzten Fläche nach Unschärfe σ im Abstand d·σ (logistische Näherung von Φ)
const phi = (x) => x >= 4 ? 1 : x <= -4 ? 0 : 1 / (1 + Math.exp(-1.702 * x));
// Umkehrung von glatt(0,1,·): zieht aus gleichverteiltem u eine Lage im Fenster mit glockigem Gewicht (Kreide wählt so ihre Farbe)
const umGlatt = (u) => 0.5 - Math.sin(Math.asin(1 - 2 * u) / 3);
function zufall(s) { let z = s >>> 0 || 1; return () => (z = (Math.imul(z, 1103515245) + 12345) >>> 0) / 4294967296; }
function mische(a, b) { let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b + 0x632be5ab) | 0, 0xc2b2ae35); h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; return (h & 0x3fffffff); }
const WEISS = [246, 243, 236];                                     // Kreideweiß der Skizze, hellt Pastell und Staub auf

/* --- Die sechs Weisen. Werte aus den Skizzen (Bahnen „bisKante", Striche, Flecken, Spritzer, Kreide, Borsten); Längen in mm bei
   28 mm Rand, sie wachsen mit k. ueber: wie weit eine Bahn über die Grenze zum Nachbarareal hinausläuft (Überlappung, dort mischt
   es sich nass), ausF/ausL: Länge des Ausdünnens zum Nachbarn mit Farbe / zum Grund, endSaum: Wassersaum am Bahnende. -------- */
const HELL = {
  nass: { dichte: 0.5, nass: 1.7, saum: 2.5, saumKraft: 1.2, ueber: 18, ausF: 22, ausL: 30, endSaum: 1, endWeich: 1,
    bluete: { je: 47, r: [3, 8] }, grenzBlueten: true, fenster: 34 },
  flecken: { dichte: 0.44, nass: 1.0, saum: 2.0, saumKraft: 1.4, ueber: 6, ausF: 26, ausL: 30, endSaum: 0, endWeich: 5,
    bluete: { je: 55, r: [6, 9] }, flecken: { je220: 8, r: [5, 15], d: [0.35, 0.6], v: [2, 22] }, fenster: 34 },
  alles: { dichte: 0.36, nass: 1.5, saum: 2.0, saumKraft: 1.4, ueber: 18, ausF: 22, ausL: 30, endSaum: 1, endWeich: 1,
    bluete: { je: 75, r: [5, 7] }, grenzBlueten: true, flecken: { je220: 3, r: [6, 13], d: [0.3, 0.3], v: [4, 20] },
    striche: 6, spritzer: 110, fenster: 34 },
};
const DUNKEL = {
  pastell: { mehr: 0, staub: 900, fenster: 60 },
  verwischt: { mehr: 0.05, staub: 400, fenster: 60, wisch: 3.2 },
  trocken: { fenster: 45 },
};
const LAGEN = [-0.12, 0.18, -0.4].map(w => [Math.cos(w), Math.sin(w)]);   // drei Schraffurlagen der Kreide, Winkel zur Kante

/* Kurze Lücken ohne Farbe (< 6 mm, etwa ein Knoten des Schaums an der Kante) schließen die Nachbarn je zur Hälfte; nur echte
   Strecken ohne Areal (die Ecke) bleiben leer. Zyklisch über den Umlauf. */
function lueckenFuellen(fz, maxLen) {
  const L = fz.length, st = fz.findIndex(c => c);
  if (st < 0 || fz.every(c => c)) return;
  for (let i = 0; i < L;) {
    if (fz[(st + i) % L]) { i++; continue; }
    let n = 0; while (n < L && !fz[(st + i + n) % L]) n++;
    if (n < maxLen) { const li = fz[(st + i - 1 + L) % L], re = fz[(st + i + n) % L]; for (let m = 0; m < n; m++) fz[(st + i + m) % L] = m < n / 2 ? li : re; }
    i += n;
  }
}
// zweimal Kastenfilter, zyklisch: ein Dreiecksfenster der Gesamtbreite ≈ 4r+1 Zellen
function glaetten(werte, r) {
  const L = werte.length; let a = werte;
  for (let pass = 0; pass < 2; pass++) {
    const b = new Float64Array(L); let sum = 0;
    for (let m = -r; m <= r; m++) sum += a[((m % L) + L) % L];
    for (let i = 0; i < L; i++) { b[i] = sum / (2 * r + 1); sum += a[(i + r + 1) % L] - a[(((i - r) % L) + L) % L]; }
    a = b;
  }
  return a;
}
function pruefsumme(farben) { let h = 2166136261; for (let i = 0; i < farben.length; i++) { const c = farben[i];
  const w = c ? ((c[0] & 255) << 16 | (c[1] & 255) << 8 | (c[2] & 255)) + 1 : 0, d = c && c.length > 3 ? Math.round(+c[3] * 1000) : 1000;
  h = Math.imul(h ^ w, 16777619); h = Math.imul(h ^ d, 16777619); } return h >>> 0; }

/* === Vorbereitung je Auftrag (ohne Auflösung): Farbläufe, gemischte Farben, Tabellen der Kante, Bahnen, Blüten, Flecken, … ==== */
let ZWISCHEN = null;                                              // ein Auftrag im Speicher: die vier Streifen teilen ihn
function vorbereitung(A) {
  const schluessel = [A.PW, A.PH, A.tiefe, A.luecke, A.weise, A.saat, A.grund.join(','), A.farben.length, pruefsumme(A.farben)].join('|');
  if (ZWISCHEN && ZWISCHEN.schluessel === schluessel) return ZWISCHEN.V;
  const { PW, PH, tiefe: D, luecke, weise, grund } = A;
  const P = 2 * (PW + PH), k = Math.min(2, Math.max(0.5, D / 28)), S = mische(A.saat | 0, 77);
  const hell = WEISEN.hell.includes(weise), Q = hell ? HELL[weise] : DUNKEL[weise];
  /* --- Farben am Umlauf: säubern, kurze Lücken schließen, flach ablegen. Ein Eintrag ist [r,g,b] oder [r,g,b,a]; a ∈ (0,1] ist
     die MENGE des Pigments (Deckung bzw. Dichte), keine Mischung mit dem Grund: an der Ecke mit Avatar und Text gibt der Aufrufer
     einen Hauch (dunkel [255,255,255,0.12], hell etwa [40,40,44,0.1]), damit der Rand dort nicht wie ein Loch ins Leere fällt.
     Kreide setzt dann weniger auf die Zahnspitzen (wenige helle Körnchen und Striche statt grauer Fläche), Gouache zieht
     dünnere, lückigere Borstenspuren, Aquarell trägt geringere Dichte ρ auf. null heißt weiter: gar keine Farbe. --- */
  const L = Math.max(1, A.farben.length), fz = new Array(L);
  for (let i = 0; i < L; i++) { const c = A.farben[i];
    const d = c && c.length > 3 && c[3] != null && isFinite(c[3]) ? Math.min(1, +c[3]) : 1;
    fz[i] = c && c.length >= 3 && isFinite(c[0]) && isFinite(c[1]) && isFinite(c[2]) && d > 0 ? [+c[0], +c[1], +c[2], d] : null; }
  lueckenFuellen(fz, 6 * L / P);
  const FR = new Float64Array(L), FG = new Float64Array(L), FB = new Float64Array(L), FA = new Float64Array(L), FN = new Uint8Array(L);
  for (let i = 0; i < L; i++) if (fz[i]) { FR[i] = fz[i][0]; FG[i] = fz[i][1]; FB[i] = fz[i][2]; FA[i] = fz[i][3]; FN[i] = 1; }
  const zuIdx = (s) => { let i = Math.floor(s * L / P) % L; return i < 0 ? i + L : i; };
  /* Gemischte Farbe im Fenster (Dreieck, Breite `fenster`·k): für Aquarell die Absorption relativ zum Papier (Farben mischen sich
     im Durchlass), für Gouache die Farbe selbst, je nach Pigmentmenge gewichtet (viel Pigment setzt sich durch); dazu die Menge
     (mit Hauch und Lücke) und die Anwesenheit (Anteil überhaupt mit Farbe), die beide zum Grund hin ausdünnen. */
  const absorb = (c, i) => Math.max(0, Math.min(1, 1 - c / Math.max(1, grund[i])));
  const m0 = new Float64Array(L), m1 = new Float64Array(L), m2 = new Float64Array(L), ma = new Float64Array(L), mp = new Float64Array(L);
  for (let i = 0; i < L; i++) if (FN[i]) {
    const d = FA[i];
    if (hell) { m0[i] = absorb(FR[i], 0) * d; m1[i] = absorb(FG[i], 1) * d; m2[i] = absorb(FB[i], 2) * d; } else { m0[i] = FR[i] * d; m1[i] = FG[i] * d; m2[i] = FB[i] * d; }
    ma[i] = d; mp[i] = 1;
  }
  const rF = Math.max(1, Math.round(Q.fenster * k * L / P / 4));
  const M0 = glaetten(m0, rF), M1 = glaetten(m1, rF), M2 = glaetten(m2, rF), MA = glaetten(ma, rF), MP = glaetten(mp, rF);
  // --- Tabellen über den Umlauf (1/16 mm): Innenkante der Farbe und was sonst nur von s abhängt ---
  const T0 = -64, TS = 16, TN = Math.ceil((P + 128) * TS) + 2;
  const tabelle = (fn) => { const t = new Float64Array(TN); for (let n = 0; n < TN; n++) t[n] = fn(T0 + n / TS); return t; };
  /* Unterkante der Farbe wie in der Skizze: BW − 1,0 − 1,6·fbm(x/9) − 0,9·fbm(x/1,8), also 1 … 3,5 mm Grund vor dem Schaum */
  /* ohne Lücke („nur Umschlag"): 2 mm unter den Schaum, aber nur volle Farbe - ein Hauch (Deckung < 1, die Ecke) endet an der Falz,
     sonst stand vorn ein grauer Saum, wo kein Schaum darüber liegt (Fallensuche 1.0.60) */
  const vollBei = (s) => { const i = Math.floor((((s % P) + P) % P) * L / P) % L; return FN[i] && FA[i] >= 0.999; };
  const innenTab = tabelle(s => luecke ? D - Math.min(3.5, Math.max(1, 1 + 1.6 * fbm(s / 9, 3, S + 1, 3) + 0.9 * fbm(s / 1.8, 4, S + 2, 2))) : D + (vollBei(s) ? 2 : 0));
  const V = { P, k, S, D, L, hell, Q, weise, FR, FG, FB, FA, FN, zuIdx, M0, M1, M2, MA, MP, T0, TS, TN, tabelle, innenTab, PW, PH, grund: grund.slice(), luecke };
  // Ecken des Umlaufs (dort knickt die Kante): Blüten, Flecken und Striche halten Abstand, damit die Gehrung nichts spiegelt
  V.ecken = [0, PW, PW + PH, 2 * PW + PH, P];
  V.eckAbstand = (s) => { let m = Infinity; for (const e of V.ecken) m = Math.min(m, Math.abs(s - e)); return m; };
  V.anwesend = (s) => { const f = s * L / P - 0.5, i = Math.floor(f), t = f - i, a = ((i % L) + L) % L, b = (a + 1) % L; return MP[a] + (MP[b] - MP[a]) * t; };
  if (hell) aquarellVorbereiten(V, fz, A); else if (weise === 'trocken') trockenVorbereiten(V); else kreideVorbereiten(V);
  ZWISCHEN = { schluessel, V };
  return V;
}

/* --- Körbe: Merkmale nach s einsortiert, damit nicht jeder Pixel jedes Merkmal prüft. Bereich [T0, P + 64]. ------------------- */
function korb(V, breite) { const n = Math.ceil((V.P + 128) / breite) + 2; return { breite, n, liste: Array.from({ length: n }, () => []) }; }
function einlegen(V, K, ding, lo, hi) {
  const a = Math.max(0, Math.floor((lo - V.T0) / K.breite)), b = Math.min(K.n - 1, Math.floor((hi - V.T0) / K.breite));
  for (let i = a; i <= b; i++) K.liste[i].push(ding);
}
const korbAus = (V, K, s) => { let i = Math.floor((s - V.T0) / K.breite); return K.liste[i < 0 ? 0 : i >= K.n ? K.n - 1 : i]; };

/* === Aquarell: Bahnen je Farblauf, Blüten, Flecken, Striche, Spritzer ========================================================== */
function aquarellVorbereiten(V, fz, A) {
  const { P, k, S, D, L, Q, grund } = V, rnd = zufall(mische(S, 101));
  const zuS = (i) => i * P / L;
  const gleich = (p, q) => (!p) === (!q) && (!p || (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) <= 30 && Math.abs(p[3] - q[3]) <= 0.15));
  // Farbläufe am Umlauf (zyklisch), Beginn an einer Grenze, damit kein Lauf über das Ende reicht
  let b0 = -1; for (let i = 0; i < L; i++) if (!gleich(fz[i], fz[(i - 1 + L) % L])) { b0 = i; break; }
  const laeufe = [];
  if (b0 < 0) { if (fz[0]) laeufe.push({ a: 0, b: L, c: fz[0], zyklisch: true }); }
  else {
    let start = b0, ref = fz[b0], sum = [0, 0, 0, 0], n = 0;
    for (let m = 0; m <= L; m++) {
      const c = m < L ? fz[(b0 + m) % L] : undefined;
      if (m < L && gleich(c, ref)) { if (c) for (let q = 0; q < 4; q++) sum[q] += c[q]; n++; continue; }
      laeufe.push({ a: start, b: b0 + m, c: ref ? sum.map(x => x / n) : null });
      if (m < L) { start = b0 + m; ref = c; sum = c ? c.slice() : [0, 0, 0, 0]; n = 1; }
    }
  }
  /* Bahnen: jede trägt die Farbe ihres Laufs und läuft zum Nachbarn mit Farbe um `ueber` hinaus (dort liegen beide übereinander und
     mischen sich nass, mit Wassersaum am Ende der einen in der anderen), zum Grund hin endet sie ausgedünnt und ausgefranst. */
  const bahnen = [];
  for (let j = 0; j < laeufe.length; j++) {
    const l = laeufe[j]; if (!l.c) continue;
    const A3 = [0, 1, 2].map(i => Math.max(0, Math.min(1, 1 - l.c[i] / Math.max(1, grund[i]))));
    const B = { A0: A3[0], A1: A3[1], A2: A3[2], dichte: Q.dichte * l.c[3], sd: mische(S, 1000 + j), L: !l.zyklisch, R: !l.zyklisch, blueten: [] };
    if (l.zyklisch) { B.lo = -1e9; B.hi = 1e9; B.eL = -1e9; B.eR = 1e9; }
    else {
      const li = laeufe[(j - 1 + laeufe.length) % laeufe.length], re = laeufe[(j + 1) % laeufe.length];
      const sa = zuS(l.a), sb = zuS(l.b);
      B.farbeL = !!li.c; B.farbeR = !!re.c;
      B.eL = li.c ? sa - Q.ueber * k : sa + 2 * k; B.eR = re.c ? sb + Q.ueber * k : sb - 2 * k;
      B.fadeL = (li.c ? Q.ausF : Q.ausL) * k; B.fadeR = (re.c ? Q.ausF : Q.ausL) * k;
      if (B.eR - B.eL < 6 * k) { const m = (B.eL + B.eR) / 2; B.eL = m - 3 * k; B.eR = m + 3 * k; }
      B.lo = B.eL - 20 * k - 8; B.hi = B.eR + 20 * k + 8;
    }
    // Blüten: Wasser in die nasse Bahn getropft (dünne Mitte, dunkler Saum); an Grenzen zum Nachbarn eine, wo es ineinanderfließt
    const lo = l.zyklisch ? 0 : B.eL + 4 * k, hi = l.zyklisch ? P : B.eR - 4 * k, len = Math.max(0, hi - lo);
    const anz = Math.round(len / (Q.bluete.je * k) * (0.7 + 0.6 * rnd()));
    const neueBluete = (s) => { const r = k * (Q.bluete.r[0] + (Q.bluete.r[1] - Q.bluete.r[0]) * rnd()), v = D * (0.18 + 0.5 * rnd());
      if (V.eckAbstand(s) < r + 6) return; B.blueten.push({ s, v, r, sd: mische(B.sd, B.blueten.length + 7) }); };
    for (let n = 0; n < anz; n++) neueBluete(lo + rnd() * len);
    if (Q.grenzBlueten && !l.zyklisch) { if (B.farbeR) neueBluete(zuS(l.b) - (2 + 6 * rnd()) * k); if (B.farbeL) neueBluete(zuS(l.a) + (4 + 8 * rnd()) * k); }
    bahnen.push(B);
  }
  // Kopien um ±P: eine Bahn über die Ecke oben links (s = 0 ≡ P) gilt auf beiden Seiten
  const verschoben = (B, d) => ({ ...B, lo: B.lo + d, hi: B.hi + d, eL: B.eL + d, eR: B.eR + d, blueten: B.blueten.map(b => ({ ...b, s: b.s + d })) });
  V.bahnKorb = korb(V, 8);
  for (const B of bahnen) {
    if (!B.L) { for (const K of V.bahnKorb.liste) K.push(B); continue; }
    for (const d of [-P, 0, P]) { const C = d ? verschoben(B, d) : B; if (C.hi < V.T0 || C.lo > P + 64) continue; einlegen(V, V.bahnKorb, C, C.lo, C.hi); }
  }
  // Flecken: Lachen mit dunklem Rand (Wasser hineingetropft), Farbe aus der Mischung an ihrer Stelle
  V.fleckKorb = korb(V, 8);
  if (Q.flecken) {
    const F = Q.flecken, anz = Math.round(P / 220 * F.je220);
    for (let n = 0; n < anz; n++) {
      const s = rnd() * P, r = k * (F.r[0] + (F.r[1] - F.r[0]) * rnd()), v = D * (F.v[0] + (F.v[1] - F.v[0]) * rnd()) / 28, dichte = F.d[0] + (F.d[1] - F.d[0]) * rnd(), sd = mische(S, 3000 + n);
      if (V.eckAbstand(s) < 1.5 * r + 4 || V.anwesend(s) < 0.4) continue;
      einlegen(V, V.fleckKorb, { s, v, r, dichte, sd }, s - 1.5 * r, s + 1.5 * r);
    }
  }
  // Striche darüber („Alles"): ein paar Pinselstriche quer, rau, teils trocken; Umriss als Tabelle über s (1/8 mm)
  V.strichKorb = korb(V, 8);
  if (Q.striche) {
    const anz = Math.round(P / 220 * Q.striche), schritt = P / anz;
    for (let n = 0; n < anz; n++) {
      const xa = n * schritt + (rnd() - 0.5) * 14 * k, lang = (26 + 30 * rnd()) * k, xb = xa + lang, yc = D * (4 + 16 * rnd()) / 28, w = (6 + 6 * rnd()) * k;
      const bogen = (rnd() - 0.5) * 3 * k, sd = mische(S, 5000 + n), tr = rnd() < 0.5 ? 0.45 : 0;
      if (V.eckAbstand(xa) < 6 || V.eckAbstand(xb) < 6 || V.ecken.some(e => e > xa && e < xb) || V.anwesend((xa + xb) / 2) < 0.3) continue;
      const m = Math.ceil(lang * 8) + 2, oben = new Float64Array(m), unten = new Float64Array(m);
      for (let i = 0; i < m; i++) {
        const xm = xa + i / 8, t = Math.min(1, (xm - xa) / lang), ende = Math.min(1, t / 0.12, (1 - t) / 0.12);
        const kappe = Math.sqrt(Math.max(0, 1 - (1 - Math.max(0, ende)) ** 2));          // runde Enden statt Kastenkanten
        const mitte = yc + bogen * Math.sin(t * Math.PI) + 2.5 * k * (fbm(xm / (30 * k), sd % 977, sd, 2) - 0.5);
        const halb = w / 2 * kappe * (0.7 + 0.3 * Math.sqrt(Math.max(0, ende))) * (1 + 0.55 * (fbm(xm / (6 * k), 3.3, sd + 3, 3) - 0.5));
        oben[i] = mitte - halb * (1 + 0.33 * (fbm(xm / (2.2 * k), 1, sd + 9, 2) - 0.5)); unten[i] = mitte + halb * (1 + 0.33 * (fbm(xm / (2.2 * k), 2, sd + 11, 2) - 0.5));
      }
      einlegen(V, V.strichKorb, { xa, xb, oben, unten, sd, tr, dichte: 0.28 }, xa, xb);
    }
  }
  // Spritzer: Tropfen in Potenzverteilung, manche gezogen (Schleuderspur); Farbe fest je Tropfen, keine in der leeren Ecke
  V.spritzKorb = korb(V, 2);
  if (Q.spritzer) {
    const anz = Math.round(P / 220 * Q.spritzer), jit = (s, v) => 14 * k * (fbm(s / (40 * k), v / (25 * k), S + 3, 3) - 0.5) * 2;
    for (let n = 0; n < anz; n++) {
      const g = Math.pow(rnd(), 3.4), s = rnd() * P, v = Math.min(D - 0.3, (-2 + Math.pow(rnd(), 1.2) * 32) * D / 28), r = (0.2 + g * 2.2) * k;
      const zug = rnd() < 0.15 ? 2 + rnd() * 2 : 1, winkel = -0.4 + rnd() * 0.8, dichte = 0.5 + rnd() * 0.3, glueck = rnd();
      const sx = s + jit(s, v), menge = mischBei(V, sx), p = MISCH[3];
      if (p < 0.05 || glueck > p) continue;
      const R = r * 1.3 * zug, T = { s, v, r, zug, c: Math.cos(winkel), sn: Math.sin(winkel), dichte: dichte * Math.min(1, menge * 1.5 / p), A0: MISCH[0], A1: MISCH[1], A2: MISCH[2], R };
      for (const d of [-P, 0, P]) { const lo = s + d - R, hi = s + d + R; if (hi < V.T0 || lo > P + 64) continue; einlegen(V, V.spritzKorb, d ? { ...T, s: s + d } : T, lo, hi); }
    }
  }
}
/* gemischte Farbe an der Stelle sx des Umlaufs: MISCH[0..2] die Farbe (nach Menge gewichtet, normiert), MISCH[3] die Anwesenheit
   (Anteil mit Farbe); Rückgabe die Pigmentmenge (Anwesenheit × Deckung) */
const MISCH = new Float64Array(4);
function mischBei(V, sx) {
  const { L, P, M0, M1, M2, MA, MP } = V, f = sx * L / P - 0.5, i = Math.floor(f), t = f - i, a = ((i % L) + L) % L, b = (a + 1) % L;
  const m = MA[a] + (MA[b] - MA[a]) * t;
  MISCH[3] = MP[a] + (MP[b] - MP[a]) * t;
  if (m < 1e-6) { MISCH[0] = MISCH[1] = MISCH[2] = 0; return 0; }
  MISCH[0] = (M0[a] + (M0[b] - M0[a]) * t) / m; MISCH[1] = (M1[a] + (M1[b] - M1[a]) * t) / m; MISCH[2] = (M2[a] + (M2[b] - M2[a]) * t) / m;
  return m;
}

/* === Kreide (Pastell, verwischt) und Gouache: Tabellen über s ================================================================ */
function kreideVorbereiten(V) {
  const { S, k } = V;
  V.randTab = V.tabelle(s => fbm(s / 3, 9, S + 31, 2));                                   // Ausfransen der Innenkante
  V.fensterTab = V.tabelle(s => V.Q.fenster * k * (0.6 + 0.8 * fbm(s / (150 * k), 7.7, S + 17, 2)));   // Fenster 25 … 75 mm, unruhig
}
function trockenVorbereiten(V) {
  const { S, k } = V;
  V.t1Tab = V.tabelle(s => fbm(s / (5 * k), 2, S + 220, 2));
  // drei Züge: eigene Wellung der Borstenspur und wo der Zug Farbe trägt (der erste trägt überall, damit nie ein Loch bleibt)
  V.ywTab = [0, 1, 2].map(z => V.tabelle(s => 5 * k * (fbm(s / (55 * k), z * 3.1, S + 230 + z, 3) - 0.5) * 2 + 1.5 * k * z));
  V.zugTab = [0, 1, 2].map(z => V.tabelle(s => z === 0 ? 1 : glatt(0.25, 0.45, fbm(s / (70 * k), z * 5.3, S + 240 + z, 2))));
}
const tabLesen = (V, t, s) => { let f = (s - V.T0) * V.TS; if (f < 0) f = 0; else if (f > V.TN - 2) f = V.TN - 2; const n = f | 0, u = f - n; return t[n] + (t[n + 1] - t[n]) * u; };

/* === Der Maler: eine Funktion je Weise, die zu einem Punkt der Seite (mm) die Farbe rechnet ==================================== */
function baueMaler(V, px) {
  const { PW, PH, P, k, S, D, hell, Q, weise, FR, FG, FB, FA, FN, zuIdx, grund } = V;
  const G0 = grund[0], G1 = grund[1], G2 = grund[2], hpx = 0.5 / px, B = 2.2;
  const innen = (s) => tabLesen(V, V.innenTab, s);
  const jit = (s, v) => 14 * k * (fbm(s / (40 * k), v / (25 * k), S + 3, 3) - 0.5) * 2;
  /* Farbkoordinate an den Ecken. Der Umlauf ist an der Gehrung gespiegelt: (X, Y) = (30, 10) liegt oben bei s = 30, (10, 30)
     links bei s = P − 30 - eng beieinander, im Umlauf 60 mm auseinander. Läge eine Farbgrenze nahe der Ecke, spränge die Farbe an
     der Gehrung. Darum wählen Bahnen, Kreide und Gouache ihre Farbe nahe einer Ecke an sc = s ∓ v (am Anfang der Kante −, am Ende
     +): in der Eckfläche ist sc von beiden Kanten aus derselbe Wert (oben: X − Y, links: P − Y + X ≡ X − Y), eine Grenze an der
     Ecke läuft also wie beim Bilderrahmen die Gehrung entlang. Ab Randtiefe + 2 mm von der Ecke klingt die Scherung bis zur
     dreifachen Randtiefe aus; Striche, Borsten, Blüten und Flecken selbst bleiben ungeschert in s. */
  const Dm = D + 4;
  const gEcke = (t, len) => 1 - glatt(Dm + 2, Math.max(Dm + 3, Math.min(3 * Dm, len / 2)), t);
  const farbS = (s, v, a, len) => s - v * gEcke(a, len) + v * gEcke(len - a, len);
  /* Gehrung: setzt SA/VA/CA (Kante a: s, v, Farbkoordinate), SB/VB/CB (Kante b) und WA (Gewicht von a); ZWEI, wenn beide */
  let SA = 0, VA = 0, CA = 0, SB = 0, VB = 0, CB = 0, WA = 1, ZWEI = false;
  function seiten(X, Y) {
    const oben = Y <= PH - Y, dh = oben ? Y : PH - Y, links = X <= PW - X, dw = links ? X : PW - X;
    const sh = oben ? X : PW + PH + (PW - X), sw = links ? 2 * PW + PH + (PH - Y) : PW + Y, diff = dw - dh;
    if (diff > B + 2.6) { SA = sh; VA = dh; CA = farbS(sh, dh, oben ? X : PW - X, PW); ZWEI = false; return; }
    if (diff < -B - 2.6) { SA = sw; VA = dw; CA = farbS(sw, dw, links ? PH - Y : Y, PH); ZWEI = false; return; }
    const w = glatt(-B, B, diff + 5 * (fbm(X / 6, Y / 6, S + 901, 2) - 0.5));
    const ch = farbS(sh, dh, oben ? X : PW - X, PW), cw = farbS(sw, dw, links ? PH - Y : Y, PH);
    SA = sh; VA = dh; CA = ch; SB = sw; VB = dw; CB = cw; WA = w; ZWEI = w > 0 && w < 1;
    if (w <= 0) { SA = sw; VA = dw; CA = cw; }
  }
  const o1 = new Float64Array(4), o2 = new Float64Array(4);

  if (hell) {
    /* ---- Aquarell: Durchlass je Kanal, Papier × Π(1 − ρ·A); A = Absorption der Farbe relativ zum Papier `grund` ---- */
    const sIn = Q.nass, sIn2 = Math.hypot(Q.nass, Q.saum), sE = Q.nass * k * Q.endWeich, sE2 = Math.hypot(sE, Q.saum * k);
    const saumKraft = Q.saumKraft, kantenBreite = Math.max(0.015, 0.2 * hpx);
    function seite(s, v, sc, hp, o) {
      let T0 = 1, T1 = 1, T2 = 1;
      const vin = innen(s), dIn = vin - v, koern = 1 + 0.35 * (0.5 - hp) * 2;
      let J = NaN;                                                    // Fenster-Unruhe, erst bei Bedarf
      if (dIn > -4 * sIn2) {
        const phIn = phi(dIn / sIn), phIn2 = phi(dIn / sIn2);
        // Bahnen bis über den Schnitt
        const kb = korbAus(V, V.bahnKorb, sc);
        for (let n = 0; n < kb.length; n++) {
          const Bn = kb[n]; if (sc < Bn.lo || sc > Bn.hi) continue;
          /* Umriss der Bahn: oben über den Schnitt (unsichtbar), unten die Innenkante, an den Enden ausgefranst und schräg (außen
             länger als innen, wie in der Skizze); weich um σ = nass, Wassersaum = Umriss − stärker verwischter Umriss; dazu das
             Ausdünnen über die letzten 22 … 30 mm·k bis auf ein Viertel der Dichte */
          let a = phIn, ab = phIn2, aus = 1;
          if (Bn.L && sc < Bn.eL + 16 * k + 4 * sE + Bn.fadeL) {
            const e = Bn.eL - k * (16 * (fbm(v / (7 * k), 7, Bn.sd + 7, 3) - 0.5) + 5 * (fbm(v / (2.6 * k), 8, Bn.sd, 2) - 0.5) - 7 * (v / D - 0.5));
            const d = sc - e, pa = phi(d / sE); a *= pa; ab *= (!Q.endSaum && Bn.farbeL) ? pa : phi(d / sE2);
            aus *= glatt(Bn.eL - 4 * k, Bn.eL + Bn.fadeL, sc + 8 * k * (fbm(v / (7 * k), 1, Bn.sd + 31, 2) - 0.5));
          }
          if (Bn.R && sc > Bn.eR - 16 * k - 4 * sE - Bn.fadeR) {
            const e = Bn.eR + k * (16 * (fbm(v / (7 * k), 5, Bn.sd + 5, 3) - 0.5) + 5 * (fbm(v / (2.6 * k), 6, Bn.sd, 2) - 0.5) - 7 * (v / D - 0.5));
            const d = e - sc, pa = phi(d / sE); a *= pa; ab *= (!Q.endSaum && Bn.farbeR) ? pa : phi(d / sE2);
            aus *= 1 - glatt(Bn.eR - Bn.fadeR, Bn.eR + 4 * k, sc + 8 * k * (fbm(v / (7 * k), 2, Bn.sd + 33, 2) - 0.5));
          }
          if (a < 0.002) continue;
          const saum = Math.max(0, a - ab) * saumKraft, dichte = Bn.dichte;   // Pigment sammelt sich am Rand der Pfütze
          let rho = (a * dichte * (0.72 + 0.56 * fbm(sc / (14 * k), v / (9 * k), Bn.sd + 13, 4)) + saum * dichte) * (0.25 + 0.75 * aus) * koern;
          const bl = Bn.blueten;
          for (let m = 0; m < bl.length; m++) {
            const b = bl[m], dx = s - b.s, R = b.r * 1.35; if (dx > R || dx < -R) continue;
            const dy = v - b.v; if (dy > R || dy < -R) continue;
            const dist = Math.sqrt(dx * dx + dy * dy); if (dist > R || dist < 1e-9) continue;
            let d = dist / (b.r * (1 + 0.4 * (fbm(9 + 2 * dx / dist, 4 + 2 * dy / dist, b.sd, 3) - 0.5)));
            d *= 1 + 0.16 * (fbm(dx / (1.1 * k), dy / (1.1 * k), b.sd + 3, 3) - 0.5);          // Blumenkohlrand
            if (d < 1.08) rho = d < 0.93 ? rho * 0.5 : rho + 0.55 * dichte * glatt(0.93, 1.0, d) * (1 - glatt(1.0, 1.08, d)) * a;
          }
          const r = rho > 1.25 ? 1.25 : rho;
          T0 *= Math.max(0, 1 - r * Bn.A0); T1 *= Math.max(0, 1 - r * Bn.A1); T2 *= Math.max(0, 1 - r * Bn.A2);
        }
        // Striche darüber
        const ks = korbAus(V, V.strichKorb, s);
        for (let n = 0; n < ks.length; n++) {
          const st = ks[n]; if (s < st.xa || s > st.xb) continue;
          const f = (s - st.xa) * 8, i = f | 0, t = f - i, top = st.oben[i] + (st.oben[i + 1] - st.oben[i]) * t, bot = st.unten[i] + (st.unten[i + 1] - st.unten[i]) * t;
          const ss = 0.8 * k; if (v < top - 4 * ss || v > bot + 4 * ss || bot <= top) continue;
          const d = Math.min(v - top, bot - v), a = glatt(-hpx, hpx, d);
          if (a <= 0) continue;
          const saum = Math.max(0, a - phi(d / ss)) * 2;
          let deck = a;
          if (st.tr) deck *= glatt(st.tr - 0.1, st.tr + 0.1, hp + a * 0.35 + 0.2 * (fbm(s / (1.5 * k), v / (9 * k), st.sd + 21, 2) - 0.5));   // trockener Pinsel
          if (J !== J) J = jit(sc, v);
          const p = mischBei(V, sc + J); if (p < 0.01) continue;
          const rho = (deck * st.dichte * (0.72 + 0.56 * fbm(s / (14 * k), v / (9 * k), st.sd + 13, 4)) + saum * st.dichte) * koern * Math.min(1, p * 1.5) * phIn;
          const r = rho > 1.25 ? 1.25 : rho;
          T0 *= Math.max(0, 1 - r * MISCH[0]); T1 *= Math.max(0, 1 - r * MISCH[1]); T2 *= Math.max(0, 1 - r * MISCH[2]);
        }
        // Flecken: unregelmäßige Lachen mit dunklem Rand
        const kf = korbAus(V, V.fleckKorb, s);
        for (let n = 0; n < kf.length; n++) {
          const fl = kf[n], dx = s - fl.s, R = 1.5 * fl.r; if (dx > R || dx < -R) continue;
          const dy = v - fl.v; if (dy > R || dy < -R) continue;
          const d = Math.sqrt(dx * dx + dy * dy) / fl.r, feld = fbm(s / (fl.r * 0.45), v / (fl.r * 0.45), fl.sd, 4) + 0.55 * (1 - d) - 0.5;
          if (feld <= 0) continue;
          if (J !== J) J = jit(sc, v);
          const p = mischBei(V, sc + J); if (p < 0.01) continue;
          const rand = 1 - glatt(0, 0.06, feld), rho = fl.dichte * (0.55 + 0.9 * rand) * glatt(0, kantenBreite, feld) * (1 + 0.4 * (0.5 - hp) * 2) * Math.min(1, p * 1.5) * phIn;
          T0 *= Math.max(0, 1 - rho * MISCH[0]); T1 *= Math.max(0, 1 - rho * MISCH[1]); T2 *= Math.max(0, 1 - rho * MISCH[2]);
        }
      }
      // Spritzer (auch auf dem Streifen Grund, wie geschleudert)
      const kt = korbAus(V, V.spritzKorb, s);
      for (let n = 0; n < kt.length; n++) {
        const tr = kt[n], dx = s - tr.s; if (dx > tr.R || dx < -tr.R) continue;
        const dy = v - tr.v; if (dy > tr.R || dy < -tr.R) continue;
        const u = (dx * tr.c + dy * tr.sn) / tr.zug, w = -dx * tr.sn + dy * tr.c, dist = Math.sqrt(u * u + w * w);
        const reff = tr.r * (1 + 0.25 * (rausch(5 + 1.6 * u / (dist + 1e-9), tr.r * 9 + 1.6 * w / (dist + 1e-9), S + 77) - 0.5)), d = dist / reff;
        const e = Math.max(0.03, hpx / reff); if (d > 1 + e) continue;
        const cov = Math.min(1, Math.max(0, (1 + e - d) / (2 * e))) * Math.min(1, 1 / e);
        const rho = tr.dichte * (0.7 + 0.6 * glatt(0.75, 1, d)) * cov;
        T0 *= Math.max(0, 1 - rho * tr.A0); T1 *= Math.max(0, 1 - rho * tr.A1); T2 *= Math.max(0, 1 - rho * tr.A2);
      }
      o[0] = T0; o[1] = T1; o[2] = T2;
    }
    return function punkt(X, Y, o) {
      const hp = 0.55 * fbm(X / 0.7, Y / 0.7, S + 5, 3) + 0.45 * fbm(X / 3, Y / 3, S + 7, 3);      // Papierkorn, fein und grob
      seiten(X, Y); seite(SA, VA, CA, hp, o1);
      if (ZWEI) { seite(SB, VB, CB, hp, o2); for (let c = 0; c < 3; c++) o1[c] = o1[c] * WA + o2[c] * (1 - WA); }
      const pig = Math.min(1, (3 - o1[0] - o1[1] - o1[2]) * 4);  // wie viel Pigment hier liegt
      const licht = 1 + pig * (0.05 * (hp - 0.5) - 0.025);       // ein Hauch Licht auf dem Korn, nur unter Farbe - Papier bleibt der Grund
      o[0] = G0 * o1[0] * licht; o[1] = G1 * o1[1] * licht; o[2] = G2 * o1[2] * licht;
    };
  }

  if (weise === 'trocken') {
    /* ---- Gouache, trockener Pinsel: deckend, Borstenspuren in drei Zügen entlang der Kante, läuft zur Innenkante trocken aus;
       Farbe gemischt im Fenster, entlang der Borsten verschoben; zum Grund hin läuft der Pinsel leer ---- */
    function seite(s, v, sc, o) {
      o[0] = G0; o[1] = G1; o[2] = G2;
      const ka = innen(s); if (v > ka + 1) return;
      const J = jit(sc, v), menge = mischBei(V, sc + J);
      if (MISCH[3] < 0.003) return;
      const druck = fbm(s / (60 * k), v / (12 * k), S + 210, 3);
      // wenig Pigment (Hauch oder Rand zur leeren Ecke): der Pinsel ist fast trocken, nur die Spitzen der Borsten zeichnen
      const trocken = glatt(ka - 9 * k, ka, v + 3 * k * (tabLesen(V, V.t1Tab, s) - 0.5)) * 0.7 + 0.25 * (1 - druck) + (1 - Math.min(1, menge)) * 1.7;
      let cov = 0, bmax = 0;
      for (let z = 0; z < 3; z++) {
        const zug = tabLesen(V, V.zugTab[z], s); if (zug <= 0) continue;
        const yw = v + tabLesen(V, V.ywTab[z], s), borste = fbm(s / ((34 + 8 * z) * k), yw / (0.3 * k), S + 200 + 7 * z, 3);
        const c = glatt(0.42, 0.48, borste + 0.3 * (0.6 - trocken)) * zug; if (c > cov) cov = c; if (borste * zug > bmax) bmax = borste * zug;
      }
      cov *= glatt(ka + hpx, ka - hpx, v);
      if (cov <= 0) return;
      mischBei(V, sc + J + 20 * k * (bmax - 0.5)); const p = MISCH[3]; if (p < 1e-4) return;
      cov *= glatt(0.0, 0.25, p) * 0.97;                            // nur zur Lücke ohne Farbe hin wird die Spur durchscheinend
      const hl = 0.9 + 0.2 * bmax;
      o[0] = G0 + (Math.min(255, MISCH[0] * hl) - G0) * cov; o[1] = G1 + (Math.min(255, MISCH[1] * hl) - G1) * cov; o[2] = G2 + (Math.min(255, MISCH[2] * hl) - G2) * cov;
    }
    return function punkt(X, Y, o) {
      seiten(X, Y); seite(SA, VA, CA, o1);
      if (ZWEI) { seite(SB, VB, CB, o2); for (let c = 0; c < 3; c++) o1[c] = o1[c] * WA + o2[c] * (1 - WA); }
      o[0] = o1[0]; o[1] = o1[1]; o[2] = o1[2];
    };
  }

  /* ---- Pastellkreide (und verwischt): drei Schraffurlagen, Pigment nur auf den Spitzen des Zahns; jede Stelle eines Strichs
     wählt ihre Farbe aus dem Fenster um s (über umGlatt gezogen) - an Grenzen liegen Striche beider Farben durcheinander, und wo
     die Wahl auf „keine Farbe" fällt, bleibt der Grund: so dünnt die Kreide zur leeren Ecke hin strichweise aus ---- */
  const mehr = Q.mehr, wisch = !!Q.wisch, staubDichte = Q.staub / 220 / 8 * 0.09;
  function seite(s, v, sc, h, o) {
    let r = G0, g = G1, b = G2;
    const vin = innen(s), rnd = glatt(vin, vin - 3.2, v + 2.2 * (tabLesen(V, V.randTab, s) - 0.5));
    if (rnd > 0) {
      const J = jit(sc, v), W = tabLesen(V, V.fensterTab, sc);
      for (let z = 0; z < 3; z++) {
        const c = LAGEN[z][0], sn = LAGEN[z][1], p = (s * c + v * sn) / k, q = (-s * sn + v * c) / k;
        const strich = fbm(p / 22, q / 1.1, S + 40 + 13 * z, 3), druck = fbm(p / 45, q / 8, S + 60 + 7 * z, 3);
        const x = 0.55 * h + 0.45 * strich + 0.35 * (druck - 0.5) + mehr + 0.04 * z;
        if (x < 0.52 || rnd * 0.92 < 0.004) continue;                // auch bei voller Menge kein Pigment
        const u = phi((fbm(p / 11, q / 2, S + 80 + 5 * z, 3) - 0.5) / 0.141);   // fbm (σ ≈ 0,141) → fast gleichverteilt, ohne Häufung an den Enden
        const i = zuIdx(sc + J + W * (umGlatt(u) - 0.5)); if (!FN[i]) continue;
        // weniger Pigment: die Kreide greift nur noch die höchsten Spitzen des Zahns und die kräftigsten Stellen des Strichs
        const cov = glatt(0.52, 0.62, x - (1 - FA[i]) * 0.24) * rnd * 0.92; if (cov < 0.004) continue;
        const hl = 0.16 + 0.1 * strich, fr = FR[i] + (WEISS[0] - FR[i]) * hl, fg = FG[i] + (WEISS[1] - FG[i]) * hl, fb = FB[i] + (WEISS[2] - FB[i]) * hl;
        r += (fr - r) * cov; g += (fg - g) * cov; b += (fb - b) * cov;
      }
    }
    o[0] = r; o[1] = g; o[2] = b;
    // verwischt: wo mit dem Finger verrieben wird (Flecken von 30 × 14 mm), bis knapp über die Innenkante
    o[3] = wisch ? glatt(0.42, 0.58, fbm(s / (30 * k), v / (14 * k), S + 400, 3)) * 0.85 * (1 - glatt(vin + 0.3, vin + 1.8, v)) : 0;
  }
  // Kreidestaub: einzelne Körnchen neben dem Strich, um die Innenkante; Zellen von 0,3 mm in (s, v), Deckung flächentreu
  function staubSeite(s, v, sc, o) {
    const cs = 0.3, rmax = 0.11, s0 = Math.floor((s - hpx - rmax) / cs), s1 = Math.floor((s + hpx + rmax) / cs), v0 = Math.floor((v - hpx - rmax) / cs), v1 = Math.floor((v + hpx + rmax) / cs);
    for (let is = s0; is <= s1; is++) {
      const vin = innen((is + 0.5) * cs);
      for (let iv = v0; iv <= v1; iv++) {
        const dv = (iv + 0.5) * cs - vin; if (dv < -3 || dv > 5) continue;
        if (hash(is, iv, S + 777) >= staubDichte) continue;
        const gs = (is + 0.25 + 0.5 * hash(is, iv, S + 778)) * cs, gv = (iv + 0.25 + 0.5 * hash(is, iv, S + 779)) * cs, rr = 0.886 * (0.05 + 0.06 * hash(is, iv, S + 780));
        const ox = Math.min(s + hpx, gs + rr) - Math.max(s - hpx, gs - rr); if (ox <= 0) continue;
        const oy = Math.min(v + hpx, gv + rr) - Math.max(v - hpx, gv - rr); if (oy <= 0) continue;
        const i = zuIdx(gs + sc - s + tabLesen(V, V.fensterTab, gs) * (umGlatt(hash(is, iv, S + 781)) - 0.5)); if (!FN[i] || hash(is, iv, S + 783) > 0.3 + 0.7 * FA[i]) continue;
        const a = (0.35 + 0.4 * hash(is, iv, S + 782)) * ox * oy / (4 * hpx * hpx);
        o[0] += (FR[i] + (WEISS[0] - FR[i]) * 0.2 - o[0]) * a; o[1] += (FG[i] + (WEISS[1] - FG[i]) * 0.2 - o[1]) * a; o[2] += (FB[i] + (WEISS[2] - FB[i]) * 0.2 - o[2]) * a;
      }
    }
  }
  const zahn = (X, Y) => 0.6 * fbm(X / 0.55, Y / 0.55, S + 5, 3) + 0.25 * fbm(X / 2.6, Y / 2.6, S + 9, 2)
    + 0.15 * (0.5 + 0.5 * Math.sin(Y * 2 * Math.PI / 0.9 + 2 * fbm(X / 8, Y, S + 11, 2)));      // Ingres: Rippung quer zur Seite
  function basis(X, Y, o) {
    const h = zahn(X, Y);
    seiten(X, Y); seite(SA, VA, CA, h, o1);
    if (ZWEI) { seite(SB, VB, CB, h, o2); for (let c = 0; c < 4; c++) o1[c] = o1[c] * WA + o2[c] * (1 - WA); }
    o[0] = o1[0]; o[1] = o1[1]; o[2] = o1[2]; o[3] = o1[3];
  }
  function staub(X, Y, o) { seiten(X, Y); if (ZWEI && WA < 0.5) staubSeite(SB, VB, CB, o); else staubSeite(SA, VA, CA, o); }
  return { basis, staub, wisch };
}

/* === Lage eines Streifens auf dem gemeinsamen Pixelraster (Ursprung oben links, Schritt 1/pxJeMm) ============================= */
function streifenLage(A) {
  const px = A.pxJeMm, NX = Math.max(1, Math.ceil(A.PW * px - 1e-9)), NY = Math.max(1, Math.ceil(A.PH * px - 1e-9));
  const ND = Math.max(0, Math.min(Math.round((A.tiefe + 4) * px), Math.floor(NY / 2), Math.floor(NX / 2)));
  switch (A.teil) {
    case 'oben': return { i0: 0, i1: NX, j0: 0, j1: ND };
    case 'unten': return { i0: 0, i1: NX, j0: NY - ND, j1: NY };
    /* links/rechts 1 px in oben/unten hinein: der Inhalt ist dort bitgleich, die Überlappung deckt die geglättete Stoßkante */
    case 'links': return { i0: 0, i1: ND, j0: Math.max(0, ND - 1), j1: Math.min(NY, NY - ND + 1) };
    case 'rechts': return { i0: NX - ND, i1: NX, j0: Math.max(0, ND - 1), j1: Math.min(NY, NY - ND + 1) };
    default: throw new Error(`rand.js: unbekannter Teil „${A.teil}" (oben, unten, links, rechts)`);
  }
}
function auftragPruefen(a) {
  const A = { luecke: true, saat: 1, pxJeMm: 2, ...a };
  if (!(A.PW > 0 && A.PH > 0 && A.tiefe > 0)) throw new Error('rand.js: PW, PH und tiefe müssen positiv sein');
  if (![...WEISEN.hell, ...WEISEN.dunkel].includes(A.weise)) throw new Error(`rand.js: unbekannte Weise „${A.weise}"`);
  if (!Array.isArray(A.grund) || A.grund.length < 3) throw new Error('rand.js: grund muss [r,g,b] sein');
  if (!(A.pxJeMm > 0)) throw new Error('rand.js: pxJeMm muss positiv sein');
  if (!Array.isArray(A.farben)) A.farben = [];
  A.luecke = A.luecke !== false;
  return A;
}

/* Malt das Rechteck [i0, i1) × [j0, j1) des gemeinsamen Pixelrasters. Verwischt: erst ein grobes Raster (0,5 mm, an der Seite
   ausgerichtet, mit Rand für die Unschärfe) aus derselben Punktfunktion, darauf eine trennbare Kastenunschärfe (dreimal je
   Richtung ≈ Gauß, σ = 3,2 mm·k) in ganzen Zahlen - so hängt kein Wert davon ab, wo der Streifen beginnt, und die Streifen
   bleiben auch hier bitgleich an den Grenzen. */
function malen(A, V, i0, i1, j0, j1, melde) {
  const px = A.pxJeMm, breite = Math.max(0, i1 - i0), hoehe = Math.max(0, j1 - j0), daten = new Uint8ClampedArray(breite * hoehe * 4);
  if (!breite || !hoehe) return daten;
  const M = baueMaler(V, px), o = new Float64Array(4);
  const gemeldet = { t: 0 };
  const zeileFertig = (j) => { if (melde) { const f = (j - j0 + 1) / hoehe; if (f - gemeldet.t >= 0.05 || f === 1) { gemeldet.t = f; melde(f); } } };
  if (typeof M === 'function') {
    for (let j = j0; j < j1; j++) {
      const Y = (j + 0.5) / px; let q = (j - j0) * breite * 4;
      for (let i = i0; i < i1; i++) { M((i + 0.5) / px, Y, o); daten[q] = o[0]; daten[q + 1] = o[1]; daten[q + 2] = o[2]; daten[q + 3] = 255; q += 4; }
      zeileFertig(j);
    }
    return daten;
  }
  // Kreide
  let grob = null, gc = 0.5, ci0 = 0, cj0 = 0, cw = 0, ch = 0;
  if (M.wisch) {
    const sig = V.Q.wisch * V.k / gc, rb = Math.max(1, Math.round((Math.sqrt(12 * sig * sig / 3 + 1) - 1) / 2)), rand = 3 * rb + 2;
    ci0 = Math.floor(i0 / px / gc) - rand; cj0 = Math.floor(j0 / px / gc) - rand;
    cw = Math.ceil(i1 / px / gc) + rand - ci0 + 1; ch = Math.ceil(j1 / px / gc) + rand - cj0 + 1;
    const kan = [new Float64Array(cw * ch), new Float64Array(cw * ch), new Float64Array(cw * ch)];
    for (let cj = 0; cj < ch; cj++) for (let ci = 0; ci < cw; ci++) {
      M.basis((ci0 + ci + 0.5) * gc, (cj0 + cj + 0.5) * gc, o);
      const n = cj * cw + ci; kan[0][n] = Math.round(o[0] * 16); kan[1][n] = Math.round(o[1] * 16); kan[2][n] = Math.round(o[2] * 16);
    }
    const tmp = new Float64Array(Math.max(cw, ch));
    for (const a of kan) {
      for (let pass = 0; pass < 3; pass++) {
        for (let cj = 0; cj < ch; cj++) {                      // waagrecht: laufende Summe in ganzen Zahlen (exakt)
          const z = cj * cw; let sum = 0;
          for (let m = -rb; m <= rb; m++) sum += a[z + Math.min(cw - 1, Math.max(0, m))];
          for (let ci = 0; ci < cw; ci++) { tmp[ci] = sum; sum += a[z + Math.min(cw - 1, ci + rb + 1)] - a[z + Math.max(0, ci - rb)]; }
          for (let ci = 0; ci < cw; ci++) a[z + ci] = tmp[ci];
        }
      }
      for (let pass = 0; pass < 3; pass++) {
        for (let ci = 0; ci < cw; ci++) {                      // senkrecht
          let sum = 0;
          for (let m = -rb; m <= rb; m++) sum += a[Math.min(ch - 1, Math.max(0, m)) * cw + ci];
          for (let cj = 0; cj < ch; cj++) { tmp[cj] = sum; sum += a[Math.min(ch - 1, cj + rb + 1) * cw + ci] - a[Math.max(0, cj - rb) * cw + ci]; }
          for (let cj = 0; cj < ch; cj++) a[cj * cw + ci] = tmp[cj];
        }
      }
      const teiler = 16 * Math.pow(2 * rb + 1, 6); for (let n = 0; n < a.length; n++) a[n] /= teiler;
    }
    grob = kan;
  }
  for (let j = j0; j < j1; j++) {
    const Y = (j + 0.5) / px; let q = (j - j0) * breite * 4;
    for (let i = i0; i < i1; i++) {
      const X = (i + 0.5) / px; M.basis(X, Y, o);
      if (grob && o[3] > 0) {                                    // mit dem Finger verrieben: weich neben körnig
        let fx = X / gc - 0.5 - ci0, fy = Y / gc - 0.5 - cj0; const ix = Math.floor(fx), iy = Math.floor(fy); fx -= ix; fy -= iy;
        const n = iy * cw + ix, m = o[3];
        for (let c = 0; c < 3; c++) { const g = grob[c], w = (g[n] * (1 - fx) + g[n + 1] * fx) * (1 - fy) + (g[n + cw] * (1 - fx) + g[n + cw + 1] * fx) * fy;
          o[c] = o[c] * (1 - m) + Math.max(o[c] * 0.6, w * 1.05) * m; }
      }
      M.staub(X, Y, o);
      daten[q] = o[0]; daten[q + 1] = o[1]; daten[q + 2] = o[2]; daten[q + 3] = 255; q += 4;
    }
    zeileFertig(j);
  }
  return daten;
}

/* Ein Streifen des Rands. a = { PW, PH, tiefe, luecke, farben, grund, weise, saat, pxJeMm, teil } (siehe Kopf); optional
   a.melde(f) für den Fortschritt 0..1 innerhalb des Streifens. Rückgabe: Lage in mm, Größe in px, RGBA deckend. */
export function randStreifen(a) {
  const A = auftragPruefen(a), V = vorbereitung(A), { i0, i1, j0, j1 } = streifenLage(A), px = A.pxJeMm;
  const daten = malen(A, V, i0, i1, j0, j1, typeof a.melde === 'function' ? a.melde : null);
  return { teil: A.teil, x: i0 / px, y: j0 / px, w: Math.max(0, i1 - i0) / px, h: Math.max(0, j1 - j0) / px, breite: Math.max(0, i1 - i0), hoehe: Math.max(0, j1 - j0), daten };
}
/* Für Prüfung und Nahaufnahmen: ein beliebiges Rechteck des Pixelrasters (in px ab der Seitenecke oben links), mit derselben
   Rechnung wie die Streifen - wo es sich mit einem Streifen deckt, ist es bitgleich. */
export function randBereich(a, { i0, i1, j0, j1 }) {
  const A = auftragPruefen({ teil: 'oben', ...a }), V = vorbereitung(A);
  return { breite: i1 - i0, hoehe: j1 - j0, daten: malen(A, V, i0, i1, j0, j1, null) };
}
