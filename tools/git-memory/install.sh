#!/usr/bin/env bash
set -euo pipefail

root_dir="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$root_dir"

git config commit.template .gitmessage.ai.txt
git config core.hooksPath .githooks

chmod +x .githooks/commit-msg .githooks/pre-push
chmod +x tools/git-memory/*.sh

echo "AI memory Git workflow installed."
echo "- commit template: .gitmessage.ai.txt"
echo "- hooks path: .githooks"

