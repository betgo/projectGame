import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const taskPath = path.join(projectRoot, "docs/ai/tasks/T-026-editor-template-switching.md");

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

describe("T-026 editor-template-switching scope contract", () => {
  it("defines explicit in-scope and out-of-scope boundaries for editor template switching", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const scope = readSection("Scope", taskDoc);

    const expectedInScope = [
      "Define template-switching contract in editor state and operations (`editor/src/editor/store.ts`, `editor/src/editor/operations.ts`) so project `templateId` changes are deterministic and traceable.",
      "Define template-aware payload panel routing contract in `editor/src/app/App.tsx` + `editor/src/editor/inspector-form.ts`, including how TD/RPG-specific sections are shown or hidden.",
      "Define compatibility-guard contract for template switching in `editor/src/editor/api.ts` and editor runtime-validation flow, including warning surfaces for lossy or incompatible fields before mutation.",
      "Define import/export safety boundary so switching templates cannot silently corrupt persisted `GameProject`/`GamePackage` shape across `game/schemas` and runtime validators.",
      "Define regression-test contract for switch workflow coverage, including TD -> RPG, RPG -> TD, cancellation path, and save/export integrity checks."
    ];

    const expectedOutOfScope = [
      "Live migration wizard or auto-field migration for every template combination.",
      "New RPG gameplay/runtime systems, combat balancing, or quest logic changes (owned by `T-025` runtime scope).",
      "AI prompt-routing or multi-template package-generation behavior (owned by `T-027` and `T-028`).",
      "Asset pipeline, release automation, or sharing workflows planned in `T-029` to `T-033`."
    ];

    for (const item of [...expectedInScope, ...expectedOutOfScope]) {
      expect(scope).toContain(`- ${item}`);
    }
  });

  it("keeps acceptance criteria measurable and aligned with S1-S4 lifecycle", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const acceptanceCriteria = toChecklistLines(readSection("Acceptance Criteria", taskDoc));

    const expectedCriteria = [
      "[S1] Scope and acceptance contract explicitly defines editor template-switching boundaries, ownership (`editor` UI/state vs `runtime/core` + `game/schemas` validation), and out-of-scope constraints for `T-026`.",
      "[S2] Scoped implementation enables deterministic TD/RPG switch flow with payload-panel routing and compatibility guards while preserving current editor/runtime architecture boundaries.",
      "[S3] Regression tests cover switch warnings, cancellation behavior, TD/RPG round-trip save/export integrity, and no cross-template data corruption; `pnpm gate:fast` and `pnpm gate:full` pass.",
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
    expect(s1Notes).toContain("switch state transitions");
    expect(s1Notes).toContain("`game/schemas` and `runtime/core` template validators");

    expect(s2Notes).toContain("`editor/src/editor/template-switch.ts`");
    expect(s2Notes).toContain("`editor/src/editor/operations.ts`");
    expect(s2Notes).toContain("`editor/src/editor/api.ts`");
    expect(s2Notes).toContain("Preserved architecture boundaries");

    expect(s3Notes).toContain("close S3");
    expect(s3Notes).toContain("`runtime/core`, `game/schemas`, or `ai`");
    expect(s3Notes).toContain("no additional release-contract doc sync was required");
    expect(s3Notes).toContain("template-switch regressions");

    expect(s4Notes).toContain("`pnpm gate:fast`");
    expect(s4Notes).toContain("`pnpm gate:full`");
    expect(s4Notes).toContain("`pnpm docs:sync-check`");
    expect(s4Notes).toContain("`Issue: 26`");
    expect(s4Notes).toContain("`e212dfc`");
    expect(s4Notes).toContain("`No missing commits to append.`");
    expect(s4Notes).toContain("`pnpm task:next`");
    expect(s4Notes).toContain("no-commit constraint");
  });

  it("captures risk and rollback coverage including S4 memory finalization controls", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const changeList = readSection("Change List", taskDoc);
    const testEvidence = readSection("Test Evidence", taskDoc);
    const risksAndRollback = readSection("Risks and Rollback", taskDoc);

    expect(changeList).toContain("`editor/src/editor/template-switch.ts`");
    expect(changeList).toContain("`editor/src/editor/api.ts`");
    expect(changeList).toContain("`editor/src/editor/components/RpgPayloadPanel.tsx`");
    expect(changeList).toContain("`tests/integration/editor-template-switching.test.ts`");
    expect(changeList).toContain("`docs/ai/tasks/T-026-editor-template-switching.md`");
    expect(changeList).toContain("`tests/integration/editor-template-switching-scope.test.ts`");
    expect(changeList).toContain("`docs/ai/ai-loop-status.md`");
    expect(changeList).toContain("`docs/ai/commit-log/2026-02.md`");
    expect(changeList).toContain("`docs/ai/weekly-summary.md`");

    expect(testEvidence).toContain("`pnpm exec eslint editor/src/app/App.tsx editor/src/editor/api.ts");
    expect(testEvidence).toContain("`pnpm exec vitest run tests/integration/editor-template-switching.test.ts tests/integration/editor-template-switching-scope.test.ts tests/integration/inspector-form-ux.test.ts`");
    expect(testEvidence).toContain("`pnpm gate:fast`");
    expect(testEvidence).toContain("`pnpm gate:full`");
    expect(testEvidence).toContain("`pnpm docs:sync-check`");
    expect(testEvidence).toContain("`pnpm gate:full` retry pass");
    expect(testEvidence).toContain("`pnpm gate:full` first run fail");
    expect(testEvidence).toContain("`Cannot set properties of undefined (setting 'width')`");
    expect(testEvidence).toContain("`bash tools/git-memory/append-commit-log.sh --missing HEAD`");
    expect(testEvidence).toContain("`bash tools/git-memory/update-weekly-summary.sh`");
    expect(testEvidence).toContain("e212dfc");
    expect(testEvidence).toContain("`No missing commits to append.`");
    expect(testEvidence).toContain("Rendered weekly summary:");

    expect(risksAndRollback).toContain("Scope drift can blur boundaries");
    expect(risksAndRollback).toContain("payload-reset or cell-remap");
    expect(risksAndRollback).toContain("TD/RPG round-trip exports");
    expect(risksAndRollback).toContain("`pnpm gate:full` can show transient Three adapter instability");
    expect(risksAndRollback).toContain("S3/S4 documentation updates");
    expect(risksAndRollback).toContain("`docs/ai/ai-loop-status.md`, `docs/ai/commit-log/2026-02.md`, `docs/ai/weekly-summary.md`");
    expect(risksAndRollback).toContain("Follow-up contract-level file changes");
    expect(risksAndRollback).toContain("`editor/src/editor/template-switch.ts`, `editor/src/editor/operations.ts`, and `editor/src/editor/store.ts`");
    expect(risksAndRollback).toContain("If only S3 documentation-state updates need rollback");
    expect(risksAndRollback).toContain("If only S4 memory/docs finalization needs rollback");
  });
});
