# RTK Setup

RTK is the engine. This H5G plugin teaches and verifies RTK; it does not vendor or fork RTK.

Upstream repo: https://github.com/rtk-ai/rtk

## Recommended Rollout

1. Pilot on one developer machine.
2. Clone `https://github.com/michaelericksonh5/rtk-token-saver` so setup scripts can be reviewed before use.
3. Run the doctor script before changing hooks.
4. Install approved RTK `0.40.0`.
5. Remove legacy `token-saver` hooks and review any other `PreToolUse` hooks reported by doctor.
6. Run RTK's Claude Code initialization with the wrapper setup script.
7. Run the doctor script again.
8. Confirm regular H5G workflows still show enough diagnostic output.

## Claude Code Setup

After RTK `0.40.0` is installed and available on `PATH`, run a dry check:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

Then apply:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1 -Apply
```

On macOS/Linux:

```sh
./scripts/setup.sh
./scripts/setup.sh --apply
```

The setup script checks for `rtk`, legacy `token-saver` hooks, other non-RTK `PreToolUse` hooks, and the approved RTK version. It runs RTK's Claude Code initialization only when explicitly requested. Use `--force` / `-Force` only after manually reviewing warnings.

## Why Setup Is Opt-In

RTK modifies global Claude Code hook settings and proxies shell commands. That can be very useful, but it should be a deliberate per-machine choice rather than a side effect of installing a marketplace plugin.

## Token Saver Replacement

The original H5G `token-saver` plugin remains in GitHub for rollback or future reuse, but the marketplace now lists this RTK wrapper instead.
