#!/usr/bin/env python3
# KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE
# =============================================================
# KLANGTRESOR UNTER LINUX - DAS SYMBOL IM PANEL
# bin/linux/klangtresor-symbol.py - das Gegenstueck zu bin/windows/KlangTresor.cs
#
# Caspar_D, 29.10.2026: Linux ohne Terminalfenster, beenden ueber „Beides" - ein Symbol, wo es geht, und der Knopf
# „KlangTresor beenden" in der App (Profil → System) als Rueckfall.
#
#   - startet bin/starten.js ohne Fenster (holt den Server nach einem Update zurueck, oeffnet den Browser)
#   - Ausgabe nach protokoll/klangtresor.log (die vom letzten Mal: klangtresor.alt.log)
#   - Symbol mit „KlangTresor oeffnen", „Protokoll anzeigen", „Beenden" - als StatusNotifierItem ueber D-Bus (Ubuntu
#     mit seiner AppIndicator-Erweiterung, KDE, Xfce, Cinnamon, MATE, LXQt; reines GNOME ohne Erweiterung zeigt keins)
#   - ohne Platz fuer Symbole laeuft KlangTresor trotzdem: Beenden dann ueber die App. Das Protokoll sagt es.
#   - beendet sich der Server ueber den Knopf in der App (Code 0), endet auch das Symbol
#   - ein zweiter Start oeffnet nur die Seite
# Nur Python 3 und GObject aus dem System - nichts wird nachinstalliert.
# =============================================================
import os, sys, signal, subprocess, threading, time, datetime, urllib.request, webbrowser, locale

WURZEL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ADRESSE = 'http://localhost:8788/'
NODE = os.path.join(WURZEL, 'werkzeug', 'node', 'bin', 'node')
if not os.path.exists(NODE):
    NODE = 'node'
PROTOKOLL = os.path.join(WURZEL, 'protokoll', 'klangtresor.log')


def sprache():
    s = (os.environ.get('KT_SPRACHE') or '').strip().lower()
    if s in ('de', 'en', 'ru'):
        return s
    for v in ('LC_ALL', 'LC_MESSAGES', 'LANG', 'LANGUAGE'):
        x = (os.environ.get(v) or '')[:2].lower()
        if x:
            return x if x in ('de', 'ru') else 'en'
    return 'en'


SPR = sprache()
os.environ['KT_SPRACHE'] = SPR


def L(de, en, ru):
    return ru if SPR == 'ru' else en if SPR == 'en' else de


def antwortet():
    try:
        with urllib.request.urlopen(ADRESSE, timeout=1.5) as a:
            return a.status == 200
    except Exception:
        return False


