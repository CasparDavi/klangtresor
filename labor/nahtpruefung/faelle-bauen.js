#!/usr/bin/env node
/* Schreibt labor/nahtpruefung/faelle.json neu: die Titel werden aus _songs.json AUSGESUCHT (nicht von
 * Hand genannt) und dann mit festen IDs eingetragen - so bleibt jeder spaetere Lauf vergleichbar.
 * Die Rechnung von Takt, Takten und Schlaegen je Takt ist die von ausschnitt()/raster() im Studio.
 *   node labor/nahtpruefung/faelle-bauen.js
 * Wer faelle.json von Hand ergaenzt, ruft das hier nicht mehr auf.
 * UND GENAU DAS IST PASSIERT: faelle.json ist diesem Skript VORAUS. Es traegt die Titel d und e und
 * die Gruppe `taktlage` (15.09.2026) sowie die Gruppe `kenburns` (18.09.2026); ein Lauf dieses Skripts
 * wuerfe sie weg. Nachgerechnet am 18.09.2026 (nach dem Fall der alten "Fahrt" und dem Umbau der
 * Ken Burns Fahrt auf Zielpunkte): 179 Faelle hier gegen 186 dort. Das Skript bleibt als
 * Herkunft der Titelwahl und der Pflichtliste TYPEN stehen - neue Faelle kommen von Hand in faelle.json,
 * und derselbe Eintrag hier daneben, damit beide dasselbe sagen.
 */
const fs = require('fs');
const path = require('path');

const songs = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../effektclip-studio/_songs.json'), 'utf8'));
const MEDIEN = path.resolve(__dirname, '../../library/songs');
const JETZT = 60.3;

/* wie taktLaenge/ausschnitt/raster im Modul */
function lage(S) {
  const einsen = S.filter(s => s[1] === 1).map(s => s[0]);
  if (einsen.length < 3) return null;
  const d = []; for (let i = 1; i < einsen.length; i++) d.push(einsen[i] - einsen[i - 1]);
  d.sort((a, b) => a - b); const takt = d[Math.floor(d.length / 2)]; if (!(takt > 0.05)) return null;
  const takte = Math.max(1, Math.floor(10 / takt)), L = Math.max(2, Math.round(Math.min(10, takte * takt) * 30)) / 30, taktLang = L / takte;
  const dd = []; for (let i = 1; i < S.length; i++) { const x = S[i][0] - S[i - 1][0]; if (x > 0.05 && x < 2) dd.push(x); }
  dd.sort((a, b) => a - b); const proTakt = Math.max(1, Math.min(16, Math.round(taktLang / dd[Math.floor(dd.length / 2)])));
  return { takt, takte, L, proTakt, M: takte * proTakt };
}
const mitBild = s => fs.existsSync(path.join(MEDIEN, s.id, 'titelbild.jpg')) && fs.existsSync(path.join(MEDIEN, s.id, 'tiefe.png'));
const kand = songs.filter(s => Array.isArray(s.schlaege) && mitBild(s) && s.dauer > JETZT + 15).map(s => ({ s, l: lage(s.schlaege), l34: lage(s.schlaege.map((b, i) => [b[0], (i % 3) + 1])) })).filter(k => k.l);
const nachSchlaegen = (a, b) => b.s.schlaege.length - a.s.schlaege.length;
const a = kand.filter(k => k.l.proTakt === 4 && k.l.M % 8 === 0).sort(nachSchlaegen)[0];
const b = kand.filter(k => k.s !== (a && a.s) && k.l.M % 8 !== 0).sort(nachSchlaegen)[0];
const c = kand.filter(k => k.l34 && k.l34.M % 2 === 1).sort(nachSchlaegen)[0];
if (!a || !b || !c) throw new Error('Titelwahl gescheitert: a=' + !!a + ' b=' + !!b + ' c=' + !!c);
const titel = {
  a: { id: a.s.id, titel: a.s.titel, warum: 'klarer 4/4-Titel mit den meisten Schlaegen, Schlaege je Clip durch 8 teilbar', ...a.l },
  b: { id: b.s.id, titel: b.s.titel, warum: 'natuerliche Taktzahl*proTakt nicht durch 8 teilbar', ...b.l },
  c: { id: c.s.id, titel: c.s.titel, warum: 'als 3/4 gezaehlt (daten "dreiviertel") ergibt sich eine ungerade Schlagzahl je Clip', ...c.l34 }
};
for (const k of Object.keys(titel)) for (const x of ['takt', 'L']) titel[k][x] = Math.round(titel[k][x] * 1000) / 1000;

const F = [];
const fall = (name, effekte, mehr) => F.push(Object.assign({ name, typ: effekte[0].typ, titel: 'a', effekte }, mehr || {}));
/* PFLICHT: jeder Typ der Registry mit Vorgaben. Die Liste ist hier fest; naht.mjs prueft gegen EFFEKTE im
   Browser, ob ein Typ fehlt. */
/* 'fahrt' ist am 18.09.2026 gestrichen - der Typ gibt es nicht mehr, und ein Fall dafuer wuerde
   effekteBauen werfen (effektAusRezept gibt fuer ihn null). Warum er faellt, steht in web/index.html
   bei EFFEKTE an der Stelle, an der er stand. */
