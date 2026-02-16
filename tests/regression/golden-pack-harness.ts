import { isDeepStrictEqual } from "node:util";

import { exportPackage, startPreview } from "@editor/editor/api";
import { validateGamePackage } from "@game/schemas/index";
import { runBatch, runScenario } from "@runtime/core/engine";
import type { GamePackage, GameProject } from "@runtime/core/types";
import { validateTowerDefensePackage } from "@runtime/templates/tower-defense/validator";

import type { GoldenFixture, NumericSignalExpectation } from "./golden-pack-fixtures";

export type GoldenFailureDiff = {
  templateId: string;
  fixtureId: string;
  signal: string;
  expected: unknown;
  actual: unknown;
  hint: string;
};

export type GoldenVerificationResult = {
  templateId: string;
  fixtureId: string;
  diffs: GoldenFailureDiff[];
};

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

function pushDiff(
  diffs: GoldenFailureDiff[],
  fixture: Pick<GoldenFixture, "templateId" | "fixtureId">,
  signal: string,
  expected: unknown,
  actual: unknown,
  hint: string
): void {
  diffs.push({
    templateId: fixture.templateId,
    fixtureId: fixture.fixtureId,
    signal,
    expected,
    actual,
    hint
  });
}

function pushObjectDiff(
  diffs: GoldenFailureDiff[],
  fixture: Pick<GoldenFixture, "templateId" | "fixtureId">,
  signal: string,
  expected: unknown,
  actual: unknown,
  hint: string
): void {
  if (!isDeepStrictEqual(actual, expected)) {
    pushDiff(diffs, fixture, signal, expected, actual, hint);
  }
}

function pushNumberDiff(
  diffs: GoldenFailureDiff[],
  fixture: Pick<GoldenFixture, "templateId" | "fixtureId">,
  signal: string,
  expected: NumericSignalExpectation,
  actual: number,
  hint: string
): void {
  if (Math.abs(expected.value - actual) > expected.tolerance) {
    pushDiff(
      diffs,
      fixture,
      signal,
      { value: expected.value, tolerance: expected.tolerance },
      actual,
      hint
    );
  }
}

function toProjectFromPackage(pkg: GamePackage, fixtureId: string): GameProject {
  return {
    meta: {
      name: `golden-${fixtureId}`,
      version: pkg.version
    },
    templateId: pkg.templateId,
    map: cloneValue(pkg.map),
    templatePayload: cloneValue(pkg.rules.payload),
    editorState: {
      selectedTool: "path",
      speed: 1
    }
  };
}

export function validateGoldenFixtureContract(fixture: GoldenFixture): string[] {
  const issues: string[] = [];
  const { templateId, fixtureId, seedSet, expectedSignals } = fixture;

  if (!templateId.trim()) {
    issues.push("templateId must be a non-empty string.");
  }
  if (!fixtureId.trim()) {
    issues.push("fixtureId must be a non-empty string.");
  }
  if (!Number.isInteger(seedSet.scenario) || seedSet.scenario <= 0) {
    issues.push("seedSet.scenario must be a positive integer.");
  }
  if (!Number.isInteger(seedSet.preview) || seedSet.preview <= 0) {
    issues.push("seedSet.preview must be a positive integer.");
  }
  if (!Array.isArray(seedSet.batch) || seedSet.batch.length === 0) {
    issues.push("seedSet.batch must contain at least one seed.");
  } else {
    const invalidBatchSeed = seedSet.batch.find((seed) => !Number.isInteger(seed) || seed <= 0);
    if (invalidBatchSeed !== undefined) {
      issues.push(`seedSet.batch contains invalid seed: ${invalidBatchSeed}.`);
    }
  }

  if (expectedSignals.batch.sampleSize !== seedSet.batch.length) {
    issues.push("expectedSignals.batch.sampleSize must match seedSet.batch length.");
  }
  if (!isDeepStrictEqual(expectedSignals.batch.seeds, seedSet.batch)) {
    issues.push("expectedSignals.batch.seeds must match seedSet.batch exactly.");
  }
  if (expectedSignals.scenario.seed !== seedSet.scenario) {
    issues.push("expectedSignals.scenario.seed must match seedSet.scenario.");
  }
  if (expectedSignals.previewParity.seed !== seedSet.preview) {
    issues.push("expectedSignals.previewParity.seed must match seedSet.preview.");
  }

  return issues;
}

