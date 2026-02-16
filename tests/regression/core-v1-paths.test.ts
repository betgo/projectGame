import { afterEach, describe, expect, it } from "vitest";

import { MockAiProvider } from "@ai/mock-provider";
import { generateValidateAndRepair } from "@ai/pipeline";
import { setAiProvider } from "@ai/provider";
import type { AiProvider } from "@ai/types";
import easyPackage from "@game/examples/td-easy.json";
import hardPackage from "@game/examples/td-hard.json";
import normalPackage from "@game/examples/td-normal.json";
import { validateGamePackage } from "@game/schemas/index";
import { createProject, exportPackage, startPreview } from "@editor/editor/api";
import { createBatchSeeds, runBatch, runScenario } from "@runtime/core/engine";
import type { BatchResult, GamePackage, MatchResult } from "@runtime/core/types";
import { validateTowerDefensePackage } from "@runtime/templates/tower-defense/validator";

type Fixture = {
  name: "easy" | "normal" | "hard";
  pkg: GamePackage;
};

const fixtures: Fixture[] = [
  { name: "easy", pkg: easyPackage as GamePackage },
  { name: "normal", pkg: normalPackage as GamePackage },
  { name: "hard", pkg: hardPackage as GamePackage }
];

const expectedScenarioByFixture: Record<Fixture["name"], MatchResult> = {
  easy: {
    winner: "defender",
    durationTicks: 93,
    durationMs: 9300,
    seed: 11,
    metrics: {
      kills: 5,
      leaks: 3,
      damageDealt: 312,
      shotsFired: 29,
      goldEarned: 25
    }
  },
  normal: {
    winner: "enemy",
    durationTicks: 54,
    durationMs: 5400,
    seed: 11,
    metrics: {
      kills: 0,
      leaks: 4,
      damageDealt: 113,
      shotsFired: 12,
      goldEarned: 0
    }
  },
  hard: {
    winner: "enemy",
    durationTicks: 41,
    durationMs: 4100,
    seed: 11,
    metrics: {
      kills: 0,
      leaks: 3,
      damageDealt: 67,
      shotsFired: 8,
      goldEarned: 0
    }
  }
};

const expectedBatchByFixture: Record<Fixture["name"], BatchResult> = {
  easy: {
    seeds: [1, 2, 3, 4, 5],
    sampleSize: 5,
    winRate: 1,
    avgDuration: 9300,
    leakRate: 3,
    imbalanceIndex: 0.56,
    errors: []
  },
  normal: {
    seeds: [1, 2, 3, 4, 5],
    sampleSize: 5,
    winRate: 0,
    avgDuration: 5400,
    leakRate: 4,
    imbalanceIndex: 0.58,
    errors: []
  },
  hard: {
    seeds: [1, 2, 3, 4, 5],
    sampleSize: 5,
    winRate: 0,
    avgDuration: 4100,
    leakRate: 3,
    imbalanceIndex: 0.56,
    errors: []
  }
};

afterEach(() => {
  setAiProvider(new MockAiProvider());
});

describe("core v1 regression suite", () => {
  it.each(fixtures)("keeps $name example package schema + semantic validation green", ({ pkg }) => {
    const schemaReport = validateGamePackage(pkg);
    const semanticReport = validateTowerDefensePackage(pkg);

    expect(schemaReport).toEqual({ valid: true, issues: [] });
    expect(semanticReport).toEqual({ valid: true, issues: [] });
  });

  it.each(fixtures)("keeps $name scenario outputs stable for seed 11", ({ name, pkg }) => {
    const result = runScenario(pkg, 11);
    expect(result).toEqual(expectedScenarioByFixture[name]);
  });

  it.each(fixtures)("keeps $name batch metrics stable for rounds=5", ({ name, pkg }) => {
    const result = runBatch(pkg, createBatchSeeds(5));
    expect(result).toEqual(expectedBatchByFixture[name]);
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
