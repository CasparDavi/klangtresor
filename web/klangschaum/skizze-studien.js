/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   LEONARDOS INSTRUMENTENSTUDIEN (Skizzenbuch, 08.10.2026). Caspar_D: „die Skizze einer e-Gitarre, die natürlich Leonardo damals
   schon erfunden hatte ;-)" – „oder ein Cello als Tribute to Tarja". Gitarre und Cello wörtlich aus der ersten Fassung (skizzeStudie, plakat.js 1.0.61),
   dazu Schlagzeug, Synthesizer, E-Bass und Flügel im selben Strich: Federstrich in Sepia, Konstruktion gestrichelt (Achse,
   Zirkelbögen, Hilfslinien), Schraffur auf der Schattenseite (Licht von oben links, auf den Umriss geclippt), eine Maßkette,
   Beschriftung italienisch in Spiegelschrift und eine kleine lesbare deutsche Zeile.
   Gezeichnet in eigenen Einheiten (STUDIE_MASS samt Beschriftung), auf die Lücke skaliert; die Strichstärke bleibt in mm
   (f = kurze Plakatseite / 500), auch in der Lupe, die den Ausschnitt noch einmal zeichnet statt ihn zu vergrößern.
   IDs: Präfix aus art + laufender Zähler je Aufruf, damit mehrere Studien und Lupen auf einer Seite gehen. */
export const SEPIA = '#4a3423', SCHRIFT = "'Pinyon Script', cursive";
export const STUDIE_MASS = {                                 /* eigene Einheiten samt Beschriftungen */
  gitarre: { w: 46, h: 114 }, cello: { w: 41, h: 123 },
  drums: { w: 134, h: 111 }, synthesizer: { w: 115, h: 57 }, bass: { w: 49.5, h: 128 }, klavier: { w: 50, h: 102 },
};
/* Lohnende Ausschnitte je Instrument (Mitte zx/zy, Halbmesser zr in eigenen Einheiten) für lupe() */
export const DETAILS = {
  gitarre: [
    { zx: 19.5, zy: 7, zr: 8, titel: 'il capo', unter: 'Kopf mit sechs Wirbeln' },
    { zx: 22, zy: 81, zr: 10, titel: 'i magneti', unter: 'Tonabnehmer, Regler, Steg' },
    { zx: 19, zy: 30, zr: 7, titel: 'i tasti', unter: 'Bünde nach der zwölften Wurzel aus zwei' },
  ],
  cello: [
    { zx: 20, zy: 8, zr: 7.5, titel: 'la voluta', unter: 'Schnecke und Wirbel' },
    { zx: 20, zy: 75, zr: 11, titel: 'il ponticello', unter: 'Steg und f-Löcher' },
  ],
  drums: [
    { zx: 62, zy: 64, zr: 11, titel: 'l’uomo nel tamburo', unter: 'der Mensch im Resonanzfell' },
    { zx: 100, zy: 59, zr: 11, titel: 'il tamburo rullante', unter: 'Snare mit Spannböcken und Stöcken' },
    { zx: 120, zy: 44, zr: 11, titel: 'i piatti a pedale', unter: 'Hi-Hat mit Kupplung' },
  ],
  synthesizer: [
    { zx: 70, zy: 18, zr: 11, titel: 'il filtro', unter: 'Filter, Hüllkurve, Steckfeld' },
    { zx: 9, zy: 31, zr: 8, titel: 'le ruote', unter: 'Tonhöhen- und Modulationsrad' },
    { zx: 34, zy: 14, zr: 9, titel: 'gli oscillatori', unter: 'drei Schwingungserzeuger' },
  ],
  bass: [
    { zx: 20.5, zy: 88.5, zr: 8, titel: 'il magnete diviso', unter: 'geteilter Tonabnehmer' },
    { zx: 19, zy: 10, zr: 10, titel: 'le chiavi', unter: 'Kopf mit vier Mechaniken' },
    { zx: 27, zy: 103, zr: 9, titel: 'il ponte', unter: 'Steg, Regler und Buchse' },
  ],
  klavier: [
    { zx: 38, zy: 10.5, zr: 12.5, titel: 'come batte il martello', unter: 'Mechanik im Schnitt' },
    { zx: 24, zy: 75, zr: 8, titel: 'i martelli', unter: 'Hammerreihe, Waagebalken, Tasten' },
    { zx: 22, zy: 64, zr: 7, titel: 'la piastra', unter: 'Gussrahmen, Stimmstifte, Dämpfer' },
  ],
};

let zaehler = 0;
const n2 = (v) => (+v).toFixed(2);
const escStd = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/* Geometrie: Bézier abtasten, Polylinie versetzen (positiv = nach rechts der Laufrichtung, im Uhrzeigersinn also nach innen) */
const kubik = (a, b, c, d, n = 16) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t;
  return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]; });
const gerade = (a, b, n = 8) => Array.from({ length: n + 1 }, (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);
const linie = (pts, zu = false) => 'M' + pts.map(p => n2(p[0]) + ',' + n2(p[1])).join(' L') + (zu ? ' Z' : '');
const versatz = (pts, d) => pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  return [p[0] - dy / l * d, p[1] + dx / l * d]; });
const innen = (poly, p) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++){ const a = poly[i], b = poly[j];
  if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
/* von p in Richtung d bis an den Rand von poly (p liegt innen) */
const bisZumRand = (poly, p, d, max = 140) => { let t = 0; const st = 0.4; while (t < max && innen(poly, [p[0] + d[0] * t, p[1] + d[1] * t])) t += st;
  let a = Math.max(0, t - st), b = t; for (let i = 0; i < 18; i++){ const m = (a + b) / 2; if (innen(poly, [p[0] + d[0] * m, p[1] + d[1] * m])) a = m; else b = m; }
  return [p[0] + d[0] * a, p[1] + d[1] * a]; };
const pfadPunkte = (d, n = 10) => { const z = d.match(/[MC]|-?[\d.]+/g), pts = []; let i = 0, cmd = null, cur = null; const zahl = () => +z[i++];
  while (i < z.length){ if (z[i] === 'M' || z[i] === 'C') cmd = z[i++];
    if (cmd === 'M'){ cur = [zahl(), zahl()]; pts.push(cur); } else { const b = [zahl(), zahl()], c = [zahl(), zahl()], e = [zahl(), zahl()]; pts.push(...kubik(cur, b, c, e, n).slice(1)); cur = e; } }
  return pts; };
const einheit = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };

/* Werkzeug je Zeichnung: Strichstärken in mm unabhängig vom Maßstab k (eigene Einheit -> mm), IDs mit Präfix */
function werkzeug(k, f, pre, esc){
  const sw = (mm) => (mm * f / k).toFixed(3);
  const strich = (mm, o = 0.85) => `fill="none" stroke="${SEPIA}" stroke-opacity="${o}" stroke-width="${sw(mm)}" stroke-linecap="round" stroke-linejoin="round"`;
  const strichel = (mm, o, a, b) => `${strich(mm, o)} stroke-dasharray="${sw(a)} ${sw(b)}"`;
  const tinte = (o = 0.85) => `fill="${SEPIA}" fill-opacity="${o}" stroke="none"`;
  const txt = (tx, ty, fs, t, o = 0.6, anker = 'middle') => `<text x="${n2(tx)}" y="${n2(ty)}" font-size="${n2(fs)}" fill="${SEPIA}" fill-opacity="${o}" text-anchor="${anker}" font-family="${SCHRIFT}">${esc(t)}</text>`;
  const spiegel = (tx, ty, fs, t, o = 0.7) => `<g transform="translate(${n2(2 * tx)},0) scale(-1,1)">${txt(tx, ty, fs, t, o)}</g>`;
  const schraff = (x0, x1, y0, y1, d, wink = 45) => { let l = ''; const L = (x1 - x0) + (y1 - y0);
    for (let t = -L; t < L; t += d) l += `M${n2(x0 + t)},${n2(y1)} L${n2(x0 + t + (y1 - y0) / Math.tan(wink * Math.PI / 180))},${n2(y0)} `; return l; };
  /* wie schraff, aber auf den Kasten x0…x1 × y0…y1 beschnitten (Liang-Barsky): so bleibt die Schraffur auf der Schattenseite */
  const schraffK = (x0, x1, y0, y1, d, wink = 45) => { let l = ''; const dx = (y1 - y0) / Math.tan(wink * Math.PI / 180), L = (x1 - x0) + Math.abs(dx) + d;
    for (let t = -L; t < L; t += d){ const a = [x0 + t, y1], ex = dx, ey = y0 - y1; let t0 = 0, t1 = 1, weg = false;
      for (const [p, q] of [[-ex, a[0] - x0], [ex, x1 - a[0]], [-ey, a[1] - y0], [ey, y1 - a[1]]]){
        if (p === 0){ if (q < 0){ weg = true; break; } continue; } const r = q / p; if (p < 0){ if (r > t1){ weg = true; break; } if (r > t0) t0 = r; } else { if (r < t0){ weg = true; break; } if (r < t1) t1 = r; } }
      if (!weg && t1 > t0) l += `M${n2(a[0] + t0 * ex)},${n2(a[1] + t0 * ey)} L${n2(a[0] + t1 * ex)},${n2(a[1] + t1 * ey)} `; }
    return l; };
  let c = 0; const cid = () => `${pre}-${++c}`;
  const clip = (d, regel) => { const id = cid(); return [id, `<defs><clipPath id="${id}"><path d="${d}"${regel ? ` clip-rule="${regel}"` : ''}/></clipPath></defs>`]; };
  /* Schraffur in einem Umriss: [Deckung, Abstand, Winkel, x0, x1, y0, y1, Strich] je Lage */
  const schattig = (umriss, lagen, regel) => { const [id, defs] = clip(umriss, regel);
    return defs + lagen.map(([o, d, w, x0, x1, y0, y1, mm = 0.14]) => `<path d="${schraffK(x0, x1, y0, y1, d, w)}" ${strich(mm, o)} clip-path="url(#${id})"/>`).join(''); };
  /* Sichelschatten wie bei Leonardo: Schraffur nur dort, wo der Umriss, zum Licht hin (oben links) verschoben, nicht mehr deckt -
     die Lagen folgen so der Schattenkante statt an einer Kastengrenze abzubrechen. Lage: [Deckung, Abstand, Winkel, dx, dy, Strich] */
  const sichel = (umriss, kasten, lagen) => { const [id, defs] = clip(umriss), [x0, x1, y0, y1] = kasten;
    return defs + lagen.map(([o, d, w, dx, dy, mm = 0.14]) => { const m = cid();
      return `<defs><mask id="${m}" maskUnits="userSpaceOnUse" x="${n2(x0 - 5)}" y="${n2(y0 - 5)}" width="${n2(x1 - x0 + 10)}" height="${n2(y1 - y0 + 10)}">`
        + `<rect x="${n2(x0 - 5)}" y="${n2(y0 - 5)}" width="${n2(x1 - x0 + 10)}" height="${n2(y1 - y0 + 10)}" fill="#fff"/><path d="${umriss}" transform="translate(${n2(dx)} ${n2(dy)})" fill="#000"/></mask></defs>`
        + `<g clip-path="url(#${id})"><path d="${schraffK(x0, x1, y0, y1, d, w)}" ${strich(mm, o)} mask="url(#${m})"/></g>`; }).join(''); };
  /* Maßkette: Hauptlinie, Endstriche quer, an jedem Punkt ein Schrägstrich wie bei den Baumeistern */
  const kette = (punkte, lage, senkrecht = false, o = 0.6) => { const a = Math.min(...punkte), b = Math.max(...punkte), P = (u, v) => senkrecht ? [lage + v, u] : [u, lage + v];
    const L = (p, q) => `M${n2(P(...p)[0])},${n2(P(...p)[1])} L${n2(P(...q)[0])},${n2(P(...q)[1])}`;
    let d = L([a, 0], [b, 0]); for (const u of punkte) d += ' ' + L([u, -1.2], [u, 1.2]) + ' ' + L([u - 0.7, 0.7], [u + 0.7, -0.7]);
    return `<path d="${d}" ${strich(0.18, o)}/>`; };
  return { sw, strich, strichel, tinte, txt, spiegel, schraff, cid, clip, schattig, sichel, kette, n2 };
}

