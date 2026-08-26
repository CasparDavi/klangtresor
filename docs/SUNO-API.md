# Die Wege der Suno-Web-API

Stand 19.08.2026. Aus dem Quelltext der Web-App gezogen — 120 Skripte
von suno.com, Muster `/api/…` — 273 Wege. Die rohe Liste steht in
`suno-api-wege.txt`, hier sind sie geordnet und beschrieben.

**Wie sicher ist die Beschreibung?** Drei Stufen, ehrlich:

| | |
|---|---|
| ● | **geprüft** — aufgerufen, Antwort gesehen, oder im Haus in Betrieb |
| ◐ | **erschlossen** — aus dem Namen und Clerks Mustern; plausibel, nicht bestätigt |
| ○ | **unklar** — ich würde raten |

**Token?** `–` ohne Anmeldung · `T` nur mit Bearer-Token · `?` nicht geprüft.

**Für uns?** Was wir schon nutzen ist fett. Was lohnen könnte, ist
mit → markiert.

---

## Was wir heute benutzen

| Weg | Token | | Was es tut |
|---|---|---|---|
| **`GET /api/profiles/{handle}/`** | – | ● | Songliste mit Plays, Likes, Kommentarzahl, Stil, Lyrics — der Kern von `sammeln.js`. Auch **fremde** Profile, ohne Anmeldung → `community-profile.js`. **Vier Parameter sind Pflicht**, siehe unten |
| **`GET /api/profiles/{handle}/info`** | – | ● | Profilkopf: Name, Avatar, Zähler |
| **`GET /api/clip/{clip_id}`** | T | ● | Ein Song vollständig, auch privat — der Weg der 73 Privaten |
| **`GET /api/gen/{clip_id}/comments?order=newest`** | – | ● | Kommentare mit Autor, Zeit, Text, Likes darauf — `reaktionen.js` |
| **`GET /api/gen/{clip_id}/aligned_lyrics/v2`** | T | ● | Wort-Zeitmarken fürs Karaoke |
| **`GET /api/gen/{clip_id}/downbeats`** | T | ● | Sunos Schlagerkennung `[[t, Gewicht], …]` |
| **`GET /api/gen/{clip_id}/novelty-sections`** | T | ● | Sunos Strukturerkennung, auf Anfrage gerechnet (`running` → `complete`) |
| **`GET /api/gen/{clip_id}/waveform-aggregates`** | T | ● | Hüllkurve in Zoomstufen (`mip_map_level`), Min/Max-Paare — 0,4 MB je Song |
| **`POST /api/gen/{clip_id}/convert_wav/`** | T | ● | WAV-Erzeugung anstoßen (WAV-PROTOKOLL) |
| **`GET /api/notification/v2`** | T | ● | Benachrichtigungen: `clip_like`, `clip_comment`, `comment_like`, `comment_reply`, `follow` — **wer wann** mit Profil; `next_before_datetime_utc` zum Zurückblättern |
| **`GET /api/notification/v2/badge-count`** | T | ● | Zahl ungelesener — eigener Weg, Lesen markiert nichts |

## → Lohnt sich wahrscheinlich

| Weg | Token | | Was es tut |
|---|---|---|---|
| `GET /api/gen/{clip_id}/aligned_lyrics/v3` | T | ◐ | Neuere Fassung der Zeitmarken — **prüfen, ob genauer** als v2 |
| `GET /api/gen/{clip_id}/comments/count` | – | ◐ | Nur die Zahl — billiger als die Liste, für den Morgenlauf |
| `GET /api/comment/{comment_id}/replies` | – | ◐ | Antworten auf einen Kommentar — **fehlen uns noch**, `comment_reply` kommt in den Benachrichtigungen vor |
| `GET /api/clips/{clip_id}/attribution` | – | ● | Woraus ein Song entstand (`source_clips`, `relationship: "COV"`) — Cover-Herkunft, auch fremde |
| `GET /api/clips/remixes` · `/count` | ? | ◐ | Wer deinen Song geremixt hat |
| `GET /api/profiles/{handle}/remixes-inspired` · `-count` | ? | ◐ | Remixe, die dein Profil angestoßen hat |
| `GET /api/clip/{clip_id}/stems` · `/stems/pages` | T | ◐ | Stem-Trennung abfragen — die hat Suno schon gerechnet, wir nicht mehr |
| `GET /api/active_listeners/{clip_id}` | T | ● | Antwortet 403 — vermutlich nur während laufender Wiedergabe |
| `GET /api/clips/get_songs_by_ids` | ? | ◐ | Mehrere Songs auf einmal — statt 73 Einzelaufrufe für die Privaten |
| `GET /api/profiles/mutual-followers` | T | ◐ | Wer dir folgt und du ihm |
| `GET /api/social/following-feed` | T | ◐ | Was Leute, denen du folgst, veröffentlichen |
| `GET /api/playlist/me` | T | ◐ | Deine Playlists — vermutlich das, was wir über Umwege holen |
| `GET /api/playlist/v2/{playlist_id}` | ? | ◐ | Eine Playlist mit Einträgen |

