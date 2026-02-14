import { spawnSync } from "node:child_process";

export type CommandResult = {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
};

export function runCommand(command: string, cwd: string): CommandResult {
  const started = Date.now();
  const result = spawnSync("bash", ["-lc", command], {
    cwd,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024
  });
  return {
    success: (result.status ?? 1) === 0,
    exitCode: result.status ?? 1,
    stdout: (result.stdout ?? "").trim(),
    stderr: (result.stderr ?? "").trim(),
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
