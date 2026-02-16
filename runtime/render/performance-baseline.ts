import { loadPackage, step } from "../core/engine";
import type { GamePackage } from "../core/types";

import { buildPlaceholderFrame } from "./placeholder-model";
import { getWorldSnapshot } from "./snapshot";

type LayerCountsInput = {
  map: number;
  path: number;
  tower: number;
  enemy: number;
};

type LayerCounts = LayerCountsInput & {
  total: number;
};

type RenderPoolSample = {
  active: LayerCounts;
  created: LayerCounts;
  reused: LayerCounts;
  capacity: LayerCounts;
  memoryBytes: number;
  frameTimeMs: number;
};

const BASE_MEMORY_BYTES = 48 * 1024;
const OBJECT_MEMORY_BYTES: LayerCountsInput = {
  map: 160,
  path: 128,
  tower: 232,
  enemy: 216
};

const FRAME_TIME_MODEL = {
  baseMs: 1.6,
  activeObjectCostMs: 0.0045,
  createdObjectCostMs: 0.085,
  reusedObjectCostMs: 0.0012
};

function toLayerCounts(input: LayerCountsInput): LayerCounts {
  return {
    ...input,
    total: input.map + input.path + input.tower + input.enemy
  };
}

function createLayerInput(): LayerCountsInput {
  return {
    map: 0,
    path: 0,
    tower: 0,
    enemy: 0
  };
}

function estimateMemoryBytes(capacity: LayerCounts): number {
  return (
    BASE_MEMORY_BYTES +
    capacity.map * OBJECT_MEMORY_BYTES.map +
    capacity.path * OBJECT_MEMORY_BYTES.path +
    capacity.tower * OBJECT_MEMORY_BYTES.tower +
    capacity.enemy * OBJECT_MEMORY_BYTES.enemy
  );
}

function estimateFrameTimeMs(active: LayerCounts, created: LayerCounts, reused: LayerCounts): number {
  const value =
    FRAME_TIME_MODEL.baseMs +
    active.total * FRAME_TIME_MODEL.activeObjectCostMs +
    created.total * FRAME_TIME_MODEL.createdObjectCostMs +
    reused.total * FRAME_TIME_MODEL.reusedObjectCostMs;
  return round(value, 4);
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function percentile(sortedValues: number[], ratio: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }
  const clamped = Math.min(1, Math.max(0, ratio));
  const index = Math.floor((sortedValues.length - 1) * clamped);
  return sortedValues[index];
}

