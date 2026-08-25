/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ==========================================================================
   Ablageformat der vorgerechneten Analysen  ·  web/fremd/analyse-ablage.js

   Laeuft im Browser als gewoehnliches Skript UND in Node ueber
   vm.runInContext - aus demselben Grund wie der Rechenkern nebenan:
   Zwei Fassungen desselben Verfahrens rechnen binnen Wochen
   Verschiedenes, und dann liegt in der Ablage etwas anderes, als der
   Analyzer erwartet, ohne dass es jemand merkt.

   Hier steht alles, was BEIDE Seiten brauchen: das Dateiformat und die
   Mathematik der beiden Spektrogramme. Nicht das Zeichnen - das bleibt
   im Analyzer.

   Aufruf im Browser:  <script src="/fremd/analyse-ablage.js">
   Aufruf in Node:     siehe bin/vorrechnen.js
   ========================================================================== */

var IST_NODE = (typeof process !== 'undefined' && process.versions && process.versions.node);

/* ------------------------------------------------------------------
   ABLAGE VORGERECHNETER ANALYSEN
   ------------------------------------------------------------------
   Gemessen an "Ulrich & Aennchen" (278 s): Rechnen 8,6 s, Zeichnen
   8,3 s. Beides ist speicherbar, und Laden kostet fast nichts -
   typisierte Reihen sind nur SICHTEN auf einen Puffer, das
   Zurueckdeuten braucht 0 ms.

   WAS GESPEICHERT WIRD - und was nicht:
   Die rohen FFT-Bilder (frames, stereoFrames) sind 92 % der
   Datenmenge und werden NUR gebraucht, um die beiden Spektrogramme
   zu malen. Statt ihrer wandert das fertige Bild als WebP in die
   Ablage: 1,0 und 1,3 MB statt 47. Damit sind es 6,6 MB je Song
   und rund 2 GB fuer das ganze Archiv - neben 22 GB Medien nichts.

   DAS FORMAT ist bewusst stumpf:
     [4 Byte Kopflaenge][Kopf als JSON][Fuellbytes bis 8][Reihen]
   Der Kopf ist der Mitschnitt, in dem jede typisierte Reihe durch
   {__r: Nummer} ersetzt ist. Kein Schema, keine Fassungsnummer im
   Format - der Stand steht als Feld IM Kopf, und wer ihn nicht
   kennt, rechnet neu. Ein falsch gelesener Puffer waere schlimmer
   als acht Sekunden Rechnen.
   ================================================================== */
var ABLAGE_STAND = 1;          // hochzaehlen, wenn sich Reihen aendern

/* WIE gemessen wurde - nicht WIE es abgelegt ist.
 *
 * ABLAGE_STAND beschreibt das FORMAT: aendert es sich, ist die Datei
 * unlesbar und muss neu gerechnet werden. Ein anderer MESSWEG dagegen
 * laesst Format und Reihen unangetastet; nur einzelne WERTE sind nach
 * altem Verfahren entstanden.
 *
 *   1  Tonart, Schwerpunkt und Rolloff aus dem LINKEN Kanal allein
 *   2  aus beiden Kanaelen, Betraege im Spektrum addiert
 *   3  (26.08.2026) Huellkurve, Energie, Lautheit, Scheitelfaktor,
 *      Chroma, Fluss, Entropie und Abschnittserkennung ebenfalls aus
 *      beiden Kanaelen - kanalweise gerechnet, erst das Ergebnis
 *      gemittelt, damit sich gegenphasige Anteile nicht ausloeschen.
 *      Das Chroma bekam dabei eine eigene FFT mit 8192 Punkten,
 *      Gipfelauswahl statt aller Faecher und parabolisch verfeinerte
 *      Scheitelfrequenz: Bei 1024 Punkten landete ein 220-Hz-Ton in
 *      A# statt in A.
 *
 * Der Stempel wird geschrieben und derzeit von niemandem gelesen: Der
 * Waechter, der ihn auswertete, ist am 24.08.2026 mit dem alten
 * Tonartverfahren entfernt worden (er zog eine Zahl nach, die sich als
 * unbrauchbar erwies - siehe docs/HISTORY.md). Er bleibt trotzdem
 * stehen. Ihn zu entfernen hiesse, ablageVerpacken und ablageEntpacken
 * anzufassen, also das Format, an dem 4 GB haengen - fuer nichts. Wer
 * kuenftig einen Messweg aendert, findet hier eine Zaehlung vor,
 * statt eine erfinden zu muessen. */
