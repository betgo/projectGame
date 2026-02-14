#!/usr/bin/env bash
set -euo pipefail

root_dir="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$root_dir"

if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  echo "No commits found yet. Create at least one commit before finalizing." >&2
  exit 1
fi

bash tools/git-memory/append-commit-log.sh HEAD
bash tools/git-memory/update-weekly-summary.sh

git add docs/ai/commit-log docs/ai/weekly-summary.md

echo "Task memory finalized."
echo "Next step: commit staged memory files, then open PR."

