import { describe, expect, it } from "vitest";

import { assertGoldenFixturePasses, formatGoldenFailureDiff, validateGoldenFixtureContract, verifyGoldenFixture } from "./golden-pack-harness";
import { goldenFixtures, type GoldenFixture } from "./golden-pack-fixtures";

describe("golden pack regression suite", () => {
  it("keeps fixture inventory metadata contract valid and unique", () => {
    const fixtureIds = new Set<string>();

    for (const fixture of goldenFixtures) {
      expect(validateGoldenFixtureContract(fixture)).toEqual([]);

      const key = `${fixture.templateId}/${fixture.fixtureId}`;
      expect(fixtureIds.has(key)).toBe(false);
      fixtureIds.add(key);
    }
  });

  it.each(goldenFixtures)(
    "keeps $fixtureId deterministic across scenario, batch, and preview parity",
    (fixture) => {
      const result = verifyGoldenFixture(fixture);
      assertGoldenFixturePasses(result);
      expect(result.diffs).toEqual([]);
    }
  );

  it("reports metadata contract issues when required fixture fields drift", () => {
    const invalidFixture = structuredClone(goldenFixtures[0]) as GoldenFixture;
    invalidFixture.fixtureId = "";
    invalidFixture.seedSet.scenario = 0;
    invalidFixture.seedSet.batch = [1, 0];
    invalidFixture.expectedSignals.batch.sampleSize = 99;
    invalidFixture.expectedSignals.batch.seeds = [9, 10];

    const issues = validateGoldenFixtureContract(invalidFixture);

    expect(issues).toEqual(
      expect.arrayContaining([
        "fixtureId must be a non-empty string.",
        "seedSet.scenario must be a positive integer.",
        "seedSet.batch contains invalid seed: 0.",
        "expectedSignals.batch.sampleSize must match seedSet.batch length.",
        "expectedSignals.batch.seeds must match seedSet.batch exactly."
      ])
    );
  });

  it("formats failure diffs with fixture identity, signal, expected, actual, and remediation hint", () => {
    const rendered = formatGoldenFailureDiff({
      templateId: "tower-defense",
      fixtureId: "td-hard",
      signal: "batch.winRate",
      expected: { value: 1, tolerance: 0 },
      actual: 0,
      hint: "Refresh expectedSignals.batch.winRate after approved contract updates."
    });

    expect(rendered).toContain("fixture=tower-defense/td-hard");
    expect(rendered).toContain("signal=batch.winRate");
    expect(rendered).toContain("expected={\"value\":1,\"tolerance\":0}");
    expect(rendered).toContain("actual=0");
    expect(rendered).toContain("hint=Refresh expectedSignals.batch.winRate after approved contract updates.");
  });
});
