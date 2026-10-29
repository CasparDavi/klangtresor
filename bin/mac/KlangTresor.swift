// KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
// =============================================================
// KLANGTRESOR AUF DEM MAC - DIE APP IM DOCK
// bin/mac/KlangTresor.swift - gebaut von bin/dmg-bauen.js (swiftc, x86_64 und arm64 in einer Datei), liegt als
// KlangTresor.app/Contents/MacOS/KlangTresor
//
// Caspar_D, 29.10.2026: „solche installer hätte ich dann auch für die anderen Systeme" - fuer den Mac: Beenden ueber
// das Dock bzw. Cmd-Q („genau so"), der Fortschritt beim Holen im Browser („wenn das nicht anders geht").
//
// Beim Oeffnen:
//   1. laeuft KlangTresor schon (Port 8788), geht nur die Seite auf - ist diese App neuer, fragt sie, ob sie beenden
//      und erneuern darf
//   2. sonst legt sie das Programm nach ~/KlangTresor (beim ersten Mal ganz, spaeter nur, wenn sie neuer ist;
//      library/ und modelle/ nie) - mit Node und Whisper fuer diesen Mac (Intel oder Apple Silicon)
//   3. ist noch kein Archiv da: die Einrichtung als Seite im Browser (bin/einrichten.js --nach-setup) - sie holt
//      ffmpeg und die KI-Modelle mit Balken und fragt nach dem Suno-Namen
//   4. dann der Server (bin/starten.js), ohne Terminal, Ausgabe nach protokoll/klangtresor.log
// Solange er laeuft, steht KlangTresor im Dock: Klick oeffnet die Seite, Rechtsklick zeigt Protokoll und Neu starten,
// Cmd-Q / „Beenden" beendet den Server. Beendet ihn der Knopf in Profil → System (Code 0), geht auch die App.
// =============================================================
import AppKit

let ADRESSE = "http://localhost:8788/"
let heim = FileManager.default.homeDirectoryForCurrentUser
let ZIEL = URL(fileURLWithPath: ProcessInfo.processInfo.environment["KT_ORDNER"] ?? heim.appendingPathComponent("KlangTresor").path)
let RES = Bundle.main.resourceURL!
let ARCH: String = { var u = utsname(); uname(&u); let m = withUnsafeBytes(of: &u.machine) { String(decoding: $0.prefix(while: { $0 != 0 }), as: UTF8.self) }; return m == "arm64" ? "arm64" : "x64" }()

func sprache() -> String {
    if let s = ProcessInfo.processInfo.environment["KT_SPRACHE"], ["de", "en", "ru"].contains(s) { return s }
    let l = (Locale.preferredLanguages.first ?? "en").prefix(2)
    return l == "de" || l == "ru" ? String(l) : "en"
}
let SPR = sprache()
func L(_ de: String, _ en: String, _ ru: String) -> String { SPR == "ru" ? ru : SPR == "en" ? en : de }

func fassung(_ ordner: URL) -> String? {
    guard let d = try? Data(contentsOf: ordner.appendingPathComponent("package.json")),
          let j = try? JSONSerialization.jsonObject(with: d) as? [String: Any] else { return nil }
    return j["version"] as? String
}
func neuer(_ a: String, als b: String?) -> Bool {
    guard let b = b else { return true }
    return a.compare(b, options: .numeric) == .orderedDescending
}
func antwortet() -> Bool {
    var ok = false
    let s = DispatchSemaphore(value: 0)
    var r = URLRequest(url: URL(string: ADRESSE)!); r.timeoutInterval = 1.5
    URLSession.shared.dataTask(with: r) { _, a, _ in ok = (a as? HTTPURLResponse)?.statusCode == 200; s.signal() }.resume()
    _ = s.wait(timeout: .now() + 2)
    return ok
}
func beendenAnfragen() {
    var r = URLRequest(url: URL(string: ADRESSE + "api/system/beenden")!); r.httpMethod = "POST"; r.timeoutInterval = 3
    let s = DispatchSemaphore(value: 0)
    URLSession.shared.dataTask(with: r) { _, _, _ in s.signal() }.resume()
    _ = s.wait(timeout: .now() + 4)
}
func seiteAuf() { NSWorkspace.shared.open(URL(string: ADRESSE + "?sprache=" + SPR)!) }

