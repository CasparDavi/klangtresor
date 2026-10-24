/* QR-CODE FUER DIE HANDY-ADRESSE (24.10.2026)
   Ein kleiner eigener Kodierer, weil das Paket keine Bibliothek mitbringt und die Adresse ohne Internet zum Handy
   muss. Nur was dafuer noetig ist: Byte-Modus (UTF-8), Fehlerkorrektur M, Versionen 1 bis 10 (bis 213 Bytes), alle
   acht Masken mit der Strafpunktwertung der Norm (ISO/IEC 18004), die beste gewinnt. Gegengeprueft mit dem
   Barcode-Leser von Chrome (BarcodeDetector) an Adressen wie http://imac.fritz.box:8788.
   window.qrMatrix(text) -> Array von Zeilen aus true/false;  window.qrSvg(text, rand) -> SVG-Text. */
(function () {
  /* Je Version (1..10), Stufe M: [Fehlerkorrektur-Bytes je Block, [[Bloecke, Datenbytes je Block], ...]] */
  const M = [null,
    [10, [[1, 16]]], [16, [[1, 28]]], [26, [[1, 44]]], [18, [[2, 32]]], [24, [[2, 43]]],
    [16, [[4, 27]]], [18, [[4, 31]]], [22, [[2, 38], [2, 39]]], [22, [[3, 36], [2, 37]]], [26, [[4, 43], [1, 44]]]];
  const AUSRICHTUNG = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

  /* Galoisfeld GF(256), Polynom 0x11D */
  const EXP = new Array(512), LOG = new Array(256);
  for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D; }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  const mal = (a, b) => (a && b) ? EXP[LOG[a] + LOG[b]] : 0;
  function generator(n) {
    let g = [1];
    for (let i = 0; i < n; i++) {
      const neu = new Array(g.length + 1).fill(0);
      for (let j = 0; j < g.length; j++) { neu[j] ^= g[j]; neu[j + 1] ^= mal(g[j], EXP[i]); }
      g = neu;
    }
    return g;
  }
  function rest(daten, n) {
    const g = generator(n), r = new Array(n).fill(0);
    for (const b of daten) {
      const f = b ^ r[0]; r.shift(); r.push(0);
      for (let i = 0; i < n; i++) r[i] ^= mal(g[i + 1], f);
    }
    return r;
  }

  function kodieren(text) {
    const bytes = Array.from(new TextEncoder().encode(text));
    let v = 1, kap = 0;
    for (; v <= 10; v++) {
      kap = M[v][1].reduce((s, [n, k]) => s + n * k, 0);
      const noetig = 4 + (v < 10 ? 8 : 16) + 8 * bytes.length;
      if (noetig <= kap * 8) break;
    }
    if (v > 10) throw new Error('qr: Text zu lang');
    /* Bitstrom: Modus 0100, Laenge, Daten, Ende, Fuellbytes */
    const bits = [];
    const put = (wert, n) => { for (let i = n - 1; i >= 0; i--) bits.push((wert >>> i) & 1); };
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
    put(0, Math.min(4, kap * 8 - bits.length));
    while (bits.length % 8) bits.push(0);
    const daten = [];
    for (let i = 0; i < bits.length; i += 8) daten.push(bits.slice(i, i + 8).reduce((a, b) => a * 2 + b, 0));
    for (let f = 0; daten.length < kap; f++) daten.push(f % 2 ? 0x11 : 0xEC);
    /* Bloecke, Fehlerkorrektur, verschraenken */
    const [ecn, gruppen] = M[v], bloecke = [];
    let p = 0;
    for (const [n, k] of gruppen) for (let i = 0; i < n; i++) { const d = daten.slice(p, p + k); p += k; bloecke.push({ d, e: rest(d, ecn) }); }
    const aus = [];
    const maxd = Math.max(...bloecke.map(b => b.d.length));
    for (let i = 0; i < maxd; i++) for (const b of bloecke) if (i < b.d.length) aus.push(b.d[i]);
    for (let i = 0; i < ecn; i++) for (const b of bloecke) aus.push(b.e[i]);
    return { v, aus };
  }

  function matrix(text) {
    const { v, aus } = kodieren(text), N = 17 + 4 * v;
    const m = Array.from({ length: N }, () => new Array(N).fill(false));
    const fest = Array.from({ length: N }, () => new Array(N).fill(false));
    const setze = (x, y, w) => { m[y][x] = w; fest[y][x] = true; };
    const finder = (x0, y0) => {
      for (let dy = -1; dy <= 7; dy++) for (let dx = -1; dx <= 7; dx++) {
        const x = x0 + dx, y = y0 + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue;
        const r = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
        setze(x, y, r !== 2 && r !== 4);
      }
    };
    finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
    for (let i = 8; i < N - 8; i++) { setze(i, 6, i % 2 === 0); setze(6, i, i % 2 === 0); }
    const a = AUSRICHTUNG[v];
    const l = a.length - 1;
    for (let i = 0; i <= l; i++) for (let j = 0; j <= l; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === l) || (i === l && j === 0)) continue;   /* nicht ueber die Finder; ueber die Taktlinien schon */
      const ax = a[i], ay = a[j];
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setze(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    /* Formatfelder reservieren (Inhalt spaeter), dunkles Modul */
    for (let i = 0; i < 9; i++) { if (!fest[8][i]) setze(i, 8, false); if (!fest[i][8]) setze(8, i, false); }
    for (let i = 0; i < 8; i++) { setze(N - 1 - i, 8, false); setze(8, N - 1 - i, false); }
    setze(8, N - 8, true);
    /* Versionsfelder ab Version 7 */
    if (v >= 7) {
      let r = v; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
      const vb = (v << 12) | r;
      for (let i = 0; i < 18; i++) { const b = ((vb >>> i) & 1) === 1, x = N - 11 + (i % 3), y = Math.floor(i / 3); setze(x, y, b); setze(y, x, b); }
    }
    /* Daten im Zickzack */
    const datenBits = []; aus.forEach(b => { for (let i = 7; i >= 0; i--) datenBits.push((b >>> i) & 1); });
    let k = 0;
    for (let rechts = N - 1; rechts >= 1; rechts -= 2) {
      if (rechts === 6) rechts = 5;
      for (let j = 0; j < N; j++) for (let s = 0; s < 2; s++) {
        const x = rechts - s, hoch = ((rechts + 1) & 2) === 0, y = hoch ? N - 1 - j : j;
        if (fest[y][x]) continue;
        m[y][x] = k < datenBits.length ? datenBits[k] === 1 : false; k++;
      }
    }
    /* Masken probieren */
    const MASKE = [
      (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0, (x, y) => (x * y) % 2 + (x * y) % 3 === 0,
      (x, y) => ((x * y) % 2 + (x * y) % 3) % 2 === 0, (x, y) => ((x + y) % 2 + (x * y) % 3) % 2 === 0];
    const format = (maske) => {
      const d = (0 << 3) | maske;            /* Stufe M = 00 */
      let r = d << 10; for (let i = 14; i >= 10; i--) if ((r >>> i) & 1) r ^= 0x537 << (i - 10);
      return ((d << 10) | r) ^ 0x5412;
    };
    const mitMaske = (maske) => {
      const q = m.map(z => z.slice());
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!fest[y][x] && MASKE[maske](x, y)) q[y][x] = !q[y][x];
      const f = format(maske), bit = (i) => ((f >>> i) & 1) === 1;
      for (let i = 0; i <= 5; i++) q[i][8] = bit(i);
      q[7][8] = bit(6); q[8][8] = bit(7); q[8][7] = bit(8);
      for (let i = 9; i < 15; i++) q[8][14 - i] = bit(i);
      for (let i = 0; i < 8; i++) q[8][N - 1 - i] = bit(i);
      for (let i = 8; i < 15; i++) q[N - 15 + i][8] = bit(i);
      q[N - 8][8] = true;
      return q;
    };
    const strafe = (q) => {
      let s = 0;
      for (let dreh = 0; dreh < 2; dreh++) for (let a1 = 0; a1 < N; a1++) {
        let lauf = 1;
        for (let b1 = 1; b1 < N; b1++) {
          const c = dreh ? q[b1][a1] : q[a1][b1], c0 = dreh ? q[b1 - 1][a1] : q[a1][b1 - 1];
          if (c === c0) { lauf++; if (lauf === 5) s += 3; else if (lauf > 5) s++; } else lauf = 1;
        }
        for (let b1 = 0; b1 + 10 < N; b1++) {
          const z = (i) => dreh ? q[b1 + i][a1] : q[a1][b1 + i];
          const muster = [true, false, true, true, true, false, true];
          const ok = muster.every((w, i) => z(i) === w);
          if (ok && ((!z(7) && !z(8) && !z(9) && !z(10)))) s += 40;
          const ok2 = muster.every((w, i) => z(i + 4) === w);
          if (ok2 && !z(0) && !z(1) && !z(2) && !z(3)) s += 40;
        }
      }
      for (let y = 0; y < N - 1; y++) for (let x = 0; x < N - 1; x++) {
        const c = q[y][x]; if (c === q[y][x + 1] && c === q[y + 1][x] && c === q[y + 1][x + 1]) s += 3;
      }
      let dunkel = 0; q.forEach(z => z.forEach(c => { if (c) dunkel++; }));
      s += Math.floor(Math.abs(dunkel * 20 - N * N * 10) / (N * N)) * 10;
      return s;
    };
    let best = null, bestS = Infinity;
    for (let mk = 0; mk < 8; mk++) { const q = mitMaske(mk), s = strafe(q); if (s < bestS) { bestS = s; best = q; } }
    return best;
  }

  window.qrMatrix = matrix;
  window.qrSvg = function (text, rand = 4) {
    const q = matrix(text), N = q.length, G = N + 2 * rand;
    let d = '';
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (q[y][x]) d += `M${x + rand} ${y + rand}h1v1h-1z`;
    /* Hell auf dunkel ist Hausregel - der Code selbst aber braucht dunkle Module auf hellem Grund, sonst lesen ihn
       viele Kameras nicht. Darum eine eigene helle Karte nur um den Code. */
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${G} ${G}" shape-rendering="crispEdges"><rect width="${G}" height="${G}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  };
})();