## Erzeugen und Bearbeiten (nicht unser Thema, aber vollständig)

| Weg | | |
|---|---|---|
| `POST /api/generate/v2-web/` | ● | Song erzeugen — der Hauptweg der Wrapper |
| `POST /api/generate/concat/v2/` | ◐ | Teile zusammenfügen (`concat_infilling` ist der Songtyp davon) |
| `POST /api/generate/upsample` | ◐ | Hochrechnen |
| `POST /api/generate/lyrics/{lyrics_id}` · `lyrics-infill` · `lyrics-mashup` · `cowrite-lyrics/models/` | ◐ | Textwerkzeuge |
| `POST /api/generate/sum/` | ○ | Unklar — Zusammenfassung? |
| `POST /api/edit/crop/{clip_id}/` · `fade/` · `action/{action_clip_id}/` | ◐ | Schneiden, Ein-/Ausblenden |
| `POST /api/clips/adjust-speed/` · `reverse-clip/` | ◐ | Tempo ändern, rückwärts |
| `POST /api/clips/delete/` · `/api/gen/trash` | ◐ | Löschen, Papierkorb |
| `POST /api/gen/{gen_id}/set_metadata/` · `set_clip_prompt/` · `set_display_tags` · `set_audio_description` · `set_visibility/` · `set_configurations/` | ◐ | Song-Eigenschaften setzen — `set_visibility` ist öffentlich/privat |
| `POST /api/gen/{gen_id}/share_asset` | ◐ | Teilen-Bild erzeugen |
| `POST /api/gen/{gen_id}/unlock-preview` | ○ | Unklar |
| `POST /api/gen/{clip_id}/toggle_comments/` | ◐ | Kommentare an/aus |
| `POST /api/gen/{clip_id}/convert_opus` · `opus_file/` · `wav_file/` | ◐ | Weitere Formate — `wav_file/` könnte die **fertige WAV** abfragen statt zu pollen |
| `POST /api/clips/{clip_id}/set_remix_type` · `toggle_remixes/` · `toggle_show_remixes` | ◐ | Remix-Erlaubnis |
| `GET /api/clips/aligned_clips` · `aligned_clip_siblings` · `parent` | ○ | Verwandte Clips — Fassungen desselben Songs? |
| `GET /api/clips/autoplay/` · `get_similar/` | ◐ | Empfehlungen |
| `/api/clips/{clip_id}/project` · `/api/project/…` (13 Wege) · `/api/studio/…` (10 Wege) | ◐ | Projekte und Studio — Mehrspur, Fassungen, Mitarbeiter. `studio_export` ist der Songtyp von dort |
| `/api/uploads/audio|image|video/…` (9 Wege) | ◐ | Eigene Dateien hochladen |
| `/api/video/generate/{clip_id}/` · `/status/` · `/api/video_gen/…` · `/api/video/hooks/…` (14 Wege) | ◐ | Video-Erzeugung und „Hooks" (kurze Videoclips mit eigenen Kommentaren) |
| `/api/persona/…` (6 Wege) | ◐ | Personas: eigene Stimmen anlegen, folgen, lieben |
| `/api/custom-model/…` | ◐ | Eigene Modelle |
| `/api/lyricists` · `/api/lyrics-projects/…` · `/api/prompts/…` | ◐ | Textwerkstatt, Prompt-Vorschläge |
| `/api/instruments` · `instrument/describe-doodle` | ○ | Unklar — Instrumente aus Zeichnung? |
| `/api/openai-speech/` · `/api/deepgram-token` | ◐ | Sprachein-/ausgabe über Dritte |

## Zähler und Reaktionen — Handlungen, keine Auskunft

