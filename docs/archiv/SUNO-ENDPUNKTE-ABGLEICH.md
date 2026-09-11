# Suno-Endpunkte — Abgleich der drei Recherchen gegen die Hauslisten

Stand 08.09.2026. Kein Abruf gegen suno.com oder studio-api. Grundlage: die drei
Blickwinkel (Wrapper, Playlist, Aktualität) Zeile für Zeile gegen
`docs/suno-api-wege.txt` (273 Wege, 19.08.), `docs/SUNO-API.md`,
`docs/DATENEXTRAKTION.md`, `docs/AUDIO-BEZUG.md`, `WAV-PROTOKOLL.md`,
`browser/morgens.js`, `bin/gesundheit.js` und das inzwischen gelöschte `bin/token.js`.

**Legende.** Token: `–` ohne, `T` Bearer, `C` `__client`-Cookie, `?` unklar.
Sicherheit: **belegt** = im Netz mit Mitschnitt oder Live-Prüfung 2026;
**plausibel** = aus Code oder Bundle, nicht mitgeschnitten; **geraten** =
nur Pfadname. „Im Haus bekannt?": **Roh** = steht in suno-api-wege.txt,
**API●/◐/○** = Stufe in SUNO-API.md, **Betrieb** = in einem Skript,
**nein** = in keiner Hausliste.

**Das Gesamtbild vorweg.** Von den rund 30 als „NEU" gemeldeten Wegen sind
**nur neun wirklich neu** (in keiner Hausliste). Der Rest stand schon in der
Rohliste vom 19.08. — neu ist dort nicht der Pfad, sondern der Anfragekörper,
die Parameter, die Antwortform oder die Kostenfolge. Die Rohliste bleibt die
breiteste Inventur, die es gibt; die Wrapper ergänzen sie, ersetzen sie nicht.

---

## A · Wirklich neu — steht in keiner Hausliste

