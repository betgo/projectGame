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
  "Fast gate command": "pnpm gate:fast",
  "Full gate command": "pnpm gate:full",
  "Docs sync command": "pnpm docs:sync-check",
  "Release loop command": "pnpm dev:loop -- --issue-id <id> --task-file <task.md>",
  "Delivery branch": "main",
  "Delivery rule": "1 Issue = 1 PR"
} as const;

function readBacktickedValue(prefix: string, content: string): string {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`${escaped}:\\s*\\\`([^\\\`]+)\\\``);
  const match = content.match(pattern);
  if (!match) {
    throw new Error(`missing documentation line: ${prefix}`);
  }
  return match[1];
}

function extractPnpmScript(command: string): string {
  const tokens = command.trim().split(/\s+/);
  if (tokens[0] !== "pnpm" || !tokens[1]) {
    throw new Error(`invalid pnpm command shape: ${command}`);
  }
  return tokens[1];
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
});
