export type RetryMode = "until-pass" | "max-retry" | "fail-fast";

export type LoopConfig = {
  issueId: string;
  branch: string;
  taskFile: string;
  subtaskId?: string;
  codingCli: "codex" | "custom";
  retryMode: RetryMode;
  maxRetry?: number;
  maxDurationMin: number;
  autoCommit: boolean;
  autoFinalizeMemory: boolean;
  dryRun: boolean;
  implementCmd?: string;
  autofixCmd?: string;
  fastGateCmd: string;
  fullGateCmd: string;
  docsSyncCmd: string;
  promptRefs: string[];
  commitType: string;
  commitScope: string;
};

export type GateRun = {
  name: string;
  command: string;
  success: boolean;
  exitCode: number;
  durationMs: number;
  stdout: string;
  stderr: string;
};

export type GateSummary = {
  fast: GateRun[];
  full: GateRun[];
  autofix: GateRun[];
};

export type DocSyncSummary = {
  required: boolean;
  passed: boolean;
  changedFiles: string[];
  contractFiles: string[];
  docFiles: string[];
  missingDocs: string[];
  boundaryViolations: string[];
};

export type Subtask = {
  id: string;
  title: string;
  done: boolean;
};

export type SubtaskResult = {
  subtaskId: string;
  attempts: number;
  changedFiles: string[];
  testsRun: string[];
  commitSha?: string;
  memoryCommitSha?: string;
  promptRefs: string[];
  status: "success" | "failed" | "timeout";
  message?: string;
};

export type LoopResult = {
  status: "success" | "failed" | "timeout";
  startedAt: string;
  endedAt: string;
  issueId: string;
  branch: string;
  taskFile: string;
  gateSummary: GateSummary;
  docSyncSummary: DocSyncSummary[];
  subtaskResults: SubtaskResult[];
  promptRefs: string[];
  reportPath?: string;
  message?: string;
};
