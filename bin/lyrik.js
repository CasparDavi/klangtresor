#!/usr/bin/env node
/**
 * Bereinigte Lyrik — der gesungene Text, und nur der.
 *
 *   node bin/lyrik.js                 Bericht, schreibt nichts
 *   node bin/lyrik.js --tun           schreibt library/lyrik.json
 *   node bin/lyrik.js <id>            nur dieses Lied, ausführlich
 *   node bin/lyrik.js --unsicher      listet die Lieder, die durchfallen
 *
 * WARUM ES DAS GIBT (Caspar_D, 07.09.2026): „lyricsWorte sind uns schon
 * mehrmals auf die Füsse gefallen, wir brauchen einen Whisper-basierten
 * Lyricscleaner, der alles, was nicht Lyrics ist löscht und sicherstellt
 * dass die Wortzahlen stimmen."
 *
 * Das Feld `lyrics` im Katalog ist Caspar_Ds Einreichung an Suno. Darin
 * steht mehr als der Gesang: Regieanweisungen in eckigen Klammern,
 * Vorreden, Widmungen an andere Künstler, Playlist-Hinweise, und bei
 * vielen Liedern die vollständige zweite Sprachfassung. Jede Zählung auf
 * diesem Feld zählt das mit. `lyricsWorte` in bin/katalog.js versucht das
 * über Trennlinien abzufangen und bricht deshalb bei „Ulrich & Ännchen"
 * nach 25 von 292 Wörtern ab — dort trennen die Striche Strophen, nicht
 * Sprachfassungen.
 *
 * NICHTS VON SUNO WIRD VERÄNDERT (Caspar_D, 07.09.2026: „ein zweites
 * Fenster auf jeden Fall, nichts, was von suno kommt sollte verändert
 * werden"). `lyrics` und `worte` im Katalog bleiben, wie sie sind. Das
 * Ergebnis steht in einer eigenen Datei, wie klang.json und toene.json
 * auch.
 *
 * DIE QUELLE IST WHISPER, NICHT DER KATALOG. Das Feld `worte` im Katalog
 * stammt bei fast allen Liedern von Suno und ist aus dem eingereichten
 * Text abgeleitet — ein Abgleich damit vergleicht den Text mit sich
 * selbst (gemessen: 100 % Deckung bei identischer Wortzahl). Whisper hat
 * den Ton gehört; seine Marken liegen in library/whisper.ndjson.
 *
 * DAS VERFAHREN
 *   1. Regieanweisungen fliegen ohne Alignment. Sie sind Anweisung, nicht
 *      Text. Zwei Formen:
 *      - Ganze Zeile: eckige oder runde Klammern über die ganze Zeile
 *        (auch mit Klammern darin), eine Regiezeile mit #, oder eine
 *        Trennlinie aus Strichen/Gleichzeichen.
 *      - Einschub in einer sonst gesungenen Zeile — „[soft] schau sie nur
 *        an." — der Klammerteil fällt aus dem Zeilentext, der Rest bleibt.
 *   2. Globales Alignment (Needleman-Wunsch) zwischen dem Wortstrom des
 *      Liedtexts und dem, was Whisper gehört hat.
 *   3. Zwei Zusätze, ohne die echte Zeilen verlorengehen — beide gemessen
 *      am Bestand, nicht geraten:
 *      - Wörter gelten als gleich bei einem Buchstaben Abstand. Whisper
 *        schreibt „finsterem", Caspar_D schreibt „finst'rem".
 *      - Eine ungedeckte Zeile ZWISCHEN gedeckten Zeilen bleibt stehen.
 *        Whisper überhört einzelne Zeilen; dass die Nachbarn sitzen, ist
 *        der Beleg, daß mitgesungen wurde. Über den Bestand rettet das
 *        1466 Wörter. Höchstens zwei Zeilen am Stück — eine ganze Strophe
 *        in einer anderen Sprache soll nicht durchrutschen.
 *   4. Zeitanker je Zeile aus denselben Whisper-Marken. Gerettete Zeilen
 *      haben keine eigenen und tragen deshalb `geschaetzt`.
 *
 * WO ES AUFHÖRT. Unter DECKUNG_MINDEST wird nicht gereinigt, sondern
 * gemeldet. Bei „Ik will …" (Plattdeutsch) versteht Whisper so wenig, daß
 * echte Zeilen durchfielen — dort darf die Software nicht entscheiden.
 * Dasselbe gilt, wenn Whisper gar nichts hat.
 *
 * FASSUNG 2 (Caspar_D, 25.09.2026). Zwei Befunde im Bestand:
 *
 * ERSTENS: Regieanweisungen kamen durch. Gezählt: 13 ganze Zeilen wie
 * „[Post-Chorus Hook (instrumental)]" und 190 Zeilen mit Einschüben wie
 * „[soft] schau sie nur an." Caspar_D: „das sollte in der bereinigten
 * Lyrics nicht passieren, ist ja bereinigt um sowas." Grund: die alte
 * `istRegie`-Regel (eine öffnende Klammer, dann kein `]`/`)` bis zum
 * Ende) scheitert an eigenen Klammern IN der Anweisung — „(instrumental)"
 * schließt vor dem äußeren „]", der Rest der Zeile passt dann nicht mehr
 * ins Muster. Einschübe MITTEN in einer Zeile prüfte sie gar nicht — nur
 * ganze Zeilen fielen unter „Regie". Jetzt: ganze Zeile via
 * `istRegieZeile` (== `istNichtGesungen` in web/index.html), Einschübe
 * separat via `EINSCHUB_ENTFERNEN`.
 *
 * ZWEITENS: zwei Fehler im Zeitverfahren, beide daraus, dass Whisper
 * (Verfahren „dtw") vielen Wörtern dieselbe Start- und Endzeit gibt
 * (Dauer 0) — echte Messung, aber ohne Standzeit.
 *   (a) Hat eine gesungene Zeile nur eine solche Marke, ist ihr `von`
 *       gleich ihrem `bis`. Die nächste Zeile ist oft `geschaetzt` und
 *       begann bisher GENAU an diesem `bis` — im selben Augenblick wie
 *       die vorige Zeile. 19 Zeilenpaare im Bestand teilten sich so ihr
 *       `von`. Jetzt: eine Zeile mit einer solchen entarteten Marke
 *       (Standzeit < 0,3 s) bekommt ihre Standzeit aus der Spanne bis zur
 *       nächsten ECHTEN (nicht entarteten) Marke, geteilt nach Zeichen-
 *       zahl mit den geschätzten Zeilen dazwischen — nicht mehr bei sich
 *       selbst abgeschnitten.
 *   (b) Landen zwei Textzeilen auf genau denselben Whisper-Marken (6 Fälle
 *       im Bestand), bekommen beide dieselbe Spanne verdoppelt. Jetzt:
 *       die eine gemeinsame Spanne wird nach Zeichenzahl zwischen den
 *       Zeilen geteilt.
 *   Beides ändert NUR geschätzte oder entartete Zeiten — eine echte,
 *   nicht-entartete Zeitmarke bleibt, wie Whisper sie gemessen hat.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const K    = require('./katalog.js');

const WURZEL   = path.join(__dirname, '..');
const WHISPER  = path.join(WURZEL, 'library', 'whisper.ndjson');
const ZIEL     = path.join(WURZEL, 'library', 'lyrik.json');

/* Hochzaehlen bei jeder Aenderung am Verfahren (Regeln oben im Kopf-
   kommentar) - steht als `fassung` in library/lyrik.json, damit man
   hinterher weiss, nach welchen Regeln eine Zeile bereinigt wurde. */