const TYPEN = ['puls', 'schaerfe', 'kontrast', 'helligkeit', 'saettigung', 'farbe', 'licht', 'schatten', 'laser', 'streifen', 'rauschen', 'vlauf', 'wackeln', 'rgb', 'strobe', 'sicherung', 'streiflicht', 'filmnebel', 'partikel', 'scanlines', 'bloom', 'nachzieh', 'feuer', 'wellen', 'kaustik', 'linse', 'flammen', 'strahlen', 'spiegel', 'risse', 'beschlag', 'einschlag', 'tropfen', 'korn', 'bloecke', 'farbton', 'kippen', 'kenburns', 'titel', 'karaoke'];
const VORGABE_HINWEIS = { licht: 'rmBewegung wandernd (Vorgabe)', schatten: 'rmBewegung wandernd (Vorgabe)', laser: 'Ursprung wandern, Bauart gitter (Vorgabe)', partikel: 'Art schnee, ohne Quelle (Vorgabe)', streiflicht: 'allein ohne Leuchte: schaltet sich ab', filmnebel: 'allein ohne Leuchte, Schwaden .45', risse: 'wachsen zeit (Vorgabe)', einschlag: 'bleiben 8 (Vorgabe)', bloecke: 'im Takt (Vorgabe)', wackeln: 'Kick im Takt (Vorgabe), 4/4', strobe: 'hz 8, rechteck (Vorgabe)', streifen: 'ton hell (Vorgabe)', kenburns: 'Zielpunkte aus dem Vorschlag beim Einfuegen (zwei), Tempo 1 Takt, Parallaxe aus (Vorgaben)', titel: 'Vorgabe: der Songtitel, Grotesk fett, unten mittig, Kontur und Schatten. Steht die ganze Zeit - loopfest von selbst.', karaoke: 'Vorgabe: drei Zeilen wie das Band der Buehne, Titelbild-Palette, Band 1. Unter LOOP>0 malt er nichts (Karaoke gehoert in den ganzen Titel) - naht und gleich sind darum 0, die Vorschau weicht ab, das ist so gewollt.' };
for (const t of TYPEN) fall(t, [{ typ: t }], { gruppe: 'vorgabe', bemerkung: VORGABE_HINWEIS[t] || 'Vorgabe' });
/* Die zwei Texteffekte (24.09.2026) - von Hand in faelle.json eingetragen, hier nachgezogen, damit ein Neubau sie behaelt. */
fall('titel-serife-zwei', [{ typ: 'titel', text: 'Zwei Zeilen|und Serife', schrift: 'serife', gewicht: 'normal', ausrichtung: 'links', ortX: 0.08, ortY: 0.2, groesse: 0.12, farbe: '#ffd27a', verr: 'screen' }], { gruppe: 'titel', titel: 'b', bemerkung: 'Freier Text mit Umbruch, Serife, links oben, Screen-Verrechnung, zweiter Titel.' });
fall('titel-struktur-metall', [{ typ: 'titel', struktur: 'metall', farbSatz: 'eigen', farbe: '#d9a441', schrift: 'serife', groesse: 0.12, ortY: 0.5 }], { gruppe: 'titel', titel: 'a', bemerkung: 'Struktur Metall mit warmem Ton (Gold), Serife, mittig: Rampe und Buerstenstriche muessen in Vorschau und Export gleich liegen, Kachel in x nahtlos.' });
fall('titel-struktur-stein', [{ typ: 'titel', struktur: 'stein', groesse: 0.12, ortY: 0.5 }], { gruppe: 'titel', titel: 'b', bemerkung: 'Struktur Stein mit der Farbe aus dem Titelbild, zweiter Titel: Adern aus verzerrtem Rauschen, Ganzzahl-Hash, bitgleich.' });
fall('titel-struktur-papier', [{ typ: 'titel', struktur: 'papier', farbSatz: 'eigen', farbe: '#e8e2d2', groesse: 0.1 }], { gruppe: 'titel', titel: 'a', bemerkung: 'Struktur Papier, helle eigene Farbe unten mittig: das Korn muss bei 360 und 1080 gleich fein wirken (in em gerechnet).' });
fall('titel-struktur-schraffur', [{ typ: 'titel', struktur: 'schraffur', farbSatz: 'eigen', farbe: '#7fc7d9', groesse: 0.12, ortY: 0.5 }], { gruppe: 'titel', titel: 'b', bemerkung: 'Struktur Schraffur, kuehle eigene Farbe, zweiter Titel: 26 Perioden je Kachel, Naht am Kachelrand unsichtbar.' });
fall('titel-auftritt-aufsteigen', [{ typ: 'titel', auftritt: 'aufsteigen', groesse: 0.1, ortY: 0.5 }], { gruppe: 'titel', titel: 'a', jetzt: 26.13, bemerkung: 'Auftritt aufsteigen auf Titel a (erste Zeile der bereinigten Lyrik bei 30,18 s, Schlag 0,40 s: der Abgang laeuft 29,48 bis 29,78 s). jetzt 26,13 s: die Vorschau liegt in der Clipmitte bei rund 29,9 s, mitten im Abgang oder kurz danach - der Loop-Export (LOOP>0) laesst den Titel stehen. Die Vorschau-Abweichung ist gewollt wie beim Karaoke; Naht 0 bleibt Pflicht. Das Fenster ist eng (0,6 s): rutscht t0 auf eine andere Eins, den Fall nachziehen.' });
fall('karaoke-eine-zeile', [{ typ: 'karaoke', zeilen: '1', schrift: 'serife', farbSatz: 'eigen', farbe: '#ffd27a', farbe2: '#c0c0c0', band: 0, ortY: 0.5, ausrichtung: 'links', vorlauf: 0.3, groesse: 0.07, verr: 'screen' }], { gruppe: 'karaoke', titel: 'b', jetzt: 51.8, bemerkung: 'Nur die gesungene Zeile, Serife, eigene Farbe, ohne Band, mittig hoch, links, 0,3 s Vorlauf, Screen; zweiter Titel. Unter LOOP>0 nichts gemalt - siehe karaoke.' });

/* KEN BURNS FAHRT: DIE ZIELPUNKTE UND DIE PARALLAXE (17./18.09.2026, neu gefasst am 18.09.2026).
   Bis zum Vormittag standen hier die sechs LAEUFE (kbLauf: hinein, aufdecken, zwei, streifen,
   wanderung, abrastern). Die Laeufe sind gefallen - was sie unterschied, ist jetzt die Zahl und die
   Lage der Zielpunkte -, also stehen hier die Faelle, die genau das abdecken: ein Punkt, zwei
   Punkte, fuenf (die Grenze) und keiner.
   DIE NAMEN SIND NEU UND NICHT DIE ALTEN. `kb-zwei` hiess bis heute "Lauf Zwei Stationen" - derselbe
   Name fuer eine andere Sache haette den Grundlinienvergleich stumm gegen etwas anderes gemessen
   (Hausregel: kein Wort fuer zwei Dinge). Die vier heissen darum kb-einPunkt, kb-zweiPunkte,
   kb-fuenfPunkte und kb-ohnePunkt; im Vergleich gegen studio-parallaxe.json stehen sie als neue
   Faelle da, und das ist die Wahrheit ueber sie.
   `kenburns` steht in TYPEN, also deckt die Gruppe `vorgabe` den Fall ab, in dem die Zielpunkte aus
   dem VORSCHLAG beim Einfuegen kommen (zwei aus dem Bild). Die Faelle hier schreiben ihre Punkte
   dagegen selbst - nur so haengt das Ergebnis nicht daran, was die Zielsuche auf diesem einen
   Titelbild gerade findet.
   UND WEIL NIE EINE VORBEREITUNG IN EINEM FALL STAND, blieb bis zum 18.09.2026 die Zeile unbemerkt,
   die den fertigen Ausschnitt ein zweites Mal ausschnitt, sobald Vorbereitung und Parallaxe
   zusammenkamen. `kb-vorb` und `kb-parallaxe-vorb` bleiben darum stehen. */
const KBP1 = [{ u: 0.35, v: 0.40, z: 0.62 }];
const KBP2 = [{ u: 0.32, v: 0.36, z: 0.60 }, { u: 0.63, v: 0.58, z: 0.72 }];
const KBP5 = [{ u: 0.30, v: 0.30, z: 0.55 }, { u: 0.64, v: 0.36, z: 0.70 }, { u: 0.50, v: 0.50, z: 0.85 },
              { u: 0.36, v: 0.64, z: 0.70 }, { u: 0.72, v: 0.72, z: 0.55 }];
