# Die Wege der Suno-App (Android)

Stand 08.09.2026. Quelle: Suno-App für Android, Version 1.88.0-410
(APKMirror, von Caspar_D geladen, abgelegt unter
`/Volumes/Extreme_SSD/Entwicklung/apk/`). Werkzeug: `bin/suno-app-wege.js`.
Vollständige Liste: `docs/suno-app-wege-1.88.0.txt` (273 Wege, 51 Dienste);
Rohfassung mit allen 862 Schemata: `library/suno-wege/app-1.88.0.json`.
Gegengelesen am 08.09.2026 von zwei adversarialen Lesern (dex-Format;
Doku gegen Daten); alle Befunde sind eingearbeitet.

## Warum

Die Web-App (suno.com) kennt keinen Weg zu allen Personen, die einen Titel
geherzt haben — die Handy-App zeigt sie. Also hat die App Wege, die nicht
in den Web-Skripten stecken (`docs/suno-api-wege-2026-09-08.txt`, 370 Wege
aus elf Seiten). Statt zu raten oder an Endpunkte anzuklopfen, lesen wir
sie aus der App selbst. Kein Netz, keine Ausführung von App-Code.

## Verfahren — belegt, nicht geraten

1. **Auspacken.** Das `.apkm` ist ein Zip mit `base.apk` und Splits; die
   `base.apk` ist ein Zip mit fünf `classes*.dex`. Natives Kotlin; in den
   Assets liegt nur eine JavaScript-Brücke des Braze-SDK (In-App-Nachrichten),
   kein App-Bündel. Basis-URL im Code: `https://studio-api-prod.suno.com/api/`
   (dazu `studio-api-staging.suno.com`; Clerk-Anmeldung unter `v1/client/…`).
2. **Retrofit-Schnittstellen.** Jeder Dienst ist eine Java-Schnittstelle;
   jede Methode trägt Verb und Pfad als Annotation, jeder Parameter
   `@Path`, `@Query`, `@Body` … Das steht in der `annotations_directory`
   der Klasse und wird ohne fremde Werkzeuge gelesen (dex-format,
   source.android.com). Gelesen werden **alle** Klassen — R8 benennt auch
   Schnittstellen um: 13 `cms/*`-Wege liegen in `Ldc1;`, 12 Clerk-Wege in
   `Lmz1;`, zwei Lokalise-Wege in `com.lokalise.sdk`.
3. **R8 hat die Annotationsklassen umbenannt** (`Lji5;` statt
   `Lretrofit2/http/GET;`). Die Zuordnung steht in Retrofits eigenem
   Code (`RequestFactory.Builder`, nach R8 eine Methode): je Verb ein
   `instance-of`, gefolgt vom Verb als Zeichenkette — sechs Paare; das
   siebte (`HEAD`) hat R8 vor die Kette gezogen und bekommt den übrigen
   Typ in der Kette. Danach folgen die `instance-of`-Prüfungen in
   Retrofits Quellreihenfolge (if/else-if, R8 sortiert nicht um): HTTP,
   Headers, Multipart, FormUrlEncoded, dann Url, Path, Query, QueryName,
   QueryMap, Header, HeaderMap, Field, FieldMap, Part, PartMap, Body, Tag.
   Ergebnis: `Lu73;`=DELETE `Lji5;`=GET `Ls06;`=HEAD `Ln6a;`=PATCH
   `Lr6a;`=POST `Lu6a;`=PUT `Lgk9;`=OPTIONS; `Lt06;`=HTTP `Lz26;`=Headers
   `Lh19;`=Multipart `Lad5;`=FormUrlEncoded `Lnef;`=Url `Leha;`=Path
   `Lbqb;`=Query `Leqb;`=QueryName `Ldqb;`=QueryMap `Lv26;`=Header
   `Lx26;`=HeaderMap `Lwz4;`=Field `Lyz4;`=FieldMap `Lzga;`=Part
   `Laha;`=PartMap `Lz11;`=Body `Lz7e;`=Tag — von beiden Gegenlesern mit
   eigener Disassembly bestätigt. Gegenprobe im Ergebnis: `GET
   notification/v2` und `POST gen/{gen_id}/update_reaction_type/` wie in
   `docs/SUNO-API.md`; alle 106 Pfadparameter stehen als `{name}` im Pfad.
4. **Elemente als Widerspruchsprobe.** Jede Annotationsklasse hat ihre
   Elemente (Path/Query/Field: `value`, `encoded`; Header: `value`,
   `allowUnsafeNonAsciiValues`; Part: `value`, `encoding` …). Passen sie
   nicht zur Kette, steht der Widerspruch in der Ausgabe (`Path?Query`).
   Heute: keiner.
