import path from "node:path";

import { parseLoopConfig } from "./config";
import { runDocSyncCheck } from "./doc-sync";
import { assertBranchPolicy, commitMilestone, stageMemoryArtifacts } from "./git";
import { verifyPromptRefs, verifyWarmStartFiles } from "./prompts";
import { runGate } from "./quality";
import { writeRunReport } from "./report";
import { shouldRetry } from "./state-machine";
import { markSubtaskDone, readTaskContext } from "./task";
import type { DocSyncSummary, GateSummary, LoopConfig, LoopResult, Subtask, SubtaskResult } from "./types";
import { runCommand } from "./shell";

function elapsedMinutes(startedAt: number): number {
  return (Date.now() - startedAt) / (1000 * 60);
}

function ensureNotTimedOut(startedAt: number, maxDurationMin: number): void {
  if (elapsedMinutes(startedAt) > maxDurationMin) {
    throw new Error("loop execution timeout");
  }
}

function sleep(ms: number): void {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // intentional busy wait for simple synchronous flow
  }
}

function runAutoFix(cwd: string, command: string | undefined, timeoutMin: number) {
  if (!command) {
    return undefined;
  }
  return runGate("AUTO_FIX", command, cwd, {
    streamOutput: true,
    timeoutMs: timeoutMin * 60 * 1000
  });
}

