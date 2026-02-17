import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const taskPath = path.join(projectRoot, "docs/ai/tasks/T-025-rpg-runtime-min-systems.md");

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

describe("T-025 rpg-runtime-min-systems scope contract", () => {
  it("defines explicit in-scope and out-of-scope boundaries for RPG runtime minimum systems", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const scope = readSection("Scope", taskDoc);

    const expectedInScope = [
      "Define minimal RPG runtime system boundaries in `runtime/templates/rpg-topdown` for movement, combat, and quest-lite progression while keeping orchestration in `runtime/core` template entrypoints.",
      "Define deterministic movement contract for walkable-grid traversal, spawn positioning, and blocked-cell handling so identical package + seed inputs replay identically.",
      "Define deterministic combat contract for attack cadence, damage resolution, and entity life-cycle transitions (`alive` -> `defeated`) under tick-based simulation.",
      "Define quest-lite completion contract for MVP objectives (for example, reach-target and defeat-target conditions) with explicit success/failure state transitions for headless execution.",
      "Define regression and boundary expectations for runtime-only delivery, including headless scenario completion checks, seed-replay determinism checks, and no cross-layer leakage into schema/editor/AI ownership."
    ];

    const expectedOutOfScope = [
      "Inventory/economy/dialog trees, equipment systems, or advanced RPG progression mechanics beyond quest-lite MVP closure.",
      "Editor template-switching UX, RPG inspector authoring workflows, or project migration UX (tracked by `T-026`).",
      "AI multi-template generation/routing behavior and cross-template batch orchestration (tracked by `T-027` and `T-028`).",
      "Asset pipeline, playtest dashboard, and release-automation tracks planned in `T-029` to `T-031`."
    ];

    for (const item of [...expectedInScope, ...expectedOutOfScope]) {
      expect(scope).toContain(`- ${item}`);
    }
  });

  it("keeps acceptance criteria measurable and aligned with S1-S4 lifecycle", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const acceptanceCriteria = toChecklistLines(readSection("Acceptance Criteria", taskDoc));

    const expectedCriteria = [
      "[S1] Scope and acceptance contract explicitly defines RPG runtime movement/combat/quest-lite boundaries, deterministic tick expectations, architecture ownership, and out-of-scope limits for `T-025`.",
      "[S2] Scoped implementation delivers minimal RPG runtime systems for movement/combat/quest-lite headless execution through template SDK runtime entrypoints while preserving existing template compatibility.",
      "[S3] Regression tests cover RPG headless completion paths, deterministic seed replay, and boundary invariants; `pnpm gate:fast` and `pnpm gate:full` pass.",
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
    const s1Notes = readSection("S1 Implementation Notes (2026-02-17)", taskDoc);
    const s2Notes = readSection("S2 Implementation Notes (2026-02-17)", taskDoc);
    const s3Notes = readSection("S3 Documentation and Risk Notes (2026-02-17)", taskDoc);
    const s4Notes = readSection("S4 Memory Finalization and Task Closure (2026-02-17)", taskDoc);

    expect(taskDoc).toContain("- Status: Done");
    expect(subtasks).toContain("- [x] [S1] Define scope and acceptance criteria");
    expect(subtasks).toContain("- [x] [S2] Implement scoped code changes and pass fast/full gates");
    expect(subtasks).toContain("- [x] [S3] Update docs and risk notes");
    expect(subtasks).toContain("- [x] [S4] Finalize memory and complete task-level commit");

    expect(s1Notes).toContain("planning-only output");
    expect(s1Notes).toContain("movement/combat/quest-lite runtime contracts");
    expect(s1Notes).toContain("`runtime/templates/rpg-topdown`");
    expect(s1Notes).toContain("`runtime/core`, `game/schemas`, or `ai`");

    expect(s2Notes).toContain("deterministic movement, combat cadence");
    expect(s2Notes).toContain("`runtime/templates/rpg-topdown`");
    expect(s2Notes).toContain("`runtime/core/engine.ts`");
    expect(s2Notes).toContain("`README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md`");

    expect(s3Notes).toContain("S3 closure");
    expect(s3Notes).toContain("`README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md`");
    expect(s3Notes).toContain("`runtime/core`, `game/schemas`, or `ai`");
    expect(s3Notes).toContain("documentation delta is limited");
    expect(s3Notes).toContain("checklist mismatch risk");

    expect(s4Notes).toContain("`pnpm gate:fast`");
    expect(s4Notes).toContain("`pnpm gate:full`");
    expect(s4Notes).toContain("`pnpm docs:sync-check`");
    expect(s4Notes).toContain("`Issue: 25`");
    expect(s4Notes).toContain("`5a36679`");
    expect(s4Notes).toContain("`No missing commits to append.`");
    expect(s4Notes).toContain("`pnpm task:next`");
    expect(s4Notes).toContain("no-commit constraint");
  });

  it("captures risk and rollback coverage including S4 memory finalization controls", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const changeList = readSection("Change List", taskDoc);
    const testEvidence = readSection("Test Evidence", taskDoc);
    const risksAndRollback = readSection("Risks and Rollback", taskDoc);

    expect(changeList).toContain("`runtime/core/types.ts`");
    expect(changeList).toContain("`runtime/core/engine.ts`");
    expect(changeList).toContain("`runtime/templates/rpg-topdown/systems.ts`");
    expect(changeList).toContain("`runtime/templates/rpg-topdown/validator.ts`");
    expect(changeList).toContain("`tests/integration/rpg-runtime-min-systems-runtime.test.ts`");
    expect(changeList).toContain("`README.md`");
    expect(changeList).toContain("`docs/ai/ai-loop-status.md`");
    expect(changeList).toContain("`docs/ai/commit-log/2026-02.md`");
    expect(changeList).toContain("`docs/ai/weekly-summary.md`");

    expect(testEvidence).toContain("`pnpm exec eslint runtime/core/engine.ts runtime/core/types.ts runtime/templates/rpg-topdown/*.ts tests/integration/rpg-runtime-min-systems-runtime.test.ts tests/integration/rpg-runtime-min-systems-scope.test.ts`");
    expect(testEvidence).toContain("`pnpm exec vitest run tests/integration/rpg-runtime-min-systems-runtime.test.ts tests/integration/rpg-runtime-min-systems-scope.test.ts`");
    expect(testEvidence).toContain("`pnpm gate:fast`");
    expect(testEvidence).toContain("`pnpm gate:full`");
    expect(testEvidence).toContain("`pnpm docs:sync-check`");
    expect(testEvidence).toContain("`bash tools/git-memory/append-commit-log.sh --missing HEAD`");
    expect(testEvidence).toContain("`bash tools/git-memory/update-weekly-summary.sh`");
    expect(testEvidence).toContain("5a36679");
    expect(testEvidence).toContain("`No missing commits to append.`");
    expect(testEvidence).toContain("Rendered weekly summary:");
    expect(testEvidence).toContain("pass");

    expect(risksAndRollback).toContain("Scope drift can blur boundaries");
    expect(risksAndRollback).toContain("`T-026` to `T-031`");
    expect(risksAndRollback).toContain("Ownership leakage can occur");
    expect(risksAndRollback).toContain("tick-resolution drift");
    expect(risksAndRollback).toContain("`runtime/core/types.ts`");
    expect(risksAndRollback).toContain("`runtime/templates/rpg-topdown/systems.ts`");
    expect(risksAndRollback).toContain("`docs/ai/ai-loop-status.md`, `docs/ai/commit-log/2026-02.md`, `docs/ai/weekly-summary.md`");
    expect(risksAndRollback).toContain("pre-S3 task contract/checklist state");
    expect(risksAndRollback).toContain("If only S3 documentation-state updates need rollback");
    expect(risksAndRollback).toContain("If only S4 memory/docs finalization needs rollback");
  });
});
