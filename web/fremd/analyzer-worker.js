/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ==========================================================================
   Rechenkern des SunoAnalyzers  ·  web/fremd/analyzer-worker.js

   Läuft als Web Worker in der Bühne UND als gewöhnliches Skript in Node.
   Das ist der Grund, warum er hier als eigene Datei liegt und nicht mehr
   als Zeichenkette im Modul: Zwei Fassungen desselben Verfahrens rechnen
   binnen Wochen Verschiedenes, und dann steht in der Datenbank etwas
   anderes als auf dem Schirm, ohne dass es jemand merkt.

   Er kennt nur Zahlen - keine Weboberfläche, kein Audio-Element, keine
   Web Audio API. Herein kommen die Abtastwerte zweier Kanäle und die
   Abtastrate, heraus kommen Messwerte und Kurven.

   Aufruf im Browser:  new Worker('/fremd/analyzer-worker.js')
   Aufruf in Node:     siehe bin/pruefe-lautheit.js
   ========================================================================== */

    var sr,left,right;

    // =============================================
    // COOLEY-TUKEY FFT (real input, power-of-2 N)
    // Returns interleaved [re0,im0,re1,im1,...] Float64Array
    // =============================================
    function fft(re,im){
      var n=re.length;
      // bit-reversal permutation
      for(var i=0,j=0;i<n;i++){
        if(i<j){var tr=re[i];re[i]=re[j];re[j]=tr;var ti=im[i];im[i]=im[j];im[j]=ti;}
        var bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;
      }
      // butterfly
      for(var len=2;len<=n;len<<=1){
        var ang=-2*Math.PI/len;
        var wRe=Math.cos(ang),wIm=Math.sin(ang);
        for(var i=0;i<n;i+=len){
          var curRe=1,curIm=0;
          for(var j=0;j<len/2;j++){
            var uRe=re[i+j],uIm=im[i+j];
            var vRe=re[i+j+len/2]*curRe-im[i+j+len/2]*curIm;
            var vIm=re[i+j+len/2]*curIm+im[i+j+len/2]*curRe;
            re[i+j]=uRe+vRe;im[i+j]=uIm+vIm;
            re[i+j+len/2]=uRe-vRe;im[i+j+len/2]=uIm-vIm;
            var newRe=curRe*wRe-curIm*wIm;
            curIm=curRe*wIm+curIm*wRe;curRe=newRe;
          }
        }
      }
    }

    // LPC — Levinson-Durbin + Formant extraction
    // =============================================
    // fftRadix2 is an alias for fft (same algorithm)
    function fftRadix2(re,im,N){fft(re,im);}

    // Compute LPC coefficients via Levinson-Durbin recursion
    // signal: Float32Array, offset: start, N: frame length, p: LPC order
    // Returns Float64Array of p coefficients [a1..ap]

    // Evaluate LPC spectrum at nFreqs equally spaced frequencies 0..sr/2
    // Returns magnitude array — peaks are formants

    // Find top-N spectral peaks in a range, returns array of {freq, amp}

    function rfft(signal,offset,N){
      var re=new Float64Array(N),im=new Float64Array(N);
      for(var i=0;i<N;i++){
        var w=0.5*(1-Math.cos(2*Math.PI*i/(N-1)));
        re[i]=(offset+i<signal.length?signal[offset+i]:0)*w;
      }
      fft(re,im);
      var mag=new Float32Array(N/2);
      for(var k=0;k<N/2;k++)mag[k]=Math.sqrt(re[k]*re[k]+im[k]*im[k])/N;
      return mag;
    }

    // Mid/Side stereo width: RMS(S)/RMS(M), perceptually valid
    function computeStereoWidth(left,right){
      var n=Math.min(left.length,right.length);
      var ms=0,mm=0;
      for(var i=0;i<n;i++){
        var m=left[i]+right[i],s=left[i]-right[i];
        mm+=m*m;ms+=s*s;
      }
      var rmsM=Math.sqrt(mm/n),rmsS=Math.sqrt(ms/n);
      return rmsM>0?Math.min(1,rmsS/rmsM):0;
    }

    // HPS (Harmonic Product Spectrum) pitch detection
    // Returns dominant F0 in Hz, 0 if not found
    function hpsPitch(mag,sr,fftSize){
      var bins=mag.length;
      var hps=new Float32Array(Math.floor(bins/4));
      for(var k=0;k<hps.length;k++){
        hps[k]=mag[k];
        for(var h=2;h<=4;h++){var hb=Math.round(k*h);if(hb<bins)hps[k]*=mag[hb];}
      }
      var kLo=Math.round(80/sr*fftSize),kHi=Math.round(600/sr*fftSize);
      var best=0,bestK=0;
      for(var k=kLo;k<Math.min(kHi,hps.length);k++){if(hps[k]>best){best=hps[k];bestK=k;}}
      if(bestK===0)return 0;
      return bestK*sr/fftSize;
    }

    function smooth(arr,w){return arr.map(function(_,i){var s=0,c=0;for(var j=Math.max(0,i-w);j<=Math.min(arr.length-1,i+w);j++){s+=arr[j];c++;}return s/c;});}

    
/* ==========================================================================
   Lautheit nach Norm  ·  ITU-R BS.1770-4, EBU R128, EBU Tech 3342

   Was der Analyzer bisher "Lautheit dB" nannte, war der nackte
   Effektivwert. Das ist kein LUFS: Es fehlt die Gehörbewertung, es fehlen
   die Blöcke, es fehlen die beiden Tore. Der Unterschied ist kein
   Schönheitsfehler - ein Wert, der "LUFS" heißt, muss messen, was die
   Norm darunter versteht, sonst sind alle Zielpegel daneben.

   Nachgebaut aus der Norm, geprüft gegen die Testsignale aus
   EBU Tech 3341 - siehe bin/pruefe-lautheit.js.
   ========================================================================== */

/* Die K-Bewertung besteht aus zwei Filtern zweiter Ordnung: einer
   Hochtonanhebung um 4 dB (der Kopf im Schallfeld) und einem Hochpass
   bei 38 Hz (das Ohr wertet tiefe Frequenzen schwächer).

   Die Norm nennt Koeffizienten für 48 kHz. Sie werden hier aus den
   analogen Vorlagen gerechnet, damit auch 44,1 kHz stimmt - der Browser
   entscheidet die Abtastrate, nicht wir. */
function kFilterKoeffizienten(sr){
  var f0=1681.974450955533, G=3.999843853973347, Q=0.7071752369554196;
  var K=Math.tan(Math.PI*f0/sr);
  var Vh=Math.pow(10,G/20), Vb=Math.pow(Vh,0.4996667741545416);
  var a0=1+K/Q+K*K;
  var hochton={
    b0:(Vh+Vb*K/Q+K*K)/a0, b1:2*(K*K-Vh)/a0, b2:(Vh-Vb*K/Q+K*K)/a0,
    a1:2*(K*K-1)/a0,       a2:(1-K/Q+K*K)/a0
  };
  var f1=38.13547087602444, Q1=0.5003270373238773;
  var K1=Math.tan(Math.PI*f1/sr), n1=1+K1/Q1+K1*K1;
  var hochpass={
    b0:1, b1:-2, b2:1,
    a1:2*(K1*K1-1)/n1, a2:(1-K1/Q1+K1*K1)/n1
  };
  return [hochton,hochpass];
}

function biquad(x,k){
  var y=new Float32Array(x.length);
  var x1=0,x2=0,y1=0,y2=0;
  for(var i=0;i<x.length;i++){
    var v=k.b0*x[i]+k.b1*x1+k.b2*x2-k.a1*y1-k.a2*y2;
    x2=x1;x1=x[i];y2=y1;y1=v;y[i]=v;
  }
  return y;
}

/* Alle Fensterenergien in einem Durchgang: einmal kumulativ aufsummieren,
   danach kostet jedes Fenster zwei Subtraktionen. Der Kniff stammt aus
   dem CB Audio Analyzer und macht bei 15 Millionen Abtastwerten den
   Unterschied zwischen Sekunden und Minuten. */
/* Fenster MIT DER MITTE als Bezugspunkt.

   Der Wert an der Stelle t ist die Energie über [t−N/2, t+N/2]. Damit
   bedeutet Index i in JEDER Kurve dieselbe Zeit i·schritt, unabhängig
   von der Fensterlänge - und alles, was danach kommt, stimmt von
   selbst: der Spielkopf, der Vergleich zweier Kurven, die Differenz.

   Vorher lag der Bezug am Fensteranfang. Die Kurzzeitlautheit mit ihrem
   3-Sekunden-Fenster wurde dadurch **1,5 Sekunden zu spät** gezeichnet;
   beim Mitlaufen stieg die Kurve lange nach dem, was man hörte. Ich
   hatte das zuerst nur für die Differenz nachträglich ausgeglichen -
   das war Flickwerk, der Fehler steckte in der Definition.

   An den Rändern ist das Fenster abgeschnitten und wird durch seine
   tatsächliche Länge geteilt. Deshalb NUR für die Anzeige: Die Norm
   schreibt Blöcke ab dem Anfang und in voller Länge vor, und die
   Zahlen entstehen weiterhin damit. */
