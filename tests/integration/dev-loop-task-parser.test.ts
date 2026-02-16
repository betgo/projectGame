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
  it("does not create default subtask when task subtasks are already done", () => {
    withTempTask(
      `# T-999: done-subtasks

## Subtasks
- [x] [S1] Planning done
- [x] [S2] Implement done
`,
      (taskPath) => {
        const context = readTaskContext(taskPath);
        expect(context.subtasks).toEqual([]);
      }
    );
  });

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

  it("keeps default fallback only when no checklist-like subtasks exist", () => {
    withTempTask(
      `# T-999: fallback

## Goal
No subtask checklist in this file.
`,
      (taskPath) => {
        const context = readTaskContext(taskPath);
        expect(context.subtasks).toEqual([{ id: "S1", title: "default-subtask", done: false }]);
      }
    );
  });

  it("fails when explicitly targeting a subtask that is already done", () => {
    withTempTask(
      `# T-999: done-target

## Subtasks
- [x] [S1] Completed already
`,
      (taskPath) => {
        expect(() => readTaskContext(taskPath, "S1")).toThrowError("subtask already done: S1");
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