| Weg | Methode | Token | Was | Quelle | Sicherheit | im Haus bekannt? | Nutzen |
|---|---|---|---|---|---|---|---|
| `/api/clips/direct_children_count?clip_id=` · `direct_children` · `direct_children_by_user/` | GET | T | Nachkommen eines Clips (Extend, Cover, Remaster), Zahl und Liste; 401 für fremde Clips | Nsomnia-Bundle-Liste 03/2026, BetterSuno 09/2026 | plausibel | **nein** | LIED-FAMILIEN abwärts: wer aus einem Caspar_D-Song was gemacht hat. Ergänzt `clips/{id}/attribution` (aufwärts) |
| `/api/clips/displayable_remixes` · `displayable_remixes_count` · `user_remixes_for_clip/` | GET | T | Öffentlich sichtbare Remixe eines Clips, mit/ohne Nutzerbezug | Nsomnia-Bundle 03/2026 | plausibel | **nein** (Roh kennt nur `clips/remixes` · `/count`) | Vermutlich die Nachfolger von `clips/remixes`; prüfen, welcher von beiden heute antwortet |
| `/api/persona/get-persona-paginated/{persona_id}/?page=N` | GET | T | Persona-Daten samt Clips, seitenweise | gcui-art PR #234 (02/2025, gemergt), 5 weitere Repos | belegt | **nein** (Roh kennt nur `get-persona/{id}/`) | Songs je Stimme listen — falls Caspar_D Personas nutzt; sonst ohne Wert |
| `/api/project/default` · `/api/project/default/pinned-clips` | GET | T | Standard-Workspace und dessen angeheftete Clips | rs-suno 09/2026 | belegt | halb: `project/{project_id}` als Platzhalter in Roh; `default` als Wert nirgends | Nur relevant, wenn Takes in Workspaces verschwinden (siehe `project/me` unten) |
| `/api/trending/` · `/api/trending/metaplaylist/` | GET | T | Trending-Clips als playlistartige Struktur | paperfoot 04/2026 (trending geprüft), Bundle | plausibel | **nein** | Ob ein Caspar_D-Song je im Trending stand — Reaktionen-Kontext, kein Archivweg |
| `/api/profiles/listen-history` | GET | T | Eigene Hörhistorie | nur Bundle-Pfad 03/2026 | geraten | **nein** | Hinweis für die nächste Erkundung, mehr nicht |
| `/api/library?page=N&page_size=N` | GET | T | Bibliothek, alter Stil | nur BetterSuno als 2. Rückfall; in keinem Bundle | geraten | **nein** (Roh-Treffer „library" sind `project/library/images|videos`) | Keiner. Nur genannt, weil im Auftrag nach „library" gefragt war |
| `/api/feed/?ids=a,b` · `/api/feed/?page=N` (v1) | GET | T | Alter Feed, antwortet noch (page=0 → 20 Clips, geprüft 22.08.2026) | echo-suno-operator, suno2api | belegt | **nein** als eigene Zeile (Roh hat nur v3, v3/offset) | Rückfall, falls v3 zickt. Kein Hauptweg — v2 ist schon verschwunden, v1 folgt |
| Kopfzeilen `browser-token` (base64 `{timestamp:ms}`) und `device-id` (Cookie `suno_device_id`) | — | — | Seit 05/2026 hängt die Web-App beide an jede studio-api-Anfrage | sunyu 09/2026, BetterSuno | belegt | **nein** | Erste Verdächtige, falls ein Leseweg plötzlich 401/403 gibt. Bisher braucht kein Hausskript sie |

**Nicht neu, aber in keiner Liste, weil es kein `/api/`-Pfad ist:**

| Weg | Methode | Token | Was | Quelle | Sicherheit | im Haus bekannt? | Nutzen |
|---|---|---|---|---|---|---|---|
| `auth.suno.com/v1/client?__clerk_api_version=2025-11-10&_clerk_js_version=5.117.0` · `POST …/client/sessions/{sid}/tokens` | GET/POST | C | Clerk ohne Browser: Client-Objekt, dann JWT prägen | gcui-art PR #265 01/2026, rs-suno, paperfoot | belegt | ~~Betrieb~~ — `bin/token.js` am 11.09.2026 **gelöscht**, Weg aufgegeben (docs/suno/WEGE.md) | Nur die Kennung ist alt: `CLERK_JS = '5.43.0'` (token.js:54) gegenüber 5.117.0 im Netz. Bisher folgenlos |
| `cdn1.suno.ai/{clip_id}.mp4` (Lyric-Video) | GET | – | Weiterhin unsigniert, ACAO `*`, Tonspur dekodierbar; mp3/wav am selben CDN 403 | juroku PR #34, 29.08.2026 | plausibel | **Betrieb** (`videoUrl` im Katalog, gesundheit.js prüft ihn; Archivieren seit 17.08. abgestellt) | Einzige kontingentfreie, unsignierte Tonquelle. Neu ist nicht der Weg, sondern sein Rang |

---

## B · In der Rohliste, aber in SUNO-API.md nur pauschal oder gar nicht eingeordnet

| Weg | Methode | Token | Was | Quelle | Sicherheit | im Haus bekannt? | Nutzen |
|---|---|---|---|---|---|---|---|
| `/api/session/` | GET | T | Bootstrap: `{configs, experiments, flags, models, roles, user}`. `models[]` = vollständiger Modellkatalog (Name, Fähigkeiten, Längengrenzen); `user` mit handle, clerk_id, E-Mail | rs-suno, paperfoot, sunyu | belegt | Roh; API nur unter „Anmeldung" ohne Beschreibung | Löst „`major_model_version` bei 25 Songs leer, `model_name` nur chirp" (DATENEXTRAKTION): Abbildung chirp-fenix=v5.5, chirp-crow=v5, chirp-bluejay=v4.5+, chirp-auk=v4.5. Außerdem der eigene Handle ohne Profilaufruf |
| `/api/billing/info/` → `download_usage` | GET | T | Download-Kontingent: `current_period_downloads_used/-limit` (60, Monat), `additional_download_remaining` (7, lebenslang), Zukauf | suno-cli, Suno-Credits-Panel; **im Haus am 06.09. gemessen** | belegt | Roh; API „billing … nicht unser Thema"; **Betrieb** (morgens.js:1107, AUDIO-BEZUG Nachtrag) | SUNO-API.md hinkt dem Haus hinterher: der Weg ist in Betrieb und gehört in „Was wir heute benutzen" |
| `/api/project/me?page=N&sort=max_created_at_last_updated_clip&show_trashed=false&exclude_shared=false` | GET | T | Workspaces: `{num_total_results, current_page, projects:[{id, name, clip_count, last_updated_clip, shared, created_at}]}`, 25 je Seite | Burp-Mitschnitt 25.08.2026, rs-suno | belegt | Roh; API nur „/api/project/… (13 Wege)" | Zeigt Sunos Listenmuster (`show_trashed`/`exclude_shared`-Schalter) — Analogie für `playlist/me`. Und: `feed/v3` nimmt `workspace_id` als Filter |
| `/api/persona/get-personas/?page=N` | GET | T | Eigene Personas, seitenweise (alternativ `continuation_token`) | echo-suno-operator CDP-Mitschnitt 08/2026, BetterSuno | belegt | Roh; API nur „/api/persona/… (6 Wege)" ◐ | Nur bei Persona-Nutzung |
| `/api/unified/search/omnisearch` | ? | ? | App-Suche | — | — | Roh; API ◐ | Keine neue Erkenntnis aus den Recherchen; bleibt ◐ |

---

## C · In SUNO-API.md schon da (◐/○) — neu sind Körper, Parameter, Antwort, Kosten

| Weg | Methode | Token | Was | Quelle | Sicherheit | im Haus bekannt? | Nutzen |
|---|---|---|---|---|---|---|---|
| `/api/feed/v3` | **POST** | T | Körper `{limit ≤100, cursor, filters}`; Filterwerte als Strings `'True'/'False'`: `trashed, disliked, liked, public, fromStudioProject:{presence}, user:{presence,user_id}, playlist:{presence,playlistId}, ids:{presence,clipIds:[]}, workspace_id, searchText`. Antwort `{clips, has_more, next_cursor}`. **Nimmt `page` nicht an.** Ohne Filter fehlen Papierkorb, Disliked, Stems, Studio-Clips | Burp 25.08.2026, Suno-Backup PR #1 (01.09.), rs-suno, sunyu, BetterSuno, OpenCLI | belegt | Roh; API ◐ **falsch beschrieben** als „seitenweise" — es ist Cursor, POST | Ersatz für `feed/v2?page=N` (DATENEXTRAKTION:27, 01-erkundung.js). `ids`-Filter: die 73 Privaten in einem Aufruf. `user_id` steht als Claim `suno.com/claims/user_id` im JWT |
| `/api/feed/v3/offset` | GET | T | Position/Anzahl einer Filtermenge; Suno-Backup zählt damit per Binärsuche versteckte Teilmengen | Suno-Backup PR #1 | plausibel | Roh; API ◐ (als „· /offset") | Erwartungswert für den Morgenlauf, ohne alles zu laden. Parametrierung nicht mitgeschnitten |
| `/api/clips/get_songs_by_ids?ids=a&ids=b` | GET | T | Mehrere Clips, Antwort `{clips:[…]}` im Feed-Schema; **ids als wiederholter Parameter**, 20 je Aufruf (rs-suno). `/api/get_songs_by_ids` ohne `clips/` → 404 | rs-suno, Suno-Backup | belegt | Roh; API ◐ (Vorschlag 5); morgens.js sondiert mit `?ids=<eine id>` | 73 Private in vier Aufrufen statt 73 |
| `/api/mango/rights` | POST | T oder Gast (`glt`) | Lizenz für den verschlüsselten Player-Strom: `{content_params:{content_id, content_type:'clip'}}` → `{key, iv, glt}`; AES-256-GCM-verpackter AES-CTR-Schlüssel, Nutzerschlüssel SHA-256(JWT) bzw. SHA-256(glt), clip_id als AAD | BetterSuno (aus Sunos Webpack), sunyu (Testvektoren); **im Haus am 28.08. nachvollzogen** (AUDIO-BEZUG Weg 1) | belegt | Roh; API ○ „Rechteverwaltung?"; AUDIO-BEZUG kennt es vollständig | **Zwei Recherchen widersprechen sich im Urteil, nicht im Befund:** Wrapper: „Entscheidung für Caspar_D"; Aktualität: seit 03.09. laut Terms „circumvent … content protections" und „stream ripping" ausdrücklich untersagt, Kündigungsrisiko. SUNO-API.md sollte ○ durch die Beschreibung ersetzen und den Weg als gesperrt führen |
| `/api/download/clip/{clip_id}?format=mp3|wav|m4a` | GET | T | Unverändert `processing → ready → signierte S3-URL`. **Neu: seit 03.09. kontingentpflichtig** — ein Guthaben je Song schaltet M4A+MP3+WAV gemeinsam frei, Wiederholung kostet nichts, Stems zählen zum Song, abgebrochene nicht (Help-Center 13614785); Pro 20, Premier 60/Monat, Free 7 lebenslang, rückwirkend, kein Übertrag | Suno-Blog 11.08., MBW, Help-Center; Haus 06.09. gemessen (60 + 7) | belegt | Roh; API ● „der saubere Weg" **ohne Kostenfolge**; WAV-PROTOKOLL:192 und AUDIO-BEZUG-Nachtrag kennen das Limit | SUNO-API.md ist die einzige Hausdatei, die den Weg noch als folgenlos beschreibt. Und: die einmalige Sonde in morgens.js:980 (`download/clip/<probeId>`, ohne `format`) läuft in jedem neuen Browserprofil erneut — ob ein GET ohne `format` zählt, sagt keine Quelle |
| `/api/gen/{clip_id}/wav_file/` | POST | T | Fertige WAV abfragen; Antwort trägt `wav_file_url` | rs-suno (`parse_wav_url`), Suno-Backup | belegt | Roh; API ◐ (Vorschlag 4); morgens.js sondiert es per **GET** | Vorschlag 4 bestätigt — aber als POST. Die GET-Sonde in morgens.js liefert deshalb vermutlich 405. Offen: ob `convert_wav` seit dem Unlock-Modell noch nötig ist oder `download/clip?format=wav` selbst anstößt |
| `/api/playlist/me?page=N&show_trashed=false&show_sharelist=false` | GET | T | Aufrufform der Web-App. Antwort `{num_total_results, current_page, playlists:[Kopf]}`; **oben** = Albenzahl, **im Kopf** = Eintragszahl der Liste (neben `song_count`). Kopf: `is_owned, is_public, is_trashed, is_hidden, is_discover_playlist, reaction, user_handle, user_display_name, entity_type, total_duration, play_count, upvote_count, playlist_clips:[]` (leer). 12 je Seite, page ab 1 | Burp 25.08.2026; BetterSuno, rs-suno, SunoSync, SunoManager identisch; suno-ai-proxy kannte `show_trashed` schon 04/2024 | belegt | Roh; API ◐ „vermutlich"; **Betrieb** seit 17.08. (DATENEXTRAKTION:28, morgens.js:600) — **ohne beide Schalter** | Das ist der Albumweg. Ob ohne Schalter Papierkorb-Alben mitkommen, ist unbelegt — deshalb setzen. SUNO-API.md ◐ → ● (das Haus benutzt ihn seit drei Wochen) |
| Felder `is_owned` / `user_handle` / `reaction` im `/me`-Kopf | — | T | Ob die Liste dem Konto gehört, wem sie gehört, ob man reagiert hat. **Ob `/me` gespeicherte fremde Listen mitliefert: nicht belegt** (Indizien: `is_owned` in einer me-Liste, `playlist/v2/{id}/save` und `playlist_reaction/…/update_reaction_type/` in der Rohliste, Seitenroute `/me/liked-playlists`; Gegenindiz rs-suno: „authoritative own set"). BetterSuno sah `is_owned` auch fehlend/false und setzt es per Hand | Burp 25.08., SunoGenerator 2024, BetterSuno | plausibel | nein (Felder nirgends dokumentiert) | aufbereiten.js/morgens.js könnten `is_owned===false` melden statt stumm mitzuschreiben. Prüfbar mit einem Abruf |
| `show_sharelist` (Schalter an `/me`) | — | T | Bedeutung unbelegt; Bundle hat Seitenrouten `/playlist/liked/` und `/playlist/sharelist/` nebeneinander → vermutlich Systemliste wie „Liked" | Bundle | geraten | nein | Mit `=true` sehen, ob Suno eine Systemliste führt, die im Katalog fehlt |
| `/api/playlist/{id}/?page=N` (v1) | GET | – öffentl. / T privat | `{id, name, description, image_url, playlist_clips:[{clip, relative_index, updated_at|created_at}], num_total_results, current_page, is_owned, is_trashed, is_public, song_count}`; öffentliche ohne Token; page=0 == page=1; Gesamtzahl zählt Gelöschte mit | suno-radio, SunoGenerator, SunoManager 05/2026, rs-suno 09/2026, downloader-web | belegt | Roh; **Betrieb** (morgens.js:682); DATENEXTRAKTION kennt beide Fallstricke | Bestätigt den Hausweg von außen: „Seite bringt nichts Neues → Abbruch" ist Stand der Technik. `updated_at` statt `created_at` je nach Quelle — das Haus liest `created_at` |
| `/api/playlist/v2/{id}?page=N&page_size=50` | GET | ? | Erste Wahl bei BetterSuno/bettersuno-mcp, v1 als Rückfall. **Antwortform nirgends mitgeschnitten** — beide suchen das Clip-Array heuristisch unter `playlist_clips|playlist_songs|songs|tracks|clips|results|items` | BetterSuno 09/2026 | plausibel | Roh (7 v2-Zeilen); API ◐; **WAV-PROTOKOLL:130 und AUDIO-BEZUG warnen: „liefert oft Metadaten ohne Songs"** | Das Haus hat hier die konkretere Beobachtung als alle Wrapper. v1 bleibt; v2 nur zum Vergleich |
| `POST /api/feed/v3` mit `filters.playlist={presence:'True', playlistId}` | POST | T | Album-Inhalt per Cursor statt Seite | nur BetterSuno als 4. Rückfall, nie mitgeschnitten | plausibel | nein (als Filter) | Falls er greift: Inhaltsweg ohne page=0/1-Falle, mit vollständigen Clip-Objekten — aber weiter ein Aufruf je Album |
| `/api/search/` | POST | T | Körper `{search_queries:[{name, search_type, term, from_index:0, size:100, rank_by:'most_relevant'}], tune_results:false, tuned_offset:0}`; `search_type`: public_song, similar_song, library_song, library_playlist, library_persona, public_persona, tag_song, genre_preview_song, playlist, following_clip_feed, user, hybrid_search, ensemble_similar. Antwort unter `result.<name>.result` | rs-suno, paperfoot, BetterSuno | belegt | Roh; API ◐ „Suche nach Songs, nach Leuten" | Fremde Playlists finden, in denen Caspar_D-Songs liegen (`playlist`, Titelsuche); `similar_song` für den Nachbarschaftsvergleich |
| `/api/clips/parent?clip_id=` | GET | T | Ein Schritt aufwärts in der Abstammung; 401 für fremde Clips | rs-suno (Lineage) | belegt | Roh; API ○ „Verwandte Clips?" | LIED-FAMILIEN: Fassungen über Extend/Remaster zurückverfolgen. ○ → ◐ |
| `/api/gen/{clip_id}/aligned_lyrics/v2/` | GET | T | Bestätigt als der Weg, den alle nutzen (Gist 12.08.2026, suno-cli, Chrome-Extension 07.07.2026). Seit Jahreswechsel doppelte `__session`-Cookies — betrifft Cookie-Leser, nicht `window.Clerk`. **v3 erwähnt niemand außer der Hausliste** | Gist dansleboby, suno-cli | belegt | Roh; API ● | Der v2/v3-Vergleich (Vorschlag 1) bleibt ein Hausprojekt, niemand hat ihn gemacht |
| `/api/gen/trash` `{clip_ids, trash}` | POST | T | Ersetzt seit 07/2026 `POST /api/feed/trash` (jetzt 404) | suno-cli Commit 20.07.2026 | belegt | Roh; API ◐ (nicht aufrufen) | Nicht für uns. Aber der **Präzedenzfall**: Wege, die in der 19.08.-Liste fehlen, werden wirklich abgeschaltet — Begründung, `feed/v2` zu ersetzen |
| Clerk-JWT-Lebensdauer | — | — | `exp`-Claim etwa 1 h (alle Wrapper); rs-suno erneuert 60 s vor Ablauf; **studio-api weist Tokens aber nach ~30 min mit „Token validation failed" ab** (suno-cli, geprüft 07.04.2026) | paperfoot, ai-ecoverse, rs-suno, suno-cli | belegt | DATENEXTRAKTION:16 sagt „**rund 60 Sekunden**" — von keiner Quelle gestützt | Browser-Skripte (Token vor jeder Anfrage) sind unberührt und bleiben richtig. (betraf nur das gelöschte `bin/token.js`) |

---

## D · Veraltet oder widerlegt — Fundstellen im Haus

| Was | Wo im Haus | Befund | Quelle |
|---|---|---|---|
| `/api/profiles/<handle>/playlists` | morgens.js (bis heute; laut Kommentar :452 am 08.09. schon auf `playlist/me` + `playlist/<id>` umgebaut) | In keiner der ~50 Quellen, keine Code-Suche, kein Bundle. Geraten, tot. Profil-Playlists gibt es nur im **Körper** von `GET /api/profiles/{handle}/` (Feld `playlists`, die 16 sichtbaren) | alle drei Blickwinkel |
| Host `studio-api.prod.suno.com` (Punkt) | community-profile.js (3), community-hirsch.js, 01-erkundung.js (4), 02-sammeln.js, 02-sammeln-aktuell.js, 03-folgen-pruefen.js, gesundheit.js (2 von 4); DATENEXTRAKTION:26; SUNO-API.md (Beispiel „Fremde Profile"); AUDIO-BEZUG (mango, download); WAV-PROTOKOLL:33 | Die Web-App ruft seit 2026 nur `studio-api-prod.suno.com` (Bindestrich). Punkt antwortet noch, ist Altbestand ohne Garantie (sunyu: LEGACY) | Suno-Backup PR #1 live 01.09.2026; rs-suno, paperfoot, OpenCLI |
| `GET /api/feed/v2?page=N` „Arbeitsbereich" | DATENEXTRAKTION:27; browser/01-erkundung.js | Fehlt in der 19.08.-Liste; alle lebenden Wrapper auf v3. Kein 404-Beleg, aber der `feed/trash`-Präzedenzfall spricht dafür | Wrapper, Aktualität |
| `cdn1.suno.ai/<id>.mp3|.wav` ohne Anmeldung | DATENEXTRAKTION „CDN — ohne Anmeldung", „WAV — gelöst am 18.08."; bin/wav.js:51,138 | Seit Ende 08/2026 signierte CloudFront-URL Pflicht, 403 MissingKey für alle Clips 2024–2026. bin/wav.js dauerhaft außer Betrieb (AUDIO-BEZUG weiß das; DATENEXTRAKTION nicht) | gcui-art #289 29.08., juroku PR #33, Suno-Backup 42 Clips |
| Feld `audio_url` | Katalog, gesundheit.js | Steht auch für den Besitzer auf `/api/forbidden` (321/321). Nur noch Indikator | Haus 06.09., gcui-art #289 |
| `download/clip` „sauberer Weg" ohne Kostenfolge | SUNO-API.md (● unter Feeds) | Seit 03.09. kontingentpflichtig; WAV-PROTOKOLL:192 und AUDIO-BEZUG-Nachtrag wissen es, SUNO-API.md nicht | Suno-Blog, Help-Center |
| Massenhaftes WAV-Archivieren „möglich" | DATENEXTRAKTION („Damit ist massenhaftes Archivieren möglich") | Vorbei: 60/Monat + 7 | dito |
| „Token lebt nur rund 60 Sekunden" | DATENEXTRAKTION:16 | Keine Quelle; `exp` ~1 h, serverseitig ~30 min. Vermutlich Sekunden/Minuten verwechselt. Verhalten (vor jeder Anfrage neu) bleibt richtig | paperfoot, rs-suno, suno-cli |
| `CLERK_JS = '5.43.0'` | bin/token.js:54 | Netz: 5.117.0, `__clerk_api_version=2025-11-10`. Bisher folgenlos | gcui-art, paperfoot |
| `feed/v3` „seitenweise" | SUNO-API.md ◐ | POST mit Cursor, kein `page` | Burp, alle Wrapper |
| `playlist/me` ◐ „vermutlich das, was wir über Umwege holen" | SUNO-API.md | Seit 17.08. in Betrieb (DATENEXTRAKTION:28) — die beiden Hausdateien widersprechen sich | Haus selbst |
| `mango/rights` ○ „Rechteverwaltung?" | SUNO-API.md | Lizenzausgabe für den verschlüsselten Strom; AUDIO-BEZUG beschreibt es vollständig. Seit 03.09. laut Terms untersagt | BetterSuno, sunyu, Terms 09/2026 |
| Weg 1 in AUDIO-BEZUG.md („tragfähig, ohne Login") | docs/AUDIO-BEZUG.md | Technisch weiter richtig, vertraglich seit 03.09. untersagt („circumvent … content protections", „stream ripping"). Nicht in bin/ oder die Morgenroutine bauen | suno.com/terms-september-2026 |
| `gen/{id}/wav_file/` per GET sondieren | morgens.js:980 | Der Weg ist POST (rs-suno, Suno-Backup); die Sonde misst vermutlich 405 statt den Weg | Wrapper |
| Sonde `download/clip/<probeId>` in jedem neuen Browserprofil | morgens.js:980 (localStorage-Flag) | Ob ein GET ohne `format` ein Guthaben kostet, sagt keine Quelle. Nicht mehr blind laufen lassen | Wrapper, Aktualität |
| `/api/billing/clips/{id}/download/` | nicht im Haus (gcui-art-Nachfolger, OpenCLI) | Ersatzlos weg | Suno-Backup PR #1 |
| `audiopipe.suno.ai/?item_id=` | nicht im Haus | 200 mit 0 Byte | juroku 29.08. |
| `/api/me/v2/playlists`, `/api/me/playlists` | nicht im Haus (chadvis-Inventar) | Vom Burp-Mitschnitt ausdrücklich als falsch korrigiert: Seitenrouten, keine API. **Warnliste** — nicht wieder raten | Playlist-Blickwinkel |
| `/api/playlist/{id}/tracks`, `/clips` | nicht im Haus | Nie belegt, nicht im Bundle. Warnliste | dito |
| `clerk.suno.com` | nicht mehr im Haus | Seit 01/2026 `auth.suno.com`; token.js ist um | gcui-art PR #265 |

---

## Wo die drei Recherchen sich widersprechen

| Punkt | Wrapper | Playlist | Aktualität | Was zählt |
|---|---|---|---|---|
| `mango/rights` nutzen? | „Entscheidung für Caspar_D, keine technische" | — | „seit 03.09. untersagt, nicht bauen" | Der Terms-Wortlaut ist das härtere Faktum; die Entscheidung liegt trotzdem bei Caspar_D — aber mit dieser Vorlage |
| Download-Zählung | „ob je Song oder je Format: offen" | — | Help-Center: je Song, alle Formate gemeinsam, Wiederholung frei | Help-Center ist die spezifischere Quelle |
| JWT-Lebensdauer | `exp` ~1 h | — | serverseitig ~30 min Abweis | Beides stimmt; 30 min ist die praktische Grenze |
| `playlist/v2` | „erste Wahl der BetterSuno-Kaskade" | „Antwortform unbekannt, v1 behalten" | „plausibel weiter gültig" | Das Haus weiß es am besten: v2 liefert oft keine Songs (WAV-PROTOKOLL:130). v1 |
| `feed/v3` mit `user`-Filter für fremde Songs | „möglicherweise, nur bei BetterSuno" | — | — | Unbelegt; Profil-API bleibt der Weg für Fremde |

---

## Was das für den Albumweg heißt

Der zweistufige Weg **`/api/playlist/me` → `/api/playlist/<id>/`** ist von allen
2026er-Wrappern unabhängig bestätigt und bleibt richtig. Kein Weg liefert Köpfe
und Einträge in einem. Vier Nachbesserungen, alle klein:

1. **Beide Schalter setzen:** `?page=N&show_trashed=false&show_sharelist=false`.
   Das ist die Aufrufform der Web-App; ohne sie ist die Vorgabe unbekannt.
2. **`num_total_results` oben** ist die Albenzahl — der `lautSuno`-Vergleichswert,
   den morgens.js braucht, ist belegt vorhanden. Die gleichnamige Zahl **im Kopf**
   ist die Eintragszahl der einzelnen Liste (zählt Gelöschte mit — daher die
   sechs fehlenden Einträge aus DATENEXTRAKTION).
3. **`is_owned` und `user_handle` je Kopf lesen** und `is_owned===false` melden,
   statt fremde/gespeicherte Listen stumm als eigene zu führen.
4. **v2 nicht.** `feed/v3` mit `playlist`-Filter nur als Versuch, nicht als Weg.

Fremde Profile: Playlists gibt es nur im Körper von `GET /api/profiles/{handle}/`
(Feld `playlists`, die sichtbaren — daher 16 gegenüber 25). Kein Unterpfad.

---

## Was Caspar_D selbst prüfen könnte

Alle mit Bindestrich-Host. Wege mit `–` gehen in der **Adresszeile** des
angemeldeten Browsers. Wege mit `T` brauchen den Bearer — in der Konsole auf
suno.com, ein Einzeiler, nur lesend:

```js
const t=await Clerk.session.getToken();
await (await fetch('https://studio-api-prod.suno.com'+WEG,{headers:{Authorization:'Bearer '+t}})).json()
```

| Nr. | Frage | GET (WEG) | Worauf schauen |
|---|---|---|---|
| 1 | Zählt `/me` anders mit Schaltern? | `/api/playlist/me?page=1&show_trashed=false&show_sharelist=false` und dieselbe Seite **ohne** Schalter | `num_total_results` oben: gleich oder verschieden? Wenn verschieden, kamen bisher Papierkorb-Alben mit |
| 2 | Liefert `/me` fremde Listen? | `/api/playlist/me?page=1&show_trashed=false&show_sharelist=false` | Je Kopf `is_owned`, `user_handle`, `reaction`. Ein `is_owned:false` beantwortet die Frage |
| 3 | Gibt es eine Systemliste? | `/api/playlist/me?page=1&show_trashed=true&show_sharelist=true` | Taucht ein Kopf auf, der im Katalog nicht steht (`is_trashed`, `is_discover_playlist`, Name „sharelist"/„liked")? |
| 4 | Was sagt v2 wirklich? | `/api/playlist/v2/<id eines beliebigen Albums, nicht des ersten>?page=1&page_size=50` | Feldname des Clip-Arrays (`playlist_clips`/`tracks`/leer?), ob `song_count`/`is_owned` dabei sind. Ein Abruf klärt, was drei Wrapper raten |
| 5 | Mehrere Clips in einem? | `/api/clips/get_songs_by_ids?ids=<id1>&ids=<id2>` (zwei eigene Private) | 200 mit `clips:[2 Einträge]`? Dann 73 Private in vier Aufrufen |
| 6 | Modellkatalog für die 25 Leeren | `/api/session/` | `models[]`: Namen wie `chirp-fenix`, `chirp-crow` mit Anzeigenamen. Achtung: `user` trägt die E-Mail — nicht in Protokolle kopieren |
| 7 | Abstammung aufwärts | `/api/clips/parent?clip_id=<id eines Remasters/Extends>` | 200 mit dem Elternclip? Dann ist LIED-FAMILIEN einen Weg reicher |
| 8 | Verstecken sich Takes in Workspaces? | `/api/project/me?page=1&show_trashed=false&exclude_shared=false` | `projects[].clip_count` summieren, gegen die ~2200 aus dem alten feed/v2 halten |
| 9 | Lebt der Punkt-Host noch? (kein Token, Adresszeile) | `https://studio-api.prod.suno.com/api/profiles/caspar_d/?page=1&playlists_sort_by=upvote_count&clips_sort_by=created_at` und dasselbe mit `studio-api-prod` | Beide 200? Dann ist der Host-Umzug im Haus nicht dringend, aber fällig |
| 10 | Hat das Konto noch Guthaben? | `/api/billing/info/` | `download_usage` — **vor** jedem WAV-Lauf, nie danach |

Nicht prüfen: alles mit `set_`, `toggle_`, `trash`, `delete`, `read`,
`clear-badge`; `download/clip` ohne Blick auf Nr. 10; `mango/rights` gar nicht.
