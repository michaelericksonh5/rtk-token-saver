# Security Notes

RTK has a high-privilege surface because it integrates with shell-command execution and Claude Code hooks.

## H5G Wrapper Policy

- This wrapper does not run remote install scripts.
- This wrapper does not vendor RTK binaries.
- `scripts/setup.* --install-rtk` downloads the pinned RTK `v0.40.0` release asset, verifies SHA-256, and installs only `rtk` / `rtk.exe` into a user-local bin directory.
- This wrapper does not auto-modify Claude settings during marketplace install.
- Compact TLDR output is shipped as an optional Claude Code output style, not as a hook.
- This wrapper does not add `SessionStart`, `UserPromptSubmit`, or `PreToolUse` hooks for compact output.
- `scripts/setup.*` only applies RTK initialization when users pass `--apply` or `-Apply`.
- Setup can migrate legacy token-saver hooks with `--migrate-token-saver` / `-MigrateTokenSaver`, backing up settings before removing only known H5G token-saver hook commands.
- Setup blocks on remaining legacy token-saver hooks, non-approved RTK versions, or RTK binaries outside the approved user-local install directory unless users pass `--force` / `-Force` after manual review.
- Other non-RTK `PreToolUse` hooks are warnings, not blockers.
- Users should install approved RTK `0.40.0` through this wrapper or another reviewed user-local process.

## Review Before Broad Rollout

- Confirm RTK license terms for RTK `0.40.0`.
- Confirm telemetry defaults and disable telemetry unless explicitly approved.
- Confirm local tracking database contents are acceptable for H5G machines.
- Confirm RTK does not hide critical diagnostic output for H5G workflows.
- Confirm legacy token-saver hooks were migrated before RTK hook rollout.
- Review any other `PreToolUse` hooks if hook ordering causes odd behavior.
- Confirm Compact TLDR mode still expands for destructive commands, secrets, auth failures, production data, exact error reproduction, and security review.
- Confirm Desktop/Cowork rollout language stays advisory: RTK hook enforcement is Claude Code/local-machine behavior, and compact output depends on client support or explicit user instructions.
