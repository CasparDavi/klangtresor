// Einsilbige Wörter in drei Stufen. Das Lexikon (ipa-dict) setzt bei Einsilbern
// keine Akzentmarke; ob ein Einsilber eine Hebung trägt, entscheidet seine Wortart
// und der Satz. Grundlage: geschlossene Wortklassen nach Eisenberg (Grundriss Bd. 1)
// und Wiese (Phonology of German, Kap. 8: Klitika, schwache Formen).
//
//   'u' – meist unbetont (Artikel, schwache Pronomen, Präpositionen, Konjunktionen,
//         finite Hilfs- und Modalverben)
//   'b' – betonbar, je nach Satz (Negation, Gradpartikeln, Demonstrativa, Fragewörter)
//   alles andere Einsilbige – Inhaltswort, meist betont ('c')

const U = `der die das den dem des ein eine einen einem einer eines 's 'n
ich du er sie es wir ihr man mich dich sich mir dir uns euch ihn ihm
an auf aus bei bis durch für gen in mit nach ob seit um von vor zu zum zur im am ans ins vom beim
aufs durchs fürs übers ums unterm überm vorm hinterm
und oder aber denn dass daß wenn als wie weil sowie sondern
bin bist ist sind seid war warst wart hat hast hab habe hatt wird wirst werd kann kannst
muss musst mußt soll sollst will willst mag darf
zu ja`;

const B = `nicht nur noch schon auch doch so da dort hier nun nie nichts mehr sehr viel ganz
jetzt dann wann wo wer was wen wem kein keine mein dein sein all alle dies
nein kaum gar bald oft gern selbst sich's ihr's selbst eins zwei drei
mein' dein' sein' ihr' kein'`;

const set = s => new Set(s.split(/\s+/).filter(Boolean));
const UNBETONT = set(U), BETONBAR = set(B);

export function klasseEinsilber(wort) {
  const w = wort.toLowerCase();
  if (UNBETONT.has(w)) return 'u';
  if (BETONBAR.has(w)) return 'b';
  return 'c';
}
