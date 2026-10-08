/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
   SIEGEL AUS SIEGELLACK (Skizzenbuch, unten rechts; Übergabe §89). Caspar_D, 08.10.2026: „das sieht mir noch zu sehr nach Knete aus"
   – und vorher: „das siegel erscheint mir noch zu hoch … also zu viel 3d". Also flach, aber echt: ein dünn ausgelaufener Lackfladen
   mit fließendem Rand, satter Karmin, kleine harte Glanzlichter, darin der eingedrückte Stempel – scharfkantiger Wulst aus verdrängtem
   Lack um ein flaches Prägefeld, der Avatar als feines Relief –, darunter zwei Seidenbänder mit schräg geschnittenen Enden.
   Knete entstand, weil Farbe und Form getrennt gemalt waren (Verlauf als Farbe, weicher Schein obendrauf). Hier wird erst ein HÖHENBILD
   gezeichnet (Grauwert = Höhe: Fladen, Wulst, Prägefeld, Avatar, Perlkreis, Bläschen, Fließspuren) und ein einziger Filter macht daraus
   Licht und Farbe – so passen Glanz, Schatten und Relief zueinander wie bei einem echten Gegenstand. Ausgewählt aus einem Kontaktbogen
   mit sechs Fassungen: B (Caspar_D, 08.10.2026: „siegel B").
   Werkstattbefunde, die die Zahlen tragen:
   · Chromes Lichtfilter rechnen in Nutzereinheiten (gleiches Bild bei 2, 5 und 12 px/mm gemessen); die Seite misst in mm, darum
     skaliert alles mit f (Unschärfen, Versätze, surfaceScale, Rauschfrequenzen) und das Siegel sieht auf jedem Format gleich aus.
   · Das Höhenbild hat nur 8 Bit: sanfte Hänge zeigen sonst Höhenlinien. Darum nutzen die Höhen fast den ganzen Grauumfang (K) bei
     entsprechend kleinerem surfaceScale, und das Randprofil ist eine feine Tabelle – eine grobe zeichnet ihre Knicke als Ringe.
   · Glanz nur auf Hängen: das Glanzlicht steht tiefer (32°) als das Flächenlicht (58°); flache Stellen liegen dann weit außerhalb
     des Glanzkegels und flimmern nicht, Wulst und Ränder bekommen kurze harte Lichter.
   Maße in mm der Seite, f = kurz/500. Rückgabe: defs (Filter, Verläufe, Clips – alle IDs mit idVor), svg, kasten (alles Sichtbare
   samt Schlagschatten). */
const n2 = (v) => (+v).toFixed(2);
/* feste Saat: dasselbe Siegel auf jedem Blatt und in jedem Export */
function zufall(seed){ let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/* geschlossene Catmull-Rom-Kurve durch die Punkte; die Kontrollpunkte gehen in den Kasten (die Kurve liegt in ihrer Hülle) */
function glatt(p, huelle){ const n = p.length; let d = `M${n2(p[0][0])},${n2(p[0][1])}`;
  for (let i = 0; i < n; i++){ const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n], e = p[(i + 2) % n];
    const k1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6], k2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
    if (huelle) huelle.push(b, k1, k2);
    d += ` C${n2(k1[0])},${n2(k1[1])} ${n2(k2[0])},${n2(k2[1])} ${n2(c[0])},${n2(c[1])}`; }
  return d + 'Z'; }

/* Höhen (Grauwerte vor K): Fladen 0,1, Prägefeld 0,15, Relief +0,15, Wulstkamm ≈ 0,42 (H_WULST 0,36 über dem Fladen). K = 2,2 hebt den Kamm auf ≈ 0,93. */
const K = 2.2, H_FLADEN = 0.1, H_FELD = 0.15, H_RELIEF = 0.15, H_WULST = 0.36, TIEFE = 4.2;
const LACK = '#850d1b', LACK_DUENN = '#cc463d';
const BAND = { rand: '#4a0a15', mitte: '#7c1527', glanz: '#e7a3a6', kante: '#3a0610', winkel: 23, lang: 64, breit: 14, bug: 1.6 };

