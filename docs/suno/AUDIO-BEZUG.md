# Audio-Bezug von Suno — Stand 28.08.2026

Betriebsnotiz zur Herkunft der Audiodaten. Fasst einen technischen
Hinweis aus dem Partnerprojekt zusammen; nachgeprüft an einem eigenen
Clip. Ergänzt und aktualisiert das ältere [WAV-PROTOKOLL.md](../archiv/WAV-PROTOKOLL.md),
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

Unverändert gültig, siehe [WAV-PROTOKOLL.md](../archiv/WAV-PROTOKOLL.md) für die
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

---

# Nachtrag 06.09.2026 — Das Download-Kontingent, direkt von Suno

Am 03.09. traten Sunos Limits in Kraft. Alles hier ist an diesem Tag
gemessen, nicht übernommen.

## Der Stand der Wege

`node bin/gesundheit.js` und Einzelabrufe ergaben:

| Weg | Antwort |
|---|---|
| Suno-Seite, Profil-API, Kommentar-API | 200 |
| Bild-CDN, Video-CDN (GET + Range) | 206 |
| `suno.com/embed/<UUID>` | 200, `media_urls` mit CloudFront-Adresse |
| `GET /api/clip/<UUID>` (angemeldet) | 200 — **vollständige Metadaten samt Liedtext** |
| `GET /api/download/clip/<UUID>` (ohne Token) | 401 — Endpunkt lebt |
| Audio-Links im Katalog | **321 von 321** `…/api/forbidden` |

**Nur das Audiofile ist gesperrt, alles andere ist offen.** Das Feld
`audio_url` steht auch **für den Besitzer selbst** auf `forbidden`; der
Link-Weg ist restlos tot, `download/clip` ist der einzige verbliebene.

## Das Kontingent muß man nicht selbst zählen

`GET /api/billing/info/` (mit Clerk-Token) liefert es unter
`download_usage`:

```json
"download_usage": {
  "current_period_downloads_used": 0,
  "current_period_downloads_limit": 60,
  "additional_download_remaining": 7,
  "current_period_download_top_ups_purchased": 0,
  "current_period_download_top_up_purchase_limit": 60
}
```

**Zwei verschiedene Töpfe, und der Unterschied ist wichtig:**

| Topf | Menge | Verhalten |
|---|---|---|
| `current_period_downloads_limit` | 60 | **erneuert sich** jede Abrechnungsperiode |
| `additional_download_remaining` | 7 | **Lifetime-Freigaben** aus der Testphase — einmalig, sie kommen nie wieder |

Caspar_D, 06.09.2026: „die 7 sind die lifetime free downloads für den
trial user, die ich scheinbar auch bekommen habe, weil ich sie ja noch
nie verbraucht habe."

Die sieben sind also **kein Puffer, sondern ein Erbstück**. Wer sie
aufbraucht, hat sie für immer verbraucht. In der Anzeige gehören sie
deshalb getrennt ausgewiesen und nicht mit den 60 zusammengezählt — sonst
verschwinden sie unbemerkt.

## Der Monatsrhythmus hängt am Anker

`subscription_anchor` steht auf `2026-04-11T16:26:01Z`, `period` auf
`year` (Premier-Jahresplan, 288 USD, aktiv bis 11.04.2027). Der
Download-Zähler läuft aber **monatlich** und springt am Ankertag um:
der Zyklus reicht vom **11. zum 11.**, am 06.09. also 11.08.–10.09.

Daraus rechnet sich der nächste Stichtag ohne weitere Abfrage: Tag 11 des
Folgemonats, wenn heute nach dem 11. liegt, sonst Tag 11 des laufenden.

## Nachkaufen

`download_credit_packs` nennt vier Pakete: 1 Stück 2,99 USD, 3 für 8,95,
5 für 14,95, 10 für 29,90. Gedeckelt auf 60 Zukäufe je Periode
(`current_period_download_top_up_purchase_limit`).

## Zwei Irrtümer, ausgeräumt

**`is_download_unlocked` ist kein Zähler.** Das Feld steht auch bei
Liedern auf `false`, die längst hier liegen — „Okkultation" etwa, dessen
WAV samt Suno-Signatur im Archiv ist. Es bedeutet etwas anderes und darf
nicht als „schon geholt" gelesen werden. Maßgeblich ist allein
`download_usage`.

**Der Verbrauch steht auf 0, obwohl 321 WAVs hier liegen.** Die wurden in
früheren Perioden geholt, vor der Umstellung. Der Zähler beginnt mit der
neuen Regelung bei null.

## Was für den Import daraus folgt

Alles außer dem Audio läßt sich für einen neuen Song holen, ohne ein
einziges Download-Guthaben anzurühren — geprüft am Beispiel „Die Braut
von Corinth" (`e51c9946…`, erstellt 02.09.2026):

| | |
|---|---|
| Titel, Handle, Datum, Modell (`chirp-fenix`) | aus `/api/clip/<UUID>` |
| Dauer 368,2 s, Stil-Prompt, Zähler | ebenda |
| **Liedtext, 3786 Zeichen** | `metadata.prompt` |
| Bild | `cdn2.suno.ai/image_<UUID>.jpeg`, abrufbar |
| Audio | **nur** über `download/clip`, kostet ein Guthaben |