var MESSWEG = 3;
var ABLAGE_OHNE  = ['frames','framesR','stereoFrames'];   // kommen als Bild

var TYPEN = {Float32Array:Float32Array, Float64Array:Float64Array,
             Uint8Array:Uint8Array, Int8Array:Int8Array,
             Int16Array:Int16Array, Uint16Array:Uint16Array,
             Int32Array:Int32Array, Uint32Array:Uint32Array,
             Uint8ClampedArray:Uint8ClampedArray};

function istReihe(v){ return v && v.BYTES_PER_ELEMENT && v.byteLength!==undefined; }

function ablageVerpacken(auf){
  var reihen=[], teile=[], versatz=0;
  /* Eine Reihe in den Binaerteil legen und ihre Nummer zurueckgeben.

     Auf acht ausrichten. Ohne das wirft ein Float32Array beim
     Zurueckdeuten "start offset should be a multiple of 4" - genau
     daran ist meine erste Messung gescheitert. */
  var reiheAblegen=function(v){
    var luecke=(8-(versatz%8))%8;
    if(luecke){ teile.push(new Uint8Array(luecke)); versatz+=luecke; }
    reihen.push({typ:v.constructor.name, von:versatz, laenge:v.length});
    teile.push(v); versatz+=v.byteLength;
    return reihen.length-1;
  };
  var kopfNachrichten=auf.nachrichten.map(function(msg){
    var flach={};
    for(var k in msg){
      if(!Object.prototype.hasOwnProperty.call(msg,k)) continue;
      var v=msg[k];
      if(ABLAGE_OHNE.indexOf(k)>=0) continue;      // Bild statt Rohdaten
      if(istReihe(v)){
        flach[k]={__r:reiheAblegen(v)};
      } else if(Array.isArray(v) && v.length && v.every(istReihe)){
        /* BAENDER SIND ARRAYS VON REIHEN, KEIN JSON.

           bandFlux, massstab, lBands und rBands sind je ein Array
           aus sieben oder acht typisierten Reihen. JSON macht aus
           jeder ein Objekt mit durchnumerierten Schluesseln - der
           Kopf der ersten Fassung war dadurch 22,5 MB gross bei
           6,5 MB echten Daten. Jetzt wandert jedes Band einzeln in
           den Binaerteil. */
        flach[k]={__rs:v.map(reiheAblegen)};
      } else if(Array.isArray(v) && v.length>8 && v.every(function(x){ return typeof x==='number'; })){
        /* GEWOEHNLICHE ZAHLENREIHEN AUCH BINAER.

           Ein Array aus Zahlen ueberlebt JSON scheinbar - bis eines
           der Elemente NaN ist. Dann steht dort null, und wer
           spaeter darauf .toFixed() ruft, bricht ab. Genau daran
           scheiterte das Abspielen: Die Funkenlinien einer Karte
           fanden null statt einer Zahl und rissen den ganzen
           Ladeweg mit; der Song wurde still neu gerechnet.

           Als Float32Array ist NaN einfach NaN. Beim Auspacken wird
           wieder ein gewoehnliches Array daraus, damit sich fuer
           die Zeichenfunktionen nichts aendert. */
        flach[k]={__ra:reiheAblegen(Float32Array.from(v))};
      } else if(typeof v==='function'){
        continue;
      } else if(v&&typeof v==='object'&&!Array.isArray(v)){
        /* Verschachteltes doch mitnehmen - solange es klein ist.

           Der erste Entwurf liess alle Objekte weg, aus Furcht vor
           der Groesse. Die Furcht galt aber den Baendern, und die
           liegen laengst binaer. Uebrig sind kleine Sachen wie die
           Tonart oder die Abschnittsliste - und ohne sie brach das
           Abspielen ab: "Cannot read properties of undefined".
           Ein weggelassenes Feld ist kein leeres Feld, sondern eine
           Falle fuer jeden, der es liest.

           Die Grenze ist gemessen, nicht geraten: Was als JSON
           ueber 64 KB waechst, gehoert nicht in einen Kopf. */
        try{
          var j=JSON.stringify(v);
          if(j && j.length<=65536) flach[k]=JSON.parse(j);
        }catch(e){}
      } else if(typeof v==='number' && !isFinite(v)){
        /* NaN UND UNENDLICH UEBERLEBEN JSON NICHT.

           JSON.stringify macht aus beiden ein null. Gemessen an
           "Mittwochs 20:00 Uhr" traf es momentanMax und kurzMax -
           ein Song ohne einen einzigen Block ueber dem Tor hat
           keinen Groesstwert, und -Infinity ist die richtige
           Antwort darauf. Beim Abspielen stand dort null, und
           null.toFixed() beendete den ganzen Weg: Der Song wurde
           still neu gerechnet, statt geladen zu werden.

           Also ausdruecklich verpacken. Wer eine Zahl speichert,
           speichert auch die drei, die keine sind. */
        flach[k]={__z: (v!==v) ? 'NaN' : (v>0 ? 'Inf' : '-Inf')};
      } else {
        flach[k]=v;
      }
    }
    return flach;
  });
  /* WORAUS gemessen wurde. Ohne dieses Feld war eine aus dem MP3
     gerechnete Ablage von einer aus dem WAV nicht zu unterscheiden -
     und aus dem MP3 sind Tiefpasskante, True Peak und Clipping wertlos,
     weil es seine eigene Encoderkante mitbringt (Caspar_D, 26.08.2026:
     „MP3 sollte gar nicht genutzt werden, immer vom WAV ausgehen").
     Der Weg dorthin ist seit demselben Tag versperrt; der Stempel sagt
     trotzdem, was vorliegt. */
  var kopf=JSON.stringify({stand:ABLAGE_STAND, messweg:MESSWEG, id:auf.id, sr:auf.sr,
                           quelle:auf.quelle||'audio.wav',
                           dauer:auf.dauer, reihen:reihen,
                           nachrichten:kopfNachrichten});
  var kopfBytes=IST_NODE ? Buffer.from(kopf,'utf8') : new TextEncoder().encode(kopf);
  var laenge=new Uint8Array(4);
  new DataView(laenge.buffer).setUint32(0, kopfBytes.length, true);
  var vor=4+kopfBytes.length;
  var fuell=new Uint8Array((8-(vor%8))%8);
  var stuecke=[laenge, kopfBytes, fuell].concat(teile);
  /* Browser: ein Blob, den fetch als Rumpf nimmt. Node: ein Buffer, den
     fs schreibt. Dieselben Bytes, zwei Huellen. */
  if (IST_NODE) return Buffer.concat(stuecke.map(function(t){
    return Buffer.from(t.buffer || t, t.byteOffset || 0, t.byteLength);
  }));
  return new Blob(stuecke);
}

