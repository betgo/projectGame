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
  const match = /^codex\/([^-/]+)/.exec(branch);
  if (match) {
    return match[1];
  }
  return "local";
}

function normalizeIssueId(raw: string): string {
  const value = raw.trim();
  if (!value) {
    return "";
  }
  if (/^\d+$/.test(value)) {
    return String(Number(value));
  }
  return value;
}

function issueIdFromTaskFileName(fileName: string): string | undefined {
  const match = /^T-(\d+)\b/i.exec(fileName);
  if (!match) {
    return undefined;
  }
  return normalizeIssueId(match[1]);
}

type TaskCard = {
  fileName: string;
  absolutePath: string;
  issueId?: string;
  done: boolean;
};

function parseTaskDoneState(content: string): boolean {
  const match = content.match(/^- Status:\s*(.+)$/im);
  if (!match) {
    return false;
  }
  return match[1].toLowerCase().includes("done");
}

function listTaskCards(cwd: string): TaskCard[] {
  const tasksDir = path.resolve(cwd, "docs/ai/tasks");
  if (!fs.existsSync(tasksDir)) {
    return [];
  }

  return fs
    .readdirSync(tasksDir)
    .filter((file) => file.endsWith(".md"))
    .filter((file) => !["TEMPLATE.md", "SUBTASK-TEMPLATE.md"].includes(file))
    .map((fileName) => {
      const absolutePath = path.resolve(tasksDir, fileName);
      const content = fs.readFileSync(absolutePath, "utf-8");
      return {
        fileName,
        absolutePath,
        issueId: issueIdFromTaskFileName(fileName),
        done: parseTaskDoneState(content)
      };
    })
    .sort((a, b) => a.fileName.localeCompare(b.fileName));
}

function resolveTaskAndIssue(
  cwd: string,
  branch: string,
  issueInput?: string,
  taskFileInput?: string
): { issueId: string; taskFile: string } {
  const fallbackIssue = inferIssueId(branch);

  if (taskFileInput) {
    const taskFile = path.resolve(cwd, taskFileInput);
    const inferred = issueIdFromTaskFileName(path.basename(taskFile));
    return {
      issueId: normalizeIssueId(issueInput ?? inferred ?? fallbackIssue),
      taskFile
    };
  }

  const cards = listTaskCards(cwd).filter((card) => card.issueId);
  const requestedIssue = issueInput ? normalizeIssueId(issueInput) : undefined;

  if (requestedIssue) {
    const matched = cards.find((card) => card.issueId === requestedIssue && !card.done);
    if (matched) {
      return { issueId: requestedIssue, taskFile: matched.absolutePath };
    }
    return {
      issueId: requestedIssue,
      taskFile: path.resolve(cwd, "docs/ai/tasks/TEMPLATE.md")
    };
  }

  const branchIssue = normalizeIssueId(fallbackIssue);
  if (branchIssue !== "local") {
    const branchMatched = cards.find((card) => card.issueId === branchIssue && !card.done);
    if (branchMatched) {
      return { issueId: branchIssue, taskFile: branchMatched.absolutePath };
    }
  }

  const activeCards = cards.filter((card) => !card.done);
  if (activeCards.length > 0) {
    const only = activeCards[0];
    return {
      issueId: only.issueId ?? branchIssue,
      taskFile: only.absolutePath
    };
  }

  return {
    issueId: branchIssue,
    taskFile: path.resolve(cwd, "docs/ai/tasks/TEMPLATE.md")
  };
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
  const retryMode = parseRetryMode(asString(args["retry-mode"], "until-pass"));
  const codingCli = asString(args["coding-cli"], "codex") === "custom" ? "custom" : "codex";
  const resolved = resolveTaskAndIssue(
    cwd,
    branch,
    asString(args["issue-id"], "") || undefined,
    asString(args["task-file"], "") || undefined
  );

  return {
    issueId: resolved.issueId,
    branch,
    taskFile: resolved.taskFile,
    continueNextTasks: asBool(args["continue-next-tasks"], true),
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
    implementTimeoutMin: asNumber(args["implement-timeout-min"], 20),
    autofixTimeoutMin: asNumber(args["autofix-timeout-min"], 10),
    fastGateCmd: asString(args["fast-gate-cmd"], "pnpm gate:fast"),
    fullGateCmd: asString(args["full-gate-cmd"], "pnpm gate:full"),
    docsSyncCmd: asString(args["docs-sync-cmd"], "pnpm docs:sync-check"),
    allowDocContractTests: asBool(args["allow-doc-contract-tests"], false),
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
