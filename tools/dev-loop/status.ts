import fs from "node:fs";
import path from "node:path";

import type { Subtask } from "./types";

const STATUS_FILE = "docs/ai/ai-loop-status.md";

type StatusInput = {
  issueId: string;
  branch: string;
  taskFile: string;
  subtask: Subtask;
  nextSubtask?: Subtask;
  phase: string;
  message: string;
  nextAction: string;
  commitSha?: string;
  memoryCommitSha?: string;
  promptRefs: string[];
};

function renderSubtask(subtask?: Subtask): string {
  if (!subtask) {
    return "无";
  }
  return `[${subtask.id}] ${subtask.title}`;
}

export function writeLoopStatus(cwd: string, input: StatusInput): string {
  const now = new Date().toISOString();
  const file = path.resolve(cwd, STATUS_FILE);

  const content = `# AI 循环状态

- 更新时间: ${now}
- Issue: ${input.issueId}
- 分支: ${input.branch}
- 任务卡: \`${input.taskFile}\`
- 当前阶段: ${input.phase}
- 当前子任务: ${renderSubtask(input.subtask)}
- 当前 AI 在做: ${input.message}
- 下一步准备: ${input.nextAction}
- 下一个子任务: ${renderSubtask(input.nextSubtask)}
- 里程碑提交: ${input.commitSha ?? "待生成"}
- 记忆提交: ${input.memoryCommitSha ?? "待生成"}
- Prompt-Refs: ${input.promptRefs.join(", ")}
`;

  fs.writeFileSync(file, content);
  return file;
}
