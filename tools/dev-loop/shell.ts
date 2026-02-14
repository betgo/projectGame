import { spawnSync } from "node:child_process";

export type CommandResult = {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
};

export type RunCommandOptions = {
  streamOutput?: boolean;
  timeoutMs?: number;
};

export function runCommand(command: string, cwd: string, options: RunCommandOptions = {}): CommandResult {
  const started = Date.now();
  const result = spawnSync("bash", ["-lc", command], {
    cwd,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
    timeout: options.timeoutMs,
    stdio: options.streamOutput ? "inherit" : "pipe"
  });

  const timedOut = Boolean((result.error as NodeJS.ErrnoException | undefined)?.code === "ETIMEDOUT");
  return {
    success: (result.status ?? 1) === 0 && !timedOut,
    exitCode: result.status ?? 1,
    stdout: (result.stdout ?? "").trim(),
    stderr: timedOut ? "command timed out" : (result.stderr ?? "").trim(),
    durationMs: Date.now() - started
  };
}

export function captureCommand(command: string, cwd: string): string {
  const result = runCommand(command, cwd);
  if (!result.success) {
    throw new Error(`command failed: ${command}\n${result.stderr || result.stdout}`);
  }
  return result.stdout;
}
