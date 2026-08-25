/* KlangTresor · uebernommen am 25.08.2026 aus Caspar_Ds Download-Ordner,
   Farbstimmung auf Violett gedreht (Caspar_D: "gib dem Raben einen
   violetten Schimmer, besonders das Funkeln muss knallig violett sein").
   ----------------------------------------------------------------------
   RABE - Vektormodell in der Aufsicht, mit schlagenden Fluegeln.

   Eins-zu-eins-Ersatz fuer wuerfelZeichnen() bzw. fuer den Innenteil
   von zeichneSchiff(); gleiche Signatur, gleiche Aufrufstelle:

       rabeZeichnen(g, P, sc, jetzt, ang, glut, schub [, opt])

   g      Zeichenkontext (Canvas 2D)
   P      Bildposition [x, y]
   sc     Massstab (im Sternenhimmel Math.sqrt(karteZoom.k))
   jetzt  performance.now() in Millisekunden
   ang    Flugrichtung in Radiant (0 = nach rechts)
   glut   0..1 Ankunfts-/Warpglut
   schub  0 = Gleitflug (im Orbit), 1 = Schlagflug (Abflug, Transit)
   opt    { ohneWolke: true } zeichnet nur den Vogel, ohne die
          Federwolke anzufassen - fuer Standbilder und Vorschauen.

   Eigenes System: Ursprung = Koerpermitte, +X = Flugrichtung,
   +Y = rechter Fluegel. Eine Einheit entspricht ungefaehr einem
   Bildpunkt bei sc = 1 und RABE.groesse = 1. Von der Schnabelspitze
   bis zur Schwanzspitze misst er 17,3 Einheiten, ausgebreitet spannt
   er 35 - knapp 1 : 2, wie ein Kolkrabe im Ruderflug. Voreingestellt
   ist groesse 0,70, damit der Rumpf ungefaehr so lang ausfaellt wie
   das alte Schiff.

   Alles ist Pfadgeometrie: keine Bilddaten, keine Abhaengigkeiten,
   kein Zustand ausser der Federwolke.
   ---------------------------------------------------------------------- */

const RABE = {
  groesse:   0.80,     // Gesamtmassstab
  mindest:   0.50,     // kleinster Massstab - darunter bleibt er lesbar
  schlag:    0.58,     // Sekunden je vollem Fluegelschlag
  weite:     0.95,     // Schlagamplitude in Radiant (Dieder)
  gleiten:   0.12,     // Restschlag im Gleitflug (Anteil von weite)
  abanteil:  0.40,     // Anteil des Abschlags am Zyklus (der Aufschlag ist laenger)
  faecher:   1.00,     // Schwanzfaecher
  rand:      0.85,     // Randlicht auf den Federkanten (0 = aus)
  schimmer:  0.55,     // blauvioletter Glanz auf Ruecken und Fluegeln
  halo:      0.90,     // die AURA (Caspar_D, 25.08.2026) - kraeftiger violetter Schein
  federn:    1.00,     // Dichte der Federwolke (0 = aus)
  funkeln:   1.00,     // Staerke des Funkelns in der Wolke
  akzent:    '#b44dff' // Lichtfarbe: Randlicht, Halo, Funken - Violett (Caspar_D, 25.08.2026)
};

/* Handschwingen: [Winkel ab +X in Grad, Laenge ab Handgelenk].
   Alle sind nach hinten gepfeilt, die aeusserste ist die laengste -
   daher die tiefen Schlitze am Fluegelende, an denen man einen Raben
   auch als Scherenschnitt erkennt. */
const RABE_HAND   = [[110, 8.8], [121, 8.7], [132, 8.2], [143, 7.5], [154, 6.5], [164, 5.4]];
const RABE_GELENK = [2.2, 8.6];          // Handgelenk - hier knickt der Fluegel
const RABE_VORN   = [2.0, 1.9];          // Vorderkante am Rumpf, hinter dem Kopf
const RABE_HINTEN = [-4.4, 1.9];         // Hinterkante am Rumpf (Schirmfedern)

