// KlangFeder-Blatt: die Leseansicht des Arbeitsblatts als eigenes Paket (Jörg, 11.11.2026: „B, Paket“ – der KlangTresor
// soll dieselbe Ansicht zeigen wie die KlangFeder). Eine Datei, ohne Abhängigkeiten, ohne Bearbeiten.
// Die KlangFeder setzt ihr Blatt aus denselben Bausteinen zusammen; so bleiben beide Ansichten gleich.
//
// Eingabe ist das Ergebnis der Textanalyse des Kerns (kern/analyse.mjs → anzeige(text), je Zeile ein Eintrag).
// Gebrauch (klassisches Skript, legt window.KlangfederBlatt an):
//   KlangfederBlatt.zeichnen(element, text, zeilen, { sprache: 'de' | 'en' })
// Die Leseansicht zeigt kein Hebungsdiagramm (Jörg, 11.11.2026: „lass das hebungsdiagramm raus, das hell dunkel im text
// ist anzeige genug“); mit { diagramm: true } kommt es zurück. Das Blatt braucht so etwa 600 px Breite.
// Mindestbreite der Textspalte wie in der KlangFeder (420 px); bei wenig Platz: .kf-blatt{--kfb-textbreite:…}
// Optionen (alle frei): t(schlüssel, werte) eigene Übersetzung; formText/formName übersetzen Formtexte des Kerns
// (sonst deutsch wie geliefert); kadA(k) zeigt m/w; wdhText(z) Titel der Marke ↺.
(function (global) {
  'use strict';
  const VERSION = '2026-11-11.1';   // gehört zum Kern gleichen Stands
  const FARBEN = ['#ff7a1a', '#3fc1a5', '#9d8cff', '#e8c27a', '#e0619a', '#7fb2ff', '#c5e05a', '#ff9e9e'];
  const reimFarbe = b => FARBEN[(b.charCodeAt(0) - 65) % FARBEN.length];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Abschnitte: Art aus der Überschrift; Farben des Suno-Editors (Caspar_D, 18.08.2026)
  const BAUTEIL = /^(verse|strophe|chorus|refrain|pre-?chorus|post-?chorus|bridge|intro|outro|interlude|break|drop|hook|final|instrumental|solo)/i;
  const ABS_FARBE = { strophe: '#e31c79', refrain: '#f97b14', bruecke: '#d8d81c', rand: '#16be5c' };
  const abschnittArt = name => { const n = String(name).toLowerCase(); return /pre[\s-]?chorus|pre[\s-]?refrain/.test(n) ? 'rand' : /chorus|refrain|hook/.test(n) ? 'refrain' : /verse|strophe/.test(n) ? 'strophe' : /bridge|break/.test(n) ? 'bruecke' : 'rand'; };
  function abschnittsKarte(zeilen) {
    let akt = null, nr = 0;
    return zeilen.map((roh, i) => {
      const m = roh.trim().match(/^\[([^\]]*)\]$/);
      if (m && BAUTEIL.test(m[1].trim())) { akt = { art: abschnittArt(m[1]), name: m[1].trim(), nr: ++nr, kopf: i }; return { ...akt, istKopf: true }; }
      return akt ? { ...akt, istKopf: false } : null;
    });
  }

  // eigene Sätze (gleich lautend wie in der KlangFeder); „a|b“ = Einzahl|Mehrzahl
  const SAETZE = {
    de: { 'hk.h': '{n} betonte Silbe (Hebung)|{n} betonte Silben (Hebungen)', 'hk.m': 'endet betont (männlich)', 'hk.w': 'endet unbetont (weiblich)',
      'rl.reim': 'Zeilen mit gleichem Buchstaben reimen', 'rl.asso': 'Assonanz: nur die Vokale klingen gleich',
      'rl.plan': 'geplanter Reim {b} – die Zeile ist noch Platzhalter', silben: 'Silben', reim: 'Reim',
      'wdh.einfach': 'derselbe Reimklang steht auch in Zeile {n}' },
    en: { 'hk.h': '{n} stressed syllable|{n} stressed syllables', 'hk.m': 'ends stressed (masculine)', 'hk.w': 'ends unstressed (feminine)',
      'rl.reim': 'Lines with the same letter rhyme', 'rl.asso': 'Assonance: only the vowels sound the same',
      'rl.plan': 'planned rhyme {b} – the line is still a placeholder', silben: 'Syllables', reim: 'Rhyme',
      'wdh.einfach': 'the same rhyme sound also appears in line {n}' },
  };
  const eigenT = sprache => (k, v) => {
    let s = (SAETZE[sprache] || SAETZE.de)[k] ?? SAETZE.de[k] ?? k;
    if (v && v.n != null && s.includes('|')) { const [eins, viele] = s.split('|'); s = +v.n === 1 ? eins : viele; }
    return v ? s.replace(/\{(\w+)\}/g, (_, x) => (v[x] != null ? String(v[x]) : '')) : s;
  };
  const optionen = (o = {}) => {
    const sprache = o.sprache === 'en' ? 'en' : 'de';
    return { sprache, t: o.t || eigenT(sprache), formText: o.formText || (x => x || ''), formName: o.formName || (x => x || ''),
      kadA: o.kadA || (k => (k && sprache === 'en' ? String(k).replace(/w/g, 'f') : k || '')), wdhText: o.wdhText || null };
  };

  // ---------- Bausteine ----------
  // Textzeile: Betonung als Helligkeit (Hebung hell, Nebenton mittel, Senkung gedämpft, Hebungsprall rot), Reimfarbe,
  // unrein gestrichelt, Assonanz gepunktet, Binnenreim durchgezogen; [Regie] grau, # Notiz kursiv
  function zeileHtml(roh, z) {
    if (!z || z.typ === 'leer') return esc(roh) || ' ';
    if (z.typ === 'abschnitt') return `<span class="abs">${esc(roh)}</span>`;
    if (z.typ === 'fremd') return `<span class="fremd">${esc(roh)}</span>`;   // z. B. russisch: nicht analysiert
    if (z.typ === 'kommentar') return `<span class="kommentar">${esc(roh)}</span>`;   // # Notiz: nie gesungen, nie an Suno
    if (!z.silben) return esc(roh) || ' ';
    const teile = [];
    let pos = 0;
    z.silben.forEach((s, i) => {
      if (s.von > pos) teile.push([pos, s.von, null]);
      teile.push([s.von, s.bis, s, i]);
      pos = s.bis;
    });
    if (pos < roh.length) teile.push([pos, roh.length, null]);
    return teile.map(([a, b, s, i]) => {
      let h = esc(roh.slice(a, b));
      if (!s) return h.replace(/\[[^\]]*\]/g, m => `<span class="regie">${m}</span>`).replace(/#.*$/, m => `<span class="kommentar">${m}</span>`);
      const prall = s.m === 'S' && i > 0 && z.silben[i - 1].m === 'S';
      const k = prall ? 'prall' : s.m !== 'S' ? 'h0' : s.st === 1 ? 'h1' : 'h2';
      const rb = s.platz && /^[A-W]$/.test(roh.slice(a, b)) ? reimFarbe(roh.slice(a, b)) : null;   // Reimbuchstabe im Platzhalter
      h = `<span class="s ${k}"${rb ? ` style="color:${rb}"` : ''}>${h}</span>`;
      if (z.reim && a >= z.reimVon && b <= z.reimBis)
        h = `<span class="r${z.reimArt === 'unrein' ? ' unrein' : ''}" style="color:${reimFarbe(z.reim)};text-decoration-color:${reimFarbe(z.reim)}">${h}</span>`;
      if (z.assonanz && a >= z.reimVon && b <= z.reimBis) h = `<span class="asso">${h}</span>`;
      const bin = (z.binnen || []).find(x => a >= x.von && b <= x.bis);
      if (bin) h = `<span class="binnen" style="text-decoration-color:${reimFarbe(bin.r)}">${h}</span>`;
      return h;
    }).join('');
  }
  // Hebungsdiagramm: hoch Hebung, niedrig Senkung, rot Hebungsprall
  function balkenHtml(z) {
    return `<span class="mu">${(z.silben || []).map((s, j) => {
      const prall = s.m === 'S' && j > 0 && z.silben[j - 1].m === 'S';
      return `<i style="height:${s.m === 'S' ? 12 : 3}px;background:${prall ? 'var(--kfb-prall)' : s.m === 'S' ? 'var(--kfb-hebung)' : 'var(--kfb-senkung)'}"></i>`;
    }).join('')}</span>`;
  }
  // Reimbuchstabe; plan = geplanter Buchstabe einer Platzhalterzeile (kursiv)
  function reimHtml(z, o, plan = null) {
    const { t } = optionen(o);
    if (plan) return `<span class="rl plan" style="color:${reimFarbe(plan)}" title="${esc(t('rl.plan', { b: plan }))}">${plan}</span>`;
    return `<span class="rl" style="color:${z.reim ? reimFarbe(z.reim) : 'var(--kfb-schwach)'}" title="${z.assonanz ? esc(t('rl.asso')) : z.reim ? esc(t('rl.reim')) : ''}">${z.reim || z.assonanz || ''}</span>`;
  }
  // Versmaß einer Zeile für den Titel von „4H“
  const versTitel = (v, o) => { const { formText, formName } = optionen(o); return v && v.takt ? ` · ${formText(v.takt)}${v.name ? ' – ' + formName(v.name) : ''}` : ''; };
  // „4H“ und m/w; soll = Kadenzvorgabe ('m'/'w'), weicht die Zeile ab, steht m/w rot; sollText = Zusatz im Titel
  function hebungHtml(z, o, soll = '', sollText = '') {
    const op = optionen(o), t = op.t, ab = soll && soll !== z.k;
    return `<span title="${esc(t('hk.h', { n: z.h }) + versTitel(z.vers, o))}">${z.h}H</span>`
      + `<span title="${esc(t(z.k === 'm' ? 'hk.m' : 'hk.w') + (ab ? sollText : ''))}"${ab ? ' style="color:var(--kfb-prall)"' : ''}>${op.kadA(z.k)}</span>`;
  }
  // wiederholter Reim in einem anderen Abschnitt: stille Marke ↺, beim Draufzeigen wo
  function wdhHtml(z, o) {
    if (!z.wiederholt) return '';
    const op = optionen(o);
    const titel = op.wdhText ? op.wdhText(z) : z.wiederholt.map(x => op.t('wdh.einfach', { n: x.zeile + 1 })).join('\n');
    return `<span class="wdh${z.wiederholt.some(x => x.art !== 'klang') ? ' stark' : ''}" title="${esc(titel)}">↺</span>`;
  }
  // Strophenform: Name hervorgehoben (kern/formen.mjs: kurz/text/name)
  function formMarkeHtml(st, o) {
    const { formText, formName } = optionen(o);
    const tx = esc(formText(st.kurz || st.text)), n = st.name ? esc(formName(st.name)) : '';
    return n && tx.startsWith(n) ? `<b>${n}</b>${tx.slice(n.length)}` : n && tx.includes('(' + n + ')') ? tx.replace('(' + n + ')', `(<b>${n}</b>)`) : n ? `<b>${n}</b> · ${tx}` : tx;
  }
  // Textzelle samt Strophenform-Marke in der Überschrift bzw. Leerzeile davor
  function textZelleHtml(roh, z, nach, o) {
    const fm = nach && nach.strophe && z && (z.typ === 'abschnitt' || z.typ === 'leer') ? formMarkeHtml(nach.strophe, o) : '';
    if (!fm) return zeileHtml(roh, z);
    return z.typ === 'abschnitt' ? zeileHtml(roh, z).replace(/<\/span>$/, `<span class="formmarke">   ${fm}</span></span>`)
      : `${roh.trim() ? esc(roh) + '   ' : ''}<span class="formmarke solo">${fm}</span>`;
  }

  // ---------- fertige Leseansicht ----------
  function zeichnen(ziel, text, zeilen, o = {}) {
    stileEinsetzen(ziel.ownerDocument || document);
    const op = optionen(o), roh = String(text).split('\n'), karte = abschnittsKarte(roh);
    const verse = {};   // Reimschema je Abschnitt aus den Buchstaben der Zeilen, als stille Angabe an der Überschrift
    roh.forEach((_, i) => { const z = zeilen[i], k = karte[i]; if (k && z && z.typ === 'zeile') (verse[k.nr] = verse[k.nr] || []).push(z.reim || 'x'); });
    let h = '';
    roh.forEach((r, i) => {
      const z = zeilen[i], k = karte[i], nach = zeilen[i + 1];
      const st = k && r.trim() ? ` st" style="--st:${ABS_FARBE[k.art]}` : '';
      let links = '', rechts = '';
      if (z && z.typ === 'zeile') {
        links = String(z.n);
        rechts = (o.diagramm ? balkenHtml(z) : '') + reimHtml(z, o) + wdhHtml(z, o) + hebungHtml(z, o);
      } else if (k && k.istKopf && (verse[k.nr] || []).length >= 2) {
        const map = {}; let n = 0;
        const schema = verse[k.nr].map(b => (b === 'x' ? 'x' : (map[b] = map[b] || String.fromCharCode(65 + n++)))).join('');
        rechts = `<span class="kfb-schema">${esc(op.t('reim'))} · ${schema}</span>`;
      }
      h += `<div class="kfb-n${st}">${links}</div><div class="kfb-t">${textZelleHtml(r, z, nach, o)}</div><div class="kfb-r">${rechts}</div>`;
    });
    ziel.classList.add('kf-blatt');
    ziel.innerHTML = h;
  }

  // Stile, gekapselt unter .kf-blatt (dunkel; Text ≥ 4 : 1 gegen den Grund)
  const CSS = `
.kf-blatt{--kfb-text:#ececed;--kfb-mittel:#c4c4c9;--kfb-schwach:#8b8b90;--kfb-prall:#e66767;--kfb-hebung:#c9c9cd;--kfb-senkung:#4a4a50;
  --kfb-zh:28px;--kfb-schrift:17px;--kfb-textbreite:420px;display:grid;grid-template-columns:44px minmax(var(--kfb-textbreite),max-content) max-content;column-gap:28px;
  font-size:var(--kfb-schrift);line-height:var(--kfb-zh);color:var(--kfb-text)}
.kf-blatt .kfb-n,.kf-blatt .kfb-r{height:var(--kfb-zh);display:flex;align-items:flex-end;padding-bottom:7px;box-sizing:border-box;
  font-size:12px;line-height:normal;color:var(--kfb-schwach);font-variant-numeric:tabular-nums}
.kf-blatt .kfb-n{justify-content:flex-end;position:relative}
.kf-blatt .kfb-n.st::after{content:"";position:absolute;right:-17px;top:0;bottom:0;width:3px;background:var(--st)}
.kf-blatt .kfb-r{gap:10px}
.kf-blatt .kfb-t{height:var(--kfb-zh);white-space:pre;tab-size:4}
.kf-blatt .kfb-schema{color:var(--kfb-schwach);font-size:12px}
.kf-blatt .s.h2{color:var(--kfb-text)}.kf-blatt .s.h1{color:var(--kfb-mittel)}.kf-blatt .s.h0{color:var(--kfb-schwach)}.kf-blatt .s.prall{color:var(--kfb-prall)}
.kf-blatt .r .s{color:inherit}.kf-blatt .r .s.h1{opacity:.82}.kf-blatt .r .s.h0{opacity:.62}
.kf-blatt .r{text-decoration-line:none}
.kf-blatt .r.unrein{text-decoration:underline dashed;text-underline-offset:5px;text-decoration-thickness:1px}
.kf-blatt .asso{text-decoration:underline dotted var(--kfb-schwach);text-decoration-thickness:2px;text-underline-offset:5px}
.kf-blatt .binnen{text-decoration-line:underline;text-decoration-style:solid;text-decoration-thickness:2px;text-underline-offset:5px}
.kf-blatt .abs{color:var(--kfb-schwach);font-style:italic;font-size:13.5px;display:inline-block;width:0;overflow:visible;white-space:pre}
.kf-blatt .regie{color:#7c7c82;font-style:italic}
.kf-blatt .kommentar{color:var(--kfb-schwach);font-style:italic}
.kf-blatt .fremd{color:#7c7c82}
.kf-blatt .formmarke{color:var(--kfb-schwach);font-style:normal;font-size:12px;letter-spacing:.01em}
.kf-blatt .formmarke.solo{display:inline-block;width:0;overflow:visible;white-space:pre}
.kf-blatt .formmarke b{font-weight:600;color:var(--kfb-mittel)}
.kf-blatt .mu{display:flex;align-items:flex-end;gap:2px;width:104px;height:14px;overflow:hidden}
.kf-blatt .mu i{width:5px;flex:none;border-radius:1px 1px 0 0}
.kf-blatt .rl{width:12px;font-weight:600;font-size:13px}
.kf-blatt .rl.plan{font-style:italic;font-weight:500}
.kf-blatt .wdh{color:var(--kfb-schwach);font-size:12px;margin-left:3px;cursor:default}.kf-blatt .wdh.stark{color:var(--kfb-mittel)}
`;
  function stileEinsetzen(doc) {
    if (!doc || doc.getElementById('kf-blatt-stil')) return;
    const st = doc.createElement('style'); st.id = 'kf-blatt-stil'; st.textContent = CSS; doc.head.appendChild(st);
  }

  global.KlangfederBlatt = { VERSION, FARBEN, ABS_FARBE, BAUTEIL, reimFarbe, abschnittArt, abschnittsKarte, zeileHtml, balkenHtml, reimHtml,
    hebungHtml, wdhHtml, formMarkeHtml, textZelleHtml, versTitel, zeichnen, stileEinsetzen, CSS };
})(typeof window !== 'undefined' ? window : globalThis);
