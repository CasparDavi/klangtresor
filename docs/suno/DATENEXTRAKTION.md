# Datenextraktion

Wie die Daten aus Suno herauskommen. Stand August 2026 — Suno ändert seine
Schnittstellen gelegentlich, die Erkundung unten hilft beim Nachziehen.

---

## Anmeldung

Suno benutzt **Clerk**. Im Browser auf suno.com:

```js
await window.Clerk.session.getToken()
```

Das Token lebt nur **rund 60 Sekunden**. Es lässt sich deshalb nicht
speichern und nicht an ein Skript übergeben — es wird vor *jeder* Anfrage
neu geholt. Alle Sammelskripte tun das.

---

## Endpunkte

| Zweck | Aufruf | Bemerkung |
|---|---|---|
| Ein Song | `GET studio-api.prod.suno.com/api/clip/<id>` | liefert alles, bester Weg |
| Arbeitsbereich | `GET .../api/feed/v2?page=N` | ~2200 Clips inkl. Takes |
| Profil | `GET .../api/profiles/<handle>?playlists_sort_by=…&clips_sort_by=…` | Stats, Playlists, Personas |
| Playlists (Köpfe) | `GET .../api/playlist/me?page=N` | **25 Stück**, 12 je Seite |
| Playlists (Inhalt) | `GET .../api/playlist/<id>?page=N` | 50 Einträge je Seite |
| **Wort-Zeitmarken** | `GET .../api/gen/<id>/aligned_lyrics/` | siehe unten |

### Der Profil-Endpunkt braucht KEINE Anmeldung — korrigiert am 18.08.2026

```
GET studio-api-prod.suno.com/api/profiles/<handle>
    ?playlists_sort_by=upvote_count&clips_sort_by=created_at&page=N
```

Antwortet **ohne Token** mit vollständigen Clip-Objekten: 38 Felder,
samt Lyrics, `audio_url` und `video_cover_url`. Gemessen an
@caspar_d: 248 von 248 Songs über 13 Seiten, rein per Node.

**Hier stand jahrelang das Gegenteil** — „paginiert nicht über `page`".
Das war ein Irrtum: `page=1` liefert dasselbe wie *ohne* Angabe, weil
die Zählung **ab 1** beginnt. Wer 0 und 1 vergleicht, sieht zweimal
dieselbe Seite und schließt auf fehlende Blätterung. Ab `page=2` geht
es weiter. Genau derselbe Fallstrick wie bei den Playlist-Endpunkten.

**Folge:** `bin/sammeln.js` holt die Songliste ohne Browser und ohne
Anmeldung. Der Umweg über die Browserkonsole
(`browser/02-sammeln.js`, Aufblättern durch Scrollen) bleibt als
Rückfall bestehen, falls Suno den Endpunkt schließt.

Ohne Token **nicht** erreichbar (jeweils 401):
`api/gen/<id>/aligned_lyrics/` (Zeitmarken), `api/playlist/me`
(Playlists), `api/gen/<id>/convert_wav/` (WAV-Erzeugung).

**Wichtig:** Ohne Browserkennung im `User-Agent` antwortet die API
teilweise gar nicht — derselbe Fallstrick wie beim CDN.

### Wort-Zeitmarken

`GET /api/gen/<id>/aligned_lyrics/` liefert:

- `data[0]` — Dict Index → `{word, start_s, end_s, p_align}`
- `data[1]` — Hüllkurve, rund 1700 Werte
- `data[2]` — leer

244 der 248 Songs haben Zeitmarken, zusammen 98.815 Wörter. Damit läuft der
Text in der Bühne wortgenau mit.

### Playlists

Geholt am 17.08.2026, liegt in `library/roh/playlists-<stempel>.json`
(3,8 MB): 25 Playlists, 599 Einträge.

**Es sind 25, nicht 16.** Die 16 aus dem Profil-Endpunkt waren nur die auf
der Profilseite sichtbaren.

**`page` zählt ab 1, nicht ab 0.** `page=0` und `page=1` liefern
**dieselbe** erste Seite, erst ab `page=2` geht es weiter. Gilt für beide
Playlist-Endpunkte. Wer stumpf aufsummiert, zählt die erste Seite doppelt.
Sicherer Weg: über `id` deduplizieren und gegen `num_total_results` prüfen.

Die Köpfe enthalten **`playlist_clips` als leeres Array** — die Songs
stehen dort nicht drin. Dafür je Playlist ein zweiter Aufruf.

