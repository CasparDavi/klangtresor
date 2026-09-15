# Loop-Befund (Code-Lesung 14.09.2026, gegengeprüft) — Arbeitsgrundlage für die Reparatur

Zeilennummern beziehen sich auf web/index.html am Stand bdbb44c.

## Gemeinsame Zeitmaschinerie

Befund: gemeinsame Zeitmaschinerie des Effektclip-Exports (web/index.html)

**1. lpR / lpP / lpW / lpV (Z. 27473–27477)**

- **Die Periode geht auf.** Alle vier teilen L:
  - lpR ergibt k/L. Die Phase t·k/L wächst über L um genau k.
  - lpP ergibt L/m. t/lpP wächst um m.
  - lpW ist 2π·lpR.
  - lpV ergibt m·weite/L. Der Weg über L ist m·weite, also Null modulo weite.
  - Die Bildzeiten sind sauber: L wird auf ganze Bilder gerundet (29075, 29078), N=Math.round(L·30) (29160), gemalt wird t0+i/30 (29140) bzw. t0+(i%N)/30 (29209).
- **Die Vorschau ändert sich nicht**, weil dort LOOP=0 gilt. Der Export weicht aber von der Vorschau ab, und zwar deutlich stärker, als der Kommentar in 27471f behauptet („hoechstens ein Prozent schneller"). Das stimmt nicht:
  - Das Raster ist 1/L. L ist höchstens 10 s und kann bis knapp über 5 s sinken: `takte=Math.max(1,Math.floor(MAX_SEK/takt))` ergibt bei einem Takt von 5,1 s nur einen Takt, also L=5,1 s.
  - Die relative Abweichung liegt bis zu ±50 %. Beispiele bei L=10 s: lmHz 0,05 wird 0,1. Die Periode 18 s (fahrt) wird 10 s. Die Periode 40 s wird 10 s.
- **`Math.max(1,…)` ist ein Fehler in allen vier Helfern.**
  - **Rundung auf 0:** Eine Rate, die auf 0 runden würde, wird auf 1/L hochgesetzt. Ein Stillstand wird so zu einem vollen Umlauf je Clip.
  - **Negative Werte:** `Math.max(1, negativ)` ergibt 1, das Vorzeichen kippt also.
  - **Folge Seitenwind (sichtbar):** Partikel rechnen `lpV(w*Hn*0.05,Wn)*t` mit `w=e.wind` im Bereich −1…1 (27217, 28128, 28173–28235). Wind nach links fliegt im Export nach rechts. Wind 0 wird zu einer Drift von einer Bildbreite je Clip. Wind 0,1 wird etwa 20-mal schneller.
  - Die senkrechte Richtung wurde dafür schon repariert (28136–28141: Betrag in lpV, Vorzeichen davor), die waagerechte nicht.
  - **Folge Geschwindigkeitsvielfalt:** Langsame Teilchen runden alle auf m=1. Beispiele Staub/Glühwürmchen: v·L/Hn ≈ 0,12·sp·tempo wird 1, also etwa 8-mal schneller. Schnee: 0,6·sp wird für alle 1, jede Flocke fällt gleich schnell.
- **Kleinste Reparatur:**
  - lpR/lpV: `k=Math.round(r*LOOP)` ohne max(1); 0 ist eine gültige Periode (Stillstand).
  - lpP: `m=Math.round(LOOP/p)`; bei m=0 zurückgeben, dass sich nichts bewegt (∞), oder am Aufrufer auf t/∞=0 prüfen.
  - Vorzeichen: `Math.sign(v)*…` im Helfer.
  - Die Vorschau bleibt davon unberührt. Der Export wird der Vorschau ähnlicher: langsame Drift steht dann statt zu rasen.

**2. antriebWert (27542–27580)**

- **stetig:** exakt (return 1).
- **hz** (27544): `hz=lpR(max(0.1,lmHz||4))`, p=frac(t·hz). Für alle Formen ausser Flackern ist das exakt: rampe_auf, rampe_ab, peak_an, peak_aus, rechteck, sinus, sequenz hängen nur an p (27536–27540).
  - Nebenbefund: Hier wird auf 0,1 geklemmt, im Rückfall (27556) und im Regler (28652) auf 0,05. Werte unter 0,1 laufen damit schon in der Vorschau falsch.
- **Rückfall ohne Schläge** (27555f): `hz=lpR(max(0.05,lmHz/n))` mit n=4 bei eins. Für p-Formen exakt.
- **takt, Teiler ≥ 1** (27569f): `a=i-(i%n)`, gruppiert nach ARRAY-Index i des Rasters.
  - Exakt nur, wenn n die Schlagzahl des Clips teilt, also `(takte*proTakt) % n === 0`.
  - **Sonst bricht es.** Teiler 2, 4, 8 sind wählbar (28650). Beispiele:
    - proTakt 4, ungerade Taktzahl (Takt 1,8 s → 5 Takte → 20 Schläge) mit „jeder 8. Schlag"
    - 3/4-Takt mit „jeder 2. Schlag" bei ungerader Taktzahl
  - **Reparatur:** In ausschnitt() takte so wählen, dass takte·proTakt durch 8 teilbar ist (L wird dann eventuell kürzer). Alternativ in antriebWert im Loop `a` relativ zum Clipanfang modulo n zählen. Die Vorschau bleibt gleich.
  - Nebenbei: Welcher Schlag „jeder 4." ist, hängt am Array-Index. Export (Raster ab j=−2·proTakt) und Vorschau (Songindex) können deshalb auf verschiedene Schläge fallen. Das ist keine Naht, aber ein anderer Inhalt.
- **eins** (27569): Grenzen über `S[a][1]===1`, im Raster periodisch mit dem Takt. Für p-Formen exakt.
- **Teiler < 1** (27565–27568): `schritt` ist im Raster konstant, p periodisch. Für p-Formen exakt.
- **lmVersatz** (27577): konstanter Summand auf p. Exakt.
- **zufall** (27571): `aktiv=lmHash(idx*3+e.id*31)`, mit idx = Schlag-Array-Index (bzw. idx=i·k+j). idx läuft NICHT um, die Auswahl bei t0+L ist eine andere als bei t0.
  - Die Naht liegt aber exakt auf einer Schlag- bzw. Teilschlaggrenze, weil t0+L auf dem Raster liegt. Jeder Schlag wird unabhängig gewählt, der Übergang vom letzten zum ersten ist also ein gewöhnlicher Schlagwechsel. Urteil: unsichtbare Naht (nicht bitgleich).
  - Das gilt nur zusammen mit der Teilbarkeit oben.
  - **Ausnahme, bricht:** Titel ohne Schläge, Quelle zufall. Dann gilt idx=floor(t·hz) (27556). t0 ist dort `jetzt`, nicht auf einer Periodengrenze, die Naht liegt also mitten im Puls: Rechteck oder Rampe springen an/aus.
  - Reparatur: `idx mod K` mit K=lpR(hz)·L im Loop. Die Vorschau bleibt gleich.
- **flackern** (27579): `lmFlacker(e.id*37+11, idx+p)`. Wertrauschen auf u·3, u·6,9, u·15,87 (27531–27535). Weder Gitter noch Index laufen um.
  - **hz und Teiler 1 bei takt, auch Teiler < 1:** u ist in der Vorschau stetig, an der Naht springt es um K. Das ist ein Helligkeitssprung in allen drei Oktaven.
    - Unsichtbar nur bei schneller Periode: ab etwa hz ≥ 3 ist eine Gitterzelle der langsamen Oktave höchstens 3 Bilder lang.
    - Bei langsamer Periode (Kerze mit lmHz 0,5, jeder 8. Schlag) bricht es.
  - **eins und Teiler > 1:** idx=a springt schon in der Vorschau an jeder Gruppengrenze um n bzw. proTakt, dort ist das Rauschen ohnehin unstetig. Die Naht fällt auf so eine Grenze, also unsichtbare Naht.
    - Nebenbefund: Das Flackern ruckt in der Vorschau an jeder Gruppengrenze. Reparatur: idx=a/n.
  - **Reparatur:** Ganzzahlige Oktavfaktoren (3, 7, 16 statt 2,3-Faktor) und Hash-Index `mod K·f`, mit K = Perioden im Clip. Das ist kaum sichtbar anders.
- **sequenz:** nur p und die feste lmSchritte-Liste. Exakt.
- **lmInvers, Tiefe:** konstant. Exakt.
- **_lmIdx** (27577) wird als Saat nach aussen gegeben (Laser-Sprung 28008: `hs(j*13+7)` mit idx). Er trägt dieselbe Nicht-Umlauf-Eigenschaft wie zufall: Die Naht liegt auf der Schlaggrenze, also unsichtbar, solange die Teilbarkeit gilt.
  - Die Behauptung in 27575f („reproduzierbar ist die Bedingung, sonst loopt nichts") stimmt nur halb. Reproduzierbar heisst nicht periodisch.

**3. pulsHub, pulswert, lmSchub**

- **pulsHub** (27610) und **lmSchub** (27582) sind reine Funktionen von antriebWert(e,t) über _lmRoh und erben dessen Urteil. Zustand tragen sie nicht; _lmRoh wird im selben Aufruf frisch gesetzt.
- **pulswert** (27482–27484) summiert `exp(-dt*abkling)` über Schläge bis 1,5 s zurück. Das ist nur eine Zeitfunktion des Rasters, also exakt, solange das Raster lückenlos zurückreicht.
  - Das Raster beginnt bei t0−2·Takt (29087). Nötig ist 2·Takt ≥ 1,5 s, also Takt ≥ 0,75 s.
  - Bei kürzerem „Takt" (Beat-Tracker markiert jeden Schlag als 1, dann proTakt=1) fehlen am Clipanfang Beiträge, und es bricht.
  - Partikel-Windstösse (28132) blicken 2 s zurück und brauchen einen Takt ≥ 1 s. Ausserdem nutzen sie `hs(j+7000)` mit dem Array-Index j, der nicht umläuft. Wie bei zufall liegt die Naht auf einem Schlag, aber abklingende Stösse der letzten 2 s reichen über die Naht. Das bricht, weil andere Stösse ausklingen als am Anfang.
  - Reparatur: Raster ab `j=-Math.ceil(3/schritt)` und Index modulo takte·proTakt. Die Vorschau bleibt gleich.

**4. raster() und ausschnitt() (29066–29088)**

- **t0+L liegt sicher auf derselben Schlagposition wie t0.**
  - L=runden(takte·takt), danach takt:=L/takte (29078f).
  - Das Raster rechnet `schritt=taktLang/proTakt` mit genau diesem Wert. Schlag j=takte·proTakt liegt exakt bei t0+L, mit Zählzeit `((j%proTakt)+proTakt)%proTakt+1 = 1`.
  - proTakt ist `round(takt/Median-Schlagabstand)` aus den ECHTEN Schlägen (29084f).
- **Titel ohne Takt** (weniger als 3 Einsen oder takt ≤ 0,05; 29067, 29076): `t0=jetzt`, L=10 s, takte=0. raster() gibt dann unverändert `S` zurück (29083).
  - **S leer:** antriebWert fällt auf lpR-Frequenz zurück, periodisch. Für p-Formen loopt das exakt (Phase bei t0 beliebig, aber periodisch). zufall und flackern brechen, siehe 2. pulswert und Windstösse liefern 0, also exakt.
  - **S nicht leer, aber unter 3 Einsen** (Schläge ohne Zählzeit 1, oder kurzer Titel): Die echten, unregelmässigen Schläge bleiben, L=10 s liegt auf keinem Schlag. Alles, was an Schlägen hängt, bricht: takt/eins/zufall-Antrieb, pulswert, Windstösse.
  - taktDa() (27505) prüft nur `length`, der Antrieb „im Takt" ist in diesem Fall also wählbar.
  - Reparatur: Ohne Einsen trotzdem ein Raster bauen, mit Takt = proTakt(4)·Median-Schlagabstand, sobald `schlagHz()>0`.
- **Bewegtbild als Quelle, eigener Bruch in der gemeinsamen Maschinerie:** zeichneFrame ruft `quelleSync(bild,t)` auf (28845, 28814–28817).
  - Das Video-Element läuft in Echtzeit und wird nur bei mehr als 0,2 s Abweichung auf `t%q.duration` gesetzt, und auch das nur, wenn `uhrEcht` gilt, das der LIVE-Rahmen setzt.
  - Im Kodierweg entkoppelt die Bildzeit von der Uhr, das Video zeigt ein beliebiges Bild. Im MediaRecorder-Weg springt t bei i%N zurück, das Video nicht.
  - Mit Video als Quelle loopt kein Clip, unabhängig von den Effekten. LOOP_NEIN erwähnt das nicht.
  - Reparatur: Im Export je Bild `currentTime` setzen und auf `seeked` warten. Echt loopen kann es nur, wenn die Videolänge zu L passt; sonst einen Hinweis ausgeben.

**5. Wird LOOP bei allen Exportwegen gesetzt und zurückgesetzt?**

- **Kodieren:** `LOOP=L` (29176), `finally{ LOOP=0; setzen(gemerkt); }` (29179). Das ist sicher, auch bei einer Ausnahme in kodieren.
- **MediaRecorder-Rückfall:** `LOOP=L` (29193), `finally{ LOOP=0; … }` (29213). Ebenfalls sicher. Wirft `mr.start()`, greift das finally trotzdem.
- **Lücke im Kodierweg:** Das finally in 29179 setzt LOOP=0 schon vor dem Server-POST. Das ist richtig, dort wird nicht mehr gemalt.
- **Das eigentliche Problem ist das Verschränken.** Beide Wege geben mit `await` ab: Kodieren bei `encodeQueueSize>6` (29145), MediaRecorder bei jedem Bild (29208). Die Live-Schleife `rahmen()` (28842) läuft weiter, weil sie nur auf `offen` prüft.
  - Sie malt `zeichneFrame(zeit())` mit dem gemerkten Bündel, aber mit LOOP=L: Die Vorschau rastet während des Exports ein. Das ist kurz und harmlos.
  - Vor allem arbeitet sie auf DENSELBEN Effektobjekten, siehe 6.

**6. Zustand, der zwischen Bildern weitergetragen und geteilt wird**

- **Frisch je Export**, im Bündel `m` neu angelegt (29166–29169): oa, ob, oc, ores, okc, ovb, olicht (Lichtpuffer) und DATA (mit Raster).
- **Geteilt mit der Live-Vorschau** (29166: `Object.assign({},gemerkt,…)`): `VORB` (dasselbe Objekt, wird aber nur gelesen), `STAPEL` (dieselben Effektobjekte `e`) und das GL-Singleton.
- **e._-Felder:**
  - `_lmT`, `_lmPhase`, `_lmIdx`, `_lmRoh` werden in jedem Aufruf neu geschrieben. Das ist unkritisch, solange sie im selben Bild gelesen werden.
  - Größen-Caches (`_vc`, `_rc`/`_rl`, `_pc`/`_mk`, `_bc`/`_bm`, `_pt`, `_risse` mit Schlüssel inkl. Wn/Hn) sind deterministisch. Sie werden beim Wechsel Live/Export zwar ständig neu aufgebaut, verändern das Bild aber nicht.
  - **`e._spur` (nachzieh, 28553–28556) ist echter Zustand.** Bei jedem Wechsel zwischen Live-Größe und Exportgröße wird die Leinwand neu angelegt, die Spur also gelöscht. Im MediaRecorder-Weg passiert das praktisch jedes Bild, im Kodierweg sporadisch. Nachzieh bricht nicht nur an der Naht, der Export zeigt auch eine andere, abreissende Spur als die Vorschau.
  - `e._kt`/`e._kn` (korn, 28312–28314) sind Math.random-Kacheln, abhängig vom Bildwechsel. Das ist eine unsichtbare Naht, jeder Neuaufbau ist Rauschen.
- **Kein anderer Effekt trägt Positionen zwischen Bildern weiter.**
- **Reparatur:** Für den Export `STAPEL` mit geklonten Effekten ohne `_`-Felder ins Bündel geben, oder `rahmen()` während des Exports aussetzen. Die Vorschau friert dann kurz ein.

**7. LOOP_NEIN und die Anzeige**

- **Anzeige:**
  - `nicht` = Labels aktiver Effekte, deren `typ` in LOOP_NEIN steht (29161).
  - ausliefern() (29224–29229) hängt nur an die Statuszeile an: „— ohne Loop: …". Andernfalls steht dort „— nahtlos", bzw. „Loop ungenau, das Haus hat nicht geschnitten", wenn nicht geschnitten wurde.
  - Der Kodierweg meldet immer `geschnitten=true` (29184), also „nahtlos".
  - Die Prüfung sieht nur den Typ, nicht Regler, Quelle oder Titel. Kein Dialog, kein Vermerk in der Datei.
- **Die Liste stimmt heute nicht** (27480: `['nachzieh','wellen','kaustik','dunst','flammen']`):
  - **`dunst` ist tot.** Es gibt keinen Typ mehr; es kommt nur noch in der Migration 28981–28992 vor (`r.typ==='dunst'` wird zu filmnebelAusTheater).
  - **`filmnebel` fehlt**, obwohl sein Shader rohes `u_t` liest (28496 `zug=…*u_t*0.09`, 28497 `zt=vec3(0,0,u_t*…)`). Die GL-Shader mit u_t sind wellen (28392), kaustik (28396), filmnebel (28496f) und flammen (28532). Das sind die „vier Shader" aus dem Kommentar 27479, in der Liste stehen aber nur drei. streiflicht und linse lesen kein u_t.
  - **Für diese Unterfälle nicht erfasst, obwohl sie brechen:**
    - Seitenwind der Partikel (lpV-Vorzeichen, siehe 1)
    - Teiler ohne Teilbarkeit
    - Flackern bei langsamer Periode
    - zufall oder Titel ohne Schläge
    - Schläge ohne Einsen
    - Windstösse
    - Bewegtbild als Quelle
  - **Nicht Teil dieses Auftrags, gleiches Muster:** `hs(k)` mit `k=Math.floor(t/L')` in 28124 und 28562. k läuft über den Clip um m weiter, ohne Modulo; das würden die Einzeleffekt-Prüfungen erfassen.
- **Kleinste Reparatur der Liste:** `'dunst'` durch `'filmnebel'` ersetzen. Die Regler-Unterfälle bräuchten eine Funktion `loopNein(e)` statt einer Typliste. Die Vorschau bleibt davon unberührt.

## Gruppe geometrie-pulse

**LOOP_NEIN-Befund:** LOOP_NEIN (Z.27480: nachzieh, wellen, kaustik, dunst, flammen) enthält aus dieser Gruppe zu Recht nichts als ganzen Typ: Fahrt loopt immer, die acht Pulse loopen in der Voreinstellung (takt, rampe_ab, Teiler 1). Die Liste ist aber pro Typ gebaut (Z.29161 LOOP_NEIN.includes(e.typ)) und kann die Regler-Fälle nicht ausdrücken. Es fehlen: jeder Puls (puls, kippen, schaerfe, kontrast, helligkeit, saettigung, farbton, ebenso rgb) mit lmQuelle 'zufall', mit lmForm 'flackern', mit Teiler 2/4/8, der proTakt*takte nicht teilt, sowie Titel mit Schlägen, aber weniger als drei Einsen. Dasselbe betrifft vermutlich jeden anderen Effekt mit antriebWert (licht, laser, strobe usw.). Vorschlag: statt der Typliste eine Prüfung loopNein(e) = LOOP_NEIN.includes(e.typ) || lmQuelle==='zufall' || lmForm==='flackern' || (lmQuelle==='takt' && Teiler>1 && (proTakt*takte)%Teiler). Nebenbefund außerhalb der Gruppe: ist die Quelle ein Video, springt quelleSync (Z.28814-28817) mit t%q.duration und nur bei uhrEcht; das Video läuft nicht mit L um, dann loopt kein Effekt.

### fahrt (Fahrt) — exakt

**begruendung:** Einzige Zeitstelle Z.28848: panx+=tri(t/lpP(e.tempo))*e.weite*s; pany+=tri(t/lpP(e.tempo*1.3))*e.weite*s. lpP(p)=LOOP/n, also t/lpP = t*n/L; bei t0+L kommt genau +n dazu, tri (Z.27481, Periode 1) liefert denselben Wert. crop=(1-(1-e.zoom)*s) ist zeitunabhängig. Kein pulsHub, kein Zustand. Bild t0 == Bild t0+L.

### puls (Zoom schlägt) — haengt am Regler

**begruendung:** Z.28849: hb=pulsHub(e,t); scaleMul*=(1+amt*hb bzw. amt*(1-hb)). Sonst nichts Zeitabhängiges. pulsHub (Z.27610) -> antriebWert (Z.27542) -> _lmRoh. Export: ausschnitt() nimmt L=takte*takt (auf Bilder gerundet, takt=L/takte), raster() setzt S[j]=[t0+j*schritt, beat], j ab -2*proTakt, also M=proTakt*takte Schläge je L. (a) stetig: return 1 -> konstant. (b) hz: Z.27544 hz=lpR(max(0.1,lmHz)), x=t*hz, p=x-floor(x) -> gerastet. (c) takt, Teiler 1/0.5/0.25/0.125: Z.27565-27568 k=round(1/teil), p=(t-S[i][0])/schritt*k-j -> hängt nur am gleichmäßigen Raster. (d) takt, Teiler n=2/4/8: Z.27569 a=i-(i%n), t1=S[a+n][0]. Das Raster läuft in L um M Indizes weiter; nur wenn n|M liegt die Gruppengrenze bei t0+L wieder gleich. Beispiel 4/4, 2 s Takt -> takte=5, M=20, Teiler 8: 20%8=4, Gruppe verschoben -> sichtbarer Sprung. (e) eins: Z.27569 sucht S[a][1]===1 rückwärts/vorwärts -> taktperiodisch. (f) zufall: Z.27571 aktiv=lmHash(idx*3+e.id*31)<lmAnteil, idx=a bzw. i*k+j ist der ROHE Array-Index, der in L um M (bzw. M*k) wächst; die Auswahl übersprungener Schläge ist bei t0+L eine andere. (g) Form flackern: Z.27579 lmFlacker(e.id*37+11, idx+p) liest Wertrauschen entlang der fortlaufenden Periodenzahl u=idx+p mit Oktaven f=3, 6.9, 15.87 (Z.27531-27534); u wächst in L um M (bei hz: round(lmHz*L)), der Rauschwert bei t0+L ist ein anderer. Alle anderen Formen (rampe_auf/ab, peak_an/aus, rechteck, sinus, sequenz inkl. lmWeich, Z.27536-27540) hängen nur an p und lmVersatz -> periodisch. (h) Titel ohne Schläge: raster gibt S=[] zurück, Rückfall Z.27556 hz=lpR(lmHz/n) -> gerastet; zufall/flackern dort mit idx=floor(x) wachsend -> bricht. (i) Titel mit Schlägen, aber <3 Einsen (taktLaenge Z.27067): takte=0, raster gibt die rohen, schwankenden Schläge zurück, L=10 s -> takt/eins/zufall laufen nicht um.

**unterfaelle:** LOOPT: stetig (jede Form); hz mit jeder Form außer flackern; takt mit Teiler 1, 1/2, 1/4, 1/8 und jeder Form außer flackern; takt mit Teiler 2/4/8 NUR wenn der Teiler proTakt*takte teilt; eins mit jeder Form außer flackern; schlagfreier Titel mit takt/eins/hz außer flackern. Voreinstellung (takt, rampe_ab, Teiler 1) loopt exakt. BRICHT: zufall (jede Form, außer lmAnteil 0 oder 1); jede Quelle mit Form flackern (bei schnellen Perioden, etwa >=2 Perioden/s, fällt der Sprung im Zappeln kaum auf; bei langsamen, z.B. Teiler 8 oder lmHz<1, ist er ein sichtbarer Helligkeits-/Größensprung); takt mit Teiler n, der proTakt*takte nicht teilt; Titel mit Schlägen, aber weniger als drei Einsen.

**reparatur:** Alles in antriebWert, nur unter LOOP>0: (1) zufall: den Index auf die Schläge je Loop falten, M=Math.round(LOOP/(S[1][0]-S[0][0])) (Raster ist gleichmäßig; bei teil<1 M*k, im schlagfreien Rückfall M=Math.round(hz*LOOP)), dann lmHash((((idx%M)+M)%M)*3+e.id*31). (2) flackern: lmFlacker braucht eine Periode: u modulo M falten und die Oktavfaktoren ganzzahlig machen (3,7,16 statt 3/6.9/15.87), Hash auf (i mod (M*f)) - sonst entsteht beim Falten selbst ein Sprung. (3) Teiler 2/4/8: in ausschnitt() takte auf ein Vielfaches von n/ggT(n,proTakt) abrunden (Clip wird ggf. kürzer). Vorschau: (1) und (3) unverändert (LOOP=0); (2) unverändert, wenn die ganzzahligen Faktoren nur unter LOOP gelten - dann weicht das Flackermuster des Exports vom Studio ab (gleicher Charakter, andere Werte); gilt es immer, ändert sich das Muster in der Vorschau, nicht der Charakter.

### kippen (Kippen schlägt) — haengt am Regler

**begruendung:** Z.28850: hb=pulsHub(e,t); rotG+=(invert?-1:1)*e.neigung*s*hb. Z.28859 Deckungszoom z=cos(rad)+r*sin(rad) hängt nur an rotG. Keine weitere Zeitstelle, kein Zustand. Damit gilt exakt dieselbe Quellen-/Formen-Analyse wie bei 'puls' (pulsHub Z.27610 -> antriebWert Z.27542-27580): stetig/hz/eins/takt-Teiler<=1 periodisch; zufall (Z.27571 lmHash(idx*3+e.id*31) mit rohem Array-Index), flackern (Z.27579 lmFlacker(seed, idx+p) entlang wachsender Periodenzahl) und takt-Teiler n mit proTakt*takte%n!=0 (Z.27569 a=i-(i%n)) brechen.

**unterfaelle:** LOOPT: stetig; hz, eins, takt (Teiler 1, 1/2, 1/4, 1/8) mit jeder Form außer flackern; Teiler 2/4/8 nur wenn er proTakt*takte teilt. BRICHT: zufall; Form flackern (bei schnellen Perioden kaum sichtbar, bei langsamen ein Ruck in der Neigung); Teiler, der die Schlagzahl des Loops nicht teilt; Titel mit Schlägen aber <3 Einsen (rohe Schläge, kein Raster).

**reparatur:** Wie bei puls: in antriebWert unter LOOP>0 idx für zufall modulo Schläge je Loop falten; lmFlacker mit ganzzahligen Oktavfaktoren und gefaltetem u; in ausschnitt() takte so wählen, dass n die Schlagzahl teilt.

### schaerfe (Schärfe schlägt) — haengt am Regler

**begruendung:** Z.28865: hb=pulsHub(e,t), a=min(1,staerke*min(1,hb)); Z.28867: aw=invert?a:min(1,staerke*(1-min(1,hb))); lege(e,'blur('+e.unschaerfe+'px)',aw). Blurradius zeitunabhängig; einzige Zeitgröße ist hb. Das Ergebnis liegt auf dem Kettenschnappschuss dieses Bildes (schnapp() Z.28863 kopiert oa desselben Bildes) - kein Zustand über Bilder. Also dieselbe Quellenanalyse wie puls: stetig/hz/eins/takt-Teiler<=1 exakt; zufall (Z.27571), flackern (Z.27579), Teiler n nicht Teiler von proTakt*takte (Z.27569) brechen.

**unterfaelle:** LOOPT: stetig; hz, eins, takt (Teiler 1, 1/2, 1/4, 1/8) mit jeder Form außer flackern; Teiler 2/4/8 wenn er proTakt*takte teilt. BRICHT: zufall; flackern (schnell kaum, langsam sichtbar als Schärfesprung); unpassender Teiler; <3 Einsen.

**reparatur:** Wie bei puls (idx-Faltung für zufall, periodisches lmFlacker, takte passend zum Teiler).

### kontrast (Kontrast schlägt) — haengt am Regler

**begruendung:** Z.28870: lege(e,'url(#'+kurveFilter(e)+')',a) mit a=min(1,staerke*min(1,hb)), hb=pulsHub(e,t) (Z.28865). kurveFilter (Z.27642-27645) baut die feComponentTransfer-Tabelle nur aus e.grad und e.invert, zeitunabhängig. Einzige Zeitgröße ist hb -> Quellenanalyse wie puls: stetig/hz/eins/takt-Teiler<=1 exakt; zufall, flackern, unpassender Teiler brechen.

**unterfaelle:** LOOPT: stetig; hz, eins, takt (Teiler 1, 1/2, 1/4, 1/8) mit jeder Form außer flackern; Teiler 2/4/8 wenn er proTakt*takte teilt. BRICHT: zufall; flackern; unpassender Teiler; <3 Einsen.

**reparatur:** Wie bei puls.

### helligkeit (Helligkeit schlägt) — haengt am Regler

**begruendung:** Z.28872: lege(e,'brightness('+(invert?(1-0.6*wucht):(1+1.2*wucht))+')',a), a=min(1,staerke*min(1,hb)), hb=pulsHub(e,t) (Z.28865). Filterwert zeitunabhängig; nur hb läuft mit der Zeit -> Quellenanalyse wie puls.

**unterfaelle:** LOOPT: stetig; hz, eins, takt (Teiler 1, 1/2, 1/4, 1/8) mit jeder Form außer flackern; Teiler 2/4/8 wenn er proTakt*takte teilt. BRICHT: zufall (anderer Schlag blitzt an der Naht); flackern (bei langsamen Perioden sichtbarer Helligkeitssprung); unpassender Teiler; <3 Einsen.

**reparatur:** Wie bei puls.

### saettigung (Sättigung schlägt) — haengt am Regler

**begruendung:** Z.28871: lege(e,'saturate('+(invert?1/max(0.05,saettigung):saettigung)+')',a), a aus hb=pulsHub(e,t) (Z.28865). Filterwert zeitunabhängig; nur hb zeitabhängig -> Quellenanalyse wie puls.

**unterfaelle:** LOOPT: stetig; hz, eins, takt (Teiler 1, 1/2, 1/4, 1/8) mit jeder Form außer flackern; Teiler 2/4/8 wenn er proTakt*takte teilt. BRICHT: zufall; flackern; unpassender Teiler; <3 Einsen.

**reparatur:** Wie bei puls.

### farbton (Farbton schlägt) — haengt am Regler

**begruendung:** Z.28868: af=invert?min(1,staerke*(1-min(1,hb))):a; lege(e,'hue-rotate('+e.winkel+'deg)',af), hb=pulsHub(e,t) (Z.28865). Winkel zeitunabhängig; nur hb zeitabhängig -> Quellenanalyse wie puls.

**unterfaelle:** LOOPT: stetig; hz, eins, takt (Teiler 1, 1/2, 1/4, 1/8) mit jeder Form außer flackern; Teiler 2/4/8 wenn er proTakt*takte teilt. BRICHT: zufall; flackern; unpassender Teiler; <3 Einsen.

**reparatur:** Wie bei puls.

**Gegenprüfung:** {"korrekturen": [{"typ": "puls", "urteil_vorher": "haengt am Regler: zufall bricht (jede Form)", "urteil_richtig": "haengt am Regler", "warum": "Das Urteil 'haengt am Regler' stimmt, aber der Fall zufall ist falsch einsortiert. Z.27571 aktiv=lmHash(idx*3+e.id*31)<lmAnteil: idx wandert in L tatsaechlich um M weiter, das Bild bei t0+L ist also nicht bitgleich. Mit Raster liegt die Naht aber immer auf einer Grenze, an der ohnehin neu gewuerfelt wird: t0 ist eine Eins (ausschnitt Z.29076), raster Z.29087 legt S[2*proTakt][0]=t0 genau darauf, und das Export-Bild ist t0+(i%N)/BILDRATE (Z.29205). Bei Teiler 1 ist die Naht eine Schlaggrenze; bei Teiler <1 (idx=i*k+j, Z.27568) eine Grenze der Unterteilung; bei Teiler n mit n|M eine Gruppengrenze. Der Wechsel von Schlag M-1 zu Schlag 0 ist darum nur ein weiterer Zufallswechsel, wie er an jeder Schlaggrenze vorkommt: 'unsichtbare Naht', kein Bruch. Wirklich bricht zufall nur in zwei Faellen. (1) Titel ohne Schlaege: Z.27556 x=t*lpR(lmHz/n), dazu t0=jetzt (Z.29076, takt=0). Die Naht liegt mitten in einer Periode, und aktiv springt dort mitten im Verlauf; bei rampe_ab etwa wird es halb hell und ist schlagartig dunkel. (2) Titel mit weniger als drei Einsen. Mit Teiler n, der M nicht teilt, bricht es ohnehin, wie bei jeder Form. Die Reparatur (1) des Vorlesers, die idx faltet, ist mit Raster also unnoetig und nur fuer den schlagfreien Rueckfall sinnvoll. Einfacher ginge es dort, wenn ausschnitt() t0 auf eine ganze Periode legt: t0=Math.ceil(jetzt*hz)/hz. Die Vorschau bleibt dabei unveraendert."}, {"typ": "kippen", "urteil_vorher": "haengt am Regler: zufall bricht", "urteil_richtig": "haengt am Regler", "warum": "Der Fall zufall ist falsch einsortiert, wie bei puls. Z.28850 rotG+=...*pulsHub(e,t) -> Z.27571 lmHash(idx*3+e.id*31). Mit Raster liegt die Naht auf einer Schlag- bzw. Gruppengrenze (t0 = Eins, Z.29076/29087), und dort wird ohnehin neu gewuerfelt: unsichtbare Naht. Bruch nur im schlagfreien Rueckfall (Z.27556, t0=jetzt, Naht mitten in der Periode), bei weniger als drei Einsen und bei einem Teiler, der M nicht teilt."}, {"typ": "schaerfe", "urteil_vorher": "haengt am Regler: zufall bricht", "urteil_richtig": "haengt am Regler", "warum": "Wie bei puls: Z.28865 hb=pulsHub(e,t), zufall-Entscheid Z.27571. Mit Raster wechselt aktiv an der Naht nur an einer Schlaggrenze (t0 = Eins): unsichtbare Naht. Bruch nur ohne Schlaege (Z.27556, t0=jetzt, Naht mitten in der Periode), bei weniger als drei Einsen und bei einem Teiler, der M nicht teilt."}, {"typ": "kontrast", "urteil_vorher": "haengt am Regler: zufall bricht", "urteil_richtig": "haengt am Regler", "warum": "Wie bei puls: Z.28870 lege(...,a) mit a aus pulsHub (Z.28865), zufall Z.27571. Mit Raster liegt die Naht auf einer Schlaggrenze, wo ohnehin neu gewuerfelt wird: unsichtbare Naht. Bruch nur im schlagfreien Rueckfall (Z.27556), bei weniger als drei Einsen und bei einem Teiler, der M nicht teilt."}, {"typ": "helligkeit", "urteil_vorher": "haengt am Regler: zufall bricht ('anderer Schlag blitzt an der Naht')", "urteil_richtig": "haengt am Regler", "warum": "Wie bei puls: Z.28872, a aus pulsHub (Z.28865), zufall Z.27571. Der Blitz eines anderen Schlags faellt genau auf die Schlaggrenze t0 (Eins, Z.29076/29087), und dort entscheidet ohnehin jeder Schlag neu. Die Folge 'Schlag M-1, dann Schlag 0' ist von jeder anderen Zufallsfolge nicht zu unterscheiden: unsichtbare Naht. Bruch nur ohne Schlaege (Z.27556, t0=jetzt, Naht mitten in der Periode), bei weniger als drei Einsen und bei einem Teiler, der M nicht teilt."}, {"typ": "saettigung", "urteil_vorher": "haengt am Regler: zufall bricht", "urteil_richtig": "haengt am Regler", "warum": "Wie bei puls: Z.28871, a aus pulsHub (Z.28865), zufall Z.27571. Mit Raster liegt die Naht auf einer Schlaggrenze: unsichtbare Naht. Bruch nur im schlagfreien Rueckfall (Z.27556), bei weniger als drei Einsen und bei einem Teiler, der M nicht teilt."}, {"typ": "farbton", "urteil_vorher": "haengt am Regler: zufall bricht", "urteil_richtig": "haengt am Regler", "warum": "Wie bei puls: Z.28868 af aus hb=pulsHub (Z.28865), zufall Z.27571. Mit Raster liegt die Naht auf einer Schlaggrenze: unsichtbare Naht. Bruch nur im schlagfreien Rueckfall (Z.27556), bei weniger als drei Einsen und bei einem Teiler, der M nicht teilt."}], "bestaetigt": ["fahrt"]}

## Gruppe leuchten

**LOOP_NEIN-Befund:** LOOP_NEIN (Zeile 27480) = ['nachzieh','wellen','kaustik','dunst','flammen'] enthaelt keinen Effekt dieser Gruppe - fuer die Gruppe stimmt sie nicht. Es fehlen, schon mit Vorgabewerten: laser (Ursprung 'wandern' ist Vorgabe, cos(w*0.8..) bricht; Bauart Punkte mit drehen .15 bricht), licht und schatten (rmBewegung 'wandernd' ist Vorgabe in rmParams, y-Term ph*1.3 bricht). Mit Regler: licht/schatten bei fahrt/schritt; laser Scanner mit Sprung und nicht-stetigem Antrieb; streiflicht, sobald ein wandernder Laser in der Kette haengt; und quer durch alle Lichter (licht, schatten, laser, strahlen, strobe) Antriebsquelle zufall, Form flackern und Teiler 2/4/8 bei nicht teilbarer Schlagzahl. Die Liste ist je Typ gebaut und kann Regler-Unterfaelle nicht ausdruecken; besser waere eine Funktion loopNein(e), die die Einstellung prueft - oder die Reparaturen, dann entfallen licht/schatten/laser/strahlen/strobe ganz. Zu viel steht fuer diese Gruppe nichts drin. Nebenbefund: bei Clips ohne erkannten Takt (ausschnitt: takte=0) laesst raster() die echten Schlaege stehen, dann brechen auch takt/eins/schritt.

### licht (Scheinwerfer) — haengt am Regler

**begruendung:** Zeichnet ueber lichtMalen (27726): a=staerke*antriebWert(e,t), O=raumUrsprung (27675, zeitunabhaengig), Z=raumZiel(e,t) (27676). In raumZiel: tp=lpP(max(0.2,rmTempo)), ph=t/tp+e.id*0.13 -> jedes sin(2*PI*ph) ist exakt periodisch mit L. 'fest': return [zx,zy] exakt. 'bogen' (27680): s=Math.sin(2*Math.PI*ph) exakt. 'schwenk' (27681): Math.sin(2*Math.PI*ph)*wt*PI/2 exakt. 'wandernd' (27679, Vorgabe in rmParams 27285!): x-Term sin(2*PI*ph) exakt, y-Term Math.sin(2*Math.PI*(ph*1.3+e.id*0.2)) BRICHT: ueber L laeuft ph um n=L/tp weiter, der y-Term um 1.3n Umlaeufe; ganzzahlig nur bei n=10,20... Bei rmTempo 16 und L<=10 ist tp=L, n=1 -> 0.3 Umlauf Versatz, Sprung bis 0.42*wt*H. 'fahrt' (27683): k=Math.floor(t/tp), P(k)=hs(k*2),hs(k*2+1) -> k waechst ueber L um n, hs(k) laeuft nicht um -> neue Zielpunkte, bricht. 'schritt' (27684): k=a = Index im Schlagraster S (raster() baut ab j=-2*proTakt), P(k) aus hs(k*2) -> Index waechst um proTakt*takte, bricht; ohne Schlaege k=Math.floor(t) ebenso. Blende (blendeMaske 27711ff): nur hs(i), rmBlDrehung statisch -> exakt. Farbe/Form/Profil zeitlos. ANTRIEB (antriebWert 27542ff, gilt fuer alle Lichter): 'stetig' exakt; 'hz' x=t*lpR(lmHz) exakt; Rueckfall ohne Schlaege lpR(lmHz/n) exakt; 'takt' Teiler 1 und Bruchteile (idx=i*k+j, p aus Schlagabstand) exakt; 'eins' exakt (Raster setzt S[..][1]=1 periodisch); 'takt' Teiler n>1: a=i-(i%n) gruppiert nach absolutem Rasterindex -> bricht, wenn proTakt*takte nicht durch n teilbar (z.B. Teiler 8, 4/4, 5 Takte = 20 Schlaege); Quelle 'zufall': aktiv=lmHash(idx*3+e.id*31)<Anteil mit absolutem idx -> bricht; Form 'flackern': lmFlacker(e.id*37+11, idx+p) mit absolutem idx (Hash auf Gitter u*3, u*6.9, u*15.87) -> bricht; Form 'sequenz' und alle anderen Formen haengen nur an p -> exakt.

**unterfaelle:** loopt: rmBewegung fest, bogen, schwenk (mit Antrieb stetig/hz/takt Teiler 1 oder Bruchteil/eins, Formen ausser flackern). bricht: rmBewegung wandernd (Vorgabe!), fahrt, schritt; Antriebsquelle zufall; Form flackern; Teiler 2/4/8, wenn die Schlagzahl des Clips nicht durch den Teiler teilbar ist.

**reparatur:** wandernd (27679): y-Term Math.sin(2*Math.PI*(ph*1.3+e.id*0.2)) -> Math.sin(2*Math.PI*(t*lpR(1.3/tp)+e.id*0.369)) (bei LOOP=0 identisch, da ph*1.3=1.3t/tp+0.169*id; im Export bei n=1 Verhaeltnis 1:1, Bahn wird Ellipse statt Lissajous). fahrt: bei LOOP>0 k modulo n=Math.round(LOOP/tp) nehmen, auch fuer P(k-1). schritt: Schluessel statt Rasterindex die Schlagnummer modulo Schlaege-im-Clip (z.B. Math.round((((S[a][0]-S[0][0])%LOOP)+LOOP)%LOOP/(S[1][0]-S[0][0]))) wenn LOOP>0. Antrieb: in antriebWert bei LOOP>0 idx modulo Perioden im Clip (hz: Math.round(hz*LOOP); Schlag: Schlaege im Clip * k) -> heilt zufall exakt, flackern bis auf eine Rauschnaht (Oktaven 2.3-fach, dann unsichtbar); Teiler: nur heilbar, wenn ausschnitt() takte so waehlt, dass proTakt*takte durch 8 teilbar ist.

### schatten (Schatten) — haengt am Regler

**begruendung:** Gleicher Code wie Scheinwerfer: Zeile 27877 'licht'||'schatten' -> lichtMalen(e,cx,t,Wn,Hn); Unterschied nur fleckStop (27633, Farbe nicht aufgehellt, zeitlos). Also identische Zeitstellen: raumZiel 27676 tp=lpP(rmTempo), ph=t/tp+id*0.13; wandernd y-Term Math.sin(2*Math.PI*(ph*1.3+e.id*0.2)) bricht; fahrt k=Math.floor(t/tp)+hs(k*2) bricht; schritt k=Rasterindex a + hs bricht; fest/bogen/schwenk exakt; Antrieb (antriebWert) wie beim Scheinwerfer: zufall (lmHash(idx*3+..)) und flackern (lmFlacker(..,idx+p)) brechen, Teiler n>1 bricht bei nicht teilbarer Schlagzahl, sonst exakt. Vorgabe rmParams rmBewegung:'wandernd' -> Standardkarte bricht.

**unterfaelle:** loopt: fest, bogen, schwenk mit stetig/hz/takt(1 oder Bruchteil)/eins, Formen ausser flackern. bricht: wandernd (Vorgabe), fahrt, schritt, zufall, flackern, Teiler mit Rest.

**reparatur:** dieselben Reparaturen wie Scheinwerfer (raumZiel und antriebWert sind gemeinsam, eine Aenderung heilt beide).

### laser (Laserstrahl) — haengt am Regler

**begruendung:** Gemeinsam (27880): flPh=((lpR(flimmerTempo)*t+id*0.37)%1+1)%1 exakt; a=staerke*antriebWert(e,t)*fl (Antrieb wie Scheinwerfer: zufall/flackern/Teiler-Rest brechen). Ursprung 'fest' (27885): dir=atan2(..)+Math.sin(2*Math.PI*t/lpP(tp))*sw exakt. Ursprung 'wandern' (27886, VORGABE): w=2*Math.PI*t/lpP(tp*4)+e.id; ox=sin(w) exakt; oy=Hn*(0.5+0.8*Math.cos(w*0.8+e.id*1.3)) BRICHT (0.8*n Umlaeufe; bei tempo 8 ist lpP(32)=L, n=1 -> 0.2 Umlauf Versatz des Faecherpunkts, grosser Sprung von Ort und Richtung); dir-Schwenk Math.sin(2*Math.PI*t/lpP(tp/0.7)) exakt. BAUART GITTER (28048): stellen dir+(i/(n-1)-0.5)*spread, zeitlos ausser dir -> folgt Ursprung. BAUART SCANNER ohne Sprung (28010ff): hz=lpR(sweepTempo); tt=t-(k/M)*nach; ph=((tt*hz)%1+1)%1; u=0.5+0.5*sin(2*PI*ph); Austastung seg=Math.floor(ph*stuf*2), hs(seg*3+e.id) -> alles exakt. SCANNER mit Sprung (28003ff): stelle(j)=hs(j*13+7), idx=e._lmIdx (absolute Schlag-/Periodennummer aus antriebWert), ph=e._lmPhase -> bei Quelle hz (idx=floor(t*lpR(hz))) und takt/eins/zufall (Rasterindex) BRICHT, weil hs(idx) nicht mit L umlaeuft; bei Quelle stetig kehrt antriebWert frueh zurueck, _lmIdx bleibt 0 bzw. alt, _lmPhase=null -> ph=0: statisches Bild, exakt (aber kein Sprung). BAUART PUNKTE (27924): dreh=2*Math.PI*((e.drehen||0)*t*0.12) ROHES t -> BRICHT fuer drehen!=0 (Vorgabe .15: 0.18 Umdrehung in 10 s, d.h. 0.72 Vierteldrehungen, das quadratische Raster ist nur bei Vierteldrehungen deckungsgleich); drehen=0 exakt. Rest der Punkte (Neigung, Tiefenkarte tiefeProben, Parallaxe mit ox/oy) haengt nur am Ursprung. e._pt ist nur ein Farbcache, kein Zustand.

**unterfaelle:** Ursprung wandern (Vorgabe): bricht in allen Bauarten. Ursprung fest: Gitter exakt; Scanner ohne Sprung exakt; Scanner mit Sprung exakt nur bei Antrieb stetig, bricht bei hz/takt/eins/zufall; Punkte exakt nur bei drehen=0, bricht bei drehen!=0 (Vorgabe .15). Flimmer: immer exakt (lpR). Schwenk: immer exakt (lpP). Zusaetzlich ueberall: Antrieb zufall, Form flackern, Teiler mit Rest brechen.

**reparatur:** wandern (27886): Math.cos(w*0.8+e.id*1.3) -> Math.cos(2*Math.PI*t*lpR(0.8/lpP(tp*4))+e.id*2.1) (bei LOOP=0 identisch; im Export bei n=1 Verhaeltnis 1:1, die Bahn wird eine Ellipse). Punkte drehen (27924): dreh=(e.drehen? Math.sign(e.drehen)*(Math.PI/2)*lpR(Math.abs(e.drehen)*0.48)*t : 0) - Vorzeichen und Null muessen am Helfer vorbei, weil lpR(0) 1/LOOP und lpR(negativ) +1/LOOP liefert; Vierteldrehung als Einheit nutzt die Rastersymmetrie, sonst wuerde die Vorgabe .15 im Export mehr als fuenfmal schneller drehen. Scanner-Sprung: _lmIdx bei LOOP>0 modulo Perioden im Clip (gleiche Reparatur wie im Antrieb).

### strahlen (Lichtstrahlen) — haengt am Regler

**begruendung:** Zeile 28280ff: basis=atan2(..)+Math.sin(2*Math.PI*t/lpP(e.tempo))*e.schwenk*0.6 exakt; je Schacht ang=basis+platz*spreiz+Math.sin(2*Math.PI*t/lpP(e.tempo/1.3)+hs(i)*9)*schwenk*0.12 exakt (lpP rastet die Periode tempo/1.3 selbst ein); platz, Breite, Deckkraft nur hs(i+90), hs(i+30), hs(i+60) -> zeitlos. px,py fest. e._sc ist Zwischenleinwand, je Bild geleert (clearRect), kein Zustand. Einzige weitere Zeitstelle: a=staerke*antriebWert(e,t) -> Vorgabe stetig exakt; hz/takt(Teiler 1, Bruchteil)/eins exakt; zufall und Form flackern brechen (absoluter idx), Teiler n>1 bricht bei nicht teilbarer Schlagzahl.

**unterfaelle:** loopt: Antrieb stetig (Vorgabe), hz, takt mit Teiler 1/Bruchteil, eins, alle Formen ausser flackern. bricht: Quelle zufall, Form flackern, Teiler 2/4/8 mit Rest.

**reparatur:** nur im Antrieb: idx in antriebWert bei LOOP>0 modulo Perioden im Clip.

### strobe (Stroboskop) — haengt am Regler

**begruendung:** Zeile 28316: q==='stetig' -> return (malt nichts, exakt). Sonst antriebWert(e,t); ph=(e._lmRoh*2-1)*tiefe; Farbe/Modus zeitlos -> das Bild haengt allein am Antrieb. Vorgabe (27298) lmQuelle 'hz', lmForm 'rechteck', lmHz 8: x=t*lpR(8) -> exakt. takt/eins/Bruchteile exakt; Rueckfall ohne Schlaege lpR(lmHz/n) exakt. Quelle zufall: lmHash(idx*3+e.id*31) mit absolutem idx bricht; Form flackern: lmFlacker(e.id*37+11, idx+p) bricht; Teiler n>1: a=i-(i%n) bricht, wenn proTakt*takte nicht durch n teilbar. Beim Strobe faellt die Naht bei zufall am staerksten auf, weil ganze Blitze an anderer Stelle kommen bzw. fehlen.

**unterfaelle:** loopt: stetig, hz (Vorgabe), takt Teiler 1/Bruchteil, eins, Formen ausser flackern. bricht: zufall, flackern, Teiler mit Rest.

**reparatur:** idx in antriebWert bei LOOP>0 modulo Perioden im Clip (hz: Math.round(hz*LOOP), Schlag: Schlaege im Clip, bei Bruchteilen mal k); flackern danach nur noch Rauschnaht.

### streiflicht (Streiflicht) — haengt am Regler

**begruendung:** Eigene Zeit hat er nicht: Shader streiflicht (28412ff) liest kein u_t (grep im Shadertext: 0 Treffer); u_takt ist 0, weil die Karte keinen lm-Parameter hat (28376). Einfall/Kante/Relief/Schatten und Tiefenkarte statisch. Zeitabhaengig ist nur glZusatz (27203): o=lichtOrtMittel() -> u_ortX/u_ortY/u_ortDa aus LICHTORTE, dem helligkeitsgewichteten Mittel der Orte, die Leuchten waehrend des Lichtdurchgangs (28879) melden: Scheinwerfer/Schatten lichtOrtMelden(O,a) - O ist raumUrsprung, zeitlos, nur das Gewicht a haengt am Antrieb; Laser lichtOrtMelden(ox,oy,a) - wandernd bricht (cos(w*0.8..)), fest exakt; Lichtstrahlen lichtOrtMelden(px,py,a) - fester Ort; Strobe meldet nichts. Soweit der Shader auch den Lichtpuffer u_licht liest, erbt er zusaetzlich deren Bild. Also: Bild t0 == t0+L genau dann, wenn alle meldenden Leuchten der Kette loopen; bei einer Leuchte allein ist nur deren Ort relevant, bei mehreren auch die Gewichte a (Antrieb).

**unterfaelle:** loopt: nur Scheinwerfer/Schatten und/oder Lichtstrahlen mit Antrieb ohne zufall/flackern/Teiler-Rest (deren Ort ist fest; Bewegung wandernd/fahrt/schritt aendert den gemeldeten Ort nicht, das Gewicht a nur ueber den Antrieb - bei mehreren Leuchten verschiebt ein brechender Antrieb das Mittel); Laser mit Ursprung fest. bricht: Laser mit Ursprung wandern (Vorgabe) in der Kette; Antrieb zufall/flackern/Teiler-Rest bei einer von mehreren Leuchten (Gewichtung). Hinweis: Feuer meldet ebenfalls (andere Gruppe) und wird ebenso vererbt.

**reparatur:** keine eigene; heilt mit den Reparaturen am Laser-Ursprung und am Antrieb.

**Gegenprüfung:** {"korrekturen": [{"typ": "laser", "urteil_vorher": "haengt am Regler; Ursprung wandern (Vorgabe) bricht in ALLEN Bauarten", "urteil_richtig": "haengt am Regler", "warum": "Die Unterfaelle stimmen fuer die Bauart Punkte nicht. Dort gehen ox/oy nur innerhalb von if(tp&&auf>0.001) ein (Parallaxe x2+=(ox-x2)*pa; y2+=(oy-y2)*pa und Lichtrichtung lx=(ox/Wn-u2), ly=(oy/Hn-v2), etwa Z.27980-27986). Ohne Tiefenkarte (tp=tiefeProben(...) null) oder bei Aufsetzen 0 haengt das Punktebild gar nicht am Ursprung. Punkte mit drehen=0 loopen dann auch bei Ursprung wandern exakt, und Gitter und Scanner lassen die Punkte hier nicht mitbrechen. Es bricht nur der rohe Ausdruck dreh=2*Math.PI*((e.drehen||0)*t*0.12) in Z.27926 (Vorgabe .15). Mit Tiefenkarte und Aufsetzen>0 (Vorgabe .6) bricht wandern ueber oy=Hn*(0.5+0.8*Math.cos(w*0.8+e.id*1.3)) (Z.27886) wie behauptet. Die uebrigen Aussagen habe ich bestaetigt: fest/Gitter exakt, Scanner ohne Sprung exakt (hz=lpR(sweepTempo), hs(seg*3+e.id)), Scanner mit Sprung bricht ueber hs(j*13+7) mit absolutem _lmIdx, Flimmer lpR, Schwenk lpP. Laser steht nicht in LOOP_NEIN (Z.27480), obwohl die Vorgabe (wandern, Punkte-drehen .15) bricht."}, {"typ": "streiflicht", "urteil_vorher": "haengt am Regler; loopt, wenn nur die gemeldeten Orte loopen; Bewegung wandernd/fahrt/schritt und Strobe sind egal; Schatten meldet", "urteil_richtig": "haengt am Regler", "warum": "Der Shader liest den Lichtpuffer voll mit: vec3 auf=c.rgb*texture2D(u_licht,v_uv).rgb*blitz*4.0 (Z.28461). In diesen Puffer malt der Mediumdurchgang das KOMPLETTE Bild jeder Leuchte: malen(e,clicht,t,...) fuer alle EFFEKTE[..].leuchtet (Z.28880), und leuchtet haben licht, laser, strahlen, feuer und strobe (Z.27273). Deshalb bricht Streiflicht auch dann, wenn der Ort feststeht: bei einem Scheinwerfer mit rmBewegung wandernd (Vorgabe), fahrt oder schritt (der Fleck wandert im Puffer), bei Laser-Punkten mit drehen!=0, beim Laser-Scanner mit Sprung und bei einem Strobe mit brechendem Antrieb (zufall, flackern, Teiler mit Rest). Der Strobe meldet zwar keinen Ort, steht aber im Puffer. Umgekehrt ist Schatten KEINE Leuchte: er steht nicht in der leuchtet-Liste, meldet also keinen Ort (lichtOrtMelden prueft LICHTMAL, und Schatten malt nur im Hauptdurchgang mit LICHTMAL=false) und fehlt im Puffer. Auch bei EINER Leuchte zaehlt der Antrieb: faellt a unter 0.002 (z. B. zufall mit Tiefe 1), fehlt die Meldung, u_ortDa=0 und der Effekt schaltet ab (Z.28416). Ein eigenes u_t hat der Shader nicht, das stimmt. Richtig ist also: Streiflicht loopt genau dann, wenn jede Leuchte in der Kette (licht, laser, strahlen, feuer, strobe) selbst als ganzes Bild loopt. Er erbt alle deren Brueche, nicht nur die der Orte."}], "bestaetigt": ["licht", "schatten", "strahlen", "strobe"]}

## Gruppe maler-stoerungen

**LOOP_NEIN-Befund:** In LOOP_NEIN (Z.27480) steht keiner der sechs Effekte dieser Gruppe. Fuer Farbschleier, Scanlines, Rauschausfall und Filmkorn stimmt das. Es fehlen aber zwei Faelle: Laufstreifen mit Baendern 'abwechselnd' bricht, wenn round(LOOP/tempo) ungerade ist. Sicherungswackeln bricht frei immer und im Takt mit dauer > Schlagabstand, wenn ein Einbruch ueber der Naht liegt. Beides sollte man eher reparieren als in die Liste aufnehmen: bei Laufstreifen lpP(2*tempo)/2 statt lpP(tempo), bei Sicherungswackeln hs-Schluessel modulo Fensterzahl bzw. Schlagzahl je Loop. Die Vorschau aendert sich dadurch nicht, weil die Reparaturen nur bei LOOP>0 greifen. Zu viel steht aus dieser Gruppe nicht in der Liste.

### farbe (Farbschleier) — exakt

**begruendung:** Z.27875: einzige Zeitgroesse ist ph=(t/lpP(e.tempo))%1. lpP macht die Periode zu einem ganzzahligen Teiler von LOOP, also gilt (t0+L)/P = t0/P + ganze Zahl und ph ist bei t0+L gleich wie bei t0 (bis auf Gleitkomma-Rundung). Palette, i, j und die Mischung haengen nur an ph; Z.27876 fuellt die Flaeche statisch. Kein Zustand, kein Zufall.

### streifen (Laufstreifen) — haengt am Regler

**begruendung:** Z.28109: off=((t/lpP(e.tempo))%1)*per ist gerastet, die Lage der Baender wiederholt sich also exakt. Z.28112 gilt aber nur fuer ton==='beide': dunkel = (((i-Math.floor(t/lpP(e.tempo)))%2)+2)%2===1. Math.floor(t/P) waechst ueber den Clip um N=Math.round(LOOP/tempo). Ist N ungerade, dreht sich die Paritaet: an derselben Stelle y steht bei t0+L ein dunkles Band, wo bei t0 ein helles war. An der Naht springen dann alle Baender zwischen hell und dunkel um. Winkel, Breite und Anzahl haengen nicht an der Zeit.

**unterfaelle:** ton 'hell' und 'dunkel': exakt. ton 'beide' mit gerader Zahl N=round(LOOP/tempo): exakt. ton 'beide' mit ungerader Zahl N: bricht, alle Baender tauschen an der Naht hell und dunkel. Beispiel: LOOP 9,6 s bei Tempo 9 ergibt N=1.

**reparatur:** Fuer ton 'beide' auf die doppelte Periode rasten, damit N immer gerade ist: in Z.28109 und Z.28112 lpP(e.tempo) durch lpP(2*e.tempo)/2 ersetzen (einmal als const P ausrechnen). Bei LOOP=0 ergibt das wieder e.tempo.

### rauschen (Rauschausfall) — unsichtbare Naht

**begruendung:** Z.28117-28119: Ort, Helligkeit, Farbe und Laenge jedes Korns und jedes Dropout-Strichs kommen je Bild frisch aus Math.random(). Kein Bild gleicht dem naechsten, also auch nicht Bild t0 dem Bild t0+L. Weil jeder Uebergang ohnehin volles Zufallsrauschen ist, faellt die Naht nicht auf. Die Menge haengt an bp (Z.28116): ohne 'takt' ist bp=1 und fest. Mit 'takt' ist bp=min(1,pulswert(t,7,0)), das ueber DATA.schlaege laeuft. Im Export ist das das gleichmaessige Raster, das 2 Takte vor t0 beginnt, und pulswert schaut nur 1,5 s zurueck. Die Ausbruchsstaerke ist damit mit der Taktlaenge periodisch und bei t0 und t0+L exakt gleich. Kein Zustand in e._.

**unterfaelle:** takt aus: unsichtbare Naht (reines Zufallsrauschen). takt an: die Ausbrueche liegen exakt im Raster, die Koerner selbst sind Zufall, also ebenfalls unsichtbar. Sonderfall: erkennt ausschnitt() keinen Takt (takt<=0.05), gibt raster() die unveraenderten Schlaege zurueck. Dann rastet nichts, aber es gibt meist auch keine Schlaege.

### sicherung (Sicherungswackeln) — haengt am Regler

**begruendung:** Ausloeser frei, Z.28124: L=lpP(10/haeufigkeit), k=Math.floor(t/L), start=k*L+hs(k)*max(0,L-dauer). Die Einteilung in Fenster ist gerastet, aber k ist die absolute Fensternummer seit Songbeginn. Bei t0+L gilt k=k0+N mit N=LOOP/L, und hs(k0+N)!=hs(k0). Im Fenster ueber der Naht liegt der Einbruch am Clipende also woanders als am Clipanfang. Laeuft er gerade, wenn der Clip umspringt, wird er abgeschnitten und das Bild springt hart von dunkel auf hell. Die Wahrscheinlichkeit liegt etwa bei dauer/L, bei den Voreinstellungen ca. 5 %. Sonst sieht man nur ein 'anderes zufaelliges' Muster, das nicht auffaellt. Ausloeser im Takt, Z.28123: hs(i) mit i = Index im Schlag-Array. Das Raster hat bei t0+L den Index i0+proTakt*takte, die Auswahl der Schlaege wiederholt sich also nicht. Bei t0 und t0+L selbst ist amt=0 (u=0, env(0)=0). Die Naht bleibt unsichtbar, solange der Einbruch des letzten Schlags vor der Naht vorbei ist, also dauer <= Schlagabstand. Ist dauer laenger (bis 800 ms, bei schnellem Tempo moeglich), kann ein Einbruch ueber die Naht abgeschnitten werden. Zittern, Z.28122: zit=1-e.zittern*0.5*(0.5+0.5*Math.sin(2*Math.PI*37*t)), ein roher Sinus ohne lpW. Er wirkt nur waehrend eines Einbruchs. 37 Hz faltet sich bei 30 Bildern/s auf 7 Hz, und in einem Einbruch von ca. 5 Bildern wirkt das wie Zufallszittern. Fuer sich allein ist das eine unsichtbare Naht. Sichtbar wird es nur, wenn ein Einbruch ueber der Naht liegt, und das bricht schon am Ausloeser.

**unterfaelle:** frei (takt aus): bricht gelegentlich. Ein Einbruch ueber der Naht wird abgeschnitten, weil hs(k) mit der absoluten Fensternummer nicht umlaeuft. Takt an mit dauer <= Schlagabstand: unsichtbare Naht, bei t0 und t0+L ist amt=0. Takt an mit dauer > Schlagabstand: bricht gelegentlich (abgeschnittener Einbruch). Zittern allein (roher 37-Hz-Sinus): unsichtbare Naht, nur waehrend eines Einbruchs aktiv und bei 30 Bildern/s ohnehin aliasiert.

**reparatur:** Frei, Z.28124: im Loop die Fensternummer umlaufen lassen, mit const N=LOOP>0?Math.round(LOOP/L):0 und dann hs(N?((k%N)+N)%N:k) statt hs(k). Takt, Z.28123: hs(i) durch hs(N?((i%N)+N)%N:i) ersetzen, wobei N = Zahl der Schlaege in einem LOOP-Fenster ist (im Export proTakt*takte, z.B. als S.filter(s=>s[0]>=S[0][0]&&s[0]<S[0][0]+LOOP-1e-6).length). Zittern, Z.28122: Math.sin(lpW(2*Math.PI*37)*t). Alle drei greifen nur bei LOOP>0.

### scanlines (Scanlines / Roehre) — exakt

**begruendung:** Z.28246-28249: Das Linienmuster (e._mc, nur von e.raster abhaengig und gecacht) und die Vignette sind zeitunabhaengig. Die einzige Zeitgroesse ist das Flimmern in Z.28250: 0.5+0.5*Math.sin(2*Math.PI*lpR(8)*t). lpR(8) ist ein ganzzahliges Vielfaches von 1/LOOP, also ist der Sinus bei t0+L phasengleich. Der Cache e._mc ist ein Zustand, aber nicht zeitabhaengig.

### korn (Filmkorn) — unsichtbare Naht

**begruendung:** Z.28313-28314: schritt=round(1+(1-tempo)*12), also 1 bis 13. fr=Math.floor(t*60/schritt). Bei jedem Wechsel von fr wird die 96x96-Kachel neu aus Math.random() gefuellt (Z.28314). e._kn traegt nur 'welche fr zuletzt' weiter, kein Bildinhalt wird rueckgekoppelt. Bei tempo 1 (schritt 1, neues Korn alle 1/60 s) ist jedes der 30 Bilder neues Zufallskorn, die Naht ist unsichtbar. Bei kleinem Wechsel-Tempo haelt ein Korn bis 13/60=0,22 s (ca. 6,5 Bilder). Die Haltefenster liegen auf Vielfachen von schritt/60 absoluter Songzeit, nicht auf t0 und nicht auf L. An der Naht wird ein Haltefenster verkuerzt oder verlaengert, und das Korn selbst ist ohnehin anders (Zufall). Man sieht hoechstens einen einzelnen unregelmaessigen Kornwechsel in einem ohnehin stochastischen Flirren von ca. 4,6 Hz, als Naht praktisch nicht erkennbar. Koernung skaliert nur, zeitunabhaengig.

**unterfaelle:** Wechsel 1 (schritt 1): Zufall je Bild, unsichtbar. Wechsel klein (schritt bis 13): der Takt der Kornwechsel stolpert an der Naht einmal, das bleibt unauffaellig. Wer es rhythmisch sauber will: fr=Math.floor(t/lpP(schritt/60)).

**Gegenprüfung:** {"korrekturen": [], "bestaetigt": ["farbe", "streifen", "rauschen", "sicherung", "scanlines", "korn"]}

## Gruppe partikel-feuer

**LOOP_NEIN-Befund:** LOOP_NEIN=['nachzieh','wellen','kaustik','dunst','flammen'] stimmt fuer diese Gruppe nicht:\n\n1) partikel fehlt fuer drei Faelle:\n- Art 'schwaden' ohne Quelle (qs an rohem t, Z. 28161)\n- Art 'staub' (Math.sin(t*4+i), Z. 28177)\n- jede Art mit 'Windstoesse im Takt' (hs(j+7000) am Rasterindex, Z. 28132)\n\n2) feuer fehlt fuer:\n- Antriebsform 'flackern'\n- Quelle 'zufall'\n- Teiler, der die Schlaege je Clip nicht teilt\n\nDas betrifft alle antriebsgetriebenen Effekte, nicht nur feuer.\n\nZu viel steht aus dieser Gruppe nichts in der Liste. Weil die Faelle am Regler haengen, reicht eine Liste von Typnamen nicht. Z. 29161 muesste je Karte pruefen, etwa mit einer Funktion loopNein(e): e.typ==='partikel'&&((e.art==='schwaden'&&(e.qForm||'bild')==='bild')||e.art==='staub'||e.boeen). Besser ist, die drei Stellen zu reparieren, dann entfaellt der Eintrag.\n\nAusserdem sollte der Nutzer erfahren (oder es wird behoben): Im Export ziehen Partikel ohne Quelle durch lpV mit max(1,..) mindestens eine Bildbreite je Clip seitwaerts, auch bei Wind 0 oder negativem Wind. Langsame Arten fallen dort bis zu achtmal schneller. Das loopt, weicht aber sichtbar von der Vorschau ab.

