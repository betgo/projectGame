import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const taskPath = path.join(projectRoot, "docs/ai/tasks/T-016-render-performance-baseline.md");

function readSection(title: string, content: string): string {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`## ${escaped}\\n\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = content.match(pattern);
  if (!match) {
    throw new Error(`missing section: ${title}`);
  }
  return match[1].trim();
}

function normalizeMarkdownLine(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

describe("T-016 render-performance-baseline scope contract", () => {
  it("defines explicit in-scope and out-of-scope boundaries", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const scope = readSection("Scope", taskDoc);

    const expectedInScope = [
      "Define a reproducible render-performance baseline protocol for representative packages (`td-easy`, `td-normal`, `td-hard`) under repetitive preview restart sessions.",
      "Define required metrics and evidence format for FPS, frame-time distribution, and memory-trend deltas so baseline output is locally comparable.",
      "Constrain optimization work to low-risk render-path changes (object reuse, allocation reduction, lifecycle cleanup) inside `runtime/render` and editor preview integration.",
      "Define regression coverage expectations for baseline command/report output and memory-growth guardrails without crossing runtime architecture boundaries.",
      "Keep simulation semantics in `runtime/core` unchanged; render-side work must stay read-only with respect to gameplay state."
    ];
    const expectedOutOfScope = [
      "Aggressive engine rewrite, custom WebGL pipeline migration, or renderer-stack replacement.",
      "Gameplay rebalance, schema redesign, or feature work unrelated to render performance baselines.",
      "Remote telemetry pipeline, cloud profiling infrastructure, or production monitoring rollout.",
      "Browser/GPU-vendor-specific tuning that cannot be validated deterministically in local CI gates."
    ];

    for (const item of [...expectedInScope, ...expectedOutOfScope]) {
      expect(scope).toContain(`- ${item}`);
    }
  });

  it("keeps acceptance criteria measurable and aligned with S3 gate completion", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const acceptanceCriteria = readSection("Acceptance Criteria", taskDoc)
      .split("\n")
      .map(normalizeMarkdownLine)
      .filter((line) => line.startsWith("- ["));

    const expectedCriteria = [
      "[S1] Scope and acceptance contract explicitly defines measurement protocol, optimization boundaries, architecture constraints, and out-of-scope limits for `T-016`.",
      "[S2] Baseline implementation captures reproducible FPS/frame-time/memory-trend metrics for representative packages with low-risk render-path optimizations only.",
      "[S3] Regression tests cover baseline evidence shape and repeated preview restart memory-growth guardrails.",
      "[S4] If contract-level files change (`runtime/core`, `game/schemas`, `ai`), sync `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop with updated risk/rollback notes.",
      "[S5] Task closure evidence includes passing `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check` plus memory-finalize artifacts."
    ];

    expect(acceptanceCriteria).toHaveLength(expectedCriteria.length);

    for (const criterion of expectedCriteria) {
      expect(acceptanceCriteria.some((line) => line.endsWith(criterion))).toBe(true);
    }

    for (const line of acceptanceCriteria.slice(0, 3)) {
      expect(line.startsWith("- [x]")).toBe(true);
    }
    for (const line of acceptanceCriteria.slice(3)) {
      expect(line.startsWith("- [ ]")).toBe(true);
    }
  });

  it("marks S1-S3 complete in subtask progress", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const subtasks = readSection("Subtasks", taskDoc)
      .split("\n")
      .map(normalizeMarkdownLine)
      .filter((line) => line.startsWith("- ["));

    expect(subtasks).toContain("- [x] [S1] Define scope and acceptance criteria");
    expect(subtasks).toContain("- [x] [S2] Implement scoped code changes");
    expect(subtasks).toContain("- [x] [S3] Pass fast and full gates");
    expect(subtasks).toContain("- [ ] [S4] Update docs and risk notes");
    expect(subtasks).toContain("- [ ] [S5] Milestone commit and memory finalize");
  });

  it("records S1-S3 governance artifacts and rollback scope", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const s1Notes = readSection("S1 Implementation Notes (2026-02-16)", taskDoc);
    const s2Notes = readSection("S2 Implementation Notes (2026-02-16)", taskDoc);
    const s3Notes = readSection("S3 Implementation Notes (2026-02-16)", taskDoc);
    const changeList = readSection("Change List", taskDoc);
    const risksAndRollback = readSection("Risks and Rollback", taskDoc);

    expect(s1Notes).toContain("reproducible local baseline definition");
    expect(s1Notes).toContain("`S1-S5`");
    expect(s1Notes).toContain("architecture boundary");
    expect(s2Notes).toContain("`runtime/render/three-adapter.ts`");
    expect(s2Notes).toContain("`runtime/render/performance-baseline.ts`");
    expect(s2Notes).toContain("`pnpm simulate:render-baseline`");
    expect(s2Notes).toContain("`runtime/core`");
    expect(s3Notes).toContain("`pnpm gate:fast`");
    expect(s3Notes).toContain("`pnpm gate:full`");
    expect(s3Notes).toContain("contract-level files");

    expect(changeList).toContain("`docs/ai/tasks/T-016-render-performance-baseline.md`");
    expect(changeList).toContain("`tests/integration/render-performance-baseline-scope-doc-contract.test.ts`");
    expect(changeList).toContain("`runtime/render/three-adapter.ts`");
    expect(changeList).toContain("`runtime/render/performance-baseline.ts`");
    expect(changeList).toContain("`tools/simulate/run-render-baseline.ts`");
    expect(changeList).toContain("`tests/integration/render-performance-baseline-metrics.test.ts`");
    expect(changeList).toContain("`tests/integration/simulate-render-baseline-cli.test.ts`");

    expect(risksAndRollback).toContain("architecture boundaries");
    expect(risksAndRollback).toContain("docs and tests");
    expect(risksAndRollback).toContain("`runtime/render/three-adapter.ts`");
    expect(risksAndRollback).toContain("`runtime/render/performance-baseline.ts`");
    expect(risksAndRollback).toContain("`docs/ai/tasks/T-016-render-performance-baseline.md`");
    expect(risksAndRollback).toContain("`tests/integration/render-performance-baseline-scope-doc-contract.test.ts`");
  });
});