/* ---- Schlagzyklus ----------------------------------------------------
   Kein Sinus: der Abschlag ist kurz und kraeftig, der Aufschlag lang
   und locker. Im Aufschlag faltet sich die Hand ein und schwenkt
   zurueck - sonst arbeitete der Vogel gegen die eigene Luft. */
function rabeSchlag(jetzt, schub){
  const T   = RABE.schlag * (schub > 0 ? 1 : 2.8);
  const amp = RABE.weite * (schub > 0 ? 1 : RABE.gleiten);
  const u   = ((jetzt / 1000 / T) % 1 + 1) % 1;                       // 0..1 im Zyklus
  const AB  = Math.max(0.15, Math.min(0.85, RABE.abanteil));
  const auf = u >= AB;
  const w   = auf ? Math.PI + Math.PI * (u - AB) / (1 - AB) : Math.PI * u / AB;
  const phi = amp * Math.cos(w);                                      // +amp oben, -amp unten
  return {
    u, AB, phi, amp, auf,
    falt: auf ? Math.sin(Math.PI * (u - AB) / (1 - AB)) : 0,          // Mitte des Aufschlags
    vor:  auf ? 0 : Math.sin(Math.PI * u / AB),                       // Mitte des Abschlags
    tief: Math.max(0, -phi / (amp || 1))
  };
}

/* Lage der Hand im Schlag: Verkuerzung, Schwenk, Einzug */
function rabeHandLage(S){
  return { cp: Math.cos(S.phi), dreh: 0.55 * S.falt - 0.14 * S.vor, kurz: 1 - 0.38 * S.falt };
}

/* Spitze der aeussersten Handschwinge, lokal - dort loesen sich die Federn */
function rabeSpitze(S, sgn){
  const { cp, dreh, kurz } = rabeHandLage(S);
  const a = RABE_HAND[0][0] * Math.PI / 180 + dreh, r = RABE_HAND[0][1] * kurz;
  return [RABE_GELENK[0] + r * Math.cos(a), sgn * cp * (RABE_GELENK[1] + r * Math.sin(a))];
}

/* ---- Ein Fluegel -----------------------------------------------------
   sgn  +1 rechts, -1 links
   det  0 = fern (glatte Kante), 1 = nah (offene Schlitze)

   In der Aufsicht sieht man vom Schlag nur die Verkuerzung: der Fluegel
   dreht um die Laengsachse, seine Spannweite schrumpft also mit dem
   Kosinus des Dieders. Waagerecht ist er am breitesten - zweimal je
   Schlag. Genau das macht die Bewegung von oben lesbar. */