### partikel (Partikel) — haengt am Regler

**begruendung:** Nachgelesen in malen() ab Z. 28127, flugbahn() Z. 27818, raster() Z. 29083 und in den Helfern Z. 27474-27477.

GERASTET (exakt):
- Eigenbewegung 'wandern' (Z. 28168/28169): alle sechs Sinusterme laufen ueber lpW(0.31/0.73/1.7/0.27/0.83/1.9)*t.
- Fall ohne Quelle, je Art: y=((y0+aS*t*v)%Hn...) mit v=lpV(...,Hn). x: +lpV(w*Hn*k,Wn)*t, und das Taumeln laeuft ueber Math.sin(lpW(..)*t+i). Das gilt fuer schnee (28173), regen (28174), asche (28175), blasen (28176), gluehwuermchen (28178), schmetterling (28197, lpW(1.1)), blaetter (28209, lpW(1.2)), schwaden (28210, lpW(0.3)) und funken (28235, lpW(3)).
- staub-Weg (28177): lpV(...*0.4,Hn)/0.4, danach *0.4. Das rastet ebenfalls sauber.
- Mit Quelle, flugbahn(): tau=lpP(weg/tempoWeg) und alter=((t-ph)%tau+tau)%tau (27827). s, q und Alpha haengen nur an alter. vW*alter ist periodisch, auch bei negativem Wind. qs=F[3] ist gerastet.
- gluehwuermchen-Blinken: per=lpP(2.2+hs*3.6) und bp=((t/per+hs)%1) (28187/28188). puls haengt an per. Exakt.
- schmetterling-Fluegelschlag: Math.abs(Math.sin(lpW(1.7+hs*1.6)*t+..)) (28203). Taumeln: rotate(Math.sin(lpW(0.9)*t..)) (28204). Exakt.
- blaetter-Drehung: rot=lpW(1.5+hs*2)*t+i (28209). Exakt.
- funken-Flackern: Math.sin(lpW(23)*t+i*5) (28235). Exakt.
- Die Maske (partikelMaske, Schluessel ohne t) und die Farben sind zeitunabhaengig.

