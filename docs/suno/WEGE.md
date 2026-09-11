# Die Wege zu Suno

Stand 11.09.2026. Zusammengelegt aus drei Dokumenten, die alle dasselbe Thema führten und sich
gegenseitig widersprachen, sobald eines veraltete. Die **Kurzliste** ist der Kopf — sie sagt, was
wir sicher wissen. Was darunter folgt, ist der Beleg dafür: erst die Wege der Android-App
(Stand 08.09.2026), dann die der Web-API (Stand 19.08., einzelne Wege 27.08.2026).

> Ein einmaliger Abgleich der drei Recherchen gegeneinander liegt unter
> [archiv/SUNO-ENDPUNKTE-ABGLEICH.md](../archiv/SUNO-ENDPUNKTE-ABGLEICH.md). Seine Ergebnisse
> stehen in der Kurzliste; das Dokument selbst ist Bericht.

---

## Was wir sicher wissen

## Suno-Wege — was wir sicher wissen (Kurzliste)

Stand 09.09.2026, 01:40. Für Tarja zum Draufschauen. Alle Wege liegen unter
`https://studio-api-prod.suno.com` und brauchen den Clerk-Token des
angemeldeten Browsers (`Authorization: Bearer …`). Nur Lesen; nichts hier
setzt ein Herz, schreibt einen Kommentar oder kostet Credits. Was wir
**nicht** aufrufen, steht am Ende. Lange Fassung mit Belegen:
`docs/SUNO-API.md`, `docs/SUNO-APP-WEGE.md`.

### A · Web-Wege, im KlangTresor in Betrieb

| Weg | holt | Anmerkung |
|---|---|---|
| `GET /api/profiles/{handle}/?page=N` | die öffentlichen Titel eines Profils mit Abrufen, Herzen, Kommentarzahl, Stil, Liedtext | 20 je Seite; auch für fremde Profile |
| `GET /api/profiles/{handle}/info` | Profilkopf: Name, Bild, Zähler | |
| `GET /api/clip/{clip_id}` | ein Titel vollständig — Ton- und Bildadressen, Metadaten, Herzen, Abrufe, `is_liked` | auch für private eigene Titel (der Weg zu den 73 Privaten) |
| `GET /api/playlist/me?page=N` | eigene Alben (Köpfe) | 12 je Seite, `num_total_results` |
| `GET /api/playlist/{playlist_id}?page=N` | Einträge eines Albums mit vollen Titel-Objekten | 50 je Seite; private Titel stehen mit drin |
| `GET /api/notification/v3?include_hooks=false&before_datetime_utc=…` | wer wann reagiert hat: `clip_like`, `clip_comment`, `comment_like`, `comment_reply`, `follow` | 25 je Seite, vier Wochen zurück. Herzen, die kurz nacheinander kommen, sind **ein Bündel**: bis drei Personen mit Handle, darüber „+ N andere". Handle in `action.url` = `suno://suno.com/@handle`, Titel in `suno://suno.com/song/<id>` |
| `GET /api/gen/{clip_id}/likers/?cursor=…` | **alle Personen, die einen eigenen Titel geherzt haben** | 20 je Seite, neueste zuerst, eigenes Herz dabei, `num_total_likes`. Der Cursor ist base64 von `{"updated_at": …}` = Herz-Zeit des letzten der Seite — sonst keine Zeit je Herz. Nur eigene Titel (die App zeigt es bei fremden nicht) |
| `GET /api/gen/{clip_id}/comments?order=newest` | Kommentare mit Autor, Zeit, Text, Herzen darauf | Antworten: `GET /api/comment/{comment_id}/replies` |
| `GET /api/gen/{clip_id}/aligned_lyrics/v2` | Wort-Zeitmarken (Karaoke) | v3 liefert eine zweite Fassung, Vergleich offen |
| `GET /api/gen/{clip_id}/downbeats` · `/novelty-sections` · `/waveform-aggregates` | Sunos eigene Analyse: Schläge `[[t, Gewicht], …]`, Struktur (auf Anfrage gerechnet, `running` → `complete`), Hüllkurve in Zoomstufen | Referenz für den Analyzer |
| `GET /api/billing/info/` | Credits, Plan, Monatsverbrauch, Download-Kontingent | |
| `GET /api/user/me` | wer angemeldet ist | Konto-Wächter des Lesezeichens |
| `GET /api/profiles/{handle}/followers?page=N` · `/following?page=N` | Beobachter und Gefolgte | 20 je Seite; `is_following_viewer` sagt je Person, ob sie **dir** folgt |
| `GET /api/clips/{clip_id}/attribution` · `clips/clip_roots?clip_id=` · `clips/remixes/count?clip_id=` | woraus ein Titel entstand (Cover-Herkunft), Wurzeln, Zahl der Remixe | Lied-Familien |

