# Audio-Bezug von Suno — Stand 28.08.2026

Betriebsnotiz zur Herkunft der Audiodaten. Fasst einen technischen
Hinweis aus dem Partnerprojekt zusammen; nachgeprüft an einem eigenen
Clip. Ergänzt und aktualisiert das ältere [WAV-PROTOKOLL.md](../WAV-PROTOKOLL.md),
das nur den offiziellen Download behandelt.

## Kurzfassung

Die alten öffentlichen Direktlinks sind nicht mehr nutzbar:

    https://cdn1.suno.ai/<UUID>.mp3     → HTTP 403
    https://cdn1.suno.ai/<UUID>.m4a     → HTTP 403
    https://cdn1.suno.ai/<UUID>.wav     → HTTP 403 (schon seit 27.08.)

Suno liefert die öffentliche Wiedergabe inzwischen verschlüsselt aus. Die
CloudFront-Datei enthält nur noch Chiffretext; der Webplayer bezieht eine
kurzlebige Lizenz und entschlüsselt den Stream im Browser.

Es gibt zwei tragfähige Wege. **Weg 1** für Wiedergabe und Analyse (ohne
Anmeldung), **Weg 2** für dauerhafte Dateien, die Suno als offiziellen
Download zählt (mit Anmeldung).

---

## Weg 1 — Wiedergabe und Analyse (ohne Suno-Login)

Dies ist der Ablauf, den auch Sunos eigener Embed-Player anonym benutzt.

1. **Aktuelle Medien-URL holen.**
   `GET https://suno.com/embed/<UUID>` mit einem Browser-User-Agent.
   Aus dem Feld `media_urls` im HTML die aktuelle `.m4a`-URL ziehen. Sie
   zeigt auf CloudFront und **rotiert** — nie fest verdrahten, immer neu
   auflösen.

2. **Lizenz holen.**
   `POST https://studio-api.prod.suno.com/api/mango/rights`
   ```json
   { "content_params": { "content_id": "<UUID>", "content_type": "clip" } }
   ```
   Header: `Origin: https://suno.com/`, `Referer: https://suno.com/song/<UUID>`,
   normaler Browser-User-Agent. Antwort: `{ "key", "iv", "glt" }`.

3. **Entschlüsseln** (im Client):
   - `key` = SHA-256 von `glt` (UTF-8) → AES-GCM-Schlüssel
   - `key` und `iv` aus Base64 dekodieren; die ersten 12 Byte = Nonce,
     der Rest = Chiffretext
   - AAD = die Song-UUID als UTF-8
   - Der per AES-GCM entpackte Schlüssel wird zum AES-CTR-Schlüssel, das
     entpackte `iv` zum CTR-Zähler (Länge 128)
   - Die CloudFront-`.m4a` laden, entschlüsseln, Ergebnis als `audio/mp4`
     behandeln. Für Whisper anschließend per ffmpeg nach MP3 wandeln.

**Grenzen und Regeln.**
- Die Audiodatei selbst läuft direkt zwischen Browser und Suno-CDN. Das
  Backend liefert nur die Medien-URL und die kurzlebige Lizenz weiter.
- **Kein offener Audioproxy.** Der Server reicht Metadaten und Lizenz
  durch, nicht den Audiostream.
- Metadaten- und Lizenzschritt gehören ins eigene Backend (sonst greift
  im Browser die CORS-Sperre gegen fremde Ursprünge).
- Die Lizenz ist kurzlebig; eine aufgelöste URL höchstens **eine Stunde**
  zwischenspeichern.
- Serverseitige Umsetzung braucht das Python-Paket `cryptography`.

**Nachgeprüft (28.08.2026):** an einem eigenen Clip — CloudFront-URL
aufgelöst, Lizenz bezogen, entschlüsseltes MP3 (3:55, 192 kbit/s, ~5,4 MB)
erzeugt. Kein Suno-Login nötig.

---

## Weg 2 — Offizieller Download (MP3 / M4A / WAV)

Unverändert gültig, siehe [WAV-PROTOKOLL.md](../WAV-PROTOKOLL.md) für die
Einzelheiten. Kurz:

- Braucht einen Clerk-JWT aus einer angemeldeten Suno-Sitzung
  (`Clerk.session.getToken()`).
- `GET https://studio-api.prod.suno.com/api/download/clip/<UUID>?format=wav`
  (oder `mp3` / `m4a`), pollen bis `status: ready` und `download_url`
  gesetzt sind. Der erste WAV-Abruf steht oft ein paar Sekunden auf
  `processing`.
- Die `download_url` (signierte S3-URL) **ohne** `Authorization`-Header
  laden, sonst antwortet S3 mit 400.
- Playlisten/Songs mit derselben Anmeldung über `GET /api/playlist/me`
  und `GET /api/playlist/{id}` (`playlist_clips`). `playlist/v2` meiden —
  liefert oft Metadaten ohne Titel.

Dieser Weg setzt das „offiziell heruntergeladen"-Flag und ist der
maßgebliche für dauerhaft archivierte Dateien.

---

## Faustregel

- **Streamen / analysieren** → Weg 1.
- **Eine dauerhafte Datei, die als offizieller Download zählt** → Weg 2.

## Was das für KlangTresor bedeutet

`bin/wav.js` holt die WAV noch über den toten Direktlink
`cdn1.suno.ai/<id>.wav` (Zeilen 51 und 138) und ist damit außer Betrieb.
Ein Umbau auf Weg 2 steht aus; der Bezug neuer Audiodateien läuft bis
dahin über den offiziellen Download-Endpunkt. Der bereits archivierte
Bestand ist nicht betroffen — er liegt lokal.