function fensterEnergienMitte(summe,anzahl,fenster,schritt){
  var halb=fenster>>1, aus=[];
  for(var mitte=0;mitte<anzahl;mitte+=schritt){
    var a=mitte-halb, b=mitte+halb;
    /* An den Rändern passt das Fenster nicht mehr ganz. Dort wird KEIN
       Wert erfunden, sondern NaN geliefert - ein abgeschnittenes
       Fenster misst weniger Zeit und liefert einen zu niedrigen Pegel.
       Beim ersten Versuch flossen diese Randwerte in die Streckung ein
       und zogen die Spanne von -53 auf -72 dB, obwohl im Song nichts
       dergleichen steht. */
    if(a<0||b>anzahl){ aus.push(NaN); continue; }
    aus.push((summe[b]-summe[a])/(b-a));
  }
  return aus;
}

function fensterEnergien(summe,anzahl,fenster,schritt){
  var aus=[];
  if(anzahl<=fenster){ aus.push((summe[anzahl]-summe[0])/anzahl); return aus; }
  for(var s=0;s+fenster<=anzahl;s+=schritt) aus.push((summe[s+fenster]-summe[s])/fenster);
  return aus;
}

function lautheitNachNorm(left,right,sr){
  var kf=kFilterKoeffizienten(sr);
  var kanaele=[left,right];
  var n=left.length;

  /* Leistung je Abtastwert, über beide Kanäle summiert. Die Norm
     gewichtet L und R mit 1,0 - erst Surroundkanäle bekommen 1,41. */
  var leistung=new Float64Array(n);
  for(var c=0;c<kanaele.length;c++){
    var z=biquad(biquad(kanaele[c],kf[0]),kf[1]);
    for(var i=0;i<n;i++) leistung[i]+=z[i]*z[i];
  }

  var summe=new Float64Array(n+1);
  for(var i=0;i<n;i++) summe[i+1]=summe[i]+leistung[i];

  var lu=function(e){ return e>0 ? -0.691+10*Math.log10(e) : -Infinity; };

  /* Momentanwert: 400 ms Fenster, 100 ms Schritt - so schreibt es
     EBU R128 vor, und so wird der integrierte Wert daraus gebildet. */
  var eM=fensterEnergien(summe,n,Math.round(sr*0.4),Math.round(sr*0.1));

  /* Zwei Tore. Erst absolut bei -70 LUFS, dann relativ zehn LU unter
     dem ungegateten Mittel. Ohne das zweite Tor zieht jede Pause den
     Wert nach unten - das ist der ganze Sinn der Gatterei. */
  var e1=[]; for(var i=0;i<eM.length;i++) if(lu(eM[i])>-70) e1.push(eM[i]);
  var integriert=-100;
  if(e1.length){
    var m1=0; for(var i=0;i<e1.length;i++) m1+=e1[i]; m1/=e1.length;
    var tor=lu(m1)-10;
    var e2=[]; for(var i=0;i<eM.length;i++) if(lu(eM[i])>-70&&lu(eM[i])>tor) e2.push(eM[i]);
    if(e2.length){ var m2=0; for(var i=0;i<e2.length;i++) m2+=e2[i]; m2/=e2.length; integriert=lu(m2); }
    else integriert=lu(m1);
  }

  /* Kurzzeitwert: 3 s Fenster, 1 s Schritt - so verlangt es EBU Tech
     3342 für die Schwankungsbreite. */
  var eS=fensterEnergien(summe,n,Math.round(sr*3),Math.round(sr*1));
  var kurzNorm=new Float32Array(eS.length);
  for(var i=0;i<eS.length;i++) kurzNorm[i]=Math.max(-100,lu(eS[i]));

  /* Schwankungsbreite (LRA) nach EBU Tech 3342: Tor bei -70 und bei
     zwanzig LU unter dem integrierten Wert, dann 95. minus 10. Perzentil.

     Sie ist das bessere Dynamikmaß: Der Crestfaktor misst, wie spitz das
     Signal ist, und ein einziger Knall verdirbt ihn. Die Schwankungs-
     breite misst, wie sehr die LAUTHEIT über den Song schwankt. */
  var torL=Math.max(-70,integriert-20);
  /* Ausdrücklich die normgemäße Kurve (3 s / 1 s), nicht die feine
     Anzeigekurve - sonst wären die Perzentile andere Zahlen. */
  var gS=[]; for(var i=0;i<kurzNorm.length;i++) if(kurzNorm[i]>-70&&kurzNorm[i]>torL) gS.push(kurzNorm[i]);
  gS.sort(function(a,b){return a-b;});
  var perzentil=function(a,p){
    if(!a.length) return 0;
    var x=(a.length-1)*p, u=Math.floor(x), o=Math.ceil(x);
    return u===o ? a[u] : a[u]+(a[o]-a[u])*(x-u);
  };
  var schwankung=gS.length>=2 ? Math.max(0,perzentil(gS,0.95)-perzentil(gS,0.10)) : 0;

  /* ---- Und jetzt dasselbe noch einmal, feiner, NUR zum Anzeigen ----

     Die Schrittweiten der Norm sind für die ZAHLEN richtig und werden
     oben unverändert benutzt. Zum Zeichnen taugen sie nicht: Bei
     16-fachem Zoom bleiben von der Kurzzeitkurve rund zwanzig Punkte
     über die ganze Breite übrig, und die Spur wird eckig.

     Die Fenstergröße bleibt, nur der Schritt wird kleiner - der
     gezeigte Verlauf ist also derselbe, nur dichter abgetastet. Dank
     der kumulierten Summe kostet das fast nichts. */
  /* Beide Anzeigekurven auf DEMSELBEN Raster von 20 ms und mit der
     Mitte als Bezug. Dadurch bedeutet Index i in beiden dieselbe Zeit,
     und die Differenz ist eine Subtraktion ohne Verschiebung. */
  var mkKurve=function(fensterS, schrittS){
    var e=fensterEnergienMitte(summe,n,Math.round(sr*fensterS),Math.max(1,Math.round(sr*schrittS)));
    var k=new Float32Array(e.length);
    for(var i=0;i<e.length;i++) k[i]=isFinite(e[i])?Math.max(-100,lu(e[i])):NaN;
    return k;
  };
  var momentan=mkKurve(0.4, 0.02);
  var kurz    =mkKurve(3.0, 0.02);

  /* Maßstabsreihe: dasselbe Signal durch sieben Fensterlängen.

     Jede Kurve ist eine ECHTE Lautheit über ihr Fenster, nicht eine
     geglättete Fassung einer anderen - sonst stünde in der 1-s-Kurve
     das 400-ms-Fenster mit drin. Dank der kumulierten Summe kostet
     jede zusätzliche Länge fast nichts.

     Sie beantwortet die Frage, warum die Norm 400 ms nimmt: Man sieht,
     ab welcher Länge die Schläge verschwinden. Bei 117 BPM dauert ein
     Schlag 513 ms - unterhalb von etwa 100 ms stehen die Anschläge
     einzeln, oberhalb von 400 ms sind sie zu einem Verlauf verschmolzen. */
  var MASSSTAEBE=[0.025,0.05,0.1,0.2,0.4,1.0,3.0];
  var massstab=MASSSTAEBE.map(function(f){ return mkKurve(f, 0.02); });

  return {integriert:integriert, schwankung:schwankung, momentan:momentan, kurz:kurz,
          momentanSchritt:0.02, kurzSchritt:0.02,
          massstab:massstab, massstabFenster:MASSSTAEBE,
          momentanMax:momentan.length?Math.max.apply(null,Array.prototype.slice.call(momentan)):-100,
          kurzMax:kurz.length?Math.max.apply(null,Array.prototype.slice.call(kurz)):-100};
}

/* Spitzenwert zwischen den Abtastwerten (True Peak, dBTP).

   Eine Datei kann bei -0,1 dBFS liegen und nach der MP3-Kodierung
   trotzdem über 0 dBTP - der wahre Scheitel liegt zwischen zwei
   Abtastwerten. BS.1770 verlangt mindestens vierfache Überabtastung;
   hier mit einem fenstergewichteten si-Filter, 12 Anzapfungen je Phase. */
/* Zusaetzlich zum Groesstwert ein VERLAUF je 100 ms.

   Grund: Eine Spitze ist ein Ereignis mit einem Zeitpunkt; global ist
   nur ihr Maximum. Was man beurteilen will, ist die Dichte - eine
   Strecke, auf der alle zwei Sekunden eine Ueberschreitung sitzt, ist
   etwas anderes als zwei Ausreisser am Anfang und am Ende, und beide
   ergeben denselben Spitzenwert.

   Die SCHWELLE steckt bewusst NICHT hier drin. Sie haengt an der
   Plattform (Club -0,5 dBTP, Rundfunk -1,0) und die waehlt der Benutzer
   im Register, ohne dass neu gerechnet wird. Der Kern liefert den
   Verlauf, die Oberflaeche entscheidet, was davon zu hoch ist. */