const FASSUNG  = 2;

/* Unter dieser Deckung wird nicht gereinigt, sondern gemeldet. 0,60 ist
   nicht geraten: Bei dieser Grenze fallen 14 von 254 Liedern durch, und
   das sind genau die, bei denen Whisper an der Sprache scheitert
   (Plattdeutsch, Japanisch) oder der Text zu mehr als der Hälfte aus
   einer zweiten Fassung besteht. Bei 0,80 wären es 71 — darunter viele,
   die sauber gereinigt werden. */
const DECKUNG_MINDEST = 0.60;

/* Wieviele ungedeckte Zeilen am Stück die Nachbarschaft noch überbrücken
   darf. Drei und mehr sind im Bestand fast immer ein eigener Block. */
const LUECKE_MAX = 2;

/* Unter dieser Standzeit (bis-von) gilt die eigene Whisper-Marke einer
   Zeile als entartet, nicht als gemessen (Caspar_D, 25.09.2026, FASSUNG
   2 - siehe Kopfkommentar, Fehler (a)). Whisper (Verfahren „dtw") gibt
   sehr vielen Wörtern dieselbe Start- und Endzeit; hat eine Zeile nur
   eine solche Marke, ist ihr `von` echt, ihre Standzeit aber nicht. 0,3 s
   ist die Zahl aus Caspar_Ds Befund. */
const STANDZEIT_ENTARTET = 0.3;

