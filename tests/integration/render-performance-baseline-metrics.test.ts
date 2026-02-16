import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { GamePackage } from "@runtime/core/types";
import { collectRenderPerformanceBaseline } from "@runtime/render/performance-baseline";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

function readExamplePackage(fileName: string): GamePackage {
  const file = path.join(projectRoot, "game/examples", fileName);
  const raw = fs.readFileSync(file, "utf-8");
  return JSON.parse(raw) as GamePackage;
}

const representativePackages = [
  { id: "td-easy", pkg: readExamplePackage("td-easy.json") },
  { id: "td-normal", pkg: readExamplePackage("td-normal.json") },
  { id: "td-hard", pkg: readExamplePackage("td-hard.json") }
];

describe("render performance baseline metrics", () => {
  it("collects reproducible fps/frame-time/memory trend metrics for representative packages", () => {
    const options = {
      restarts: 3,
      warmupFrames: 4,
      measuredFramesPerRestart: 24,
      seed: 1
    };

    const first = collectRenderPerformanceBaseline(representativePackages, options);
    const second = collectRenderPerformanceBaseline(representativePackages, options);

    expect(first).toEqual(second);
    expect(first.protocol).toEqual({
      restarts: 3,
      warmupFrames: 4,
      measuredFramesPerRestart: 24,
      seed: 1
    });
    expect(first.packages.map((item) => item.packageId)).toEqual([
      "td-easy",
      "td-normal",
      "td-hard"
    ]);

    for (const report of first.packages) {
      expect(report.restarts).toBe(3);
      expect(report.measuredFrames).toBe(72);
      expect(report.fps).toBeGreaterThan(0);
      expect(report.frameTime.avgMs).toBeGreaterThan(0);
      expect(report.frameTime.p90Ms).toBeGreaterThanOrEqual(report.frameTime.p50Ms);
      expect(report.frameTime.p99Ms).toBeGreaterThanOrEqual(report.frameTime.p90Ms);
      expect(report.memoryTrend.deltaBytes).toBe(0);
      expect(report.memoryTrend.maxDriftBytes).toBe(0);
      expect(report.objectReuse.reuseRatio).toBeGreaterThan(0.85);
      expect(report.objectReuse.avgAllocationsPerRestart).toBeGreaterThan(0);
    }

    expect(first.aggregate.packageCount).toBe(3);
    expect(first.aggregate.totalMeasuredFrames).toBe(216);
    expect(first.aggregate.overallFps).toBeGreaterThan(0);
    expect(first.aggregate.maxMemoryDeltaBytes).toBe(0);
  });

  it("rejects invalid profiling inputs", () => {
    expect(() =>
      collectRenderPerformanceBaseline([], {
        restarts: 3
      })
    ).toThrow("packages must not be empty");
    expect(() =>
      collectRenderPerformanceBaseline(representativePackages, {
        restarts: 0
      })
    ).toThrow("restarts must be a positive integer");
    expect(() =>
      collectRenderPerformanceBaseline(representativePackages, {
        measuredFramesPerRestart: -1
      })
    ).toThrow("measuredFramesPerRestart must be a positive integer");
  });
});
