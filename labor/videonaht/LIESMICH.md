# labor/videonaht – wie stark weichen Anfang und Ende der Bewegtbilder ab?

## Wozu

Caspar_D, 15.09.2026: aus allen Videos im Archiv ablesen, wie stark Anfang und Ende voneinander
abweichen, und daraus vorschlagen, ob ein Loop keinen Übergang, einen Neutralzustand (Nebel,
Unschärfe, Abbremsen) oder ein Ereignis (harte Taktnaht mit Blitz, Whip Pan) braucht. Randbedingung:
der Loop ist höchstens 10 s lang, der Übergang liegt innerhalb der 10 s.

Methode aus `docs/effektclip/VIDEO-PLAN.md`: §2 (Materialtypologie), §6.1 (Nahtsuche), §6.3–6.5
(Überblenden, Naht besitzen, Nahtquotient), §6.7 (Vorrat an Übergängen, Kopplung an den Quotienten).
Das Werkzeug misst und schlägt vor; es baut keine Übergänge und schreibt nichts in die Bibliothek.

**Ergebnis lesen:** `statistik.md` (von Hand geschrieben: Verteilungen, Tabelle je Video, Prüfung am
Bild, Grenzen).

## Aufruf

```
node labor/videonaht/videonaht.mjs [--jobs 4] [--neu] [--nur id,id]
```

- node 23, keine Pakete; `/usr/local/bin/ffmpeg` und `ffprobe` als Kindprozess.
- 4 worker_threads mit je höchstens einem ffmpeg. Ganzer Bestand rund 115 s, zweiter Lauf etwa 1 s.
- `--neu` rechnet alles neu, `--nur` nur die genannten Song-ids (volle id). Auch ein `--nur`-Lauf
  schreibt `ergebnis.json` und `tabellen.md` – dann nur mit diesen Videos; danach einmal ohne `--nur`
  laufen lassen (aus dem Cache, etwa 1 s).
- Liest nur: `library/songs/<id>/{artwork.mp4, artwork.sprung.mp4, eigen.mp4}`,
  `library/katalog.json.gz` (Titel).

| Datei | Inhalt |
|---|---|
| `ergebnis.json` | alle Kennzahlen je Video, Kennzahlen- und Schwellentexte |
| `tabellen.md` | maschinelle Verteilungen und Tabelle je Video, Formeln, Schwellen – **jeder Lauf überschreibt sie** |
| `statistik.md` | Auswertung von Hand – der Lauf fasst sie nicht an; nach Änderung der Rechnung nachziehen |
| `bilder/` | Kontaktbogen je Video (Start, 1/3, 2/3, Ende, Schnitt i, Schnitt j−1); `pruef-*.png` von Hand gezogene Einzelbilder (gitignored) |
| `cache/` | Rohkennzahlen je Video, Schlüssel Größe + mtime + `RECHEN_FASSUNG` (gitignored) |

Wer die Rohkennzahlen ändert, erhöht `RECHEN_FASSUNG` in `videonaht.mjs`.

## Kennzahlen

**Abstand d(a,b).** Beide Bilder auf lange Seite 256 (Seitenverhältnis erhalten, `scale flags=area`,
rgb24), in etwa 16×16 px große Blöcke geteilt. Je Block m = mittlere Farbabweichung (0..255),
**d = Maximum über die Blöcke** – das Maximum misst Sichtbarkeit, das Mittel nur Fläche (§6.5).
Aus demselben Durchgang: `d_mittel` (Mittel über die Blöcke) und `anteil` (Anteil der Blöcke mit m > 20).

**Bildwechsel und Nahtquotient.** c_i = d(i, i+1); p95 = 95. Perzentil der c_i.
- `quotient_roh` = d(N−1, 0) ÷ max(p95, 0,5): Sprung, wenn man das ganze Video loopt. Unter 1 unsichtbar.
- `quotient_normaler_wechsel` = Median der echten Wechsel ÷ p95 – der **Erwartungswert**, Bestandsmedian
  0,5. Eine perfekte Naht liegt dort, nicht bei 0.
- `schlussbild_wiederholt_anfang`: Naht kleiner als der halbe Median-Wechsel → das Schlussbild ist Bild 0,
  der gemeinte Loop ist [0, N−1).

**Nahtsuche (§6.1).** Clip [i, j) zwischen 4 s und min(10 s, Video). Kosten dd(i,j) = gewichtetes Mittel
aus d(i−1,j−1), 2·d(i,j), d(i+1,j+1) – mit den Nachbarbildern geglättet, damit die Bewegungsrichtung
zählt. Minimum gewinnt, Gleichstand die längere Länge.
- `quotient_bester_schnitt` = d(j−1, i) ÷ p95: der Sprung, den man beim Abspielen sieht.
- `landkarte`: bester Schnitt je 1-s-Fenster der Länge (4–5 … 9–10 s).
- `kleinster_sprung`: Schnitt mit dem kleinsten ungeglätteten Sprung, zum Vergleich.
- `misch_d_max_s` = 2·min(i, N−j)/fps: so lang darf ein mischender Übergang höchstens sein, ohne die
  10 s zu verlassen.

**Zeitkurve und Stationarität.** D(τ) = Median d(i, i+τ) für τ = 1 … 120 Bilder, dieselbe Kurve mit
`d_mittel`. S = Spitze von D_mittel ab τ = 15 ÷ D_mittel(15). Textur sättigt früh (S nahe 1),
Handlung wächst weiter.

**Harte Schnitte.** Ein Wechsel, der groß ist (> 20 und > 5× Median), deutlich größer als seine
Nachbarn (> 2,5×, Doppelbilder übersprungen) und mindestens 30 % der Fläche trifft. Kehrt das Bild in
2–4 Bildern zurück, ist es ein Blitz.

**Globale Bewegung.** 8 Bildpaare 15 Bilder auseinander, bester Versatz ±12 px und Maßstab 0,96–1,04.
`gewinn`, `verschiebung_prozent_s`, `zoom_prozent_s`, `richtungstreue`, `zoom_treue`.

**Klasse** (erste passende): mit Schnitten → Standbild-nah (Median c < 3, alle D < 8) → Kamerafahrt
(gewinn ≥ 0,08 und gerichtete Verschiebung ≥ 1,5 %/s oder gleichsinniger Zoom ≥ 3 %/s) → Textur
(S < 1,5) → Mikrohandlung.

**Vorschlag (§6.7)** nach `quotient_bester_schnitt`: < 1 keiner · 1–2 Neutralzustand · > 2 Ereignis.
**Flächentausch** hebt auf Ereignis: an der Naht springen ≥ 50 % der Blöcke und mindestens doppelt so
viele wie beim 95. Perzentil der normalen Wechsel (`bildwechsel.anteil_p95`). Die Art je Klasse:
Mikrohandlung sin²-Abbremsen (§6.4), nie Pendel; Textur Filmnebel/Unschärfe; Kamerafahrt Taktnaht mit
Blitz oder Whip Pan. Unter 0,5 s Material nur Neutralzustand oder Blitz.

Genaue Formeln und die Begründung jeder Schwelle: `tabellen.md` (Abschnitte Kennzahlen, Schwellen)
und die Kommentare in `videonaht.mjs`.