5. **Antworten** aus der `Signature`-Annotation (bei `suspend`-Funktionen
   der Typ hinter `Either<CallError, …>`), samt Generika: `List<…>`,
   `Flow<Response<…>>`; `Unit` = leere Antwort (die App wertet nichts aus).
6. **Schemata.** kotlinx.serialization schreibt die Feldnamen jeder Klasse
   in den statischen Initialisierer ihres `$$serializer`; das Werkzeug
   liest dort alle `const-string` in Reihenfolge (MUTF-8 dekodiert).
   Gegenprobe: die neun Felder, die `notification/v2` uns liefert (id,
   updated_at, is_read, notification_type, user_profiles, total_users,
   content_id, content_title, content_message), stehen alle im Schema
   `RemoteNotification`; es kennt zwei weitere (priority,
   content_image_url), die wir nie gemessen haben.
7. **Grenzen.** Feldnamen ohne Typ (die Typen stünden in den
   Signature-Annotationen der Konstruktoren — nicht gelesen).
   Aufzählungen wie `template` oder `action.type` stehen als lose Strings
   im Code; belegt sind nur die Werte aus der v3-Antwort unten.

## Zahlen

| | com.suno | fremd (cms, Clerk, Lokalise) |
|---|---|---|
| Dienste (Retrofit-Schnittstellen) | 48 | 3 |
| Wege (Methoden) | 246 | 27 |
| verschiedene Pfade (ohne `@Url`-Download und AWS-Upload `/`) | 228 | 21 |
| davon **nicht** in den 370 Web-Wegen | **95** | 21 |
| Schema-Klassen mit Feldnamen | 721 | 141 |

Unter den 246 sind drei Wege, die nicht zur Suno-API führen: der
Datei-Download über `@Url` (beliebige Adresse), der Upload nach AWS
(`POST /`, Multipart) und der Herzschlag `POST t` (Datadog/Stratovibe).

## Herzen — der Befund

**Es gibt keinen Weg „alle Personen, die Titel X geherzt haben".** Nicht in
der App, nicht im Web. Herzen auf Titel setzen drei Wege (für Hooks,
Kommentare und Alben gibt es eigene: `video/hooks/{hook_id}/reaction`,
`comment/{clip_id}/reaction`, `unified/items/comments/reaction`,
Albumherzen über `unified/items/reaction` mit `content_type`):

| Weg | Verb | Körper | Wo |
|---|---|---|---|
| `gen/{gen_id}/update_reaction_type/` | POST | `RemoteUpdateReactionBody {reaction, …}` → `RemoteClipReaction` | Web und App |
| `gen/{gen_id}/like/` | POST | `LikeSpec {like}` → `Flow<Response<Unit>>` | nur App |
| `unified/items/reaction` | POST | `RemoteGenericReactionBody {feed_params, action}` → `{success, message, content_id, current_user_liked, current_user_disliked, like_count}` | nur App |

Der einzige personenbezogene Herz-Weg gilt Hooks, nicht Titeln:
`GET video/hooks/me/liked/v2 [start_index, page_size, user_handle]` → die
Hooks, die eine Person geherzt hat.

### `notification/v3` — was der App-Strom liefert

`GET notification/v3?include_hooks=false&before_datetime_utc=…` (nur App).
Antwort `UserNotificationV3Schema {notified_at, notifications,
next_before_datetime_utc}`, jede Benachrichtigung ein
`RemoteSduiNotification` (Typen aus den Signature-Annotationen, vom
Gegenleser bestätigt):

```
id, notification_type, template, updated_at, is_read,
avatars[]        → RemoteSduiAvatar {image_url, action}
text[]           → RemoteSduiTextSegment {text, bold, action}
thumbnail_url,
action           → RemoteSduiAction {type, url, handle}
trailing_button  → RemoteSduiTrailingButton {state, label, completed_label, action}
```

SDUI heißt „server-driven UI": der Server baut die Zeile fertig.

**Belegt (eine GET-Anfrage am 08.09.2026, 23:26, mit Freigabe von
Caspar_D, Clerk-Token des Browsers):** Status 200, 25 Benachrichtigungen
je Seite, `next_before_datetime_utc` zum Blättern wie bei v2. Eine Zeile
(Beispiel, gekürzt):

