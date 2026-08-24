/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ============================================================
   KlangTresor · Farbverfahren vergleichen
   ------------------------------------------------------------
   Schickt dasselbe Cover durch sechs Verfahren der Farbauswahl
   und schreibt eine Vergleichsseite nach web/farbvergleich.html.

   Aufruf:
     node bin/farbvergleich.js              zufälliges Cover
     node bin/farbvergleich.js <songId>     bestimmtes Cover
     node bin/farbvergleich.js --bunt       ein farbiges Cover
     node bin/farbvergleich.js --einfarbig  ein einfarbiges Cover

   Danach: http://localhost:8788/farbvergleich.html
   ============================================================ */

const fs   = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const K    = require('./katalog.js');

const WURZEL = path.join(__dirname, '..');
const SONGS  = path.join(WURZEL, 'library', 'songs');
const RASTER = 64;

// ---------- Farbräume -------------------------------------------

const hex = ([r,g,b]) => '#' + [r,g,b]
  .map(x => Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,'0')).join('');

function rgb2hsl(r,g,b){
  r/=255; g/=255; b/=255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2;
  if (mx===mn) return [0,0,l];
  const d=mx-mn, s = l>0.5 ? d/(2-mx-mn) : d/(mx+mn);
  let h;
  if (mx===r) h=((g-b)/d+(g<b?6:0))/6;
  else if (mx===g) h=((b-r)/d+2)/6;
  else h=((r-g)/d+4)/6;
  return [h*360, s, l];
}

/* OKLab nach Björn Ottosson (2020).
   Wichtig, weil gleicher Zahlenabstand hier ungefähr gleichem
   Seheindruck entspricht - in RGB ist das nicht so, dort wirft
   ein Clusterverfahren Farben zusammen, die deutlich verschieden
   aussehen, und trennt andere, die identisch wirken. */
const zuLinear = (c) => { c/=255; return c<=0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); };

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
const oklabBuntheit = ([L,a,b]) => Math.hypot(a,b);
const oklabHell     = ([L]) => L;

/* Abstand zweier Farben in OKLab.
   Dort entspricht Zahlenabstand ungefähr Seheindruck - genau
   deshalb taugt er zum Entdoppeln: Zwei Rollen dürfen nicht
   fast dieselbe Farbe bekommen. In RGB wäre so ein Schwellwert
   bedeutungslos. */
function abstandOklab(rgbA, rgbB){
  const a = rgb2oklab(...rgbA), b = rgb2oklab(...rgbB);
  return Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]);
}

/* Interquartil-Filter auf die WAHRGENOMMENE Helligkeit.
   Nicht V aus HSV und nicht L aus HSL - beide sind reine
   Rechengrößen ohne Bezug zum Sehen (reines Gelb und reines Blau
   bekommen dort denselben Wert, obwohl Gelb strahlt und Blau
   dunkel wirkt). Genommen wird L aus OKLab, das der empirischen
   Munsell-Werteskala nachempfunden ist.

   Der Bereich wird nicht fest gesetzt, sondern aus dem Bild selbst
   bestimmt: die mittleren 50 Prozent. Ein durchweg dunkles Cover
   behält dadurch seine dunklen Töne, ein helles seine hellen. */
function interquartil(punkte){
  const mitL = punkte.map(p => ({...p, L: oklabHell(rgb2oklab(...p.rgb))}));
  const sortiert = mitL.map(p=>p.L).sort((a,b)=>a-b);
  const q = (t) => sortiert[Math.floor(t*(sortiert.length-1))];
  const q1 = q(0.25), q3 = q(0.75);
  return { gefiltert: mitL.filter(p => p.L >= q1 && p.L <= q3), q1, q3 };
}

/* Extreme ausschließen - Fast-Schwarz und Fast-Weiß.
   ACHTUNG, nicht mit dem Interquartilbereich verwechseln: Bei
   einem durchweg dunklen Cover liegt dessen mittlere Hälfte
   selbst im Beinahe-Schwarz. Genau dort hatte ich zuvor gesucht
   und deshalb jede bunte Farbe verworfen - bei "Doppio passo"
   lagen null von 59 kräftigen Pixeln im Interquartilband.

   Die Grenzen müssen daher absolut sein, nicht relativ zur
   Verteilung des Bildes. */
function ohneExtreme(punkte, unten = 0.10, oben = 0.95){
  return punkte
    .map(p => ({...p, L: oklabHell(rgb2oklab(...p.rgb))}))
    .filter(p => p.L >= unten && p.L <= oben);
}