| Weg | | |
|---|---|---|
| `POST /api/gen/{gen_id}/update_reaction_type/` | ● | **Liken** — die Handlung. Eine Auflistung gibt es nicht (mit OPTIONS geprüft) |
| `POST /api/gen/{gen_id}/update_feedback_state/` | ◐ | Daumen hoch/runter fürs Modell |
| `POST /api/gen/{gen_id}/increment_play_count/v2` · `bulk_increment_play_counts/v2` | ● | Play zählen — **das ruft die Seite beim Abspielen auf**; unser Player tut das nicht |
| `POST /api/gen/{gen_id}/increment_action_count/` · `increment_action_counts/` | ◐ | Sonstige Zähler (Teilen, Download?) |
| `POST /api/gen/{gen_id}/listen_milestone` | ◐ | Hörmarke — 30 s gehört? |
| `POST /api/gen/{clip_id}/comment` | ● | Kommentieren |
| `/api/comment/{comment_id}` · `/reaction` · `/report` · `block-user` · `unblock-user` | ◐ | Kommentar verwalten, liken, melden |
| `/api/playlist_reaction/{playlist_id}/…` | ◐ | Dasselbe für Playlists |
| `/api/recommend/feedback/song/{clip_id}` | ◐ | Rückmeldung an die Empfehlung |
| `/api/preferences/clip-review/…` | ○ | Unklar — Bewertungsaufforderungen? |

## Benachrichtigungen

| Weg | Token | | |
|---|---|---|---|
| `GET /api/notification/v2` | T | ● | siehe oben — **der Like-Strom** |
| `POST /api/notification/v2/read` | T | ◐ | Als gelesen markieren — **nicht aufrufen** |
| `POST /api/notification/v2/clear-badge` | T | ◐ | Zähler löschen — **nicht aufrufen** |
| `GET /api/notification/` (alt) | T | ● | Existiert, liefert leer, setzt `notified_at` bei jedem Aufruf — **nicht benutzen** |

## Feeds und Suche

| Weg | | |
|---|---|---|
| `GET /api/feed/v3` · `/offset` | ◐ | Die eigene Bibliothek, seitenweise — die Wrapper holen hier ihre Ergebnisse |
| `/api/unified/feed` · `explore` · `homepage` · `homepage/explore` · `/mobile` · `search/omnisearch` | ◐ | Startseite, Entdecken, Suche — die App-Ansichten |
| `GET /api/search/` · `search/users` | ◐ | Suche nach Songs, nach Leuten |
| `/api/radio/{tag}/` · `/api/living_radio/{station_id}/song-list` | ◐ | Radio nach Stil, Live-Sender |
| `/api/realtime/discover` | ○ | Unklar |
| `/api/profiles/pinned-clips` · `pin-clip/{clip_id}` | ◐ | Angeheftete Songs auf dem Profil |
| `/api/profiles/follow` | ◐ | Folgen |
| `/api/share/…` (6 Wege) | ◐ | Teilen-Links, Statistik dazu (`share/stats` ruft die Seite selbst auf) |
| `/api/song_copy/send-song` | ○ | Unklar — Song an jemanden schicken? |
| `/api/download/clip/{clip_id}` · `/cover` · `clips/zip/prepare` · `sample-pack/{clip_id}` | ◐ | Herunterladen — **`download/clip` könnte der saubere MP3-Weg sein** statt CDN |

## Konto, Abrechnung, Sonstiges

| | |
|---|---|
| `/api/billing/…` (27 Wege) | Abo, Zahlung, Rabatte — nicht unser Thema |
| `/api/user/…` (9 Wege) | Konto: `user/me`, Einstellungen, Löschen, Nutzungsbedingungen |
| `/api/onboarding/…` (8 Wege) · `/api/survey/…` · `/api/cms/nudges/…` · `/api/statsig/…` | Einführung, Umfragen, Hinweise, A/B-Tests |
| `/api/personalization/memory` · `settings` | ◐ | Persönliche Einstellungen — „memory" klingt nach Gedächtnis fürs Modell |
| `/api/c/check` · `/api/auth/verify-token` · `/api/session/` · `/api/signout/` · `/api/clerk…` | Anmeldung |
| `/api/mango/rights` | ○ | Unklar — Rechteverwaltung? |
| `/api/music_player/playbar_state` | ◐ | Der Player meldet seinen Zustand |
| `/api/v2/${t}` | ○ | Platzhalter im Code, unklar |

---

## Fremde Profile lesen — die Falle und die Umgangsform (26.08.2026)

Derselbe Weg wie für das eigene Profil liest auch fremde, **ohne
Anmeldung, ohne Token, ohne Credits**. Darauf steht die ganze
Nachbarschaft auf der Autorenseite.

```
GET https://studio-api.prod.suno.com/api/profiles/<handle>/
    ?page=1&playlists_sort_by=upvote_count&clips_sort_by=created_at
```

**Beide `sort_by`-Angaben sind Pflicht.** Fehlt eine, antwortet der
Dienst mit **422 und einer vollständig aussehenden, leeren Hülle**: Der
Aufbau stimmt, aber jede Zahl ist `null`. Das sieht nicht wie ein
Fehler aus, sondern wie ein stiller Nutzer ohne Songs — und genau so
ist es beim ersten Versuch durchgerutscht. Wer hier Zahlen bekommt, die
verdächtig oft null sind, prüfe zuerst die Parameter, nicht die Daten.

