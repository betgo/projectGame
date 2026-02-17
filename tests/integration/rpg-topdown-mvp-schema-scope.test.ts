import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const taskPath = path.join(projectRoot, "docs/ai/tasks/T-024-rpg-topdown-mvp-schema.md");

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

describe("T-024 rpg-topdown-mvp-schema scope contract", () => {
  it("defines explicit in-scope and out-of-scope boundaries for RPG topdown schema planning", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const scope = readSection("Scope", taskDoc);

    const expectedInScope = [
      "Define RPG topdown payload contract in `game/schemas/rpg-topdown.schema.json` and wire `game-project.schema.json` + `game-package.schema.json` through template-aware schema branches without breaking existing tower-defense compatibility.",
      "Define MVP-required structural fields for RPG map/entities/rules payloads (for example: walkable map metadata, player/enemy stat blocks, spawn/layout definitions, and tick/combat baseline config) with explicit type/required/bounds constraints.",
      "Define schema ownership boundaries: JSON shape and version compatibility stay in `game/schemas`, runtime semantic invariants remain in template validators/runtime entrypoints, and editor/import flows continue consuming shared validation APIs.",
      "Define sample fixture coverage for RPG schema onboarding (valid package/project fixtures and invalid-state fixtures) with deterministic validation expectations.",
      "Define task-level regression expectations for schema validation paths, compatibility guards, and architecture-boundary preservation before implementation subtasks begin."
    ];

    const expectedOutOfScope = [
      "Implement RPG runtime systems (movement/combat/quest loops), which belongs to `T-025`.",
      "Build editor template-switching UX or RPG-specific inspector workflows, which belongs to `T-026`.",
      "Implement AI multi-template generation/routing workflows, which belongs to `T-027` and `T-028`.",
      "Add asset pipeline, telemetry dashboard, or release automation work planned in `T-029` to `T-031`."
    ];

    for (const item of [...expectedInScope, ...expectedOutOfScope]) {
      expect(scope).toContain(`- ${item}`);
    }
  });

  it("keeps acceptance criteria measurable and aligned with S1-S4 lifecycle", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const acceptanceCriteria = toChecklistLines(readSection("Acceptance Criteria", taskDoc));

    const expectedCriteria = [
      "[S1] Scope and acceptance contract explicitly defines RPG topdown schema boundaries (map/entities/rules), architecture ownership (`game/schemas` vs runtime/editor validators), and out-of-scope constraints for `T-024`.",
      "[S2] Scoped implementation adds RPG topdown schema contract files + wiring and sample fixtures while preserving tower-defense schema compatibility and architecture boundaries.",
      "[S3] Regression tests cover required-field validation, invalid-state rejection, compatibility guards, and RPG fixture pass paths; `pnpm gate:fast` and `pnpm gate:full` pass.",
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
    expect(s1Notes).toContain("map/entities/rules contract boundaries");
    expect(s1Notes).toContain("`game/schemas` for structural/version contracts");
    expect(s1Notes).toContain("`T-025` to `T-031`");
    expect(s1Notes).toContain("`runtime/core`, `game/schemas`, or `ai`");

    expect(s2Notes).toContain("`game/schemas/rpg-topdown.schema.json`");
    expect(s2Notes).toContain("template-aware schema branches");
    expect(s2Notes).toContain("`validateRpgTopdownPayload()`");
    expect(s2Notes).toContain("`game/examples/rpg-topdown-mvp.project.json`");
    expect(s2Notes).toContain("`README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md`");

    expect(s3Notes).toContain("S3 closure");
    expect(s3Notes).toContain("`README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md`");
    expect(s3Notes).toContain("`runtime/core`, `game/schemas`, or `ai`");
    expect(s3Notes).toContain("documentation delta is limited");
    expect(s3Notes).toContain("checklist mismatch risk");

    expect(s4Notes).toContain("`pnpm gate:fast`");
    expect(s4Notes).toContain("`pnpm gate:full`");
    expect(s4Notes).toContain("`pnpm docs:sync-check`");
    expect(s4Notes).toContain("`Issue: 24`");
    expect(s4Notes).toContain("`No missing commits to append.`");
    expect(s4Notes).toContain("`pnpm task:next`");
    expect(s4Notes).toContain("no-commit constraint");
  });

  it("captures risk and rollback coverage including S4 memory finalization controls", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const changeList = readSection("Change List", taskDoc);
    const testEvidence = readSection("Test Evidence", taskDoc);
    const risksAndRollback = readSection("Risks and Rollback", taskDoc);

    expect(changeList).toContain("`game/schemas/rpg-topdown.schema.json`");
    expect(changeList).toContain("`game/schemas/game-project.schema.json`");
    expect(changeList).toContain("`game/schemas/game-package.schema.json`");
    expect(changeList).toContain("`game/examples/rpg-topdown-mvp.project.json`");
    expect(changeList).toContain("`tests/schema/rpg-topdown-schema.test.ts`");
    expect(changeList).toContain("`README.md`");
    expect(changeList).toContain("`docs/ai/ai-loop-status.md`");
    expect(changeList).toContain("`docs/ai/weekly-summary.md`");

    expect(testEvidence).toContain("`pnpm exec eslint tests/integration/rpg-topdown-mvp-schema-scope.test.ts`");
    expect(testEvidence).toContain("`pnpm exec vitest run tests/integration/rpg-topdown-mvp-schema-scope.test.ts`");
    expect(testEvidence).toContain("`pnpm exec vitest run tests/schema/rpg-topdown-schema.test.ts tests/integration/rpg-topdown-mvp-schema-scope.test.ts`");
    expect(testEvidence).toContain("`pnpm gate:fast`");
    expect(testEvidence).toContain("`pnpm gate:full`");
    expect(testEvidence).toContain("`pnpm docs:sync-check`");
    expect(testEvidence).toContain("`bash tools/git-memory/append-commit-log.sh --missing HEAD`");
    expect(testEvidence).toContain("`bash tools/git-memory/update-weekly-summary.sh`");
    expect(testEvidence).toContain("`No missing commits to append.`");
    expect(testEvidence).toContain("Rendered weekly summary:");
    expect(testEvidence).toContain("pass");

    expect(risksAndRollback).toContain("Scope drift can blur boundaries");
    expect(risksAndRollback).toContain("`T-025` to `T-031`");
    expect(risksAndRollback).toContain("Ambiguous RPG payload contract definitions");
    expect(risksAndRollback).toContain("tower-defense validation behavior");
    expect(risksAndRollback).toContain("`runtime/core`, `game/schemas`, or `ai`");
    expect(risksAndRollback).toContain("Task checklist and risk documentation can diverge");
    expect(risksAndRollback).toContain("`docs/ai/ai-loop-status.md`, `docs/ai/weekly-summary.md`");
    expect(risksAndRollback).toContain("pre-S3 task contract/checklist state");
    expect(risksAndRollback).toContain("If only S3 documentation-state updates need rollback");
    expect(risksAndRollback).toContain("If only S4 memory/docs finalization needs rollback");
  });
});