BRICHT:
1) schwaden OHNE Quelle (qForm 'bild'): qs=((t*0.11*e.tempo+hs(i+9600))%1+1)%1 (Z. 28161) nutzt rohes t, Periode 9,09 s/tempo. qs steuert g6=(6+22*qs)/6, R=sz*6*g6 und kond=min(1,qs*4) (28228). Radius (bis zum 4,7-fachen) und Dichte jeder Schwade springen an der Naht. Deutlich sichtbar.
2) staub, mit UND ohne Quelle: cx.globalAlpha=al*(0.15+0.85*tief)*(0.7+0.3*Math.sin(t*4+i)) (28177) nutzt rohes t, 4 rad/s. Jedes Staubkorn springt an der Naht um bis zu 60 % in der Helligkeit. Das ist leise, aber rohes t.
3) 'Windstoesse im Takt' (boeen an), alle Arten: boe (28132) nimmt h=hs(j+7000) und die Richtung hs(j+8000). j ist der INDEX im Schlagraster. raster() baut ab j=-2*proTakt, also liegt t0 auf Index 2*proTakt und t0+L auf Index 2*proTakt+takte*proTakt. Die Zufallswahl, welche Schlaege einen Stoss geben und in welche Richtung, laeuft darum nicht mit L um. gx=boe*(..) verschiebt alle Teilchen bis zu Wn*0.25*boeenStaerke. Sichtbarer Sprung.

