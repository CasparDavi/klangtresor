/* KlangTresor – Inhalt der Feature-Seite und der Broschüre: EINE Textquelle (Caspar_D, 28.10.2026: „wir arbeiten nur an einem Text“).
   Geladen von index.html und broschuere.html; Texte nur hier ändern. */
// Texte: ein Wörterbuch je Sprache. Kachel = {id, w (Breite 4/6/8/12), klein, h, p, zahl?, d (Einzelheiten)}.
// Bilder: BILDER[id] = 'img/<id>.webp' oder '.mp4'; fehlt der Eintrag, steht ein Platzhalter.
const S = {
 kopf:{
  marke:{en:'KlangTresor',de:'KlangTresor',ru:'KlangTresor'},
  h:{en:'Your Suno music. At home.',de:'Deine Suno-Musik. Bei dir.',ru:'Твоя музыка из Suno. У тебя дома.'},
  p:{en:'Suno makes the songs. KlangTresor keeps them, plays them, measures them and shows them, on every screen in your home.',
     de:'Suno macht die Titel. KlangTresor bewahrt sie, spielt sie ab, misst sie aus und zeigt sie. Auf jedem Bildschirm in deinem Zuhause.',
     ru:'Suno создаёт песни. KlangTresor хранит их, играет, измеряет и показывает — на любом экране в твоём доме.'},
  mehr:{en:'More',de:'Mehr',ru:'Подробнее'}, zu:{en:'Close',de:'Schließen',ru:'Закрыть'}, abspielen:{en:'Play',de:'Abspielen',ru:'Воспроизвести'},
  pdf:{en:'The brochure as PDF',de:'Die Broschüre als PDF',ru:'Брошюра в PDF'},
  platz:{en:'Picture follows',de:'Bild folgt',ru:'Изображение будет'}
 },
 abschnitte:[
 {augenbraue:{en:'Setup',de:'Aufbau',ru:'Устройство'},
  h:{en:'Runs at home.<br>Plays anywhere on your Wi-Fi.',de:'Läuft zu Hause.<br>Spielt überall im WLAN.',ru:'Работает дома.<br>Играет везде в домашнем Wi-Fi.'},
  p:{en:'One computer keeps the vault. Every screen in your home network opens it.',de:'Der Tresor liegt auf einem Rechner. Jedes Gerät mit einem Bildschirm (und Webbrowser) in deinem Heimnetz öffnet ihn.',ru:'Один компьютер хранит сейф. Любой экран в домашней сети открывает его.'},
  kacheln:[
  {id:'server',w:4,klein:{en:'Where it runs',de:'Wo es läuft',ru:'Где работает'},
   h:{en:'One computer at home.',de:'Ein Rechner zu Hause.',ru:'Один компьютер дома.'},
   p:{en:'<b>macOS, Windows, Linux or Docker.</b> Set up with a double click (on Linux, one command). Your archive is a folder on its disk.',de:'<b>macOS, Windows, Linux, auch in Docker.</b> Eingerichtet per Doppelklick (unter Linux ein Befehl). Dein Archiv ist ein Ordner auf der Platte dieses Rechners.',ru:'<b>macOS, Windows, Linux или Docker.</b> Установка двойным щелчком (в Linux — одной командой). Твой архив — папка на его диске.'},
   d:{en:['<b>Needs Node.js and ffmpeg.</b> The setup brings Node.js along; it fetches ffmpeg itself on Windows, on Mac and Linux one command does it.','<b>Space:</b> about 1.6 GB for the program and its models, plus 3.1 GB for Whisper; then about 160 MB per song with everything that belongs to it: WAV, instrument tracks, analysis, covers (measured on the author’s 343 songs).','<b>The computer is the server.</b> While its window is open, your vault is reachable; close it and the vault is off.'],
      de:['<b>Braucht Node.js und ffmpeg.</b> Die Einrichtung bringt Node.js mit und holt ffmpeg unter Windows selbst; auf Mac und Linux genügt ein Befehl.','<b>Platz:</b> rund 1,6 GB für Programm und Modelle, dazu 3,1 GB für Whisper; dann rund 160 MB je Titel mit allem, was dazugehört: WAV, Instrumentspuren, Analyse, Titelbild (gemessen an den 343 Titeln des Autors).','<b>Der Rechner ist der Server.</b> Solange sein Fenster offen ist, ist dein Tresor erreichbar; schließt du es, ist der Tresor aus.'],
      ru:['<b>Нужны Node.js и ffmpeg.</b> Node.js установка приносит с собой; ffmpeg на Windows она загружает сама, на Mac и Linux хватит одной команды.','<b>Место:</b> около 1,6 ГБ на программу и модели и ещё 3,1 ГБ на Whisper; затем около 160 МБ на песню со всем, что к ней относится: WAV, инструментальные дорожки, анализ, обложки (измерено на 343 песнях автора).','<b>Компьютер — это сервер.</b> Пока его окно открыто, сейф доступен; закроешь окно — сейф выключен.']}},
  {id:'leser',w:8,klein:{en:'Who reads it',de:'Womit du hörst',ru:'Кто открывает'},
   h:{en:'Every screen with a browser.',de:'Jeder Bildschirm mit Browser.',ru:'Любой экран с браузером.'},
   p:{en:'<b>Laptop, iPhone, Android, iPad, tablet.</b> Anything that runs a web browser in your home network. Nothing to install.',de:'<b>Laptop, iPhone, Android, iPad, Tablet.</b> Alles, was im Heimnetz einen Webbrowser hat. Nichts zu installieren.',ru:'<b>Ноутбук, iPhone, Android, iPad, планшет.</b> Всё, на чём в домашней сети есть веб-браузер. Ничего не нужно устанавливать.'},
   d:{en:['<b>Scan a QR code</b> on the computer and the phone opens your vault.','<b>On the home screen</b> like an app; on the iPhone without the address bar.','<b>Home network only.</b> There is no password: whoever is on your network and knows the address can listen. So do not open the vault to the outside on your router.'],
      de:['<b>QR-Code am Rechner scannen</b>, und das Handy öffnet deinen Tresor.','<b>Auf dem Startbildschirm</b> wie eine App, auf dem iPhone ohne Adresszeile.','<b>Nur im Heimnetz.</b> Es gibt kein Passwort: Wer in deinem Netz ist und die Adresse kennt, kann mithören. Gib den Tresor darum nicht am Router nach außen frei.'],
      ru:['<b>Отсканируй QR-код</b> на компьютере — и телефон откроет твой сейф.','<b>На главном экране</b>, как приложение; на iPhone — без адресной строки.','<b>Только домашняя сеть.</b> Пароля нет: кто в твоей сети и знает адрес, может слушать. Поэтому не открывай сейф наружу на роутере.']}}
  ]},
 {augenbraue:{en:'Collect',de:'Sammeln',ru:'Собрать'},
  h:{en:'Suno fills it.<br>You keep it.',de:'Suno füllt den Tresor.<br>Du behältst ihn.',ru:'Suno наполняет.<br>Остаётся у тебя.'},
  p:{en:'One click on the bookmark at Suno and on the red button, and the vault fetches what is new. If Suno changes, or your subscription ends, everything is already at home.',de:'Ein Klick aufs Lesezeichen bei Suno, einer auf den roten Knopf, und der Tresor holt, was neu ist. Ändert sich Suno oder endet dein Abo, ist alles schon bei dir.',ru:'Один щелчок по закладке в Suno и по красной кнопке — и сейф забирает новое. Если Suno изменится или закончится подписка — всё уже у тебя дома.'},
  kacheln:[
  {id:'morgenlauf',w:12,quer:true,klein:{en:'Morning run',de:'Morgenlauf',ru:'Утренний запуск'},
   h:{en:'Everything you made. In full.',de:'Alles, was du gemacht hast. Vollständig.',ru:'Всё созданное тобой. Полностью.'},
   p:{en:'Covers, moving covers, lyrics, playlists, comments and hearts. The audio (MP3 and lossless WAV) the vault takes straight from your downloads. Songs you have not yet transferred from Suno to your computer must, from September 2026, be released for download at Suno.',de:'Titelbilder, Bewegtbilder, Liedtexte, Playlists, Kommentare und Herzen. Den Ton (MP3 und verlustfreies WAV) übernimmt der Tresor direkt aus deinen Downloads. Titel, die du bisher noch nicht von Suno auf deinen Computer übertragen hast, müssen bei Suno ab September 2026 für den Download freigegeben werden.',ru:'Обложки, видеообложки, тексты, плейлисты, комментарии и лайки. Звук (MP3 и WAV без потерь) сейф сразу берёт из твоих загрузок. Песни, которые ты ещё не перенёс из Suno на компьютер, с сентября 2026 года нужно сначала открыть для скачивания в Suno.'},
   d:{en:['<b>Private songs too</b>, as long as they sit in one of your own playlists.','<b>Your Suno login stays in your browser.</b> A bookmark does the fetching; KlangTresor never sees a password.','<b>Only new things travel.</b> What is already at home is not fetched again.'],
      de:['<b>Auch private Titel</b>, solange sie in einer deiner eigenen Playlists liegen.','<b>Deine Suno-Anmeldung bleibt in deinem Browser.</b> Ein Lesezeichen holt die Daten; KlangTresor sieht nie ein Passwort.','<b>Nur Neues wird geholt.</b> Was schon zu Hause ist, kommt nicht noch einmal.'],
      ru:['<b>Приватные песни тоже</b> — если они лежат в одном из твоих плейлистов.','<b>Вход в Suno остаётся в твоём браузере.</b> Данные забирает закладка; KlangTresor никогда не видит пароль.','<b>Забирается только новое.</b> То, что уже дома, повторно не скачивается.']}},
  {id:'schaubild',w:12,klein:{en:'What travels',de:'Was wohin geht',ru:'Что куда идёт'},
   h:{en:'From Suno into your vault.',de:'Von Suno in deinen Tresor.',ru:'Из Suno в твой сейф.'},
   p:{en:'Suno delivers the songs. Everything that can be measured is computed at home.',de:'Suno liefert die Titel. Alles, was sich messen lässt, wird zu Hause berechnet.',ru:'Suno поставляет песни. Всё, что можно измерить, рассчитывается дома.'},
   d:{en:['<b>The red button</b> at the top of KlangTresor starts the morning run by hand.'],
      de:['<b>Der rote Knopf</b> oben im KlangTresor startet den Morgenlauf von Hand.'],
      ru:['<b>Красная кнопка</b> вверху KlangTresor вручную запускает утреннюю загрузку.']}},
  ]},
 {augenbraue:{en:'Overview',de:'Übersicht',ru:'Обзор'},
  h:{en:'Everything at a glance.',de:'Alles auf einen Blick.',ru:'Всё с одного взгляда.'},
  p:{en:'Your whole work as a wall of covers. Filter, sort, and one click plays.',de:'Dein ganzes Werk als Wand aus Titelbildern. Filtern, sortieren, ein Klick, und der Titel läuft.',ru:'Всё твоё творчество — стена обложек. Фильтруй, сортируй, один щелчок — и играет.'},
  kacheln:[
  {id:'uebersicht',w:8,klein:{en:'Filter, sort, listen',de:'Filtern, sortieren, anhören',ru:'Фильтровать, сортировать, слушать'},
   h:{en:'Find any song in seconds.',de:'Jeden Titel in Sekunden finden.',ru:'Любая песня — за секунды.'},
   p:{en:'Tags in the search field, choices below, the player always at hand.',de:'Marken im Suchfeld, Auswahl darunter, die Abspiel-Leiste immer zur Hand.',ru:'Метки в поле поиска, выбор под ним, плеер всегда под рукой.'},
   d:{en:['<b>Tile size</b> from a few large covers to ten in a row.','<b>A click on a cover</b> plays the song; the stage is one more click away.'],
      de:['<b>Kachelgröße</b> von wenigen großen Titelbildern bis zehn in einer Reihe.','<b>Ein Klick aufs Titelbild</b> spielt den Titel; die Bühne ist einen Klick weiter.'],
      ru:['<b>Размер плиток</b> — от нескольких больших обложек до десяти в ряд.','<b>Щелчок по обложке</b> запускает песню; сцена — ещё один щелчок.']}},
  {id:'filtern',w:4,klein:{en:'What you can filter by',de:'Wonach du filterst',ru:'Чем фильтровать'},
   h:{en:'Narrow it down.',de:'Eingrenzen.',ru:'Сузить выбор.'},
   p:{en:'Everything the vault knows about a song can become a filter.',de:'Alles, was der Tresor über einen Titel weiß, kann ein Filter werden.',ru:'Всё, что сейф знает о песне, может стать фильтром.'},
   d:{en:['<b>Tags combine:</b> each one narrows the wall further.','<b>One click on ×</b> removes a tag again.'],
      de:['<b>Marken lassen sich kombinieren:</b> Jede grenzt die Auswahl weiter ein.','<b>Ein Klick aufs ×</b> nimmt eine Marke wieder weg.'],
      ru:['<b>Метки сочетаются:</b> каждая сужает стену дальше.','<b>Щелчок по ×</b> снимает метку.']}}
  ]},
 {augenbraue:{en:'Listen',de:'Hören',ru:'Слушать'},
  h:{en:'A stage for every song.',de:'Eine Bühne für jeden Titel.',ru:'Сцена для каждой песни.'},
  p:{en:'Full screen, cover or moving image, and the lyrics follow the voice word by word.',de:'Vollbild, Titelbild oder Bewegtbild, und der Text folgt der Stimme Wort für Wort.',ru:'Полный экран, обложка или видео — и текст следует за голосом слово за словом.'},
  kacheln:[
  {id:'buehne',w:6,klein:{en:'Karaoke',de:'Karaoke',ru:'Караоке'},
   h:{en:'Sing along. Word by word.',de:'Mitsingen. Wort für Wort.',ru:'Пой вместе. Слово за словом.'},
   p:{en:'Word timing is computed on your own computer, for German, English and Russian songs.',de:'Wann welches Wort fällt, berechnet dein eigener Rechner, für deutsche, englische und russische Titel.',ru:'Тайминг слов рассчитывает твой компьютер — для немецких, английских и русских песен.'},
   d:{en:['<b>Whisper runs locally.</b> Nothing from KlangTresor goes to an outside service.','<b>Readable from the sofa:</b> the current line large, the next one announced, the controls fade away.','<b>Cover or moving cover</b> behind the text, and your own effect clips.'],
      de:['<b>Whisper läuft lokal.</b> Nichts aus dem KlangTresor geht an einen fremden Dienst.','<b>Vom Sofa lesbar:</b> die aktuelle Zeile groß, die nächste angekündigt, die Knöpfe werden ausgeblendet.','<b>Titelbild oder Bewegtbild</b> hinter dem Text, dazu deine eigenen Effektclips.'],
      ru:['<b>Whisper работает локально.</b> Ничто из KlangTresor не уходит в чужой сервис.','<b>Читается с дивана:</b> текущая строка крупно, следующая — заранее, кнопки исчезают.','<b>Обложка или видеообложка</b> за текстом, а также твои эффект-клипы.']}},
  {id:'visualisierung',w:6,klein:{en:'Visualisations',de:'Visualisierer',ru:'Визуализации'},
   h:{en:'Light that listens.',de:'Licht, das zuhört.',ru:'Свет, который слушает.'},
   p:{en:'Seven of its own, plus Butterchurn.',de:'Sieben eigene, dazu Butterchurn.',ru:'Семь собственных и Butterchurn.'},
   zahl:{n:'333',t:{en:'MilkDrop presets',de:'MilkDrop-Presets',ru:'пресета MilkDrop'}},
   d:{en:['<b>Seven visualisations</b> built for KlangTresor.','<b>Butterchurn</b> brings the classic MilkDrop look with 333 presets.'],
      de:['<b>Sieben Visualisierer</b>, eigens für KlangTresor gebaut.','<b>Butterchurn</b> bringt den klassischen MilkDrop-Look mit 333 Presets.'],
      ru:['<b>Семь визуализаций</b>, созданных специально для KlangTresor.','<b>Butterchurn</b> — классический вид MilkDrop с 333 пресетами.']}}
  ]},
 {augenbraue:{en:'Sound studio',de:'Tonstudio',ru:'Звуковая студия'},
  h:{en:'A real studio.<br>In your browser.',de:'Ein echtes Studio.<br>Im Browser.',ru:'Настоящая студия.<br>В браузере.'},
  p:{en:'Equaliser with bell filters, compressor, boombox. One chain, in the order an engineer would build it. Plus room calibration at your listening spot.',de:'Equalizer mit Glockenstuhl, Kompressor, Ghettoblaster. Eine Kette in der Reihenfolge, in der ein Toningenieur sie baut. Dazu das Einmessen am Hörplatz.',ru:'Эквалайзер с колоколами, компрессор, бумбокс. Одна цепочка — в том порядке, в каком её строит звукоинженер. И калибровка на месте прослушивания.'},
  kacheln:[
  {id:'eq',w:5,oben:true,klein:{en:'8-band equaliser',de:'8-Band-Equalizer',ru:'8-полосный эквалайзер'},
   h:{en:'Eight bands. Your sound.',de:'Acht Bänder. Dein Klang.',ru:'Восемь полос. Твой звук.'},
   p:{en:'Start neutral, or let a song match the rest of your collection, its style group, its album or a reference song.',de:'Neutral beginnen oder einen Titel angleichen: an die Sammlung, an seine Stilgruppe, an sein Album oder an ein Klangvorbild.',ru:'Начни с нейтрали или подгони песню: под коллекцию, под её стилевую группу, под её альбом или под эталонную песню.'},
   d:{en:['<b>Every band shows its headroom.</b> The song itself decides how much a band can be raised.','<b>Matching</b> to collection, style group, album or reference is computed from the measured spectra.','<b>On the phone</b> as eight sliders with presets.'],
      de:['<b>Jedes Band zeigt seinen Spielraum.</b> Wie weit es sich anheben lässt, bestimmt der Titel selbst.','<b>Der Angleich</b> an Sammlung, Stilgruppe, Album oder Klangvorbild wird aus den gemessenen Frequenzprofilen berechnet.','<b>Auf dem Handy</b> als acht Regler mit Startwerten.'],
      ru:['<b>Каждая полоса показывает свой запас.</b> Насколько её можно поднять, решает сама песня.','<b>Подгонка</b> под коллекцию, стилевую группу, альбом или эталон рассчитывается по измеренным спектрам.','<b>На телефоне</b> — восемь ползунков с пресетами.']}},
  {id:'glockenstuhl',w:7,oben:true,klein:{en:'Bell frame',de:'Glockenstuhl',ru:'Колокольная рама'},
   h:{en:'Bells you can grab.',de:'Glocken zum Anfassen.',ru:'Колокола под рукой.'},
   p:{en:'Six bell filters, free in frequency, height and width, plus two shelves.',de:'Sechs Glockenfilter, frei in Frequenz, Höhe und Güte, dazu zwei Randfilter.',ru:'Шесть колокольных фильтров — свободно по частоте, высоте и ширине, плюс два полочных.'},
   d:{en:['<b>Drag a bell</b> to move it; the handles on its shoulders set its width.','<b>Single or stacked:</b> see each bell on its own, or how they add up.','<b>A notch</b> removes a single annoying frequency.'],
      de:['<b>Eine Glocke ziehen</b>, um sie zu verschieben; die Griffe an ihren Schultern stellen die Güte.','<b>Einzeln oder gestapelt:</b> jede Glocke für sich oder ihre Summe.','<b>Ein Kerbfilter</b> nimmt eine einzelne störende Frequenz heraus.'],
      ru:['<b>Перетащи колокол</b>, чтобы сдвинуть его; ручки на его плечах задают ширину.','<b>По отдельности или стопкой:</b> каждый колокол сам по себе или их сумма.','<b>Режекторный фильтр</b> убирает одну мешающую частоту.']}},
  {id:'kompressor',w:6,oben:true,klein:{en:'Compressor',de:'Kompressor',ru:'Компрессор'},
   h:{en:'Compressor. Or a gradation curve.',de:'Kompressor. Oder Gradationskurve.',ru:'Компрессор. Или градационная кривая.'},
   p:{en:'The classic knee with threshold, ratio and limiter, or a curve like in a photo editor: quiet point, loud point, gamma.',de:'Die klassische Knickkurve mit Schwelle, Verhältnis und Limiter oder eine Kurve wie im Bildprogramm: Leisepunkt, Lautpunkt, Gamma.',ru:'Классическое колено с порогом, соотношением и лимитером — или кривая, как в фоторедакторе: тихая точка, громкая точка, гамма.'},
   d:{en:['<b>Two modes, one stage:</b> compressor or gradation compressor, never both at once.','<b>The curve is drawn live</b>, with the gain reduction as it happens.','<b>Gamma or sigmoid</b> with a single slider, for those who think in pictures.'],
      de:['<b>Zwei Arten, eine Stufe:</b> Kompressor oder Gradationskompressor, nie beides zugleich.','<b>Die Kennlinie wird live gezeichnet</b>, mit der Absenkung in Echtzeit.','<b>Gamma oder S-Kurve</b> mit einem einzigen Regler, für alle, die in Bildern denken.'],
      ru:['<b>Два режима, одна ступень:</b> компрессор или градационный компрессор, никогда оба сразу.','<b>Кривая рисуется вживую</b>, вместе с текущим подавлением.','<b>Гамма или сигмоида</b> одним ползунком — для тех, кто мыслит картинками.']}},
  {id:'boombox',w:6,oben:true,klein:{en:'Boombox',de:'Ghettoblaster',ru:'Бумбокс'},
   h:{en:'One switch for everything.',de:'Ein Schalter für alles.',ru:'Один переключатель на всё.'},
   p:{en:'Loudness, more bass, more treble, clear voice, night mode. Plus MEGA BASS, reverb, echo and stereo width.',de:'Loudness, mehr Bass, mehr Höhen, Stimme frei, Nacht. Dazu MEGA BASS, Hall, Echo und Stereo-Breite.',ru:'Loudness, больше баса, больше высоких, чистый голос, ночной режим. А также MEGA BASS, реверберация, эхо и стереоширина.'},
   d:{en:['<b>Night mode</b> turns down bass and treble, above all the lows that travel through walls.','<b>Tempo</b> faster or slower, with or without keeping the pitch.','<b>A clip light</b> warns when everything together gets too loud.'],
      de:['<b>Nacht</b> nimmt Bass und Höhen zurück, vor allem die Tiefen, die durch Wände dringen.','<b>Tempo</b> schneller oder langsamer, wahlweise bei gleicher Tonhöhe.','<b>Die Lampe KAPPUNG</b> warnt, wenn alles zusammen zu laut wird.'],
      ru:['<b>Ночной режим</b> убирает басы и верха, прежде всего низы, которые проходят сквозь стены.','<b>Темп</b> быстрее или медленнее, с сохранением высоты тона или без.','<b>Индикатор перегрузки</b> предупреждает, когда всё вместе становится слишком громким.']}},
  {id:'einmessen',w:12,klein:{en:'Calibration',de:'Einmessen',ru:'Калибровка'},
   h:{en:'Measured in your room.',de:'Nachgemessen in deinem Raum.',ru:'Измерено в твоей комнате.'},
   p:{en:'The microphone of your computer measures your speakers where you sit. The spectrum shows the whole chain: what Suno delivered, and what your settings make of it.',de:'Das Mikrofon deines Rechners vermisst die Lautsprecher dort, wo du sitzt. Das Spektrum zeigt die ganze Kette: was Suno geliefert hat und was deine Einstellung daraus macht.',ru:'Микрофон компьютера измеряет колонки там, где ты сидишь. Спектр показывает всю цепочку: что выдал Suno и что из этого делают твои настройки.'},
   d:{en:['<b>Measured at the listening position</b>, not in a lab.','<b>Before and after</b> side by side in one spectrum.'],
      de:['<b>Gemessen am Hörplatz</b>, nicht im Labor.','<b>Vorher und nachher</b> nebeneinander in einem Spektrum.'],
      ru:['<b>Измерено на месте прослушивания</b>, а не в лаборатории.','<b>До и после</b> рядом в одном спектре.']}}
  ]},
 {augenbraue:{en:'Understand',de:'Verstehen',ru:'Понять'},
  h:{en:'Take a look inside your songs.',de:'Schau dir die Analyse deiner Titel an.',ru:'Загляни в анализ своих песен.'},
  p:{en:'Every song measured. The whole collection as a sky of stars.',de:'Jeder Titel vermessen. Der ganze Bestand als Sternenhimmel.',ru:'Каждая песня измерена. Вся коллекция — звёздное небо.'},
  kacheln:[
  {id:'klangraum',w:12,klein:{en:'Sound Space',de:'Klangraum',ru:'Пространство звука'},
   h:{en:'Your songs as a sky of stars, sorted by sound groups.',de:'Deine Titel als Sternenhimmel, sortiert nach Klanggruppen.',ru:'Твои песни — звёздное небо, по звуковым группам.'},
   p:{en:'Songs that sound alike become neighbours. Size, brightness and corona tell plays, hearts and comments.',de:'Was ähnlich klingt, wird Nachbar. Größe, Helligkeit und Korona zeigen Abrufe, Herzen und Kommentare.',ru:'Похожие по звуку песни становятся соседями. Размер, яркость и корона — прослушивания, лайки и комментарии.'},
   d:{en:['<b>Closeness is sound</b>, measured from the audio on your computer, in three dimensions.','<b>Fly from song to song</b> in a ship, a cube, a raven or a Martian saucer.'],
      de:['<b>Nähe heißt ähnlicher Klang</b>, auf deinem Rechner aus dem Ton gemessen, in drei Dimensionen.','<b>Von Titel zu Titel fliegen</b>, im Schiff, im Kubus, als Rabe oder in der Untertasse des Marsianers.'],
      ru:['<b>Близость — это звук</b>, измеренный по аудио на твоём компьютере, в трёх измерениях.','<b>Лети от песни к песне</b> — на корабле, в кубе, вороном или в тарелке марсианина.']}},
  {id:'messdaten',w:8,oben:true,klein:{en:'Analysis',de:'Analyse',ru:'Анализ'},
   h:{en:'Every song, measured.',de:'Jeder Titel vermessen.',ru:'Каждая песня — измерена.'},
   p:{en:'The structure from Suno’s sections, the beat grid, and where the peaks hit full scale or something cancels out in mono.',de:'Die Struktur aus Sunos Abschnitten, das Taktraster und wo die Spitzen an den Vollpegel stoßen oder sich in Mono etwas auslöscht.',ru:'Структура по разделам Suno, сетка ударов, и где пики упираются в полную шкалу или что-то гасится в моно.'},
   d:{en:['<b>The playhead</b> runs through all lanes, so every finding has its place in the song.','<b>Loudness targets for each platform:</b> Spotify, Apple Music, YouTube, club, broadcast.'],
      de:['<b>Der Spielkopf</b> läuft durch alle Bahnen. So hat jeder Befund seine Stelle im Titel.','<b>Lautheitsziele je Plattform:</b> Spotify, Apple Music, YouTube, Club, Rundfunk.'],
      ru:['<b>Курсор воспроизведения</b> проходит через все дорожки — у каждой находки своё место в песне.','<b>Цели громкости для каждой платформы:</b> Spotify, Apple Music, YouTube, клуб, радио.']}},
  {id:'messliste',w:4,klein:{en:'What is measured',de:'Was gemessen wird',ru:'Что измеряется'},
   h:{en:'Measured at home.',de:'Zu Hause gemessen.',ru:'Измерено дома.'},
   p:{en:'Computed on your computer for every song.',de:'Auf deinem Rechner, für jeden Titel.',ru:'На твоём компьютере, для каждой песни.'},
   d:{en:['<b>No upload:</b> the audio never leaves the house.'],de:['<b>Kein Hochladen:</b> Der Ton verlässt das Haus nicht.'],ru:['<b>Без загрузки:</b> звук не покидает дом.']}}
  ]},
 {augenbraue:{en:'Listeners',de:'Hörer',ru:'Слушатели'},
  h:{en:'Your music and your listeners.',de:'Deine Musik und deine Zuhörer.',ru:'Твоя музыка и твои слушатели.'},
  p:{en:'Which songs reach your listeners week by week.',de:'Welche Titel Woche für Woche bei den Hörern ankommen.',ru:'Какие песни доходят до слушателей неделя за неделей.'},
  kacheln:[
  {id:'profil',w:12,oben:true,klein:{en:'Hit stream',de:'Hitstrom',ru:'Поток хитов'},
   h:{en:'Week by week.',de:'Woche für Woche.',ru:'Неделя за неделей.'},
   p:{en:'The twelve songs with the most momentum, and their share of the attention each week.',de:'Die zwölf Titel mit dem meisten Aufwind und ihr Anteil an der Resonanz in jeder Woche.',ru:'Двенадцать самых активных песен и их доля отклика каждую неделю.'},
   d:{en:['<b>Weekly charts</b> of your own songs below it, by momentum, hearts and plays.'],de:['<b>Wöchentliche Hitparaden</b> deiner Titel darunter, nach Aufwind, Herzen und Abrufen.'],ru:['<b>Еженедельные хит-парады</b> твоих песен ниже — по динамике, лайкам и прослушиваниям.']}},
  {id:'groupie',w:6,oben:true,klein:{en:'Groupie foam',de:'Groupieschaum',ru:'Пена поклонников'},
   h:{en:'Every listener a cell.',de:'Jeder Hörer eine Zelle.',ru:'Каждый слушатель — ячейка.'},
   p:{en:'Everyone who gave you hearts or comments, with their avatar. Here sized by loyalty: from first to last reaction.',de:'Alle, die dir Herzen geschenkt oder Kommentare geschrieben haben, mit ihrem Avatar. Hier ist die Größe die Treue: die Zeit von der ersten bis zur letzten Reaktion.',ru:'Все, кто ставил тебе лайки или писал комментарии, со своим аватаром. Здесь по верности: от первой до последней реакции.'},
   d:{en:['<b>Other measures:</b> hearts, comments, length of comments, recent activity, number of songs.'],de:['<b>Weitere Maße:</b> Herzen, Kommentare, Länge der Kommentare, jüngste Aktivität, Zahl der Titel.'],ru:['<b>Другие меры:</b> лайки, комментарии, длина комментариев, недавняя активность, число песен.']}},
  {id:'nachbar',w:6,oben:true,klein:{en:'Neighbourhood',de:'Nachbarschaft',ru:'Окружение'},
   h:{en:'Where you stand.',de:'Wo du stehst.',ru:'Где ты находишься.'},
   p:{en:'Everyone around you who makes music: how many they follow and how many follow them. You in orange.',de:'Alle um dich herum, die selbst Musik machen: wie viele sie im Blick haben und wie viele Beobachter sie haben. Du in Orange.',ru:'Все вокруг тебя, кто сам делает музыку: на скольких они подписаны и сколько подписано на них. Ты выделен оранжевым.'},
   d:{en:['<b>Both axes are logarithmic.</b> On the line, following and followers balance.'],de:['<b>Beide Achsen sind logarithmisch.</b> Auf der Linie halten sich „im Blick“ und Beobachter die Waage.'],ru:['<b>Обе оси логарифмические.</b> На линии подписки и подписчики уравновешены.']}},
  {id:'gemein',w:12,oben:true,klein:{en:'Community',de:'Gemeinschaft',ru:'Сообщество'},
   h:{en:'Who is there for you.',de:'Wer für dich da ist.',ru:'Кто рядом с тобой.'},
   p:{en:'Who comments the most, who gives the most hearts, and both together. This month, this year, or all time.',de:'Wer am meisten kommentiert, wer die meisten Herzen gibt, und beides zusammen. Diesen Monat, dieses Jahr oder seit Beginn.',ru:'Кто больше всех комментирует, кто ставит больше всех лайков, и оба вместе. За месяц, за год или за всё время.'},
   d:{en:['<b>A click on a name</b> opens everything that person wrote to you.'],de:['<b>Ein Klick auf einen Namen</b> zeigt alles, was diese Person dir geschrieben hat.'],ru:['<b>Щелчок по имени</b> показывает всё, что этот человек тебе написал.']}}
  ]},
 {augenbraue:{en:'Your work as a picture',de:'Werk als Bild',ru:'Всё творчество — одной картиной'},
  h:{en:'Your whole work. One picture.',de:'Dein ganzes Werk. Ein Bild.',ru:'Всё творчество. Одна картина.'},
  p:{en:'As a picture wall with a timeline, or as a foam with a catalogue of works. As a PDF for the print shop.',de:'Als Bilderschau mit Zeitleiste oder als Schaum mit Werkverzeichnis. Als PDF für die Druckerei.',ru:'Как стена картин со шкалой времени или как пена с каталогом работ. В PDF для типографии.'},
  fahrt:['papier','papierdetail'], fahrtArt:'zoom', fahrtNach:'skizze',   // Feature-Seite: das Plakat bleibt stehen, das Scrollen zoomt in die Ecke
  kacheln:[
  {id:'klangschaum',w:12,oben:true,klein:{en:'Sound foam, picture wall',de:'Klangschaum, Bilderschau',ru:'Звуковая пена, стена картин'},
   h:{en:'Every song a cell.',de:'Jeder Titel eine Zelle.',ru:'Каждая песня — ячейка.'},
   p:{en:'Sized by plays, hearts or length. Or the covers hung like a salon exhibition.',de:'Die Größe folgt Abrufen, Herzen oder Länge. Oder die Titelbilder als Salonhängung.',ru:'Размер — по прослушиваниям, лайкам или длительности. Или обложки, развешенные как в салоне.'},
   d:{en:['<b>Grouped by album, genre or space</b>, coloured by group.','<b>Every song keeps its true area.</b> Zoom in until the smallest cell can be tapped.','<b>A tap plays the song.</b>'],
      de:['<b>Gegliedert nach Album, Genre oder Klanggruppe</b>, gefärbt nach Gruppe.','<b>Jeder Titel behält seine wahre Fläche.</b> Heranzoomen, bis auch die kleinste Zelle antippbar ist.','<b>Ein Tipp spielt den Titel.</b>'],
      ru:['<b>Группировка по альбому, жанру или пространству</b>, цвет — по группе.','<b>Каждая песня сохраняет истинную площадь.</b> Приблизь — и даже самую маленькую ячейку можно нажать.','<b>Касание запускает песню.</b>']}},
  {id:'zimmer',w:7,wFahrt:8,oben:true,klein:{en:'Poster studio',de:'Plakat-Studio',ru:'Студия плакатов'},
   h:{en:'Print it. Hang it.',de:'Drucken. Aufhängen.',ru:'Напечатай. Повесь.'},
   p:{en:'A PDF export ready for the print shop, from A3 to 100 × 140 cm, free formats up to 3 m. Here the picture show on paper, 100 × 60 cm, with its timeline.',de:'Ein PDF-Export, fertig für die Druckerei, von A3 bis 100 × 140 cm, freie Formate bis 3 m. Hier die Bilderschau auf Papier, 100 × 60 cm, mit ihrer Zeitleiste.',ru:'Экспорт в PDF, готовый для типографии, — от A3 до 100 × 140 см, свободные форматы до 3 м. Здесь стена картин на бумаге, 100 × 60 см, со шкалой времени.'},
   d:{en:['<b>Vector text</b>, images at print resolution, bleed included.','<b>Edition and signature line</b> for a numbered print.'],de:['<b>Schrift als Vektor</b>, Bilder in Druckauflösung, Beschnitt inklusive.','<b>Auflage und Platz für die Unterschrift</b> für einen nummerierten Druck.'],ru:['<b>Текст в векторе</b>, изображения в печатном разрешении, с вылетами.','<b>Тираж и линия для подписи</b> — для нумерованного оттиска.']}},
  {id:'papierdetail',w:5,oben:true,klein:{en:'Detail',de:'Ausschnitt',ru:'Фрагмент'},
   h:{en:'Readable to the last line.',de:'Lesbar bis zur letzten Zeile.',ru:'Читается до последней строки.'},
   p:{en:'Numbers in the cells, the same numbers in the list.',de:'Nummern in den Zellen, dieselben Nummern in der Liste.',ru:'Номера в ячейках — те же номера в списке.'},
   d:{en:['<b>Timeline</b>: one stroke per song on the day it was made.'],de:['<b>Zeitleiste</b>: ein Strich je Titel am Tag seiner Entstehung.'],ru:['<b>Шкала времени</b>: штрих для каждой песни в день её создания.']}},
  {id:'papier',w:8,oben:true,klein:{en:'Catalogue of works',de:'Werkverzeichnis',ru:'Каталог работ'},
   h:{en:'Every song with its number.',de:'Jeder Titel mit Nummer.',ru:'Каждая песня — со своим номером.'},
   p:{en:'The sound foam on paper, numbered, the full catalogue below.',de:'Der Klangschaum auf Papier, nummeriert, darunter das ganze Verzeichnis.',ru:'Звуковая пена на бумаге, с номерами, ниже — весь каталог.'},
   d:{en:['<b>Grouped by sound</b>, coloured by group, numbered area by area.'],de:['<b>Nach Klang gegliedert</b>, nach Gruppe gefärbt, Areal für Areal nummeriert.'],ru:['<b>По звучанию</b>, цвет по группе, нумерация по областям.']}},
  {id:'skizze',w:4,oben:true,klein:{en:'Sketchbook',de:'Skizzenbuch',ru:'Альбом эскизов'},
   h:{en:'In the manner of Leonardo.',de:'Im Stil Leonardos.',ru:'В манере Леонардо.'},
   p:{en:'The foam as pen drawings on parchment, with seal, studies and notes in the margin.',de:'Der Schaum als Federzeichnungen auf Pergament, mit Siegel, Studien und Randnotizen.',ru:'Пена как рисунки пером на пергаменте — с печатью, этюдами и заметками на полях.'},
   d:{en:['<b>One page of a sketchbook</b>: title, tabula, instrument studies, refrains.'],de:['<b>Eine Seite aus einem Skizzenbuch</b>: Titel, Tabula, Instrumentenstudien, Refrains.'],ru:['<b>Страница альбома</b>: заголовок, таблица, этюды инструментов, припевы.']}},
  {id:'vorlagen',w:12,oben:true,klein:{en:'Four looks',de:'Vier Anmutungen',ru:'Четыре стиля'},
   h:{en:'Gallery, paper, stained glass, mosaic.',de:'Galerie, Papier, Bleiglas, Mosaik.',ru:'Галерея, бумага, витраж, мозаика.'},
   p:{en:'Every detail adjustable afterwards: ground, joints, glass bands, shadow.',de:'Jede Feinheit lässt sich nachträglich einstellen: Grund, Fugen, Glasbänder, Schatten.',ru:'Затем настраивается каждая деталь: фон, швы, стеклянные полосы, тень.'},
   d:{en:['<b>Images for social media</b> in 4:5, 1:1 and story format.'],de:['<b>Bilder für soziale Medien</b> in 4:5, 1:1 und im Story-Format.'],ru:['<b>Изображения для соцсетей</b> в форматах 4:5, 1:1 и сторис.']}}
  ]},
 {augenbraue:{en:'Create',de:'Gestalten',ru:'Создавать'},
  h:{en:'From cover to clip.',de:'Vom Titelbild zum Clip.',ru:'От обложки к клипу.'},
  p:{en:'With the effect clip studio, a still picture becomes a moving clip for Suno.',de:'Mit dem Effektclip-Studio wird aus einem Standbild ein bewegter Clip für Suno.',ru:'В студии эффект-клипов неподвижная картинка становится движущимся клипом для Suno.'},
  fahrt:['okkultbild','okkulttiefe','effektclip'],   // Feature-Seite: eine stehende Kachel, das Scrollen führt durch die drei Stufen
  kacheln:[
  {id:'okkultbild',w:6,oben:true,klein:{en:'The picture',de:'Das Bild',ru:'Картинка'},
   h:{en:'A still cover.',de:'Ein unbewegtes Titelbild.',ru:'Неподвижная обложка.'},
   p:{en:'The starting point: the title picture of “Okkultation”.',de:'Der Ausgangspunkt: das Titelbild von „Okkultation“.',ru:'Отправная точка — титульная картинка «Okkultation».'},
   d:{en:['<b>Any picture works:</b> a cover or one of your own.'],de:['<b>Jedes Bild eignet sich:</b> ein Titelbild oder eigenes Bild.'],ru:['<b>Подходит любая картинка:</b> обложка или своя.']}},
  {id:'okkulttiefe',w:6,oben:true,klein:{en:'Depth map',de:'Tiefenkarte',ru:'Карта глубины'},
   h:{en:'Depth from a flat picture.',de:'Tiefe aus einem flachen Bild.',ru:'Глубина из плоской картинки.'},
   p:{en:'The software works out what is near and what is far. Bright is near.',de:'Die Software schätzt, was nah und was fern ist. Hell ist nah.',ru:'Программа оценивает, что близко, а что далеко. Светлое — близко.'},
   d:{en:['<b>Light, fog and focus</b> sit inside the scene instead of on top of it.'],de:['<b>Licht, Nebel und Schärfe</b> liegen in der Szene statt obendrauf.'],ru:['<b>Свет, туман и резкость</b> находятся внутри сцены, а не поверх неё.']}},
  {id:'effektclip',w:8,oben:true,klein:{en:'Effect clip studio',de:'Effektclip-Studio',ru:'Студия эффект-клипов'},
   h:{en:'Bring a cover to life.',de:'Ein Titelbild zum Leben erwecken.',ru:'Оживи обложку.'},
   p:{en:'Five effects, one of them a camera move, in time with the music. As a loop for Suno.',de:'Fünf Effekte, einer davon eine Kamerafahrt, im Takt der Musik. Als Schleife für Suno.',ru:'Пять эффектов, один из них — движение камеры, в такт музыке. Как петля для Suno.'},
   d:{en:['<b>A light mixing desk</b> drives spotlights, lasers and pulses to the beat.','<b>Ken Burns with parallax.</b>','<b>Export a 10-second loop</b> to upload to Suno as a moving cover.'],
      de:['<b>Ein Lichtmischpult</b> steuert Scheinwerfer, Laser und Pulse im Takt der Musik.','<b>Eine langsame Fahrt übers Bild</b> (Ken-Burns-Effekt), im Vorder- und Hintergrund verschieden schnell.','<b>Als 10-Sekunden-Schleife sichern</b> und bei Suno als Bewegtbild hochladen.'],
      ru:['<b>Световой пульт</b> управляет прожекторами, лазерами и импульсами по ритму.','<b>Кен Бёрнс с параллаксом.</b>','<b>Сохрани 10-секундную петлю</b> и загрузи её в Suno как видеообложку.']}},
  {id:'rezept',w:4,wFahrt:12,oben:true,klein:{en:'The recipe',de:'Die Effektkette',ru:'Рецепт'},
   h:{en:'Five effects.',de:'Fünf Effekte.',ru:'Пять эффектов.'},
   p:{en:'Five out of 35 studio effects with 309 settings in all.',de:'Fünf aus 35 Studioeffekten mit zusammen 309 Einstellungen.',ru:'Пять из 35 студийных эффектов, всего 309 настроек.'},
   d:{en:['<b>Saved with the song</b> and repainted at any time.'],de:['<b>Für diesen Titel gesichert</b> und jederzeit neu gemalt.'],ru:['<b>Хранится вместе с песней</b> и перерисовывается в любой момент.']}},
  ]},
 {augenbraue:{en:'On the sofa',de:'Auf dem Sofa',ru:'На диване'},
  h:{en:'Lean back with KlangTresor.',de:'Entspannen mit KlangTresor.',ru:'Отдыхай с KlangTresor.'},
  p:{en:'On the phone it becomes a music app. On the TV it becomes a stage.',de:'Auf dem Handy wird es zur Musik-App. Auf dem Fernseher zur Bühne.',ru:'На телефоне — музыкальное приложение. На телевизоре — сцена.'},
  kacheln:[
  {id:'abend',w:12,oben:true,klein:{en:'In the living room',de:'Im Wohnzimmer',ru:'В гостиной'},
   h:{en:'Lean back and listen.',de:'Zurücklehnen und hören.',ru:'Откинься и слушай.'},
   p:{en:'The vault runs at home. You listen wherever it is cosy.',de:'Der Tresor läuft zu Hause. Gehört wird, wo es gemütlich ist.',ru:'Сейф работает дома. Слушаешь там, где уютно.'},
   d:{en:['<b>Any phone in the home network</b> opens it in the browser, no app to install.'],de:['<b>Jedes Handy im Heimnetz</b> öffnet ihn im Browser, ohne App-Installation.'],ru:['<b>Любой телефон в домашней сети</b> открывает его в браузере, без установки приложения.']}},
  {id:'handys',w:12,oben:true,klein:{en:'Phone',de:'Handy',ru:'Телефон'},
   h:{en:'Made for one hand.',de:'Gemacht für eine Hand.',ru:'Создано для одной руки.'},
   p:{en:'Overview, stage, lyrics, Sound Space, foam, details and profile, in portrait or landscape.',de:'Übersicht, Bühne, Liedtexte, Klangraum, Schaum, Details und Profil, hochkant oder quer.',ru:'Обзор, сцена, тексты, звуковое пространство, пена, подробности и профиль — вертикально или горизонтально.'},
   d:{en:['<b>Everything else waits behind “⋯”:</b> shuffle, repeat, volume, equaliser, details.','<b>Sound, effect clip and poster studio</b> want a big screen and a mouse: any laptop in the home network.'],
      de:['<b>Alles Weitere wartet hinter „⋯“:</b> Zufall, Wiederholen, Lautstärke, Equalizer, Details.','<b>Ton-, Effektclip- und Plakat-Studio</b> brauchen einen großen Bildschirm und eine Maus. Dafür taugt jeder Laptop im Heimnetz.'],
      ru:['<b>Всё остальное — за «⋯»:</b> случайный порядок, повтор, громкость, эквалайзер, подробности.','<b>Звуковой студии, студиям эффект-клипов и плакатов</b> нужен большой экран и мышь: подойдёт любой ноутбук в домашней сети.']}},
  {id:'fernseher',w:12,oben:true,klein:{en:'TV',de:'Fernseher',ru:'Телевизор'},
   h:{en:'The stage, big.',de:'Die Bühne, groß.',ru:'Сцена — крупно.'},
   p:{en:'Mirror phone, tablet or laptop to the TV, and the lyrics run along.',de:'Handy, Tablet oder Laptop auf den Fernseher spiegeln, und der Liedtext läuft mit.',ru:'Выведи телефон, планшет или ноутбук на телевизор — и текст песни идёт вместе с музыкой.'},
   d:{en:['<b>The TV needs AirPlay or Google Cast:</b> say an Apple TV, a Chromecast or a TV that has one of them built in.','<b>In landscape the stage fills the screen</b> and the controls fade away.','<b>Karaoke readable from across the room.</b>'],
      de:['<b>Der Fernseher braucht AirPlay oder Google Cast:</b> etwa ein Apple TV, einen Chromecast oder einen Fernseher, der eins davon kann.','<b>Im Querformat füllt die Bühne den Schirm</b>, die Knöpfe werden ausgeblendet.','<b>Karaoke lesbar quer durchs Zimmer.</b>'],
      ru:['<b>Телевизору нужен AirPlay или Google Cast:</b> например, Apple TV, Chromecast или телевизор, который умеет одно из них.','<b>В горизонтальном режиме сцена занимает весь экран</b>, кнопки исчезают.','<b>Караоке читается через всю комнату.</b>']}},
  ]},
 {augenbraue:{en:'Stays yours',de:'Bleibt deins',ru:'Остаётся твоим'},
  h:{en:'A folder. Yours.',de:'Ein Ordner. Deiner.',ru:'Папка. Твоя.'},
  p:{en:'Back it up, move it, update the program. The archive stays.',de:'Sichern, umziehen, Programm aktualisieren. Das Archiv bleibt.',ru:'Сохрани, перенеси, обнови программу. Архив остаётся.'},
  kacheln:[
  {id:'sichern',w:8,oben:true,klein:{en:'Export',de:'Exportieren',ru:'Экспорт'},
   h:{en:'On a stick. For the car too.',de:'Auf einen Stick. Auch fürs Auto.',ru:'На флешку. И для машины.'},
   p:{en:'Your vault to take along: a frozen archive for playing, without the WAV originals. Double-click its start script and it runs on another Mac or Windows PC. Plus a Music folder: MP3s named by title, cover in the file, for car radio, TV and VLC.',de:'Dein Tresor zum Mitnehmen: ein eingefrorenes Archiv zum Abspielen, ohne die WAV-Originale. Doppelklick auf sein Startskript, und es läuft auf einem anderen Mac oder Windows-PC. Dazu ein Musikordner: MP3s nach Titel benannt, mit Titelbild in der Datei, für Autoradio, Fernseher und VLC.',ru:'Твой сейф с собой: замороженный архив для прослушивания, без оригиналов WAV. Двойной щелчок по скрипту запуска — и он работает на другом Mac или Windows-ПК. И папка «Musik»: MP3 по названиям, с обложкой в файле — для автомагнитолы, телевизора и VLC.'},
   d:{en:['<b>In stages:</b> the program and your newest songs first, instrument tracks last.','<b>Stop early</b> and you still have something to show.'],
      de:['<b>In Stufen:</b> erst das Programm und deine neuesten Titel, die Instrumentspuren zuletzt.','<b>Früh abbrechen</b>, und du hast trotzdem etwas Vorzeigbares.'],
      ru:['<b>По ступеням:</b> сначала программа и новые песни, инструментальные дорожки — в конце.','<b>Прервёшь раньше</b> — всё равно будет что показать.']}},
  {id:'offen',w:4,klein:{en:'Open source',de:'Quelloffen',ru:'Открытый код'},
   h:{en:'Free. MIT.',de:'Frei. MIT-Lizenz.',ru:'Свободно. MIT.'},
   p:{en:'On GitHub. A bell tells you when an update is out.',de:'Auf GitHub. Ein Hinweis meldet, wenn eine neue Fassung da ist.',ru:'На GitHub. Колокольчик сообщает о выходе обновления.'},
   d:{en:['<b>Updating replaces the program</b>, never your archive.','<b>German, English, Russian.</b>','<b>Third-party parts keep their own licences.</b> The AI models for musical style are for non-commercial use only; details in web/fremd/LIZENZEN.md.'],
      de:['<b>Aktualisieren ersetzt das Programm</b>, nie dein Archiv.','<b>Deutsch, Englisch, Russisch.</b>','<b>Fremde Bausteine behalten ihre eigenen Lizenzen.</b> Die KI-Modelle zur Musikstil-Erkennung sind nur für nicht kommerzielle Nutzung frei; Einzelheiten in web/fremd/LIZENZEN.md.'],
      ru:['<b>Обновление заменяет программу</b>, но не архив.','<b>Немецкий, английский, русский.</b>','<b>Сторонние компоненты сохраняют свои лицензии.</b> Модели ИИ для определения музыкального стиля — только для некоммерческого использования; подробности в web/fremd/LIZENZEN.md.']}}
  ]}
 ],
 /* Soundtrack: die vier Songs über KlangTresor; Bild = erstes Bild des Bewegtbild-Covers (trägt den Titel) */
 lieder:{
  augenbraue:{en:'Soundtrack',de:'Soundtrack',ru:'Саундтрек'},
  h:{en:'Four songs about KlangTresor.',de:'Vier Lieder über KlangTresor.',ru:'Четыре песни о KlangTresor.'},
  p:{en:'By Caspar_D, made with Suno.',de:'Von Caspar_D, gemacht mit Suno.',ru:'От Caspar_D, сделано в Suno.'},
  hoeren:{en:'Listen on Suno',de:'Bei Suno anhören',ru:'Слушать в Suno'},
  liste:[
   {t:'KlangTresor', bild:'img/lied-1.webp', url:'https://suno.com/song/47dfffbc-4c16-41f5-ae0e-a07278afcf39', dauer:'4:14', stil:{en:'Neue Deutsche Härte',de:'Neue Deutsche Härte',ru:'Neue Deutsche Härte'}},
   {t:'KlangTresor – ClubMix', bild:'img/lied-2.webp', url:'https://suno.com/song/e55a2590-18bf-461a-9bde-fddb1434ad44', dauer:'5:11', stil:{en:'Melodic hard trance',de:'Melodic Hard Trance',ru:'Мелодичный хард-транс'}},
   {t:'KlangTresor – SchneeMix', bild:'img/lied-3.webp', url:'https://suno.com/song/b6ca4dc6-7c79-4f27-b3e4-ed722f2281bd', dauer:'4:08', stil:{en:'Synth-pop',de:'Synthpop',ru:'Синти-поп'}},
   {t:'KlangTresor – Снег по кнопке', bild:'img/lied-4.webp', url:'https://suno.com/song/f3f3f9b8-4116-4025-8643-faff6b860fdd', dauer:'4:06', stil:{en:'Synth-pop, in Russian',de:'Synthpop, auf Russisch',ru:'Синти-поп, на русском'}}
  ]
 },
 grenzen:{
  h:{en:'Good to know',de:'Gut zu wissen',ru:'Полезно знать'},
  l:{en:['KlangTresor does not make music. Songs are made on Suno; KlangTresor keeps and shows them.','It only fetches your own songs, with your own Suno login.','When Suno changes its website, the morning run may need an update. Everything already at home stays playable.'],
     de:['KlangTresor macht keine Musik. Titel entstehen bei Suno; KlangTresor bewahrt und zeigt sie.','Es holt nur deine eigenen Titel, mit deiner eigenen Suno-Anmeldung.','Ändert Suno seine Seite, braucht der Morgenlauf womöglich eine neue Fassung. Alles, was schon zu Hause ist, bleibt spielbar.'],
     ru:['KlangTresor не создаёт музыку. Песни делаются в Suno; KlangTresor их хранит и показывает.','Он забирает только твои песни — с твоим входом в Suno.','Если Suno изменит сайт, утреннему запуску может понадобиться обновление. Всё, что уже дома, продолжает играть.']}
 },
 fuss:{en:'KlangTresor is free software by Caspar_D with Tarja, Casto and Henry · github.com/CasparDavi/klangtresor',
       de:'KlangTresor ist freie Software von Caspar_D mit Tarja, Casto und Henry · github.com/CasparDavi/klangtresor',
       ru:'KlangTresor — свободная программа Caspar_D при участии Tarja, Casto и Henry · github.com/CasparDavi/klangtresor'},
 stern:{en:'',de:'',ru:'* Русский текст — машинный перевод, ещё не проверенный носителем языка.'}
};

