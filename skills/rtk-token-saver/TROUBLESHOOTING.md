# Troubleshooting

## RTK Is Not Found

Run:

```powershell
rtk --version
```

If the command is missing, install RTK from the reviewed upstream release and ensure it is on `PATH`.

## Claude Output Looks Too Short

RTK may have compacted command output. Ask for the full RTK log path or rerun the command with output redirected to a file when exact details matter.

## Hooks Conflict

Check `~/.claude/settings.json` for multiple `PreToolUse` hooks that rewrite Bash commands. Do not run legacy H5G `token-saver` filtering and RTK filtering at the same time unless hook ordering has been tested.

## Cowork/Desktop

This plugin can teach RTK/model/context practices in Cowork/Desktop, but RTK's shell-command filtering is a Claude Code or local developer-machine workflow. Do not claim Cowork/Desktop chat gets RTK hook enforcement from this plugin alone.