fall('kb-einPunkt', [{ typ: 'kenburns', kbZiele: KBP1 }], { gruppe: 'kenburns', bemerkung: 'EIN Zielpunkt: Ganzbild - hinein - halten - heraus. Zwei Zuege, ein Halt am Punkt und einer am Ganzbild.' });
fall('kb-zweiPunkte', [{ typ: 'kenburns', kbZiele: KBP2 }], { gruppe: 'kenburns', bemerkung: 'Zwei Zielpunkte verschiedener Enge: drei Zuege, zwei gleich lange Halte an den Punkten und einer am Ganzbild.' });
fall('kb-fuenfPunkte', [{ typ: 'kenburns', kbZiele: KBP5 }], { gruppe: 'kenburns', bemerkung: 'Fuenf Zielpunkte - die Grenze. Sechs Zuege passen in keinen Clip, also greift die Tempoklemme.' });
fall('kb-ohnePunkt', [{ typ: 'kenburns', kbZiele: [] }], { gruppe: 'kenburns', bemerkung: 'Leere Liste: die Kamera steht auf dem Ganzbild. Ein stehendes Bild loopt von selbst.' });
fall('kb-parallaxe-aus', [{ typ: 'kenburns', kbParallaxe: 0 }], { gruppe: 'kenburns', bemerkung: 'Regler ausdruecklich auf null (seit dem 18.09.2026 auch die Vorgabe): der Ausschnitt kommt aus drawImage' });
fall('kb-parallaxe-voll', [{ typ: 'kenburns', kbParallaxe: 2.6 }], { gruppe: 'kenburns', bemerkung: 'Parallaxe am Anschlag, Zielpunkte aus dem Vorschlag' });
fall('kb-vorb', [{ typ: 'kenburns', kbParallaxe: 0 }], { gruppe: 'kenburns', vorb: { belichtung: 0.3, kontrast: 0.25 }, bemerkung: 'Vorbereitung ohne Parallaxe - die Gegenprobe zum naechsten Fall' });
fall('kb-parallaxe-vorb', [{ typ: 'kenburns', kbParallaxe: 2.6 }], { gruppe: 'kenburns', vorb: { belichtung: 0.3, kontrast: 0.25 }, bemerkung: 'Vorbereitung UND Parallaxe im selben Bild: der Fall, der den Fehler vom 18.09.2026 trug' });
fall('kb-tempo2-b', [{ typ: 'kenburns', kbTakte: 2 }], { gruppe: 'kenburns', titel: 'b', bemerkung: 'Zwei Takte je Zug auf dem Titel mit anderer Taktzahl - hier greift die Tempoklemme' });

/* FOKUS BEI ANKUNFT UND DIE NEUE ENGE (19.09.2026, von Hand nachgetragen wie faelle.json).
   Die Spalte "Fokus bei Ankunft" ist eine Stellung je Punkt, kein Regler am Effekt - die Faelle
   tragen sie darum IM Zielpunkt. kb-fokus-unscharf und kb-fokus-suche nehmen genau die Punkte von
   kb-zweiPunkte, damit der Unterschied im Grundlinienvergleich allein die Spalte ist.
   kb-engerPunkt prueft die gesenkte Untergrenze KB_ENGE_MIN: mit 0,50 haette kbEnge die 0,25
   stillschweigend hochgeklemmt, und der Fall saehe aus wie jeder andere. */
const KBP2U = KBP2.map(p => Object.assign({}, p, { f: 'unscharf' }));
const KBP2S = KBP2.map(p => Object.assign({}, p, { f: 'suche' }));
const KBPE = [{ u: 0.35, v: 0.40, z: 0.25 }];
fall('kb-fokus-unscharf', [{ typ: 'kenburns', kbZiele: KBP2U }], { gruppe: 'kenburns', bemerkung: "Fokus bei Ankunft 'unscharf' an beiden Punkten: die Zuege dorthin schmieren, bei der Ankunft ist es sofort wieder scharf. Dieselben zwei Punkte wie kb-zweiPunkte - der Unterschied ist allein die Spalte." });
fall('kb-fokus-suche', [{ typ: 'kenburns', kbZiele: KBP2S }], { gruppe: 'kenburns', bemerkung: "Fokus bei Ankunft 'suche': die Zuege schmieren, und im Halt sucht die Schaerfe den Punkt - eine gedaempfte Schwingung, die IM Halt anfaengt und IM Halt aufhoert." });
/* DER ZWILLING, DEN DIE GRUNDLINIE BRAUCHT (19.09.2026 nachgetragen, von Hand wie faelle.json).
   kb-fokus-unscharf und kb-fokus-suche unterscheiden sich NUR im Halt. Bei zwei Punkten ist der
   Halt auf Titel a 24 Bilder (0,8 s) lang, und die drei Augenblicke der Studio-Grundlinie fielen
   nicht hinein: beide Faelle trugen in allen drei dieselben Hashes, zwei davon sogar dieselben wie
   der scharfe kb-zweiPunkte. Ein Rueckschritt am Schaerfezieher waere durch den Vergleich
   hindurchgegangen (Gegenlesen 19.09.2026). Mit EINEM Punkt ist der Zug doppelt so lang und der
   Halt 60 Bilder (2,0 s) - dort trennen sich die beiden.
   kb-fokus-ohneHalt haelt den Gegenfall fest: drei Punkte, und der Clip laesst keinen Halt uebrig
   (kbPlan H = 0). Dann wird nicht gesucht, und das soll auch so bleiben, bis die Koernung des
   Tempos entschieden ist (docs/NAECHSTER_CHAT.md). */