const BV = '67';   // Bildstand: hochzählen, wenn Bilder ersetzt werden (sonst zeigt der Browser alte)
const BILDER = Object.fromEntries(['titel','morgenlauf','buehne','visualisierung',
  'klangschaum','plakat','sichern','leser','tablet','fernseher','laptop'].map(id => [id, `img/${id}.webp?v=${BV}`]));
BILDER.effektclip = 'img/okkult-clip.mp4?v=' + BV;
BILDER.okkultbild = `img/okkult-bild.webp?v=${BV}`;
BILDER.okkulttiefe = `img/okkult-tiefe.webp?v=${BV}`;
const POSTER = { effektclip: BILDER.okkultbild };   // Standbild, solange ein Video (noch) nicht läuft; erstes Bild des Clips = Cover
BILDER.rezept = { liste: [
  { k:{en:'Flock',de:'Schwarm',ru:'Стая'}, w:{en:['Sixty dark birds, each dodging its neighbours, all following a wandering centre and respecting the depth map'],de:['Sechzig dunkle Vögel, jeder weicht seinen Nachbarn aus, alle folgen einer wandernden Mitte und beachten die Tiefenkarte'],ru:['Шестьдесят тёмных птиц: каждая уклоняется от соседей, все следуют за блуждающим центром и учитывают карту глубины']} },
  { k:{en:'Dust',de:'Staub',ru:'Пыль'}, w:{en:['240 bright motes rising, laid over the picture as light'],de:['240 helle Teilchen steigen auf, als Licht über das Bild gelegt'],ru:['240 светлых пылинок поднимаются вверх, наложены на картинку как свет']} },
  { k:{en:'Colour veil',de:'Farbschleier',ru:'Цветовая вуаль'}, w:{en:['Palette “Ash”, colour dodge at ten percent'],de:['Palette „Asche“, farbig abgewedelt mit zehn Prozent'],ru:['Палитра «Пепел», осветление основы на десять процентов']} },
  { k:{en:'Colour channel pulse',de:'Farbkanal-Puls',ru:'Пульсация цветовых каналов'}, w:{en:['Red, green and blue shift slightly apart on the beat'],de:['Rot, Grün und Blau werden im Beat leicht gegeneinander verschoben'],ru:['Красный, зелёный и синий слегка смещаются друг относительно друга в такт']} },
  { k:{en:'Ken Burns move',de:'Ken Burns Fahrt',ru:'Эффект Кена Бёрнса'}, w:{en:['To the sun, the refinery and across the harbour, with depth of field from the depth map'],de:['Zur Sonne, zur Raffinerie und über den Hafen, mit Tiefenschärfe aus der Tiefenkarte'],ru:['К солнцу, к заводу и над гаванью, с глубиной резкости по карте глубины']} },
] };
const TEMPO = {};   // Abspielgeschwindigkeit je Clip. Okkultation laeuft halb so schnell, aber als eigene Fassung mit Zwischenbildern (sonst nur 15 Bilder/s)
const NUR_TEXT = new Set(['einmessen','offen']);   // Kacheln, die ohne Bild stehen
/* Die Startmeldung, wie server.js sie druckt - in der Sprache des Systems (bin/texte/server.json). Die Zeile
   „KlangTresor auf http://…" bleibt in jeder Sprache deutsch: die Startskripte auf dem Stick lesen sie. Unten angeschnitten. */