function ablageEntpacken(ab){
  var sicht=new DataView(ab);
  var kopfLaenge=sicht.getUint32(0, true);
  var rohKopf=new Uint8Array(ab,4,kopfLaenge);
  var kopf=JSON.parse(IST_NODE ? Buffer.from(rohKopf).toString('utf8')
                                : new TextDecoder().decode(rohKopf));
  if(kopf.stand!==ABLAGE_STAND) return null;        // anderes FORMAT: ganz neu rechnen
  /* Der Messweg macht die Datei nicht ungueltig - er sagt nur, dass
     einzelne Werte nachzuziehen sind. Fehlt das Feld, stammt die
     Ablage aus der Zeit vor seiner Einfuehrung: Messweg 1. */
  kopf.messweg = kopf.messweg || 1;
  var daten=4+kopfLaenge; daten+=(8-(daten%8))%8;
  var reihen=kopf.reihen.map(function(r){
    var T=TYPEN[r.typ]; if(!T) return null;
    return new T(ab, daten+r.von, r.laenge);
  });
  if(reihen.indexOf(null)>=0) return null;
  kopf.nachrichten=kopf.nachrichten.map(function(flach){
    var msg={};
    for(var k in flach){
      var v=flach[k];
      if(v&&typeof v==='object'&&v.__r!==undefined) msg[k]=reihen[v.__r];
      else if(v&&typeof v==='object'&&v.__rs) msg[k]=v.__rs.map(function(i){return reihen[i];});
      else if(v&&typeof v==='object'&&v.__ra!==undefined) msg[k]=Array.from(reihen[v.__ra]);
      else if(v&&typeof v==='object'&&v.__z!==undefined)
        msg[k]= v.__z==='NaN' ? NaN : (v.__z==='Inf' ? Infinity : -Infinity);
      else msg[k]=v;
    }
    return msg;
  });
  return kopf;
}