/* ---------------------------------------------------------------- E-Gitarre und Cello: wörtlich aus plakat.js 1.0.61 (skizzeStudie) */
function gitarre(W, id){
  const { sw, strich, spiegel, schraff } = W;
  let g = '';
  const koerper = 'M16.6,60 C14,58 12,54 10,52 C7,50 5,52 5.5,56 C6,60 4,63 2.5,68 C0,75 0,88 4,94 C8,100 30,100 34,94 C38,88 38,76 35.5,70 C34,66 35,63 34,60 C33.5,57 34,53 32,52.5 C30,52 28,55 26,58 C24,60 22,60 21.4,60 Z';
  g += `<defs><clipPath id="${id}-k"><path d="${koerper}"/></clipPath></defs>`
    + `<line x1="19" y1="-4" x2="19" y2="104" ${strich(0.18, 0.4)} stroke-dasharray="${sw(1.6)} ${sw(1.1)}"/>`
    + `<circle cx="19" cy="83" r="17.5" ${strich(0.18, 0.3)} stroke-dasharray="${sw(0.8)} ${sw(1)}"/><circle cx="19" cy="61" r="14" ${strich(0.18, 0.3)} stroke-dasharray="${sw(0.8)} ${sw(1)}"/>`
    + `<path d="${schraff(22, 40, 50, 100, 1.3)}" ${strich(0.16, 0.55)} clip-path="url(#${id}-k)"/><path d="${schraff(29, 40, 50, 100, 1.5, -45)}" ${strich(0.14, 0.45)} clip-path="url(#${id}-k)"/>`
    + `<path d="${koerper}" ${strich(0.32)}/>`
    + `<path d="M17,14 L21,14 L21.6,64 L16.4,64 Z" ${strich(0.28)}/>`
    + `<path d="M17,14 L16,6 Q16,1 20,1 L23,2 Q26,3 25,6 L22,9 Q21,11 21.5,14" ${strich(0.28)}/>`
    + Array.from({ length: 6 }, (_, i) => `<circle cx="15.1" cy="${n2(2.6 + 1.85 * i)}" r="0.85" ${strich(0.2)}/>`).join('');
  for (let n = 1; n <= 21; n++){ const yy = 14 + 74 * (1 - Math.pow(2, -n / 12)); if (yy > 64) break; const t = (yy - 14) / 50; g += `<line x1="${n2(17 - 0.6 * t)}" y1="${n2(yy)}" x2="${n2(21 + 0.6 * t)}" y2="${n2(yy)}" ${strich(0.14, 0.7)}/>`; }
  for (const yy of [67, 73]) g += `<rect x="15.5" y="${yy}" width="7" height="2" rx="0.8" ${strich(0.22)}/>`;
  g += `<rect x="15.5" y="78" width="7.5" height="2" rx="0.8" transform="rotate(-6 19 79)" ${strich(0.22)}/><rect x="14.5" y="86" width="9" height="3" rx="0.4" ${strich(0.25)}/>`
    + [[27, 82], [29, 86], [30.5, 90]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="1.2" ${strich(0.2)}/>`).join('') + `<ellipse cx="33.5" cy="92.5" rx="1" ry="1.6" ${strich(0.2)}/><line x1="26.5" y1="75" x2="29" y2="77.5" ${strich(0.25)}/>`
    + Array.from({ length: 6 }, (_, i) => `<line x1="${n2(17.6 + 0.56 * i)}" y1="14" x2="${n2(16.2 + 1.15 * i)}" y2="87.5" ${strich(0.1, 0.6)}/>`).join('')
    + `<path d="M41,1 L41,99 M39.8,1 L42.2,1 M39.8,99 L42.2,99" ${strich(0.18, 0.6)}/>` + `<g transform="rotate(90 43.6 50)">${spiegel(43.6, 50, 3.2, 'strumento elettrico')}</g>`
    + spiegel(19, 108, 3.4, 'una chitarra che canta senza aria') + W.txt(19, 113, 2.6, 'Gitarre ohne Luft, die doch singt', 0.6);
  return g;
}
function cello(W, id, widmung, widmungFs = 3){
  const { sw, strich, spiegel, schraff, txt } = W;
  let g = '';
  const koerper = 'M20,38 C12,38 4,40 3.5,47 C3,53 6,56 9.5,57.5 C8,60 8,64 8.5,66 C9,70 8,72 6.5,73.5 C2,76 0,82 0.5,90 C1,99 9,104 20,104 C31,104 39,99 39.5,90 C40,82 38,76 33.5,73.5 C32,72 31,70 31.5,66 C32,64 32,60 30.5,57.5 C34,56 37,53 36.5,47 C36,40 28,38 20,38 Z';
  g += `<defs><clipPath id="${id}-k"><path d="${koerper}"/></clipPath></defs>`
    + `<line x1="20" y1="-3" x2="20" y2="113" ${strich(0.18, 0.4)} stroke-dasharray="${sw(1.6)} ${sw(1.1)}"/>`
    + `<circle cx="20" cy="47.5" r="16.5" ${strich(0.18, 0.3)} stroke-dasharray="${sw(0.8)} ${sw(1)}"/><circle cx="20" cy="89" r="19.5" ${strich(0.18, 0.3)} stroke-dasharray="${sw(0.8)} ${sw(1)}"/>`
    + `<path d="${schraff(-2, 16, 36, 106, 1.3, -50)}" ${strich(0.16, 0.5)} clip-path="url(#${id}-k)"/><path d="${schraff(-2, 9, 36, 106, 1.5, 40)}" ${strich(0.14, 0.4)} clip-path="url(#${id}-k)"/>`
    + `<path d="${koerper}" ${strich(0.32)}/><path d="M20,39.6 C12.5,39.6 5.2,41.3 4.8,47 C4.5,52 7.3,55 10.6,56.6" ${strich(0.14, 0.6)}/>`
    + `<path d="M18.2,16 L21.8,16 L22.4,40 L17.6,40 Z" ${strich(0.28)}/><path d="M18.4,40 L21.6,40 L22.2,62 L17.8,62 Z" ${strich(0.24)}/>`
    + `<path d="M18.4,16 L18,8.5 M21.6,16 L22,8.5" ${strich(0.26)}/>` + [10.5, 13.5].map(yy => `<path d="M18,${yy} L15.5,${yy - 0.6} M22,${yy + 1} L24.5,${yy + 0.4}" ${strich(0.26)}/><circle cx="15.2" cy="${yy - 0.65}" r="0.7" ${strich(0.2)}/><circle cx="24.8" cy="${yy + 0.35}" r="0.7" ${strich(0.2)}/>`).join('')
    + `<path d="M20,8.5 C23.5,8.5 24.5,5 22.5,3.2 C20.5,1.4 17,2.5 17.2,5 C17.4,7 20,7.4 20.8,5.8 C21.4,4.6 20.2,3.8 19.4,4.6" ${strich(0.26)}/>`
    + [13, 27].map(xx => { const s2 = xx < 20 ? 1 : -1; return `<path d="M${xx},64 C${xx + 2.4 * s2},68 ${xx - 2.4 * s2},76 ${xx},80" ${strich(0.24)}/><circle cx="${xx}" cy="63.6" r="0.7" ${strich(0.18)}/><circle cx="${xx}" cy="80.4" r="0.7" ${strich(0.18)}/>`; }).join('')
    + `<path d="M14,80.5 Q20,77.6 26,80.5 L25.4,81.4 L14.6,81.4 Z" ${strich(0.24)}/><path d="M17.2,85 L22.8,85 L24,98 L16,98 Z" ${strich(0.24)}/><line x1="20" y1="104" x2="20" y2="111" ${strich(0.3)}/>`
    + Array.from({ length: 4 }, (_, i) => `<line x1="${n2(18.9 + 0.75 * i)}" y1="16" x2="${n2(17.9 + 1.4 * i)}" y2="85" ${strich(0.1, 0.6)}/>`).join('')
    /* Caspar_D: „ein Cello und dann als Untertitel auf Latein" – die Zeile kommt von außen (Platz 1 der Würdigung); widmung === false lässt beide Zeilen weg
       (das kopfüber hängende Cello im Instrumentenpaar trägt sie aufrecht darüber, skizze-blatt.js) */
    + (widmung === false ? '' : txt(20, 117.5, 4.4, 'Violoncellum', 0.9) + txt(20, 122, widmungFs, widmung, 0.75)) + spiegel(9, 26, 2.8, 'quattro corde', 0.6);
  return g;
}

/* ---------------------------------------------------------------- Schlagzeug: Vorderansicht leicht von oben (Ellipsen 1 : 3)
   Bassdrum mit dem Fell zum Betrachter (Hinterreifen 5,5 höher, die obere Kesselhälfte sichtbar), Toms und Snare stehend
   (Fell oben, Kessel, Spannböcke vorne), Hi-Hat rechts, Becken links am Galgen. Licht von oben links: Schatten rechts. */
function drums(W){
  const { strich, strichel, tinte, txt, spiegel, schattig, sichel, kette } = W;
  let g = '';
  const E = (cx, cy, rx, ry, st) => `<ellipse cx="${n2(cx)}" cy="${n2(cy)}" rx="${n2(rx)}" ry="${n2(ry)}" ${st}/>`;
  const vorn = (cx, cy, rx, ry) => `M${n2(cx - rx)},${n2(cy)} A${n2(rx)},${n2(ry)} 0 0 0 ${n2(cx + rx)},${n2(cy)}`;
  const L = (a, b, c, d, st) => `<line x1="${n2(a)}" y1="${n2(b)}" x2="${n2(c)}" y2="${n2(d)}" ${st}/>`;
  const rohr = (a, b, c, d, r, o = 0.85) => { const [nx, ny] = einheit([-(d - b), c - a]); return `<path d="M${n2(a + nx * r)},${n2(b + ny * r)} L${n2(c + nx * r)},${n2(d + ny * r)} M${n2(a - nx * r)},${n2(b - ny * r)} L${n2(c - nx * r)},${n2(d - ny * r)}" ${strich(0.18, o)}/>`; };
  const BODEN = 88;
  /* stehende Trommel: Fell oben (volle Ellipse), Kessel, Spannböcke auf der Vorderseite, Schatten rechts */
  const kessel = (cx, top, rx, ry, h, { boecke = 6, rot = 0 } = {}) => {
    const u = top + h, huelle = `M${n2(cx - rx)},${n2(top)} A${n2(rx)},${n2(ry)} 0 0 0 ${n2(cx + rx)},${n2(top)} L${n2(cx + rx)},${n2(u)} A${n2(rx)},${n2(ry)} 0 0 1 ${n2(cx - rx)},${n2(u)} Z`;
    let s = schattig(huelle, [[0.28, 1.5, 60, cx - rx - 3, cx + rx + 3, top - 2, u + ry + 2, 0.12], [0.55, 0.9, 60, cx + 0.15 * rx, cx + rx + 3, top - 2, u + ry + 2, 0.15], [0.45, 1.1, -60, cx + 0.6 * rx, cx + rx + 3, top - 2, u + ry + 2, 0.13]]);
    s += E(cx, top, rx, ry, strich(0.3)) + E(cx, top, rx - 0.7, ry - 0.25, strich(0.1, 0.45))
      + `<path d="${vorn(cx, top + 0.9, rx, ry)} M${n2(cx - rx)},${n2(top)} L${n2(cx - rx)},${n2(u)} M${n2(cx + rx)},${n2(top)} L${n2(cx + rx)},${n2(u)} ${vorn(cx, u, rx, ry)}" ${strich(0.3)}/>`
      + `<path d="${vorn(cx, top + 0.9, rx, ry)} ${vorn(cx, u - 0.9, rx, ry)}" ${strich(0.18, 0.75)}/>`;
    for (let i = 0; i < boecke; i++){ const th = Math.PI * (i + 0.5) / boecke, x = cx - rx * Math.cos(th), sn = Math.sin(th), b = 0.45 * sn + 0.15;
      const yo = top + 0.9 + ry * sn, yu = u - 0.9 + ry * sn, m = (yo + yu) / 2, lh = Math.max(1.2, h * 0.3);
      s += `<rect x="${n2(x - b)}" y="${n2(m - lh / 2)}" width="${n2(2 * b)}" height="${n2(lh)}" rx="${n2(b * 0.8)}" ${strich(0.16)}/>`
        + `<path d="M${n2(x)},${n2(yo)} L${n2(x)},${n2(m - lh / 2)} M${n2(x)},${n2(m + lh / 2)} L${n2(x)},${n2(yu)} M${n2(x - 0.35 * sn)},${n2(yo)} L${n2(x + 0.35 * sn)},${n2(yo)}" ${strich(0.12, 0.8)}/>`; }
    return rot ? `<g transform="rotate(${rot} ${n2(cx)} ${n2(top + h / 2)})">${s}</g>` : s;
  };
  /* Becken: flache Ellipse, Kuppe, Drehrillen, Schatten rechts */
  const becken = (cx, cy, rx, ry, rot = 0) => {
    const um = `M${n2(cx - rx)},${n2(cy)} A${n2(rx)},${n2(ry)} 0 1 0 ${n2(cx + rx)},${n2(cy)} A${n2(rx)},${n2(ry)} 0 1 0 ${n2(cx - rx)},${n2(cy)} Z`;
    const s = schattig(um, [[0.45, 0.8, 70, cx + 0.2 * rx, cx + rx + 2, cy - ry - 2, cy + ry + 2, 0.12]])
      + E(cx, cy, rx, ry, strich(0.28)) + E(cx, cy, rx * 0.72, ry * 0.72, strich(0.08, 0.4)) + E(cx, cy, rx * 0.46, ry * 0.46, strich(0.08, 0.4))
      + E(cx, cy, 2.6, 0.85, strich(0.2)) + `<path d="M${n2(cx - 2.5)},${n2(cy - 0.3)} Q${n2(cx)},${n2(cy - 2.6)} ${n2(cx + 2.5)},${n2(cy - 0.3)}" ${strich(0.22)}/>`;
    return rot ? `<g transform="rotate(${rot} ${n2(cx)} ${n2(cy)})">${s}</g>` : s;
  };
  // Konstruktion: Horizont, Bodenlinie, Achse und Zirkel um das Resonanzfell, das Quadrat um den Kreis (Vitruv)
  const BX = 62, BY = 64, BR = 22, BRY = 21, TIEF = 5.5;
  g += L(0, 6, 133, 6, strichel(0.16, 0.35, 2.2, 1.4)) + spiegel(124, 4.8, 2, 'orizzonte', 0.5)
    + L(BX, 9, BX, 96, strichel(0.18, 0.4, 1.6, 1.1)) + L(BX - 27, BY, BX + 27, BY, strichel(0.18, 0.4, 1.6, 1.1))
    + `<circle cx="${BX}" cy="${BY}" r="24.5" ${strichel(0.18, 0.3, 0.8, 1)}/>`
    + `<rect x="${BX - BR}" y="${BY - BRY}" width="${2 * BR}" height="${2 * BRY}" ${strich(0.12, 0.22)}/>` + `<path d="M${BX - BR},${BY - BRY} L${BX + BR},${BY + BRY} M${BX + BR},${BY - BRY} L${BX - BR},${BY + BRY}" ${strich(0.1, 0.18)}/>`
    + L(0, BODEN, 133, BODEN, strich(0.18, 0.5));
  // Becken links am Galgenständer (zuerst: es liegt hinter der Standtom)
  g += rohr(6, 86.5, 6, 33, 0.45) + `<rect x="5.1" y="54" width="1.8" height="2.4" rx="0.4" ${strich(0.16)}/>` + rohr(6, 33, 20, 19.6, 0.38)
    + `<circle cx="6" cy="33" r="0.9" ${strich(0.18)}/>` + L(6, 85, 0.6, BODEN, strich(0.24)) + L(6, 85, 11.4, BODEN, strich(0.24)) + L(6, 85, 6.6, 87.4, strich(0.2))
    + becken(23, 17.5, 14, 3.4, -9) + `<path d="M22.6,13.4 L23.4,13.4 L23.6,12.2 L22.4,12.2 Z M21.6,12.4 L24.4,12.2" ${strich(0.18)}/>`;
  // Standtom links mit drei Beinen
  g += L(10.6, 54, 8.2, BODEN, strich(0.26)) + L(33.4, 54, 35.4, BODEN - 0.6, strich(0.26)) + L(24.5, 69, 25.6, 86.4, strich(0.22, 0.7))
    + `<rect x="9.8" y="53" width="1.4" height="2.2" ${strich(0.16)}/><rect x="32.8" y="53" width="1.4" height="2.2" ${strich(0.16)}/>`
    + kessel(22, 50, 11, 3.6, 16, { boecke: 6 });
  // Bassdrum: Kessel oben sichtbar, Spannstangen nach hinten, Resonanzfell mit Vitruv
  const kesselOben = `M${BX - BR},${BY - TIEF} A${BR},${BRY} 0 0 1 ${BX + BR},${BY - TIEF} L${BX + BR},${BY} A${BR},${BRY} 0 0 0 ${BX - BR},${BY} Z`;
  const fell = `M${BX - BR},${BY} A${BR},${BRY} 0 1 0 ${BX + BR},${BY} A${BR},${BRY} 0 1 0 ${BX - BR},${BY} Z`;
  g += L(BX - BR + 2, BY + 9, BX - BR - 4.5, BODEN, strich(0.28)) + L(BX + BR - 2, BY + 9, BX + BR + 4.5, BODEN, strich(0.28))
    + E(BX - BR - 4.5, BODEN - 0.3, 0.7, 0.35, strich(0.16)) + E(BX + BR + 4.5, BODEN - 0.3, 0.7, 0.35, strich(0.16))
    + sichel(kesselOben, [BX - BR - 1, BX + BR + 1, BY - BRY - TIEF - 1, BY + 1], [[0.28, 1.5, 60, -200, 0, 0.12], [0.55, 0.85, 60, -16, 0, 0.15], [0.4, 1.1, -60, -6, 0, 0.13]])
    + sichel(fell, [BX - BR - 1, BX + BR + 1, BY - BRY - 1, BY + BRY + 1], [[0.2, 1.6, 55, -200, 0, 0.11], [0.42, 1.0, 55, -6.5, -4, 0.13], [0.3, 1.2, -55, -2.2, -1.4, 0.12]])
    + `<path d="M${BX - BR},${BY - TIEF} A${BR},${BRY} 0 0 1 ${BX + BR},${BY - TIEF} M${BX - BR},${BY - TIEF} L${BX - BR},${BY} M${BX + BR},${BY - TIEF} L${BX + BR},${BY}" ${strich(0.3)}/>`
    + `<path d="M${BX - BR + 0.9},${BY - TIEF + 0.9} A${BR - 0.9},${BRY - 0.9} 0 0 1 ${BX + BR - 0.9},${BY - TIEF + 0.9}" ${strich(0.14, 0.6)}/>`
    + E(BX, BY, BR, BRY, strich(0.34)) + E(BX, BY, BR - 1.5, BRY - 1.45, strich(0.22));
  for (let i = 0; i < 10; i++){ const th = 2 * Math.PI * (i + 0.5) / 10, c = Math.cos(th), s = Math.sin(th), x = BX + BR * c, y = BY + BRY * s;
    g += `<path d="M${n2(x - 0.9 * c)},${n2(y - 0.9 * s)} L${n2(x + 1.1 * c)},${n2(y + 1.1 * s)}" ${strich(0.4, 0.8)}/>`;
    if (s < -0.2){ const m = y - TIEF / 2; g += L(x, y - 0.9, x, y - TIEF + 0.6, strich(0.14)) + `<rect x="${n2(x - 0.5)}" y="${n2(m - 0.9)}" width="1" height="1.8" rx="0.4" ${strich(0.15)}/>`; }
    else g += `<rect x="${n2(x + 1.1 * c - 0.5)}" y="${n2(y + 1.1 * s - 0.5)}" width="1" height="1" ${strich(0.14)}/>`; }
  /* Leonardos Mensch im Kreis und im Quadrat auf dem Fell - das Quadrat steht auf dem Kreisgrund, wie in Venedig */
  { const ck = 62.6, rk = 8.2, q = 1.656 * rk, ux = BX, uy = ck + rk;
    g += `<circle cx="${ux}" cy="${ck}" r="${rk}" ${strich(0.16, 0.65)}/><rect x="${n2(ux - q / 2)}" y="${n2(uy - q)}" width="${n2(q)}" height="${n2(q)}" ${strich(0.16, 0.65)}/>`
      + `<circle cx="${ux}" cy="${n2(uy - q + 1.3)}" r="1.05" ${strich(0.14, 0.75)}/>`
      + `<path d="M${ux},${n2(uy - q + 2.4)} L${ux},${n2(uy - 6.4)} M${n2(ux - q / 2 + 0.2)},${n2(uy - q + 3.1)} L${n2(ux + q / 2 - 0.2)},${n2(uy - q + 3.1)}`
      + ` M${n2(ux - 7.4)},${n2(ck - 3.8)} L${ux},${n2(uy - q + 3.4)} L${n2(ux + 7.4)},${n2(ck - 3.8)} M${n2(ux - 1)},${n2(uy)} L${ux},${n2(uy - 6.4)} L${n2(ux + 1)},${n2(uy)}`
      + ` M${n2(ux - 5.1)},${n2(uy - 1.6)} L${ux},${n2(uy - 6.4)} L${n2(ux + 5.1)},${n2(uy - 1.6)}" ${strich(0.13, 0.7)}/>`; }
  // Tomhalter und zwei Hängetoms, nach innen geneigt
  g += rohr(BX, BY - BRY - TIEF / 2, BX, 36.6, 0.5) + `<rect x="${BX - 1.4}" y="${BY - BRY - TIEF / 2 - 0.6}" width="2.8" height="1.6" rx="0.3" ${strich(0.16)}/>`
    + `<path d="M55.2,33.4 L56.4,36.6 L67.6,36.6 L68.8,33.2" ${strich(0.28)}/><circle cx="${BX}" cy="36.6" r="0.8" ${strich(0.18)}/>`
    + kessel(51, 22, 8.2, 2.8, 9.5, { boecke: 5, rot: 8 }) + kessel(73, 20.5, 9.2, 3.1, 10.5, { boecke: 5, rot: -8 });
  // Snare auf dem Korbständer, mit Abhebung und zwei gekreuzten Stöcken
  g += L(99, 64.6, 99, 77, strich(0.3)) + L(98.4, 71, 98.4, 77, strich(0.16, 0.6)) + `<rect x="98.1" y="70" width="1.8" height="1.2" rx="0.3" ${strich(0.16)}/>`
    + `<path d="M99,64.6 L91.6,61.9 M99,64.6 L106.4,61.9 M99,64.6 L99.4,65.6" ${strich(0.24)}/>`
    + L(99, 77, 91, BODEN, strich(0.26)) + L(99, 77, 107, BODEN, strich(0.26)) + L(99, 77, 99.6, 86.8, strich(0.22))
    + kessel(99, 56, 9, 3, 5.5, { boecke: 8 }) + `<rect x="107.8" y="57.4" width="0.9" height="2.6" rx="0.3" ${strich(0.16)}/>`
    + L(93.4, 56.9, 106.6, 54.3, strich(0.36)) + L(94.6, 54.2, 107.6, 57.6, strich(0.36))
    + E(93.2, 56.95, 0.45, 0.32, strich(0.18)) + E(94.4, 54.15, 0.45, 0.32, strich(0.18));
  // Hi-Hat: zwei Becken, Kupplung, Stange, Dreibein, Pedal
  { const cx = 120;
    g += `<path d="M${cx - 2.4},43.8 Q${cx},45.8 ${cx + 2.4},43.8 ${vorn(cx, 43.1, 10.7, 2)}" ${strich(0.24)}/>`
      + becken(cx, 42, 10.5, 2) + L(cx, 34.6, cx, 41.6, strich(0.26)) + `<rect x="${cx - 0.9}" y="37.2" width="1.8" height="2.4" rx="0.3" ${strich(0.18)}/><path d="M${cx - 1.6},39.9 L${cx + 1.6},39.9 M${cx - 1.6},37.0 L${cx + 1.6},37.0" ${strich(0.2)}/>`
      + rohr(cx, 45.6, cx, 58, 0.35) + rohr(cx, 58, cx, 76, 0.65) + `<rect x="${cx - 1}" y="57.2" width="2" height="1.6" rx="0.3" ${strich(0.16)}/>`
      + L(cx, 74, cx - 8.5, BODEN, strich(0.26)) + L(cx, 74, cx + 8.5, BODEN, strich(0.26))
      + `<path d="M${cx - 1.9},87.2 L${cx + 1.9},87.2 L${cx + 2.5},91.4 L${cx - 2.5},91.4 Z M${cx - 2.5},90.4 L${cx + 2.5},90.4 M${cx - 1.4},88.2 L${cx + 1.4},88.2 M${cx},76 L${cx},87.2" ${strich(0.22)}/><circle cx="${cx}" cy="87.2" r="0.5" ${strich(0.16)}/>`; }
  // Schatten am Boden unter der Bassdrum
  g += schattig(`M${BX - 26},${BODEN} A26,1.8 0 1 0 ${BX + 26},${BODEN} A26,1.8 0 1 0 ${BX - 26},${BODEN} Z`, [[0.35, 0.8, 30, BX - 27, BX + 27, BODEN - 2, BODEN + 2, 0.1]]);
  // Maßkette am Boden, Hilfslinien von den Teilen herab
  const mk = [6, 22, BX - BR, BX, BX + BR, 99, 120];
  g += mk.map(x => L(x, BODEN + 1, x, 96, strichel(0.12, 0.35, 0.6, 0.8))).join('') + kette(mk, 95.2) + spiegel(31, 98.6, 2.4, 'braccia due e mezzo', 0.55)
    + spiegel(66, 104, 3.4, 'tamburi più forti che le bombarde') + txt(66, 109.2, 2.6, 'Schlagwerk, lauter als jede Bombarde', 0.6);
  return g;
}