// Die Projektangabe im Fuß wird überall anklickbar (Seite und PDF).
const GH = 'github.com/CasparDavi/klangtresor';
const ghLink = (s) => s.replace(GH, `<a class="gh" href="https://${GH}">${GH}</a>`);
const KONSOLE = {
  de: ['KlangTresor läuft', 'Auf diesem Mac', 'Im Heimnetz (en0)', 'Katalog geladen: 268 Songs', '268 Songs im Katalog.', 'Beenden mit Strg+C'],
  en: ['KlangTresor is running', 'On this Mac', 'In the home network (en0)', 'Catalogue loaded: 268 songs', '268 songs in the catalogue.', 'Quit with Ctrl+C'],
  ru: ['KlangTresor работает', 'На этом Mac', 'В домашней сети (en0)', 'Каталог загружен: песен — 268', 'Песен в каталоге: 268.', 'Выход: Ctrl+C'] };
const konsole = (L) => { const k = KONSOLE[L]; return ['$ ./starten-macos.command', '', '  ' + k[0], '', '  KlangTresor auf http://localhost:8788',
  `  ${k[1]}:  http://localhost:8788`, `  ${k[2]}:  http://192.168.178.21:8788`, '  ' + k[3], '', '  ' + k[4], '', '  ' + k[5]]; };
