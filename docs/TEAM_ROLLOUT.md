# Team Rollout

## Recommendation

The marketplace now lists `rtk-token-saver` instead of H5G `token-saver`. Keep the original `token_saver` GitHub repo intact for rollback and future reuse.

Do not fork RTK unless H5G needs code-level changes. Start with this wrapper plus approved RTK `0.40.0`.

## Pilot Steps

1. Pick one developer machine.
2. Install the `rtk-token-saver` plugin from the H5G marketplace.
3. Clone `https://github.com/michaelericksonh5/rtk-token-saver` to run setup and doctor scripts.
4. Install RTK `0.40.0` from a reviewed upstream release.
5. Run `scripts/doctor.ps1`.
6. Remove legacy `token-saver` hooks or any unreviewed non-RTK `PreToolUse` hooks reported by doctor.
7. Run `scripts/setup.ps1 -Apply`.
8. Restart Claude Code.
9. Run normal H5G workflows: slot art, Spine animation, AI video, skill auditing, and regular coding/test loops.
10. Confirm RTK reduces noisy output without hiding critical failures.

## Existing token-saver Cleanup

Removing `token-saver` from the marketplace does not uninstall existing local settings. For each pilot user who previously ran the old installer:

1. Open `~/.claude/settings.json`.
2. Remove legacy hook commands that reference `token-saver`, `token_saver`, `pretool-filter`, or `filter-output`.
3. Keep unrelated hooks unless they also rewrite Bash command input and have been reviewed with RTK.
4. Run `scripts/doctor.ps1`.
5. Remove `~/.claude/token-saver/` only after confirming the old plugin is no longer needed.

## Marketplace Change

- `token-saver` has been removed from `claude-plugins/.claude-plugin/marketplace.json`.
- `rtk-token-saver` has been added.
- Leave `michaelericksonh5/token_saver` untouched.

## Rollback

If RTK causes conflicts, remove the RTK hook from `~/.claude/settings.json` or restore RTK's settings backup. Then reinstall or re-add the old `token-saver` marketplace entry if needed.

## Admin Notes

RTK is a local CLI/hook engine. Team-wide rollout should use approved RTK `0.40.0`, internal approval, and a short pilot before broad install.
