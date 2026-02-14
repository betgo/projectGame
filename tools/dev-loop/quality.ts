import type { GateRun } from "./types";
import { runCommand } from "./shell";

export function runGate(name: string, command: string, cwd: string): GateRun {
  const result = runCommand(command, cwd);
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