Aufbau eines Eintrags: `{ clip, relative_index, created_at }`.
`relative_index` gibt die **Reihenfolge** in der Playlist, `created_at`
wann der Song aufgenommen wurde. Das `clip`-Objekt trägt `handle` und
`display_name` des Urhebers — darüber lassen sich eigene von fremden
Songs trennen.

**Sechs Einträge liefert die API nicht aus.** Bei vier Playlists ist die
Kopfzahl größer als die Zahl der gelieferten Einträge; die fehlenden
Indizes sind mitten in der Reihenfolge (z. B. „Nice Songs" Index 14).
Vermutlich gelöschte oder privat gestellte Clips, die der Zähler noch
mitzählt. Kein Sammelfehler — mehrfaches Abrufen ändert nichts.

### Nützlicher Trick

Suno antwortet auf unvollständige Anfragen mit **HTTP 422 und nennt im
Body genau die fehlenden Parameter**. Das hat zweimal aus einer Sackgasse
geholfen. Immer erst den Fehlertext lesen, nicht raten.

---

## Felder, die man leicht übersieht

| Feld | Bedeutung |
|---|---|
| `video_url` | Sunos automatisches **Lyric-Video**, gibt es zu fast jedem Song |
| `video_cover_url` | **Caspar_Ds eigenes hochgeladenes Video-Artwork**, 83 Songs |
| `hook_preview_thumbnail_url`, `has_hook` | Hooks |
| `metadata.prompt` | die Lyrics |
| `metadata.tags` | der Stil-Prompt |
| `metadata.negative_tags` | ausgeschlossene Stile |
| `metadata.cover_clip_id`, `edited_clip_id`, `is_remix` | Abstammung |
| `major_model_version` | v4, v4.5, v5, v5.5 — bei 25 Songs LEER |
| `model_name` | dann nur „chirp" — **taugt nicht als Versionsangabe**, verteilt sich quer über alle Zeiträume |

`video_cover_url` wurde anfangs übersehen und musste für alle 248 Songs
nachgeholt werden. **Beim Ändern der Feldliste in `browser/02-sammeln.js`
also aufpassen** — was dort fehlt, ist später nur mit einem kompletten
neuen Durchlauf zu beschaffen.

---

## CDN — ohne Anmeldung

Die Mediendateien liegen offen. Das ist der Grund, warum der große Teil
der Arbeit ohne Browser läuft:

| Datei | Adresse | Status |
|---|---|---|
| MP3 | `cdn1.suno.ai/<id>.mp3` | ✓ mit Range, fortsetzbar |
| Lyric-Video | `cdn1.suno.ai/<id>.mp4` | ✓ — **wird nicht mehr archiviert**, siehe unten |
| Artwork | aus `image_large_url` | ✓ |
| Video-Artwork | aus `video_cover_url` | ✓ |
| **WAV** | `cdn1.suno.ai/<id>.wav` | **403, solange nicht erzeugt** |

**Sunos Lyric-Videos werden seit dem 17.08.2026 nicht mehr geladen.** Sie
belegten 2,51 GB — mehr als die Hälfte des Archivs — und sind seit der
Bühne überflüssig: Die kann dasselbe wortgenau statt zeilenweise, in den
Coverfarben und mit einstellbarem Versatz. Die Zeitmarken liegen als Daten
vor, nicht nur als fertiges Bild. Nachladbar mit
`node bin/laden.js --mit-lyricvideo`.

### Das CDN erlaubt Fremdzugriff — mit CORS

Gemessen am 17.08.2026, auch für Songs **anderer** Urheber:

| | Antwort | `access-control-allow-origin` |
|---|---|---|
| MP3 (`cdn1`) | 200, Range | `*` |
| Cover (`cdn2`) | 206 | `*` |
| Playlist-Cover | 206 | `*` |

Der CORS-Kopf ist der entscheidende Teil: Damit lässt sich fremder Ton
über `crossOrigin="anonymous"` abspielen, **ohne** dass er für die Web
Audio API als verdorben gilt. Ohne das Attribut lieferte
`createMediaElementSource` nur Nullen und alle Visualisierungen blieben
schwarz.

**Fallstrick beim Prüfen:** Bei Bildern antwortet das CDN auf **HEAD**
mit 403, auf GET dagegen mit 200/206 — auch bei eigenen Covern, die
nachweislich ladbar sind. Wer mit `curl -I` prüft, hält funktionierende
Adressen für gesperrt. Immer mit GET testen (`curl -r 0-1023`).

### WAV — gelöst am 18.08.2026

WAVs entstehen erst auf Anforderung. Der Auslöser ist **ein einziger
Aufruf**:

```
POST studio-api-prod.suno.com/api/gen/<id>/convert_wav/   → 204
```

Danach rechnet Suno 25–60 s, dann liegt die Datei unter
`cdn1.suno.ai/<id>.wav` und ist **ohne Anmeldung** abrufbar. GET auf
denselben Pfad liefert 405 — es muss POST sein.

Gefunden durch Abfangen von `window.fetch` in der Suno-Seite. Der
Zähler `increment_action_count` wird dabei **nicht** ausgelöst; der
läuft nur beim Klick auf „Download File".

**Der 403 bedeutet „gibt es noch nicht", nicht „gesperrt"** (gemessen
18.08.2026). Vier fremde Playlist-Songs, von uns nie angestoßen: zwei
liefern das WAV mit **206** aus, zwei mit 403. Wo die Datei existiert,
ist sie **ohne Anmeldung** abrufbar — auch die fremder Urheber. Suno
erzeugt sie aber nicht von selbst, deshalb bleibt der
`convert_wav`-Aufruf nötig, und nur er braucht ein Token.

Praktisch: Bei neuen Songs erst mit einem nackten GET prüfen, bevor
angestoßen wird — gelegentlich ist schon eines da.

`bin/wav.js` prüft und holt; das Anstoßen läuft über die Browserkonsole
(siehe WAV-PROTOKOLL.md). **Damit ist massenhaftes Archivieren möglich.**

Zwei Fallstricke: `curl` bekommt vom CDN keine Antwort für WAVs
(User-Agent-Sperre) — Node dagegen schon. Und ein WAV in Erzeugung
lässt die Verbindung offen stehen, statt 403 zu liefern. Bei zwei Songs
(*Leere Buchung*, *Kaputte Systeme*) fehlt aus demselben Grund auch das
Lyric-Video — die API nennt eine Adresse, dahinter liegt nichts.

---

## Drosselung

Suno antwortet bei zu schnellen Abfragen mit **HTTP 429**. Schon nach etwa
100 zügigen Anfragen. Alle Sammelskripte warten nach einem 429 zunehmend
länger und versuchen erneut.

Praktisch: rund **8 Sekunden pro Song**. Ein voller Durchlauf über 248
Songs dauert etwa 35 Minuten. Die Medien-Downloads vom CDN sind davon
nicht betroffen und laufen schnell.

---

## Die Datenübergabe Browser → Mac

**Der naheliegende Weg funktioniert nicht.** Chrome blockiert Anfragen von
suno.com an `127.0.0.1` und `localhost` vollständig — sie laufen in einen
Timeout, auch mit korrekt gesetztem `Access-Control-Allow-Private-Network`.
`server/empfang.js` war der Versuch dazu und ist am 18.08.2026 gelöscht
worden; er liegt in der git-Historie.

**Der funktionierende Weg:** Das Sammelskript legt die Daten als
Blob-Download ab (`suno-archiv-metadaten.json`, rund 1 MB). Danach von Hand
nach `library/roh/profil-<stempel>.json` schieben.

Der Rückweg über die Browser-Konsole taugt ebenfalls nicht — Ausgaben
werden ab etwa 10 KB abgeschnitten.

---

## Fremde Songs

Beim Aufblättern der Profilseite rutschen Songs anderer Leute mit hinein,
aus dem Player oder aus „Gefällt mir". Beim ersten Lauf waren es 3 von 251,
beim zweiten 38 von 286.

Aussortiert wird über den `handle`, an **zwei** Stellen:
`browser/02-sammeln.js` beim Sammeln und `bin/aufbereiten.js` beim
Einlesen. Beide Filter sollten bleiben — der zweite fängt ab, was in
älteren Rohdateien schon drinsteht.

## Kommentare — und was es nicht gibt (19.08.2026)

```
GET https://studio-api-prod.suno.com/api/gen/<id>/comments?order=newest
```

**Ohne Anmeldung, ohne Token.** Liefert je Kommentar: `id`,
`user_handle`, `user_display_name`, `user_avatar_url`, `created_at`,
`content` im Volltext und `num_likes` — die Likes **auf den Kommentar**.

Erster Lauf über das Archiv: 471 Kommentare von 107 Menschen, vom
22.04.2025 bis 18.08.2026, 226 KB.

### Das Präfix ist `/api/gen/`
Nicht `/api/clip/`, nicht `/api/comment/`. Rund zwanzig geratene
Adressen haben mit 404 geantwortet, bevor der echte Aufruf
mitgeschnitten war — dabei stand dasselbe Präfix seit dem 18.08.2026 in
`WAV-PROTOKOLL.md`: `POST /api/gen/<id>/convert_wav/`.

**Lehre: Erst im eigenen Haus nachsehen, dann raten.**

### Wie man einen Aufruf mitschneidet
`fetch` und `XMLHttpRequest.prototype.open` überschreiben, dann die
gesuchte Stelle anklicken. Die Adressen danach **zerlegt** ausgeben —
`new URL(u).pathname` und `searchParams` getrennt —, sonst schwärzt
manches Werkzeug die ganze Zeile als „query string data".

Auf der Songseite heißt das Bedienelement `aria-label="Playbar: Comment"`.

### Was es NICHT gibt
Geprüft mit `OPTIONS`, also aus der Antwort des Servers, nicht geraten:

| Weg | erlaubt |
|---|---|
| `/api/gen/<id>/comments` | **GET** |
| `/api/gen/<id>/comment` | nur POST — kommentieren |
| `/api/gen/<id>/like` | nur POST — liken |
| `/api/comment/list/` | nur DELETE |
| `likes`, `upvotes`, `upvoters`, `reactions`, `listeners`, `plays` | 404 |

**Wer geliked hat, gibt die Web-API nicht heraus** — nur die Handlung
und die Summe. In der mobilen App ist die Liste sichtbar; die benutzt
also einen anderen Weg. Ihn zu finden hieße, den Verkehr des Telefons
mitzuschneiden (Proxy plus Zertifikat) — nicht empfohlen.

**Wer gespielt hat, gibt es überhaupt nicht.** Abspielzahlen sind eine
Summe ohne Namen, auch rückwirkend.

### `/api/notification/`
Existiert, braucht einen Bearer-Token (`window.Clerk.session.getToken()`
auf einer suno.com-Seite), liefert 200. **Vorsicht:** Jeder Aufruf
setzt ein neues `notified_at` — vermutlich ein Lesezeichen. Nicht zum
Ausprobieren benutzen. Der sichtbare Benachrichtigungsstrom der Seite
kommt ohnehin über **Braze**, eine fremde Plattform, und nicht über
Sunos API.

## Die Adreßliste der Web-App (19.08.2026)

Die Web-App liefert ihren Quelltext an den Browser aus — 120 Skripte
von suno.com. Ein Durchlauf über alle mit dem Muster
`/api/[a-zA-Z0-9/_\-${}.]+` ergibt ihre **vollständige Adreßliste**:
273 Wege, gesichert in `docs/suno-api-wege.txt`.

Damit ist das Raten vorbei. Wer künftig wissen will, ob es einen Weg
gibt, sieht dort nach. Steht er nicht drin, kann die Web-App ihn nicht
— was die mobile App kann, steht in diesem Quelltext nicht.

### Drei Auskünfte, die wir seither holen
Alle nur mit Bearer-Token (401 ohne), deshalb über das Lesezeichen
`browser/morgens.js`. Sie landen als `timing-*.json` neben den
Wort-Zeitmarken und gehen denselben Weg in den Katalog.

| Weg | Feld im Katalog | Inhalt |
|---|---|---|
| `/api/gen/<id>/downbeats` | `schlaege` | Sunos Schlagerkennung: `[[0.302, 1.0], [0.919, 1.0], …]` — Zeit und Gewicht je Schlag |
| `/api/gen/<id>/novelty-sections` | `abschnitte` | Sunos Strukturerkennung. Wird **auf Anfrage** gerechnet — antwortet erst `{state:"running"}`, beim nächsten Lauf `complete` |
| `/api/gen/<id>/waveform-aggregates` | `wellenStufen` | Hüllkurve in Zoomstufen (`mip_map_level`), als Min/Max-Paare |

Gemessen: drei Aufrufe plus 300 ms Pause ergeben rund zwei Sekunden je
Song; der erste Durchgang über 248 Songs rund zehn Minuten, danach nur
noch die neuen.

**Was das bringt:** Der Analyzer rechnet Tempo und Struktur selbst und
war sich bei beidem nicht sicher. Jetzt gibt es **Sunos eigene
Antwort** als Referenz — die Schlagerkennung läßt sich gegen
`downbeats` prüfen, und der abgeklemmte Strukturbalken könnte mit
`novelty-sections` wiederkommen, diesmal aus der Quelle.

Dazu in der Liste, noch nicht genutzt: `aligned_lyrics/v3` (neuer als
unser v2), `comments/count`, `clips/<id>/attribution` (öffentlich:
woraus ein Song entstand), `clips/get_similar`.
