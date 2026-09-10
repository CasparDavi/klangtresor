# Tiefen-Check 10.09.2026: die Rohbefunde

Was fünf Leser beim Vergleich von Register und Maler fanden, jeder Befund von einem Skeptiker
geprüft. 61 von 66 hielten stand. Das Destillat steht in `docs/EFFEKTCLIP-REGELN.md`, die
Behebung in `docs/NAECHSTER_CHAT.md`. Diese Datei ist der Beleg, nicht die Anleitung.


## [hoch] einschlag / Stärke (über linse())  (tbs-modul.js:368-369, 471)
   CODE: cx.arc(x,y,r,0,7); cx.clip(); cx.globalAlpha=1;
  cx.translate(x,y); cx.scale(1.25,-1.25); cx.translate(-x,-y); cx.drawImage(kopie,0,0);  //  Aufruf: linse(cx,kopie,x,y,r,a*(1-0.5*dt/Math.max(1,e.bleiben)),e.farbe)
   FEHLER: Der Linsenkörper (gespiegelte, 1,25× vergrößerte Kopie) wird mit globalAlpha=1 gezeichnet, unabhängig von a. Stärke 0 lässt die Linsen voll stehen, nur Glanz/Kante/Rand verschwinden. Auch das 'Verlieren' greift nur an Glanz und Kante; der Körper bleibt bis dt=bleiben voll und springt dann weg (letzter Wert vor dem Schnitt: Alpha der Kante 0,5·a, Radius 65 %).

## [hoch] helligkeit / kontrast / saettigung / farbton / schaerfe (alle grund-Pulse) / Stapelung untereinander (Quelle jedes Pulses)  (tbs-modul.js:915-928)
   CODE: ca.filter=...; ca.globalCompositeOperation=VMODE[e.verr]||'source-over'; ca.globalAlpha=a; ca.drawImage(quell,qsx,qsy,qcw,qch,0,0,Wn,Hn);  (in jeder der fünf Schleifen; quell = Grundbild bzw. ovb, nie der bisherige Inhalt von ca)
   FEHLER: Jeder grund-Puls malt eine gefilterte Kopie des Grundbilds `quell` über ca, nicht des bisherigen Ergebnisses. Bei a=1 (Stärke·Schlag·Hub ≥ 1, mit Vorgaben schlag 1/Stärke 1 auf jedem Schlag) ersetzt z.B. helligkeit (Zeile 925, malt nach saettigung/kontrast) das ganze Bild durch die aufgehellte Original-Kopie — der Sättigungs-/Kontrast-Puls ist genau auf dem Schlag weg. Die Pulse verrechnen sich nicht, sie überschreiben sich; außerdem feste Reihenfolge schaerfe→kontrast→saettigung→helligkeit→farbton unabhängig von der Stapelposition.

## [hoch] kaustik / (Verrechnung/Stärke)  (tbs-modul.js:186, 609, 666)
   CODE: ['licht','laser','strahlen','kaustik','farbe','strobe','sicherung','bloom'].forEach(k=>{ if(EFFEKTE[k]) EFFEKTE[k].verr='abwedeln'; });  //  Shader: gl_FragColor=vec4(c.rgb+u_farbe*k, c.a);  //  postKette: dCx.drawImage(sCv,0,0); dCx.globalCompositeOperation=VMODE[e.verr]…; dCx.drawImage(ores,0,0);
   FEHLER: Der Shader liefert das GANZE Bild plus Lichtnetz (c.rgb+u_farbe*k), nicht nur das Licht. postKette legt dieses Vollbild mit color-dodge über das Quellbild: an Stellen ohne Kaustik (k=0) wird das Bild mit sich selbst abgewedelt (base/(1-base): Mittelgrau 0.5 wird 1.0). Ergebnis: Vorgabe-Kaustik brennt das ganze Bild aus, Stärke regelt nur, wie stark das Ausbrennen ist. Für gl-Typen muss die Verrechnung 'ueber' bleiben oder der Shader nur das Licht (schwarzer Grund) liefern.

