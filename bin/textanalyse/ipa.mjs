// Lautschrift (IPA) → Silbenkerne mit Betonungsstufe.
// Stufe 2 = Hauptakzent (ˈ), 1 = Nebenakzent (ˌ), 0 = unbetont.
// Ein Silbenkern ist ein Vokal ohne „unsilbisch“-Zeichen (U+032F) oder ein
// Konsonant mit „silbisch“-Zeichen (U+0329 / U+030D). Die Akzentzeichen stehen
// vor dem Anlaut der betonten Silbe und gelten daher für den nächsten Kern.

const VOKALE = new Set([...'aɑɐeɛəiɪoɔuʊyʏøœæɜʌɒɨɵʉɘɤɯɚ']);
const UNSILBISCH = '̯';
const SILBISCH = new Set(['̩', '̍']);
const ist_zeichen = c => /[̀-ͯ͡ːˑ]/.test(c);

export function betonungAusIpa(ipa) { return silbenkerne(ipa).map(k => k.stufe); }

// Silbenkerne mit Lage im IPA-String: { stufe, pos, voll } – voll = kein Schwa/ɐ/silbischer Konsonant
export function silbenkerne(ipa) {
  const s = ipa.replace(/^\/|\/$/g, '');
  const stufen = [];
  let offen = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === 'ˈ') { offen = 2; continue; }
    if (c === 'ˌ') { offen = Math.max(offen, 1); continue; }
    if (ist_zeichen(c)) continue;
    // nachfolgende diakritische Zeichen einsammeln
    let j = i + 1, zeichen = '';
    while (j < s.length && ist_zeichen(s[j])) zeichen += s[j++];
    // Doppellaut ohne „unsilbisch“-Zeichen (z. B. /daɪ/): zweiter Teil ist kein eigener Kern
    const doppellaut = 'ɪʊʏ'.includes(c) && i > 0 && 'aɔe'.includes(s[i - 1]) && !zeichen;
    const kern = VOKALE.has(c)
      ? !zeichen.includes(UNSILBISCH) && !doppellaut
      : [...zeichen].some(z => SILBISCH.has(z));
    if (kern) { stufen.push({ stufe: offen, pos: i, voll: VOKALE.has(c) && c !== 'ə' && c !== 'ɐ' }); offen = 0; }
  }
  return stufen;
}
