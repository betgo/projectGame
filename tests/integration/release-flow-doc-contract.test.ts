import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

const DOC_PATHS = [
  "README.md",
  "docs/ai/README.md",
  "docs/ai/workflows/continuous-loop.md"
] as const;

const FLOW_CONTRACT = {
  "Build command": "pnpm build",
  "Run command": "pnpm dev",
  "Typecheck command": "pnpm typecheck",
  "Lint command": "pnpm lint",
  "Test command": "pnpm test",
  "Schema regression command": "pnpm test:schema",
  "Determinism regression command": "pnpm test:determinism",
  "AI smoke command": "pnpm test:smoke-ai-package",
  "Fast gate command": "pnpm gate:fast",
  "Full gate command": "pnpm gate:full",
  "Docs sync command": "pnpm docs:sync-check",
  "Release loop command": "pnpm dev:loop -- --issue-id <id> --task-file <task.md>",
  "Delivery branch": "main",
  "Delivery rule": "1 Issue = 1 PR"
} as const;

const RELEASE_HANDOFF_CHECKLIST = [
  "- Run fast gate: `pnpm gate:fast`",
  "- Run full gate: `pnpm gate:full`",
  "- Run docs sync check: `pnpm docs:sync-check`",
  "- If contract-level files change (`runtime/core`, `game/schemas`, `ai`), update `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same change.",
  "- Record gate evidence in task card under `docs/ai/tasks/`.",
  "- Refresh memory artifacts before handoff: `bash tools/git-memory/finalize-task.sh`"
] as const;

const RELEASE_HANDOFF_GATE_COMMANDS = ["pnpm gate:fast", "pnpm gate:full", "pnpm docs:sync-check"] as const;

function readBacktickedValue(prefix: string, content: string): string {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`${escaped}:\\s*\\\`([^\\\`]+)\\\``);
  const match = content.match(pattern);
  if (!match) {
    throw new Error(`missing documentation line: ${prefix}`);
  }
  return match[1];
}

function readSection(heading: string, content: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`## ${escaped}\\n\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = content.match(pattern);
  if (!match) {
    throw new Error(`missing section: ${heading}`);
  }
  return match[1].trim();
}

function extractPnpmScript(command: string): string {
  const tokens = command.trim().split(/\s+/);
  if (tokens[0] !== "pnpm" || !tokens[1]) {
    throw new Error(`invalid pnpm command shape: ${command}`);
  }
  return tokens[1];
}

function normalizeMarkdownLine(line: string): string {
  return line.trim().replace(/\s+/g, " ");
}

function readBashBlockUnderHeading(heading: string, content: string): string[] {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`## ${escaped}\\n\\n\\\`\\\`\\\`bash\\n([\\s\\S]*?)\\n\\\`\\\`\\\``);
  const match = content.match(pattern);
  if (!match) {
    throw new Error(`missing bash block under heading: ${heading}`);
  }

  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

describe("release flow docs contract", () => {
  it("keeps build/run/test/release contract aligned across README and docs/ai", () => {
    for (const docPath of DOC_PATHS) {
      const content = fs.readFileSync(path.join(projectRoot, docPath), "utf-8");
      for (const [label, expectedValue] of Object.entries(FLOW_CONTRACT)) {
        expect(readBacktickedValue(label, content), `${docPath} -> ${label}`).toBe(expectedValue);
      }
    }
  });

  it("documents build/run/test/release commands that map to package scripts", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf-8")) as {
      scripts: Record<string, string>;
    };
    const commandLabels = [
      "Build command",
      "Run command",
      "Typecheck command",
      "Lint command",
      "Test command",
      "Schema regression command",
      "Determinism regression command",
      "AI smoke command",
      "Fast gate command",
      "Full gate command",
      "Docs sync command",
      "Release loop command"
    ] as const;

    for (const label of commandLabels) {
      const script = extractPnpmScript(FLOW_CONTRACT[label]);
      expect(pkg.scripts[script], `missing package script for ${label}: ${script}`).toBeTypeOf("string");
    }
  });

  it("keeps release handoff checklist aligned across README and docs/ai", () => {
    for (const docPath of DOC_PATHS) {
      const content = fs.readFileSync(path.join(projectRoot, docPath), "utf-8");
      const checklist = readSection("Release handoff checklist", content)
        .split("\n")
        .map(normalizeMarkdownLine)
        .filter((line) => line.startsWith("- "));
      expect(checklist, `${docPath} -> Release handoff checklist`).toEqual([...RELEASE_HANDOFF_CHECKLIST]);
    }
  });

  it("references executable release handoff commands", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf-8")) as {
      scripts: Record<string, string>;
    };

    for (const command of RELEASE_HANDOFF_GATE_COMMANDS) {
      const script = extractPnpmScript(command);
      expect(pkg.scripts[script], `missing package script for handoff command: ${script}`).toBeTypeOf("string");
    }

    expect(fs.existsSync(path.join(projectRoot, "tools/git-memory/finalize-task.sh"))).toBe(true);
  });

  it("keeps README core scripts list aligned with documented release-flow commands", () => {
    const readme = fs.readFileSync(path.join(projectRoot, "README.md"), "utf-8");
    const coreScripts = readBashBlockUnderHeading("Core scripts", readme);
    const documentedCommands = Object.values(FLOW_CONTRACT).filter((value) => value.startsWith("pnpm "));

    for (const command of documentedCommands) {
      expect(coreScripts).toContain(command);
    }
  });
});