BILDER.server = { konsole: true };
BILDER.leser = { sprachen: { de: `img/geraete-de.webp?v=${BV}`, en: `img/geraete-en.webp?v=${BV}` } };
for (const n of ['eq','glockenstuhl','kompressor','boombox']) BILDER[n] = { sprachen: { de: `img/${n}-de.webp?v=${BV}`, en: `img/${n}-en.webp?v=${BV}` } };
for (const n of ['groupie','gemein']) BILDER[n] = { sprachen: { de: `img/${n}-de.webp?v=${BV}`, en: `img/${n}-en.webp?v=${BV}` } };
/* Nachbarschaft neu gezeichnet (SVG, Variante C: dunkel, nach Dichte gegluht, die 20 bekanntesten beschriftet) */
BILDER.nachbar = { sprachen: { de: `img/nachbar-de.webp?v=${BV}`, en: `img/nachbar-en.webp?v=${BV}`, ru: `img/nachbar-ru.webp?v=${BV}` } };
BILDER.profil = { sprachen: { de: `img/hitstrom-de.webp?v=${BV}`, en: `img/hitstrom-en.webp?v=${BV}` } };
BILDER.zimmer = { sprachen: { de: `img/zimmer-de.webp?v=${BV}`, en: `img/zimmer-en.webp?v=${BV}` } };
BILDER.papier = { sprachen: { de: `img/papier-de.webp?v=${BV}`, en: `img/papier-en.webp?v=${BV}` } };
BILDER.papierdetail = { sprachen: { de: `img/papier-detail-de.webp?v=${BV}`, en: `img/papier-detail-en.webp?v=${BV}` } };
BILDER.skizze = { sprachen: { de: `img/skizze-de.webp?v=${BV}`, en: `img/skizze-en.webp?v=${BV}` } };
BILDER.vorlagen = { sprachen: { de: `img/vorlagen-de.webp?v=${BV}`, en: `img/vorlagen-en.webp?v=${BV}` } };
BILDER.klangraum = { sprachen: { de: `img/himmel-de.webp?v=${BV}`, en: `img/himmel-en.webp?v=${BV}` } };
BILDER.messdaten = { sprachen: { de: `img/mess-de.webp?v=${BV}`, en: `img/mess-en.webp?v=${BV}` } };
BILDER.messliste = { liste: [
  { k:{en:'Level and loudness',de:'Pegel und Lautheit',ru:'Уровень и громкость'}, w:{en:['Loudness by EBU R128','True peak (from the WAV)','Loudness range','Distance to platform targets'],de:['Lautheit nach EBU R128','Wahrer Spitzenpegel (aus dem WAV)','Lautheitsumfang','Abstand zu den Zielen der Plattformen'],ru:['Громкость по EBU R128','Истинный пик (по WAV)','Диапазон громкости','Отклонение от целей платформ']} },
  { k:{en:'Form',de:'Form',ru:'Форма'}, w:{en:['Structure from Suno’s sections','Beat grid and BPM','Envelope'],de:['Struktur aus Sunos Abschnitten','Taktraster und BPM','Hüllkurve'],ru:['Структура по разделам Suno','Сетка ударов и BPM','Огибающая']} },
  { k:{en:'Stereo',de:'Stereo',ru:'Стерео'}, w:{en:['Phase','Partial cancellation','Width'],de:['Phase','Teilweise Auslöschung','Breite'],ru:['Фаза','Частичное гашение','Ширина']} },
  { k:{en:'Sound',de:'Klang',ru:'Звук'}, w:{en:['Key','Vocal range','Upper frequency limit','Interfering frequencies'],de:['Tonart','Stimmumfang','Obere Frequenzgrenze','Störfrequenzen'],ru:['Тональность','Вокальный диапазон','Верхняя граница частот','Мешающие частоты']} },
  { k:{en:'Tracks',de:'Spuren',ru:'Дорожки'}, w:{en:['Six instrument tracks','Word timing with Whisper'],de:['Sechs Instrumentspuren','Wortzeiten mit Whisper'],ru:['Шесть инструментальных дорожек','Тайминг слов с Whisper']} } ] };