/* ---------------------------------------------------------------- Synthesizer: schräge Draufsicht (Parallelprojektion)
   x Breite, y Höhe, z Tiefe; X = x + 0,3 z, Y = −0,55 y − 0,75 z: von vorn rechts oben gesehen, die rechte Wange zeigt
   ihre Außenseite (Schatten). Das Bedienfeld steht 60° geneigt hinter der Tastatur; Kreise darauf werden als Punkte des
   geneigten Felds abgetastet, Knöpfe stehen entlang der Feldnormale heraus. */
function synthesizer(W){
  const { strich, strichel, tinte, txt, spiegel, schattig, kette } = W;
  const X0 = 2, Y0 = 40, S60 = Math.sin(Math.PI / 3), HY = 6.5, HZ = 16, PL = 24;
  const P = (x, y, z) => [X0 + x + 0.3 * z, Y0 - 0.55 * y - 0.75 * z];
  const pp = (pts, zu = false) => linie(pts.map(p => P(...p)), zu);
  const Q = (x, t, h = 0) => [x, HY + t * S60 + h * 0.5, HZ + t * 0.5 - h * S60];   /* Punkt auf dem Feld, h entlang der Normale */
  const QP = (x, t, h = 0) => P(...Q(x, t, h));
  const ring = (x, t, r, h = 0, n = 36) => Array.from({ length: n }, (_, i) => { const a = 2 * Math.PI * i / n; return QP(x + r * Math.cos(a), t + r * Math.sin(a), h); });
  const NV = einheit([QP(0, 0, 1)[0] - QP(0, 0, 0)[0], QP(0, 0, 1)[1] - QP(0, 0, 0)[1]]), QV = [NV[1], -NV[0]];
  const aussen = (pts) => { let lo = 0, hi = 0; const d = (p) => p[0] * QV[0] + p[1] * QV[1]; pts.forEach((p, i) => { if (d(p) < d(pts[lo])) lo = i; if (d(p) > d(pts[hi])) hi = i; }); return [pts[lo], pts[hi]]; };
  const verbinde = (a, b, st) => { const [a0, a1] = aussen(a), [b0, b1] = aussen(b); return `<path d="${linie([a0, b0])} ${linie([a1, b1])}" ${st}/>`; };
  let g = '';
  // Konstruktion: Standlinie (gestrichelt); unten rechts das Profil der Wange flach, mit dem Winkel des Felds (sechzig Grad)
  const profil0 = [[-0.6, 0], [-0.6, 6.2], [-0.3, 7.2], [0.6, 7.7], [15.5, 8.6], [15.5 + 12.6, 8.6 + 21.8], [29.3, 30.7], [30.6, 30.2], [31.2, 29], [31.2, 0]];
  g += `<path d="${pp([[-2, 0, 0], [106, 0, 0]])}" ${strichel(0.16, 0.32, 1.6, 1.1)}/>`;
  { const F = ([z, y]) => [97 + z * 0.36, 56.2 - y * 0.36], h = F([HZ, HY]), arc = Array.from({ length: 13 }, (_, i) => { const a = i * 5 * Math.PI / 180; return F([HZ + 9 * Math.cos(a), HY + 9 * Math.sin(a)]); });
    g += `<path d="${linie(profil0.map(F), true)}" ${strich(0.18, 0.7)}/><path d="${linie([h, F([HZ + PL * 0.5, HY + PL * S60])])}" ${strich(0.22, 0.8)}/>`
      + `<path d="${linie([h, F([HZ + 13, HY])])} ${linie(arc)}" ${strichel(0.12, 0.55, 0.5, 0.5)}/><path d="${linie([F([-3, 0]), F([34, 0])])}" ${strich(0.12, 0.5)}/>`
      + spiegel(92.6, 52.4, 1.6, 'profilo', 0.55) + spiegel(92.6, 54.6, 1.4, 'gradi sessanta', 0.5); }
  // rechte Wange (Nussbaum): Außenseite mit Schatten und Maserung, Oberkante, Stirn
  const profil = profil0;
  const wange = (x) => profil.map(([z, y]) => [x, y, z]);
  const wangeR = pp(wange(102), true);
  g += schattig(wangeR, [[0.55, 0.85, 50, 100, 118, 0, 42, 0.15], [0.28, 1.3, -50, 100, 118, 0, 42, 0.12]])
    + [3, 8, 13, 18, 23].map(y => { const pts = []; for (let z = -0.6; z <= 31.2; z += 0.8) pts.push([102, y + 0.5 * Math.sin(z * 0.45 + y), z]);
      return pts.filter(([, yy, zz]) => yy < 8.6 + (zz - 15.5) * 1.73 || zz < 15.5).filter(([, yy, zz]) => zz > 15.5 || yy < 7.6); }).filter(p => p.length > 1).map(p => `<path d="${pp(p)}" ${strich(0.1, 0.4)}/>`).join('')
    + `<path d="${wangeR}" ${strich(0.3)}/><path d="${pp(wange(100).slice(1, 9))}" ${strich(0.24)}/>`
    + `<path d="${profil.slice(1, 9).map(([z, y]) => pp([[100, y, z], [102, y, z]])).join(' ')}" ${strich(0.14, 0.6)}/>`;
  // linke Wange: nur Oberkante und Innenseite über der Tastenebene
  g += `<path d="${pp(wange(-2).slice(0, 9))} ${pp(wange(0).slice(1, 9))} ${pp([[-2, 0, -0.6], [0, 0, -0.6], [0, 6.2, -0.6]])}" ${strich(0.26)}/>`;
  // Vorderleiste mit Schraffur, Tastenbett
  const leiste = pp([[0, 0, 0], [100, 0, 0], [100, 3.8, 0], [0, 3.8, 0]], true);
  g += schattig(leiste, [[0.35, 0.9, 80, 0, 116, 30, 45, 0.12]]) + `<path d="${leiste}" ${strich(0.26)}/>`;
  // Bedienfeld: Fläche, Kante, Felder mit Spiegelschrift
  g += `<path d="${pp([Q(0, 0), Q(100, 0), Q(100, PL), Q(0, PL)], true)}" ${strich(0.3)}/><path d="${pp([Q(0, PL, -1.1), Q(100, PL, -1.1)])} ${pp([Q(0, 0.7), Q(100, 0.7)])}" ${strich(0.16, 0.6)}/>`;
  const felder = [[0, 14, 'regolatori'], [14, 40, 'oscillatori'], [40, 54, 'mescolatore'], [54, 70, 'filtro'], [70, 88, 'inviluppo'], [88, 100, 'uscita']];
  for (const [a, b, name] of felder){ if (a > 0) g += `<path d="${pp([Q(a, 1.2), Q(a, PL - 0.8)])}" ${strich(0.14, 0.6)}/>`; const [mx, my] = QP((a + b) / 2, PL - 2.2); g += spiegel(mx, my, 1.5, name, 0.65); }
  // Knöpfe: Fuß mit Skala, Riffelrand, Kappe mit Zeiger
  const knopf = (x, t, r, psi) => {
    let s = '';
    for (let i = 0; i <= 10; i++){ const a = (225 - 27 * i) * Math.PI / 180, l = i % 5 === 0 ? 1.7 : 1.5;
      s += `<path d="${linie([QP(x + 1.3 * r * Math.cos(a), t + 1.3 * r * Math.sin(a)), QP(x + l * r * Math.cos(a), t + l * r * Math.sin(a))])}" ${strich(0.12, 0.7)}/>`; }
    const fuss = ring(x, t, r, 0), rand = ring(x, t, r, 0.8), kappe = ring(x, t, 0.68 * r, 1.6);
    s += `<path d="${linie(fuss, true)}" ${strich(0.14, 0.55)}/>` + verbinde(fuss, rand, strich(0.18)) + `<path d="${linie(rand, true)}" ${strich(0.22)}/>`
      + verbinde(rand, kappe, strich(0.16)) + `<path d="${linie(kappe, true)}" ${strich(0.24)}/>`;
    for (let i = 0; i < 36; i += 3){ const v = [fuss[i][0] - QP(x, t)[0], fuss[i][1] - QP(x, t)[1]]; if (v[0] * NV[0] + v[1] * NV[1] < 0) s += `<path d="${linie([fuss[i], rand[i]])}" ${strich(0.1, 0.6)}/>`; }
    s += `<path d="${linie([QP(x, t, 1.6), QP(x + 0.68 * r * Math.cos(psi), t + 0.68 * r * Math.sin(psi), 1.6)])}" ${strich(0.26)}/>`;
    return s;
  };
  const buchse = (x, t) => `<path d="${linie(ring(x, t, 0.85), true)} ${linie(ring(x, t, 0.42, 0.2, 20), true)}" ${strich(0.18)}/>`;
  const schalter = (x, t) => `<path d="${pp([Q(x - 0.7, t - 1.1), Q(x + 0.7, t - 1.1), Q(x + 0.7, t + 1.1), Q(x - 0.7, t + 1.1)], true)} ${pp([Q(x - 0.55, t - 0.95, 0.3), Q(x + 0.55, t - 0.95, 0.3), Q(x + 0.55, t + 0.95, 0.9), Q(x - 0.55, t + 0.95, 0.9)], true)} ${pp([Q(x - 0.55, t, 0.6), Q(x + 0.55, t, 0.6)])}" ${strich(0.16)}/>`;
  const schieber = (x, tc) => { let s = `<path d="${pp([Q(x - 0.22, 2.4), Q(x + 0.22, 2.4), Q(x + 0.22, 20.4), Q(x - 0.22, 20.4)], true)}" ${tinte(0.5)}/>`;
    for (let i = 0; i <= 8; i++){ const t = 2.8 + 2.2 * i; s += `<path d="${pp([Q(x - (i % 4 === 0 ? 2.1 : 1.8), t), Q(x - 1.3, t)])}" ${strich(0.1, 0.65)}/>`; }
    const o = [Q(x - 1.15, tc - 0.7, 1.1), Q(x + 1.15, tc - 0.7, 1.1), Q(x + 1.15, tc + 0.7, 1.1), Q(x - 1.15, tc + 0.7, 1.1)], u = o.map(([a, b, c]) => [a, b - 0.5 * 0.9, c + S60 * 0.9]);
    s += `<path d="${pp(u, true)}" ${strich(0.14, 0.6)}/><path d="${o.map((p, i) => pp([u[i], p])).join(' ')}" ${strich(0.14, 0.7)}/><path d="${pp(o, true)} ${pp([Q(x - 1.15, tc, 1.1), Q(x + 1.15, tc, 1.1)])}" ${strich(0.2)}/>`;
    return s; };
  const knoepfe = [[7, 18.5, 1.5, 2.2], [7, 12, 1.5, 1.2], [7, 5.5, 1.5, 0.4],
    [19, 18.5, 1.5, 2.6], [27, 18.5, 2, 1.4], [35, 18.5, 1.5, 0.2], [19, 12, 1.5, 2.0], [27, 12, 2, 1.9], [35, 12, 1.5, 3.4], [19, 5.5, 1.5, 1.0], [27, 5.5, 2, 2.4], [35, 5.5, 1.5, 0.8],
    [44.5, 18.5, 1.4, 1.6], [44.5, 12, 1.4, 0.6], [44.5, 5.5, 1.4, 2.8],
    [60.2, 14.2, 3, 1.0], [67, 19.6, 1.2, 2.2], [67, 13.2, 1.2, 0.9], [93.5, 18.5, 1.9, 1.3]];
  g += `<path d="${linie(ring(60.2, 14.2, 5.4, 0, 48), true)}" ${strichel(0.12, 0.4, 0.6, 0.7)}/><path d="${pp([Q(53.6, 14.2), Q(66.8, 14.2)])} ${pp([Q(60.2, 7.6), Q(60.2, 20.8)])}" ${strichel(0.1, 0.35, 0.6, 0.7)}/>`
    + knoepfe.map(([x, t, r, psi]) => knopf(x, t, r, psi)).join('') + [18.5, 12, 5.5].map(t => schalter(50.5, t)).join('')
    + [[73.5, 15], [77.5, 8.5], [81.5, 12.5], [85.5, 6]].map(([x, tc]) => schieber(x, tc)).join('')
    + ['a', 'd', 's', 'r'].map((b, i) => { const [x, y] = QP(73.5 + 4 * i + 0.9, 1.4); return txt(x, y, 1.4, b, 0.65); }).join('');
  // Lämpchen (Edelstein) und Buchsen
  { const m = QP(93.5, 13.2, 0.8), r1 = ring(93.5, 13.2, 1.1), r2 = ring(93.5, 13.2, 0.7, 0.8, 24);
    g += `<path d="${linie(r1, true)} ${linie(r2, true)}" ${strich(0.18)}/><path d="${[0, 4, 8, 12, 16, 20].map(i => linie([m, r2[i]])).join(' ')}" ${strich(0.1, 0.6)}/>`; }
  const jacks = [[11.5, 3.5], [57.5, 4.2], [61.5, 4.2], [65.5, 4.2], [91, 8.6], [96, 8.6], [91, 4.2], [96, 4.2]];
  g += jacks.map(([x, t]) => buchse(x, t)).join('');
  // Tastatur: Bett links mit zwei Rädern, 22 weiße Tasten (drei Oktaven und ein C), schwarze als Kästchen mit Schraffur
  const KX = 16, KB = 80 / 22, WY = 5.2, SY = 6.6;
  g += `<path d="${pp([[0, 4.4, 0.3], [16, 4.4, 0.3], [16, 4.4, 14.8], [0, 4.4, 14.8]], true)} ${pp([[0, 3.8, 0], [0, 4.4, 0.3]])}" ${strich(0.2, 0.7)}/>`
    + `<path d="${pp([[0, 6.2, 14.8], [100, 6.2, 14.8]])} ${pp([[0, 6.2, 16], [100, 6.2, 16]])} ${pp([[KX, WY, 14.8], [KX, 6.2, 14.8]])}" ${strich(0.18, 0.75)}/>`;
  for (const wx of [4, 9]){ const r = 4.3, mz = 8.2, my = 4.4;
    g += `<path d="${pp([[wx - 0.6, my, 3], [wx + 2.2, my, 3], [wx + 2.2, my, 13.4], [wx - 0.6, my, 13.4]], true)}" ${tinte(0.16)}/><path d="${pp([[wx - 0.6, my, 3], [wx + 2.2, my, 3], [wx + 2.2, my, 13.4], [wx - 0.6, my, 13.4]], true)}" ${strich(0.14, 0.7)}/>`;
    const bog = (x) => Array.from({ length: 25 }, (_, i) => { const a = Math.PI * i / 24; return [x, my + r * Math.sin(a), mz + r * Math.cos(a)]; });
    g += `<path d="${pp(bog(wx))}" ${strich(0.16, 0.6)}/><path d="${pp(bog(wx + 1.6), true)}" ${strich(0.24)}/>`
      + `<path d="${Array.from({ length: 11 }, (_, i) => { const a = Math.PI * (i + 1) / 12; return pp([[wx, my + r * Math.sin(a), mz + r * Math.cos(a)], [wx + 1.6, my + r * Math.sin(a), mz + r * Math.cos(a)]]); }).join(' ')}" ${strich(0.1, 0.6)}/>`; }
  { const xs = Array.from({ length: 23 }, (_, j) => KX + j * KB);
    g += `<path d="${pp([[KX, WY, 0.5], [96, WY, 0.5]])} ${pp([[KX, 3.9, 0.5], [96, 3.9, 0.5]])} ${xs.map(x => pp([[x, 3.9, 0.5], [x, WY, 0.5], [x, WY, 14.8]])).join(' ')}" ${strich(0.18)}/>`;
    for (let j = 0; j < 21; j++){ if (![0, 1, 3, 4, 5].includes(j % 7)) continue; const xm = KX + (j + 1) * KB + ([0, 3].includes(j % 7) ? -0.25 : [1, 5].includes(j % 7) ? 0.25 : 0), b = 1.05, z0 = 5.6, z1 = 14.8;
      const oben = [[xm - b, SY, z0], [xm + b, SY, z0], [xm + b, SY, z1], [xm - b, SY, z1]];
      const stirn = [[xm - b, SY, z0], [xm - b, WY, z0], [xm + b, WY, z0], [xm + b, SY, z0]], flanke = [[xm + b, SY, z0], [xm + b, WY, z0], [xm + b, WY, z1], [xm + b, SY, z1]];
      g += `<path d="${pp(flanke, true)}" ${tinte(0.55)}/><path d="${pp(oben, true)}" ${tinte(0.7)}/><path d="${pp(stirn, true)}" ${tinte(0.88)}/>`
        + `<path d="${pp(oben, true)} ${pp(stirn)} ${pp([[xm + b, WY, z0], [xm + b, WY, z1 - 0.6]])}" ${strich(0.16)}/>`
        + `<path d="${pp([[xm - b + 0.35, SY, z0 + 0.5], [xm - b + 0.35, SY, z1 - 0.5]])}" fill="none" stroke="#f6eedb" stroke-opacity="0.45" stroke-width="${W.sw(0.12)}" stroke-linecap="round"/>`; } }
  // Patchkabel: Stecker entlang der Feldnormale, Kabel als hängender Bogen (zwei Linien im Abstand der Kabeldicke)
  const kabel = ([xa, ta], [xb, tb], sag) => { const a0 = QP(xa, ta, 0.2), a1 = QP(xa, ta, 2.4), b0 = QP(xb, tb, 0.2), b1 = QP(xb, tb, 2.4);
    const bahn = kubik(a1, [a1[0] + NV[0] * 2, a1[1] + sag], [b1[0] + NV[0] * 2, b1[1] + sag], b1, 30);
    const stecker = (p0, p1) => `<path d="${linie([p0, p1])}" ${strich(0.55, 0.8)}/><path d="${linie([p0, p1])}" fill="none" stroke="#f6eedb" stroke-opacity="0.55" stroke-width="${W.sw(0.2)}" stroke-linecap="round"/>`;
    return `<path d="${linie(versatz(bahn, 0.3))} ${linie(versatz(bahn, -0.3))}" ${strich(0.16)}/>` + stecker(a0, a1) + stecker(b0, b1); };
  g += kabel([57.5, 4.2], [91, 4.2], 7) + kabel([61.5, 4.2], [11.5, 3.5], 9) + kabel([96, 8.6], [65.5, 4.2], 4.5);
  // Maßkette an der Vorderkante: Räder | drei Oktaven | das hohe C | Wange
  const mk = [0, KX, KX + 7 * KB, KX + 14 * KB, KX + 21 * KB, 96, 102].map(x => P(x, 0, 0)[0]);
  g += mk.map(x => `<path d="M${n2(x)},${Y0 + 0.8} L${n2(x)},${Y0 + 4.2}" ${strichel(0.12, 0.35, 0.6, 0.8)}/>`).join('') + kette(mk, Y0 + 3.4)
    + spiegel(P(KX + 10.5 * KB, 0, 0)[0], Y0 + 6.6, 2, 'tre ottave', 0.55)
    + spiegel(58, 50.6, 3.4, 'strumento a corrente') + txt(58, 55.4, 2.6, 'Orgel ohne Blasebalg – der Blitz spielt mit', 0.6);
  return g;
}

