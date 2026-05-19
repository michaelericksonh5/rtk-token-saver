# rtk-token-saver

`rtk-token-saver` is an H5G Claude plugin wrapper for [RTK](https://github.com/rtk-ai/rtk). RTK remains the engine for shell-output reduction; this plugin teaches, verifies, and documents how H5G users should adopt it safely.

This is **not a fork** of RTK. Fork only if H5G needs code changes in RTK itself.

## What This Plugin Adds

- `/rtk-token-saver` skill for RTK usage, model routing, and context hygiene.
- Setup scripts that can install pinned RTK into a user-local bin directory and run RTK's Claude Code initialization only after explicit opt-in.
- Doctor scripts that check RTK install state, Claude Code hooks, and legacy token-saver conflicts.
- H5G rollout docs for replacing the old `token-saver` marketplace entry.
- No bundled Claude hook, so marketplace install does not compete with RTK's own hook.

## What RTK Adds

RTK can reduce noisy shell output from test runs, package managers, Git/GitHub commands, Docker/Kubernetes output, logs, and other verbose command results. That is more robust than H5G's original `token-saver` hook.

## Install From Marketplace

```text
/plugin marketplace add michaelericksonh5/claude-plugins
/plugin install rtk-token-saver@h5g-plugins
```

Then invoke:

```text
/rtk-token-saver
```

## RTK Setup

Clone this wrapper repo when you want to run setup or doctor scripts:

```powershell
git clone https://github.com/michaelericksonh5/rtk-token-saver
cd rtk-token-saver
```

Marketplace install gives Claude the `/rtk-token-saver` skill. The setup scripts are intentionally run from a checked-out repo so users can review them before changing global Claude Code hooks.

To install approved RTK `0.40.0` into a user-local bin directory and update user PATH where possible:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1 -InstallRtk
```

Then run a dry check:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

Apply RTK's Claude Code initialization only when ready:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1 -Apply
```

Recommended one-command setup for most users:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1 -InstallRtk -MigrateTokenSaver -Apply
```

`-MigrateTokenSaver` backs up `~/.claude/settings.json` and removes only known H5G legacy token-saver hook commands. Other `PreToolUse` hooks are reported as warnings so users can review hook ordering without being blocked.

`-Apply` refuses to run when legacy `token-saver` hooks are still present, or when RTK is missing, the wrong version, or outside the approved user-local path. Use `-Force` only after manual review:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1 -Apply -Force
```

On macOS/Linux:

```sh
./scripts/setup.sh
./scripts/setup.sh --install-rtk
./scripts/setup.sh --apply
./scripts/setup.sh --install-rtk --migrate-token-saver --apply
./scripts/setup.sh --apply --force
```

The installer downloads RTK `v0.40.0` from GitHub Releases, verifies a pinned SHA-256 digest, installs only `rtk` / `rtk.exe` into `~/.local/bin`, and updates user PATH where possible. It does not require admin privileges when using the default user-local location.

## Doctor

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\doctor.ps1
```

The doctor checks:

- RTK is on `PATH`.
- RTK resolves to the reviewed binary path and approved version.
- RTK resolves from the approved user-local install directory.
- Claude Code CLI is installed.
- `~/.claude/settings.json` exists.
- An RTK `PreToolUse` hook is configured.
- Legacy H5G `token-saver` hooks are absent.
- Other non-RTK `PreToolUse` hooks are absent or reviewed.
- This wrapper has no bundled competing hook.

## Replacing token-saver

The old `token_saver` repo remains available for rollback or reuse. The H5G marketplace now lists `rtk-token-saver` instead of `token-saver`.

Do not run legacy `token-saver` filtering and RTK filtering together unless hook ordering has been tested.

For existing `token-saver` users:

1. Run `scripts/setup.ps1 -InstallRtk -MigrateTokenSaver -Apply`.
2. Restart Claude Code.
3. Remove `~/.claude/token-saver/` only after confirming no other workflow depends on it.

## Validation

```powershell
npm test
claude plugin validate .
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\validate-package.ps1
```

## Caveats

- RTK modifies global Claude Code hook settings.
- RTK proxies shell commands, so this wrapper installs only pinned RTK `0.40.0` with checksum verification.
- Cowork/Desktop users get guidance only; local RTK hook behavior is for Claude Code or local developer-machine workflows.
- Full command output may still exist in RTK's local logs when RTK preserves raw output.