function baenderJeZeile(bh, bins, fftSize, sr, logMin, logMax){
  var von=new Int32Array(bh), bis=new Int32Array(bh);
  var kAn=function(kante){
    var normY=Math.max(0,Math.min(1,kante));
    var freq=Math.pow(10,logMin+(logMax-logMin)*normY);
    return Math.max(0,Math.min(bins-1,Math.round(freq/sr*fftSize)));
  };
  for(var row=0;row<bh;row++){
    /* normY laeuft von unten (0) nach oben (1); row 0 ist oben. */
    var oben =(bh-1-row+0.5)/(bh-1);
    var unten=(bh-1-row-0.5)/(bh-1);
    var a=kAn(unten), b=kAn(oben);
    if(b<a){ var t=a; a=b; b=t; }
    von[row]=a; bis[row]=Math.max(a+1,b+1);   // bis ist ausschliessend
  }
  return {von:von, bis:bis};
}


/* Byte -> Amplitude, einmal fuer alle 256 moeglichen Werte. Die Frames
   tragen (20*log10(mag)+80)/80 als Byte, also DEZIBEL; damit zu
   gewichten hiesse, mit Logarithmen zu wiegen. */
var AMP = (function(){
  var t=new Float32Array(256);
  for(var b=0;b<256;b++) t[b]=Math.pow(10,((b/255*80)-80)/20);
  return t;
})();

/* --------------------------------------------------------------------
   DIE BEIDEN SPEKTROGRAMME ALS BILDPUNKTE.

   Reine Mathematik - kein Canvas, kein Browser. Der Aufrufer gibt eine
   Flaeche (data, bw, bh) her und bekommt sie gefuellt zurueck; ob die
   aus einem createImageData stammt oder aus einem Buffer, ist beiden
   Seiten gleichgueltig.

   Genau deshalb steht es hier: bin/vorrechnen.js rechnet dieselben
   Bilder in Node und schiebt sie an ffmpeg.
   -------------------------------------------------------------------- */
/* DIE SUMME BEIDER KANAELE, aus den beiden Halbbildern.

   Beide Reihen tragen dB auf 0..255: db = (20·log10(a)+80)/80. Addieren
   darf man erst, nachdem man das rueckgaengig gemacht hat - dB sind
   Verhaeltnisse, und Verhaeltnisse addieren sich nicht.

   Addiert werden die BETRAEGE, nicht die Signale. Das ist dieselbe
   Entscheidung wie in bin/toene.js: Gegenphasige Anteile wuerden sich
   sonst gegenseitig ausloeschen, und ein Ton, der in beiden Kanaelen
   steht, verschwaende aus dem Bild. Es ist also nicht FFT(L+R), sondern
   |L|+|R| - deshalb heisst die Lasche auch so. */
