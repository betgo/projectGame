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
    `seeds=${result.seeds.length}`,
    `winRate=${result.winRate.toFixed(2)}`,
    `avgDuration=${result.avgDuration.toFixed(0)}ms`,
    `leakRate=${result.leakRate.toFixed(2)}`,
    `imbalanceIndex=${result.imbalanceIndex.toFixed(3)}`
  ].join(" ");
}
