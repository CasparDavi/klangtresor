# Zu zweit am selben Projekt

Caspar_D, 26.08.2026: *„Ich will immer eine detaillierte Liste haben,
was an neuen Commits, die nicht von uns kamen, reingekommen ist und was
sie bewirken werden. Können wir da ein Regelwerk machen, ich habe noch
nie in geteilten Softwareprojekten gearbeitet."*

Seit dem 26.08.2026 arbeitet **Tarja** (`myinqi`, angezeigt als *TarRav*)
mit Schreibrecht am Repo mit. Dieses Dokument hält fest, wie damit
umgegangen wird.

---

## 1. Die eine Regel, die alles trägt

**Erst sehen, dann ziehen.** Nie `git pull` als Reflex. Zuerst
nachschauen, was gekommen ist, und zwar mit dem Blick eines Prüfers,
nicht eines Lesers.

```bash
node bin/fremdstand.js
```

Das Werkzeug holt den Stand von GitHub, ohne etwas zu übernehmen, und
legt jeden fremden Commit einzeln vor: wer, wann, welche Dateien, was
neu ist und **was entfernt wurde**.

---

## 2. Was zu Beginn jeder Sitzung geschieht

Ohne Nachfrage, als erstes:

1. `node bin/fremdstand.js` — was ist angekommen?
2. Bei fremden Commits: die Liste durchgehen, jeden Punkt aus
   Abschnitt 3 prüfen
3. Caspar_D bekommt den Bericht, **bevor** irgendetwas übernommen wird
4. Erst danach `git pull --rebase origin main`

Kommt während der Arbeit etwas dazu, fällt es spätestens beim nächsten
Push auf („voraus 1, hinterher 2"). Dann gilt dasselbe: erst prüfen,
dann rebasen.

---

## 3. Woran ein fremder Commit geprüft wird

In dieser Reihenfolge, weil die gefährlichen Dinge zuerst kommen:

**a) Wurde etwas ENTFERNT?** Die gefährlichste Art Änderung, denn sie
fällt beim Lesen der neuen Zeilen nicht auf. `fremdstand.js` zeigt jede
entfernte Zeile ausdrücklich an. Eine gelöschte Zeile in einer Datei,
die man nicht selbst geschrieben hat, ist immer eine Rückfrage wert.

**b) Welche Dateien gab es schon?** Neue Dateien sind harmlos — sie
können nichts kaputtmachen, was vorher lief. Änderungen an bestehenden
sind die eigentliche Frage.

**c) Läuft der bestehende Weg noch?** Konkret: Greift die Änderung nur
unter einer Bedingung, die im Normalbetrieb nicht erfüllt ist? Oder
liegt sie im Hauptweg? Beispiel vom 26.08.: Tarjas Whisper-Block prüft
`[ -x /usr/local/bin/whisper-cli ]`, und das normale Image bringt
whisper-cli nicht mit — also läuft er nie, wenn man ihn nicht will.

**d) Werden fremde Adressen aufgerufen?** Jede URL im Zugewinn wird
gelistet. Zu prüfen: Ist die Quelle die offizielle? Wird etwas
heruntergeladen, und wie groß ist es? Was passiert, wenn es fehlschlägt?

**e) Ist es lizenzkonform?** Caspar_D, 26.08.2026: *„Prüfe bitte auch
unbedingt, dass Ein- und Umbauten lizenzkonform sind, nicht dass
plötzlich in unserem Repo Dinge liegen, die unsere Lizenz verletzen."*

KlangTresor steht unter **MIT**. Damit verträglich sind MIT, BSD, ISC,
Apache-2.0 und Public Domain — sie erlauben die Verwendung in einem
MIT-Werk, meist unter Beibehaltung des Urhebervermerks.

**Nicht verträglich sind GPL, AGPL und LGPL.** Wer solchen Code
übernimmt, muß das *ganze* Werk unter dieselbe Lizenz stellen. Das ist
keine Formalie: Es würde bedeuten, daß KlangTresor selbst GPL wird.

Ein **Nachbau** nach fremdem Vorbild ist dagegen erlaubt und im Haus
schon einmal so gemacht worden: Der Störfrequenz-Sucher ist dem *CB
Audio Analyzer* (GPL) nachgebaut, nicht übernommen — das steht
ausdrücklich in `web/fremd/LIZENZEN.md`. Wer ein Verfahren versteht und
neu schreibt, schleppt keine Lizenz mit.

