/* KlangTresor · Copyright (c) 2026 Caspar_D · MIT, siehe LICENSE */
/* =============================================================
   DAS SYMBOL UNTEN RECHTS BAUEN (KlangTresor.exe)
   bin/windows/symbol-bauen.js - von bin/paket.js gerufen.

   Mit dotnet gegen .NET Framework 4.7.2, das jedem Windows 10/11 beiliegt. Gebaut im Wegwerfordner; der NuGet-
   Zwischenspeicher bleibt, wo dotnet ihn hinlegt (~/.nuget, rund 80 MB) - auf der exFAT-SSD legte macOS ._-Beiakten
   hinein, an denen der Bau sich stiess.

   SEIT 29.10.2026 IM KlangTresor.zip, nicht mehr nur in der Setup.exe (Caspar_D: „wollen wir das nicht auch noch
   regeln, damit alles übers update kommt"). Das Update legt das Zip ueber den Programmordner - lag die .exe nicht
   darin, blieb das Symbol fuer immer auf dem Stand der Installation. Die Setup.exe nimmt sie jetzt aus dem Zip.
   ============================================================= */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

/* Baut KlangTresor.exe und KlangTresor.exe.config nach `ziel`. Wirft bei jedem Fehler. */
function symbolBauen(ziel, version) {
  if (spawnSync('dotnet', ['--version']).status !== 0) throw new Error('dotnet fehlt. Einmal: brew install dotnet');
  const T = fs.mkdtempSync(path.join(os.tmpdir(), 'klangtresor-symbol-'));
  try {
    for (const f of ['KlangTresor.cs', 'KlangTresor.csproj', 'app.manifest']) fs.copyFileSync(path.join(__dirname, f), path.join(T, f));
    fs.copyFileSync(path.join(__dirname, '..', '..', 'web', 'symbol', 'klangtresor.ico'), path.join(T, 'klangtresor.ico'));
    const e = spawnSync('dotnet', ['build', '-c', 'Release', '-o', path.join(T, 'aus'), '-nologo', '-v', 'q', `-p:Version=${version}`],
      { cwd: T, encoding: 'utf8', env: { ...process.env, DOTNET_CLI_TELEMETRY_OPTOUT: '1', DOTNET_NOLOGO: '1' } });
    if (e.status !== 0) throw new Error('dotnet build scheiterte:\n' + (e.stdout || '') + (e.stderr || ''));
    fs.mkdirSync(ziel, { recursive: true });
    for (const f of ['KlangTresor.exe', 'KlangTresor.exe.config']) fs.copyFileSync(path.join(T, 'aus', f), path.join(ziel, f));
  } finally { fs.rmSync(T, { recursive: true, force: true }); }
}
module.exports = { symbolBauen };
