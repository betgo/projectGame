#!/usr/bin/env bash
set -euo pipefail

root_dir="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$root_dir"

include_missing=0
refs=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --missing)
      include_missing=1
      ;;
    *)
      refs+=("$1")
      ;;
  esac
  shift
done

if [[ ${#refs[@]} -eq 0 ]]; then
  refs=("HEAD")
fi

extract_field() {
  local body="$1"
  local key="$2"
  local value
  value="$(printf '%s\n' "$body" | awk -v key="$key" '
    BEGIN {capture=0}
    $0 ~ "^"key":" {capture=1; sub("^"key":[[:space:]]*", "", $0); print; next}
    capture == 1 && $0 ~ "^[A-Za-z-]+:" {capture=0}
    capture == 1 {print}
  ' | sed '/^[[:space:]]*$/d' | sed -E 's/^[[:space:]]*-[[:space:]]*//' | paste -sd " " - | sed -E 's/[[:space:]]+/ /g; s/^ //; s/ $//')"
  if [[ -z "$value" ]]; then
    echo "N/A"
  else
    echo "$value"
  fi
}

format_files_changed() {
  local commit_ref="$1"
  local files
  files="$(git show --name-only --pretty="" "$commit_ref" | sed '/^[[:space:]]*$/d' | sed 's#^#`#; s#$#`#' | awk '
    BEGIN { first=1 }
    {
      if (!first) {
        printf(", ")
      }
      printf("%s", $0)
      first=0
    }
  ')"
  if [[ -z "$files" ]]; then
    echo "N/A"
  else
    echo "$files"
  fi
}

ensure_log_file() {
  local month="$1"
  local log_file="docs/ai/commit-log/${month}.md"
  mkdir -p docs/ai/commit-log
  if [[ ! -f "$log_file" ]]; then
    cat >"$log_file" <<EOF
# Commit Log ${month}

This file stores normalized commit summaries for ${month}.
EOF
  fi
  echo "$log_file"
}

expand_refs() {
  local ref="$1"
  if [[ "$ref" == *".."* ]]; then
    git rev-list --reverse "$ref"
    return
  fi
  if [[ "$include_missing" -eq 1 ]]; then
    git rev-list --reverse "$ref"
    return
  fi
  echo "$ref"
}

collect_logged_shas() {
  if [[ ! -d docs/ai/commit-log ]]; then
    return
  fi

  while IFS= read -r file; do
    grep -oE '\`[0-9a-f]{7,40}\`' "$file" 2>/dev/null | tr -d '`' || true
  done < <(find docs/ai/commit-log -maxdepth 1 -name '*.md' -type f | sort)
}

append_commit() {
  local commit_ref="$1"
  if ! git rev-parse --verify "$commit_ref" >/dev/null 2>&1; then
    echo "Invalid commit ref: $commit_ref" >&2
    return 1
  fi

  local commit_date
  commit_date="$(git show -s --format=%cs "$commit_ref")"
  local month="${commit_date:0:7}"
  local short_sha
  short_sha="$(git rev-parse --short "$commit_ref")"
  local subject
  subject="$(git show -s --format=%s "$commit_ref")"
  local body
  body="$(git show -s --format=%b "$commit_ref")"
  local log_file
  log_file="$(ensure_log_file "$month")"

  if collect_logged_shas | grep -Fxq "$short_sha"; then
    echo "Commit ${short_sha} already exists in ${log_file}, skipping."
    return 0
  fi

  local why
  why="$(extract_field "$body" "Why")"
  local what
  what="$(extract_field "$body" "What")"
  local impact
  impact="$(extract_field "$body" "Impact")"
  local risk
  risk="$(extract_field "$body" "Risk")"
  local test_line
  test_line="$(extract_field "$body" "Test")"
  local prompt_refs
  prompt_refs="$(extract_field "$body" "Prompt-Refs")"
  local files_changed
  files_changed="$(format_files_changed "$commit_ref")"

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

  echo "Appended commit summary to ${log_file}: ${short_sha}"
}

commit_refs=()
for raw_ref in "${refs[@]}"; do
  while IFS= read -r expanded_ref; do
    if [[ -n "$expanded_ref" ]]; then
      commit_refs+=("$expanded_ref")
    fi
  done < <(expand_refs "$raw_ref")
done

if [[ "$include_missing" -eq 1 ]]; then
  filtered_refs=()
  logged_sha_file="$(mktemp)"
  seen_sha_file="$(mktemp)"
  trap 'rm -f "$logged_sha_file" "$seen_sha_file"' EXIT
  collect_logged_shas | sort -u >"$logged_sha_file"

  for commit_ref in "${commit_refs[@]}"; do
    short_sha="$(git rev-parse --short "$commit_ref")"
    commit_body="$(git show -s --format=%b "$commit_ref")"
    if [[ "$commit_body" != *"Prompt-Refs:"* ]]; then
      continue
    fi
    if grep -Fxq "$short_sha" "$seen_sha_file"; then
      continue
    fi
    echo "$short_sha" >>"$seen_sha_file"
    if grep -Fxq "$short_sha" "$logged_sha_file"; then
      continue
    fi
    filtered_refs+=("$commit_ref")
  done

  if [[ ${#filtered_refs[@]} -eq 0 ]]; then
    commit_refs=()
  else
    commit_refs=("${filtered_refs[@]}")
  fi
fi

if [[ ${#commit_refs[@]} -eq 0 ]]; then
  if [[ "$include_missing" -eq 1 ]]; then
    echo "No missing commits to append."
    exit 0
  fi
  echo "No commit refs resolved from input." >&2
  exit 1
fi

for commit_ref in "${commit_refs[@]}"; do
  append_commit "$commit_ref"
done
