import { describe, expect, it } from "vitest";

import easyPackage from "@game/examples/td-easy.json";
import { createBatchSeeds, runBatch, runScenario } from "@runtime/core/engine";
import type { GamePackage } from "@runtime/core/types";

const packageFixture = easyPackage as GamePackage;

describe("batch simulation", () => {
  it("creates deterministic sequential seed arrays", () => {
    expect(createBatchSeeds(4)).toEqual([1, 2, 3, 4]);
    expect(createBatchSeeds(3, 7)).toEqual([7, 8, 9]);
  });

  it("rejects invalid rounds for seed generation", () => {
    expect(() => createBatchSeeds(0)).toThrow("rounds must be a positive integer");
    expect(() => createBatchSeeds(2.5)).toThrow("rounds must be a positive integer");
  });

  it("returns deterministic aggregate metrics for the same seed sequence", () => {
    const seeds = [1, 2, 3, 4, 5];
    const first = runBatch(packageFixture, seeds);
    const second = runBatch(packageFixture, seeds);

    expect(first).toEqual(second);
    expect(first.seeds).not.toBe(seeds);
    expect(first.sampleSize).toBe(seeds.length);
  });

  it("matches aggregate calculations derived from scenario outcomes", () => {
    const seeds = [1, 2, 3];
    const outcomes = seeds.map((seed) => runScenario(packageFixture, seed));
    const wins = outcomes.filter((item) => item.winner === "defender").length;
    const avgDuration = outcomes.reduce((sum, item) => sum + item.durationMs, 0) / outcomes.length;
    const leakRate = outcomes.reduce((sum, item) => sum + item.metrics.leaks, 0) / outcomes.length;
    const winRate = wins / outcomes.length;

    const result = runBatch(packageFixture, seeds);

    expect(result.sampleSize).toBe(outcomes.length);
    expect(result.winRate).toBeCloseTo(winRate, 10);
    expect(result.avgDuration).toBeCloseTo(avgDuration, 10);
    expect(result.leakRate).toBeCloseTo(leakRate, 10);
    expect(result.imbalanceIndex).toBeCloseTo(Math.abs(0.5 - winRate) + leakRate * 0.02, 10);
    expect(result.errors).toEqual([]);
  });

  it("fails fast for empty seed input", () => {
    expect(() => runBatch(packageFixture, [])).toThrow("batch seeds must not be empty");
  });
});
