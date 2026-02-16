import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const taskPath = path.join(projectRoot, "docs/ai/tasks/T-016-render-performance-baseline.md");
const loopStatusPath = path.join(projectRoot, "docs/ai/ai-loop-status.md");
const renderContractDocPaths = [
  "README.md",
  "docs/ai/README.md",
  "docs/ai/workflows/continuous-loop.md"
] as const;

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

describe("T-016 render-performance-baseline S5 closure contract", () => {
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

  it("keeps acceptance criteria measurable and aligned to S1-S5 lifecycle", () => {
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

    for (const line of acceptanceCriteria) {
      expect(line.startsWith("- [x]")).toBe(true);
    }
  });

  it("marks S1-S5 complete while retaining S5 closure evidence", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const subtasks = readSection("Subtasks", taskDoc)
      .split("\n")
      .map(normalizeMarkdownLine)
      .filter((line) => line.startsWith("- ["));
    const s5Closure = readSection("S5 Memory Finalization and Task Closure (2026-02-16)", taskDoc);

    expect(subtasks).toContain("- [x] [S1] Define scope and acceptance criteria");
    expect(subtasks).toContain("- [x] [S2] Implement scoped code changes");
    expect(subtasks).toContain("- [x] [S3] Pass fast and full gates");
    expect(subtasks).toContain("- [x] [S4] Update docs and risk notes");
    expect(subtasks).toContain("- [x] [S5] Milestone commit and memory finalize");
    expect(s5Closure).toContain("`pnpm gate:fast`");
    expect(s5Closure).toContain("`pnpm gate:full`");
    expect(s5Closure).toContain("`pnpm docs:sync-check`");
  });

  it("synchronizes render-baseline contract docs and S4 risk notes", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const s4Notes = readSection("S4 Documentation and Risk Notes (2026-02-16)", taskDoc);

    for (const docPath of renderContractDocPaths) {
      const docContent = fs.readFileSync(path.join(projectRoot, docPath), "utf-8");
      const renderContractNote = readSection("Render contract note", docContent);

      expect(renderContractNote).toContain("pnpm simulate:render-baseline");
      expect(renderContractNote).toContain("td-easy");
      expect(renderContractNote).toContain("--max-memory-delta-bytes");
      expect(renderContractNote).toContain("`runtime/render/performance-baseline.ts`");
      expect(renderContractNote).toContain("`runtime/core`");
      expect(s4Notes).toContain(`\`${docPath}\``);
    }

    expect(s4Notes).toContain("memory guardrail");
    expect(s4Notes).toContain("architecture boundaries");
  });

  it("records S1-S4 governance artifacts and rollback scope", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const s1Notes = readSection("S1 Implementation Notes (2026-02-16)", taskDoc);
    const s2Notes = readSection("S2 Implementation Notes (2026-02-16)", taskDoc);
    const s3Notes = readSection("S3 Implementation Notes (2026-02-16)", taskDoc);
    const s4Notes = readSection("S4 Documentation and Risk Notes (2026-02-16)", taskDoc);
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
    expect(s4Notes).toContain("`README.md`");
    expect(s4Notes).toContain("`docs/ai/README.md`");
    expect(s4Notes).toContain("`docs/ai/workflows/continuous-loop.md`");
    expect(s4Notes).toContain("`runtime/render/performance-baseline.ts`");

    expect(changeList).toContain("`docs/ai/tasks/T-016-render-performance-baseline.md`");
    expect(changeList).toContain("`tests/integration/render-performance-baseline-scope-doc-contract.test.ts`");
    expect(changeList).toContain("`runtime/render/three-adapter.ts`");
    expect(changeList).toContain("`runtime/render/performance-baseline.ts`");
    expect(changeList).toContain("`tools/simulate/run-render-baseline.ts`");
    expect(changeList).toContain("`tests/integration/render-performance-baseline-metrics.test.ts`");
    expect(changeList).toContain("`tests/integration/simulate-render-baseline-cli.test.ts`");
    expect(changeList).toContain("`README.md`");
    expect(changeList).toContain("`docs/ai/README.md`");
    expect(changeList).toContain("`docs/ai/workflows/continuous-loop.md`");
    expect(changeList).toContain("`docs/ai/ai-loop-status.md`");
    expect(changeList).toContain("`docs/ai/commit-log/2026-02.md`");
    expect(changeList).toContain("`docs/ai/weekly-summary.md`");

    expect(risksAndRollback).toContain("architecture boundaries");
    expect(risksAndRollback).toContain("docs and tests");
    expect(risksAndRollback).toContain("Render-baseline handoff docs may drift");
    expect(risksAndRollback).toContain("`runtime/render/three-adapter.ts`");
    expect(risksAndRollback).toContain("`runtime/render/performance-baseline.ts`");
    expect(risksAndRollback).toContain("`README.md`");
    expect(risksAndRollback).toContain("`docs/ai/README.md`");
    expect(risksAndRollback).toContain("`docs/ai/workflows/continuous-loop.md`");
    expect(risksAndRollback).toContain("`docs/ai/tasks/T-016-render-performance-baseline.md`");
    expect(risksAndRollback).toContain("`tests/integration/render-performance-baseline-scope-doc-contract.test.ts`");
  });

  it("closes S5 with memory-finalize evidence and loop handoff updates", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const loopStatus = fs.readFileSync(loopStatusPath, "utf-8");
    const statusMatch = taskDoc.match(/^- Status:\s*(.+)$/m);
    const s5Closure = readSection("S5 Memory Finalization and Task Closure (2026-02-16)", taskDoc);

    expect(statusMatch?.[1].trim()).toBe("Done");
    expect(s5Closure).toContain("`bash tools/git-memory/append-commit-log.sh --missing HEAD`");
    expect(s5Closure).toContain("`bash tools/git-memory/update-weekly-summary.sh`");
    expect(s5Closure).toContain("`docs/ai/commit-log/2026-02.md`");
    expect(s5Closure).toContain("`docs/ai/weekly-summary.md`");
    expect(s5Closure).toContain("`23b5502`");
    expect(s5Closure).toContain("No missing commits to append.");
    expect(s5Closure).toContain("`docs/ai/ai-loop-status.md`");
    expect(s5Closure).toContain("status to `Done`");
    expect(s5Closure).toContain("no-commit constraint");
    expect(s5Closure).toContain("no runtime/render contract files were changed");

    const hasClosedTask16HandoffState =
      loopStatus.includes("- Issue: 16") &&
      loopStatus.includes("T-016-render-performance-baseline.md") &&
      loopStatus.includes("- 当前阶段: 子任务收口完成") &&
      loopStatus.includes("- 当前子任务: [S5] Milestone commit and memory finalize") &&
      loopStatus.includes("- 下一个子任务: 无");

    if (hasClosedTask16HandoffState) {
      expect(loopStatus).toContain("`pnpm task:next`");
      return;
    }

    expect(loopStatus).toContain("- 当前阶段:");
    expect(loopStatus).toContain("- 当前子任务:");
    expect(loopStatus).toContain("- 下一个子任务:");
    expect(loopStatus).toContain("- 任务卡:");
  });
});