var SPITZE_FENSTER=0.1;

function echteSpitze(kanaele,sr){
  var faktor=4, taps=12;
  var phasen=[];
  for(var p=0;p<faktor;p++){
    var h=new Float64Array(taps), s=0;
    for(var k=0;k<taps;k++){
      var x=(k-taps/2+1)-p/faktor;
      var si=x===0?1:Math.sin(Math.PI*x)/(Math.PI*x);
      var w=0.5-0.5*Math.cos(2*Math.PI*(k+0.5)/taps);   // Hann
      h[k]=si*w; s+=h[k];
    }
    for(var k=0;k<taps;k++) h[k]/=s;
    phasen.push(h);
  }
  var spitze=0, abtastSpitze=0;
  var fw=Math.max(1,Math.round(sr*SPITZE_FENSTER));
  var anzF=Math.ceil((kanaele[0]?kanaele[0].length:0)/fw);
  var verlauf=new Float32Array(anzF);

  /* Nur um die Spitzen herum überabtasten.

     Vollständig gerechnet wären es bei fünf Minuten Ton rund 1,4
     Milliarden Multiplikationen - im Browser eine Viertelminute
     Stillstand. Der Scheitel zwischen zwei Abtastwerten liegt aber
     immer neben einem großen Abtastwert; alles unter der halben
     Spitze kann ihn nicht mehr überholen. Damit bleibt ein Bruchteil
     der Arbeit, und das Ergebnis ist dasselbe. */
  for(var c=0;c<kanaele.length;c++){
    var x=kanaele[c];
    for(var i=0;i<x.length;i++){
      var a=Math.abs(x[i]);
      if(a>abtastSpitze) abtastSpitze=a;
      /* Grundstock des Verlaufs ist die Abtastspitze des Fensters.
         Wo gleich ueberabgetastet wird, wird sie ueberschrieben; wo
         nicht, bleibt sie stehen - dort liegt der wahre Scheitel
         ohnehin unter der Schwelle. */
      var w=(i/fw)|0; if(a>verlauf[w]) verlauf[w]=a;
    }
  }
  var schwelle=abtastSpitze*0.5;

  for(var c=0;c<kanaele.length;c++){
    var x=kanaele[c], n=x.length;
    for(var i=0;i<n;i++){
      if(Math.abs(x[i])<schwelle) continue;
      for(var d=-1;d<=1;d++){
        var m=i+d; if(m<0||m>=n) continue;
        for(var p=0;p<faktor;p++){
          var h=phasen[p], acc=0;
          for(var k=0;k<taps;k++){
            var j=m+k-taps/2+1;
            if(j>=0&&j<n) acc+=h[k]*x[j];
          }
          var a2=Math.abs(acc);
          if(a2>spitze) spitze=a2;
          var w2=(i/fw)|0; if(w2<anzF&&a2>verlauf[w2]) verlauf[w2]=a2;
        }
      }
    }
  }
  if(abtastSpitze>spitze) spitze=abtastSpitze;
  // In dBTP umrechnen, damit die Oberflaeche nur noch vergleichen muss.
  var verlaufDb=new Float32Array(anzF);
  for(var v=0;v<anzF;v++) verlaufDb[v]=20*Math.log10(Math.max(verlauf[v],1e-10));
  return {echt:spitze, abtast:abtastSpitze, verlauf:verlaufDb, schritt:SPITZE_FENSTER};
}


/* ==========================================================================
   Bandspektrum, Grenzfrequenz und Schimmer

   Alle drei brauchen dieselbe Grundlage: den Pegel je Frequenzband über
   die Zeit, logarithmisch geteilt wie das Gehör. Deshalb stehen sie
   zusammen.
   ========================================================================== */

var BAENDER=160, BAND_VON=20, BAND_BIS=20000;

function bandMitten(sr){
  var m=new Float64Array(BAENDER), bis=Math.min(BAND_BIS,sr/2*0.98);
  for(var b=0;b<BAENDER;b++){
    var u=BAND_VON*Math.pow(bis/BAND_VON,b/BAENDER);
    var o=BAND_VON*Math.pow(bis/BAND_VON,(b+1)/BAENDER);
    m[b]=Math.sqrt(u*o);
  }
  return m;
}

/* Pegel je Band und Zeitschritt, in Dezibel. Fensterlänge 4096, Schritt
   0,2 s - fein genug für Dauertöne, grob genug, um schnell zu bleiben. */
function bandVerlauf(left,right,sr){
  var N=4096, hop=Math.round(sr*0.2), rahmen=Math.max(1,Math.floor((left.length-N)/hop)+1);
  var mitten=bandMitten(sr), bis=Math.min(BAND_BIS,sr/2*0.98);
  var grenzen=new Int32Array(BAENDER+1);
  for(var b=0;b<=BAENDER;b++){
    var f=BAND_VON*Math.pow(bis/BAND_VON,b/BAENDER);
    grenzen[b]=Math.min(N/2,Math.max(0,Math.round(f/sr*N)));
  }
  var fenster=new Float64Array(N);
  for(var i=0;i<N;i++) fenster[i]=0.5-0.5*Math.cos(2*Math.PI*i/N);

  var aus=new Float32Array(rahmen*BAENDER);
  var re=new Float64Array(N), im=new Float64Array(N);
  /* NEBENBEI DAS FEINE SPEKTRUM (25.08.2026, Review). Die FFT ist hier
     ohnehin gerechnet - je Bin die Leistung aufsummiert kostet einen
     Akkumulator und liefert das, woran die 160 Logbaender scheitern:
     oberhalb 16 kHz ist ein Logband 700-900 Hz breit, ein Bin aber nur
     sr/N (~11,7 Hz bei 48 kHz). Daraus rechnet hoehenkante() unten die
     Tiefpasskante, an der die alte Grenzfrequenz-Karte zu Recht
     gestorben war (SA_TOT: Deckel 19,57 kHz, nur 12 verschiedene
     Werte). */
  var binSumme=new Float64Array(N/2);
  for(var r=0;r<rahmen;r++){
    var off=r*hop;
    for(var i=0;i<N;i++){ var v=(left[off+i]+right[off+i])*0.5; re[i]=v*fenster[i]; im[i]=0; }
    fft(re,im);
    for(var k2=0;k2<N/2;k2++) binSumme[k2]+=re[k2]*re[k2]+im[k2]*im[k2];
    for(var b=0;b<BAENDER;b++){
      var von=grenzen[b], obn=Math.max(von+1,grenzen[b+1]), s=0;
      for(var k=von;k<obn;k++) s+=re[k]*re[k]+im[k]*im[k];
      s/=(obn-von);
      aus[r*BAENDER+b]=10*Math.log10(s+1e-20);
    }
  }
  for(var k3=0;k3<N/2;k3++) binSumme[k3]/=rahmen;
  return {werte:aus, rahmen:rahmen, mitten:mitten, hop:hop/sr, binMittel:binSumme, fftN:N};
}

function medianVon(a){
  var b=Array.prototype.slice.call(a).filter(isFinite).sort(function(x,y){return x-y;});
  if(!b.length) return -200;
  var m=b.length>>1;
  return b.length%2 ? b[m] : (b[m-1]+b[m])/2;
}

/* Obere Grenzfrequenz: wo das Spektrum abbricht.

   Beim MP3 sieht man hier den Tiefpass des Kodierers - bei 320 kbit/s
   um 20 kHz, bei 128 deutlich darunter. Verglichen wird gegen den
   Bezugspegel zwischen 200 Hz und 2 kHz; als Abbruch gilt, wo es 50 dB
   darunter liegt und nicht wieder darüber kommt. */
function grenzfrequenz(bv){
  var mittelBand=new Float64Array(BAENDER);
  for(var b=0;b<BAENDER;b++){
    var s=0; for(var r=0;r<bv.rahmen;r++) s+=Math.pow(10,bv.werte[r*BAENDER+b]/10);
    mittelBand[b]=10*Math.log10(s/bv.rahmen+1e-20);
  }
  var bez=[], n=0;
  for(var b=0;b<BAENDER;b++) if(bv.mitten[b]>=200&&bv.mitten[b]<=2000){ bez.push(mittelBand[b]); }
  var bezug=medianVon(bez);
  var schwelle=bezug-50;
  var grenze=bv.mitten[BAENDER-1];
  for(var b=BAENDER-1;b>=0;b--){ if(mittelBand[b]>schwelle){ grenze=bv.mitten[b]; break; } }
  return {hz:grenze, bezugDb:bezug};
}