/* Rückweg OKLab -> sRGB, mit Rückführung in den darstellbaren
   Bereich: Liegt eine Farbe außerhalb, wird ihre Buntheit
   schrittweise verringert, bis sie hineinpasst. Farbton und
   Helligkeit bleiben dabei erhalten - genau die beiden Größen,
   auf die es hier ankommt. */
function oklab2rgb(L,a,b){
  const l_=L+0.3963377774*a+0.2158037573*b;
  const m_=L-0.1055613458*a-0.0638541728*b;
  const s_=L-0.0894841775*a-1.2914855480*b;
  const l=l_**3, m=m_**3, s=s_**3;
  const lin=[
     4.0767416621*l-3.3077115913*m+0.2309699292*s,
    -1.2684380046*l+2.6097574011*m-0.3413193965*s,
    -0.0041960863*l-0.7034186147*m+1.7076147010*s,
  ];
  return lin.map(c=>{
    const v = c<=0.0031308 ? 12.92*c : 1.055*Math.pow(Math.max(0,c),1/2.4)-0.055;
    return v*255;
  });
}

function ausOklch(L, C, hGrad){
  const h = hGrad*Math.PI/180;
  for (let k=C; k>=0; k-=0.004){
    const rgb = oklab2rgb(L, Math.cos(h)*k, Math.sin(h)*k);
    if (rgb.every(v => v>=-0.5 && v<=255.5)) return rgb.map(v=>Math.max(0,Math.min(255,v)));
  }
  return oklab2rgb(L,0,0).map(v=>Math.max(0,Math.min(255,v)));
}

const oklabTon = ([L,a,b]) => (Math.atan2(b,a)*180/Math.PI + 360) % 360;

/* Selbstprüfung der Farbraum-Umrechnung.
   Ein verrutschtes Komma in einer der neun Matrixzahlen fällt
   sonst nicht auf - die Werte sehen plausibel aus, sind aber
   falsch. Weiß MUSS a=0 und b=0 ergeben, Grau ebenso. */
(function pruefe(){
  const [Lw,aw,bw] = rgb2oklab(255,255,255);
  const [,ag,bg]   = rgb2oklab(128,128,128);
  const fehler = Math.abs(Lw-1) + Math.abs(aw) + Math.abs(bw) + Math.abs(ag) + Math.abs(bg);
  if (fehler > 0.005){
    console.error('OKLab-Umrechnung fehlerhaft: Weiß ergibt',
      [Lw,aw,bw].map(v=>v.toFixed(3)).join(' / '), '- erwartet 1.000 / 0.000 / 0.000');
    process.exit(1);
  }
})();

/* Farbtöne aus dem Bild holen - und NUR die Farbtöne.
   Gruppiert wird auf dem Farbkreis, gewichtet mit Buntheit mal
   Fläche. Die Helligkeit spielt dabei bewusst keine Rolle: Ein
   Rot bleibt dasselbe Rot, ob es im Bild hell oder dunkel
   vorkommt. */
/**
 * Wie weit streut das Bild überhaupt über den Farbkreis?
 * Gesucht ist der KÜRZESTE Bogen, der den angegebenen Anteil des
 * farbigen Materials enthält. Ein Regenbogen-Cover braucht dafür
 * fast den ganzen Kreis, ein Rotweinglas dreißig Grad.
 */
function tonSpanne(fach, anteil = 0.80){
  const F = fach.length;
  const gesamt = fach.reduce((s,v)=>s+v,0);
  if (!gesamt) return 360;
  let beste = 360;
  for (let start=0; start<F; start++){
    let masse = 0;
    for (let breite=1; breite<=F; breite++){
      masse += fach[(start+breite-1)%F];
      if (masse/gesamt >= anteil){
        beste = Math.min(beste, breite*(360/F));
        break;
      }
    }
  }
  return beste;
}

