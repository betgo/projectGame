import type { RetryMode } from "./types";

export const LOOP_STEPS = [
  "TASK_PREPARE",
  "IMPLEMENT",
  "FAST_GATE",
  "AUTO_FIX",
  "FULL_GATE",
  "DOC_SYNC",
  "MILESTONE_COMMIT",
  "MEMORY_FINALIZE",
  "NEXT_SUBTASK"
] as const;

export type LoopStep = (typeof LOOP_STEPS)[number];

export function shouldRetry(mode: RetryMode, attempts: number, maxRetry: number): boolean {
  if (mode === "fail-fast") {
    return false;
  }
  if (mode === "max-retry") {
    return attempts < maxRetry;
  }
  return true;
}
