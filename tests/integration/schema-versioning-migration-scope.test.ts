import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const taskPath = path.join(projectRoot, "docs/ai/tasks/T-020-schema-versioning-and-migration-lite.md");

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

describe("T-020 schema-versioning-and-migration-lite scope contract", () => {
  it("defines explicit in-scope and out-of-scope boundaries", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const scope = readSection("Scope", taskDoc);

    const expectedInScope = [
      "Define an explicit schema-version contract for `GameProject.meta.version` and `GamePackage.version`, including major/minor compatibility expectations and fail-fast behavior for unsupported versions.",
      "Define bump rules for compatible vs non-compatible schema changes so future tasks can classify patch/minor/major evolution consistently.",
      "Define a minimal migration window that only supports one adjacent minor step (for example, `0.1.x -> 0.2.x`) with deterministic one-way upgrade semantics.",
      "Define migration entrypoint boundaries across `game/schemas`, `editor/src/editor/api.ts`, and `runtime/core/engine.ts` so load/export paths remain consistent without cross-layer leakage.",
      "Define regression expectations for version parsing, compatibility checks, migration success paths, and unsupported-version diagnostics."
    ];
    const expectedOutOfScope = [
      "Long-term multi-major migration orchestration or chained migrations across multiple historical versions.",
      "Automatic downgrade support (`new -> old`) or bidirectional migration graph management.",
      "Cross-template schema conversion (for example, TD -> RPG) or template onboarding redesign.",
      "Import/export diagnostics redesign beyond schema-version compatibility checks (tracked separately by `T-021`)."
    ];

    for (const item of [...expectedInScope, ...expectedOutOfScope]) {
      expect(scope).toContain(`- ${item}`);
    }
  });

  it("keeps acceptance criteria measurable and aligned to S1-S4 lifecycle", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const acceptanceCriteria = toChecklistLines(readSection("Acceptance Criteria", taskDoc));

    const expectedCriteria = [
      "[S1] Scope and acceptance contract explicitly defines schema-version compatibility boundaries, one-minor-window migration limits, architecture ownership, and out-of-scope constraints for `T-020`.",
      "[S2] Scoped implementation introduces deterministic version parsing and migration helpers for one minor window while preserving existing architecture boundaries (`runtime/core`, `game/schemas`, `editor` integration).",
      "[S3] Regression tests cover supported legacy load/migrate paths, unsupported-version fail-fast diagnostics, and version edge cases; `pnpm gate:fast` and `pnpm gate:full` pass.",
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

    expect(s1Notes).toContain("planning-only");
    expect(s1Notes).toContain("one-minor-window");
    expect(s1Notes).toContain("`game/schemas` + `runtime/core` + `editor`");
    expect(s1Notes).toContain("`runtime/core`, `game/schemas`, or `ai`");

    expect(s2Notes).toContain("strict semver parsing");
    expect(s2Notes).toContain("`0.1.x -> 0.2.0`");
    expect(s2Notes).toContain("`editor/src/editor/api.ts`");
    expect(s2Notes).toContain("`runtime/core/engine.ts`");
    expect(s2Notes).toContain("`README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md`");

    expect(s3Notes).toContain("S3 closure");
    expect(s3Notes).toContain("`README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md`");
    expect(s3Notes).toContain("`runtime/core`, `game/schemas`, `ai`");
    expect(s3Notes).toContain("architecture boundaries remain intact");

    expect(s4Notes).toContain("`pnpm gate:fast`");
    expect(s4Notes).toContain("`pnpm gate:full`");
    expect(s4Notes).toContain("`pnpm docs:sync-check`");
    expect(s4Notes).toContain("`Issue: 20`");
    expect(s4Notes).toContain("`4c86e79`");
    expect(s4Notes).toContain("`No missing commits to append.`");
  });

  it("captures risk and rollback coverage including S4 memory finalization controls", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const risksAndRollback = readSection("Risks and Rollback", taskDoc);
    const changeList = readSection("Change List", taskDoc);

    expect(risksAndRollback).toContain("Scope drift");
    expect(risksAndRollback).toContain("`T-020`");
    expect(risksAndRollback).toContain("`T-021`");
    expect(risksAndRollback).toContain("Ambiguous version-bump rules");
    expect(risksAndRollback).toContain("Schema-version contract docs can drift");
    expect(risksAndRollback).toContain("`docs/ai/ai-loop-status.md`, `docs/ai/weekly-summary.md`");
    expect(risksAndRollback).toContain("`runtime/core`, `game/schemas`, or `ai`");
    expect(risksAndRollback).toContain("`docs/ai/tasks/T-020-schema-versioning-and-migration-lite.md`");
    expect(risksAndRollback).toContain("`tests/integration/schema-versioning-migration-scope.test.ts`");
    expect(risksAndRollback).toContain("`docs/ai/commit-log/2026-02.md`");

    expect(changeList).toContain("`docs/ai/tasks/T-020-schema-versioning-and-migration-lite.md`");
    expect(changeList).toContain("`tests/integration/schema-versioning-migration-scope.test.ts`");
    expect(changeList).toContain("`game/schemas/index.ts`");
    expect(changeList).toContain("`runtime/core/engine.ts`");
    expect(changeList).toContain("`editor/src/editor/api.ts`");
    expect(changeList).toContain("`tests/schema/schema-versioning.test.ts`");
    expect(changeList).toContain("`tests/integration/schema-versioning-migration.test.ts`");
    expect(changeList).toContain("`docs/ai/ai-loop-status.md`");
    expect(changeList).toContain("`docs/ai/commit-log/2026-02.md`");
    expect(changeList).toContain("`docs/ai/weekly-summary.md`");
  });
});