function rabeFluegelPfad(g, sgn, S, det){
  const { cp, dreh, kurz } = rabeHandLage(S);
  /* Von weitem wird der Fluegel etwas gedrungener: ein paar Bildpunkte
     Spannweite weniger, dafuer mehr Tiefe - sonst zerfaellt der Vogel
     in zwei Striche. Aus der Naehe faellt es weg. */
  const dick = 1 + 0.22 * (1 - det), schmal = 1 - 0.12 * (1 - det);
  const m = (p) => [p[0] * dick, sgn * p[1] * cp * schmal]; // Aufsicht + Verkuerzung
  const L = (p) => { const q = m(p); g.lineTo(q[0], q[1]); };
  const Q = (c, p) => { const a = m(c), b = m(p); g.quadraticCurveTo(a[0], a[1], b[0], b[1]); };

  const A = RABE_VORN, W = RABE_GELENK, B = RABE_HINTEN;

  /* Handschwingen strahlen vom Handgelenk aus - lang, gepfeilt, tief
     geschlitzt. Ihre Spitzen sind der Umriss, nach dem man einen Raben
     im Gegenlicht erkennt. */
  const spitze = (grad, laenge) => {
    const a = grad * Math.PI / 180 + dreh, r = laenge * kurz;
    return [W[0] + r * Math.cos(a), W[1] + r * Math.sin(a)];
  };
  const fed = RABE_HAND.map(([grad, l]) => spitze(grad, l));
  const kerb = [];
  for (let i = 0; i < RABE_HAND.length - 1; i++){
    const gm = (RABE_HAND[i][0] + RABE_HAND[i + 1][0]) / 2;
    const lm = (RABE_HAND[i][1] + RABE_HAND[i + 1][1]) / 2;
    kerb.push(spitze(gm, lm * (1 - 0.58 * det)));           // tief = offene Finger
  }

  /* Hinterkante: Grundbogen vom innersten Finger zurueck zum Rumpf,
     darauf die Zacken der Armschwingen. */
  const E0 = fed[fed.length - 1], EC = [-5.2, 6.0];
  const bog = (t) => { const u = 1 - t; return [u*u*E0[0] + 2*u*t*EC[0] + t*t*B[0],
                                                u*u*E0[1] + 2*u*t*EC[1] + t*t*B[1]]; };

  g.beginPath();
  const M = m(A); g.moveTo(M[0], M[1]);
  Q([3.4, 5.0], W);                                        // Armfluegel: Vorderkante woelbt vor
  Q([(W[0] + fed[0][0]) / 2 + 0.6, (W[1] + fed[0][1]) / 2], fed[0]);   // Handfluegel
  for (let i = 0; i < kerb.length; i++) Q(kerb[i], fed[i + 1]);        // Schlitze
  const ZACK = 0.15 * det;
  let vor = bog(0);
  for (let i = 1; i <= 7; i++){
    const cur = bog(i / 7);
    const dx = cur[0] - vor[0], dy = cur[1] - vor[1], n = Math.hypot(dx, dy) || 1;
    Q([(vor[0] + cur[0]) / 2 + dy / n * ZACK * 2, (vor[1] + cur[1]) / 2 - dx / n * ZACK * 2], cur);
    vor = cur;
  }
  g.closePath();
  return { A: m(A), W: m(W), B: m(B), fed: fed.map(m), cp };
}

/* ---- Koerper: Schnabel, Kopf, Rumpf ---------------------------------- */
function rabeKoerperPfad(g){
  g.beginPath();
  g.moveTo(6.9, 0);                                    // Schnabelspitze
  g.quadraticCurveTo(6.10, -0.34, 4.70, -0.62);        // Oberschnabel: kurz, aber schwer
  g.quadraticCurveTo(4.30, -1.20, 3.40, -1.45);        // Kopf, breiteste Stelle
  g.quadraticCurveTo(2.55, -1.42, 2.05, -0.95);        // Nacken - hier schnuert der Vogel ein
  g.quadraticCurveTo(1.45, -1.70, 0.55, -2.20);        // Schultern, Kehl- und Nackenfedern
  g.quadraticCurveTo(-0.60, -2.44, -2.30, -2.06);      // Rumpf, breiteste Stelle
  g.quadraticCurveTo(-3.50, -1.80, -4.30, -1.12);      // zum Schwanzansatz
  g.lineTo(-4.30, 1.12);
  g.quadraticCurveTo(-3.50, 1.80, -2.30, 2.06);
  g.quadraticCurveTo(-0.60, 2.44, 0.55, 2.20);
  g.quadraticCurveTo(1.45, 1.70, 2.05, 0.95);
  g.quadraticCurveTo(2.55, 1.42, 3.40, 1.45);
  g.quadraticCurveTo(4.30, 1.20, 4.70, 0.62);
  g.quadraticCurveTo(6.10, 0.34, 6.9, 0);
  g.closePath();
}

/* ---- Schwanz als Faecher ---------------------------------------------
   Zwoelf Steuerfedern strahlen einzeln vom Ansatz aus. Die mittleren
   sind die laengsten - daher der Keil, das sicherste Kennzeichen
   gegenueber der Kraehe. Gemalt wird von aussen nach innen, damit die
   mittleren obenauf liegen, so wie sie beim Vogel uebereinanderliegen. */
