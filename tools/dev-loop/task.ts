import fs from "node:fs";

import type { Subtask } from "./types";

export type TaskContext = {
  path: string;
  subtasks: Subtask[];
};

function parseLineToSubtask(line: string, index: number): Subtask | null {
  const match = /^- \[( |x|X)\] (.+)$/.exec(line.trim());
  if (!match) {
    return null;
  }

  const done = match[1].toLowerCase() === "x";
  const rawTitle = match[2].trim();
  const idMatch = /^\[([^\]]+)\]\s+(.+)$/.exec(rawTitle);
  if (idMatch) {
    return {
      id: idMatch[1].trim(),
      title: idMatch[2].trim(),
      done
    };
  }

  return {
    id: `S${index + 1}`,
    title: rawTitle,
    done
  };
}

function findSubtasksSection(lines: string[]): { start: number; end: number } | null {
  let start = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^##\s+Subtasks\b/i.test(lines[i].trim())) {
      start = i + 1;
      break;
    }
  }

  if (start < 0) {
    return null;
  }

  let end = lines.length;
  for (let i = start; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i].trim())) {
      end = i;
      break;
    }
  }

  return { start, end };
}

function parseSubtasksInRange(lines: string[], start: number, end: number): Subtask[] {
  const parsed: Subtask[] = [];
  for (let i = start; i < end; i += 1) {
    const maybe = parseLineToSubtask(lines[i], parsed.length);
    if (maybe) {
      parsed.push(maybe);
    }
  }
  return parsed;
}

export function readTaskContext(taskPath: string, onlySubtaskId?: string): TaskContext {
  const content = fs.readFileSync(taskPath, "utf-8");
  const lines = content.split("\n");
  const section = findSubtasksSection(lines);
  let parsed =
    section !== null ? parseSubtasksInRange(lines, section.start, section.end) : parseSubtasksInRange(lines, 0, lines.length);
  if (parsed.length === 0 && section !== null) {
    parsed = parseSubtasksInRange(lines, 0, lines.length);
  }

  let subtasks = parsed.filter((item) => !item.done);
  if (subtasks.length === 0) {
    subtasks = [{ id: "S1", title: "default-subtask", done: false }];
  }

  if (onlySubtaskId) {
    subtasks = subtasks.filter((item) => item.id === onlySubtaskId);
    if (subtasks.length === 0) {
      throw new Error(`subtask not found: ${onlySubtaskId}`);
    }
  }

  return {
    path: taskPath,
    subtasks
  };
}

export function markSubtaskDone(taskPath: string, subtask: Subtask): void {
  const content = fs.readFileSync(taskPath, "utf-8");
  const lines = content.split("\n");
  const section = findSubtasksSection(lines);

  const start = section?.start ?? 0;
  const end = section?.end ?? lines.length;

  let replaced = false;
  let seen = 0;

  for (let i = start; i < end; i += 1) {
    const line = lines[i];
    const parsed = parseLineToSubtask(line, seen);
    if (!parsed) {
      continue;
    }

    if (parsed.id === subtask.id && !parsed.done) {
      const title = parsed.title;
      lines[i] = `- [x] [${subtask.id}] ${title}`;
      replaced = true;
      break;
    }

    seen += 1;
  }

  if (!replaced) {
    lines.push("", "## Subtask Progress", `- [x] [${subtask.id}] ${subtask.title}`);
  }

  fs.writeFileSync(taskPath, lines.join("\n"));
}
