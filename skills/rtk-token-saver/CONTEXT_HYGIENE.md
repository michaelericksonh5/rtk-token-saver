# Context Hygiene

RTK helps reduce shell-output noise, but it is not a replacement for context discipline.

## Default Moves

- `/clear` when switching unrelated tasks.
- `/compact` before context degradation; treat 70-80% as the warning range and 85% as urgent.
- Save large logs to files and bring back only targeted search hits or ranges.
- Prefer search and symbol-level reads over broad file reads.
- Ask exploration agents to return 1,000-2,000 token structured summaries instead of raw logs.

## Compaction Prompt

```text
/compact Preserve:
- User goal
- Current task
- Decisions made
- Files modified with exact paths and symbols
- Files read but unchanged
- Exact errors and failing commands
- Test status
- Blockers
- Next steps
- Source precedence
```

## Source Precedence

Current user request > current files/tool output > current docs > recent verified summary > older memory or stale summaries.
