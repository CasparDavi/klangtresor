/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* Der Gradations-Prozessor: eine frei gezogene Kennlinie fuer die
   Lautheit - wie die Gradationskurve im Grafikprogramm (Caspar_D,
   20.08.2026: "mich stoert dieser willkuerliche Knick").

   Er tut, was ein Kompressor tut, nur ohne die Zwangsform aus
   Schwelle und Knick: Er verfolgt die HUELLKURVE des Signals (in dB,
   mit Attack/Release als Adaptionszeiten) und schlaegt fuer den
   Momentanpegel in einer Tabelle nach, welcher Ausgangspegel gelten
   soll. Die Differenz ist die Verstaerkung des Moments - langsam
   geregelt, nie an der einzelnen Schwingung (das waere Verzerrung).

   Die Tabelle kommt per Nachricht von der Seite: 61 Stuetzen fuer
   -60..0 dB, dazwischen wird linear gemittelt. Identitaet = nichts
   passiert. Alle ~50 ms meldet der Prozessor die aktuelle
   Wegregelung zurueck (fuer die traege Anzeige).

   Ehrlich gemacht (Review 22./23.08.2026):
   - K-BEWERTUNG (ITU-R BS.1770: Hoehen-Shelf +4 dB ab 1,68 kHz, Hochpass
     38 Hz) vor der Messung, Pegel nach BS.1770 (-0,691 + 10 log10 der
     Kanal-Summe): die Huellkurve spricht LUFS - dieselbe Achse wie die
     Song-Staebe und die Streaming-Marke im Bild.
   - SPITZEN-HUELLKURVE daneben: ist die Kennlinie oben flach (Limiter-
     Form), regelt die Spitze, nicht das Mittel - sonst haelt der Limiter
     nicht, was die Pille verspricht.
   - LOOKAHEAD von einem Block (128 Samples, 2,7 ms bei 48 kHz): das
     Signal geht um einen Block verzoegert hinaus, die Verstaerkung wird
     aus dem NAECHSTEN Block gerechnet - sie steht vor der Spitze.
   - RAMPE statt Treppe: die Verstaerkung laeuft je Sample linear vom
     alten zum neuen Wert (vorher blockkonstant + feste 0,3-Glaettung, die
     Attack/Release unwahr machte).
   - Letzte Sicherheit nur im Limiter-Fall: harte Kappe am Tabellendach. */