const RABE_SCHWANZ = [-3.0, 0];                          // Ansatzpunkt
function rabeSchwanzZeichnen(g, faecher, det, licht, grau, saum, kante, akzRgb, lw){
  const B0 = RABE_SCHWANZ, N = 6, SPREIZ = 0.64 * faecher;
  const federn = [];
  for (const sgn of [-1, 1]) for (let k = 0; k < N; k++){
    const t = k / (N - 1);
    const a = SPREIZ * (0.09 + 0.91 * t);
    const L = 7.2 - 1.7 * Math.pow(t, 1.15);             // aussen kuerzer
    const d = [-Math.cos(a), sgn * Math.sin(a)];
    federn.push({ sgn, t, d, n: [-d[1], d[0]], w: 0.62 - 0.12 * t,
                  T: [B0[0] + d[0] * L,        B0[1] + d[1] * L],
                  M: [B0[0] + d[0] * L * 0.55, B0[1] + d[1] * L * 0.55] });
  }
  const pfad = (f) => {
    g.beginPath();
    g.moveTo(B0[0], B0[1]);
    g.quadraticCurveTo(f.M[0] + f.n[0] * f.w, f.M[1] + f.n[1] * f.w,
                       f.T[0] + f.n[0] * f.w * 0.42, f.T[1] + f.n[1] * f.w * 0.42);
    g.lineTo(f.T[0] - f.n[0] * f.w * 0.42, f.T[1] - f.n[1] * f.w * 0.42);   // stumpfes Ende
    g.quadraticCurveTo(f.M[0] - f.n[0] * f.w, f.M[1] - f.n[1] * f.w, B0[0], B0[1]);
    g.closePath();
  };

  /* Der Lichtsaum gehoert um den ganzen Faecher, nicht um jede einzelne
     Feder - sonst summieren sich zwoelf Saeume zu einem weissen Fleck. */
  const rund = federn.filter(f => f.sgn < 0).sort((a, b) => b.t - a.t)
        .concat(federn.filter(f => f.sgn > 0).sort((a, b) => a.t - b.t));
  g.beginPath();
  g.moveTo(B0[0], B0[1]);
  for (const f of rund) g.lineTo(f.T[0] + f.d[0] * 0.3, f.T[1] + f.d[1] * 0.3);
  g.closePath();
  saum(kante * 0.9);

  /* Federn von aussen nach innen fuellen: die mittleren liegen obenauf,
     so wie sie beim Vogel uebereinanderliegen. */
  for (const f of [...federn].sort((a, b) => b.t - a.t)){
    pfad(f);
    g.fillStyle = grau(19 + 10 * licht + 9 * f.t);       // aussen faengt mehr Licht
    g.fill();
    g.strokeStyle = `rgba(${akzRgb},${(kante * (0.20 + 0.30 * det)).toFixed(3)})`;
    g.lineWidth = lw(0.6); g.stroke();
  }
}

/* ======================================================================
   FEDERWOLKE
   Bei jedem Abschlag loesen sich feine Federpartikel von den
   Fluegelspitzen, dazu treibt staendig etwas Federstaub aus dem
   Schwanz. Sie fallen zurueck, trudeln auseinander und blitzen einzeln
   auf. Sie leben in Bildkoordinaten - bei Zoomfahrten schwimmen sie
   leicht mit, was bei gut einer Sekunde Lebensdauer nicht auffaellt.
   ====================================================================== */
const rabeWolke = [];
const RABE_WOLKE_MAX = 280;
let rabeLetzteZeit = 0, rabeLetzterOrt = null, rabeLetzteU = 0;

function rabeWolkeLeeren(){ rabeWolke.length = 0; rabeLetzterOrt = null; }

function rabeWolkeSaeen(x, y, n, vx, vy, streu, s){
  for (let i = 0; i < n && rabeWolke.length < RABE_WOLKE_MAX; i++){
    const a = Math.random() * 2 * Math.PI, r = Math.random() * streu * s;
    rabeWolke.push({
      x: x + Math.cos(a) * r, y: y + Math.sin(a) * r,
      vx: vx * (0.10 + 0.25 * Math.random()) + (Math.random() - 0.5) * 18 * s,
      vy: vy * (0.10 + 0.25 * Math.random()) + (Math.random() - 0.5) * 18 * s,
      dreh: Math.random() * Math.PI, drall: (Math.random() - 0.5) * 3.4,
      gr: (0.5 + 1.5 * Math.random()) * s,
      leben: 0, dauer: 0.8 + 1.1 * Math.random(),
      fp: Math.random() * 6.283, ft: 5 + 9 * Math.random(),
      hell: 0.35 + 0.65 * Math.random()
    });
  }
}

