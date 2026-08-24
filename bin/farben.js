/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ============================================================
   KlangTresor · Farben aus dem Artwork
   ------------------------------------------------------------
   Zieht aus jedem Cover die Farben, die wirklich darin vorkommen,
   und legt sie in den Katalog. Die Bühne färbt sich danach ein.

   Grundsatz: Es wird NICHTS erfunden. Jede Farbe der Palette ist
   ein Pixel, das im Cover tatsächlich steht. (Eine frühere Fassung
   hat aus einer Leitfarbe vier weitere im 72°-Abstand konstruiert -
   ein "Farbtonpentagramm". Das lieferte bei einem Rotwein-Cover
   Grün, Türkis und Magenta und ist ersatzlos entfallen.)

   Ablauf:
     1. ffmpeg verkleinert das Cover auf 64x64 Rohpixel
     2. Fast-Schwarz und Fast-Weiß raus - dort ist kein Farbton
        ablesbar. ABSOLUTE Grenzen, nicht relativ zur Verteilung
        des Bildes: Bei einem dunklen Cover ist dessen mittlere
        Hälfte selbst das Beinahe-Schwarz.
     3. Farbton-Histogramm auf dem Farbkreis
     4. Auswahl nach SPITZENBUNTHEIT je Ton, nicht nach Fläche -
        sonst gewinnt bei einem Regenbogen zweimal das Rot, weil
        Rot die größte Fläche hat
     5. Trennschärfe aus der Farbtonstreuung des Bildes ableiten
     6. Zusätzlich Abstand in OKLab prüfen - zwei Töne können sechs
        Grad auseinanderliegen und trotzdem dieselbe Farbe sein
     7. Rollen vergeben und Kontrast nach WCAG absichern

   Aufruf:  node bin/farben.js  [--neu]
   ============================================================ */

const fs   = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const K    = require('./katalog.js');

const WURZEL = path.join(__dirname, '..');
const SONGS  = path.join(WURZEL, 'library', 'songs');
const NEU    = process.argv.includes('--neu');
const RASTER = 64;

// --- Farbräume ---------------------------------------------------

const hex = ([r,g,b]) => '#' + [r,g,b]
  .map(x => Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,'0')).join('');

const zuLinear = (c) => { c/=255; return c<=0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); };

/* OKLab nach Björn Ottosson (2020). Gleicher Zahlenabstand
   entspricht dort ungefähr gleichem Seheindruck - in RGB nicht. */
function rgb2oklab(r,g,b){
  const R=zuLinear(r), G=zuLinear(g), B=zuLinear(b);
  const l = Math.cbrt(0.4122214708*R + 0.5363325363*G + 0.0514459929*B);
  const m = Math.cbrt(0.2119034982*R + 0.6806995451*G + 0.1073969566*B);
  const s = Math.cbrt(0.0883024619*R + 0.2817188376*G + 0.6299787005*B);
  return [
    0.2104542553*l + 0.7936177850*m - 0.0040720468*s,
    1.9779984951*l - 2.4285922050*m + 0.4505937099*s,
    0.0259040371*l + 0.7827717662*m - 0.8086757660*s,
  ];
}

function oklab2rgb(L,a,b){
  const l_=L+0.3963377774*a+0.2158037573*b;
  const m_=L-0.1055613458*a-0.0638541728*b;
  const s_=L-0.0894841775*a-1.2914855480*b;
  const l=l_**3, m=m_**3, s=s_**3;
  return [
     4.0767416621*l-3.3077115913*m+0.2309699292*s,
    -1.2684380046*l+2.6097574011*m-0.3413193965*s,
    -0.0041960863*l-0.7034186147*m+1.7076147010*s,
  ].map(c => (c<=0.0031308 ? 12.92*c : 1.055*Math.pow(Math.max(0,c),1/2.4)-0.055) * 255);
}

