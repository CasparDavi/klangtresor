// KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
// =============================================================
// KLANGTRESOR UNTER WINDOWS - DAS SYMBOL UNTEN RECHTS
// bin/windows/KlangTresor.cs - gebaut von bin/setup-bauen.js (dotnet auf dem Mac), liegt als KlangTresor.exe im
// Installationsordner. Startmenue, Schreibtisch und das Ende der Einrichtung zeigen hierauf.
//
// Caspar_D, 29.10.2026: „kein konsolenfenster mehr". Bis 1.0.134 lief der Server in einem schwarzen Fenster
// („KlangTresor laeuft - dieses Fenster nicht schliessen"); wer es schloss, beendete KlangTresor. Jetzt:
//   - ein Symbol im Infobereich der Taskleiste; Doppelklick oder „KlangTresor oeffnen" zeigt die Seite
//   - der Server laeuft ohne Fenster: bin\starten.js wie bisher (holt den Server nach einem Update zurueck - Code 75 -
//     und oeffnet den Browser, sobald er antwortet)
//   - was im schwarzen Fenster stand, steht in protokoll\klangtresor.log; „Protokoll anzeigen" oeffnet es - nichts
//     laeuft im Verborgenen
//   - „Beenden" beendet den Server samt allem, was er gestartet hat (ein Windows-Job: endet das Symbol, enden die
//     Kinder mit - auch wenn es abstuerzt, bleibt kein verwaister Server zurueck)
//   - ein zweiter Start oeffnet nur die Seite; antwortet auf 8788 schon ein KlangTresor (etwa aus
//     starten-windows.cmd, dem Rueckfall), ebenso
// .NET Framework 4.7.2 liegt jedem Windows 10 (ab 1803) und 11 bei - der Nutzer installiert nichts.
// =============================================================
using System;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;

static class KlangTresor
{
    static readonly string Wurzel = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
    const string Adresse = "http://localhost:8788/";
    // Fuer die eigenen Anfragen 127.0.0.1 und KEIN Proxy (29.10.2026): .NET sucht fuer „localhost" erst einen Proxy
    // (im Windows-10-Test 2 s) - laenger als die 1,5 s Wartezeit. Jede Anfrage scheiterte so still: das Symbol hielt den
    // Server fuer stumm, oeffnete trotz offenem Tab einen neuen und erneuerte sich nach einem Update nie.
    const string Api = "http://127.0.0.1:8788/";
    static string Spr;
    static Process Kind;
    static IntPtr Job = IntPtr.Zero;
    static NotifyIcon Symbol;
    // Der Faden der Oberflaeche, fuer Meldungen aus anderen Faeden (Prozessende, Warten auf den Server). Bis 1.0.138 lief
    // das ueber das Rechtsklick-Menue - dessen Fenster gibt es aber erst, wenn es einmal offen war. Wer nie
    // rechtsgeklickt hatte und in der App „KlangTresor beenden" drueckte, liess das Symbol abstuerzen (Windows 11,
    // 29.10.2026: InvalidOperationException in BeginInvoke).
    static Control Ui;
    static ToolStripMenuItem NeuStarten;
    static DateTime Seit;
    static bool Gewollt;            // Beenden kam vom Menue, nicht von allein
    static StreamWriter Protokoll;
    static readonly object Sperre = new object();
    static string LetzteZeile = "";

    // --- Texte: Deutsch, Englisch, Russisch - die Sprache wie bin/sprache.js (KT_SPRACHE, sonst Windows-Sprache)
    static string L(string de, string en, string ru) { return Spr == "ru" ? ru : Spr == "en" ? en : de; }
    static string Sprache()
    {
        string s = (Environment.GetEnvironmentVariable("KT_SPRACHE") ?? "").Trim().ToLowerInvariant();
        if (s == "de" || s == "en" || s == "ru") return s;
        s = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName.ToLowerInvariant();
        return s == "de" || s == "ru" ? s : "en";
    }

