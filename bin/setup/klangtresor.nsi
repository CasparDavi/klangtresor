; KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
; =============================================================
; DIE SETUP.EXE FUER WINDOWS
; bin/setup/klangtresor.nsi - gebaut von bin/setup-bauen.js (makensis, laeuft auf dem Mac)
;
; Caspar_D, 28.10.2026: „Alles was nötig ist, wird im Setup gemacht" - und „dass nichts im Verborgenen
; stattfindet". Die Setup.exe bringt darum mit, was die Einrichtung sonst erst aus dem Netz holte:
;   werkzeug\node     Node.js fuer Windows x64
;   werkzeug\ffmpeg   ffmpeg (gyan.dev, essentials)
;   node_modules      die Pakete aus package-lock.json, onnxruntime nur fuer Windows x64
; Danach startet sie die gewohnte Einrichtung (einrichten-windows.cmd). Die sieht nach, findet das alles vor und
; ueberspringt es - mit „ist da" auf der Seite, nicht still. Was sie dann noch holt (KI-Modelle, Whisper), holt sie
; mit Balken.
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

!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\KlangTresor"

Name "KlangTresor ${VERSION}"
OutFile "${AUSGABE}"
InstallDir "$PROFILE\KlangTresor"
BrandingText "KlangTresor ${VERSION}"
ShowInstDetails show
ShowUninstDetails show

Var ArchivGroesse
Var ModellGroesse

!define MUI_ICON "${INHALT}\web\symbol\klangtresor.ico"
!define MUI_UNICON "${INHALT}\web\symbol\klangtresor.ico"
!define MUI_ABORTWARNING

!define MUI_DIRECTORYPAGE_TEXT_TOP "$(ordner_oben)"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_TITLE "$(fertig_titel)"
!define MUI_FINISHPAGE_TEXT "$(fertig_text)"
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_TEXT "$(fertig_einrichten)"
!define MUI_FINISHPAGE_RUN_FUNCTION EinrichtungStarten
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!define MUI_FINISHPAGE_TITLE "$(weg_titel)"
!define MUI_FINISHPAGE_TEXT "$(weg_text)"
!insertmacro MUI_UNPAGE_FINISH

; Die Sprache folgt der Windows-Oberflaeche; was keine der drei ist, bekommt Englisch (wie einrichten-windows.cmd).
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "German"
!insertmacro MUI_LANGUAGE "Russian"

LangString ordner_oben ${LANG_GERMAN} "KlangTresor kommt in diesen Ordner - das Programm und später dein Archiv (Unterordner library), beides an einem Ort. Verwalterrechte braucht es nicht.$\r$\n$\r$\nLiegt hier schon ein KlangTresor, wird nur das Programm erneuert; dein Archiv bleibt unberührt."
LangString ordner_oben ${LANG_ENGLISH} "KlangTresor goes into this folder - the program and later your archive (subfolder library), both in one place. No administrator rights needed.$\r$\n$\r$\nIf a KlangTresor is already here, only the program is renewed; your archive stays untouched."
LangString ordner_oben ${LANG_RUSSIAN} "KlangTresor будет установлен в эту папку - программа и позже ваш архив (подпапка library), всё в одном месте. Права администратора не нужны.$\r$\n$\r$\nЕсли здесь уже есть KlangTresor, обновится только программа; ваш архив останется нетронутым."

LangString ordner_fremd ${LANG_GERMAN} "In diesem Ordner liegen schon andere Dateien, aber kein KlangTresor.$\r$\n$\r$\nBitte einen leeren oder neuen Ordner wählen - etwa einen Unterordner „KlangTresor“. Sonst könnte das spätere Entfernen fremde Dateien treffen."
LangString ordner_fremd ${LANG_ENGLISH} "This folder already holds other files, but no KlangTresor.$\r$\n$\r$\nPlease choose an empty or new folder - for example a subfolder „KlangTresor“. Otherwise removing it later could hit files that are not KlangTresor's."
LangString ordner_fremd ${LANG_RUSSIAN} "В этой папке уже есть другие файлы, но нет KlangTresor.$\r$\n$\r$\nВыберите пустую или новую папку - например, подпапку «KlangTresor». Иначе при удалении могут пострадать чужие файлы."

LangString fertig_titel ${LANG_GERMAN} "Das Programm ist da"
LangString fertig_titel ${LANG_ENGLISH} "The program is in place"
LangString fertig_titel ${LANG_RUSSIAN} "Программа установлена"

