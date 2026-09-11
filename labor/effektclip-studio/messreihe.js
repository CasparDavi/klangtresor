/* Messreihe für das Effektclip-Studio.
 *
 * Hängt jeden Effekt einzeln ein und misst, ob er und jeder seiner Regler überhaupt
 * etwas am Bild ändern. Maß ist die mittlere Abweichung je Bildpunkt (0..255) auf
 * einer verkleinerten Kopie der Malfläche. Ergebnis: window.__sweep.
 *
 * So läuft sie:
 *   1. node bin/effektclip-labor.js daten
 *   2. cd labor/effektclip-studio && python3 -m http.server 18811
 *   3. http://127.0.0.1:18811/labor-haus.html öffnen
 *   4. den Inhalt dieser Datei in die Konsole werfen, dann warten (rund vier Minuten)
 *   5. copy(JSON.stringify(window.__sweep)) und mit messreihe-<Datum>.json vergleichen
 *
 * Was sie NICHT sieht, steht in docs/effektclip/EFFEKTCLIP-REGELN.md unter „Was der Mittelwert
 * nicht sieht": Ereignisse (Sicherung, Glitch-Blöcke) brauchen einen Zeitlauf,
 * punktuelle Effekte (Tropfen, Risse) brauchen den höchsten Bildpunkt statt des
 * Mittelwerts, und ein Regler, der auf ein anderes Element angewiesen ist (der
 * Nebelregler „Im Licht" braucht eine Leuchte in der Kette), misst allein 0.
 */
(async () => {
  const warte = ms => new Promise(r => setTimeout(r, ms));
  const songs = await (await fetch('_songs.json')).json();
  const s = songs.find(x => Array.isArray(x.schlaege) && x.schlaege.length > 60) || songs[0];
  window.__errs = []; window.addEventListener('error', e => window.__errs.push(String(e.message)));

  await fetch('/api/eigen-artwork/' + s.id + '?was=effekt', { method: 'DELETE' });
  await EffektclipStudio.oeffnen(s.id, () => {}); await warte(1800);
  /* Testporträt (Farbe): Haut, Haar, Stoff, dunkler Grund - ein Bild, an dem sich alles zeigt. */
  const q = [...document.querySelectorAll('#tbs-quellen .tbs-quelle')].find(b => /Farbe/.test(b.title));
  if (q) { q.click(); await warte(1000); }

  const lein = document.querySelector('#tbs-lein');
  const kl = document.createElement('canvas'); kl.width = 64; kl.height = 86;
  const kx = kl.getContext('2d', { willReadFrequently: true });
  const grab = () => { kx.clearRect(0, 0, 64, 86); kx.drawImage(lein, 0, 0, 64, 86); return kx.getImageData(0, 0, 64, 86).data.slice(); };
  const mad = (a, b) => { let t = 0; for (let i = 0; i < a.length; i += 4) t += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); return +(t / (a.length / 4) / 3).toFixed(2); };
  const leeren = async () => { let n = 0; while (document.querySelector('#tbs-stapel .tbs-karte [data-tu="weg"]') && n++ < 40) { document.querySelector('#tbs-stapel .tbs-karte [data-tu="weg"]').click(); await warte(40); } };
  const K = () => document.querySelector('#tbs-stapel .tbs-karte');
  const setz = async (k, v) => { const i = K() && K().querySelector('input[type=range][data-k="' + k + '"], input[type=range][data-' + k + ']'); if (!i) return false; i.value = v; i.dispatchEvent(new Event('input')); await warte(240); return true; };

  const typen = [...document.querySelectorAll('.tbs-veintrag')].map(b => b.dataset.typ);
  aktuellId = s.id; audio = { paused: false, currentTime: s.schlaege[40][0] + 0.06 };
  window.__sweep = {}; window.__sweepDone = false;

  for (const typ of typen) {
    window.__sweepStand = typ;
    await leeren();
    document.querySelector('#tbs-vorratKnopf').click(); await warte(80);
    [...document.querySelectorAll('.tbs-veintrag')].find(b => b.dataset.typ === typ).click(); await warte(650);
    if (!K()) { window.__sweep[typ] = { typ, fehler: 'keine Karte' }; continue; }
    const R = { typ, params: {} };
    const pw = K().querySelector('.tbs-pw');
    const an = grab(); pw.click(); await warte(320); const aus = grab(); pw.click(); await warte(320);
    R.anAus = mad(an, aus);
    const regler = [...K().querySelectorAll('input[type=range]')].map(i => ({ k: i.dataset.k || 'staerke', def: i.value, min: i.min, max: i.max }));
    for (const r of regler) {
      if (!await setz(r.k, r.min)) { R.params[r.k] = 'Regler weg'; continue; }
      const a = grab(); await setz(r.k, r.max); const b = grab(); await setz(r.k, r.def);
      R.params[r.k] = mad(a, b);
    }
    for (const sd of [...K().querySelectorAll('select[data-k]')].map(x => ({ k: x.dataset.k, def: x.value, opts: [...x.options].map(o => o.value) }))) {
      const res = {}, basis = grab();
      for (const v of sd.opts) {
        if (v === sd.def) continue;
        const el = K() && K().querySelector('select[data-k="' + sd.k + '"]'); if (!el) break;
        el.value = v; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); await warte(340);
        res[v] = mad(basis, grab());
      }
      const zurueck = K() && K().querySelector('select[data-k="' + sd.k + '"]');
      if (zurueck) { zurueck.value = sd.def; zurueck.dispatchEvent(new Event('input')); zurueck.dispatchEvent(new Event('change')); await warte(260); }
      R.params[sd.k] = res;
    }
    for (const k of [...K().querySelectorAll('button[data-tog]')].map(b => b.dataset.tog)) {
      const b = K() && K().querySelector('button[data-tog="' + k + '"]'); if (!b) continue;
      const basis = grab(); b.click(); await warte(340); R.params[k] = 'S' + mad(basis, grab());
      const zurueck = K() && K().querySelector('button[data-tog="' + k + '"]'); if (zurueck) { zurueck.click(); await warte(160); }
    }
    window.__sweep[typ] = R;
    console.log(typ + ': an/aus ' + R.anAus);
  }
  await leeren(); aktuellId = null; window.__sweepDone = true;
  console.log('fertig — copy(JSON.stringify(window.__sweep))');
})();