/* DIE HOEHENKANTE: bis wohin reichen die Hoehen wirklich (25.08.2026).

   Jedes Suno-Modell und jede Kodierkette schneidet die Hoehen woanders
   ab, und WIE scharf die Kante faellt, unterscheidet Codec-Tiefpass
   (steil) von natuerlichem Auslaufen (flach). Gerechnet auf dem
   mittleren Leistungsspektrum je FFT-Bin (aus bandVerlauf):

   - Bezug ist der Median zwischen 1 und 8 kHz - der Bereich, in dem
     Musik immer Energie traegt.
   - Die Kante ist die hoechste Frequenz, deren GEGLAETTETER Pegel noch
     ueber Bezug - 30 dB liegt. Geglaettet mit einem Median ueber fuenf
     Bins (~58 Hz), damit nicht ein einzelner stehender Ton (Schimmer,
     15,7-kHz-Pfeifen) als "Hoehen" durchgeht.
   - Die Steilheit ist der Pegelabfall im Kilohertz OBERHALB der Kante,
     in dB/kHz. Ab etwa 20 dB/kHz ist es ein Schnitt, kein Auslaufen.

   Traegt der Bezug selbst fast nichts (unter -80 dB), gibt es keine
   Aussage - hz bleibt NaN, und die Karte bleibt leer statt falsch. */
function hoehenkante(binMittel, sr, N){
  var bins=N/2, proBin=sr/N;
  var db=new Float64Array(bins);
  for(var k=0;k<bins;k++) db[k]=10*Math.log10(binMittel[k]+1e-20);
  /* Median ueber 5 - klein genug, um von Hand zu sortieren */
  var glatt=new Float64Array(bins);
  for(var k=0;k<bins;k++){
    var a=[]; for(var j=Math.max(0,k-2);j<=Math.min(bins-1,k+2);j++) a.push(db[j]);
    a.sort(function(x,y){return x-y;});
    glatt[k]=a[a.length>>1];
  }
  var bez=[];
  for(var k=0;k<bins;k++){ var f=k*proBin; if(f>=1000&&f<=8000) bez.push(db[k]); }
  var bezug=medianVon(bez);
  if(!isFinite(bezug)||bezug<-80) return {hz:NaN, steil:NaN, bezugDb:bezug};
  var schwelle=bezug-30, deckel=Math.min(bins-1,Math.floor(sr/2*0.98/proBin));
  var kante=-1;
  for(var k=deckel;k>=1;k--){ if(glatt[k]>schwelle){ kante=k; break; } }
  if(kante<0) return {hz:NaN, steil:NaN, bezugDb:bezug};
  /* Steilheit: wie tief faellt es im Kilohertz hinter der Kante? */
  var bisK=Math.min(deckel,kante+Math.round(1000/proBin));
  var steil=0;
  if(bisK>kante){
    var tiefst=glatt[kante];
    for(var k=kante+1;k<=bisK;k++) if(glatt[k]<tiefst) tiefst=glatt[k];
    steil=(glatt[kante]-tiefst)/((bisK-kante)*proBin/1000);
  }
  return {hz:kante*proBin, steil:steil, bezugDb:bezug};
}

/* Schimmer: dauerhafte schmale Spitzen.

   Das Verfahren stammt aus dem CB Audio Analyzer (GPL - nachgebaut,
   nicht übernommen). Sein Kern ist der Nachbarschaftsmedian UNTER
   Ausschluss der Spitze selbst: Ohne das höbe eine kräftige Spitze
   ihren eigenen Bezugswert mit an und fiele nicht mehr auf.

   Er muss live raten, ob eine Spitze bleibt, und behilft sich mit
   gleitendem Mittel und einem Zähler. Wir haben die ganze Datei und
   können es genau sagen: Anteil der Rahmen, in denen das Band
   heraussticht - und wann genau. */
function schimmerFinden(bv){
  var HERVOR=7.8, MIND_HZ=450, MIND_ANTEIL=0.25;
  var befunde=[];
  for(var b=0;b<BAENDER;b++){
    if(bv.mitten[b]<MIND_HZ) continue;
    var treffer=0, von=-1, letzte=-1, laeufe=[], hervorSum=0;
    for(var r=0;r<bv.rahmen;r++){
      var nach=[];
      for(var d=-6;d<=6;d++){
        if(Math.abs(d)<=1) continue;              // Spitze selbst ausblenden
        var q=b+d; if(q<0||q>=BAENDER) continue;
        nach.push(bv.werte[r*BAENDER+q]);
      }
      var umfeld=medianVon(nach);
      var wert=bv.werte[r*BAENDER+b];
      var hervor=wert-umfeld;
      var verdaechtig=(hervor>HERVOR)&&(wert>-77);
      if(verdaechtig){
        treffer++; hervorSum+=hervor;
        if(von<0) von=r;
        letzte=r;
      } else if(von>=0){
        if((letzte-von)*bv.hop>=1.0) laeufe.push([von,letzte]);
        von=-1;
      }
    }
    if(von>=0&&(letzte-von)*bv.hop>=1.0) laeufe.push([von,letzte]);
    var anteil=treffer/bv.rahmen;
    if(anteil<MIND_ANTEIL||!laeufe.length) continue;
    var laengster=laeufe.reduce(function(a,c){return (c[1]-c[0])>(a[1]-a[0])?c:a;});
    var hervorMittel=hervorSum/treffer;
    /* Schweregrad wie beim Vorbild: Hervorstand und Dauer je zur Hälfte. */
    var schwere=Math.min(1,Math.max(0,(hervorMittel-5.2)/12*0.58+anteil*0.42*2));
    befunde.push({hz:bv.mitten[b], hervorDb:hervorMittel, anteil:anteil,
                  von:laengster[0]*bv.hop, bis:laengster[1]*bv.hop, schwere:schwere});
  }
  /* Benachbarte Bänder gehören zum selben Ton - nur den stärksten je
     Gruppe behalten, sonst meldet ein Pfeifton dreimal. */
  befunde.sort(function(a,b2){return b2.schwere-a.schwere;});
  var behalten=[];
  for(var i=0;i<befunde.length;i++){
    var nah=false;
    for(var j=0;j<behalten.length;j++)
      if(Math.abs(Math.log2(befunde[i].hz/behalten[j].hz))<0.12) nah=true;
    if(!nah) behalten.push(befunde[i]);
    if(behalten.length>=8) break;
  }
  return behalten;
}