/* ---------------------------------------------------------------- E-Bass (Precision): Mensur 86 Einheiten (Sattel 20, Steg 106)
   Bünde nach 2^(−n/12) wie bei der Gitarre; geteilter Tonabnehmer, großes Schlagbrett, Reglerplatte schräg, Kopf mit vier
   Mechaniken auf der Bassseite. Das Schlagbrett endet an den Halskanten, damit unter dem Hals keine Linie durchscheint. */
function bass(W){
  const { strich, strichel, tinte, txt, spiegel, sichel, kette } = W;
  const SATTEL = 20, MENSUR = 86, STEG = SATTEL + MENSUR, bund = (n) => SATTEL + MENSUR * (1 - Math.pow(2, -n / 12));
  const halsL = (y) => 17.78 - (y - SATTEL) * 1.08 / 60.2, halsR = (y) => 22.22 + (y - SATTEL) * 1.08 / 60.2;
  /* Korpus offen an den Halskanten (Hals liegt darüber); Bassseite mit dem längeren Horn, Taille versetzt */
  const koerper = 'M16.95,70.2 C14.5,67.5 11,62 8.4,61.2 C6,60.5 4.4,62 4,64.5 C3.6,67 1.6,70 1.4,75 C1.2,80 3.9,82.5 3.8,87 C3.7,91 0.4,95 0.6,102 C0.9,110 10,115 20,115 C30,115 39.2,110 39.4,102 C39.6,95 36.3,91 36.3,87 C36.3,83 38.6,81 38.4,77 C38.2,72.5 35.5,69 34.2,67.6 C33,66.3 31,65.6 29.8,66.6 C28.4,67.8 26.4,70.2 23.05,70.2';
  let g = '';
  // Konstruktion: Achse, Zirkel um Ober- und Unterbug
  g += `<line x1="20" y1="-3" x2="20" y2="119" ${strichel(0.18, 0.4, 1.6, 1.1)}/><circle cx="20" cy="100.5" r="19.8" ${strichel(0.18, 0.3, 0.8, 1)}/><circle cx="20" cy="75.5" r="18.6" ${strichel(0.18, 0.3, 0.8, 1)}/>`;
  g += sichel(koerper + ' Z', [-1, 42, 56, 118], [[0.3, 1.5, 45, -200, 0, 0.13], [0.6, 1.05, 45, -12, -5, 0.16], [0.45, 1.3, -45, -4, -2, 0.14]]) + `<path d="${koerper}" ${strich(0.32)}/>`;
  // Schlagbrett mit Schrauben
  const brett = 'M16.85,73.2 C14.6,69.6 11.6,64.6 9.2,63.9 C7.2,63.3 6,65 5.6,67.8 C5.2,71 6.8,75 6.6,79 C6.4,83 5.4,88 6.6,92.5 C7.6,95.5 11,95.6 13.5,94.6 C16,93.6 18,93.8 20,94.8 C22.5,96 25.5,95.4 27,92.8 C28.2,90.6 28.2,86 30.6,83 C33,80 35.6,77.4 35.3,74.2 C35,71 32.2,69.8 29.4,70.6 C26.8,71.3 24.3,71.8 23.15,73.2';
  /* Schrauben in gleichen Abständen 0,9 innerhalb der Kante */
  { const pts = pfadPunkte(brett, 12), zu = pts.concat([[20, 76]]), lang = [0]; for (let i = 1; i < pts.length; i++) lang.push(lang[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const ges = lang[lang.length - 1], n = 13, links = versatz(pts, 0.9), rechts = versatz(pts, -0.9), innenSeite = innen(zu, links[Math.floor(pts.length / 2)]) ? links : rechts;
    for (let j = 0; j < n; j++){ const ziel = ges * (j + 0.5) / n, i = lang.findIndex(l => l >= ziel), p = innenSeite[Math.max(0, i)]; g += `<circle cx="${n2(p[0])}" cy="${n2(p[1])}" r="0.32" ${strich(0.14, 0.75)}/>`; } }
  g += `<path d="${brett}" ${strich(0.22)}/>`;
  // Reglerplatte schräg: Lautstärke, Klang, Buchse
  g += `<g transform="translate(32.6 100.6) rotate(55)"><rect x="-6.8" y="-2.2" width="13.6" height="4.4" rx="2.2" ${strich(0.22)}/>`
    + [-3.6, 1.2].map(a => `<circle cx="${a}" cy="0" r="1.7" ${strich(0.22)}/><circle cx="${a}" cy="0" r="1.15" ${strich(0.14, 0.6)}/>` + Array.from({ length: 12 }, (_, i) => { const w = Math.PI * i / 6; return `<line x1="${n2(a + 1.7 * Math.cos(w))}" y1="${n2(1.7 * Math.sin(w))}" x2="${n2(a + 1.95 * Math.cos(w))}" y2="${n2(1.95 * Math.sin(w))}" ${strich(0.1, 0.6)}/>`; }).join('')).join('')
    + `<circle cx="5" cy="0" r="0.9" ${strich(0.2)}/><circle cx="5" cy="0" r="0.45" ${tinte(0.6)}/><circle cx="-6" cy="0" r="0.3" ${strich(0.12)}/><circle cx="6.1" cy="-1.3" r="0.3" ${strich(0.12)}/></g>`;
  // Hals mit Griffbrett, Bünden, Punkten
  g += `<path d="M17.78,${SATTEL} L22.22,${SATTEL} L23.3,79.8 Q23.3,80.6 22.5,80.6 L17.5,80.6 Q16.7,80.6 16.7,79.8 Z" ${strich(0.28)}/>`;
  for (let n = 1; n <= 20; n++){ const y = bund(n); g += `<line x1="${n2(halsL(y) + 0.1)}" y1="${n2(y)}" x2="${n2(halsR(y) - 0.1)}" y2="${n2(y)}" ${strich(0.14, 0.7)}/>`; }
  for (const n of [3, 5, 7, 9, 12, 15, 17, 19]){ const y = (bund(n - 1) + bund(n)) / 2; g += (n === 12 ? [18.9, 21.1] : [20]).map(x => `<circle cx="${x}" cy="${n2(y)}" r="0.36" ${strich(0.14)}/>`).join(''); }
  // Kopf: Fender-Form, vier Mechaniken links (E am Sattel, G an der Spitze), Saitenniederhalter, gespiegeltes Zeichen
  g += `<path d="M17.78,${SATTEL} L16.6,3 Q16.5,0.6 19,0.6 L23.5,0.8 Q27,1.2 26.4,4.5 C26,7 24,8.5 24.2,11 C24.4,13.5 26.4,15 25.8,17 C25.3,18.8 23,19 22.22,${SATTEL}" ${strich(0.28)}/>`
    + `<rect x="17.78" y="${SATTEL - 0.4}" width="4.44" height="0.8" ${strich(0.2)}/>` + `<g transform="rotate(-86 23.4 10.6)">${spiegel(23.4, 11.2, 1.7, 'Precisione', 0.6)}</g>`;
  const pfosten = [16.4, 12.2, 8, 3.8];
  for (const y of pfosten){ const kante = 17.78 - (SATTEL - y) * 1.18 / 17;
    g += `<circle cx="17.9" cy="${y}" r="1.15" ${strich(0.14, 0.6)}/><circle cx="17.9" cy="${y}" r="0.75" ${strich(0.2)}/>`
      + `<rect x="${n2(kante - 1.5)}" y="${n2(y - 1)}" width="1.7" height="2" rx="0.3" ${strich(0.18)}/><path d="M${n2(kante - 1.5)},${n2(y)} L${n2(kante - 3)},${n2(y)}" ${strich(0.26)}/>`
      + `<path d="M${n2(kante - 3)},${n2(y)} C${n2(kante - 3.1)},${n2(y - 1.7)} ${n2(kante - 6.4)},${n2(y - 1.9)} ${n2(kante - 6.6)},${n2(y)} C${n2(kante - 6.4)},${n2(y + 1.9)} ${n2(kante - 3.1)},${n2(y + 1.7)} ${n2(kante - 3)},${n2(y)} Z M${n2(kante - 3.6)},${n2(y)} L${n2(kante - 6)},${n2(y)}" ${strich(0.2)}/>`; }
  g += `<rect x="20.1" y="9.6" width="1.2" height="1.4" rx="0.5" ${strich(0.16)}/>`;
  // Saiten: Sattel -> Steg, am Kopf zu den Pfosten (G über den Niederhalter)
  const amSattel = [18.6, 19.53, 20.47, 21.4], amSteg = [17.15, 19.05, 20.95, 22.85];
  g += amSattel.map((x, i) => `<path d="M${x},${SATTEL} L${amSteg[i]},${STEG - 0.6} L${amSteg[i]},108.6" ${strich(0.1 + 0.03 * (3 - i), 0.65)}/>`).join('')
    + `<path d="M18.6,${SATTEL} L18.7,16.4 M19.53,${SATTEL} L18.7,12.2 M20.47,${SATTEL} L18.7,8 M21.4,${SATTEL} L20.7,11 L18.7,3.8" ${strich(0.12, 0.65)}/>`;
  // geteilter Tonabnehmer: E/A näher am Hals, D/G näher am Steg, je zwei Polstücke pro Saite
  for (const [x0, y0, saiten] of [[15.6, 86.2, [0, 1]], [19.5, 88.9, [2, 3]]]){
    g += `<rect x="${x0}" y="${y0}" width="5.3" height="2.8" rx="1.3" ${strich(0.24)}/><circle cx="${n2(x0 - 0.6)}" cy="${n2(y0 + 1.4)}" r="0.35" ${strich(0.14)}/><circle cx="${n2(x0 + 5.9)}" cy="${n2(y0 + 1.4)}" r="0.35" ${strich(0.14)}/>`;
    for (const i of saiten){ const x = amSattel[i] + (amSteg[i] - amSattel[i]) * (y0 + 1.4 - SATTEL) / (STEG - SATTEL); g += `<circle cx="${n2(x - 0.4)}" cy="${n2(y0 + 1.4)}" r="0.28" ${tinte(0.7)}/><circle cx="${n2(x + 0.4)}" cy="${n2(y0 + 1.4)}" r="0.28" ${tinte(0.7)}/>`; } }
  // Steg: Platte, vier Reiter mit Oktavschrauben, Gurtknöpfe
  g += `<path d="M14.8,104 L25.2,104 L25.2,109.4 L14.8,109.4 Z M14.8,108.6 L25.2,108.6" ${strich(0.24)}/>`
    + amSteg.map((x, i) => { const y = 104.6 + [0.6, 0.2, 0.5, 0.0][i]; return `<rect x="${n2(x - 0.75)}" y="${n2(y)}" width="1.5" height="1.7" rx="0.3" ${strich(0.18)}/><path d="M${n2(x)},${n2(y + 1.7)} L${n2(x)},108.6" ${strich(0.12, 0.7)}/>`; }).join('')
    + [[15.5, 104.7], [24.5, 104.7], [15.5, 107.6], [24.5, 107.6]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="0.3" ${strich(0.12)}/>`).join('')
    + `<circle cx="5.2" cy="61.3" r="0.6" ${strich(0.18)}/><circle cx="20" cy="115.6" r="0.6" ${strich(0.18)}/>`;
  // Maßkette rechts: Sattel, Oktave (12. Bund, die Hälfte), Steg
  g += `<path d="M26.6,${SATTEL} L43,${SATTEL} M24.6,${n2(bund(12))} L43,${n2(bund(12))} M40.2,${STEG} L43,${STEG}" ${strichel(0.12, 0.35, 0.6, 0.8)}/>`
    + kette([SATTEL, bund(12), STEG], 44.2, true) + txt(45.8, (SATTEL + bund(12)) / 2 + 0.8, 2.4, '½', 0.6, 'start') + txt(45.8, (bund(12) + STEG) / 2 + 0.8, 2.4, '½', 0.6, 'start')
    + `<g transform="rotate(90 47 94)">${spiegel(47, 94, 2.6, 'basso elettrico', 0.65)}</g>`
    + spiegel(20, 121.4, 3.4, 'fa tremare le finestre di Milano') + txt(20, 126.4, 2.6, 'E-Bass, der Mailands Fenster zittern lässt', 0.6);
  return g;
}

/* ---------------------------------------------------------------- Flügel in Draufsicht, ohne Deckel (Cristoforis
   „gravicembalo col piano e forte"): Gehäuse mit Hohlschwung (Zirkelbogen, Mittelpunkt außerhalb), Gussrahmen mit Streben und
   Rosetten, kreuzsaitiger Bezug (Bass über dem Tenor), Stege, Dämpferreihe; vorn die Mechanik offen (Hämmer, Waagebalken,
   Tastenhebel), daneben ein Hammer im Schnitt. Licht von oben links: Zarge rechts im Schatten. */
function klavier(W){
  const { strich, strichel, tinte, txt, spiegel, schattig, kette } = W;
  const umriss = [], dazu = (pts) => { for (const p of pts){ const q = umriss[umriss.length - 1]; if (!q || Math.hypot(q[0] - p[0], q[1] - p[1]) > 1e-6) umriss.push(p); } };
  const BOG = (a) => [60 + 40 * Math.cos(a * Math.PI / 180), 10 + 40 * Math.sin(a * Math.PI / 180)];
  dazu(gerade([2, 78], [2, 12], 24)); dazu(kubik([2, 12], [2, 4], [5, 1.5], [10, 1.5], 12)); dazu(kubik([10, 1.5], [15, 1.5], [18.6, 4.2], [19.6, 7.4], 10));
  dazu(kubik([19.6, 7.4], [19.85, 8.3], [20, 9.1], [20, 10], 4)); for (let a = 180; a >= 120; a -= 2) dazu([BOG(a)]);
  dazu(kubik([40, 44.64], [43.5, 46.6], [47, 50], [47, 56], 10)); dazu(gerade([47, 56], [47, 78], 8));
  const bis = (pts, y) => { const v = pts.filter(p => p[1] <= y); return [[v[0][0], y], ...v, [v[v.length - 1][0], y]]; };
  let g = '';
  // Konstruktion: Achse der Tastatur, der Zirkelbogen des Hohlschwungs über die Enden hinaus, Halbmesser zum Mittelpunkt
  g += `<line x1="24.5" y1="-1" x2="24.5" y2="91" ${strichel(0.16, 0.32, 1.6, 1.1)}/>`
    + `<path d="${linie(Array.from({ length: 9 }, (_, i) => BOG(196 - i * 2)))} ${linie(Array.from({ length: 8 }, (_, i) => BOG(118 - i * 1.6)))}" ${strichel(0.16, 0.4, 0.8, 0.9)}/>`
    + `<path d="${linie([BOG(150), [BOG(150)[0] + 0.866 * 12, BOG(150)[1] - 0.5 * 12]])}" ${strichel(0.14, 0.4, 0.8, 0.9)}/>`
    + `<path d="M${n2(BOG(150)[0] + 9.8)},${n2(BOG(150)[1] - 6.8)} L${n2(BOG(150)[0] + 10.4)},${n2(BOG(150)[1] - 6)} L${n2(BOG(150)[0] + 9.4)},${n2(BOG(150)[1] - 5.7)}" ${strich(0.14, 0.5)}/>`;
  // Zarge: außen, innen, Schatten im Zargenband rechts
  const zi = versatz(umriss, 1.2);
  g += schattig(linie(umriss, true) + ' ' + linie(zi.slice().reverse(), true), [[0.6, 0.55, 45, 19, 49, 0, 79, 0.13]], 'evenodd')
    + `<path d="${linie(umriss, true)}" ${strich(0.34)}/><path d="${linie(zi)}" ${strich(0.2)}/>`;
  // Gussrahmen: Außenkante, Öffnung, Streben, Rosetten
  const ra = bis(versatz(umriss, 2.4), 68.8), ri = bis(versatz(umriss, 5.2), 60);
  g += `<path d="${linie(ra, true)}" ${strich(0.24)}/><path d="${linie(ri, true)}" ${strich(0.2)}/>`;
  const streben = [[14.2, [0.05, -1]], [24.6, [-0.02, -1]], [33.6, [0, -1]], [41.2, [0, -1]]];
  for (const [x, d0] of streben){ const d = einheit(d0), nx = -d[1], ny = d[0];
    const seite = (o) => { const a = [x + nx * o, 59.7 + ny * o], b = bisZumRand(ri, a, d); return linie([[a[0], 60], b]); };
    g += `<path d="${seite(0.6)} ${seite(-0.6)}" ${strich(0.2)}/><path d="${seite(0)}" ${strich(0.08, 0.4)}/>`; }
  for (const x of [8.8, 19.4, 29.2, 37.6]){ const c = `M${x - 1.35},63.2 A1.35,1.35 0 1 0 ${x + 1.35},63.2 A1.35,1.35 0 1 0 ${x - 1.35},63.2 Z`;
    g += schattig(c, [[0.75, 0.32, 45, x - 2, x + 2, 61, 65.5, 0.1]]) + `<circle cx="${x}" cy="63.2" r="1.35" ${strich(0.2)}/><circle cx="${x}" cy="63.2" r="1.7" ${strich(0.12, 0.5)}/>`; }
  // Bezug: Tenor und Diskant (zum Schwanz hin leicht nach links gefächert), Bass darüber nach rechts gefächert
  const hz = versatz(umriss, 3.6), steg = versatz(umriss, 6.4), saiten = [];
  for (let x = 15.4; x <= 44.1; x += 0.74) saiten.push({ x, y: 66.6, d: einheit([-Math.max(0, 23.5 - x) * 0.004, -1]), bass: false });
  for (let i = 0; i < 13; i++) saiten.push({ x: 6.1 + 0.66 * i, y: 67.4, d: einheit([0.07, -1]), bass: true });
  let bez = '', bassBez = '', stifte = '', stegPunkte = '', bassSteg = [], daempfer = '';
  for (const s of saiten){ const ende = bisZumRand(hz, [s.x, s.y], s.d), seg = `M${n2(s.x)},${n2(s.y)} L${n2(ende[0])},${n2(ende[1])} `;
    if (s.bass) bassBez += seg; else bez += seg;
    stifte += `<circle cx="${n2(s.x - 0.18)}" cy="${n2(s.y - 0.1)}" r="0.17"/><circle cx="${n2(s.x + 0.18)}" cy="${n2(s.y + 0.7)}" r="0.17"/><circle cx="${n2(ende[0])}" cy="${n2(ende[1])}" r="0.14"/>`;
    if (s.bass){ const L = Math.hypot(ende[0] - s.x, ende[1] - s.y) - 4.6; bassSteg.push([s.x + s.d[0] * L, s.y + s.d[1] * L]); }
    else if (s.x > 14.5){ const p = bisZumRand(steg, [s.x, s.y], s.d); if (p[1] < 64) stegPunkte += `<circle cx="${n2(p[0])}" cy="${n2(p[1])}" r="0.13"/>`; }
    if (s.x < 37.5){ const t = (s.y - 58.4) / -s.d[1], px = s.x + s.d[0] * t;
      if (!streben.some(([sx]) => Math.abs(px - (sx + 0.03 * 1.6)) < 1)) daempfer += `<rect x="${n2(px - 0.25)}" y="${s.bass ? 57.2 : 57.5}" width="0.5" height="${s.bass ? 2.4 : 1.9}" rx="0.12"/>`; } }
  const stegLinie = (d) => linie(versatz(umriss, d).filter(p => p[0] >= 14.5 && p[1] <= 63.5));
  g += `<path d="${stegLinie(6.0)} ${stegLinie(6.9)}" ${strich(0.2)}/>` + `<path d="${bez}" ${strich(0.09, 0.7)}/>`
    + `<path d="${linie(versatz(bassSteg, 0.45))} ${linie(versatz(bassSteg, -0.45))}" ${strich(0.2)}/><path d="${bassBez}" ${strich(0.15, 0.75)}/>`
    + `<g ${tinte(0.75)}>${stifte}${stegPunkte}</g><g ${strich(0.12, 0.8)}>${daempfer}</g>`;
  // offene Mechanik vorn: Bruchkante des Stimmstocks, Hämmer, Hammerleiste, Waagebalken mit Stiften, Tastenhebel
  const KX0 = 4.5, KB = 40 / 52;
  g += `<path d="${linie(Array.from({ length: 37 }, (_, i) => [2.8 + i * 1.2, 69.3 + (i % 2 ? 0.45 : -0.2)]))}" ${strich(0.16, 0.7)}/>`
    + `<path d="M${KX0},72.3 L44.5,72.3 M${KX0},75.2 L44.5,75.2 M${KX0},77.5 L44.5,77.5" ${strich(0.16, 0.7)}/>`
    + `<g ${strich(0.1, 0.8)}>${Array.from({ length: 88 }, (_, j) => `<rect x="${n2(KX0 + (j + 0.5) * 40 / 88 - 0.17)}" y="70" width="0.34" height="1.5" rx="0.15"/>`).join('')}</g>`
    + `<path d="${Array.from({ length: 53 }, (_, i) => `M${n2(KX0 + i * KB)},72.6 L${n2(KX0 + i * KB)},78`).join(' ')}" ${strich(0.07, 0.5)}/>`
    + `<g ${tinte(0.7)}>${Array.from({ length: 52 }, (_, i) => `<circle cx="${n2(KX0 + (i + 0.5) * KB)}" cy="75.2" r="0.12"/>`).join('')}</g>`
    + txt(46.2, 71.6, 1.8, 'a', 0.7, 'start');
  // Tastatur zwischen den Backen: 52 weiße, 36 schwarze (von A bis c''''')
  g += `<path d="M2,78 L2,85.8 Q2,86.8 3,86.8 L4.5,86.8 L4.5,78 M47,78 L47,85.8 Q47,86.8 46,86.8 L44.5,86.8 L44.5,78" ${strich(0.26)}/>`
    + `<path d="M${KX0},86.6 L44.5,86.6 M${KX0},78.6 L44.5,78.6 ${Array.from({ length: 51 }, (_, i) => `M${n2(KX0 + (i + 1) * KB)},78.6 L${n2(KX0 + (i + 1) * KB)},86.6`).join(' ')}" ${strich(0.1, 0.8)}/>`
    + `<g ${tinte(0.82)}>${Array.from({ length: 51 }, (_, i) => ['A', 'C', 'D', 'F', 'G'].includes('ABCDEFG'[i % 7]) ? `<rect x="${n2(KX0 + (i + 1) * KB - 0.23)}" y="78.6" width="0.46" height="4.7"/>` : '').join('')}</g>`;
  // Mechanik im Schnitt (oben rechts, in der Bucht des Hohlschwungs): Taste, Waage, Hebeglied, Stößer, Hammer, Saite, Dämpfer
  { let d = '';
    const H = 'M15.9,5.1 L16.1,2.6 Q16.6,1.65 17.3,1.65 Q18.1,1.65 18.4,2.6 L18.2,4.6 Z', T = 'M0,11 L15.6,11 L15.6,12.4 L0,12.4 Z';
    d += `<line x1="-0.5" y1="13.8" x2="21.5" y2="13.8" ${strich(0.16, 0.6)}/>` + schattig(T, [[0.45, 0.7, 45, 0, 16, 10, 13, 0.1]]) + `<path d="${T}" ${strich(0.24)}/><path d="M0,10.4 L4.6,10.4 L4.6,11" ${strich(0.2)}/>`
      + `<path d="M7.3,13.8 L8.7,13.8 L8,12.4 Z" ${strich(0.18)}/><rect x="12.6" y="10.2" width="0.8" height="0.8" ${strich(0.16)}/>`
      + `<path d="M11.2,9.6 L16.2,8 L16.4,8.9 L11.6,10.4 Z" ${strich(0.2)}/><circle cx="16.2" cy="8.4" r="0.4" ${strich(0.14)}/><path d="M16.6,8.4 L17.6,8.4 L17.6,13.8" ${strich(0.16, 0.7)}/>`
      + `<path d="M12.8,9.6 L13.1,6.7 L13.7,6.7 L13.5,9.4" ${strich(0.16)}/>`
      + `<circle cx="7.4" cy="6.3" r="0.5" ${strich(0.16)}/><path d="M7.7,6 L16.2,4.5 M7.8,6.6 L16.2,5.1" ${strich(0.16)}/><path d="M7.4,6.8 L7.4,13.8" ${strich(0.14, 0.6)}/>`
      + schattig(H, [[0.75, 0.3, 45, 15.5, 18.6, 1.4, 5.2, 0.1]]) + `<path d="${H}" ${strich(0.24)}/>`
      + `<line x1="5.5" y1="1.2" x2="22" y2="1.2" ${strich(0.18)}/><circle cx="5.5" cy="1.2" r="0.35" ${strich(0.14)}/>`
      + `<rect x="19.6" y="-0.8" width="1.6" height="1.9" rx="0.2" ${strich(0.2)}/><path d="M20.4,1.2 L20.4,9.6 M14.8,10.6 L21.4,9.4" ${strich(0.16)}/><circle cx="21.4" cy="9.4" r="0.35" ${strich(0.14)}/>`
      + `<path d="M19.4,5.6 Q19.9,4.1 19.2,2.8 M18.75,3.45 L19.2,2.8 L19.75,3.35" ${strich(0.14, 0.7)}/>`
      + spiegel(2.4, 9.7, 1.3, 'tasto', 0.6) + spiegel(12.4, 3.9, 1.3, 'martello', 0.6) + spiegel(20.4, -1.4, 1.3, 'smorzo', 0.6) + spiegel(9.6, 0.6, 1.3, 'corda', 0.6)
      + spiegel(10.6, 16.6, 1.9, 'come batte il martello', 0.65) + txt(-0.9, 2, 1.8, 'a', 0.7);
    g += `<g transform="translate(27.4 2.6)">${d}</g>`; }
  // Maßkette unter der Tastatur: jedes C, sieben Oktaven und eine kleine Terz
  const mk = [KX0, ...Array.from({ length: 8 }, (_, n) => KX0 + (2 + 7 * n) * KB), 44.5];
  g += kette(mk, 89.4) + spiegel(24.5, 92.2, 1.8, 'sette ottave e una terza', 0.55)
    + spiegel(24.5, 96.4, 3.4, 'gravicembalo a martelli') + txt(24.5, 100.8, 2.4, 'Hammerklavier, offen – man sieht, wie es schlägt', 0.6);
  return g;
}

function zeichnung(art, k, f, pre, esc, widmung = '', widmungFs){
  const W = werkzeug(k, f, pre, esc);
  switch (art){
    case 'gitarre': return gitarre(W, pre);
    case 'cello': return cello(W, pre, widmung, widmungFs);
    case 'drums': return drums(W);
    case 'synthesizer': return synthesizer(W);
    case 'bass': return bass(W);
    case 'klavier': return klavier(W);
    default: return '';
  }
}

/* Eine Studie oben links bei (x, y) mm, so hoch wie hoehe mm (samt Beschriftung). widmung (nur Cello): die lateinische Zeile unter
   „Violoncellum" (skizze-blatt.js setzt sie datengetrieben) – false lässt beide Zeilen weg, ohne Angabe nur „Violoncellum" */
export function studie(art, x, y, hoehe, f, { esc, widmung = '', widmungFs } = {}){
  if (!STUDIE_MASS[art]) return '';
  const k = hoehe / STUDIE_MASS[art].h, pre = `leo-${art}-${++zaehler}`;
  return `<g transform="translate(${n2(x)} ${n2(y)}) scale(${k.toFixed(4)})">${zeichnung(art, k, f, pre, esc || escStd, widmung, widmungFs)}</g>`;
}

/* Lupe: Kreis bei (x, y, r) mm auf kreideaufgehelltem Papier mit unruhigem Rand, darin der Ausschnitt (zx, zy, zr in eigenen
   Einheiten) noch einmal gezeichnet - Strich so stark wie außen -, doppelter Federrand, zwei Hinweislinien als äußere Tangenten
   an den kleinen Kreis um die Stelle in der Studie (quelle = { x, y, hoehe } der gezeichneten Studie), Titel in Pinyon. */
export function lupe(art, { x, y, r }, { zx, zy, zr, titel = '', unter = '' }, quelle, f, { esc } = {}){
  if (!STUDIE_MASS[art]) return '';
  const pre = `leo-lupe-${art}-${++zaehler}`, K = r / zr, e = esc || escStd, st = (mm, o = 0.85) => `fill="none" stroke="${SEPIA}" stroke-opacity="${o}" stroke-width="${n2(mm * f)}" stroke-linecap="round"`;
  const R2 = r + 1.1 * f;
  let s = `<defs><filter id="${pre}-kreide" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="${(0.22 / f).toFixed(4)}" numOctaves="3" seed="${7 + zaehler % 50}" result="t"/>`
    + `<feDisplacementMap in="SourceGraphic" in2="t" scale="${n2(3.2 * f)}" xChannelSelector="R" yChannelSelector="G"/></filter>`
    + `<filter id="${pre}-korn" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${(0.9 / f).toFixed(4)}" numOctaves="2" seed="5"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.35 -0.08"/><feComposite in2="SourceGraphic" operator="in"/></filter>`
    + `<radialGradient id="${pre}-licht" cx="0.42" cy="0.4" r="0.62"><stop offset="0" stop-color="#ffffff" stop-opacity="0.45"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>`
    + `<clipPath id="${pre}-k"><circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r)}"/></clipPath></defs>`;
  // Fundstelle in der Studie und die Hinweislinien
  if (quelle){ const kq = quelle.hoehe / STUDIE_MASS[art].h, sx = quelle.x + zx * kq, sy = quelle.y + zy * kq, sr = zr * kq, D = Math.hypot(sx - x, sy - y);
    s += `<circle cx="${n2(sx)}" cy="${n2(sy)}" r="${n2(sr)}" ${st(0.22, 0.7)}/>`;
    if (D > R2 + sr + 2 * f){ const th = Math.atan2(sy - y, sx - x), al = Math.acos(Math.max(-1, Math.min(1, (R2 - sr) / D)));
      for (const v of [1, -1]){ const a = th + v * al; s += `<line x1="${n2(x + R2 * Math.cos(a))}" y1="${n2(y + R2 * Math.sin(a))}" x2="${n2(sx + sr * Math.cos(a))}" y2="${n2(sy + sr * Math.sin(a))}" ${st(0.2, 0.6)}/>`; } } }
  s += `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r + 2.4 * f)}" fill="#f6eedb" fill-opacity="0.93" filter="url(#${pre}-kreide)"/>`
    + `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r + 1.6 * f)}" fill="#ffffff" filter="url(#${pre}-korn)"/>`
    + `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r)}" fill="url(#${pre}-licht)"/>`
    + `<g clip-path="url(#${pre}-k)"><g transform="translate(${n2(x - zx * K)} ${n2(y - zy * K)}) scale(${K.toFixed(4)})">${zeichnung(art, K, f, pre + '-z', e)}</g></g>`
    + `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r)}" ${st(0.36)}/><circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(R2)}" ${st(0.2, 0.8)}/>`;
  if (titel) s += `<text x="${n2(x)}" y="${n2(y + R2 + 6 * f)}" font-size="${n2(4.6 * f)}" fill="${SEPIA}" fill-opacity="0.85" text-anchor="middle" font-family="${SCHRIFT}">${e(titel)}</text>`;
  if (unter) s += `<text x="${n2(x)}" y="${n2(y + R2 + 10.2 * f)}" font-size="${n2(2.9 * f)}" fill="${SEPIA}" fill-opacity="0.65" text-anchor="middle" font-family="${SCHRIFT}">${e(unter)}</text>`;
  return s;
}
