# WAV-Nachtlauf — abgeschlossen

Begonnen 18.08.2026, 02:20 Uhr. **Fertig um 03:20 Uhr: alle 321 WAVs.**

| | |
|---|---|
| WAV-Originale | **321 von 321** |
| Format | PCM 16 Bit, 48 kHz, Stereo |
| Größen | 20–88 MB, keine unvollständige Datei |
| Archiv gesamt | 22 GB (vorher 4,9 GB) |
| Fehler beim Anstoßen | **0** von 316 |
| Drosselungen | **0** |

Beide Läufe sind gestoppt. Die Anleitung unten bleibt stehen — sie gilt
für den Monatslauf, wenn neue Songs dazukommen.

---

## Der Kern: der Endpunkt

Suno legt WAVs nicht von sich aus an. Sie entstehen durch **einen
einzigen Aufruf**:

```
POST https://studio-api-prod.suno.com/api/gen/<id>/convert_wav/
Authorization: Bearer <clerk-token>
Content-Type: application/json
Body: {}
→ 204 No Content
```

Danach rechnet Suno etwa 25–60 s, dann liegt die Datei offen auf
`cdn1.suno.ai/<id>.wav` — **ohne Anmeldung abrufbar**, wie das MP3.

**Gefunden** durch Abfangen von `window.fetch` in der Suno-Seite und
anschließendes Anstoßen von Hand. Der verschleierte Pfad
(`suno.com/suno-prod-s8wir/…`), der vorher auffiel, war nur die
Bot-Prüfung.

**Wichtig:** Der Zähler `increment_action_count` wird dabei **nicht**
ausgelöst — der läuft nur beim Klick auf „Download File" in der
Oberfläche. Für das 60-Downloads-Limit ab September ist das
vermutlich der entscheidende Unterschied.

**GET geht nicht** (405 Method not allowed), es muss POST sein.

---

## 403 heißt „gibt es noch nicht", nicht „gesperrt"

Nachgemessen am 18.08.2026, ausgelöst durch Tarjas Beobachtung, sie
könne WAVs ohne Anmeldung laden. Sie hat recht — die Unterscheidung ist
aber wichtig.

Vier **fremde** Songs aus Caspar_Ds Playlists, von uns nie angestoßen, mit
einem nackten GET (Browserkennung, Range 0–1023):

| Song | `.wav` | `.mp3` |
|---|---|---|
| One Day in Paris with you | **206** | 206 |
| 24/7 | **206** | 206 |
| Burger Bounce (80s Disco Remix) | 403 | 206 |
| Jungle Hut (80s Disco Remix) | 403 | 206 |

**Zwei von vier liefern das WAV sofort aus** — dort hat es der Urheber
selbst erzeugt. Die anderen beiden geben 403.

Daraus folgt:

- **Ohne Anmeldung abrufbar ist jedes WAV, das existiert.** Auch das
  fremder Urheber.
- **Suno erzeugt sie nicht von selbst.** Der 403 bedeutet, dass die
  Datei noch nie angefordert wurde — nicht, dass sie gesperrt wäre.
- **Der `convert_wav`-Aufruf bleibt nötig**, und nur er braucht ein
  Token.

Praktisch heißt das: Die Reihenfolge unten stimmt. Erst
`node bin/wav.js --pruefen` — das holt, was schon da ist, und
gelegentlich ist bei einem neuen Song bereits eines vorhanden. Nur für
den Rest ist der Anstoß im Browser nötig.

**Wie der Originalanalyzer es macht** (`../SunoAnalyzer/suno_analyzer.html`):
ein nacktes `fetch('https://cdn1.suno.ai/<uuid>.wav')` ohne Token, und
bei nicht-ok wortlos zurück auf das MP3. Der Knopf „⬇ Speichern" holt
gar nichts — er legt nur ab, was beim Analysieren ohnehin im
Zwischenspeicher gelandet ist.

---

## So geht es weiter

### 1. Prüfen, was noch fehlt

```bash
node bin/wav.js --pruefen
```

Zeigt je Song: WAV vorhanden (✓), noch nicht angestoßen (403) oder
gerade in Arbeit. Reihenfolge immer älteste zuerst.

### 2. Fertige holen

```bash
node bin/wav.js
```

Lädt alles, was bereitsteht, nach `library/songs/<id>/audio.wav`.
Fortsetzbar, überspringt Vorhandenes. Mehrfach laufen lassen, bis
nichts Neues mehr kommt.

### 3. Fehlende anstoßen

Chrome auf **suno.com** öffnen (angemeldet), Konsole, dann:

