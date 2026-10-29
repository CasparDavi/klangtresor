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
#   - Symbol mit „KlangTresor oeffnen", „Protokoll anzeigen", „Beenden" - ueber AppIndicator (Ubuntu, KDE, Xfce,
#     Cinnamon, MATE; unter reinem GNOME nur mit der AppIndicator-Erweiterung, die Ubuntu mitbringt)
#   - fehlt AppIndicator, laeuft KlangTresor trotzdem: ohne Symbol, Beenden dann ueber die App. Das Protokoll sagt es.
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
Gtk = Indikator = None
try:
    import gi
    gi.require_version('Gtk', '3.0')
    from gi.repository import Gtk, GLib
    for name in ('AyatanaAppIndicator3', 'AppIndicator3'):
        try:
            gi.require_version(name, '0.1')
            Indikator = __import__('gi.repository.' + name, fromlist=[name])
            break
        except (ValueError, ImportError):
            continue
except Exception as e:
    prot.zeile('Kein GTK (%s) - KlangTresor läuft ohne Symbol; beenden über Profil → System.' % e)
    Gtk = None

if Gtk and not Indikator:
    prot.zeile('Kein AppIndicator auf diesem System - KlangTresor läuft ohne Symbol; beenden über Profil → System.')


def beendet(code):
    # Code 0: der Knopf „KlangTresor beenden" in der App - dann geht auch das Symbol
    if Gtk and Indikator:
        GLib.idle_add(nach_ende, code)
    else:
        os._exit(0 if code == 0 else 1)


if Gtk and Indikator:
    ind = Indikator.Indicator.new('klangtresor', os.path.join(WURZEL, 'web', 'symbol', 'klangtresor-256.png'),
                                  Indikator.IndicatorCategory.APPLICATION_STATUS)
    ind.set_status(Indikator.IndicatorStatus.ACTIVE)
    ind.set_title('KlangTresor')
    menue = Gtk.Menu()

    def punkt(text, tun):
        p = Gtk.MenuItem(label=text)
        p.connect('activate', lambda _w: tun())
        menue.append(p)
        return p

    kopf = Gtk.MenuItem(label='KlangTresor')
    kopf.set_sensitive(False)
    menue.append(kopf)
    punkt(L('KlangTresor öffnen', 'Open KlangTresor', 'Открыть KlangTresor'), seite_auf)
    neu = punkt(L('Neu starten', 'Restart', 'Перезапустить'), lambda: (neu.hide(), starten(), kopf_setzen()))
    punkt(L('Protokoll anzeigen', 'Show log', 'Показать журнал'),
          lambda: subprocess.Popen(['xdg-open', PROTOKOLL], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL))
    menue.append(Gtk.SeparatorMenuItem())
    punkt(L('Beenden', 'Quit', 'Выйти'), lambda: (aufhoeren(), Gtk.main_quit()))
    menue.show_all()
    neu.hide()
    # Ein Klick auf das Symbol (wo das Panel es kann) oeffnet die Seite
    ind.set_secondary_activate_target(menue.get_children()[1])
    ind.set_menu(menue)

    def kopf_setzen():
        kopf.set_label(L('KlangTresor - läuft seit ', 'KlangTresor - running since ', 'KlangTresor - работает с ')
                       + datetime.datetime.now().strftime('%H:%M'))

    def nach_ende(code):
        if code == 0:
            Gtk.main_quit()
        else:
            kopf.set_label(L('KlangTresor - beendet (siehe Protokoll)', 'KlangTresor - stopped (see log)',
                             'KlangTresor - остановлен (см. журнал)'))
            neu.show()
        return False

    signal.signal(signal.SIGTERM, lambda *_: (aufhoeren(), Gtk.main_quit()))
    starten()
    kopf_setzen()
    Gtk.main()
    aufhoeren()
else:
    # Ohne Symbol: der Server laeuft, bis er ueber die App beendet wird
    signal.signal(signal.SIGTERM, lambda *_: (aufhoeren(), sys.exit(0)))
    starten()
    kind.wait()
    time.sleep(0.5)