## [hoch] licht, schatten (Vorlagen) / Vorlagen 'Kaum da' und 'Schatten und Schlag' mit alten Schlüsseln (groesse, weichheit, tempo, fuehrung, form, takt)  (tbs-modul.js:230, 235, 237, 1003-1005)
   CODE: function E(typ,over){ return Object.assign(neuerEffekt(typ), over||{}); }  /  E('schatten',{groesse:.5,weichheit:.9,staerke:.5,tempo:28,fuehrung:'bogen'})  /  E('licht',{...,form:'rund',groesse:.3,weichheit:.3,tempo:16,fuehrung:'bogen',takt:0})  /  Übersetzung nur in effektAusRezept: if((r.typ==='li
   FEHLER: E() legt die alten Schlüssel nur als tote Eigenschaften neben die Raum-/Antrieb-Vorgaben; die Übersetzung groesse→rmGroesse, weichheit→rmRand, fuehrung→rmBewegung, tempo→rmTempo, takt→lmQuelle läuft nur in effektAusRezept (Rezept-Import), nicht in E(). Die Vorlagen-Lichter laufen daher mit rmGroesse .3, rmRand .5, rmBewegung 'wandernd', rmTempo 16 und (bei licht/schatten) lmQuelle 'takt' – 'takt:0' wird ignoriert, die Scheinwerfer pulsen trotzdem.

## [hoch] tropfen / Stärke (über linse())  (tbs-modul.js:368-369, 478)
   CODE: cx.clip(); cx.globalAlpha=1; … cx.drawImage(kopie,0,0);  //  Aufruf: linse(cx,kopie,x,y,r,a,e.farbe)
   FEHLER: Wie bei einschlag: der Linsenkörper ignoriert a. Stärke wirkt nur auf Spur (0.16*a), Glanzgradient, Rand (0.45*a) und Glanzpunkt (0.85*a). Stärke 0 = Linsen bleiben sichtbar.

## [mittel] beschlag / dichte  (tbs-modul.js:450, 456, 461, 463, 465)
   CODE: if(p<=0||e.dichte<=0) return; … bc.fillStyle=rgba(e.farbe,0.55*e.dichte); … g.addColorStop(1,'rgba(0,0,0,'+Math.min(1,e.dichte*p+0.2)…); … fg.addColorStop(0,'rgba(0,0,0,'+(0.9*e.dichte*p)…); … cx.globalAlpha=a; cx.drawImage(e._bc,0,0);
   FEHLER: Dichte steuert die Maskendeckung (Rand- und Fleckenalpha) UND den Schleier; Stärke legt dieselbe Ebene noch einmal mit Alpha darüber. Beide wirken als Deckung des Beschlags. Zudem: dichte=0 schaltet per early return auch die Weichzeichnung ab — 'Milchglas' ohne hellen Schleier ist nicht einstellbar.

## [mittel] beschlag / rand  (tbs-modul.js:460-461)
   CODE: const innen=Math.max(0.05,1-p*e.rand); const g=mm.createRadialGradient(mw/2,mh/2,Math.min(mw,mh)*0.5*innen*0.6,mw/2,mh/2,Math.max(mw,mh)*0.75);
    g.addColorStop(0,'rgba(0,0,0,'+(0.15*p*(1-e.rand)).toFixed(3)+')'); g.addColorStop(1,'rgba(0,0,0,'+Math.min(1,e.dichte*p+0.2)…
   FEHLER: Bei rand=0 bleibt die Maske ein Radialverlauf mit Innenradius 14,4 (von 48×64) und Mittenalpha nur 0.15·p, Außenalpha dichte·p+0.2. Ein gleichmäßiger Beschlag (rand=0 = 'nicht vom Rand her') ist damit nicht erreichbar; die Mitte bleibt immer nahezu klar.

## [mittel] bloecke / farbversatz  (tbs-modul.js:659)
   CODE: if(e.farbversatz){ cres.globalCompositeOperation='screen'; cres.globalAlpha=0.6; cres.drawImage(srcCv,bx,by,bw,bh,bx-dx*0.6,by,bw,bh); …
   FEHLER: Es wird eine zweite, um -0.6·dx versetzte Kopie aller drei Kanäle mit screen aufgehellt eingeblendet — keine Kanaltrennung (vgl. rgb-Effekt mit Farbmasken). Ergebnis ist ein heller Doppelblock, kein Farbversatz.

## [mittel] dunst / dichte  (tbs-modul.js:621-622, 666)
   CODE: float d=clamp((f*0.5+0.5)*u_dichte*hoehe, 0.0, 1.0);
  gl_FragColor=vec4(mix(c.rgb,u_farbe,d), c.a);  //  postKette: globalAlpha=Math.min(1,e.staerke…)
   FEHLER: Dichte skaliert die Mischung zum Nebel, Stärke die Deckung derselben Mischung über dem Quellbild — beide sind Deckung des Nebels. Doppelung; Dichte>1 clippt lediglich früher auf Vollnebel.

## [mittel] farbton / schlag  (tbs-modul.js:927-928)
   CODE: const fb=pulsHub(e,t), a=Math.min(1,e.schlag*e.staerke*fb); ... ca.globalAlpha=a;
   FEHLER: schlag nur als Faktor neben Stärke in der Deckung — Doppelung.

## [mittel] flammen / Antrieb (lmQuelle/lmTiefe) – doppelte Wirkung  (tbs-modul.js:203, 595, 625, 666)
   CODE: ['flammen',{lmQuelle:'takt',lmTiefe:.5}]  /  Shader: float h=(v_uv.y-base)/max(0.05,u_hoehe*(1.0+0.5*u_takt));  /  postKette: dCx.globalAlpha=Math.min(1,e.staerke*(EFFEKTE[e.typ].params.some(p=>p.lm)?antriebWert(e,t):1));
   FEHLER: Der Antrieb wirkt zweimal: im Shader hebt u_takt die Flammenhöhe (wie beschrieben), zusätzlich senkt postKette die Deckung der ganzen Ebene mit antriebWert (mit Vorgabe lmTiefe .5 pendelt die Deckung zwischen 0,5·Stärke und 1·Stärke). Die Flammen werden im Takt also nicht nur höher, sondern zwischen den Schlägen halb durchsichtig – das verspricht die Beschreibung nicht.

## [mittel] helligkeit / wucht (neben Stärke)  (tbs-modul.js:925-926)
   CODE: const hb=pulsHub(e,t), a=Math.min(1,e.staerke*hb); ... ca.filter='brightness('+(e.invert?(1-0.6*e.wucht):(1+1.2*e.wucht)).toFixed(3)+')'; ... ca.globalAlpha=a;
   FEHLER: Aufgehellte Kopie wird mit Alpha a über das Original gelegt (source-over): Ergebnis-Helligkeit = 1 + a·1.2·wucht. Für Stärke ≤ 1 sind Stärke und Wucht ein Produkt, also zwei Regler für dieselbe Zahl. Bei invert entsprechend 1 − a·0.6·wucht.

## [mittel] kontrast / grad (Vorgabe v: modus 'sig', tonwert 0.55)  (tbs-modul.js:355, :350-352, :921-922)
   CODE: function gradInit(e){ if(!e.grad) e.grad={ v:{bp:0,wp:1,modus:'sig',tonwert:0.55}, ... } — function tpv(mode,tone){ return mode==='sig'?-tone*10:... } — levJS: if(tp>0){ sg=1/(1+exp(-k*(v-0.5))) ... } else { y=a+v*(bb-a); v=0.5+(1/k)*Math.log(y/(1-y)); }
   FEHLER: Mit der Vorgabe tonwert 0.55 wird tp=-5.5, also der Zweig tp<0 (Logit = inverse Sigmoide): die Kurve flacht ab. Nachgerechnet mit levJS: x=0.1→0.182, x=0.25→0.328, x=0.9→0.818. Auf den Schlag sinkt der Mittenkontrast, statt zu steigen. Erst tonwert negativ (wie im Preset 'Nur Atem', Zeile 236: tonwert:-1) gibt die S-Kurve (0.1→0.045, 0.9→0.955). Vorgabe widerspricht dem Namen.

## [mittel] kontrast / schlag  (tbs-modul.js:921)
   CODE: const kb=pulsHub(e,t), a=Math.min(1,e.schlag*e.staerke*kb); if(a<=0)continue; ... ca.globalAlpha=a;
   FEHLER: schlag kommt im Maler nur als Faktor im Produkt e.schlag*e.staerke*kb vor — dieselbe Größe wie Stärke (Deckung der gefilterten Kopie). Zwei Regler für eine Zahl.

## [mittel] licht, schatten / form, groesse, weichheit, tempo, fuehrung, takt (in PRESETS)  (tbs-modul.js:235, tbs-modul.js:237, tbs-modul.js:1046, tbs-modul.js:998, tbs-modul.js:1003)
   CODE: E('schatten',{groesse:.5,weichheit:.9,staerke:.5,tempo:28,fuehrung:'bogen'})  //  E('licht',{…,form:'rund',groesse:.3,weichheit:.3,tempo:16,fuehrung:'bogen',takt:0})  //  1046: STAPEL=PRESETS[n]();  //  Migration nur in effektAusRezept: if((r.typ==='licht'||r.typ==='schatten')&&r.rmForm==null){ … } 
   FEHLER: lichtMalen/raumZiel lesen nur rm*/lm*-Schlüssel. Die Presets gehen an effektAusRezept vorbei, und neuerEffekt setzt rmForm='kreis' und lmQuelle='takt' bereits, sodass die Übersetzung (r.rmForm==null / r.lmQuelle==null) nicht greift. Die Preset-Lichter laufen also mit Raum-Vorgaben (wandernd, 16 s, Größe .3, Rand .5) und Takt-Antrieb; takt:0 wird ignoriert.

## [mittel] licht, schatten / rmTraegheit  (tbs-modul.js:395-397, 706)
   CODE: fahrt: u=Math.min(1,(t/tp-k)/Math.max(0.05,1-tr));  schritt: u=Math.min(1,(t-S[a][0])/L/Math.max(0.03,tr*0.8));
   FEHLER: Vorzeichen widersprechen sich je Bewegung: bei 'fahrt' ist der Nenner 1-tr, also Trägheit 1 → Sprung in 5 % der Periode (schnell), Trägheit 0 → Gleiten über die ganze Periode (langsam); bei 'schritt' ist der Nenner tr*0.8, also Trägheit 1 → Gleiten über 80 % des Schlags (langsam), Trägheit 0 → Sprung in 3 % (schnell). Derselbe Regler bedeutet in 'Fahrt' das Gegenteil von 'Schritt'; 'Trägheit hoch = träge' stimmt nur bei 'Schritt'.

## [mittel] licht, schatten / rmHotspot  (tbs-modul.js:402-404, 426, 431)
   CODE: poolProfil: return Math.min(1.6, f*(1+hot*0.8*…));  poolGradient/kreis: rgba(farbe, Math.min(1,a*poolProfil(e,…)))  mit a=Math.min(1,e.staerke)*antriebWert(e,t)  /  Vorschau: const f=Math.min(1.6,poolProfil(e,…))/1.6;
   FEHLER: Der Hotspot hebt das Profil über 1 (bis 1,8, geklemmt 1,6), das Alpha wird aber auf 1 geklemmt. Bei Stärke 1 (oder Antrieb auf Spitze mit Stärke ≥1) ist das Plateau schon 1, der Hotspot also unsichtbar; er wirkt nur, solange a<1 (mit Vorgabe .7 sichtbar, bei 1 nicht). Die Profilvorschau (431) zeichnet den Buckel unabhängig davon immer.

## [mittel] linse / woelbung  (tbs-modul.js:611-612)
   CODE: vec2 warp(vec2 uv,float k){ vec2 c=uv-0.5; float r2=dot(c,c)*4.0; return 0.5+c*(1.0+k*r2); }
void main(){ float k=u_woelbung*0.5; …
   FEHLER: Inverse Abbildung: Ausgabepixel bei Radius c liest die Quelle bei c·(1+k·r2). k>0 liest am Rand weiter außen → Randinhalt wird gestaucht, Vergrößerung nimmt zum Rand ab = Tonne (Fischauge, mit schwarzen Ecken über inside). k<0 (Vorgabe) liest näher am Zentrum → Rand gedehnt = Kissen. Richtung ist gegenüber der Beschreibung vertauscht. Bei woelbung=-1 wird der Faktor in den Ecken (r2=2) 1-0.5·2=0: die Ecken zeigen den Bildmittelpunkt (Faltung).

## [mittel] linse / Stärke  (tbs-modul.js:666)
   CODE: dCx.drawImage(sCv,0,0); … dCx.globalAlpha=Math.min(1,e.staerke*…); dCx.drawImage(ores,0,0);
   FEHLER: u_staerke wird im Shader nicht gelesen; Stärke ist reine Deckung des verzerrten Bildes über dem unverzerrten. Bei Stärke<1 entsteht ein Doppelbild (zwei Geometrien überblendet), keine kleinere Wölbung. staerkeDef 1 verdeckt das nur in der Vorgabe.

## [mittel] nebel / dichte  (tbs-modul.js:515)
   CODE: const dichte=(e.dichte==null?0.7:e.dichte); if(dichte<=0) return; … a=Math.min(1,e.staerke)*Math.min(1,dichte/0.7);
   FEHLER: Doppelung: Dichte ist nur ein zweiter Alpha-Faktor neben Stärke. Zudem ist der Bereich 0,7..1 tot (dichte/0.7 wird bei 1 gekappt), also ein Drittel des Reglerwegs ohne Wirkung.

## [mittel] partikel / Stärke (Arten asche, blasen, staub, funken)  (tbs-modul.js:528, 533, 535, 536, 537, 539)
   CODE: const fc=farbeVon(i,a); cx.fillStyle=fc; cx.strokeStyle=fc;  … asche: cx.globalAlpha=a*(0.4+0.6*hs(i+4000)); … blasen: cx.globalAlpha=a*0.8; … cx.globalAlpha=a; … staub: cx.globalAlpha=a*(0.15+0.85*tief)*(…); … funken (else): cx.globalAlpha=a*(0.3+0.7*fl);
   FEHLER: farbeVon(i,a) legt a bereits in den Alphakanal der Farbe (rgba(...,al)); die vier Arten multiplizieren zusätzlich globalAlpha mit a → wirksame Deckung a². Schnee, Regen, Blätter wenden a nur einmal an. Bei staerkeDef .8 sind Asche/Funken faktisch bei 0,64, und der Regler läuft für diese Arten quadratisch statt linear.

## [mittel] rauschen / takt  (tbs-modul.js:121, 503, 291-292)
   CODE: besch:'… Auf Wunsch nur als Ausbruch auf der Eins.' … const bp=e.takt?Math.min(1,pulswert(t,7,0)):1 … function pulswert(t,abkling,nurEins){ … if(nurEins && S[i][1]!==1) continue; …
   FEHLER: pulswert wird mit nurEins=0 gerufen → Ausbruch auf jedem Schlag, nicht nur auf der Eins. Schaltertext stimmt mit dem Code, die Beschreibung nicht.

## [mittel] saettigung / schlag  (tbs-modul.js:923-924)
   CODE: const sb=pulsHub(e,t), a=Math.min(1,e.schlag*e.staerke*sb); ... ca.filter='saturate('+(e.invert?(1/Math.max(0.05,e.saettigung)):e.saettigung)+')'; ... ca.globalAlpha=a;
   FEHLER: Wie bei kontrast: schlag ist reiner Faktor neben e.staerke in der Deckung; identische Wirkung wie Stärke.

## [mittel] schaerfe / schlag  (tbs-modul.js:915-917)
   CODE: const hb=pulsHub(sch,t), a=Math.min(1,sch.schlag*sch.staerke*hb); ... ca.globalAlpha=a; ca.drawImage(quell,...)
   FEHLER: schlag nur als Faktor neben Stärke in der Deckung der scharfen (bzw. bei invert: weichen) Kopie — Doppelung.

## [mittel] schaerfe / (zweite Instanz)  (tbs-modul.js:914)
   CODE: const sch=STAPEL.find(e=>aktiv(e)&&e.typ==='schaerfe');
   FEHLER: Nur die erste aktive Schärfe-Instanz wird gezeichnet; jede weitere (Kopie/dup oder zweites Einhängen) ist stumm, ohne Hinweis. Alle anderen Pulse laufen über for(const e of STAPEL).

## [mittel] sicherung / tiefe  (tbs-modul.js:510-512)
   CODE: amt=e.tiefe*env(u)*zit; … amt*=Math.min(1,e.staerke);
   FEHLER: Doppelung: Tiefe und Stärke multiplizieren dieselbe Alpha des schwarzen Einbruchs.

## [mittel] spiegel / horizont  (tbs-modul.js:652)
   CODE: for(let y=Math.floor(hy);y<Hn;y+=band){ const sy=2*hy-y-band; if(sy<0) break; …
   FEHLER: Die Spiegelung braucht Quellzeilen bis 2·hy nach oben. Für horizont<0.5 ist die Quelle bei y=2·hy erschöpft (sy<0 → break); darunter bleibt das unveränderte Original mit harter Naht stehen. Bei horizont=0.3 sind die unteren 40 % ungespiegelt.

## [mittel] strobe / lmTiefe (Antrieb-Block „Tiefe“)  (tbs-modul.js:326, tbs-modul.js:565, tbs-modul.js:721)
   CODE: function lmSchub(e,t){ if((e.lmQuelle||'stetig')==='stetig') return 0; const tiefe=(e.lmTiefe==null?0.8:e.lmTiefe); return Math.max(0,Math.min(1,(antriebWert(e,t)-(1-tiefe))/Math.max(1e-3,tiefe))); }  //  antriebWert liefert (1-tiefe)+tiefe*f  →  Schub = f, unabhängig von tiefe  //  565: const ph=lm
   FEHLER: lmSchub rechnet die Tiefe wieder heraus, für strobe ist der Regler wirkungslos (jeder Wert >0 gibt dieselbe Welle). Bei Tiefe 0 ist antriebWert konstant 1, Schub 0, ph=-1 → bei Modus „dunkel“/„beides“ dauerhaft schwarzer Schleier mit amt statt „kein Flackern“.

## [mittel] strobe / lmQuelle = 'stetig'  (tbs-modul.js:326, tbs-modul.js:565-567)
   CODE: if((e.lmQuelle||'stetig')==='stetig') return 0;  …  const ph=lmSchub(e,t)*2-1 … else if((e.modus==='dunkel'||e.modus==='beides')&&ph<0){ cx.globalCompositeOperation='multiply'; … cx.fillStyle='rgba(0,0,0,'+(amt*(-ph))+')'; cx.fillRect(0,0,Wn,Hn); }
   FEHLER: Mit Antrieb „stetig“ ist ph dauerhaft -1: kein Flackern, sondern ein konstanter Abdunkel-Schleier (Modus dunkel/beides) bzw. gar nichts (Modus hell). Der Zweig ist über die Oberfläche erreichbar.

## [mittel] strobe / tiefe  (tbs-modul.js:565)
   CODE: const ph=lmSchub(e,t)*2-1, amt=e.tiefe*Math.min(1,e.staerke);
   FEHLER: Doppelung: Tiefe und Stärke werden multipliziert und steuern dieselbe Deckung des Blitzes/Abdunkelns. Zwei Regler, eine Wirkung.

## [mittel] strobe, flammen (alle lmSchub-Verbraucher) / lmTiefe  (tbs-modul.js:324, 326, 565, 595, 625, 721)
   CODE: antriebWert: return (1-tiefe)+tiefe*f;  lmSchub: return Math.max(0,Math.min(1,(antriebWert(e,t)-(1-tiefe))/Math.max(1e-3,tiefe)));  strobe: const ph=lmSchub(e,t)*2-1  /  u('u_takt',l=>gl.uniform1f(l, ...?lmSchub(e,t):0))  /  UI: data-k="lmTiefe" min="0" max="1"
   FEHLER: lmSchub rechnet die Tiefe wieder heraus: ((1-t)+t*f-(1-t))/t = f. Für Stroboskop (ph aus lmSchub) und Flammen (u_takt aus lmSchub) hat 'Tiefe' im Bereich 0,05..1 keinerlei Wirkung. Bei Tiefe=0 (Regler-Minimum) liefert antriebWert konstant 1, lmSchub also (1-1)/1e-3=0 → Strobe ph=-1 dauerhaft: bei Richtung 'abdunkeln'/'beides' wird das Bild ständig um amt abgedunkelt statt zu blitzen.

## [mittel] wellen / Stärke (staerkeDef .8)  (tbs-modul.js:145, 604-605, 666)
   CODE: staerkeDef:.8 …  vec2 d=…*u_amplitude*w; gl_FragColor=texture2D(u_tex, clamp(uv+d,0.0,1.0));  //  postKette: drawImage(sCv); globalAlpha=staerke; drawImage(ores)
   FEHLER: u_staerke wird nicht gelesen; Stärke ist Deckung. Mit der Vorgabe 0.8 liegt das verschobene Bild zu 80 % über dem unverschobenen — 20 % des Originals scheinen als stehendes Geisterbild durch. Die Verschiebung selbst regelt nur amplitude.

## [niedrig] alle Antriebstypen / lmVersatz bei Muster 'zufall'  (tbs-modul.js:322-323, 729)
   CODE: p=((p+(e.lmVersatz||0))%1+1)%1; e._lmPhase=p;  let f = aktiv ? (form==='zufall' ? lmHash(idx*7+e.id) : lmForm(form,p,e)) : …  /  UI: Versatz wird für jedes Muster gezeigt (Zeile 729 ohne Bedingung)
   FEHLER: Beim Muster 'Zufall je Periode' hängt f nur vom Periodenindex idx ab, nicht von der Phase p – der Versatz verschiebt nichts. Der Regler wird trotzdem angeboten.

## [niedrig] alle Antriebstypen / lmForm 'peak_an' vs 'rechteck' (Doppelung)  (tbs-modul.js:298, 310-311)
   CODE: case 'peak_an': return p<br?1:0; … case 'rechteck': return p<br?1:0;
   FEHLER: Beide Muster sind derselbe Code (Breite lmBreite = An-Anteil). Zwei Knöpfe, ein Verhalten; Ikonen (lmIkon) fallen entsprechend gleich aus.

## [niedrig] alle Antriebstypen (Quelle 'zufall') / lmAnteil – Ruhepegel inaktiver Schläge  (tbs-modul.js:321, 323, 310)
   CODE: if(q==='zufall') aktiv = lmHash(idx*3+e.id*31) < (e.lmAnteil==null?0.5:e.lmAnteil);  … : (form==='zufall'?0:lmForm(form,0.999,e));  /  case 'rampe_auf': return p;  case 'peak_aus': return p<br?0:1;
   FEHLER: Inaktive Schläge nehmen den Wert der Kurve am Periodenende (p=0,999). Bei 'rampe_auf' ist das ~1 (voll an), bei 'peak_aus' 1, bei 'sequenz' der letzte Schritt: die übersprungenen Schläge leuchten dann heller als der Anfang der aktiven. 'Rampe auf, dann aus' endet laut Beschriftung mit 'aus', der Code liefert 'an'.

## [niedrig] dunst / lage  (tbs-modul.js:621)
   CODE: float hoehe=pow(1.0-v_uv.y, mix(0.2,3.0,u_lage));
   FEHLER: Bei lage=0 bleibt der Exponent 0.2 — an der Oberkante (1-uv.y=0) ist der Nebel immer 0 und im oberen Bereich dünn. 0 bedeutet nicht 'überall gleich', nur 'weniger unten'.

## [niedrig] einschlag / bleiben  (tbs-modul.js:471)
   CODE: if(dt<e.bleiben){ const r=r0*(1-0.35*dt/Math.max(1,e.bleiben)); … linse(cx,kopie,x,y,r,a*(1-0.5*dt/Math.max(1,e.bleiben)),e.farbe); }
   FEHLER: Am Ende von bleiben steht die Kante noch bei 0.5·a und der Radius bei 65 %; dann wird nicht mehr gezeichnet — der Tropfen springt weg statt sich zu verlieren (zusätzlich zum unveränderten Linsenkörper, s. Stärke-Befund).

## [niedrig] fahrt / staerke / zoom  (tbs-modul.js:901-902, tbs-modul.js:753)
   CODE: const s=e.staerke; if(e.typ==='fahrt'){ crop*=(1-(1-e.zoom)*s); panx+=tri(t/e.tempo)*e.weite*s; …  //  Regler: min="0" max="1.5"
   FEHLER: Stärke ist hier nicht auf 1 gekappt: bei 150 % und Ausschnitt .5 wird crop 0,25, unter das Minimum des Ausschnitt-Reglers (erst eff=Math.max(.1,…) fängt es). Stärke dupliziert zudem den Zoom-Anteil von Ausschnitt.

## [niedrig] farbton / invert (neben winkel)  (tbs-modul.js:928, :176)
   CODE: ca.filter='hue-rotate('+((e.invert?-1:1)*e.winkel)+'deg)';  — winkel: min:-180,max:180
   FEHLER: invert kehrt nur das Vorzeichen von winkel um, was der Regler selbst schon kann (min −180). Bei den anderen Pulsen (helligkeit, puls, schaerfe, rgb) tauscht invert Ruhe- und Schlagzustand; hier ist derselbe Schalter eine Richtungsumkehr — doppelt zu winkel und eine andere Bedeutung als das gleichnamige Schalterwort.

## [niedrig] feuer / hoehe / Antrieb  (tbs-modul.js:548)
   CODE: const bp=0.5+0.5*antriebWert(e,t), baseY=Hn*e.boden, hoehe=e.hoehe*Hn*bp
   FEHLER: antriebWert ist ≤1, also bp ≤1: die Flammen erreichen nie mehr als „Höhe“, sie sinken zwischen den Schlägen und kehren zurück. „Höher“ als der Regler wird es nie.

## [niedrig] flammen / Antrieb (lm) / Stärke  (tbs-modul.js:203, 625, 666)
   CODE: ['flammen',{lmQuelle:'takt',lmTiefe:.5}] … float h=(v_uv.y-base)/max(0.05,u_hoehe*(1.0+0.5*u_takt)); … dCx.globalAlpha=Math.min(1,e.staerke*(…some(p=>p.lm)?antriebWert(e,t):1))
   FEHLER: Der Antrieb wirkt doppelt: im Shader auf die Höhe (u_takt) und in postKette auf die Deckung (antriebWert). Mit der Vorgabe lmTiefe .5 und staerke .8 pendelt die Deckung zwischen 0.4 und 0.8 — die Flammen werden im Takt nicht nur höher, sondern auch durchsichtiger, was die Beschreibung nicht sagt.

## [niedrig] kippen / neigung (Nachzoom)  (tbs-modul.js:913, :904)
   CODE: if(rotG){ ca.translate(Wn/2,Hn/2); ca.rotate(rotG*Math.PI/180); const z=1+Math.abs(rotG)*0.022; ca.scale(z,z); ... }  — rotG+=(e.invert?-1:1)*e.neigung*s*hb;
   FEHLER: Nötiger Deckungsfaktor bei Winkel θ und Seitenverhältnis r ist cosθ+r·sinθ. Code gibt 1+0.022·Grad. Bei r=1 reicht es (4°: 1.088 ≥ 1.067), bei 16:9 nicht (4°: 1.088 < 1.122; 12°: 1.264 < 1.348) — Ecken werden frei. Außerdem kann rotG durch s bis 1.5 und pulswert bis 1.5 (Zeile 293 Math.min(1.5,s)) bis 12·2.25=27° erreichen, nicht 'ein paar Grad'.

## [niedrig] korn / (Kornwerte / Verrechnung overlay)  (tbs-modul.js:171, 563, 565)
   CODE: verr:'overlay' … const v=110+Math.random()*90|0; d[i]=d[i+1]=d[i+2]=v; … cx.globalAlpha=a*0.7;
   FEHLER: Kornwerte 110..199 (Mittel ≈155/255 = 0.61). Overlay ist bei 0.5 neutral; das Korn liegt im Mittel über 0.5 und hellt die Mitteltöne systematisch auf (Vorgabe: Alpha 0.35). Kein reines Textur-Overlay, sondern leichte Aufhellung.

## [niedrig] laser / schwenk  (tbs-modul.js:117, tbs-modul.js:490-491)
   CODE: {k:'schwenk',lbl:'Schwenk',…,def:.5,when:e=>e.quelle==='fest'}  //  491: dir=Math.atan2(Hn/2-oy,Wn/2-ox)+Math.sin(t/e.tempo*1.3)*(e.schwenk||0.4);
   FEHLER: Im Modus „wandernd“ wird e.schwenk trotzdem gelesen (Vorgabe .5, Fallback .4 nur bei 0). Ein im Fest-Modus eingestellter Wert wirkt versteckt im Wander-Modus weiter.

## [niedrig] laser / tempo  (tbs-modul.js:490-491)
   CODE: dir=…+Math.sin(t/e.tempo)*e.schwenk;  //  wandern: const w=t/e.tempo*0.35+e.id; ox=Wn*(0.5+0.8*Math.sin(w));
   FEHLER: Kein Sekunden-Umlauf: Schwenkperiode ist 2π·tempo (fest, ~50 s bei 8), Wanderbahn 2π·tempo/0,35 (~144 s bei 8). Bei streifen/farbe dagegen ist Tempo (s) echt eine Periode.

## [niedrig] licht, schatten / rmHotspot  (tbs-modul.js:401-402, tbs-modul.js:427)
   CODE: f*(1+hot*0.8*Math.max(0,1-rho/Math.max(0.05,kern*0.6))*(rho<kern?1:0))  →  g.addColorStop(q, rgba(farbe, Math.min(1,a*poolProfil(e,Math.min(0.999,q)))))
   FEHLER: Der Hotspot hebt das Profil über 1 an, die Alpha wird aber bei 1 gekappt: mit Stärke ≥1 (Regler bis 1,5) und Antrieb auf Hochpegel ist der Regler unsichtbar.

## [niedrig] licht, schatten / rmBlWeich bei Blende 'wolken'  (tbs-modul.js:406, 409, 711)
   CODE: mk.filter=weich>0?('blur('+(weich*zelle*0.35).toFixed(1)+'px)'):'none';  … else if(art==='wolken'){ mk.filter='none'; …  /  UI: if((e.rmBlende||'keine')!=='keine') … rg('Blende weich','rmBlWeich',0,1,0.05)
   FEHLER: Bei 'Wolken' wird der Blur ausdrücklich abgeschaltet; der Regler ist dort tot, wird aber angezeigt.

## [niedrig] licht, schatten / rmBlGroesse bei Blende 'iris' und 'tor'  (tbs-modul.js:405-406, 412-413)
   CODE: const zelle=Math.max(2,(e.rmBlGroesse==null?0.15:e.rmBlGroesse)*r*2) … mk.filter=…blur(weich*zelle*0.35)  /  iris: mk.arc(0,0,r*0.9,0,7)  /  tor: mk.fillRect(-r*0.9*Math.sqrt(st)/1.2, …)
   FEHLER: Iris und Tor werden nur aus r (Fleckgröße) und rmStreckung gebaut; 'Blende Größe' geht dort nur noch als Faktor in die Weichheit (blur = weich·zelle·0,35) ein. Der Regler tut bei diesen beiden Blenden etwas anderes als beschriftet.

## [niedrig] licht, schatten / rmStreckung bei Blende 'tor' ohne Ellipse  (tbs-modul.js:413, 708)
   CODE: tor: const st=(e.rmStreckung==null?2:e.rmStreckung); mk.fillRect(-r*0.9*Math.sqrt(st)/1.2,-r*0.9/Math.sqrt(st)*1.2,…)  /  UI: if((e.rmForm||'kreis')==='ellipse') h+=rg('Streckung','rmStreckung',1,4,0.1)+…
   FEHLER: Die Torblende liest rmStreckung bei jeder Form; bei Kreis/Kegel ist der Wert (Vorgabe 2, also ein 2:1-Rechteck) nicht erreichbar, weil der Regler ausgeblendet ist.

## [niedrig] licht, schatten / rmBlende 'iris' bei Form 'ellipse'  (tbs-modul.js:412, 425)
   CODE: iris: mk.arc(0,0,r*0.9,0,7)  /  ellipse: rx=r*st; ry=r/Math.sqrt(st);
   FEHLER: Die Iris ist ein Kreis mit Radius 0,9·r; die Ellipse reicht bis r·st. Mit Streckung >1 schneidet die Iris (destination-in) die Längung der Ellipse ab – Streckung wird bei Iris wirkungslos.

## [niedrig] licht, schatten / rmUrsprung/rmWinkel/rmUx/rmUy bei Form 'kreis' ohne Schwenk und ohne Blende  (tbs-modul.js:416, 421, 424-426, 394, 405, 702-703)
   CODE: const O=raumUrsprung(e,W,H), … rot=Math.atan2(Z[1]-O[1],Z[0]-O[0]);  kreis-Zweig: x.translate(Z[0],Z[1]); let rx=r, ry=r, off=0; … (weder O noch rot verwendet)  /  O nur in kegel (421), schwenk (394); rot nur in ellipse (425) und blendeMaske (405)
   FEHLER: Bei Kreis + Bewegung ≠ Schwenk + Blende 'keine' (die Vorgabe: kreis/wandernd/keine) ändert der Ursprung nichts am Bild; nur der weiße Punkt in der Vorschau (441) wandert.

## [niedrig] licht, schatten / rmBewegung 'schritt' hängt an lmQuelle  (tbs-modul.js:397, 195)
   CODE: if(e.lmQuelle==='eins') while(a>0&&S[a][1]!==1) a--; k=a;  /  RM_BEWEGUNG: ['schritt','Schritt auf den Schlag']
   FEHLER: Steht der Antrieb auf 'auf der Eins', springt auch der Raum nur auf der Eins – die Beschriftung nennt den Schlag, und die Kopplung an den Antrieb ist nirgends genannt.

## [niedrig] licht, schatten / rmBlGroesse Minimum 0,02 (Bereich)  (tbs-modul.js:405, 407-408, 711)
   CODE: const zelle=Math.max(2,(…rmBlGroesse)*r*2) … const n=Math.ceil(R/zelle)+1; if(art==='punkte'){ for(let i=-n;i<=n;i++) for(let j=-n;j<=n;j++){ mk.beginPath(); mk.arc(…); mk.fill(); } }  /  UI min="0.02"
   FEHLER: Am Minimum wird die Zelle winzig: bei 1920×1080, Größe .3 → r=324, zelle≈13 px, n=171, also 343²≈117 000 Kreise je Frame, jeweils mit blur-Filter (Punkte) bzw. 343 Linienpaare (Gitter). Der Bereich lässt einen Wert zu, der die Bühne zum Stehen bringt.

## [niedrig] nachzieh / nachhall  (tbs-modul.js:647-650)
   CODE: cres.globalAlpha=e.nachhall; cres.drawImage(e._spur,Math.cos(rad)*d,Math.sin(rad)*d); cres.globalAlpha=1-e.nachhall; cres.drawImage(srcCv,0,0); cres.globalAlpha=1; … sp.drawImage(ores,0,0);
   FEHLER: Beide Züge gehen mit source-over auf eine geleerte Fläche: der Geist wiegt n·n statt n, das Ergebnis hat Alpha (1−n)+n² < 1 (bei .85: .87) und wird so in _spur gespeichert, wodurch die Spur pro Bild schneller ausblutet als der Regler verspricht. Richtung (höher = länger) stimmt.

## [niedrig] rgb / nurEins (fehlt)  (tbs-modul.js:127-128, :344, :642)
   CODE: params:[{k:'versatz'...},{k:'winkel'...},{k:'abkling'...}]  — function pulsHub(e,t){ ... pulswert(t,e.abkling,e.nurEins); }  — const bp=pulsHub(e,t)
   FEHLER: rgb ist der einzige Puls ohne nurEins; pulsHub liest e.nurEins=undefined → immer jeder Schlag. Kein Fehler im Bild, aber der Zweig nurEins ist für rgb unerreichbar.

## [niedrig] rgb / invert bei Doppelschlägen  (tbs-modul.js:642, :293)
   CODE: const bp=pulsHub(e,t), hub=(e.invert?1-bp:bp), d=e.versatz*Wn*hub  — return Math.min(1.5,s);
   FEHLER: pulswert summiert Schläge bis 1.5; bei invert wird hub=1-bp negativ (bis −0.5), der Versatz springt kurz in die Gegenrichtung statt auf 0 zu ruhen.

## [niedrig] strahlen / breite  (tbs-modul.js:556, 558-559)
   CODE: br=e.breite*Math.PI/180; … w=br*(0.6+0.8*hs(i+30)); … cx.lineTo(px+Math.cos(ang-w)*L,…); cx.lineTo(px+Math.cos(ang+w)*L,…);
   FEHLER: w ist der halbe Öffnungswinkel; der Strahl ist ang-w..ang+w breit, also 2·breite·(0.6..1.4)° = bis zu 2,8× der angezeigten Gradzahl.

## [niedrig] streifen / (Maler gesamt)  (tbs-modul.js:497-501)
   CODE: grad.addColorStop(0,'rgba(255,255,255,0)'); grad.addColorStop(0.5,'rgba(255,255,255,'+Math.min(1,e.staerke)+')'); grad.addColorStop(1,'rgba(255,255,255,0)');
   FEHLER: Es werden nur weiße Bänder gemalt (Verrechnung screen). Dunkle Bänder entstehen nur, wenn der Nutzer die Verrechnung auf Abdunkeln stellt – die Karte bietet dafür keinen Parameter.

## [niedrig] strobe / verr (Verrechnung)  (tbs-modul.js:566-567)
   CODE: if((e.modus==='hell'||e.modus==='beides')&&ph>=0){ cx.globalCompositeOperation=VMODE[e.verr]||'lighter'; … } else if((e.modus==='dunkel'||e.modus==='beides')&&ph<0){ cx.globalCompositeOperation='multiply'; …
   FEHLER: Die gewählte Verrechnung wirkt nur auf den Aufblitz-Zweig; das Abdunkeln ist fest auf multiply.

## [niedrig] vlauf, wackeln, rauschen, scanlines, bloom, nachzieh, partikel / Stärke (Regler 1,0..1,5)  (tbs-modul.js:753, 504, 526, 540, 666)
   CODE: <input type="range" data-staerke="1" min="0" max="1.5" … > … cx.globalAlpha=(0.25+0.75*v)*Math.min(1,e.staerke) … a=Math.min(1,e.staerke) … dCx.globalAlpha=Math.min(1,e.staerke*(…))
   FEHLER: Alle sieben Typen klemmen bei Math.min(1,…); das obere Drittel des Reglers (100–150 %) ist für diese Gruppe wirkungslos.

## [niedrig] wackeln / takt  (tbs-modul.js:125-126, 640-641)
   CODE: besch:'Zeilen verschieben sich seitlich (Band-Warble), oder das ganze Bild kickt im Takt.' … {k:'takt',tog:'Kick im Takt',def:1} … const bp=e.takt?Math.min(1,pulswert(t,7,0)):1, amp=e.amplitude*Wn*bp … dx=Math.sin(t*e.tempo+i*1.3)*amp+(Math.random()-.5)*amp*0.4*bp
   FEHLER: Kein Ganzbild-Kick: takt skaliert nur die Amplitude des Band-Warbles, jede Zeile behält ihre eigene Phase i*1.3. Zudem enthält amp schon bp, das Zufallszittern multipliziert nochmals mit bp (bp²). Und da def:1 und pulswert bei leerem DATA.schlaege 0 liefert, ist der Effekt in der Vorgabe ohne Schlagdaten unsichtbar.

--- verworfen: kippen/invert, bloom/glut, bloom/schwelle, flammen/boden, linse/farbrand

=== Stärke-Notizen
- helligkeit: Zeile 925: a=Math.min(1,e.staerke*hb) ist die Deckung der brightness()-Kopie; Stärke > 1 wirkt nur noch, wenn hb < 1 (Kopfraum).  || DOPPELUNG: Ja: wucht — Ergebnis 1+a·1.2·wucht, Stärke und Wucht sind ein Produkt.
- puls: Zeile 903: z=e.wucht*s*hb, scaleMul*=(1+z) — Stärke ist Multiplikator der Zoomtiefe, keine Deckung.  || DOPPELUNG: Ja: wucht — reines Produkt wucht·Stärke.
- schaerfe: Zeile 915: a=Math.min(1,sch.schlag*sch.staerke*hb) — Deckung der scharfen (invert: weichen) Kopie über der weichen Grundlage.  || DOPPELUNG: Ja: schlag — reines Produkt.
- kontrast: Zeile 921: a=Math.min(1,e.schlag*e.staerke*kb) — Deckung der Kurven-Kopie (feComponentTransfer) über dem Bild.  || DOPPELUNG: Ja: schlag — reines Produkt.
- saettigung: Zeile 923: a=Math.min(1,e.schlag*e.staerke*sb) — Deckung der saturate()-Kopie; die Höhe des Ausschlags kommt aus dem Regler saettigung.  || DOPPELUNG: Ja: schlag — reines Produkt (saettigung selbst ist eine andere Größe).
- rgb: Zeile 666 (postKette): dCx.globalAlpha=Math.min(1,e.staerke*1) — Deckung des kanalversetzten Kompositums über dem unversetzten Bild; versatz setzt die Distanz.  || DOPPELUNG: Nein im strengen Sinn (Deckung vs. Distanz); Stärke > 1 wird durch Math.min(1,…) gekappt und ist wirkungslos.
- farbton: Zeile 927: a=Math.min(1,e.schlag*e.staerke*fb) — Deckung der hue-rotate()-Kopie; winkel ist die Drehung.  || DOPPELUNG: Ja: schlag — reines Produkt.
- kippen: Zeile 904: rotG+=(e.invert?-1:1)*e.neigung*s*hb — Stärke ist Multiplikator des Winkels, keine Deckung.  || DOPPELUNG: Ja: neigung — reines Produkt neigung·Stärke.
- strobe: amt=e.tiefe*Math.min(1,e.staerke) (Zeile 565): Stärke ist Alpha des Blitz-/Abdunkel-Rechtecks, über 1 ohne Wirkung.  || DOPPELUNG: Ja – „Tiefe“ multipliziert dieselbe Alpha.
- sicherung: amt*=Math.min(1,e.staerke) (Zeile 512): Stärke skaliert die Alpha des schwarzen Einbruchs.  || DOPPELUNG: Ja – „Tiefe“ ist derselbe Faktor (Zeile 510/511).
- fahrt: s=e.staerke (Zeile 901) skaliert Zoom-Anteil und Pan-Weite gemeinsam, ungekappt bis 1,5.  || DOPPELUNG: Teilweise – Ausschnitt regelt denselben Zoom, Stärke skaliert ihn nochmals.
- streifen: Alpha der weißen Bandmitte Math.min(1,e.staerke) (Zeile 500).  || DOPPELUNG: Nein.
- licht: a=Math.min(1,e.staerke)*antriebWert(e,t) (Zeile 416): Deckung des Flecks/Kegels, mit Antrieb multipliziert.  || DOPPELUNG: Nein (kein Deckungsregler im Raum-Block; Hotspot hebt nur das Profil, wird aber bei Alpha 1 gekappt).
- schatten: identisch licht: a=Math.min(1,e.staerke)*antriebWert (Zeile 416), multiply mit der Schattenfarbe.  || DOPPELUNG: Nein.
- laser: rgba(e.farbe,e.staerke*bp) (Zeile 494/495): Alpha von Strahlen und Quellpunkt, rgba kappt bei 1.  || DOPPELUNG: Nein (Flimmern moduliert zeitlich, nicht als zweite Deckung).
- farbe: cx.globalAlpha=Math.min(1,e.staerke) (Zeile 482): Deckung des Vollbild-Farbschleiers.  || DOPPELUNG: Nein.
- nebel: a=Math.min(1,e.staerke)*Math.min(1,dichte/0.7) (Zeile 515): Alpha jeder Schwade.  || DOPPELUNG: Ja – „Dichte“ ist ein zweiter Alpha-Faktor, oberhalb 0,7 tot.
- feuer: a=Math.min(1,e.staerke) (Zeile 546): Alpha der Zungen (al=a*pow(1-h,1.4)*0.55) und der Glut (0.35*e.glut*a).  || DOPPELUNG: Nein – Glut betrifft nur den Basisstreifen, Dichte ist die Zungenzahl (5..60), keine Deckung.
- vlauf: Deckung des gerollten Bildes über dem stehenden Quellbild (postKette 666: dCx.globalAlpha=Math.min(1,e.staerke), verr 'ueber' → source-over); kein staerkeDef, Vorgabe 1; unter 1 entsteht ein Doppelbild aus stehend und rollend.  || DOPPELUNG: keine — Tempo, Richtung, Riss-Band und Ruck steuern Bewegung/Geometrie, nicht Deckung.
- wackeln: Deckung des verschobenen Bildes über dem Original (postKette 666); Vorgabe 1; unter 1 Geisterbild statt weniger Wackeln.  || DOPPELUNG: keine — Amplitude ist Weg in Bildbreiten (640: amp=e.amplitude*Wn*bp), keine Deckung.
- rauschen: Alpha jedes Korns (504: (0.25+0.75*v)*Math.min(1,e.staerke)) und jedes Dropout-Strichs (506: Math.min(1,e.staerke)*(0.5+0.5*Math.random())).  || DOPPELUNG: keine — Körnung und Dropout-Striche steuern die Anzahl (503: K=…e.koernung…, 505: D=…e.ausfall*bp*26), nicht die Deckung.
- scanlines: a=Math.min(1,e.staerke) multipliziert alle drei Teile: Linien (542: e.linien*a), Vignette (543: e.vignette*a), Flimmern (544: e.flimmern*a*0.35*…); Stärke allein bewirkt nichts, wenn die drei Teilregler 0 sind.  || DOPPELUNG: keine echte — Linien/Vignette/Flimmern sind Teil-Deckungen je Komponente, Stärke der gemeinsame Faktor.
- bloom: Deckung des geblurrten, aufgehellten Bildes im color-dodge-Kompositum, mal Antrieb (666: Math.min(1,e.staerke*antriebWert(e,t)); lm-Parameter per 203).  || DOPPELUNG: ja — Glut (661: brightness(e.glut)) ist ein zweiter Intensitätsregler auf derselben Quelle; siehe Befund.
- nachzieh: Deckung des Rückkopplungsbildes (Geist+Original) über dem Original (666); staerkeDef .5 → halbes Mischen.  || DOPPELUNG: teilweise — Nachhall (649) ist der Rückkopplungsgrad über die Zeit; beide Regler mindern die Sichtbarkeit des Geists, aber auf verschiedenen Achsen (Mischung vs. Abklingzeit).
- partikel: Alpha jedes Teilchens über die Farbe (528: farbeVon(i,a) mit a=Math.min(1,e.staerke)); bei asche/blasen/staub/funken zusätzlich als globalAlpha → quadratisch (siehe Befund).  || DOPPELUNG: kein zweiter Deckungsregler — Anzahl, Größe, Tempo, Wind, Böen sind Geometrie/Bewegung; Farbheterogenität mischt nur Farbe→Farbe bis.
- wellen: u_staerke wird im Shader nicht gelesen (tbs-modul.js:601-605); Stärke ist allein die Deckung des verschobenen Bildes über dem unverschobenen in postKette (666) — bei <1 Geisterbild, Vorgabe .8.  || DOPPELUNG: keine (amplitude ist die echte Verschiebung, nicht Deckung)
- kaustik: Deckung in postKette (666), zusätzlich mit antriebWert (lm-Params, 203) multipliziert; im Shader ungenutzt. Wegen verr='abwedeln' (186) regelt Stärke faktisch das Ausbrennen des ganzen Bildes.  || DOPPELUNG: keine zweite Deckung; schaerfe/farbe formen nur das Netz
- linse: Deckung des verzerrten über dem unverzerrten Bild (666); Shader liest u_staerke nicht — Stärke<1 gibt Doppelbild, nicht weniger Wölbung.  || DOPPELUNG: keine
- dunst: Deckung der Nebelmischung in postKette (666); Shader mischt bereits per dichte (621-622).  || DOPPELUNG: dichte (0..2) skaliert dieselbe Nebeldeckung — Doppelung
- flammen: Deckung in postKette (666) mal antriebWert (lm, 203); u_staerke im Shader ungenutzt; u_takt geht separat auf die Höhe (625).  || DOPPELUNG: glut ist keine Deckung (nur Zusatzglühen im unteren Drittel, 629); Antrieb wirkt aber doppelt (Höhe + Deckung)
- strahlen: a=Math.min(1,e.staerke)*antriebWert(e,t) (555) → Alpha des Radialverlaufs 0.55·a (559), Verrechnung color-dodge (186).  || DOPPELUNG: keine
- spiegel: Deckung des gespiegelten Bildes über dem Original (666); bei <1 scheint das ungespiegelte Unterteil durch. verblassen (653) ist eine Schwarzabdunklung nach unten, keine Deckung.  || DOPPELUNG: keine
- korn: cx.globalAlpha=a*0.7 (565) mit overlay; Stärke ist die Alpha des Kornmusters.  || DOPPELUNG: keine
- bloecke: Deckung des Blockbildes über dem Original (666); staerkeDef 1, bei <1 schimmert das ungestörte Bild in den Blöcken durch.  || DOPPELUNG: keine
- risse: a=Math.min(1,e.staerke) (443); Schattenkante 0.55·a, Lichtkante 0.9·a (449).  || DOPPELUNG: keine (breite ist Linienbreite)
- beschlag: cx.globalAlpha=a beim Auflegen der maskierten Weich-/Schleierkopie (465).  || DOPPELUNG: dichte steuert Maskendeckung und Schleieralpha (456, 461, 463) — zweite Deckung
- einschlag: a nur auf Ring (0.6·a, 470) und Glanz/Kante/Glanzpunkt der Linse (370-373); Linsenkörper bleibt globalAlpha=1 (368-369).  || DOPPELUNG: keine zweite Deckung, aber Stärke greift nicht am Körper
- tropfen: a auf Spur (0.16·a, 477) und Glanz/Kante der Linse (370-373); Linsenkörper immer voll (368-369).  || DOPPELUNG: keine zweite Deckung, aber Stärke greift nicht am Körper
- licht: tbs-modul.js:416 `const a=Math.min(1,e.staerke)*antriebWert(e,t)` – Stärke (auf 1 geklemmt) ist das Alpha des Farbverlaufs, multipliziert mit dem Antriebspegel.  || DOPPELUNG: Kein eigener Deckungsregler; aber lmTiefe senkt a im Takt und rmHotspot hebt die Mitte auf min(1,a·1,6) (Zeile 403/426) – beides ändert die sichtbare Deckung.
- schatten: tbs-modul.js:416 wie licht: `a=Math.min(1,e.staerke)*antriebWert(e,t)`, als Alpha von Schwarz im Multiply – Stärke = Tiefe der Abdunklung.  || DOPPELUNG: Wie licht: lmTiefe und rmHotspot verändern dieselbe Deckung, kein zweiter expliziter Regler.
- laser: tbs-modul.js:484, 494, 496 `bp=antriebWert(e,t)*fl` und `rgba(e.farbe,e.staerke*bp)` – Stärke ist das Alpha am Strahlansatz und des Quellpunkts, ungeklemmt (rgba() klemmt erst in Zeile 347).  || DOPPELUNG: 'Flimmern' (fl) multipliziert dasselbe Alpha (484); kein weiterer Deckungsregler.
- strahlen: tbs-modul.js:555 `a=Math.min(1,e.staerke)*antriebWert(e,t)` – Stärke als Alpha der Lichtschächte, mit Antrieb multipliziert.  || DOPPELUNG: Keine.
- feuer: tbs-modul.js:546, 549, 551 `a=Math.min(1,e.staerke)`; Glut-Alpha `0.35*e.glut*a`, Zungen-Alpha `al=a*Math.pow(1-h,1.4)*0.55`; Antrieb wirkt nicht auf a, sondern auf die Höhe `bp=0.5+0.5*antriebWert` (548).  || DOPPELUNG: 'glut' ist kein Duplikat (eigener Sockel-Verlauf), aber ein zweites Alpha-Produkt mit a.
- flammen: tbs-modul.js:594, 666 u_staerke=min(1,staerke) an den Shader und zusätzlich `dCx.globalAlpha=Math.min(1,e.staerke*antriebWert(e,t))` in postKette – Stärke ist die Deckung des Kompositums, zusätzlich als Uniform verfügbar.  || DOPPELUNG: Der Antrieb (lmTiefe) moduliert dieselbe Deckung und zugleich u_takt die Höhe (Befund oben); Stärke steckt doppelt drin, falls der Shader u_staerke nutzt (in 623-630 nicht sichtbar).
- kaustik: tbs-modul.js:606-609 der Shader liest weder u_staerke noch u_takt; Stärke wirkt allein als `dCx.globalAlpha=Math.min(1,e.staerke*antriebWert(e,t))` in postKette (666).  || DOPPELUNG: Antrieb (lmTiefe) moduliert dieselbe Deckung; kein zweiter Regler.
- bloom: tbs-modul.js:661, 666 Deckung des geblurten Bildes im Screen: `dCx.globalAlpha=Math.min(1,e.staerke*antriebWert(e,t))`.  || DOPPELUNG: 'glut' = `brightness('+e.glut+')` im Filter (661) hellt dieselbe Ebene auf – Stärke und Glut heben beide das Glühen, Glut nur nicht über die Deckung.
- strobe: tbs-modul.js:565 `amt=e.tiefe*Math.min(1,e.staerke)` – Stärke und der Typ-Regler 'tiefe' werden schlicht multipliziert und ergeben zusammen das Alpha des Blitzes/der Abdunklung (`rgba(e.farbe,amt*ph)` bzw. `rgba(0,0,0,amt*(-ph))`).  || DOPPELUNG: Ja: 'tiefe' (Registry 130, 0..1, Vorgabe .5) tut exakt dasselbe wie Stärke; dazu ist lmTiefe für strobe wirkungslos (Befund oben).
