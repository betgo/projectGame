# ADR-0001: AI Memory and Prompt Governance Baseline

- Status: Accepted
- Date: 2026-02-14
- Owners: project maintainers

## Context

The project uses AI-assisted development. Without persistent and auditable memory,
context quality drops between sessions and delivery risks increase.

## Decision

Adopt a layered memory system under `docs/ai/`:

- Constitution for long-lived guardrails.
- ADR and task records for decisions and execution context.
- Monthly commit logs and weekly rollups for rapid context recovery.
- Versioned role prompts with commit-level `Prompt-Refs`.

Git workflow adopts trunk-based collaboration on `main`
and `1 Issue = 1 PR`.

## Consequences

- Positive:
  - Faster warm start for AI and humans.
  - Better traceability for rollback and audits.
  - Lower ambiguity in role responsibilities.
- Negative:
  - Small documentation overhead per task.
- Risks:
  - Process drift if hooks are not installed.

## Alternatives Considered

1. Keep memory in ad-hoc chat logs only.
2. Store memory in external note tools without Git history.

Both were rejected due to poor auditability and weak merge review integration.

## Follow-up Actions

- [ ] Install git hooks on contributor machines.
- [ ] Add CI check for commit message policy (optional next step).
