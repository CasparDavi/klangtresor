/* >>> Pruefhaken der Nahtpruefung (eingesetzt von labor/nahtpruefung/stand.js, lebt NUR in site/) */
/* Warum ein Haken im Modul und kein Klicken im Pult: gemessen wird, ob Bild(t0+L) == Bild(t0) ist
   (Caspar_D, 14.09.2026: "es muss halt der effekt wieder zum Ursprung zurueckkehren auf dem letzten
   frame"). Das stimmt nur fuer den Weg, den der Export wirklich geht - ausschnitt(), raster(),
   exportBuendel(), exportBild(), LOOP und FEIN wie im kodierenden Weg. Die liegen im Modul verschlossen;
   der Haken reicht sie heraus, ohne einen davon nachzubauen. */
window.__naht = (() => {
  const warte = ms => new Promise(r => setTimeout(r, ms));
  /* Gesaeter Zufall: Rauschausfall, Filmkorn und das Zittern im Verwackeln wuerfeln mit Math.random.
     Ohne Saat misst jeder Lauf ein anderes Korn, und der Vergleich der Vorschau schluege nur Rauschen an. */
  const zufallEcht = Math.random; let saat = 1;
  const zufall = () => { saat = (saat + 0x6D2B79F5) | 0; let x = Math.imul(saat ^ (saat >>> 15), 1 | saat); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  let ORIG = null;
  const px1 = new Uint8Array(4), warteGL = () => { if(GL.gl) GL.gl.readPixels(0, 0, 1, 1, GL.gl.RGBA, GL.gl.UNSIGNED_BYTE, px1); };
  /* Zeit in GL.run allein (Hochladen, Shader, Zuruecklesen eines Punktes): im SwiftShader ueberdecken Leinwandkopien sonst den Shader. */
  let glMs = 0, glZahl = 0; const runEcht = GL.run;
  GL.run = function(){ const tm = performance.now(), r = runEcht.apply(this, arguments); warteGL(); glMs += performance.now() - tm; glZahl++; return r; };
  function typen(){ return Object.keys(EFFEKTE).map(k => ({ typ:k, label:EFFEKTE[k].label, art:EFFEKTE[k].art, params:EFFEKTE[k].params.filter(p=>p.k).map(p => ({ k:p.k, def:p.def, sel:p.sel?p.sel.map(s=>s[0]):undefined, min:p.min, max:p.max })) })); }
  async function bereitMachen(id, jetzt){
    for(let i=0; i<300 && !(bereit && DATA && DATA.id===id); i++) await warte(50);
    if(!(bereit && DATA && DATA.id===id)) throw new Error('Quelle von '+id+' nicht bereit');
    for(let i=0; i<100 && lein && lein.width<=2; i++) await warte(50);
    cancelAnimationFrame(rafId); rafId=0;   /* die Vorschau steht still - sonst malt rahmen() mit denselben Effekten dazwischen */
    GL.init(); GL.noiseLaden(); for(let i=0; i<300 && GL.gl && !GL.noise; i++) await warte(50);
    if(GL.gl && GL.vierLaden) await GL.vierLaden();   /* die Exportform der Rauschshader, wie video() vor dem ersten Bild */
    tiefeBildVon(id); for(let i=0; i<80 && !TIEFEN[id]; i++) await warte(50);
    /* Das Hauszeichen laedt beim ersten Exportbild erst an - dann fehlte es in Bild 0 und nirgends sonst. */
    const zeichen = zeichenHolen(); for(let i=0; i<80 && zeichen && !zeichen.complete; i++) await warte(50);
    ORIG = DATA.schlaege.map(s => s.slice());
    window.aktuellId = id; window.audio = { paused:false, currentTime:jetzt };
    return { gl:!!GL.gl, noise:!!GL.noise, tiefe:!!TIEFEN[id], schlaege:ORIG.length, titel:DATA.titel, einsen:ORIG.filter(s=>s[1]===1).length };
  }
  /* Titelvarianten aus befund.md: ohne Eins-Marken (Schlaege, aber kein Takt), ganz ohne Schlaege, als 3/4 gezaehlt. */
  /* Raender der Loop-Mathematik (15.09.2026, Gegenpruefung): Varianten mit Komma kombinierbar, der Reihe nach angewandt -
     'sechs' zaehlt 6/8, 'nurEinsen' laesst nur die Einsen stehen, 'gestreckt:f' dehnt die Schlagzeiten um jetzt (Takt f-mal so lang,
     etwa ein Takt ueber 5 s), 'wenige:n' laesst die n Schlaege um jetzt stehen. */
  function datenSetzen(art){
    let S = ORIG.map(s => s.slice()); const jetzt = (window.audio && window.audio.currentTime) || 0;
    for(const teil of String(art).split(',')){ const [a, w] = teil.split(':'), z = Number(w);
      S = a==='ohneEins' ? S.map(s => [s[0], s[1]===1 ? 0 : s[1]])
        : a==='ohneSchlaege' ? []
        : a==='dreiviertel' ? S.map((s,i) => [s[0], (i%3)+1])
        : a==='sechs' ? S.map((s,i) => [s[0], (i%6)+1])
        : a==='nurEinsen' ? S.filter(s => s[1]===1)
        : a==='gestreckt' ? S.map(s => [jetzt + (s[0]-jetzt)*z, s[1]])
        : a==='wenige' ? (() => { let k = S.findIndex(s => s[0]>jetzt); if(k<0) k = S.length; const v = Math.max(0, k-(z>>1)); return S.slice(v, v+z); })()
        : S; }
    DATA.schlaege = S;
  }
  /* Karten ueber den echten Rezept-Import, damit Vorgaben und Uebersetzungen stimmen. Die Nummern beginnen
     je Fall bei 1: viele Maler saeen ihren Zufall mit e.id, sonst misst jeder Lauf andere Wuerfel.
     Eine Partikel-Art bringt Farben, Masse und Eigenbewegung mit (artFarben) - wie beim Umstellen im Pult. */
  function effekteBauen(defs){ nr = 0;
    return defs.map(r => { let e;
      if(r.typ==='partikel' && r.art && r.art!=='schnee'){ e = effektAusRezept(Object.assign({}, r, { art:'schnee' }), false, 99); e.art = r.art; artFarben(e); for(const k of Object.keys(r)) if(k!=='typ') e[k] = Array.isArray(r[k]) ? r[k].slice() : r[k]; }
      else e = effektAusRezept(Object.assign({}, r), false, 99);
      if(!e) throw new Error('Rezept baut keinen Effekt: '+JSON.stringify(r));
      return e; }); }
  function vergleicher(W, H, lang){
    const sc = lang / Math.max(W, H), cw = Math.max(1, Math.round(W*sc)), ch = Math.max(1, Math.round(H*sc));
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const cx = cv.getContext('2d', { willReadFrequently:true });
    const bx = Math.ceil(cw/16), by = Math.ceil(ch/16), zahl = new Float64Array(bx*by), sum = new Float64Array(bx*by);
    for(let y=0; y<ch; y++) for(let x=0; x<cw; x++) zahl[(y>>4)*bx + (x>>4)]++;
    return {
      cw, ch,
      grab(q){ cx.clearRect(0, 0, cw, ch); cx.drawImage(q, 0, 0, cw, ch); return cx.getImageData(0, 0, cw, ch).data; },
      /* groesste mittlere Abweichung eines 16x16-Blocks, 0..255 - der Mittelwert uebers Bild saehe einen springenden Tropfen nicht */
      block(a, b){ sum.fill(0);
        for(let y=0; y<ch; y++){ const r = (y>>4)*bx; for(let x=0; x<cw; x++){ const i = (y*cw+x)*4; sum[r+(x>>4)] += Math.abs(a[i]-b[i]) + Math.abs(a[i+1]-b[i+1]) + Math.abs(a[i+2]-b[i+2]); } }
        let m = 0; for(let k=0; k<sum.length; k++){ const v = sum[k]/(zahl[k]*3); if(v>m) m = v; } return m; },
      mittel(a, b){ let t = 0; for(let i=0; i<a.length; i+=4) t += Math.abs(a[i]-b[i]) + Math.abs(a[i+1]-b[i+1]) + Math.abs(a[i+2]-b[i+2]); return t/(a.length/4)/3; }
    };
  }
  /* Ein Vorschaubild (LOOP=0, echte Schlaege) in Exportgroesse. Frisch gebaute Karten, gesaeter Zufall;
     der Nachzieheffekt bekommt anderthalb Sekunden Anlauf, sonst fehlte ihm die Spur, die er im Pult haette. */
  function vorschauBild(f, t0, L, takte, takt, W, H, tv){
    STAPEL = effekteBauen(f.effekte); soloId = null;
    const gm = bundel(), mv = exportBuendel(gm, t0, L, takte, takt, W, H); mv.DATA = Object.assign({}, DATA);
    LOOP = 0; FEIN = false; saat = 777;
    const anlauf = STAPEL.some(e => e.typ==='nachzieh') ? 45 : 0;
    for(let k=anlauf; k>=0; k--) exportBild(mv, gm, tv - k/BILDRATE, W, H);
    return mv.lein;
  }
  const klein = (q) => { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 86; const cx = cv.getContext('2d', { willReadFrequently:true }); cx.drawImage(q, 0, 0, 64, 86); const d = cx.getImageData(0, 0, 64, 86).data, rgb = new Uint8Array(64*86*3);
    for(let i=0, j=0; i<d.length; i+=4){ rgb[j++] = d[i]; rgb[j++] = d[i+1]; rgb[j++] = d[i+2]; } let s = ''; for(let i=0; i<rgb.length; i+=8192) s += String.fromCharCode.apply(null, rgb.subarray(i, i+8192)); return btoa(s); };
  const abwB64 = (a, b) => { const x = atob(a), y = atob(b); if(x.length!==y.length) return 255; let t = 0; for(let i=0; i<x.length; i++) t += Math.abs(x.charCodeAt(i)-y.charCodeAt(i)); return t/x.length; };

  async function fall(f, o){
    o = o || {}; const lange = o.lange || 360, vlang = o.vergleich || 256, r2 = x => Math.round(x*1000)/1000;
    const beginn = performance.now();
    if(typeof f.jetzt==='number') window.audio = { paused:false, currentTime:f.jetzt };
    datenSetzen(f.daten || 'normal');
    Math.random = zufall;
    try{
        STAPEL = effekteBauen(f.effekte); soloId = null;
      const { t0, L, takte, takt } = ausschnitt(); const [W, H] = ausgabeMass(lange); const N = Math.round(L*BILDRATE);
      const gemerkt = bundel(), m = exportBuendel(gemerkt, t0, L, takte, takt, W, H);
      const S = m.DATA.schlaege, proTakt = (takte && S.length>1) ? Math.round(takt/(S[1][0]-S[0][0])) : 0;
      const V = vergleicher(W, H, vlang), mitte = Math.floor(N/2);
      /* Ueber N hinaus werden noch K Bilder gemalt: gleich vergleicht nur EIN Bild, und ein Ereignis (Zufallsschlag,
         Einbruch) kann dort zufaellig gleich stehen. gleichFolge nimmt das schlechteste der ersten K Bildpaare. */
      const K = Math.min(15, N), anfang = [];
      /* BEWEGUNG (15.09.2026): vorschauAbw vergleicht Orte zur selben Songzeit - bei Teilchen, die seit Songanfang
         fallen, ist das fast immer ein anderes Feld, egal wie treu das Tempo ist. Tempotreue misst stattdessen die
         Bildaenderung ueber 2 Bilder, zehnmal ueber den Clip, im Export und in der Vorschau. Das Mass saettigt bei
         schnellen Teilchen und zaehlt Blinken mit - ein Hinweis auf 'gleich schnell', kein Geschwindigkeitsmesser. */
      /* Die Rauschshader (15.09.2026) bekommen dieselbe Tempomessung - im Export laeuft die Zeit auf einem Kreis und die
         Drift in zwei Lagen, beides soll so schnell ziehen und wabern wie im Pult. */
      const SHADER = ['filmnebel','wellen','kaustik','flammen'], shader = STAPEL.some(e => SHADER.includes(e.typ));
      const bewegt = STAPEL.some(e => e.typ==='partikel' || e.typ==='tropfen' || SHADER.includes(e.typ)), BG = 2, bIdx = bewegt ? Array.from({ length:10 }, (_, k) => k*Math.floor((N-BG)/10)) : [], bBild = {};
      const wechsel = [], bilder = {}; let F0 = null, prev = null, Fm = null, naht = null, gleich = null, erwartet = null, gleichFolge = 0;
      saat = 12345; LOOP = L; FEIN = true; let malMs = 0; glMs = 0; glZahl = 0;
      try{
        /* Der Vorlauf des Gedaechtnisses geht seit 15.09.2026 in Haeppchen vor dem ersten Bild (vorlaufen) - wie beide Exportwege. */
        if(typeof vorlaufen==='function') await vorlaufen(m, gemerkt);
        for(let i=0; i<N+K; i++){
          const tm = performance.now(); exportBild(m, gemerkt, t0 + i/BILDRATE, W, H); warteGL(); malMs += performance.now() - tm;
          const d = V.grab(m.lein);
          if(i<K) anfang.push(d);
          if(i===0) F0 = d;
          else { if(i<=N-1) wechsel.push(V.block(prev, d)); if(i===N-1) naht = V.block(F0, d); if(i===N){ gleich = V.block(F0, d); erwartet = V.block(prev, d); } }
          if(i>=N) gleichFolge = Math.max(gleichFolge, V.block(anfang[i-N], d));
          if(i===mitte) Fm = d;
          if(bewegt && bIdx.some(q => q===i || q+BG===i)) bBild[i] = d;
          if(o.bilder && (i===0 || i===N-1 || i===N)) (bilder[i===0?'erstes':i===N?'nachL':'letztes'] = m.lein.toDataURL('image/png'));
          prev = d; if(i%4===3) await warte(0);
        }
      } finally { LOOP = 0; FEIN = false; }
      const glTypen = STAPEL.filter(e => EFFEKTE[e.typ].art==='gl').map(e => e.typ);
      const gl = glTypen.length ? glTypen.every(k => !!(GL.gl && GL.noise && (GL.prog[k] || GL.prog[k+'@schleife']))) : null;
      /* lief die loopfaehige Exportform (nur Shader, die eine haben)? */
      const glSchleife = glTypen.filter(k => (GL_SHADER[k]||'').indexOf('#ifdef LOOPFORM')>=0).map(k => k+':'+(GL.prog[k+'@schleife'] ? 'ja' : 'NEIN'));
      const nicht = [...new Set(STAPEL.filter(e => aktiv(e) && (typeof loopNein==='function' ? loopNein(e) : LOOP_NEIN.includes(e.typ))).map(e => e.typ))];
      const sort = wechsel.slice().sort((a,b) => a-b), p95 = sort.length ? sort[Math.min(sort.length-1, Math.floor(0.95*(sort.length-1)))] : 0;
      /* Vorschau zur Clipmitte: wie weit weicht der Export vom Pult ab (Hinweis, kein Urteil) */
      const vm = V.grab(vorschauBild(f, t0, L, takte, takt, W, H, t0 + mitte/BILDRATE));
      const erg = { t0:r2(t0), L:r2(L), N, takte, proTakt, M:takte*proTakt, schlaegeImRaster:S.length, jeClip:S.jeClip||0, W, H, vergleich:[V.cw, V.ch],
        gleich:r2(gleich), gleichFolge:r2(gleichFolge), naht:r2(naht), erwartet:r2(erwartet), p95:r2(p95), quotient:r2(naht/Math.max(p95, 0.5)), gl, glSchleife, tiefe:!!TIEFEN[DATA.id],
        vorschauAbw:r2(V.mittel(Fm, vm)), loopNeinAnzeige:nicht, schlaegeImDATA:DATA.schlaege.length };
      if(bewegt){ const bx = bIdx.reduce((s, q) => s + V.mittel(bBild[q], bBild[q+BG]), 0) / bIdx.length;
        const bv = bIdx.reduce((s, q) => { const a = V.grab(vorschauBild(f, t0, L, takte, takt, W, H, t0 + q/BILDRATE)); return s + V.mittel(a, V.grab(vorschauBild(f, t0, L, takte, takt, W, H, t0 + (q+BG)/BILDRATE))); }, 0) / bIdx.length;
        erg.bewegungExport = r2(bx); erg.bewegungVorschau = r2(bv); erg.tempoVerh = r2(bx / Math.max(1e-3, bv));
        /* KONTRAST UEBER DIE CLIPZEIT (nur Shader): zwei ueberblendete Rauschlagen koennen in der Mitte weicher werden, ohne
           dass gleich oder quotient es merken. Je Stichbild die Standardabweichung der Helligkeit und die des Musteranteils
           (Bild minus Mittel der Stichbilder) - im Export und in der Vorschau. Schwankt der Export deutlich mehr, pulsiert er. */
        if(shader){ const hell = d => { const h = new Float32Array(d.length/4); for(let i=0, j=0; i<d.length; i+=4) h[j++] = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2]; return h; };
          const std = a => { let s = 0, q = 0; for(const v of a){ s += v; q += v*v; } const mu = s/a.length; return Math.sqrt(Math.max(0, q/a.length - mu*mu)); };
          const reihe = bilder => { const hs = bilder.map(hell), mit = new Float32Array(hs[0].length); for(const h of hs) for(let i=0; i<h.length; i++) mit[i] += h[i]/hs.length;
            const ks = hs.map(std), ms = hs.map(h => std(h.map((v, i) => v - mit[i]))); const z = a => [r2(Math.min(...a)), r2(Math.max(...a))]; return { kontrast:z(ks), muster:z(ms) }; };
          erg.kontrastExport = reihe(bIdx.map(q => bBild[q]));
          erg.kontrastVorschau = reihe(bIdx.map(q => V.grab(vorschauBild(f, t0, L, takte, takt, W, H, t0 + q/BILDRATE)))); } }
      /* RECHENZEIT je Bild: im Export (Exportgroesse, LOOP=L) und in der Vorschau (Pultgroesse, LOOP=0) - Regel 14, die
         Vorschau muss live fluessig bleiben. ein Bildpunkt wird zurueckgelesen, damit die Zeit des Shaders mitzaehlt - gl.finish() wartet in Chrome nicht. */
      erg.msExport = r2(malMs / (N+K)); if(glZahl) erg.msGLExport = r2(glMs / glZahl);
      if(shader){ const Wv = lein.width, Hv = lein.height; STAPEL = effekteBauen(f.effekte); const gm = bundel(), mv = exportBuendel(gm, t0, L, takte, takt, Wv, Hv); LOOP = 0; FEIN = false;
        for(let k=0; k<3; k++) exportBild(mv, gm, t0 + k/BILDRATE, Wv, Hv);
        glMs = 0; glZahl = 0; const tv = performance.now(); for(let k=0; k<30; k++){ exportBild(mv, gm, t0 + k/BILDRATE, Wv, Hv); warteGL(); }
        erg.msVorschau = r2((performance.now() - tv) / 30); if(glZahl) erg.msGLVorschau = r2(glMs / glZahl); erg.vorschauMass = [Wv, Hv]; }
      if(o.vorschauSpeichern || o.vorschauVergleich){
        const zeiten = o.vorschauVergleich ? o.vorschauVergleich.zeiten : [t0, t0+2.3, t0+5.7];
        const bilder = zeiten.map(tv => klein(vorschauBild(f, t0, L, takte, takt, W, H, tv)));
        if(o.vorschauSpeichern) erg.vorschau = { zeiten, W, H, bilder };
        if(o.vorschauVergleich) erg.vorschauRegression = r2(bilder.reduce((s, b, i) => s + abwB64(b, o.vorschauVergleich.bilder[i]), 0) / bilder.length);
      }
      if(o.bilder) erg.bilder = bilder;
      erg.dauerMs = Math.round(performance.now() - beginn);
      return erg;
    } finally { Math.random = zufallEcht; datenSetzen('normal'); STAPEL = []; }
  }
  return { typen, bereitMachen, fall };
})();
/* <<< Pruefhaken der Nahtpruefung */
