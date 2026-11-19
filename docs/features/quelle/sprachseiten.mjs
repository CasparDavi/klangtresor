// Sprachseiten der Feature-Seite: docs/features/index.html (Englisch), de.html, ru.html.
// Uebernommen aus dem KlangFeder-Repo am 19.11.2026 (werkzeug/sprachseiten.mjs) und auf den
// KlangTresor angepasst: eigene Adresse, eigener Sprachschluessel, eigene Koepfe, eigener Port.
// Jede Seite trägt Kopf (Titel, Beschreibung, Link-Vorschau, hreflang, Programmbeschreibung) und den ganzen Seitentext schon
// im HTML, damit Suchmaschinen ohne JavaScript sie lesen (Caspar_D 19.11.2026: „A und B umsetzen“ – Auffindbarkeit).
// Quelle bleibt docs/features/index.html + inhalt.js; dieses Werkzeug füllt nur die Bereiche <!--kopf-->…<!--/kopf--> und
// <!--seite-->…<!--/seite--> und schreibt de.html/ru.html daraus. Nach jeder Änderung an Text oder Seite neu laufen lassen:
//   node docs/features/quelle/sprachseiten.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { starte, warte } from './cdp.mjs';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.join(HIER, '..');          // quelle/ liegt IN docs/features
const WURZEL = path.join(HIER, '..', '..');  // docs/ - dort liegt die Sitemap
const BASIS = 'https://caspardavi.github.io/klangtresor/features/';
const DATEI = { en: 'index.html', de: 'de.html', ru: 'ru.html' };
const ADRESSE = { en: BASIS, de: BASIS + 'de.html', ru: BASIS + 'ru.html' };
const PORT = 8797;   // 8796 gehoert dem gleichen Werkzeug der KlangFeder
const OG = (L) => `${BASIS}img/og-${L}.jpg?v=20261119`;   // Vorschaubild je Sprache (werkzeug/vorschaubild.mjs); v hochzählen, wenn es neu ist


const KOPF = {
  en: { titel: 'KlangTresor – your own Suno archive: karaoke, sound analysis, studio, star map',
        beschr: 'Free and open source: brings your Suno songs, lyrics, artwork and albums onto your own computer. Karaoke with the lyrics running along, sound analysis, an equaliser and a sound space. No account, no cloud.',
        og: 'KlangTresor – Your Suno music. At home.' },
  de: { titel: 'KlangTresor – dein eigenes Suno-Archiv: Karaoke, Klanganalyse, Tonstudio, Sternenkarte',
        beschr: 'Frei und quelloffen: holt deine Suno-Titel, Liedtexte, Titelbilder und Alben auf den eigenen Rechner. Karaoke mit mitlaufendem Text, Klanganalyse, Equalizer und Klangraum. Kein Konto, keine Cloud.',
        og: 'KlangTresor – Deine Suno-Musik. Bei dir.' },
  ru: { titel: 'KlangTresor — ваш архив Suno: караоке, анализ звука, студия, звёздная карта',
        beschr: 'Бесплатно и с открытым кодом: переносит ваши треки Suno, тексты, обложки и альбомы на ваш компьютер. Караоке с бегущим текстом, анализ звука, эквалайзер и звуковое пространство. Без аккаунта и без облака.',
        og: 'KlangTresor — Твоя музыка из Suno. У тебя дома.' },
};
const esc = (t) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function kopf(L) {
  const k = KOPF[L];
  const ld = { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'KlangTresor', url: ADRESSE[L],
    description: k.beschr, inLanguage: L, applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Windows 10, Windows 11, macOS 11+, Linux', isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    downloadUrl: 'https://github.com/CasparDavi/klangtresor/releases/latest', image: OG(L),
    license: 'https://opensource.org/licenses/MIT', author: { '@type': 'Person', name: 'Caspar_D' } };
  /* Startseite: wer Deutsch oder Russisch gewählt hat (oder dessen Browser so eingestellt ist), kommt sofort auf seine
     Sprachseite – vor dem ersten Bild, damit kein englischer Text aufblitzt. Gleiche Reihenfolge wie spracheWaehlen(). */
  /* REIHENFOLGE WIE spracheWaehlen() IN index.html: ?lang= SCHLAEGT das Gemerkte.
     Die Vorlage der KlangFeder fragt umgekehrt - und damit landete ein Besucher
     mit ?lang=ru auf der deutschen Seite, wenn er vorher einmal deutsch gelesen
     hatte (19.11.2026 in der Probe gesehen). Der KlangTresor verschickt genau
     solche Links: „Was KlangTresor kann" im Programm traegt die Sprache der
     Oberflaeche mit. Caspar_D, 16.11.2026: „die sprache muss steuern, welche
     page ich sehe". */
  const weiter = L !== 'en' ? '' : `<script>(function(){var l=new URLSearchParams(location.search).get('lang');`
    + `if(!/^(de|en|ru)$/.test(l||'')){l=null;try{l=localStorage.getItem('kt-features-sprache')}catch(e){}}`
    + `if(!/^(de|en|ru)$/.test(l||'')){l=null;var n=navigator.languages||[navigator.language||'en'];for(var i=0;i<n.length&&!l;i++){var x=(n[i]||'').slice(0,2);if(/^(de|en|ru)$/.test(x))l=x}}`
    + `var d={de:'de.html',ru:'ru.html'}[l];if(d)location.replace(d+location.hash)})()</script>\n`;
  return `<!--kopf-->
<title>${esc(k.titel)}</title>
<meta name="description" content="${esc(k.beschr)}">
<link rel="canonical" href="${ADRESSE[L]}">
${['en', 'de', 'ru'].map((x) => `<link rel="alternate" hreflang="${x}" href="${ADRESSE[x]}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${BASIS}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="KlangTresor">
<meta property="og:locale" content="${{ en: 'en_US', de: 'de_DE', ru: 'ru_RU' }[L]}">
<meta property="og:title" content="${esc(k.og)}">
<meta property="og:description" content="${esc(k.beschr)}">
<meta property="og:url" content="${ADRESSE[L]}">
<meta property="og:image" content="${OG(L)}">
<meta property="og:image:width" content="1280">
<meta property="og:image:height" content="640">
<meta property="og:image:alt" content="${esc(k.og)}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${weiter}<!--/kopf-->`;
}

