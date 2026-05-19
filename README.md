# rtk-token-saver

`rtk-token-saver` is an H5G Claude plugin wrapper for [RTK](https://github.com/rtk-ai/rtk). RTK remains the engine for shell-output reduction; this plugin teaches, verifies, and documents how H5G users should adopt it safely.

This is **not a fork** of RTK. Fork only if H5G needs code changes in RTK itself.

## What This Plugin Adds

- `/rtk-token-saver` skill for RTK usage, model routing, and context hygiene.
- Setup scripts that can run RTK's Claude Code initialization only after explicit opt-in.
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

Install RTK from a reviewed upstream release first. Then run a dry check:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

Apply RTK's Claude Code initialization only when ready:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1 -Apply
```

On macOS/Linux:

```sh
./scripts/setup.sh
./scripts/setup.sh --apply
```

## Doctor

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\doctor.ps1
```

The doctor checks:

- RTK is on `PATH`.
- Claude Code CLI is installed.
- `~/.claude/settings.json` exists.
- An RTK `PreToolUse` hook is configured.
- Legacy H5G `token-saver` hooks are absent.
- This wrapper has no bundled competing hook.

## Replacing token-saver

The old `token_saver` repo should remain available for rollback or reuse. The H5G marketplace should remove `token-saver` and list `rtk-token-saver` instead.

Do not run legacy `token-saver` filtering and RTK filtering together unless hook ordering has been tested.

## Validation

```powershell
npm test
claude plugin validate .
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\validate-package.ps1
```

## Caveats

- RTK modifies global Claude Code hook settings.
- RTK proxies shell commands, so use a pinned/reviewed release for team rollout.
- Cowork/Desktop users get guidance only; local RTK hook behavior is for Claude Code or local developer-machine workflows.
- Full command output may still exist in RTK's local logs when RTK preserves raw output.