function rabeWolkeZeichnen(g, dt, jetzt, akzRgb){
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = rabeWolke.length - 1; i >= 0; i--){
    const p = rabeWolke[i];
    p.leben += dt;
    if (p.leben >= p.dauer){ rabeWolke.splice(i, 1); continue; }
    const k = p.leben / p.dauer;                       // 0 frisch .. 1 vergangen
    const brems = Math.pow(0.10, dt);                  // Luftwiderstand
    p.vx *= brems; p.vy *= brems;
    p.x += p.vx * dt + Math.sin(jetzt / 420 + p.fp) * 5 * dt;   // Trudeln
    p.y += p.vy * dt + Math.cos(jetzt / 380 + p.fp) * 5 * dt;
    p.dreh += p.drall * dt;

    const a = Math.sin(Math.PI * Math.min(1, k * 1.6)) * (1 - k) * p.hell;
    if (a <= 0.004) continue;
    const L = p.gr * (1 + 1.1 * k), Bq = L * 0.34;

    /* Die Feder selbst: ein schmales Blatt, das nur an der Kante Licht
       faengt - auf Schwarz liest man sie als Schemen, nicht als Fleck. */
    g.save();
    g.translate(p.x, p.y); g.rotate(p.dreh);
    g.fillStyle = `rgba(${akzRgb},${(0.20 * a).toFixed(3)})`;
    g.beginPath();                                   // leicht gekruemmt, wie eine Feder
    g.moveTo(L, 0);
    g.quadraticCurveTo(0, Bq * 1.5, -L, Bq * 0.4);
    g.quadraticCurveTo(0, -Bq * 0.2, L, 0);
    g.fill();
    g.restore();

    /* Funkeln: kurzer, harter Blitz - jede Feder hat ihren eigenen Takt. */
    if (RABE.funkeln > 0){
      /* Selten, kurz und klein: ein Funke ist ein Aufblitzen, kein
         Scheinwerfer. Hohe Potenz = die meiste Zeit ist er aus. */
      const f = Math.pow(Math.max(0, Math.sin(jetzt / 1000 * p.ft + p.fp)), 14) * a * RABE.funkeln;
      if (f > 0.02){
        const r = Math.min(9, L * 1.7) * (0.55 + 0.45 * f);
        const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        /* VIOLETT BIS WEISS (Caspar_D, 25.08.2026): der Kern ist reines
           Weiss, der Hof knallt violett - der Funke changiert dazwischen. */
        gr.addColorStop(0,    `rgba(255,255,255,${(0.85 * f).toFixed(3)})`);
        gr.addColorStop(0.30, `rgba(198,64,255,${(0.40 * f).toFixed(3)})`);
        gr.addColorStop(1,    `rgba(${akzRgb},0)`);
        g.fillStyle = gr; g.fillRect(p.x - r, p.y - r, 2 * r, 2 * r);
        const q = r * 1.5;
        g.strokeStyle = `rgba(235,180,255,${(0.38 * f).toFixed(3)})`;
        g.lineWidth = Math.max(0.35, r * 0.08);
        g.beginPath();
        g.moveTo(p.x - q, p.y); g.lineTo(p.x + q, p.y);
        g.moveTo(p.x, p.y - q); g.lineTo(p.x, p.y + q);
        g.stroke();
      }
    }
  }
  g.restore();
}

/* ======================================================================
   HAUPTFUNKTION
   ====================================================================== */