final class App: NSObject, NSApplicationDelegate {
    var kind: Process?
    var gewollt = false
    var protokoll: FileHandle?
    var neuStarten: NSMenuItem?

    func applicationDidFinishLaunching(_ n: Notification) {
        NSApp.setActivationPolicy(.regular)
        let neu = fassung(RES.appendingPathComponent("programm")) ?? "?"
        let alt = fassung(ZIEL)
        if antwortet() {
            if neuer(neu, als: alt) && frage(L("KlangTresor \(alt ?? "") läuft. Diese App bringt \(neu).\n\nKlangTresor beenden und erneuern? Dein Archiv bleibt, wie es ist.",
                                               "KlangTresor \(alt ?? "") is running. This app brings \(neu).\n\nQuit KlangTresor and update? Your archive stays as it is.",
                                               "KlangTresor \(alt ?? "") работает. Это приложение содержит \(neu).\n\nЗавершить KlangTresor и обновить? Ваш архив останется как есть.")) {
                beendenAnfragen()
                for _ in 0..<50 where antwortet() { Thread.sleep(forTimeInterval: 0.2) }
            } else { seiteAuf(); NSApp.terminate(nil); return }
        }
        if neuer(neu, als: alt) {
            guard legen(neu: neu) else { NSApp.terminate(nil); return }
        }
        protokollOeffnen()
        let fertig = FileManager.default.fileExists(atPath: ZIEL.appendingPathComponent("library/katalog.json.gz").path)
                  || FileManager.default.fileExists(atPath: ZIEL.appendingPathComponent("library/katalog.json").path)
        if fertig { starten(ohneBrowser: false) } else { einrichten() }
    }

    func frage(_ text: String) -> Bool {
        let a = NSAlert(); a.messageText = "KlangTresor"; a.informativeText = text
        a.addButton(withTitle: L("Beenden und erneuern", "Quit and update", "Завершить и обновить"))
        a.addButton(withTitle: L("Nur öffnen", "Just open", "Только открыть"))
        NSApp.activate(ignoringOtherApps: true)
        return a.runModal() == .alertFirstButtonReturn
    }