export function verifyGoldenFixture(fixture: GoldenFixture): GoldenVerificationResult {
  const diffs: GoldenFailureDiff[] = [];
  const contractIssues = validateGoldenFixtureContract(fixture);
  for (const issue of contractIssues) {
    pushDiff(
      diffs,
      fixture,
      "fixture.contract",
      "valid fixture metadata",
      issue,
      "Populate templateId, fixtureId, seedSet, and expectedSignals with deterministic values."
    );
  }
  if (contractIssues.length > 0) {
    return {
      templateId: fixture.templateId,
      fixtureId: fixture.fixtureId,
      diffs
    };
  }

  const packageClone = cloneValue(fixture.pkg);
  pushObjectDiff(
    diffs,
    fixture,
    "fixture.templateId",
    fixture.templateId,
    packageClone.templateId,
    "Set fixture.templateId to the same template as package.templateId."
  );

  const schemaReport = validateGamePackage(packageClone);
  pushObjectDiff(
    diffs,
    fixture,
    "schema.valid",
    fixture.expectedSignals.schemaValid,
    schemaReport.valid,
    "Run schema validation and update fixture payload or expected schema signal."
  );

  const semanticReport = validateTowerDefensePackage(packageClone);
  pushObjectDiff(
    diffs,
    fixture,
    "semantic.valid",
    fixture.expectedSignals.semanticValid,
    semanticReport.valid,
    "Run template semantic validation and refresh fixture payload or expected semantic signal."
  );

  if (!schemaReport.valid || !semanticReport.valid) {
    return {
      templateId: fixture.templateId,
      fixtureId: fixture.fixtureId,
      diffs
    };
  }

  const scenarioSeed = fixture.seedSet.scenario;
  const scenarioFirst = runScenario(cloneValue(packageClone), scenarioSeed);
  const scenarioSecond = runScenario(cloneValue(packageClone), scenarioSeed);
  pushObjectDiff(
    diffs,
    fixture,
    "scenario.deterministic",
    scenarioFirst,
    scenarioSecond,
    "Scenario replay must be deterministic for identical package + seed."
  );
  pushObjectDiff(
    diffs,
    fixture,
    "scenario.expected",
    fixture.expectedSignals.scenario,
    scenarioFirst,
    "Refresh expectedSignals.scenario only after intentional simulation contract changes."
  );

  const batchSeeds = [...fixture.seedSet.batch];
  const batchFirst = runBatch(cloneValue(packageClone), batchSeeds);
  const batchSecond = runBatch(cloneValue(packageClone), batchSeeds);
  pushObjectDiff(
    diffs,
    fixture,
    "batch.deterministic",
    batchFirst,
    batchSecond,
    "Batch replay must be deterministic for identical package + seed set."
  );
  pushObjectDiff(
    diffs,
    fixture,
    "batch.seeds",
    fixture.expectedSignals.batch.seeds,
    batchFirst.seeds,
    "Keep expectedSignals.batch.seeds aligned with seedSet.batch."
  );
  pushObjectDiff(
    diffs,
    fixture,
    "batch.sampleSize",
    fixture.expectedSignals.batch.sampleSize,
    batchFirst.sampleSize,
    "Set expectedSignals.batch.sampleSize to the number of deterministic batch seeds."
  );
  pushNumberDiff(
    diffs,
    fixture,
    "batch.winRate",
    fixture.expectedSignals.batch.winRate,
    batchFirst.winRate,
    "Refresh expectedSignals.batch.winRate or tolerance after approved gameplay contract updates."
  );
  pushNumberDiff(
    diffs,
    fixture,
    "batch.avgDuration",
    fixture.expectedSignals.batch.avgDuration,
    batchFirst.avgDuration,
    "Refresh expectedSignals.batch.avgDuration after intentional timing contract updates."
  );
  pushNumberDiff(
    diffs,
    fixture,
    "batch.leakRate",
    fixture.expectedSignals.batch.leakRate,
    batchFirst.leakRate,
    "Refresh expectedSignals.batch.leakRate after approved gameplay contract updates."
  );
  pushNumberDiff(
    diffs,
    fixture,
    "batch.imbalanceIndex",
    fixture.expectedSignals.batch.imbalanceIndex,
    batchFirst.imbalanceIndex,
    "Refresh expectedSignals.batch.imbalanceIndex after approved balance-index formula changes."
  );
  pushObjectDiff(
    diffs,
    fixture,
    "batch.errors",
    fixture.expectedSignals.batch.errors,
    batchFirst.errors,
    "Fix deterministic runtime errors before updating expectedSignals.batch.errors."
  );

  const previewSeed = fixture.seedSet.preview;
  const previewProject = toProjectFromPackage(packageClone, fixture.fixtureId);
  const exportedPackage = exportPackage(previewProject);

  const previewFirst = startPreview(cloneValue(previewProject), previewSeed).runToEnd();
  const previewSecond = startPreview(cloneValue(previewProject), previewSeed).runToEnd();
  const previewHeadless = runScenario(cloneValue(exportedPackage), previewSeed);
  pushObjectDiff(
    diffs,
    fixture,
    "preview.deterministic",
    previewFirst,
    previewSecond,
    "Preview replay must be deterministic for identical project + seed."
  );
  pushObjectDiff(
    diffs,
    fixture,
    "preview.parity",
    previewHeadless,
    previewFirst,
    "Keep editor preview parity with runScenario for identical exported package + seed."
  );
  pushObjectDiff(
    diffs,
    fixture,
    "preview.expected",
    fixture.expectedSignals.previewParity,
    previewFirst,
    "Refresh expectedSignals.previewParity only after approved preview/runtime contract changes."
  );

  return {
    templateId: fixture.templateId,
    fixtureId: fixture.fixtureId,
    diffs
  };
}

function toInlineJson(value: unknown): string {
  return JSON.stringify(value);
}

export function formatGoldenFailureDiff(diff: GoldenFailureDiff): string {
  return [
    `fixture=${diff.templateId}/${diff.fixtureId}`,
    `signal=${diff.signal}`,
    `expected=${toInlineJson(diff.expected)}`,
    `actual=${toInlineJson(diff.actual)}`,
    `hint=${diff.hint}`
  ].join(" | ");
}

export function assertGoldenFixturePasses(result: GoldenVerificationResult): void {
  if (result.diffs.length === 0) {
    return;
  }

  const renderedDiffs = result.diffs.map((diff) => `- ${formatGoldenFailureDiff(diff)}`).join("\n");
  throw new Error(`golden fixture regression failed (${result.templateId}/${result.fixtureId})\n${renderedDiffs}`);
}
