import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const taskPath = path.join(projectRoot, "docs/ai/tasks/T-023-template-sdk-core.md");

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

describe("T-023 template-sdk-core scope contract", () => {
  it("defines explicit in-scope and out-of-scope boundaries for template SDK planning", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const scope = readSection("Scope", taskDoc);

    const expectedInScope = [
      "Define `registerTemplate()` lifecycle contract in `runtime/core/engine.ts`, including deterministic register/get/load behavior for known, unknown, and duplicate `templateId` cases.",
      "Define Template SDK core surface in `runtime/core/types.ts` (`RuntimeTemplate` + hook responsibilities for `validate`, `createWorld`, `step`) with explicit fail-fast expectations when hooks are missing or invalid.",
      "Define validation pipeline ownership boundaries so `game/schemas` handles schema compatibility, template validators handle semantic checks, and registry orchestration stays inside `runtime/core` without cross-layer leakage.",
      "Define required integration hooks for template onboarding across runtime entrypoints (`loadPackage`, `runScenario`, `runBatch`) and editor/import flow (`editor/src/editor/api.ts`) while preserving TD baseline behavior.",
      "Define test contract for SDK onboarding: registry lifecycle guards, unknown-template diagnostics, and TD compatibility regression coverage for existing package fixtures."
    ];

    const expectedOutOfScope = [
      "Full gameplay/system implementation for future templates (for example, RPG combat, quests, AI behaviors).",
      "Editor template-switching UX, template-specific inspector panels, or project migration UX (tracked by `T-026`).",
      "AI multi-template routing/prompt orchestration and cross-template package generation logic (tracked by `T-027`).",
      "Cross-template simulation analytics, delivery tooling, or asset pipeline changes outside SDK core registry/contract boundaries."
    ];

    for (const item of [...expectedInScope, ...expectedOutOfScope]) {
      expect(scope).toContain(`- ${item}`);
    }
  });

  it("keeps acceptance criteria measurable and aligned with S1-S4 lifecycle", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const acceptanceCriteria = toChecklistLines(readSection("Acceptance Criteria", taskDoc));

    const expectedCriteria = [
      "[S1] Scope and acceptance contract explicitly defines template SDK registry lifecycle, hook responsibilities, architecture ownership, and out-of-scope constraints for `T-023`.",
      "[S2] Scoped implementation hardens template registration/load validation contracts and keeps TD template execution fully compatible through SDK entrypoints.",
      "[S3] Regression tests cover registry lifecycle guards, unknown-template diagnostics, and TD compatibility invariants; `pnpm gate:fast` and `pnpm gate:full` pass.",
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
    expect(s1Notes).toContain("registry lifecycle + hook-responsibility contracts");
    expect(s1Notes).toContain("`runtime/core` registry orchestration");
    expect(s1Notes).toContain("`runtime/core`, `game/schemas`, or `ai`");

    expect(s2Notes).toContain("template registry lifecycle");
    expect(s2Notes).toContain("`validateRuntimePackage()`");
    expect(s2Notes).toContain("`editor/src/editor/api.ts`");
    expect(s2Notes).toContain("`tests/integration/template-sdk-core-runtime.test.ts`");
    expect(s2Notes).toContain("`pnpm gate:fast`");
    expect(s2Notes).toContain("`pnpm gate:full`");

    expect(s3Notes).toContain("S3 closure");
    expect(s3Notes).toContain("`README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md`");
    expect(s3Notes).toContain("`runtime/core`, `game/schemas`, or `ai`");
    expect(s3Notes).toContain("documentation delta is limited");
    expect(s3Notes).toContain("documentation-state drift");

    expect(s4Notes).toContain("`pnpm gate:fast`");
    expect(s4Notes).toContain("`pnpm gate:full`");
    expect(s4Notes).toContain("`pnpm docs:sync-check`");
    expect(s4Notes).toContain("`Issue: 23`");
    expect(s4Notes).toContain("`61b1510`");
    expect(s4Notes).toContain("`No missing commits to append.`");
  });

  it("captures risk and rollback coverage for runtime contracts and memory-finalization controls", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const testEvidence = readSection("Test Evidence", taskDoc);
    const risksAndRollback = readSection("Risks and Rollback", taskDoc);
    const changeList = readSection("Change List", taskDoc);

    expect(testEvidence).toContain("`pnpm exec eslint runtime/core/engine.ts runtime/core/types.ts editor/src/editor/api.ts tests/integration/template-sdk-core-runtime.test.ts tests/integration/template-sdk-core-scope.test.ts`");
    expect(testEvidence).toContain("`pnpm exec vitest run tests/integration/template-sdk-core-runtime.test.ts tests/integration/template-sdk-core-scope.test.ts`");
    expect(testEvidence).toContain("`pnpm gate:fast`");
    expect(testEvidence).toContain("`pnpm gate:full`");
    expect(testEvidence).toContain("`pnpm docs:sync-check`");
    expect(testEvidence).toContain("`bash tools/git-memory/append-commit-log.sh --missing HEAD`");
    expect(testEvidence).toContain("`bash tools/git-memory/update-weekly-summary.sh`");
    expect(testEvidence).toContain("`No missing commits to append.`");
    expect(testEvidence).toContain("pass");

    expect(risksAndRollback).toContain("Scope drift can blur boundaries");
    expect(risksAndRollback).toContain("`T-024`, `T-025`, `T-026`, `T-027`");
    expect(risksAndRollback).toContain("duplicate IDs");
    expect(risksAndRollback).toContain("`runtime/core`");
    expect(risksAndRollback).toContain("`runtime/core`, `game/schemas`, `ai`");
    expect(risksAndRollback).toContain("Template SDK contract docs can drift");
    expect(risksAndRollback).toContain("Task checklist and risk documentation can diverge");
    expect(risksAndRollback).toContain("`docs/ai/ai-loop-status.md`, `docs/ai/weekly-summary.md`");
    expect(risksAndRollback).toContain("pre-S3 task contract/checklist state");
    expect(risksAndRollback).toContain("If only S3 documentation-state updates need rollback");
    expect(risksAndRollback).toContain("If only S4 memory/docs finalization needs rollback");

    expect(changeList).toContain("`docs/ai/tasks/T-023-template-sdk-core.md`");
    expect(changeList).toContain("`tests/integration/template-sdk-core-scope.test.ts`");
    expect(changeList).toContain("`runtime/core/engine.ts`");
    expect(changeList).toContain("`runtime/core/types.ts`");
    expect(changeList).toContain("`editor/src/editor/api.ts`");
    expect(changeList).toContain("`tests/integration/template-sdk-core-runtime.test.ts`");
    expect(changeList).toContain("`README.md`");
    expect(changeList).toContain("`docs/ai/README.md`");
    expect(changeList).toContain("`docs/ai/workflows/continuous-loop.md`");
    expect(changeList).toContain("`docs/ai/ai-loop-status.md`");
    expect(changeList).toContain("`docs/ai/commit-log/2026-02.md`");
    expect(changeList).toContain("`docs/ai/weekly-summary.md`");
  });
});