const buntheitVon = ([L,a,b]) => Math.hypot(a,b);
const hellVon     = ([L]) => L;
const tonVon      = ([L,a,b]) => (Math.atan2(b,a)*180/Math.PI + 360) % 360;
const abstand     = (a,b) => { const x=rgb2oklab(...a), y=rgb2oklab(...b);
                               return Math.hypot(x[0]-y[0], x[1]-y[1], x[2]-y[2]); };

/** Farbe aus Ton, Helligkeit, Buntheit - Buntheit wird notfalls
 *  zurückgenommen, bis sie darstellbar ist. */
function ausOklch(L, C, tonGrad){
  const h = tonGrad*Math.PI/180;
  for (let k=C; k>=0; k-=0.004){
    const rgb = oklab2rgb(L, Math.cos(h)*k, Math.sin(h)*k);
    if (rgb.every(v => v>=-0.5 && v<=255.5)) return rgb.map(v=>Math.max(0,Math.min(255,v)));
  }
  return oklab2rgb(L,0,0).map(v=>Math.max(0,Math.min(255,v)));
}

/* Selbstprüfung: Ein verrutschtes Komma in einer der neun
   Matrixzahlen fällt sonst nicht auf - die Werte sehen plausibel
   aus, sind aber falsch. Genau das ist schon einmal passiert. */
(function pruefe(){
  const [Lw,aw,bw] = rgb2oklab(255,255,255);
  const [,ag,bg]   = rgb2oklab(128,128,128);
  if (Math.abs(Lw-1)+Math.abs(aw)+Math.abs(bw)+Math.abs(ag)+Math.abs(bg) > 0.005){
    console.error('OKLab-Umrechnung fehlerhaft - Weiß ergibt nicht 1/0/0.');
    process.exit(1);
  }
})();

// --- WCAG-Kontrast ------------------------------------------------

/* Für den Kontrast bleibt es bei der relativen Luminanz. Nicht
   weil sie besser wäre als OKLab-L, sondern weil WCAG so definiert
   ist - mit einer anderen Größe stünden Zahlen da, die nicht
   bedeuten, was sie behaupten. */
function leuchtkraft(rgb){
  const v = rgb.map(c => { c = Math.max(0,Math.min(255,c))/255;
    return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); });
  return 0.2126*v[0] + 0.7152*v[1] + 0.0722*v[2];
}
function kontrast(a,b){
  const la=leuchtkraft(a), lb=leuchtkraft(b);
  return (Math.max(la,lb)+0.05) / (Math.min(la,lb)+0.05);
}

// --- Pixel ---------------------------------------------------------

/* VOLLE Auflösung, kein Verkleinern.
   Beim Verkleinern mittelt ffmpeg über Pixelblöcke, und kleine
   kräftige Details verschmelzen dabei mit ihrer Umgebung. Bei
   "Die Gedanken..." - hellblau mit goldgelb und winzigen roten
   Kameralinsen - überlebte bei 64x64 KEIN einziges rotes Pixel;
   bei voller Auflösung sind es 1254, und das bunteste Pixel des
   Covers hat statt 0,090 eine Buntheit von 0,227.

   Der Rohpuffer wird direkt weitergereicht und die abgeleiteten
   Größen in typisierten Feldern gehalten - bei 1,5 Millionen
   Pixeln wären Objekte je Pixel nicht tragbar. */
function pixel(datei){
  return new Promise((fertig) => {
    execFile('ffmpeg', ['-v','error','-i',datei,
      '-f','rawvideo','-pix_fmt','rgb24','-'],
      { encoding:'buffer', maxBuffer: 1<<30 }, (fehler, aus) => {
        if (fehler || !aus || aus.length < 3) return fertig(null);
        fertig(aus);
      });
  });
}

/** Rohpuffer in typisierte Felder überführen: Helligkeit, Buntheit,
 *  Farbton je Pixel - einmal gerechnet, danach nur noch gelesen. */
