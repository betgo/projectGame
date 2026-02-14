import type { BatchResult, MatchResult } from "@runtime/core/types";

export function formatMatchResult(result: MatchResult): string {
  return [
    `winner=${result.winner}`,
    `durationMs=${result.durationMs}`,
    `ticks=${result.durationTicks}`,
    `kills=${result.metrics.kills}`,
    `leaks=${result.metrics.leaks}`
  ].join(" ");
}

export function formatBatchResult(result: BatchResult): string {
  return [
    `sampleSize=${result.sampleSize}`,
    `winRate=${result.winRate.toFixed(4)}`,
    `avgDuration=${result.avgDuration.toFixed(0)}`,
    `leakRate=${result.leakRate.toFixed(4)}`,
    `imbalanceIndex=${result.imbalanceIndex.toFixed(4)}`
  ].join(" ");
}
