# Die Wege der Suno-App (Android)

Stand 08.09.2026. Quelle: Suno-App für Android, Version 1.88.0-410
(APKMirror, von Caspar_D geladen, abgelegt unter
`/Volumes/Extreme_SSD/Entwicklung/apk/`). Werkzeug: `bin/suno-app-wege.js`.
Vollständige Liste: `docs/suno-app-wege-1.88.0.txt` (246 Wege, 48 Dienste);
Rohfassung mit allen 721 Schemata: `library/suno-wege/app-1.88.0.json`.

## Warum

Die Web-App (suno.com) kennt keinen Weg zu allen Personen, die einen Titel
geherzt haben — die Handy-App zeigt sie. Also hat die App Wege, die nicht
in den Web-Skripten stecken (`docs/suno-api-wege-2026-09-08.txt`, 370 Wege
aus elf Seiten). Statt zu raten oder an Endpunkte anzuklopfen, lesen wir
sie aus der App selbst. Kein Netz, keine Ausführung von App-Code.

## Verfahren — belegt, nicht geraten

1. **Auspacken.** Das `.apkm` ist ein Zip mit `base.apk` und Splits; die
   `base.apk` ist ein Zip mit fünf `classes*.dex`. Natives Kotlin, kein
   JavaScript-Bündel. Basis-URL im Code: `https://studio-api-prod.suno.com/api/`
   (dazu `studio-api-staging.suno.com`).
2. **Retrofit-Schnittstellen.** Jeder Dienst (`…/common_networking/remote/*Service`)
   ist eine Java-Schnittstelle; jede Methode trägt Verb und Pfad als
   Annotation, jeder Parameter `@Path`, `@Query` oder `@Body`. Das steht
   im dex-Format in der `annotations_directory` der Klasse und wird ohne
   fremde Werkzeuge gelesen (Dateiformat: source.android.com, dex-format).
3. **R8 hat die Annotationsklassen umbenannt** (`Lji5;` statt
   `Lretrofit2/http/GET;`). Die Zuordnung steht aber in Retrofits eigenem
   Parser (`RequestFactory.parseMethodAnnotation`): je Verb ein
   `instance-of` auf die Annotationsklasse, direkt gefolgt vom Verb als
   Zeichenkette. Das Werkzeug liest diese Paare aus dem Bytecode:
   `Lu73;`=DELETE, `Lji5;`=GET, `Ln6a;`=PATCH, `Lr6a;`=POST, `Lu6a;`=PUT,
   `Lgk9;`=OPTIONS. Gegenprobe: `notification/v2` → GET, `notification/read/`
   → POST, `gen/{gen_id}/update_reaction_type/` → POST — genau wie im Web.
4. **Parameter.** Steht `{wert}` im Pfad, ist es `@Path`, sonst `@Query`;
   ohne Wert `@Body` (Retrofits Parser bestätigt Body/Url/Tag/Part).
5. **Schemata.** kotlinx.serialization schreibt die Feldnamen jeder Klasse
   in den statischen Initialisierer ihres `$$serializer`; das Werkzeug
   liest dort alle `const-string` in Reihenfolge. Gegenprobe:
   `RemoteNotification` = id, priority, updated_at, is_read,
   notification_type, user_profiles, total_users, content_id, content_title,
   content_image_url, content_message — das sind die Felder, die
   `notification/v2` tatsächlich liefert (gemessen 08.09.2026).
6. **Grenzen.** HEAD kommt nicht vor. Rückgabetypen sind teils umbenannt
   (`Lv55;` = Flow-Hülle, `e9f` = Unit). Feldnamen ohne Typ; Aufzählungen
   (z. B. `template`, `action.type`) stehen als lose Strings im Code
   (`profile`, `clip`, `playlist`, `url`, `deeplink`, `navigate`, `expand`,
   `see_all`, `single`), ihre Zuordnung ist nicht belegt.

## Zahlen

| | |
|---|---|
| Dienste (Retrofit-Schnittstellen) | 48 |
| Wege (Methoden) | 246 |
| verschiedene Pfade | 229 |
| davon **nicht** in den 370 Web-Wegen | 96 |
| Schema-Klassen mit Feldnamen | 721 |

## Herzen — der Befund

**Es gibt keinen Weg „alle Personen, die Titel X geherzt haben".** Nicht in
der App, nicht im Web. Drei Wege setzen ein Herz:

| Weg | Verb | Körper | Wo |
|---|---|---|---|
| `gen/{gen_id}/update_reaction_type/` | POST | `RemoteUpdateReactionBody {reaction, …}` | Web und App |
| `gen/{gen_id}/like/` | POST | `LikeSpec {like}` | nur App |
| `unified/items/reaction` | POST | `RemoteGenericReactionBody {feed_params, action}` → `{success, content_id, current_user_liked, like_count}` | nur App (generischer Feed) |

