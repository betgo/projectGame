# AI Collaboration Constitution

Version: v1
Status: Active

## Non-Negotiable Rules

1. Keep architecture boundaries stable; avoid cross-layer leakage.
2. Keep changes scoped to the active task; avoid unrelated file edits.
3. Use deterministic behavior where simulation or rules rely on randomness.
4. Record every commit with intent and prompt references.
5. Prefer Markdown and Git-tracked artifacts for long-term memory.

## Branch and Delivery Rules

1. Use `codex/<issue>-<topic>` branch naming.
2. Enforce `1 Issue = 1 PR`.
3. Squash merge is preferred for clean history.
4. Every PR must include risk and test evidence.

## Prompt Governance

1. Every prompt file must include a semantic version suffix (example: `BUILDER_v2`).
2. Commits must include `Prompt-Refs` with one or more prompt IDs.
3. Prompt revisions must explain what changed and why.

## Commit Logging Policy

1. WIP commits may be brief (1-3 lines) but still require `Prompt-Refs`.
2. Milestone commits must include `Why/What/Impact/Risk/Test/Prompt-Refs`.
3. Monthly commit logs are updated before PR delivery.
4. Weekly summary is regenerated from commit logs for warm-start context.

## Continuous Loop Defaults

1. Use local loop command for iterative delivery (`pnpm dev:loop`).
2. Default retry mode is `until-pass` with max duration protection.
3. Every subtask must end with one milestone commit.
4. Contract-level changes require docs updates in the same loop.
