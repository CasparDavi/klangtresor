/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   ERSATZZEICHEN - wie wir entscheiden, was die Wahrheit ist
   bin/ersatzzeichen.js (gemeinsam fuer sammeln, aufbereiten, ernte-heilen, gesundheit)

   Sunos Profil-Endpunkt liefert Texte sporadisch mit zerrissenen Mehrbyte-
   Zeichen: statt "gehoert" steht "geh��rt" (24.09.2026, "Das Geschenk";
   frueher "Lenore english" mit "go��" statt "go…"). Caspar_D: "Ich habe
   jetzt etwas Angst, dass das auch woanders passiert, nur eben unbemerkt, weil nicht
   geprueft wird. Wie entscheiden wir, was die Wahrheit ist?"

   DIE REGEL. U+FFFD, das Ersatzzeichen, kommt in echtem Text nie vor - es ist die
   Narbe des Fehlers selbst. Also:
     1. Ein Text mit Ersatzzeichen ist genau an diesen Stellen kaputt, sonst nicht.
     2. Unterscheiden sich zwei Fassungen NUR an Ersatzstellen, ist die ohne die Wahrheit.
     3. Sind beide an verschiedenen Stellen kaputt, ist die Wahrheit aus beiden zu mischen.
     4. Unterscheiden sie sich auch anderswo, ist es eine echte Aenderung - dann gilt
        das Neue, kaputt oder nicht (das Neue kann nicht am Alten geheilt werden).
   Ein Ersatzlauf steht fuer EIN Zeichen (ein bis vier UTF-8-Bytes: Umlaut, Ellipse,
   Emoji), nie fuer ASCII - ASCII kann nicht zerreissen.
   ============================================================= */
'use strict';
const FF = '�';
const hat = t => typeof t === 'string' && t.includes(FF);
const nichtAscii = ch => ch !== undefined && ch > '\x7F' && ch !== FF;

/* Zwei Fassungen desselben Textes aneinanderlegen. Gibt den gemischten Text zurueck
   (aus jeder Fassung das, was dort nicht kaputt ist) - oder null, wenn sie sich
   ausserhalb der Ersatzstellen unterscheiden. */
function angleichen(a, b) {
  a = String(a == null ? '' : a); b = String(b == null ? '' : b);
  const A = Array.from(a), B = Array.from(b);
  /* An jeder Ersatzstelle probiert die Suche 1 bis 4 Zeichen der anderen Seite und laeuft dann
     wortwoertlich weiter; passt es spaeter nicht, kommt sie zurueck und probiert die naechste
     Laenge (die Ellipse vor einem Anfuehrungszeichen: beide sind Nicht-ASCII, nur eines gehoert
     zum Ersatzlauf). Verzweigt wird nur an Ersatzstellen, davon gibt es je Text ein paar. */
  function rest(i, j) {
    const aus = [];
    while (i < A.length || j < B.length) {
      if (A[i] === FF || B[j] === FF) {
        const inA = A[i] === FF; const X = inA ? A : B, Y = inA ? B : A; let x = inA ? i : j, y = inA ? j : i;
        let n = 0; while (X[x + n] === FF) n++;
        for (let k = 1; k <= 4; k++) {
          let gut = true; for (let q = 0; q < k; q++) if (!nichtAscii(Y[y + q])) { gut = false; break; }
          if (!gut) break;
          const r = inA ? rest(i + n, j + k) : rest(i + k, j + n);
          if (r != null) return aus.join('') + Y.slice(y, y + k).join('') + r;
        }
        return null;
      }
      if (A[i] !== B[j]) return null;
      if (A[i] === undefined) break;
      aus.push(A[i]); i++; j++;
    }
    return aus.join('');
  }
  return rest(0, 0);
}
/* Ist `sauber` genau die geheilte Fassung von `kaputt`? */
const passt = (kaputt, sauber) => !hat(sauber) && angleichen(kaputt, sauber) === String(sauber == null ? '' : sauber);

