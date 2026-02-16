import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const taskPath = path.join(projectRoot, "docs/ai/tasks/T-022-golden-pack-regression-suite.md");

function readSection(title: string, content: string): string {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`## ${escaped}\\n\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = content.match(pattern);
  if (!match) {
    throw new Error(`missing section: ${title}`);
  }
  return match[1].trim();
}

function toChecklistLines(section: string): string[] {
  return section
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter((line) => line.startsWith("- ["));
}

describe("T-022 golden-pack-regression-suite scope contract", () => {
  it("defines explicit in-scope and out-of-scope boundaries for golden regression planning", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const scope = readSection("Scope", taskDoc);

    const expectedInScope = [
      "Define golden package inventory boundaries for current TD fixtures and future-template onboarding, including required fixture metadata (`templateId`, `fixtureId`, `seedSet`, `expectedSignals`).",
      "Define deterministic replay contract surfaces for `runScenario`, `runBatch`, and editor preview parity so identical package + seed inputs produce stable outcomes and metrics.",
      "Define regression signal set for golden checks, covering schema validity, template-semantic validity, winner/duration outputs, and batch aggregate metrics with explicit tolerance rules.",
      "Define failure-diff contract for regression output so failures always include fixture identity, signal name, expected value, actual value, and remediation hint.",
      "Define architecture ownership boundaries: fixture data + assertions live in `tests/regression`, simulation semantics remain in `runtime/core` + template validators, and no cross-layer leakage into unrelated editor UI flows.",
      "Define maintenance workflow expectations for adding/updating golden fixtures, including review evidence and deterministic baseline refresh rules."
    ];

    const expectedOutOfScope = [
      "Gameplay rebalance, wave/tower mechanic redesign, or runtime rule changes outside regression verification scaffolding.",
      "Large-scale benchmark corpus curation, performance profiling pipelines, or soak/stress testing infra.",
      "Cloud-hosted golden artifact storage, remote snapshot approvals, or CI-service-specific workflow redesign.",
      "Full implementation of non-TD template gameplay systems; this task only defines how future templates plug into the golden regression contract."
    ];

    for (const item of [...expectedInScope, ...expectedOutOfScope]) {
      expect(scope).toContain(`- ${item}`);
    }
  });

  it("keeps acceptance criteria measurable and aligned with S1-S4 lifecycle", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const acceptanceCriteria = toChecklistLines(readSection("Acceptance Criteria", taskDoc));

    const expectedCriteria = [
      "[S1] Scope and acceptance contract explicitly defines golden fixture inventory boundaries, deterministic replay surfaces, regression signal set, architecture ownership, and out-of-scope limits for `T-022`.",
      "[S2] Scoped implementation delivers golden regression harness coverage for TD fixtures with deterministic checks across scenario, batch, and preview-parity signals plus actionable failure diffs.",
      "[S3] Regression tests validate fixture contract parsing, deterministic signal assertions, and failure-diff readability; `pnpm gate:fast` and `pnpm gate:full` pass.",
      "[S4] If contract-level files change (`runtime/core`, `game/schemas`, `ai`), synchronize `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop with updated risk/rollback notes."
    ];

    expect(acceptanceCriteria).toHaveLength(expectedCriteria.length);
    for (const criterion of expectedCriteria) {
      expect(acceptanceCriteria.some((line) => line.endsWith(criterion))).toBe(true);
    }

    expect(acceptanceCriteria[0]?.startsWith("- [x] [S1]")).toBe(true);
    expect(acceptanceCriteria[1]?.startsWith("- [x] [S2]")).toBe(true);
    expect(acceptanceCriteria[2]?.startsWith("- [x] [S3]")).toBe(true);
    expect(acceptanceCriteria[3]?.startsWith("- [x] [S4]")).toBe(true);
  });

  it("marks S1-S4 closure state and records planning, implementation, docs, and memory notes", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const subtasks = toChecklistLines(readSection("Subtasks", taskDoc));
    const s1Notes = readSection("S1 Implementation Notes (2026-02-16)", taskDoc);
    const s2Notes = readSection("S2 Implementation Notes (2026-02-16)", taskDoc);
    const s3Notes = readSection("S3 Documentation and Risk Notes (2026-02-16)", taskDoc);
    const s4Notes = readSection("S4 Memory Finalization and Task Closure (2026-02-16)", taskDoc);

    expect(taskDoc).toContain("- Status: Done");
    expect(subtasks).toContain("- [x] [S1] Define scope and acceptance criteria");
    expect(subtasks).toContain("- [x] [S2] Implement scoped code changes and pass fast/full gates");
    expect(subtasks).toContain("- [x] [S3] Update docs and risk notes");
    expect(subtasks).toContain("- [x] [S4] Finalize memory and complete task-level commit");

    expect(s1Notes).toContain("planning-only output");
    expect(s1Notes).toContain("fixture + signal taxonomy");
    expect(s1Notes).toContain("`tests/regression`");
    expect(s1Notes).toContain("`runtime/core` and template-validator simulation semantics");
    expect(s1Notes).toContain("`runtime/core`, `game/schemas`, or `ai`");

    expect(s2Notes).toContain("golden fixture inventory");
    expect(s2Notes).toContain("`templateId`, `fixtureId`, `seedSet`, `expectedSignals`");
    expect(s2Notes).toContain("`tests/regression/golden-pack-harness.ts`");
    expect(s2Notes).toContain("`runScenario`, `runBatch`, preview parity");
    expect(s2Notes).toContain("no behavior changes in `runtime/core`, `game/schemas`, or `ai`");

    expect(s3Notes).toContain("S3 closure");
    expect(s3Notes).toContain("`tests/regression`");
    expect(s3Notes).toContain("`runtime/core` and template validators");
    expect(s3Notes).toContain("`runtime/core`, `game/schemas`, or `ai`");
    expect(s3Notes).toContain("require no sync delta");
    expect(s3Notes).toContain("documentation-state drift");

    expect(s4Notes).toContain("`pnpm gate:fast`");
    expect(s4Notes).toContain("`pnpm gate:full`");
    expect(s4Notes).toContain("`pnpm docs:sync-check`");
    expect(s4Notes).toContain("`Issue: 22`");
    expect(s4Notes).toContain("`f9cc712`");
    expect(s4Notes).toContain("`No missing commits to append.`");
  });

  it("captures risk and rollback coverage including S4 memory finalization controls", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const risksAndRollback = readSection("Risks and Rollback", taskDoc);
    const changeList = readSection("Change List", taskDoc);

    expect(risksAndRollback).toContain("Scope drift can blur boundaries");
    expect(risksAndRollback).toContain("`T-022`");
    expect(risksAndRollback).toContain("flaky assertions");
    expect(risksAndRollback).toContain("`runtime/core`");
    expect(risksAndRollback).toContain("`game/schemas`, `ai`");
    expect(risksAndRollback).toContain("preview parity assertions");
    expect(risksAndRollback).toContain("Task checklist and risk documentation can diverge");
    expect(risksAndRollback).toContain("`docs/ai/ai-loop-status.md`, `docs/ai/weekly-summary.md`");
    expect(risksAndRollback).toContain("`tests/regression/golden-pack-fixtures.ts`");
    expect(risksAndRollback).toContain("`tests/regression/golden-pack-harness.ts`");
    expect(risksAndRollback).toContain("pre-S3 task contract/checklist state");
    expect(risksAndRollback).toContain("If only S4 memory/docs finalization needs rollback");

    expect(changeList).toContain("`docs/ai/tasks/T-022-golden-pack-regression-suite.md`");
    expect(changeList).toContain("`tests/integration/golden-pack-regression-scope.test.ts`");
    expect(changeList).toContain("`tests/regression/golden-pack-fixtures.ts`");
    expect(changeList).toContain("`tests/regression/golden-pack-harness.ts`");
    expect(changeList).toContain("`tests/regression/golden-pack-regression.test.ts`");
    expect(changeList).toContain("`tests/regression/core-v1-paths.test.ts`");
    expect(changeList).toContain("`docs/ai/ai-loop-status.md`");
    expect(changeList).toContain("`docs/ai/commit-log/2026-02.md`");
    expect(changeList).toContain("`docs/ai/weekly-summary.md`");
  });
});
