import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

type CliArgs = {
  title?: string;
  roadmapFile: string;
  force: boolean;
};

type TaskCard = {
  path: string;
  id?: number;
  done: boolean;
};

type RoadmapIssue = {
  idRaw: string;
  id: number;
  title: string;
};

function parseArgv(argv: string[]): CliArgs {
  let title: string | undefined;
  let roadmapFile = "docs/ai/tasks/T-ROADMAP-v1-editor-platform.md";
  let force = false;
  const positionals: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }

    if (token === "--force") {
      force = true;
      continue;
    }

    const [rawKey, rawValue] = token.slice(2).split("=", 2);
    const next = rawValue ?? argv[i + 1];
    if (!next || next.startsWith("--")) {
      continue;
    }

    if (!rawValue) {
      i += 1;
    }

    if (rawKey === "title") {
      title = next;
    }
    if (rawKey === "roadmap-file") {
      roadmapFile = next;
    }
  }

  if (!title && positionals.length > 0) {
    title = positionals.join(" ");
  }

  return {
    title: title?.trim() || undefined,
    roadmapFile,
    force
  };
}

function parseTaskDoneState(content: string): boolean {
  const match = content.match(/^- Status:\s*(.+)$/im);
  if (!match) {
    return false;
  }
  return match[1].toLowerCase().includes("done");
}

function parseTaskId(fileName: string): number | undefined {
  const match = /^T-(\d+)\b/i.exec(fileName);
  if (!match) {
    return undefined;
  }
  const parsed = Number(match[1]);
  if (Number.isNaN(parsed)) {
    return undefined;
  }
  return parsed;
}

function listTaskCards(cwd: string): TaskCard[] {
  const tasksDir = path.resolve(cwd, "docs/ai/tasks");
  if (!fs.existsSync(tasksDir)) {
    return [];
  }

  return fs
    .readdirSync(tasksDir)
    .filter((file) => file.endsWith(".md"))
    .filter((file) => !["TEMPLATE.md", "SUBTASK-TEMPLATE.md", "T-ROADMAP-v1-editor-platform.md"].includes(file))
    .map((file) => {
      const absolute = path.resolve(tasksDir, file);
      const content = fs.readFileSync(absolute, "utf-8");
      return {
        path: absolute,
        id: parseTaskId(file),
        done: parseTaskDoneState(content)
      };
    })
    .sort((a, b) => (a.id ?? Number.MAX_SAFE_INTEGER) - (b.id ?? Number.MAX_SAFE_INTEGER));
}

function parseRoadmapIssues(roadmapPath: string): RoadmapIssue[] {
  if (!fs.existsSync(roadmapPath)) {
    return [];
  }

  const content = fs.readFileSync(roadmapPath, "utf-8");
  const issues: RoadmapIssue[] = [];

  for (const line of content.split("\n")) {
    const match = /^\s*\d+\.\s+I(\d+)\s+(.+?)\s*$/.exec(line.trim());
    if (!match) {
      continue;
    }
    const id = Number(match[1]);
    if (Number.isNaN(id)) {
      continue;
    }
    issues.push({
      idRaw: match[1],
      id,
      title: match[2].trim()
    });
  }

  return issues;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function taskFilePath(cwd: string, issueIdRaw: string, title: string): string {
  return path.resolve(cwd, `docs/ai/tasks/T-${issueIdRaw}-${slugify(title)}.md`);
}

function runNewTask(cwd: string, issueIdRaw: string, title: string): void {
  const result = spawnSync("bash", ["tools/git-memory/new-task.sh", issueIdRaw, title], {
    cwd,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function toIssueIdRaw(nextId: number, minWidth: number): string {
  return String(nextId).padStart(minWidth, "0");
}

function main(): number {
  const cwd = process.cwd();
  const args = parseArgv(process.argv.slice(2));
  const cards = listTaskCards(cwd);
  const active = cards.filter((item) => !item.done);

  if (active.length > 0 && !args.force) {
    const first = active[0];
    const relative = path.relative(cwd, first.path);
    console.log(`[task:next] Active task exists, no new file created: ${relative}`);
    console.log(`[task:next] Use --force to create a new card anyway.`);
    return 0;
  }

  const existingIds = new Set(cards.map((item) => item.id).filter((id): id is number => typeof id === "number"));
  const maxExistingId = cards.reduce((max, item) => Math.max(max, item.id ?? 0), 0);
  const roadmapPath = path.resolve(cwd, args.roadmapFile);
  const roadmapIssues = parseRoadmapIssues(roadmapPath);
  const roadmapIdWidth = roadmapIssues.reduce((max, item) => Math.max(max, item.idRaw.length), 3);

  const roadmapCandidate = roadmapIssues.find(
    (issue) => issue.id > maxExistingId && !existingIds.has(issue.id)
  );

  if (roadmapCandidate) {
    runNewTask(cwd, roadmapCandidate.idRaw, roadmapCandidate.title);
    console.log(`[task:next] Created from roadmap: ${path.relative(cwd, taskFilePath(cwd, roadmapCandidate.idRaw, roadmapCandidate.title))}`);
    return 0;
  }

  if (!args.title) {
    console.error("[task:next] No remaining roadmap issue after current progress.");
    console.error("[task:next] Provide a custom title, e.g. `pnpm task:next -- \"runtime perf tuning\"`.");
    return 1;
  }

  const nextId = maxExistingId + 1;
  const idRaw = toIssueIdRaw(nextId, roadmapIdWidth);
  runNewTask(cwd, idRaw, args.title);
  console.log(`[task:next] Created custom task: ${path.relative(cwd, taskFilePath(cwd, idRaw, args.title))}`);
  return 0;
}

process.exit(main());