function aufbereiten(puffer){
  const n = Math.floor(puffer.length / 3);
  const L = new Float32Array(n), C = new Float32Array(n), T = new Float32Array(n);
  for (let i=0; i<n; i++){
    const lab = rgb2oklab(puffer[i*3], puffer[i*3+1], puffer[i*3+2]);
    L[i] = lab[0];
    C[i] = Math.hypot(lab[1], lab[2]);
    T[i] = (Math.atan2(lab[2], lab[1])*180/Math.PI + 360) % 360;
  }
  return { n, rgb: puffer, L, C, T };
}

const pixelFarbe = (d, i) => [d.rgb[i*3], d.rgb[i*3+1], d.rgb[i*3+2]];

// --- Farbtöne finden ------------------------------------------------

/** Kürzester Bogen, der den angegebenen Anteil des farbigen
 *  Materials enthält - das Maß für die Farbtonstreuung. */
function tonSpanne(fach, anteil = 0.80){
  const F = fach.length, gesamt = fach.reduce((s,v)=>s+v,0);
  if (!gesamt) return 360;
  let beste = 360;
  for (let start=0; start<F; start++){
    let masse = 0;
    for (let breite=1; breite<=F; breite++){
      masse += fach[(start+breite-1)%F];
      if (masse/gesamt >= anteil){ beste = Math.min(beste, breite*(360/F)); break; }
    }
  }
  return beste;
}

function farbtoene(d, brauchbar, hoechstens = 5){
  const F = 180;
  const fach = new Float64Array(F), spitze = new Float64Array(F);

  for (const i of brauchbar){
    const c = d.C[i];
    if (c < 0.035) continue;                    // zu grau, kein Ton ablesbar
    const f = Math.floor(d.T[i]/360*F) % F;
    fach[f] += Math.pow(c, 1.4);
    if (c > spitze[f]) spitze[f] = c;
  }
  if (!fach.some(v=>v>0)) return { toene: [], spanne: 360, trennschaerfe: 0 };

  const glatt = new Float64Array(F);
  for (let i=0;i<F;i++)
    for (let d=-4; d<=4; d++) glatt[i] += fach[(i+d+F)%F] * (1 - Math.abs(d)/5);

  const spitzeGlatt = new Float64Array(F);
  for (let i=0;i<F;i++){
    let m=0; for (let d=-3; d<=3; d++) m = Math.max(m, spitze[(i+d+F)%F]);
    spitzeGlatt[i] = m;
  }

  /* Trennschärfe aus dem Bild ableiten. Eine feste Zahl - etwa
     40 Grad - unterstellt, dass ein Bild über den Farbkreis
     streut. Bei einem Cover, das zu über 80 % in einem einzigen
     Sektor liegt, findet man damit genau einen Ton. */
  const spanne = tonSpanne(glatt, 0.80);
  const trennschaerfe = Math.max(6, Math.min(40, spanne / Math.max(2, hoechstens - 1)));
  const fenster = Math.round(trennschaerfe/2 / (360/F));

  const gesamtMasse = fach.reduce((s,v)=>s+v,0) || 1;
  const gipfel = [...spitzeGlatt].map((v,i)=>({i,v})).sort((a,b)=>b.v-a.v);
  const gewaehlt = [];

  for (const g of gipfel){
    if (gewaehlt.length >= hoechstens) break;
    if (g.v < 0.06) continue;                   // zu flau, kein echter Farbton
    const ton = (g.i+0.5)/F*360;
    if (gewaehlt.some(w => Math.abs(((w.ton-ton+540)%360)-180) < trennschaerfe)) continue;

    let masse = 0;
    for (let d=-fenster; d<=fenster; d++) masse += fach[(g.i+d+F)%F];
    if (masse/gesamtMasse < 0.03) continue;     // Schutz gegen Streupixel

    // Vertreter: das bunteste PIXEL dieses Tonbereichs
    let vertreter=null, bc=-1;
    for (const j of brauchbar){
      const c = d.C[j];
      if (c <= bc || c < 0.02) continue;
      if (Math.abs(((d.T[j]-ton+540)%360)-180) > trennschaerfe/2) continue;
      bc = c; vertreter = pixelFarbe(d, j);
    }
    if (!vertreter) continue;

    /* Zweite Hürde: Farbtonabstand allein genügt nicht. Bei einem
       farblich engen Bild wird die Trennschärfe klein, und dann
       liegen zwei "verschiedene" Töne zwar sechs Grad auseinander,
       ihre tatsächlichen Farben aber praktisch aufeinander. Erst
       der Abstand in OKLab entscheidet, ob ein Mensch sie
       unterscheiden kann. */
    if (gewaehlt.some(w => abstand(w.rgb, vertreter) < 0.12)) continue;

    const lab = rgb2oklab(...vertreter);
    gewaehlt.push({ ton, rgb: vertreter, hell: lab[0], buntheit: bc });
  }

  // Anteile über eine echte Zuordnung: jedes Pixel zu genau einem Ton
  if (gewaehlt.length){
    const treffer = new Array(gewaehlt.length).fill(0);
    let ges = 0;
    for (const i of brauchbar){
      const c = d.C[i];
      if (c < 0.035) continue;
      let nah=0, nd=Infinity;
      for (let j=0;j<gewaehlt.length;j++){
        const ab = Math.abs(((gewaehlt[j].ton-d.T[i]+540)%360)-180);
        if (ab<nd){ nd=ab; nah=j; }
      }
      const w = Math.pow(c,1.4);
      treffer[nah] += w; ges += w;
    }
    gewaehlt.forEach((g,j)=>{ g.anteil = ges ? treffer[j]/ges : 0; });
  }

  return { toene: gewaehlt, spanne, trennschaerfe };
}

