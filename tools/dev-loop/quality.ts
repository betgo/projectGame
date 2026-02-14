import type { GateRun } from "./types";
import { runCommand, type RunCommandOptions } from "./shell";

export function runGate(name: string, command: string, cwd: string, options: RunCommandOptions = {}): GateRun {
  const result = runCommand(command, cwd, options);
  return {
    name,
    command,
    success: result.success,
    exitCode: result.exitCode,
    durationMs: result.durationMs,
    stdout: result.stdout,
    stderr: result.stderr
  };
}
