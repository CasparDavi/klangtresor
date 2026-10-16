/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* DIE WÖRTER DER KLANG-ETIKETTEN — eine Tabelle für bin/karte.js und die Seite.

   Das Musikstil-Modell (Jamendo-Etiketten) liefert englische Etiketten:
   electronic, energetic, relaxing, love … bin/karte.js setzt daraus die
   deutschen Gruppennamen („Metal · Elektronik — energisch“) und die
   Genre-, Stimmungs- und Instrumentwörter im Steckbrief. Diese Namen
   stehen so in library/karte.json und sind dort Schlüssel (Farben,
   Zoom, Vergleiche) — sie bleiben deutsch.

   Für die englische Oberfläche geht die Seite denselben Weg zurück: aus
   dem deutschen Wort wird wieder das Etikett des Modells. Nicht neu
   übersetzt, nur die Schreibweise für die Anzeige angeglichen: Genres
   groß wie im Deutschen (Electronic, Rock), zusammengeschriebene
   Etiketten wieder getrennt (hiphop → Hip-Hop, easylistening → Easy
   Listening), Stimmungen und Instrumente klein (energetic, relaxing,
   love, acoustic guitar). Eine Tabelle, damit Hin- und Rückweg nie
   auseinanderlaufen.

   Zeile: [Etikett des Modells, deutsch, englische Anzeige, Art]
   Art: g = Genre, s = Stimmung/Thema, i = Instrument. */