onmessage=function(e){
      left=e.data.left; right=e.data.right; sr=e.data.sr;
      var ch=left, n=ch.length, dur=n/sr;

      var _T={}, _t0=Date.now(), _tk=function(n){_T[n]=Date.now()-_t0;_t0=Date.now();};
      postMessage({type:'progress',label:'Lautheit nach Norm…',pct:20});

      /* ---- Norm- und Fehlermaße -------------------------------------
         Alles aus denselben Abtastwerten, bevor die übrige Analyse
         beginnt - sie sind die verlässlichsten Zahlen im ganzen
         Werkzeug, weil sie gegen die Norm geprüft sind. */
      var LN=lautheitNachNorm(left,right,sr);
      _tk("lufs");
      var TP=echteSpitze([left,right],sr);
      _tk("truepeak");
      var tpDb=20*Math.log10(Math.max(TP.echt,1e-10));

      /* Vollausschläge: Anzahl, wo zuerst - und je 100 ms wie viele.

         Ohne den Verlauf sieht ein Stück mit zwei Ausreißern am Anfang
         und am Ende aus wie eines, das durchgehend übersteuert: erster
         und letzter Zeitpunkt sind dieselben. */
      /* EINZELWERTE UND LAEUFE getrennt zaehlen (25.08.2026, Review).
         Ein einzelner Wert am Anschlag ist ein normal ausgesteuerter
         Transient - und dekodiertes verlustbehaftetes Material schiesst
         als Float legitim ueber 1,0 hinaus (Codec-Overshoot). Echte
         Uebersteuerung ist erst der LAUF aufeinanderfolgender Werte am
         Anschlag (Schwelle: drei in Folge). Beide Zahlen aus demselben
         Durchgang; clip bleibt die Einzelwertzahl, clipLauf zaehlt die
         Laeufe. Alte Ablagen kennen clipLauf nicht - die Anzeige faellt
         dann auf das alte, strenge Urteil zurueck. */
      var clipFw=Math.max(1,Math.round(sr*SPITZE_FENSTER));
      var clipVerlauf=new Uint16Array(Math.ceil(left.length/clipFw));
      var clip=0, clipErst=-1, clipLetzt=-1, clipLauf=0;
      for(var c2=0;c2<2;c2++){
        var xx=c2?right:left, lauf=0;
        for(var i2=0;i2<xx.length;i2++){
          if(Math.abs(xx[i2])>=0.9999){
            clip++; lauf++; if(clipErst<0)clipErst=i2/sr; clipLetzt=i2/sr;
            var cw=(i2/clipFw)|0;
            if(cw<clipVerlauf.length&&clipVerlauf[cw]<65535) clipVerlauf[cw]++;
          } else {
            if(lauf>=3) clipLauf++;
            lauf=0;
          }
        }
        if(lauf>=3) clipLauf++;   /* Lauf, der bis zum letzten Wert reicht */
      }

      // Gleichspannungsanteil: kostet Aussteuerungsreserve, hört man nicht
      var dcL=0,dcR=0;
      for(var i2=0;i2<left.length;i2++){dcL+=left[i2];dcR+=right[i2];}
      dcL/=left.length; dcR/=right.length;
      var dc=Math.max(Math.abs(dcL),Math.abs(dcR));

      /* Phasenlage über die Zeit statt global: Eine örtliche Auslöschung
         von zehn Sekunden verschwindet in einem Gesamtmittel spurlos.
         Gezählt wird der Anteil der klingenden Fenster mit negativer
         Korrelation - der Gedanke stammt aus dem CB Audio Analyzer. */
      var fw=Math.round(sr*0.4), fensterGes=0, fensterNeg=0, korrSum=0, korrN=0;
      /* Auch hier der Verlauf, nicht nur der Anteil: Wo die Auslöschung
         sitzt, ist die eigentliche Auskunft. Stille Fenster bekommen
         NaN statt null - dort gibt es keine Phasenlage, und eine Null
         hieße "unkorreliert" und wäre eine Behauptung. */
      var korrVerlauf=new Float32Array(Math.floor(left.length/fw));
      for(var s2=0,kw=0;s2+fw<=left.length;s2+=fw,kw++){
        var sl=0,sr2=0,slr=0;
        for(var i2=s2;i2<s2+fw;i2++){sl+=left[i2]*left[i2];sr2+=right[i2]*right[i2];slr+=left[i2]*right[i2];}
        if(sl<1e-9||sr2<1e-9){ if(kw<korrVerlauf.length) korrVerlauf[kw]=NaN; continue; }
        var k=slr/Math.sqrt(sl*sr2);
        if(kw<korrVerlauf.length) korrVerlauf[kw]=k;
        fensterGes++; korrSum+=k; korrN++;
        if(k<-0.10) fensterNeg++;
      }
      var korr=korrN?korrSum/korrN:0;
      var negPhase=fensterGes?100*fensterNeg/fensterGes:0;

      /* Abbruch am Ende: Suno-Stücke enden gern hart. Verglichen wird der
         Pegel der letzten 200 ms mit dem des ganzen Songs. */
      var endN=Math.min(left.length,Math.round(sr*0.2)), endE=0;
      for(var i2=left.length-endN;i2<left.length;i2++) endE+=left[i2]*left[i2];
      endE=Math.sqrt(endE/endN);
      var gesE=0; for(var i2=0;i2<left.length;i2++) gesE+=left[i2]*left[i2];
      gesE=Math.sqrt(gesE/left.length);
      var endeDb=20*Math.log10((endE+1e-10)/(gesE+1e-10));

      postMessage({type:'progress',label:'Bandspektrum…',pct:26});
      var BV=bandVerlauf(left,right,sr);
      _tk("bandverlauf");
      var GF=grenzfrequenz(BV);
      var HK=hoehenkante(BV.binMittel, sr, BV.fftN);
      var SCH=schimmerFinden(BV);
      _tk("schimmer");

      postMessage({type:'norm', grenzHz:GF.hz,
        kanteHz:HK.hz, kanteSteil:HK.steil, schimmer:SCH,
        lufs:LN.integriert, lra:LN.schwankung,
        momentanMax:LN.momentanMax, kurzMax:LN.kurzMax,
        truePeak:tpDb, abtastSpitze:20*Math.log10(Math.max(TP.abtast,1e-10)),
        clip:clip, clipLauf:clipLauf, clipErst:clipErst, clipLetzt:clipLetzt,
        dc:dc, korr:korr, negPhase:negPhase, endeDb:endeDb,
        /* Drei Verläufe statt drei Zahlen - daraus bildet die
           Oberfläche die Strecken je Plattform. */
        spitzeVerlauf:TP.verlauf, spitzeSchritt:TP.schritt,
        clipVerlauf:clipVerlauf,  clipSchritt:SPITZE_FENSTER,
        korrVerlauf:korrVerlauf,  korrSchritt:0.4,
        momentan:LN.momentan, kurz:LN.kurz, zeiten:_T,
        massstab:LN.massstab, massstabFenster:LN.massstabFenster});

      postMessage({type:'progress',label:'Hüllkurve…',pct:32});
      // --- ENVELOPE (shared) ---
      var envStep=Math.floor(sr/100);
      var env=[], envLen=Math.floor(n/envStep);
      for(var i=0;i<envLen;i++){var s=0;for(var j=i*envStep;j<(i+1)*envStep&&j<n;j++)s+=Math.abs(ch[j]);env.push(s/envStep);}

      // global loudness & dynamic
      var sumSq=0,peak=0;
      for(var i=0;i<n;i++){sumSq+=ch[i]*ch[i];var a=Math.abs(ch[i]);if(a>peak)peak=a;}
      var rms=Math.sqrt(sumSq/n),loudness=20*Math.log10(rms+1e-10),dynamic=20*Math.log10(peak+1e-10)-loudness;

      // energy frames 50ms
      var eStep=Math.floor(sr*0.05),eFrames=Math.floor(n/eStep),energy=new Float32Array(eFrames);
      for(var i=0;i<eFrames;i++){var s=0;for(var j=i*eStep;j<(i+1)*eStep;j++)s+=ch[j]*ch[j];energy[i]=s/eStep;}

      // lufs frames 400ms
      var lStep=Math.floor(sr*0.4),lFrames=Math.floor(n/lStep),lufs=new Float32Array(lFrames);
      for(var i=0;i<lFrames;i++){var s=0;for(var j=i*lStep;j<(i+1)*lStep;j++)s+=ch[j]*ch[j];var r=Math.sqrt(s/lStep);lufs[i]=r>0?20*Math.log10(r):-60;}

      // crest frames 500ms
      var cStep=Math.floor(sr*0.5),cFrames=Math.floor(n/cStep),crest=new Float32Array(cFrames);
      for(var i=0;i<cFrames;i++){var s=0,pk=0;for(var j=i*cStep;j<(i+1)*cStep;j++){var a=Math.abs(ch[j]);s+=a*a;if(a>pk)pk=a;}var r=Math.sqrt(s/cStep);crest[i]=r>0?pk/r:0;}

      // onsets from envelope diff
      var diff=[];for(var i=1;i<env.length;i++)diff.push(Math.max(0,env[i]-env[i-1]));
      var oStep=Math.floor(sr*0.5/envStep),oFrames=Math.floor(diff.length/oStep),onsets=new Float32Array(oFrames);
      for(var i=0;i<oFrames;i++){var cnt=0;for(var j=i*oStep;j<(i+1)*oStep;j++)if(diff[j]>0.01)cnt++;onsets[i]=cnt/(0.5);}

      postMessage({type:'progress',label:'Skalare…',pct:38});

      // BPM global (autocorrelation on envelope diff)
      var minL=Math.floor(6000/180),maxL=Math.floor(6000/60),best=0,bestL=minL;
      for(var lag=minL;lag<=maxL;lag++){var s=0;for(var i=0;i<diff.length-lag;i++)s+=diff[i]*diff[i+lag];if(s>best){best=s;bestL=lag;}}
      var bpm=6000/bestL;

      // Mid/Side stereo width
      var stereoWidth=computeStereoWidth(left,right);

      postMessage({type:'progress',label:'Spektral (FFT)…',pct:40});

      /* Schwerpunkt und Rolloff aus EINER 43-ms-Probe bei 30 % der
         Spieldauer. Das ist kein Kennwert des Songs, und bin/
         analyse-index.js fuehrt "centroid" ausdruecklich in seiner
         Menge TOT ("kein Kennwert des Songs"). Was im Bild steht,
         ist der Median der Kurve weiter unten.
         Der Wert bleibt trotzdem stehen: er faehrt in der
         scalars-Nachricht mit, und andere Stellen lesen ihn. Beide
         Kanaele auch hier - richtig gerechnet kostet nicht mehr als
         falsch. */
      var fftSize=2048,mid=Math.floor(n*0.3);
      var magC=rfft(ch,mid,fftSize);
      var magC2=(right&&right.length===n)?rfft(right,mid,fftSize):null;
      var cnum=0,cden=0,tot=0;
      for(var k=0;k<magC.length;k++){
        var f=k*sr/fftSize, m=magC[k]+(magC2?magC2[k]:0);
        cnum+=f*m;cden+=m;tot+=m;
      }
      var centroid=cden>0?cnum/cden:0;
      var cum=0,thr=tot*0.85,rolloff=sr/2;
      for(var k=0;k<magC.length;k++){
        cum+=magC[k]+(magC2?magC2[k]:0);
        if(cum>=thr){rolloff=k*sr/fftSize;break;}
      }


      // --- 5th PERCENTILE ENERGY THRESHOLD ---
      var energySorted=energy.slice().sort(function(a,b){return a-b;});
      var p5idx=Math.floor(energySorted.length*0.05);
      var energyP5=energySorted[p5idx]*3;

      // --- VOCAL ANALYSIS — sliding window, 2s hop, small FFT ---
      var vFftSize=2048; // small enough for O(n log n) radix2
      var vHalf=vFftSize/2;
      var vHopSize=Math.floor(sr*1);   // 1s hop
      var vNumFrames=Math.floor((n-vFftSize)/vHopSize)+1;
      var vHann=new Float32Array(vFftSize);
      for(var i=0;i<vFftSize;i++)vHann[i]=0.5*(1-Math.cos(2*Math.PI*i/vFftSize));
      var vRe=new Float32Array(vFftSize),vIm=new Float32Array(vFftSize);

      var vocalMale=new Float32Array(vNumFrames);
      var vocalFemale=new Float32Array(vNumFrames);
      var vocalFormant=new Float32Array(vNumFrames);
      var maleScoreSum=0,femaleScoreSum=0,vocalWindowCount=0;
      var detectedF0s=[];

      for(var vw=0;vw<vNumFrames;vw++){
        var vPos=vw*vHopSize;
        if(vPos+vFftSize>n)break;

        // FFT via radix2
        for(var i=0;i<vFftSize;i++){vRe[i]=ch[vPos+i]*vHann[i];vIm[i]=0;}
        fftRadix2(vRe,vIm,vFftSize);
        var vMag=new Float32Array(vHalf);
        for(var k=1;k<vHalf;k++)vMag[k]=Math.sqrt(vRe[k]*vRe[k]+vIm[k]*vIm[k])/vFftSize;

        // Band energies
        var maleE=0,femaleE=0,totalE=0,f1E=0,f2E=0;
        for(var k=1;k<vHalf;k++){
          var freq=k*sr/vFftSize,e=vMag[k]*vMag[k];
          totalE+=e;
          if(freq>=80&&freq<=165)maleE+=e;
          if(freq>=165&&freq<=350)femaleE+=e;
          if(freq>=400&&freq<=900)f1E+=e;
          if(freq>=900&&freq<=2800)f2E+=e;
        }
        var formantRatio=totalE>0?(f1E+f2E)/totalE:0;
        vocalFormant[vw]=formantRatio;

        if(formantRatio<0.03){vocalMale[vw]=0;vocalFemale[vw]=0;continue;}

        // spectral centroid in vocal band
        var vcNum=0,vcDen=0;
        for(var k=1;k<vHalf;k++){
          var freq=k*sr/vFftSize;
          if(freq>=80&&freq<=2000){vcNum+=freq*vMag[k];vcDen+=vMag[k];}
        }
        var vCentroid=vcDen>0?vcNum/vcDen:0;

        // HPS F0
        var hpsLen=Math.floor(vHalf/3);
        var bestHpsK=0,bestHpsVal=0;
        for(var k=Math.ceil(80*vFftSize/sr);k<Math.min(hpsLen,Math.floor(500*vFftSize/sr));k++){
          var hv=vMag[k];
          if(k*2<vHalf)hv*=vMag[k*2];
          if(k*3<vHalf)hv*=vMag[k*3];
          if(hv>bestHpsVal){bestHpsVal=hv;bestHpsK=k;}
        }
        var hpsF0=bestHpsK>0?bestHpsK*sr/vFftSize:0;

        // Score
        var mScore=0,fScore=0;
        if(maleE+femaleE>0){mScore+=maleE/(maleE+femaleE);fScore+=femaleE/(maleE+femaleE);}
        if(hpsF0>0&&hpsF0<500){
          if(hpsF0<160)mScore+=1.5; else if(hpsF0>200)fScore+=1.5; else{mScore+=0.5;fScore+=0.5;}
          detectedF0s.push(hpsF0);
        }
        if(vCentroid>0){if(vCentroid<350)mScore+=0.5; else if(vCentroid>500)fScore+=0.5;}
        if(f2E>f1E*1.5)fScore+=0.3; else if(f1E>f2E)mScore+=0.3;

        vocalMale[vw]=mScore;
        vocalFemale[vw]=fScore;
        maleScoreSum+=mScore;
        femaleScoreSum+=fScore;
        vocalWindowCount++;
      }

      var f0Median=0,vocalGender;
      if(vocalWindowCount<3){
        vocalGender='instrumental';
      } else {
        if(detectedF0s.length>0){
          detectedF0s.sort(function(a,b){return a-b;});
          f0Median=detectedF0s[Math.floor(detectedF0s.length/2)];
        }
        var ratio=femaleScoreSum/(maleScoreSum+femaleScoreSum+0.001);
        if(ratio>0.58)vocalGender='weiblich';
        else if(ratio<0.42)vocalGender='männlich';
        else vocalGender='gemischt';
      }

      postMessage({type:'scalars',bpm:bpm,loudness:loudness,dynamic:dynamic,centroid:centroid,rolloff:rolloff,stereoWidth:stereoWidth,vocalGender:vocalGender,f0:Math.round(f0Median)});
      postMessage({type:'vocal_analysis',male:vocalMale,female:vocalFemale,formant:vocalFormant,gender:vocalGender,f0:Math.round(f0Median),dur:dur,hopSize:vHopSize,winSize:vFftSize});
      postMessage({type:'envelope',energy:energy,lufs:lufs,crest:crest,onsets:onsets,dur:dur});

      postMessage({type:'progress',label:'BPM-Kurve…',pct:48});

      // BPM curve with energy mask — autocorrelation
      var bwinLen=Math.floor(sr*5),bstepLen=Math.floor(sr*1),bnumW=Math.floor((n-bwinLen)/bstepLen),bpms=[];
      for(var w=0;w<bnumW;w++){
        var wStart=w*bstepLen;
        var wEnergy=0;for(var i=0;i<bwinLen;i++)wEnergy+=ch[wStart+i]*ch[wStart+i];
        wEnergy=Math.sqrt(wEnergy/bwinLen);
        if(wEnergy<energyP5){bpms.push(NaN);continue;}
        var sl=ch.subarray(wStart,wStart+bwinLen);
        var step2=Math.floor(sr/100),env2=[],diff2=[];
        for(var i=0;i<sl.length-step2;i+=step2){var s=0;for(var j=0;j<step2;j++)s+=Math.abs(sl[i+j]);env2.push(s/step2);}
        for(var i=1;i<env2.length;i++)diff2.push(Math.max(0,env2[i]-env2[i-1]));
        var minL2=Math.floor(6000/180),maxL2=Math.floor(6000/60),best2=0,bestL2=minL2;
        for(var lag=minL2;lag<=maxL2;lag++){var s=0;for(var i=0;i<diff2.length-lag;i++)s+=diff2[i]*diff2[i+lag];if(s>best2){best2=s;bestL2=lag;}}
        bpms.push(6000/bestL2);
      }
      bpms=bpms.map(function(v,i){
        if(isNaN(v))return NaN;
        var s=0,c=0;for(var j=Math.max(0,i-6);j<=Math.min(bpms.length-1,i+6);j++){if(!isNaN(bpms[j])){s+=bpms[j];c++;}}
        return c>0?s/c:NaN;
      });

      // IOI BPM curve with energy mask
      var ioiWinLen=Math.floor(sr*8),ioiStepLen=Math.floor(sr*1);
      var ioiNumW=Math.floor((n-ioiWinLen)/ioiStepLen);
      var bpmsIOI=new Float32Array(ioiNumW);
      var bpmsMedian=new Float32Array(ioiNumW);
      var eStep2=Math.floor(sr*0.02);
      for(var w=0;w<ioiNumW;w++){
        var wStart=w*ioiStepLen,wEnd=wStart+ioiWinLen;
        var wEnergy2=0;for(var i=wStart;i<wEnd;i++)wEnergy2+=ch[i]*ch[i];
        wEnergy2=Math.sqrt(wEnergy2/ioiWinLen);
        if(wEnergy2<energyP5){bpmsIOI[w]=NaN;bpmsMedian[w]=NaN;continue;}
        var eFrames2=[];
        for(var i=wStart;i<wEnd-eStep2;i+=eStep2){
          var s=0;for(var j=0;j<eStep2;j++)s+=ch[i+j]*ch[i+j];
          eFrames2.push(Math.sqrt(s/eStep2));
        }
        var eMean=0;for(var i=0;i<eFrames2.length;i++)eMean+=eFrames2[i];eMean/=eFrames2.length;
        var thr2=eMean*1.3;
        var peaks2=[],minDist=10,lastPeak=-minDist;
        for(var i=1;i<eFrames2.length-1;i++){
          if(eFrames2[i]>eFrames2[i-1]&&eFrames2[i]>eFrames2[i+1]&&eFrames2[i]>thr2&&i-lastPeak>=minDist){peaks2.push(i);lastPeak=i;}
        }
        if(peaks2.length<2){bpmsIOI[w]=NaN;bpmsMedian[w]=NaN;continue;}
        var iois=[];
        for(var i=1;i<peaks2.length;i++){var sec=(peaks2[i]-peaks2[i-1])*eStep2/sr;var bpmVal=60/sec;if(bpmVal>=50&&bpmVal<=200)iois.push(bpmVal);}
        if(!iois.length){bpmsIOI[w]=NaN;bpmsMedian[w]=NaN;continue;}
        var sum=0;for(var i=0;i<iois.length;i++)sum+=iois[i];bpmsIOI[w]=sum/iois.length;
        iois.sort(function(a,b){return a-b;});bpmsMedian[w]=iois[Math.floor(iois.length/2)];
      }
      function smArr2(arr,w2){return Array.prototype.slice.call(arr).map(function(v,i){
        if(isNaN(v))return NaN;
        var s=0,c=0;for(var j=Math.max(0,i-w2);j<=Math.min(arr.length-1,i+w2);j++){if(!isNaN(arr[j])){s+=arr[j];c++;}}
        return c>0?s/c:NaN;
      });}
      bpmsIOI=smArr2(bpmsIOI,4);bpmsMedian=smArr2(bpmsMedian,4);
      postMessage({type:'bpm_curve',bpms:bpms,bpmsIOI:bpmsIOI,bpmsMedian:bpmsMedian,dur:dur});

      postMessage({type:'progress',label:'Stereo…',pct:52});
      var nn=Math.min(left.length,right.length);
      var sStep=Math.floor(sr*0.1),sFrames=Math.floor(nn/sStep);
      // 8 octave bands
      var sBands=[[20,40],[40,80],[80,160],[160,315],[315,630],[630,1250],[1250,2500],[2500,20000]];
      var sFftSize=1024;
      var nSBands=8;
      var lBands=[],rBands=[];
      for(var b=0;b<nSBands;b++){lBands.push(new Float32Array(sFrames));rBands.push(new Float32Array(sFrames));}
      // global max for absolute normalization (p95 across all bands)
      var allEnergies=[];
      for(var i=0;i<sFrames;i++){
        var magL=rfft(left,i*sStep,sFftSize);
        var magR=rfft(right,i*sStep,sFftSize);
        for(var b=0;b<nSBands;b++){
          var kLo=Math.round(sBands[b][0]/sr*sFftSize);
          var kHi=Math.min(Math.round(sBands[b][1]/sr*sFftSize),sFftSize/2);
          if(kHi<=kLo)kHi=kLo+1;
          var el=0,er=0,cnt=kHi-kLo;
          for(var k=kLo;k<kHi;k++){el+=magL[k]*magL[k];er+=magR[k]*magR[k];}
          lBands[b][i]=Math.sqrt(el/cnt);
          rBands[b][i]=Math.sqrt(er/cnt);
          allEnergies.push(lBands[b][i]+rBands[b][i]);
        }
      }
      // p95 of total energy for global normalization
      allEnergies.sort(function(a,b){return a-b;});
      var energyP95=allEnergies[Math.floor(allEnergies.length*0.95)]||1;
      postMessage({type:'stereo_curve',lBands:lBands,rBands:rBands,energyP95:energyP95,dur:dur});


      postMessage({type:'progress',label:'Struktur…',pct:58});
      var frameSec=2,frameLen=Math.floor(sr*frameSec),numSeg=Math.floor(n/frameLen);
      var fps2=[];
      var bands=[[20,100],[100,250],[250,500],[500,1000],[1000,2000],[2000,4000],[4000,8000],[8000,16000]];
      var segFftSize=512;
      for(var f=0;f<numSeg;f++){
        var magS=rfft(ch,f*frameLen,segFftSize);
        var fp=new Float32Array(bands.length);
        for(var b=0;b<bands.length;b++){
          var en=0,cnt=0;
          for(var k=1;k<magS.length;k++){
            var freq=k*sr/segFftSize;if(freq<bands[b][0]||freq>bands[b][1])continue;
            en+=magS[k];cnt++;
          }
          fp[b]=cnt>0?en/cnt:0;
        }
        var mx=Math.max.apply(null,Array.prototype.slice.call(fp));if(mx>0)for(var b=0;b<bands.length;b++)fp[b]/=mx;
        fps2.push(fp);
      }
      var novelty=[];var kern=3;
      for(var f=kern;f<numSeg-kern;f++){
        var before=0,after=0;
        for(var b=0;b<bands.length;b++){
          var ab=0,aa=0;
          for(var k=1;k<=kern;k++){ab+=fps2[f-k][b];aa+=fps2[f+k][b];}
          ab/=kern;aa/=kern;
          before+=Math.pow(fps2[f][b]-ab,2);after+=Math.pow(fps2[f][b]-aa,2);
        }
        novelty.push(Math.sqrt(before+after));
      }
      novelty=novelty.map(function(_,i){var s=0,c=0;for(var j=Math.max(0,i-2);j<=Math.min(novelty.length-1,i+2);j++){s+=novelty[j];c++;}return s/c;});
      var thrN=0;for(var i=0;i<novelty.length;i++)thrN+=novelty[i];thrN=thrN/novelty.length*1.2;
      var bounds=[0],minGap=Math.floor(8/frameSec);
      for(var i=1;i<novelty.length-1;i++){
        if(novelty[i]>novelty[i-1]&&novelty[i]>novelty[i+1]&&novelty[i]>thrN&&(i-bounds[bounds.length-1])>=minGap)bounds.push(i+kern);
      }
      bounds.push(numSeg);
      var segColors=['#2a5a8a','#3a7a4a','#8a4a2a','#6a3a8a','#7a7a2a','#2a7a7a','#8a2a5a'];
      var segments=[];
      for(var i=0;i<bounds.length-1;i++){
        var ss=bounds[i]*frameSec,se=Math.min(bounds[i+1]*frameSec,dur);
        segments.push({start:ss,end:se,color:segColors[i%segColors.length]});
      }
      postMessage({type:'structure',segments:segments,duration:dur});

      postMessage({type:'progress',label:'FFT Runde…',pct:62});
      // --- PROGRESSIVE FFT ROUNDS using real FFT ---
      var fftSize2=1024;
      var bins2=fftSize2/2;
      var rounds=[8192,4096,2048,1024,256];
      var totalRounds=rounds.length;

      for(var round=0;round<totalRounds;round++){
        var hop=rounds[round];
        var numFrames=Math.floor((n-fftSize2)/hop);
        var pctStart=62+round/totalRounds*32;
        var pctEnd=62+(round+1)/totalRounds*32;

        postMessage({type:'progress',label:'FFT Runde '+(round+1)+'/'+totalRounds+'…',pct:Math.round(pctStart)});

        var spectroData=new Uint8Array(numFrames*bins2);
        var stereoSpectroData=new Int8Array(numFrames*bins2);
        var fluxArr=new Float32Array(numFrames);
        // 8-band flux arrays (same bands as stereo panorama)
        var fluxBands=[[20,40],[40,80],[80,160],[160,315],[315,630],[630,1250],[1250,2500],[2500,20000]];
        var nFluxBands=8;
        var bandFluxArr=[];
        for(var fb=0;fb<nFluxBands;fb++)bandFluxArr.push(new Float32Array(numFrames));
        var prevMagBands=null;
        var harmArr=new Float32Array(numFrames);
        var pitchArr=new Float32Array(numFrames);
        var chromaFlat=new Float32Array(numFrames*12);
        var inharmonArr=new Float32Array(numFrames);
        var entropyArr=new Float32Array(numFrames);
        var centroidArr=new Float32Array(numFrames);
        var rolloffArr=new Float32Array(numFrames);
        var tiltArr=new Float32Array(numFrames);       // spectral tilt: bass/treble ratio
        var harmDensArr=new Float32Array(numFrames);   // harmonic density: active partials count
        var prevMag=null;

        // frequency bin boundaries for tilt
        var bassHi=Math.round(500/sr*fftSize2);
        var trebleLo=Math.round(2000/sr*fftSize2);

        for(var frame=0;frame<numFrames;frame++){
          var mag=rfft(ch,frame*hop,fftSize2);
          var magR=rfft(right,frame*hop,fftSize2);

          // spectro (mono)
          for(var k=0;k<bins2;k++){
            var db=(20*Math.log10(mag[k]+1e-9)+80)/80;
            spectroData[frame*bins2+k]=Math.max(0,Math.min(255,Math.round(db*255)));
          }

          // stereo spectro: L-R normalised to -127..+127
          // positive = left dominant, negative = right dominant
          for(var k=0;k<bins2;k++){
            var l=mag[k],r=magR[k],sum=l+r;
            var lr=sum>1e-10?(l-r)/sum:0; // -1..+1
            stereoSpectroData[frame*bins2+k]=Math.max(-127,Math.min(127,Math.round(lr*127)));
          }

          // flux — global and per-band
          if(prevMag){
            var fl=0;
            for(var k=0;k<bins2;k++){var d=mag[k]-prevMag[k];fl+=d*d;}
            fluxArr[frame]=Math.sqrt(fl);
            // per-band flux
            if(prevMagBands){
              for(var fb=0;fb<nFluxBands;fb++){
                var kLo2=Math.round(fluxBands[fb][0]/sr*fftSize2);
                var kHi2=Math.min(Math.round(fluxBands[fb][1]/sr*fftSize2),bins2);
                if(kHi2<=kLo2)kHi2=kLo2+1;
                var bfl=0;
                for(var k=kLo2;k<kHi2;k++){var d=mag[k]-prevMagBands[k];bfl+=d*d;}
                bandFluxArr[fb][frame]=Math.sqrt(bfl/(kHi2-kLo2));
              }
            }
          }
          prevMag=mag;
          prevMagBands=mag;

          // harmonicity + pitch via HPS — multi-F0 with spectral subtraction
          var totalE=0;for(var k=0;k<bins2;k++)totalE+=mag[k]*mag[k];
          var f0=hpsPitch(mag,sr,fftSize2);
          var f0bin=f0>0?Math.round(f0/sr*fftSize2):0;
          var harmE=0;
          if(f0bin>0){for(var h=1;h<=6;h++){var hb=Math.round(f0bin*h);if(hb<bins2)harmE+=mag[hb]*mag[hb];}}
          harmArr[frame]=totalE>0?Math.min(1,harmE/totalE*4):0;
          pitchArr[frame]=f0>0?f0:0;



          // inharmonicity
          var inharmVal=0;
          if(f0bin>0){
            var nPart=0;
            for(var h=2;h<=8;h++){
              var idealBin=f0bin*h;if(idealBin>=bins2)break;
              var searchW=Math.max(1,Math.round(f0bin*0.1));
              var peakBin=idealBin,peakMag=0;
              for(var kb=Math.max(0,idealBin-searchW);kb<=Math.min(bins2-1,idealBin+searchW);kb++){if(mag[kb]>peakMag){peakMag=mag[kb];peakBin=kb;}}
              if(peakMag>0){inharmVal+=Math.abs(peakBin-idealBin)/idealBin;nPart++;}
            }
            if(nPart>0)inharmVal/=nPart;
          }

          // spectral entropy
          var entropyVal=0;
          if(totalE>0){for(var k=0;k<bins2;k++){var p=mag[k]*mag[k]/totalE;if(p>0)entropyVal-=p*Math.log(p);}entropyVal/=Math.log(bins2);}

          /* Schwerpunkt und Rolloff je Bild - aus BEIDEN Kanaelen,
             Betraege addiert. Das kostet hier keine einzige FFT mehr:
             magR wird ohnehin gerechnet (fuers Stereo-Spektrogramm)
             und lag bisher nur ungenutzt daneben.
             Diese Kurven sind es, die im Bild landen - die Karten
             zeigen ihren Median, nicht den Skalar aus der einen
             43-ms-Probe weiter oben. */
          var cnum2=0,cden2=0;
          for(var k=0;k<bins2;k++){
            var f2=k*sr/fftSize2, m2=mag[k]+magR[k];
            cnum2+=f2*m2;cden2+=m2;
          }
          centroidArr[frame]=cden2>0?cnum2/cden2:0;
          var rolloffFrame=sr/2,tot2=cden2,cum2=0,thr3=tot2*0.85;
          for(var k=0;k<bins2;k++){cum2+=mag[k]+magR[k];if(cum2>=thr3){rolloffFrame=k*sr/fftSize2;break;}}
          rolloffArr[frame]=rolloffFrame;

          inharmonArr[frame]=inharmVal;
          entropyArr[frame]=entropyVal;

          // spectral tilt: log ratio of bass energy to treble energy
          var bassE=0,trebleE=0;
          for(var k=1;k<bassHi;k++)bassE+=mag[k];
          for(var k=trebleLo;k<bins2;k++)trebleE+=mag[k];
          // tilt > 0 = bass dominant, < 0 = treble dominant, 0 = balanced
          tiltArr[frame]=(bassE+trebleE)>0?(bassE-trebleE)/(bassE+trebleE):0;

          // harmonic density: count partials above noise floor (10% of f0 magnitude)
          var harmDens=0;
          if(f0bin>0){
            var noiseFloor=mag[f0bin]*0.1;
            for(var h=1;h<=16;h++){var hb=Math.round(f0bin*h);if(hb>=bins2)break;if(mag[hb]>noiseFloor)harmDens++;}
          }
          harmDensArr[frame]=harmDens;


          // chroma
          var ch12=new Float32Array(12);
          for(var k=1;k<bins2;k++){
            var freq=k*sr/fftSize2;if(freq<80||freq>4000)continue;
            var midi=Math.round(12*Math.log2(freq/440)+69);
            ch12[((midi%12)+12)%12]+=mag[k];
          }
          var cmx2=Math.max.apply(null,Array.prototype.slice.call(ch12));
          if(cmx2>0)for(var i=0;i<12;i++)chromaFlat[frame*12+i]=ch12[i]/cmx2;
        }

        // smooth pitch
        for(var i=1;i<pitchArr.length-1;i++){if(pitchArr[i]===0)pitchArr[i]=(pitchArr[i-1]+pitchArr[i+1])/2;}

        // note stability
        var noteStabArr=new Float32Array(numFrames);
        var runLen=1;
        for(var i=1;i<numFrames;i++){
          var p1=pitchArr[i-1],p2=pitchArr[i];
          var semitones=(p1>0&&p2>0)?Math.abs(12*Math.log2(p2/p1)):0;
          if(semitones<1.5){runLen++;}else{for(var j=i-runLen;j<i;j++)noteStabArr[j]=runLen;runLen=1;}
        }
        for(var j=numFrames-runLen;j<numFrames;j++)noteStabArr[j]=runLen;
        var maxStab=0;for(var i=0;i<numFrames;i++){if(noteStabArr[i]>maxStab)maxStab=noteStabArr[i];}maxStab=maxStab||1;
        for(var i=0;i<numFrames;i++)noteStabArr[i]/=maxStab;

        // chord change rate
        var chordChanges=0,prevChordIdx=-1;
        for(var f=0;f<numFrames;f++){
          var c12s=chromaFlat.subarray(f*12,(f+1)*12);
          var bestC=-1,bestCI=0;
          for(var root=0;root<12;root++){
            var maj=c12s[root]+c12s[(root+4)%12]*0.8+c12s[(root+7)%12]*0.9;
            var min=c12s[root]+c12s[(root+3)%12]*0.8+c12s[(root+7)%12]*0.9;
            if(maj>bestC){bestC=maj;bestCI=root*2;}if(min>bestC){bestC=min;bestCI=root*2+1;}
          }
          if(bestCI!==prevChordIdx&&prevChordIdx>=0)chordChanges++;prevChordIdx=bestCI;
        }
        var chordRate=numFrames>0?chordChanges/(numFrames*hop/sr):0;

        // mean scalars
        var meanCentroid=0,meanRolloff=0,meanEntropy=0,meanInharm=0,meanTilt=0,meanHarmDens=0,cnt3=0;
        for(var i=0;i<numFrames;i++){if(centroidArr[i]>0){meanCentroid+=centroidArr[i];meanRolloff+=rolloffArr[i];meanEntropy+=entropyArr[i];meanInharm+=inharmonArr[i];meanTilt+=tiltArr[i];meanHarmDens+=harmDensArr[i];cnt3++;}}
        if(cnt3>0){meanCentroid/=cnt3;meanRolloff/=cnt3;meanEntropy/=cnt3;meanInharm/=cnt3;meanTilt/=cnt3;meanHarmDens/=cnt3;}

        var isFinal=round===totalRounds-1;
        // build transferable list for zero-copy transfer
        var transferList=[
          fluxArr.buffer,harmArr.buffer,pitchArr.buffer,
          ...bandFluxArr.map(function(a){return a.buffer;}),
          chromaFlat.buffer,entropyArr.buffer,inharmonArr.buffer,noteStabArr.buffer,
          tiltArr.buffer,harmDensArr.buffer,
          centroidArr.buffer,rolloffArr.buffer
        ];
        var msg={
          type:'fft_partial',round:round+1,totalRounds:totalRounds,isFinal:isFinal,
          numFrames:numFrames,fftSize:fftSize2,dur:dur,
          flux:fluxArr,bandFlux:bandFluxArr,harm:harmArr,pitch:pitchArr,chroma:chromaFlat,
          entropy:entropyArr,inharm:inharmonArr,noteStab:noteStabArr,
          tilt:tiltArr,harmDens:harmDensArr,
          centroidCurve:centroidArr,rolloffCurve:rolloffArr,
          scalars:{centroid:meanCentroid,rolloff:meanRolloff,entropy:meanEntropy,
                   inharm:meanInharm,chordRate:chordRate,
                   tilt:meanTilt,harmDens:meanHarmDens},
          pct:Math.round(pctEnd)
        };
        // only send heavy spectro data on final round (saves ~200MB transfer)
        if(isFinal){
          msg.frames=spectroData;
          msg.stereoFrames=stereoSpectroData;
          transferList.push(spectroData.buffer,stereoSpectroData.buffer);
        } else {
          // send small downsampled spectro for early preview
          var previewStep=Math.max(1,Math.floor(numFrames/2000));
          var previewFrames=Math.floor(numFrames/previewStep);
          var previewData=new Uint8Array(previewFrames*bins2);
          for(var pf=0;pf<previewFrames;pf++){
            var sf=pf*previewStep;
            for(var k=0;k<bins2;k++)previewData[pf*bins2+k]=spectroData[sf*bins2+k];
          }
          msg.frames=previewData;
          msg.previewStep=previewStep;
          msg.numFramesFull=numFrames;
          transferList.push(previewData.buffer);
        }
        postMessage(msg,transferList);
      }
    };
    