BILDER.uebersicht = { sprachen: { de: `img/uebersicht-de.webp?v=${BV}`, en: `img/uebersicht-en.webp?v=${BV}` } };
/* Wonach gefiltert und sortiert wird - Wortlaut aus ui-sprache.js / ui-sprache-ru.js (filter.*). Die Stimme fehlt: die App bietet
   sie nicht an, solange der Index keine Werte hat. */
BILDER.filtern = { liste: [
  { k:{en:'In the search field',de:'Im Suchfeld',ru:'В поле поиска'}, w:{en:['Title','Style','Lyrics'],de:['Titel','Stil','Liedtext'],ru:['Название','Стиль','Текст']} },
  { k:{en:'As a tag',de:'Als Marke',ru:'Как метка'}, w:{en:['Year','Month','Since','Until','Model','Origin','Commented by','Missing: WAV, timestamps, analysis, comments, lyrics'],
      de:['Jahr','Monat','Seit','Bis','Modell','Entstehung','Kommentiert von','Fehlt: WAV, Zeitmarken, Analyse, Kommentare, Lyrics'],
      ru:['Год','Месяц','С','По','Модель','Происхождение','Автор комментария','Отсутствует: WAV, временные метки, анализ, комментарии, текст песни']} },
  { k:{en:'Choices',de:'Auswahl',ru:'Выбор'}, w:{en:['With / without motion artwork','Public / private / both','Model'],de:['Mit / ohne Bewegtbild','Öffentlich / privat / beides','Modell'],ru:['С / без анимированной обложки','Публичные / приватные / все','Модель']} },
  { k:{en:'Sort',de:'Sortieren',ru:'Сортировка'}, w:{en:['Newest','Oldest','Most plays','Most hearts','Most comments','Title A–Z','Longest','Fastest','Loudest','Most dynamic','Widest loudness range','Widest stereo'],
      de:['Neueste','Älteste','Meiste Abrufe','Meiste Herzen','Meiste Kommentare','Titel A–Z','Längste','Schnellste','Lauteste','Dynamischste','Größte Schwankung','Breitestes Stereo'],
      ru:['Новые','Старые','Больше прослушиваний','Больше лайков','Больше комментариев','По названию А–Я','Длинные','Быстрые','Громкие','Динамичные','Шире диапазон громкости','Шире стерео']} } ] };
