// Hebungssuche im Vers: jede Silbe wird Hebung (S) oder Senkung (W).
// Füllungsfreiheit: zwischen zwei Hebungen ein oder zwei Senkungen; zwei Hebungen
// direkt hintereinander (Hebungsprall) und drei Senkungen sind teuer.
// Kosten nach dem Grundsatz der generativen Metrik (Halle/Keyser, Kiparsky 1975,
// Hayes 1983): Hauptakzent mehrsilbiger Wörter gehört in die Hebung, Einsilber sind frei.
//
// silben: [{ mehrsilbig: bool, stufe: 0|1|2, klasse: 'u'|'b'|'c' (nur Einsilber) }]

// Abgestimmt am 08.11.2026 mit pruef/abstimmen.mjs auf Haiders Entwicklungsdaten (dev,
// Gedichte): Silben 94,9 %, Zeilen 79,6 %. Gedichte wechseln streng ab – daher günstige
// Hebung für kleine Wörter (monoU) und teure Doppelsenkung. Für freie Liedverse ggf. lockern.
export const K = {
  // Wort-Kosten [S, W]
  poly2: [0, 4], poly1: [0, 0.8], poly0: [1.2, 0],
  monoC: [0, 0.8], monoB: [0.2, 0.14], monoU: [0.2, 0],
  // Übergänge
  prall: 2, doppelsenkung: 1, dreifach: 6, auftakt2: 0.3, ausklang2: 0.3,
  // Einsilber am Zeilenende in die Hebung (seit 10.11.2026, Jörg: „alles was im Deutschen hilft, machen wir da auch“):
  // Haider dev 95,2 → 95,5 % / 80,7 → 81,6 %, test 95,6 → 95,7 % / 82,8 → 82,9 %
  endeEin: 0.9,
};

// Freie Fassung für Liedverse mit Füllungsfreiheit (von Hand gesetzt, nicht abgestimmt):
// Doppelsenkung billig, kleine Wörter lieber in der Senkung, Inhaltswörter lieber in der Hebung.
export const K_FREI = { ...K, monoU: [0.8, 0], monoC: [0, 1.5], monoB: [0.3, 0.2], doppelsenkung: 0.2, poly0: [2, 0] };

// Englisch: Werte wie Deutsch. Abstimmung auf Haiders EPG64-dev (08.11.2026) brachte keinen Gewinn
// (89,1 statt 88,2 % Silben, Zeilen −0,3) – Fehler liegen im Wortschatz, nicht in den Kosten.
// Seit 10.11.2026 (Jörg: „weg 2, los“): Einsilber nach gelerntem Anteil Hebung aus Gutenberg-Versen (lern = Gewicht
// des Log-Verhältnisses, s. bin/betonung-lernen-en.mjs) und Einsilber am Zeilenende in die Hebung (endeEin).
// Abgestimmt auf EPG64-dev: 88,7 → 91,5 % Silben, 64,2 → 69,2 % Zeilen. Übergangskosten mitabzustimmen brachte
// nur Zehntel (Rauschen bei 260 Zeilen) – sie bleiben wie im Deutschen.
export const K_EN = { ...K, lern: 0.5, endeEin: 0.9 };
export const K_EN_FREI = { ...K_EN, monoU: [0.8, 0], monoC: [0, 1.5], monoB: [0.3, 0.2], doppelsenkung: 0.2, poly0: [2, 0] };
const KOSTEN = { de: [K, K_FREI], en: [K_EN, K_EN_FREI] };

const wortKosten = (s, k) => {
  // gelernter Anteil Hebung (Englisch, s.p): Kosten aus dem Log-Verhältnis
  if (k.lern && s.p != null) {
    const p = Math.min(0.97, Math.max(0.03, s.p)), lo = k.lern * Math.log(p / (1 - p));
    return lo >= 0 ? [0, lo] : [-lo, 0];
  }
  if (s.mehrsilbig) return s.stufe === 2 ? k.poly2 : s.stufe === 1 ? k.poly1 : k.poly0;
  return s.klasse === 'u' ? k.monoU : s.klasse === 'b' ? k.monoB : k.monoC;
};