`fremdstand.js` meldet, **wo** nachzusehen ist: jede geänderte
`package.json`, jedes geklonte Repositorium, jedes Docker-Grundbild. Die
Lizenz selbst muß man nachschlagen — bei npm-Paketen steht sie in deren
`package.json`, bei GitHub-Projekten im Repo-Kopf, bei Docker-Images
beim Anbieter.

**Ein Unterschied, der oft übersehen wird:** Ein `FROM`-Verweis in einem
Dockerfile ist *keine* Verteilung. Das Bild liegt nicht im Repo, es wird
beim Bauen geholt — unsere Lizenz bleibt unberührt. Erst wer ein
*gebautes* Image weitergibt, unterliegt dessen Bedingungen. Genau dieser
Fall trat am 26.08. mit den NVIDIA-CUDA-Images ein; er ist in
`LIZENZEN.md` festgehalten.

**Was ins Repo kommt, muß in `web/fremd/LIZENZEN.md`.** Auch wenn es nur
referenziert wird.

**f) Werden Dateien außerhalb des Programms angefaßt?** `library/`,
`geheim/`, `.gitignore`, Schlüsseldateien. Das Archiv gehört nicht ins
Repo (siehe `.gitignore`), und wer daran rührt, tut es entweder aus
Versehen oder mit einem Grund, den man kennen sollte.

**g) Stimmen Absender und Inhalt zusammen?** Verschiedene
Mailadressen im selben Vorgang sind normal (privates Konto,
GitHub-Konto), aber sie gehören erwähnt.

---

## 4. Was Caspar_D bekommt

Eine Liste, keine Beruhigung. Je Commit:

- **Wer, wann, welcher Betreff**
- **Tabelle der Dateien**: neu / ergänzt / GEÄNDERT, mit Zeilenzahlen
- **Was entfernt wurde**, wörtlich
- **Was es bewirkt** — in Sätzen, nicht in Fachbegriffen
- **Ob es Bestehendes berührt**, und wenn ja: welches
- **Ein Urteil**, aber ausdrücklich als Urteil gekennzeichnet und mit
  Begründung

Wenn etwas unklar bleibt, wird das gesagt. „Sieht gut aus" ist kein
Prüfergebnis.

---

## 5. Wie wir selbst arbeiten, damit es für Tarja leicht bleibt

- **Vor jedem Push fetchen** (galt schon vorher, gilt jetzt doppelt).
- **`git pull --rebase`, nicht `git pull`.** Rebase setzt die eigenen
  Commits obenauf, statt einen Verschmelzungs-Commit zu erzeugen. Die
  Historie bleibt eine Linie und ist in einem Jahr noch lesbar.
- **Kleine Commits mit sprechendem Betreff.** Wer prüfen soll, was ein
  Commit bewirkt, muß es am Betreff schon ahnen können.
- **Die Begründung in den Commit.** Nicht nur was, sondern warum. Das
  ist im Zweifel wichtiger als der Code.
- **Nie zwingen.** `git push --force` schreibt fremde Arbeit weg. Wenn
  ein Push abgelehnt wird, ist rebasen die Antwort, nie Gewalt.

---

## 6. Wenn etwas schiefgeht

**Ein Commit hat etwas kaputtgemacht:**
`git revert <hash>` — er wird rückgängig gemacht, bleibt aber in der
Historie sichtbar. Nie die Historie umschreiben, an der ein anderer
hängt.

**Man hat versehentlich Falsches gezogen:**
`git reset --hard origin/main` holt den Stand von GitHub zurück —
Vorsicht, eigene ungesicherte Arbeit ist dann weg.

**Beide haben dieselbe Datei geändert:**
Git meldet einen Konflikt und markiert die Stellen. Beide Fassungen
stehen dann untereinander in der Datei; man entscheidet von Hand,
speichert, `git add <datei>`, `git rebase --continue`.

---

## 7. Was dieses Dokument nicht ist

Kein Mißtrauen. Tarjas erster Beitrag vom 26.08.2026 war sauber
gebaut: additiv, abgeschirmt, mit Kommentaren an den richtigen Stellen
und ohne eine einzige entfernte Zeile.

Das Regelwerk gibt es, damit das so bleibt — und damit auffällt, wenn
einmal etwas anderes kommt. Prüfen ist keine Unterstellung, sondern
das, was Zusammenarbeit trägt.