/* Das Schaubild: kein Bild, sondern Text - scharf und in jeder Sprache. Der rote Knopf ist der Morgenknopf der App (immer rot). */
BILDER.schaubild = { schaubild: {
  links:  { en:'From Suno', de:'Von Suno', ru:'Из Suno' },
  rechts: { en:'Computed at home', de:'Bei dir gerechnet', ru:'Рассчитано дома' },
  knopf:  { en:'Morning run', de:'Morgenlauf', ru:'Утренний запуск' },
  von: { en:['MP3 and WAV','Cover and moving cover','Lyrics and style','Playlists and albums','Plays, hearts, comments','<i>private songs via the bookmark</i>'],
         de:['MP3 und WAV','Cover und Bewegtbild','Liedtext und Stil','Playlists und Alben','Abrufe, Herzen, Kommentare','<i>private Titel übers Lesezeichen</i>'],
         ru:['MP3 и WAV','Обложка и видеообложка','Текст и стиль','Плейлисты и альбомы','Прослушивания, лайки, комментарии','<i>приватные песни через закладку</i>'] },
  bei: { en:['Loudness by EBU R128','Key and vocal range','Six instrument tracks','Word timing with Whisper','Depth maps of the covers','<i>Sound Space and sound foam</i>'],
         de:['Lautheit nach EBU R128','Tonart und Stimmumfang','Sechs Instrumentspuren','Wortzeiten mit Whisper','Tiefenkarten der Cover','<i>Klangraum und Klangschaum</i>'],
         ru:['Громкость по EBU R128','Тональность и вокальный диапазон','Шесть инструментальных дорожек','Тайминг слов с Whisper','Карты глубины обложек','<i>Пространство звука и звуковая пена</i>'] } } };