function farbtoene(punkte, hoechstens = 5, mindestAbstandGrad = null, mindestAnteil = 0.03){
  const eintraege = [];
  for (const p of punkte){
    const lab = rgb2oklab(...p.rgb);
    const c = oklabBuntheit(lab);
    if (c < 0.035) continue;                    // zu grau, kein Ton ablesbar
    eintraege.push({ ton: oklabTon(lab), gewicht: Math.pow(c,1.4), buntheit: c });
  }
  if (!eintraege.length) return [];

  /* Zwei Größen je Fach: die Masse (wie viel Fläche) und die
     SPITZENBUNTHEIT (wie bunt wird dieser Ton im Bild überhaupt).

     Ausgewählt wird nach der Spitzenbuntheit, nicht nach der Masse.
     Nach Masse zu gehen ist der Fehler, den ich zuvor gemacht habe:
     Bei einem Regenbogen-Cover hat Rot die größte Fläche, also
     gewinnt Rot zweimal - und Grün, Gelb und Cyan kommen nie vor,
     obwohl sie das Bild ausmachen. */
  const F = 180, fach = new Float64Array(F), zahl = new Float64Array(F);
  const spitze = new Float64Array(F);
  for (const e of eintraege){
    const i = Math.floor(e.ton/360*F) % F;
    fach[i]+=e.gewicht; zahl[i]++;
    if (e.buntheit > spitze[i]) spitze[i] = e.buntheit;
  }
  const glatt = new Float64Array(F);
  for (let i=0;i<F;i++)
    for (let d=-4; d<=4; d++)
      glatt[i] += fach[(i+d+F)%F] * (1 - Math.abs(d)/5);
  // Spitzenbuntheit über ein kleines Fenster, gegen Ausreißer
  const spitzeGlatt = new Float64Array(F);
  for (let i=0;i<F;i++){
    let m=0;
    for (let d=-3; d<=3; d++) m = Math.max(m, spitze[(i+d+F)%F]);
    spitzeGlatt[i] = m;
  }

  /* Gipfel absteigend. Entscheidend ist die Mindestmasse: Ein
     Farbton zählt nur, wenn er einen nennenswerten Anteil des
     farbigen Materials ausmacht.

     Ohne diese Bedingung nimmt man einfach die fünf höchsten
     Gipfel - auch wenn der fünfte aus einer Handvoll Streupixeln
     besteht. Rendert man den dann groß und gesättigt, entsteht
     eine Farbe, die im Bild nirgends vorkommt. Genau das war der
     Fehler zuvor: ein Gelbgrün in einem Bild ohne Gelb.

     Damit kommt auch die ANZAHL aus dem Bild: Ein Cover mit
     Orange und Blau liefert zwei Farben, nicht zwanghaft fünf. */
  const gesamtMasse = fach.reduce((s,v)=>s+v,0) || 1;

  /* Trennschärfe aus dem Bild ableiten statt festzulegen.
     Eine feste Zahl - etwa 40 Grad - unterstellt, dass ein Bild
     über den Farbkreis streut. Bei einem Cover, das zu über 80 %
     in einem einzigen 10-Grad-Sektor liegt (ein Rotweinglas etwa),
     findet man damit genau einen Ton und muss für den zweiten auf
     Streureste ausweichen.

     Also: kürzesten Bogen suchen, der 80 % des farbigen Materials
     enthält, und die Trennschärfe daraus ableiten. Ein Regenbogen
     bekommt weite Abstände, ein Rotton-Bild enge - und findet dann
     seine verschiedenen Rottöne. */
  const spanne = tonSpanne(glatt, 0.80);
  const abstand = mindestAbstandGrad
    ?? Math.max(6, Math.min(40, spanne / Math.max(2, hoechstens - 1)));

  // Reihenfolge nach Spitzenbuntheit - die buntesten Töne zuerst
  const gipfel = [...spitzeGlatt].map((v,i)=>({i,v})).sort((a,b)=>b.v-a.v);
  const gewaehlt = [];
  for (const g of gipfel){
    if (gewaehlt.length >= hoechstens) break;
    if (g.v < 0.06) continue;             // zu flau, kein echter Farbton
    const ton = (g.i+0.5)/F*360;
    if (gewaehlt.some(w => Math.abs(((w.ton-ton+540)%360)-180) < abstand)) continue;

    /* Masse aus dem UNGEGLÄTTETEN Histogramm zählen.
       Die Glättung verteilt jedes Pixel über ±8 Grad. Bei eng
       beieinanderliegenden Tönen - etwa vier Rottönen im Abstand
       von 6 Grad - zählt dann jedes Pixel mehrfach, und die
       Anteile summieren sich auf über 100 %. */
    let masse = 0;
    for (let d=-Math.round(abstand/2/(360/F)); d<=Math.round(abstand/2/(360/F)); d++)
      masse += fach[(g.i+d+F)%F];
    // Mindestfläche nur als Schutz gegen einzelne Streupixel
    if (masse / gesamtMasse < mindestAnteil) continue;

    /* Vertreter ist ein WIRKLICH VORKOMMENDES Pixel: das buntest
       vorhandene in diesem Tonbereich. Keine Konstruktion aus
       Farbton, Helligkeit und Buntheit - die ergäbe wieder eine
       Farbe, die es im Bild nicht gibt. */
    let vertreter=null, bc=-1;
    for (const p of punkte){
      const lab = rgb2oklab(...p.rgb);
      const c = oklabBuntheit(lab);
      if (c < 0.02) continue;
      if (Math.abs(((oklabTon(lab)-ton+540)%360)-180) > abstand/2) continue;
      if (c > bc){ bc=c; vertreter=p.rgb; }
    }
    if (!vertreter) continue;

    /* Zweite Hürde: Der Farbtonabstand allein genügt nicht.
       Bei einem farblich engen Bild wird die Trennschärfe klein,
       und dann liegen zwei "verschiedene" Töne zwar sechs Grad
       auseinander, ihre tatsächlichen Farben aber praktisch
       aufeinander - zweimal dasselbe Rot. Erst der Abstand in
       OKLab entscheidet, ob ein Mensch sie unterscheiden kann. */
    if (gewaehlt.some(g => abstandOklab(g.rgb, vertreter) < 0.12)) continue;

    const lab = rgb2oklab(...vertreter);
    gewaehlt.push({
      ton, staerke: masse, rgb: vertreter,
      buntheit: oklabBuntheit(lab),
      hell: oklabHell(lab),
      anteilBild: masse / gesamtMasse,
    });
  }
  /* Anteile erst JETZT bestimmen, über eine echte Zuordnung:
     Jedes farbige Pixel gehört zu genau einem Ton, dem nächsten
     auf dem Farbkreis. Fenster fester Breite können das nicht
     leisten - liegen zwei Töne sechs Grad auseinander, überlappen
     sich ihre Fenster zwangsläufig, und die Anteile summieren sich
     auf über 100 %. */
  if (gewaehlt.length){
    const treffer = new Array(gewaehlt.length).fill(0);
    let gesamt = 0;
    for (const e of eintraege){
      let nah=0, nd=Infinity;
      gewaehlt.forEach((g,j)=>{
        const d = Math.abs(((g.ton-e.ton+540)%360)-180);
        if (d < nd){ nd=d; nah=j; }
      });
      treffer[nah] += e.gewicht; gesamt += e.gewicht;
    }
    gewaehlt.forEach((g,j)=>{ g.anteilBild = gesamt ? treffer[j]/gesamt : 0; });
  }
  const summe = gewaehlt.reduce((s,g)=>s+g.anteilBild,0) || 1;
  return gewaehlt.map(g=>({...g, anteil: g.anteilBild/summe}));
}

