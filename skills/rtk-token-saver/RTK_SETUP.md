# RTK Setup

RTK is the engine. This H5G plugin teaches and verifies RTK; it does not vendor or fork RTK.

Upstream repo: https://github.com/rtk-ai/rtk

## Recommended Rollout

1. Pilot on one developer machine.
2. Run the doctor script before changing hooks.
3. Install RTK from an approved upstream release.
4. Run RTK's Claude Code initialization.
5. Run the doctor script again.
6. Confirm regular H5G workflows still show enough diagnostic output.

## Claude Code Setup

After RTK is installed and available on `PATH`, run:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1 -Apply
```

On macOS/Linux:

```sh
./scripts/setup.sh --apply
```

The setup script checks for `rtk`, warns about legacy `token-saver` hooks, and then runs RTK's Claude Code initialization only when explicitly requested.

## Why Setup Is Opt-In

RTK modifies global Claude Code hook settings and proxies shell commands. That can be very useful, but it should be a deliberate per-machine choice rather than a side effect of installing a marketplace plugin.

## Token Saver Replacement

The original H5G `token-saver` plugin should remain in GitHub for rollback or future reuse, but the marketplace should list this RTK wrapper instead.