NEBENBEFUND (keine Naht, aber Export weicht deutlich von der Vorschau ab): lpV rundet mit Math.max(1,Math.round(v*LOOP/weite)), also nie auf 0 und nie negativ.
- Wind: Z. 28173 ff. lpV(w*Hn*0.05,Wn). Bei w=0.1, Hn=1080, Wn=1920, L=10 ergeben sich 5,4 px/s, gerundet round(0.03)=0, also 1, also 192 px/s. Die ganze Wolke zieht in 10 s einmal quer durchs Bild. Wind 0 wird ebenfalls 192 px/s, und negativer Wind blaest im Export nach rechts.
- Fall: langsame Arten (staub, gluehwuermchen, schmetterling, asche) und alle Teilchen mit kleinem sp werden auf mindestens Hn/L=108 px/s gehoben. Alle fallen gleich schnell, die Parallaxe fehlt, und Staub faellt etwa achtmal zu schnell.
- Aehnlich lpW: 0.31, 0.27 und 0.73 rasten bei L=10 alle auf 0.628. Die 'drei verschiedenen Raten' der Eigenbewegung fallen zusammen. Das loopt trotzdem.

**unterfaelle:** Die Grundregeln gelten fuer jede Art einzeln: Mit Quelle loopt es ueber flugbahn (lpP), ohne Quelle ueber lpV/lpW.