/**
 * Wo lebt ein Farbton im Bild?
 * Sammelt alle Pixel dieses Tonbereichs und gibt zurück, wie ihre
 * Helligkeit verteilt ist - und wie bunt sie in welcher Helligkeit
 * sind. Erst daraus lässt sich sagen, ob ein Ton als Grundfläche
 * oder als Glanzlicht auftritt.
 */
function tonVerteilung(punkte, ton, fensterGrad = 14){
  const treffer = [];
  for (const p of punkte){
    const lab = rgb2oklab(...p.rgb);
    const c = oklabBuntheit(lab);
    if (c < 0.02) continue;
    if (Math.abs(((oklabTon(lab)-ton+540)%360)-180) > fensterGrad) continue;
    treffer.push({ L: lab[0], C: c, rgb: p.rgb });
  }
  if (!treffer.length) return null;
  const L = treffer.map(t=>t.L).sort((a,b)=>a-b);
  const q = (t)=>L[Math.floor(t*(L.length-1))];

  // Buntheit in zehn Helligkeitsstufen - zeigt, wo der Ton "brennt"
  const stufen = Array.from({length:10},()=>({n:0, c:0, rgb:null, bc:-1}));
  for (const t of treffer){
    const i = Math.min(9, Math.floor(t.L*10));
    const s = stufen[i];
    s.n++; s.c += t.C;
    if (t.C > s.bc){ s.bc = t.C; s.rgb = t.rgb; }
  }
  return {
    anzahl: treffer.length,
    anteilBild: treffer.length / punkte.length,
    min:L[0], q1:q(0.25), median:q(0.5), q3:q(0.75), max:L[L.length-1],
    stufen: stufen.map((s,i)=>({
      von:i/10, bis:(i+1)/10,
      anteil: s.n/treffer.length,
      buntheit: s.n ? s.c/s.n : 0,
      hex: s.rgb ? hex(s.rgb) : null,
    })),
  };
}

/** Hellster und dunkelster Punkt des Bildes, gegen Ausreißer abgesichert. */
function hellBereich(punkte){
  const L = punkte.map(p=>oklabHell(rgb2oklab(...p.rgb))).sort((a,b)=>a-b);
  const q = (t)=>L[Math.floor(t*(L.length-1))];
  return { min:q(0.02), max:q(0.98) };
}

// ---------- Pixel einlesen --------------------------------------