    [STAThread]
    static void Main(string[] args)
    {
        Spr = Sprache();
        WebRequest.DefaultWebProxy = null;
        bool ohneBrowser = Array.IndexOf(args, "--ohne-browser") >= 0;
        bool nachfolger = Array.IndexOf(args, "--nachfolger") >= 0;
        bool neu;
        // Ein Symbol je Installationsordner. Der Name haengt am Ordner, nicht an einer Zufallszahl.
        using (var m = new Mutex(true, "KlangTresor-" + Kennung(Wurzel.ToLowerInvariant()), out neu))
        {
            // Der Nachfolger nach einem Update (siehe Erneuert): warten, bis der Vorgaenger samt Server weg ist
            if (nachfolger)
            {
                if (!neu) { try { neu = m.WaitOne(20000); } catch (AbandonedMutexException) { neu = true; } }
                for (int i = 0; i < 40 && Antwortet(); i++) Thread.Sleep(250);
            }
            if (!neu || Antwortet()) { if (!ohneBrowser) SeiteAuf(); return; }
            if (!File.Exists(Path.Combine(Wurzel, "werkzeug", "node", "node.exe")) || !File.Exists(Path.Combine(Wurzel, "bin", "starten.js")))
            {
                MessageBox.Show(L("Hier fehlt ein Teil von KlangTresor (werkzeug\\node\\node.exe oder bin\\starten.js).\n\nDie Setup.exe noch einmal ausführen - dein Archiv bleibt dabei unberührt.",
                                  "A part of KlangTresor is missing here (werkzeug\\node\\node.exe or bin\\starten.js).\n\nRun the Setup.exe once more - your archive stays untouched.",
                                  "Здесь не хватает части KlangTresor (werkzeug\\node\\node.exe или bin\\starten.js).\n\nЗапустите Setup.exe ещё раз - ваш архив останется нетронутым."),
                                "KlangTresor", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Ui = new Control(); Ui.CreateControl(); var unused = Ui.Handle;
            SymbolBauen();
            JobAnlegen();
            Starten(ohneBrowser);
            ErneuerungBeobachten();
            Application.Run();
            Aufhoeren();
        }
    }

    static string Kennung(string s)
    {
        uint h = 2166136261;
        foreach (char c in s) { h ^= c; h *= 16777619; }
        return h.ToString("x8");
    }

    // --- Das Symbol und sein Menue
    static void SymbolBauen()
    {
        var menue = new ContextMenuStrip();
        var oeffnen = new ToolStripMenuItem(L("KlangTresor öffnen", "Open KlangTresor", "Открыть KlangTresor"), null, (s, e) => SeiteAuf());
        oeffnen.Font = new Font(oeffnen.Font, FontStyle.Bold);
        NeuStarten = new ToolStripMenuItem(L("Neu starten", "Restart", "Перезапустить"), null, (s, e) => { Gewollt = false; Starten(true); });
        NeuStarten.Visible = false;
        menue.Items.Add(oeffnen);
        menue.Items.Add(NeuStarten);
        menue.Items.Add(new ToolStripMenuItem(L("Protokoll anzeigen", "Show log", "Показать журнал"), null, (s, e) => ProtokollZeigen()));
        menue.Items.Add(new ToolStripSeparator());
        menue.Items.Add(new ToolStripMenuItem(L("Beenden", "Quit", "Выйти"), null, (s, e) => { Gewollt = true; Application.ExitThread(); }));

        Icon bild;
        // Orange, das Rad aus dem Seitenkopf ohne Platte (Caspar_D, 29.10.2026: „ich will ein oranges Symbol, das andere
        // ist zu unauffällig"). Fuer 16 px kraeftiger gezeichnet als im Kopf, sonst verschwimmt es.
        try { bild = new Icon(Path.Combine(Wurzel, "web", "symbol", "klangtresor-symbol.ico"), SystemInformation.SmallIconSize); }
        catch { bild = Icon.ExtractAssociatedIcon(Application.ExecutablePath); }
        Symbol = new NotifyIcon { Icon = bild, ContextMenuStrip = menue, Text = "KlangTresor", Visible = true };
        Symbol.DoubleClick += (s, e) => SeiteAuf();
    }

    // SELBST ERNEUERN (29.10.2026, Caspar_D: „damit alles übers update kommt"). Nach einem Update setzt der Server
    // die neue KlangTresor.exe an diesen Platz (exeEinsetzen in server/server.js) - dieses Programm laeuft dann aus der
    // umbenannten alten Datei weiter. Alle 10 s wird nachgesehen; ist die Datei getauscht UND antwortet der Server
    // wieder (das Update ist dann durch, er hat neu gestartet), startet die neue Fassung als Nachfolger, und diese
    // hier geht. Der Server startet dabei einmal mit; der offene Tab meldet sich von selbst wieder, ein neuer geht
    // nicht auf (--ohne-browser).
    static string ExeStand(string f)
    {
        try { var i = new FileInfo(f); return i.Length + "/" + i.LastWriteTimeUtc.Ticks; } catch { return ""; }
    }
    static bool AuftragLaeuft()
    {
        try
        {
            var r = (HttpWebRequest)WebRequest.Create(Api + "api/system/auftrag");
            r.Timeout = 1500;
            using (var a = (HttpWebResponse)r.GetResponse())
            using (var t = new StreamReader(a.GetResponseStream()))
                return System.Text.RegularExpressions.Regex.IsMatch(t.ReadToEnd(), "\"laeuft\"\\s*:\\s*true");
        }
        catch { return true; }   // im Zweifel warten
    }
    static void ErneuerungBeobachten()
    {
        string exe = Path.Combine(Wurzel, "KlangTresor.exe"), stand = ExeStand(exe);
        var uhr = new System.Windows.Forms.Timer { Interval = 10000 };
        uhr.Tick += (s, e) =>
        {
            string jetzt = ExeStand(exe);
            // Laeuft das Update noch (etwa npm ci), wird gewartet: das Ende dieses Programms beendet ueber den Job alles,
            // was der Server gestartet hat - auch den Auftrag, der gerade einspielt.
            if (jetzt.Length == 0 || jetzt == stand || !Antwortet() || AuftragLaeuft()) return;
            uhr.Stop();
            Schreiben("--- das Symbol ist erneuert, die neue Fassung übernimmt");
            try { Process.Start(new ProcessStartInfo(exe, "--nachfolger --ohne-browser") { UseShellExecute = false, WorkingDirectory = Wurzel }); }
            catch (Exception ex) { Schreiben("Nachfolger ließ sich nicht starten: " + ex.Message); return; }
            Gewollt = true;
            Application.ExitThread();
        };
        uhr.Start();
    }

    static void Tooltip(string t)
    {
        // Windows schneidet den Hinweis bei 63 Zeichen ab
        Symbol.Text = t.Length > 63 ? t.Substring(0, 63) : t;
    }

    // --- Der Server: bin\starten.js ohne Fenster, Ausgabe ins Protokoll
    static void Starten(bool ohneBrowser)
    {
        ProtokollOeffnen();
        var si = new ProcessStartInfo(Path.Combine(Wurzel, "werkzeug", "node", "node.exe"),
                                      "bin\\starten.js --ohne-browser")
        {
            WorkingDirectory = Wurzel,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8,
        };
        si.EnvironmentVariables["KT_SPRACHE"] = Spr;
        // wie starten-windows.cmd: das mitgebrachte ffmpeg und Node vorn in den Suchpfad
        si.EnvironmentVariables["PATH"] = Path.Combine(Wurzel, "werkzeug", "ffmpeg", "bin") + ";" + Path.Combine(Wurzel, "werkzeug", "node") + ";" + (si.EnvironmentVariables["PATH"] ?? "");
        Kind = new Process { StartInfo = si, EnableRaisingEvents = true };
        Kind.OutputDataReceived += (s, e) => Schreiben(e.Data);
        Kind.ErrorDataReceived += (s, e) => Schreiben(e.Data);
        Kind.Exited += (s, e) => { try { Ui.BeginInvoke((Action)Beendet); } catch { } };
        try
        {
            Kind.Start();
        }
        catch (Exception ex)
        {
            Schreiben("Start ging nicht: " + ex.Message);
            Symbol.ShowBalloonTip(10000, "KlangTresor", L("KlangTresor ließ sich nicht starten: ", "KlangTresor could not be started: ", "Не удалось запустить KlangTresor: ") + ex.Message, ToolTipIcon.Error);
            NeuStarten.Visible = true;
            return;
        }
        if (Job != IntPtr.Zero) AssignProcessToJobObject(Job, Kind.Handle);
        Kind.BeginOutputReadLine();
        Kind.BeginErrorReadLine();
        Seit = DateTime.Now;
        NeuStarten.Visible = false;
        Tooltip(L("KlangTresor - läuft seit ", "KlangTresor - running since ", "KlangTresor - работает с ") + Seit.ToString("HH:mm"));
        // DIE SEITE OEFFNET DAS SYMBOL SELBST, nicht bin\starten.js (29.10.2026). Ein Tab, der noch offen ist, soll nach
        // vorn kommen statt eines neuen - und nach vorn holen darf Windows ein Fenster nur fuer das Programm, das der
        // Mensch gerade gestartet hat, also dieses hier, nicht den Server dahinter. Vorher hiess „schon offen" bei einem
        // Start aus dem Startmenue: es passiert sichtbar nichts. Gewartet wird, bis der Server antwortet, und dann bis
        // zu drei Sekunden, ob sich ein offener Tab wieder meldet (er tut es binnen einer Sekunde).
        if (!ohneBrowser) new Thread(() =>
        {
            for (int i = 0; i < 120 && !Antwortet(); i++) Thread.Sleep(500);
            int offen = 0;
            for (int i = 0; i < 6 && (offen = OffeneSeiten()) == 0; i++) Thread.Sleep(500);
            try { Ui.BeginInvoke((Action)(() => SeiteAuf(offen))); } catch { }
        }) { IsBackground = true }.Start();
    }

    // Von allein beendet (nicht ueber „Beenden"): sagen, warum, und den Weg zurueck anbieten
    static void Beendet()
    {
        if (Gewollt) return;
        int code = -1;
        try { code = Kind.ExitCode; } catch { }
        Schreiben("--- beendet mit Code " + code);
        // Code 0: „KlangTresor beenden" in der App (Profil → System) - dann geht auch das Symbol
        if (code == 0) { Gewollt = true; Application.ExitThread(); return; }
        NeuStarten.Visible = true;
        Tooltip(L("KlangTresor - beendet", "KlangTresor - stopped", "KlangTresor - остановлен"));
        Symbol.ShowBalloonTip(15000, L("KlangTresor hat sich beendet", "KlangTresor has stopped", "KlangTresor остановился"),
            (LetzteZeile.Length > 0 ? LetzteZeile + "\n" : "") + L("Rechtsklick auf das Symbol: Neu starten oder Protokoll anzeigen.",
                                                                    "Right-click the icon: Restart or Show log.",
                                                                    "Правый клик по значку: перезапустить или показать журнал."),
            ToolTipIcon.Warning);
    }

    static void Aufhoeren()
    {
        Gewollt = true;
        Symbol.Visible = false;
        // Der Job beendet starten.js, den Server und alles, was der Server gestartet hat
        if (Job != IntPtr.Zero) TerminateJobObject(Job, 0);
        else try { if (Kind != null && !Kind.HasExited) Kind.Kill(); } catch { }
        lock (Sperre) { try { if (Protokoll != null) { Protokoll.WriteLine(Zeit() + " --- beendet über das Symbol"); Protokoll.Dispose(); Protokoll = null; } } catch { } }
    }

    // --- Protokoll: protokoll\klangtresor.log, das vom letzten Mal als klangtresor.alt.log daneben
    static string ProtokollDatei() { return Path.Combine(Wurzel, "protokoll", "klangtresor.log"); }
    static void ProtokollOeffnen()
    {
        lock (Sperre)
        {
            if (Protokoll != null) return;
            try
            {
                Directory.CreateDirectory(Path.Combine(Wurzel, "protokoll"));
                string f = ProtokollDatei(), alt = Path.Combine(Wurzel, "protokoll", "klangtresor.alt.log");
                if (File.Exists(f)) { if (File.Exists(alt)) File.Delete(alt); File.Move(f, alt); }
                Protokoll = new StreamWriter(f, false, new UTF8Encoding(false)) { AutoFlush = true };
                Protokoll.WriteLine(Zeit() + " --- KlangTresor startet in " + Wurzel);
            }
            catch { Protokoll = null; }
        }
    }
    static string Zeit() { return DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"); }
    static void Schreiben(string z)
    {
        if (z == null) return;
        if (z.Trim().Length > 0) LetzteZeile = z.Trim().Length > 120 ? z.Trim().Substring(0, 120) : z.Trim();
        lock (Sperre) { try { if (Protokoll != null) Protokoll.WriteLine(Zeit() + "  " + z); } catch { } }
    }
    static void ProtokollZeigen()
    {
        try { Process.Start(new ProcessStartInfo("notepad.exe", "\"" + ProtokollDatei() + "\"") { UseShellExecute = true }); } catch { }
    }

    // --- Seite oeffnen und pruefen, ob schon jemand auf 8788 antwortet
    // KEIN ZWEITER TAB (Caspar_D, 29.10.2026: „klangtresor soll nicht ein extra neuen tab aufmachen im browser, wenn schon
    // einer da ist ... einfach auf den aktiven wechseln"). Der Server weiss, wie viele Seiten auf diesem Rechner offen sind
    // (POST /api/seite/zeigen, jede Seite haelt eine Leitung). Ist eine offen, wird ihr Browserfenster nach vorn geholt:
    // ein Fenster von Chrome, Edge oder Firefox, dessen Titel mit „KlangTresor" beginnt - das ist der Titel der Seite,
    // und der Browser setzt den Titel des AKTIVEN Tabs ins Fenster. Liegt der Tab im Hintergrund seines Fensters, findet
    // sich so nichts; dann blinkt die Seite in ihrem Tab (das macht sie selbst) und der Hinweis sagt, wo sie ist.
    static void SeiteAuf() { SeiteAuf(OffeneSeiten()); }
    static void SeiteAuf(int offen)
    {
        if (offen > 0)
        {
            if (!FensterNachVorn() && Symbol != null)   // ein zweiter Start hat kein eigenes Symbol
                Symbol.ShowBalloonTip(8000, "KlangTresor",
                    L("KlangTresor ist schon im Browser offen – der Tab „KlangTresor“ blinkt.",
                      "KlangTresor is already open in your browser – the “KlangTresor” tab is blinking.",
                      "KlangTresor уже открыт в браузере – вкладка «KlangTresor» мигает."), ToolTipIcon.Info);
            return;
        }
        try { Process.Start(new ProcessStartInfo(Adresse + "?sprache=" + (Spr ?? Sprache())) { UseShellExecute = true }); } catch { }
    }
    static int OffeneSeiten()
    {
        try
        {
            var r = (HttpWebRequest)WebRequest.Create(Api + "api/seite/zeigen");
            r.Method = "POST"; r.Timeout = 1500; r.ContentLength = 0;
            using (var a = (HttpWebResponse)r.GetResponse())
            using (var t = new StreamReader(a.GetResponseStream()))
            {
                var m = System.Text.RegularExpressions.Regex.Match(t.ReadToEnd(), "\"offen\"\\s*:\\s*(\\d+)");
                return m.Success ? int.Parse(m.Groups[1].Value) : 0;
            }
        }
        catch { return 0; }   // aelterer Server ohne diesen Weg: wie bisher oeffnen
    }
    delegate bool FensterRueckruf(IntPtr h, IntPtr p);
    [DllImport("user32.dll")] static extern bool EnumWindows(FensterRueckruf f, IntPtr p);
    [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
    [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
    [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h, int n);
    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
    static bool FensterNachVorn()
    {
        IntPtr ziel = IntPtr.Zero;
        EnumWindows((h, p) =>
        {
            if (!IsWindowVisible(h)) return true;
            var k = new StringBuilder(256); GetClassName(h, k, 256);
            string kl = k.ToString();
            if (kl != "Chrome_WidgetWin_1" && kl != "MozillaWindowClass") return true;   // Chrome und Edge, Firefox
            var t = new StringBuilder(512); GetWindowText(h, t, 512);
            string ti = t.ToString();
            if (ti.StartsWith("KlangTresor") || ti.StartsWith("● KlangTresor")) { ziel = h; return false; }
            return true;
        }, IntPtr.Zero);
        if (ziel == IntPtr.Zero) return false;
        if (IsIconic(ziel)) ShowWindow(ziel, 9);   // SW_RESTORE
        SetForegroundWindow(ziel);
        return true;
    }
    static bool Antwortet()
    {
        try
        {
            var r = (HttpWebRequest)WebRequest.Create(Api + "api/system/auftrag");   // klein - die Startseite ist gross
            r.Timeout = 1500;
            using (var a = (HttpWebResponse)r.GetResponse()) return a.StatusCode == HttpStatusCode.OK;
        }
        catch (WebException ex) when (ex.Response != null) { return true; }   // jede HTTP-Antwort: da laeuft einer
        catch { return false; }
    }

    // --- Windows-Job: alle Kinder enden mit dem Symbol
    [StructLayout(LayoutKind.Sequential)]
    struct BASIC { public long PerProcessUserTimeLimit, PerJobUserTimeLimit; public uint LimitFlags; public UIntPtr MinimumWorkingSetSize, MaximumWorkingSetSize; public uint ActiveProcessLimit; public UIntPtr Affinity; public uint PriorityClass, SchedulingClass; }
    [StructLayout(LayoutKind.Sequential)]
    struct IO { public ulong a, b, c, d, e, f; }
    [StructLayout(LayoutKind.Sequential)]
    struct EXTENDED { public BASIC Basic; public IO Io; public UIntPtr ProcessMemoryLimit, JobMemoryLimit, PeakProcessMemoryUsed, PeakJobMemoryUsed; }
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] static extern IntPtr CreateJobObject(IntPtr a, string name);
    [DllImport("kernel32.dll")] static extern bool SetInformationJobObject(IntPtr job, int klasse, ref EXTENDED info, uint laenge);
    [DllImport("kernel32.dll")] static extern bool AssignProcessToJobObject(IntPtr job, IntPtr prozess);
    [DllImport("kernel32.dll")] static extern bool TerminateJobObject(IntPtr job, uint code);
    static void JobAnlegen()
    {
        try
        {
            IntPtr j = CreateJobObject(IntPtr.Zero, null);
            var info = new EXTENDED();
            info.Basic.LimitFlags = 0x2000;   // JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
            if (SetInformationJobObject(j, 9, ref info, (uint)Marshal.SizeOf(typeof(EXTENDED)))) Job = j;
        }
        catch { Job = IntPtr.Zero; }
    }
}
