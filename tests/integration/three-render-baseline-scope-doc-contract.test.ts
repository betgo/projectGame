import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const taskPath = path.join(projectRoot, "docs/ai/tasks/T-014-three-render-baseline.md");

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

describe("T-014 three-render-baseline scope contract", () => {
  it("defines in-scope and out-of-scope boundaries for render baseline", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const scope = readSection("Scope", taskDoc);

    const expectedInScope = [
      "Define a render baseline contract that maps `RenderSnapshot` data to deterministic placeholder visuals for map cells, path, towers, and enemies.",
      "Keep rendering logic inside `runtime/render` and editor preview integration points only, without introducing simulation-side mutations.",
      "Define lifecycle expectations for render session create/update/dispose behavior so repeated preview runs remain stable.",
      "Define minimum regression coverage for render snapshot mapping and lifecycle cleanup behaviors."
    ];
    const expectedOutOfScope = [
      "Camera interaction, orbit controls, and advanced navigation UX (covered by `T-015`).",
      "Render performance optimization baseline and profiling contracts (covered by `T-016`).",
      "Debug overlay, runtime diagnostics HUD, or developer visualization tools (covered by `T-017`).",
      "High-fidelity art asset pipeline, PBR materials, and shader-level visual effects."
    ];

    for (const item of [...expectedInScope, ...expectedOutOfScope]) {
      expect(scope).toContain(`- ${item}`);
    }
  });

  it("keeps acceptance checklist measurable and aligned with subtask lifecycle", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const acceptanceCriteria = readSection("Acceptance Criteria", taskDoc)
      .split("\n")
      .map(normalizeMarkdownLine)
      .filter((line) => line.startsWith("- ["));

    const expectedCriteria = [
      "[S1] Scope and acceptance contract explicitly defines render boundaries, lifecycle expectations, and out-of-scope constraints for `T-014`.",
      "[S2] Three.js baseline renders map/path/tower/enemy placeholders from `RenderSnapshot` without mutating runtime simulation state.",
      "[S3] Render lifecycle regression tests cover create/update/dispose and repeated preview session cleanup behavior.",
      "[S4] Render contract docs are synchronized when contract-level files change, with risk and rollback notes updated in this task.",
      "[S5] Task closure evidence includes passing `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check` plus memory finalize artifacts."
    ];

    expect(acceptanceCriteria).toHaveLength(expectedCriteria.length);

    for (const criterion of expectedCriteria) {
      expect(acceptanceCriteria.some((line) => line.endsWith(criterion))).toBe(true);
    }

    expect(acceptanceCriteria[0].startsWith("- [x]")).toBe(true);
    for (const line of acceptanceCriteria.slice(1)) {
      expect(line.startsWith("- [ ]")).toBe(true);
    }
  });

  it("marks only S1 as done in subtask checklist during planning", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const subtasks = readSection("Subtasks", taskDoc)
      .split("\n")
      .map(normalizeMarkdownLine)
      .filter((line) => line.startsWith("- ["));

    expect(subtasks).toContain("- [x] [S1] Define scope and acceptance criteria");
    expect(subtasks).toContain("- [ ] [S2] Implement scoped code changes");
    expect(subtasks).toContain("- [ ] [S3] Pass fast and full gates");
    expect(subtasks).toContain("- [ ] [S4] Update docs and risk notes");
    expect(subtasks).toContain("- [ ] [S5] Milestone commit and memory finalize");
  });
});