function pixel(datei){
  const roh = execFileSync('ffmpeg', ['-v','error','-i',datei,
    '-vf',`scale=${RASTER}:${RASTER}`,'-f','rawvideo','-pix_fmt','rgb24','-'],
    { maxBuffer: 1<<24 });
  const p = [];
  for (let i=0; i+2 < roh.length; i+=3){
    const nr = i/3, x = nr % RASTER, y = Math.floor(nr / RASTER);
    p.push({ rgb:[roh[i],roh[i+1],roh[i+2]], x, y });
  }
  return p;
}

/** Mittenbetonung: Das Motiv steht meist mittig, der Rand ist Hintergrund. */
function mitte(x,y){
  const dx=(x/(RASTER-1)-0.5)*2, dy=(y/(RASTER-1)-0.5)*2;
  return 1 - 0.55 * Math.min(1, Math.hypot(dx,dy));
}

// ---------- Verfahren -------------------------------------------

/** k-Means, wahlweise in RGB oder OKLab, mit Gewichten je Pixel. */
function kmeans(punkte, k, raum, gewicht){
  const vek = punkte.map(p => raum==='oklab' ? rgb2oklab(...p.rgb) : p.rgb.slice());
  const gew = punkte.map(gewicht);
  let mitten = Array.from({length:k}, (_,i) => vek[Math.floor(i*vek.length/k)].slice());
  let zu = new Array(vek.length).fill(0);

  for (let r=0; r<14; r++){
    for (let i=0;i<vek.length;i++){
      let best=0, bd=Infinity;
      for (let j=0;j<k;j++){
        const d=(vek[i][0]-mitten[j][0])**2+(vek[i][1]-mitten[j][1])**2+(vek[i][2]-mitten[j][2])**2;
        if (d<bd){bd=d;best=j;}
      }
      zu[i]=best;
    }
    const su=Array.from({length:k},()=>[0,0,0,0]);
    for (let i=0;i<vek.length;i++){
      const z=su[zu[i]], w=gew[i];
      z[0]+=vek[i][0]*w; z[1]+=vek[i][1]*w; z[2]+=vek[i][2]*w; z[3]+=w;
    }
    for (let j=0;j<k;j++) if (su[j][3]>0)
      mitten[j]=[su[j][0]/su[j][3], su[j][1]/su[j][3], su[j][2]/su[j][3]];
  }

  /* Vertreter je Gruppe ist der MEDOID - das tatsächlich im Bild
     vorkommende Pixel, das dem Gruppenzentrum am nächsten liegt.
     Der Mittelwert wäre falsch: Über eine breite Gruppe gemittelt
     ergibt sich immer ein matter Braun- oder Grauton, den es im
     Bild gar nicht gibt. */
  const gruppen = Array.from({length:k},()=>({w:0,n:0,best:null,bd:Infinity}));
  for (let i=0;i<vek.length;i++){
    const z=gruppen[zu[i]], m=mitten[zu[i]];
    const d=(vek[i][0]-m[0])**2+(vek[i][1]-m[1])**2+(vek[i][2]-m[2])**2;
    if (d < z.bd){ z.bd=d; z.best=punkte[i].rgb; }
    z.w+=gew[i]; z.n++;
  }
  return gruppen.filter(z=>z.best).map(z=>({
    rgb: z.best.slice(),
    anteil: z.n/punkte.length,
    gewicht: z.w,
  }));
}

/** Median Cut nach Heckbert (1982) - das klassische Verfahren. */
function medianCut(punkte, anzahl){
  let kisten = [punkte.map(p=>p.rgb)];
  while (kisten.length < anzahl){
    // größte Kiste nach längster Achse teilen
    let bi=0, bl=-1;
    kisten.forEach((k,i)=>{
      if (k.length<2) return;
      for (let a=0;a<3;a++){
        const w=k.map(c=>c[a]), l=Math.max(...w)-Math.min(...w);
        if (l*k.length > bl){ bl=l*k.length; bi=i; }
      }
    });
    const k = kisten[bi];
    if (!k || k.length<2) break;
    let achse=0, best=-1;
    for (let a=0;a<3;a++){
      const w=k.map(c=>c[a]), l=Math.max(...w)-Math.min(...w);
      if (l>best){best=l;achse=a;}
    }
    k.sort((p,q)=>p[achse]-q[achse]);
    const h=Math.floor(k.length/2);
    kisten.splice(bi,1,k.slice(0,h),k.slice(h));
  }
  // Auch hier der Medoid statt des Mittelwerts, aus demselben Grund
  return kisten.filter(k=>k.length).map(k=>{
    const m = [0,1,2].map(a=>k.reduce((s,c)=>s+c[a],0)/k.length);
    let best=k[0], bd=Infinity;
    for (const c of k){
      const d=(c[0]-m[0])**2+(c[1]-m[1])**2+(c[2]-m[2])**2;
      if (d<bd){bd=d;best=c;}
    }
    return { rgb:best.slice(), anteil:k.length/punkte.length };
  });
}

