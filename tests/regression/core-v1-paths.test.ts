import { afterEach, describe, expect, it } from "vitest";

import { MockAiProvider } from "@ai/mock-provider";
import { generateValidateAndRepair } from "@ai/pipeline";
import { setAiProvider } from "@ai/provider";
import type { AiProvider } from "@ai/types";
import easyPackage from "@game/examples/td-easy.json";
import { validateGamePackage } from "@game/schemas/index";
import { createProject, exportPackage, startPreview } from "@editor/editor/api";
import { createBatchSeeds, runBatch, runScenario } from "@runtime/core/engine";
import type { BatchResult, GamePackage } from "@runtime/core/types";
import { validateTowerDefensePackage } from "@runtime/templates/tower-defense/validator";
import { goldenFixtures } from "./golden-pack-fixtures";

afterEach(() => {
  setAiProvider(new MockAiProvider());
});

describe("core v1 regression suite", () => {
  it.each(goldenFixtures)("keeps $fixtureId example package schema + semantic validation green", ({ pkg }) => {
    const schemaReport = validateGamePackage(pkg);
    const semanticReport = validateTowerDefensePackage(pkg);

    expect(schemaReport).toEqual({ valid: true, issues: [] });
    expect(semanticReport).toEqual({ valid: true, issues: [] });
  });

  it.each(goldenFixtures)("keeps $fixtureId scenario outputs stable for seed 11", ({ expectedSignals, pkg }) => {
    const result = runScenario(pkg, 11);
    expect(result).toEqual(expectedSignals.scenario);
  });

  it.each(goldenFixtures)("keeps $fixtureId batch metrics stable for rounds=5", ({ expectedSignals, pkg }) => {
    const result = runBatch(pkg, createBatchSeeds(5));
    const expected: BatchResult = {
      seeds: expectedSignals.batch.seeds,
      sampleSize: expectedSignals.batch.sampleSize,
      winRate: expectedSignals.batch.winRate.value,
      avgDuration: expectedSignals.batch.avgDuration.value,
      leakRate: expectedSignals.batch.leakRate.value,
      imbalanceIndex: expectedSignals.batch.imbalanceIndex.value,
      errors: expectedSignals.batch.errors
    };
    expect(result).toEqual(expected);
  });

  it("keeps editor preview path consistent with headless runtime result", () => {
    const project = createProject("tower-defense");
    const previewResult = startPreview(project, 11).runToEnd();
    const packageForHeadless = exportPackage(project);
    const headlessResult = runScenario(packageForHeadless, 11);

    expect(previewResult).toEqual(headlessResult);
  });

  it("keeps AI generate/validate/simulate smoke path deterministic", async () => {
    const pkg = await generateValidateAndRepair("Create a basic lane defense map", "tower-defense");
    const schemaReport = validateGamePackage(pkg);
    const semanticReport = validateTowerDefensePackage(pkg);
    const first = runScenario(pkg, 3);
    const second = runScenario(pkg, 3);

    expect(schemaReport.valid).toBe(true);
    expect(semanticReport.valid).toBe(true);
    expect(second).toEqual(first);
    expect(first).toEqual({
      winner: "enemy",
      durationTicks: 70,
      durationMs: 7000,
      seed: 3,
      metrics: {
        kills: 0,
        leaks: 5,
        damageDealt: 156,
        shotsFired: 18,
        goldEarned: 0
      }
    });
  });

  it("keeps AI repair loop working when first generation is invalid", async () => {
    const invalid = structuredClone(easyPackage as GamePackage);
    invalid.rules.payload.path = [];
    invalid.rules.payload.waves = [];

    let repairCalls = 0;

    const provider: AiProvider = {
      id: "regression-provider",
      async generatePackage() {
        return structuredClone(invalid);
      },
      async repairPackage() {
        repairCalls += 1;
        return structuredClone(easyPackage as GamePackage);
      },
      async optimizePackage(pkg) {
        return pkg;
      }
    };

    setAiProvider(provider);
    const repaired = await generateValidateAndRepair("repair invalid package", "tower-defense");
    const schemaReport = validateGamePackage(repaired);
    const semanticReport = validateTowerDefensePackage(repaired);

    expect(repairCalls).toBe(1);
    expect(schemaReport.valid).toBe(true);
    expect(semanticReport.valid).toBe(true);
  });
});