Exakt, sofern boeen AUS:
- schnee, regen, asche, funken, blasen, blaetter, gluehwuermchen, schmetterling
- jeweils mit und ohne Quelle, mit und ohne 'wandern'

Bricht:
- schwaden OHNE Quelle, immer (qs an rohem t). Schwaden MIT Quelle ist exakt.
- staub, immer, mit und ohne Quelle (Math.sin(t*4+i)).
- jede Art, sobald 'Windstoesse im Takt' an ist (hs(j+7000) am Rasterindex).

**reparatur:** 1) Z. 28161: qs=((t*lpR(0.11*e.tempo)+hs(i+9600))%1+1)%1
2) Z. 28177: Math.sin(lpW(4)*t+i) statt Math.sin(t*4+i)
3) Z. 28132: im Loop den Index auf die Schlaege je Clip falten, etwa
   const N=LOOP>0&&S.length>1?Math.round(LOOP/(S[1][0]-S[0][0])):0, jj=N?((j%N)+N)%N:j;
   danach hs(jj+7000) und hs(jj+8000).

Alle drei greifen nur bei LOOP>0 (lpR/lpW sind sonst die Identitaet), die Vorschau bleibt unveraendert.

Fuer den Nebenbefund: Wind mit Vorzeichen ueber Math.sign(w)*lpV(Math.abs(w)*..) fuehren. Und lpV fuer Seitendrift runden ohne max(1,..), 0 Umlaeufe loopt ja auch. Das aendert die Vorschau ebenfalls nicht, nur den Export.