(function (wurzel) {
  'use strict';
  const KLANG_WOERTER = [
    ['rock', 'Rock', 'Rock', 'g'], ['metal', 'Metal', 'Metal', 'g'], ['pop', 'Pop', 'Pop', 'g'],
    ['electronic', 'Elektronik', 'Electronic', 'g'], ['alternative', 'Alternative', 'Alternative', 'g'], ['folk', 'Folk', 'Folk', 'g'],
    ['hiphop', 'Hip-Hop', 'Hip-Hop', 'g'], ['rap', 'Rap', 'Rap', 'g'], ['jazz', 'Jazz', 'Jazz', 'g'],
    ['classical', 'Klassik', 'Classical', 'g'], ['ambient', 'Ambient', 'Ambient', 'g'], ['soundtrack', 'Soundtrack', 'Soundtrack', 'g'],
    ['chanson', 'Chanson', 'Chanson', 'g'], ['country', 'Country', 'Country', 'g'], ['blues', 'Blues', 'Blues', 'g'],
    ['reggae', 'Reggae', 'Reggae', 'g'], ['punkrock', 'Punkrock', 'Punk Rock', 'g'], ['hardrock', 'Hardrock', 'Hard Rock', 'g'],
    ['heavymetal', 'Heavy Metal', 'Heavy Metal', 'g'], ['singersongwriter', 'Singer-Songwriter', 'Singer-Songwriter', 'g'],
    ['easylistening', 'Easy Listening', 'Easy Listening', 'g'], ['newage', 'New Age', 'New Age', 'g'],
    ['world', 'Weltmusik', 'World', 'g'], ['latin', 'Latin', 'Latin', 'g'], ['funk', 'Funk', 'Funk', 'g'], ['soul', 'Soul', 'Soul', 'g'],
    ['dance', 'Dance', 'Dance', 'g'], ['techno', 'Techno', 'Techno', 'g'], ['house', 'House', 'House', 'g'],
    ['trance', 'Trance', 'Trance', 'g'], ['orchestral', 'Orchestral', 'Orchestral', 'g'], ['instrumentalpop', 'Instrumental-Pop', 'Instrumental Pop', 'g'],
    ['poprock', 'Poprock', 'Pop Rock', 'g'], ['indie', 'Indie', 'Indie', 'g'], ['experimental', 'Experimentell', 'Experimental', 'g'],
    ['atmospheric', 'atmosphärisch', 'Atmospheric', 'g'], ['electropop', 'Electropop', 'Electropop', 'g'],
    ['acousticguitar', 'Akustikgitarre', 'acoustic guitar', 'i'],
    ['energetic', 'energisch', 'energetic', 's'], ['happy', 'fröhlich', 'happy', 's'], ['heavy', 'schwer', 'heavy', 's'],
    ['love', 'Liebe', 'love', 's'], ['epic', 'episch', 'epic', 's'], ['sad', 'traurig', 'sad', 's'], ['dark', 'dunkel', 'dark', 's'],
    ['melancholic', 'melancholisch', 'melancholic', 's'], ['relaxing', 'entspannt', 'relaxing', 's'], ['calm', 'ruhig', 'calm', 's'],
    ['emotional', 'emotional', 'emotional', 's'], ['dramatic', 'dramatisch', 'dramatic', 's'], ['romantic', 'romantisch', 'romantic', 's'],
    ['uplifting', 'aufbauend', 'uplifting', 's'], ['hopeful', 'hoffnungsvoll', 'hopeful', 's'], ['powerful', 'kraftvoll', 'powerful', 's'],
    ['fun', 'Spaß', 'fun', 's'], ['dream', 'Traum', 'dream', 's'], ['film', 'Film', 'film', 's'], ['meditative', 'meditativ', 'meditative', 's'],
    ['melodic', 'melodisch', 'melodic', 's'], ['slow', 'langsam', 'slow', 's'], ['fast', 'schnell', 'fast', 's'], ['soft', 'sanft', 'soft', 's'],
    ['deep', 'tief', 'deep', 's'], ['groovy', 'groovig', 'groovy', 's'], ['inspiring', 'inspirierend', 'inspiring', 's'],
    ['motivational', 'motivierend', 'motivational', 's'], ['upbeat', 'beschwingt', 'upbeat', 's'], ['positive', 'positiv', 'positive', 's'],
    ['party', 'Party', 'party', 's'], ['summer', 'Sommer', 'summer', 's'], ['nature', 'Natur', 'nature', 's'],
    ['christmas', 'Weihnachten', 'christmas', 's'], ['children', 'Kinder', 'children', 's'],
    ['drums', 'Schlagzeug', 'drums', 'i'], ['bass', 'Bass', 'bass', 'i'], ['electricguitar', 'E-Gitarre', 'electric guitar', 'i'],
    ['guitar', 'Gitarre', 'guitar', 'i'], ['piano', 'Klavier', 'piano', 'i'], ['synthesizer', 'Synthesizer', 'synthesizer', 'i'],
    ['voice', 'Stimme', 'voice', 'i'], ['strings', 'Streicher', 'strings', 'i'], ['violin', 'Geige', 'violin', 'i'],
    ['keyboard', 'Keyboard', 'keyboard', 'i'], ['orchestra', 'Orchester', 'orchestra', 'i'], ['acousticbassguitar', 'Akustikbass', 'acoustic bass guitar', 'i'],
    ['drummachine', 'Drumcomputer', 'drum machine', 'i'], ['computer', 'Computer', 'computer', 'i'], ['beat', 'Beat', 'beat', 'i'],
    ['pad', 'Flächen', 'pad', 'i'], ['percussion', 'Perkussion', 'percussion', 'i'], ['accordion', 'Akkordeon', 'accordion', 'i'],
    ['cello', 'Cello', 'cello', 'i'], ['flute', 'Flöte', 'flute', 'i'], ['trumpet', 'Trompete', 'trumpet', 'i'],
    ['saxophone', 'Saxofon', 'saxophone', 'i'], ['organ', 'Orgel', 'organ', 'i'], ['brass', 'Bläser', 'brass', 'i'], ['choir', 'Chor', 'choir', 'i'],
  ];
  if (typeof module === 'object' && module.exports) module.exports = KLANG_WOERTER;
  else wurzel.KLANG_WOERTER = KLANG_WOERTER;
})(typeof window !== 'undefined' ? window : globalThis);
