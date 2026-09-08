# Suno-Wege — was wir sicher wissen (Kurzliste)

Stand 09.09.2026, 01:40. Für Tarja zum Draufschauen. Alle Wege liegen unter
`https://studio-api-prod.suno.com` und brauchen den Clerk-Token des
angemeldeten Browsers (`Authorization: Bearer …`). Nur Lesen; nichts hier
setzt ein Herz, schreibt einen Kommentar oder kostet Credits. Was wir
**nicht** aufrufen, steht am Ende. Lange Fassung mit Belegen:
`docs/SUNO-API.md`, `docs/SUNO-APP-WEGE.md`.

## A · Web-Wege, im KlangTresor in Betrieb

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

## B · Web-Wege, geprüft, nicht in Betrieb

| Weg | holt | Anmerkung |
|---|---|---|
| `GET /api/notification/v2?before_datetime_utc=…` | dasselbe wie v3, roh: `user_profiles` (höchstens drei), `total_users`, `content_id`, `content_title`, `content_message` | dazu `content_ancillary_id` = Kommentar-ID bei Kommentar-Ereignissen; `?after_datetime_utc=` = nur Neues seit. Bis 08.09. unser Weg |
| `GET /api/notification/v2/badge-count` | Zahl ungelesener | Lesen markiert nichts |
| `POST /api/feed/v3` (die App; im Web-Bündel auch `/feed/v3/offset`) | eigene Bibliothek, auch Private, mit Cursor — die Wrapper holen hier ihre Ergebnisse | Antwort `{clips, next_cursor, has_more}` |
| `GET /api/gen/{clip_id}/wav_file/` | fertige WAV-Adresse, wenn vorhanden | Erzeugen (`convert_wav`) kostet Credits — nur von Hand |

## C · App-Wege, belegt (Mitschnitt iPhone 09.09.2026, Android-Code gelesen)

| Weg | holt | Anmerkung |
|---|---|---|
| `POST /api/unified/feed` mit `{feed_id, page_size, cursor, target_user_id}` | Sunos generische Feed-Schicht | Kennungen: `generic_playlist:<playlist_id>` (Album, 50 je Seite, Cursor "50", "100"), `user_songs` (mit `request_metadata.sort_by`), `user_playlists`, `user_pinned_songs`, `user_hooks`, `user_personas`, `recommend_users` |
| `GET /api/profiles/v2/{handle}` · `/v2/by-id/{user_id}` | Profil in einem Stück: Kopf, Bio, Beziehung (`is_following`, `is_following_viewer`), Zähler, verschachtelter Feed der fünf Unterlisten, Pin-Texte | 425 KB je Aufruf |
| `GET /api/gen/{clip_id}/time-sync-comments?search_time=&search_range=&margin=&num_requested=&end_time=` | Kommentare an Zeitmarken im Titel | Liste von Kommentaren, `track_timestamp` |
| `GET /api/session` | Sitzungsstand der App | |
| `POST /api/playlist/sync/v2` mit `{playlists: [{playlist_id, sync_token, feed_id}]}` | Abgleich der Alben in einem Rutsch | Antwort `{playlists}` |
| `GET /api/cms/launch` · `cms/takeover/compact` · `cms/paywall` … | Inhalte für die App-Oberfläche (Bezahlseiten, Takeover) | kein Archivnutzen |
| `POST /api/mango/rights` | Rechteprüfung je Titel | App ruft es dreimal beim Öffnen eines Titels |

## D · Aus dem Android-Code bekannt, nie gerufen (Auswahl)

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

## Was wir nicht tun

- **Nichts, was schreibt oder kostet:** `update_reaction_type`, `comment`,
  `follow`, `convert_wav`, `download/*`, `generate/*`, `notification/v2/read`.
- **Kein Anklopfen.** Ein neuer Weg wird erst gerufen, wenn aus Code oder
  Mitschnitt klar ist, dass er nur liest — und dann einmal, mit Freigabe.
- **Keine Nachahmung der App-Kennung.** Wir sind ein Web-Client; wo wir
  einen App-Weg gehen (`likers/`, `notification/v3`), ist das so bekannt.
- **Zwischen Anfragen Pause** (260 ms), Seiten nur bis zum Ende.
