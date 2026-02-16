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
      "Risk and rollback expectations are documented before implementation subtasks start."
    ];

    expect(acceptanceCriteria).toHaveLength(expectedCriteria.length);

    for (const criterion of expectedCriteria) {
      expect(acceptanceCriteria.some((line) => line.endsWith(criterion))).toBe(true);
    }
  });
});