/* ---- Wortvergleich ---------------------------------------------------
   CJK-Zeichen zählen einzeln als Wort: Japanisch kennt keine Leerzeichen,
   und Whisper setzt sie anders als der Liedtext. Zeichenweise alignieren
   umgeht die Frage der Wortgrenzen ganz. */
function woerter(text) {
  const aus = [];
  let puffer = '';
  for (const z of String(text).toLowerCase()) {
    const code = z.codePointAt(0);
    const cjk = (code >= 0x3040 && code <= 0x30ff) || (code >= 0x4e00 && code <= 0x9fff);
    if (cjk) { if (puffer) { aus.push(puffer); puffer = ''; } aus.push(z); continue; }
    if (/[a-zäöüß0-9]/.test(z)) puffer += z;
    else if (/['’`´]/.test(z)) continue;          // Elision: finst'rem
    else if (puffer) { aus.push(puffer); puffer = ''; }
  }
  if (puffer) aus.push(puffer);
  return aus;
}

/* Fast gleich: identisch, ein Buchstabe Abstand bei Wörtern ab vier
   Zeichen, oder ein gemeinsamer Anfang von fünf Zeichen. */
function fastGleich(a, b) {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;
  if (Math.abs(a.length - b.length) > 1) {
    let k = 0;
    while (k < a.length && k < b.length && a[k] === b[k]) k++;
    return k >= 5;
  }
  let i = 0, j = 0, fehler = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++fehler > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return fehler + (a.length - i) + (b.length - j) <= 1;
}

/* ---- Alignment -------------------------------------------------------
   Needleman-Wunsch, zwei Zeilen im Speicher, der Weg als Bitfeld. Für
   1200 gegen 1400 Wörter sind das 1,7 MB und Millisekunden.
   Rückgabe je Textwort: der Index des Whisper-Wortes, auf das es fällt,
   oder -1. Der Index trägt später die Zeitmarke. */
function alignieren(a, b) {
  const n = a.length, m = b.length;
  const paar = new Int32Array(n).fill(-1);
  if (!n || !m) return paar;
  const TREFFER = 2, FEHL = -1, LUECKE = -1;
  const weg = new Uint8Array((n + 1) * (m + 1));
  let vor = new Int32Array(m + 1), jetzt = new Int32Array(m + 1);
  for (let j = 0; j <= m; j++) { vor[j] = j * LUECKE; weg[j] = 2; }
  for (let i = 1; i <= n; i++) {
    jetzt[0] = i * LUECKE; weg[i * (m + 1)] = 1;
    for (let j = 1; j <= m; j++) {
      const diag = vor[j - 1] + (fastGleich(a[i - 1], b[j - 1]) ? TREFFER : FEHL);
      const hoch = vor[j] + LUECKE;
      const link = jetzt[j - 1] + LUECKE;
      let best = diag, r = 0;
      if (hoch > best) { best = hoch; r = 1; }
      if (link > best) { best = link; r = 2; }
      jetzt[j] = best; weg[i * (m + 1) + j] = r;
    }
    const t = vor; vor = jetzt; jetzt = t;
  }
  let i = n, j = m;
  while (i > 0 && j > 0) {
    const r = weg[i * (m + 1) + j];
    if (r === 0) { if (fastGleich(a[i - 1], b[j - 1])) paar[i - 1] = j - 1; i--; j--; }
    else if (r === 1) i--;
    else j--;
  }
  return paar;
}

/* Ganze Zeile ist Regie, kein Text - dieselbe Regel wie `istNichtGesungen`
   in web/index.html (dort ~Zeile 16881, per grep gefunden). Die alte Regel
   hier (`/^\s*[[(][^\]\)]*[\])]?\s*$/`) scheiterte an einer Klammer IN der
   Anweisung: „[Post-Chorus Hook (instrumental)]" schließt das `)` schon
   vor dem äußeren `]`, danach passt der Rest nicht mehr ins Muster - 13
   solcher Zeilen im Bestand kamen so durch (Caspar_D, 25.09.2026, FASSUNG
   2). Das Muster fuer eckige Klammern ist gierig und schließt über jede innere Klammer hinweg.
   Runde Klammern über die GANZE Zeile bleiben Regie wie in Fassung 1: im
   Bestand sind das Produktionsnotizen („(Dry, close mic, no reverb...)",
   Pfeifenwald), keine Begleitstimmen - ohne diese Regel fiel Pfeifenwald
   von 66 % auf 38 % Deckung (Nacht 25.09.2026). Begleitstimmen in runden
   Klammern MITTEN in einer Zeile bleiben Text; nur eckige Einschübe fallen.
   Die Bühne (istNichtGesungen) lässt runde Klammerzeilen stehen - sie zeigt
   den Rohtext, die bereinigte Lyrik ist strenger. */
const istRegieZeile = (z) => {
  const t = z.trim();
  /* Dazu die Regel aus Fassung 1: eine Zeile, die mit einer Klammer beginnt und nirgends schliesst, ist der
     Anfang einer mehrzeiligen Notiz (Pfeifenwald: (Dry, close mic, no reverb... ueber mehrere Zeilen). */
  return /^\[.*\]$/.test(t) || /^\(.*\)$/.test(t) || /^[\[(][^\])]*$/.test(t) || /^#/.test(t) || /^[-=]{3,}/.test(t);
};

/* Regieanweisung MITTEN in einer sonst gesungenen Zeile - „[soft] schau
   sie nur an.", „Sonst hell das Licht. [pause] Heute nur wir." Die alte
   Regel prüfte nur ganze Zeilen; ein Einschub blieb komplett im Text
   stehen und lief mit ins Alignment (190 Zeilen im Bestand, Caspar_D,
   25.09.2026: „das sollte in der bereinigten Lyrics nicht passieren, ist
   ja bereinigt um sowas"). ERKENNEN ohne `g`-Flag (fuer .test, kein
   lastIndex-Zustand), ENTFERNEN mit `g` (fuer .replace, alle Einschübe
   einer Zeile). */
const EINSCHUB_ERKENNEN  = /\[[^\]]*\]/;
const EINSCHUB_ENTFERNEN = /\[[^\]]*\]/g;