Der Katalogeintrag kann also vollständig entstehen, bevor überhaupt
entschieden ist, ob das Stück heruntergeladen wird.

---

# Nachtrag 07.09.2026 — „Unlock & Download" und wie die Dateien hereinkommen

## Was der Download-Dialog zeigt

Bei *Drei Punkte → Download* erscheint ein Fenster mit den Formaten
**M4A, MP3, WAV** (alle drei angehakt), darunter **MP4 video asset**
(getrennt, nicht angehakt) und **Stems & MIDI** (ausgegraut, eigenes
„Manage"). Der Knopf heißt **„Unlock & Download"**.

**Das Guthaben kostet den SONG, nicht die Datei.** Ein Unlock schaltet
alle drei Audioformate zusammen frei. Damit erklärt sich auch das Feld
`is_download_unlocked`: Es sagt, ob dieser Song freigeschaltet ist — und
steht bei älteren Liedern auf `false`, weil sie aus der Zeit vor der
Umstellung stammen.

Die Fußzeile des Dialogs nennt: **Plan Premier · Downloads 67 ·
Refreshes 9/11/26**. Suno **addiert** dort die beiden Töpfe (60 + 7) und
bestätigt den errechneten Stichtag. KlangTresor zeigt sie weiterhin
getrennt, nennt die Summe aber in Klammern, damit man Sunos Zahl
wiedererkennt.

## Der Weg der Dateien: bin/uebernehmen.js

Den Klick macht der Mensch, das Einsortieren die Ernte.

**Zugeordnet wird über die Signatur, nie über den Dateinamen.** Suno
schreibt in jede Datei `made with suno; created=…; id=<UUID>` — bei WAV
in den INFO/ICMT-Block hinter dem RIFF-Kopf, bei MP3 in den ID3-Kopf.
Gelesen werden die ersten 64 KB. Titel taugen nicht: Sie kommen doppelt
vor („Lakritz" zweimal), tragen Sonderzeichen, werden umbenannt oder
bekommen beim zweiten Download ein „ (1)".

Wer **keine** Signatur hat, wird nicht angefaßt. Eine Datei ohne sie ist
entweder von woanders oder ein Mitschnitt — beides gehört nicht ungeprüft
ins Archiv.

**M4A bleibt draußen.** Bei Suno ist es Opus im MP4-Container und damit
weder Master noch Analysegrundlage; der Bestand führt `audio.mp3` und
`audio.wav`. Nebenbefund: Der m4a-Datei fehlt die Klartext-Signatur in
den ersten 64 KB, sie wäre so ohnehin nicht zuzuordnen.

Nach dem Kopieren wird **gegengeprüft** — gleiche Größe, gleiche
Signatur. Stimmt etwas nicht, wird die Kopie gelöscht statt behalten.

```
node bin/uebernehmen.js                 Trockenlauf, zeigt nur
node bin/uebernehmen.js --tun           kopiert
node bin/uebernehmen.js --ordner <p>    anderer Ordner, wird gemerkt
node bin/uebernehmen.js --ersetzen      vorhandene überschreiben
node bin/uebernehmen.js --raeumen       Originale in den Papierkorb
```

## Es läuft in der Morgenroutine mit

Caspar_D, 07.09.2026: „selbst dort schaue ich nicht hin, wenn ich die
Ernte mache. Die Ernte muß es finden oder nach dem Ordner fragen, wo die
Downloads von Suno landen."

Der Schritt **„Heruntergeladene Audiodateien übernehmen"** steht deshalb
in `MORGEN_SCHRITTE` — **nach** dem Katalogbau, weil die Zuordnung den
Katalog braucht, und **vor** „Fehlende Medien laden".

**Der Ordner wird gemerkt.** Vorgabe ist `~/Downloads`. Liegt Sunos
Ablage woanders, sagt man es einmal mit `--ordner`; der Pfad landet in
`library/konfig.json` als `downloadOrdner` und gilt fortan. Kein Regler
in der Oberfläche — die Software kennt den Ort danach.

**Und sie fragt, wenn nichts da ist.** Stehen Lieder ohne vollständige
Audiodatei da und im Ordner liegt nichts, meldet das Skript das laut im
Protokoll, nennt die betroffenen Titel und den Befehl zum Ordnerwechsel —
statt still nichts zu tun.

## Erster Lauf, 07.09.2026

Zwei neue Lieder, beide über die Ernte im Katalog (321 → 323), beide ohne
Audio-Link (`forbidden`), Liedtext vollständig:

| | id | Text |
|---|---|---|
| Glut und Eis – Die Braut von Corinth | `89ef9f63` | 3785 Zeichen |
| Still you laugh | `71374645` | 2347 Zeichen |

Nach dem Unlock lagen sechs Dateien im Download-Ordner (je M4A, MP3,
WAV). Übernommen wurden vier — **139,4 MB**, die beiden M4A blieben
liegen. Von 24 weiteren Audiodateien im selben Ordner wurde keine
angefaßt: keine Signatur.
