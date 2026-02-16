import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const appendScript = path.resolve(projectRoot, "tools/git-memory/append-commit-log.sh");
const tempDirs: string[] = [];

type CommandResult = ReturnType<typeof spawnSync>;

function run(command: string, args: string[], cwd: string, input?: string, env?: Record<string, string>): CommandResult {
  return spawnSync(command, args, {
    cwd,
    encoding: "utf-8",
    input,
    env: {
      ...process.env,
      ...env
    }
  });
}

function expectSuccess(result: CommandResult, context: string): void {
  expect(result.status, `${context}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`).toBe(0);
}

function initRepo(): string {
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "git-memory-append-"));
  tempDirs.push(repoDir);

  expectSuccess(run("git", ["init"], repoDir), "git init");
  expectSuccess(run("git", ["config", "user.name", "Test User"], repoDir), "git config user.name");
  expectSuccess(run("git", ["config", "user.email", "test@example.com"], repoDir), "git config user.email");
  return repoDir;
}

function commit(repoDir: string, message: string, files: Record<string, string>, isoDate: string): string {
  for (const [file, content] of Object.entries(files)) {
    const fullPath = path.join(repoDir, file);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf-8");
  }

  expectSuccess(run("git", ["add", "-A"], repoDir), "git add");
  expectSuccess(
    run("git", ["commit", "-F", "-"], repoDir, message, {
      GIT_AUTHOR_DATE: isoDate,
      GIT_COMMITTER_DATE: isoDate
    }),
    "git commit"
  );

  const sha = run("git", ["rev-parse", "--short", "HEAD"], repoDir);
  expectSuccess(sha, "git rev-parse");
  return String(sha.stdout).trim();
}