class Gradation extends AudioWorkletProcessor {
  constructor() {
    super();
    this.kurve = new Float32Array(61);
    for (let i = 0; i < 61; i++) this.kurve[i] = i - 60;   // Identitaet
    this.attack = 0.01; this.release = 0.25;
    this.env = -60; this.spitze = -60; this.gainDb = 0; this.gAlt = 1; this.zaehler = 0;
    this.puffer = null;                                     // Lookahead: ein Block je Kanal
    this.kz = null;                                         // K-Bewertung: Filterzustaende je Kanal
    this.lm = []; this.lmSumme = 0;                         // 400-ms-Fenster (Momentan-Lautheit) fuer die Anzeige
    this.kBauen();
    this.port.onmessage = (e) => {
      if (e.data.kurve) this.kurve = Float32Array.from(e.data.kurve);
      if (e.data.attack  !== undefined) this.attack  = Math.max(0.001, e.data.attack);
      if (e.data.release !== undefined) this.release = Math.max(0.02, e.data.release);
      const dach = this.kurve[60], schulter = this.kurve[57];
      this.limiter = (dach - schulter) < 1;                 // oben flach = Limiter-Form
      this.kappe = Math.pow(10, Math.min(0, dach) / 20);
    };
    this.limiter = false; this.kappe = 1;
  }
  /* BS.1770-K-Bewertung als zwei Biquads (RBJ-Cookbook), Koeffizienten fuer sampleRate */
  kBauen() {
    const fs = sampleRate;
    const shelf = (() => { const f0 = 1681.974450955533, G = 3.999843853973347, Q = 0.7071752369554196;
      const K = Math.tan(Math.PI * f0 / fs), Vh = Math.pow(10, G / 20), Vb = Math.pow(Vh, 0.4996667741545416);
      const a0 = 1 + K / Q + K * K;
      return { b0: (Vh + Vb * K / Q + K * K) / a0, b1: 2 * (K * K - Vh) / a0, b2: (Vh - Vb * K / Q + K * K) / a0, a1: 2 * (K * K - 1) / a0, a2: (1 - K / Q + K * K) / a0 }; })();
    const hp = (() => { const f0 = 38.13547087602444, Q = 0.5003270373238773;
      const K = Math.tan(Math.PI * f0 / fs), a0 = 1 + K / Q + K * K;
      return { b0: 1, b1: -2, b2: 1, a1: 2 * (K * K - 1) / a0, a2: (1 - K / Q + K * K) / a0 }; })();   // Zaehler wie in BS.1770 (1, -2, 1)
    this.kf = [shelf, hp];
  }
  nachschlagen(db) {
    const p = Math.max(0, Math.min(60, db + 60));
    const i = Math.floor(p), f = p - i;
    return i >= 60 ? this.kurve[60] : this.kurve[i] * (1 - f) + this.kurve[i + 1] * f;
  }
  process(inputs, outputs) {
    const ein = inputs[0], aus = outputs[0];
    if (!ein || !ein.length) return true;
    const n = ein[0].length, kan = ein.length;
    if (!this.puffer || this.puffer.length !== kan || this.puffer[0].length !== n) {
      this.puffer = Array.from({ length: kan }, () => new Float32Array(n));
      this.kz = Array.from({ length: kan }, () => [{ x1: 0, x2: 0, y1: 0, y2: 0 }, { x1: 0, x2: 0, y1: 0, y2: 0 }]);
    }
    /* Messung am NEUEN Block: K-bewertete Leistung je Kanal (Summe = BS.1770), Spitze roh */
    let leistung = 0, sp = 0;
    for (let c = 0; c < kan; c++) {
      const d = ein[c], z = this.kz[c]; let q = 0;
      for (let i = 0; i < n; i++) {
        const x = d[i]; const ax = x < 0 ? -x : x; if (ax > sp) sp = ax;
        let y = x;
        for (let s = 0; s < 2; s++) { const f = this.kf[s], st = z[s];
          const out = f.b0 * y + f.b1 * st.x1 + f.b2 * st.x2 - f.a1 * st.y1 - f.a2 * st.y2;
          st.x2 = st.x1; st.x1 = y; st.y2 = st.y1; st.y1 = out; y = out; }
        q += y * y;
      }
      leistung += q / n;
    }
    const pegel = leistung > 1e-12 ? Math.max(-60, -0.691 + 10 * Math.log10(leistung)) : -60;
    const spDb = sp > 1e-6 ? Math.max(-60, 20 * Math.log10(sp)) : -60;
    /* Huellkurven: Lautheit mit Attack/Release; Spitze sofort auf, mit Release ab */
    const dt = n / sampleRate;
    const a = 1 - Math.exp(-dt / this.attack), r = 1 - Math.exp(-dt / this.release);
    this.env += (pegel - this.env) * (pegel > this.env ? a : r);
    this.spitze = spDb > this.spitze ? spDb : this.spitze + (spDb - this.spitze) * r;
    /* Momentan-Lautheit (400 ms) fuer die Anzeige */
    this.lm.push(leistung); this.lmSumme += leistung;
    const lmN = Math.max(1, Math.round(0.4 / dt)); while (this.lm.length > lmN) this.lmSumme -= this.lm.shift();
    const lmMittel = this.lmSumme / this.lm.length;
    /* Regelgroesse: im Limiter-Fall die lautere von beiden Huellkurven */
    const regel = this.limiter ? Math.max(this.env, this.spitze) : this.env;
    this.gainDb = this.nachschlagen(regel) - regel;
    const gNeu = Math.pow(10, this.gainDb / 20), gAlt = this.gAlt;
    /* Ausgabe: der VORIGE Block (Lookahead), Rampe gAlt -> gNeu je Sample */
    for (let c = 0; c < aus.length; c++) {
      const s = this.puffer[Math.min(c, kan - 1)], d = aus[c];
      for (let i = 0; i < n; i++) {
        let v = s[i] * (gAlt + (gNeu - gAlt) * (i + 1) / n);
        if (this.limiter) { if (v > this.kappe) v = this.kappe; else if (v < -this.kappe) v = -this.kappe; }
        d[i] = v;
      }
    }
    for (let c = 0; c < kan; c++) this.puffer[c].set(ein[c]);
    this.gAlt = gNeu;
    if (++this.zaehler >= 16) { this.zaehler = 0;
      this.port.postMessage({ env: this.env, gainDb: this.gainDb, spitze: this.spitze, lm: lmMittel > 1e-12 ? -0.691 + 10 * Math.log10(lmMittel) : -60, limiter: this.limiter }); }
    return true;
  }
}
registerProcessor('gradation', Gradation);