const KBP1U = [Object.assign({}, KBP1[0], { f: 'unscharf' })];
const KBP1S = [Object.assign({}, KBP1[0], { f: 'suche' })];
const KBP3OH = [KBP2[0], { u: 0.50, v: 0.50, z: 0.70, f: 'suche' }, KBP2[1]];
fall('kb-fokus-unscharf-eins', [{ typ: 'kenburns', kbZiele: KBP1U }], { gruppe: 'kenburns', bemerkung: "EIN Punkt auf 'unscharf' - ein langer Zug und mit 60 Bildern (2,0 s) der laengste Halt, den ein Fall hier hat. Der Zwilling zu kb-fokus-suche-eins: unterwegs schmieren beide gleich, NUR im Halt trennen sie sich. Die drei Augenblicke der Studio-Grundlinie fielen bei zwei Punkten (Halt 0,8 s) nicht in den Halt - beide Faelle trugen dieselben Hashes, und ein Rueckschritt am Schaerfezieher waere durchgegangen." });
fall('kb-fokus-suche-eins', [{ typ: 'kenburns', kbZiele: KBP1S }], { gruppe: 'kenburns', bemerkung: "Derselbe Punkt auf 'suche'. Halt 60 Bilder (2,0 s), also drei Ausschlaege - die volle gedaempfte Schwingung. Weicht dieser Fall von kb-fokus-unscharf-eins nicht ab, ist der Schaerfezieher kaputt." });
fall('kb-fokus-ohneHalt', [{ typ: 'kenburns', kbZiele: KBP3OH }], { gruppe: 'kenburns', bemerkung: "DREI Punkte, der mittlere auf 'suche': in diesem Clip bleibt kein Halt uebrig (kbPlan H=0), also wird nicht gesucht - 'Suche' geht hier aus wie 'Unscharf'. Der Fall haelt genau das fest, damit niemand spaeter unbemerkt einen Ersatzhalt erfindet; die Zeile unter der Liste sagt es seit dem 19.09.2026 in Worten." });
fall('kb-fokus-suche-kurz', [{ typ: 'kenburns', kbZiele: KBP2S }], { gruppe: 'kenburns', titel: 'b', bemerkung: "Zwei Punkte auf 'suche' auf Titel b: dort ist der Halt nur 13 Bilder (0,43 s) lang. Die Zahl der Ausschlaege haengt seit dem 19.09.2026 an der Haltlaenge (kbSuchAusschlaege, 0,18 s je Ausschlag) - hier sind es ZWEI statt drei. Ohne diesen Fall waere die Regel nur behauptet: alle anderen Faelle haben Halte von 0,8 s und laenger und kommen auf die volle Zahl." });
fall('kb-engerPunkt', [{ typ: 'kenburns', kbZiele: KBPE }], { gruppe: 'kenburns', bemerkung: 'EIN sehr enger Punkt (0,25) - die neue Untergrenze KB_ENGE_MIN. Vorher haette kbEnge auf 0,50 geklemmt.' });

/* Antrieb */
fall('puls-flackern-takt', [{ typ: 'puls', lmQuelle: 'takt', lmForm: 'flackern' }], { gruppe: 'antrieb' });
fall('puls-flackern-hz05', [{ typ: 'puls', lmQuelle: 'hz', lmHz: 0.5, lmForm: 'flackern' }], { gruppe: 'antrieb' });
fall('puls-teiler8-a', [{ typ: 'puls', lmQuelle: 'takt', lmTeiler: 8 }], { gruppe: 'antrieb', bemerkung: 'Gegenprobe: M durch 8 teilbar' });
fall('puls-teiler8-b', [{ typ: 'puls', lmQuelle: 'takt', lmTeiler: 8 }], { gruppe: 'antrieb', titel: 'b', bemerkung: 'M nicht durch 8 teilbar' });
fall('puls-zufall', [{ typ: 'puls', lmQuelle: 'zufall' }], { gruppe: 'antrieb' });
fall('puls-ohneEins', [{ typ: 'puls', lmQuelle: 'takt' }], { gruppe: 'antrieb', daten: 'ohneEins', bemerkung: 'Schlaege, aber keine Eins-Marken' });
fall('strobe-ohneEins', [{ typ: 'strobe', lmQuelle: 'takt', lmForm: 'rechteck' }], { gruppe: 'antrieb', daten: 'ohneEins', bemerkung: 'Schlaege, aber keine Eins-Marken' });
fall('puls-ohneSchlaege', [{ typ: 'puls', lmQuelle: 'takt' }], { gruppe: 'antrieb', daten: 'ohneSchlaege', bemerkung: 'Rueckfall auf Frequenz' });
fall('puls-zufall-ohneSchlaege', [{ typ: 'puls', lmQuelle: 'zufall' }], { gruppe: 'antrieb', daten: 'ohneSchlaege' });
fall('strobe-ohneSchlaege', [{ typ: 'strobe', lmQuelle: 'zufall', lmForm: 'rechteck' }], { gruppe: 'antrieb', daten: 'ohneSchlaege' });
fall('feuer-flackern', [{ typ: 'feuer', lmQuelle: 'takt', lmForm: 'flackern' }], { gruppe: 'antrieb' });

/* Leuchten */
for (const b of ['fahrt', 'schritt', 'bogen']) fall('licht-' + b, [{ typ: 'licht', rmBewegung: b }], { gruppe: 'leuchten' });
fall('laser-wandern-scanner', [{ typ: 'laser', quelle: 'wandern', bauart: 'scanner' }], { gruppe: 'leuchten' });
fall('laser-wandern-punkte', [{ typ: 'laser', quelle: 'wandern', bauart: 'punkte', drehen: 0.15 }], { gruppe: 'leuchten' });
fall('laser-wandern-punkte-drehen0', [{ typ: 'laser', quelle: 'wandern', bauart: 'punkte', drehen: 0 }], { gruppe: 'leuchten' });
fall('laser-fest-punkte', [{ typ: 'laser', quelle: 'fest', bauart: 'punkte', drehen: 0.15 }], { gruppe: 'leuchten', bemerkung: 'drehen allein, ohne wandernden Ursprung' });
fall('laser-fest-punkte-drehen0', [{ typ: 'laser', quelle: 'fest', bauart: 'punkte', drehen: 0 }], { gruppe: 'leuchten', bemerkung: 'Gegenprobe' });
fall('laser-fest-gitter', [{ typ: 'laser', quelle: 'fest', bauart: 'gitter' }], { gruppe: 'leuchten', bemerkung: 'Gegenprobe' });
fall('laser-scanner-sprung-hz', [{ typ: 'laser', quelle: 'fest', bauart: 'scanner', sprung: 1, lmQuelle: 'hz', lmHz: 2 }], { gruppe: 'leuchten' });
fall('laser-scanner-sprung-takt', [{ typ: 'laser', quelle: 'fest', bauart: 'scanner', sprung: 1, lmQuelle: 'takt' }], { gruppe: 'leuchten' });
fall('streiflicht-licht', [{ typ: 'licht' }, { typ: 'streiflicht' }], { typ: 'streiflicht', gruppe: 'leuchten', bemerkung: 'Scheinwerfer wandernd davor' });
fall('streiflicht-laserfest', [{ typ: 'laser', quelle: 'fest' }, { typ: 'streiflicht' }], { typ: 'streiflicht', gruppe: 'leuchten', bemerkung: 'Laser Ursprung fest davor' });

/* Partikel */
for (const art of ['regen', 'asche', 'funken', 'blasen', 'blaetter', 'staub', 'schwaden', 'gluehwuermchen', 'schmetterling']) fall('partikel-' + art, [{ typ: 'partikel', art }], { gruppe: 'partikel', bemerkung: 'ohne Quelle' });
fall('partikel-schwaden-quelle', [{ typ: 'partikel', art: 'schwaden', qForm: 'punkt', qX: 0.5, qY: 0.85 }], { gruppe: 'partikel', bemerkung: 'Quelle Punkt' });
fall('partikel-boeen', [{ typ: 'partikel', boeen: 1 }], { gruppe: 'partikel', bemerkung: 'Windstoesse im Takt' });
fall('partikel-wind-06neg', [{ typ: 'partikel', wind: -0.6 }], { gruppe: 'partikel', bemerkung: 'vorschauAbw zaehlt' });
fall('partikel-wind0', [{ typ: 'partikel', wind: 0 }], { gruppe: 'partikel', bemerkung: 'vorschauAbw zaehlt' });

