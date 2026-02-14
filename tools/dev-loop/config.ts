import fs from "node:fs";
import path from "node:path";

import type { LoopConfig, RetryMode } from "./types";
import { captureCommand } from "./shell";

function parseArgv(argv: string[]): Record<string, string | boolean> {
  const parsed: Record<string, string | boolean> = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }

    const raw = token.slice(2);
    if (raw.includes("=")) {
      const [key, value] = raw.split("=", 2);
      parsed[key] = value;
      continue;
    }

    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      parsed[raw] = true;
      continue;
    }

    parsed[raw] = next;
    i += 1;
  }

  return parsed;
}

function asString(value: string | boolean | undefined, fallback = ""): string {
  if (typeof value === "string") {
    return value;
  }
  return fallback;
}

function asBool(value: string | boolean | undefined, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (["true", "1", "yes", "y"].includes(value.toLowerCase())) {
      return true;
    }
    if (["false", "0", "no", "n"].includes(value.toLowerCase())) {
      return false;
    }
  }
  return fallback;
}

function asNumber(value: string | boolean | undefined, fallback: number): number {
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function currentBranch(cwd: string): string {
  return captureCommand("git rev-parse --abbrev-ref HEAD", cwd);
}

function inferIssueId(branch: string): string {
  const match = /^codex\/([^-\/]+)/.exec(branch);
  if (match) {
    return match[1];
  }
  return "local";
}

function resolveTaskFile(cwd: string, issueId: string, input?: string): string {
  if (input) {
    return path.resolve(cwd, input);
  }

  const tasksDir = path.resolve(cwd, "docs/ai/tasks");
  if (!fs.existsSync(tasksDir)) {
    return path.resolve(cwd, "docs/ai/tasks/TEMPLATE.md");
  }

  const candidates = fs
    .readdirSync(tasksDir)
    .filter((file) => file.endsWith(".md") && file.includes(issueId))
    .sort();

  if (candidates.length > 0) {
    return path.resolve(tasksDir, candidates[0]);
  }

  return path.resolve(cwd, "docs/ai/tasks/TEMPLATE.md");
}

function parseRetryMode(value: string): RetryMode {
  if (value === "max-retry" || value === "fail-fast" || value === "until-pass") {
    return value;
  }
  return "until-pass";
}

export function parseLoopConfig(argv: string[], cwd: string): LoopConfig {
  const args = parseArgv(argv);
  const branch = asString(args.branch, currentBranch(cwd));
  const issueId = asString(args["issue-id"], inferIssueId(branch));
  const retryMode = parseRetryMode(asString(args["retry-mode"], "until-pass"));
  const codingCli = asString(args["coding-cli"], "codex") === "custom" ? "custom" : "codex";

  return {
    issueId,
    branch,
    taskFile: resolveTaskFile(cwd, issueId, asString(args["task-file"], "")),
    subtaskId: asString(args["subtask-id"], "") || undefined,
    codingCli,
    retryMode,
    maxRetry: asNumber(args["max-retry"], 10),
    maxDurationMin: asNumber(args["max-duration-min"], 180),
    autoCommit: asBool(args["auto-commit"], true),
    autoFinalizeMemory: asBool(args["auto-finalize-memory"], true),
    dryRun: asBool(args["dry-run"], false),
    implementCmd: asString(args["implement-cmd"], "") || undefined,
    autofixCmd: asString(args["autofix-cmd"], "") || undefined,
    fastGateCmd: asString(args["fast-gate-cmd"], "pnpm gate:fast"),
    fullGateCmd: asString(args["full-gate-cmd"], "pnpm gate:full"),
    docsSyncCmd: asString(args["docs-sync-cmd"], "pnpm docs:sync-check"),
    promptRefs: asString(
      args["prompt-refs"],
      "ARCHITECT_v1,PLANNER_v1,BUILDER_v2,GUARDIAN_v1,REVIEWER_v1"
    )
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    commitType: asString(args["commit-type"], "feat"),
    commitScope: asString(args["commit-scope"], "loop")
  };
}