/* Eine Zeitspanne [von, bis) der Reihe nach auf eine Gruppe von Zeilen
   verteilen, nach Zeichenzahl der Zeile — eine lange Zeile bekommt mehr
   Standzeit als „Ja." nebenan. Mutiert die Objekte der Liste direkt.
   Genutzt für beide Zeitfehler aus FASSUNG 2 (siehe Kopfkommentar):
   die entartete Zeile mit ihren geschätzten Nachbarn, und zwei Zeilen
   auf derselben Spanne. Mindestens ein Zeichen je Zeile, damit eine
   leere Zeile nicht mit Gewicht 0 dasteht. */
function verteilenNachZeichen(gruppe, von, bis) {
  const laengen = gruppe.map(g => Math.max(1, g.text.length));
  const gesamt = laengen.reduce((a, b) => a + b, 0);
  const spanne = bis - von;
  let cursor = von;
  gruppe.forEach((g, idx) => {
    const ende = idx === gruppe.length - 1 ? bis : +(cursor + spanne * laengen[idx] / gesamt).toFixed(2);
    g.von = +cursor.toFixed(2);
    g.bis = ende;
    cursor = ende;
  });
}

/* ---- Ein Lied reinigen ----------------------------------------------- */
function reinigen(lyrics, marken) {
  /* Einschübe wie „[soft]" fallen aus dem Zeilentext, VOR dem Alignment -
     der Rest der Zeile bleibt unverändert (Caspar_D, 25.09.2026, FASSUNG
     2, siehe Kopfkommentar). Zeilen ohne Einschub bleiben BYTE-GLEICH
     (kein trim, keine Leerzeichen-Normierung) — sonst wäre ein Lied ohne
     jeden Regie-Tag nicht mehr bitgleich zur vorigen Fassung. Ganze
     Regiezeilen (`istRegieZeile`) bleiben unangetastet, sie fliegen weiter
     unten komplett raus. */
  let einschuebeEntfernt = 0;
  const zeilen = String(lyrics || '').split('\n').map(z => {
    if (istRegieZeile(z)) return z;
    if (!EINSCHUB_ERKENNEN.test(z)) return z;
    einschuebeEntfernt++;
    return z.replace(EINSCHUB_ENTFERNEN, ' ').replace(/\s+/g, ' ').trim();
  });
  const bTexte = marken.map(w => String(w[2]));
  const bW = [], bZuMarke = [];
  bTexte.forEach((t, mi) => { for (const w of woerter(t)) { bW.push(w); bZuMarke.push(mi); } });
  if (bW.length < 20) return { grund: 'Whisper hat zu wenig gehört', deckung: 0 };

  const aW = [], aZuZeile = [];
  zeilen.forEach((z, zi) => {
    if (istRegieZeile(z)) return;
    for (const w of woerter(z)) { aW.push(w); aZuZeile.push(zi); }
  });
  if (aW.length < 10) return { grund: 'zu wenig Text', deckung: 0 };

  /* ZWEI SCHRIFTEN, KEIN ALIGNMENT (gefunden 07.09.2026). Bei den
     japanischen Liedern steht der Text in japanischer Schrift, Whisper
     aber schreibt lateinische Umschrift und übersetzt streckenweise ins
     Englische: „本物が見える" gegen „HONMONO NO MAMORI HITOYO / I can see
     the real thing". Zeichenweise alignieren hilft da nicht — es sind
     verschiedene Alphabete. Das ist kein Fehler des Verfahrens, und es
     soll auch nicht als „0 % gedeckt" durchgehen, was nach schlechtem
     Gesang klänge. Eine Umschrift wäre der Weg, wenn es je nötig wird. */
  const cjkAnteil = (liste) => {
    if (!liste.length) return 0;
    let n = 0;
    for (const w of liste) if (/[぀-ヿ一-鿿]/.test(w)) n++;
    return n / liste.length;
  };
  const cjkText = cjkAnteil(aW), cjkGehoert = cjkAnteil(bW);
  if (cjkText > 0.3 && cjkGehoert < 0.05)
    return { grund: 'Text in japanischer Schrift, Whisper in Umschrift', deckung: 0, schriftbruch: true };

  const paar = alignieren(aW, bW);

  /* Je Zeile: wieviele Wörter, wieviele gedeckt, und die Whisper-Marken,
     auf die sie fallen. */
  const proZeile = new Map();
  paar.forEach((p, k) => {
    const zi = aZuZeile[k];
    if (!proZeile.has(zi)) proZeile.set(zi, { n: 0, gut: 0, marken: [] });
    const e = proZeile.get(zi);
    e.n++;
    if (p >= 0) { e.gut++; e.marken.push(bZuMarke[p]); }
  });

  const zustand = zeilen.map((z, i) => {
    if (istRegieZeile(z)) return 'regie';
    const e = proZeile.get(i);
    if (!e) return 'leer';
    return e.gut / e.n >= 0.5 ? 'gesungen' : 'offen';
  });

  /* Offene Zeilen zwischen gesungenen retten — höchstens LUECKE_MAX am
     Stück, und nur, wenn auf beiden Seiten wirklich gesungen wird. */
  for (let i = 0; i < zustand.length; i++) {
    if (zustand[i] !== 'offen') continue;
    let j = i;
    while (j < zustand.length && (zustand[j] === 'offen' || zustand[j] === 'leer' || zustand[j] === 'regie')) j++;
    const offen = [];
    for (let k = i; k < j; k++) if (zustand[k] === 'offen') offen.push(k);
    const davor = zustand.slice(0, i).filter(x => x === 'gesungen' || x === 'offen').pop();
    const danach = zustand.slice(j).find(x => x === 'gesungen' || x === 'offen');
    if (offen.length <= LUECKE_MAX && davor === 'gesungen' && danach === 'gesungen')
      for (const k of offen) zustand[k] = 'gerettet';
    i = j - 1;
  }

  /* Zeilen bauen. Zeitmarken aus den Whisper-Marken der Zeile; gerettete
     Zeilen bekommen die Lücke zwischen ihren Nachbarn und tragen das
     ausdrücklich als `geschaetzt`. Eine Zeile, deren eigene Marken auf
     eine Standzeit unter STANDZEIT_ENTARTET zusammenfallen (`von`/`bis`
     fast oder ganz gleich), bekommt vorerst KEIN `bis` — ihr `von` ist
     echt, ihre Standzeit nicht (Fehler (a), FASSUNG 2, Kopfkommentar). */
  const behalten = [];
  zeilen.forEach((z, i) => {
    if (zustand[i] !== 'gesungen' && zustand[i] !== 'gerettet') return;
    const e = proZeile.get(i);
    const text = z.trim();
    if (!text) return;
    if (e && e.marken.length) {
      const mi = e.marken;
      const von = Math.min(...mi.map(x => marken[x][0]));
      const bis = Math.max(...mi.map(x => marken[x][1]));
      const roh = { von: +von.toFixed(2), bis: +bis.toFixed(2), text };
      if (roh.bis - roh.von < STANDZEIT_ENTARTET) { roh.bis = null; roh.entartet = true; }
      behalten.push(roh);
    } else {
      behalten.push({ von: null, bis: null, text, geschaetzt: true });
    }
  });

  /* FEHLER (b), FASSUNG 2: zwei echte (nicht entartete) Zeilen hinter-
     einander auf exakt derselben Spanne — dieselben Whisper-Marken wurden
     beiden zugeschlagen. Die eine gemessene Spanne wird nach Zeichenzahl
     zwischen ihnen geteilt, statt beiden verdoppelt zu gehören. */
  let zeitAngepasstAnzahl = 0;
  for (let i = 0; i < behalten.length; i++) {
    if (behalten[i].von === null || behalten[i].entartet) continue;
    let j = i + 1;
    while (j < behalten.length && !behalten[j].entartet
           && behalten[j].von === behalten[i].von && behalten[j].bis === behalten[i].bis) j++;
    if (j - i < 2) { i = j - 1; continue; }
    const gruppe = behalten.slice(i, j);
    verteilenNachZeichen(gruppe, behalten[i].von, behalten[i].bis);
    for (let k = i; k < j; k++) behalten[k].zeitAngepasst = true;
    zeitAngepasstAnzahl += j - i;
    i = j - 1;
  }

  /* FEHLER (a), FASSUNG 2: die entartete Zeile und ihre `geschaetzt`en
     Nachbarn zusammen in die Lücke bis zur nächsten ECHTEN (nicht
     entarteten) Marke legen. Ein Lauf OHNE jede entartete Zeile bekommt
     exakt die alte Gleichverteilung (spanne/anzahl) — bitgleich zur
     vorigen Fassung. Ein Lauf MIT mindestens einer entarteten Zeile wird
     an deren `von` als Fixpunkt in Teilstücke zerlegt, jedes Teilstück
     nach Zeichenzahl geteilt: die entartete Zeile bekommt so ihre
     Standzeit aus der Spanne bis zur nächsten echten Marke, statt bei
     sich selbst (Dauer 0) zu enden. Ohne eine echte Marke am Ende bleibt
     die entartete Zeile bei ihrer alten, unveränderten Standzeit (Dauer
     0) — eine erfundene Zeit wäre schlimmer als keine. */
  let standzeitGeschaetztAnzahl = 0;
  for (let i = 0; i < behalten.length; i++) {
    if (behalten[i].bis !== null) continue;
    let j = i; while (j < behalten.length && behalten[j].bis === null) j++;
    const a = i - 1, b = j;
    if (b >= behalten.length) { i = j; continue; } // kein Ende in Sicht - unveraendert lassen (wie bisher)
    const hatFixpunkt = behalten.slice(i, j).some(z => z.von !== null);
    if (!hatFixpunkt) {
      /* Alter Weg, unveraendert: Gleichverteilung ueber den ganzen Lauf.
         Braucht eine Zeile davor (`a`), sonst wie bisher unveraendert. */
      if (a < 0) { i = j; continue; }
      const spanne = behalten[b].von - behalten[a].bis;
      const anzahl = j - i;
      if (spanne > 0 && anzahl >= 1) {
        const teil = spanne / anzahl;
        for (let k = i; k < j; k++) {
          behalten[k].von = +(behalten[a].bis + (k - i) * teil).toFixed(2);
          behalten[k].bis = +(behalten[a].bis + (k - i + 1) * teil).toFixed(2);
        }
      }
    } else {
      /* Neuer Weg: an jedem bekannten `von` (entartete Zeile) in Gruppen
         zerlegen, jede Gruppe fuer sich nach Zeichenzahl verteilen. Steht
         der erste Fixpunkt schon an Position `i` selbst (die entartete
         Zeile beginnt den Lauf), braucht die erste Gruppe kein `a` -
         ihr Start ist der Fixpunkt selbst. Nur eine FÜHRENDE Gruppe rein
         geschätzter Zeilen VOR dem ersten Fixpunkt braucht `a.bis`. */
      const segVonAnfang = behalten[i].von !== null ? behalten[i].von : (a >= 0 ? behalten[a].bis : null);
      if (segVonAnfang === null) { i = j; continue; } // kein Anker vorn - unveraendert lassen
      let segStart = i, segVon = segVonAnfang;
      for (let p = i + 1; p <= j; p++) {
        const istGrenze = p === j || behalten[p].von !== null;
        if (!istGrenze) continue;
        const segBis = p === j ? behalten[b].von : behalten[p].von;
        if (segBis > segVon) {
          verteilenNachZeichen(behalten.slice(segStart, p), segVon, segBis);
          for (let k = segStart; k < p; k++) {
            if (!behalten[k].entartet) continue;
            behalten[k].standzeitGeschaetzt = true;
            standzeitGeschaetztAnzahl++;
          }
        }
        segStart = p; segVon = segBis;
      }
    }
    i = j - 1;
  }

  /* Übrig gebliebene entartete Zeilen ohne echte Marke danach (Rand des
     Lieds, kein `b` gefunden): auf die alte, unveränderte Standzeit
     (Dauer 0) zurückfallen — s.o. Das interne `entartet`-Merkzeichen
     gehört nicht in die Ausgabe. */
  for (const z of behalten) {
    if (!z.entartet) continue;
    if (z.bis === null) z.bis = z.von;
    delete z.entartet;
  }

  const worteGesamt = aW.length;
  const worteBehalten = zeilen.reduce((a, z, i) =>
    a + ((zustand[i] === 'gesungen' || zustand[i] === 'gerettet') && proZeile.has(i) ? proZeile.get(i).n : 0), 0);
  const gestrichen = zeilen
    .map((z, i) => (zustand[i] === 'offen' ? z.trim() : null))
    .filter(Boolean);
  const regieZeilen = zustand.filter(x => x === 'regie').length;

  return {
    deckung: worteGesamt ? worteBehalten / worteGesamt : 0,
    zeilen: behalten,
    worte: worteBehalten,
    worteRoh: worteGesamt,
    gestrichen,
    regieZeilen,
    einschuebeEntfernt,
    zeitAngepasst: zeitAngepasstAnzahl,
    standzeitGeschaetzt: standzeitGeschaetztAnzahl,
    gerettet: zustand.filter(x => x === 'gerettet').length,
    geschaetzt: behalten.filter(z => z.geschaetzt).length,
  };
}