function summeAusKanaelen(framesL, framesR){
  var n=framesL.length, aus=new Uint8Array(n);
  for(var i=0;i<n;i++){
    var l=Math.pow(10,(framesL[i]/255*80-80)/20);
    var r=Math.pow(10,(framesR[i]/255*80-80)/20);
    var db=(20*Math.log10(l+r+1e-9)+80)/80;
    aus[i]=Math.max(0,Math.min(255,Math.round(db*255)));
  }
  return aus;
}

function spektroBildFuellen(data, bw, bh, o){
  var frames=o.frames, numFrames=o.numFrames, bins=o.bins, fftSize=o.fftSize,
      sr=o.sr, logMin=o.logMin, logMax=o.logMax,
      p5arr=o.p5, pMarr=o.pM, p95arr=o.p95;
        var zb=baenderJeZeile(bh,bins,fftSize,sr,logMin,logMax);
        var kVon=zb.von, kBis=zb.bis;
        /* Der Puffer kann schmaler sein als es Bilder gibt. Dann trägt
           eine Spalte mehrere Bilder - und dann wird das MAXIMUM
           genommen, nicht ein Stellvertreter.

           Der Unterschied ist nicht kosmetisch: Ein Knack von zwanzig
           Millisekunden fällt sonst in ein übersprungenes Bild und ist
           spurlos weg. Genau dieser Fehler ist bei der Farbextraktion
           schon einmal passiert - dort überlebte beim Verkleinern auf
           64×64 kein einziges rotes Pixel der Kameralinsen. Siehe
           docs/FARBHANDLING.md. Beim Suchen nach Störungen darf die
           Anzeige nichts verschlucken. */
        for(var col=0;col<bw;col++){
          var fA=Math.floor(col/bw*numFrames);
          var fB=Math.max(fA+1, Math.floor((col+1)/bw*numFrames));
          if(fB>numFrames) fB=numFrames;
          for(var row=0;row<bh;row++){
            /* ERST NORMIEREN, DANN DAS GROESSTE NEHMEN.

               Die Streckung ist je Band eigen - jedes hat sein eigenes
               Rauschen und seine eigenen Perzentile. Roh zu vergleichen
               und erst danach zu normieren hiesse, Baender mit hohem
               Grundpegel immer gewinnen zu lassen. Gefragt ist aber:
               welches dieser Baender ragt am staerksten aus SICH SELBST
               heraus. */
            var norm=0;
            for(var k=kVon[row];k<kBis[row];k++){
              var roh=0;
              for(var fi=fA;fi<fB;fi++){ var vv=frames[fi*bins+k]; if(vv>roh) roh=vv; }
              var v=roh/255;
              var p5=p5arr[k],pM=pMarr[k],p95=p95arr[k];
              var nk;
              if(v<=p5)nk=0;
              else if(v<=pM)nk=(v-p5)/((pM-p5)||0.001)*0.50;
              else if(v<=p95)nk=0.50+(v-pM)/((p95-pM)||0.001)*0.50;
              else nk=1.0;
              if(nk>norm) norm=nk;
            }
            var idx=(row*bw+col)*4, r,g,b;
            if(norm<=0.50){var bv=Math.round(norm/0.50*128);r=bv;g=bv;b=bv;}
            else{var tt=(norm-0.50)/0.50;r=Math.round(128+tt*127);g=Math.round(128*(1-tt*0.65));b=Math.round(128*(1-tt));}
            data[idx]=r;data[idx+1]=g;data[idx+2]=b;data[idx+3]=255;
          }
        }
}