/* Neu gegen alt: was gilt? grund null heisst: kein Ersatzzeichen im Spiel oder eine echte Aenderung. */
function wahrheit(neu, alt) {
  neu = neu == null ? '' : String(neu); alt = alt == null ? '' : String(alt);
  const nk = hat(neu), ak = hat(alt);
  if (!nk && !ak) return { wert: neu, grund: null };
  const m = angleichen(neu, alt);
  if (m == null) return { wert: neu, grund: null };
  if (nk && !ak) return { wert: alt, grund: 'alt bleibt, neu kaputt' };
  if (!nk && ak) return { wert: neu, grund: 'neu heilt alt' };
  return { wert: m, grund: hat(m) ? null : 'aus beiden gemischt' };
}

/* Eine Ernte in sich heilen: ein Clip steht oft mehrfach in derselben Ernte (Profil-Liste,
   Playlists, private Liste). Fuer jedes String-Feld mit Ersatzzeichen wird in den anderen
   Kopien eine passende saubere Fassung gesucht - oder aus mehreren gemischt. Aendert das
   Dokument an Ort und Stelle; gibt den Bericht zurueck. */
function heilen(dok) {
  const kopien = new Map();
  (function sammle(o) {
    if (Array.isArray(o)) { for (const v of o) sammle(v); return; }
    if (!o || typeof o !== 'object') return;
    if (typeof o.id === 'string' && o.metadata && typeof o.metadata === 'object') {
      if (!kopien.has(o.id)) kopien.set(o.id, []);
      kopien.get(o.id).push(o);
    }
    for (const v of Object.values(o)) sammle(v);
  })(dok);
  const wert = (o, pfad) => pfad.reduce((x, k) => (x == null ? undefined : x[k]), o);
  const setz = (o, pfad, v) => { let x = o; for (const k of pfad.slice(0, -1)) x = x[k]; x[pfad[pfad.length - 1]] = v; };
  const bericht = { geheilt: [], offen: [] };
  for (const [id, alle] of kopien) for (const c of alle) {
    const felder = [];
    (function such(o, pfad) {
      if (typeof o === 'string') { if (o.includes(FF)) felder.push(pfad); return; }
      if (Array.isArray(o)) { o.forEach((v, i) => such(v, pfad.concat(i))); return; }
      if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) such(v, pfad.concat(k));
    })(c, []);
    for (const pfad of felder) {
      let text = wert(c, pfad); const vorher = text;
      for (const k of alle) { if (k === c) continue; const v = wert(k, pfad); if (typeof v !== 'string') continue;
        const m = angleichen(text, v); if (m != null && (m.match(/�/g) || []).length < (text.match(/�/g) || []).length) text = m; if (!hat(text)) break; }
      const wo = (c.title || id) + ' · ' + pfad.join('.');
      if (text !== vorher) { setz(c, pfad, text); bericht[hat(text) ? 'offen' : 'geheilt'].push(wo + (hat(text) ? '  (nur teilweise: ' : '  ->  ') + JSON.stringify(text.slice(Math.max(0, vorher.indexOf(FF) - 12), vorher.indexOf(FF) + 12)) + (hat(text) ? ')' : '')); }
      else bericht.offen.push(wo + '  (keine saubere Kopie unter ' + alle.length + ')');
    }
  }
  return bericht;
}

/* Den Bestand zaehlen: wo stehen Ersatzzeichen? Fuer gesundheit.js. */
function zaehlen(o, pfad, aus) {
  if (typeof o === 'string') { if (o.includes(FF)) aus.push({ wo: pfad, n: (o.match(/�/g) || []).length }); return aus; }
  if (Array.isArray(o)) { o.forEach((v, i) => zaehlen(v, pfad + '[' + i + ']', aus)); return aus; }
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) zaehlen(v, pfad ? pfad + '.' + k : k, aus);
  return aus;
}
module.exports = { FF, hat, angleichen, passt, wahrheit, heilen, zaehlen };