export function siegel({ cx, cy, f, avatarHref = '/avatar', mitAvatar = true, idVor = 'ps-sg' }){
  const z = zufall(11), id = (s) => `${idVor}-${s}`, huelle = [];
  /* 1. Fladen: Polarradius aus wenigen glatten Wellen und zwei Ausläufern (Lack fließt rund, nie zackig – Zacken waren Knete
     bzw. zerrissenes Papier); der Stempel sitzt nicht genau in der Mitte des Fladens. Ein verirrter Tropfen daneben. */
  const WELLEN = [[2, 0.055], [3, 0.045], [5, 0.03], [7, 0.018]], AUSLAEUFER = [[0.9, 4.5, 0.32], [3.6, 2.6, 0.28]];
  const ph = WELLEN.map(() => z() * 2 * Math.PI), N = 72, mx = cx - 1.0 * f, my = cy + 0.7 * f, rand = [];
  for (let i = 0; i < N; i++){ const t = i / N * 2 * Math.PI;
    let r = 30 * f * (1 + WELLEN.reduce((s, [k, a], j) => s + a * Math.sin(k * t + ph[j]), 0));
    for (const [th, h, b] of AUSLAEUFER){ const d = Math.atan2(Math.sin(t - th), Math.cos(t - th)); r += h * f * Math.exp(-d * d / (2 * b * b)); }
    rand.push([mx + r * Math.cos(t), my + r * Math.sin(t)]); }
  let fladen = glatt(rand, huelle);
  { const th = z() * 2 * Math.PI, [px, py] = rand[Math.round(th / (2 * Math.PI) * N) % N], rr = (0.9 + z() * 1.3) * f, ab = Math.hypot(px - mx, py - my) + rr + (1.2 + z() * 2.2) * f;
    const tx = mx + ab * Math.cos(th), ty = my + ab * Math.sin(th);
    fladen += ' ' + glatt(Array.from({ length: 10 }, (_, j) => { const u = j / 10 * 2 * Math.PI, q = rr * (1 + 0.15 * Math.sin(2 * u + th) + 0.08 * Math.sin(3 * u)); return [tx + q * Math.cos(u), ty + q * 0.85 * Math.sin(u)]; }), huelle); }
  const ri = 19.5 * f;
  let defs = '', sv = '';

  /* 2. Seidenbänder unter dem Lack. Seide liegt flach: quer fast einfarbig (nur die Webkanten dunkler), der Glanz wandert der Länge
     nach mit den sanften Wellen des Bandes; an der Engstelle dreht es sich leicht weg (dunkler). Unter dem Lack beginnt es im
     Schatten. Schräger Schnitt: die Außenkante ist die lange. */
  const bw = BAND.breit * f, bl = BAND.lang * f, L0 = 4 * f, schnitt = bw * 0.55, M = 24;
  const bandPfad = (seite) => {   /* lokal entlang +y; seite −1 = linkes Band (außen −x), +1 = rechtes (außen +x) */
    const kante = (sx) => { const tE = sx === seite ? 1 : 1 - schnitt / (bl - L0);
      return Array.from({ length: M + 1 }, (_, j) => { const t = j / M * tE, y = L0 + t * (bl - L0), xm = BAND.bug * f * Math.sin(Math.PI * t) * -seite,
        hw = bw / 2 * (1 - 0.14 * Math.exp(-Math.pow((t - 0.68) / 0.12, 2))); return [xm + sx * hw, y]; }); };
    const links = kante(-1), rechts = kante(1), pk = [...links, ...rechts.slice().reverse()], P = (q) => `${n2(q[0])},${n2(q[1])}`;
    const webkante = (arr, ins) => 'M' + arr.slice(0, M - 1).map(q => P([q[0] + ins, q[1]])).join(' L');
    return { d: 'M' + pk.map(P).join(' L') + 'Z', pk, kanten: webkante(links, 0.9 * f) + ' ' + webkante(rechts, -0.9 * f) };
  };
  const quer = id('quer'), laengs = id('laengs');
  defs += `<linearGradient id="${quer}" gradientUnits="userSpaceOnUse" x1="${n2(-bw / 2)}" y1="0" x2="${n2(bw / 2)}" y2="0">`
    + `<stop offset="0" stop-color="${BAND.rand}"/><stop offset="0.07" stop-color="${BAND.mitte}"/><stop offset="0.93" stop-color="${BAND.mitte}"/><stop offset="1" stop-color="${BAND.rand}"/></linearGradient>`
    + `<linearGradient id="${laengs}" gradientUnits="userSpaceOnUse" x1="0" y1="${n2(L0)}" x2="0" y2="${n2(bl)}">`
    + [[0, '#000', 0.5], [0.36, '#000', 0.3], [0.44, BAND.glanz, 0], [0.52, BAND.glanz, 0.22], [0.6, '#000', 0.04], [0.68, '#000', 0.26], [0.76, BAND.glanz, 0.12], [0.9, BAND.glanz, 0.02], [1, '#000', 0.12]]
      .map(([t, c, a]) => `<stop offset="${t}" stop-color="${c}" stop-opacity="${n2(a)}"/>`).join('') + `</linearGradient>`
    /* Faden der Seide: feine Längsstreifen, hell und dunkel, im gedrehten Band mitgedreht */
    + `<filter id="${id('seide')}" x="-5%" y="-2%" width="110%" height="104%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${n2(2.2 / f)} ${n2(0.08 / f)}" numOctaves="1" seed="4"/>`
    + `<feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.16 0 0 0 -0.07"/><feComposite in2="SourceAlpha" operator="in" result="hell"/>`
    + `<feTurbulence type="fractalNoise" baseFrequency="${n2(1.8 / f)} ${n2(0.06 / f)}" numOctaves="1" seed="9"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.14 0 0 0 0.075"/><feComposite in2="SourceAlpha" operator="in" result="dunkel"/>`
    + `<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="hell"/><feMergeNode in="dunkel"/></feMerge></filter>`
    + `<filter id="${id('bschatten')}" x="-10%" y="-5%" width="120%" height="110%"><feGaussianBlur stdDeviation="${n2(0.6 * f)}"/></filter>`;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const dazu = (X, Y) => { x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); };
  for (const [w, seite] of [[BAND.winkel, -1], [-BAND.winkel, 1]]){
    const p = bandPfad(seite), rad = w * Math.PI / 180, cs = Math.cos(rad), sn = Math.sin(rad);
    sv += `<g transform="translate(${n2(cx)} ${n2(cy)}) rotate(${w})">`
      + `<path d="${p.d}" fill="#2a1408" fill-opacity="0.28" transform="translate(${n2(0.5 * f)} ${n2(0.7 * f)})" filter="url(#${id('bschatten')})"/>`
      + `<g filter="url(#${id('seide')})"><path d="${p.d}" fill="url(#${quer})"/><path d="${p.d}" fill="url(#${laengs})"/>`
      + `<path d="${p.kanten}" stroke="${BAND.kante}" stroke-opacity="0.3" stroke-width="${n2(0.25 * f)}" fill="none"/></g></g>`;
    for (const [x, y] of p.pk) dazu(cx + x * cs - y * sn, cy + x * sn + y * cs);
  }
  for (const [x, y] of huelle) dazu(x, y);

  /* 3. Höhenbild. Der Fladen bekommt sein Randprofil aus der eigenen Unschärfe (am Rand ein flacher Meniskus, nach 2 mm die volle,
     dünne Lackhöhe); alles Weitere liegt im Fladen (Clip), damit der Lack nie über seinen Rand wächst. */
  const fx = mx - 48 * f, fy = my - 48 * f, fw = 96 * f, raum = `filterUnits="userSpaceOnUse" x="${n2(fx)}" y="${n2(fy)}" width="${n2(fw)}" height="${n2(fw)}"`;
  const profil = Array.from({ length: 33 }, (_, k) => { const t = Math.max(0, Math.min(1, (k / 32 - 0.3) / 0.7)); return n2(t * t * (3 - 2 * t)); }).join(' ');
  const hf = n2(H_FLADEN * K), rel = [0.2126, 0.7152, 0.0722].map(c => n2(K * H_RELIEF * c)).join(' ');
  defs += `<clipPath id="${id('fl')}"><path d="${fladen}"/></clipPath><clipPath id="${id('feld')}"><circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(ri)}"/></clipPath>`
    + `<filter id="${id('fladen')}" ${raum} color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="${n2(0.9 * f)}"/><feComponentTransfer><feFuncA type="table" tableValues="${profil}"/></feComponentTransfer>`
    + `<feColorMatrix values="0 0 0 ${hf} 0  0 0 0 ${hf} 0  0 0 0 ${hf} 0  0 0 0 0 1"/><feComposite in2="SourceAlpha" operator="in"/></filter>`
    + `<filter id="${id('wulst')}" ${raum}><feGaussianBlur stdDeviation="${n2(0.85 * f)}"/></filter>`
    + `<filter id="${id('spur')}" ${raum}><feGaussianBlur stdDeviation="${n2(0.45 * f)}"/></filter>`
    + `<filter id="${id('kante')}" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${n2(0.22 * f)}"/></filter>`
    + `<filter id="${id('weich')}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${n2(0.14 * f)}"/></filter>`
    /* Prägung: Helligkeit des Avatars = Höhe über dem Feld (sein schwarzer Grund liegt genau auf Feldhöhe), leicht verrundet wie Lack */
    + `<filter id="${id('relief')}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${n2(0.24 * f)}"/>`
    + `<feColorMatrix values="${rel} 0 ${n2(K * H_FELD)}  ${rel} 0 ${n2(K * H_FELD)}  ${rel} 0 ${n2(K * H_FELD)}  0 0 0 0 1"/></filter>`;
  /* Wulst: verdrängter Lack, der Kamm an der Stempelkante, außen unterschiedlich breit auslaufend (der Stempel saß schief).
     Weiß mit Deckkraft über dem Fladen: Höhe = Fladen + (1 − Fladen) · a; a = H_WULST, der Kamm liegt nach K bei ≈ 0,93. */
  const wpk = Array.from({ length: 36 }, (_, j) => { const u = j / 36 * 2 * Math.PI, q = 21.1 * f + 0.6 * f * (1 + Math.sin(2 * u + 1.3) + 0.7 * (1 + Math.sin(3 * u + 0.4))); return [cx + 0.5 * f + q * Math.cos(u), cy + 0.35 * f + q * Math.sin(u)]; });
  let hoehe = `<path d="${fladen}" fill="#fff" filter="url(#${id('fladen')})"/><g clip-path="url(#${id('fl')})">`
    + `<path d="${glatt(wpk)}" fill="#fff" fill-opacity="${n2(K * (1 - H_FLADEN) * H_WULST / (1 - H_FLADEN * K))}" filter="url(#${id('wulst')})"/>`;
  /* Bläschen: eingeschlossene Luft, kleine Mulden auf dem Fladen außerhalb der Prägung */
  let blasen = '';
  for (let k = 0; k < 6; k++){ const th = z() * 2 * Math.PI, d = (25.5 + z() * 4) * f, r = (0.25 + z() * 0.45) * f;
    blasen += `<circle cx="${n2(cx + d * Math.cos(th))}" cy="${n2(cy + d * Math.sin(th))}" r="${n2(r)}"/>`; }
  hoehe += `<g fill="#000" fill-opacity="${n2(0.16 * K)}" filter="url(#${id('weich')})">${blasen}</g>`;
  /* Fließspuren: wo ein späterer Tropfen über den ersten lief, bleibt eine flache Stufe parallel zum Rand */
  let spuren = '';
  for (let k = 0; k < 2; k++){ const i0 = Math.floor(z() * N), n = 14 + Math.floor(z() * 16), ein = (2.2 + z() * 2.4) * f;
    spuren += 'M' + Array.from({ length: n }, (_, j) => { const [px, py] = rand[(i0 + j) % N], dx = px - mx, dy = py - my, r = Math.hypot(dx, dy), e = ein + (1 - Math.sin(Math.PI * j / (n - 1))) * 2 * f;
      return `${n2(mx + dx * (r - e) / r)},${n2(my + dy * (r - e) / r)}`; }).join(' L') + ' '; }
  hoehe += `<path d="${spuren}" fill="none" stroke="#fff" stroke-opacity="${n2(0.05 * K)}" stroke-width="${n2(1.1 * f)}" stroke-linecap="round" filter="url(#${id('spur')})"/>`;
  /* Prägefeld: flach, an der Stempelkante leicht verrundet; darin der Avatar und ein Perlkreis wie auf alten Siegelstempeln */
  const grau = (h) => { const g = Math.round(K * h * 255); return `rgb(${g},${g},${g})`; };
  hoehe += `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(ri)}" fill="${grau(H_FELD)}" filter="url(#${id('kante')})"/>`;
  if (mitAvatar){ const ra = ri * 0.9; hoehe += `<image href="${avatarHref}" data-voll="${avatarHref}" x="${n2(cx - ra)}" y="${n2(cy - ra)}" width="${n2(2 * ra)}" height="${n2(2 * ra)}" clip-path="url(#${id('feld')})" filter="url(#${id('relief')})"/>`; }
  const rp = ri - 1.3 * f, np = Math.round(2 * Math.PI * rp / (1.15 * f));
  hoehe += `<g fill="${grau(H_FELD + 0.045)}" filter="url(#${id('weich')})">` + Array.from({ length: np }, (_, k) => { const u = k / np * 2 * Math.PI; return `<circle cx="${n2(cx + rp * Math.cos(u))}" cy="${n2(cy + rp * Math.sin(u))}" r="${n2(0.36 * f)}"/>`; }).join('') + '</g></g>';

  /* 4. Lack: aus dem Höhenbild Licht und Farbe.
     Flächenlicht (58°) mit Umgebungsanteil 0,35 – Schattenhänge werden dunkles Rot, nie Schwarz; normiert, dass die Ebene genau
     den Lackton hat. Glanzlicht tiefer (32°), steil (Exponent 60) und mit Schwelle: kurze harte Lichter nur auf Hängen zum Licht.
     Dazu ein Hauch breiter Schimmer. Dünne Stellen (nahe dem Rand, aus einer breiten Unschärfe der Form) heller und etwas
     durchscheinend; leichte Marmorierung des Lacks; flacher Schlagschatten nach rechts unten. */
  const ss = n2(TIEFE / K * f), licht = (el) => `<feDistantLight azimuth="225" elevation="${el}"/>`, grat = 'type="linear" slope="2.2" intercept="-0.2"';
  const duenn = Array.from({ length: 33 }, (_, k) => n2(Math.pow(Math.max(0, Math.min(1, (0.97 - k / 32) / 0.55)), 1.3) * 0.85)).join(' ');
  defs += `<filter id="${id('lack')}" ${raum} color-interpolation-filters="sRGB">`
    + `<feColorMatrix in="SourceGraphic" type="luminanceToAlpha"/><feComposite in2="SourceAlpha" operator="in" result="h"/>`
    + `<feDiffuseLighting in="h" surfaceScale="${ss}" diffuseConstant="1" lighting-color="#fff" result="d">${licht(58)}</feDiffuseLighting>`
    + `<feSpecularLighting in="h" surfaceScale="${ss}" specularConstant="1.2" specularExponent="60" lighting-color="#fff6ef" result="s0">${licht(32)}</feSpecularLighting>`
    + `<feGaussianBlur in="s0" stdDeviation="${n2(0.1 * f)}"/><feComponentTransfer result="s"><feFuncR ${grat}/><feFuncG ${grat}/><feFuncB ${grat}/><feFuncA ${grat}/></feComponentTransfer>`
    + `<feSpecularLighting in="h" surfaceScale="${ss}" specularConstant="0.06" specularExponent="9" lighting-color="#ffe2d8" result="schimmer">${licht(58)}</feSpecularLighting>`
    + `<feTurbulence type="fractalNoise" baseFrequency="${n2(0.07 / f)} ${n2(0.11 / f)}" numOctaves="3" seed="18"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.18 0 0 0 -0.07" result="marmor"/>`
    + `<feGaussianBlur in="SourceAlpha" stdDeviation="${n2(1.8 * f)}"/><feComponentTransfer><feFuncA type="table" tableValues="${duenn}"/></feComponentTransfer><feComposite in2="SourceAlpha" operator="in" result="duenn"/>`
    + `<feFlood flood-color="${LACK_DUENN}"/><feComposite in2="duenn" operator="in" result="duennFarbe"/>`
    + `<feFlood flood-color="#000"/><feComposite in2="marmor" operator="in" result="marmorDunkel"/>`
    + `<feFlood flood-color="${LACK}"/><feComposite in="marmorDunkel" operator="over"/><feComposite in="duennFarbe" operator="over" result="grund"/>`
    + `<feComposite in="grund" in2="d" operator="arithmetic" k1="${n2(0.65 / Math.sin(58 * Math.PI / 180))}" k2="0.35"/>`
    + `<feComposite in2="schimmer" operator="arithmetic" k2="1" k3="1"/><feComposite in2="s" operator="arithmetic" k2="1" k3="1"/><feComposite in2="SourceAlpha" operator="in" result="lack"/>`
    + `<feFlood flood-color="#fff"/><feComposite in2="duenn" operator="in" result="duennWeiss"/>`
    + `<feComposite in="lack" in2="duennWeiss" operator="arithmetic" k1="${n2(-0.14 / 0.85)}" k2="1" result="lack2"/>`
    + `<feGaussianBlur in="SourceAlpha" stdDeviation="${n2(0.55 * f)}"/><feOffset dx="${n2(0.45 * f)}" dy="${n2(0.65 * f)}"/><feComponentTransfer><feFuncA type="linear" slope="0.2"/></feComponentTransfer>`
    + `<feColorMatrix values="0 0 0 0 0.16  0 0 0 0 0.07  0 0 0 0 0.03  0 0 0 1 0" result="schatten"/><feMerge><feMergeNode in="schatten"/><feMergeNode in="lack2"/></feMerge></filter>`;
  sv += `<g filter="url(#${id('lack')})">${hoehe}</g>`;
  /* Schlagschatten von Lack (0,45/0,65 + 2σ) und Bändern (0,5/0,7 + 2σ) nach rechts unten */
  return { defs, svg: sv, kasten: { x0, y0, x1: x1 + 2 * f, y1: y1 + 2.3 * f } };
}
