import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const taskPath = path.join(projectRoot, "docs/ai/tasks/T-021-import-export-diagnostics.md");

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

describe("T-021 import-export-diagnostics scope contract", () => {
  it("defines explicit in-scope and out-of-scope boundaries for diagnostics", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const scope = readSection("Scope", taskDoc);

    const expectedInScope = [
      "Define diagnostics coverage boundaries for malformed JSON parse failures, schema-validation failures, and semantic-validation failures so import errors can be triaged deterministically.",
      "Define a structured diagnostics contract (`code`, `path`, `hint`, `severity`, `source`) for import/export operations so callers receive actionable field-level feedback.",
      "Define architecture ownership boundaries: diagnostics normalization in `editor/src/editor/api.ts`, validation-source ownership in `game/schemas`, and no cross-layer leakage into `runtime/core` behavior.",
      "Define export-contract constraints that preserve deterministic, schema-valid `GamePackage` output for identical `GameProject` input.",
      "Define regression-test expectations for top import/export failure scenarios, including malformed JSON, missing required fields, invalid enum-like values, and semantic payload mismatches."
    ];

    const expectedOutOfScope = [
      "Schema-version migration-window logic or compatibility-policy redesign (already covered by `T-020`).",
      "New gameplay mechanics, runtime balance tuning, or renderer behavior changes unrelated to import/export diagnostics.",
      "Template conversion workflows (for example, TD -> RPG) and cross-template migration automation.",
      "Cloud sync, remote package registry, or account-scoped import/export workflows."
    ];

    for (const item of [...expectedInScope, ...expectedOutOfScope]) {
      expect(scope).toContain(`- ${item}`);
    }
  });

  it("keeps acceptance criteria measurable and aligned with S1-S4 lifecycle", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const acceptanceCriteria = toChecklistLines(readSection("Acceptance Criteria", taskDoc));

    const expectedCriteria = [
      "[S1] Scope and acceptance contract explicitly defines import/export diagnostics taxonomy, structured error payload expectations, architecture boundaries, and out-of-scope limits for `T-021`.",
      "[S2] Scoped implementation introduces actionable diagnostics (`code` + `path` + `hint`) for malformed JSON/schema/semantic import failures while preserving deterministic export behavior.",
      "[S3] Regression tests cover top import/export failure scenarios and deterministic export invariants; `pnpm gate:fast` and `pnpm gate:full` pass.",
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
    expect(s1Notes).toContain("parse/schema/semantic failure classes");
    expect(s1Notes).toContain("`editor/src/editor/api.ts` + `game/schemas` + `runtime/core`");
    expect(s1Notes).toContain("`runtime/core`, `game/schemas`, or `ai`");

    expect(s2Notes).toContain("structured import/export diagnostics primitives");
    expect(s2Notes).toContain("`exportPackageWithDiagnostics`");
    expect(s2Notes).toContain("`code` generation");
    expect(s2Notes).toContain("`game/schemas` and template validators");
    expect(s2Notes).toContain("`runtime/core`");

    expect(s3Notes).toContain("S3 closure");
    expect(s3Notes).toContain("`editor/src/editor/api.ts`");
    expect(s3Notes).toContain("`runtime/core`, `game/schemas`, or `ai`");
    expect(s3Notes).toContain("require no sync delta");
    expect(s3Notes).toContain("documentation-state drift");

    expect(s4Notes).toContain("`pnpm gate:fast`");
    expect(s4Notes).toContain("`pnpm gate:full`");
    expect(s4Notes).toContain("`pnpm docs:sync-check`");
    expect(s4Notes).toContain("`Issue: 21`");
    expect(s4Notes).toContain("`c643763`");
    expect(s4Notes).toContain("`No missing commits to append.`");
  });

  it("captures risk and rollback coverage for diagnostics and memory-finalization controls", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const risksAndRollback = readSection("Risks and Rollback", taskDoc);
    const changeList = readSection("Change List", taskDoc);

    expect(risksAndRollback).toContain("Scope drift can blur boundaries");
    expect(risksAndRollback).toContain("`T-021`");
    expect(risksAndRollback).toContain("`T-020`");
    expect(risksAndRollback).toContain("Diagnostics classification or path-normalization drift");
    expect(risksAndRollback).toContain("Import/export diagnostics contracts can diverge");
    expect(risksAndRollback).toContain("cross layers");
    expect(risksAndRollback).toContain("deterministic export expectations");
    expect(risksAndRollback).toContain("`docs/ai/ai-loop-status.md`, `docs/ai/weekly-summary.md`");
    expect(risksAndRollback).toContain("`runtime/core`, `game/schemas`, `ai`");
    expect(risksAndRollback).toContain("`docs/ai/tasks/T-021-import-export-diagnostics.md`");
    expect(risksAndRollback).toContain("`tests/integration/import-export-diagnostics-scope.test.ts`");
    expect(risksAndRollback).toContain("`editor/src/editor/api.ts`");
    expect(risksAndRollback).toContain("`tests/integration/import-export-diagnostics.test.ts`");
    expect(risksAndRollback).toContain("`docs/ai/commit-log/2026-02.md`");

    expect(changeList).toContain("`editor/src/editor/api.ts`");
    expect(changeList).toContain("`tests/integration/import-export-diagnostics.test.ts`");
    expect(changeList).toContain("`docs/ai/tasks/T-021-import-export-diagnostics.md`");
    expect(changeList).toContain("`tests/integration/import-export-diagnostics-scope.test.ts`");
    expect(changeList).toContain("`docs/ai/ai-loop-status.md`");
    expect(changeList).toContain("`docs/ai/commit-log/2026-02.md`");
    expect(changeList).toContain("`docs/ai/weekly-summary.md`");
  });
});
