import easyPackage from "@game/examples/td-easy.json";
import hardPackage from "@game/examples/td-hard.json";
import normalPackage from "@game/examples/td-normal.json";
import type { GamePackage, MatchResult } from "@runtime/core/types";

export type NumericSignalExpectation = {
  value: number;
  tolerance: number;
};

export type GoldenSeedSet = {
  scenario: number;
  batch: number[];
  preview: number;
};

export type GoldenBatchExpectation = {
  seeds: number[];
  sampleSize: number;
  winRate: NumericSignalExpectation;
  avgDuration: NumericSignalExpectation;
  leakRate: NumericSignalExpectation;
  imbalanceIndex: NumericSignalExpectation;
  errors: string[];
};

export type GoldenExpectedSignals = {
  schemaValid: boolean;
  semanticValid: boolean;
  scenario: MatchResult;
  batch: GoldenBatchExpectation;
  previewParity: MatchResult;
};

export type GoldenFixture = {
  templateId: GamePackage["templateId"];
  fixtureId: string;
  seedSet: GoldenSeedSet;
  expectedSignals: GoldenExpectedSignals;
  pkg: GamePackage;
};

const FLOAT_TOLERANCE = 1e-10;
const SHARED_BATCH_SEEDS = [1, 2, 3, 4, 5];
const SHARED_SEED_SET: GoldenSeedSet = {
  scenario: 11,
  batch: SHARED_BATCH_SEEDS,
  preview: 11
};

const EASY_SCENARIO: MatchResult = {
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
};

const NORMAL_SCENARIO: MatchResult = {
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
};

const HARD_SCENARIO: MatchResult = {
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
};

export const goldenFixtures: GoldenFixture[] = [
  {
    templateId: "tower-defense",
    fixtureId: "td-easy",
    seedSet: SHARED_SEED_SET,
    expectedSignals: {
      schemaValid: true,
      semanticValid: true,
      scenario: EASY_SCENARIO,
      batch: {
        seeds: SHARED_BATCH_SEEDS,
        sampleSize: 5,
        winRate: { value: 1, tolerance: FLOAT_TOLERANCE },
        avgDuration: { value: 9300, tolerance: 0 },
        leakRate: { value: 3, tolerance: FLOAT_TOLERANCE },
        imbalanceIndex: { value: 0.56, tolerance: FLOAT_TOLERANCE },
        errors: []
      },
      previewParity: EASY_SCENARIO
    },
    pkg: easyPackage as GamePackage
  },
  {
    templateId: "tower-defense",
    fixtureId: "td-normal",
    seedSet: SHARED_SEED_SET,
    expectedSignals: {
      schemaValid: true,
      semanticValid: true,
      scenario: NORMAL_SCENARIO,
      batch: {
        seeds: SHARED_BATCH_SEEDS,
        sampleSize: 5,
        winRate: { value: 0, tolerance: FLOAT_TOLERANCE },
        avgDuration: { value: 5400, tolerance: 0 },
        leakRate: { value: 4, tolerance: FLOAT_TOLERANCE },
        imbalanceIndex: { value: 0.58, tolerance: FLOAT_TOLERANCE },
        errors: []
      },
      previewParity: NORMAL_SCENARIO
    },
    pkg: normalPackage as GamePackage
  },
  {
    templateId: "tower-defense",
    fixtureId: "td-hard",
    seedSet: SHARED_SEED_SET,
    expectedSignals: {
      schemaValid: true,
      semanticValid: true,
      scenario: HARD_SCENARIO,
      batch: {
        seeds: SHARED_BATCH_SEEDS,
        sampleSize: 5,
        winRate: { value: 0, tolerance: FLOAT_TOLERANCE },
        avgDuration: { value: 4100, tolerance: 0 },
        leakRate: { value: 3, tolerance: FLOAT_TOLERANCE },
        imbalanceIndex: { value: 0.56, tolerance: FLOAT_TOLERANCE },
        errors: []
      },
      previewParity: {
        winner: "enemy",
        durationTicks: 50,
        durationMs: 5000,
        seed: 11,
        metrics: {
          kills: 0,
          leaks: 4,
          damageDealt: 84,
          shotsFired: 10,
          goldEarned: 0
        }
      }
    },
    pkg: hardPackage as GamePackage
  }
];
