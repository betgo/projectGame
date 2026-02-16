import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const taskPath = path.join(projectRoot, "docs/ai/tasks/T-019-map-editing-ergonomics.md");

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

describe("T-019 map-editing-ergonomics scope and docs contract", () => {
  it("defines in-scope and out-of-scope boundaries for map ergonomics", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const scope = readSection("Scope", taskDoc);

    const expectedInScope = [
      "Define map-brush ergonomics contract for `editor/src/editor/components/MapCanvas.tsx` and `editor/src/editor/operations.ts`, including predictable paint/erase/path behavior for high-frequency edits.",
      "Define placement-precision and selection-feedback expectations so cell targeting remains deterministic under repeated interactions.",
      "Define undo-friendly editing constraints by requiring operation-level idempotence and clear, reversible map-cell transitions in editor state.",
      "Define import/export compatibility guardrails so map ergonomics changes do not alter `GameProject`/`GamePackage` data contract semantics.",
      "Keep implementation boundaries inside `editor/` interaction and state flow; preserve `runtime/core` simulation ownership and avoid cross-layer leakage."
    ];

    const expectedOutOfScope = [
      "Runtime simulation rebalance, enemy/tower mechanics redesign, or deterministic-engine behavior changes.",
      "Schema-version migration strategy and import/export diagnostics redesign (tracked by `T-020` and `T-021`).",
      "Render-camera control redesign and performance baseline work (already covered by `T-015` and `T-016`).",
      "Collaborative multi-user map editing, cloud sync, or account-based authoring workflows."
    ];

    for (const item of [...expectedInScope, ...expectedOutOfScope]) {
      expect(scope).toContain(`- ${item}`);
    }
  });

  it("keeps acceptance criteria measurable with S1-S4 completed", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const acceptanceCriteria = toChecklistLines(readSection("Acceptance Criteria", taskDoc));

    const expectedCriteria = [
      "[S1] Scope and acceptance contract explicitly defines map-brush ergonomics boundaries, precision/undo expectations, architecture constraints, and out-of-scope limits for `T-019`.",
      "[S2] Map editing implementation adds ergonomic paint/erase/path actions with deterministic selection and placement behavior while staying inside `editor/` boundaries.",
      "[S3] Regression tests cover repeated interaction stability, precision placement paths, and import/export compatibility safeguards; `pnpm gate:fast` and `pnpm gate:full` pass.",
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

  it("marks subtask checklist and implementation notes for S1-S4", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const subtasks = toChecklistLines(readSection("Subtasks", taskDoc));
    const s1Notes = readSection("S1 Implementation Notes (2026-02-16)", taskDoc);
    const s3Notes = readSection("S3 Documentation and Risk Notes (2026-02-16)", taskDoc);
    const s4Notes = readSection("S4 Memory Finalization and Task Closure (2026-02-16)", taskDoc);

    expect(taskDoc).toContain("- Status: Done");
    expect(subtasks).toContain("- [x] [S1] Define scope and acceptance criteria");
    expect(subtasks).toContain("- [x] [S2] Implement scoped code changes and pass fast/full gates");
    expect(subtasks).toContain("- [x] [S3] Update docs and risk notes");
    expect(subtasks).toContain("- [x] [S4] Finalize memory and complete task-level commit");

    expect(s1Notes).toContain("planning-only scope");
    expect(s1Notes).toContain("`S1-S4`");
    expect(s1Notes).toContain("`editor/`");
    expect(s1Notes).toContain("`runtime/core`");

    expect(s3Notes).toContain("S3 closure evidence");
    expect(s3Notes).toContain("`runtime/core`, `game/schemas`, `ai`");
    expect(s3Notes).toContain("require no sync delta");

    expect(s4Notes).toContain("`pnpm gate:fast`");
    expect(s4Notes).toContain("`pnpm gate:full`");
    expect(s4Notes).toContain("`pnpm docs:sync-check`");
    expect(s4Notes).toContain("`Issue: 19`");
    expect(s4Notes).toContain("`4dd0b07`");
    expect(s4Notes).toContain("`No missing commits to append.`");
  });

  it("records S1 risk and rollback baseline", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const risksAndRollback = readSection("Risks and Rollback", taskDoc);

    expect(risksAndRollback).toContain("Scope drift may mix map-editing ergonomics delivery");
    expect(risksAndRollback).toContain("`T-020`");
    expect(risksAndRollback).toContain("`T-021`");
    expect(risksAndRollback).toContain("`editor/src/editor/operations.ts`");
    expect(risksAndRollback).toContain("accessibility or keyboard flow");
    expect(risksAndRollback).toContain("documentation can drift from real closure state");
    expect(risksAndRollback).toContain("`runtime/core`, `game/schemas`, or `ai`");
    expect(risksAndRollback).toContain("`docs/ai/tasks/T-019-map-editing-ergonomics.md`");
    expect(risksAndRollback).toContain("`tests/integration/map-editing-ergonomics-scope.test.ts`");
  });
});