### B · Web-Wege, geprüft, nicht in Betrieb

| Weg | holt | Anmerkung |
|---|---|---|
| `GET /api/notification/v2?before_datetime_utc=…` | dasselbe wie v3, roh: `user_profiles` (höchstens drei), `total_users`, `content_id`, `content_title`, `content_message` | dazu `content_ancillary_id` = Kommentar-ID bei Kommentar-Ereignissen; `?after_datetime_utc=` = nur Neues seit. Bis 08.09. unser Weg |
| `GET /api/notification/v2/badge-count` | Zahl ungelesener | Lesen markiert nichts |
| `POST /api/feed/v3` (die App; im Web-Bündel auch `/feed/v3/offset`) | eigene Bibliothek, auch Private, mit Cursor — die Wrapper holen hier ihre Ergebnisse | Antwort `{clips, next_cursor, has_more}` |
| `GET /api/gen/{clip_id}/wav_file/` | fertige WAV-Adresse, wenn vorhanden | Erzeugen (`convert_wav`) kostet Credits — nur von Hand |

### C · App-Wege, belegt (Mitschnitt iPhone 09.09.2026, Android-Code gelesen)

| Weg | holt | Anmerkung |
|---|---|---|
| `POST /api/unified/feed` mit `{feed_id, page_size, cursor, target_user_id}` | Sunos generische Feed-Schicht | Kennungen: `generic_playlist:<playlist_id>` (Album, 50 je Seite, Cursor "50", "100"), `user_songs` (mit `request_metadata.sort_by`), `user_playlists`, `user_pinned_songs`, `user_hooks`, `user_personas`, `recommend_users` |
| `GET /api/profiles/v2/{handle}` · `/v2/by-id/{user_id}` | Profil in einem Stück: Kopf, Bio, Beziehung (`is_following`, `is_following_viewer`), Zähler, verschachtelter Feed der fünf Unterlisten, Pin-Texte | 425 KB je Aufruf |
| `GET /api/gen/{clip_id}/time-sync-comments?search_time=&search_range=&margin=&num_requested=&end_time=` | Kommentare an Zeitmarken im Titel | Liste von Kommentaren, `track_timestamp` |
| `GET /api/session` | Sitzungsstand der App | |
| `POST /api/playlist/sync/v2` mit `{playlists: [{playlist_id, sync_token, feed_id}]}` | Abgleich der Alben in einem Rutsch | Antwort `{playlists}` |
| `GET /api/cms/launch` · `cms/takeover/compact` · `cms/paywall` … | Inhalte für die App-Oberfläche (Bezahlseiten, Takeover) | kein Archivnutzen |
| `POST /api/mango/rights` | Rechteprüfung je Titel | App ruft es dreimal beim Öffnen eines Titels |

### D · Aus dem Android-Code bekannt, nie gerufen (Auswahl)

Form und Namen sicher, Wirkung nicht gesehen — Stufe „plausibel".

| Weg | vermutlich | Körper / Antwort laut Code |
|---|---|---|
| `POST /api/download/authorize` | Download gegen Kontingent freischalten — **Credits, nicht automatisieren** | `{item_id, item_type, surface}` → `{ok, already_unlocked, credit_deducted, reason}` |
| `POST /api/gen/{gen_id}/like/` | Herz setzen, zweiter Weg neben `update_reaction_type` | `{like}` |
| `GET /api/playlist/me/clip_status?clip_id=` | in welchen eigenen Alben ein Titel steckt | → Albenliste |
| `GET /api/trending/top/{period}/` · `leaderboard/` · `new/` · `v2/` | die Listen, Ist-Stand | → Playlist |
| `GET /api/profiles/{handle}/recent_clips` · `GET /api/user/clip_listen_history/` | jüngste Titel / eigene Hörhistorie | die App wertet die Antwort nicht aus (`Unit`) — unbelegt |
| `POST /api/search/users` | Personensuche | `{term, booster_user_handles}` → Profile |

