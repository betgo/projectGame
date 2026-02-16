import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { DocSyncSummary, GateSummary, LoopConfig, Subtask } from "./types";
import { captureCommand, runCommand } from "./shell";
import { listChangedFiles } from "./doc-sync";

export function currentBranch(cwd: string): string {
  return captureCommand("git rev-parse --abbrev-ref HEAD", cwd);
}

export function assertBranchPolicy(cwd: string, expectedBranch: string): void {
  const branch = currentBranch(cwd);
  if (branch !== "main") {
    throw new Error(`branch must be main, current: ${branch}`);
  }
  if (expectedBranch && expectedBranch !== branch) {
    throw new Error(`branch mismatch, expected ${expectedBranch}, got ${branch}`);
  }
}

function writeCommitMessage(message: string): string {
  const file = path.join(os.tmpdir(), `dev-loop-commit-${Date.now()}.txt`);
  fs.writeFileSync(file, message);
  return file;
}

function buildMilestoneMessage(
  config: LoopConfig,
  subtask: Subtask,
  gateSummary: GateSummary,
  docSummary: DocSyncSummary
): string {
  const tests = [
    ...gateSummary.fast.map((item) => `${item.name}:${item.success ? "pass" : "fail"}`),
    ...gateSummary.full.map((item) => `${item.name}:${item.success ? "pass" : "fail"}`),
    `DOC_SYNC:${docSummary.passed ? "pass" : "fail"}`
  ].join(", ");

  return `${config.commitType}(${config.commitScope}): close ${subtask.id} ${subtask.title}\n\nWhy:
Complete subtask ${subtask.id} in continuous AI loop.
What:
- Finished implementation, gates, and doc sync for ${subtask.title}.
Impact:
- Progresses issue ${config.issueId} with traceable milestone delivery.
Risk:
- Medium. Verify integration on follow-up subtasks.
Test:
${tests}
Prompt-Refs: ${config.promptRefs.join(",")}
`;
}

function buildMemoryMessage(config: LoopConfig, subtask: Subtask): string {
  return `docs(memory): finalize ${subtask.id} ${subtask.title}\n\nWhy:
Finalize memory artifacts after milestone commit.
What:
- Updated commit-log and weekly-summary via git-memory workflow.
Impact:
- Keeps AI context warm-start accurate for next loop.
Risk:
- Low.
Test:
bash tools/git-memory/finalize-task.sh
Prompt-Refs: ${config.promptRefs.join(",")}
`;
}

export function commitMilestone(
  cwd: string,
  config: LoopConfig,
  subtask: Subtask,
  gateSummary: GateSummary,
  docSummary: DocSyncSummary
): string {
  const changedFiles = listChangedFiles(cwd);
  if (changedFiles.length === 0) {
    throw new Error("no changes detected, cannot create milestone commit");
  }

  runCommand("git add -A", cwd);
  const messagePath = writeCommitMessage(buildMilestoneMessage(config, subtask, gateSummary, docSummary));
  const commit = runCommand(`git commit -F ${messagePath}`, cwd);
  fs.unlinkSync(messagePath);

  if (!commit.success) {
    throw new Error(`milestone commit failed: ${commit.stderr || commit.stdout}`);
  }

  return captureCommand("git rev-parse --short HEAD", cwd);
}

export function finalizeMemoryCommit(cwd: string, config: LoopConfig, subtask: Subtask): string | undefined {
  const finalize = runCommand("bash tools/git-memory/finalize-task.sh", cwd);
  if (!finalize.success) {
    throw new Error(`memory finalize failed: ${finalize.stderr || finalize.stdout}`);
  }

  const staged = captureCommand("git diff --cached --name-only", cwd)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (staged.length === 0) {
    return undefined;
  }

  const messagePath = writeCommitMessage(buildMemoryMessage(config, subtask));
  const commit = runCommand(`git commit -F ${messagePath}`, cwd);
  fs.unlinkSync(messagePath);

  if (!commit.success) {
    throw new Error(`memory commit failed: ${commit.stderr || commit.stdout}`);
  }

  return captureCommand("git rev-parse --short HEAD", cwd);
}