function stereoBildFuellen(data, bw, bh, o){
  var stereoFrames=o.stereoFrames, monoFrames=o.monoFrames, numFrames=o.numFrames,
      bins=o.bins, fftSize=o.fftSize, sr=o.sr, logMin=o.logMin, logMax=o.logMax,
      scale=o.scale;
        /* Die Frequenz je Bildzeile hängt nicht von der Spalte ab -
           einmal vorrechnen spart bw Wurzeln je Zeile. */
        var zb=baenderJeZeile(bh,bins,fftSize,sr,logMin,logMax);
        var kVon=zb.von, kBis=zb.bis;
        /* Auch hier zusammenfassen statt auswählen - und zwar über
           BEIDE Achsen. Maßgeblich ist die lauteste Stelle des
           Rechtecks, das eine Bildpunktzeile mal eine Bildpunktspalte
           abdeckt: ihre Seitenlage wird gezeigt. Die leiseren Stellen
           daneben sagen über die Störung nichts, und ein Mittelwert
           über Seitenlagen wäre ohnehin sinnlos - links und rechts
           heben sich darin auf. */
        for(var col=0;col<bw;col++){
          var fA=Math.floor(col/bw*numFrames);
          var fB=Math.max(fA+1, Math.floor((col+1)/bw*numFrames));
          if(fB>numFrames) fB=numFrames;
          for(var row=0;row<bh;row++){
            /* SEITENLAGE GEWICHTET, HELLIGKEIT ALS GROESSTWERT.

               Der erste Anlauf zeigte die Seitenlage der LAUTESTEN
               Stelle des Rechtecks - Sieger nimmt alles. Gemessen an
               "Koenigskinder": In den Daten stehen links zu rechts wie
               1,19 zu 1, im Bild wie 4,09 zu 1. Bei einem knappen
               Vorsprung kippte die ganze Zelle, und aus einer leichten
               Schieflage wurde eine deutliche. (Caspar_D: "ich sehe blau
               sowieso sehr unterrepraesentiert.")

               Jetzt zwei getrennte Fragen mit zwei getrennten Antworten:
               HELLIGKEIT fragt "ist hier ueberhaupt etwas?" und nimmt
               den Groesstwert - damit ueberlebt der kurze Knack, um den
               es beim Zusammenfassen ging. FARBE fragt "wo sitzt es?"
               und nimmt das mit der Amplitude gewichtete Mittel. Ein
               lautes Band bestimmt die Farbe also weiterhin, aber es
               loescht die anderen nicht aus. */
            var summeAmp=0, summeSeite=0, maxAmp=0;
            for(var k=kVon[row];k<kBis[row];k++){
              for(var fi=fA;fi<fB;fi++){
                var idx2=fi*bins+k;
                var a2=AMP[monoFrames[idx2]];
                summeAmp+=a2;
                summeSeite+=stereoFrames[idx2]*a2;
                if(a2>maxAmp) maxAmp=a2;
              }
            }
            var lr=summeAmp>0 ? (summeSeite/summeAmp)*scale/127 : 0;
            /* Zurueck auf die 0..1-Skala des Bytes, damit die Kennlinie
               unten dieselbe bleibt wie vorher. */
            var amp=maxAmp>0 ? (20*Math.log10(maxAmp)+80)/80 : 0;
            if(amp<0) amp=0; else if(amp>1) amp=1;
            var hell=Math.pow(Math.max(0,amp),0.4);
            var idx=(row*bw+col)*4, r,g,b;
            /* Die Hausfarben, nicht selbstgemischte Nachbarn:
               #f97b14 links, #4b93f0 rechts - dieselben wie im
               Stereopanorama, in der Stereospur und im gespiegelten
               Live-Spektrum. Vorher standen hier (255,140,0) und
               (0,80,255), also ein anderes Orange und ein anderes Blau.
               Vier Diagramme, die dasselbe meinen, muessen dieselbe
               Farbe tragen. */
            if(lr>0){var tt=Math.min(1,lr*1.5);
              r=Math.round(0xf9*tt*hell);g=Math.round(0x7b*tt*hell);b=Math.round(0x14*tt*hell);}
            else{var tt2=Math.min(1,-lr*1.5);
              r=Math.round(0x4b*tt2*hell);g=Math.round(0x93*tt2*hell);b=Math.round(0xf0*tt2*hell);}
            data[idx]=r;data[idx+1]=g;data[idx+2]=b;data[idx+3]=255;
          }
        }
}