### feuer (Feuer) — haengt am Regler

**begruendung:** Die Flammen selbst sind vollstaendig gerastet (Z. 28252-28278):
- Flackern: fl=1-e.flackern*0.5*(0.5+0.5*Math.sin(lpW(9+7*hs(i+400))*t+hs(i+500)*100)) (28270)
- Aufsteigen: h=(k/M+t*lpR(e.tempo*sp*0.9)+hs(i+700))%1 (28275)
- Seitliches Wackeln: sway=Math.sin(lpW(3*sp)*t+hs(i+800)*10+k) (28275)
- wnd, Glut, Schein und Farben sind zeitunabhaengig. lichtOrtMelden ist statisch.

Die einzige weitere Zeitgroesse ist der Hoehenschub bp=1+0.5*lmSchub(e,t) (28254), also antriebWert (27542):
- Quelle 'stetig': bp=1, exakt.
- Quelle 'hz': hz=lpR(..) und p=frac(t*hz). Exakt fuer Formen, die nur p lesen.
- Quelle 'takt' (Vorgabe, Z. 27298) mit Teiler 1: p aus dem gleichmaessigen Raster, exakt. rampe_ab, rampe_auf, sinus, rechteck, peak und sequenz lesen nur p.
- Quelle 'eins': a und b laufen auf die Einsen, exakt.
- Bruchteile (teil<1): p ist periodisch, exakt.

BRICHT:
(a) Form 'flackern': lmFlacker(e.id*37+11, idx+p) (27579). idx ist der Rasterindex bzw. floor(t*hz) und laeuft nicht mit L um. Bei hz verschiebt sich u um die ganze Zahl hz*L, lmHash liefert andere Werte.
(b) Quelle 'zufall': lmHash(idx*3+e.id*31) (27571), dieselbe Ursache.
(c) Teiler n>1, wenn n die Zahl der Schlaege im Clip (takte*proTakt) nicht teilt: a=i-(i%n) (27569) mit dem Rasterindex i, die Gruppierung verrutscht an der Naht. Beispiel: Teiler 3, 4/4, 5 Takte.

Die Feuerhoehe springt dann an der Naht bis zur Schubtiefe (bis zum Anderthalbfachen). Dieser Befund gilt fuer jeden Effekt, der antriebWert oder lmSchub nutzt, nicht nur fuers Feuer.

**unterfaelle:** Exakt:
- Antrieb 'stetig'
- 'takt' und 'eins' mit Teiler 1 oder Bruchteil, in allen Formen ausser 'flackern'
- 'hz' in allen Formen ausser 'flackern'
- auch der schlagfreie Rueckfall ueber lpR, solange nicht 'flackern' oder 'zufall'

Bricht:
- Form 'flackern' bei jeder Quelle ausser 'stetig'
- Quelle 'zufall'
- Teiler n, der takte*proTakt nicht teilt

**reparatur:** In antriebWert idx im Loop auf die Periodenzahl im Clip falten, bevor er in lmHash oder lmFlacker geht.
- Rasterquelle: N=Math.round(LOOP/(S[1][0]-S[0][0]))*k bzw. /n, dann idx=((idx%N)+N)%N.
- 'hz': N=Math.round(hz*LOOP), fuer lmFlacker u=((idx%N)+N)%N+p.

lmFlacker glaettet ueber i und i+1 bei der Oktavrate f. Exakt wird es erst, wenn auch dort i modulo N*f gefaltet wird, also lmHash(seed+((i%(N*f))...)). f=3, 6.9, 15.87 ist nicht ganzzahlig. Kleinster sichtbar-sauberer Weg: im Loop f auf ganze Zahlen runden (3, 7, 16).

Teiler: a=i-(i%n) auf den Index relativ zu t0 beziehen, dazu im Loop auf ein Vielfaches von n fuer die Schlaege je Clip achten.

Alles nur unter LOOP>0, die Vorschau aendert sich nicht.

**Gegenprüfung:** {"korrekturen": [], "bestaetigt": ["partikel (haengt am Regler): bestaetigt. Exakt ohne Boeen: schnee, regen, asche, blasen, gluehwuermchen, schmetterling, blaetter, funken, jeweils mit und ohne Quelle und mit und ohne 'wandern'. Schwaden MIT Quelle ist ebenfalls exakt, weil qs=F[3]=alter/tau ueber lpP laeuft (Z. 27827/27835). Bricht: schwaden OHNE Quelle, weil qs=((t*0.11*e.tempo+hs(i+9600))%1+1)%1 an rohem t haengt (Z. 28161) und ueber g6/R/kond Radius und Dichte steuert (Z. 28228). Bricht: staub immer, wegen Math.sin(t*4+i) (Z. 28177). Eine Randkorrektur zur Zahl: der Faktor 0.7+0.3*sin laeuft von 0,7 bis 1,0, der Sprung betraegt also hoechstens 30 Prozentpunkte (etwa 43 % relativ), nicht 60 %. Am Urteil aendert das nichts. Bricht: jede Art mit boeen, weil hs(j+7000)/hs(j+8000) am absoluten Rasterindex j haengt (Z. 28132; raster ab j=-2*proTakt, Z. 29087) und sich zwischen t0 und t0+L um takte*proTakt verschiebt. Geprueft: quellPunkt (Z. 27804 ff.) ist zeitfrei. Partikel liest keinen Antrieb (kein antriebWert/lmSchub), und die Kette multipliziert ihn in Z. 28901 nur fuer Effekte der Art post/gl, nicht fuer mal. Die Zwischenleinwaende e._rc/_rl/_vc werden in jedem Bild geleert, es wird also kein Zustand weitergetragen. Der Nebenbefund stimmt: lpV mit max(1,..) macht Wind 0 oder negativen Wind zu einem positiven Umlauf. Das loopt, weicht aber von der Vorschau ab.", "feuer (haengt am Regler): bestaetigt. Die Flammen sind vollstaendig gerastet: lpW(9+7*hs) in Z. 28270, t*lpR(e.tempo*sp*0.9) und lpW(3*sp) in Z. 28275. Die einzige weitere Zeitgroesse ist lmSchub, also antriebWert (Z. 28254). Exakt: 'stetig'; 'hz' mit einer Form ausser flackern (hz=lpR, Z. 27544); 'takt' mit Teiler 1; 'eins'; Bruchteile (p periodisch, Z. 27565-27568). Bricht: Form 'flackern' bei jeder nicht stetigen Quelle, weil lmFlacker(e.id*37+11, idx+p) mit absolutem idx rechnet (Z. 27579) und f=3/6.9/15.87 den Index zusaetzlich verschmiert (Z. 27531-27534). Bricht: Quelle 'zufall', wegen lmHash(idx*3+e.id*31) (Z. 27571), auch in Kombination mit 'eins', dort ist idx=a absolut. Bricht: Teiler n, der takte*proTakt nicht teilt, weil a=i-(i%n) am absoluten Rasterindex haengt (Z. 27569). Der schlagfreie Rueckfall (Z. 27555 f.) wird im Export praktisch nie erreicht, denn raster() baut auch ohne Schlaege ein Raster mit proTakt=4. feuer ist vom Typ 'mal', die Alpha-Multiplikation in Z. 28901 greift also nicht zusaetzlich."]}

## Gruppe nachbearbeitung