// Harte Verstöße gegen die Wortbetonung: betonte Inhaltswörter bzw. Hauptakzente in der Senkung.
const verstoesse = (silben, muster) => silben.reduce((n, s, i) =>
  n + (muster[i] === 'W' && ((s.mehrsilbig && s.stufe === 2) || (!s.mehrsilbig && s.klasse === 'c')) ? 1 : 0), 0);

// Streng (Gedicht) und frei (Lied) rechnen; frei gewinnt nur mit weniger harten Verstößen.
export function hebungen(eingabe, sprache = 'de') {
  const [kStreng, kFrei] = KOSTEN[sprache] || KOSTEN.de;
  // Reimsilbe am Zeilenende trägt die Hebung, auch mit bloßem Nebenton (Wellen|tanz, Vollmond|licht)
  const silben = eingabe.slice();
  const l = silben.length - 1;
  if (l > 0 && silben[l].mehrsilbig && silben[l].stufe === 1 && !silben[l].weich) silben[l] = { ...silben[l], stufe: 2 };
  // Einsilber am Zeilenende trägt den Reim und damit die Hebung – auch ein kleines Wort („what thou and I“).
  // Haider-Gold Englisch: 340 von 358 Fällen Hebung; gilt für beide Sprachen.
  if (l > 0 && !silben[l].mehrsilbig && kStreng.endeEin) silben[l] = { ...silben[l], klasse: 'c', p: Math.max(silben[l].p ?? 0, kStreng.endeEin) };
  const streng = hebungenMit(silben, kStreng);
  const frei = hebungenMit(silben, kFrei);
  const vs = verstoesse(silben, streng.muster), vf = verstoesse(silben, frei.muster);
  return vf < vs ? { ...frei, fassung: 'frei' } : { ...streng, fassung: 'streng' };
}

export function hebungenMit(silben, k = K) {
  const n = silben.length;
  if (!n) return { muster: [], kosten: 0 };
  // Zustand: z = Senkungen seit der letzten Hebung (0..2), g = schon eine Hebung gehabt (0/1)
  const idx = (z, g) => z * 2 + g;
  let dp = new Array(6).fill(Infinity), zurueck = [];
  dp[idx(0, 0)] = 0;
  for (let i = 0; i < n; i++) {
    const [kS, kW] = wortKosten(silben[i], k);
    const neu = new Array(6).fill(Infinity), von = new Array(6).fill(null);
    for (let z = 0; z < 3; z++) for (let g = 0; g < 2; g++) {
      const alt = dp[idx(z, g)];
      if (alt === Infinity) continue;
      // Hebung
      let c = alt + kS;
      if (g && z === 0) c += k.prall;
      if (g && z === 2) c += k.doppelsenkung;
      if (!g && z === 2) c += k.auftakt2;
      if (c < neu[idx(0, 1)]) { neu[idx(0, 1)] = c; von[idx(0, 1)] = [idx(z, g), 'S']; }
      // Senkung
      if (z < 2) {
        const c2 = alt + kW, t = idx(z + 1, g);
        if (c2 < neu[t]) { neu[t] = c2; von[t] = [idx(z, g), 'W']; }
      } else if (g) {
        const c2 = alt + kW + k.dreifach, t = idx(2, g);
        if (c2 < neu[t]) { neu[t] = c2; von[t] = [idx(z, g), 'W']; }
      }
    }
    dp = neu; zurueck.push(von);
  }
  let best = Infinity, ende = -1;
  for (let z = 0; z < 3; z++) {
    const c = dp[idx(z, 1)] + (z === 2 ? k.ausklang2 : 0);
    if (c < best) { best = c; ende = idx(z, 1); }
  }
  if (ende < 0) { best = dp[idx(0, 0)]; ende = idx(0, 0); }
  const muster = new Array(n);
  for (let i = n - 1, s = ende; i >= 0; i--) { const [v, a] = zurueck[i][s]; muster[i] = a; s = v; }
  return { muster, kosten: best };
}