/* Bewertung nach Googles Palette API (Android).
   Kernidee: Nicht die häufigste Farbe gewinnt, sondern die, die
   am besten zu einer ROLLE passt. Die Gewichte sind aufschluss-
   reich - Helligkeit zählt sechsfach, Sättigung dreifach, der
   Flächenanteil nur einfach. */
const ROLLEN = [
  { name:'Vibrant',       zielS:1.00, zielL:0.50 },
  { name:'Light Vibrant', zielS:1.00, zielL:0.74 },
  { name:'Dark Vibrant',  zielS:1.00, zielL:0.26 },
  { name:'Muted',         zielS:0.30, zielL:0.50 },
  { name:'Dark Muted',    zielS:0.30, zielL:0.26 },
];

function palette(kandidaten, mindestAbstand = 0){
  const maxAnteil = Math.max(...kandidaten.map(k=>k.anteil));
  const gewaehlt = [];
  return ROLLEN.map(rolle => {
    let best=null, bp=-1;
    for (const k of kandidaten){
      const [h,s,l] = rgb2hsl(...k.rgb);
      if (l<0.05 || l>0.95) continue;            // Fast-Schwarz/Weiß raus
      // Entdoppeln: nicht zweimal fast dieselbe Farbe vergeben.
      // Genau das passiert sonst - Vibrant und Light Vibrant
      // unterscheiden sich nur im Helligkeitsziel, nicht im
      // Farbton, und landen beide auf demselben Blau.
      if (mindestAbstand && gewaehlt.some(g => abstandOklab(g, k.rgb) < mindestAbstand)) continue;
      const punkte = 3 * (1 - Math.abs(s - rolle.zielS))
                   + 6 * (1 - Math.abs(l - rolle.zielL))
                   + 1 * (k.anteil / maxAnteil);
      if (punkte > bp){ bp=punkte; best=k; }
    }
    if (best) gewaehlt.push(best.rgb);
    return best ? { ...best, rolle:rolle.name, punkte:+bp.toFixed(2) } : null;
  }).filter(Boolean);
}

// ---------- Hauptlauf -------------------------------------------

const katalog = K.lesen();
if (!katalog){ console.error('Kein Katalog.'); process.exit(1); }
const alle = Object.values(katalog.songs)
  .filter(s => fs.existsSync(path.join(SONGS, s.id, 'cover.jpg')));

const arg = process.argv[2];
let song;
if (arg === '--bunt')          song = alle.filter(s=>s.farben && !s.farben.monochrom)
                                          .sort((a,b)=>b.farben.buntheit-a.farben.buntheit)[0];
else if (arg === '--einfarbig')song = alle.filter(s=>s.farben && s.farben.monochrom)[0];
else if (arg)                  song = alle.find(s=>s.id===arg);
if (!song) song = alle[Math.floor(Math.random()*alle.length)];

const px = pixel(path.join(SONGS, song.id, 'cover.jpg'));
const brauchbar = px.filter(p => {
  const [,,l] = rgb2hsl(...p.rgb);
  return l > 0.04 && l < 0.96;                  // Fast-Schwarz/Weiß verwerfen
});
const basis = brauchbar.length > 200 ? brauchbar : px;

const IQ = interquartil(basis);
// Farbtöne aus dem verlässlichen Helligkeitsband, Spannweite aus dem
// GANZEN Bild - zwei getrennte Fragen, zwei getrennte Quellen.
// Farbtöne aus allem außer den Extremen suchen - NICHT aus dem
// Interquartilband, siehe Begründung bei ohneExtreme().
const OHNE    = ohneExtreme(px);
const TOENE   = farbtoene(OHNE, 5);
const BEREICH = hellBereich(px);
// Verteilung jedes gefundenen Tons über das GANZE Bild
const VERTEILUNG = TOENE.map(t => ({ ton:t, v: tonVerteilung(px, t.ton) })).filter(x=>x.v);

const nachAnteil = (a,b)=>b.anteil-a.anteil;
const fuenf = (l)=>l.slice(0,5);

