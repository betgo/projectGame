#!/usr/bin/env bash
set -euo pipefail

root_dir="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$root_dir"

commit_ref="${1:-HEAD}"
if ! git rev-parse --verify "$commit_ref" >/dev/null 2>&1; then
  echo "Invalid commit ref: $commit_ref" >&2
  exit 1
fi

commit_date="$(git show -s --format=%cs "$commit_ref")"
month="${commit_date:0:7}"
short_sha="$(git rev-parse --short "$commit_ref")"
subject="$(git show -s --format=%s "$commit_ref")"
body="$(git show -s --format=%b "$commit_ref")"
log_file="docs/ai/commit-log/${month}.md"

mkdir -p docs/ai/commit-log
if [[ ! -f "$log_file" ]]; then
  cat >"$log_file" <<EOF
# Commit Log ${month}

This file stores normalized commit summaries for ${month}.
EOF
fi

extract_field() {
  local key="$1"
  local value
  value="$(echo "$body" | awk -v key="$key" '
    BEGIN {capture=0}
    $0 ~ "^"key":" {capture=1; sub("^"key":[[:space:]]*", "", $0); print; next}
    capture == 1 && $0 ~ "^[A-Za-z-]+:" {capture=0}
    capture == 1 {print}
  ' | sed '/^[[:space:]]*$/d' | paste -sd " " -)"
  if [[ -z "$value" ]]; then
    echo "N/A"
  else
    echo "$value"
  fi
}

why="$(extract_field "Why")"
what="$(extract_field "What")"
impact="$(extract_field "Impact")"
risk="$(extract_field "Risk")"
test_line="$(extract_field "Test")"
prompt_refs="$(extract_field "Prompt-Refs")"

files_changed="$(git show --name-only --pretty="" "$commit_ref" | sed '/^[[:space:]]*$/d' | sed 's#^#`#; s#$#`#' | paste -sd ", " -)"
if [[ -z "$files_changed" ]]; then
  files_changed="N/A"
fi

if grep -q "\`${short_sha}\`" "$log_file"; then
  echo "Commit ${short_sha} already exists in ${log_file}, skipping."
  exit 0
fi

cat >>"$log_file" <<EOF

## ${commit_date} - ${subject} (\`${short_sha}\`)

- Why: ${why}
- What: ${what}
- Impact: ${impact}
- Risk: ${risk}
- Test: ${test_line}
- Prompt-Refs: ${prompt_refs}
- Files: ${files_changed}
EOF

echo "Appended commit summary to ${log_file}"