**LOOP_NEIN-Befund:** In dieser Gruppe stimmt LOOP_NEIN nur fuer 'nachzieh', und der Eintrag ist richtig (Rueckkopplung in e._spur, dazu der weiterlaufende rahmen(), der die Spur waehrend des Exports stoert). Fehlen, obwohl sie je nach Einstellung brechen: 'wackeln' (Kick im Takt bei ungeradem proTakt*takte, wegen i%2 am rohen Feldindex, Z.28546), 'rgb' und 'bloom' (Antrieb mit Form flackern, mit Teiler, der proTakt*takte nicht teilt, oder zufall auf schlagfreiem Titel). Die Ursache liegt in antriebWert (Z.27569/27571/27579), betrifft also alle Effekte mit Antrieb, nicht nur diese Gruppe. Eine reine Typ-Liste kann das nicht ausdruecken: Die Pruefung muesste die Einstellung der Karte (lmForm, lmTeiler, lmQuelle, takt) mit proTakt*takte vergleichen, oder man repariert antriebWert per Modulo und die Eintraege werden unnoetig. Zu viel steht in dieser Gruppe nichts drin. vlauf, spiegel und bloecke (nur unsichtbare Naht) gehoeren zu Recht nicht hinein.

### vlauf (Bildlauf) — exakt

**begruendung:** Z.28539: off=((t/lpP(e.tempo)*dir)%1+1)%1*L. lpP liefert LOOP/n, also t/p=t*n/LOOP; bei t0+L kommt genau n (ganzzahlig) dazu, der Bruchteil ist gleich. Der Ruck im Takt, off+pulswert(t,6,0)*L*0.3, liest nur DATA.schlaege, und die kommen im Export aus raster(): gleichmaessig, mit 2 Takten Vorlauf vor t0 (Z.29087, j ab -2*proTakt). Die Abklingsumme in pulswert (Blick 1,5 s zurueck, Z.27483) ist deshalb periodisch. Band, Richtung und Masse haengen nicht an der Zeit. Keine Zufallswerte, kein Zustand.

**unterfaelle:** Ruck im Takt an und aus: beide exakt. Nur theoretisch: Wenn 2 Takte kuerzer als 1,5 s sind (ueber 320 BPM im 4/4), fehlt beim ersten Bild ein Rest der Abklingkurve. Der liegt bei exp(-6*dt) unter 1e-4, also unsichtbar.

### wackeln (Verwackeln) — haengt am Regler

**begruendung:** Z.28547: Das Warble Math.sin(lpW(e.tempo)*t+i*1.3)*amp ist gerastet, lpW macht w*L zu einem Vielfachen von 2*PI, also exakt. Im selben Ausdruck steht aber (Math.random()-.5)*amp*0.4 je Band und je Bild. Dieses Zittern ist nicht bitgleich, faellt als Zufall je Bild an der Naht aber nicht auf (unsichtbare Naht). Kick (Z.28544/28546): bp=pulswert(t,7,0) laeuft ueber das Raster, exakt. Die Richtung ist aber ((i%2)?-1:1), und i ist der ROHE Index im Rasterfeld. Bei t0 ist i=2*proTakt (gerade), bei t0+L ist i=2*proTakt+proTakt*takte. Ist proTakt*takte ungerade, kippt die Paritaet: An der Naht schlagen zwei Schlaege nacheinander in dieselbe Richtung, statt dass links und rechts wechseln. Das sieht man.

**unterfaelle:** Kick im Takt aus: unsichtbare Naht (nur Math.random-Zittern). Kick an mit proTakt*takte gerade (Normalfall 4/4, z. B. 4x5=20): unsichtbare Naht. Kick an mit proTakt*takte ungerade (3/4, 5/4 oder 7er-Raster mit ungerader Taktzahl, z. B. 3x3=9): bricht, die Wechselrichtung stolpert an der Naht. Randfall: Findet taktLaenge keinen Takt (takt<=0.05), gibt raster() die rohen, unregelmaessigen Schlaege zurueck und L haengt nicht am Schlag. Dann bricht der Kick immer.

**reparatur:** Die Richtung aus der Schlagzeit statt aus dem Feldindex ableiten, z. B. Math.round((S[i][0]-S[0][0])/schritt)%2 mit schritt=S[1][0]-S[0][0]. Das hilft aber nur, wenn die Schlaege je Loop gerade sind. Kleinster sicherer Eingriff: In ausschnitt() takte so waehlen, dass proTakt*takte gerade ist (bei ungeradem proTakt einen Takt weniger). Wer das Zittern bitgleich will: Math.random durch hs(Bildindex modulo N, Band) ersetzen. Das ist fuer die Naht aber nicht noetig.

### rgb (Farbkanal-Puls) — haengt am Regler

**begruendung:** Z.28548: Einzige Zeitgroesse ist hub aus pulsHub(e,t) (Z.27610) und damit antriebWert (Z.27542ff). Versatz, Winkel und Masken sind zeitlos. Voreinstellung (Z.27351): lmQuelle 'takt', Teiler 1, Form rampe_ab. Dann ist idx=a=i der Schlag und p=(t-S[a][0])/Abstand (Z.27570). Das Raster ist periodisch, also exakt. Quelle 'hz' (Z.27544): hz=lpR(...), x=t*hz; hz*L ist ganzzahlig, die Phase p also periodisch: exakt. Quelle 'eins': Das Raster setzt die Eins bei j%proTakt==0 (Z.29087), und t0+L ist j=proTakt*takte, wieder eine Eins: exakt. Teiler<1 (Z.27565ff): p haengt nur an Schlagabstaenden: exakt. Brueche: (1) Teiler n>1: a=i-(i%n) mit rohem Feldindex (Z.27569). Ist proTakt*takte kein Vielfaches von n, springt die Gruppenphase an der Naht (p springt, der Puls wird abgeschnitten oder doppelt). (2) Form 'flackern' (Z.27579): lmFlacker(e.id*37+11, idx+p). idx ist der rohe Schlag- bzw. Periodenindex (bei hz ist idx+p=t*hz absolut), also bei t0+L um proTakt*takte bzw. hz*L verschoben. Das Wertrauschen hat dort einen anderen Wert, und an der Naht springt der Pegel. (3) Quelle 'zufall': aktiv=lmHash(idx*3+e.id*31) (Z.27571) mit rohem idx. Die Naht liegt aber auf einem Schlag, und jeder Schlag wird unabhaengig gewuerfelt: unsichtbare Naht.

**unterfaelle:** stetig: exakt (hub=1). takt/Teiler 1, eins, Teiler<1, hz mit allen Formen ausser flackern (auch sequenz, sinus, rechteck): exakt. zufall mit Teiler 1: unsichtbare Naht. Teiler n>1: exakt nur, wenn (proTakt*takte)%n==0 (4/4 mit n=2 oder 4 immer), sonst bricht es (z. B. n=3 bei 20 Schlaegen). flackern: bricht, deutlich bei langsamer Periode (kleines lmHz, grosser Teiler), bei schnellen Perioden kaum zu sehen, weil die feinen Oktaven ohnehin je Bild zappeln. Titel ohne Schlaege (Rueckfall auf Frequenz, Z.27555f): Phase exakt. Dort liegt t0=jetzt aber mitten in einer Periode, also flippt bei zufall das aktiv-Flag mitten im Puls: bricht. flackern bricht auch dort.

**reparatur:** In antriebWert, nur wenn LOOP>0: idx modulo Schlaege bzw. Perioden je Loop nehmen (Schlaege: nL=Math.round(LOOP/(S[1][0]-S[0][0])); hz: nL=Math.round(hz*LOOP)). Dann u=(idx mod nL)+p fuer lmFlacker und fuer lmHash. Beim Flackern bleibt dann trotzdem der Sprung von u~nL auf u~0, also zusaetzlich das Rauschen am Ende einer Loop-Periode auf den Anfang zurueckfuehren (v1 bei i+1==nL aus i=0 lesen). Teiler n: in ausschnitt() takte so waehlen, dass proTakt*takte durch n teilbar ist, oder a=i-((i-i0)%n) mit i0=Index von t0. Die Vorschau aendert sich durch nichts davon (alles hinter LOOP>0 bzw. im Export-Ausschnitt).

### bloom (Bloom / Halation) — haengt am Regler

**begruendung:** Z.28570: Das Bild selbst ist zeitlos, nur filter blur/contrast/brightness auf srcCv. Bloom hat aber lmParams (Z.27298, ['bloom',{}], Voreinstellung stetig) und kein lmNurSchub. Deshalb legt die Kette die Deckkraft auf e.staerke*antriebWert(e,t) (Z.28901). Zeitabhaengig ist also allein antriebWert, mit denselben Faellen wie beim Farbkanal-Puls.

**unterfaelle:** stetig (Voreinstellung): exakt, antriebWert=1. takt/eins/Teiler<1/hz mit Formen ausser flackern: exakt. zufall: unsichtbare Naht (je Schlag gewuerfelt, Naht auf dem Schlag). Teiler n mit (proTakt*takte)%n!=0: bricht. Form flackern: bricht (lmFlacker an rohem idx+p). Titel ohne Schlaege mit zufall: bricht (Naht mitten in der Periode).

**reparatur:** Dieselbe wie beim Farbkanal-Puls: idx in antriebWert bei LOOP>0 modulo Schlaege/Perioden je Loop, Teiler-Teilbarkeit in ausschnitt(). Vorschau unveraendert.

### nachzieh (Nachzieheffekt) — bricht

**begruendung:** Z.28553-28556: Rueckkopplung. cres zeichnet srcCv und darueber e._spur mit globalAlpha=e.nachhall und Versatz (cos/sin(rad)*d). Danach wird das Ergebnis ores nach e._spur kopiert. Der Zustand wandert von Bild zu Bild in e._spur. Beim Exportstart haelt _spur, was die Live-Vorschau zuletzt gemalt hat, oder es ist leer, wenn es wegen einer anderen Groesse neu angelegt wird (Z.28553). Bild 0 zeigt also einen fremden oder gar keinen Geist, Bild N-1 den aufgelaufenen Geist des Clips. An der Naht springt die Spur. Nachhall bis 0.98 (Parameter): 0.98^90 ist etwa 0.16, der Geist ist also ueber Sekunden sichtbar. Dazu kommt: rahmen() (Z.28842) laeuft waehrend des Exports per requestAnimationFrame weiter. Im MediaRecorder-Weg wird jedes Bild awaited, im Kodierer-Weg zumindest bei voller Warteschlange. rahmen ruft ergebnis() mit derselben e und der Live-Groesse auf. Weicht die von W x H ab, wird e._spur staendig neu angelegt (Spur geleert) oder mit Vorschaubildern verschmutzt. Die Spur ist also schon innerhalb des Clips nicht verlaesslich.

**unterfaelle:** Kein Regler rettet es. Kleiner Nachhall (0.5) verkuerzt nur das Stueck nach Bild 0, in dem die Spur fehlt, auf wenige Bilder.

**reparatur:** Vorlauf im Export: vor Bild 0 die letzten K Bilder des Loops (Zeiten t0+((N-K+i)%N)/rate) ungezaehlt durch zeichneFrame schicken, K etwa log(0.005)/log(nachhall), hoechstens N. Dann steht in _spur bei Bild 0 praktisch derselbe Geist wie nach Bild N-1. Zusaetzlich die Spur vom Live-Pfad trennen: _spur je Groesse bzw. je Leinwandsatz halten (z. B. e._spur im Export aus m statt an e) oder rahmen() waehrend des Exports aussetzen. Die Vorschau aendert sich nicht. Ohne diese Reparatur bleibt der Eintrag in LOOP_NEIN richtig.

### spiegel (Spiegelung (Wasserflaeche)) — exakt

**begruendung:** Z.28558: einzige Zeitgroesse ist dx=...*Math.sin(y*e.skala/Hn*2*Math.PI+lpW(e.tempo)*t)*(0.3+tief). lpW rastet die Kreisfrequenz auf ganze Umlaeufe je L. y*skala ist raeumlich. Horizont, Verblassen-Verlauf (Z.28559) und Streckung der obersten Zeile sind zeitlos. Kein Antrieb (keine lmParams), Deckkraft e.staerke*1. Kein Zufall, kein Zustand.

### bloecke (Glitch-Bloecke) — unsichtbare Naht

**begruendung:** Kein Math.random. Alles haengt an hs(x) mit Saat e.id (Z.28560), aber an Nummern, die NICHT mit L umlaufen. Im Takt (Z.28561): i ist der rohe Feldindex des Rasters. Ein Glitch entsteht, wenn hs(i+7000)<haeufigkeit/10 und t-S[i][0]<=dauer. Die Blocklage kommt aus q=slot*131+b*17 mit slot=i (Z.28563). Bei t0 ist i=2*proTakt, bei t0+L ist i=2*proTakt+proTakt*takte: andere Wuerfel, Bild(t0)!=Bild(t0+L). Jeder Glitch lebt aber nur innerhalb seines eigenen Schlags (nur der letzte Schlag zaehlt), und die Naht liegt genau auf einem Schlag. Der Clip ist also eine gueltige Folge unabhaengiger Zufallsschlaege, und niemand sieht, welcher Schlag gewuerfelt war. Frei (Z.28562): Periode Lp=lpP(10/haeufigkeit) ist gerastet, k=Math.floor(t/Lp) aber absolut, und start=k*Lp+hs(k)*(Lp-dauer). t0 liegt i. d. R. mitten in einer Periode (Perioden haengen am absoluten Nullpunkt, nicht an t0). An der Naht werden der Anfang von Periode k_b+m und der Rest von Periode k_b zusammengeklebt. Die gespleisste Periode kann 0, 1 oder 2 Glitches haben, und ein Glitch, der die Naht kreuzt (Wahrscheinlichkeit etwa dauer/Lp, bei Vorgabe 0.16/3.3 etwa 5 %), wechselt mitten im Aufblitzen seine Bloecke. Bei einem Effekt, der aus zufaelligen Spruengen besteht, liest sich das als ein weiterer Glitch.

**unterfaelle:** nur im Takt (Voreinstellung): unsichtbare Naht bei jedem Raster (Naht immer auf einem Schlag). Randfall: Findet taktLaenge keinen Takt, gibt raster() rohe Schlaege zurueck, die Naht liegt nicht auf einem Schlag, und ein Glitch kann angeschnitten werden (selten, ebenfalls kaum sichtbar). frei: unsichtbare Naht mit etwa dauer/Lp Wahrscheinlichkeit eines angeschnittenen bzw. springenden Glitchs genau an der Naht.