/** Verteilung eines Tons über die Helligkeit - wo im Bild lebt er? */
function verteilung(d, brauchbar, ton, fenster){
  const Ls = [];
  const stufen = new Array(10).fill(0);
  let bestIdx = -1, bc = -1;
  for (const i of brauchbar){
    const c = d.C[i];
    if (c < 0.02) continue;
    if (Math.abs(((d.T[i]-ton+540)%360)-180) > fenster) continue;
    Ls.push(d.L[i]);
    stufen[Math.min(9, Math.floor(d.L[i]*10))]++;
    if (c > bc){ bc = c; bestIdx = i; }
  }
  if (!Ls.length) return null;
  Ls.sort((a,b)=>a-b);
  const q = (x)=>Ls[Math.floor(x*(Ls.length-1))];
  const gipfelStufe = stufen.indexOf(Math.max(...stufen));
  return {
    min:Ls[0], q1:q(0.25), median:q(0.5), q3:q(0.75), max:Ls[Ls.length-1],
    grundL: (gipfelStufe+0.5)/10,
    akzentL: d.L[bestIdx], akzentC: bc, akzentHex: hex(pixelFarbe(d, bestIdx)),
  };
}

// --- Palette bauen --------------------------------------------------

function palette(puffer){
  const d = aufbereiten(puffer);

  /* Extreme raus - dort ist kein Farbton ablesbar. ABSOLUTE
     Grenzen: Der Interquartilbereich wäre bei einem dunklen Cover
     selbst das Beinahe-Schwarz, und man suchte die buntesten
     Farben genau dort, wo es keine gibt. */
  const brauchbarArr = [];
  for (let i=0;i<d.n;i++) if (d.L[i] >= 0.10 && d.L[i] <= 0.95) brauchbarArr.push(i);
  const alleIdx = brauchbarArr.length > 2000
    ? brauchbarArr
    : Array.from({length:d.n}, (_,i)=>i);
  const basis = Int32Array.from(alleIdx);

  const { toene, spanne, trennschaerfe } = farbtoene(d, basis, 5);

  // Helligkeitsumfang des ganzen Bildes, gegen Ausreißer gesichert
  const Ls = Float32Array.from(d.L).sort();
  const qL = (t)=>Ls[Math.floor(t*(Ls.length-1))];
  const umfang = { min:qL(0.02), max:qL(0.98) };

  toene.forEach(t => {
    t.verteilung = verteilung(d, basis, t.ton, Math.max(8, trennschaerfe/2));
  });

  const p = {
    toene: toene.map(t => ({
      ton: Math.round(t.ton),
      hex: hex(t.rgb),
      hell: +t.hell.toFixed(3),
      buntheit: +t.buntheit.toFixed(3),
      anteil: +(t.anteil||0).toFixed(3),
      akzentHex: t.verteilung?.akzentHex || hex(t.rgb),
      grundL: +(t.verteilung?.grundL ?? t.hell).toFixed(2),
      akzentL: +(t.verteilung?.akzentL ?? t.hell).toFixed(2),
    })),
    umfang: { min:+umfang.min.toFixed(3), max:+umfang.max.toFixed(3) },
    spanne: Math.round(spanne),
    trennschaerfe: Math.round(trennschaerfe),
  };

  if (!toene.length){
    // Farbloses Cover - reines Grau, ehrlich so benannt
    Object.assign(p, {
      grund:'#0d0f13', flaeche:'#171b23', text:'#f2f5fa', textLeise:'#96a0b4',
      akzent:'#9fb0c8', akzent2:'#7d8ca3', farblos:true,
    });
  } else {
    /* Rollen vergeben.
       Trennen sich die Töne nach Fläche - wie bei einem Cover mit
       großem dunklem Grund und kleinen bunten Lichtern -, dann
       liefert der größte Ton den Grund und der bunteste den Akzent.
       Gibt es nur einen Ton, kommen beide Rollen aus dessen eigener
       Verteilung: Grund am Häufigkeitsgipfel, Akzent am
       Buntheitsmaximum. */
    const nachFlaeche = [...toene].sort((a,b)=>(b.anteil||0)-(a.anteil||0));
    const grundTon = nachFlaeche[0];

    // Grund: dunkel, wenig bunt - er trägt Fläche
    p.grund   = hex(ausOklch(Math.max(0.06, Math.min(0.12, umfang.min + 0.02)),
                             Math.min(0.05, grundTon.buntheit*0.4), grundTon.ton));
    p.flaeche = hex(ausOklch(0.17, Math.min(0.06, grundTon.buntheit*0.45), grundTon.ton));

    /* Akzent aus drei Größen: Buntheit × Kontrast × Flächenanteil.

       Jede für sich führt in die Irre. Nach Buntheit allein gewinnt
       ein dunkles Rostbraun gegen ein leuchtendes Cyan. Nach
       Buntheit mal Kontrast gewinnt bei einem rot dominierten Cover
       ein Grün, das nur 9 % der Fläche ausmacht. Erst der
       Flächenanteil stellt das richtig - und ein deutlich besserer
       Kontrast kann eine kleinere Fläche weiterhin aufwiegen:
       Bei "Pfeifenwald" schlägt das Cyan mit 40 % Fläche und
       Kontrast 8,2 das Rostbraun mit 60 % und Kontrast 3,5. */
    const grundRgb = [1,3,5].map(i=>parseInt(p.grund.substr(i,2),16));
    const bewertet = [];
    for (const t of toene){
      const h = t.verteilung?.akzentHex || hex(t.rgb);
      // Zwei Töne können auf dasselbe Pixel zeigen - dann nur einmal
      if (bewertet.some(b => b.hex === h)) continue;
      const rgb = [1,3,5].map(i=>parseInt(h.substr(i,2),16));
      const c = buntheitVon(rgb2oklab(...rgb));
      bewertet.push({
        hex: h,
        punkte: c * Math.min(kontrast(rgb, grundRgb), 12) * (t.anteil || 0.01),
      });
    }
    bewertet.sort((a,b)=>b.punkte-a.punkte);
    p.akzent = bewertet[0].hex;

    /* Zweitfarbe: der HÄUFIGSTE der übrigen Töne - nicht der
       zweitbeste der Bewertung und schon gar keine konstruierte
       Komplementärfarbe. Für den Fortschrittsbalken sollen die
       beiden Farben stehen, die das Cover tatsächlich prägen. */
    const uebrige = [...toene]
      .filter(t => (t.verteilung?.akzentHex || hex(t.rgb)) !== p.akzent)
      .sort((a,b) => (b.anteil||0) - (a.anteil||0));
    p.akzent2 = uebrige.length
      ? (uebrige[0].verteilung?.akzentHex || hex(uebrige[0].rgb))
      : p.akzent;

    // Text: sehr hell, minimal im Grundton eingefärbt
    p.text      = hex(ausOklch(0.96, 0.02, grundTon.ton));
    p.textLeise = hex(ausOklch(0.68, 0.03, grundTon.ton));
    p.farblos   = false;
  }

  // Kontrast nachrechnen und notfalls nachziehen
  const alsRgb = (h)=>[1,3,5].map(i=>parseInt(h.substr(i,2),16));
  let versuch = 0;
  while (kontrast(alsRgb(p.text), alsRgb(p.grund)) < 4.5 && versuch++ < 20)
    p.text = hex(ausOklch(Math.min(0.995, 0.96 + versuch*0.002), 0.02, toene[0]?.ton || 0));
  versuch = 0;
  while (kontrast(alsRgb(p.akzent), alsRgb(p.grund)) < 3.0 && versuch++ < 24){
    const lab = rgb2oklab(...alsRgb(p.akzent));
    p.akzent = hex(ausOklch(Math.min(0.92, lab[0] + versuch*0.02),
                            buntheitVon(lab), tonVon(lab)));
  }
  p.kontrastText   = +kontrast(alsRgb(p.text),   alsRgb(p.grund)).toFixed(2);
  p.kontrastAkzent = +kontrast(alsRgb(p.akzent), alsRgb(p.grund)).toFixed(2);
  return p;
}

