import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const summaryScript = path.resolve(projectRoot, "tools/git-memory/render-weekly-summary.py");
const tempDirs: string[] = [];

function makeTempRepo(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "git-memory-summary-"));
  tempDirs.push(root);
  fs.mkdirSync(path.join(root, "tools/git-memory"), { recursive: true });
  fs.mkdirSync(path.join(root, "docs/ai/commit-log"), { recursive: true });
  fs.copyFileSync(summaryScript, path.join(root, "tools/git-memory/render-weekly-summary.py"));
  return root;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("render-weekly-summary", () => {
  it("normalizes risk bullet prefixes from commit logs", () => {
    const root = makeTempRepo();
    const logPath = path.join(root, "docs/ai/commit-log/2026-02.md");

    fs.writeFileSync(
      logPath,
      `# Commit Log 2026-02

This file stores normalized commit summaries for 2026-02.

## 2026-02-14 - feat(loop): close S2 (\`abc1234\`)

- Risk: - Medium. Validate integration.
- Prompt-Refs: ARCHITECT_v1, BUILDER_v2

## 2026-02-14 - docs(memory): finalize S2 (\`def5678\`)

- Risk: Low.
- Prompt-Refs: BUILDER_v2
`,
      "utf-8"
    );

    const result = spawnSync("python3", ["tools/git-memory/render-weekly-summary.py"], {
      cwd: root,
      encoding: "utf-8"
    });

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);

    const summary = fs.readFileSync(path.join(root, "docs/ai/weekly-summary.md"), "utf-8");
    expect(summary).toContain("  - Medium. Validate integration.");
    expect(summary).not.toContain("  - - Medium. Validate integration.");
  });
});
