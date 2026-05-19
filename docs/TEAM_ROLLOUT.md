# Team Rollout

## Recommendation

Replace the marketplace listing for H5G `token-saver` with `rtk-token-saver`, but keep the original `token_saver` GitHub repo intact for rollback and future reuse.

Do not fork RTK unless H5G needs code-level changes. Start with this wrapper plus a pinned/reviewed upstream RTK release.

## Pilot Steps

1. Pick one developer machine.
2. Install the `rtk-token-saver` plugin from the H5G marketplace.
3. Install RTK from a reviewed upstream release.
4. Run `scripts/doctor.ps1`.
5. Run `scripts/setup.ps1 -Apply`.
6. Restart Claude Code.
7. Run normal H5G workflows: slot art, Spine animation, AI video, skill auditing, and regular coding/test loops.
8. Confirm RTK reduces noisy output without hiding critical failures.

## Marketplace Change

- Remove `token-saver` from `claude-plugins/.claude-plugin/marketplace.json`.
- Add `rtk-token-saver`.
- Leave `michaelericksonh5/token_saver` untouched.

## Rollback

If RTK causes conflicts, remove the RTK hook from `~/.claude/settings.json` or restore RTK's settings backup. Then reinstall or re-add the old `token-saver` marketplace entry if needed.

## Admin Notes

RTK is a local CLI/hook engine. Team-wide rollout should use a pinned RTK release, internal approval, and a short pilot before broad install.