// --- Hauptlauf ------------------------------------------------------

(async () => {
  const katalog = K.lesen();
  if (!katalog){ console.error('Kein Katalog - erst bin/aufbereiten.js.'); process.exit(1); }

  const songs = Object.values(katalog.songs);
  const offen = songs.filter(s => {
    if (!NEU && s.farben && s.farben.toene) return false;
    return fs.existsSync(path.join(SONGS, s.id, 'cover.jpg'));
  });

  console.log(`${songs.length} Songs, ${offen.length} Paletten zu rechnen\n`);
  if (!offen.length){ console.log('Nichts zu tun.'); return; }

  let fertig=0, misslungen=0, schwach=0, farblos=0;
  const tonZahl = {};
  const start = Date.now();

  for (let i=0; i<offen.length; i+=4){
    const gruppe = offen.slice(i, i+4);
    await Promise.all(gruppe.map(async (s) => {
      const px = await pixel(path.join(SONGS, s.id, 'cover.jpg'));
      if (!px){ misslungen++; return; }
      const f = palette(px);
      katalog.songs[s.id].farben = f;
      tonZahl[f.toene.length] = (tonZahl[f.toene.length]||0) + 1;
      if (f.farblos) farblos++;
      if (f.kontrastText < 4.5 || f.kontrastAkzent < 3.0) schwach++;
      fertig++;
    }));
    process.stdout.write(`\r  ${fertig+misslungen}/${offen.length}`);
  }

  K.schreiben(katalog);

  console.log(`\n\nfertig:     ${fertig}`);
  if (misslungen) console.log(`misslungen: ${misslungen}`);
  console.log(`Dauer:      ${Math.round((Date.now()-start)/1000)} s\n`);
  console.log('Gefundene Farbtöne je Cover:');
  Object.keys(tonZahl).sort().forEach(n =>
    console.log(`  ${n} ${n==='1'?'Ton ':'Töne'}: ${String(tonZahl[n]).padStart(3)} Cover`));
  console.log(`\nohne jede Farbe: ${farblos}`);
  console.log(`Kontrast unter Zielwert: ${schwach}`);
})();