Der abschließende Schrägstrich hinter dem Handle gehört dazu.

**Was zurückkommt:** `display_name`, `num_total_clips` und ein
`stats`-Block mit `play_count__sum`, `upvote_count__sum`,
`followers_count`, `following_count` — die Zusammenfassung über alle
Songs. Dazu die erste Seite der Songs (22 Stück), `playlists` und
`personas`.

### Der Hirschfaktor kostet Seiten

`stats` liefert Summen, aber keine Verteilung. Für den Hirschfaktor
braucht man die Likes **je Song**, absteigend sortiert
(`clips_sort_by=upvote_count`) — und zwar so viele, bis die Zahl steht.
Eine Seite trägt im Median **20 Clips** (gemessen an 175 Profilen,
Spanne 3 bis 22 — nicht die 22, die die Web-App nahelegt):

> **Seiten ≈ h / 20 + 1**
>
> Genauer paßt `h / 18,5 + 1`: mittlerer Fehler 0,4 Seiten, größter 1,2.

Mehr braucht es nie: Für ein h reichen die h besten Songs, alles
dahinter kann es nicht mehr heben. `community-hirsch.js` bricht deshalb
ab, sobald die laufende Seite den Wert nicht mehr ändern kann.

Gemessen an 174 Nachbarn: **632 Seiten insgesamt**, die Hälfte der
Leute war nach zwei bis drei Seiten fertig. Zwei standen bei h = 217
und h = 211 dicht an der damaligen Grenze von zwölf Seiten — deshalb
liegt sie seit dem 26.08.2026 bei **zwanzig** (`--seiten` ändert sie).
Das reicht bis etwa h = 350 und kostet nichts, solange niemand sie
erreicht: Der Abbruch oben greift ohnehin früher.

Wie knapp es war, zeigt der größte Nachbar: `mrmeovv`, h = 217, brauchte
**12 von 12 Seiten**. Auf der zwölften lag der Höchstwert bei 201 ≤ 217,
damit griff der Abbruch — eine Seite später hätte die alte Grenze
zugeschlagen. Der Puffer war null.

Wer die Grenze doch reißt, bekommt eine **Untergrenze**, und die Datei
vermerkt das als `genau: false` — damit später niemand eine Genauigkeit
annimmt, die nicht dahintersteht. Beim Stand vom 26.08.2026 trifft das
auf **keinen** der 175 Nachbarn zu.

### Es ist ihr Server, nicht unserer

Diese Wege sind offen, aber nicht dafür gedacht, in Serie abgefragt zu
werden. Beide Skripte halten sich deshalb an fünf Regeln — sie stehen
ausführlich im Kopf von `bin/community-profile.js`:

| | |
|---|---|
| **eine Anfrage zur Zeit** | nie parallel, auch wenn es Minuten statt Sekunden dauert |
| **1,5 s Pause** | höchstens 40 Anfragen je Minute |
| **ehrlicher User-Agent** | `KlangTresor/1.0 (persoenliches Musikarchiv; …)` — wer sich als Browser tarnt, verbirgt, wer da anfragt |
| **bei 429 oder 503 sofort aufhören** | nicht wiederholen. Wenn der Dienst bremst, ist das eine Bitte, keine Verhandlung. Das Geholte wird gesichert, der Rest folgt beim nächsten Lauf |
| **nur einmal holen** | wer schon in der Datei steht, wird übersprungen — ein zweiter Lauf kostet nichts |

Gespeichert werden nur die öffentlichen Zahlen und der Anzeigename.
Keine Songlisten, keine Texte, keine Kommentare. Es sind fremde Daten,
und sie bleiben — wie alles hier — lokal.

---

## Was ich vorschlagen würde, in dieser Reihenfolge

1. **`aligned_lyrics/v3`** — wenn genauer als v2, sofort umstellen; kostet nur einen Vergleich
2. **`comment/{id}/replies`** — Antworten fehlen uns; `reaktionen.js` um eine Schleife erweitern
3. **`notification/v2`** im Lesezeichen mitholen — **der Like-Strom**, wer wann; in `reaktionen.ndjson` anhängen, Art `like`
4. **`gen/{id}/wav_file/`** prüfen — vielleicht sagt es, ob die WAV fertig ist, statt auf 403/200 zu pollen
5. **`clips/get_songs_by_ids`** — 73 Private in einem Aufruf statt 73
6. **`download/clip/{id}`** — ob das ein sauberer Medienweg ist

Nicht: `notification/v2/read`, `clear-badge`, `notification/` (alt), alles
unter `billing`, alles was `set_`, `toggle_`, `delete`, `trash` heißt —
das verändert dein Konto.