const verfahren = [
  {
    name: 'Häufigkeit (k-Means in RGB)',
    hinweis: 'Der naive Weg. Größte Gruppe gewinnt — das ist fast immer der Hintergrund.',
    farben: fuenf(kmeans(basis, 16, 'rgb', ()=>1).sort(nachAnteil)),
  },
  {
    name: 'Median Cut (Heckbert 1982)',
    hinweis: 'Das klassische Quantisierungsverfahren, Grundlage von Color Thief.',
    farben: fuenf(medianCut(basis, 16).sort(nachAnteil)),
  },
  {
    name: 'Buntheitsgewichtet (RGB)',
    hinweis: 'Jedes Pixel nach seiner Farbigkeit gewichtet — Grau kann nicht mehr gewinnen.',
    farben: fuenf(kmeans(basis, 16, 'rgb', p=>{
      const [,s]=rgb2hsl(...p.rgb); return 0.05 + Math.pow(s,1.5);
    }).sort((a,b)=>b.gewicht-a.gewicht)),
  },
  {
    name: 'OKLab + Buntheit + Mittenbetonung',
    hinweis: 'Clustern im wahrnehmungsgleichen Raum, Motiv wichtiger als Rand.',
    farben: fuenf(kmeans(basis, 16, 'oklab', p=>{
      const c = oklabBuntheit(rgb2oklab(...p.rgb));
      return (0.03 + Math.pow(c*3.2, 1.5)) * mitte(p.x, p.y);
    })
    // Nach der Buntheit der GRUPPE ordnen, gedämpft mit der Wurzel
    // des Flächenanteils. Nach aufsummiertem Gewicht zu sortieren
    // hieße am Ende doch wieder: die größte Fläche gewinnt.
    .map(g => ({...g, kraft: oklabBuntheit(rgb2oklab(...g.rgb)) * Math.sqrt(g.anteil) }))
    .sort((a,b)=>b.kraft-a.kraft)),
  },
  {
    name: 'Rollen-Bewertung (Google Palette / Vibrant)',
    hinweis: 'Nicht Häufigkeit, sondern Eignung: 3× Sättigung + 6× Helligkeit + 1× Fläche.',
    farben: palette(medianCut(basis, 24)),
  },
  {
    name: '★ Interquartil-Helligkeit + Rollen + OKLab-Entdopplung',
    hinweis: `Nur die mittleren 50 % der wahrgenommenen Helligkeit (OKLab L zwischen `
           + `${IQ.q1.toFixed(3)} und ${IQ.q3.toFixed(3)}), danach Rollen-Bewertung, `
           + `und keine zwei Farben näher als 0,10 in OKLab.`,
    farben: palette(medianCut(IQ.gefiltert, 24), 0.10),
  },
  {
    name: `★★ Farbtöne aus dem Bild — ${TOENE.length} gefunden, keine erfunden`,
    hinweis: `Nur Töne mit mindestens 10 % des farbigen Materials: `
           + `${TOENE.map(t=>Math.round(t.ton)+'° ('+Math.round(t.anteilBild*100)+' %)').join(', ')}. `
           + `Jede Farbe ist ein tatsächlich vorkommendes Pixel. `
           + `Bildumfang zum Vergleich: OKLab L ${BEREICH.min.toFixed(2)}–${BEREICH.max.toFixed(2)}.`,
    farben: TOENE.map(t => ({
      rgb: t.rgb,
      anteil: t.anteilBild,
      rolle: `${Math.round(t.ton)}° · L ${t.hell.toFixed(2)} · C ${t.buntheit.toFixed(2)}`,
    })),
  },
  {
    name: '★★★ Dieselben Töne, je auf ihre bunteste Helligkeit gesetzt',
    hinweis: `Der Farbkörper ist keine Walze: Gelb wird nur hell bunt, Blau nur dunkel. `
           + `Deshalb bekommt jeder Ton die Helligkeit, bei der ER am buntesten sein kann — `
           + `begrenzt auf den Bildumfang ${BEREICH.min.toFixed(2)}–${BEREICH.max.toFixed(2)}.`,
    farben: TOENE.map(t => {
      // Helligkeit suchen, bei der dieser Ton die größte Buntheit trägt
      let bestL = t.hell, bc = -1;
      for (let L = BEREICH.min; L <= BEREICH.max; L += 0.02){
        let c = 0.02;
        while (c < 0.42){
          const probe = oklab2rgb(L, Math.cos(t.ton*Math.PI/180)*(c+0.01),
                                     Math.sin(t.ton*Math.PI/180)*(c+0.01));
          if (!probe.every(v=>v>=-0.5 && v<=255.5)) break;
          c += 0.01;
        }
        if (c > bc){ bc = c; bestL = L; }
      }
      return {
        rgb: ausOklch(bestL, Math.min(bc, Math.max(t.buntheit, 0.09)), t.ton),
        anteil: t.anteilBild,
        rolle: `${Math.round(t.ton)}° · L ${bestL.toFixed(2)}`,
      };
    }),
  },
  {
    name: 'Pentagramm (jetzige Fassung)',
    hinweis: 'Leitfarbe aus dem Bild, vier Töne im 72°-Abstand dazuerfunden.',
    farben: (song.farben?.hexe || []).map(h=>({ hexDirekt:h, anteil:0 })),
  },
];

