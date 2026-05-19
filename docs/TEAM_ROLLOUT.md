# Team Rollout

## Recommendation

The marketplace now lists `rtk-token-saver` instead of H5G `token-saver`. Keep the original `token_saver` GitHub repo intact for rollback and future reuse.

Do not fork RTK unless H5G needs code-level changes. Start with this wrapper plus approved RTK `0.40.0`.

## Pilot Steps

1. Pick one developer machine.
2. Install the `rtk-token-saver` plugin from the H5G marketplace.
3. Clone `https://github.com/michaelericksonh5/rtk-token-saver` to run setup and doctor scripts.
4. Run `scripts/setup.ps1 -InstallRtk -MigrateTokenSaver -Apply`.
5. Restart Claude Code.
6. Run `scripts/doctor.ps1`.
7. Review any non-RTK `PreToolUse` hook warnings if behavior looks odd.
8. Run normal H5G workflows: slot art, Spine animation, AI video, skill auditing, and regular coding/test loops.
9. Confirm RTK reduces noisy output without hiding critical failures.

## Existing token-saver Cleanup

Removing `token-saver` from the marketplace does not uninstall existing local settings. For each pilot user who previously ran the old installer:

1. Run `scripts/setup.ps1 -MigrateTokenSaver`.
2. Confirm it created a `settings.rtk-token-saver-backup.*.json` backup.
3. Keep unrelated hooks unless they also rewrite Bash command input and cause visible conflicts with RTK.
4. Remove `~/.claude/token-saver/` only after confirming the old plugin is no longer needed.

## Marketplace Change

- `token-saver` has been removed from `claude-plugins/.claude-plugin/marketplace.json`.
- `rtk-token-saver` has been added.
- Leave `michaelericksonh5/token_saver` untouched.

## Rollback

If RTK causes conflicts, remove the RTK hook from `~/.claude/settings.json` or restore RTK's settings backup. Then reinstall or re-add the old `token-saver` marketplace entry if needed.

## Admin Notes

RTK is a local CLI/hook engine. Team-wide rollout should use approved RTK `0.40.0`, installed through this wrapper's checksum-verified user-local installer or another internally reviewed process.
