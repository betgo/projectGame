#!/usr/bin/env bash
set -euo pipefail

if (( $# < 2 )); then
  echo "Usage: bash tools/git-memory/new-task.sh <issue-id> <task-title>" >&2
  exit 1
fi

issue_id="$1"
shift
title="$*"

slug="$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')"
branch="main"
task_file="docs/ai/tasks/T-${issue_id}-${slug}.md"

mkdir -p docs/ai/tasks
if [[ -e "$task_file" ]]; then
  echo "Task file already exists: $task_file" >&2
  exit 1
fi

cat >"$task_file" <<EOF
# T-${issue_id}: ${title}

- Status: Planned
- Owner:
- Branch: \`${branch}\`
- Prompt-Plan: \`ARCHITECT_v1\`, \`PLANNER_v1\`
- Prompt-Impl: \`BUILDER_v2\`
- Prompt-Review: \`GUARDIAN_v1\`, \`REVIEWER_v1\`

## Goal

## Scope

- In scope:
- Out of scope:

## Acceptance Criteria

- [ ] Criteria 1

## Change List

## Test Evidence

- Commands:
- Result:

## Risks and Rollback

- Risk:
- Rollback:
EOF

echo "Created task file: $task_file"
echo "Working branch: $branch"
