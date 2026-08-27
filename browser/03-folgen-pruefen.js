/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* ============================================================
   Suno-Archiv · Wem folge ich, der mir nicht zurückfolgt?
   ------------------------------------------------------------
   Dieses Skript ÄNDERT NICHTS. Es liest die eigene Folge-Liste,
   zählt aus, wer nicht zurückfolgt, und legt die Handles als
   Textdatei in den Download-Ordner. Entfolgt wird nichts — das
   bleibt Handarbeit und ist gut so.

   WOZU (aus dem Discord, 27.08.2026): „Hat zufällig wer ein Tool,
   mit dem man feststellen kann, wem man folgt, der einem nicht
   folgt? Habe gerade das Luxusproblem, dass Suno mir sagt: You've
   reached the maximum number of people you can follow."

   DER KNIFF: Man muss KEINE zwei Listen vergleichen. Suno liefert
   an jedem Eintrag von /api/profiles/following gleich das Feld
   is_following_viewer mit — steht es auf false, folgt die Person
   nicht zurück. Der Abgleich, den man erwarten würde (following
   gegen followers), ist damit überflüssig.

   ZWEI DINGE ZUM ABLAUF:

   - 20 Einträge je Seite, fest. page_size und offset werden
     ignoriert, nur page zählt. Bei 5800 Folgenden sind das 290
     Seiten und rund vier Minuten.
   - Der Clerk-Token lebt etwa eine Minute. Deshalb wird er vor
     JEDER Seite neu geholt, nicht einmal am Anfang.

   Anwendung:
     1. In Chrome suno.com öffnen und angemeldet sein
     2. Rechtsklick -> „Untersuchen" -> Reiter „Console"
     3. Diese Datei komplett kopieren, einfügen, Enter
     4. Warten. Die Seite darf dabei nicht neu geladen werden.

   KEINE TEMPLATE-LITERALE HIER, absichtlich. Wer dieses Skript in
   einem Discord-Codeblock weitergibt, stolpert sonst: Discord beendet
   den Block am ersten Backtick im Code, der Rest kommt als Text durch,
   und in der Konsole landet ein "Unexpected identifier Dollarzeichen". Also
   Zeichenketten mit + zusammensetzen, so unschön das ist.

   Geprüft am 27.08.2026 an einem Konto mit 101 Folgenden.
   ============================================================ */

(async () => {
  const gruen = 'color:#4ade80;font-weight:bold';
  const rot   = 'color:#f87171';
  const log = function(){ console.log.apply(console,
    ['%c[Archiv]', gruen].concat(Array.prototype.slice.call(arguments))); };

  if (!window.Clerk?.session) {
    console.log('%cNicht angemeldet - bitte erst auf suno.com einloggen.', rot);
    return;
  }

  const API = 'https://studio-api.prod.suno.com/api/profiles/following?page=';

  /* Der Token vor jeder Seite neu: er lebt nur rund eine Minute, und
     ein langer Lauf überdauert ihn mehrfach. */
  const hol = async (seite) => {
    const t = await window.Clerk.session.getToken();
    const r = await fetch(API + seite, { headers: { Authorization: 'Bearer ' + t } });
    if (!r.ok) throw new Error('HTTP ' + r.status + ' auf Seite ' + seite);
    return r.json();
  };

  let erste;
  try { erste = await hol(1); }
  catch (e) { console.log('%cGing nicht: ' + e.message, rot); return; }

  const gesamt = erste.num_total_profiles;
  const seiten = Math.ceil(gesamt / 20);
  log(gesamt + ' Profile, ' + seiten + ' Seiten. Das dauert rund '
      + Math.ceil(seiten * 0.3 / 60) + ' Minuten.');

  const alle = [].concat(erste.profiles || []);
  for (let s = 2; s <= seiten; s++) {
    try { alle.push.apply(alle, (await hol(s)).profiles || []); }
    catch (e) {
      /* Bremst Suno, hört das Skript auf statt zu drängeln - und gibt
         aus, was es bis dahin hat. */
      console.log('%c' + e.message + ' - Abbruch, das Bisherige folgt.', rot);
      break;
    }
    if (s % 25 === 0) log('  ' + alle.length + ' von ' + gesamt);
    await new Promise(r => setTimeout(r, 250));
  }

  const einseitig = alle.filter(p => !p.is_following_viewer);
  log(einseitig.length + ' von ' + alle.length + ' folgen nicht zurück.');
  console.table(einseitig.map(p => ({ handle: p.handle, name: p.display_name })));

  /* Als Datei, damit die Liste den Konsolenpuffer überlebt. */
  const txt = einseitig.map(p => p.handle).join('\n');
  const url = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'folgen-nicht-zurueck.txt';
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 5000);
  log('Die Handles liegen als folgen-nicht-zurueck.txt im Download-Ordner.');
})();