def seite_auf():
    url = ADRESSE + '?sprache=' + SPR
    try:
        subprocess.Popen(['xdg-open', url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        webbrowser.open(url)


def zeit():
    return datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')


class Protokoll:
    def __init__(self):
        os.makedirs(os.path.dirname(PROTOKOLL), exist_ok=True)
        alt = os.path.join(os.path.dirname(PROTOKOLL), 'klangtresor.alt.log')
        if os.path.exists(PROTOKOLL):
            os.replace(PROTOKOLL, alt)
        self.f = open(PROTOKOLL, 'a', encoding='utf-8', buffering=1)
        self.zeile('--- KlangTresor startet in ' + WURZEL)

    def zeile(self, z):
        try:
            self.f.write(zeit() + '  ' + z.rstrip('\n') + '\n')
        except Exception:
            pass


# Ein Symbol je Rechner und Nutzer: laeuft schon ein KlangTresor, nur die Seite oeffnen
if antwortet():
    if '--ohne-browser' not in sys.argv:
        seite_auf()
    sys.exit(0)

prot = Protokoll()
kind = None
gewollt = False


def starten():
    global kind
    env = dict(os.environ)
    env['PATH'] = os.pathsep.join([os.path.join(WURZEL, 'werkzeug', 'ffmpeg', 'bin'), os.path.dirname(NODE), env.get('PATH', '')])
    args = [NODE, os.path.join('bin', 'starten.js')]
    if '--ohne-browser' in sys.argv:
        args.append('--ohne-browser')
    # eigene Prozessgruppe: Beenden trifft starten.js, den Server und alles, was der Server startet
    kind = subprocess.Popen(args, cwd=WURZEL, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                            start_new_session=True)
    threading.Thread(target=mitlesen, args=(kind,), daemon=True).start()


def mitlesen(k):
    for roh in iter(k.stdout.readline, b''):
        prot.zeile(roh.decode('utf-8', 'replace'))
    code = k.wait()
    prot.zeile('--- beendet mit Code %s' % code)
    if not gewollt:
        beendet(code)


def aufhoeren():
    global gewollt
    gewollt = True
    if kind and kind.poll() is None:
        try:
            os.killpg(kind.pid, signal.SIGTERM)
            for _ in range(30):
                if kind.poll() is not None:
                    break
                time.sleep(0.1)
            if kind.poll() is None:
                os.killpg(kind.pid, signal.SIGKILL)
        except Exception:
            pass
    prot.zeile('--- beendet über das Symbol')


# --- das Symbol (wenn es geht)
# DIREKT UEBER D-BUS (StatusNotifierItem + com.canonical.dbusmenu), nicht ueber AppIndicator: Ubuntu 24.04 zeigt solche
# Symbole (Erweiterung ubuntu-appindicators ist an), bringt aber die Python-Bibliothek dafuer nicht mit
# (gir1.2-ayatanaappindicator3 fehlt; so in der Test-VM am 29.10.2026 gesehen). Gio aus python3-gi ist ueberall da.
# Dasselbe Protokoll sprechen KDE, Xfce (Status-Plugin), Cinnamon, MATE, LXQt und die AppIndicator-Erweiterung.
try:
    import gi
    gi.require_version('Gio', '2.0')
    from gi.repository import Gio, GLib
except Exception as e:
    Gio = None
    prot.zeile('Kein GObject (%s) - KlangTresor läuft ohne Symbol; beenden über Profil → System.' % e)

SNI_XML = """<node>
 <interface name="org.kde.StatusNotifierItem">
  <property name="Category" type="s" access="read"/><property name="Id" type="s" access="read"/>
  <property name="Title" type="s" access="read"/><property name="Status" type="s" access="read"/>
  <property name="WindowId" type="i" access="read"/><property name="IconName" type="s" access="read"/>
  <property name="IconThemePath" type="s" access="read"/><property name="IconPixmap" type="a(iiay)" access="read"/>
  <property name="ToolTip" type="(sa(iiay)ss)" access="read"/><property name="ItemIsMenu" type="b" access="read"/>
  <property name="Menu" type="o" access="read"/>
  <method name="ContextMenu"><arg type="i" direction="in"/><arg type="i" direction="in"/></method>
  <method name="Activate"><arg type="i" direction="in"/><arg type="i" direction="in"/></method>
  <method name="SecondaryActivate"><arg type="i" direction="in"/><arg type="i" direction="in"/></method>
  <method name="Scroll"><arg type="i" direction="in"/><arg type="s" direction="in"/></method>
  <signal name="NewTitle"/><signal name="NewIcon"/><signal name="NewToolTip"/><signal name="NewStatus"><arg type="s"/></signal>
 </interface>
</node>"""
MENU_XML = """<node>
 <interface name="com.canonical.dbusmenu">
  <property name="Version" type="u" access="read"/><property name="TextDirection" type="s" access="read"/>
  <property name="Status" type="s" access="read"/><property name="IconThemePath" type="as" access="read"/>
  <method name="GetLayout"><arg type="i" direction="in"/><arg type="i" direction="in"/><arg type="as" direction="in"/>
   <arg type="u" direction="out"/><arg type="(ia{sv}av)" direction="out"/></method>
  <method name="GetGroupProperties"><arg type="ai" direction="in"/><arg type="as" direction="in"/>
   <arg type="a(ia{sv})" direction="out"/></method>
  <method name="GetProperty"><arg type="i" direction="in"/><arg type="s" direction="in"/><arg type="v" direction="out"/></method>
  <method name="Event"><arg type="i" direction="in"/><arg type="s" direction="in"/><arg type="v" direction="in"/><arg type="u" direction="in"/></method>
  <method name="EventGroup"><arg type="a(isvu)" direction="in"/><arg type="ai" direction="out"/></method>
  <method name="AboutToShow"><arg type="i" direction="in"/><arg type="b" direction="out"/></method>
  <method name="AboutToShowGroup"><arg type="ai" direction="in"/><arg type="ai" direction="out"/><arg type="ai" direction="out"/></method>
  <signal name="ItemsPropertiesUpdated"><arg type="a(ia{sv})"/><arg type="a(ias)"/></signal>
  <signal name="LayoutUpdated"><arg type="u"/><arg type="i"/></signal>
 </interface>
</node>"""


class Symbol:
    def __init__(self):
        self.revision = 1
        self.kopf = 'KlangTresor'
        self.beendet = False
        self.bus = Gio.bus_get_sync(Gio.BusType.SESSION, None)
        self.name = 'org.kde.StatusNotifierItem-%d-1' % os.getpid()
        sni = Gio.DBusNodeInfo.new_for_xml(SNI_XML).interfaces[0]
        men = Gio.DBusNodeInfo.new_for_xml(MENU_XML).interfaces[0]
        self.bus.register_object('/StatusNotifierItem', sni, self.sni_aufruf, self.sni_eigenschaft, None)
        self.bus.register_object('/MenuBar', men, self.menu_aufruf, self.menu_eigenschaft, None)
        Gio.bus_own_name_on_connection(self.bus, self.name, Gio.BusNameOwnerFlags.NONE, None, None)
        self.pixmap = self.bildpunkte()
        self.anmelden()
        # Startet das Panel neu (oder kommt die Erweiterung spaeter), wieder anmelden
        Gio.bus_watch_name_on_connection(self.bus, 'org.kde.StatusNotifierWatcher', Gio.BusNameWatcherFlags.NONE,
                                         lambda *_: self.anmelden(), None)

    def anmelden(self):
        try:
            self.bus.call_sync('org.kde.StatusNotifierWatcher', '/StatusNotifierWatcher', 'org.kde.StatusNotifierWatcher',
                               'RegisterStatusNotifierItem', GLib.Variant('(s)', (self.name,)), None,
                               Gio.DBusCallFlags.NONE, 3000, None)
            prot.zeile('Symbol im Panel angemeldet.')
        except Exception as e:
            prot.zeile('Kein Platz für Symbole im Panel (%s) - beenden über Profil → System.' % str(e).split(':')[-1].strip())

    def bildpunkte(self):
        # Das Bild als ARGB-Punkte (IconPixmap) - so braucht das Panel kein Symbolthema
        try:
            gi.require_version('GdkPixbuf', '2.0')
            from gi.repository import GdkPixbuf
            pb = GdkPixbuf.Pixbuf.new_from_file_at_size(os.path.join(WURZEL, 'web', 'symbol', 'klangtresor-256.png'), 64, 64)
            if not pb.get_has_alpha():
                pb = pb.add_alpha(False, 0, 0, 0)
            w, h, rs, roh = pb.get_width(), pb.get_height(), pb.get_rowstride(), pb.get_pixels()
            argb = bytearray()
            for y in range(h):
                for x in range(w):
                    i = y * rs + x * 4
                    r, g, b, a = roh[i], roh[i + 1], roh[i + 2], roh[i + 3]
                    argb += bytes((a, r, g, b))
            return [(w, h, bytes(argb))]
        except Exception:
            return []

    # --- StatusNotifierItem
    def sni_eigenschaft(self, _c, _s, _p, _i, name):
        werte = {
            'Category': GLib.Variant('s', 'ApplicationStatus'), 'Id': GLib.Variant('s', 'klangtresor'),
            'Title': GLib.Variant('s', 'KlangTresor'), 'Status': GLib.Variant('s', 'Active'),
            'WindowId': GLib.Variant('i', 0), 'IconName': GLib.Variant('s', 'klangtresor-256'),
            'IconThemePath': GLib.Variant('s', os.path.join(WURZEL, 'web', 'symbol')),
            'IconPixmap': GLib.Variant('a(iiay)', self.pixmap),
            'ToolTip': GLib.Variant('(sa(iiay)ss)', ('', [], 'KlangTresor', self.kopf)),
            'ItemIsMenu': GLib.Variant('b', False), 'Menu': GLib.Variant('o', '/MenuBar'),
        }
        return werte.get(name)

    def sni_aufruf(self, _c, _s, _p, _i, methode, _args, aufruf):
        if methode in ('Activate', 'SecondaryActivate'):
            seite_auf()
        aufruf.return_value(None)

    # --- das Menue
    def punkte(self):
        p = [(1, self.kopf, False), (2, L('KlangTresor öffnen', 'Open KlangTresor', 'Открыть KlangTresor'), True)]
        if self.beendet:
            p.append((3, L('Neu starten', 'Restart', 'Перезапустить'), True))
        p += [(4, L('Protokoll anzeigen', 'Show log', 'Показать журнал'), True), (5, None, False),
              (6, L('Beenden', 'Quit', 'Выйти'), True)]
        return p

    def eintrag(self, nr, text, an):
        e = {'visible': GLib.Variant('b', True)}
        if text is None:
            e['type'] = GLib.Variant('s', 'separator')
        else:
            e['label'] = GLib.Variant('s', text)
            e['enabled'] = GLib.Variant('b', an)
        return e

    def menu_eigenschaft(self, _c, _s, _p, _i, name):
        return {'Version': GLib.Variant('u', 3), 'TextDirection': GLib.Variant('s', 'ltr'),
                'Status': GLib.Variant('s', 'normal'), 'IconThemePath': GLib.Variant('as', [])}.get(name)

    def menu_aufruf(self, _c, _s, _p, _i, methode, args, aufruf):
        if methode == 'GetLayout':
            kinder = [GLib.Variant('(ia{sv}av)', (n, self.eintrag(n, t, a), [])) for n, t, a in self.punkte()]
            wurzel = (0, {'children-display': GLib.Variant('s', 'submenu')}, kinder)
            aufruf.return_value(GLib.Variant('(u(ia{sv}av))', (self.revision, wurzel)))
        elif methode == 'GetGroupProperties':
            ids = args.unpack()[0]
            l = [(n, self.eintrag(n, t, a)) for n, t, a in self.punkte() if not ids or n in ids]
            aufruf.return_value(GLib.Variant('(a(ia{sv}))', (l,)))
        elif methode == 'GetProperty':
            n, name = args.unpack()
            e = next((self.eintrag(n2, t, a) for n2, t, a in self.punkte() if n2 == n), {})
            aufruf.return_value(GLib.Variant('(v)', (e.get(name, GLib.Variant('s', '')),)))
        elif methode == 'Event':
            n, art = args.unpack()[:2]
            if art == 'clicked':
                GLib.idle_add(self.geklickt, n)
            aufruf.return_value(None)
        elif methode == 'EventGroup':
            for n, art, _d, _t in args.unpack()[0]:
                if art == 'clicked':
                    GLib.idle_add(self.geklickt, n)
            aufruf.return_value(GLib.Variant('(ai)', ([],)))
        elif methode == 'AboutToShow':
            aufruf.return_value(GLib.Variant('(b)', (False,)))
        elif methode == 'AboutToShowGroup':
            aufruf.return_value(GLib.Variant('(aiai)', ([], [])))
        else:
            aufruf.return_value(None)

    def neu_zeichnen(self):
        self.revision += 1
        self.bus.emit_signal(None, '/MenuBar', 'com.canonical.dbusmenu', 'LayoutUpdated', GLib.Variant('(ui)', (self.revision, 0)))
        self.bus.emit_signal(None, '/StatusNotifierItem', 'org.kde.StatusNotifierItem', 'NewToolTip', None)

    def geklickt(self, n):
        if n == 2:
            seite_auf()
        elif n == 3:
            self.beendet = False
            starten()
            self.laeuft_seit()
        elif n == 4:
            subprocess.Popen(['xdg-open', PROTOKOLL], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        elif n == 6:
            aufhoeren()
            schleife.quit()
        return False

    def laeuft_seit(self):
        self.kopf = L('KlangTresor - läuft seit ', 'KlangTresor - running since ', 'KlangTresor - работает с ') \
            + datetime.datetime.now().strftime('%H:%M')
        self.neu_zeichnen()


symbol = None


def beendet(code):
    # Code 0: der Knopf „KlangTresor beenden" in der App - dann geht auch das Symbol
    if code == 0 or not symbol:
        if Gio and schleife:
            GLib.idle_add(schleife.quit)
        else:
            os._exit(0 if code == 0 else 1)
        return
    def zeigen():
        symbol.beendet = True
        symbol.kopf = L('KlangTresor - beendet (siehe Protokoll)', 'KlangTresor - stopped (see log)', 'KlangTresor - остановлен (см. журнал)')
        symbol.neu_zeichnen()
        return False
    GLib.idle_add(zeigen)


schleife = None
if Gio:
    schleife = GLib.MainLoop()
    try:
        symbol = Symbol()
    except Exception as e:
        prot.zeile('Symbol ging nicht (%s) - beenden über Profil → System.' % e)
        symbol = None
    GLib.unix_signal_add(GLib.PRIORITY_DEFAULT, signal.SIGTERM, lambda: (aufhoeren(), schleife.quit(), False)[2])
    starten()
    if symbol:
        symbol.laeuft_seit()
    schleife.run()
    aufhoeren()
else:
    signal.signal(signal.SIGTERM, lambda *_: (aufhoeren(), sys.exit(0)))
    starten()
    kind.wait()
    time.sleep(0.5)