/* ---- Lauf ------------------------------------------------------------ */
function whisperLesen() {
  const m = new Map();
  if (!fs.existsSync(WHISPER)) return m;
  for (const z of fs.readFileSync(WHISPER, 'utf8').trim().split('\n')) {
    if (!z.trim()) continue;
    try { const e = JSON.parse(z); if (e.worte && e.worte.length) m.set(e.id, e.worte); }
    catch (err) { /* eine kaputte Zeile darf den Lauf nicht kippen */ }
  }
  return m;
}

function main() {
  const args = process.argv.slice(2);
  const tun = args.includes('--tun');
  const nurUnsicher = args.includes('--unsicher');
  const einer = args.find(a => /^[0-9a-f-]{30,}$/i.test(a)) || null;

  const kat = K.lesen();
  if (!kat) { console.log('  Kein Katalog.'); process.exit(1); }
  const whisper = whisperLesen();
  if (!whisper.size) { console.log('  Keine Whisper-Marken — library/whisper.ndjson fehlt.'); process.exit(1); }

  const lieder = {};
  const unsicher = [];
  let gerechnet = 0, wortSumme = 0, rohSumme = 0;

  for (const s of Object.values(kat.songs)) {
    if (einer && s.id !== einer) continue;
    if (!s.lyrics || !s.lyrics.trim()) continue;
    const marken = whisper.get(s.id);
    if (!marken) { unsicher.push({ id: s.id, titel: s.titel, grund: 'kein Whisper-Lauf' }); continue; }

    const e = reinigen(s.lyrics, marken);
    gerechnet++;
    if (!e.zeilen || e.deckung < DECKUNG_MINDEST) {
      unsicher.push({ id: s.id, titel: s.titel,
        grund: e.grund || `nur ${(100 * e.deckung).toFixed(0)} % gedeckt`,
        deckung: +e.deckung.toFixed(3) });
      continue;
    }
    wortSumme += e.worte; rohSumme += e.worteRoh;
    lieder[s.id] = {
      deckung: +e.deckung.toFixed(3),
      worte: e.worte,
      zeilen: e.zeilen,
      gestrichen: e.gestrichen.length,
      geschaetzt: e.geschaetzt,
      /* NEU in FASSUNG 2 (Caspar_D, 25.09.2026) - getrennt von `gestrichen`
         gehalten, das weiterhin nur die UNGEWISSEN (unter Deckungsgrenze
         gefallenen) Zeilen zaehlt. Diese hier sind SICHER keine Lyrics
         (Regie) bzw. reine Zeit-Korrekturen, nichts Ungewisses. */
      regie: e.regieZeilen,
      einschuebe: e.einschuebeEntfernt,
      zeitAngepasst: e.zeitAngepasst,
      standzeitGeschaetzt: e.standzeitGeschaetzt,
    };

    if (einer) {
      console.log(`\n  ${s.titel}`);
      console.log(`  Deckung ${(100 * e.deckung).toFixed(0)} % · ${e.worte} von ${e.worteRoh} Wörtern · `
        + `${e.regieZeilen} Regiezeilen · ${e.einschuebeEntfernt} Zeilen mit Einschub bereinigt · `
        + `${e.gerettet} Zeilen durch Nachbarschaft gerettet · ${e.geschaetzt} Zeitmarken geschätzt · `
        + `${e.standzeitGeschaetzt} Standzeiten nachgeschätzt · ${e.zeitAngepasst} Zeiten wegen `
        + `doppelter Marken angepasst`);
      console.log('\n  --- bereinigt ---');
      for (const z of e.zeilen)
        console.log(`  ${z.von === null ? '   ?  ' : String(z.von).padStart(6)}  ${z.text}`
          + `${z.geschaetzt ? '   (Zeit geschätzt)' : ''}${z.standzeitGeschaetzt ? '   (Standzeit nachgeschätzt)' : ''}`
          + `${z.zeitAngepasst ? '   (Zeit angepasst, doppelte Marken)' : ''}`);
      if (e.gestrichen.length) {
        console.log('\n  --- gestrichen ---');
        for (const g of e.gestrichen) console.log(`  ${g.slice(0, 90)}`);
      }
      return;
    }
  }

  if (nurUnsicher) {
    console.log(`\n  ${unsicher.length} Lied(er) werden nicht gereinigt:\n`);
    for (const u of unsicher.sort((a, b) => (a.deckung || 0) - (b.deckung || 0)))
      console.log(`  ${String(u.deckung != null ? (100 * u.deckung).toFixed(0) + ' %' : '—').padStart(5)}  ${(u.titel || u.id).slice(0, 52)}   ${u.grund}`);
    return;
  }

  const anzahl = Object.keys(lieder).length;
  console.log(`\n  Bereinigte Lyrik · Fassung ${FASSUNG}`);
  console.log(`  ${gerechnet} Lieder mit Text und Whisper gerechnet.`);
  console.log(`  ${anzahl} gereinigt, ${unsicher.length} zurückgestellt (unter ${(100 * DECKUNG_MINDEST).toFixed(0)} % Deckung).`);
  if (rohSumme) console.log(`  ${rohSumme - wortSumme} von ${rohSumme} Wörtern gestrichen `
    + `(${(100 * (rohSumme - wortSumme) / rohSumme).toFixed(0)} %) — Vorreden, Widmungen, zweite Sprachfassungen.`);

  if (!tun) { console.log(`\n  Nichts geschrieben. Mit --tun schreibt es nach library/lyrik.json.`); return; }

  const aus = {
    stand: new Date().toISOString(),
    fassung: FASSUNG,
    verfahren: 'Regieanweisungen fliegen vor dem Alignment: ganze Zeilen in eckigen oder runden Klammern, '
      + 'mit „#" oder als Trennlinie, dazu Einschübe wie „[soft]" mitten in einer Zeile. '
      + 'Liedtext gegen die Whisper-Marken aligniert (Needleman-Wunsch, ein Buchstabe Abstand '
      + `erlaubt); ungedeckte Zeilen zwischen gedeckten bleiben (höchstens ${LUECKE_MAX} am Stück). `
      + 'Zeitanker aus denselben Whisper-Marken; Zeilen ohne eigene Marke tragen geschaetzt und '
      + `liegen interpoliert zwischen ihren Nachbarn, anteilig nach Zeichenzahl. Eine Zeile mit `
      + `einer entarteten Marke (Standzeit unter ${STANDZEIT_ENTARTET} s - Whisper gibt vielen `
      + 'Wörtern dieselbe Start- und Endzeit) trägt standzeitGeschaetzt und bekommt ihre Standzeit '
      + 'ebenso aus der Spanne bis zur nächsten echten Marke; zwei Zeilen auf identischen Marken '
      + `tragen zeitAngepasst und teilen sich die eine gemessene Spanne. Unter `
      + `${(100 * DECKUNG_MINDEST).toFixed(0)} % Deckung wird nicht gereinigt.`,
    quelle: 'library/whisper.ndjson',
    mindestDeckung: DECKUNG_MINDEST,
    unsicher,
    lieder,
  };
  fs.writeFileSync(ZIEL, JSON.stringify(aus));
  const kb = (fs.statSync(ZIEL).size / 1024).toFixed(0);
  console.log(`\n  Geschrieben: library/lyrik.json (${kb} KB).`);
}

if (require.main === module) main();
module.exports = { reinigen, woerter, fastGleich, alignieren };
