# Team Rollout

## Recommendation

The marketplace now lists `rtk-token-saver` instead of H5G `token-saver`. Keep the original `token_saver` GitHub repo intact for rollback and future reuse.

Do not fork RTK unless H5G needs code-level changes. Start with this wrapper plus approved RTK `0.40.0` and the optional Compact TLDR output style.

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
10. Optionally select `Compact TLDR` in Claude Code `/config` and confirm replies stay concise without losing safety, exact errors, or verification status.

## Compact TLDR Rollout

Compact TLDR mode is a response-style feature, not a shell hook. Roll it out as an optional Claude Code output style before making it a team default.

- RTK can reduce shell-output input/context tokens in Claude Code.
- Compact replies reduce generated assistant output tokens and future transcript size.
- `/compact` remains the tool for summarizing existing conversation context.
- Desktop/Cowork compact behavior is advisory skill guidance unless the client supports the shipped output style or equivalent user settings.

Keep escape hatches explicit: users should ask for full detail whenever debugging, security review, production operations, or exact reproduction steps need more context.

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

Compact TLDR mode does not require `SessionStart`, `UserPromptSubmit`, or `PreToolUse` hooks. Do not add compact-output hooks during rollout; use the shipped output style or skill guidance instead.