function readCommitLog(repoDir: string): string {
  return fs.readFileSync(path.join(repoDir, "docs/ai/commit-log/2026-02.md"), "utf-8");
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("append-commit-log script", () => {
  it("supports commit ranges and keeps entry order deterministic", () => {
    const repo = initRepo();

    commit(
      repo,
      `chore(init): bootstrap

Why:
Initialize repository.
What:
- Add a baseline file.
Impact:
- Enables follow-up commits.
Risk:
- Low.
Test:
manual
Prompt-Refs: ARCHITECT_v1`,
      { "base.txt": "base\n" },
      "2026-02-14T00:00:00Z"
    );

    const memorySha = commit(
      repo,
      `docs(memory): finalize S1 scope

Why:
Finalize memory files.
What:
- Update alpha.
- Update beta.
Impact:
- Keep summaries up to date.
Risk:
- Low.
Test:
bash tools/git-memory/finalize-task.sh
Prompt-Refs: ARCHITECT_v1,BUILDER_v2`,
      { "alpha.txt": "a\n", "beta.txt": "b\n" },
      "2026-02-14T00:01:00Z"
    );

    const milestoneSha = commit(
      repo,
      `feat(loop): close S2 sample

Why:
Close subtask.
What:
- Deliver implementation.
Impact:
- Advance issue.
Risk:
- Medium.
Test:
pnpm gate:fast
Prompt-Refs: ARCHITECT_v1,REVIEWER_v1`,
      { "gamma.txt": "g\n" },
      "2026-02-14T00:02:00Z"
    );

    const append = run("bash", [appendScript, "HEAD~2..HEAD"], repo);
    expectSuccess(append, "append-commit-log range");

    const log = readCommitLog(repo);
    const memoryIndex = log.indexOf(`\`${memorySha}\``);
    const milestoneIndex = log.indexOf(`\`${milestoneSha}\``);

    expect(memoryIndex).toBeGreaterThan(-1);
    expect(milestoneIndex).toBeGreaterThan(-1);
    expect(memoryIndex).toBeLessThan(milestoneIndex);
    expect(log).toContain("- What: Update alpha. Update beta.");
    expect(log).toContain("- Files: `alpha.txt`, `beta.txt`");
  });

  it("skips duplicated commits when re-appending same range", () => {
    const repo = initRepo();

    commit(
      repo,
      `feat(loop): close S1

Why:
Close subtask.
What:
- Add one file.
Impact:
- Progress task.
Risk:
- Low.
Test:
pnpm gate:fast
Prompt-Refs: BUILDER_v2`,
      { "task.txt": "v1\n" },
      "2026-02-14T00:00:00Z"
    );

    const sha = commit(
      repo,
      `docs(memory): finalize S1

Why:
Finalize memory.
What:
- Refresh summaries.
Impact:
- Keep warm-start context.
Risk:
- Low.
Test:
bash tools/git-memory/finalize-task.sh
Prompt-Refs: BUILDER_v2`,
      { "docs.txt": "v2\n" },
      "2026-02-14T00:01:00Z"
    );

    expectSuccess(run("bash", [appendScript, "HEAD"], repo), "append first");
    expectSuccess(run("bash", [appendScript, "HEAD"], repo), "append duplicate");

    const log = readCommitLog(repo);
    const matches = log.match(new RegExp(`\\\`${sha}\\\``, "g")) ?? [];
    expect(matches).toHaveLength(1);
  });

  it("backfills missing commit summaries with --missing and keeps entries unique", () => {
    const repo = initRepo();

    const firstSha = commit(
      repo,
      `feat(loop): close S1

Why:
Close first subtask.
What:
- Add first change.
Impact:
- Moves task forward.
Risk:
- Low.
Test:
pnpm gate:fast
Prompt-Refs: BUILDER_v2`,
      { "s1.txt": "s1\n" },
      "2026-02-14T00:00:00Z"
    );

    const secondSha = commit(
      repo,
      `docs(memory): finalize S1

Why:
Finalize S1 memory.
What:
- Refresh memory docs.
Impact:
- Keep context up to date.
Risk:
- Low.
Test:
bash tools/git-memory/finalize-task.sh
Prompt-Refs: BUILDER_v2`,
      { "s1-memory.txt": "memory\n" },
      "2026-02-14T00:01:00Z"
    );

    const unstructuredSha = commit(
      repo,
      "wip quick note",
      { "note.txt": "note\n" },
      "2026-02-14T00:01:30Z"
    );

    const thirdSha = commit(
      repo,
      `feat(loop): close S2

Why:
Close second subtask.
What:
- Add second change.
Impact:
- Continue task delivery.
Risk:
- Medium.
Test:
pnpm gate:full
Prompt-Refs: BUILDER_v2`,
      { "s2.txt": "s2\n" },
      "2026-02-14T00:02:00Z"
    );

    expectSuccess(run("bash", [appendScript, "HEAD"], repo), "append latest only");
    expectSuccess(run("bash", [appendScript, "--missing", "HEAD"], repo), "backfill missing commits");
    const noMissing = run("bash", [appendScript, "--missing", "HEAD"], repo);
    expectSuccess(noMissing, "no-op missing backfill");
    expect(`${noMissing.stdout}\n${noMissing.stderr}`).toContain("No missing commits to append.");
    expect(`${noMissing.stdout}\n${noMissing.stderr}`).not.toContain("unbound variable");

    const log = readCommitLog(repo);
    const firstMatches = log.match(new RegExp(`\\\`${firstSha}\\\``, "g")) ?? [];
    const secondMatches = log.match(new RegExp(`\\\`${secondSha}\\\``, "g")) ?? [];
    const thirdMatches = log.match(new RegExp(`\\\`${thirdSha}\\\``, "g")) ?? [];
    const unstructuredMatches = log.match(new RegExp(`\\\`${unstructuredSha}\\\``, "g")) ?? [];

    expect(firstMatches).toHaveLength(1);
    expect(secondMatches).toHaveLength(1);
    expect(thirdMatches).toHaveLength(1);
    expect(unstructuredMatches).toHaveLength(0);
  });
});