LangString fertig_text ${LANG_GERMAN} "Node.js, ffmpeg und die Programmbausteine liegen in $INSTDIR.$\r$\n$\r$\nJetzt folgt die Einrichtung im Browser: dein Suno-Name, deine Lieder und - wenn du willst - die KI-Modelle (rund 4,7 GB, mit Fortschrittsbalken).$\r$\n$\r$\nSpäter startest du KlangTresor über das Startmenü oder die Verknüpfung auf dem Desktop."
LangString fertig_text ${LANG_ENGLISH} "Node.js, ffmpeg and the program components are in $INSTDIR.$\r$\n$\r$\nNext comes the setup in your browser: your Suno name, your songs and - if you like - the AI models (about 4.7 GB, with progress bars).$\r$\n$\r$\nLater you start KlangTresor from the Start menu or the shortcut on the desktop."
LangString fertig_text ${LANG_RUSSIAN} "Node.js, ffmpeg и компоненты программы находятся в $INSTDIR.$\r$\n$\r$\nДальше - настройка в браузере: ваше имя в Suno, ваши песни и, если хотите, ИИ-модели (около 4,7 ГБ, с индикатором прогресса).$\r$\n$\r$\nПозже KlangTresor запускается из меню «Пуск» или ярлыком на рабочем столе."

LangString fertig_einrichten ${LANG_GERMAN} "Einrichtung jetzt starten"
LangString fertig_einrichten ${LANG_ENGLISH} "Start the setup now"
LangString fertig_einrichten ${LANG_RUSSIAN} "Начать настройку сейчас"

LangString lnk_entfernen ${LANG_GERMAN} "KlangTresor entfernen"
LangString lnk_entfernen ${LANG_ENGLISH} "Remove KlangTresor"
LangString lnk_entfernen ${LANG_RUSSIAN} "Удалить KlangTresor"

LangString laeuft_noch ${LANG_GERMAN} "KlangTresor läuft noch.$\r$\n$\r$\nBitte das schwarze Fenster „KlangTresor läuft“ schließen und dann „Wiederholen“ wählen."
LangString laeuft_noch ${LANG_ENGLISH} "KlangTresor is still running.$\r$\n$\r$\nPlease close the black window „KlangTresor is running“ and then choose „Retry“."
LangString laeuft_noch ${LANG_RUSSIAN} "KlangTresor ещё работает.$\r$\n$\r$\nЗакройте чёрное окно «KlangTresor работает» и нажмите «Повторить»."

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
; Ein Ordner, in dem schon fremde Dateien liegen, wird nicht genommen: das Entfernen loescht spaeter bin\, docs\,
; web\ ... - in „Dokumente" gewaehlt, traefe das womoeglich Ordner des Nutzers gleichen Namens.
Function .onVerifyInstDir
  ${If} ${FileExists} "$INSTDIR\*.*"
  ${AndIfNot} ${FileExists} "$INSTDIR\server\server.js"
    FindFirst $0 $1 "$INSTDIR\*.*"
    ${DoWhile} $1 != ""
      ${If} $1 != "."
      ${AndIf} $1 != ".."
        FindClose $0
        Abort
      ${EndIf}
      FindNext $0 $1
    ${Loop}
    FindClose $0
  ${EndIf}
FunctionEnd

; Laeuft der Server aus diesem Ordner, ist node.exe gesperrt. Lieber vorher sagen als mitten im Kopieren scheitern.
!macro LaeuftNicht UN
Function ${UN}LaeuftNicht
  ${Do}
    ${IfNot} ${FileExists} "$INSTDIR\werkzeug\node\node.exe"
      ${ExitDo}
    ${EndIf}
    ClearErrors
    Rename "$INSTDIR\werkzeug\node\node.exe" "$INSTDIR\werkzeug\node\node.exe.pruefen"
    ${IfNot} ${Errors}
      Rename "$INSTDIR\werkzeug\node\node.exe.pruefen" "$INSTDIR\werkzeug\node\node.exe"
      ${ExitDo}
    ${EndIf}
    MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "$(laeuft_noch)" IDRETRY weiter
    Quit
    weiter:
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
  CreateShortcut "$SMPROGRAMS\KlangTresor\KlangTresor.lnk" "$INSTDIR\starten-windows.cmd" "" "$INSTDIR\web\symbol\klangtresor.ico"
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

Function EinrichtungStarten
  SetOutPath "$INSTDIR"
  ExecShell "open" "$INSTDIR\einrichten-windows.cmd"
FunctionEnd

; Groesse eines Ordners in Worten: „3,4 GB" / „120 MB" / „nicht vorhanden". $R0 = Ordner, Ergebnis in $R1.
Function un.Groesse
  ${IfNot} ${FileExists} "$R0\*.*"
    StrCpy $R1 "$(nichts_da)"
    Return
  ${EndIf}
  ${GetSize} "$R0" "/S=0M" $R2 $R3 $R4
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
  Delete "$INSTDIR\KlangTresor-entfernen.exe"
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
