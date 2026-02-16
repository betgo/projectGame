import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { markSubtaskDone, readTaskContext } from "../../tools/dev-loop/task";

function withTempTask(content: string, run: (taskPath: string) => void): void {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "task-parser-"));
  const file = path.join(dir, "T-999-test.md");
  fs.writeFileSync(file, content);
  try {
    run(file);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe("dev-loop task parser", () => {
  it("reads pending subtasks only from Subtasks section", () => {
    withTempTask(
      `# T-999: parser-check

## Acceptance Criteria
- [ ] [S1] This is acceptance checklist only.

## Subtasks
- [x] [S1] Planning done
- [ ] [S2] Implement task logic

## Notes
- keep simple
`,
      (taskPath) => {
        const context = readTaskContext(taskPath);
        expect(context.subtasks).toHaveLength(1);
        expect(context.subtasks[0].id).toBe("S2");
        expect(context.subtasks[0].title).toBe("Implement task logic");
      }
    );
  });

  it("marks subtask as done without touching acceptance checklist", () => {
    withTempTask(
      `# T-999: mark-check

## Acceptance Criteria
- [ ] [S1] Keep this unchecked.

## Subtasks
- [ ] [S1] Real subtask item
`,
      (taskPath) => {
        markSubtaskDone(taskPath, { id: "S1", title: "Real subtask item", done: false });
        const updated = fs.readFileSync(taskPath, "utf-8");
        expect(updated).toContain("## Acceptance Criteria\n- [ ] [S1] Keep this unchecked.");
        expect(updated).toContain("## Subtasks\n- [x] [S1] Real subtask item");
      }
    );
  });
});
