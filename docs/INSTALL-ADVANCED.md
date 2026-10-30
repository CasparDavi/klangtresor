# Installing without the installer — zip, Docker, Git, WSL

Most people want the installer for their system (Setup.exe, DMG, AppImage) — see the [README](../README.md#download).
This page is for everyone who prefers a folder they unpack themselves, a container, or a Git clone.

## Zip

Download `KlangTresor.zip` from the [latest release](https://github.com/CasparDavi/klangtresor/releases/latest) and
unpack it. Then double-click **one** setup script:

| System | Usual way | With Docker |
|---|---|---|
| Windows | `einrichten-windows.cmd` | `einrichten-docker-windows.cmd` |
| macOS | `einrichten-macos.command` | `einrichten-docker-macos.command` |
| Linux | `./einrichten-linux.sh` | `./einrichten-docker-linux.sh` |

The script fetches Node.js if it is missing, then opens the setup as a page in the browser: it fetches ffmpeg, the AI
models and Whisper, asks for your Suno name and starts KlangTresor. Without a browser it continues as text in the
window (`--text` forces that). Afterwards `starten-*` only starts, without setting anything up.

On Windows, always click the `.cmd`, never `bin\anlasser.ps1` itself: Windows refuses `.ps1` files on many computers
and closes the window before you can read why. The `.cmd` allows the script for this one call only, without
changing any system setting.

The scripts are not signed, so the first launch asks for confirmation: Windows "The publisher could not be
verified" → **Run**; macOS → System Settings → Privacy & Security → **Open Anyway**. Every click is shown with pictures
in [START-HERE.md](../START-HERE.md).

## Docker

`einrichten-docker-*` builds and starts the container; `library/` is mounted from your disk and survives every
rebuild. Optional, with an NVIDIA graphics card and the NVIDIA Container Toolkit: add the overlay
`docker/docker-compose.cuda.yml` (`docker compose -f docker/docker-compose.yml -f docker/docker-compose.cuda.yml up -d
--build`). Without such a card, do not use it — the container would not start.

## Git

```bash
git clone https://github.com/CasparDavi/klangtresor && cd klangtresor
npm ci
npm start                      # http://localhost:8788
```

Node 20 or newer. `node bin/einrichten.js` runs the same setup as the scripts.

## WSL

If the server runs inside WSL, the browser must run there too — a Chrome started under Windows cannot reach it.
Everything else works; only the bookmark does not find the server.

## Updating these installations

The bell in the app (next to the red button) shows a new version; *Profile → System* installs it. By hand, in the
program folder (where `bin/` and `library/` are):

```bash
./aktualisieren-linux.sh          # macOS: aktualisieren-macos.command · Windows: aktualisieren-windows.cmd
npm run aktualisieren -- --nur-stand   # only look, write nothing
```

- **Git clone:** `git pull --rebase origin main` (stops on uncommitted changes or a branch other than `main`).
- **Zip installation:** fetches `KlangTresor.zip` of the latest release and lays the program files over the old ones.
- **Docker:** rebuilds the container (`compose up --build`); `library/` stays.
- **Without Docker:** if `package-lock.json` changed, `npm ci` runs; then restart via `starten-*`.

`library/`, `werkzeug/` and `.git/` are never touched. KlangTresor asks GitHub at most every 12 hours whether there is
a new version (2 hours after a failure) and keeps the answer for half an hour.

## Neighbourhood figures by hand

The *Neighbourhood* panel on the author page starts these two runs; they can also be run by hand:

```
node bin/community-profile.js    profile figures of the people who appear in your archive
node bin/community-hirsch.js     their h-indexes (takes considerably longer)
```

Both fetch only what is still missing and read publicly, one request at a time with a pause in between.