BILDER.morgenlauf = { sprachen: { de: `img/morgenlauf-de.webp?v=${BV}`, en: `img/morgenlauf-en.webp?v=${BV}` } };   /* Szene von Caspar_D (KI) */   /* Szene von Caspar_D (KI), die drei Aufnahmen perspektivisch eingesetzt */
/* Russische Aufnahmen, wo es sie gibt (Text im Bild); sonst faellt Russisch auf Englisch zurueck */
for (const [k, d] of [['gemein','gemein'],['skizze','skizze'],['profil','hitstrom'],['papier','papier'],['papierdetail','papier-detail'],['uebersicht','uebersicht'],['morgenlauf','morgenlauf']]) BILDER[k].sprachen.ru = `img/${d}-ru.webp?v=${BV}`;
const FORMAT = { klangschaum: '2360/1327', fernseher: '3/2', sichern: '1672/941', abend: '3/2', handys: '2438/852', zimmer: '2360/1588', papier: '4000/2862', papierdetail: '1180/1129', skizze: '1180/1756', vorlagen: '4/1', profil: '2360/677', groupie: '1180/826', nachbar: '1180/826', gemein: '2360/775', klangraum: '2360/1109', messdaten: '1560/1024', eq: '980/656', glockenstuhl: '1380/648', kompressor: '1180/335', boombox: '1180/335', uebersicht: '1920/1400', leser: '3/2', morgenlauf: '1607/979', buehne: '1/1', visualisierung: '1/1' };   /* Kacheln, deren Bild ein eigenes Seitenverhaeltnis hat */
BILDER.abend = `img/abend.webp?v=${BV}`;
BILDER.fernseher = { sprachen: { de: `img/tanz-de.webp?v=${BV}`, en: `img/tanz-en.webp?v=${BV}` } };
BILDER.visualisierung = { sprachen: { de: `img/visualisierung-de.webp?v=${BV}`, en: `img/visualisierung-en.webp?v=${BV}` } };
BILDER.buehne = { sprachen: { de: `img/buehne-de.webp?v=${BV}`, en: `img/buehne-en.webp?v=${BV}` } };
BILDER.sichern = `img/auto.webp?v=${BV}`;
BILDER.handys = { sprachen: { de: `img/handys-de.webp?v=${BV}`, en: `img/handys-en.webp?v=${BV}` } };