function quoteForShell(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function buildCodexPrompt(config: LoopConfig, subtask: Subtask, mode: "implement" | "autofix"): string {
  const base = [
    "Follow the repository governance rules.",
    `Read docs/ai/constitution.md, docs/ai/weekly-summary.md, and ${config.taskFile}.`,
    `Work only on subtask ${subtask.id}: ${subtask.title}.`,
    "Do not commit changes.",
    "Keep architecture boundaries intact and update docs when contract-level files change."
  ];

  if (mode === "autofix") {
    base.push("Fix only the failing checks from the latest gate output with minimal safe changes.");
  } else {
    base.push("Implement the subtask with production-quality code and tests.");
  }

  return base.join(" ");
}

function buildDefaultCodexCommand(config: LoopConfig, subtask: Subtask, mode: "implement" | "autofix"): string {
  const prompt = buildCodexPrompt(config, subtask, mode);
  return `codex exec --full-auto ${quoteForShell(prompt)}`;
}

function resolveImplementCommand(config: LoopConfig, subtask: Subtask): string | undefined {
  if (config.implementCmd) {
    return config.implementCmd;
  }
  if (config.codingCli === "codex") {
    return buildDefaultCodexCommand(config, subtask, "implement");
  }
  return undefined;
}

function resolveAutofixCommand(config: LoopConfig, subtask: Subtask): string | undefined {
  if (config.autofixCmd) {
    return config.autofixCmd;
  }
  if (config.codingCli === "codex") {
    return buildDefaultCodexCommand(config, subtask, "autofix");
  }
  return undefined;
}

function ensureCodingCliAvailable(cwd: string, config: LoopConfig): void {
  if (config.codingCli !== "codex") {
    return;
  }
  const result = runCommand("command -v codex", cwd);
  if (!result.success) {
    throw new Error("coding-cli is codex but `codex` command is not available in PATH");
  }
}

function logGate(gate: ReturnType<typeof runGate>): void {
  const status = gate.success ? "PASS" : "FAIL";
  console.log(`[${gate.name}] ${status} (${gate.durationMs}ms) -> ${gate.command}`);
  if (!gate.success && gate.stderr) {
    console.log(gate.stderr);
  }
}

function runGatesWithRetry(
  cwd: string,
  startedAt: number,
  config: ReturnType<typeof parseLoopConfig>,
  subtask: Subtask
): { gateSummary: GateSummary; docSummaries: DocSyncSummary[]; attempts: number } {
  const gateSummary: GateSummary = {
    fast: [],
    full: [],
    autofix: []
  };
  const docSummaries: DocSyncSummary[] = [];
  const autofixCommand = resolveAutofixCommand(config, subtask);

  let attempts = 0;

  for (;;) {
    ensureNotTimedOut(startedAt, config.maxDurationMin);
    attempts += 1;

    const fastGate = runGate("FAST_GATE", config.fastGateCmd, cwd);
    gateSummary.fast.push(fastGate);
    logGate(fastGate);

    if (!fastGate.success) {
      if (!shouldRetry(config.retryMode, attempts, config.maxRetry ?? 10)) {
        throw new Error("fast gate failed and retry policy stopped execution");
      }
      const fixRun = runAutoFix(cwd, autofixCommand, config.autofixTimeoutMin);
      if (fixRun) {
        gateSummary.autofix.push(fixRun);
        logGate(fixRun);
      }
      sleep(500);
      continue;
    }

    const fullGate = runGate("FULL_GATE", config.fullGateCmd, cwd);
    gateSummary.full.push(fullGate);
    logGate(fullGate);

    if (!fullGate.success) {
      if (!shouldRetry(config.retryMode, attempts, config.maxRetry ?? 10)) {
        throw new Error("full gate failed and retry policy stopped execution");
      }
      const fixRun = runAutoFix(cwd, autofixCommand, config.autofixTimeoutMin);
      if (fixRun) {
        gateSummary.autofix.push(fixRun);
        logGate(fixRun);
      }
      sleep(500);
      continue;
    }

    const docGate = runGate("DOC_SYNC", config.docsSyncCmd, cwd);
    logGate(docGate);
    const docSummary = runDocSyncCheck(cwd);
    docSummaries.push(docSummary);
    if (!docGate.success || !docSummary.passed) {
      console.log("[DOC_SYNC] FAIL");
      if (!shouldRetry(config.retryMode, attempts, config.maxRetry ?? 10)) {
        throw new Error("doc sync failed and retry policy stopped execution");
      }
      const fixRun = runAutoFix(cwd, autofixCommand, config.autofixTimeoutMin);
      if (fixRun) {
        gateSummary.autofix.push(fixRun);
        logGate(fixRun);
      }
      sleep(500);
      continue;
    }

    console.log("[DOC_SYNC] PASS");
    return {
      gateSummary,
      docSummaries,
      attempts
    };
  }
}

function latest<T>(items: T[]): T | undefined {
  if (items.length === 0) {
    return undefined;
  }
  return items[items.length - 1];
}

function mergeDocSummary(items: DocSyncSummary[]): DocSyncSummary {
  const last = latest(items);
  return (
    last ?? {
      required: false,
      passed: true,
      changedFiles: [],
      contractFiles: [],
      docFiles: [],
      missingDocs: [],
      boundaryViolations: []
    }
  );
}

function main(): number {
  const cwd = process.cwd();
  const startedAtMs = Date.now();
  const startedAtIso = new Date(startedAtMs).toISOString();

  const config = parseLoopConfig(process.argv.slice(2), cwd);
  const gateSummary: GateSummary = { fast: [], full: [], autofix: [] };
  const docSyncSummary: DocSyncSummary[] = [];
  const subtaskResults: SubtaskResult[] = [];

  try {
    ensureCodingCliAvailable(cwd, config);
    assertBranchPolicy(cwd, config.branch);

    const missingWarm = verifyWarmStartFiles(cwd);
    if (missingWarm.length > 0) {
      throw new Error(`missing warm-start files: ${missingWarm.join(", ")}`);
    }

    const missingPrompts = verifyPromptRefs(cwd, config.promptRefs);
    if (missingPrompts.length > 0) {
      throw new Error(`missing prompt refs: ${missingPrompts.join(", ")}`);
    }

    const taskContext = readTaskContext(config.taskFile, config.subtaskId);

    for (let subtaskIndex = 0; subtaskIndex < taskContext.subtasks.length; subtaskIndex += 1) {
      const subtask = taskContext.subtasks[subtaskIndex];
      ensureNotTimedOut(startedAtMs, config.maxDurationMin);
      console.log(`\n=== Processing ${subtask.id}: ${subtask.title} ===`);

      const implementCommand = resolveImplementCommand(config, subtask);
      if (implementCommand) {
        const implement = runGate("IMPLEMENT", implementCommand, cwd, {
          streamOutput: true,
          timeoutMs: config.implementTimeoutMin * 60 * 1000
        });
        if (!implement.success) {
          throw new Error(`implement command failed: ${implement.stderr || implement.stdout}`);
        }
      }

      const cycle = runGatesWithRetry(cwd, startedAtMs, config, subtask);
      gateSummary.fast.push(...cycle.gateSummary.fast);
      gateSummary.full.push(...cycle.gateSummary.full);
      gateSummary.autofix.push(...cycle.gateSummary.autofix);
      docSyncSummary.push(...cycle.docSummaries);

      let commitSha: string | undefined;
      let memoryCommitSha: string | undefined;

      if (config.autoCommit && !config.dryRun) {
        markSubtaskDone(taskContext.path, subtask);
      }

      const changedAfter = runCommand("git status --porcelain", cwd)
        .stdout.split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      subtaskResults.push({
        subtaskId: subtask.id,
        attempts: cycle.attempts,
        changedFiles: changedAfter,
        testsRun: [config.fastGateCmd, config.fullGateCmd, config.docsSyncCmd],
        commitSha,
        memoryCommitSha,
        promptRefs: config.promptRefs,
        status: "success"
      });
    }

    if (config.autoCommit && !config.dryRun) {
      let memoryCommitSha: string | undefined;
      if (config.autoFinalizeMemory) {
        const stagedMemory = stageMemoryArtifacts(cwd);
        if (stagedMemory.length > 0) {
          memoryCommitSha = "merged-in-task-commit";
        }
      }

      const taskSummary = path.basename(config.taskFile);
      const taskSubtask = {
        id: "TASK",
        title: `${taskSummary} (${taskContext.subtasks.length} subtasks)`,
        done: false
      };
      const docSummary = mergeDocSummary(docSyncSummary);
      const commitSha = commitMilestone(cwd, config, taskSubtask, gateSummary, docSummary);
      if (subtaskResults.length > 0) {
        const last = subtaskResults[subtaskResults.length - 1];
        last.commitSha = commitSha;
        last.memoryCommitSha = memoryCommitSha;
      }
    }

    const result: LoopResult = {
      status: "success",
      startedAt: startedAtIso,
      endedAt: new Date().toISOString(),
      issueId: config.issueId,
      branch: config.branch,
      taskFile: config.taskFile,
      gateSummary,
      docSyncSummary,
      subtaskResults,
      promptRefs: config.promptRefs
    };

    const reportPath = writeRunReport(cwd, result);
    result.reportPath = reportPath;
    console.log(`\nLoop finished successfully. Report: ${reportPath}`);

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes("timeout") ? "timeout" : "failed";

    const result: LoopResult = {
      status,
      startedAt: startedAtIso,
      endedAt: new Date().toISOString(),
      issueId: config.issueId,
      branch: config.branch,
      taskFile: config.taskFile,
      gateSummary,
      docSyncSummary,
      subtaskResults,
      promptRefs: config.promptRefs,
      message
    };

    const reportPath = writeRunReport(cwd, result);
    console.error(`Loop failed: ${message}`);
    console.error(`Report: ${reportPath}`);
    return status === "timeout" ? 2 : 1;
  }
}

process.exit(main());