/* Stoerungen */
fall('streifen-beide', [{ typ: 'streifen', ton: 'beide', tempo: 9 }], { gruppe: 'stoerungen', bemerkung: 'round(L/9) ungerade' });
fall('sicherung-frei-lang', [{ typ: 'sicherung', takt: 0, haeufigkeit: 10, dauer: 800 }], { gruppe: 'stoerungen' });
fall('sicherung-takt-800', [{ typ: 'sicherung', takt: 1, dauer: 800 }], { gruppe: 'stoerungen' });
fall('bloecke-frei', [{ typ: 'bloecke', takt: 0 }], { gruppe: 'stoerungen' });
fall('wackeln-kick-ungerade', [{ typ: 'wackeln', takt: 1 }], { gruppe: 'stoerungen', titel: 'c', daten: 'dreiviertel', bemerkung: '3/4, M ungerade' });

/* Glas und Shader */
fall('filmnebel-schwaden0', [{ typ: 'filmnebel', schwaden: 0 }], { gruppe: 'glas' });
fall('risse-takt', [{ typ: 'risse', wachsen: 'takt' }], { gruppe: 'glas' });
fall('einschlag-bleiben30', [{ typ: 'einschlag', bleiben: 30 }], { gruppe: 'glas' });
fall('nachzieh-09', [{ typ: 'nachzieh', nachhall: 0.9 }], { gruppe: 'glas' });

/* Zeitmaschinerie (Bauabschnitt 1): gefaltete Nummern, eingepasste Taktzahl, Gedaechtnis-Vorlauf */
fall('puls-flackern-eins', [{ typ: 'puls', lmQuelle: 'eins', lmForm: 'flackern' }], { gruppe: 'zeit' });
fall('puls-flackern-teil025', [{ typ: 'puls', lmQuelle: 'takt', lmTeiler: 0.25, lmForm: 'flackern' }], { gruppe: 'zeit' });
fall('puls-zufall-teiler8-b', [{ typ: 'puls', lmQuelle: 'zufall', lmTeiler: 8 }], { gruppe: 'zeit', titel: 'b' });
fall('puls-teiler8-dreiviertel', [{ typ: 'puls', lmQuelle: 'takt', lmTeiler: 8 }], { gruppe: 'zeit', titel: 'c', daten: 'dreiviertel', bemerkung: '3/4: 8 passt in 10 s nicht, Forderung wird gelockert' });
fall('puls-flackern-ohneEins', [{ typ: 'puls', lmQuelle: 'takt', lmForm: 'flackern' }], { gruppe: 'zeit', daten: 'ohneEins' });
fall('strobe-zufall', [{ typ: 'strobe', lmQuelle: 'zufall', lmForm: 'rechteck' }], { gruppe: 'zeit' });
fall('strobe-flackern-hz05', [{ typ: 'strobe', lmQuelle: 'hz', lmHz: 0.5, lmForm: 'flackern' }], { gruppe: 'zeit' });
fall('feuer-flackern-hz07', [{ typ: 'feuer', lmQuelle: 'hz', lmHz: 0.7, lmForm: 'flackern' }], { gruppe: 'zeit' });
fall('nachzieh-098', [{ typ: 'nachzieh', nachhall: 0.98 }], { gruppe: 'zeit' });
fall('nachzieh-puls', [{ typ: 'puls', lmQuelle: 'takt' }, { typ: 'nachzieh', nachhall: 0.85 }], { typ: 'nachzieh', gruppe: 'zeit', bemerkung: 'Spur ueber einem Puls' });

/* Leuchten, Reparatur 15.09.2026 (eigene Umlaufzahl der Senkrechten, gefaltete Ziele, Vierteldrehung) */
fall('licht-wandernd-tempo3', [{ typ: 'licht', rmBewegung: 'wandernd', rmTempo: 3 }], { gruppe: 'leuchten', bemerkung: 'Senkrechte eigene Umlaufzahl, Waagerechte 3' });
fall('schatten-fahrt', [{ typ: 'schatten', rmBewegung: 'fahrt' }], { gruppe: 'leuchten' });
fall('licht-fahrt-tempo2', [{ typ: 'licht', rmBewegung: 'fahrt', rmTempo: 2 }], { gruppe: 'leuchten', bemerkung: 'mehrere Ziele je Clip' });
fall('licht-schritt-eins', [{ typ: 'licht', rmBewegung: 'schritt', lmQuelle: 'eins' }], { gruppe: 'leuchten' });
fall('licht-schritt-ohneSchlaege', [{ typ: 'licht', rmBewegung: 'schritt' }], { gruppe: 'leuchten', daten: 'ohneSchlaege', bemerkung: 'Ziel je eingerasteter Sekunde' });
fall('laser-fest-punkte-dreh-neg', [{ typ: 'laser', quelle: 'fest', bauart: 'punkte', drehen: -0.6 }], { gruppe: 'leuchten', bemerkung: 'Gegendrehung, schneller' });
fall('laser-wandern-gitter-tempo3', [{ typ: 'laser', quelle: 'wandern', bauart: 'gitter', tempo: 3 }], { gruppe: 'leuchten' });
fall('laser-scanner-sprung-zufall', [{ typ: 'laser', quelle: 'fest', bauart: 'scanner', sprung: 1, lmQuelle: 'zufall', lmTeiler: 0.5 }], { gruppe: 'leuchten' });
fall('streiflicht-laser-wandern-punkte', [{ typ: 'laser', quelle: 'wandern', bauart: 'punkte', drehen: 0.15 }, { typ: 'streiflicht' }], { typ: 'streiflicht', gruppe: 'leuchten', bemerkung: 'erbt den ganzen Lichtpuffer' });

/* Partikel und Tropfen, Reparatur 15.09.2026 (Lebensdauer-Betrieb, echte Geschwindigkeit, umlaufende Stossnummer) */
fall('partikel-regen-wind0', [{ typ: 'partikel', art: 'regen', wind: 0 }], { gruppe: 'partikel', bemerkung: 'schnell: bleibt beim Umbruch' });
fall('partikel-schnee-tempo3', [{ typ: 'partikel', tempo: 3, wind: 0 }], { gruppe: 'partikel', bemerkung: 'gemischt: Umbruch und Lebensdauer' });
fall('partikel-staub-wind-neg', [{ typ: 'partikel', art: 'staub', wind: -0.4 }], { gruppe: 'partikel', bemerkung: 'langsam, Wind nach links' });
fall('partikel-staub-quelle', [{ typ: 'partikel', art: 'staub', qForm: 'punkt', qX: 0.5, qY: 0.5 }], { gruppe: 'partikel', bemerkung: 'Funkeln mit Quelle' });
fall('partikel-schwaden-tempo02', [{ typ: 'partikel', art: 'schwaden', tempo: 0.2 }], { gruppe: 'partikel', bemerkung: 'Aufgehen langsam' });
fall('partikel-boeen-funken-wandern', [{ typ: 'partikel', art: 'funken', boeen: 1, boeenStaerke: 1, wandern: 0.6 }], { gruppe: 'partikel', bemerkung: 'Stoesse, Eigenbewegung' });
fall('tropfen-tempo3', [{ typ: 'tropfen', tempo: 3 }], { gruppe: 'partikel', bemerkung: 'schnell: Umbruch' });
fall('tropfen-boeen', [{ typ: 'tropfen', boeen: 1, zittern: 1, tempo: 0.3 }], { gruppe: 'partikel', bemerkung: 'langsam, Stoesse, Zittern' });

