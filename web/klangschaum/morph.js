/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   DER MORPH ALS SCHAUM (Caspar_D, 06.10.2026: „die Linienknoten dürfen sich bewegen, die Füllung
   bleibt gefüllt, keine Lücken"; „momentan ist jede Zelle wie ein Ball, nicht wie eine Blase -
   zwischen Blasen entstehen auch keine Lücken").
   Der erste Morph schob jede Zelle fuer sich von alter zu neuer Form; gemeinsame Waende liefen
   auseinander, es klafften Luecken. Jetzt ist jedes Zwischenbild ein ganzes Netz: je Gefaess ein
   Leistungsdiagramm (powerCells aus Caspar_Ds foamtree), dessen Gewichte die Rolle der Druecke
   spielen. An beiden Enden werden sie einmal geloest (ccvt bei festen Zentren = Mitten der
   Schaumzellen, maxOuter 0); dazwischen gleiten Zentren und Gewichte linear, und jedes Bild zerlegt
   sein Gefaess lueckenlos. Zentren und Gewichte stehen relativ zum Gefaess (Mitte, Wurzel der
   Flaeche) - so wandern die Zellen mit ihrem Gefaess, und ein Gefaess, das nur an einem Ende da
   ist, waechst samt Innenleben aus einem Punkt oder schrumpft hinein. Eine Zelle, die nur an einem
   Ende da ist, bekommt am anderen ein Gewicht knapp unter dem Verschwinden und waechst an ihrem
   Platz heraus oder schrumpft dort hinein. Die Waende sind waehrend des Gleitens gerade (das
   Diagramm, aus dem die Engine den Schaum biegt); die gebogenen kommen mit den Bildern zurueck.
   Gemessen an 351 Zellen in einem Gefaess: beide Enden loesen 0,1 s, ein Bild 5 ms. Der Plan (mit den
   Stuetzbildern unten, am Klangschaum rund 0,3 s) laeuft im Worker morph-worker.js.
   Koordinaten wie in der Engine: y nach oben. */
import { powerCells, ccvt, centroid, shoelace } from './foamtree.js';

const flaeche = (p) => Math.abs(shoelace(p));
/* ccvt und powerCells brauchen vom Gefaess nur Punkte und Flaeche; makeContainer rechnete dazu
   Richtungen je Kante, die an den doppelten Punkten eines Diagramms durch null teilten. */
const gefaess = (u) => ({ pts: u, area: flaeche(u) });
/* Stuetzbilder (siehe morphPlan) */
const STUETZEN = 4;

/* Das Netz eines gelegten Baums als schlichte Daten. Schluessel: ein Gefaess heisst nach seinen
   Namen von der Wurzel her, eine Zelle nach ihrer Kennung (Titel- oder Personen-ID) - so findet der
   Morph dieselbe Zelle in zwei Massen wieder, auch wenn ihre Zeilennummer eine andere ist. */
/* Gefunden von der Codepruefung (06.10.2026) und hier abgefangen, obwohl es im KlangTresor heute nicht
   vorkommt: ein Gefaess, dessen Kinder ohne Umriss blieben (Zeitbudget, Stufenlegen), bleibt als
   Platzhalter-Zelle stehen - sonst blaehten sich seine Geschwister auf; ein Buendel „n small" heisst
   fest, sonst wechselte mit der Mitgliederzahl sein Name und jeder Titel stuende doppelt im Bild; eine
   Kennung, die unter einem Gefaess zweimal vorkommt, wird durchnummeriert. Wechselt eine Zelle ihr
   Gefaess (andere Gliederung), gibt es keinen Morph ueber die Grenze - sie schrumpft im alten und waechst
   im neuen; das Haus morpht darum nur innerhalb derselben Gliederung (schaumForm). */
export function morphNetz(res, kennung, farbe){
  const knoten = (n, key, tiefe) => {
    const kids = (n.shown || [...(n.kids ? n.kids.values() : [])]).filter(k => k.outline && k.outline.length > 2);
    if (!kids.length){
      if (!n.outline || n.outline.length < 3) return null;
      const id = kennung(n);
      if (id == null) return tiefe >= 0 ? { key: 'g\u0000' + key, umriss: n.outline, tiefe, blatt: true, farbe: farbe(n) } : null;
      return { key: 'z\u0000' + id, umriss: n.outline, tiefe, blatt: true, farbe: farbe(n) };
    }
    const gesehen = new Map();
    const kinder = kids.map(k => knoten(k, (key ? key + '\u0001' : '') + (k.small ? '\u0002small' : (k.key ?? k.name)), tiefe + 1)).filter(Boolean)
      .map(c => { const n = gesehen.get(c.key) || 0; gesehen.set(c.key, n + 1); return n ? { ...c, key: c.key + '\u0000' + n } : c; });
    return kinder.length ? { key, umriss: n.outline, tiefe, blatt: false, kinder } : null;
  };
  const W = res.width, H = res.height;
  return { W, H, wurzel: knoten({ ...res.root, outline: [[0, 0], [W, 0], [W, H], [0, H]] }, '', -1) };
}

/* Zentren und Gewichte der Kinder eines Gefaesses an einem Ende, relativ zum Gefaess. Geloest wird
   in dem Gefaess, das der Morph an diesem Ende zeichnet (gerade Waende, von oben her), nicht im
   gebogenen Schaum-Umriss - sonst wich das erste Bild schon um einige Prozent je Ebene vom Schaum
   ab, und kleine Zellen fehlten. Ziel sind die Flaechen der Schaumzellen; Startzentren ihre Mitten.
   Zurueck kommen auch die Zellen selbst: sie sind die Gefaesse der naechsten Ebene. */
function ende(v, umriss){
  const da = v.kinder, A = flaeche(umriss), m = centroid(umriss), s = Math.sqrt(A), rel = new Map(), zellen = new Map();
  const fl = da.map(k => flaeche(k.umriss)), summe = fl.reduce((a, b) => a + b, 0) || 1, anteil = new Map(da.map((k, i) => [k.key, fl[i] / summe]));
  if (da.length === 1){
    rel.set(da[0].key, { s: [0, 0], w: 0 }); zellen.set(da[0].key, umriss);
    return { rel, zellen, anteil };
  }
  const r = ccvt(gefaess(umriss), fl.map(f => f / summe * A), { maxOuter: 0, sites0: da.map(k => centroid(k.umriss)) });
  da.forEach((k, i) => {
    rel.set(k.key, { s: [(r.sites[i][0] - m[0]) / s, (r.sites[i][1] - m[1]) / s], w: r.w[i] / A });
    if (r.cells[i].length > 2) zellen.set(k.key, r.cells[i].map(q => q.p));
  });
  return { rel, zellen, anteil };
}
/* Gewicht, bei dem eine Zelle am Ort s gerade verschwindet - erster Wurf: sie verliert schon an
   ihrem eigenen Zentrum gegen den staerksten Nachbarn. Das reicht nicht immer: hinter ihrem Zentrum
   gehoert ihr eine Halbebene, und am Gefaessrand blieb ihr ein Streifen (gesehen: ein Genre mit
   zwei Titeln, von denen einer geht). leeren() senkt das Gewicht darum, bis die Zelle im Gefaess
   wirklich leer ist - in Vierfach-Schritten, so bleibt es knapp, und sie waechst frueh heraus. */
function knapp(rel, s){
  let w = -Infinity;           /* der staerkste Nachbar (vorher irrtuemlich der schwaechste: die Zelle
                                  fing so tief an, dass sie nach ein, zwei Bildern weg war statt zu schrumpfen) */
  for (const r of rel.values()) w = Math.max(w, r.w - ((s[0] - r.s[0]) ** 2 + (s[1] - r.s[1]) ** 2));
  return (isFinite(w) ? w : 0) - 1e-4;
}
/* Sitzt eine kommende oder gehende Zelle genau auf dem Zentrum einer anwesenden (ein Genre tauscht
   seinen einzigen Titel), teilen beide das Gefaess nicht - beide bekaemen es ganz. Dann ruecken
   Kommende und Gehende ein Viertel des Gefaesses zur Seite, in entgegengesetzte Richtungen. */
function freiruecken(rel, s, richtung){
  for (const r of rel.values()) if (Math.hypot(s[0] - r.s[0], s[1] - r.s[1]) < 1e-6) return [s[0] + 0.25 * richtung, s[1]];
  return s;
}
function leeren(umriss, par, j, fehlt){
  if (!fehlt.some(Boolean)) return;
  const A = flaeche(umriss), m = centroid(umriss), s = Math.sqrt(A);
  for (let runde = 0; runde < 40; runde++){
    const zellen = powerCells({ pts: umriss }, par.map(p => [m[0] + p[j].s[0] * s, m[1] + p[j].s[1] * s]), par.map(p => p[j].w * A));
    let leer = true;
    par.forEach((p, i) => {
      if (fehlt[i] && zellen[i].length > 2 && flaeche(zellen[i].map(q => q.p)) > 1e-9 * A){ leer = false; p[j] = { s: p[j].s, w: p[j].w - 1e-4 * 4 ** runde }; }
    });
    if (leer) return;
  }
}

/* Der Plan fuer einen Wechsel: der vereinigte Baum beider Enden, je Gefaess die Parameter seiner
   Kinder an beiden Enden. */
export function morphPlan(alt, neu){
  /* ua, ub: das Gefaess, wie der Morph es an den Enden zeichnet (null: dort nicht da oder leer) */
  const plan = (a, b, ua, ub) => {
    const v = a || b;
    if (a && !ua) a = null;
    if (b && !ub) b = null;
    const ka = new Map(((a && a.kinder) || []).map(k => [k.key, k])), kb = new Map(((b && b.kinder) || []).map(k => [k.key, k]));
    if (!ka.size && !kb.size) return { key: v.key, tiefe: v.tiefe, blatt: true, farbeA: (a || v).farbe, farbeB: (b || v).farbe };
    const keys = [...ka.keys(), ...[...kb.keys()].filter(k => !ka.has(k))];
    const ea = ka.size ? ende(a, ua) : null, eb = kb.size ? ende(b, ub) : null;
    const A = (ea || eb).rel, B = (eb || ea).rel;
    const par = keys.map(k => {
      const pa = A.get(k), pb = B.get(k);
      if (!pa){ const s = freiruecken(A, pb.s, 1); return [{ s, w: knapp(A, s) }, pb]; }
      if (!pb){ const s = freiruecken(B, pa.s, -1); return [pa, { s, w: knapp(B, s) }]; }
      return [pa, pb];
    });
    if (ea) leeren(ua, par, 0, keys.map(k => !A.has(k)));
    if (eb) leeren(ub, par, 1, keys.map(k => !B.has(k)));
    const qa = (ea || eb).anteil, qb = (eb || ea).anteil;
    const kf = new Array(STUETZEN + 1); kf[0] = par.map(p => p[0]); kf[STUETZEN] = par.map(p => p[1]);
    return { key: v.key, tiefe: v.tiefe, blatt: false, kf, anteile: keys.map(k => [qa.get(k) || 0, qb.get(k) || 0]),
      kinder: keys.map(k => plan(ka.get(k) || null, kb.get(k) || null, ea && ea.zellen.get(k) || null, eb && eb.zellen.get(k) || null)) };
  };
  const rahmen = (n) => [[0, 0], [n.W, 0], [n.W, n.H], [0, n.H]];
  if (!alt.wurzel && !neu.wurzel) return { W: neu.W, H: neu.H, wurzel: null };
  /* beide Enden im Rahmen, den der Morph zeichnet (bei anderem Seitenverhaeltnis stimmten sonst die
     Anteile im ersten Bild nicht) */
  const wurzel = plan(alt.wurzel, neu.wurzel, rahmen(neu), rahmen(neu));
  for (let k = 1; k < STUETZEN; k++) stuetze(wurzel, rahmen(neu), k);
  return { W: neu.W, H: neu.H, wurzel };
}
/* STUETZBILDER. Gleiten die Druecke nur linear von Ende zu Ende, verschwindet unterwegs manche Blase,
   die an beiden Enden da ist - eine Zelle, deren Druck langsamer steigt als der ihrer Nachbarn, wird
   zugedrueckt (gefunden vom Zufallspruefer). Darum werden die Druecke auch an Zwischenstellen geloest,
   so dass dort jede Zelle genau ihre Zwischenflaeche hat (Anteil linear zwischen alt und neu, Kommende
   ab null); die Zentren gleiten weiter linear. Von oben nach unten wie an den Enden: das Gefaess eines
   Kindes ist seine Zelle im Stuetzbild darueber.
   Gemessen am echten Klangschaum (Abrufe -> Herzen, gemeinsame Startpunkte aus der Ordination, 269
   Titel an beiden Enden; 120 Schritte): nur linear 8 Zellen zeitweise leer, 49 mit einem Sprung ueber
   ein Viertel ihrer groessten Flaeche in einem Schritt, Plan 143 ms; 4 Stuetzbilder 1 / 14 / 270 ms;
   6: 2 / 19 / 340 ms; 10: 0 / 26 / 470 ms; 30: 0 / 42 / 1,4 s. Mehr Stuetzen machen es nicht ruhiger:
   die Spruenge sitzen zwischen den Stuetzen, wo zwei Nachbarn ihre gemeinsame Wand umklappen; alle
   Loesungen gehen auf (Restfehler unter 1e-6). Ohne gemeinsame Startpunkte (Zellen wandern quer
   durcheinander) bleibt es unruhig - darum haben beide Schaeume feste Startpunkte. Ein Warmstart je
   Bild (jedes Bild flaechengenau) verlor Zellen und war zu langsam - verworfen. */
function stuetze(g, U, k){
  if (g.blatt) return;
  const e = k / STUETZEN, a0 = g.kf[0], b0 = g.kf[STUETZEN];
  const linear = () => a0.map((a, i) => ({ s: [a.s[0] + (b0[i].s[0] - a.s[0]) * e, a.s[1] + (b0[i].s[1] - a.s[1]) * e], w: a.w + (b0[i].w - a.w) * e }));
  const A = U && U.length > 2 ? flaeche(U) : 0;
  if (!(A > 1e-9)){ g.kf[k] = linear(); for (const c of g.kinder) stuetze(c, null, k); return; }
  if (g.kinder.length === 1){ g.kf[k] = [{ s: [0, 0], w: 0 }]; return stuetze(g.kinder[0], U, k); }
  const m = centroid(U), s = Math.sqrt(A), lin = linear();
  const ziel = g.anteile.map(([a, b]) => a + (b - a) * e), summe = ziel.reduce((x, y) => x + y, 0) || 1;
  const r = ccvt(gefaess(U), ziel.map(t => t / summe * A), { maxOuter: 0, sites0: lin.map(p => [m[0] + p.s[0] * s, m[1] + p.s[1] * s]) });
  g.kf[k] = r.sites.map((p, i) => ({ s: [(p[0] - m[0]) / s, (p[1] - m[1]) / s], w: r.w[i] / A }));
  g.kinder.forEach((c, i) => stuetze(c, r.cells[i].length > 2 ? r.cells[i].map(q => q.p) : null, k));
}

/* Ein Zwischenbild bei e (0 = alt, 1 = neu): je Knoten sein Umriss (null, wo er gerade leer ist),
   die Zellen mit ihrer Farbe (die neue ab der Haelfte). */
export function morphBild(plan, e){
  const aus = [];
  const geh = (g, umriss) => {
    if (g.tiefe >= 0) aus.push({ key: g.key, tiefe: g.tiefe, blatt: g.blatt, pts: umriss, farbe: g.blatt ? (e < 0.5 ? g.farbeA : g.farbeB) : null });
    if (g.blatt) return;
    const A = umriss && umriss.length > 2 ? flaeche(umriss) : 0;
    if (!(A > 1e-9)){ for (const k of g.kinder) geh(k, null); return; }
    if (g.kinder.length === 1) return geh(g.kinder[0], umriss);
    const m = centroid(umriss), s = Math.sqrt(A), j = Math.min(STUETZEN - 1, Math.floor(e * STUETZEN)), u = e * STUETZEN - j;
    const P = g.kf[j], Q = g.kf[j + 1];
    const sites = P.map((a, i) => [m[0] + (a.s[0] + (Q[i].s[0] - a.s[0]) * u) * s, m[1] + (a.s[1] + (Q[i].s[1] - a.s[1]) * u) * s]);
    const w = P.map((a, i) => (a.w + (Q[i].w - a.w) * u) * A);
    const zellen = powerCells({ pts: umriss }, sites, w);
    g.kinder.forEach((k, i) => geh(k, zellen[i].length > 2 ? zellen[i].map(q => q.p) : null));
  };
  if (plan.wurzel) geh(plan.wurzel, [[0, 0], [plan.W, 0], [plan.W, plan.H], [0, plan.H]]);
  return aus;
}