function normalizePositiveInteger(
  field: string,
  value: number | undefined,
  fallback: number
): number {
  if (value === undefined) {
    return fallback;
  }
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer`);
  }
  return value;
}

class RenderPoolTelemetry {
  private readonly capacityInput: LayerCountsInput = createLayerInput();

  sample(activeInput: LayerCountsInput): RenderPoolSample {
    const createdInput: LayerCountsInput = {
      map: Math.max(0, activeInput.map - this.capacityInput.map),
      path: Math.max(0, activeInput.path - this.capacityInput.path),
      tower: Math.max(0, activeInput.tower - this.capacityInput.tower),
      enemy: Math.max(0, activeInput.enemy - this.capacityInput.enemy)
    };
    const reusedInput: LayerCountsInput = {
      map: activeInput.map - createdInput.map,
      path: activeInput.path - createdInput.path,
      tower: activeInput.tower - createdInput.tower,
      enemy: activeInput.enemy - createdInput.enemy
    };

    this.capacityInput.map += createdInput.map;
    this.capacityInput.path += createdInput.path;
    this.capacityInput.tower += createdInput.tower;
    this.capacityInput.enemy += createdInput.enemy;

    const active = toLayerCounts(activeInput);
    const created = toLayerCounts(createdInput);
    const reused = toLayerCounts(reusedInput);
    const capacity = toLayerCounts(this.capacityInput);

    return {
      active,
      created,
      reused,
      capacity,
      memoryBytes: estimateMemoryBytes(capacity),
      frameTimeMs: estimateFrameTimeMs(active, created, reused)
    };
  }

  getCapacity(): LayerCounts {
    return toLayerCounts(this.capacityInput);
  }
}

export type RenderBaselinePackageInput = {
  id: string;
  pkg: GamePackage;
};

export type RenderBaselineCollectionOptions = {
  restarts?: number;
  warmupFrames?: number;
  measuredFramesPerRestart?: number;
  seed?: number;
};

export type RenderFrameTimeStats = {
  avgMs: number;
  minMs: number;
  p50Ms: number;
  p90Ms: number;
  p99Ms: number;
  maxMs: number;
};

export type RenderMemoryTrend = {
  firstPeakBytes: number;
  lastPeakBytes: number;
  deltaBytes: number;
  maxDriftBytes: number;
};

export type RenderObjectReuseStats = {
  createdObjects: number;
  reusedObjects: number;
  reuseRatio: number;
  avgAllocationsPerRestart: number;
};

export type RenderBaselinePackageReport = {
  packageId: string;
  restarts: number;
  measuredFrames: number;
  fps: number;
  frameTime: RenderFrameTimeStats;
  memoryTrend: RenderMemoryTrend;
  objectReuse: RenderObjectReuseStats;
};

export type RenderBaselineProtocol = {
  restarts: number;
  warmupFrames: number;
  measuredFramesPerRestart: number;
  seed: number;
};

export type RenderBaselineAggregateReport = {
  packageCount: number;
  totalMeasuredFrames: number;
  overallFps: number;
  worstP99Ms: number;
  maxMemoryDeltaBytes: number;
};

export type RenderBaselineReport = {
  protocol: RenderBaselineProtocol;
  packages: RenderBaselinePackageReport[];
  aggregate: RenderBaselineAggregateReport;
};

function normalizeOptions(options: RenderBaselineCollectionOptions): RenderBaselineProtocol {
  const seed = normalizePositiveInteger("seed", options.seed, 1);
  return {
    restarts: normalizePositiveInteger("restarts", options.restarts, 5),
    warmupFrames: normalizePositiveInteger("warmupFrames", options.warmupFrames, 8),
    measuredFramesPerRestart: normalizePositiveInteger(
      "measuredFramesPerRestart",
      options.measuredFramesPerRestart,
      120
    ),
    seed
  };
}

function summarizeFrameTimes(values: number[]): RenderFrameTimeStats {
  if (values.length === 0) {
    return {
      avgMs: 0,
      minMs: 0,
      p50Ms: 0,
      p90Ms: 0,
      p99Ms: 0,
      maxMs: 0
    };
  }

  const sorted = [...values].sort((left, right) => left - right);
  const sum = values.reduce((acc, value) => acc + value, 0);

  return {
    avgMs: round(sum / values.length, 4),
    minMs: round(sorted[0], 4),
    p50Ms: round(percentile(sorted, 0.5), 4),
    p90Ms: round(percentile(sorted, 0.9), 4),
    p99Ms: round(percentile(sorted, 0.99), 4),
    maxMs: round(sorted[sorted.length - 1], 4)
  };
}

function createPackageReport(
  input: RenderBaselinePackageInput,
  protocol: RenderBaselineProtocol
): RenderBaselinePackageReport {
  const measuredFrameTimes: number[] = [];
  const restartPeaks: number[] = [];
  let createdObjects = 0;
  let reusedObjects = 0;
  let totalAllocations = 0;

  for (let restartIndex = 0; restartIndex < protocol.restarts; restartIndex += 1) {
    const world = loadPackage(input.pkg, protocol.seed);
    const tickMs = input.pkg.rules.payload.spawnRules.tickMs;
    const tracker = new RenderPoolTelemetry();
    let restartPeak = 0;

    const totalFrames = protocol.warmupFrames + protocol.measuredFramesPerRestart;
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex += 1) {
      if (frameIndex > 0 && world.status === "running") {
        step(world, tickMs);
      }

      const snapshot = getWorldSnapshot(world);
      const frame = buildPlaceholderFrame(snapshot);
      const sample = tracker.sample({
        map: frame.map.length,
        path: frame.path.length,
        tower: frame.towers.length,
        enemy: frame.enemies.length
      });

      restartPeak = Math.max(restartPeak, sample.memoryBytes);
      if (frameIndex >= protocol.warmupFrames) {
        measuredFrameTimes.push(sample.frameTimeMs);
        createdObjects += sample.created.total;
        reusedObjects += sample.reused.total;
      }
    }

    restartPeaks.push(restartPeak);
    totalAllocations += tracker.getCapacity().total;
  }

  const frameTime = summarizeFrameTimes(measuredFrameTimes);
  const fps = frameTime.avgMs > 0 ? round(1000 / frameTime.avgMs, 4) : 0;
  const firstPeak = restartPeaks[0] ?? 0;
  const lastPeak = restartPeaks.at(-1) ?? 0;
  const memoryTrend: RenderMemoryTrend = {
    firstPeakBytes: firstPeak,
    lastPeakBytes: lastPeak,
    deltaBytes: lastPeak - firstPeak,
    maxDriftBytes: restartPeaks.reduce(
      (max, value) => Math.max(max, Math.abs(value - firstPeak)),
      0
    )
  };
  const totalReuseOps = createdObjects + reusedObjects;
  const objectReuse: RenderObjectReuseStats = {
    createdObjects,
    reusedObjects,
    reuseRatio: totalReuseOps === 0 ? 0 : round(reusedObjects / totalReuseOps, 4),
    avgAllocationsPerRestart: round(totalAllocations / protocol.restarts, 2)
  };

  return {
    packageId: input.id,
    restarts: protocol.restarts,
    measuredFrames: measuredFrameTimes.length,
    fps,
    frameTime,
    memoryTrend,
    objectReuse
  };
}

function createAggregateReport(
  reports: RenderBaselinePackageReport[]
): RenderBaselineAggregateReport {
  const packageCount = reports.length;
  const totalMeasuredFrames = reports.reduce(
    (sum, report) => sum + report.measuredFrames,
    0
  );
  const totalDurationMs = reports.reduce(
    (sum, report) => sum + report.frameTime.avgMs * report.measuredFrames,
    0
  );
  const overallFps =
    totalDurationMs > 0 ? round((totalMeasuredFrames * 1000) / totalDurationMs, 4) : 0;

  return {
    packageCount,
    totalMeasuredFrames,
    overallFps,
    worstP99Ms: round(
      reports.reduce((max, report) => Math.max(max, report.frameTime.p99Ms), 0),
      4
    ),
    maxMemoryDeltaBytes: reports.reduce(
      (max, report) => Math.max(max, Math.abs(report.memoryTrend.deltaBytes)),
      0
    )
  };
}

export function collectRenderPerformanceBaseline(
  packages: RenderBaselinePackageInput[],
  options: RenderBaselineCollectionOptions = {}
): RenderBaselineReport {
  if (packages.length === 0) {
    throw new Error("packages must not be empty");
  }

  const protocol = normalizeOptions(options);
  const reports = packages.map((item) => createPackageReport(item, protocol));

  return {
    protocol,
    packages: reports,
    aggregate: createAggregateReport(reports)
  };
}
