# Coming from MySuno or from version 1.0.72 and older

KlangTresor was called *MySuno* until 24 August 2026. Versions up to 1.0.72 — and all MySuno versions — have no update
script in their folder yet. This page gets them to the current version; nothing is lost.

## The update package

Every release carries a small update package, always in the latest version:

```
https://github.com/CasparDavi/klangtresor/releases/latest/download/KlangTresor-Update.zip
```

Copy `aktualisieren.js` and the script for your system into your KlangTresor or MySuno folder (where `library/` is)
and start the script:

| System | Copy | Start |
|---|---|---|
| Windows | `aktualisieren.js`, `aktualisieren-windows.cmd` | double-click `aktualisieren-windows.cmd` |
| macOS | `aktualisieren.js`, `aktualisieren-macos.command` | double-click `aktualisieren-macos.command` |
| Linux | `aktualisieren.js`, `aktualisieren-linux.sh` | `./aktualisieren-linux.sh` |

The package is flat, without subfolders, because the Finder replaces an existing `bin/` folder instead of merging it.
The update keeps `library/`; afterwards all `aktualisieren-*` files are in the folder and the copied
`aktualisieren.js` removes itself. Restart the server once.

The package is not signed: Windows says "The publisher could not be verified" → **Run**; macOS → System Settings →
Privacy & Security → **Open Anyway**; Linux: `chmod +x aktualisieren-linux.sh` if the execute permission is missing.

**Only Docker, no Node on the computer:** copy the contents of the new `KlangTresor.zip` into the folder (replace
files, never the whole folder — `library/` is inside it) and run `einrichten-docker-*` once more. If the old container
`mysuno` is still running, stop it first: `docker stop mysuno`.

## What stays, what changes

- **Settings stay.** Equaliser, volume, display mode, map view — the storage keys in the browser keep their old
  `mysuno-…` names on purpose, so nobody loses a setting.
- **The archive stays.** `library/` is not touched; the storage format is unchanged.
- **The folder may keep its name.** All scripts work relative to themselves.
- **Analyses are recalculated once.** The old key-detection method was removed; analyses from before are recomputed
  on the next opening.
- **Five display modes are gone.** `audioMotion` was under the AGPL and does not go with the MIT licence. Whoever had
  one of its modes selected gets **Spectrum** instead — the same frequency bars, radial instead of on a baseline.

## Why the new name

**SUNO** is a registered trademark of Suno Inc. (US Reg. 8096778, also for software that plays back audio; IR 1930809
covers Germany and the EU). A third-party trademark in a project's name is delicate; naming it in the description is
not. The full story is in [docs/haus/HISTORY.md](haus/HISTORY.md).
