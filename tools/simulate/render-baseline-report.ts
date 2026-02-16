import type { RenderBaselineReport } from "@runtime/render/performance-baseline";

function formatDecimal(value: number, digits = 4): string {
  return value.toFixed(digits);
}

function formatProtocol(report: RenderBaselineReport): string {
  return [
    "protocol",
    `restarts=${report.protocol.restarts}`,
    `warmupFrames=${report.protocol.warmupFrames}`,
    `measuredFrames=${report.protocol.measuredFramesPerRestart}`,
    `seed=${report.protocol.seed}`
  ].join(" ");
}

function formatPackageLine(report: RenderBaselineReport, packageId: string): string {
  const item = report.packages.find((entry) => entry.packageId === packageId);
  if (!item) {
    throw new Error(`missing package report: ${packageId}`);
  }

  return [
    `package=${item.packageId}`,
    `frames=${item.measuredFrames}`,
    `fps=${formatDecimal(item.fps)}`,
    `frameAvgMs=${formatDecimal(item.frameTime.avgMs)}`,
    `frameP50Ms=${formatDecimal(item.frameTime.p50Ms)}`,
    `frameP90Ms=${formatDecimal(item.frameTime.p90Ms)}`,
    `frameP99Ms=${formatDecimal(item.frameTime.p99Ms)}`,
    `memoryFirstBytes=${item.memoryTrend.firstPeakBytes}`,
    `memoryLastBytes=${item.memoryTrend.lastPeakBytes}`,
    `memoryDeltaBytes=${item.memoryTrend.deltaBytes}`,
    `memoryMaxDriftBytes=${item.memoryTrend.maxDriftBytes}`,
    `reuseRatio=${formatDecimal(item.objectReuse.reuseRatio)}`,
    `allocationsPerRestart=${item.objectReuse.avgAllocationsPerRestart.toFixed(2)}`
  ].join(" ");
}

function formatAggregate(report: RenderBaselineReport): string {
  return [
    "aggregate",
    `packageCount=${report.aggregate.packageCount}`,
    `totalFrames=${report.aggregate.totalMeasuredFrames}`,
    `overallFps=${formatDecimal(report.aggregate.overallFps)}`,
    `worstP99Ms=${formatDecimal(report.aggregate.worstP99Ms)}`,
    `maxMemoryDeltaBytes=${report.aggregate.maxMemoryDeltaBytes}`
  ].join(" ");
}

export function formatRenderBaselineReport(
  report: RenderBaselineReport,
  packageOrder: string[]
): string {
  const lines = [formatProtocol(report)];
  for (const packageId of packageOrder) {
    lines.push(formatPackageLine(report, packageId));
  }
  lines.push(formatAggregate(report));
  return lines.join("\n");
}