/* Kombination */
fall('filmnebel-licht', [{ typ: 'filmnebel' }, { typ: 'licht' }], { typ: 'filmnebel', gruppe: 'kombination', bemerkung: 'Nebel braucht Licht' });

/* Stoerungen, Nachbearbeitung und Glas-Ereignisse, Reparatur 15.09.2026 (umlaufende Fenster- und Schlagnummer, gesaeter Zufall, ausgewachsene Risse) */
fall('rauschen-takt', [{typ: 'rauschen', takt: 1}], { gruppe: 'stoerungen2', bemerkung: 'Ausbrueche im Takt, Zufall gesaet' });
fall('korn-langsam', [{typ: 'korn', tempo: 0}], { gruppe: 'stoerungen2', bemerkung: 'Kornwechsel alle 13/60 s' });
fall('wackeln-ohneKick', [{typ: 'wackeln', takt: 0}], { gruppe: 'stoerungen2', bemerkung: 'nur Warble und Zittern' });
fall('bloecke-takt-lang', [{typ: 'bloecke', takt: 1, haeufigkeit: 10, dauer: 800}], { gruppe: 'stoerungen2', bemerkung: 'Glitch reicht ueber den naechsten Schlag' });
fall('sicherung-frei-zittern', [{typ: 'sicherung', takt: 0, haeufigkeit: 10, dauer: 600, zittern: 1}], { gruppe: 'stoerungen2', bemerkung: 'Zittern 37 Hz eingerastet' });
fall('einschlag-ohneEins', [{typ: 'einschlag', bleiben: 20}], { gruppe: 'stoerungen2', daten: 'ohneEins', bemerkung: 'Raster aus Median-Abstand' });
fall('risse-takt-ohneEins', [{typ: 'risse', wachsen: 'takt'}], { gruppe: 'stoerungen2', daten: 'ohneEins', bemerkung: 'ausgewachsen' });
fall('streifen-beide-tempo4', [{typ: 'streifen', ton: 'beide', tempo: 4}], { gruppe: 'stoerungen2', titel: 'b', bemerkung: 'zweiter Titel' });

/* Shader mit Rauschen, Reparatur 15.09.2026 (Zeit auf dem Kreis, gerichtete Drift in zwei Lagen) */
fall('filmnebel-luftzug1', [{ typ: 'filmnebel', luftzug: 1 }, { typ: 'licht' }], { typ: 'filmnebel', gruppe: 'shader', bemerkung: 'Zug nach rechts, schnell, mit Licht' });
fall('filmnebel-luftzug-neg', [{ typ: 'filmnebel', luftzug: -1 }, { typ: 'licht' }], { typ: 'filmnebel', gruppe: 'shader', bemerkung: 'Zug nach links, mit Licht' });
fall('filmnebel-schwer-still', [{ typ: 'filmnebel', luftzug: 0, schwere: 0.9, schwaden: 1 }, { typ: 'licht' }], { typ: 'filmnebel', gruppe: 'shader', bemerkung: 'kriecht langsam, dicke Ballen' });
fall('filmnebel-rauch', [{ typ: 'filmnebel', farbe: '#181818', staerke: 1 }], { gruppe: 'shader', bemerkung: 'dunkler Rauch: Ballen ohne Leuchte sichtbar' });
fall('filmnebel-rauch-zug', [{ typ: 'filmnebel', farbe: '#181818', staerke: 1, luftzug: -0.8, schwaden: 0.8 }], { gruppe: 'shader', bemerkung: 'dunkler Rauch, Zug nach links' });
fall('wellen-aufwind', [{ typ: 'wellen', aufwind: 0.6, amplitude: 0.04 }], { gruppe: 'shader', bemerkung: 'Hitze steigt' });
fall('kaustik-langsam', [{ typ: 'kaustik', tempo: 0.1 }], { gruppe: 'shader', bemerkung: 'kleiner Zeitkreis' });
fall('flammen-langsam-wind', [{ typ: 'flammen', tempo: 0.2, wind: 0.5 }], { gruppe: 'shader', bemerkung: 'langsamer Aufstieg' });
fall('flammen-schnell', [{ typ: 'flammen', tempo: 3 }], { gruppe: 'shader', bemerkung: 'schneller Aufstieg' });

/* Linse Vorschau/Nutzersicht: Tempotreue der Leuchten allein. Ein Filmnebel ohne Schwaden malt nichts, schaltet im Haken aber die Bewegungsmessung (tempoVerh) ein. */
fall('linse-bewegung-licht', [{typ: 'filmnebel', schwaden: 0}, {typ: 'licht'}], { typ: 'filmnebel', gruppe: 'linse', bemerkung: 'Tempo des wandernden Scheinwerfers allein (Nebel 0 schaltet nur die Bewegungsmessung ein)' });
fall('linse-bewegung-licht-fahrt', [{typ: 'filmnebel', schwaden: 0}, {typ: 'licht', rmBewegung: 'fahrt'}], { typ: 'filmnebel', gruppe: 'linse', bemerkung: 'Tempo der Fahrt allein' });
fall('linse-bewegung-laser-wandern', [{typ: 'filmnebel', schwaden: 0}, {typ: 'laser', quelle: 'wandern', bauart: 'scanner'}], { typ: 'filmnebel', gruppe: 'linse', bemerkung: 'Tempo des wandernden Laser-Ursprungs allein' });
fall('linse-bewegung-laser-punkte', [{typ: 'filmnebel', schwaden: 0}, {typ: 'laser', quelle: 'fest', bauart: 'punkte', drehen: 0.15}], { typ: 'filmnebel', gruppe: 'linse', bemerkung: 'Drehtempo der Punkte allein' });
fall('linse-bewegung-streifen-beide', [{typ: 'filmnebel', schwaden: 0}, {typ: 'streifen', ton: 'beide', tempo: 9}], { typ: 'filmnebel', gruppe: 'linse', bemerkung: 'Tempo der Laufstreifen beide allein' });

/* Raender der Loop-Mathematik, Gegenpruefung 15.09.2026: kurze Clips (Takt ueber 5 s), 3/4 und 6/8, Titel mit wenigen oder nur Eins-Schlaegen,
   Teiler 8 ohne passende Taktzahl, extreme Regler, viele Karten zugleich. Datenvarianten in haken.js (datenSetzen), mit Komma kombiniert. */
