/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* DIE BILDERSCHAU (Caspar_D, 11.10.2026: „eine Darstellung, die die Coverarts als Vierecke belässt,
   also keine angepassten Shapes aus Treemaps … eine Art Gemäldewand, die Größe der Bilder wieder in
   Abhängigkeit von den Parametern, wie sie auch im Klangschaum benutzt werden").

   Nur die Geometrie, ohne DOM: jedes Cover behaelt sein Originalformat (Seitenverhaeltnis des
   Titelbilds), seine FLAECHE ist proportional zum Wert - zum Mass des Klangschaums, wahlweise durch
   eine Skalentransformation gedaempft (Caspar_D: „Fläche ist das Bezugssystem, nicht Breite").
   Darunter klein der Titel wie ein Museumsschild („keine Titelbeschriftung auf dem Cover, sondern
   nur klein darunter"); bei Bildern, die schmaler sind als ein lesbares Schild, faellt es weg.

   Gehaengt wird in Arealen: ein Schaum (foamtree, nur die oberste Ebene) teilt die Wand in je ein Areal
   je Gruppe, dicht an dicht; darin haengt EINE Salonhaengung ueber die ganze Wand (siehe unten).
   Ein gemeinsamer Massstab gilt fuer alle Bilder (sonst waeren die Flaechen zwischen den Gruppen nicht
   vergleichbar); er wird so gross gesucht, wie die Wand es zulaesst. Die Wand bleibt zwischen den
   Bildern sichtbar - der Preis dafuer, dass die Formen echt bleiben.
   Erst gab es je Gruppe einen rechteckigen Wandabschnitt mit eigener Salonhaengung (Caspar_D: „diese
   4 Ellipsen sehen komisch aus") - ersetzt, nicht stehen gelassen. */

export const TRANSFORMATIONEN = [
  { id: 'keine', name: 'keine (flächentreu)', f: v => v, kurz: 'Fläche ∝ Wert' },
  { id: 'wurzel', name: 'Wurzel', f: v => Math.sqrt(v), kurz: 'Fläche ∝ √Wert' },
  { id: 'kubik', name: 'Kubikwurzel', f: v => Math.cbrt(v), kurz: 'Fläche ∝ ∛Wert' },
  { id: 'log', name: 'Logarithmus', f: v => Math.log1p(v), kurz: 'Fläche ∝ log(1 + Wert)' },
];

/* ---- EINE HAENGUNG IN SCHAUM-AREALEN (Caspar_D, 11.10.2026: „mache eine Schaumtreemap für die
   Arealbestimmung der Gruppen und dann hängst du sie dicht an dicht, aber in jedes Areal hängst du die
   Bilder, die zu dieser Gruppe gehören, also nicht 4 Salonhängungen, sondern eine … Die Bilder dürfen
   sich trotzdem nahe zueinander befinden, nur die Masse des Bildes muss in seinem Areal hängen").
   Die Areale kommen von aussen (foamtree, nur die oberste Ebene, in Bildschirmkoordinaten). Gehaengt
   wird einmal ueber die ganze Wand, groesste Bilder zuerst; jedes an die freie Stelle neben einem schon
   haengenden Bild, deren Mittelpunkt in seinem Areal liegt - im Salon moeglichst nah an der Mitte der
   WAND (Caspar_D: „die Bildschirmmitte ist gemeint, dort die großen, nur wenn es nicht anders geht,
   dann abweichen"): die grossen sammeln sich dort, und eine Gruppe, deren Areal die Mitte nicht
   beruehrt, haengt ihre grossen an den Rand ihres Areals, der der Mitte am naechsten ist. Dicht: von
   oben links nach unten rechts. Die Gruppenschilder
   stehen oben in ihrem Areal und sind fuer Bilder gesperrt. */
const wachsen = (a, n) => { const b = new Float64Array(n); b.set(a); return b; };
const drin = (ps, x, y) => { let c = false;
  for (let k = 0, j = ps.length - 1; k < ps.length; j = k++){ const a = ps[k], b = ps[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; }
  return c; };
const mitteVon = (ps) => { let a = 0, cx = 0, cy = 0;
  for (let k = 0; k < ps.length; k++){ const p = ps[k], q = ps[(k + 1) % ps.length], c = p[0] * q[1] - q[0] * p[1]; a += c; cx += (p[0] + q[0]) * c; cy += (p[1] + q[1]) * c; }
  return a ? [cx / (3 * a), cy / (3 * a)] : ps[0]; };
/* Wo die waagrechte Linie y das Areal schneidet: Paare [von, bis] */
const sehnen = (ps, y) => { const xs = [];
  for (let k = 0, j = ps.length - 1; k < ps.length; j = k++){ const a = ps[k], b = ps[j];
    if ((a[1] > y) !== (b[1] > y)) xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1])); }
  xs.sort((a, b) => a - b); const r = []; for (let i = 0; i + 1 < xs.length; i += 2) r.push([xs[i], xs[i + 1]]); return r; };
/* Platz fuer ein Schild der Breite w und Hoehe h, so weit oben wie moeglich, waagrecht zur Mitte hin */
function schildPlatz(ps, w, h, mx){
  let y0 = Infinity, y1 = -Infinity; for (const p of ps){ y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = y0 + 4; y + h < y1; y += 2){
    const a = sehnen(ps, y + 0.5), b = sehnen(ps, y + h - 0.5), c = sehnen(ps, y + h / 2);
    for (const [l, r] of a){
      const lo = Math.max(l, ...b.filter(s => s[1] > l && s[0] < r).map(s => s[0]), ...c.filter(s => s[1] > l && s[0] < r).map(s => s[0])) + 6;
      const hi = Math.min(r, ...b.filter(s => s[1] > l && s[0] < r).map(s => s[1]), ...c.filter(s => s[1] > l && s[0] < r).map(s => s[1])) - 6;
      if (hi - lo >= w) return { x: Math.min(hi - w, Math.max(lo, mx - w / 2)), y, w, h };
    }
  }
  return null;
}

/* areale: [{ name, poly }] in Bildschirmkoordinaten (y nach unten). o wie bei haengen, dazu
   o.kopfBreite(name) -> Breite des Gruppenschilds in Punkten. */
export function haengenInArealen(gruppen, W, H, areale, o = {}){
  const schild = o.schild ?? 15, schildMin = o.schildMin ?? 44, kopf = o.kopf ?? 22, rand = o.rand ?? 8, salon = !!o.salon;
  const kontakt = o.kontakt ?? 0.15, KONTAKT_N = 30;
  const rahmenBei = (A) => o.rahmen ? Math.max(1.5, Math.min(6, 0.03 * Math.sqrt(A))) : 0;
  const areal = new Map(areale.map(a => [a.name, { poly: a.poly, mitte: mitteVon(a.poly),
    box: a.poly.reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [Infinity, Infinity, -Infinity, -Infinity]) }]));
  /* je Areal der Punkt, der der Wandmitte am naechsten liegt, ein Zehntel des Wegs zur Arealmitte nach innen */
  for (const ar of areal.values()){
    let best = null, d = Infinity;
    const ps = ar.poly;
    for (let k = 0; k < ps.length; k++){ const a = ps[k], b = ps[(k + 1) % ps.length], ex = b[0] - a[0], ey = b[1] - a[1], l2 = ex * ex + ey * ey || 1;
      const t = Math.max(0, Math.min(1, ((W / 2 - a[0]) * ex + (H / 2 - a[1]) * ey) / l2)), x = a[0] + t * ex, y = a[1] + t * ey, dd = Math.hypot(x - W / 2, y - H / 2);
      if (dd < d){ d = dd; best = [x, y]; } }
    ar.nah = drin(ps, W / 2, H / 2) ? [W / 2, H / 2] : [best[0] + 0.1 * (ar.mitte[0] - best[0]), best[1] + 0.1 * (ar.mitte[1] - best[1])];
  }
  /* Die Areale einmal gerastert (je Bildpunkt die Nummer seines Areals, Zeile fuer Zeile aus den Sehnen) - die Umrisse
     haben rund 400 Ecken, und der Schwerpunkttest laeuft fuer Zehntausende Kandidaten */
  const GW = Math.ceil(W), GH = Math.ceil(H), raster = new Uint8Array(GW * GH);
  [...areal.values()].forEach((ar, i) => { ar.nr = i + 1;
    for (let y = Math.max(0, Math.floor(ar.box[1])); y < Math.min(GH, Math.ceil(ar.box[3])); y++)
      for (const [l, r] of sehnen(ar.poly, y + 0.5))
        raster.fill(i + 1, y * GW + Math.max(0, Math.round(l)), y * GW + Math.min(GW, Math.round(r))); });
  const imAreal = (ar, x, y) => x >= 0 && y >= 0 && x < GW && y < GH && raster[(y | 0) * GW + (x | 0)] === ar.nr;
  const alle = [];
  for (const g of gruppen) if (areal.has(g.name)) for (const b of g.bilder) alle.push({ ...b, gruppe: g.name });
  alle.sort((a, b) => b.wert - a.wert);
  const summe = alle.reduce((s, b) => s + b.wert, 0);
  if (!summe) return null;
  /* Gruppenschilder: feste Sperrflaechen */
  const schilder = [];
  if (kopf > 0) for (const a of areale){ const ar = areal.get(a.name);
    const p = schildPlatz(a.poly, (o.kopfBreite ? o.kopfBreite(a.name) : 8 * a.name.length) + 4, kopf - 4, ar.mitte[0]);
    if (p) schilder.push({ name: a.name, ...p }); }
  const mitte = alle[alle.length >> 1].wert;
  let fehl = null, grenzeBei = null;                       /* die Gruppe, die keinen Platz mehr fand */
  const versuch = (s) => {
    const luft = o.luft ?? Math.max(3, Math.min(12, Math.sqrt(s * mitte) / 7));
    /* Raster fuer die Ueberlappungspruefung */
    const zelle = Math.max(8, Math.sqrt(s * alle[0].wert)), netz = new Map();
    const schluessel = (i, j) => i * 100003 + j;
    const eintragen = (r) => { for (let i = Math.floor(r.x / zelle); i <= Math.floor((r.x + r.w) / zelle); i++)
      for (let j = Math.floor(r.y / zelle); j <= Math.floor((r.y + r.h) / zelle); j++){ const k = schluessel(i, j); if (!netz.has(k)) netz.set(k, []); netz.get(k).push(r); } };
    const frei = (x, y, w, h) => {
      if (x < rand || y < rand || x + w > W - rand || y + h > H - rand) return false;
      for (let i = Math.floor((x - luft) / zelle); i <= Math.floor((x + w + luft) / zelle); i++)
        for (let j = Math.floor((y - luft) / zelle); j <= Math.floor((y + h + luft) / zelle); j++){
          const l = netz.get(schluessel(i, j)); if (!l) continue;
          for (const p of l) if (x < p.x + p.w + luft && p.x < x + w + luft && y < p.y + p.h + luft && p.y < y + h + luft) return false; }
      return true; };
    /* Wie lang ein Rechteck an Nachbarn anliegt (Abstand genau die Luft, Toleranz ein Punkt) */
    const anliegen = (x, y, w, h) => { let L = 0; const t = luft + 1, gesehen = new Set();
      for (let i = Math.floor((x - t) / zelle); i <= Math.floor((x + w + t) / zelle); i++)
        for (let j = Math.floor((y - t) / zelle); j <= Math.floor((y + h + t) / zelle); j++){
          const l = netz.get(schluessel(i, j)); if (!l) continue;
          for (const p of l){ if (gesehen.has(p)) continue; gesehen.add(p);
            const oy = Math.min(y + h, p.y + p.h) - Math.max(y, p.y), ox = Math.min(x + w, p.x + p.w) - Math.max(x, p.x);
            if (oy > 0 && (Math.abs(p.x + p.w + luft - x) < 1 || Math.abs(x + w + luft - p.x) < 1)) L += oy;
            if (ox > 0 && (Math.abs(p.y + p.h + luft - y) < 1 || Math.abs(y + h + luft - p.y) < 1)) L += ox; } }
      return L; };
    for (const sc of schilder) eintragen(sc);
    const gelegt = [], lage = [];
    let kx = new Float64Array(4096), ky = new Float64Array(4096), kk = new Float64Array(4096), heapIdx = new Uint32Array(4096);
    for (const b of alle){
      const A = s * b.wert, bw = Math.sqrt(A * b.verh), bh = A / bw, r = rahmenBei(A), mit = schild > 0 && bw >= schildMin;
      const w = bw + 2 * r, h = bh + 2 * r + (mit ? schild : 0), ar = areal.get(b.gruppe), [mx, my] = ar.mitte;
      /* Kandidaten: die Wandmitte, der Punkt des Areals, der ihr am naechsten liegt (ein Stueck nach innen), die Mitte des
         Areals, und je schon haengendes Bild in der Naehe zwoelf Stellen rundherum (buendig oben/unten/mittig bzw. links/
         rechts/mittig). Was nicht auf die Wand passt oder seinen Schwerpunkt nicht im Areal hat, faellt gleich heraus;
         die uebrigen kommen in einen Heap nach Kosten, und nur so viele werden geprueft, bis eine Stelle frei ist. */
      const bx = ar.box; let k = 0;
      const dazu = (x, y) => {
        if (x < rand || y < rand || x + w > W - rand || y + h > H - rand) return;
        const cx = x + w / 2, cy = y + r + bh / 2;                                   /* Schwerpunkt des Bildes, ohne Schild */
        if (!imAreal(ar, cx, cy)) return;
        /* Abstand zur Wandmitte, auf das Wandformat bezogen: waechst als Rechteck mit runden Ecken, die Ecken bleiben nicht leer */
        const ex = Math.abs(cx - W / 2) / W, ey = Math.abs(cy - H / 2) / H;
        if (k >= kx.length){ const n = k * 2; kx = wachsen(kx, n); ky = wachsen(ky, n); kk = wachsen(kk, n); }
        kx[k] = x; ky[k] = y;
        kk[k++] = salon ? Math.max(ex, ey) + 0.35 * Math.hypot(ex, ey) : (cy - h / 2) * 4 + (cx - w / 2) * 0.05 + Math.hypot(cx - mx, cy - my) * 0.2;
      };
      dazu(W / 2 - w / 2, H / 2 - h / 2); dazu(ar.nah[0] - w / 2, ar.nah[1] - h / 2); dazu(mx - w / 2, my - h / 2);
      for (const p of gelegt){
        if (p.x > bx[2] + luft || p.x + p.w < bx[0] - w - luft || p.y > bx[3] + luft || p.y + p.h < bx[1] - h - luft) continue;   /* zu weit vom Areal */
        const rechts = p.x + p.w + luft, links = p.x - luft - w, unten = p.y + p.h + luft, oben = p.y - luft - h;
        const y1 = p.y, y2 = p.y + p.h - h, y3 = p.y + (p.h - h) / 2, x1 = p.x, x2 = p.x + p.w - w, x3 = p.x + (p.w - w) / 2;
        dazu(rechts, y1); dazu(rechts, y2); dazu(rechts, y3); dazu(links, y1); dazu(links, y2); dazu(links, y3);
        dazu(x1, unten); dazu(x2, unten); dazu(x3, unten); dazu(x1, oben); dazu(x2, oben); dazu(x3, oben);
      }
      /* Heap ueber die Indizes, kleinste Kosten oben */
      const hp = heapIdx.length >= k ? heapIdx : (heapIdx = new Uint32Array(k * 2));
      for (let t = 0; t < k; t++) hp[t] = t;
      const sinken = (t, n) => { for (;;){ let m = t; const l = 2 * t + 1, rr = l + 1;
        if (l < n && kk[hp[l]] < kk[hp[m]]) m = l; if (rr < n && kk[hp[rr]] < kk[hp[m]]) m = rr;
        if (m === t) return; const z = hp[t]; hp[t] = hp[m]; hp[m] = z; t = m; } };
      for (let t = (k >> 1) - 1; t >= 0; t--) sinken(t, k);
      let q = null, n = k;
      /* KEIN LEERRAUM INNEN (Caspar_D, 11.10.2026: „innen darf kein negativ space erscheinen"): nicht die erste freie
         Stelle nach Kosten, sondern unter den besten freien die, an der das Bild auf der groessten Laenge an schon
         haengenden Bildern anliegt (Kontaktregel der Rechteckpackung) - so fuellen sich Nischen, bevor neue entstehen.
         Das Raster rundet auf Bildpunkte: jede Stelle wird zuletzt noch genau am Umriss geprueft. */
      let besteWert = Infinity, gesehen = 0;
      while (n > 0 && gesehen < KONTAKT_N){ const j = hp[0];
        if (frei(kx[j], ky[j], w, h) && drin(ar.poly, kx[j] + w / 2, ky[j] + r + bh / 2)){
          gesehen++;
          const wert = kk[j] - kontakt * anliegen(kx[j], ky[j], w, h) / (2 * (w + h));
          if (wert < besteWert){ besteWert = wert; q = { x: kx[j], y: ky[j], w, h }; }
          if (!kontakt) break; }
        hp[0] = hp[--n]; sinken(0, n); }
      if (!q){ fehl = b.gruppe; return null; }
      gelegt.push(q); eintragen(q);
      lage.push({ ...b, x: q.x + r, y: q.y + r, w: bw, h: bh, rahmen: r, schild: mit ? schild : 0, block: q });
    }
    lage.luft = luft;
    return lage;
  };
  /* VERDICHTEN (Caspar_D, 11.10.2026: „innen darf kein negativ space erscheinen"). Nebeneinander haengende Bilder sind
     verschieden hoch; darueber bleiben Spalten, in die kein Bild mehr passt. Darum rueckt nach dem Haengen jedes Bild so
     weit zur Wandmitte nach, wie es frei ist - senkrecht, dann waagrecht, im Wechsel, die mittenahen zuerst. Der
     Schwerpunkt bleibt in seinem Areal, kein Bild wird groesser oder kleiner; freie Wand bleibt nur aussen. */
  const verdichten = (lage) => {
    const luft = lage.luft, B = lage.map(b => b.block), feste = schilder;
    const im = (i, x, y) => { const b = lage[i]; return drin(areal.get(b.gruppe).poly, x + b.block.w / 2, y + b.rahmen + b.h / 2); };
    for (let runde = 0; runde < 8; runde++){
      const senk = runde % 2 === 0;
      const reihe = B.map((q, i) => i).sort((i, j) => (senk ? Math.abs(B[i].y + B[i].h / 2 - H / 2) - Math.abs(B[j].y + B[j].h / 2 - H / 2)
                                                          : Math.abs(B[i].x + B[i].w / 2 - W / 2) - Math.abs(B[j].x + B[j].w / 2 - W / 2)));
      let bewegt = 0;
      for (const i of reihe){
        const q = B[i], mitte = senk ? q.y + q.h / 2 - H / 2 : q.x + q.w / 2 - W / 2;
        if (Math.abs(mitte) < 0.5) continue;
        const dir = mitte > 0 ? -1 : 1;
        let frei = Math.abs(mitte);                                    /* hoechstens bis zur Mittellinie */
        const sperre = (p) => {
          if (senk){ if (p.x >= q.x + q.w + luft || q.x >= p.x + p.w + luft) return;
            const d = dir < 0 ? q.y - (p.y + p.h + luft) : p.y - (q.y + q.h + luft); if (d >= -0.01) frei = Math.min(frei, d); }
          else { if (p.y >= q.y + q.h + luft || q.y >= p.y + p.h + luft) return;
            const d = dir < 0 ? q.x - (p.x + p.w + luft) : p.x - (q.x + q.w + luft); if (d >= -0.01) frei = Math.min(frei, d); } };
        for (const p of B) if (p !== q) sperre(p);
        for (const p of feste) sperre(p);
        if (frei < 0.5) continue;
        /* im Areal bleiben: den Weg halbieren, bis der Schwerpunkt drin liegt */
        let d = frei;
        while (d >= 0.5 && !(senk ? im(i, q.x, q.y + dir * d) : im(i, q.x + dir * d, q.y))) d /= 2;
        if (d < 0.5) continue;
        if (senk) q.y += dir * d; else q.x += dir * d;
        bewegt++;
      }
      if (!bewegt) break;
    }
    for (const b of lage){ b.x = b.block.x + b.rahmen; b.y = b.block.y + b.rahmen; delete b.block; }
    return lage;
  };
  let unten = o.vorher ? o.vorher / 1.6 : 0.01 * W * H / summe, oben = o.vorher ? o.vorher * 1.6 : 0.9 * W * H / summe, best = null, bestS = unten;
  for (let k = 0; k < 16 && oben / unten > 1.02; k++){
    const s = Math.sqrt(unten * oben), v = versuch(s);
    if (v){ best = v; bestS = s; unten = s; } else { oben = s; grenzeBei = fehl; }
  }
  if (!best && o.vorher) return haengenInArealen(gruppen, W, H, areale, { ...o, vorher: null });
  if (!best) return null;
  if (o.verdichten !== false) verdichten(best); else for (const b of best) delete b.block;
  return { W, H, massstab: bestS, grenze: grenzeBei, bilder: best, schilder, areale, belegt: best.reduce((s, b) => s + b.w * b.h, 0) / (W * H) };
}

/* Areale und Haengung zusammen: legeAreale(gewichte: Map Name -> Gewicht) -> [{ name, poly }]. Erst nach der Summe der
   Werte, dann nach dem Platz, den jede Gruppe wirklich braucht; die Gruppe, die den Massstab begrenzt (in ihrem Areal
   keinen Platz mehr fand), bekommt dazu jede Runde ein Viertel mehr. Die beste Runde gilt. */
export function haengenMitSchaum(gruppen, W, H, legeAreale, o = {}){
  let gew = new Map(gruppen.map(g => [g.name, g.bilder.reduce((a, b) => a + b.wert, 0)])), best = null, s = null;
  const extra = new Map(gruppen.map(g => [g.name, 1]));
  for (let runde = 0; runde < (o.runden ?? 6); runde++){
    const areale = legeAreale(gew);
    const v = haengenInArealen(gruppen, W, H, areale, { ...o, vorher: s });
    if (!v) break;
    if (!best || v.massstab > best.massstab) best = v;
    s = v.massstab;
    if (v.grenze) extra.set(v.grenze, extra.get(v.grenze) * 1.25);
    const bedarf = new Map(gruppen.map(g => [g.name, 0]));
    for (const b of v.bilder) bedarf.set(b.gruppe, bedarf.get(b.gruppe) + (b.w + 2 * b.rahmen + 8) * (b.h + 2 * b.rahmen + b.schild + 8));
    for (const sc of v.schilder) bedarf.set(sc.name, bedarf.get(sc.name) + sc.w * sc.h);
    gew = new Map([...bedarf].map(([n, x]) => [n, x * extra.get(n)]));
  }
  return best;
}
