/* KlangTresor — Erststart-Heft: DIE EINE TEXTQUELLE.
   Muster von docs/features/inhalt.js: jeder Text steht genau einmal, als
   {de, en, ru}. Der Seitenplan (heft.html) enthaelt nur Layout und
   Schluessel. Russisch nach docs/ru/PRAVILA.md: Vy-Form, Imperativ auf
   -ите, «ёлочки», закладка / трек / лайки / Подписчики wie in der App.
   Erzeugt am 19.11.2026; Henry hat die russischen Saetze noch nicht gesehen.
   Alle Bilder stammen aus einem echten Lauf, nie gestellt; Kontonamen sind
   weichgezeichnet, damit niemand sie abtippt. */
window.HEFT = {
  marke: 'KlangTresor',
  schritte: [0,1,2,3,4,5,6].map(n => ({ nr: String(n), kurz: 'kurz'+n, lang: 'lang'+n, satz: 'satz'+n })),
  systeme: [
    { datei: 'KlangTresor-Setup.exe',       name: 'sys_win',   text: 'sys_win_t' },
    { datei: 'KlangTresor.dmg',             name: 'sys_mac',   text: 'sys_mac_t' },
    { datei: 'KlangTresor-x86_64.AppImage', name: 'sys_linux', text: 'sys_linux_t' },
  ],
  warnschritte: ['warn1','warn2','warn3','warn4'],
  legschritte:  ['leg1','leg2','leg3','leg4'],
  gruppen: [['g1k','g1t'],['g2k','g2t'],['g3k','g3t']],
  T: {
 "titel_notiz_kopf": {
  "de": "Wenn etwas anders aussieht",
  "en": "If something looks different",
  "ru": "Если что-то выглядит иначе"
 },
 "titel_notiz": {
  "de": "Dann gilt, was die App sagt — sie kennt ihre eigene Fassung. KlangTresor wächst; die Schritte bleiben dieselben, die Beschriftungen können wandern.",
  "en": "Then what the app says applies — it knows its own version. KlangTresor keeps growing; the steps stay the same, the labels may move.",
  "ru": "Тогда действует то, что говорит приложение, — оно знает свою версию. KlangTresor развивается: шаги остаются прежними, подписи могут смещаться."
 },
 "eyebrow": {
  "de": "KlangTresor — Erster Kontakt",
  "en": "KlangTresor — First contact",
  "ru": "KlangTresor — Первый контакт"
 },
 "titel": {
  "de": "Von der Installation<br>zum gefüllten Tresor",
  "en": "From installing<br>to a full archive",
  "ru": "От установки<br>до полного архива"
 },
 "untertitel": {
  "de": "Sechs Schritte. Was du drückst, steht im Bild.",
  "en": "Six steps. What to press is marked in the picture.",
  "ru": "Шесть шагов. Что нажимать — отмечено на картинке."
 },
 "erststart": {
  "de": "Erststart",
  "en": "First start",
  "ru": "Первый запуск"
 },
 "bu_readme": {
  "de": "Dort liegen die drei Dateien — eine je System.",
  "en": "That is where the three files are — one per system.",
  "ru": "Там лежат три файла — по одному на каждую систему."
 },
 "karte_kopf": {
  "de": "Der ganze Weg auf einen Blick",
  "en": "The whole way at a glance",
  "ru": "Весь путь с одного взгляда"
 },
 "karte_fuss": {
  "de": "Die Schritte 0 bis 2 bringen alles, was auf deiner Suno-Profilseite öffentlich steht. Die Schritte 3 bis 5 holen, was nur du sehen darfst. Schritt 6 ist der Alltag danach. Nach Schritt 2 kannst du schon hören — alles Weitere geht auch später.",
  "en": "Steps 0 to 2 bring everything that is public on your Suno profile page. Steps 3 to 5 fetch what only you may see. Step 6 is the daily routine after that. After step 2 you can already listen — everything else can wait.",
  "ru": "Шаги с 0 по 2 приносят всё, что открыто на вашей странице профиля Suno. Шаги с 3 по 5 загружают то, что видите только вы. Шаг 6 — повседневный порядок. После шага 2 уже можно слушать, остальное можно сделать и позже."
 },
 "kurz0": {
  "de": "Installieren",
  "en": "Install",
  "ru": "Установка"
 },
 "kurz1": {
  "de": "Einrichtung",
  "en": "Setup",
  "ru": "Настройка"
 },
 "kurz2": {
  "de": "Erster Blick",
  "en": "First look",
  "ru": "Первый взгляд"
 },
 "kurz3": {
  "de": "Anlegen",
  "en": "Create",
  "ru": "Создать"
 },
 "kurz4": {
  "de": "Benutzen",
  "en": "Use",
  "ru": "Применить"
 },
 "kurz5": {
  "de": "Übernehmen",
  "en": "Take over",
  "ru": "Обновить"
 },
 "kurz6": {
  "de": "Jeden Morgen",
  "en": "Every morning",
  "ru": "Каждое утро"
 },
 "lang0": {
  "de": "Installieren",
  "en": "Install",
  "ru": "Установка"
 },
 "lang1": {
  "de": "Einrichtung",
  "en": "Setup",
  "ru": "Настройка"
 },
 "lang2": {
  "de": "Erster Blick",
  "en": "First look",
  "ru": "Первый взгляд"
 },
 "lang3": {
  "de": "Lesezeichen anlegen",
  "en": "Create the bookmark",
  "ru": "Создать закладку"
 },
 "lang4": {
  "de": "Lesezeichen benutzen",
  "en": "Use the bookmark",
  "ru": "Применить закладку"
 },
 "lang5": {
  "de": "Übernehmen",
  "en": "Take it over",
  "ru": "Обновить библиотеку"
 },
 "lang6": {
  "de": "Jeden Morgen",
  "en": "Every morning",
  "ru": "Каждое утро"
 },
 "satz0": {
  "de": "Eine Datei laden und öffnen. Dein System fragt einmal nach.",
  "en": "Download one file and open it. Your system asks once.",
  "ru": "Скачайте один файл и откройте его. Система спросит один раз."
 },
 "satz1": {
  "de": "Elf Schritte im Browser, zwei Fragen an dich.",
  "en": "Eleven steps in the browser, two questions for you.",
  "ru": "Одиннадцать шагов в браузере, два вопроса вам."
 },
 "satz2": {
  "de": "Der Tresor ist gefüllt. Du kannst hören.",
  "en": "The archive is filled. You can listen.",
  "ru": "Архив заполнен. Можно слушать."
 },
 "satz3": {
  "de": "Einmalig: das Lesezeichen in Chrome anlegen.",
  "en": "Once: create the bookmark in Chrome.",
  "ru": "Один раз: создайте закладку в Chrome."
 },
 "satz4": {
  "de": "Zwei Reiter im selben Chrome, bei Suno angemeldet.",
  "en": "Two tabs in the same Chrome, signed in to Suno.",
  "ru": "Две вкладки в одном Chrome, с выполненным входом в Suno."
 },
 "satz5": {
  "de": "Der rote Knopf holt alles herein und rechnet.",
  "en": "The red button brings it all in and computes.",
  "ru": "Красная кнопка забирает всё и считает."
 },
 "satz6": {
  "de": "Zwei Handgriffe, immer in dieser Reihenfolge.",
  "en": "Two moves, always in this order.",
  "ru": "Два действия, всегда в этом порядке."
 },
 "s0_kopf": {
  "de": "Herunterladen und öffnen",
  "en": "Download and open",
  "ru": "Скачать и открыть"
 },
 "s0_vor": {
  "de": "Für jedes System eine Datei. Mehr brauchst du nicht — kein Terminal, keine Vorbereitung, keine Verwalterrechte.",
  "en": "One file per system. That is all — no terminal, no preparation, no administrator rights.",
  "ru": "По одному файлу на каждую систему. Больше ничего не нужно — ни терминала, ни подготовки, ни прав администратора."
 },
 "sys_win": {
  "de": "Windows 10 und 11",
  "en": "Windows 10 and 11",
  "ru": "Windows 10 и 11"
 },
 "sys_win_t": {
  "de": "Herunterladen, doppelklicken. KlangTresor landet in deinem Benutzerordner.",
  "en": "Download, double-click. KlangTresor lands in your user folder.",
  "ru": "Скачайте и кликните дважды. KlangTresor окажется в вашей папке пользователя."
 },
 "sys_mac": {
  "de": "macOS 11 oder neuer",
  "en": "macOS 11 or newer",
  "ru": "macOS 11 и новее"
 },
 "sys_mac_t": {
  "de": "Öffnen, KlangTresor in <i>Programme</i> ziehen, von dort starten.",
  "en": "Open it, drag KlangTresor into <i>Applications</i>, start it from there.",
  "ru": "Откройте, перетащите KlangTresor в <i>Программы</i> и запустите оттуда."
 },
 "sys_linux": {
  "de": "Linux (x86_64)",
  "en": "Linux (x86_64)",
  "ru": "Linux (x86_64)"
 },
 "sys_linux_t": {
  "de": "Rechtsklick → Eigenschaften → <i>Als Programm ausführen</i>, dann doppelklicken.",
  "en": "Right-click → Properties → <i>Run as a program</i>, then double-click.",
  "ru": "Правый клик → Свойства → <i>Запускать как программу</i>, затем двойной клик."
 },
 "wo_kopf": {
  "de": "Wo die Dateien liegen",
  "en": "Where the files are",
  "ru": "Где лежат файлы"
 },
 "wo": {
  "de": "Alle drei unter <code>github.com/CasparDavi/klangtresor</code> bei <i>Releases</i>, immer in der jüngsten Fassung. KlangTresor legt sich danach in einen Ordner <code>KlangTresor</code> in deinem Benutzerverzeichnis — nicht ins System, nicht in die Registry.",
  "en": "All three at <code>github.com/CasparDavi/klangtresor</code> under <i>Releases</i>, always the latest version. KlangTresor then puts itself into a folder <code>KlangTresor</code> in your user directory — not into the system, not into the registry.",
  "ru": "Все три — на <code>github.com/CasparDavi/klangtresor</code> в разделе <i>Releases</i>, всегда последняя версия. KlangTresor размещается в папке <code>KlangTresor</code> в вашем каталоге пользователя — не в системе и не в реестре."
 },
 "admin_kopf": {
  "de": "Nicht als Verwalter starten",
  "en": "Do not run as administrator",
  "ru": "Не запускайте от имени администратора"
 },
 "admin": {
  "de": "KlangTresor braucht keine erhöhten Rechte, und sie schaden sogar: Was dann angelegt wird, gehört dem Verwalter, und dein eigenes Konto kommt an sein Archiv nicht mehr heran. Also normal doppelklicken — nicht über „Als Administrator ausführen\".",
  "en": "KlangTresor needs no elevated rights, and they even do harm: whatever is created then belongs to the administrator, and your own account can no longer reach its archive. So just double-click — not via “Run as administrator”.",
  "ru": "KlangTresor не нужны повышенные права, и они даже вредят: созданное так принадлежит администратору, и ваша учётная запись больше не доберётся до своего архива. Поэтому просто кликните дважды — без «Запуск от имени администратора»."
 },
 "platz_kopf": {
  "de": "Platz auf der Platte",
  "en": "Disk space",
  "ru": "Место на диске"
 },
 "platz": {
  "de": "Rund 5 GB für Programm und KI-Modelle, dazu etwa 15 MB je Titel — mit WAV-Originalen etwa 70 MB.",
  "en": "About 5 GB for the program and the AI models, plus about 15 MB per song — with WAV originals about 70 MB.",
  "ru": "Около 5 GB на программу и модели ИИ, плюс примерно 15 MB на трек — с оригиналами WAV около 70 MB."
 },
 "braucht_kopf": {
  "de": "Was es braucht",
  "en": "What it needs",
  "ru": "Что нужно"
 },
 "braucht": {
  "de": "Einen 64-Bit-Rechner mit Windows 10 oder 11, macOS 11 oder neuer, oder Linux x86_64. Für den vollen Umfang <b>Google Chrome</b>; zum Hören genügt jeder Browser, auch auf Handy, Tablet und Fernseher im selben WLAN.",
  "en": "A 64-bit computer with Windows 10 or 11, macOS 11 or newer, or Linux x86_64. For the full range <b>Google Chrome</b>; for listening any browser will do, on a phone, a tablet or a TV in the same network.",
  "ru": "64-разрядный компьютер с Windows 10 или 11, macOS 11 и новее либо Linux x86_64. Для полного набора возможностей — <b>Google Chrome</b>; чтобы слушать, подойдёт любой браузер, в том числе на телефоне, планшете и телевизоре в той же сети."
 },
 "ohne_kopf": {
  "de": "Was nicht gebraucht wird",
  "en": "What is not needed",
  "ru": "Что не нужно"
 },
 "ohne": {
  "de": "Kein Konto außer deinem Suno-Login, keine Cloud, keine Datenbank, kein Python, kein Docker. Node.js und ffmpeg bringt die Einrichtung selbst mit — du mußt nichts vorbereiten.",
  "en": "No account except your Suno login, no cloud, no database, no Python, no Docker. The setup brings Node.js and ffmpeg itself — you do not have to prepare anything.",
  "ru": "Никаких учётных записей, кроме входа в Suno, ни облака, ни базы данных, ни Python, ни Docker. Node.js и ffmpeg настройка приносит сама — готовить ничего не нужно."
 },
 "s0_warn_kopf": {
  "de": "Dein System warnt — einmal, und das ist richtig so",
  "en": "Your system warns you — once, and rightly so",
  "ru": "Система предупредит — один раз, и это правильно"
 },
 "s0_warn": {
  "de": "KlangTresor ist nicht signiert: ein Zertifikat kostet jährlich Geld, und das Programm wird verschenkt. Dein System kennt es deshalb noch nicht und fragt nach. Die Stellen, an denen du klickst:",
  "en": "KlangTresor is not signed: a certificate costs money every year, and the program is given away. Your system therefore does not know it yet and asks. The places where you click:",
  "ru": "KlangTresor не подписан: сертификат стоит денег каждый год, а программа раздаётся бесплатно. Поэтому система её ещё не знает и спрашивает. Места, куда нужно нажать:"
 },
 "warn1": {
  "de": "<b>Windows, beim Herunterladen:</b> „… wird häufig nicht heruntergeladen\" — auf die drei Punkte <b>…</b> daneben, dann <b>Behalten</b>.",
  "en": "<b>Windows, while downloading:</b> “… is not commonly downloaded” — click the three dots <b>…</b> next to it, then <b>Keep</b>.",
  "ru": "<b>Windows, при скачивании:</b> «… скачивается редко» — нажмите три точки <b>…</b> рядом, затем <b>Сохранить</b>."
 },
 "warn2": {
  "de": "<b>Windows, die Rückfrage:</b> „Trotzdem behalten\" ist kein eigener Knopf — es steckt hinter dem <b>kleinen Pfeil ˅ neben „Löschen\"</b>.",
  "en": "<b>Windows, the follow-up:</b> “Keep anyway” is not a button of its own — it hides behind the <b>small arrow ˅ next to “Delete”</b>.",
  "ru": "<b>Windows, повторный вопрос:</b> «Всё равно сохранить» — не отдельная кнопка: она скрыта за <b>маленькой стрелкой ˅ рядом с «Удалить»</b>."
 },
 "warn3": {
  "de": "<b>Windows, beim Öffnen:</b> „Der Computer wurde durch Windows geschützt\" → <b>Weitere Informationen</b> → <b>Trotzdem ausführen</b>.",
  "en": "<b>Windows, when opening:</b> “Windows protected your PC” → <b>More info</b> → <b>Run anyway</b>.",
  "ru": "<b>Windows, при открытии:</b> «Система Windows защитила ваш компьютер» → <b>Подробнее</b> → <b>Выполнить в любом случае</b>."
 },
 "warn4": {
  "de": "<b>macOS:</b> Systemeinstellungen → Datenschutz &amp; Sicherheit → <b>Dennoch öffnen</b>.",
  "en": "<b>macOS:</b> System Settings → Privacy &amp; Security → <b>Open Anyway</b>.",
  "ru": "<b>macOS:</b> Системные настройки → Конфиденциальность и безопасность → <b>Всё равно открыть</b>."
 },
 "bu_weitere": {
  "de": "Erst <b>Weitere Informationen</b> …",
  "en": "First <b>More info</b> …",
  "ru": "Сначала <b>Подробнее</b> …"
 },
 "bu_trotzdem": {
  "de": "… dann erscheint <b>Trotzdem ausführen</b>.",
  "en": "… then <b>Run anyway</b> appears.",
  "ru": "… затем появится <b>Выполнить в любом случае</b>."
 },
 "s0_ende": {
  "de": "Danach geht von selbst ein Fenster im Browser auf. Dort läuft alles Weitere.",
  "en": "After that a window opens in the browser by itself. Everything else happens there.",
  "ru": "После этого браузер откроется сам. Всё остальное происходит там."
 },
 "s1_kopf": {
  "de": "Die Einrichtung läuft im Browser",
  "en": "The setup runs in the browser",
  "ru": "Настройка идёт в браузере"
 },
 "s1_vor": {
  "de": "Elf Schritte, und du beantwortest genau <b>zwei Fragen</b>. Alles andere holt KlangTresor selbst: ffmpeg, die KI-Modelle, Whisper. Links siehst du immer, wo du stehst.",
  "en": "Eleven steps, and you answer exactly <b>two questions</b>. KlangTresor fetches everything else itself: ffmpeg, the AI models, Whisper. On the left you always see where you are.",
  "ru": "Одиннадцать шагов, и вы отвечаете ровно на <b>два вопроса</b>. Всё остальное KlangTresor загружает сам: ffmpeg, модели ИИ, Whisper. Слева всегда видно, на каком вы шаге."
 },
 "s1_f1_kopf": {
  "de": "Die erste Frage: dein Suno-Name",
  "en": "The first question: your Suno name",
  "ru": "Первый вопрос: ваше имя в Suno"
 },
 "s1_f1": {
  "de": "Gemeint ist der Name hinter dem <code>@</code> in der Adresse deiner Profilseite — bei <code>suno.com/@maxmuster</code> also <code>maxmuster</code>. <b>Nicht</b> deine E-Mail-Adresse und <b>nicht</b> der Anzeigename über deinen Liedern: der darf Leerzeichen und Großbuchstaben haben, der Suno-Name nicht. Eintippen, <b>Weiter</b>. KlangTresor ruft deine Profilseite dann auf wie jeder Besucher: lesend, ohne Passwort, ohne Anmeldung.",
  "en": "This means the name after the <code>@</code> in the address of your profile page — with <code>suno.com/@johndoe</code> that is <code>johndoe</code>. <b>Not</b> your email address and <b>not</b> the display name above your songs: that one may contain spaces and capital letters, the Suno name may not. Type it in, <b>Next</b>. KlangTresor then opens your profile page like any visitor: reading only, no password, no sign-in.",
  "ru": "Имеется в виду имя после <code>@</code> в адресе вашей страницы профиля — у <code>suno.com/@maxmuster</code> это <code>maxmuster</code>. <b>Не</b> адрес электронной почты и <b>не</b> отображаемое имя над вашими треками: в нём могут быть пробелы и заглавные буквы, а в имени Suno — нет. Впишите его и нажмите <b>Далее</b>. KlangTresor откроет вашу страницу профиля как любой посетитель: только чтение, без пароля и без входа."
 },
 "bu_name": {
  "de": "Links die Schrittliste — abgehakt, was fertig ist. Orange umrandet: das Feld und <b>Weiter</b>.",
  "en": "On the left the list of steps — ticked off what is done. Outlined in orange: the field and <b>Next</b>.",
  "ru": "Слева список шагов — отмечено то, что готово. Оранжевой рамкой: поле и <b>Далее</b>."
 },
 "geholt_kopf": {
  "de": "Was dabei geholt wird",
  "en": "What is fetched",
  "ru": "Что при этом загружается"
 },
 "geholt": {
  "de": "Alles, was ein Besucher deiner Profilseite ohnehin sieht: Titel, Liedtexte, Stile, Alben, Abrufe, Herzen, die Zahl der Kommentare. Kein Passwort, keine Anmeldung, nur Lesen — und in eine Richtung: Nach Suno geht nichts zurück.",
  "en": "Everything a visitor to your profile page sees anyway: titles, lyrics, styles, albums, plays, likes, the number of comments. No password, no sign-in, reading only — and one way: nothing goes back to Suno.",
  "ru": "Всё, что и так видит посетитель вашей страницы: названия, тексты, стили, альбомы, прослушивания, лайки, число комментариев. Без пароля, без входа, только чтение — и в одну сторону: обратно в Suno не уходит ничего."
 },
 "s1_f2_kopf": {
  "de": "Die zweite Frage: wo deine Suno-Dateien liegen",
  "en": "The second question: where your Suno files are",
  "ru": "Второй вопрос: где лежат ваши файлы Suno"
 },
 "bu_ordner": {
  "de": "Orange umrandet: <b>Ja</b> öffnet das Ordnerfenster, <b>Nein</b> geht weiter.",
  "en": "Outlined in orange: <b>Yes</b> opens the folder window, <b>No</b> moves on.",
  "ru": "Оранжевой рамкой: <b>Да</b> открывает окно выбора папки, <b>Нет</b> идёт дальше."
 },
 "s1_f2": {
  "de": "Suno gibt die Audiodateien seit dem 03.09.2026 nicht mehr über Links heraus — auch dem Besitzer nicht. Wer seine Lieder früher heruntergeladen hat, hat sie aber noch. In deinen Download- und Musikordnern sieht KlangTresor von selbst nach. Liegen sie woanders — Sicherung, externe Platte —, dann <b>Ja</b>, und es geht ein Fenster auf, in dem du den Ordner wählst.",
  "en": "Since 3 September 2026 Suno no longer hands out the audio files through links — not even to their owner. But whoever downloaded their songs earlier still has them. KlangTresor looks in your download and music folders by itself. If they are elsewhere — a backup, an external drive — then <b>Yes</b>, and a window opens in which you choose the folder.",
  "ru": "С 03.09.2026 Suno больше не отдаёт аудиофайлы по ссылкам — даже владельцу. Но у того, кто скачивал свои треки раньше, они остались. В папках загрузок и музыки KlangTresor смотрит сам. Если они лежат в другом месте — в резервной копии, на внешнем диске, — нажмите <b>Да</b>, и откроется окно выбора папки."
 },
 "inhalt_kopf": {
  "de": "Erkannt am Inhalt, nicht am Namen",
  "en": "Recognised by content, not by name",
  "ru": "Опознаются по содержимому, а не по имени"
 },
 "s1_f2_merk": {
  "de": "Erkannt wird am <b>Inhalt</b>, nie am Dateinamen: Suno schreibt eine Kennung in den Kopf jeder Datei. Umbenannte werden gefunden, deine übrige Musik bleibt unberührt. Nichts wird verschoben und nichts gelöscht, nur kopiert.",
  "en": "Recognition goes by <b>content</b>, never by file name: Suno writes an identifier into the header of every file. Renamed files are found, the rest of your music stays untouched. Nothing is moved and nothing is deleted, only copied.",
  "ru": "Опознание идёт по <b>содержимому</b>, а не по имени файла: Suno записывает метку в заголовок каждого файла. Переименованные находятся, остальная ваша музыка остаётся нетронутой. Ничего не перемещается и не удаляется — только копируется."
 },
 "warten_kopf": {
  "de": "Du mußt nicht warten",
  "en": "You do not have to wait",
  "ru": "Ждать не обязательно"
 },
 "s1_dauer": {
  "de": "Der längste Schritt sind die Titelbilder. Du mußt ihn nicht abwarten — „Jetzt in den KlangTresor\" lädt im Hintergrund weiter. Abbrechen ist überall erlaubt: beim nächsten Start geht es von diesem Stand weiter, nichts wird doppelt geholt und nichts überschrieben.",
  "en": "The longest step is the cover art. You do not have to wait for it — “Into KlangTresor now” keeps loading in the background. Cancelling is allowed everywhere: the next start continues from this point, nothing is fetched twice and nothing is overwritten.",
  "ru": "Самый долгий шаг — обложки. Ждать его не нужно: «Перейти в KlangTresor» продолжит загрузку в фоне. Прерывать можно в любом месте: при следующем запуске всё продолжится с этого состояния, ничто не загружается дважды и ничто не перезаписывается."
 },
 "s1_spaeter_kopf": {
  "de": "Wenn du diesen Schritt übersprungen hast",
  "en": "If you skipped this step",
  "ru": "Если вы пропустили этот шаг"
 },
 "s1_spaeter": {
  "de": "Dann fragt die App später danach: oben rechts der rote Knopf, und im Fenster steht das Feld gleich oben. Dort sind es <b>zwei</b> Schritte, und der zweite wird leicht übersehen: <b>Prüfen</b> fragt nur bei Suno nach, ob es den Namen gibt. Gespeichert wird er erst, wenn du darunter <b>Das bin ich</b> drückst.",
  "en": "Then the app asks for it later: the red button at the top right, and in the window the field is right at the top. There it takes <b>two</b> steps, and the second is easily missed: <b>Check</b> only asks Suno whether the name exists. It is saved only when you press <b>That’s me</b> below it.",
  "ru": "Тогда приложение спросит позже: красная кнопка справа вверху, и поле в окне — сразу наверху. Там <b>два</b> шага, и второй легко не заметить: «Проверить» только спрашивает у Suno, есть ли такое имя. Сохраняется оно лишь после нажатия «Это я» под ним."
 },
 "bu_namensfeld": {
  "de": "Erst <b>Prüfen</b> — dann erscheint dein Profil. Gespeichert ist der Name erst nach <b>Das bin ich</b>. Der Name im Bild ist unkenntlich gemacht.",
  "en": "First <b>Check</b> — then your profile appears. The name is saved only after <b>That’s me</b>. The name in the picture has been blurred.",
  "ru": "Сначала «Проверить» — появится ваш профиль. Имя сохраняется только после «Это я». Имя на картинке размыто."
 },
 "s1_spaeter_warn": {
  "de": "Solange der Name nicht gespeichert ist, findet der rote Knopf nichts zu holen und bricht ab. Die Meldung sagt dir dann, daß der Name fehlt — nicht, daß etwas kaputt ist.",
  "en": "As long as the name is not saved, the red button finds nothing to fetch and stops. The message then tells you that the name is missing — not that something is broken.",
  "ru": "Пока имя не сохранено, красной кнопке нечего загружать, и она останавливается. Сообщение тогда говорит, что не хватает имени, — а не что что-то сломалось."
 },
 "firewall_kopf": {
  "de": "Windows fragt nach der Firewall",
  "en": "Windows asks about the firewall",
  "ru": "Windows спросит про брандмауэр"
 },
 "firewall": {
  "de": "Sobald der Server startet, will Windows wissen, ob „Node.js JavaScript Runtime\" ins Netzwerk darf. Damit auch Handy und Fernseher im WLAN an den Tresor kommen: Haken bei <b>Private Netzwerke</b>, Haken bei <b>Öffentliche</b> weg, dann <b>Zugriff zulassen</b>. Wer nur am eigenen Rechner hören will, klickt <b>Abbrechen</b> — KlangTresor läuft trotzdem.",
  "en": "As soon as the server starts, Windows wants to know whether “Node.js JavaScript Runtime” may use the network. So that phone and TV in the same network reach the archive too: tick <b>Private networks</b>, untick <b>Public</b>, then <b>Allow access</b>. Whoever only wants to listen on their own computer clicks <b>Cancel</b> — KlangTresor runs anyway.",
  "ru": "Как только сервер запустится, Windows спросит, можно ли «Node.js JavaScript Runtime» в сеть. Чтобы телефон и телевизор в той же сети тоже доставали до архива: поставьте галочку у <b>Частные сети</b>, снимите у <b>Общедоступные</b>, затем <b>Разрешить доступ</b>. Кто хочет слушать только на своём компьютере, нажимает <b>Отмена</b> — KlangTresor всё равно работает."
 },
 "s2_kopf": {
  "de": "Fertig — und was jetzt noch fehlt",
  "en": "Done — and what is still missing",
  "ru": "Готово — и чего пока не хватает"
 },
 "s2_vor": {
  "de": "Der Tresor ist gefüllt: deine Titel, Texte, Stile, Alben, Bilder. Du kannst hören. Was fehlt, ist das, was auf deiner Profilseite <b>nicht</b> öffentlich steht.",
  "en": "The archive is filled: your songs, lyrics, styles, albums, pictures. You can listen. What is missing is what is <b>not</b> public on your profile page.",
  "ru": "Архив заполнен: ваши треки, тексты, стили, альбомы, изображения. Можно слушать. Не хватает того, что на вашей странице профиля <b>не</b> открыто всем."
 },
 "bu_schluss": {
  "de": "Die letzte Seite der Einrichtung zählt auf, was ohne deine Anmeldung <b>nicht</b> zu holen war — und sagt, wo es weitergeht.",
  "en": "The last page of the setup lists what could <b>not</b> be fetched without your sign-in — and says where to go on.",
  "ru": "Последняя страница настройки перечисляет то, что <b>не</b> удалось получить без вашего входа, — и говорит, куда идти дальше."
 },
 "s2_adresse_kopf": {
  "de": "Wo KlangTresor jetzt liegt",
  "en": "Where KlangTresor is now",
  "ru": "Где теперь KlangTresor"
 },
 "s2_adresse": {
  "de": "Auf diesem Rechner unter <code>http://localhost:8788</code>. Vom Handy, Tablet oder Fernseher im selben WLAN unter der Adresse mit den Zahlen — <i>Profil → Aufs Handy</i> zeigt sie mit QR-Code. KlangTresor läuft als Symbol in Taskleiste, Dock oder Panel.",
  "en": "On this computer at <code>http://localhost:8788</code>. From a phone, tablet or TV in the same network at the address with the numbers — <i>Profile → To the phone</i> shows it with a QR code. KlangTresor runs as an icon in the task bar, the dock or the panel.",
  "ru": "На этом компьютере по адресу <code>http://localhost:8788</code>. С телефона, планшета или телевизора в той же сети — по адресу с цифрами: <i>Профиль → На телефон</i> показывает его вместе с QR-кодом. KlangTresor работает как значок в панели задач, в доке или на панели."
 },
 "s2_ton_kopf": {
  "de": "Wenn kein Ton da ist",
  "en": "If there is no audio",
  "ru": "Если аудио нет"
 },
 "s2_ton": {
  "de": "Sind alle Titel da, aber keine Audiodatei, geht von selbst ein Fenster auf. Es nimmt deinen Sicherungsordner noch einmal entgegen — derselbe Weg wie in der Einrichtung. Später findest du ihn unter <i>Profil → Kontingent</i>.",
  "en": "If all the songs are there but no audio file is, a window opens by itself. It takes your backup folder once more — the same way as in the setup. Later you find it under <i>Profile → Allowance</i>.",
  "ru": "Если все треки на месте, а аудиофайлов нет, окно откроется само. Оно ещё раз примет вашу папку с резервными копиями — тем же путём, что и в настройке. Позже она находится в разделе <i>Профиль → Лимит</i>."
 },
 "s2_weiter": {
  "de": "Für alles Weitere brauchst du <b>Chrome</b>. Die nächsten drei Schritte macht man einmal; danach ist es ein Klick am Tag.",
  "en": "For everything else you need <b>Chrome</b>. The next three steps are done once; after that it is one click a day.",
  "ru": "Для всего дальнейшего нужен <b>Chrome</b>. Следующие три шага делаются один раз, после этого — один клик в день."
 },
 "s3_kopf": {
  "de": "Das Lesezeichen in Chrome anlegen",
  "en": "Creating the bookmark in Chrome",
  "ru": "Создание закладки в Chrome"
 },
 "s3_warum_kopf": {
  "de": "Warum überhaupt ein Lesezeichen",
  "en": "Why a bookmark at all",
  "ru": "Зачем вообще закладка"
 },
 "s3_warum": {
  "de": "Deine unveröffentlichten Titel, deine privaten Alben, wer dich geherzt und kommentiert hat, die Wort-Zeitmarken fürs Karaoke — das alles gibt Suno nur heraus, wer angemeldet ist. Der Ausweis dafür lebt etwa eine Minute und gehört dem Browser und der Adresse suno.com. KlangTresor bekommt ihn nicht und <b>soll</b> ihn nicht bekommen: So liegt auf deiner Platte kein Schlüssel zu deinem Suno-Konto. Darum sitzt das Werkzeug als Lesezeichen dort, wo du ohnehin angemeldet bist.",
  "en": "Your unreleased songs, your private albums, who liked and commented on your work, the word timestamps for karaoke — Suno hands all of that only to someone who is signed in. The pass for it lives about a minute and belongs to the browser and the address suno.com. KlangTresor does not get it and <b>must not</b> get it: that way there is no key to your Suno account on your disk. This is why the tool sits as a bookmark where you are signed in anyway.",
  "ru": "Ваши неопубликованные треки, ваши приватные альбомы, кто ставил лайки и писал комментарии, пословные временные метки для караоке — всё это Suno отдаёт только тому, кто вошёл в аккаунт. Пропуск для этого живёт около минуты и принадлежит браузеру и адресу suno.com. KlangTresor его не получает и <b>не должен</b> получать: так на вашем диске нет ключа к вашему аккаунту Suno. Поэтому инструмент работает закладкой там, где вы и так вошли."
 },
 "s3_hol_kopf": {
  "de": "Die Adresse holen",
  "en": "Getting the address",
  "ru": "Получить адрес"
 },
 "s3_hol": {
  "de": "Im KlangTresor oben rechts auf den <b>roten Knopf</b>. Im Fenster, das aufgeht, ganz unten der orange Kasten „Willst Du auch die nur Dir zugänglichen Daten im KlangTresor sehen?\". Dort steht die Adresse, und daneben <b>Kopieren</b>.",
  "en": "In KlangTresor click the <b>red button</b> at the top right. In the window that opens, at the very bottom, the orange box “Do you also want to see the data only you can access in KlangTresor?”. The address is there, with <b>Copy</b> next to it.",
  "ru": "В KlangTresor нажмите <b>красную кнопку</b> справа вверху. В открывшемся окне, в самом низу, — оранжевый блок «Хотите видеть в KlangTresor и данные, доступные только вам?». Там и стоит адрес, а рядом — <b>Копировать</b>."
 },
 "bu_lesezeichen": {
  "de": "Der orange Kasten im Morgenfenster. Rechts neben der Adresse sitzt <b>Kopieren</b>.",
  "en": "The orange box in the morning window. <b>Copy</b> sits to the right of the address.",
  "ru": "Оранжевый блок в окне обновления. Справа от адреса — <b>Копировать</b>."
 },
 "s3_leg_kopf": {
  "de": "Das Lesezeichen anlegen — so geht es sicher",
  "en": "Creating the bookmark — the way that works",
  "ru": "Как создать закладку, чтобы она работала"
 },
 "s3_leg": {
  "de": "Ein vorhandenes Lesezeichen umzuschreiben funktioniert <b>nicht</b>: Chrome streicht beim Einfügen das <code>javascript:</code> am Anfang weg. Lege ein <b>neues</b> an:",
  "en": "Rewriting an existing bookmark does <b>not</b> work: when pasting, Chrome strips the <code>javascript:</code> at the start. Create a <b>new</b> one:",
  "ru": "Переписать уже существующую закладку <b>не получится</b>: при вставке Chrome убирает <code>javascript:</code> в начале. Создайте <b>новую</b>:"
 },
 "leg1": {
  "de": "Lesezeichen-Manager öffnen: <b>Strg+Umschalt+O</b> (Windows und Linux) oder <b>⌘⇧O</b> (Mac).",
  "en": "Open the bookmark manager: <b>Ctrl+Shift+O</b> (Windows and Linux) or <b>⌘⇧O</b> (Mac).",
  "ru": "Откройте диспетчер закладок: <b>Ctrl+Shift+O</b> (Windows и Linux) или <b>⌘⇧O</b> (Mac)."
 },
 "leg2": {
  "de": "Oben rechts die <b>drei Punkte ⋮</b> → <b>Neues Lesezeichen hinzufügen</b>.",
  "en": "At the top right the <b>three dots ⋮</b> → <b>Add new bookmark</b>.",
  "ru": "Справа вверху <b>три точки ⋮</b> → <b>Добавить закладку</b>."
 },
 "leg3": {
  "de": "Name: <code>KlangTresor morgens</code>. In das Adressfeld die kopierte Adresse einfügen.",
  "en": "Name: <code>KlangTresor morgens</code>. Paste the copied address into the address field.",
  "ru": "Имя: <code>KlangTresor morgens</code>. В поле адреса вставьте скопированный адрес."
 },
 "leg4": {
  "de": "<b>Nachsehen:</b> Fängt die Adresse wirklich mit <code>javascript:</code> an? Wenn nicht, die fehlenden elf Zeichen von Hand davorsetzen.",
  "en": "<b>Check:</b> does the address really start with <code>javascript:</code>? If not, type the missing eleven characters in front of it.",
  "ru": "<b>Проверьте:</b> действительно ли адрес начинается с <code>javascript:</code>? Если нет, впишите недостающие одиннадцать символов вручную."
 },
 "bu_chrome": {
  "de": "Chromes Lesezeichen-Manager. Oben rechts die <b>drei Punkte ⋮</b> — dahinter liegt <i>Neues Lesezeichen hinzufügen</i>.",
  "en": "Chrome’s bookmark manager (shown in German). At the top right the <b>three dots ⋮</b> — behind them is <i>Add new bookmark</i>.",
  "ru": "Диспетчер закладок Chrome (на снимке — по-немецки). Справа вверху <b>три точки ⋮</b> — за ними <i>Добавить закладку</i>."
 },
 "schief_kopf": {
  "de": "Das ist die Stelle, an der es schiefgeht",
  "en": "This is where it goes wrong",
  "ru": "Вот где обычно ломается"
 },
 "schief": {
  "de": "Wer ein vorhandenes Lesezeichen umschreibt, bekommt ein Lesezeichen, das nichts tut: Chrome entfernt beim Einfügen das <code>javascript:</code> am Anfang. Deshalb ein neues anlegen — und danach nachsehen, ob die elf Zeichen wirklich davorstehen.",
  "en": "Whoever rewrites an existing bookmark gets a bookmark that does nothing: when pasting, Chrome removes the <code>javascript:</code> at the start. So create a new one — and afterwards check that the eleven characters are really in front.",
  "ru": "Кто переписывает существующую закладку, получает закладку, которая ничего не делает: при вставке Chrome убирает <code>javascript:</code> в начале. Поэтому создайте новую — и затем проверьте, что эти одиннадцать символов действительно на месте."
 },
 "wsl_kopf": {
  "de": "Unter WSL",
  "en": "Under WSL",
  "ru": "В WSL"
 },
 "s3_wsl": {
  "de": "Läuft der Server in der Linux-Umgebung, muß auch Chrome dort laufen. Ein unter Windows gestarteter Chrome findet den Server nicht — alles andere funktioniert, nur das Lesezeichen nicht.",
  "en": "If the server runs in the Linux environment, Chrome has to run there too. A Chrome started under Windows does not find the server — everything else works, only the bookmark does not.",
  "ru": "Если сервер работает в среде Linux, Chrome тоже должен работать там. Chrome, запущенный в Windows, сервер не найдёт — всё остальное работает, не работает только закладка."
 },
 "s4_kopf": {
  "de": "Das Lesezeichen benutzen",
  "en": "Using the bookmark",
  "ru": "Как применять закладку"
 },
 "s4_vor": {
  "de": "Beides muß im <b>selben Chrome</b> laufen. Das ist die ganze Bedingung — und der häufigste Grund, warum es beim ersten Mal nicht klappt.",
  "en": "Both have to run in the <b>same Chrome</b>. That is the whole condition — and the most common reason why it fails the first time.",
  "ru": "И то и другое должно работать в <b>одном и том же Chrome</b>. Это всё условие — и самая частая причина, почему с первого раза не выходит."
 },
 "s4_t1_kopf": {
  "de": "Erster Reiter: dein KlangTresor",
  "en": "First tab: your KlangTresor",
  "ru": "Первая вкладка: ваш KlangTresor"
 },
 "s4_t1": {
  "de": "<code>http://localhost:8788</code> — die Titel stehen da, die Bilder sind zu sehen, und wo du schon Audiodateien hast, spielt er. Der Server muß laufen.",
  "en": "<code>http://localhost:8788</code> — the songs are there, the pictures are visible, and where you already have audio files it plays. The server has to be running.",
  "ru": "<code>http://localhost:8788</code> — треки на месте, изображения видны, и там, где аудиофайлы уже есть, он играет. Сервер должен быть запущен."
 },
 "s4_t2_kopf": {
  "de": "Zweiter Reiter: deine Suno-Seite",
  "en": "Second tab: your Suno page",
  "ru": "Вторая вкладка: ваша страница Suno"
 },
 "s4_t2": {
  "de": "<code>suno.com</code> — welche Seite, ist gleich. Es zählt nur, daß du dort <b>angemeldet</b> bist. Sieh nach, daß es wirklich dein eigenes Konto ist; melde dich an, falls nötig.",
  "en": "<code>suno.com</code> — which page does not matter. All that counts is that you are <b>signed in</b> there. Check that it really is your own account; sign in if needed.",
  "ru": "<code>suno.com</code> — какая именно страница, неважно. Важно только, что вы там <b>вошли</b>. Убедитесь, что это действительно ваш аккаунт; при необходимости войдите."
 },
 "s4_t3_kopf": {
  "de": "Dann das Lesezeichen anklicken",
  "en": "Then click the bookmark",
  "ru": "Затем нажмите закладку"
 },
 "s4_t3": {
  "de": "Im <b>Suno-Reiter</b>, nicht im KlangTresor. Es legt sich ein Kasten über die Seite, sagt, was es holen will, und wartet auf deine Bestätigung. Bestätigen — dann läuft es durch und meldet am Ende, was es übergeben hat.",
  "en": "In the <b>Suno tab</b>, not in KlangTresor. A box lays itself over the page, says what it wants to fetch and waits for your confirmation. Confirm — then it runs through and reports at the end what it handed over.",
  "ru": "Во <b>вкладке Suno</b>, а не в KlangTresor. Поверх страницы ляжет блок, скажет, что собирается загрузить, и будет ждать вашего подтверждения. Подтвердите — и он отработает, а в конце сообщит, что передал."
 },
 "s4_ein_kopf": {
  "de": "Es ist eine Einbahnstraße",
  "en": "It is a one-way street",
  "ru": "Это улица с односторонним движением"
 },
 "s4_ein": {
  "de": "Das Lesezeichen liest nur. Nach Suno geht nichts zurück, auch keine Abspielzähler. Dein Paßwort wird nirgends abgelegt.",
  "en": "The bookmark only reads. Nothing goes back to Suno, not even play counts. Your password is stored nowhere.",
  "ru": "Закладка только читает. Обратно в Suno не уходит ничего, даже счётчики прослушиваний. Ваш пароль нигде не сохраняется."
 },
 "skizze_kopf": {
  "de": "Ein Chrome-Fenster · zwei Reiter",
  "en": "One Chrome window · two tabs",
  "ru": "Одно окно Chrome · две вкладки"
 },
 "skizze_r2": {
  "de": "Suno &nbsp;·&nbsp; suno.com &nbsp;— angemeldet",
  "en": "Suno &nbsp;·&nbsp; suno.com &nbsp;— signed in",
  "ru": "Suno &nbsp;·&nbsp; suno.com &nbsp;— выполнен вход"
 },
 "skizze_hinw": {
  "de": "… wird im <b>Suno</b>-Reiter angeklickt, nicht im KlangTresor-Reiter.",
  "en": "… is clicked in the <b>Suno</b> tab, not in the KlangTresor tab.",
  "ru": "… нажимается во вкладке <b>Suno</b>, а не во вкладке KlangTresor."
 },
 "meckert_kopf": {
  "de": "Wenn es meckert",
  "en": "If it complains",
  "ru": "Если ругается"
 },
 "meckert": {
  "de": "„Die Anmeldung ist nicht erreichbar\" heißt fast immer: Du bist nicht im Suno-Reiter, die Seite ist noch nicht fertig geladen, oder du bist dort nicht angemeldet. Das Lesezeichen wartet bis zu acht Sekunden auf die Anmeldung, bevor es aufgibt.",
  "en": "“The sign-in cannot be reached” almost always means: you are not in the Suno tab, the page has not finished loading, or you are not signed in there. The bookmark waits up to eight seconds for the sign-in before it gives up.",
  "ru": "«Не удалось обратиться к сеансу входа» почти всегда означает: вы не во вкладке Suno, страница ещё не догрузилась или вы там не вошли. Закладка ждёт входа до восьми секунд, прежде чем сдаться."
 },
 "s5_kopf": {
  "de": "Zurück in den Tresor: übernehmen und rechnen lassen",
  "en": "Back to the archive: take it over and let it compute",
  "ru": "Обратно в архив: обновить и дать посчитать"
 },
 "s5_vor": {
  "de": "Wieder der <b>rote Knopf</b> oben rechts. Das Fenster zeigt zuerst, was sich geändert hat — dabei passiert noch nichts. Darunter steht in drei Gruppen, was der Lauf tun soll. Normal ist alles an. Dann <b>Übernehmen</b>.",
  "en": "The <b>red button</b> at the top right again. The window first shows what has changed — nothing happens yet. Below it, in three groups, stands what the run should do. Normally everything is on. Then <b>Take over</b>.",
  "ru": "Снова <b>красная кнопка</b> справа вверху. Сначала окно показывает, что изменилось, — при этом ещё ничего не происходит. Ниже тремя группами стоит то, что должен сделать запуск. Обычно включено всё. Затем — <b>Обновить</b>."
 },
 "bu_morgen": {
  "de": "Drei Gruppen nach Zugang. Orange umrandet der Knopf, der den Lauf startet — beim ersten Mal heißt er <b>Übernehmen</b>, später <b>Trotzdem nachziehen</b>, wenn sich nichts geändert hat. Der Kontoname ist unkenntlich gemacht.",
  "en": "Three groups by access. Outlined in orange the button that starts the run — the first time it says <b>Take over</b>, later <b>Update anyway</b> when nothing has changed. The account name has been blurred.",
  "ru": "Три группы по доступу. Оранжевой рамкой — кнопка, запускающая обновление: в первый раз она называется <b>Обновить</b>, позже — <b>Всё равно обновить</b>, если ничего не изменилось. Имя аккаунта размыто."
 },
 "einzeln_kopf": {
  "de": "Was der Lauf im einzelnen tut",
  "en": "What the run does in detail",
  "ru": "Что именно делает запуск"
 },
 "g1k": {
  "de": "Mit Login",
  "en": "With sign-in",
  "ru": "С входом в аккаунт"
 },
 "g1t": {
  "de": "Was das Lesezeichen gebracht hat, wird eingewoben.",
  "en": "What the bookmark delivered is woven in.",
  "ru": "То, что принесла закладка, вплетается в каталог."
 },
 "g2k": {
  "de": "Öffentlich von Suno",
  "en": "Public from Suno",
  "ru": "Открыто с Suno"
 },
 "g2t": {
  "de": "Kommentare, fehlende Medien, Nachbarschaft — holt der Server selbst.",
  "en": "Comments, missing media, neighbourhood — the server fetches these itself.",
  "ru": "Комментарии, недостающие медиафайлы, соседство — сервер забирает сам."
 },
 "g3k": {
  "de": "Lokal",
  "en": "Local",
  "ru": "Локально"
 },
 "g3t": {
  "de": "Katalog, Analyse, Instrumentspuren, Karaoke-Zeitanker, Musikstil und Klangraum.",
  "en": "Catalogue, analysis, instrument tracks, karaoke timings, musical style and sound space.",
  "ru": "Каталог, анализ, дорожки инструментов, временные метки для караоке, музыкальный стиль и звуковое пространство."
 },
 "s5_rechnen_kopf": {
  "de": "Beim ersten Mal wird viel gerechnet",
  "en": "The first time there is a lot to compute",
  "ru": "В первый раз считается много"
 },
 "s5_rechnen": {
  "de": "Jeder Titel wird durchgehört und vermessen: Lautheit, Tonart, Instrumentspuren, zwei Spektrogramme, der Platz im Klangraum. Wo Suno keine Wort-Zeitmarken liefert, hört Whisper den Text nach. Das dauert Minuten je Titel und läuft über mehrere Läufe — angefangen wird bei den neuesten. Abbrechen ist erlaubt: Fertiges wird nie noch einmal gerechnet.",
  "en": "Every song is listened through and measured: loudness, key, instrument tracks, two spectrograms, its place in the sound space. Where Suno delivers no word timestamps, Whisper listens the lyrics out. That takes minutes per song and runs over several passes — it starts with the newest. Cancelling is allowed: what is finished is never computed again.",
  "ru": "Каждый трек прослушивается и измеряется: громкость, тональность, дорожки инструментов, две спектрограммы, место в звуковом пространстве. Там, где Suno не даёт пословных временных меток, текст прослушивает Whisper. Это занимает минуты на трек и растягивается на несколько запусков — начинается с самых новых. Прерывать можно: готовое заново не считается."
 },
 "s5_grau_kopf": {
  "de": "Solange etwas fehlt, bleibt der Knopf grau",
  "en": "While something is missing, the button stays grey",
  "ru": "Пока чего-то нет, кнопка остаётся серой"
 },
 "s5_grau": {
  "de": "Ohne Wort-Zeitmarken kein Karaoke, ohne Text keine Lyrik. KlangTresor versteckt das nicht und behauptet auch nichts: Der Knopf ist grau und sagt, woran es liegt. Es kann also sein, daß nach dem ersten Lauf noch nicht alles bereitsteht.",
  "en": "Without word timestamps no karaoke, without lyrics no lyrics view. KlangTresor neither hides this nor claims anything: the button is grey and says what is missing. So after the first run not everything may be ready yet.",
  "ru": "Без пословных временных меток нет караоке, без текста нет режима текста. KlangTresor это не прячет и ничего не выдумывает: кнопка серая и говорит, чего не хватает. Поэтому после первого запуска готово может быть ещё не всё."
 },
 "fenster_kopf": {
  "de": "Das Fenster darf zu",
  "en": "The window may be closed",
  "ru": "Окно можно закрыть"
 },
 "s5_zu": {
  "de": "Das Fenster darfst du zumachen. Der Lauf läuft weiter, und du kannst weiterhören — der rote Knopf dreht sich, solange etwas arbeitet.",
  "en": "You may close the window. The run keeps going and you can keep listening — the red button turns as long as something is working.",
  "ru": "Окно можно закрыть. Запуск продолжится, и слушать можно дальше — красная кнопка вращается, пока что-то работает."
 },
 "nichtkann_kopf": {
  "de": "Was der rote Knopf nicht kann",
  "en": "What the red button cannot do",
  "ru": "Чего красная кнопка не может"
 },
 "nichtkann": {
  "de": "Alles, was deine Anmeldung braucht: die Wort-Zeitmarken fürs Karaoke, deine privaten Titel, deine privaten Alben, und wer deine Titel geherzt hat. Dafür ist das Lesezeichen da — darum steht es im Heft <b>vor</b> diesem Schritt.",
  "en": "Everything that needs your sign-in: the word timestamps for karaoke, your private songs, your private albums, and who liked your songs. That is what the bookmark is for — which is why it comes <b>before</b> this step in this booklet.",
  "ru": "Всё, для чего нужен ваш вход: пословные временные метки для караоке, ваши приватные треки, ваши приватные альбомы и то, кто ставил лайки. Для этого и нужна закладка — поэтому в брошюре она стоит <b>перед</b> этим шагом."
 },
 "s6_kopf": {
  "de": "Jeden Morgen: zwei Handgriffe",
  "en": "Every morning: two moves",
  "ru": "Каждое утро: два действия"
 },
 "s6_vor": {
  "de": "Die Reihenfolge ist wichtig. Erst das Lesezeichen, dann der rote Knopf — sonst hat der Lauf nichts Neues aus deinem Konto, mit dem er arbeiten könnte.",
  "en": "The order matters. First the bookmark, then the red button — otherwise the run has nothing new from your account to work with.",
  "ru": "Порядок важен. Сначала закладка, потом красная кнопка — иначе у запуска не будет ничего нового из вашего аккаунта."
 },
 "s6_h1": {
  "de": "<b>Erstens:</b> Suno-Reiter aufmachen, angemeldet sein, das Lesezeichen klicken, bestätigen.",
  "en": "<b>First:</b> open the Suno tab, be signed in, click the bookmark, confirm.",
  "ru": "<b>Первое:</b> откройте вкладку Suno, войдите в аккаунт, нажмите закладку, подтвердите."
 },
 "s6_h2": {
  "de": "<b>Zweitens:</b> im KlangTresor den roten Knopf, dann <b>Übernehmen</b>.",
  "en": "<b>Second:</b> in KlangTresor the red button, then <b>Take over</b>.",
  "ru": "<b>Второе:</b> в KlangTresor — красная кнопка, затем <b>Обновить</b>."
 },
 "s6_h3": {
  "de": "Das war es. Fenster zu, weiterhören — der Rest läuft im Hintergrund.",
  "en": "That is it. Close the window, keep listening — the rest runs in the background.",
  "ru": "Вот и всё. Закройте окно и слушайте дальше — остальное идёт в фоне."
 },
 "bu_roterknopf": {
  "de": "Oben rechts, orange umrandet: der rote Knopf. Er dreht sich, solange etwas arbeitet.",
  "en": "At the top right, outlined in orange: the red button. It turns as long as something is working.",
  "ru": "Справа вверху, в оранжевой рамке, — красная кнопка. Она вращается, пока что-то работает."
 },
 "s6_ohne_kopf": {
  "de": "Auch ohne Lesezeichen",
  "en": "Even without the bookmark",
  "ru": "И без закладки"
 },
 "s6_ohne": {
  "de": "Der rote Knopf allein holt weiterhin alles Öffentliche: neue Titel, Kommentare, fehlende Bilder. Nur das, was deine Anmeldung braucht, bleibt dann außen vor.",
  "en": "The red button alone still fetches everything public: new songs, comments, missing pictures. Only what needs your sign-in stays out.",
  "ru": "Одна красная кнопка по-прежнему забирает всё открытое: новые треки, комментарии, недостающие изображения. Снаружи остаётся только то, для чего нужен ваш вход."
 },
 "s6_update_kopf": {
  "de": "Neue Fassungen",
  "en": "New versions",
  "ru": "Новые версии"
 },
 "s6_update": {
  "de": "Gibt es eine neue Version von KlangTresor, erscheint neben dem roten Knopf eine <b>Glocke</b>. Ein Klick spielt sie ein. Dein Archiv bleibt dabei unberührt.",
  "en": "If there is a new version of KlangTresor, a <b>bell</b> appears next to the red button. One click installs it. Your archive stays untouched.",
  "ru": "Если выходит новая версия KlangTresor, рядом с красной кнопкой появляется <b>колокольчик</b>. Один клик — и она установлена. Ваш архив при этом не трогают."
 },
 "s6_hilfe_kopf": {
  "de": "Wenn etwas hakt",
  "en": "If something gets stuck",
  "ru": "Если что-то не идёт"
 },
 "s6_hilfe": {
  "de": "Sagt das Lesezeichen, es finde den Server nicht: läuft KlangTresor noch? Sagt es, die Anmeldung sei nicht erreichbar: bist du im <b>Suno</b>-Reiter, ist die Seite fertig geladen, bist du angemeldet?",
  "en": "If the bookmark says it cannot find the server: is KlangTresor still running? If it says the sign-in cannot be reached: are you in the <b>Suno</b> tab, has the page finished loading, are you signed in?",
  "ru": "Если закладка говорит, что не находит сервер: KlangTresor ещё запущен? Если говорит, что не удалось обратиться к входу: вы во вкладке <b>Suno</b>, страница догрузилась, вы вошли?"
 },
 "sichern_kopf": {
  "de": "Sichern",
  "en": "Backing up",
  "ru": "Резервная копия"
 },
 "sichern": {
  "de": "Eine einzige Datei ist unersetzlich: <code>library/katalog.json.gz</code>. Darin stehen Liedtexte, Wort-Zeitmarken, Kommentare, Alben und der Verlauf der Zähler — alles, was sich nicht noch einmal holen läßt. Medien, Bilder und Analysen baut KlangTresor jederzeit neu.",
  "en": "One single file is irreplaceable: <code>library/katalog.json.gz</code>. It holds lyrics, word timestamps, comments, albums and the history of the counters — everything that cannot be fetched again. Media, pictures and analyses KlangTresor rebuilds at any time.",
  "ru": "Незаменим один-единственный файл: <code>library/katalog.json.gz</code>. В нём тексты, пословные временные метки, комментарии, альбомы и история счётчиков — всё, что нельзя загрузить повторно. Медиафайлы, изображения и анализ KlangTresor пересоберёт в любой момент."
 },
 "f_install": {
  "de": "Herunterladen und installieren",
  "en": "Download and install",
  "ru": "Скачать и установить"
 },
 "f_einr": {
  "de": "Die Einrichtung",
  "en": "The setup",
  "ru": "Настройка"
 },
 "f_blick": {
  "de": "Erster Blick",
  "en": "First look",
  "ru": "Первый взгляд"
 },
 "f_anlegen": {
  "de": "Das Lesezeichen anlegen",
  "en": "Creating the bookmark",
  "ru": "Создание закладки"
 },
 "f_benutzen": {
  "de": "Das Lesezeichen benutzen",
  "en": "Using the bookmark",
  "ru": "Применение закладки"
 },
 "f_uebern": {
  "de": "Übernehmen",
  "en": "Taking it over",
  "ru": "Обновление"
 },
 "f_morgen": {
  "de": "Jeden Morgen",
  "en": "Every morning",
  "ru": "Каждое утро"
 },
 "l_win3": {
  "de": "Windows · Der Computer wurde geschützt",
  "en": "Windows · Windows protected your PC",
  "ru": "Windows · Система защитила компьютер"
 },
 "l_win4": {
  "de": "Windows · Trotzdem ausführen",
  "en": "Windows · Run anyway",
  "ru": "Windows · Выполнить в любом случае"
 },
 "l_name": {
  "de": "KlangTresor · Einrichtung · Schritt 7 von 11",
  "en": "KlangTresor · Setup · Step 7 of 11",
  "ru": "KlangTresor · Настройка · Шаг 7 из 11"
 },
 "l_ordner": {
  "de": "KlangTresor · Einrichtung · Schritt 9 von 11",
  "en": "KlangTresor · Setup · Step 9 of 11",
  "ru": "KlangTresor · Настройка · Шаг 9 из 11"
 },
 "l_schluss": {
  "de": "KlangTresor · Einrichtung · Fertig",
  "en": "KlangTresor · Setup · Done",
  "ru": "KlangTresor · Настройка · Готово"
 },
 "l_feld": {
  "de": "KlangTresor · Morgenroutine · Dein Suno-Name",
  "en": "KlangTresor · Morning routine · Your Suno name",
  "ru": "KlangTresor · Обновление библиотеки · Ваше имя в Suno"
 },
 "l_lz": {
  "de": "KlangTresor · Morgenroutine · Lesezeichen",
  "en": "KlangTresor · Morning routine · Bookmark",
  "ru": "KlangTresor · Обновление библиотеки · Закладка"
 },
 "l_chrome": {
  "de": "Chrome · Lesezeichen-Manager",
  "en": "Chrome · Bookmark manager",
  "ru": "Chrome · Диспетчер закладок"
 },
 "l_morgen": {
  "de": "KlangTresor · Morgenroutine",
  "en": "KlangTresor · Morning routine",
  "ru": "KlangTresor · Обновление библиотеки"
 },
 "l_kopf": {
  "de": "KlangTresor · Kopfzeile",
  "en": "KlangTresor · Header",
  "ru": "KlangTresor · Верхняя строка"
 }
},
};