const KURZ = 'gestreckt:3.22', KURZ34 = 'dreiviertel,gestreckt:4.05';
fall('rand-kurz-teiler8-flackern', [{ typ: 'puls', lmQuelle: 'takt', lmTeiler: 8, lmForm: 'flackern' }], { gruppe: 'raender', daten: KURZ, bemerkung: 'ein Takt 5,1 s, M 4: Teiler 8 geht nicht' });
fall('rand-kurz34-wackeln', [{ typ: 'wackeln', takt: 1 }], { gruppe: 'raender', titel: 'c', daten: KURZ34, bemerkung: '3/4, ein Takt 5,1 s: M 3 ungerade' });
fall('rand-kurz34-zufall-teiler8', [{ typ: 'puls', lmQuelle: 'zufall', lmTeiler: 8 }, { typ: 'laser', quelle: 'fest', bauart: 'scanner', sprung: 1, lmQuelle: 'takt', lmTeiler: 2 }], { typ: 'puls', gruppe: 'raender', titel: 'c', daten: KURZ34, bemerkung: '3/4 kurz, Teiler 8 und 2' });
fall('rand-sechs-teiler8-wackeln', [{ typ: 'puls', lmQuelle: 'takt', lmTeiler: 8 }, { typ: 'wackeln', takt: 1 }], { gruppe: 'raender', titel: 'b', daten: 'sechs', bemerkung: '6/8: M 18/12/6, 8 nicht erreichbar' });
fall('rand-sechs-kurz-teil0125', [{ typ: 'puls', lmQuelle: 'takt', lmTeiler: 0.125, lmForm: 'flackern' }, { typ: 'strobe', lmQuelle: 'eins', lmForm: 'rechteck' }], { gruppe: 'raender', titel: 'b', daten: 'sechs,gestreckt:2', bemerkung: '6/8 kurz, Achtel eines Schlags' });
fall('rand-wenige7', [{ typ: 'licht', rmBewegung: 'schritt' }, { typ: 'puls', lmQuelle: 'takt' }, { typ: 'einschlag', bleiben: 30 }, { typ: 'partikel', boeen: 1 }], { typ: 'licht', gruppe: 'raender', daten: 'ohneEins,wenige:7', bemerkung: '7 Schlaege ohne Eins: kein Raster' });
fall('rand-nurEinsen', [{ typ: 'puls', lmQuelle: 'takt', lmTeiler: 8 }, { typ: 'licht', rmBewegung: 'schritt', lmQuelle: 'eins' }], { gruppe: 'raender', daten: 'nurEinsen', bemerkung: 'nur Einsen: proTakt 1' });
fall('rand-takt-ueber10', [{ typ: 'puls', lmQuelle: 'takt', lmTeiler: 4 }, { typ: 'einschlag', bleiben: 30 }, { typ: 'sicherung', takt: 1, dauer: 800 }], { gruppe: 'raender', daten: 'gestreckt:7', bemerkung: 'Takt 11 s, Median ueber 2 s' });
const KOMBI = [{ typ: 'licht', rmTempo: 2 }, { typ: 'streiflicht' }, { typ: 'filmnebel', luftzug: -1 }, { typ: 'partikel', art: 'schwaden', boeen: 1, boeenStaerke: 1 }, { typ: 'einschlag', bleiben: 30 }, { typ: 'nachzieh', nachhall: 0.98 }];
fall('rand-kombi', KOMBI, { gruppe: 'raender', bemerkung: 'Leuchte, Streiflicht, Nebel, Schwaden mit Stoessen, Einschlag, Nachzieh' });
fall('rand-kombi-kurz', KOMBI, { gruppe: 'raender', daten: KURZ, bemerkung: 'dasselbe bei L 5,1' });
fall('rand-staub-extrem-kurz', [{ typ: 'partikel', art: 'staub', tempo: 0.2, wind: -1, wandern: 1, boeen: 1, boeenStaerke: 1 }], { gruppe: 'raender', daten: KURZ, bemerkung: 'Tempo min, Wind -1, Eigenbewegung 1' });
fall('rand-funken-extrem-kurz', [{ typ: 'partikel', art: 'funken', tempo: 3, wind: 1, boeen: 1, anzahl: 400 }], { gruppe: 'raender', daten: KURZ, bemerkung: 'Tempo max, Wind 1' });
fall('rand-tropfen-langsam-kurz', [{ typ: 'tropfen', tempo: 0.1, anzahl: 40, boeen: 1, zittern: 1 }], { gruppe: 'raender', daten: KURZ, bemerkung: 'Tempo min' });
fall('rand-ohneSchlaege-takt', [{ typ: 'partikel', boeen: 1 }, { typ: 'einschlag' }, { typ: 'wackeln', takt: 1 }, { typ: 'sicherung', takt: 1 }, { typ: 'bloecke', takt: 1 }, { typ: 'licht', rmBewegung: 'schritt', lmQuelle: 'eins' }, { typ: 'laser', quelle: 'fest', bauart: 'scanner', sprung: 1, lmQuelle: 'takt', lmTeiler: 0.25 }], { gruppe: 'raender', daten: 'ohneSchlaege', bemerkung: 'alles Schlaggebundene ohne Schlaege' });
fall('rand-hz-raender-kurz', [{ typ: 'puls', lmQuelle: 'hz', lmHz: 0.1, lmForm: 'flackern' }, { typ: 'strobe', lmQuelle: 'hz', lmHz: 13, lmForm: 'rechteck' }], { gruppe: 'raender', daten: KURZ, bemerkung: 'Frequenz min und hoch' });
fall('rand-shader-kurz', [{ typ: 'kaustik', tempo: 0.1 }, { typ: 'wellen', tempo: 3, aufwind: 1, amplitude: 0.08 }], { gruppe: 'raender', daten: KURZ, bemerkung: 'Shader bei L 5,1' });
fall('rand-flammen-kurz', [{ typ: 'flammen', tempo: 0.2, wind: -1 }], { gruppe: 'raender', daten: KURZ, bemerkung: 'Flammen langsam, Wind -1, L 5,1' });
fall('rand-stoerungen-kurz', [{ typ: 'sicherung', takt: 0, haeufigkeit: 0.5, dauer: 800, zittern: 1 }, { typ: 'bloecke', takt: 0, haeufigkeit: 0.5, dauer: 600 }, { typ: 'korn', tempo: 0 }, { typ: 'streifen', ton: 'beide', tempo: 2 }, { typ: 'rauschen' }], { gruppe: 'raender', daten: KURZ, bemerkung: 'seltene Fenster laenger als L' });
fall('rand-laser-extrem-kurz', [{ typ: 'laser', quelle: 'wandern', bauart: 'punkte', drehen: 1, tempo: 2, flimmer: 1, flimmerTempo: 40 }], { gruppe: 'raender', daten: KURZ, bemerkung: 'Drehen max, Tempo min' });
fall('rand-leuchten-langsam-kurz', [{ typ: 'licht', rmBewegung: 'fahrt', rmTempo: 30 }, { typ: 'schatten', rmBewegung: 'schritt', lmQuelle: 'eins' }], { gruppe: 'raender', daten: KURZ, bemerkung: 'Fahrt langsamer als L' });
fall('rand-nachzieh-zufall-kurz', [{ typ: 'nachzieh', nachhall: 0.98 }, { typ: 'strobe', lmQuelle: 'zufall', lmForm: 'rechteck' }, { typ: 'rauschen' }], { typ: 'nachzieh', gruppe: 'raender', daten: KURZ, bemerkung: 'Gedaechtnis ueber mehrere Runden' });
fall('rand-jetzt-anfang', [{ typ: 'einschlag', bleiben: 30 }, { typ: 'puls', lmQuelle: 'takt', lmTeiler: 8 }, { typ: 'partikel', boeen: 1 }], { gruppe: 'raender', jetzt: 0.2, bemerkung: 'Clip am Songanfang, Vorlauf vor 0' });
fall('rand-risse-beschlag-kurz', [{ typ: 'risse', wachsen: 'takt' }, { typ: 'beschlag', wachsen: 'zeit' }, { typ: 'vlauf', takt: 1, tempo: 1 }], { gruppe: 'raender', daten: KURZ, bemerkung: 'Wachsen und Ruck bei L 5,1' });
fall('linse-bewegung-laser-wandern-gitter', [{typ: 'filmnebel', schwaden: 0}, {typ: 'laser', quelle: 'wandern', bauart: 'gitter'}], { typ: 'filmnebel', gruppe: 'linse', bemerkung: 'Tempo des wandernden Laser-Ursprungs, Gitter ohne Scanner-Nachleuchten' });
fall('rand-nurEinsen-puls', [{ typ: 'puls', lmQuelle: 'takt', lmTeiler: 8 }], { gruppe: 'raender', daten: 'nurEinsen', bemerkung: 'nur Einsen, Teiler 8 allein' });
fall('rand-nurEinsen-schritt', [{ typ: 'licht', rmBewegung: 'schritt', lmQuelle: 'eins' }], { gruppe: 'raender', daten: 'nurEinsen', bemerkung: 'nur Einsen, Schritt auf der Eins allein' });
fall('rand-kombi-nachzieh', [{ typ: 'licht', rmTempo: 2 }, { typ: 'streiflicht' }, { typ: 'einschlag', bleiben: 30 }, { typ: 'nachzieh', nachhall: 0.98 }, { typ: 'puls', lmQuelle: 'zufall', lmTeiler: 8 }], { typ: 'nachzieh', gruppe: 'raender', daten: KURZ, bemerkung: 'Kombination ohne Nebel und Teilchen, kurz' });
fall('rand-wenige7-risse', [{ typ: 'risse', wachsen: 'takt' }], { gruppe: 'raender', daten: 'ohneEins,wenige:7', bemerkung: '7 Schlaege ohne Eins: Vorschau gewachsen, Export ohne Raster' });
fall('rand-wenige7-einschlag', [{ typ: 'einschlag', bleiben: 30, anteil: 1 }], { gruppe: 'raender', daten: 'ohneEins,wenige:7', jetzt: 61.5, bemerkung: '7 Schlaege ohne Eins, alle treffen, Clip kurz nach den Schlaegen' });
fall('rand-wenige7-schritt-bewegung', [{'typ':'filmnebel','schwaden':0},{'typ':'licht','rmBewegung':'schritt'}], {'typ':'filmnebel','gruppe':'raender','daten':'ohneEins,wenige:7','jetzt':61.5,'bemerkung':'Schritt auf 7 Schlaegen: Vorschau steht nach dem letzten, Export springt je Sekunde (Nebel 0 schaltet nur die Bewegungsmessung ein)'});
fall('rand-ohneSchlaege-schritt-bewegung', [{'typ':'filmnebel','schwaden':0},{'typ':'licht','rmBewegung':'schritt'}], {'typ':'filmnebel','gruppe':'raender','daten':'ohneSchlaege','jetzt':61.5,'bemerkung':'Gegenprobe: ohne Schlaege springt auch die Vorschau je Sekunde'});
/* Nachbesserung nach der Gegenpruefung (15.09.2026): Tempo-Gegenproben und der Farbtausch der Laufstreifen. */
fall('nachbess-bewegung-licht-fest', [{ typ: 'filmnebel', schwaden: 0 }, { typ: 'licht', rmBewegung: 'fest' }], { typ: 'filmnebel', gruppe: 'nachbesserung', bemerkung: 'Gegenprobe zu linse-bewegung-licht: dieselbe Leuchte ohne Bewegung - wieviel tempoVerh kommt vom Puls allein' });
fall('nachbess-bewegung-licht-tempo8', [{ typ: 'filmnebel', schwaden: 0 }, { typ: 'licht', rmTempo: 8 }], { typ: 'filmnebel', gruppe: 'nachbesserung', bemerkung: 'wandernd Tempo 8: 1,19 Umlaeufe waagerecht, 1,54 senkrecht - rastet, pendelt nicht' });
fall('nachbess-bewegung-streifen-beide-tempo30', [{ typ: 'filmnebel', schwaden: 0 }, { typ: 'streifen', ton: 'beide', tempo: 30 }], { typ: 'filmnebel', gruppe: 'nachbesserung', bemerkung: 'Laufstreifen beide am Reglerende: vorher 6,3-mal so schnell' });
fall('nachbess-streifen-beide-tempo8', [{ typ: 'streifen', ton: 'beide', tempo: 8 }], { gruppe: 'nachbesserung', bemerkung: 'beide, Tempo 8: ein Durchlauf je Clip (ungerade) - Farbtausch einmal je Clip, sonst hell-Tempo' });
fall('nachbess-wenige7-schritt-stetig', [{ typ: 'filmnebel', schwaden: 0 }, { typ: 'licht', rmBewegung: 'schritt', lmQuelle: 'stetig' }], { typ: 'filmnebel', gruppe: 'nachbesserung', daten: 'ohneEins,wenige:7', jetzt: 61.5, bemerkung: 'wie rand-wenige7-schritt-bewegung, aber ohne Puls: tempoVerh zeigt nur den Schritt (Export steht auf dem laengsten Stand im Clip)' });

const aus = { erzeugt: 'labor/nahtpruefung/faelle-bauen.js', jetzt: JETZT, titel, faelle: F,
  nichtHerstellbar: [] };
fs.writeFileSync(path.join(__dirname, 'faelle.json'), JSON.stringify(aus, null, 1) + '\n');
console.log(F.length + ' Faelle; Titel a=' + titel.a.titel + ' (M ' + titel.a.M + '), b=' + titel.b.titel + ' (M ' + titel.b.M + '), c=' + titel.c.titel + ' (3/4, M ' + titel.c.M + ')');
