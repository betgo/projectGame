import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const taskPath = path.join(projectRoot, "docs/ai/tasks/T-012-hardening-and-docs.md");

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

describe("T-012 hardening scope contract", () => {
  it("defines the planned hardening scope and out-of-scope boundaries", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const scope = readSection("Scope", taskDoc);

    const expectedInScope = [
      "Define a hardening envelope for regression coverage in schema validation, deterministic simulation, and AI generate/repair smoke flow.",
      "Define release-facing documentation requirements for runbook, troubleshooting, and acceptance checklist.",
      "Define required local gate evidence (`pnpm gate:fast`, `pnpm gate:full`, `pnpm docs:sync-check`) for task closure.",
      "Keep implementation boundaries inside existing layers (`runtime/core`, `game/schemas`, `ai`, `tools`, and `docs`) without cross-layer leakage."
    ];
    const expectedOutOfScope = [
      "New gameplay mechanics, template expansion, or rebalance features outside hardening baselines.",
      "New external deployment platform integration or cloud release automation.",
      "UI redesign or non-v1 product-scope expansion."
    ];

    for (const item of [...expectedInScope, ...expectedOutOfScope]) {
      expect(scope).toContain(`- ${item}`);
    }
  });

  it("declares measurable acceptance criteria for hardening delivery", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const acceptanceCriteria = readSection("Acceptance Criteria", taskDoc)
      .split("\n")
      .map(normalizeMarkdownLine)
      .filter((line) => line.startsWith("- ["));

    const expectedCriteria = [
      "Regression suite definition explicitly covers schema, determinism, editor/headless consistency, and AI smoke paths.",
      "Performance baseline command and threshold contract are documented and reproducible.",
      "README and `docs/ai` release-flow contracts are aligned with build/run/test/release commands.",
      "Task completion requires passing `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check` with recorded evidence.",
      "Task closure includes memory-finalize artifacts and explicit task-status closure evidence."
    ];

    expect(acceptanceCriteria).toHaveLength(expectedCriteria.length);

    for (const criterion of expectedCriteria) {
      expect(acceptanceCriteria.some((line) => line.endsWith(criterion))).toBe(true);
    }
  });

  it("records S4 gate evidence for required local closure commands", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const acceptanceCriteria = readSection("Acceptance Criteria", taskDoc)
      .split("\n")
      .map(normalizeMarkdownLine)
      .filter((line) => line.startsWith("- ["));
    const subtasks = readSection("Subtasks", taskDoc)
      .split("\n")
      .map(normalizeMarkdownLine)
      .filter((line) => line.startsWith("- ["));
    const s4EvidenceMatch = taskDoc.match(/## S4 Gate Evidence \(\d{4}-\d{2}-\d{2}\)\n\n([\s\S]*?)(?=\n## |$)/);

    expect(
      acceptanceCriteria.some(
        (line) =>
          line.startsWith("- [x]") &&
          line.includes(
            "Task completion requires passing `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check` with recorded evidence."
          )
      )
    ).toBe(true);
    expect(
      subtasks.some(
        (line) => line.startsWith("- [x]") && line.includes("[S4] Run fast/full/docs gates and collect performance baseline evidence")
      )
    ).toBe(true);
    expect(s4EvidenceMatch).not.toBeNull();

    const evidenceBody = s4EvidenceMatch ? s4EvidenceMatch[1] : "";
    for (const command of ["`pnpm gate:fast`", "`pnpm gate:full`", "`pnpm docs:sync-check`"]) {
      expect(evidenceBody).toContain(command);
    }
    expect(evidenceBody).toContain("`pnpm simulate:batch game/examples/td-normal.json 100 --max-imbalance=0.6000`");
    expect(evidenceBody).toContain(
      "`sampleSize=100 winRate=0.0000 avgDuration=5400 leakRate=4.0000 imbalanceIndex=0.5800`"
    );
    expect(evidenceBody).toContain("`0.5800 <= 0.6000`");
    expect(evidenceBody).toContain("pass");
  });

  it("documents pre-implementation risk and rollback baseline before S2 notes", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const riskBaseline = readSection("Risk and Rollback Expectations (Pre-Implementation Baseline, 2026-02-16)", taskDoc);
    const riskBaselineIndex = taskDoc.indexOf("## Risk and Rollback Expectations (Pre-Implementation Baseline, 2026-02-16)");
    const s2NotesIndex = taskDoc.indexOf("## S2 Implementation Notes (2026-02-16)");

    expect(riskBaseline).toContain("Baseline was recorded in planning before S2 implementation kickoff");
    expect(riskBaseline).toContain("- Risk:");
    expect(riskBaseline).toContain("- Rollback plan:");
    expect(riskBaselineIndex).toBeGreaterThan(-1);
    expect(s2NotesIndex).toBeGreaterThan(-1);
    expect(riskBaselineIndex).toBeLessThan(s2NotesIndex);
  });

  it("closes S5 with memory-finalize evidence and task status closure", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const statusMatch = taskDoc.match(/^- Status:\s*(.+)$/m);
    const acceptanceCriteria = readSection("Acceptance Criteria", taskDoc)
      .split("\n")
      .map(normalizeMarkdownLine)
      .filter((line) => line.startsWith("- ["));
    const subtasks = readSection("Subtasks", taskDoc)
      .split("\n")
      .map(normalizeMarkdownLine)
      .filter((line) => line.startsWith("- ["));
    const s5ClosureMatch = taskDoc.match(/## S5 Memory Finalization and Task Closure \(\d{4}-\d{2}-\d{2}\)\n\n([\s\S]*?)(?=\n## |$)/);

    expect(statusMatch?.[1].trim()).toBe("Done");
    expect(
      acceptanceCriteria.some(
        (line) =>
          line.startsWith("- [x]") &&
          line.includes("Task closure includes memory-finalize artifacts and explicit task-status closure evidence.")
      )
    ).toBe(true);
    expect(
      subtasks.some((line) => line.startsWith("- [x]") && line.includes("[S5] Finalize memory and close task"))
    ).toBe(true);
    expect(s5ClosureMatch).not.toBeNull();

    const closureBody = s5ClosureMatch ? s5ClosureMatch[1] : "";
    expect(closureBody).toContain("`docs/ai/ai-loop-status.md`");
    expect(closureBody).toContain("`docs/ai/commit-log/2026-02.md`");
    expect(closureBody).toContain("`docs/ai/weekly-summary.md`");
    expect(closureBody).toContain("status to `Done`");
    expect(closureBody).toContain("no runtime/gameplay contract files were changed");
  });
});