**Der stärkste Kandidat für die Liste, die die App zeigt:**
`GET notification/v3?before_datetime_utc=…&include_hooks=…` (nur App).
Antwort `UserNotificationV3Schema {notified_at, notifications,
next_before_datetime_utc}`, jede Benachrichtigung ein
`RemoteSduiNotification`:

```
id, notification_type, template, updated_at, is_read,
avatars[]      → RemoteSduiAvatar {image_url, action}
text[]         → RemoteSduiTextSegment {text, bold, action}
thumbnail_url,
action         → RemoteSduiAction {type, url, handle}
trailing_button → RemoteSduiTrailingButton {state, label, completed_label, action}
```

SDUI heißt „server-driven UI": der Server baut die Zeile fertig — Avatare
mit je einer Aktion (Typ `profile` + `handle`), Textsegmente mit Namen,
ein Folgen-Knopf. Die Web-App fragt `notification/v2` und bekommt je
Bündel höchstens drei `user_profiles`; v3 kann mehr tragen, weil es die
Zeile selbst beschreibt. **Ob v3 alle zwölf Beteiligten liefert, ist nicht
belegt** — das zeigt nur eine Antwort. Eine GET-Anfrage mit dem
Clerk-Token des Browsers wäre die Prüfung; sie ist ein App-Weg, kein
Web-Weg, und wird deshalb nur nach Freigabe durch Caspar_D gemacht.

Zweiter Kandidat: der Bildschirm ist ein generischer Feed
(`POST unified/feed {feed_id, cursor, page_size, seed_item_params,
target_user_id}`) mit `RemoteCreatorProfileFeedItem {…, reason,
contextual_reason}` — dann käme die `feed_id` aus `action.url` der
v3-Benachrichtigung. Auch das entscheidet erst die v3-Antwort.

## Neue Wege mit Nutzen für KlangTresor (Auswahl aus den 96)

| Weg | Verb | Antwort / Körper | Wofür |
|---|---|---|---|
| `notification/v3` | GET | s. o. | Herzen mit allen Beteiligten (zu prüfen) |
| `profiles/v2/{handle}` | GET | `RemoteProfileDetailsResponse {user_id, metadata, relationship, bio, social_links, stats, feed, pin_captions}` | Profil in einem Stück; `relationship` = folgt / gefolgt |
| `profiles/v2/by-id/{uid}` | GET | dito | Profil über die Nutzer-ID (aus `user_id` in Clips/Kommentaren) |
| `profiles/{handle}/recent_clips` | GET | — | jüngste Titel eines Profils, ohne Seitenlogik |
| `profiles/followers`, `profiles/following` | GET | `GetProfileFollowResponse {current_page, num_total_profiles, profiles, user_id}` | eigene Beobachter ohne Handle im Pfad |
| `user/clip_listen_history/` | GET | — | eigene Hörhistorie (Web: `profiles/listen-history`) |
| `playlist/me/clip_status` | GET | — | in welchen eigenen Alben ein Titel steckt |
| `playlist/sync/v2` | POST | — | Abgleich der Alben in einem Rutsch (Körper unbekannt) |
| `gen/{clip_id}/time-sync-comments` | GET | `search_time, search_range, margin, num_requested, end_time` | Kommentare an Zeitmarken im Titel |
| `trending/top/{period}/`, `trending/leaderboard/`, `trending/new/`, `trending/v2/` | GET | — | ob ein Caspar_D-Titel je in den Listen stand |
| `download/authorize` | POST | — | Kontingent-Freigabe eines Downloads (Credits — nicht automatisieren) |
| `search/users` | POST | `SearchQuerySchema {…, user_ids, …}` | Profile in Menge über IDs |
| `unified/feed`, `unified/items/*` | POST | generischer Feed | Sunos neue Feed-Schicht; ersetzt absehbar `feed/v3` |

Alles andere (`gems/*`, `queue/*`, `voice-verification/*`, `hooks/*`,
`generate/*`, `billing/*`) sind Erzeugungs- und Bezahlwege — Credits,
also nur von Hand in Suno.

## Regeln

- **App-Wege sind App-Wege.** Sie werden nicht aus dem Browser angeklopft,
  um zu sehen, was passiert. Erst Freigabe, dann eine Anfrage, dann Doku.
- **Neue App-Version → Werkzeug erneut laufen lassen**, Liste daneben
  legen, Unterschied notieren. Aufruf:
  `unzip base.apk` in einen Ordner, dann
  `node bin/suno-app-wege.js <ordner> <ausgabe.json> > <liste.txt>`.
- Die Web-Liste (`docs/suno-api-wege-2026-09-08.txt`) und diese Liste
  ergänzen sich; `docs/SUNO-ENDPUNKTE-ABGLEICH.md` bleibt die Stelle für
  „belegt / plausibel / geraten".