Die vollständige Liste der Android-App (273 Wege, 51 Dienste) steht in
`docs/suno-app-wege-1.88.0.txt`; das Werkzeug dazu ist
`bin/suno-app-wege.js`.

### Was wir nicht tun

- **Nichts, was schreibt oder kostet:** `update_reaction_type`, `comment`,
  `follow`, `convert_wav`, `download/*`, `generate/*`, `notification/v2/read`.
- **Kein Anklopfen.** Ein neuer Weg wird erst gerufen, wenn aus Code oder
  Mitschnitt klar ist, dass er nur liest — und dann einmal, mit Freigabe.
- **Keine Nachahmung der App-Kennung.** Wir sind ein Web-Client; wo wir
  einen App-Weg gehen (`likers/`, `notification/v3`), ist das so bekannt.
- **Zwischen Anfragen Pause** (260 ms), Seiten nur bis zum Ende.


---

## Aufgegeben: Server-Login über das `__client`-Cookie

**Entschieden am 19.08.2026. Nicht wieder anfangen.**

Mehrere Stunden ging der Versuch, dem Server einen eigenen Zugang zu
verschaffen: `bin/token.js` konnte aus einem `__client`-Cookie
Clerk-Token prägen, wie die bekannten Open-Source-Wrapper. Der Weg
funktioniert technisch — aber er bekommt nie ein angemeldetes Cookie.
Der angemeldete `__client` sitzt **HttpOnly im Tab**, und jede Login-
oder Clerk-Seite legt stattdessen einen *neuen, leeren* Client an. Drei
gültige, leere Cookies kopiert, keines mit Session. Das ist Clerks
Schutz, und er hält.

Caspar_D, 19.08.2026: *„ich hab keinen Bock mehr, wir nehmen das
Lesezeichen."*

**Der Token lebt ohnehin nur rund sechzig Sekunden** und ist an die
Herkunft `suno.com` gebunden. Er läßt sich weder speichern noch
weiterreichen. Er kommt aus einer **aktiven Suno-Sitzung** — heute über
das Lesezeichen (`browser/morgens.js`), später vielleicht über eine
Browser-Erweiterung. Eine dritte Möglichkeit gibt es nicht.

**Am 11.09.2026 gelöscht**, weil die Begründung allein nicht reichte:

| weg | war |
|---|---|
| `bin/token.js` | 126 Zeilen mit einem Kopf „WIE ES GEHT" samt Anleitung zum Cookie-Kopieren |
| `POST /api/geheim/cookie` | nahm das Cookie vom Lesezeichen entgegen, null Aufrufer |
| `geheim/` | leerer Ordner |

Die Entscheidung vom 19.08. hatte ausdrücklich verfügt, die Dateien
*„bleiben liegen, falls Clerk das Cookie eines Tages hergibt"*. Genau
das hat sich gerächt: Wer den Code liest statt des Übergabedokuments,
findet eine Anleitung und hält den Weg für offen. Dreimal ist das
passiert. Hausregel ist deshalb: **totgelegt wird nur durch Löschen,
die Begründung bleibt.** Sie steht hier.

Was **bleibt**, und warum: die Sperren in `bin/paket.js`,
`bin/export.js` und `bin/fremdstand.js` gegen `geheim/`. Sie kosten
nichts und fangen einen künftigen Fehlgriff ab.

---

## Beleg 1 — die Wege der Android-App

## Die Wege der Suno-App (Android)

Stand 08.09.2026. Quelle: Suno-App für Android, Version 1.88.0-410
(APKMirror, von Caspar_D geladen, abgelegt unter
`/Volumes/Extreme_SSD/Entwicklung/apk/`). Werkzeug: `bin/suno-app-wege.js`.
Vollständige Liste: `docs/suno-app-wege-1.88.0.txt` (273 Wege, 51 Dienste);
Rohfassung mit allen 862 Schemata: `library/suno-wege/app-1.88.0.json`.
Gegengelesen am 08.09.2026 von zwei adversarialen Lesern (dex-Format;
Doku gegen Daten); alle Befunde sind eingearbeitet.

### Warum

Die Web-App (suno.com) kennt keinen Weg zu allen Personen, die einen Titel
geherzt haben — die Handy-App zeigt sie. Also hat die App Wege, die nicht
in den Web-Skripten stecken (`docs/suno-api-wege-2026-09-08.txt`, 370 Wege
aus elf Seiten). Statt zu raten oder an Endpunkte anzuklopfen, lesen wir
sie aus der App selbst. Kein Netz, keine Ausführung von App-Code.

