; KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
; =============================================================
; DIE SETUP.EXE FUER WINDOWS
; bin/setup/klangtresor.nsi - gebaut von bin/setup-bauen.js (makensis, laeuft auf dem Mac)
;
; Caspar_D, 28.10.2026: „Alles was nötig ist, wird im Setup gemacht" - „dass nichts im Verborgenen stattfindet".
; Und am 29.10.2026, nachdem die erste Fassung danach die alte Einrichtung im Konsolenfenster anwarf: „ich rufe eine
; setup.exe auf und der Rest passiert von alleine, ggf noch einen avatar namen" - „ab avatar geht alles im browser".
;
; Die Seiten, in dieser Reihenfolge:
;   Ordner        vorgeschlagen %USERPROFILE%\KlangTresor, oder wo die letzte Setup.exe installiert hat
;   Was schon da  frisch, oder: welche Fassung, wie gross das Archiv, wie viele KI-Modelle, Whisper - und was jetzt
;                 passiert (erneuern, holen). Gerechnet hier in NSIS, denn vorher gibt es dort vielleicht kein Node.
;   Kopieren      das Programm samt werkzeug\node und node_modules (alles fuer Windows x64)
;   Holen         ffmpeg, KI-Modelle und Whisper aus dem Netz, an ihrer Quelle - mitliefern verbieten die Lizenzen
;                 (ffmpeg: GPL, quellen.txt; Modelle: bin/modelle-holen.js). Das Holen macht bin/installieren.js, unsichtbar; diese Seite zeigt seinen
;                 Stand (Balken, was, wie weit, wie lange noch). Nichts fehlt -> die Seite entfaellt.
;   Fertig        Haken „Weiter im Browser": bin/einrichten.js --nach-setup, ohne Fenster - die Seite fragt nach dem
;                 Suno-Namen und holt die Lieder; danach startet KlangTresor.exe - das Symbol unten rechts, kein Fenster.
;
; Entschieden am 28.10.2026: Ordner nach Wahl, vorgeschlagen %USERPROFILE%\KlangTresor, keine Verwalterrechte
; (das Archiv liegt im Programmordner, server.js - nach C:\Programme duerfte es nicht schreiben). Updates laufen
; danach wie bisher ueber aktualisieren-windows.cmd bzw. Profil → System, nicht ueber eine neue Setup.exe.
; Entfernen: das Programm geht, das Archiv (library\) und die KI-Modelle (modelle\) bleiben - und die
; Schlussseite sagt, wo sie liegen und wie gross sie sind.
;
; Vom Bauskript gesetzt: VERSION, INHALT (der fertige Ordner), AUSGABE (die .exe), ENTFERNEN (Liste dessen, was
; diese Setup.exe hinlegt - nur das wird beim Entfernen geloescht).
; =============================================================

Unicode true
SetCompressor /SOLID lzma
RequestExecutionLevel user

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "nsDialogs.nsh"
!include "WordFunc.nsh"
!include "WinMessages.nsh"
!include "TextFunc.nsh"
!ifndef PBM_SETRANGE32
  !define PBM_SETRANGE32 0x406
!endif

!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\KlangTresor"

Name "KlangTresor ${VERSION}"
OutFile "${AUSGABE}"
InstallDir "$PROFILE\KlangTresor"
; Wo die letzte Setup.exe installiert hat - so findet ein Update seinen Ordner von selbst.
InstallDirRegKey HKCU "${UNINST}" "InstallLocation"
BrandingText "KlangTresor ${VERSION}"
ShowInstDetails show
ShowUninstDetails show

