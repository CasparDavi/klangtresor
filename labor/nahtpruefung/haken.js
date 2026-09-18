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
    /* Auf die Tiefenkarte DER GEWAEHLTEN QUELLE warten - und nur so lange, wie es etwas zu
       erwarten gibt. `TIEFEN[id]` gilt seit dem 17.09.2026 nicht mehr: der Vorrat haengt an der
       Quelle, nicht an der Titelkennung.
       UND „ES GIBT HIER KEINE" IST EIN ENDE, KEIN WARTEN (Gegenlesen 17.09.2026). Bewegtbild und
       Pruefbild erreichen `da` nie; die Schleife lief dort jedes Mal ihre volle Reissleine ab -
       80 x 50 ms = 4 s je Titel, ohne je etwas zu holen. tiefeStand() unterscheidet die drei
       Faelle: nur „unterwegs" ist Warten wert, „da" und „keine" sind fertig. tiefeBildVon()
       stoesst das Laden an und nimmt seit dem Umbau keine Titelkennung mehr entgegen. */
    tiefeBildVon(); for(let i=0; i<80 && tiefeStand()==='unterwegs'; i++) await warte(50);
    /* DAS HAUSZEICHEN, UND ZWAR DEKODIERT (Gegenlesen 18.09.2026). Hier stand eine Schleife auf
       `.complete` - und genau die belegte nichts: bei einer data:-URI ist .complete schon wahr,
       bevor das Bild dekodiert ist. Der Pruefstand ging also weiter, zeichenMalen() malte in den
       ersten Bildern nichts, und mitten im Clip sprang das Zeichen hinein; Bild(N) war nicht
       bitgleich Bild(0), und das Blockmittel des Vergleichers sah die 318 Bildpunkte in der Ecke
       nicht. zeichenBereit() wartet auf decode(), wie es jeder Exportweg jetzt auch tut. */
    { const [Wz, Hz] = ausgabeMass(360); await zeichenBereit(Wz, Hz); }
    ORIG = DATA.schlaege.map(s => s.slice());
    window.aktuellId = id; window.audio = { paused:false, currentTime:jetzt };
    return { gl:!!GL.gl, noise:!!GL.noise, tiefe:tiefeKarteDa(), schlaege:ORIG.length, titel:DATA.titel, einsen:ORIG.filter(s=>s[1]===1).length };
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
        : a==='tempowechsel' ? S.map(s => [s[0] <= jetzt ? s[0] : jetzt + (s[0]-jetzt)*z, s[1]])   /* Taktlage 15.09.2026: ab jetzt f-mal so langsam */
        : a==='wenige' ? (() => { let k = S.findIndex(s => s[0]>jetzt); if(k<0) k = S.length; const v = Math.max(0, k-(z>>1)); return S.slice(v, v+z); })()
        : S; }
    DATA.schlaege = S;
  }
  /* Karten ueber den echten Rezept-Import, damit Vorgaben und Uebersetzungen stimmen. Die Nummern beginnen
     je Fall bei 1: viele Maler saeen ihren Zufall mit e.id, sonst misst jeder Lauf andere Wuerfel.
     Eine Partikel-Art bringt Farben, Masse und Eigenbewegung mit (artFarben) - wie beim Umstellen im Pult. */
  /* DIE FASSUNG IST EINE EIGENSCHAFT DES FALLES, KEINE 99 (Gegenlesen 17.09.2026). Hier stand
     effektAusRezept(r, false, 99) - eine Fassung, die es nicht gibt, und sie schaltete damit jede
     Uebersetzung ab, die auf eine Fassungsgrenze prueft. Konkret: zoneUebersetzen() gibt einem
     Partikel-Effekt mit Aufenthalt vorn/hinten aus einem Rezept der Fassung 3 den Wert
     tiefeVerdeckung='zone' (die Zone wird WEICH ausgeschnitten, ohne Betretungsverbot). Mit 99
     bekam derselbe Effekt im Pruefstand das HARTE Betretungsverbot - der Pruefstand malte etwas
     anderes als die App, und gerade bei den Faellen, um die es geht. Ein Werkzeug, das nicht das
     prueft, was laeuft, ist schlimmer als keines.
     Ab heute traegt der FALL seine Fassung (f.fassung), wie die Rezeptdatei sie traegt; fehlt sie,
     gilt die Fassung, in der das Haus gerade SCHREIBT - von Hand geschriebene Faelle meinen die
     heutige Bedeutung ihrer Felder. Die Zahl wird aus presetJSON() gelesen und nicht abgeschrieben,
     sonst driftet sie beim naechsten Heben der Fassung wieder auseinander. `alt` leitet sich daraus
     ab wie im Haus (presetLesen: alt = !(fassung >= 2)), statt fest false zu sein.
     Ein Fall, der das ALTE Verhalten pruefen will, schreibt `"fassung": 3` dazu. */
  let FASSUNG_HAUS = null;
  function fassungHaus(){
    if(FASSUNG_HAUS == null){
      const f = JSON.parse(presetJSON()).fassung | 0;
      if(!(f > 0)) throw new Error('Fassung des Hauses nicht lesbar - der Pruefstand darf sie nicht raten');
      FASSUNG_HAUS = f; }
    return FASSUNG_HAUS; }
  function effekteBauen(defs, fall){ nr = 0;
    const fassung = (fall && fall.fassung != null) ? (fall.fassung | 0) : fassungHaus();
    const alt = (fall && fall.alt != null) ? !!fall.alt : !(fassung >= 2);
    return defs.map(r => { let e;
      if(r.typ==='partikel' && r.art && r.art!=='schnee'){ e = effektAusRezept(Object.assign({}, r, { art:'schnee' }), alt, fassung); e.art = r.art; artFarben(e); for(const k of Object.keys(r)) if(k!=='typ') e[k] = Array.isArray(r[k]) ? r[k].slice() : r[k]; }
      else e = effektAusRezept(Object.assign({}, r), alt, fassung);
      if(!e) throw new Error('Rezept baut keinen Effekt: '+JSON.stringify(r));
      return e; }); }
  function vergleicher(W, H, lang, guete){
    const sc = lang / Math.max(W, H), cw = Math.max(1, Math.round(W*sc)), ch = Math.max(1, Math.round(H*sc));
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const cx = cv.getContext('2d', { willReadFrequently:true });
    if(guete) cx.imageSmoothingQuality = guete;   /* Massstab: 360 und 1080 werden verschieden stark verkleinert - dann wenigstens mit gutem Filter */
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
  function vorschauBild(f, lage, W, H, tv){
    STAPEL = effekteBauen(f.effekte, f); soloId = null;
    const gm = bundel(), mv = exportBuendel(gm, lage, W, H); mv.DATA = Object.assign({}, DATA);
    LOOP = 0; FEIN = false; saat = 777;
    const anlauf = STAPEL.some(e => e.typ==='nachzieh') ? 45 : 0;
    for(let k=anlauf; k>=0; k--) exportBild(mv, gm, tv - k/BILDRATE, W, H);
    return mv.lein;
  }
  const klein = (q) => { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 86; const cx = cv.getContext('2d', { willReadFrequently:true }); cx.drawImage(q, 0, 0, 64, 86); const d = cx.getImageData(0, 0, 64, 86).data, rgb = new Uint8Array(64*86*3);
    for(let i=0, j=0; i<d.length; i+=4){ rgb[j++] = d[i]; rgb[j++] = d[i+1]; rgb[j++] = d[i+2]; } let s = ''; for(let i=0; i<rgb.length; i+=8192) s += String.fromCharCode.apply(null, rgb.subarray(i, i+8192)); return btoa(s); };
  const abwB64 = (a, b) => { const x = atob(a), y = atob(b); if(x.length!==y.length) return 255; let t = 0; for(let i=0; i<x.length; i++) t += Math.abs(x.charCodeAt(i)-y.charCodeAt(i)); return t/x.length; };

  /* TAKTLAGE NACHGERECHNET (15.09.2026, Caspar_D: "suno startet song und video gleichzeitig"). Unabhaengig von
     taktLage(): aus dem Raster, das der Export wirklich traegt, wird je Bild ermittelt, ob dort ein Puls ERSCHEINT
     (ein Rasterschlag bt mit t0+(i-1)/30 < bt <= t0+i/30, so liest pulswert), und jeder echte Songschlag bei Songzeit s
     faellt auf Clipbild (s*30) mod N. Sitzt, wenn das naechste Pulsbild naeher als 1/8 Schlag, hoechstens 80 ms liegt; bei
     Eins-Lesern muss eine Song-Eins auf einem Pulsbild mit umlaufender Nummer q, q mod modul == 0 liegen - eine 1, der
     binnen 1,5 Schlaegen wieder eine 1 folgt, ist keine Takt-Eins. Gewicht: Dauer bis zum naechsten Schlag, hoechstens
     1,5 Median-Schlaege - so wie die Anzeige es verspricht. */
  function nachrechnen(lage, R, t0, echt){
    if(!lage || !lage.M || !R || !R.length || !echt || echt.length < 2) return null;
    const N = lage.N, M = lage.M, nb = N/M, q = new Int32Array(N).fill(-1);
    for(const b of R){ let i = Math.ceil((b[0]-t0)*BILDRATE - 1e-6); while(t0 + (i-1)/BILDRATE >= b[0]) i--; while(t0 + i/BILDRATE < b[0]) i++;
      const k = ((i % N) + N) % N; if(q[k] < 0 || b[2] % lage.modul === 0) q[k] = b[2]; }
    const d = []; for(let i=1; i<echt.length; i++){ const x = echt[i][0]-echt[i-1][0]; if(x>0.05 && x<2) d.push(x); } d.sort((a,b)=>a-b); const schlag = d.length ? d[d.length>>1] : nb/BILDRATE, fenster = Math.min(1/8, 0.08/schlag);
    let sz = 0, gz = 0, se = 0, ge = 0, pulsbilder = 0; for(let k=0; k<N; k++) if(q[k] >= 0) pulsbilder++;
    for(let i=0; i<echt.length; i++){ const s = echt[i][0], w = Math.max(0, i+1<echt.length ? Math.min(echt[i+1][0]-s, 1.5*schlag) : schlag);
      const c = ((s*BILDRATE) % N + N) % N, grenze = Math.ceil(nb) + 2; let best = null;
      for(let a=0; a<=grenze && best==null; a++){ const zur = Math.floor(c) - a, vor = Math.ceil(c) + a;   /* bei Gleichstand das fruehere, wie taktLage */
        const kz = ((zur % N) + N) % N, kv = ((vor % N) + N) % N, ez = c - zur, ev = vor - c;
        if(q[kz] >= 0 && (q[kv] < 0 || ez <= ev)) best = { e:ez/nb, q:q[kz] }; else if(q[kv] >= 0) best = { e:ev/nb, q:q[kv] }; }
      const eins = echt[i][1] === 1 && !(i+1 < echt.length && echt[i+1][1] === 1 && echt[i+1][0]-s < 1.5*schlag), sitzt = best && best.e < fenster && (!lage.mitEins || !eins || best.q % lage.modul === 0) ? 1 : 0;
      sz += sitzt*w; gz += w; if(eins){ se += sitzt*w; ge += w; } }
    const sitzt = gz ? sz/gz : 0, einsQuote = ge ? se/ge : null;
    return { sitzt:Math.round(sitzt*1000)/1000, einsQuote:einsQuote==null?null:Math.round(einsQuote*1000)/1000, anzeige:Math.round((lage.mitEins && einsQuote!=null ? Math.min(sitzt, einsQuote) : sitzt)*1000)/1000, pulsbilder };
  }
  /* KATALOGMESSUNG UEBER DEN EINGEBAUTEN CODE: node reicht Schlaege, Abschnitte und Dauer herein, gerechnet wird mit
     taktLage() und raster() des Studios. Zum Vergleich die Lage von vorher (ganze Takte <= 10 s auf Bilder gerundet,
     Clipschlag 0 auf Bild 0) - diese Formel lebt nur hier im Pruefstand. */
  function katalog(liste, varianten){
    const aus = [];
    for(const s of liste){ const S = s.schlaege, einsen = S.filter(x => x[1]===1).map(x => x[0]), t0 = einsen.length ? einsen[0] : S[0][0], r = { id:s.id };
      for(const [name, bedarf] of Object.entries(varianten)){
        const tm = performance.now(), tl = taktLage(S, s.abschnitte, s.dauer, bedarf), ms = performance.now() - tm;
        if(!tl){ r[name] = null; continue; }
        const lage = Object.assign({ t0 }, tl), R = raster(t0, tl.N, tl.M, tl.proTakt, tl.phiF);
        r[name] = { N:tl.N, M:tl.M, P:tl.proTakt, phiF:tl.phiF, sitzt:tl.sitzt, anzeige:tl.anzeige, einsQuote:tl.einsQuote, refrain:tl.sitztRefrain, G:tl.G, grund:tl.grund, ms, nach:nachrechnen(lage, R, t0, S) };
        const satz = taktSatz(tl.anzeige, tl.grund, true); r[name].satz = satz;
        /* vorher: dieselbe Kartenlage mit dem alten ausschnitt() (ohne Teiler, brauch 1) */
        const { takt } = taktLaenge(S), schlag = schlagMedian(S), tk = takt > 0.05 ? takt : 4*schlag;
        const z = Math.max(1, Math.floor(MAX_SEK/tk)), Lr = Math.max(2, Math.round(Math.min(MAX_SEK, z*tk)*BILDRATE))/BILDRATE, tlang = Lr/z;
        const P = schlag > 0 ? Math.max(1, Math.min(16, Math.round(tlang/schlag))) : 4, alt = { N:Math.round(Lr*BILDRATE), M:P*z, proTakt:P, modul:tl.modul, mitEins:tl.mitEins };
        r[name].vorher = Object.assign({ N:alt.N, M:alt.M }, nachrechnen(alt, raster(t0, alt.N, alt.M, P, 0), t0, S)); }
      aus.push(r); }
    return aus;
  }

  async function fall(f, o){
    o = o || {}; const lange = o.lange || 360, vlang = o.vergleich || 256, r2 = x => Math.round(x*1000)/1000;
    const beginn = performance.now();
    if(typeof f.jetzt==='number') window.audio = { paused:false, currentTime:f.jetzt };
    datenSetzen(f.daten || 'normal');
    Math.random = zufall;
    try{
        STAPEL = effekteBauen(f.effekte, f); soloId = null;
      const lage = ausschnitt(), { t0, L, N } = lage; const [W, H] = ausgabeMass(lange);
      const gemerkt = bundel(), m = exportBuendel(gemerkt, lage, W, H);
      const S = m.DATA.schlaege, proTakt = lage.proTakt;
      /* SYNCHRON NACHGERECHNET (15.09.2026): aus dem exportierten Raster und den echten Schlaegen dieses Falls, unabhaengig von taktLage() */
      const synchron = nachrechnen(lage, S, t0, DATA.schlaege);
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
      const vm = V.grab(vorschauBild(f, lage, W, H, t0 + mitte/BILDRATE));
      const erg = { t0:r2(t0), L:r2(L), N, takte:r2(lage.takte), proTakt, M:lage.M, phiF:lage.phiF, sitzt:lage.sitzt==null?null:r2(lage.sitzt), anzeige:lage.anzeige==null?null:r2(lage.anzeige), einsQuote:lage.einsQuote==null?null:r2(lage.einsQuote), synchron, satz:taktSatz(lage.anzeige, lage.grund, true), schlaegeImRaster:S.length, jeClip:S.jeClip||0, W, H, vergleich:[V.cw, V.ch],
        gleich:r2(gleich), gleichFolge:r2(gleichFolge), naht:r2(naht), erwartet:r2(erwartet), p95:r2(p95), quotient:r2(naht/Math.max(p95, 0.5)), gl, glSchleife, tiefe:tiefeKarteDa(),
        vorschauAbw:r2(V.mittel(Fm, vm)), loopNeinAnzeige:nicht, schlaegeImDATA:DATA.schlaege.length };
      if(bewegt){ const bx = bIdx.reduce((s, q) => s + V.mittel(bBild[q], bBild[q+BG]), 0) / bIdx.length;
        const bv = bIdx.reduce((s, q) => { const a = V.grab(vorschauBild(f, lage, W, H, t0 + q/BILDRATE)); return s + V.mittel(a, V.grab(vorschauBild(f, lage, W, H, t0 + (q+BG)/BILDRATE))); }, 0) / bIdx.length;
        erg.bewegungExport = r2(bx); erg.bewegungVorschau = r2(bv); erg.tempoVerh = r2(bx / Math.max(1e-3, bv));
        /* KONTRAST UEBER DIE CLIPZEIT (nur Shader): zwei ueberblendete Rauschlagen koennen in der Mitte weicher werden, ohne
           dass gleich oder quotient es merken. Je Stichbild die Standardabweichung der Helligkeit und die des Musteranteils
           (Bild minus Mittel der Stichbilder) - im Export und in der Vorschau. Schwankt der Export deutlich mehr, pulsiert er. */
        if(shader){ const hell = d => { const h = new Float32Array(d.length/4); for(let i=0, j=0; i<d.length; i+=4) h[j++] = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2]; return h; };
          const std = a => { let s = 0, q = 0; for(const v of a){ s += v; q += v*v; } const mu = s/a.length; return Math.sqrt(Math.max(0, q/a.length - mu*mu)); };
          const reihe = bilder => { const hs = bilder.map(hell), mit = new Float32Array(hs[0].length); for(const h of hs) for(let i=0; i<h.length; i++) mit[i] += h[i]/hs.length;
            const ks = hs.map(std), ms = hs.map(h => std(h.map((v, i) => v - mit[i]))); const z = a => [r2(Math.min(...a)), r2(Math.max(...a))]; return { kontrast:z(ks), muster:z(ms) }; };
          erg.kontrastExport = reihe(bIdx.map(q => bBild[q]));
          erg.kontrastVorschau = reihe(bIdx.map(q => V.grab(vorschauBild(f, lage, W, H, t0 + q/BILDRATE)))); } }
      /* RECHENZEIT je Bild: im Export (Exportgroesse, LOOP=L) und in der Vorschau (Pultgroesse, LOOP=0) - Regel 14, die
         Vorschau muss live fluessig bleiben. ein Bildpunkt wird zurueckgelesen, damit die Zeit des Shaders mitzaehlt - gl.finish() wartet in Chrome nicht. */
      erg.msExport = r2(malMs / (N+K)); if(glZahl) erg.msGLExport = r2(glMs / glZahl);
      if(shader){ const Wv = lein.width, Hv = lein.height; STAPEL = effekteBauen(f.effekte, f); const gm = bundel(), mv = exportBuendel(gm, lage, Wv, Hv); LOOP = 0; FEIN = false;
        for(let k=0; k<3; k++) exportBild(mv, gm, t0 + k/BILDRATE, Wv, Hv);
        glMs = 0; glZahl = 0; const tv = performance.now(); for(let k=0; k<30; k++){ exportBild(mv, gm, t0 + k/BILDRATE, Wv, Hv); warteGL(); }
        erg.msVorschau = r2((performance.now() - tv) / 30); if(glZahl) erg.msGLVorschau = r2(glMs / glZahl); erg.vorschauMass = [Wv, Hv]; }
      if(o.vorschauSpeichern || o.vorschauVergleich){
        const zeiten = o.vorschauVergleich ? o.vorschauVergleich.zeiten : [t0, t0+2.3, t0+5.7];
        const bilder = zeiten.map(tv => klein(vorschauBild(f, lage, W, H, tv)));
        if(o.vorschauSpeichern) erg.vorschau = { zeiten, W, H, bilder };
        if(o.vorschauVergleich) erg.vorschauRegression = r2(bilder.reduce((s, b, i) => s + abwB64(b, o.vorschauVergleich.bilder[i]), 0) / bilder.length);
      }
      if(o.bilder) erg.bilder = bilder;
      erg.dauerMs = Math.round(performance.now() - beginn);
      return erg;
    } finally { Math.random = zufallEcht; datenSetzen('normal'); STAPEL = []; }
  }
  /* ==== STUDIOMASS (15.09.2026) ====
     Caspar_D: "unsere eigenen Effektclips skalieren nicht mit dem zoom auf die videos ... Das resultiert in absurd grossen
     Schneeflocken." - "im Studio arbeite ich ja nach Augenschein, was dort rauskommt ist der Massstab, den wir am Ende
     brauchen." - "ich benutzte bisher immer die vorgegebene Fenstergroesse." Drei Messungen, BEVOR das Studio umgebaut wird:
     feld() liest ab, wie gross das Studio in einem Fenster wirklich malt; studio() malt jeden Fall in dieser Vorgabegroesse
     und haelt einen bitgenauen Hash fest (dort muss der Umbau bitgleich bleiben); massstab() malt denselben Augenblick in
     zwei Groessen und misst, wie sehr das Bild von der Groesse abhaengt. */
  function feld(){ const r = s => { const e = document.querySelector(s); if(!e) return null; const b = e.getBoundingClientRect(); return { x:b.x, y:b.y, w:b.width, h:b.height }; };
    const vorher = [lein.width, lein.height]; groesse(); const [bw, bh] = qMass(bild);
    return { fenster:[innerWidth, innerHeight], dpr:devicePixelRatio, kasten:r('#tbs-kasten'), kopf:r('#tbs-kopf'), feld:r('#tbs-feld'), pult:r('#tbs-pult'), bild:[bw, bh], lein:[lein.width, lein.height], leinVorGroesse:vorher, offen:!!offen, bereit:!!bereit }; }
  /* Ein Augenblick wie im Pult: LOOP=0, echte Schlaege, frische Karten, gesaeter Zufall, eigene Leinwaende in W x H.
     Anders als vorschauBild ohne Hauszeichen - das Pult malt keins, und es skaliert ohnehin mit der Bildgroesse. */
  function augenblick(f, lage, W, H, tv, s){
    STAPEL = effekteBauen(f.effekte, f); soloId = null;
    const gm = bundel(), mv = exportBuendel(gm, lage, W, H); mv.DATA = Object.assign({}, DATA);
    LOOP = 0; FEIN = false; saat = s;
    const anlauf = STAPEL.some(e => e.typ==='nachzieh') ? 45 : 0;
    setzen(mv); try{ for(let k=anlauf; k>=0; k--) zeichneFrame(tv - k/BILDRATE); }catch(x){ console.warn('Studiomass:', x); } finally { setzen(gm); }
    warteGL(); return mv.lein; }
  const pixel = cv => cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  const sha = async d => [...new Uint8Array(await crypto.subtle.digest('SHA-256', d))].map(b => b.toString(16).padStart(2, '0')).join('');
  /* volle Aufloesung: mittlere Abweichung (0..255 je Kanal), groesster Bildpunkt (Mittel ueber RGB) und groesster 16x16-Block */
  function abw(a, b, W, H){ const bx = Math.ceil(W/16), by = Math.ceil(H/16), sum = new Float64Array(bx*by), zahl = new Float64Array(bx*by); let t = 0, mx = 0;
    for(let y=0; y<H; y++) for(let x=0; x<W; x++){ const i = (y*W+x)*4, v = Math.abs(a[i]-b[i]) + Math.abs(a[i+1]-b[i+1]) + Math.abs(a[i+2]-b[i+2]), k = (y>>4)*bx + (x>>4); t += v; if(v>mx) mx = v; sum[k] += v; zahl[k]++; }
    let bm = 0; for(let k=0; k<sum.length; k++) bm = Math.max(bm, sum[k]/(zahl[k]*3)); return { mittel:t/(W*H*3), max:mx/3, block:bm }; }
  /* Vergleichsbild: lange Seite 96, RGB, base64 - nur fuer das Abweichungsmass, wenn der Hash nicht gleich ist */
  const KL = 96, kleinProp = q => { const s = KL/Math.max(q.width, q.height), w = Math.max(1, Math.round(q.width*s)), h = Math.max(1, Math.round(q.height*s)), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const cx = cv.getContext('2d', { willReadFrequently:true }); cx.imageSmoothingQuality = 'high'; cx.drawImage(q, 0, 0, w, h); const d = cx.getImageData(0, 0, w, h).data, rgb = new Uint8Array(w*h*3);
    for(let i=0, j=0; i<d.length; i+=4){ rgb[j++] = d[i]; rgb[j++] = d[i+1]; rgb[j++] = d[i+2]; } let s2 = ''; for(let i=0; i<rgb.length; i+=8192) s2 += String.fromCharCode.apply(null, rgb.subarray(i, i+8192)); return { w, h, b64:btoa(s2) }; };
  const abwKlein = (a, b) => { if(!a || !b || a.w!==b.w || a.h!==b.h) return null; const x = atob(a.b64), y = atob(b.b64); let t = 0, mx = 0;
    for(let i=0; i<x.length; i+=3){ const v = (Math.abs(x.charCodeAt(i)-y.charCodeAt(i)) + Math.abs(x.charCodeAt(i+1)-y.charCodeAt(i+1)) + Math.abs(x.charCodeAt(i+2)-y.charCodeAt(i+2)))/3; t += v; if(v>mx) mx = v; } return { mittel:t/(x.length/3), max:mx }; };
  const r3 = x => x==null ? null : Math.round(x*1000)/1000;
  /* DIE VORBEREITUNG GEHOERT ZUM FALL (18.09.2026). Sie stand bis heute nie in einem Fall - und genau
     darum blieb die Zeile unbemerkt, die den Ausschnitt ein zweites Mal ausschnitt, sobald Vorbereitung
     UND Parallaxe zusammenkamen. `vorb` im Fall geht durch vorbAus() wie ein gespeichertes Rezept; das
     _id bleibt stehen, sonst waechst der kurvenraum um ein <filter> je Fall. */
  function vorbSetzen(r){ const vi = VORB._id; VORB = vorbAus(r || null); VORB._id = vi; }
  function vorbereiten(f){ if(typeof f.jetzt==='number') window.audio = { paused:false, currentTime:f.jetzt }; datenSetzen(f.daten || 'normal'); Math.random = zufall; vorbSetzen(f.vorb); STAPEL = effekteBauen(f.effekte, f); soloId = null; return ausschnitt(); }
  function aufraeumenMass(){ Math.random = zufallEcht; datenSetzen('normal'); vorbSetzen(null); STAPEL = []; LOOP = 0; FEIN = false; }

  /* STUDIO IN VORGABEGROESSE: o.feld = [FW, FH] aus studiofeld.json; das Bild eingepasst wie groesse() es tut. Zweimal
     hintereinander gemalt: gleiche Hashes heissen deterministisch. Sonst steht statt des Hashes das Eigenrauschen. */
  async function studio(f, o){
    const beginn = performance.now();
    try{
      const lage = vorbereiten(f), t0 = lage.t0, [bw, bh] = qMass(bild), sc = Math.min(o.feld[0]/bw, o.feld[1]/bh), W = Math.max(1, Math.round(bw*sc)), H = Math.max(1, Math.round(bh*sc));
      const zeiten = (o.vergleich && o.vergleich.zeiten) || [t0, t0+2.3, t0+5.7], erg = { t0:r3(t0), W, H, zeiten, messung:[], bilder:[] };
      for(let i=0; i<zeiten.length; i++){
        const a = pixel(augenblick(f, lage, W, H, zeiten[i], 777)), cvB = augenblick(f, lage, W, H, zeiten[i], 777), b = pixel(cvB), ha = await sha(a), hb = await sha(b);
        const z = { hash:ha, deterministisch:ha===hb }; if(!z.deterministisch){ const e = abw(a, b, W, H); z.eigenrauschen = { mittel:r3(e.mittel), max:r3(e.max), block:r3(e.block) }; }
        const kl = kleinProp(cvB); erg.bilder.push(kl);
        if(o.vergleich){ const v = o.vergleich.messung[i] || {}; z.gleich = !!v.hash && v.hash===ha;
          if(!z.gleich){ const k = abwKlein(kl, o.vergleichBilder && o.vergleichBilder[i]); z.abw = k ? { mittel:r3(k.mittel), max:r3(k.max) } : 'kein Vergleichsbild'; } }
        erg.messung.push(z); await warte(0); }
      erg.deterministisch = erg.messung.every(z => z.deterministisch);
      if(o.vergleich){ erg.gleich = erg.messung.every(z => z.gleich); erg.massGleich = o.vergleich.W===W && o.vergleich.H===H;
        const ab = erg.messung.filter(z => z.abw && typeof z.abw==='object'); if(ab.length){ erg.abwMittel = r3(Math.max(...ab.map(z => z.abw.mittel))); erg.abwMax = r3(Math.max(...ab.map(z => z.abw.max))); } }
      erg.dauerMs = Math.round(performance.now() - beginn);
      return erg;
    } finally { aufraeumenMass(); }
  }
  /* MASSSTAB: derselbe Augenblick (t0 + 2,3 s) mit langer Seite 360 und 1080, beide mit derselben Filterung auf lange Seite
     256. Skaliert ein Effekt mit dem Bild, sehen beide gleich aus; der Kontrollfall ohne Effekt zeigt den Boden, den
     Aufloesung und Filter allein machen. */
  async function massstab(f, o){
    const beginn = performance.now();
    try{
      const lage = vorbereiten(f), t0 = lage.t0, tv = t0 + (o.zeit==null ? 2.3 : o.zeit), [bw, bh] = qMass(bild);
      const mass = lang => { const s = lang/Math.max(bw, bh); return [Math.max(1, Math.round(bw*s)), Math.max(1, Math.round(bh*s))]; };
      const V = vergleicher(bw, bh, o.vergleich || 256, 'high'), [W1, H1] = mass(o.klein || 360), [W2, H2] = mass(o.gross || 1080);
      const k = V.grab(augenblick(f, lage, W1, H1, tv, 777)).slice(), g = V.grab(augenblick(f, lage, W2, H2, tv, 777));
      const erg = { t0:r3(t0), zeit:r3(tv), klein:[W1, H1], gross:[W2, H2], vergleich:[V.cw, V.ch], mittel:r3(V.mittel(k, g)), block:r3(V.block(k, g)) };
      if(o.bilder){ const cv = document.createElement('canvas'); cv.width = V.cw*2; cv.height = V.ch; const cx = cv.getContext('2d');
        cx.putImageData(new ImageData(new Uint8ClampedArray(k), V.cw, V.ch), 0, 0); cx.putImageData(new ImageData(new Uint8ClampedArray(g), V.cw, V.ch), V.cw, 0); erg.bilder = { paar:cv.toDataURL('image/png') }; }
      erg.dauerMs = Math.round(performance.now() - beginn);
      return erg;
    } finally { aufraeumenMass(); }
  }
  /* ==== LOOP-ANSICHT (15.09.2026) ====
     Caspar_D: "ein Modusknopf im Studio - 10 Sek. Loop waere gut". Die Stufe "Loop verbinden" zeigt zur Songzeit s das Bild,
     das Suno dort aus dem ausgegebenen Clip zeigt: Clipbild i = round((s mod L)*30) mod N. Geprueft wird RECHNERISCH:
     - lage: die Stufe rechnet dieselbe Lage wie ausschnitt() (t0, N, M, P, phiF, anzeige, grund), ihre Zeile endet auf taktSatz();
     - bitgleich: je s das Bild der Ansicht (loopBildMalen ueber zeit(), frische Karten, Saat 777) gegen exportBild() auf einem
       frischen Buendel derselben Groesse bei t0 + i/30, i unabhaengig hier gerechnet (Saat 777, LOOP=L, FEIN wie kodierend);
     - folge (Hinweis): gegen den ECHTEN Export, Bild 0..i der Reihe nach nach vorlaufen() - dort tragen zustandsbehaftete Maler
       (Nachzieh-Spur, gewuerfelter Zufall) ihre Vorgeschichte, die Ansicht springt dagegen mitten hinein;
     - dicht: LOOP und FEIN stehen nach jedem Ansichtsbild wieder auf 0/false;
     - aus: nach dem Ausschalten malt rahmen() (und danach zeichneFrame()) dasselbe Bild wie das Pult VOR dem Einschalten (frische
       Karten, Saat 777, zweites Bild in Folge - ausErstesBildVorher sagt, ob schon das erste gleich war). */
  async function loopAnsicht(f, o){
    o = o || {}; const beginn = performance.now(), jetzt = window.audio.currentTime;
    try{
      const lageExport = vorbereiten(f), L = lageExport.N/BILDRATE, N = lageExport.N, t0 = lageExport.t0;
      const jetztFall = window.audio.currentTime, malAus = async () => { STAPEL = effekteBauen(f.effekte, f); soloId = null; saat = 777; zeichneFrame(zeit()); warteGL(); return sha(pixel(lein).slice()); };
      /* Vorher, ohne Ansicht: zweimal das Pultbild zu jetzt + 2,3 s. Das erste Bild nach einem Kartenwechsel erbt Zeichenzustand der
         Pultleinwaende vom vorigen Fall (frisch() setzt nur Transform, Alpha und Verrechnung) - Vergleichsmass ist darum das zweite. */
      window.audio = { paused:false, currentTime:jetztFall + 2.3 }; const va = await malAus(), vb = await malAus(); window.audio = { paused:false, currentTime:jetztFall };
      loopSchalten(true);
      const lage = loopSicht.lage, zeile = (root.querySelector('#tbs-loopLage') || {}).textContent || '', satz = taktSatz(lageExport.anzeige, lageExport.grund, true);
      const felder = ['t0','N','M','proTakt','phiF','anzeige','grund','ganzeTakte'], lageGleich = felder.every(k => lage[k]===lageExport[k]);
      const erg = { t0:r3(t0), L:r3(L), N, M:lageExport.M, zeile, satz, lageGleich, satzGleich:satz ? zeile.endsWith(satz) : !/sitzt auf|keine Länge bleibt/.test(zeile), W:lein.width, H:lein.height, messung:[] };
      const dauer = (DATA && DATA.dauer) || 180;
      const zeiten = o.zeiten || [0.06, jetztFall, 3*L - 0.4/BILDRATE, 3*L - 0.6/BILDRATE, 7.5*L, 12*L + 0.49/BILDRATE, dauer - 0.3].filter(s => s >= 0 && s < Math.max(dauer, 1)).filter((s, k) => !o.auswahl || o.auswahl.includes(k));
      const W = lein.width, H = lein.height; let dicht = true;
      for(const s of zeiten){
        const iErw = Math.round((((s % L) + L) % L)*BILDRATE) % N;
        STAPEL = effekteBauen(f.effekte, f); soloId = null; saat = 777; loopSicht.m = null; loopSicht.i = -1; window.audio = { paused:false, currentTime:s };
        let i = -1, runden = 0; do { i = loopBildMalen(zeit()); runden++; dicht = dicht && LOOP===0 && FEIN===false; } while(loopSicht.i!==i && runden<300);
        warteGL(); const a = pixel(lein).slice(), ha = await sha(a);
        STAPEL = effekteBauen(f.effekte, f); soloId = null; saat = 777;
        const gm = bundel(), m = exportBuendel(gm, lageExport, W, H); LOOP = L; FEIN = true;
        try{ exportBild(m, gm, t0 + iErw/BILDRATE, W, H); } finally { LOOP = 0; FEIN = false; }
        warteGL(); const b = pixel(m.lein), hb = await sha(b);
        const z = { s:r3(s), i, iErw, runden, bitgleich:ha===hb && i===iErw }; if(ha!==hb){ const e = abw(a, b, W, H); z.abw = { mittel:r3(e.mittel), max:r3(e.max), block:r3(e.block) }; }
        z.bild = a; erg.messung.push(z); await warte(0); }
      if(o.folge !== false){
        STAPEL = effekteBauen(f.effekte, f); soloId = null; saat = 777;
        const gm = bundel(), m = exportBuendel(gm, lageExport, W, H), bis = Math.max(...erg.messung.map(z => z.iErw));
        LOOP = L; FEIN = true;
        try{ await vorlaufen(m, gm);
          for(let k=0; k<=bis; k++){ exportBild(m, gm, t0 + k/BILDRATE, W, H);
            const treffer = erg.messung.filter(z => z.iErw===k); if(treffer.length){ warteGL(); const b = pixel(m.lein);
              for(const z of treffer){ const e = abw(z.bild, b, W, H); z.folge = { mittel:r3(e.mittel), max:r3(e.max), block:r3(e.block) }; } }
            if(k%4===3) await warte(0); } }
        finally { LOOP = 0; FEIN = false; } }
      erg.messung.forEach(z => { delete z.bild; });
      loopSchalten(false);
      /* Umschalter aus: rahmen() gegen zeichneFrame() */
      window.audio = { paused:false, currentTime:jetztFall + 2.3 };
      STAPEL = effekteBauen(f.effekte, f); soloId = null; saat = 777; rahmen(); cancelAnimationFrame(rafId); rafId = 0; warteGL(); const ra = await sha(pixel(lein).slice());
      const rb = await malAus();
      Object.assign(erg, { bitgleich:erg.messung.every(z => z.bitgleich), bitgleichZahl:erg.messung.filter(z => z.bitgleich).length, zahl:erg.messung.length,
        folgeBlockMax:erg.messung.some(z => z.folge) ? r3(Math.max(...erg.messung.filter(z => z.folge).map(z => z.folge.block))) : null,
        folgeGleichZahl:erg.messung.filter(z => z.folge && z.folge.max===0).length, dicht:dicht && LOOP===0 && FEIN===false && !loopAn, ausGleich:ra===vb && rb===vb, ausErstesBildVorher:va===vb });
      erg.dauerMs = Math.round(performance.now() - beginn);
      return erg;
    } finally { try{ loopSchalten(false); }catch(x){} window.audio = { paused:false, currentTime:jetzt }; aufraeumenMass(); }
  }
  /* ===================== MARKEN SIND BEDIENUNG, KEIN BILD (18.09.2026) =====================
     Die Ken Burns Fahrt zeigt ihre Zielpunkte als Marken auf der Buehne. Sie duerfen NIEMALS in
     den Export und niemals in die Kachel (docs/effektclip/KONZEPT-ZIELPUNKTE.md, Abschnitt 9) -
     und solange die Karte offen ist, steht ausserdem die Fahrt, was ebenfalls nur die Buehne
     angehen darf. Gebaut ist es so, dass beides nur in rahmen() geschieht; das hier MISST es,
     statt es zu behaupten (Hausregel 3).
     GEMESSEN WIRD ZWEIMAL DASSELBE BILD, EINMAL MIT OFFENER KARTE UND EINMAL MIT GESCHLOSSENER:
       buehne     rahmen() gegen zeichneFrame() allein - hier MUSS ein Unterschied stehen, sonst
                  waere die Marke gar nicht da und die Probe belegte nichts.
       export     exportBild() auf einem eigenen Buendel, mit und ohne offene Karte - hier muss
                  Bildpunkt fuer Bildpunkt dasselbe stehen.
       kachel     zeichneFrame() auf einem eigenen Buendel (der Weg von clipTick) - ebenso. */
  async function markenProbe(id, jetzt){
    const her = await bereitMachen(id, jetzt);
    const stufeVor = stufeOffen;
    try{
      Math.random = zufall;
      const e = neuerEffekt('kenburns');
      /* DIE KARTE MUSS WIRKLICH OFFEN SEIN (Gegenlesen 18.09.2026). Hier stand nur offenId; die
         Probe konnte damit gar nicht ausloesen: kbKarteEffekt() verlangt offen UND offenId UND
         stufeOffen === 'Kette', und stufeOffen kam im ganzen haken.js kein einziges Mal vor. Es
         wurde also nie eine Marke gezeichnet, die Buehne stand nie - und alle Messwerte fielen
         gruen aus, ohne dass etwas geprueft war. Dieselben Nullen kaemen heraus, wenn kbMarkenMalen
         versehentlich in zeichneFrame stuende und Marken in jeden Export malte.
         DARUM WIRD DIE VORAUSSETZUNG GEPRUEFT UND NICHT ANGENOMMEN: gibt kbKarteEffekt() bei
         offener Karte null, bricht die Probe ab, statt ein leeres Gruen zu melden. */
      stufeOffen = 'Kette';
      STAPEL = [e]; soloId = null; offenId = e.id;
      if(!kbKarteEffekt()) throw new Error('markenProbe: die Ken-Burns-Karte gilt nicht als offen (offen=' + !!offen + ', offenId=' + offenId + ', stufeOffen=' + stufeOffen + ', exportLaeuft=' + !!exportLaeuft + ') - die Probe wuerde nichts belegen');
      const punkte = kbPunkte(e).map(p => ({ u:r3(p.u), v:r3(p.v), z:r3(p.z) })), geraten = e._kbGeraten || false;
      const W = lein.width, H = lein.height, t = zeit();
      /* 1. DIE BUEHNE: rahmen() gegen zeichneFrame(). */
      saat = 777; zeichneFrame(t); warteGL(); const ohne = pixel(lein).slice();
      saat = 777; rahmen(); cancelAnimationFrame(rafId); rafId = 0; warteGL(); const mit = pixel(lein).slice();
      let anders = 0; for(let i=0; i<ohne.length; i+=4) if(ohne[i]!==mit[i]||ohne[i+1]!==mit[i+1]||ohne[i+2]!==mit[i+2]) anders++;
      /* ANDERS IST ES OHNEHIN, UND ZWAR FAST UEBERALL - das ist kein Befund ueber die Marken,
         sondern ueber die STEHENDE Buehne: zeichneFrame() allein faehrt (KB_STEHT ist nur in
         rahmen() gesetzt), rahmen() zeigt das Ganzbild. `buehneAnders` belegt genau das.
         UEBER DIE MARKEN sagt etwas anderes aus: WO die Markenfarbe steht. Sie muss innerhalb der
         Kaesten liegen, die Rahmen, Griffkreis und Weg zur Bildmitte aufspannen - kein einziger
         Bildpunkt darf ausserhalb tragen. */
      const r = kbMarkeR();
      /* Die Kaesten EINMAL rechnen, nicht je Bildpunkt: der Rahmen jedes Zielpunkts plus der
         Griffkreis, dazu der Weg zur Bildmitte (die gestrichelte Linie laeuft dorthin). */
      const kaesten = punkte.map(p => { const a = geoZuLeinwand(p.u-p.z/2, p.v-p.z/2), b = geoZuLeinwand(p.u+p.z/2, p.v+p.z/2), m = geoZuLeinwand(p.u, p.v), mi = geoZuLeinwand(0.5, 0.5);
        return [ Math.min(a[0],b[0],m[0],mi[0])-r, Math.min(a[1],b[1],m[1],mi[1])-r,
                 Math.max(a[0],b[0],m[0],mi[0])+r, Math.max(a[1],b[1],m[1],mi[1])+r ]; });
      let fern = 0, innen = 0;
      for(let y=0; y<H; y++) for(let x=0; x<W; x++){ const i=(y*W+x)*4;
        if(!(mit[i]===91&&mit[i+1]===214&&mit[i+2]===200)) continue;
        let nah = false;
        for(const k of kaesten) if(x>=k[0]&&x<=k[2]&&y>=k[1]&&y<=k[3]){ nah=true; break; }
        if(nah) innen++; else fern++; }
      /* 2. DER EXPORT: derselbe Augenblick, einmal mit offener Karte, einmal mit geschlossener. */
      const gm = bundel(), lage = ausschnitt(), tE = lage.t0 + 3/BILDRATE;
      const expBild = () => { const m = exportBuendel(gm, lage, W, H); LOOP = m.L; FEIN = true;
        try{ saat = 777; exportBild(m, gm, tE, W, H); warteGL(); return pixel(m.lein).slice(); }
        finally { LOOP = 0; FEIN = false; } };
      stufeOffen = 'Kette'; offenId = e.id; const expAuf = expBild();
      stufeOffen = null;   offenId = null;  const expZu  = expBild();
      /* 3. DIE KACHEL: der Weg von clipTick - eigenes Buendel, zeichneFrame, LOOP = 0. */
      const kaBild = () => { const m = exportBuendel(gm, lage, W, H); m.DATA = Object.assign({}, DATA);
        setzen(m); try{ saat = 777; zeichneFrame(t); warteGL(); } finally { setzen(gm); }
        return pixel(m.lein).slice(); };
      stufeOffen = 'Kette'; offenId = e.id; const kaAuf = kaBild();
      stufeOffen = null;   offenId = null;  const kaZu  = kaBild();
      const gleich = (a,b) => { if(a.length!==b.length) return false; for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return false; return true; };
      /* Und zum Schluss die grobe Gegenfrage: steht die Markenfarbe ueberhaupt irgendwo im
         Exportbild? (#5bd6c8 = 91,214,200 - der Ring und die Zahl tragen sie.) */
      const farbZahl = d => { let n=0; for(let i=0;i<d.length;i+=4) if(d[i]===91&&d[i+1]===214&&d[i+2]===200) n++; return n; };
      return { titel:her.titel, punkte, geraten, W, H,
        /* Die Voraussetzung, schwarz auf weiss - ohne sie ist jede Null darunter bedeutungslos. */
        karteGalt:true, markeR:r, kaesten:kaesten.map(k => k.map(v => Math.round(v))),
        buehneAnders:anders, buehneMarkenfarbe:farbZahl(mit), buehneOhneMarkenfarbe:farbZahl(ohne),
        markenfarbeInKasten:innen, markenfarbeAusserhalb:fern,
        exportGleich:gleich(expAuf, expZu), exportAbw:abw(expAuf, expZu, W, H),
        exportMarkenfarbe:farbZahl(expAuf),
        kachelGleich:gleich(kaAuf, kaZu), kachelAbw:abw(kaAuf, kaZu, W, H),
        kachelMarkenfarbe:farbZahl(kaAuf) };
    } finally { Math.random = zufallEcht; STAPEL = []; offenId = null; soloId = null; LOOP = 0; FEIN = false; stufeOffen = stufeVor; }
  }
  /* DIE ALTE "FAHRT" IN EINEM GESPEICHERTEN REZEPT (18.09.2026). Der Typ ist gestrichen. Ein
     Rezept, das ihn traegt, darf nicht abstuerzen und nicht still falsch gelesen werden: der
     Effekt wird ENTFERNT, die uebrigen bleiben, und das Studio SAGT es. Gereicht wird genau das,
     was in der Datei steht; angefasst wird die Datei nicht. */
  function fahrtRezeptProbe(rezept){
    const R = rezeptLesen(rezept);
    const vorher = R.effekte.map(r => r && r.typ);
    let hinweis = '', fehler = null;
    const nf = fahrtAltZahl(R.effekte);
    if(nf) hinweis += (nf===1?'ein Effekt war':nf+' Effekte waren')+' die alte „Fahrt“; sie ist gestrichen und wurde entfernt';
    try{ presetSetzen(R.effekte, R.alt, R.fassung); }catch(x){ fehler = String(x && x.message || x); }
    const nachher = STAPEL.map(e => e.typ);
    let bild = null;
    try{ saat = 777; zeichneFrame(zeit()); warteGL(); bild = 'gemalt'; }catch(x){ bild = 'wirft: '+String(x && x.message || x); }
    const erg = { vorher, nachher, fahrtGezaehlt:nf, hinweis, fehler, bild, gesichertWuerde:effekteJSON() };
    STAPEL = []; offenId = null;
    return erg;
  }
  /* ===================== DIE REGELN, GEMESSEN STATT BEHAUPTET (18.09.2026, Gegenlesen) =====
     Vier Zusagen der Oberflaeche, die man nur am laufenden Studio nachsehen kann:
       ueberzaehlig  ein von Hand geschriebenes Rezept mit SECHS Zielpunkten verliert den sechsten -
                     und das Studio sagt es, auf BEIDEN Wegen (Titel oeffnen und Einfuegen aus der
                     Ablage), weil beide denselben Satz aus rezeptHinweise() holen.
       geraten       der Merker, dass die Punkte geraten sind, darf NICHT in die gesicherte Datei.
       gruende       die Zeile nennt den Grund, den sie kennt - vier Zustaende, vier Saetze.
       zeilen        die Zeile unter der Liste sagt in Sekunden, was kbPlan wirklich rechnet. */
  function regelProbe(){
    const erg = {};
    const sechs = [{u:.20,v:.20,z:.60},{u:.40,v:.30,z:.60},{u:.60,v:.40,z:.60},{u:.30,v:.60,z:.60},{u:.70,v:.70,z:.60},{u:.50,v:.50,z:.60}];
    const rez = [{ typ:'kenburns', kbZiele:sechs }];
    erg.ueberzaehlig = kbUeberzaehlig(rez);
    erg.hinweisSechs = rezeptHinweise(rez);
    erg.hinweisFahrt = rezeptHinweise([{ typ:'fahrt', an:false }]);
    erg.gelesenePunkte = effektAusRezept({ typ:'kenburns', kbZiele:sechs }, false, 6).kbZiele.length;
    const eG = neuerEffekt('kenburns'); eG.kbZiele = [{u:.40,v:.50,z:.80},{u:.60,v:.50,z:.80}];
    eG._kbGeraten = 'flach'; eG._kbGeratenFehler = null;
    STAPEL = [eG]; const raus = effekteJSON(); STAPEL = [];
    erg.gesichertSchluessel = Object.keys(raus[0]);
    erg.geratenImRezept = Object.keys(raus[0]).some(k => k === 'kbGeraten' || k === '_kbGeraten');
    const zurueck = effektAusRezept(Object.assign({ _kbGeraten:'flach' }, raus[0]), false, 6);
    erg.geratenNachLaden = zurueck._kbGeraten || null;
    erg.satzNachLaden = kbVorschlagSatz(zurueck);
    erg.gruende = {};
    for(const g of ['nochnicht','unlesbar','flach','einzeln']){
      const e2 = neuerEffekt('kenburns'); e2.kbZiele = [{u:.35,v:.50,z:.80},{u:.65,v:.50,z:.80}];
      e2._kbGeraten = g; e2._kbGeratenFehler = (g==='unlesbar' ? 'Quelle fremden Ursprungs' : null);
      erg.gruende[g] = kbVorschlagSatz(e2); }
    erg.zeilen = [];
    for(const n of [0,1,2,3,5]){
      const e3 = neuerEffekt('kenburns'); e3.kbZiele = [];
      for(let i=0; i<n; i++) e3.kbZiele.push(kbOrt({ u:0.30+0.10*i, v:0.40, z:0.70 }));
      const pl = kbPlanHier(e3);
      erg.zeilen.push({ n, passt:kbPasst(e3), plan:pl ? { N:pl.N, takt:pl.takt, schlag:pl.schlag, F:pl.F, H:pl.H, HA:pl.HA } : null, satz:kbPunkteSatz(e3) }); }
    return erg;
  }
  /* ===================== IST BILD(N) BITGLEICH BILD(0)? (18.09.2026, Gegenlesen) ==========
     Nicht das Blockmittel des Vergleichers, sondern Bildpunkt fuer Bildpunkt - und ohne Effekt:
     mit LEEREM Effektstapel malt der Export das unveraenderte Standbild - es KANN sich nichts
     aendern. Bleibt trotzdem ein Unterschied, kommt er nicht aus einem Effekt. Genau so wurde das
     fehlende Hauszeichen gefunden.
     GEMESSEN WIRD IM ERSTEN LAUF EINES FRISCHEN CHROME.
     UND SPARSAM (18.09.2026, und das ist der Befund): wer JEDES der 227 Bilder zurueckholt, misst
     seinen eigenen Messvorgang mit. Nach rund hundert Rueckholungen legt Chrome die Leinwand vom
     Bildbeschleuniger auf die Rechenmaschine, und die Deckkraft 0,66 rundet dort um eine Stufe
     anders. Sichtbar wird das an der EINZIGEN Stelle, an der ueberhaupt etwas ueberblendet wird:
     der Wassermarke. 318 Bildpunkte, genau in ihrem Kasten, Bilder 0..100 gegen 101..226 - so sah
     es aus wie ein Zeichen, das mitten im Clip hineinspringt. Es war keins: Bild 0 traegt das
     Zeichen, und mit `sparsam` ist Bild(226) bitgleich Bild(0), in der Vorlage des Projekts genau
     so wie in diesem Bau (derselbe Hash 43286409). */
  async function zeichenProbe(id, jetzt, sparsam){
    const her = await bereitMachen(id, jetzt);
    try{
      Math.random = zufall;
      STAPEL = []; soloId = null;   /* KEIN Effekt: dann malt der Export das unveraenderte Standbild, und die Geometrie ist von selbst konstant */
      const lage = ausschnitt(), { t0, L, N } = lage, [W, H] = ausgabeMass(360);
      const gemerkt = bundel(), m = exportBuendel(gemerkt, lage, W, H);
      saat = 12345; LOOP = L; FEIN = true;
      const hashes = []; let d0 = null, dN = null;
      try{
        if(typeof vorlaufen==='function') await vorlaufen(m, gemerkt);
        for(let i=0; i<=N; i++){
          exportBild(m, gemerkt, t0 + i/BILDRATE, W, H); warteGL();
          /* SPARSAM: nur Bild 0 und Bild N zurueckholen. Haeufiges Zurueckholen verschiebt in Chrome
             die Leinwand vom Bildbeschleuniger auf die Rechenmaschine - wer jedes Bild liest, misst
             womoeglich seinen eigenen Messvorgang mit. */
          if(sparsam && i!==0 && i!==N){ if(i%8===7) await warte(0); continue; }
          const d = pixel(m.lein);
          hashes.push(await sha(d));
          if(i===0) d0 = d.slice(); if(i===N) dN = d.slice();
          if(i%8===7) await warte(0); }
      } finally { LOOP = 0; FEIN = false; }
      let anders = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for(let y=0; y<H; y++) for(let x=0; x<W; x++){ const i=(y*W+x)*4;
        if(d0[i]===dN[i]&&d0[i+1]===dN[i+1]&&d0[i+2]===dN[i+2]&&d0[i+3]===dN[i+3]) continue;
        anders++; if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
      const gruppen = []; for(let i=0; i<hashes.length; i++){ if(!i||hashes[i]!==hashes[i-1]) gruppen.push({ ab:i, hash:hashes[i].slice(0,8) }); }
      /* Der Kasten, den zeichenMalen rechnet - damit ein Unterschied dort auch benannt werden kann. */
      const k = Math.round(Math.min(W,H)*0.07), rand = Math.round(Math.min(W,H)*0.03);
      const mitte = d => { const cx = W-rand-Math.round(k/2), cy = H-rand-Math.round(k/2), i = (cy*W+cx)*4; return [d[i],d[i+1],d[i+2],d[i+3]]; };
      return { titel:her.titel, W, H, N, effekte:0, bilder:hashes.length,
        mitteBild0:mitte(d0), mitteBildN:mitte(dN),
        sparsam:!!sparsam, bitgleich:hashes[0]===hashes[hashes.length-1], andersPunkte:anders,
        kasten:anders?[x0,y0,x1,y1]:null, zeichenKasten:[W-rand-k, H-rand-k, W-rand-1, H-rand-1],
        hashGruppen:gruppen.length, gruppen:gruppen.slice(0,8) };
    } finally { Math.random = zufallEcht; STAPEL = []; LOOP = 0; FEIN = false; }
  }
  return { typen, bereitMachen, fall, katalog, feld, studio, massstab, loopAnsicht, markenProbe, fahrtRezeptProbe, regelProbe, zeichenProbe };
})();
/* <<< Pruefhaken der Nahtpruefung */
