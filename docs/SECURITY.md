# Security Notes

RTK has a high-privilege surface because it integrates with shell-command execution and Claude Code hooks.

## H5G Wrapper Policy

- This wrapper does not run remote install scripts.
- This wrapper does not vendor RTK binaries.
- This wrapper does not auto-modify Claude settings during marketplace install.
- `scripts/setup.*` only applies RTK initialization when users pass `--apply` or `-Apply`.
- Users should install RTK from a reviewed, pinned upstream release.

## Review Before Broad Rollout

- Confirm RTK license terms for the selected release.
- Confirm telemetry defaults and disable telemetry unless explicitly approved.
- Confirm local tracking database contents are acceptable for H5G machines.
- Confirm RTK does not hide critical diagnostic output for H5G workflows.
- Confirm legacy token-saver hooks are removed before RTK hook rollout.