**reparatur:** Fuer bitgleich nur bei LOOP>0 die Nummer modulo nehmen. Frei: m=Math.round(LOOP/Lp), kk=((k%m)+m)%m, dann hs(kk) und slot=kk. Periode k_b+m wird damit identisch zu k_b, exakt, egal wo t0 in der Periode liegt. Takt: nL=Math.round(LOOP/(S[1][0]-S[0][0])), ii=((i%nL)+nL)%nL fuer hs(ii+7000) und slot. Das ist exakt, weil t0 und t0+L im Raster denselben Rest haben (2P mod PT). Die Vorschau aendert sich nicht (LOOP=0).

**Gegenprüfung:** {"korrekturen": [], "bestaetigt": ["vlauf", "wackeln", "rgb", "bloom", "nachzieh", "spiegel", "bloecke"]}

## Gruppe shader-glas

**LOOP_NEIN-Befund:** LOOP_NEIN (Z.27480) = ['nachzieh','wellen','kaustik','dunst','flammen']. Fuer diese Gruppe stimmt die Liste nicht. (1) 'dunst' ist ein toter Eintrag: Es gibt keinen EFFEKTE-Typ 'dunst' mehr, alte Rezepte werden beim Laden zu 'filmnebel' umgeschrieben (Z.28992 filmnebelAusTheater). Der Kommentar ueber der Liste nennt dagegen 'vier Shader'. (2) Es FEHLT 'filmnebel': Er bricht bei jedem Schwaden > 0 (u_t in zug und zt, Z.28496/28497). (3) Es FEHLT 'einschlag': Er bricht immer (Hash am absoluten Rasterindex und nur 2 Takte Vorlauf). (4) 'risse' bricht nur mit Wachsen 'im Takt'. Die Liste kann das nicht ausdruecken, weil sie nur Typen kennt: Entweder den Export dort ausgewachsen malen (Reparatur oben) oder die Liste zu einer Pruefung je Effekt machen (e=>e.typ==='risse'&&e.wachsen==='takt'). Wellen, kaustik und flammen stehen zu Recht drin. Linse, beschlag und tropfen stehen zu Recht nicht drin.

### filmnebel (Filmnebel) — haengt am Regler

**begruendung:** GL.run Z.28375 gibt u_t roh an den Shader. Z.28496 `vec2 zug=vec2(u_luftzug,steigen)*u_t*0.09`, dabei ist steigen=mix(0.22,-0.14,u_schwere) (Z.28495) fast immer ungleich 0. Die Drift wandert also auch bei Luftzug 0 endlos. Z.28497 `zt=vec3(0,0,u_t*(0.18+0.82*abs(u_luftzug))*0.55)`: Die Zeit steht linear in der z-Achse des Rauschens, und die Summe ist nie 0. Bei den Vorgaben (schwere .25, luftzug .15) laeuft das Rauschen in 10 s um etwa 1,7 Einheiten weiter. Das ist voellig unkorreliert, eine harte Naht. Beides geht nur ueber g ins Bild: Z.28498 wolke(...), dann Z.28499 `ballen=mix(1.0, smoothstep(..g), u_schwaden)`. Zeitunabhaengig sind: umgebung() (Z.28481, der Winkel haengt nur an uv), lager, fern/Tiefenkarte, u_licht und u_hof (die kommen von anderen Effekten). Die Leinwand ohne WebGL, filmnebelLeinwand Z.27622-27630, hat gar kein t. Filmnebel steht NICHT in LOOP_NEIN.

**unterfaelle:** Schwaden = 0: ballen=1, g faellt heraus, der Effekt ist zeitunabhaengig und damit exakt. Schwaden > 0: bricht, die Naht waechst mit Schwaden (bei 0,05 kaum, bei der Vorgabe 0,45 deutlich). Ohne WebGL (filmnebelLeinwand): exakt.

**reparatur:** Zwei neue Uniforms, u_loop=LOOP und u_t0=t0. Im Shader, wenn u_loop>0: tt=mod(u_t-u_t0,u_loop). g wird zweimal ausgewertet, mit tt und mit tt-u_loop, und dann per mix(gA,gB,tt/u_loop) ueberblendet. Die Zeilen fuer zug und zt nutzen tt statt u_t. Echte Alternative: 4D-Rauschen auf einem Zeitkreis.

### wellen (Wellen (Brechung)) — bricht

**begruendung:** Z.28392 `vec3 p=vec3(uv*u_skala, u_t*u_tempo); p.y-=u_t*u_aufwind*2.0;`. u_t kommt roh (Z.28375), u_tempo hat mindestens 0,1 (Params Z.27227). Die Zeit steht also linear in der dritten Rauschkoordinate, und snoise ist nicht periodisch. Aufwind schiebt zusaetzlich endlos in y. Der Versatz d (Z.28393) ist bei t0 und t0+L verschieden, das Bild springt an der Naht.

**unterfaelle:** Keine Einstellung loopt, weil Tempo nicht auf 0 gestellt werden kann. Nur Amplitude 0 waere trivial exakt.

**reparatur:** Wie beim Filmnebel: u_loop/u_t0 dazu, tt=mod(u_t-u_t0,u_loop). d wird fuer tt und fuer tt-u_loop ausgewertet und mit tt/u_loop gemischt. Ob man d oder das Texturbild mischt, ist gleichwertig, d ist billiger.

### kaustik (Kaustik (Lichtnetz)) — bricht

**begruendung:** Z.28396 `vec3 p=vec3(v_uv*u_skala, u_t*u_tempo)`, Tempo mindestens 0,1. u_t steht roh in der Rauschkoordinate, und n1/n2 (Z.28397) laufen endlos weiter. Das Netz an t0+L hat mit dem Netz an t0 nichts zu tun.

**unterfaelle:** Keine Einstellung loopt.

**reparatur:** u_loop/u_t0 dazu, tt=mod(u_t-u_t0,u_loop). k wird fuer tt und tt-u_loop gerechnet und mit tt/u_loop gemischt. Nebenwirkung nur im Export: In der Clipmitte liegen zwei halb helle Netze uebereinander, die Linien werden dort weicher.

### linse (Linse) — exakt

**begruendung:** Der Shader Z.28399-28404 liest weder u_t noch u_takt. Er haengt nur an u_woelbung, u_farbrand und v_uv. Zeitunabhaengig, loopt, sobald das Bild darunter loopt. Steht zu Recht nicht in LOOP_NEIN.

### flammen (Flammen (Rauschen)) — bricht

**begruendung:** Z.28532 `vec3 p=vec3(x*6.0, h*4.0 - u_t*u_tempo*2.0, u_t*0.4)`. u_t steht roh in y (Aufstieg) und in z (Wabern), Tempo mindestens 0,2. Das fbm ist nicht periodisch, die Zungen an der Naht springen. Der Schub u_takt (Z.28376, lmSchub, dann antriebWert) rastet dagegen: 'hz' ueber lpR (Z.27544), Schlag und Eins ueber das Schlagraster. Er aendert nur die Hoehe hh (Z.28524) und bricht nicht selbst. Einschraenkung beim Antrieb: Quelle 'zufall' hasht lmHash(idx*3+e.id*31) mit dem absoluten Rasterindex idx, und der laeuft nicht mit der Periode um. Das betrifft aber alle Effekte mit Antrieb.

**unterfaelle:** Keine Einstellung loopt, weil der Term u_t*0.4 fest ist und von keinem Regler abhaengt.

**reparatur:** u_loop/u_t0 dazu, tt=mod(u_t-u_t0,u_loop). n wird fuer tt und tt-u_loop ausgewertet und mit tt/u_loop gemischt.

### risse (Risse im Glas) — haengt am Regler

**begruendung:** Die Geometrie risseBauen (Z.27663-27672) haengt nur an einschlaege, aeste, laenge, muster und der Groesse, sie hat keine Zeit. Z.27838 wachsen='zeit': `lim=(LOOP>0?1:...)*(R.maxOrd+1)`, im Export also ausgewachsen und statisch. Z.27839 wachsen='takt': `for(const s of DATA.schlaege){ if(s[0]<=t) b++; } lim=b` zaehlt monoton alle Rasterschlaege bis t. Das Raster (Z.29087) beginnt bei j=-2*proTakt. Bei t0 ist b=2*proTakt+1, bei 4/4 also 9. Bei t0+L ist b um proTakt*takte groesser. maxOrd liegt bei 5 bis 13 Schritten plus Aesten (ord zaehlt in den Aesten weiter) meist ueber 9. Der Riss waechst also in den ersten Takten des Clips fertig: Am Clipanfang ist er halb, am Ende ganz.

**unterfaelle:** stehend: exakt. mit der Zeit: exakt, weil im Export ausgewachsen; das weicht von der Vorschau ab, ist aber gewollt. im Takt: bricht, sobald maxOrd+1 > 2*proTakt+1, was bei den Vorgaben der Regelfall ist.

**reparatur:** In Z.27839 fuer den Export wie 'zeit' behandeln: `else if(e.wachsen==='takt') lim = LOOP>0 ? R.maxOrd+1 : b;`. Einen periodischen Aufbau je Clip gibt es nicht, ohne dass der Riss an der Naht verschwindet.

### beschlag (Beschlag) — exakt

**begruendung:** Z.27844 `p=(e.wachsen==='zeit'&&LOOP<=0)?Math.min(1,t/..):1`: Im Export ist p=1. Die Flecken-Hashes (Z.27852) nehmen einen Zaehler n, der je Bild bei 0 startet, und e.muster. Kein t, kein Math.random. Die Weichzeichnung (Z.27849) nimmt nur das Bild darunter. e._bc/_bm sind Puffer, die jedes Bild neu geloescht werden (clearRect Z.27848/27851), und tragen keinen Zustand weiter.

**unterfaelle:** stehend und 'mit der Zeit' sind beide exakt. 'mit der Zeit' zeigt im Export den fertigen Beschlag statt des Zuwachsens, eine gewollte Abweichung von der Vorschau.

### einschlag (Tropfen treffen die Scheibe) — bricht

**begruendung:** Z.27862: `for(let j=S.length-1;...){ ... if(hs(j)>=e.anteil) continue;` und Z.27863 `x=(..hs(j+100))*Wn, y=(..hs(j+200))*Hn, r0=..hs(j+300)`. Ob ein Schlag einen Tropfen bekommt und wo er sitzt, haengt am ABSOLUTEN Index j im Rasterfeld. Das Raster (Z.29087) ist zeitlich periodisch, sein Index aber nicht: Der Schlag bei t+L hat den Index j+proTakt*takte, bekommt einen anderen Hash und damit andere Tropfen an anderen Orten. Zweitens beginnt das Raster nur 2 Takte vor t0 (j=-proTakt*2). Bei t0 sind also nur Tropfen aus 2 Takten liegen geblieben, bei t0+L aber aus den ganzen letzten 'bleiben' Sekunden (Vorgabe 8 s, bis 30 s; Z.27862 `dt>Math.max(0.6,e.bleiben)`). Der Ring (dt<0.6) und das Verblassen (Z.27864-27865) haengen nur an dt=t-bt und waeren periodisch.

**unterfaelle:** Bricht bei jeder Einstellung. 'nur die Eins' (S[j][1] ist periodisch) aendert nichts am Index-Hash. Bei Bleibt = 0 bleibt nur der Hash-Fehler.

**reparatur:** In raster() je Schlag eine umlaufende Nummer mitgeben, `[t0+j*schritt, eins, ((j%(proTakt*takte))+proTakt*takte)%(proTakt*takte)]`. Das Raster frueher beginnen lassen, mit mindestens ceil(30/taktLang)+1 Takten Vorlauf statt 2. In Z.27862/27863 dann `const q=S[j][2]!=null?S[j][2]:j;` und hs(q), hs(q+100), hs(q+200), hs(q+300). In der Vorschau fehlt S[j][2], dort bleibt es bei j.

### tropfen (Tropfen laufen herunter) — exakt

**begruendung:** Z.27870-27871: Die Tropfen werden je Bild aus dem Index i neu berechnet (hs(i+...)). Nichts wird weitergetragen, die Tropfen wandern also nicht endlos, sondern brechen modulo L um. y: `((hs(i+2000)*L+t*lpV(v,L)+stoss*..)%L+L)%L`, dabei ist L=Hn+4r die Umbruchweite und genau das weite-Argument von lpV. Ueber LOOP verschiebt sich y um ganze Vielfache von L. x: `Math.sin(lpW(1.7)*t+i)` und `Math.sin(lpW(0.23)*t+i*2.3)`, beide gerastet. stoss (Z.27868) = pulswert(t,4,0): exp-Abklingen ueber die Rasterschlaege der letzten 1,5 s, periodisch, weil das Raster 2 Takte Vorlauf hat. glasKopie/linse lesen nur das Bild darunter. Sichtbare Abweichung von der Vorschau, aber keine Naht: Bei L=10 s wird lpW(0.23) zu 2*PI/10=0,63 (2,7-mal schneller, bei kurzem L noch mehr). lpV: v*LOOP/weite liegt bei der Vorgabe (Tempo 0,8) bei etwa 0,22 bis 0,78 und wird mit max(1,round) fuer alle Tropfen auf 1 gerundet. Im Export fallen dann alle Tropfen gleich schnell (ein Umlauf je Clip), die langsamen bis zu etwa 4,5-mal schneller.

**unterfaelle:** Mit und ohne 'Stoesse im Takt' exakt.

**Gegenprüfung:** {"korrekturen": [], "bestaetigt": ["filmnebel", "wellen", "kaustik", "linse", "flammen", "risse", "beschlag", "einschlag", "tropfen"]}