// ---------- Seite schreiben --------------------------------------

const zeile = (v) => `
  <section>
    <h2>${v.name}</h2>
    <p>${v.hinweis}</p>
    <div class="reihe">
      ${v.farben.map(f=>{
        const h = f.hexDirekt || hex(f.rgb);
        const [ht,s,l] = f.hexDirekt
          ? [0,0,0]
          : rgb2hsl(...f.rgb);
        return `<div class="feld" style="background:${h}">
          <span>${h}</span>
          ${f.rolle ? `<em>${f.rolle}</em>` : ''}
          ${f.anteil ? `<em>${Math.round(f.anteil*100)} % Fläche</em>` : ''}
        </div>`;
      }).join('')}
    </div>
  </section>`;

fs.writeFileSync(path.join(WURZEL,'web','farbvergleich.html'), `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Farbverfahren im Vergleich</title>
<style>
 body{background:#0b0d12;color:#e8ecf4;margin:0;padding:26px;
   font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
 .kopf{display:flex;gap:24px;align-items:flex-start;margin-bottom:30px;flex-wrap:wrap}
 .kopf img{width:260px;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.6)}
 h1{font-size:22px;margin:0 0 6px} .klein{color:#8c96ad;font-size:13px}
 section{margin-bottom:26px}
 h2{font-size:15px;margin:0 0 3px}
 section p{color:#8c96ad;font-size:13px;margin:0 0 9px}
 .reihe{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;max-width:900px}
 .feld{aspect-ratio:3/2;border-radius:10px;display:flex;flex-direction:column;
   justify-content:flex-end;padding:8px;gap:1px}
 .feld span,.feld em{font-size:10px;font-style:normal;
   background:rgba(0,0,0,.55);padding:1px 5px;border-radius:4px;align-self:flex-start}
</style></head><body>
 <div class="kopf">
   <img src="/media/${song.id}/cover.jpg" alt="">
   <div>
     <h1>${song.titel}</h1>
     <div class="klein">
       ${(song.erstellt||'').slice(0,10)} · ${song.modell||''}<br>
       Buntheit ${song.farben?.buntheit ?? '?'} —
       ${song.farben?.monochrom ? 'gilt als einfarbig' : 'gilt als farbig'}<br>
       Stil: ${(song.stilPrompt||'').slice(0,90)}
     </div>
   </div>
 </div>
 ${verfahren.map(zeile).join('')}

 <h1 style="margin:34px 0 4px">Wo lebt welcher Farbton?</h1>
 <p class="klein" style="margin-bottom:16px">
   Für jeden gefundenen Ton: die Verteilung seiner Helligkeit über das ganze Bild.
   Die Leiste läuft von OKLab L 0 (links) bis 1 (rechts). Die Höhe eines Balkens ist
   der Anteil der Pixel dieses Tons in dieser Helligkeitsstufe, seine Farbe ist das
   bunteste dort tatsächlich vorkommende Pixel.
 </p>
 ${VERTEILUNG.map(({ton,v}) => `
   <div style="margin-bottom:18px">
     <div style="display:flex;gap:10px;align-items:baseline;margin-bottom:5px">
       <b style="font-size:14px">${Math.round(ton.ton)}°</b>
       <span class="klein">
         ${(v.anteilBild*100).toFixed(1)} % des Bildes ·
         L von ${v.min.toFixed(2)} bis ${v.max.toFixed(2)} ·
         Median ${v.median.toFixed(2)} ·
         Quartile ${v.q1.toFixed(2)}–${v.q3.toFixed(2)}
       </span>
     </div>
     <div style="display:flex;gap:2px;height:74px;align-items:flex-end;max-width:900px">
       ${v.stufen.map(s=>`
         <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%">
           <div style="height:${Math.max(2, s.anteil*100*2.4)}%;
                       background:${s.hex||'#222'};border-radius:3px 3px 0 0"
                title="L ${s.von.toFixed(1)}–${s.bis.toFixed(1)}: ${(s.anteil*100).toFixed(1)} %, Buntheit ${s.buntheit.toFixed(2)}"></div>
           <div style="font-size:9px;color:#6b7488;text-align:center;padding-top:3px">
             ${(s.anteil*100).toFixed(0)}</div>
         </div>`).join('')}
     </div>
   </div>`).join('')}
</body></html>`);

console.log(`Cover: ${song.titel}  (${song.id})`);
console.log(`Buntheit ${song.farben?.buntheit}, ${song.farben?.monochrom?'einfarbig':'farbig'}`);
console.log('geschrieben: web/farbvergleich.html');
console.log('ansehen:     http://localhost:8788/farbvergleich.html');