```
id: 113f9c32-…, notification_type: clip_like, template: avatars_text_thumbnail_layout_1,
updated_at: 2026-09-08T19:34:28Z, is_read: true,
avatars: [ { image_url: https://cdn1.suno.ai/….webp,
             action: { type: navigate, url: suno://suno.com/@fruusch } } ],
text:    [ { text: "DerFruusch", bold: true, action: { type: navigate, url: suno://suno.com/@fruusch } },
           { text: " Mir hat dein Lied gefallen ", bold: false },
           { text: "Glut und Eis - Die Braut von Corinth", bold: true } ],
thumbnail_url: https://cdn2.suno.ai/…jpeg,
action:  { type: navigate, url: suno://suno.com/song/89ef9f63-…?play=1 }
```

Was v3 anders macht als v2:

| | v2 (Web) | v3 (App) |
|---|---|---|
| Herzen auf denselben Titel | ein Bündel, höchstens drei `user_profiles`, `total_users` | **je Person eine Zeile** mit eigener Zeit (Jellee 20:57, DerFruusch 19:34 — in v2 wären beide im Bündel 75eef79b von *Glut und Eis*, 8 → 12 Herzen) |
| Bündel | ja, gekürzt auf drei `user_profiles` | **bis drei Personen mit Namen und Handle** („Alpha Aleph und Guedes"; „Echo Grove Music und Nur ein Mensch"), **darüber gekürzt wie v2**: drei Avatare, fettes Segment „Black Frequency + 7 andere" mit der Aktion der ersten Person (Seite 2, 09.09.2026 00:05, zweite Anfrage mit Freigabe) |
| Handle | `user_profiles[].handle` | in `action.url` als `suno://suno.com/@handle` (Avatar und Textsegment) |
| Anzeigename | `display_name` | das fette Textsegment mit Aktion |
| Titel | `content_id`, `content_title` | `action.url` = `suno://suno.com/song/<id>`, Titel als fettes Segment ohne Aktion |
| Text | `content_message` | Segmente, in der Sprache des Kontos („Mir hat dein Lied gefallen") |
| Seite | 20 | 25 |

**Ergebnis: v3 ist besser als v2, aber nicht die Lösung.** v2 und v3
sind dieselben Benachrichtigungen mit denselben IDs, nur anders gebaut;
Suno bündelt nur Herzen, die kurz nacheinander kommen (Streams). Bis drei
Personen nennt v3 alle mit Handle, ab vier kürzt es genauso wie v2. Das
8er-Bündel von *Glut und Eis* bleibt „Black Frequency + 7 andere".
Der Bildschirm „Gefällt mir (12)" auf Caspar_Ds Handy hat damit **keinen
Weg in der Android-App 1.88.0**: keine Schnittstelle, kein Schema, keine
Feed-Kennung nennt Liker eines Titels (`ActionsConfigSchema {actions}`
ist die einzige offene Stelle, ihr Inhalt kommt vom Server). Offen: Welche
App zeigt die Liste — iOS, oder eine neuere Android-Fassung? Das
entscheidet den nächsten Schritt (Mitschnitt vom Handy).

Seit dem 08.09.2026 liest das Lesezeichen v3 (`browser/morgens.js`,
Abschnitt 2d); der Server normiert v2 und v3 auf dieselbe Zeile
(`benachrichtigungNormieren` in `server/server.js`). Die Art steht sicher
in `notification_type`, das Handle sicher in der Aktion — daran hängt die
Zuordnung, nie am Satz; nur die Zahl hinter „+ N andere" kommt aus dem
Text.

## Neue Wege mit Nutzen für KlangTresor (Auswahl aus den 95)

Antworten laut App; `Unit` heißt: die App wertet die Antwort nicht aus,
der Nutzen ist dann aus dem Namen geraten, nicht belegt.

| Weg | Verb | Körper → Antwort | Wofür |
|---|---|---|---|
| `notification/v3` | GET | s. o. | Herzen mit allen Beteiligten — **im Haus seit 08.09.2026** |
| `profiles/v2/{handle}` | GET | → `RemoteProfileDetailsResponse {user_id, metadata, relationship, bio, social_links, stats, feed, pin_captions, nux_checklist}` | Profil in einem Stück; `relationship` = folgt / gefolgt |
| `profiles/v2/by-id/{uid}` | GET | dito | Profil über die Nutzer-ID (aus `user_id` in Clips und Kommentaren) |
| `profiles/following` | GET | → `GetProfileFollowResponse {current_page, handle, num_total_profiles, profiles, user_id}` | eigene Beobachtete ohne Handle im Pfad |
| `profiles/followers` | GET | → `Unit` | dieselben Parameter wie `following`; Antwort in der App ungenutzt — vermutlich dasselbe Schema, **nicht belegt** |
| `profiles/{handle}/recent_clips` | GET | → `Unit` | Name sagt „jüngste Titel"; nicht belegt |
| `user/clip_listen_history/` | GET | → `Unit` | Name sagt „eigene Hörhistorie"; nicht belegt (Web: `profiles/listen-history`) |
| `playlist/me/clip_status` | GET | `Query(clip_id, …)` → `PlaylistsSchema` | in welchen eigenen Alben ein Titel steckt |
| `playlist/sync/v2` | POST | `RemotePlaylistSyncRequest {playlists: [{playlist_id, sync_token, feed_id}]}` → `RemotePlaylistSyncResponse {playlists}` | Abgleich der Alben in einem Rutsch, mit Sync-Marke je Album |
| `gen/{clip_id}/time-sync-comments` | GET | `Query(search_time, search_range, margin, num_requested, end_time)` → `List<ClipCommentSchema>` | Kommentare an Zeitmarken im Titel |
| `trending/top/{period}/`, `trending/leaderboard/`, `trending/new/`, `trending/v2/` | GET | → `PlaylistSchema` (`metaplaylist` → `PlaylistsSchema`) | Ist-Stand der Listen — keine Historie, ob ein Titel je drin stand, sagen sie nicht |
| `download/authorize` | POST | `{item_id, item_type, surface}` → `{ok, already_unlocked, credit_deducted, reason}` | Kontingent-Freigabe eines Downloads (Credits — nicht automatisieren) |
| `search/users` | POST | `UserSearchRequest {term, booster_user_handles}` → `List<SimpleProfileInfoSchema {external_user_id, stats, display_name, handle, avatar_image_url, is_following, is_verified}>` | Personensuche (Weg auch im Web; der Körper war dort unbekannt) |
| `unified/items/*` (11 Wege) und `unified/feed/consumed` | POST | generischer Feed (`unified/feed` selbst kennt auch das Web) | Sunos neue Feed-Schicht: Kommentare, Reaktion, Folgen, Teilen, Liedtext je Feed-Element |

Die übrigen der 95: Erzeugen und Bezahlen (`generate/*`, `gems/*`,
`billing/*`, `external/generate/*`, `edit/webhook/*`, `uploads/webhook/*`,
`video/generate/*`, `voice-verification/*`, `persona/*`, `processed_clip/*`,
`queue/*`, `radio/tags/`) — Credits, also nur von Hand in Suno; dazu
Zähler (`gen/{x}/increment_play_count/`, `increment_skip_count/`), Meldungen
(`update_flag_state`, `profiles/flag`, `moderation/*`), Konto und Gerät
(`profiles/v2/me`, `user/update_phone_number/`, `user_actions/*`,
`device_attestation/nonce`, `app_version_update/`), Benachrichtigungen
(`notification/read/`, `notification/suppress/`), Oberfläche (`modals/*`,
`video/hooks/tab_carousel`, `following-feed/seen`). Nichts davon liefert
Archivdaten.

Die 21 fremden Pfade: `cms/*` (Bezahlseiten, Takeover, Stilproben —
Inhalte für die App), Clerk `v1/client/*` (Anmeldung, Form-kodiert),
Lokalise (Übersetzungen).

## Regeln

- **App-Wege sind App-Wege.** Sie werden nicht aus dem Browser angeklopft,
  um zu sehen, was passiert. Erst Freigabe, dann eine Anfrage, dann Doku —
  so lief es bei v3.
- **Neue App-Version → Werkzeug erneut laufen lassen**, Liste daneben
  legen, Unterschied notieren. Aufruf:
  `unzip base.apk` in einen Ordner, dann
  `node bin/suno-app-wege.js <ordner> <ausgabe.json> > <liste.txt>`.
  Steht in der Ausgabe ein `?` (Widerspruch Kette/Elemente) oder fehlt ein
  Verb in der Zuordnung, hat sich Retrofit oder R8 geändert — dann erst
  das Werkzeug prüfen, nicht die Liste glauben.
- Die Web-Liste (`docs/suno-api-wege-2026-09-08.txt`) und diese Liste
  ergänzen sich; `docs/SUNO-ENDPUNKTE-ABGLEICH.md` bleibt die Stelle für
  „belegt / plausibel / geraten".

## iOS-App: Mitschnitt vom 09.09.2026 (00:34–00:50)

Caspar_Ds iPhone 15 (Suno-App `iOS 1.87.0-424`), mitmproxy auf dem Mac,
Zertifikat vom Telefon akzeptiert (kein Pinning), nur Suno-Verkehr
aufgezeichnet; das Telefon lief währenddessen mit eingetragenem Proxy und
wurde danach wieder zurückgesetzt. Mitschnittdatei außerhalb des Hauses
(`/Volumes/Extreme_SSD/Entwicklung/apk/iphone/mitschnitt.flows`, enthält
Sitzungs-Token — nicht kopieren). Proben im Haus: `library/suno-wege/`.

**Die Antwort auf die Herzen-Frage:** Der Bildschirm „Gefällt mir (N)"
(Kommentarknopf auf der Song-Seite, dann das Likes-Register) ruft
`GET /api/gen/{clip_id}/likers/` — ein Weg, den nur die iOS-App kennt.

| | Befund |
|---|---|
| Antwort | `{clip_id, likers[], next_cursor, num_total_likes}` |
| je Person | `handle, display_name, avatar_image_url, external_user_id, is_following, is_following_viewer, is_verified, stats` — **keine Zeit je Herz** |
| Seiten | 20 je Seite; „Morgen" (59 Herzen) in drei Seiten 20/20/19 |
| Cursor | base64 von `{"updated_at": "2026-06-26T18:01:50.587557+00:00"}` — die Herz-Zeit des letzten Eintrags der Seite; Sortierung neueste zuerst. Jede Seitengrenze verrät also eine Zeit; ob `page_size` angenommen wird (dann eine Zeit je Herz), ist ungeprüft |
| eigenes Herz | enthalten (`caspar_d` bei „Morgen") — anders als in den Benachrichtigungen |
| *Glut und Eis* | 13 Namen, `num_total_likes` 14 |
| Kopfzeilen der App | `x-suno-client: iOS 1.87.0-424`, `session-id`, `anonymous-id`, `x-suno-timezone`, `x-suno-region`, Datadog-Spuren; Bearer-Token wie im Web |

Weitere Befunde derselben Sitzung:

- **Benachrichtigungen:** die iOS-App liest **v2** (nicht v3), minütlich
  `?after_datetime_utc=` für Neues; beim Öffnen der Glocke `POST
  notification/v2/read` (tun wir nicht). Ein Bündel führt zum Titel, die
  Avatare zu den drei Profilen — die App löst Bündel auch nicht auf.
  Neues Feld `content_ancillary_id` = Kommentar-ID bei comment_like,
  comment_reply, clip_comment; in v3 steht sie als `?comment_id=` in der
  Ziel-URL. Beides seit 09.09.2026 in der Zeile als `kommentarId`.
- **Album:** `POST unified/feed {feed_id: "generic_playlist:<id>", page_size: 50, cursor}` —
  120 Titel in drei Seiten, mit `feed_metadata.owner`.
- **Profil:** `GET profiles/v2/{handle}` liefert alles in einem Stück,
  darin ein verschachtelter Feed mit `user_pinned_songs`, `user_songs`,
  `user_playlists`, `user_hooks`, `user_personas`. Beobachter/Gefolgte über
  die Web-Wege `profiles/{handle}/followers|following?page=N`, 20 je
  Seite, mit `is_following_viewer`.
- **Kommentare:** `GET gen/{clip_id}/comments?page_size=20&order=newest`
  wie im Web; `track_timestamp` = Zeitmarke im Titel.
- Startablauf: `clerk/v1/client/sessions/{id}/tokens`, `cms/launch`,
  `cms/takeover/compact`, `playlist/sync/v2`, `app_version_update`,
  `session`, `billing/info`, `unified/feed`, `unified/homepage/explore/mobile`,
  `video/hooks/tab_carousel`, `feed/v3`, `mango/rights` (Rechteprüfung je
  Titel), `bulk_increment_play_counts/v2`.

**Für KlangTresor (Plan, Entscheidung Caspar_D):** `likers/` ist ein
iOS-Weg; ein Aufruf aus dem Lesezeichen trägt die Kennung des Browsers,
nicht die der App. Wenn wir ihn gehen: nur für Titel, deren Herzzahl sich
seit dem letzten Stand geändert hat (Understatement — die Software rechnet
aus, wo sie fragen muss), einmal ein voller Durchlauf (~250 Titel, 20 je
Seite). Zeiten je Herz aus den Benachrichtigungen, wo einzeln; sonst aus
der Seitengrenze des Cursors als Zeitfenster.
