# T-0001: Bootstrap AI Memory and Prompt Governance

- Status: Done
- Owner: maintainer
- Branch: `codex/0001-ai-memory-bootstrap`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Create a local-first, Git-auditable memory system for AI-assisted development.

## Scope

- In scope:
  - Memory folders and baseline documents.
  - Prompt library with role-specific versioned prompts.
  - Git commit template and hooks for policy enforcement.
  - Scripts for commit-log and weekly-summary updates.
- Out of scope:
  - Cloud storage and account integration.
  - CI integration for remote enforcement.

## Acceptance Criteria

- [x] Memory layers L0-L4 exist and are documented.
- [x] Commit template includes Why/What/Impact/Risk/Test/Prompt-Refs.
- [x] WIP and milestone commit policy is enforced by local hook.
- [x] Commit-log and weekly-summary automation scripts are available.

## Change List

- Added `docs/ai/` structure and seed documents.
- Added `.githooks/` policies.
- Added `tools/git-memory/` workflow scripts.

## Test Evidence

- Commands:
  - `bash -n .githooks/commit-msg`
  - `bash -n .githooks/pre-push`
  - `bash -n tools/git-memory/*.sh`
  - `python3 tools/git-memory/render-weekly-summary.py`
- Result:
  - All commands completed successfully.

## Risks and Rollback

- Risk: contributors may skip hook installation.
- Rollback plan: remove `.githooks` and `tools/git-memory` files in a single revert commit.