### Verfahren — belegt, nicht geraten

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

### Zahlen

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

### Herzen — der Befund

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

#### `notification/v3` — was der App-Strom liefert

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

### Neue Wege mit Nutzen für KlangTresor (Auswahl aus den 95)

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

### Regeln

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

### iOS-App: Mitschnitt vom 09.09.2026 (00:34–00:50)

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
| fremde Titel | **kein Likes-Register** in der App (Tarjas Titel, 01:05): die Liste gibt es nur für eigene Titel. Ob die Schnittstelle fremde Titel abweist, ist ungeprüft — und wird nicht angeklopft |
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
  wie im Web; `track_timestamp` = Zeitmarke im Titel. Antworten:
  `GET comment/{comment_id}/replies?cursor=` (Web-Weg), Cursor = base64
  von `{"created_at": …, "parent_id": …}`, Antwort `{replies, total_count}`.
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


---

## Beleg 2 — die Wege der Web-API

## Die Wege der Suno-Web-API

Stand 19.08.2026, einzelne Wege am 27.08.2026 nachgeprüft (die drei
Folge-Listen und `download/clip`). Aus dem Quelltext der Web-App gezogen — 120 Skripte
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

### Was wir heute benutzen

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
| **`GET /api/notification/v2`** | T | ● | Benachrichtigungen: `clip_like`, `clip_comment`, `comment_like`, `comment_reply`, `follow` — **wer wann** mit Profil; `next_before_datetime_utc` zum Zurückblättern. **Bündel** (gemessen 08.09.2026): Herzen, die kurz nacheinander auf denselben Titel kommen, sind EIN Eintrag mit höchstens drei `user_profiles` und der echten Zahl in `total_users`; Suno schreibt ihn fort — gleiche `id`, neue `updated_at`, größere Zahl, andere drei Namen. Der Server trägt gewachsene Einträge nach (`nachtrag: true`). Alle Einzelnamen zeigt nur die Handy-App; ihr Weg steckt nicht in den Web-Skripten (offen) |
| **`GET /api/notification/v2/badge-count`** | T | ● | Zahl ungelesener — eigener Weg, Lesen markiert nichts |
| **`GET /api/notification/v3?include_hooks=false`** | T | ● | **App-Weg** (aus der Android-App gelesen, `docs/SUNO-APP-WEGE.md`; einmal geprüft 08.09.2026 mit Freigabe): dieselben Ereignisse als fertige Zeilen — `avatars[]`, `text[]` (Segmente mit `bold` und `action`), `action`, `thumbnail_url`. Bündel bis drei Personen mit Handle in `action.url` (`suno://suno.com/@handle`), darüber gekürzt wie v2 („Black Frequency + 7 andere"); Titel in `suno://suno.com/song/<id>`. 25 je Seite, `before_datetime_utc` zum Blättern. Seit 08.09.2026 der Weg des Lesezeichens |
| **`GET /api/gen/{clip_id}/likers/`** · `?cursor=` | T | ● | **iOS-Weg** (Mitschnitt iPhone 09.09.2026, `docs/SUNO-APP-WEGE.md`): **alle Personen, die einen Titel geherzt haben** — `{clip_id, likers[20], next_cursor, num_total_likes}`, je Person `handle, display_name, avatar_image_url, external_user_id, is_following, is_following_viewer, is_verified, stats`. Neueste zuerst, eigenes Herz enthalten. `cursor` ist base64 von `{"updated_at": "…"}` = Zeit des letzten Herzens der Seite. Proben: `library/suno-wege/likers-probe-*.json` |
| `GET /api/notification/v2?after_datetime_utc=` | T | ● | „nur Neues seit" — die iOS-App fragt so minütlich nach. v2 hat außerdem `content_ancillary_id` = **Kommentar-ID** bei comment_like/comment_reply/clip_comment, `priority`, `content_image_url` (Mitschnitt 09.09.2026) |
| **`POST /api/unified/feed`** mit `feed_id` | T | ● | Sunos generische Feed-Schicht (Mitschnitt iOS 09.09.2026). Belegte Kennungen: `generic_playlist:<playlist_id>` (Album, `page_size` 50, `cursor` "50", "100" — 120 Titel in drei Seiten), `user_songs` (`target_user_id`, `request_metadata.sort_by` = created_at / upvote_count), `user_playlists` (`cursor` "20"), `user_pinned_songs`, `user_hooks`, `user_personas`, `recommend_users`, `unified_feed_vertical`. Antwort `{feed: {feed_id, feed_title, items[{content_type, content_id, content_item}], next_cursor, feed_metadata}}` |
| `GET /api/profiles/v2/{handle}` · `/v2/by-id/{uid}` | T | ● | Profil in einem Stück (425 KB): `metadata`, `bio`, `relationship {is_following, is_following_viewer, …}`, `stats {followers_count, following_count, clips_count, play_count, upvote_count, remixes_inspired_count}`, `feed` = verschachtelter Feed mit fünf Unterfeeds (s. o.), `pin_captions` |

### → Lohnt sich wahrscheinlich

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
| **`GET /api/profiles/following`** | T | ● | **Wem du folgst.** 20 je Seite über `?page=N`; `page_size` und `offset` werden ignoriert. Antwort trägt `num_total_profiles` und `current_page`. Jeder Eintrag hat **`is_following_viewer`** — damit steht direkt dran, wer nicht zurückfolgt (geprüft 27.08.2026) |
| **`GET /api/profiles/followers`** | T | ● | Wer dir folgt, gleiches Schema und dieselben Felder |
| `GET /api/profiles/mutual-followers` | T | ● | Wer dir folgt und du ihm — gleiches Schema. Für die Frage „wer folgt nicht zurück" **nicht nötig**: das Feld `is_following_viewer` an `following` beantwortet sie ohne zweite Liste |
| `GET /api/social/following-feed` | T | ◐ | Was Leute, denen du folgst, veröffentlichen |
| `GET /api/playlist/me` | T | ◐ | Deine Playlists — vermutlich das, was wir über Umwege holen |
| `GET /api/playlist/v2/{playlist_id}` | ? | ◐ | Eine Playlist mit Einträgen |

### Erzeugen und Bearbeiten (nicht unser Thema, aber vollständig)

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

### Zähler und Reaktionen — Handlungen, keine Auskunft

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

### Benachrichtigungen

| Weg | Token | | |
|---|---|---|---|
| `GET /api/notification/v2` | T | ● | siehe oben — **der Like-Strom** |
| `POST /api/notification/v2/read` | T | ◐ | Als gelesen markieren — **nicht aufrufen** |
| `POST /api/notification/v2/clear-badge` | T | ◐ | Zähler löschen — **nicht aufrufen** |
| `GET /api/notification/` (alt) | T | ● | Existiert, liefert leer, setzt `notified_at` bei jedem Aufruf — **nicht benutzen** |

### Feeds und Suche

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
| **`/api/download/clip/{clip_id}`** · `/cover` · `clips/zip/prepare` · `sample-pack/{clip_id}` | ● | Herunterladen. Die Vermutung von damals stimmte: **`download/clip` IST der saubere Weg** statt CDN — `?format=wav|mp3|m4a`, antwortet `processing` → `ready` mit signierter S3-Adresse, die ohne Token ladbar ist. Und er zählt als offizieller Download. Gefunden von Tarja, geprüft 27.08.2026. Vollständig in [WAV-PROTOKOLL.md](../archiv/WAV-PROTOKOLL.md) |

### Konto, Abrechnung, Sonstiges

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

### Fremde Profile lesen — die Falle und die Umgangsform (26.08.2026)

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

#### Der Hirschfaktor kostet Seiten

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

#### Es ist ihr Server, nicht unserer

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

### Was ich vorschlagen würde, in dieser Reihenfolge

1. **`aligned_lyrics/v3`** — wenn genauer als v2, sofort umstellen; kostet nur einen Vergleich
2. **`comment/{id}/replies`** — Antworten fehlen uns; `reaktionen.js` um eine Schleife erweitern
3. **`notification/v2`** im Lesezeichen mitholen — **der Like-Strom**, wer wann; in `reaktionen.ndjson` anhängen, Art `like`
4. **`gen/{id}/wav_file/`** prüfen — vielleicht sagt es, ob die WAV fertig ist, statt auf 403/200 zu pollen
5. **`clips/get_songs_by_ids`** — 73 Private in einem Aufruf statt 73
6. **`download/clip/{id}`** — ob das ein sauberer Medienweg ist

Nicht: `notification/v2/read`, `clear-badge`, `notification/` (alt), alles
unter `billing`, alles was `set_`, `toggle_`, `delete`, `trash` heißt —
das verändert dein Konto.


---