function rabeZeichnen(g, P, sc, jetzt, ang, glut, schub, opt){
  const s   = Math.max(RABE.mindest, sc * RABE.groesse);
  const det = Math.min(1, Math.max(0, (s - 0.35) / 0.85));      // 0 fern .. 1 nah
  const S   = rabeSchlag(jetzt, schub);
  const akzRgb = rabeRgb(RABE.akzent);
  const lw  = (px) => px / s;                                   // konstante Strichbreite am Bildschirm

  /* ---- Federwolke: saeen, treiben lassen, zeichnen ------------------- */
  if (!(opt && opt.ohneWolke)){
    const dt = Math.min(0.06, Math.max(0.001, (jetzt - (rabeLetzteZeit || jetzt)) / 1000));
    rabeLetzteZeit = jetzt;
    let vx = 0, vy = 0;
    if (rabeLetzterOrt){ vx = (P[0] - rabeLetzterOrt[0]) / dt; vy = (P[1] - rabeLetzterOrt[1]) / dt; }
    if (Math.hypot(vx, vy) > 4000){ vx = 0; vy = 0; rabeWolkeLeeren(); }   // Sprung: nichts haengt nach
    rabeLetzterOrt = [P[0], P[1]];

    if (RABE.federn > 0){
      const welt = (q) => [P[0] + s * (q[0] * Math.cos(ang) - q[1] * Math.sin(ang)),
                           P[1] + s * (q[0] * Math.sin(ang) + q[1] * Math.cos(ang))];
      /* Unten im Abschlag reisst die Luft ab - dort gehen sie ab. */
      const durch = (rabeLetzteU < S.AB && S.u >= S.AB) || (S.u < rabeLetzteU && S.u >= S.AB);
      rabeLetzteU = S.u;
      if (durch){
        const n = Math.max(1, Math.round((2 + 3 * RABE.federn) * (schub > 0 ? 1 : 0.35)));
        for (const sgn of [-1, 1]){
          const T = welt(rabeSpitze(S, sgn));
          rabeWolkeSaeen(T[0], T[1], n, vx, vy, 2.2, s);
        }
      }
      if (Math.random() < (schub > 0 ? 0.55 : 0.20) * RABE.federn){
        const T = welt([-9.0, (Math.random() - 0.5) * 3]);
        rabeWolkeSaeen(T[0], T[1], 1, vx, vy, 1.4, s);
      }
      rabeWolkeZeichnen(g, dt, jetzt, akzRgb);
    }
  }

  /* ---- Halo: ohne etwas Licht dahinter verschwindet Schwarz im Schwarz.
     Je kleiner der Vogel, desto noetiger - deshalb waechst er nach unten. */
  if (RABE.halo > 0){
    /* Die AURA (Caspar_D, 25.08.2026): zwei Schichten - ein weiter,
       weicher Hof und ein enger, satter Kernschein, der leicht atmet. */
    const r = 15 * s * (1 + 0.8 * (1 - det));
    const atme = 0.9 + 0.1 * Math.sin(jetzt / 640);
    const a = RABE.halo * (0.18 + 0.12 * (1 - det)) * atme;
    const gr = g.createRadialGradient(P[0], P[1], 0, P[0], P[1], r);
    gr.addColorStop(0,    `rgba(${akzRgb},${a.toFixed(3)})`);
    gr.addColorStop(0.45, `rgba(${akzRgb},${(a * 0.35).toFixed(3)})`);
    gr.addColorStop(1,    `rgba(${akzRgb},0)`);
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = gr; g.fillRect(P[0] - r, P[1] - r, 2 * r, 2 * r);
    const rk = r * 0.42;
    const gk = g.createRadialGradient(P[0], P[1], 0, P[0], P[1], rk);
    gk.addColorStop(0,    `rgba(214,140,255,${(a * 0.9).toFixed(3)})`);
    gk.addColorStop(1,    `rgba(${akzRgb},0)`);
    g.fillStyle = gk; g.fillRect(P[0] - rk, P[1] - rk, 2 * rk, 2 * rk);
    g.restore();
  }

  /* ---- Ankunfts- und Warpglut, wie beim Schiff ---------------------- */
  if (glut > 0){
    const r = (6 + 10 * glut) * Math.max(1, s), puls = 0.6 + 0.4 * Math.sin(jetzt / 90);
    const kg = g.createRadialGradient(P[0], P[1], 0, P[0], P[1], r);
    kg.addColorStop(0,   `rgba(255,245,255,${(0.9 * glut * puls).toFixed(2)})`);
    kg.addColorStop(0.5, `rgba(210,150,255,${(0.5 * glut * puls).toFixed(2)})`);
    kg.addColorStop(1,   'rgba(210,150,255,0)');
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = kg;
    g.fillRect(P[0] - r, P[1] - r, 2 * r, 2 * r); g.restore();
  }

  g.save();
  g.translate(P[0], P[1]); g.rotate(ang); g.scale(s, s);
  g.globalCompositeOperation = 'source-over';
  g.lineJoin = 'round'; g.lineCap = 'round';

  /* Oben ist Licht: im Aufschlag faengt die Fluegeloberseite mehr davon.
     Das ist der zweite Hinweis darauf, wo im Schlag wir gerade sind. */
  const licht = 0.5 + 0.5 * Math.sin(S.phi);
  const kante = RABE.rand * (0.30 + 0.26 * licht);
  const grau  = (v) => `rgb(${Math.round(v * 0.84)},${Math.round(v * 0.70)},${Math.round(v)})`;   /* violettstichiges Gefieder */

  /* Lichtsaum: ein schwarzer Vogel auf schwarzem Grund braucht eine
     Kante, die glueht, nicht eine, die nur da ist. Drei Zuege ueber
     denselben Pfad - breit und schwach, mittel, schmal und hell -
     ergeben einen weichen Rand ohne Weichzeichner. */
  const saum = (a, f = 1) => {
    if (a <= 0) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    g.strokeStyle = `rgba(${akzRgb},${(a * 0.13 * f).toFixed(3)})`; g.lineWidth = lw(4.0); g.stroke();
    g.strokeStyle = `rgba(${akzRgb},${(a * 0.22 * f).toFixed(3)})`; g.lineWidth = lw(2.0); g.stroke();
    g.restore();
    g.strokeStyle = `rgba(${akzRgb},${Math.min(1, a * 1.1 * f).toFixed(3)})`;
    g.lineWidth = lw(0.85); g.stroke();
  };

  /* ---- Fluegel ------------------------------------------------------- */
  for (const sgn of [-1, 1]){
    const F = rabeFluegelPfad(g, sgn, S, det);
    const tip = F.fed[0];
    const fg = g.createLinearGradient(1.6, sgn * 1.2, tip[0], tip[1]);
    fg.addColorStop(0,    grau(30 + 16 * licht));      // Schulter
    fg.addColorStop(0.42, grau(15));                   // Armfluegel, tiefes Schwarz
    fg.addColorStop(1,    grau(26 + 24 * licht));      // Handschwingen fangen Licht
    g.fillStyle = fg; g.fill();
    saum(kante);
    /* Glanzstreif entlang der Vorderkante - Kolkraben haben ihn wirklich */
    if (RABE.schimmer > 0 && det > 0.2){
      g.beginPath();
      g.moveTo(F.A[0], F.A[1]);
      g.quadraticCurveTo(3.4, sgn * 5.0 * F.cp, F.W[0], F.W[1]);
      g.quadraticCurveTo((F.W[0] + tip[0]) / 2 + 0.6, (F.W[1] + tip[1]) / 2, tip[0], tip[1]);
      g.strokeStyle = `rgba(196,128,255,${(0.36 * RABE.schimmer * det * (0.5 + 0.5 * licht)).toFixed(2)})`;
      g.lineWidth = lw(0.55); g.stroke();
    }
    /* Trennlinie zwischen Arm- und Handfluegel */
    if (det > 0.55){
      g.beginPath();
      g.moveTo(1.6, sgn * 2.2 * F.cp);
      g.quadraticCurveTo(-0.6, sgn * 5.4 * F.cp, -2.6, sgn * 8.0 * F.cp);
      g.strokeStyle = `rgba(126,142,180,${(0.18 * det).toFixed(2)})`;
      g.lineWidth = lw(0.4); g.stroke();
    }
  }

  /* ---- Keilschwanz --------------------------------------------------- */
  const faecher = RABE.faecher * (0.86 + 0.16 * S.tief);
  g.save();
  g.translate(RABE_SCHWANZ[0], 0); g.rotate(0.07 * Math.sin(2 * Math.PI * S.u - 0.7));
  g.translate(-RABE_SCHWANZ[0], 0);
  rabeSchwanzZeichnen(g, faecher, det, licht, grau, saum, kante, akzRgb, lw);
  g.restore();

  /* ---- Koerper ------------------------------------------------------- */
  rabeKoerperPfad(g);
  const kg2 = g.createLinearGradient(0, -2.1, 0, 2.1);
  kg2.addColorStop(0,    grau(21));
  kg2.addColorStop(0.42, grau(34 + 16 * licht));
  kg2.addColorStop(1,    grau(13));
  g.fillStyle = kg2; g.fill();
  saum(kante * 1.1);

  /* Rueckenglanz: der blauviolette Schimmer des Kolkraben */
  if (RABE.schimmer > 0){
    const rg = g.createRadialGradient(0.4, 0, 0, 0.4, 0, 4.2);
    rg.addColorStop(0, `rgba(178,88,255,${(0.20 * RABE.schimmer).toFixed(2)})`);
    rg.addColorStop(1, 'rgba(178,88,255,0)');
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rg;
    g.beginPath(); g.ellipse(0.4, 0, 4.2, 1.3, 0, 0, 2 * Math.PI); g.fill(); g.restore();
  }

  if (det > 0.4){
    /* Der Schnabel ist glatter und dunkler als das Gefieder - er bekommt
       eine eigene Flaeche, sonst laeuft der Kopf spitz in nichts aus. */
    g.beginPath();
    g.moveTo(6.9, 0);
    g.quadraticCurveTo(6.10, -0.34, 4.70, -0.62);
    g.lineTo(4.70, 0.62);
    g.quadraticCurveTo(6.10, 0.34, 6.9, 0);
    g.closePath();
    g.fillStyle = grau(15); g.fill();
    g.strokeStyle = `rgba(${akzRgb},${(0.42 * det).toFixed(2)})`; g.lineWidth = lw(0.55);
    g.beginPath(); g.moveTo(6.5, 0); g.lineTo(4.9, 0); g.stroke();     // Firstlinie
    /* Nasenborsten: der dunkle Buschel ueber dem Schnabelansatz */
    g.fillStyle = `rgba(4,4,7,${(0.8 * det).toFixed(2)})`;
    g.beginPath(); g.ellipse(4.85, 0, 0.45, 0.40, 0, 0, 2 * Math.PI); g.fill();
    /* Augen seitlich am Kopf: schwarz, mit einem einzigen Glanzpunkt */
    for (const sgn of [-1, 1]){
      g.fillStyle = 'rgb(5,5,9)';
      g.beginPath(); g.arc(3.15, sgn * 1.00, 0.40, 0, 2 * Math.PI); g.fill();
      g.fillStyle = `rgba(228,238,255,${(0.8 * det).toFixed(2)})`;
      g.beginPath(); g.arc(3.30, sgn * 0.92, 0.15, 0, 2 * Math.PI); g.fill();
    }
  }
  if (det > 0.6){
    /* Kehlfedern: beim Kolkraben lang und zerzaust */
    g.strokeStyle = `rgba(110,126,166,${(0.22 * det).toFixed(2)})`; g.lineWidth = lw(0.4);
    for (const sgn of [-1, 1]) for (let i = 0; i < 3; i++){
      const x = 2.2 - i * 0.7;
      g.beginPath(); g.moveTo(x, sgn * (1.05 + i * 0.30));
      g.lineTo(x - 0.8, sgn * (1.55 + i * 0.34)); g.stroke();
    }
  }

  g.restore();
}

/* '#rrggbb' oder 'rgb(r,g,b)' -> 'r,g,b' */
function rabeRgb(farbe){
  const m = String(farbe).match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
  if (m) return m.slice(1).map(h => parseInt(h, 16)).join(',');
  const n = String(farbe).match(/(\d+)\D+(\d+)\D+(\d+)/);
  return n ? n.slice(1).join(',') : '159,182,232';
}

if (typeof module !== 'undefined' && module.exports)
  module.exports = { rabeZeichnen, rabeWolkeLeeren, RABE };