const quelle = fs.readFileSync(path.join(DOCS, 'index.html'), 'utf8');
if (!quelle.includes('<!--kopf-->') || !quelle.includes('<!--seite-->')) throw new Error('Marken <!--kopf--> / <!--seite--> fehlen in docs/features/index.html');

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', DOCS], { stdio: 'ignore' });
process.on('exit', () => { try { server.kill(); } catch (e) {} });
await warte(800);
const b = await starte({ w: 1280, h: 900, mobile: false, touch: false, coarse: false, url: `http://127.0.0.1:${PORT}/index.html?s=${Date.now()}`,
  vorScript: `try{localStorage.setItem('kt-features-sprache','en')}catch(e){}` });   /* sonst leitet die Browsersprache (hier Deutsch) weiter */
await warte(1500);

for (const L of ['en', 'de', 'ru']) {
  const html = await b.ev(`L=${JSON.stringify(L)}; bauen(); return document.getElementById('seite').innerHTML`);
  if (typeof html !== 'string' || html.length < 10000 || html.startsWith('EVALFEHLER')) throw new Error(`Seite ${L} leer: ${String(html).slice(0, 200)}`);
  /* Im HTML stehende Videos nicht schon laden – das Skript baut die Seite beim Öffnen ohnehin neu */
  const still = html.replace(/ autoplay(="")?/g, '').replace(/<video /g, '<video preload="none" ');
  const s = quelle
    .replace(/<html lang="[a-z]+"( data-seite="[a-z]+")?>/, `<html lang="${L}" data-seite="${L}">`)
    .replace(/<!--kopf-->[\s\S]*?<!--\/kopf-->/, () => kopf(L))
    .replace(/<!--seite-->[\s\S]*?<!--\/seite-->/, () => `<!--seite-->${still}<!--/seite-->`)
    .replace(/<nav class="sprache"/, L === 'en' ? '<nav class="sprache"' : `<!-- erzeugt von werkzeug/sprachseiten.mjs aus index.html – nicht von Hand ändern -->\n<nav class="sprache"`);
  fs.writeFileSync(path.join(DOCS, DATEI[L]), s);
  console.log(DATEI[L], Math.round(s.length / 1024), 'KB');
}
if (b.fehler.length) console.log('Fehler im Browser:\n' + b.fehler.join('\n'));

const heute = new Date().toISOString().slice(0, 10);
const alt = ['en', 'de', 'ru'].map((x) => `    <xhtml:link rel="alternate" hreflang="${x}" href="${ADRESSE[x]}"/>`).join('\n');
/* AUCH DIE HEFTE (19.11.2026). Seit 1.1.18 faehrt die Dokumentation nicht mehr im
   Paket mit - Erststart-Heft und Broschuere sind damit eigenstaendige Seiten des
   Projekts und gehoeren in die Sitemap. Je Satz eine Sprachgruppe, damit Google
   nicht drei Fassungen fuer Dubletten haelt. */
const WEITER = [
  { a: (L) => `https://caspardavi.github.io/klangtresor/erststart/KlangTresor-Erststart-${L}.pdf` },
  { a: (L) => `${BASIS}KlangTresor-Broschuere-${L}.pdf` },
];
const gruppe = (f) => ['en', 'de', 'ru'].map((L) =>
  `  <url>\n    <loc>${f(L)}</loc>\n    <lastmod>${heute}</lastmod>\n`
  + ['en', 'de', 'ru'].map((x) => `    <xhtml:link rel="alternate" hreflang="${x}" href="${f(x)}"/>`).join('\n')
  + `\n  </url>`).join('\n');
fs.writeFileSync(path.join(WURZEL, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${['en', 'de', 'ru'].map((L) => `  <url>\n    <loc>${ADRESSE[L]}</loc>\n    <lastmod>${heute}</lastmod>\n${alt}\n  </url>`).join('\n')}
${WEITER.map((w) => gruppe(w.a)).join('\n')}
</urlset>
`);
console.log('sitemap.xml');
b.ende?.();
process.exit(0);