    // Programm nach ~/KlangTresor - mit einem kleinen Fenster, damit niemand auf ein leeres Dock-Symbol starrt
    func legen(neu: String) -> Bool {
        let f = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 420, height: 90), styleMask: [.titled], backing: .buffered, defer: false)
        f.title = "KlangTresor"
        let t = NSTextField(labelWithString: L("KlangTresor \(neu) wird nach \(ZIEL.path) gelegt …", "Placing KlangTresor \(neu) in \(ZIEL.path) …", "KlangTresor \(neu) копируется в \(ZIEL.path) …"))
        t.frame = NSRect(x: 20, y: 50, width: 380, height: 20)
        let b = NSProgressIndicator(frame: NSRect(x: 20, y: 20, width: 380, height: 16)); b.isIndeterminate = true; b.startAnimation(nil)
        f.contentView?.addSubview(t); f.contentView?.addSubview(b); f.center(); f.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        var fehler: String?
        let fm = FileManager.default
        let fertig = DispatchSemaphore(value: 0)
        DispatchQueue.global().async {
            do {
                try fm.createDirectory(at: ZIEL, withIntermediateDirectories: true)
                let prog = RES.appendingPathComponent("programm")
                // Node und die Pakete ganz ersetzen (genau nach package-lock), alles andere darueberlegen
                for n in ["werkzeug/node", "node_modules"] { try? fm.removeItem(at: ZIEL.appendingPathComponent(n)) }
                func kopieren(_ von: URL, _ nach: URL) throws {
                    var istOrdner: ObjCBool = false
                    fm.fileExists(atPath: von.path, isDirectory: &istOrdner)
                    if istOrdner.boolValue {
                        try fm.createDirectory(at: nach, withIntermediateDirectories: true)
                        for k in try fm.contentsOfDirectory(atPath: von.path) { try kopieren(von.appendingPathComponent(k), nach.appendingPathComponent(k)) }
                    } else {
                        if fm.fileExists(atPath: nach.path) { try fm.removeItem(at: nach) }
                        try fm.copyItem(at: von, to: nach)
                    }
                }
                try kopieren(prog, ZIEL)
                try kopieren(RES.appendingPathComponent("node-\(ARCH)"), ZIEL.appendingPathComponent("werkzeug/node"))
                let w = RES.appendingPathComponent("whisper-\(ARCH)")
                if fm.fileExists(atPath: w.path) {
                    try fm.createDirectory(at: ZIEL.appendingPathComponent("werkzeug/whisper"), withIntermediateDirectories: true)
                    let z = ZIEL.appendingPathComponent("werkzeug/whisper/whisper-cli")
                    if fm.fileExists(atPath: z.path) { try fm.removeItem(at: z) }
                    try fm.copyItem(at: w, to: z)
                }
                // Was aus einer heruntergeladenen App kopiert wird, traegt deren Quarantaene-Merkmal - macOS wuerde
                // jedes Programm darin einzeln sperren. Die eigenen Dateien davon befreien.
                let x = Process(); x.executableURL = URL(fileURLWithPath: "/usr/bin/xattr")
                x.arguments = ["-dr", "com.apple.quarantine", ZIEL.path]; try? x.run(); x.waitUntilExit()
            } catch { fehler = error.localizedDescription }
            fertig.signal()
        }
        while fertig.wait(timeout: .now()) == .timedOut { RunLoop.current.run(until: Date().addingTimeInterval(0.05)) }
        f.close()
        if let e = fehler {
            let a = NSAlert(); a.messageText = L("KlangTresor ließ sich nicht hinlegen", "KlangTresor could not be placed", "Не удалось скопировать KlangTresor")
            a.informativeText = e; a.runModal(); return false
        }
        return true
    }

    func protokollOeffnen() {
        let o = ZIEL.appendingPathComponent("protokoll"), f = o.appendingPathComponent("klangtresor.log")
        try? FileManager.default.createDirectory(at: o, withIntermediateDirectories: true)
        let alt = o.appendingPathComponent("klangtresor.alt.log")
        try? FileManager.default.removeItem(at: alt); try? FileManager.default.moveItem(at: f, to: alt)
        FileManager.default.createFile(atPath: f.path, contents: nil)
        protokoll = try? FileHandle(forWritingTo: f)
        schreiben("--- KlangTresor startet in \(ZIEL.path)")
    }
    func schreiben(_ z: String) {
        let d = DateFormatter(); d.dateFormat = "yyyy-MM-dd HH:mm:ss"
        protokoll?.write((d.string(from: Date()) + "  " + z + "\n").data(using: .utf8)!)
    }

    func node(_ args: [String], ende: @escaping (Int32) -> Void) {
        let p = Process()
        p.executableURL = ZIEL.appendingPathComponent("werkzeug/node/bin/node")
        p.arguments = args
        p.currentDirectoryURL = ZIEL
        var env = ProcessInfo.processInfo.environment
        env["KT_SPRACHE"] = SPR
        env["PATH"] = [ZIEL.appendingPathComponent("werkzeug/ffmpeg/bin").path, ZIEL.appendingPathComponent("werkzeug/node/bin").path, env["PATH"] ?? "/usr/bin:/bin"].joined(separator: ":")
        p.environment = env
        let rohr = Pipe(); p.standardOutput = rohr; p.standardError = rohr
        p.standardInput = FileHandle.nullDevice
        rohr.fileHandleForReading.readabilityHandler = { [weak self] h in
            let d = h.availableData
            if !d.isEmpty, let s = String(data: d, encoding: .utf8) { for z in s.split(separator: "\n", omittingEmptySubsequences: false) where !z.isEmpty { self?.schreiben(String(z)) } }
        }
        p.terminationHandler = { k in DispatchQueue.main.async { ende(k.terminationStatus) } }
        do { try p.run(); kind = p } catch { schreiben("Start ging nicht: \(error)"); ende(1) }
    }

    func einrichten() {
        schreiben("noch kein Archiv - Einrichtung im Browser")
        node(["bin/einrichten.js", "--nach-setup"]) { [weak self] code in
            guard let self = self else { return }
            self.schreiben("--- Einrichtung beendet mit Code \(code)")
            if code == 0 { self.starten(ohneBrowser: false) } else { NSApp.terminate(nil) }
        }
    }

    func starten(ohneBrowser: Bool) {
        neuStarten?.isHidden = true
        node(["bin/starten.js"] + (ohneBrowser ? ["--ohne-browser"] : [])) { [weak self] code in
            guard let self = self, !self.gewollt else { return }
            self.schreiben("--- beendet mit Code \(code)")
            // Code 0: „KlangTresor beenden" in der App - dann geht auch das Dock-Symbol
            if code == 0 { self.gewollt = true; NSApp.terminate(nil); return }
            self.neuStarten?.isHidden = false
            let a = NSAlert(); a.messageText = L("KlangTresor hat sich beendet", "KlangTresor has stopped", "KlangTresor остановился")
            a.informativeText = L("Rechtsklick auf das Symbol im Dock: Neu starten oder Protokoll anzeigen.", "Right-click the Dock icon: Restart or Show log.", "Правый клик по значку в Dock: перезапустить или показать журнал.")
            a.runModal()
        }
    }

    // Klick auf das Dock-Symbol: die Seite
    func applicationShouldHandleReopen(_ s: NSApplication, hasVisibleWindows: Bool) -> Bool { seiteAuf(); return false }

    func applicationDockMenu(_ s: NSApplication) -> NSMenu? {
        let m = NSMenu()
        m.addItem(withTitle: L("KlangTresor öffnen", "Open KlangTresor", "Открыть KlangTresor"), action: #selector(oeffnen), keyEquivalent: "")
        let n = NSMenuItem(title: L("Neu starten", "Restart", "Перезапустить"), action: #selector(nochmal), keyEquivalent: "")
        n.isHidden = kind?.isRunning ?? false
        m.addItem(n); neuStarten = n
        m.addItem(withTitle: L("Protokoll anzeigen", "Show log", "Показать журнал"), action: #selector(protokollZeigen), keyEquivalent: "")
        for i in m.items { i.target = self }
        return m
    }
    @objc func oeffnen() { seiteAuf() }
    @objc func nochmal() { gewollt = false; starten(ohneBrowser: true) }
    @objc func protokollZeigen() { NSWorkspace.shared.open(ZIEL.appendingPathComponent("protokoll/klangtresor.log")) }

    // Cmd-Q / Beenden: den Server ordentlich beenden, dann alles, was aus diesem Ordner noch laeuft
    func applicationWillTerminate(_ n: Notification) {
        gewollt = true
        if kind?.isRunning ?? false {
            beendenAnfragen()
            Thread.sleep(forTimeInterval: 0.8)
            let k = Process(); k.executableURL = URL(fileURLWithPath: "/usr/bin/pkill")
            k.arguments = ["-f", "^" + ZIEL.appendingPathComponent("werkzeug/node/bin/node").path]
            try? k.run(); k.waitUntilExit()
        }
        schreiben("--- beendet über das Dock")
    }
}

// Ein Menue mit „Beenden" (Cmd-Q) - mehr braucht die App nicht
let app = NSApplication.shared
let haupt = NSMenu(), appEintrag = NSMenuItem(); haupt.addItem(appEintrag)
let appMenue = NSMenu()
appMenue.addItem(withTitle: L("KlangTresor öffnen", "Open KlangTresor", "Открыть KlangTresor"), action: #selector(App.oeffnen), keyEquivalent: "o")
appMenue.addItem(.separator())
appMenue.addItem(withTitle: L("KlangTresor beenden", "Quit KlangTresor", "Выйти из KlangTresor"), action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
appEintrag.submenu = appMenue
app.mainMenu = haupt
let delegat = App()
app.delegate = delegat
app.run()