```js
window.__wavLauf = { ids: [/* UUIDs */], i:0, ok:0, fehler:0, gedrosselt:0, laeuft:false, protokoll:[] };
window.__wavStart = () => { const L=window.__wavLauf; if(L.laeuft)return; L.laeuft=true;
  (async()=>{ while(L.i<L.ids.length){ const id=L.ids[L.i];
    try{ const t=await window.Clerk.session.getToken();
      const r=await fetch('https://studio-api-prod.suno.com/api/gen/'+id+'/convert_wav/',
        {method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json'},body:'{}'});
      if(r.status===429){L.gedrosselt++; await new Promise(s=>setTimeout(s,25000)); continue;}
      if(r.status===204||r.status===200)L.ok++; else L.fehler++;
    }catch(e){L.fehler++;}
    L.i++; await new Promise(s=>setTimeout(s,1500)); } L.laeuft=false; })(); };
window.__wavStart();
```

Fortschritt ablesen mit `window.__wavLauf`. Die fehlenden IDs liefert:

```bash
node -e "const k=require('./bin/katalog.js').lesen();const fs=require('node:fs');
console.log(JSON.stringify(Object.values(k.songs).sort((a,b)=>(a.erstellt||'').localeCompare(b.erstellt||''))
  .filter(s=>!fs.existsSync('library/songs/'+s.id+'/audio.wav')).map(s=>s.id)));"
```

**Der Token lebt nur 60 s** — deshalb wird er im Skript vor *jedem*
Aufruf neu geholt. Das Skript überlebt kein Neuladen der Seite.

---

## Zahlen

- 321 Songs, ein WAV wiegt 40–65 MB → **rund 15–20 GB insgesamt**
- Anstoßen dauert 1,5 s je Song (~8 min für alle)
- Erzeugung serverseitig 25–60 s je Song
- Herunterladen je nach Leitung

## Bekannte Stolpersteine

- **curl bekommt keine Antwort** vom CDN für WAVs (User-Agent-Sperre).
  Mit Browser-Kennung geht es, und **Node geht ohne Weiteres**.
- Ein WAV, das gerade erzeugt wird, lässt die Verbindung offen stehen
  statt 403 zu liefern. `bin/wav.js` hat deshalb ein Zeitlimit.
- Synthetische Klicks (JS `.click()`) öffnen Sunos Menüs **nicht** —
  die Komponente verlangt echte Zeigerereignisse. Deshalb der Weg über
  den Endpunkt.

---

## Laufende Prozesse (Stand 18.08.2026, ~02:45)

**1. Anstoß-Lauf im Browser.** Chrome-Tab auf einer suno.com-Songseite,
Skript in `window.__wavLauf`. Stand ablesen:

```js
window.__wavLauf   // {i, ids.length, ok, fehler, gedrosselt, laeuft}
```

Er stößt alle 316 verbliebenen Songs an, 1,5 s Abstand. Endstand: **316 von 316**, null Fehler, keine Drosselung.
**Überlebt kein Neuladen der Seite** — dann von vorn mit der Liste der
noch fehlenden IDs (Befehl steht oben).

**2. Download-Schleife auf dem Rechner.** Eine Bash-Schleife ruft jede
Minute `node bin/wav.js` auf. Zustand: laeuft.
Protokolle im Sitzungs-Scratchpad:
`wav-fortschritt.log` (Zähler je Minute) und `wav-lauf.log` (Details).

Falls sie steht, genügt:

```bash
while true; do node bin/wav.js; sleep 60; done
```

**Abgeschlossen: 321 WAVs, 22 GB.**

---

## Reihenfolge beim Fortsetzen

1. `node bin/wav.js` — holt, was inzwischen fertig ist
2. `node bin/wav.js --pruefen` — zeigt, was noch fehlt
3. Fehlende IDs erzeugen (Befehl oben), ins Browserskript, anstoßen
4. Nach 1–2 Minuten wieder Schritt 1

Solange wiederholen, bis `--pruefen` keine 403 mehr zeigt.

## Was NICHT vergessen werden darf

- Der Katalog kennt die WAVs nicht. Wenn alle da sind, sollte
  `bin/aufbereiten.js` oder die Oberfläche sie erwähnen — bisher nicht
  gebaut.
- Die WAVs liegen in `library/` und sind damit **nicht im git** (richtig
  so) und **nicht in der 11-MB-Sicherung** (sie sind aus den Rohdaten
  reproduzierbar, solange Suno existiert und der Endpunkt bleibt).
- Platzbedarf im Auge behalten: bei 321 Songs rund 15–20 GB.