Var ArchivGroesse
Var ModellGroesse
; Was schon da ist (Seite „Was schon da")
Var ModellOrdner
Var MDa
Var FehltMB
Var ZuHolenMB
; Seite „Holen"
Var Balken
Var LOben
Var LUnten
Var LSchluss
Var KnopfNochmal
Var HolenLaeuft
; Herzschlag aus stand.txt (Zeile 6) und wie viele Takte er schon steht
Var Herz
Var HerzStill
Var Fett
; Abschlussseite: mit Archiv geht es in die App, ohne in die Einrichtung (Suno-Name)
Var FertigText
Var FertigLauf

!define MUI_ICON "${INHALT}\web\symbol\klangtresor.ico"
!define MUI_UNICON "${INHALT}\web\symbol\klangtresor.ico"
!define MUI_ABORTWARNING
; Das Bild links auf der Abschluss- und der Entfernen-Seite (164 x 314, aus web/symbol/klangtresor-1024.png)
!define MUI_WELCOMEFINISHPAGE_BITMAP "${__FILEDIR__}\seite.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "${__FILEDIR__}\seite.bmp"
!define MUI_CUSTOMFUNCTION_ABORT AbbruchHalt

!define MUI_DIRECTORYPAGE_TEXT_TOP "$(ordner_oben)"
!insertmacro MUI_PAGE_DIRECTORY
Page custom BestandSeite
!insertmacro MUI_PAGE_INSTFILES
Page custom HolenSeite HolenVerlassen
!define MUI_FINISHPAGE_TITLE "$(fertig_titel)"
!define MUI_FINISHPAGE_TEXT "$FertigText"
!define MUI_FINISHPAGE_TEXT_LARGE
!define MUI_PAGE_CUSTOMFUNCTION_PRE FertigVorbereiten
!define MUI_PAGE_CUSTOMFUNCTION_SHOW KeinZurueck
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_TEXT "$FertigLauf"
!define MUI_FINISHPAGE_RUN_FUNCTION WeiterImBrowser
!insertmacro MUI_PAGE_FINISH

!define MUI_UNCONFIRMPAGE_TEXT_TOP "$(weg_oben)"
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!define MUI_FINISHPAGE_TITLE "$(weg_titel)"
!define MUI_FINISHPAGE_TEXT "$(weg_text)"
!insertmacro MUI_UNPAGE_FINISH

; Die Sprache folgt der Windows-Oberflaeche; was keine der drei ist, bekommt Englisch (wie einrichten-windows.cmd).
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "German"
!insertmacro MUI_LANGUAGE "Russian"

LangString ordner_oben ${LANG_GERMAN} "KlangTresor kommt in diesen Ordner - das Programm und später dein Archiv (library). Verwalterrechte braucht es nicht.$\r$\n$\r$\nLiegt hier schon ein KlangTresor, wird nur das Programm erneuert; dein Archiv bleibt unberührt. Liegen hier andere Dateien, bleibt „Weiter“ gesperrt - dann einen leeren Ordner wählen."
LangString ordner_oben ${LANG_ENGLISH} "KlangTresor goes into this folder - the program and later your archive (library). No administrator rights needed.$\r$\n$\r$\nIf a KlangTresor is already here, only the program is renewed; your archive stays untouched. If other files are here, „Next“ stays disabled - then choose an empty folder."
LangString ordner_oben ${LANG_RUSSIAN} "KlangTresor будет установлен в эту папку - программа и позже ваш архив (library). Права администратора не нужны.$\r$\n$\r$\nЕсли здесь уже есть KlangTresor, обновится только программа; архив останется нетронутым. Если здесь другие файлы, кнопка «Далее» неактивна - выберите пустую папку."


LangString fertig_titel ${LANG_GERMAN} "KlangTresor ist installiert"
LangString fertig_titel ${LANG_ENGLISH} "KlangTresor is installed"
LangString fertig_titel ${LANG_RUSSIAN} "KlangTresor установлен"

LangString fertig_text ${LANG_GERMAN} "KlangTresor liegt in $INSTDIR - mit allem, was es zum Laufen braucht.$\r$\n$\r$\nAls Nächstes geht dein Browser auf: Dort gibst du deinen Suno-Namen ein, und deine Lieder werden geholt.$\r$\n$\r$\nSpäter: Startmenü → KlangTresor."
LangString fertig_text ${LANG_ENGLISH} "KlangTresor is in $INSTDIR - with everything it needs to run.$\r$\n$\r$\nNext your browser opens: there you enter your Suno name, and your songs are fetched.$\r$\n$\r$\nLater: Start menu → KlangTresor."
LangString fertig_text ${LANG_RUSSIAN} "KlangTresor находится в $INSTDIR - со всем, что нужно для работы.$\r$\n$\r$\nДальше откроется браузер: там вы вводите своё имя в Suno, и ваши песни загружаются.$\r$\n$\r$\nПозже: меню «Пуск» → KlangTresor."

LangString fertig_text_update ${LANG_GERMAN} "KlangTresor ist auf ${VERSION} erneuert - dein Archiv ist unberührt.$\r$\n$\r$\nKlangTresor läuft danach als Symbol unten rechts in der Taskleiste: Doppelklick öffnet die Seite, Rechtsklick → Beenden."
LangString fertig_text_update ${LANG_ENGLISH} "KlangTresor has been renewed to ${VERSION} - your archive is untouched.$\r$\n$\r$\nKlangTresor then runs as an icon at the bottom right of the taskbar: double-click opens the page, right-click → Quit."
LangString fertig_text_update ${LANG_RUSSIAN} "KlangTresor обновлён до ${VERSION} - ваш архив не тронут.$\r$\n$\r$\nKlangTresor работает как значок справа внизу на панели задач: двойной клик открывает страницу, правый клик → Выйти."
LangString fertig_starten ${LANG_GERMAN} "KlangTresor starten"
LangString fertig_starten ${LANG_ENGLISH} "Start KlangTresor"
LangString fertig_starten ${LANG_RUSSIAN} "Запустить KlangTresor"
LangString fertig_weiter ${LANG_GERMAN} "Weiter im Browser: Suno-Name und Lieder"
LangString fertig_weiter ${LANG_ENGLISH} "Continue in the browser: Suno name and songs"
LangString fertig_weiter ${LANG_RUSSIAN} "Продолжить в браузере: имя в Suno и песни"

LangString bestand_titel ${LANG_GERMAN} "Was schon da ist"
LangString bestand_titel ${LANG_ENGLISH} "What is already here"
LangString bestand_titel ${LANG_RUSSIAN} "Что уже есть"
LangString bestand_unter ${LANG_GERMAN} "und was jetzt passiert"
LangString bestand_unter ${LANG_ENGLISH} "and what happens now"
LangString bestand_unter ${LANG_RUSSIAN} "и что произойдёт сейчас"
LangString bestand_neu ${LANG_GERMAN} "In $INSTDIR liegt noch kein KlangTresor. Er wird neu eingerichtet."
LangString bestand_neu ${LANG_ENGLISH} "There is no KlangTresor in $INSTDIR yet. It will be set up fresh."
LangString bestand_neu ${LANG_RUSSIAN} "В $INSTDIR ещё нет KlangTresor. Он будет установлен заново."
LangString bestand_alt ${LANG_GERMAN} "In $INSTDIR liegt KlangTresor $0. Das Programm wird auf ${VERSION} erneuert."
LangString bestand_alt ${LANG_ENGLISH} "$INSTDIR holds KlangTresor $0. The program will be renewed to ${VERSION}."
LangString bestand_alt ${LANG_RUSSIAN} "В $INSTDIR находится KlangTresor $0. Программа будет обновлена до ${VERSION}."
LangString bestand_gleich ${LANG_GERMAN} "In $INSTDIR liegt schon KlangTresor $0 - dieselbe Fassung. Das Programm wird noch einmal hingelegt, geholt wird nur, was fehlt."
LangString bestand_gleich ${LANG_ENGLISH} "$INSTDIR already holds KlangTresor $0 - the same version. The program is put in place once more; only what is missing is fetched."
LangString bestand_gleich ${LANG_RUSSIAN} "В $INSTDIR уже есть KlangTresor $0 - та же версия. Программа будет записана ещё раз, загрузится только недостающее."
LangString bestand_archiv ${LANG_GERMAN} "Dein Archiv:  $0 Titel, $1  -  bleibt unberührt"
LangString bestand_archiv ${LANG_ENGLISH} "Your archive:  $0 songs, $1  -  stays untouched"
LangString bestand_archiv ${LANG_RUSSIAN} "Ваш архив:  $0 песен, $1  -  останется нетронутым"
LangString bestand_archiv_leer ${LANG_GERMAN} "Dein Archiv:  noch leer - die Lieder holt gleich die Einrichtung im Browser"
LangString bestand_archiv_leer ${LANG_ENGLISH} "Your archive:  still empty - the setup in the browser fetches your songs next"
LangString bestand_archiv_leer ${LANG_RUSSIAN} "Ваш архив:  пока пуст - песни загрузит настройка в браузере"
LangString bestand_modelle ${LANG_GERMAN} "KI-Modelle:  $0 von $1 da  ($ModellOrdner)"
LangString bestand_modelle ${LANG_ENGLISH} "AI models:  $0 of $1 present  ($ModellOrdner)"
LangString bestand_modelle ${LANG_RUSSIAN} "ИИ-модели:  $0 из $1 на месте  ($ModellOrdner)"
LangString bestand_ffmpeg_da ${LANG_GERMAN} "ffmpeg (Ton und Bild):  da"
LangString bestand_ffmpeg_da ${LANG_ENGLISH} "ffmpeg (sound and image):  present"
LangString bestand_ffmpeg_da ${LANG_RUSSIAN} "ffmpeg (звук и изображение):  на месте"
LangString bestand_ffmpeg_fehlt ${LANG_GERMAN} "ffmpeg (Ton und Bild):  fehlt"
LangString bestand_ffmpeg_fehlt ${LANG_ENGLISH} "ffmpeg (sound and image):  missing"
LangString bestand_ffmpeg_fehlt ${LANG_RUSSIAN} "ffmpeg (звук и изображение):  отсутствует"
LangString bestand_whisper_da ${LANG_GERMAN} "Whisper (mitlaufender Liedtext):  da"
LangString bestand_whisper_da ${LANG_ENGLISH} "Whisper (synced lyrics):  present"
LangString bestand_whisper_da ${LANG_RUSSIAN} "Whisper (текст песни в такт):  на месте"
LangString bestand_whisper_fehlt ${LANG_GERMAN} "Whisper (mitlaufender Liedtext):  fehlt"
LangString bestand_whisper_fehlt ${LANG_ENGLISH} "Whisper (synced lyrics):  missing"
LangString bestand_whisper_fehlt ${LANG_RUSSIAN} "Whisper (текст песни в такт):  отсутствует"
LangString bestand_holen ${LANG_GERMAN} "Nach dem Kopieren wird geholt, was fehlt: rund $0 - jedes Teil an seiner Quelle, mit Fortschrittsbalken. Mitliefern lassen das ihre Lizenzen nicht zu."
LangString bestand_holen ${LANG_ENGLISH} "After copying, whatever is missing is fetched: about $0 - each part from its source, with a progress bar. Their licences do not allow shipping them."
LangString bestand_holen ${LANG_RUSSIAN} "После копирования загрузится недостающее: около $0 - каждая часть из своего источника, с индикатором прогресса. Их лицензии не разрешают поставлять их вместе с программой."
LangString bestand_nichts ${LANG_GERMAN} "ffmpeg, KI-Modelle und Whisper sind vollständig - aus dem Netz wird nichts geholt."
LangString bestand_nichts ${LANG_ENGLISH} "ffmpeg, AI models and Whisper are complete - nothing will be downloaded."
LangString bestand_nichts ${LANG_RUSSIAN} "ffmpeg, ИИ-модели и Whisper на месте - из сети ничего загружаться не будет."
LangString bestand_platz ${LANG_GERMAN} "Freier Platz dort: $0"
LangString bestand_platz ${LANG_ENGLISH} "Free space there: $0"
LangString bestand_platz ${LANG_RUSSIAN} "Свободно там: $0"

LangString holen_titel ${LANG_GERMAN} "ffmpeg, KI-Modelle und Whisper"
LangString holen_titel ${LANG_ENGLISH} "ffmpeg, AI models and Whisper"
LangString holen_titel ${LANG_RUSSIAN} "ffmpeg, ИИ-модели и Whisper"
LangString holen_unter ${LANG_GERMAN} "werden an ihrer Quelle geholt - das dauert je nach Leitung ein paar Minuten bis gut eine Stunde"
LangString holen_unter ${LANG_ENGLISH} "are fetched from their sources - depending on your connection a few minutes to well over an hour"
LangString holen_unter ${LANG_RUSSIAN} "загружаются из своих источников - в зависимости от соединения от нескольких минут до часа с лишним"
LangString holen_nochmal ${LANG_GERMAN} "Noch einmal versuchen"
LangString holen_nochmal ${LANG_ENGLISH} "Try again"
LangString holen_nochmal ${LANG_RUSSIAN} "Попробовать ещё раз"
LangString holen_start ${LANG_GERMAN} "Es geht los …"
LangString holen_start ${LANG_ENGLISH} "Starting …"
LangString holen_start ${LANG_RUSSIAN} "Начинаем …"
LangString holen_tot ${LANG_GERMAN} "Das Holen hat sich unerwartet beendet. KlangTresor läuft trotzdem; was fehlt, holst du später unter Profil → System - oder hier gleich noch einmal versuchen."
LangString holen_tot ${LANG_ENGLISH} "Downloading stopped unexpectedly. KlangTresor runs anyway; fetch what is missing later under Profile → System - or try again here right away."
LangString holen_tot ${LANG_RUSSIAN} "Загрузка неожиданно прервалась. KlangTresor всё равно работает; недостающее можно загрузить позже: Профиль → Система - или попробовать ещё раз прямо здесь."
LangString holen_kein_node ${LANG_GERMAN} "Node.js ließ sich nicht starten - werkzeug\node\node.exe fehlt oder wird blockiert (Virenschutz?)."
LangString holen_kein_node ${LANG_ENGLISH} "Node.js could not be started - werkzeug\node\node.exe is missing or blocked (antivirus?)."
LangString holen_kein_node ${LANG_RUSSIAN} "Не удалось запустить Node.js - werkzeug\node\node.exe отсутствует или заблокирован (антивирус?)."

LangString kt_sprache ${LANG_GERMAN} "de"
LangString kt_sprache ${LANG_ENGLISH} "en"
LangString kt_sprache ${LANG_RUSSIAN} "ru"

LangString lnk_entfernen ${LANG_GERMAN} "KlangTresor entfernen"
LangString lnk_entfernen ${LANG_ENGLISH} "Remove KlangTresor"
LangString lnk_entfernen ${LANG_RUSSIAN} "Удалить KlangTresor"

LangString laeuft_noch ${LANG_GERMAN} "KlangTresor läuft noch - unten rechts in der Taskleiste (Symbol) oder als Einrichtung im Browser.$\r$\n$\r$\nSoll ich es beenden? Dein Archiv bleibt, wie es ist.$\r$\n$\r$\nJa: beenden und weitermachen.   Nein: abbrechen, nichts wird verändert."
LangString laeuft_noch ${LANG_ENGLISH} "KlangTresor is still running - at the bottom right of the taskbar (icon) or as the setup in your browser.$\r$\n$\r$\nShall I end it? Your archive stays as it is.$\r$\n$\r$\nYes: end it and continue.   No: cancel, nothing is changed."
LangString laeuft_noch ${LANG_RUSSIAN} "KlangTresor ещё работает - значком справа внизу на панели задач или как настройка в браузере.$\r$\n$\r$\nЗавершить его? Ваш архив останется как есть.$\r$\n$\r$\nДа: завершить и продолжить.   Нет: отменить, ничего не изменится."

LangString weg_oben ${LANG_GERMAN} "Das Programm wird aus diesem Ordner entfernt. Was dir gehört, bleibt liegen: dein Archiv (library) und die KI-Modelle (modelle)."
LangString weg_oben ${LANG_ENGLISH} "The program is removed from this folder. What belongs to you stays: your archive (library) and the AI models (modelle)."
LangString weg_oben ${LANG_RUSSIAN} "Программа будет удалена из этой папки. Ваше останется: архив (library) и ИИ-модели (modelle)."
LangString weg_titel ${LANG_GERMAN} "Das Programm ist entfernt"
LangString weg_titel ${LANG_ENGLISH} "The program has been removed"
LangString weg_titel ${LANG_RUSSIAN} "Программа удалена"

LangString weg_text ${LANG_GERMAN} "Geblieben ist, was dir gehört:$\r$\n$\r$\nDein Archiv: $INSTDIR\library ($ArchivGroesse)$\r$\nKI-Modelle: $INSTDIR\modelle ($ModellGroesse)$\r$\n$\r$\nDie KI-Modelle lassen sich jederzeit neu holen - brauchst du sie nicht mehr, kannst du den Ordner selbst löschen. Das Archiv sicherst du am besten, bevor du es löschst."
LangString weg_text ${LANG_ENGLISH} "What belongs to you is still here:$\r$\n$\r$\nYour archive: $INSTDIR\library ($ArchivGroesse)$\r$\nAI models: $INSTDIR\modelle ($ModellGroesse)$\r$\n$\r$\nThe AI models can be fetched again at any time - if you no longer need them, you can delete the folder yourself. Best back up the archive before deleting it."
LangString weg_text ${LANG_RUSSIAN} "Осталось то, что принадлежит вам:$\r$\n$\r$\nВаш архив: $INSTDIR\library ($ArchivGroesse)$\r$\nИИ-модели: $INSTDIR\modelle ($ModellGroesse)$\r$\n$\r$\nИИ-модели можно в любой момент загрузить заново - если они больше не нужны, папку можно удалить самостоятельно. Архив лучше сохранить, прежде чем удалять его."

LangString nichts_da ${LANG_GERMAN} "nicht vorhanden"
LangString nichts_da ${LANG_ENGLISH} "not present"
LangString nichts_da ${LANG_RUSSIAN} "отсутствует"

; ---------------------------------------------------------------
; Ein Ordner, in dem schon fremde Dateien liegen, wird nicht genommen („Weiter" bleibt gesperrt, ordner_oben sagt warum): das Entfernen loescht spaeter bin\, docs\,
; web\ ... - in „Dokumente" gewaehlt, traefe das womoeglich Ordner des Nutzers gleichen Namens.
Function .onVerifyInstDir
  ${If} ${FileExists} "$INSTDIR\*.*"
  ${AndIfNot} ${FileExists} "$INSTDIR\server\server.js"
    FindFirst $0 $1 "$INSTDIR\*.*"
    ${DoWhile} $1 != ""
      ; library\ und modelle\ bleiben nach dem Entfernen liegen - dorthin neu zu installieren muss gehen (im Test
      ; am 29.10.2026 war „Weiter" danach gesperrt)
      ${If} $1 != "."
      ${AndIf} $1 != ".."
      ${AndIf} $1 != "library"
      ${AndIf} $1 != "modelle"
        FindClose $0
        Abort
      ${EndIf}
      FindNext $0 $1
    ${Loop}
    FindClose $0
  ${EndIf}
FunctionEnd

; Laeuft KlangTresor aus diesem Ordner (Server oder die Einrichtung nach der Setup.exe), ist node.exe gesperrt. Lieber
; vorher fragen als mitten im Kopieren oder Loeschen scheitern - und gleich den Ausweg anbieten: die Einrichtung nach
; der Setup.exe hat kein Fenster, das man schliessen koennte (so im Test am 29.10.2026 gesehen: die erste Fassung
; verlangte „das schwarze Fenster schliessen", das es nicht gab).
!macro LaeuftNicht UN
; Beendet genau node.exe und KlangTresor.exe (das Symbol) aus DIESEM Ordner - kein anderes Programm auf dem Rechner. Das Skript wird als UTF-16 mit BOM
; geschrieben, damit ein Benutzername mit Umlaut oder kyrillischen Buchstaben heil bei PowerShell ankommt.
Function ${UN}KlangTresorBeenden
  InitPluginsDir
  FileOpen $R0 "$PLUGINSDIR\beenden.ps1" w
  FileWriteWord $R0 0xFEFF
  FileWriteUTF16LE $R0 "$$ziele = @('$INSTDIR\werkzeug\node\node.exe', '$INSTDIR\KlangTresor.exe')$\r$\n"
  FileWriteUTF16LE $R0 "Get-CimInstance Win32_Process | Where-Object { $$ziele -contains $$_.ExecutablePath } | ForEach-Object { Stop-Process -Id $$_.ProcessId -Force }$\r$\n"
  FileClose $R0
  nsExec::Exec 'powershell -NoProfile -ExecutionPolicy Bypass -File "$PLUGINSDIR\beenden.ps1"'
  Pop $R0
  Sleep 1500
FunctionEnd

Function ${UN}LaeuftNicht
  ${Do}
    ${IfNot} ${FileExists} "$INSTDIR\werkzeug\node\node.exe"
      ${ExitDo}
    ${EndIf}
    ; Zum Schreiben oeffnen: das verweigert Windows, solange node.exe laeuft. (Umbenennen dagegen erlaubt es auch
    ; bei laufendem Programm - so stand es hier zuerst, und das Entfernen loeschte im Test den laufenden Server.)
    ClearErrors
    FileOpen $0 "$INSTDIR\werkzeug\node\node.exe" a
    ${IfNot} ${Errors}
      FileClose $0
      ; auch das Symbol: laeuft es, ist KlangTresor.exe gesperrt (auch wenn der Server gerade steht)
      ClearErrors
      ${If} ${FileExists} "$INSTDIR\KlangTresor.exe"
        FileOpen $0 "$INSTDIR\KlangTresor.exe" a
        ${IfNot} ${Errors}
          FileClose $0
        ${EndIf}
      ${EndIf}
      ${IfNot} ${Errors}
        ${ExitDo}
      ${EndIf}
    ${EndIf}
    ; /SD: im stillen Lauf (/S) gibt es niemanden, der klickt - dann Abbruch mit Fehlercode, nicht ewiges Warten.
    MessageBox MB_YESNO|MB_ICONEXCLAMATION "$(laeuft_noch)" /SD IDNO IDYES beenden
    SetErrorLevel 2
    Quit
    beenden:
    Call ${UN}KlangTresorBeenden
  ${Loop}
FunctionEnd
!macroend
!insertmacro LaeuftNicht ""
!insertmacro LaeuftNicht "un."

Section "KlangTresor"
  Call LaeuftNicht
  SetOutPath "$INSTDIR"
  File /r "${INHALT}\*.*"
  WriteUninstaller "$INSTDIR\KlangTresor-entfernen.exe"

  CreateDirectory "$SMPROGRAMS\KlangTresor"
  ; Das Symbol unten rechts statt des schwarzen Fensters (bin/windows/KlangTresor.cs; Caspar_D, 29.10.2026)
  CreateShortcut "$SMPROGRAMS\KlangTresor\KlangTresor.lnk" "$INSTDIR\KlangTresor.exe" "" "$INSTDIR\KlangTresor.exe"
  CreateShortcut "$SMPROGRAMS\KlangTresor\$(lnk_entfernen).lnk" "$INSTDIR\KlangTresor-entfernen.exe"

  WriteRegStr HKCU "${UNINST}" "DisplayName" "KlangTresor"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "Caspar_D"
  WriteRegStr HKCU "${UNINST}" "URLInfoAbout" "https://github.com/CasparDavi/klangtresor"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\web\symbol\klangtresor.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\KlangTresor-entfernen.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  WriteRegDWORD HKCU "${UNINST}" "EstimatedSize" $0
SectionEnd

; ---------------------------------------------------------------
; Groesse in Worten fuer die Seite „Was schon da": $R0 = Megabyte -> $R1 „3,4 GB" / „120 MB"
Function MBinWorten
  ${If} $R0 >= 1024
    IntOp $R2 $R0 / 1024
    IntOp $R3 $R0 % 1024
    IntOp $R3 $R3 * 10
    IntOp $R3 $R3 / 1024
    StrCpy $R1 "$R2,$R3 GB"
  ${Else}
    StrCpy $R1 "$R0 MB"
  ${EndIf}
FunctionEnd

; Eine Modelldatei: liegt sie in voller Groesse da (am Modellordner oder noch am alten Ort library\modelle)?
; Die Liste kommt beim Bau aus bin/modelle-holen.js (modelle.nsh) - dieselbe, nach der installieren.js holt.
!macro ModellPruefen NAME MIN MINMB
  StrCpy $R5 "$ModellOrdner\${NAME}"
  ${IfNot} ${FileExists} "$R5"
    StrCpy $R5 "$INSTDIR\library\modelle\${NAME}"
  ${EndIf}
  StrCpy $R6 0
  ClearErrors
  FileOpen $R7 "$R5" r
  ${IfNot} ${Errors}
    FileSeek $R7 0 END $R6
    FileClose $R7
  ${EndIf}
  ${If} $R6 >= ${MIN}
    IntOp $MDa $MDa + 1
  ${Else}
    IntOp $FehltMB $FehltMB + ${MINMB}
  ${EndIf}
!macroend
!include "${MODELLE}"

; Was schon da ist - in NSIS gerechnet, weil es vorher womoeglich kein Node gibt.
Function BestandSeite
  !insertmacro MUI_HEADER_TEXT "$(bestand_titel)" "$(bestand_unter)"
  nsDialogs::Create 1018
  Pop $R9
  CreateFont $Fett "$(^Font)" "$(^FontSize)" 700
  StrCpy $R8 0   ; y in Dialogeinheiten

  ; Der Modellordner: library\konfig.json „modellOrdner", sonst <Ordner>\modelle (bin/modellordner.js)
  StrCpy $ModellOrdner "$INSTDIR\modelle"
  ${If} ${FileExists} "$INSTDIR\library\konfig.json"
    ClearErrors
    FileOpen $R0 "$INSTDIR\library\konfig.json" r
    ${IfNot} ${Errors}
      ${Do}
        ClearErrors
        FileRead $R0 $R1
        ${If} ${Errors}
          ${ExitDo}
        ${EndIf}
        ${WordFind2X} $R1 '"modellOrdner": "' '"' "+1" $R2
        ${If} $R2 != $R1
          ${WordReplace} $R2 "\\" "\" "+" $ModellOrdner
          ${ExitDo}
        ${EndIf}
      ${Loop}
      FileClose $R0
    ${EndIf}
  ${EndIf}

  ; Fassung und Archiv
  ${If} ${FileExists} "$INSTDIR\server\server.js"
    StrCpy $0 "?"
    ClearErrors
    FileOpen $R0 "$INSTDIR\package.json" r
    ${IfNot} ${Errors}
      ${Do}
        ClearErrors
        FileRead $R0 $R1
        ${If} ${Errors}
          ${ExitDo}
        ${EndIf}
        ${WordFind2X} $R1 '"version": "' '"' "+1" $R2
        ${If} $R2 != $R1
          StrCpy $0 $R2
          ${ExitDo}
        ${EndIf}
      ${Loop}
      FileClose $R0
    ${EndIf}
    ${If} $0 == "${VERSION}"
      ${NSD_CreateLabel} 0 $R8u 100% 30u "$(bestand_gleich)"
    ${Else}
      ${NSD_CreateLabel} 0 $R8u 100% 30u "$(bestand_alt)"
    ${EndIf}
    Pop $R0
    SendMessage $R0 ${WM_SETFONT} $Fett 1
    IntOp $R8 $R8 + 32
    ${If} ${FileExists} "$INSTDIR\library\*.*"
      StrCpy $0 0
      FindFirst $R0 $R1 "$INSTDIR\library\songs\*"
      ${DoWhile} $R1 != ""
        ${If} $R1 != "."
        ${AndIf} $R1 != ".."
        ${AndIf} ${FileExists} "$INSTDIR\library\songs\$R1\*.*"
          IntOp $0 $0 + 1
        ${EndIf}
        FindNext $R0 $R1
      ${Loop}
      FindClose $R0
      ${GetSize} "$INSTDIR\library" "/S=0M" $R0 $R1 $R2
      Call MBinWorten
      StrCpy $1 $R1
      ${NSD_CreateLabel} 10u $R8u 100% 12u "$(bestand_archiv)"
      Pop $R0
      IntOp $R8 $R8 + 14
    ${Else}
      ${NSD_CreateLabel} 10u $R8u 100% 12u "$(bestand_archiv_leer)"
      Pop $R0
      IntOp $R8 $R8 + 14
    ${EndIf}
  ${Else}
    ${NSD_CreateLabel} 0 $R8u 100% 20u "$(bestand_neu)"
    Pop $R0
    SendMessage $R0 ${WM_SETFONT} $Fett 1
    IntOp $R8 $R8 + 24
  ${EndIf}

  ; ffmpeg, KI-Modelle und Whisper
  StrCpy $ZuHolenMB 0
  ${If} ${FileExists} "$INSTDIR\werkzeug\ffmpeg\bin\ffmpeg.exe"
    ${NSD_CreateLabel} 10u $R8u 100% 12u "$(bestand_ffmpeg_da)"
  ${Else}
    ${NSD_CreateLabel} 10u $R8u 100% 12u "$(bestand_ffmpeg_fehlt)"
    StrCpy $ZuHolenMB 110
  ${EndIf}
  Pop $R0
  IntOp $R8 $R8 + 14
  StrCpy $MDa 0
  StrCpy $FehltMB 0
  !insertmacro ModellListe
  StrCpy $0 $MDa
  StrCpy $1 ${MODELLE_ANZAHL}
  ${NSD_CreateLabel} 10u $R8u 100% 12u "$(bestand_modelle)"
  Pop $R0
  IntOp $R8 $R8 + 14
  IntOp $ZuHolenMB $ZuHolenMB + $FehltMB
  ${If} ${FileExists} "$INSTDIR\werkzeug\whisper\Release\whisper-cli.exe"
  ${AndIf} ${FileExists} "$ModellOrdner\ggml-large-v3.bin"
    ${NSD_CreateLabel} 10u $R8u 100% 12u "$(bestand_whisper_da)"
  ${Else}
    ${NSD_CreateLabel} 10u $R8u 100% 12u "$(bestand_whisper_fehlt)"
    ${IfNot} ${FileExists} "$ModellOrdner\ggml-large-v3.bin"
    ${AndIfNot} ${FileExists} "$INSTDIR\library\modelle\ggml-large-v3.bin"
      IntOp $ZuHolenMB $ZuHolenMB + 2952
    ${EndIf}
    IntOp $ZuHolenMB $ZuHolenMB + 8
  ${EndIf}
  Pop $R0
  IntOp $R8 $R8 + 22

  ${If} $ZuHolenMB > 0
    StrCpy $R0 $ZuHolenMB
    Call MBinWorten
    StrCpy $0 $R1
    ${NSD_CreateLabel} 0 $R8u 100% 30u "$(bestand_holen)"
  ${Else}
    ${NSD_CreateLabel} 0 $R8u 100% 20u "$(bestand_nichts)"
  ${EndIf}
  Pop $R0
  IntOp $R8 $R8 + 34

  ; Platz am Ziel (das Laufwerk des Ordners)
  StrCpy $R1 $INSTDIR 3
  ${DriveSpace} "$R1" "/D=F /S=M" $R0
  Call MBinWorten
  StrCpy $0 $R1
  ${NSD_CreateLabel} 0 $R8u 100% 12u "$(bestand_platz)"
  Pop $R0

  nsDialogs::Show
FunctionEnd

; ---------------------------------------------------------------
; HOLEN. bin/installieren.js laeuft unsichtbar und schreibt seinen Stand nach $PLUGINSDIR\stand.txt
; (UTF-16LE, fuenf Zeilen: Promille, was, wie weit, laeuft|fertig|fehler|halt, Schlusssatz). Diese Seite liest ihn
; zweimal je Sekunde. Abbrechen legt stand.txt.halt daneben - dann hoert es auf, Halbes geht beim naechsten Mal weiter.
Function SpracheSetzen
  System::Call 'kernel32::SetEnvironmentVariable(t "KT_SPRACHE", t "$(kt_sprache)")'
FunctionEnd

Function HolenStarten
  Delete "$PLUGINSDIR\stand.txt"
  Delete "$PLUGINSDIR\stand.txt.halt"
  ${NSD_SetText} $LOben "$(holen_start)"
  ${NSD_SetText} $LUnten ""
  ShowWindow $LSchluss ${SW_HIDE}
  ShowWindow $KnopfNochmal ${SW_HIDE}
  SendMessage $Balken ${PBM_SETPOS} 0 0
  GetDlgItem $R0 $HWNDPARENT 1
  EnableWindow $R0 0
  Call SpracheSetzen
  SetOutPath "$INSTDIR"
  ClearErrors
  ExecShell "open" "$INSTDIR\werkzeug\node\node.exe" '"$INSTDIR\bin\installieren.js" --stand "$PLUGINSDIR\stand.txt"' SW_HIDE
  ${If} ${Errors}
    ${NSD_SetText} $LOben "$(holen_kein_node)"
    ShowWindow $KnopfNochmal ${SW_SHOW}
    EnableWindow $R0 1
    Return
  ${EndIf}
  StrCpy $HolenLaeuft 1
  StrCpy $Herz ""
  StrCpy $HerzStill 0
  ${NSD_CreateTimer} HolenTakt 500
FunctionEnd

; Ein Knopf-Klick legt den Knopf auf den Stapel - erst wegnehmen
Function NochmalKlick
  Pop $R0
  Call HolenStarten
FunctionEnd

Function HolenSeite
  ${If} $ZuHolenMB == 0
    Abort   ; nichts zu holen - die Seite entfaellt
  ${EndIf}
  !insertmacro MUI_HEADER_TEXT "$(holen_titel)" "$(holen_unter)"
  nsDialogs::Create 1018
  Pop $R9
  ${NSD_CreateLabel} 0 0 100% 12u ""
  Pop $LOben
  SendMessage $LOben ${WM_SETFONT} $Fett 1
  ${NSD_CreateProgressBar} 0 16u 100% 12u ""
  Pop $Balken
  SendMessage $Balken ${PBM_SETRANGE32} 0 1000
  ${NSD_CreateLabel} 0 32u 100% 12u ""
  Pop $LUnten
  ${NSD_CreateLabel} 0 52u 100% 40u ""
  Pop $LSchluss
  ${NSD_CreateButton} 0 96u 120u 15u "$(holen_nochmal)"
  Pop $KnopfNochmal
  ${NSD_OnClick} $KnopfNochmal NochmalKlick
  ; Zurueck ergibt hier keinen Sinn mehr: kopiert ist schon
  GetDlgItem $R0 $HWNDPARENT 3
  EnableWindow $R0 0
  Call HolenStarten
  nsDialogs::Show
FunctionEnd

Function HolenTakt
  IfFileExists "$PLUGINSDIR\stand.txt" 0 nichts
  ClearErrors
  FileOpen $R0 "$PLUGINSDIR\stand.txt" r
  IfErrors nichts
  FileReadUTF16LE $R0 $R1
  FileReadUTF16LE $R0 $R2
  FileReadUTF16LE $R0 $R3
  FileReadUTF16LE $R0 $R4
  FileReadUTF16LE $R0 $R5
  FileReadUTF16LE $R0 $R6
  FileClose $R0
  ${TrimNewLines} $R6 $R6
  ; Steht der Herzschlag 10 s (20 Takte), lebt das Holen nicht mehr - sagen, statt ewig „laeuft" zu zeigen
  ${If} $R6 == $Herz
    IntOp $HerzStill $HerzStill + 1
  ${Else}
    StrCpy $Herz $R6
    StrCpy $HerzStill 0
  ${EndIf}
  ${If} $HerzStill >= 20
  ${AndIf} $R4 == "laeuft"
    StrCpy $R4 "fehler"
    StrCpy $R5 "$(holen_tot)"
  ${EndIf}
  ${TrimNewLines} $R1 $R1
  ${TrimNewLines} $R2 $R2
  ${TrimNewLines} $R3 $R3
  ${TrimNewLines} $R4 $R4
  ${TrimNewLines} $R5 $R5
  ${If} $R1 == ""
    Return
  ${EndIf}
  SendMessage $Balken ${PBM_SETPOS} $R1 0
  ${NSD_SetText} $LOben $R2
  ${NSD_SetText} $LUnten $R3
  ${If} $R4 == "fertig"
    ${NSD_KillTimer} HolenTakt
    StrCpy $HolenLaeuft 0
    GetDlgItem $R0 $HWNDPARENT 1
    EnableWindow $R0 1
    ; von allein weiter - „der Rest passiert von alleine"
    SendMessage $HWNDPARENT 0x408 1 0
  ${ElseIf} $R4 == "fehler"
  ${OrIf} $R4 == "halt"
    ${NSD_KillTimer} HolenTakt
    StrCpy $HolenLaeuft 0
    ${NSD_SetText} $LSchluss $R5
    ShowWindow $LSchluss ${SW_SHOW}
    ShowWindow $KnopfNochmal ${SW_SHOW}
    GetDlgItem $R0 $HWNDPARENT 1
    EnableWindow $R0 1
  ${EndIf}
  nichts:
FunctionEnd

Function HolenVerlassen
  ${If} $HolenLaeuft == 1
    Abort
  ${EndIf}
FunctionEnd

; Abbrechen (nach der Rueckfrage von MUI_ABORTWARNING): laeuft das Holen, ihm Halt sagen und kurz warten
Function AbbruchHalt
  ${If} $HolenLaeuft == 1
    FileOpen $R0 "$PLUGINSDIR\stand.txt.halt" w
    FileClose $R0
    Sleep 1500
  ${EndIf}
FunctionEnd

; Im stillen Lauf (/S) gibt es keine Seiten - dann holt die Installation selbst, im Protokoll statt mit Balken.
; /OHNEHOLEN laesst das aus (fuer Probelaeufe).
Section "-Holen"
  ${If} ${Silent}
    ${GetParameters} $R0
    ClearErrors
    ${GetOptions} $R0 "/OHNEHOLEN" $R1
    ${If} ${Errors}
      Call SpracheSetzen
      SetOutPath "$INSTDIR"
      nsExec::ExecToLog '"$INSTDIR\werkzeug\node\node.exe" "$INSTDIR\bin\installieren.js"'
      Pop $R0
    ${EndIf}
  ${EndIf}
SectionEnd

; Auf der Abschlussseite fuehrt „Zurueck" nirgends mehr hin: kopiert und geholt ist
Function KeinZurueck
  GetDlgItem $R0 $HWNDPARENT 3
  EnableWindow $R0 0
FunctionEnd

; Liegt schon ein Archiv da (ein Update), ist die Einrichtung getan - dann startet die App selbst.
Function FertigVorbereiten
  ${If} ${FileExists} "$INSTDIR\library\katalog.json.gz"
  ${OrIf} ${FileExists} "$INSTDIR\library\katalog.json"
    StrCpy $FertigText "$(fertig_text_update)"
    StrCpy $FertigLauf "$(fertig_starten)"
  ${Else}
    StrCpy $FertigText "$(fertig_text)"
    StrCpy $FertigLauf "$(fertig_weiter)"
  ${EndIf}
FunctionEnd

; Fertig -> mit Archiv: das Symbol (KlangTresor.exe) startet die App; ohne: die Einrichtung ab dem Suno-Namen, nur als
; Seite im Browser, ohne Fenster
Function WeiterImBrowser
  Call SpracheSetzen
  SetOutPath "$INSTDIR"
  ${If} $FertigLauf == "$(fertig_starten)"
    Exec '"$INSTDIR\KlangTresor.exe"'
    Return
  ${EndIf}
  ExecShell "open" "$INSTDIR\werkzeug\node\node.exe" '"$INSTDIR\bin\einrichten.js" --nach-setup' SW_HIDE
FunctionEnd

; Groesse eines Ordners in Worten: „3,4 GB" / „120 MB" / „nicht vorhanden". $R0 = Ordner, Ergebnis in $R1.
; Gezaehlt von PowerShell, nicht mit ${GetSize}: das uebergeht Einzeldateien ueber 2 GB - das Whisper-Modell hat 3,1 GB,
; und die Schlussseite nannte im Test 1,1 GB statt 4,1 GB (29.10.2026).
Function un.Groesse
  ${IfNot} ${FileExists} "$R0\*.*"
    StrCpy $R1 "$(nichts_da)"
    Return
  ${EndIf}
  InitPluginsDir
  FileOpen $R2 "$PLUGINSDIR\groesse.ps1" w
  FileWriteWord $R2 0xFEFF
  FileWriteUTF16LE $R2 "$$s = (Get-ChildItem -LiteralPath '$R0' -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum$\r$\n"
  FileWriteUTF16LE $R2 "[math]::Floor([double]$$s / 1MB)$\r$\n"
  FileClose $R2
  nsExec::ExecToStack 'powershell -NoProfile -ExecutionPolicy Bypass -File "$PLUGINSDIR\groesse.ps1"'
  Pop $R3
  Pop $R2
  ${un.TrimNewLines} $R2 $R2
  ${If} $R3 != 0
  ${OrIf} $R2 == ""
    StrCpy $R1 "?"
    Return
  ${EndIf}
  ${If} $R2 >= 1024
    IntOp $R3 $R2 / 1024
    IntOp $R4 $R2 % 1024
    IntOp $R4 $R4 * 10
    IntOp $R4 $R4 / 1024
    StrCpy $R1 "$R3,$R4 GB"
  ${Else}
    StrCpy $R1 "$R2 MB"
  ${EndIf}
FunctionEnd

Section "Uninstall"
  Call un.LaeuftNicht
  ; Genau das, was die Setup.exe hingelegt hat (vom Bauskript aus dem Inhalt erzeugt) - library\ und modelle\
  ; stehen nie darin.
  !include "${ENTFERNEN}"
  ; Hielt etwas eine Datei kurz fest (im Test: der Virenschutz an einem eben gelaufenen node.exe, werkzeug\ blieb
  ; stehen), gibt es einen zweiten Durchgang.
  ${If} ${FileExists} "$INSTDIR\werkzeug\*.*"
  ${OrIf} ${FileExists} "$INSTDIR\node_modules\*.*"
    Sleep 1500
    !include "${ENTFERNEN}"
  ${EndIf}
  Delete "$INSTDIR\KlangTresor-entfernen.exe"
  ; das Protokoll des Symbols (KlangTresor.exe) - Programmausgabe, kein Archiv
  RMDir /r "$INSTDIR\protokoll"
  RMDir /r "$SMPROGRAMS\KlangTresor"
  ; Die Verknuepfung auf dem Desktop legt die Einrichtung an (bin/einrichten.js) - sie zeigte jetzt ins Leere.
  Delete "$DESKTOP\KlangTresor.lnk"
  DeleteRegKey HKCU "${UNINST}"

  StrCpy $R0 "$INSTDIR\library"
  Call un.Groesse
  StrCpy $ArchivGroesse $R1
  StrCpy $R0 "$INSTDIR\modelle"
  Call un.Groesse
  StrCpy $ModellGroesse $R1
  ; Nur wenn nichts mehr darin liegt.
  RMDir "$INSTDIR"
SectionEnd
